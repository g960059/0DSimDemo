import type {
  GuytonChainRunResult,
  GuytonChainWorkerRequest,
  GuytonChainWorkerResponse,
} from "@/engine/guytonStarlingChainProtocol";
import { clamp } from "@/engine/math";
import { settleWorkerCore } from "@/engine/guytonStarlingWorkerCore";

export function buildGuytonChainWorkerResponse(
  req: GuytonChainWorkerRequest,
): GuytonChainWorkerResponse {
  const started = performanceNow();
  const runs: GuytonChainRunResult[] = [];
  let seedState = req.baselineState;

  for (const delta of req.chainDeltas) {
    const run = settleWorkerCore(req, clamp(req.targetVolumeMl + delta, 2500, 8500), seedState);
    const { core: _core, ...serializableRun } = run;
    void _core;
    runs.push({ deltaVolumeMl: delta, run: serializableRun });
    seedState = run.state;
  }

  return {
    type: "chain-result",
    chainId: req.chainId,
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    runs,
    chainMs: performanceNow() - started,
    retargetFallbackCount: runs.filter((result) => result.run.retargetFallback).length,
  };
}

export function buildGuytonChainWorkerErrorResponse(
  req: Partial<GuytonChainWorkerRequest>,
  err: unknown,
): GuytonChainWorkerResponse {
  return {
    type: "chain-result",
    chainId: req.chainId ?? "positive",
    requestId: req.requestId ?? "",
    signature: req.signature ?? "",
    instanceId: req.instanceId ?? "",
    runs: [],
    chainMs: 0,
    retargetFallbackCount: 0,
    error: err instanceof Error ? err.message : "Unknown Guyton chain worker failure",
  };
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}
