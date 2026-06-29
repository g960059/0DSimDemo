import { ModelCore, type RetargetTBVStatus } from "@/engine/ModelCore";
import { createModelCoreRuntimeExperimentalOptions } from "@/engine/myocardium/runtimeActiveSource";
import {
  buildCommittedGuytonPaneData,
  type GuytonBaseMapResponse,
  type GuytonCurvePoint,
  type GuytonPaneData,
  type GuytonStarlingWorkerMessage,
  type StarlingPointReliability,
  type StarlingCalibrationSummary,
  type StarlingSweepAuditCandidate,
  type StarlingSweepExplorationReason,
  type StarlingSweepInterpretation,
  type StarlingSweepPointSource,
  type StarlingSweepMode,
  type StarlingSweepCurve,
  type StarlingSweepAuditMessage,
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
  onRun?: (result: { chain: "adaptive"; deltaVolumeMl: number; run: GuytonWorkerSettledRun }) => void;
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
  mode?: StarlingSweepMode | "full7-fallback" | "full7-reference" | "adaptive-audit";
  anchorDeltasMl?: number[];
  fullDeltasMl?: number[];
  fallbackReasons?: string[];
  full7ReferenceMs?: number;
  holdoutMaxFlowErrorLMin?: number;
  pointSourceByDelta?: Map<number, StarlingSweepPointSource>;
  auditCandidateByDelta?: Map<number, StarlingSweepAuditCandidate>;
};

type SweepDeltaChains = {
  positive: number[];
  negative: number[];
};

type AuditDeltaChain = {
  chainId: GuytonChainId;
  deltas: number[];
};

type SweepPlan = {
  mode: StarlingSweepMode;
  deltasMl: number[];
  fullDeltasMl: number[];
  anchorDeltasMl: number[];
};

type SeedInfo = {
  seededFromDeltaMl?: number;
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
const STARLING_ADAPTIVE_HARD_MIN_TBV_ML = 1800;
const STARLING_ADAPTIVE_HARD_MAX_TBV_ML = 8500;
const STARLING_ADAPTIVE_MAX_STEP_ML = 250;
const STARLING_ADAPTIVE_MIN_STEP_ML = 125;
const STARLING_ADAPTIVE_LOW_STEP_ML = 125;
const STARLING_ADAPTIVE_HIGH_STEP_ML = 250;
const STARLING_ADAPTIVE_MAX_LOW_POINTS = 12;
const STARLING_ADAPTIVE_MAX_HIGH_POINTS = 4;
const STARLING_ADAPTIVE_MAX_REFINEMENT_POINTS = 0;
const STARLING_ADAPTIVE_LOW_LAP_STOP_MMHG = 1;
const STARLING_ADAPTIVE_LOW_RAP_STOP_MMHG = -1;
const STARLING_ADAPTIVE_MIN_FLOW_L_MIN = 0.35;
const STARLING_ADAPTIVE_MAX_PRESSURE_STEP_MMHG = 3;
const STARLING_ADAPTIVE_MAX_INVERSE_COMPLIANCE_MMHG_PER_L = 5;
const STARLING_ADAPTIVE_MAX_STARLING_SLOPE_L_MIN_PER_MMHG = 5;
const STARLING_ADAPTIVE_CURVATURE_REFINE_THRESHOLD = 0.05;
const STARLING_ADAPTIVE_MAX_POINTS = 1
  + STARLING_ADAPTIVE_MAX_LOW_POINTS
  + STARLING_ADAPTIVE_MAX_HIGH_POINTS
  + STARLING_ADAPTIVE_MAX_REFINEMENT_POINTS;
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
    const sweep = (fns.buildStarlingSweepResponse ?? buildStarlingSweepResponse)(req, baseline);
    postMessage(sweep);
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
    if (isRequestCancelled(options)) return;
    postMessage(response);
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
  if (!req.deltasMl?.length && req.sweepMode !== "full7") {
    return buildAdaptiveStarlingSweepResponse(req, resolvedBaseline);
  }
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
  if (!req.deltasMl?.length && req.sweepMode !== "full7") {
    return buildParallelAdaptiveStarlingSweepResponse(req, baseline, options);
  }
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
  return {
    ...curve,
    calibration,
    interpretation: buildStarlingSweepInterpretation(curve.side, curve.points, calibration, curve.fit),
  } as T;
}

export async function buildParallelFull7StarlingSweepResponse(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
  options: AsyncWorkerOptions = {},
): Promise<StarlingSweepWorkerMessage> {
  return buildParallelStarlingSweepResponse({ ...req, sweepMode: "full7", deltasMl: undefined }, baseline, options);
}

