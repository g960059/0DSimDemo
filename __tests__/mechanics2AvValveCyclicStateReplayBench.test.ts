import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAvValveCyclicStateReplayBenchV1,
  type AvValveCyclicStateReplayReportV1,
} from "@/engine/mechanics2/benches/AvValveCyclicStateReplayBench";
import replayReport
  from "@/data/mechanics2/reports/av-valve-cyclic-state-replay-report-v1.json";

describe("AvValveCyclicStateReplayBench V1", () => {
  let report: AvValveCyclicStateReplayReportV1;

  beforeAll(() => {
    report = runAvValveCyclicStateReplayBenchV1();
  }, 600_000);

  it("shows cyclic accepted valve-state carryover as the best fixed replay signal", () => {
    expect(report.decision.avValveCyclicStateReplayStatus)
      .toBe("av-valve-cyclic-state-replay-mixed");
    expect(report.summary).toMatchObject({
      total: 14,
      bestFixedVariantId: "cyclic-current-pressure",
      bestFixedPass: 4,
      bestFixedMvPass: 3,
      bestFixedTvPass: 1,
      bestFixedCleanShapeCount: 7,
      bestFixedForwardVolumeParityCount: 14,
      zeroStatePass: 0,
      zeroStateCleanShapeCount: 6,
    });
    expect(report.bestFixedVariant.meanQRmsDeltaMlPerSec).toBeLessThan(0.5);
    expect(report.bestFixedVariant.maxCyclicStateDeltaNorm).toBe(0);
    expect(report.summary.bestFixedMaxRequiredCausalGradientSupportMmHg).toBeGreaterThan(6);
    expect(report.summary.bestFixedMaxRequiredCausalGradientSupportMmHg).toBeLessThan(7);
    expect(report.summary.bestFixedMeanRequiredCausalGradientSupportMmHg).toBeGreaterThan(1.4);
    expect(report.summary.bestFixedMeanRequiredCausalGradientSupportMmHg).toBeLessThan(1.7);
  });

  it("keeps source-open-memory behind cyclic current-pressure replay", () => {
    const sourceOpen = report.variantSummaries.find((row) =>
      row.variantId === "cyclic-source-open-memory"
    );
    expect(sourceOpen).toBeDefined();
    expect(sourceOpen?.pass).toBeLessThan(report.bestFixedVariant.pass);
    expect(sourceOpen?.meanQRmsDeltaMlPerSec).toBeGreaterThan(report.bestFixedVariant.meanQRmsDeltaMlPerSec);
    expect(sourceOpen?.maxRequiredCausalGradientSupportMmHg)
      .toBeGreaterThan(report.bestFixedVariant.maxRequiredCausalGradientSupportMmHg);
  });

  it("localizes the remaining cyclic replay failures to adverse-gradient forward flow", () => {
    const bestRows = report.rows.filter((row) => row.variantId === report.summary.bestFixedVariantId);
    expect(bestRows.filter((row) => row.status === "pass").map((row) =>
      `${row.profileId}:${row.valveSide}`
    )).toEqual([
      "normal-hr90:MV",
      "preload-low:MV",
      "contractility-low:TV",
      "contractility-high:MV",
    ]);
    const failed = bestRows.filter((row) => row.status === "fail");
    expect(failed).toHaveLength(10);
    expect(failed.every((row) =>
      row.failureReasons.length === 1
      && row.failureReasons[0] === "cyclic-replay-adverse-gradient-during-forward-flow"
    )).toBe(true);
    expect(bestRows.every((row) =>
      row.replayToCurrentForwardVolumeRatio >= 0.99
      && row.replayToCurrentForwardVolumeRatio <= 1.01
    )).toBe(true);
    expect(failed.every((row) => row.maxRequiredCausalGradientSupportMmHg > 0)).toBe(true);
    expect(failed.every((row) => row.causalGradientSupportDutyFraction < 0.08)).toBe(true);
  });

  it("keeps pressure/gradient commit, runtime, morphology, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toContain("source-pressure-commit");
    expect(report.decision.blockedClaims).toContain("source-gradient-commit");
    expect(report.claimBoundary.sourcePressureCommit).toBe(false);
    expect(report.claimBoundary.sourceGradientCommit).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed cyclic state replay artifact aligned", () => {
    expectMechanics2ReportArtifactParity(replayReport, report);
  });
});
