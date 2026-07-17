import {
  measureLaPvReservoirConduitOrderV1,
} from "@/engine/mechanics2/diagnostics/LaPvReservoirConduitOrderV1";
import {
  measureLaPvTwoLobesV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireScientificSessionObservationV1,
} from "@/engine/scientific/runtime";
import {
  measureMainWireHealthyCycleMetricsV1,
} from "@/engine/scientific/validation/MainWireHealthyCycleAcceptanceV1";

export const MAIN_WIRE_RESTING_CYCLE_MORPHOLOGY_V1_ID =
  "main-wire-resting-cycle-morphology-v1" as const;

export type MainWireAtrialCycleMorphologyV1 = Readonly<{
  chamber: "LA" | "RA";
  avValve: "MV" | "TV";
  availability: "available" | "source-signal-unavailable" | "events-not-measurable";
  reason: string;
  eventEvidence: Readonly<{
    eventFlowThresholdMlPerSec: number | null;
    atrialCalciumOnsetPhase01: number;
    avValveOpening: MainWireCycleEventV1 | null;
    avValveClosure: MainWireCycleEventV1 | null;
    atrialCalciumOnset: MainWireCycleEventV1;
    eventOwnership:
      "AV-flow-threshold-transitions-plus-release-fixed-prescribed-Ca-onset";
  }>;
  pvTwoLobeTopology: MainWirePvTwoLobeTopologySummaryV1 | null;
  reservoirConduitOrder: MainWireReservoirConduitOrderSummaryV1 | null;
  avFlowMorphology: MainWireAvFlowMorphologyV1 | null;
  reviewFlags: readonly MainWireCycleMorphologyReviewFlagV1[];
}>;

export type MainWireCycleEventV1 = Readonly<{
  sampleIndex: number;
  acceptedTimeSec: number;
  phase01: number;
}>;

export type MainWirePvTwoLobeTopologySummaryV1 = Readonly<{
  status: "measurable" | "not-measurable";
  reason: string;
  selfIntersectionCount: number;
  rawSelfIntersectionCount: number;
  opposedLobeOrientation: boolean;
  crossingVolumesMl: readonly number[];
  crossingPressuresMmHg: readonly number[];
  aLobeAreaMmHgMl: number | null;
  vLobeAreaMmHgMl: number | null;
  vToALobeAreaRatio: number | null;
  selectionEvidenceSource: string | null;
  acceptanceThresholdApplied: false;
}>;

export type MainWireReservoirConduitOrderSummaryV1 = Readonly<{
  status: "measurable" | "not-measurable";
  reason: string;
  overlapWidthMl: number;
  usableProbeCount: number;
  ambiguousProbeCount: number;
  usableFraction01: number;
  reservoirAboveConduitFraction01: number | null;
  reservoirMinusConduitMeanMmHg: number | null;
  reservoirMinusConduitMinimumMmHg: number | null;
  reservoirMinusConduitMaximumMmHg: number | null;
  acceptanceThresholdApplied: false;
}>;

export type MainWireAvFlowMorphologyV1 = Readonly<{
  significantForwardPeakThresholdMlPerSec: number;
  significantForwardPeakCount: number;
  significantForwardPeaks: readonly Readonly<{
    sampleIndex: number;
    phase01: number;
    flowMlPerSec: number;
  }>[];
  conduitPeakMlPerSec: number;
  pumpingPeakMlPerSec: number;
  conduitToPumpingPeakRatio: number | null;
  interveningValleyMlPerSec: number | null;
  interveningValleyToLowerPeakRatio: number | null;
  peakCountAcceptanceThresholdApplied: false;
}>;

export type MainWireCycleMorphologyReviewFlagV1 =
  | "required-source-signal-unavailable"
  | "av-events-not-measurable"
  | "pv-two-lobe-topology-not-measurable"
  | "pv-multiple-self-intersections"
  | "pv-lobes-not-oppositely-oriented"
  | "reservoir-conduit-order-not-measurable"
  | "reservoir-conduit-low-single-valued-probe-coverage"
  | "more-than-two-significant-av-flow-peaks";

