import { beforeAll, describe, expect, it } from "vitest";
import {
  runPreloadLowReservoirNumericsScanBenchV1,
  type PreloadLowReservoirNumericsScanReportV1,
} from "@/engine/mechanics2/benches/PreloadLowReservoirNumericsScanBench";
import preloadLowScanReport from "@/data/mechanics2/reports/preload-low-reservoir-numerics-scan-report-v1.json";

describe("MechanicsCore2 preload-low reservoir numerics scan bench", () => {
  let report: PreloadLowReservoirNumericsScanReportV1;

  beforeAll(() => {
    report = runPreloadLowReservoirNumericsScanBenchV1();
  }, 90_000);

  it("keeps reservoir gain/compliance scan blocked when dt-half source surfaces fail", () => {
    expect(report.decision.scanStatus).toBe("preload-low-reservoir-numerics-scan-blocked");
    expect(report.summary).toMatchObject({
      scannedCandidateCount: 18,
      preloadLowPassCandidateCount: 0,
      validatedCandidateCount: 3,
      fullEnvelopePassCandidateCount: 0,
      bestCandidateId: "gain06-compliance50",
      bestFullEnvelopePassCount: 18,
    });
    expect(report.summary.bestMaxAbsReservoirVolumeMl).toBeLessThan(13);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    const best = report.validatedCandidates.find((candidate) =>
      candidate.candidate.candidateId === "gain06-compliance50"
    )!;
    expect(best.failureReasons).toEqual([
      "dt-half/preload-low: left-surface-not-preserved,right-surface-not-preserved",
      "dt-half/afterload-high: left-surface-not-preserved",
      "dt-half/contractility-low: right-surface-not-preserved,unexpected-accepted-phenotype",
    ]);
  });

  it("keeps the committed preload-low scan artifact aligned with the rerun summary", () => {
    expect(preloadLowScanReport.reportId).toBe(report.reportId);
    expect(preloadLowScanReport.summary).toEqual(report.summary);
    expect(preloadLowScanReport.decision).toEqual(report.decision);
    expect(typeof preloadLowScanReport.normalizedSha256).toBe("string");
    expect(preloadLowScanReport.normalizedSha256).toHaveLength(64);
  });
});
