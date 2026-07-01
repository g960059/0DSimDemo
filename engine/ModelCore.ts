import { clamp, frac, sigmoid, smoothMax, smoothMin, softplus, solveQuadraticFlow } from "@/engine/math";
import {
  ActiveStressChamberModel,
  ElastanceChamberModel,
  type ActiveStressDebugTerms,
  type Chamber,
  type ChamberCtx,
  type ChamberInternal,
  type ChamberInternalDerivatives,
  type ChamberPressureTerms,
} from "@/engine/chambers";
import type {
  CoreRuntimeParams,
  ParameterPatch,
  SimMetrics,
  SimObservables,
  SimSample,
  SimulationHealth,
  SimulationHealthStatus,
  VenousGroupBalance,
  VenousGroupBalances,
} from "@/engine/protocol";
import { HARD_CLAMP, RUNTIME_CLAMP_KEYS } from "@/engine/protocol";
import {
  assessBeatRing,
  DEFAULT_SETTLE_POLICY,
  type BeatSummary,
  type SettlePolicy,
  type SettleStatus,
  type SignalKey,
} from "@/engine/settling";
import {
  MODEL_STATE_SCHEMA_VERSION,
  MODEL_VERSION,
  finiteRecord,
  finiteNumber,
  finiteNumberArray,
  simpleStableHash,
  type ComparableState,
  type SerializedModelState,
  type UnpackModelStateOptions,
} from "@/engine/stateContract";
import {
  pericardialPressure,
  type PericardiumParams,
} from "@/engine/mechanics/pericardium";
import {
  clampSeptalShift,
  septalForce,
  septalShiftDerivative,
  type SeptumParams,
} from "@/engine/mechanics/septum";
import { defaultParams } from "@/engine/core/params";
import {
  CORONARY_SPECS,
  CORONARY_TERRITORIES,
  DYNAMIC_FLOW_CLAMP_ML_PER_S,
  MV_PRESSURE_DEADBAND_MMHG,
  buildEdges,
  buildNodes,
  dynamicEdgeNames,
  nodeNames,
  pulmonaryVenousNodeNames,
  systemicVenousNodeNames,
  tbvCorrectionNodeNames,
  valveNames,
  type CoronaryTerritory,
  type DynamicEdgeName,
  type EdgeSpec,
  type ExtKind,
  type NodeName,
  type NodeSpec,
  type ValveName,
} from "@/engine/core/topology";
import {
  MODEL_STATE_LAYOUT_HASH,
  makeIndex,
} from "@/engine/core/stateLayout";
import { valveFlowIntegral } from "@/engine/flowIntegrals";
import { complianceFromPtm, type VascularPvLaw } from "@/engine/vascularPv";
import type {
  VascularEdgeSnapshot,
  VascularNodeSnapshot,
  VascularReturnSnapshot,
} from "@/engine/guytonVascular";

export { defaultParams } from "@/engine/core/params";

/** Mutable per-beat accumulator (reduced into a BeatSummary at the beat boundary). */
type BeatAccum = {
  beat: number;
  count: number;
  lastT: number;
  sumAoP: number; maxAoP: number; minAoP: number;
  sumPAP: number; maxPAP: number; minPAP: number;
  sumRAP: number; sumLAP: number;
  svL: number; svR: number; prevQAo: number; prevQPA: number; prevT: number; hasPrev: boolean;
  maxVLV: number; minVLV: number; maxVRV: number; minVRV: number;
  lvEdp: number; rvEdp: number; // LVP/RVP at end-diastole (max ventricular volume)
  tbv: number;
};

export type MetricsOptions = {
  windowBeats?: 1 | 2;
};

export type AorticFlowClampMode =
  | "hard"
  | "soft-tanh"
  | "soft-rational"
  | "local-c1-0.90"
  | "local-c1-0.95"
  | "local-c1-0.98"
  | "local-c2-0.95"
  | "local-c2-0.98";

export type AorticValveQUpdateMode =
  | "current-loss"
  | "qnext-loss"
  | "substep-2"
  | "substep-4";

export type ModelCoreActiveSourceProviderCall = {
  readonly chamber: Chamber;
  readonly activeModel: ActiveStressChamberModel;
  readonly volumeMl: number;
  readonly internal: ChamberInternal;
  readonly chamberCtx: ChamberCtx;
  readonly providerState: unknown;
  readonly providerStateVersion: number;
};

export type ModelCoreActiveSourceProviderInitCall = {
  readonly chamber: Chamber;
  readonly activeModel: ActiveStressChamberModel;
};

export type ModelCoreActiveSourceProviderStepSnapshot = {
  readonly tSec: number;
  readonly phi: number;
  readonly rawVolumeMl: number;
  readonly effectiveVolumeMl: number;
  readonly internal: ChamberInternal;
  readonly chamberCtx: ChamberCtx;
};

export type ModelCoreActiveSourceProviderStateCommitCall = {
  readonly chamber: Chamber;
  readonly activeModel: ActiveStressChamberModel;
  readonly stepDtSec: number;
  readonly previousProviderState: unknown;
  readonly previousProviderStateVersion: number;
  readonly beforeStep: ModelCoreActiveSourceProviderStepSnapshot;
  readonly afterStep: ModelCoreActiveSourceProviderStepSnapshot;
};

export type ModelCoreExperimentalActiveSourceProvider = {
  readonly sourceProviderId: string;
  initialInternal(input: ModelCoreActiveSourceProviderInitCall): ChamberInternal;
  initialProviderState?(input: ModelCoreActiveSourceProviderInitCall): unknown;
  cloneProviderState?(state: unknown): unknown;
  commitProviderStateAfterStep?(input: ModelCoreActiveSourceProviderStateCommitCall): unknown;
  debugProviderState?(state: unknown): unknown;
  sourceActiveStressPa?(input: ModelCoreActiveSourceProviderCall): number;
  pressure?(input: ModelCoreActiveSourceProviderCall): number;
  passivePressure?(input: ModelCoreActiveSourceProviderCall): number;
  internalDerivatives(input: ModelCoreActiveSourceProviderCall): ChamberInternalDerivatives;
  debugPressureTerms?(input: ModelCoreActiveSourceProviderCall): ChamberPressureTerms;
  debugActiveStressTerms?(input: ModelCoreActiveSourceProviderCall): ActiveStressDebugTerms;
};

export type ModelCoreExperimentalActiveSourceProviderStateDiagnostics = Partial<Record<Chamber, {
  readonly sourceProviderId: string;
  readonly stateVersion: number;
  readonly stateSnapshot: unknown;
}>>;

export type ModelCoreExperimentalActiveSourceProviderRuntimeState = Partial<Record<Chamber, {
  readonly sourceProviderId: string;
  readonly state: unknown;
  readonly version: number;
}>>;

export type ModelCoreExperimentalBoundaryRootInertanceOptions = {
  readonly mechanismId: string;
  readonly additionalAorticRootInertanceMmHgSec2PerMl: number;
};

export type ModelCoreExperimentalBoundaryRootInertanceDiagnostics = {
  readonly mechanismId: string;
  readonly targetValve: "AoV";
  readonly baseAoVInertanceMmHgSec2PerMl: number;
  readonly additionalAorticRootInertanceMmHgSec2PerMl: number;
  readonly effectiveAoVBoundaryRootInertanceMmHgSec2PerMl: number;
};

export type ModelCoreExperimentalValveDiodeSmoothingOptions = {
  readonly mechanismId: string;
  readonly targetValves: readonly ValveName[];
  readonly reverseFlowLimitMlPerSec: number;
  readonly smoothingEpsilonMlPerSec?: number;
  readonly opennessScaledReverseFlow?: boolean;
};

export type ModelCoreExperimentalGraphCoupledStepOptions = {
  readonly mechanismId: string;
  readonly iterations?: number;
  readonly relaxation?: number;
  readonly providerStateCouplingChambers?: readonly Chamber[];
};

export type ModelCoreExperimentalCoupledBackwardEulerStepOptions = {
  readonly mechanismId: string;
  readonly iterations?: number;
  readonly relaxation?: number;
  readonly providerStateCouplingChambers?: readonly Chamber[];
};

export type ModelCoreExperimentalVentricularChamberTransactionStepOptions = {
  readonly mechanismId: string;
  readonly iterations?: number;
  readonly relaxation?: number;
  readonly providerStateCouplingChambers?: readonly ("LV" | "RV")[];
  readonly includeAdjacentLoadNodes?: boolean;
  readonly avValveBoundaryMode?:
    | "current-diode"
    | "bounded-deceleration"
    | "state-coupled-complementarity"
    | "accepted-state-av-boundary"
    | "accepted-state-av-boundary-fixedpoint"
    | "accepted-state-valve-pressure-flow"
    | "accepted-state-av-boundary-pair-fixedpoint"
    | "source-state-residual-contract"
    | "tv-state-coupled-mv-pressure-refit"
    | "tv-state-coupled-mv-pressure-fixedpoint-refit";
  readonly avValveBoundaryTargetValves?: readonly ("MV" | "TV")[];
  readonly avValveBoundaryTauSec?: number;
  readonly avValveBoundaryPressureRefitIterations?: number;
  readonly avValveBoundaryPressureRefitRelaxation?: number;
  readonly avValveBoundaryAdverseGradientForwardScale?: number;
};

// Diagnostic-only Phase 5CC hook. This surface measured as not-supported and
// must not be used as a runtime/default candidate.
export type ModelCoreExperimentalUnsupportedDiagnosticCoupledNewtonStepOptions = {
  readonly mechanismId: string;
  readonly iterations?: number;
  readonly relaxation?: number;
  readonly providerStateCouplingChambers?: readonly Chamber[];
  readonly includeAtrialVolumes?: boolean;
  readonly includeValveOpenStates?: boolean;
};

export type ModelCoreExperimentalTemporalSubstepOptions = {
  readonly mechanismId: string;
  readonly subdivisions: number;
};

export type ModelCoreExperimentalOptions = {
  readonly activeSourceProviders?: Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>>;
  readonly boundaryRootInertance?: ModelCoreExperimentalBoundaryRootInertanceOptions;
  readonly valveDiodeSmoothing?: ModelCoreExperimentalValveDiodeSmoothingOptions;
  readonly graphCoupledStep?: ModelCoreExperimentalGraphCoupledStepOptions;
  readonly coupledBackwardEulerStep?: ModelCoreExperimentalCoupledBackwardEulerStepOptions;
  readonly ventricularChamberTransactionStep?: ModelCoreExperimentalVentricularChamberTransactionStepOptions;
  /** Unsupported diagnostic hook retained only to reproduce Phase 5CC no-go evidence. */
  readonly unsupportedDiagnosticCoupledNewtonStep?: ModelCoreExperimentalUnsupportedDiagnosticCoupledNewtonStepOptions;
  readonly temporalSubstep?: ModelCoreExperimentalTemporalSubstepOptions;
  readonly runtimeParameterPatch?: ParameterPatch;
};

function mergeExperimentalRuntimeParameterPatch(
  runtimePatch: ParameterPatch,
  initial: Partial<CoreRuntimeParams>,
): ParameterPatch {
  const merged: ParameterPatch = { ...runtimePatch, ...initial };
  const nodeOverrides = mergeExperimentalNodeOverrides(runtimePatch.nodeOverrides, initial.nodeOverrides);
  if (nodeOverrides) {
    merged.nodeOverrides = nodeOverrides;
  }
  return merged;
}

