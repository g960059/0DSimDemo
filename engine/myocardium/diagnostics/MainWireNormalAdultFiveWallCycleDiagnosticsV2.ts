import {
  ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
  validateRetainedAcceptedIntervalWindowV1,
  type RetainedAcceptedIntervalWindowV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1,
  type MainWireNormalAdultFiveWallCycleDiagnosticsV1,
  type MainWireNormalAdultFiveWallCycleEventV1,
  type MainWireNormalAdultFiveWallCyclePhaseV1,
  type MainWireNormalAdultFiveWallCycleSampleV1,
  type MainWireNormalAdultFiveWallCycleWallIdV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import type {
  MainWireNormalAdultFiveWallSelectedCycleEventV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallSelectedCycleContextV2";
import type {
  MainWireNormalAdultFiveWallAcceptedCalciumEventV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_V2_ID =
  "main-wire-normal-adult-five-wall-cycle-diagnostics-v2" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V2 =
  Object.freeze({
    ...MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1,
    input: "complete-accepted-interval-window" as const,
    phaseOwnership:
      "accepted-duration-with-exact-atrial-event-overlap" as const,
    integration: "accepted-backward-Euler-endpoint" as const,
    atrialCalciumOnset:
      "single-LA-event-copied-from-accepted-calcium-trial" as const,
    internalAtrialEventHandling:
      "split-diagnostic-duration-reuse-endpoint-signal" as const,
    valveEventTimeLocalization: "accepted-endpoint" as const,
    pressureWaveExtrema:
      "accepted-endpoints-with-interval-phase-ownership" as const,
    workIncrementOwnership: "accepted-endpoint-unsplit" as const,
    workIncrementMultipliedByDt: false as const,
    relaxationTauRegression:
      "accepted-duration-weighted-endpoint-time" as const,
  });

type WallRecord<T> = Readonly<
  Record<MainWireNormalAdultFiveWallCycleWallIdV1, T>
>;
type PhaseRecord<T> = Readonly<
  Record<MainWireNormalAdultFiveWallCyclePhaseV1, T>
>;

export type MainWireNormalAdultFiveWallCycleAcceptedWindowV2 =
  RetainedAcceptedIntervalWindowV1<
    MainWireNormalAdultFiveWallCycleSampleV1,
    MainWireNormalAdultFiveWallAcceptedCalciumEventV1
  >;

export type MainWireNormalAdultFiveWallCycleDiagnosticsInputV2 = Readonly<{
  window: MainWireNormalAdultFiveWallCycleAcceptedWindowV2;
  wallMaterialVolumeMlByWall: WallRecord<number>;
  valveOpenThreshold?: Readonly<{
    peakFraction?: number;
    absoluteFloorMlPerSec?: number;
  }>;
}>;

export type MainWireNormalAdultFiveWallCycleTimebaseV2 = Readonly<{
  timebaseId: typeof ACCEPTED_INTERVAL_TIMEBASE_V1_ID;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  acceptedIntervalCount: number;
  minimumAcceptedDtSec: number;
  maximumAcceptedDtSec: number;
  acceptedEventCount: number;
}>;

export type MainWireNormalAdultFiveWallAtrialCalciumOnsetEventV2 = Readonly<{
  eventId: string;
  source: "accepted-calcium-trial";
  timeSec: number;
  phase01: number;
  intervalIndex: number;
  coincidentWithAcceptedEndpoint: boolean;
  firstAcceptedEndpoint: MainWireNormalAdultFiveWallCycleEventV1;
}>;

export type MainWireNormalAdultFiveWallFlowWindowLedgerV2 = Readonly<{
  sampleCount: number;
  durationSec: number;
  peakForwardMlPerSec: number;
  peakReverseMlPerSec: number;
  signedVolumeMl: number;
  forwardVolumeMl: number;
  reverseVolumeMl: number;
}>;

export type MainWireNormalAdultFiveWallMitralWaveLedgerV2 = Readonly<{
  sampleCount: number;
  durationSec: number;
  peakForwardMlPerSec: number;
  forwardVolumeMl: number;
  modeledAreaVtiCm: number | null;
  positiveFlowSamplesWithoutPhysicalArea: number;
  positiveFlowDurationWithoutPhysicalAreaSec: number;
}>;

type V1Mitral = MainWireNormalAdultFiveWallCycleDiagnosticsV1["mitral"];
type V1PressureWaves =
  MainWireNormalAdultFiveWallCycleDiagnosticsV1["leftAtrialPressureWaves"];

export type MainWireNormalAdultFiveWallCycleDiagnosticsMeasuredV2 = Readonly<
  Omit<
    MainWireNormalAdultFiveWallCycleDiagnosticsV1,
    | "diagnosticsId"
    | "dtSec"
    | "events"
    | "pulmonaryVenous"
    | "mitral"
    | "leftAtrialPressureWaves"
    | "ivrtLike"
    | "claim"
  > & {
    diagnosticsId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_V2_ID;
    status: "measurable";
    timebase: MainWireNormalAdultFiveWallCycleTimebaseV2;
    phaseDurationSec: PhaseRecord<number>;
    phaseByAcceptedIntervalEndpoint:
      readonly MainWireNormalAdultFiveWallCyclePhaseV1[];
    atrialOnsetStateReadback: Readonly<{
      exactEventTimeSec: number;
      endpointTimeSec: number;
      endpointSampleIndex: number;
      method: "first-accepted-endpoint-at-or-after-exact-event";
      interpolationApplied: false;
    }>;
    events: Readonly<{
      mitralValveOpening: MainWireNormalAdultFiveWallCycleEventV1;
      mitralValveClosure: MainWireNormalAdultFiveWallCycleEventV1;
      aorticValveClosure: MainWireNormalAdultFiveWallCycleEventV1;
      atrialCalciumOnset:
        MainWireNormalAdultFiveWallAtrialCalciumOnsetEventV2;
      mitralEventSource: "flow-threshold";
      aorticEventSource: "flow-threshold";
      mitralOpenThresholdMlPerSec: number;
      aorticOpenThresholdMlPerSec: number;
    }>;
    pulmonaryVenous: Readonly<{
      S: MainWireNormalAdultFiveWallFlowWindowLedgerV2;
      D: MainWireNormalAdultFiveWallFlowWindowLedgerV2;
      Ar: MainWireNormalAdultFiveWallFlowWindowLedgerV2;
    }>;
    mitral: Readonly<
      Omit<V1Mitral, "E" | "A"> & {
        E: MainWireNormalAdultFiveWallMitralWaveLedgerV2;
        A: MainWireNormalAdultFiveWallMitralWaveLedgerV2;
      }
    >;
    leftAtrialPressureWaves: V1PressureWaves;
    ivrtLike: MainWireNormalAdultFiveWallCycleDiagnosticsV1["ivrtLike"];
    claim:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V2;
  }
>;

export type MainWireNormalAdultFiveWallCycleDiagnosticsUnavailableV2 =
  Readonly<{
    diagnosticsId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_V2_ID;
    status: "not-measurable";
    reason:
      | "no-left-atrial-calcium-onset-event"
      | "multiple-left-atrial-calcium-onset-events";
    timebase: MainWireNormalAdultFiveWallCycleTimebaseV2;
    atrialCalciumOnsetCandidates:
      readonly MainWireNormalAdultFiveWallAtrialCalciumOnsetEventV2[];
    claim:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V2;
  }>;

export type MainWireNormalAdultFiveWallCycleDiagnosticsV2 =
  | MainWireNormalAdultFiveWallCycleDiagnosticsMeasuredV2
  | MainWireNormalAdultFiveWallCycleDiagnosticsUnavailableV2;

type PhaseDurationWeights = readonly PhaseRecord<number>[];

const PA_PER_MMHG = 133.322;
const MMHG_ML_TO_MILLIJ = PA_PER_MMHG * 1e-3;

export function measureMainWireNormalAdultFiveWallCycleDiagnosticsV2(
  input: MainWireNormalAdultFiveWallCycleDiagnosticsInputV2,
): MainWireNormalAdultFiveWallCycleDiagnosticsV2 {
  validateRetainedAcceptedIntervalWindowV1(input.window);
  const samples = input.window.intervals.map(
    (interval) => interval.endpointSample.sample,
  );
  const timebase = cycleTimebase(input.window);
  const onsetCandidates = leftAtrialOnsetCandidates(input.window, samples);
  if (onsetCandidates.length !== 1) {
    return Object.freeze({
      diagnosticsId:
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_V2_ID,
      status: "not-measurable" as const,
      reason: onsetCandidates.length === 0
        ? "no-left-atrial-calcium-onset-event" as const
        : "multiple-left-atrial-calcium-onset-events" as const,
      timebase,
      atrialCalciumOnsetCandidates: Object.freeze(onsetCandidates),
      claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V2,
    });
  }
  const atrialOnset = onsetCandidates[0]!;
  validateMeasurementInput(input, samples);
  const thresholdFraction = input.valveOpenThreshold?.peakFraction ?? 0.01;
  const thresholdFloor =
    input.valveOpenThreshold?.absoluteFloorMlPerSec ?? 1;
  const atrialOnsetIndex = atrialOnset.intervalIndex;
  const mitral = detectValveCycle(
    samples.map((sample) => sample.flowMlPerSec.MV),
    input.window.precedingSample.sample.flowMlPerSec.MV,
    input.window.intervals.map((interval) => interval.durationSec),
    thresholdFraction,
    thresholdFloor,
    atrialOnsetIndex,
    "mitral",
    true,
  );
  const aortic = detectValveCycle(
    samples.map((sample) => sample.flowMlPerSec.AoV),
    input.window.precedingSample.sample.flowMlPerSec.AoV,
    input.window.intervals.map((interval) => interval.durationSec),
    thresholdFraction,
    thresholdFloor,
    null,
    "aortic",
    false,
  );
  const reservoirIndices = cyclicHalfOpenIndices(
    samples.length,
    mitral.closingIndex,
    mitral.openingIndex,
  );
  const conduitIndices = cyclicHalfOpenIndices(
    samples.length,
    mitral.openingIndex,
    atrialOnsetIndex,
  );
  const pumpingIndices = cyclicHalfOpenIndices(
    samples.length,
    atrialOnsetIndex,
    mitral.closingIndex,
  );
  const phaseBySample = assignExhaustivePhases(
    samples.length,
    reservoirIndices,
    conduitIndices,
    pumpingIndices,
  );
  const phaseSampleCount = Object.freeze({
    reservoir: reservoirIndices.length,
    conduit: conduitIndices.length,
    pumping: pumpingIndices.length,
  });
  const phaseWeights = acceptedPhaseDurationWeights(
    input.window,
    phaseBySample,
    atrialOnset,
  );
  const phaseDurationSec = phaseRecord((phase) =>
    sum(phaseWeights.map((weights) => weights[phase])));
  const ePeakIndex = weightedPeakIndex(samples, phaseWeights, "conduit");
  const aPeakIndex = weightedPeakIndex(samples, phaseWeights, "pumping");
  const eWave = mitralWaveLedger(samples, phaseWeights, "conduit");
  const aWave = mitralWaveLedger(samples, phaseWeights, "pumping");
  const waveSeparation = measureMitralWaveSeparation(
    samples,
    ePeakIndex,
    aPeakIndex,
  );
  const ivrtIndices = cyclicOpenClosedIndices(
    samples.length,
    aortic.closingIndex,
    mitral.openingIndex,
  );
  const tau = fitDurationWeightedRelaxationTau(
    input.window,
    ivrtIndices,
  );
  const laTrajectory = [
    input.window.precedingSample.sample,
    ...samples,
  ];
  const laVolumes = laTrajectory.map((sample) => sample.nodeVolumeMl.LA);
  const maximumMl = Math.max(...laVolumes);
  const minimumMl = Math.min(...laVolumes);
  const preAMl = samples[atrialOnsetIndex]!.nodeVolumeMl.LA;
  const totalEmptyingMl = maximumMl - minimumMl;
  const boosterEmptyingMl = preAMl - minimumMl;
  const vIndex = extremumIndex(
    samples,
    reservoirIndices,
    (sample) => sample.chamberTransmuralPressureMmHg.LA,
    "maximum",
  );
  const aIndex = extremumIndex(
    samples,
    pumpingIndices,
    (sample) => sample.chamberTransmuralPressureMmHg.LA,
    "maximum",
  );
  const aToVIndices = cyclicHalfOpenIndices(samples.length, aIndex, vIndex);
  const xIndex = extremumIndex(
    samples,
    aToVIndices,
    (sample) => sample.chamberTransmuralPressureMmHg.LA,
    "minimum",
  );
  const yIndex = extremumIndex(
    samples,
    conduitIndices,
    (sample) => sample.chamberTransmuralPressureMmHg.LA,
    "minimum",
  );
  const aPressure = pressureEvent(samples, aIndex);
  const xPressure = pressureEvent(samples, xIndex);
  const vPressure = pressureEvent(samples, vIndex);
  const yPressure = pressureEvent(samples, yIndex);
  const volumeAtAPeakMl = samples[aIndex]!.nodeVolumeMl.LA;
  const boosterCompletedAtAPeak = safeRatio(
    preAMl - volumeAtAPeakMl,
    boosterEmptyingMl,
  );
  const minimumTrajectoryIndex = laVolumes.indexOf(minimumMl);
  const minimumVolumeTimeSec = minimumTrajectoryIndex === 0
    ? input.window.startTimeSec
    : samples[minimumTrajectoryIndex - 1]!.timeSec;
  const boosterCompletedAtAPeakStatus = boosterEmptyingAtAPeakStatus(
    boosterCompletedAtAPeak,
    samples[atrialOnsetIndex]!.timeSec,
    samples[aIndex]!.timeSec,
    minimumVolumeTimeSec,
    input.window.durationSec,
  );
  const workEnergy = measureWorkEnergy(
    input.window,
    input.wallMaterialVolumeMlByWall,
    phaseBySample,
  );
  const aPeakDelaySec = cyclicForwardTimeDeltaSec(
    atrialOnset.timeSec,
    aPressure.timeSec,
    input.window.durationSec,
  );
  const aPressureToFlowPeakSec = signedCyclicTimeDeltaSec(
    aPressure.timeSec,
    samples[aPeakIndex]!.timeSec,
    input.window.durationSec,
  );

  return Object.freeze({
    diagnosticsId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_V2_ID,
    status: "measurable" as const,
    sampleCount: samples.length,
    timebase,
    phaseBySample: Object.freeze(phaseBySample),
    phaseByAcceptedIntervalEndpoint: Object.freeze(phaseBySample),
    phaseSampleCount,
    phaseDurationSec,
    atrialOnsetStateReadback: Object.freeze({
      exactEventTimeSec: atrialOnset.timeSec,
      endpointTimeSec: samples[atrialOnsetIndex]!.timeSec,
      endpointSampleIndex: atrialOnsetIndex,
      method:
        "first-accepted-endpoint-at-or-after-exact-event" as const,
      interpolationApplied: false as const,
    }),
    events: Object.freeze({
      mitralValveOpening: event(samples, mitral.openingIndex),
      mitralValveClosure: event(samples, mitral.closingIndex),
      aorticValveClosure: event(samples, aortic.closingIndex),
      atrialCalciumOnset: atrialOnset,
      mitralEventSource: "flow-threshold" as const,
      aorticEventSource: "flow-threshold" as const,
      mitralOpenThresholdMlPerSec: mitral.thresholdMlPerSec,
      aorticOpenThresholdMlPerSec: aortic.thresholdMlPerSec,
    }),
    pulmonaryVenous: Object.freeze({
      S: flowLedger(samples, phaseWeights, "reservoir", "PVein_LA"),
      D: flowLedger(samples, phaseWeights, "conduit", "PVein_LA"),
      Ar: flowLedger(samples, phaseWeights, "pumping", "PVein_LA"),
    }),
    mitral: Object.freeze({
      E: eWave,
      A: aWave,
      eFlowPeak: flowEvent(samples, ePeakIndex),
      aFlowPeak: flowEvent(samples, aPeakIndex),
      peakERatioToA: safeRatio(
        eWave.peakForwardMlPerSec,
        aWave.peakForwardMlPerSec,
      ),
      forwardVolumeERatioToA: safeRatio(
        eWave.forwardVolumeMl,
        aWave.forwardVolumeMl,
      ),
      flowAtAtrialCalciumOnsetMlPerSec:
        samples[atrialOnsetIndex]!.flowMlPerSec.MV,
      flowAtAtrialCalciumOnsetRatioToEPeak: safeRatio(
        samples[atrialOnsetIndex]!.flowMlPerSec.MV,
        eWave.peakForwardMlPerSec,
      ),
      waveSeparation,
    }),
    leftAtrialVolumes: Object.freeze({
      maximumMl,
      preAMl,
      minimumMl,
      reservoirExpansionMl: totalEmptyingMl,
      conduitEmptyingMl: maximumMl - preAMl,
      boosterEmptyingMl,
      conduitFractionOfTotalEmptying: safeRatio(
        maximumMl - preAMl,
        totalEmptyingMl,
      ),
      boosterFractionOfTotalEmptying: safeRatio(
        boosterEmptyingMl,
        totalEmptyingMl,
      ),
      eventAnchoredNetChangeMl: Object.freeze({
        reservoir:
          samples[mitral.openingIndex]!.nodeVolumeMl.LA -
          samples[mitral.closingIndex]!.nodeVolumeMl.LA,
        conduit:
          samples[atrialOnsetIndex]!.nodeVolumeMl.LA -
          samples[mitral.openingIndex]!.nodeVolumeMl.LA,
        pumping:
          samples[mitral.closingIndex]!.nodeVolumeMl.LA -
          samples[atrialOnsetIndex]!.nodeVolumeMl.LA,
      }),
    }),
    leftAtrialPressureWaves: Object.freeze({
      aPeak: aPressure,
      xTrough: xPressure,
      vPeak: vPressure,
      yTrough: yPressure,
      xDescentMmHg: aPressure.pressureMmHg - xPressure.pressureMmHg,
      yDescentMmHg: vPressure.pressureMmHg - yPressure.pressureMmHg,
      volumeAtAPeakMl,
      aPeakDelayFromAtrialCalciumOnsetSec: aPeakDelaySec,
      aPressurePeakToMitralAFlowPeakSec: aPressureToFlowPeakSec,
      boosterEmptyingCompletedAtAPeakFraction: boosterCompletedAtAPeak,
      boosterEmptyingRemainingAtAPeakFraction:
        boosterCompletedAtAPeak === null ? null : 1 - boosterCompletedAtAPeak,
      boosterEmptyingCompletedAtAPeakStatus:
        boosterCompletedAtAPeakStatus,
      sequentialAcrossCycle: true as const,
    }),
    ivrtLike: Object.freeze({
      durationSec: sum(ivrtIndices.map(
        (index) => input.window.intervals[index]!.durationSec,
      )),
      sampleCount: ivrtIndices.length,
      relaxationTauSec: tau.tauSec,
      fitR2: tau.r2,
      fixedAsymptoteMmHg: tau.asymptoteMmHg,
      reason: tau.reason,
    }),
    workEnergy,
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V2,
  });
}

function cycleTimebase(
  window: MainWireNormalAdultFiveWallCycleAcceptedWindowV2,
): MainWireNormalAdultFiveWallCycleTimebaseV2 {
  const durations = window.intervals.map((interval) => interval.durationSec);
  return Object.freeze({
    timebaseId: ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
    startTimeSec: window.startTimeSec,
    endTimeSec: window.endTimeSec,
    durationSec: window.durationSec,
    acceptedIntervalCount: window.intervals.length,
    minimumAcceptedDtSec: Math.min(...durations),
    maximumAcceptedDtSec: Math.max(...durations),
    acceptedEventCount: sum(window.intervals.map(
      (interval) => interval.eventsOpenClosed.length,
    )),
  });
}

function leftAtrialOnsetCandidates(
  window: MainWireNormalAdultFiveWallCycleAcceptedWindowV2,
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
): MainWireNormalAdultFiveWallAtrialCalciumOnsetEventV2[] {
  const candidates: MainWireNormalAdultFiveWallAtrialCalciumOnsetEventV2[] = [];
  window.intervals.forEach((interval, intervalIndex) => {
    interval.eventsOpenClosed.forEach((ownedEvent) => {
      if (!(ownedEvent.event.calciumEvent.strengthByWall.LA > 0)) return;
      candidates.push(cycleCalciumEvent(
        ownedEvent,
        intervalIndex,
        interval.endTimeSec,
        samples[intervalIndex]!,
        window,
      ));
    });
  });
  return candidates;
}

function cycleCalciumEvent(
  ownedEvent: MainWireNormalAdultFiveWallSelectedCycleEventV2,
  intervalIndex: number,
  intervalEndTimeSec: number,
  endpointSample: MainWireNormalAdultFiveWallCycleSampleV1,
  window: MainWireNormalAdultFiveWallCycleAcceptedWindowV2,
): MainWireNormalAdultFiveWallAtrialCalciumOnsetEventV2 {
  return Object.freeze({
    eventId: ownedEvent.eventId,
    source: "accepted-calcium-trial" as const,
    timeSec: ownedEvent.timeSec,
    phase01: positiveModulo(
      (ownedEvent.timeSec - window.startTimeSec) / window.durationSec,
      1,
    ),
    intervalIndex,
    coincidentWithAcceptedEndpoint: acceptedTimeEqual(
      ownedEvent.timeSec,
      intervalEndTimeSec,
    ),
    firstAcceptedEndpoint: Object.freeze({
      sampleIndex: intervalIndex,
      phase01: endpointSample.cyclePhase01,
      timeSec: endpointSample.timeSec,
    }),
  });
}

function acceptedPhaseDurationWeights(
  window: MainWireNormalAdultFiveWallCycleAcceptedWindowV2,
  phaseBySample: readonly MainWireNormalAdultFiveWallCyclePhaseV1[],
  atrialOnset: MainWireNormalAdultFiveWallAtrialCalciumOnsetEventV2,
): PhaseDurationWeights {
  const weights = window.intervals.map((interval, index) => {
    const phase = phaseBySample[index]!;
    return mutablePhaseRecord(phase, interval.durationSec);
  });
  const onsetInterval = window.intervals[atrialOnset.intervalIndex]!;
  const beforeOnsetSec = clampDuration(
    atrialOnset.timeSec - onsetInterval.startTimeSec,
    onsetInterval.durationSec,
  );
  const afterOnsetSec = onsetInterval.durationSec - beforeOnsetSec;
  weights[atrialOnset.intervalIndex] = {
    reservoir: 0,
    conduit: beforeOnsetSec,
    pumping: afterOnsetSec,
  };
  const total = sum(weights.flatMap((entry) => Object.values(entry)));
  if (!acceptedTimeEqual(total, window.durationSec)) {
    throw new Error("phase duration ledger does not cover the accepted window");
  }
  return Object.freeze(weights.map((entry) => Object.freeze(entry)));
}

function flowLedger(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  weights: PhaseDurationWeights,
  phase: MainWireNormalAdultFiveWallCyclePhaseV1,
  key: "PVein_LA",
): MainWireNormalAdultFiveWallFlowWindowLedgerV2 {
  let sampleCount = 0;
  let durationSec = 0;
  let peakForwardMlPerSec = 0;
  let peakReverseMlPerSec = 0;
  let signedVolumeMl = 0;
  let forwardVolumeMl = 0;
  let reverseVolumeMl = 0;
  samples.forEach((sample, index) => {
    const duration = weights[index]![phase];
    if (!(duration > 0)) return;
    sampleCount += 1;
    durationSec += duration;
    const flow = sample.flowMlPerSec[key];
    peakForwardMlPerSec = Math.max(peakForwardMlPerSec, flow);
    peakReverseMlPerSec = Math.max(peakReverseMlPerSec, -flow);
    signedVolumeMl += flow * duration;
    forwardVolumeMl += Math.max(flow, 0) * duration;
    reverseVolumeMl += Math.max(-flow, 0) * duration;
  });
  return Object.freeze({
    sampleCount,
    durationSec,
    peakForwardMlPerSec,
    peakReverseMlPerSec,
    signedVolumeMl,
    forwardVolumeMl,
    reverseVolumeMl,
  });
}

function mitralWaveLedger(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  weights: PhaseDurationWeights,
  phase: "conduit" | "pumping",
): MainWireNormalAdultFiveWallMitralWaveLedgerV2 {
  let sampleCount = 0;
  let durationSec = 0;
  let peakForwardMlPerSec = 0;
  let forwardVolumeMl = 0;
  let modeledAreaVtiCm = 0;
  let positiveFlowSamplesWithoutPhysicalArea = 0;
  let positiveFlowDurationWithoutPhysicalAreaSec = 0;
  samples.forEach((sample, index) => {
    const duration = weights[index]![phase];
    if (!(duration > 0)) return;
    sampleCount += 1;
    durationSec += duration;
    const forwardFlow = Math.max(sample.flowMlPerSec.MV, 0);
    peakForwardMlPerSec = Math.max(peakForwardMlPerSec, forwardFlow);
    forwardVolumeMl += forwardFlow * duration;
    if (forwardFlow === 0) return;
    const areaCm2 = sample.valveHydraulics.MV.physicalAreaCm2;
    if (areaCm2 > 0 && Number.isFinite(areaCm2)) {
      modeledAreaVtiCm += forwardFlow / areaCm2 * duration;
    } else {
      positiveFlowSamplesWithoutPhysicalArea += 1;
      positiveFlowDurationWithoutPhysicalAreaSec += duration;
    }
  });
  return Object.freeze({
    sampleCount,
    durationSec,
    peakForwardMlPerSec,
    forwardVolumeMl,
    modeledAreaVtiCm:
      positiveFlowSamplesWithoutPhysicalArea === 0 ? modeledAreaVtiCm : null,
    positiveFlowSamplesWithoutPhysicalArea,
    positiveFlowDurationWithoutPhysicalAreaSec,
  });
}

function weightedPeakIndex(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  weights: PhaseDurationWeights,
  phase: "conduit" | "pumping",
): number {
  const indices = samples.flatMap((_, index) =>
    weights[index]![phase] > 0 ? [index] : []);
  if (indices.length === 0) {
    throw new Error(`cannot measure mitral peak in zero-duration ${phase}`);
  }
  return indices.reduce((best, index) =>
    Math.max(samples[index]!.flowMlPerSec.MV, 0) >
        Math.max(samples[best]!.flowMlPerSec.MV, 0)
      ? index
      : best);
}

function measureMitralWaveSeparation(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  ePeakIndex: number,
  aPeakIndex: number,
): V1Mitral["waveSeparation"] {
  const between = cyclicHalfOpenIndices(
    samples.length,
    (ePeakIndex + 1) % samples.length,
    aPeakIndex,
  );
  if (between.length === 0) return unresolvedMitralWaveSeparation();
  const valleyIndex = between.reduce((best, index) =>
    Math.max(samples[index]!.flowMlPerSec.MV, 0) <
        Math.max(samples[best]!.flowMlPerSec.MV, 0)
      ? index
      : best);
  const ePeak = Math.max(samples[ePeakIndex]!.flowMlPerSec.MV, 0);
  const aPeak = Math.max(samples[aPeakIndex]!.flowMlPerSec.MV, 0);
  const valleyFlow = Math.max(samples[valleyIndex]!.flowMlPerSec.MV, 0);
  if (!(ePeak > 0 && aPeak > 0 && valleyFlow < ePeak && valleyFlow < aPeak)) {
    return unresolvedMitralWaveSeparation();
  }
  return Object.freeze({
    status: "separated" as const,
    criterion:
      "strict-intervening-forward-flow-valley-between-window-peaks" as const,
    valley: flowEvent(samples, valleyIndex),
    valleyToLowerPeakRatio: valleyFlow / Math.min(ePeak, aPeak),
  });
}

function unresolvedMitralWaveSeparation(): V1Mitral["waveSeparation"] {
  return Object.freeze({
    status: "fused-or-unresolved" as const,
    criterion:
      "strict-intervening-forward-flow-valley-between-window-peaks" as const,
    valley: null,
    valleyToLowerPeakRatio: null,
  });
}

function fitDurationWeightedRelaxationTau(
  window: MainWireNormalAdultFiveWallCycleAcceptedWindowV2,
  indices: readonly number[],
) {
  if (indices.length < 3) return Object.freeze({
    tauSec: null,
    r2: null,
    asymptoteMmHg: null,
    reason: "insufficient-samples" as const,
  });
  const pressures = indices.map((index) =>
    window.intervals[index]!.endpointSample.sample
      .chamberTransmuralPressureMmHg.LV);
  const asymptoteMmHg = Math.min(...pressures) - 1;
  const firstTimeSec = window.intervals[indices[0]!]!.endTimeSec;
  const points = indices.map((index) => {
    const interval = window.intervals[index]!;
    return Object.freeze({
      weight: interval.durationSec,
      x: cyclicForwardTimeDeltaSec(
        firstTimeSec,
        interval.endTimeSec,
        window.durationSec,
      ),
      y: Math.log(Math.max(
        interval.endpointSample.sample.chamberTransmuralPressureMmHg.LV -
          asymptoteMmHg,
        1e-12,
      )),
    });
  });
  const totalWeight = sum(points.map((point) => point.weight));
  const meanX = sum(points.map((point) => point.weight * point.x)) / totalWeight;
  const meanY = sum(points.map((point) => point.weight * point.y)) / totalWeight;
  let ssXX = 0;
  let ssXY = 0;
  let ssYY = 0;
  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    ssXX += point.weight * dx * dx;
    ssXY += point.weight * dx * dy;
    ssYY += point.weight * dy * dy;
  }
  if (ssXX <= 1e-12 || ssYY <= 1e-12 || !(ssXY < 0)) {
    return Object.freeze({
      tauSec: null,
      r2: null,
      asymptoteMmHg,
      reason: "non-decaying-fit" as const,
    });
  }
  const slopePerSec = ssXY / ssXX;
  return Object.freeze({
    tauSec: -1 / slopePerSec,
    r2: Math.min(1, Math.max(0, ssXY * ssXY / (ssXX * ssYY))),
    asymptoteMmHg,
    reason: "available" as const,
  });
}

function detectValveCycle(
  flows: readonly number[],
  precedingFlow: number,
  intervalDurationSec: readonly number[],
  flowThresholdFraction: number,
  flowThresholdFloor: number,
  closureSearchStartIndex: number | null,
  label: string,
  openingRequired: boolean,
) {
  const peak = Math.max(precedingFlow, ...flows);
  const thresholdMlPerSec = Math.max(
    flowThresholdFloor,
    flowThresholdFraction * peak,
  );
  const transition = detectBinaryValveCycle(
    flows.map((flow) => flow > thresholdMlPerSec),
    precedingFlow > thresholdMlPerSec,
    intervalDurationSec,
    closureSearchStartIndex,
    label,
    openingRequired,
  );
  if (transition === null) {
    throw new Error(`${label} signal has no cyclic opening and closing transition`);
  }
  return Object.freeze({ ...transition, thresholdMlPerSec });
}

function detectBinaryValveCycle(
  open: readonly boolean[],
  precedingOpen: boolean,
  intervalDurationSec: readonly number[],
  closureSearchStartIndex: number | null,
  label: string,
  openingRequired: boolean,
): Readonly<{ openingIndex: number; closingIndex: number }> | null {
  if (open.length !== intervalDurationSec.length) {
    throw new Error(`${label} valve state and accepted duration counts differ`);
  }
  if (
    open.every(Boolean) && precedingOpen
    || open.every((value) => !value) && !precedingOpen
  ) return null;
  let openingIndex = -1;
  let longestClosedDurationSec = -1;
  for (let index = 0; index < open.length; index += 1) {
    const previousOpen = index === 0 ? precedingOpen : open[index - 1]!;
    if (!open[index] || previousOpen) continue;
    let closedDurationSec = 0;
    let cursor = index - 1;
    while (cursor >= 0 && !open[cursor]) {
      closedDurationSec += intervalDurationSec[cursor]!;
      cursor -= 1;
    }
    if (cursor < 0 && !precedingOpen) {
      cursor = open.length - 1;
      while (cursor >= index && !open[cursor]) {
        closedDurationSec += intervalDurationSec[cursor]!;
        cursor -= 1;
      }
    }
    if (closedDurationSec > longestClosedDurationSec) {
      longestClosedDurationSec = closedDurationSec;
      openingIndex = index;
    }
  }
  const closingCandidates = open.flatMap((isOpen, index) => {
    const previousOpen = index === 0 ? precedingOpen : open[index - 1]!;
    return previousOpen && !isOpen ? [index] : [];
  });
  const searchStartIndex = closureSearchStartIndex ?? Math.max(openingIndex, 0);
  const closingIndex = closingCandidates.reduce((best, candidate) => {
    if (best < 0) return candidate;
    return cyclicForwardAcceptedDurationSec(
        searchStartIndex,
        candidate,
        intervalDurationSec,
      ) < cyclicForwardAcceptedDurationSec(
        searchStartIndex,
        best,
        intervalDurationSec,
      )
      ? candidate
      : best;
  }, -1);
  if ((openingRequired && openingIndex < 0) || closingIndex < 0) {
    throw new Error(`${label} transition detection failed`);
  }
  return Object.freeze({ openingIndex, closingIndex });
}

function cyclicForwardAcceptedDurationSec(
  startEndpointIndex: number,
  endEndpointIndex: number,
  intervalDurationSec: readonly number[],
): number {
  if (startEndpointIndex === endEndpointIndex) return 0;
  let durationSec = 0;
  let cursor = (startEndpointIndex + 1) % intervalDurationSec.length;
  for (let guard = 0; guard < intervalDurationSec.length; guard += 1) {
    durationSec += intervalDurationSec[cursor]!;
    if (cursor === endEndpointIndex) return durationSec;
    cursor = (cursor + 1) % intervalDurationSec.length;
  }
  throw new Error("cyclic accepted duration search did not terminate");
}

function assignExhaustivePhases(
  length: number,
  reservoir: readonly number[],
  conduit: readonly number[],
  pumping: readonly number[],
): MainWireNormalAdultFiveWallCyclePhaseV1[] {
  const output = Array<MainWireNormalAdultFiveWallCyclePhaseV1 | undefined>(
    length,
  );
  for (const [phase, indices] of Object.entries({
    reservoir,
    conduit,
    pumping,
  }) as [MainWireNormalAdultFiveWallCyclePhaseV1, readonly number[]][]) {
    for (const index of indices) {
      if (output[index] !== undefined) {
        throw new Error(`cycle phase windows overlap at sample ${index}`);
      }
      output[index] = phase;
    }
  }
  if (output.some((phase) => phase === undefined)) {
    throw new Error("cycle phase windows are not exhaustive");
  }
  return output as MainWireNormalAdultFiveWallCyclePhaseV1[];
}

function extremumIndex(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  indices: readonly number[],
  read: (sample: MainWireNormalAdultFiveWallCycleSampleV1) => number,
  kind: "minimum" | "maximum",
): number {
  if (indices.length === 0) {
    throw new Error(`cannot measure ${kind} in empty cycle window`);
  }
  return indices.reduce((best, index) => {
    const value = read(samples[index]!);
    const bestValue = read(samples[best]!);
    return (kind === "minimum" ? value < bestValue : value > bestValue)
      ? index
      : best;
  });
}

function boosterEmptyingAtAPeakStatus(
  fraction: number | null,
  atrialOnsetEndpointTimeSec: number,
  aPeakTimeSec: number,
  minimumVolumeTimeSec: number,
  cycleDurationSec: number,
): V1PressureWaves["boosterEmptyingCompletedAtAPeakStatus"] {
  if (fraction === null) return "not-defined-no-net-booster-emptying";
  if (fraction < 0) return "before-net-emptying";
  const aPeakProgress = cyclicForwardTimeDeltaSec(
    atrialOnsetEndpointTimeSec,
    aPeakTimeSec,
    cycleDurationSec,
  );
  const minimumProgress = cyclicForwardTimeDeltaSec(
    atrialOnsetEndpointTimeSec,
    minimumVolumeTimeSec,
    cycleDurationSec,
  );
  return aPeakProgress >= minimumProgress
    ? "at-or-after-cycle-minimum"
    : "within-active-emptying";
}

function measureWorkEnergy(
  window: MainWireNormalAdultFiveWallCycleAcceptedWindowV2,
  wallMaterialVolumeMlByWall: WallRecord<number>,
  phaseBySample: readonly MainWireNormalAdultFiveWallCyclePhaseV1[],
): MainWireNormalAdultFiveWallCycleDiagnosticsV1["workEnergy"] {
  const samples = window.intervals.map(
    (interval) => interval.endpointSample.sample,
  );
  const perWallMutable = Object.fromEntries(
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1.map((wallId) => [
      wallId,
      mutableWallLedger(),
    ]),
  ) as Record<MainWireNormalAdultFiveWallCycleWallIdV1, MutableWallLedger>;
  const laByPhase = {
    reservoir: mutableStressWork(),
    conduit: mutableStressWork(),
    pumping: mutableStressWork(),
  };
  const cavityWork: Record<"LA" | "LV" | "RA" | "RV", number> = {
    LA: 0,
    LV: 0,
    RA: 0,
    RV: 0,
  };
  for (let index = 0; index < samples.length; index += 1) {
    const next = samples[index]!;
    const previous = index === 0
      ? window.precedingSample.sample
      : samples[index - 1]!;
    for (const wallId of MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1) {
      const factor = wallMaterialVolumeMlByWall[wallId] * 1e-3;
      const deltaStrain = next.wallFiberLogStrain[wallId] -
        previous.wallFiberLogStrain[wallId];
      const stress = next.wallStressPa[wallId];
      const target = perWallMutable[wallId];
      target.stress.total += stress.total * deltaStrain * factor;
      target.stress.active += stress.active * deltaStrain * factor;
      target.stress.passive += stress.passive * deltaStrain * factor;
      target.stress.sls += stress.sls * deltaStrain * factor;
      const energy = next.wallEnergyLedgerDensity[wallId];
      target.passiveStoredChange +=
        (energy.equilibriumPassiveStoredEnergyDensityJPerM3 -
          previous.wallEnergyLedgerDensity[wallId]
            .equilibriumPassiveStoredEnergyDensityJPerM3) * factor;
      target.slsStoredChange +=
        (energy.slsNextStoredEnergyDensityJPerM3 -
          energy.slsPreviousStoredEnergyDensityJPerM3) * factor;
      target.slsPhysical +=
        energy.slsPhysicalDissipationIncrementDensityJPerM3 * factor;
      target.slsNumerical +=
        energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3 *
        factor;
      target.slsReportedResidual +=
        energy.slsDiscreteEnergyBalanceResidualJPerM3 * factor;
    }
    const phase = phaseBySample[index]!;
    const laFactor = wallMaterialVolumeMlByWall.LA * 1e-3;
    const laDeltaStrain = next.wallFiberLogStrain.LA -
      previous.wallFiberLogStrain.LA;
    for (const component of ["total", "active", "passive", "sls"] as const) {
      laByPhase[phase][component] +=
        next.wallStressPa.LA[component] * laDeltaStrain * laFactor;
    }
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      cavityWork[chamber] += next.chamberTransmuralPressureMmHg[chamber] *
        (next.nodeVolumeMl[chamber] - previous.nodeVolumeMl[chamber]) *
        MMHG_ML_TO_MILLIJ;
    }
  }
  const perWall = wallRecord((wallId) =>
    freezeWallLedger(perWallMutable[wallId]));
  const ventricularWallWork = perWall.LVFW.stressWorkOnWallMilliJ.total +
    perWall.SEP.stressWorkOnWallMilliJ.total +
    perWall.RVFW.stressWorkOnWallMilliJ.total;
  const ventricularCavityWork = cavityWork.LV + cavityWork.RV;
  const totalWallWork = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1
    .reduce((total, wallId) =>
      total + perWall[wallId].stressWorkOnWallMilliJ.total, 0);
  const totalCavityWork = cavityWork.LA + cavityWork.LV +
    cavityWork.RA + cavityWork.RV;
  const pairedDurationSec = sum(window.intervals.map(
    (interval) => interval.durationSec,
  ));
  return Object.freeze({
    stressWorkCoverageFraction: pairedDurationSec / window.durationSec,
    perWall,
    laStressWorkOnWallByPhaseMilliJ: Object.freeze({
      reservoir: Object.freeze({ ...laByPhase.reservoir }),
      conduit: Object.freeze({ ...laByPhase.conduit }),
      pumping: Object.freeze({ ...laByPhase.pumping }),
    }),
    cavityWorkOnWallMilliJ: Object.freeze({ ...cavityWork }),
    workConjugacyResidualMilliJ: Object.freeze({
      leftAtrium: perWall.LA.stressWorkOnWallMilliJ.total - cavityWork.LA,
      rightAtrium: perWall.RA.stressWorkOnWallMilliJ.total - cavityWork.RA,
      ventriclesCombined: ventricularWallWork - ventricularCavityWork,
      wholeHeart: totalWallWork - totalCavityWork,
    }),
  });
}

type MutableWallLedger = {
  stress: { total: number; active: number; passive: number; sls: number };
  passiveStoredChange: number;
  slsStoredChange: number;
  slsPhysical: number;
  slsNumerical: number;
  slsReportedResidual: number;
};

function mutableStressWork() {
  return { total: 0, active: 0, passive: 0, sls: 0 };
}

function mutableWallLedger(): MutableWallLedger {
  return {
    stress: mutableStressWork(),
    passiveStoredChange: 0,
    slsStoredChange: 0,
    slsPhysical: 0,
    slsNumerical: 0,
    slsReportedResidual: 0,
  };
}

function freezeWallLedger(
  value: MutableWallLedger,
): MainWireNormalAdultFiveWallCycleDiagnosticsV1["workEnergy"]["perWall"][
  MainWireNormalAdultFiveWallCycleWallIdV1
] {
  const stress = Object.freeze({ ...value.stress });
  const reconstructed = stress.sls - value.slsStoredChange -
    value.slsPhysical - value.slsNumerical;
  return Object.freeze({
    stressWorkOnWallMilliJ: stress,
    stressAssemblyResidualMilliJ:
      stress.total - stress.active - stress.passive - stress.sls,
    equilibriumPassiveStoredEnergyChangeMilliJ: value.passiveStoredChange,
    equilibriumPassiveBackwardEulerRemainderMilliJ:
      stress.passive - value.passiveStoredChange,
    sls: Object.freeze({
      storedEnergyChangeMilliJ: value.slsStoredChange,
      physicalDissipationMilliJ: value.slsPhysical,
      backwardEulerNumericalDissipationMilliJ: value.slsNumerical,
      reportedDiscreteBalanceResidualMilliJ: value.slsReportedResidual,
      reconstructedDiscreteBalanceResidualMilliJ: reconstructed,
      readbackAgreementResidualMilliJ:
        reconstructed - value.slsReportedResidual,
    }),
  });
}

function wallRecord<T>(
  build: (wallId: MainWireNormalAdultFiveWallCycleWallIdV1) => T,
): WallRecord<T> {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1.map((wallId) =>
      [wallId, build(wallId)]),
  )) as WallRecord<T>;
}