export type MainWireRestingCycleMorphologyV1 = Readonly<{
  morphologyId: typeof MAIN_WIRE_RESTING_CYCLE_MORPHOLOGY_V1_ID;
  schemaVersion: 1;
  la: MainWireAtrialCycleMorphologyV1;
  ra: MainWireAtrialCycleMorphologyV1;
  interpretationStatus: "review-needed" | "measured-no-acceptance-threshold";
  reviewFlags: readonly Readonly<{
    chamber: "LA" | "RA";
    flag: MainWireCycleMorphologyReviewFlagV1;
  }>[];
  claim: Readonly<{
    acceptedStepReadbackOnly: true;
    smoothingOrResamplingApplied: false;
    shapeFittingPerformed: false;
    prescribedCalciumOnsetIsProtocolTimingNotMeasuredActivation: true;
    morphologyAcceptanceThresholdEstablished: false;
    reviewFlagIsNotClinicalDiagnosis: true;
  }>;
}>;

export function measureMainWireRestingCycleMorphologyV1(
  observations: readonly MainWireScientificSessionObservationV1[],
): MainWireRestingCycleMorphologyV1 {
  measureMainWireHealthyCycleMetricsV1(observations);
  const atrialOnsetIndex = nearestCyclicPhaseIndex(
    observations,
    normalAtrialCalciumOnsetPhase01(),
  );
  const la = atrialMorphology(observations, atrialOnsetIndex, "LA", "MV");
  const ra = atrialMorphology(observations, atrialOnsetIndex, "RA", "TV");
  const reviewFlags = Object.freeze([
    ...la.reviewFlags.map((flag) => Object.freeze({ chamber: "LA" as const, flag })),
    ...ra.reviewFlags.map((flag) => Object.freeze({ chamber: "RA" as const, flag })),
  ]);
  return Object.freeze({
    morphologyId: MAIN_WIRE_RESTING_CYCLE_MORPHOLOGY_V1_ID,
    schemaVersion: 1 as const,
    la,
    ra,
    interpretationStatus: reviewFlags.length > 0
      ? "review-needed" as const
      : "measured-no-acceptance-threshold" as const,
    reviewFlags,
    claim: Object.freeze({
      acceptedStepReadbackOnly: true as const,
      smoothingOrResamplingApplied: false as const,
      shapeFittingPerformed: false as const,
      prescribedCalciumOnsetIsProtocolTimingNotMeasuredActivation: true as const,
      morphologyAcceptanceThresholdEstablished: false as const,
      reviewFlagIsNotClinicalDiagnosis: true as const,
    }),
  });
}

