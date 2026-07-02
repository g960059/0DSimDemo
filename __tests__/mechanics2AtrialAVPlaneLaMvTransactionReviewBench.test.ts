import { beforeAll, describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialAVPlaneLaMvTransactionReviewBenchV1,
  type AtrialAVPlaneLaMvTransactionReviewReportV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneLaMvTransactionReviewBench";
import atrialAVPlaneLaMvTransactionReviewReport
  from "@/data/mechanics2/reports/atrial-av-plane-lamv-transaction-review-report-v1.json";

describe("AtrialAVPlaneLaMvTransactionReviewBench V1", () => {
  let report: AtrialAVPlaneLaMvTransactionReviewReportV1;

  beforeAll(() => {
    report = runAtrialAVPlaneLaMvTransactionReviewBenchV1();
  }, 600_000);

  it("keeps the raw AV-plane traction reference intact", () => {
    expect(report.rawReference).toMatchObject({
      variantId: "raw-traction-reference",
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

  it("classifies same-step LA/MV opening release as mixed because source/MVF do not improve", () => {
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      rawSourceSurfacePass: 4,
      rawTopologyPass: 7,
      rawMvfCleanCount: 4,
      bestLaMvTransactionVariantId: "lamv-open-release-rate2600-threshold12-mv-moderate",
      bestLaMvTransactionSourceSurfacePass: 3,
      bestLaMvTransactionTopologyPass: 7,
      bestLaMvTransactionMvfCleanCount: 4,
      laMvVariantsImprovingRawSourceAndKeepingTopology: 0,
      reviewStatus: "lamv-transaction-mixed",
    });
    expect(report.bestLaMvTransactionVariant.maxTractionPressureStepMmHg)
      .toBeLessThan(report.rawReference.maxTractionPressureStepMmHg);
    expect(report.bestLaMvTransactionVariant.sourceSurfacePass)
      .toBeLessThan(report.rawReference.sourceSurfacePass);
    expect(report.bestLaMvTransactionVariant.maxMvQDotAbsMlPerSec2)
      .toBeGreaterThan(report.rawReference.maxMvQDotAbsMlPerSec2);
    expect(report.bestLaMvTransactionVariant.maxMvReverseProjectionAbsMlPerSec)
      .toBeGreaterThan(report.rawReference.maxMvReverseProjectionAbsMlPerSec);
  });

  it("keeps hidden-volume cleanliness while routing away from release-only cleanup", () => {
    expect(report.bestLaMvTransactionVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.bestLaMvTransactionVariant.topologyPass).toBe(7);
    expect(report.decision.nextAction)
      .toContain("pressure/capacity ownership into the AV-plane coordinate contract");
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

  it("keeps the committed atrial AV-plane LA/MV transaction artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialAVPlaneLaMvTransactionReviewReport, report);
  });
});
