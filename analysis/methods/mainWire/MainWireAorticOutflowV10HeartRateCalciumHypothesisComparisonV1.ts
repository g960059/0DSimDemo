import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticValveObservationStationsV1,
  type MainWireAorticValveObservationStationsV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import type { FiveWallNormalCalciumDriveParamsV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_IDS_V1,
  resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1,
  type MainWireVentricularCalciumHeartRateHypothesisIdV1,
  type MainWireVentricularCalciumHeartRateHypothesisProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_V1_ID,
  resolveMainWireAorticOutflowV10HeartRateCalciumArmV1,
  type MainWireAorticOutflowV10HeartRateCalciumArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";
import type { MainWireNormalAdultFiveWallPeriodicResultV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESIS_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-v10-heart-rate-calcium-hypothesis-comparison-v1" as const;

const EXACT_AUDIT_TOLERANCE = 1e-9;
const ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC = 1e-9;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_OBSERVATION_GEOMETRY_V1 =
  Object.freeze({
    geometryId: "fixed-lvot-2p3cm-aa-3p0cm-v1" as const,
    provenance: "fixed-research-bracket" as const,
    lvotDiameterCm: 2.3 as const,
    ascendingAorticDiameterCm: 3 as const,
    lvotCrossSectionalAreaCm2: Math.PI * (2.3 / 2) ** 2,
    ascendingAorticCrossSectionalAreaCm2: Math.PI * (3 / 2) ** 2,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_FLOW_ET_PEAK_FRACTIONS_V1 =
  Object.freeze([0.001, 0.01, 0.05] as const);

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESIS_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-fixed-arm" as const,
    completedPhysicalTime:
      "completed-beats-times-arm-cycle-length-plus-retained-partial-accepted-steps" as const,
    primaryComparison:
      "heart-rate-50-to-90-trends-within-each-calcium-timing-hypothesis" as const,
    crossHypothesisLevelComparisonIsPrimary: false as const,
    flowThresholdEjectionTime:
      "linearly-interpolated-threshold-crossings-of-the-cyclic-episode-containing-global-positive-flow-peak" as const,
    exactLocalGradientPositiveDuration:
      "linearly-interpolated-zero-crossings-of-the-cyclic-positive-gradient-episode-containing-global-positive-flow-peak" as const,
    pressureStationAveragingDomain:
      "same-strictly-positive-forward-AoV-flow-accepted-endpoints" as const,
    interpretationRequiresPeriod1ConvergenceIntegrationExactStationsAndSingleFlowPeak:
      true as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    derivedAnalysisOnly: true as const,
    smoothingApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    clinicalValveEventEquivalenceClaimedForLocalGradientDuration:
      false as const,
  });

export type MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10HeartRateCalciumArmV1;
    calciumProfile: MainWireVentricularCalciumHeartRateHypothesisProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticOutflowV10HeartRateCalciumThresholdEtV1 = Readonly<{
  peakFraction01: 0.001 | 0.01 | 0.05;
  thresholdMlPerSec: number;
  cyclicEpisodeCount: number;
  primaryEpisodeActiveSampleCount: number;
  extraActiveSampleCountOutsidePrimaryEpisode: number;
  primaryOpeningSampleIndex: number;
  primaryClosingSampleIndex: number;
  primaryContainsGlobalPositiveFlowPeak: true;
  openingInterpolationFractionFromPreviousToFirstActive01: number;
  closingInterpolationFractionFromLastActiveToNext01: number;
  interpolatedEjectionTimeSec: number;
}>;

export type MainWireAorticOutflowV10HeartRateCalciumLocalGradientDurationV1 =
  Readonly<{
    predicate: "exact-local-LV-minus-proximal-port-gradient-greater-than-zero";
    timingSemantics: "pressure-crossing-surrogate-not-valve-event";
    interpolation: "linear-between-adjacent-accepted-endpoint-readbacks";
    cyclicEpisodeCount: number;
    primaryEpisodeActiveSampleCount: number;
    extraActiveSampleCountOutsidePrimaryEpisode: number;
    primaryOpeningSampleIndex: number;
    primaryClosingSampleIndex: number;
    primaryContainsGlobalPositiveFlowPeak: true;
    openingInterpolationFractionFromPreviousToFirstActive01: number;
    closingInterpolationFractionFromLastActiveToNext01: number;
    interpolatedPositiveDurationSec: number;
  }>;

export type MainWireAorticOutflowV10HeartRateCalciumPressureStationsV1 =
  Readonly<{
    averagingDomain: "strictly-positive-forward-AoV-flow-samples";
    positiveForwardFlowSampleCount: number;
    rawLvMinusAorticComplianceNodeGradientMmHg: Readonly<{
      timeMean: number;
      peak: number;
    }>;
    exactLvMinusProximalConstitutivePortGradientMmHg: Readonly<{
      timeMean: number;
      peak: number;
    }>;
    characteristicImpedancePressureMmHg: Readonly<{
      timeMean: number;
      peak: number;
    }>;
  }>;

export type MainWireAorticOutflowV10HeartRateCalciumExactReadbackAuditV1 =
  Readonly<{
    requiredSelectedBeatSampleCount: number;
    availableSelectedBeatSampleCount: number;
    requiredPositiveForwardFlowSampleCount: number;
    availablePositiveForwardFlowSampleCount: number;
    allSelectedBeatSamplesAvailable: true;
    allPositiveForwardFlowSamplesAvailable: true;
    allOpeningDriveStationsExact: boolean;
    maximumAbsoluteValveFlowReadbackResidualMlPerSec: number;
    maximumAbsoluteRawNodeGradientResidualMmHg: number;
    maximumAbsoluteAorticNodeReadbackResidualMmHg: number;
    maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg: number;
    maximumAbsoluteProximalPortReconstructionResidualMmHg: number;
    maximumAbsoluteLocalGradientReconstructionResidualMmHg: number;
    maximumAbsoluteCyclePhaseResidual01: number;
    stationEquationsWithinTolerance: boolean;
  }>;

export type MainWireAorticOutflowV10HeartRateCalciumArmMetricsV1 = Readonly<{
  arm: MainWireAorticOutflowV10HeartRateCalciumArmV1;
  calciumProfileId: MainWireVentricularCalciumHeartRateHypothesisProfileV1["profileId"];
  calciumDriveParameterSetId: string;
  protocolIdentityHash: string;
  calciumDriveStableHash: string;
  terminationReason: MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
  interpretationEligible: boolean;
  periodicSteadyStateClaimed: boolean;
  integrationCompletedWithoutFailure: boolean;
  completedBeatCount: number;
  completedPhysicalTimeSec: number;
  selectedBeatIndex: number;
  selectedBeatSampleCount: number;
  cycleMetrics: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  flowThresholdEjectionTimes: readonly MainWireAorticOutflowV10HeartRateCalciumThresholdEtV1[];
  exactLocalGradientPositiveDuration: MainWireAorticOutflowV10HeartRateCalciumLocalGradientDurationV1;
  pressureStations: MainWireAorticOutflowV10HeartRateCalciumPressureStationsV1;
  observationStations: MainWireAorticValveObservationStationsV1;
  exactReadbackAudit: MainWireAorticOutflowV10HeartRateCalciumExactReadbackAuditV1;
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_TREND_METRIC_IDS_V1 =
  Object.freeze([
    "aortic-ejection-time-proxy-sec",
    "left-ventricular-valve-event-ejection-time-sec",
    "flow-threshold-0p1-percent-et-sec",
    "flow-threshold-1-percent-et-sec",
    "flow-threshold-5-percent-et-sec",
    "exact-local-gradient-positive-duration-sec",
    "acceleration-time-sec",
    "stroke-volume-ml",
    "peak-aortic-flow-ml-per-sec",
    "peak-vena-contracta-velocity-m-per-sec",
    "mean-doppler-gradient-mm-hg",
    "peak-doppler-gradient-mm-hg",
    "isovolumic-contraction-time-sec",
    "isovolumic-relaxation-time-sec",
    "left-ventricular-tei-index",
    "maximum-positive-left-ventricular-dpdt-mm-hg-per-sec",
    "minimum-negative-left-ventricular-dpdt-mm-hg-per-sec",
    "left-ventricular-ejection-fraction-01",
    "net-aortic-cardiac-output-l-per-min",
    "mean-aortic-pressure-mm-hg",
    "distinct-aortic-flow-peak-count",
    "mean-raw-node-gradient-mm-hg",
    "peak-raw-node-gradient-mm-hg",
    "mean-exact-local-gradient-mm-hg",
    "peak-exact-local-gradient-mm-hg",
    "mean-characteristic-pressure-mm-hg",
    "peak-characteristic-pressure-mm-hg",
  ] as const);

export type MainWireAorticOutflowV10HeartRateCalciumTrendMetricIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_TREND_METRIC_IDS_V1)[number];

export type MainWireAorticOutflowV10HeartRateCalciumTrendMetricValuesV1 =
  Readonly<
    Record<
      MainWireAorticOutflowV10HeartRateCalciumTrendMetricIdV1,
      number | null
    >
  >;

export type MainWireAorticOutflowV10HeartRateCalciumTrendMetricRangesV1 =
  Readonly<
    Record<
      MainWireAorticOutflowV10HeartRateCalciumTrendMetricIdV1,
      Readonly<{ minimum: number; maximum: number; span: number }> | null
    >
  >;

export type MainWireAorticOutflowV10HeartRateCalciumHypothesisTrendV1 =
  Readonly<{
    calciumHypothesisId: MainWireVentricularCalciumHeartRateHypothesisIdV1;
    heartRatesBpm: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1;
    armsSortedByHeartRate: readonly MainWireAorticOutflowV10HeartRateCalciumArmMetricsV1[];
    interpretationEligible: boolean;
    heartRate50To90Delta: MainWireAorticOutflowV10HeartRateCalciumTrendMetricValuesV1;
    rangesAcrossHeartRate: MainWireAorticOutflowV10HeartRateCalciumTrendMetricRangesV1;
  }>;

export type MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESIS_COMPARISON_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_V1_ID;
    observationGeometry: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_OBSERVATION_GEOMETRY_V1;
    arms: readonly MainWireAorticOutflowV10HeartRateCalciumArmMetricsV1[];
    hypothesisTrends: readonly MainWireAorticOutflowV10HeartRateCalciumHypothesisTrendV1[];
    allArmsInterpretationEligible: boolean;
    allExactReadbacksAvailable: true;
    allExactReadbackStationEquationsWithinTolerance: boolean;
    allArmsHaveOneDistinctAorticFlowPeak: boolean;
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESIS_COMPARISON_CLAIM_V1;
  }>;

type CyclicEpisode = Readonly<{
  openingIndex: number;
  closingIndex: number;
  activeSampleCount: number;
  episodeCount: number;
  totalActiveSampleCount: number;
}>;

export function compareMainWireAorticOutflowV10HeartRateCalciumHypothesesV1(
  inputs: readonly MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1[],
): MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonV1 {
  const byArmId = new Map<
    MainWireAorticOutflowV10HeartRateCalciumArmV1["armId"],
    MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1
  >();
  for (const input of inputs) {
    if (byArmId.has(input.arm.armId)) {
      throw new Error(`duplicate V10 HR calcium arm: ${input.arm.armId}`);
    }
    byArmId.set(input.arm.armId, input);
  }
  for (const expectedArm of MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1) {
    if (!byArmId.has(expectedArm.armId)) {
      throw new Error(`missing V10 HR calcium arm: ${expectedArm.armId}`);
    }
  }
  if (
    byArmId.size !==
    MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1.length
  ) {
    throw new Error("V10 HR calcium comparison accepts exactly eight arms");
  }

  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_ARMS_V1.map((expectedArm) =>
      measureArm(byArmId.get(expectedArm.armId)!),
    ),
  );
  const hypothesisTrends = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_IDS_V1.map(
      (hypothesisId) => summarizeHypothesisTrend(arms, hypothesisId),
    ),
  );
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESIS_COMPARISON_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_V1_ID,
    observationGeometry:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_OBSERVATION_GEOMETRY_V1,
    arms,
    hypothesisTrends,
    allArmsInterpretationEligible: arms.every(
      (arm) => arm.interpretationEligible,
    ),
    allExactReadbacksAvailable: true as const,
    allExactReadbackStationEquationsWithinTolerance: arms.every(
      (arm) => arm.exactReadbackAudit.stationEquationsWithinTolerance,
    ),
    allArmsHaveOneDistinctAorticFlowPeak: arms.every(
      (arm) =>
        arm.cycleMetrics.aorticFlowDistinctPeakCountAboveFivePercent === 1,
    ),
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESES_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_HYPOTHESIS_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1,
): MainWireAorticOutflowV10HeartRateCalciumArmMetricsV1 {
  validateInputIdentity(input);
  const { arm, calciumDriveParams, periodicResult: result } = input;
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${arm.armId} requires a retained complete beat`);
  }
  if (beat.samples.length !== arm.stepsPerCycle) {
    throw new Error(`${arm.armId} selected beat sample count mismatch`);
  }
  const beatDurationSec = beat.endTimeSec - beat.startTimeSec;
  const firstSampleTimeSec = beat.samples[0]!.timeSec;
  const lastSampleTimeSec = beat.samples.at(-1)!.timeSec;
  if (
    Math.abs(beatDurationSec - arm.cycleLengthSec) >
      ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC ||
    Math.abs(firstSampleTimeSec - (beat.startTimeSec + result.dtSec)) >
      ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC ||
    Math.abs(lastSampleTimeSec - beat.endTimeSec) >
      ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC
  ) {
    throw new Error(`${arm.armId} selected beat cycle chronology mismatch`);
  }
  const cycleMetrics = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumDriveParams,
    arm.armId,
  );
  const observationStations = measureMainWireAorticValveObservationStationsV1(
    result,
    MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_OBSERVATION_GEOMETRY_V1,
  );
  const flows = beat.samples.map((sample, index) => {
    const flow = sample.valveHydraulics.AoV.flowMlPerSec;
    finite(flow, `${arm.armId} sample ${index} AoV flow`);
    return flow;
  });
  const positivePeakFlow = maximum(flows);
  if (!(positivePeakFlow > 0)) {
    throw new Error(`${arm.armId} requires positive AoV peak flow`);
  }
  const peakIndex = flows.indexOf(positivePeakFlow);
  const flowThresholdEjectionTimes = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_FLOW_ET_PEAK_FRACTIONS_V1.map(
      (fraction) =>
        measureThresholdEt(flows, peakIndex, fraction, result.dtSec),
    ),
  );
  const stationMeasurement = measureExactStationsAndAudit(
    result,
    arm.cycleLengthSec,
    peakIndex,
  );
  return Object.freeze({
    arm,
    calciumProfileId: input.calciumProfile.profileId,
    calciumDriveParameterSetId: calciumDriveParams.parameterSetId,
    protocolIdentityHash: result.protocolIdentityHash,
    calciumDriveStableHash:
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash,
    terminationReason: result.terminationReason,
    interpretationEligible:
      result.periodicSteadyStateClaimed &&
      result.integrationCompletedWithoutFailure &&
      stationMeasurement.exactReadbackAudit.stationEquationsWithinTolerance &&
      cycleMetrics.aorticFlowDistinctPeakCountAboveFivePercent === 1,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    completedBeatCount: result.completedBeatCount,
    completedPhysicalTimeSec:
      result.completedBeatCount * arm.cycleLengthSec +
      result.retainedPartialBeat.length * result.dtSec,
    selectedBeatIndex: beat.beatIndex,
    selectedBeatSampleCount: beat.samples.length,
    cycleMetrics,
    flowThresholdEjectionTimes,
    exactLocalGradientPositiveDuration:
      stationMeasurement.exactLocalGradientPositiveDuration,
    pressureStations: stationMeasurement.pressureStations,
    observationStations,
    exactReadbackAudit: stationMeasurement.exactReadbackAudit,
  });
}

function validateInputIdentity(
  input: MainWireAorticOutflowV10HeartRateCalciumHypothesisComparisonInputV1,
): void {
  const { arm, calciumProfile: profile, calciumDriveParams: params } = input;
  const result = input.periodicResult;
  const expectedArm = resolveMainWireAorticOutflowV10HeartRateCalciumArmV1(
    arm.armId,
  );
  const expectedProfile =
    resolveMainWireVentricularCalciumHeartRateHypothesisProfileV1(
      expectedArm.calciumProfileId,
    );
  if (protocolHash(arm) !== protocolHash(expectedArm))
    throw new Error(`${arm.armId} arm identity mismatch`);
  if (
    protocolHash(profile) !== protocolHash(expectedProfile) ||
    profile.profileId !== arm.calciumProfileId
  )
    throw new Error(`${arm.armId} calcium profile identity mismatch`);
  if (
    !nearlyEqual(params.cycleLengthSec, arm.cycleLengthSec) ||
    !nearlyEqual(
      params.atrioventricularDelaySec,
      profile.atrioventricularDelaySec,
    )
  )
    throw new Error(`${arm.armId} calcium parameter cycle mismatch`);
  if (
    result.protocolIdentity.calciumDrive.parameterSetId !==
      params.parameterSetId ||
    protocolHash(params) !==
      result.protocolIdentity.calciumDrive.fixedParamsStableHash ||
    result.protocolIdentity.calciumDrive.fixedParamsStableHash !==
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash
  )
    throw new Error(`${arm.armId} calcium protocol identity mismatch`);
  if (
    !nearlyEqual(result.dtSec, arm.dtSec) ||
    result.stepsPerBeat !== arm.stepsPerCycle ||
    !nearlyEqual(result.dtSec * result.stepsPerBeat, arm.cycleLengthSec) ||
    !nearlyEqual(result.claim.heartRateBpm, arm.heartRateBpm)
  )
    throw new Error(`${arm.armId} periodic timebase mismatch`);
  if (result.initialization !== "canonical") {
    throw new Error(
      `${arm.armId} must use an independent canonical cold start`,
    );
  }
  if (result.valveResearchInput.valves.AoV.maximumForwardEoaCm2 !== 3.5) {
    throw new Error(`${arm.armId} V10-reference aortic EOA mismatch`);
  }
}

function measureThresholdEt(
  flows: readonly number[],
  peakIndex: number,
  peakFraction01: 0.001 | 0.01 | 0.05,
  dtSec: number,
): MainWireAorticOutflowV10HeartRateCalciumThresholdEtV1 {
  const threshold = flows[peakIndex]! * peakFraction01;
  const shifted = flows.map((flow) => flow - threshold);
  const episode = primaryCyclicPositiveEpisode(shifted, peakIndex);
  const interpolation = interpolatedEpisodeDuration(shifted, episode, dtSec);
  return Object.freeze({
    peakFraction01,
    thresholdMlPerSec: threshold,
    cyclicEpisodeCount: episode.episodeCount,
    primaryEpisodeActiveSampleCount: episode.activeSampleCount,
    extraActiveSampleCountOutsidePrimaryEpisode:
      episode.totalActiveSampleCount - episode.activeSampleCount,
    primaryOpeningSampleIndex: episode.openingIndex,
    primaryClosingSampleIndex: episode.closingIndex,
    primaryContainsGlobalPositiveFlowPeak: true as const,
    openingInterpolationFractionFromPreviousToFirstActive01:
      interpolation.openingInterpolationFractionFromPreviousToFirstActive01,
    closingInterpolationFractionFromLastActiveToNext01:
      interpolation.closingInterpolationFractionFromLastActiveToNext01,
    interpolatedEjectionTimeSec: interpolation.interpolatedDurationSec,
  });
}

function measureExactStationsAndAudit(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  cycleLengthSec: number,
  positiveFlowPeakIndex: number,
): Readonly<{
  pressureStations: MainWireAorticOutflowV10HeartRateCalciumPressureStationsV1;
  exactLocalGradientPositiveDuration: MainWireAorticOutflowV10HeartRateCalciumLocalGradientDurationV1;
  exactReadbackAudit: MainWireAorticOutflowV10HeartRateCalciumExactReadbackAuditV1;
}> {
  const beat = result.retainedCompleteBeats.at(-1)!;
  const rawGradients: number[] = [];
  const localGradients: number[] = [];
  const characteristicPressures: number[] = [];
  let exactReadbackCount = 0;
  let positiveReadbackCount = 0;
  let allOpeningDriveStationsExact = true;
  let maximumAbsoluteValveFlowReadbackResidualMlPerSec = 0;
  let maximumAbsoluteRawNodeGradientResidualMmHg = 0;
  let maximumAbsoluteAorticNodeReadbackResidualMmHg = 0;
  let maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg = 0;
  let maximumAbsoluteProximalPortReconstructionResidualMmHg = 0;
  let maximumAbsoluteLocalGradientReconstructionResidualMmHg = 0;
  let maximumAbsoluteCyclePhaseResidual01 = 0;
  const allLocalGradients: number[] = [];

  for (let index = 0; index < beat.samples.length; index += 1) {
    const sample = beat.samples[index]!;
    const valve = sample.valveHydraulics.AoV;
    const exact = valve.recoveredRootPortExactReadback;
    if (exact === undefined) {
      throw new Error(
        `exact proximal-port readback missing at sample ${index}`,
      );
    }
    exactReadbackCount += 1;
    const lv = sample.circulationNodeAbsolutePressureMmHg.LV;
    const ao = sample.circulationNodeAbsolutePressureMmHg.Ao;
    const flow = valve.flowMlPerSec;
    const rawGradient = lv - ao;
    const reconstructedCharacteristic =
      exact.algebraicProximalConstitutivePortPressureMmHg - ao;
    const reconstructedPort = ao + exact.characteristicImpedancePressureMmHg;
    const reconstructedLocal =
      lv - exact.algebraicProximalConstitutivePortPressureMmHg;
    const expectedPhase =
      positiveModulo(sample.timeSec, cycleLengthSec) / cycleLengthSec;
    const phaseResidual = Math.abs(
      signedShortestPhaseDifference01(sample.cyclePhase01 - expectedPhase),
    );
    maximumAbsoluteValveFlowReadbackResidualMlPerSec = Math.max(
      maximumAbsoluteValveFlowReadbackResidualMlPerSec,
      Math.abs(flow - sample.circulationEdgeFlowMlPerSec.AoV),
    );
    maximumAbsoluteRawNodeGradientResidualMmHg = Math.max(
      maximumAbsoluteRawNodeGradientResidualMmHg,
      Math.abs(valve.pressureGradientMmHg - rawGradient),
    );
    maximumAbsoluteAorticNodeReadbackResidualMmHg = Math.max(
      maximumAbsoluteAorticNodeReadbackResidualMmHg,
      Math.abs(exact.aorticComplianceNodePressureMmHg - ao),
    );
    maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg = Math.max(
      maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg,
      Math.abs(
        exact.characteristicImpedancePressureMmHg - reconstructedCharacteristic,
      ),
    );
    maximumAbsoluteProximalPortReconstructionResidualMmHg = Math.max(
      maximumAbsoluteProximalPortReconstructionResidualMmHg,
      Math.abs(
        exact.algebraicProximalConstitutivePortPressureMmHg - reconstructedPort,
      ),
    );
    maximumAbsoluteLocalGradientReconstructionResidualMmHg = Math.max(
      maximumAbsoluteLocalGradientReconstructionResidualMmHg,
      Math.abs(exact.localValvePressureGradientMmHg - reconstructedLocal),
    );
    maximumAbsoluteCyclePhaseResidual01 = Math.max(
      maximumAbsoluteCyclePhaseResidual01,
      phaseResidual,
    );
    allOpeningDriveStationsExact &&=
      exact.openingDrivePressureStation ===
      "LV-minus-proximal-constitutive-port";
    allLocalGradients.push(exact.localValvePressureGradientMmHg);
    if (flow > 0) {
      positiveReadbackCount += 1;
      rawGradients.push(rawGradient);
      localGradients.push(exact.localValvePressureGradientMmHg);
      characteristicPressures.push(exact.characteristicImpedancePressureMmHg);
    }
  }
  if (rawGradients.length === 0) {
    throw new Error("exact station analysis requires positive forward flow");
  }
  if (maximumAbsoluteCyclePhaseResidual01 > EXACT_AUDIT_TOLERANCE) {
    throw new Error("selected beat cycle phase mismatch");
  }
  const gradientEpisode = primaryCyclicPositiveEpisode(
    allLocalGradients,
    positiveFlowPeakIndex,
  );
  const gradientInterpolation = interpolatedEpisodeDuration(
    allLocalGradients,
    gradientEpisode,
    result.dtSec,
  );
  const stationEquationsWithinTolerance =
    allOpeningDriveStationsExact &&
    maximumAbsoluteValveFlowReadbackResidualMlPerSec <= EXACT_AUDIT_TOLERANCE &&
    maximumAbsoluteRawNodeGradientResidualMmHg <= EXACT_AUDIT_TOLERANCE &&
    maximumAbsoluteAorticNodeReadbackResidualMmHg <= EXACT_AUDIT_TOLERANCE &&
    maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg <=
      EXACT_AUDIT_TOLERANCE &&
    maximumAbsoluteProximalPortReconstructionResidualMmHg <=
      EXACT_AUDIT_TOLERANCE &&
    maximumAbsoluteLocalGradientReconstructionResidualMmHg <=
      EXACT_AUDIT_TOLERANCE &&
    maximumAbsoluteCyclePhaseResidual01 <= EXACT_AUDIT_TOLERANCE;
  return Object.freeze({
    pressureStations: Object.freeze({
      averagingDomain: "strictly-positive-forward-AoV-flow-samples" as const,
      positiveForwardFlowSampleCount: rawGradients.length,
      rawLvMinusAorticComplianceNodeGradientMmHg: meanAndPeak(rawGradients),
      exactLvMinusProximalConstitutivePortGradientMmHg:
        meanAndPeak(localGradients),
      characteristicImpedancePressureMmHg: meanAndPeak(characteristicPressures),
    }),
    exactLocalGradientPositiveDuration: Object.freeze({
      predicate:
        "exact-local-LV-minus-proximal-port-gradient-greater-than-zero" as const,
      timingSemantics: "pressure-crossing-surrogate-not-valve-event" as const,
      interpolation:
        "linear-between-adjacent-accepted-endpoint-readbacks" as const,
      cyclicEpisodeCount: gradientEpisode.episodeCount,
      primaryEpisodeActiveSampleCount: gradientEpisode.activeSampleCount,
      extraActiveSampleCountOutsidePrimaryEpisode:
        gradientEpisode.totalActiveSampleCount -
        gradientEpisode.activeSampleCount,
      primaryOpeningSampleIndex: gradientEpisode.openingIndex,
      primaryClosingSampleIndex: gradientEpisode.closingIndex,
      primaryContainsGlobalPositiveFlowPeak: true as const,
      openingInterpolationFractionFromPreviousToFirstActive01:
        gradientInterpolation.openingInterpolationFractionFromPreviousToFirstActive01,
      closingInterpolationFractionFromLastActiveToNext01:
        gradientInterpolation.closingInterpolationFractionFromLastActiveToNext01,
      interpolatedPositiveDurationSec:
        gradientInterpolation.interpolatedDurationSec,
    }),
    exactReadbackAudit: Object.freeze({
      requiredSelectedBeatSampleCount: beat.samples.length,
      availableSelectedBeatSampleCount: exactReadbackCount,
      requiredPositiveForwardFlowSampleCount: rawGradients.length,
      availablePositiveForwardFlowSampleCount: positiveReadbackCount,
      allSelectedBeatSamplesAvailable: true as const,
      allPositiveForwardFlowSamplesAvailable: true as const,
      allOpeningDriveStationsExact,
      maximumAbsoluteValveFlowReadbackResidualMlPerSec,
      maximumAbsoluteRawNodeGradientResidualMmHg,
      maximumAbsoluteAorticNodeReadbackResidualMmHg,
      maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg,
      maximumAbsoluteProximalPortReconstructionResidualMmHg,
      maximumAbsoluteLocalGradientReconstructionResidualMmHg,
      maximumAbsoluteCyclePhaseResidual01,
      stationEquationsWithinTolerance,
    }),
  });
}

function primaryCyclicPositiveEpisode(
  values: readonly number[],
  requiredIndex: number,
): CyclicEpisode {
  if (values.length < 3) {
    throw new Error(
      "cyclic episode measurement requires at least three samples",
    );
  }
  if (!(requiredIndex >= 0 && requiredIndex < values.length)) {
    throw new Error("required cyclic episode index is out of range");
  }
  const active = values.map((value, index) => {
    finite(value, `cyclic episode sample ${index}`);
    return value > 0;
  });
  if (!active[requiredIndex]) {
    throw new Error("primary cyclic episode does not contain required peak");
  }
  const totalActiveSampleCount = active.filter(Boolean).length;
  if (totalActiveSampleCount === values.length) {
    throw new Error("cyclic episode has no bracketing inactive samples");
  }
  const starts = active.reduce<number[]>((indices, current, index) => {
    const previous = active[(index - 1 + active.length) % active.length]!;
    if (current && !previous) indices.push(index);
    return indices;
  }, []);
  let openingIndex = requiredIndex;
  while (active[(openingIndex - 1 + active.length) % active.length]) {
    openingIndex = (openingIndex - 1 + active.length) % active.length;
  }
  let closingIndex = requiredIndex;
  while (active[(closingIndex + 1) % active.length]) {
    closingIndex = (closingIndex + 1) % active.length;
  }
  const activeSampleCount =
    ((closingIndex - openingIndex + active.length) % active.length) + 1;
  return Object.freeze({
    openingIndex,
    closingIndex,
    activeSampleCount,
    episodeCount: starts.length,
    totalActiveSampleCount,
  });
}

function interpolatedEpisodeDuration(
  shiftedValues: readonly number[],
  episode: CyclicEpisode,
  dtSec: number,
): Readonly<{
  openingInterpolationFractionFromPreviousToFirstActive01: number;
  closingInterpolationFractionFromLastActiveToNext01: number;
  interpolatedDurationSec: number;
}> {
  const previousIndex =
    (episode.openingIndex - 1 + shiftedValues.length) % shiftedValues.length;
  const nextIndex = (episode.closingIndex + 1) % shiftedValues.length;
  const previous = shiftedValues[previousIndex]!;
  const first = shiftedValues[episode.openingIndex]!;
  const last = shiftedValues[episode.closingIndex]!;
  const next = shiftedValues[nextIndex]!;
  if (!(previous <= 0 && first > 0 && last > 0 && next <= 0)) {
    throw new Error("cyclic episode boundaries do not bracket zero");
  }
  const openingFraction = zeroCrossingFraction(previous, first);
  const closingFraction = zeroCrossingFraction(last, next);
  const interpolatedDurationSec =
    (episode.activeSampleCount + closingFraction - openingFraction) * dtSec;
  if (
    !(interpolatedDurationSec > 0) ||
    interpolatedDurationSec > shiftedValues.length * dtSec ||
    !Number.isFinite(interpolatedDurationSec)
  )
    throw new Error("interpolated cyclic episode duration is invalid");
  return Object.freeze({
    openingInterpolationFractionFromPreviousToFirstActive01: openingFraction,
    closingInterpolationFractionFromLastActiveToNext01: closingFraction,
    interpolatedDurationSec,
  });
}

function summarizeHypothesisTrend(
  arms: readonly MainWireAorticOutflowV10HeartRateCalciumArmMetricsV1[],
  hypothesisId: MainWireVentricularCalciumHeartRateHypothesisIdV1,
): MainWireAorticOutflowV10HeartRateCalciumHypothesisTrendV1 {
  const selected = arms
    .filter((arm) => arm.arm.calciumHypothesisId === hypothesisId)
    .sort((left, right) => left.arm.heartRateBpm - right.arm.heartRateBpm);
  if (
    selected.length !==
      MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1.length ||
    selected.some(
      (arm, index) =>
        arm.arm.heartRateBpm !==
        MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1[
          index
        ],
    )
  )
    throw new Error(`${hypothesisId} is missing a required heart-rate arm`);
  const snapshots = selected.map(trendMetricValues);
  const low = snapshots[0]!;
  const high = snapshots.at(-1)!;
  const deltaEntries =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_TREND_METRIC_IDS_V1.map(
      (metricId) => {
        const lowValue = low[metricId];
        const highValue = high[metricId];
        return [
          metricId,
          lowValue === null || highValue === null ? null : highValue - lowValue,
        ] as const;
      },
    );
  const rangeEntries =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_TREND_METRIC_IDS_V1.map(
      (metricId) => {
        const values = snapshots.map((snapshot) => snapshot[metricId]);
        if (values.some((value) => value === null)) {
          return [metricId, null] as const;
        }
        const finiteValues = values as number[];
        const minimum = Math.min(...finiteValues);
        const maximum = Math.max(...finiteValues);
        return [
          metricId,
          Object.freeze({
            minimum,
            maximum,
            span: maximum - minimum,
          }),
        ] as const;
      },
    );
  return Object.freeze({
    calciumHypothesisId: hypothesisId,
    heartRatesBpm:
      MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_HEART_RATES_BPM_V1,
    armsSortedByHeartRate: Object.freeze(selected),
    interpretationEligible: selected.every((arm) => arm.interpretationEligible),
    heartRate50To90Delta: Object.freeze(
      Object.fromEntries(deltaEntries),
    ) as MainWireAorticOutflowV10HeartRateCalciumTrendMetricValuesV1,
    rangesAcrossHeartRate: Object.freeze(
      Object.fromEntries(rangeEntries),
    ) as MainWireAorticOutflowV10HeartRateCalciumTrendMetricRangesV1,
  });
}

function trendMetricValues(
  arm: MainWireAorticOutflowV10HeartRateCalciumArmMetricsV1,
): MainWireAorticOutflowV10HeartRateCalciumTrendMetricValuesV1 {
  const cycle = arm.cycleMetrics;
  const thresholdEt = (fraction: 0.001 | 0.01 | 0.05): number =>
    arm.flowThresholdEjectionTimes.find(
      (entry) => entry.peakFraction01 === fraction,
    )!.interpolatedEjectionTimeSec;
  return Object.freeze({
    "aortic-ejection-time-proxy-sec": cycle.aorticEjectionTimeProxySec,
    "left-ventricular-valve-event-ejection-time-sec":
      cycle.leftVentricularValveEventEjectionTimeSec,
    "flow-threshold-0p1-percent-et-sec": thresholdEt(0.001),
    "flow-threshold-1-percent-et-sec": thresholdEt(0.01),
    "flow-threshold-5-percent-et-sec": thresholdEt(0.05),
    "exact-local-gradient-positive-duration-sec":
      arm.exactLocalGradientPositiveDuration.interpolatedPositiveDurationSec,
    "acceleration-time-sec": cycle.timeFromAorticFlowOnsetToPeakSec,
    "stroke-volume-ml": cycle.aorticForwardVolumeMl,
    "peak-aortic-flow-ml-per-sec": cycle.aorticMaximumFlowMlPerSec,
    "peak-vena-contracta-velocity-m-per-sec":
      cycle.peakVenaContractaVelocityMPerSec,
    "mean-doppler-gradient-mm-hg": cycle.meanDopplerGradientMmHg,
    "peak-doppler-gradient-mm-hg": cycle.peakDopplerGradientMmHg,
    "isovolumic-contraction-time-sec":
      cycle.leftVentricularIsovolumicContractionTimeSec,
    "isovolumic-relaxation-time-sec":
      cycle.leftVentricularIsovolumicRelaxationTimeSec,
    "left-ventricular-tei-index": cycle.leftVentricularTeiIndex,
    "maximum-positive-left-ventricular-dpdt-mm-hg-per-sec":
      cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    "minimum-negative-left-ventricular-dpdt-mm-hg-per-sec":
      cycle.minimumNegativeLeftVentricularPressureFallRateMmHgPerSec,
    "left-ventricular-ejection-fraction-01":
      cycle.leftVentricularEjectionFraction01,
    "net-aortic-cardiac-output-l-per-min": cycle.netAorticCardiacOutputLPerMin,
    "mean-aortic-pressure-mm-hg": cycle.meanAorticAbsolutePressureMmHg,
    "distinct-aortic-flow-peak-count":
      cycle.aorticFlowDistinctPeakCountAboveFivePercent,
    "mean-raw-node-gradient-mm-hg":
      arm.pressureStations.rawLvMinusAorticComplianceNodeGradientMmHg.timeMean,
    "peak-raw-node-gradient-mm-hg":
      arm.pressureStations.rawLvMinusAorticComplianceNodeGradientMmHg.peak,
    "mean-exact-local-gradient-mm-hg":
      arm.pressureStations.exactLvMinusProximalConstitutivePortGradientMmHg
        .timeMean,
    "peak-exact-local-gradient-mm-hg":
      arm.pressureStations.exactLvMinusProximalConstitutivePortGradientMmHg
        .peak,
    "mean-characteristic-pressure-mm-hg":
      arm.pressureStations.characteristicImpedancePressureMmHg.timeMean,
    "peak-characteristic-pressure-mm-hg":
      arm.pressureStations.characteristicImpedancePressureMmHg.peak,
  });
}

function meanAndPeak(values: readonly number[]): Readonly<{
  timeMean: number;
  peak: number;
}> {
  if (values.length === 0) throw new Error("mean and peak require values");
  return Object.freeze({
    timeMean: values.reduce((sum, value) => sum + value, 0) / values.length,
    peak: maximum(values),
  });
}

function zeroCrossingFraction(left: number, right: number): number {
  const denominator = right - left;
  if (denominator === 0) {
    throw new Error("zero crossing requires distinct bracketing values");
  }
  const fraction = -left / denominator;
  if (!(fraction >= 0 && fraction <= 1) || !Number.isFinite(fraction)) {
    throw new Error("zero crossing interpolation fraction is invalid");
  }
  return fraction;
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function signedShortestPhaseDifference01(value: number): number {
  return positiveModulo(value + 0.5, 1) - 0.5;
}

function nearlyEqual(left: number, right: number): boolean {
  return (
    Math.abs(left - right) <=
    1e-12 * Math.max(1, Math.abs(left), Math.abs(right))
  );
}

function protocolHash(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