function event(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  sampleIndex: number,
): MainWireNormalAdultFiveWallCycleEventV1 {
  const sample = samples[sampleIndex]!;
  return Object.freeze({
    sampleIndex,
    phase01: sample.cyclePhase01,
    timeSec: sample.timeSec,
  });
}

function pressureEvent(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  sampleIndex: number,
) {
  return Object.freeze({
    ...event(samples, sampleIndex),
    pressureMmHg: samples[sampleIndex]!.chamberTransmuralPressureMmHg.LA,
  });
}

function flowEvent(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  sampleIndex: number,
) {
  const sample = samples[sampleIndex]!;
  return Object.freeze({
    sampleIndex,
    phase01: sample.cyclePhase01,
    timeSec: sample.timeSec,
    flowMlPerSec: sample.flowMlPerSec.MV,
  });
}

function cyclicHalfOpenIndices(
  length: number,
  startIndex: number,
  endIndex: number,
): readonly number[] {
  if (startIndex === endIndex) return [];
  const output: number[] = [];
  let cursor = startIndex;
  for (let guard = 0; guard < length; guard += 1) {
    if (cursor === endIndex) return Object.freeze(output);
    output.push(cursor);
    cursor = (cursor + 1) % length;
  }
  throw new Error("cyclic accepted interval did not terminate");
}

