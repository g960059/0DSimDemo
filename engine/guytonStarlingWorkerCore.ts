import { ModelCore, type RetargetTBVStatus } from "@/engine/ModelCore";
import {
  buildCommittedGuytonPaneData,
  type GuytonBaseMapResponse,
  type GuytonCurvePoint,
  type GuytonStarlingWorkerMessage,
  type StarlingSweepRequest,
  type StarlingSweepWorkerMessage,
} from "@/engine/guytonStarling";
import { clamp } from "@/engine/math";
import { PREVIEW_SETTLE_POLICY, type SettleStatus } from "@/engine/settling";
import type { SerializedModelState } from "@/engine/stateContract";

type WorkerComputeFns = {
  buildBaseline?: (req: StarlingSweepRequest) => WorkerSettledCore;
  buildBaseMapResponse?: (req: StarlingSweepRequest, baseline?: WorkerSettledCore) => GuytonBaseMapResponse;
  buildStarlingSweepResponse?: (req: StarlingSweepRequest, baseline?: WorkerSettledCore) => StarlingSweepWorkerMessage;
};

type WorkerPostMessage = (message: GuytonStarlingWorkerMessage) => void;

type WorkerSettledCore = {
  core: ModelCore;
  settle: SettleStatus;
  metrics: ReturnType<ModelCore["metrics"]>;
  observables: ReturnType<ModelCore["debugObservables"]>;
  health: ReturnType<ModelCore["health"]>;
  state: SerializedModelState;
  targetVolumeMl: number;
  wallMs: number;
  source: "cold" | "warm-retarget" | "warm-retarget-fallback";
  retarget?: RetargetTBVStatus;
  retargetFallback: boolean;
};

type WarmStartedSweepRuns = {
  runs: WorkerSettledCore[];
  positiveChainMs: number;
  negativeChainMs: number;
  retargetFallbackCount: number;
};

const WORKER_DT = 0.001;
const WORKER_SAMPLE_HZ = 60;
const WORKER_HISTORY_LIMIT = 720;
const WORKER_SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 };
const WORKER_RUN_OPTIONS = {
  collectSamples: false,
  recordHistory: true,
  historyLimit: WORKER_HISTORY_LIMIT,
};

export function buildGuytonStarlingWorkerMessages(
  req: StarlingSweepRequest,
  fns: WorkerComputeFns = {},
): GuytonStarlingWorkerMessage[] {
  const messages: GuytonStarlingWorkerMessage[] = [];
  postGuytonStarlingWorkerMessages(req, (message) => messages.push(message), fns);
  return messages;
}

export function postGuytonStarlingWorkerMessages(
  req: StarlingSweepRequest,
  postMessage: WorkerPostMessage,
  fns: WorkerComputeFns = {},
): void {
  let baseline: WorkerSettledCore | undefined;
  try {
    if (!fns.buildBaseMapResponse) baseline = (fns.buildBaseline ?? buildWorkerBaseline)(req);
    postMessage((fns.buildBaseMapResponse ?? buildGuytonBaseMapResponse)(req, baseline));
  } catch (err) {
    postMessage(buildGuytonBaseMapErrorResponse(req, err));
  }

  try {
    if (!baseline && !fns.buildStarlingSweepResponse) baseline = (fns.buildBaseline ?? buildWorkerBaseline)(req);
    postMessage((fns.buildStarlingSweepResponse ?? buildStarlingSweepResponse)(req, baseline));
  } catch (err) {
    postMessage(buildStarlingSweepErrorResponse(req, err));
  }
}

export function buildGuytonBaseMapResponse(
  req: StarlingSweepRequest,
  baseline?: WorkerSettledCore,
): GuytonBaseMapResponse {
  const resolvedBaseline = baseline ?? buildWorkerBaseline(req);
  const baseMapStart = performanceNow();
  const { core, metrics, observables, health, settle } = resolvedBaseline;
  const warnings: string[] = [];

  if (!settle.settled) warnings.push("base map: did not fully settle");
  if (health.status !== "ok") warnings.push(`base map: health ${health.status}`);
  if (resolvedBaseline.retargetFallback) warnings.push("base map: warm retarget fallback");

  const response: GuytonBaseMapResponse = {
    type: "base-map",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: buildCommittedGuytonPaneData(
      "right",
      metrics,
      observables,
      core.vascularReturnSnapshot("right"),
    ),
    left: buildCommittedGuytonPaneData(
      "left",
      metrics,
      observables,
      core.vascularReturnSnapshot("left"),
    ),
    warnings,
  };
  const baseMapMs = performanceNow() - baseMapStart;
  response.timing = {
    baselineMs: resolvedBaseline.wallMs,
    baseMapMs,
    totalMs: resolvedBaseline.wallMs + baseMapMs,
    baselineSource: resolvedBaseline.source,
  };
  return response;
}

export function buildStarlingSweepResponse(
  req: StarlingSweepRequest,
  baseline?: WorkerSettledCore,
): StarlingSweepWorkerMessage {
  const resolvedBaseline = baseline ?? buildWorkerBaseline(req);
  const sweepStart = performanceNow();
  const warm = buildWarmStartedSweepRuns(req, resolvedBaseline);
  return buildSweepResponseFromRuns(req, warm.runs, {
    positiveChainMs: warm.positiveChainMs,
    negativeChainMs: warm.negativeChainMs,
    retargetFallbackCount: warm.retargetFallbackCount,
    sweepStart,
  });
}

export function buildColdStarlingSweepResponse(req: StarlingSweepRequest): StarlingSweepWorkerMessage {
  const deltas = req.deltasMl ?? [-600, -300, 0, 300, 600];
  return buildSweepResponseFromRuns(
    req,
    deltas.map((delta) => settleWorkerCore(req, clamp(req.targetVolumeMl + delta, 2500, 8500))),
  );
}