function buildAdaptiveStarlingSweepResponse(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
  options: Pick<AsyncWorkerOptions, "onProgress" | "onRun" | "isCancelled"> = {},
): StarlingSweepWorkerMessage {
  const sweepStart = performanceNow();
  const runByDelta = new Map<number, GuytonWorkerSettledRun>([[0, baseline]]);
  const deltas: number[] = [0];
  const pointSourceByDelta = new Map<number, StarlingSweepPointSource>([[0, "adaptive-exploration"]]);
  const candidateByDelta = new Map<number, StarlingSweepAuditCandidate>([[
    0,
    { deltaVolumeMl: 0, explorationReason: "baseline-reference", candidateRank: 1 },
  ]]);
  let rank = 2;

  const emitProgress = () => {
    if (!options.onProgress || isRequestCancelled(options)) return;
    options.onProgress(buildAdaptiveSweepProgressMessage(req, runByDelta, deltas, pointSourceByDelta, candidateByDelta));
  };
  emitProgress();

  const addRun = (
    requestedDeltaMl: number,
    seedDeltaMl: number,
    reason: StarlingSweepExplorationReason,
  ): GuytonWorkerSettledRun | undefined => {
    if (isRequestCancelled(options)) throw new CancellationError();
    const targetVolumeMl = clamp(
      req.targetVolumeMl + requestedDeltaMl,
      STARLING_ADAPTIVE_HARD_MIN_TBV_ML,
      STARLING_ADAPTIVE_HARD_MAX_TBV_ML,
    );
    const deltaVolumeMl = roundDeltaMl(targetVolumeMl - req.targetVolumeMl);
    if (Math.abs(deltaVolumeMl) < 1e-6 || runByDelta.has(deltaVolumeMl)) return undefined;
    const requestedSeed = runByDelta.get(seedDeltaMl);
    const seed = requestedSeed?.reliability.seedReliable ? requestedSeed : baseline;
    const acceptedSeedDeltaMl = seed === baseline ? 0 : seedDeltaMl;
    const run = settleWorkerCore(req, targetVolumeMl, seed.state, { seededFromDeltaMl: acceptedSeedDeltaMl });
    runByDelta.set(deltaVolumeMl, run);
    deltas.push(deltaVolumeMl);
    pointSourceByDelta.set(deltaVolumeMl, "adaptive-exploration");
    candidateByDelta.set(deltaVolumeMl, {
      deltaVolumeMl,
      explorationReason: reason,
      candidateRank: rank++,
    });
    options.onRun?.({ chain: "adaptive", deltaVolumeMl, run });
    emitProgress();
    return run;
  };

  const marchTiming = marchAdaptivePreload(req, baseline, addRun);

  const orderedDeltas = [...deltas];
  const orderedRuns = orderedDeltas.map((delta) => {
    const run = runByDelta.get(delta);
    if (!run) throw new Error(`Missing adaptive sweep run for delta ${String(delta)}`);
    return run;
  });

  return buildSweepResponseFromRuns(req, orderedRuns, {
    positiveChainMs: marchTiming.highMs,
    negativeChainMs: marchTiming.lowMs,
    retargetFallbackCount: orderedRuns.filter((run) => run.retargetFallback).length,
    sweepStart,
    deltasMl: orderedDeltas,
    includeExtrapolation: false,
    parallel: false,
    chainWallMs: performanceNow() - sweepStart,
    plannedPointCount: orderedDeltas.length,
    mode: "adaptive",
    anchorDeltasMl: orderedDeltas,
    fullDeltasMl: orderedDeltas,
    pointSourceByDelta,
    auditCandidateByDelta: candidateByDelta,
  });
}

async function buildParallelAdaptiveStarlingSweepResponse(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
  options: AsyncWorkerOptions = {},
): Promise<StarlingSweepWorkerMessage> {
  const createChainWorker = options.createChainWorker;
  if (!createChainWorker) return buildAdaptiveStarlingSweepResponse(req, baseline, options);

  const sweepStart = performanceNow();
  const chainStart = performanceNow();
  const chains = adaptiveExplorationChains(req);
  const runByDelta = new Map<number, GuytonWorkerSettledRun>([[0, baseline]]);
  const deltas: number[] = [0];
  const pointSourceByDelta = new Map<number, StarlingSweepPointSource>([[0, "adaptive-exploration"]]);
  const candidateByDelta = new Map<number, StarlingSweepAuditCandidate>([[
    0,
    { deltaVolumeMl: 0, explorationReason: "baseline-reference", candidateRank: 1 },
  ]]);
  let rank = 2;

  const emitProgress = () => {
    if (!options.onProgress || isRequestCancelled(options)) return;
    options.onProgress(buildAdaptiveSweepProgressMessage(req, runByDelta, deltas, pointSourceByDelta, candidateByDelta));
  };
  const addProgressRun = (result: GuytonChainRunResult): void => {
    if (runByDelta.has(result.deltaVolumeMl)) return;
    runByDelta.set(result.deltaVolumeMl, result.run);
    deltas.push(result.deltaVolumeMl);
    pointSourceByDelta.set(result.deltaVolumeMl, "adaptive-exploration");
    candidateByDelta.set(result.deltaVolumeMl, {
      deltaVolumeMl: result.deltaVolumeMl,
      explorationReason: result.deltaVolumeMl < 0
        ? "low-preload-shape"
        : candidateByDeltaHasPositive(candidateByDelta) ? "hypervolume-plateau" : "hypervolume-shape",
      candidateRank: rank++,
    });
    options.onRun?.({ chain: "adaptive", deltaVolumeMl: result.deltaVolumeMl, run: result.run });
    emitProgress();
  };

  emitProgress();

  try {
    if (isRequestCancelled(options)) throw new CancellationError();
    const [positive, negative] = await Promise.all([
      runChain(req, baseline.state, "positive", chains.positive, createChainWorker, options.chainTimeoutMs, addProgressRun, options),
      runChain(req, baseline.state, "negative", chains.negative, createChainWorker, options.chainTimeoutMs, addProgressRun, options),
    ]);
    const chainWallMs = performanceNow() - chainStart;
    for (const result of [...positive.runs, ...negative.runs]) addProgressRun(result);
    const orderedDeltas = [0, ...chains.negative, ...chains.positive]
      .filter((delta, index, all) => all.indexOf(delta) === index && runByDelta.has(delta));
    const orderedRuns = orderedDeltas.map((delta) => {
      const run = runByDelta.get(delta);
      if (!run) throw new Error(`Missing adaptive parallel sweep run for delta ${String(delta)}`);
      return run;
    });
    return buildSweepResponseFromRuns(req, orderedRuns, {
      positiveChainMs: positive.chainMs,
      negativeChainMs: negative.chainMs,
      retargetFallbackCount: positive.retargetFallbackCount + negative.retargetFallbackCount,
      sweepStart,
      deltasMl: orderedDeltas,
      includeExtrapolation: false,
      parallel: true,
      chainWallMs,
      plannedPointCount: 1 + chains.negative.length + chains.positive.length,
      mode: "adaptive",
      anchorDeltasMl: orderedDeltas,
      fullDeltasMl: orderedDeltas,
      pointSourceByDelta,
      auditCandidateByDelta: candidateByDelta,
    });
  } catch (err) {
    if (isCancellationError(err)) throw err;
    const reason = err instanceof Error ? err.message : "adaptive parallel chain failed";
    const fallback = buildAdaptiveStarlingSweepResponse(req, baseline, options);
    fallback.warnings.push(`adaptive parallel chain fallback: ${reason}`);
    if (fallback.timing) {
      fallback.timing.parallel = false;
      fallback.timing.parallelFallback = reason;
      fallback.timing.chainWallMs = performanceNow() - chainStart;
    }
    return fallback;
  }
}

