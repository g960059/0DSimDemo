import {
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CERTIFICATION_AUGMENTATION_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FACTOR_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PRIMARY_FRACTION_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SCREENING_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_V1_ID,
  resolveMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchRunV1,
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1,
  MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-robustness-envelope-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PHYSIOLOGY_GATES_V1 =
  Object.freeze({
    peakVenaContractaVelocityMPerSec: Object.freeze({
      minimum: 0.83,
      maximum: 1.59,
    }),
    meanDopplerGradientMmHg: Object.freeze({ minimum: 1.09, maximum: 5.01 }),
    peakDopplerGradientMmHg: Object.freeze({ minimum: 2.76, maximum: 10.11 }),
    onePercentFlowEjectionTimeSec: Object.freeze({ maximum: 0.336 }),
    correctedValveEventLvetMs: Object.freeze({ maximum: 415 }),
    accelerationTimeSec: Object.freeze({ maximum: 0.129 }),
    activeEoaAtPeakForwardFlowUtilization01: Object.freeze({ minimum: 0.95 }),
    flowWeightedMeanActiveEoaUtilization01: Object.freeze({ minimum: 0.9 }),
    continuityEquivalentEoaCoefficientOfVariation01: Object.freeze({
      maximum: 0.05,
    }),
  });

/**
 * Predeclared materiality scales for a later matched early-stop versus fixed
 * horizon numerical audit. This V1 analysis does not execute that audit.
 */
export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_NUMERICAL_GATES_V1 =
  Object.freeze({
    ejectionTimeSec: Object.freeze({ absolute: 0.0012, relative01: 0.01 }),
    isovolumicContractionTimeSec: Object.freeze({
      absolute: 0.0012,
      relative01: 0.01,
    }),
    isovolumicRelaxationTimeSec: Object.freeze({
      absolute: 0.0012,
      relative01: 0.01,
    }),
    strokeVolumeMl: Object.freeze({ absolute: 0.5, relative01: 0.01 }),
    peakVenaContractaVelocityMPerSec: Object.freeze({
      absolute: 0.01,
      relative01: 0.01,
    }),
    meanDopplerGradientMmHg: Object.freeze({ absolute: 0.05, relative01: 0 }),
    peakDopplerGradientMmHg: Object.freeze({ absolute: 0.1, relative01: 0 }),
    leftVentricularTeiIndex: Object.freeze({ absolute: 0.01, relative01: 0 }),
    maximumPositiveLeftVentricularDpdtMmHgPerSec: Object.freeze({
      absolute: 0,
      relative01: 0.02,
    }),
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source:
      "last-retained-complete-beat-per-independent-cold-fixed-catalog-arm" as const,
    primaryDesign:
      "resolution-V-HR-by-systemic-resistance-by-systemic-arterial-tangent-stiffness-by-fixed-TBV-operating-point-by-Tref-half-fraction" as const,
    definingRelation:
      "H-times-R-times-K-times-V-times-T-equals-plus-one" as const,
    primaryModelTerms:
      "intercept-plus-five-main-effects-plus-ten-two-factor-interactions" as const,
    interceptIsAliasedWithFiveFactorInteraction: true as const,
    mainEffectsAreAliasedWithFourFactorInteractions: true as const,
    twoFactorInteractionsAreAliasedWithThreeFactorInteractions: true as const,
    primaryCoefficientsSupportCausalEffectIdentification: false as const,
    safetyGuards:
      "four-a-priori-opposite-fraction-corners-targeting-ET-mPG-pPG-and-flow-derived-Tei" as const,
    screeningPhaseArmCount: 24 as const,
    fullCornerCertificationAugmentationArmCount: 12 as const,
    fullCertificationArmCountIncludingCenterlines: 36 as const,
    fullCornerCertificationAugmentationIsPredeclaredAndNonAdaptive:
      true as const,
    screeningPassingAloneCannotSupportPositiveFullEnvelopeClaim: true as const,
    fixedTbvAxisMeaning:
      "fixed-total-blood-volume-catalog-operating-point-with-initial-SV-VC-ledger-perturbation" as const,
    purePreloadOrConvergedStressedVolumeEquivalenceClaimed: false as const,
    primaryEjectionTime:
      "linearly-interpolated-one-percent-global-positive-AoV-flow-cyclic-episode" as const,
    primaryEjectionTimeRequiresExactlyOneCyclicOnePercentFlowEpisode:
      true as const,
    extraOnePercentActiveSamplesOutsidePrimaryEpisodeAllowed: false as const,
    correctedValveEventLvet:
      "direct-model-valve-event-analogue-plus-1p4-ms-per-bpm-used-only-as-upper-falsification-bound" as const,
    correctedValveEventLvetLowerBoundApplied: false as const,
    timingLowerBoundNormalityEstablished: false as const,
    ETCorrectedLvetAndAccelerationTimeAreUpperOnlyAntiProlongationFalsificationGates:
      true as const,
    timingUpperBoundsAreClaimedNormalRangeTests: false as const,
    ictAndTeiAreFlowThresholdModelAnaloguesNotClinicalMeasurements:
      true as const,
    ictAndTeiReportedButExcludedFromHardPhysiologyRejection: true as const,
    rawLvMinusAorticNodeDifferenceIsStationAuditNotAorticStenosisCriterion:
      true as const,
    simplifiedBernoulliPeakGradientEqualsFourTimesVmaxSquared: true as const,
    simplifiedPeakGradientAndVmaxCountAsIndependentValidationEvidence:
      false as const,
    simplifiedPeakGradientUpperBoundIsAnIndependentHardGate: false as const,
    simplifiedPeakGradientExcludedFromIndependentHardClassFlipAggregate:
      true as const,
    simplifiedPeakGradientReportedSeparatelyForClinicalReadability:
      true as const,
    WaseRestingReferenceIntervalsReportedTwoSidedForTransparency: true as const,
    fallingBelowRestingVmaxOrGradientLowerBoundIsAvFailure: false as const,
    AVAntiStenosisRobustnessUsesVmaxAndGradientUpperBoundsOnly: true as const,
    exactLocalPortAndDopplerStationsRemainDistinct: true as const,
    pressureRecoveryAndProximalPortOwnedByExactV10Model: true as const,
    EoaVariationUsesForwardFlowContinuityEquivalentEoa: true as const,
    EoaVariationFivePercentIsInternalRobustnessToleranceNotLiteratureNormality:
      true as const,
    configuredMaximumEoaIsInvariantByConstruction: true as const,
    continuityAndGradientEquivalentEoaAreClinicalValveAreaMeasurements:
      false as const,
    functionalOpeningUtilizationAuditedAtPeakAndFlowWeightedMean: true as const,
    functionalOpeningUtilizationIncludedInHardClassFlipAggregate: true as const,
    functionalOpeningUtilizationThresholdsAreClinicalCutoffs: false as const,
    positiveEarlyStopReadoutScope:
      "discrete-32-endpoint-corners-plus-four-nominal-heart-rate-centerlines-with-two-sided-resting-Vmax-mPG-and-redundant-pPG-readouts-preserved-functional-opening-and-no-timing-prolongation" as const,
    continuousInteriorRobustnessEstablished: false as const,
    fullContinuousFiveFactorHyperrectangleCertified: false as const,
    exactComponentHashFactorIsolationAuditedAcrossAllThirtySixArms:
      true as const,
    componentHashFactorIsolationUsesDeclaredCatalogAxesOnly: true as const,
    valveResearchInputStableHashInvariantAcrossAllThirtySixArms: true as const,
    fixedPhysicalHorizonAuditCompleted: false as const,
    numericalThresholdsPredeclaredForLaterAuditOnly: true as const,
    safetyGuardResidualUsesSameThresholdMagnitudesAsMaterialityScaleOnly:
      true as const,
    safetyGuardResidualIsSingleInteractionOrCausalAttribution: false as const,
    safetyGuardResidualMeaning:
      "opposite-fraction-observation-minus-lower-order-extrapolation-fitted-on-defining-fraction-residual-conflates-aliased-higher-order-contributions-and-lack-of-transport" as const,
    safetyGuardResidualIsNumericalConvergenceEvidence: false as const,
    outcomeTargetedPerArmTuningApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_METRIC_IDS_V1 =
  Object.freeze([
    "onePercentFlowEjectionTimeSec",
    "valveEventLvetSec",
    "correctedValveEventLvetMs",
    "accelerationTimeSec",
    "strokeVolumeMl",
    "peakVenaContractaVelocityMPerSec",
    "meanDopplerGradientMmHg",
    "peakDopplerGradientMmHg",
    "activeEoaAtPeakForwardFlowCm2",
    "activeEoaAtPeakForwardFlowUtilization01",
    "flowWeightedMeanActiveEoaCm2",
    "flowWeightedMeanActiveEoaUtilization01",
    "forwardFlowContinuityEquivalentEoaCm2",
    "meanGradientEquivalentEoaCm2",
    "isovolumicContractionTimeSec",
    "isovolumicRelaxationTimeSec",
    "leftVentricularTeiIndex",
    "maximumPositiveLeftVentricularDpdtMmHgPerSec",
    "meanAorticPressureMmHg",
    "meanRawLvMinusAorticNodeGradientMmHg",
    "peakRawLvMinusAorticNodeGradientMmHg",
    "meanExactLocalPortGradientMmHg",
    "peakExactLocalPortGradientMmHg",
  ] as const);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_METRIC_IDS_V1)[number];

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricVectorV1 =
  Readonly<
    Record<
      MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
      number | null
    >
  >;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmGateV1 =
  Readonly<{
    peakVenaContractaVelocityTwoSidedReferenceIntervalMatched: boolean;
    meanDopplerGradientTwoSidedReferenceIntervalMatched: boolean;
    peakDopplerGradientTwoSidedReferenceIntervalMatched: boolean;
    allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched: boolean;
    peakVenaContractaVelocityUpperBoundPassed: boolean;
    meanDopplerGradientUpperBoundPassed: boolean;
    peakDopplerGradientRedundantUpperBoundReadoutMatched: boolean;
    onePercentFlowEjectionTimeUpperBoundPassed: boolean;
    correctedValveEventLvetUpperBoundPassed: boolean | null;
    accelerationTimeUpperBoundPassed: boolean;
    activeEoaAtPeakForwardFlowUtilizationPassed: boolean;
    flowWeightedMeanActiveEoaUtilizationPassed: boolean;
    allArmLevelAvAntiStenosisRobustnessGatesPassed: boolean;
    ictAndTeiReportedWithoutHardGate: true;
    rawNodeGradientExcludedFromAsClassification: true;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1;
    protocolIdentityHash: string;
    protocolComponentHashes: MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
    exactAssemblyAudit: MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchRunV1["exactAssemblyAudit"];
    ledger: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1;
    metrics: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricVectorV1;
    physiologyGate: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmGateV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeGuardResidualV1 =
  Readonly<{
    guardArmId: string;
    safetyGuardTarget:
      | "ejection-time"
      | "mean-doppler-gradient"
      | "peak-doppler-gradient"
      | "flow-derived-left-ventricular-tei-index";
    metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1;
    predictedFromResolutionVPrimary: number | null;
    observed: number | null;
    residualObservedMinusPredicted: number | null;
    materialityTolerance: number | null;
    materialResidual: boolean | null;
    hardPhysiologyClassFlip: boolean | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeEoaVariationV1 =
  Readonly<{
    armCount: 36;
    meanCm2: number;
    minimumCm2: number;
    maximumCm2: number;
    populationStandardDeviationCm2: number;
    coefficientOfVariation01: number;
    relativeRange01: number;
    coefficientOfVariationGatePassed: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeLimitingArmsV1 =
  Readonly<{
    maximumEjectionTimeArmId: string;
    maximumMeanDopplerGradientArmId: string;
    maximumVmaxArmId: string;
    maximumPeakDopplerGradientArmId: string;
    vmaxAndPeakGradientSelectSameArm: boolean;
    maximumAccelerationTimeArmId: string;
    minimumFlowWeightedFunctionalOpeningUtilizationArmId: string;
    slowestPeriod1ConvergenceArmId: string;
    highestTerminalPeriod1ResidualArmId: string;
    uniqueFixedHorizonSentinelArmIds: readonly string[];
    sentinelUnionClaimedToCoverAllThirtySixArms: false;
    horizonAndDtEffectsSeparatedByThisAnalysis: false;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisGroupV1 =
  Readonly<{
    coordinateId: string;
    armCount: number;
    observedStableHashes: readonly string[];
    oneHashWithinCoordinate: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisAuditV1 =
  Readonly<{
    declaredAxis:
      | "heart-rate"
      | "ventricular-Tref-force-scale"
      | "fixed-TBV-operating-point"
      | "systemic-resistance-and-arterial-tangent-stiffness";
    expectedCoordinateGroupCount: number;
    observedCoordinateGroupCount: number;
    expectedDistinctHashCount: number;
    observedDistinctHashCount: number;
    coordinateGroups: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisGroupV1[];
    sameCoordinateGroupEqualityPassed: boolean;
    crossCoordinateDistinctnessPassed: boolean;
    expectedCoordinateGroupCountMatched: boolean;
    expectedDistinctHashCountMatched: boolean;
    declaredAxisIsolationPassed: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeInvariantHashAuditV1 =
  Readonly<{
    expectedDistinctHashCount: 1;
    observedDistinctHashCount: number;
    oneHashAcrossAllArms: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1 =
  Readonly<{
    auditedArmCount: number;
    allThirtySixCatalogArmsAuditedExactlyOnce: boolean;
    calciumDriveFixedParamsHashByHeartRate: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisAuditV1;
    mechanicsProviderParameterIdentityHashByTrefForceLevel: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisAuditV1;
    mechanicsProviderMetadataHashByTrefForceLevel: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisAuditV1;
    bloodVolumeOperatingPointHashByFixedTbvLevel: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisAuditV1;
    circulationRuntimeHashByResistanceAndStiffness: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisAuditV1;
    valveResearchInputHash: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeInvariantHashAuditV1;
    circulationTopologyHash: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeInvariantHashAuditV1;
    commonPericardiumHash: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeInvariantHashAuditV1;
    periodicPolicyHash: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeInvariantHashAuditV1;
    allDeclaredAxisIsolationPassed: boolean;
    allInvariantComponentHashesSingleAcrossArms: boolean;
    allFactorIsolationAndInvariantHashGuardsPassed: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ANALYSIS_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_V1_ID;
    armsInCatalogOrder: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1[];
    safetyGuardResiduals: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeGuardResidualV1[];
    continuityEquivalentEoaVariation: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeEoaVariationV1;
    limitingArmsForLaterFixedHorizonAudit: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeLimitingArmsV1;
    factorHashIsolation: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1;
    allProtocolIdentityHashesUnique: boolean;
    oneCirculationTopologyHash: boolean;
    oneCommonPericardiumHash: boolean;
    onePeriodicPolicyHash: boolean;
    exactAssemblyAuditsMatchProtocolHashes: boolean;
    allArmsUseSupportedMatchedResolutionAndMaximumBeatCount: boolean;
    allArmsPeriod1AndIntegrationPassed: boolean;
    allArmsHaveOneDistinctAorticFlowPeak: boolean;
    allArmsHaveExactlyOneCompleteOnePercentFlowEpisode: boolean;
    allExactStationAuditsPassed: boolean;
    allSimplifiedPeakGradientVmaxIdentitiesWithinTolerance: boolean;
    allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched: boolean;
    allArmLevelAvAntiStenosisRobustnessGatesPassed: boolean;
    allAvAntiStenosisRobustnessGatesPassedIncludingEoaVariation: boolean;
    allExactIdentityAndDeclaredFactorIsolationGuardsPassed: boolean;
    fullCornerEarlyStopRobustnessReadoutPassed: boolean;
    screeningPhaseArmCount: 24;
    fullCornerCertificationAugmentationArmCount: 12;
    fullCornerCertificationExecuted: true;
    safetyGuardScreeningReadout: Readonly<{
      anyMaterialGuardResidual: boolean;
      anyHardPhysiologyClassFlip: boolean;
      positiveFullEnvelopeClaimInferredFromScreeningOnly: false;
    }>;
    fixedPhysicalHorizonAuditStatus: "not-executed";
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ANALYSIS_CLAIM_V1;
  }>;

type Run =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchRunV1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutSourceV1 =
  | MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchRunV1
  | MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1;

type PrimaryModel = Readonly<
  Record<
    MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
    readonly number[] | null
  >
>;

export function auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
  runs: readonly Run[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1 {
  const catalogArmIds = new Set(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.map(
      (arm) => arm.armId,
    ),
  );
  const observedArmIds = runs.map((run) => run.robustnessEnvelopeArm.armId);
  const allThirtySixCatalogArmsAuditedExactlyOnce =
    runs.length === 36 &&
    new Set(observedArmIds).size === 36 &&
    observedArmIds.every((armId) => catalogArmIds.has(armId));
  const calciumDriveFixedParamsHashByHeartRate = hashAxisAudit(
    runs,
    "heart-rate",
    (run) => `heart-rate-bpm:${run.robustnessEnvelopeArm.heartRateBpm}`,
    (run) =>
      run.periodicResult.protocolComponentHashes
        .calciumDriveFixedParamsStableHash,
    4,
  );
  const mechanicsProviderParameterIdentityHashByTrefForceLevel = hashAxisAudit(
    runs,
    "ventricular-Tref-force-scale",
    (run) =>
      `ventricular-Tref-force-level:${run.robustnessEnvelopeArm.ventricularTrefForceLevel}`,
    (run) =>
      run.periodicResult.protocolIdentity.mechanicsProvider
        .parameterIdentityHash,
    3,
  );
  const mechanicsProviderMetadataHashByTrefForceLevel = hashAxisAudit(
    runs,
    "ventricular-Tref-force-scale",
    (run) =>
      `ventricular-Tref-force-level:${run.robustnessEnvelopeArm.ventricularTrefForceLevel}`,
    (run) =>
      run.periodicResult.protocolComponentHashes
        .mechanicsProviderMetadataStableHash,
    3,
  );
  const bloodVolumeOperatingPointHashByFixedTbvLevel = hashAxisAudit(
    runs,
    "fixed-TBV-operating-point",
    (run) =>
      `fixed-TBV-operating-point-level:${run.robustnessEnvelopeArm.stressedVenousVolumeLevel}`,
    (run) =>
      run.periodicResult.protocolComponentHashes
        .bloodVolumeOperatingPointStableHash,
    3,
  );
  const circulationRuntimeHashByResistanceAndStiffness = hashAxisAudit(
    runs,
    "systemic-resistance-and-arterial-tangent-stiffness",
    (run) =>
      [
        `systemic-resistance-level:${run.robustnessEnvelopeArm.systemicResistanceLevel}`,
        `arterial-tangent-stiffness-level:${run.robustnessEnvelopeArm.systemicArterialTangentStiffnessLevel}`,
      ].join("|"),
    (run) =>
      run.periodicResult.protocolComponentHashes.circulationRuntimeStableHash,
    5,
  );
  const circulationTopologyHash = invariantHashAudit(
    runs.map(
      (run) =>
        run.periodicResult.protocolComponentHashes
          .circulationTopologyGraphStableHash,
    ),
  );
  const valveResearchInputHash = invariantHashAudit(
    runs.map(
      (run) =>
        run.periodicResult.protocolIdentity.circulation
          .valveResearchInputStableHash,
    ),
  );
  const commonPericardiumHash = invariantHashAudit(
    runs.map(
      (run) =>
        run.periodicResult.protocolComponentHashes.commonPericardiumStableHash,
    ),
  );
  const periodicPolicyHash = invariantHashAudit(
    runs.map(
      (run) =>
        run.periodicResult.protocolComponentHashes.periodicPolicyStableHash,
    ),
  );
  const allDeclaredAxisIsolationPassed = [
    calciumDriveFixedParamsHashByHeartRate,
    mechanicsProviderParameterIdentityHashByTrefForceLevel,
    mechanicsProviderMetadataHashByTrefForceLevel,
    bloodVolumeOperatingPointHashByFixedTbvLevel,
    circulationRuntimeHashByResistanceAndStiffness,
  ].every((audit) => audit.declaredAxisIsolationPassed);
  const allInvariantComponentHashesSingleAcrossArms = [
    valveResearchInputHash,
    circulationTopologyHash,
    commonPericardiumHash,
    periodicPolicyHash,
  ].every((audit) => audit.oneHashAcrossAllArms);
  return Object.freeze({
    auditedArmCount: runs.length,
    allThirtySixCatalogArmsAuditedExactlyOnce,
    calciumDriveFixedParamsHashByHeartRate,
    mechanicsProviderParameterIdentityHashByTrefForceLevel,
    mechanicsProviderMetadataHashByTrefForceLevel,
    bloodVolumeOperatingPointHashByFixedTbvLevel,
    circulationRuntimeHashByResistanceAndStiffness,
    valveResearchInputHash,
    circulationTopologyHash,
    commonPericardiumHash,
    periodicPolicyHash,
    allDeclaredAxisIsolationPassed,
    allInvariantComponentHashesSingleAcrossArms,
    allFactorIsolationAndInvariantHashGuardsPassed:
      allThirtySixCatalogArmsAuditedExactlyOnce &&
      allDeclaredAxisIsolationPassed &&
      allInvariantComponentHashesSingleAcrossArms,
  });
}

export function measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1(
  runs: readonly Run[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1 {
  if (
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SCREENING_ARMS_V1.length !==
      24 ||
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CERTIFICATION_AUGMENTATION_ARMS_V1.length !==
      12 ||
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.length !==
      36
  ) {
    throw new Error("V10 saturating robustness design cardinality mismatch");
  }
  const byId = new Map<string, Run>();
  for (const run of runs) {
    const armId = run.robustnessEnvelopeArm.armId;
    if (byId.has(armId)) {
      throw new Error(`duplicate V10 saturating robustness arm: ${armId}`);
    }
    byId.set(armId, run);
  }
  for (const arm of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1) {
    if (!byId.has(arm.armId)) {
      throw new Error(`missing V10 saturating robustness arm: ${arm.armId}`);
    }
  }
  if (
    byId.size !==
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.length
  ) {
    throw new Error(
      "V10 saturating robustness analysis requires exactly 36 arms",
    );
  }

  const orderedRuns =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.map(
      (arm) => byId.get(arm.armId)!,
    );
  orderedRuns.forEach(validateRunIdentity);
  const firstResult = orderedRuns[0]!.periodicResult;
  const allArmsUseSupportedMatchedResolutionAndMaximumBeatCount =
    (firstResult.stepsPerBeat === 500 || firstResult.stepsPerBeat === 2_000) &&
    firstResult.requestedMaximumBeatCount === 72 &&
    orderedRuns.every(
      (run) =>
        run.periodicResult.stepsPerBeat === firstResult.stepsPerBeat &&
        run.periodicResult.requestedMaximumBeatCount === 72,
    );
  if (!allArmsUseSupportedMatchedResolutionAndMaximumBeatCount) {
    throw new Error(
      "V10 saturating robustness analysis requires matched 500 or 2000 steps per beat and maximumBeatCount 72",
    );
  }

  const armsInCatalogOrder = Object.freeze(
    orderedRuns.map(
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutV1,
    ),
  );
  const primaryModel = fitPrimaryResolutionVModel(armsInCatalogOrder);
  const safetyGuardResiduals = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_SAFETY_GUARD_ARMS_V1.flatMap(
      (guard) => guardResiduals(guard, armsInCatalogOrder, primaryModel),
    ),
  );
  const continuityEquivalentEoaVariation = eoaVariation(armsInCatalogOrder);
  const limitingArmsForLaterFixedHorizonAudit = limitingArms(
    armsInCatalogOrder,
    orderedRuns,
  );
  const factorHashIsolation =
    auditMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorHashIsolationV1(
      orderedRuns,
    );
  const allProtocolIdentityHashesUnique =
    new Set(orderedRuns.map((run) => run.periodicResult.protocolIdentityHash))
      .size === orderedRuns.length;
  const allSimplifiedPeakGradientVmaxIdentitiesWithinTolerance =
    armsInCatalogOrder.every(
      (arm) =>
        Math.abs(
          arm.metrics.peakDopplerGradientMmHg! -
            4 * arm.metrics.peakVenaContractaVelocityMPerSec! ** 2,
        ) <= 1e-12,
    );
  const exactAssemblyAuditsMatchProtocolHashes = orderedRuns.every(
    (run) =>
      run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash ===
        run.periodicResult.protocolIdentity.mechanicsProvider
          .parameterIdentityHash &&
      run.exactAssemblyAudit.circulationRuntimeStableHash ===
        run.periodicResult.protocolComponentHashes
          .circulationRuntimeStableHash &&
      run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash ===
        run.periodicResult.protocolComponentHashes
          .bloodVolumeOperatingPointStableHash &&
      run.exactAssemblyAudit.calciumDriveFixedParamsStableHash ===
        run.periodicResult.protocolComponentHashes
          .calciumDriveFixedParamsStableHash,
  );
  const allArmsPeriod1AndIntegrationPassed = armsInCatalogOrder.every(
    (arm) => arm.ledger.period1AndIntegrationPassed,
  );
  const allArmsHaveOneDistinctAorticFlowPeak = armsInCatalogOrder.every(
    (arm) => arm.ledger.singleDistinctAorticFlowPeakPassed,
  );
  const allArmsHaveExactlyOneCompleteOnePercentFlowEpisode =
    armsInCatalogOrder.every(
      (arm) =>
        arm.ledger.onePercentFlowEjectionTime.cyclicEpisodeCount === 1 &&
        arm.ledger.onePercentFlowEjectionTime
          .extraActiveSampleCountOutsidePrimaryEpisode === 0,
    );
  const allExactStationAuditsPassed = armsInCatalogOrder.every(
    (arm) => arm.ledger.exactStationAuditPassed,
  );
  const allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched =
    armsInCatalogOrder.every(
      (arm) =>
        arm.physiologyGate
          .allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched,
    );
  const allArmLevelAvAntiStenosisRobustnessGatesPassed =
    armsInCatalogOrder.every(
      (arm) =>
        arm.physiologyGate.allArmLevelAvAntiStenosisRobustnessGatesPassed,
    );
  const anyMaterialGuardResidual = safetyGuardResiduals.some(
    (residual) => residual.materialResidual === true,
  );
  const anyHardPhysiologyClassFlip = safetyGuardResiduals.some(
    (residual) => residual.hardPhysiologyClassFlip === true,
  );
  const allExactIdentityAndDeclaredFactorIsolationGuardsPassed =
    allProtocolIdentityHashesUnique &&
    exactAssemblyAuditsMatchProtocolHashes &&
    factorHashIsolation.allFactorIsolationAndInvariantHashGuardsPassed;
  const allAvAntiStenosisRobustnessGatesPassedIncludingEoaVariation =
    allArmLevelAvAntiStenosisRobustnessGatesPassed &&
    continuityEquivalentEoaVariation.coefficientOfVariationGatePassed;
  const fullCornerEarlyStopRobustnessReadoutPassed =
    allExactIdentityAndDeclaredFactorIsolationGuardsPassed &&
    allArmsUseSupportedMatchedResolutionAndMaximumBeatCount &&
    allArmsPeriod1AndIntegrationPassed &&
    allArmsHaveOneDistinctAorticFlowPeak &&
    allArmsHaveExactlyOneCompleteOnePercentFlowEpisode &&
    allExactStationAuditsPassed &&
    allSimplifiedPeakGradientVmaxIdentitiesWithinTolerance &&
    allAvAntiStenosisRobustnessGatesPassedIncludingEoaVariation;

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ANALYSIS_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_V1_ID,
    armsInCatalogOrder,
    safetyGuardResiduals,
    continuityEquivalentEoaVariation,
    limitingArmsForLaterFixedHorizonAudit,
    factorHashIsolation,
    allProtocolIdentityHashesUnique,
    oneCirculationTopologyHash:
      factorHashIsolation.circulationTopologyHash.oneHashAcrossAllArms,
    oneCommonPericardiumHash:
      factorHashIsolation.commonPericardiumHash.oneHashAcrossAllArms,
    onePeriodicPolicyHash:
      factorHashIsolation.periodicPolicyHash.oneHashAcrossAllArms,
    exactAssemblyAuditsMatchProtocolHashes,
    allArmsUseSupportedMatchedResolutionAndMaximumBeatCount,
    allArmsPeriod1AndIntegrationPassed,
    allArmsHaveOneDistinctAorticFlowPeak,
    allArmsHaveExactlyOneCompleteOnePercentFlowEpisode,
    allExactStationAuditsPassed,
    allSimplifiedPeakGradientVmaxIdentitiesWithinTolerance,
    allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched,
    allArmLevelAvAntiStenosisRobustnessGatesPassed,
    allAvAntiStenosisRobustnessGatesPassedIncludingEoaVariation,
    allExactIdentityAndDeclaredFactorIsolationGuardsPassed,
    fullCornerEarlyStopRobustnessReadoutPassed,
    screeningPhaseArmCount: 24 as const,
    fullCornerCertificationAugmentationArmCount: 12 as const,
    fullCornerCertificationExecuted: true as const,
    safetyGuardScreeningReadout: Object.freeze({
      anyMaterialGuardResidual,
      anyHardPhysiologyClassFlip,
      positiveFullEnvelopeClaimInferredFromScreeningOnly: false as const,
    }),
    fixedPhysicalHorizonAuditStatus: "not-executed" as const,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ANALYSIS_CLAIM_V1,
  });
}

function validateRunIdentity(run: Run): void {
  assertMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeExpectedExactModelIdentityV1(
    run,
  );
  const arm = run.robustnessEnvelopeArm;
  if (
    run.configurationRole !==
      "fixed-v10-matched-alpha-saturating-robustness-envelope-arm" ||
    run.claim.outcomeTargetedRecalibrationApplied !== false ||
    run.claim.fixedPhysicalHorizonAuditCompleted !== false ||
    run.claim.parameterSearchOrFitting !== false ||
    run.claim.V10PressureRecoveryAndProximalPortOwnershipHeldExactly !== true
  ) {
    throw new Error(`${arm.armId} runner claim mismatch`);
  }
}

export function assertMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeExpectedExactModelIdentityV1(
  run: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutSourceV1,
): void {
  const arm = run.robustnessEnvelopeArm;
  const expected =
    resolveMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1(
      arm.armId,
    );
  const expectedProfile =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
      expected.calciumProfileId,
    );
  const expectedParams =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
      expected.calciumProfileId,
    );
  const result = run.periodicResult;
  if (
    protocolHash(arm) !== protocolHash(expected) ||
    protocolHash(run.saturatingHeartRateLawProfile) !==
      protocolHash(expectedProfile) ||
    protocolHash(run.calciumDriveParams) !== protocolHash(expectedParams) ||
    run.referenceNonCalciumAssembly !==
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 ||
    run.kuwProfile.profileId !== run.referenceNonCalciumAssembly.kuwProfileId ||
    run.sarcomereReferenceProfile.profileId !==
      run.referenceNonCalciumAssembly.sarcomereReferenceProfileId ||
    run.calciumSensitivityLengthProfile.profileId !==
      run.referenceNonCalciumAssembly.calciumSensitivityLengthProfileId ||
    run.sourceTwitchRetentionCandidate.candidateId !==
      run.referenceNonCalciumAssembly.twitchRetentionCandidateId ||
    run.sourceVelocityDistortionProfile.profileId !==
      run.referenceNonCalciumAssembly.sourceVelocityDistortionProfileId ||
    run.strongBridgeDeactivationExitProfile.profileId !==
      run.referenceNonCalciumAssembly.strongBridgeDeactivationExitProfileId ||
    run.placementProfile.profileId !==
      run.referenceNonCalciumAssembly
        .characteristicResistancePlacementProfileId ||
    run.rootInertanceProfile.profileId !==
      run.referenceNonCalciumAssembly.rootInertanceProfileId ||
    run.aorticValveResearchProfile.profileId !==
      run.referenceNonCalciumAssembly.pressureRecoveryProfileId ||
    run.recoveredRootPortValveProfile.profileId !==
      run.referenceNonCalciumAssembly.recoveredRootPortValveProfileId
  ) {
    throw new Error(`${arm.armId} robustness catalog identity mismatch`);
  }
  if (
    result.protocolIdentityHash !== protocolHash(result.protocolIdentity) ||
    result.protocolIdentity.calciumDrive.parameterSetId !==
      run.calciumDriveParams.parameterSetId ||
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash !==
      protocolHash(run.calciumDriveParams) ||
    result.protocolIdentity.circulation.valveResearchInputStableHash !==
      protocolHash(result.valveResearchInput) ||
    result.protocolIdentity.periodicPolicy.policyStableHash !==
      result.protocolComponentHashes.periodicPolicyStableHash ||
    result.claim.heartRateBpm !== arm.heartRateBpm ||
    result.initialization !== "canonical" ||
    result.valveResearchInput.valves.AoV.maximumForwardEoaCm2 !== 3.5
  ) {
    throw new Error(`${arm.armId} exact protocol identity mismatch`);
  }
  if (
    run.circulatoryLoadPoint.pointId !== arm.circulatoryLoadPointId ||
    run.circulatoryLoadPoint.systemicResistanceScaleFromBaseline !==
      arm.systemicResistanceScaleFromBaseline ||
    run.circulatoryLoadPoint.pulmonaryResistanceScaleFromBaseline !== 1 ||
    run.complianceProfile.profileId !== arm.complianceProfileId ||
    run.complianceProfile.arterialStiffnessScaleFromBaseline !==
      arm.systemicArterialTangentStiffnessAbsoluteScaleFromCanonical ||
    run.stressedVenousVolumePoint.pointId !== arm.stressedVenousVolumePointId ||
    run.stressedVenousVolumePoint.fixedTotalBloodVolumeMl !==
      arm.fixedTotalBloodVolumeMl ||
    run.trefForceLoadProfile.profileId !== arm.trefForceLoadProfileId ||
    run.trefForceLoadProfile.trefScaleFromRetainedCandidate !==
      arm.ventricularTrefForceScaleFromCandidate ||
    run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash !==
      result.protocolIdentity.mechanicsProvider.parameterIdentityHash ||
    run.exactAssemblyAudit.circulationRuntimeStableHash !==
      result.protocolComponentHashes.circulationRuntimeStableHash ||
    run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash !==
      result.protocolComponentHashes.bloodVolumeOperatingPointStableHash ||
    run.exactAssemblyAudit.calciumDriveFixedParamsStableHash !==
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash
  ) {
    throw new Error(`${arm.armId} declared factor readback mismatch`);
  }
}

export function measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutV1(
  run: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutSourceV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1 {
  const arm = run.robustnessEnvelopeArm;
  const ledger =
    measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
      Object.freeze({
        sourceLabel: arm.armId,
        calciumDriveParams: run.calciumDriveParams,
        periodicResult: run.periodicResult,
      }),
    );
  const cycle = ledger.cycleMetrics;
  const stations = ledger.load.exactPressureStations;
  const selectedBeat = run.periodicResult.retainedCompleteBeats.at(-1);
  if (selectedBeat === undefined) {
    throw new Error(`${arm.armId} functional opening audit requires a beat`);
  }
  const forwardSamples = selectedBeat.samples.filter(
    (sample) => sample.valveHydraulics.AoV.flowMlPerSec > 0,
  );
  if (forwardSamples.length === 0) {
    throw new Error(
      `${arm.armId} functional opening audit requires forward flow`,
    );
  }
  const peakForwardSample = forwardSamples.reduce((peak, sample) =>
    sample.valveHydraulics.AoV.flowMlPerSec >
    peak.valveHydraulics.AoV.flowMlPerSec
      ? sample
      : peak,
  );
  const configuredMaximumEoaCm2 =
    run.periodicResult.valveResearchInput.valves.AoV.maximumForwardEoaCm2;
  const forwardFlowWeight = forwardSamples.reduce(
    (sum, sample) => sum + sample.valveHydraulics.AoV.flowMlPerSec,
    0,
  );
  const activeEoaAtPeakForwardFlowCm2 =
    peakForwardSample.valveHydraulics.AoV.activeEoaCm2;
  const flowWeightedMeanActiveEoaCm2 =
    forwardSamples.reduce(
      (sum, sample) =>
        sum +
        sample.valveHydraulics.AoV.flowMlPerSec *
          sample.valveHydraulics.AoV.activeEoaCm2,
      0,
    ) / forwardFlowWeight;
  const valveEventLvetSec = cycle.leftVentricularValveEventEjectionTimeSec;
  const correctedValveEventLvetMs =
    valveEventLvetSec === null
      ? null
      : valveEventLvetSec * 1_000 + 1.4 * arm.heartRateBpm;
  const metrics = Object.freeze({
    onePercentFlowEjectionTimeSec:
      ledger.onePercentFlowEjectionTime.interpolatedEjectionTimeSec,
    valveEventLvetSec,
    correctedValveEventLvetMs,
    accelerationTimeSec: cycle.timeFromAorticFlowOnsetToPeakSec,
    strokeVolumeMl: cycle.aorticForwardVolumeMl,
    peakVenaContractaVelocityMPerSec: cycle.peakVenaContractaVelocityMPerSec,
    meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
    activeEoaAtPeakForwardFlowCm2,
    activeEoaAtPeakForwardFlowUtilization01:
      activeEoaAtPeakForwardFlowCm2 / configuredMaximumEoaCm2,
    flowWeightedMeanActiveEoaCm2,
    flowWeightedMeanActiveEoaUtilization01:
      flowWeightedMeanActiveEoaCm2 / configuredMaximumEoaCm2,
    forwardFlowContinuityEquivalentEoaCm2:
      cycle.aorticForwardFlowContinuityEquivalentEoaCm2,
    meanGradientEquivalentEoaCm2: cycle.aorticMeanGradientEquivalentEoaCm2,
    isovolumicContractionTimeSec:
      cycle.leftVentricularIsovolumicContractionTimeSec,
    isovolumicRelaxationTimeSec:
      cycle.leftVentricularIsovolumicRelaxationTimeSec,
    leftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
    maximumPositiveLeftVentricularDpdtMmHgPerSec:
      cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
    meanRawLvMinusAorticNodeGradientMmHg:
      stations.rawLvMinusAorticComplianceNodeGradientMmHg.timeMean,
    peakRawLvMinusAorticNodeGradientMmHg:
      stations.rawLvMinusAorticComplianceNodeGradientMmHg.peak,
    meanExactLocalPortGradientMmHg:
      stations.exactLvMinusProximalConstitutivePortGradientMmHg.timeMean,
    peakExactLocalPortGradientMmHg:
      stations.exactLvMinusProximalConstitutivePortGradientMmHg.peak,
  }) satisfies MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricVectorV1;
  const physiologyGate = armGate(metrics);
  return Object.freeze({
    arm,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
    exactAssemblyAudit: run.exactAssemblyAudit,
    ledger,
    metrics,
    physiologyGate,
  });
}

function armGate(
  metrics: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricVectorV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmGateV1 {
  const gates =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PHYSIOLOGY_GATES_V1;
  const peakVenaContractaVelocityTwoSidedReferenceIntervalMatched = inRange(
    metrics.peakVenaContractaVelocityMPerSec!,
    gates.peakVenaContractaVelocityMPerSec,
  );
  const meanDopplerGradientTwoSidedReferenceIntervalMatched = inRange(
    metrics.meanDopplerGradientMmHg!,
    gates.meanDopplerGradientMmHg,
  );
  const peakDopplerGradientTwoSidedReferenceIntervalMatched = inRange(
    metrics.peakDopplerGradientMmHg!,
    gates.peakDopplerGradientMmHg,
  );
  const peakVenaContractaVelocityUpperBoundPassed =
    metrics.peakVenaContractaVelocityMPerSec! <=
    gates.peakVenaContractaVelocityMPerSec.maximum;
  const meanDopplerGradientUpperBoundPassed =
    metrics.meanDopplerGradientMmHg! <= gates.meanDopplerGradientMmHg.maximum;
  const peakDopplerGradientRedundantUpperBoundReadoutMatched =
    metrics.peakDopplerGradientMmHg! <= gates.peakDopplerGradientMmHg.maximum;
  const onePercentFlowEjectionTimeUpperBoundPassed =
    metrics.onePercentFlowEjectionTimeSec! <=
    gates.onePercentFlowEjectionTimeSec.maximum;
  const correctedValveEventLvetUpperBoundPassed =
    metrics.correctedValveEventLvetMs === null
      ? null
      : metrics.correctedValveEventLvetMs <=
        gates.correctedValveEventLvetMs.maximum;
  const accelerationTimeUpperBoundPassed =
    metrics.accelerationTimeSec! <= gates.accelerationTimeSec.maximum;
  const activeEoaAtPeakForwardFlowUtilizationPassed =
    metrics.activeEoaAtPeakForwardFlowUtilization01! >=
    gates.activeEoaAtPeakForwardFlowUtilization01.minimum;
  const flowWeightedMeanActiveEoaUtilizationPassed =
    metrics.flowWeightedMeanActiveEoaUtilization01! >=
    gates.flowWeightedMeanActiveEoaUtilization01.minimum;
  return Object.freeze({
    peakVenaContractaVelocityTwoSidedReferenceIntervalMatched,
    meanDopplerGradientTwoSidedReferenceIntervalMatched,
    peakDopplerGradientTwoSidedReferenceIntervalMatched,
    allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched:
      peakVenaContractaVelocityTwoSidedReferenceIntervalMatched &&
      meanDopplerGradientTwoSidedReferenceIntervalMatched &&
      peakDopplerGradientTwoSidedReferenceIntervalMatched,
    peakVenaContractaVelocityUpperBoundPassed,
    meanDopplerGradientUpperBoundPassed,
    peakDopplerGradientRedundantUpperBoundReadoutMatched,
    onePercentFlowEjectionTimeUpperBoundPassed,
    correctedValveEventLvetUpperBoundPassed,
    accelerationTimeUpperBoundPassed,
    activeEoaAtPeakForwardFlowUtilizationPassed,
    flowWeightedMeanActiveEoaUtilizationPassed,
    allArmLevelAvAntiStenosisRobustnessGatesPassed:
      peakVenaContractaVelocityUpperBoundPassed &&
      meanDopplerGradientUpperBoundPassed &&
      onePercentFlowEjectionTimeUpperBoundPassed &&
      correctedValveEventLvetUpperBoundPassed === true &&
      accelerationTimeUpperBoundPassed &&
      activeEoaAtPeakForwardFlowUtilizationPassed &&
      flowWeightedMeanActiveEoaUtilizationPassed,
    ictAndTeiReportedWithoutHardGate: true as const,
    rawNodeGradientExcludedFromAsClassification: true as const,
  });
}

function fitPrimaryResolutionVModel(
  measured: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1[],
): PrimaryModel {
  const primaryIds = new Set(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PRIMARY_FRACTION_ARMS_V1.map(
      (arm) => arm.armId,
    ),
  );
  const primary = measured.filter((arm) => primaryIds.has(arm.arm.armId));
  if (primary.length !== 16) {
    throw new Error("resolution-V primary model requires 16 arms");
  }
  const rows = primary.map((arm) => designRow(arm.arm));
  if (rows.some((row) => row.length !== 16) || !orthogonalColumns(rows)) {
    throw new Error("resolution-V primary design matrix is not orthogonal");
  }
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_METRIC_IDS_V1.map(
        (metricId) => {
          const values = primary.map((arm) => arm.metrics[metricId]);
          if (values.some((value) => value === null)) {
            return [metricId, null];
          }
          const numeric = values as number[];
          return [
            metricId,
            Object.freeze(
              rows[0]!.map(
                (_, column) =>
                  rows.reduce(
                    (sum, row, index) => sum + row[column]! * numeric[index]!,
                    0,
                  ) / rows.length,
              ),
            ),
          ];
        },
      ),
    ),
  ) as PrimaryModel;
}

function guardResiduals(
  guard: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
  measured: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1[],
  model: PrimaryModel,
): readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeGuardResidualV1[] {
  if (guard.safetyGuardTarget === null) {
    throw new Error("safety guard target is required");
  }
  const observedArm = measured.find((arm) => arm.arm.armId === guard.armId);
  if (observedArm === undefined) {
    throw new Error(`missing measured safety guard: ${guard.armId}`);
  }
  const row = designRow(guard);
  return MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_METRIC_IDS_V1.map(
    (metricId) => {
      const coefficients = model[metricId];
      const observed = observedArm.metrics[metricId];
      const predicted =
        coefficients === null
          ? null
          : coefficients.reduce(
              (sum, coefficient, index) => sum + coefficient * row[index]!,
              0,
            );
      const residual =
        observed === null || predicted === null ? null : observed - predicted;
      const tolerance =
        observed === null
          ? null
          : mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
              metricId,
              observed,
            );
      const observedClass =
        observed === null
          ? null
          : classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
              metricId,
              observed,
            );
      const predictedClass =
        predicted === null
          ? null
          : classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
              metricId,
              predicted,
            );
      return Object.freeze({
        guardArmId: guard.armId,
        safetyGuardTarget: guard.safetyGuardTarget!,
        metricId,
        predictedFromResolutionVPrimary: predicted,
        observed,
        residualObservedMinusPredicted: residual,
        materialityTolerance: tolerance,
        materialResidual:
          residual === null || tolerance === null
            ? null
            : Math.abs(residual) > tolerance,
        hardPhysiologyClassFlip:
          observedClass === null || predictedClass === null
            ? null
            : observedClass !== predictedClass,
      });
    },
  );
}

function designRow(
  arm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
): readonly number[] {
  const factorCodes =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FACTOR_IDS_V1.map(
      (factorId) => arm.codes[factorId],
    );
  if (factorCodes.some((code) => code !== -1 && code !== 1)) {
    throw new Error(`${arm.armId} is not an endpoint design arm`);
  }
  const numeric = factorCodes as (-1 | 1)[];
  const interactions: number[] = [];
  for (let left = 0; left < numeric.length; left += 1) {
    for (let right = left + 1; right < numeric.length; right += 1) {
      interactions.push(numeric[left]! * numeric[right]!);
    }
  }
  return Object.freeze([1, ...numeric, ...interactions]);
}

function orthogonalColumns(rows: readonly (readonly number[])[]): boolean {
  for (let left = 0; left < 16; left += 1) {
    for (let right = 0; right < 16; right += 1) {
      const dot = rows.reduce((sum, row) => sum + row[left]! * row[right]!, 0);
      if (dot !== (left === right ? 16 : 0)) return false;
    }
  }
  return true;
}

export function mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
  metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
  reference: number,
): number | null {
  const gates =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_NUMERICAL_GATES_V1;
  const threshold = (() => {
    switch (metricId) {
      case "onePercentFlowEjectionTimeSec":
        return gates.ejectionTimeSec;
      case "isovolumicContractionTimeSec":
        return gates.isovolumicContractionTimeSec;
      case "isovolumicRelaxationTimeSec":
        return gates.isovolumicRelaxationTimeSec;
      case "strokeVolumeMl":
        return gates.strokeVolumeMl;
      case "peakVenaContractaVelocityMPerSec":
        return gates.peakVenaContractaVelocityMPerSec;
      case "meanDopplerGradientMmHg":
        return gates.meanDopplerGradientMmHg;
      case "peakDopplerGradientMmHg":
        return gates.peakDopplerGradientMmHg;
      case "leftVentricularTeiIndex":
        return gates.leftVentricularTeiIndex;
      case "maximumPositiveLeftVentricularDpdtMmHgPerSec":
        return gates.maximumPositiveLeftVentricularDpdtMmHgPerSec;
      default:
        return null;
    }
  })();
  return threshold === null
    ? null
    : Math.max(threshold.absolute, threshold.relative01 * Math.abs(reference));
}

export function classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
  metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
  value: number,
): boolean | null {
  const gates =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PHYSIOLOGY_GATES_V1;
  switch (metricId) {
    case "peakVenaContractaVelocityMPerSec":
      return value <= gates.peakVenaContractaVelocityMPerSec.maximum;
    case "meanDopplerGradientMmHg":
      return value <= gates.meanDopplerGradientMmHg.maximum;
    case "onePercentFlowEjectionTimeSec":
      return value <= gates.onePercentFlowEjectionTimeSec.maximum;
    case "correctedValveEventLvetMs":
      return value <= gates.correctedValveEventLvetMs.maximum;
    case "accelerationTimeSec":
      return value <= gates.accelerationTimeSec.maximum;
    case "activeEoaAtPeakForwardFlowUtilization01":
      return value >= gates.activeEoaAtPeakForwardFlowUtilization01.minimum;
    case "flowWeightedMeanActiveEoaUtilization01":
      return value >= gates.flowWeightedMeanActiveEoaUtilization01.minimum;
    default:
      return null;
  }
}

function eoaVariation(
  arms: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeEoaVariationV1 {
  const values = arms.map(
    (arm) => arm.metrics.forwardFlowContinuityEquivalentEoaCm2!,
  );
  const meanCm2 = values.reduce((sum, value) => sum + value, 0) / values.length;
  const populationStandardDeviationCm2 = Math.sqrt(
    values.reduce((sum, value) => sum + (value - meanCm2) ** 2, 0) /
      values.length,
  );
  const minimumCm2 = Math.min(...values);
  const maximumCm2 = Math.max(...values);
  const coefficientOfVariation01 = populationStandardDeviationCm2 / meanCm2;
  return Object.freeze({
    armCount: 36 as const,
    meanCm2,
    minimumCm2,
    maximumCm2,
    populationStandardDeviationCm2,
    coefficientOfVariation01,
    relativeRange01: (maximumCm2 - minimumCm2) / meanCm2,
    coefficientOfVariationGatePassed:
      coefficientOfVariation01 <=
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PHYSIOLOGY_GATES_V1
        .continuityEquivalentEoaCoefficientOfVariation01.maximum,
  });
}

function limitingArms(
  arms: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1[],
  runs: readonly Run[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeLimitingArmsV1 {
  const maximumEjectionTimeArmId = maximumBy(
    arms,
    (arm) => arm.metrics.onePercentFlowEjectionTimeSec!,
  ).arm.armId;
  const maximumMeanDopplerGradientArmId = maximumBy(
    arms,
    (arm) => arm.metrics.meanDopplerGradientMmHg!,
  ).arm.armId;
  const maximumVmaxArmId = maximumBy(
    arms,
    (arm) => arm.metrics.peakVenaContractaVelocityMPerSec!,
  ).arm.armId;
  const maximumPeakDopplerGradientArmId = maximumBy(
    arms,
    (arm) => arm.metrics.peakDopplerGradientMmHg!,
  ).arm.armId;
  const maximumAccelerationTimeArmId = maximumBy(
    arms,
    (arm) => arm.metrics.accelerationTimeSec!,
  ).arm.armId;
  const minimumFlowWeightedFunctionalOpeningUtilizationArmId = minimumBy(
    arms,
    (arm) => arm.metrics.flowWeightedMeanActiveEoaUtilization01!,
  ).arm.armId;
  const slowestPeriod1ConvergenceArmId = maximumBy(
    runs,
    (run) => run.periodicResult.completedBeatCount,
  ).robustnessEnvelopeArm.armId;
  const highestTerminalPeriod1ResidualArmId = maximumBy(
    runs,
    (run) =>
      run.periodicResult.periodicity.latestPeriod1MaximumNormalizedDelta ??
      Number.NEGATIVE_INFINITY,
  ).robustnessEnvelopeArm.armId;
  const uniqueFixedHorizonSentinelArmIds = Object.freeze(
    Array.from(
      new Set([
        maximumEjectionTimeArmId,
        maximumMeanDopplerGradientArmId,
        maximumVmaxArmId,
        maximumAccelerationTimeArmId,
        minimumFlowWeightedFunctionalOpeningUtilizationArmId,
        slowestPeriod1ConvergenceArmId,
        highestTerminalPeriod1ResidualArmId,
      ]),
    ),
  );
  return Object.freeze({
    maximumEjectionTimeArmId,
    maximumMeanDopplerGradientArmId,
    maximumVmaxArmId,
    maximumPeakDopplerGradientArmId,
    vmaxAndPeakGradientSelectSameArm:
      maximumVmaxArmId === maximumPeakDopplerGradientArmId,
    maximumAccelerationTimeArmId,
    minimumFlowWeightedFunctionalOpeningUtilizationArmId,
    slowestPeriod1ConvergenceArmId,
    highestTerminalPeriod1ResidualArmId,
    uniqueFixedHorizonSentinelArmIds,
    sentinelUnionClaimedToCoverAllThirtySixArms: false as const,
    horizonAndDtEffectsSeparatedByThisAnalysis: false as const,
  });
}

function maximumBy<T>(values: readonly T[], read: (value: T) => number): T {
  if (values.length === 0) throw new Error("maximumBy requires a value");
  return values.reduce((selected, candidate) =>
    read(candidate) > read(selected) ? candidate : selected,
  );
}

function minimumBy<T>(values: readonly T[], read: (value: T) => number): T {
  if (values.length === 0) throw new Error("minimumBy requires a value");
  return values.reduce((selected, candidate) =>
    read(candidate) < read(selected) ? candidate : selected,
  );
}

function inRange(
  value: number,
  range: Readonly<{ minimum: number; maximum: number }>,
): boolean {
  return value >= range.minimum && value <= range.maximum;
}

function hashAxisAudit(
  runs: readonly Run[],
  declaredAxis: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisAuditV1["declaredAxis"],
  coordinateId: (run: Run) => string,
  stableHash: (run: Run) => string,
  expectedCoordinateGroupCount: number,
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeHashAxisAuditV1 {
  const groupedHashes = new Map<string, string[]>();
  for (const run of runs) {
    const coordinate = coordinateId(run);
    const hashes = groupedHashes.get(coordinate) ?? [];
    hashes.push(stableHash(run));
    groupedHashes.set(coordinate, hashes);
  }
  const coordinateGroups = Object.freeze(
    Array.from(groupedHashes, ([coordinate, hashes]) => {
      const observedStableHashes = Object.freeze(Array.from(new Set(hashes)));
      return Object.freeze({
        coordinateId: coordinate,
        armCount: hashes.length,
        observedStableHashes,
        oneHashWithinCoordinate: observedStableHashes.length === 1,
      });
    }),
  );
  const observedCoordinateGroupCount = coordinateGroups.length;
  const observedDistinctHashCount = new Set(
    coordinateGroups.flatMap((group) => group.observedStableHashes),
  ).size;
  const sameCoordinateGroupEqualityPassed = coordinateGroups.every(
    (group) => group.oneHashWithinCoordinate,
  );
  const crossCoordinateDistinctnessPassed =
    sameCoordinateGroupEqualityPassed &&
    new Set(coordinateGroups.map((group) => group.observedStableHashes[0]!))
      .size === observedCoordinateGroupCount;
  const expectedCoordinateGroupCountMatched =
    observedCoordinateGroupCount === expectedCoordinateGroupCount;
  const expectedDistinctHashCountMatched =
    observedDistinctHashCount === expectedCoordinateGroupCount;
  return Object.freeze({
    declaredAxis,
    expectedCoordinateGroupCount,
    observedCoordinateGroupCount,
    expectedDistinctHashCount: expectedCoordinateGroupCount,
    observedDistinctHashCount,
    coordinateGroups,
    sameCoordinateGroupEqualityPassed,
    crossCoordinateDistinctnessPassed,
    expectedCoordinateGroupCountMatched,
    expectedDistinctHashCountMatched,
    declaredAxisIsolationPassed:
      sameCoordinateGroupEqualityPassed &&
      crossCoordinateDistinctnessPassed &&
      expectedCoordinateGroupCountMatched &&
      expectedDistinctHashCountMatched,
  });
}

function invariantHashAudit(
  hashes: readonly string[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeInvariantHashAuditV1 {
  const observedDistinctHashCount = new Set(hashes).size;
  return Object.freeze({
    expectedDistinctHashCount: 1 as const,
    observedDistinctHashCount,
    oneHashAcrossAllArms:
      hashes.length === 36 && observedDistinctHashCount === 1,
  });
}

function protocolHash(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}

export function mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorProductV1(
  arm: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1,
): number | null {
  const codes =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FACTOR_IDS_V1.map(
      (
        factorId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFactorIdV1,
      ) => arm.codes[factorId],
    );
  if (codes.some((code) => code !== -1 && code !== 1)) return null;
  return (codes as (-1 | 1)[]).reduce((product, code) => product * code, 1);
}
