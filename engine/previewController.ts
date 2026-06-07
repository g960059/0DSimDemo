import { ModelCore } from "@/engine/ModelCore";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import type {
  CoreRuntimeParams,
  SimMetrics,
  SimObservables,
  SimSample,
  SimulationHealth,
  SimulationHealthStatus,
} from "@/engine/protocol";
import type {
  PreviewCoreSnapshot,
  PreviewWorkerRequest,
  PreviewWorkerResponse,
} from "@/engine/previewWorkerProtocol";
import {
  isCurrentTransitionSteadyResult,
  makeTransitionTargetSignature,
  type TransitionSteadyJobRequest,
  type TransitionSteadyJobResult,
  type TransitionSteadyPendingJob,
} from "@/engine/transitionSteadyProtocol";
import type { ChamberId, PhysicsRefState, PreviewCoreFacade, SimInstance } from "@/types";

// Framework-agnostic preview driver (ROADMAP S3a). Owns the per-instance
// ModelCore + sample buffers, the delta-time stepping, the 20s ring buffer, and
// the throttled health/transition logic — none of which belong in a React
// component (prohibition #1). The host (React or a headless test) wires
// callbacks and either calls start() (browser rAF loop) or tick() directly.

export type PreviewToast = {
  id: string;
  name: string;
  status: SimulationHealthStatus;
  message: string;
};

export type PreviewControllerOptions = {
  dt?: number;
  sampleHz?: number;
  bufferRetentionSec?: number;
  healthThrottleMs?: number;
  transitionSteadyDebounceMs?: number;
  useWorker?: boolean;
};

export type PreviewInstancePerf = {
  wallMs: number;
  simulatedSeconds: number;
  samples: number;
  trimmedSamples: number;
  bufferLength: number;
};

export type PreviewPerfSnapshot = {
  frameWallMs: number;
  coreWallMs: number;
  simulatedSeconds: number;
  instanceCount: number;
  samples: number;
  trimmedSamples: number;
  byInstance: Record<string, PreviewInstancePerf>;
};

export type PreviewSetInstancesOptions = {
  transitionIds?: string[];
  steadyTransitionIds?: string[];
};

export type PreviewResetOptions = {
  mode?: "replace" | "transition";
};

export type SteadyUpdateStatus = "computing" | "updated" | "failed";
export type SteadyUpdateStatusMap = Record<string, SteadyUpdateStatus>;

const PREVIEW_TRANSITION_MIN_RETAIN_SEC = 20;
const STEADY_UPDATE_STATUS_MS = 1200;
const TRANSITION_STEADY_DEBOUNCE_MS = 300;
const TRANSITION_STEADY_WATCHDOG_MS = 20_000;

const previewInstanceSignature = (inst: SimInstance): string => JSON.stringify({
  params: inst.params,
  targetVolume: inst.targetVolume,
});

const previewInstanceListSignature = (instances: SimInstance[]): string => (
  instances.map((inst) => `${inst.id}:${previewInstanceSignature(inst)}`).join("|")
);

const transitionTargetSignature = (inst: SimInstance): string => makeTransitionTargetSignature({
  params: inst.params,
  targetVolume: inst.targetVolume,
});

const emptyHealth = (): SimulationHealth => ({
  status: "ok",
  tbvDriftMl: 0,
  tbvDriftPercent: 0,
  leftRightFlowMismatchLMin: 0,
  cycleMetricDelta: 0,
  clampHitCount: 0,
  numericalStability: "ok",
  massConservation: "ok",
  flowBalance: "ok",
  physiologicalRange: "ok",
  messages: [],
});

const emptyMetrics = (hr: number): SimMetrics => ({
  HR: hr,
  AoPMean: 0,
  AoPSys: 0,
  AoPDia: 0,
  PAPMean: 0,
  RAPMean: 0,
  LAPMean: 0,
  LVEDPApprox: 0,
  RVEDPApprox: 0,
  AoVMeanGradient: 0,
  AoVPeakGradient: 0,
  SV_L: 0,
  SV_R: 0,
  CO_L: 0,
  CO_R: 0,
  EF_LApprox: 0,
  EF_RApprox: 0,
  TBV: 0,
  Pmsf: 0,
  vrGradient: 0,
  stressedVolumeSystemic: 0,
  unstressedVolumeSystemic: 0,
  CorFlowLADMlMin: 0,
  CorFlowLCxMlMin: 0,
  CorFlowRCAMlMin: 0,
  CorFlowTotalMlMin: 0,
  CorPctCO: 0,
  CorDiastolicFractionLAD: 0,
  CorDiastolicFractionLCx: 0,
  CorDiastolicFractionRCA: 0,
  FFR_LAD: 0,
  FFR_LCx: 0,
  FFR_RCA: 0,
  CorSupplyDemandL: 0,
  CorSupplyDemandR: 0,
});

const emptyObservables = (): SimObservables => ({
  Pmsf: 0,
  PmsfTm: 0,
  PmsfAbs: 0,
  vrGradient: 0,
  RAP: 0,
  stressedVolumeSystemic: 0,
  unstressedVolumeSystemic: 0,
  systemicComplianceEff: 0,
  systemicExternalPressureWeighted: 0,
  venousStressedVolume: 0,
  venousUnstressedVolume: 0,
  pulmonaryVenousVolume: 0,
  pulmonaryVenousStressedVolume: 0,
  pulmonaryVenousUnstressedVolume: 0,
  pulmonaryVenousComplianceEff: 0,
  pulmonaryVenousExternalPressureWeighted: 0,
  Pmpf: 0,
  PmpfTm: 0,
  PmpfAbs: 0,
  pulmonaryVenousReturnGradient: 0,
  pVeinVcGradient: 0,
  tbvCorrectionMagPerBeat: 0,
  tbvCorrectionLastStepMl: 0,
  expectedTBV: 0,
  tbvErrorMl: 0,
  Pth: 0,
  Palv: 0,
  Q_VC_RA: 0,
  Q_TV: 0,
  Q_PV: 0,
  Q_PCap_PVen: 0,
  xiTV: 0,
  xiPV: 0,
  dP_TV: 0,
  dP_PV: 0,
  P_SV: 0,
  P_VC: 0,
  P_PVen: 0,
  P_PVein: 0,
  Pperi: 0,
  Ppc: 0,
  VHeart: 0,
  septumShiftMl: 0,
  VLVeff: 0,
  VRVeff: 0,
  PLVfw: 0,
  PRVfw: 0,
  PVI_LV: 0,
  PVI_RV: 0,
  septalForceMmHg: 0,
  Q_LAD: 0,
  Q_LCx: 0,
  Q_RCA: 0,
  Q_Cor_total: 0,
  Q_CS_RA: 0,
  P_LAD_Art: 0,
  P_LCx_Art: 0,
  P_RCA_Art: 0,
  P_CS: 0,
  PimLAD: 0,
  PimLCx: 0,
  PimRCA: 0,
  FFR_LAD: 0,
  FFR_LCx: 0,
  FFR_RCA: 0,
});

