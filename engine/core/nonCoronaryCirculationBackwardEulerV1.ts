import {
  buildAuthoritativeCirculationGraphV1,
  downstreamEffectivePressureAndDerivativeV1,
  downstreamEffectivePressureV1,
  effectiveUnstressedVolumeFromNodeV1,
  physicalColdSeedVolumeFromNodeV1,
  incidenceVolumeRatesFromEdgeFlowsV1,
  nonValveEdgeLossV1,
  nonValveEdgeLossAndPressureDerivativesV1,
  respiratoryExternalPressureForKindV1,
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
  type BaseEdgeLossRuntimeParameterViewV1,
  type RespiratoryPressureParameterViewV1,
  type VascularPvRuntimeParameterViewV1,
} from "@/engine/core/circulationGraphKernelV1";
import type { EdgeSpec, NodeSpec } from "@/engine/core/topology";
import {
  validateMainWireFourValveDiseasePresetV1,
  type MainWireFourValveDiseasePresetV1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";
import {
  initialMainWireQuasiSteadyOrificeValveStateV2,
  stepMainWireQuasiSteadyOrificeValveV2,
  type MainWireQuasiSteadyOrificeValveEvaluationV2,
  type MainWireQuasiSteadyOrificeValveStateV2,
} from "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV2";
import { stressedVolumeFromPtm } from "@/engine/vascularPv";
import { evaluateIabpV1 } from "@/engine/devices/iabpV1";
import {
  evaluateMechanicalSupportHydraulicsV1,
  validateMechanicalSupportConfigV1,
} from "@/engine/devices/networkV1";
import type {
  MechanicalSupportConfigV1,
  MechanicalSupportHydraulicEvaluationV1,
} from "@/engine/devices/typesV1";

export const NON_CORONARY_CIRCULATION_BE_V1_ID =
  "main-wire-derived-noncoronary-experimental-backward-euler-v1" as const;

export const NON_CORONARY_NODE_NAMES_V1 = Object.freeze([
  "LV", "LA", "RV", "RA",
  "Ao", "SA", "Art", "Cap", "SV", "VC",
  "PA", "PArt", "PCap", "PVen", "PVein",
] as const);
export type NonCoronaryNodeNameV1 =
  (typeof NON_CORONARY_NODE_NAMES_V1)[number];

export const NON_CORONARY_EDGE_NAMES_V1 = Object.freeze([
  "MV", "AoV", "TV", "PV",
  "Ao_SA", "SA_Art", "Art_Cap", "Cap_SV", "SV_VC", "VC_RA",
  "PA_PArt", "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA",
] as const);
export type NonCoronaryEdgeNameV1 =
  (typeof NON_CORONARY_EDGE_NAMES_V1)[number];

export const NON_CORONARY_DYNAMIC_EDGE_NAMES_V1 = Object.freeze([
  "Ao_SA", "PA_PArt",
] as const);
export type NonCoronaryDynamicEdgeNameV1 =
  (typeof NON_CORONARY_DYNAMIC_EDGE_NAMES_V1)[number];

export const NON_CORONARY_VALVE_NAMES_V1 = Object.freeze([
  "MV", "AoV", "TV", "PV",
] as const);
export type NonCoronaryValveNameV1 =
  (typeof NON_CORONARY_VALVE_NAMES_V1)[number];

export const NON_CORONARY_CIRCULATION_SCOPE_V1 = Object.freeze({
  topologySource: "main-wire-buildNodes-buildEdges" as const,
  dynamicsOwner: "independent-experimental-backward-euler" as const,
  modelCoreRuntimeAdopted: false as const,
  includedNodes: NON_CORONARY_NODE_NAMES_V1,
  includedEdges: NON_CORONARY_EDGE_NAMES_V1,
  excludedCoronaryNodes: Object.freeze([
    "LAD_Art", "LAD_IM", "LAD_Ven",
    "LCx_Art", "LCx_IM", "LCx_Ven",
    "RCA_Art", "RCA_IM", "RCA_Ven", "CS",
  ] as const),
  excludedCoronaryEdges: Object.freeze([
    "Ao_LAD", "LAD_Art_IM", "LAD_IM_Ven", "LAD_Ven_CS",
    "Ao_LCx", "LCx_Art_IM", "LCx_IM_Ven", "LCx_Ven_CS",
    "Ao_RCA", "RCA_Art_IM", "RCA_IM_Ven", "RCA_Ven_CS", "CS_RA",
  ] as const),
  dependentBloodVolumeNode: "SV" as const,
  valveOwner: "MainWireQuasiSteadyOrificeValveV2" as const,
  valveAcceptedMemory: "leaflet-opening-fraction-only" as const,
  valveFlow: "algebraic-candidate-readback" as const,
  valveLocalBulkInertance: "omitted-from-canonical" as const,
  semilunarRootInertanceOwners: Object.freeze({
    AoV: "Ao_SA" as const,
    PV: "PA_PArt" as const,
  }),
  valveLegacyEdgeHydraulicsUsed: false as const,
  coronaryBloodVolumeIncluded: false as const,
  chamberPressureCallback: "absolute-pressure-mmHg" as const,
  chamberPressureTangent:
    "optional-same-candidate-absolute-4x4-mmHg-per-mL" as const,
  circulationJacobian:
    "analytic-semismooth-when-pressure-tangent-available-otherwise-full-fd" as const,
  pericardialConstraintOwnedHere: false as const,
  parameterFittingAllowed: false as const,
  reverseFlowCapOrClampOnNonvalveEdges: false as const,
});

export const NON_CORONARY_CIRCULATION_UNITS_V1 = Object.freeze({
  time: "s" as const,
  nodeVolume: "mL" as const,
  pressure: "mmHg" as const,
  edgeFlow: "mL/s" as const,
  linearResistance: "mmHg*s/mL" as const,
  inertance: "mmHg*s^2/mL" as const,
  quadraticResistance: "mmHg*s^2/mL^2" as const,
});

type NodeRecord<T> = Readonly<Record<NonCoronaryNodeNameV1, T>>;
type EdgeRecord<T> = Readonly<Record<NonCoronaryEdgeNameV1, T>>;
type DynamicEdgeRecord<T> = Readonly<Record<NonCoronaryDynamicEdgeNameV1, T>>;
type ValveRecord<T> = Readonly<Record<NonCoronaryValveNameV1, T>>;

export type NonCoronaryChamberVolumesMlV1 = Readonly<{
  LV: number;
  LA: number;
  RV: number;
  RA: number;
}>;

export type NonCoronaryChamberPressuresMmHgV1 = Readonly<{
  LV: number;
  LA: number;
  RV: number;
  RA: number;
}>;

export const NON_CORONARY_CHAMBER_TANGENT_ORDER_V1 = Object.freeze([
  "LV",
  "LA",
  "RV",
  "RA",
] as const);
export type NonCoronaryChamberNameV1 =
  (typeof NON_CORONARY_CHAMBER_TANGENT_ORDER_V1)[number];
export type NonCoronaryChamberPressureTangentMatrixV1 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
];

/**
 * Same-candidate algorithmic derivative of absolute chamber-node pressure.
 * The callback owns composition of transmural mechanics, common pericardium,
 * and any other chamber pressure offset. The circulation kernel must not add
 * the common-pericardium rank-one term a second time.
 */
export type NonCoronaryAbsoluteChamberPressureTangentV1 = Readonly<{
  rowPressureOrder: typeof NON_CORONARY_CHAMBER_TANGENT_ORDER_V1;
  columnVolumeOrder: typeof NON_CORONARY_CHAMBER_TANGENT_ORDER_V1;
  units: "mmHg/mL";
  pressureKind: "absolute";
  derivativeSemantics:
    "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive";
  dPressureDVolumeMmHgPerMl:
    NonCoronaryChamberPressureTangentMatrixV1;
}>;

export type NonCoronaryCandidateMechanicsResultV1<TEvaluation> = Readonly<{
  /** Absolute chamber-node pressures; callback owns any pericardial offset. */
  absolutePressuresMmHg: NonCoronaryChamberPressuresMmHgV1;
  /**
   * Optional only for custom/test compatibility. When present, the circulation
   * Newton uses the analytic/semismooth Jacobian. When absent, it explicitly
   * falls back to the historical full finite-difference Jacobian.
   */
  absolutePressureTangent?: NonCoronaryAbsoluteChamberPressureTangentV1;
  /** Opaque readback only. This circulation kernel never commits mechanics. */
  evaluation: TEvaluation;
}>;

export type NonCoronaryCandidateMechanicsCallbackV1<TEvaluation> = (
  chamberVolumesMl: NonCoronaryChamberVolumesMlV1,
  candidateTimeSec: number,
) => NonCoronaryCandidateMechanicsResultV1<TEvaluation>;

export type NonCoronaryCirculationRuntimeParamsV1 = Readonly<{
  vascular: VascularPvRuntimeParameterViewV1;
  losses: BaseEdgeLossRuntimeParameterViewV1;
  respiratory: RespiratoryPressureParameterViewV1;
  /** Explicit even for normal, so numeric identity and provenance cannot diverge. */
  valvePreset: MainWireFourValveDiseasePresetV1;
}>;

/**
 * Optional same-candidate device extension. It is deliberately a trial input,
 * rather than part of the immutable adult-0.2.0 runtime release contract.
 */
export type NonCoronaryMechanicalSupportInputV1 = Readonly<{
  config: MechanicalSupportConfigV1;
  /** Used only to map accepted time to IABP beat phase. */
  heartRateBpm: number;
}>;

export type NonCoronaryCirculationGraphV1 = Readonly<{
  topologyId: typeof NON_CORONARY_CIRCULATION_BE_V1_ID;
  nodes: readonly NodeSpec[];
  edges: readonly EdgeSpec[];
  nodeIndex: ReadonlyMap<string, number>;
  edgeIndex: ReadonlyMap<string, number>;
  scope: typeof NON_CORONARY_CIRCULATION_SCOPE_V1;
}>;

export type NonCoronaryCirculationAcceptedStateV1 = Readonly<{
  transactionId: typeof NON_CORONARY_CIRCULATION_BE_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  /** Fixed conserved-volume owner; never re-derived during state promotion. */
  totalBloodVolumeMl: number;
  nodeVolumesMl: NodeRecord<number>;
  dynamicEdgeFlowsMlPerSec: DynamicEdgeRecord<number>;
  valveStates: ValveRecord<MainWireQuasiSteadyOrificeValveStateV2>;
}>;

export type NonCoronaryCirculationColdSeedV1 = Readonly<{
  fixedTotalBloodVolumeMl: number;
  nodeVolumesMl: NodeRecord<number>;
}>;

export const NON_CORONARY_CIRCULATION_CHECKPOINT_V1_ID =
  "main-wire-noncoronary-circulation-checkpoint-v1" as const;
export type NonCoronaryCirculationCheckpointV1 = Readonly<{
  checkpointId: typeof NON_CORONARY_CIRCULATION_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  state: NonCoronaryCirculationAcceptedStateV1;
  stateFingerprint: string;
}>;

export type NonCoronaryCirculationInitialStateInputV1 = Readonly<{
  timeSec: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  /** Explicit conserved-volume owner for this circulation transaction. */
  fixedTotalBloodVolumeMl: number;
  nodeVolumesMl?: NodeRecord<number>;
  dynamicEdgeFlowsMlPerSec?: DynamicEdgeRecord<number>;
  valveStates?: ValveRecord<MainWireQuasiSteadyOrificeValveStateV2>;
}>;

export type NonCoronaryCirculationNewtonOptionsV1 = Readonly<{
  maxIterations?: number;
  /** Absolute term in the per-node mixed continuity-residual gate. */
  absoluteContinuityResidualToleranceMl?: number;
  scaledResidualInfinityTolerance?: number;
  scaledUpdateInfinityTolerance?: number;
  finiteDifferenceScaledStep?: number;
  maximumLineSearchBacktracks?: number;
  /** Development/test-only; production leaves the expensive shadow disabled. */
  analyticJacobianFiniteDifferenceShadow?: boolean;
}>;

/**
 * Protocol-only hydraulic intervention. This is intentionally separate from
 * the case/runtime parameterization: it represents a transient external
 * occlusion (for example an IVC-like preload reduction), not a new vascular
 * phenotype or a persistent controller value.
 */
export type NonCoronaryProtocolResistanceScaleByEdgeV1 = Readonly<
  Partial<Record<NonCoronaryEdgeNameV1, number>>
>;

export type NonCoronaryIndependentNodeNameV1 = Exclude<
  NonCoronaryNodeNameV1,
  "SV"
>;

export const NON_CORONARY_CONSERVATIVE_COMPANION_BOUNDARY_NODES_V1 =
  Object.freeze(["Ao", "RA"] as const);
export type NonCoronaryConservativeCompanionBoundaryNodeV1 =
  (typeof NON_CORONARY_CONSERVATIVE_COMPANION_BOUNDARY_NODES_V1)[number];

export type NonCoronaryIndependentNodeRecordV1<T> = Readonly<
  Record<NonCoronaryIndependentNodeNameV1, T>
>;
export type NonCoronaryCompanionBoundaryRecordV1<T> = Readonly<
  Record<NonCoronaryConservativeCompanionBoundaryNodeV1, T>
>;

/**
 * Same-candidate input for an optional conservative implicit companion.
 *
 * The companion is deliberately generic: the circulation core never imports
 * a device, coronary, renal, or other subsystem type. Implementations must be
 * pure with respect to accepted state. In particular, every Newton/line-search
 * probe must start from the same previous accepted companion state rather than
 * from the preceding candidate evaluation.
 */
export type NonCoronaryConservativeCompanionCandidateInputV1<TEvaluation> =
  Readonly<{
    candidateTimeSec: number;
    dtSec: number;
    fixedGlobalTotalBloodVolumeMl: number;
    independentNodeOrder: readonly NonCoronaryIndependentNodeNameV1[];
    scaledIndependentVolumes: readonly number[];
    independentVolumeScalesMl: readonly number[];
    candidateIndependentNodeVolumesMl:
      NonCoronaryIndependentNodeRecordV1<number>;
    boundaryAbsolutePressuresMmHg:
      NonCoronaryCompanionBoundaryRecordV1<number>;
    /** Null when the mechanics callback did not provide its algorithmic tangent. */
    dBoundaryAbsolutePressureDScaledIndependentVolume:
      NonCoronaryCompanionBoundaryRecordV1<readonly number[]> | null;
    /** Opaque to this core; the companion implementation owns interpretation. */
    candidateMechanicsEvaluation: TEvaluation;
  }>;

export type NonCoronaryConservativeCompanionSensitivitiesV1 = Readonly<{
  dCandidateCompanionBloodVolumeMlDScaledIndependentVolume:
    readonly number[];
  dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume:
    NonCoronaryCompanionBoundaryRecordV1<readonly number[]>;
}>;

export type NonCoronaryConservativeCompanionCandidateEvaluationV1<
  TCompanionTrial,
> = Readonly<{
  /** All conserved volume states owned by the companion at this candidate. */
  candidateCompanionBloodVolumeMl: number;
  /**
   * Net rate INTO each outer boundary node. For a coronary companion this is
   * normally negative at Ao (uptake) and positive at RA (venous return).
   */
  outerBoundaryNetVolumeRateMlPerSec:
    NonCoronaryCompanionBoundaryRecordV1<number>;
  /** Opaque pure trial; only the companion-aware transaction may promote it. */
  candidateCompanionTrial: TCompanionTrial;
  /** Omission is valid and explicitly selects the full finite-difference Jacobian. */
  sensitivities?: NonCoronaryConservativeCompanionSensitivitiesV1;
}>;