/** Accepted transitions strictly after start through and including end. */
function cyclicOpenClosedIndices(
  length: number,
  startIndex: number,
  endIndex: number,
): readonly number[] {
  if (startIndex === endIndex) return [];
  const output: number[] = [];
  let cursor = (startIndex + 1) % length;
  for (let guard = 0; guard < length; guard += 1) {
    output.push(cursor);
    if (cursor === endIndex) return Object.freeze(output);
    cursor = (cursor + 1) % length;
  }
  throw new Error("cyclic open-closed interval did not terminate");
}

function cyclicForwardTimeDeltaSec(
  startTimeSec: number,
  endTimeSec: number,
  cycleDurationSec: number,
): number {
  const delta = endTimeSec - startTimeSec;
  if (delta >= 0) return delta;
  return delta + cycleDurationSec;
}

function signedCyclicTimeDeltaSec(
  startTimeSec: number,
  endTimeSec: number,
  cycleDurationSec: number,
): number {
  let delta = endTimeSec - startTimeSec;
  if (delta > cycleDurationSec / 2) delta -= cycleDurationSec;
  if (delta < -cycleDurationSec / 2) delta += cycleDurationSec;
  return delta;
}

function mutablePhaseRecord(
  phase: MainWireNormalAdultFiveWallCyclePhaseV1,
  durationSec: number,
): Record<MainWireNormalAdultFiveWallCyclePhaseV1, number> {
  return {
    reservoir: phase === "reservoir" ? durationSec : 0,
    conduit: phase === "conduit" ? durationSec : 0,
    pumping: phase === "pumping" ? durationSec : 0,
  };
}

