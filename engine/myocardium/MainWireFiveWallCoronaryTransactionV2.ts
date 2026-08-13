import {
  buildNonCoronaryCirculationGraphV1,
  commitNonCoronaryCirculationTrialWithConservativeCompanionV1,
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
  type NonCoronaryAbsoluteChamberPressureTangentV1,
  type NonCoronaryAcceptedNumericalSourceV1,
  type NonCoronaryCandidateMechanicsResultV1,
  type NonCoronaryBackwardEulerScratchWorkspaceV1,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationNewtonOptionsV1,
  type NonCoronaryConservativeCompanionCandidateInputV1,
  type NonCoronaryDynamicMechanicalSupportInputV1,
  type NonCoronaryMechanicalSupportInputV1,
  type NonCoronaryProtocolResistanceScaleByEdgeV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryCirculationTrialDiagnosticsV1,
  type NonCoronaryCirculationTrialFailureReasonV1,
  type NonCoronaryCirculationTrialFailureV1,
  type NonCoronaryCirculationTrialSuccessV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  respiratoryExternalPressureForKindV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  CoronaryBackwardEulerTransactionV2,
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  buildCoronaryCollapseHydraulicsPriorV2,
  computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2,
  initializePressureLadderCoronaryStateV2,
  solveCoronaryBackwardEulerTrialV2,
  type CoronaryAcceptedHydraulicStateV2,
  type CoronaryBackwardEulerScratchWorkspaceV2,
  type CoronaryBackwardEulerSolverOptionsV2,
  type CoronaryBackwardEulerTrialInputV2,
  type CoronaryBackwardEulerTrialV2,
  type CoronaryCollapseHydraulicsPriorV2,
  type CoronaryDiseaseInputV2,
  type CoronaryHydraulicBoundaryInputV2,
  type CoronaryImplicitBoundaryDirectionV2,
  type CoronaryPressureLadderInitializationV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
  resolveMainWireCoronaryBoundaryV2,
  type MainWireCoronaryImpMechanismV2,
  type MainWireCoronaryShorteningImpGainPriorV2,
  type MainWireCoronaryShorteningReferenceV2,
  type MainWireCoronaryWallNumbersV2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  evaluateAllCoronaryImpPressureV1,
} from "@/engine/coronary/intramyocardialPressureV1";
import {
  evaluateMainWireCoronaryMechanicsCouplingV1,
  evaluateMainWireCoronaryMechanicsCouplingVentricularDirectionV1,
  type MainWireCoronaryMechanicsCouplingEvaluationV1,
} from "@/engine/coronary/mainWireMechanicsCouplingV1";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  CORONARY_TOPOLOGY_ID_V2,
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryTopologyPriorFingerprintV2,
  createColdCoronaryConstructionSeedV2,
  type CoronaryTopologyPriorV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryLayerRecordV2,
  type CoronaryTerritoryLayerRecordV2,
} from "@/engine/coronary/typesV2";
import {
  evaluateFiveWallNormalCalciumDriveV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
  MainWireFiveWallLandTriSegEvaluationCountersV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  evaluateMainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumEvaluationV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  cloneWholeHeartMechanicsAcceptedStateV1,
  commitPreparedWholeHeartMechanicsTrialV1,
  evaluatePreparedWholeHeartMechanicsCandidateProbeV1,
  evaluatePreparedWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  inspectPreparedWholeHeartMechanicsCandidateProbeReadbackV1,
  prepareWholeHeartMechanicsStepV1,
  sealPreparedWholeHeartMechanicsCandidateProbeV1,
  WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_V1_ID,
  type WholeHeartMechanicsAcceptedStateV1,
  type WholeHeartMechanicsCandidateProbeV1,
  type WholeHeartMechanicsChamberValuesV1,
  type WholeHeartMechanicsDiagnosticsV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  type WholeHeartMechanicsPreparedStepV1,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsTrialV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
  resolveMainWireNormalAdultBloodVolumeProtocolTargetV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";

export const MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID =
  "main-wire-five-wall-coronary-transaction-v2" as const;

const PA_PER_MMHG = 133.322;
const MITRAL_FORWARD_FLOW_ACTIVE_THRESHOLD_ML_PER_SEC = 1;
const DEFAULT_OUTER_SCALED_DIRECTION_STEP_V2 = 2e-6;
const DEFAULT_IMP_MECHANISM_V2 = "cep-shortening-induced" as const;

export const MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V2 =
  Object.freeze({
    circulationOwner:
      "main-wire-derived-noncoronary-plus-sixteen-volume-coronary-v2-implicit-transaction" as const,
    mechanicsOwner: "one-joint-five-wall-provider" as const,
    coronaryBoundaryCoupling:
      "aortic-uptake-and-common-coronary-venous-right-atrial-return-in-outer-be-residual" as const,
    mechanicalSupportCoupling:
      "optional-same-candidate-algebraic-device-node-rates-inside-outer-be-residual" as const,
    mechanicalSupportStateOwnership:
      "no-accepted-device-state-config-and-beat-timing-are-session-inputs" as const,
    calciumDriveSeam:
      "optional-externally-owned-same-candidate-five-wall-free-calcium" as const,
    calciumDriveStateOwnership:
      "none-external-owner-must-commit-or-rollback-with-this-transaction" as const,
    totalBloodVolumeOwner:
      "one-fixed-global-ledger-including-fifteen-plus-sixteen-volumes" as const,
    companionNewtonSemantics:
      "every-probe-restarts-from-the-same-previous-accepted-coronary-v2-state" as const,
    mechanicsProbeContext:
      "one-audited-private-accepted-mechanics-snapshot-per-outer-step" as const,
    commitSemantics:
      "circulation-coronary-mechanics-and-mvc-reference-promote-once-after-all-trials-succeed" as const,
    failureSemantics: "rollback-all-accepted-owners" as const,
    impMechanism: DEFAULT_IMP_MECHANISM_V2,
    shorteningGain:
      "fixed-normal-reference-gain-never-renormalized-per-scenario" as const,
    shorteningReference:
      "previous-accepted-mitral-closure-fiber-strain" as const,
    initialShorteningReference:
      "same-scenario-cold-mechanics-strain" as const,
    mitralClosureDetector:
      "accepted-mitral-forward-flow-true-to-false-at-one-ml-per-sec" as const,
    toneUpdateInsideHydraulicNewton: false as const,
    acceptedToneMode: "fixed-until-accepted-cycle-autoregulation-phase" as const,
    outerJacobian:
      "analytic-noncoronary-plus-implicit-coronary-directional-sensitivity-with-development-fd-shadow" as const,
    parameterFittingOwnedHere: false as const,
    simulationReady: false as const,
  });

export type MainWireCoronaryMvcReferenceStateV2 = Readonly<{
  reference: MainWireCoronaryShorteningReferenceV2;
  referenceAcceptedTimeSec: number;
  referenceRevision: number;
  mitralForwardFlowActive: boolean;
  acceptedMitralClosureEventCount: number;
}>;

export type MainWireFiveWallCoronaryBindingV2 = Readonly<{
  topologyId: CoronaryTopologyPriorV2["topologyId"];
  priorFingerprint: string;
  collapseHydraulicsFingerprint: string;
  boundaryResolverId: typeof MAIN_WIRE_CORONARY_BOUNDARY_V2_ID;
  impMechanism: MainWireCoronaryImpMechanismV2;
  shorteningImpPriorFingerprint: string;
  mvcReferenceSemantics:
    "previous-accepted-mitral-closure-fiber-strain-v1";
}>;

export type MainWireFiveWallCoronaryAcceptedStateV2<TWallState> = Readonly<{
  transactionId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID;
  revision: number;
  acceptedTimeSec: number;
  fixedGlobalTotalBloodVolumeMl: number;
  coronaryBinding: MainWireFiveWallCoronaryBindingV2;
  circulation: NonCoronaryCirculationAcceptedStateV1;
  coronary: CoronaryAcceptedHydraulicStateV2;
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>;
  mvcReferenceState: MainWireCoronaryMvcReferenceStateV2;
}>;

/**
 * The cache is used only when every object `acceptedTuple` dereferences on its
 * way to a scalar is frozen; `mainWireFiveWallCoronaryValidationSurfaceIsFrozenV2`
 * enumerates exactly that set, including the two-level MVC reference that
 * `validateMvcReferenceState` reaches through. Everything else `acceptedTuple`
 * touches is a primitive on one of those frozen objects. Mutable mechanics
 * payloads outside that read surface are deliberately irrelevant to the stamp
 * and retain their existing contract.
 */
const validatedMainWireFiveWallCoronaryAcceptedStatesV2 =
  new WeakSet<object>();

type MainWireFiveWallCoronaryMechanicsCandidateV2<TWallState> =
  | WholeHeartMechanicsTrialV1<TWallState>
  | WholeHeartMechanicsCandidateProbeV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >;

type MainWireFiveWallCoronaryMechanicsViewV2<TWallState> = Readonly<
  Pick<
    WholeHeartMechanicsTrialV1<TWallState>,
    | "candidateVolumesMl"
    | "transmuralPressuresMmHg"
    | "transmuralPressureVolumeTangentMmHgPerMl"
  > & {
    diagnostics: WholeHeartMechanicsDiagnosticsV1;
  }
>;

function isWholeHeartMechanicsCandidateProbeV2<TWallState>(
  candidate: MainWireFiveWallCoronaryMechanicsCandidateV2<TWallState>,
): candidate is WholeHeartMechanicsCandidateProbeV1<
  TWallState,
  MainWireFiveWallFreeCalciumDriveV1
> {
  return "probeId" in candidate
    && candidate.probeId === WHOLE_HEART_MECHANICS_CANDIDATE_PROBE_V1_ID;
}

function errorMessageV2(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<
  TWallState,
> = Readonly<{
  /** Private candidate authority; only the selected probe may be sealed. */
  mechanicsCandidate:
    MainWireFiveWallCoronaryMechanicsCandidateV2<TWallState>;
  /** Read-only model-owned projection used inside the coupled solve. */
  mechanicsView: MainWireFiveWallCoronaryMechanicsViewV2<TWallState>;
  pericardium: MainWireCommonPericardiumEvaluationV1;
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  sourceIntramyocardialPressureMmHgByTerritoryLayer?:
    CoronaryTerritoryLayerRecordV2<number>;
}>;

/**
 * Candidate mechanics values read by the coronary boundary resolver.
 *
 * Atrial-direction probes construct this view without minting another
 * exclusive-ownership whole-heart mechanics trial.
 */
export type MainWireCoronaryBoundaryMechanicsViewV2 = Readonly<{
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  sourceIntramyocardialPressureMmHgByTerritoryLayer?:
    CoronaryTerritoryLayerRecordV2<number>;
}>;

export type MainWireFiveWallCoronaryCompanionTrialV2 = Readonly<{
  coronaryTrial: CoronaryBackwardEulerTrialV2;
  boundary: CoronaryHydraulicBoundaryInputV2;
}>;

export type MainWireFiveWallCoronaryEvaluationCountersV2 = Readonly<{
  outerCirculationCandidateCount: number;
  coronaryTrial: Readonly<{
    invocationCount: number;
    hydraulicResidualEvaluationCount: number;
    newtonIterationCount: number;
    lineSearchBacktrackCount: number;
  }>;
  coronaryImplicitSensitivities: Readonly<{
    invocationCount: number;
    directionCount: number;
    exactZeroBoundaryDirectionCount: number;
    baseResidualProbeEvaluationCount: number;
    volumeJacobianProbeEvaluationCount: number;
    boundaryResidualProbeEvaluationCount: number;
    observableProbeEvaluationCount: number;
    implicitLinearSolveCount: number;
    hydraulicResidualEvaluationCount: number;
  }>;
  mechanics: Readonly<{
    candidateCenterEvaluationCount: number;
    lvRvProbeEvaluationCount: number;
    ventricularCoronaryBoundaryProbeFallbackCount: number;
    totalEvaluationCount: number;
    triSegProviderCounterReadbackCount: number;
    solveInternalCoordinatesCallCount: number;
    evaluateCandidateCallCount: number;
    atrialMaterialEvaluationCountByWall: Readonly<{
      LA: number;
      RA: number;
    }>;
    atrialFiberLogStrainObservationCountByWall: Readonly<{
      LA: number;
      RA: number;
    }>;
    atrialFiberLogStrainChangeCountByWall: Readonly<{
      LA: number;
      RA: number;
    }>;
    atrialFiberLogStrainDistinctInputCountByWall: Readonly<{
      LA: number;
      RA: number;
    }>;
  }>;
}>;

export type MainWireFiveWallCoronaryCirculationDiagnosticsV2 = Readonly<
  NonCoronaryCirculationTrialDiagnosticsV1 & {
    /** Opt-in additive measurement; absent on the default production path. */
    evaluationCounters?: MainWireFiveWallCoronaryEvaluationCountersV2;
  }
>;

export type MainWireFiveWallCoronaryCirculationTrialSuccessV2<TWallState> =
  Readonly<
    Omit<
      NonCoronaryCirculationTrialSuccessV1<
        MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>,
        MainWireFiveWallCoronaryCompanionTrialV2
      >,
      "diagnostics"
    > & {
      diagnostics: MainWireFiveWallCoronaryCirculationDiagnosticsV2;
    }
  >;

type MutableMainWireFiveWallCoronaryEvaluationCountersV2 = {
  outerCirculationCandidateCount: number;
  coronaryTrial: {
    invocationCount: number;
    hydraulicResidualEvaluationCount: number;
    newtonIterationCount: number;
    lineSearchBacktrackCount: number;
  };
  coronaryImplicitSensitivities: {
    invocationCount: number;
    directionCount: number;
    exactZeroBoundaryDirectionCount: number;
    baseResidualProbeEvaluationCount: number;
    volumeJacobianProbeEvaluationCount: number;
    boundaryResidualProbeEvaluationCount: number;
    observableProbeEvaluationCount: number;
    implicitLinearSolveCount: number;
    hydraulicResidualEvaluationCount: number;
  };
  mechanics: {
    candidateCenterEvaluationCount: number;
    lvRvProbeEvaluationCount: number;
    ventricularCoronaryBoundaryProbeFallbackCount: number;
    triSegProviderCounterReadbackCount: number;
    solveInternalCoordinatesCallCount: number;
    evaluateCandidateCallCount: number;
    atrialMaterialEvaluationCountByWall: { LA: number; RA: number };
    atrialFiberLogStrainObservationCountByWall: { LA: number; RA: number };
    atrialFiberLogStrainChangeCountByWall: { LA: number; RA: number };
    atrialFiberLogStrainDistinctInputCountByWall: { LA: number; RA: number };
  };
};

type MainWireFiveWallCoronaryCirculationTrialFailureV2 = Readonly<
  Omit<NonCoronaryCirculationTrialFailureV1, "diagnostics"> & {
    diagnostics: MainWireFiveWallCoronaryCirculationDiagnosticsV2;
  }
>;

export type MainWireFiveWallCoronaryInitializeInputV2<TWallState> = Readonly<{
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  /**
   * Optional cold drive owned and version-bound by a wider transaction.
   * This V2 substrate intentionally stores no rhythm/calcium state itself.
   */
  calciumDriveOverride?: MainWireFiveWallFreeCalciumDriveV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  coronaryInitial?: CoronaryAcceptedHydraulicStateV2;
  coronaryPrior?: CoronaryTopologyPriorV2;
  coronaryDisease?: CoronaryDiseaseInputV2;
  collapseHydraulics?: CoronaryCollapseHydraulicsPriorV2;
  impMechanism?: MainWireCoronaryImpMechanismV2;
  shorteningImpPrior?: MainWireCoronaryShorteningImpGainPriorV2;
  fixedGlobalTotalBloodVolumeMl?: number;
  timeSec?: number;
}>;

export type MainWireFiveWallCoronaryStepInputV2 = Readonly<{
  dtSec: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  /** Final candidate drive from an external accepted rhythm/calcium owner. */
  calciumDriveOverride?: MainWireFiveWallFreeCalciumDriveV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  coronaryPrior?: CoronaryTopologyPriorV2;
  coronaryDisease?: CoronaryDiseaseInputV2;
  collapseHydraulics?: CoronaryCollapseHydraulicsPriorV2;
  impMechanism?: MainWireCoronaryImpMechanismV2;
  shorteningImpPrior?: MainWireCoronaryShorteningImpGainPriorV2;
  coronarySolverOptions?: Partial<CoronaryBackwardEulerSolverOptionsV2>;
  circulationNewtonOptions?: NonCoronaryCirculationNewtonOptionsV1;
  /** Optional algebraic MCS/IABP extension evaluated inside each BE candidate. */
  mechanicalSupport?: NonCoronaryMechanicalSupportInputV1;
  /**
   * Pure dynamic MCS candidate seam. q_n is externally accepted and the core
   * only returns q_(n+1); a wider transaction owns atomic promotion.
   */
  dynamicMechanicalSupport?: NonCoronaryDynamicMechanicalSupportInputV1;
  protocolResistanceScaleByEdge?:
    NonCoronaryProtocolResistanceScaleByEdgeV1;
  /** Opt-in measurement only; omitted on the production/default hot path. */
  evaluationCounterCollection?: "enabled";
}>;

export type MainWireFiveWallCoronaryColdResultV2<TWallState> = Readonly<{
  acceptedState: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  transmuralPressuresMmHg: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
  commonIntrathoracicPressureMmHg: number;
  pericardium: MainWireCommonPericardiumEvaluationV1;
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  pressureLadderDiagnostics:
    CoronaryPressureLadderInitializationV2["diagnostics"] | null;
}>;

export type MainWireFiveWallCoronaryStepSuccessV2<TWallState> = Readonly<{
  converged: true;
  acceptedState: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>;
  circulationTrial:
    MainWireFiveWallCoronaryCirculationTrialSuccessV2<TWallState>;
  mechanicsTrial: WholeHeartMechanicsTrialV1<TWallState>;
  coronaryTrial: CoronaryBackwardEulerTrialV2;
  coronaryBoundary: CoronaryHydraulicBoundaryInputV2;
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  intramyocardialPressureMmHgByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<number>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  commonIntrathoracicPressureMmHg: number;
  pericardium: MainWireCommonPericardiumEvaluationV1;
  mvcReferenceUpdated: boolean;
}>;

export type MainWireFiveWallCoronaryFinalizationFailureStageV2 =
  | "selected-mechanics-seal"
  | "coupled-trial-validation"
  | "circulation-commit"
  | "mechanics-commit"
  | "mvc-reference-advance"
  | "accepted-tuple-promotion";

export type MainWireFiveWallCoronaryStepFailureV2<TWallState> = Readonly<{
  converged: false;
  reason:
    | "circulation-mechanics-or-coronary-v2-trial-failed"
    | "selected-candidate-finalization-failed";
  message: string;
  rollbackState: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>;
  circulationFailureReason:
    | NonCoronaryCirculationTrialFailureReasonV1
    | "selected-candidate-finalization-failed";
  lastAcceptedCandidateNodeVolumesMl:
    NonCoronaryCirculationTrialFailureV1["lastAcceptedCandidateNodeVolumesMl"];
  circulationDiagnostics: MainWireFiveWallCoronaryCirculationDiagnosticsV2;
  mechanicsCommitted: false;
  circulationCommitted: false;
  coronaryCommitted: false;
  mvcReferenceCommitted: false;
  finalizationFailureStage:
    MainWireFiveWallCoronaryFinalizationFailureStageV2 | null;
}>;

export type MainWireFiveWallCoronaryStepResultV2<TWallState> =
  | MainWireFiveWallCoronaryStepSuccessV2<TWallState>
  | MainWireFiveWallCoronaryStepFailureV2<TWallState>;

export function initializeMainWireFiveWallCoronaryV2<TWallState>(
  input: MainWireFiveWallCoronaryInitializeInputV2<TWallState>,
): MainWireFiveWallCoronaryColdResultV2<TWallState> {
  const timeSec = input.timeSec ?? 0;
  requireNonnegativeFinite(timeSec, "timeSec");
  const prior = input.coronaryPrior
    ?? MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  const collapseHydraulics = resolveCollapseHydraulics(
    prior,
    input.collapseHydraulics,
  );
  const impMechanism = input.impMechanism ?? DEFAULT_IMP_MECHANISM_V2;
  const shorteningImpPrior = input.shorteningImpPrior
    ?? NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2;
  const fixedGlobalTotalBloodVolumeMl =
    input.fixedGlobalTotalBloodVolumeMl
    ?? MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
      .fullGraphReferenceTotalBloodVolumeMl;
  requirePositiveFinite(
    fixedGlobalTotalBloodVolumeMl,
    "fixedGlobalTotalBloodVolumeMl",
  );

  const constructionSeed = createColdCoronaryConstructionSeedV2(prior);
  const preliminaryCoronaryState = input.coronaryInitial === undefined
    ? Object.freeze({
      acceptedTimeSec: timeSec,
      revision: 0,
      volumeMlByNode: constructionSeed.volumeMlByNode,
      toneResistanceScaleByTerritoryLayer:
        constructionSeed.initialToneResistanceScaleByTerritoryLayer,
    })
    : Object.freeze({
      ...input.coronaryInitial,
      acceptedTimeSec: timeSec,
      revision: 0,
    });
  const preliminaryCoronary = new CoronaryBackwardEulerTransactionV2(
    prior,
    preliminaryCoronaryState,
    topology,
    collapseHydraulics,
  ).getAcceptedState();
  const preliminaryCirculation = createCanonicalNonCoronaryPartitionV2(
    input.runtime,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBloodVolumeMl(preliminaryCoronary),
    timeSec,
  );
  const calciumDrive = resolveCalciumDriveV2(
    timeSec,
    input.calciumDriveParams,
    input.calciumDriveOverride,
  );
  const mechanicsCold = initializeWholeHeartMechanicsColdV1(input.provider, {
    timeSec,
    volumesMl: chamberVolumes(preliminaryCirculation),
    drivingInputs: calciumDrive,
  });
  const pthMmHg = commonIntrathoracicPressureMmHg(timeSec, input.runtime);
  const preliminaryPericardium = evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    chamberVolumes(preliminaryCirculation),
  );
  const preliminaryCoupling = evaluateMainWireCoronaryMechanicsCouplingV1(
    mechanicsCold,
    {
      commonIntrathoracicPressureMmHg: pthMmHg,
      commonPericardialExcessPressureMmHg:
        preliminaryPericardium.excessPressureMmHg,
    },
  );
  const initialReference = shorteningReference(
    preliminaryCoupling.effectiveFiberLogStrainByWall,
  );

  let pressureLadderDiagnostics:
    CoronaryPressureLadderInitializationV2["diagnostics"] | null = null;
  let coronary = preliminaryCoronary;
  if (input.coronaryInitial === undefined) {
    const boundary = resolveMainWireCoronaryBoundaryV2(
      Object.freeze({
        absoluteAorticPressureMmHg: absoluteAorticPressureMmHg(
          preliminaryCirculation,
          input.runtime,
        ),
        absoluteRightAtrialPressureMmHg:
          mechanicsCold.transmuralPressuresMmHg.RA
          + pthMmHg + preliminaryPericardium.excessPressureMmHg,
        ...(impMechanism === "source-cep-land-active"
          ? {
            sourceIntramyocardialPressureMmHgByTerritoryLayer:
              evaluateAllCoronaryImpPressureV1(
                preliminaryCoupling.input,
                "intramyocardial",
              ),
          }
          : {}),
        mechanicsInput: preliminaryCoupling.input,
        effectiveFiberLogStrainByWall:
          preliminaryCoupling.effectiveFiberLogStrainByWall,
      }),
      impMechanism,
      initialReference,
      shorteningImpPrior,
    );
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary,
      disease: input.coronaryDisease ?? NORMAL_CORONARY_DISEASE_INPUT_V2,
      toneResistanceScaleByTerritoryLayer:
        preliminaryCoronary.toneResistanceScaleByTerritoryLayer,
      collapseHydraulics,
    }, prior, topology);
    pressureLadderDiagnostics = initialized.diagnostics;
    coronary = new CoronaryBackwardEulerTransactionV2(
      prior,
      Object.freeze({
        ...initialized.acceptedState,
        acceptedTimeSec: timeSec,
        revision: 0,
      }),
      topology,
      collapseHydraulics,
    ).getAcceptedState();
  }

  const circulation = createCanonicalNonCoronaryPartitionV2(
    input.runtime,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBloodVolumeMl(coronary),
    timeSec,
  );
  assertSameChamberVolumes(
    preliminaryCirculation,
    circulation,
    "pressure-ladder TBV repartition",
  );
  const pericardium = evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    chamberVolumes(circulation),
  );
  const coronaryMechanicsCoupling =
    evaluateMainWireCoronaryMechanicsCouplingV1(mechanicsCold, {
      commonIntrathoracicPressureMmHg: pthMmHg,
      commonPericardialExcessPressureMmHg:
        pericardium.excessPressureMmHg,
    });
  const mvcReferenceState = initialMvcReferenceState(
    timeSec,
    coronaryMechanicsCoupling.effectiveFiberLogStrainByWall,
  );
  const binding = buildBinding(
    prior,
    collapseHydraulics,
    impMechanism,
    shorteningImpPrior,
  );
  return Object.freeze({
    acceptedState: acceptedTuple(
      0,
      fixedGlobalTotalBloodVolumeMl,
      binding,
      circulation,
      coronary,
      mechanicsCold.acceptedState,
      mvcReferenceState,
    ),
    calciumDrive,
    transmuralPressuresMmHg: Object.freeze({
      ...mechanicsCold.transmuralPressuresMmHg,
    }),
    commonIntrathoracicPressureMmHg: pthMmHg,
    pericardium,
    coronaryMechanicsCoupling,
    pressureLadderDiagnostics,
  });
}

