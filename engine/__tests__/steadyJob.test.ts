import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { measureConverged } from "@/engine/measure";
import { runToPeriodicSteady, runToPeriodicSteadyInternal } from "@/engine/steadyJob";
import { VERIFICATION_PROFILES } from "@/engine/verification/profiles";

const FIT_FAST_OPTIONS = {
  targetTBV: VERIFICATION_PROFILES.fitFast.targetTBV,
  dt: VERIFICATION_PROFILES.fitFast.dt,
  sampleHz: VERIFICATION_PROFILES.fitFast.sampleHz,
  settlePolicy: VERIFICATION_PROFILES.fitFast.settlePolicy,
  measureBeats: 2,
  requireProjectorQuiet: VERIFICATION_PROFILES.fitFast.requireProjectorQuiet,
};

describe("runToPeriodicSteady", () => {
  it("returns a serializable converged baseline result", () => {
    const result = runToPeriodicSteady(DEFAULT_PARAMS, FIT_FAST_OPTIONS);

    expect(result.ok).toBe(true);
    expect(result.status).toBe("converged");
    expect(result.metrics.CO_L).toBeGreaterThan(0);
    expect(result.health.status).not.toBe("failed");
    expect(result.state.x.length).toBeGreaterThan(0);
    expect(result.residuals.worstSignal === null || typeof result.residuals.worstSignal === "string").toBe(true);
    expect(result.solverStats.kind).toBe("fixed-heun");
    expect(result.solverStats.nSteps).toBeGreaterThan(0);
    expect(result.solverStats.nBeats).toBeGreaterThan(0);
    expect(result.lastBeatSamples).toBeUndefined();
    expect("measurement" in (result as Record<string, unknown>)).toBe(false);
    expect("core" in (result as Record<string, unknown>)).toBe(false);
    expect(JSON.stringify(result)).not.toContain("\"samples\"");
  });

  it("exposes measurement only through the internal runner for converged runs", () => {
    const internal = runToPeriodicSteadyInternal(DEFAULT_PARAMS, FIT_FAST_OPTIONS);

    expect(internal.measurement).not.toBeNull();
    expect(internal.settleStatus.settled).toBe(true);
    expect(internal.result.solverStats.nBeats).toBe(internal.settleStatus.beats);
    expect(internal.result.metrics.CO_L).toBeCloseTo(internal.measurement!.metrics.CO_L, 12);
    expect(internal.result.residuals.leftRightSvMismatchLMin).toBeCloseTo(internal.measurement!.forwardCODiffLMin, 12);
  });

  it("returns forced-trend for ongoing hemorrhage without throwing", () => {
    const result = runToPeriodicSteady({ ...DEFAULT_PARAMS, bleedRate: 600 }, FIT_FAST_OPTIONS);

    expect(result.ok).toBe(false);
    expect(result.status).toBe("forced-trend");
    expect(result.solverStats.settleSeconds).toBe(0);
    expect(result.residuals.projectorQuiet).toBe(false);
    expect(result.residuals.venousMaxResidualMl).toBeNull();
    expect(result.residuals.tbvDriftPctPer60s).toBeNull();
  });

  it("does not measure failed internal runs", () => {
    const forcedTrend = runToPeriodicSteadyInternal({ ...DEFAULT_PARAMS, bleedRate: 600 }, FIT_FAST_OPTIONS);
    const capped = runToPeriodicSteadyInternal(DEFAULT_PARAMS, {
      ...FIT_FAST_OPTIONS,
      settlePolicy: {
        ...FIT_FAST_OPTIONS.settlePolicy,
        minBeats: 100,
        capSeconds: 0.001,
      },
    });

    expect(forcedTrend.result.status).toBe("forced-trend");
    expect(forcedTrend.measurement).toBeNull();
    expect(forcedTrend.result.solverStats.nBeats).toBe(forcedTrend.settleStatus.beats);
    expect(capped.result.status).toBe("cap");
    expect(capped.measurement).toBeNull();
    expect(capped.result.solverStats.nBeats).toBe(capped.settleStatus.beats);
  });

  it("returns cap for a settle policy that cannot converge before the cap", () => {
    const result = runToPeriodicSteady(DEFAULT_PARAMS, {
      ...FIT_FAST_OPTIONS,
      settlePolicy: {
        ...FIT_FAST_OPTIONS.settlePolicy,
        minBeats: 100,
        capSeconds: 0.001,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("cap");
    expect(result.state.x.every(Number.isFinite)).toBe(true);
    expect(result.residuals.projectorQuiet).toBe(false);
    expect(result.residuals.venousMaxResidualMl).toBeNull();
  });

  it("includes last beat samples only when requested", () => {
    const withoutSamples = runToPeriodicSteady(DEFAULT_PARAMS, FIT_FAST_OPTIONS);
    const withSamples = runToPeriodicSteady(DEFAULT_PARAMS, {
      ...FIT_FAST_OPTIONS,
      includeLastBeatSamples: true,
    });

    expect(withoutSamples.lastBeatSamples).toBeUndefined();
    expect(withSamples.lastBeatSamples?.length).toBeGreaterThanOrEqual(5);
  });

  it("agrees with measureConverged metrics for the same options", () => {
    const result = runToPeriodicSteady(DEFAULT_PARAMS, FIT_FAST_OPTIONS);
    const measurement = measureConverged(DEFAULT_PARAMS, FIT_FAST_OPTIONS);

    expect(result.metrics.CO_L).toBeCloseTo(measurement.metrics.CO_L, 6);
    expect(result.metrics.CO_R).toBeCloseTo(measurement.metrics.CO_R, 6);
    expect(result.metrics.AoPMean).toBeCloseTo(measurement.metrics.AoPMean, 6);
    expect(result.residuals.leftRightSvMismatchLMin).toBeCloseTo(measurement.forwardCODiffLMin, 6);
    expect(result.residuals.venousMaxResidualMl).toBeCloseTo(measurement.venousBalances.maxResidualMl, 6);
  });
});
