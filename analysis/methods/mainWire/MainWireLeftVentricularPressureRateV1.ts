export const MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID =
  "main-wire-left-ventricular-absolute-pressure-central-secant-piecewise-linear-v1" as const;

export type MainWireLeftVentricularAbsolutePressureSampleV1 = Readonly<{
  actualTimeSec: number;
  absoluteLeftVentricularPressureMmHg: number;
}>;

export type MainWireLeftVentricularPressureRateInputV1 = Readonly<{
  samples: readonly MainWireLeftVentricularAbsolutePressureSampleV1[];
  /** Full time separation between the two central-secant endpoints. */
  windowSec: number;
}>;

export type MainWireLeftVentricularPressureRateExtremumV1 = Readonly<{
  centerActualTimeSec: number;
  pressureRateMmHgPerSec: number;
  earlierEndpoint: MainWireLeftVentricularAbsolutePressureSampleV1;
  laterEndpoint: MainWireLeftVentricularAbsolutePressureSampleV1;
}>;

export type MainWireLeftVentricularPositivePressureRateExtremumV1 =
  | Readonly<{
      status: "available";
      extremum: MainWireLeftVentricularPressureRateExtremumV1;
    }>
  | Readonly<{
      status: "unavailable";
      reason: "no-strictly-positive-central-secant";
    }>;

export type MainWireLeftVentricularNegativePressureRateExtremumV1 =
  | Readonly<{
      status: "available";
      extremum: MainWireLeftVentricularPressureRateExtremumV1;
    }>
  | Readonly<{
      status: "unavailable";
      reason: "no-strictly-negative-central-secant";
    }>;

export type MainWireLeftVentricularPressureRateResultV1 = Readonly<{
  methodId: typeof MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID;
  /** Distinguishes otherwise identical method executions at different windows. */
  configurationIdentity: string;
  windowSec: number;
  pressureBasis: "absolute-left-ventricular";
  timeBasis: "actual";
  interpolation: "piecewise-linear";
  estimator: "centered-secant-over-full-window";
  candidatePolicy:
    "evaluable-domain-boundaries-and-piecewise-linear-knots-shifted-by-plus-or-minus-half-window";
  evaluableCenterActualTimeRangeSec: readonly [number, number];
  candidateCount: number;
  availability:
    | "both-signs"
    | "positive-only"
    | "negative-only"
    | "neither-sign";
  positiveExtremum: MainWireLeftVentricularPositivePressureRateExtremumV1;
  negativeExtremum: MainWireLeftVentricularNegativePressureRateExtremumV1;
}>;

/**
 * A stable, explicit identity for a configured differentiation window.
 * JavaScript's finite-number string representation is the shortest
 * round-trippable representation, so distinct Number windows remain distinct.
 */
export function mainWireLeftVentricularPressureRateConfigurationIdentityV1(
  windowSec: number,
): string {
  validateWindowSecV1(windowSec);
  return `${MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID};windowSec=${String(windowSec)}`;
}

/**
 * Estimates signed LV dP/dt extrema from actual-time absolute-pressure samples.
 *
 * The samples define a continuous piecewise-linear pressure law. For a full
 * window width w, the rate at center t is [P(t + w/2) - P(t - w/2)] / w.
 * That rate is itself piecewise linear. Its complete extremum candidate set is
 * therefore the evaluable domain boundaries plus every source knot shifted by
 * either +w/2 or -w/2. No pressure basis substitution, extrapolation, zero
 * clamp, or missing-sign fabrication is performed.
 */