export function stepMainWireFiveWallCoronaryV2<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
  input: MainWireFiveWallCoronaryStepInputV2,
  coronaryScratchWorkspace?: CoronaryBackwardEulerScratchWorkspaceV2,
  nonCoronaryScratchWorkspace?:
    NonCoronaryBackwardEulerScratchWorkspaceV1,
  previousAcceptedNumericalSource?: NonCoronaryAcceptedNumericalSourceV1,
): MainWireFiveWallCoronaryStepResultV2<TWallState> {
  validateAcceptedTuple(previous);
  requirePositiveFinite(input.dtSec, "dtSec");
  const prior = input.coronaryPrior
    ?? MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  const collapseHydraulics = resolveCollapseHydraulics(
    prior,
    input.collapseHydraulics,
  );
  const impMechanism = input.impMechanism ?? DEFAULT_IMP_MECHANISM_V2;
  const shorteningImpPrior = input.shorteningImpPrior
    ?? NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2;
  const binding = buildBinding(
    prior,
    collapseHydraulics,
    impMechanism,
    shorteningImpPrior,
  );
  assertSameBinding(previous.coronaryBinding, binding);

  const candidateTimeSec = previous.acceptedTimeSec + input.dtSec;
  const calciumDrive = resolveCalciumDriveV2(
    candidateTimeSec,
    input.calciumDriveParams,
    input.calciumDriveOverride,
  );
  const evaluationCounters =
    input.evaluationCounterCollection === "enabled"
      ? createMutableEvaluationCountersV2()
      : null;
  const useMechanicsCandidateProbes =
    provider.evaluationResultOwnershipMode === "exclusive-result";
  const mechanicsCalciumDrive = evaluationCounters === null
    ? calciumDrive
    : Object.freeze({
      ...calciumDrive,
      evaluationCounterCollection: "enabled" as const,
    });
  const pthMmHg = commonIntrathoracicPressureMmHg(
    candidateTimeSec,
    input.runtime,
  );
  const mechanicsStep = prepareWholeHeartMechanicsStepV1(provider, {
    previousAcceptedState: previous.mechanics,
    candidateTimeSec,
    stepDtSec: input.dtSec,
    drivingInputs: mechanicsCalciumDrive,
  });
  const rawCirculationTrial =
    evaluateNonCoronaryCirculationBackwardEulerTrialV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>,
    MainWireFiveWallCoronaryCompanionTrialV2
  >({
    previousAcceptedState: previous.circulation,
    dtSec: input.dtSec,
    runtime: input.runtime,
    mechanicalSupport: input.mechanicalSupport,
    dynamicMechanicalSupport: input.dynamicMechanicalSupport,
    options: input.circulationNewtonOptions,
    scratchWorkspace: nonCoronaryScratchWorkspace,
    protocolResistanceScaleByEdge: input.protocolResistanceScaleByEdge,
    evaluateCandidateMechanics: (volumesMl) =>
      evaluatePreparedCandidateMechanicsV2(
        mechanicsStep,
        volumesMl,
        input.pericardium,
        pthMmHg,
        impMechanism,
        evaluationCounters,
        "candidate-center",
        useMechanicsCandidateProbes,
      ),
    conservativeCompanion: Object.freeze({
      fixedGlobalTotalBloodVolumeMl:
        previous.fixedGlobalTotalBloodVolumeMl,
      previousAcceptedCompanionBloodVolumeMl:
        coronaryBloodVolumeMl(previous.coronary),
      evaluateSameCandidate: (candidate) => {
        if (evaluationCounters !== null) {
          evaluationCounters.outerCirculationCandidateCount += 1;
        }
        const mechanics = candidate.candidateMechanicsEvaluation;
        const boundary = resolveCandidateCoronaryBoundaryV2(
          candidate.boundaryAbsolutePressuresMmHg.Ao,
          candidate.boundaryAbsolutePressuresMmHg.RA,
          mechanics,
          impMechanism,
          previous.mvcReferenceState.reference,
          shorteningImpPrior,
        );
        const coronaryTrialInput = Object.freeze({
          dtSec: input.dtSec,
          boundary,
          disease: input.coronaryDisease
            ?? NORMAL_CORONARY_DISEASE_INPUT_V2,
          collapseHydraulics,
          solverOptions: input.coronarySolverOptions,
          ...(evaluationCounters === null
            ? {}
            : { evaluationCounterCollection: "enabled" as const }),
        }) satisfies CoronaryBackwardEulerTrialInputV2;
        // Every outer Newton/FD/line-search probe starts from the same accepted
        // V2 state. No candidate is retained as a hidden warm start.
        const coronaryTrial = solveCoronaryBackwardEulerTrialV2(
          previous.coronary,
          coronaryTrialInput,
          prior,
          topology,
          coronaryScratchWorkspace,
        );
        if (evaluationCounters !== null) {
          recordCoronaryTrialCountersV2(
            evaluationCounters,
            coronaryTrial,
          );
        }
        const boundaryDirections = buildCoronaryBoundaryDirectionsV2(
          candidate,
          mechanicsStep,
          input.pericardium,
          pthMmHg,
          boundary,
          impMechanism,
          previous.mvcReferenceState.reference,
          shorteningImpPrior,
          input.circulationNewtonOptions?.finiteDifferenceScaledStep
            ?? DEFAULT_OUTER_SCALED_DIRECTION_STEP_V2,
          evaluationCounters,
          useMechanicsCandidateProbes,
        );
        const implicitSensitivities = boundaryDirections === null
          ? undefined
          : computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2({
            previousAcceptedState: previous.coronary,
            trialInput: coronaryTrialInput,
            prior,
            topology,
            baseTrial: coronaryTrial,
            boundaryDirections,
            scratchWorkspace: coronaryScratchWorkspace,
          });
        if (
          evaluationCounters !== null
          && implicitSensitivities !== undefined
        ) {
          recordCoronaryImplicitSensitivityCountersV2(
            evaluationCounters,
            implicitSensitivities.diagnostics,
          );
        }
        const sensitivities =
          implicitSensitivities?.conservativeCompanionSensitivities;
        return Object.freeze({
          candidateCompanionBloodVolumeMl:
            coronaryTrial.diagnostics.candidateCoronaryBloodVolumeMl,
          outerBoundaryNetVolumeRateMlPerSec: Object.freeze({
            Ao: -coronaryTrial.diagnostics.hydraulics
              .totalInletFlowMlPerSec,
            RA: coronaryTrial.diagnostics.hydraulics
              .commonCoronaryVenousOutletFlowMlPerSec,
          }),
          candidateCompanionTrial: Object.freeze({
            coronaryTrial,
            boundary,
          }),
          ...(sensitivities === undefined ? {} : { sensitivities }),
        });
      },
    }),
  }, previousAcceptedNumericalSource);
  const circulationTrial = attachEvaluationCountersV2(
    rawCirculationTrial,
    evaluationCounters,
  );

  if (circulationTrial.converged === false) {
    return Object.freeze({
      converged: false as const,
      reason: "circulation-mechanics-or-coronary-v2-trial-failed" as const,
      message: circulationTrial.message,
      rollbackState: rollbackTuple(
        provider,
        previous,
        circulationTrial.rollbackState,
      ),
      circulationFailureReason: circulationTrial.reason,
      lastAcceptedCandidateNodeVolumesMl:
        circulationTrial.lastAcceptedCandidateNodeVolumesMl,
      circulationDiagnostics: circulationTrial.diagnostics,
      mechanicsCommitted: false as const,
      circulationCommitted: false as const,
      coronaryCommitted: false as const,
      mvcReferenceCommitted: false as const,
      finalizationFailureStage: null,
    });
  }

  let finalizationFailureStage:
    MainWireFiveWallCoronaryFinalizationFailureStageV2 =
      "selected-mechanics-seal";
  try {
    const candidateEvaluation = circulationTrial.candidateMechanicsEvaluation;
    const mechanicsTrial = isWholeHeartMechanicsCandidateProbeV2(
      candidateEvaluation.mechanicsCandidate,
    )
      ? sealPreparedWholeHeartMechanicsCandidateProbeV1(
        mechanicsStep,
        candidateEvaluation.mechanicsCandidate,
      )
      : candidateEvaluation.mechanicsCandidate;
    const sealedCandidateEvaluation = Object.freeze({
      ...candidateEvaluation,
      mechanicsCandidate: mechanicsTrial,
      mechanicsView: mechanicsTrial,
    });
    const sealedCirculationTrial = Object.freeze({
      ...circulationTrial,
      candidateMechanicsEvaluation: sealedCandidateEvaluation,
    });
    finalizationFailureStage = "coupled-trial-validation";
    validateCoupledTrial(previous, sealedCirculationTrial, mechanicsTrial);
    finalizationFailureStage = "circulation-commit";
    const circulationCommit =
      commitNonCoronaryCirculationTrialWithConservativeCompanionV1(
        previous.circulation,
        sealedCirculationTrial,
      );
    const companionTrial = circulationCommit.candidateCompanionTrial;
    if (companionTrial !== sealedCirculationTrial.conservativeCompanion
        ?.candidateCompanionTrial) {
      throw new Error("coronary V2 companion promotion changed trial identity");
    }
    finalizationFailureStage = "mechanics-commit";
    const nextMechanics = commitPreparedWholeHeartMechanicsTrialV1(
      mechanicsStep,
      mechanicsTrial,
    );
    finalizationFailureStage = "mvc-reference-advance";
    const nextMvcReference = advanceMainWireCoronaryMvcReferenceV2(
      previous.mvcReferenceState,
      Object.freeze({
        acceptedTimeSec: circulationTrial.candidateTimeSec,
        acceptedRevision: previous.revision + 1,
        mitralForwardFlowMlPerSec:
          circulationTrial.edgeFlowsMlPerSec.MV,
        effectiveFiberLogStrainByWall:
          candidateEvaluation.coronaryMechanicsCoupling
            .effectiveFiberLogStrainByWall,
      }),
    );
    finalizationFailureStage = "accepted-tuple-promotion";
    const acceptedState = acceptedTuple(
      previous.revision + 1,
      circulationCommit.fixedGlobalTotalBloodVolumeMl,
      previous.coronaryBinding,
      circulationCommit.acceptedNonCoronaryPartitionState,
      companionTrial.coronaryTrial.candidateAcceptedState,
      nextMechanics,
      nextMvcReference,
    );
    return Object.freeze({
      converged: true as const,
      acceptedState,
      circulationTrial: sealedCirculationTrial,
      mechanicsTrial,
      coronaryTrial: companionTrial.coronaryTrial,
      coronaryBoundary: companionTrial.boundary,
      coronaryMechanicsCoupling:
        candidateEvaluation.coronaryMechanicsCoupling,
      intramyocardialPressureMmHgByTerritoryLayer:
        companionTrial.boundary
          .intramyocardialPressureMmHgByTerritoryLayer,
      calciumDrive,
      commonIntrathoracicPressureMmHg: pthMmHg,
      pericardium: candidateEvaluation.pericardium,
      mvcReferenceUpdated:
        nextMvcReference.acceptedMitralClosureEventCount
        > previous.mvcReferenceState.acceptedMitralClosureEventCount,
    });
  } catch (error) {
    return Object.freeze({
      converged: false as const,
      reason: "selected-candidate-finalization-failed" as const,
      message: `${finalizationFailureStage}: ${errorMessageV2(error)}`,
      rollbackState: rollbackTuple(
        provider,
        previous,
        previous.circulation,
      ),
      circulationFailureReason:
        "selected-candidate-finalization-failed" as const,
      lastAcceptedCandidateNodeVolumesMl:
        circulationTrial.candidateNodeVolumesMl,
      circulationDiagnostics: circulationTrial.diagnostics,
      mechanicsCommitted: false as const,
      circulationCommitted: false as const,
      coronaryCommitted: false as const,
      mvcReferenceCommitted: false as const,
      finalizationFailureStage,
    });
  }
}

