import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialFiberPackPrescribedVolumeBenchV1,
  type AtrialFiberPackPrescribedVolumeReportV1,
} from "@/engine/mechanics2/benches/AtrialFiberPackPrescribedVolumeBench";
import atrialFiberPackReport
  from "@/data/mechanics2/reports/atrial-fiber-pack-prescribed-volume-report-v1.json";

describe("AtrialFiberPackPrescribedVolumeBench V1", () => {
  let report: AtrialFiberPackPrescribedVolumeReportV1;

  beforeAll(() => {
    report = runAtrialFiberPackPrescribedVolumeBenchV1();
  }, 240_000);

  it("passes LA/RA prescribed-volume atrial fiber fixtures after source/reservoir closure", () => {
    expect(report.upstreamSourceReservoirContract.mayProceedObserved).toBe(true);
    expect(report.decision.atrialFiberPackStatus).toBe("atrial-fiber-pack-prescribed-volume-signal");
    expect(report.summary).toMatchObject({
      total: 4,
      pass: 4,
      fail: 0,
      boundedPressureCount: 4,
      lateActivePeakCount: 4,
      finiteCount: 4,
    });
  });

  it("keeps atrial pressure finite, bounded, and late-active on every fixture", () => {
    expect(report.fixtureResults.every((result) => result.status === "pass")).toBe(true);
    expect(report.fixtureResults.every((result) => result.failureReasons.length === 0)).toBe(true);
    expect(report.fixtureResults.every((result) => result.pressurePeakMmHg < 24)).toBe(true);
    expect(report.fixtureResults.every((result) =>
      result.activePeakTheta >= 0.66 && result.activePeakTheta <= 0.9
    )).toBe(true);
  });

  it("does not unlock runtime, closed-loop atria, AV-plane, or LandAtrial", () => {
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.closedLoopAtria).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.pistonVolumeMode).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed atrial-fiber artifact fully aligned with the rerun report", () => {
    expectMechanics2ReportArtifactParity(atrialFiberPackReport, report);
  });
});
