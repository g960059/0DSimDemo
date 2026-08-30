import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowCycleReadbackV1,
  type MainWireAorticOutflowCycleReadbackV1,
  type MainWireAorticOutflowExactReadbackAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCycleReadbackV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_OBSERVATION_GEOMETRY_V1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonV1";
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
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_STEPS_PER_CYCLE_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_V1_ID,
  resolveMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
  type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_SEC_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_STEPS_PER_CYCLE_V1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchRunV1,
  type MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-timing-policy-bridge-numerical-sensitivity-v1" as const;

const TIMEBASE_TOLERANCE_SEC = 1e-8;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-from-paired-cold-start-runs" as const,
    comparisonKind:
      "compound-time-step-and-execution-horizon-sensitivity" as const,
    pureTimeStepConvergenceClaimed: false as const,
    canonicalPrimaryExecution:
      "two-thousand-steps-per-RR-stop-at-first-accepted-periodicity-classification" as const,
    canonicalSentinelExecution:
      "four-thousand-steps-per-RR-exactly-forty-eight-seconds-without-early-periodic-termination" as const,
    signedDifference: "sentinel-minus-primary" as const,
    maximumDifference:
      "maximum-absolute-signed-difference-across-four-fixed-arms" as const,
    onePercentEjectionTime:
      "linearly-interpolated-cyclic-episode-containing-global-positive-flow-peak" as const,
    pressureStationAveragingDomain:
      "same-strictly-positive-forward-AoV-flow-accepted-endpoints-within-each-run" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    derivedAnalysisOnly: true as const,
    smoothingApplied: false as const,
    quantitativeNumericalSensitivityPassToleranceSpecified: false as const,
    exactStationToleranceRole:
      "algebraic-identity-audit-not-numerical-sensitivity-pass-gate" as const,
    parameterSearchOrFittingApplied: false as const,
    structuralTestMayOverrideExpectedExecutionDesign: true as const,
    analysisOnlyOverrideChangesCanonicalDesign: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