function buildAdaptiveSweepProgressMessage(
  req: StarlingSweepRequest,
  runsByDelta: Map<number, GuytonWorkerSettledRun>,
  deltas: readonly number[],
  pointSourceByDelta: Map<number, StarlingSweepPointSource>,
  auditCandidateByDelta: Map<number, StarlingSweepAuditCandidate>,
): StarlingSweepProgressMessage {
  const runs = deltas.map((delta) => {
    const run = runsByDelta.get(delta);
    if (!run) throw new Error(`Missing adaptive progress run for delta ${String(delta)}`);
    return run;
  });
  const calibration: StarlingCalibrationSummary = {
    mode: "adaptive",
    plannedDeltasMl: [...deltas],
    anchorDeltasMl: [...deltas],
    fallbackReasons: [],
  };
  const curves = buildSweepCurvesFromRuns(
    req,
    runs,
    deltas,
    false,
    calibration,
    pointSourceByDelta,
    auditCandidateByDelta,
  );
  return {
    type: "starling-sweep-progress",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: curves.right,
    left: curves.left,
    warnings: curves.warnings,
    completedPoints: deltas.length,
    totalPoints: Math.max(deltas.length, STARLING_ADAPTIVE_MAX_POINTS),
  };
}

function marchAdaptivePreload(
  req: StarlingSweepRequest,
  baseline: WorkerSettledCore,
  addRun: (deltaMl: number, seedDeltaMl: number, reason: StarlingSweepExplorationReason) => GuytonWorkerSettledRun | undefined,
): { lowMs: number; highMs: number } {
  const low = adaptiveMarchCursor(baseline);
  const high = adaptiveMarchCursor(baseline);
  const chains = adaptiveExplorationChains(req);
  let lowMs = 0;
  let highMs = 0;
  let lowIndex = 0;
  let highIndex = 0;

  while (low.active || high.active) {
    if (low.active && lowIndex < chains.negative.length) {
      const startedAt = performanceNow();
      low.active = stepLowPreload(low, chains.negative[lowIndex++], addRun);
      lowMs += performanceNow() - startedAt;
    }
    if (high.active && highIndex < chains.positive.length) {
      const startedAt = performanceNow();
      high.active = stepHighPreload(high, chains.positive[highIndex++], addRun);
      highMs += performanceNow() - startedAt;
    }
    if (lowIndex >= chains.negative.length) low.active = false;
    if (highIndex >= chains.positive.length) high.active = false;
  }

  return { lowMs, highMs };
}

type AdaptiveMarchCursor = {
  seedDelta: number;
  prev: GuytonWorkerSettledRun;
  stepMl: number;
  accepted: number;
  active: boolean;
};

function adaptiveMarchCursor(baseline: WorkerSettledCore): AdaptiveMarchCursor {
  return {
    seedDelta: 0,
    prev: baseline,
    stepMl: STARLING_ADAPTIVE_MAX_STEP_ML,
    accepted: 0,
    active: true,
  };
}

function stepLowPreload(
  cursor: AdaptiveMarchCursor,
  nextDelta: number,
  addRun: (deltaMl: number, seedDeltaMl: number, reason: StarlingSweepExplorationReason) => GuytonWorkerSettledRun | undefined,
): boolean {
  if (cursor.accepted >= STARLING_ADAPTIVE_MAX_LOW_POINTS) return false;
  const candidate = addRun(nextDelta, cursor.seedDelta, "low-preload-shape");
  if (!candidate) return false;
  const coarse = shouldShrinkAdaptiveStep(cursor.prev, candidate);
  cursor.accepted += 1;
  cursor.seedDelta = nextDelta;
  cursor.prev = candidate;
  if (coarse && cursor.stepMl > STARLING_ADAPTIVE_MIN_STEP_ML) {
    cursor.stepMl = Math.max(STARLING_ADAPTIVE_MIN_STEP_ML, cursor.stepMl / 2);
  }
  return candidate.health.status !== "failed";
}

