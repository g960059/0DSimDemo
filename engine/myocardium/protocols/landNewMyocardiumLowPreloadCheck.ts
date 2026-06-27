import protocolDescriptor from "@/data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-protocols.json";
import {
  ActiveStressChamberModel,
  defaultActiveLV,
  type ChamberCtx,
  type ChamberInternal,
  type ChamberInternalDerivatives,
} from "@/engine/chambers";
import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
  stepPrescribedCalciumTransientV1,
} from "@/engine/myocardium/calcium";
import {
  IDENTITY_FIBER_NOMINAL_V1_ID,
  IDENTITY_FIBER_NOMINAL_V1_PARAMS,
  IdentityFiberNominalV1,
} from "@/engine/myocardium/homogenization";
import {
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
  computeThickSphereV2SelectedParameterSetStableHash,
  evaluateThickSphereV2SelectedBackend,
} from "@/engine/myocardium/kinematics";
import type { MyocardialKinematicsOutput } from "@/engine/myocardium/kinematics/contracts";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
  PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
  VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
  evaluatePassiveExponentialEnergyV1,
  evaluateVirtualPowerGeneralizedForceV1,
} from "@/engine/myocardium/mechanics";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  solveLand2017BackwardEulerSubsteps,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";
import {
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID,
  runLocalMonolithicCouplingReadinessReport,
} from "@/engine/myocardium/protocols/localMonolithicCouplingReadiness";
import {
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID,
  runLocalMonolithicSdirk2ReadinessReport,
} from "@/engine/myocardium/protocols/localMonolithicSdirk2Readiness";
import {
  LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
  type LandShadowLegacyProtocolEvidence,
  type LandShadowPolicyDescriptor,
} from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";

export const LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID =
  "land-new-myocardium-low-preload-phase5c-protocols-v1";
export const LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE = "Phase 5C-C";
export const LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY =
  "standalone-new-myocardium-low-preload-check-artifact-only";
export const PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID =
  "phase5c-c-standalone-preload-afterload-surrogate-v1";

const LEGACY_POSITIVE_CONTROL_PROVIDER_ID =
  "legacy-activeStress-positive-control" as const;
const LAND_NEW_MYOCARDIUM_PROVIDER_ID = "land2017-new-myocardium" as const;

const LEGACY_ADJACENT_DELTA_MIN = 0.1;
const LEGACY_PERIOD_DELTA_MAX = 0.05;
const TBV_CLEAN_TOLERANCE_ML = 0.05;
const REVERSE_VOLUME_NON_PROBLEMATIC_MAX_ML = 0.05;
const LEGACY_ACTIVE_STRESS_LV_EDV_REF_ML = 115;
const LEGACY_ACTIVE_STRESS_LV_ESV_REF_ML = 45;
const LEGACY_ACTIVE_STRESS_LV_TMAX_SCALE = 0.7;
const LEGACY_ACTIVE_STRESS_CONTEXT_ID =
  "ActiveStressChamberModel.defaultActiveLV.baseline-context-v1";
const DEFAULT_INITIAL_LAND_STATE = [0.18, 0.22, 0.04, 0.02, 0, 0] as const;
const DEFAULT_INITIAL_CALCIUM_STATE = [0, 0] as const;
const PA_TO_MMHG = 1 / 133.32236842105263;
const LEGACY_ACTIVE_STRESS_MODEL = new ActiveStressChamberModel({
  ...defaultActiveLV,
  reservoirBranchGain: 0,
  reservoirStrokeMl: 0,
});

export type LandNewMyocardiumSourceProviderId =
  | typeof LEGACY_POSITIVE_CONTROL_PROVIDER_ID
  | typeof LAND_NEW_MYOCARDIUM_PROVIDER_ID;

export type LandNewMyocardiumLowPreloadCheckStatus =
  | "land-new-myocardium-low-preload-check-ready"
  | "land-new-myocardium-low-preload-check-review";

export type LandNewMyocardiumSectionStatus = "readiness-pass" | "readiness-fail";

export type LandNewMyocardiumSection = {
  readonly id: string;
  readonly status: LandNewMyocardiumSectionStatus;
  readonly metrics: Record<string, unknown>;
};

export type LandNewMyocardiumLowPreloadCheckInput = {
  readonly legacyProtocol: LandShadowLegacyProtocolEvidence;
  readonly alternansPolicyDescriptor: LandShadowPolicyDescriptor;
};

export type LandNewMyocardiumLegacyReproductionEvidence = {
  readonly status: "read-only-present-pinned" | "read-only-missing-or-drifted";
  readonly sourcePhase: "Phase 5C-A";
  readonly sourceStatus: "feedforward-shadow-replay-not-new-myocardium-check";
  readonly fixedProtocolPass: boolean;
  readonly reproductionPass: boolean;
  readonly requiredSettled: true;
  readonly requiredPeriodBeats: 2;
  readonly requiredAdjacentDeltaGreaterThan: typeof LEGACY_ADJACENT_DELTA_MIN;
  readonly requiredPeriodDeltaLessThan: typeof LEGACY_PERIOD_DELTA_MAX;
  readonly requiredTbvCleanToleranceMl: typeof TBV_CLEAN_TOLERANCE_ML;
  readonly requiredValveReverseMaxMl: typeof REVERSE_VOLUME_NON_PROBLEMATIC_MAX_ML;
  readonly observed: LandShadowLegacyProtocolEvidence;
  readonly pass: boolean;
};

export type LandNewMyocardiumReadOnlyPins = {
  readonly phase5A: {
    readonly reusePolicy: "read-only";
    readonly protocolSetId: typeof LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID;
    readonly readinessPass: boolean;
    readonly stableSummaryHash: string;
    readonly stableHashFormatPass: boolean;
  };
  readonly phase5B: {
    readonly reusePolicy: "read-only";
    readonly protocolSetId: typeof LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID;
    readonly readinessPass: boolean;
    readonly stableSummaryHash: string;
    readonly localReferenceStableSummaryHash: string;
    readonly beFallbackStableSummaryHash: string;
    readonly phase5BReadOnlySdirk2Status:
      "solver-reference-available-not-same-protocol";
    readonly sameProtocolAgreementClaim: "not-claimed";
    readonly stableHashFormatPass: boolean;
  };
  readonly pass: boolean;
};

export type LandNewMyocardiumClosureConfig = {
  readonly closureModelId: typeof PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID;
  readonly closureEquivalenceToModelCore: "not-claimed";
  readonly fixedLowPreloadProtocol: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL;
  readonly cycleLengthSec: number;
  readonly generatedBeatCount: number;
  readonly primaryReportWindowBeats: 4;
  readonly branchMetricDefinitionsId:
    "phase5c-c-low-preload-branch-metrics-v1";
  readonly branchMetricNames: readonly string[];
  readonly selectedLvParameterSetId:
    typeof THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetId;
  readonly afterloadModelId:
    "phase3c-d0-derived-two-element-afterload-surrogate-v1";
  readonly preloadModelId: "fixed-low-preload-reservoir-source-v1";
  readonly preloadReservoirPressurePa: number;
  readonly afterloadRunoffPressurePa: number;
  readonly initialAfterloadPressurePa: number;
  readonly inletConductanceM3PerSecPa: number;
  readonly outletConductanceM3PerSecPa: number;
  readonly diodeSmoothingPressurePa: number;
  readonly afterloadComplianceM3PerPa: number;
  readonly afterloadRunoffResistancePaSecPerM3: number;
  readonly useTBVProjectionAfterInitialization: false;
  readonly usePressureFloor: false;
  readonly useQDotCap: false;
  readonly usePhase5CALegacyVlvTraceForGeneratedRuns: false;
  readonly useLegacyStressTraceReplay: false;
  readonly useRvOrInterdependence: false;
};

export type LandNewMyocardiumInitialState = {
  readonly initialCavityVolumeM3: number;
  readonly initialAfterloadPressurePa: number;
  readonly initialCalciumState: readonly number[];
  readonly initialClosureStateOnly: true;
  readonly sourceProviderStateExcludedFromSharedInitialHash:
    "provider-identity-is-the-only-runtime-difference";
};

export type LandNewMyocardiumRunHashes = {
  readonly closureConfigStableHash: string;
  readonly initialStateStableHash: string;
  readonly branchMetricDefinitionsStableHash: string;
};

export type LandNewMyocardiumEventSurfaces = {
  readonly pressureFloorUse: false;
  readonly tbvProjectionUse: false;
  readonly tbvProjectionEquivalentMl: number;
  readonly outletReverseVolumeEquivalentMl: number;
  readonly inletReverseVolumeEquivalentMl: number;
  readonly maxReverseVolumeEquivalentMl: number;
  readonly qDotCapStatus: "not-used";
  readonly qDotCapStatusIfIntroduced: "artifact-only-not-modelcore";
  readonly sourceProviderId: LandNewMyocardiumSourceProviderId;
};