export type NonCoronaryConservativeCompanionAdapterV1<
  TEvaluation,
  TCompanionTrial,
> = Readonly<{
  /** Sole global conserved-volume owner for the coupled transaction. */
  fixedGlobalTotalBloodVolumeMl: number;
  /** Ledger value from the same previous accepted companion state. */
  previousAcceptedCompanionBloodVolumeMl: number;
  evaluateSameCandidate: (
    input: NonCoronaryConservativeCompanionCandidateInputV1<TEvaluation>,
  ) => NonCoronaryConservativeCompanionCandidateEvaluationV1<TCompanionTrial>;
}>;

export type NonCoronaryCirculationTrialInputV1<
  TEvaluation,
  TCompanionTrial = never,
> = Readonly<{
  previousAcceptedState: NonCoronaryCirculationAcceptedStateV1;
  dtSec: number;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  mechanicalSupport?: NonCoronaryMechanicalSupportInputV1;
  evaluateCandidateMechanics:
    NonCoronaryCandidateMechanicsCallbackV1<TEvaluation>;
  options?: NonCoronaryCirculationNewtonOptionsV1;
  protocolResistanceScaleByEdge?:
    NonCoronaryProtocolResistanceScaleByEdgeV1;
  conservativeCompanion?: NonCoronaryConservativeCompanionAdapterV1<
    TEvaluation,
    TCompanionTrial
  >;
}>;

export type NonCoronaryCirculationTrialDiagnosticsV1 = Readonly<{
  iterations: number;
  acceptedLineSearchSteps: number;
  lineSearchBacktracks: number;
  finalScaledResidualInfinityNorm: number;
  finalMixedContinuityResidualInfinityNorm: number;
  absoluteContinuityResidualToleranceMl: number;
  relativeContinuityResidualTolerance: number;
  finalMaximumContinuityResidualMl: number;
  dependentNodeContinuityResidualMl: number;
  totalBloodVolumeErrorMl: number;
  jacobianMode:
    | "not-required"
    | "analytic-semismooth"
    | "full-fd-fallback"
    | "mixed";
  pressureTangentAvailableAtFinalCandidate: boolean;
  finiteDifferenceScaledStep: number | null;
  finiteDifferenceJacobianFallbackReason:
    | "absolute-chamber-pressure-tangent-not-provided"
    | "conservative-companion-sensitivities-not-provided"
    | null;
  analyticJacobianAssemblyCount: number;
  finiteDifferenceJacobianFallbackCount: number;
  finiteDifferenceJacobianShadowCount: number;
  jacobianMaximumAbsoluteShadowDifference: number | null;
  jacobianMaximumRelativeFrobeniusShadowDifference: number | null;
  mechanicsCallbackCallCount: number;
  mechanicsCallbackCacheHitCount: number;
  mechanicsCallbackUniqueCandidateCount: number;
  worstIndependentContinuityResidual: null | Readonly<{
    node: Exclude<NonCoronaryNodeNameV1, "SV">;
    residualMl: number;
    absoluteResidualMl: number;
    scaledResidual: number;
  }>;
  worstMixedContinuityResidual: null | Readonly<{
    node: NonCoronaryNodeNameV1;
    residualMl: number;
    absoluteResidualMl: number;
    toleranceMl: number;
    normalizedResidual: number;
  }>;
  failureNewtonTrace: readonly NonCoronaryNewtonFailureTraceEntryV1[];
  lineSearchFailure: NonCoronaryLineSearchFailureDiagnosticsV1 | null;
}>;

export type NonCoronaryLineSearchRejectionOwnerV1 =
  | "candidate-evaluation-exception"
  | "armijo-residual-rejection"
  | "mixed-equal"
  | "none";

export type NonCoronaryNewtonFailureTraceEntryV1 = Readonly<{
  iteration: number;
  currentScaledResidualInfinityNorm: number;
  updateScaledInfinityNorm: number | null;
  lineSearchAttemptCount: number;
  candidateEvaluationExceptionCount: number;
  armijoResidualRejectionCount: number;
  acceptedStepLength: number | null;
  acceptedTrialScaledResidualInfinityNorm: number | null;
}>;

export type NonCoronaryLineSearchFailureDiagnosticsV1 = Readonly<{
  iteration: number;
  attemptCount: number;
  candidateEvaluationExceptionCount: number;
  armijoResidualRejectionCount: number;
  dominantRejectionOwner: NonCoronaryLineSearchRejectionOwnerV1;
  lastCandidateEvaluationException: null | Readonly<{
    backtrackIndex: number;
    stepLength: number;
    message: string;
  }>;
  lastArmijoResidualRejection: null | Readonly<{
    backtrackIndex: number;
    stepLength: number;
    trialScaledResidualInfinityNorm: number;
    requiredMaximumScaledResidualInfinityNorm: number;
  }>;
}>;

export type NonCoronaryConservativeCompanionTrialReadbackV1<
  TCompanionTrial,
> = Readonly<{
  fixedGlobalTotalBloodVolumeMl: number;
  previousAcceptedCompanionBloodVolumeMl: number;
  candidateCompanionBloodVolumeMl: number;
  outerBoundaryNetVolumeRateMlPerSec:
    NonCoronaryCompanionBoundaryRecordV1<number>;
  candidateCompanionTrial: TCompanionTrial;
}>;

export type NonCoronaryCirculationTrialSuccessV1<
  TEvaluation,
  TCompanionTrial = never,
> = Readonly<{
  converged: true;
  transactionId: typeof NON_CORONARY_CIRCULATION_BE_V1_ID;
  baseRevision: number;
  baseAcceptedTimeSec: number;
  candidateTimeSec: number;
  dtSec: number;
  candidateNodeVolumesMl: NodeRecord<number>;
  candidateDynamicEdgeFlowsMlPerSec: DynamicEdgeRecord<number>;
  candidateValveStates: ValveRecord<MainWireQuasiSteadyOrificeValveStateV2>;
  nodeAbsolutePressuresMmHg: NodeRecord<number>;
  edgeFlowsMlPerSec: EdgeRecord<number>;
  valveEvaluations: ValveRecord<MainWireQuasiSteadyOrificeValveEvaluationV2>;
  candidateMechanicsEvaluation: TEvaluation;
  /** Present when a device configuration was supplied, including all-off. */
  mechanicalSupport?: MechanicalSupportHydraulicEvaluationV1;
  /** Absent at runtime on the immutable non-companion path. */
  conservativeCompanion?:
    NonCoronaryConservativeCompanionTrialReadbackV1<TCompanionTrial>;
  diagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  mechanicsCommitted: false;
  reverseFlowCapOrClampOnNonvalveEdges: false;
  units: typeof NON_CORONARY_CIRCULATION_UNITS_V1;
}>;

export type NonCoronaryCirculationTrialFailureReasonV1 =
  | "invalid-input"
  | "initial-evaluation-failed"
  | "jacobian-failed"
  | "singular-jacobian"
  | "line-search-failed"
  | "maximum-iterations";

export type NonCoronaryCirculationTrialFailureV1 = Readonly<{
  converged: false;
  transactionId: typeof NON_CORONARY_CIRCULATION_BE_V1_ID;
  reason: NonCoronaryCirculationTrialFailureReasonV1;
  message: string;
  rollbackState: NonCoronaryCirculationAcceptedStateV1;
  lastAcceptedCandidateNodeVolumesMl: NodeRecord<number>;
  diagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  mechanicsCommitted: false;
  units: typeof NON_CORONARY_CIRCULATION_UNITS_V1;
}>;

export type NonCoronaryCirculationTrialResultV1<
  TEvaluation,
  TCompanionTrial = never,
> =
  | NonCoronaryCirculationTrialSuccessV1<TEvaluation, TCompanionTrial>
  | NonCoronaryCirculationTrialFailureV1;

export function classifyNonCoronaryLineSearchRejectionOwnerV1(
  candidateEvaluationExceptionCount: number,
  armijoResidualRejectionCount: number,
): NonCoronaryLineSearchRejectionOwnerV1 {
  requireInteger(
    candidateEvaluationExceptionCount,
    "candidateEvaluationExceptionCount",
  );
  requireInteger(
    armijoResidualRejectionCount,
    "armijoResidualRejectionCount",
  );
  if (candidateEvaluationExceptionCount === 0
      && armijoResidualRejectionCount === 0) return "none";
  if (candidateEvaluationExceptionCount > armijoResidualRejectionCount) {
    return "candidate-evaluation-exception";
  }
  if (armijoResidualRejectionCount > candidateEvaluationExceptionCount) {
    return "armijo-residual-rejection";
  }
  return "mixed-equal";
}

type ConservativeCompanionCandidateEvaluationInternalV1<TCompanionTrial> =
  NonCoronaryConservativeCompanionCandidateEvaluationV1<TCompanionTrial>
  & Readonly<{
    fixedGlobalTotalBloodVolumeMl: number;
    previousAcceptedCompanionBloodVolumeMl: number;
  }>;

type CandidateEvaluation<TEvaluation, TCompanionTrial = never> = Readonly<{
  nodeVolumesMl: NodeRecord<number>;
  nodeAbsolutePressuresMmHg: NodeRecord<number>;
  edgeFlowsMlPerSec: EdgeRecord<number>;
  dynamicEdgeFlowsMlPerSec: DynamicEdgeRecord<number>;
  valveStates: ValveRecord<MainWireQuasiSteadyOrificeValveStateV2>;
  valveEvaluations: ValveRecord<MainWireQuasiSteadyOrificeValveEvaluationV2>;
  candidateMechanicsEvaluation: TEvaluation;
  mechanicalSupport: MechanicalSupportHydraulicEvaluationV1 | null;
  absoluteChamberPressureTangent:
    NonCoronaryAbsoluteChamberPressureTangentV1 | null;
  conservativeCompanion:
    ConservativeCompanionCandidateEvaluationInternalV1<TCompanionTrial>
    | null;
  continuityResidualMlByNode: NodeRecord<number>;
  scaledIndependentResidual: readonly number[];
}>;

type JacobianUsageDiagnosticsV1 = {
  analyticAssemblyCount: number;
  finiteDifferenceFallbackCount: number;
  finiteDifferenceShadowCount: number;
  maximumAbsoluteShadowDifference: number | null;
  maximumRelativeFrobeniusShadowDifference: number | null;
};

type MixedContinuityResidualAudit = Readonly<{
  infinityNorm: number;
  worst: NonNullable<
    NonCoronaryCirculationTrialDiagnosticsV1["worstMixedContinuityResidual"]
  >;
}>;

type MutableNewtonFailureTraceEntryV1 = {
  iteration: number;
  currentScaledResidualInfinityNorm: number;
  updateScaledInfinityNorm: number | null;
  lineSearchAttemptCount: number;
  candidateEvaluationExceptionCount: number;
  armijoResidualRejectionCount: number;
  acceptedStepLength: number | null;
  acceptedTrialScaledResidualInfinityNorm: number | null;
};

type CandidateMechanicsCache<TEvaluation> = {
  readonly values: CandidateMechanicsTimeCache<TEvaluation>;
  readonly jacobianUsage: JacobianUsageDiagnosticsV1;
  callCount: number;
  hitCount: number;
  uniqueCandidateCount: number;
};

type CandidateMechanicsTimeCache<TEvaluation> = Map<
  number,
  CandidateMechanicsLvCache<TEvaluation>
>;
type CandidateMechanicsLvCache<TEvaluation> = Map<
  number,
  CandidateMechanicsLaCache<TEvaluation>
>;
type CandidateMechanicsLaCache<TEvaluation> = Map<
  number,
  CandidateMechanicsRvCache<TEvaluation>
>;
type CandidateMechanicsRvCache<TEvaluation> = Map<
  number,
  CandidateMechanicsRaCache<TEvaluation>
>;
type CandidateMechanicsRaCache<TEvaluation> = Map<
  number,
  NonCoronaryCandidateMechanicsResultV1<TEvaluation>
>;

const DEPENDENT_NODE: NonCoronaryNodeNameV1 = "SV";
export const NON_CORONARY_INDEPENDENT_NODE_NAMES_V1 = Object.freeze(
  NON_CORONARY_NODE_NAMES_V1.filter(
    (name): name is NonCoronaryIndependentNodeNameV1 =>
      name !== DEPENDENT_NODE,
  ),
);
const INDEPENDENT_NODE_NAMES = NON_CORONARY_INDEPENDENT_NODE_NAMES_V1;
const DEFAULT_NEWTON_OPTIONS = Object.freeze({
  maxIterations: 30,
  absoluteContinuityResidualToleranceMl: 1e-8,
  scaledResidualInfinityTolerance: 2e-10,
  scaledUpdateInfinityTolerance: 2e-11,
  finiteDifferenceScaledStep: 2e-6,
  maximumLineSearchBacktracks: 24,
  analyticJacobianFiniteDifferenceShadow: false,
});
const MAX_NEWTON_FAILURE_TRACE_ENTRIES = 32;
const MAX_FAILURE_DIAGNOSTIC_MESSAGE_CHARACTERS = 1024;

export function buildNonCoronaryCirculationGraphV1():
NonCoronaryCirculationGraphV1 {
  const sourceGraph = buildAuthoritativeCirculationGraphV1();
  const includedNodeNames = new Set<string>(NON_CORONARY_NODE_NAMES_V1);
  const nodes = Object.freeze(sourceGraph.nodes.filter((node) =>
    includedNodeNames.has(node.name)));
  const edges = Object.freeze(sourceGraph.edges.filter((edge) =>
    edge.group !== "coronary"));
  if (
    nodes.length !== NON_CORONARY_NODE_NAMES_V1.length
    || edges.length !== NON_CORONARY_EDGE_NAMES_V1.length
    || nodes.some((node, index) => node.name !== NON_CORONARY_NODE_NAMES_V1[index])
    || edges.some((edge, index) => edge.name !== NON_CORONARY_EDGE_NAMES_V1[index])
  ) throw new Error("main-wire source topology changed outside experimental scope");
  for (const excluded of NON_CORONARY_CIRCULATION_SCOPE_V1.excludedCoronaryNodes) {
    if (nodes.some((node) => node.name === excluded)) {
      throw new Error(`coronary node ${excluded} entered the non-coronary graph`);
    }
  }
  for (const edge of edges) {
    if (!includedNodeNames.has(edge.up) || !includedNodeNames.has(edge.down)) {
      throw new Error(`non-coronary edge ${edge.name} left the included node set`);
    }
  }
  return Object.freeze({
    topologyId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    nodes,
    edges,
    nodeIndex: uniqueIndex(nodes),
    edgeIndex: uniqueIndex(edges),
    scope: NON_CORONARY_CIRCULATION_SCOPE_V1,
  });
}

/**
 * Resolves the deterministic topology/runtime cold seed without selecting a
 * physiological operating point. Callers explicitly promote its total as the
 * fixed TBV owner, or supply another volume record with its own explicit owner.
 */
export function resolveNonCoronaryCirculationColdSeedV1(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): NonCoronaryCirculationColdSeedV1 {
  validateRuntime(runtime);
  const graph = buildNonCoronaryCirculationGraphV1();
  const nodeVolumesMl = initialNodeVolumes(graph, runtime);
  return Object.freeze({
    fixedTotalBloodVolumeMl: sumNodeRecord(nodeVolumesMl),
    nodeVolumesMl,
  });
}

