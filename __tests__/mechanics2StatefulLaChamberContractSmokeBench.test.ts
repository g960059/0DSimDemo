import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runStatefulLaChamberContractSmokeBenchV1,
  type StatefulLaChamberContractSmokeReportV1,
} from "@/engine/mechanics2/benches/StatefulLaChamberContractSmokeBench";
import smokeReport
  from "@/data/mechanics2/reports/stateful-la-chamber-contract-smoke-report-v1.json";

describe("StatefulLaChamberContractSmokeBench V1", () => {
  let report: StatefulLaChamberContractSmokeReportV1;

  beforeAll(() => {
    report = runStatefulLaChamberContractSmokeBenchV1();
  }, 600_000);

  it("keeps direct stateful LA chamber pressure as mixed smoke evidence only", () => {
    expect(report.decision.statefulLaChamberContractSmokeStatus)
      .toBe("stateful-la-chamber-contract-smoke-mixed");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      selectedVariantId: "fiber-chamber-total-pressure-shadow",
      selectedSourceSurfacePass: 1,
      selectedContractPass: 0,
      selectedLaPvLobeQualityPass: 1,
      baselineContractPass: 0,
      activePulseContractPass: 0,
      avPlaneVelocityReadbackPresent: 0,
    });
  });

  it("separates source-surface preservation from LA PV lobe quality", () => {
    const baseline = report.variantSummaries.find((entry) =>
      entry.variantId === "baseline-empirical-a-wave");
    const activePulse = report.variantSummaries.find((entry) =>
      entry.variantId === "fiber-active-a-window-gated-shadow");
    const selected = report.selectedVariant;
    expect(baseline).toMatchObject({
      sourceSurfacePass: 7,
      contractPass: 0,
      laPvLobeQualityPass: 0,
      mvfCleanCount: 7,
    });
    expect(activePulse).toMatchObject({
      sourceSurfacePass: 2,
      contractPass: 0,
      laPvLobeQualityPass: 0,
    });
    expect(selected).toMatchObject({
      sourceSurfacePass: 1,
      contractPass: 0,
      laPvLobeQualityPass: 1,
      mvForwardVolumeParityCount: 7,
      massCleanCount: 7,
    });
  });

  it("keeps AV-plane and a-prime claims blocked", () => {
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

  it("keeps the committed stateful LA chamber artifact aligned", () => {
    expectMechanics2ReportArtifactParity(smokeReport, report);
  });
});
