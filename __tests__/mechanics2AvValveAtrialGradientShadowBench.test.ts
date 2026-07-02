import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAvValveAtrialGradientShadowBenchV1,
  type AvValveAtrialGradientShadowReportV1,
} from "@/engine/mechanics2/benches/AvValveAtrialGradientShadowBench";
import gradientReport
  from "@/data/mechanics2/reports/av-valve-atrial-gradient-shadow-report-v1.json";

describe("AvValveAtrialGradientShadowBench V1", () => {
  let report: AvValveAtrialGradientShadowReportV1;

  beforeAll(() => {
    report = runAvValveAtrialGradientShadowBenchV1();
  }, 600_000);

  it("keeps simple atrial active-gradient shadow injection blocked", () => {
    expect(report.upstreamAtrialShadow.observedStatus)
      .toBe("atrial-fiber-source-reservoir-shadow-replay-signal");
    expect(report.upstreamAtrialShadow).toMatchObject({
      pass: 14,
      finiteBoundedCount: 14,
    });
    expect(report.decision.avValveAtrialGradientShadowStatus)
      .toBe("av-valve-atrial-gradient-shadow-blocked");
    expect(report.summary).toMatchObject({
      total: 14,
      pass: 0,
      fail: 14,
      mvPass: 0,
      tvPass: 0,
      cleanShapeCount: 1,
      forwardVolumeParityCount: 4,
    });
  });

  it("records that the blocked shadow is valve replay failure, not source pressure commit", () => {
    expect(report.summary.maxGradientSignMismatchFraction).toBeLessThan(0.02);
    expect(report.summary.maxAdverseGradientDuringForwardFlowFraction).toBeGreaterThan(0.03);
    expect(report.summary.meanQmsDeltaMlPerSec).toBeGreaterThan(30);
    for (const row of report.rows) {
      expect(row.status).toBe("fail");
      expect(row.failureReasons.length).toBeGreaterThan(0);
      expect(row.gradientSignMismatchFraction).toBeLessThan(0.02);
      expect(row.activePulsePeak01).toBeGreaterThan(0.6);
    }
  });

  it("keeps source commit, runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toContain("source-pressure-commit");
    expect(report.claimBoundary.sourcePressureCommit).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed AV gradient shadow artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(gradientReport, report);
  });
});
