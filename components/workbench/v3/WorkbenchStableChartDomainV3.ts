export type WorkbenchNumericDomainV3 = readonly [number, number];

export type WorkbenchStableNumericDomainStateV3 = Readonly<{
  domain: WorkbenchNumericDomainV3;
  lastCommitKey: string | null;
  contractionCommitCount: number;
}>;

export type WorkbenchNumericDomainOptionsV3 = Readonly<{
  includeZero?: boolean;
  paddingFraction?: number;
  lowerPaddingFraction?: number;
  upperPaddingFraction?: number;
  minimumLowerPadding?: number;
  minimumUpperPadding?: number;
  /** Snaps a nearby non-negative lower extent to zero without flattening AoP. */
  softZeroFloor?: boolean;
  softZeroSpanFraction?: number;
  targetTickCount?: number;
}>;

export function observedNumericExtentV3(
  values: readonly number[],
  options: Pick<
    WorkbenchNumericDomainOptionsV3,
    "includeZero" | "softZeroFloor" | "softZeroSpanFraction"
  > = {},
): WorkbenchNumericDomainV3 {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Object.freeze([0, 1]);
  let minimum = Math.min(...finite);
  let maximum = Math.max(...finite);
  const rawSpan = maximum - minimum;
  const softZeroSpanFraction = clampV3(
    options.softZeroSpanFraction ?? 0.25,
    0,
    1,
  );
  if (
    options.softZeroFloor === true
    && minimum >= 0
    && rawSpan > 1e-12
    && minimum <= rawSpan * softZeroSpanFraction
  ) {
    minimum = 0;
  }
  if (options.includeZero === true) {
    minimum = Math.min(0, minimum);
    maximum = Math.max(0, maximum);
  }
  if (maximum - minimum < 1e-12) {
    const halfSpan = Math.max(0.5, Math.abs(maximum) * 0.05);
    minimum -= halfSpan;
    maximum += halfSpan;
  }
  return Object.freeze([minimum, maximum]);
}

/**
 * Returns a 1–2–5 × 10^n interval. The same rule remains readable for CVP,
 * ventricular pressure, volume, and flow without unit-specific magic values.
 */
export function niceNumericStepV3(rawStep: number): number {
  if (!(rawStep > 0) || !Number.isFinite(rawStep)) return 1;
  const exponent = Math.floor(Math.log10(rawStep));
  const power = 10 ** exponent;
  const fraction = rawStep / power;
  const niceFraction = fraction < Math.sqrt(2)
    ? 1
    : fraction < Math.sqrt(10)
      ? 2
      : fraction < Math.sqrt(50)
        ? 5
        : 10;
  return niceFraction * power;
}

export function niceNumericDomainV3(
  values: readonly number[],
  options: WorkbenchNumericDomainOptionsV3 = {},
): WorkbenchNumericDomainV3 {
  const observed = observedNumericExtentV3(values, options);
  const paddingFraction = clampV3(options.paddingFraction ?? 0.08, 0, 0.5);
  const lowerPaddingFraction = clampV3(
    options.lowerPaddingFraction ?? paddingFraction,
    0,
    0.5,
  );
  const upperPaddingFraction = clampV3(
    options.upperPaddingFraction ?? paddingFraction,
    0,
    0.5,
  );
  const targetTickCount = Math.max(
    2,
    Math.min(8, Math.round(options.targetTickCount ?? 4)),
  );
  const observedSpan = observed[1] - observed[0];
  const lowerPadding = Math.max(
    observedSpan * lowerPaddingFraction,
    Math.max(0, options.minimumLowerPadding ?? 0),
  );
  const upperPadding = Math.max(
    observedSpan * upperPaddingFraction,
    Math.max(0, options.minimumUpperPadding ?? 0),
  );
  const zeroFloorIsActive = observed[0] === 0
    && (options.includeZero === true || options.softZeroFloor === true);
  const paddedMinimum = zeroFloorIsActive
    ? 0
    : observed[0] - lowerPadding;
  const paddedMaximum = options.includeZero === true && observed[1] === 0
    ? 0
    : observed[1] + upperPadding;
  const step = niceNumericStepV3(
    (paddedMaximum - paddedMinimum) / targetTickCount,
  );
  let minimum = Math.floor(paddedMinimum / step) * step;
  let maximum = Math.ceil(paddedMaximum / step) * step;
  if (options.includeZero === true) {
    minimum = Math.min(0, minimum);
    maximum = Math.max(0, maximum);
  }
  if (!(maximum > minimum)) maximum = minimum + step;
  return Object.freeze([
    normalizeRoundedNumberV3(minimum),
    normalizeRoundedNumberV3(maximum),
  ]);
}

