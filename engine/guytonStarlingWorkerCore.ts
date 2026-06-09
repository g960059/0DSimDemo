import { ModelCore, type RetargetTBVStatus } from "@/engine/ModelCore";
import {
  buildCommittedGuytonPaneData,
  type GuytonBaseMapResponse,
  type GuytonCurvePoint,
  type GuytonStarlingWorkerMessage,
  type StarlingSweepCurve,
  type StarlingSweepProgressMessage,
  type StarlingSweepRequest,
  type StarlingSweepWorkerMessage,
} from "@/engine/guytonStarling";
import type {
  GuytonChainId,
  GuytonChainRunResult,
  GuytonChainWorkerMessage,
  GuytonChainWorkerRequest,
  GuytonChainWorkerResponse,
  GuytonWorkerSettledRun,
} from "@/engine/guytonStarlingChainProtocol";
import type { VascularReturnSnapshot } from "@/engine/guytonVascular";
import { clamp } from "@/engine/math";
import type { SimMetrics } from "@/engine/protocol";
import { buildStarlingSweepFit } from "@/engine/starlingFit";
import { PREVIEW_SETTLE_POLICY, type SettleStatus } from "@/engine/settling";
import type { SerializedModelState } from "@/engine/stateContract";

type WorkerComputeFns = {
  buildBaseline?: (req: StarlingSweepRequest) => WorkerSettledCore;
  buildBaseMapResponse?: (req: StarlingSweepRequest, baseline?: WorkerSettledCore) => GuytonBaseMapResponse;
  buildStarlingSweepResponse?: (req: StarlingSweepRequest, baseline?: WorkerSettledCore) => StarlingSweepWorkerMessage;
};

type WorkerPostMessage = (message: GuytonStarlingWorkerMessage) => void;