function stepHighPreload(
  cursor: AdaptiveMarchCursor,
  nextDelta: number,
  addRun: (deltaMl: number, seedDeltaMl: number, reason: StarlingSweepExplorationReason) => GuytonWorkerSettledRun | undefined,
): boolean {
  if (cursor.accepted >= STARLING_ADAPTIVE_MAX_HIGH_POINTS) return false;
  const candidate = addRun(nextDelta, cursor.seedDelta, cursor.accepted === 0 ? "hypervolume-shape" : "hypervolume-plateau");
  if (!candidate) return false;
  const coarse = shouldShrinkAdaptiveStep(cursor.prev, candidate);
  cursor.accepted += 1;
  const previous = cursor.prev;
  cursor.seedDelta = nextDelta;
  cursor.prev = candidate;
  if (coarse && cursor.stepMl > STARLING_ADAPTIVE_MIN_STEP_ML) {
    cursor.stepMl = Math.max(STARLING_ADAPTIVE_MIN_STEP_ML, cursor.stepMl / 2);
  }
  void previous;
  return candidate.health.status !== "failed";
}

function adaptiveExplorationChains(req: StarlingSweepRequest): SweepDeltaChains {
  const negative: number[] = [];
  const positive: number[] = [];
  for (let i = 1; i <= STARLING_ADAPTIVE_MAX_LOW_POINTS; i++) {
    const delta = -i * STARLING_ADAPTIVE_LOW_STEP_ML;
    if (req.targetVolumeMl + delta < STARLING_ADAPTIVE_HARD_MIN_TBV_ML) break;
    negative.push(delta);
  }
  for (let i = 1; i <= STARLING_ADAPTIVE_MAX_HIGH_POINTS; i++) {
    const delta = i * STARLING_ADAPTIVE_HIGH_STEP_ML;
    if (req.targetVolumeMl + delta > STARLING_ADAPTIVE_HARD_MAX_TBV_ML) break;
    positive.push(delta);
  }
  return { negative, positive };
}

function candidateByDeltaHasPositive(candidateByDelta: Map<number, StarlingSweepAuditCandidate>): boolean {
  for (const delta of candidateByDelta.keys()) {
    if (delta > 0) return true;
  }
  return false;
}

function refineAdaptiveShape(
  req: StarlingSweepRequest,
  runByDelta: Map<number, GuytonWorkerSettledRun>,
  addRun: (deltaMl: number, seedDeltaMl: number, reason: StarlingSweepExplorationReason) => GuytonWorkerSettledRun | undefined,
): void {
  for (let i = 0; i < STARLING_ADAPTIVE_MAX_REFINEMENT_POINTS; i++) {
    const candidateDelta = adaptiveRefinementDelta(runByDelta);
    if (candidateDelta === undefined) break;
    const seedDelta = nearestSeedDelta(runByDelta, candidateDelta);
    const run = addRun(candidateDelta, seedDelta, i === 0 ? "curvature" : "adaptive-refinement");
    if (!run) break;
  }
  void req;
}

function shouldShrinkAdaptiveStep(prev: GuytonWorkerSettledRun, next: GuytonWorkerSettledRun): boolean {
  const dP = Math.max(
    Math.abs(next.metrics.RAPMean - prev.metrics.RAPMean),
    Math.abs(next.metrics.LAPMean - prev.metrics.LAPMean),
  );
  const dQ = Math.max(
    Math.abs(next.metrics.CO_R - prev.metrics.CO_R),
    Math.abs(next.metrics.CO_L - prev.metrics.CO_L),
  );
  const dV_L = Math.max(Math.abs(next.targetVolumeMl - prev.targetVolumeMl) / 1000, 1e-6);
  const dP_dV = dP / dV_L;
  const dQ_dP = dP > 1e-6 ? dQ / dP : Number.POSITIVE_INFINITY;
  return dP > STARLING_ADAPTIVE_MAX_PRESSURE_STEP_MMHG
    || dP_dV > STARLING_ADAPTIVE_MAX_INVERSE_COMPLIANCE_MMHG_PER_L
    || dQ_dP > STARLING_ADAPTIVE_MAX_STARLING_SLOPE_L_MIN_PER_MMHG;
}

function shouldStopLowPreload(run: GuytonWorkerSettledRun): boolean {
  if (run.health.status === "failed") return true;
  if (run.metrics.LAPMean <= STARLING_ADAPTIVE_LOW_LAP_STOP_MMHG) return true;
  if (run.metrics.RAPMean <= STARLING_ADAPTIVE_LOW_RAP_STOP_MMHG) return true;
  return Math.min(run.metrics.CO_R, run.metrics.CO_L) <= STARLING_ADAPTIVE_MIN_FLOW_L_MIN;
}

function shouldStopHighPreload(prev: GuytonWorkerSettledRun, next: GuytonWorkerSettledRun, accepted: number): boolean {
  if (next.health.status === "failed") return true;
  if (accepted < 2) return false;
  const dQ = Math.max(
    Math.abs(next.metrics.CO_R - prev.metrics.CO_R),
    Math.abs(next.metrics.CO_L - prev.metrics.CO_L),
  );
  const dP = Math.max(
    Math.abs(next.metrics.RAPMean - prev.metrics.RAPMean),
    Math.abs(next.metrics.LAPMean - prev.metrics.LAPMean),
  );
  return dQ < 0.12 && dP > 0.75;
}

