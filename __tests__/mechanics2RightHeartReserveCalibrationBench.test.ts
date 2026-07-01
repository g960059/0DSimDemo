import { describe, expect, it } from "vitest";
import {
  runRightHeartReserveCalibrationBenchV1,
} from "@/engine/mechanics2/benches/RightHeartReserveCalibrationBench";
import rightHeartReserveReport from "@/data/mechanics2/reports/right-heart-reserve-calibration-report-v1.json";

describe("MechanicsCore2 right-heart reserve calibration bench", () => {
  it("classifies the first right-heart residual as RV pressure-mapping reserve", () => {
    const report = runRightHeartReserveCalibrationBenchV1();
    const baseline = report.variantResults.find((variant) => variant.variantId === "baseline-rv-pressure-scale046")!;
    const selected = report.variantResults.find((variant) => variant.variantId === report.decision.selectedVariantId)!;

    expect(report.decision.rightHeartReserveStatus).toBe("right-heart-reserve-pass");
    expect(report.decision.selectedVariantId).toBe("rv-pressure-scale052-lower-suction008");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.pairedHeartUnlock).toBe(true);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    expect(baseline.summary).toMatchObject({
      total: 7,
      pass: 4,
      safetyWorkBoundedCount: 4,
      rvPvOkCount: 7,
      tvfOkCount: 7,
      outputOkCount: 7,
    });
    expect(selected.summary).toMatchObject({
      total: 7,
      pass: 7,
      safetyWorkBoundedCount: 7,
      rvPvOkCount: 7,
      tvfOkCount: 7,
      outputOkCount: 7,
      highDriveArtifactCount: 0,
    });
    expect(selected.maxSafetyPressureMmHg).toBeLessThanOrEqual(3);
  });

  it("keeps the committed right-heart reserve artifact aligned with the rerun summary", () => {
    const report = runRightHeartReserveCalibrationBenchV1();
    expect(rightHeartReserveReport.reportId).toBe(report.reportId);
    expect(rightHeartReserveReport.decision).toEqual(report.decision);
    expect(rightHeartReserveReport.variantResults.map((variant) => variant.summary)).toEqual(
      report.variantResults.map((variant) => variant.summary),
    );
    expect(typeof rightHeartReserveReport.normalizedSha256).toBe("string");
    expect(rightHeartReserveReport.normalizedSha256).toHaveLength(64);
  });
});
