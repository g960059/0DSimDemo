import { describe, expect, it } from "vitest";
import {
  runReservoirBridgeSmokeBenchV1,
} from "@/engine/mechanics2/benches/ReservoirBridgeSmokeBench";
import { expectMechanics2ReportArtifactParity } from "./helpers/mechanics2ReportParity";
import reservoirBridgeReport from "@/data/mechanics2/reports/reservoir-bridge-smoke-report-v1.json";

describe("MechanicsCore2 reservoir-bridge smoke bench", () => {
  it("records a mass-ledger bridge mixed signal without unlocking four-chamber work", () => {
    const report = runReservoirBridgeSmokeBenchV1();
    const reference = report.variantResults.find((variant) => variant.variantId === "open-reservoir-reference")!;
    const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId)!;

    expect(report.decision.reservoirBridgeStatus).toBe("promising-mixed-signal");
    expect(report.decision.bestVariantId).toBe("ledger-high-compliance-gain025");
    expect(reference.summary).toMatchObject({
      total: 7,
      pass: 5,
      morphologyPreservedCount: 7,
      flowBalancedCount: 5,
      reservoirLedgerCleanCount: 7,
    });
    expect(best.summary).toMatchObject({
      total: 7,
      pass: 6,
      flowBalancedCount: 6,
      reservoirLedgerCleanCount: 7,
      pressureAdjustmentBoundedCount: 7,
    });
    expect(best.summary.meanBridgeAbsMismatchMl).toBeLessThan(reference.summary.meanBridgeAbsMismatchMl!);

    const remaining = best.pointResults.filter((point) => point.status !== "pass");
    expect(remaining.map((point) => point.profileId)).toEqual(["contractility-low"]);
    expect(remaining[0]!.failureReasons).toContain("left-surface-not-preserved");
    expect(remaining[0]!.failureReasons).toContain("left-right-forward-ejection-mismatch");

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberCoupling).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed reservoir-bridge artifact aligned with the rerun summary", () => {
    const report = runReservoirBridgeSmokeBenchV1();
    expectMechanics2ReportArtifactParity(reservoirBridgeReport, report);
  });
});