function adaptiveRefinementDelta(runByDelta: Map<number, GuytonWorkerSettledRun>): number | undefined {
  const items = Array.from(runByDelta.entries())
    .filter(([, run]) => starlingMetricsFinite(run.metrics) && run.health.status !== "failed")
    .sort((a, b) => a[0] - b[0]);
  if (items.length < 3) return undefined;
  let best: { delta: number; score: number } | undefined;
  for (let i = 0; i < items.length - 1; i++) {
    const [leftDelta, leftRun] = items[i];
    const [rightDelta, rightRun] = items[i + 1];
    const midpoint = roundDeltaMl((leftDelta + rightDelta) / 2);
    if (runByDelta.has(midpoint) || Math.abs(rightDelta - leftDelta) < STARLING_ADAPTIVE_MIN_STEP_ML * 1.5) continue;
    const gap = Math.max(
      Math.abs(rightRun.metrics.RAPMean - leftRun.metrics.RAPMean),
      Math.abs(rightRun.metrics.LAPMean - leftRun.metrics.LAPMean),
    );
    const curvature = localCurvatureScore(items, i);
    const score = gap + curvature * 3;
    if (!best || score > best.score) best = { delta: midpoint, score };
  }
  if (!best || best.score < STARLING_ADAPTIVE_CURVATURE_REFINE_THRESHOLD) return undefined;
  return best.delta;
}

function localCurvatureScore(items: Array<[number, GuytonWorkerSettledRun]>, leftIndex: number): number {
  if (leftIndex <= 0 || leftIndex + 2 >= items.length) return 0;
  const [, a] = items[leftIndex - 1];
  const [, b] = items[leftIndex];
  const [, c] = items[leftIndex + 1];
  const [, d] = items[leftIndex + 2];
  return Math.max(
    Math.abs(slope(c.metrics.RAPMean, c.metrics.CO_R, d.metrics.RAPMean, d.metrics.CO_R)
      - slope(a.metrics.RAPMean, a.metrics.CO_R, b.metrics.RAPMean, b.metrics.CO_R)),
    Math.abs(slope(c.metrics.LAPMean, c.metrics.CO_L, d.metrics.LAPMean, d.metrics.CO_L)
      - slope(a.metrics.LAPMean, a.metrics.CO_L, b.metrics.LAPMean, b.metrics.CO_L)),
  );
}

function slope(x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0;
  return Math.abs(dx) > 1e-6 ? (y1 - y0) / dx : 0;
}

function nearestSeedDelta(runByDelta: Map<number, GuytonWorkerSettledRun>, targetDelta: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [delta, run] of runByDelta) {
    if (!run.reliability.seedReliable) continue;
    const distance = Math.abs(delta - targetDelta);
    if (distance < bestDistance) {
      best = delta;
      bestDistance = distance;
    }
  }
  return best;
}

function roundDeltaMl(delta: number): number {
  return Math.round(delta / 25) * 25;
}

export function buildStarlingSweepAuditMessage(
  _req: StarlingSweepRequest,
  _baseline: WorkerSettledCore,
  _calibrated: StarlingSweepWorkerMessage,
): StarlingSweepAuditMessage | undefined {
  return undefined;
}

export async function buildParallelStarlingSweepAuditMessage(
  _req: StarlingSweepRequest,
  _baseline: WorkerSettledCore,
  _calibrated: StarlingSweepWorkerMessage,
  _options: AsyncWorkerOptions = {},
): Promise<StarlingSweepAuditMessage | undefined> {
  return undefined;
}

function shouldBuildFull7Audit(plan: SweepPlan, calibrated: StarlingSweepWorkerMessage): boolean {
  return plan.mode === "calibrated"
    && calibrated.timing?.mode === "calibrated"
    && !calibrated.error
    && Boolean(calibrated.right || calibrated.left);
}

function full7AuditAddedDeltas(plan: SweepPlan): number[] {
  if (plan.mode !== "calibrated") return [];
  const anchors = new Set(plan.anchorDeltasMl);
  return plan.fullDeltasMl.filter((delta) => !anchors.has(delta));
}

export function adaptiveAuditCandidates(
  _plan: SweepPlan,
  _calibrated: StarlingSweepWorkerMessage,
): StarlingSweepAuditCandidate[] {
  return [];
}

function shouldExpandAdaptiveAudit(calibrated: StarlingSweepWorkerMessage): boolean {
  const points = [...(calibrated.right?.points ?? []), ...(calibrated.left?.points ?? [])];
  const lowEndpointStress = points.some((point) => (
    typeof point.deltaVolumeMl === "number"
    && point.deltaVolumeMl < 0
    && (point.settled === false || point.quality === "stress" || point.status === "warning")
  ));
  return lowEndpointStress || maxCalibratedCurvature(calibrated) >= STARLING_ADAPTIVE_CURVATURE_REFINE_THRESHOLD;
}

function largestAnchorGapCandidate(anchorDeltas: readonly number[], candidates: readonly number[]): number | undefined {
  const sortedAnchors = [...anchorDeltas].sort((a, b) => a - b);
  let best: { delta: number; gap: number } | undefined;
  for (let i = 0; i < sortedAnchors.length - 1; i++) {
    const left = sortedAnchors[i];
    const right = sortedAnchors[i + 1];
    const gap = right - left;
    const inGap = candidates
      .filter((delta) => delta > left && delta < right)
      .sort((a, b) => Math.abs((left + right) / 2 - a) - Math.abs((left + right) / 2 - b));
    if (inGap.length === 0) continue;
    if (!best || gap > best.gap) best = { delta: inGap[0], gap };
  }
  return best?.delta;
}