export function createInitialNonCoronaryCirculationStateV1(
  input: NonCoronaryCirculationInitialStateInputV1,
): NonCoronaryCirculationAcceptedStateV1 {
  requireNonnegative(input.timeSec, "timeSec");
  validateRuntime(input.runtime);
  requirePositive(input.fixedTotalBloodVolumeMl, "fixedTotalBloodVolumeMl");
  const graph = buildNonCoronaryCirculationGraphV1();
  const nodeVolumesMl = input.nodeVolumesMl
    ? copyNodeRecord(input.nodeVolumesMl, "nodeVolumesMl", requirePositive)
    : initialNodeVolumes(graph, input.runtime);
  const dynamicEdgeFlowsMlPerSec = input.dynamicEdgeFlowsMlPerSec
    ? copyDynamicEdgeRecord(
      input.dynamicEdgeFlowsMlPerSec,
      "dynamicEdgeFlowsMlPerSec",
      requireFinite,
    )
    : dynamicEdgeRecord((name) => graph.edges[graph.edgeIndex.get(name)!].q0 ?? 0);
  const valveStates = input.valveStates
    ? copyValveStates(input.valveStates)
    : valveRecord((name) => {
      const edge = graph.edges[graph.edgeIndex.get(name)!];
      return initialMainWireQuasiSteadyOrificeValveStateV2(edge.xi0 ?? 0);
    });
  return acceptedState({
    revision: 0,
    acceptedTimeSec: input.timeSec,
    totalBloodVolumeMl: input.fixedTotalBloodVolumeMl,
    nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec,
    valveStates,
  });
}

export function evaluateNonCoronaryCirculationBackwardEulerTrialV1<
  TEvaluation,
  TCompanionTrial = never,
>(
  input: NonCoronaryCirculationTrialInputV1<TEvaluation, TCompanionTrial>,
): NonCoronaryCirculationTrialResultV1<TEvaluation, TCompanionTrial> {
  // A malformed accepted state is a programmer/checkpoint error and cannot
  // provide a trustworthy rollback target.
  validateAcceptedState(input.previousAcceptedState);
  let graph: NonCoronaryCirculationGraphV1;
  let options: Required<NonCoronaryCirculationNewtonOptionsV1>;
  try {
    requirePositive(input.dtSec, "dtSec");
    validateRuntime(input.runtime);
    validateProtocolResistanceScaleByEdge(
      input.protocolResistanceScaleByEdge,
    );
    validateConservativeCompanionAdapter(input);
    validateMechanicalSupportInput(input.mechanicalSupport);
    if (typeof input.evaluateCandidateMechanics !== "function") {
      throw new Error("evaluateCandidateMechanics must be a function");
    }
    graph = buildNonCoronaryCirculationGraphV1();
    options = resolveNewtonOptions(input.options);
  } catch (error) {
    return failure(
      input.previousAcceptedState,
      "invalid-input",
      errorMessage(error),
      input.previousAcceptedState.nodeVolumesMl,
      emptyDiagnostics(),
    );
  }
  const previous = input.previousAcceptedState;
  const candidateTimeSec = previous.acceptedTimeSec + input.dtSec;
  const mechanicsCache: CandidateMechanicsCache<TEvaluation> = {
    values: new Map(),
    jacobianUsage: {
      analyticAssemblyCount: 0,
      finiteDifferenceFallbackCount: 0,
      finiteDifferenceShadowCount: 0,
      maximumAbsoluteShadowDifference: null,
      maximumRelativeFrobeniusShadowDifference: null,
    },
    callCount: 0,
    hitCount: 0,
    uniqueCandidateCount: 0,
  };
  const volumeScales = independentVolumeScales(previous.nodeVolumesMl);
  let scaledUnknowns = independentVolumesToScaled(
    previous.nodeVolumesMl,
    volumeScales,
  );
  let current: CandidateEvaluation<TEvaluation, TCompanionTrial>;
  let acceptedLineSearchSteps = 0;
  let lineSearchBacktracks = 0;
  const failureTrace: MutableNewtonFailureTraceEntryV1[] = [];
  try {
    current = evaluateCandidate(
      graph,
      input,
      scaledUnknowns,
      volumeScales,
      candidateTimeSec,
      mechanicsCache,
    );
  } catch (error) {
    return failure(
      previous,
      "initial-evaluation-failed",
      errorMessage(error),
      previous.nodeVolumesMl,
      emptyDiagnostics(options, mechanicsCache),
    );
  }

  for (let iteration = 0; iteration <= options.maxIterations; iteration += 1) {
    const residualNorm = infinityNorm(current.scaledIndependentResidual);
    const mixedContinuityResidual = mixedContinuityResidualAudit(
      current,
      previous.nodeVolumesMl,
      options.absoluteContinuityResidualToleranceMl,
      options.scaledResidualInfinityTolerance,
    );
    const continuityResidualConverged =
      mixedContinuityResidual.infinityNorm <= 1;
    const traceEntry: MutableNewtonFailureTraceEntryV1 = {
      iteration,
      currentScaledResidualInfinityNorm: residualNorm,
      updateScaledInfinityNorm: null,
      lineSearchAttemptCount: 0,
      candidateEvaluationExceptionCount: 0,
      armijoResidualRejectionCount: 0,
      acceptedStepLength: null,
      acceptedTrialScaledResidualInfinityNorm: null,
    };
    pushBoundedFailureTrace(failureTrace, traceEntry);
    if (continuityResidualConverged) {
      return success(
        previous,
        input.dtSec,
        candidateTimeSec,
        current,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous,
          options,
          mechanicsCache,
        ),
      );
    }
    if (iteration === options.maxIterations) {
      return failure(
        previous,
        "maximum-iterations",
        "non-coronary circulation Newton reached its iteration limit",
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous,
          options,
          mechanicsCache,
          freezeFailureTrace(failureTrace),
        ),
      );
    }
    let jacobian: number[][];
    try {
      if (
        current.absoluteChamberPressureTangent !== null
        && conservativeCompanionSensitivitiesAvailable(current)
      ) {
        jacobian = analyticCirculationJacobian(
          graph,
          input,
          current,
          volumeScales,
        );
        mechanicsCache.jacobianUsage.analyticAssemblyCount += 1;
        if (options.analyticJacobianFiniteDifferenceShadow) {
          const shadow = finiteDifferenceJacobian(
            (candidate) => evaluateCandidate(
              graph,
              input,
              candidate,
              volumeScales,
              candidateTimeSec,
              mechanicsCache,
            ).scaledIndependentResidual,
            scaledUnknowns,
            options.finiteDifferenceScaledStep,
          );
          recordJacobianShadowDifference(
            mechanicsCache.jacobianUsage,
            jacobian,
            shadow,
          );
        }
      } else {
        mechanicsCache.jacobianUsage.finiteDifferenceFallbackCount += 1;
        jacobian = finiteDifferenceJacobian(
          (candidate) => evaluateCandidate(
            graph,
            input,
            candidate,
            volumeScales,
            candidateTimeSec,
            mechanicsCache,
          ).scaledIndependentResidual,
          scaledUnknowns,
          options.finiteDifferenceScaledStep,
        );
      }
    } catch (error) {
      return failure(
        previous,
        "jacobian-failed",
        errorMessage(error),
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous,
          options,
          mechanicsCache,
          freezeFailureTrace(failureTrace),
        ),
      );
    }
    const update = solveDenseLinearSystem(
      jacobian,
      current.scaledIndependentResidual.map((value) => -value),
    );
    traceEntry.updateScaledInfinityNorm = update === null
      ? null
      : infinityNorm(update);
    if (update === null) {
      return failure(
        previous,
        "singular-jacobian",
        "non-coronary circulation scaled Jacobian is singular",
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous,
          options,
          mechanicsCache,
          freezeFailureTrace(failureTrace),
        ),
      );
    }
    if (
      infinityNorm(update) <= options.scaledUpdateInfinityTolerance
      && !continuityResidualConverged
    ) {
      return failure(
        previous,
        "singular-jacobian",
        "non-coronary circulation Newton stagnated above tolerance",
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous,
          options,
          mechanicsCache,
          freezeFailureTrace(failureTrace),
        ),
      );
    }
    let accepted: Readonly<{
      scaledUnknowns: readonly number[];
      evaluation: CandidateEvaluation<TEvaluation, TCompanionTrial>;
    }> | null = null;
    let stepLength = 1;
    let lastCandidateEvaluationException:
      NonCoronaryLineSearchFailureDiagnosticsV1[
        "lastCandidateEvaluationException"
      ] = null;
    let lastArmijoResidualRejection:
      NonCoronaryLineSearchFailureDiagnosticsV1[
        "lastArmijoResidualRejection"
      ] = null;
    for (
      let backtrack = 0;
      backtrack <= options.maximumLineSearchBacktracks;
      backtrack += 1
    ) {
      traceEntry.lineSearchAttemptCount += 1;
      const candidateUnknowns = scaledUnknowns.map(
        (value, index) => value + stepLength * update[index]!,
      );
      try {
        const evaluation = evaluateCandidate(
          graph,
          input,
          candidateUnknowns,
          volumeScales,
          candidateTimeSec,
          mechanicsCache,
        );
        const trialResidualNorm = infinityNorm(
          evaluation.scaledIndependentResidual,
        );
        const requiredMaximumResidualNorm =
          (1 - 1e-4 * stepLength) * residualNorm;
        if (trialResidualNorm <= requiredMaximumResidualNorm) {
          accepted = Object.freeze({
            scaledUnknowns: Object.freeze(candidateUnknowns),
            evaluation,
          });
          traceEntry.acceptedStepLength = stepLength;
          traceEntry.acceptedTrialScaledResidualInfinityNorm =
            trialResidualNorm;
          break;
        }
        traceEntry.armijoResidualRejectionCount += 1;
        lastArmijoResidualRejection = Object.freeze({
          backtrackIndex: backtrack,
          stepLength,
          trialScaledResidualInfinityNorm: trialResidualNorm,
          requiredMaximumScaledResidualInfinityNorm:
            requiredMaximumResidualNorm,
        });
      } catch (error) {
        traceEntry.candidateEvaluationExceptionCount += 1;
        lastCandidateEvaluationException = Object.freeze({
          backtrackIndex: backtrack,
          stepLength,
          message: boundedDiagnosticMessage(errorMessage(error)),
        });
        // Inadmissible volume or callback state follows the same backtracking path.
      }
      stepLength *= 0.5;
      lineSearchBacktracks += 1;
    }
    if (accepted === null) {
      const lineSearchFailure: NonCoronaryLineSearchFailureDiagnosticsV1 =
        Object.freeze({
          iteration,
          attemptCount: traceEntry.lineSearchAttemptCount,
          candidateEvaluationExceptionCount:
            traceEntry.candidateEvaluationExceptionCount,
          armijoResidualRejectionCount:
            traceEntry.armijoResidualRejectionCount,
          dominantRejectionOwner:
            classifyNonCoronaryLineSearchRejectionOwnerV1(
              traceEntry.candidateEvaluationExceptionCount,
              traceEntry.armijoResidualRejectionCount,
            ),
          lastCandidateEvaluationException,
          lastArmijoResidualRejection,
        });
      return failure(
        previous,
        "line-search-failed",
        "non-coronary circulation Newton found no admissible residual-decreasing step",
        current.nodeVolumesMl,
        trialDiagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          current,
          previous,
          options,
          mechanicsCache,
          freezeFailureTrace(failureTrace),
          lineSearchFailure,
        ),
      );
    }
    scaledUnknowns = accepted.scaledUnknowns;
    current = accepted.evaluation;
    acceptedLineSearchSteps += 1;
  }
  throw new Error("unreachable circulation Newton state");
}

/** Pure promotion of circulation state. Mechanics promotion remains external. */
export function commitNonCoronaryCirculationTrialV1<
  TEvaluation,
  TCompanionTrial = never,
>(
  previous: NonCoronaryCirculationAcceptedStateV1,
  trial: NonCoronaryCirculationTrialSuccessV1<TEvaluation, TCompanionTrial>,
): NonCoronaryCirculationAcceptedStateV1 {
  validateAcceptedState(previous);
  if (trial.conservativeCompanion !== undefined) {
    throw new Error(
      "companion trial requires the companion-aware circulation commit",
    );
  }
  if (
    trial.transactionId !== NON_CORONARY_CIRCULATION_BE_V1_ID
    || trial.baseRevision !== previous.revision
    || !nearlyEqual(trial.baseAcceptedTimeSec, previous.acceptedTimeSec)
    || !nearlyEqual(trial.candidateTimeSec, previous.acceptedTimeSec + trial.dtSec)
  ) throw new Error("stale or foreign non-coronary circulation trial");
  const total = sumNodeRecord(trial.candidateNodeVolumesMl);
  if (!nearlyEqual(total, previous.totalBloodVolumeMl)) {
    throw new Error("candidate trial violates the accepted TBV constraint");
  }
  return acceptedState({
    revision: previous.revision + 1,
    acceptedTimeSec: trial.candidateTimeSec,
    totalBloodVolumeMl: previous.totalBloodVolumeMl,
    nodeVolumesMl: trial.candidateNodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: trial.candidateDynamicEdgeFlowsMlPerSec,
    valveStates: trial.candidateValveStates,
  });
}

export type NonCoronaryCirculationCompanionCommitV1<TCompanionTrial> =
  Readonly<{
    /**
     * A valid V1 state used as the next non-coronary partition. Its TBV field
     * owns only this partition; the coupled transaction owns the global TBV.
     */
    acceptedNonCoronaryPartitionState:
      NonCoronaryCirculationAcceptedStateV1;
    candidateCompanionTrial: TCompanionTrial;
    fixedGlobalTotalBloodVolumeMl: number;
  }>;

/**
 * Companion-aware promotion of the non-coronary partition only.
 *
 * This deliberately does not call or weaken `commitNonCoronaryCirculationTrialV1`:
 * the historical path requires a fixed non-coronary TBV, whereas a conservative
 * companion exchanges blood volume with this partition. The outer transaction
 * remains responsible for atomically promoting the returned companion trial and
 * mechanics trial together with this partition state.
 */
export function commitNonCoronaryCirculationTrialWithConservativeCompanionV1<
  TEvaluation,
  TCompanionTrial,
>(
  previousNonCoronaryPartition: NonCoronaryCirculationAcceptedStateV1,
  trial: NonCoronaryCirculationTrialSuccessV1<
    TEvaluation,
    TCompanionTrial
  >,
): NonCoronaryCirculationCompanionCommitV1<TCompanionTrial> {
  validateAcceptedState(previousNonCoronaryPartition);
  const companion = trial.conservativeCompanion;
  if (companion === undefined) {
    throw new Error("companion-aware commit requires a companion trial");
  }
  if (
    trial.transactionId !== NON_CORONARY_CIRCULATION_BE_V1_ID
    || trial.baseRevision !== previousNonCoronaryPartition.revision
    || !nearlyEqual(
      trial.baseAcceptedTimeSec,
      previousNonCoronaryPartition.acceptedTimeSec,
    )
    || !nearlyEqual(
      trial.candidateTimeSec,
      previousNonCoronaryPartition.acceptedTimeSec + trial.dtSec,
    )
  ) throw new Error("stale or foreign companion circulation trial");
  if (!nearlyEqual(
    previousNonCoronaryPartition.totalBloodVolumeMl
      + companion.previousAcceptedCompanionBloodVolumeMl,
    companion.fixedGlobalTotalBloodVolumeMl,
  )) {
    throw new Error("previous companion/global TBV ledger is stale");
  }
  const candidateNonCoronaryBloodVolumeMl =
    sumNodeRecord(trial.candidateNodeVolumesMl);
  if (!nearlyEqual(
    candidateNonCoronaryBloodVolumeMl
      + companion.candidateCompanionBloodVolumeMl,
    companion.fixedGlobalTotalBloodVolumeMl,
  )) {
    throw new Error("candidate companion/global TBV ledger is stale");
  }
  const acceptedNonCoronaryPartitionState = acceptedState({
    revision: previousNonCoronaryPartition.revision + 1,
    acceptedTimeSec: trial.candidateTimeSec,
    totalBloodVolumeMl: candidateNonCoronaryBloodVolumeMl,
    nodeVolumesMl: trial.candidateNodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: trial.candidateDynamicEdgeFlowsMlPerSec,
    valveStates: trial.candidateValveStates,
  });
  return Object.freeze({
    acceptedNonCoronaryPartitionState,
    candidateCompanionTrial: companion.candidateCompanionTrial,
    fixedGlobalTotalBloodVolumeMl: companion.fixedGlobalTotalBloodVolumeMl,
  });
}

