import { describe, expect, it } from "vitest";
import {
  runRightHeartVolumeReserveContractBenchV1,
} from "@/engine/mechanics2/benches/RightHeartVolumeReserveContractBench";
import { expectMechanics2ReportArtifactParity } from "./helpers/mechanics2ReportParity";
import volumeReserveReport from "@/data/mechanics2/reports/right-heart-volume-reserve-contract-report-v1.json";

describe("MechanicsCore2 right-heart volume-reserve contract bench", () => {
  it("finds a clean right low-output candidate but keeps reservoir Gate C blocked", () => {
    const report = runRightHeartVolumeReserveContractBenchV1();

    expect(report.summary).toMatchObject({
      totalCandidates: 108,
      cleanRightLowOutputCount: 2,
      alignedWithLeftCount: 85,
      cleanAlignedVolumeReserveCount: 1,
      hiddenReserveBoundedCount: 61,
      bestCandidateId: "right-volume-reserve-rv-dilated420-tref-22000-safety-1-pressure-0.25",
      bestAbsMismatchToLeftMl: 0.038006,
      bestCleanAlignedCandidateId: "right-volume-reserve-rv-dilated520-tref-26000-safety-0.25-pressure-0.5",
      bestCleanAlignedReserveEquivalentMmHg: 5.994654,
      baselineAbsMismatchToLeftMl: 19.756324,
    });

    const clean = report.candidates.find((candidate) =>
      candidate.candidateId === report.summary.bestCleanAlignedCandidateId
    )!;
    expect(clean).toMatchObject({
      status: "pass",
      pvEjectedVolumeMl: 10.199368,
      absMismatchToLeftMl: 1.486839,
      maxSafetyPressureMmHg: 2.992812,
      maxRvUpperReserveEquivalentMmHg: 5.994654,
      morphologyOk: true,
      clampFree: true,
      safetyWorkBounded: true,
      cleanLowOutputReserve: true,
      hiddenReserveBounded: true,
      cleanAlignedVolumeReserve: true,
      acceptedPhenotypeReasons: ["clean-low-contractility-low-output-phenotype"],
    });

    expect(report.reentry.rightSurfaceSummary).toMatchObject({
      total: 7,
      pass: 7,
      morphologyOkCount: 7,
      phenotypeAcceptedCount: 1,
    });
    expect(report.reentry.pairedPassCount).toBe(7);
    expect(report.reentry.reservoirStateStatus).toBe("no-go");
    expect(report.reentry.reservoirBestPassCount).toBe(5);
    expect(report.reentry.reservoirRemainingBlockers).toEqual([
      "preload-low: reservoir-state-not-repeatable",
      "contractility-low: right-surface-not-preserved",
    ]);

    expect(report.decision.rightVolumeReserveContractStatus).toBe("right-volume-reserve-contract-signal");
    expect(report.decision.blockedClaims).toContain("four-chamber-unlock");
    expect(report.decision.blockedClaims).toContain("LandAtrial-unlock");
    expect(report.claimBoundary.fourChamberUnlock).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    expectMechanics2ReportArtifactParity(volumeReserveReport, report);
  });
});
