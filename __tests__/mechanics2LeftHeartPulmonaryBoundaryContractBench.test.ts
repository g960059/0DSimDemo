import { describe, expect, it } from "vitest";
import {
  runLeftHeartPulmonaryBoundaryContractBenchV1,
} from "@/engine/mechanics2/benches/LeftHeartPulmonaryBoundaryContractBench";
import pulmonaryBoundaryReport from "@/data/mechanics2/reports/left-heart-pulmonary-boundary-contract-report-v1.json";

describe("MechanicsCore2 left-heart pulmonary boundary contract bench", () => {
  it("keeps the pulmonary boundary signal bounded and separates broad best from high-drive rescue", () => {
    const report = runLeftHeartPulmonaryBoundaryContractBenchV1();
    const baseline = report.variantResults.find((variant) => variant.variantId === "v2-fixed2-soft-baseline")!;
    const broadBest = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId)!;
    const highBest = report.variantResults.find((variant) =>
      variant.variantId === report.decision.bestHighContractilityVariantId
    )!;
    const highPoint = highBest.pointResults.find((point) => point.pointId === "left-heart-contractility-high")!;

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.rightHeartUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
    expect(report.decision.leftHeartGateBStatus).toBe("mixed-boundary-signal");
    expect(broadBest.summary.pass).toBeGreaterThanOrEqual(baseline.summary.pass);
    expect(report.decision.highContractilityMvfSignal).toBe("improved");
    expect(highPoint.status).toBe("pass");
    expect(highPoint.failureReasons).toEqual([]);

    const pulmonaryNodeVariants = report.variantResults.filter((variant) =>
      variant.intervention.pulmonaryBoundary.mode === "compliance-node"
    );
    expect(pulmonaryNodeVariants.length).toBeGreaterThan(0);
    expect(Math.max(...pulmonaryNodeVariants.map((variant) => variant.summary.pass)))
      .toBeLessThan(broadBest.summary.pass);
  });

  it("keeps the committed pulmonary boundary artifact aligned with the rerun summary", () => {
    const report = runLeftHeartPulmonaryBoundaryContractBenchV1();
    expect(pulmonaryBoundaryReport.reportId).toBe(report.reportId);
    expect(pulmonaryBoundaryReport.decision).toEqual(report.decision);
    expect(pulmonaryBoundaryReport.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    }))).toEqual(report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    })));
    expect(typeof pulmonaryBoundaryReport.normalizedSha256).toBe("string");
    expect(pulmonaryBoundaryReport.normalizedSha256).toHaveLength(64);
  });
});