export function numericTicksV3(
  domain: WorkbenchNumericDomainV3,
  targetIntervalCount = 4,
): readonly number[] {
  const span = domain[1] - domain[0];
  if (!(span > 0) || !Number.isFinite(span)) return Object.freeze([0, 1]);
  const step = niceNumericStepV3(
    span / Math.max(2, Math.min(8, Math.round(targetIntervalCount))),
  );
  const epsilon = step * 1e-9;
  const first = Math.ceil((domain[0] - epsilon) / step) * step;
  const ticks: number[] = [];
  for (
    let value = first;
    value <= domain[1] + epsilon && ticks.length < 24;
    value += step
  ) {
    ticks.push(normalizeRoundedNumberV3(value));
  }
  if (ticks.length >= 2) return Object.freeze(ticks);
  return Object.freeze([domain[0], domain[1]]);
}

/**
 * A semantic-event domain controller. Expansion occurs only at the next nice
 * boundary needed to avoid clipping. Contraction requires several committed
 * observations, so partial beats can never make the axes breathe.
 */
export function nextStableNumericDomainStateV3(
  previous: WorkbenchStableNumericDomainStateV3 | null,
  values: readonly number[],
  options: WorkbenchNumericDomainOptionsV3 & Readonly<{
    commitKey: string | null;
    contractionCommitThreshold?: number;
    contractionSpanRatio?: number;
    contractionInsetFraction?: number;
  }>,
): WorkbenchStableNumericDomainStateV3 {
  const candidate = niceNumericDomainV3(values, options);
  const observed = observedNumericExtentV3(values, options);
  if (
    previous === null
    || !Number.isFinite(previous.domain[0])
    || !Number.isFinite(previous.domain[1])
    || !(previous.domain[1] > previous.domain[0])
  ) {
    return freezeStateV3(candidate, options.commitKey, 0);
  }

  const epsilon = Math.max(1e-9, (previous.domain[1] - previous.domain[0]) * 1e-9);
  const clipsLower = candidate[0] < previous.domain[0] - epsilon;
  const clipsUpper = candidate[1] > previous.domain[1] + epsilon;
  if (clipsLower || clipsUpper) {
    return freezeStateV3(
      Object.freeze([
        Math.min(previous.domain[0], candidate[0]),
        Math.max(previous.domain[1], candidate[1]),
      ]),
      options.commitKey,
      0,
    );
  }

  const isNewCommit = options.commitKey !== null
    && options.commitKey !== previous.lastCommitKey;
  if (!isNewCommit) return previous;

  if (domainsEqualV3(previous.domain, candidate)) {
    return freezeStateV3(previous.domain, options.commitKey, 0);
  }
  const previousSpan = previous.domain[1] - previous.domain[0];
  const candidateSpan = candidate[1] - candidate[0];
  const spanRatio = clampV3(options.contractionSpanRatio ?? 0.65, 0.1, 0.95);
  const insetFraction = clampV3(
    options.contractionInsetFraction ?? 0.12,
    0,
    0.4,
  );
  const inset = previousSpan * insetFraction;
  const safelyInset = observed[0] >= previous.domain[0] + inset
    && observed[1] <= previous.domain[1] - inset;
  const canContract = candidateSpan <= previousSpan * spanRatio && safelyInset;
  const contractionCommitCount = canContract
    ? previous.contractionCommitCount + 1
    : 0;
  const threshold = Math.max(
    1,
    Math.round(options.contractionCommitThreshold ?? 6),
  );
  return contractionCommitCount >= threshold
    ? freezeStateV3(candidate, options.commitKey, 0)
    : freezeStateV3(
        previous.domain,
        options.commitKey,
        contractionCommitCount,
      );
}

function freezeStateV3(
  domain: WorkbenchNumericDomainV3,
  lastCommitKey: string | null,
  contractionCommitCount: number,
): WorkbenchStableNumericDomainStateV3 {
  return Object.freeze({ domain, lastCommitKey, contractionCommitCount });
}

function domainsEqualV3(
  left: WorkbenchNumericDomainV3,
  right: WorkbenchNumericDomainV3,
): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function normalizeRoundedNumberV3(value: number): number {
  const rounded = Number.parseFloat(value.toPrecision(12));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clampV3(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}
