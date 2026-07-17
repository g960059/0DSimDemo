/**
 * Event-owned LA reservoir/conduit branch-order diagnostic.
 *
 * The caller owns the physiological event segmentation (normally MVC -> MVO
 * for reservoir and MVO -> atrial activation onset for conduit). This module
 * does not infer phase from PV-loop shape and does not impose a morphology
 * acceptance threshold. It only compares the two measured paths at equal
 * blood volume.
 */

export const LA_PV_RESERVOIR_CONDUIT_ORDER_V1_ID =
  "la-pv-reservoir-conduit-equal-volume-order-v1" as const;

export type LaPvBranchPointV1 = Readonly<{
  laVolumeMl: number;
  laPressureMmHg: number;
}>;

export type LaPvReservoirConduitOrderInputV1 = Readonly<{
  reservoir: readonly LaPvBranchPointV1[];
  conduit: readonly LaPvBranchPointV1[];
  /** Interior equal-volume probes. End points are deliberately excluded. */
  probeCount?: number;
}>;

export type LaPvEqualVolumeOrderProbeV1 = Readonly<{
  laVolumeMl: number;
  reservoirPressureMmHg: number | null;
  conduitPressureMmHg: number | null;
  reservoirIntersectionCount: number;
  conduitIntersectionCount: number;
  reservoirMinusConduitPressureMmHg: number | null;
  usable: boolean;
}>;

export type LaPvReservoirConduitOrderV1 = Readonly<{
  diagnosticId: typeof LA_PV_RESERVOIR_CONDUIT_ORDER_V1_ID;
  status: "measurable" | "not-measurable";
  reason:
    | "measurable"
    | "invalid-input"
    | "insufficient-points"
    | "no-common-volume-support"
    | "no-single-valued-common-volume-probes";
  overlapMinimumVolumeMl: number | null;
  overlapMaximumVolumeMl: number | null;
  overlapWidthMl: number;
  requestedProbeCount: number;
  usableProbeCount: number;
  ambiguousProbeCount: number;
  unusableProbeCount: number;
  usableFraction01: number;
  reservoirAboveConduitFraction01: number | null;
  reservoirMinusConduitMeanMmHg: number | null;
  reservoirMinusConduitMedianMmHg: number | null;
  reservoirMinusConduitMinimumMmHg: number | null;
  reservoirMinusConduitMaximumMmHg: number | null;
  probes: readonly LaPvEqualVolumeOrderProbeV1[];
  segmentationOwner:
    "caller-supplied-physiological-events-not-pv-shape-inference";
  acceptanceThresholdApplied: false;
}>;

const DEFAULT_PROBE_COUNT = 101;
const MAXIMUM_PROBE_COUNT = 10_001;
const VOLUME_EPSILON_SCALE = 64 * Number.EPSILON;

