import { ModelCore } from "@/engine/ModelCore";
import {
  MODELCORE_RUNTIME_USER0_STAGED_DEFAULT_MODE,
  createModelCoreRuntimeExperimentalOptions,
  type ModelCoreRuntimeActiveSourceMode,
} from "@/engine/myocardium/runtimeActiveSource";
import type { SimInstance } from "@/types";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import type {
  PreviewCoreSnapshot,
  PreviewWorkerFrameInstance,
  PreviewWorkerRequest,
  PreviewWorkerResponse,
} from "@/engine/previewWorkerProtocol";

type WorkerCoreRecord = {
  core: ModelCore;
  inst: SimInstance;
  settling: boolean;
  settleToken: number;
  settleStartT: number;
  lastSnapshotNow: number;
  settleSignature: string;
};
type TransitionSteadyPromotionState = Extract<PreviewWorkerRequest, { type: "promoteTransitionSteady" }>["state"];

let dt = 0.001;
let sampleHz = 120;
let generation = 0;
let runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode = MODELCORE_RUNTIME_USER0_STAGED_DEFAULT_MODE;
let instances: SimInstance[] = [];
const records = new Map<string, WorkerCoreRecord>();

const post = (message: PreviewWorkerResponse) => {
  self.postMessage(message);
};

const nowMs = () => {
  const perf = globalThis.performance;
  return perf && typeof perf.now === "function" ? perf.now() : Date.now();
};

const instanceSignature = (inst: SimInstance): string => JSON.stringify({
  params: inst.params,
  targetVolume: inst.targetVolume,
  runtimeActiveSourceMode,
});

const snapshotCore = (core: ModelCore): PreviewCoreSnapshot => ({
  t: core.t,
  p: core.p,
  metrics: core.metrics(),
  health: core.health(),
  observables: core.debugObservables(),
  settleStatus: core.assessSteadyState(PREVIEW_SETTLE_POLICY),
});

const maxSettledT = (excludeId?: string): number => {
  let maxT = 0;
  for (const [id, record] of records) {
    if (id === excludeId || record.settling) continue;
    if (record.core.t > maxT) maxT = record.core.t;
  }
  return maxT;
};

const createRecord = (inst: SimInstance): WorkerCoreRecord => {
  const core = new ModelCore(inst.params, createModelCoreRuntimeExperimentalOptions({
    mode: runtimeActiveSourceMode,
    runtimeParams: inst.params,
  }));
  core.initializeVenousPressuresForTargetTBV(inst.targetVolume);
  return {
    core,
    inst,
    settling: false,
    settleToken: 0,
    settleStartT: core.t,
    lastSnapshotNow: -Infinity,
    settleSignature: instanceSignature(inst),
  };
};

const finishSettle = (
  id: string,
  record: WorkerCoreRecord,
  token: number,
  settleGeneration: number,
  settling: boolean,
  collectSampleSeconds = 0,
) => {
  if (record.settleToken !== token) return;
  const alignT = maxSettledT(id);
  if (alignT > record.core.t) {
    record.core.t = alignT;
    record.core.clearBeatTracking();
  }
  const samples = collectSampleSeconds > 0 ? record.core.runFor(collectSampleSeconds, dt, sampleHz) : undefined;
  record.settling = settling;
  record.lastSnapshotNow = nowMs();
  post({
    type: "settleProgress",
    generation: settleGeneration,
    id,
    snapshot: snapshotCore(record.core),
    actualSeconds: record.core.t - record.settleStartT,
    settling,
    ...(samples ? { samples } : {}),
  });
};

const startIncrementalSettle = (id: string, record: WorkerCoreRecord, settleGeneration: number) => {
  record.settling = true;
  record.settleStartT = record.core.t;
  const token = ++record.settleToken;

  const stepSettle = () => {
    if (record.settleToken !== token || !records.has(id)) return;

    const elapsed = record.core.t - record.settleStartT;
    const before = record.core.assessSteadyState(PREVIEW_SETTLE_POLICY);
    if (before.reason === "forced-trend") {
      finishSettle(id, record, token, settleGeneration, false);
      return;
    }
    if (before.settled) {
      const postBeatSeconds = (60 / Math.max(record.core.p.HR, 1)) * PREVIEW_SETTLE_POLICY.postSettleBeats;
      finishSettle(id, record, token, settleGeneration, false, postBeatSeconds);
      return;
    }
    if (elapsed >= PREVIEW_SETTLE_POLICY.capSeconds) {
      const fallbackBeatSeconds = 60 / Math.max(record.core.p.HR, 1);
      finishSettle(id, record, token, settleGeneration, false, fallbackBeatSeconds);
      return;
    }

    const sliceSeconds = Math.min(0.25, PREVIEW_SETTLE_POLICY.capSeconds - elapsed);
    record.core.runFor(sliceSeconds, dt, sampleHz);
    record.lastSnapshotNow = nowMs();
    post({
      type: "settleProgress",
      generation: settleGeneration,
      id,
      snapshot: snapshotCore(record.core),
      actualSeconds: record.core.t - record.settleStartT,
      settling: true,
    });
    setTimeout(stepSettle, 0);
  };

  setTimeout(stepSettle, 0);
};