export function evaluateMainWireLeftVentricularPressureRateV1(
  input: MainWireLeftVentricularPressureRateInputV1,
): MainWireLeftVentricularPressureRateResultV1 {
  validateInputV1(input);
  const samples = input.samples;
  const firstActualTimeSec = samples[0]!.actualTimeSec;
  const lastActualTimeSec = samples.at(-1)!.actualTimeSec;
  const halfWindowSec = input.windowSec / 2;
  let firstCenterActualTimeSec = firstActualTimeSec + halfWindowSec;
  let lastCenterActualTimeSec = lastActualTimeSec - halfWindowSec;
  if (
    lastCenterActualTimeSec < firstCenterActualTimeSec &&
    nearlyEqualTimeV1(lastCenterActualTimeSec, firstCenterActualTimeSec)
  ) {
    const commonCenterActualTimeSec =
      (firstCenterActualTimeSec + lastCenterActualTimeSec) / 2;
    firstCenterActualTimeSec = commonCenterActualTimeSec;
    lastCenterActualTimeSec = commonCenterActualTimeSec;
  }
  if (
    !Number.isFinite(firstCenterActualTimeSec) ||
    !Number.isFinite(lastCenterActualTimeSec) ||
    lastCenterActualTimeSec < firstCenterActualTimeSec
  ) {
    throw new Error(
      "LV pressure-rate central-secant center range is not representable",
    );
  }

  const candidateCenterActualTimesSec = completeCandidateCentersV1({
    samples,
    halfWindowSec,
    firstCenterActualTimeSec,
    lastCenterActualTimeSec,
  });
  let maximumPositive: MainWireLeftVentricularPressureRateExtremumV1 | null =
    null;
  let minimumNegative: MainWireLeftVentricularPressureRateExtremumV1 | null =
    null;
  for (const centerActualTimeSec of candidateCenterActualTimesSec) {
    const earlierActualTimeSec = centerActualTimeSec - halfWindowSec;
    const laterActualTimeSec = centerActualTimeSec + halfWindowSec;
    if (!(laterActualTimeSec > earlierActualTimeSec)) {
      throw new Error(
        "LV pressure-rate central-secant window is not representable at the supplied actual times",
      );
    }
    const earlierPressureMmHg = interpolateAbsolutePressureV1(
      samples,
      earlierActualTimeSec,
    );
    const laterPressureMmHg = interpolateAbsolutePressureV1(
      samples,
      laterActualTimeSec,
    );
    const pressureRateMmHgPerSec =
      (laterPressureMmHg - earlierPressureMmHg) / input.windowSec;
    if (!Number.isFinite(pressureRateMmHgPerSec)) {
      throw new Error("LV pressure-rate central secant is not finite");
    }
    const extremum = freezeExtremumV1({
      centerActualTimeSec,
      pressureRateMmHgPerSec,
      earlierActualTimeSec,
      earlierPressureMmHg,
      laterActualTimeSec,
      laterPressureMmHg,
    });
    if (
      pressureRateMmHgPerSec > 0 &&
      (maximumPositive === null ||
        pressureRateMmHgPerSec > maximumPositive.pressureRateMmHgPerSec)
    ) {
      maximumPositive = extremum;
    }
    if (
      pressureRateMmHgPerSec < 0 &&
      (minimumNegative === null ||
        pressureRateMmHgPerSec < minimumNegative.pressureRateMmHgPerSec)
    ) {
      minimumNegative = extremum;
    }
  }

  const positiveExtremum: MainWireLeftVentricularPositivePressureRateExtremumV1 =
    maximumPositive === null
      ? Object.freeze({
          status: "unavailable" as const,
          reason: "no-strictly-positive-central-secant" as const,
        })
      : Object.freeze({
          status: "available" as const,
          extremum: maximumPositive,
        });
  const negativeExtremum: MainWireLeftVentricularNegativePressureRateExtremumV1 =
    minimumNegative === null
      ? Object.freeze({
          status: "unavailable" as const,
          reason: "no-strictly-negative-central-secant" as const,
        })
      : Object.freeze({
          status: "available" as const,
          extremum: minimumNegative,
        });
  const availability =
    maximumPositive !== null && minimumNegative !== null
      ? ("both-signs" as const)
      : maximumPositive !== null
        ? ("positive-only" as const)
        : minimumNegative !== null
          ? ("negative-only" as const)
          : ("neither-sign" as const);

  return Object.freeze({
    methodId: MAIN_WIRE_LEFT_VENTRICULAR_PRESSURE_RATE_METHOD_V1_ID,
    configurationIdentity:
      mainWireLeftVentricularPressureRateConfigurationIdentityV1(
        input.windowSec,
      ),
    windowSec: input.windowSec,
    pressureBasis: "absolute-left-ventricular" as const,
    timeBasis: "actual" as const,
    interpolation: "piecewise-linear" as const,
    estimator: "centered-secant-over-full-window" as const,
    candidatePolicy:
      "evaluable-domain-boundaries-and-piecewise-linear-knots-shifted-by-plus-or-minus-half-window" as const,
    evaluableCenterActualTimeRangeSec: Object.freeze([
      firstCenterActualTimeSec,
      lastCenterActualTimeSec,
    ] as const),
    candidateCount: candidateCenterActualTimesSec.length,
    availability,
    positiveExtremum,
    negativeExtremum,
  });
}

