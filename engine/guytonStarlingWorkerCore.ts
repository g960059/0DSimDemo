import { ModelCore, type RetargetTBVStatus } from "@/engine/ModelCore";
import {
  buildCommittedGuytonPaneData,
  type GuytonBaseMapResponse,
  type GuytonCurvePoint,
  type GuytonPaneData,
  type GuytonStarlingWorkerMessage,
  type StarlingCalibrationSummary,
  type StarlingSweepMode,
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
  createChainWorker?: (chainId: GuytonChainId) => GuytonChainWorkerLike;
  chainTimeoutMs?: number;
  onProgress?: (message: StarlingSweepProgressMessage) => void;
  persistentChainWorkers?: boolean;
  onChainWorkerFailure?: (chainId: GuytonChainId) => void;
  isCancelled?: () => boolean;
};

type WorkerSettledCore = GuytonWorkerSettledRun & {
  core: ModelCore;
  calibratedFallbackReasons?: string[];
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
  plannedPointCount?: number;
  mode?: StarlingSweepMode | "full7-fallback" | "full7-reference";
  anchorDeltasMl?: number[];
  fullDeltasMl?: number[];
  fallbackReasons?: string[];
  full7ReferenceMs?: number;
  holdoutMaxFlowErrorLMin?: number;
};

type SweepDeltaChains = {
  positive: number[];
  negative: number[];
};

