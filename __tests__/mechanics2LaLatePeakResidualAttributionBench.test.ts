import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaLatePeakResidualAttributionBenchV1,
  type LaLatePeakResidualAttributionReportV1,
} from "@/engine/mechanics2/benches/LaLatePeakResidualAttributionBench";
import latePeakResidualReport
  from "@/data/mechanics2/reports/la-late-peak-residual-attribution-report-v1.json";

describe("LaLatePeakResidualAttributionBench V1", () => {
  let report: LaLatePeakResidualAttributionReportV1;

  beforeAll(() => {
    report = runLaLatePeakResidualAttributionBenchV1();
  }, 480_000);

  it("classifies the non-focused decomposed LA late-peak residuals", () => {
    expect(report.upstreamDecomposedContract.observedStatus)
      .toBe("decomposed-la-pressure-contract-focused-shadow-signal");
    expect(report.decision.laLatePeakResidualAttributionStatus)
      .toBe("la-late-peak-residual-attribution-signal");
    expect(report.summary).toMatchObject({
      residualCount: 3,
      classifiedCount: 3,
      boundaryTailDominantCount: 3,
      pressureParityCleanCount: 3,
    });
    expect(report.rows.map((row) => row.profileId)).toEqual([
      "normal-hr75",
      "normal-hr90",
      "contractility-high",
    ]);
  });

  it("keeps the residual interpretation bounded to shadow substitution preparation", () => {
    for (const row of report.rows) {
      expect(row.classifications).toContain("current-late-window-boundary-tail-dominant");
      expect(row.classifications).toContain("decomposed-a-wave-late-pulse-present");
      expect(row.classifications).toContain("pressure-parity-clean-despite-phase-label");
      expect(row.classifications).not.toContain("unclassified-late-peak-residual");
      expect(row.decomposedMeanAbsDeltaMmHg).toBeLessThan(0.35);
      expect(row.decomposedImprovementFraction).toBeGreaterThan(0.95);
      expect(row.currentLatePeakTheta).toBeLessThanOrEqual(0.75);
    }
  });

  it("keeps runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.claimBoundary.sourceSurfaceSubstitution).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed late-peak attribution artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(latePeakResidualReport, report);
  });
});