function curvatureCandidateDelta(
  calibrated: StarlingSweepWorkerMessage,
  candidates: readonly number[],
): number | undefined {
  const curve = maxCurvatureCurve(calibrated);
  if (!curve) return undefined;
  const points = curve.points
    .filter((point) => typeof point.deltaVolumeMl === "number" && Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);
  if (points.length < 3) return undefined;

  let best: { targetDelta: number; curvature: number } | undefined;
  for (let i = 1; i < points.length - 1; i++) {
    const left = points[i - 1];
    const mid = points[i];
    const right = points[i + 1];
    const leftDx = mid.x - left.x;
    const rightDx = right.x - mid.x;
    if (!(leftDx > 0) || !(rightDx > 0)) continue;
    const leftSlope = (mid.y - left.y) / leftDx;
    const rightSlope = (right.y - mid.y) / rightDx;
    const curvature = Math.abs(rightSlope - leftSlope);
    const targetDelta = ((left.deltaVolumeMl ?? 0) + (right.deltaVolumeMl ?? 0)) / 2;
    if (!best || curvature > best.curvature) best = { targetDelta, curvature };
  }
  if (!best) return undefined;
  return candidates
    .slice()
    .sort((a, b) => Math.abs(a - best.targetDelta) - Math.abs(b - best.targetDelta))[0];
}

function maxCurvatureCurve(calibrated: StarlingSweepWorkerMessage): StarlingSweepCurve | undefined {
  const right = maxCurveCurvature(calibrated.right);
  const left = maxCurveCurvature(calibrated.left);
  if (!right.curve) return left.curve;
  if (!left.curve) return right.curve;
  return right.curvature >= left.curvature ? right.curve : left.curve;
}

function maxCalibratedCurvature(calibrated: StarlingSweepWorkerMessage): number {
  return Math.max(maxCurveCurvature(calibrated.right).curvature, maxCurveCurvature(calibrated.left).curvature);
}

function maxCurveCurvature(curve: StarlingSweepCurve | undefined): { curve?: StarlingSweepCurve; curvature: number } {
  const points = curve?.points
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x) ?? [];
  let max = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const left = points[i - 1];
    const mid = points[i];
    const right = points[i + 1];
    const leftDx = mid.x - left.x;
    const rightDx = right.x - mid.x;
    if (!(leftDx > 0) || !(rightDx > 0)) continue;
    const leftSlope = (mid.y - left.y) / leftDx;
    const rightSlope = (right.y - mid.y) / rightDx;
    max = Math.max(max, Math.abs(rightSlope - leftSlope));
  }
  return { curve, curvature: max };
}

function plateauCandidateDelta(anchorDeltas: readonly number[], candidates: readonly number[]): number | undefined {
  const maxAnchor = Math.max(...anchorDeltas);
  return candidates.filter((delta) => delta > maxAnchor).sort((a, b) => a - b)[0];
}

function explorationReasonForDelta(
  delta: number,
  largestGapDelta: number | undefined,
  curvatureDelta: number | undefined,
  plateauDelta: number | undefined,
): StarlingSweepExplorationReason {
  if (delta === 0) return "baseline-reference";
  if (delta === curvatureDelta) return "curvature";
  if (delta === plateauDelta) return "hypervolume-plateau";
  if (delta < 0) return "low-preload-shape";
  if (delta === largestGapDelta) return "largest-gap";
  return "full7-fill";
}

function auditCandidateScore(delta: number, reason: StarlingSweepExplorationReason): number {
  const reasonScore: Record<StarlingSweepExplorationReason, number> = {
    "low-preload-shape": 60,
    "hypervolume-shape": 58,
    curvature: 55,
    "adaptive-refinement": 53,
    "hypervolume-plateau": 50,
    "largest-gap": 45,
    "baseline-reference": 35,
    "full7-fill": 20,
  };
  return reasonScore[reason] + (delta < 0 ? 8 : 0);
}

function splitAuditCandidateDeltas(candidates: readonly StarlingSweepAuditCandidate[], plan: SweepPlan): AuditDeltaChain[] {
  const deltas = candidates.map((candidate) => candidate.deltaVolumeMl).filter((delta) => delta !== 0);
  const maxAnchor = Math.max(...plan.anchorDeltasMl);
  const low = deltas.filter((delta) => delta < 0).sort((a, b) => Math.abs(a) - Math.abs(b));
  const mid = deltas.filter((delta) => delta > 0 && delta <= maxAnchor).sort((a, b) => a - b);
  const plateau = deltas.filter((delta) => delta > maxAnchor).sort((a, b) => a - b);
  const chains: AuditDeltaChain[] = [
    { chainId: "audit-low", deltas: low },
    { chainId: "audit-mid", deltas: mid },
    { chainId: "audit-plateau", deltas: plateau },
  ];
  return chains.filter((chain) => chain.deltas.length > 0);
}

