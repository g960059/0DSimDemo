import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runRightPreloadOutflowOwnershipBenchV1,
  type RightPreloadOutflowOwnershipReportV1,
} from "@/engine/mechanics2/benches/RightPreloadOutflowOwnershipBench";
import rightPreloadOutflowReport from "@/data/mechanics2/reports/right-preload-outflow-ownership-report-v1.json";

describe("MechanicsCore2 right preload outflow ownership bench", () => {
  let report: RightPreloadOutflowOwnershipReportV1;

  beforeAll(() => {
    report = runRightPreloadOutflowOwnershipBenchV1();
  }, 120_000);

  it("finds a broad PV outflow ownership lead for the right preload-low source residual", () => {
    expect(report.decision.rightPreloadOutflowStatus).toBe("right-preload-outflow-contract-signal");
    expect(report.summary.bestCandidateId).toBe("pv-resistance150");
    expect(report.summary.bestPassCount).toBe(7);
    expect(report.summary.fullPassCandidateCount).toBeGreaterThanOrEqual(3);
    expect(report.summary.longEpochPassCandidateCount).toBeGreaterThanOrEqual(3);

    const reference = report.candidateResults.find((candidate) =>
      candidate.candidateId === "right-source-reference")!;
    expect(reference.summary.pass).toBe(6);
    expect(report.summary.rightPreloadReferenceFailureReasons).toEqual([
      "beat-repeatability-failed",
      "dt-half-output-parity-failed",
    ]);

    const best = report.candidateResults.find((candidate) => candidate.candidateId === "pv-resistance150")!;
    expect(best.summary.pass).toBe(7);
    expect(best.summary.rightPreloadPass).toBe(true);
    expect(best.summary.rightPreloadLongEpochPass).toBe(true);
    expect(best.summary.maxLongEpochRepeatabilityDeltaMl).toBeLessThan(0.2);
    expect(best.summary.maxLongEpochDtHalfOutputDeltaMl).toBeLessThan(0.2);
    expect(best.rightPreloadLongEpoch.at(-1)?.pvEjectedVolumeMl).toBeGreaterThan(40);
    expect(best.rightPreloadLongEpoch.at(-1)?.maxSafetyPressureMmHg).toBe(0);
  });

  it("keeps over-damping and PA runoff feedback as bounded negative controls", () => {
    const overDamped = report.candidateResults.find((candidate) =>
      candidate.candidateId === "pv-resistance200-negative-control")!;
    expect(overDamped.summary.pass).toBeLessThan(7);
    expect(overDamped.pointResults.some((point) =>
      point.pointId === "right-heart-pulmonary-afterload-high"
      && point.failureReasons.includes("output-pv-ejected-volume-too-low"))).toBe(true);

    const paDrive = report.candidateResults.find((candidate) =>
      candidate.candidateId === "pa-drive050-negative-control")!;
    expect(paDrive.summary.pass).toBeLessThan(7);
  });

  it("keeps the committed right preload outflow artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(rightPreloadOutflowReport, report);
  });
});
