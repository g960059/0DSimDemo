import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaPressureShadowSubstitutionBenchV1,
  type LaPressureShadowSubstitutionReportV1,
} from "@/engine/mechanics2/benches/LaPressureShadowSubstitutionBench";
import shadowSubstitutionReport
  from "@/data/mechanics2/reports/la-pressure-shadow-substitution-report-v1.json";

describe("LaPressureShadowSubstitutionBench V1", () => {
  let report: LaPressureShadowSubstitutionReportV1;

  beforeAll(() => {
    report = runLaPressureShadowSubstitutionBenchV1();
  }, 480_000);

  it("keeps source substitution blocked while measuring the decomposed LAP MV replay", () => {
    expect(report.upstreamLatePeakAttribution.observedStatus)
      .toBe("la-late-peak-residual-attribution-signal");
    expect(report.substitutionMode)
      .toBe("shadow-replay-MV-valve-with-decomposed-LAP-no-volume-or-source-commit");
    expect(report.decision.laPressureShadowSubstitutionStatus)
      .toBe("la-pressure-shadow-substitution-blocked");
    expect(report.summary).toMatchObject({
      total: 7,
      pass: 2,
      fail: 5,
      shadowMvfCleanCount: 3,
      gradientSupportCleanCount: 7,
      shadowSinglePeakCollapseCount: 4,
      shadowForwardVolumeWideCount: 1,
      classifiedResidualCount: 7,
    });
  });

  it("classifies the residual as MV replay shape, not adverse pressure-gradient support", () => {
    expect(report.summary.maxAdverseGradientDuringForwardFlowFraction).toBeLessThan(0.03);
    expect(report.summary.maxShadowNegativeEnergyExcessFraction).toBeLessThan(0.02);

    const failed = report.rows.filter((row) => row.status === "fail");
    expect(failed.map((row) => row.profileId)).toEqual([
      "normal-hr75",
      "normal-hr90",
      "preload-high",
      "contractility-low",
      "contractility-high",
    ]);
    for (const row of failed) {
      expect(row.classifications).toContain("pressure-gradient-support-clean");
      expect(row.classifications).not.toContain("unclassified-shadow-substitution-residual");
    }
    expect(failed.filter((row) =>
      row.classifications.includes("shadow-single-peak-EA-collapse")
    )).toHaveLength(4);
    expect(failed.filter((row) =>
      row.classifications.includes("shadow-forward-volume-amplification")
    )).toHaveLength(1);
  });

  it("keeps runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.claimBoundary.sourceSurfaceSubstitution).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed shadow-substitution artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(shadowSubstitutionReport, report);
  });
});