function buildWorkerBaseline(req: StarlingSweepRequest): WorkerSettledCore {
  return settleWorkerCore(req, clamp(req.targetVolumeMl, 2500, 8500));
}

function settleWorkerCore(
  req: StarlingSweepRequest,
  targetVolumeMl: number,
  seedState?: SerializedModelState,
): WorkerSettledCore {
  const started = performanceNow();
  const core = new ModelCore(req.params);
  let source: WorkerSettledCore["source"] = "cold";
  let retarget: RetargetTBVStatus | undefined;
  let retargetFallback = false;
  if (seedState) {
    core.unpackState(seedState);
    retarget = core.retargetTBVFromCurrentState(targetVolumeMl);
    if (retarget.ok) {
      source = "warm-retarget";
    } else {
      retargetFallback = true;
      source = "warm-retarget-fallback";
      core.initializeVenousPressuresForTargetTBV(targetVolumeMl);
    }
  } else {
    core.initializeVenousPressuresForTargetTBV(targetVolumeMl);
  }
  const settle = core.settleToSteady(
    WORKER_SETTLE_POLICY,
    WORKER_DT,
    WORKER_SAMPLE_HZ,
    WORKER_RUN_OPTIONS,
  );
  const metrics = core.metrics();
  const observables = core.debugObservables();
  const health = core.health();

  return {
    core,
    settle,
    metrics,
    observables,
    health,
    state: core.packState(),
    targetVolumeMl,
    wallMs: performanceNow() - started,
    source,
    retarget,
    retargetFallback,
  };
}

function buildWarmStartedSweepRuns(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
): WarmStartedSweepRuns {
  const deltas = req.deltasMl ?? [-600, -300, 0, 300, 600];
  const runs = new Map<number, WorkerSettledCore>();
  runs.set(0, baseline);

  const solveChain = (chainDeltas: number[]) => {
    let seedState = baseline.state;
    for (const delta of chainDeltas) {
      const run = settleWorkerCore(req, clamp(req.targetVolumeMl + delta, 2500, 8500), seedState);
      runs.set(delta, run);
      seedState = run.state;
    }
  };

  const uniqueNonZero = Array.from(new Set(deltas.filter((delta) => delta !== 0)));
  const positiveStart = performanceNow();
  solveChain(uniqueNonZero.filter((delta) => delta > 0).sort((a, b) => a - b));
  const positiveChainMs = performanceNow() - positiveStart;
  const negativeStart = performanceNow();
  solveChain(uniqueNonZero.filter((delta) => delta < 0).sort((a, b) => Math.abs(a) - Math.abs(b)));
  const negativeChainMs = performanceNow() - negativeStart;

  const orderedRuns = deltas.map((delta) => {
    const run = runs.get(delta);
    if (!run) throw new Error(`Missing warm-start sweep run for delta ${String(delta)}`);
    return run;
  });
  return {
    runs: orderedRuns,
    positiveChainMs,
    negativeChainMs,
    retargetFallbackCount: orderedRuns.filter((run) => run.retargetFallback).length,
  };
}

function buildSweepResponseFromRuns(
  req: StarlingSweepRequest,
  runs: WorkerSettledCore[],
  timingInput?: {
    positiveChainMs: number;
    negativeChainMs: number;
    retargetFallbackCount: number;
    sweepStart: number;
  },
): StarlingSweepWorkerMessage {
  const assembleStart = performanceNow();
  const deltas = req.deltasMl ?? [-600, -300, 0, 300, 600];
  const right: GuytonCurvePoint[] = [];
  const left: GuytonCurvePoint[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < deltas.length; i++) {
    const delta = deltas[i];
    const run = runs[i];
    const { metrics, health, settle } = run;
    const label = `${delta >= 0 ? "+" : ""}${Math.round(delta)} mL`;

    if (!settle.settled) warnings.push(`${label}: sweep point did not fully settle`);
    if (health.status !== "ok") warnings.push(`${label}: health ${health.status}`);
    if (run.retargetFallback) warnings.push(`${label}: warm retarget fallback`);

    right.push({
      x: metrics.RAPMean,
      y: metrics.CO_R,
      label,
      settled: settle.settled,
      status: health.status,
      deltaVolumeMl: delta,
    });
    left.push({
      x: metrics.LAPMean,
      y: metrics.CO_L,
      label,
      settled: settle.settled,
      status: health.status,
      deltaVolumeMl: delta,
    });
  }

  right.sort((a, b) => a.x - b.x);
  left.sort((a, b) => a.x - b.x);

  const response: StarlingSweepWorkerMessage = {
    type: "starling-sweep",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: { side: "right", points: right, warnings },
    left: { side: "left", points: left, warnings },
    warnings,
  };
  if (timingInput) {
    response.timing = {
      positiveChainMs: timingInput.positiveChainMs,
      negativeChainMs: timingInput.negativeChainMs,
      assembleMs: performanceNow() - assembleStart,
      totalMs: performanceNow() - timingInput.sweepStart,
      retargetFallbackCount: timingInput.retargetFallbackCount,
    };
  }
  return response;
}

export function buildGuytonBaseMapErrorResponse(
  req: StarlingSweepRequest,
  err: unknown,
): GuytonBaseMapResponse {
  return {
    type: "base-map",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    warnings: [],
    error: err instanceof Error ? err.message : "Unknown Guyton base map failure",
  };
}

export function buildStarlingSweepErrorResponse(
  req: StarlingSweepRequest,
  err: unknown,
): StarlingSweepWorkerMessage {
  return {
    type: "starling-sweep",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    warnings: [],
    error: err instanceof Error ? err.message : "Unknown Starling sweep failure",
  };
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}
