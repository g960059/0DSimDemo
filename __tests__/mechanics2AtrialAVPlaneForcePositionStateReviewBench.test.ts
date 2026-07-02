import { beforeAll, describe, expect, it } from "vitest";
import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialAVPlaneForcePositionStateReviewBenchV1,
  type AtrialAVPlaneForcePositionStateReviewReportV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneForcePositionStateReviewBench";
import atrialAVPlaneForcePositionStateReviewReport
  from "@/data/mechanics2/reports/atrial-av-plane-force-position-state-review-report-v1.json";

describe("AtrialAVPlaneForcePositionStateReviewBench V1", () => {
  let report: AtrialAVPlaneForcePositionStateReviewReportV1;

  beforeAll(() => {
    report = runAtrialAVPlaneForcePositionStateReviewBenchV1();
  }, 600_000);

  it("keeps raw velocity traction as the topology/source reference", () => {
    expect(report.rawReference).toMatchObject({
      variantId: "raw-velocity-traction-reference",
      sourceSurfacePass: 4,
      topologyPass: 7,
      mvfCleanCount: 4,
      hiddenVolumeCleanCount: 7,
      workClosureCleanCount: 7,
      maxDisplacementObservedMm: 9.480814,
      maxVelocityAbsCmPerSec: 19.283225,
      maxTractionForceN: 4.284808,
      maxPositivePowerW: 0.826249,
      maxTotalPositiveWorkJ: 0.02591,
    });
  });

  it("classifies the first explicit force-position state as mixed rather than promotable", () => {
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      rawSourceSurfacePass: 4,
      rawTopologyPass: 7,
      rawMvfCleanCount: 4,
      bestForceVariantId: "force4-stiff2-damp06-mass035",
      bestForceSourceSurfacePass: 2,
      bestForceTopologyPass: 5,
      bestForceMvfCleanCount: 3,
      forceVariantsPreservingRawTopologyAndSource: 0,
      forcePositionStatus: "force-position-state-mixed",
    });
    expect(report.bestForcePositionVariant.sourceSurfacePass)
      .toBeLessThan(report.rawReference.sourceSurfacePass);
    expect(report.bestForcePositionVariant.topologyPass)
      .toBeLessThan(report.rawReference.topologyPass);
  });

  it("records finite force-position state readbacks without hidden-volume or work-closure failures", () => {
    expect(report.bestForcePositionVariant).toMatchObject({
      hiddenVolumeCleanCount: 7,
      workClosureCleanCount: 7,
      maxStateZNorm: 0.513503,
      maxStateZDotNormPerSec: 2,
      maxDriveForceN: 3.158793,
      maxStatePressureMmHg: 14.21574,
      maxPositivePowerW: 0.075811,
    });
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

  it("keeps the committed atrial AV-plane force-position state review artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialAVPlaneForcePositionStateReviewReport, report);
  });
});
