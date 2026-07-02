import { describe, expect, it } from "vitest";
import {
  runFourChamberSmoothReservoirDynamicsReviewBenchV1,
  type FourChamberSmoothReservoirDynamicsReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirDynamicsReviewBench";

describe("FourChamberSmoothReservoirDynamicsReviewBench V1", () => {
  let report: FourChamberSmoothReservoirDynamicsReviewReportV1;

  it("passes the selected smooth reservoir dynamics review without runtime unlock claims", () => {
    report = runFourChamberSmoothReservoirDynamicsReviewBenchV1();
    expect(report.decision.smoothReservoirDynamicsStatus).toBe("smooth-reservoir-dynamics-review-pass");
    expect(report.ownershipSummary.ownershipStatus).toBe("smooth-reservoir-ownership-signal");
    expect(report.inputs.selectedCandidateId).toBe("smooth-knee20-gain035-bound24");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps hard fallback inactive and feedback dissipative across reviewed points", () => {
    report ??= runFourChamberSmoothReservoirDynamicsReviewBenchV1();
    expect(report.summary.allReviewedPass).toBe(true);
    expect(report.summary.hardLimiterFree).toBe(true);
    expect(report.summary.feedbackDissipative).toBe(true);
    expect(report.summary.feedbackKneeClean).toBe(true);
    expect(report.summary.maxPositiveFeedbackWorkProxyMl2).toBe(0);
    expect(report.dynamicsPoints.every((point) => point.hardLimiterHitCount === 0)).toBe(true);
    expect(report.dynamicsPoints.every((point) => point.nonDissipativeFeedbackCount === 0)).toBe(true);
  });

  it("keeps the preload-low extended stress probes repeatable", () => {
    report ??= runFourChamberSmoothReservoirDynamicsReviewBenchV1();
    const stressPoints = report.dynamicsPoints.filter((point) =>
      String(point.scenarioId).startsWith("stress"));
    expect(stressPoints.map((point) => point.scenarioId)).toEqual(["stress-56", "stress-84", "stress-112"]);
    expect(stressPoints.every((point) => point.effectiveStatus === "pass")).toBe(true);
    expect(stressPoints.every((point) => point.finalReservoirStepMl === 0)).toBe(true);
    expect(stressPoints.every((point) => point.hardLimiterDutyFraction === 0)).toBe(true);
    expect(report.summary.stressRepeatable).toBe(true);
  });
});