function validateInputV1(
  input: MainWireLeftVentricularPressureRateInputV1,
): void {
  if (input === null || typeof input !== "object") {
    throw new Error("LV pressure-rate input must be an object");
  }
  validateWindowSecV1(input.windowSec);
  if (!Array.isArray(input.samples) || input.samples.length < 2) {
    throw new Error("LV pressure-rate input requires at least two samples");
  }
  let previousActualTimeSec = Number.NEGATIVE_INFINITY;
  for (const sample of input.samples) {
    if (sample === null || typeof sample !== "object") {
      throw new Error("LV pressure-rate samples must be objects");
    }
    if (
      !Number.isFinite(sample.actualTimeSec) ||
      !Number.isFinite(sample.absoluteLeftVentricularPressureMmHg)
    ) {
      throw new Error(
        "LV pressure-rate actual times and absolute LV pressures must be finite",
      );
    }
    if (!(sample.actualTimeSec > previousActualTimeSec)) {
      throw new Error(
        "LV pressure-rate sample actual times must be strictly increasing",
      );
    }
    previousActualTimeSec = sample.actualTimeSec;
  }
  const sampleSpanSec =
    input.samples.at(-1)!.actualTimeSec - input.samples[0]!.actualTimeSec;
  if (
    sampleSpanSec < input.windowSec &&
    !nearlyEqualTimeV1(sampleSpanSec, input.windowSec)
  ) {
    throw new Error(
      "LV pressure-rate samples must span at least one complete windowSec",
    );
  }
}

function validateWindowSecV1(windowSec: number): void {
  if (!Number.isFinite(windowSec) || !(windowSec > 0)) {
    throw new Error("LV pressure-rate windowSec must be positive and finite");
  }
}

function completeCandidateCentersV1(input: Readonly<{
  samples: readonly MainWireLeftVentricularAbsolutePressureSampleV1[];
  halfWindowSec: number;
  firstCenterActualTimeSec: number;
  lastCenterActualTimeSec: number;
}>): readonly number[] {
  const candidates = [
    input.firstCenterActualTimeSec,
    input.lastCenterActualTimeSec,
  ];
  for (const sample of input.samples) {
    addCandidateIfEvaluableV1(
      candidates,
      sample.actualTimeSec - input.halfWindowSec,
      input.firstCenterActualTimeSec,
      input.lastCenterActualTimeSec,
    );
    addCandidateIfEvaluableV1(
      candidates,
      sample.actualTimeSec + input.halfWindowSec,
      input.firstCenterActualTimeSec,
      input.lastCenterActualTimeSec,
    );
  }
  candidates.sort((left, right) => left - right);
  const unique: number[] = [];
  for (const candidate of candidates) {
    const previous = unique.at(-1);
    if (previous === undefined || !nearlyEqualTimeV1(previous, candidate)) {
      unique.push(candidate);
    }
  }
  return Object.freeze(unique);
}