const reconcileInstances = (nextInstances: SimInstance[]) => {
  instances = nextInstances;
  const ids = new Set(nextInstances.map((inst) => inst.id));
  for (const [id, record] of records) {
    if (!ids.has(id)) {
      record.settleToken++;
      records.delete(id);
    }
  }

  for (const inst of nextInstances) {
    const sig = instanceSignature(inst);
    const existing = records.get(inst.id);
    if (!existing) {
      const record = createRecord(inst);
      records.set(inst.id, record);
      startIncrementalSettle(inst.id, record, generation);
      continue;
    }

    if (existing.settleSignature !== sig) {
      existing.settleToken++;
      const record = createRecord(inst);
      records.set(inst.id, record);
      startIncrementalSettle(inst.id, record, generation);
      continue;
    }
    existing.inst = inst;
  }
};

const resetInstances = (ids: string[]) => {
  const targets = new Set(ids);
  for (const inst of instances) {
    if (!targets.has(inst.id)) continue;
    const existing = records.get(inst.id);
    if (existing) existing.settleToken++;
    const record = createRecord(inst);
    records.set(inst.id, record);
    startIncrementalSettle(inst.id, record, generation);
  }
};

const setInstanceVolume = (id: string, volume: number) => {
  const record = records.get(id);
  if (!record) return;
  record.core.initializeVenousPressuresForTargetTBV(volume);
  record.core.clearBeatTracking();
  record.lastSnapshotNow = -Infinity;
};

const promoteTransitionSteady = (
  inst: SimInstance,
  state: TransitionSteadyPromotionState,
  mode: Extract<
    PreviewWorkerRequest,
    { type: "promoteTransitionSteady" }
  >["runtimeActiveSourceMode"],
  experimentalActiveProviderStates?: Extract<
    PreviewWorkerRequest,
    { type: "promoteTransitionSteady" }
  >["experimentalActiveProviderStates"],
) => {
  runtimeActiveSourceMode = mode;
  const existing = records.get(inst.id);
  if (existing) existing.settleToken++;
  const core = new ModelCore(inst.params, createModelCoreRuntimeExperimentalOptions({
    mode: runtimeActiveSourceMode,
    runtimeParams: inst.params,
  }));
  core.unpackState(state);
  core.restoreExperimentalActiveProviderRuntimeState(experimentalActiveProviderStates);
  records.set(inst.id, {
    core,
    inst,
    settling: false,
    settleToken: 0,
    settleStartT: core.t,
    lastSnapshotNow: -Infinity,
    settleSignature: instanceSignature(inst),
  });
  const found = instances.findIndex((candidate) => candidate.id === inst.id);
  if (found >= 0) {
    instances = instances.map((candidate) => candidate.id === inst.id ? inst : candidate);
  } else {
    instances = [...instances, inst];
  }
};

const runTick = (requestGeneration: number, requestId: number, now: number, simSeconds: number) => {
  const started = nowMs();
  let sampleCount = 0;
  let settlingCount = 0;
  const out: PreviewWorkerFrameInstance[] = [];

  for (const inst of instances) {
    const record = records.get(inst.id);
    if (!record) continue;

    if (record.settling) {
      settlingCount++;
      out.push({ id: inst.id, t: record.core.t, samples: [], settling: true });
      continue;
    }

    record.core.setImmediateParameters(inst.params);
    const samples = record.core.runFor(simSeconds, dt, sampleHz);
    sampleCount += samples.length;

    const shouldSnapshot = record.lastSnapshotNow < 0 || now - record.lastSnapshotNow >= 250;
    let snapshot: PreviewCoreSnapshot | undefined;
    if (shouldSnapshot) {
      record.lastSnapshotNow = now;
      snapshot = snapshotCore(record.core);
    }
    out.push({
      id: inst.id,
      t: record.core.t,
      samples,
      settling: false,
      ...(snapshot ? { snapshot } : {}),
    });
  }

  post({
    type: "frame",
    generation: requestGeneration,
    requestId,
    now,
    instances: out,
    perf: {
      coreWallMs: nowMs() - started,
      samples: sampleCount,
      instanceCount: instances.length,
      settlingCount,
    },
  });
};

self.onmessage = (event: MessageEvent<PreviewWorkerRequest>) => {
  try {
    const message = event.data;
    switch (message.type) {
      case "configure":
        dt = message.dt;
        sampleHz = message.sampleHz;
        runtimeActiveSourceMode = message.runtimeActiveSourceMode;
        break;
      case "setInstances":
        generation = message.generation;
        runtimeActiveSourceMode = message.runtimeActiveSourceMode;
        reconcileInstances(message.instances);
        break;
      case "resetInstances":
        generation = message.generation;
        runtimeActiveSourceMode = message.runtimeActiveSourceMode;
        resetInstances(message.ids);
        break;
      case "setInstanceVolume":
        generation = message.generation;
        setInstanceVolume(message.id, message.volume);
        break;
      case "promoteTransitionSteady":
        generation = message.generation;
        promoteTransitionSteady(
          message.instance,
          message.state,
          message.runtimeActiveSourceMode,
          message.experimentalActiveProviderStates,
        );
        break;
      case "tick":
        runTick(message.generation, message.requestId, message.now, message.simSeconds);
        break;
    }
  } catch (err) {
    post({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
};