function createMutableEvaluationCountersV2():
MutableMainWireFiveWallCoronaryEvaluationCountersV2 {
  return {
    outerCirculationCandidateCount: 0,
    coronaryTrial: {
      invocationCount: 0,
      hydraulicResidualEvaluationCount: 0,
      newtonIterationCount: 0,
      lineSearchBacktrackCount: 0,
    },
    coronaryImplicitSensitivities: {
      invocationCount: 0,
      directionCount: 0,
      exactZeroBoundaryDirectionCount: 0,
      baseResidualProbeEvaluationCount: 0,
      volumeJacobianProbeEvaluationCount: 0,
      boundaryResidualProbeEvaluationCount: 0,
      observableProbeEvaluationCount: 0,
      implicitLinearSolveCount: 0,
      hydraulicResidualEvaluationCount: 0,
    },
    mechanics: {
      candidateCenterEvaluationCount: 0,
      lvRvProbeEvaluationCount: 0,
      ventricularCoronaryBoundaryProbeFallbackCount: 0,
      triSegProviderCounterReadbackCount: 0,
      solveInternalCoordinatesCallCount: 0,
      evaluateCandidateCallCount: 0,
      atrialMaterialEvaluationCountByWall: { LA: 0, RA: 0 },
      atrialFiberLogStrainObservationCountByWall: { LA: 0, RA: 0 },
      atrialFiberLogStrainChangeCountByWall: { LA: 0, RA: 0 },
      atrialFiberLogStrainDistinctInputCountByWall: { LA: 0, RA: 0 },
    },
  };
}