/** JSON-safe accepted-state checkpoint; contains no callback or solver cache. */
export function checkpointNonCoronaryCirculationStateV1(
  state: NonCoronaryCirculationAcceptedStateV1,
): NonCoronaryCirculationCheckpointV1 {
  validateAcceptedState(state);
  const cloned = cloneAcceptedState(state);
  return Object.freeze({
    checkpointId: NON_CORONARY_CIRCULATION_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    state: cloned,
    stateFingerprint: fingerprintCirculationStateV1(cloned),
  });
}

/**
 * Restores a checkpoint and optionally rebases revision/time at the same
 * cardiac phase. Rephasing is deliberately owned by the caller.
 */
export function restoreNonCoronaryCirculationStateV1(
  checkpoint: NonCoronaryCirculationCheckpointV1,
  rebase?: Readonly<{ revision: number; acceptedTimeSec: number }>,
): NonCoronaryCirculationAcceptedStateV1 {
  if (
    checkpoint.checkpointId !== NON_CORONARY_CIRCULATION_CHECKPOINT_V1_ID
    || checkpoint.schemaVersion !== 1
  ) throw new Error("unsupported non-coronary circulation checkpoint");
  validateAcceptedState(checkpoint.state);
  if (
    fingerprintCirculationStateV1(checkpoint.state)
      !== checkpoint.stateFingerprint
  ) throw new Error("non-coronary circulation checkpoint fingerprint mismatch");
  return acceptedState({
    revision: rebase?.revision ?? checkpoint.state.revision,
    acceptedTimeSec: rebase?.acceptedTimeSec ?? checkpoint.state.acceptedTimeSec,
    totalBloodVolumeMl: checkpoint.state.totalBloodVolumeMl,
    nodeVolumesMl: checkpoint.state.nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: checkpoint.state.dynamicEdgeFlowsMlPerSec,
    valveStates: checkpoint.state.valveStates,
  });
}

function evaluateCandidate<TEvaluation, TCompanionTrial = never>(
  graph: NonCoronaryCirculationGraphV1,
  input: NonCoronaryCirculationTrialInputV1<TEvaluation, TCompanionTrial>,
  scaledIndependentVolumes: readonly number[],
  volumeScales: readonly number[],
  candidateTimeSec: number,
  mechanicsCache: CandidateMechanicsCache<TEvaluation>,
): CandidateEvaluation<TEvaluation, TCompanionTrial> {
  const previous = input.previousAcceptedState;
  // Preserve the immutable no-companion candidate reconstruction and failure
  // ordering exactly; the independent-only prepass exists solely for the
  // companion branch, where SV depends on the companion candidate volume.
  const legacyNodeVolumesMl = input.conservativeCompanion === undefined
    ? scaledToNodeVolumes(
      scaledIndependentVolumes,
      volumeScales,
      previous.totalBloodVolumeMl,
    )
    : null;
  const candidateIndependentNodeVolumesMl = legacyNodeVolumesMl === null
    ? scaledToIndependentNodeVolumes(
      scaledIndependentVolumes,
      volumeScales,
    )
    : independentNodeVolumesFromNodeRecord(legacyNodeVolumesMl);
  const chamberVolumesMl = Object.freeze({
    LV: candidateIndependentNodeVolumesMl.LV,
    LA: candidateIndependentNodeVolumesMl.LA,
    RV: candidateIndependentNodeVolumesMl.RV,
    RA: candidateIndependentNodeVolumesMl.RA,
  });
  const mechanics = evaluateCandidateMechanicsCached(
    mechanicsCache,
    input.evaluateCandidateMechanics,
    chamberVolumesMl,
    candidateTimeSec,
  );
  const conservativeCompanion = input.conservativeCompanion === undefined
    ? null
    : evaluateConservativeCompanionSameCandidate(
      graph,
      input,
      scaledIndependentVolumes,
      volumeScales,
      candidateIndependentNodeVolumesMl,
      mechanics,
      candidateTimeSec,
    );
  const nonCoronaryCandidateBloodVolumeMl = conservativeCompanion === null
    ? previous.totalBloodVolumeMl
    : conservativeCompanion.fixedGlobalTotalBloodVolumeMl
      - conservativeCompanion.candidateCompanionBloodVolumeMl;
  const nodeVolumesMl = legacyNodeVolumesMl ?? scaledToNodeVolumes(
    scaledIndependentVolumes,
    volumeScales,
    nonCoronaryCandidateBloodVolumeMl,
  );
  const supportTiming = input.mechanicalSupport === undefined
    ? null
    : mechanicalSupportTiming(
      candidateTimeSec,
      input.mechanicalSupport.heartRateBpm,
    );
  const iabp = input.mechanicalSupport === undefined || supportTiming === null
    ? null
    : evaluateIabpV1(input.mechanicalSupport.config.iabp, supportTiming);
  const nodeAbsolutePressuresMmHg = nodeRecord((name) => {
    if (isChamberName(name)) return mechanics.absolutePressuresMmHg[name];
    const node = graph.nodes[graph.nodeIndex.get(name)!];
    const ptmMmHg = vascularTransmuralPressureFromPhysicalVolumeV1(
      node,
      nodeVolumesMl[name] + (name === "SA" ? iabp?.balloonVolumeMl ?? 0 : 0),
      input.runtime.vascular,
      "adaptive-volume-tolerance",
    );
    const ext = respiratoryExternalPressureForKindV1(
      respiratoryKind(node.ext),
      candidateTimeSec,
      input.runtime.respiratory,
    );
    return requireFinite(ptmMmHg + ext, `${name} absolute pressure`);
  });
  const mechanicalSupport = input.mechanicalSupport === undefined
      || supportTiming === null
    ? null
    : evaluateMechanicalSupportHydraulicsV1(
      input.mechanicalSupport.config,
      {
        ...supportTiming,
        nodeAbsolutePressureMmHg: Object.freeze({
          LV: nodeAbsolutePressuresMmHg.LV,
          Ao: nodeAbsolutePressuresMmHg.Ao,
          SA: nodeAbsolutePressuresMmHg.SA,
          RA: nodeAbsolutePressuresMmHg.RA,
          VC: nodeAbsolutePressuresMmHg.VC,
        }),
        nodeVolumeMl: Object.freeze({
          LV: nodeVolumesMl.LV,
          Ao: nodeVolumesMl.Ao,
          SA: nodeVolumesMl.SA,
          RA: nodeVolumesMl.RA,
          VC: nodeVolumesMl.VC,
        }),
      },
    );
  const valveEvaluations = {} as Record<
    NonCoronaryValveNameV1,
    MainWireQuasiSteadyOrificeValveEvaluationV2
  >;
  const valvePreset = input.runtime.valvePreset;
  const flows = {} as Record<NonCoronaryEdgeNameV1, number>;
  const dynamicFlows = {} as Record<NonCoronaryDynamicEdgeNameV1, number>;
  for (const edge of graph.edges) {
    const name = edge.name as NonCoronaryEdgeNameV1;
    const upstreamPressure = nodeAbsolutePressuresMmHg[
      edge.up as NonCoronaryNodeNameV1
    ];
    const downstreamPressure = nodeAbsolutePressuresMmHg[
      edge.down as NonCoronaryNodeNameV1
    ];
    if (edge.kind === "valve") {
      const valveName = name as NonCoronaryValveNameV1;
      const evaluation = stepMainWireQuasiSteadyOrificeValveV2(
        previous.valveStates[valveName],
        {
          dtSec: input.dtSec,
          upstreamPressureMmHg: upstreamPressure,
          downstreamPressureMmHg: downstreamPressure,
        },
        valvePreset.valves[valveName],
      );
      if (!evaluation.valid || !evaluation.finite) {
        throw new Error(`${name} valve trial failed: ${evaluation.issues.join("; ")}`);
      }
      valveEvaluations[valveName] = evaluation;
      flows[name] = evaluation.flowMlPerSec;
      continue;
    }
    const effectiveDownstreamPressure = downstreamEffectivePressureV1({
      edge,
      downstreamPressureMmHg: downstreamPressure,
      edgeExternalPressureMmHg: respiratoryExternalPressureForKindV1(
        respiratoryKind(edge.ext),
        candidateTimeSec,
        input.runtime.respiratory,
      ),
    });
    const gradientMmHg = upstreamPressure - effectiveDownstreamPressure;
    const losses = applyProtocolResistanceScale(
      nonValveEdgeLossV1({
      edge,
      params: input.runtime.losses,
      upstreamPressureMmHg: upstreamPressure,
      downstreamPressureMmHg: downstreamPressure,
      edgeExternalPressureMmHg: respiratoryExternalPressureForKindV1(
        respiratoryKind(edge.ext),
        candidateTimeSec,
        input.runtime.respiratory,
      ),
      }),
      protocolResistanceScaleForEdge(input, name),
    );
    if (edge.kind === "dynamic") {
      const dynamicName = name as NonCoronaryDynamicEdgeNameV1;
      const inertance = requirePositive(
        (edge.L ?? 0) / (
          edge.useChiResistance ? Math.max(losses.areaRatio, 1e-6) : 1
        ),
        `${name} inertanceMmHgSec2PerMl`,
      );
      const flow = solveSignedLinearQuadraticFlowV1(
        gradientMmHg + inertance
          * previous.dynamicEdgeFlowsMlPerSec[dynamicName] / input.dtSec,
        losses.resistanceMmHgSecPerMl + inertance / input.dtSec,
        losses.quadraticLossMmHgSec2PerMl2,
      );
      dynamicFlows[dynamicName] = flow;
      flows[name] = flow;
    } else {
      flows[name] = solveSignedLinearQuadraticFlowV1(
        gradientMmHg,
        losses.resistanceMmHgSecPerMl,
        losses.quadraticLossMmHgSec2PerMl2,
      );
    }
  }
  const edgeFlowsMlPerSec = copyEdgeRecord(
    flows as EdgeRecord<number>,
    "edgeFlowsMlPerSec",
    requireFinite,
  );
  const localFlows = Float64Array.from(graph.edges, (edge) =>
    edgeFlowsMlPerSec[edge.name as NonCoronaryEdgeNameV1]);
  const localRates = incidenceVolumeRatesFromEdgeFlowsV1(graph, localFlows);
  const continuityResidualMlByNode = nodeRecord((name) => {
    const localIndex = graph.nodeIndex.get(name)!;
    const companionRate = conservativeCompanion === null
      ? 0
      : isConservativeCompanionBoundaryNode(name)
        ? conservativeCompanion.outerBoundaryNetVolumeRateMlPerSec[name]
        : 0;
    const supportRate = mechanicalSupportNodeRateMlPerSec(
      mechanicalSupport,
      name,
    );
    return nodeVolumesMl[name] - previous.nodeVolumesMl[name]
      - input.dtSec * (localRates[localIndex]! + companionRate + supportRate);
  });
  const scaledIndependentResidual = Object.freeze(
    INDEPENDENT_NODE_NAMES.map((name, index) =>
      continuityResidualMlByNode[name] / volumeScales[index]!),
  );
  return Object.freeze({
    nodeVolumesMl,
    nodeAbsolutePressuresMmHg,
    edgeFlowsMlPerSec,
    dynamicEdgeFlowsMlPerSec: copyDynamicEdgeRecord(
      dynamicFlows as DynamicEdgeRecord<number>,
      "dynamicEdgeFlowsMlPerSec",
      requireFinite,
    ),
    valveStates: valveRecord((name) => valveEvaluations[name].state),
    valveEvaluations: Object.freeze({ ...valveEvaluations }) as ValveRecord<
      MainWireQuasiSteadyOrificeValveEvaluationV2
    >,
    candidateMechanicsEvaluation: mechanics.evaluation,
    mechanicalSupport,
    absoluteChamberPressureTangent:
      mechanics.absolutePressureTangent ?? null,
    conservativeCompanion,
    continuityResidualMlByNode,
    scaledIndependentResidual,
  });
}

function evaluateConservativeCompanionSameCandidate<
  TEvaluation,
  TCompanionTrial,
>(
  graph: NonCoronaryCirculationGraphV1,
  input: NonCoronaryCirculationTrialInputV1<TEvaluation, TCompanionTrial>,
  scaledIndependentVolumes: readonly number[],
  volumeScales: readonly number[],
  candidateIndependentNodeVolumesMl:
    NonCoronaryIndependentNodeRecordV1<number>,
  mechanics: NonCoronaryCandidateMechanicsResultV1<TEvaluation>,
  candidateTimeSec: number,
): ConservativeCompanionCandidateEvaluationInternalV1<TCompanionTrial> {
  const adapter = input.conservativeCompanion;
  if (adapter === undefined) {
    throw new Error("conservative companion adapter is unavailable");
  }
  const aoNode = graph.nodes[graph.nodeIndex.get("Ao")!];
  const aoPaired =
    vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
      aoNode,
      candidateIndependentNodeVolumesMl.Ao,
      input.runtime.vascular,
      "adaptive-volume-tolerance",
    );
  const aoExternalPressureMmHg = respiratoryExternalPressureForKindV1(
    respiratoryKind(aoNode.ext),
    candidateTimeSec,
    input.runtime.respiratory,
  );
  const boundaryAbsolutePressuresMmHg = Object.freeze({
    Ao: requireFinite(
      aoPaired.transmuralPressureMmHg + aoExternalPressureMmHg,
      "Ao companion boundary pressure",
    ),
    RA: requireFinite(
      mechanics.absolutePressuresMmHg.RA,
      "RA companion boundary pressure",
    ),
  });
  const boundaryPressureTangent = mechanics.absolutePressureTangent === undefined
    ? null
    : companionBoundaryPressureTangentByScaledIndependentVolume(
      aoPaired.dTransmuralPressureDPhysicalVolumeMmHgPerMl,
      mechanics.absolutePressureTangent,
      volumeScales,
    );
  const evaluation = adapter.evaluateSameCandidate(Object.freeze({
    candidateTimeSec,
    dtSec: input.dtSec,
    fixedGlobalTotalBloodVolumeMl: adapter.fixedGlobalTotalBloodVolumeMl,
    independentNodeOrder: INDEPENDENT_NODE_NAMES,
    scaledIndependentVolumes: Object.freeze([...scaledIndependentVolumes]),
    independentVolumeScalesMl: Object.freeze([...volumeScales]),
    candidateIndependentNodeVolumesMl,
    boundaryAbsolutePressuresMmHg,
    dBoundaryAbsolutePressureDScaledIndependentVolume:
      boundaryPressureTangent,
    candidateMechanicsEvaluation: mechanics.evaluation,
  }));
  const validated = validateAndFreezeConservativeCompanionEvaluation(
    evaluation,
  );
  return Object.freeze({
    ...validated,
    fixedGlobalTotalBloodVolumeMl: adapter.fixedGlobalTotalBloodVolumeMl,
    previousAcceptedCompanionBloodVolumeMl:
      adapter.previousAcceptedCompanionBloodVolumeMl,
  });
}

