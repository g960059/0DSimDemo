import { describe, expect, it } from "vitest";
import {
  runLeftHeartOutputReserveCalibrationBenchV1,
} from "@/engine/mechanics2/benches/LeftHeartOutputReserveCalibrationBench";
import outputReserveReport from "@/data/mechanics2/reports/left-heart-output-reserve-calibration-report-v1.json";

describe("MechanicsCore2 left-heart output-reserve calibration bench", () => {
  it("records a 5/7 static output-reserve signal without unlocking right-heart or LandAtrial work", () => {
    const report = runLeftHeartOutputReserveCalibrationBenchV1();
    const baseline = report.variantResults.find((variant) => variant.variantId === "v2-fixed2-soft-baseline")!;
    const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestStrictVariantId)!;
    const high = best.pointResults.find((point) => point.pointId === "left-heart-contractility-high")!;
    const low = best.pointResults.find((point) => point.pointId === "left-heart-contractility-low")!;

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.rightHeartUnlock).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
    expect(report.decision.leftHeartGateBStatus).toBe("improved-but-blocked");
    expect(best.variantId).toBe("static-output-reserve-broad5");
    expect(best.summary.pass).toBe(5);
    expect(best.summary.pass).toBeGreaterThan(baseline.summary.pass);
    expect(best.summary.outputOkCount).toBeGreaterThanOrEqual(6);
    expect(best.summary.dtStableCount).toBe(7);

    expect(low.failureReasons).toContain("output-stroke-volume-too-low");
    expect(high.failureReasons).toContain("mvf-shape");
    expect(high.failureReasons).toContain("volume-clamp-hit");
  });

  it("keeps active-length blending bounded as a component signal rather than a broad gate pass", () => {
    const report = runLeftHeartOutputReserveCalibrationBenchV1();
    const blendVariants = report.variantResults.filter((variant) =>
      variant.intervention.activeLengthExternalBlend01 > 0
    );
    const bestStrict = report.variantResults.find((variant) => variant.variantId === report.decision.bestStrictVariantId)!;

    expect(report.decision.activeLengthBlendSignal).toBe("limited-component-signal");
    expect(blendVariants.length).toBeGreaterThan(0);
    expect(Math.max(...blendVariants.map((variant) => variant.summary.pass))).toBeLessThan(bestStrict.summary.pass);
  });

  it("keeps the committed output-reserve artifact aligned with the rerun summary", () => {
    const report = runLeftHeartOutputReserveCalibrationBenchV1();
    expect(outputReserveReport.reportId).toBe(report.reportId);
    expect(outputReserveReport.decision).toEqual(report.decision);
    expect(outputReserveReport.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    }))).toEqual(report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    })));
    expect(typeof outputReserveReport.normalizedSha256).toBe("string");
    expect(outputReserveReport.normalizedSha256).toHaveLength(64);
  });
});
