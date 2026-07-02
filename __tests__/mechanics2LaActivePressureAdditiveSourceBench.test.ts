import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runLaActivePressureAdditiveSourceBenchV1,
  type LaActivePressureAdditiveSourceReportV1,
} from "@/engine/mechanics2/benches/LaActivePressureAdditiveSourceBench";
import additiveReport
  from "@/data/mechanics2/reports/la-active-pressure-additive-source-report-v1.json";

describe("LaActivePressureAdditiveSourceBench V1", () => {
  let report: LaActivePressureAdditiveSourceReportV1;

  beforeAll(() => {
    report = runLaActivePressureAdditiveSourceBenchV1();
  }, 600_000);

  it("keeps additive LA active-pressure source promotion blocked", () => {
    expect(report.decision.laActivePressureAdditiveSourceStatus)
      .toBe("la-active-pressure-additive-source-blocked");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      bestVariantId: "fiber-active-additive-gain050",
      bestSourceSurfacePass: 2,
      bestContractPass: 0,
      bestLaPvLobeQualityPass: 0,
      bestMvfCleanCount: 2,
    });
    expect(report.bestVariant.mvForwardVolumeParityCount).toBe(7);
    expect(report.bestVariant.aovOutputParityCount).toBe(7);
    expect(report.bestVariant.massCleanCount).toBe(7);
  });

  it("does not mistake flow-volume parity for atrial PV contract readiness", () => {
    expect(report.bestVariant.laPvLobeQualityPass).toBe(0);
    expect(report.bestVariant.contractPass).toBe(0);
    expect(report.rows.some((row) =>
      row.failureReasons.includes("la-pv-lobe-quality-fail")
    )).toBe(true);
  });

  it("keeps runtime, AV-plane, a-prime, and LandAtrial claims blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-geometry",
      "a-prime-readback",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneGeometry).toBe(false);
    expect(report.claimBoundary.aPrimeReadback).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed additive source artifact aligned", () => {
    expectMechanics2ReportArtifactParity(additiveReport, report);
  });
});
