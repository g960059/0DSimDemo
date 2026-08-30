import {
  assertMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeExpectedExactModelIdentityV1,
  classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1,
  mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1,
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_V1_ID,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1,
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-robustness-envelope-fixed-horizon-sentinel-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_COMPARISON_METRIC_IDS_V1 =
  Object.freeze([
    "onePercentFlowEjectionTimeSec",
    "isovolumicContractionTimeSec",
    "isovolumicRelaxationTimeSec",
    "strokeVolumeMl",
    "peakVenaContractaVelocityMPerSec",
    "meanDopplerGradientMmHg",
    "peakDopplerGradientMmHg",
    "leftVentricularTeiIndex",
    "maximumPositiveLeftVentricularDpdtMmHgPerSec",
  ] as const satisfies readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1[]);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelComparisonMetricIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_COMPARISON_METRIC_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_INDEPENDENT_HARD_METRIC_IDS_V1 =
  Object.freeze([
    "peakVenaContractaVelocityMPerSec",
    "meanDopplerGradientMmHg",
    "onePercentFlowEjectionTimeSec",
    "correctedValveEventLvetMs",
    "accelerationTimeSec",
    "activeEoaAtPeakForwardFlowUtilization01",
    "flowWeightedMeanActiveEoaUtilization01",
  ] as const satisfies readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1[]);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelIndependentHardMetricIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_INDEPENDENT_HARD_METRIC_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source:
      "paired-independent-cold-primary-cycle-over-2000-early-stop-and-fixed-48s-cycle-over-4000-executions" as const,
    primaryExecutionUsesMaximumBeatCount: 72 as const,
    primaryExecutionPeriodicEarlyStopEnabled: true as const,
    fixedExecutionUsesExactPhysicalHorizonSec: 48 as const,
    fixedExecutionUsesStepsPerCycle: 4_000 as const,
    fixedExecutionPeriodicEarlyStopBeforeHorizonAccepted: false as const,
    pairedExactModelIdentityRequired: true as const,
    executionPolicyIsTheOnlyEligiblePairDifference: true as const,
    metricToleranceReferenceIsPrimaryCycleOver2000Readout: true as const,
    metricToleranceUsesMaximumOfAbsoluteAndRelativeTerms: true as const,
    redundantPeakGradientIncludedAsReadoutNotIndependentHardGate: true as const,
    independentHardPhysiologyClassFlipsAuditedAcrossAllAvailableReadouts:
      true as const,
    primaryAndFixedArmLevelAntiStenosisGatesRequired: true as const,
    primaryAndFixedTwoSidedRestingReadoutsReportedButNotRequiredForPass:
      true as const,
    limitingUnionAuditOnly: true as const,
    allThirtySixEnvelopeArmsAuditedAtFixedHorizon: false as const,
    continuityEquivalentEoaVariationRecertified: false as const,
    continuousInteriorRobustnessEstablished: false as const,
    horizonAndTimeStepEffectsSeparatedByThisCompoundComparison: false as const,
    compoundMismatchAttributionClaimedWithoutDecomposition: false as const,
    prespecifiedNextDecompositionIfRequired:
      "cycle-over-2000-fixed-48s-before-optional-cycle-over-4000-early-stop" as const,
    parameterSearchOrFitting: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
  });