function atrialMorphology(
  observations: readonly MainWireScientificSessionObservationV1[],
  atrialOnsetIndex: number,
  chamber: "LA" | "RA",
  avValve: "MV" | "TV",
): MainWireAtrialCycleMorphologyV1 {
  const onset = cycleEvent(observations, atrialOnsetIndex);
  const signalAvailable = observations.every((sample) =>
    sample.chamber[chamber].pressureAvailability === "available"
    && sample.chamber[chamber].absolutePressureMmHg !== null
    && sample.valve[avValve].flowAvailability === "available"
    && sample.valve[avValve].flowMlPerSec !== null);
  if (!signalAvailable) {
    return unavailableAtrialMorphology(
      chamber,
      avValve,
      onset,
      "source-signal-unavailable",
      "required chamber pressure or AV flow is unavailable",
    );
  }
  const flows = observations.map((sample) => sample.valve[avValve].flowMlPerSec!);
  const events = detectAvEvents(flows, atrialOnsetIndex);
  if (events === null) {
    return unavailableAtrialMorphology(
      chamber,
      avValve,
      onset,
      "events-not-measurable",
      "required cyclic AV opening/closure transitions were not measurable",
      Math.max(1, 0.01 * maximum(flows)),
    );
  }

  const reservoirIndices = cyclicHalfOpenIndices(
    observations.length,
    events.closureIndex,
    events.openingIndex,
  );
  const conduitIndices = cyclicHalfOpenIndices(
    observations.length,
    events.openingIndex,
    atrialOnsetIndex,
  );
  const pumpingIndices = cyclicHalfOpenIndices(
    observations.length,
    atrialOnsetIndex,
    events.closureIndex,
  );
  const phaseByIndex = new Map<number, "reservoir" | "conduit" | "pumping">();
  markIndices(phaseByIndex, reservoirIndices, "reservoir");
  markIndices(phaseByIndex, conduitIndices, "conduit");
  markIndices(phaseByIndex, pumpingIndices, "pumping");
  const pvPoint = (index: number) => Object.freeze({
    laVolumeMl: observations[index]!.chamber[chamber].volumeMl,
    laPressureMmHg:
      observations[index]!.chamber[chamber].absolutePressureMmHg!,
  });
  const twoLobes = measureLaPvTwoLobesV2(observations.map((sample, index) =>
    Object.freeze({
      theta: cyclePhase01(sample.acceptedTimeSec),
      laVolumeMl: sample.chamber[chamber].volumeMl,
      laPressureMmHg: sample.chamber[chamber].absolutePressureMmHg!,
      phase: phaseByIndex.get(index) ?? "transition" as const,
    })));
  const branchOrder = measureLaPvReservoirConduitOrderV1({
    reservoir: cyclicSegmentInclusive(
      observations,
      events.closureIndex,
      events.openingIndex,
    ).map((_, offset) => pvPoint(
      cyclicIndex(events.closureIndex + offset, observations.length),
    )),
    conduit: cyclicSegmentInclusive(
      observations,
      events.openingIndex,
      atrialOnsetIndex,
    ).map((_, offset) => pvPoint(
      cyclicIndex(events.openingIndex + offset, observations.length),
    )),
  });
  const lobeSummary = compactLobes(twoLobes);
  const branchSummary = Object.freeze({
    status: branchOrder.status,
    reason: branchOrder.reason,
    overlapWidthMl: branchOrder.overlapWidthMl,
    usableProbeCount: branchOrder.usableProbeCount,
    ambiguousProbeCount: branchOrder.ambiguousProbeCount,
    usableFraction01: branchOrder.usableFraction01,
    reservoirAboveConduitFraction01:
      branchOrder.reservoirAboveConduitFraction01,
    reservoirMinusConduitMeanMmHg:
      branchOrder.reservoirMinusConduitMeanMmHg,
    reservoirMinusConduitMinimumMmHg:
      branchOrder.reservoirMinusConduitMinimumMmHg,
    reservoirMinusConduitMaximumMmHg:
      branchOrder.reservoirMinusConduitMaximumMmHg,
    acceptanceThresholdApplied: false as const,
  });
  const flowMorphology = measureAvFlowMorphology(
    observations,
    flows,
    events.openingIndex,
    events.closureIndex,
    conduitIndices,
    pumpingIndices,
  );
  const reviewFlags: MainWireCycleMorphologyReviewFlagV1[] = [];
  if (lobeSummary.status !== "measurable") {
    reviewFlags.push("pv-two-lobe-topology-not-measurable");
    if (lobeSummary.reason === "multiple-self-intersections") {
      reviewFlags.push("pv-multiple-self-intersections");
    }
  } else if (!lobeSummary.opposedLobeOrientation) {
    reviewFlags.push("pv-lobes-not-oppositely-oriented");
  }
  if (branchSummary.status !== "measurable") {
    reviewFlags.push("reservoir-conduit-order-not-measurable");
  } else if (branchSummary.usableFraction01 < 0.5) {
    reviewFlags.push("reservoir-conduit-low-single-valued-probe-coverage");
  }
  if (flowMorphology.significantForwardPeakCount > 2) {
    reviewFlags.push("more-than-two-significant-av-flow-peaks");
  }
  return Object.freeze({
    chamber,
    avValve,
    availability: "available" as const,
    reason: "measured" as const,
    eventEvidence: Object.freeze({
      eventFlowThresholdMlPerSec: events.thresholdMlPerSec,
      atrialCalciumOnsetPhase01: normalAtrialCalciumOnsetPhase01(),
      avValveOpening: cycleEvent(observations, events.openingIndex),
      avValveClosure: cycleEvent(observations, events.closureIndex),
      atrialCalciumOnset: onset,
      eventOwnership:
        "AV-flow-threshold-transitions-plus-release-fixed-prescribed-Ca-onset" as const,
    }),
    pvTwoLobeTopology: lobeSummary,
    reservoirConduitOrder: branchSummary,
    avFlowMorphology: flowMorphology,
    reviewFlags: Object.freeze(reviewFlags),
  });
}

function unavailableAtrialMorphology(
  chamber: "LA" | "RA",
  avValve: "MV" | "TV",
  onset: MainWireCycleEventV1,
  availability: "source-signal-unavailable" | "events-not-measurable",
  reason: string,
  threshold: number | null = null,
): MainWireAtrialCycleMorphologyV1 {
  return Object.freeze({
    chamber,
    avValve,
    availability,
    reason,
    eventEvidence: Object.freeze({
      eventFlowThresholdMlPerSec: threshold,
      atrialCalciumOnsetPhase01: normalAtrialCalciumOnsetPhase01(),
      avValveOpening: null,
      avValveClosure: null,
      atrialCalciumOnset: onset,
      eventOwnership:
        "AV-flow-threshold-transitions-plus-release-fixed-prescribed-Ca-onset" as const,
    }),
    pvTwoLobeTopology: null,
    reservoirConduitOrder: null,
    avFlowMorphology: null,
    reviewFlags: Object.freeze([
      availability === "source-signal-unavailable"
        ? "required-source-signal-unavailable" as const
        : "av-events-not-measurable" as const,
    ]),
  });
}

