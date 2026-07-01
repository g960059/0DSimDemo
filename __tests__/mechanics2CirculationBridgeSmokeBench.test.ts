import { describe, expect, it } from "vitest";
import {
  runCirculationBridgeSmokeBenchV1,
} from "@/engine/mechanics2/benches/CirculationBridgeSmokeBench";
import circulationBridgeReport from "@/data/mechanics2/reports/circulation-bridge-smoke-report-v1.json";

describe("MechanicsCore2 circulation-bridge smoke bench", () => {
  it("rejects source-pressure feedback as a morphology-preserving circulation bridge", () => {
    const report = runCirculationBridgeSmokeBenchV1();
    const reference = report.variantResults.find((variant) => variant.variantId === "open-boundary-reference")!;
    const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId)!;

    expect(report.decision.circulationBridgeStatus).toBe("no-go");
    expect(report.decision.bestVariantId).toBe("shared-source-pressure-feedback-gain020");
    expect(reference.summary).toMatchObject({
      total: 7,
      pass: 5,
      morphologyPreservedCount: 7,
      flowBalancedCount: 5,
    });
    expect(best.summary.meanBridgeAbsMismatchMl).toBeLessThan(reference.summary.meanBridgeAbsMismatchMl!);
    expect(best.summary.morphologyPreservedCount).toBeLessThan(reference.summary.morphologyPreservedCount);
    expect(best.summary.pass).toBeLessThan(reference.summary.pass);

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueCirculationCoupling).toBe(false);
    expect(report.claimBoundary.hiddenBloodVolumeTransfer).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed circulation-bridge artifact aligned with the rerun summary", () => {
    const report = runCirculationBridgeSmokeBenchV1();
    expect(circulationBridgeReport.reportId).toBe(report.reportId);
    expect(circulationBridgeReport.decision).toEqual(report.decision);
    expect(circulationBridgeReport.variantResults.map((variant) => variant.summary)).toEqual(
      report.variantResults.map((variant) => variant.summary),
    );
    expect(typeof circulationBridgeReport.normalizedSha256).toBe("string");
    expect(circulationBridgeReport.normalizedSha256).toHaveLength(64);
  });
});