function buildSweepAuditMessageFromRuns(
  req: StarlingSweepRequest,
  calibrated: StarlingSweepWorkerMessage,
  plan: SweepPlan,
  addedRuns: GuytonWorkerSettledRun[],
  candidates: StarlingSweepAuditCandidate[],
  timingInput: SweepTimingInput,
): StarlingSweepAuditMessage {
  const addedDeltasMl = candidates.map((candidate) => candidate.deltaVolumeMl);
  const pointSourceByDelta = new Map(addedDeltasMl.map((delta) => [delta, "audit-added" as const]));
  const auditCandidateByDelta = new Map(candidates.map((candidate) => [candidate.deltaVolumeMl, candidate]));
  const addedCurves = buildSweepCurvesFromRuns(
    req,
    addedRuns,
    addedDeltasMl,
    false,
    undefined,
    pointSourceByDelta,
    auditCandidateByDelta,
  );
  const right = mergeAuditCurve(calibrated.right, addedCurves.right, plan, candidates);
  const left = mergeAuditCurve(calibrated.left, addedCurves.left, plan, candidates);
  const warnings = uniqueStrings([
    ...addedCurves.warnings,
    ...(right?.audit ? [] : ["right adaptive audit missing calibrated curve"]),
    ...(left?.audit ? [] : ["left adaptive audit missing calibrated curve"]),
  ]);
  return {
    type: "starling-sweep-audit",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right,
    left,
    warnings,
    timing: {
      positiveChainMs: timingInput.positiveChainMs ?? 0,
      negativeChainMs: timingInput.negativeChainMs ?? 0,
      assembleMs: 0,
      totalMs: timingInput.sweepStart !== undefined ? performanceNow() - timingInput.sweepStart : 0,
      retargetFallbackCount: timingInput.retargetFallbackCount ?? 0,
      parallel: timingInput.parallel,
      parallelFallback: timingInput.parallelFallback,
      chainWallMs: timingInput.chainWallMs,
      plannedPointCount: addedDeltasMl.length,
      mode: "adaptive-audit",
      anchorCount: plan.anchorDeltasMl.length,
    },
  };
}

function mergeAuditCurve(
  calibrated: StarlingSweepCurve | undefined,
  added: StarlingSweepCurve | undefined,
  plan: SweepPlan,
  candidates: StarlingSweepAuditCandidate[],
): StarlingSweepCurve | undefined {
  if (!calibrated) return undefined;
  const calibratedPoints = calibrated.points.map((point) => ({
    ...point,
    pointSource: point.pointSource ?? "calibrated-anchor" as const,
  }));
  const addedPoints = (added?.points ?? []).map((point) => ({
    ...point,
    pointSource: "audit-added" as const,
  }));
  const auditPoints = [...calibratedPoints, ...addedPoints]
    .sort((a, b) => a.x - b.x);
  return {
    ...calibrated,
    audit: {
      points: auditPoints,
      holdoutErrorLMin: holdoutMaxFlowErrorAgainstFit(calibrated.fit?.points, addedPoints),
      addedDeltasMl: candidates.map((candidate) => candidate.deltaVolumeMl),
      reusedDeltasMl: [...plan.anchorDeltasMl],
      exploration: candidates,
    },
    warnings: uniqueStrings([
      ...calibrated.warnings,
      ...(added?.warnings ?? []),
    ]),
  };
}

function holdoutMaxFlowErrorAgainstFit(
  fitPoints: readonly GuytonCurvePoint[] | undefined,
  holdouts: readonly GuytonCurvePoint[],
): number | null {
  if (!fitPoints?.length || holdouts.length === 0) return null;
  const errors = holdouts
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.status !== "failed")
    .map((point) => Math.abs(point.y - interpolateFitY(fitPoints, point.x)));
  return errors.length ? Math.max(...errors) : 0;
}

function interpolateFitY(points: readonly GuytonCurvePoint[], x: number): number {
  if (points.length === 0) return NaN;
  if (x <= points[0].x) return points[0].y;
  for (let i = 0; i < points.length - 1; i++) {
    const left = points[i];
    const right = points[i + 1];
    if (x > right.x) continue;
    const span = right.x - left.x;
    if (!(span > 0)) return left.y;
    return left.y + (right.y - left.y) * ((x - left.x) / span);
  }
  return points[points.length - 1].y;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
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
  if (policy === "low-preload") return [-200, 0, 600, 1200];
  if (policy === "high-preload") return [-1500, -900, -300, 300];
  return [-900, -450, 0, 600];
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
  seedInfo: SeedInfo = {},
): WorkerSettledCore {
  const started = performanceNow();
  const core = new ModelCore(req.params, createModelCoreRuntimeExperimentalOptions({
    mode: req.runtimeActiveSourceMode,
    runtimeParams: req.params,
  }));
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
  const periodBeats = settle.periodBeats ?? 1;
  const metrics = core.metrics({ windowBeats: periodBeats });
  const observables = core.debugObservables();
  const health = core.health({ periodBeats });
  const reliability = starlingReliabilityForRun(settle, health.status, metrics, retargetFallback);

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
    seededFromDeltaMl: seedInfo.seededFromDeltaMl,
    seedAccepted: reliability.seedReliable,
    seedRejectReason: reliability.seedRejectReason,
    reliability,
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
    let seededFromDeltaMl = 0;
    for (const delta of chainDeltas) {
      const run = settleWorkerCore(req, clamp(req.targetVolumeMl + delta, 2500, 8500), seedState, { seededFromDeltaMl });
      runs.set(delta, run);
      if (run.reliability.seedReliable) {
        seedState = run.state;
        seededFromDeltaMl = delta;
      } else {
        seedState = baseline.state;
        seededFromDeltaMl = 0;
      }
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
  const curves = buildSweepCurvesFromRuns(
    req,
    runs,
    deltas,
    timingInput?.includeExtrapolation ?? true,
    calibration,
    timingInput?.pointSourceByDelta,
    timingInput?.auditCandidateByDelta,
  );
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
  pointSourceByDelta?: Map<number, StarlingSweepPointSource>,
  auditCandidateByDelta?: Map<number, StarlingSweepAuditCandidate>,
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
    const pointSource = pointSourceByDelta?.get(delta) ?? defaultPointSource(calibration?.mode);
    const auditCandidate = auditCandidateByDelta?.get(delta);

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
      pointSource,
      reliability: run.reliability,
      explorationReason: auditCandidate?.explorationReason,
      candidateRank: auditCandidate?.candidateRank,
      periodBeats: settle.periodBeats ?? 1,
      periodLabel: periodLabelForSettle(settle),
    };
    right.push({ ...rightPoint, quality });
    const leftPoint: GuytonCurvePoint = {
      x: metrics.LAPMean,
      y: metrics.CO_L,
      label,
      settled: settle.settled,
      status: health.status,
      deltaVolumeMl: delta,
      pointSource,
      reliability: run.reliability,
      explorationReason: auditCandidate?.explorationReason,
      candidateRank: auditCandidate?.candidateRank,
      periodBeats: settle.periodBeats ?? 1,
      periodLabel: periodLabelForSettle(settle),
    };
    left.push({ ...leftPoint, quality });
  }

  right.sort((a, b) => a.x - b.x);
  left.sort((a, b) => a.x - b.x);
  const fitMode = calibration?.mode === "calibrated" ? "calibrated" : "measured";
  const adaptiveFit = calibration?.mode === "adaptive" || calibration?.mode === "adaptive-audit";
  const rightFit = buildStarlingSweepFit("right", right, { includeExtrapolation, mode: fitMode, monotone: !adaptiveFit });
  const leftFit = buildStarlingSweepFit("left", left, { includeExtrapolation, mode: fitMode, monotone: !adaptiveFit });

  return {
    right: {
      side: "right",
      points: right,
      fit: rightFit,
      calibration,
      interpretation: buildStarlingSweepInterpretation("right", right, calibration, rightFit),
      warnings,
    },
    left: {
      side: "left",
      points: left,
      fit: leftFit,
      calibration,
      interpretation: buildStarlingSweepInterpretation("left", left, calibration, leftFit),
      warnings,
    },
    warnings,
  };
}

