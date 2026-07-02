import { beforeAll, describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialAVPlaneMvOwnershipReviewBenchV1,
  type AtrialAVPlaneMvOwnershipReviewReportV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneMvOwnershipReviewBench";
import atrialAVPlaneMvOwnershipReviewReport
  from "@/data/mechanics2/reports/atrial-av-plane-mv-ownership-review-report-v1.json";

describe("AtrialAVPlaneMvOwnershipReviewBench V1", () => {
  let report: AtrialAVPlaneMvOwnershipReviewReportV1;

  beforeAll(() => {
    report = runAtrialAVPlaneMvOwnershipReviewBenchV1();
  }, 600_000);

  it("keeps the raw AV-plane traction reference unchanged for the MV ownership comparison", () => {
    expect(report.rawReference).toMatchObject({
      variantId: "raw-traction-reference",
      sourceSurfacePass: 4,
      topologyPass: 7,
      sourcePreservingTopologyPass: 4,
      mvfCleanCount: 4,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 7,
      maxMvQDotAbsMlPerSec2: 5306.870682,
      maxMvPressureFlowResidualAbsMmHg: 140.734076,
      maxMvReverseProjectionAbsMlPerSec: 7.162528,
    });
  });

  it("classifies MV valve parameter ownership as mixed rather than an AV-plane cleanup path", () => {
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      rawSourceSurfacePass: 4,
      rawTopologyPass: 7,
      rawMvfCleanCount: 4,
      bestMvOwnershipVariantId: "mv-lower-inertance-loss",
      bestMvOwnershipSourceSurfacePass: 4,
      bestMvOwnershipTopologyPass: 7,
      bestMvOwnershipMvfCleanCount: 5,
      mvOwnershipVariantsImprovingRawSourceAndKeepingTopology: 0,
      reviewStatus: "mv-ownership-mixed",
    });
    expect(report.bestMvOwnershipVariant.maxMvQDotAbsMlPerSec2)
      .toBeGreaterThan(report.rawReference.maxMvQDotAbsMlPerSec2);
    expect(report.bestMvOwnershipVariant.maxMvReverseProjectionAbsMlPerSec)
      .toBeGreaterThan(report.rawReference.maxMvReverseProjectionAbsMlPerSec);
  });

  it("keeps topology and hidden-volume readbacks clean while blocking runtime and morphology claims", () => {
    expect(report.bestMvOwnershipVariant.topologyPass).toBe(7);
    expect(report.bestMvOwnershipVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.decision.nextAction)
      .toContain("same-step LA pressure, AV-plane traction, and MV opening transaction");
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

  it("keeps the committed atrial AV-plane MV ownership artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialAVPlaneMvOwnershipReviewReport, report);
  });
});
