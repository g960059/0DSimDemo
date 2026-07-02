import { beforeAll, describe, expect, it } from "vitest";
import {
  runSourceSurfaceDtHalfStabilityScanBenchV1,
  type SourceSurfaceDtHalfStabilityScanReportV1,
} from "@/engine/mechanics2/benches/SourceSurfaceDtHalfStabilityScanBench";
import sourceDtHalfScanReport from "@/data/mechanics2/reports/source-surface-dthalf-stability-scan-report-v1.json";

describe("MechanicsCore2 source-surface dt-half stability scan bench", () => {
  let report: SourceSurfaceDtHalfStabilityScanReportV1;

  beforeAll(() => {
    report = runSourceSurfaceDtHalfStabilityScanBenchV1();
  }, 90_000);

  it("records a partial source-surface signal without reopening reservoir tuning", () => {
    expect(report.decision.scanStatus).toBe("source-dthalf-scan-partial");
    expect(report.summary).toMatchObject({
      scannedCandidateCount: 20,
      leftCandidateCount: 10,
      rightCandidateCount: 10,
      leftBestCandidateId: "left-mv-closure075",
      rightBestCandidateId: "right-lowt30000-safety018",
      leftBestPassCount: 5,
      rightBestPassCount: 6,
      leftFullPassCandidateCount: 0,
      rightFullPassCandidateCount: 0,
    });
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.trueFourChamberDynamics).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneUnlock).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);

    const leftBest = report.candidateResults.find((candidate) => candidate.candidateId === "left-mv-closure075")!;
    expect(leftBest.pointResults.filter((point) => point.status !== "pass").map((point) => `${point.pointId}:${point.failureReasons.join("+")}`)).toEqual([
      "left-heart-preload-low:dt-half-shape-parity-failed",
      "left-heart-afterload-high:output-aov-ejected-volume-too-low",
    ]);

    const rightBest = report.candidateResults.find((candidate) => candidate.candidateId === "right-lowt30000-safety018")!;
    expect(rightBest.pointResults.filter((point) => point.status !== "pass").map((point) => `${point.pointId}:${point.failureReasons.join("+")}`)).toEqual([
      "right-heart-preload-low:beat-repeatability-failed+dt-half-output-parity-failed",
    ]);
    expect(rightBest.summary.phenotypeAcceptedCount).toBe(1);
  });

  it("keeps the committed source-surface scan artifact aligned with the rerun summary", () => {
    expect(sourceDtHalfScanReport.reportId).toBe(report.reportId);
    expect(sourceDtHalfScanReport.summary).toEqual(report.summary);
    expect(sourceDtHalfScanReport.decision).toEqual(report.decision);
    expect(typeof sourceDtHalfScanReport.normalizedSha256).toBe("string");
    expect(sourceDtHalfScanReport.normalizedSha256).toHaveLength(64);
  });
});
