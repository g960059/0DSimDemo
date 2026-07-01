import { describe, expect, it } from "vitest";
import {
  runLeftHeartDynamicReserveContractBenchV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import dynamicReserveReport from "@/data/mechanics2/reports/left-heart-dynamic-reserve-contract-report-v1.json";

describe("MechanicsCore2 left-heart dynamic reserve contract bench", () => {
  it("keeps the dynamic reserve signal bounded inside left-heart Gate B", () => {
    const report = runLeftHeartDynamicReserveContractBenchV1();
    const reference = report.variantResults.find((variant) =>
      variant.variantId === "static-output-reserve-broad5-reference"
    )!;
    const best = report.variantResults.find((variant) =>
      variant.variantId === report.decision.bestStrictVariantId
    )!;
    const highPoint = best.pointResults.find((point) => point.pointId === "left-heart-contractility-high")!;
    const lowPoint = best.pointResults.find((point) => point.pointId === "left-heart-contractility-low")!;

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.rightHeartUnlock).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
    expect(report.decision.leftHeartGateBStatus).toBe("improved-but-blocked");
    expect(best.variantId).toBe("active-length-mv-closure-stateful-root08");
    expect(best.summary.pass).toBeGreaterThan(reference.summary.pass);
    expect(best.summary.lvPvOkCount).toBe(7);
    expect(best.summary.mvfOkCount).toBe(7);
    expect(best.summary.morphologyOkCount).toBe(7);
    expect(best.summary.clampFreeCount).toBe(7);
    expect(best.summary.cleanLowOutputReserveCount).toBeGreaterThanOrEqual(1);
    expect(best.summary.highDriveArtifactCount).toBe(0);

    expect(lowPoint.classifications.cleanLowOutputReserve).toBe(true);
    expect(highPoint.status).toBe("pass");
    expect(highPoint.failureReasons).toEqual([]);
    expect(highPoint.finalBeat?.lvClampCount).toBe(0);
    expect(highPoint.finalBeat?.laClampCount).toBe(0);
    expect(highPoint.finalBeat?.maxRootOutflowStatefulDrive01).toBeGreaterThan(0);
  });

  it("keeps the committed dynamic reserve artifact aligned with the rerun summary", () => {
    const report = runLeftHeartDynamicReserveContractBenchV1();
    expect(dynamicReserveReport.reportId).toBe(report.reportId);
    expect(dynamicReserveReport.decision).toEqual(report.decision);
    expect(dynamicReserveReport.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    }))).toEqual(report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    })));
    expect(typeof dynamicReserveReport.normalizedSha256).toBe("string");
    expect(dynamicReserveReport.normalizedSha256).toHaveLength(64);
  });
});