function periodLabelForSettle(settle: SettleStatus): GuytonCurvePoint["periodLabel"] {
  return (settle.periodBeats ?? 1) === 2 ? "period-2" : "period-1";
}

function buildStarlingSweepInterpretation(
  side: "right" | "left",
  points: GuytonCurvePoint[],
  calibration: StarlingCalibrationSummary | undefined,
  fit: ReturnType<typeof buildStarlingSweepFit>,
): StarlingSweepInterpretation | undefined {
  if (!calibration) return undefined;
  const measured = points
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map((point) => point.x);
  const measuredRangeMmHg = measured.length > 0
    ? { min: Math.min(...measured), max: Math.max(...measured) }
    : null;
  return {
    xAxis: side === "right" ? "RAP" : "LAP",
    yAxis: "CO",
    sweepVariable: "TBV delta",
    fitBasis: fitBasisForCalibration(calibration.mode),
    anchorDeltasMl: [...calibration.anchorDeltasMl],
    measuredRangeMmHg,
    extrapolation: fit?.extrapolatedLeft || fit?.extrapolatedRight ? "final-only dashed" : "none",
    zeroFlowConstrained: false,
    zeroFlowConstraintReason: "Starling x-axis is cycle-mean RAP/LAP from a TBV sweep, not the ESPVR volume-axis V0.",
  };
}

function fitBasisForCalibration(mode: StarlingCalibrationSummary["mode"]): StarlingSweepInterpretation["fitBasis"] {
  if (mode === "adaptive" || mode === "adaptive-audit") return "adaptive exploration";
  if (mode === "calibrated") return "calibrated anchors";
  if (mode === "full7-fallback") return "full7 fallback";
  if (mode === "custom") return "custom anchors";
  return "measured full7";
}

function defaultPointSource(mode: StarlingCalibrationSummary["mode"] | undefined): StarlingSweepPointSource | undefined {
  if (mode === "adaptive" || mode === "adaptive-audit") return "adaptive-exploration";
  if (mode === "calibrated") return "calibrated-anchor";
  if (mode === "custom") return "custom";
  return undefined;
}

function classifyStarlingSweepRunForDisplay(run: GuytonWorkerSettledRun): GuytonCurvePoint["quality"] {
  if (run.health.status === "failed") return "invalid";
  if (run.health.status === "warning") return "stress";
  if (run.reliability && run.settle.settled) return "reliable";
  if (run.reliability?.displayReliable) return "stress";
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

function starlingReliabilityForRun(
  settle: SettleStatus,
  healthStatus: "ok" | "warning" | "failed",
  metrics: SimMetrics,
  retargetFallback: boolean,
): StarlingPointReliability {
  const finite = starlingMetricsFinite(metrics);
  const validHealth = healthStatus !== "failed";
  const strictSettled = settle.settled && finite && healthStatus === "ok";
  const displayReliable = finite && validHealth;
  const seedReliable = finite && validHealth;
  return {
    strictSettled,
    displayReliable,
    seedReliable,
    seedRejectReason: seedReliable
      ? undefined
      : seedRejectReason(settle, healthStatus, finite, retargetFallback),
  };
}

function seedRejectReason(
  settle: SettleStatus,
  healthStatus: "ok" | "warning" | "failed",
  finite: boolean,
  retargetFallback: boolean,
): string {
  if (!finite) return "non-finite metrics";
  if (healthStatus === "failed") return "health failed";
  void retargetFallback;
  void settle;
  return "not seed reliable";
}

function starlingMetricsFinite(metrics: SimMetrics): boolean {
  return [
    metrics.RAPMean,
    metrics.LAPMean,
    metrics.CO_R,
    metrics.CO_L,
    metrics.SV_R,
    metrics.SV_L,
    metrics.systemicVenousReturnLMin,
    metrics.pulmonaryVenousReturnLMin,
  ].every(Number.isFinite);
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
    runtimeActiveSourceMode: req.runtimeActiveSourceMode,
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