export type GuytonChainWorkerLike = {
  onmessage: ((event: MessageEvent<GuytonChainWorkerMessage>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (request: GuytonChainWorkerRequest) => void;
  terminate: () => void;
};

type AsyncWorkerOptions = {
  createChainWorker?: () => GuytonChainWorkerLike;
  chainTimeoutMs?: number;
  onProgress?: (message: StarlingSweepProgressMessage) => void;
};

type WorkerSettledCore = GuytonWorkerSettledRun & {
  core: ModelCore;
};

type WarmStartedSweepRuns = {
  runs: GuytonWorkerSettledRun[];
  positiveChainMs: number;
  negativeChainMs: number;
  retargetFallbackCount: number;
};

type SweepTimingInput = {
  positiveChainMs?: number;
  negativeChainMs?: number;
  retargetFallbackCount?: number;
  sweepStart?: number;
  deltasMl?: number[];
  includeExtrapolation?: boolean;
  parallel?: boolean;
  parallelFallback?: string;
  chainWallMs?: number;
};

type SweepDeltaChains = {
  positive: number[];
  negative: number[];
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
const DEFAULT_CHAIN_TIMEOUT_MS = 10_000;
export const STARLING_LOW_PRELOAD_DELTAS_ML = [-200, 0, 300, 600, 900, 1200, 1500] as const;
export const STARLING_NORMAL_PRELOAD_DELTAS_ML = [-900, -600, -300, 0, 300, 600, 900] as const;
export const STARLING_HIGH_PRELOAD_DELTAS_ML = [-1500, -1200, -900, -600, -300, 0, 300] as const;

export type StarlingSweepDeltaPolicy = "custom" | "low-preload" | "normal-preload" | "high-preload";

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

export async function postGuytonStarlingWorkerMessagesAsync(
  req: StarlingSweepRequest,
  postMessage: WorkerPostMessage,
  options: AsyncWorkerOptions = {},
): Promise<void> {
  let baseline: WorkerSettledCore | undefined;
  try {
    baseline = buildWorkerBaseline(req);
    postMessage(buildGuytonBaseMapResponse(req, baseline));
  } catch (err) {
    postMessage(buildGuytonBaseMapErrorResponse(req, err));
  }

  try {
    if (!baseline) baseline = buildWorkerBaseline(req);
    postMessage(await buildParallelStarlingSweepResponse(req, baseline, {
      ...options,
      onProgress: postMessage,
    }));
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
  const rightSnapshot = baseMapVascularSnapshot(core, "right", warnings);
  const leftSnapshot = baseMapVascularSnapshot(core, "left", warnings);

  const response: GuytonBaseMapResponse = {
    type: "base-map",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: buildCommittedGuytonPaneData(
      "right",
      metrics,
      observables,
      rightSnapshot,
    ),
    left: buildCommittedGuytonPaneData(
      "left",
      metrics,
      observables,
      leftSnapshot,
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

function baseMapVascularSnapshot(
  core: ModelCore,
  side: VascularReturnSnapshot["side"],
  warnings: string[],
): VascularReturnSnapshot {
  try {
    return core.vascularReturnSnapshot(side, {
      mode: "cycle-mean",
      dt: WORKER_DT,
      sampleHz: WORKER_SAMPLE_HZ,
    });
  } catch {
    warnings.push(`${side} cycle-mean snapshot fallback`);
    return core.vascularReturnSnapshot(side);
  }
}

export function buildStarlingSweepResponse(
  req: StarlingSweepRequest,
  baseline?: WorkerSettledCore,
): StarlingSweepWorkerMessage {
  const resolvedBaseline = baseline ?? buildWorkerBaseline(req);
  const deltas = resolveStarlingSweepDeltas(req, resolvedBaseline);
  const sweepStart = performanceNow();
  const warm = buildWarmStartedSweepRuns(req, resolvedBaseline, deltas);
  return buildSweepResponseFromRuns(req, warm.runs, {
    positiveChainMs: warm.positiveChainMs,
    negativeChainMs: warm.negativeChainMs,
    retargetFallbackCount: warm.retargetFallbackCount,
    sweepStart,
    deltasMl: deltas,
  });
}

export async function buildParallelStarlingSweepResponse(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
  options: AsyncWorkerOptions = {},
): Promise<StarlingSweepWorkerMessage> {
  const createChainWorker = options.createChainWorker;
  if (!createChainWorker) {
    return buildParallelFallbackSweepResponse(req, baseline, "chain worker unavailable");
  }

  const sweepStart = performanceNow();
  const chainStart = performanceNow();
  const deltas = resolveStarlingSweepDeltas(req, baseline);
  const chains = splitSweepDeltas(deltas);
  const runsByDelta = new Map<number, GuytonWorkerSettledRun>();
  runsByDelta.set(0, baseline);
  const emitProgress = () => {
    if (!options.onProgress || runsByDelta.size < 3) return;
    options.onProgress(buildSweepProgressMessage(req, runsByDelta, deltas));
  };
  try {
    const [positive, negative] = await Promise.all([
      runChain(req, baseline.state, "positive", chains.positive, createChainWorker, options.chainTimeoutMs, (result) => {
        runsByDelta.set(result.deltaVolumeMl, result.run);
        emitProgress();
      }),
      runChain(req, baseline.state, "negative", chains.negative, createChainWorker, options.chainTimeoutMs, (result) => {
        runsByDelta.set(result.deltaVolumeMl, result.run);
        emitProgress();
      }),
    ]);
    const chainWallMs = performanceNow() - chainStart;
    for (const result of [...positive.runs, ...negative.runs]) {
      runsByDelta.set(result.deltaVolumeMl, result.run);
    }
    const orderedRuns = deltas.map((delta) => {
      const run = runsByDelta.get(delta);
      if (!run) throw new Error(`Missing parallel sweep run for delta ${String(delta)}`);
      return run;
    });
    return buildSweepResponseFromRuns(req, orderedRuns, {
      positiveChainMs: positive.chainMs,
      negativeChainMs: negative.chainMs,
      retargetFallbackCount: positive.retargetFallbackCount + negative.retargetFallbackCount,
      sweepStart,
      deltasMl: deltas,
      parallel: true,
      chainWallMs,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "parallel chain failed";
    return buildParallelFallbackSweepResponse(req, baseline, reason, performanceNow() - chainStart);
  }
}

export function buildColdStarlingSweepResponse(req: StarlingSweepRequest): StarlingSweepWorkerMessage {
  const baseline = buildWorkerBaseline(req);
  const deltas = resolveStarlingSweepDeltas(req, baseline);
  return buildSweepResponseFromRuns(
    req,
    deltas.map((delta) => settleWorkerCore(req, clamp(req.targetVolumeMl + delta, 2500, 8500))),
    { deltasMl: deltas },
  );
}

export function buildWorkerBaseline(req: StarlingSweepRequest): WorkerSettledCore {
  return settleWorkerCore(req, clamp(req.targetVolumeMl, 2500, 8500));
}

export function resolveStarlingSweepDeltas(
  req: StarlingSweepRequest,
  baseline: Pick<WorkerSettledCore, "metrics" | "targetVolumeMl">,
): number[] {
  if (req.deltasMl?.length) return [...req.deltasMl];
  const policy = classifyStarlingSweepDeltaPolicy(baseline.metrics, baseline.targetVolumeMl);
  if (policy === "high-preload") return [...STARLING_HIGH_PRELOAD_DELTAS_ML];
  if (policy === "low-preload") return [...STARLING_LOW_PRELOAD_DELTAS_ML];
  return [...STARLING_NORMAL_PRELOAD_DELTAS_ML];
}

export function classifyStarlingSweepDeltaPolicy(
  metrics: Pick<SimMetrics, "RAPMean" | "LAPMean">,
  targetVolumeMl: number,
): Exclude<StarlingSweepDeltaPolicy, "custom"> {
  const highPreload = metrics.RAPMean > 10 || metrics.LAPMean > 14 || targetVolumeMl >= 6500;
  if (highPreload) return "high-preload";
  const lowPreload = metrics.RAPMean < 2 || metrics.LAPMean < 4 || targetVolumeMl <= 4800;
  if (lowPreload) return "low-preload";
  return "normal-preload";
}

export function settleWorkerCore(
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
  deltas: number[],
): WarmStartedSweepRuns {
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

export function buildSweepResponseFromRuns(
  req: StarlingSweepRequest,
  runs: GuytonWorkerSettledRun[],
  timingInput?: SweepTimingInput,
): StarlingSweepWorkerMessage {
  const assembleStart = performanceNow();
  const deltas = timingInput?.deltasMl ?? req.deltasMl ?? STARLING_NORMAL_PRELOAD_DELTAS_ML.slice();
  const curves = buildSweepCurvesFromRuns(req, runs, deltas, timingInput?.includeExtrapolation ?? true);
  const response: StarlingSweepWorkerMessage = {
    type: "starling-sweep",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: curves.right,
    left: curves.left,
    warnings: curves.warnings,
  };
  if (timingInput?.sweepStart !== undefined) {
    response.timing = {
      positiveChainMs: timingInput.positiveChainMs ?? 0,
      negativeChainMs: timingInput.negativeChainMs ?? 0,
      assembleMs: performanceNow() - assembleStart,
      totalMs: performanceNow() - timingInput.sweepStart,
      retargetFallbackCount: timingInput.retargetFallbackCount ?? 0,
      parallel: timingInput.parallel,
      parallelFallback: timingInput.parallelFallback,
      chainWallMs: timingInput.chainWallMs,
    };
  }
  return response;
}

function buildSweepProgressMessage(
  req: StarlingSweepRequest,
  runsByDelta: Map<number, GuytonWorkerSettledRun>,
  deltas: number[],
): StarlingSweepProgressMessage {
  const completedDeltas = deltas.filter((delta) => runsByDelta.has(delta));
  const runs = completedDeltas.map((delta) => {
    const run = runsByDelta.get(delta);
    if (!run) throw new Error(`Missing progress sweep run for delta ${String(delta)}`);
    return run;
  });
  const curves = buildSweepCurvesFromRuns(req, runs, completedDeltas, false);
  return {
    type: "starling-sweep-progress",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: curves.right,
    left: curves.left,
    warnings: curves.warnings,
    completedPoints: completedDeltas.length,
    totalPoints: deltas.length,
  };
}

function buildSweepCurvesFromRuns(
  req: StarlingSweepRequest,
  runs: GuytonWorkerSettledRun[],
  deltas: readonly number[],
  includeExtrapolation: boolean,
): { right: StarlingSweepCurve; left: StarlingSweepCurve; warnings: string[] } {
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

  return {
    right: {
      side: "right",
      points: right,
      fit: buildStarlingSweepFit("right", right, { includeExtrapolation }),
      warnings,
    },
    left: {
      side: "left",
      points: left,
      fit: buildStarlingSweepFit("left", left, { includeExtrapolation }),
      warnings,
    },
    warnings,
  };
}

function buildParallelFallbackSweepResponse(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
  reason: string,
  chainWallMs = 0,
): StarlingSweepWorkerMessage {
  const response = buildStarlingSweepResponse(req, baseline);
  response.warnings.push(`parallel chain fallback: ${reason}`);
  if (response.timing) {
    response.timing.parallel = false;
    response.timing.parallelFallback = reason;
    response.timing.chainWallMs = chainWallMs;
  }
  return response;
}

function splitSweepDeltas(deltas: number[]): SweepDeltaChains {
  const uniqueNonZero = Array.from(new Set(deltas.filter((delta) => delta !== 0)));
  return {
    positive: uniqueNonZero.filter((delta) => delta > 0).sort((a, b) => a - b),
    negative: uniqueNonZero.filter((delta) => delta < 0).sort((a, b) => Math.abs(a) - Math.abs(b)),
  };
}

function runChain(
  req: StarlingSweepRequest,
  baselineState: SerializedModelState,
  chainId: GuytonChainId,
  chainDeltas: number[],
  createChainWorker: () => GuytonChainWorkerLike,
  timeoutMs = DEFAULT_CHAIN_TIMEOUT_MS,
  onProgress?: (result: GuytonChainRunResult) => void,
): Promise<GuytonChainWorkerResponse> {
  if (chainDeltas.length === 0) {
    return Promise.resolve({
      type: "chain-result",
      chainId,
      requestId: req.requestId,
      signature: req.signature,
      instanceId: req.instanceId,
      runs: [],
      chainMs: 0,
      retargetFallbackCount: 0,
    });
  }

  const request: GuytonChainWorkerRequest = {
    type: "solve-chain",
    chainId,
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    params: req.params,
    targetVolumeMl: req.targetVolumeMl,
    baselineState,
    chainDeltas,
  };

  return new Promise((resolve, reject) => {
    let worker: GuytonChainWorkerLike | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let finished = false;

    const finish = (fn: () => void) => {
      if (finished) return;
      finished = true;
      if (timeout) clearTimeout(timeout);
      worker?.terminate();
      fn();
    };

    try {
      worker = createChainWorker();
    } catch (err) {
      reject(err instanceof Error ? err : new Error("chain worker creation failed"));
      return;
    }
    const activeWorker = worker;

    timeout = setTimeout(() => {
      finish(() => reject(new Error(`chain worker ${chainId} timed out`)));
    }, timeoutMs);

    activeWorker.onmessage = (event: MessageEvent<GuytonChainWorkerMessage>) => {
      const response = event.data;
      if (response.type === "chain-progress") {
        if (!isMatchingChainProgress(response, request)) {
          finish(() => reject(new Error(`invalid ${chainId} chain progress`)));
          return;
        }
        onProgress?.(response.result);
        return;
      }
      if (!isMatchingChainResponse(response, request)) {
        finish(() => reject(new Error(`invalid ${chainId} chain response`)));
        return;
      }
      if (response.error) {
        finish(() => reject(new Error(response.error)));
        return;
      }
      finish(() => resolve(response));
    };
    activeWorker.onerror = (event: ErrorEvent) => {
      finish(() => reject(new Error(event.message || `${chainId} chain worker failed`)));
    };
    activeWorker.postMessage(request);
  });
}

function isMatchingChainProgress(
  response: unknown,
  request: GuytonChainWorkerRequest,
): response is Extract<GuytonChainWorkerMessage, { type: "chain-progress" }> {
  if (!response || typeof response !== "object") return false;
  const candidate = response as Partial<Extract<GuytonChainWorkerMessage, { type: "chain-progress" }>>;
  return candidate.type === "chain-progress"
    && candidate.chainId === request.chainId
    && candidate.requestId === request.requestId
    && candidate.signature === request.signature
    && candidate.instanceId === request.instanceId
    && typeof candidate.completedInChain === "number"
    && typeof candidate.totalInChain === "number"
    && !!candidate.result
    && typeof candidate.result.deltaVolumeMl === "number";
}

function isMatchingChainResponse(
  response: unknown,
  request: GuytonChainWorkerRequest,
): response is GuytonChainWorkerResponse {
  if (!response || typeof response !== "object") return false;
  const candidate = response as Partial<GuytonChainWorkerResponse>;
  return candidate.type === "chain-result"
    && candidate.chainId === request.chainId
    && candidate.requestId === request.requestId
    && candidate.signature === request.signature
    && candidate.instanceId === request.instanceId
    && Array.isArray(candidate.runs)
    && typeof candidate.chainMs === "number"
    && Number.isFinite(candidate.chainMs)
    && typeof candidate.retargetFallbackCount === "number";
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
