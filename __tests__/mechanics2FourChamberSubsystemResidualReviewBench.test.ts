import { describe, expect, it } from "vitest";
import {
  runFourChamberSubsystemResidualReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSubsystemResidualReviewBench";
import residualReviewReport from "@/data/mechanics2/reports/four-chamber-subsystem-residual-review-report-v1.json";

describe("MechanicsCore2 four-chamber subsystem residual review bench", () => {
  it("keeps the selected scaffold residual review honest before further expansion", () => {
    const report = runFourChamberSubsystemResidualReviewBenchV1();

    expect(report.decision.residualReviewStatus).toBe("four-chamber-subsystem-residual-review-mixed");
    expect(report.summary).toMatchObject({
      scenarioCount: 3,
      passScenarioCount: 1,
      nominalPassCount: 7,
      dtHalfPassCount: 4,
      longEpochPassCount: 6,
    });
    expect(report.summary.maxDtHalfMismatchDeltaMl).toBeGreaterThan(6);
    expect(report.summary.maxLongEpochReservoirVolumeMl).toBeGreaterThan(28);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    const dtHalf = report.scenarioResults.find((scenario) => scenario.scenario.scenarioId === "dt-half")!;
    const longEpochs = report.scenarioResults.find((scenario) => scenario.scenario.scenarioId === "long-epochs")!;
    expect(dtHalf.failureReasons).toEqual([
      "preload-low: left-surface-not-preserved,right-surface-not-preserved",
      "afterload-high: left-surface-not-preserved",
      "contractility-low: right-surface-not-preserved,unexpected-accepted-phenotype",
    ]);
    expect(longEpochs.failureReasons).toEqual([
      "preload-low: persistent-large-reservoir-shuttle",
    ]);
  });

  it("keeps the committed residual-review artifact aligned with the rerun summary", () => {
    const report = runFourChamberSubsystemResidualReviewBenchV1();
    expect(residualReviewReport.reportId).toBe(report.reportId);
    expect(residualReviewReport.summary).toEqual(report.summary);
    expect(residualReviewReport.decision).toEqual(report.decision);
    expect(typeof residualReviewReport.normalizedSha256).toBe("string");
    expect(residualReviewReport.normalizedSha256).toHaveLength(64);
  });
});