export function measureLaPvReservoirConduitOrderV1(
  input: LaPvReservoirConduitOrderInputV1,
): LaPvReservoirConduitOrderV1 {
  const probeCount = input.probeCount ?? DEFAULT_PROBE_COUNT;
  if (!Number.isInteger(probeCount) || probeCount < 3 ||
      probeCount > MAXIMUM_PROBE_COUNT ||
      !validBranch(input.reservoir) || !validBranch(input.conduit)) {
    return failed("invalid-input", probeCount);
  }
  const reservoir = compactBranch(input.reservoir);
  const conduit = compactBranch(input.conduit);
  if (reservoir.length < 2 || conduit.length < 2) {
    return failed("insufficient-points", probeCount);
  }
  const reservoirRange = volumeRange(reservoir);
  const conduitRange = volumeRange(conduit);
  const overlapMinimumVolumeMl = Math.max(
    reservoirRange.minimum,
    conduitRange.minimum,
  );
  const overlapMaximumVolumeMl = Math.min(
    reservoirRange.maximum,
    conduitRange.maximum,
  );
  const overlapWidthMl = overlapMaximumVolumeMl - overlapMinimumVolumeMl;
  const volumeScale = Math.max(
    Math.abs(overlapMinimumVolumeMl),
    Math.abs(overlapMaximumVolumeMl),
    reservoirRange.width,
    conduitRange.width,
    1,
  );
  if (!(overlapWidthMl > VOLUME_EPSILON_SCALE * volumeScale)) {
    return failed("no-common-volume-support", probeCount, {
      overlapMinimumVolumeMl,
      overlapMaximumVolumeMl,
      overlapWidthMl: Math.max(0, overlapWidthMl),
    });
  }

  const probes = Array.from({ length: probeCount }, (_, index) => {
    const fraction = (index + 1) / (probeCount + 1);
    const volume = overlapMinimumVolumeMl + fraction * overlapWidthMl;
    const reservoirPressures = pressuresAtVolume(reservoir, volume, volumeScale);
    const conduitPressures = pressuresAtVolume(conduit, volume, volumeScale);
    const usable = reservoirPressures.length === 1 && conduitPressures.length === 1;
    const reservoirPressureMmHg = usable ? reservoirPressures[0]! : null;
    const conduitPressureMmHg = usable ? conduitPressures[0]! : null;
    return Object.freeze({
      laVolumeMl: volume,
      reservoirPressureMmHg,
      conduitPressureMmHg,
      reservoirIntersectionCount: reservoirPressures.length,
      conduitIntersectionCount: conduitPressures.length,
      reservoirMinusConduitPressureMmHg: usable
        ? reservoirPressureMmHg! - conduitPressureMmHg!
        : null,
      usable,
    });
  });
  const usable = probes.filter((probe) => probe.usable);
  const ambiguousProbeCount = probes.filter((probe) =>
    probe.reservoirIntersectionCount > 1 || probe.conduitIntersectionCount > 1
  ).length;
  const unusableProbeCount = probes.length - usable.length;
  if (usable.length === 0) {
    return failed("no-single-valued-common-volume-probes", probeCount, {
      overlapMinimumVolumeMl,
      overlapMaximumVolumeMl,
      overlapWidthMl,
      probes,
      ambiguousProbeCount,
      unusableProbeCount,
    });
  }
  const deltas = usable.map((probe) =>
    probe.reservoirMinusConduitPressureMmHg!);
  const sortedDeltas = [...deltas].sort((a, b) => a - b);
  return Object.freeze({
    diagnosticId: LA_PV_RESERVOIR_CONDUIT_ORDER_V1_ID,
    status: "measurable" as const,
    reason: "measurable" as const,
    overlapMinimumVolumeMl,
    overlapMaximumVolumeMl,
    overlapWidthMl,
    requestedProbeCount: probeCount,
    usableProbeCount: usable.length,
    ambiguousProbeCount,
    unusableProbeCount,
    usableFraction01: usable.length / probeCount,
    reservoirAboveConduitFraction01:
      deltas.filter((value) => value > 0).length / deltas.length,
    reservoirMinusConduitMeanMmHg:
      deltas.reduce((sum, value) => sum + value, 0) / deltas.length,
    reservoirMinusConduitMedianMmHg: median(sortedDeltas),
    reservoirMinusConduitMinimumMmHg: sortedDeltas[0]!,
    reservoirMinusConduitMaximumMmHg: sortedDeltas.at(-1)!,
    probes: Object.freeze(probes),
    segmentationOwner:
      "caller-supplied-physiological-events-not-pv-shape-inference" as const,
    acceptanceThresholdApplied: false as const,
  });
}

