import type {
  GuytonChainRunResult,
  GuytonChainWorkerMessage,
  GuytonChainWorkerRequest,
  GuytonChainWorkerResponse,
} from "@/engine/guytonStarlingChainProtocol";
import { clamp } from "@/engine/math";
import { settleWorkerCore } from "@/engine/guytonStarlingWorkerCore";

export function buildGuytonChainWorkerResponse(
  req: GuytonChainWorkerRequest,
): GuytonChainWorkerResponse {
  let finalResponse: GuytonChainWorkerResponse | undefined;
  postGuytonChainWorkerMessages(req, (message) => {
    if (message.type === "chain-result") finalResponse = message;
  });
  if (!finalResponse) throw new Error("Guyton chain worker did not produce a final response");
  return finalResponse;
}

export function postGuytonChainWorkerMessages(
  req: GuytonChainWorkerRequest,
  postMessage: (message: GuytonChainWorkerMessage) => void,
): void {
  const started = performanceNow();
  const runs: GuytonChainRunResult[] = [];
  let seedState = req.baselineState;

  for (let i = 0; i < req.chainDeltas.length; i++) {
    const delta = req.chainDeltas[i];
    const run = settleWorkerCore(req, clamp(req.targetVolumeMl + delta, 2500, 8500), seedState);
    const { core: _core, ...serializableRun } = run;
    void _core;
    const result = { deltaVolumeMl: delta, run: serializableRun };
    runs.push(result);
    seedState = run.state;
    postMessage({
      type: "chain-progress",
      chainId: req.chainId,
      requestId: req.requestId,
      signature: req.signature,
      instanceId: req.instanceId,
      result,
      completedInChain: i + 1,
      totalInChain: req.chainDeltas.length,
    });
  }

  postMessage({
    type: "chain-result",
    chainId: req.chainId,
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    runs,
    chainMs: performanceNow() - started,
    retargetFallbackCount: runs.filter((result) => result.run.retargetFallback).length,
  });
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