function companionBoundaryPressureTangentByScaledIndependentVolume(
  dAoPressureDAoVolumeMmHgPerMl: number,
  chamberTangent: NonCoronaryAbsoluteChamberPressureTangentV1,
  volumeScales: readonly number[],
): NonCoronaryCompanionBoundaryRecordV1<readonly number[]> {
  requireFinite(
    dAoPressureDAoVolumeMmHgPerMl,
    "Ao companion boundary pressure tangent",
  );
  const ao = Array(INDEPENDENT_NODE_NAMES.length).fill(0) as number[];
  const aoColumn = INDEPENDENT_NODE_NAMES.indexOf("Ao");
  ao[aoColumn] = dAoPressureDAoVolumeMmHgPerMl * volumeScales[aoColumn]!;
  const ra = Array(INDEPENDENT_NODE_NAMES.length).fill(0) as number[];
  const raRow = NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.indexOf("RA");
  for (
    let chamberColumn = 0;
    chamberColumn < NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.length;
    chamberColumn += 1
  ) {
    const chamberName =
      NON_CORONARY_CHAMBER_TANGENT_ORDER_V1[chamberColumn]!;
    const independentColumn = INDEPENDENT_NODE_NAMES.indexOf(chamberName);
    ra[independentColumn] = requireFinite(
      chamberTangent.dPressureDVolumeMmHgPerMl[raRow]![chamberColumn]!
        * volumeScales[independentColumn]!,
      `RA companion boundary tangent by ${chamberName}`,
    );
  }
  return Object.freeze({
    Ao: Object.freeze(ao),
    RA: Object.freeze(ra),
  });
}

function validateAndFreezeConservativeCompanionEvaluation<TCompanionTrial>(
  evaluation:
    NonCoronaryConservativeCompanionCandidateEvaluationV1<TCompanionTrial>,
): NonCoronaryConservativeCompanionCandidateEvaluationV1<TCompanionTrial> {
  const candidateCompanionBloodVolumeMl = requireNonnegative(
    evaluation.candidateCompanionBloodVolumeMl,
    "candidate companion blood volume",
  );
  const outerBoundaryNetVolumeRateMlPerSec = Object.freeze({
    Ao: requireFinite(
      evaluation.outerBoundaryNetVolumeRateMlPerSec.Ao,
      "Ao companion net volume rate",
    ),
    RA: requireFinite(
      evaluation.outerBoundaryNetVolumeRateMlPerSec.RA,
      "RA companion net volume rate",
    ),
  });
  const sensitivities = evaluation.sensitivities === undefined
    ? undefined
    : Object.freeze({
      dCandidateCompanionBloodVolumeMlDScaledIndependentVolume:
        copyCompanionSensitivityVector(
          evaluation.sensitivities
            .dCandidateCompanionBloodVolumeMlDScaledIndependentVolume,
          "companion blood-volume sensitivity",
        ),
      dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume:
        Object.freeze({
          Ao: copyCompanionSensitivityVector(
            evaluation.sensitivities
              .dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume.Ao,
            "Ao companion source-rate sensitivity",
          ),
          RA: copyCompanionSensitivityVector(
            evaluation.sensitivities
              .dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume.RA,
            "RA companion source-rate sensitivity",
          ),
        }),
    });
  return Object.freeze({
    candidateCompanionBloodVolumeMl,
    outerBoundaryNetVolumeRateMlPerSec,
    candidateCompanionTrial: evaluation.candidateCompanionTrial,
    ...(sensitivities === undefined ? {} : { sensitivities }),
  });
}

function copyCompanionSensitivityVector(
  values: readonly number[],
  label: string,
): readonly number[] {
  if (values.length !== INDEPENDENT_NODE_NAMES.length) {
    throw new Error(`${label} has incompatible dimension`);
  }
  return Object.freeze(values.map((value, index) =>
    requireFinite(value, `${label}[${INDEPENDENT_NODE_NAMES[index]}]`)));
}

function isConservativeCompanionBoundaryNode(
  name: NonCoronaryNodeNameV1,
): name is NonCoronaryConservativeCompanionBoundaryNodeV1 {
  return name === "Ao" || name === "RA";
}

function conservativeCompanionSensitivitiesAvailable<
  TEvaluation,
  TCompanionTrial,
>(
  evaluation: CandidateEvaluation<TEvaluation, TCompanionTrial>,
): boolean {
  return evaluation.conservativeCompanion === null
    || evaluation.conservativeCompanion.sensitivities !== undefined;
}

/**
 * Exact chain rule for the current BE residual, using the same candidate's
 * chamber algorithmic tangent and active vascular/edge/valve branches.
 *
 * For scaled independent volumes x_j = V_j / s_j and dependent
 * V_SV = TBV_global - V_companion - sum_j V_j, this assembles
 *
 *   J = I - dt S^-1 E A (dq/dP) (dP/dV) (dV/dx).
 *
 * The no-companion derivative remains exactly -s_j. With a companion, the
 * additional -dV_companion/dx_j term is included explicitly below.
 */
function analyticCirculationJacobian<TEvaluation, TCompanionTrial>(
  graph: NonCoronaryCirculationGraphV1,
  input: NonCoronaryCirculationTrialInputV1<TEvaluation, TCompanionTrial>,
  current: CandidateEvaluation<TEvaluation, TCompanionTrial>,
  volumeScales: readonly number[],
): number[][] {
  const chamberTangent = current.absoluteChamberPressureTangent;
  if (chamberTangent === null) {
    throw new Error("analytic circulation Jacobian requires chamber pressure tangent");
  }
  if (volumeScales.length !== INDEPENDENT_NODE_NAMES.length) {
    throw new Error("circulation volume-scale count is incompatible");
  }
  const independentIndex = new Map<NonCoronaryNodeNameV1, number>();
  INDEPENDENT_NODE_NAMES.forEach((name, index) =>
    independentIndex.set(name, index));
  const nodePressureDerivativeByScaledVolume = Array.from(
    { length: graph.nodes.length },
    () => Array(INDEPENDENT_NODE_NAMES.length).fill(0) as number[],
  );

  // The mechanics callback tangent is already absolute and already contains
  // the common-pericardium rank-one contribution exactly once.
  for (
    let pressureRow = 0;
    pressureRow < NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.length;
    pressureRow += 1
  ) {
    const pressureChamber =
      NON_CORONARY_CHAMBER_TANGENT_ORDER_V1[pressureRow]!;
    const nodeRow = graph.nodeIndex.get(pressureChamber)!;
    for (
      let volumeColumn = 0;
      volumeColumn < NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.length;
      volumeColumn += 1
    ) {
      const volumeChamber =
        NON_CORONARY_CHAMBER_TANGENT_ORDER_V1[volumeColumn]!;
      const independentColumn = independentIndex.get(volumeChamber);
      if (independentColumn === undefined) {
        throw new Error(`chamber ${volumeChamber} is not an independent node`);
      }
      nodePressureDerivativeByScaledVolume[nodeRow]![independentColumn] =
        chamberTangent.dPressureDVolumeMmHgPerMl[pressureRow]![volumeColumn]!
          * volumeScales[independentColumn]!;
    }
  }

  for (const node of graph.nodes) {
    const name = node.name as NonCoronaryNodeNameV1;
    if (isChamberName(name)) continue;
    const paired =
      vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
        node,
        current.nodeVolumesMl[name]
          + (name === "SA"
            ? current.mechanicalSupport?.iabp.balloonVolumeMl ?? 0
            : 0),
        input.runtime.vascular,
        "adaptive-volume-tolerance",
      );
    const pressureTangentMmHgPerMl =
      paired.dTransmuralPressureDPhysicalVolumeMmHgPerMl;
    requireFinite(pressureTangentMmHgPerMl, `${name} vascular pressure tangent`);
    const nodeRow = graph.nodeIndex.get(name)!;
    if (name === DEPENDENT_NODE) {
      // Fixed global TBV: dV_SV/dx_j = -s_j - dV_companion/dx_j.
      const companionVolumeSensitivity = current.conservativeCompanion
        ?.sensitivities
        ?.dCandidateCompanionBloodVolumeMlDScaledIndependentVolume;
      for (let column = 0; column < volumeScales.length; column += 1) {
        nodePressureDerivativeByScaledVolume[nodeRow]![column] =
          -pressureTangentMmHgPerMl * (
            volumeScales[column]!
            + (companionVolumeSensitivity?.[column] ?? 0)
          );
      }
    } else {
      const column = independentIndex.get(name);
      if (column === undefined) {
        throw new Error(`vascular node ${name} is not represented in the volume map`);
      }
      nodePressureDerivativeByScaledVolume[nodeRow]![column] =
        pressureTangentMmHgPerMl * volumeScales[column]!;
    }
  }

  const size = INDEPENDENT_NODE_NAMES.length;
  const jacobian = Array.from(
    { length: size },
    (_, row) => Array.from({ length: size }, (_unused, column) =>
      row === column ? 1 : 0),
  );
  const candidateTimeSec =
    input.previousAcceptedState.acceptedTimeSec + input.dtSec;
  for (const edge of graph.edges) {
    const edgeName = edge.name as NonCoronaryEdgeNameV1;
    const upstreamName = edge.up as NonCoronaryNodeNameV1;
    const downstreamName = edge.down as NonCoronaryNodeNameV1;
    const upstreamPressureMmHg =
      current.nodeAbsolutePressuresMmHg[upstreamName];
    const downstreamPressureMmHg =
      current.nodeAbsolutePressuresMmHg[downstreamName];
    let dFlowDUpstreamPressureMlPerSecPerMmHg: number;
    let dFlowDDownstreamPressureMlPerSecPerMmHg: number;

    if (edge.kind === "valve") {
      const evaluation = current.valveEvaluations[
        edgeName as NonCoronaryValveNameV1
      ];
      const dFlowDGradient =
        evaluation.dFlowDPressureGradientMlPerSecPerMmHg;
      requireFinite(dFlowDGradient, `${edgeName} valve flow tangent`);
      dFlowDUpstreamPressureMlPerSecPerMmHg = dFlowDGradient;
      dFlowDDownstreamPressureMlPerSecPerMmHg = -dFlowDGradient;
    } else {
      const edgeExternalPressureMmHg = respiratoryExternalPressureForKindV1(
        respiratoryKind(edge.ext),
        candidateTimeSec,
        input.runtime.respiratory,
      );
      const downstream = downstreamEffectivePressureAndDerivativeV1({
        edge,
        downstreamPressureMmHg,
        edgeExternalPressureMmHg,
      });
      const losses = applyProtocolResistanceScaleWithDerivatives(
        nonValveEdgeLossAndPressureDerivativesV1({
        edge,
        params: input.runtime.losses,
        upstreamPressureMmHg,
        downstreamPressureMmHg,
        edgeExternalPressureMmHg,
        }),
        protocolResistanceScaleForEdge(input, edgeName),
      );
      const flowMlPerSec = current.edgeFlowsMlPerSec[edgeName];
      const signedQuadraticFlow = flowMlPerSec * Math.abs(flowMlPerSec);
      let inertanceMmHgSec2PerMl = 0;
      let dInertanceDUpstreamPressureSec2PerMl = 0;
      let dInertanceDDownstreamPressureSec2PerMl = 0;
      let previousFlowMlPerSec = flowMlPerSec;
      if (edge.kind === "dynamic") {
        const areaDenominator = edge.useChiResistance
          ? Math.max(losses.areaRatio, 1e-6)
          : 1;
        inertanceMmHgSec2PerMl = requirePositive(
          (edge.L ?? 0) / areaDenominator,
          `${edgeName} inertance tangent base`,
        );
        if (edge.useChiResistance && losses.areaRatio > 1e-6) {
          const inertanceAreaFactor =
            -inertanceMmHgSec2PerMl / losses.areaRatio;
          dInertanceDUpstreamPressureSec2PerMl = inertanceAreaFactor
            * losses.dAreaRatioDUpstreamPressurePerMmHg;
          dInertanceDDownstreamPressureSec2PerMl = inertanceAreaFactor
            * losses.dAreaRatioDDownstreamPressurePerMmHg;
        }
        previousFlowMlPerSec = input.previousAcceptedState
          .dynamicEdgeFlowsMlPerSec[
            edgeName as NonCoronaryDynamicEdgeNameV1
          ];
      }
      const denominator = losses.resistanceMmHgSecPerMl
        + (edge.kind === "dynamic"
          ? inertanceMmHgSec2PerMl / input.dtSec
          : 0)
        + 2 * losses.quadraticLossMmHgSec2PerMl2
          * Math.abs(flowMlPerSec);
      requirePositive(denominator, `${edgeName} flow tangent denominator`);
      const dynamicInertanceFactor = edge.kind === "dynamic"
        ? (previousFlowMlPerSec - flowMlPerSec) / input.dtSec
        : 0;
      dFlowDUpstreamPressureMlPerSecPerMmHg = (
        1
        - flowMlPerSec
          * losses.dResistanceDUpstreamPressureSecPerMl
        - signedQuadraticFlow
          * losses.dQuadraticLossDUpstreamPressureSec2PerMl2
        + dynamicInertanceFactor
          * dInertanceDUpstreamPressureSec2PerMl
      ) / denominator;
      dFlowDDownstreamPressureMlPerSecPerMmHg = (
        -downstream.dEffectivePressureDDownstreamPressure
        - flowMlPerSec
          * losses.dResistanceDDownstreamPressureSecPerMl
        - signedQuadraticFlow
          * losses.dQuadraticLossDDownstreamPressureSec2PerMl2
        + dynamicInertanceFactor
          * dInertanceDDownstreamPressureSec2PerMl
      ) / denominator;
    }
    requireFinite(
      dFlowDUpstreamPressureMlPerSecPerMmHg,
      `${edgeName} upstream pressure-flow tangent`,
    );
    requireFinite(
      dFlowDDownstreamPressureMlPerSecPerMmHg,
      `${edgeName} downstream pressure-flow tangent`,
    );
    const upstreamPressureRow = graph.nodeIndex.get(upstreamName)!;
    const downstreamPressureRow = graph.nodeIndex.get(downstreamName)!;
    const upstreamResidualRow = independentIndex.get(upstreamName);
    const downstreamResidualRow = independentIndex.get(downstreamName);
    for (let column = 0; column < size; column += 1) {
      const dFlowDScaledVolume =
        dFlowDUpstreamPressureMlPerSecPerMmHg
          * nodePressureDerivativeByScaledVolume[upstreamPressureRow]![column]!
        + dFlowDDownstreamPressureMlPerSecPerMmHg
          * nodePressureDerivativeByScaledVolume[downstreamPressureRow]![column]!;
      // incidence(upstream)=-q, so residual(upstream)=...+dt*q.
      if (upstreamResidualRow !== undefined) {
        jacobian[upstreamResidualRow]![column] += input.dtSec
          * dFlowDScaledVolume / volumeScales[upstreamResidualRow]!;
      }
      // incidence(downstream)=+q, so residual(downstream)=...-dt*q.
      if (downstreamResidualRow !== undefined) {
        jacobian[downstreamResidualRow]![column] -= input.dtSec
          * dFlowDScaledVolume / volumeScales[downstreamResidualRow]!;
      }
    }
  }
  if (current.mechanicalSupport !== null) {
    for (const pump of Object.values(current.mechanicalSupport.pump)) {
      const inletName = pump.inletNode as NonCoronaryNodeNameV1;
      const outletName = pump.outletNode as NonCoronaryNodeNameV1;
      if (inletName === outletName) continue;
      const inletPressureRow = graph.nodeIndex.get(inletName);
      const outletPressureRow = graph.nodeIndex.get(outletName);
      if (inletPressureRow === undefined || outletPressureRow === undefined) {
        throw new Error(`${pump.deviceId} mechanical-support node is absent`);
      }
      const inletResidualRow = independentIndex.get(inletName);
      const outletResidualRow = independentIndex.get(outletName);
      const inletVolumeColumn = independentIndex.get(inletName);
      for (let column = 0; column < size; column += 1) {
        const dInletVolumeDScaledVolume = inletVolumeColumn === column
          ? volumeScales[column]!
          : 0;
        const dFlowDScaledVolume =
          pump.dFlowMlPerSecDInletPressureMlPerSecPerMmHg
            * nodePressureDerivativeByScaledVolume[inletPressureRow]![column]!
          + pump.dFlowMlPerSecDOutletPressureMlPerSecPerMmHg
            * nodePressureDerivativeByScaledVolume[outletPressureRow]![column]!
          + pump.dFlowMlPerSecDInletVolumePerSec
            * dInletVolumeDScaledVolume;
        // Device incidence follows the same conservative inlet/outlet signs
        // as a native edge, but remains outside the immutable graph manifest.
        if (inletResidualRow !== undefined) {
          jacobian[inletResidualRow]![column] += input.dtSec
            * dFlowDScaledVolume / volumeScales[inletResidualRow]!;
        }
        if (outletResidualRow !== undefined) {
          jacobian[outletResidualRow]![column] -= input.dtSec
            * dFlowDScaledVolume / volumeScales[outletResidualRow]!;
        }
      }
    }
  }
  const companionSensitivities = current.conservativeCompanion?.sensitivities;
  if (current.conservativeCompanion !== null) {
    if (companionSensitivities === undefined) {
      throw new Error(
        "analytic circulation Jacobian requires companion sensitivities",
      );
    }
    for (const boundaryName of
      NON_CORONARY_CONSERVATIVE_COMPANION_BOUNDARY_NODES_V1) {
      const residualRow = independentIndex.get(boundaryName);
      if (residualRow === undefined) {
        throw new Error(`${boundaryName} companion boundary must be independent`);
      }
      const dRate = companionSensitivities
        .dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume[
          boundaryName
        ];
      for (let column = 0; column < size; column += 1) {
        jacobian[residualRow]![column] -= input.dtSec
          * dRate[column]! / volumeScales[residualRow]!;
      }
    }
  }
  if (jacobian.some((row) => row.some((value) => !Number.isFinite(value)))) {
    throw new Error("analytic circulation Jacobian produced non-finite values");
  }
  return jacobian;
}