function recordCoronaryTrialCountersV2(
  counters: MutableMainWireFiveWallCoronaryEvaluationCountersV2,
  trial: CoronaryBackwardEulerTrialV2,
): void {
  const residualEvaluationCount =
    trial.diagnostics.hydraulicResidualEvaluationCount;
  if (residualEvaluationCount === undefined) {
    throw new Error(
      "enabled coronary evaluation measurement omitted its trial residual count",
    );
  }
  counters.coronaryTrial.invocationCount += 1;
  counters.coronaryTrial.hydraulicResidualEvaluationCount +=
    residualEvaluationCount;
  counters.coronaryTrial.newtonIterationCount +=
    trial.diagnostics.newtonIterations;
  counters.coronaryTrial.lineSearchBacktrackCount +=
    trial.diagnostics.totalLineSearchBacktracks;
}

function recordCoronaryImplicitSensitivityCountersV2(
  counters: MutableMainWireFiveWallCoronaryEvaluationCountersV2,
  diagnostics: ReturnType<
    typeof computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2
  >["diagnostics"],
): void {
  const target = counters.coronaryImplicitSensitivities;
  target.invocationCount += 1;
  target.directionCount += diagnostics.directionCount;
  target.exactZeroBoundaryDirectionCount +=
    diagnostics.exactZeroBoundaryDirectionCount;
  target.baseResidualProbeEvaluationCount +=
    diagnostics.baseResidualProbeEvaluationCount;
  target.volumeJacobianProbeEvaluationCount +=
    diagnostics.volumeJacobianProbeEvaluationCount;
  target.boundaryResidualProbeEvaluationCount +=
    diagnostics.boundaryResidualProbeEvaluationCount;
  target.observableProbeEvaluationCount +=
    diagnostics.observableProbeEvaluationCount;
  target.implicitLinearSolveCount += diagnostics.implicitLinearSolveCount;
  target.hydraulicResidualEvaluationCount +=
    diagnostics.hydraulicResidualEvaluationCount;
}

function recordTriSegProviderCountersV2(
  counters: MutableMainWireFiveWallCoronaryEvaluationCountersV2,
  readback: unknown,
): void {
  const providerCounters = triSegProviderCountersV2(readback);
  if (providerCounters === null) return;
  const target = counters.mechanics;
  target.triSegProviderCounterReadbackCount += 1;
  target.solveInternalCoordinatesCallCount +=
    providerCounters.solveInternalCoordinatesCallCount;
  target.evaluateCandidateCallCount +=
    providerCounters.evaluateCandidateCallCount;
  for (const wallId of ["LA", "RA"] as const) {
    target.atrialMaterialEvaluationCountByWall[wallId] +=
      providerCounters.atrialMaterialEvaluationCountByWall[wallId];
    target.atrialFiberLogStrainObservationCountByWall[wallId] +=
      providerCounters.atrialFiberLogStrainObservationCountByWall[wallId];
    target.atrialFiberLogStrainChangeCountByWall[wallId] +=
      providerCounters.atrialFiberLogStrainChangeCountByWall[wallId];
    target.atrialFiberLogStrainDistinctInputCountByWall[wallId] +=
      providerCounters.atrialFiberLogStrainDistinctInputCountByWall[wallId];
  }
}

