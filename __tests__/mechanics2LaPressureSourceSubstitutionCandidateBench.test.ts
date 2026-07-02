import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaPressureSourceSubstitutionCandidateBenchV1,
  type LaPressureSourceSubstitutionCandidateReportV1,
} from "@/engine/mechanics2/benches/LaPressureSourceSubstitutionCandidateBench";
import candidateReport
  from "@/data/mechanics2/reports/la-pressure-source-substitution-candidate-report-v1.json";

describe("LaPressureSourceSubstitutionCandidateBench V1", () => {
  let report: LaPressureSourceSubstitutionCandidateReportV1;

  beforeAll(() => {
    report = runLaPressureSourceSubstitutionCandidateBenchV1();
  }, 600_000);

  it("keeps the selected active-pulse source substitution blocked in closed loop", () => {
    expect(report.upstreamActivePulseRefinement.observedStatus)
      .toBe("la-active-pulse-mv-replay-refinement-signal");
    expect(report.upstreamActivePulseRefinement.selectedMode).toBe("fiber-active-a-window-gated");
    expect(report.decision.laPressureSourceSubstitutionCandidateStatus)
      .toBe("la-pressure-source-substitution-candidate-blocked");
    expect(report.summary).toMatchObject({
      total: 7,
      pass: 2,
      fail: 5,
      mvfCleanCount: 2,
      outputParityCount: 7,
      clampRegressionFreeCount: 7,
    });
  });

  it("classifies the source-substitution blocker as MVF E/A collapse, not output loss", () => {
    const failedRows = report.rows.filter((row) => row.status === "fail");
    expect(failedRows).toHaveLength(5);
    for (const row of failedRows) {
      expect(row.failureReasons).toContain("candidate-mvf-not-biphasic");
      expect(row.candidateMvForwardPeakCount).toBe(1);
      expect(row.candidateToBaselineMvForwardVolumeRatio).toBeGreaterThan(0.96);
      expect(row.candidateToBaselineMvForwardVolumeRatio).toBeLessThan(1.01);
      expect(row.candidateToBaselineAovForwardVolumeRatio).toBeGreaterThan(0.96);
      expect(row.candidateToBaselineAovForwardVolumeRatio).toBeLessThan(1.01);
      expect(row.candidateClampCount).toBeLessThanOrEqual(row.baselineClampCount);
      expect(row.candidateMaxMassResidualAbsMl).toBe(0);
    }
  });

  it("keeps runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toContain("runtime-wiring");
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed source-substitution candidate artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(candidateReport, report);
  });
});
