import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { evaluateCandidate, rankCandidates } from "@/engine/fitting/evaluateCandidate";
import { makeCandidatePatch } from "@/engine/fitting/parameterSpace";
import { reportToMarkdown, runVerification } from "@/engine/verification/report";

describe("fitting/verification mode foundation", () => {
  it("runs a headless fit-fast normal-baseline verification report", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "fitFast",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    const hardFailures = report.gates
      .filter((gate) => gate.severity === "hard" && gate.status === "fail")
      .map((gate) => ({ id: gate.id, value: gate.value, threshold: gate.threshold }));
    expect(hardFailures).toEqual([]);
    expect(report.summary.pass).toBe(true);
    expect(report.metrics).not.toBeNull();
    expect(report.shape).not.toBeNull();
    expect(report.shape?.pvfSFraction).toBeGreaterThan(0.40);
    expect(report.shape?.laSelfIntersections).toBeGreaterThanOrEqual(1);

    const markdown = reportToMarkdown(report);
    expect(markdown).toContain("Verification Report");
    expect(markdown).toContain("Profile: Fit fast");
    expect(markdown).toContain("PVF S fraction");
  });

  it("enforces final normal-baseline gates under verify-accurate mode", () => {
    const report = runVerification(DEFAULT_PARAMS, {
      profile: "verifyAccurate",
      gateSet: "normalBaseline",
      now: new Date("2026-06-05T00:00:00.000Z"),
    });
    expect(report.gates.filter((gate) => gate.severity === "hard" && gate.status === "fail")).toEqual([]);
    expect(report.gates.filter((gate) => gate.severity === "soft" && gate.status === "fail")).toEqual([]);
    expect(report.summary.pass).toBe(true);
  });

  it("evaluates and ranks fitting candidates using hard-gate failures first", () => {
    const neutral = makeCandidatePatch("neutral-rv", [
      { id: "rvTmaxScale", value: DEFAULT_PARAMS.rvTmaxScale },
    ]);
    const excessiveMitralLoss = makeCandidatePatch("excessive-mv-r", [
      { id: "MV_R", value: 0.08 },
    ]);

    const neutralEval = evaluateCandidate(neutral, DEFAULT_PARAMS, { profile: "fitFast" });
    const badEval = evaluateCandidate(excessiveMitralLoss, DEFAULT_PARAMS, { profile: "fitFast" });
    const ranked = rankCandidates([badEval, neutralEval]);

    expect(neutralEval.hardFailures.map((gate) => gate.id)).toEqual([]);
    expect(neutralEval.accepted).toBe(true);
    expect(badEval.accepted).toBe(false);
    expect(badEval.rejectStage).not.toBe("none");
    expect(ranked[0].id).toBe("neutral-rv");
  });
});
