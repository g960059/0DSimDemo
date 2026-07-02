import { beforeAll, describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialAVPlaneVelocityStatefulTractionReviewBenchV1,
  type AtrialAVPlaneVelocityStatefulTractionReviewReportV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneVelocityStatefulTractionReviewBench";
import atrialAVPlaneVelocityStatefulTractionReviewReport
  from "@/data/mechanics2/reports/atrial-av-plane-velocity-stateful-traction-review-report-v1.json";

describe("AtrialAVPlaneVelocityStatefulTractionReviewBench V1", () => {
  let report: AtrialAVPlaneVelocityStatefulTractionReviewReportV1;

  beforeAll(() => {
    report = runAtrialAVPlaneVelocityStatefulTractionReviewBenchV1();
  }, 600_000);

  it("keeps the raw velocity traction v-loop reference intact", () => {
    expect(report.rawReference).toMatchObject({
      variantId: "raw-velocity-traction12-flow10-cap20",
      sourceSurfacePass: 4,
      topologyPass: 7,
      sourcePreservingTopologyPass: 4,
      mvfCleanCount: 4,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 7,
      maxTractionPressureStepMmHg: 15.21214,
      maxTractionPressureDuringMvOpenMmHg: 0,
    });
  });

  it("classifies velocity-target stateful traction as mixed because it smooths pressure but loses source/MVF status", () => {
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      rawSourceSurfacePass: 4,
      rawTopologyPass: 7,
      rawMvfCleanCount: 4,
      rawMaxTractionPressureStepMmHg: 15.21214,
      bestVelocityStatefulVariantId: "velocity-stateful-traction12-rate1200-release08",
      bestVelocityStatefulSourceSurfacePass: 3,
      bestVelocityStatefulTopologyPass: 7,
      bestVelocityStatefulMvfCleanCount: 3,
      bestVelocityStatefulMaxTractionPressureStepMmHg: 5,
      bestVelocityStatefulStepReductionRatio: 0.328685,
      velocityStatefulVariantsPreservingRawTopologyAndSource: 0,
      reviewStatus: "velocity-stateful-traction-mixed",
    });
    expect(report.bestVelocityStatefulVariant.maxTractionPressureStepMmHg)
      .toBeLessThan(report.rawReference.maxTractionPressureStepMmHg);
    expect(report.bestVelocityStatefulVariant.sourceSurfacePass)
      .toBeLessThan(report.rawReference.sourceSurfacePass);
  });

  it("keeps hidden-volume cleanliness while rejecting runtime or morphology claims", () => {
    expect(report.bestVelocityStatefulVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.rawReference.hiddenVolumeCleanCount).toBe(7);
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

  it("keeps the committed atrial AV-plane velocity-stateful traction artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialAVPlaneVelocityStatefulTractionReviewReport, report);
  });
});