/** Exact signed solution of R q + B q |q| = pressure drive. */
export function solveSignedLinearQuadraticFlowV1(
  pressureDriveMmHg: number,
  linearCoefficientMmHgSecPerMl: number,
  quadraticCoefficientMmHgSec2PerMl2: number,
): number {
  requireFinite(pressureDriveMmHg, "pressureDriveMmHg");
  requirePositive(
    linearCoefficientMmHgSecPerMl,
    "linearCoefficientMmHgSecPerMl",
  );
  requireNonnegative(
    quadraticCoefficientMmHgSec2PerMl2,
    "quadraticCoefficientMmHgSec2PerMl2",
  );
  if (pressureDriveMmHg === 0) return 0;
  if (quadraticCoefficientMmHgSec2PerMl2 === 0) {
    return pressureDriveMmHg / linearCoefficientMmHgSecPerMl;
  }
  const magnitudeDrive = Math.abs(pressureDriveMmHg);
  const discriminant = Math.sqrt(
    linearCoefficientMmHgSecPerMl ** 2
      + 4 * quadraticCoefficientMmHgSec2PerMl2 * magnitudeDrive,
  );
  const magnitudeFlow = 2 * magnitudeDrive
    / (linearCoefficientMmHgSecPerMl + discriminant);
  return Math.sign(pressureDriveMmHg) * magnitudeFlow;
}

function initialNodeVolumes(
  graph: NonCoronaryCirculationGraphV1,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): NodeRecord<number> {
  return nodeRecord((name) => {
    const node = graph.nodes[graph.nodeIndex.get(name)!];
    const volume = physicalColdSeedVolumeFromNodeV1(node, runtime.vascular);
    return requirePositive(volume, `${name} initial volume`);
  });
}

function success<TEvaluation, TCompanionTrial>(
  previous: NonCoronaryCirculationAcceptedStateV1,
  dtSec: number,
  candidateTimeSec: number,
  evaluation: CandidateEvaluation<TEvaluation, TCompanionTrial>,
  diagnostics: NonCoronaryCirculationTrialDiagnosticsV1,
): NonCoronaryCirculationTrialSuccessV1<TEvaluation, TCompanionTrial> {
  const companion = evaluation.conservativeCompanion;
  return Object.freeze({
    converged: true as const,
    transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    baseRevision: previous.revision,
    baseAcceptedTimeSec: previous.acceptedTimeSec,
    candidateTimeSec,
    dtSec,
    candidateNodeVolumesMl: evaluation.nodeVolumesMl,
    candidateDynamicEdgeFlowsMlPerSec: evaluation.dynamicEdgeFlowsMlPerSec,
    candidateValveStates: evaluation.valveStates,
    nodeAbsolutePressuresMmHg: evaluation.nodeAbsolutePressuresMmHg,
    edgeFlowsMlPerSec: evaluation.edgeFlowsMlPerSec,
    valveEvaluations: evaluation.valveEvaluations,
    candidateMechanicsEvaluation: evaluation.candidateMechanicsEvaluation,
    ...(evaluation.mechanicalSupport === null
      ? {}
      : { mechanicalSupport: evaluation.mechanicalSupport }),
    ...(companion === null
      ? {}
      : {
        conservativeCompanion: Object.freeze({
          fixedGlobalTotalBloodVolumeMl:
            companion.fixedGlobalTotalBloodVolumeMl,
          previousAcceptedCompanionBloodVolumeMl:
            companion.previousAcceptedCompanionBloodVolumeMl,
          candidateCompanionBloodVolumeMl:
            companion.candidateCompanionBloodVolumeMl,
          outerBoundaryNetVolumeRateMlPerSec:
            companion.outerBoundaryNetVolumeRateMlPerSec,
          candidateCompanionTrial: companion.candidateCompanionTrial,
        }),
      }),
    diagnostics,
    mechanicsCommitted: false as const,
    reverseFlowCapOrClampOnNonvalveEdges: false as const,
    units: NON_CORONARY_CIRCULATION_UNITS_V1,
  });
}

function failure(
  previous: NonCoronaryCirculationAcceptedStateV1,
  reason: NonCoronaryCirculationTrialFailureReasonV1,
  message: string,
  lastVolumes: NodeRecord<number>,
  diagnostics: NonCoronaryCirculationTrialDiagnosticsV1,
): NonCoronaryCirculationTrialFailureV1 {
  return Object.freeze({
    converged: false as const,
    transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    reason,
    message,
    rollbackState: cloneAcceptedState(previous),
    lastAcceptedCandidateNodeVolumesMl: copyNodeRecord(
      lastVolumes,
      "lastAcceptedCandidateNodeVolumesMl",
      requireFinite,
    ),
    diagnostics,
    mechanicsCommitted: false as const,
    units: NON_CORONARY_CIRCULATION_UNITS_V1,
  });
}

function acceptedState(input: Readonly<{
  revision: number;
  acceptedTimeSec: number;
  totalBloodVolumeMl: number;
  nodeVolumesMl: NodeRecord<number>;
  dynamicEdgeFlowsMlPerSec: DynamicEdgeRecord<number>;
  valveStates: ValveRecord<MainWireQuasiSteadyOrificeValveStateV2>;
}>): NonCoronaryCirculationAcceptedStateV1 {
  requireInteger(input.revision, "revision");
  requireNonnegative(input.acceptedTimeSec, "acceptedTimeSec");
  requirePositive(input.totalBloodVolumeMl, "totalBloodVolumeMl");
  const nodeVolumesMl = copyNodeRecord(
    input.nodeVolumesMl,
    "nodeVolumesMl",
    requirePositive,
  );
  if (!nearlyEqual(sumNodeRecord(nodeVolumesMl), input.totalBloodVolumeMl)) {
    throw new Error("node volumes do not match the fixed TBV owner");
  }
  return Object.freeze({
    transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    revision: input.revision,
    acceptedTimeSec: input.acceptedTimeSec,
    totalBloodVolumeMl: input.totalBloodVolumeMl,
    nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: copyDynamicEdgeRecord(
      input.dynamicEdgeFlowsMlPerSec,
      "dynamicEdgeFlowsMlPerSec",
      requireFinite,
    ),
    valveStates: copyValveStates(input.valveStates),
  });
}

function cloneAcceptedState(
  state: NonCoronaryCirculationAcceptedStateV1,
): NonCoronaryCirculationAcceptedStateV1 {
  return acceptedState({
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    totalBloodVolumeMl: state.totalBloodVolumeMl,
    nodeVolumesMl: state.nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: state.dynamicEdgeFlowsMlPerSec,
    valveStates: state.valveStates,
  });
}

function validateAcceptedState(
  state: NonCoronaryCirculationAcceptedStateV1,
): void {
  if (state.transactionId !== NON_CORONARY_CIRCULATION_BE_V1_ID) {
    throw new Error("accepted circulation transaction identity mismatch");
  }
  requireInteger(state.revision, "accepted revision");
  requireNonnegative(state.acceptedTimeSec, "acceptedTimeSec");
  requirePositive(state.totalBloodVolumeMl, "accepted totalBloodVolumeMl");
  copyNodeRecord(state.nodeVolumesMl, "accepted nodeVolumesMl", requirePositive);
  copyDynamicEdgeRecord(
    state.dynamicEdgeFlowsMlPerSec,
    "accepted dynamicEdgeFlowsMlPerSec",
    requireFinite,
  );
  copyValveStates(state.valveStates);
  if (!nearlyEqual(sumNodeRecord(state.nodeVolumesMl), state.totalBloodVolumeMl)) {
    throw new Error("accepted circulation state TBV identity is stale");
  }
}

function scaledToNodeVolumes(
  scaledIndependentVolumes: readonly number[],
  scales: readonly number[],
  totalBloodVolumeMl: number,
): NodeRecord<number> {
  if (
    scaledIndependentVolumes.length !== INDEPENDENT_NODE_NAMES.length
    || scales.length !== INDEPENDENT_NODE_NAMES.length
  ) throw new Error("circulation independent-volume vector has wrong length");
  const values = {} as Record<NonCoronaryNodeNameV1, number>;
  let independentSum = 0;
  for (let index = 0; index < INDEPENDENT_NODE_NAMES.length; index += 1) {
    const value = requirePositive(
      scaledIndependentVolumes[index]! * scales[index]!,
      `${INDEPENDENT_NODE_NAMES[index]} candidate volume`,
    );
    values[INDEPENDENT_NODE_NAMES[index]!] = value;
    independentSum += value;
  }
  values[DEPENDENT_NODE] = requirePositive(
    totalBloodVolumeMl - independentSum,
    `${DEPENDENT_NODE} dependent candidate volume`,
  );
  return copyNodeRecord(
    values as NodeRecord<number>,
    "candidate nodeVolumesMl",
    requirePositive,
  );
}

function scaledToIndependentNodeVolumes(
  scaledIndependentVolumes: readonly number[],
  scales: readonly number[],
): NonCoronaryIndependentNodeRecordV1<number> {
  if (
    scaledIndependentVolumes.length !== INDEPENDENT_NODE_NAMES.length
    || scales.length !== INDEPENDENT_NODE_NAMES.length
  ) throw new Error("circulation independent-volume vector has wrong length");
  const values = {} as Record<NonCoronaryIndependentNodeNameV1, number>;
  for (let index = 0; index < INDEPENDENT_NODE_NAMES.length; index += 1) {
    const value = requirePositive(
      scaledIndependentVolumes[index]! * scales[index]!,
      `${INDEPENDENT_NODE_NAMES[index]} candidate volume`,
    );
    values[INDEPENDENT_NODE_NAMES[index]!] = value;
  }
  return Object.freeze(values);
}

function independentNodeVolumesFromNodeRecord(
  volumes: NodeRecord<number>,
): NonCoronaryIndependentNodeRecordV1<number> {
  return Object.freeze(Object.fromEntries(
    INDEPENDENT_NODE_NAMES.map((name) => [name, volumes[name]]),
  )) as NonCoronaryIndependentNodeRecordV1<number>;
}

function independentVolumesToScaled(
  volumes: NodeRecord<number>,
  scales: readonly number[],
): readonly number[] {
  return Object.freeze(INDEPENDENT_NODE_NAMES.map((name, index) =>
    volumes[name] / scales[index]!));
}

/**
 * A pure relative gate is brittle once residuals reach the finite-difference
 * noise floor. Keep the existing scale-relative term and add a tiny absolute
 * volume term, node by node, as in a standard mixed atol + rtol criterion.
 */
function mixedContinuityResidualAudit<TEvaluation, TCompanionTrial>(
  evaluation: CandidateEvaluation<TEvaluation, TCompanionTrial>,
  referenceVolumesMl: NodeRecord<number>,
  absoluteToleranceMl: number,
  scaledTolerance: number,
): MixedContinuityResidualAudit {
  const entries = NON_CORONARY_NODE_NAMES_V1.map((node) => {
    const residualMl = evaluation.continuityResidualMlByNode[node];
    const absoluteResidualMl = Math.abs(residualMl);
    const toleranceMl = absoluteToleranceMl + scaledTolerance * Math.max(
      10,
      Math.abs(referenceVolumesMl[node]),
    );
    return Object.freeze({
      node,
      residualMl,
      absoluteResidualMl,
      toleranceMl,
      normalizedResidual: absoluteResidualMl / toleranceMl,
    });
  });
  const worst = entries.reduce((current, candidate) =>
    candidate.normalizedResidual > current.normalizedResidual
      ? candidate
      : current);
  return Object.freeze({
    infinityNorm: worst.normalizedResidual,
    worst,
  });
}

function independentVolumeScales(
  volumes: NodeRecord<number>,
): readonly number[] {
  return Object.freeze(INDEPENDENT_NODE_NAMES.map((name) =>
    Math.max(10, Math.abs(volumes[name]))));
}

