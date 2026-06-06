import { ModelCore } from "@/engine/ModelCore";
import type { PreviewCoreSnapshot } from "@/engine/previewWorkerProtocol";
import { runToPeriodicSteadyInternal } from "@/engine/steadyJob";
import type {
  TransitionSteadyErrorResult,
  TransitionSteadyJobRequest,
  TransitionSteadyJobResult,
} from "@/engine/transitionSteadyProtocol";

export function computeTransitionSteadyJob(request: TransitionSteadyJobRequest): TransitionSteadyJobResult {
  const run = runToPeriodicSteadyInternal(request.params, request.options);
  const steady = run.result;
  return {
    type: "transitionSteadyResult",
    jobId: request.jobId,
    generation: request.generation,
    instanceId: request.instanceId,
    toSignature: request.toSignature,
    outcome: "completed",
    steady,
    ...(steady.lastBeatSamples ? { samples: steady.lastBeatSamples } : {}),
    snapshot: snapshotFromSteady(request, run),
  };
}

export function transitionSteadyErrorResult(
  request: TransitionSteadyJobRequest,
  err: unknown,
): TransitionSteadyErrorResult {
  return {
    type: "transitionSteadyResult",
    jobId: request.jobId,
    generation: request.generation,
    instanceId: request.instanceId,
    toSignature: request.toSignature,
    outcome: "error",
    message: err instanceof Error ? err.message : String(err),
  };
}

function snapshotFromSteady(
  request: TransitionSteadyJobRequest,
  run: ReturnType<typeof runToPeriodicSteadyInternal>,
): PreviewCoreSnapshot {
  const core = new ModelCore(request.params);
  core.initializeVenousPressuresForTargetTBV(request.targetVolume);
  core.unpackState(run.result.state);
  return {
    t: core.t,
    p: core.p,
    metrics: run.result.metrics,
    health: run.result.health,
    observables: core.debugObservables(),
    settleStatus: run.settleStatus,
  };
}

if (typeof self !== "undefined") {
  self.onmessage = (event: MessageEvent<TransitionSteadyJobRequest>) => {
    const request = event.data;
    try {
      self.postMessage(computeTransitionSteadyJob(request));
    } catch (err) {
      self.postMessage(transitionSteadyErrorResult(request, err));
    }
  };
}
