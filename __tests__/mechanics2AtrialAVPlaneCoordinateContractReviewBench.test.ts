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

  it("reclassifies raw traction as phase-orientation incomplete despite signed opposed lobes", () => {
    expect(report.rawReference).toMatchObject({
      variantId: "raw-traction-reference",
      sourceSurfacePass: 4,
      topologyPass: 0,
      sourcePreservingTopologyPass: 0,
      mvfCleanCount: 4,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 7,
      phaseOrientationPassCount: 2,
      mvOpeningDownwardCount: 5,
      conduitBelowReservoirChordCount: 3,
      phaseC1PassCount: 0,
      primeWaveformPassCount: 0,
      maxTractionPressureMmHg: 19.283221,
      maxVLoopArea: 71.598793,
      maxPostOpeningPressureDropMmHg: 4.125828,
      maxConduitBelowReservoirChordFraction: 0.7,
      maxPvTangentAngleJumpDeg: 166.235043,
      maxPrimeC1ContinuityScore: 1.101795,
    });
    expect(report.rawReference.phaseOrientationPassCount).toBeLessThan(report.rawReference.opposedLobeCount);
    expect(report.rawReference.phaseC1PassCount).toBe(0);
  });

  it("rejects capacity-only work coordinate as sufficient v-loop ownership", () => {
    expect(report.summary).toMatchObject({
      totalProfiles: 7,
      rawSourceSurfacePass: 4,
      rawTopologyPass: 0,
      rawMvfCleanCount: 4,
      bestCoordinateVariantId: "capacity-coordinate-drive4-stiff2-damp06",
      bestCoordinateSourceSurfacePass: 3,
      bestCoordinateTopologyPass: 0,
      bestCoordinateMvfCleanCount: 4,
      bestForceBalanceVariantId: "force-balance-vel06-drive4-hyd002-cap28",
      bestForceBalanceSourceSurfacePass: 2,
      bestForceBalanceTopologyPass: 4,
      bestForceBalanceSourcePreservingTopologyPass: 2,
      bestForceBalanceMvfCleanCount: 3,
      bestReferenceVolumeVariantId: "reference-volume-cap40-drive8-hyd004-stiff3-damp08-vel06",
      bestReferenceVolumeSourceSurfacePass: 2,
      bestReferenceVolumeTopologyPass: 0,
      bestReferenceVolumeSourcePreservingTopologyPass: 0,
      bestReferenceVolumeMvfCleanCount: 2,
      bestWallWorkVariantId: "wall-work-cap32-drive4-hyd002-stiff1-damp04-vel08",
      bestWallWorkSourceSurfacePass: 1,
      bestWallWorkTopologyPass: 3,
      bestWallWorkSourcePreservingTopologyPass: 1,
      bestWallWorkMvfCleanCount: 2,
      coordinateVariantsImprovingRawSourceAndKeepingTopology: 0,
      coordinateVariantsWithZeroTractionPressure: 11,
      forceBalanceVariantCount: 13,
      referenceVolumeVariantCount: 5,
      wallWorkVariantCount: 5,
      reviewStatus: "coordinate-contract-mixed",
    });
    expect(report.bestCoordinateVariant.maxTractionPressureMmHg).toBe(0);
    expect(report.bestCoordinateVariant.opposedLobeCount).toBe(0);
    expect(report.bestCoordinateVariant.phaseOrientationPassCount).toBe(2);
    expect(report.bestCoordinateVariant.maxZNorm).toBeGreaterThan(0);
    expect(report.bestCoordinateVariant.maxDriveForceN).toBeGreaterThan(0);
  });

  it("keeps explicit force-balance coordinate as partial evidence only", () => {
    expect(report.bestForceBalanceVariant).toMatchObject({
      variantId: "force-balance-vel06-drive4-hyd002-cap28",
      sourceSurfacePass: 2,
      topologyPass: 4,
      sourcePreservingTopologyPass: 2,
      mvfCleanCount: 3,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 7,
      phaseOrientationPassCount: 4,
      conduitBelowReservoirChordCount: 6,
      phaseC1PassCount: 5,
      primeWaveformPassCount: 0,
    });
    expect(report.bestForceBalanceVariant.maxHydraulicForceN).toBeGreaterThan(0);
    expect(report.bestForceBalanceVariant.maxNetForceN).toBeGreaterThan(0);
    expect(report.bestForceBalanceVariant.topologyPass).toBeGreaterThan(report.rawReference.topologyPass);
    expect(report.bestForceBalanceVariant.sourceSurfacePass).toBeLessThan(report.rawReference.sourceSurfacePass);
    expect(report.bestForceBalanceVariant.primeWaveformPassCount).toBe(0);
  });

  it("rejects reference-volume coordinate as sufficient v-loop ownership", () => {
    expect(report.bestReferenceVolumeVariant).toMatchObject({
      variantId: "reference-volume-cap40-drive8-hyd004-stiff3-damp08-vel06",
      sourceSurfacePass: 2,
      topologyPass: 0,
      sourcePreservingTopologyPass: 0,
      mvfCleanCount: 2,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 0,
      phaseOrientationPassCount: 1,
      conduitBelowReservoirChordCount: 1,
      phaseC1PassCount: 2,
      primeWaveformPassCount: 4,
      maxTractionPressureMmHg: 0,
    });
    expect(report.bestReferenceVolumeVariant.maxZNorm).toBeGreaterThan(0);
    expect(report.bestReferenceVolumeVariant.maxHydraulicForceN).toBeGreaterThan(0);
    expect(report.bestReferenceVolumeVariant.topologyPass).toBe(0);
    expect(report.bestReferenceVolumeVariant.sourceSurfacePass).toBeLessThan(report.rawReference.sourceSurfacePass);
  });

  it("keeps target-spring wall-work residual as partial topology evidence only", () => {
    expect(report.bestWallWorkVariant).toMatchObject({
      variantId: "wall-work-cap32-drive4-hyd002-stiff1-damp04-vel08",
      sourceSurfacePass: 1,
      topologyPass: 3,
      sourcePreservingTopologyPass: 1,
      mvfCleanCount: 2,
      hiddenVolumeCleanCount: 7,
      opposedLobeCount: 7,
      phaseOrientationPassCount: 3,
      conduitBelowReservoirChordCount: 3,
      phaseC1PassCount: 5,
      primeWaveformPassCount: 7,
    });
    expect(report.bestWallWorkVariant.maxHydraulicForceN).toBeGreaterThan(0);
    expect(report.bestWallWorkVariant.maxNetForceN).toBeGreaterThan(0);
    expect(report.bestWallWorkVariant.topologyPass).toBeLessThan(report.bestForceBalanceVariant.topologyPass);
    expect(report.bestWallWorkVariant.topologyPass).toBeGreaterThan(report.rawReference.topologyPass);
    expect(report.bestWallWorkVariant.sourceSurfacePass).toBeLessThan(report.rawReference.sourceSurfacePass);
    expect(report.bestWallWorkVariant.primeWaveformPassCount).toBe(7);
  });

  it("keeps hidden-volume cleanliness while keeping AV-plane promotion blocked", () => {
    expect(report.bestCoordinateVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.bestForceBalanceVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.bestReferenceVolumeVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.bestWallWorkVariant.hiddenVolumeCleanCount).toBe(7);
    expect(report.decision.nextAction).toContain("MV-opening phase-orientation gate");
    expect(report.decision.nextAction).toContain("source-preserving phase-oriented AV-plane/MV/venous-flow");
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
