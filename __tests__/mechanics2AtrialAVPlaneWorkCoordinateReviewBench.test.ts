import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialAVPlaneWorkCoordinateReviewBenchV1,
  type AtrialAVPlaneWorkCoordinateReviewReportV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneWorkCoordinateReviewBench";
import atrialAVPlaneWorkCoordinateReviewReport
  from "@/data/mechanics2/reports/atrial-av-plane-work-coordinate-review-report-v1.json";

describe("AtrialAVPlaneWorkCoordinateReviewBench V1", () => {
  let report: AtrialAVPlaneWorkCoordinateReviewReportV1;

  beforeAll(() => {
    report = runAtrialAVPlaneWorkCoordinateReviewBenchV1();
  }, 600_000);

  it("keeps the raw traction topology lead and exposes a finite AV-plane coordinate", () => {
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      rawSourceSurfacePass: 4,
      rawTopologyPass: 7,
      rawMvfCleanCount: 4,
      rawMaxDisplacementObservedMm: 9.480814,
      rawMaxVelocityAbsCmPerSec: 19.283225,
      rawMaxTractionForceN: 4.284808,
      rawMaxPositivePowerW: 0.826249,
      rawMaxTotalPositiveWorkJ: 0.02591,
      rawMaxWorkClosureErrorJ: 0,
      finiteSourceSurfacePass: 2,
      finiteTopologyPass: 6,
      finiteMvfCleanCount: 3,
      coordinateStatus: "work-coordinate-readback-sane-topology-signal",
    });
  });

  it("keeps coordinate volume and work closure exact for the review surface", () => {
    expect(report.rawCoordinateReference).toMatchObject({
      hiddenVolumeCleanCount: 7,
      sPrimePresentCount: 7,
      ePrimePresentCount: 7,
      aPrimePresentCount: 7,
      maxWorkClosureErrorJ: 0,
      maxCoordinateVolumeErrorMl: 0,
    });
    expect(report.finiteDriveCoordinateReference).toMatchObject({
      hiddenVolumeCleanCount: 7,
      maxWorkClosureErrorJ: 0,
      maxCoordinateVolumeErrorMl: 0,
    });
  });

  it("does not let lower finite-drive power override source-surface loss", () => {
    expect(report.finiteDriveCoordinateReference.maxPositivePowerW)
      .toBeLessThan(report.rawCoordinateReference.maxPositivePowerW);
    expect(report.finiteDriveCoordinateReference.sourceSurfacePass)
      .toBeLessThan(report.rawCoordinateReference.sourceSurfacePass);
    expect(report.finiteDriveCoordinateReference.topologyPass)
      .toBeLessThan(report.rawCoordinateReference.topologyPass);
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

  it("keeps the committed atrial AV-plane work-coordinate review artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialAVPlaneWorkCoordinateReviewReport, report);
  });
});
