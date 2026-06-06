import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import {
  isCurrentTransitionSteadyResult,
  makeTransitionTargetSignature,
  type TransitionSteadyCompletedResult,
  type TransitionSteadyJobRequest,
  type TransitionSteadyJobResult,
  type TransitionSteadyPendingJob,
} from "@/engine/transitionSteadyProtocol";
import type { SteadyResult } from "@/engine/stateContract";

const steady = {
  ok: true,
  status: "converged",
} as SteadyResult;

const request = (overrides: Partial<TransitionSteadyJobRequest> = {}): TransitionSteadyJobRequest => ({
  type: "computeTransitionSteady",
  jobId: "job-1",
  generation: 1,
  instanceId: "heart-a",
  fromSignature: "from",
  toSignature: "to",
  params: { ...DEFAULT_PARAMS },
  targetVolume: 5600,
  options: {},
  ...overrides,
});

const result = (overrides: Partial<TransitionSteadyCompletedResult> = {}): TransitionSteadyCompletedResult => ({
  type: "transitionSteadyResult",
  jobId: "job-1",
  generation: 1,
  instanceId: "heart-a",
  toSignature: "to",
  outcome: "completed",
  steady,
  ...overrides,
});

// @ts-expect-error completed transition steady results must carry a steady result.
const emptyCompletedResult: TransitionSteadyJobResult = {
  type: "transitionSteadyResult",
  jobId: "job-1",
  generation: 1,
  instanceId: "heart-a",
  toSignature: "to",
  outcome: "completed",
};

// @ts-expect-error error transition steady results must carry an error message.
const emptyErrorResult: TransitionSteadyJobResult = {
  type: "transitionSteadyResult",
  jobId: "job-1",
  generation: 1,
  instanceId: "heart-a",
  toSignature: "to",
  outcome: "error",
};

void emptyCompletedResult;
void emptyErrorResult;

describe("transition steady protocol", () => {
  it("builds deterministic target signatures and ignores simulation speed", () => {
    const base = makeTransitionTargetSignature({ params: { ...DEFAULT_PARAMS }, targetVolume: 5600 });
    const same = makeTransitionTargetSignature({ params: { ...DEFAULT_PARAMS }, targetVolume: 5600 });
    const speedOnly = makeTransitionTargetSignature({
      params: { ...DEFAULT_PARAMS, speed: DEFAULT_PARAMS.speed + 3 },
      targetVolume: 5600,
    });

    expect(base).toBe(same);
    expect(base).toBe(speedOnly);
  });

  it("changes target signatures when physical params or target volume change", () => {
    const base = makeTransitionTargetSignature({ params: { ...DEFAULT_PARAMS }, targetVolume: 5600 });
    const hrChanged = makeTransitionTargetSignature({
      params: { ...DEFAULT_PARAMS, HR: DEFAULT_PARAMS.HR + 1 },
      targetVolume: 5600,
    });
    const volumeChanged = makeTransitionTargetSignature({
      params: { ...DEFAULT_PARAMS },
      targetVolume: 5700,
    });

    expect(hrChanged).not.toBe(base);
    expect(volumeChanged).not.toBe(base);
  });

  it("accepts only results matching the pending job identity", () => {
    const pending: TransitionSteadyPendingJob = { request: request() };

    expect(isCurrentTransitionSteadyResult(result(), pending)).toBe(true);
    expect(isCurrentTransitionSteadyResult(result({ jobId: "job-2" }), pending)).toBe(false);
    expect(isCurrentTransitionSteadyResult(result({ generation: 2 }), pending)).toBe(false);
    expect(isCurrentTransitionSteadyResult(result({ instanceId: "heart-b" }), pending)).toBe(false);
    expect(isCurrentTransitionSteadyResult(result({ toSignature: "other" }), pending)).toBe(false);
    expect(isCurrentTransitionSteadyResult(result(), undefined)).toBe(false);
  });

  it("requires completed steady metadata without requiring samples or state vectors", () => {
    const minimal = result();
    const failed: TransitionSteadyJobResult = {
      type: "transitionSteadyResult",
      jobId: "job-1",
      generation: 1,
      instanceId: "heart-a",
      toSignature: "to",
      outcome: "error",
      message: "boom",
    };
    const json = JSON.stringify({ minimal, failed });

    expect(json).toContain("\"steady\"");
    expect(json).not.toContain("\"samples\"");
    expect(json).not.toContain("\"x\"");
    expect(json).toContain("\"transitionSteadyResult\"");
  });
});
