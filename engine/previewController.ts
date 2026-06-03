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
import type { PhysicsRefState, PreviewCoreFacade, SimInstance } from "@/types";

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
  private perfSnapshot: PreviewPerfSnapshot | null = null;
  private worker: Worker | null = null;
  private workerTickPending = false;
  private workerRequestId = 0;
  private workerGeneration = 0;
  private workerPendingRequestId = 0;

  private readonly dt: number;
  private readonly sampleHz: number;
  private readonly bufferRetentionSec: number;
  private readonly healthThrottleMs: number;
  private readonly preferWorker: boolean;

  // Host callbacks (all optional). Fire from the loop, not from React.
  onHealthChange?: (health: Record<string, SimulationHealth>) => void;
  onToasts?: (toasts: PreviewToast[]) => void;
  onInstancesAdded?: (ids: string[]) => void;

  constructor(opts: PreviewControllerOptions = {}) {
    this.dt = opts.dt ?? 0.001;
    this.sampleHz = opts.sampleHz ?? 120;
    this.bufferRetentionSec = opts.bufferRetentionSec ?? 20;
    this.healthThrottleMs = opts.healthThrottleMs ?? 500;
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

  private fallbackToSync(): void {
    this.worker?.terminate();
    this.worker = null;
    this.workerTickPending = false;
    this.workerPendingRequestId = 0;
    this.workerGeneration++;
    const instances = this.instances;
    this.refs.clear();
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
  setInstances(instances: SimInstance[]) {
    if (this.worker) {
      this.setInstancesWorker(instances);
      return;
    }
    this.instances = instances;
    const added: string[] = [];
    for (const inst of instances) {
      if (this.refs.has(inst.id)) continue;
      const core = new ModelCore(inst.params);
      core.initializeVenousPressuresForTargetTBV(inst.targetVolume);
      // Settle to the limit cycle (capped) so the UI starts on steady state, not
      // a transient. Headless this is ~1s wall-clock; far better than the old
      // fixed 3s pre-settle (which left ~30s of live settling visible).
      core.settleToSteady(PREVIEW_SETTLE_POLICY, this.dt, this.sampleHz);
      // Align a newly-added instance's clock with the others so charts stay in phase.
      let maxT = 0;
      this.refs.forEach((ref) => {
        if (ref.core.t > maxT) maxT = ref.core.t;
      });
      if (maxT > 0) {
        core.t = maxT;
        core.clearBeatTracking(); // the t jump breaks the in-flight beat's dt
      }
      this.refs.set(inst.id, { core, buffer: [], lastRenderX: 0 });
      added.push(inst.id);
    }
    const currentIds = new Set(instances.map((i) => i.id));
    for (const id of [...this.refs.keys()]) {
      if (!currentIds.has(id)) {
        this.refs.delete(id);
        delete this.prevStatus[id];
      }
    }
    if (added.length > 0) this.onInstancesAdded?.(added);
  }

  private setInstancesWorker(instances: SimInstance[]) {
    this.instances = instances;
    const added: string[] = [];
    for (const inst of instances) {
      const current = this.refs.get(inst.id);
      if (current) {
        if (current.core instanceof RemotePreviewCore) current.core.updateClock(current.core.t, inst.params);
        continue;
      }
      this.refs.set(inst.id, {
        core: new RemotePreviewCore(inst.params),
        buffer: [],
        lastRenderX: 0,
        isSettling: true,
        settleProgress: 0,
      });
      added.push(inst.id);
    }
    const currentIds = new Set(instances.map((i) => i.id));
    for (const id of [...this.refs.keys()]) {
      if (!currentIds.has(id)) {
        this.refs.delete(id);
        delete this.prevStatus[id];
      }
    }
    this.postWorker({ type: "setInstances", generation: this.bumpWorkerGeneration(), instances });
    if (added.length > 0) this.onInstancesAdded?.(added);
  }

  /**
   * Reset selected existing instances to a clean, settled operating point.
   * Used at lesson step boundaries after params change; ordinary live knob
   * edits still merge smoothly through setImmediateParameters in tick().
   */
  resetInstances(ids: string[]) {
    if (ids.length === 0) return;
    if (this.worker) {
      for (const id of ids) {
        const current = this.refs.get(id);
        if (!current) continue;
        current.buffer = [];
        current.lastRenderX = 0;
        current.isSettling = true;
        current.settleProgress = 0;
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
      const current = this.refs.get(inst.id);
      if (!current) continue;
      const core = new ModelCore(inst.params);
      core.initializeVenousPressuresForTargetTBV(inst.targetVolume);
      core.settleToSteady(PREVIEW_SETTLE_POLICY, this.dt, this.sampleHz);
      core.clearBeatTracking();
      this.refs.set(inst.id, { core, buffer: [], lastRenderX: 0 });
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
        this.postWorker({ type: "setInstances", generation: this.bumpWorkerGeneration(), instances: this.instances });
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
  }

  /** Advance one frame for a wall-clock timestamp (ms). Driver-agnostic. */
  tick(now: number) {
    const frameStart = this.nowMs();
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
      const instanceStart = this.nowMs();
      const core = phys.core as ModelCore;
      core.setImmediateParameters(inst.params);
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
      if (phys.core instanceof RemotePreviewCore) phys.core.update(message.snapshot);
      phys.isSettling = message.settling;
      phys.settleProgress = Math.min(1, Math.max(0, message.actualSeconds / PREVIEW_SETTLE_POLICY.capSeconds));
      if (!message.settling) phys.buffer = [];
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
      if (!phys || !inst) continue;
      if (item.snapshot && phys.core instanceof RemotePreviewCore) {
        phys.core.update(item.snapshot);
      } else if (phys.core instanceof RemotePreviewCore) {
        phys.core.updateClock(item.t, inst.params);
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