export type LandNewMyocardiumSourceProviderProvenance = {
  readonly sourceProviderId: LandNewMyocardiumSourceProviderId;
  readonly equationSource:
    | "engine/chambers.ts:ActiveStressChamberModel"
    | "engine/myocardium/myofilament/land2017";
  readonly parameterSource:
    | "defaultActiveLV"
    | typeof LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID;
  readonly stateSemantics:
    | "legacy-ChamberInternal-c-a-r-tensionPa-lambdaAct"
    | "Land2017-state-vector";
  readonly kinematicsInput:
    | "surrogate-generated-selected-v2-LV-volume-and-fiber-kinematics"
    | "surrogate-generated-selected-v2-fiber-strain";
  readonly activationInput:
    | "surrogate-generated-cycle-phase-activeStress-release"
    | "surrogate-prescribed-calcium-transient";
  readonly contextId: string;
  readonly artifactEquationImportOnly: boolean;
  readonly usesModelCoreRuntimeWiring: false;
  readonly usesChamberRuntimeWiring: false;
  readonly hardCodedBeatParityForcing: false;
  readonly consumesPrerecordedTraceReplay: false;
};

export type LandNewMyocardiumBeatMetric = {
  readonly beat: number;
  readonly sampleCount: number;
  readonly edvMl: number;
  readonly esvMl: number;
  readonly strokeVolumeMl: number;
  readonly qAoPeakMlPerSec: number;
  readonly qAoForwardVolumeMl: number;
  readonly qAoReverseVolumeMl: number;
  readonly aopPeakPa: number;
  readonly aopMeanPa: number;
  readonly lvpPeakPa: number;
  readonly lvpMinPa: number;
  readonly strokeWorkJ: number;
  readonly peakSourceActiveFiberStressPa: number;
  readonly finiteHealth: boolean;
  readonly selectedDomainCoverage: boolean;
  readonly deterministicHash: string;
};

export type LandNewMyocardiumBranchBehavior = {
  readonly settled: boolean;
  readonly settlingStatus: "settled-period-2" | "settled-period-1" | "not-settled-reported";
  readonly periodBeats: 1 | 2 | 0;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly adjacentDeltaThreshold: typeof LEGACY_ADJACENT_DELTA_MIN;
  readonly periodDeltaThreshold: typeof LEGACY_PERIOD_DELTA_MAX;
  readonly returnMapEvidenceStatus: "report-only-not-acceptance";
  readonly beatWindow: readonly LandNewMyocardiumBeatMetric[];
  readonly branchMetricDefinitionsId:
    "phase5c-c-low-preload-branch-metrics-v1";
  readonly branchMetricDefinitionsStableHash: string;
};

export type LandNewMyocardiumMorphologyMetrics = {
  readonly fwhmMs: number;
  readonly timeToPeakMs: number;
  readonly relaxationTauMs: number;
  readonly caToStressPeakDelayMs: number;
  readonly peakStressPa: number;
  readonly strokeWorkJ: number;
  readonly lvpPeak: number;
  readonly lvpMin: number;
  readonly aopPeak: number;
  readonly aopMean: number;
  readonly lvpAopPeakGap: number;
  readonly lvpAopPeakLagMs: number;
  readonly ejectionDurationMs: number;
  readonly qAoForwardVolumeMl: number;
  readonly qAoReverseVolumeMl: number;
  readonly qAoPeak: number;
};

export type LandNewMyocardiumMorphologyEvidence = {
  readonly morphologyEvidenceStatus: "reported-not-official";
  readonly officialMorphologyGateStatus: "not-wired";
  readonly officialMorphologyPass: "not-claimed";
  readonly metrics: LandNewMyocardiumMorphologyMetrics;
  readonly finiteMetricSet: boolean;
  readonly interpretation:
    "report-only-may-be-bad-does-not-control-artifact-gate";
};

export type LandNewMyocardiumGeneratedRun = {
  readonly sourceProviderId: LandNewMyocardiumSourceProviderId;
  readonly sourceProviderRole: "positive-control" | "new-myocardium-run";
  readonly generatedTrajectoryStatus:
    | "generated-own-trajectory"
    | "generated-own-trajectory-finite"
    | "generation-failed";
  readonly trajectoryGenerationPolicy: {
    readonly generatesOwnVlvTrajectory: true;
    readonly consumesPhase5CALegacyVlvTrace: false;
    readonly consumesLegacyActiveStressTimeSeries: false;
    readonly consumesLegacyPressureTrace: false;
    readonly consumesLegacyFlowTrace: false;
    readonly consumesLegacyCoTrace: false;
    readonly consumesLegacyBranchLabels: false;
    readonly consumesRunLowPreloadDebugOutput: false;
    readonly noPrerecordedStressOrTraceReplay: true;
  };
  readonly hashes: LandNewMyocardiumRunHashes;
  readonly eventSurfaces: LandNewMyocardiumEventSurfaces;
  readonly branchBehavior: LandNewMyocardiumBranchBehavior;
  readonly morphology: LandNewMyocardiumMorphologyEvidence;
  readonly finiteStateHealth: boolean;
  readonly selectedDomainCoverageFinite: boolean;
  readonly pressureFloorUsedAny: false;
  readonly tbvProjectionUsedAny: false;
  readonly sourceProviderProvenance: LandNewMyocardiumSourceProviderProvenance;
  readonly sourceProviderStableHash: string;
  readonly trajectoryStableHash: string;
};

export type LandNewMyocardiumSameClosureEvidence = {
  readonly positiveControlSourceProviderId:
    typeof LEGACY_POSITIVE_CONTROL_PROVIDER_ID;
  readonly landSourceProviderId: typeof LAND_NEW_MYOCARDIUM_PROVIDER_ID;
  readonly closureConfigStableHash: string;
  readonly positiveControlClosureConfigStableHash: string;
  readonly landClosureConfigStableHash: string;
  readonly initialStateStableHash: string;
  readonly positiveControlInitialStateStableHash: string;
  readonly landInitialStateStableHash: string;
  readonly branchMetricDefinitionsStableHash: string;
  readonly sourceProviderDifferenceOnly: boolean;
  readonly pass: boolean;
};

export type LandNewMyocardiumPolicyBoundary = {
  readonly policyPath: "data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json";
  readonly policyId: "layer-consistency-and-alternans-policy-v1" | "missing-or-unexpected";
  readonly legacyReproductionRequired: boolean;
  readonly newMyocardiumCheckRequired: boolean;
  readonly secondOrderReferenceRequired: boolean;
  readonly legacyReproductionStatus:
    LandNewMyocardiumLegacyReproductionEvidence["status"];
  readonly legacyPositiveControlStatus:
    | "period-2-positive-control-pass"
    | "positive-control-failed";
  readonly newMyocardiumCheckStatus:
    | "performed-be-smoke-not-final"
    | "attempted-not-satisfied"
    | "not-performed-positive-control-failed";
  readonly newMyocardiumCheckRequiredSatisfied: false;
  readonly secondOrderSameProtocolStatus: "not-performed";
  readonly finalNoAlternansClaim: "not-claimed";
  readonly pass: boolean;
};

