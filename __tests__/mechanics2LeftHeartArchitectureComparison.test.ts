import { describe, expect, it } from "vitest";
import {
  runLeftHeartArchitectureComparisonBenchV1,
} from "@/engine/mechanics2/benches/LeftHeartArchitectureComparisonBench";
import leftHeartArchitectureReport from "@/data/mechanics2/reports/left-heart-architecture-comparison-report-v1.json";

describe("MechanicsCore2 left-heart architecture comparison", () => {
  it("records V2 transaction surfaces without claiming runtime adoption", () => {
    const report = runLeftHeartArchitectureComparisonBenchV1();
    expect(report.baselineV1Summary).toMatchObject({
      total: 7,
      pass: 4,
      lvPvOkCount: 7,
      mvfOkCount: 5,
    });
    expect(report.variantResults.map((variant) => variant.variantId)).toEqual([
      "v2-explicit-hard",
      "v2-fixed2-hard",
      "v2-fixed2-soft",
    ]);

    const explicit = report.variantResults.find((variant) => variant.variantId === "v2-explicit-hard")!;
    const soft = report.variantResults.find((variant) => variant.variantId === "v2-fixed2-soft")!;
    expect(explicit.summary.pass).toBe(3);
    expect(explicit.summary.lvPvOkCount).toBe(7);
    expect(explicit.summary.outputOkCount).toBe(3);
    expect(soft.summary.mvfOkCount).toBeGreaterThanOrEqual(explicit.summary.mvfOkCount);
    expect(soft.summary.maxSafetyPressureMmHg).toBeGreaterThan(0);

    expect(report.decision.requiresOwnerVisualReview).toBe(true);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.CircAdaptEquivalence).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed V2 architecture artifact aligned with the rerun summary", () => {
    const report = runLeftHeartArchitectureComparisonBenchV1();
    expect(leftHeartArchitectureReport.reportId).toBe(report.reportId);
    expect(leftHeartArchitectureReport.baselineV1Summary).toEqual(report.baselineV1Summary);
    expect(leftHeartArchitectureReport.variantResults.map((variant) => variant.summary)).toEqual(
      report.variantResults.map((variant) => variant.summary),
    );
    expect(leftHeartArchitectureReport.decision).toEqual(report.decision);
    expect(typeof leftHeartArchitectureReport.normalizedSha256).toBe("string");
    expect(leftHeartArchitectureReport.normalizedSha256).toHaveLength(64);
  });
});
