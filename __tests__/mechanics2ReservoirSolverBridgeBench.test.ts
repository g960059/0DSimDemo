import { describe, expect, it } from "vitest";
import {
  runReservoirSolverBridgeBenchV1,
} from "@/engine/mechanics2/benches/ReservoirSolverBridgeBench";
import { expectMechanics2ReportArtifactParity } from "./helpers/mechanics2ReportParity";
import reservoirSolverReport from "@/data/mechanics2/reports/reservoir-solver-bridge-report-v1.json";

describe("MechanicsCore2 reservoir-solver bridge bench", () => {
  it("records a same-profile reservoir solve signal without unlocking four-chamber work", () => {
    const report = runReservoirSolverBridgeBenchV1();
    const reference = report.variantResults.find((variant) => variant.variantId === "open-reservoir-reference")!;
    const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId)!;

    expect(report.decision.reservoirSolverStatus).toBe("promising-mixed-signal");
    expect(report.decision.bestVariantId).toBe("same-step-high-compliance-bound2");
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
      morphologyPreservedCount: 7,
      flowBalancedCount: 6,
      pressureAdjustmentBoundedCount: 7,
      reservoirLedgerCleanCount: 7,
    });
    expect(best.summary.meanAcceptedAbsMismatchMl).toBeLessThan(4.1);
    expect(best.summary.meanAcceptedAbsMismatchMl).toBeLessThan(reference.summary.meanAcceptedAbsMismatchMl!);
    expect(best.summary.maxAcceptedAbsTransferMl).toBeGreaterThan(50);

    const remaining = best.pointResults.filter((point) => point.status !== "pass");
    expect(remaining.map((point) => point.profileId)).toEqual(["contractility-low"]);
    expect(remaining[0]!.failureReasons).toEqual(["left-right-forward-ejection-mismatch"]);

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberCoupling).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    expectMechanics2ReportArtifactParity(reservoirSolverReport, report);
  });
});
