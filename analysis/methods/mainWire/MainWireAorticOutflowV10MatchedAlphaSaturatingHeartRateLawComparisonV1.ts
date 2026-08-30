import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowCycleReadbackV1,
  type MainWireAorticOutflowExactPressureStationsV1,
  type MainWireAorticOutflowExactReadbackAuditV1,
  type MainWireAorticOutflowOnePercentFlowEjectionTimeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCycleReadbackV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COPENHAGEN_REFERENCE_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_OBSERVATION_GEOMETRY_V1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonV1";
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
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_RANGE_V1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
  resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchRunV1,
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COMPARISON_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-heart-rate-law-comparison-v1" as const;

const ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC = 1e-9;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_OBSERVATION_GEOMETRY_V1 =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_OBSERVATION_GEOMETRY_V1;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COPENHAGEN_REFERENCE_V1 =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_COPENHAGEN_REFERENCE_V1;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-closed-catalog-arm" as const,
    primaryEjectionTime:
      "linearly-interpolated-one-percent-global-positive-AoV-flow-cyclic-episode" as const,
    secondaryEjectionTime:
      "direct-model-left-ventricular-valve-event-analogue" as const,
    strokeVolumePerEjectionTimeDenominator:
      "primary-one-percent-flow-ejection-time" as const,
    accelerationTime:
      "accepted-endpoint-positive-flow-onset-to-global-flow-peak" as const,
    peakToMeanFlow:
      "peak-forward-flow-divided-by-strictly-positive-forward-flow-time-mean" as const,
    exactPressureStationIdentity:
      "LV-minus-Ao-equals-LV-minus-proximal-port-plus-characteristic-impedance-pressure" as const,
    copenhagenCorrectionAppliedToDirectValveEventAnaloguesOnly: true as const,
    correctedTeiIndexConstructed: false as const,
    mainTrend:
      "fixed-a040-HR50-HR60-HR75-HR90-levels-endpoint-change-ranges-and-monotonic-direction" as const,
    priorSensitivity:
      "fixed-a025-and-a066-HR50-HR90-levels-minus-matched-a040-levels-and-HR-trend-difference-of-differences" as const,
    mainAndPriorSensitivityDesignsRemainDistinct: true as const,
    interpretationRequiresPeriod1ConvergenceIntegrationExactStationsAndSingleFlowPeak:
      true as const,
    fittedOrAdoptionThresholdSpecified: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    derivedAnalysisOnly: true as const,
    smoothingApplied: false as const,
    parameterSearchOrFitting: false as const,
  });

