import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialFiberPackClosedLoopReplayBenchV1,
  type AtrialFiberPackClosedLoopReplayReportV1,
} from "@/engine/mechanics2/benches/AtrialFiberPackClosedLoopReplayBench";
import closedLoopReplayReport
  from "@/data/mechanics2/reports/atrial-fiber-pack-closed-loop-replay-report-v1.json";

describe("AtrialFiberPackClosedLoopReplayBench V1", () => {
  let report: AtrialFiberPackClosedLoopReplayReportV1;

  beforeAll(() => {
    report = runAtrialFiberPackClosedLoopReplayBenchV1();
  }, 360_000);

  it("passes AV-plane-off LA/RA closed-loop volume replay without pressure substitution", () => {
    expect(report.upstreamAtrialFiberPack.mayProceedObserved).toBe(true);
    expect(report.replayMode).toBe("closed-loop-volume-replay-no-pressure-substitution");
    expect(report.decision.atrialFiberClosedLoopReplayStatus).toBe("atrial-fiber-closed-loop-replay-signal");
    expect(report.summary).toMatchObject({
      total: 14,
      pass: 14,
      fail: 0,
      laPass: 7,
      raPass: 7,
      finiteCount: 14,
      lateActivePeakCount: 14,
      pressureParityCount: 11,
    });
  });

  it("keeps residual LA pressure parity advisory rather than unlocking substitution", () => {
    const advisoryRows = report.resultRows.filter((row) => row.advisoryResidualReasons.length > 0);
    expect(advisoryRows.map((row) => `${row.chamberId}:${row.profileId}`)).toEqual([
      "LA:preload-high",
      "LA:afterload-high",
      "LA:contractility-low",
    ]);
    expect(advisoryRows.every((row) =>
      row.advisoryResidualReasons.includes("fiber-current-pressure-parity-wide")
    )).toBe(true);
    expect(report.decision.blockedClaims).toContain("atrial-pressure-substitution");
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
  });

  it("does not unlock runtime, morphology acceptance, AV-plane, or LandAtrial", () => {
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed closed-loop replay artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(closedLoopReplayReport, report);
  });
});
