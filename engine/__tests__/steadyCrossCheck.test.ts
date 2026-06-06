import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import {
  CROSS_CHECK_TOLERANCE_PRESETS,
  runSteadyCrossCheck,
  type SteadyCrossCheckCategory,
  type SteadyCrossCheckPurpose,
} from "@/engine/steadyCrossCheck";
import { VERIFICATION_PROFILES } from "@/engine/verification/profiles";

const CATEGORIES: SteadyCrossCheckCategory[] = ["metrics", "residuals", "comparable", "state"];

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
      purpose: "solver-family-agreement",
      tolerances: { metrics: { abs: Number.NaN } },
    })).toThrow(/metrics\.abs/);
    expect(() => runSteadyCrossCheck(input, {
      purpose: "reference-solver-check",
      tolerances: { residuals: { rel: -1 } },
    })).toThrow(/residuals\.rel/);
  });

  it("rejects unknown cross-check purposes at runtime", () => {
    expect(() => runSteadyCrossCheck([{
      id: "baseline",
      params: DEFAULT_PARAMS,
      profile: "fitFast",
    }], {
      purpose: "unknown-purpose" as any,
    })).toThrow(/Unsupported steady cross-check purpose/);
  });

  it("reports the selected tolerance preset and keeps overrides separate", () => {
    const cases = [{
      id: "hemorrhage",
      params: { ...DEFAULT_PARAMS, bleedRate: 600 },
      profile: "fitFast" as const,
    }];

    for (const purpose of Object.keys(CROSS_CHECK_TOLERANCE_PRESETS) as SteadyCrossCheckPurpose[]) {
      const report = runSteadyCrossCheck(cases, { purpose });
      expect(report.purpose).toBe(purpose);
      expect(report.tolerancePreset.purpose).toBe(purpose);
      expect(report.tolerancePreset.tolerances).toEqual(CROSS_CHECK_TOLERANCE_PRESETS[purpose]);
      expect(report.tolerances).toEqual(CROSS_CHECK_TOLERANCE_PRESETS[purpose]);
    }

    const report = runSteadyCrossCheck(cases, {
      purpose: "solver-family-agreement",
      tolerances: { metrics: { abs: 123 } },
    });
    expect(report.tolerancePreset.tolerances.metrics.abs)
      .toBe(CROSS_CHECK_TOLERANCE_PRESETS["solver-family-agreement"].metrics.abs);
    expect(report.tolerances.metrics.abs).toBe(123);
    expect(report.tolerances.metrics.rel)
      .toBe(CROSS_CHECK_TOLERANCE_PRESETS["solver-family-agreement"].metrics.rel);
  });

  it("passes a fixed-heun self-check for the normal baseline", () => {
    const report = runSteadyCrossCheck([{
      id: "baseline",
      params: DEFAULT_PARAMS,
      profile: "fitFast",
    }]);
    const comparison = report.cases[0].comparisons[0];

    expect(report.purpose).toBe("determinism");
    expect(report.tolerances).toEqual(CROSS_CHECK_TOLERANCE_PRESETS.determinism);
    expect(report.tolerancePreset.tolerances).toEqual(CROSS_CHECK_TOLERANCE_PRESETS.determinism);
    expect(report.summary.pass).toBe(true);
    expect(report.summary.caseCount).toBe(1);
    expect(report.summary.failedCases).toBe(0);
    expect(report.cases[0].runs.map((run) => run.status)).toEqual(["converged", "converged"]);
    expect(report.cases[0].runs[0].solverStats.nBeats).toBeGreaterThan(0);
    expect(comparison.pass).toBe(true);
    expect(comparison.statusMismatch).toBe(false);
    expect(comparison.okMismatch).toBe(false);
    expect(comparison.worst.metrics?.abs ?? 0).toBeLessThanOrEqual(report.tolerances.metrics.abs);
    expect(comparison.worst.residuals?.abs ?? 0).toBeLessThanOrEqual(report.tolerances.residuals.abs);
    expect(comparison.worst.comparable?.abs ?? 0).toBeLessThanOrEqual(report.tolerances.comparable.abs);
    expect(comparison.worst.state?.abs ?? 0).toBeLessThanOrEqual(report.tolerances.state.abs);
    for (const category of CATEGORIES) {
      expect(report.summary.byCategory[category].maxNormalizedDelta).toBeGreaterThanOrEqual(0);
    }
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

  it("does not let loose numeric tolerances mask status mismatches", () => {
    const report = runSteadyCrossCheck([{
      id: "baseline",
      params: DEFAULT_PARAMS,
      profile: "fitFast",
    }], {
      purpose: "reference-solver-check",
      solvers: [
        { id: "reference", kind: "fixed-heun" },
        {
          id: "candidate",
          kind: "fixed-heun",
          options: {
            settlePolicy: {
              ...VERIFICATION_PROFILES.fitFast.settlePolicy,
              minBeats: 100,
              capSeconds: 0.001,
            },
          },
        },
      ],
      tolerances: {
        metrics: { abs: 1e12, rel: 1e12 },
        residuals: { abs: 1e12, rel: 1e12 },
        comparable: { abs: 1e12, rel: 1e12 },
        state: { abs: 1e12, rel: 1e12 },
      },
    });
    const comparison = report.cases[0].comparisons[0];

    expect(report.summary.pass).toBe(false);
    expect(comparison.pass).toBe(false);
    expect(comparison.statusMismatch).toBe(true);
    expect(comparison.failureReasons.some((reason) => reason.startsWith("status:"))).toBe(true);
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
    expect(json).not.toContain("\"wallMs\"");
    expect(json).toContain("\"xLength\"");
    expect(json).toContain("\"purpose\"");
    expect(json).toContain("\"tolerancePreset\"");
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
    expect(report.summary.byCategory.metrics.maxNormalizedDelta).toBeGreaterThan(1);
    expect(report.summary.byCategory.metrics.worst?.caseId).toBeTruthy();
    expect(Object.keys(report.summary.byCategory).sort()).toEqual([...CATEGORIES].sort());
  });
});
