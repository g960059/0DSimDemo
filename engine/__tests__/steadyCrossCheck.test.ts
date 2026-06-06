import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { runSteadyCrossCheck } from "@/engine/steadyCrossCheck";
import { VERIFICATION_PROFILES } from "@/engine/verification/profiles";

describe("steady cross-check harness", () => {
  it("rejects empty case lists instead of reporting a vacuous pass", () => {
    expect(() => runSteadyCrossCheck([])).toThrow(/at least one case/);
  });

  it("rejects invalid tolerances that would otherwise mask numeric differences", () => {
    const input = [{
      id: "baseline",
      params: DEFAULT_PARAMS,
      profile: "fitFast" as const,
    }];

    expect(() => runSteadyCrossCheck(input, {
      tolerances: { metrics: { abs: Number.NaN } },
    })).toThrow(/metrics\.abs/);
    expect(() => runSteadyCrossCheck(input, {
      tolerances: { residuals: { rel: -1 } },
    })).toThrow(/residuals\.rel/);
  });

  it("passes a fixed-heun self-check for the normal baseline", () => {
    const report = runSteadyCrossCheck([{
      id: "baseline",
      params: DEFAULT_PARAMS,
      profile: "fitFast",
    }]);
    const comparison = report.cases[0].comparisons[0];

    expect(report.summary.pass).toBe(true);
    expect(report.summary.caseCount).toBe(1);
    expect(report.summary.failedCases).toBe(0);
    expect(report.cases[0].runs.map((run) => run.status)).toEqual(["converged", "converged"]);
    expect(comparison.pass).toBe(true);
    expect(comparison.statusMismatch).toBe(false);
    expect(comparison.okMismatch).toBe(false);
    expect(comparison.worst.metrics?.abs ?? 0).toBeLessThanOrEqual(report.tolerances.metrics.abs);
    expect(comparison.worst.residuals?.abs ?? 0).toBeLessThanOrEqual(report.tolerances.residuals.abs);
    expect(comparison.worst.comparable?.abs ?? 0).toBeLessThanOrEqual(report.tolerances.comparable.abs);
    expect(comparison.worst.state?.abs ?? 0).toBeLessThanOrEqual(report.tolerances.state.abs);
  });

  it("passes forced-trend self-checks even when SteadyResult is not ok", () => {
    const report = runSteadyCrossCheck([{
      id: "hemorrhage",
      params: { ...DEFAULT_PARAMS, bleedRate: 600 },
      profile: "fitFast",
    }]);
    const run = report.cases[0].runs[0];

    expect(report.summary.pass).toBe(true);
    expect(run.ok).toBe(false);
    expect(run.status).toBe("forced-trend");
    expect(report.cases[0].comparisons[0].pass).toBe(true);
  });

  it("passes cap self-checks when both solvers hit the same cap", () => {
    const report = runSteadyCrossCheck([{
      id: "cap",
      params: DEFAULT_PARAMS,
      profile: {
        ...VERIFICATION_PROFILES.fitFast,
        settlePolicy: {
          ...VERIFICATION_PROFILES.fitFast.settlePolicy,
          minBeats: 100,
          capSeconds: 0.001,
        },
      },
    }]);

    expect(report.summary.pass).toBe(true);
    expect(report.cases[0].runs.map((run) => run.status)).toEqual(["cap", "cap"]);
    expect(report.cases[0].runs[0].state.xLength).toBeGreaterThan(0);
    expect(Object.values(report.cases[0].runs[0].solverStats)
      .filter((value) => typeof value === "number")
      .every(Number.isFinite)).toBe(true);
  });

  it("fails strict comparison when solver options intentionally differ", () => {
    const report = runSteadyCrossCheck([{
      id: "baseline",
      params: DEFAULT_PARAMS,
      profile: "fitFast",
    }], {
      solvers: [
        { id: "reference", kind: "fixed-heun" },
        { id: "candidate", kind: "fixed-heun", options: { targetTBV: 5700 } },
      ],
    });
    const comparison = report.cases[0].comparisons[0];

    expect(report.summary.pass).toBe(false);
    expect(report.summary.failedCases).toBe(1);
    expect(report.summary.failedComparisons).toBe(1);
    expect(comparison.pass).toBe(false);
    expect(comparison.failureReasons.length).toBeGreaterThan(0);
    expect(report.summary.maxNormalizedDelta).toBeGreaterThan(1);
    expect(report.summary.worst?.caseId).toBe("baseline");
  });

  it("keeps the cross-check artifact compact", () => {
    const report = runSteadyCrossCheck([{
      id: "baseline",
      params: DEFAULT_PARAMS,
      profile: "fitFast",
    }]);
    const json = JSON.stringify(report);

    expect(json).not.toContain("\"samples\"");
    expect(json).not.toContain("\"lastBeatSamples\"");
    expect(json).not.toContain("\"x\"");
    expect(json).toContain("\"xLength\"");
  });

  it("aggregates multiple case failures and max delta", () => {
    const report = runSteadyCrossCheck([
      { id: "baseline", params: DEFAULT_PARAMS, profile: "fitFast" },
      { id: "hyperdynamic", params: { ...DEFAULT_PARAMS, lvTmaxScale: 1.1 }, profile: "fitFast" },
    ], {
      solvers: [
        { id: "reference", kind: "fixed-heun" },
        { id: "candidate", kind: "fixed-heun", options: { targetTBV: 5700 } },
      ],
    });

    expect(report.summary.caseCount).toBe(2);
    expect(report.summary.comparisonCount).toBe(2);
    expect(report.summary.failedCases).toBeGreaterThan(0);
    expect(report.summary.failedComparisons).toBeGreaterThan(0);
    expect(report.summary.maxNormalizedDelta).toBeGreaterThan(1);
    expect(report.summary.worst).not.toBeNull();
  });
});