function compactLobes(
  measurement: ReturnType<typeof measureLaPvTwoLobesV2>,
): MainWirePvTwoLobeTopologySummaryV1 {
  const crossings = measurement.crossings;
  if (measurement.status === "not-measurable") {
    return Object.freeze({
      status: measurement.status,
      reason: measurement.reason,
      selfIntersectionCount: measurement.selfIntersectionCount,
      rawSelfIntersectionCount: measurement.rawSelfIntersectionCount,
      opposedLobeOrientation: false,
      crossingVolumesMl: Object.freeze(crossings.map(({ volumeMl }) => volumeMl)),
      crossingPressuresMmHg: Object.freeze(
        crossings.map(({ pressureMmHg }) => pressureMmHg),
      ),
      aLobeAreaMmHgMl: null,
      vLobeAreaMmHgMl: null,
      vToALobeAreaRatio: null,
      selectionEvidenceSource: null,
      acceptanceThresholdApplied: false as const,
    });
  }
  return Object.freeze({
    status: measurement.status,
    reason: measurement.reason,
    selfIntersectionCount: measurement.selfIntersectionCount,
    rawSelfIntersectionCount: measurement.rawSelfIntersectionCount,
    opposedLobeOrientation: measurement.opposedLobeOrientation,
    crossingVolumesMl: Object.freeze(crossings.map(({ volumeMl }) => volumeMl)),
    crossingPressuresMmHg: Object.freeze(
      crossings.map(({ pressureMmHg }) => pressureMmHg),
    ),
    aLobeAreaMmHgMl: measurement.aLobe.areaMmHgMl,
    vLobeAreaMmHgMl: measurement.vLobe.areaMmHgMl,
    vToALobeAreaRatio: measurement.aLobe.areaMmHgMl > 0
      ? measurement.vLobe.areaMmHgMl / measurement.aLobe.areaMmHgMl
      : null,
    selectionEvidenceSource: measurement.selectionEvidenceSource,
    acceptanceThresholdApplied: false as const,
  });
}

function measureAvFlowMorphology(
  observations: readonly MainWireScientificSessionObservationV1[],
  flows: readonly number[],
  openingIndex: number,
  closureIndex: number,
  conduitIndices: readonly number[],
  pumpingIndices: readonly number[],
): MainWireAvFlowMorphologyV1 {
  const significantThreshold = Math.max(5, 0.05 * maximum(flows));
  const openIndices = new Set(cyclicHalfOpenIndices(
    observations.length,
    openingIndex,
    closureIndex,
  ));
  const peaks = flows.flatMap((flow, index) => {
    const previous = flows[cyclicIndex(index - 1, flows.length)]!;
    const next = flows[cyclicIndex(index + 1, flows.length)]!;
    if (
      !openIndices.has(index)
      || flow < significantThreshold
      || flow < previous
      || flow < next
      || (flow === previous && flow === next)
    ) return [];
    return [Object.freeze({
      sampleIndex: index,
      phase01: cyclePhase01(observations[index]!.acceptedTimeSec),
      flowMlPerSec: flow,
    })];
  });
  const conduitPeak = maximum(conduitIndices.map((index) => flows[index]!));
  const pumpingPeak = maximum(pumpingIndices.map((index) => flows[index]!));
  const conduitPeakIndex = conduitIndices.reduce((best, index) =>
    flows[index]! > flows[best]! ? index : best, conduitIndices[0]!);
  const pumpingPeakIndex = pumpingIndices.reduce((best, index) =>
    flows[index]! > flows[best]! ? index : best, pumpingIndices[0]!);
  const between = cyclicHalfOpenIndices(
    flows.length,
    conduitPeakIndex,
    pumpingPeakIndex,
  ).slice(1);
  const valley = between.length === 0
    ? null
    : minimum(between.map((index) => flows[index]!));
  const lowerPeak = Math.min(conduitPeak, pumpingPeak);
  return Object.freeze({
    significantForwardPeakThresholdMlPerSec: significantThreshold,
    significantForwardPeakCount: peaks.length,
    significantForwardPeaks: Object.freeze(peaks),
    conduitPeakMlPerSec: conduitPeak,
    pumpingPeakMlPerSec: pumpingPeak,
    conduitToPumpingPeakRatio: pumpingPeak > 0
      ? conduitPeak / pumpingPeak
      : null,
    interveningValleyMlPerSec: valley,
    interveningValleyToLowerPeakRatio: valley !== null && lowerPeak > 0
      ? valley / lowerPeak
      : null,
    peakCountAcceptanceThresholdApplied: false as const,
  });
}