type PrimaryRun =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchRunV1;
type FixedRun =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelMetricComparisonV1 =
  Readonly<{
    metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelComparisonMetricIdV1;
    primaryCycleOver2000EarlyStopValue: number;
    fixed48sCycleOver4000Value: number;
    fixedMinusPrimary: number;
    absoluteDifference: number;
    materialityTolerance: number;
    materialDifference: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelHardClassComparisonV1 =
  Readonly<{
    metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1;
    primaryClassPassed: boolean;
    fixedClassPassed: boolean;
    hardPhysiologyClassFlip: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelColdStartAuditV1 =
  Readonly<{
    initializationIsCanonical: boolean;
    totalBloodVolumeDifferenceIsZero: boolean;
    noColdStateCategoryChanged: boolean;
    noPulmonaryRedistributionApplied: boolean;
    allWarmStartIdentityHashesAreNull: boolean;
    warmStartProtocolDifferenceIsNotAWarmStart: boolean;
    terminalWarmStartIsNull: boolean;
    runnerClaimsNoWarmStart: boolean;
    coldStartAuditPassed: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelPairAnalysisV1 =
  Readonly<{
    sentinelArm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1;
    primaryReadout: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1;
    fixedHorizonReadout: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1;
    identityAudit: Readonly<{
      primaryExpectedFrozenCatalogIdentityPassed: true;
      fixedExpectedFrozenCatalogIdentityPassed: true;
      envelopeArmIdentityMatched: boolean;
      referenceNonCalciumAssemblyIdentityMatched: boolean;
      protocolIdentityHashMatched: boolean;
      protocolIdentityMatched: boolean;
      protocolComponentHashesMatched: boolean;
      exactAssemblyAuditMatched: boolean;
      valveResearchInputMatched: boolean;
      calciumDriveParamsMatched: boolean;
      pressureStationProfilesMatched: boolean;
      resolvedFactorProfileReadbacksMatched: boolean;
      allExactModelIdentitiesMatched: boolean;
      executionPolicyOnlyEligibleDifference: true;
    }>;
    executionAudit: Readonly<{
      primaryStepsPerCycle: 2_000;
      primaryRequestedMaximumBeatCount: 72;
      primaryCompletedBeatCount: number;
      primaryPeriod1AndIntegrationPassed: boolean;
      primaryHasNoPartialBeat: boolean;
      primaryColdStartAudit: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelColdStartAuditV1;
      fixedStepsPerCycle: 4_000;
      fixedRequestedAndCompletedBeatCount: 40 | 72;
      fixedEndpointTimeSec: number;
      fixedEndpointTimeMatched48s: boolean;
      fixedPeriod1AndIntegrationPassed: boolean;
      fixedHasNoPartialBeat: boolean;
      fixedColdStartAudit: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelColdStartAuditV1;
      independentCanonicalColdStartsMatched: boolean;
      executionContractPassed: boolean;
    }>;
    metricComparisons: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelMetricComparisonV1[];
    hardClassComparisons: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelHardClassComparisonV1[];
    anyMaterialMetricDifference: boolean;
    anyHardPhysiologyClassFlip: boolean;
    primaryHasOneDistinctAorticFlowPeak: boolean;
    primaryHasExactlyOneCompleteOnePercentFlowEpisode: boolean;
    primaryExactStationAuditPassed: boolean;
    primarySimplifiedPeakGradientVmaxIdentityPassed: boolean;
    primaryTwoSidedRestingVmaxAndGradientReadoutsMatched: boolean;
    primaryArmLevelAvAntiStenosisGatesPassed: boolean;
    fixedHasOneDistinctAorticFlowPeak: boolean;
    fixedHasExactlyOneCompleteOnePercentFlowEpisode: boolean;
    fixedExactStationAuditPassed: boolean;
    fixedSimplifiedPeakGradientVmaxIdentityPassed: boolean;
    fixedTwoSidedRestingVmaxAndGradientReadoutsMatched: boolean;
    fixedArmLevelAvAntiStenosisGatesPassed: boolean;
    pairPassed: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ANALYSIS_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_V1_ID;
    pairsInFrozenCatalogOrder: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelPairAnalysisV1[];
    auditedUniqueArmCount: 6;
    allPairedExactModelIdentitiesMatched: boolean;
    allExecutionContractsPassed: boolean;
    allNumericalComparisonsWithinTolerance: boolean;
    anyHardPhysiologyClassFlip: boolean;
    allPrimaryRunsHaveOneDistinctAorticFlowPeak: boolean;
    allPrimaryRunsHaveExactlyOneCompleteOnePercentFlowEpisode: boolean;
    allPrimaryExactStationAuditsPassed: boolean;
    allPrimarySimplifiedPeakGradientVmaxIdentitiesPassed: boolean;
    allPrimaryTwoSidedRestingVmaxAndGradientReadoutsMatched: boolean;
    allPrimaryArmLevelAvAntiStenosisGatesPassed: boolean;
    allFixedRunsHaveOneDistinctAorticFlowPeak: boolean;
    allFixedRunsHaveExactlyOneCompleteOnePercentFlowEpisode: boolean;
    allFixedExactStationAuditsPassed: boolean;
    allFixedSimplifiedPeakGradientVmaxIdentitiesPassed: boolean;
    allFixedTwoSidedRestingVmaxAndGradientReadoutsMatched: boolean;
    allFixedArmLevelAvAntiStenosisGatesPassed: boolean;
    limitingUnionFixedHorizonAuditPassed: boolean;
    compoundComparisonValidityPassed: boolean;
    auditStatus:
      | "passed"
      | "compound-mismatch-detected"
      | "non-numerical-audit-failure"
      | "physiology-gate-failure";
    compoundMismatchDetected: boolean;
    nonNumericalAuditFailureDetected: boolean;
    physiologyGateFailureDetected: boolean;
    decompositionStatus: "not-required" | "required-not-executed";
    horizonAndTimeStepEffectsSeparated: false;
    allThirtySixEnvelopeArmsAuditedAtFixedHorizon: false;
    continuityEquivalentEoaVariationRecertified: false;
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ANALYSIS_CLAIM_V1;
  }>;

export function classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAuditDispositionV1(
  input: Readonly<{
    compoundComparisonValidityPassed: boolean;
    allNumericalComparisonsWithinTolerance: boolean;
    anyHardPhysiologyClassFlip: boolean;
    allPrimaryAndFixedArmLevelAvAntiStenosisGatesPassed: boolean;
  }>,
): Readonly<{
  auditStatus:
    | "passed"
    | "compound-mismatch-detected"
    | "non-numerical-audit-failure"
    | "physiology-gate-failure";
  compoundMismatchDetected: boolean;
  nonNumericalAuditFailureDetected: boolean;
  physiologyGateFailureDetected: boolean;
  decompositionStatus: "not-required" | "required-not-executed";
}> {
  const nonNumericalAuditFailureDetected =
    !input.compoundComparisonValidityPassed;
  const compoundMismatchDetected =
    input.compoundComparisonValidityPassed &&
    (!input.allNumericalComparisonsWithinTolerance ||
      input.anyHardPhysiologyClassFlip);
  const physiologyGateFailureDetected =
    !input.allPrimaryAndFixedArmLevelAvAntiStenosisGatesPassed;
  return Object.freeze({
    auditStatus: nonNumericalAuditFailureDetected
      ? ("non-numerical-audit-failure" as const)
      : compoundMismatchDetected
        ? ("compound-mismatch-detected" as const)
        : physiologyGateFailureDetected
          ? ("physiology-gate-failure" as const)
          : ("passed" as const),
    compoundMismatchDetected,
    nonNumericalAuditFailureDetected,
    physiologyGateFailureDetected,
    decompositionStatus: compoundMismatchDetected
      ? ("required-not-executed" as const)
      : ("not-required" as const),
  });
}

export function measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1(
  primaryRuns: readonly PrimaryRun[],
  fixedRuns: readonly FixedRun[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1 {
  const primaryByArmId = uniqueRunMap(primaryRuns, "primary");
  const fixedByArmId = uniqueRunMap(fixedRuns, "fixed");
  const expectedIds = new Set<string>(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
      (arm) => arm.sentinelArmId,
    ),
  );
  if (
    primaryByArmId.size !== 6 ||
    fixedByArmId.size !== 6 ||
    [...primaryByArmId.keys()].some((armId) => !expectedIds.has(armId)) ||
    [...fixedByArmId.keys()].some((armId) => !expectedIds.has(armId))
  ) {
    throw new Error(
      "fixed-horizon sentinel analysis requires exactly the frozen six-arm limiting union in both executions",
    );
  }

  const pairsInFrozenCatalogOrder = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
      (sentinelArm) =>
        measurePair(
          sentinelArm,
          primaryByArmId.get(sentinelArm.sentinelArmId)!,
          fixedByArmId.get(sentinelArm.sentinelArmId)!,
        ),
    ),
  );
  const allPairedExactModelIdentitiesMatched = pairsInFrozenCatalogOrder.every(
    (pair) => pair.identityAudit.allExactModelIdentitiesMatched,
  );
  const allExecutionContractsPassed = pairsInFrozenCatalogOrder.every(
    (pair) => pair.executionAudit.executionContractPassed,
  );
  const allNumericalComparisonsWithinTolerance =
    pairsInFrozenCatalogOrder.every(
      (pair) => !pair.anyMaterialMetricDifference,
    );
  const anyHardPhysiologyClassFlip = pairsInFrozenCatalogOrder.some(
    (pair) => pair.anyHardPhysiologyClassFlip,
  );
  const allPrimaryRunsHaveOneDistinctAorticFlowPeak =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.primaryHasOneDistinctAorticFlowPeak,
    );
  const allPrimaryRunsHaveExactlyOneCompleteOnePercentFlowEpisode =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.primaryHasExactlyOneCompleteOnePercentFlowEpisode,
    );
  const allPrimaryExactStationAuditsPassed = pairsInFrozenCatalogOrder.every(
    (pair) => pair.primaryExactStationAuditPassed,
  );
  const allPrimarySimplifiedPeakGradientVmaxIdentitiesPassed =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.primarySimplifiedPeakGradientVmaxIdentityPassed,
    );
  const allPrimaryTwoSidedRestingVmaxAndGradientReadoutsMatched =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.primaryTwoSidedRestingVmaxAndGradientReadoutsMatched,
    );
  const allPrimaryArmLevelAvAntiStenosisGatesPassed =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.primaryArmLevelAvAntiStenosisGatesPassed,
    );
  const allFixedRunsHaveOneDistinctAorticFlowPeak =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.fixedHasOneDistinctAorticFlowPeak,
    );
  const allFixedRunsHaveExactlyOneCompleteOnePercentFlowEpisode =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.fixedHasExactlyOneCompleteOnePercentFlowEpisode,
    );
  const allFixedExactStationAuditsPassed = pairsInFrozenCatalogOrder.every(
    (pair) => pair.fixedExactStationAuditPassed,
  );
  const allFixedSimplifiedPeakGradientVmaxIdentitiesPassed =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.fixedSimplifiedPeakGradientVmaxIdentityPassed,
    );
  const allFixedTwoSidedRestingVmaxAndGradientReadoutsMatched =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.fixedTwoSidedRestingVmaxAndGradientReadoutsMatched,
    );
  const allFixedArmLevelAvAntiStenosisGatesPassed =
    pairsInFrozenCatalogOrder.every(
      (pair) => pair.fixedArmLevelAvAntiStenosisGatesPassed,
    );
  const compoundComparisonValidityPassed =
    allPairedExactModelIdentitiesMatched &&
    allExecutionContractsPassed &&
    allPrimaryRunsHaveOneDistinctAorticFlowPeak &&
    allPrimaryRunsHaveExactlyOneCompleteOnePercentFlowEpisode &&
    allPrimaryExactStationAuditsPassed &&
    allPrimarySimplifiedPeakGradientVmaxIdentitiesPassed &&
    allFixedRunsHaveOneDistinctAorticFlowPeak &&
    allFixedRunsHaveExactlyOneCompleteOnePercentFlowEpisode &&
    allFixedExactStationAuditsPassed &&
    allFixedSimplifiedPeakGradientVmaxIdentitiesPassed;
  const allPrimaryAndFixedArmLevelAvAntiStenosisGatesPassed =
    allPrimaryArmLevelAvAntiStenosisGatesPassed &&
    allFixedArmLevelAvAntiStenosisGatesPassed;
  const disposition =
    classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAuditDispositionV1(
      Object.freeze({
        compoundComparisonValidityPassed,
        allNumericalComparisonsWithinTolerance,
        anyHardPhysiologyClassFlip,
        allPrimaryAndFixedArmLevelAvAntiStenosisGatesPassed,
      }),
    );
  const limitingUnionFixedHorizonAuditPassed =
    compoundComparisonValidityPassed &&
    allNumericalComparisonsWithinTolerance &&
    !anyHardPhysiologyClassFlip &&
    allPrimaryAndFixedArmLevelAvAntiStenosisGatesPassed;

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ANALYSIS_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_V1_ID,
    pairsInFrozenCatalogOrder,
    auditedUniqueArmCount: 6 as const,
    allPairedExactModelIdentitiesMatched,
    allExecutionContractsPassed,
    allNumericalComparisonsWithinTolerance,
    anyHardPhysiologyClassFlip,
    allPrimaryRunsHaveOneDistinctAorticFlowPeak,
    allPrimaryRunsHaveExactlyOneCompleteOnePercentFlowEpisode,
    allPrimaryExactStationAuditsPassed,
    allPrimarySimplifiedPeakGradientVmaxIdentitiesPassed,
    allPrimaryTwoSidedRestingVmaxAndGradientReadoutsMatched,
    allPrimaryArmLevelAvAntiStenosisGatesPassed,
    allFixedRunsHaveOneDistinctAorticFlowPeak,
    allFixedRunsHaveExactlyOneCompleteOnePercentFlowEpisode,
    allFixedExactStationAuditsPassed,
    allFixedSimplifiedPeakGradientVmaxIdentitiesPassed,
    allFixedTwoSidedRestingVmaxAndGradientReadoutsMatched,
    allFixedArmLevelAvAntiStenosisGatesPassed,
    limitingUnionFixedHorizonAuditPassed,
    compoundComparisonValidityPassed,
    auditStatus: disposition.auditStatus,
    compoundMismatchDetected: disposition.compoundMismatchDetected,
    nonNumericalAuditFailureDetected:
      disposition.nonNumericalAuditFailureDetected,
    physiologyGateFailureDetected: disposition.physiologyGateFailureDetected,
    decompositionStatus: disposition.decompositionStatus,
    horizonAndTimeStepEffectsSeparated: false as const,
    allThirtySixEnvelopeArmsAuditedAtFixedHorizon: false as const,
    continuityEquivalentEoaVariationRecertified: false as const,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ANALYSIS_CLAIM_V1,
  });
}

