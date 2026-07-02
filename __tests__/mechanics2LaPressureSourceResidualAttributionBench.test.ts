import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaPressureSourceResidualAttributionBenchV1,
  type LaPressureSourceResidualAttributionReportV1,
} from "@/engine/mechanics2/benches/LaPressureSourceResidualAttributionBench";
import attributionReport
  from "@/data/mechanics2/reports/la-pressure-source-residual-attribution-report-v1.json";

describe("LaPressureSourceResidualAttributionBench V1", () => {
  let report: LaPressureSourceResidualAttributionReportV1;

  beforeAll(() => {
    report = runLaPressureSourceResidualAttributionBenchV1();
  }, 600_000);

  it("classifies the source-substitution residual after the blocked candidate", () => {
    expect(report.upstreamSourceCandidate.observedStatus)
      .toBe("la-pressure-source-substitution-candidate-blocked");
    expect(report.upstreamSourceCandidate).toMatchObject({
      pass: 2,
      mvfCleanCount: 2,
      outputParityCount: 7,
      clampRegressionFreeCount: 7,
    });
    expect(report.decision.laPressureSourceResidualAttributionStatus)
      .toBe("la-pressure-source-residual-attribution-complete");
    expect(report.summary).toMatchObject({
      total: 7,
      eaCollapsePreservedVolumeCount: 5,
      fiberPulseShapeDiffCount: 0,
      lateGradientErodedCount: 0,
      lateFlowErodedCount: 0,
      outputParityLossCount: 0,
      candidateNewClampCount: 0,
    });
  });

  it("keeps the residual owner on closed-loop E/A separation, not pulse gross timing", () => {
    expect(report.summary.meanFiberVsEmpiricalPulseRms).toBeLessThan(0.07);
    expect(Math.abs(report.summary.meanLateGradientFractionDelta)).toBeLessThan(0.03);
    expect(Math.abs(report.summary.meanLateForwardFractionDelta)).toBeLessThan(0.02);
    for (const row of report.rows) {
      expect(row.fiberVsEmpiricalPulseRms).toBeLessThan(0.07);
      expect(row.activePulsePeakThetaDelta).toBeLessThan(0.02);
      expect(row.mvForwardVolumeRatio).toBeGreaterThan(0.96);
      expect(row.mvForwardVolumeRatio).toBeLessThan(1.01);
      expect(row.aovForwardVolumeRatio).toBeGreaterThan(0.96);
      expect(row.aovForwardVolumeRatio).toBeLessThan(1.01);
      expect(row.candidateClampCount).toBeLessThanOrEqual(row.baselineClampCount);
    }
  });

  it("keeps source substitution, runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toContain("source-surface-substitution");
    expect(report.claimBoundary.sourceSurfaceSubstitution).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed residual-attribution artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(attributionReport, report);
  });
});