function triSegProviderCountersV2(
  readback: unknown,
): MainWireFiveWallLandTriSegEvaluationCountersV1 | null {
  if (!isRecordV2(readback) || !isRecordV2(readback.evaluationCounters)) {
    return null;
  }
  const candidate = readback.evaluationCounters;
  if (
    candidate.solveInternalCoordinatesCallCount !== 1
    || !isNonnegativeIntegerV2(candidate.evaluateCandidateCallCount)
    || !isAtrialCounterRecordV2(candidate.atrialMaterialEvaluationCountByWall)
    || !isAtrialCounterRecordV2(
      candidate.atrialFiberLogStrainObservationCountByWall,
    )
    || !isAtrialCounterRecordV2(
      candidate.atrialFiberLogStrainChangeCountByWall,
    )
    || !isAtrialCounterRecordV2(
      candidate.atrialFiberLogStrainDistinctInputCountByWall,
    )
  ) {
    throw new Error("TriSeg provider returned invalid evaluation counters");
  }
  return candidate as MainWireFiveWallLandTriSegEvaluationCountersV1;
}

function isAtrialCounterRecordV2(value: unknown): value is Readonly<{
  LA: number;
  RA: number;
}> {
  return isRecordV2(value)
    && isNonnegativeIntegerV2(value.LA)
    && isNonnegativeIntegerV2(value.RA);
}

function isRecordV2(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonnegativeIntegerV2(value: unknown): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0;
}

function attachEvaluationCountersV2<TWallState>(
  trial:
    | NonCoronaryCirculationTrialSuccessV1<
      MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>,
      MainWireFiveWallCoronaryCompanionTrialV2
    >
    | NonCoronaryCirculationTrialFailureV1,
  counters: MutableMainWireFiveWallCoronaryEvaluationCountersV2 | null,
):
  | MainWireFiveWallCoronaryCirculationTrialSuccessV2<TWallState>
  | MainWireFiveWallCoronaryCirculationTrialFailureV2 {
  if (counters === null) {
    return trial as
      | MainWireFiveWallCoronaryCirculationTrialSuccessV2<TWallState>
      | MainWireFiveWallCoronaryCirculationTrialFailureV2;
  }
  const frozenCounters = freezeEvaluationCountersV2(counters);
  return Object.freeze({
    ...trial,
    diagnostics: Object.freeze({
      ...trial.diagnostics,
      evaluationCounters: frozenCounters,
    }),
  }) as
    | MainWireFiveWallCoronaryCirculationTrialSuccessV2<TWallState>
    | MainWireFiveWallCoronaryCirculationTrialFailureV2;
}

function freezeEvaluationCountersV2(
  counters: MutableMainWireFiveWallCoronaryEvaluationCountersV2,
): MainWireFiveWallCoronaryEvaluationCountersV2 {
  const mechanicsTotal =
    counters.mechanics.candidateCenterEvaluationCount
    + counters.mechanics.lvRvProbeEvaluationCount;
  return Object.freeze({
    outerCirculationCandidateCount:
      counters.outerCirculationCandidateCount,
    coronaryTrial: Object.freeze({ ...counters.coronaryTrial }),
    coronaryImplicitSensitivities: Object.freeze({
      ...counters.coronaryImplicitSensitivities,
    }),
    mechanics: Object.freeze({
      candidateCenterEvaluationCount:
        counters.mechanics.candidateCenterEvaluationCount,
      lvRvProbeEvaluationCount:
        counters.mechanics.lvRvProbeEvaluationCount,
      ventricularCoronaryBoundaryProbeFallbackCount:
        counters.mechanics.ventricularCoronaryBoundaryProbeFallbackCount,
      totalEvaluationCount: mechanicsTotal,
      triSegProviderCounterReadbackCount:
        counters.mechanics.triSegProviderCounterReadbackCount,
      solveInternalCoordinatesCallCount:
        counters.mechanics.solveInternalCoordinatesCallCount,
      evaluateCandidateCallCount:
        counters.mechanics.evaluateCandidateCallCount,
      atrialMaterialEvaluationCountByWall: Object.freeze({
        ...counters.mechanics.atrialMaterialEvaluationCountByWall,
      }),
      atrialFiberLogStrainObservationCountByWall: Object.freeze({
        ...counters.mechanics.atrialFiberLogStrainObservationCountByWall,
      }),
      atrialFiberLogStrainChangeCountByWall: Object.freeze({
        ...counters.mechanics.atrialFiberLogStrainChangeCountByWall,
      }),
      atrialFiberLogStrainDistinctInputCountByWall: Object.freeze({
        ...counters.mechanics.atrialFiberLogStrainDistinctInputCountByWall,
      }),
    }),
  });
}

export function advanceMainWireCoronaryMvcReferenceV2(
  previous: MainWireCoronaryMvcReferenceStateV2,
  input: Readonly<{
    acceptedTimeSec: number;
    acceptedRevision: number;
    mitralForwardFlowMlPerSec: number;
    effectiveFiberLogStrainByWall: MainWireCoronaryWallNumbersV2;
  }>,
): MainWireCoronaryMvcReferenceStateV2 {
  validateMvcReferenceState(previous);
  requireNonnegativeFinite(input.acceptedTimeSec, "acceptedTimeSec");
  if (!Number.isInteger(input.acceptedRevision) || input.acceptedRevision < 0) {
    throw new RangeError("acceptedRevision must be a non-negative integer");
  }
  requireFinite(input.mitralForwardFlowMlPerSec, "mitralForwardFlowMlPerSec");
  validateWallNumbers(input.effectiveFiberLogStrainByWall);
  const active = input.mitralForwardFlowMlPerSec
    > MITRAL_FORWARD_FLOW_ACTIVE_THRESHOLD_ML_PER_SEC;
  const closed = previous.mitralForwardFlowActive && !active;
  return Object.freeze({
    reference: closed
      ? shorteningReference(input.effectiveFiberLogStrainByWall)
      : shorteningReference(previous.reference.referenceFiberLogStrainByWall),
    referenceAcceptedTimeSec: closed
      ? input.acceptedTimeSec
      : previous.referenceAcceptedTimeSec,
    referenceRevision: closed
      ? input.acceptedRevision
      : previous.referenceRevision,
    mitralForwardFlowActive: active,
    acceptedMitralClosureEventCount:
      previous.acceptedMitralClosureEventCount + (closed ? 1 : 0),
  });
}

function evaluatePreparedCandidateMechanicsV2<TWallState>(
  mechanicsStep: WholeHeartMechanicsPreparedStepV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  volumesMl: WholeHeartMechanicsChamberValuesV1,
  pericardiumBinding: MainWireCommonPericardiumBindingV1,
  commonIntrathoracicPressureMmHg: number,
  impMechanism: MainWireCoronaryImpMechanismV2,
  evaluationCounters:
    MutableMainWireFiveWallCoronaryEvaluationCountersV2 | null,
  origin: "candidate-center" | "lv-rv-probe",
  useCandidateProbe: boolean,
): NonCoronaryCandidateMechanicsResultV1<
  MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>
> {
  if (evaluationCounters !== null) {
    if (origin === "candidate-center") {
      evaluationCounters.mechanics.candidateCenterEvaluationCount += 1;
    } else {
      evaluationCounters.mechanics.lvRvProbeEvaluationCount += 1;
    }
  }
  const mechanicsCandidate = useCandidateProbe
    ? evaluatePreparedWholeHeartMechanicsCandidateProbeV1(
      mechanicsStep,
      volumesMl,
    )
    : evaluatePreparedWholeHeartMechanicsTrialV1(
      mechanicsStep,
      volumesMl,
    );
  const mechanicsView: MainWireFiveWallCoronaryMechanicsViewV2<TWallState> =
    isWholeHeartMechanicsCandidateProbeV2(mechanicsCandidate)
      ? Object.freeze({
        candidateVolumesMl: mechanicsCandidate.candidateVolumesMl,
        transmuralPressuresMmHg:
          mechanicsCandidate.transmuralPressuresMmHg,
        ...(mechanicsCandidate.transmuralPressureVolumeTangentMmHgPerMl ===
            undefined
          ? {}
          : {
            transmuralPressureVolumeTangentMmHgPerMl:
              mechanicsCandidate
                .transmuralPressureVolumeTangentMmHgPerMl,
          }),
        diagnostics: Object.freeze({
          ...mechanicsCandidate.diagnostics,
          readback:
            inspectPreparedWholeHeartMechanicsCandidateProbeReadbackV1(
              mechanicsStep,
              mechanicsCandidate,
            ),
        }),
      })
      : mechanicsCandidate;
  if (evaluationCounters !== null) {
    recordTriSegProviderCountersV2(
      evaluationCounters,
      mechanicsView.diagnostics.readback,
    );
  }
  if (
    !mechanicsView.diagnostics.converged
    || !mechanicsView.diagnostics.finite
    || mechanicsView.diagnostics.errors.length > 0
  ) {
    throw new Error(
      `five-wall mechanics trial failed: ${
        mechanicsView.diagnostics.errors.join("; ")
          || "provider reported not-ready diagnostics"
      }`,
    );
  }
  const pericardium = evaluateMainWireCommonPericardiumBindingV1(
    pericardiumBinding,
    volumesMl,
  );
  const coronaryMechanicsCoupling =
    evaluateMainWireCoronaryMechanicsCouplingV1(mechanicsView, {
      commonIntrathoracicPressureMmHg,
      commonPericardialExcessPressureMmHg:
        pericardium.excessPressureMmHg,
    });
  const evaluation = Object.freeze({
    mechanicsCandidate,
    mechanicsView,
    pericardium,
    coronaryMechanicsCoupling,
    ...(impMechanism === "source-cep-land-active"
      ? {
        sourceIntramyocardialPressureMmHgByTerritoryLayer:
          evaluateAllCoronaryImpPressureV1(
            coronaryMechanicsCoupling.input,
            "intramyocardial",
          ),
      }
      : {}),
  });
  return Object.freeze({
    absolutePressuresMmHg: Object.freeze({
      LA: mechanicsView.transmuralPressuresMmHg.LA
        + commonIntrathoracicPressureMmHg
        + pericardium.excessPressureMmHg,
      LV: mechanicsView.transmuralPressuresMmHg.LV
        + commonIntrathoracicPressureMmHg
        + pericardium.excessPressureMmHg,
      RA: mechanicsView.transmuralPressuresMmHg.RA
        + commonIntrathoracicPressureMmHg
        + pericardium.excessPressureMmHg,
      RV: mechanicsView.transmuralPressuresMmHg.RV
        + commonIntrathoracicPressureMmHg
        + pericardium.excessPressureMmHg,
    }),
    ...(mechanicsView.transmuralPressureVolumeTangentMmHgPerMl === undefined
      ? {}
      : {
        absolutePressureTangent: absoluteChamberPressureTangent(
          mechanicsView.transmuralPressureVolumeTangentMmHgPerMl,
          pericardium,
        ),
      }),
    evaluation,
  });
}