type SaturatingRunner =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchRunV1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonInputV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1;
    calciumProfile: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    referenceNonCalciumAssembly: SaturatingRunner["referenceNonCalciumAssembly"];
    exactAssemblyAudit: SaturatingRunner["exactAssemblyAudit"];
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCorrectedTimingReadoutV1 =
  Readonly<{
    rawSec: number | null;
    rawMs: number | null;
    correctionCoefficientMsPerBpm: number;
    correctionAddedMs: number;
    correctedMs: number | null;
    correctedPredictionInterval95Ms: readonly [number, number];
    withinCorrectedPredictionInterval95: boolean | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCopenhagenReadoutV1 =
  Readonly<{
    heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1;
    leftVentricularEjectionTime: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCorrectedTimingReadoutV1;
    isovolumicContractionTime: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCorrectedTimingReadoutV1;
    isovolumicRelaxationTime: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCorrectedTimingReadoutV1;
    rawLeftVentricularTeiIndex: number | null;
    correctedTeiIndexConstructed: false;
    clinicalMeasurementEquivalenceClaimed: false;
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_METRIC_IDS_V1 =
  Object.freeze([
    "flow-threshold-1-percent-ejection-time-sec",
    "left-ventricular-valve-event-ejection-time-sec",
    "acceleration-time-sec",
    "stroke-volume-ml",
    "stroke-volume-per-one-percent-et-ml-per-sec",
    "peak-aortic-flow-ml-per-sec",
    "aortic-peak-to-mean-forward-flow-ratio",
    "peak-vena-contracta-velocity-m-per-sec",
    "mean-doppler-gradient-mm-hg",
    "peak-doppler-gradient-mm-hg",
    "isovolumic-contraction-time-sec",
    "isovolumic-relaxation-time-sec",
    "copenhagen-corrected-lvet-ms",
    "copenhagen-corrected-ict-ms",
    "copenhagen-corrected-ivrt-ms",
    "left-ventricular-tei-index",
    "maximum-positive-left-ventricular-dpdt-mm-hg-per-sec",
    "minimum-negative-left-ventricular-dpdt-mm-hg-per-sec",
    "left-ventricular-ejection-fraction-01",
    "net-aortic-cardiac-output-l-per-min",
    "mean-aortic-pressure-mm-hg",
    "mean-raw-node-gradient-mm-hg",
    "peak-raw-node-gradient-mm-hg",
    "mean-exact-local-gradient-mm-hg",
    "peak-exact-local-gradient-mm-hg",
    "mean-characteristic-pressure-mm-hg",
    "peak-characteristic-pressure-mm-hg",
  ] as const);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_METRIC_IDS_V1)[number];

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1 =
  Readonly<
    Record<
      MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricIdV1,
      number | null
    >
  >;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricRangesV1 =
  Readonly<
    Record<
      MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricIdV1,
      Readonly<{ minimum: number; maximum: number; span: number }> | null
    >
  >;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricDirectionsV1 =
  Readonly<
    Record<
      MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricIdV1,
      | "increasing"
      | "decreasing"
      | "constant"
      | "non-monotonic"
      | "indeterminate"
    >
  >;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1;
    calciumProfile: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1;
    calciumDriveParameterSetId: string;
    lawMetadata: Readonly<{
      designRole: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1["designRole"];
      heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1;
      dimensionlessRateCoefficient: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1;
      heartRateSaturationCoordinate: number;
      ventricularTimeConstantScaleFromHr60SourceFit: number;
      ventricularRiseTimeConstantSec: number;
      ventricularDecayTimeConstantSec: number;
      localLogTimeConstantVsLogHeartRateElasticityAtHr60: number;
      ventricularPulseTimeToPeakSec: number;
      ventricularNormalizedPulseCycleIntegralSec: number;
      waveformFamily: "periodic-normalized-biexponential-exact-alpha-limit";
    }>;
    protocolIdentityHash: string;
    calciumDriveStableHash: string;
    referenceNonCalciumAssemblyIdentityRetained: true;
    exactAssemblyAudit: SaturatingRunner["exactAssemblyAudit"];
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
    onePercentFlowEjectionTime: MainWireAorticOutflowOnePercentFlowEjectionTimeV1;
    exactPressureStations: MainWireAorticOutflowExactPressureStationsV1;
    observationStations: MainWireAorticValveObservationStationsV1;
    exactReadbackAudit: MainWireAorticOutflowExactReadbackAuditV1;
    copenhagenTimingReadout: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCopenhagenReadoutV1;
    reportedMetrics: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMainTrendV1 =
  Readonly<{
    designRole: "main-four-heart-rate-design";
    dimensionlessRateCoefficient: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1;
    heartRatesBpm: readonly [50, 60, 75, 90];
    armsSortedByHeartRate: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1[];
    interpretationEligible: boolean;
    heartRate90Minus50: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1;
    rangesAcrossHeartRate: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricRangesV1;
    monotonicDirectionAcrossHeartRate: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricDirectionsV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawPerHeartRatePriorSensitivityV1 =
  Readonly<{
    heartRateBpm: 50 | 90;
    mainReferenceArmId: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1["armId"];
    priorArmId: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1["armId"];
    priorMinusMain: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawEndpointPriorSensitivityV1 =
  Readonly<{
    designRole: "endpoint-prior-sensitivity";
    dimensionlessRateCoefficient: 0.25 | 0.66;
    heartRatesBpm: readonly [50, 90];
    priorArmsSortedByHeartRate: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1[];
    mainReferenceArmsSortedByHeartRate: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1[];
    interpretationEligible: boolean;
    perHeartRatePriorMinusMain: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawPerHeartRatePriorSensitivityV1[];
    priorHeartRate90Minus50: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1;
    mainHeartRate90Minus50: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1;
    heartRateTrendDifferenceOfDifferences: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COMPARISON_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID;
    arms: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1[];
    mainTrend: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMainTrendV1;
    endpointPriorSensitivities: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawEndpointPriorSensitivityV1[];
    allArmsInterpretationEligible: boolean;
    allArmsPeriod1AndIntegrationPassed: boolean;
    allArmsHaveOneDistinctAorticFlowPeak: boolean;
    allReferenceNonCalciumAssemblyIdentitiesRetained: true;
    allNonCalciumExactAssemblyAuditHashesIdentical: boolean;
    allExactReadbacksAvailable: true;
    allExactReadbackStationEquationsWithinTolerance: boolean;
    observationGeometry: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_OBSERVATION_GEOMETRY_V1;
    copenhagenReference: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COPENHAGEN_REFERENCE_V1;
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COMPARISON_CLAIM_V1;
  }>;

export function compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1(
  inputs: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonInputV1[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonV1 {
  const byArmId = new Map<
    MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1["armId"],
    MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonInputV1
  >();
  for (const input of inputs) {
    if (byArmId.has(input.arm.armId)) {
      throw new Error(
        `duplicate V10 matched-alpha saturating-law arm: ${input.arm.armId}`,
      );
    }
    byArmId.set(input.arm.armId, input);
  }
  for (const expectedArm of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1) {
    if (!byArmId.has(expectedArm.armId)) {
      throw new Error(
        `missing V10 matched-alpha saturating-law arm: ${expectedArm.armId}`,
      );
    }
  }
  if (
    byArmId.size !==
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1.length
  ) {
    throw new Error(
      "V10 matched-alpha saturating-law comparison accepts exactly eight catalog arms",
    );
  }

  const arms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1.map(
      (expectedArm) => measureArm(byArmId.get(expectedArm.armId)!),
    ),
  );
  const nonCalciumAuditHashes = arms.map((arm) =>
    protocolHash({
      mechanicsProviderParameterIdentityHash:
        arm.exactAssemblyAudit.mechanicsProviderParameterIdentityHash,
      circulationRuntimeStableHash:
        arm.exactAssemblyAudit.circulationRuntimeStableHash,
      bloodVolumeOperatingPointStableHash:
        arm.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
    }),
  );
  const allNonCalciumExactAssemblyAuditHashesIdentical =
    new Set(nonCalciumAuditHashes).size === 1;
  const mainTrend = summarizeMainTrend(
    arms,
    allNonCalciumExactAssemblyAuditHashesIdentical,
  );
  const endpointPriorSensitivities = Object.freeze(
    [
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_RANGE_V1.lower,
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PRIOR_RANGE_V1.upper,
    ].map((coefficient) =>
      summarizeEndpointPriorSensitivity(
        arms,
        coefficient,
        allNonCalciumExactAssemblyAuditHashesIdentical,
      ),
    ),
  );

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COMPARISON_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
    arms,
    mainTrend,
    endpointPriorSensitivities,
    allArmsInterpretationEligible:
      allNonCalciumExactAssemblyAuditHashesIdentical &&
      arms.every((arm) => arm.interpretationEligible),
    allArmsPeriod1AndIntegrationPassed: arms.every(
      (arm) => arm.period1AndIntegrationPassed,
    ),
    allArmsHaveOneDistinctAorticFlowPeak: arms.every(
      (arm) => arm.singleDistinctAorticFlowPeakPassed,
    ),
    allReferenceNonCalciumAssemblyIdentitiesRetained: true as const,
    allNonCalciumExactAssemblyAuditHashesIdentical,
    allExactReadbacksAvailable: true as const,
    allExactReadbackStationEquationsWithinTolerance: arms.every(
      (arm) => arm.exactStationAuditPassed,
    ),
    observationGeometry:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_OBSERVATION_GEOMETRY_V1,
    copenhagenReference:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COPENHAGEN_REFERENCE_V1,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonInputV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1 {
  validateInputIdentity(input);
  const {
    arm,
    calciumProfile: profile,
    calciumDriveParams,
    periodicResult,
  } = input;
  const beat = periodicResult.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${arm.armId} requires a retained complete beat`);
  }
  if (beat.samples.length !== arm.stepsPerCycle) {
    throw new Error(`${arm.armId} selected beat sample count mismatch`);
  }
  if (
    Math.abs(beat.endTimeSec - beat.startTimeSec - arm.cycleLengthSec) >
      ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC ||
    Math.abs(
      beat.samples[0]!.timeSec - beat.startTimeSec - periodicResult.dtSec,
    ) > ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC ||
    Math.abs(beat.samples.at(-1)!.timeSec - beat.endTimeSec) >
      ACCEPTED_TIME_CHRONOLOGY_TOLERANCE_SEC
  ) {
    throw new Error(`${arm.armId} selected beat cycle chronology mismatch`);
  }

  const cycleMetrics = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    periodicResult,
    calciumDriveParams,
    arm.armId,
  );
  const cycleReadback = measureMainWireAorticOutflowCycleReadbackV1(
    periodicResult,
    arm.cycleLengthSec,
    arm.armId,
  );
  const observationStations = measureMainWireAorticValveObservationStationsV1(
    periodicResult,
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_OBSERVATION_GEOMETRY_V1,
  );
  const copenhagenTimingReadout = copenhagenReadout(
    arm.heartRateBpm,
    cycleMetrics,
  );
  const reportedMetrics = metricValues(
    cycleMetrics,
    cycleReadback.onePercentFlowEjectionTime,
    cycleReadback.exactPressureStations,
    copenhagenTimingReadout,
  );
  const period1AndIntegrationPassed =
    periodicResult.periodicSteadyStateClaimed &&
    periodicResult.integrationCompletedWithoutFailure;
  const singleDistinctAorticFlowPeakPassed =
    cycleMetrics.aorticFlowDistinctPeakCountAboveFivePercent === 1;
  const exactStationAuditPassed =
    cycleReadback.exactReadbackAudit.stationEquationsWithinTolerance;

  return Object.freeze({
    arm,
    calciumProfile: profile,
    calciumDriveParameterSetId: calciumDriveParams.parameterSetId,
    lawMetadata: Object.freeze({
      designRole: profile.designRole,
      heartRateBpm: profile.heartRateBpm,
      dimensionlessRateCoefficient: profile.dimensionlessRateCoefficient,
      heartRateSaturationCoordinate: profile.heartRateSaturationCoordinate,
      ventricularTimeConstantScaleFromHr60SourceFit:
        profile.ventricularTimeConstantScaleFromHr60SourceFit,
      ventricularRiseTimeConstantSec: profile.ventricularRiseTimeConstantSec,
      ventricularDecayTimeConstantSec: profile.ventricularDecayTimeConstantSec,
      localLogTimeConstantVsLogHeartRateElasticityAtHr60:
        profile.localLogTimeConstantVsLogHeartRateElasticityAtHr60,
      ventricularPulseTimeToPeakSec: profile.ventricularPulseTimeToPeakSec,
      ventricularNormalizedPulseCycleIntegralSec:
        profile.ventricularNormalizedPulseCycleIntegralSec,
      waveformFamily: profile.waveformFamily,
    }),
    protocolIdentityHash: periodicResult.protocolIdentityHash,
    calciumDriveStableHash:
      periodicResult.protocolComponentHashes.calciumDriveFixedParamsStableHash,
    referenceNonCalciumAssemblyIdentityRetained: true as const,
    exactAssemblyAudit: input.exactAssemblyAudit,
    terminationReason: periodicResult.terminationReason,
    periodicSteadyStateClaimed: periodicResult.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      periodicResult.integrationCompletedWithoutFailure,
    period1AndIntegrationPassed,
    completedBeatCount: periodicResult.completedBeatCount,
    completedPhysicalTimeSec:
      periodicResult.completedBeatCount * arm.cycleLengthSec +
      periodicResult.retainedPartialBeat.length * periodicResult.dtSec,
    selectedBeatIndex: beat.beatIndex,
    selectedBeatSampleCount: beat.samples.length,
    singleDistinctAorticFlowPeakPassed,
    exactStationAuditPassed,
    interpretationEligible:
      period1AndIntegrationPassed &&
      singleDistinctAorticFlowPeakPassed &&
      exactStationAuditPassed,
    cycleMetrics,
    onePercentFlowEjectionTime: cycleReadback.onePercentFlowEjectionTime,
    exactPressureStations: cycleReadback.exactPressureStations,
    observationStations,
    exactReadbackAudit: cycleReadback.exactReadbackAudit,
    copenhagenTimingReadout,
    reportedMetrics,
  });
}

function validateInputIdentity(
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonInputV1,
): void {
  const { arm, calciumProfile: profile, calciumDriveParams: params } = input;
  const result = input.periodicResult;
  const expectedArm =
    resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1(
      arm.armId,
    );
  const expectedProfile =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
      expectedArm.calciumProfileId,
    );
  const expectedParams =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
      expectedArm.calciumProfileId,
    );
  if (protocolHash(arm) !== protocolHash(expectedArm)) {
    throw new Error(`${arm.armId} arm catalog identity mismatch`);
  }
  if (
    protocolHash(profile) !== protocolHash(expectedProfile) ||
    profile.profileId !== arm.calciumProfileId ||
    profile.designRole !== arm.designRole ||
    profile.heartRateBpm !== arm.heartRateBpm ||
    profile.dimensionlessRateCoefficient !== arm.dimensionlessRateCoefficient
  ) {
    throw new Error(`${arm.armId} calcium profile identity mismatch`);
  }
  if (
    protocolHash(params) !== protocolHash(expectedParams) ||
    !nearlyEqual(params.cycleLengthSec, arm.cycleLengthSec) ||
    !nearlyEqual(
      params.ventricular.riseTimeConstantSec,
      profile.ventricularRiseTimeConstantSec,
    ) ||
    !nearlyEqual(
      params.ventricular.decayTimeConstantSec,
      profile.ventricularDecayTimeConstantSec,
    )
  ) {
    throw new Error(`${arm.armId} calcium parameter identity mismatch`);
  }
  if (
    input.referenceNonCalciumAssembly !==
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1
  ) {
    throw new Error(
      `${arm.armId} reference non-calcium assembly identity mismatch`,
    );
  }
  if (
    result.protocolIdentity.calciumDrive.parameterSetId !==
      params.parameterSetId ||
    protocolHash(result.protocolIdentity) !== result.protocolIdentityHash ||
    protocolHash(params) !==
      result.protocolIdentity.calciumDrive.fixedParamsStableHash ||
    result.protocolIdentity.calciumDrive.fixedParamsStableHash !==
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash
  ) {
    throw new Error(`${arm.armId} calcium protocol identity mismatch`);
  }
  if (
    input.exactAssemblyAudit.mechanicsProviderParameterIdentityHash !==
      result.protocolIdentity.mechanicsProvider.parameterIdentityHash ||
    input.exactAssemblyAudit.circulationRuntimeStableHash !==
      result.protocolComponentHashes.circulationRuntimeStableHash ||
    input.exactAssemblyAudit.bloodVolumeOperatingPointStableHash !==
      result.protocolComponentHashes.bloodVolumeOperatingPointStableHash ||
    input.exactAssemblyAudit.calciumDriveFixedParamsStableHash !==
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash
  ) {
    throw new Error(`${arm.armId} exact assembly audit identity mismatch`);
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
  if (
    result.valveResearchInput.valves.AoV.maximumForwardEoaCm2 !==
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1.aorticMaximumForwardEoaCm2
  ) {
    throw new Error(`${arm.armId} V10-reference aortic EOA mismatch`);
  }
}

function copenhagenReadout(
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCopenhagenReadoutV1 {
  const reference =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COPENHAGEN_REFERENCE_V1;
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
  heartRateBpm: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawHeartRateBpmV1,
  coefficientMsPerBpm: number,
  predictionInterval95Ms: readonly [number, number],
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCorrectedTimingReadoutV1 {
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

function metricValues(
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
  onePercentEt: MainWireAorticOutflowOnePercentFlowEjectionTimeV1,
  stations: MainWireAorticOutflowExactPressureStationsV1,
  copenhagen: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawCopenhagenReadoutV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1 {
  const etSec = onePercentEt.interpolatedEjectionTimeSec;
  return Object.freeze({
    "flow-threshold-1-percent-ejection-time-sec": etSec,
    "left-ventricular-valve-event-ejection-time-sec":
      cycle.leftVentricularValveEventEjectionTimeSec,
    "acceleration-time-sec": cycle.timeFromAorticFlowOnsetToPeakSec,
    "stroke-volume-ml": cycle.aorticForwardVolumeMl,
    "stroke-volume-per-one-percent-et-ml-per-sec":
      cycle.aorticForwardVolumeMl / etSec,
    "peak-aortic-flow-ml-per-sec": cycle.aorticMaximumFlowMlPerSec,
    "aortic-peak-to-mean-forward-flow-ratio":
      cycle.aorticPeakToMeanForwardFlowRatio,
    "peak-vena-contracta-velocity-m-per-sec":
      cycle.peakVenaContractaVelocityMPerSec,
    "mean-doppler-gradient-mm-hg": cycle.meanDopplerGradientMmHg,
    "peak-doppler-gradient-mm-hg": cycle.peakDopplerGradientMmHg,
    "isovolumic-contraction-time-sec":
      cycle.leftVentricularIsovolumicContractionTimeSec,
    "isovolumic-relaxation-time-sec":
      cycle.leftVentricularIsovolumicRelaxationTimeSec,
    "copenhagen-corrected-lvet-ms":
      copenhagen.leftVentricularEjectionTime.correctedMs,
    "copenhagen-corrected-ict-ms":
      copenhagen.isovolumicContractionTime.correctedMs,
    "copenhagen-corrected-ivrt-ms":
      copenhagen.isovolumicRelaxationTime.correctedMs,
    "left-ventricular-tei-index": cycle.leftVentricularTeiIndex,
    "maximum-positive-left-ventricular-dpdt-mm-hg-per-sec":
      cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    "minimum-negative-left-ventricular-dpdt-mm-hg-per-sec":
      cycle.minimumNegativeLeftVentricularPressureFallRateMmHgPerSec,
    "left-ventricular-ejection-fraction-01":
      cycle.leftVentricularEjectionFraction01,
    "net-aortic-cardiac-output-l-per-min": cycle.netAorticCardiacOutputLPerMin,
    "mean-aortic-pressure-mm-hg": cycle.meanAorticAbsolutePressureMmHg,
    "mean-raw-node-gradient-mm-hg":
      stations.rawLvMinusAorticComplianceNodeGradientMmHg.timeMean,
    "peak-raw-node-gradient-mm-hg":
      stations.rawLvMinusAorticComplianceNodeGradientMmHg.peak,
    "mean-exact-local-gradient-mm-hg":
      stations.exactLvMinusProximalConstitutivePortGradientMmHg.timeMean,
    "peak-exact-local-gradient-mm-hg":
      stations.exactLvMinusProximalConstitutivePortGradientMmHg.peak,
    "mean-characteristic-pressure-mm-hg":
      stations.characteristicImpedancePressureMmHg.timeMean,
    "peak-characteristic-pressure-mm-hg":
      stations.characteristicImpedancePressureMmHg.peak,
  });
}

function summarizeMainTrend(
  arms: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1[],
  nonCalciumAssemblyIdentityRetainedAcrossDesign: boolean,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMainTrendV1 {
  const selected = arms
    .filter(
      (arm) =>
        arm.arm.designRole === "main-four-heart-rate-design" &&
        arm.arm.dimensionlessRateCoefficient ===
          MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1,
    )
    .sort((left, right) => left.arm.heartRateBpm - right.arm.heartRateBpm);
  const expectedHeartRates = [50, 60, 75, 90] as const;
  if (
    selected.length !== expectedHeartRates.length ||
    selected.some(
      (arm, index) => arm.arm.heartRateBpm !== expectedHeartRates[index],
    ) ||
    selected.map((arm) => arm.arm.armId).join("|") !==
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1.join(
        "|",
      )
  ) {
    throw new Error("saturating-law main trend is missing a catalog arm");
  }
  const snapshots = selected.map((arm) => arm.reportedMetrics);
  return Object.freeze({
    designRole: "main-four-heart-rate-design" as const,
    dimensionlessRateCoefficient:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1,
    heartRatesBpm: expectedHeartRates,
    armsSortedByHeartRate: Object.freeze(selected),
    interpretationEligible:
      nonCalciumAssemblyIdentityRetainedAcrossDesign &&
      selected.every((arm) => arm.interpretationEligible),
    heartRate90Minus50: subtractMetricValues(snapshots[3]!, snapshots[0]!),
    rangesAcrossHeartRate: metricRanges(snapshots),
    monotonicDirectionAcrossHeartRate: metricDirections(snapshots),
  });
}

function summarizeEndpointPriorSensitivity(
  arms: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1[],
  coefficient: 0.25 | 0.66,
  nonCalciumAssemblyIdentityRetainedAcrossDesign: boolean,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawEndpointPriorSensitivityV1 {
  const main = ([50, 90] as const).map((heartRateBpm) =>
    selectArm(arms, 0.4, heartRateBpm),
  );
  const prior = ([50, 90] as const).map((heartRateBpm) =>
    selectArm(arms, coefficient, heartRateBpm),
  );
  const perHeartRatePriorMinusMain = Object.freeze(
    ([50, 90] as const).map((heartRateBpm, index) =>
      Object.freeze({
        heartRateBpm,
        mainReferenceArmId: main[index]!.arm.armId,
        priorArmId: prior[index]!.arm.armId,
        priorMinusMain: subtractMetricValues(
          prior[index]!.reportedMetrics,
          main[index]!.reportedMetrics,
        ),
      }),
    ),
  );
  const priorHeartRate90Minus50 = subtractMetricValues(
    prior[1]!.reportedMetrics,
    prior[0]!.reportedMetrics,
  );
  const mainHeartRate90Minus50 = subtractMetricValues(
    main[1]!.reportedMetrics,
    main[0]!.reportedMetrics,
  );
  return Object.freeze({
    designRole: "endpoint-prior-sensitivity" as const,
    dimensionlessRateCoefficient: coefficient,
    heartRatesBpm: [50, 90] as const,
    priorArmsSortedByHeartRate: Object.freeze(prior),
    mainReferenceArmsSortedByHeartRate: Object.freeze(main),
    interpretationEligible:
      nonCalciumAssemblyIdentityRetainedAcrossDesign &&
      [...prior, ...main].every((arm) => arm.interpretationEligible),
    perHeartRatePriorMinusMain,
    priorHeartRate90Minus50,
    mainHeartRate90Minus50,
    heartRateTrendDifferenceOfDifferences: subtractMetricValues(
      priorHeartRate90Minus50,
      mainHeartRate90Minus50,
    ),
  });
}

function selectArm(
  arms: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1[],
  coefficient: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawCoefficientV1,
  heartRateBpm: 50 | 90,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmMetricsV1 {
  const selected = arms.filter(
    (arm) =>
      arm.arm.dimensionlessRateCoefficient === coefficient &&
      arm.arm.heartRateBpm === heartRateBpm,
  );
  if (selected.length !== 1) {
    throw new Error(
      `saturating-law comparison requires one a=${coefficient} HR${heartRateBpm} arm`,
    );
  }
  return selected[0]!;
}

function subtractMetricValues(
  left: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1,
  right: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1 {
  return mapMetrics((metricId) => difference(left[metricId], right[metricId]));
}

function metricRanges(
  snapshots: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricRangesV1 {
  return mapMetrics((metricId) => {
    const values = snapshots.map((snapshot) => snapshot[metricId]);
    if (values.some((value) => value === null)) return null;
    const finiteValues = values as number[];
    const minimum = Math.min(...finiteValues);
    const maximum = Math.max(...finiteValues);
    return Object.freeze({ minimum, maximum, span: maximum - minimum });
  });
}

function metricDirections(
  snapshots: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricValuesV1[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricDirectionsV1 {
  return mapMetrics((metricId) => {
    const values = snapshots.map((snapshot) => snapshot[metricId]);
    if (values.some((value) => value === null)) return "indeterminate" as const;
    const finiteValues = values as number[];
    const deltas = finiteValues
      .slice(1)
      .map((value, index) => value - finiteValues[index]!);
    if (deltas.every((delta) => delta === 0)) return "constant" as const;
    if (deltas.every((delta) => delta >= 0)) return "increasing" as const;
    if (deltas.every((delta) => delta <= 0)) return "decreasing" as const;
    return "non-monotonic" as const;
  });
}

function mapMetrics<Value>(
  read: (
    metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricIdV1,
  ) => Value,
): Readonly<
  Record<
    MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricIdV1,
    Value
  >
> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_METRIC_IDS_V1.map(
        (metricId) => [metricId, read(metricId)],
      ),
    ) as Record<
      MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawMetricIdV1,
      Value
    >,
  );
}

function difference(left: number | null, right: number | null): number | null {
  return left === null || right === null ? null : left - right;
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