function measurePair(
  sentinelArm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1,
  primaryRun: PrimaryRun,
  fixedRun: FixedRun,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelPairAnalysisV1 {
  validatePrimaryExecution(sentinelArm, primaryRun);
  validateFixedExecution(sentinelArm, fixedRun);
  const primaryReadout =
    measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutV1(
      primaryRun,
    );
  const fixedHorizonReadout =
    measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutV1(
      fixedRun,
    );
  const identityAudit = identityAuditForPair(primaryRun, fixedRun);
  const primaryTerminalBeat =
    primaryRun.periodicResult.retainedCompleteBeats.at(-1);
  const fixedTerminalBeat =
    fixedRun.periodicResult.retainedCompleteBeats.at(-1);
  const expectedFixedBeatCount =
    sentinelArm.sourceEnvelopeArm.heartRateBpm === 50
      ? (40 as const)
      : (72 as const);
  const fixedEndpointTimeSec = fixedTerminalBeat?.endTimeSec ?? Number.NaN;
  const primaryColdStartAudit = coldStartAudit(primaryRun);
  const fixedColdStartAudit = coldStartAudit(fixedRun);
  const executionAudit = Object.freeze({
    primaryStepsPerCycle: 2_000 as const,
    primaryRequestedMaximumBeatCount: 72 as const,
    primaryCompletedBeatCount: primaryRun.periodicResult.completedBeatCount,
    primaryPeriod1AndIntegrationPassed:
      primaryReadout.ledger.period1AndIntegrationPassed,
    primaryHasNoPartialBeat:
      primaryRun.periodicResult.retainedPartialBeat.length === 0,
    primaryColdStartAudit,
    fixedStepsPerCycle: 4_000 as const,
    fixedRequestedAndCompletedBeatCount: expectedFixedBeatCount,
    fixedEndpointTimeSec,
    fixedEndpointTimeMatched48s: Math.abs(fixedEndpointTimeSec - 48) <= 1e-8,
    fixedPeriod1AndIntegrationPassed:
      fixedHorizonReadout.ledger.period1AndIntegrationPassed,
    fixedHasNoPartialBeat:
      fixedRun.periodicResult.retainedPartialBeat.length === 0,
    fixedColdStartAudit,
    independentCanonicalColdStartsMatched:
      primaryColdStartAudit.coldStartAuditPassed &&
      fixedColdStartAudit.coldStartAuditPassed,
    executionContractPassed:
      primaryRun.periodicResult.stepsPerBeat === 2_000 &&
      primaryRun.periodicResult.requestedMaximumBeatCount === 72 &&
      primaryTerminalBeat?.beatIndex ===
        primaryRun.periodicResult.completedBeatCount &&
      primaryReadout.ledger.period1AndIntegrationPassed &&
      primaryRun.periodicResult.retainedPartialBeat.length === 0 &&
      fixedRun.periodicResult.stepsPerBeat === 4_000 &&
      fixedRun.periodicResult.requestedMaximumBeatCount ===
        expectedFixedBeatCount &&
      fixedRun.periodicResult.completedBeatCount === expectedFixedBeatCount &&
      fixedTerminalBeat?.beatIndex === expectedFixedBeatCount &&
      Math.abs(fixedEndpointTimeSec - 48) <= 1e-8 &&
      fixedHorizonReadout.ledger.period1AndIntegrationPassed &&
      fixedRun.periodicResult.retainedPartialBeat.length === 0 &&
      primaryColdStartAudit.coldStartAuditPassed &&
      fixedColdStartAudit.coldStartAuditPassed,
  });
  const metricComparisons = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_COMPARISON_METRIC_IDS_V1.map(
      (metricId) =>
        compareMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelMetricV1(
          metricId,
          primaryReadout.metrics[metricId],
          fixedHorizonReadout.metrics[metricId],
        ),
    ),
  );
  const hardClassComparisons = hardClassComparisonsForPair(
    primaryReadout,
    fixedHorizonReadout,
  );
  const anyMaterialMetricDifference = metricComparisons.some(
    (comparison) => comparison.materialDifference,
  );
  const anyHardPhysiologyClassFlip = hardClassComparisons.some(
    (comparison) => comparison.hardPhysiologyClassFlip,
  );
  const primaryHasOneDistinctAorticFlowPeak =
    primaryReadout.ledger.singleDistinctAorticFlowPeakPassed;
  const primaryHasExactlyOneCompleteOnePercentFlowEpisode =
    hasExactlyOneCompleteOnePercentFlowEpisode(primaryReadout);
  const primaryExactStationAuditPassed =
    primaryReadout.ledger.exactStationAuditPassed;
  const primarySimplifiedPeakGradientVmaxIdentityPassed =
    simplifiedPeakGradientVmaxIdentityPassed(primaryReadout);
  const primaryTwoSidedRestingVmaxAndGradientReadoutsMatched =
    primaryReadout.physiologyGate
      .allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched;
  const primaryArmLevelAvAntiStenosisGatesPassed =
    primaryReadout.physiologyGate
      .allArmLevelAvAntiStenosisRobustnessGatesPassed;
  const fixedHasOneDistinctAorticFlowPeak =
    fixedHorizonReadout.ledger.singleDistinctAorticFlowPeakPassed;
  const fixedHasExactlyOneCompleteOnePercentFlowEpisode =
    hasExactlyOneCompleteOnePercentFlowEpisode(fixedHorizonReadout);
  const fixedExactStationAuditPassed =
    fixedHorizonReadout.ledger.exactStationAuditPassed;
  const fixedSimplifiedPeakGradientVmaxIdentityPassed =
    simplifiedPeakGradientVmaxIdentityPassed(fixedHorizonReadout);
  const fixedTwoSidedRestingVmaxAndGradientReadoutsMatched =
    fixedHorizonReadout.physiologyGate
      .allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched;
  const fixedArmLevelAvAntiStenosisGatesPassed =
    fixedHorizonReadout.physiologyGate
      .allArmLevelAvAntiStenosisRobustnessGatesPassed;
  const pairPassed =
    identityAudit.allExactModelIdentitiesMatched &&
    executionAudit.executionContractPassed &&
    !anyMaterialMetricDifference &&
    !anyHardPhysiologyClassFlip &&
    primaryHasOneDistinctAorticFlowPeak &&
    primaryHasExactlyOneCompleteOnePercentFlowEpisode &&
    primaryExactStationAuditPassed &&
    primarySimplifiedPeakGradientVmaxIdentityPassed &&
    primaryArmLevelAvAntiStenosisGatesPassed &&
    fixedHasOneDistinctAorticFlowPeak &&
    fixedHasExactlyOneCompleteOnePercentFlowEpisode &&
    fixedExactStationAuditPassed &&
    fixedSimplifiedPeakGradientVmaxIdentityPassed &&
    fixedArmLevelAvAntiStenosisGatesPassed;
  return Object.freeze({
    sentinelArm,
    primaryReadout,
    fixedHorizonReadout,
    identityAudit,
    executionAudit,
    metricComparisons,
    hardClassComparisons,
    anyMaterialMetricDifference,
    anyHardPhysiologyClassFlip,
    primaryHasOneDistinctAorticFlowPeak,
    primaryHasExactlyOneCompleteOnePercentFlowEpisode,
    primaryExactStationAuditPassed,
    primarySimplifiedPeakGradientVmaxIdentityPassed,
    primaryTwoSidedRestingVmaxAndGradientReadoutsMatched,
    primaryArmLevelAvAntiStenosisGatesPassed,
    fixedHasOneDistinctAorticFlowPeak,
    fixedHasExactlyOneCompleteOnePercentFlowEpisode,
    fixedExactStationAuditPassed,
    fixedSimplifiedPeakGradientVmaxIdentityPassed,
    fixedTwoSidedRestingVmaxAndGradientReadoutsMatched,
    fixedArmLevelAvAntiStenosisGatesPassed,
    pairPassed,
  });
}

