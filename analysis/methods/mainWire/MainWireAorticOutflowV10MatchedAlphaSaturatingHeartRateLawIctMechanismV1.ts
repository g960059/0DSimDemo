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
import type {
  MainWireAorticOutflowV10EpisodeAuditV1,
  MainWireAorticOutflowV10EventBoundaryV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10EventDefinitionSensitivityV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
  type MainWireVentricularCalciumSourceTraceFitShortlistDiastolicFlowV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import type { FiveWallNormalCalciumDriveParamsV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import type { MainWireNormalAdultFiveWallCycleDiagnosticsV1 } from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import type { MainWireNormalAdultFiveWallDiagnosticSampleV2 } from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
  resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchRunV1,
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import { summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import { MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2 } from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ICT_MECHANISM_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-heart-rate-law-ict-mechanism-v1" as const;

const TIME_TOLERANCE_SEC = 1e-9;
const IDENTITY_TOLERANCE = 1e-10;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ICT_MECHANISM_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-main-a040-arm" as const,
    canonicalIct:
      "cycle-diagnostics-canonical-one-percent-flow-threshold-MVC-to-AVO" as const,
    ventricularCalciumRise:
      "linear-crossing-of-one-percent-configured-supradiastolic-LVFW-calcium-rise" as const,
    ictIdentity:
      "signed-MVC-to-Ca-rise-plus-Ca-rise-to-local-gradient-zero-plus-local-gradient-zero-to-strict-Q-positive-plus-strict-Q-positive-to-canonical-one-percent-AVO" as const,
    decompositionSemantics:
      "temporal-accounting-identity-not-causal-identification-by-itself" as const,
    aorticStrictFlowAndLocalGradientSemantics:
      "same-primary-Qpeak-episode-and-boundary-semantics-as-main-wire-aortic-outflow-v10-event-definition-sensitivity-v1" as const,
    strictPositiveFlowBoundary: "accepted-sample-endpoint" as const,
    exactLocalGradientBoundary:
      "linear-zero-crossing-between-accepted-endpoints" as const,
    localGradientIsValveEvent: false as const,
    mitralClosureDefinitions: Object.freeze({
      canonical:
        "one-percent-positive-peak-plus-one-mL-per-second-floor-flow-threshold" as const,
      strictFlow:
        "first-inactive-accepted-endpoint-after-atrial-onset-containing-final-positive-MV-pumping-flow" as const,
      pressureReversal:
        "final-linear-downward-zero-crossing-of-LA-minus-LV-after-atrial-onset-before-AVO-paired-to-final-strict-flow-end" as const,
      openingTarget:
        "final-downward-deactivation-at-or-below-one-percent-and-zero-before-canonical-AVO" as const,
      leafletClosureSensitivity:
        "nullable-linear-downward-crossings-at-fifty-ten-and-one-percent-after-final-target-deactivation-and-before-canonical-AVO" as const,
      aorticOpeningStateAtCanonicalAvo:
        "accepted-endpoint-opening-target-and-leaflet-fraction" as const,
    }),
    modeledMitralFlowMemoryOrInertancePresent: false as const,
    mitralStructuralThresholdSelectedAsClinicalMvc: false as const,
    mitralOrAorticPressureCrossingIsClinicalLeafletTiming: false as const,
    modeledMitralOpeningMemoryFractionIsAnatomicLeafletOrCoaptationTiming:
      false as const,
    copenhagenLeafletEventEquivalenceClaimed: false as const,
    modeledMitralVtiIsClinicalSpectralVti: false as const,
    acceptedStepTimesRemainDtQuantizedUnlessExplicitlyLinearInterpolated:
      true as const,
    interpretationRequiresPeriod1IntegrationSingleFlowPeakExactStationsAndIdentity:
      true as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    smoothingApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

type Runner =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchRunV1;
type MitralDiagnostics =
  MainWireNormalAdultFiveWallCycleDiagnosticsV1["mitral"];
type MitralFlow =
  MainWireVentricularCalciumSourceTraceFitShortlistDiastolicFlowV1["mitral"];

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismInputV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1;
    calciumProfile: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    referenceNonCalciumAssembly: Runner["referenceNonCalciumAssembly"];
    exactAssemblyAudit: Runner["exactAssemblyAudit"];
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1 =
  Readonly<{
    sampleIndex: number;
    phase01: number;
    timeSec: number;
    timeFromSelectedBeatStartSec: number;
    definition: string;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTimelineV1 =
  Readonly<{
    atrialCalciumOnset: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1;
    mitralValveClosure: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1;
    ventricularCalciumOnePercentRiseAcceptedEndpoint: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1;
    aorticValveOpening: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1;
    aorticValveClosure: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1;
    mitralValveOpening: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctCalciumRiseV1 =
  Readonly<{
    thresholdUM: number;
    thresholdDefinition: "diastolic-plus-one-percent-configured-peak-amplitude";
    shiftedSignalInterpolated: "LVFW-free-calcium-minus-threshold";
    episode: Readonly<{
      cyclicEpisodeCount: number;
      totalActiveSampleCount: number;
      primaryEpisodeActiveSampleCount: number;
      extraActiveSampleCountOutsidePrimaryEpisode: number;
      primaryOpeningSampleIndex: number;
      primaryClosingSampleIndex: number;
      primaryContainsGlobalCalciumPeak: true;
    }>;
    boundary: MainWireAorticOutflowV10EventBoundaryV1;
    previousAcceptedEndpointCalciumUM: number;
    currentAcceptedEndpointCalciumUM: number;
    bracketSatisfied: boolean;
    reconstructionResidualUM: number;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralLeafletThresholdStatusV1 =
  | "already-at-or-below-at-final-target-deactivation"
  | "crossed-after-final-target-deactivation-before-AVO"
  | "remains-above-at-AVO";

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralLeafletThresholdV1 =
  Readonly<{
    threshold01: 0.5 | 0.1 | 0.01;
    status: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralLeafletThresholdStatusV1;
    crossingBoundary: MainWireAorticOutflowV10EventBoundaryV1 | null;
    crossingMinusCanonicalMvcSec: number | null;
    reconstructionResidual01: number | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1 =
  Readonly<{
    definitionId:
      | "strict-positive-flow"
      | "exact-local-LV-minus-proximal-port-positive-gradient"
      | "raw-LV-minus-Ao-positive-gradient"
      | "opening-target-above-one-percent"
      | "leaflet-opening-above-one-percent"
      | "canonical-one-percent-flow-threshold";
    predicate: string;
    threshold: number;
    thresholdUnit: "ml-per-sec" | "mmHg" | "fraction-01";
    episode: MainWireAorticOutflowV10EpisodeAuditV1;
    firstActiveAcceptedEndpoint: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1;
    openingBoundary: MainWireAorticOutflowV10EventBoundaryV1;
    leadToCanonicalAvoSec: number;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdsV1 =
  Readonly<{
    strictPositiveFlow: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1;
    exactLocalGradientPositive: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1;
    rawNodeGradientPositive: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1;
    openingTargetAboveOnePercent: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1;
    leafletOpeningAboveOnePercent: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1;
    canonicalOnePercentFlow: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1;
    canonicalAvoIndexMatchesCycleDiagnostics: boolean;
    noFloorOnePercentOpeningIndexMatchesCanonical: boolean;
    localZeroCrossingReconstructionResidualMmHg: number;
    eventDefinitionSensitivitySemanticsAligned: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctDecompositionV1 =
  Readonly<{
    canonicalFlowThresholdIctSec: number;
    mitralClosureToCalciumRiseSignedSec: number;
    calciumRiseToCanonicalAvoSec: number;
    calciumRiseToExactLocalGradientPositiveSec: number;
    exactLocalGradientPositiveToStrictPositiveFlowSec: number;
    strictPositiveFlowToCanonicalOnePercentAvoSec: number;
    detailedComponentSumSec: number;
    macroComponentSumSec: number;
    identityResidualSec: number;
    macroIdentityResidualSec: number;
    canonicalIndexIntervalResidualSec: number;
    identityWithinTolerance: boolean;
    systolicEventOrderSatisfied: boolean;
    calciumRiseBoundary: MainWireAorticOutflowV10EventBoundaryV1;
    calciumOnePercentRiseReadback: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctCalciumRiseV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralClosureDefinitionsV1 =
  Readonly<{
    flowMemory: false;
    inertanceModeled: false;
    canonicalOnePercentFlowThresholdMvc: MainWireAorticOutflowV10EventBoundaryV1;
    strictPositiveFlowEpisodeEnd: MainWireAorticOutflowV10EventBoundaryV1;
    leftAtriumMinusLeftVentriclePressureDownwardZeroCrossing: MainWireAorticOutflowV10EventBoundaryV1;
    openingTargetAtOrBelowOnePercentAcceptedEndpoint: MainWireAorticOutflowV10EventBoundaryV1;
    openingTargetZeroAcceptedEndpoint: MainWireAorticOutflowV10EventBoundaryV1;
    leafletClosureSensitivity: Readonly<{
      fiftyPercent: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralLeafletThresholdV1;
      tenPercent: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralLeafletThresholdV1;
      onePercent: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralLeafletThresholdV1;
    }>;
    openingTargetAtCanonicalAvo01: number;
    leafletOpeningFractionAtFinalTargetZero01: number;
    leafletOpeningFractionAtCanonicalAvo01: number;
    strictFlowEndMinusCanonicalMvcSec: number;
    pressureReversalMinusCanonicalMvcSec: number;
    pressureReversalMinusStrictFlowEndSec: number;
    pressureReversalAndStrictFlowEndShareAcceptedEndpoint: boolean;
    openingTargetOnePercentMinusCanonicalMvcSec: number;
    openingTargetZeroMinusCanonicalMvcSec: number;
    leafletFiftyToOnePercentClosureWidthSec: number | null;
    maximumOpeningTargetAfterFinalZeroBeforeAvo: number;
    openingTargetReactivationAboveOnePercentAfterFinalZeroBeforeAvo: boolean;
    canonicalMvcToPressureReversalToAvoIdentityResidualSec: number;
    pressureZeroCrossingReconstructionResidualMmHg: number;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventSnapshotV1 =
  Readonly<{
    event: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1;
    leftAtrialPressureMmHg: number;
    leftVentricularPressureMmHg: number;
    aorticNodePressureMmHg: number;
    proximalPortPressureMmHg: number;
    leftVentricularVolumeMl: number;
    mitralFlowMlPerSec: number;
    aorticFlowMlPerSec: number;
    leftAtriumMinusLeftVentricleGradientMmHg: number;
    rawLeftVentricleMinusAorticNodeGradientMmHg: number;
    exactLocalLeftVentricleMinusProximalPortGradientMmHg: number;
    characteristicImpedancePressureMmHg: number;
    stationAdditivityResidualMmHg: number;
    aorticOpeningTarget01: number;
    aorticLeafletOpeningFraction01: number;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctPressureBuildV1 =
  Readonly<{
    mvcLocalPressureDeficitMmHg: number;
    mvcToLocalZeroCrossingSec: number;
    interpolatedLeftVentricularPressureAtLocalZeroMmHg: number;
    interpolatedProximalPortPressureAtLocalZeroMmHg: number;
    leftVentricularPressureRiseToLocalZeroMmHg: number;
    proximalPortPressureChangeToLocalZeroMmHg: number;
    deficitClosureIdentityResidualMmHg: number;
    meanLeftVentricularPressureRiseRateMmHgPerSec: number | null;
    meanProximalPortPressureChangeRateMmHgPerSec: number | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctCalciumPressureBuildV1 =
  Readonly<{
    startDefinition: "interpolated-ventricular-calcium-one-percent-rise";
    stateInterpolation: "linear-between-boundary-bracketing-accepted-endpoint-states";
    initialLeftVentricularPressureMmHg: number;
    initialProximalPortPressureMmHg: number;
    initialProximalPortMinusLeftVentricleDeficitMmHg: number;
    calciumRiseToLocalZeroCrossingSec: number;
    interpolatedLeftVentricularPressureAtLocalZeroMmHg: number;
    interpolatedProximalPortPressureAtLocalZeroMmHg: number;
    leftVentricularPressureRiseMmHg: number;
    proximalPortPressureChangeMmHg: number;
    deficitClosureIdentityResidualMmHg: number;
    meanLeftVentricularPressureRiseRateMmHgPerSec: number | null;
    meanProximalPortPressureChangeRateMmHgPerSec: number | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralFillingV1 =
  Readonly<{
    existingDiastolicFlowReadback: MitralFlow;
    cycleDiagnostics: MitralDiagnostics;
    fusedOrUnresolved: boolean;
    peakEToAIdentityResidual: number | null;
    forwardVolumeEToAIdentityResidual: number | null;
    modeledVtiEToAIdentityResidual: number | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLoadV1 =
  Readonly<{
    aorticMaximumForwardEoaCm2: number;
    strokeVolumeMl: number;
    peakAorticFlowMlPerSec: number;
    peakVenaContractaVelocityMPerSec: number;
    meanDopplerGradientMmHg: number;
    peakDopplerGradientMmHg: number;
    meanAorticPressureMmHg: number;
    peakLeftVentricularPressureMmHg: number;
    exactPressureStations: MainWireAorticOutflowExactPressureStationsV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTrendPointV1 =
  Readonly<{
    heartRateBpm: number;
    canonicalIctSec: number;
    mvcToCalciumRiseSignedSec: number;
    calciumRiseToLocalGradientPositiveSec: number;
    localGradientPositiveToStrictFlowSec: number;
    strictFlowToOnePercentAvoSec: number;
    calciumRiseToOnePercentAvoSec: number;
    strictMitralFlowEndMinusCanonicalMvcSec: number;
    mitralPressureReversalMinusCanonicalMvcSec: number;
    mitralOpeningTargetZeroMinusCanonicalMvcSec: number;
    mitralLeafletFiftyPercentMinusCanonicalMvcSec: number | null;
    mitralLeafletTenPercentMinusCanonicalMvcSec: number | null;
    mitralLeafletOnePercentMinusCanonicalMvcSec: number | null;
    mitralLeafletFiftyToOnePercentClosureWidthSec: number | null;
    mvcLocalPressureDeficitMmHg: number;
    lvPressureRiseToLocalZeroMmHg: number;
    proximalPortPressureChangeToLocalZeroMmHg: number;
    calciumRiseLocalPressureDeficitMmHg: number;
    calciumRiseLvPressureRiseToLocalZeroMmHg: number;
    calciumRiseProximalPortPressureChangeToLocalZeroMmHg: number;
    mitralPeakEToARatio: number | null;
    mitralForwardVolumeEToARatio: number | null;
    mitralModeledVtiEToARatio: number | null;
    mitralFusedOrUnresolved01: number;
    strokeVolumeMl: number;
    peakAorticFlowMlPerSec: number;
    meanDopplerGradientMmHg: number;
    meanAorticPressureMmHg: number;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTrendDeltaV1 =
  Readonly<{
    lowerHeartRateBpm: number;
    upperHeartRateBpm: number;
    upperMinusLower: Omit<
      MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTrendPointV1,
      "heartRateBpm"
    >;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctArmV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1;
    calciumProfile: MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1;
    protocolIdentityHash: string;
    exactAssemblyAudit: Runner["exactAssemblyAudit"];
    periodicSteadyStateClaimed: boolean;
    integrationCompletedWithoutFailure: boolean;
    completedBeatCount: number;
    selectedBeatSampleCount: number;
    precedingAcceptedSampleAvailable: boolean;
    timeline: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTimelineV1;
    aorticThresholds: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdsV1;
    ictDecomposition: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctDecompositionV1;
    mitralClosureDefinitions: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralClosureDefinitionsV1;
    eventSnapshots: Readonly<{
      mitralValveClosure: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventSnapshotV1;
      ventricularCalciumRise: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventSnapshotV1;
      aorticValveOpening: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventSnapshotV1;
    }>;
    pressureBuildToLocalOpening: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctPressureBuildV1;
    calciumRisePressureBuildToLocalOpening: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctCalciumPressureBuildV1;
    mitralFilling: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralFillingV1;
    load: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLoadV1;
    cycleMetrics: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    onePercentFlowEjectionTime: MainWireAorticOutflowOnePercentFlowEjectionTimeV1;
    exactReadbackAudit: MainWireAorticOutflowExactReadbackAuditV1;
    period1AndIntegrationPassed: boolean;
    singleDistinctAorticFlowPeakPassed: boolean;
    exactStationAuditPassed: boolean;
    calciumRiseReadbackPassed: boolean;
    interpretationEligible: boolean;
    trendPoint: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTrendPointV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerInputV1 =
  Readonly<{
    sourceLabel: string;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1 =
  Readonly<
    {
      sourceLabel: string;
      heartRateBpm: number;
      cycleLengthSec: number;
    } & Pick<
      MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctArmV1,
      | "protocolIdentityHash"
      | "periodicSteadyStateClaimed"
      | "integrationCompletedWithoutFailure"
      | "completedBeatCount"
      | "selectedBeatSampleCount"
      | "precedingAcceptedSampleAvailable"
      | "timeline"
      | "aorticThresholds"
      | "ictDecomposition"
      | "mitralClosureDefinitions"
      | "eventSnapshots"
      | "pressureBuildToLocalOpening"
      | "calciumRisePressureBuildToLocalOpening"
      | "mitralFilling"
      | "load"
      | "cycleMetrics"
      | "onePercentFlowEjectionTime"
      | "exactReadbackAudit"
      | "period1AndIntegrationPassed"
      | "singleDistinctAorticFlowPeakPassed"
      | "exactStationAuditPassed"
      | "calciumRiseReadbackPassed"
      | "interpretationEligible"
      | "trendPoint"
    >
  >;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ICT_MECHANISM_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID;
    designRole: "main-four-heart-rate-design";
    dimensionlessRateCoefficient: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1;
    armsSortedByHeartRate: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctArmV1[];
    adjacentHeartRateDeltas: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTrendDeltaV1[];
    heartRate90Minus50: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTrendDeltaV1;
    allNonCalciumExactAssemblyAuditHashesIdentical: boolean;
    allArmsPeriod1AndIntegrationPassed: boolean;
    allArmsHaveOneDistinctAorticFlowPeak: boolean;
    allExactReadbackStationEquationsWithinTolerance: boolean;
    allIctIdentitiesWithinTolerance: boolean;
    allCalciumRiseReadbacksPassed: boolean;
    allEventDefinitionSensitivitySemanticsAligned: boolean;
    allArmsInterpretationEligible: boolean;
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ICT_MECHANISM_CLAIM_V1;
  }>;

type PrimaryEpisode = Readonly<{
  openingIndex: number;
  closingIndex: number;
  audit: MainWireAorticOutflowV10EpisodeAuditV1;
}>;

export function measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
  inputs: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismInputV1[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1 {
  const expectedIds =
    MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1 as readonly string[];
  const byId = new Map<
    string,
    MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismInputV1
  >();
  for (const input of inputs) {
    if (!expectedIds.includes(input.arm.armId)) {
      throw new Error(`unsupported saturating-law ICT arm: ${input.arm.armId}`);
    }
    if (byId.has(input.arm.armId)) {
      throw new Error(`duplicate saturating-law ICT arm: ${input.arm.armId}`);
    }
    byId.set(input.arm.armId, input);
  }
  for (const arm of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1) {
    if (!byId.has(arm.armId)) {
      throw new Error(`missing saturating-law ICT arm: ${arm.armId}`);
    }
  }
  if (byId.size !== 4) {
    throw new Error(
      "saturating-law ICT mechanism requires exactly four main arms",
    );
  }

  const armsSortedByHeartRate = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1.map(
      (arm) => measureArm(byId.get(arm.armId)!),
    ).sort((left, right) => left.arm.heartRateBpm - right.arm.heartRateBpm),
  );
  if (
    armsSortedByHeartRate.map((arm) => arm.arm.heartRateBpm).join(",") !==
    "50,60,75,90"
  ) {
    throw new Error("saturating-law ICT heart-rate order mismatch");
  }
  const nonCalciumHashes = armsSortedByHeartRate.map((arm) =>
    protocolHash({
      mechanics: arm.exactAssemblyAudit.mechanicsProviderParameterIdentityHash,
      circulation: arm.exactAssemblyAudit.circulationRuntimeStableHash,
      bloodVolume: arm.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
    }),
  );
  const allNonCalciumExactAssemblyAuditHashesIdentical =
    new Set(nonCalciumHashes).size === 1;
  const adjacentHeartRateDeltas = Object.freeze([
    trendDelta(armsSortedByHeartRate[0]!, armsSortedByHeartRate[1]!),
    trendDelta(armsSortedByHeartRate[1]!, armsSortedByHeartRate[2]!),
    trendDelta(armsSortedByHeartRate[2]!, armsSortedByHeartRate[3]!),
  ]);
  const allArmsPeriod1AndIntegrationPassed = armsSortedByHeartRate.every(
    (arm) => arm.period1AndIntegrationPassed,
  );
  const allArmsHaveOneDistinctAorticFlowPeak = armsSortedByHeartRate.every(
    (arm) => arm.singleDistinctAorticFlowPeakPassed,
  );
  const allExactReadbackStationEquationsWithinTolerance =
    armsSortedByHeartRate.every((arm) => arm.exactStationAuditPassed);
  const allIctIdentitiesWithinTolerance = armsSortedByHeartRate.every(
    (arm) => arm.ictDecomposition.identityWithinTolerance,
  );
  const allCalciumRiseReadbacksPassed = armsSortedByHeartRate.every(
    (arm) => arm.calciumRiseReadbackPassed,
  );
  const allEventDefinitionSensitivitySemanticsAligned =
    armsSortedByHeartRate.every(
      (arm) => arm.aorticThresholds.eventDefinitionSensitivitySemanticsAligned,
    );

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ICT_MECHANISM_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
    designRole: "main-four-heart-rate-design" as const,
    dimensionlessRateCoefficient:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1,
    armsSortedByHeartRate,
    adjacentHeartRateDeltas,
    heartRate90Minus50: trendDelta(
      armsSortedByHeartRate[0]!,
      armsSortedByHeartRate[3]!,
    ),
    allNonCalciumExactAssemblyAuditHashesIdentical,
    allArmsPeriod1AndIntegrationPassed,
    allArmsHaveOneDistinctAorticFlowPeak,
    allExactReadbackStationEquationsWithinTolerance,
    allIctIdentitiesWithinTolerance,
    allCalciumRiseReadbacksPassed,
    allEventDefinitionSensitivitySemanticsAligned,
    allArmsInterpretationEligible:
      allNonCalciumExactAssemblyAuditHashesIdentical &&
      armsSortedByHeartRate.every((arm) => arm.interpretationEligible),
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ICT_MECHANISM_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismInputV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctArmV1 {
  validateIdentity(input);
  const ledger =
    measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
      {
        sourceLabel: input.arm.armId,
        calciumDriveParams: input.calciumDriveParams,
        periodicResult: input.periodicResult,
      },
    );
  const {
    sourceLabel: _sourceLabel,
    heartRateBpm: _heartRateBpm,
    cycleLengthSec: _cycleLengthSec,
    ...readback
  } = ledger;
  return Object.freeze({
    arm: input.arm,
    calciumProfile: input.calciumProfile,
    exactAssemblyAudit: input.exactAssemblyAudit,
    ...readback,
  });
}

export function measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerInputV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1 {
  const { sourceLabel, calciumDriveParams, periodicResult: result } = input;
  if (
    result.protocolIdentity.calciumDrive.parameterSetId !==
      calciumDriveParams.parameterSetId ||
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash !==
      protocolHash(calciumDriveParams) ||
    result.protocolIdentityHash !== protocolHash(result.protocolIdentity)
  ) {
    throw new Error(
      `${sourceLabel} calcium parameter/result identity mismatch`,
    );
  }
  const heartRateBpm = result.claim.heartRateBpm;
  const cycleLengthSec = calciumDriveParams.cycleLengthSec;
  if (
    !nearlyEqual(cycleLengthSec, 60 / heartRateBpm) ||
    !nearlyEqual(result.dtSec * result.stepsPerBeat, cycleLengthSec)
  ) {
    throw new Error(`${sourceLabel} cycle/result identity mismatch`);
  }
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length !== result.stepsPerBeat) {
    throw new Error(
      `${sourceLabel} requires one complete execution-resolution beat`,
    );
  }
  if (
    Math.abs(beat.endTimeSec - beat.startTimeSec - cycleLengthSec) >
      TIME_TOLERANCE_SEC ||
    Math.abs(beat.samples[0]!.timeSec - beat.startTimeSec - result.dtSec) >
      TIME_TOLERANCE_SEC ||
    Math.abs(beat.samples.at(-1)!.timeSec - beat.endTimeSec) >
      TIME_TOLERANCE_SEC
  ) {
    throw new Error(`${sourceLabel} selected-beat chronology mismatch`);
  }
  const precedingBeat = result.retainedCompleteBeats.at(-2);
  const precedingSample =
    precedingBeat !== undefined &&
    precedingBeat.beatIndex + 1 === beat.beatIndex
      ? (precedingBeat.samples.at(-1) ?? null)
      : null;
  const samples = beat.samples;
  const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
    result,
    calciumDriveParams,
  );
  const physiology = summary.cyclePhysiology;
  if (physiology === null) {
    throw new Error(`${sourceLabel} cycle physiology is unavailable`);
  }
  const cycleMetrics = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumDriveParams,
    sourceLabel,
  );
  const exactCycle = measureMainWireAorticOutflowCycleReadbackV1(
    result,
    cycleLengthSec,
    sourceLabel,
  );
  const diastolic =
    measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
      result,
      calciumDriveParams,
    );
  if (diastolic.value === null) {
    throw new Error(`${sourceLabel} mitral filling readback is unavailable`);
  }

  const events = physiology.events;
  const calcium = calciumRise(
    samples,
    calciumDriveParams,
    precedingSample,
    result.dtSec,
    cycleLengthSec,
  );
  const timeline = Object.freeze({
    atrialCalciumOnset: event(
      samples,
      events.atrialCalciumOnset.sampleIndex,
      beat.startTimeSec,
      "configured-atrial-calcium-onset-nearest-accepted-endpoint",
    ),
    mitralValveClosure: event(
      samples,
      events.mitralValveClosure.sampleIndex,
      beat.startTimeSec,
      "canonical-one-percent-flow-threshold-MVC",
    ),
    ventricularCalciumOnePercentRiseAcceptedEndpoint: event(
      samples,
      calcium.episode.primaryOpeningSampleIndex,
      beat.startTimeSec,
      "accepted-endpoint-after-linear-one-percent-LVFW-calcium-crossing",
    ),
    aorticValveOpening: event(
      samples,
      events.aorticValveOpening.sampleIndex,
      beat.startTimeSec,
      "canonical-one-percent-flow-threshold-AVO",
    ),
    aorticValveClosure: event(
      samples,
      events.aorticValveClosure.sampleIndex,
      beat.startTimeSec,
      "canonical-one-percent-flow-threshold-AVC",
    ),
    mitralValveOpening: event(
      samples,
      events.mitralValveOpening.sampleIndex,
      beat.startTimeSec,
      "canonical-one-percent-flow-threshold-MVO",
    ),
  });
  const aorticThresholds = aorticThresholdReadbacks(
    samples,
    precedingSample,
    exactCycle.onePercentFlowEjectionTime,
    events.aorticOpenThresholdMlPerSec,
    events.aorticValveOpening.sampleIndex,
    beat.startTimeSec,
    result.dtSec,
    cycleLengthSec,
  );
  const mvcBoundary = sampledBoundary(
    events.mitralValveClosure.sampleIndex,
    samples,
    result.dtSec,
    cycleLengthSec,
    precedingSample !== null,
  );
  const avoBoundary = aorticThresholds.canonicalOnePercentFlow.openingBoundary;
  const ictDecomposition = decomposeIct(
    physiology.leftVentricularPerformance.isovolumicContractionTimeSec,
    mvcBoundary,
    calcium,
    aorticThresholds.exactLocalGradientPositive.openingBoundary,
    aorticThresholds.strictPositiveFlow.openingBoundary,
    avoBoundary,
    cycleLengthSec,
  );
  const mitralClosureDefinitions = mitralClosureReadbacks(
    samples,
    precedingSample,
    events.atrialCalciumOnset.sampleIndex,
    events.mitralValveClosure.sampleIndex,
    events.aorticValveOpening.sampleIndex,
    result.dtSec,
    cycleLengthSec,
  );
  const eventSnapshots = Object.freeze({
    mitralValveClosure: snapshot(samples, timeline.mitralValveClosure),
    ventricularCalciumRise: snapshot(
      samples,
      timeline.ventricularCalciumOnePercentRiseAcceptedEndpoint,
    ),
    aorticValveOpening: snapshot(samples, timeline.aorticValveOpening),
  });
  const pressureBuildToLocalOpening = pressureBuild(
    samples,
    precedingSample,
    eventSnapshots.mitralValveClosure,
    aorticThresholds.exactLocalGradientPositive.openingBoundary,
    result.dtSec,
    cycleLengthSec,
  );
  const calciumRisePressureBuildToLocalOpening = calciumPressureBuild(
    samples,
    precedingSample,
    calcium.boundary,
    aorticThresholds.exactLocalGradientPositive.openingBoundary,
    cycleLengthSec,
  );
  const mitralFilling = mitralReadback(
    diastolic.value.mitral,
    physiology.mitral,
  );
  const load = Object.freeze({
    aorticMaximumForwardEoaCm2:
      result.valveResearchInput.valves.AoV.maximumForwardEoaCm2,
    strokeVolumeMl: cycleMetrics.aorticForwardVolumeMl,
    peakAorticFlowMlPerSec: cycleMetrics.aorticMaximumFlowMlPerSec,
    peakVenaContractaVelocityMPerSec:
      cycleMetrics.peakVenaContractaVelocityMPerSec,
    meanDopplerGradientMmHg: cycleMetrics.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: cycleMetrics.peakDopplerGradientMmHg,
    meanAorticPressureMmHg: cycleMetrics.meanAorticAbsolutePressureMmHg,
    peakLeftVentricularPressureMmHg:
      cycleMetrics.peakLeftVentricularPressureMmHg,
    exactPressureStations: exactCycle.exactPressureStations,
  });
  const period1AndIntegrationPassed =
    result.periodicSteadyStateClaimed &&
    result.integrationCompletedWithoutFailure;
  const singleDistinctAorticFlowPeakPassed =
    cycleMetrics.aorticFlowDistinctPeakCountAboveFivePercent === 1;
  const exactStationAuditPassed =
    exactCycle.exactReadbackAudit.stationEquationsWithinTolerance;
  const calciumRiseReadbackPassed =
    calcium.bracketSatisfied &&
    Math.abs(calcium.reconstructionResidualUM) <= IDENTITY_TOLERANCE;
  const trendPoint = makeTrendPoint(
    heartRateBpm,
    ictDecomposition,
    mitralClosureDefinitions,
    pressureBuildToLocalOpening,
    calciumRisePressureBuildToLocalOpening,
    mitralFilling,
    load,
  );

  return Object.freeze({
    sourceLabel,
    heartRateBpm,
    cycleLengthSec,
    protocolIdentityHash: result.protocolIdentityHash,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    completedBeatCount: result.completedBeatCount,
    selectedBeatSampleCount: beat.samples.length,
    precedingAcceptedSampleAvailable: precedingSample !== null,
    timeline,
    aorticThresholds,
    ictDecomposition,
    mitralClosureDefinitions,
    eventSnapshots,
    pressureBuildToLocalOpening,
    calciumRisePressureBuildToLocalOpening,
    mitralFilling,
    load,
    cycleMetrics,
    onePercentFlowEjectionTime: exactCycle.onePercentFlowEjectionTime,
    exactReadbackAudit: exactCycle.exactReadbackAudit,
    period1AndIntegrationPassed,
    singleDistinctAorticFlowPeakPassed,
    exactStationAuditPassed,
    calciumRiseReadbackPassed,
    interpretationEligible:
      period1AndIntegrationPassed &&
      singleDistinctAorticFlowPeakPassed &&
      exactStationAuditPassed &&
      calciumRiseReadbackPassed &&
      ictDecomposition.identityWithinTolerance &&
      ictDecomposition.systolicEventOrderSatisfied &&
      aorticThresholds.eventDefinitionSensitivitySemanticsAligned,
    trendPoint,
  });
}

function calciumRise(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  params: FiveWallNormalCalciumDriveParamsV1,
  preceding: MainWireNormalAdultFiveWallDiagnosticSampleV2 | null,
  dtSec: number,
  cycleLengthSec: number,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctCalciumRiseV1 {
  const thresholdUM =
    params.ventricular.diastolicCalciumUM +
    0.01 * params.ventricular.peakAmplitudeUM;
  const values = samples.map((sample) => sample.freeCalciumUM.LVFW);
  const peakIndex = maximumIndex(values);
  const episode = primaryEpisode(
    values.map((value) => value >= thresholdUM),
    peakIndex,
  );
  const boundary = linearBoundary(
    "opening",
    episode.openingIndex,
    values,
    preceding?.freeCalciumUM.LVFW ?? null,
    thresholdUM,
    dtSec,
    cycleLengthSec,
  );
  const current = values[episode.openingIndex]!;
  const previous =
    boundary.previousAcceptedSampleIndex === null
      ? (preceding?.freeCalciumUM.LVFW ?? values.at(-1)!)
      : values[boundary.previousAcceptedSampleIndex]!;
  return Object.freeze({
    thresholdUM,
    thresholdDefinition:
      "diastolic-plus-one-percent-configured-peak-amplitude" as const,
    shiftedSignalInterpolated: "LVFW-free-calcium-minus-threshold" as const,
    episode: Object.freeze({
      cyclicEpisodeCount: episode.audit.cyclicEpisodeCount,
      totalActiveSampleCount: episode.audit.totalActiveSampleCount,
      primaryEpisodeActiveSampleCount:
        episode.audit.primaryEpisodeActiveSampleCount,
      extraActiveSampleCountOutsidePrimaryEpisode:
        episode.audit.extraActiveSampleCountOutsidePrimaryEpisode,
      primaryOpeningSampleIndex: episode.audit.primaryOpeningSampleIndex,
      primaryClosingSampleIndex: episode.audit.primaryClosingSampleIndex,
      primaryContainsGlobalCalciumPeak: true as const,
    }),
    boundary,
    previousAcceptedEndpointCalciumUM: previous,
    currentAcceptedEndpointCalciumUM: current,
    bracketSatisfied: previous < thresholdUM && current >= thresholdUM,
    reconstructionResidualUM: reconstructCrossingResidual(
      boundary,
      values,
      preceding?.freeCalciumUM.LVFW ?? null,
      thresholdUM,
    ),
  });
}

function aorticThresholdReadbacks(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  preceding: MainWireNormalAdultFiveWallDiagnosticSampleV2 | null,
  noFloorEt: MainWireAorticOutflowOnePercentFlowEjectionTimeV1,
  canonicalThresholdMlPerSec: number,
  diagnosticsAvoIndex: number,
  beatStartTimeSec: number,
  dtSec: number,
  cycleLengthSec: number,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdsV1 {
  const flows = samples.map(
    (sample) => sample.valveHydraulics.AoV.flowMlPerSec,
  );
  const peakIndex = maximumIndex(flows);
  const local = samples.map(
    (sample) => exact(sample).localValvePressureGradientMmHg,
  );
  const raw = samples.map(
    (sample) =>
      sample.circulationNodeAbsolutePressureMmHg.LV -
      sample.circulationNodeAbsolutePressureMmHg.Ao,
  );
  const build = (
    definitionId: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1["definitionId"],
    predicate: string,
    threshold: number,
    thresholdUnit: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1["thresholdUnit"],
    mask: readonly boolean[],
    boundary: (
      episode: PrimaryEpisode,
    ) => MainWireAorticOutflowV10EventBoundaryV1,
  ) => {
    const episode = primaryEpisode(mask, peakIndex);
    return Object.freeze({
      definitionId,
      predicate,
      threshold,
      thresholdUnit,
      episode: episode.audit,
      firstActiveAcceptedEndpoint: event(
        samples,
        episode.openingIndex,
        beatStartTimeSec,
        `first-active-endpoint-${definitionId}`,
      ),
      openingBoundary: boundary(episode),
      leadToCanonicalAvoSec: 0,
    });
  };
  const sampled = (episode: PrimaryEpisode) =>
    sampledBoundary(
      episode.openingIndex,
      samples,
      dtSec,
      cycleLengthSec,
      preceding !== null,
    );
  const rawEntries = {
    strictPositiveFlow: build(
      "strict-positive-flow",
      "Q-greater-than-zero",
      0,
      "ml-per-sec",
      flows.map((flow) => flow > 0),
      sampled,
    ),
    exactLocalGradientPositive: build(
      "exact-local-LV-minus-proximal-port-positive-gradient",
      "exact-local-gradient-greater-than-zero",
      0,
      "mmHg",
      local.map((gradient) => gradient > 0),
      (episode) =>
        linearBoundary(
          "opening",
          episode.openingIndex,
          local,
          preceding === null
            ? null
            : exact(preceding).localValvePressureGradientMmHg,
          0,
          dtSec,
          cycleLengthSec,
        ),
    ),
    rawNodeGradientPositive: build(
      "raw-LV-minus-Ao-positive-gradient",
      "raw-LV-minus-Ao-gradient-greater-than-zero",
      0,
      "mmHg",
      raw.map((gradient) => gradient > 0),
      sampled,
    ),
    openingTargetAboveOnePercent: build(
      "opening-target-above-one-percent",
      "opening-target-greater-than-0p01",
      0.01,
      "fraction-01",
      samples.map(
        (sample) => sample.valveHydraulics.AoV.openingTarget01 > 0.01,
      ),
      sampled,
    ),
    leafletOpeningAboveOnePercent: build(
      "leaflet-opening-above-one-percent",
      "leaflet-opening-fraction-greater-than-0p01",
      0.01,
      "fraction-01",
      samples.map((sample) => sample.valveOpeningFraction01.AoV > 0.01),
      sampled,
    ),
    canonicalOnePercentFlow: build(
      "canonical-one-percent-flow-threshold",
      "Q-greater-than-max-one-ml-per-sec-and-one-percent-positive-Qpeak",
      canonicalThresholdMlPerSec,
      "ml-per-sec",
      flows.map((flow) => flow > canonicalThresholdMlPerSec),
      sampled,
    ),
  } as const;
  const canonicalOffset =
    rawEntries.canonicalOnePercentFlow.openingBoundary
      .cycleOffsetFromSelectedBeatStartSec;
  const withLead = <
    T extends
      MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctAorticThresholdV1,
  >(
    value: T,
  ): T =>
    Object.freeze({
      ...value,
      leadToCanonicalAvoSec: cyclicDeltaSec(
        value.openingBoundary.cycleOffsetFromSelectedBeatStartSec,
        canonicalOffset,
        cycleLengthSec,
      ),
    });
  const localBoundary = rawEntries.exactLocalGradientPositive.openingBoundary;
  const localResidual = reconstructCrossingResidual(
    localBoundary,
    local,
    preceding === null ? null : exact(preceding).localValvePressureGradientMmHg,
    0,
  );
  return Object.freeze({
    strictPositiveFlow: withLead(rawEntries.strictPositiveFlow),
    exactLocalGradientPositive: withLead(rawEntries.exactLocalGradientPositive),
    rawNodeGradientPositive: withLead(rawEntries.rawNodeGradientPositive),
    openingTargetAboveOnePercent: withLead(
      rawEntries.openingTargetAboveOnePercent,
    ),
    leafletOpeningAboveOnePercent: withLead(
      rawEntries.leafletOpeningAboveOnePercent,
    ),
    canonicalOnePercentFlow: withLead(rawEntries.canonicalOnePercentFlow),
    canonicalAvoIndexMatchesCycleDiagnostics:
      rawEntries.canonicalOnePercentFlow.episode.primaryOpeningSampleIndex ===
      diagnosticsAvoIndex,
    noFloorOnePercentOpeningIndexMatchesCanonical:
      noFloorEt.primaryOpeningSampleIndex === diagnosticsAvoIndex,
    localZeroCrossingReconstructionResidualMmHg: localResidual,
    eventDefinitionSensitivitySemanticsAligned:
      rawEntries.strictPositiveFlow.predicate === "Q-greater-than-zero" &&
      localBoundary.boundaryMethod ===
        "linear-zero-crossing-between-accepted-endpoints" &&
      Math.abs(localResidual) <= IDENTITY_TOLERANCE,
  });
}

function decomposeIct(
  canonicalIctSec: number,
  mvc: MainWireAorticOutflowV10EventBoundaryV1,
  calciumReadback: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctCalciumRiseV1,
  local: MainWireAorticOutflowV10EventBoundaryV1,
  strictFlow: MainWireAorticOutflowV10EventBoundaryV1,
  avo: MainWireAorticOutflowV10EventBoundaryV1,
  cycleLengthSec: number,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctDecompositionV1 {
  const calcium = calciumReadback.boundary;
  const mvcToCalcium = signedCyclicDeltaSec(
    mvc.cycleOffsetFromSelectedBeatStartSec,
    calcium.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  const calciumToLocal = cyclicDeltaSec(
    calcium.cycleOffsetFromSelectedBeatStartSec,
    local.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  const localToStrict = cyclicDeltaSec(
    local.cycleOffsetFromSelectedBeatStartSec,
    strictFlow.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  const strictToAvo = cyclicDeltaSec(
    strictFlow.cycleOffsetFromSelectedBeatStartSec,
    avo.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  const calciumToAvo = cyclicDeltaSec(
    calcium.cycleOffsetFromSelectedBeatStartSec,
    avo.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  const detailedSum =
    mvcToCalcium + calciumToLocal + localToStrict + strictToAvo;
  const macroSum = mvcToCalcium + calciumToAvo;
  const directIndexInterval = cyclicDeltaSec(
    mvc.cycleOffsetFromSelectedBeatStartSec,
    avo.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  const identityResidualSec = canonicalIctSec - detailedSum;
  const macroIdentityResidualSec = canonicalIctSec - macroSum;
  const canonicalIndexIntervalResidualSec =
    canonicalIctSec - directIndexInterval;
  return Object.freeze({
    canonicalFlowThresholdIctSec: canonicalIctSec,
    mitralClosureToCalciumRiseSignedSec: mvcToCalcium,
    calciumRiseToCanonicalAvoSec: calciumToAvo,
    calciumRiseToExactLocalGradientPositiveSec: calciumToLocal,
    exactLocalGradientPositiveToStrictPositiveFlowSec: localToStrict,
    strictPositiveFlowToCanonicalOnePercentAvoSec: strictToAvo,
    detailedComponentSumSec: detailedSum,
    macroComponentSumSec: macroSum,
    identityResidualSec,
    macroIdentityResidualSec,
    canonicalIndexIntervalResidualSec,
    identityWithinTolerance:
      Math.abs(identityResidualSec) <= IDENTITY_TOLERANCE &&
      Math.abs(macroIdentityResidualSec) <= IDENTITY_TOLERANCE &&
      Math.abs(canonicalIndexIntervalResidualSec) <= IDENTITY_TOLERANCE,
    systolicEventOrderSatisfied:
      calciumToLocal + localToStrict + strictToAvo <= cycleLengthSec / 2,
    calciumRiseBoundary: calcium,
    calciumOnePercentRiseReadback: calciumReadback,
  });
}

function mitralClosureReadbacks(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  preceding: MainWireNormalAdultFiveWallDiagnosticSampleV2 | null,
  atrialOnsetIndex: number,
  canonicalMvcIndex: number,
  avoIndex: number,
  dtSec: number,
  cycleLengthSec: number,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralClosureDefinitionsV1 {
  const canonical = sampledBoundary(
    canonicalMvcIndex,
    samples,
    dtSec,
    cycleLengthSec,
    preceding !== null,
  );
  const strictClosingIndex = finalInactiveAfterActiveRun(
    samples.map((sample) => sample.valveHydraulics.MV.flowMlPerSec > 0),
    atrialOnsetIndex,
    avoIndex,
  );
  const strict = sampledBoundary(
    strictClosingIndex,
    samples,
    dtSec,
    cycleLengthSec,
    preceding !== null,
  );
  const laMinusLv = samples.map(
    (sample) =>
      sample.circulationNodeAbsolutePressureMmHg.LA -
      sample.circulationNodeAbsolutePressureMmHg.LV,
  );
  const pressureIndex = lastDownwardCrossingIndex(
    laMinusLv,
    atrialOnsetIndex,
    avoIndex,
  );
  const pressure = linearBoundary(
    "closing",
    pressureIndex,
    laMinusLv,
    preceding === null
      ? null
      : preceding.circulationNodeAbsolutePressureMmHg.LA -
          preceding.circulationNodeAbsolutePressureMmHg.LV,
    0,
    dtSec,
    cycleLengthSec,
  );
  if (pressure.currentAcceptedSampleIndex !== strictClosingIndex) {
    throw new Error(
      "final MV pressure reversal and algebraic strict-flow end do not share an accepted endpoint",
    );
  }
  const openingTarget = samples.map(
    (sample) => sample.valveHydraulics.MV.openingTarget01,
  );
  const targetOnePercentIndex = lastDownwardCrossingIndex(
    openingTarget,
    atrialOnsetIndex,
    avoIndex,
    0.01,
  );
  const targetZeroIndex = lastDownwardCrossingIndex(
    openingTarget,
    atrialOnsetIndex,
    avoIndex,
    0,
  );
  const targetOnePercent = sampledBoundary(
    targetOnePercentIndex,
    samples,
    dtSec,
    cycleLengthSec,
    preceding !== null,
  );
  const targetZero = sampledBoundary(
    targetZeroIndex,
    samples,
    dtSec,
    cycleLengthSec,
    preceding !== null,
  );
  const leaflet = samples.map((sample) => sample.valveOpeningFraction01.MV);
  const leafletThreshold = (
    threshold01: 0.5 | 0.1 | 0.01,
  ): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralLeafletThresholdV1 => {
    if (leaflet[targetZeroIndex]! <= threshold01) {
      return Object.freeze({
        threshold01,
        status: "already-at-or-below-at-final-target-deactivation" as const,
        crossingBoundary: null,
        crossingMinusCanonicalMvcSec: null,
        reconstructionResidual01: null,
      });
    }
    const searchStartIndex = (targetZeroIndex + 1) % samples.length;
    const crossingIndex =
      targetZeroIndex === avoIndex
        ? null
        : firstDownwardCrossingIndexOrNull(
            leaflet,
            searchStartIndex,
            avoIndex,
            threshold01,
          );
    if (crossingIndex === null) {
      if (leaflet[avoIndex]! <= threshold01) {
        throw new Error("MV leaflet threshold classification is inconsistent");
      }
      return Object.freeze({
        threshold01,
        status: "remains-above-at-AVO" as const,
        crossingBoundary: null,
        crossingMinusCanonicalMvcSec: null,
        reconstructionResidual01: null,
      });
    }
    const crossingBoundary = linearBoundary(
      "closing",
      crossingIndex,
      leaflet,
      preceding?.valveOpeningFraction01.MV ?? null,
      threshold01,
      dtSec,
      cycleLengthSec,
    );
    return Object.freeze({
      threshold01,
      status: "crossed-after-final-target-deactivation-before-AVO" as const,
      crossingBoundary,
      crossingMinusCanonicalMvcSec: signedBoundaryDeltaSec(
        canonical,
        crossingBoundary,
        cycleLengthSec,
      ),
      reconstructionResidual01: reconstructCrossingResidual(
        crossingBoundary,
        leaflet,
        preceding?.valveOpeningFraction01.MV ?? null,
        threshold01,
      ),
    });
  };
  const leafletFiftyReadback = leafletThreshold(0.5);
  const leafletTenReadback = leafletThreshold(0.1);
  const leafletOneReadback = leafletThreshold(0.01);
  const leafletFifty = leafletFiftyReadback.crossingBoundary;
  const leafletOne = leafletOneReadback.crossingBoundary;
  const targetAfterZeroToAvo = cyclicSlice(
    openingTarget,
    targetZeroIndex,
    avoIndex,
  );
  const maximumTargetAfterZeroToAvo = Math.max(...targetAfterZeroToAvo);
  const mvcToPressure = signedCyclicDeltaSec(
    canonical.cycleOffsetFromSelectedBeatStartSec,
    pressure.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  const pressureToAvo = cyclicDeltaSec(
    pressure.cycleOffsetFromSelectedBeatStartSec,
    sampledBoundary(
      avoIndex,
      samples,
      dtSec,
      cycleLengthSec,
      preceding !== null,
    ).cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  return Object.freeze({
    flowMemory: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2.flowMemory,
    inertanceModeled:
      MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_CLAIM_V2.inertanceModeled,
    canonicalOnePercentFlowThresholdMvc: canonical,
    strictPositiveFlowEpisodeEnd: strict,
    leftAtriumMinusLeftVentriclePressureDownwardZeroCrossing: pressure,
    openingTargetAtOrBelowOnePercentAcceptedEndpoint: targetOnePercent,
    openingTargetZeroAcceptedEndpoint: targetZero,
    leafletClosureSensitivity: Object.freeze({
      fiftyPercent: leafletFiftyReadback,
      tenPercent: leafletTenReadback,
      onePercent: leafletOneReadback,
    }),
    openingTargetAtCanonicalAvo01: openingTarget[avoIndex]!,
    leafletOpeningFractionAtFinalTargetZero01: leaflet[targetZeroIndex]!,
    leafletOpeningFractionAtCanonicalAvo01: leaflet[avoIndex]!,
    strictFlowEndMinusCanonicalMvcSec: signedCyclicDeltaSec(
      canonical.cycleOffsetFromSelectedBeatStartSec,
      strict.cycleOffsetFromSelectedBeatStartSec,
      cycleLengthSec,
    ),
    pressureReversalMinusCanonicalMvcSec: signedCyclicDeltaSec(
      canonical.cycleOffsetFromSelectedBeatStartSec,
      pressure.cycleOffsetFromSelectedBeatStartSec,
      cycleLengthSec,
    ),
    pressureReversalMinusStrictFlowEndSec: signedCyclicDeltaSec(
      strict.cycleOffsetFromSelectedBeatStartSec,
      pressure.cycleOffsetFromSelectedBeatStartSec,
      cycleLengthSec,
    ),
    pressureReversalAndStrictFlowEndShareAcceptedEndpoint: true,
    openingTargetOnePercentMinusCanonicalMvcSec: signedCyclicDeltaSec(
      canonical.cycleOffsetFromSelectedBeatStartSec,
      targetOnePercent.cycleOffsetFromSelectedBeatStartSec,
      cycleLengthSec,
    ),
    openingTargetZeroMinusCanonicalMvcSec: signedCyclicDeltaSec(
      canonical.cycleOffsetFromSelectedBeatStartSec,
      targetZero.cycleOffsetFromSelectedBeatStartSec,
      cycleLengthSec,
    ),
    leafletFiftyToOnePercentClosureWidthSec:
      leafletFifty === null || leafletOne === null
        ? null
        : cyclicDeltaSec(
            leafletFifty.cycleOffsetFromSelectedBeatStartSec,
            leafletOne.cycleOffsetFromSelectedBeatStartSec,
            cycleLengthSec,
          ),
    maximumOpeningTargetAfterFinalZeroBeforeAvo: maximumTargetAfterZeroToAvo,
    openingTargetReactivationAboveOnePercentAfterFinalZeroBeforeAvo:
      maximumTargetAfterZeroToAvo > 0.01,
    canonicalMvcToPressureReversalToAvoIdentityResidualSec:
      cyclicDeltaSec(
        canonical.cycleOffsetFromSelectedBeatStartSec,
        sampledBoundary(
          avoIndex,
          samples,
          dtSec,
          cycleLengthSec,
          preceding !== null,
        ).cycleOffsetFromSelectedBeatStartSec,
        cycleLengthSec,
      ) -
      mvcToPressure -
      pressureToAvo,
    pressureZeroCrossingReconstructionResidualMmHg: reconstructCrossingResidual(
      pressure,
      laMinusLv,
      preceding === null
        ? null
        : preceding.circulationNodeAbsolutePressureMmHg.LA -
            preceding.circulationNodeAbsolutePressureMmHg.LV,
      0,
    ),
  });
}

function snapshot(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  selectedEvent: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventSnapshotV1 {
  const sample = samples[selectedEvent.sampleIndex]!;
  const station = exact(sample);
  const la = sample.circulationNodeAbsolutePressureMmHg.LA;
  const lv = sample.circulationNodeAbsolutePressureMmHg.LV;
  const ao = sample.circulationNodeAbsolutePressureMmHg.Ao;
  const raw = lv - ao;
  return Object.freeze({
    event: selectedEvent,
    leftAtrialPressureMmHg: la,
    leftVentricularPressureMmHg: lv,
    aorticNodePressureMmHg: ao,
    proximalPortPressureMmHg:
      station.algebraicProximalConstitutivePortPressureMmHg,
    leftVentricularVolumeMl: sample.nodeVolumeMl.LV,
    mitralFlowMlPerSec: sample.valveHydraulics.MV.flowMlPerSec,
    aorticFlowMlPerSec: sample.valveHydraulics.AoV.flowMlPerSec,
    leftAtriumMinusLeftVentricleGradientMmHg: la - lv,
    rawLeftVentricleMinusAorticNodeGradientMmHg: raw,
    exactLocalLeftVentricleMinusProximalPortGradientMmHg:
      station.localValvePressureGradientMmHg,
    characteristicImpedancePressureMmHg:
      station.characteristicImpedancePressureMmHg,
    stationAdditivityResidualMmHg:
      raw -
      station.localValvePressureGradientMmHg -
      station.characteristicImpedancePressureMmHg,
    aorticOpeningTarget01: sample.valveHydraulics.AoV.openingTarget01,
    aorticLeafletOpeningFraction01: sample.valveOpeningFraction01.AoV,
  });
}

function pressureBuild(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  preceding: MainWireNormalAdultFiveWallDiagnosticSampleV2 | null,
  mvc: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventSnapshotV1,
  localBoundary: MainWireAorticOutflowV10EventBoundaryV1,
  dtSec: number,
  cycleLengthSec: number,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctPressureBuildV1 {
  const lvAtZero = interpolateAtBoundary(
    localBoundary,
    samples,
    preceding,
    (sample) => sample.circulationNodeAbsolutePressureMmHg.LV,
  );
  const portAtZero = interpolateAtBoundary(
    localBoundary,
    samples,
    preceding,
    (sample) => exact(sample).algebraicProximalConstitutivePortPressureMmHg,
  );
  const lvRise = lvAtZero - mvc.leftVentricularPressureMmHg;
  const portChange = portAtZero - mvc.proximalPortPressureMmHg;
  const deficit =
    mvc.proximalPortPressureMmHg - mvc.leftVentricularPressureMmHg;
  const duration = cyclicDeltaSec(
    endpointOffset(mvc.event.sampleIndex, dtSec, cycleLengthSec),
    localBoundary.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  return Object.freeze({
    mvcLocalPressureDeficitMmHg: deficit,
    mvcToLocalZeroCrossingSec: duration,
    interpolatedLeftVentricularPressureAtLocalZeroMmHg: lvAtZero,
    interpolatedProximalPortPressureAtLocalZeroMmHg: portAtZero,
    leftVentricularPressureRiseToLocalZeroMmHg: lvRise,
    proximalPortPressureChangeToLocalZeroMmHg: portChange,
    deficitClosureIdentityResidualMmHg: deficit - (lvRise - portChange),
    meanLeftVentricularPressureRiseRateMmHgPerSec:
      duration === 0 ? null : lvRise / duration,
    meanProximalPortPressureChangeRateMmHgPerSec:
      duration === 0 ? null : portChange / duration,
  });
}

function calciumPressureBuild(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  preceding: MainWireNormalAdultFiveWallDiagnosticSampleV2 | null,
  calciumBoundary: MainWireAorticOutflowV10EventBoundaryV1,
  localBoundary: MainWireAorticOutflowV10EventBoundaryV1,
  cycleLengthSec: number,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctCalciumPressureBuildV1 {
  const readLv = (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) =>
    sample.circulationNodeAbsolutePressureMmHg.LV;
  const readPort = (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) =>
    exact(sample).algebraicProximalConstitutivePortPressureMmHg;
  const initialLv = interpolateAtBoundary(
    calciumBoundary,
    samples,
    preceding,
    readLv,
  );
  const initialPort = interpolateAtBoundary(
    calciumBoundary,
    samples,
    preceding,
    readPort,
  );
  const lvAtZero = interpolateAtBoundary(
    localBoundary,
    samples,
    preceding,
    readLv,
  );
  const portAtZero = interpolateAtBoundary(
    localBoundary,
    samples,
    preceding,
    readPort,
  );
  const deficit = initialPort - initialLv;
  const lvRise = lvAtZero - initialLv;
  const portChange = portAtZero - initialPort;
  const duration = cyclicDeltaSec(
    calciumBoundary.cycleOffsetFromSelectedBeatStartSec,
    localBoundary.cycleOffsetFromSelectedBeatStartSec,
    cycleLengthSec,
  );
  return Object.freeze({
    startDefinition:
      "interpolated-ventricular-calcium-one-percent-rise" as const,
    stateInterpolation:
      "linear-between-boundary-bracketing-accepted-endpoint-states" as const,
    initialLeftVentricularPressureMmHg: initialLv,
    initialProximalPortPressureMmHg: initialPort,
    initialProximalPortMinusLeftVentricleDeficitMmHg: deficit,
    calciumRiseToLocalZeroCrossingSec: duration,
    interpolatedLeftVentricularPressureAtLocalZeroMmHg: lvAtZero,
    interpolatedProximalPortPressureAtLocalZeroMmHg: portAtZero,
    leftVentricularPressureRiseMmHg: lvRise,
    proximalPortPressureChangeMmHg: portChange,
    deficitClosureIdentityResidualMmHg: deficit - (lvRise - portChange),
    meanLeftVentricularPressureRiseRateMmHgPerSec:
      duration === 0 ? null : lvRise / duration,
    meanProximalPortPressureChangeRateMmHgPerSec:
      duration === 0 ? null : portChange / duration,
  });
}

function mitralReadback(
  flow: MitralFlow,
  diagnostics: MitralDiagnostics,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralFillingV1 {
  return Object.freeze({
    existingDiastolicFlowReadback: flow,
    cycleDiagnostics: diagnostics,
    fusedOrUnresolved: flow.waveSeparationStatus === "fused-or-unresolved",
    peakEToAIdentityResidual: ratioResidual(
      flow.peakEToARatio,
      flow.peakEFlowMlPerSec,
      flow.peakAFlowMlPerSec,
    ),
    forwardVolumeEToAIdentityResidual: ratioResidual(
      flow.forwardVolumeEToARatio,
      flow.eForwardVolumeMl,
      flow.aForwardVolumeMl,
    ),
    modeledVtiEToAIdentityResidual: ratioResidual(
      flow.modeledVtiEToARatio,
      flow.eModeledVtiCm,
      flow.aModeledVtiCm,
    ),
  });
}

function makeTrendPoint(
  heartRateBpm: number,
  ict: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctDecompositionV1,
  mitralClosure: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralClosureDefinitionsV1,
  pressure: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctPressureBuildV1,
  calciumPressure: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctCalciumPressureBuildV1,
  mitral: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMitralFillingV1,
  load: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLoadV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTrendPointV1 {
  const flow = mitral.existingDiastolicFlowReadback;
  return Object.freeze({
    heartRateBpm,
    canonicalIctSec: ict.canonicalFlowThresholdIctSec,
    mvcToCalciumRiseSignedSec: ict.mitralClosureToCalciumRiseSignedSec,
    calciumRiseToLocalGradientPositiveSec:
      ict.calciumRiseToExactLocalGradientPositiveSec,
    localGradientPositiveToStrictFlowSec:
      ict.exactLocalGradientPositiveToStrictPositiveFlowSec,
    strictFlowToOnePercentAvoSec:
      ict.strictPositiveFlowToCanonicalOnePercentAvoSec,
    calciumRiseToOnePercentAvoSec: ict.calciumRiseToCanonicalAvoSec,
    strictMitralFlowEndMinusCanonicalMvcSec:
      mitralClosure.strictFlowEndMinusCanonicalMvcSec,
    mitralPressureReversalMinusCanonicalMvcSec:
      mitralClosure.pressureReversalMinusCanonicalMvcSec,
    mitralOpeningTargetZeroMinusCanonicalMvcSec:
      mitralClosure.openingTargetZeroMinusCanonicalMvcSec,
    mitralLeafletFiftyPercentMinusCanonicalMvcSec:
      mitralClosure.leafletClosureSensitivity.fiftyPercent
        .crossingMinusCanonicalMvcSec,
    mitralLeafletTenPercentMinusCanonicalMvcSec:
      mitralClosure.leafletClosureSensitivity.tenPercent
        .crossingMinusCanonicalMvcSec,
    mitralLeafletOnePercentMinusCanonicalMvcSec:
      mitralClosure.leafletClosureSensitivity.onePercent
        .crossingMinusCanonicalMvcSec,
    mitralLeafletFiftyToOnePercentClosureWidthSec:
      mitralClosure.leafletFiftyToOnePercentClosureWidthSec,
    mvcLocalPressureDeficitMmHg: pressure.mvcLocalPressureDeficitMmHg,
    lvPressureRiseToLocalZeroMmHg:
      pressure.leftVentricularPressureRiseToLocalZeroMmHg,
    proximalPortPressureChangeToLocalZeroMmHg:
      pressure.proximalPortPressureChangeToLocalZeroMmHg,
    calciumRiseLocalPressureDeficitMmHg:
      calciumPressure.initialProximalPortMinusLeftVentricleDeficitMmHg,
    calciumRiseLvPressureRiseToLocalZeroMmHg:
      calciumPressure.leftVentricularPressureRiseMmHg,
    calciumRiseProximalPortPressureChangeToLocalZeroMmHg:
      calciumPressure.proximalPortPressureChangeMmHg,
    mitralPeakEToARatio: flow.peakEToARatio,
    mitralForwardVolumeEToARatio: flow.forwardVolumeEToARatio,
    mitralModeledVtiEToARatio: flow.modeledVtiEToARatio,
    mitralFusedOrUnresolved01: mitral.fusedOrUnresolved ? 1 : 0,
    strokeVolumeMl: load.strokeVolumeMl,
    peakAorticFlowMlPerSec: load.peakAorticFlowMlPerSec,
    meanDopplerGradientMmHg: load.meanDopplerGradientMmHg,
    meanAorticPressureMmHg: load.meanAorticPressureMmHg,
  });
}

function trendDelta(
  lower: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctArmV1,
  upper: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctArmV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctTrendDeltaV1 {
  const left = lower.trendPoint;
  const right = upper.trendPoint;
  const delta = <T extends keyof Omit<typeof left, "heartRateBpm">>(key: T) =>
    nullableDifference(right[key], left[key]);
  return Object.freeze({
    lowerHeartRateBpm: left.heartRateBpm,
    upperHeartRateBpm: right.heartRateBpm,
    upperMinusLower: Object.freeze({
      canonicalIctSec: delta("canonicalIctSec"),
      mvcToCalciumRiseSignedSec: delta("mvcToCalciumRiseSignedSec"),
      calciumRiseToLocalGradientPositiveSec: delta(
        "calciumRiseToLocalGradientPositiveSec",
      ),
      localGradientPositiveToStrictFlowSec: delta(
        "localGradientPositiveToStrictFlowSec",
      ),
      strictFlowToOnePercentAvoSec: delta("strictFlowToOnePercentAvoSec"),
      calciumRiseToOnePercentAvoSec: delta("calciumRiseToOnePercentAvoSec"),
      strictMitralFlowEndMinusCanonicalMvcSec: delta(
        "strictMitralFlowEndMinusCanonicalMvcSec",
      ),
      mitralPressureReversalMinusCanonicalMvcSec: delta(
        "mitralPressureReversalMinusCanonicalMvcSec",
      ),
      mitralOpeningTargetZeroMinusCanonicalMvcSec: delta(
        "mitralOpeningTargetZeroMinusCanonicalMvcSec",
      ),
      mitralLeafletFiftyPercentMinusCanonicalMvcSec: delta(
        "mitralLeafletFiftyPercentMinusCanonicalMvcSec",
      ),
      mitralLeafletTenPercentMinusCanonicalMvcSec: delta(
        "mitralLeafletTenPercentMinusCanonicalMvcSec",
      ),
      mitralLeafletOnePercentMinusCanonicalMvcSec: delta(
        "mitralLeafletOnePercentMinusCanonicalMvcSec",
      ),
      mitralLeafletFiftyToOnePercentClosureWidthSec: delta(
        "mitralLeafletFiftyToOnePercentClosureWidthSec",
      ),
      mvcLocalPressureDeficitMmHg: delta("mvcLocalPressureDeficitMmHg"),
      lvPressureRiseToLocalZeroMmHg: delta("lvPressureRiseToLocalZeroMmHg"),
      proximalPortPressureChangeToLocalZeroMmHg: delta(
        "proximalPortPressureChangeToLocalZeroMmHg",
      ),
      calciumRiseLocalPressureDeficitMmHg: delta(
        "calciumRiseLocalPressureDeficitMmHg",
      ),
      calciumRiseLvPressureRiseToLocalZeroMmHg: delta(
        "calciumRiseLvPressureRiseToLocalZeroMmHg",
      ),
      calciumRiseProximalPortPressureChangeToLocalZeroMmHg: delta(
        "calciumRiseProximalPortPressureChangeToLocalZeroMmHg",
      ),
      mitralPeakEToARatio: delta("mitralPeakEToARatio"),
      mitralForwardVolumeEToARatio: delta("mitralForwardVolumeEToARatio"),
      mitralModeledVtiEToARatio: delta("mitralModeledVtiEToARatio"),
      mitralFusedOrUnresolved01: delta("mitralFusedOrUnresolved01"),
      strokeVolumeMl: delta("strokeVolumeMl"),
      peakAorticFlowMlPerSec: delta("peakAorticFlowMlPerSec"),
      meanDopplerGradientMmHg: delta("meanDopplerGradientMmHg"),
      meanAorticPressureMmHg: delta("meanAorticPressureMmHg"),
    }),
  });
}

function validateIdentity(
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismInputV1,
): void {
  const { arm, calciumProfile: profile, calciumDriveParams: params } = input;
  const result = input.periodicResult;
  const mainIds =
    MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_PROFILE_IDS_V1 as readonly string[];
  if (!mainIds.includes(arm.armId)) {
    throw new Error(`unsupported saturating-law ICT arm: ${arm.armId}`);
  }
  const expectedArm =
    resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1(
      arm.armId,
    );
  const expectedProfile =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
      arm.calciumProfileId,
    );
  const expectedParams =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
      arm.calciumProfileId,
    );
  if (
    protocolHash(arm) !== protocolHash(expectedArm) ||
    arm.designRole !== "main-four-heart-rate-design" ||
    arm.dimensionlessRateCoefficient !==
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_COEFFICIENT_V1
  ) {
    throw new Error(`${arm.armId} arm catalog identity mismatch`);
  }
  if (
    protocolHash(profile) !== protocolHash(expectedProfile) ||
    profile.profileId !== arm.calciumProfileId
  ) {
    throw new Error(`${arm.armId} calcium profile identity mismatch`);
  }
  if (
    protocolHash(params) !== protocolHash(expectedParams) ||
    !nearlyEqual(params.cycleLengthSec, arm.cycleLengthSec)
  ) {
    throw new Error(`${arm.armId} calcium parameter identity mismatch`);
  }
  if (
    input.referenceNonCalciumAssembly !==
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1
  ) {
    throw new Error(`${arm.armId} reference assembly identity mismatch`);
  }
  if (
    result.protocolIdentity.calciumDrive.parameterSetId !==
      params.parameterSetId ||
    protocolHash(result.protocolIdentity) !== result.protocolIdentityHash ||
    protocolHash(params) !==
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
    !nearlyEqual(result.claim.heartRateBpm, arm.heartRateBpm) ||
    result.initialization !== "canonical"
  ) {
    throw new Error(`${arm.armId} periodic execution identity mismatch`);
  }
  if (
    result.valveResearchInput.valves.AoV.maximumForwardEoaCm2 !==
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1.aorticMaximumForwardEoaCm2
  ) {
    throw new Error(`${arm.armId} V10 aortic EOA identity mismatch`);
  }
}

function primaryEpisode(
  active: readonly boolean[],
  requiredIndex: number,
): PrimaryEpisode {
  if (!active[requiredIndex] || active.every(Boolean)) {
    throw new Error("primary event episode lacks a valid Qpeak bracket");
  }
  let openingIndex = requiredIndex;
  while (active[(openingIndex - 1 + active.length) % active.length]) {
    openingIndex = (openingIndex - 1 + active.length) % active.length;
  }
  let closingIndex = openingIndex;
  let activeSampleCount = 0;
  while (active[closingIndex] && activeSampleCount < active.length) {
    activeSampleCount += 1;
    closingIndex = (closingIndex + 1) % active.length;
  }
  const totalActiveSampleCount = active.filter(Boolean).length;
  const cyclicEpisodeCount = active.reduce((count, current, index) => {
    const previous = active[(index - 1 + active.length) % active.length]!;
    return count + (current && !previous ? 1 : 0);
  }, 0);
  return Object.freeze({
    openingIndex,
    closingIndex,
    audit: Object.freeze({
      cyclicEpisodeCount,
      totalActiveSampleCount,
      primaryEpisodeActiveSampleCount: activeSampleCount,
      extraActiveSampleCountOutsidePrimaryEpisode:
        totalActiveSampleCount - activeSampleCount,
      primaryOpeningSampleIndex: openingIndex,
      primaryClosingSampleIndex: closingIndex,
      primaryContainsGlobalPositiveFlowPeak: true,
    }),
  });
}

function sampledBoundary(
  sampleIndex: number,
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  dtSec: number,
  cycleLengthSec: number,
  precedingAvailable: boolean,
): MainWireAorticOutflowV10EventBoundaryV1 {
  return Object.freeze({
    cycleOffsetFromSelectedBeatStartSec: endpointOffset(
      sampleIndex,
      dtSec,
      cycleLengthSec,
    ),
    cyclePhase01: samples[sampleIndex]!.cyclePhase01,
    boundaryMethod: "accepted-sample-endpoint" as const,
    previousAcceptedSampleIndex: sampleIndex === 0 ? null : sampleIndex - 1,
    currentAcceptedSampleIndex: sampleIndex,
    interpolationFractionFromPreviousToCurrent01: 1,
    previousEndpointSource:
      sampleIndex === 0
        ? precedingAvailable
          ? "preceding-retained-beat-last-sample"
          : "selected-beat-start-boundary-without-readback"
        : "selected-beat-sample",
  });
}

function linearBoundary(
  transition: "opening" | "closing",
  currentIndex: number,
  values: readonly number[],
  precedingValue: number | null,
  threshold: number,
  dtSec: number,
  cycleLengthSec: number,
): MainWireAorticOutflowV10EventBoundaryV1 {
  const previousIndex = (currentIndex - 1 + values.length) % values.length;
  const usePreceding = currentIndex === 0 && precedingValue !== null;
  const previous = usePreceding ? precedingValue : values[previousIndex]!;
  const current = values[currentIndex]!;
  if (
    (transition === "opening" &&
      !(previous < threshold && current >= threshold)) ||
    (transition === "closing" &&
      !(previous > threshold && current <= threshold))
  ) {
    throw new Error(`${transition} boundary does not bracket threshold`);
  }
  const fraction = (threshold - previous) / (current - previous);
  const previousOffset =
    currentIndex === 0 ? cycleLengthSec : currentIndex * dtSec;
  const offset = normalizeOffset(
    previousOffset + fraction * dtSec,
    cycleLengthSec,
  );
  return Object.freeze({
    cycleOffsetFromSelectedBeatStartSec: offset,
    cyclePhase01: offset / cycleLengthSec,
    boundaryMethod: "linear-zero-crossing-between-accepted-endpoints" as const,
    previousAcceptedSampleIndex: usePreceding ? null : previousIndex,
    currentAcceptedSampleIndex: currentIndex,
    interpolationFractionFromPreviousToCurrent01: fraction,
    previousEndpointSource: usePreceding
      ? "preceding-retained-beat-last-sample"
      : currentIndex === 0
        ? "selected-beat-periodic-endpoint-surrogate"
        : "selected-beat-sample",
  });
}

function reconstructCrossingResidual(
  boundary: MainWireAorticOutflowV10EventBoundaryV1,
  values: readonly number[],
  precedingValue: number | null,
  threshold: number,
): number {
  const current = values[boundary.currentAcceptedSampleIndex]!;
  const previous =
    boundary.previousAcceptedSampleIndex === null
      ? (precedingValue ?? values.at(-1)!)
      : values[boundary.previousAcceptedSampleIndex]!;
  return (
    previous +
    boundary.interpolationFractionFromPreviousToCurrent01 *
      (current - previous) -
    threshold
  );
}

function signedBoundaryDeltaSec(
  from: MainWireAorticOutflowV10EventBoundaryV1,
  to: MainWireAorticOutflowV10EventBoundaryV1 | null,
  cycleLengthSec: number,
): number | null {
  return to === null
    ? null
    : signedCyclicDeltaSec(
        from.cycleOffsetFromSelectedBeatStartSec,
        to.cycleOffsetFromSelectedBeatStartSec,
        cycleLengthSec,
      );
}

function finalInactiveAfterActiveRun(
  active: readonly boolean[],
  startIndex: number,
  stopIndex: number,
): number {
  let cursor = stopIndex;
  for (let guard = 0; guard < active.length; guard += 1) {
    const previous = (cursor - 1 + active.length) % active.length;
    if (!active[cursor] && active[previous]) return cursor;
    if (cursor === startIndex) break;
    cursor = previous;
  }
  throw new Error(
    "final strict mitral positive-flow episode end was not found",
  );
}

function firstDownwardCrossingIndex(
  values: readonly number[],
  startIndex: number,
  stopIndex: number,
  threshold = 0,
): number {
  const index = firstDownwardCrossingIndexOrNull(
    values,
    startIndex,
    stopIndex,
    threshold,
  );
  if (index !== null) return index;
  throw new Error(`downward crossing of ${threshold} was not found`);
}

function firstDownwardCrossingIndexOrNull(
  values: readonly number[],
  startIndex: number,
  stopIndex: number,
  threshold = 0,
): number | null {
  let cursor = startIndex;
  for (let guard = 0; guard < values.length; guard += 1) {
    const previous = values[(cursor - 1 + values.length) % values.length]!;
    if (previous > threshold && values[cursor]! <= threshold) return cursor;
    if (cursor === stopIndex) break;
    cursor = (cursor + 1) % values.length;
  }
  return null;
}

function lastDownwardCrossingIndex(
  values: readonly number[],
  startIndex: number,
  stopIndex: number,
  threshold = 0,
): number {
  let last: number | null = null;
  let cursor = startIndex;
  for (let guard = 0; guard < values.length; guard += 1) {
    const previous = values[(cursor - 1 + values.length) % values.length]!;
    if (previous > threshold && values[cursor]! <= threshold) last = cursor;
    if (cursor === stopIndex) break;
    cursor = (cursor + 1) % values.length;
  }
  if (last !== null) return last;
  throw new Error(`final downward crossing of ${threshold} was not found`);
}

function interpolateAtBoundary(
  boundary: MainWireAorticOutflowV10EventBoundaryV1,
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  preceding: MainWireNormalAdultFiveWallDiagnosticSampleV2 | null,
  read: (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) => number,
): number {
  const current = samples[boundary.currentAcceptedSampleIndex]!;
  const previous =
    boundary.previousAcceptedSampleIndex === null
      ? (preceding ?? samples.at(-1)!)
      : samples[boundary.previousAcceptedSampleIndex]!;
  return (
    read(previous) +
    boundary.interpolationFractionFromPreviousToCurrent01 *
      (read(current) - read(previous))
  );
}

function event(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  sampleIndex: number,
  beatStartTimeSec: number,
  definition: string,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctEventV1 {
  const sample = samples[sampleIndex]!;
  return Object.freeze({
    sampleIndex,
    phase01: sample.cyclePhase01,
    timeSec: sample.timeSec,
    timeFromSelectedBeatStartSec: sample.timeSec - beatStartTimeSec,
    definition,
  });
}

function exact(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
): NonNullable<
  MainWireNormalAdultFiveWallDiagnosticSampleV2["valveHydraulics"]["AoV"]["recoveredRootPortExactReadback"]
> {
  const value = sample.valveHydraulics.AoV.recoveredRootPortExactReadback;
  if (value === undefined)
    throw new Error("exact AoV port readback is required");
  return value;
}

function ratioResidual(
  reported: number | null,
  numerator: number | null,
  denominator: number | null,
): number | null {
  return reported === null ||
    numerator === null ||
    denominator === null ||
    denominator === 0
    ? null
    : reported - numerator / denominator;
}

function nullableDifference(
  upper: number | null,
  lower: number | null,
): number | null {
  return upper === null || lower === null ? null : upper - lower;
}

function maximumIndex(values: readonly number[]): number {
  return values.indexOf(Math.max(...values));
}

function cyclicSlice(
  values: readonly number[],
  startIndex: number,
  endIndex: number,
): readonly number[] {
  const selected: number[] = [];
  let cursor = startIndex;
  for (let guard = 0; guard < values.length; guard += 1) {
    selected.push(values[cursor]!);
    if (cursor === endIndex) return Object.freeze(selected);
    cursor = (cursor + 1) % values.length;
  }
  throw new Error("cyclic slice did not reach its end index");
}

function endpointOffset(
  sampleIndex: number,
  dtSec: number,
  cycleLengthSec: number,
): number {
  return normalizeOffset((sampleIndex + 1) * dtSec, cycleLengthSec);
}

function cyclicDeltaSec(
  from: number,
  to: number,
  cycleLengthSec: number,
): number {
  return normalizeOffset(to - from, cycleLengthSec);
}

function signedCyclicDeltaSec(
  from: number,
  to: number,
  cycleLengthSec: number,
): number {
  const forward = cyclicDeltaSec(from, to, cycleLengthSec);
  return forward <= cycleLengthSec / 2 ? forward : forward - cycleLengthSec;
}

function normalizeOffset(value: number, cycleLengthSec: number): number {
  return ((value % cycleLengthSec) + cycleLengthSec) % cycleLengthSec;
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