function resolveCandidateCoronaryBoundaryV2(
  absoluteAorticPressureMmHg: number,
  absoluteRightAtrialPressureMmHg: number,
  mechanics: MainWireCoronaryBoundaryMechanicsViewV2,
  impMechanism: MainWireCoronaryImpMechanismV2,
  shorteningReference: MainWireCoronaryShorteningReferenceV2,
  shorteningImpPrior: MainWireCoronaryShorteningImpGainPriorV2,
): CoronaryHydraulicBoundaryInputV2 {
  return resolveMainWireCoronaryBoundaryV2(
    Object.freeze({
      absoluteAorticPressureMmHg,
      absoluteRightAtrialPressureMmHg,
      ...(mechanics.sourceIntramyocardialPressureMmHgByTerritoryLayer
        === undefined
        ? {}
        : {
          sourceIntramyocardialPressureMmHgByTerritoryLayer:
            mechanics.sourceIntramyocardialPressureMmHgByTerritoryLayer,
        }),
      mechanicsInput: mechanics.coronaryMechanicsCoupling.input,
      effectiveFiberLogStrainByWall:
        mechanics.coronaryMechanicsCoupling.effectiveFiberLogStrainByWall,
    }),
    impMechanism,
    shorteningReference,
    shorteningImpPrior,
  );
}

function buildCoronaryBoundaryDirectionsV2<TWallState>(
  candidate: NonCoronaryConservativeCompanionCandidateInputV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>
  >,
  mechanicsStep: WholeHeartMechanicsPreparedStepV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  pericardiumBinding: MainWireCommonPericardiumBindingV1,
  commonIntrathoracicPressureMmHg: number,
  baseBoundary: CoronaryHydraulicBoundaryInputV2,
  impMechanism: MainWireCoronaryImpMechanismV2,
  shorteningReference: MainWireCoronaryShorteningReferenceV2,
  shorteningImpPrior: MainWireCoronaryShorteningImpGainPriorV2,
  scaledStep: number,
  evaluationCounters:
    MutableMainWireFiveWallCoronaryEvaluationCountersV2 | null,
  useCandidateProbe: boolean,
): readonly CoronaryImplicitBoundaryDirectionV2[] | null {
  const tangent =
    candidate.dBoundaryAbsolutePressureDScaledIndependentVolume;
  if (tangent === null) return null;
  requirePositiveFinite(scaledStep, "outer scaled sensitivity step");
  const directionCount = candidate.independentNodeOrder.length;
  if (
    candidate.independentVolumeScalesMl.length !== directionCount
    || tangent.Ao.length !== directionCount
    || tangent.RA.length !== directionCount
  ) {
    throw new RangeError(
      "coronary boundary sensitivity order and tangent dimensions differ",
    );
  }
  const baseMechanics = candidate.candidateMechanicsEvaluation;
  const baseVolumes = baseMechanics.mechanicsView.candidateVolumesMl;
  const directionForBoundary = (
    absoluteAorticPressureMmHg: number,
    absoluteRightAtrialPressureMmHg: number,
    mechanics: MainWireCoronaryBoundaryMechanicsViewV2,
  ): CoronaryHydraulicBoundaryInputV2 => resolveCandidateCoronaryBoundaryV2(
    absoluteAorticPressureMmHg,
    absoluteRightAtrialPressureMmHg,
    mechanics,
    impMechanism,
    shorteningReference,
    shorteningImpPrior,
  );
  const perturbedPressure = (
    basePressureMmHg: number,
    derivativeMmHgPerScaledVariable: number,
    sign: -1 | 1,
  ): number => {
    requireFinite(
      derivativeMmHgPerScaledVariable,
      "coronary outer boundary pressure derivative",
    );
    const perturbed = basePressureMmHg
      + sign * scaledStep * derivativeMmHgPerScaledVariable;
    requireFinite(
      perturbed,
      "perturbed coronary outer boundary pressure",
    );
    return perturbed;
  };
  const atrialDirection = (
    node: "LA" | "RA",
    index: number,
  ): CoronaryImplicitBoundaryDirectionV2 => {
    const volumeScaleMl = candidate.independentVolumeScalesMl[index]!;
    requirePositiveFinite(
      volumeScaleMl,
      `${node} independent volume scale`,
    );
    const volumeStepMl = scaledStep * volumeScaleMl;
    const minusVolumes = Object.freeze({
      ...baseVolumes,
      [node]: baseVolumes[node] - volumeStepMl,
    });
    const plusVolumes = Object.freeze({
      ...baseVolumes,
      [node]: baseVolumes[node] + volumeStepMl,
    });
    requirePositiveFinite(minusVolumes[node], `${node} minus probe volume`);

    // Atrial volume reaches this boundary only through its own pressure and
    // the common pericardial scalar. TriSeg pressure, ventricular fibre strain,
    // and active stress are invariant, so the base mechanics trial is reused.
    // This needs no impMechanism branch because each existing IMP mechanism
    // sees the same ventricular inputs plus the recomputed external pressure.
    const directionView = (
      volumesMl: WholeHeartMechanicsChamberValuesV1,
    ): MainWireCoronaryBoundaryMechanicsViewV2 => {
      const pericardium = evaluateMainWireCommonPericardiumBindingV1(
        pericardiumBinding,
        volumesMl,
      );
      const coronaryMechanicsCoupling =
        evaluateMainWireCoronaryMechanicsCouplingV1(
          baseMechanics.mechanicsView,
          Object.freeze({
            commonIntrathoracicPressureMmHg,
            commonPericardialExcessPressureMmHg:
              pericardium.excessPressureMmHg,
          }),
        );
      return Object.freeze({
        coronaryMechanicsCoupling,
        ...(impMechanism === "source-cep-land-active"
          ? {
            sourceIntramyocardialPressureMmHgByTerritoryLayer:
              evaluateAllCoronaryImpPressureV1(
                coronaryMechanicsCoupling.input,
                "intramyocardial",
              ),
          }
          : {}),
      });
    };
    return Object.freeze({
      scaledStep,
      minusBoundary: directionForBoundary(
        perturbedPressure(
          candidate.boundaryAbsolutePressuresMmHg.Ao,
          tangent.Ao[index]!,
          -1,
        ),
        perturbedPressure(
          candidate.boundaryAbsolutePressuresMmHg.RA,
          tangent.RA[index]!,
          -1,
        ),
        directionView(minusVolumes),
      ),
      plusBoundary: directionForBoundary(
        perturbedPressure(
          candidate.boundaryAbsolutePressuresMmHg.Ao,
          tangent.Ao[index]!,
          1,
        ),
        perturbedPressure(
          candidate.boundaryAbsolutePressuresMmHg.RA,
          tangent.RA[index]!,
          1,
        ),
        directionView(plusVolumes),
      ),
    });
  };
  const ventricularDirection = (
    node: "LV" | "RV",
    index: number,
  ): CoronaryImplicitBoundaryDirectionV2 => {
    const volumeScaleMl = candidate.independentVolumeScalesMl[index]!;
    requirePositiveFinite(
      volumeScaleMl,
      `${node} independent volume scale`,
    );
    const volumeStepMl = scaledStep * volumeScaleMl;
    const minusVolumes = Object.freeze({
      ...baseVolumes,
      [node]: baseVolumes[node] - volumeStepMl,
    });
    const plusVolumes = Object.freeze({
      ...baseVolumes,
      [node]: baseVolumes[node] + volumeStepMl,
    });
    requirePositiveFinite(minusVolumes[node], `${node} minus probe volume`);

    // The ventricular fibre-strain and active-stress rows are an optional
    // acceleration contract. Their absence falls back to whole-heart mechanics
    // probes; the production provider supplies them from its TriSeg Schur solve.
    const analyticDirectionView = (
      volumesMl: WholeHeartMechanicsChamberValuesV1,
      signedVolumeDeltaMl: number,
    ): Readonly<{
      mechanics: MainWireCoronaryBoundaryMechanicsViewV2;
      absoluteRightAtrialPressureMmHg: number;
    }> | null => {
      const pericardium = evaluateMainWireCommonPericardiumBindingV1(
        pericardiumBinding,
        volumesMl,
      );
      const coronaryMechanicsCoupling =
        evaluateMainWireCoronaryMechanicsCouplingVentricularDirectionV1(
          baseMechanics.mechanicsView,
          Object.freeze({
            ventricularVolume: node,
            signedVolumeDeltaMl,
            commonIntrathoracicPressureMmHg,
            commonPericardialExcessPressureMmHg:
              pericardium.excessPressureMmHg,
          }),
        );
      if (coronaryMechanicsCoupling === null) return null;
      return Object.freeze({
        mechanics: Object.freeze({
          coronaryMechanicsCoupling,
          ...(impMechanism === "source-cep-land-active"
            ? {
              sourceIntramyocardialPressureMmHgByTerritoryLayer:
                evaluateAllCoronaryImpPressureV1(
                  coronaryMechanicsCoupling.input,
                  "intramyocardial",
                ),
            }
            : {}),
        }),
        // Ventricular volume cannot change the separate RA wall. Re-evaluating
        // the common pericardial scalar reconstructs this full-probe boundary.
        absoluteRightAtrialPressureMmHg:
          baseMechanics.mechanicsView.transmuralPressuresMmHg.RA
          + commonIntrathoracicPressureMmHg
          + pericardium.excessPressureMmHg,
      });
    };
    const minus = analyticDirectionView(minusVolumes, -volumeStepMl);
    if (minus === null) {
      if (evaluationCounters !== null) {
        evaluationCounters.mechanics
          .ventricularCoronaryBoundaryProbeFallbackCount += 1;
      }
      const minusMechanics = evaluatePreparedCandidateMechanicsV2(
        mechanicsStep,
        minusVolumes,
        pericardiumBinding,
        commonIntrathoracicPressureMmHg,
        impMechanism,
        evaluationCounters,
        "lv-rv-probe",
        useCandidateProbe,
      );
      const plusMechanics = evaluatePreparedCandidateMechanicsV2(
        mechanicsStep,
        plusVolumes,
        pericardiumBinding,
        commonIntrathoracicPressureMmHg,
        impMechanism,
        evaluationCounters,
        "lv-rv-probe",
        useCandidateProbe,
      );
      return Object.freeze({
        scaledStep,
        minusBoundary: directionForBoundary(
          perturbedPressure(
            candidate.boundaryAbsolutePressuresMmHg.Ao,
            tangent.Ao[index]!,
            -1,
          ),
          minusMechanics.absolutePressuresMmHg.RA,
          minusMechanics.evaluation,
        ),
        plusBoundary: directionForBoundary(
          perturbedPressure(
            candidate.boundaryAbsolutePressuresMmHg.Ao,
            tangent.Ao[index]!,
            1,
          ),
          plusMechanics.absolutePressuresMmHg.RA,
          plusMechanics.evaluation,
        ),
      });
    }
    const plus = analyticDirectionView(plusVolumes, volumeStepMl);
    if (plus === null) {
      throw new Error(
        "ventricular coronary analytic rows disappeared within one direction",
      );
    }
    return Object.freeze({
      scaledStep,
      minusBoundary: directionForBoundary(
        perturbedPressure(
          candidate.boundaryAbsolutePressuresMmHg.Ao,
          tangent.Ao[index]!,
          -1,
        ),
        minus.absoluteRightAtrialPressureMmHg,
        minus.mechanics,
      ),
      plusBoundary: directionForBoundary(
        perturbedPressure(
          candidate.boundaryAbsolutePressuresMmHg.Ao,
          tangent.Ao[index]!,
          1,
        ),
        plus.absoluteRightAtrialPressureMmHg,
        plus.mechanics,
      ),
    });
  };

  return Object.freeze(candidate.independentNodeOrder.map((node, index) => {
    if (node === "Ao") {
      return Object.freeze({
        scaledStep,
        minusBoundary: directionForBoundary(
          perturbedPressure(
            candidate.boundaryAbsolutePressuresMmHg.Ao,
            tangent.Ao[index]!,
            -1,
          ),
          perturbedPressure(
            candidate.boundaryAbsolutePressuresMmHg.RA,
            tangent.RA[index]!,
            -1,
          ),
          baseMechanics,
        ),
        plusBoundary: directionForBoundary(
          perturbedPressure(
            candidate.boundaryAbsolutePressuresMmHg.Ao,
            tangent.Ao[index]!,
            1,
          ),
          perturbedPressure(
            candidate.boundaryAbsolutePressuresMmHg.RA,
            tangent.RA[index]!,
            1,
          ),
          baseMechanics,
        ),
      }) satisfies CoronaryImplicitBoundaryDirectionV2;
    }
    if (node === "LA" || node === "RA") {
      return atrialDirection(node, index);
    }
    if (node === "LV" || node === "RV") {
      return ventricularDirection(node, index);
    }
    // All remaining vascular independent columns leave the three coronary
    // boundary owners (Ao, RA, and mechanics-derived IMP) unchanged.
    return Object.freeze({
      scaledStep,
      minusBoundary: baseBoundary,
      plusBoundary: baseBoundary,
    }) satisfies CoronaryImplicitBoundaryDirectionV2;
  }));
}

