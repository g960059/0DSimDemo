import { describe, expect, it } from "vitest";
import {
  runReservoirStateContractBenchV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";
import { expectMechanics2ReportArtifactParity } from "./helpers/mechanics2ReportParity";
import reservoirStateReport from "@/data/mechanics2/reports/reservoir-state-contract-report-v1.json";

describe("MechanicsCore2 reservoir-state contract bench", () => {
  it("keeps the reservoir state explicit and blocks four-chamber promotion on the residuals", () => {
    const report = runReservoirStateContractBenchV1();
    const reference = report.variantResults.find((variant) => variant.variantId === "open-reservoir-reference")!;
    const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId)!;
    const longer = report.variantResults.find((variant) =>
      variant.variantId === "stateful-high-compliance-cap6-gain018-epochs18"
    )!;

    expect(report.decision.reservoirStateStatus).toBe("no-go");
    expect(report.decision.bestVariantId).toBe("stateful-high-compliance-cap6-gain018");
    expect(reference.summary).toMatchObject({
      total: 7,
      pass: 5,
      morphologyPreservedCount: 7,
      flowBalancedCount: 5,
      reservoirLedgerCleanCount: 7,
    });
    expect(best.summary).toMatchObject({
      total: 7,
      pass: 5,
      morphologyPreservedCount: 6,
      flowBalancedCount: 6,
      pressureAdjustmentBoundedCount: 7,
      reservoirLedgerCleanCount: 7,
      perEpochTransferBoundedCount: 7,
      persistentReservoirBoundedCount: 7,
      repeatableFinalStateCount: 6,
    });
    expect(best.summary.maxAbsAcceptedTransferMl).toBeLessThan(5);
    expect(best.summary.maxAbsReservoirVolumeMl).toBeLessThan(35);
    expect(best.summary.meanFinalAbsMismatchMl).toBeLessThan(reference.summary.meanReferenceAbsMismatchMl!);

    const remaining = best.pointResults.filter((point) => point.status !== "pass");
    expect(remaining.map((point) => point.profileId)).toEqual(["preload-low", "contractility-low"]);
    expect(remaining[0]!.failureReasons).toEqual(["reservoir-state-not-repeatable"]);
    expect(remaining[1]!.failureReasons).toEqual([
      "left-surface-not-preserved",
      "left-right-forward-ejection-mismatch",
    ]);
    expect(remaining[1]!.finalState.leftFailureReasons).toContain("safety-pressure-dominant");

    expect(longer.summary.maxAbsReservoirVolumeMl).toBeGreaterThan(60);
    expect(longer.pointResults.find((point) => point.profileId === "contractility-low")?.failureReasons)
      .toContain("persistent-large-reservoir-shuttle");

    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberCoupling).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    expectMechanics2ReportArtifactParity(reservoirStateReport, report);
  });
});
