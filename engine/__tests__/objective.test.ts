import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import {
  collectObjectiveObservables,
  evaluateObjective,
} from "@/engine/fitting/objective";
import { VERIFICATION_PROFILES } from "@/engine/verification/profiles";
import { runVerification } from "@/engine/verification/report";

describe("calibration objective", () => {
  it("records a finite ok objective for the normal baseline", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    const objective = evaluateObjective(report);

    expect(objective.ok).toBe(true);
    expect(Number.isFinite(objective.totalLoss)).toBe(true);
    expect(objective.targetLoss).toBe(0);
    expect(objective.steady?.status).toBe("converged");
    expect(objective.rejectReasons).toEqual([]);
    expect(objective.observables["metrics.CO_L"]).toBeGreaterThan(0);
    expect(objective.observables["steady.state.xLength"]).toBeGreaterThan(0);
  });

  it("penalizes forced-trend candidates without throwing", () => {
    const report = runVerification({ ...DEFAULT_PARAMS, bleedRate: 600 }, {
      profile: "fitFast",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    const objective = evaluateObjective(report);

    expect(objective.ok).toBe(false);
    expect(objective.steady?.status).toBe("forced-trend");
    expect(objective.convergencePenalty).toBeGreaterThanOrEqual(1e5);
    expect(objective.rejectReasons).toContain("steady:forced-trend");
    expect(objective.rejectReasons).toContain("hard-gate:settled");
    expect(Number.isFinite(objective.totalLoss)).toBe(true);
  });

  it("penalizes settle cap reports as finite objective results", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: {
        ...VERIFICATION_PROFILES.fitFast,
        settlePolicy: {
          ...VERIFICATION_PROFILES.fitFast.settlePolicy,
          minBeats: 100,
          capSeconds: 0.001,
        },
      },
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    const objective = evaluateObjective(report);

    expect(objective.ok).toBe(false);
    expect(objective.steady?.status).toBe("cap");
    expect(objective.convergencePenalty).toBeGreaterThanOrEqual(1e5);
    expect(objective.rejectReasons).toContain("steady:cap");
    expect(objective.rejectReasons).toContain("hard-gate:settled");
    expect(Number.isFinite(objective.totalLoss)).toBe(true);
  });

  it("supports match, atLeast, atMost, and missing target terms", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    const co = report.metrics?.CO_L ?? 0;
    const objective = evaluateObjective(report, {
      targets: [
        { key: "metrics.CO_L", target: co, scale: 1 },
        { key: "metrics.CO_L", target: co - 1, scale: 1, direction: "atLeast" },
        { key: "metrics.CO_L", target: co + 1, scale: 1, direction: "atMost" },
        { key: "metrics.CO_L", target: co + 1, scale: 1, direction: "atLeast" },
        { key: "metrics.noSuchObservable", target: 1, scale: 1 },
      ],
    });

    expect(objective.targetBreakdown.map((item) => item.loss)).toEqual([0, 0, 0, 1, 1e6]);
    expect(objective.targetLoss).toBe(1_000_001);
    expect(objective.rejectReasons).toContain("missing-target:metrics.noSuchObservable");
    expect(objective.ok).toBe(false);
  });

  it("applies projector quiet override only when requested", () => {
    const base = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    const report = {
      ...base,
      steady: base.steady
        ? {
          ...base.steady,
          residuals: {
            ...base.steady.residuals,
            projectorQuiet: false,
          },
        }
        : null,
    };

    expect(evaluateObjective(report).rejectReasons).not.toContain("projector-not-quiet");
    const strict = evaluateObjective(report, { requireProjectorQuiet: true });
    expect(strict.convergencePenalty).toBeGreaterThanOrEqual(1e3);
    expect(strict.rejectReasons).toContain("projector-not-quiet");
  });

  it("collects only finite compact observables", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    const observables = collectObjectiveObservables(report);
    const json = JSON.stringify(evaluateObjective(report));

    expect(Object.values(observables).every(Number.isFinite)).toBe(true);
    expect(json).not.toContain("\"samples\"");
    expect(json).not.toContain("\"x\"");
    expect(json).toContain("xLength");
  });
});