function addCandidateIfEvaluableV1(
  candidates: number[],
  candidate: number,
  firstCenterActualTimeSec: number,
  lastCenterActualTimeSec: number,
): void {
  if (!Number.isFinite(candidate)) return;
  if (
    candidate < firstCenterActualTimeSec &&
    !nearlyEqualTimeV1(candidate, firstCenterActualTimeSec)
  ) {
    return;
  }
  if (
    candidate > lastCenterActualTimeSec &&
    !nearlyEqualTimeV1(candidate, lastCenterActualTimeSec)
  ) {
    return;
  }
  candidates.push(
    nearlyEqualTimeV1(candidate, firstCenterActualTimeSec)
      ? firstCenterActualTimeSec
      : nearlyEqualTimeV1(candidate, lastCenterActualTimeSec)
        ? lastCenterActualTimeSec
        : candidate,
  );
}

function interpolateAbsolutePressureV1(
  samples: readonly MainWireLeftVentricularAbsolutePressureSampleV1[],
  requestedActualTimeSec: number,
): number {
  const first = samples[0]!;
  const last = samples.at(-1)!;
  if (
    requestedActualTimeSec < first.actualTimeSec &&
    !nearlyEqualTimeV1(requestedActualTimeSec, first.actualTimeSec)
  ) {
    throw new Error("LV pressure-rate interpolation would extrapolate earlier");
  }
  if (
    requestedActualTimeSec > last.actualTimeSec &&
    !nearlyEqualTimeV1(requestedActualTimeSec, last.actualTimeSec)
  ) {
    throw new Error("LV pressure-rate interpolation would extrapolate later");
  }
  if (
    requestedActualTimeSec <= first.actualTimeSec ||
    nearlyEqualTimeV1(requestedActualTimeSec, first.actualTimeSec)
  ) {
    return first.absoluteLeftVentricularPressureMmHg;
  }
  if (
    requestedActualTimeSec >= last.actualTimeSec ||
    nearlyEqualTimeV1(requestedActualTimeSec, last.actualTimeSec)
  ) {
    return last.absoluteLeftVentricularPressureMmHg;
  }

  let leftIndex = 0;
  let rightIndex = samples.length - 1;
  while (rightIndex - leftIndex > 1) {
    const middleIndex = Math.floor((leftIndex + rightIndex) / 2);
    if (samples[middleIndex]!.actualTimeSec <= requestedActualTimeSec) {
      leftIndex = middleIndex;
    } else {
      rightIndex = middleIndex;
    }
  }
  const left = samples[leftIndex]!;
  const right = samples[rightIndex]!;
  if (nearlyEqualTimeV1(requestedActualTimeSec, left.actualTimeSec)) {
    return left.absoluteLeftVentricularPressureMmHg;
  }
  if (nearlyEqualTimeV1(requestedActualTimeSec, right.actualTimeSec)) {
    return right.absoluteLeftVentricularPressureMmHg;
  }
  const fraction =
    (requestedActualTimeSec - left.actualTimeSec) /
    (right.actualTimeSec - left.actualTimeSec);
  return (
    left.absoluteLeftVentricularPressureMmHg +
    fraction *
      (right.absoluteLeftVentricularPressureMmHg -
        left.absoluteLeftVentricularPressureMmHg)
  );
}

function freezeExtremumV1(input: Readonly<{
  centerActualTimeSec: number;
  pressureRateMmHgPerSec: number;
  earlierActualTimeSec: number;
  earlierPressureMmHg: number;
  laterActualTimeSec: number;
  laterPressureMmHg: number;
}>): MainWireLeftVentricularPressureRateExtremumV1 {
  return Object.freeze({
    centerActualTimeSec: input.centerActualTimeSec,
    pressureRateMmHgPerSec: input.pressureRateMmHgPerSec,
    earlierEndpoint: Object.freeze({
      actualTimeSec: input.earlierActualTimeSec,
      absoluteLeftVentricularPressureMmHg: input.earlierPressureMmHg,
    }),
    laterEndpoint: Object.freeze({
      actualTimeSec: input.laterActualTimeSec,
      absoluteLeftVentricularPressureMmHg: input.laterPressureMmHg,
    }),
  });
}

function nearlyEqualTimeV1(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= 32 * Number.EPSILON * scale;
}