function validateCoupledTrial<TWallState>(
  previous: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
  circulation: NonCoronaryCirculationTrialSuccessV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>,
    MainWireFiveWallCoronaryCompanionTrialV2
  >,
  mechanics: WholeHeartMechanicsTrialV1<TWallState>,
): void {
  const companion = circulation.conservativeCompanion;
  if (companion === undefined) {
    throw new Error("coronary V2 coupled trial is missing companion readback");
  }
  const coronary = companion.candidateCompanionTrial.coronaryTrial;
  if (
    circulation.baseRevision !== previous.circulation.revision
    || mechanics.baseRevision !== previous.mechanics.revision
    || coronary.baseAcceptedRevision !== previous.coronary.revision
    || !nearlyEqual(
      coronary.baseAcceptedTimeSec,
      previous.coronary.acceptedTimeSec,
    )
    || !nearlyEqual(circulation.candidateTimeSec, mechanics.candidateTimeSec)
    || !nearlyEqual(
      circulation.candidateTimeSec,
      coronary.candidateAcceptedState.acceptedTimeSec,
    )
    || !nearlyEqual(circulation.dtSec, mechanics.stepDtSec)
    || !nearlyEqual(circulation.dtSec, coronary.dtSec)
  ) {
    throw new Error(
      "coupled circulation/mechanics/coronary V2 trial identity mismatch",
    );
  }
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (!nearlyEqual(
      circulation.candidateNodeVolumesMl[chamber],
      mechanics.candidateVolumesMl[chamber],
    )) throw new Error(`coupled ${chamber} candidate volume mismatch`);
  }
  const hydraulics = coronary.diagnostics.hydraulics;
  if (
    !nearlyEqual(
      companion.candidateCompanionBloodVolumeMl,
      coronaryBloodVolumeMl(coronary.candidateAcceptedState),
    )
    || !nearlyEqual(
      companion.outerBoundaryNetVolumeRateMlPerSec.Ao,
      -hydraulics.totalInletFlowMlPerSec,
    )
    || !nearlyEqual(
      companion.outerBoundaryNetVolumeRateMlPerSec.RA,
      hydraulics.commonCoronaryVenousOutletFlowMlPerSec,
    )
  ) throw new Error("coronary V2 companion volume or boundary-rate mismatch");
}

function rollbackTuple<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
  circulationRollback: NonCoronaryCirculationAcceptedStateV1,
): MainWireFiveWallCoronaryAcceptedStateV2<TWallState> {
  return acceptedTuple(
    previous.revision,
    previous.fixedGlobalTotalBloodVolumeMl,
    previous.coronaryBinding,
    circulationRollback,
    previous.coronary,
    cloneWholeHeartMechanicsAcceptedStateV1(provider, previous.mechanics),
    previous.mvcReferenceState,
  );
}

function acceptedTuple<TWallState>(
  revision: number,
  fixedGlobalTotalBloodVolumeMl: number,
  coronaryBinding: MainWireFiveWallCoronaryBindingV2,
  circulation: NonCoronaryCirculationAcceptedStateV1,
  coronary: CoronaryAcceptedHydraulicStateV2,
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>,
  mvcReferenceState: MainWireCoronaryMvcReferenceStateV2,
): MainWireFiveWallCoronaryAcceptedStateV2<TWallState> {
  if (
    circulation.revision !== revision
    || coronary.revision !== revision
    || mechanics.revision !== revision
    || !nearlyEqual(circulation.acceptedTimeSec, coronary.acceptedTimeSec)
    || !nearlyEqual(circulation.acceptedTimeSec, mechanics.acceptedTimeSec)
  ) {
    throw new Error(
      "accepted circulation/mechanics/coronary V2 revisions or times differ",
    );
  }
  if (!nearlyEqual(
    circulation.totalBloodVolumeMl + coronaryBloodVolumeMl(coronary),
    fixedGlobalTotalBloodVolumeMl,
  )) throw new Error("accepted 31-volume partitions violate fixed global TBV");
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (!nearlyEqual(
      circulation.nodeVolumesMl[chamber],
      mechanics.acceptedVolumesMl[chamber],
    )) throw new Error(`accepted ${chamber} volume mismatch`);
  }
  validateBinding(coronaryBinding);
  validateMvcReferenceState(mvcReferenceState);
  if (
    mvcReferenceState.referenceRevision > revision
    || mvcReferenceState.referenceAcceptedTimeSec
      > circulation.acceptedTimeSec + 1e-12
  ) throw new Error("MVC reference is newer than the accepted tuple");
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    revision,
    acceptedTimeSec: circulation.acceptedTimeSec,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBinding: Object.freeze({ ...coronaryBinding }),
    circulation,
    coronary,
    mechanics,
    mvcReferenceState: copyMvcReferenceState(mvcReferenceState),
  });
}

export function validateMainWireFiveWallCoronaryAcceptedStateV2<TWallState>(
  state: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
): void {
  validateAcceptedTuple(state);
}

function validateAcceptedTuple<TWallState>(
  state: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
): void {
  if (validatedMainWireFiveWallCoronaryAcceptedStatesV2.has(state)) return;
  if (state.transactionId !== MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID) {
    throw new Error("accepted coupled coronary V2 transaction id is invalid");
  }
  acceptedTuple(
    state.revision,
    state.fixedGlobalTotalBloodVolumeMl,
    state.coronaryBinding,
    state.circulation,
    state.coronary,
    state.mechanics,
    state.mvcReferenceState,
  );
  if (mainWireFiveWallCoronaryValidationSurfaceIsFrozenV2(state)) {
    validatedMainWireFiveWallCoronaryAcceptedStatesV2.add(state);
  }
}

function mainWireFiveWallCoronaryValidationSurfaceIsFrozenV2<TWallState>(
  state: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
): boolean {
  return Object.isFrozen(state)
    && Object.isFrozen(state.coronaryBinding)
    && Object.isFrozen(state.circulation)
    && Object.isFrozen(state.circulation.nodeVolumesMl)
    && Object.isFrozen(state.coronary)
    && Object.isFrozen(state.coronary.volumeMlByNode)
    && Object.isFrozen(state.mechanics)
    && Object.isFrozen(state.mechanics.acceptedVolumesMl)
    && Object.isFrozen(state.mvcReferenceState)
    && Object.isFrozen(state.mvcReferenceState.reference)
    && Object.isFrozen(
      state.mvcReferenceState.reference.referenceFiberLogStrainByWall,
    );
}

function buildBinding(
  prior: CoronaryTopologyPriorV2,
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2,
  impMechanism: MainWireCoronaryImpMechanismV2,
  shorteningImpPrior: MainWireCoronaryShorteningImpGainPriorV2,
): MainWireFiveWallCoronaryBindingV2 {
  return Object.freeze({
    topologyId: prior.topologyId,
    priorFingerprint: coronaryTopologyPriorFingerprintV2(prior),
    collapseHydraulicsFingerprint:
      coronaryConfigurationFingerprintV2(collapseHydraulics),
    boundaryResolverId: MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
    impMechanism,
    shorteningImpPriorFingerprint:
      coronaryConfigurationFingerprintV2(shorteningImpPrior),
    mvcReferenceSemantics:
      "previous-accepted-mitral-closure-fiber-strain-v1" as const,
  });
}

