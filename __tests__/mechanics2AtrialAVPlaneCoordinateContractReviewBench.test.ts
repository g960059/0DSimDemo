import { beforeAll, describe, expect, it } from "vitest";

import { expectMechanics2ReportArtifactParity } from "@/__tests__/helpers/mechanics2ReportParity";
import {
  runAtrialAVPlaneCoordinateContractReviewBenchV1,
  type AtrialAVPlaneCoordinateContractReviewReportV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneCoordinateContractReviewBench";
import atrialAVPlaneCoordinateContractReviewReport
  from "@/data/mechanics2/reports/atrial-av-plane-coordinate-contract-review-report-v1.json";

describe("AtrialAVPlaneCoordinateContractReviewBench V1", () => {
  let report: AtrialAVPlaneCoordinateContractReviewReportV1;

  beforeAll(() => {
    report = runAtrialAVPlaneCoordinateContractReviewBenchV1();
  }, 600_000);

  it("keeps the raw traction topology reference intact", () => {
    expect(report.rawReference).toMatchObject({
      variantId: "raw-traction-reference",
      sourceSurfacePass: 4,
      topologyPass: 7,
      sourcePreservingTopologyPass: 4,
      mvfCleanCount: 4,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 7,
      maxTractionPressureMmHg: 19.283221,
      maxVLoopArea: 71.598793,
    });
  });

  it("rejects capacity-only work coordinate as sufficient v-loop ownership", () => {
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      rawSourceSurfacePass: 4,
      rawTopologyPass: 7,
      rawMvfCleanCount: 4,
      bestCoordinateVariantId: "capacity-coordinate-drive4-stiff2-damp06",
      bestCoordinateSourceSurfacePass: 3,
      bestCoordinateTopologyPass: 0,
      bestCoordinateMvfCleanCount: 4,
      bestForceBalanceVariantId: "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast",
      bestForceBalanceSourceSurfacePass: 2,
      bestForceBalanceTopologyPass: 5,
      bestForceBalanceSourcePreservingTopologyPass: 2,
      bestForceBalanceMvfCleanCount: 3,
      coordinateVariantsImprovingRawSourceAndKeepingTopology: 0,
      coordinateVariantsWithZeroTractionPressure: 6,
      forceBalanceVariantCount: 13,
      reviewStatus: "coordinate-contract-mixed",
    });
    expect(report.bestCoordinateVariant.maxTractionPressureMmHg).toBe(0);
    expect(report.bestCoordinateVariant.opposedLobeCount).toBe(0);
    expect(report.bestCoordinateVariant.maxZNorm).toBeGreaterThan(0);
    expect(report.bestCoordinateVariant.maxDriveForceN).toBeGreaterThan(0);
  });

  it("keeps explicit force-balance coordinate as partial evidence only", () => {
    expect(report.bestForceBalanceVariant).toMatchObject({
      variantId: "force-balance-cap32-drive6-hyd004-stiff2-damp06-fast",
      sourceSurfacePass: 2,
      topologyPass: 5,
      sourcePreservingTopologyPass: 2,
      mvfCleanCount: 3,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 7,
    });
    expect(report.bestForceBalanceVariant.maxHydraulicForceN).toBeGreaterThan(0);
    expect(report.bestForceBalanceVariant.maxNetForceN).toBeGreaterThan(0);
    expect(report.bestForceBalanceVariant.topologyPass).toBeLessThan(report.rawReference.topologyPass);
    expect(report.bestForceBalanceVariant.sourceSurfacePass).toBeLessThan(report.rawReference.sourceSurfacePass);
  });

  it("keeps hidden-volume cleanliness while routing to a force-balance coordinate", () => {
    expect(report.bestCoordinateVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.bestForceBalanceVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.decision.nextAction).toContain("implicit wall-work / LA-MV residual contract");
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

  it("keeps the committed atrial AV-plane coordinate contract artifact aligned", () => {
    expectMechanics2ReportArtifactParity(atrialAVPlaneCoordinateContractReviewReport, report);
  });
});