function finiteDifferenceJacobian(
  evaluate: (unknowns: readonly number[]) => readonly number[],
  center: readonly number[],
  requestedStep: number,
): number[][] {
  const centerValue = evaluate(center);
  const size = center.length;
  if (centerValue.length !== size) throw new Error("residual is not square");
  const jacobian = Array.from({ length: size }, () => Array(size).fill(0));
  for (let column = 0; column < size; column += 1) {
    let step = requestedStep;
    let derivative: readonly number[] | null = null;
    let lastLowerIssue = "not-evaluated";
    let lastUpperIssue = "not-evaluated";
    for (let attempt = 0; attempt < 8 && derivative === null; attempt += 1) {
      const lower = [...center];
      const upper = [...center];
      lower[column] -= step;
      upper[column] += step;
      const lowerAttempt = tryEvaluateVector(evaluate, lower);
      const upperAttempt = tryEvaluateVector(evaluate, upper);
      lastLowerIssue = lowerAttempt.issue;
      lastUpperIssue = upperAttempt.issue;
      if (lowerAttempt.value && upperAttempt.value) {
        derivative = upperAttempt.value.map((value, row) =>
          (value - lowerAttempt.value![row]!) / (2 * step));
      } else if (upperAttempt.value) {
        derivative = upperAttempt.value.map((value, row) =>
          (value - centerValue[row]!) / step);
      } else if (lowerAttempt.value) {
        derivative = lowerAttempt.value.map((_value, row) =>
          (centerValue[row]! - lowerAttempt.value![row]!) / step);
      }
      step *= 0.5;
    }
    if (derivative === null || derivative.some((value) => !Number.isFinite(value))) {
      throw new Error(
        `failed to differentiate circulation volume ${column} `
        + `(${INDEPENDENT_NODE_NAMES[column]}): lower=${lastLowerIssue}; `
        + `upper=${lastUpperIssue}`,
      );
    }
    for (let row = 0; row < size; row += 1) {
      jacobian[row]![column] = derivative[row]!;
    }
  }
  return jacobian;
}

function recordJacobianShadowDifference(
  usage: JacobianUsageDiagnosticsV1,
  analytic: readonly (readonly number[])[],
  finiteDifference: readonly (readonly number[])[],
): void {
  if (
    analytic.length !== finiteDifference.length
    || analytic.some((row, index) =>
      row.length !== finiteDifference[index]?.length)
  ) throw new Error("analytic and finite-difference Jacobian shapes differ");
  let maximumAbsolute = 0;
  let differenceSquared = 0;
  let referenceSquared = 0;
  for (let row = 0; row < analytic.length; row += 1) {
    for (let column = 0; column < analytic[row]!.length; column += 1) {
      const analyticValue = analytic[row]![column]!;
      const referenceValue = finiteDifference[row]![column]!;
      const difference = analyticValue - referenceValue;
      if (![analyticValue, referenceValue, difference].every(Number.isFinite)) {
        throw new Error("Jacobian shadow comparison produced non-finite values");
      }
      maximumAbsolute = Math.max(maximumAbsolute, Math.abs(difference));
      differenceSquared += difference * difference;
      referenceSquared += referenceValue * referenceValue;
    }
  }
  const relativeFrobenius = Math.sqrt(differenceSquared)
    / Math.max(Math.sqrt(referenceSquared), 1e-14);
  usage.finiteDifferenceShadowCount += 1;
  usage.maximumAbsoluteShadowDifference = Math.max(
    usage.maximumAbsoluteShadowDifference ?? 0,
    maximumAbsolute,
  );
  usage.maximumRelativeFrobeniusShadowDifference = Math.max(
    usage.maximumRelativeFrobeniusShadowDifference ?? 0,
    relativeFrobenius,
  );
}

function solveDenseLinearSystem(
  sourceMatrix: readonly (readonly number[])[],
  sourceRight: readonly number[],
): readonly number[] | null {
  const size = sourceRight.length;
  if (sourceMatrix.length !== size
    || sourceMatrix.some((row) => row.length !== size)) return null;
  const matrix = sourceMatrix.map((row) => [...row]);
  const right = [...sourceRight];
  for (let pivot = 0; pivot < size; pivot += 1) {
    let best = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(matrix[row]![pivot]!) > Math.abs(matrix[best]![pivot]!)) best = row;
    }
    const pivotValue = matrix[best]![pivot]!;
    const rowScale = Math.max(...matrix[best]!.map(Math.abs), Number.MIN_VALUE);
    if (!Number.isFinite(pivotValue) || Math.abs(pivotValue) <= 1e-13 * rowScale) {
      return null;
    }
    [matrix[pivot], matrix[best]] = [matrix[best]!, matrix[pivot]!];
    [right[pivot], right[best]] = [right[best]!, right[pivot]!];
    for (let row = pivot + 1; row < size; row += 1) {
      const factor = matrix[row]![pivot]! / matrix[pivot]![pivot]!;
      matrix[row]![pivot] = 0;
      for (let column = pivot + 1; column < size; column += 1) {
        matrix[row]![column] -= factor * matrix[pivot]![column]!;
      }
      right[row] -= factor * right[pivot]!;
    }
  }
  const solution = Array(size).fill(0) as number[];
  for (let row = size - 1; row >= 0; row -= 1) {
    let value = right[row]!;
    for (let column = row + 1; column < size; column += 1) {
      value -= matrix[row]![column]! * solution[column]!;
    }
    solution[row] = value / matrix[row]![row]!;
  }
  return solution.every(Number.isFinite) ? Object.freeze(solution) : null;
}

function trialDiagnostics<TEvaluation, TCompanionTrial>(
  iterations: number,
  acceptedLineSearchSteps: number,
  lineSearchBacktracks: number,
  residualNorm: number,
  evaluation: CandidateEvaluation<TEvaluation, TCompanionTrial>,
  previous: NonCoronaryCirculationAcceptedStateV1,
  options: Required<NonCoronaryCirculationNewtonOptionsV1>,
  mechanicsCache: CandidateMechanicsCache<TEvaluation>,
  failureNewtonTrace: readonly NonCoronaryNewtonFailureTraceEntryV1[] = [],
  lineSearchFailure: NonCoronaryLineSearchFailureDiagnosticsV1 | null = null,
): NonCoronaryCirculationTrialDiagnosticsV1 {
  const worstIndependentContinuityResidual =
    worstIndependentContinuityResidualFromEvaluation(evaluation);
  const mixedContinuityResidual = mixedContinuityResidualAudit(
    evaluation,
    previous.nodeVolumesMl,
    options.absoluteContinuityResidualToleranceMl,
    options.scaledResidualInfinityTolerance,
  );
  return Object.freeze({
    iterations,
    acceptedLineSearchSteps,
    lineSearchBacktracks,
    finalScaledResidualInfinityNorm: residualNorm,
    finalMixedContinuityResidualInfinityNorm:
      mixedContinuityResidual.infinityNorm,
    absoluteContinuityResidualToleranceMl:
      options.absoluteContinuityResidualToleranceMl,
    relativeContinuityResidualTolerance:
      options.scaledResidualInfinityTolerance,
    finalMaximumContinuityResidualMl: Math.max(
      ...NON_CORONARY_NODE_NAMES_V1.map((name) =>
        Math.abs(evaluation.continuityResidualMlByNode[name])),
    ),
    dependentNodeContinuityResidualMl:
      evaluation.continuityResidualMlByNode[DEPENDENT_NODE],
    totalBloodVolumeErrorMl:
      evaluation.conservativeCompanion === null
        ? sumNodeRecord(evaluation.nodeVolumesMl)
          - previous.totalBloodVolumeMl
        : sumNodeRecord(evaluation.nodeVolumesMl)
          + evaluation.conservativeCompanion.candidateCompanionBloodVolumeMl
          - evaluation.conservativeCompanion.fixedGlobalTotalBloodVolumeMl,
    jacobianMode: jacobianModeFromUsage(mechanicsCache.jacobianUsage),
    pressureTangentAvailableAtFinalCandidate:
      evaluation.absoluteChamberPressureTangent !== null,
    finiteDifferenceScaledStep:
      mechanicsCache.jacobianUsage.finiteDifferenceFallbackCount > 0
        || mechanicsCache.jacobianUsage.finiteDifferenceShadowCount > 0
        ? options.finiteDifferenceScaledStep
        : null,
    finiteDifferenceJacobianFallbackReason:
      mechanicsCache.jacobianUsage.finiteDifferenceFallbackCount > 0
        ? evaluation.conservativeCompanion !== null
            && evaluation.conservativeCompanion.sensitivities === undefined
          ? "conservative-companion-sensitivities-not-provided"
          : "absolute-chamber-pressure-tangent-not-provided"
        : null,
    analyticJacobianAssemblyCount:
      mechanicsCache.jacobianUsage.analyticAssemblyCount,
    finiteDifferenceJacobianFallbackCount:
      mechanicsCache.jacobianUsage.finiteDifferenceFallbackCount,
    finiteDifferenceJacobianShadowCount:
      mechanicsCache.jacobianUsage.finiteDifferenceShadowCount,
    jacobianMaximumAbsoluteShadowDifference:
      mechanicsCache.jacobianUsage.maximumAbsoluteShadowDifference,
    jacobianMaximumRelativeFrobeniusShadowDifference:
      mechanicsCache.jacobianUsage.maximumRelativeFrobeniusShadowDifference,
    mechanicsCallbackCallCount: mechanicsCache.callCount,
    mechanicsCallbackCacheHitCount: mechanicsCache.hitCount,
    mechanicsCallbackUniqueCandidateCount: mechanicsCache.uniqueCandidateCount,
    worstIndependentContinuityResidual,
    worstMixedContinuityResidual: mixedContinuityResidual.worst,
    failureNewtonTrace: Object.freeze([...failureNewtonTrace]),
    lineSearchFailure,
  });
}

function emptyDiagnostics<TEvaluation>(
  options?: Required<NonCoronaryCirculationNewtonOptionsV1>,
  mechanicsCache?: CandidateMechanicsCache<TEvaluation>,
): NonCoronaryCirculationTrialDiagnosticsV1 {
  return Object.freeze({
    iterations: 0,
    acceptedLineSearchSteps: 0,
    lineSearchBacktracks: 0,
    finalScaledResidualInfinityNorm: Number.POSITIVE_INFINITY,
    finalMixedContinuityResidualInfinityNorm: Number.POSITIVE_INFINITY,
    absoluteContinuityResidualToleranceMl:
      options?.absoluteContinuityResidualToleranceMl ?? Number.NaN,
    relativeContinuityResidualTolerance:
      options?.scaledResidualInfinityTolerance ?? Number.NaN,
    finalMaximumContinuityResidualMl: Number.POSITIVE_INFINITY,
    dependentNodeContinuityResidualMl: Number.NaN,
    totalBloodVolumeErrorMl: Number.NaN,
    jacobianMode: mechanicsCache
      ? jacobianModeFromUsage(mechanicsCache.jacobianUsage)
      : "not-required",
    pressureTangentAvailableAtFinalCandidate: false,
    finiteDifferenceScaledStep: null,
    finiteDifferenceJacobianFallbackReason:
      (mechanicsCache?.jacobianUsage.finiteDifferenceFallbackCount ?? 0) > 0
        ? "absolute-chamber-pressure-tangent-not-provided"
        : null,
    analyticJacobianAssemblyCount:
      mechanicsCache?.jacobianUsage.analyticAssemblyCount ?? 0,
    finiteDifferenceJacobianFallbackCount:
      mechanicsCache?.jacobianUsage.finiteDifferenceFallbackCount ?? 0,
    finiteDifferenceJacobianShadowCount:
      mechanicsCache?.jacobianUsage.finiteDifferenceShadowCount ?? 0,
    jacobianMaximumAbsoluteShadowDifference:
      mechanicsCache?.jacobianUsage.maximumAbsoluteShadowDifference ?? null,
    jacobianMaximumRelativeFrobeniusShadowDifference:
      mechanicsCache?.jacobianUsage.maximumRelativeFrobeniusShadowDifference
        ?? null,
    mechanicsCallbackCallCount: mechanicsCache?.callCount ?? 0,
    mechanicsCallbackCacheHitCount: mechanicsCache?.hitCount ?? 0,
    mechanicsCallbackUniqueCandidateCount:
      mechanicsCache?.uniqueCandidateCount ?? 0,
    worstIndependentContinuityResidual: null,
    worstMixedContinuityResidual: null,
    failureNewtonTrace: Object.freeze([]),
    lineSearchFailure: null,
  });
}

function jacobianModeFromUsage(
  usage: JacobianUsageDiagnosticsV1,
): NonCoronaryCirculationTrialDiagnosticsV1["jacobianMode"] {
  if (
    usage.analyticAssemblyCount === 0
    && usage.finiteDifferenceFallbackCount === 0
  ) return "not-required";
  if (
    usage.analyticAssemblyCount > 0
    && usage.finiteDifferenceFallbackCount > 0
  ) return "mixed";
  return usage.analyticAssemblyCount > 0
    ? "analytic-semismooth"
    : "full-fd-fallback";
}

function worstIndependentContinuityResidualFromEvaluation<
  TEvaluation,
  TCompanionTrial,
>(
  evaluation: CandidateEvaluation<TEvaluation, TCompanionTrial>,
): NonNullable<
  NonCoronaryCirculationTrialDiagnosticsV1[
    "worstIndependentContinuityResidual"
  ]
> {
  let worstIndex = 0;
  for (let index = 1; index < INDEPENDENT_NODE_NAMES.length; index += 1) {
    const candidateNode = INDEPENDENT_NODE_NAMES[index]!;
    const worstNode = INDEPENDENT_NODE_NAMES[worstIndex]!;
    if (Math.abs(evaluation.continuityResidualMlByNode[candidateNode])
        > Math.abs(evaluation.continuityResidualMlByNode[worstNode])) {
      worstIndex = index;
    }
  }
  const node = INDEPENDENT_NODE_NAMES[worstIndex]!;
  const residualMl = evaluation.continuityResidualMlByNode[node];
  return Object.freeze({
    node,
    residualMl,
    absoluteResidualMl: Math.abs(residualMl),
    scaledResidual: evaluation.scaledIndependentResidual[worstIndex]!,
  });
}

function pushBoundedFailureTrace(
  trace: MutableNewtonFailureTraceEntryV1[],
  entry: MutableNewtonFailureTraceEntryV1,
): void {
  trace.push(entry);
  if (trace.length > MAX_NEWTON_FAILURE_TRACE_ENTRIES) trace.shift();
}

function freezeFailureTrace(
  trace: readonly MutableNewtonFailureTraceEntryV1[],
): readonly NonCoronaryNewtonFailureTraceEntryV1[] {
  return Object.freeze(trace.map((entry) => Object.freeze({ ...entry })));
}

function boundedDiagnosticMessage(message: string): string {
  if (message.length <= MAX_FAILURE_DIAGNOSTIC_MESSAGE_CHARACTERS) {
    return message;
  }
  return `${message.slice(0, MAX_FAILURE_DIAGNOSTIC_MESSAGE_CHARACTERS - 1)}…`;
}

function resolveNewtonOptions(
  options: NonCoronaryCirculationNewtonOptionsV1 | undefined,
): Required<NonCoronaryCirculationNewtonOptionsV1> {
  const resolved = { ...DEFAULT_NEWTON_OPTIONS, ...options };
  requireInteger(resolved.maxIterations, "maxIterations");
  requireInteger(
    resolved.maximumLineSearchBacktracks,
    "maximumLineSearchBacktracks",
  );
  if (resolved.maxIterations <= 0 || resolved.maximumLineSearchBacktracks <= 0) {
    throw new Error("Newton iteration limits must be positive");
  }
  requirePositive(
    resolved.scaledResidualInfinityTolerance,
    "scaledResidualInfinityTolerance",
  );
  requireNonnegative(
    resolved.absoluteContinuityResidualToleranceMl,
    "absoluteContinuityResidualToleranceMl",
  );
  requirePositive(
    resolved.scaledUpdateInfinityTolerance,
    "scaledUpdateInfinityTolerance",
  );
  requirePositive(resolved.finiteDifferenceScaledStep, "finiteDifferenceScaledStep");
  if (typeof resolved.analyticJacobianFiniteDifferenceShadow !== "boolean") {
    throw new Error("analyticJacobianFiniteDifferenceShadow must be boolean");
  }
  return Object.freeze(resolved);
}

