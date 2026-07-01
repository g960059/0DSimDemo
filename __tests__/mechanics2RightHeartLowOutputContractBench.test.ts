import { describe, expect, it } from "vitest";
import {
  runRightHeartLowOutputContractBenchV1,
} from "@/engine/mechanics2/benches/RightHeartLowOutputContractBench";
import { expectMechanics2ReportArtifactParity } from "./helpers/mechanics2ReportParity";
import rightLowOutputReport from "@/data/mechanics2/reports/right-heart-low-output-contract-report-v1.json";

describe("MechanicsCore2 right-heart low-output contract bench", () => {
  it("keeps right low-output blocked when safety and dilation scans do not produce a clean phenotype", () => {
    const report = runRightHeartLowOutputContractBenchV1();

    expect(report.leftLowContractility).toMatchObject({
      status: "pass",
      aovEjectedVolumeMl: 11.686207,
      acceptedPhenotypeReasons: ["clean-low-contractility-low-output-phenotype"],
    });
    expect(report.baselineRightLowContractility).toMatchObject({
      candidateId: "baseline-right-low-contractility",
      status: "pass",
      pvEjectedVolumeMl: 31.442531,
      cleanLowOutputReserve: false,
      absMismatchToLeftMl: 19.756324,
    });
    expect(report.summary).toMatchObject({
      totalCandidates: 60,
      cleanRightLowOutputCount: 0,
      alignedWithLeftCount: 53,
      cleanAlignedCount: 0,
      clampFreeCount: 36,
      safetyBoundedCount: 34,
      bestCandidateId: "right-low-rv-dilated420-tref-22000-safety-0.25",
      bestAbsMismatchToLeftMl: 0.038006,
      bestCleanAlignedCandidateId: null,
      baselineAbsMismatchToLeftMl: 19.756324,
    });

    const best = report.candidates.find((candidate) =>
      candidate.candidateId === "right-low-rv-dilated420-tref-22000-safety-0.25"
    )!;
    expect(best.alignedWithLeftLowOutput).toBe(true);
    expect(best.clampFree).toBe(true);
    expect(best.safetyWorkBounded).toBe(false);
    expect(best.cleanAlignedRightLowOutput).toBe(false);
    expect(best.rawFailureReasons).toContain("safety-pressure-dominant");

    expect(report.decision.rightLowOutputContractStatus).toBe("right-low-output-contract-blocked");
    expect(report.decision.blockedClaims).toContain("four-chamber-unlock");
    expect(report.decision.blockedClaims).toContain("LandAtrial-unlock");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    expectMechanics2ReportArtifactParity(rightLowOutputReport, report);
  });
});
