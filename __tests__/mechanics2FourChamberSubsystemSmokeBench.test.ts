import { describe, expect, it } from "vitest";
import {
  runFourChamberSubsystemSmokeBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSubsystemSmokeBench";
import fourChamberSubsystemReport from "@/data/mechanics2/reports/four-chamber-subsystem-smoke-report-v1.json";

describe("MechanicsCore2 four-chamber subsystem smoke bench", () => {
  it("keeps the first epoch-level four-chamber subsystem smoke bounded", () => {
    const report = runFourChamberSubsystemSmokeBenchV1();

    expect(report.decision.subsystemSmokeStatus).toBe("four-chamber-subsystem-smoke-pass");
    expect(report.summary).toMatchObject({
      totalScaffolds: 2,
      passCount: 2,
      selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
    });
    expect(report.summary.selectedMeanAbsForwardMismatchMl).toBeLessThanOrEqual(6);
    expect(report.summary.selectedMaxAcceptedTransferMl).toBeLessThanOrEqual(2);
    expect(report.summary.selectedMaxReservoirVolumeMl).toBeLessThanOrEqual(20);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    const selected = report.selectedScaffold!;
    expect(selected.status).toBe("pass");
    expect(selected.summary.profileCount).toBe(7);
    expect(selected.summary.passCount).toBe(7);
    expect(selected.summary.morphologyPreservedCount).toBe(7);
    expect(selected.summary.flowBalancedCount).toBe(7);
    expect(selected.summary.repeatableCount).toBe(7);
    expect(selected.summary.phenotypeScopeOkCount).toBe(7);
  });

  it("keeps the committed four-chamber subsystem artifact aligned with the rerun summary", () => {
    const report = runFourChamberSubsystemSmokeBenchV1();
    expect(fourChamberSubsystemReport.reportId).toBe(report.reportId);
    expect(fourChamberSubsystemReport.summary).toEqual(report.summary);
    expect(fourChamberSubsystemReport.decision).toEqual(report.decision);
    expect(typeof fourChamberSubsystemReport.normalizedSha256).toBe("string");
    expect(fourChamberSubsystemReport.normalizedSha256).toHaveLength(64);
  });
});