function validateBinding(binding: MainWireFiveWallCoronaryBindingV2): void {
  if (binding.topologyId !== CORONARY_TOPOLOGY_ID_V2) {
    throw new Error("coronary V2 binding topology id is unsupported");
  }
  if (binding.boundaryResolverId !== MAIN_WIRE_CORONARY_BOUNDARY_V2_ID) {
    throw new Error("coronary V2 binding boundary resolver is unsupported");
  }
  if (
    binding.impMechanism !== "source-cep-land-active"
    && binding.impMechanism !== "cep-only-control"
    && binding.impMechanism !== "cep-shortening-induced"
  ) {
    throw new Error("coronary V2 binding IMP mechanism is unsupported");
  }
  if (
    binding.mvcReferenceSemantics
    !== "previous-accepted-mitral-closure-fiber-strain-v1"
  ) {
    throw new Error("coronary V2 binding MVC reference semantics are unsupported");
  }
  for (const [label, value] of [
    ["prior", binding.priorFingerprint],
    ["collapse", binding.collapseHydraulicsFingerprint],
    ["shortening IMP", binding.shorteningImpPriorFingerprint],
  ] as const) {
    if (!/^fnv1a32-[0-9a-f]{8}$/.test(value)) {
      throw new Error(`${label} fingerprint must use the coronary FNV-1a contract`);
    }
  }
}

function assertSameBinding(
  accepted: MainWireFiveWallCoronaryBindingV2,
  requested: MainWireFiveWallCoronaryBindingV2,
): void {
  if (
    accepted.topologyId !== requested.topologyId
    || accepted.priorFingerprint !== requested.priorFingerprint
    || accepted.collapseHydraulicsFingerprint
      !== requested.collapseHydraulicsFingerprint
    || accepted.boundaryResolverId !== requested.boundaryResolverId
    || accepted.impMechanism !== requested.impMechanism
    || accepted.shorteningImpPriorFingerprint
      !== requested.shorteningImpPriorFingerprint
    || accepted.mvcReferenceSemantics !== requested.mvcReferenceSemantics
  ) {
    throw new Error("accepted coronary V2 binding and step configuration differ");
  }
}

function resolveCollapseHydraulics(
  prior: CoronaryTopologyPriorV2,
  supplied: CoronaryCollapseHydraulicsPriorV2 | undefined,
): CoronaryCollapseHydraulicsPriorV2 {
  if (supplied !== undefined) return supplied;
  return coronaryTopologyPriorFingerprintV2(prior)
    === MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2
    ? MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2
    : buildCoronaryCollapseHydraulicsPriorV2(
      buildCoronaryTopologyV2(prior),
    );
}

function initialMvcReferenceState(
  timeSec: number,
  fiberLogStrainByWall: MainWireCoronaryWallNumbersV2,
): MainWireCoronaryMvcReferenceStateV2 {
  return Object.freeze({
    reference: shorteningReference(fiberLogStrainByWall),
    referenceAcceptedTimeSec: timeSec,
    referenceRevision: 0,
    mitralForwardFlowActive: false,
    acceptedMitralClosureEventCount: 0,
  });
}

function shorteningReference(
  fiberLogStrainByWall: MainWireCoronaryWallNumbersV2,
): MainWireCoronaryShorteningReferenceV2 {
  validateWallNumbers(fiberLogStrainByWall);
  return Object.freeze({
    referenceFiberLogStrainByWall: Object.freeze({
      ...fiberLogStrainByWall,
    }),
  });
}

function copyMvcReferenceState(
  state: MainWireCoronaryMvcReferenceStateV2,
): MainWireCoronaryMvcReferenceStateV2 {
  return Object.freeze({
    ...state,
    reference: shorteningReference(
      state.reference.referenceFiberLogStrainByWall,
    ),
  });
}

function validateMvcReferenceState(
  state: MainWireCoronaryMvcReferenceStateV2,
): void {
  validateWallNumbers(state.reference.referenceFiberLogStrainByWall);
  requireNonnegativeFinite(
    state.referenceAcceptedTimeSec,
    "MVC referenceAcceptedTimeSec",
  );
  if (!Number.isInteger(state.referenceRevision) || state.referenceRevision < 0) {
    throw new RangeError("MVC referenceRevision must be non-negative integer");
  }
  if (typeof state.mitralForwardFlowActive !== "boolean") {
    throw new TypeError("mitralForwardFlowActive must be boolean");
  }
  if (
    !Number.isInteger(state.acceptedMitralClosureEventCount)
    || state.acceptedMitralClosureEventCount < 0
  ) throw new RangeError("MVC event count must be non-negative integer");
}

function validateWallNumbers(value: MainWireCoronaryWallNumbersV2): void {
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    requireFinite(value[wallId], `${wallId} fiber log strain`);
  }
}

function createCanonicalNonCoronaryPartitionV2(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  fixedGlobalTotalBloodVolumeMl: number,
  coronaryVolumeMl: number,
  timeSec: number,
): NonCoronaryCirculationAcceptedStateV1 {
  const targetNonCoronaryBloodVolumeMl =
    fixedGlobalTotalBloodVolumeMl - coronaryVolumeMl;
  requirePositiveFinite(
    targetNonCoronaryBloodVolumeMl,
    "target non-coronary blood volume",
  );
  const operatingPoint = resolveMainWireNormalAdultBloodVolumeProtocolTargetV1(
    runtime,
    targetNonCoronaryBloodVolumeMl,
  );
  return createInitialNonCoronaryCirculationStateV1({
    fixedTotalBloodVolumeMl: operatingPoint.fixedTotalBloodVolumeMl,
    nodeVolumesMl: operatingPoint.nodeVolumesMl,
    timeSec,
    runtime,
  });
}

function assertSameChamberVolumes(
  left: NonCoronaryCirculationAcceptedStateV1,
  right: NonCoronaryCirculationAcceptedStateV1,
  label: string,
): void {
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (!nearlyEqual(
      left.nodeVolumesMl[chamber],
      right.nodeVolumesMl[chamber],
    )) throw new Error(`${label} changed ${chamber} cold volume`);
  }
}

function absoluteAorticPressureMmHg(
  circulation: NonCoronaryCirculationAcceptedStateV1,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): number {
  const graph = buildNonCoronaryCirculationGraphV1();
  const node = graph.nodes[graph.nodeIndex.get("Ao")!];
  if (node.name !== "Ao" || node.ext !== undefined) {
    throw new Error("main-wire Ao boundary topology changed");
  }
  return vascularTransmuralPressureFromPhysicalVolumeV1(
    node,
    circulation.nodeVolumesMl.Ao,
    runtime.vascular,
    "adaptive-volume-tolerance",
  );
}

function coronaryBloodVolumeMl(
  state: CoronaryAcceptedHydraulicStateV2,
): number {
  return CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce(
    (sum, nodeId) => sum + state.volumeMlByNode[nodeId],
    0,
  );
}

function chamberVolumes(
  circulation: NonCoronaryCirculationAcceptedStateV1,
): Readonly<{ LA: number; LV: number; RA: number; RV: number }> {
  return Object.freeze({
    LA: circulation.nodeVolumesMl.LA,
    LV: circulation.nodeVolumesMl.LV,
    RA: circulation.nodeVolumesMl.RA,
    RV: circulation.nodeVolumesMl.RV,
  });
}

function commonIntrathoracicPressureMmHg(
  timeSec: number,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): number {
  return respiratoryExternalPressureForKindV1(
    "pth",
    timeSec,
    runtime.respiratory,
  );
}

function resolveCalciumDriveV2(
  timeSec: number,
  params: FiveWallNormalCalciumDriveParamsV1,
  override: MainWireFiveWallFreeCalciumDriveV1 | undefined,
): MainWireFiveWallFreeCalciumDriveV1 {
  const source = override ?? Object.freeze({
    freeCalciumUMByWall: evaluateFiveWallNormalCalciumDriveV1(
      timeSec,
      params,
    ).freeCalciumUMByWall,
  });
  if (
    source === null
    || typeof source !== "object"
    || Array.isArray(source)
    || Object.keys(source).length !== 1
    || !Object.hasOwn(source, "freeCalciumUMByWall")
  ) {
    throw new Error("five-wall calcium drive must contain exactly one wall record");
  }
  const record = source.freeCalciumUMByWall;
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    throw new Error("five-wall free-calcium record must be an object");
  }
  const wallIds = ["LA", "LVFW", "SEP", "RVFW", "RA"] as const;
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [...wallIds].sort();
  if (
    actualKeys.length !== expectedKeys.length
    || actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error("five-wall free-calcium record keys mismatch");
  }
  return Object.freeze({
    freeCalciumUMByWall: Object.freeze(Object.fromEntries(wallIds.map(
      (wallId) => {
        const value = record[wallId];
        requireNonnegativeFinite(value, `${wallId} free calcium`);
        return [wallId, value];
      },
    ))) as MainWireFiveWallFreeCalciumDriveV1["freeCalciumUMByWall"],
  });
}

function absoluteChamberPressureTangent(
  transmural: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  pericardium: MainWireCommonPericardiumEvaluationV1,
): NonCoronaryAbsoluteChamberPressureTangentV1 {
  const commonPericardiumTangentMmHgPerMl =
    pericardium.pressureDerivativePaPerM3 * 1e-6 / PA_PER_MMHG;
  requireFinite(
    commonPericardiumTangentMmHgPerMl,
    "common pericardium pressure tangent",
  );
  const matrix = NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map(
    (pressureChamber) => Object.freeze(
      NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map((volumeChamber) => {
        const intrinsic = transmural[pressureChamber][volumeChamber];
        requireFinite(
          intrinsic,
          `${pressureChamber}/${volumeChamber} transmural pressure tangent`,
        );
        return intrinsic + commonPericardiumTangentMmHgPerMl;
      }),
    ),
  ) as unknown as NonCoronaryAbsoluteChamberPressureTangentV1[
    "dPressureDVolumeMmHgPerMl"
  ];
  return Object.freeze({
    rowPressureOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    columnVolumeOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    units: "mmHg/mL" as const,
    pressureKind: "absolute" as const,
    derivativeSemantics:
      "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive" as const,
    dPressureDVolumeMmHgPerMl: matrix,
  });
}

function requirePositiveFinite(value: number, label: string): void {
  requireFinite(value, label);
  if (!(value > 0)) throw new RangeError(`${label} must be positive`);
}

function requireNonnegativeFinite(value: number, label: string): void {
  requireFinite(value, label);
  if (value < 0) throw new RangeError(`${label} must be non-negative`);
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right)
    <= 1e-10 * Math.max(1, Math.abs(left), Math.abs(right));
}