class RemotePreviewCore implements PreviewCoreFacade {
  t = 0;
  p: CoreRuntimeParams;
  private latestMetrics: SimMetrics;
  private latestHealth: SimulationHealth = emptyHealth();
  private latestObservables: SimObservables = emptyObservables();
  private passiveProbe: ModelCore | null = null;
  private passiveProbeSignature = "";

  constructor(initialParams: CoreRuntimeParams) {
    this.p = initialParams;
    this.latestMetrics = emptyMetrics(initialParams.HR);
  }

  update(snapshot: PreviewCoreSnapshot): void {
    this.t = snapshot.t;
    this.p = snapshot.p;
    this.latestMetrics = snapshot.metrics;
    this.latestHealth = snapshot.health;
    this.latestObservables = snapshot.observables;
  }

  updateClock(t: number, p: CoreRuntimeParams): void {
    this.t = t;
    this.p = p;
  }

  metrics(): SimMetrics {
    return this.latestMetrics;
  }

  health(): SimulationHealth {
    return this.latestHealth;
  }

  debugObservables(): SimObservables {
    return this.latestObservables;
  }

  passivePressureAt(chamber: ChamberId, volumeMl: number): number {
    return this.passiveCore().passivePressureAt(chamber, volumeMl);
  }

  passivePressureVolumeCurve(
    chamber: ChamberId,
    volumeMinMl: number,
    volumeMaxMl: number,
    pointCount?: number,
  ): Array<{ v: number; p: number }> {
    return this.passiveCore().passivePressureVolumeCurve(chamber, volumeMinMl, volumeMaxMl, pointCount);
  }

  private passiveCore(): ModelCore {
    const signature = JSON.stringify(this.p);
    if (!this.passiveProbe || this.passiveProbeSignature !== signature) {
      this.passiveProbe = new ModelCore(this.p);
      this.passiveProbeSignature = signature;
    }
    return this.passiveProbe;
  }
}

export class PreviewController {
  /** Live per-instance cores + buffers. Read directly by chart panels. */
  readonly refs = new Map<string, PhysicsRefState>();

  private instances: SimInstance[] = [];
  private timeScale = 1;
  private playing = true;

  private rafId: number | null = null;
  private running = false;
  private lastFrameTime = 0;
  private lastHealthAt = 0;
  private healthSig = "";
  private prevStatus: Record<string, SimulationHealthStatus> = {};
  private heartModelByInstance: Record<string, CoreRuntimeParams["heartModel"]> = {};
  private perfSnapshot: PreviewPerfSnapshot | null = null;
  private worker: Worker | null = null;
  private workerTickPending = false;
  private workerRequestId = 0;
  private workerGeneration = 0;
  private workerPendingRequestId = 0;
  private workerInstancesSignature = "";
  private transitionSteadyWorker: Worker | null = null;
  private transitionSteadyGeneration = 0;
  private transitionSteadyJobSeq = 0;
  private transitionSteadyPendingJobs = new Map<string, TransitionSteadyPendingJob>();
  private transitionSteadyResults = new Map<string, TransitionSteadyJobResult>();
  private transitionSteadyDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private liveInstancesById = new Map<string, SimInstance>();
  private steadyUpdateStatuses = new Map<string, { status: SteadyUpdateStatus; expiresAtMs?: number }>();

  private readonly dt: number;
  private readonly sampleHz: number;
  private readonly bufferRetentionSec: number;
  private readonly healthThrottleMs: number;
  private readonly transitionSteadyDebounceMs: number;
  private readonly preferWorker: boolean;

  // Host callbacks (all optional). Fire from the loop, not from React.
  onHealthChange?: (health: Record<string, SimulationHealth>) => void;
  onToasts?: (toasts: PreviewToast[]) => void;
  onInstancesAdded?: (ids: string[]) => void;
  onSteadyUpdateStatusChange?: (statuses: SteadyUpdateStatusMap) => void;

  constructor(opts: PreviewControllerOptions = {}) {
    this.dt = opts.dt ?? 0.001;
    this.sampleHz = opts.sampleHz ?? 120;
    this.bufferRetentionSec = opts.bufferRetentionSec ?? 20;
    this.healthThrottleMs = opts.healthThrottleMs ?? 500;
    this.transitionSteadyDebounceMs = opts.transitionSteadyDebounceMs ?? TRANSITION_STEADY_DEBOUNCE_MS;
    this.preferWorker = opts.useWorker ?? true;
    this.initWorker();
  }

