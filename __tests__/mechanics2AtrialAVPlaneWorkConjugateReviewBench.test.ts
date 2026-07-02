import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialAVPlaneWorkConjugateReviewBenchV1,
  type AtrialAVPlaneWorkConjugateReviewReportV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneWorkConjugateReviewBench";
import atrialAVPlaneWorkConjugateReviewReport
  from "@/data/mechanics2/reports/atrial-av-plane-work-conjugate-review-report-v1.json";

describe("AtrialAVPlaneWorkConjugateReviewBench V1", () => {
  let report: AtrialAVPlaneWorkConjugateReviewReportV1;

  beforeAll(() => {
    report = runAtrialAVPlaneWorkConjugateReviewBenchV1();
  }, 600_000);

  it("keeps the raw velocity-traction topology lead as the reference", () => {
    expect(report.rawVelocityReference).toMatchObject({
      variantId: "raw-velocity-traction12-flow10-cap20",
      sourceSurfacePass: 4,
      mvfCleanCount: 4,
      topologyPass: 7,
      sourcePreservingTopologyPass: 4,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 7,
      maxTractionPressureMmHg: 19.283221,
      maxTractionPressureStepMmHg: 15.21214,
      maxTractionPressureRateMmHgPerSec: 3650.9136,
      maxTractionPressureDuringMvOpenMmHg: 0,
    });
  });

  it("classifies finite pressure-drive smoothing as no-go because it loses source preservation", () => {
    expect(report.decision.atrialAVPlaneWorkConjugateReviewStatus)
      .toBe("finite-drive-traction-pressure-smoothing-no-go");
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      rawSourceSurfacePass: 4,
      rawTopologyPass: 7,
      rawMvfCleanCount: 4,
      rawMaxTractionPressureStepMmHg: 15.21214,
      bestFiniteDriveVariantId: "finite-drive-traction20-fast-flow10-cap20",
      bestFiniteDriveSourceSurfacePass: 2,
      bestFiniteDriveTopologyPass: 7,
      bestFiniteDriveMvfCleanCount: 3,
      bestFiniteDriveMaxTractionPressureStepMmHg: 4.730061,
      bestFiniteDriveStepReductionRatio: 0.31094,
      finiteDriveVariantsPreservingRawTopologyAndSource: 0,
    });
    expect(report.bestFiniteDriveVariant.maxTractionPressureStepMmHg)
      .toBeLessThan(report.rawVelocityReference.maxTractionPressureStepMmHg);
    expect(report.bestFiniteDriveVariant.sourceSurfacePass)
      .toBeLessThan(report.rawVelocityReference.sourceSurfacePass);
  });

  it("records work-proxy readbacks without allowing hidden blood volume claims", () => {
    expect(report.rawVelocityReference.maxTractionGeometryWorkProxyMmHgMl).toBeGreaterThan(150);
    expect(report.rawVelocityReference.maxTractionKinematicWorkProxyMmHgMl).toBeGreaterThan(70);
    expect(report.bestFiniteDriveVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.rawVelocityReference.hiddenVolumeCleanCount).toBe(7);
  });

  it("keeps runtime, morphology acceptance, AV-plane enablement, pressure substitution, hidden-volume source, and LandAtrial blocked", () => {
    expect(report.decision.blockedClaims).toEqual(expect.arrayContaining([
      "runtime-wiring",
      "morphology-acceptance",
      "AV-plane-enable",
      "hidden-blood-volume-source",
      "atrial-pressure-substitution",
      "LandAtrial-unlock",
    ]));
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.hiddenBloodVolumeSource).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
  });

  it("keeps the committed atrial AV-plane work-conjugate review artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialAVPlaneWorkConjugateReviewReport, report);
  });
});
