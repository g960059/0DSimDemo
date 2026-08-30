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
  resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1,
  type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1,
  type MainWireVentricularCalciumMatchedAlphaTimingPolicyV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_V1_ID,
  resolveMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
  type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import type { MainWireNormalAdultFiveWallPeriodicResultV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-timing-policy-bridge-comparison-v1" as const;

const EXACT_AUDIT_TOLERANCE = 1e-9;
const ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC = 1e-9;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_OBSERVATION_GEOMETRY_V1 =
  Object.freeze({
    geometryId: "fixed-lvot-2p3cm-aa-3p0cm-v1" as const,
    provenance: "fixed-research-bracket" as const,
    lvotDiameterCm: 2.3 as const,
    ascendingAorticDiameterCm: 3 as const,
    lvotCrossSectionalAreaCm2: Math.PI * (2.3 / 2) ** 2,
    ascendingAorticCrossSectionalAreaCm2: Math.PI * (3 / 2) ** 2,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COPENHAGEN_REFERENCE_V1 =
  Object.freeze({
    source: "healthy-adult-TDI-M-mode-cardiac-time-interval-reference" as const,
    doi: "10.1007/s00392-023-02269-2" as const,
    leftVentricularEjectionTime: Object.freeze({
      correction: "raw-ms-plus-1p4-times-heart-rate-bpm" as const,
      coefficientMsPerBpm: 1.4 as const,
      correctedPredictionInterval95Ms: Object.freeze([347, 415] as const),
    }),
    isovolumicContractionTime: Object.freeze({
      correction: "raw-ms-plus-0p15-times-heart-rate-bpm" as const,
      coefficientMsPerBpm: 0.15 as const,
      correctedPredictionInterval95Ms: Object.freeze([30, 68] as const),
    }),
    isovolumicRelaxationTime: Object.freeze({
      correction: "raw-ms-plus-0p27-times-heart-rate-bpm" as const,
      coefficientMsPerBpm: 0.27 as const,
      correctedPredictionInterval95Ms: Object.freeze([76, 151] as const),
    }),
    clinicalMeasurementEquivalenceClaimed: false as const,
    clinicalValidationClaimed: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-fixed-arm" as const,
    primaryEjectionTime:
      "linearly-interpolated-one-percent-global-positive-AoV-flow-cyclic-episode" as const,
    secondaryEjectionTime:
      "direct-model-left-ventricular-valve-event-analogue" as const,
    primaryEstimand:
      "rr-scaled-tau-HR90-minus-HR50-change-minus-fixed-absolute-time-HR90-minus-HR50-change" as const,
    exactPressureStationIdentity:
      "LV-minus-Ao-equals-LV-minus-proximal-port-plus-characteristic-impedance-pressure" as const,
    interpretationRequiresPeriod1ConvergenceIntegrationExactStationsAndSingleFlowPeak:
      true as const,
    copenhagenCorrectionAppliedToDirectValveEventAnaloguesOnly: true as const,
    correctedTeiIndexConstructed: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    derivedAnalysisOnly: true as const,
    smoothingApplied: false as const,
    parameterSearchOrFitting: false as const,
  });

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonInputV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1;
    calciumProfile: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeOnePercentEtV1 =
  Readonly<{
    peakFraction01: 0.01;
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

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExactPressureStationsV1 =
  Readonly<{
    averagingDomain: "strictly-positive-forward-AoV-flow-samples";
    positiveForwardFlowSampleCount: number;
    rawLvMinusAorticComplianceNodeGradientMmHg: MeanAndPeak;
    exactLvMinusProximalConstitutivePortGradientMmHg: MeanAndPeak;
    characteristicImpedancePressureMmHg: MeanAndPeak;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExactReadbackAuditV1 =
  Readonly<{
    requiredSelectedBeatSampleCount: number;
    availableSelectedBeatSampleCount: number;
    allSelectedBeatSamplesAvailable: true;
    allOpeningDriveStationsExact: boolean;
    maximumAbsoluteValveFlowReadbackResidualMlPerSec: number;
    maximumAbsoluteRawNodeGradientResidualMmHg: number;
    maximumAbsoluteAorticNodeReadbackResidualMmHg: number;
    maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg: number;
    maximumAbsoluteProximalPortReconstructionResidualMmHg: number;
    maximumAbsoluteLocalGradientReconstructionResidualMmHg: number;
    maximumAbsoluteStationAdditivityResidualMmHg: number;
    maximumAbsoluteCyclePhaseResidual01: number;
    stationEquationsWithinTolerance: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeCorrectedTimingReadoutV1 =
  Readonly<{
    rawSec: number | null;
    rawMs: number | null;
    correctionCoefficientMsPerBpm: number;
    correctionAddedMs: number;
    correctedMs: number | null;
    correctedPredictionInterval95Ms: readonly [number, number];
    withinCorrectedPredictionInterval95: boolean | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeCopenhagenReadoutV1 =
  Readonly<{
    heartRateBpm: 50 | 90;
    leftVentricularEjectionTime: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeCorrectedTimingReadoutV1;
    isovolumicContractionTime: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeCorrectedTimingReadoutV1;
    isovolumicRelaxationTime: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeCorrectedTimingReadoutV1;
    rawLeftVentricularTeiIndex: number | null;
    correctedTeiIndexConstructed: false;
    clinicalMeasurementEquivalenceClaimed: false;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1;
    calciumProfileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1["profileId"];
    calciumDriveParameterSetId: string;
    protocolIdentityHash: string;
    calciumDriveStableHash: string;
    terminationReason: MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
    periodicSteadyStateClaimed: boolean;
    integrationCompletedWithoutFailure: boolean;
    period1AndIntegrationPassed: boolean;
    completedBeatCount: number;
    completedPhysicalTimeSec: number;
    selectedBeatIndex: number;
    selectedBeatSampleCount: number;
    singleDistinctAorticFlowPeakPassed: boolean;
    exactStationAuditPassed: boolean;
    interpretationEligible: boolean;
    cycleMetrics: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    onePercentFlowEjectionTime: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeOnePercentEtV1;
    exactPressureStations: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExactPressureStationsV1;
    observationStations: MainWireAorticValveObservationStationsV1;
    exactReadbackAudit: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExactReadbackAuditV1;
    copenhagenTimingReadout: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeCopenhagenReadoutV1;
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_METRIC_IDS_V1 =
  Object.freeze([
    "flow-threshold-1-percent-ejection-time-sec",
    "left-ventricular-valve-event-ejection-time-sec",
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
  ] as const);

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeMetricIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_METRIC_IDS_V1)[number];

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeMetricContrastV1 =
  Readonly<{
    metricId: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeMetricIdV1;
    fixedAbsoluteTimeHr50: number | null;
    fixedAbsoluteTimeHr90: number | null;
    fixedAbsoluteTimeHr90Minus50: number | null;
    rrScaledTauHr50: number | null;
    rrScaledTauHr90: number | null;
    rrScaledTauHr90Minus50: number | null;
    differenceOfDifferences: number | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COMPARISON_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_V1_ID;
    arms: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1[];
    metricContrasts: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeMetricContrastV1[];
    allArmsInterpretationEligible: boolean;
    allArmsPeriod1AndIntegrationPassed: boolean;
    allArmsHaveOneDistinctAorticFlowPeak: boolean;
    allExactReadbacksAvailable: true;
    allExactReadbackStationEquationsWithinTolerance: boolean;
    observationGeometry: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_OBSERVATION_GEOMETRY_V1;
    copenhagenReference: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COPENHAGEN_REFERENCE_V1;
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COMPARISON_CLAIM_V1;
  }>;

type MeanAndPeak = Readonly<{ timeMean: number; peak: number }>;

type CyclicEpisode = Readonly<{
  openingIndex: number;
  closingIndex: number;
  activeSampleCount: number;
  episodeCount: number;
  totalActiveSampleCount: number;
}>;

export function compareMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1(
  inputs: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonInputV1[],
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonV1 {
  const byArmId = new Map<
    MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1["armId"],
    MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonInputV1
  >();
  for (const input of inputs) {
    if (byArmId.has(input.arm.armId)) {
      throw new Error(
        `duplicate V10 matched-alpha bridge arm: ${input.arm.armId}`,
      );
    }
    byArmId.set(input.arm.armId, input);
  }
  for (const expectedArm of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1) {
    if (!byArmId.has(expectedArm.armId)) {
      throw new Error(
        `missing V10 matched-alpha bridge arm: ${expectedArm.armId}`,
      );
    }
  }
  if (
    byArmId.size !==
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.length
  ) {
    throw new Error(
      "V10 matched-alpha bridge comparison accepts exactly four arms",
    );
  }

  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
      (arm) => measureArm(byArmId.get(arm.armId)!),
    ),
  );
  const fixed50 = selectArm(arms, "fixed-absolute-time", 50);
  const fixed90 = selectArm(arms, "fixed-absolute-time", 90);
  const rrScaled50 = selectArm(arms, "rr-scaled-tau", 50);
  const rrScaled90 = selectArm(arms, "rr-scaled-tau", 90);
  const metricContrasts = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_METRIC_IDS_V1.map(
      (metricId) =>
        metricContrast(metricId, fixed50, fixed90, rrScaled50, rrScaled90),
    ),
  );

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COMPARISON_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_V1_ID,
    arms,
    metricContrasts,
    allArmsInterpretationEligible: arms.every(
      (arm) => arm.interpretationEligible,
    ),
    allArmsPeriod1AndIntegrationPassed: arms.every(
      (arm) => arm.period1AndIntegrationPassed,
    ),
    allArmsHaveOneDistinctAorticFlowPeak: arms.every(
      (arm) => arm.singleDistinctAorticFlowPeakPassed,
    ),
    allExactReadbacksAvailable: true as const,
    allExactReadbackStationEquationsWithinTolerance: arms.every(
      (arm) => arm.exactStationAuditPassed,
    ),
    observationGeometry:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_OBSERVATION_GEOMETRY_V1,
    copenhagenReference:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COPENHAGEN_REFERENCE_V1,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonInputV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1 {
  validateInputIdentity(input);
  const { arm, calciumDriveParams, periodicResult: result } = input;
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${arm.armId} requires a retained complete beat`);
  }
  if (beat.samples.length !== arm.stepsPerCycle) {
    throw new Error(`${arm.armId} selected beat sample count mismatch`);
  }
  const firstSampleTimeSec = beat.samples[0]!.timeSec;
  const lastSampleTimeSec = beat.samples.at(-1)!.timeSec;
  if (
    Math.abs(beat.endTimeSec - beat.startTimeSec - arm.cycleLengthSec) >
      ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC ||
    Math.abs(firstSampleTimeSec - beat.startTimeSec - result.dtSec) >
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
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_OBSERVATION_GEOMETRY_V1,
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
  const onePercentFlowEjectionTime = measureOnePercentEt(
    flows,
    peakIndex,
    result.dtSec,
  );
  const exactStations = measureExactStationsAndAudit(
    result,
    arm.cycleLengthSec,
  );
  const period1AndIntegrationPassed =
    result.periodicSteadyStateClaimed &&
    result.integrationCompletedWithoutFailure;
  const singleDistinctAorticFlowPeakPassed =
    cycleMetrics.aorticFlowDistinctPeakCountAboveFivePercent === 1;
  const exactStationAuditPassed =
    exactStations.exactReadbackAudit.stationEquationsWithinTolerance;

  return Object.freeze({
    arm,
    calciumProfileId: input.calciumProfile.profileId,
    calciumDriveParameterSetId: calciumDriveParams.parameterSetId,
    protocolIdentityHash: result.protocolIdentityHash,
    calciumDriveStableHash:
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash,
    terminationReason: result.terminationReason,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    period1AndIntegrationPassed,
    completedBeatCount: result.completedBeatCount,
    completedPhysicalTimeSec:
      result.completedBeatCount * arm.cycleLengthSec +
      result.retainedPartialBeat.length * result.dtSec,
    selectedBeatIndex: beat.beatIndex,
    selectedBeatSampleCount: beat.samples.length,
    singleDistinctAorticFlowPeakPassed,
    exactStationAuditPassed,
    interpretationEligible:
      period1AndIntegrationPassed &&
      singleDistinctAorticFlowPeakPassed &&
      exactStationAuditPassed,
    cycleMetrics,
    onePercentFlowEjectionTime,
    exactPressureStations: exactStations.exactPressureStations,
    observationStations,
    exactReadbackAudit: exactStations.exactReadbackAudit,
    copenhagenTimingReadout: copenhagenTimingReadout(
      arm.heartRateBpm,
      cycleMetrics,
    ),
  });
}

function validateInputIdentity(
  input: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonInputV1,
): void {
  const { arm, calciumProfile: profile, calciumDriveParams: params } = input;
  const result = input.periodicResult;
  const expectedArm =
    resolveMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1(
      arm.armId,
    );
  const expectedProfile =
    resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
      expectedArm.calciumProfileId,
    );
  const expectedParams =
    resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeParamsV1(
      expectedArm.calciumProfileId,
    );
  if (protocolHash(arm) !== protocolHash(expectedArm)) {
    throw new Error(`${arm.armId} arm identity mismatch`);
  }
  if (
    protocolHash(profile) !== protocolHash(expectedProfile) ||
    profile.profileId !== arm.calciumProfileId ||
    profile.timingPolicy !== arm.timingPolicy ||
    profile.heartRateBpm !== arm.heartRateBpm
  ) {
    throw new Error(`${arm.armId} calcium profile identity mismatch`);
  }
  if (
    protocolHash(params) !== protocolHash(expectedParams) ||
    !nearlyEqual(params.cycleLengthSec, arm.cycleLengthSec) ||
    !nearlyEqual(
      params.atrioventricularDelaySec,
      profile.atrioventricularDelaySec,
    )
  ) {
    throw new Error(`${arm.armId} calcium parameter identity mismatch`);
  }
  if (
    result.protocolIdentity.calciumDrive.parameterSetId !==
      params.parameterSetId ||
    protocolHash(params) !==
      result.protocolIdentity.calciumDrive.fixedParamsStableHash ||
    result.protocolIdentity.calciumDrive.fixedParamsStableHash !==
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash
  ) {
    throw new Error(`${arm.armId} calcium protocol identity mismatch`);
  }
  if (
    !nearlyEqual(result.dtSec, arm.dtSec) ||
    result.stepsPerBeat !== arm.stepsPerCycle ||
    !nearlyEqual(result.dtSec * result.stepsPerBeat, arm.cycleLengthSec) ||
    !nearlyEqual(result.claim.heartRateBpm, arm.heartRateBpm)
  ) {
    throw new Error(`${arm.armId} periodic timebase mismatch`);
  }
  if (result.initialization !== "canonical") {
    throw new Error(
      `${arm.armId} must use an independent canonical cold start`,
    );
  }
  if (result.valveResearchInput.valves.AoV.maximumForwardEoaCm2 !== 3.5) {
    throw new Error(`${arm.armId} V10-reference aortic EOA mismatch`);
  }
}

function measureOnePercentEt(
  flows: readonly number[],
  peakIndex: number,
  dtSec: number,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeOnePercentEtV1 {
  const threshold = flows[peakIndex]! * 0.01;
  const shifted = flows.map((flow) => flow - threshold);
  const episode = primaryCyclicPositiveEpisode(shifted, peakIndex);
  const interpolation = interpolatedEpisodeDuration(shifted, episode, dtSec);
  return Object.freeze({
    peakFraction01: 0.01 as const,
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
): Readonly<{
  exactPressureStations: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExactPressureStationsV1;
  exactReadbackAudit: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExactReadbackAuditV1;
}> {
  const beat = result.retainedCompleteBeats.at(-1)!;
  const rawGradients: number[] = [];
  const localGradients: number[] = [];
  const characteristicPressures: number[] = [];
  let exactReadbackCount = 0;
  let allOpeningDriveStationsExact = true;
  let maximumAbsoluteValveFlowReadbackResidualMlPerSec = 0;
  let maximumAbsoluteRawNodeGradientResidualMmHg = 0;
  let maximumAbsoluteAorticNodeReadbackResidualMmHg = 0;
  let maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg = 0;
  let maximumAbsoluteProximalPortReconstructionResidualMmHg = 0;
  let maximumAbsoluteLocalGradientReconstructionResidualMmHg = 0;
  let maximumAbsoluteStationAdditivityResidualMmHg = 0;
  let maximumAbsoluteCyclePhaseResidual01 = 0;

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
    const stationAdditivityResidual =
      rawGradient -
      exact.localValvePressureGradientMmHg -
      exact.characteristicImpedancePressureMmHg;
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
    maximumAbsoluteStationAdditivityResidualMmHg = Math.max(
      maximumAbsoluteStationAdditivityResidualMmHg,
      Math.abs(stationAdditivityResidual),
    );
    maximumAbsoluteCyclePhaseResidual01 = Math.max(
      maximumAbsoluteCyclePhaseResidual01,
      phaseResidual,
    );
    allOpeningDriveStationsExact &&=
      exact.openingDrivePressureStation ===
      "LV-minus-proximal-constitutive-port";
    if (flow > 0) {
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
    maximumAbsoluteStationAdditivityResidualMmHg <= EXACT_AUDIT_TOLERANCE &&
    maximumAbsoluteCyclePhaseResidual01 <= EXACT_AUDIT_TOLERANCE;

  return Object.freeze({
    exactPressureStations: Object.freeze({
      averagingDomain: "strictly-positive-forward-AoV-flow-samples" as const,
      positiveForwardFlowSampleCount: rawGradients.length,
      rawLvMinusAorticComplianceNodeGradientMmHg: meanAndPeak(rawGradients),
      exactLvMinusProximalConstitutivePortGradientMmHg:
        meanAndPeak(localGradients),
      characteristicImpedancePressureMmHg: meanAndPeak(characteristicPressures),
    }),
    exactReadbackAudit: Object.freeze({
      requiredSelectedBeatSampleCount: beat.samples.length,
      availableSelectedBeatSampleCount: exactReadbackCount,
      allSelectedBeatSamplesAvailable: true as const,
      allOpeningDriveStationsExact,
      maximumAbsoluteValveFlowReadbackResidualMlPerSec,
      maximumAbsoluteRawNodeGradientResidualMmHg,
      maximumAbsoluteAorticNodeReadbackResidualMmHg,
      maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg,
      maximumAbsoluteProximalPortReconstructionResidualMmHg,
      maximumAbsoluteLocalGradientReconstructionResidualMmHg,
      maximumAbsoluteStationAdditivityResidualMmHg,
      maximumAbsoluteCyclePhaseResidual01,
      stationEquationsWithinTolerance,
    }),
  });
}

function copenhagenTimingReadout(
  heartRateBpm: 50 | 90,
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeCopenhagenReadoutV1 {
  const reference =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COPENHAGEN_REFERENCE_V1;
  return Object.freeze({
    heartRateBpm,
    leftVentricularEjectionTime: correctedTimingReadout(
      cycle.leftVentricularValveEventEjectionTimeSec,
      heartRateBpm,
      reference.leftVentricularEjectionTime.coefficientMsPerBpm,
      reference.leftVentricularEjectionTime.correctedPredictionInterval95Ms,
    ),
    isovolumicContractionTime: correctedTimingReadout(
      cycle.leftVentricularIsovolumicContractionTimeSec,
      heartRateBpm,
      reference.isovolumicContractionTime.coefficientMsPerBpm,
      reference.isovolumicContractionTime.correctedPredictionInterval95Ms,
    ),
    isovolumicRelaxationTime: correctedTimingReadout(
      cycle.leftVentricularIsovolumicRelaxationTimeSec,
      heartRateBpm,
      reference.isovolumicRelaxationTime.coefficientMsPerBpm,
      reference.isovolumicRelaxationTime.correctedPredictionInterval95Ms,
    ),
    rawLeftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
    correctedTeiIndexConstructed: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
  });
}

function correctedTimingReadout(
  rawSec: number | null,
  heartRateBpm: 50 | 90,
  coefficientMsPerBpm: number,
  predictionInterval95Ms: readonly [number, number],
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeCorrectedTimingReadoutV1 {
  const rawMs = rawSec === null ? null : rawSec * 1_000;
  const correctionAddedMs = coefficientMsPerBpm * heartRateBpm;
  const correctedMs = rawMs === null ? null : rawMs + correctionAddedMs;
  return Object.freeze({
    rawSec,
    rawMs,
    correctionCoefficientMsPerBpm: coefficientMsPerBpm,
    correctionAddedMs,
    correctedMs,
    correctedPredictionInterval95Ms: predictionInterval95Ms,
    withinCorrectedPredictionInterval95:
      correctedMs === null
        ? null
        : correctedMs >= predictionInterval95Ms[0] &&
          correctedMs <= predictionInterval95Ms[1],
  });
}

function metricContrast(
  metricId: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeMetricIdV1,
  fixed50: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1,
  fixed90: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1,
  rrScaled50: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1,
  rrScaled90: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeMetricContrastV1 {
  const fixedAbsoluteTimeHr50 = metricValue(fixed50, metricId);
  const fixedAbsoluteTimeHr90 = metricValue(fixed90, metricId);
  const rrScaledTauHr50 = metricValue(rrScaled50, metricId);
  const rrScaledTauHr90 = metricValue(rrScaled90, metricId);
  const fixedAbsoluteTimeHr90Minus50 = difference(
    fixedAbsoluteTimeHr90,
    fixedAbsoluteTimeHr50,
  );
  const rrScaledTauHr90Minus50 = difference(rrScaledTauHr90, rrScaledTauHr50);
  return Object.freeze({
    metricId,
    fixedAbsoluteTimeHr50,
    fixedAbsoluteTimeHr90,
    fixedAbsoluteTimeHr90Minus50,
    rrScaledTauHr50,
    rrScaledTauHr90,
    rrScaledTauHr90Minus50,
    differenceOfDifferences: difference(
      rrScaledTauHr90Minus50,
      fixedAbsoluteTimeHr90Minus50,
    ),
  });
}

function metricValue(
  arm: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1,
  metricId: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeMetricIdV1,
): number | null {
  const cycle = arm.cycleMetrics;
  switch (metricId) {
    case "flow-threshold-1-percent-ejection-time-sec":
      return arm.onePercentFlowEjectionTime.interpolatedEjectionTimeSec;
    case "left-ventricular-valve-event-ejection-time-sec":
      return cycle.leftVentricularValveEventEjectionTimeSec;
    case "stroke-volume-ml":
      return cycle.aorticForwardVolumeMl;
    case "peak-aortic-flow-ml-per-sec":
      return cycle.aorticMaximumFlowMlPerSec;
    case "peak-vena-contracta-velocity-m-per-sec":
      return cycle.peakVenaContractaVelocityMPerSec;
    case "mean-doppler-gradient-mm-hg":
      return cycle.meanDopplerGradientMmHg;
    case "peak-doppler-gradient-mm-hg":
      return cycle.peakDopplerGradientMmHg;
    case "isovolumic-contraction-time-sec":
      return cycle.leftVentricularIsovolumicContractionTimeSec;
    case "isovolumic-relaxation-time-sec":
      return cycle.leftVentricularIsovolumicRelaxationTimeSec;
    case "left-ventricular-tei-index":
      return cycle.leftVentricularTeiIndex;
    case "maximum-positive-left-ventricular-dpdt-mm-hg-per-sec":
      return cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec;
    case "minimum-negative-left-ventricular-dpdt-mm-hg-per-sec":
      return cycle.minimumNegativeLeftVentricularPressureFallRateMmHgPerSec;
    case "left-ventricular-ejection-fraction-01":
      return cycle.leftVentricularEjectionFraction01;
    case "net-aortic-cardiac-output-l-per-min":
      return cycle.netAorticCardiacOutputLPerMin;
    case "mean-aortic-pressure-mm-hg":
      return cycle.meanAorticAbsolutePressureMmHg;
  }
}

function selectArm(
  arms: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1[],
  timingPolicy: MainWireVentricularCalciumMatchedAlphaTimingPolicyV1,
  heartRateBpm: 50 | 90,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmMetricsV1 {
  const selected = arms.filter(
    (arm) =>
      arm.arm.timingPolicy === timingPolicy &&
      arm.arm.heartRateBpm === heartRateBpm,
  );
  if (selected.length !== 1) {
    throw new Error(
      `matched-alpha bridge requires one ${timingPolicy} HR${heartRateBpm} arm`,
    );
  }
  return selected[0]!;
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
  const episodeCount = active.reduce((count, current, index) => {
    const previous = active[(index - 1 + active.length) % active.length]!;
    return count + (current && !previous ? 1 : 0);
  }, 0);
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
    episodeCount,
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
  ) {
    throw new Error("interpolated cyclic episode duration is invalid");
  }
  return Object.freeze({
    openingInterpolationFractionFromPreviousToFirstActive01: openingFraction,
    closingInterpolationFractionFromLastActiveToNext01: closingFraction,
    interpolatedDurationSec,
  });
}

function difference(left: number | null, right: number | null): number | null {
  return left === null || right === null ? null : left - right;
}

function meanAndPeak(values: readonly number[]): MeanAndPeak {
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