  private initWorker(): void {
    if (!this.preferWorker || typeof Worker === "undefined") return;
    try {
      this.worker = new Worker(new URL("./previewWorker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (event: MessageEvent<PreviewWorkerResponse>) => this.handleWorkerMessage(event.data);
      this.worker.onerror = () => {
        this.fallbackToSync();
      };
      this.postWorker({ type: "configure", dt: this.dt, sampleHz: this.sampleHz });
    } catch {
      this.worker = null;
      this.workerTickPending = false;
    }
  }

  private postWorker(message: PreviewWorkerRequest): void {
    this.worker?.postMessage(message);
  }

  requestNextSteady(inst: SimInstance): TransitionSteadyPendingJob {
    const currentInstance = this.instances.find((candidate) => candidate.id === inst.id);
    if (!currentInstance) {
      this.clearTransitionSteadyJob(inst.id);
      throw new Error(`Cannot request transition steady for untracked instance ${inst.id}`);
    }
    const currentRef = this.refs.get(inst.id);
    if (!currentRef) {
      this.clearTransitionSteadyJob(inst.id);
      throw new Error(`Cannot request transition steady for untracked instance ${inst.id}`);
    }
    const fromSignature = currentRef.steadySignature ?? transitionTargetSignature(currentInstance);
    const toSignature = transitionTargetSignature(inst);
    const startedAtMs = this.nowMs();
    this.preparePendingTransition(currentRef, toSignature, startedAtMs);
    const pending: TransitionSteadyPendingJob = {
      request: {
        type: "computeTransitionSteady",
        jobId: `transition-steady-${++this.transitionSteadyJobSeq}`,
        generation: ++this.transitionSteadyGeneration,
        instanceId: inst.id,
        fromSignature,
        toSignature,
        params: inst.params,
        targetVolume: inst.targetVolume,
        options: {
          targetTBV: inst.targetVolume,
          dt: this.dt,
          sampleHz: this.sampleHz,
          settlePolicy: PREVIEW_SETTLE_POLICY,
          measureBeats: 1,
          includeLastBeatSamples: true,
          requireProjectorQuiet: false,
        },
      },
      startedAtMs,
    };
    this.transitionSteadyPendingJobs.set(inst.id, pending);
    this.transitionSteadyResults.delete(inst.id);
    this.clearSteadyUpdateStatus(inst.id);
    this.scheduleTransitionSteadyFlush();
    return pending;
  }

  getPendingTransitionSteadyJob(id: string): TransitionSteadyPendingJob | undefined {
    return this.transitionSteadyPendingJobs.get(id);
  }

  getTransitionSteadyResult(id: string): TransitionSteadyJobResult | undefined {
    return this.transitionSteadyResults.get(id);
  }

  getSteadyUpdateStatuses(): SteadyUpdateStatusMap {
    return this.steadyUpdateStatusSnapshot();
  }

  clearPendingTransitionSteadyJob(id: string): void {
    this.clearTransitionSteadyJob(id);
  }

  private initTransitionSteadyWorker(): Worker | null {
    if (this.transitionSteadyWorker) return this.transitionSteadyWorker;
    if (typeof Worker === "undefined") return null;
    try {
      this.transitionSteadyWorker = new Worker(new URL("./transitionSteadyWorker.ts", import.meta.url), { type: "module" });
      this.transitionSteadyWorker.onmessage = (event: MessageEvent<TransitionSteadyJobResult>) => {
        this.handleTransitionSteadyWorkerMessage(event.data);
      };
      this.transitionSteadyWorker.onerror = () => {
        this.disposeTransitionSteadyWorker();
        this.failPostedTransitionSteadyJobs("Transition steady worker failed");
      };
      return this.transitionSteadyWorker;
    } catch {
      this.transitionSteadyWorker = null;
      return null;
    }
  }

  private restartTransitionSteadyWorkerForPending(unavailableMessage: string): boolean {
    const now = this.nowMs();
    const pendingJobs = [...this.transitionSteadyPendingJobs.values()];
    this.clearTransitionSteadyDebounceTimer();
    this.disposeTransitionSteadyWorker();
    if (pendingJobs.length === 0) return true;
    const worker = this.initTransitionSteadyWorker();
    if (!worker) {
      for (const pending of pendingJobs) {
        this.failTransitionSteadyJob(pending, unavailableMessage);
      }
      return false;
    }
    for (const pending of pendingJobs) {
      pending.postedAtMs = now;
      pending.deadlineAtMs = now + TRANSITION_STEADY_WATCHDOG_MS;
      this.setSteadyUpdateStatus(pending.request.instanceId, "computing");
      worker.postMessage(pending.request);
    }
    return true;
  }

  private scheduleTransitionSteadyFlush(): void {
    this.clearTransitionSteadyDebounceTimer();
    if (this.transitionSteadyPendingJobs.size === 0) return;
    if (this.transitionSteadyDebounceMs <= 0 || typeof setTimeout === "undefined") {
      this.flushTransitionSteadyPendingJobs();
      return;
    }
    this.transitionSteadyDebounceTimer = setTimeout(() => {
      this.transitionSteadyDebounceTimer = null;
      this.flushTransitionSteadyPendingJobs();
    }, this.transitionSteadyDebounceMs);
  }

  private flushTransitionSteadyPendingJobs(): boolean {
    this.clearTransitionSteadyDebounceTimer();
    return this.restartTransitionSteadyWorkerForPending("Transition steady worker is unavailable");
  }

  private clearTransitionSteadyDebounceTimer(): void {
    if (this.transitionSteadyDebounceTimer === null) return;
    clearTimeout(this.transitionSteadyDebounceTimer);
    this.transitionSteadyDebounceTimer = null;
  }

  private clearTransitionSteadyDebounceTimerIfIdle(): void {
    if (this.transitionSteadyPendingJobs.size === 0) {
      this.clearTransitionSteadyDebounceTimer();
    }
  }

  private failTransitionSteadyJobs(message: string): void {
    for (const pending of [...this.transitionSteadyPendingJobs.values()]) {
      this.failTransitionSteadyJob(pending, message);
    }
  }

  private failPostedTransitionSteadyJobs(message: string): void {
    for (const pending of [...this.transitionSteadyPendingJobs.values()]) {
      if (pending.postedAtMs !== undefined) {
        this.failTransitionSteadyJob(pending, message);
      }
    }
  }

  private failTransitionSteadyJob(pending: TransitionSteadyPendingJob, message: string): void {
    const id = pending.request.instanceId;
    this.transitionSteadyPendingJobs.delete(id);
    this.transitionSteadyResults.set(id, this.transitionSteadyErrorResult(pending.request, message));
    this.clearPendingTransitionState(id, pending.request.toSignature);
    this.setSteadyUpdateStatus(id, "failed");
  }

  private handleTransitionSteadyWorkerMessage(result: TransitionSteadyJobResult): void {
    const pending = this.transitionSteadyPendingJobs.get(result.instanceId);
    if (!pending || !isCurrentTransitionSteadyResult(result, pending)) return;
    this.transitionSteadyPendingJobs.delete(result.instanceId);
    if (result.outcome === "completed") {
      const promoted = this.promoteTransitionSteadyWorkerResult(result);
      this.transitionSteadyResults.set(
        result.instanceId,
        promoted
          ? result
          : this.transitionSteadyErrorResult(pending.request, "Transition steady result cannot be promoted"),
      );
      if (!promoted) this.clearPendingTransitionState(result.instanceId, result.toSignature);
      this.setSteadyUpdateStatus(
        result.instanceId,
        promoted ? "updated" : "failed",
        promoted ? this.nowMs() + STEADY_UPDATE_STATUS_MS : undefined,
      );
      return;
    }
    this.transitionSteadyResults.set(result.instanceId, result);
    this.clearPendingTransitionState(result.instanceId, result.toSignature);
    this.setSteadyUpdateStatus(result.instanceId, "failed");
  }

  private transitionSteadyErrorResult(
    request: TransitionSteadyJobRequest,
    message: string,
  ): TransitionSteadyJobResult {
    return {
      type: "transitionSteadyResult",
      jobId: request.jobId,
      generation: request.generation,
      instanceId: request.instanceId,
      toSignature: request.toSignature,
      outcome: "error",
      message,
    };
  }

  private promoteTransitionSteadyWorkerResult(result: TransitionSteadyJobResult & { outcome: "completed" }): boolean {
    if (!result.samples || result.samples.length === 0 || !result.snapshot) return false;
    const phys = this.refs.get(result.instanceId);
    const inst = this.instances.find((candidate) => candidate.id === result.instanceId);
    if (!phys || !inst) return false;
    if (transitionTargetSignature(inst) !== result.toSignature) return false;
    this.liveInstancesById.set(inst.id, inst);
    if (!(phys.core instanceof RemotePreviewCore)) {
      const core = new ModelCore(inst.params);
      core.unpackState(result.steady.state);
      phys.core = core;
    }
    this.promoteTransition(phys, previewInstanceSignature(inst), result.samples, result.snapshot, result.toSignature);
    if (this.worker) {
      const generation = this.bumpWorkerGeneration();
      this.workerInstancesSignature = previewInstanceListSignature(this.liveInstancesFor(this.instances));
      this.postWorker({ type: "promoteTransitionSteady", generation, instance: inst, state: result.steady.state });
    }
    return true;
  }

  private disposeTransitionSteadyWorker(): void {
    this.transitionSteadyWorker?.terminate();
    this.transitionSteadyWorker = null;
  }

  private clearTransitionSteadyJob(id: string): void {
    const pending = this.transitionSteadyPendingJobs.get(id);
    const result = this.transitionSteadyResults.get(id);
    this.transitionSteadyPendingJobs.delete(id);
    this.transitionSteadyResults.delete(id);
    this.clearPendingTransitionState(id, pending?.request.toSignature ?? result?.toSignature);
    this.clearSteadyUpdateStatus(id);
    this.clearTransitionSteadyDebounceTimerIfIdle();
  }

  private clearTransitionSteadyJobs(): void {
    for (const pending of this.transitionSteadyPendingJobs.values()) {
      this.clearPendingTransitionState(pending.request.instanceId, pending.request.toSignature);
    }
    this.clearTransitionSteadyDebounceTimer();
    this.transitionSteadyPendingJobs.clear();
    this.transitionSteadyResults.clear();
    this.clearSteadyUpdateStatuses();
  }

  private pruneTransitionSteadyPendingJobs(currentIds: Set<string>): void {
    for (const id of [...this.transitionSteadyPendingJobs.keys()]) {
      if (!currentIds.has(id)) this.clearTransitionSteadyJob(id);
    }
    for (const id of [...this.transitionSteadyResults.keys()]) {
      if (!currentIds.has(id)) this.clearTransitionSteadyJob(id);
    }
  }

  private liveInstancesFor(instances: SimInstance[]): SimInstance[] {
    return instances.map((inst) => this.liveInstancesById.get(inst.id) ?? inst);
  }

  private shouldHoldLiveInstanceForSteadyTransition(inst: SimInstance, explicitHold: boolean): boolean {
    const pending = this.transitionSteadyPendingJobs.get(inst.id);
    if (!pending) return explicitHold;
    const targetSignature = transitionTargetSignature(inst);
    if (targetSignature !== pending.request.toSignature) {
      if (explicitHold && targetSignature === pending.request.fromSignature) return true;
      this.clearTransitionSteadyJob(inst.id);
      return explicitHold;
    }
    return true;
  }

  private preparePendingTransition(phys: PhysicsRefState, toSignature: string, startedAtMs = this.nowMs()): void {
    phys.previousEpoch = undefined;
    phys.isSettling = false;
    phys.settleProgress = undefined;
    phys.transition = {
      status: "pending",
      toSignature,
      startedAtMs,
    };
  }

  private clearPendingTransitionState(id: string, toSignature?: string): void {
    const phys = this.refs.get(id);
    if (!phys || phys.transition?.status !== "pending") return;
    if (toSignature && phys.transition.toSignature !== toSignature) return;
    phys.transition = undefined;
  }

  private transitionRetainSeconds(): number {
    return Math.max(this.bufferRetentionSec, PREVIEW_TRANSITION_MIN_RETAIN_SEC);
  }

  private steadyUpdateStatusSnapshot(): SteadyUpdateStatusMap {
    return Object.fromEntries(
      [...this.steadyUpdateStatuses.entries()].map(([id, entry]) => [id, entry.status]),
    );
  }

  private emitSteadyUpdateStatusChange(): void {
    this.onSteadyUpdateStatusChange?.(this.steadyUpdateStatusSnapshot());
  }

  private setSteadyUpdateStatus(id: string, status: SteadyUpdateStatus, expiresAtMs?: number): void {
    const current = this.steadyUpdateStatuses.get(id);
    if (current?.status === status && current.expiresAtMs === expiresAtMs) return;
    this.steadyUpdateStatuses.set(id, { status, expiresAtMs });
    this.emitSteadyUpdateStatusChange();
  }

  private clearSteadyUpdateStatus(id: string): void {
    if (!this.steadyUpdateStatuses.delete(id)) return;
    this.emitSteadyUpdateStatusChange();
  }

  private clearSteadyUpdateStatuses(): void {
    if (this.steadyUpdateStatuses.size === 0) return;
    this.steadyUpdateStatuses.clear();
    this.emitSteadyUpdateStatusChange();
  }

  private expireSteadyUpdateStatuses(now = this.nowMs()): void {
    let changed = false;
    for (const [id, entry] of this.steadyUpdateStatuses) {
      if (entry.status === "updated" && entry.expiresAtMs !== undefined && entry.expiresAtMs <= now) {
        this.steadyUpdateStatuses.delete(id);
        changed = true;
      }
    }
    if (changed) this.emitSteadyUpdateStatusChange();
  }

  private expireTransitionSteadyPendingJobs(now = this.nowMs()): void {
    const expired = [...this.transitionSteadyPendingJobs.values()]
      .filter((pending) => pending.deadlineAtMs !== undefined && pending.deadlineAtMs <= now);
    if (expired.length === 0) return;
    for (const pending of expired) {
      this.failTransitionSteadyJob(pending, "Transition steady worker timed out");
    }
    this.restartTransitionSteadyWorkerForPending("Transition steady worker is unavailable");
  }

  private fallbackToSync(): void {
    this.worker?.terminate();
    this.worker = null;
    this.workerTickPending = false;
    this.workerPendingRequestId = 0;
    this.workerInstancesSignature = "";
    this.workerGeneration++;
    const instances = this.instances;
    this.disposeTransitionSteadyWorker();
    this.clearTransitionSteadyJobs();
    this.refs.clear();
    this.liveInstancesById.clear();
    this.prevStatus = {};
    this.healthSig = "";
    this.instances = [];
    this.setInstances(instances);
  }

  private bumpWorkerGeneration(): number {
    this.workerGeneration++;
    this.workerTickPending = false;
    this.workerPendingRequestId = 0;
    return this.workerGeneration;
  }

  setTimeScale(v: number) {
    this.timeScale = v;
  }

  setPlaying(v: boolean) {
    this.playing = v;
  }

  /** Reconcile live cores with the instance list: create new, drop removed. */
  setInstances(instances: SimInstance[], options: PreviewSetInstancesOptions = {}) {
    if (this.worker) {
      this.setInstancesWorker(instances, options);
      return;
    }
    const transitionIds = new Set(options.transitionIds ?? []);
    const steadyTransitionIds = new Set(options.steadyTransitionIds ?? []);
    this.instances = instances;
    const added: string[] = [];
    let resetExisting = false;
    for (const inst of instances) {
      const signature = previewInstanceSignature(inst);
      const previousHeartModel = this.heartModelByInstance[inst.id];
      const heartModelChanged = previousHeartModel !== undefined && previousHeartModel !== inst.params.heartModel;
      this.heartModelByInstance[inst.id] = inst.params.heartModel;
      const current = this.refs.get(inst.id);
      if (current && !heartModelChanged) {
        const holdLiveInstance = this.shouldHoldLiveInstanceForSteadyTransition(inst, steadyTransitionIds.has(inst.id));
        if (transitionIds.has(inst.id)) {
          this.liveInstancesById.set(inst.id, inst);
          this.promoteSyncTransition(inst, current, signature);
        } else if (!holdLiveInstance) {
          this.liveInstancesById.set(inst.id, inst);
        }
        continue;
      }
      this.liveInstancesById.set(inst.id, inst);
      this.refs.set(inst.id, this.createSettledRef(inst));
      if (heartModelChanged) {
        this.clearTransitionSteadyJob(inst.id);
        resetExisting = true;
        delete this.prevStatus[inst.id];
      } else {
        added.push(inst.id);
      }
    }
    const currentIds = new Set(instances.map((i) => i.id));
    this.pruneTransitionSteadyPendingJobs(currentIds);
    for (const id of [...this.refs.keys()]) {
      if (!currentIds.has(id)) {
        this.refs.delete(id);
        this.liveInstancesById.delete(id);
        this.clearTransitionSteadyJob(id);
        delete this.prevStatus[id];
        delete this.heartModelByInstance[id];
      }
    }
    if (resetExisting) {
      this.healthSig = "";
      this.lastFrameTime = 0;
    }
    if (added.length > 0) this.onInstancesAdded?.(added);
  }

  private createSettledRef(inst: SimInstance): PhysicsRefState {
    const core = new ModelCore(inst.params);
    core.initializeVenousPressuresForTargetTBV(inst.targetVolume);
    // Settle to the limit cycle (capped) so the UI starts on steady state, not
    // a transient. Headless this is ~1s wall-clock; far better than the old
    // fixed 3s pre-settle (which left ~30s of live settling visible).
    core.settleToSteady(PREVIEW_SETTLE_POLICY, this.dt, this.sampleHz);
    // Align a newly-added/rebuilt instance's clock with the others so charts stay in phase.
    let maxT = 0;
    this.refs.forEach((ref) => {
      if (ref.core.t > maxT) maxT = ref.core.t;
    });
    if (maxT > 0) {
      core.t = maxT;
      core.clearBeatTracking(); // the t jump breaks the in-flight beat's dt
    }
    return {
      core,
      buffer: [],
      lastRenderX: 0,
      displaySignature: previewInstanceSignature(inst),
      steadySignature: transitionTargetSignature(inst),
    };
  }

  private setInstancesWorker(instances: SimInstance[], options: PreviewSetInstancesOptions = {}) {
    this.instances = instances;
    const added: string[] = [];
    const resetIds: string[] = [];
    const transitionIds = new Set(options.transitionIds ?? []);
    const steadyTransitionIds = new Set(options.steadyTransitionIds ?? []);
    for (const inst of instances) {
      const current = this.refs.get(inst.id);
      const signature = previewInstanceSignature(inst);
      const previousHeartModel = this.heartModelByInstance[inst.id];
      const heartModelChanged = previousHeartModel !== undefined && previousHeartModel !== inst.params.heartModel;
      this.heartModelByInstance[inst.id] = inst.params.heartModel;
      if (current) {
        const holdLiveInstance = !heartModelChanged
          && this.shouldHoldLiveInstanceForSteadyTransition(inst, steadyTransitionIds.has(inst.id));
        if (heartModelChanged) {
          this.clearTransitionSteadyJob(inst.id);
          this.liveInstancesById.set(inst.id, inst);
          current.buffer = [];
          current.lastRenderX = 0;
          current.isSettling = true;
          current.settleProgress = 0;
          current.steadySignature = transitionTargetSignature(inst);
          current.previousEpoch = undefined;
          current.transition = undefined;
          delete this.prevStatus[inst.id];
          resetIds.push(inst.id);
        }
        if (transitionIds.has(inst.id) && !heartModelChanged) {
          this.liveInstancesById.set(inst.id, inst);
          this.prepareTransition(current, signature);
          resetIds.push(inst.id);
        } else if (current.transition?.status === "settling" && current.transition.toSignature === signature) {
          current.isSettling = true;
        } else if (!holdLiveInstance && current.core instanceof RemotePreviewCore) {
          this.liveInstancesById.set(inst.id, inst);
          current.core.updateClock(current.core.t, inst.params);
        }
        continue;
      }
      this.liveInstancesById.set(inst.id, inst);
      this.refs.set(inst.id, {
        core: new RemotePreviewCore(inst.params),
        buffer: [],
        lastRenderX: 0,
        isSettling: true,
        settleProgress: 0,
        displaySignature: signature,
        steadySignature: transitionTargetSignature(inst),
      });
      added.push(inst.id);
    }
    const currentIds = new Set(instances.map((i) => i.id));
    this.pruneTransitionSteadyPendingJobs(currentIds);
    for (const id of [...this.refs.keys()]) {
      if (!currentIds.has(id)) {
        this.refs.delete(id);
        this.liveInstancesById.delete(id);
        this.clearTransitionSteadyJob(id);
        delete this.prevStatus[id];
        delete this.heartModelByInstance[id];
      }
    }
    const workerInstances = this.liveInstancesFor(instances);
    const nextListSignature = previewInstanceListSignature(workerInstances);
    if (resetIds.length === 0 && nextListSignature === this.workerInstancesSignature) {
      if (added.length > 0) this.onInstancesAdded?.(added);
      return;
    }
    const generation = this.bumpWorkerGeneration();
    this.workerInstancesSignature = nextListSignature;
    this.postWorker({ type: "setInstances", generation, instances: workerInstances });
    if (resetIds.length > 0) {
      this.postWorker({ type: "resetInstances", generation, ids: resetIds });
      this.healthSig = "";
      this.lastFrameTime = 0;
    }
    if (added.length > 0) this.onInstancesAdded?.(added);
  }

  private prepareTransition(phys: PhysicsRefState, toSignature: string): void {
    const now = this.nowMs();
    phys.isSettling = true;
    phys.settleProgress = 0;
    phys.previousEpoch = undefined;
    phys.transition = {
      status: "settling",
      toSignature,
      startedAtMs: now,
    };
  }

  private promoteTransition(
    phys: PhysicsRefState,
    toSignature: string,
    samples: SimSample[],
    snapshot?: PreviewCoreSnapshot,
    steadySignature?: string,
  ): void {
    const now = this.nowMs();
    const previous = phys.buffer.slice();
    const wipeStartedAtT = samples.at(-1)?.t ?? snapshot?.t ?? phys.core.t;
    if (previous.length > 0) {
      phys.previousEpoch = {
        buffer: previous,
        capturedAtMs: now,
        wipeStartedAtT,
        retainUntilT: wipeStartedAtT + this.transitionRetainSeconds(),
      };
    } else {
      phys.previousEpoch = undefined;
    }
    if (snapshot && phys.core instanceof RemotePreviewCore) phys.core.update(snapshot);
    phys.buffer = samples.slice();
    phys.lastRenderX = 0;
    phys.isSettling = false;
    phys.settleProgress = 1;
    phys.displaySignature = toSignature;
    if (steadySignature) phys.steadySignature = steadySignature;
    phys.transition = {
      status: "promoted",
      toSignature,
      startedAtMs: phys.transition?.startedAtMs ?? now,
      promotedAtMs: now,
    };
  }

  private promoteSyncTransition(inst: SimInstance, current: PhysicsRefState, signature: string): void {
    const core = new ModelCore(inst.params);
    core.initializeVenousPressuresForTargetTBV(inst.targetVolume);
    core.settleToSteady(PREVIEW_SETTLE_POLICY, this.dt, this.sampleHz);
    const sampleSeconds = 60 / Math.max(core.p.HR, 1);
    const samples = core.runFor(sampleSeconds, this.dt, this.sampleHz);
    const now = this.nowMs();
    const previous = current.buffer.slice();
    const wipeStartedAtT = samples.at(-1)?.t ?? core.t;
    this.refs.set(inst.id, {
      core,
      buffer: samples,
      lastRenderX: 0,
      isSettling: false,
      settleProgress: 1,
      displaySignature: signature,
      steadySignature: transitionTargetSignature(inst),
      previousEpoch: previous.length > 0
        ? {
          buffer: previous,
          capturedAtMs: now,
          wipeStartedAtT,
          retainUntilT: wipeStartedAtT + this.transitionRetainSeconds(),
        }
        : undefined,
      transition: {
        status: "promoted",
        toSignature: signature,
        startedAtMs: now,
        promotedAtMs: now,
      },
    });
    delete this.prevStatus[inst.id];
  }

  private expirePreviousEpochs(): void {
    for (const phys of this.refs.values()) {
      const latestT = phys.buffer.at(-1)?.t ?? phys.core.t;
      if (phys.previousEpoch && phys.previousEpoch.retainUntilT <= latestT) {
        phys.previousEpoch = undefined;
        if (phys.transition?.status === "promoted") phys.transition = undefined;
      }
    }
  }

  /**
   * Reset selected existing instances to a clean, settled operating point.
   * Used at lesson step boundaries after params change; ordinary live knob
   * edits still merge smoothly through setImmediateParameters in tick().
   */
  resetInstances(ids: string[], options: PreviewResetOptions = {}) {
    if (ids.length === 0) return;
    const mode = options.mode ?? "replace";
    if (this.worker) {
      for (const id of ids) {
        this.clearTransitionSteadyJob(id);
        const current = this.refs.get(id);
        if (!current) continue;
        if (mode === "transition") {
          const inst = this.instances.find((candidate) => candidate.id === id);
          this.prepareTransition(current, inst ? previewInstanceSignature(inst) : current.displaySignature ?? id);
        } else {
          current.buffer = [];
          current.lastRenderX = 0;
          current.isSettling = true;
          current.settleProgress = 0;
          current.previousEpoch = undefined;
          current.transition = undefined;
        }
        delete this.prevStatus[id];
      }
      this.postWorker({ type: "resetInstances", generation: this.bumpWorkerGeneration(), ids });
      this.healthSig = "";
      this.lastFrameTime = 0;
      return;
    }
    const targets = new Set(ids);
    for (const inst of this.instances) {
      if (!targets.has(inst.id)) continue;
      this.clearTransitionSteadyJob(inst.id);
      const current = this.refs.get(inst.id);
      if (!current) continue;
      if (mode === "transition") {
        this.promoteSyncTransition(inst, current, previewInstanceSignature(inst));
        continue;
      }
      const core = new ModelCore(inst.params);
      core.initializeVenousPressuresForTargetTBV(inst.targetVolume);
      core.settleToSteady(PREVIEW_SETTLE_POLICY, this.dt, this.sampleHz);
      core.clearBeatTracking();
      this.refs.set(inst.id, {
        core,
        buffer: [],
        lastRenderX: 0,
        displaySignature: previewInstanceSignature(inst),
        steadySignature: transitionTargetSignature(inst),
      });
      delete this.prevStatus[inst.id];
    }
    this.healthSig = "";
    this.lastFrameTime = 0;
  }

  setInstanceVolume(id: string, vol: number) {
    if (this.worker) {
      this.postWorker({ type: "setInstanceVolume", generation: this.bumpWorkerGeneration(), id, volume: vol });
      return;
    }
    const core = this.refs.get(id)?.core as ModelCore | undefined;
    if (!core) return;
    core.initializeVenousPressuresForTargetTBV(vol);
    core.clearBeatTracking();
  }

  getLiveHealth(id: string): SimulationHealth | undefined {
    return this.refs.get(id)?.core.health();
  }

  getPerfSnapshot(): PreviewPerfSnapshot | null {
    return this.perfSnapshot;
  }

  /** Begin the browser rAF loop. No-op outside the browser or if already running. */
  start() {
    if (this.running || typeof requestAnimationFrame === "undefined") return;
    if (!this.worker) {
      this.initWorker();
      if (this.worker && this.instances.length > 0) {
        const workerInstances = this.liveInstancesFor(this.instances);
        this.workerInstancesSignature = previewInstanceListSignature(workerInstances);
        this.postWorker({ type: "setInstances", generation: this.bumpWorkerGeneration(), instances: workerInstances });
      }
    }
    this.running = true;
    this.lastFrameTime = 0; // fresh clock on (re)start, so no stale-gap step
    const loop = (now: number) => {
      if (!this.running) return;
      this.tick(now);
      // Re-check: a callback fired inside tick() may have called stop().
      if (this.running) this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId != null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
    this.worker?.terminate();
    this.worker = null;
    this.workerTickPending = false;
    this.workerPendingRequestId = 0;
    this.workerInstancesSignature = "";
    this.disposeTransitionSteadyWorker();
    this.clearTransitionSteadyJobs();
  }

  /** Advance one frame for a wall-clock timestamp (ms). Driver-agnostic. */
  tick(now: number) {
    const frameStart = this.nowMs();
    this.expirePreviousEpochs();
    this.expireSteadyUpdateStatuses(frameStart);
    this.expireTransitionSteadyPendingJobs(frameStart);
    if (!this.lastFrameTime) this.lastFrameTime = now;
    let deltaTimeMs = now - this.lastFrameTime;
    this.lastFrameTime = now; // updated even while paused, so resume doesn't jump
    if (!this.playing) {
      this.perfSnapshot = {
        frameWallMs: this.nowMs() - frameStart,
        coreWallMs: 0,
        simulatedSeconds: 0,
        instanceCount: this.instances.length,
        samples: 0,
        trimmedSamples: 0,
        byInstance: {},
      };
      return;
    }
    if (deltaTimeMs > 100) deltaTimeMs = 100;
    const simSeconds = (deltaTimeMs / 1000) * this.timeScale;

    if (this.worker) {
      if (this.workerTickPending) {
        this.perfSnapshot = {
          frameWallMs: this.nowMs() - frameStart,
          coreWallMs: 0,
          simulatedSeconds: simSeconds,
          instanceCount: this.instances.length,
          samples: 0,
          trimmedSamples: 0,
          byInstance: {},
        };
        return;
      }
      this.workerTickPending = true;
      const requestId = ++this.workerRequestId;
      this.workerPendingRequestId = requestId;
      this.postWorker({
        type: "tick",
        generation: this.workerGeneration,
        requestId,
        now,
        simSeconds,
      });
      this.perfSnapshot = {
        frameWallMs: this.nowMs() - frameStart,
        coreWallMs: 0,
        simulatedSeconds: simSeconds,
        instanceCount: this.instances.length,
        samples: 0,
        trimmedSamples: 0,
        byInstance: {},
      };
      return;
    }

    let coreWallMs = 0;
    let sampleCount = 0;
    let trimmedSamples = 0;
    const byInstance: Record<string, PreviewInstancePerf> = {};

    for (const inst of this.instances) {
      const phys = this.refs.get(inst.id);
      if (!phys) continue;
      const liveInst = this.liveInstancesById.get(inst.id) ?? inst;
      const instanceStart = this.nowMs();
      const core = phys.core as ModelCore;
      core.setImmediateParameters(liveInst.params);
      const samples = core.runFor(simSeconds, this.dt, this.sampleHz);
      const cutoffTime = core.t - this.bufferRetentionSec;
      const trimmed = this.appendSamples(phys, samples, cutoffTime);
      const instanceWallMs = this.nowMs() - instanceStart;
      coreWallMs += instanceWallMs;
      sampleCount += samples.length;
      trimmedSamples += trimmed;
      byInstance[inst.id] = {
        wallMs: instanceWallMs,
        simulatedSeconds: simSeconds,
        samples: samples.length,
        trimmedSamples: trimmed,
        bufferLength: phys.buffer.length,
      };
    }

    this.perfSnapshot = {
      frameWallMs: this.nowMs() - frameStart,
      coreWallMs,
      simulatedSeconds: simSeconds,
      instanceCount: this.instances.length,
      samples: sampleCount,
      trimmedSamples,
      byInstance,
    };

    if (now - this.lastHealthAt > this.healthThrottleMs) {
      this.lastHealthAt = now;
      this.updateHealth(now);
    }
  }

  private appendSamples(phys: PhysicsRefState, samples: SimSample[], cutoffTime: number): number {
    if (samples.length > 0) phys.buffer.push(...samples);
    let dropCount = 0;
    while (dropCount < phys.buffer.length && phys.buffer[dropCount].t < cutoffTime) {
      dropCount++;
    }
    if (dropCount > 0) phys.buffer.splice(0, dropCount);
    return dropCount;
  }

  private handleWorkerMessage(message: PreviewWorkerResponse): void {
    if (message.type === "error") {
      this.fallbackToSync();
      return;
    }

    if (!this.worker) return;

    if (message.type === "settleProgress") {
      if (message.generation !== this.workerGeneration) return;
      const phys = this.refs.get(message.id);
      if (!phys) return;
      const inst = this.instances.find((candidate) => candidate.id === message.id);
      phys.isSettling = message.settling;
      phys.settleProgress = Math.min(1, Math.max(0, message.actualSeconds / PREVIEW_SETTLE_POLICY.capSeconds));
      if (phys.transition?.status === "settling") {
        if (!message.settling && message.samples && message.samples.length > 0) {
          this.promoteTransition(
            phys,
            phys.transition.toSignature,
            message.samples,
            message.snapshot,
            inst ? transitionTargetSignature(inst) : undefined,
          );
        }
        return;
      }
      if (phys.core instanceof RemotePreviewCore) phys.core.update(message.snapshot);
      if (!message.settling) {
        phys.buffer = [];
        if (inst) phys.steadySignature = transitionTargetSignature(inst);
      }
      return;
    }

    const matchesPending = message.requestId === this.workerPendingRequestId;
    if (!matchesPending) return;
    this.workerTickPending = false;
    this.workerPendingRequestId = 0;
    if (message.generation !== this.workerGeneration) return;
    let trimmedSamples = 0;
    const byInstance: Record<string, PreviewInstancePerf> = {};

    for (const item of message.instances) {
      const phys = this.refs.get(item.id);
      const inst = this.instances.find((candidate) => candidate.id === item.id);
      const liveInst = inst ? this.liveInstancesById.get(item.id) ?? inst : undefined;
      if (!phys || !inst) continue;
      if (phys.transition?.status === "settling") {
        phys.isSettling = item.settling;
        if (!item.settling && item.samples.length > 0) {
          const snapshot = item.snapshot;
          this.promoteTransition(
            phys,
            phys.transition.toSignature,
            item.samples,
            snapshot,
            transitionTargetSignature(inst),
          );
        }
        continue;
      }
      if (item.snapshot && phys.core instanceof RemotePreviewCore) {
        phys.core.update(item.snapshot);
      } else if (phys.core instanceof RemotePreviewCore) {
        phys.core.updateClock(item.t, (liveInst ?? inst).params);
      }
      phys.isSettling = item.settling;
      const trimmed = this.appendSamples(phys, item.samples, item.t - this.bufferRetentionSec);
      trimmedSamples += trimmed;
      byInstance[item.id] = {
        wallMs: 0,
        simulatedSeconds: 0,
        samples: item.samples.length,
        trimmedSamples: trimmed,
        bufferLength: phys.buffer.length,
      };
    }

    this.perfSnapshot = {
      frameWallMs: message.perf.coreWallMs,
      coreWallMs: message.perf.coreWallMs,
      simulatedSeconds: 0,
      instanceCount: message.perf.instanceCount,
      samples: message.perf.samples,
      trimmedSamples,
      byInstance,
    };

    if (message.now - this.lastHealthAt > this.healthThrottleMs) {
      this.lastHealthAt = message.now;
      this.emitHealthFromRefs(message.now);
    }
  }

  private nowMs(): number {
    const perf = globalThis.performance;
    return perf && typeof perf.now === "function" ? perf.now() : Date.now();
  }

  // Throttled: only fires onHealthChange when a status signature changes (so a
  // healthy steady state triggers zero host re-renders), and only toasts on a
  // genuine in-session worsening transition.
  private updateHealth(now: number) {
    const map: Record<string, SimulationHealth> = {};
    for (const inst of this.instances) {
      const phys = this.refs.get(inst.id);
      if (!phys) continue;
      map[inst.id] = phys.core.health();
    }
    this.emitHealthMap(map, now);
  }

  private emitHealthFromRefs(now: number) {
    const map: Record<string, SimulationHealth> = {};
    for (const inst of this.instances) {
      const phys = this.refs.get(inst.id);
      if (!phys) continue;
      map[inst.id] = phys.core.health();
    }
    this.emitHealthMap(map, now);
  }

  private emitHealthMap(map: Record<string, SimulationHealth>, now: number) {
    const rank: Record<SimulationHealthStatus, number> = { ok: 0, warning: 1, failed: 2 };
    const toasts: PreviewToast[] = [];
    let sig = "";
    for (const inst of this.instances) {
      const h = map[inst.id];
      if (!h) continue;
      sig += `${inst.id}:${h.status}|`;
      const seen = inst.id in this.prevStatus;
      const prev = this.prevStatus[inst.id] ?? "ok";
      if (seen && rank[h.status] > rank[prev]) {
        toasts.push({
          id: `${inst.id}-${Math.round(now)}`,
          name: inst.name,
          status: h.status,
          message: h.messages[0] ?? "",
        });
      }
      this.prevStatus[inst.id] = h.status;
    }
    if (sig !== this.healthSig) {
      this.healthSig = sig;
      this.onHealthChange?.(map);
    }
    if (toasts.length > 0) this.onToasts?.(toasts);
  }
}
