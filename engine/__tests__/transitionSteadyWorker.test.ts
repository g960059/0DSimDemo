import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import {
  computeTransitionSteadyJob,
  transitionSteadyErrorResult,
} from "@/engine/transitionSteadyWorker";
import { makeTransitionTargetSignature, type TransitionSteadyJobRequest } from "@/engine/transitionSteadyProtocol";

const request = (overrides: Partial<TransitionSteadyJobRequest> = {}): TransitionSteadyJobRequest => {
  const params = overrides.params ?? { ...DEFAULT_PARAMS };
  const targetVolume = overrides.targetVolume ?? 5600;
  const toSignature = makeTransitionTargetSignature({ params, targetVolume });
  return {
    type: "computeTransitionSteady",
    jobId: "transition-job-1",
    generation: 1,
    instanceId: "heart-a",
    fromSignature: "from",
    toSignature,
    params,
    targetVolume,
    options: {
      targetTBV: targetVolume,
      dt: 0.002,
      sampleHz: 120,
      settlePolicy: PREVIEW_SETTLE_POLICY,
      measureBeats: 1,
      includeLastBeatSamples: true,
      requireProjectorQuiet: false,
    },
    ...overrides,
  };
};

describe("transition steady worker", () => {
  it("computes a completed baseline transition steady result", () => {
    const req = request();
    const result = computeTransitionSteadyJob(req);

    expect(result.outcome).toBe("completed");
    expect(result.jobId).toBe(req.jobId);
    expect(result.generation).toBe(req.generation);
    expect(result.instanceId).toBe(req.instanceId);
    expect(result.toSignature).toBe(req.toSignature);
    expect(result.steady.status).toBe("converged");
    expect(result.steady.lastBeatSamples?.length).toBeGreaterThanOrEqual(5);
    expect(result.samples?.length).toBe(result.steady.lastBeatSamples?.length);
    expect(result.snapshot?.t).toBe(result.steady.state.t);
    expect(result.snapshot?.metrics.CO_L).toBeCloseTo(result.steady.metrics.CO_L, 12);
    expect(result.snapshot?.health.status).toBe(result.steady.health.status);
    expect(result.snapshot?.settleStatus?.beats).toBe(result.steady.solverStats.nBeats);
    expect(result.snapshot?.observables.expectedTBV).toBeGreaterThan(0);
  });

  it("returns forced-trend steady results without throwing", () => {
    const result = computeTransitionSteadyJob(request({
      params: { ...DEFAULT_PARAMS, bleedRate: 600 },
    }));

    expect(result.outcome).toBe("completed");
    expect(result.steady.status).toBe("forced-trend");
    expect(result.samples).toBeUndefined();
    expect(result.snapshot?.settleStatus?.reason).toBe("forced-trend");
  });

  it("keeps the result payload compact apart from the serialized steady state", () => {
    const result = computeTransitionSteadyJob(request());
    const json = JSON.stringify(result);

    expect(json).not.toContain("\"core\"");
    expect(json).not.toContain("\"measurement\"");
    expect(json).not.toContain("\"history\"");
    expect(result.steady.state.x.length).toBeGreaterThan(0);
  });

  it("builds required-message error results", () => {
    const req = request();
    const result = transitionSteadyErrorResult(req, new Error("boom"));

    expect(result.outcome).toBe("error");
    expect(result.message).toBe("boom");
    expect(result.jobId).toBe(req.jobId);
    expect(result.instanceId).toBe(req.instanceId);
    expect(result.toSignature).toBe(req.toSignature);
  });
});
