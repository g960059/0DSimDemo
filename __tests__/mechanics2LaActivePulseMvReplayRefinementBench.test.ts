import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaActivePulseMvReplayRefinementBenchV1,
  type LaActivePulseMvReplayRefinementReportV1,
} from "@/engine/mechanics2/benches/LaActivePulseMvReplayRefinementBench";
import refinementReport
  from "@/data/mechanics2/reports/la-active-pulse-mv-replay-refinement-report-v1.json";

describe("LaActivePulseMvReplayRefinementBench V1", () => {
  let report: LaActivePulseMvReplayRefinementReportV1;

  beforeAll(() => {
    report = runLaActivePulseMvReplayRefinementBenchV1();
  }, 600_000);

  it("selects the fiber-active A-window gated shadow pulse without source substitution", () => {
    expect(report.upstreamShadowSubstitution.observedStatus)
      .toBe("la-pressure-shadow-substitution-blocked");
    expect(report.decision.laActivePulseMvReplayRefinementStatus)
      .toBe("la-active-pulse-mv-replay-refinement-signal");
    expect(report.decision.selectedMode).toBe("fiber-active-a-window-gated");

    const selected = report.variantSummaries.find((row) =>
      row.mode === "fiber-active-a-window-gated"
    );
    expect(selected).toMatchObject({
      pass: 7,
      fail: 0,
      shadowMvfCleanCount: 7,
      gradientSupportCleanCount: 7,
      singlePeakCollapseCount: 0,
      forwardVolumeWideCount: 0,
    });
    expect(selected?.meanQmvRmsDeltaMlPerSec).toBeLessThan(1.7);
    expect(selected?.meanForwardVolumeRatio).toBeGreaterThan(0.99);
    expect(selected?.meanForwardVolumeRatio).toBeLessThan(1.01);
    expect(selected?.maxAdverseGradientExcessFraction).toBeLessThanOrEqual(0.02);
  });

  it("keeps the raw fiber pulse residual visible against the positive control", () => {
    const raw = report.variantSummaries.find((row) => row.mode === "raw-fiber-active");
    const control = report.variantSummaries.find((row) =>
      row.mode === "empirical-a-window-positive-control"
    );
    expect(raw).toMatchObject({
      pass: 2,
      singlePeakCollapseCount: 4,
      forwardVolumeWideCount: 1,
    });
    expect(control).toMatchObject({
      pass: 7,
      shadowMvfCleanCount: 7,
      singlePeakCollapseCount: 0,
    });
  });

  it("records every selected-mode profile as a clean shadow replay", () => {
    const selectedRows = report.rows.filter((row) => row.mode === "fiber-active-a-window-gated");
    expect(selectedRows).toHaveLength(7);
    for (const row of selectedRows) {
      expect(row.status).toBe("pass");
      expect(row.currentMvForwardPeakCount).toBe(2);
      expect(row.shadowMvForwardPeakCount).toBe(2);
      expect(row.shadowMvC1ContinuityScore).toBeLessThanOrEqual(0.42);
      expect(row.shadowToCurrentForwardVolumeRatio).toBeGreaterThan(0.98);
      expect(row.shadowToCurrentForwardVolumeRatio).toBeLessThan(1.02);
      expect(row.adverseGradientExcessFraction).toBeLessThanOrEqual(0.02);
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

  it("keeps the committed active-pulse refinement artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(refinementReport, report);
  });
});
