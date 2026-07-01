import { describe, expect, it } from "vitest";
import { runLeftHeartResidualAttributionBenchV1 } from "@/engine/mechanics2/benches/LeftHeartResidualAttributionBench";
import leftHeartResidualReport from "@/data/mechanics2/reports/left-heart-residual-attribution-report-v1.json";

describe("MechanicsCore2 left-heart residual attribution", () => {
  it("classifies the V2 soft-pressure residuals without unlocking later lanes", () => {
    const report = runLeftHeartResidualAttributionBenchV1();
    expect(report.sourceComparison).toMatchObject({
      targetSurface: "v2-fixed2-soft",
      summary: {
        pass: 3,
        total: 7,
        lvPvOkCount: 7,
        mvfOkCount: 6,
        outputOkCount: 3,
      },
    });

    const afterload = report.pointAttributions.find((point) => point.pointId === "left-heart-afterload-high")!;
    const low = report.pointAttributions.find((point) => point.pointId === "left-heart-contractility-low")!;
    const high = report.pointAttributions.find((point) => point.pointId === "left-heart-contractility-high")!;

    expect(afterload.classification).toBe("afterload-output-reserve");
    expect(afterload.status).toBe("output-reserve-residual");
    expect(afterload.attributionFlags.lowAovEjection).toBe(true);
    expect(afterload.attributionFlags.mvfKink).toBe(false);

    expect(low.classification).toBe("contractility-low-output-reserve");
    expect(low.status).toBe("output-reserve-residual");
    expect(low.attributionFlags.lowStrokeVolume).toBe(true);
    expect(low.attributionFlags.lowAovEjection).toBe(true);
    expect(low.attributionFlags.mvfKink).toBe(false);
    expect(low.attributionFlags.mvfNotBiphasic).toBe(false);
    expect(low.attributionFlags.massResidual).toBe(false);
    expect(low.attributionFlags.clampHit).toBe(false);
    expect(low.attributionFlags.softSafetyActive).toBe(true);

    expect(high.classification).toBe("contractility-high-flow-decoupled-mvf-kink");
    expect(high.status).toBe("artifact-residual");
    expect(high.attributionFlags.lowStrokeVolume).toBe(false);
    expect(high.attributionFlags.lowAovEjection).toBe(true);
    expect(high.attributionFlags.mvfKink).toBe(true);

    expect(report.decision.lowContractilityArtifactSeparated).toBe(true);
    expect(report.decision.highContractilityFlowDecoupledMvfKinkRemains).toBe(true);
    expect(report.decision.afterloadOutputReserveRemains).toBe(true);
    expect(report.claimBoundary.rightHeartUnlock).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed attribution artifact aligned with the rerun summary", () => {
    const report = runLeftHeartResidualAttributionBenchV1();
    expect(leftHeartResidualReport.reportId).toBe(report.reportId);
    expect(leftHeartResidualReport.sourceComparison).toEqual(report.sourceComparison);
    expect(leftHeartResidualReport.pointAttributions.map((point) => ({
      pointId: point.pointId,
      status: point.status,
      classification: point.classification,
      attributionFlags: point.attributionFlags,
    }))).toEqual(report.pointAttributions.map((point) => ({
      pointId: point.pointId,
      status: point.status,
      classification: point.classification,
      attributionFlags: point.attributionFlags,
    })));
    expect(leftHeartResidualReport.decision).toEqual(report.decision);
    expect(typeof leftHeartResidualReport.normalizedSha256).toBe("string");
    expect(leftHeartResidualReport.normalizedSha256).toHaveLength(64);
  });
});