function pressuresAtVolume(
  branch: readonly LaPvBranchPointV1[],
  volumeMl: number,
  volumeScale: number,
): readonly number[] {
  const epsilon = VOLUME_EPSILON_SCALE * volumeScale;
  const hits: number[] = [];
  for (let index = 0; index < branch.length - 1; index += 1) {
    const a = branch[index]!;
    const b = branch[index + 1]!;
    const deltaVolume = b.laVolumeMl - a.laVolumeMl;
    if (Math.abs(deltaVolume) <= epsilon) {
      if (Math.abs(volumeMl - a.laVolumeMl) <= epsilon) {
        hits.push(a.laPressureMmHg, b.laPressureMmHg);
      }
      continue;
    }
    const alpha = (volumeMl - a.laVolumeMl) / deltaVolume;
    if (alpha < -epsilon || alpha > 1 + epsilon) continue;
    hits.push(a.laPressureMmHg + alpha *
      (b.laPressureMmHg - a.laPressureMmHg));
  }
  return uniquePressures(hits);
}

function uniquePressures(values: readonly number[]): readonly number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const scale = Math.max(1, ...sorted.map(Math.abs));
  const epsilon = VOLUME_EPSILON_SCALE * scale;
  return Object.freeze(sorted.filter((value, index) =>
    index === 0 || Math.abs(value - sorted[index - 1]!) > epsilon));
}

function compactBranch(
  branch: readonly LaPvBranchPointV1[],
): readonly LaPvBranchPointV1[] {
  const compact: LaPvBranchPointV1[] = [];
  for (const point of branch) {
    const previous = compact.at(-1);
    if (previous && previous.laVolumeMl === point.laVolumeMl &&
        previous.laPressureMmHg === point.laPressureMmHg) continue;
    compact.push(Object.freeze({ ...point }));
  }
  return Object.freeze(compact);
}

function validBranch(branch: readonly LaPvBranchPointV1[]): boolean {
  return Array.isArray(branch) && branch.every((point) =>
    point !== null && typeof point === "object" &&
    Number.isFinite(point.laVolumeMl) &&
    Number.isFinite(point.laPressureMmHg));
}

function volumeRange(branch: readonly LaPvBranchPointV1[]): Readonly<{
  minimum: number;
  maximum: number;
  width: number;
}> {
  const volumes = branch.map((point) => point.laVolumeMl);
  const minimum = Math.min(...volumes);
  const maximum = Math.max(...volumes);
  return Object.freeze({ minimum, maximum, width: maximum - minimum });
}

function median(sorted: readonly number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : 0.5 * (sorted[middle - 1]! + sorted[middle]!);
}

function failed(
  reason: Exclude<LaPvReservoirConduitOrderV1["reason"], "measurable">,
  requestedProbeCount: number,
  partial: Partial<LaPvReservoirConduitOrderV1> = {},
): LaPvReservoirConduitOrderV1 {
  const probes = partial.probes ?? Object.freeze([]);
  const usableProbeCount = partial.usableProbeCount ?? 0;
  const ambiguousProbeCount = partial.ambiguousProbeCount ?? 0;
  const unusableProbeCount = partial.unusableProbeCount ?? probes.length;
  return Object.freeze({
    diagnosticId: LA_PV_RESERVOIR_CONDUIT_ORDER_V1_ID,
    status: "not-measurable" as const,
    reason,
    overlapMinimumVolumeMl: partial.overlapMinimumVolumeMl ?? null,
    overlapMaximumVolumeMl: partial.overlapMaximumVolumeMl ?? null,
    overlapWidthMl: partial.overlapWidthMl ?? 0,
    requestedProbeCount,
    usableProbeCount,
    ambiguousProbeCount,
    unusableProbeCount,
    usableFraction01: requestedProbeCount > 0
      ? usableProbeCount / requestedProbeCount
      : 0,
    reservoirAboveConduitFraction01: null,
    reservoirMinusConduitMeanMmHg: null,
    reservoirMinusConduitMedianMmHg: null,
    reservoirMinusConduitMinimumMmHg: null,
    reservoirMinusConduitMaximumMmHg: null,
    probes,
    segmentationOwner:
      "caller-supplied-physiological-events-not-pv-shape-inference" as const,
    acceptanceThresholdApplied: false as const,
  });
}
