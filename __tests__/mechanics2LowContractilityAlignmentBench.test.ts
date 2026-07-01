import { describe, expect, it } from "vitest";
import {
  runLowContractilityAlignmentBenchV1,
} from "@/engine/mechanics2/benches/LowContractilityAlignmentBench";
import { expectMechanics2ReportArtifactParity } from "./helpers/mechanics2ReportParity";
import alignmentReport from "@/data/mechanics2/reports/low-contractility-alignment-report-v1.json";

describe("MechanicsCore2 low-contractility alignment bench", () => {
  it("classifies the Gate C low-contractility mismatch without unlocking four-chamber work", () => {
    const report = runLowContractilityAlignmentBenchV1();

    expect(report.leftLowContractility).toMatchObject({
      status: "pass",
      aovEjectedVolumeMl: 11.686207,
      morphologyOk: true,
      cleanLowOutputReserve: true,
      acceptedPhenotypeReasons: ["clean-low-contractility-low-output-phenotype"],
    });
    expect(report.rightBaselineLowContractility).toMatchObject({
      status: "pass",
      rvTrefPa: 42_000,
      pvEjectedVolumeMl: 31.442531,
      morphologyOk: true,
      cleanLowOutputReserve: false,
    });
    expect(report.summary).toMatchObject({
      candidateCount: 8,
      cleanAlignedCount: 0,
      flowBalancedCount: 3,
      rightMorphologyOkCount: 1,
      rightPhenotypeAcceptedCount: 0,
      safetyCandidateCount: 16,
      safetyCleanAlignedCount: 0,
      bestCandidateId: "right-low-tref-14000",
      bestAbsMismatchMl: 1.528207,
      bestRvTrefPa: 14_000,
      bestSafetyCandidateId: "right-low-tref-22000-safety-0.25",
      bestSafetyAbsMismatchMl: 0.291365,
      bestSafetyRvTrefPa: 22_000,
      bestSafetyGainMultiplier: 0.25,
      baselineAbsMismatchMl: 19.756324,
    });

    const bestSafety = report.rightSafetyOwnershipScan.find((candidate) =>
      candidate.candidateId === "right-low-tref-22000-safety-0.25"
    )!;
    expect(bestSafety.flowBalanced).toBe(true);
    expect(bestSafety.cleanAlignedLowOutput).toBe(false);
    expect(bestSafety.rightFailureReasons).toContain("volume-clamp-hit");

    expect(report.decision.alignmentStatus).toBe("no-clean-alignment");
    expect(report.decision.blockedClaims).toContain("four-chamber-unlock");
    expect(report.decision.blockedClaims).toContain("LandAtrial-unlock");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    expectMechanics2ReportArtifactParity(alignmentReport, report);
  });
});