type SweepPlan = {
  mode: StarlingSweepMode;
  deltasMl: number[];
  fullDeltasMl: number[];
  anchorDeltasMl: number[];
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
const CANCELLED_MESSAGE = "Guyton/Starling request superseded";
const STARLING_DISPLAY_RELIABLE_SHAPE_SIGNALS = new Set([
  "aopSys", "aopDia", "papSys", "papDia", "esvL", "esvR", "lvEdp", "rvEdp",
]);
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
    if (isRequestCancelled(options)) return;
    postMessage(buildGuytonBaseMapResponse(req, baseline));
  } catch (err) {
    if (isRequestCancelled(options)) return;
    postMessage(buildGuytonBaseMapErrorResponse(req, err));
  }

  try {
    if (isRequestCancelled(options)) return;
    if (!baseline) baseline = buildWorkerBaseline(req);
    const response = await buildParallelStarlingSweepResponse(req, baseline, {
      ...options,
      onProgress: (message) => {
        if (!isRequestCancelled(options)) postMessage(message);
      },
    });
    if (!isRequestCancelled(options)) postMessage(response);
  } catch (err) {
    if (!isRequestCancelled(options) && !isCancellationError(err)) {
      postMessage(buildStarlingSweepErrorResponse(req, err));
    }
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

  const rightPane = buildCommittedGuytonPaneData(
    "right",
    metrics,
    observables,
    rightSnapshot,
  );
  const leftPane = buildCommittedGuytonPaneData(
    "left",
    metrics,
    observables,
    leftSnapshot,
  );
  resolvedBaseline.calibratedFallbackReasons = calibratedResidualFallbackReasons({ right: rightPane, left: leftPane });

  const response: GuytonBaseMapResponse = {
    type: "base-map",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: rightPane,
    left: leftPane,
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
  const plan = resolveStarlingSweepPlan(req, resolvedBaseline);
  const sweepStart = performanceNow();
  const warm = buildWarmStartedSweepRuns(req, resolvedBaseline, plan.deltasMl);
  const response = buildSweepResponseFromRuns(req, warm.runs, {
    positiveChainMs: warm.positiveChainMs,
    negativeChainMs: warm.negativeChainMs,
    retargetFallbackCount: warm.retargetFallbackCount,
    sweepStart,
    deltasMl: plan.deltasMl,
    plannedPointCount: plan.fullDeltasMl.length,
    mode: plan.mode,
    anchorDeltasMl: plan.anchorDeltasMl,
    fullDeltasMl: plan.fullDeltasMl,
    fallbackReasons: resolvedBaseline.calibratedFallbackReasons,
  });
  return maybeFallbackToFull7(req, resolvedBaseline, response, plan);
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
  const plan = resolveStarlingSweepPlan(req, baseline);
  const deltas = plan.deltasMl;
  const chains = splitSweepDeltas(deltas);
  const runsByDelta = new Map<number, GuytonWorkerSettledRun>();
  runsByDelta.set(0, baseline);
  const emitProgress = () => {
    if (!options.onProgress || runsByDelta.size === 0 || isRequestCancelled(options)) return;
    options.onProgress(buildSweepProgressMessage(req, runsByDelta, deltas));
  };
  emitProgress();
  try {
    if (isRequestCancelled(options)) throw new CancellationError();
    const [positive, negative] = await Promise.all([
      runChain(req, baseline.state, "positive", chains.positive, createChainWorker, options.chainTimeoutMs, (result) => {
        runsByDelta.set(result.deltaVolumeMl, result.run);
        emitProgress();
      }, options),
      runChain(req, baseline.state, "negative", chains.negative, createChainWorker, options.chainTimeoutMs, (result) => {
        runsByDelta.set(result.deltaVolumeMl, result.run);
        emitProgress();
      }, options),
    ]);
    const chainWallMs = performanceNow() - chainStart;
    for (const result of [...positive.runs, ...negative.runs]) {
      runsByDelta.set(result.deltaVolumeMl, result.run);
    }
    const missingDeltas = deltas.filter((delta) => !runsByDelta.has(delta));
    if (missingDeltas.length > 0) {
      throw new Error(`Missing parallel sweep run for delta ${missingDeltas.map(String).join(",")}`);
    }
    const orderedRuns = deltas.map((delta) => {
      const run = runsByDelta.get(delta);
      if (!run) throw new Error(`Missing parallel sweep run for delta ${String(delta)}`);
      return run;
    });
    const response = buildSweepResponseFromRuns(req, orderedRuns, {
      positiveChainMs: positive.chainMs,
      negativeChainMs: negative.chainMs,
      retargetFallbackCount: positive.retargetFallbackCount + negative.retargetFallbackCount,
      sweepStart,
      deltasMl: deltas,
      parallel: true,
      chainWallMs,
      plannedPointCount: plan.fullDeltasMl.length,
      mode: plan.mode,
      anchorDeltasMl: plan.anchorDeltasMl,
      fullDeltasMl: plan.fullDeltasMl,
      fallbackReasons: baseline.calibratedFallbackReasons,
    });
    return maybeFallbackToFull7(req, baseline, response, plan);
  } catch (err) {
    if (isCancellationError(err)) throw err;
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

export function buildFull7StarlingSweepResponse(
  req: StarlingSweepRequest,
  baseline?: WorkerSettledCore,
): StarlingSweepWorkerMessage {
  return buildStarlingSweepResponse({ ...req, sweepMode: "full7", deltasMl: undefined }, baseline);
}

function maybeFallbackToFull7(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
  response: StarlingSweepWorkerMessage,
  plan: SweepPlan,
): StarlingSweepWorkerMessage {
  if (plan.mode !== "calibrated") return response;
  const fallbackReasons = calibratedFallbackReasons(response);
  if (fallbackReasons.length === 0) return response;
  const started = performanceNow();
  const fallback = buildStarlingSweepResponse({ ...req, sweepMode: "full7", deltasMl: undefined }, baseline);
  fallback.warnings.push(`calibrated Starling fallback: ${fallbackReasons.join("; ")}`);
  fallback.right = withCalibrationSummary(fallback.right, {
    mode: "full7-fallback",
    plannedDeltasMl: plan.fullDeltasMl,
    anchorDeltasMl: plan.anchorDeltasMl,
    fallbackReasons,
  });
  fallback.left = withCalibrationSummary(fallback.left, {
    mode: "full7-fallback",
    plannedDeltasMl: plan.fullDeltasMl,
    anchorDeltasMl: plan.anchorDeltasMl,
    fallbackReasons,
  });
  if (fallback.timing) {
    fallback.timing.mode = "full7-fallback";
    fallback.timing.fallbackReasons = fallbackReasons;
    fallback.timing.full7ReferenceMs = performanceNow() - started;
  }
  return fallback;
}

function calibratedFallbackReasons(response: StarlingSweepWorkerMessage): string[] {
  const reasons: string[] = [];
  if (response.timing?.fallbackReasons?.length) reasons.push(...response.timing.fallbackReasons);
  for (const [side, curve] of [["right", response.right], ["left", response.left]] as const) {
    if (!curve) {
      reasons.push(`${side} curve missing`);
      continue;
    }
    if (!curve.fit || curve.fit.sourcePointCount < 3) reasons.push(`${side} usable anchors < 3`);
    if (curve.points.some((point) => point.quality === "invalid")) reasons.push(`${side} invalid anchor`);
  }
  return Array.from(new Set(reasons));
}

function calibratedResidualFallbackReasons(panes: { right?: GuytonPaneData; left?: GuytonPaneData }): string[] {
  const reasons: string[] = [];
  for (const side of ["right", "left"] as const) {
    const diagnostics = panes[side]?.guytonDiagnostics;
    if (!diagnostics) continue;
    if (diagnostics.pump.exceedsThreshold) reasons.push(`${side} pump residual threshold`);
    if (diagnostics.return.exceedsThreshold) reasons.push(`${side} return residual threshold`);
  }
  return reasons;
}

function withCalibrationSummary<T extends StarlingSweepCurve | undefined>(
  curve: T,
  calibration: StarlingCalibrationSummary,
): T {
  if (!curve) return curve;
  return { ...curve, calibration } as T;
}

export async function buildParallelFull7StarlingSweepResponse(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
  options: AsyncWorkerOptions = {},
): Promise<StarlingSweepWorkerMessage> {
  return buildParallelStarlingSweepResponse({ ...req, sweepMode: "full7", deltasMl: undefined }, baseline, options);
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

export function resolveStarlingSweepPlan(
  req: StarlingSweepRequest,
  baseline: Pick<WorkerSettledCore, "metrics" | "targetVolumeMl">,
): SweepPlan {
  if (req.deltasMl?.length) {
    return {
      mode: "custom",
      deltasMl: [...req.deltasMl],
      fullDeltasMl: [...req.deltasMl],
      anchorDeltasMl: [...req.deltasMl],
    };
  }
  const fullDeltasMl = resolveStarlingSweepDeltas({ ...req, sweepMode: "full7" }, baseline);
  if (req.sweepMode === "full7") {
    return {
      mode: "full7",
      deltasMl: fullDeltasMl,
      fullDeltasMl,
      anchorDeltasMl: fullDeltasMl,
    };
  }
  const policy = classifyStarlingSweepDeltaPolicy(baseline.metrics, baseline.targetVolumeMl);
  return {
    mode: "calibrated",
    deltasMl: calibratedAnchorDeltasForPolicy(policy),
    fullDeltasMl,
    anchorDeltasMl: calibratedAnchorDeltasForPolicy(policy),
  };
}

export function calibratedAnchorDeltasForPolicy(
  policy: Exclude<StarlingSweepDeltaPolicy, "custom">,
): number[] {
  if (policy === "low-preload") return [-200, 0, 600, 1500];
  if (policy === "high-preload") return [-1500, -900, 0, 300];
  return [-900, 0, 300, 900];
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
  const calibration = calibrationSummaryFromTiming(timingInput, deltas);
  const curves = buildSweepCurvesFromRuns(req, runs, deltas, timingInput?.includeExtrapolation ?? true, calibration);
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
      plannedPointCount: timingInput.plannedPointCount ?? deltas.length,
      mode: timingInput.mode,
      anchorCount: timingInput.anchorDeltasMl?.length ?? deltas.length,
      fallbackReasons: timingInput.fallbackReasons,
      full7ReferenceMs: timingInput.full7ReferenceMs,
      holdoutMaxFlowErrorLMin: timingInput.holdoutMaxFlowErrorLMin,
    };
  }
  return response;
}

function calibrationSummaryFromTiming(
  timingInput: SweepTimingInput | undefined,
  deltas: readonly number[],
): StarlingCalibrationSummary | undefined {
  if (!timingInput?.mode) return undefined;
  return {
    mode: timingInput.mode,
    plannedDeltasMl: timingInput.fullDeltasMl ?? [...deltas],
    anchorDeltasMl: timingInput.anchorDeltasMl ?? [...deltas],
    fallbackReasons: timingInput.fallbackReasons ?? [],
    holdoutMaxFlowErrorLMin: timingInput.holdoutMaxFlowErrorLMin,
  };
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
  calibration?: StarlingCalibrationSummary,
): { right: StarlingSweepCurve; left: StarlingSweepCurve; warnings: string[] } {
  const right: GuytonCurvePoint[] = [];
  const left: GuytonCurvePoint[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < deltas.length; i++) {
    const delta = deltas[i];
    const run = runs[i];
    const { metrics, health, settle } = run;
    const label = `${delta >= 0 ? "+" : ""}${Math.round(delta)} mL`;
    const quality = classifyStarlingSweepRunForDisplay(run);

    if (!settle.settled && quality !== "reliable") warnings.push(`${label}: sweep point did not fully settle`);
    if (health.status !== "ok") warnings.push(`${label}: health ${health.status}`);
    if (run.retargetFallback) warnings.push(`${label}: warm retarget fallback`);

    const rightPoint: GuytonCurvePoint = {
      x: metrics.RAPMean,
      y: metrics.CO_R,
      label,
      settled: settle.settled,
      status: health.status,
      deltaVolumeMl: delta,
    };
    right.push({ ...rightPoint, quality });
    const leftPoint: GuytonCurvePoint = {
      x: metrics.LAPMean,
      y: metrics.CO_L,
      label,
      settled: settle.settled,
      status: health.status,
      deltaVolumeMl: delta,
    };
    left.push({ ...leftPoint, quality });
  }

  right.sort((a, b) => a.x - b.x);
  left.sort((a, b) => a.x - b.x);
  const fitMode = calibration?.mode === "calibrated" ? "calibrated" : "measured";

  return {
    right: {
      side: "right",
      points: right,
      fit: buildStarlingSweepFit("right", right, { includeExtrapolation, mode: fitMode }),
      calibration,
      warnings,
    },
    left: {
      side: "left",
      points: left,
      fit: buildStarlingSweepFit("left", left, { includeExtrapolation, mode: fitMode }),
      calibration,
      warnings,
    },
    warnings,
  };
}

function classifyStarlingSweepRunForDisplay(run: GuytonWorkerSettledRun): GuytonCurvePoint["quality"] {
  if (run.health.status === "failed") return "invalid";
  if (run.health.status === "warning") return "stress";
  if (run.settle.settled) return "reliable";
  if (run.settle.reason === "forced-trend") return "stress";
  if (
    (run.settle.reason === "cap" || run.settle.reason === "converging")
    && run.settle.worstSignal
    && STARLING_DISPLAY_RELIABLE_SHAPE_SIGNALS.has(run.settle.worstSignal)
  ) {
    return "reliable";
  }
  return "stress";
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
  createChainWorker: (chainId: GuytonChainId) => GuytonChainWorkerLike,
  timeoutMs = DEFAULT_CHAIN_TIMEOUT_MS,
  onProgress?: (result: GuytonChainRunResult) => void,
  options: Pick<AsyncWorkerOptions, "persistentChainWorkers" | "onChainWorkerFailure" | "isCancelled"> = {},
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
      if (!options.persistentChainWorkers) worker?.terminate();
      fn();
    };

    try {
      if (isRequestCancelled(options)) {
        reject(new CancellationError());
        return;
      }
      worker = createChainWorker(chainId);
    } catch (err) {
      reject(err instanceof Error ? err : new Error("chain worker creation failed"));
      return;
    }
    const activeWorker = worker;

    timeout = setTimeout(() => {
      options.onChainWorkerFailure?.(chainId);
      finish(() => reject(new Error(`chain worker ${chainId} timed out`)));
    }, timeoutMs);

    activeWorker.onmessage = (event: MessageEvent<GuytonChainWorkerMessage>) => {
      if (finished) return;
      const response = event.data;
      if (response.type === "chain-progress") {
        if (!isMatchingChainProgress(response, request)) {
          options.onChainWorkerFailure?.(chainId);
          finish(() => reject(new Error(`invalid ${chainId} chain progress`)));
          return;
        }
        if (isRequestCancelled(options)) {
          options.onChainWorkerFailure?.(chainId);
          finish(() => reject(new CancellationError()));
          return;
        }
        onProgress?.(response.result);
        return;
      }
      if (!isMatchingChainResponse(response, request)) {
        options.onChainWorkerFailure?.(chainId);
        finish(() => reject(new Error(`invalid ${chainId} chain response`)));
        return;
      }
      if (response.error) {
        options.onChainWorkerFailure?.(chainId);
        finish(() => reject(new Error(response.error)));
        return;
      }
      if (isRequestCancelled(options)) {
        options.onChainWorkerFailure?.(chainId);
        finish(() => reject(new CancellationError()));
        return;
      }
      finish(() => resolve(response));
    };
    activeWorker.onerror = (event: ErrorEvent) => {
      if (finished) return;
      options.onChainWorkerFailure?.(chainId);
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

class CancellationError extends Error {
  constructor() {
    super(CANCELLED_MESSAGE);
    this.name = "CancellationError";
  }
}

function isCancellationError(err: unknown): boolean {
  return err instanceof CancellationError
    || (err instanceof Error && err.name === "CancellationError");
}

function isRequestCancelled(options: Pick<AsyncWorkerOptions, "isCancelled">): boolean {
  return options.isCancelled?.() === true;
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