function coldStartAudit(
  run: PrimaryRun | FixedRun,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelColdStartAuditV1 {
  const result = run.periodicResult;
  const audit = result.initializationAudit;
  const initializationIsCanonical = result.initialization === "canonical";
  const totalBloodVolumeDifferenceIsZero =
    audit.canonicalTotalBloodVolumeMl === audit.initializedTotalBloodVolumeMl &&
    audit.totalBloodVolumeDifferenceMl === 0;
  const noColdStateCategoryChanged =
    audit.chamberVolumesChanged === false &&
    audit.dynamicEdgeFlowsChanged === false &&
    audit.valveOpeningStatesChanged === false &&
    audit.mechanicsColdInputChanged === false &&
    audit.mechanicsColdStateFingerprintChanged === false;
  const noPulmonaryRedistributionApplied =
    audit.transferredVolumeMl === 0 &&
    audit.sourceNode === null &&
    audit.destinationNode === null &&
    audit.pulmonaryNodeVolumeDeltaMl.PVen === 0 &&
    audit.pulmonaryNodeVolumeDeltaMl.PVein === 0;
  const allWarmStartIdentityHashesAreNull =
    audit.warmStartSourceProtocolIdentityHash === null &&
    audit.warmStartTargetProtocolIdentityHash === null &&
    audit.warmStartSourcePericardiumStableHash === null &&
    audit.warmStartTargetPericardiumStableHash === null;
  const warmStartProtocolDifferenceIsNotAWarmStart =
    audit.warmStartProtocolDifference === "not-a-warm-start";
  const terminalWarmStartIsNull =
    result.terminalCycleBoundaryWarmStart === null;
  const runnerClaimsNoWarmStart = run.claim.warmStartApplied === false;
  return Object.freeze({
    initializationIsCanonical,
    totalBloodVolumeDifferenceIsZero,
    noColdStateCategoryChanged,
    noPulmonaryRedistributionApplied,
    allWarmStartIdentityHashesAreNull,
    warmStartProtocolDifferenceIsNotAWarmStart,
    terminalWarmStartIsNull,
    runnerClaimsNoWarmStart,
    coldStartAuditPassed:
      initializationIsCanonical &&
      totalBloodVolumeDifferenceIsZero &&
      noColdStateCategoryChanged &&
      noPulmonaryRedistributionApplied &&
      allWarmStartIdentityHashesAreNull &&
      warmStartProtocolDifferenceIsNotAWarmStart &&
      terminalWarmStartIsNull &&
      runnerClaimsNoWarmStart,
  });
}

function hasExactlyOneCompleteOnePercentFlowEpisode(
  readout: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1,
): boolean {
  const episode = readout.ledger.onePercentFlowEjectionTime;
  return (
    episode.cyclicEpisodeCount === 1 &&
    episode.extraActiveSampleCountOutsidePrimaryEpisode === 0 &&
    Number.isFinite(episode.interpolatedEjectionTimeSec)
  );
}

function simplifiedPeakGradientVmaxIdentityPassed(
  readout: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1,
): boolean {
  const peakGradient = readout.metrics.peakDopplerGradientMmHg;
  const vmax = readout.metrics.peakVenaContractaVelocityMPerSec;
  return (
    peakGradient !== null &&
    vmax !== null &&
    Number.isFinite(peakGradient) &&
    Number.isFinite(vmax) &&
    Math.abs(peakGradient - 4 * vmax ** 2) <= 1e-12
  );
}

export function compareMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelMetricV1(
  metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelComparisonMetricIdV1,
  primaryValue: number | null,
  fixedValue: number | null,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelMetricComparisonV1 {
  if (
    primaryValue === null ||
    fixedValue === null ||
    !Number.isFinite(primaryValue) ||
    !Number.isFinite(fixedValue)
  ) {
    throw new Error(
      `${metricId} fixed-horizon comparison requires two finite values`,
    );
  }
  const materialityTolerance =
    mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
      metricId,
      primaryValue,
    );
  if (
    materialityTolerance === null ||
    !Number.isFinite(materialityTolerance) ||
    materialityTolerance < 0
  ) {
    throw new Error(
      `${metricId} has no finite nonnegative predeclared numerical tolerance`,
    );
  }
  const fixedMinusPrimary = fixedValue - primaryValue;
  const absoluteDifference = Math.abs(fixedMinusPrimary);
  if (
    !Number.isFinite(fixedMinusPrimary) ||
    !Number.isFinite(absoluteDifference)
  ) {
    throw new Error(`${metricId} produced a non-finite fixed-horizon delta`);
  }
  return Object.freeze({
    metricId,
    primaryCycleOver2000EarlyStopValue: primaryValue,
    fixed48sCycleOver4000Value: fixedValue,
    fixedMinusPrimary,
    absoluteDifference,
    materialityTolerance,
    materialDifference: absoluteDifference > materialityTolerance,
  });
}

function hardClassComparisonsForPair(
  primary: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1,
  fixed: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1,
): readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelHardClassComparisonV1[] {
  return Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_INDEPENDENT_HARD_METRIC_IDS_V1.map(
      (metricId) =>
        compareMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelIndependentHardClassV1(
          metricId,
          primary.metrics[metricId],
          fixed.metrics[metricId],
        ),
    ),
  );
}