function phaseRecord<T>(
  build: (phase: MainWireNormalAdultFiveWallCyclePhaseV1) => T,
): PhaseRecord<T> {
  return Object.freeze({
    reservoir: build("reservoir"),
    conduit: build("conduit"),
    pumping: build("pumping"),
  });
}

function clampDuration(value: number, maximum: number): number {
  if (acceptedTimeEqual(value, 0)) return 0;
  if (acceptedTimeEqual(value, maximum)) return maximum;
  if (!(value > 0 && value < maximum)) {
    throw new Error("atrial event lies outside its accepted interval");
  }
  return value;
}

function safeRatio(numerator: number, denominator: number): number | null {
  return denominator > 0 && Number.isFinite(numerator) &&
    Number.isFinite(denominator) ? numerator / denominator : null;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function acceptedTimeEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(
    1e-12,
    64 * Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right)),
  );
}

function validateMeasurementInput(
  input: MainWireNormalAdultFiveWallCycleDiagnosticsInputV2,
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
): void {
  if (samples.length < 4) {
    throw new Error("cycle requires at least four accepted intervals");
  }
  if (samples.length !== input.window.intervals.length) {
    throw new Error("cycle sample and accepted interval counts differ");
  }
  const peakFraction = input.valveOpenThreshold?.peakFraction ?? 0.01;
  const floor = input.valveOpenThreshold?.absoluteFloorMlPerSec ?? 1;
  if (!(peakFraction >= 0 && peakFraction < 1) || !Number.isFinite(peakFraction)) {
    throw new Error("valve peakFraction must lie in [0, 1)");
  }
  if (!(floor >= 0) || !Number.isFinite(floor)) {
    throw new Error("valve absolute floor must be nonnegative and finite");
  }
  for (const wallId of MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1) {
    const volume = input.wallMaterialVolumeMlByWall[wallId];
    if (!(volume > 0) || !Number.isFinite(volume)) {
      throw new Error(`${wallId} wall material volume must be positive and finite`);
    }
  }
  const values: number[] = [];
  for (const sample of samples) collectNumericLeaves(sample, values);
  collectNumericLeaves(input.window.precedingSample.sample, values);
  if (!values.every(Number.isFinite)) {
    throw new Error("cycle accepted readback must be finite");
  }
}

function collectNumericLeaves(value: unknown, target: number[]): void {
  if (typeof value === "number") {
    target.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectNumericLeaves(entry, target));
    return;
  }
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((entry) =>
      collectNumericLeaves(entry, target));
  }
}
