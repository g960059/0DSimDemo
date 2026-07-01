import { describe, expect, it } from "vitest";
import {
  runRightHeartStrategicSmokeBenchV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import rightHeartReport from "@/data/mechanics2/reports/right-heart-strategic-smoke-report-v1.json";

describe("MechanicsCore2 right-heart strategic smoke bench", () => {
  it("records a bounded right-heart mixed signal without four-chamber or LandAtrial claims", () => {
    const report = runRightHeartStrategicSmokeBenchV1();

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
    expect(report.decision.rightHeartGateBStatus).toBe("mixed-signal");
    expect(report.summary).toMatchObject({
      total: 7,
      pass: 4,
      fail: 3,
      inconclusive: 0,
      rvPvOkCount: 7,
      tvfOkCount: 7,
      outputOkCount: 7,
      repeatabilityOkCount: 7,
      dtStableCount: 7,
      flowCoupledCount: 7,
      clampFreeCount: 7,
      safetyWorkBoundedCount: 4,
      morphologyOkCount: 4,
      highDriveArtifactCount: 0,
    });

    const normal = report.pointResults.find((point) => point.pointId === "right-heart-normal-hr75")!;
    const preloadHigh = report.pointResults.find((point) => point.pointId === "right-heart-preload-high")!;
    const pulmonaryAfterloadHigh = report.pointResults.find((point) =>
      point.pointId === "right-heart-pulmonary-afterload-high"
    )!;
    const contractilityLow = report.pointResults.find((point) => point.pointId === "right-heart-contractility-low")!;

    expect(normal.status).toBe("pass");
    expect(normal.classifications.rvPvOk).toBe(true);
    expect(normal.classifications.tvfOk).toBe(true);
    expect(preloadHigh.failureReasons).toEqual(["safety-pressure-dominant"]);
    expect(pulmonaryAfterloadHigh.failureReasons).toEqual(["safety-pressure-dominant"]);
    expect(contractilityLow.failureReasons).toEqual(["safety-pressure-dominant"]);
  });

  it("keeps the committed right-heart smoke artifact aligned with the rerun summary", () => {
    const report = runRightHeartStrategicSmokeBenchV1();
    expect(rightHeartReport.reportId).toBe(report.reportId);
    expect(rightHeartReport.summary).toEqual(report.summary);
    expect(rightHeartReport.decision).toEqual(report.decision);
    expect(typeof rightHeartReport.normalizedSha256).toBe("string");
    expect(rightHeartReport.normalizedSha256).toHaveLength(64);
  });
});
