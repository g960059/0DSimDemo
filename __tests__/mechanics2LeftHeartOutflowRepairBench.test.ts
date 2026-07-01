import { describe, expect, it } from "vitest";
import {
  runLeftHeartOutflowRepairBenchV1,
} from "@/engine/mechanics2/benches/LeftHeartOutflowRepairBench";
import outflowRepairReport from "@/data/mechanics2/reports/left-heart-outflow-repair-report-v1.json";

describe("MechanicsCore2 left-heart outflow repair bench", () => {
  it("keeps semilunar/root repair evidence bounded by repeatability and dt guards", () => {
    const report = runLeftHeartOutflowRepairBenchV1();
    const baseline = report.variantResults.find((variant) => variant.variantId === "v2-fixed2-soft-baseline")!;
    const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId)!;

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.rightHeartUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
    expect(report.decision.leftHeartGateBStatus).toBe("mixed-repair-signal");
    expect(best.summary.pass).toBeGreaterThanOrEqual(baseline.summary.pass);
    expect(best.summary.maxAovEjectionDeltaMl ?? Infinity)
      .toBeLessThan(baseline.summary.maxAovEjectionDeltaMl ?? 0);
    expect(best.summary.repeatabilityOkCount).toBe(7);

    const high = best.pointResults.find((point) => point.pointId === "left-heart-contractility-high")!;
    expect(high.status).toBe("fail");
    expect(high.failureReasons).toContain("mvf-shape");
    expect(high.failureReasons).toContain("volume-clamp-hit");
    expect(high.failureReasons).toContain("dt-half-unstable");
  });

  it("keeps the committed outflow repair artifact aligned with the rerun summary", () => {
    const report = runLeftHeartOutflowRepairBenchV1();
    expect(outflowRepairReport.reportId).toBe(report.reportId);
    expect(outflowRepairReport.decision).toEqual(report.decision);
    expect(outflowRepairReport.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    }))).toEqual(report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    })));
    expect(typeof outflowRepairReport.normalizedSha256).toBe("string");
    expect(outflowRepairReport.normalizedSha256).toHaveLength(64);
  });
});
