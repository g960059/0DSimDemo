import type { PreviewCoreSnapshot } from "@/engine/previewWorkerProtocol";
import type { CoreRuntimeParams, SimSample } from "@/engine/protocol";
import type { RunToPeriodicSteadyOptions, SteadyResult } from "@/engine/stateContract";
import { simpleStableHash } from "@/engine/stateContract";

export type TransitionSteadyJobOutcome = "completed" | "stale" | "error";

export type TransitionSteadyTarget = {
  params: CoreRuntimeParams;
  targetVolume: number;
};

export type TransitionSteadyJobRequest = {
  type: "computeTransitionSteady";
  jobId: string;
  generation: number;
  instanceId: string;
  fromSignature: string;
  toSignature: string;
  params: CoreRuntimeParams;
  targetVolume: number;
  options: RunToPeriodicSteadyOptions;
};

export type TransitionSteadyCompletedResult = {
  type: "transitionSteadyResult";
  jobId: string;
  generation: number;
  instanceId: string;
  toSignature: string;
  outcome: "completed";
  steady: SteadyResult;
  samples?: SimSample[];
  snapshot?: PreviewCoreSnapshot;
};

export type TransitionSteadyStaleResult = {
  type: "transitionSteadyResult";
  jobId: string;
  generation: number;
  instanceId: string;
  toSignature: string;
  outcome: "stale";
  message?: string;
  steady?: never;
  samples?: never;
  snapshot?: never;
};

export type TransitionSteadyErrorResult = Omit<TransitionSteadyStaleResult, "outcome" | "message"> & {
  outcome: "error";
  message: string;
};

export type TransitionSteadyNonCompletedResult =
  | TransitionSteadyStaleResult
  | TransitionSteadyErrorResult;

export type TransitionSteadyJobResult =
  | TransitionSteadyCompletedResult
  | TransitionSteadyNonCompletedResult;

export type TransitionSteadyPendingJob = {
  request: TransitionSteadyJobRequest;
};

// This signature is the physical target identity for transition steady work.
// It intentionally differs from PreviewController's live-display signature:
// simulation speed is excluded here because it does not change the steady state.
export function makeTransitionTargetSignature(target: TransitionSteadyTarget): string {
  const { speed: _speed, ...steadyParams } = target.params;
  return simpleStableHash({
    params: steadyParams,
    targetVolume: target.targetVolume,
  });
}

export function isCurrentTransitionSteadyResult(
  result: TransitionSteadyJobResult,
  pending: TransitionSteadyPendingJob | undefined,
): boolean {
  if (!pending) return false;
  const request = pending.request;
  return result.jobId === request.jobId
    && result.generation === request.generation
    && result.instanceId === request.instanceId
    && result.toSignature === request.toSignature;
}