function validateRuntime(runtime: NonCoronaryCirculationRuntimeParamsV1): void {
  requireFinite(runtime.vascular.venousTone, "venousTone");
  requirePositive(runtime.vascular.arterialStiffness, "arterialStiffness");
  requirePositive(runtime.losses.systemicResistance, "systemicResistance");
  requirePositive(runtime.losses.pulmonaryResistance, "pulmonaryResistance");
  if (
    runtime.losses.useChiResistance !== undefined
    && typeof runtime.losses.useChiResistance !== "boolean"
  ) {
    throw new Error("useChiResistance must be boolean when provided");
  }
  requireFinite(runtime.respiratory.PEEP, "PEEP");
  requireFinite(runtime.respiratory.Pth0, "Pth0");
  requireFinite(runtime.respiratory.respAmpTh, "respAmpTh");
  requireFinite(runtime.respiratory.respAmpAlv, "respAmpAlv");
  requireNonnegative(runtime.respiratory.respRate, "respRate");
  const valveIssues = validateMainWireFourValveDiseasePresetV1(
    runtime.valvePreset,
  );
  if (valveIssues.length > 0) {
    throw new Error(`invalid valvePreset: ${valveIssues.join("; ")}`);
  }
}

function validateMechanicalSupportInput(
  input: NonCoronaryMechanicalSupportInputV1 | undefined,
): void {
  if (input === undefined) return;
  requirePositive(input.heartRateBpm, "mechanicalSupport.heartRateBpm");
  validateMechanicalSupportConfigV1(input.config);
}

function mechanicalSupportTiming(
  timeSec: number,
  heartRateBpm: number,
): Readonly<{
  timeSec: number;
  cyclePhase01: number;
  beatIndex: number;
  heartRateBpm: number;
}> {
  const beatPosition = requireFinite(
    timeSec * requirePositive(heartRateBpm, "mechanical-support heart rate") / 60,
    "mechanical-support beat position",
  );
  const beatIndex = Math.floor(beatPosition);
  return Object.freeze({
    timeSec,
    cyclePhase01: beatPosition - beatIndex,
    beatIndex,
    heartRateBpm,
  });
}

function mechanicalSupportNodeRateMlPerSec(
  evaluation: MechanicalSupportHydraulicEvaluationV1 | null,
  node: NonCoronaryNodeNameV1,
): number {
  if (evaluation === null) return 0;
  switch (node) {
    case "LV":
    case "Ao":
    case "SA":
    case "RA":
    case "VC":
      return evaluation.nodeNetVolumeRateMlPerSec[node];
    default:
      return 0;
  }
}

function validateChamberPressures(
  pressures: NonCoronaryChamberPressuresMmHgV1,
): void {
  if (pressures === null || typeof pressures !== "object") {
    throw new Error("mechanics callback must return chamber pressures");
  }
  for (const name of ["LV", "LA", "RV", "RA"] as const) {
    requireFinite(pressures[name], `${name} chamber pressure`);
  }
}

function copyAndValidateAbsoluteChamberPressureTangent(
  tangent: NonCoronaryAbsoluteChamberPressureTangentV1,
): NonCoronaryAbsoluteChamberPressureTangentV1 {
  if (tangent === null || typeof tangent !== "object") {
    throw new Error("absolutePressureTangent must be an object when provided");
  }
  for (const [label, order] of [
    ["rowPressureOrder", tangent.rowPressureOrder],
    ["columnVolumeOrder", tangent.columnVolumeOrder],
  ] as const) {
    if (
      !Array.isArray(order)
      || order.length !== NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.length
      || order.some(
        (name, index) =>
          name !== NON_CORONARY_CHAMBER_TANGENT_ORDER_V1[index],
      )
    ) {
      throw new Error(
        `absolutePressureTangent.${label} must be LV,LA,RV,RA`,
      );
    }
  }
  if (
    tangent.units !== "mmHg/mL"
    || tangent.pressureKind !== "absolute"
    || tangent.derivativeSemantics
      !== "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive"
  ) {
    throw new Error("absolutePressureTangent metadata is incompatible");
  }
  const matrix = tangent.dPressureDVolumeMmHgPerMl;
  if (
    !Array.isArray(matrix)
    || matrix.length !== 4
    || matrix.some((row) =>
      !Array.isArray(row)
      || row.length !== 4
      || row.some((value) => !Number.isFinite(value)))
  ) {
    throw new Error(
      "absolutePressureTangent matrix must be finite 4x4 mmHg/mL",
    );
  }
  const copy = matrix.map((row) => Object.freeze([...row])) as unknown as
    NonCoronaryChamberPressureTangentMatrixV1;
  return Object.freeze({
    rowPressureOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    columnVolumeOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    units: "mmHg/mL" as const,
    pressureKind: "absolute" as const,
    derivativeSemantics:
      "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive" as const,
    dPressureDVolumeMmHgPerMl: copy,
  });
}

function evaluateCandidateMechanicsCached<TEvaluation>(
  cache: CandidateMechanicsCache<TEvaluation>,
  callback: NonCoronaryCandidateMechanicsCallbackV1<TEvaluation>,
  volumes: NonCoronaryChamberVolumesMlV1,
  candidateTimeSec: number,
): NonCoronaryCandidateMechanicsResultV1<TEvaluation> {
  const timeCache = cache.values.get(candidateTimeSec);
  const lvCache = timeCache?.get(volumes.LV);
  const laCache = lvCache?.get(volumes.LA);
  const rvCache = laCache?.get(volumes.RV);
  const cached = rvCache?.get(volumes.RA);
  if (cached !== undefined) {
    cache.hitCount += 1;
    return cached;
  }
  cache.callCount += 1;
  const raw = callback(Object.freeze({ ...volumes }), candidateTimeSec);
  validateChamberPressures(raw.absolutePressuresMmHg);
  const absolutePressureTangent = raw.absolutePressureTangent === undefined
    ? undefined
    : copyAndValidateAbsoluteChamberPressureTangent(
      raw.absolutePressureTangent,
    );
  const result = Object.freeze({
    absolutePressuresMmHg: Object.freeze({ ...raw.absolutePressuresMmHg }),
    ...(absolutePressureTangent === undefined
      ? {}
      : { absolutePressureTangent }),
    evaluation: raw.evaluation,
  });
  const writableTimeCache = timeCache
    ?? insertChildCache(cache.values, candidateTimeSec);
  const writableLvCache = lvCache
    ?? insertChildCache(writableTimeCache, volumes.LV);
  const writableLaCache = laCache
    ?? insertChildCache(writableLvCache, volumes.LA);
  const writableRvCache = rvCache
    ?? insertChildCache(writableLaCache, volumes.RV);
  writableRvCache.set(volumes.RA, result);
  cache.uniqueCandidateCount += 1;
  return result;
}

function insertChildCache<TValue>(
  parent: Map<number, Map<number, TValue>>,
  key: number,
): Map<number, TValue> {
  const child = new Map<number, TValue>();
  parent.set(key, child);
  return child;
}

function copyNodeRecord(
  source: NodeRecord<number>,
  label: string,
  validate: (value: number, field: string) => number,
): NodeRecord<number> {
  assertExactKeys(source, NON_CORONARY_NODE_NAMES_V1, label);
  return nodeRecord((name) => validate(source[name], `${label}.${name}`));
}

function copyEdgeRecord(
  source: EdgeRecord<number>,
  label: string,
  validate: (value: number, field: string) => number,
): EdgeRecord<number> {
  assertExactKeys(source, NON_CORONARY_EDGE_NAMES_V1, label);
  return edgeRecord((name) => validate(source[name], `${label}.${name}`));
}

function copyDynamicEdgeRecord(
  source: DynamicEdgeRecord<number>,
  label: string,
  validate: (value: number, field: string) => number,
): DynamicEdgeRecord<number> {
  assertExactKeys(source, NON_CORONARY_DYNAMIC_EDGE_NAMES_V1, label);
  return dynamicEdgeRecord((name) => validate(source[name], `${label}.${name}`));
}

function copyValveStates(
  source: ValveRecord<MainWireQuasiSteadyOrificeValveStateV2>,
): ValveRecord<MainWireQuasiSteadyOrificeValveStateV2> {
  assertExactKeys(source, NON_CORONARY_VALVE_NAMES_V1, "valveStates");
  return valveRecord((name) => {
    const state = source[name];
    if (!Number.isFinite(state.leafletOpeningFraction01)
      || state.leafletOpeningFraction01 < 0
      || state.leafletOpeningFraction01 > 1) {
      throw new Error(`${name}.leafletOpeningFraction01 must lie in [0,1]`);
    }
    return Object.freeze({ ...state });
  });
}

function assertExactKeys<T extends string>(
  value: object,
  names: readonly T[],
  label: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a record`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...names].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly the authoritative scoped keys`);
  }
}

function nodeRecord<T>(build: (name: NonCoronaryNodeNameV1) => T): NodeRecord<T> {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_NODE_NAMES_V1.map((name) => [name, build(name)]),
  )) as NodeRecord<T>;
}

function edgeRecord<T>(build: (name: NonCoronaryEdgeNameV1) => T): EdgeRecord<T> {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_EDGE_NAMES_V1.map((name) => [name, build(name)]),
  )) as EdgeRecord<T>;
}

function dynamicEdgeRecord<T>(
  build: (name: NonCoronaryDynamicEdgeNameV1) => T,
): DynamicEdgeRecord<T> {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.map((name) => [name, build(name)]),
  )) as DynamicEdgeRecord<T>;
}

function valveRecord<T>(
  build: (name: NonCoronaryValveNameV1) => T,
): ValveRecord<T> {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_VALVE_NAMES_V1.map((name) => [name, build(name)]),
  )) as ValveRecord<T>;
}

function uniqueIndex(values: readonly { readonly name: string }[]): Map<string, number> {
  const result = new Map<string, number>();
  values.forEach((value, index) => {
    if (result.has(value.name)) throw new Error(`duplicate topology name ${value.name}`);
    result.set(value.name, index);
  });
  return result;
}

function sumNodeRecord(values: NodeRecord<number>): number {
  return NON_CORONARY_NODE_NAMES_V1.reduce((sum, name) => sum + values[name], 0);
}

function isChamberName(
  name: NonCoronaryNodeNameV1,
): name is keyof NonCoronaryChamberVolumesMlV1 {
  return name === "LV" || name === "LA" || name === "RV" || name === "RA";
}

function respiratoryKind(ext: NodeSpec["ext"] | EdgeSpec["ext"]):
"none" | "pth" | "palv" {
  if (ext === undefined || ext === "none") return "none";
  if (ext === "pth" || ext === "palv") return ext;
  throw new Error(`coronary external-pressure kind ${ext} is outside scope`);
}

function validateProtocolResistanceScaleByEdge(
  scaleByEdge: NonCoronaryProtocolResistanceScaleByEdgeV1 | undefined,
): void {
  if (scaleByEdge === undefined) return;
  for (const [edgeName, scale] of Object.entries(scaleByEdge)) {
    if (!(NON_CORONARY_EDGE_NAMES_V1 as readonly string[]).includes(edgeName)) {
      throw new Error(
        `protocol resistance scale references unknown edge ${edgeName}`,
      );
    }
    if ((NON_CORONARY_VALVE_NAMES_V1 as readonly string[]).includes(edgeName)) {
      throw new Error(
        `protocol resistance scale cannot override valve edge ${edgeName}`,
      );
    }
    requirePositive(scale as number, `${edgeName} protocol resistance scale`);
  }
}

function validateConservativeCompanionAdapter<TEvaluation, TCompanionTrial>(
  input: NonCoronaryCirculationTrialInputV1<TEvaluation, TCompanionTrial>,
): void {
  const adapter = input.conservativeCompanion;
  if (adapter === undefined) return;
  requirePositive(
    adapter.fixedGlobalTotalBloodVolumeMl,
    "companion fixed global total blood volume",
  );
  requireNonnegative(
    adapter.previousAcceptedCompanionBloodVolumeMl,
    "previous accepted companion blood volume",
  );
  if (typeof adapter.evaluateSameCandidate !== "function") {
    throw new Error("companion evaluateSameCandidate must be a function");
  }
  if (!nearlyEqual(
    input.previousAcceptedState.totalBloodVolumeMl
      + adapter.previousAcceptedCompanionBloodVolumeMl,
    adapter.fixedGlobalTotalBloodVolumeMl,
  )) {
    throw new Error(
      "previous non-coronary partition and companion do not match global TBV",
    );
  }
}

function protocolResistanceScaleForEdge<TEvaluation, TCompanionTrial>(
  input: NonCoronaryCirculationTrialInputV1<TEvaluation, TCompanionTrial>,
  edgeName: NonCoronaryEdgeNameV1,
): number {
  return input.protocolResistanceScaleByEdge?.[edgeName] ?? 1;
}

function applyProtocolResistanceScale<
  T extends Readonly<{ resistanceMmHgSecPerMl: number }>,
>(losses: T, scale: number): T {
  if (scale === 1) return losses;
  return Object.freeze({
    ...losses,
    resistanceMmHgSecPerMl:
      losses.resistanceMmHgSecPerMl * scale,
  }) as T;
}

function applyProtocolResistanceScaleWithDerivatives<
  T extends Readonly<{
    resistanceMmHgSecPerMl: number;
    dResistanceDUpstreamPressureSecPerMl: number;
    dResistanceDDownstreamPressureSecPerMl: number;
  }>,
>(losses: T, scale: number): T {
  if (scale === 1) return losses;
  return Object.freeze({
    ...losses,
    resistanceMmHgSecPerMl:
      losses.resistanceMmHgSecPerMl * scale,
    dResistanceDUpstreamPressureSecPerMl:
      losses.dResistanceDUpstreamPressureSecPerMl * scale,
    dResistanceDDownstreamPressureSecPerMl:
      losses.dResistanceDDownstreamPressureSecPerMl * scale,
  }) as T;
}

function tryEvaluateVector(
  evaluate: (unknowns: readonly number[]) => readonly number[],
  unknowns: readonly number[],
): Readonly<{ value: readonly number[] | null; issue: string }> {
  try {
    const value = evaluate(unknowns);
    return value.every(Number.isFinite)
      ? Object.freeze({ value, issue: "none" })
      : Object.freeze({ value: null, issue: "non-finite-residual" });
  } catch (error) {
    return Object.freeze({ value: null, issue: errorMessage(error) });
  }
}

function infinityNorm(values: readonly number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 1e-10 * Math.max(1, Math.abs(left), Math.abs(right));
}

function fingerprintCirculationStateV1(
  state: NonCoronaryCirculationAcceptedStateV1,
): string {
  const text = canonicalCheckpointString(state);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function canonicalCheckpointString(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("checkpoint contains non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalCheckpointString).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Readonly<Record<string, unknown>>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalCheckpointString(record[key])}`
    ).join(",")}}`;
  }
  throw new Error("checkpoint contains unsupported value");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}

function requireNonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
  return value;
}

function requireInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
  return value;
}
