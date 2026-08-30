import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_METRIC_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PHYSIOLOGY_GATES_V1,
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricVectorV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_CLAIM_V1,
  MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1,
  MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1,
  MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_V1_ID,
  analyzeMainWireAorticValveLvotKineticCorrectionV1,
  type MainWireAorticValveLvotKineticCorrectionPointV1,
  type MainWireAorticValveLvotKineticCorrectionProfileIdV1,
  type MainWireAorticValveLvotKineticCorrectionProfileV1,
  type MainWireAorticValveLvotKineticCorrectionSampleInputV1,
  type MainWireAorticValveLvotKineticCorrectionTimeWeightedMeanV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLvotKineticCorrectionV1";
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
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_V1_ID,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelV1";
import { resolveMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchRunV1,
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  evaluateMainWireAorticValveForwardConvectiveCoefficientsV1,
  type MainWireAorticValveForwardConvectiveCoefficientsV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-pressure-recovery-geometry-sentinel-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source:
      "six-reused-d3p0-and-twelve-new-fixed-48s-cycle-over-4000-independent-cold-executions" as const,
    design:
      "three-fixed-AA-geometries-crossed-with-frozen-six-arm-limiting-union" as const,
    closedExactCellCount: 18 as const,
    reusedD3p0ExactExecutionCount: 6 as const,
    newExactExecutionCount: 12 as const,
    fixedLvotObservationCount: 54 as const,
    pressureRecoveryLedgerDomain:
      "strictly-positive-forward-AoV-flow-accepted-samples" as const,
    pressureRecoveryCoefficientLaw:
      "ELCo-plus-fixed-AA-kinetic-flux-with-pointwise-Garcia-identities" as const,
    pressureRecoveryIdentityTolerance:
      "finite-scale-aware-absolute-plus-machine-epsilon" as const,
    characteristicImpedancePressureAudit:
      "independent-placement-profile-resistance-times-forward-flow-reconstruction" as const,
    hydraulicPowerResidualAudit:
      "independent-raw-input-minus-source-linear-minus-irreversible-minus-AA-kinetic-minus-Zc-power-reconstruction" as const,
    evaluatorPowerBalanceResidualUsedAsSoleIndependentEvidence: false as const,
    evaluatorPowerBalanceResidualComparedWithIndependentReconstruction:
      true as const,
    tripletInvariantScope:
      "enumerated-owner-hash-and-readback-fields-only" as const,
    allNonAaInvariantBooleanUsesEnumeratedScopeOnly: true as const,
    completeCirculationRuntimeSnapshotMinusAaDiffClaimed: false as const,
    wholeBeatOutcomeMonotonicityIsHardGate: false as const,
    wholeBeatEndpointMinusD3p0DeltasAreReadoutOnly: true as const,
    lvotSourceEpisode:
      "exact-cyclic-one-percent-global-positive-AoV-flow-episode" as const,
    lvotEpisodeIntegration:
      "positive-zero-order-hold-weights-with-linearly-interpolated-boundaries" as const,
    lvotInstantaneousReadouts:
      "separate-maximum-corrected-gradient-and-at-maximum-jet-velocity-samples" as const,
    lvotMaximumCorrectedGradientAndMaximumJetVelocityForcedToSameSample:
      false as const,
    lvotCorrectedMeanRole:
      "research-only-one-percent-episode-time-weighted-readout" as const,
    lvotCorrectedMeanHasSameDomainAsExistingMeanDopplerGradient: false as const,
    existingMeanAndPeakDopplerGradientsOverwritten: false as const,
    lvotGeometryIsSubjectMeasured: false as const,
    ascendingAorticGeometryIsSubjectMeasured: false as const,
    limitingUnionOnly: true as const,
    allThirtySixEnvelopeArmsAuditedAcrossGeometry: false as const,
    continuousGeometryEnvelopeEstablished: false as const,
    populationNormalRangeEstablished: false as const,
    continuityEquivalentEoaFivePercentGateRole:
      "internal-limited-union-robustness-tolerance" as const,
    continuityEquivalentEoaVariationRecertifiesFullEnvelope: false as const,
    parameterSearchOrFitting: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
  });

type FixedRun =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1;
type GeometryRun =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchRunV1;
type AnyRun = FixedRun | GeometryRun;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisInputV1 =
  Readonly<{
    reusedD3p0Runs: readonly FixedRun[];
    newGeometryRuns: readonly GeometryRun[];
  }>;

