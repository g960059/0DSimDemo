import { describe, expect, it } from "vitest";
import {
  runReservoirSolverAttributionBenchV1,
} from "@/engine/mechanics2/benches/ReservoirSolverAttributionBench";
import { expectMechanics2ReportArtifactParity } from "./helpers/mechanics2ReportParity";
import attributionReport from "@/data/mechanics2/reports/reservoir-solver-attribution-report-v1.json";

describe("MechanicsCore2 reservoir-solver attribution bench", () => {
  it("classifies the remaining low-contractility residual and large transfer signal", () => {
    const report = runReservoirSolverAttributionBenchV1();

    expect(report.bestVariantId).toBe("same-step-high-compliance-bound2");
    expect(report.acceptedTransferSummary).toMatchObject({
      total: 7,
      largeTransferCount: 5,
      maxAcceptedAbsTransferMl: 54.4,
    });
    expect(report.acceptedTransferSummary.maxTransferToForwardRatio).toBeGreaterThan(1);

    const low = report.contractilityLowAttribution;
    expect(low.acceptedFailureReasons).toEqual(["left-right-forward-ejection-mismatch"]);
    expect(low.classification).toBe("profile-severity-mismatch");
    expect(low.scans.map((scan) => scan.scanId)).toEqual(["accepted-bound", "wide-diagnostic"]);
    expect(low.scans.every((scan) => scan.bestFlowBalanced == null)).toBe(true);
    expect(low.scans[0]!.bestMorphologyPreserving?.absMismatchMl).toBeGreaterThan(17);

    expect(report.decision.attributionStatus).toBe("stateful-reservoir-required");
    expect(report.decision.blockedClaims).toContain("four-chamber-unlock");
    expect(report.decision.blockedClaims).toContain("LandAtrial-unlock");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    expectMechanics2ReportArtifactParity(attributionReport, report);
  });
});