type HeartRateMapV1 = Readonly<Record<50 | 90, number>>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1 =
  Readonly<{
    designId: string;
    provenance: "canonical" | "analysis-only-test-override";
    primary: Readonly<{
      stepsPerCycle: number;
      maximumBeatCountByHeartRateBpm: HeartRateMapV1;
      terminationPolicy: "stop-at-first-accepted-classification";
    }>;
    sentinel: Readonly<{
      policyId: string;
      stepsPerCycle: number;
      fixedPhysicalHorizonSecByHeartRateBpm: HeartRateMapV1;
      maximumBeatCountByHeartRateBpm: HeartRateMapV1;
      periodicTerminationBeforeFixedHorizonAccepted: false;
    }>;
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CANONICAL_NUMERICAL_SENSITIVITY_EXECUTION_DESIGN_V1 =
  Object.freeze({
    designId:
      "matched-alpha-primary-2000-early-periodicity-vs-sentinel-4000-fixed-48s-v1" as const,
    provenance: "canonical" as const,
    primary: Object.freeze({
      stepsPerCycle:
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_STEPS_PER_CYCLE_V1,
      maximumBeatCountByHeartRateBpm:
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1.maximumBeatCountsByHeartRateBpm,
      terminationPolicy: "stop-at-first-accepted-classification" as const,
    }),
    sentinel: Object.freeze({
      policyId: "matched-alpha-fixed-physical-horizon-48s-sentinel-v1" as const,
      stepsPerCycle:
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_STEPS_PER_CYCLE_V1,
      fixedPhysicalHorizonSecByHeartRateBpm: Object.freeze({
        50: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_SEC_V1,
        90: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_SEC_V1,
      }),
      maximumBeatCountByHeartRateBpm:
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1.maximumBeatCountsByHeartRateBpm,
      periodicTerminationBeforeFixedHorizonAccepted: false as const,
    }),
  }) satisfies MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeSentinelExecutionPolicyV1 =
  Readonly<{
    policyId: string;
    fixedPhysicalHorizonSec: number;
    stepsPerCycle: number;
    minimumCompletedBeatCountBeforePeriodicTermination: number;
    maximumBeatCount: number;
    periodicTerminationBeforeFixedHorizonAccepted: false;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeRunnerAssemblyIdentityV1 =
  Readonly<{
    referenceNonCalciumAssembly: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;
    exactAssemblyAudit: MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchRunV1["exactAssemblyAudit"];
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1;
    calciumProfile: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    primaryPeriodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    sentinelPeriodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    primaryRunnerAssemblyIdentity: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeRunnerAssemblyIdentityV1;
    sentinelRunnerAssemblyIdentity: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeRunnerAssemblyIdentityV1;
    sentinelExecutionPolicy: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeSentinelExecutionPolicyV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityOptionsV1 =
  Readonly<{
    expectedExecutionDesignOverride?: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1 &
      Readonly<{ provenance: "analysis-only-test-override" }>;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityMetricsV1 =
  Readonly<{
    onePercentInterpolatedEjectionTimeSec: number;
    leftVentricularValveEventEjectionTimeSec: number | null;
    accelerationTimeSec: number;
    strokeVolumeMl: number;
    strokeVolumePerOnePercentEjectionTimeMlPerSec: number;
    peakAorticFlowMlPerSec: number;
    peakVenaContractaVelocityMPerSec: number;
    meanDopplerGradientMmHg: number;
    peakDopplerGradientMmHg: number;
    isovolumicContractionTimeSec: number | null;
    isovolumicRelaxationTimeSec: number | null;
    leftVentricularTeiIndex: number | null;
    maximumPositiveLeftVentricularDpdtMmHgPerSec: number;
    minimumNegativeLeftVentricularDpdtMmHgPerSec: number;
    leftVentricularEjectionFraction01: number;
    netAorticCardiacOutputLPerMin: number;
    meanAorticPressureMmHg: number;
    meanRawNodeGradientMmHg: number;
    peakRawNodeGradientMmHg: number;
    meanExactLocalGradientMmHg: number;
    peakExactLocalGradientMmHg: number;
    meanCharacteristicPressureMmHg: number;
    peakCharacteristicPressureMmHg: number;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityDifferenceV1 =
  Readonly<{
    [
      Key in keyof MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityMetricsV1
    ]: number | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityExactAuditV1 =
  Readonly<{
    requiredSelectedBeatSampleCount: number;
    availableExactReadbackSampleCount: number;
    exactReadbackAvailableForEverySample: boolean;
    allOpeningDriveStationsExact: boolean;
    maximumAbsoluteValveFlowResidualMlPerSec: number;
    maximumAbsoluteRawNodeGradientResidualMmHg: number;
    maximumAbsoluteAorticNodeResidualMmHg: number;
    maximumAbsoluteCharacteristicPressureResidualMmHg: number;
    maximumAbsoluteProximalPortResidualMmHg: number;
    maximumAbsoluteLocalGradientResidualMmHg: number;
    maximumAbsoluteStationAdditivityResidualMmHg: number;
    maximumAbsoluteCyclePhaseResidual01: number;
    stationIdentitiesWithinTolerance: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityRunV1 =
  Readonly<{
    role: "primary" | "sentinel";
    dtSec: number;
    stepsPerCycle: number;
    requestedMaximumBeatCount: number;
    completedBeatCount: number;
    completedPhysicalTimeSec: number;
    selectedBeatIndex: number;
    selectedBeatSampleCount: number;
    terminationReason: MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
    periodicSteadyStateClaimed: boolean;
    integrationCompletedWithoutFailure: boolean;
    singleDistinctAorticFlowPeakPassed: boolean;
    exactStationAuditPassed: boolean;
    interpretationEligible: boolean;
    protocolIdentityHash: string;
    cycleMetrics: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    observationStations: MainWireAorticValveObservationStationsV1;
    metrics: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityMetricsV1;
    exactReadbackAudit: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityExactAuditV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityPhysicalIdentityAuditV1 =
  Readonly<{
    armIdentityMatchesCatalog: true;
    profileIdentityMatchesCatalog: true;
    calciumParamsIdentityMatchesCatalog: true;
    protocolIdentityHashStableAcrossExecutionDesign: true;
    protocolIdentityObjectStableAcrossExecutionDesign: true;
    protocolComponentHashesStableAcrossExecutionDesign: true;
    calciumDriveIdentityStableAcrossExecutionDesign: true;
    valveResearchInputStableAcrossExecutionDesign: true;
    bothRunsUseCanonicalColdStarts: true;
    allChecksPassed: true;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityPairV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1;
    calciumProfileId: MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1["profileId"];
    calciumDriveParameterSetId: string;
    physicalIdentityAudit: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityPhysicalIdentityAuditV1;
    primary: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityRunV1;
    sentinel: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityRunV1;
    signedSentinelMinusPrimary: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityDifferenceV1;
    interpretationEligible: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_V1_ID;
    comparisonKind: "compound-time-step-and-execution-horizon-sensitivity";
    pureTimeStepConvergenceClaimed: false;
    canonicalExecutionDesign: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CANONICAL_NUMERICAL_SENSITIVITY_EXECUTION_DESIGN_V1;
    evaluatedExecutionDesign: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1;
    analysisOnlyExecutionDesignOverrideApplied: boolean;
    canonicalDesignFullyEvaluated: boolean;
    pairs: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityPairV1[];
    maximumAbsoluteSentinelMinusPrimary: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityDifferenceV1;
    allPhysicalIdentitiesStableAcrossExecutionDesign: true;
    allRunsIntegratedWithoutFailure: boolean;
    allRunsPeriod1Converged: boolean;
    allRunsHaveOneDistinctAorticFlowPeak: boolean;
    allExactReadbacksAvailableAndStationIdentitiesWithinTolerance: boolean;
    allPairsInterpretationEligible: boolean;
    quantitativeNumericalSensitivityPassToleranceSpecified: false;
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_CLAIM_V1;
  }>;

type ExactStationMeasurementV1 = Readonly<{
  rawGradient: Readonly<{ timeMean: number; peak: number }>;
  localGradient: Readonly<{ timeMean: number; peak: number }>;
  characteristicPressure: Readonly<{ timeMean: number; peak: number }>;
  audit: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityExactAuditV1;
}>;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_METRIC_KEYS_V1 =
  Object.freeze([
    "onePercentInterpolatedEjectionTimeSec",
    "leftVentricularValveEventEjectionTimeSec",
    "accelerationTimeSec",
    "strokeVolumeMl",
    "strokeVolumePerOnePercentEjectionTimeMlPerSec",
    "peakAorticFlowMlPerSec",
    "peakVenaContractaVelocityMPerSec",
    "meanDopplerGradientMmHg",
    "peakDopplerGradientMmHg",
    "isovolumicContractionTimeSec",
    "isovolumicRelaxationTimeSec",
    "leftVentricularTeiIndex",
    "maximumPositiveLeftVentricularDpdtMmHgPerSec",
    "minimumNegativeLeftVentricularDpdtMmHgPerSec",
    "leftVentricularEjectionFraction01",
    "netAorticCardiacOutputLPerMin",
    "meanAorticPressureMmHg",
    "meanRawNodeGradientMmHg",
    "peakRawNodeGradientMmHg",
    "meanExactLocalGradientMmHg",
    "peakExactLocalGradientMmHg",
    "meanCharacteristicPressureMmHg",
    "peakCharacteristicPressureMmHg",
  ] as const satisfies readonly (keyof MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityMetricsV1)[]);

export function measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
  inputs: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1[],
  options: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityOptionsV1 = {},
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1 {
  const evaluatedExecutionDesign = normalizeAndValidateExecutionDesign(
    options.expectedExecutionDesignOverride ??
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CANONICAL_NUMERICAL_SENSITIVITY_EXECUTION_DESIGN_V1,
  );
  const overrideApplied = options.expectedExecutionDesignOverride !== undefined;
  if (inputs.length !== 4) {
    throw new Error(
      "matched-alpha numerical sensitivity requires exactly four paired arms",
    );
  }
  const byArmId = new Map<
    MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1["armId"],
    MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1
  >();
  for (const input of inputs) {
    if (byArmId.has(input.arm.armId)) {
      throw new Error(
        `duplicate matched-alpha numerical-sensitivity arm: ${input.arm.armId}`,
      );
    }
    byArmId.set(input.arm.armId, input);
  }
  const pairs = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
      (arm) => {
        const input = byArmId.get(arm.armId);
        if (input === undefined) {
          throw new Error(
            `missing matched-alpha numerical-sensitivity arm: ${arm.armId}`,
          );
        }
        return measurePair(input, evaluatedExecutionDesign);
      },
    ),
  );
  const allRuns = pairs.flatMap((pair) => [pair.primary, pair.sentinel]);

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_V1_ID,
    comparisonKind:
      "compound-time-step-and-execution-horizon-sensitivity" as const,
    pureTimeStepConvergenceClaimed: false as const,
    canonicalExecutionDesign:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CANONICAL_NUMERICAL_SENSITIVITY_EXECUTION_DESIGN_V1,
    evaluatedExecutionDesign,
    analysisOnlyExecutionDesignOverrideApplied: overrideApplied,
    canonicalDesignFullyEvaluated:
      !overrideApplied &&
      protocolHash(evaluatedExecutionDesign) ===
        protocolHash(
          MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CANONICAL_NUMERICAL_SENSITIVITY_EXECUTION_DESIGN_V1,
        ),
    pairs,
    maximumAbsoluteSentinelMinusPrimary: maximumAbsoluteDifference(
      pairs.map((pair) => pair.signedSentinelMinusPrimary),
    ),
    allPhysicalIdentitiesStableAcrossExecutionDesign: true as const,
    allRunsIntegratedWithoutFailure: allRuns.every(
      (run) => run.integrationCompletedWithoutFailure,
    ),
    allRunsPeriod1Converged: allRuns.every(
      (run) => run.periodicSteadyStateClaimed,
    ),
    allRunsHaveOneDistinctAorticFlowPeak: allRuns.every(
      (run) => run.singleDistinctAorticFlowPeakPassed,
    ),
    allExactReadbacksAvailableAndStationIdentitiesWithinTolerance:
      allRuns.every((run) => run.exactStationAuditPassed),
    allPairsInterpretationEligible: pairs.every(
      (pair) => pair.interpretationEligible,
    ),
    quantitativeNumericalSensitivityPassToleranceSpecified: false as const,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_CLAIM_V1,
  });
}

function measurePair(
  input: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1,
  design: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityPairV1 {
  const physicalIdentityAudit = validatePhysicalIdentity(input);
  validateExecution(input, design);
  const primary = measureRun(
    "primary",
    input.primaryPeriodicResult,
    input.calciumDriveParams,
    input.arm,
  );
  const sentinel = measureRun(
    "sentinel",
    input.sentinelPeriodicResult,
    input.calciumDriveParams,
    input.arm,
  );
  return Object.freeze({
    arm: input.arm,
    calciumProfileId: input.calciumProfile.profileId,
    calciumDriveParameterSetId: input.calciumDriveParams.parameterSetId,
    physicalIdentityAudit,
    primary,
    sentinel,
    signedSentinelMinusPrimary: difference(sentinel.metrics, primary.metrics),
    interpretationEligible:
      primary.interpretationEligible && sentinel.interpretationEligible,
  });
}

function validatePhysicalIdentity(
  input: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityPhysicalIdentityAuditV1 {
  const { arm, calciumProfile: profile, calciumDriveParams: params } = input;
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
  const primary = input.primaryPeriodicResult;
  const sentinel = input.sentinelPeriodicResult;
  validateResultPhysicalIdentity(primary, params, arm, "primary");
  validateResultPhysicalIdentity(sentinel, params, arm, "sentinel");
  validateRunnerAssemblyIdentity(
    primary,
    input.primaryRunnerAssemblyIdentity,
    arm,
    "primary",
  );
  validateRunnerAssemblyIdentity(
    sentinel,
    input.sentinelRunnerAssemblyIdentity,
    arm,
    "sentinel",
  );
  if (
    primary.protocolIdentityHash !== sentinel.protocolIdentityHash ||
    protocolHash(primary.protocolIdentity) !==
      protocolHash(sentinel.protocolIdentity) ||
    protocolHash(primary.protocolComponentHashes) !==
      protocolHash(sentinel.protocolComponentHashes) ||
    primary.protocolComponentHashes.calciumDriveFixedParamsStableHash !==
      sentinel.protocolComponentHashes.calciumDriveFixedParamsStableHash ||
    protocolHash(primary.valveResearchInput) !==
      protocolHash(sentinel.valveResearchInput) ||
    protocolHash(input.primaryRunnerAssemblyIdentity) !==
      protocolHash(input.sentinelRunnerAssemblyIdentity)
  ) {
    throw new Error(
      `${arm.armId} physical protocol identity changed across execution design`,
    );
  }
  if (
    primary.initialization !== "canonical" ||
    sentinel.initialization !== "canonical"
  ) {
    throw new Error(`${arm.armId} requires paired canonical cold starts`);
  }
  return Object.freeze({
    armIdentityMatchesCatalog: true as const,
    profileIdentityMatchesCatalog: true as const,
    calciumParamsIdentityMatchesCatalog: true as const,
    protocolIdentityHashStableAcrossExecutionDesign: true as const,
    protocolIdentityObjectStableAcrossExecutionDesign: true as const,
    protocolComponentHashesStableAcrossExecutionDesign: true as const,
    calciumDriveIdentityStableAcrossExecutionDesign: true as const,
    valveResearchInputStableAcrossExecutionDesign: true as const,
    bothRunsUseCanonicalColdStarts: true as const,
    allChecksPassed: true as const,
  });
}

function validateRunnerAssemblyIdentity(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  identity: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeRunnerAssemblyIdentityV1,
  arm: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
  role: "primary" | "sentinel",
): void {
  if (
    protocolHash(identity?.referenceNonCalciumAssembly) !==
    protocolHash(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
    )
  ) {
    throw new Error(
      `${arm.armId} ${role} V10 reference non-calcium assembly provenance mismatch`,
    );
  }
  const expectedAudit = Object.freeze({
    mechanicsProviderParameterIdentityHash:
      result.protocolIdentity.mechanicsProvider.parameterIdentityHash,
    circulationRuntimeStableHash:
      result.protocolComponentHashes.circulationRuntimeStableHash,
    bloodVolumeOperatingPointStableHash:
      result.protocolComponentHashes.bloodVolumeOperatingPointStableHash,
    calciumDriveFixedParamsStableHash:
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash,
  });
  if (
    protocolHash(identity.exactAssemblyAudit) !== protocolHash(expectedAudit)
  ) {
    throw new Error(`${arm.armId} ${role} exact assembly audit mismatch`);
  }
}

function validateResultPhysicalIdentity(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  params: FiveWallNormalCalciumDriveParamsV1,
  arm: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
  role: "primary" | "sentinel",
): void {
  if (
    result.protocolIdentity.calciumDrive.parameterSetId !==
      params.parameterSetId ||
    result.protocolIdentityHash !== protocolHash(result.protocolIdentity) ||
    result.protocolIdentity.calciumDrive.fixedParamsStableHash !==
      protocolHash(params) ||
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash !==
      result.protocolIdentity.calciumDrive.fixedParamsStableHash ||
    result.protocolIdentity.circulation.valveResearchInputStableHash !==
      protocolHash(result.valveResearchInput) ||
    !nearlyEqual(result.claim.heartRateBpm, arm.heartRateBpm) ||
    result.valveResearchInput.valves.AoV.maximumForwardEoaCm2 !== 3.5
  ) {
    throw new Error(`${arm.armId} ${role} physical protocol identity mismatch`);
  }
}

function validateExecution(
  input: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1,
  design: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1,
): void {
  const {
    arm,
    primaryPeriodicResult: primary,
    sentinelPeriodicResult: sentinel,
  } = input;
  const heartRate = arm.heartRateBpm;
  const primaryMaximumBeatCount =
    design.primary.maximumBeatCountByHeartRateBpm[heartRate];
  const sentinelMaximumBeatCount =
    design.sentinel.maximumBeatCountByHeartRateBpm[heartRate];
  const sentinelHorizonSec =
    design.sentinel.fixedPhysicalHorizonSecByHeartRateBpm[heartRate];
  const policy = input.sentinelExecutionPolicy;

  validatePeriodicityAndIntegration(primary, arm.armId, "primary");
  validatePeriodicityAndIntegration(sentinel, arm.armId, "sentinel");

  if (
    primary.stepsPerBeat !== design.primary.stepsPerCycle ||
    !nearlyEqual(
      primary.dtSec,
      arm.cycleLengthSec / design.primary.stepsPerCycle,
    ) ||
    primary.requestedMaximumBeatCount !== primaryMaximumBeatCount ||
    primary.completedBeatCount < 1 ||
    primary.completedBeatCount > primaryMaximumBeatCount ||
    primary.retainedPartialBeat.length !== 0 ||
    primary.retainedCompleteBeats.at(-1)?.beatIndex !==
      primary.completedBeatCount ||
    !nearlyEqual(
      primary.retainedCompleteBeats.at(-1)?.endTimeSec ?? Number.NaN,
      primary.completedBeatCount * arm.cycleLengthSec,
    )
  ) {
    throw new Error(`${arm.armId} primary execution design mismatch`);
  }
  if (
    primary.completedBeatCount < primaryMaximumBeatCount &&
    primary.terminationReason !== "period1-converged" &&
    primary.terminationReason !== "period2-suspect"
  ) {
    throw new Error(
      `${arm.armId} primary stopped before an accepted classification`,
    );
  }
  if (!primary.integrationCompletedWithoutFailure) {
    throw new Error(`${arm.armId} primary integration did not complete`);
  }

  if (
    policy.policyId !== design.sentinel.policyId ||
    policy.stepsPerCycle !== design.sentinel.stepsPerCycle ||
    !nearlyEqual(policy.fixedPhysicalHorizonSec, sentinelHorizonSec) ||
    policy.minimumCompletedBeatCountBeforePeriodicTermination !==
      sentinelMaximumBeatCount ||
    policy.maximumBeatCount !== sentinelMaximumBeatCount ||
    policy.periodicTerminationBeforeFixedHorizonAccepted !== false
  ) {
    throw new Error(`${arm.armId} sentinel execution-policy mismatch`);
  }
  if (
    sentinel.stepsPerBeat !== design.sentinel.stepsPerCycle ||
    !nearlyEqual(
      sentinel.dtSec,
      arm.cycleLengthSec / design.sentinel.stepsPerCycle,
    ) ||
    sentinel.requestedMaximumBeatCount !== sentinelMaximumBeatCount ||
    sentinel.completedBeatCount !== sentinelMaximumBeatCount ||
    sentinel.retainedPartialBeat.length !== 0 ||
    sentinel.retainedCompleteBeats.at(-1)?.beatIndex !==
      sentinelMaximumBeatCount ||
    !nearlyEqual(
      sentinel.retainedCompleteBeats.at(-1)?.endTimeSec ?? Number.NaN,
      sentinelHorizonSec,
    ) ||
    !nearlyEqual(
      sentinel.completedBeatCount * arm.cycleLengthSec,
      sentinelHorizonSec,
    ) ||
    !sentinel.integrationCompletedWithoutFailure
  ) {
    throw new Error(`${arm.armId} sentinel fixed-horizon execution mismatch`);
  }
}

function validatePeriodicityAndIntegration(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  armId: string,
  role: "primary" | "sentinel",
): void {
  if (
    result.integrationCompletedWithoutFailure !== (result.failure === null) ||
    result.periodicSteadyStateClaimed !==
      (result.terminationReason === "period1-converged") ||
    result.period2OrbitSuspected !==
      (result.terminationReason === "period2-suspect") ||
    result.initialization !== "canonical" ||
    result.initializationAudit.warmStartSourceProtocolIdentityHash !== null ||
    result.initializationAudit.warmStartTargetProtocolIdentityHash !== null
  ) {
    throw new Error(
      `${armId} ${role} integration/periodicity/cold-start audit mismatch`,
    );
  }
}

function measureRun(
  role: "primary" | "sentinel",
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  params: FiveWallNormalCalciumDriveParamsV1,
  arm: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeArmV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityRunV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${arm.armId} ${role} requires a retained complete beat`);
  }
  if (beat.samples.length !== result.stepsPerBeat) {
    throw new Error(`${arm.armId} ${role} selected beat sample count mismatch`);
  }
  if (
    !nearlyEqual(beat.endTimeSec - beat.startTimeSec, arm.cycleLengthSec) ||
    !nearlyEqual(beat.samples[0]!.timeSec, beat.startTimeSec + result.dtSec) ||
    !nearlyEqual(beat.samples.at(-1)!.timeSec, beat.endTimeSec)
  ) {
    throw new Error(`${arm.armId} ${role} selected beat chronology mismatch`);
  }
  const cycleMetrics = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    params,
    `${arm.armId}-${role}`,
  );
  const observationStations = measureMainWireAorticValveObservationStationsV1(
    result,
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_OBSERVATION_GEOMETRY_V1,
  );
  const cycleReadback = measureMainWireAorticOutflowCycleReadbackV1(
    result,
    arm.cycleLengthSec,
    `${arm.armId} ${role}`,
  );
  const onePercentInterpolatedEjectionTimeSec =
    cycleReadback.onePercentFlowEjectionTime.interpolatedEjectionTimeSec;
  const exactStations = exactStationMeasurementFromCycleReadback(cycleReadback);
  const metrics = metricsFromMeasurements(
    cycleMetrics,
    onePercentInterpolatedEjectionTimeSec,
    exactStations,
  );
  const singleDistinctAorticFlowPeakPassed =
    cycleMetrics.aorticFlowDistinctPeakCountAboveFivePercent === 1;
  const exactStationAuditPassed =
    exactStations.audit.exactReadbackAvailableForEverySample &&
    exactStations.audit.stationIdentitiesWithinTolerance;
  return Object.freeze({
    role,
    dtSec: result.dtSec,
    stepsPerCycle: result.stepsPerBeat,
    requestedMaximumBeatCount: result.requestedMaximumBeatCount,
    completedBeatCount: result.completedBeatCount,
    completedPhysicalTimeSec:
      result.completedBeatCount * arm.cycleLengthSec +
      result.retainedPartialBeat.length * result.dtSec,
    selectedBeatIndex: beat.beatIndex,
    selectedBeatSampleCount: beat.samples.length,
    terminationReason: result.terminationReason,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    singleDistinctAorticFlowPeakPassed,
    exactStationAuditPassed,
    interpretationEligible:
      result.periodicSteadyStateClaimed &&
      result.integrationCompletedWithoutFailure &&
      singleDistinctAorticFlowPeakPassed &&
      exactStationAuditPassed,
    protocolIdentityHash: result.protocolIdentityHash,
    cycleMetrics,
    observationStations,
    metrics,
    exactReadbackAudit: exactStations.audit,
  });
}

function metricsFromMeasurements(
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
  onePercentInterpolatedEjectionTimeSec: number,
  exactStations: ExactStationMeasurementV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityMetricsV1 {
  return Object.freeze({
    onePercentInterpolatedEjectionTimeSec,
    leftVentricularValveEventEjectionTimeSec:
      cycle.leftVentricularValveEventEjectionTimeSec,
    accelerationTimeSec: cycle.timeFromAorticFlowOnsetToPeakSec,
    strokeVolumeMl: cycle.aorticForwardVolumeMl,
    strokeVolumePerOnePercentEjectionTimeMlPerSec:
      cycle.aorticForwardVolumeMl / onePercentInterpolatedEjectionTimeSec,
    peakAorticFlowMlPerSec: cycle.aorticMaximumFlowMlPerSec,
    peakVenaContractaVelocityMPerSec: cycle.peakVenaContractaVelocityMPerSec,
    meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
    isovolumicContractionTimeSec:
      cycle.leftVentricularIsovolumicContractionTimeSec,
    isovolumicRelaxationTimeSec:
      cycle.leftVentricularIsovolumicRelaxationTimeSec,
    leftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
    maximumPositiveLeftVentricularDpdtMmHgPerSec:
      cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    minimumNegativeLeftVentricularDpdtMmHgPerSec:
      cycle.minimumNegativeLeftVentricularPressureFallRateMmHgPerSec,
    leftVentricularEjectionFraction01: cycle.leftVentricularEjectionFraction01,
    netAorticCardiacOutputLPerMin: cycle.netAorticCardiacOutputLPerMin,
    meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
    meanRawNodeGradientMmHg: exactStations.rawGradient.timeMean,
    peakRawNodeGradientMmHg: exactStations.rawGradient.peak,
    meanExactLocalGradientMmHg: exactStations.localGradient.timeMean,
    peakExactLocalGradientMmHg: exactStations.localGradient.peak,
    meanCharacteristicPressureMmHg:
      exactStations.characteristicPressure.timeMean,
    peakCharacteristicPressureMmHg: exactStations.characteristicPressure.peak,
  });
}

function exactStationMeasurementFromCycleReadback(
  readback: MainWireAorticOutflowCycleReadbackV1,
): ExactStationMeasurementV1 {
  const stations = readback.exactPressureStations;
  return Object.freeze({
    rawGradient: stations.rawLvMinusAorticComplianceNodeGradientMmHg,
    localGradient: stations.exactLvMinusProximalConstitutivePortGradientMmHg,
    characteristicPressure: stations.characteristicImpedancePressureMmHg,
    audit: numericalExactAudit(readback.exactReadbackAudit),
  });
}

function numericalExactAudit(
  audit: MainWireAorticOutflowExactReadbackAuditV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityExactAuditV1 {
  return Object.freeze({
    requiredSelectedBeatSampleCount: audit.requiredSelectedBeatSampleCount,
    availableExactReadbackSampleCount: audit.availableSelectedBeatSampleCount,
    exactReadbackAvailableForEverySample: audit.allSelectedBeatSamplesAvailable,
    allOpeningDriveStationsExact: audit.allOpeningDriveStationsExact,
    maximumAbsoluteValveFlowResidualMlPerSec:
      audit.maximumAbsoluteValveFlowReadbackResidualMlPerSec,
    maximumAbsoluteRawNodeGradientResidualMmHg:
      audit.maximumAbsoluteRawNodeGradientResidualMmHg,
    maximumAbsoluteAorticNodeResidualMmHg:
      audit.maximumAbsoluteAorticNodeReadbackResidualMmHg,
    maximumAbsoluteCharacteristicPressureResidualMmHg:
      audit.maximumAbsoluteCharacteristicPressureReconstructionResidualMmHg,
    maximumAbsoluteProximalPortResidualMmHg:
      audit.maximumAbsoluteProximalPortReconstructionResidualMmHg,
    maximumAbsoluteLocalGradientResidualMmHg:
      audit.maximumAbsoluteLocalGradientReconstructionResidualMmHg,
    maximumAbsoluteStationAdditivityResidualMmHg:
      audit.maximumAbsoluteStationAdditivityResidualMmHg,
    maximumAbsoluteCyclePhaseResidual01:
      audit.maximumAbsoluteCyclePhaseResidual01,
    stationIdentitiesWithinTolerance: audit.stationEquationsWithinTolerance,
  });
}

function normalizeAndValidateExecutionDesign(
  design: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1 {
  if (
    design.designId.trim() === "" ||
    (design.provenance !== "canonical" &&
      design.provenance !== "analysis-only-test-override") ||
    design.primary.terminationPolicy !==
      "stop-at-first-accepted-classification" ||
    design.sentinel.policyId.trim() === "" ||
    design.sentinel.periodicTerminationBeforeFixedHorizonAccepted !== false ||
    !positiveInteger(design.primary.stepsPerCycle) ||
    !positiveInteger(design.sentinel.stepsPerCycle)
  ) {
    throw new Error("matched-alpha expected execution design is invalid");
  }
  for (const heartRate of [50, 90] as const) {
    const primaryMaximum =
      design.primary.maximumBeatCountByHeartRateBpm[heartRate];
    const sentinelMaximum =
      design.sentinel.maximumBeatCountByHeartRateBpm[heartRate];
    const horizon =
      design.sentinel.fixedPhysicalHorizonSecByHeartRateBpm[heartRate];
    if (
      !positiveInteger(primaryMaximum) ||
      !positiveInteger(sentinelMaximum) ||
      !(horizon > 0) ||
      !Number.isFinite(horizon) ||
      !nearlyEqual(horizon, sentinelMaximum * (60 / heartRate))
    ) {
      throw new Error("matched-alpha expected execution horizons are invalid");
    }
  }
  return Object.freeze({
    designId: design.designId,
    provenance: design.provenance,
    primary: Object.freeze({
      stepsPerCycle: design.primary.stepsPerCycle,
      maximumBeatCountByHeartRateBpm: Object.freeze({
        50: design.primary.maximumBeatCountByHeartRateBpm[50],
        90: design.primary.maximumBeatCountByHeartRateBpm[90],
      }),
      terminationPolicy: design.primary.terminationPolicy,
    }),
    sentinel: Object.freeze({
      policyId: design.sentinel.policyId,
      stepsPerCycle: design.sentinel.stepsPerCycle,
      fixedPhysicalHorizonSecByHeartRateBpm: Object.freeze({
        50: design.sentinel.fixedPhysicalHorizonSecByHeartRateBpm[50],
        90: design.sentinel.fixedPhysicalHorizonSecByHeartRateBpm[90],
      }),
      maximumBeatCountByHeartRateBpm: Object.freeze({
        50: design.sentinel.maximumBeatCountByHeartRateBpm[50],
        90: design.sentinel.maximumBeatCountByHeartRateBpm[90],
      }),
      periodicTerminationBeforeFixedHorizonAccepted: false as const,
    }),
  });
}

function difference(
  sentinel: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityMetricsV1,
  primary: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityMetricsV1,
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityDifferenceV1 {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_METRIC_KEYS_V1.map(
        (key) => {
          const sentinelValue = sentinel[key];
          const primaryValue = primary[key];
          return [
            key,
            sentinelValue === null || primaryValue === null
              ? null
              : sentinelValue - primaryValue,
          ];
        },
      ),
    ),
  ) as MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityDifferenceV1;
}

function maximumAbsoluteDifference(
  differences: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityDifferenceV1[],
): MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityDifferenceV1 {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_METRIC_KEYS_V1.map(
        (key) => {
          const available = differences.flatMap((entry) =>
            entry[key] === null ? [] : [Math.abs(entry[key])],
          );
          return [key, available.length === 0 ? null : maximum(available)];
        },
      ),
    ),
  ) as MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityDifferenceV1;
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximum requires values");
  return Math.max(...values);
}

function positiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function nearlyEqual(left: number, right: number): boolean {
  return (
    Math.abs(left - right) <=
    TIMEBASE_TOLERANCE_SEC * Math.max(1, Math.abs(left), Math.abs(right))
  );
}

function protocolHash(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}