function mergeExperimentalNodeOverrides(
  base?: CoreRuntimeParams["nodeOverrides"],
  override?: CoreRuntimeParams["nodeOverrides"],
): CoreRuntimeParams["nodeOverrides"] {
  if (!base && !override) return undefined;
  const merged: NonNullable<CoreRuntimeParams["nodeOverrides"]> = {};
  for (const source of [base, override]) {
    if (!source) continue;
    for (const [nodeName, fields] of Object.entries(source)) {
      const existing = merged[nodeName] ?? {};
      const next: Record<string, number | Record<string, number | string>> = { ...existing };
      for (const [fieldName, value] of Object.entries(fields)) {
        if (
          fieldName === "active"
          && typeof value === "object"
          && value != null
          && !Array.isArray(value)
        ) {
          const existingActive = typeof next.active === "object" && next.active != null && !Array.isArray(next.active)
            ? next.active
            : {};
          next.active = { ...existingActive, ...value };
        } else {
          next[fieldName] = value;
        }
      }
      merged[nodeName] = next;
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

type BeatWindow = {
  data: SimSample[];
  beatCount: 1 | 2;
};

const MMHG_TO_PA = 133.322387415;
const ML_TO_M3 = 1e-6;
const ML_PER_MMHG_TO_M3_PER_PA = ML_TO_M3 / MMHG_TO_PA;

type PressurePack = {
  P: Float64Array;
  Ptm: Float64Array;
  Vphys: Float64Array;
  Pperi: number;
  Ppc: number;
  VHeart: number;
  septumShiftMl: number;
  VLVeff: number;
  VRVeff: number;
  PLVfw: number;
  PRVfw: number;
  PLVfwRaw: number;
  PRVfwRaw: number;
  PVI_LV: number;
  PVI_RV: number;
  septalForceMmHg: number;
  PimLAD: number;
  PimLCx: number;
  PimRCA: number;
  PimLADVen: number;
  PimLCxVen: number;
  PimRCAVen: number;
};

type ChamberVolumeRateMlPerSec = Record<Chamber, number>;

export type ModelCoreClampDiagnostics = {
  totalClampHits: number;
  nodeClampHits: Partial<Record<NodeName, number>>;
  dynamicFlowClampHits: Partial<Record<DynamicEdgeName, number>>;
  valveDiodeClampHits: Partial<Record<ValveName, number>>;
  sanitizeLastStep: ModelCoreVolumeDeltaAudit;
  sanitizeCurrentBeat: ModelCoreVolumeDeltaAudit;
  sanitizeLastBeat: ModelCoreVolumeDeltaAudit;
  tbvProjectionLastStep: ModelCoreTBVProjectionAudit;
  tbvProjectionCurrentBeat: ModelCoreTBVProjectionAudit;
  tbvProjectionLastBeat: ModelCoreTBVProjectionAudit;
  aorticQDotLastStep: ModelCoreAorticQDotAudit;
  aorticQDotCurrentBeat: ModelCoreAorticQDotAudit;
  aorticQDotLastBeat: ModelCoreAorticQDotAudit;
  dynamicQDotLastStep: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>>;
  dynamicQDotCurrentBeat: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>>;
  dynamicQDotLastBeat: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>>;
};

export type ModelCoreActiveStressDiagnostics = Partial<Record<Chamber, ActiveStressDebugTerms>>;

export type ModelCoreVolumeDeltaAudit = {
  signedMl: number;
  absMl: number;
  byNodeSignedMl: Partial<Record<NodeName, number>>;
  byNodeAbsMl: Partial<Record<NodeName, number>>;
};

export type ModelCoreTBVProjectionAudit = {
  requestedMl: number;
  appliedMl: number;
  absAppliedMl: number;
  lastBeforeTBVMl: number;
  lastAfterTBVMl: number;
  lastExpectedTBVMl: number;
  lastErrorBeforeMl: number;
  lastErrorAfterMl: number;
  byNodeSignedMl: Partial<Record<NodeName, number>>;
  byNodeAbsMl: Partial<Record<NodeName, number>>;
};

export type ModelCoreAorticQDotAudit = {
  hitCount: number;
  maxRawAbsMlPerS2: number;
  maxPostAbsMlPerS2: number;
  maxPositiveRawMlPerS2: number;
  minNegativeRawMlPerS2: number;
  maxImpulseAbsMlPerS2: number;
};

export type ModelCoreDynamicQDotAudit = ModelCoreAorticQDotAudit;

export type DynamicQDotClampScope =
  | "aov"
  | "pv"
  | "semilunar"
  | "all-valves"
  | "all-dynamic";

function emptyVolumeDeltaAudit(): ModelCoreVolumeDeltaAudit {
  return { signedMl: 0, absMl: 0, byNodeSignedMl: {}, byNodeAbsMl: {} };
}

function cloneVolumeDeltaAudit(audit: ModelCoreVolumeDeltaAudit): ModelCoreVolumeDeltaAudit {
  return {
    signedMl: audit.signedMl,
    absMl: audit.absMl,
    byNodeSignedMl: { ...audit.byNodeSignedMl },
    byNodeAbsMl: { ...audit.byNodeAbsMl },
  };
}

function emptyTBVProjectionAudit(): ModelCoreTBVProjectionAudit {
  return {
    requestedMl: 0,
    appliedMl: 0,
    absAppliedMl: 0,
    lastBeforeTBVMl: Number.NaN,
    lastAfterTBVMl: Number.NaN,
    lastExpectedTBVMl: Number.NaN,
    lastErrorBeforeMl: Number.NaN,
    lastErrorAfterMl: Number.NaN,
    byNodeSignedMl: {},
    byNodeAbsMl: {},
  };
}

function cloneTBVProjectionAudit(audit: ModelCoreTBVProjectionAudit): ModelCoreTBVProjectionAudit {
  return {
    requestedMl: audit.requestedMl,
    appliedMl: audit.appliedMl,
    absAppliedMl: audit.absAppliedMl,
    lastBeforeTBVMl: audit.lastBeforeTBVMl,
    lastAfterTBVMl: audit.lastAfterTBVMl,
    lastExpectedTBVMl: audit.lastExpectedTBVMl,
    lastErrorBeforeMl: audit.lastErrorBeforeMl,
    lastErrorAfterMl: audit.lastErrorAfterMl,
    byNodeSignedMl: { ...audit.byNodeSignedMl },
    byNodeAbsMl: { ...audit.byNodeAbsMl },
  };
}

function emptyAorticQDotAudit(): ModelCoreAorticQDotAudit {
  return {
    hitCount: 0,
    maxRawAbsMlPerS2: 0,
    maxPostAbsMlPerS2: 0,
    maxPositiveRawMlPerS2: 0,
    minNegativeRawMlPerS2: 0,
    maxImpulseAbsMlPerS2: 0,
  };
}

function cloneAorticQDotAudit(audit: ModelCoreAorticQDotAudit): ModelCoreAorticQDotAudit {
  return { ...audit };
}

function cloneDynamicQDotAuditRecord(
  audits: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>>,
): Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>> {
  const out: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>> = {};
  for (const edge of dynamicEdgeNames) {
    const audit = audits[edge];
    if (audit) out[edge] = cloneAorticQDotAudit(audit);
  }
  return out;
}

function addAorticQDotAudit(
  audit: ModelCoreAorticQDotAudit,
  qDotRaw: number,
  qDotPost: number,
): void {
  if (!Number.isFinite(qDotRaw) || !Number.isFinite(qDotPost)) return;
  const impulse = qDotPost - qDotRaw;
  if (Math.abs(impulse) > 1e-9) audit.hitCount++;
  audit.maxRawAbsMlPerS2 = Math.max(audit.maxRawAbsMlPerS2, Math.abs(qDotRaw));
  audit.maxPostAbsMlPerS2 = Math.max(audit.maxPostAbsMlPerS2, Math.abs(qDotPost));
  audit.maxPositiveRawMlPerS2 = Math.max(audit.maxPositiveRawMlPerS2, qDotRaw);
  audit.minNegativeRawMlPerS2 = Math.min(audit.minNegativeRawMlPerS2, qDotRaw);
  audit.maxImpulseAbsMlPerS2 = Math.max(audit.maxImpulseAbsMlPerS2, Math.abs(impulse));
}

function addDynamicQDotAudit(
  audits: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>>,
  edge: DynamicEdgeName,
  qDotRaw: number,
  qDotPost: number,
): void {
  let audit = audits[edge];
  if (!audit) {
    audit = emptyAorticQDotAudit();
    audits[edge] = audit;
  }
  addAorticQDotAudit(audit, qDotRaw, qDotPost);
}

function addNodeVolumeDelta(
  audit: ModelCoreVolumeDeltaAudit,
  node: NodeName,
  deltaMl: number,
): void {
  if (!Number.isFinite(deltaMl) || Math.abs(deltaMl) <= 1e-12) return;
  audit.signedMl += deltaMl;
  audit.absMl += Math.abs(deltaMl);
  audit.byNodeSignedMl[node] = (audit.byNodeSignedMl[node] ?? 0) + deltaMl;
  audit.byNodeAbsMl[node] = (audit.byNodeAbsMl[node] ?? 0) + Math.abs(deltaMl);
}

function addProjectionNodeDelta(
  audit: ModelCoreTBVProjectionAudit,
  node: NodeName,
  deltaMl: number,
): void {
  if (!Number.isFinite(deltaMl) || Math.abs(deltaMl) <= 1e-12) return;
  audit.byNodeSignedMl[node] = (audit.byNodeSignedMl[node] ?? 0) + deltaMl;
  audit.byNodeAbsMl[node] = (audit.byNodeAbsMl[node] ?? 0) + Math.abs(deltaMl);
}

type CoronaryExternalPressures = {
  imLAD: number;
  imLCx: number;
  imRCA: number;
  imLADVen: number;
  imLCxVen: number;
  imRCAVen: number;
};

export type RunForOptions = {
  collectSamples?: boolean;
  recordHistory?: boolean;
  historyLimit?: number;
};

export type RetargetTBVOptions = {
  toleranceMl?: number;
  maxIterations?: number;
};

export type RetargetTBVStatus = {
  ok: boolean;
  targetTBVMl: number;
  beforeTBVMl: number;
  afterTBVMl: number;
  errorMl: number;
  iterations: number;
  reason?: "invalid-target" | "non-finite-tbv" | "residual";
};

export type VascularReturnSnapshotOptions = {
  mode?: "instant" | "cycle-mean";
  seconds?: number;
  dt?: number;
  sampleHz?: number;
};

function comparableFlowEdgeName(name: string): string {
  const edgeByComparableName: Record<string, string> = {
    QAo: "AoV",
    QPA: "PV",
    QMV: "MV",
    QTV: "TV",
    PVF: "PVein_LA",
    SVF: "VC_RA",
    QCapSV: "Cap_SV",
    QPArtPCap: "PArt_PCap",
    QCorLAD: "Ao_LAD",
    QCorLCx: "Ao_LCx",
    QCorRCA: "Ao_RCA",
    QCS: "CS_RA",
  };
  return edgeByComparableName[name] ?? name;
}

type LocalAorticFlowClampShape = {
  identityFraction: 0.9 | 0.95 | 0.98;
  smoothness: "c1" | "c2";
};

const DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2 = 40000;

type ValveFlowStepDiagnostics = {
  qNextPreDiode: number;
  qNextPostDiode: number;
  qNextPreFlowClamp: number;
  qNextPostFlowClamp: number;
  qDotPreDiode: number;
  qDotPostDiode: number;
  qDotPreFlowClamp: number;
  qDotRaw: number;
  qDotPost: number;
  qDotClampHit01: number;
  qDotClampImpulse: number;
  diodeImpulse: number;
  flowClampImpulse: number;
  acceptedBoundaryApplied01: number;
  acceptedBoundaryQNext: number;
  acceptedBoundaryPressureGradientMmHg: number;
  acceptedBoundaryQDotRaw: number;
  acceptedBoundaryQDotPost: number;
  acceptedBoundaryQDotClampHit01: number;
  acceptedBoundaryQDotClampImpulse: number;
  acceptedBoundaryDiodeImpulse: number;
  acceptedBoundaryComplementarityResidualMlPerSec: number;
  acceptedBoundaryIterationCount: number;
  acceptedBoundaryValveState01: number;
  acceptedBoundaryAreaRatio: number;
};

function emptyValveFlowStepDiagnostics(): ValveFlowStepDiagnostics {
  return {
    qNextPreDiode: 0,
    qNextPostDiode: 0,
    qNextPreFlowClamp: 0,
    qNextPostFlowClamp: 0,
    qDotPreDiode: 0,
    qDotPostDiode: 0,
    qDotPreFlowClamp: 0,
    qDotRaw: 0,
    qDotPost: 0,
    qDotClampHit01: 0,
    qDotClampImpulse: 0,
    diodeImpulse: 0,
    flowClampImpulse: 0,
    acceptedBoundaryApplied01: 0,
    acceptedBoundaryQNext: 0,
    acceptedBoundaryPressureGradientMmHg: 0,
    acceptedBoundaryQDotRaw: 0,
    acceptedBoundaryQDotPost: 0,
    acceptedBoundaryQDotClampHit01: 0,
    acceptedBoundaryQDotClampImpulse: 0,
    acceptedBoundaryDiodeImpulse: 0,
    acceptedBoundaryComplementarityResidualMlPerSec: 0,
    acceptedBoundaryIterationCount: 0,
    acceptedBoundaryValveState01: 0,
    acceptedBoundaryAreaRatio: 0,
  };
}

function emptyValveFlowStepDiagnosticsByValve(): Record<ValveName, ValveFlowStepDiagnostics> {
  return {
    MV: emptyValveFlowStepDiagnostics(),
    AoV: emptyValveFlowStepDiagnostics(),
    TV: emptyValveFlowStepDiagnostics(),
    PV: emptyValveFlowStepDiagnostics(),
  };
}

function localAorticFlowClampShape(mode: AorticFlowClampMode): LocalAorticFlowClampShape | undefined {
  if (mode === "local-c1-0.90") return { identityFraction: 0.9, smoothness: "c1" };
  if (mode === "local-c1-0.95") return { identityFraction: 0.95, smoothness: "c1" };
  if (mode === "local-c1-0.98") return { identityFraction: 0.98, smoothness: "c1" };
  if (mode === "local-c2-0.95") return { identityFraction: 0.95, smoothness: "c2" };
  if (mode === "local-c2-0.98") return { identityFraction: 0.98, smoothness: "c2" };
  return undefined;
}

function localizedAorticFlowClamp(value: number, limit: number, identityFraction: number, smoothness: "c1" | "c2"): number {
  if (!Number.isFinite(value)) return 0;
  const threshold = limit * identityFraction;
  if (value <= threshold) return value;
  if (value >= limit) return limit;
  const span = Math.max(limit - threshold, 1e-9);
  const s = clamp((value - threshold) / span, 0, 1);
  const shaped = smoothness === "c2"
    ? s + 4 * s ** 3 - 7 * s ** 4 + 3 * s ** 5
    : s + s ** 2 - s ** 3;
  return threshold + span * shaped;
}

function smoothstep01(value: number): number {
  const s = clamp(value, 0, 1);
  return s * s * (3 - 2 * s);
}

function normalizeExperimentalBoundaryRootInertance(
  options: ModelCoreExperimentalBoundaryRootInertanceOptions | undefined,
): ModelCoreExperimentalBoundaryRootInertanceOptions | null {
  if (!options) return null;
  if (!options.mechanismId || typeof options.mechanismId !== "string") {
    throw new Error("Experimental boundary/root inertance requires a mechanismId.");
  }
  const additional = options.additionalAorticRootInertanceMmHgSec2PerMl;
  if (!Number.isFinite(additional) || additional < 0) {
    throw new Error("Experimental boundary/root inertance must be finite and non-negative.");
  }
  if (additional === 0) return null;
  return {
    mechanismId: options.mechanismId,
    additionalAorticRootInertanceMmHgSec2PerMl: additional,
  };
}

function normalizeExperimentalValveDiodeSmoothing(
  options: ModelCoreExperimentalValveDiodeSmoothingOptions | undefined,
): ModelCoreExperimentalValveDiodeSmoothingOptions | null {
  if (!options) return null;
  if (!options.mechanismId || typeof options.mechanismId !== "string") {
    throw new Error("Experimental valve diode smoothing requires a mechanismId.");
  }
  const targetValves = Array.from(new Set(options.targetValves));
  if (targetValves.length === 0) return null;
  for (const valve of targetValves) {
    if (!valveNames.includes(valve)) {
      throw new Error(`Experimental valve diode smoothing received unknown valve '${valve}'.`);
    }
  }
  const reverseFlowLimit = options.reverseFlowLimitMlPerSec;
  if (!Number.isFinite(reverseFlowLimit) || reverseFlowLimit <= 0) {
    throw new Error("Experimental valve diode smoothing reverse-flow limit must be finite and positive.");
  }
  const epsilon = options.smoothingEpsilonMlPerSec ?? Math.max(reverseFlowLimit * 0.1, 0.1);
  if (!Number.isFinite(epsilon) || epsilon <= 0) {
    throw new Error("Experimental valve diode smoothing epsilon must be finite and positive.");
  }
  return {
    mechanismId: options.mechanismId,
    targetValves,
    reverseFlowLimitMlPerSec: reverseFlowLimit,
    smoothingEpsilonMlPerSec: epsilon,
    opennessScaledReverseFlow: options.opennessScaledReverseFlow ?? false,
  };
}

function normalizeExperimentalGraphCoupledStep(
  options: ModelCoreExperimentalGraphCoupledStepOptions | undefined,
): ModelCoreExperimentalGraphCoupledStepOptions | null {
  if (!options) return null;
  if (!options.mechanismId.trim()) {
    throw new Error("Experimental graph-coupled step requires a mechanismId.");
  }
  const iterations = Math.floor(clamp(options.iterations ?? 2, 1, 6));
  const relaxation = clamp(options.relaxation ?? 1, 0.1, 1);
  const providerStateCouplingChambers: readonly Chamber[] = options.providerStateCouplingChambers
    ? [...new Set(options.providerStateCouplingChambers)]
    : ["LV", "RV"];
  for (const chamber of providerStateCouplingChambers) {
    if (chamber !== "LV" && chamber !== "RV" && chamber !== "LA" && chamber !== "RA") {
      throw new Error(`Experimental graph-coupled step received unknown chamber '${chamber}'.`);
    }
  }
  return {
    mechanismId: options.mechanismId,
    iterations,
    relaxation,
    providerStateCouplingChambers,
  };
}

function normalizeExperimentalCoupledBackwardEulerStep(
  options: ModelCoreExperimentalCoupledBackwardEulerStepOptions | undefined,
): ModelCoreExperimentalCoupledBackwardEulerStepOptions | null {
  if (!options) return null;
  if (!options.mechanismId.trim()) {
    throw new Error("Experimental coupled backward-Euler step requires a mechanismId.");
  }
  const iterations = Math.floor(clamp(options.iterations ?? 4, 1, 10));
  const relaxation = clamp(options.relaxation ?? 0.7, 0.1, 1);
  const providerStateCouplingChambers: readonly Chamber[] = options.providerStateCouplingChambers
    ? [...new Set(options.providerStateCouplingChambers)]
    : ["LV", "RV"];
  for (const chamber of providerStateCouplingChambers) {
    if (chamber !== "LV" && chamber !== "RV" && chamber !== "LA" && chamber !== "RA") {
      throw new Error(`Experimental coupled backward-Euler step received unknown chamber '${chamber}'.`);
    }
  }
  return {
    mechanismId: options.mechanismId,
    iterations,
    relaxation,
    providerStateCouplingChambers,
  };
}

function normalizeExperimentalVentricularChamberTransactionStep(
  options: ModelCoreExperimentalVentricularChamberTransactionStepOptions | undefined,
): ModelCoreExperimentalVentricularChamberTransactionStepOptions | null {
  if (!options) return null;
  if (!options.mechanismId.trim()) {
    throw new Error("Experimental ventricular chamber transaction step requires a mechanismId.");
  }
  const iterations = Math.floor(clamp(options.iterations ?? 4, 1, 8));
  const relaxation = clamp(options.relaxation ?? 0.7, 0.05, 1);
  const providerStateCouplingChambers = options.providerStateCouplingChambers ?? ["LV", "RV"];
  const avValveBoundaryMode = options.avValveBoundaryMode ?? "current-diode";
  const pressureRefitEnabled =
    avValveBoundaryMode === "tv-state-coupled-mv-pressure-refit"
    || avValveBoundaryMode === "tv-state-coupled-mv-pressure-fixedpoint-refit"
    || avValveBoundaryMode === "accepted-state-av-boundary-fixedpoint"
    || avValveBoundaryMode === "accepted-state-valve-pressure-flow"
    || avValveBoundaryMode === "accepted-state-av-boundary-pair-fixedpoint"
    || avValveBoundaryMode === "source-state-residual-contract";
  const avValveBoundaryPressureRefitIterations =
    avValveBoundaryMode === "tv-state-coupled-mv-pressure-fixedpoint-refit"
      || avValveBoundaryMode === "accepted-state-av-boundary-fixedpoint"
      || avValveBoundaryMode === "accepted-state-valve-pressure-flow"
      || avValveBoundaryMode === "accepted-state-av-boundary-pair-fixedpoint"
      || avValveBoundaryMode === "source-state-residual-contract"
      ? Math.max(1, Math.floor(clamp(options.avValveBoundaryPressureRefitIterations ?? 3, 1, 8)))
      : pressureRefitEnabled
        ? 1
        : undefined;
  const avValveBoundaryPressureRefitRelaxation = pressureRefitEnabled
    ? clamp(options.avValveBoundaryPressureRefitRelaxation ?? 1, 0.05, 1)
    : undefined;
  const avValveBoundaryAdverseGradientForwardScale = clamp(
    options.avValveBoundaryAdverseGradientForwardScale ?? 1,
    0,
    1,
  );
  return {
    mechanismId: options.mechanismId,
    iterations,
    relaxation,
    providerStateCouplingChambers,
    includeAdjacentLoadNodes: options.includeAdjacentLoadNodes === true,
    avValveBoundaryMode,
    avValveBoundaryTargetValves: options.avValveBoundaryTargetValves
      ? [...new Set(options.avValveBoundaryTargetValves)]
      : ["MV", "TV"],
    avValveBoundaryTauSec: clamp(options.avValveBoundaryTauSec ?? 0.025, 0.002, 0.12),
    avValveBoundaryPressureRefitIterations,
    avValveBoundaryPressureRefitRelaxation,
    avValveBoundaryAdverseGradientForwardScale,
  };
}

function normalizeExperimentalUnsupportedDiagnosticCoupledNewtonStep(
  options: ModelCoreExperimentalUnsupportedDiagnosticCoupledNewtonStepOptions | undefined,
): ModelCoreExperimentalUnsupportedDiagnosticCoupledNewtonStepOptions | null {
  if (!options) return null;
  if (!options.mechanismId.trim()) {
    throw new Error("Unsupported diagnostic coupled Newton step requires a mechanismId.");
  }
  if (!options.mechanismId.includes("unsupported-diagnostic")) {
    throw new Error("Unsupported diagnostic coupled Newton step must include 'unsupported-diagnostic' in its mechanismId.");
  }
  const iterations = Math.floor(clamp(options.iterations ?? 4, 1, 8));
  const relaxation = clamp(options.relaxation ?? 0.8, 0.1, 1);
  const providerStateCouplingChambers: readonly Chamber[] = options.providerStateCouplingChambers
    ? [...new Set(options.providerStateCouplingChambers)]
    : ["LV", "RV"];
  for (const chamber of providerStateCouplingChambers) {
    if (chamber !== "LV" && chamber !== "RV" && chamber !== "LA" && chamber !== "RA") {
      throw new Error(`Experimental coupled Newton step received unknown chamber '${chamber}'.`);
    }
  }
  return {
    mechanismId: options.mechanismId,
    iterations,
    relaxation,
    providerStateCouplingChambers,
    includeAtrialVolumes: options.includeAtrialVolumes ?? true,
    includeValveOpenStates: options.includeValveOpenStates ?? true,
  };
}

function normalizeExperimentalTemporalSubstep(
  options: ModelCoreExperimentalTemporalSubstepOptions | undefined,
): ModelCoreExperimentalTemporalSubstepOptions | null {
  if (!options) return null;
  if (!options.mechanismId.trim()) {
    throw new Error("Experimental temporal substep requires a mechanismId.");
  }
  const subdivisions = Math.floor(clamp(options.subdivisions, 1, 8));
  if (subdivisions <= 1) return null;
  return {
    mechanismId: options.mechanismId,
    subdivisions,
  };
}

export class ModelCore {
  private readonly idx = makeIndex();
  private nodes = buildNodes();
  private edges = buildEdges();
  private readonly nodeIndex = new Map<string, number>();
  private readonly dynamicEdgeIndex = new Map<string, number>();
  private readonly valveIndex = new Map<string, number>();

  // Heart chamber models (ROADMAP S2). Active models track node.active params.
  private readonly activeModels: Partial<Record<Chamber, ActiveStressChamberModel>> = {};
  private readonly experimentalActiveSourceProviders: Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>>;
  private readonly experimentalBoundaryRootInertance: ModelCoreExperimentalBoundaryRootInertanceOptions | null;
  private readonly experimentalValveDiodeSmoothing: ModelCoreExperimentalValveDiodeSmoothingOptions | null;
  private readonly experimentalGraphCoupledStep: ModelCoreExperimentalGraphCoupledStepOptions | null;
  private readonly experimentalCoupledBackwardEulerStep: ModelCoreExperimentalCoupledBackwardEulerStepOptions | null;
  private readonly experimentalVentricularChamberTransactionStep: ModelCoreExperimentalVentricularChamberTransactionStepOptions | null;
  private readonly experimentalUnsupportedDiagnosticCoupledNewtonStep: ModelCoreExperimentalUnsupportedDiagnosticCoupledNewtonStepOptions | null;
  private readonly experimentalTemporalSubstep: ModelCoreExperimentalTemporalSubstepOptions | null;
  private readonly experimentalRuntimeParameterPatch: ParameterPatch | null;
  private readonly experimentalActiveSourceProviderStates: Partial<Record<Chamber, unknown>> = {};
  private readonly experimentalActiveSourceProviderStateVersions: Partial<Record<Chamber, number>> = {};
  private elastanceModels = new Map<string, ElastanceChamberModel>();

  t = 0;
  x: Float64Array;
  p: CoreRuntimeParams;
  pTarget: CoreRuntimeParams;
  private lastSample: SimSample | null = null;
  private history: SimSample[] = [];
  private rhsDt = 0.001;
  private initialTBV = 0;
  // Expected TBV ledger (M5a): initialTBV + integral of (fluidRate - bleedRate).
  // The projector follows this, and health compares mass conservation against it.
  private expectedTBV = 0;
  private clampHitCount = 0;
  private nodeClampHits: Partial<Record<NodeName, number>> = {};
  private dynamicFlowClampHits: Partial<Record<DynamicEdgeName, number>> = {};
  private valveDiodeClampHits: Partial<Record<ValveName, number>> = {};
  private sanitizeLastStepAudit = emptyVolumeDeltaAudit();
  private sanitizeCurrentBeatAudit = emptyVolumeDeltaAudit();
  private sanitizeLastBeatAudit = emptyVolumeDeltaAudit();
  private tbvProjectionLastStepAudit = emptyTBVProjectionAudit();
  private tbvProjectionCurrentBeatAudit = emptyTBVProjectionAudit();
  private tbvProjectionLastBeatAudit = emptyTBVProjectionAudit();
  private aorticQDotLastStepAudit = emptyAorticQDotAudit();
  private aorticQDotCurrentBeatAudit = emptyAorticQDotAudit();
  private aorticQDotLastBeatAudit = emptyAorticQDotAudit();
  private dynamicQDotLastStepAudit: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>> = {};
  private dynamicQDotCurrentBeatAudit: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>> = {};
  private dynamicQDotLastBeatAudit: Partial<Record<DynamicEdgeName, ModelCoreDynamicQDotAudit>> = {};
  private tbvCorrectionMagThisBeat = 0;
  private tbvCorrectionMagLastBeat = 0;
  private tbvCorrectionLastStepMl = 0;
  private tbvCorrectionEnabled = true;
  private tbvCorrectionOptions: {
    gain?: number;
    maxTotalCorrectionMl?: number;
    maxNodeVolumeMl?: number;
  } | null = null;
  private aorticFlowClampMode: AorticFlowClampMode = "hard";
  private aorticFlowDerivativeClampPositiveMlPerS2 = DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
  private aorticFlowDerivativeClampNegativeMlPerS2 = DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
  private dynamicFlowDerivativeClampScope: DynamicQDotClampScope = "aov";
  private aorticValveQUpdateMode: AorticValveQUpdateMode = "current-loss";
  private valveFlowStepDiagnostics = emptyValveFlowStepDiagnosticsByValve();
  private lastResolvedChamberVolumeRatesMlPerSec: ChamberVolumeRateMlPerSec = {
    LV: 0,
    RV: 0,
    LA: 0,
    RA: 0,
  };

  // Steady-state detection (engine/settling.ts). The detector keeps its OWN
  // small ring of per-beat fingerprints, independent of the 1200-sample raw
  // history (which only spans ~10s), so it works across a 35-60s settle.
  private beatRing: BeatSummary[] = [];
  private beatAccum: BeatAccum | null = null;
  private totalBeats = 0;
  private opSig = ""; // operating-point signature; a change re-arms beat tracking
  // Observables snapshot taken at the last beat boundary (phi ~ integer). Used by
  // metrics() so Pmsf/vrGradient/volumes are phi-aligned (stop-phase independent)
  // like the rest of the metrics, rather than sampled at an arbitrary stop phase.
  private lastBeatObs: SimObservables | null = null;

  constructor(initial?: Partial<CoreRuntimeParams>, experimentalOptions: ModelCoreExperimentalOptions = {}) {
    this.experimentalActiveSourceProviders = { ...(experimentalOptions.activeSourceProviders ?? {}) };
    this.experimentalBoundaryRootInertance = normalizeExperimentalBoundaryRootInertance(
      experimentalOptions.boundaryRootInertance,
    );
    this.experimentalValveDiodeSmoothing = normalizeExperimentalValveDiodeSmoothing(
      experimentalOptions.valveDiodeSmoothing,
    );
    this.experimentalGraphCoupledStep = normalizeExperimentalGraphCoupledStep(
      experimentalOptions.graphCoupledStep,
    );
    this.experimentalCoupledBackwardEulerStep = normalizeExperimentalCoupledBackwardEulerStep(
      experimentalOptions.coupledBackwardEulerStep,
    );
    this.experimentalVentricularChamberTransactionStep = normalizeExperimentalVentricularChamberTransactionStep(
      experimentalOptions.ventricularChamberTransactionStep,
    );
    this.experimentalUnsupportedDiagnosticCoupledNewtonStep = normalizeExperimentalUnsupportedDiagnosticCoupledNewtonStep(
      experimentalOptions.unsupportedDiagnosticCoupledNewtonStep,
    );
    this.experimentalTemporalSubstep = normalizeExperimentalTemporalSubstep(
      experimentalOptions.temporalSubstep,
    );
    this.experimentalRuntimeParameterPatch = experimentalOptions.runtimeParameterPatch ?? null;
    this.validateExperimentalActiveSourceProviders();
    this.p = { ...defaultParams() };
    this.pTarget = { ...this.p };
    this.x = new Float64Array(this.idx.size);
    nodeNames.forEach((n, i) => this.nodeIndex.set(n, i));
    dynamicEdgeNames.forEach((n, i) => this.dynamicEdgeIndex.set(n, i));
    valveNames.forEach((n, i) => this.valveIndex.set(n, i));
    this.rebuildActiveModels();
    this.rebuildElastanceModels();
    const initialWithExperimentalPatch = this.experimentalRuntimeParameterPatch
      ? mergeExperimentalRuntimeParameterPatch(this.experimentalRuntimeParameterPatch, initial ?? {})
      : initial;
    if (initialWithExperimentalPatch) {
        this.setImmediateParameters(initialWithExperimentalPatch);
    }
    if (this.experimentalRuntimeParameterPatch?.nodeOverrides) {
      const nodeOverrides = mergeExperimentalNodeOverrides(
        this.experimentalRuntimeParameterPatch.nodeOverrides,
        this.p.nodeOverrides,
      );
      if (nodeOverrides) this.setImmediateParameters({ nodeOverrides });
    }
    this.reset();
  }

  reset() {
    this.x.fill(0);
    for (const n of this.nodes) {
      this.x[this.idx.node[n.name as NodeName]] = n.kind === "venousPressure"
        ? this.venousVolumeFromPtm(n, n.x0)
        : n.x0;
    }
    for (const e of this.edges) {
      if (e.kind === "dynamic" || e.kind === "valve") {
        this.x[this.idx.q[e.name as DynamicEdgeName]] = e.q0 ?? 0;
      }
      if (e.kind === "valve") {
        this.x[this.idx.xi[e.name as ValveName]] = e.xi0 ?? 0;
      }
    }
    this.x[this.idx.phi] = 0;
    this.x[this.idx.septumShift] = 0;
    for (const n of this.activeChamberNodes()) {
      const ch = n.chamber!;
      const internalIndex = this.activeInternalIndex(ch);
      const initial = this.activeInitialInternal(ch);
      this.x[internalIndex.c] = initial.c;
      this.x[internalIndex.a] = initial.a;
      this.x[internalIndex.r] = initial.r;
      this.x[internalIndex.tensionPa] = initial.tensionPa ?? 0;
      this.x[internalIndex.lambdaAct] = initial.lambdaAct ?? 1;
    }
    this.resetExperimentalActiveProviderStates();
    this.t = 0;
    this.history = [];
    this.lastSample = this.sample();
    this.initialTBV = this.lastSample.TBV;
    this.expectedTBV = this.initialTBV;
    this.clampHitCount = 0;
    this.resetClampDiagnostics();
    this.tbvCorrectionMagThisBeat = 0;
    this.tbvCorrectionMagLastBeat = 0;
    this.tbvCorrectionLastStepMl = 0;
    this.clearBeatTracking();
  }

  packState(): SerializedModelState {
    const phi = finiteNumber(this.x[this.idx.phi], "state.phi");
    return {
      schemaVersion: MODEL_STATE_SCHEMA_VERSION,
      modelVersion: MODEL_VERSION,
      stateLayoutHash: MODEL_STATE_LAYOUT_HASH,
      paramsHash: this.paramsHash(),
      targetParamsHash: this.targetParamsHash(),
      t: finiteNumber(this.t, "state.t"),
      phi,
      x: Array.from(this.x, (value, index) => finiteNumber(value, `state.x[${index}]`)),
      initialTBV: finiteNumber(this.initialTBV, "state.initialTBV"),
      expectedTBV: finiteNumber(this.expectedTBV, "state.expectedTBV"),
    };
  }

  /**
   * Restore only the dynamic state needed for steady cache / warm-start.
   * Raw sample history, beat fingerprints, and TBV correction counters are not
   * serialized; callers must run a fresh beat window before trusting metrics()
   * or any convergence evidence after unpacking.
   */
  unpackState(snapshot: SerializedModelState, options: UnpackModelStateOptions = {}): void {
    if (snapshot.schemaVersion !== MODEL_STATE_SCHEMA_VERSION) {
      throw new Error(`Model state schema mismatch: expected ${MODEL_STATE_SCHEMA_VERSION}, got ${String(snapshot.schemaVersion)}`);
    }
    if (snapshot.modelVersion !== MODEL_VERSION) {
      throw new Error(`Model state model version mismatch: expected ${MODEL_VERSION}, got ${String(snapshot.modelVersion)}`);
    }
    if (snapshot.stateLayoutHash !== MODEL_STATE_LAYOUT_HASH) {
      throw new Error(`Model state layout hash mismatch: expected ${MODEL_STATE_LAYOUT_HASH}, got ${String(snapshot.stateLayoutHash)}`);
    }
    if (!options.allowParameterMismatch) {
      const paramsHash = this.paramsHash();
      const targetParamsHash = this.targetParamsHash();
      if (snapshot.paramsHash !== paramsHash) {
        throw new Error(`Model state params hash mismatch: expected ${paramsHash}, got ${String(snapshot.paramsHash)}`);
      }
      if (snapshot.targetParamsHash !== targetParamsHash) {
        throw new Error(`Model state target params hash mismatch: expected ${targetParamsHash}, got ${String(snapshot.targetParamsHash)}`);
      }
    }
    const x = finiteNumberArray(snapshot.x, "state.x");
    if (x.length !== this.idx.size) {
      throw new Error(`Model state vector size mismatch: expected ${this.idx.size}, got ${x.length}`);
    }
    const phi = finiteNumber(snapshot.phi, "state.phi");
    if (Math.abs(phi - x[this.idx.phi]) > 1e-12) {
      throw new Error(`Model state phi mismatch: snapshot phi=${phi}, vector phi=${x[this.idx.phi]}`);
    }

    this.t = finiteNumber(snapshot.t, "state.t");
    this.x.set(x);
    this.initialTBV = finiteNumber(snapshot.initialTBV, "state.initialTBV");
    this.expectedTBV = finiteNumber(snapshot.expectedTBV, "state.expectedTBV");
    this.tbvCorrectionEnabled = true;
    this.tbvCorrectionMagThisBeat = 0;
    this.tbvCorrectionMagLastBeat = 0;
    this.tbvCorrectionLastStepMl = 0;
    this.clampHitCount = 0;
    this.resetClampDiagnostics();
    this.resetExperimentalActiveProviderStates();
    this.history = [];
    this.lastSample = null;
    this.lastSample = this.sample();
    this.history = [];
    this.clearBeatTracking();
  }

  getComparableState(): ComparableState {
    const pack = this.computePressures(this.x);
    const flows = this.computeFlows(this.x, pack);
    this.lastResolvedChamberVolumeRatesMlPerSec = this.chamberVolumeRatesFromFlows(flows);
    const values: Record<string, number> = {
      t: this.t,
      phi: this.x[this.idx.phi],
      TBV: this.totalBloodVolume(pack),
      initialTBV: this.initialTBV,
      expectedTBV: this.expectedTBV,
      septumShiftMl: this.x[this.idx.septumShift],
      VLVeff: pack.VLVeff,
      VRVeff: pack.VRVeff,
      PLVfw: pack.PLVfw,
      PRVfw: pack.PRVfw,
    };
    for (const name of nodeNames) {
      const i = this.nodeIndex.get(name)!;
      values[`P.${name}`] = pack.P[i];
      values[`V.${name}`] = pack.Vphys[i];
    }
    for (const edge of dynamicEdgeNames) {
      values[`Q.${edge}`] = this.x[this.idx.q[edge]];
    }
    for (const valve of valveNames) {
      values[`xi.${valve}`] = this.x[this.idx.xi[valve]];
    }
    for (const name of ["QAo", "QPA", "QMV", "QTV", "PVF", "SVF", "QCapSV", "QPArtPCap", "QCorLAD", "QCorLCx", "QCorRCA", "QCS"] as const) {
      const edgeName = comparableFlowEdgeName(name);
      values[name] = flows[this.edgeIndex(edgeName)];
    }
    for (const chamber of this.activeChamberNodes()) {
      const ch = chamber.chamber!;
      const idx = this.activeInternalIndex(ch);
      values[`active.${ch}.c`] = this.x[idx.c];
      values[`active.${ch}.a`] = this.x[idx.a];
      values[`active.${ch}.r`] = this.x[idx.r];
      values[`active.${ch}.tensionPa`] = this.x[idx.tensionPa];
      values[`active.${ch}.lambdaAct`] = this.x[idx.lambdaAct];
    }
    return {
      schemaVersion: MODEL_STATE_SCHEMA_VERSION,
      modelVersion: MODEL_VERSION,
      stateLayoutHash: MODEL_STATE_LAYOUT_HASH,
      paramsHash: this.paramsHash(),
      targetParamsHash: this.targetParamsHash(),
      t: finiteNumber(this.t, "comparable.t"),
      phi: finiteNumber(this.x[this.idx.phi], "comparable.phi"),
      values: finiteRecord(values, "comparable.values"),
    };
  }

  private paramsHash(): string {
    return simpleStableHash({ ...this.p, speed: 0 });
  }

  private targetParamsHash(): string {
    return simpleStableHash({ ...this.pTarget, speed: 0 });
  }

  setTargetParameters(patch: ParameterPatch) {
    this.pTarget = { ...this.pTarget, ...patch };
    if (patch.nodeOverrides || patch.edgeOverrides) {
        this.setImmediateParameters({ nodeOverrides: patch.nodeOverrides, edgeOverrides: patch.edgeOverrides });
    }
  }

  get speed() {
    return this.pTarget.speed;
  }

  setImmediateParameters(patch: ParameterPatch) {
    const effectivePatch = this.experimentalRuntimeParameterPatch
      ? mergeExperimentalRuntimeParameterPatch(this.experimentalRuntimeParameterPatch, patch)
      : patch;
    this.p = { ...this.p, ...effectivePatch };
    this.pTarget = { ...this.pTarget, ...effectivePatch };
    
    // Apply advanced overrides to nodes and edges by deep merging
    this.nodes = buildNodes().map(n => {
        if (this.p.nodeOverrides?.[n.name]) {
            const overrides = this.p.nodeOverrides[n.name];
            const updated = { ...n, ...overrides };
            if (n.active && overrides.active) {
                updated.active = { ...n.active, ...(overrides.active as any) };
            }
            return updated;
        }
        return n;
    });

    this.edges = buildEdges().map(e => {
        const edge = this.applyEdgeOverrides(e);
        return this.configurePVOstialEdge(edge);
    });

    this.rebuildActiveModels();
    this.rebuildElastanceModels();
    this.smoothParams(0); // Applies clamps
    if (this.lastSample) this.sanitizeState(this.x);
    // Re-arm steady-state detection if the operating point actually changed, so
    // isSettled() never reports settled from a previous operating point (§2.4).
    // Unchanged params (the live loop re-applies the same patch every frame) do
    // not clear, so the live sim can still reach "settled".
    const sig = JSON.stringify({ ...this.p, speed: 0 });
    if (sig !== this.opSig) {
      this.opSig = sig;
      this.clearBeatTracking();
    }
  }

  initializeVenousPressuresForTargetTBV(targetTBV: number) {
    if (Number.isFinite(targetTBV) && targetTBV > 0) {
      this.expectedTBV = targetTBV;
      this.correctVenousPressuresToExpectedTBV({
        gain: 1,
        maxTotalCorrectionMl: Infinity,
        maxNodeVolumeMl: Infinity,
      });
      for (let i = 0; i < 16; i++) {
        const err = targetTBV - this.totalBloodVolume(this.computePressures(this.x));
        if (Math.abs(err) < 1e-6) break;
        this.correctVenousPressuresToExpectedTBV({
          gain: 1,
          maxTotalCorrectionMl: Infinity,
          maxNodeVolumeMl: Infinity,
        });
      }
    }
    this.clearBeatTracking(); // volume change re-arms steady-state detection
    this.lastSample = this.sample();
    this.initialTBV = this.lastSample.TBV;
    this.expectedTBV = this.initialTBV;
    this.tbvCorrectionMagThisBeat = 0;
    this.tbvCorrectionMagLastBeat = 0;
    this.tbvCorrectionLastStepMl = 0;
  }

  retargetTBVFromCurrentState(
    targetTBV: number,
    options: RetargetTBVOptions = {},
  ): RetargetTBVStatus {
    const target = Number.isFinite(targetTBV) ? targetTBV : NaN;
    const beforeTBV = this.totalBloodVolume(this.computePressures(this.x));
    const toleranceMl = options.toleranceMl ?? 1e-3;
    const maxIterations = Math.max(1, Math.floor(options.maxIterations ?? 16));
    if (!Number.isFinite(target) || target <= 0) {
      return {
        ok: false,
        targetTBVMl: targetTBV,
        beforeTBVMl: beforeTBV,
        afterTBVMl: beforeTBV,
        errorMl: Number.NaN,
        iterations: 0,
        reason: "invalid-target",
      };
    }
    if (!Number.isFinite(beforeTBV)) {
      return {
        ok: false,
        targetTBVMl: target,
        beforeTBVMl: beforeTBV,
        afterTBVMl: beforeTBV,
        errorMl: Number.NaN,
        iterations: 0,
        reason: "non-finite-tbv",
      };
    }

    this.expectedTBV = target;
    let afterTBV = beforeTBV;
    let errorMl = target - afterTBV;
    let iterations = 0;
    for (; iterations < maxIterations; iterations++) {
      if (Math.abs(errorMl) <= toleranceMl) break;
      this.correctVenousPressuresToExpectedTBV({
        gain: 1,
        maxTotalCorrectionMl: Infinity,
        maxNodeVolumeMl: Infinity,
      });
      afterTBV = this.totalBloodVolume(this.computePressures(this.x));
      errorMl = target - afterTBV;
      if (!Number.isFinite(afterTBV) || !Number.isFinite(errorMl)) {
        return {
          ok: false,
          targetTBVMl: target,
          beforeTBVMl: beforeTBV,
          afterTBVMl: afterTBV,
          errorMl,
          iterations: iterations + 1,
          reason: "non-finite-tbv",
        };
      }
    }

    this.clearBeatTracking(); // volume retarget re-arms steady-state detection
    this.lastSample = this.sample();
    this.initialTBV = this.lastSample.TBV;
    this.expectedTBV = this.initialTBV;
    this.tbvCorrectionMagThisBeat = 0;
    this.tbvCorrectionMagLastBeat = 0;
    this.tbvCorrectionLastStepMl = 0;

    const ok = Math.abs(errorMl) <= toleranceMl;
    return {
      ok,
      targetTBVMl: target,
      beforeTBVMl: beforeTBV,
      afterTBVMl: afterTBV,
      errorMl,
      iterations,
      reason: ok ? undefined : "residual",
    };
  }

  step(dt: number) {
    const temporalSubdivisions = this.experimentalTemporalSubstep?.subdivisions ?? 1;
    if (temporalSubdivisions > 1) {
      const subDt = dt / temporalSubdivisions;
      for (let i = 0; i < temporalSubdivisions; i++) this.stepSingle(subDt);
      return;
    }
    this.stepSingle(dt);
  }

  private stepSingle(dt: number) {
    this.rhsDt = Math.max(dt, 1e-6);
    this.sanitizeLastStepAudit = emptyVolumeDeltaAudit();
    this.tbvProjectionLastStepAudit = emptyTBVProjectionAudit();
    this.smoothParams(dt);
    const shouldCommitProviderState = this.hasExperimentalActiveProviderStateCommit();
    const beforeProviderCommitT = shouldCommitProviderState ? this.t : 0;
    const beforeProviderCommitX = shouldCommitProviderState ? Float64Array.from(this.x) : null;

    // Hemorrhage / fluid ledger (M5a): mL/min -> mL/s. Clamped to a safe range.
    // Only advances when projectTBV is on, since the projector is the only thing
    // that applies the ledger to the state; otherwise bleed/fluid is a no-op and
    // we must not drift expectedTBV away from the (conserved) actual TBV.
    if (this.p.projectTBV) {
      const netFlowMlPerS = (this.p.fluidRate - this.p.bleedRate) / 60;
      this.expectedTBV = clamp(this.expectedTBV + netFlowMlPerS * dt, 1000, 12000);
    }

    if (this.experimentalUnsupportedDiagnosticCoupledNewtonStep && beforeProviderCommitX) {
      this.stepUnsupportedDiagnosticCoupledNewtonProviderState(dt, beforeProviderCommitT, beforeProviderCommitX);
    } else if (this.experimentalVentricularChamberTransactionStep && beforeProviderCommitX) {
      this.stepVentricularChamberTransactionProviderState(dt, beforeProviderCommitT, beforeProviderCommitX);
    } else if (this.experimentalCoupledBackwardEulerStep && beforeProviderCommitX) {
      this.stepCoupledBackwardEulerProviderState(dt, beforeProviderCommitT, beforeProviderCommitX);
    } else if (this.experimentalGraphCoupledStep && beforeProviderCommitX) {
      this.stepGraphCoupledProviderState(dt, beforeProviderCommitT, beforeProviderCommitX);
    } else {
      const k1 = this.rhs(this.x);
      const pred = new Float64Array(this.x.length);
      for (let i = 0; i < this.x.length; i++) pred[i] = this.x[i] + dt * k1[i];
      this.sanitizeState(pred);
      const k2 = this.rhs(pred);
      for (let i = 0; i < this.x.length; i++) this.x[i] += 0.5 * dt * (k1[i] + k2[i]);
      this.t += dt;
      this.sanitizeState(this.x);
    }
    if (this.p.projectTBV && this.tbvCorrectionEnabled) this.correctVenousPressuresToExpectedTBV();
    if (beforeProviderCommitX) {
      this.commitExperimentalActiveProviderStates(dt, beforeProviderCommitT, beforeProviderCommitX);
    }
  }

  private stepCoupledBackwardEulerProviderState(
    dt: number,
    beforeProviderCommitT: number,
    beforeProviderCommitX: Float64Array,
  ): void {
    const options = this.experimentalCoupledBackwardEulerStep;
    if (!options) throw new Error("Missing coupled backward-Euler step options.");
    const baseProviderState = this.snapshotExperimentalActiveProviderStates();
    const k0 = this.rhs(beforeProviderCommitX);
    let candidate = new Float64Array(beforeProviderCommitX.length);
    for (let i = 0; i < beforeProviderCommitX.length; i++) {
      candidate[i] = beforeProviderCommitX[i] + dt * k0[i];
    }
    this.sanitizeState(candidate);

    const iterations = options.iterations ?? 4;
    const relaxation = options.relaxation ?? 0.7;
    const chamberFilter = new Set<Chamber>(options.providerStateCouplingChambers ?? ["LV", "RV"]);
    for (let iteration = 0; iteration < iterations; iteration++) {
      this.restoreExperimentalActiveProviderStates(baseProviderState);
      const provisionalProviderState = this.computeExperimentalActiveProviderStateCommits(
        dt,
        beforeProviderCommitT,
        beforeProviderCommitX,
        beforeProviderCommitT + dt,
        candidate,
        chamberFilter,
      );
      this.restoreExperimentalActiveProviderStates(provisionalProviderState);
      const kCandidate = this.rhs(candidate);
      const next = new Float64Array(beforeProviderCommitX.length);
      for (let i = 0; i < beforeProviderCommitX.length; i++) {
        const beValue = beforeProviderCommitX[i] + dt * kCandidate[i];
        next[i] = candidate[i] + relaxation * (beValue - candidate[i]);
      }
      this.sanitizeState(next);
      candidate = next;
    }

    this.restoreExperimentalActiveProviderStates(baseProviderState);
    this.x.set(candidate);
    this.t += dt;
    this.sanitizeState(this.x);
  }

  private stepVentricularChamberTransactionProviderState(
    dt: number,
    beforeProviderCommitT: number,
    beforeProviderCommitX: Float64Array,
  ): void {
    const options = this.experimentalVentricularChamberTransactionStep;
    if (!options) throw new Error("Missing ventricular chamber transaction step options.");
    const baseProviderState = this.snapshotExperimentalActiveProviderStates();
    const k0 = this.rhs(beforeProviderCommitX);
    let candidate = new Float64Array(beforeProviderCommitX.length);
    for (let i = 0; i < beforeProviderCommitX.length; i++) {
      candidate[i] = beforeProviderCommitX[i] + dt * k0[i];
    }
    this.sanitizeState(candidate);

    const chamberFilter = new Set<Chamber>(options.providerStateCouplingChambers);
    const iterations = options.iterations ?? 4;
    const relaxation = options.relaxation ?? 0.7;
    for (let iteration = 0; iteration < iterations; iteration++) {
      this.restoreExperimentalActiveProviderStates(baseProviderState);
      const provisionalProviderState = this.computeExperimentalActiveProviderStateCommits(
        dt,
        beforeProviderCommitT,
        beforeProviderCommitX,
        beforeProviderCommitT + dt,
        candidate,
        chamberFilter,
        baseProviderState,
      );
      this.restoreExperimentalActiveProviderStates(provisionalProviderState);
      const dy = this.rhs(candidate);
      const next = new Float64Array(beforeProviderCommitX.length);
      for (let i = 0; i < beforeProviderCommitX.length; i++) {
        const beValue = beforeProviderCommitX[i] + dt * dy[i];
        next[i] = candidate[i] + relaxation * (beValue - candidate[i]);
      }
      const pack = this.computePressures(candidate);
      this.applyVentricularChamberTransactionSide(
        next,
        beforeProviderCommitX,
        beforeProviderCommitT,
        candidate,
        pack,
        dt,
        "LV",
        relaxation,
        options.includeAdjacentLoadNodes === true,
        options,
        chamberFilter,
        baseProviderState,
      );
      this.applyVentricularChamberTransactionSide(
        next,
        beforeProviderCommitX,
        beforeProviderCommitT,
        candidate,
        pack,
        dt,
        "RV",
        relaxation,
        options.includeAdjacentLoadNodes === true,
        options,
        chamberFilter,
        baseProviderState,
      );
      this.sanitizeState(next);
      candidate = next;
    }

    this.restoreExperimentalActiveProviderStates(baseProviderState);
    this.x.set(candidate);
    this.t += dt;
    this.sanitizeState(this.x);
  }

  private applyVentricularChamberTransactionSide(
    next: Float64Array,
    beforeX: Float64Array,
    beforeT: number,
    candidate: Float64Array,
    pack: PressurePack,
    dt: number,
    chamber: "LV" | "RV",
    relaxation: number,
    includeAdjacentLoadNodes: boolean,
    options: ModelCoreExperimentalVentricularChamberTransactionStepOptions,
    chamberFilter: Set<Chamber>,
    baseProviderState: Partial<Record<Chamber, { state: unknown; version: number }>>,
  ): void {
    const ventNode = chamber === "LV" ? "LV" : "RV";
    const inlet = chamber === "LV" ? "MV" : "TV";
    const outlet = chamber === "LV" ? "AoV" : "PV";
    const ventIndex = this.idx.node[ventNode];
    const inletIndex = this.idx.q[inlet];
    const outletIndex = this.idx.q[outlet];
    const inletFlowState = this.transactionAvValveStateCoupledFlowState(inlet, candidate, pack, dt, options);
    let inletQNext = this.dynamicEdgeQNextForCandidate(inlet, inletFlowState ?? candidate, pack, dt, options);
    let outletQNext = this.dynamicEdgeQNextForCandidate(outlet, candidate, pack, dt, options);
    if (
      options.avValveBoundaryMode === "accepted-state-av-boundary-pair-fixedpoint"
      && (options.avValveBoundaryTargetValves ?? ["MV", "TV"]).includes(inlet)
    ) {
      const pair = this.acceptedStateAvValveBoundaryPairFlowNext(
        inlet,
        outlet,
        beforeX,
        candidate,
        pack,
        inletQNext,
        outletQNext,
        dt,
        includeAdjacentLoadNodes,
        options,
      );
      inletQNext = pair.inletQNext;
      outletQNext = pair.outletQNext;
    }
    let residualContractXi: { inletXiNext: number; outletXiNext: number } | null = null;
    if (
      options.avValveBoundaryMode === "source-state-residual-contract"
      && (options.avValveBoundaryTargetValves ?? ["MV", "TV"]).includes(inlet)
    ) {
      const residualContract = this.sourceStateResidualContractSideFlowNext(
        inlet,
        outlet,
        beforeX,
        beforeT,
        candidate,
        pack,
        inletQNext,
        outletQNext,
        dt,
        includeAdjacentLoadNodes,
        options,
        chamberFilter,
        baseProviderState,
      );
      inletQNext = residualContract.inletQNext;
      outletQNext = residualContract.outletQNext;
      residualContractXi = {
        inletXiNext: residualContract.inletXiNext,
        outletXiNext: residualContract.outletXiNext,
      };
    }
    if (
      (
        options.avValveBoundaryMode === "accepted-state-av-boundary"
        || options.avValveBoundaryMode === "accepted-state-av-boundary-fixedpoint"
        || options.avValveBoundaryMode === "accepted-state-valve-pressure-flow"
      )
      && (options.avValveBoundaryTargetValves ?? ["MV", "TV"]).includes(inlet)
    ) {
      inletQNext = this.acceptedStateAvValveBoundaryFlowNext(
        inlet,
        outlet,
        beforeX,
        candidate,
        pack,
        inletQNext,
        outletQNext,
        dt,
        includeAdjacentLoadNodes,
        inletFlowState ?? candidate,
        options,
      );
    }
    if (
      chamber === "LV"
      && (
        options.avValveBoundaryMode === "tv-state-coupled-mv-pressure-refit"
        || options.avValveBoundaryMode === "tv-state-coupled-mv-pressure-fixedpoint-refit"
      )
      && (options.avValveBoundaryTargetValves ?? ["MV", "TV"]).includes("MV")
    ) {
      inletQNext = this.refitMvFlowWithProjectedTransactionPressure(
        beforeX,
        candidate,
        pack,
        inletQNext,
        outletQNext,
        dt,
        includeAdjacentLoadNodes,
        options,
      );
    }
    if (includeAdjacentLoadNodes) {
      const balances = this.chamberTransactionBalances(candidate, pack, {
        [inlet]: inletQNext,
        [outlet]: outletQNext,
      });
      const inletEdge = this.edges[this.edgeIndex(inlet)];
      const outletEdge = this.edges[this.edgeIndex(outlet)];
      const nodeNamesToUpdate = [ventNode, inletEdge.up as NodeName, outletEdge.down as NodeName] as const;
      for (const nodeName of nodeNamesToUpdate) {
        const nodeIndex = this.idx.node[nodeName];
        const node = this.nodes[this.nodeIndex.get(nodeName)!];
        const balance = node.kind === "venousPressure"
          ? balances[this.nodeIndex.get(nodeName)!]
          : clamp(balances[this.nodeIndex.get(nodeName)!], -2500, 2500);
        const nodeNext = beforeX[nodeIndex] + dt * balance;
        next[nodeIndex] = candidate[nodeIndex] + relaxation * (nodeNext - candidate[nodeIndex]);
      }
    } else {
      const volumeNext = beforeX[ventIndex] + dt * (inletQNext - outletQNext);
      next[ventIndex] = candidate[ventIndex] + relaxation * (volumeNext - candidate[ventIndex]);
    }
    next[inletIndex] = candidate[inletIndex] + relaxation * (inletQNext - candidate[inletIndex]);
    next[outletIndex] = candidate[outletIndex] + relaxation * (outletQNext - candidate[outletIndex]);
    if (inletFlowState) {
      const inletXiIndex = this.idx.xi[inlet];
      next[inletXiIndex] = candidate[inletXiIndex] + relaxation * (inletFlowState[inletXiIndex] - candidate[inletXiIndex]);
    }
    if (residualContractXi) {
      const inletXiIndex = this.idx.xi[inlet];
      const outletXiIndex = this.idx.xi[outlet];
      next[inletXiIndex] = candidate[inletXiIndex] + relaxation * (residualContractXi.inletXiNext - candidate[inletXiIndex]);
      next[outletXiIndex] = candidate[outletXiIndex] + relaxation * (residualContractXi.outletXiNext - candidate[outletXiIndex]);
    }
  }

  private transactionAvValveStateCoupledFlowState(
    valveName: "MV" | "TV",
    candidate: Float64Array,
    pack: PressurePack,
    dt: number,
    options: ModelCoreExperimentalVentricularChamberTransactionStepOptions,
  ): Float64Array | null {
    if (
      (
        options.avValveBoundaryMode !== "state-coupled-complementarity"
        && options.avValveBoundaryMode !== "accepted-state-av-boundary"
        && options.avValveBoundaryMode !== "accepted-state-av-boundary-fixedpoint"
        && options.avValveBoundaryMode !== "accepted-state-valve-pressure-flow"
        && options.avValveBoundaryMode !== "accepted-state-av-boundary-pair-fixedpoint"
        && options.avValveBoundaryMode !== "source-state-residual-contract"
        && !(options.avValveBoundaryMode === "tv-state-coupled-mv-pressure-refit" && valveName === "TV")
        && !(options.avValveBoundaryMode === "tv-state-coupled-mv-pressure-fixedpoint-refit" && valveName === "TV")
      )
      || !(options.avValveBoundaryTargetValves ?? ["MV", "TV"]).includes(valveName)
    ) {
      return null;
    }
    const flowState = Float64Array.from(candidate);
    flowState[this.idx.xi[valveName]] = this.transactionValveOpenNext(valveName, candidate, pack, dt);
    return flowState;
  }

  private transactionValveOpenNext(
    valveName: ValveName,
    x: Float64Array,
    pack: PressurePack,
    dt: number,
  ): number {
    const e = this.edges[this.edgeIndex(valveName)];
    const xiIndex = this.idx.xi[valveName];
    const xi = clamp(x[xiIndex], 0, 1);
    const dP = pack.P[this.nodeIndex.get(e.up)!] - pack.P[this.nodeIndex.get(e.down)!];
    const kOpen = (this.p as any)[`${valveName}_kOpen`] ?? e.kOpen ?? 2.0;
    const tauOpen = (this.p as any)[`${valveName}_tauOpen`] ?? e.tauOpen ?? 0.012;
    const tauClose = (this.p as any)[`${valveName}_tauClose`] ?? e.tauClose ?? 0.025;
    const deadband = valveName === "MV" ? MV_PRESSURE_DEADBAND_MMHG : 0;
    const xiEq = dP > deadband
      ? sigmoid(kOpen * (dP - deadband - (e.dP0 ?? 0)))
      : dP < -deadband
        ? 0
        : xi;
    const q = x[this.idx.q[valveName]];
    const forwardCoast = valveName === "AoV" && dP <= 0 && dP > -3 && q > 1 && this.valveLeakArea(valveName, e) <= 1e-9;
    const tau = valveName === "MV"
      ? xiEq > xi ? tauOpen : tauClose
      : dP > 0 ? tauOpen : forwardCoast ? Math.max(tauClose, 0.012) : tauClose;
    const alpha = 1 - Math.exp(-Math.max(dt, 1e-6) / Math.max(tau, 1e-5));
    return clamp(xi + alpha * (xiEq - xi), 0, 1);
  }

  private refitMvFlowWithProjectedTransactionPressure(
    beforeX: Float64Array,
    candidate: Float64Array,
    pack: PressurePack,
    inletQNext: number,
    outletQNext: number,
    dt: number,
    includeAdjacentLoadNodes: boolean,
    options: ModelCoreExperimentalVentricularChamberTransactionStepOptions,
  ): number {
    const iterations = options.avValveBoundaryMode === "tv-state-coupled-mv-pressure-fixedpoint-refit"
      ? Math.max(1, Math.floor(options.avValveBoundaryPressureRefitIterations ?? 3))
      : 1;
    const relaxation = clamp(options.avValveBoundaryPressureRefitRelaxation ?? 1, 0.05, 1);
    const baseMvQ = beforeX[this.idx.q.MV];
    let qCandidate = inletQNext;
    for (let iteration = 0; iteration < iterations; iteration++) {
      const projected = Float64Array.from(candidate);
      if (includeAdjacentLoadNodes) {
        const balances = this.chamberTransactionBalances(candidate, pack, {
          MV: qCandidate,
          AoV: outletQNext,
        });
        for (const nodeName of ["LV", "LA", "Ao"] as const) {
          const nodeIndex = this.idx.node[nodeName];
          const node = this.nodes[this.nodeIndex.get(nodeName)!];
          const balance = node.kind === "venousPressure"
            ? balances[this.nodeIndex.get(nodeName)!]
            : clamp(balances[this.nodeIndex.get(nodeName)!], -2500, 2500);
          projected[nodeIndex] = beforeX[nodeIndex] + dt * balance;
        }
      } else {
        projected[this.idx.node.LV] = beforeX[this.idx.node.LV] + dt * (qCandidate - outletQNext);
      }
      projected[this.idx.q.MV] = baseMvQ;
      projected[this.idx.q.AoV] = outletQNext;
      this.sanitizeState(projected);
      const projectedPack = this.computePressures(projected);
      const qRefit = this.dynamicEdgeQNextForCandidate("MV", projected, projectedPack, dt, options);
      qCandidate += relaxation * (qRefit - qCandidate);
    }
    return qCandidate;
  }

  private chamberTransactionBalances(
    x: Float64Array,
    pack: PressurePack,
    overrides: Partial<Record<DynamicEdgeName, number>>,
  ): Float64Array {
    const flows = this.computeFlows(x, pack);
    const balance = new Float64Array(nodeNames.length);
    for (let ei = 0; ei < this.edges.length; ei++) {
      const e = this.edges[ei];
      const override = (e.kind === "dynamic" || e.kind === "valve")
        ? overrides[e.name as DynamicEdgeName]
        : undefined;
      const q = override ?? flows[ei];
      balance[this.nodeIndex.get(e.up)!] -= q;
      balance[this.nodeIndex.get(e.down)!] += q;
    }
    return balance;
  }

  private dynamicEdgeQNextForCandidate(
    edgeName: DynamicEdgeName,
    x: Float64Array,
    pack: PressurePack,
    dt: number,
    transactionOptions?: ModelCoreExperimentalVentricularChamberTransactionStepOptions,
  ): number {
    const e = this.edges[this.edgeIndex(edgeName)];
    const qi = this.idx.q[edgeName];
    const up = this.nodeIndex.get(e.up)!;
    const down = this.nodeIndex.get(e.down)!;
    const Pu = pack.P[up];
    const Pd = pack.P[down];
    const PdEff = this.downstreamEffective(e, Pd);
    const q = x[qi];
    const { R, B, areaRatio } = this.effectiveLosses(e, Pu, Pd, x);
    let L = e.kind === "valve" ? Math.max((this.p as any)[`${e.name}_L`] ?? e.L ?? 0.001, 1e-6) : Math.max(e.L ?? 0.001, 1e-6);
    if (e.name === "AoV") L = this.effectiveAorticBoundaryRootInertance(L);
    if (e.kind !== "valve" && e.useChiResistance) {
      L = L / Math.max(areaRatio, 1e-6);
    }
    const h = Math.max(dt, 1e-6);
    const valveName = e.kind === "valve" ? e.name as ValveName : null;
    let qNext = e.name === "AoV"
      ? this.aorticValveQNext(q, Pu - PdEff, R, B, L, h)
      : this.currentLossQNext(q, Pu - PdEff, R, B, L, h);
    if (valveName && this.valveLeakArea(valveName, e) <= 1e-9 && qNext < 0) {
      qNext = this.applyTransactionAvValveBoundaryConstraint(
        edgeName,
        valveName,
        q,
        qNext,
        clamp(x[this.idx.xi[valveName]], 0, 1),
        h,
        transactionOptions,
      );
    }
    if (e.name === "AoV") qNext = this.applyAorticFlowClamp(qNext);
    const qDotRaw = (qNext - q) / h;
    const useCustomQDotClamp = this.usesCustomDynamicQDotClamp(e);
    const qDotPositiveLimit = useCustomQDotClamp
      ? Math.max(this.aorticFlowDerivativeClampPositiveMlPerS2, 1)
      : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
    const qDotNegativeLimit = useCustomQDotClamp
      ? Math.max(this.aorticFlowDerivativeClampNegativeMlPerS2, 1)
      : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
    const qDotPost = clamp(qDotRaw, -qDotNegativeLimit, qDotPositiveLimit);
    return q + h * qDotPost;
  }

  private applyTransactionAvValveBoundaryConstraint(
    edgeName: DynamicEdgeName,
    valveName: ValveName,
    qCurrent: number,
    qNextPreBoundary: number,
    openness01: number,
    dt: number,
    options: ModelCoreExperimentalVentricularChamberTransactionStepOptions | undefined,
  ): number {
    if (
      (edgeName === "MV" || edgeName === "TV")
      && options?.avValveBoundaryMode === "bounded-deceleration"
      && (options.avValveBoundaryTargetValves ?? ["MV", "TV"]).includes(edgeName)
    ) {
      const tau = Math.max(options.avValveBoundaryTauSec ?? 0.025, dt);
      const opennessScale = 0.25 + 0.75 * smoothstep01(openness01);
      const decay = Math.exp(-dt / Math.max(tau * opennessScale, 1e-6));
      return Math.max(0, Math.max(qNextPreBoundary, qCurrent * decay));
    }
    return this.applyValveDiodeConstraint(valveName, qNextPreBoundary, openness01);
  }

  private acceptedStateAvValveBoundaryFlowNext(
    inlet: "MV" | "TV",
    outlet: "AoV" | "PV",
    beforeX: Float64Array,
    candidate: Float64Array,
    pack: PressurePack,
    inletQGuess: number,
    outletQNext: number,
    dt: number,
    includeAdjacentLoadNodes: boolean,
    valveStateX: Float64Array,
    options: ModelCoreExperimentalVentricularChamberTransactionStepOptions,
  ): number {
    const ventNode = inlet === "MV" ? "LV" : "RV";
    const inletEdge = this.edges[this.edgeIndex(inlet)];
    const outletEdge = this.edges[this.edgeIndex(outlet)];
    const ventIndex = this.idx.node[ventNode];
    const h = Math.max(dt, 1e-6);
    const qBase = beforeX[this.idx.q[inlet]];
    const iterations = (
      options.avValveBoundaryMode === "accepted-state-av-boundary-fixedpoint"
      || options.avValveBoundaryMode === "accepted-state-valve-pressure-flow"
    )
      ? Math.max(1, Math.floor(options.avValveBoundaryPressureRefitIterations ?? 3))
      : 1;
    const relaxation = (
      options.avValveBoundaryMode === "accepted-state-av-boundary-fixedpoint"
      || options.avValveBoundaryMode === "accepted-state-valve-pressure-flow"
    )
      ? clamp(options.avValveBoundaryPressureRefitRelaxation ?? 1, 0.05, 1)
      : 1;
    const useProjectedValveState = options.avValveBoundaryMode === "accepted-state-valve-pressure-flow";
    let qCandidate = inletQGuess;
    let acceptedDiagnostics = this.valveFlowStepDiagnostics[inlet];
    for (let iteration = 0; iteration < iterations; iteration++) {
      const projected = Float64Array.from(candidate);
      if (includeAdjacentLoadNodes) {
        const balances = this.chamberTransactionBalances(candidate, pack, {
          [inlet]: qCandidate,
          [outlet]: outletQNext,
        });
        const nodeNamesToUpdate = [ventNode, inletEdge.up as NodeName, outletEdge.down as NodeName] as const;
        for (const nodeName of nodeNamesToUpdate) {
          const nodeIndex = this.idx.node[nodeName];
          const node = this.nodes[this.nodeIndex.get(nodeName)!];
          const balance = node.kind === "venousPressure"
            ? balances[this.nodeIndex.get(nodeName)!]
            : clamp(balances[this.nodeIndex.get(nodeName)!], -2500, 2500);
          projected[nodeIndex] = beforeX[nodeIndex] + dt * balance;
        }
      } else {
        projected[ventIndex] = beforeX[ventIndex] + dt * (qCandidate - outletQNext);
      }
      projected[this.idx.q[inlet]] = qCandidate;
      projected[this.idx.q[outlet]] = outletQNext;
      projected[this.idx.xi[inlet]] = valveStateX[this.idx.xi[inlet]];
      this.sanitizeState(projected);

      let projectedPack = this.computePressures(projected);
      let acceptedValveState01 = clamp(projected[this.idx.xi[inlet]], 0, 1);
      if (useProjectedValveState) {
        acceptedValveState01 = this.transactionValveOpenNext(inlet, projected, projectedPack, dt);
        projected[this.idx.xi[inlet]] = acceptedValveState01;
        projectedPack = this.computePressures(projected);
      }
      const up = this.nodeIndex.get(inletEdge.up)!;
      const down = this.nodeIndex.get(inletEdge.down)!;
      const Pu = projectedPack.P[up];
      const PdEff = this.downstreamEffective(inletEdge, projectedPack.P[down]);
      const { R, B, areaRatio } = this.effectiveLosses(inletEdge, Pu, projectedPack.P[down], projected);
      const L = Math.max((this.p as any)[`${inlet}_L`] ?? inletEdge.L ?? 0.001, 1e-6);
      const pressureGradientMmHg = Pu - PdEff;
      const qNextPreDiode = this.qNextConsistentLossQNext(qBase, pressureGradientMmHg, R, B, L, h);
      let qNextPostDiode = qNextPreDiode;
      if (this.valveLeakArea(inlet, inletEdge) <= 1e-9 && qNextPostDiode < 0) qNextPostDiode = 0;
      const qDotRaw = (qNextPostDiode - qBase) / h;
      const useCustomQDotClamp = this.usesCustomDynamicQDotClamp(inletEdge);
      const qDotPositiveLimit = useCustomQDotClamp
        ? Math.max(this.aorticFlowDerivativeClampPositiveMlPerS2, 1)
        : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
      const qDotNegativeLimit = useCustomQDotClamp
        ? Math.max(this.aorticFlowDerivativeClampNegativeMlPerS2, 1)
        : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
      const qDotPost = clamp(qDotRaw, -qDotNegativeLimit, qDotPositiveLimit);
      const qRefitRaw = qBase + h * qDotPost;
      const adverseForwardScale = pressureGradientMmHg <= 0 && qRefitRaw > 0
        ? clamp(options.avValveBoundaryAdverseGradientForwardScale ?? 1, 0, 1)
        : 1;
      const qRefit = qRefitRaw * adverseForwardScale;
      const qAccepted = qCandidate + relaxation * (qRefit - qCandidate);
      acceptedDiagnostics = {
        ...this.valveFlowStepDiagnostics[inlet],
        acceptedBoundaryApplied01: 1,
        acceptedBoundaryQNext: qAccepted,
        acceptedBoundaryPressureGradientMmHg: pressureGradientMmHg,
        acceptedBoundaryQDotRaw: qDotRaw,
        acceptedBoundaryQDotPost: (qAccepted - qBase) / h,
        acceptedBoundaryQDotClampHit01: Math.abs(qDotPost - qDotRaw) > 1e-9 ? 1 : 0,
        acceptedBoundaryQDotClampImpulse: qDotPost - qDotRaw,
        acceptedBoundaryDiodeImpulse: qNextPostDiode - qNextPreDiode,
        acceptedBoundaryComplementarityResidualMlPerSec:
          pressureGradientMmHg <= 0 ? Math.max(qAccepted, 0) : Math.max(-qAccepted, 0),
        acceptedBoundaryIterationCount: iteration + 1,
        acceptedBoundaryValveState01: acceptedValveState01,
        acceptedBoundaryAreaRatio: areaRatio,
      };
      qCandidate = qAccepted;
    }
    this.valveFlowStepDiagnostics[inlet] = acceptedDiagnostics;
    return qCandidate;
  }

  private acceptedStateAvValveBoundaryPairFlowNext(
    inlet: "MV" | "TV",
    outlet: "AoV" | "PV",
    beforeX: Float64Array,
    candidate: Float64Array,
    pack: PressurePack,
    inletQGuess: number,
    outletQGuess: number,
    dt: number,
    includeAdjacentLoadNodes: boolean,
    options: ModelCoreExperimentalVentricularChamberTransactionStepOptions,
  ): { inletQNext: number; outletQNext: number } {
    const ventNode = inlet === "MV" ? "LV" : "RV";
    const inletEdge = this.edges[this.edgeIndex(inlet)];
    const outletEdge = this.edges[this.edgeIndex(outlet)];
    const ventIndex = this.idx.node[ventNode];
    const h = Math.max(dt, 1e-6);
    const qBaseInlet = beforeX[this.idx.q[inlet]];
    const qBaseOutlet = beforeX[this.idx.q[outlet]];
    const iterations = Math.max(1, Math.floor(options.avValveBoundaryPressureRefitIterations ?? 3));
    const relaxation = clamp(options.avValveBoundaryPressureRefitRelaxation ?? 1, 0.05, 1);
    let inletQ = inletQGuess;
    let outletQ = outletQGuess;
    let acceptedDiagnostics = this.valveFlowStepDiagnostics[inlet];
    for (let iteration = 0; iteration < iterations; iteration++) {
      const projected = Float64Array.from(candidate);
      if (includeAdjacentLoadNodes) {
        const balances = this.chamberTransactionBalances(candidate, pack, {
          [inlet]: inletQ,
          [outlet]: outletQ,
        });
        const nodeNamesToUpdate = [ventNode, inletEdge.up as NodeName, outletEdge.down as NodeName] as const;
        for (const nodeName of nodeNamesToUpdate) {
          const nodeIndex = this.idx.node[nodeName];
          const node = this.nodes[this.nodeIndex.get(nodeName)!];
          const balance = node.kind === "venousPressure"
            ? balances[this.nodeIndex.get(nodeName)!]
            : clamp(balances[this.nodeIndex.get(nodeName)!], -2500, 2500);
          projected[nodeIndex] = beforeX[nodeIndex] + dt * balance;
        }
      } else {
        projected[ventIndex] = beforeX[ventIndex] + dt * (inletQ - outletQ);
      }
      projected[this.idx.q[inlet]] = inletQ;
      projected[this.idx.q[outlet]] = outletQ;
      this.sanitizeState(projected);
      let projectedPack = this.computePressures(projected);
      projected[this.idx.xi[inlet]] = this.transactionValveOpenNext(inlet, projected, projectedPack, dt);
      projected[this.idx.xi[outlet]] = this.transactionValveOpenNext(outlet, projected, projectedPack, dt);
      projectedPack = this.computePressures(projected);

      const inletAccepted = this.dynamicEdgeQNextForAcceptedBoundaryProjection(inlet, qBaseInlet, projected, projectedPack, dt);
      const outletAccepted = this.dynamicEdgeQNextForAcceptedBoundaryProjection(outlet, qBaseOutlet, projected, projectedPack, dt);
      const nextInletQ = inletQ + relaxation * (inletAccepted.qNext - inletQ);
      const nextOutletQ = outletQ + relaxation * (outletAccepted.qNext - outletQ);
      acceptedDiagnostics = {
        ...this.valveFlowStepDiagnostics[inlet],
        acceptedBoundaryApplied01: 1,
        acceptedBoundaryQNext: nextInletQ,
        acceptedBoundaryPressureGradientMmHg: inletAccepted.pressureGradientMmHg,
        acceptedBoundaryQDotRaw: inletAccepted.qDotRaw,
        acceptedBoundaryQDotPost: (nextInletQ - qBaseInlet) / h,
        acceptedBoundaryQDotClampHit01: inletAccepted.qDotClampHit01,
        acceptedBoundaryQDotClampImpulse: inletAccepted.qDotClampImpulse,
        acceptedBoundaryDiodeImpulse: inletAccepted.diodeImpulse,
        acceptedBoundaryComplementarityResidualMlPerSec:
          inletAccepted.pressureGradientMmHg <= 0 ? Math.max(nextInletQ, 0) : Math.max(-nextInletQ, 0),
        acceptedBoundaryIterationCount: iteration + 1,
        acceptedBoundaryValveState01: inletAccepted.valveState01,
        acceptedBoundaryAreaRatio: inletAccepted.areaRatio,
      };
      inletQ = nextInletQ;
      outletQ = nextOutletQ;
    }
    this.valveFlowStepDiagnostics[inlet] = acceptedDiagnostics;
    return { inletQNext: inletQ, outletQNext: outletQ };
  }

  private sourceStateResidualContractSideFlowNext(
    inlet: "MV" | "TV",
    outlet: "AoV" | "PV",
    beforeX: Float64Array,
    beforeT: number,
    candidate: Float64Array,
    pack: PressurePack,
    inletQGuess: number,
    outletQGuess: number,
    dt: number,
    includeAdjacentLoadNodes: boolean,
    options: ModelCoreExperimentalVentricularChamberTransactionStepOptions,
    chamberFilter: Set<Chamber>,
    baseProviderState: Partial<Record<Chamber, { state: unknown; version: number }>>,
  ): { inletQNext: number; outletQNext: number; inletXiNext: number; outletXiNext: number } {
    const h = Math.max(dt, 1e-6);
    const qBaseInlet = beforeX[this.idx.q[inlet]];
    const iterations = Math.max(1, Math.floor(options.avValveBoundaryPressureRefitIterations ?? 3));
    const relaxation = clamp(options.avValveBoundaryPressureRefitRelaxation ?? 0.7, 0.05, 1);
    let inletQ = inletQGuess;
    let outletQ = outletQGuess;
    let evaluation = this.sourceStateResidualContractSideEvaluation(
      inlet,
      outlet,
      beforeX,
      beforeT,
      candidate,
      pack,
      inletQ,
      outletQ,
      dt,
      includeAdjacentLoadNodes,
      chamberFilter,
      baseProviderState,
    );
    let completedIterations = 0;
    for (let iteration = 0; iteration < iterations; iteration++) {
      completedIterations = iteration + 1;
      evaluation = this.sourceStateResidualContractSideEvaluation(
        inlet,
        outlet,
        beforeX,
        beforeT,
        candidate,
        pack,
        inletQ,
        outletQ,
        dt,
        includeAdjacentLoadNodes,
        chamberFilter,
        baseProviderState,
      );
      if (Math.max(Math.abs(evaluation.inletResidual), Math.abs(evaluation.outletResidual)) < 1e-3) break;
      inletQ += relaxation * (evaluation.inletAccepted.qNext - inletQ);
      outletQ += relaxation * (evaluation.outletAccepted.qNext - outletQ);
    }
    evaluation = this.sourceStateResidualContractSideEvaluation(
      inlet,
      outlet,
      beforeX,
      beforeT,
      candidate,
      pack,
      inletQ,
      outletQ,
      dt,
      includeAdjacentLoadNodes,
      chamberFilter,
      baseProviderState,
    );
    this.valveFlowStepDiagnostics[inlet] = {
      ...this.valveFlowStepDiagnostics[inlet],
      acceptedBoundaryApplied01: 1,
      acceptedBoundaryQNext: inletQ,
      acceptedBoundaryPressureGradientMmHg: evaluation.inletAccepted.pressureGradientMmHg,
      acceptedBoundaryQDotRaw: evaluation.inletAccepted.qDotRaw,
      acceptedBoundaryQDotPost: (inletQ - qBaseInlet) / h,
      acceptedBoundaryQDotClampHit01: evaluation.inletAccepted.qDotClampHit01,
      acceptedBoundaryQDotClampImpulse: evaluation.inletAccepted.qDotClampImpulse,
      acceptedBoundaryDiodeImpulse: evaluation.inletAccepted.diodeImpulse,
      acceptedBoundaryComplementarityResidualMlPerSec:
        evaluation.inletAccepted.pressureGradientMmHg <= 0 ? Math.max(inletQ, 0) : Math.max(-inletQ, 0),
      acceptedBoundaryIterationCount: completedIterations,
      acceptedBoundaryValveState01: evaluation.inletAccepted.valveState01,
      acceptedBoundaryAreaRatio: evaluation.inletAccepted.areaRatio,
    };
    return {
      inletQNext: inletQ,
      outletQNext: outletQ,
      inletXiNext: evaluation.inletXiNext,
      outletXiNext: evaluation.outletXiNext,
    };
  }

  private sourceStateResidualContractSideEvaluation(
    inlet: "MV" | "TV",
    outlet: "AoV" | "PV",
    beforeX: Float64Array,
    beforeT: number,
    candidate: Float64Array,
    pack: PressurePack,
    inletQ: number,
    outletQ: number,
    dt: number,
    includeAdjacentLoadNodes: boolean,
    chamberFilter: Set<Chamber>,
    baseProviderState: Partial<Record<Chamber, { state: unknown; version: number }>>,
  ): {
    inletResidual: number;
    outletResidual: number;
    inletXiNext: number;
    outletXiNext: number;
    inletAccepted: ReturnType<ModelCore["dynamicEdgeQNextForAcceptedBoundaryProjection"]>;
    outletAccepted: ReturnType<ModelCore["dynamicEdgeQNextForAcceptedBoundaryProjection"]>;
  } {
    const ventNode = inlet === "MV" ? "LV" : "RV";
    const inletEdge = this.edges[this.edgeIndex(inlet)];
    const outletEdge = this.edges[this.edgeIndex(outlet)];
    const ventIndex = this.idx.node[ventNode];
    const projected = Float64Array.from(candidate);
    if (includeAdjacentLoadNodes) {
      const balances = this.chamberTransactionBalances(candidate, pack, {
        [inlet]: inletQ,
        [outlet]: outletQ,
      });
      const nodeNamesToUpdate = [ventNode, inletEdge.up as NodeName, outletEdge.down as NodeName] as const;
      for (const nodeName of nodeNamesToUpdate) {
        const nodeIndex = this.idx.node[nodeName];
        const node = this.nodes[this.nodeIndex.get(nodeName)!];
        const balance = node.kind === "venousPressure"
          ? balances[this.nodeIndex.get(nodeName)!]
          : clamp(balances[this.nodeIndex.get(nodeName)!], -2500, 2500);
        projected[nodeIndex] = beforeX[nodeIndex] + dt * balance;
      }
    } else {
      projected[ventIndex] = beforeX[ventIndex] + dt * (inletQ - outletQ);
    }
    projected[this.idx.q[inlet]] = inletQ;
    projected[this.idx.q[outlet]] = outletQ;
    this.sanitizeState(projected);

    this.restoreExperimentalActiveProviderStates(baseProviderState);
    const provisionalProviderState = this.computeExperimentalActiveProviderStateCommits(
      dt,
      beforeT,
      beforeX,
      beforeT + dt,
      projected,
      chamberFilter,
      baseProviderState,
    );
    this.restoreExperimentalActiveProviderStates(provisionalProviderState);
    let projectedPack = this.computePressures(projected);
    const inletXiNext = this.transactionValveOpenNext(inlet, projected, projectedPack, dt);
    const outletXiNext = this.transactionValveOpenNext(outlet, projected, projectedPack, dt);
    projected[this.idx.xi[inlet]] = inletXiNext;
    projected[this.idx.xi[outlet]] = outletXiNext;
    projectedPack = this.computePressures(projected);
    const inletAccepted = this.dynamicEdgeQNextForAcceptedBoundaryProjection(
      inlet,
      beforeX[this.idx.q[inlet]],
      projected,
      projectedPack,
      dt,
    );
    const outletAccepted = this.dynamicEdgeQNextForAcceptedBoundaryProjection(
      outlet,
      beforeX[this.idx.q[outlet]],
      projected,
      projectedPack,
      dt,
    );
    this.restoreExperimentalActiveProviderStates(baseProviderState);
    return {
      inletResidual: inletQ - inletAccepted.qNext,
      outletResidual: outletQ - outletAccepted.qNext,
      inletXiNext,
      outletXiNext,
      inletAccepted,
      outletAccepted,
    };
  }

  private dynamicEdgeQNextForAcceptedBoundaryProjection(
    edgeName: DynamicEdgeName,
    qBase: number,
    x: Float64Array,
    pack: PressurePack,
    dt: number,
  ): {
    qNext: number;
    pressureGradientMmHg: number;
    qDotRaw: number;
    qDotPost: number;
    qDotClampHit01: number;
    qDotClampImpulse: number;
    diodeImpulse: number;
    valveState01: number;
    areaRatio: number;
  } {
    const edge = this.edges[this.edgeIndex(edgeName)];
    const up = this.nodeIndex.get(edge.up)!;
    const down = this.nodeIndex.get(edge.down)!;
    const Pu = pack.P[up];
    const Pd = pack.P[down];
    const PdEff = this.downstreamEffective(edge, Pd);
    const { R, B, areaRatio } = this.effectiveLosses(edge, Pu, Pd, x);
    let L = edge.kind === "valve"
      ? Math.max((this.p as any)[`${edge.name}_L`] ?? edge.L ?? 0.001, 1e-6)
      : Math.max(edge.L ?? 0.001, 1e-6);
    if (edge.name === "AoV") L = this.effectiveAorticBoundaryRootInertance(L);
    if (edge.kind !== "valve" && edge.useChiResistance) {
      L = L / Math.max(areaRatio, 1e-6);
    }
    const h = Math.max(dt, 1e-6);
    const pressureGradientMmHg = Pu - PdEff;
    const qNextPreDiode = edge.name === "AoV"
      ? this.aorticValveQNext(qBase, pressureGradientMmHg, R, B, L, h)
      : this.currentLossQNext(qBase, pressureGradientMmHg, R, B, L, h);
    let qNextPostDiode = qNextPreDiode;
    const valveName = edge.kind === "valve" ? edge.name as ValveName : null;
    const valveState01 = valveName ? clamp(x[this.idx.xi[valveName]], 0, 1) : 1;
    if (valveName && this.valveLeakArea(valveName, edge) <= 1e-9 && qNextPostDiode < 0) {
      qNextPostDiode = this.applyValveDiodeConstraint(
        valveName,
        qNextPostDiode,
        clamp(x[this.idx.xi[valveName]], 0, 1),
      );
    }
    let qNextPostFlowClamp = qNextPostDiode;
    if (edge.name === "AoV") qNextPostFlowClamp = this.applyAorticFlowClamp(qNextPostFlowClamp);
    const qDotRaw = (qNextPostFlowClamp - qBase) / h;
    const useCustomQDotClamp = this.usesCustomDynamicQDotClamp(edge);
    const qDotPositiveLimit = useCustomQDotClamp
      ? Math.max(this.aorticFlowDerivativeClampPositiveMlPerS2, 1)
      : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
    const qDotNegativeLimit = useCustomQDotClamp
      ? Math.max(this.aorticFlowDerivativeClampNegativeMlPerS2, 1)
      : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
    const qDotPost = clamp(qDotRaw, -qDotNegativeLimit, qDotPositiveLimit);
    return {
      qNext: qBase + h * qDotPost,
      pressureGradientMmHg,
      qDotRaw,
      qDotPost,
      qDotClampHit01: Math.abs(qDotPost - qDotRaw) > 1e-9 ? 1 : 0,
      qDotClampImpulse: qDotPost - qDotRaw,
      diodeImpulse: qNextPostDiode - qNextPreDiode,
      valveState01,
      areaRatio,
    };
  }

  private stepUnsupportedDiagnosticCoupledNewtonProviderState(
    dt: number,
    beforeProviderCommitT: number,
    beforeProviderCommitX: Float64Array,
  ): void {
    const options = this.experimentalUnsupportedDiagnosticCoupledNewtonStep;
    if (!options) throw new Error("Missing coupled Newton step options.");
    const baseProviderState = this.snapshotExperimentalActiveProviderStates();
    const k0 = this.rhs(beforeProviderCommitX);
    let candidate = new Float64Array(beforeProviderCommitX.length);
    for (let i = 0; i < beforeProviderCommitX.length; i++) {
      candidate[i] = beforeProviderCommitX[i] + dt * k0[i];
    }
    this.sanitizeState(candidate);

    const unknownIndices = this.unsupportedDiagnosticCoupledNewtonUnknownIndices(options);
    const chamberFilter = new Set<Chamber>(options.providerStateCouplingChambers ?? ["LV", "RV"]);
    const iterations = options.iterations ?? 4;
    const relaxation = options.relaxation ?? 0.8;
    for (let iteration = 0; iteration < iterations; iteration++) {
      const residual = this.unsupportedDiagnosticCoupledNewtonResidual(
        candidate,
        beforeProviderCommitT,
        beforeProviderCommitX,
        dt,
        chamberFilter,
        baseProviderState,
        unknownIndices,
      );
      const residualNorm = maxAbs(residual);
      if (residualNorm < 1e-3) break;
      const jacobian = this.unsupportedDiagnosticCoupledNewtonJacobian(
        candidate,
        beforeProviderCommitT,
        beforeProviderCommitX,
        dt,
        chamberFilter,
        baseProviderState,
        unknownIndices,
        residual,
      );
      const delta = solveLinearSystem(jacobian, residual.map((value) => -value));
      if (!delta) break;
      const next = new Float64Array(candidate);
      for (let i = 0; i < unknownIndices.length; i++) {
        next[unknownIndices[i]] += relaxation * clamp(delta[i], -20, 20);
      }
      this.sanitizeState(next);
      candidate = next;
    }

    this.restoreExperimentalActiveProviderStates(baseProviderState);
    this.x.set(candidate);
    this.t += dt;
    this.sanitizeState(this.x);
  }

  private unsupportedDiagnosticCoupledNewtonUnknownIndices(
    options: ModelCoreExperimentalUnsupportedDiagnosticCoupledNewtonStepOptions,
  ): readonly number[] {
    const indices = [
      this.idx.node.LV,
      this.idx.node.RV,
      ...(options.includeAtrialVolumes === false ? [] : [this.idx.node.LA, this.idx.node.RA]),
      this.idx.q.MV,
      this.idx.q.AoV,
      this.idx.q.TV,
      this.idx.q.PV,
      ...(options.includeValveOpenStates === false
        ? []
        : [this.idx.xi.MV, this.idx.xi.AoV, this.idx.xi.TV, this.idx.xi.PV]),
    ];
    return [...new Set(indices)];
  }

  private unsupportedDiagnosticCoupledNewtonResidual(
    candidate: Float64Array,
    beforeProviderCommitT: number,
    beforeProviderCommitX: Float64Array,
    dt: number,
    chamberFilter: Set<Chamber>,
    baseProviderState: Partial<Record<Chamber, { state: unknown; version: number }>>,
    unknownIndices: readonly number[],
  ): number[] {
    this.restoreExperimentalActiveProviderStates(baseProviderState);
    const provisionalProviderState = this.computeExperimentalActiveProviderStateCommits(
      dt,
      beforeProviderCommitT,
      beforeProviderCommitX,
      beforeProviderCommitT + dt,
      candidate,
      chamberFilter,
      baseProviderState,
    );
    this.restoreExperimentalActiveProviderStates(provisionalProviderState);
    const dy = this.rhs(candidate);
    this.restoreExperimentalActiveProviderStates(baseProviderState);
    return unknownIndices.map((index) => candidate[index] - beforeProviderCommitX[index] - dt * dy[index]);
  }

  private unsupportedDiagnosticCoupledNewtonJacobian(
    candidate: Float64Array,
    beforeProviderCommitT: number,
    beforeProviderCommitX: Float64Array,
    dt: number,
    chamberFilter: Set<Chamber>,
    baseProviderState: Partial<Record<Chamber, { state: unknown; version: number }>>,
    unknownIndices: readonly number[],
    baseResidual: readonly number[],
  ): number[][] {
    return unknownIndices.map((index) => {
      const step = finiteDifferenceStep(candidate[index]);
      let perturbed = new Float64Array(candidate);
      perturbed[index] += step;
      this.sanitizeState(perturbed);
      let actualStep = perturbed[index] - candidate[index];
      if (Math.abs(actualStep) < 1e-12) {
        perturbed = new Float64Array(candidate);
        perturbed[index] -= step;
        this.sanitizeState(perturbed);
        actualStep = perturbed[index] - candidate[index];
      }
      if (Math.abs(actualStep) < 1e-12) {
        return baseResidual.map(() => 0);
      }
      const perturbedResidual = this.unsupportedDiagnosticCoupledNewtonResidual(
        perturbed,
        beforeProviderCommitT,
        beforeProviderCommitX,
        dt,
        chamberFilter,
        baseProviderState,
        unknownIndices,
      );
      return perturbedResidual.map((value, row) => (value - baseResidual[row]) / actualStep);
    }).reduce((rows, column, columnIndex) => {
      for (let row = 0; row < column.length; row++) rows[row][columnIndex] = column[row];
      return rows;
    }, Array.from({ length: unknownIndices.length }, () => Array(unknownIndices.length).fill(0)));
  }

  private stepGraphCoupledProviderState(
    dt: number,
    beforeProviderCommitT: number,
    beforeProviderCommitX: Float64Array,
  ): void {
    const options = this.experimentalGraphCoupledStep;
    if (!options) throw new Error("Missing graph-coupled step options.");
    const baseProviderState = this.snapshotExperimentalActiveProviderStates();
    const k1 = this.rhs(beforeProviderCommitX);
    let candidate = new Float64Array(beforeProviderCommitX.length);
    for (let i = 0; i < beforeProviderCommitX.length; i++) {
      candidate[i] = beforeProviderCommitX[i] + dt * k1[i];
    }
    this.sanitizeState(candidate);

    const iterations = options.iterations ?? 2;
    const relaxation = options.relaxation ?? 1;
    for (let iteration = 0; iteration < iterations; iteration++) {
      this.restoreExperimentalActiveProviderStates(baseProviderState);
      const provisionalProviderState = this.computeExperimentalActiveProviderStateCommits(
        dt,
        beforeProviderCommitT,
        beforeProviderCommitX,
        beforeProviderCommitT + dt,
        candidate,
        new Set(options.providerStateCouplingChambers ?? ["LV", "RV"]),
      );
      this.restoreExperimentalActiveProviderStates(provisionalProviderState);
      const k2 = this.rhs(candidate);
      const next = new Float64Array(beforeProviderCommitX.length);
      for (let i = 0; i < beforeProviderCommitX.length; i++) {
        next[i] = beforeProviderCommitX[i] + 0.5 * dt * (k1[i] + k2[i]);
        if (relaxation < 1) {
          next[i] = candidate[i] + relaxation * (next[i] - candidate[i]);
        }
      }
      this.sanitizeState(next);
      candidate = next;
    }

    this.restoreExperimentalActiveProviderStates(baseProviderState);
    this.x.set(candidate);
    this.t += dt;
    this.sanitizeState(this.x);
  }

  setTBVCorrectionEnabled(enabled: boolean): void {
    this.tbvCorrectionEnabled = enabled;
  }

  resetTBVCorrectionCounters(): void {
    this.tbvCorrectionMagThisBeat = 0;
    this.tbvCorrectionMagLastBeat = 0;
    this.tbvCorrectionLastStepMl = 0;
    this.tbvProjectionLastStepAudit = emptyTBVProjectionAudit();
    this.tbvProjectionCurrentBeatAudit = emptyTBVProjectionAudit();
    this.tbvProjectionLastBeatAudit = emptyTBVProjectionAudit();
    this.aorticQDotLastStepAudit = emptyAorticQDotAudit();
    this.aorticQDotCurrentBeatAudit = emptyAorticQDotAudit();
    this.aorticQDotLastBeatAudit = emptyAorticQDotAudit();
    this.dynamicQDotLastStepAudit = {};
    this.dynamicQDotCurrentBeatAudit = {};
    this.dynamicQDotLastBeatAudit = {};
    this.valveFlowStepDiagnostics = emptyValveFlowStepDiagnosticsByValve();
  }

  resetDebugDiagnostics(): void {
    this.clampHitCount = 0;
    this.resetClampDiagnostics();
    this.resetTBVCorrectionCounters();
  }

  setTBVCorrectionAuditOptions(options: {
    gain?: number;
    maxTotalCorrectionMl?: number;
    maxNodeVolumeMl?: number;
  } | null): void {
    this.tbvCorrectionOptions = options ? { ...options } : null;
  }

  setAorticFlowClampMode(mode: AorticFlowClampMode): void {
    this.aorticFlowClampMode = mode;
  }

  setAorticFlowDerivativeClamp(limitMlPerS2: number): void {
    const limit = Number.isFinite(limitMlPerS2) && limitMlPerS2 > 0
      ? limitMlPerS2
      : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
    this.aorticFlowDerivativeClampPositiveMlPerS2 = limit;
    this.aorticFlowDerivativeClampNegativeMlPerS2 = limit;
    this.dynamicFlowDerivativeClampScope = "aov";
  }

  setAorticFlowDerivativeClampLimits(positiveMlPerS2: number, negativeMlPerS2: number): void {
    this.aorticFlowDerivativeClampPositiveMlPerS2 = Number.isFinite(positiveMlPerS2) && positiveMlPerS2 > 0
      ? positiveMlPerS2
      : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
    this.aorticFlowDerivativeClampNegativeMlPerS2 = Number.isFinite(negativeMlPerS2) && negativeMlPerS2 > 0
      ? negativeMlPerS2
      : this.aorticFlowDerivativeClampPositiveMlPerS2;
    this.dynamicFlowDerivativeClampScope = "aov";
  }

  setDynamicFlowDerivativeClampLimits(
    positiveMlPerS2: number,
    negativeMlPerS2: number,
    scope: DynamicQDotClampScope = "aov",
  ): void {
    this.setAorticFlowDerivativeClampLimits(positiveMlPerS2, negativeMlPerS2);
    this.dynamicFlowDerivativeClampScope = scope;
  }

  setAorticValveQUpdateMode(mode: AorticValveQUpdateMode): void {
    this.aorticValveQUpdateMode = mode;
  }

  private resetClampDiagnostics(): void {
    this.nodeClampHits = {};
    this.dynamicFlowClampHits = {};
    this.valveDiodeClampHits = {};
    this.sanitizeLastStepAudit = emptyVolumeDeltaAudit();
    this.sanitizeCurrentBeatAudit = emptyVolumeDeltaAudit();
    this.sanitizeLastBeatAudit = emptyVolumeDeltaAudit();
    this.tbvProjectionLastStepAudit = emptyTBVProjectionAudit();
    this.tbvProjectionCurrentBeatAudit = emptyTBVProjectionAudit();
    this.tbvProjectionLastBeatAudit = emptyTBVProjectionAudit();
    this.aorticQDotLastStepAudit = emptyAorticQDotAudit();
    this.aorticQDotCurrentBeatAudit = emptyAorticQDotAudit();
    this.aorticQDotLastBeatAudit = emptyAorticQDotAudit();
    this.dynamicQDotLastStepAudit = {};
    this.dynamicQDotCurrentBeatAudit = {};
    this.dynamicQDotLastBeatAudit = {};
    this.valveFlowStepDiagnostics = emptyValveFlowStepDiagnosticsByValve();
  }

  runFor(seconds: number, dt = 0.001, sampleHz = 60, options: RunForOptions = {}): SimSample[] {
    const collectSamples = options.collectSamples ?? true;
    const recordHistory = options.recordHistory ?? true;
    const historyLimit = Math.max(0, Math.floor(options.historyLimit ?? 12000));
    const samples: SimSample[] = [];
    const sampleInterval = 1 / sampleHz;
    let sampleAt = Math.floor((this.t + 1e-9) / sampleInterval) * sampleInterval + sampleInterval;
    const tEnd = this.t + seconds - 1e-9;
    while (this.t < tEnd) {
      this.step(dt);
      if (this.t >= sampleAt) {
        const s = this.sample();
        if (collectSamples) samples.push(s);
        if (recordHistory) {
          this.history.push(s);
          while (this.history.length > historyLimit) this.history.shift();
        }
        sampleAt += sampleInterval;
      }
    }
    return samples;
  }

  sample(): SimSample {
    const pack = this.computePressures(this.x);
    const flows = this.computeFlows(this.x, pack);
    const chamberVolumeRates = this.chamberVolumeRatesFromFlows(flows);
    this.lastResolvedChamberVolumeRatesMlPerSec = chamberVolumeRates;
    const laReservoir = this.laReservoirDebugFields(this.x, pack.Vphys[this.nodeIndex.get("LA")!]);
    const pvOstial = this.pvOstialDebugFields(this.x, pack, flows);
    const laInternal = this.activeInternalIndex("LA");
    const raInternal = this.activeInternalIndex("RA");
    const qAo = flows[this.edgeIndex("AoV")];
    const qMV = flows[this.edgeIndex("MV")];
    const tvFlow = flows[this.edgeIndex("TV")];
    const pvFlow = flows[this.edgeIndex("PV")];
    const pLv = pack.P[this.nodeIndex.get("LV")!];
    const pAo = pack.P[this.nodeIndex.get("Ao")!];
    const mvStep = this.valveFlowStepDiagnostics.MV;
    const aovStep = this.valveFlowStepDiagnostics.AoV;
    const tvStep = this.valveFlowStepDiagnostics.TV;
    const pvStep = this.valveFlowStepDiagnostics.PV;
    const lap = pack.P[this.nodeIndex.get("LA")!];
    const qLAD = flows[this.edgeIndex("Ao_LAD")];
    const qLCx = flows[this.edgeIndex("Ao_LCx")];
    const qRCA = flows[this.edgeIndex("Ao_RCA")];
    const qCS = flows[this.edgeIndex("CS_RA")];
    const rap = pack.P[this.nodeIndex.get("RA")!];
    const rvp = pack.P[this.nodeIndex.get("RV")!];
    const pap = pack.P[this.nodeIndex.get("PA")!];
    const saIndex = this.nodeIndex.get("SA")!;
    const pArtIndex = this.nodeIndex.get("PArt")!;
    const aoIndex = this.nodeIndex.get("Ao")!;
    const paIndex = this.nodeIndex.get("PA")!;
    const aovLoss = this.effectiveLosses(this.edges[this.edgeIndex("AoV")], pLv, pAo, this.x);
    const aovResistiveDrop = aovLoss.R * qAo;
    const aovQuadraticDrop = aovLoss.B * qAo * Math.abs(qAo);
    const lvPressureTerms = this.p.heartModel === "activeStress"
      ? this.activeDebugPressureTerms("LV", pack.VLVeff, this.activeInternalFromState("LV", this.x), this.chamberCtx("LV", this.x))
      : undefined;
    const rvPressureTerms = this.p.heartModel === "activeStress"
      ? this.activeDebugPressureTerms("RV", pack.VRVeff, this.activeInternalFromState("RV", this.x), this.chamberCtx("RV", this.x))
      : undefined;
    const laPressureDecomposition = this.p.heartModel === "activeStress"
      ? this.atrialPressureDecompositionFields(
        "LA",
        pack.Vphys[this.nodeIndex.get("LA")!],
        this.activeInternalFromState("LA", this.x),
        this.chamberCtx("LA", this.x),
      )
      : {};
    const raPressureDecomposition = this.p.heartModel === "activeStress"
      ? this.atrialPressureDecompositionFields(
        "RA",
        pack.Vphys[this.nodeIndex.get("RA")!],
        this.activeInternalFromState("RA", this.x),
        this.chamberCtx("RA", this.x),
      )
      : {};
    const laGeometryFields = this.p.heartModel === "activeStress"
      ? this.atrialGeometryFields(
        "LA",
        pack.Vphys[this.nodeIndex.get("LA")!],
        this.activeInternalFromState("LA", this.x),
        this.chamberCtx("LA", this.x),
      )
      : {};
    const raGeometryFields = this.p.heartModel === "activeStress"
      ? this.atrialGeometryFields(
        "RA",
        pack.Vphys[this.nodeIndex.get("RA")!],
        this.activeInternalFromState("RA", this.x),
        this.chamberCtx("RA", this.x),
      )
      : {};
    const lvElastance = this.ventricularElastanceSignals("LV", pack.VLVeff, pack.PLVfw, this.x);
    const rvElastance = this.ventricularElastanceSignals("RV", pack.VRVeff, pack.PRVfw, this.x);
    const lvActivePressureComponent = activePressureComponentMmHg(lvPressureTerms);
    const rvActivePressureComponent = activePressureComponentMmHg(rvPressureTerms);
    const s: SimSample = {
      t: this.t,
      AoP: pack.P[this.nodeIndex.get("Ao")!],
      PAP: pap,
      systemicArterialPressurePa: pack.P[saIndex] * MMHG_TO_PA,
      downstreamPulmonaryArterialPressurePa: pack.P[pArtIndex] * MMHG_TO_PA,
      LAP: lap,
      RAP: rap,
      LVP: pLv,
      RVP: rvp,
      QAo: qAo,
      QPA: pvFlow,
      QPV: pvFlow,
      QMV: qMV,
      QTV: tvFlow,
      PVF: flows[this.edgeIndex("PVein_LA")],
      SVF: flows[this.edgeIndex("VC_RA")],
      QCapSV: flows[this.edgeIndex("Cap_SV")],
      QPArtPCap: flows[this.edgeIndex("PArt_PCap")],
      aorticRootToSystemicArteryFlowM3PerSec: flows[this.edgeIndex("Ao_SA")] * ML_TO_M3,
      proximalPulmonaryArterialFlowM3PerSec: flows[this.edgeIndex("PA_PArt")] * ML_TO_M3,
      QCorLAD: qLAD,
      QCorLCx: qLCx,
      QCorRCA: qRCA,
      QCorTotal: qLAD + qLCx + qRCA,
      QCS: qCS,
      aorticRootComplianceM3PerPa: complianceFromPtm(this.vascularPvLaw(this.nodes[aoIndex]), pack.Ptm[aoIndex])
        * ML_PER_MMHG_TO_M3_PER_PA,
      pulmonaryRootComplianceM3PerPa: complianceFromPtm(this.vascularPvLaw(this.nodes[paIndex]), pack.Ptm[paIndex])
        * ML_PER_MMHG_TO_M3_PER_PA,
      VLV: pack.Vphys[this.nodeIndex.get("LV")!],
      VRV: pack.Vphys[this.nodeIndex.get("RV")!],
      VLA: pack.Vphys[this.nodeIndex.get("LA")!],
      VRA: pack.Vphys[this.nodeIndex.get("RA")!],
      dVLVdtMlPerSec: chamberVolumeRates.LV,
      dVRVdtMlPerSec: chamberVolumeRates.RV,
      dVLAdtMlPerSec: chamberVolumeRates.LA,
      dVRAdtMlPerSec: chamberVolumeRates.RA,
      VSystemicVenous: pack.Vphys[this.nodeIndex.get("SV")!] + pack.Vphys[this.nodeIndex.get("VC")!],
      VPulmonaryVenous: pack.Vphys[this.nodeIndex.get("PCap")!] + pack.Vphys[this.nodeIndex.get("PVen")!] + pack.Vphys[this.nodeIndex.get("PVein")!],
      P_PVein: pack.P[this.nodeIndex.get("PVein")!],
      phi: this.x[this.idx.phi],
      aLV: clamp(this.x[this.activeInternalIndex("LV").a], 0, 1),
      aRV: clamp(this.x[this.activeInternalIndex("RV").a], 0, 1),
      aLA: clamp(this.x[laInternal.a], 0, 1),
      aRA: clamp(this.x[raInternal.a], 0, 1),
      cRA: Math.max(this.x[raInternal.c], 0),
      rLA: clamp(this.x[laInternal.r], 0, Math.max(this.activeModel("LA").ap.reservoirStrokeMl ?? 0, 0)),
      rRA: clamp(this.x[raInternal.r], 0, Math.max(this.activeModel("RA").ap.reservoirStrokeMl ?? 0, 0)),
      xiMV: clamp(this.x[this.idx.xi.MV], 0, 1),
      xiAoV: clamp(this.x[this.idx.xi.AoV], 0, 1),
      xiTV: clamp(this.x[this.idx.xi.TV], 0, 1),
      xiPV: clamp(this.x[this.idx.xi.PV], 0, 1),
      dP_MV: lap - pLv,
      dP_AoV: pLv - pAo,
      dP_TV: rap - rvp,
      dP_PV: rvp - pap,
      MV_qNextPreDiode: mvStep.qNextPreDiode,
      MV_qNextPostDiode: mvStep.qNextPostDiode,
      MV_qNextPreFlowClamp: mvStep.qNextPreFlowClamp,
      MV_qNextPostFlowClamp: mvStep.qNextPostFlowClamp,
      MV_qDotPreDiode: mvStep.qDotPreDiode,
      MV_qDotPostDiode: mvStep.qDotPostDiode,
      MV_qDotPreFlowClamp: mvStep.qDotPreFlowClamp,
      MV_qDotRaw: mvStep.qDotRaw,
      MV_qDotPost: mvStep.qDotPost,
      MV_qDotClampHit01: mvStep.qDotClampHit01,
      MV_qDotClampImpulse: mvStep.qDotClampImpulse,
      MV_diodeImpulse: mvStep.diodeImpulse,
      MV_flowClampImpulse: mvStep.flowClampImpulse,
      MV_acceptedBoundaryApplied01: mvStep.acceptedBoundaryApplied01,
      MV_acceptedBoundaryQNext: mvStep.acceptedBoundaryQNext,
      MV_acceptedBoundaryPressureGradientMmHg: mvStep.acceptedBoundaryPressureGradientMmHg,
      MV_acceptedBoundaryQDotRaw: mvStep.acceptedBoundaryQDotRaw,
      MV_acceptedBoundaryQDotPost: mvStep.acceptedBoundaryQDotPost,
      MV_acceptedBoundaryQDotClampHit01: mvStep.acceptedBoundaryQDotClampHit01,
      MV_acceptedBoundaryQDotClampImpulse: mvStep.acceptedBoundaryQDotClampImpulse,
      MV_acceptedBoundaryDiodeImpulse: mvStep.acceptedBoundaryDiodeImpulse,
      MV_acceptedBoundaryComplementarityResidualMlPerSec: mvStep.acceptedBoundaryComplementarityResidualMlPerSec,
      MV_acceptedBoundaryIterationCount: mvStep.acceptedBoundaryIterationCount,
      MV_acceptedBoundaryValveState01: mvStep.acceptedBoundaryValveState01,
      MV_acceptedBoundaryAreaRatio: mvStep.acceptedBoundaryAreaRatio,
      AoV_areaRatio: aovLoss.areaRatio,
      AoV_loss_R: aovResistiveDrop,
      AoV_loss_B: aovQuadraticDrop,
      AoV_loss_residual: (pLv - pAo) - aovResistiveDrop - aovQuadraticDrop,
      AoV_qNextPreDiode: aovStep.qNextPreDiode,
      AoV_qNextPostDiode: aovStep.qNextPostDiode,
      AoV_qNextPreFlowClamp: aovStep.qNextPreFlowClamp,
      AoV_qNextPostFlowClamp: aovStep.qNextPostFlowClamp,
      AoV_qDotPreDiode: aovStep.qDotPreDiode,
      AoV_qDotPostDiode: aovStep.qDotPostDiode,
      AoV_qDotPreFlowClamp: aovStep.qDotPreFlowClamp,
      AoV_qDotRaw: aovStep.qDotRaw,
      AoV_qDotPost: aovStep.qDotPost,
      AoV_qDotClampHit01: aovStep.qDotClampHit01,
      AoV_qDotClampImpulse: aovStep.qDotClampImpulse,
      AoV_diodeImpulse: aovStep.diodeImpulse,
      AoV_flowClampImpulse: aovStep.flowClampImpulse,
      TV_qNextPreDiode: tvStep.qNextPreDiode,
      TV_qNextPostDiode: tvStep.qNextPostDiode,
      TV_qNextPreFlowClamp: tvStep.qNextPreFlowClamp,
      TV_qNextPostFlowClamp: tvStep.qNextPostFlowClamp,
      TV_qDotPreDiode: tvStep.qDotPreDiode,
      TV_qDotPostDiode: tvStep.qDotPostDiode,
      TV_qDotPreFlowClamp: tvStep.qDotPreFlowClamp,
      TV_qDotRaw: tvStep.qDotRaw,
      TV_qDotPost: tvStep.qDotPost,
      TV_qDotClampHit01: tvStep.qDotClampHit01,
      TV_qDotClampImpulse: tvStep.qDotClampImpulse,
      TV_diodeImpulse: tvStep.diodeImpulse,
      TV_flowClampImpulse: tvStep.flowClampImpulse,
      TV_acceptedBoundaryApplied01: tvStep.acceptedBoundaryApplied01,
      TV_acceptedBoundaryQNext: tvStep.acceptedBoundaryQNext,
      TV_acceptedBoundaryPressureGradientMmHg: tvStep.acceptedBoundaryPressureGradientMmHg,
      TV_acceptedBoundaryQDotRaw: tvStep.acceptedBoundaryQDotRaw,
      TV_acceptedBoundaryQDotPost: tvStep.acceptedBoundaryQDotPost,
      TV_acceptedBoundaryQDotClampHit01: tvStep.acceptedBoundaryQDotClampHit01,
      TV_acceptedBoundaryQDotClampImpulse: tvStep.acceptedBoundaryQDotClampImpulse,
      TV_acceptedBoundaryDiodeImpulse: tvStep.acceptedBoundaryDiodeImpulse,
      TV_acceptedBoundaryComplementarityResidualMlPerSec: tvStep.acceptedBoundaryComplementarityResidualMlPerSec,
      TV_acceptedBoundaryIterationCount: tvStep.acceptedBoundaryIterationCount,
      TV_acceptedBoundaryValveState01: tvStep.acceptedBoundaryValveState01,
      TV_acceptedBoundaryAreaRatio: tvStep.acceptedBoundaryAreaRatio,
      PV_qNextPreDiode: pvStep.qNextPreDiode,
      PV_qNextPostDiode: pvStep.qNextPostDiode,
      PV_qNextPreFlowClamp: pvStep.qNextPreFlowClamp,
      PV_qNextPostFlowClamp: pvStep.qNextPostFlowClamp,
      PV_qDotPreDiode: pvStep.qDotPreDiode,
      PV_qDotPostDiode: pvStep.qDotPostDiode,
      PV_qDotPreFlowClamp: pvStep.qDotPreFlowClamp,
      PV_qDotRaw: pvStep.qDotRaw,
      PV_qDotPost: pvStep.qDotPost,
      PV_qDotClampHit01: pvStep.qDotClampHit01,
      PV_qDotClampImpulse: pvStep.qDotClampImpulse,
      PV_diodeImpulse: pvStep.diodeImpulse,
      PV_flowClampImpulse: pvStep.flowClampImpulse,
      LVPressureUnclampedMmHg: lvPressureTerms?.pressureUnclampedMmHg,
      LVPassivePressureMmHg: passivePressureComponentMmHg(lvPressureTerms),
      LVPressureFloorHit01: lvPressureTerms?.pressureFloorHit01 ?? 0,
      RVPressureUnclampedMmHg: rvPressureTerms?.pressureUnclampedMmHg,
      RVPassivePressureMmHg: passivePressureComponentMmHg(rvPressureTerms),
      RVPressureFloorHit01: rvPressureTerms?.pressureFloorHit01 ?? 0,
      LVActiveFiberStressPa: lvPressureTerms?.sigmaAct,
      RVActiveFiberStressPa: rvPressureTerms?.sigmaAct,
      LVFiberLambda: lvPressureTerms?.lambda,
      RVFiberLambda: rvPressureTerms?.lambda,
      LVActivePressureMmHg: lvActivePressureComponent,
      RVActivePressureMmHg: rvActivePressureComponent,
      ...laPressureDecomposition,
      ...raPressureDecomposition,
      ...laGeometryFields,
      ...raGeometryFields,
      ELV_active: lvElastance.active,
      ERV_active: rvElastance.active,
      ELV_timeVarying: lvElastance.timeVarying,
      ERV_timeVarying: rvElastance.timeVarying,
      ...pvOstial,
      ...laReservoir,
      Pperi: pack.Pperi,
      Ppc: pack.Ppc,
      VHeart: pack.VHeart,
      septumShiftMl: pack.septumShiftMl,
      VLVeff: pack.VLVeff,
      VRVeff: pack.VRVeff,
      PLVfw: pack.PLVfw,
      PRVfw: pack.PRVfw,
      PVI_LV: pack.PVI_LV,
      PVI_RV: pack.PVI_RV,
      septalForceMmHg: pack.septalForceMmHg,
      PLADArt: pack.P[this.nodeIndex.get("LAD_Art")!],
      PLCxArt: pack.P[this.nodeIndex.get("LCx_Art")!],
      PRCAArt: pack.P[this.nodeIndex.get("RCA_Art")!],
      PCS: pack.P[this.nodeIndex.get("CS")!],
      PimLAD: pack.PimLAD,
      PimLCx: pack.PimLCx,
      PimRCA: pack.PimRCA,
      TBV: this.totalBloodVolume(pack)
    };
    this.trackBeat(s);
    this.lastSample = s;
    return s;
  }

  debugActiveStressDiagnostics(): ModelCoreActiveStressDiagnostics {
    if (this.p.heartModel !== "activeStress") return {};
    const pack = this.computePressures(this.x);
    const out: ModelCoreActiveStressDiagnostics = {};
    for (const n of this.activeChamberNodes()) {
      const ch = n.chamber!;
      const chamberVolume = ch === "LV"
        ? pack.VLVeff
        : ch === "RV"
          ? pack.VRVeff
          : pack.Vphys[this.nodeIndex.get(n.name)!];
      out[ch] = this.activeDebugStressTerms(ch, chamberVolume, this.activeInternalFromState(ch, this.x), this.chamberCtx(ch, this.x));
    }
    return out;
  }

  debugExperimentalActiveSourceProviderIds(): Partial<Record<Chamber, string>> {
    const ids: Partial<Record<Chamber, string>> = {};
    for (const [chamber, provider] of Object.entries(this.experimentalActiveSourceProviders) as Array<[Chamber, ModelCoreExperimentalActiveSourceProvider | undefined]>) {
      if (provider) ids[chamber] = provider.sourceProviderId;
    }
    return ids;
  }

  debugExperimentalActiveSourceProviderStates(): ModelCoreExperimentalActiveSourceProviderStateDiagnostics {
    const out: ModelCoreExperimentalActiveSourceProviderStateDiagnostics = {};
    for (const [chamber, provider] of Object.entries(this.experimentalActiveSourceProviders) as Array<[Chamber, ModelCoreExperimentalActiveSourceProvider | undefined]>) {
      if (!provider) continue;
      const state = this.experimentalActiveSourceProviderStates[chamber];
      const stateSnapshot = provider.debugProviderState
        ? provider.debugProviderState(this.cloneExperimentalActiveProviderState(provider, state, `${chamber}.debugProviderState`))
        : this.cloneExperimentalActiveProviderState(provider, state, `${chamber}.debugProviderState`);
      out[chamber] = {
        sourceProviderId: provider.sourceProviderId,
        stateVersion: this.experimentalActiveSourceProviderStateVersions[chamber] ?? 0,
        stateSnapshot,
      };
    }
    return out;
  }

  packExperimentalActiveProviderRuntimeState(): ModelCoreExperimentalActiveSourceProviderRuntimeState {
    const snapshot = this.snapshotExperimentalActiveProviderStates();
    const out: ModelCoreExperimentalActiveSourceProviderRuntimeState = {};
    for (const [chamber, provider] of Object.entries(this.experimentalActiveSourceProviders) as Array<[Chamber, ModelCoreExperimentalActiveSourceProvider | undefined]>) {
      if (!provider) continue;
      const entry = snapshot[chamber];
      out[chamber] = {
        sourceProviderId: provider.sourceProviderId,
        state: entry?.state,
        version: entry?.version ?? 0,
      };
    }
    return out;
  }

  restoreExperimentalActiveProviderRuntimeState(
    snapshot: ModelCoreExperimentalActiveSourceProviderRuntimeState | undefined,
  ): void {
    if (!snapshot) return;
    const restored: Partial<Record<Chamber, { state: unknown; version: number }>> = {};
    for (const [chamber, entry] of Object.entries(snapshot) as Array<[Chamber, ModelCoreExperimentalActiveSourceProviderRuntimeState[Chamber]]>) {
      if (!entry) continue;
      const provider = this.experimentalActiveSourceProviders[chamber];
      if (!provider) continue;
      if (entry.sourceProviderId !== provider.sourceProviderId) {
        throw new Error(
          `Experimental active provider state source mismatch for ${chamber}: `
          + `expected ${provider.sourceProviderId}, got ${entry.sourceProviderId}`,
        );
      }
      restored[chamber] = { state: entry.state, version: entry.version };
    }
    this.restoreExperimentalActiveProviderStates(restored);
  }

  debugExperimentalBoundaryRootInertance(): ModelCoreExperimentalBoundaryRootInertanceDiagnostics | null {
    if (!this.experimentalBoundaryRootInertance) return null;
    const baseAoVL = Math.max(this.p.AoV_L ?? defaultParams().AoV_L, 1e-6);
    const additional = this.experimentalBoundaryRootInertance.additionalAorticRootInertanceMmHgSec2PerMl;
    return {
      mechanismId: this.experimentalBoundaryRootInertance.mechanismId,
      targetValve: "AoV",
      baseAoVInertanceMmHgSec2PerMl: baseAoVL,
      additionalAorticRootInertanceMmHgSec2PerMl: additional,
      effectiveAoVBoundaryRootInertanceMmHgSec2PerMl: baseAoVL + additional,
    };
  }

  debugExperimentalVentricularChamberTransactionStep():
    ModelCoreExperimentalVentricularChamberTransactionStepOptions | null {
    const options = this.experimentalVentricularChamberTransactionStep;
    if (!options) return null;
    return {
      ...options,
      providerStateCouplingChambers: [...(options.providerStateCouplingChambers ?? [])],
      avValveBoundaryTargetValves: [...(options.avValveBoundaryTargetValves ?? [])],
    };
  }

  debugClampDiagnostics(): ModelCoreClampDiagnostics {
    return {
      totalClampHits: this.clampHitCount,
      nodeClampHits: { ...this.nodeClampHits },
      dynamicFlowClampHits: { ...this.dynamicFlowClampHits },
      valveDiodeClampHits: { ...this.valveDiodeClampHits },
      sanitizeLastStep: cloneVolumeDeltaAudit(this.sanitizeLastStepAudit),
      sanitizeCurrentBeat: cloneVolumeDeltaAudit(this.sanitizeCurrentBeatAudit),
      sanitizeLastBeat: cloneVolumeDeltaAudit(this.sanitizeLastBeatAudit),
      tbvProjectionLastStep: cloneTBVProjectionAudit(this.tbvProjectionLastStepAudit),
      tbvProjectionCurrentBeat: cloneTBVProjectionAudit(this.tbvProjectionCurrentBeatAudit),
      tbvProjectionLastBeat: cloneTBVProjectionAudit(this.tbvProjectionLastBeatAudit),
      aorticQDotLastStep: cloneAorticQDotAudit(this.aorticQDotLastStepAudit),
      aorticQDotCurrentBeat: cloneAorticQDotAudit(this.aorticQDotCurrentBeatAudit),
      aorticQDotLastBeat: cloneAorticQDotAudit(this.aorticQDotLastBeatAudit),
      dynamicQDotLastStep: cloneDynamicQDotAuditRecord(this.dynamicQDotLastStepAudit),
      dynamicQDotCurrentBeat: cloneDynamicQDotAuditRecord(this.dynamicQDotCurrentBeatAudit),
      dynamicQDotLastBeat: cloneDynamicQDotAuditRecord(this.dynamicQDotLastBeatAudit),
    };
  }

  /** Feed a sample to the per-beat fingerprint accumulator (steady-state detection). */
  private trackBeat(s: SimSample): void {
    // Ignore a repeated sample at the same t (e.g. a bare sample() with no step),
    // which would otherwise double-count into the current beat.
    if (this.beatAccum !== null && s.t === this.beatAccum.lastT) return;
    const beat = Math.floor(s.phi);
    if (this.beatAccum === null) {
      this.beatAccum = this.newBeatAccum(beat, s);
    } else if (beat > this.beatAccum.beat && this.beatAccum.count >= 8) {
      // Close the completed beat into a fingerprint and start a fresh one.
      if (beat - this.beatAccum.beat > 1 && this.clampHitCount < 1000) {
        console.warn(`Settling: skipped beat(s) ${this.beatAccum.beat}->${beat}; sampleHz too low for HR?`);
      }
      this.beatRing.push(this.finalizeBeat(this.beatAccum));
      if (this.beatRing.length > 8) this.beatRing.shift();
      this.totalBeats++;
      this.tbvCorrectionMagLastBeat = this.tbvCorrectionMagThisBeat;
      this.tbvCorrectionMagThisBeat = 0;
      this.sanitizeLastBeatAudit = cloneVolumeDeltaAudit(this.sanitizeCurrentBeatAudit);
      this.sanitizeCurrentBeatAudit = emptyVolumeDeltaAudit();
      this.tbvProjectionLastBeatAudit = cloneTBVProjectionAudit(this.tbvProjectionCurrentBeatAudit);
      this.tbvProjectionCurrentBeatAudit = emptyTBVProjectionAudit();
      this.aorticQDotLastBeatAudit = cloneAorticQDotAudit(this.aorticQDotCurrentBeatAudit);
      this.aorticQDotCurrentBeatAudit = emptyAorticQDotAudit();
      this.dynamicQDotLastBeatAudit = cloneDynamicQDotAuditRecord(this.dynamicQDotCurrentBeatAudit);
      this.dynamicQDotCurrentBeatAudit = {};
      this.beatAccum = this.newBeatAccum(beat, s);
    }
    const a = this.beatAccum;
    a.count++;
    a.lastT = s.t;
    a.sumAoP += s.AoP; a.maxAoP = Math.max(a.maxAoP, s.AoP); a.minAoP = Math.min(a.minAoP, s.AoP);
    a.sumPAP += s.PAP; a.maxPAP = Math.max(a.maxPAP, s.PAP); a.minPAP = Math.min(a.minPAP, s.PAP);
    a.sumRAP += s.RAP; a.sumLAP += s.LAP;
    if (s.VLV > a.maxVLV) { a.maxVLV = s.VLV; a.lvEdp = s.LVP; } // EDP = pressure at end-diastole
    a.minVLV = Math.min(a.minVLV, s.VLV);
    if (s.VRV > a.maxVRV) { a.maxVRV = s.VRV; a.rvEdp = s.RVP; }
    a.minVRV = Math.min(a.minVRV, s.VRV);
    a.tbv = s.TBV;
    // Stroke volume = trapezoidal integral of positive valve flow over the beat.
    if (a.hasPrev) {
      const dt = s.t - a.prevT;
      a.svL += 0.5 * (Math.max(0, a.prevQAo) + Math.max(0, s.QAo)) * dt;
      a.svR += 0.5 * (Math.max(0, a.prevQPA) + Math.max(0, s.QPA)) * dt;
    }
    a.prevQAo = s.QAo; a.prevQPA = s.QPA; a.prevT = s.t; a.hasPrev = true;
  }

  private newBeatAccum(beat: number, s: SimSample): BeatAccum {
    return {
      beat, count: 0, lastT: NaN,
      sumAoP: 0, maxAoP: -Infinity, minAoP: Infinity,
      sumPAP: 0, maxPAP: -Infinity, minPAP: Infinity,
      sumRAP: 0, sumLAP: 0,
      svL: 0, svR: 0, prevQAo: s.QAo, prevQPA: s.QPA, prevT: s.t, hasPrev: false,
      maxVLV: -Infinity, minVLV: Infinity, maxVRV: -Infinity, minVRV: Infinity,
      lvEdp: s.LVP, rvEdp: s.RVP,
      tbv: s.TBV,
    };
  }

  private finalizeBeat(a: BeatAccum): BeatSummary {
    const n = Math.max(a.count, 1);
    // Snapshot observables at the beat boundary once: reused for the fingerprint
    // below AND by metrics() (phi-aligned, stop-phase independent).
    const obs = this.debugObservables();
    this.lastBeatObs = obs;
    const vals: Record<SignalKey, number> = {
      aopMean: a.sumAoP / n, aopSys: a.maxAoP, aopDia: a.minAoP,
      papMean: a.sumPAP / n, papSys: a.maxPAP, papDia: a.minPAP,
      rapMean: a.sumRAP / n, lapMean: a.sumLAP / n,
      svL: a.svL, svR: a.svR,
      edvL: a.maxVLV, esvL: a.minVLV, edvR: a.maxVRV, esvR: a.minVRV,
      lvEdp: a.lvEdp, rvEdp: a.rvEdp,
      pmsf: obs.Pmsf, tbv: a.tbv,
    };
    return { beat: a.beat, vals };
  }

  /** Reset the steady-state beat tracker. Call after an external clock jump
   *  (e.g. aligning core.t to another instance), since that breaks the in-flight
   *  beat's trapezoidal-dt and would corrupt one fingerprint. */
  clearBeatTracking(): void {
    this.beatRing = [];
    this.beatAccum = null;
    this.totalBeats = 0;
    this.lastBeatObs = null;
  }

  /** Periodic steady-state assessment (read-only). Hemorrhage/fluid => forced-trend.
   *  The 0.5 mL/min threshold matches the ledger's practical "no-op" floor: a
   *  smaller net flow advances expectedTBV by <0.005 mL/beat, far below the TBV
   *  convergence band, so it is intentionally allowed to settle. */
  assessSteadyState(policy: SettlePolicy = DEFAULT_SETTLE_POLICY): SettleStatus {
    if (this.p.projectTBV && Math.abs(this.p.fluidRate - this.p.bleedRate) > 0.5) {
      return {
        settled: false,
        reason: "forced-trend",
        beats: this.totalBeats,
        worstSignal: null,
        worstDelta: NaN,
        periodBeats: 1,
        periodDelta: NaN,
        adjacentDelta: NaN,
      };
    }
    return assessBeatRing(this.beatRing, this.totalBeats, policy);
  }

  isSettled(policy: SettlePolicy = DEFAULT_SETTLE_POLICY): boolean {
    return this.assessSteadyState(policy).settled;
  }

  /**
   * Advance the model until it reaches periodic steady state, or the cap, or a
   * forced trend. Deterministic for a given dt/platform (fixed-step integration,
   * no Date/random); the cap bounds elapsed sim time.
   */
  settleToSteady(
    policy: SettlePolicy = DEFAULT_SETTLE_POLICY,
    dt = 0.001,
    sampleHz = 120,
    options: RunForOptions = {},
  ): SettleStatus {
    const startT = this.t;
    const forced = this.assessSteadyState(policy);
    if (forced.reason === "forced-trend") {
      return { ...forced, actualSeconds: 0 };
    }
    // Bound on elapsed SIM time so the cap is robust for any dt (and the loop
    // runs the same number of steps for a given dt on a given platform).
    const sliceSeconds = 0.25;
    while (this.t - startT < policy.capSeconds) {
      this.runFor(sliceSeconds, dt, sampleHz, options);
      const st = this.assessSteadyState(policy);
      if (st.settled) {
        // Run a phase-margin beat or two past convergence.
        const beatSeconds = (60 / Math.max(this.p.HR, 1)) * policy.postSettleBeats * (st.periodBeats ?? 1);
        this.runFor(beatSeconds, dt, sampleHz, options);
        return { ...st, actualSeconds: this.t - startT };
      }
    }
    return { ...this.assessSteadyState(policy), reason: "cap", settled: false, actualSeconds: this.t - startT };
  }

  /**
   * Phi-aligned measurement window: the most recent FULLY-completed cardiac beat
   * (samples spanning phi in [b, b+1], b = floor(phi_now) - 1, closed by the
   * first sample of the in-progress beat). This makes metrics() independent of
   * the stop phase — a window anchored to `t` instead includes a phase-dependent
   * slice of two beats, which jitters SV/EDP at the sample-grid level and breaks
   * fingerprint reproducibility across save/load. Falls back to the in-progress
   * beat, then the last sample, when <1 complete beat of history exists.
   */
  private lastCompleteBeatWindow(windowBeats: 1 | 2 = 1): BeatWindow {
    const h = this.history;
    if (h.length < 2) return { data: this.lastSample ? [this.lastSample] : [...h], beatCount: 1 };
    const curBeat = Math.floor(h[h.length - 1].phi);
    const requested = windowBeats === 2 ? 2 : 1;
    const endBeat = curBeat - 1;
    const startBeat = endBeat - requested + 1;
    let start = -1;
    let end = -1;
    for (let i = 0; i < h.length; i++) {
      const b = Math.floor(h[i].phi);
      if (start === -1 && b === startBeat) start = i;
      else if (start !== -1 && b > endBeat) { end = i; break; } // first sample after window = closing boundary
    }
    if (start !== -1 && end !== -1 && end - start >= 5 * requested) {
      return { data: h.slice(start, end + 1), beatCount: requested as 1 | 2 };
    }
    if (requested === 2) return this.lastCompleteBeatWindow(1);
    const cur = h.filter((sample) => Math.floor(sample.phi) === curBeat);
    if (cur.length >= 5) return { data: cur, beatCount: 1 };
    return { data: this.lastSample ? [this.lastSample] : [h[h.length - 1]], beatCount: 1 };
  }

  metrics(options: MetricsOptions = {}): SimMetrics {
    const { data, beatCount } = this.lastCompleteBeatWindow(options.windowBeats ?? 1);
    const avg = (key: keyof SimSample) => data.reduce((acc, sample) => acc + Number(sample[key]), 0) / Math.max(data.length, 1);
    const min = (key: keyof SimSample) => Math.min(...data.map((sample) => Number(sample[key])));
    const max = (key: keyof SimSample) => Math.max(...data.map((sample) => Number(sample[key])));
    const integratePositive = (key: keyof SimSample) => {
      if (data.length < 2) return 0;
      let area = 0;
      for (let i = 1; i < data.length; i++) {
        const dt = data[i].t - data[i - 1].t;
        area += 0.5 * dt * (Math.max(0, Number(data[i][key])) + Math.max(0, Number(data[i - 1][key])));
      }
      return area;
    };
    const integratePositiveWhen = (key: keyof SimSample, predicate: (sample: SimSample) => boolean) => {
      if (data.length < 2) return 0;
      let area = 0;
      for (let i = 1; i < data.length; i++) {
        if (!predicate(data[i]) || !predicate(data[i - 1])) continue;
        const dt = data[i].t - data[i - 1].t;
        area += 0.5 * dt * (Math.max(0, Number(data[i][key])) + Math.max(0, Number(data[i - 1][key])));
      }
      return area;
    };
    const diastolicFraction = (key: keyof SimSample) => {
      const total = integratePositive(key);
      if (total <= 1e-9) return 0;
      return clamp(integratePositiveWhen(key, (sample) => sample.QAo <= 5) / total, 0, 1);
    };
    const windowBeatDivisor = Math.max(beatCount, 1);
    const SV_L = integratePositive("QAo") / windowBeatDivisor;
    const SV_R = integratePositive("QPA") / windowBeatDivisor;
    const CO_L = (SV_L * this.p.HR) / 1000;
    const CO_R = (SV_R * this.p.HR) / 1000;
    const systemicVenousReturnLMin = avg("SVF") * 60 / 1000;
    const pulmonaryVenousReturnLMin = avg("PVF") * 60 / 1000;
    const scaleValveFlow = (flow: ReturnType<typeof valveFlowIntegral>) => ({
      ...flow,
      forwardVolumeMl: flow.forwardVolumeMl / windowBeatDivisor,
      reverseVolumeMl: flow.reverseVolumeMl / windowBeatDivisor,
      netVolumeMl: flow.netVolumeMl / windowBeatDivisor,
    });
    const mvFlow = scaleValveFlow(valveFlowIntegral(data, "QMV"));
    const aovFlow = scaleValveFlow(valveFlowIntegral(data, "QAo"));
    const tvFlow = scaleValveFlow(valveFlowIntegral(data, "QTV"));
    const pvFlow = scaleValveFlow(valveFlowIntegral(data, "QPV"));
    const EDV_L = max("VLV");
    const ESV_L = min("VLV");
    const EDV_R = max("VRV");
    const ESV_R = min("VRV");
    const lvEdSample = data.reduce((best, sample) => sample.VLV > best.VLV ? sample : best, data[0]);
    const rvEdSample = data.reduce((best, sample) => sample.VRV > best.VRV ? sample : best, data[0]);
    const aovEjection = data.filter((sample) => sample.QAo > 50 && sample.xiAoV > 0.8);
    const aovMeanGradient = aovEjection.length > 0
      ? aovEjection.reduce((acc, sample) => acc + sample.dP_AoV, 0) / aovEjection.length
      : 0;
    const aovPeakGradient = aovEjection.length > 0
      ? Math.max(...aovEjection.map((sample) => sample.dP_AoV))
      : 0;
    // Observables from the last beat boundary (phi-aligned) so Pmsf/vrGradient/
    // volumes are stop-phase independent like the rest of metrics; fall back to a
    // live read only before the first beat closes (e.g. a bare step() loop).
    const obs = this.lastBeatObs ?? this.debugObservables();
    const corLAD = avg("QCorLAD") * 60;
    const corLCx = avg("QCorLCx") * 60;
    const corRCA = avg("QCorRCA") * 60;
    const corTotal = avg("QCorTotal") * 60;
    const corPctCO = CO_L > 1e-9 ? 100 * corTotal / (CO_L * 1000) : 0;
    const totalCorExpected = Math.max(CO_L * 1000 * 0.05, 1);
    const leftDemand = (this.p.HR / 75)
      * (this.p.lvTmaxScale / 0.70)
      * Math.pow(Math.max(avg("LVP"), 1) / 90, 0.4);
    const rightDemand = (this.p.HR / 75)
      * this.p.rvTmaxScale
      * Math.pow(Math.max(avg("RVP"), 1) / 25, 0.4);
    const leftExpected = totalCorExpected * (CORONARY_SPECS.LAD.restingShare + CORONARY_SPECS.LCx.restingShare);
    const rightExpected = totalCorExpected * CORONARY_SPECS.RCA.restingShare;
    return {
      HR: this.p.HR,
      AoPMean: avg("AoP"),
      AoPSys: max("AoP"),
      AoPDia: min("AoP"),
      PAPMean: avg("PAP"),
      RAPMean: avg("RAP"),
      LAPMean: avg("LAP"),
      LVEDPApprox: lvEdSample?.LVP ?? avg("LVP"),
      RVEDPApprox: rvEdSample?.RVP ?? avg("RVP"),
      AoVMeanGradient: aovMeanGradient,
      AoVPeakGradient: aovPeakGradient,
      SV_L,
      SV_R,
      CO_L,
      CO_R,
      systemicVenousReturnLMin,
      pulmonaryVenousReturnLMin,
      MVForwardVolumeMl: mvFlow.forwardVolumeMl,
      MVReverseVolumeMl: mvFlow.reverseVolumeMl,
      MVNetVolumeMl: mvFlow.netVolumeMl,
      MVRegurgitantFraction: mvFlow.regurgitantFraction,
      AoVForwardVolumeMl: aovFlow.forwardVolumeMl,
      AoVReverseVolumeMl: aovFlow.reverseVolumeMl,
      AoVNetVolumeMl: aovFlow.netVolumeMl,
      AoVRegurgitantFraction: aovFlow.regurgitantFraction,
      TVForwardVolumeMl: tvFlow.forwardVolumeMl,
      TVReverseVolumeMl: tvFlow.reverseVolumeMl,
      TVNetVolumeMl: tvFlow.netVolumeMl,
      TVRegurgitantFraction: tvFlow.regurgitantFraction,
      PVForwardVolumeMl: pvFlow.forwardVolumeMl,
      PVReverseVolumeMl: pvFlow.reverseVolumeMl,
      PVNetVolumeMl: pvFlow.netVolumeMl,
      PVRegurgitantFraction: pvFlow.regurgitantFraction,
      EF_LApprox: EDV_L > 1e-6 ? clamp((EDV_L - ESV_L) / EDV_L, 0, 1) : 0,
      EF_RApprox: EDV_R > 1e-6 ? clamp((EDV_R - ESV_R) / EDV_R, 0, 1) : 0,
      TBV: avg("TBV"),
      Pmsf: obs.Pmsf,
      vrGradient: obs.vrGradient,
      stressedVolumeSystemic: obs.stressedVolumeSystemic,
      unstressedVolumeSystemic: obs.unstressedVolumeSystemic,
      CorFlowLADMlMin: corLAD,
      CorFlowLCxMlMin: corLCx,
      CorFlowRCAMlMin: corRCA,
      CorFlowTotalMlMin: corTotal,
      CorPctCO: corPctCO,
      CorDiastolicFractionLAD: diastolicFraction("QCorLAD"),
      CorDiastolicFractionLCx: diastolicFraction("QCorLCx"),
      CorDiastolicFractionRCA: diastolicFraction("QCorRCA"),
      FFR_LAD: avg("AoP") > 1e-9 ? avg("PLADArt") / avg("AoP") : 0,
      FFR_LCx: avg("AoP") > 1e-9 ? avg("PLCxArt") / avg("AoP") : 0,
      FFR_RCA: avg("AoP") > 1e-9 ? avg("PRCAArt") / avg("AoP") : 0,
      CorSupplyDemandL: (corLAD + corLCx) / Math.max(leftExpected * leftDemand, 1),
      CorSupplyDemandR: corRCA / Math.max(rightExpected * rightDemand, 1),
    };
  }

  passivePressureAt(chamber: Chamber, volumeMl: number): number {
    if (this.p.heartModel !== "activeStress") return 0;
    const pack = this.computePressures(this.x);
    return pack.Pperi + this.activePassivePressure(chamber, volumeMl, this.activeInternalFromState(chamber, this.x), this.chamberCtx(chamber, this.x));
  }

  passivePressureVolumeCurve(
    chamber: Chamber,
    volumeMinMl: number,
    volumeMaxMl: number,
    pointCount = 64,
  ): Array<{ v: number; p: number }> {
    const n = Math.max(2, Math.floor(pointCount));
    const lo = Math.min(volumeMinMl, volumeMaxMl);
    const hi = Math.max(volumeMinMl, volumeMaxMl);
    const points: Array<{ v: number; p: number }> = [];
    for (let i = 0; i < n; i++) {
      const alpha = n === 1 ? 0 : i / (n - 1);
      const v = lo + alpha * (hi - lo);
      points.push({ v, p: this.passivePressureAt(chamber, v) });
    }
    return points;
  }

  health(options: { periodBeats?: 1 | 2 } = {}): SimulationHealth {
    const periodBeats = options.periodBeats === 2 ? 2 : 1;
    const m = this.metrics({ windowBeats: periodBeats });
    // Use the CURRENT state TBV (not a possibly-stale lastSample), so a bare
    // step() loop still reports mass conservation correctly. Compared against the
    // EXPECTED TBV (ledger) so intended hemorrhage/fluid is not flagged — only
    // true integrator drift is. (Meaningful mainly with projectTBV=false; with
    // the projector on, actual TBV is pinned to expectedTBV by construction.)
    const currentTBV = this.totalBloodVolume(this.computePressures(this.x));
    const tbvDriftMl = currentTBV - this.expectedTBV;
    const tbvDriftPercent = this.expectedTBV > 0 ? 100 * tbvDriftMl / this.expectedTBV : 0;
    const leftRightFlowMismatchLMin = Math.abs(m.CO_L - m.CO_R);
    const cycleMetricDelta = this.computeCycleMetricDelta(periodBeats);
    const messages: string[] = [];

    let numericalStability: SimulationHealthStatus = "ok";
    for (const value of this.x) {
      if (!Number.isFinite(value)) {
        numericalStability = "failed";
        messages.push("Non-finite state detected.");
        break;
      }
    }
    if (this.clampHitCount > 0) messages.push(`State clamp used ${this.clampHitCount} times.`);

    let massConservation: SimulationHealthStatus = "ok";
    if (Math.abs(tbvDriftPercent) > 1.0) {
      massConservation = "failed";
      messages.push(`TBV drift ${tbvDriftMl.toFixed(2)} mL (${tbvDriftPercent.toFixed(3)}%).`);
    } else if (Math.abs(tbvDriftPercent) > 0.2) {
      massConservation = "warning";
      messages.push(`TBV drift warning ${tbvDriftMl.toFixed(2)} mL (${tbvDriftPercent.toFixed(3)}%).`);
    }

    let flowBalance: SimulationHealthStatus = "ok";
    if (leftRightFlowMismatchLMin > 2.0) {
      flowBalance = "failed";
      messages.push(`Left/right CO mismatch ${leftRightFlowMismatchLMin.toFixed(2)} L/min.`);
    } else if (leftRightFlowMismatchLMin > 1.0) {
      flowBalance = "warning";
      messages.push(`Left/right CO mismatch warning ${leftRightFlowMismatchLMin.toFixed(2)} L/min.`);
    }

    // Health means MODEL/NUMERICAL validity, NOT physiological normalcy.
    // Simulating abnormal (e.g. shock, hypertension) states is a primary use
    // case, so being outside the normal-adult range is never a warning.
    const physiologicalRange: SimulationHealthStatus = "ok";

    if (cycleMetricDelta > 0.25) messages.push(`Cycle-to-cycle metric delta ${cycleMetricDelta.toFixed(3)}; not settled.`);

    const status: SimulationHealthStatus = [numericalStability, massConservation, flowBalance].includes("failed")
      ? "failed"
      : ([numericalStability, massConservation, flowBalance].includes("warning") || cycleMetricDelta > 0.25 || this.clampHitCount > 0)
        ? "warning"
        : "ok";

    return {
      status,
      periodBeats,
      tbvDriftMl,
      tbvDriftPercent,
      leftRightFlowMismatchLMin,
      cycleMetricDelta,
      clampHitCount: this.clampHitCount,
      numericalStability,
      massConservation,
      flowBalance,
      physiologicalRange,
      messages
    };
  }

  private computeCycleMetricDelta(windowBeats: 1 | 2 = 1): number {
    const T = 60 / Math.max(this.p.HR, 1);
    const windowSeconds = T * Math.max(windowBeats, 1);
    const a = this.history.filter((sample) => sample.t >= this.t - windowSeconds);
    const b = this.history.filter((sample) => sample.t < this.t - windowSeconds && sample.t >= this.t - 2 * windowSeconds);
    if (a.length < 5 || b.length < 5) return 0;
    const mean = (xs: SimSample[], key: keyof SimSample) => xs.reduce((acc, sample) => acc + Number(sample[key]), 0) / xs.length;
    const denom = (Math.abs(mean(a, "AoP")) + Math.abs(mean(b, "AoP")) + 1);
    const dMap = Math.abs(mean(a, "AoP") - mean(b, "AoP")) / denom;
    const dLap = Math.abs(mean(a, "LAP") - mean(b, "LAP")) / (Math.abs(mean(a, "LAP")) + Math.abs(mean(b, "LAP")) + 1);
    return Math.max(dMap, dLap);
  }

  private rhs(x: Float64Array): Float64Array {
    const dy = new Float64Array(x.length);
    const pack = this.computePressures(x);
    const flows = this.computeFlows(x, pack);
    this.lastResolvedChamberVolumeRatesMlPerSec = this.chamberVolumeRatesFromFlows(flows);
    const balance = new Float64Array(nodeNames.length);
    this.dynamicQDotLastStepAudit = {};

    for (let ei = 0; ei < this.edges.length; ei++) {
      const e = this.edges[ei];
      const q = flows[ei];
      balance[this.nodeIndex.get(e.up)!] -= q;
      balance[this.nodeIndex.get(e.down)!] += q;
    }

    for (let ni = 0; ni < this.nodes.length; ni++) {
      const n = this.nodes[ni];
      const stateIndex = this.idx.node[n.name as NodeName];
      if (n.kind === "venousPressure") {
        dy[stateIndex] = balance[ni];
      } else {
        dy[stateIndex] = clamp(balance[ni], -2500, 2500);
      }
    }

    for (const e of this.edges) {
      if (e.kind !== "dynamic" && e.kind !== "valve") continue;
      const qi = this.idx.q[e.name as DynamicEdgeName];
      const up = this.nodeIndex.get(e.up)!;
      const down = this.nodeIndex.get(e.down)!;
      const Pu = pack.P[up];
      const Pd = pack.P[down];
      const PdEff = this.downstreamEffective(e, Pd);
      const q = x[qi];
      const { R, B, areaRatio } = this.effectiveLosses(e, Pu, Pd, x);
      let L = e.kind === "valve" ? Math.max((this.p as any)[`${e.name}_L`] ?? e.L ?? 0.001, 1e-6) : Math.max(e.L ?? 0.001, 1e-6);
      if (e.name === "AoV") L = this.effectiveAorticBoundaryRootInertance(L);
      if (e.kind !== "valve" && e.useChiResistance) {
        L = L / Math.max(areaRatio, 1e-6);
      }
      const h = Math.max(this.rhsDt, 1e-6);
      const valveName = e.kind === "valve" ? e.name as ValveName : null;
      let qNext = e.name === "AoV"
        ? this.aorticValveQNext(q, Pu - PdEff, R, B, L, h)
        : this.currentLossQNext(q, Pu - PdEff, R, B, L, h);
      const qNextPreDiode = qNext;
      if (valveName) {
        if (this.valveLeakArea(valveName, e) <= 1e-9 && qNext < 0) {
          qNext = this.applyValveDiodeConstraint(
            valveName,
            qNext,
            clamp(x[this.idx.xi[valveName]], 0, 1),
          );
        }
      }
      const qNextPostDiode = qNext;
      const qNextPreFlowClamp = qNext;
      if (e.name === "AoV") qNext = this.applyAorticFlowClamp(qNext);
      const qNextPostFlowClamp = qNext;

      const qDotPreDiode = (qNextPreDiode - q) / h;
      const qDotPostDiode = (qNextPostDiode - q) / h;
      const qDotPreFlowClamp = (qNextPreFlowClamp - q) / h;
      const qDotRaw = (qNext - q) / h;
      const useCustomQDotClamp = this.usesCustomDynamicQDotClamp(e);
      const qDotPositiveLimit = useCustomQDotClamp
        ? Math.max(this.aorticFlowDerivativeClampPositiveMlPerS2, 1)
        : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
      const qDotNegativeLimit = useCustomQDotClamp
        ? Math.max(this.aorticFlowDerivativeClampNegativeMlPerS2, 1)
        : DEFAULT_AORTIC_Q_DOT_CLAMP_ML_PER_S2;
      const qDotPost = clamp(qDotRaw, -qDotNegativeLimit, qDotPositiveLimit);
      dy[qi] = qDotPost;
      const dynamicEdge = e.name as DynamicEdgeName;
      addDynamicQDotAudit(this.dynamicQDotLastStepAudit, dynamicEdge, qDotRaw, qDotPost);
      addDynamicQDotAudit(this.dynamicQDotCurrentBeatAudit, dynamicEdge, qDotRaw, qDotPost);
      const stepDiagnostics: ValveFlowStepDiagnostics = {
        ...emptyValveFlowStepDiagnostics(),
        qNextPreDiode,
        qNextPostDiode,
        qNextPreFlowClamp,
        qNextPostFlowClamp,
        qDotPreDiode,
        qDotPostDiode,
        qDotPreFlowClamp,
        qDotRaw,
        qDotPost,
        qDotClampHit01: Math.abs(qDotPost - qDotRaw) > 1e-9 ? 1 : 0,
        qDotClampImpulse: qDotPost - qDotRaw,
        diodeImpulse: qNextPostDiode - qNextPreDiode,
        flowClampImpulse: qNextPostFlowClamp - qNextPreFlowClamp,
      };
      if (valveName) {
        this.valveFlowStepDiagnostics[valveName] = stepDiagnostics;
      }
      if (e.name === "AoV") {
        this.aorticQDotLastStepAudit = emptyAorticQDotAudit();
        addAorticQDotAudit(this.aorticQDotLastStepAudit, qDotRaw, qDotPost);
        addAorticQDotAudit(this.aorticQDotCurrentBeatAudit, qDotRaw, qDotPost);
      }
    }

    for (const vName of valveNames) {
      const e = this.edges[this.edgeIndex(vName)];
      const xiIndex = this.idx.xi[vName];
      const dP = pack.P[this.nodeIndex.get(e.up)!] - pack.P[this.nodeIndex.get(e.down)!];
      const kOpen = (this.p as any)[`${vName}_kOpen`] ?? e.kOpen ?? 2.0;
      const tauOpen = (this.p as any)[`${vName}_tauOpen`] ?? e.tauOpen ?? 0.012;
      const tauClose = (this.p as any)[`${vName}_tauClose`] ?? e.tauClose ?? 0.025;
      const q = x[this.idx.q[vName]];
      
      const deadband = vName === "MV" ? MV_PRESSURE_DEADBAND_MMHG : 0;
      const xiEq = dP > deadband
        ? sigmoid(kOpen * (dP - deadband - (e.dP0 ?? 0)))
        : dP < -deadband
          ? 0
          : x[xiIndex];
      const forwardCoast = vName === "AoV" && dP <= 0 && dP > -3 && q > 1 && this.valveLeakArea(vName, e) <= 1e-9;
      const tau = vName === "MV"
        ? xiEq > x[xiIndex] ? tauOpen : tauClose
        : dP > 0 ? tauOpen : forwardCoast ? Math.max(tauClose, 0.012) : tauClose;
      dy[xiIndex] = clamp((xiEq - x[xiIndex]) / Math.max(tau, 1e-5), -80, 80);
    }

    dy[this.idx.phi] = this.p.HR / 60;
    for (const n of this.activeChamberNodes()) {
      const ch = n.chamber!;
      const internalIndex = this.activeInternalIndex(ch);
      const nodeIndex = this.idx.node[n.name as NodeName];
      const internal = this.activeInternalFromState(ch, x);
      const chamberVolume = ch === "LV"
        ? pack.VLVeff
        : ch === "RV"
          ? pack.VRVeff
          : x[nodeIndex];
      const dInternal = this.activeInternalDerivatives(ch, chamberVolume, internal, this.chamberCtx(ch, x));
      dy[internalIndex.c] = dInternal.cDot;
      dy[internalIndex.a] = dInternal.aDot;
      dy[internalIndex.r] = dInternal.rDot;
      dy[internalIndex.tensionPa] = dInternal.tensionPaDot ?? 0;
      dy[internalIndex.lambdaAct] = dInternal.lambdaActDot ?? 0;
    }

    const shiftState = x[this.idx.septumShift];
    dy[this.idx.septumShift] = clamp(septalShiftDerivative({
      VLV: pack.Vphys[this.nodeIndex.get("LV")!],
      VRV: pack.Vphys[this.nodeIndex.get("RV")!],
      shiftMl: this.p.septalCouplingEnabled ? pack.septumShiftMl : shiftState,
      PLVfw: pack.PLVfw,
      PRVfw: pack.PRVfw,
    }, this.septumParams()), -400, 400);

    return dy;
  }

  private usesCustomDynamicQDotClamp(edge: EdgeSpec): boolean {
    if (this.dynamicFlowDerivativeClampScope === "aov") return edge.name === "AoV";
    if (this.dynamicFlowDerivativeClampScope === "pv") return edge.name === "PV";
    if (this.dynamicFlowDerivativeClampScope === "semilunar") return edge.name === "AoV" || edge.name === "PV";
    if (this.dynamicFlowDerivativeClampScope === "all-valves") return edge.kind === "valve";
    return true;
  }

  private computePressures(x: Float64Array): PressurePack {
    const P = new Float64Array(nodeNames.length);
    const Ptm = new Float64Array(nodeNames.length);
    const Vphys = new Float64Array(nodeNames.length);
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const xi = this.idx.node[n.name as NodeName];
      Vphys[i] = n.kind === "venousPressure" ? x[xi] : clamp(x[xi], 1, 1000);
    }

    const lvNode = this.nodes[this.nodeIndex.get("LV")!];
    const rvNode = this.nodes[this.nodeIndex.get("RV")!];
    const VLV = Vphys[this.nodeIndex.get("LV")!];
    const VRV = Vphys[this.nodeIndex.get("RV")!];
    const VLA = Vphys[this.nodeIndex.get("LA")!];
    const VRA = Vphys[this.nodeIndex.get("RA")!];
    const peri = pericardialPressure({
      VLV,
      VRV,
      VLA,
      VRA,
      Pth: this.Pth(),
    }, this.pericardiumParams());
    const sepParams = this.septumParams();
    const septumShiftMl = sepParams.enabled
      ? clampSeptalShift(x[this.idx.septumShift], {
        VLV,
        VRV,
        V0LV: lvNode.V0 ?? 0,
        V0RV: rvNode.V0 ?? 0,
      }, sepParams)
      : 0;
    const VLVeff = VLV + septumShiftMl;
    const VRVeff = VRV - septumShiftMl;
    const PLVfwRaw = this.heartTransmuralPressure(lvNode, VLV, x);
    const PRVfwRaw = this.heartTransmuralPressure(rvNode, VRV, x);
    const PLVfw = this.heartTransmuralPressure(lvNode, VLVeff, x);
    const PRVfw = this.heartTransmuralPressure(rvNode, VRVeff, x);
    const septalForceMmHg = septalForce({ VLV, VRV, shiftMl: septumShiftMl, PLVfw, PRVfw }, sepParams);
    const coronaryExt = this.coronaryExternalPressures(peri.Pperi, PLVfw, PRVfw);

    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const xi = this.idx.node[n.name as NodeName];
      const Pext = this.externalPressure(n.ext ?? "none", coronaryExt);

      if (n.kind === "venousPressure") {
        const volume = x[xi];
        const ptm = this.venousPtmFromVolume(n, volume);
        Ptm[i] = ptm;
        Vphys[i] = volume;
        P[i] = Pext + ptm;
        continue;
      }

      const V = Vphys[i];
      if (n.kind === "arterial") {
        const VsEff = Math.max((n.Vs ?? 100) / Math.max(this.p.arterialStiffness, 0.25), 1);
        const s = clamp((V - this.effectiveVu(n)) / VsEff, -30, 5);
        const ptm = (n.P0 ?? 50) * (Math.exp(s) - 1);
        Ptm[i] = ptm;
        P[i] = Pext + ptm;
      } else if (n.kind === "linear") {
        const ptm = (V - this.effectiveVu(n)) / Math.max(n.C ?? 1, 1e-6);
        Ptm[i] = ptm;
        P[i] = Pext + ptm;
      } else if (n.kind === "heartElastance" || n.kind === "heartActive") {
        const ptm = n.chamber === "LV" ? PLVfw : n.chamber === "RV" ? PRVfw : this.heartTransmuralPressure(n, V, x);
        Ptm[i] = ptm;
        P[i] = peri.Pperi + ptm;
      }
    }
    return {
      P,
      Ptm,
      Vphys,
      Pperi: peri.Pperi,
      Ppc: peri.Ppc,
      VHeart: peri.Vheart,
      septumShiftMl,
      VLVeff,
      VRVeff,
      PLVfw,
      PRVfw,
      PLVfwRaw,
      PRVfwRaw,
      PVI_LV: PLVfw - PLVfwRaw,
      PVI_RV: PRVfw - PRVfwRaw,
      septalForceMmHg,
      PimLAD: coronaryExt.imLAD,
      PimLCx: coronaryExt.imLCx,
      PimRCA: coronaryExt.imRCA,
      PimLADVen: coronaryExt.imLADVen,
      PimLCxVen: coronaryExt.imLCxVen,
      PimRCAVen: coronaryExt.imRCAVen,
    };
  }

  private pericardiumParams(): PericardiumParams {
    return {
      enabled: this.p.pericardiumEnabled,
      pressureScaleMmHg: this.p.pericardialPressureScaleMmHg,
      slackVolumeMl: this.p.pericardialSlackVolumeMl,
      volumeScaleMl: this.p.pericardialVolumeScaleMl,
      softnessMl: this.p.pericardialSoftnessMl,
      biasMmHg: this.p.pericardialBiasMmHg,
      fluidMl: this.p.pericardialFluidMl,
    };
  }

  private septumParams(): SeptumParams {
    return {
      enabled: this.p.septalCouplingEnabled,
      stiffnessScale: this.p.septalStiffnessScale,
      k1MmHgPerMl: this.p.septalK1MmHgPerMl,
      k3MmHgPerMl3: this.p.septalK3MmHgPerMl3,
      dampingMmHgSecPerMl: this.p.septalDampingMmHgSecPerMl,
      maxShiftMl: this.p.septalMaxShiftMl,
      lvPressureWeight: this.p.septalLvPressureWeight,
    };
  }

  private heartTransmuralPressure(n: NodeSpec, volumeMl: number, x: Float64Array): number {
    if (!n.chamber) throw new Error(`Missing chamber for heart node ${n.name}`);
    if (this.useElastancePressure(n)) {
      return this.elastanceModels.get(n.name)!.pressure(volumeMl, { c: 0, a: 0, r: 0, tensionPa: 0 }, this.chamberCtx(n.chamber, x));
    }
    if (n.kind !== "heartActive") throw new Error(`Node ${n.name} is not a heart chamber`);
    const internalIndex = this.activeInternalIndex(n.chamber);
    const internal = this.activeInternalFromState(n.chamber, x);
    return this.activePressure(n.chamber, volumeMl, internal, this.chamberCtx(n.chamber, x));
  }

  private useElastancePressure(n: NodeSpec): boolean {
    if (n.kind === "heartElastance") return true;
    return n.kind === "heartActive" && this.p.heartModel === "elastance";
  }

  private computeFlows(x: Float64Array, pack: PressurePack): Float64Array {
    const flows = new Float64Array(this.edges.length);
    for (let ei = 0; ei < this.edges.length; ei++) {
      const e = this.edges[ei];
      const up = this.nodeIndex.get(e.up)!;
      const down = this.nodeIndex.get(e.down)!;
      const Pu = pack.P[up];
      const Pd = pack.P[down];
      const PdEff = this.downstreamEffective(e, Pd);
      if (e.kind === "dynamic" || e.kind === "valve") {
        flows[ei] = this.dynamicFlowValue(e.name as DynamicEdgeName, x[this.idx.q[e.name as DynamicEdgeName]]);
      } else {
        const { R, B } = this.effectiveLosses(e, Pu, Pd, x);
        flows[ei] = solveQuadraticFlow(Pu - PdEff, R, B);
      }
    }
    return flows;
  }

  private valveLeakArea(name: ValveName, e: EdgeSpec): number {
    return (this.p as any)[`${name}_Aleak`] ?? e.Aleak ?? 0;
  }

  /** Evaluation context handed to a ChamberModel for the given chamber. */
  private chamberCtx(chamber: Chamber, x: Float64Array): ChamberCtx {
    const isRV = chamber === "RV";
    const side: "left" | "right" = chamber === "RA" || chamber === "RV" ? "right" : "left";
    const lvVolume = x[this.idx.node.LV];
    const lvEd = 115;
    const lvEs = 45;
    const rvVolume = x[this.idx.node.RV];
    const rvEd = 135;
    const rvEs = 55;
    const pairedVentricleVolume = side === "right" ? rvVolume : lvVolume;
    const pairedEd = side === "right" ? rvEd : lvEd;
    const pairedEs = side === "right" ? rvEs : lvEs;
    const inletValve = side === "right" ? "TV" : "MV";
    const outletValve = side === "right" ? "PV" : "AoV";
    const dynamicFlow = (edge: DynamicEdgeName) => this.dynamicFlowValue(edge, x[this.idx.q[edge]]);
    const lvVolumeRateMlPerSec = dynamicFlow("MV") - dynamicFlow("AoV");
    const rvVolumeRateMlPerSec = dynamicFlow("TV") - dynamicFlow("PV");
    const laVolumeRateMlPerSec = this.lastResolvedChamberVolumeRatesMlPerSec.LA;
    const raVolumeRateMlPerSec = this.lastResolvedChamberVolumeRatesMlPerSec.RA;
    const selfChamberVolumeRateMlPerSec =
      chamber === "LV" ? lvVolumeRateMlPerSec
        : chamber === "RV" ? rvVolumeRateMlPerSec
          : chamber === "LA" ? laVolumeRateMlPerSec
            : raVolumeRateMlPerSec;
    const pairedVolumeRateMlPerSec = side === "right" ? rvVolumeRateMlPerSec : lvVolumeRateMlPerSec;
    const pairedStrokeRefMl = Math.max(pairedEd - pairedEs, 1e-6);
    return {
      HR: this.p.HR,
      contractility: this.p.contractility,
      relaxation: this.p.relaxation,
      phi: x[this.idx.phi],
      chamber,
      avDelaySec: this.p.avDelaySec,
      atrialElectromechanicalDelaySec: this.p.atrialElectromechanicalDelaySec,
      ventricularElectromechanicalDelaySec: this.p.ventricularElectromechanicalDelaySec,
      tmaxScale: chamber === "LV" ? this.p.lvTmaxScale : isRV ? this.p.rvTmaxScale : 1,
      geomScale: chamber === "LV" ? this.p.lvGeomScale : isRV ? this.p.rvGeomScale : 1,
      caReleaseScale: chamber === "LV" ? this.p.caReleaseScale : isRV ? this.p.rvCaReleaseScale : 1,
      pairedVentricleVolumeMl: pairedVentricleVolume,
      pairedVentricleShortening01: clamp((pairedEd - pairedVentricleVolume) / pairedStrokeRefMl, 0, 1),
      pairedVentricleShorteningVelocity01PerSec: clamp(-pairedVolumeRateMlPerSec / pairedStrokeRefMl, -6, 8),
      selfChamberVolumeRateMlPerSec,
      inletValveOpen01: clamp(x[this.idx.xi[inletValve]], 0, 1),
      outletValveOpen01: clamp(x[this.idx.xi[outletValve]], 0, 1),
      side,
      lvVolumeMl: lvVolume,
      lvShortening01: clamp((lvEd - lvVolume) / Math.max(lvEd - lvEs, 1e-6), 0, 1),
      mvOpen01: clamp(x[this.idx.xi.MV], 0, 1),
      aovOpen01: clamp(x[this.idx.xi.AoV], 0, 1),
    };
  }

  private chamberVolumeRatesFromFlows(flows: Float64Array): ChamberVolumeRateMlPerSec {
    const qAo = flows[this.edgeIndex("AoV")];
    const qMV = flows[this.edgeIndex("MV")];
    const qTV = flows[this.edgeIndex("TV")];
    const qPV = flows[this.edgeIndex("PV")];
    const qPVeinLA = flows[this.edgeIndex("PVein_LA")];
    const qVC_RA = flows[this.edgeIndex("VC_RA")];
    const qCS_RA = flows[this.edgeIndex("CS_RA")];
    return {
      LV: qMV - qAo,
      RV: qTV - qPV,
      LA: qPVeinLA - qMV,
      RA: qVC_RA + qCS_RA - qTV,
    };
  }

  private atrialPressureDecompositionFields(
    chamber: "LA" | "RA",
    volumeMl: number,
    internal: ChamberInternal,
    chamberCtx: ChamberCtx,
  ): Partial<SimSample> {
    const terms = this.activeDebugPressureTerms(chamber, volumeMl, internal, chamberCtx);
    const noAvPlaneTerms = this.activeDebugPressureTerms(chamber, volumeMl, internal, {
      ...chamberCtx,
      pairedVentricleShortening01: 0,
      pairedVentricleShorteningVelocity01PerSec: 0,
    });
    const noAvPlaneStatefulTerms = this.activeDebugPressureTerms(
      chamber,
      volumeMl,
      { ...internal, r: 0 },
      {
        ...chamberCtx,
        pairedVentricleShortening01: 0,
        pairedVentricleShorteningVelocity01PerSec: 0,
      },
    );
    const noAvPlaneReference = noAvPlaneStatefulTerms ?? noAvPlaneTerms;
    const sigmaTotal = terms.sigmaPas + terms.sigmaAct;
    const passivePressure = Math.abs(sigmaTotal) > 1e-12
      ? terms.pressureUnclampedMmHg * terms.sigmaPas / sigmaTotal
      : 0;
    const activePressure = Math.abs(sigmaTotal) > 1e-12
      ? terms.pressureUnclampedMmHg * terms.sigmaAct / sigmaTotal
      : 0;
    if (chamber === "LA") {
      return {
        LAPressureUnclampedMmHg: terms.pressureUnclampedMmHg,
        LAPassivePressureMmHg: passivePressure,
        LAActivePressureMmHg: activePressure,
        LAAvPlanePressureDeltaMmHg: terms.pressureUnclampedMmHg - noAvPlaneReference.pressureUnclampedMmHg,
        LAPressureFloorHit01: terms.pressureFloorHit01,
      };
    }
    return {
      RAPressureUnclampedMmHg: terms.pressureUnclampedMmHg,
      RAPassivePressureMmHg: passivePressure,
      RAActivePressureMmHg: activePressure,
      RAAvPlanePressureDeltaMmHg: terms.pressureUnclampedMmHg - noAvPlaneReference.pressureUnclampedMmHg,
      RAPressureFloorHit01: terms.pressureFloorHit01,
    };
  }

  private atrialGeometryFields(
    chamber: "LA" | "RA",
    volumeMl: number,
    internal: ChamberInternal,
    chamberCtx: ChamberCtx,
  ): Partial<SimSample> {
    const geometry = this.activeModel(chamber).debugGeometryTerms(volumeMl, chamberCtx, internal);
    if (chamber === "LA") {
      return {
        LAAvPlaneDescent01: geometry.avPlaneDescent01,
        LAAvPlaneTargetDescent01: geometry.avPlaneTargetDescent01,
        LAAvPlaneDescentVelocity01PerSec: geometry.avPlaneDescentVelocity01PerSec,
        LAAvPlaneEffectiveVolumeCorrectionMl: geometry.effectiveVolumeCorrectionMl,
        LAAvPlaneEffectiveVolumeCorrectionVelocityMlPerSec: geometry.effectiveVolumeCorrectionVelocityMlPerSec,
        LAAvPlaneStatefulRelease01: geometry.avPlaneStatefulRelease01,
        LAAvPlaneDescentRiseTauSec: geometry.avPlaneDescentRiseTauSec,
        LAAvPlaneDescentReleaseTauSec: geometry.avPlaneDescentReleaseTauSec,
        LAAvPlaneDescentReleaseInletOpenHold: geometry.avPlaneDescentReleaseInletOpenHold,
        LAAvPlaneDescentReleaseInletOpenThreshold: geometry.avPlaneDescentReleaseInletOpenThreshold,
        LAWallVolumeMl: geometry.wallVolumeMl,
        LAWallVolumeWithoutAvPlaneMl: geometry.wallVolumeWithoutAvPlaneMl,
        LAWallLambda: geometry.lambda,
        LAWallLambdaWithoutAvPlane: geometry.lambdaWithoutAvPlane,
        LAWallLambdaAvPlaneDelta: geometry.lambdaAvPlaneDelta,
        LAWallEngineeringStrain: geometry.wallEngineeringStrain,
        LAWallEngineeringStrainWithoutAvPlane: geometry.wallEngineeringStrainWithoutAvPlane,
        LAWallEngineeringStrainAvPlaneDelta: geometry.wallEngineeringStrainAvPlaneDelta,
      };
    }
    return {
      RAAvPlaneDescent01: geometry.avPlaneDescent01,
      RAAvPlaneTargetDescent01: geometry.avPlaneTargetDescent01,
      RAAvPlaneDescentVelocity01PerSec: geometry.avPlaneDescentVelocity01PerSec,
      RAAvPlaneEffectiveVolumeCorrectionMl: geometry.effectiveVolumeCorrectionMl,
      RAAvPlaneEffectiveVolumeCorrectionVelocityMlPerSec: geometry.effectiveVolumeCorrectionVelocityMlPerSec,
      RAAvPlaneStatefulRelease01: geometry.avPlaneStatefulRelease01,
      RAAvPlaneDescentRiseTauSec: geometry.avPlaneDescentRiseTauSec,
      RAAvPlaneDescentReleaseTauSec: geometry.avPlaneDescentReleaseTauSec,
      RAAvPlaneDescentReleaseInletOpenHold: geometry.avPlaneDescentReleaseInletOpenHold,
      RAAvPlaneDescentReleaseInletOpenThreshold: geometry.avPlaneDescentReleaseInletOpenThreshold,
      RAWallVolumeMl: geometry.wallVolumeMl,
      RAWallVolumeWithoutAvPlaneMl: geometry.wallVolumeWithoutAvPlaneMl,
      RAWallLambda: geometry.lambda,
      RAWallLambdaWithoutAvPlane: geometry.lambdaWithoutAvPlane,
      RAWallLambdaAvPlaneDelta: geometry.lambdaAvPlaneDelta,
      RAWallEngineeringStrain: geometry.wallEngineeringStrain,
      RAWallEngineeringStrainWithoutAvPlane: geometry.wallEngineeringStrainWithoutAvPlane,
      RAWallEngineeringStrainAvPlaneDelta: geometry.wallEngineeringStrainAvPlaneDelta,
    };
  }

  private laReservoirDebugFields(x: Float64Array, VLA: number): Partial<SimSample> | undefined {
    const model = this.activeModel("LA");
    const ap = model.ap;
    if ((ap.reservoirBranchGain ?? 0) <= 0 || (ap.reservoirStrokeMl ?? 0) <= 0) return undefined;
    const internalIndex = this.activeInternalIndex("LA");
    const internal = this.activeInternalFromState("LA", x);
    const state = model.reservoirBranchState(VLA, internal, this.chamberCtx("LA", x));
    return {
      qLAReservoirMl: state.qMl,
      VLABodyMl: state.vBodyMl,
      VLAReservoirMl: state.vReservoirMl,
      PLABodyMmHg: state.pBodyMmHg,
      PLAReservoirMmHg: state.pReservoirMmHg,
      PLAEquilibriumErrorMmHg: state.equilibriumErrorMmHg,
      twoBranchSolveFlag: state.solveFlag,
      reservoirSleeveOverMax01: state.sleeveOverMax01,
    };
  }

  private configurePVOstialEdge(edge: EdgeSpec): EdgeSpec {
    if (edge.name !== "PVein_LA") return edge;
    const L = Math.max(edge.pvOstialInertanceL ?? 0, 0);
    if (L <= 0) return { ...edge, kind: "resistive", L: undefined, B: edge.B ?? 0 };
    return {
      ...edge,
      kind: "dynamic",
      R: Math.max(edge.pvOstialResistanceR ?? edge.R, 1e-8),
      L,
      B: Math.max(edge.pvOstialQuadraticB ?? 0, 0),
      group: "none",
      waterfall: false,
      useChiResistance: false,
      useChiQuadratic: false,
    };
  }

  private applyEdgeOverrides(edge: EdgeSpec): EdgeSpec {
    const overrides = this.p.edgeOverrides?.[edge.name];
    if (!overrides) return edge;
    const next: EdgeSpec = { ...edge, ...overrides };
    if (edge.name === "PVein_LA") {
      if ("R" in overrides && !("pvOstialResistanceR" in overrides)) {
        next.pvOstialResistanceR = overrides.R;
      }
      if ("L" in overrides && !("pvOstialInertanceL" in overrides)) {
        next.pvOstialInertanceL = overrides.L;
      }
      if ("B" in overrides && !("pvOstialQuadraticB" in overrides)) {
        next.pvOstialQuadraticB = overrides.B;
      }
    }
    return next;
  }

  private pvOstialDebugFields(x: Float64Array, pack: PressurePack, flows: Float64Array): Partial<SimSample> | undefined {
    const edge = this.edges[this.edgeIndex("PVein_LA")];
    const q = flows[this.edgeIndex("PVein_LA")];
    if (edge.kind !== "dynamic" || Math.max(edge.L ?? 0, 0) <= 0) {
      return { PVFOstial: q };
    }
    const pVein = pack.P[this.nodeIndex.get("PVein")!];
    const lap = pack.P[this.nodeIndex.get("LA")!];
    const resistiveDrop = edge.R * q + (edge.B ?? 0) * q * Math.abs(q);
    return {
      PVFOstial: q,
      pvOstialQ: x[this.idx.q.PVein_LA],
      pvOstialResistiveDrop: resistiveDrop,
      pvOstialInertialDrop: (pVein - lap) - resistiveDrop,
    };
  }

  private activeChamberNodes(): NodeSpec[] {
    return this.nodes.filter((n) => n.kind === "heartActive" && n.chamber && n.active);
  }

  private activeInternalIndex(chamber: Chamber): { c: number; a: number; r: number; tensionPa: number; lambdaAct: number } {
    const idx = this.idx.activeInternal[chamber];
    if (!idx) throw new Error(`Missing active internal state index for ${chamber}`);
    return idx;
  }

  private activeInternalFromState(chamber: Chamber, x: Float64Array) {
    const idx = this.activeInternalIndex(chamber);
    return { c: x[idx.c], a: x[idx.a], r: x[idx.r], tensionPa: x[idx.tensionPa], lambdaAct: x[idx.lambdaAct] };
  }

  private activeModel(chamber: Chamber): ActiveStressChamberModel {
    const model = this.activeModels[chamber];
    if (!model) throw new Error(`Missing active chamber model for ${chamber}`);
    return model;
  }

  private activeProvider(chamber: Chamber): ModelCoreExperimentalActiveSourceProvider | undefined {
    return this.experimentalActiveSourceProviders[chamber];
  }

  private activeProviderStateForCall(chamber: Chamber, provider: ModelCoreExperimentalActiveSourceProvider): unknown {
    return this.cloneExperimentalActiveProviderState(
      provider,
      this.experimentalActiveSourceProviderStates[chamber],
      `${chamber}.providerStateForCall`,
    );
  }

  private activeCall(
    chamber: Chamber,
    volumeMl: number,
    internal: ChamberInternal,
    chamberCtx: ChamberCtx,
  ): ModelCoreActiveSourceProviderCall {
    const provider = this.activeProvider(chamber);
    return {
      chamber,
      activeModel: this.activeModel(chamber),
      volumeMl,
      internal,
      chamberCtx,
      providerState: provider ? this.activeProviderStateForCall(chamber, provider) : undefined,
      providerStateVersion: this.experimentalActiveSourceProviderStateVersions[chamber] ?? 0,
    };
  }

  private activeInitialInternal(chamber: Chamber): ChamberInternal {
    const activeModel = this.activeModel(chamber);
    const provider = this.activeProvider(chamber);
    return provider
      ? provider.initialInternal({ chamber, activeModel })
      : activeModel.initialInternal();
  }

  private activePressure(
    chamber: Chamber,
    volumeMl: number,
    internal: ChamberInternal,
    chamberCtx: ChamberCtx,
  ): number {
    const provider = this.activeProvider(chamber);
    if (!provider) {
      return this.activeModel(chamber).pressure(volumeMl, internal, chamberCtx);
    }
    const call = this.activeCall(chamber, volumeMl, internal, chamberCtx);
    if (provider.sourceActiveStressPa) {
      return call.activeModel.pressureFromActiveFiberStress(
        volumeMl,
        internal,
        chamberCtx,
        provider.sourceActiveStressPa(call),
      );
    }
    if (provider.pressure) return provider.pressure(call);
    throw new Error(`Experimental active source provider ${provider.sourceProviderId} must define pressure or sourceActiveStressPa.`);
  }

  private activePassivePressure(
    chamber: Chamber,
    volumeMl: number,
    internal: ChamberInternal,
    chamberCtx: ChamberCtx,
  ): number {
    const provider = this.activeProvider(chamber);
    if (provider?.passivePressure) {
      return provider.passivePressure(this.activeCall(chamber, volumeMl, internal, chamberCtx));
    }
    return this.activeModel(chamber).passivePressure(volumeMl, chamberCtx);
  }

  private activeInternalDerivatives(
    chamber: Chamber,
    volumeMl: number,
    internal: ChamberInternal,
    chamberCtx: ChamberCtx,
  ): ChamberInternalDerivatives {
    const provider = this.activeProvider(chamber);
    return provider
      ? provider.internalDerivatives(this.activeCall(chamber, volumeMl, internal, chamberCtx))
      : this.activeModel(chamber).internalDerivatives(volumeMl, internal, chamberCtx);
  }

  private activeDebugPressureTerms(
    chamber: Chamber,
    volumeMl: number,
    internal: ChamberInternal,
    chamberCtx: ChamberCtx,
  ): ChamberPressureTerms {
    const provider = this.activeProvider(chamber);
    const call = provider ? this.activeCall(chamber, volumeMl, internal, chamberCtx) : undefined;
    if (provider?.debugPressureTerms) {
      return provider.debugPressureTerms(call!);
    }
    if (provider?.sourceActiveStressPa) {
      return this.activeModel(chamber).debugPressureTermsFromActiveFiberStress(
        volumeMl,
        internal,
        chamberCtx,
        provider.sourceActiveStressPa(call!),
      );
    }
    return this.activeModel(chamber).debugPressureTerms(volumeMl, internal, chamberCtx);
  }

  private activeDebugStressTerms(
    chamber: Chamber,
    volumeMl: number,
    internal: ChamberInternal,
    chamberCtx: ChamberCtx,
  ): ActiveStressDebugTerms {
    const provider = this.activeProvider(chamber);
    if (provider?.debugActiveStressTerms) {
      return provider.debugActiveStressTerms(this.activeCall(chamber, volumeMl, internal, chamberCtx));
    }
    if (provider?.sourceActiveStressPa) {
      throw new Error(`Experimental source-only provider ${provider.sourceProviderId} must define source-specific debugActiveStressTerms.`);
    }
    return this.activeModel(chamber).debugActiveStressTerms(volumeMl, internal, chamberCtx);
  }

  private validateExperimentalActiveSourceProviders(): void {
    for (const [chamber, provider] of Object.entries(this.experimentalActiveSourceProviders) as Array<[Chamber, ModelCoreExperimentalActiveSourceProvider | undefined]>) {
      if (!provider?.sourceActiveStressPa) continue;
      const forbiddenMethods = [
        provider.pressure ? "pressure" : "",
        provider.passivePressure ? "passivePressure" : "",
        provider.debugPressureTerms ? "debugPressureTerms" : "",
      ].filter(Boolean);
      if (forbiddenMethods.length > 0) {
        throw new Error(
          `Experimental source-only provider ${provider.sourceProviderId} for ${chamber} must not define `
          + `${forbiddenMethods.join(", ")} when sourceActiveStressPa is present.`,
        );
      }
      if (!provider.debugActiveStressTerms) {
        throw new Error(`Experimental source-only provider ${provider.sourceProviderId} for ${chamber} must define source-specific debugActiveStressTerms.`);
      }
    }
  }

  private effectiveAorticBoundaryRootInertance(baseAoVL: number): number {
    const additional = this.experimentalBoundaryRootInertance?.additionalAorticRootInertanceMmHgSec2PerMl ?? 0;
    return Math.max(baseAoVL + additional, 1e-6);
  }

  private applyValveDiodeConstraint(valveName: ValveName, qNext: number, openness01: number): number {
    const smoothing = this.experimentalValveDiodeSmoothing;
    if (smoothing?.targetValves.includes(valveName)) {
      const opennessScale = smoothing.opennessScaledReverseFlow
        ? smoothstep01(openness01)
        : 1;
      const floor = -Math.max(smoothing.reverseFlowLimitMlPerSec, 1e-9) * opennessScale;
      const epsilon = Math.max(smoothing.smoothingEpsilonMlPerSec ?? 0.1, 1e-9);
      const qLimited = smoothMax(qNext, floor, epsilon);
      if (qLimited > qNext + 1e-9) {
        this.valveDiodeClampHits[valveName] = (this.valveDiodeClampHits[valveName] ?? 0) + 1;
      }
      return qLimited;
    }
    this.valveDiodeClampHits[valveName] = (this.valveDiodeClampHits[valveName] ?? 0) + 1;
    return 0;
  }

  private resetExperimentalActiveProviderStates(): void {
    for (const chamber of Object.keys(this.experimentalActiveSourceProviderStates) as Chamber[]) {
      delete this.experimentalActiveSourceProviderStates[chamber];
      delete this.experimentalActiveSourceProviderStateVersions[chamber];
    }
    for (const [chamber, provider] of Object.entries(this.experimentalActiveSourceProviders) as Array<[Chamber, ModelCoreExperimentalActiveSourceProvider | undefined]>) {
      if (!provider) continue;
      const initialState = provider.initialProviderState
        ? provider.initialProviderState({ chamber, activeModel: this.activeModel(chamber) })
        : undefined;
      this.experimentalActiveSourceProviderStates[chamber] = this.cloneExperimentalActiveProviderState(
        provider,
        initialState,
        `${chamber}.initialProviderState`,
      );
      this.experimentalActiveSourceProviderStateVersions[chamber] = 0;
    }
  }

  private cloneExperimentalActiveProviderState(
    provider: ModelCoreExperimentalActiveSourceProvider,
    state: unknown,
    label: string,
  ): unknown {
    if (state === null || state === undefined) return state;
    const stateType = typeof state;
    if (stateType !== "object") return state;
    if (provider.cloneProviderState) return provider.cloneProviderState(state);
    if (state instanceof Float64Array) return Float64Array.from(state);
    if (Array.isArray(state)) {
      return state.map((value, index) => this.cloneExperimentalActiveProviderState(provider, value, `${label}[${index}]`));
    }
    if (Object.getPrototypeOf(state) === Object.prototype) {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(state as Record<string, unknown>)) {
        out[key] = this.cloneExperimentalActiveProviderState(provider, value, `${label}.${key}`);
      }
      return out;
    }
    throw new Error(`Stateful active source provider ${provider.sourceProviderId} must define cloneProviderState for ${label}`);
  }

  private snapshotExperimentalActiveProviderStates(): Partial<Record<Chamber, { state: unknown; version: number }>> {
    const out: Partial<Record<Chamber, { state: unknown; version: number }>> = {};
    for (const [chamber, provider] of Object.entries(this.experimentalActiveSourceProviders) as Array<[Chamber, ModelCoreExperimentalActiveSourceProvider | undefined]>) {
      if (!provider) continue;
      out[chamber] = {
        state: this.cloneExperimentalActiveProviderState(
          provider,
          this.experimentalActiveSourceProviderStates[chamber],
          `${chamber}.snapshotProviderState`,
        ),
        version: this.experimentalActiveSourceProviderStateVersions[chamber] ?? 0,
      };
    }
    return out;
  }

  private restoreExperimentalActiveProviderStates(snapshot: Partial<Record<Chamber, { state: unknown; version: number }>>): void {
    for (const chamber of Object.keys(this.experimentalActiveSourceProviderStates) as Chamber[]) {
      delete this.experimentalActiveSourceProviderStates[chamber];
      delete this.experimentalActiveSourceProviderStateVersions[chamber];
    }
    for (const [chamber, provider] of Object.entries(this.experimentalActiveSourceProviders) as Array<[Chamber, ModelCoreExperimentalActiveSourceProvider | undefined]>) {
      if (!provider) continue;
      const entry = snapshot[chamber];
      this.experimentalActiveSourceProviderStates[chamber] = entry
        ? this.cloneExperimentalActiveProviderState(provider, entry.state, `${chamber}.restoreProviderState`)
        : undefined;
      this.experimentalActiveSourceProviderStateVersions[chamber] = entry?.version ?? 0;
    }
  }

  private hasExperimentalActiveProviderStateCommit(): boolean {
    return Object.values(this.experimentalActiveSourceProviders)
      .some((provider) => provider?.commitProviderStateAfterStep !== undefined);
  }

  private commitExperimentalActiveProviderStates(
    stepDtSec: number,
    beforeT: number,
    beforeX: Float64Array,
  ): void {
    const providerStateSnapshot = this.snapshotExperimentalActiveProviderStates();
    const nextSnapshot = this.computeExperimentalActiveProviderStateCommits(
      stepDtSec,
      beforeT,
      beforeX,
      this.t,
      this.x,
      null,
      providerStateSnapshot,
    );
    this.restoreExperimentalActiveProviderStates(nextSnapshot);
  }

  private computeExperimentalActiveProviderStateCommits(
    stepDtSec: number,
    beforeT: number,
    beforeX: Float64Array,
    afterT: number,
    afterX: Float64Array,
    chamberFilter: Set<Chamber> | null = null,
    providerStateSnapshot = this.snapshotExperimentalActiveProviderStates(),
  ): Partial<Record<Chamber, { state: unknown; version: number }>> {
    const nextSnapshot: Partial<Record<Chamber, { state: unknown; version: number }>> = {};
    for (const [chamber, entry] of Object.entries(providerStateSnapshot) as Array<[Chamber, { state: unknown; version: number } | undefined]>) {
      if (!entry) continue;
      nextSnapshot[chamber] = {
        state: this.cloneExperimentalActiveProviderState(
          this.experimentalActiveSourceProviders[chamber]!,
          entry.state,
          `${chamber}.computeCommitSnapshotBase`,
        ),
        version: entry.version,
      };
    }
    const pendingStates: Array<{ chamber: Chamber; state: unknown; version: number }> = [];
    for (const [chamber, provider] of Object.entries(this.experimentalActiveSourceProviders) as Array<[Chamber, ModelCoreExperimentalActiveSourceProvider | undefined]>) {
      if (!provider?.commitProviderStateAfterStep) continue;
      if (chamberFilter && !chamberFilter.has(chamber)) continue;
      const previousSnapshot = providerStateSnapshot[chamber];
      const previousProviderState = previousSnapshot
        ? this.cloneExperimentalActiveProviderState(provider, previousSnapshot.state, `${chamber}.commitProviderState`)
        : undefined;
      const previousProviderStateVersion = previousSnapshot?.version ?? 0;
      const nextProviderState = provider.commitProviderStateAfterStep({
        chamber,
        activeModel: this.activeModel(chamber),
        stepDtSec,
        previousProviderState,
        previousProviderStateVersion,
        beforeStep: this.activeProviderStepSnapshot(chamber, beforeX, beforeT),
        afterStep: this.activeProviderStepSnapshot(chamber, afterX, afterT),
      });
      pendingStates.push({
        chamber,
        state: this.cloneExperimentalActiveProviderState(
          provider,
          nextProviderState,
          `${chamber}.committedProviderState`,
        ),
        version: previousProviderStateVersion + 1,
      });
    }
    for (const pending of pendingStates) {
      nextSnapshot[pending.chamber] = {
        state: pending.state,
        version: pending.version,
      };
    }
    return nextSnapshot;
  }

  private activeProviderStepSnapshot(
    chamber: Chamber,
    x: Float64Array,
    tSec: number,
  ): ModelCoreActiveSourceProviderStepSnapshot {
    const pack = this.computePressures(x);
    const nodeIndex = this.nodeIndex.get(chamber)!;
    const rawVolumeMl = pack.Vphys[nodeIndex];
    const effectiveVolumeMl = chamber === "LV"
      ? pack.VLVeff
      : chamber === "RV"
        ? pack.VRVeff
        : rawVolumeMl;
    return {
      tSec,
      phi: x[this.idx.phi],
      rawVolumeMl,
      effectiveVolumeMl,
      internal: this.activeInternalFromState(chamber, x),
      chamberCtx: this.chamberCtx(chamber, x),
    };
  }

  private ventricularElastanceSignals(
    chamber: "LV" | "RV",
    effectiveVolumeMl: number,
    transmuralPressureMmHg: number,
    x: Float64Array,
  ): { active: number; timeVarying: number } {
    const node = this.nodes[this.nodeIndex.get(chamber)!];
    const unstressedVolume = node.V0 ?? 0;
    const distendingVolume = Math.max(effectiveVolumeMl - unstressedVolume, 1);
    const active = Math.max(transmuralPressureMmHg, 0) / distendingVolume;
    const fallbackPressure = this.elastanceModels
      .get(chamber)!
      .pressure(effectiveVolumeMl, { c: 0, a: 0, r: 0, tensionPa: 0 }, this.chamberCtx(chamber, x));
    return {
      active,
      timeVarying: Math.max(fallbackPressure, 0) / distendingVolume,
    };
  }

  private rebuildActiveModels() {
    for (const ch of Object.keys(this.activeModels) as Chamber[]) delete this.activeModels[ch];
    for (const n of this.activeChamberNodes()) {
      const active = n.chamber === "LA" ? n.active! : { ...n.active!, reservoirBranchGain: 0, reservoirStrokeMl: 0 };
      this.activeModels[n.chamber!] = new ActiveStressChamberModel(active);
    }
  }

  /** (Re)build per-node elastance models from current node params. */
  private rebuildElastanceModels() {
    this.elastanceModels.clear();
    for (const n of this.nodes) {
      if (n.kind === "heartElastance" || n.kind === "heartActive") {
        this.elastanceModels.set(n.name, new ElastanceChamberModel({
          V0: n.V0 ?? 0,
          alpha: n.alpha ?? 0.015,
          beta: n.beta ?? 0.5,
          Ees: n.Ees ?? 1.0,
          chamber: n.chamber ?? "LV",
        }));
      }
    }
  }

  private venousCompliance(n: NodeSpec, Ptm: number): number {
    const c = (n.Ccoll ?? 5)
      + ((n.Copen ?? 50) - (n.Ccoll ?? 5)) * sigmoid((Ptm - (n.Popen ?? -1)) / Math.max(n.dOpen ?? 1, 1e-6))
      - ((n.Copen ?? 50) - (n.Cdist ?? 15)) * sigmoid((Ptm - (n.Pstiff ?? 14)) / Math.max(n.dStiff ?? 3, 1e-6));
    return Math.max(c, 1e-4);
  }

  private venousStressedVolume(n: NodeSpec, Ptm: number): number {
    const Ccoll = n.Ccoll ?? 5;
    const Copen = n.Copen ?? 50;
    const Cdist = n.Cdist ?? 15;
    const Popen = n.Popen ?? -1;
    const Pstiff = n.Pstiff ?? 14;
    const dOpen = n.dOpen ?? 1;
    const dStiff = n.dStiff ?? 3;
    return Ccoll * Ptm
      + (Copen - Ccoll) * dOpen * (softplus((Ptm - Popen) / dOpen) - softplus((0 - Popen) / dOpen))
      - (Copen - Cdist) * dStiff * (softplus((Ptm - Pstiff) / dStiff) - softplus((0 - Pstiff) / dStiff));
  }

  private venousVolumeFromPtm(n: NodeSpec, Ptm: number, params: CoreRuntimeParams = this.p): number {
    return this.effectiveVu(n, params) + this.venousStressedVolume(n, Ptm);
  }

  private venousVolumeBounds(n: NodeSpec): { min: number; max: number } {
    return {
      min: this.venousVolumeFromPtm(n, -20),
      max: this.venousVolumeFromPtm(n, 45),
    };
  }

  private venousPtmFromVolume(n: NodeSpec, targetVolume: number): number {
    const targetStressed = targetVolume - this.effectiveVu(n);
    let lo = -20;
    let hi = 45;
    const volumeAt = (ptm: number) => this.venousStressedVolume(n, ptm);
    if (targetStressed <= volumeAt(lo)) return lo;
    if (targetStressed >= volumeAt(hi)) return hi;
    for (let iter = 0; iter < 32; iter++) {
      const mid = 0.5 * (lo + hi);
      if (volumeAt(mid) < targetStressed) lo = mid;
      else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  private downstreamEffective(e: EdgeSpec, Pd: number): number {
    if (!e.waterfall) return Pd;
    const Pcoll = this.externalPressure(e.ext ?? "none") + (e.Pcrit ?? 0);
    return smoothMax(Pd, Pcoll, 0.25);
  }

  private effectiveLosses(e: EdgeSpec, Pu: number, Pd: number, x: Float64Array): { R: number; B: number; areaRatio: number } {
    let R = e.R;
    let B = e.B ?? 0;
    let areaRatio = 1.0;
    if (e.group === "systemic") R *= this.p.systemicResistance;
    if (e.group === "pulmonary") R *= this.p.pulmonaryResistance;
    if (e.group === "coronary") {
      if (!this.p.coronaryEnabled) {
        R *= 1e8;
        B = 0;
      } else {
        const segment = e.coronarySegment;
        if (segment !== "sinus") R *= this.p.coronaryResistanceScale;

        if (e.coronaryTerritory && (segment === "proximal" || segment === "distal")) {
          const spec = CORONARY_SPECS[e.coronaryTerritory];
          const activation = this.coronaryCompressionActivation(e.coronaryTerritory, x);
          const k = segment === "proximal" ? spec.proximalCompressionK : spec.distalCompressionK;
          R *= 1 + this.p.coronaryCompressionScale * k * activation;

          const reserve = 1 + (Math.max(this.p.coronaryReserveMax, 1) - 1) * clamp(this.p.coronaryVasodilator, 0, 1);
          R /= Math.max(reserve, 1e-6);
        }

        if (e.coronaryTerritory && segment === "ostial") {
          const spec = CORONARY_SPECS[e.coronaryTerritory];
          const diameterStenosis = clamp(this.p[spec.stenosisKey], 0, 0.95);
          const diameterRatio = Math.max(1 - diameterStenosis, 0.05);
          const stenosisAreaRatio = Math.max(diameterRatio * diameterRatio, 0.0025);
          const stenosisLoss = Math.min(Math.pow(stenosisAreaRatio, -2), 5000);
          R *= stenosisLoss;
          B += 0.06 * (stenosisLoss - 1);
          areaRatio = Math.min(areaRatio, stenosisAreaRatio);
        }
      }
    }

    if (e.kind === "valve") {
      const pName = e.name as ValveName;
      const vAmax = (this.p as any)[`${pName}_Amax`] ?? e.Amax ?? 1;
      const vAref = (this.p as any)[`${pName}_Aref`] ?? e.Aref ?? vAmax;
      const vAleak = (this.p as any)[`${pName}_Aleak`] ?? e.Aleak ?? 1e-4;
      const vR = (this.p as any)[`${pName}_R`] ?? e.R;
      const vB = (this.p as any)[`${pName}_B`] ?? e.B ?? 0;
      const xi = clamp(x[this.idx.xi[pName]], 0, 1);
      const valveArea = Math.max(vAleak + xi * (vAmax - vAleak), 1e-4);
      areaRatio = valveArea / Math.max(vAref, 1e-6);
      const areaLoss = Math.pow(Math.max(areaRatio, 1e-4), -2);
      R = vR * areaLoss;
      B = vB * areaLoss;
    } else if ((e.useChiResistance || e.useChiQuadratic) && this.p.useChiResistance) {
      const chi = this.edgeChi(e, Pu, Pd);
      areaRatio = chi;
      if (e.useChiResistance) R = R * Math.pow(chi, -(e.chiRExp ?? 2));
      if (e.useChiQuadratic) B = B * Math.pow(chi, -(e.chiBExp ?? 2));
    }
    return { R: Math.max(R, 1e-8), B: Math.max(B, 0), areaRatio };
  }

  private coronaryCompressionActivation(territory: CoronaryTerritory, x: Float64Array): number {
    const lvA = clamp(x[this.activeInternalIndex("LV").a], 0, 1);
    const rvA = clamp(x[this.activeInternalIndex("RV").a], 0, 1);
    if (territory === "RCA") return clamp(0.45 * lvA + 0.55 * rvA, 0, 1);
    return lvA;
  }

  private edgeChi(e: EdgeSpec, Pu: number, Pd: number): number {
    const Pext = this.externalPressure(e.ext ?? "none");
    const Ptube = smoothMin(Pu - Pext, Pd - Pext, 0.25);
    const z = (Ptube - (e.Pcrit ?? 0)) / Math.max(e.chiWidth ?? 1, 1e-6);
    const chiMin = e.chiMin ?? 0.08;
    return chiMin + (1 - chiMin) * sigmoid(z);
  }

  private externalPressure(ext: ExtKind, coronaryExt?: CoronaryExternalPressures): number {
    if (ext === "pth") return this.Pth();
    if (ext === "palv") return this.Palv();
    if (ext === "imLAD") return coronaryExt?.imLAD ?? this.Pth();
    if (ext === "imLCx") return coronaryExt?.imLCx ?? this.Pth();
    if (ext === "imRCA") return coronaryExt?.imRCA ?? this.Pth();
    if (ext === "imLADVen") return coronaryExt?.imLADVen ?? this.Pth();
    if (ext === "imLCxVen") return coronaryExt?.imLCxVen ?? this.Pth();
    if (ext === "imRCAVen") return coronaryExt?.imRCAVen ?? this.Pth();
    return 0;
  }

  private coronaryExternalPressures(Pperi: number, PLVtm: number, PRVtm: number): CoronaryExternalPressures {
    const scale = Math.max(this.p.coronaryCompressionScale, 0);
    const lv = Math.max(PLVtm, 0);
    const rv = Math.max(PRVtm, 0);
    const full = (territory: CoronaryTerritory) => {
      const spec = CORONARY_SPECS[territory];
      return Pperi + scale * (spec.gammaLv * lv + spec.gammaRv * rv);
    };
    const ven = (territory: CoronaryTerritory) => {
      const spec = CORONARY_SPECS[territory];
      return Pperi + scale * spec.venousExternalFraction * (spec.gammaLv * lv + spec.gammaRv * rv);
    };
    return {
      imLAD: full("LAD"),
      imLCx: full("LCx"),
      imRCA: full("RCA"),
      imLADVen: ven("LAD"),
      imLCxVen: ven("LCx"),
      imRCAVen: ven("RCA"),
    };
  }

  private Pth(): number {
    return this.p.Pth0 + 0.20 * this.p.PEEP + this.p.respAmpTh * Math.sin(2 * Math.PI * this.p.respRate * this.t);
  }

  private Palv(): number {
    return this.p.PEEP + this.p.respAmpAlv * Math.sin(2 * Math.PI * this.p.respRate * this.t);
  }

  private effectiveVu(n: NodeSpec, params: CoreRuntimeParams = this.p): number {
    return (n.Vu ?? 0) - (n.venousToneGain ?? 0) * params.venousTone;
  }

  private smoothParams(dt: number) {
    const tau = 0.25;
    const alpha = dt === 0 ? 1 : (1 - Math.exp(-dt / tau));
    const nums: (keyof CoreRuntimeParams)[] = [
      "HR", "contractility", "relaxation", "systemicResistance", "pulmonaryResistance",
      "venousTone", "arterialStiffness", "PEEP", "Pth0", "respAmpTh", "respAmpAlv",
      "speed", "avDelaySec", "atrialElectromechanicalDelaySec", "ventricularElectromechanicalDelaySec",
      "lvTmaxScale", "rvTmaxScale",
      "lvGeomScale", "rvGeomScale", "caReleaseScale", "rvCaReleaseScale",
      "pericardialPressureScaleMmHg", "pericardialSlackVolumeMl",
      "pericardialVolumeScaleMl", "pericardialSoftnessMl",
      "pericardialBiasMmHg", "pericardialFluidMl",
      "septalStiffnessScale", "septalK1MmHgPerMl", "septalK3MmHgPerMl3",
      "septalDampingMmHgSecPerMl", "septalMaxShiftMl", "septalLvPressureWeight",
      "coronaryResistanceScale", "coronaryCompressionScale", "coronaryVasodilator",
      "coronaryReserveMax", "LADStenosis", "LCxStenosis", "RCAStenosis",
    ];
    for (const k of nums) {
      const current = this.p[k];
      const target = this.pTarget[k];
      if (typeof current === "number" && typeof target === "number") {
        (this.p[k] as number) = current + alpha * (target - current);
      }
    }
    this.p.heartModel = this.pTarget.heartModel;
    this.p.useChiResistance = this.pTarget.useChiResistance;
    this.p.pericardiumEnabled = this.pTarget.pericardiumEnabled;
    this.p.septalCouplingEnabled = this.pTarget.septalCouplingEnabled;
    this.p.coronaryEnabled = this.pTarget.coronaryEnabled;
    // Rates are not smoothed but must be copied from the target so the
    // setTargetParameters() API path works, not just setImmediateParameters().
    this.p.bleedRate = this.pTarget.bleedRate;
    this.p.fluidRate = this.pTarget.fluidRate;
    // Hard clamps sourced from the SHARED protocol.HARD_CLAMP table, so the
    // integrated parameter set is exactly what sanitizeParams() produced — no
    // divergent re-clamp that would silently move deep-scale / rate edits.
    for (const k of RUNTIME_CLAMP_KEYS) {
      const r = HARD_CLAMP[k];
      if (r && typeof this.p[k] === "number") (this.p[k] as number) = clamp(this.p[k] as number, r[0], r[1]);
    }
  }

  private sanitizeState(x: Float64Array) {
    for (const name of nodeNames) {
      const n = this.nodes[this.nodeIndex.get(name)!];
      const ix = this.idx.node[name];
      const before = x[ix];
      if (n.kind === "venousPressure") {
        const bounds = this.venousVolumeBounds(n);
        x[ix] = clamp(x[ix], bounds.min, bounds.max);
      } else if (n.kind === "heartActive" || n.kind === "heartElastance") {
        x[ix] = clamp(x[ix], 3, 450);
      } else {
        x[ix] = clamp(x[ix], 1, 3000);
      }
      if (Math.abs(x[ix] - before) > 1e-9) {
        const delta = x[ix] - before;
        if (this.clampHitCount < 10) console.warn(`Clamp hit on node ${name}: from ${before.toFixed(3)} to ${x[ix].toFixed(3)} at t=${this.t.toFixed(3)}`);
        this.clampHitCount++;
        this.nodeClampHits[name] = (this.nodeClampHits[name] ?? 0) + 1;
        addNodeVolumeDelta(this.sanitizeLastStepAudit, name, delta);
        addNodeVolumeDelta(this.sanitizeCurrentBeatAudit, name, delta);
      }
    }
    for (const e of dynamicEdgeNames) {
      const ix = this.idx.q[e];
      const before = x[ix];
      x[ix] = e === "AoV"
        ? this.applyAorticFlowClamp(x[ix])
        : clamp(x[ix], -DYNAMIC_FLOW_CLAMP_ML_PER_S, DYNAMIC_FLOW_CLAMP_ML_PER_S);
      if (Math.abs(x[ix] - before) > 1e-9) {
        this.dynamicFlowClampHits[e] = (this.dynamicFlowClampHits[e] ?? 0) + 1;
      }
    }
    for (const v of valveNames) x[this.idx.xi[v]] = clamp(x[this.idx.xi[v]], 0, 1);
    x[this.idx.phi] = x[this.idx.phi] > 1e6 ? frac(x[this.idx.phi]) : x[this.idx.phi];
    x[this.idx.septumShift] = clampSeptalShift(x[this.idx.septumShift], {
      VLV: clamp(x[this.idx.node.LV], 1, 1000),
      VRV: clamp(x[this.idx.node.RV], 1, 1000),
      V0LV: this.nodes[this.nodeIndex.get("LV")!].V0 ?? 0,
      V0RV: this.nodes[this.nodeIndex.get("RV")!].V0 ?? 0,
    }, this.septumParams());
    for (const active of Object.values(this.idx.activeInternal)) {
      if (!active) continue;
      x[active.c] = clamp(x[active.c], 0, 5);
      x[active.a] = clamp(x[active.a], 0, 1);
      x[active.r] = clamp(x[active.r], 0, this.maxActiveInternalRForInternal(active));
      x[active.tensionPa] = clamp(x[active.tensionPa], 0, 500000);
      x[active.lambdaAct] = clamp(x[active.lambdaAct], 0.25, 2.5);
    }
  }

  private maxActiveInternalRForInternal(active: { c: number; a: number; r: number; tensionPa: number; lambdaAct: number }): number {
    for (const [ch, idx] of Object.entries(this.idx.activeInternal) as [Chamber, { c: number; a: number; r: number; tensionPa: number; lambdaAct: number }][]) {
      if (idx?.r !== active.r) continue;
      const ap = this.activeModels[ch]?.ap;
      if (!ap) return 0;
      const reservoirStroke = Math.max(ap.reservoirStrokeMl ?? 0, 0);
      const reservoirGain = Math.max(ap.reservoirBranchGain ?? 0, 0);
      const statefulAvPlaneRelease = Math.max(ap.avPlaneGainMl ?? 0, 0) > 0
        && reservoirStroke <= 0
        && reservoirGain <= 0
        && (Math.max(ap.avPlaneDescentRiseTauSec ?? 0, 0) > 0
          || Math.max(ap.avPlaneDescentReleaseTauSec ?? 0, 0) > 0);
      return statefulAvPlaneRelease ? 1 : reservoirStroke;
    }
    return 0;
  }

  private dynamicFlowValue(edge: DynamicEdgeName, value: number): number {
    if (edge !== "AoV") return clamp(value, -DYNAMIC_FLOW_CLAMP_ML_PER_S, DYNAMIC_FLOW_CLAMP_ML_PER_S);
    const local = localAorticFlowClampShape(this.aorticFlowClampMode);
    return local
      ? this.applyLocalizedAorticFlowClamp(value, local)
      : this.applyAorticFlowClamp(value);
  }

  private currentLossQNext(q: number, dP: number, R: number, B: number, L: number, h: number): number {
    const Reff = R + B * Math.abs(q);
    return (q + (h / L) * dP) / (1 + (h * Reff) / L);
  }

  private qNextConsistentLossQNext(q: number, dP: number, R: number, B: number, L: number, h: number): number {
    const a = Math.max(B, 0);
    const b = Math.max(R + L / h, 1e-9);
    const c = -((L / h) * q + dP);
    if (a < 1e-12) return -c / b;
    const disc = Math.max(0, b * b - 4 * a * c);
    return (-b + Math.sqrt(disc)) / (2 * a);
  }

  private aorticValveQNext(q: number, dP: number, R: number, B: number, L: number, h: number): number {
    if (this.aorticValveQUpdateMode === "qnext-loss") {
      return this.qNextConsistentLossQNext(q, dP, R, B, L, h);
    }
    const substeps = this.aorticValveQUpdateMode === "substep-2"
      ? 2
      : this.aorticValveQUpdateMode === "substep-4"
        ? 4
        : 1;
    if (substeps <= 1) return this.currentLossQNext(q, dP, R, B, L, h);
    let qSub = q;
    const hs = h / substeps;
    for (let i = 0; i < substeps; i++) {
      qSub = this.currentLossQNext(qSub, dP, R, B, L, hs);
    }
    return qSub;
  }

  private applyAorticFlowClamp(value: number): number {
    const limit = DYNAMIC_FLOW_CLAMP_ML_PER_S;
    if (this.aorticFlowClampMode === "hard" || value <= 0) return clamp(value, -limit, limit);
    const positive = Math.min(Math.max(value, 0), limit * 50);
    if (this.aorticFlowClampMode === "soft-tanh") return limit * Math.tanh(positive / limit);
    if (this.aorticFlowClampMode === "soft-rational") return positive / (1 + positive / limit);
    return clamp(value, -limit, limit);
  }

  private applyLocalizedAorticFlowClamp(value: number, local: LocalAorticFlowClampShape): number {
    if (value <= 0) return clamp(value, -DYNAMIC_FLOW_CLAMP_ML_PER_S, DYNAMIC_FLOW_CLAMP_ML_PER_S);
    const positive = Math.min(Math.max(value, 0), DYNAMIC_FLOW_CLAMP_ML_PER_S * 50);
    return localizedAorticFlowClamp(
      positive,
      DYNAMIC_FLOW_CLAMP_ML_PER_S,
      local.identityFraction,
      local.smoothness,
    );
  }

  private correctVenousPressuresToExpectedTBV(options: {
    gain?: number;
    maxTotalCorrectionMl?: number;
    maxNodeVolumeMl?: number;
  } = {}): void {
    if (!Number.isFinite(this.expectedTBV) || this.expectedTBV <= 0) return;
    const pack = this.computePressures(this.x);
    const currentTBV = this.totalBloodVolume(pack);
    const error = this.expectedTBV - currentTBV;
    const resolvedOptions = { ...(this.tbvCorrectionOptions ?? {}), ...options };
    const gain = resolvedOptions.gain ?? 0.35;
    const maxTotal = resolvedOptions.maxTotalCorrectionMl ?? 0.25;
    const correction = clamp(error * gain, -maxTotal, maxTotal);
    this.tbvCorrectionLastStepMl = Math.abs(correction);
    const stepAudit = emptyTBVProjectionAudit();
    stepAudit.requestedMl = correction;
    stepAudit.lastBeforeTBVMl = currentTBV;
    stepAudit.lastExpectedTBVMl = this.expectedTBV;
    stepAudit.lastErrorBeforeMl = error;
    this.tbvProjectionLastStepAudit = stepAudit;
    this.tbvProjectionCurrentBeatAudit.requestedMl += correction;
    this.tbvProjectionCurrentBeatAudit.lastBeforeTBVMl = currentTBV;
    this.tbvProjectionCurrentBeatAudit.lastExpectedTBVMl = this.expectedTBV;
    this.tbvProjectionCurrentBeatAudit.lastErrorBeforeMl = error;
    if (Math.abs(correction) < 1e-9) {
      stepAudit.lastAfterTBVMl = currentTBV;
      stepAudit.lastErrorAfterMl = error;
      this.tbvProjectionCurrentBeatAudit.lastAfterTBVMl = currentTBV;
      this.tbvProjectionCurrentBeatAudit.lastErrorAfterMl = error;
      return;
    }

    const entries = tbvCorrectionNodeNames.map((name) => {
      const node = this.nodes[this.nodeIndex.get(name)!];
      const ix = this.idx.node[name];
      const volume = pack.Vphys[this.nodeIndex.get(name)!];
      const compliance = this.venousCompliance(node, pack.Ptm[this.nodeIndex.get(name)!]);
      const bounds = this.venousVolumeBounds(node);
      return { node, ix, volume, compliance, bounds };
    });
    let applied = 0;
    let remaining = correction;
    const maxNode = resolvedOptions.maxNodeVolumeMl ?? 0.1;
    for (let iter = 0; iter < entries.length && Math.abs(remaining) > 1e-9; iter++) {
      const candidates = entries.filter((e) => {
        if (remaining > 0) return this.x[e.ix] < e.bounds.max - 1e-9;
        return this.x[e.ix] > e.bounds.min + 1e-9;
      });
      const volumeTotal = candidates.reduce((sum, e) => sum + Math.max(e.volume, 0), 0);
      const complianceTotal = candidates.reduce((sum, e) => sum + Math.max(e.compliance, 0), 0);
      const denom = volumeTotal > 1e-9 ? volumeTotal : complianceTotal;
      if (denom <= 1e-9) break;

      let iterApplied = 0;
      for (const e of candidates) {
        const rawWeight = volumeTotal > 1e-9 ? Math.max(e.volume, 0) : Math.max(e.compliance, 0);
        const share = remaining * (rawWeight / denom);
        const delta = clamp(share, -maxNode, maxNode);
        if (Math.abs(delta) < 1e-12) continue;
        const beforeVolume = this.x[e.ix];
        this.x[e.ix] = clamp(beforeVolume + delta, e.bounds.min, e.bounds.max);
        const appliedDelta = this.x[e.ix] - beforeVolume;
        iterApplied += appliedDelta;
        addProjectionNodeDelta(stepAudit, e.node.name as NodeName, appliedDelta);
        addProjectionNodeDelta(this.tbvProjectionCurrentBeatAudit, e.node.name as NodeName, appliedDelta);
      }
      applied += iterApplied;
      remaining -= iterApplied;
      if (Math.abs(iterApplied) < 1e-12) break;
    }
    const afterPack = this.computePressures(this.x);
    const afterTBV = this.totalBloodVolume(afterPack);
    const afterError = this.expectedTBV - afterTBV;
    this.tbvCorrectionLastStepMl = Math.abs(applied);
    this.tbvCorrectionMagThisBeat += Math.abs(applied);
    stepAudit.appliedMl = applied;
    stepAudit.absAppliedMl = Math.abs(applied);
    stepAudit.lastAfterTBVMl = afterTBV;
    stepAudit.lastErrorAfterMl = afterError;
    this.tbvProjectionCurrentBeatAudit.appliedMl += applied;
    this.tbvProjectionCurrentBeatAudit.absAppliedMl += Math.abs(applied);
    this.tbvProjectionCurrentBeatAudit.lastAfterTBVMl = afterTBV;
    this.tbvProjectionCurrentBeatAudit.lastErrorAfterMl = afterError;
  }

  /**
   * Read-only vascular return snapshot for structural Guyton maps. This does
   * not modify state or dynamics; it exposes the current vascular PV laws,
   * stressed volumes, external pressures, and local effective edge losses.
   */
  vascularReturnSnapshot(
    side: VascularReturnSnapshot["side"],
    options: VascularReturnSnapshotOptions = {},
  ): VascularReturnSnapshot {
    if (options.mode === "cycle-mean") {
      return this.cycleMeanVascularReturnSnapshot(side, options);
    }
    return this.instantVascularReturnSnapshot(side, {
      mode: "instant",
      sampleCount: 1,
      durationSeconds: 0,
    });
  }

  private instantVascularReturnSnapshot(
    side: VascularReturnSnapshot["side"],
    metadata: Pick<VascularReturnSnapshot, "mode" | "sampleCount" | "durationSeconds"> = {},
  ): VascularReturnSnapshot {
    const pack = this.computePressures(this.x);
    const nodePath = side === "right"
      ? (["VC", "SV", "Cap", "Art", "SA", "Ao"] as const)
      : (["PVein", "PVen", "PCap"] as const);
    const edgePath = side === "right"
      ? (["VC_RA", "SV_VC", "Cap_SV", "Art_Cap", "SA_Art", "Ao_SA"] as const)
      : (["PVein_LA", "PVen_PVein", "PCap_PVen"] as const);
    const nodes = nodePath.map((name) => this.vascularNodeSnapshot(name, pack));
    const edges = edgePath.map((name) => this.vascularEdgeSnapshot(name, pack));
    const totalStressedVolumeMl = nodes.reduce((sum, node) => sum + node.stressedVolumeMl, 0);
    const totalUnstressedVolumeMl = nodes.reduce((sum, node) => sum + node.unstressedVolumeMl, 0);
    const totalComplianceMlPerMmHg = nodes.reduce((sum, node) => sum + node.complianceEffMlPerMmHg, 0);
    const externalPressureWeightedMmHg = totalComplianceMlPerMmHg > 1e-9
      ? nodes.reduce((sum, node) => sum + node.complianceEffMlPerMmHg * node.Pext, 0) / totalComplianceMlPerMmHg
      : 0;
    return {
      side,
      downstreamNode: side === "right" ? "RA" : "LA",
      nodesDownstreamToUpstream: nodes,
      edgesDownstreamToUpstream: edges,
      totalStressedVolumeMl,
      totalUnstressedVolumeMl,
      totalComplianceMlPerMmHg,
      externalPressureWeightedMmHg,
      ...metadata,
    };
  }

  private cycleMeanVascularReturnSnapshot(
    side: VascularReturnSnapshot["side"],
    options: VascularReturnSnapshotOptions,
  ): VascularReturnSnapshot {
    const seconds = options.seconds ?? (60 / Math.max(this.p.HR, 1));
    const dt = options.dt ?? 0.001;
    const sampleHz = options.sampleHz ?? 120;
    if (!(seconds > 0) || !(dt > 0) || !(sampleHz > 0)) {
      throw new Error("cycle-mean vascular snapshot requires positive seconds, dt, and sampleHz");
    }

    const clone = this.cloneForReadOnlyMeasurement();
    const snapshots: VascularReturnSnapshot[] = [];
    const sampleInterval = 1 / sampleHz;
    let sampleAt = Math.floor((clone.t + 1e-9) / sampleInterval) * sampleInterval + sampleInterval;
    const tEnd = clone.t + seconds - 1e-9;
    while (clone.t < tEnd) {
      clone.step(dt);
      if (clone.t >= sampleAt) {
        snapshots.push(clone.instantVascularReturnSnapshot(side));
        sampleAt += sampleInterval;
      }
    }
    if (snapshots.length === 0) {
      throw new Error("cycle-mean vascular snapshot collected no samples");
    }
    return meanVascularReturnSnapshot(side, snapshots, seconds);
  }

  cloneForReadOnlyMeasurement(): ModelCore {
    const clone = new ModelCore(this.p, {
      activeSourceProviders: this.experimentalActiveSourceProviders,
      ...(this.experimentalBoundaryRootInertance
        ? { boundaryRootInertance: this.experimentalBoundaryRootInertance }
        : {}),
      ...(this.experimentalValveDiodeSmoothing
        ? { valveDiodeSmoothing: this.experimentalValveDiodeSmoothing }
        : {}),
      ...(this.experimentalGraphCoupledStep
        ? { graphCoupledStep: this.experimentalGraphCoupledStep }
        : {}),
      ...(this.experimentalCoupledBackwardEulerStep
        ? { coupledBackwardEulerStep: this.experimentalCoupledBackwardEulerStep }
        : {}),
      ...(this.experimentalVentricularChamberTransactionStep
        ? { ventricularChamberTransactionStep: this.experimentalVentricularChamberTransactionStep }
        : {}),
      ...(this.experimentalUnsupportedDiagnosticCoupledNewtonStep
        ? { unsupportedDiagnosticCoupledNewtonStep: this.experimentalUnsupportedDiagnosticCoupledNewtonStep }
        : {}),
      ...(this.experimentalTemporalSubstep
        ? { temporalSubstep: this.experimentalTemporalSubstep }
        : {}),
    });
    clone.pTarget = { ...this.pTarget };
    clone.unpackState(this.packState());
    clone.restoreExperimentalActiveProviderStates(this.snapshotExperimentalActiveProviderStates());
    return clone;
  }

  private vascularNodeSnapshot(name: NodeName, pack: PressurePack): VascularNodeSnapshot {
    const i = this.nodeIndex.get(name)!;
    const node = this.nodes[i];
    if (node.kind !== "arterial" && node.kind !== "linear" && node.kind !== "venousPressure") {
      throw new Error(`Node ${name} is not a vascular return node`);
    }
    const law = this.vascularPvLaw(node);
    const volumeMl = pack.Vphys[i];
    const unstressedVolumeMl = this.effectiveVu(node);
    return {
      name,
      kind: node.kind,
      Pabs: pack.P[i],
      Ptm: pack.Ptm[i],
      Pext: this.externalPressure(node.ext ?? "none"),
      volumeMl,
      unstressedVolumeMl,
      stressedVolumeMl: volumeMl - unstressedVolumeMl,
      complianceEffMlPerMmHg: complianceFromPtm(law, pack.Ptm[i]),
      law,
    };
  }

  private vascularEdgeSnapshot(name: string, pack: PressurePack): VascularEdgeSnapshot {
    const edge = this.edges[this.edgeIndex(name)];
    const up = this.nodeIndex.get(edge.up)!;
    const down = this.nodeIndex.get(edge.down)!;
    const losses = this.effectiveLosses(edge, pack.P[up], pack.P[down], this.x);
    return {
      name,
      up: edge.up,
      down: edge.down,
      R_mmHg_s_per_mL: losses.R,
      B_mmHg_s2_per_mL2: losses.B,
      waterfall: Boolean(edge.waterfall),
      Pext: this.externalPressure(edge.ext ?? "none"),
      Pcrit: edge.Pcrit ?? 0,
    };
  }

  private vascularPvLaw(node: NodeSpec): VascularPvLaw {
    const Vu = this.effectiveVu(node);
    if (node.kind === "arterial") {
      return {
        kind: "arterial",
        Vu,
        P0: node.P0 ?? 50,
        VsEff: Math.max((node.Vs ?? 100) / Math.max(this.p.arterialStiffness, 0.25), 1),
      };
    }
    if (node.kind === "linear") {
      return {
        kind: "linear",
        Vu,
        C: Math.max(node.C ?? 1, 1e-6),
      };
    }
    if (node.kind === "venousPressure") {
      return {
        kind: "venous3",
        Vu,
        Ccoll: node.Ccoll ?? 5,
        Copen: node.Copen ?? 50,
        Cdist: node.Cdist ?? 15,
        Popen: node.Popen ?? -1,
        Pstiff: node.Pstiff ?? 14,
        dOpen: Math.max(node.dOpen ?? 1, 1e-6),
        dStiff: Math.max(node.dStiff ?? 3, 1e-6),
      };
    }
    throw new Error(`Node ${node.name} has no vascular PV law`);
  }

  /**
   * Instantaneous Phase A observables (read-only). Pmsf uses the textbook
   * approximation: systemic-vascular stressed volume / total effective
   * compliance, over the systemic vasculature only (heart and pulmonary excluded).
   */
  debugObservables(): SimObservables {
    const pack = this.computePressures(this.x);
    const flows = this.computeFlows(this.x, pack);
    const systemic = ["Ao", "SA", "Art", "Cap", "SV", "VC"] as const;
    const pulmonaryVenous = ["PCap", "PVen", "PVein"] as const;
    let stressed = 0;
    let compliance = 0;
    let externalWeighted = 0;
    let unstressed = 0;
    let venStressed = 0;
    let venUnstressed = 0;
    let pulmonaryVenousStressed = 0;
    let pulmonaryVenousUnstressed = 0;
    let pulmonaryVenousCompliance = 0;
    let pulmonaryVenousExternalWeighted = 0;
    for (const name of systemic) {
      const i = this.nodeIndex.get(name)!;
      const n = this.nodes[i];
      const ptm = pack.Ptm[i];
      const vu = this.effectiveVu(n);
      unstressed += vu;
      let cEff = 0;
      if (n.kind === "venousPressure") {
        const s = pack.Vphys[i] - vu;
        stressed += s;
        cEff = this.venousCompliance(n, ptm);
        compliance += cEff;
        venStressed += s;
        venUnstressed += vu;
      } else if (n.kind === "arterial") {
        const VsEff = Math.max((n.Vs ?? 100) / Math.max(this.p.arterialStiffness, 0.25), 1);
        stressed += pack.Vphys[i] - vu;
        cEff = VsEff / Math.max((n.P0 ?? 50) + ptm, 1e-6);
        compliance += cEff;
      } else if (n.kind === "linear") {
        stressed += pack.Vphys[i] - vu;
        cEff = Math.max(n.C ?? 1, 1e-6);
        compliance += cEff;
      }
      externalWeighted += cEff * this.externalPressure(n.ext ?? "none");
    }
    for (const name of pulmonaryVenous) {
      const i = this.nodeIndex.get(name)!;
      const n = this.nodes[i];
      const ptm = pack.Ptm[i];
      const vu = this.effectiveVu(n);
      const cEff = n.kind === "venousPressure"
        ? this.venousCompliance(n, ptm)
        : Math.max(n.C ?? 1, 1e-6);
      pulmonaryVenousUnstressed += vu;
      pulmonaryVenousStressed += pack.Vphys[i] - vu;
      pulmonaryVenousCompliance += cEff;
      pulmonaryVenousExternalWeighted += cEff * this.externalPressure(n.ext ?? "none");
    }
    const Pmsf = compliance > 1e-9 ? stressed / compliance : 0;
    const systemicExternalPressureWeighted = compliance > 1e-9 ? externalWeighted / compliance : 0;
    const PmsfAbs = Pmsf + systemicExternalPressureWeighted;
    const Pmpf = pulmonaryVenousCompliance > 1e-9 ? pulmonaryVenousStressed / pulmonaryVenousCompliance : 0;
    const pulmonaryVenousExternalPressureWeighted = pulmonaryVenousCompliance > 1e-9
      ? pulmonaryVenousExternalWeighted / pulmonaryVenousCompliance
      : 0;
    const PmpfAbs = Pmpf + pulmonaryVenousExternalPressureWeighted;
    const RAP = pack.P[this.nodeIndex.get("RA")!];
    const LAP = pack.P[this.nodeIndex.get("LA")!];
    const RVP = pack.P[this.nodeIndex.get("RV")!];
    const PAP = pack.P[this.nodeIndex.get("PA")!];
    const P_VC = pack.P[this.nodeIndex.get("VC")!];
    const P_PVein = pack.P[this.nodeIndex.get("PVein")!];
    const qLAD = flows[this.edgeIndex("Ao_LAD")];
    const qLCx = flows[this.edgeIndex("Ao_LCx")];
    const qRCA = flows[this.edgeIndex("Ao_RCA")];
    const AoP = pack.P[this.nodeIndex.get("Ao")!];
    const actualTBV = this.totalBloodVolume(pack);
    const laReservoir = this.laReservoirDebugFields(this.x, pack.Vphys[this.nodeIndex.get("LA")!]);
    const pvOstial = this.pvOstialDebugFields(this.x, pack, flows);
    return {
      Pmsf,
      PmsfTm: Pmsf,
      PmsfAbs,
      vrGradient: Pmsf - RAP,
      RAP,
      stressedVolumeSystemic: stressed,
      unstressedVolumeSystemic: unstressed,
      systemicComplianceEff: compliance,
      systemicExternalPressureWeighted,
      venousStressedVolume: venStressed,
      venousUnstressedVolume: venUnstressed,
      pulmonaryVenousVolume: pulmonaryVenousStressed + pulmonaryVenousUnstressed,
      pulmonaryVenousStressedVolume: pulmonaryVenousStressed,
      pulmonaryVenousUnstressedVolume: pulmonaryVenousUnstressed,
      pulmonaryVenousComplianceEff: pulmonaryVenousCompliance,
      pulmonaryVenousExternalPressureWeighted,
      Pmpf,
      PmpfTm: Pmpf,
      PmpfAbs,
      pulmonaryVenousReturnGradient: PmpfAbs - LAP,
      pVeinVcGradient: P_PVein - P_VC,
      tbvCorrectionMagPerBeat: this.tbvCorrectionMagLastBeat,
      tbvCorrectionLastStepMl: this.tbvCorrectionLastStepMl,
      expectedTBV: this.expectedTBV,
      tbvErrorMl: this.expectedTBV - actualTBV,
      Pth: this.Pth(),
      Palv: this.Palv(),
      Q_VC_RA: flows[this.edgeIndex("VC_RA")],
      Q_TV: flows[this.edgeIndex("TV")],
      Q_PV: flows[this.edgeIndex("PV")],
      Q_PCap_PVen: flows[this.edgeIndex("PCap_PVen")],
      xiTV: clamp(this.x[this.idx.xi.TV], 0, 1),
      xiPV: clamp(this.x[this.idx.xi.PV], 0, 1),
      dP_TV: RAP - RVP,
      dP_PV: RVP - PAP,
      P_SV: pack.P[this.nodeIndex.get("SV")!],
      P_VC,
      P_PVen: pack.P[this.nodeIndex.get("PVen")!],
      P_PVein,
      Pperi: pack.Pperi,
      Ppc: pack.Ppc,
      VHeart: pack.VHeart,
      septumShiftMl: pack.septumShiftMl,
      VLVeff: pack.VLVeff,
      VRVeff: pack.VRVeff,
      PLVfw: pack.PLVfw,
      PRVfw: pack.PRVfw,
      PVI_LV: pack.PVI_LV,
      PVI_RV: pack.PVI_RV,
      septalForceMmHg: pack.septalForceMmHg,
      Q_LAD: qLAD,
      Q_LCx: qLCx,
      Q_RCA: qRCA,
      Q_Cor_total: qLAD + qLCx + qRCA,
      Q_CS_RA: flows[this.edgeIndex("CS_RA")],
      P_LAD_Art: pack.P[this.nodeIndex.get("LAD_Art")!],
      P_LCx_Art: pack.P[this.nodeIndex.get("LCx_Art")!],
      P_RCA_Art: pack.P[this.nodeIndex.get("RCA_Art")!],
      P_CS: pack.P[this.nodeIndex.get("CS")!],
      PimLAD: pack.PimLAD,
      PimLCx: pack.PimLCx,
      PimRCA: pack.PimRCA,
      FFR_LAD: AoP > 1e-9 ? pack.P[this.nodeIndex.get("LAD_Art")!] / AoP : 0,
      FFR_LCx: AoP > 1e-9 ? pack.P[this.nodeIndex.get("LCx_Art")!] / AoP : 0,
      FFR_RCA: AoP > 1e-9 ? pack.P[this.nodeIndex.get("RCA_Art")!] / AoP : 0,
      ...pvOstial,
      ...laReservoir,
    };
  }

  debugVenousGroupBalances(): VenousGroupBalances {
    const pack = this.computePressures(this.x);
    const flows = this.computeFlows(this.x, pack);
    const group = (
      names: readonly NodeName[],
      inflowEdge: string,
      outflowEdge: string,
    ): VenousGroupBalance => {
      let volume = 0;
      let stressedVolume = 0;
      let unstressedVolume = 0;
      for (const name of names) {
        const i = this.nodeIndex.get(name)!;
        const n = this.nodes[i];
        const vu = this.effectiveVu(n);
        const stressedNodeVolume = pack.Vphys[i] - vu;
        volume += pack.Vphys[i];
        stressedVolume += stressedNodeVolume;
        unstressedVolume += vu;
      }
      const inflowMlPerS = flows[this.edgeIndex(inflowEdge)];
      const outflowMlPerS = flows[this.edgeIndex(outflowEdge)];
      return {
        volume,
        stressedVolume,
        unstressedVolume,
        inflowMlPerS,
        outflowMlPerS,
        netFlowMlPerS: inflowMlPerS - outflowMlPerS,
      };
    };
    const totalBloodVolume = this.totalBloodVolume(pack);
    return {
      systemicVenous: group(systemicVenousNodeNames, "Cap_SV", "VC_RA"),
      pulmonaryVenous: group(pulmonaryVenousNodeNames, "PArt_PCap", "PVein_LA"),
      totalBloodVolume,
      expectedTBV: this.expectedTBV,
      tbvErrorMl: this.expectedTBV - totalBloodVolume,
      tbvCorrectionMagPerBeat: this.tbvCorrectionMagLastBeat,
      tbvCorrectionLastStepMl: this.tbvCorrectionLastStepMl,
    };
  }

  debugValveOpenings(): Record<ValveName, number> {
    const out = {} as Record<ValveName, number>;
    for (const v of valveNames) out[v] = this.x[this.idx.xi[v]];
    return out;
  }

  private edgeIndex(name: string): number {
    const idx = this.edges.findIndex((e) => e.name === name);
    if (idx < 0) throw new Error(`Unknown edge ${name}`);
    return idx;
  }

  private totalBloodVolume(pack: PressurePack): number {
    let tbv = 0;
    for (let i = 0; i < pack.Vphys.length; i++) tbv += pack.Vphys[i];
    return tbv;
  }
}

function meanVascularReturnSnapshot(
  side: VascularReturnSnapshot["side"],
  snapshots: VascularReturnSnapshot[],
  durationSeconds: number,
): VascularReturnSnapshot {
  const first = snapshots[0];
  const sampleCount = snapshots.length;
  const mean = (values: number[]): number => values.reduce((sum, value) => sum + value, 0) / sampleCount;
  const nodes = first.nodesDownstreamToUpstream.map((node, index): VascularNodeSnapshot => {
    const samples = snapshots.map((snapshot) => snapshot.nodesDownstreamToUpstream[index]);
    return {
      ...node,
      Pabs: mean(samples.map((sample) => sample.Pabs)),
      Ptm: mean(samples.map((sample) => sample.Ptm)),
      Pext: mean(samples.map((sample) => sample.Pext)),
      volumeMl: mean(samples.map((sample) => sample.volumeMl)),
      unstressedVolumeMl: mean(samples.map((sample) => sample.unstressedVolumeMl)),
      stressedVolumeMl: mean(samples.map((sample) => sample.stressedVolumeMl)),
      complianceEffMlPerMmHg: mean(samples.map((sample) => sample.complianceEffMlPerMmHg)),
      law: node.law,
    };
  });
  const edges = first.edgesDownstreamToUpstream.map((edge, index): VascularEdgeSnapshot => {
    const samples = snapshots.map((snapshot) => snapshot.edgesDownstreamToUpstream[index]);
    return {
      ...edge,
      R_mmHg_s_per_mL: mean(samples.map((sample) => sample.R_mmHg_s_per_mL)),
      B_mmHg_s2_per_mL2: mean(samples.map((sample) => sample.B_mmHg_s2_per_mL2)),
      Pext: mean(samples.map((sample) => sample.Pext)),
    };
  });
  const totalStressedVolumeMl = nodes.reduce((sum, node) => sum + node.stressedVolumeMl, 0);
  const totalUnstressedVolumeMl = nodes.reduce((sum, node) => sum + node.unstressedVolumeMl, 0);
  const totalComplianceMlPerMmHg = nodes.reduce((sum, node) => sum + node.complianceEffMlPerMmHg, 0);
  const externalPressureWeightedMmHg = totalComplianceMlPerMmHg > 1e-9
    ? nodes.reduce((sum, node) => sum + node.complianceEffMlPerMmHg * node.Pext, 0) / totalComplianceMlPerMmHg
    : 0;
  return {
    side,
    downstreamNode: first.downstreamNode,
    nodesDownstreamToUpstream: nodes,
    edgesDownstreamToUpstream: edges,
    totalStressedVolumeMl,
    totalUnstressedVolumeMl,
    totalComplianceMlPerMmHg,
    externalPressureWeightedMmHg,
    mode: "cycle-mean",
    sampleCount,
    durationSeconds,
  };
}

function activePressureComponentMmHg(terms: ChamberPressureTerms | undefined): number | undefined {
  if (!terms) return undefined;
  const sigmaTotal = terms.sigmaPas + terms.sigmaAct;
  if (Math.abs(sigmaTotal) <= 1e-12) return 0;
  return terms.pressureUnclampedMmHg * terms.sigmaAct / sigmaTotal;
}

function passivePressureComponentMmHg(terms: ChamberPressureTerms | undefined): number | undefined {
  if (!terms) return undefined;
  const sigmaTotal = terms.sigmaPas + terms.sigmaAct;
  if (Math.abs(sigmaTotal) <= 1e-12) return 0;
  return terms.pressureUnclampedMmHg * terms.sigmaPas / sigmaTotal;
}

function maxAbs(values: readonly number[]): number {
  return values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
}

function finiteDifferenceStep(value: number): number {
  return Math.max(1e-4, Math.abs(value) * 1e-5);
}

function solveLinearSystem(matrix: readonly (readonly number[])[], rhs: readonly number[]): number[] | null {
  const n = rhs.length;
  if (matrix.length !== n || matrix.some((row) => row.length !== n)) return null;
  const a = matrix.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-10) return null;
    if (pivot !== col) {
      const tmp = a[col];
      a[col] = a[pivot];
      a[pivot] = tmp;
    }
    const denom = a[col][col];
    for (let j = col; j <= n; j++) a[col][j] /= denom;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      if (Math.abs(factor) < 1e-14) continue;
      for (let j = col; j <= n; j++) a[row][j] -= factor * a[col][j];
    }
  }
  return a.map((row) => row[n]);
}
