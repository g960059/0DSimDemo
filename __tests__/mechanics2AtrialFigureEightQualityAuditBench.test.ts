import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialFigureEightQualityAuditBenchV1,
  type AtrialFigureEightQualityAuditReportV1,
} from "@/engine/mechanics2/benches/AtrialFigureEightQualityAuditBench";
import auditReport
  from "@/data/mechanics2/reports/atrial-figure-eight-quality-audit-report-v1.json";

describe("AtrialFigureEightQualityAuditBench V1", () => {
  let report: AtrialFigureEightQualityAuditReportV1;

  beforeAll(() => {
    report = runAtrialFigureEightQualityAuditBenchV1();
  }, 600_000);

  it("shows that pressure parity alone is not atrial figure-eight quality", () => {
    expect(report.decision.atrialFigureEightQualityStatus)
      .toBe("atrial-figure-eight-quality-audit-blocked");
    expect(report.summary).toMatchObject({
      total: 14,
      currentBasicFigureEightPass: 1,
      currentLobeQualityPass: 0,
      fiberBasicFigureEightPass: 14,
      fiberLobeQualityPass: 5,
      bothPressureSourcesLobeQualityPass: 0,
      avPlaneVelocityReadbackPresent: 0,
    });
    expect(report.summary.meanFiberAOverVLoopRatio).toBeGreaterThan(20);
    expect(report.summary.meanCurrentAOverVLoopRatio).toBeGreaterThan(18);
  });

  it("keeps LA fiber loops as the useful component signal and RA loops as the blocker", () => {
    const laRows = report.rows.filter((row) => row.chamberId === "LA");
    const raRows = report.rows.filter((row) => row.chamberId === "RA");
    expect(laRows.filter((row) => row.fiberPv.lobeQualityPass)).toHaveLength(5);
    expect(raRows.filter((row) => row.fiberPv.lobeQualityPass)).toHaveLength(0);
    expect(laRows.every((row) => row.currentPv.lobeQualityPass === false)).toBe(true);
    expect(raRows.every((row) =>
      row.fiberPv.failureReasons.includes("v-loop-not-higher-volume-than-a-loop")
    )).toBe(true);
  });

  it("marks a-prime as unavailable until AV-plane velocity is a real state", () => {
    expect(report.rows.every((row) => row.avPlanePositionStatePresent === false)).toBe(true);
    expect(report.rows.every((row) => row.avPlaneVelocityStatePresent === false)).toBe(true);
    expect(report.rows.every((row) =>
      row.aPrimeReadbackStatus === "missing-av-plane-velocity-state"
    )).toBe(true);
    expect(report.rows.every((row) =>
      row.failureReasons.includes("a-prime-readback-missing-av-plane-velocity")
    )).toBe(true);
    expect(report.decision.blockedClaims).toContain("a-prime-readback");
    expect(report.claimBoundary.aPrimeReadback).toBe(false);
  });

  it("keeps runtime, pressure substitution, morphology acceptance, AV-plane, and LandAtrial locked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "atrial-pressure-substitution",
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-geometry",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed atrial figure-eight quality artifact aligned", () => {
    expectMechanics2ReportArtifactParity(auditReport, report);
  });
});