export function compareMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelIndependentHardClassV1(
  metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelIndependentHardMetricIdV1,
  primaryValue: number | null,
  fixedValue: number | null,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelHardClassComparisonV1 {
  if (
    primaryValue === null ||
    fixedValue === null ||
    !Number.isFinite(primaryValue) ||
    !Number.isFinite(fixedValue)
  ) {
    throw new Error(
      `${metricId} independent hard-class comparison requires two finite values`,
    );
  }
  const primaryClass =
    classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
      metricId,
      primaryValue,
    );
  const fixedClass =
    classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
      metricId,
      fixedValue,
    );
  if (primaryClass === null || fixedClass === null) {
    throw new Error(`${metricId} is not an independent hard-gated metric`);
  }
  return Object.freeze({
    metricId,
    primaryClassPassed: primaryClass,
    fixedClassPassed: fixedClass,
    hardPhysiologyClassFlip: primaryClass !== fixedClass,
  });
}

function identityAuditForPair(
  primary: PrimaryRun,
  fixed: FixedRun,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelPairAnalysisV1["identityAudit"] {
  const envelopeArmIdentityMatched =
    protocolHash(primary.robustnessEnvelopeArm) ===
    protocolHash(fixed.robustnessEnvelopeArm);
  const referenceNonCalciumAssemblyIdentityMatched =
    primary.referenceNonCalciumAssembly === fixed.referenceNonCalciumAssembly;
  const protocolIdentityHashMatched =
    primary.periodicResult.protocolIdentityHash ===
    fixed.periodicResult.protocolIdentityHash;
  const protocolIdentityMatched =
    protocolHash(primary.periodicResult.protocolIdentity) ===
    protocolHash(fixed.periodicResult.protocolIdentity);
  const protocolComponentHashesMatched =
    protocolHash(primary.periodicResult.protocolComponentHashes) ===
    protocolHash(fixed.periodicResult.protocolComponentHashes);
  const exactAssemblyAuditMatched =
    protocolHash(primary.exactAssemblyAudit) ===
    protocolHash(fixed.exactAssemblyAudit);
  const valveResearchInputMatched =
    protocolHash(primary.periodicResult.valveResearchInput) ===
    protocolHash(fixed.periodicResult.valveResearchInput);
  const calciumDriveParamsMatched =
    protocolHash(primary.calciumDriveParams) ===
    protocolHash(fixed.calciumDriveParams);
  const pressureStationProfilesMatched =
    protocolHash([
      primary.placementProfile,
      primary.rootInertanceProfile,
      primary.aorticValveResearchProfile,
      primary.recoveredRootPortValveProfile,
    ]) ===
    protocolHash([
      fixed.placementProfile,
      fixed.rootInertanceProfile,
      fixed.aorticValveResearchProfile,
      fixed.recoveredRootPortValveProfile,
    ]);
  const resolvedFactorProfileReadbacksMatched =
    protocolHash([
      primary.kuwProfile,
      primary.sarcomereReferenceProfile,
      primary.calciumSensitivityLengthProfile,
      primary.sourceTwitchRetentionCandidate,
      primary.trefForceLoadProfile,
      primary.sourceVelocityDistortionProfile,
      primary.strongBridgeDeactivationExitProfile,
      primary.circulatoryLoadPoint,
      primary.stressedVenousVolumePoint,
      primary.complianceProfile,
    ]) ===
    protocolHash([
      fixed.kuwProfile,
      fixed.sarcomereReferenceProfile,
      fixed.calciumSensitivityLengthProfile,
      fixed.sourceTwitchRetentionCandidate,
      fixed.trefForceLoadProfile,
      fixed.sourceVelocityDistortionProfile,
      fixed.strongBridgeDeactivationExitProfile,
      fixed.circulatoryLoadPoint,
      fixed.stressedVenousVolumePoint,
      fixed.complianceProfile,
    ]);
  return Object.freeze({
    primaryExpectedFrozenCatalogIdentityPassed: true as const,
    fixedExpectedFrozenCatalogIdentityPassed: true as const,
    envelopeArmIdentityMatched,
    referenceNonCalciumAssemblyIdentityMatched,
    protocolIdentityHashMatched,
    protocolIdentityMatched,
    protocolComponentHashesMatched,
    exactAssemblyAuditMatched,
    valveResearchInputMatched,
    calciumDriveParamsMatched,
    pressureStationProfilesMatched,
    resolvedFactorProfileReadbacksMatched,
    allExactModelIdentitiesMatched:
      envelopeArmIdentityMatched &&
      referenceNonCalciumAssemblyIdentityMatched &&
      protocolIdentityHashMatched &&
      protocolIdentityMatched &&
      protocolComponentHashesMatched &&
      exactAssemblyAuditMatched &&
      valveResearchInputMatched &&
      calciumDriveParamsMatched &&
      pressureStationProfilesMatched &&
      resolvedFactorProfileReadbacksMatched,
    executionPolicyOnlyEligibleDifference: true as const,
  });
}

function validatePrimaryExecution(
  sentinelArm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1,
  run: PrimaryRun,
): void {
  assertMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeExpectedExactModelIdentityV1(
    run,
  );
  if (
    run.configurationRole !==
      "fixed-v10-matched-alpha-saturating-robustness-envelope-arm" ||
    run.robustnessEnvelopeArm.armId !== sentinelArm.sentinelArmId ||
    run.periodicResult.stepsPerBeat !== 2_000 ||
    run.periodicResult.requestedMaximumBeatCount !== 72 ||
    run.periodicResult.completedBeatCount > 72 ||
    run.periodicResult.initialization !== "canonical" ||
    run.periodicResult.integrationCompletedWithoutFailure !== true ||
    run.periodicResult.failure !== null ||
    run.periodicResult.periodicity.status !== "period1-converged" ||
    run.periodicResult.periodicSteadyStateClaimed !== true ||
    run.periodicResult.terminationReason !== "period1-converged" ||
    run.periodicResult.retainedPartialBeat.length !== 0 ||
    run.claim.independentCanonicalColdStart !== true ||
    run.claim.warmStartApplied !== false ||
    run.claim.fixedPhysicalHorizonAuditCompleted !== false
  ) {
    throw new Error(
      `${sentinelArm.sentinelArmId} primary pair must be canonical cycle/2000 maximum-72 early-stop P1 execution`,
    );
  }
}

function validateFixedExecution(
  sentinelArm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmV1,
  run: FixedRun,
): void {
  assertMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeExpectedExactModelIdentityV1(
    run,
  );
  const expectedBeatCount =
    sentinelArm.sourceEnvelopeArm.heartRateBpm === 50 ? 40 : 72;
  const terminalBeat = run.periodicResult.retainedCompleteBeats.at(-1);
  if (
    run.configurationRole !==
      "fixed-v10-matched-alpha-saturating-robustness-envelope-48s-sentinel-arm" ||
    protocolHash(run.fixedHorizonSentinelArm) !== protocolHash(sentinelArm) ||
    run.fixedHorizonSentinelArm.sentinelArmId !== sentinelArm.sentinelArmId ||
    run.robustnessEnvelopeArm.armId !== sentinelArm.sentinelArmId ||
    run.executionPolicy.stepsPerCycle !== 4_000 ||
    run.executionPolicy.fixedPhysicalHorizonSec !== 48 ||
    run.executionPolicy.minimumCompletedBeatCountBeforePeriodicTermination !==
      expectedBeatCount ||
    run.executionPolicy.maximumBeatCount !== expectedBeatCount ||
    run.periodicResult.stepsPerBeat !== 4_000 ||
    run.periodicResult.requestedMaximumBeatCount !== expectedBeatCount ||
    run.periodicResult.completedBeatCount !== expectedBeatCount ||
    run.periodicResult.initialization !== "canonical" ||
    run.periodicResult.integrationCompletedWithoutFailure !== true ||
    run.periodicResult.failure !== null ||
    run.periodicResult.periodicity.status !== "period1-converged" ||
    run.periodicResult.periodicSteadyStateClaimed !== true ||
    run.periodicResult.terminationReason !== "period1-converged" ||
    run.periodicResult.retainedPartialBeat.length !== 0 ||
    terminalBeat?.beatIndex !== expectedBeatCount ||
    Math.abs((terminalBeat?.endTimeSec ?? Number.NaN) - 48) > 1e-8 ||
    run.claim.independentCanonicalColdStart !== true ||
    run.claim.warmStartApplied !== false ||
    run.claim.fixedPhysicalHorizonAuditCompleted !== true ||
    run.claim.periodicTerminationBeforeFixedHorizonAccepted !== false
  ) {
    throw new Error(
      `${sentinelArm.sentinelArmId} fixed pair must be exact 48-second cycle/4000 P1 execution`,
    );
  }
}

function uniqueRunMap<T extends PrimaryRun | FixedRun>(
  runs: readonly T[],
  label: "primary" | "fixed",
): ReadonlyMap<string, T> {
  const byArmId = new Map<string, T>();
  for (const run of runs) {
    const armId = run.robustnessEnvelopeArm.armId;
    if (byArmId.has(armId)) {
      throw new Error(`duplicate ${label} fixed-horizon pair arm: ${armId}`);
    }
    byArmId.set(armId, run);
  }
  return byArmId;
}

function protocolHash(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}
