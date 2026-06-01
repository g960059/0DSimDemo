import { ModelCore } from "@/engine/ModelCore";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import type { SimulationHealth, SimulationHealthStatus } from "@/engine/protocol";
import type { PhysicsRefState, SimInstance } from "@/types";

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
};

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

  private readonly dt: number;
  private readonly sampleHz: number;
  private readonly bufferRetentionSec: number;
  private readonly healthThrottleMs: number;

  // Host callbacks (all optional). Fire from the loop, not from React.
  onHealthChange?: (health: Record<string, SimulationHealth>) => void;
  onToasts?: (toasts: PreviewToast[]) => void;
  onInstancesAdded?: (ids: string[]) => void;

  constructor(opts: PreviewControllerOptions = {}) {
    this.dt = opts.dt ?? 0.001;
    this.sampleHz = opts.sampleHz ?? 120;
    this.bufferRetentionSec = opts.bufferRetentionSec ?? 20;
    this.healthThrottleMs = opts.healthThrottleMs ?? 500;
  }

  setTimeScale(v: number) {
    this.timeScale = v;
  }

  setPlaying(v: boolean) {
    this.playing = v;
  }

  /** Reconcile live cores with the instance list: create new, drop removed. */
  setInstances(instances: SimInstance[]) {
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

  /**
   * Reset selected existing instances to a clean, settled operating point.
   * Used at lesson step boundaries after params change; ordinary live knob
   * edits still merge smoothly through setImmediateParameters in tick().
   */
  resetInstances(ids: string[]) {
    if (ids.length === 0) return;
    const targets = new Set(ids);
    for (const inst of this.instances) {
      if (!targets.has(inst.id)) continue;
      const current = this.refs.get(inst.id);
      if (!current) continue;
      const core = new ModelCore(inst.params);
      core.initializeVenousPressuresForTargetTBV(inst.targetVolume);
      core.settleToSteady(PREVIEW_SETTLE_POLICY, this.dt, this.sampleHz);
      core.t = current.core.t;
      core.clearBeatTracking();
      this.refs.set(inst.id, { core, buffer: [], lastRenderX: 0 });
      delete this.prevStatus[inst.id];
    }
    this.healthSig = "";
    this.lastFrameTime = 0;
  }

  setInstanceVolume(id: string, vol: number) {
    this.refs.get(id)?.core.initializeVenousPressuresForTargetTBV(vol);
  }

  getLiveHealth(id: string): SimulationHealth | undefined {
    return this.refs.get(id)?.core.health();
  }

  /** Begin the browser rAF loop. No-op outside the browser or if already running. */
  start() {
    if (this.running || typeof requestAnimationFrame === "undefined") return;
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
  }

  /** Advance one frame for a wall-clock timestamp (ms). Driver-agnostic. */
  tick(now: number) {
    if (!this.lastFrameTime) this.lastFrameTime = now;
    let deltaTimeMs = now - this.lastFrameTime;
    this.lastFrameTime = now; // updated even while paused, so resume doesn't jump
    if (!this.playing) return;
    if (deltaTimeMs > 100) deltaTimeMs = 100;
    const simSeconds = (deltaTimeMs / 1000) * this.timeScale;

    for (const inst of this.instances) {
      const phys = this.refs.get(inst.id);
      if (!phys) continue;
      phys.core.setImmediateParameters(inst.params);
      const samples = phys.core.runFor(simSeconds, this.dt, this.sampleHz);
      phys.buffer.push(...samples);
      const cutoffTime = phys.core.t - this.bufferRetentionSec;
      while (phys.buffer.length > 0 && phys.buffer[0].t < cutoffTime) {
        phys.buffer.shift();
      }
    }

    if (now - this.lastHealthAt > this.healthThrottleMs) {
      this.lastHealthAt = now;
      this.updateHealth(now);
    }
  }

  // Throttled: only fires onHealthChange when a status signature changes (so a
  // healthy steady state triggers zero host re-renders), and only toasts on a
  // genuine in-session worsening transition.
  private updateHealth(now: number) {
    const rank: Record<SimulationHealthStatus, number> = { ok: 0, warning: 1, failed: 2 };
    const map: Record<string, SimulationHealth> = {};
    const toasts: PreviewToast[] = [];
    let sig = "";
    for (const inst of this.instances) {
      const phys = this.refs.get(inst.id);
      if (!phys) continue;
      const h = phys.core.health();
      map[inst.id] = h;
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
