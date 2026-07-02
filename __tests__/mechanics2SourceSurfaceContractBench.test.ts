import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runSourceSurfaceContractBenchV1,
  type SourceSurfaceContractReportV1,
} from "@/engine/mechanics2/benches/SourceSurfaceContractBench";
import sourceSurfaceContractReport from "@/data/mechanics2/reports/source-surface-contract-report-v1.json";

describe("MechanicsCore2 source-surface contract bench", () => {
  let report: SourceSurfaceContractReportV1;

  beforeAll(() => {
    report = runSourceSurfaceContractBenchV1();
  }, 120_000);

  it("passes the left source contract with phase-aligned shape parity and load-conditioned reserve", () => {
    expect(report.decision.sourceContractStatus).toBe("left-contract-pass-right-source-blocked");
    expect(report.summary.leftBestCandidateId).toBe("left-afterload-active-reserve103");
    expect(report.summary.leftBestPassCount).toBe(7);
    expect(report.summary.leftFullPassCandidateCount).toBe(2);

    const reference = report.leftSurfaceResults.find((candidate) =>
      candidate.candidateId === "left-reference-phase-aligned")!;
    expect(reference.summary.pass).toBe(6);
    expect(reference.pointResults.find((point) => point.pointId === "left-heart-preload-low")?.sourceStatus)
      .toBe("pass");
    expect(reference.pointResults.find((point) => point.pointId === "left-heart-afterload-high")?.sourceFailureReasons)
      .toEqual(["output-aov-ejected-volume-too-low"]);

    const activeReserve = report.leftSurfaceResults.find((candidate) =>
      candidate.candidateId === "left-afterload-active-reserve103")!;
    expect(activeReserve.summary.pass).toBe(7);
    expect(activeReserve.intervention.highAfterloadDetection)
      .toBe("root-downstream>=80-or-root-resistance>=0.8");
    expect(activeReserve.intervention.highAfterloadLvTrefMultiplier).toBe(1.03);
    expect(activeReserve.pointResults.find((point) => point.pointId === "left-heart-afterload-high")?.outputOk)
      .toBe(true);
  });

  it("keeps the right preload-low residual as a source-settling blocker", () => {
    expect(report.summary.rightPassCount).toBe(6);
    expect(report.summary.rightFullPass).toBe(false);
    expect(report.summary.rightPreloadSettlingBlocker).toBe(true);

    const rightPreload = report.rightSurfaceResult.pointResults.find((point) =>
      point.pointId === "right-heart-preload-low")!;
    expect(rightPreload.sourceFailureReasons).toEqual([
      "beat-repeatability-failed",
      "dt-half-output-parity-failed",
    ]);
    expect(rightPreload.phaseAlignedShapeParityOk).toBe(true);
    expect(rightPreload.forwardEjectionRepeatabilityDeltaMl).toBeGreaterThan(16);
    expect(rightPreload.forwardEjectionDtHalfDeltaMl).toBeGreaterThan(10);

    expect(report.rightPreloadSettlingProbe.classification)
      .toBe("persistent-right-source-settling-repeatability-blocker");
    expect(report.rightPreloadSettlingProbe.beatResults.at(-1)?.repeatabilityDeltaMl)
      .toBeGreaterThan(70);
  });

  it("keeps the committed source contract artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(sourceSurfaceContractReport, report);
  });
});