export type LandNewMyocardiumLowPreloadCheckReport = {
  readonly protocolSetId: typeof LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID;
  readonly phase: typeof LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE;
  readonly claimBoundary: typeof LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY;
  readonly closureModelId: typeof PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID;
  readonly closureEquivalenceToModelCore: "not-claimed";
  readonly readinessStatus: LandNewMyocardiumLowPreloadCheckStatus;
  readonly productionRuntimeStatus: "not-live-runtime-replacement";
  readonly selectedModelIds: {
    readonly selectedBackendId: typeof THICK_SPHERE_V2_SELECTED_BACKEND_ID;
    readonly selectedCandidateId: typeof THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID;
    readonly lvParameterSetId: typeof THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetId;
    readonly lvParameterSetStableHash: string;
    readonly rvParameterSetId: typeof THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetId;
    readonly rvParameterSetStableHash: string;
    readonly rvRuntimeStatus: "read-only-not-run";
    readonly calciumParameterSetId: typeof PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID;
    readonly landParameterSetId: typeof LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID;
    readonly homogenizationModelId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
    readonly passiveModelId: typeof PASSIVE_EXPONENTIAL_ENERGY_V1_ID;
    readonly generalizedForceMapperId: typeof VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID;
  };
  readonly fixedLowPreloadProtocol: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL;
  readonly closureConfig: LandNewMyocardiumClosureConfig;
  readonly initialState: LandNewMyocardiumInitialState;
  readonly legacyReproduction: LandNewMyocardiumLegacyReproductionEvidence;
  readonly readOnlyPins: LandNewMyocardiumReadOnlyPins;
  readonly sameClosureEvidence: LandNewMyocardiumSameClosureEvidence;
  readonly legacyPositiveControl: LandNewMyocardiumGeneratedRun;
  readonly landNewMyocardiumRun: LandNewMyocardiumGeneratedRun;
  readonly policyBoundary: LandNewMyocardiumPolicyBoundary;
  readonly morphologyEvidenceStatus: "reported-not-official";
  readonly officialMorphologyGateStatus: "not-wired";
  readonly newMyocardiumCheckRequiredSatisfied: false;
  readonly secondOrderSameProtocolStatus: "not-performed";
  readonly phase5BReadOnlySdirk2Status:
    "solver-reference-available-not-same-protocol";
  readonly finalNoAlternansClaim: "not-claimed";
  readonly futureScope: {
    readonly rvPressureOverloadCoverage: "not-covered";
    readonly septalBowingCoverage: "not-covered";
    readonly ventricularInterdependenceCoverage: "not-covered";
    readonly rightHeartFailureCoverage: "not-covered";
    readonly triSegAdoption: "not-claimed";
  };
  readonly sections: readonly LandNewMyocardiumSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

type SurrogateSample = {
  readonly beat: number;
  readonly phase01: number;
  readonly timeSec: number;
  readonly vlvMl: number;
  readonly lvpPa: number;
  readonly aopPa: number;
  readonly qAoMlPerSec: number;
  readonly qInMlPerSec: number;
  readonly freeCalciumUM: number;
  readonly sourceActiveFiberStressPa: number;
  readonly kinematicsFinite: boolean;
  readonly selectedDomainCoverage: boolean;
  readonly sourceFiniteHealth: boolean;
  readonly solverResidualNorm: number;
};

type SurrogateRunInternal = {
  readonly run: LandNewMyocardiumGeneratedRun;
  readonly samples: readonly SurrogateSample[];
};

type SourceProviderState =
  | {
    readonly kind: typeof LEGACY_POSITIVE_CONTROL_PROVIDER_ID;
    readonly internal: ChamberInternal;
  }
  | {
    readonly kind: typeof LAND_NEW_MYOCARDIUM_PROVIDER_ID;
    landState: Float64Array;
    previousFreeCalciumUM: number | undefined;
  };

type SourceEvaluation = {
  readonly output: LandSourceOutput;
  readonly nextState: SourceProviderState;
  readonly solverResidualNorm: number;
  readonly ok: boolean;
};

const BRANCH_METRIC_NAMES = Object.freeze([
  "periodBeats",
  "adjacentDelta",
  "periodDelta",
  "edvMl",
  "esvMl",
  "strokeVolumeMl",
  "qAoPeakMlPerSec",
  "aopPeakPa",
  "aopMeanPa",
  "lvpPeakPa",
  "lvpMinPa",
  "strokeWorkJ",
] as const);

export const PHASE5C_C_BRANCH_METRIC_DEFINITIONS = Object.freeze({
  id: "phase5c-c-low-preload-branch-metrics-v1",
  beatWindow: "last-four-generated-beats",
  acceptance: "period-aware-no-return-map-acceptance",
  metrics: BRANCH_METRIC_NAMES,
});

export const PHASE5C_C_CLOSURE_CONFIG: LandNewMyocardiumClosureConfig =
  Object.freeze({
    closureModelId: PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID,
    closureEquivalenceToModelCore: "not-claimed",
    fixedLowPreloadProtocol: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    cycleLengthSec: 0.8,
    generatedBeatCount: 28,
    primaryReportWindowBeats: 4,
    branchMetricDefinitionsId: "phase5c-c-low-preload-branch-metrics-v1",
    branchMetricNames: BRANCH_METRIC_NAMES,
    selectedLvParameterSetId: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetId,
    afterloadModelId: "phase3c-d0-derived-two-element-afterload-surrogate-v1",
    preloadModelId: "fixed-low-preload-reservoir-source-v1",
    preloadReservoirPressurePa: 2600,
    afterloadRunoffPressurePa: 3600,
    initialAfterloadPressurePa: 4200,
    inletConductanceM3PerSecPa: 5.0e-9,
    outletConductanceM3PerSecPa: 7.2e-9,
    diodeSmoothingPressurePa: 80,
    afterloadComplianceM3PerPa: 1.45e-8,
    afterloadRunoffResistancePaSecPerM3: 2.2e8,
    useTBVProjectionAfterInitialization: false,
    usePressureFloor: false,
    useQDotCap: false,
    usePhase5CALegacyVlvTraceForGeneratedRuns: false,
    useLegacyStressTraceReplay: false,
    useRvOrInterdependence: false,
  });

export const PHASE5C_C_INITIAL_STATE: LandNewMyocardiumInitialState =
  Object.freeze({
    initialCavityVolumeM3: 9.2e-5,
    initialAfterloadPressurePa: PHASE5C_C_CLOSURE_CONFIG.initialAfterloadPressurePa,
    initialCalciumState: DEFAULT_INITIAL_CALCIUM_STATE,
    initialClosureStateOnly: true,
    sourceProviderStateExcludedFromSharedInitialHash:
      "provider-identity-is-the-only-runtime-difference",
  });

export function runLandNewMyocardiumLowPreloadCheckReport(
  input: LandNewMyocardiumLowPreloadCheckInput,
): LandNewMyocardiumLowPreloadCheckReport {
  const legacyReproduction = buildLegacyReproduction(input.legacyProtocol);
  const readOnlyPins = buildReadOnlyPins();
  const positiveControl = runGeneratedSurrogate(LEGACY_POSITIVE_CONTROL_PROVIDER_ID);
  const landRun = runGeneratedSurrogate(LAND_NEW_MYOCARDIUM_PROVIDER_ID);
  const sameClosureEvidence = buildSameClosureEvidence(positiveControl.run, landRun.run);
  const policyBoundary = buildPolicyBoundary(
    input.alternansPolicyDescriptor,
    legacyReproduction,
    positiveControl.run,
    landRun.run,
  );
  const sections = [
    boundarySection(),
    legacyReproductionSection(legacyReproduction),
    sameClosureSection(sameClosureEvidence),
    positiveControlSection(positiveControl.run),
    landGeneratedTrajectorySection(landRun.run),
    reportOnlyMorphologySection(landRun.run.morphology),
    policyBoundarySection(policyBoundary),
    readOnlyPinsSection(readOnlyPins),
    runtimeIsolationSection(),
    deterministicSection(positiveControl.run, landRun.run),
  ] as const;
  const readinessPass = sections.every((section) => section.status === "readiness-pass");
  const reportWithoutHash = {
    protocolSetId: LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID,
    phase: LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE,
    claimBoundary: LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY,
    closureModelId: PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID,
    closureEquivalenceToModelCore: "not-claimed",
    readinessStatus:
      readinessPass
        ? "land-new-myocardium-low-preload-check-ready"
        : "land-new-myocardium-low-preload-check-review",
    productionRuntimeStatus: "not-live-runtime-replacement",
    selectedModelIds: {
      selectedBackendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
      selectedCandidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
      lvParameterSetId: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetId,
      lvParameterSetStableHash:
        computeThickSphereV2SelectedParameterSetStableHash(
          THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
        ),
      rvParameterSetId: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetId,
      rvParameterSetStableHash:
        computeThickSphereV2SelectedParameterSetStableHash(
          THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
        ),
      rvRuntimeStatus: "read-only-not-run",
      calciumParameterSetId: PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
      landParameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
      homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
      passiveModelId: PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
      generalizedForceMapperId: VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
    },
    fixedLowPreloadProtocol: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    closureConfig: PHASE5C_C_CLOSURE_CONFIG,
    initialState: PHASE5C_C_INITIAL_STATE,
    legacyReproduction,
    readOnlyPins,
    sameClosureEvidence,
    legacyPositiveControl: positiveControl.run,
    landNewMyocardiumRun: landRun.run,
    policyBoundary,
    morphologyEvidenceStatus: "reported-not-official",
    officialMorphologyGateStatus: "not-wired",
    newMyocardiumCheckRequiredSatisfied: false,
    secondOrderSameProtocolStatus: "not-performed",
    phase5BReadOnlySdirk2Status:
      "solver-reference-available-not-same-protocol",
    finalNoAlternansClaim: "not-claimed",
    futureScope: {
      rvPressureOverloadCoverage: "not-covered",
      septalBowingCoverage: "not-covered",
      ventricularInterdependenceCoverage: "not-covered",
      rightHeartFailureCoverage: "not-covered",
      triSegAdoption: "not-claimed",
    },
    sections: sections.map((section) => ({
      id: section.id,
      status: section.status,
      metrics: section.metrics,
    })),
    readinessPass,
  } satisfies Omit<LandNewMyocardiumLowPreloadCheckReport, "stableSummaryHash">;

  return {
    ...reportWithoutHash,
    stableSummaryHash: stableHash(sanitizeForStableHash(reportWithoutHash)),
  };
}

function buildLegacyReproduction(
  observed: LandShadowLegacyProtocolEvidence,
): LandNewMyocardiumLegacyReproductionEvidence {
  const fixedProtocolPass =
    observed.baselineTotalBloodVolumeMl === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl
    && observed.deltaTotalBloodVolumeMl === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl
    && observed.effectiveTotalBloodVolumeMl === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.effectiveTotalBloodVolumeMl
    && observed.heartModel === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.heartModel
    && observed.integrationDtSec === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec
    && observed.sampleHz === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz
    && observed.traceBeats === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats
    && observed.returnMapAcceptance === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.returnMapAcceptance
    && observed.returnMapPointLimit === 0;
  const reproductionPass =
    observed.settled === true
    && observed.periodBeats === 2
    && observed.adjacentDelta > LEGACY_ADJACENT_DELTA_MIN
    && observed.periodDelta < LEGACY_PERIOD_DELTA_MAX
    && observed.tbvClassification === "clean"
    && observed.tbvSanitizeAbsMl <= TBV_CLEAN_TOLERANCE_ML
    && observed.tbvProjectionAppliedMl <= TBV_CLEAN_TOLERANCE_ML
    && observed.maxValveReverseMl <= REVERSE_VOLUME_NON_PROBLEMATIC_MAX_ML;
  const pass = fixedProtocolPass && reproductionPass;
  return {
    status: pass ? "read-only-present-pinned" : "read-only-missing-or-drifted",
    sourcePhase: "Phase 5C-A",
    sourceStatus: "feedforward-shadow-replay-not-new-myocardium-check",
    fixedProtocolPass,
    reproductionPass,
    requiredSettled: true,
    requiredPeriodBeats: 2,
    requiredAdjacentDeltaGreaterThan: LEGACY_ADJACENT_DELTA_MIN,
    requiredPeriodDeltaLessThan: LEGACY_PERIOD_DELTA_MAX,
    requiredTbvCleanToleranceMl: TBV_CLEAN_TOLERANCE_ML,
    requiredValveReverseMaxMl: REVERSE_VOLUME_NON_PROBLEMATIC_MAX_ML,
    observed,
    pass,
  };
}

function buildReadOnlyPins(): LandNewMyocardiumReadOnlyPins {
  const phase5A = runLocalMonolithicCouplingReadinessReport();
  const phase5B = runLocalMonolithicSdirk2ReadinessReport();
  const phase5AHashOk = eightHex(phase5A.stableSummaryHash);
  const phase5BHashOk =
    eightHex(phase5B.stableSummaryHash)
    && eightHex(phase5B.localReferenceSolve.stableSummaryHash)
    && eightHex(phase5B.beFallbackReference.stableSummaryHash);
  const pass =
    phase5A.protocolSetId === LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID
    && phase5A.readinessPass
    && phase5AHashOk
    && phase5B.protocolSetId === LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID
    && phase5B.readinessPass
    && phase5BHashOk;
  return {
    phase5A: {
      reusePolicy: "read-only",
      protocolSetId: LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID,
      readinessPass: phase5A.readinessPass,
      stableSummaryHash: phase5A.stableSummaryHash,
      stableHashFormatPass: phase5AHashOk,
    },
    phase5B: {
      reusePolicy: "read-only",
      protocolSetId: LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID,
      readinessPass: phase5B.readinessPass,
      stableSummaryHash: phase5B.stableSummaryHash,
      localReferenceStableSummaryHash: phase5B.localReferenceSolve.stableSummaryHash,
      beFallbackStableSummaryHash: phase5B.beFallbackReference.stableSummaryHash,
      phase5BReadOnlySdirk2Status:
        "solver-reference-available-not-same-protocol",
      sameProtocolAgreementClaim: "not-claimed",
      stableHashFormatPass: phase5BHashOk,
    },
    pass,
  };
}

function runGeneratedSurrogate(
  sourceProviderId: LandNewMyocardiumSourceProviderId,
): SurrogateRunInternal {
  const dtSec = PHASE5C_C_CLOSURE_CONFIG.fixedLowPreloadProtocol.integrationDtSec;
  const totalSteps =
    Math.round(PHASE5C_C_CLOSURE_CONFIG.generatedBeatCount
      * PHASE5C_C_CLOSURE_CONFIG.cycleLengthSec / dtSec);
  const calciumParams = PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET;
  let previousCavityVolumeM3 = PHASE5C_C_INITIAL_STATE.initialCavityVolumeM3;
  let cavityVolumeM3 = PHASE5C_C_INITIAL_STATE.initialCavityVolumeM3;
  let afterloadPressurePa = PHASE5C_C_INITIAL_STATE.initialAfterloadPressurePa;
  let calciumState = Float64Array.from(DEFAULT_INITIAL_CALCIUM_STATE);
  let providerState = initialProviderState(sourceProviderId);
  const samples: SurrogateSample[] = [];
  let allOk = true;

  for (let step = 0; step < totalSteps; step += 1) {
    const timeSec = step * dtSec;
    const phase01 = normalizedPhase(timeSec / PHASE5C_C_CLOSURE_CONFIG.cycleLengthSec);
    const beat = Math.floor(timeSec / PHASE5C_C_CLOSURE_CONFIG.cycleLengthSec);
    const previousKinematics = evaluateKinematics(
      previousCavityVolumeM3,
      previousCavityVolumeM3,
      0,
      `${sourceProviderId}-previous`,
    );
    const currentKinematics = evaluateKinematics(
      cavityVolumeM3,
      previousCavityVolumeM3,
      (cavityVolumeM3 - previousCavityVolumeM3) / dtSec,
      `${sourceProviderId}-current`,
    );
    const calciumStep = stepPrescribedCalciumTransientV1(
      calciumState,
      {
        targetId: `phase5c-c-${sourceProviderId}`,
        activationEventId: beat,
        timeSinceActivationSec: phase01 * PHASE5C_C_CLOSURE_CONFIG.cycleLengthSec,
        cycleLengthSec: PHASE5C_C_CLOSURE_CONFIG.cycleLengthSec,
        activationStrength01: 1,
        dtSec,
      },
      calciumParams,
    );
    if (
      !previousKinematics.geometryHealth.finite
      || !previousKinematics.geometryHealth.inCalibrationDomain
      || !currentKinematics.geometryHealth.finite
      || !currentKinematics.geometryHealth.inCalibrationDomain
    ) {
      samples.push({
        beat,
        phase01,
        timeSec,
        vlvMl: cavityVolumeM3 * 1e6,
        lvpPa: Number.NaN,
        aopPa: afterloadPressurePa,
        qAoMlPerSec: Number.NaN,
        qInMlPerSec: Number.NaN,
        freeCalciumUM: calciumStep.output.freeCalciumUM,
        sourceActiveFiberStressPa: Number.NaN,
        kinematicsFinite: currentKinematics.geometryHealth.finite,
        selectedDomainCoverage: currentKinematics.geometryHealth.inCalibrationDomain,
        sourceFiniteHealth: false,
        solverResidualNorm: Number.NaN,
      });
      allOk = false;
      break;
    }
    const source = evaluateSourceProvider(
      sourceProviderId,
      providerState,
      {
        beat,
        phase01,
        dtSec,
        freeCalciumUM: calciumStep.output.freeCalciumUM,
        previousKinematics,
        currentKinematics,
        cavityVolumeM3,
        cavityVolumeRateM3PerSec: (cavityVolumeM3 - previousCavityVolumeM3) / dtSec,
      },
    );
    providerState = source.nextState;
    calciumState = calciumStep.nextState;

    const passive = evaluatePassiveExponentialEnergyV1({
      fiberEngineeringStrain: currentKinematics.fiberEngineeringStrain,
      fiberEngineeringStrainRatePerSec: currentKinematics.fiberEngineeringStrainRatePerSec,
    });
    const active = IdentityFiberNominalV1.evaluate(
      {
        source: source.output,
        instance: { moduleId: "homogenization", instanceId: `phase5c-c-${sourceProviderId}` },
        wallReferenceVolumeM3: currentKinematics.wallReferenceVolumeM3,
      },
      IDENTITY_FIBER_NOMINAL_V1_PARAMS,
    );
    const force = evaluateVirtualPowerGeneralizedForceV1({
      kinematics: currentKinematics,
      active,
      passive,
      coordinateUnitsById: {
        [THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.coordinateId]: "m3",
      },
    });
    const lvpPa =
      force.volumeCoordinatePressurePa?.[THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.coordinateId]
      ?? Number.NaN;
    const qAoM3PerSec =
      PHASE5C_C_CLOSURE_CONFIG.outletConductanceM3PerSecPa
      * smoothPositive(
        lvpPa - afterloadPressurePa,
        PHASE5C_C_CLOSURE_CONFIG.diodeSmoothingPressurePa,
      );
    const qInM3PerSec =
      PHASE5C_C_CLOSURE_CONFIG.inletConductanceM3PerSecPa
      * smoothPositive(
        PHASE5C_C_CLOSURE_CONFIG.preloadReservoirPressurePa - lvpPa,
        PHASE5C_C_CLOSURE_CONFIG.diodeSmoothingPressurePa,
      );
    const runoffM3PerSec =
      (afterloadPressurePa - PHASE5C_C_CLOSURE_CONFIG.afterloadRunoffPressurePa)
      / PHASE5C_C_CLOSURE_CONFIG.afterloadRunoffResistancePaSecPerM3;
    const nextCavityVolumeM3 =
      cavityVolumeM3 + (qInM3PerSec - qAoM3PerSec) * dtSec;
    const nextAfterloadPressurePa =
      afterloadPressurePa
      + ((qAoM3PerSec - runoffM3PerSec) * dtSec)
        / PHASE5C_C_CLOSURE_CONFIG.afterloadComplianceM3PerPa;
    const sample: SurrogateSample = {
      beat,
      phase01,
      timeSec,
      vlvMl: cavityVolumeM3 * 1e6,
      lvpPa,
      aopPa: afterloadPressurePa,
      qAoMlPerSec: qAoM3PerSec * 1e6,
      qInMlPerSec: qInM3PerSec * 1e6,
      freeCalciumUM: calciumStep.output.freeCalciumUM,
      sourceActiveFiberStressPa: source.output.sourceActiveFiberStressPa,
      kinematicsFinite: currentKinematics.geometryHealth.finite,
      selectedDomainCoverage: currentKinematics.geometryHealth.inCalibrationDomain,
      sourceFiniteHealth: source.ok && source.output.health.finite,
      solverResidualNorm: source.solverResidualNorm,
    };
    samples.push(sample);
    allOk =
      allOk
      && source.ok
      && [lvpPa, qAoM3PerSec, qInM3PerSec, nextCavityVolumeM3, nextAfterloadPressurePa]
        .every(Number.isFinite)
      && currentKinematics.geometryHealth.finite
      && currentKinematics.geometryHealth.inCalibrationDomain;

    previousCavityVolumeM3 = cavityVolumeM3;
    cavityVolumeM3 = nextCavityVolumeM3;
    afterloadPressurePa = nextAfterloadPressurePa;
  }

  const finiteStateHealth =
    allOk
    && samples.length === totalSteps
    && samples.every((sample) =>
      [
        sample.vlvMl,
        sample.lvpPa,
        sample.aopPa,
        sample.qAoMlPerSec,
        sample.qInMlPerSec,
        sample.freeCalciumUM,
        sample.sourceActiveFiberStressPa,
      ].every(Number.isFinite)
      && sample.kinematicsFinite
      && sample.sourceFiniteHealth,
    );
  const selectedDomainCoverageFinite =
    samples.length > 0 && samples.every((sample) => sample.selectedDomainCoverage);
  const hashes = runHashes();
  const branchBehavior = buildBranchBehavior(samples, hashes.branchMetricDefinitionsStableHash);
  const morphology = buildMorphologyEvidence(samples, branchBehavior.beatWindow);
  const eventSurfaces: LandNewMyocardiumEventSurfaces = {
    pressureFloorUse: false,
    tbvProjectionUse: false,
    tbvProjectionEquivalentMl: 0,
    outletReverseVolumeEquivalentMl: 0,
    inletReverseVolumeEquivalentMl: 0,
    maxReverseVolumeEquivalentMl: 0,
    qDotCapStatus: "not-used",
    qDotCapStatusIfIntroduced: "artifact-only-not-modelcore",
    sourceProviderId,
  };
  const sourceProviderProvenance = sourceProviderProvenanceFor(sourceProviderId);
  const trajectoryHashInput = {
    sourceProviderId,
    sourceProviderProvenance,
    samples: samples.map((sample) => ({
      beat: sample.beat,
      phase01: round(sample.phase01),
      vlvMl: round(sample.vlvMl),
      lvpPa: round(sample.lvpPa),
      aopPa: round(sample.aopPa),
      qAoMlPerSec: round(sample.qAoMlPerSec),
      freeCalciumUM: round(sample.freeCalciumUM),
      sourceActiveFiberStressPa: round(sample.sourceActiveFiberStressPa),
    })),
    branchBehavior,
    morphology,
  };
  const run: LandNewMyocardiumGeneratedRun = {
    sourceProviderId,
    sourceProviderRole:
      sourceProviderId === LEGACY_POSITIVE_CONTROL_PROVIDER_ID
        ? "positive-control"
        : "new-myocardium-run",
    generatedTrajectoryStatus:
      finiteStateHealth && selectedDomainCoverageFinite
        ? "generated-own-trajectory-finite"
        : samples.length > 0
          ? "generated-own-trajectory"
          : "generation-failed",
    trajectoryGenerationPolicy: {
      generatesOwnVlvTrajectory: true,
      consumesPhase5CALegacyVlvTrace: false,
      consumesLegacyActiveStressTimeSeries: false,
      consumesLegacyPressureTrace: false,
      consumesLegacyFlowTrace: false,
      consumesLegacyCoTrace: false,
      consumesLegacyBranchLabels: false,
      consumesRunLowPreloadDebugOutput: false,
      noPrerecordedStressOrTraceReplay: true,
    },
    hashes,
    eventSurfaces,
    branchBehavior,
    morphology,
    finiteStateHealth,
    selectedDomainCoverageFinite,
    pressureFloorUsedAny: false,
    tbvProjectionUsedAny: false,
    sourceProviderProvenance,
    sourceProviderStableHash: stableHash(sanitizeForStableHash(sourceProviderProvenance)),
    trajectoryStableHash: stableHash(sanitizeForStableHash(trajectoryHashInput)),
  };
  return { run, samples };
}

export const __phase5cDebugRunGeneratedSurrogate = runGeneratedSurrogate;

function initialProviderState(
  sourceProviderId: LandNewMyocardiumSourceProviderId,
): SourceProviderState {
  if (sourceProviderId === LEGACY_POSITIVE_CONTROL_PROVIDER_ID) {
    return {
      kind: LEGACY_POSITIVE_CONTROL_PROVIDER_ID,
      internal: LEGACY_ACTIVE_STRESS_MODEL.initialInternal(),
    };
  }
  return {
    kind: LAND_NEW_MYOCARDIUM_PROVIDER_ID,
    landState: Float64Array.from(DEFAULT_INITIAL_LAND_STATE),
    previousFreeCalciumUM: undefined,
  };
}

function evaluateSourceProvider(
  sourceProviderId: LandNewMyocardiumSourceProviderId,
  state: SourceProviderState,
  input: {
    readonly beat: number;
    readonly phase01: number;
    readonly dtSec: number;
    readonly freeCalciumUM: number;
    readonly previousKinematics: MyocardialKinematicsOutput;
    readonly currentKinematics: MyocardialKinematicsOutput;
    readonly cavityVolumeM3: number;
    readonly cavityVolumeRateM3PerSec: number;
  },
): SourceEvaluation {
  if (sourceProviderId === LEGACY_POSITIVE_CONTROL_PROVIDER_ID) {
    return evaluateLegacyActiveStressPositiveControl(state, input);
  }
  return evaluateLandNewMyocardiumSource(state, input);
}

function evaluateLegacyActiveStressPositiveControl(
  state: SourceProviderState,
  input: Parameters<typeof evaluateSourceProvider>[2],
): SourceEvaluation {
  if (state.kind !== LEGACY_POSITIVE_CONTROL_PROVIDER_ID) {
    throw new Error("legacy activeStress positive-control state mismatch");
  }
  const volumeMl = input.cavityVolumeM3 * 1e6;
  const ctx = legacyActiveStressContext(input);
  const terms = LEGACY_ACTIVE_STRESS_MODEL.debugActiveStressTerms(
    volumeMl,
    state.internal,
    ctx,
  );
  const derivatives = LEGACY_ACTIVE_STRESS_MODEL.internalDerivatives(
    volumeMl,
    state.internal,
    ctx,
  );
  const sourceActiveFiberStressPa = terms.sigmaAct;
  const output = sourceOutput(
    sourceActiveFiberStressPa,
    sourceActiveFiberStressPa * input.currentKinematics.fiberEngineeringStrainRatePerSec,
    legacyActiveStressTermsFinite(terms),
  );
  return {
    output,
    nextState: {
      kind: LEGACY_POSITIVE_CONTROL_PROVIDER_ID,
      internal: advanceLegacyActiveStressInternal(
        state.internal,
        derivatives,
        input.dtSec,
      ),
    },
    solverResidualNorm: 0,
    ok: output.health.finite,
  };
}

function legacyActiveStressContext(
  input: Parameters<typeof evaluateSourceProvider>[2],
): ChamberCtx {
  const volumeMl = input.cavityVolumeM3 * 1e6;
  const volumeRateMlPerSec = input.cavityVolumeRateM3PerSec * 1e6;
  const strokeRefMl =
    LEGACY_ACTIVE_STRESS_LV_EDV_REF_ML - LEGACY_ACTIVE_STRESS_LV_ESV_REF_ML;
  const shortening01 =
    clamp01((LEGACY_ACTIVE_STRESS_LV_EDV_REF_ML - volumeMl) / Math.max(strokeRefMl, 1e-6));
  const shorteningVelocity01PerSec =
    clamp(-volumeRateMlPerSec / Math.max(strokeRefMl, 1e-6), -6, 8);
  const outletValveOpen01 = clamp01(shorteningVelocity01PerSec / 2);
  const inletValveOpen01 = clamp01(-shorteningVelocity01PerSec / 2);
  return {
    HR: 60 / PHASE5C_C_CLOSURE_CONFIG.cycleLengthSec,
    contractility: 1,
    relaxation: 1,
    phi: input.beat + input.phase01,
    chamber: "LV",
    avDelaySec: 0.16,
    atrialElectromechanicalDelaySec: 0,
    ventricularElectromechanicalDelaySec: 0.05,
    tmaxScale: LEGACY_ACTIVE_STRESS_LV_TMAX_SCALE,
    geomScale: 1,
    caReleaseScale: 1,
    pairedVentricleVolumeMl: volumeMl,
    pairedVentricleShortening01: shortening01,
    pairedVentricleShorteningVelocity01PerSec: shorteningVelocity01PerSec,
    inletValveOpen01,
    outletValveOpen01,
    side: "left",
    lvVolumeMl: volumeMl,
    lvShortening01: shortening01,
    mvOpen01: inletValveOpen01,
    aovOpen01: outletValveOpen01,
  };
}

function advanceLegacyActiveStressInternal(
  internal: ChamberInternal,
  derivatives: ChamberInternalDerivatives,
  dtSec: number,
): ChamberInternal {
  return {
    c: Math.max(0, internal.c + derivatives.cDot * dtSec),
    a: clamp01(internal.a + derivatives.aDot * dtSec),
    r: Math.max(0, internal.r + derivatives.rDot * dtSec),
    tensionPa:
      Math.max(0, (internal.tensionPa ?? 0) + (derivatives.tensionPaDot ?? 0) * dtSec),
    lambdaAct:
      clamp(
        (internal.lambdaAct ?? 1) + (derivatives.lambdaActDot ?? 0) * dtSec,
        0.25,
        2.5,
      ),
  };
}

function legacyActiveStressTermsFinite(
  terms: ReturnType<ActiveStressChamberModel["debugActiveStressTerms"]>,
): boolean {
  return [
    terms.sigmaAct,
    terms.sigmaActTarget,
    terms.c,
    terms.a,
    terms.Kd,
    terms.aInf,
    terms.tauA,
    terms.fIso,
    terms.lambdaRaw,
    terms.lambdaAct,
  ].every(Number.isFinite);
}

function sourceProviderProvenanceFor(
  sourceProviderId: LandNewMyocardiumSourceProviderId,
): LandNewMyocardiumSourceProviderProvenance {
  if (sourceProviderId === LEGACY_POSITIVE_CONTROL_PROVIDER_ID) {
    return {
      sourceProviderId,
      equationSource: "engine/chambers.ts:ActiveStressChamberModel",
      parameterSource: "defaultActiveLV",
      stateSemantics: "legacy-ChamberInternal-c-a-r-tensionPa-lambdaAct",
      kinematicsInput: "surrogate-generated-selected-v2-LV-volume-and-fiber-kinematics",
      activationInput: "surrogate-generated-cycle-phase-activeStress-release",
      contextId: LEGACY_ACTIVE_STRESS_CONTEXT_ID,
      artifactEquationImportOnly: true,
      usesModelCoreRuntimeWiring: false,
      usesChamberRuntimeWiring: false,
      hardCodedBeatParityForcing: false,
      consumesPrerecordedTraceReplay: false,
    };
  }
  return {
    sourceProviderId,
    equationSource: "engine/myocardium/myofilament/land2017",
    parameterSource: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    stateSemantics: "Land2017-state-vector",
    kinematicsInput: "surrogate-generated-selected-v2-fiber-strain",
    activationInput: "surrogate-prescribed-calcium-transient",
    contextId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    artifactEquationImportOnly: true,
    usesModelCoreRuntimeWiring: false,
    usesChamberRuntimeWiring: false,
    hardCodedBeatParityForcing: false,
    consumesPrerecordedTraceReplay: false,
  };
}

function evaluateLandNewMyocardiumSource(
  state: SourceProviderState,
  input: Parameters<typeof evaluateSourceProvider>[2],
): SourceEvaluation {
  if (state.kind !== LAND_NEW_MYOCARDIUM_PROVIDER_ID) {
    throw new Error("Land new-myocardium source state mismatch");
  }
  const landInput: LandStepInput = {
    freeCalciumUM: input.freeCalciumUM,
    previousFiberEngineeringStrain: input.previousKinematics.fiberEngineeringStrain,
    stageFiberEngineeringStrain: input.currentKinematics.fiberEngineeringStrain,
    dtSec: input.dtSec,
    stage: { scheme: "BE", stageIndex: 0 },
  };
  const solved = solveLand2017BackwardEulerSubsteps(
    state.landState,
    landInput,
    {
      maxIterations: 16,
      residualTolerance: 1e-8,
      lineSearchMinStep: 1 / 2048,
      substeps: 1,
      previousFreeCalciumUM: state.previousFreeCalciumUM,
    },
  );
  if (solved.ok && solved.output) {
    return {
      output: solved.output,
      nextState: {
        kind: LAND_NEW_MYOCARDIUM_PROVIDER_ID,
        landState: solved.nextState,
        previousFreeCalciumUM: input.freeCalciumUM,
      },
      solverResidualNorm: solved.residualNorm,
      ok: true,
    };
  }
  return {
    output: sourceOutput(Number.NaN, Number.NaN, false),
    nextState: state,
    solverResidualNorm: solved.residualNorm,
    ok: false,
  };
}

function sourceOutput(
  sourceActiveFiberStressPa: number,
  sourceActivePowerDensityWPerM3: number,
  finite: boolean,
): LandSourceOutput {
  return {
    sourceActiveFiberStressPa,
    sourceStressConvention: "land2017-Ta",
    stabilizationStiffnessPa: 0,
    sourceActivePowerDensityWPerM3,
    health: {
      finite:
        finite
        && Number.isFinite(sourceActiveFiberStressPa)
        && Number.isFinite(sourceActivePowerDensityWPerM3),
      stateConservationResidual: 0,
      minimumPopulation: 0,
      projectionUsed: false,
    },
  };
}

function evaluateKinematics(
  valueM3: number,
  previousValueM3: number,
  rateM3PerSec: number,
  instanceId: string,
): MyocardialKinematicsOutput {
  return evaluateThickSphereV2SelectedBackend(
    {
      coordinates: [
        {
          id: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.coordinateId,
          valueSI: valueM3,
          previousValueSI: previousValueM3,
          rateSI: rateM3PerSec,
          unit: "m3",
        },
      ],
      instance: { moduleId: "kinematics", instanceId },
    },
    THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  );
}

function buildBranchBehavior(
  samples: readonly SurrogateSample[],
  branchMetricDefinitionsStableHash: string,
): LandNewMyocardiumBranchBehavior {
  const beats = buildBeatMetrics(samples);
  const beatWindow = beats.slice(-PHASE5C_C_CLOSURE_CONFIG.primaryReportWindowBeats);
  const adjacentDelta = adjacentRelativeDelta(beatWindow.map((beat) => beat.strokeVolumeMl));
  const periodDelta = period2RelativeDelta(beatWindow.map((beat) => beat.strokeVolumeMl));
  const period2 =
    beatWindow.length === PHASE5C_C_CLOSURE_CONFIG.primaryReportWindowBeats
    && adjacentDelta > LEGACY_ADJACENT_DELTA_MIN
    && periodDelta < LEGACY_PERIOD_DELTA_MAX
    && beatWindow.every((beat) => beat.finiteHealth && beat.selectedDomainCoverage);
  const period1 =
    beatWindow.length === PHASE5C_C_CLOSURE_CONFIG.primaryReportWindowBeats
    && adjacentDelta < 0.025
    && periodDelta < LEGACY_PERIOD_DELTA_MAX
    && beatWindow.every((beat) => beat.finiteHealth && beat.selectedDomainCoverage);
  return {
    settled: period2 || period1,
    settlingStatus:
      period2 ? "settled-period-2" : period1 ? "settled-period-1" : "not-settled-reported",
    periodBeats: period2 ? 2 : period1 ? 1 : 0,
    adjacentDelta,
    periodDelta,
    adjacentDeltaThreshold: LEGACY_ADJACENT_DELTA_MIN,
    periodDeltaThreshold: LEGACY_PERIOD_DELTA_MAX,
    returnMapEvidenceStatus: "report-only-not-acceptance",
    beatWindow,
    branchMetricDefinitionsId: "phase5c-c-low-preload-branch-metrics-v1",
    branchMetricDefinitionsStableHash,
  };
}

function buildBeatMetrics(
  samples: readonly SurrogateSample[],
): readonly LandNewMyocardiumBeatMetric[] {
  const grouped = new Map<number, SurrogateSample[]>();
  for (const sample of samples) {
    const group = grouped.get(sample.beat) ?? [];
    group.push(sample);
    grouped.set(sample.beat, group);
  }
  return Array.from(grouped.keys()).sort((a, b) => a - b).map((beat) => {
    const group = grouped.get(beat) ?? [];
    const forwardVolumeMl = integratePositive(group.map((sample) => sample.qAoMlPerSec), 0.001);
    const strokeWorkJ =
      group.reduce((sum, sample) =>
        sum + sample.lvpPa * Math.max(sample.qAoMlPerSec, 0) * 1e-6 * 0.001,
      0);
    const metricWithoutHash = {
      beat,
      sampleCount: group.length,
      edvMl: maxOrNaN(group.map((sample) => sample.vlvMl)),
      esvMl: minOrNaN(group.map((sample) => sample.vlvMl)),
      strokeVolumeMl:
        maxOrNaN(group.map((sample) => sample.vlvMl))
        - minOrNaN(group.map((sample) => sample.vlvMl)),
      qAoPeakMlPerSec: maxOrNaN(group.map((sample) => sample.qAoMlPerSec)),
      qAoForwardVolumeMl: forwardVolumeMl,
      qAoReverseVolumeMl: 0,
      aopPeakPa: maxOrNaN(group.map((sample) => sample.aopPa)),
      aopMeanPa: meanOrNaN(group.map((sample) => sample.aopPa)),
      lvpPeakPa: maxOrNaN(group.map((sample) => sample.lvpPa)),
      lvpMinPa: minOrNaN(group.map((sample) => sample.lvpPa)),
      strokeWorkJ,
      peakSourceActiveFiberStressPa:
        maxOrNaN(group.map((sample) => sample.sourceActiveFiberStressPa)),
      finiteHealth:
        group.length > 0
        && group.every((sample) =>
          [
            sample.vlvMl,
            sample.lvpPa,
            sample.aopPa,
            sample.qAoMlPerSec,
            sample.freeCalciumUM,
            sample.sourceActiveFiberStressPa,
          ].every(Number.isFinite)
          && sample.kinematicsFinite
          && sample.sourceFiniteHealth,
        ),
      selectedDomainCoverage:
        group.length > 0 && group.every((sample) => sample.selectedDomainCoverage),
    };
    return {
      ...metricWithoutHash,
      deterministicHash: stableHash(sanitizeForStableHash(metricWithoutHash)),
    };
  });
}

function buildMorphologyEvidence(
  samples: readonly SurrogateSample[],
  beatWindow: readonly LandNewMyocardiumBeatMetric[],
): LandNewMyocardiumMorphologyEvidence {
  const finalBeat = beatWindow.at(-1)?.beat ?? maxOrNaN(samples.map((sample) => sample.beat));
  const beatSamples = samples.filter((sample) => sample.beat === finalBeat);
  const stressPeak = maxSample(beatSamples, (sample) => sample.sourceActiveFiberStressPa);
  const caPeak = maxSample(beatSamples, (sample) => sample.freeCalciumUM);
  const lvpPeak = maxSample(beatSamples, (sample) => sample.lvpPa);
  const aopPeak = maxSample(beatSamples, (sample) => sample.aopPa);
  const qAoPositive = beatSamples.filter((sample) => sample.qAoMlPerSec > 1e-6);
  const strokeWorkJ =
    beatWindow.at(-1)?.strokeWorkJ
    ?? beatSamples.reduce((sum, sample) =>
      sum + sample.lvpPa * Math.max(sample.qAoMlPerSec, 0) * 1e-6 * 0.001,
    0);
  const metrics: LandNewMyocardiumMorphologyMetrics = {
    fwhmMs: fullWidthHalfMaxMs(beatSamples),
    timeToPeakMs:
      stressPeak ? (stressPeak.timeSec - finalBeat * PHASE5C_C_CLOSURE_CONFIG.cycleLengthSec) * 1000 : Number.NaN,
    relaxationTauMs: relaxationTauMs(beatSamples),
    caToStressPeakDelayMs:
      stressPeak && caPeak ? (stressPeak.timeSec - caPeak.timeSec) * 1000 : Number.NaN,
    peakStressPa: stressPeak?.sourceActiveFiberStressPa ?? Number.NaN,
    strokeWorkJ,
    lvpPeak: lvpPeak?.lvpPa ?? Number.NaN,
    lvpMin: minOrNaN(beatSamples.map((sample) => sample.lvpPa)),
    aopPeak: aopPeak?.aopPa ?? Number.NaN,
    aopMean: meanOrNaN(beatSamples.map((sample) => sample.aopPa)),
    lvpAopPeakGap:
      lvpPeak && aopPeak ? lvpPeak.lvpPa - aopPeak.aopPa : Number.NaN,
    lvpAopPeakLagMs:
      lvpPeak && aopPeak ? (lvpPeak.timeSec - aopPeak.timeSec) * 1000 : Number.NaN,
    ejectionDurationMs:
      qAoPositive.length > 0
        ? (qAoPositive.at(-1)!.timeSec - qAoPositive[0].timeSec + 0.001) * 1000
        : 0,
    qAoForwardVolumeMl: beatWindow.at(-1)?.qAoForwardVolumeMl ?? Number.NaN,
    qAoReverseVolumeMl: 0,
    qAoPeak: beatWindow.at(-1)?.qAoPeakMlPerSec ?? Number.NaN,
  };
  return {
    morphologyEvidenceStatus: "reported-not-official",
    officialMorphologyGateStatus: "not-wired",
    officialMorphologyPass: "not-claimed",
    metrics,
    finiteMetricSet: Object.values(metrics).every(Number.isFinite),
    interpretation: "report-only-may-be-bad-does-not-control-artifact-gate",
  };
}

function buildSameClosureEvidence(
  positiveControl: LandNewMyocardiumGeneratedRun,
  landRun: LandNewMyocardiumGeneratedRun,
): LandNewMyocardiumSameClosureEvidence {
  const sourceProviderDifferenceOnly =
    positiveControl.hashes.closureConfigStableHash
      === landRun.hashes.closureConfigStableHash
    && positiveControl.hashes.initialStateStableHash
      === landRun.hashes.initialStateStableHash
    && positiveControl.hashes.branchMetricDefinitionsStableHash
      === landRun.hashes.branchMetricDefinitionsStableHash
    && positiveControl.sourceProviderId === LEGACY_POSITIVE_CONTROL_PROVIDER_ID
    && landRun.sourceProviderId === LAND_NEW_MYOCARDIUM_PROVIDER_ID;
  return {
    positiveControlSourceProviderId: LEGACY_POSITIVE_CONTROL_PROVIDER_ID,
    landSourceProviderId: LAND_NEW_MYOCARDIUM_PROVIDER_ID,
    closureConfigStableHash: positiveControl.hashes.closureConfigStableHash,
    positiveControlClosureConfigStableHash:
      positiveControl.hashes.closureConfigStableHash,
    landClosureConfigStableHash: landRun.hashes.closureConfigStableHash,
    initialStateStableHash: positiveControl.hashes.initialStateStableHash,
    positiveControlInitialStateStableHash:
      positiveControl.hashes.initialStateStableHash,
    landInitialStateStableHash: landRun.hashes.initialStateStableHash,
    branchMetricDefinitionsStableHash:
      positiveControl.hashes.branchMetricDefinitionsStableHash,
    sourceProviderDifferenceOnly,
    pass: sourceProviderDifferenceOnly,
  };
}

function buildPolicyBoundary(
  descriptor: LandShadowPolicyDescriptor,
  legacyReproduction: LandNewMyocardiumLegacyReproductionEvidence,
  positiveControl: LandNewMyocardiumGeneratedRun,
  landRun: LandNewMyocardiumGeneratedRun,
): LandNewMyocardiumPolicyBoundary {
  const alternansPolicy = descriptor.alternansPolicy ?? {};
  const positiveControlPass = positiveControlPeriod2Pass(positiveControl);
  const landGeneratedFinite =
    landRun.generatedTrajectoryStatus === "generated-own-trajectory-finite"
    && landRun.finiteStateHealth
    && landRun.selectedDomainCoverageFinite;
  const newMyocardiumCheckStatus =
    !positiveControlPass
      ? "not-performed-positive-control-failed"
      : landGeneratedFinite && landRun.branchBehavior.settled
        ? "performed-be-smoke-not-final"
        : "attempted-not-satisfied";
  const evidence = {
    policyPath: "data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json",
    policyId:
      descriptor.id === "layer-consistency-and-alternans-policy-v1"
        ? "layer-consistency-and-alternans-policy-v1"
        : "missing-or-unexpected",
    legacyReproductionRequired:
      alternansPolicy.legacyReproduction?.required === true,
    newMyocardiumCheckRequired:
      alternansPolicy.newMyocardiumCheck?.required === true,
    secondOrderReferenceRequired:
      alternansPolicy.secondOrderReferenceRequired?.required === true,
    legacyReproductionStatus: legacyReproduction.status,
    legacyPositiveControlStatus:
      positiveControlPass
        ? "period-2-positive-control-pass"
        : "positive-control-failed",
    newMyocardiumCheckStatus,
    newMyocardiumCheckRequiredSatisfied: false,
    secondOrderSameProtocolStatus: "not-performed",
    finalNoAlternansClaim: "not-claimed",
  } as const;
  return {
    ...evidence,
    pass:
      evidence.policyId === "layer-consistency-and-alternans-policy-v1"
      && evidence.legacyReproductionRequired
      && evidence.newMyocardiumCheckRequired
      && evidence.secondOrderReferenceRequired
      && evidence.legacyReproductionStatus === "read-only-present-pinned"
      && (
        (
          evidence.legacyPositiveControlStatus === "period-2-positive-control-pass"
          && (
            evidence.newMyocardiumCheckStatus === "performed-be-smoke-not-final"
            || evidence.newMyocardiumCheckStatus === "attempted-not-satisfied"
          )
        )
        || (
          evidence.legacyPositiveControlStatus === "positive-control-failed"
          && evidence.newMyocardiumCheckStatus === "not-performed-positive-control-failed"
        )
      )
      && !evidence.newMyocardiumCheckRequiredSatisfied
      && evidence.secondOrderSameProtocolStatus === "not-performed"
      && evidence.finalNoAlternansClaim === "not-claimed",
  };
}

function runHashes(): LandNewMyocardiumRunHashes {
  return {
    closureConfigStableHash: stableHash(sanitizeForStableHash(PHASE5C_C_CLOSURE_CONFIG)),
    initialStateStableHash: stableHash(sanitizeForStableHash(PHASE5C_C_INITIAL_STATE)),
    branchMetricDefinitionsStableHash:
      stableHash(sanitizeForStableHash(PHASE5C_C_BRANCH_METRIC_DEFINITIONS)),
  };
}

function boundarySection(): LandNewMyocardiumSection {
  const ok =
    protocolDescriptor.protocolSetId === LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID
    && protocolDescriptor.phase === LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE
    && protocolDescriptor.claimBoundary === LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY
    && protocolDescriptor.closureModelId === PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID
    && protocolDescriptor.closureEquivalenceToModelCore === "not-claimed"
    && protocolDescriptor.closureSettings.usePhase5CALegacyVlvTraceForGeneratedRuns === false
    && protocolDescriptor.closureSettings.useLegacyStressTraceReplay === false
    && protocolDescriptor.closureSettings.useTBVProjectionAfterInitialization === false
    && protocolDescriptor.closureSettings.usePressureFloor === false
    && protocolDescriptor.closureSettings.useQDotCap === false;
  return section("phase5c-c-boundary-v1", ok, {
    protocolSetId: protocolDescriptor.protocolSetId,
    closureModelId: protocolDescriptor.closureModelId,
    closureEquivalenceToModelCore: protocolDescriptor.closureEquivalenceToModelCore,
  });
}

function legacyReproductionSection(
  evidence: LandNewMyocardiumLegacyReproductionEvidence,
): LandNewMyocardiumSection {
  return section("legacy-reproduction-read-only-pin-v1", evidence.pass, evidence);
}

function sameClosureSection(
  evidence: LandNewMyocardiumSameClosureEvidence,
): LandNewMyocardiumSection {
  return section("same-closure-source-provider-difference-v1", evidence.pass, evidence);
}

function positiveControlSection(
  run: LandNewMyocardiumGeneratedRun,
): LandNewMyocardiumSection {
  return section("legacy-activeStress-positive-control-v1", positiveControlPeriod2Pass(run), {
    sourceProviderId: run.sourceProviderId,
    branchBehavior: run.branchBehavior,
    eventSurfaces: run.eventSurfaces,
  });
}

function landGeneratedTrajectorySection(
  run: LandNewMyocardiumGeneratedRun,
): LandNewMyocardiumSection {
  const policy = run.trajectoryGenerationPolicy;
  const ok =
    run.generatedTrajectoryStatus === "generated-own-trajectory-finite"
    && run.finiteStateHealth
    && run.selectedDomainCoverageFinite
    && policy.generatesOwnVlvTrajectory
    && !policy.consumesPhase5CALegacyVlvTrace
    && !policy.consumesLegacyActiveStressTimeSeries
    && !policy.consumesLegacyPressureTrace
    && !policy.consumesLegacyFlowTrace
    && !policy.consumesLegacyCoTrace
    && !policy.consumesLegacyBranchLabels
    && !policy.consumesRunLowPreloadDebugOutput
    && policy.noPrerecordedStressOrTraceReplay
    && run.eventSurfaces.pressureFloorUse === false
    && run.eventSurfaces.tbvProjectionUse === false;
  return section("land-generated-trajectory-v1", ok, {
    sourceProviderId: run.sourceProviderId,
    generatedTrajectoryStatus: run.generatedTrajectoryStatus,
    branchBehavior: run.branchBehavior,
    eventSurfaces: run.eventSurfaces,
  });
}

function reportOnlyMorphologySection(
  morphology: LandNewMyocardiumMorphologyEvidence,
): LandNewMyocardiumSection {
  return section("report-only-morphology-v1", morphology.finiteMetricSet, morphology);
}

function policyBoundarySection(
  policy: LandNewMyocardiumPolicyBoundary,
): LandNewMyocardiumSection {
  return section("policy-unsatisfied-boundary-v1", policy.pass, policy);
}

function readOnlyPinsSection(
  pins: LandNewMyocardiumReadOnlyPins,
): LandNewMyocardiumSection {
  return section("phase5a-phase5b-read-only-pins-v1", pins.pass, pins);
}

function runtimeIsolationSection(): LandNewMyocardiumSection {
  const settings = protocolDescriptor.protocolSettings;
  const ok =
    settings.useRuntimeReplacement === false
    && settings.useModelCoreRuntimeWiring === false
    && settings.useChamberRuntimeWiring === false
    && settings.useCaseRuntimeWiring === false
    && settings.useStateSchemaWiring === false
    && settings.useOfficialCaseWiring === false
    && settings.useWorkbenchRuntimeWiring === false
    && settings.useOfficialMorphologyAcceptance === false
    && settings.useRobustNoAlternansAcceptance === false
    && settings.validateRVPressureOverload === false
    && settings.validateVentricularInterdependence === false
    && settings.validateRightHeartFailure === false
    && settings.adoptTriSeg === false;
  return section("runtime-isolation-v1", ok, {
    runtimeIsolationStatus: protocolDescriptor.runtimeIsolation.status,
    settings,
  });
}

function deterministicSection(
  positiveControl: LandNewMyocardiumGeneratedRun,
  landRun: LandNewMyocardiumGeneratedRun,
): LandNewMyocardiumSection {
  const ok =
    eightHex(positiveControl.hashes.closureConfigStableHash)
    && eightHex(positiveControl.hashes.initialStateStableHash)
    && eightHex(positiveControl.hashes.branchMetricDefinitionsStableHash)
    && eightHex(positiveControl.trajectoryStableHash)
    && eightHex(landRun.trajectoryStableHash);
  return section("deterministic-report-v1", ok, {
    positiveControlTrajectoryStableHash: positiveControl.trajectoryStableHash,
    landTrajectoryStableHash: landRun.trajectoryStableHash,
  });
}

function positiveControlPeriod2Pass(run: LandNewMyocardiumGeneratedRun): boolean {
  return (
    run.sourceProviderId === LEGACY_POSITIVE_CONTROL_PROVIDER_ID
    && run.generatedTrajectoryStatus === "generated-own-trajectory-finite"
    && run.finiteStateHealth
    && run.selectedDomainCoverageFinite
    && run.branchBehavior.settled
    && run.branchBehavior.periodBeats === 2
    && run.branchBehavior.adjacentDelta > LEGACY_ADJACENT_DELTA_MIN
    && run.branchBehavior.periodDelta < LEGACY_PERIOD_DELTA_MAX
    && run.eventSurfaces.tbvProjectionEquivalentMl <= TBV_CLEAN_TOLERANCE_ML
    && run.eventSurfaces.maxReverseVolumeEquivalentMl <= REVERSE_VOLUME_NON_PROBLEMATIC_MAX_ML
    && run.eventSurfaces.pressureFloorUse === false
    && run.branchBehavior.beatWindow.every((beat) =>
      beat.finiteHealth && beat.selectedDomainCoverage,
    )
  );
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, unknown>,
): LandNewMyocardiumSection {
  return {
    id,
    status: ok ? "readiness-pass" : "readiness-fail",
    metrics,
  };
}

function fullWidthHalfMaxMs(samples: readonly SurrogateSample[]): number {
  const peak = maxOrNaN(samples.map((sample) => sample.sourceActiveFiberStressPa));
  if (!Number.isFinite(peak) || peak <= 0) return Number.NaN;
  const half = peak * 0.5;
  const above = samples.filter((sample) => sample.sourceActiveFiberStressPa >= half);
  if (above.length === 0) return 0;
  return (above.at(-1)!.timeSec - above[0].timeSec + 0.001) * 1000;
}

function relaxationTauMs(samples: readonly SurrogateSample[]): number {
  const peak = maxSample(samples, (sample) => sample.sourceActiveFiberStressPa);
  if (!peak || peak.sourceActiveFiberStressPa <= 0) return Number.NaN;
  const target = peak.sourceActiveFiberStressPa / Math.E;
  const relaxed = samples.find((sample) =>
    sample.timeSec > peak.timeSec && sample.sourceActiveFiberStressPa <= target,
  );
  if (!relaxed) {
    const last = samples.at(-1);
    return last ? Math.max((last.timeSec - peak.timeSec) * 1000, 0) : Number.NaN;
  }
  return (relaxed.timeSec - peak.timeSec) * 1000;
}

function maxSample<T>(
  samples: readonly T[],
  getter: (sample: T) => number,
): T | undefined {
  let best: T | undefined;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (const sample of samples) {
    const value = getter(sample);
    if (Number.isFinite(value) && value > bestValue) {
      best = sample;
      bestValue = value;
    }
  }
  return best;
}

function adjacentRelativeDelta(values: readonly number[]): number {
  if (values.length < 2) return Number.NaN;
  const a = values.at(-1)!;
  const b = values.at(-2)!;
  return Math.abs(a - b) / Math.max((Math.abs(a) + Math.abs(b)) / 2, 1e-9);
}

function period2RelativeDelta(values: readonly number[]): number {
  if (values.length < 4) return Number.NaN;
  const a = values.at(-1)!;
  const b = values.at(-2)!;
  const c = values.at(-3)!;
  const d = values.at(-4)!;
  const oddDelta = Math.abs(a - c) / Math.max((Math.abs(a) + Math.abs(c)) / 2, 1e-9);
  const evenDelta = Math.abs(b - d) / Math.max((Math.abs(b) + Math.abs(d)) / 2, 1e-9);
  return Math.max(oddDelta, evenDelta);
}

function integratePositive(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, value) => sum + Math.max(value, 0) * dtSec, 0);
}

function smoothPositive(value: number, smoothing: number): number {
  return 0.5 * (value + Math.sqrt(value * value + smoothing * smoothing));
}

function normalizedPhase(value: number): number {
  const phase = value - Math.floor(value);
  return phase < 0 ? phase + 1 : phase;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function minOrNaN(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.min(...finite) : Number.NaN;
}

function maxOrNaN(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : Number.NaN;
}

function meanOrNaN(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e9) / 1e9;
}

function eightHex(value: string): boolean {
  return /^[0-9a-f]{8}$/.test(value);
}

export function pressurePaToMmHg(value: number): number {
  return value * PA_TO_MMHG;
}