function detectAvEvents(
  flows: readonly number[],
  atrialOnsetIndex: number,
): Readonly<{
  thresholdMlPerSec: number;
  openingIndex: number;
  closureIndex: number;
}> | null {
  const thresholdMlPerSec = Math.max(1, 0.01 * maximum(flows));
  const open = flows.map((flow) => flow > thresholdMlPerSec);
  if (open.every(Boolean) || open.every((value) => !value)) return null;
  const openingIndex = cyclicOpeningAfterLongestClosedRun(open);
  if (openingIndex < 0) return null;
  let closureIndex = -1;
  let cursor = atrialOnsetIndex;
  for (let guard = 0; guard < open.length; guard += 1) {
    const previous = cyclicIndex(cursor - 1, open.length);
    if (open[previous] && !open[cursor]) {
      closureIndex = cursor;
      break;
    }
    cursor = cyclicIndex(cursor + 1, open.length);
    if (cursor === openingIndex) break;
  }
  return closureIndex < 0
    ? null
    : Object.freeze({ thresholdMlPerSec, openingIndex, closureIndex });
}

function cyclicOpeningAfterLongestClosedRun(open: readonly boolean[]): number {
  let bestOpening = -1;
  let bestClosedCount = -1;
  for (let index = 0; index < open.length; index += 1) {
    const previous = cyclicIndex(index - 1, open.length);
    if (!open[index] || open[previous]) continue;
    let count = 0;
    let cursor = previous;
    while (!open[cursor] && count < open.length) {
      count += 1;
      cursor = cyclicIndex(cursor - 1, open.length);
    }
    if (count > bestClosedCount) {
      bestClosedCount = count;
      bestOpening = index;
    }
  }
  return bestOpening;
}

function nearestCyclicPhaseIndex(
  observations: readonly MainWireScientificSessionObservationV1[],
  targetPhase01: number,
): number {
  return observations.reduce((best, sample, index) => {
    const phase = cyclePhase01(sample.acceptedTimeSec);
    const distance = positiveModulo(phase - targetPhase01, 1);
    const bestPhase = cyclePhase01(observations[best]!.acceptedTimeSec);
    const bestDistance = positiveModulo(bestPhase - targetPhase01, 1);
    return distance < bestDistance ? index : best;
  }, 0);
}

function normalAtrialCalciumOnsetPhase01(): number {
  const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  return positiveModulo(
    prior.cycleLengthSec - prior.atrioventricularDelaySec
      + prior.atrial.electricalToCalciumDelaySec,
    prior.cycleLengthSec,
  ) / prior.cycleLengthSec;
}

function cycleEvent(
  observations: readonly MainWireScientificSessionObservationV1[],
  sampleIndex: number,
): MainWireCycleEventV1 {
  const sample = observations[sampleIndex]!;
  return Object.freeze({
    sampleIndex,
    acceptedTimeSec: sample.acceptedTimeSec,
    phase01: cyclePhase01(sample.acceptedTimeSec),
  });
}

function cyclePhase01(timeSec: number): number {
  const phase = positiveModulo(timeSec, 1);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function cyclicHalfOpenIndices(
  length: number,
  startIndex: number,
  endIndex: number,
): number[] {
  const output: number[] = [];
  let cursor = startIndex;
  for (let guard = 0; guard < length; guard += 1) {
    if (cursor === endIndex) return output;
    output.push(cursor);
    cursor = cyclicIndex(cursor + 1, length);
  }
  return output;
}

function cyclicSegmentInclusive<T>(
  values: readonly T[],
  startIndex: number,
  endIndex: number,
): readonly T[] {
  const output: T[] = [];
  let cursor = startIndex;
  for (let guard = 0; guard <= values.length; guard += 1) {
    output.push(values[cursor]!);
    if (cursor === endIndex) return output;
    cursor = cyclicIndex(cursor + 1, values.length);
  }
  return [];
}

function markIndices<T>(
  target: Map<number, T>,
  indices: readonly number[],
  value: T,
): void {
  for (const index of indices) target.set(index, value);
}

function cyclicIndex(index: number, length: number): number {
  return positiveModulo(index, length);
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function minimum(values: readonly number[]): number {
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  return Math.max(...values);
}