type CellRunSourceV1 =
  | Readonly<{
      sourceKind: "reused-d3p0-fixed-horizon-sentinel";
      cell: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellV1;
      run: FixedRun;
    }>
  | Readonly<{
      sourceKind: "new-pressure-recovery-geometry-fixed-horizon-sentinel";
      cell: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellV1;
      run: GeometryRun;
    }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelColdStartAuditV1 =
  Readonly<{
    initializationIsCanonical: true;
    totalBloodVolumeDifferenceIsZero: true;
    noColdStateCategoryChanged: true;
    noPulmonaryRedistributionApplied: true;
    allWarmStartIdentityHashesAreNull: true;
    warmStartProtocolDifferenceIsNotAWarmStart: true;
    terminalWarmStartIsNull: true;
    runnerClaimsIndependentColdStartWithoutWarmStart: true;
    coldStartAuditPassed: true;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellIdentityAuditV1 =
  Readonly<{
    expectedClosedCatalogCellAndRouteMatched: true;
    expectedFrozenArmAndFactorReadbacksMatched: true;
    expectedCalciumAndReferenceAssemblyMatched: true;
    expectedAorticGeometryProfilePairMatched: true;
    protocolIdentitySelfHashPassed: true;
    allProtocolComponentSelfHashesPassed: true;
    exactAssemblyHashesMatchedProtocol: true;
    valveDiseaseInputAndSelfHashPassed: true;
    configuredMaximumAorticEoaCm2: 3.5;
    exactIdentityAuditPassed: true;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelExecutionAuditV1 =
  Readonly<{
    routePolicyId:
      | "matched-alpha-saturating-robustness-envelope-fixed-48s-cycle-4000-sentinel-v1"
      | "matched-alpha-saturating-pressure-recovery-geometry-fixed-48s-cycle-4000-sentinel-v1";
    fixedPhysicalHorizonSec: 48;
    stepsPerCycle: 4_000;
    requestedAndCompletedBeatCount: 40 | 72;
    terminalBeatEndTimeSec: number;
    period1AndIntegrationPassed: true;
    noRetainedPartialBeat: true;
    periodicTerminationBeforeFixedHorizonAccepted: false;
    coldStartAudit: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelColdStartAuditV1;
    executionContractPassed: true;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1 =
  Readonly<{
    minimum: number;
    timeMean: number;
    maximum: number;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelConfiguredEoaCoefficientAuditV1 =
  Readonly<{
    configuredMaximumEoaCm2: 3.5;
    ascendingAorticAreaCm2: number;
    eoaToAscendingAorticAreaRatio01: number;
    energyLossCoefficientAreaCm2: number;
    portToVenaContractaCoefficientRatio01: number;
    expectedPortToVenaContractaCoefficientRatio01: number;
    pressureRecoveryFraction01: number;
    expectedPressureRecoveryFraction01: number;
    maximumNormalizedIdentityResidual: number;
    coefficientIdentitiesPassed: true;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelForwardComponentLedgerV1 =
  Readonly<{
    averagingDomain: "strictly-positive-forward-AoV-flow-accepted-samples";
    positiveForwardSampleCount: number;
    pressureRecoveryProfileId: string;
    recoveredRootPortValveProfileId: string;
    ascendingAorticDiameterCm: number;
    ascendingAorticAreaCm2: number;
    configuredEoaCoefficientAudit: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelConfiguredEoaCoefficientAuditV1;
    components: Readonly<{
      forwardFlowMlPerSec: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      activeEoaCm2: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      eoaToAscendingAorticAreaRatio01: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      energyLossCoefficientAreaCm2: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      venaContractaCoefficientMmHgSec2PerMl2: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      irreversibleCoefficientMmHgSec2PerMl2: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      ascendingAorticKineticCoefficientMmHgSec2PerMl2: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      portConvectiveCoefficientMmHgSec2PerMl2: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      pressureRecoveryFraction01: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      venaContractaPressureMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      irreversiblePressureMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      ascendingAorticKineticPressureMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      portConvectivePressureMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      recoveredStaticPressureMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      sourceLinearValvePressureMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      exactLocalValveGradientMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      characteristicImpedancePressureMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      reconstructedCharacteristicImpedancePressureMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
      rawLvMinusAorticNodeGradientMmHg: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1;
    }>;
    residualAudit: Readonly<{
      maximumAbsoluteElcoAreaResidualCm2: number;
      maximumAbsolutePortCoefficientAdditivityResidualMmHgSec2PerMl2: number;
      maximumAbsolutePortRatioIdentityResidual01: number;
      maximumAbsoluteRecoveryFractionIdentityResidual01: number;
      maximumAbsoluteVenaContractaDecompositionResidualMmHg: number;
      maximumAbsoluteExactRecoveredStaticPressureResidualMmHg: number;
      maximumAbsoluteExactLocalGradientResidualMmHg: number;
      maximumAbsoluteRawStationReconstructionResidualMmHg: number;
      maximumAbsoluteCharacteristicImpedancePressureReconstructionResidualMmHg: number;
      maximumAbsolutePowerBalanceResidualMmHgMlPerSec: number;
      maximumAbsoluteIndependentlyReconstructedHydraulicPowerResidualMmHgMlPerSec: number;
      maximumAbsoluteEvaluatorMinusReconstructedPowerResidualMmHgMlPerSec: number;
      maximumAbsoluteOpeningEquationResidual01: number;
      maximumNormalizedIdentityResidual: number;
      allPointwiseCoefficientAndPressureIdentitiesPassed: true;
      allExactRecoveredAndLocalReadbacksPassed: true;
      allCharacteristicImpedancePressureReconstructionsPassed: true;
      allIndependentHydraulicPowerReconstructionsPassed: true;
      allEvaluatorPowerResidualReadbacksMatchedIndependentReconstructions: true;
      allPowerAndOpeningResidualsPassed: true;
    }>;
    pointArraysRetainedInOutput: false;
    componentLedgerPassed: true;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryIdV1 =
  `${MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1}__${MainWireAorticValveLvotKineticCorrectionProfileIdV1}`;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryV1 =
  Readonly<{
    summaryId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryIdV1;
    cellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1;
    methodId: typeof MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_V1_ID;
    provenance: typeof MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1;
    profile: MainWireAorticValveLvotKineticCorrectionProfileV1;
    sourceEpisode: Readonly<{
      domain: "exact-cyclic-one-percent-global-positive-AoV-flow-episode";
      thresholdMlPerSec: number;
      sampleCount: number;
      primaryOpeningSampleIndex: number;
      primaryClosingSampleIndex: number;
      openingInterpolationFractionFromPreviousToFirstActive01: number;
      closingInterpolationFractionFromLastActiveToNext01: number;
      unwrappedAcceptedStartTimeSec: number;
      unwrappedAcceptedEndTimeSec: number;
      episodeIntegrationDurationSec: number;
      interpolatedEjectionTimeSec: number;
      sourceSamplesStableHash: string;
      zeroOrderHoldWeightLaw: "first=(1-openFraction)dt,interior=dt,last=(1+closeFraction)dt,one-sample=(1-openFraction+closeFraction)dt";
    }>;
    maximumLvotCorrectedGradientInstantaneous: MainWireAorticValveLvotKineticCorrectionPointV1;
    atMaximumJetVelocityInstantaneous: MainWireAorticValveLvotKineticCorrectionPointV1;
    onePercentEpisodeResearchOnlyTimeWeightedMean: MainWireAorticValveLvotKineticCorrectionTimeWeightedMeanV1;
    existingDopplerReadoutRetainedUnmodified: Readonly<{
      peakDopplerGradientMmHg: number;
      meanDopplerGradientMmHg: number;
      peakDomain: "global-positive-flow-vena-contracta-velocity";
      meanDomain: "existing-cycle-method-domain-not-replaced-by-LVOT-episode-mean";
    }>;
    maximumAbsoluteExactDensityDimensionalIdentityResidualMmHg: number;
    allExactDensityDimensionalIdentitiesWithinTolerance: true;
    allCorrectedGradientBoundsInvariantsPassed: true;
    allCorrectedGradientMonotonicityInvariantsPassed: true;
    pointArraysRetainedInOutput: false;
    correctedMeanIsResearchOnlyAndHasDifferentDomainFromExistingMpg: true;
    claim: typeof MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_CLAIM_V1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellAnalysisV1 =
  Readonly<{
    cell: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellV1;
    sourceKind: CellRunSourceV1["sourceKind"];
    protocolIdentityHash: string;
    identityAudit: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellIdentityAuditV1;
    executionAudit: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelExecutionAuditV1;
    readout: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1;
    forwardPressureRecoveryComponentLedger: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelForwardComponentLedgerV1;
    lvotSummaryIds: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryIdV1[];
    oneDistinctAorticFlowPeakPassed: boolean;
    exactlyOneCompleteOnePercentFlowEpisodePassed: boolean;
    exactStationEquationsPassed: boolean;
    simplifiedPeakGradientEqualsFourVmaxSquaredPassed: boolean;
    armAntiStenosisGatesPassed: boolean;
    configuredAorticMaximumEoaEquals3p5Cm2: boolean;
    cellAuditPassed: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelEndpointDeltaV1 =
  Readonly<{
    endpointGeometryId: "d2p5" | "d3p8";
    endpointCellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1;
    referenceD3p0CellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1;
    endpointMinusD3p0: Readonly<
      Record<
        MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
        number
      >
    >;
    wholeBeatOutcomeDirectionUsedAsHardGate: false;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelTripletAnalysisV1 =
  Readonly<{
    sentinelArmId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1;
    cellIdsInGeometryOrder: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1[];
    invariantAudit: Readonly<{
      valveDiseaseInputAndHashInvariant: boolean;
      calciumIdentityAndHashInvariant: boolean;
      mechanicsIdentityAndHashInvariant: boolean;
      bloodVolumeIdentityAndHashInvariant: boolean;
      topologyIdentityAndHashInvariant: boolean;
      pericardiumIdentityAndHashInvariant: boolean;
      periodicPolicyIdentityAndHashInvariant: boolean;
      referenceAssemblyAndNonAaPressureStationProfilesInvariant: boolean;
      resolvedLoadFactorReadbacksInvariant: boolean;
      exactAssemblyNonRuntimeHashesInvariant: boolean;
      protocolIdentityOutsideCirculationRuntimeInvariant: boolean;
      allNonAaIdentitiesHashesAndReadbacksInvariant: boolean;
      invariantScope: "enumerated-owner-hash-and-readback-fields-only";
      allNonAaIdentitiesHashesAndReadbacksInvariantIsEnumeratedScopeOnly: true;
      completeCirculationRuntimeSnapshotMinusAaDiffClaimed: false;
    }>;
    intendedVariationAudit: Readonly<{
      aorticGeometryProfilePairsAreCatalogOrderedAndDistinct: boolean;
      ascendingAorticAreasAreDistinct: boolean;
      circulationRuntimeHashesAreDistinct: boolean;
      exactRuntimeAuditHashesAreDistinct: boolean;
      fullProtocolIdentityHashesAreDistinct: boolean;
      executionPolicyNumericFieldsMatchDespiteRouteId: boolean;
      routePolicyIdsDifferOnlyAsDeclared: boolean;
      allIntendedAaGeometryVariationsPassed: boolean;
    }>;
    endpointMinusD3p0MetricDeltas: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelEndpointDeltaV1[];
    tripletAuditPassed: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelMetricRangeV1 =
  Readonly<{
    minimum: number;
    maximum: number;
    span: number;
    minimumCellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1;
    maximumCellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditStatusV1 =
  | "passed"
  | "catalog-or-identity-failure"
  | "execution-contract-failure"
  | "pressure-recovery-ledger-failure"
  | "lvot-audit-failure"
  | "continuity-eoa-variation-failure"
  | "physiology-gate-failure";

export type MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_ANALYSIS_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_V1_ID;
    cellsInClosedCatalogOrder: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellAnalysisV1[];
    lvotSummariesInClosedCatalogOrder: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryV1[];
    geometryTripletsInFrozenSentinelOrder: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelTripletAnalysisV1[];
    metricRanges: Readonly<
      Record<
        MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
        MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelMetricRangeV1
      >
    >;
    limitedUnionContinuityEoaVariation: Readonly<{
      cellCount: 18;
      meanCm2: number;
      minimumCm2: number;
      maximumCm2: number;
      populationStandardDeviationCm2: number;
      coefficientOfVariation01: number;
      relativeRange01: number;
      internalMaximumCoefficientOfVariation01: 0.05;
      internalGatePassed: boolean;
      limitedUnionOnly: true;
      fullThirtySixArmEnvelopeRecertified: false;
    }>;
    auditedExactCellCount: 18;
    auditedCompactLvotObservationCount: 54;
    allCellExpectedIdentityAuditsPassed: boolean;
    allProtocolIdentityHashesDistinctAcrossClosedCatalog: boolean;
    allExecutionContractsPassed: boolean;
    allCellsHaveOneDistinctAorticFlowPeak: boolean;
    allCellsHaveExactlyOneCompleteOnePercentFlowEpisode: boolean;
    allExactStationEquationsPassed: boolean;
    allSimplifiedPeakGradientVmaxIdentitiesPassed: boolean;
    allArmAntiStenosisGatesPassed: boolean;
    allConfiguredAorticMaximumEoaValuesEqual3p5Cm2: boolean;
    allForwardPressureRecoveryComponentLedgersPassed: boolean;
    allTripletNonAaInvariantAndIntendedAaVariationAuditsPassed: boolean;
    allLvotSourceEpisodeAndAlgebraicAuditsPassed: boolean;
    allLvotCorrectedGradientsIncreaseWithLvotArea: boolean;
    geometryStressAuditPassed: boolean;
    auditStatus: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditStatusV1;
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_ANALYSIS_CLAIM_V1;
  }>;

export function classifyMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditDispositionV1(
  input: Readonly<{
    allCatalogAndIdentityAuditsPassed: boolean;
    allExecutionContractsPassed: boolean;
    allPressureRecoveryComponentLedgersPassed: boolean;
    allLvotAuditsPassed: boolean;
    limitedUnionContinuityEoaVariationPassed: boolean;
    allArmAntiStenosisGatesPassed: boolean;
  }>,
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditStatusV1 {
  if (!input.allCatalogAndIdentityAuditsPassed) {
    return "catalog-or-identity-failure";
  }
  if (!input.allExecutionContractsPassed) {
    return "execution-contract-failure";
  }
  if (!input.allPressureRecoveryComponentLedgersPassed) {
    return "pressure-recovery-ledger-failure";
  }
  if (!input.allLvotAuditsPassed) return "lvot-audit-failure";
  if (!input.limitedUnionContinuityEoaVariationPassed) {
    return "continuity-eoa-variation-failure";
  }
  if (!input.allArmAntiStenosisGatesPassed) {
    return "physiology-gate-failure";
  }
  return "passed";
}

export function measureMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1(
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisInputV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1 {
  const sources = resolveClosedCatalogSources(input);
  const measured = sources.map(measureCell);
  const cellsInClosedCatalogOrder = Object.freeze(
    measured.map((entry) => entry.cellAnalysis),
  );
  const lvotSummariesInClosedCatalogOrder = Object.freeze(
    measured.flatMap((entry) => entry.lvotSummaries),
  );
  if (
    cellsInClosedCatalogOrder.length !== 18 ||
    lvotSummariesInClosedCatalogOrder.length !== 54
  ) {
    throw new Error(
      "pressure-recovery geometry analysis did not produce its closed 18-cell and 54-LVOT-observation output",
    );
  }
  const geometryTripletsInFrozenSentinelOrder = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
      (sentinelArm) =>
        measureGeometryTriplet(
          sentinelArm.sentinelArmId,
          sources,
          cellsInClosedCatalogOrder,
        ),
    ),
  );
  const metricRanges = measureMetricRanges(cellsInClosedCatalogOrder);
  const limitedUnionContinuityEoaVariation =
    measureLimitedUnionContinuityEoaVariation(cellsInClosedCatalogOrder);

  const allCellExpectedIdentityAuditsPassed = cellsInClosedCatalogOrder.every(
    (cell) => cell.identityAudit.exactIdentityAuditPassed,
  );
  const allProtocolIdentityHashesDistinctAcrossClosedCatalog =
    new Set(cellsInClosedCatalogOrder.map((cell) => cell.protocolIdentityHash))
      .size === 18;
  const allExecutionContractsPassed = cellsInClosedCatalogOrder.every(
    (cell) => cell.executionAudit.executionContractPassed,
  );
  const allCellsHaveOneDistinctAorticFlowPeak = cellsInClosedCatalogOrder.every(
    (cell) => cell.oneDistinctAorticFlowPeakPassed,
  );
  const allCellsHaveExactlyOneCompleteOnePercentFlowEpisode =
    cellsInClosedCatalogOrder.every(
      (cell) => cell.exactlyOneCompleteOnePercentFlowEpisodePassed,
    );
  const allExactStationEquationsPassed = cellsInClosedCatalogOrder.every(
    (cell) => cell.exactStationEquationsPassed,
  );
  const allSimplifiedPeakGradientVmaxIdentitiesPassed =
    cellsInClosedCatalogOrder.every(
      (cell) => cell.simplifiedPeakGradientEqualsFourVmaxSquaredPassed,
    );
  const allArmAntiStenosisGatesPassed = cellsInClosedCatalogOrder.every(
    (cell) => cell.armAntiStenosisGatesPassed,
  );
  const allConfiguredAorticMaximumEoaValuesEqual3p5Cm2 =
    cellsInClosedCatalogOrder.every(
      (cell) => cell.configuredAorticMaximumEoaEquals3p5Cm2,
    );
  const allForwardPressureRecoveryComponentLedgersPassed =
    cellsInClosedCatalogOrder.every(
      (cell) =>
        cell.forwardPressureRecoveryComponentLedger.componentLedgerPassed,
    );
  const allTripletNonAaInvariantAndIntendedAaVariationAuditsPassed =
    geometryTripletsInFrozenSentinelOrder.every(
      (triplet) => triplet.tripletAuditPassed,
    );
  const lvotAudit = auditAllLvotSummaries(
    cellsInClosedCatalogOrder,
    lvotSummariesInClosedCatalogOrder,
  );
  const allCatalogAndIdentityAuditsPassed =
    allCellExpectedIdentityAuditsPassed &&
    allProtocolIdentityHashesDistinctAcrossClosedCatalog &&
    allTripletNonAaInvariantAndIntendedAaVariationAuditsPassed &&
    allConfiguredAorticMaximumEoaValuesEqual3p5Cm2;
  const allExecutionAndExactReadbackContractsPassed =
    allExecutionContractsPassed &&
    allCellsHaveOneDistinctAorticFlowPeak &&
    allCellsHaveExactlyOneCompleteOnePercentFlowEpisode &&
    allExactStationEquationsPassed &&
    allSimplifiedPeakGradientVmaxIdentitiesPassed;
  const auditStatus =
    classifyMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditDispositionV1(
      Object.freeze({
        allCatalogAndIdentityAuditsPassed,
        allExecutionContractsPassed:
          allExecutionAndExactReadbackContractsPassed,
        allPressureRecoveryComponentLedgersPassed:
          allForwardPressureRecoveryComponentLedgersPassed,
        allLvotAuditsPassed:
          lvotAudit.allLvotSourceEpisodeAndAlgebraicAuditsPassed &&
          lvotAudit.allLvotCorrectedGradientsIncreaseWithLvotArea,
        limitedUnionContinuityEoaVariationPassed:
          limitedUnionContinuityEoaVariation.internalGatePassed,
        allArmAntiStenosisGatesPassed,
      }),
    );
  const geometryStressAuditPassed = auditStatus === "passed";

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_ANALYSIS_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_V1_ID,
    cellsInClosedCatalogOrder,
    lvotSummariesInClosedCatalogOrder,
    geometryTripletsInFrozenSentinelOrder,
    metricRanges,
    limitedUnionContinuityEoaVariation,
    auditedExactCellCount: 18 as const,
    auditedCompactLvotObservationCount: 54 as const,
    allCellExpectedIdentityAuditsPassed,
    allProtocolIdentityHashesDistinctAcrossClosedCatalog,
    allExecutionContractsPassed,
    allCellsHaveOneDistinctAorticFlowPeak,
    allCellsHaveExactlyOneCompleteOnePercentFlowEpisode,
    allExactStationEquationsPassed,
    allSimplifiedPeakGradientVmaxIdentitiesPassed,
    allArmAntiStenosisGatesPassed,
    allConfiguredAorticMaximumEoaValuesEqual3p5Cm2,
    allForwardPressureRecoveryComponentLedgersPassed,
    allTripletNonAaInvariantAndIntendedAaVariationAuditsPassed,
    allLvotSourceEpisodeAndAlgebraicAuditsPassed:
      lvotAudit.allLvotSourceEpisodeAndAlgebraicAuditsPassed,
    allLvotCorrectedGradientsIncreaseWithLvotArea:
      lvotAudit.allLvotCorrectedGradientsIncreaseWithLvotArea,
    geometryStressAuditPassed,
    auditStatus,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_ANALYSIS_CLAIM_V1,
  });
}

function resolveClosedCatalogSources(
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisInputV1,
): readonly CellRunSourceV1[] {
  if (
    input === null ||
    typeof input !== "object" ||
    !Array.isArray(input.reusedD3p0Runs) ||
    !Array.isArray(input.newGeometryRuns) ||
    input.reusedD3p0Runs.length !== 6 ||
    input.newGeometryRuns.length !== 12
  ) {
    throw new Error(
      "pressure-recovery geometry analysis requires exactly six reused d3p0 runs and twelve new geometry runs",
    );
  }
  const d3p0ByArm = new Map<
    MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1,
    FixedRun
  >();
  for (const run of input.reusedD3p0Runs) {
    const armId = run.fixedHorizonSentinelArm.sentinelArmId;
    if (d3p0ByArm.has(armId)) {
      throw new Error(`duplicate reused d3p0 sentinel arm: ${armId}`);
    }
    d3p0ByArm.set(armId, run);
  }
  const newGeometryByCell = new Map<
    MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
    GeometryRun
  >();
  for (const run of input.newGeometryRuns) {
    const cellId = run.pressureRecoveryGeometryCell.cellId;
    if (newGeometryByCell.has(cellId)) {
      throw new Error(
        `duplicate new pressure-recovery geometry cell: ${cellId}`,
      );
    }
    newGeometryByCell.set(cellId, run);
  }

  const expectedD3p0ArmIds = new Set(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
      (arm) => arm.sentinelArmId,
    ),
  );
  const expectedNewCellIds = new Set(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1.filter(
      (cell) => cell.newExactSimulationRequired,
    ).map((cell) => cell.cellId),
  );
  if (
    [...d3p0ByArm.keys()].some((id) => !expectedD3p0ArmIds.has(id)) ||
    [...newGeometryByCell.keys()].some((id) => !expectedNewCellIds.has(id)) ||
    expectedD3p0ArmIds.size !== d3p0ByArm.size ||
    expectedNewCellIds.size !== newGeometryByCell.size
  ) {
    throw new Error(
      "pressure-recovery geometry inputs do not exactly match the closed 6+12 catalog",
    );
  }

  return Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1.map(
      (cell): CellRunSourceV1 => {
        if (cell.geometryProfile.geometryId === "d3p0") {
          const run = d3p0ByArm.get(
            cell.sourceFixedHorizonSentinelArm.sentinelArmId,
          );
          if (run === undefined) {
            throw new Error(
              `missing reused d3p0 geometry cell: ${cell.cellId}`,
            );
          }
          return Object.freeze({
            sourceKind: "reused-d3p0-fixed-horizon-sentinel" as const,
            cell,
            run,
          });
        }
        const run = newGeometryByCell.get(cell.cellId);
        if (run === undefined) {
          throw new Error(
            `missing new pressure-recovery geometry cell: ${cell.cellId}`,
          );
        }
        return Object.freeze({
          sourceKind:
            "new-pressure-recovery-geometry-fixed-horizon-sentinel" as const,
          cell,
          run,
        });
      },
    ),
  );
}

function measureCell(source: CellRunSourceV1): Readonly<{
  cellAnalysis: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellAnalysisV1;
  lvotSummaries: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryV1[];
}> {
  const identityAudit = validateCellIdentity(source);
  const executionAudit = validateCellExecution(source);
  const readout =
    measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmReadoutV1(
      source.run,
    );
  assertFiniteMetricVector(source.cell.cellId, readout.metrics);
  const oneDistinctAorticFlowPeakPassed =
    readout.ledger.singleDistinctAorticFlowPeakPassed;
  const episode = readout.ledger.onePercentFlowEjectionTime;
  const exactlyOneCompleteOnePercentFlowEpisodePassed =
    episode.cyclicEpisodeCount === 1 &&
    episode.primaryEpisodeActiveSampleCount > 0 &&
    episode.extraActiveSampleCountOutsidePrimaryEpisode === 0 &&
    Number.isFinite(episode.interpolatedEjectionTimeSec) &&
    episode.interpolatedEjectionTimeSec > 0;
  const exactStationEquationsPassed =
    readout.ledger.exactStationAuditPassed &&
    readout.ledger.exactReadbackAudit.stationEquationsWithinTolerance;
  const peakGradient = finiteMetric(
    readout.metrics.peakDopplerGradientMmHg,
    `${source.cell.cellId} peak Doppler gradient`,
  );
  const vmax = finiteMetric(
    readout.metrics.peakVenaContractaVelocityMPerSec,
    `${source.cell.cellId} peak vena-contracta velocity`,
  );
  const simplifiedIdentityResidual = peakGradient - 4 * vmax ** 2;
  const simplifiedPeakGradientEqualsFourVmaxSquaredPassed =
    Math.abs(simplifiedIdentityResidual) <=
    scaledIdentityTolerance(peakGradient, 4 * vmax ** 2);
  const armAntiStenosisGatesPassed =
    readout.physiologyGate.allArmLevelAvAntiStenosisRobustnessGatesPassed;
  const configuredAorticMaximumEoaEquals3p5Cm2 =
    source.run.periodicResult.valveResearchInput.valves.AoV
      .maximumForwardEoaCm2 === 3.5 &&
    readout.ledger.load.aorticMaximumForwardEoaCm2 === 3.5;
  const forwardPressureRecoveryComponentLedger =
    measureForwardPressureRecoveryComponentLedger(source);
  const lvotSummaries = measureLvotSummaries(source, readout);
  const cellAuditPassed =
    identityAudit.exactIdentityAuditPassed &&
    executionAudit.executionContractPassed &&
    oneDistinctAorticFlowPeakPassed &&
    exactlyOneCompleteOnePercentFlowEpisodePassed &&
    exactStationEquationsPassed &&
    simplifiedPeakGradientEqualsFourVmaxSquaredPassed &&
    armAntiStenosisGatesPassed &&
    configuredAorticMaximumEoaEquals3p5Cm2 &&
    forwardPressureRecoveryComponentLedger.componentLedgerPassed &&
    lvotSummaries.length === 3;
  return Object.freeze({
    cellAnalysis: Object.freeze({
      cell: source.cell,
      sourceKind: source.sourceKind,
      protocolIdentityHash: source.run.periodicResult.protocolIdentityHash,
      identityAudit,
      executionAudit,
      readout,
      forwardPressureRecoveryComponentLedger,
      lvotSummaryIds: Object.freeze(
        lvotSummaries.map((summary) => summary.summaryId),
      ),
      oneDistinctAorticFlowPeakPassed,
      exactlyOneCompleteOnePercentFlowEpisodePassed,
      exactStationEquationsPassed,
      simplifiedPeakGradientEqualsFourVmaxSquaredPassed,
      armAntiStenosisGatesPassed,
      configuredAorticMaximumEoaEquals3p5Cm2,
      cellAuditPassed,
    }),
    lvotSummaries,
  });
}

function validateCellIdentity(
  source: CellRunSourceV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellIdentityAuditV1 {
  const { cell, run } = source;
  const arm = cell.sourceFixedHorizonSentinelArm.sourceEnvelopeArm;
  const expectedArm =
    resolveMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmV1(
      arm.armId,
    );
  const expectedCalciumProfile =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
      expectedArm.calciumProfileId,
    );
  const expectedCalciumParams =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
      expectedArm.calciumProfileId,
    );
  const result = run.periodicResult;
  const identity = result.protocolIdentity;
  const hashes = result.protocolComponentHashes;
  const expectedClosedCatalogCellAndRouteMatched =
    source.sourceKind ===
      (cell.geometryProfile.geometryId === "d3p0"
        ? "reused-d3p0-fixed-horizon-sentinel"
        : "new-pressure-recovery-geometry-fixed-horizon-sentinel") &&
    cell.executionRoute ===
      (cell.geometryProfile.geometryId === "d3p0"
        ? "existing-d3p0-fixed-horizon-sentinel"
        : "new-pressure-recovery-geometry-fixed-horizon-sentinel") &&
    cell.existingD3p0ExactSimulationReused ===
      (cell.geometryProfile.geometryId === "d3p0") &&
    cell.newExactSimulationRequired ===
      (cell.geometryProfile.geometryId !== "d3p0") &&
    protocolHash(cell.sourceFixedHorizonSentinelArm) ===
      protocolHash(run.fixedHorizonSentinelArm) &&
    run.robustnessEnvelopeArm.armId ===
      cell.sourceFixedHorizonSentinelArm.sentinelArmId;
  const expectedFrozenArmAndFactorReadbacksMatched =
    protocolHash(run.robustnessEnvelopeArm) === protocolHash(expectedArm) &&
    run.circulatoryLoadPoint.pointId === expectedArm.circulatoryLoadPointId &&
    run.circulatoryLoadPoint.systemicResistanceScaleFromBaseline ===
      expectedArm.systemicResistanceScaleFromBaseline &&
    run.circulatoryLoadPoint.pulmonaryResistanceScaleFromBaseline === 1 &&
    run.complianceProfile.profileId === expectedArm.complianceProfileId &&
    run.complianceProfile.arterialStiffnessScaleFromBaseline ===
      expectedArm.systemicArterialTangentStiffnessAbsoluteScaleFromCanonical &&
    run.stressedVenousVolumePoint.pointId ===
      expectedArm.stressedVenousVolumePointId &&
    run.stressedVenousVolumePoint.fixedTotalBloodVolumeMl ===
      expectedArm.fixedTotalBloodVolumeMl &&
    run.trefForceLoadProfile.profileId === expectedArm.trefForceLoadProfileId &&
    run.trefForceLoadProfile.trefScaleFromRetainedCandidate ===
      expectedArm.ventricularTrefForceScaleFromCandidate;
  const reference =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1;
  const expectedCalciumAndReferenceAssemblyMatched =
    run.referenceNonCalciumAssembly === reference &&
    protocolHash(run.saturatingHeartRateLawProfile) ===
      protocolHash(expectedCalciumProfile) &&
    protocolHash(run.calciumDriveParams) ===
      protocolHash(expectedCalciumParams) &&
    run.kuwProfile.profileId === reference.kuwProfileId &&
    run.sarcomereReferenceProfile.profileId ===
      reference.sarcomereReferenceProfileId &&
    run.calciumSensitivityLengthProfile.profileId ===
      reference.calciumSensitivityLengthProfileId &&
    run.sourceTwitchRetentionCandidate.candidateId ===
      reference.twitchRetentionCandidateId &&
    run.sourceVelocityDistortionProfile.profileId ===
      reference.sourceVelocityDistortionProfileId &&
    run.strongBridgeDeactivationExitProfile.profileId ===
      reference.strongBridgeDeactivationExitProfileId &&
    run.placementProfile.profileId ===
      reference.characteristicResistancePlacementProfileId &&
    run.rootInertanceProfile.profileId === reference.rootInertanceProfileId;
  const geometry = cell.geometryProfile;
  const expectedAorticGeometryProfilePairMatched =
    run.aorticValveResearchProfile === geometry.pressureRecoveryProfile &&
    run.recoveredRootPortValveProfile ===
      geometry.recoveredRootPortValveProfile &&
    run.aorticValveResearchProfile.profileId ===
      geometry.pressureRecoveryProfileId &&
    run.recoveredRootPortValveProfile.profileId ===
      geometry.recoveredRootPortValveProfileId &&
    run.recoveredRootPortValveProfile.pressureRecoveryProfileId ===
      run.aorticValveResearchProfile.profileId &&
    run.aorticValveResearchProfile.ascendingAorticDiameterCm ===
      geometry.ascendingAorticDiameterCm &&
    run.aorticValveResearchProfile.ascendingAorticAreaCm2 ===
      geometry.ascendingAorticAreaCm2 &&
    geometry.ascendingAorticAreaCm2 > 3.5;
  const protocolIdentitySelfHashPassed =
    result.protocolIdentityHash === protocolHash(identity);
  const allProtocolComponentSelfHashesPassed =
    protocolHash(identity.mechanicsProvider) ===
      hashes.mechanicsProviderMetadataStableHash &&
    identity.calciumDrive.fixedParamsStableHash ===
      hashes.calciumDriveFixedParamsStableHash &&
    protocolHash(run.calciumDriveParams) ===
      hashes.calciumDriveFixedParamsStableHash &&
    identity.circulation.topologyGraphStableHash ===
      hashes.circulationTopologyGraphStableHash &&
    protocolHash(identity.circulation.topologyGraphSnapshot) ===
      hashes.circulationTopologyGraphStableHash &&
    identity.circulation.runtimeStableHash ===
      hashes.circulationRuntimeStableHash &&
    protocolHash(identity.bloodVolumeOperatingPoint) ===
      hashes.bloodVolumeOperatingPointStableHash &&
    identity.commonPericardium.stableHash ===
      hashes.commonPericardiumStableHash &&
    protocolHash(identity.commonPericardium.bindingSnapshot) ===
      hashes.commonPericardiumStableHash &&
    identity.periodicPolicy.policyStableHash ===
      hashes.periodicPolicyStableHash;
  const exactAssemblyHashesMatchedProtocol =
    run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash ===
      identity.mechanicsProvider.parameterIdentityHash &&
    run.exactAssemblyAudit.circulationRuntimeStableHash ===
      hashes.circulationRuntimeStableHash &&
    run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash ===
      hashes.bloodVolumeOperatingPointStableHash &&
    run.exactAssemblyAudit.calciumDriveFixedParamsStableHash ===
      hashes.calciumDriveFixedParamsStableHash;
  const valveDiseaseInputAndSelfHashPassed =
    identity.circulation.valveResearchInputStableHash ===
      protocolHash(identity.circulation.valveResearchInputSnapshot) &&
    identity.circulation.valveResearchInputStableHash ===
      protocolHash(result.valveResearchInput) &&
    protocolHash(identity.circulation.valveResearchInputSnapshot) ===
      protocolHash(result.valveResearchInput);
  const configuredMaximumAorticEoaCm2 =
    result.valveResearchInput.valves.AoV.maximumForwardEoaCm2;

  if (
    !expectedClosedCatalogCellAndRouteMatched ||
    !expectedFrozenArmAndFactorReadbacksMatched ||
    !expectedCalciumAndReferenceAssemblyMatched ||
    !expectedAorticGeometryProfilePairMatched ||
    !protocolIdentitySelfHashPassed ||
    !allProtocolComponentSelfHashesPassed ||
    !exactAssemblyHashesMatchedProtocol ||
    !valveDiseaseInputAndSelfHashPassed ||
    configuredMaximumAorticEoaCm2 !== 3.5
  ) {
    throw new Error(`${cell.cellId} exact geometry identity audit failed`);
  }
  return Object.freeze({
    expectedClosedCatalogCellAndRouteMatched: true as const,
    expectedFrozenArmAndFactorReadbacksMatched: true as const,
    expectedCalciumAndReferenceAssemblyMatched: true as const,
    expectedAorticGeometryProfilePairMatched: true as const,
    protocolIdentitySelfHashPassed: true as const,
    allProtocolComponentSelfHashesPassed: true as const,
    exactAssemblyHashesMatchedProtocol: true as const,
    valveDiseaseInputAndSelfHashPassed: true as const,
    configuredMaximumAorticEoaCm2: 3.5 as const,
    exactIdentityAuditPassed: true as const,
  });
}

function validateCellExecution(
  source: CellRunSourceV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelExecutionAuditV1 {
  const { cell, run } = source;
  const result = run.periodicResult;
  const expectedBeatCount =
    cell.sourceFixedHorizonSentinelArm.sourceEnvelopeArm.heartRateBpm === 50
      ? (40 as const)
      : (72 as const);
  const terminalBeat = result.retainedCompleteBeats.at(-1);
  const terminalBeatEndTimeSec = terminalBeat?.endTimeSec ?? Number.NaN;
  const expectedRoutePolicyId =
    source.sourceKind === "reused-d3p0-fixed-horizon-sentinel"
      ? ("matched-alpha-saturating-robustness-envelope-fixed-48s-cycle-4000-sentinel-v1" as const)
      : ("matched-alpha-saturating-pressure-recovery-geometry-fixed-48s-cycle-4000-sentinel-v1" as const);
  const expectedConfigurationRole =
    source.sourceKind === "reused-d3p0-fixed-horizon-sentinel"
      ? "fixed-v10-matched-alpha-saturating-robustness-envelope-48s-sentinel-arm"
      : "fixed-v10-matched-alpha-saturating-pressure-recovery-geometry-48s-sentinel-cell";
  const coldStartAudit = measureColdStartAudit(run);
  const executionContractPassed =
    run.configurationRole === expectedConfigurationRole &&
    run.executionPolicy.policyId === expectedRoutePolicyId &&
    run.executionPolicy.fixedPhysicalHorizonSec === 48 &&
    run.executionPolicy.stepsPerCycle === 4_000 &&
    run.executionPolicy.minimumCompletedBeatCountBeforePeriodicTermination ===
      expectedBeatCount &&
    run.executionPolicy.maximumBeatCount === expectedBeatCount &&
    run.executionPolicy.periodicTerminationBeforeFixedHorizonAccepted ===
      false &&
    result.stepsPerBeat === 4_000 &&
    result.dtSec ===
      60 /
        cell.sourceFixedHorizonSentinelArm.sourceEnvelopeArm.heartRateBpm /
        4_000 &&
    result.requestedMaximumBeatCount === expectedBeatCount &&
    result.completedBeatCount === expectedBeatCount &&
    result.initialization === "canonical" &&
    result.integrationCompletedWithoutFailure === true &&
    result.failure === null &&
    result.periodicity.status === "period1-converged" &&
    result.periodicSteadyStateClaimed === true &&
    result.terminationReason === "period1-converged" &&
    result.retainedPartialBeat.length === 0 &&
    terminalBeat?.beatIndex === expectedBeatCount &&
    Math.abs(terminalBeatEndTimeSec - 48) <= 1e-8 &&
    result.terminalCycleBoundaryWarmStart === null &&
    run.claim.independentCanonicalColdStart === true &&
    run.claim.warmStartApplied === false &&
    run.claim.periodicTerminationBeforeFixedHorizonAccepted === false &&
    coldStartAudit.coldStartAuditPassed;
  if (!executionContractPassed) {
    throw new Error(
      `${cell.cellId} must be an independent canonical P1 exact-48s cycle/4000 execution`,
    );
  }
  return Object.freeze({
    routePolicyId: expectedRoutePolicyId,
    fixedPhysicalHorizonSec: 48 as const,
    stepsPerCycle: 4_000 as const,
    requestedAndCompletedBeatCount: expectedBeatCount,
    terminalBeatEndTimeSec,
    period1AndIntegrationPassed: true as const,
    noRetainedPartialBeat: true as const,
    periodicTerminationBeforeFixedHorizonAccepted: false as const,
    coldStartAudit,
    executionContractPassed: true as const,
  });
}

function measureColdStartAudit(
  run: AnyRun,
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelColdStartAuditV1 {
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
  const runnerClaimsIndependentColdStartWithoutWarmStart =
    run.claim.independentCanonicalColdStart === true &&
    run.claim.warmStartApplied === false;
  if (
    !initializationIsCanonical ||
    !totalBloodVolumeDifferenceIsZero ||
    !noColdStateCategoryChanged ||
    !noPulmonaryRedistributionApplied ||
    !allWarmStartIdentityHashesAreNull ||
    !warmStartProtocolDifferenceIsNotAWarmStart ||
    !terminalWarmStartIsNull ||
    !runnerClaimsIndependentColdStartWithoutWarmStart
  ) {
    throw new Error("geometry sentinel cold-start provenance audit failed");
  }
  return Object.freeze({
    initializationIsCanonical: true as const,
    totalBloodVolumeDifferenceIsZero: true as const,
    noColdStateCategoryChanged: true as const,
    noPulmonaryRedistributionApplied: true as const,
    allWarmStartIdentityHashesAreNull: true as const,
    warmStartProtocolDifferenceIsNotAWarmStart: true as const,
    terminalWarmStartIsNull: true as const,
    runnerClaimsIndependentColdStartWithoutWarmStart: true as const,
    coldStartAuditPassed: true as const,
  });
}

export type MainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionInputV1 =
  Readonly<{
    forwardFlowMlPerSec: number;
    rawLvMinusAorticNodeGradientMmHg: number;
    sourceLinearValvePressureMmHg: number;
    irreversiblePressureMmHg: number;
    ascendingAorticKineticPressureMmHg: number;
    placementCharacteristicImpedanceResistanceMmHgSecPerMl: number;
    evaluatorCharacteristicImpedancePressureMmHg: number;
    evaluatorPowerBalanceResidualMmHgMlPerSec: number;
  }>;

export type MainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionAuditV1 =
  Readonly<{
    reconstructedCharacteristicImpedancePressureMmHg: number;
    reconstructedHydraulicPowerResidualMmHgMlPerSec: number;
    characteristicImpedancePressureReconstructionResidualMmHg: number;
    evaluatorMinusReconstructedPowerResidualMmHgMlPerSec: number;
    maximumNormalizedResidual: number;
    characteristicImpedancePressureReconstructionPassed: boolean;
    independentlyReconstructedHydraulicPowerResidualPassed: boolean;
    evaluatorPowerBalanceResidualPassed: boolean;
    evaluatorPowerResidualMatchedIndependentReconstruction: boolean;
    auditPassed: boolean;
  }>;

/**
 * Analysis-owned independent check of the exact recovered-port energy ledger.
 * It deliberately reconstructs Zc from the placement owner and does not treat
 * the evaluator's own power residual as independent evidence.
 */
export function auditMainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionV1(
  input: MainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionInputV1,
): MainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionAuditV1 {
  const values = Object.values(input);
  if (
    !values.every(Number.isFinite) ||
    !(input.forwardFlowMlPerSec > 0) ||
    !(input.placementCharacteristicImpedanceResistanceMmHgSecPerMl > 0) ||
    input.sourceLinearValvePressureMmHg < 0 ||
    input.irreversiblePressureMmHg < 0 ||
    input.ascendingAorticKineticPressureMmHg < 0
  ) {
    throw new Error(
      "independent pressure-recovery power reconstruction requires finite forward-domain inputs",
    );
  }
  const q = input.forwardFlowMlPerSec;
  const reconstructedCharacteristicImpedancePressureMmHg =
    input.placementCharacteristicImpedanceResistanceMmHgSecPerMl * q;
  const rawHydraulicPowerMmHgMlPerSec =
    input.rawLvMinusAorticNodeGradientMmHg * q;
  const sourceLinearPowerMmHgMlPerSec = input.sourceLinearValvePressureMmHg * q;
  const irreversiblePowerMmHgMlPerSec = input.irreversiblePressureMmHg * q;
  const ascendingAorticKineticPowerMmHgMlPerSec =
    input.ascendingAorticKineticPressureMmHg * q;
  const characteristicImpedancePowerMmHgMlPerSec =
    reconstructedCharacteristicImpedancePressureMmHg * q;
  const reconstructedHydraulicPowerResidualMmHgMlPerSec =
    rawHydraulicPowerMmHgMlPerSec -
    sourceLinearPowerMmHgMlPerSec -
    irreversiblePowerMmHgMlPerSec -
    ascendingAorticKineticPowerMmHgMlPerSec -
    characteristicImpedancePowerMmHgMlPerSec;
  const characteristicImpedancePressureReconstructionResidualMmHg =
    input.evaluatorCharacteristicImpedancePressureMmHg -
    reconstructedCharacteristicImpedancePressureMmHg;
  const evaluatorMinusReconstructedPowerResidualMmHgMlPerSec =
    input.evaluatorPowerBalanceResidualMmHgMlPerSec -
    reconstructedHydraulicPowerResidualMmHgMlPerSec;
  const characteristicImpedancePressureTolerance = scaledIdentityTolerance(
    input.evaluatorCharacteristicImpedancePressureMmHg,
    reconstructedCharacteristicImpedancePressureMmHg,
  );
  const powerTolerance = scaledPowerTolerance(
    rawHydraulicPowerMmHgMlPerSec,
    sourceLinearPowerMmHgMlPerSec,
    irreversiblePowerMmHgMlPerSec,
    ascendingAorticKineticPowerMmHgMlPerSec,
    characteristicImpedancePowerMmHgMlPerSec,
    input.evaluatorPowerBalanceResidualMmHgMlPerSec,
    reconstructedHydraulicPowerResidualMmHgMlPerSec,
  );
  const normalizedCharacteristicImpedancePressureResidual =
    Math.abs(characteristicImpedancePressureReconstructionResidualMmHg) /
    characteristicImpedancePressureTolerance;
  const normalizedReconstructedPowerResidual =
    Math.abs(reconstructedHydraulicPowerResidualMmHgMlPerSec) / powerTolerance;
  const normalizedEvaluatorPowerResidual =
    Math.abs(input.evaluatorPowerBalanceResidualMmHgMlPerSec) / powerTolerance;
  const normalizedEvaluatorMinusReconstructedPowerResidual =
    Math.abs(evaluatorMinusReconstructedPowerResidualMmHgMlPerSec) /
    powerTolerance;
  const maximumNormalizedResidual = Math.max(
    normalizedCharacteristicImpedancePressureResidual,
    normalizedReconstructedPowerResidual,
    normalizedEvaluatorPowerResidual,
    normalizedEvaluatorMinusReconstructedPowerResidual,
  );
  const characteristicImpedancePressureReconstructionPassed =
    normalizedCharacteristicImpedancePressureResidual <= 1;
  const independentlyReconstructedHydraulicPowerResidualPassed =
    normalizedReconstructedPowerResidual <= 1;
  const evaluatorPowerBalanceResidualPassed =
    normalizedEvaluatorPowerResidual <= 1;
  const evaluatorPowerResidualMatchedIndependentReconstruction =
    normalizedEvaluatorMinusReconstructedPowerResidual <= 1;
  const auditPassed =
    Number.isFinite(maximumNormalizedResidual) &&
    characteristicImpedancePressureReconstructionPassed &&
    independentlyReconstructedHydraulicPowerResidualPassed &&
    evaluatorPowerBalanceResidualPassed &&
    evaluatorPowerResidualMatchedIndependentReconstruction;
  return Object.freeze({
    reconstructedCharacteristicImpedancePressureMmHg,
    reconstructedHydraulicPowerResidualMmHgMlPerSec,
    characteristicImpedancePressureReconstructionResidualMmHg,
    evaluatorMinusReconstructedPowerResidualMmHgMlPerSec,
    maximumNormalizedResidual,
    characteristicImpedancePressureReconstructionPassed,
    independentlyReconstructedHydraulicPowerResidualPassed,
    evaluatorPowerBalanceResidualPassed,
    evaluatorPowerResidualMatchedIndependentReconstruction,
    auditPassed,
  });
}

type ForwardPressureRecoveryPointV1 = Readonly<{
  forwardFlowMlPerSec: number;
  activeEoaCm2: number;
  eoaToAscendingAorticAreaRatio01: number;
  energyLossCoefficientAreaCm2: number;
  venaContractaCoefficientMmHgSec2PerMl2: number;
  irreversibleCoefficientMmHgSec2PerMl2: number;
  ascendingAorticKineticCoefficientMmHgSec2PerMl2: number;
  portConvectiveCoefficientMmHgSec2PerMl2: number;
  pressureRecoveryFraction01: number;
  venaContractaPressureMmHg: number;
  irreversiblePressureMmHg: number;
  ascendingAorticKineticPressureMmHg: number;
  portConvectivePressureMmHg: number;
  recoveredStaticPressureMmHg: number;
  sourceLinearValvePressureMmHg: number;
  exactLocalValveGradientMmHg: number;
  characteristicImpedancePressureMmHg: number;
  reconstructedCharacteristicImpedancePressureMmHg: number;
  rawLvMinusAorticNodeGradientMmHg: number;
  absoluteElcoAreaResidualCm2: number;
  absolutePortCoefficientAdditivityResidualMmHgSec2PerMl2: number;
  absolutePortRatioIdentityResidual01: number;
  absoluteRecoveryFractionIdentityResidual01: number;
  absoluteVenaContractaDecompositionResidualMmHg: number;
  absoluteExactRecoveredStaticPressureResidualMmHg: number;
  absoluteExactLocalGradientResidualMmHg: number;
  absoluteRawStationReconstructionResidualMmHg: number;
  absoluteCharacteristicImpedancePressureReconstructionResidualMmHg: number;
  absolutePowerBalanceResidualMmHgMlPerSec: number;
  absoluteIndependentlyReconstructedHydraulicPowerResidualMmHgMlPerSec: number;
  absoluteEvaluatorMinusReconstructedPowerResidualMmHgMlPerSec: number;
  absoluteOpeningEquationResidual01: number;
  maximumNormalizedIdentityResidual: number;
  characteristicImpedancePressureReconstructionPassed: true;
  independentlyReconstructedHydraulicPowerResidualPassed: true;
  evaluatorPowerResidualMatchedIndependentReconstruction: true;
}>;

function measureForwardPressureRecoveryComponentLedger(
  source: CellRunSourceV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelForwardComponentLedgerV1 {
  const { cell, run } = source;
  const beat = run.periodicResult.retainedCompleteBeats.at(-1);
  if (beat === undefined) {
    throw new Error(`${cell.cellId} pressure-recovery ledger requires a beat`);
  }
  const profile = cell.geometryProfile.pressureRecoveryProfile;
  const areaCm2 = cell.geometryProfile.ascendingAorticAreaCm2;
  const points: ForwardPressureRecoveryPointV1[] = [];
  for (let index = 0; index < beat.samples.length; index += 1) {
    const sample = beat.samples[index]!;
    const valve = sample.valveHydraulics.AoV;
    if (!(valve.flowMlPerSec > 0)) continue;
    if (valve.activeDirection !== "forward") {
      throw new Error(
        `${cell.cellId} positive AoV flow sample ${index} is not forward`,
      );
    }
    const exact = valve.recoveredRootPortExactReadback;
    if (exact === undefined) {
      throw new Error(
        `${cell.cellId} positive AoV sample ${index} lacks exact recovered-root readback`,
      );
    }
    const q = positiveFinite(
      valve.flowMlPerSec,
      `${cell.cellId} sample ${index} forward flow`,
    );
    const activeEoaCm2 = positiveFinite(
      valve.activeEoaCm2,
      `${cell.cellId} sample ${index} active EOA`,
    );
    if (!(areaCm2 > activeEoaCm2)) {
      throw new Error(
        `${cell.cellId} sample ${index} AA area must exceed active EOA`,
      );
    }
    const coefficients =
      evaluateMainWireAorticValveForwardConvectiveCoefficientsV1(
        activeEoaCm2,
        profile,
        true,
      );
    points.push(
      measureForwardPressureRecoveryPoint(
        cell.cellId,
        index,
        sample.circulationNodeAbsolutePressureMmHg.LV,
        sample.circulationNodeAbsolutePressureMmHg.Ao,
        q,
        activeEoaCm2,
        valve.resistanceMmHgSecPerMl,
        valve.bernoulliMmHgSec2PerMl2,
        valve.pressureGradientMmHg,
        valve.powerBalanceResidualMmHgMlPerSec,
        valve.openingEquationResidual01,
        exact,
        areaCm2,
        coefficients,
        run.placementProfile.upstreamValveLinearResistanceAdditionMmHgSecPerMl,
        run.recoveredRootPortValveProfile.openingResidualTolerance01,
      ),
    );
  }
  if (points.length === 0) {
    throw new Error(
      `${cell.cellId} pressure-recovery ledger requires positive flow`,
    );
  }
  const configuredEoaCoefficientAudit = measureConfiguredEoaCoefficientAudit(
    cell.cellId,
    areaCm2,
    profile,
  );
  const maximumAbsoluteElcoAreaResidualCm2 = maximumOf(
    points,
    (point) => point.absoluteElcoAreaResidualCm2,
  );
  const maximumAbsolutePortCoefficientAdditivityResidualMmHgSec2PerMl2 =
    maximumOf(
      points,
      (point) => point.absolutePortCoefficientAdditivityResidualMmHgSec2PerMl2,
    );
  const maximumAbsolutePortRatioIdentityResidual01 = maximumOf(
    points,
    (point) => point.absolutePortRatioIdentityResidual01,
  );
  const maximumAbsoluteRecoveryFractionIdentityResidual01 = maximumOf(
    points,
    (point) => point.absoluteRecoveryFractionIdentityResidual01,
  );
  const maximumAbsoluteVenaContractaDecompositionResidualMmHg = maximumOf(
    points,
    (point) => point.absoluteVenaContractaDecompositionResidualMmHg,
  );
  const maximumAbsoluteExactRecoveredStaticPressureResidualMmHg = maximumOf(
    points,
    (point) => point.absoluteExactRecoveredStaticPressureResidualMmHg,
  );
  const maximumAbsoluteExactLocalGradientResidualMmHg = maximumOf(
    points,
    (point) => point.absoluteExactLocalGradientResidualMmHg,
  );
  const maximumAbsoluteRawStationReconstructionResidualMmHg = maximumOf(
    points,
    (point) => point.absoluteRawStationReconstructionResidualMmHg,
  );
  const maximumAbsoluteCharacteristicImpedancePressureReconstructionResidualMmHg =
    maximumOf(
      points,
      (point) =>
        point.absoluteCharacteristicImpedancePressureReconstructionResidualMmHg,
    );
  const maximumAbsolutePowerBalanceResidualMmHgMlPerSec = maximumOf(
    points,
    (point) => point.absolutePowerBalanceResidualMmHgMlPerSec,
  );
  const maximumAbsoluteIndependentlyReconstructedHydraulicPowerResidualMmHgMlPerSec =
    maximumOf(
      points,
      (point) =>
        point.absoluteIndependentlyReconstructedHydraulicPowerResidualMmHgMlPerSec,
    );
  const maximumAbsoluteEvaluatorMinusReconstructedPowerResidualMmHgMlPerSec =
    maximumOf(
      points,
      (point) =>
        point.absoluteEvaluatorMinusReconstructedPowerResidualMmHgMlPerSec,
    );
  const maximumAbsoluteOpeningEquationResidual01 = maximumOf(
    points,
    (point) => point.absoluteOpeningEquationResidual01,
  );
  const maximumNormalizedIdentityResidual = maximumOf(
    points,
    (point) => point.maximumNormalizedIdentityResidual,
  );
  const allCharacteristicImpedancePressureReconstructionsPassed = points.every(
    (point) => point.characteristicImpedancePressureReconstructionPassed,
  );
  const allIndependentHydraulicPowerReconstructionsPassed = points.every(
    (point) => point.independentlyReconstructedHydraulicPowerResidualPassed,
  );
  const allEvaluatorPowerResidualReadbacksMatchedIndependentReconstructions =
    points.every(
      (point) => point.evaluatorPowerResidualMatchedIndependentReconstruction,
    );
  const componentLedgerPassed =
    allCharacteristicImpedancePressureReconstructionsPassed &&
    allIndependentHydraulicPowerReconstructionsPassed &&
    allEvaluatorPowerResidualReadbacksMatchedIndependentReconstructions;
  if (!componentLedgerPassed) {
    throw new Error(
      `${cell.cellId} independent characteristic-impedance or power reconstruction failed`,
    );
  }

  return Object.freeze({
    averagingDomain:
      "strictly-positive-forward-AoV-flow-accepted-samples" as const,
    positiveForwardSampleCount: points.length,
    pressureRecoveryProfileId: profile.profileId,
    recoveredRootPortValveProfileId:
      cell.geometryProfile.recoveredRootPortValveProfileId,
    ascendingAorticDiameterCm: cell.geometryProfile.ascendingAorticDiameterCm,
    ascendingAorticAreaCm2: areaCm2,
    configuredEoaCoefficientAudit,
    components: Object.freeze({
      forwardFlowMlPerSec: statistic(
        points.map((point) => point.forwardFlowMlPerSec),
      ),
      activeEoaCm2: statistic(points.map((point) => point.activeEoaCm2)),
      eoaToAscendingAorticAreaRatio01: statistic(
        points.map((point) => point.eoaToAscendingAorticAreaRatio01),
      ),
      energyLossCoefficientAreaCm2: statistic(
        points.map((point) => point.energyLossCoefficientAreaCm2),
      ),
      venaContractaCoefficientMmHgSec2PerMl2: statistic(
        points.map((point) => point.venaContractaCoefficientMmHgSec2PerMl2),
      ),
      irreversibleCoefficientMmHgSec2PerMl2: statistic(
        points.map((point) => point.irreversibleCoefficientMmHgSec2PerMl2),
      ),
      ascendingAorticKineticCoefficientMmHgSec2PerMl2: statistic(
        points.map(
          (point) => point.ascendingAorticKineticCoefficientMmHgSec2PerMl2,
        ),
      ),
      portConvectiveCoefficientMmHgSec2PerMl2: statistic(
        points.map((point) => point.portConvectiveCoefficientMmHgSec2PerMl2),
      ),
      pressureRecoveryFraction01: statistic(
        points.map((point) => point.pressureRecoveryFraction01),
      ),
      venaContractaPressureMmHg: statistic(
        points.map((point) => point.venaContractaPressureMmHg),
      ),
      irreversiblePressureMmHg: statistic(
        points.map((point) => point.irreversiblePressureMmHg),
      ),
      ascendingAorticKineticPressureMmHg: statistic(
        points.map((point) => point.ascendingAorticKineticPressureMmHg),
      ),
      portConvectivePressureMmHg: statistic(
        points.map((point) => point.portConvectivePressureMmHg),
      ),
      recoveredStaticPressureMmHg: statistic(
        points.map((point) => point.recoveredStaticPressureMmHg),
      ),
      sourceLinearValvePressureMmHg: statistic(
        points.map((point) => point.sourceLinearValvePressureMmHg),
      ),
      exactLocalValveGradientMmHg: statistic(
        points.map((point) => point.exactLocalValveGradientMmHg),
      ),
      characteristicImpedancePressureMmHg: statistic(
        points.map((point) => point.characteristicImpedancePressureMmHg),
      ),
      reconstructedCharacteristicImpedancePressureMmHg: statistic(
        points.map(
          (point) => point.reconstructedCharacteristicImpedancePressureMmHg,
        ),
      ),
      rawLvMinusAorticNodeGradientMmHg: statistic(
        points.map((point) => point.rawLvMinusAorticNodeGradientMmHg),
      ),
    }),
    residualAudit: Object.freeze({
      maximumAbsoluteElcoAreaResidualCm2,
      maximumAbsolutePortCoefficientAdditivityResidualMmHgSec2PerMl2,
      maximumAbsolutePortRatioIdentityResidual01,
      maximumAbsoluteRecoveryFractionIdentityResidual01,
      maximumAbsoluteVenaContractaDecompositionResidualMmHg,
      maximumAbsoluteExactRecoveredStaticPressureResidualMmHg,
      maximumAbsoluteExactLocalGradientResidualMmHg,
      maximumAbsoluteRawStationReconstructionResidualMmHg,
      maximumAbsoluteCharacteristicImpedancePressureReconstructionResidualMmHg,
      maximumAbsolutePowerBalanceResidualMmHgMlPerSec,
      maximumAbsoluteIndependentlyReconstructedHydraulicPowerResidualMmHgMlPerSec,
      maximumAbsoluteEvaluatorMinusReconstructedPowerResidualMmHgMlPerSec,
      maximumAbsoluteOpeningEquationResidual01,
      maximumNormalizedIdentityResidual,
      allPointwiseCoefficientAndPressureIdentitiesPassed: true as const,
      allExactRecoveredAndLocalReadbacksPassed: true as const,
      allCharacteristicImpedancePressureReconstructionsPassed:
        allCharacteristicImpedancePressureReconstructionsPassed as true,
      allIndependentHydraulicPowerReconstructionsPassed:
        allIndependentHydraulicPowerReconstructionsPassed as true,
      allEvaluatorPowerResidualReadbacksMatchedIndependentReconstructions:
        allEvaluatorPowerResidualReadbacksMatchedIndependentReconstructions as true,
      allPowerAndOpeningResidualsPassed: true as const,
    }),
    pointArraysRetainedInOutput: false as const,
    componentLedgerPassed: componentLedgerPassed as true,
  });
}

function measureForwardPressureRecoveryPoint(
  cellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
  sampleIndex: number,
  lvPressureMmHg: number,
  aoPressureMmHg: number,
  q: number,
  activeEoaCm2: number,
  resistanceMmHgSecPerMl: number,
  readbackIrreversibleCoefficientMmHgSec2PerMl2: number,
  readbackRawGradientMmHg: number,
  powerBalanceResidualMmHgMlPerSec: number,
  openingEquationResidual01: number,
  exact: NonNullable<
    AnyRun["periodicResult"]["retainedCompleteBeats"][number]["samples"][number]["valveHydraulics"]["AoV"]["recoveredRootPortExactReadback"]
  >,
  ascendingAorticAreaCm2: number,
  coefficients: MainWireAorticValveForwardConvectiveCoefficientsV1,
  placementCharacteristicImpedanceResistanceMmHgSecPerMl: number,
  openingResidualTolerance01: number,
): ForwardPressureRecoveryPointV1 {
  const finiteInputs = [
    lvPressureMmHg,
    aoPressureMmHg,
    resistanceMmHgSecPerMl,
    readbackIrreversibleCoefficientMmHgSec2PerMl2,
    readbackRawGradientMmHg,
    powerBalanceResidualMmHgMlPerSec,
    openingEquationResidual01,
    placementCharacteristicImpedanceResistanceMmHgSecPerMl,
    exact.aorticComplianceNodePressureMmHg,
    exact.characteristicImpedancePressureMmHg,
    exact.algebraicProximalConstitutivePortPressureMmHg,
    exact.localValvePressureGradientMmHg,
    exact.recoveredStaticPressureMmHg,
  ];
  if (!finiteInputs.every(Number.isFinite)) {
    throw new Error(`${cellId} sample ${sampleIndex} has non-finite readback`);
  }
  if (
    coefficients.pressureRecoveryApplied !== true ||
    coefficients.ascendingAorticAreaCm2 !== ascendingAorticAreaCm2
  ) {
    throw new Error(
      `${cellId} sample ${sampleIndex} did not apply its exact AA recovery profile`,
    );
  }
  const x = activeEoaCm2 / ascendingAorticAreaCm2;
  const expectedElco =
    (activeEoaCm2 * ascendingAorticAreaCm2) /
    (ascendingAorticAreaCm2 - activeEoaCm2);
  const expectedPortRatio = (1 - x) ** 2 + x ** 2;
  const expectedRecoveryFraction = 2 * x * (1 - x);
  const portRatio =
    coefficients.portConvectivePressureMmHgSec2PerMl2 /
    coefficients.venaContractaBernoulliMmHgSec2PerMl2;
  const qSquared = q ** 2;
  const venaContractaPressureMmHg =
    coefficients.venaContractaBernoulliMmHgSec2PerMl2 * qSquared;
  const irreversiblePressureMmHg =
    coefficients.irreversibleBernoulliMmHgSec2PerMl2 * qSquared;
  const ascendingAorticKineticPressureMmHg =
    coefficients.downstreamKineticMmHgSec2PerMl2 * qSquared;
  const portConvectivePressureMmHg =
    coefficients.portConvectivePressureMmHgSec2PerMl2 * qSquared;
  const recoveredStaticPressureMmHg =
    venaContractaPressureMmHg - portConvectivePressureMmHg;
  const sourceLinearValvePressureMmHg = resistanceMmHgSecPerMl * q;
  const reconstructedLocalGradientMmHg =
    sourceLinearValvePressureMmHg + portConvectivePressureMmHg;
  const rawLvMinusAorticNodeGradientMmHg = lvPressureMmHg - aoPressureMmHg;
  const independentPowerAudit =
    auditMainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionV1(
      Object.freeze({
        forwardFlowMlPerSec: q,
        rawLvMinusAorticNodeGradientMmHg,
        sourceLinearValvePressureMmHg,
        irreversiblePressureMmHg,
        ascendingAorticKineticPressureMmHg,
        placementCharacteristicImpedanceResistanceMmHgSecPerMl,
        evaluatorCharacteristicImpedancePressureMmHg:
          exact.characteristicImpedancePressureMmHg,
        evaluatorPowerBalanceResidualMmHgMlPerSec:
          powerBalanceResidualMmHgMlPerSec,
      }),
    );
  const reconstructedRawGradientMmHg =
    exact.localValvePressureGradientMmHg +
    independentPowerAudit.reconstructedCharacteristicImpedancePressureMmHg;

  const residuals = Object.freeze({
    elcoArea: coefficients.energyLossCoefficientAreaCm2 - expectedElco,
    portCoefficientAdditivity:
      coefficients.portConvectivePressureMmHgSec2PerMl2 -
      coefficients.irreversibleBernoulliMmHgSec2PerMl2 -
      coefficients.downstreamKineticMmHgSec2PerMl2,
    portRatio: portRatio - expectedPortRatio,
    recoveryFraction:
      coefficients.pressureRecoveryFraction01 - expectedRecoveryFraction,
    venaDecomposition:
      venaContractaPressureMmHg -
      portConvectivePressureMmHg -
      recoveredStaticPressureMmHg,
    exactRecovered:
      exact.recoveredStaticPressureMmHg - recoveredStaticPressureMmHg,
    exactLocal:
      exact.localValvePressureGradientMmHg - reconstructedLocalGradientMmHg,
    rawStation: rawLvMinusAorticNodeGradientMmHg - reconstructedRawGradientMmHg,
    rawReadback: readbackRawGradientMmHg - rawLvMinusAorticNodeGradientMmHg,
    aoReadback: exact.aorticComplianceNodePressureMmHg - aoPressureMmHg,
    proximalPort:
      exact.algebraicProximalConstitutivePortPressureMmHg -
      aoPressureMmHg -
      exact.characteristicImpedancePressureMmHg,
    localFromNodes:
      exact.localValvePressureGradientMmHg -
      (lvPressureMmHg - exact.algebraicProximalConstitutivePortPressureMmHg),
    irreversibleCoefficient:
      readbackIrreversibleCoefficientMmHgSec2PerMl2 -
      coefficients.irreversibleBernoulliMmHgSec2PerMl2,
  });
  const checks = [
    residualCheck(residuals.elcoArea, expectedElco),
    residualCheck(
      residuals.portCoefficientAdditivity,
      coefficients.portConvectivePressureMmHgSec2PerMl2,
    ),
    residualCheck(residuals.portRatio, expectedPortRatio),
    residualCheck(residuals.recoveryFraction, expectedRecoveryFraction),
    residualCheck(residuals.venaDecomposition, venaContractaPressureMmHg),
    residualCheck(residuals.exactRecovered, recoveredStaticPressureMmHg),
    residualCheck(residuals.exactLocal, reconstructedLocalGradientMmHg),
    residualCheck(residuals.rawStation, rawLvMinusAorticNodeGradientMmHg),
    residualCheck(residuals.rawReadback, rawLvMinusAorticNodeGradientMmHg),
    residualCheck(residuals.aoReadback, aoPressureMmHg),
    residualCheck(
      residuals.proximalPort,
      exact.algebraicProximalConstitutivePortPressureMmHg,
    ),
    residualCheck(
      residuals.localFromNodes,
      exact.localValvePressureGradientMmHg,
    ),
    residualCheck(
      residuals.irreversibleCoefficient,
      coefficients.irreversibleBernoulliMmHgSec2PerMl2,
    ),
  ];
  const openingTolerance = Math.max(
    4 * openingResidualTolerance01,
    scaledIdentityTolerance(1),
  );
  const openingCheck = Math.abs(openingEquationResidual01) / openingTolerance;
  const maximumNormalizedIdentityResidual = Math.max(
    ...checks.map((check) => check.normalizedResidual),
    independentPowerAudit.maximumNormalizedResidual,
    openingCheck,
  );
  if (
    checks.some((check) => !check.passed) ||
    !independentPowerAudit.auditPassed ||
    !(openingCheck <= 1) ||
    !Number.isFinite(maximumNormalizedIdentityResidual)
  ) {
    throw new Error(
      `${cellId} sample ${sampleIndex} pressure-recovery component identity failed`,
    );
  }

  return Object.freeze({
    forwardFlowMlPerSec: q,
    activeEoaCm2,
    eoaToAscendingAorticAreaRatio01: x,
    energyLossCoefficientAreaCm2: coefficients.energyLossCoefficientAreaCm2,
    venaContractaCoefficientMmHgSec2PerMl2:
      coefficients.venaContractaBernoulliMmHgSec2PerMl2,
    irreversibleCoefficientMmHgSec2PerMl2:
      coefficients.irreversibleBernoulliMmHgSec2PerMl2,
    ascendingAorticKineticCoefficientMmHgSec2PerMl2:
      coefficients.downstreamKineticMmHgSec2PerMl2,
    portConvectiveCoefficientMmHgSec2PerMl2:
      coefficients.portConvectivePressureMmHgSec2PerMl2,
    pressureRecoveryFraction01: coefficients.pressureRecoveryFraction01,
    venaContractaPressureMmHg,
    irreversiblePressureMmHg,
    ascendingAorticKineticPressureMmHg,
    portConvectivePressureMmHg,
    recoveredStaticPressureMmHg,
    sourceLinearValvePressureMmHg,
    exactLocalValveGradientMmHg: exact.localValvePressureGradientMmHg,
    characteristicImpedancePressureMmHg:
      exact.characteristicImpedancePressureMmHg,
    reconstructedCharacteristicImpedancePressureMmHg:
      independentPowerAudit.reconstructedCharacteristicImpedancePressureMmHg,
    rawLvMinusAorticNodeGradientMmHg,
    absoluteElcoAreaResidualCm2: Math.abs(residuals.elcoArea),
    absolutePortCoefficientAdditivityResidualMmHgSec2PerMl2: Math.abs(
      residuals.portCoefficientAdditivity,
    ),
    absolutePortRatioIdentityResidual01: Math.abs(residuals.portRatio),
    absoluteRecoveryFractionIdentityResidual01: Math.abs(
      residuals.recoveryFraction,
    ),
    absoluteVenaContractaDecompositionResidualMmHg: Math.abs(
      residuals.venaDecomposition,
    ),
    absoluteExactRecoveredStaticPressureResidualMmHg: Math.abs(
      residuals.exactRecovered,
    ),
    absoluteExactLocalGradientResidualMmHg: Math.abs(residuals.exactLocal),
    absoluteRawStationReconstructionResidualMmHg: Math.max(
      Math.abs(residuals.rawStation),
      Math.abs(residuals.rawReadback),
      Math.abs(residuals.aoReadback),
      Math.abs(residuals.proximalPort),
      Math.abs(residuals.localFromNodes),
    ),
    absoluteCharacteristicImpedancePressureReconstructionResidualMmHg: Math.abs(
      independentPowerAudit.characteristicImpedancePressureReconstructionResidualMmHg,
    ),
    absolutePowerBalanceResidualMmHgMlPerSec: Math.abs(
      powerBalanceResidualMmHgMlPerSec,
    ),
    absoluteIndependentlyReconstructedHydraulicPowerResidualMmHgMlPerSec:
      Math.abs(
        independentPowerAudit.reconstructedHydraulicPowerResidualMmHgMlPerSec,
      ),
    absoluteEvaluatorMinusReconstructedPowerResidualMmHgMlPerSec: Math.abs(
      independentPowerAudit.evaluatorMinusReconstructedPowerResidualMmHgMlPerSec,
    ),
    absoluteOpeningEquationResidual01: Math.abs(openingEquationResidual01),
    maximumNormalizedIdentityResidual,
    characteristicImpedancePressureReconstructionPassed:
      independentPowerAudit.characteristicImpedancePressureReconstructionPassed as true,
    independentlyReconstructedHydraulicPowerResidualPassed:
      independentPowerAudit.independentlyReconstructedHydraulicPowerResidualPassed as true,
    evaluatorPowerResidualMatchedIndependentReconstruction:
      independentPowerAudit.evaluatorPowerResidualMatchedIndependentReconstruction as true,
  });
}

function measureConfiguredEoaCoefficientAudit(
  cellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
  ascendingAorticAreaCm2: number,
  profile: AnyRun["aorticValveResearchProfile"],
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelConfiguredEoaCoefficientAuditV1 {
  const configuredMaximumEoaCm2 = 3.5 as const;
  const coefficients =
    evaluateMainWireAorticValveForwardConvectiveCoefficientsV1(
      configuredMaximumEoaCm2,
      profile,
      true,
    );
  const x = configuredMaximumEoaCm2 / ascendingAorticAreaCm2;
  const expectedElco =
    (configuredMaximumEoaCm2 * ascendingAorticAreaCm2) /
    (ascendingAorticAreaCm2 - configuredMaximumEoaCm2);
  const expectedPortRatio = (1 - x) ** 2 + x ** 2;
  const expectedRecovery = 2 * x * (1 - x);
  const portRatio =
    coefficients.portConvectivePressureMmHgSec2PerMl2 /
    coefficients.venaContractaBernoulliMmHgSec2PerMl2;
  const checks = [
    residualCheck(
      coefficients.energyLossCoefficientAreaCm2 - expectedElco,
      expectedElco,
    ),
    residualCheck(portRatio - expectedPortRatio, expectedPortRatio),
    residualCheck(
      coefficients.pressureRecoveryFraction01 - expectedRecovery,
      expectedRecovery,
    ),
  ];
  const maximumNormalizedIdentityResidual = Math.max(
    ...checks.map((check) => check.normalizedResidual),
  );
  if (
    coefficients.pressureRecoveryApplied !== true ||
    coefficients.ascendingAorticAreaCm2 !== ascendingAorticAreaCm2 ||
    checks.some((check) => !check.passed) ||
    !Number.isFinite(maximumNormalizedIdentityResidual)
  ) {
    throw new Error(`${cellId} configured-EOA coefficient identity failed`);
  }
  return Object.freeze({
    configuredMaximumEoaCm2,
    ascendingAorticAreaCm2,
    eoaToAscendingAorticAreaRatio01: x,
    energyLossCoefficientAreaCm2: coefficients.energyLossCoefficientAreaCm2,
    portToVenaContractaCoefficientRatio01: portRatio,
    expectedPortToVenaContractaCoefficientRatio01: expectedPortRatio,
    pressureRecoveryFraction01: coefficients.pressureRecoveryFraction01,
    expectedPressureRecoveryFraction01: expectedRecovery,
    maximumNormalizedIdentityResidual,
    coefficientIdentitiesPassed: true as const,
  });
}

function measureLvotSummaries(
  source: CellRunSourceV1,
  readout: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1,
): readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryV1[] {
  const episodeInput = extractOnePercentEpisodeInput(source, readout);
  const analyses =
    MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1.map(
      (profileId) =>
        analyzeMainWireAorticValveLvotKineticCorrectionV1(
          Object.freeze({ profileId, samples: episodeInput.samples }),
        ),
    );
  auditPointwiseLvotProfileTriplet(source.cell.cellId, analyses);
  const summaries = analyses.map((analysis) => {
    const profileId = analysis.profile.profileId;
    if (
      analysis.episode.sampleCount !== episodeInput.samples.length ||
      analysis.episode.acceptedStartTimeSec !==
        episodeInput.unwrappedAcceptedStartTimeSec ||
      analysis.episode.acceptedEndTimeSec !==
        episodeInput.unwrappedAcceptedEndTimeSec ||
      Math.abs(
        analysis.episode.episodeIntegrationDurationSec -
          episodeInput.interpolatedEjectionTimeSec,
      ) >
        scaledTimeTolerance(
          analysis.episode.episodeIntegrationDurationSec,
          episodeInput.interpolatedEjectionTimeSec,
        ) ||
      analysis.allExactDensityDimensionalIdentitiesWithinTolerance !== true ||
      analysis.allCorrectedGradientBoundsInvariantsPassed !== true ||
      analysis.allCorrectedGradientMonotonicityInvariantsPassed !== true
    ) {
      throw new Error(
        `${source.cell.cellId} ${profileId} LVOT episode audit failed`,
      );
    }
    const existingPeak = finiteMetric(
      readout.metrics.peakDopplerGradientMmHg,
      `${source.cell.cellId} existing pPG`,
    );
    if (
      Math.abs(
        analysis.atMaximumJetVelocityInstantaneous
          .simplifiedBernoulliGradientMmHg - existingPeak,
      ) >
      scaledIdentityTolerance(
        analysis.atMaximumJetVelocityInstantaneous
          .simplifiedBernoulliGradientMmHg,
        existingPeak,
      )
    ) {
      throw new Error(
        `${source.cell.cellId} ${profileId} maximum-jet LVOT source does not reproduce existing pPG`,
      );
    }
    return Object.freeze({
      summaryId:
        `${source.cell.cellId}__${profileId}` as MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryIdV1,
      cellId: source.cell.cellId,
      methodId: analysis.methodId,
      provenance: analysis.provenance,
      profile: analysis.profile,
      sourceEpisode: Object.freeze({
        domain:
          "exact-cyclic-one-percent-global-positive-AoV-flow-episode" as const,
        thresholdMlPerSec: episodeInput.thresholdMlPerSec,
        sampleCount: episodeInput.samples.length,
        primaryOpeningSampleIndex: episodeInput.primaryOpeningSampleIndex,
        primaryClosingSampleIndex: episodeInput.primaryClosingSampleIndex,
        openingInterpolationFractionFromPreviousToFirstActive01:
          episodeInput.openingInterpolationFractionFromPreviousToFirstActive01,
        closingInterpolationFractionFromLastActiveToNext01:
          episodeInput.closingInterpolationFractionFromLastActiveToNext01,
        unwrappedAcceptedStartTimeSec:
          episodeInput.unwrappedAcceptedStartTimeSec,
        unwrappedAcceptedEndTimeSec: episodeInput.unwrappedAcceptedEndTimeSec,
        episodeIntegrationDurationSec:
          analysis.episode.episodeIntegrationDurationSec,
        interpolatedEjectionTimeSec: episodeInput.interpolatedEjectionTimeSec,
        sourceSamplesStableHash: episodeInput.sourceSamplesStableHash,
        zeroOrderHoldWeightLaw:
          "first=(1-openFraction)dt,interior=dt,last=(1+closeFraction)dt,one-sample=(1-openFraction+closeFraction)dt" as const,
      }),
      maximumLvotCorrectedGradientInstantaneous:
        analysis.maximumLvotCorrectedGradientInstantaneous,
      atMaximumJetVelocityInstantaneous:
        analysis.atMaximumJetVelocityInstantaneous,
      onePercentEpisodeResearchOnlyTimeWeightedMean: analysis.timeWeightedMean,
      existingDopplerReadoutRetainedUnmodified: Object.freeze({
        peakDopplerGradientMmHg: existingPeak,
        meanDopplerGradientMmHg: finiteMetric(
          readout.metrics.meanDopplerGradientMmHg,
          `${source.cell.cellId} existing mPG`,
        ),
        peakDomain: "global-positive-flow-vena-contracta-velocity" as const,
        meanDomain:
          "existing-cycle-method-domain-not-replaced-by-LVOT-episode-mean" as const,
      }),
      maximumAbsoluteExactDensityDimensionalIdentityResidualMmHg:
        analysis.maximumAbsoluteExactDensityDimensionalIdentityResidualMmHg,
      allExactDensityDimensionalIdentitiesWithinTolerance: true as const,
      allCorrectedGradientBoundsInvariantsPassed: true as const,
      allCorrectedGradientMonotonicityInvariantsPassed: true as const,
      pointArraysRetainedInOutput: false as const,
      correctedMeanIsResearchOnlyAndHasDifferentDomainFromExistingMpg:
        true as const,
      claim: analysis.claim,
    });
  });
  auditLvotProfileTriplet(source.cell.cellId, summaries);
  return Object.freeze(summaries);
}

type ExtractedEpisodeInputV1 = Readonly<{
  samples: readonly MainWireAorticValveLvotKineticCorrectionSampleInputV1[];
  thresholdMlPerSec: number;
  primaryOpeningSampleIndex: number;
  primaryClosingSampleIndex: number;
  openingInterpolationFractionFromPreviousToFirstActive01: number;
  closingInterpolationFractionFromLastActiveToNext01: number;
  unwrappedAcceptedStartTimeSec: number;
  unwrappedAcceptedEndTimeSec: number;
  interpolatedEjectionTimeSec: number;
  sourceSamplesStableHash: string;
}>;

function extractOnePercentEpisodeInput(
  source: CellRunSourceV1,
  readout: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeArmAnalysisV1,
): ExtractedEpisodeInputV1 {
  const result = source.run.periodicResult;
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${source.cell.cellId} LVOT analysis requires a beat`);
  }
  const episode = readout.ledger.onePercentFlowEjectionTime;
  if (
    episode.cyclicEpisodeCount !== 1 ||
    episode.extraActiveSampleCountOutsidePrimaryEpisode !== 0 ||
    episode.primaryEpisodeActiveSampleCount <= 0
  ) {
    throw new Error(
      `${source.cell.cellId} LVOT analysis requires exactly one complete one-percent episode`,
    );
  }
  const indices = cyclicInclusiveIndices(
    episode.primaryOpeningSampleIndex,
    episode.primaryClosingSampleIndex,
    beat.samples.length,
  );
  if (indices.length !== episode.primaryEpisodeActiveSampleCount) {
    throw new Error(
      `${source.cell.cellId} one-percent episode sample count mismatch`,
    );
  }
  const dtSec = positiveFinite(result.dtSec, `${source.cell.cellId} dt`);
  const openingFraction = fraction01(
    episode.openingInterpolationFractionFromPreviousToFirstActive01,
    `${source.cell.cellId} opening interpolation fraction`,
  );
  const closingFraction = fraction01(
    episode.closingInterpolationFractionFromLastActiveToNext01,
    `${source.cell.cellId} closing interpolation fraction`,
  );
  const cycleLengthSec = 60 / readout.arm.heartRateBpm;
  const rawSamples = indices.map((sampleIndex, position) => {
    const sample = beat.samples[sampleIndex]!;
    const flow = positiveFinite(
      sample.valveHydraulics.AoV.flowMlPerSec,
      `${source.cell.cellId} episode flow ${position}`,
    );
    if (!(flow > episode.thresholdMlPerSec)) {
      throw new Error(
        `${source.cell.cellId} episode sample ${position} is not above its one-percent threshold`,
      );
    }
    const activeEoaCm2 = positiveFinite(
      sample.valveHydraulics.AoV.activeEoaCm2,
      `${source.cell.cellId} episode active EOA ${position}`,
    );
    const wrapped = sampleIndex < episode.primaryOpeningSampleIndex;
    const acceptedTimeSec = sample.timeSec + (wrapped ? cycleLengthSec : 0);
    const sampleCount = indices.length;
    const episodeIntegrationWeightSec =
      sampleCount === 1
        ? (1 - openingFraction + closingFraction) * dtSec
        : position === 0
          ? (1 - openingFraction) * dtSec
          : position === sampleCount - 1
            ? (1 + closingFraction) * dtSec
            : dtSec;
    positiveFinite(
      episodeIntegrationWeightSec,
      `${source.cell.cellId} episode integration weight ${position}`,
    );
    return Object.freeze({
      acceptedTimeSec,
      episodeIntegrationWeightSec,
      forwardFlowMlPerSec: flow,
      activeEoaCm2,
    });
  });
  for (let index = 1; index < rawSamples.length; index += 1) {
    if (
      !(
        rawSamples[index]!.acceptedTimeSec >
        rawSamples[index - 1]!.acceptedTimeSec
      )
    ) {
      throw new Error(
        `${source.cell.cellId} unwrapped episode times are not strictly increasing`,
      );
    }
  }
  const integrationDurationSec = rawSamples.reduce(
    (sum, sample) => sum + sample.episodeIntegrationWeightSec,
    0,
  );
  if (
    Math.abs(integrationDurationSec - episode.interpolatedEjectionTimeSec) >
    scaledTimeTolerance(
      integrationDurationSec,
      episode.interpolatedEjectionTimeSec,
    )
  ) {
    throw new Error(
      `${source.cell.cellId} LVOT ZOH weights do not sum to interpolated ET`,
    );
  }
  return Object.freeze({
    samples: Object.freeze(rawSamples),
    thresholdMlPerSec: episode.thresholdMlPerSec,
    primaryOpeningSampleIndex: episode.primaryOpeningSampleIndex,
    primaryClosingSampleIndex: episode.primaryClosingSampleIndex,
    openingInterpolationFractionFromPreviousToFirstActive01: openingFraction,
    closingInterpolationFractionFromLastActiveToNext01: closingFraction,
    unwrappedAcceptedStartTimeSec: rawSamples[0]!.acceptedTimeSec,
    unwrappedAcceptedEndTimeSec: rawSamples.at(-1)!.acceptedTimeSec,
    interpolatedEjectionTimeSec: episode.interpolatedEjectionTimeSec,
    sourceSamplesStableHash: protocolHash(rawSamples),
  });
}

function auditLvotProfileTriplet(
  cellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
  summaries: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryV1[],
): void {
  if (
    summaries.length !== 3 ||
    summaries.some(
      (summary, index) =>
        summary.profile.profileId !==
        MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1[index],
    ) ||
    new Set(
      summaries.map((summary) => summary.sourceEpisode.sourceSamplesStableHash),
    ).size !== 1
  ) {
    throw new Error(`${cellId} LVOT profile/source pairing is invalid`);
  }
  const maximumJetSourceIdentities = new Set(
    summaries.map((summary) =>
      protocolHash([
        summary.atMaximumJetVelocityInstantaneous.sourceSampleIndex,
        summary.atMaximumJetVelocityInstantaneous.acceptedTimeSec,
        summary.atMaximumJetVelocityInstantaneous.forwardFlowMlPerSec,
        summary.atMaximumJetVelocityInstantaneous.activeEoaCm2,
        summary.atMaximumJetVelocityInstantaneous.jetVelocityMPerSec,
        summary.atMaximumJetVelocityInstantaneous
          .simplifiedBernoulliGradientMmHg,
        summary.atMaximumJetVelocityInstantaneous.exactDensityJetGradientMmHg,
      ]),
    ),
  );
  if (maximumJetSourceIdentities.size !== 1) {
    throw new Error(
      `${cellId} LVOT profiles do not retain one maximum-jet source sample`,
    );
  }
  for (let index = 1; index < summaries.length; index += 1) {
    const lower = summaries[index - 1]!;
    const upper = summaries[index]!;
    if (
      !(upper.profile.lvotAreaCm2 > lower.profile.lvotAreaCm2) ||
      !(
        upper.maximumLvotCorrectedGradientInstantaneous
          .lvotCorrectedSimplifiedBernoulliGradientMmHg >
        lower.maximumLvotCorrectedGradientInstantaneous
          .lvotCorrectedSimplifiedBernoulliGradientMmHg
      ) ||
      !(
        upper.maximumLvotCorrectedGradientInstantaneous
          .exactDensityLvotCorrectedGradientMmHg >
        lower.maximumLvotCorrectedGradientInstantaneous
          .exactDensityLvotCorrectedGradientMmHg
      ) ||
      !(
        upper.atMaximumJetVelocityInstantaneous
          .lvotCorrectedSimplifiedBernoulliGradientMmHg >
        lower.atMaximumJetVelocityInstantaneous
          .lvotCorrectedSimplifiedBernoulliGradientMmHg
      ) ||
      !(
        upper.atMaximumJetVelocityInstantaneous
          .exactDensityLvotCorrectedGradientMmHg >
        lower.atMaximumJetVelocityInstantaneous
          .exactDensityLvotCorrectedGradientMmHg
      ) ||
      !(
        upper.onePercentEpisodeResearchOnlyTimeWeightedMean
          .lvotCorrectedSimplifiedBernoulliGradientMmHg >
        lower.onePercentEpisodeResearchOnlyTimeWeightedMean
          .lvotCorrectedSimplifiedBernoulliGradientMmHg
      ) ||
      !(
        upper.onePercentEpisodeResearchOnlyTimeWeightedMean
          .exactDensityLvotCorrectedGradientMmHg >
        lower.onePercentEpisodeResearchOnlyTimeWeightedMean
          .exactDensityLvotCorrectedGradientMmHg
      )
    ) {
      throw new Error(
        `${cellId} LVOT-corrected gradients must increase with LVOT area`,
      );
    }
  }
}

function auditPointwiseLvotProfileTriplet(
  cellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
  analyses: readonly ReturnType<
    typeof analyzeMainWireAorticValveLvotKineticCorrectionV1
  >[],
): void {
  if (
    analyses.length !== 3 ||
    analyses.some(
      (analysis, index) =>
        analysis.profile.profileId !==
        MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1[index],
    ) ||
    new Set(analyses.map((analysis) => analysis.points.length)).size !== 1
  ) {
    throw new Error(`${cellId} pointwise LVOT triplet is incomplete`);
  }
  for (
    let profileIndex = 1;
    profileIndex < analyses.length;
    profileIndex += 1
  ) {
    const lower = analyses[profileIndex - 1]!;
    const upper = analyses[profileIndex]!;
    if (!(upper.profile.lvotAreaCm2 > lower.profile.lvotAreaCm2)) {
      throw new Error(`${cellId} LVOT areas are not strictly ordered`);
    }
    for (
      let pointIndex = 0;
      pointIndex < lower.points.length;
      pointIndex += 1
    ) {
      const lowerPoint = lower.points[pointIndex]!;
      const upperPoint = upper.points[pointIndex]!;
      if (
        protocolHash([
          lowerPoint.acceptedTimeSec,
          lowerPoint.episodeIntegrationWeightSec,
          lowerPoint.forwardFlowMlPerSec,
          lowerPoint.activeEoaCm2,
          lowerPoint.jetVelocityMPerSec,
          lowerPoint.simplifiedBernoulliGradientMmHg,
          lowerPoint.exactDensityJetGradientMmHg,
        ]) !==
          protocolHash([
            upperPoint.acceptedTimeSec,
            upperPoint.episodeIntegrationWeightSec,
            upperPoint.forwardFlowMlPerSec,
            upperPoint.activeEoaCm2,
            upperPoint.jetVelocityMPerSec,
            upperPoint.simplifiedBernoulliGradientMmHg,
            upperPoint.exactDensityJetGradientMmHg,
          ]) ||
        !(
          upperPoint.lvotCorrectedSimplifiedBernoulliGradientMmHg >
          lowerPoint.lvotCorrectedSimplifiedBernoulliGradientMmHg
        ) ||
        !(
          upperPoint.exactDensityLvotCorrectedGradientMmHg >
          lowerPoint.exactDensityLvotCorrectedGradientMmHg
        )
      ) {
        throw new Error(
          `${cellId} point ${pointIndex} does not preserve its source or increase corrected gradient with LVOT area`,
        );
      }
    }
  }
}

function auditAllLvotSummaries(
  cells: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellAnalysisV1[],
  summaries: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryV1[],
): Readonly<{
  allLvotSourceEpisodeAndAlgebraicAuditsPassed: boolean;
  allLvotCorrectedGradientsIncreaseWithLvotArea: boolean;
}> {
  const byCell = new Map<
    MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
    MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelLvotSummaryV1[]
  >();
  for (const summary of summaries) {
    const group = byCell.get(summary.cellId) ?? [];
    group.push(summary);
    byCell.set(summary.cellId, group);
  }
  let allLvotSourceEpisodeAndAlgebraicAuditsPassed =
    summaries.length === 54 && byCell.size === 18;
  let allLvotCorrectedGradientsIncreaseWithLvotArea = true;
  for (const cell of cells) {
    const group = byCell.get(cell.cell.cellId) ?? [];
    const uniqueSummaryIds = new Set(group.map((summary) => summary.summaryId));
    const commonSourceHashCount = new Set(
      group.map((summary) => summary.sourceEpisode.sourceSamplesStableHash),
    ).size;
    allLvotSourceEpisodeAndAlgebraicAuditsPassed &&=
      group.length === 3 &&
      uniqueSummaryIds.size === 3 &&
      commonSourceHashCount === 1 &&
      group.every(
        (summary) =>
          summary.allExactDensityDimensionalIdentitiesWithinTolerance &&
          summary.allCorrectedGradientBoundsInvariantsPassed &&
          summary.allCorrectedGradientMonotonicityInvariantsPassed &&
          summary.correctedMeanIsResearchOnlyAndHasDifferentDomainFromExistingMpg &&
          summary.pointArraysRetainedInOutput === false,
      );
    try {
      auditLvotProfileTriplet(cell.cell.cellId, group);
    } catch {
      allLvotCorrectedGradientsIncreaseWithLvotArea = false;
    }
  }
  return Object.freeze({
    allLvotSourceEpisodeAndAlgebraicAuditsPassed,
    allLvotCorrectedGradientsIncreaseWithLvotArea,
  });
}

function measureGeometryTriplet(
  sentinelArmId: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelArmIdV1,
  sources: readonly CellRunSourceV1[],
  cells: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellAnalysisV1[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelTripletAnalysisV1 {
  const tripletSources = sources.filter(
    (source) =>
      source.cell.sourceFixedHorizonSentinelArm.sentinelArmId === sentinelArmId,
  );
  const tripletCells = cells.filter(
    (cell) =>
      cell.cell.sourceFixedHorizonSentinelArm.sentinelArmId === sentinelArmId,
  );
  if (
    tripletSources.length !== 3 ||
    tripletCells.length !== 3 ||
    tripletCells.some(
      (cell, index) =>
        cell.cell.geometryProfile.geometryId !==
        (["d2p5", "d3p0", "d3p8"] as const)[index],
    )
  ) {
    throw new Error(`${sentinelArmId} geometry triplet is incomplete`);
  }
  const runs = tripletSources.map((source) => source.run);
  const valueInvariant = (read: (run: AnyRun) => unknown): boolean =>
    new Set(runs.map((run) => protocolHash(read(run)))).size === 1;
  const valveDiseaseInputAndHashInvariant = valueInvariant((run) => [
    run.periodicResult.valveResearchInput,
    run.periodicResult.protocolIdentity.circulation.valveResearchInputSnapshot,
    run.periodicResult.protocolIdentity.circulation
      .valveResearchInputStableHash,
  ]);
  const calciumIdentityAndHashInvariant = valueInvariant((run) => [
    run.saturatingHeartRateLawProfile,
    run.calciumDriveParams,
    run.periodicResult.protocolIdentity.calciumDrive,
    run.periodicResult.protocolComponentHashes
      .calciumDriveFixedParamsStableHash,
    run.exactAssemblyAudit.calciumDriveFixedParamsStableHash,
  ]);
  const mechanicsIdentityAndHashInvariant = valueInvariant((run) => [
    run.periodicResult.protocolIdentity.mechanicsProvider,
    run.periodicResult.protocolComponentHashes
      .mechanicsProviderMetadataStableHash,
    run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash,
    run.kuwProfile,
    run.sarcomereReferenceProfile,
    run.calciumSensitivityLengthProfile,
    run.sourceTwitchRetentionCandidate,
    run.trefForceLoadProfile,
    run.sourceVelocityDistortionProfile,
    run.strongBridgeDeactivationExitProfile,
  ]);
  const bloodVolumeIdentityAndHashInvariant = valueInvariant((run) => [
    run.stressedVenousVolumePoint,
    run.periodicResult.protocolIdentity.bloodVolumeOperatingPoint,
    run.periodicResult.protocolComponentHashes
      .bloodVolumeOperatingPointStableHash,
    run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
  ]);
  const topologyIdentityAndHashInvariant = valueInvariant((run) => [
    run.periodicResult.protocolIdentity.circulation.topologyGraphSnapshot,
    run.periodicResult.protocolIdentity.circulation.topologyGraphStableHash,
    run.periodicResult.protocolComponentHashes
      .circulationTopologyGraphStableHash,
  ]);
  const pericardiumIdentityAndHashInvariant = valueInvariant((run) => [
    run.periodicResult.protocolIdentity.commonPericardium,
    run.periodicResult.protocolComponentHashes.commonPericardiumStableHash,
    run.periodicResult.pericardiumMode,
    run.periodicResult.pericardiumCase,
    run.periodicResult.pericardiumParameterSetId,
  ]);
  const periodicPolicyIdentityAndHashInvariant = valueInvariant((run) => [
    run.periodicResult.protocolIdentity.periodicPolicy,
    run.periodicResult.protocolComponentHashes.periodicPolicyStableHash,
    run.periodicResult.policy,
  ]);
  const referenceAssemblyAndNonAaPressureStationProfilesInvariant =
    valueInvariant((run) => [
      run.referenceNonCalciumAssembly,
      run.placementProfile,
      run.rootInertanceProfile,
    ]);
  const resolvedLoadFactorReadbacksInvariant = valueInvariant((run) => [
    run.robustnessEnvelopeArm,
    run.fixedHorizonSentinelArm,
    run.circulatoryLoadPoint,
    run.complianceProfile,
    run.stressedVenousVolumePoint,
    run.trefForceLoadProfile,
  ]);
  const exactAssemblyNonRuntimeHashesInvariant = valueInvariant((run) => [
    run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash,
    run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
    run.exactAssemblyAudit.calciumDriveFixedParamsStableHash,
  ]);
  const protocolIdentityOutsideCirculationRuntimeInvariant = valueInvariant(
    (run) => protocolIdentityWithoutCirculationRuntime(run),
  );
  const allNonAaIdentitiesHashesAndReadbacksInvariant =
    valveDiseaseInputAndHashInvariant &&
    calciumIdentityAndHashInvariant &&
    mechanicsIdentityAndHashInvariant &&
    bloodVolumeIdentityAndHashInvariant &&
    topologyIdentityAndHashInvariant &&
    pericardiumIdentityAndHashInvariant &&
    periodicPolicyIdentityAndHashInvariant &&
    referenceAssemblyAndNonAaPressureStationProfilesInvariant &&
    resolvedLoadFactorReadbacksInvariant &&
    exactAssemblyNonRuntimeHashesInvariant &&
    protocolIdentityOutsideCirculationRuntimeInvariant;

  const geometryIds = tripletCells.map(
    (cell) => cell.cell.geometryProfile.geometryId,
  );
  const aorticGeometryProfilePairsAreCatalogOrderedAndDistinct =
    protocolHash(geometryIds) === protocolHash(["d2p5", "d3p0", "d3p8"]) &&
    new Set(
      tripletSources.map((source) =>
        protocolHash([
          source.run.aorticValveResearchProfile,
          source.run.recoveredRootPortValveProfile,
        ]),
      ),
    ).size === 3;
  const ascendingAorticAreasAreDistinct =
    new Set(
      tripletSources.map(
        (source) =>
          source.run.aorticValveResearchProfile.ascendingAorticAreaCm2,
      ),
    ).size === 3;
  const circulationRuntimeHashesAreDistinct =
    new Set(
      runs.map(
        (run) =>
          run.periodicResult.protocolComponentHashes
            .circulationRuntimeStableHash,
      ),
    ).size === 3;
  const exactRuntimeAuditHashesAreDistinct =
    new Set(
      runs.map((run) => run.exactAssemblyAudit.circulationRuntimeStableHash),
    ).size === 3;
  const fullProtocolIdentityHashesAreDistinct =
    new Set(runs.map((run) => run.periodicResult.protocolIdentityHash)).size ===
    3;
  const executionPolicyNumericFieldsMatchDespiteRouteId = valueInvariant(
    (run) => executionPolicyNumerics(run),
  );
  const routePolicyIdsDifferOnlyAsDeclared =
    tripletSources[0]!.run.executionPolicy.policyId ===
      "matched-alpha-saturating-pressure-recovery-geometry-fixed-48s-cycle-4000-sentinel-v1" &&
    tripletSources[1]!.run.executionPolicy.policyId ===
      "matched-alpha-saturating-robustness-envelope-fixed-48s-cycle-4000-sentinel-v1" &&
    tripletSources[2]!.run.executionPolicy.policyId ===
      "matched-alpha-saturating-pressure-recovery-geometry-fixed-48s-cycle-4000-sentinel-v1";
  const allIntendedAaGeometryVariationsPassed =
    aorticGeometryProfilePairsAreCatalogOrderedAndDistinct &&
    ascendingAorticAreasAreDistinct &&
    circulationRuntimeHashesAreDistinct &&
    exactRuntimeAuditHashesAreDistinct &&
    fullProtocolIdentityHashesAreDistinct &&
    executionPolicyNumericFieldsMatchDespiteRouteId &&
    routePolicyIdsDifferOnlyAsDeclared;
  const d3p0 = tripletCells[1]!;
  const endpointMinusD3p0MetricDeltas = Object.freeze(
    ([tripletCells[0]!, tripletCells[2]!] as const).map(
      (
        endpoint,
      ): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelEndpointDeltaV1 =>
        Object.freeze({
          endpointGeometryId: endpoint.cell.geometryProfile.geometryId as
            "d2p5" | "d3p8",
          endpointCellId: endpoint.cell.cellId,
          referenceD3p0CellId: d3p0.cell.cellId,
          endpointMinusD3p0: metricDelta(
            endpoint.readout.metrics,
            d3p0.readout.metrics,
          ),
          wholeBeatOutcomeDirectionUsedAsHardGate: false as const,
        }),
    ),
  );
  const tripletAuditPassed =
    allNonAaIdentitiesHashesAndReadbacksInvariant &&
    allIntendedAaGeometryVariationsPassed;
  return Object.freeze({
    sentinelArmId,
    cellIdsInGeometryOrder: Object.freeze(
      tripletCells.map((cell) => cell.cell.cellId),
    ),
    invariantAudit: Object.freeze({
      valveDiseaseInputAndHashInvariant,
      calciumIdentityAndHashInvariant,
      mechanicsIdentityAndHashInvariant,
      bloodVolumeIdentityAndHashInvariant,
      topologyIdentityAndHashInvariant,
      pericardiumIdentityAndHashInvariant,
      periodicPolicyIdentityAndHashInvariant,
      referenceAssemblyAndNonAaPressureStationProfilesInvariant,
      resolvedLoadFactorReadbacksInvariant,
      exactAssemblyNonRuntimeHashesInvariant,
      protocolIdentityOutsideCirculationRuntimeInvariant,
      allNonAaIdentitiesHashesAndReadbacksInvariant,
      invariantScope: "enumerated-owner-hash-and-readback-fields-only" as const,
      allNonAaIdentitiesHashesAndReadbacksInvariantIsEnumeratedScopeOnly:
        true as const,
      completeCirculationRuntimeSnapshotMinusAaDiffClaimed: false as const,
    }),
    intendedVariationAudit: Object.freeze({
      aorticGeometryProfilePairsAreCatalogOrderedAndDistinct,
      ascendingAorticAreasAreDistinct,
      circulationRuntimeHashesAreDistinct,
      exactRuntimeAuditHashesAreDistinct,
      fullProtocolIdentityHashesAreDistinct,
      executionPolicyNumericFieldsMatchDespiteRouteId,
      routePolicyIdsDifferOnlyAsDeclared,
      allIntendedAaGeometryVariationsPassed,
    }),
    endpointMinusD3p0MetricDeltas,
    tripletAuditPassed,
  });
}

function protocolIdentityWithoutCirculationRuntime(run: AnyRun): unknown {
  const identity = run.periodicResult.protocolIdentity;
  return Object.freeze({
    ...identity,
    circulation: Object.freeze({
      ...identity.circulation,
      runtimeStableHash: "declared-AA-geometry-axis",
    }),
  });
}

function executionPolicyNumerics(run: AnyRun): unknown {
  return Object.freeze({
    fixedPhysicalHorizonSec: run.executionPolicy.fixedPhysicalHorizonSec,
    stepsPerCycle: run.executionPolicy.stepsPerCycle,
    minimumCompletedBeatCountBeforePeriodicTermination:
      run.executionPolicy.minimumCompletedBeatCountBeforePeriodicTermination,
    maximumBeatCount: run.executionPolicy.maximumBeatCount,
    periodicTerminationBeforeFixedHorizonAccepted:
      run.executionPolicy.periodicTerminationBeforeFixedHorizonAccepted,
    resultDtSec: run.periodicResult.dtSec,
    resultRequestedMaximumBeatCount:
      run.periodicResult.requestedMaximumBeatCount,
    resultCompletedBeatCount: run.periodicResult.completedBeatCount,
  });
}

function metricDelta(
  endpoint: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricVectorV1,
  reference: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricVectorV1,
): Readonly<
  Record<
    MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
    number
  >
> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_METRIC_IDS_V1.map(
        (metricId) => [
          metricId,
          finiteMetric(endpoint[metricId], `endpoint ${metricId}`) -
            finiteMetric(reference[metricId], `d3p0 ${metricId}`),
        ],
      ),
    ) as Record<
      MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
      number
    >,
  );
}

function measureMetricRanges(
  cells: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellAnalysisV1[],
): Readonly<
  Record<
    MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
    MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelMetricRangeV1
  >
> {
  if (cells.length !== 18) {
    throw new Error("geometry metric ranges require the closed 18 cells");
  }
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_METRIC_IDS_V1.map(
        (metricId) => {
          const ordered = cells.map((cell) =>
            Object.freeze({
              cellId: cell.cell.cellId,
              value: finiteMetric(
                cell.readout.metrics[metricId],
                `${cell.cell.cellId} ${metricId}`,
              ),
            }),
          );
          const minimum = ordered.reduce((best, item) =>
            item.value < best.value ? item : best,
          );
          const maximum = ordered.reduce((best, item) =>
            item.value > best.value ? item : best,
          );
          return [
            metricId,
            Object.freeze({
              minimum: minimum.value,
              maximum: maximum.value,
              span: maximum.value - minimum.value,
              minimumCellId: minimum.cellId,
              maximumCellId: maximum.cellId,
            }),
          ];
        },
      ),
    ) as Record<
      MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricIdV1,
      MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelMetricRangeV1
    >,
  );
}

function measureLimitedUnionContinuityEoaVariation(
  cells: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelCellAnalysisV1[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1["limitedUnionContinuityEoaVariation"] {
  if (cells.length !== 18) {
    throw new Error("limited-union continuity EOA audit requires 18 cells");
  }
  const values = cells.map((cell) =>
    positiveFinite(
      finiteMetric(
        cell.readout.metrics.forwardFlowContinuityEquivalentEoaCm2,
        `${cell.cell.cellId} continuity EOA`,
      ),
      `${cell.cell.cellId} continuity EOA`,
    ),
  );
  const meanCm2 = mean(values);
  const populationStandardDeviationCm2 = Math.sqrt(
    mean(values.map((value) => (value - meanCm2) ** 2)),
  );
  const minimumCm2 = Math.min(...values);
  const maximumCm2 = Math.max(...values);
  const coefficientOfVariation01 = populationStandardDeviationCm2 / meanCm2;
  const relativeRange01 = (maximumCm2 - minimumCm2) / meanCm2;
  const internalMaximumCoefficientOfVariation01 =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_PHYSIOLOGY_GATES_V1
      .continuityEquivalentEoaCoefficientOfVariation01.maximum;
  if (
    internalMaximumCoefficientOfVariation01 !== 0.05 ||
    ![
      meanCm2,
      populationStandardDeviationCm2,
      coefficientOfVariation01,
      relativeRange01,
    ].every(Number.isFinite)
  ) {
    throw new Error("limited-union continuity EOA audit is non-finite");
  }
  return Object.freeze({
    cellCount: 18 as const,
    meanCm2,
    minimumCm2,
    maximumCm2,
    populationStandardDeviationCm2,
    coefficientOfVariation01,
    relativeRange01,
    internalMaximumCoefficientOfVariation01: 0.05 as const,
    internalGatePassed:
      coefficientOfVariation01 <= internalMaximumCoefficientOfVariation01,
    limitedUnionOnly: true as const,
    fullThirtySixArmEnvelopeRecertified: false as const,
  });
}

function assertFiniteMetricVector(
  cellId: MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometryCellIdV1,
  metrics: MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeMetricVectorV1,
): void {
  for (const metricId of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_METRIC_IDS_V1) {
    finiteMetric(metrics[metricId], `${cellId} ${metricId}`);
  }
}

function cyclicInclusiveIndices(
  openingIndex: number,
  closingIndex: number,
  sampleCount: number,
): readonly number[] {
  if (
    !Number.isInteger(openingIndex) ||
    !Number.isInteger(closingIndex) ||
    !Number.isInteger(sampleCount) ||
    sampleCount <= 0 ||
    openingIndex < 0 ||
    openingIndex >= sampleCount ||
    closingIndex < 0 ||
    closingIndex >= sampleCount
  ) {
    throw new Error("cyclic episode indices are invalid");
  }
  const indices: number[] = [];
  let index = openingIndex;
  for (let visited = 0; visited < sampleCount; visited += 1) {
    indices.push(index);
    if (index === closingIndex) return Object.freeze(indices);
    index = (index + 1) % sampleCount;
  }
  throw new Error("cyclic episode did not reach its closing index");
}

function statistic(
  values: readonly number[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelStatisticV1 {
  if (values.length === 0 || !values.every(Number.isFinite)) {
    throw new Error("pressure-recovery statistic requires finite values");
  }
  return Object.freeze({
    minimum: Math.min(...values),
    timeMean: mean(values),
    maximum: Math.max(...values),
  });
}

function mean(values: readonly number[]): number {
  if (values.length === 0 || !values.every(Number.isFinite)) {
    throw new Error("mean requires finite values");
  }
  const value = values.reduce((sum, item) => sum + item, 0) / values.length;
  if (!Number.isFinite(value)) throw new Error("mean is non-finite");
  return value;
}

function maximumOf<T>(
  values: readonly T[],
  read: (value: T) => number,
): number {
  if (values.length === 0) throw new Error("maximum requires values");
  const mapped = values.map(read);
  if (!mapped.every(Number.isFinite)) {
    throw new Error("maximum requires finite values");
  }
  return Math.max(...mapped);
}

function residualCheck(
  residual: number,
  ...scaleValues: readonly number[]
): Readonly<{
  normalizedResidual: number;
  passed: boolean;
}> {
  if (!Number.isFinite(residual) || !scaleValues.every(Number.isFinite)) {
    throw new Error("identity residual audit requires finite values");
  }
  const tolerance = scaledIdentityTolerance(...scaleValues);
  const normalizedResidual = Math.abs(residual) / tolerance;
  return Object.freeze({
    normalizedResidual,
    passed: Number.isFinite(normalizedResidual) && normalizedResidual <= 1,
  });
}

function scaledIdentityTolerance(...values: readonly number[]): number {
  if (!values.every(Number.isFinite)) {
    throw new Error("identity tolerance scale must be finite");
  }
  const scale = Math.max(1, ...values.map(Math.abs));
  return 1e-10 + 512 * Number.EPSILON * scale;
}

function scaledPowerTolerance(...values: readonly number[]): number {
  if (!values.every(Number.isFinite)) {
    throw new Error("power tolerance scale must be finite");
  }
  const scale = Math.max(1, ...values.map(Math.abs));
  return 1e-10 + 1_024 * Number.EPSILON * scale;
}

function scaledTimeTolerance(...values: readonly number[]): number {
  if (!values.every(Number.isFinite)) {
    throw new Error("time tolerance scale must be finite");
  }
  return 1e-12 + 512 * Number.EPSILON * Math.max(1, ...values.map(Math.abs));
}

function finiteMetric(value: number | null, label: string): number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function positiveFinite(value: number, label: string): number {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite and positive`);
  }
  return value;
}

function fraction01(value: number, label: string): number {
  if (!(value >= 0 && value <= 1) || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite in [0, 1]`);
  }
  return value;
}

function protocolHash(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}
