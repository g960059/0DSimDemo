import { describe, expect, it } from "vitest";

import {
  FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1,
  runFullLeftAVPlaneResidualRoutingBenchV1,
} from "@/engine/mechanics2/benches/FullLeftAVPlaneResidualRoutingBench";

describe("FullLeftAVPlaneResidualRoutingBenchV1", () => {
  const report = runFullLeftAVPlaneResidualRoutingBenchV1();

  it("records a full-left LA-AV-plane residual routing report", () => {
    expect(report.reportId).toBe(FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1);
    expect(report.mode).toBe("full-left-heart-la-avplane-mv-pv-routing-no-runtime");
    expect(report.rows).toHaveLength(273);
    expect(report.variantSummaries).toHaveLength(39);
  });

  it("finds a source-preserving phase-oriented signal only after full-left residual ownership is added", () => {
    expect(report.summary.bestFullResidualVariantId).toBe("full-residual-forcebalance-fixed6-pv36-mvsoft");
    expect(report.summary.bestFullResidualSourcePreservingPhasePv).toBe(3);
    expect(report.summary.bestFullResidualPhaseOrientedPvPass).toBe(4);
    expect(report.summary.bestFullResidualSourceSurfacePass).toBe(4);

    const raw = report.variantSummaries.find((summary) => summary.variantId === "raw-traction-reference");
    const force = report.variantSummaries.find((summary) =>
      summary.variantId === "force-balance-cap32-drive6-hyd004-fast"
    );
    expect(raw?.sourcePreservingPhasePv).toBe(0);
    expect(raw?.phaseOrientedPvPass).toBe(0);
    expect(force?.sourcePreservingPhasePv).toBe(0);
    expect(force?.phaseOrientedPvPass).toBe(2);
  });

  it("keeps the positive signal bounded by prime and residual failures", () => {
    const bestRows = report.rows.filter((row) => row.variantId === report.summary.bestFullResidualVariantId);
    expect(bestRows.filter((row) => row.sourcePreservingPhasePv).map((row) => row.profileId)).toEqual([
      "normal-hr90",
      "preload-high",
      "afterload-high",
    ]);
    expect(bestRows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(bestRows.every((row) => !row.primeWaveformPass)).toBe(true);
    expect(report.summary.reviewStatus).toBe("full-left-avp-residual-positive-signal");
  });

  it("shows state-velocity readback alone does not fix the prime waveform", () => {
    const force = report.variantSummaries.find((summary) =>
      summary.variantId === "full-residual-forcebalance-fixed6-pv36-mvsoft"
    );
    const readbackForce = report.variantSummaries.find((summary) =>
      summary.variantId === "state-velocity-force-fixed6-pv36-mvsoft"
    );
    const readbackWall = report.variantSummaries.find((summary) =>
      summary.variantId === "state-velocity-wall-fixed6-pv36-mvsoft"
    );
    expect(readbackForce?.sourcePreservingPhasePv).toBe(force?.sourcePreservingPhasePv);
    expect(readbackForce?.phaseOrientedPvPass).toBe(force?.phaseOrientedPvPass);
    expect(readbackForce?.primeWaveformPass).toBe(0);
    expect(readbackWall?.primeWaveformPass).toBe(3);
  });

  it("rejects smooth AV-plane velocity core as a topology-preserving fix by itself", () => {
    const smoothForce = report.variantSummaries.find((summary) =>
      summary.variantId === "smooth-core-force-fixed6-pv36-mvsoft"
    );
    const smoothWall = report.variantSummaries.find((summary) =>
      summary.variantId === "smooth-core-wall-fixed6-pv36-mvsoft"
    );
    expect(smoothForce?.primeWaveformPass).toBe(0);
    expect(smoothForce?.phaseOrientedPvPass).toBe(0);
    expect(smoothForce?.sourcePreservingPhasePv).toBe(0);
    expect(smoothWall?.primeWaveformPass).toBe(0);
    expect(smoothWall?.phaseOrientedPvPass).toBe(0);
    expect(smoothWall?.sourcePreservingPhasePv).toBe(0);
  });

  it("shows V2 coordinate residual ownership preserves the best route but does not fix prime by itself", () => {
    const v2Force = report.variantSummaries.find((summary) =>
      summary.variantId === "v2-force-fixed8-pv36-mvsoft"
    );
    const v2Wall = report.variantSummaries.find((summary) =>
      summary.variantId === "v2-wall-fixed8-pv36-mvsoft"
    );
    expect(report.summary.bestOverallVariantId).toBe("v2-force-fixed8-pv36-mvsoft");
    expect(report.summary.bestV2SourcePreservingPhasePv).toBe(3);
    expect(report.summary.bestV2PhaseOrientedPvPass).toBe(4);
    expect(report.summary.bestV2SourceSurfacePass).toBe(4);
    expect(v2Force?.primeWaveformPass).toBe(0);
    expect(v2Wall?.primeWaveformPass).toBeGreaterThanOrEqual(5);
    expect(v2Wall?.sourcePreservingPhasePv).toBeLessThan(3);
  });

  it("shows V3 MV loss can smooth prime only by trading away source-preserving phase", () => {
    const v3Wall = report.variantSummaries.find((summary) =>
      summary.variantId === "v3-wall-fixed8-pv36-mvloss"
    );
    expect(report.summary.bestV3VariantId).toBe("v3-wall-fixed8-pv36-mvloss");
    expect(report.summary.bestV3PrimeWaveformPass).toBe(7);
    expect(report.summary.bestV3SourcePreservingPhasePv).toBe(2);
    expect(report.summary.bestV3SourcePreservingPhasePv).toBeLessThan(report.summary.bestV2SourcePreservingPhasePv);
    expect(v3Wall?.hiddenVolumeClean).toBe(7);
  });

  it("rejects simple hybrid velocity-target residuals as source-preserving phase fixes", () => {
    const v4Force = report.variantSummaries.find((summary) =>
      summary.variantId === "v4-force-veltarget-fixed8-pv36-mvsoft"
    );
    expect(report.summary.bestV4VariantId).toBe("v4-wall-veltarget-fixed8-pv36-mvsoft");
    expect(report.summary.bestV4SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV4PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV4PrimeWaveformPass).toBe(3);
    expect(v4Force?.hiddenVolumeClean).toBe(7);
    expect(v4Force?.sourcePreservingPhasePv).toBe(0);
  });

  it("rejects phase-owned target residuals as a substitute for true same-step ownership", () => {
    const v5Force = report.variantSummaries.find((summary) =>
      summary.variantId === "v5-force-phaseowned-fixed8-pv36-mvsoft"
    );
    expect(report.summary.bestV5VariantId).toBe("v5-wall-phaseowned-fixed8-pv36-mvsoft");
    expect(report.summary.bestV5SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV5PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV5SourceSurfacePass).toBe(0);
    expect(report.summary.bestV5MvfClean).toBe(3);
    expect(report.summary.bestV5PrimeWaveformPass).toBe(3);
    expect(v5Force?.hiddenVolumeClean).toBe(7);
    expect(v5Force?.sourceSurfacePass).toBe(0);
  });

  it("keeps V6 reference-capacity evidence bounded by phase and C1 failures", () => {
    const v6Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v6-force-refcap-vel06-fixed10-pv44-mvsoft"
    );
    const v6Fixed = report.variantSummaries.find((summary) =>
      summary.variantId === "v6-force-refcap-fixed8-pv36-mvsoft"
    );
    const v7Wall = report.variantSummaries.find((summary) =>
      summary.variantId === "v7-force-refwall-vel06-fixed10-pv44-mvsoft"
    );
    expect(report.summary.bestV6VariantId).toBe("v6-force-refcap-vel06-fixed10-pv44-mvsoft");
    expect(report.summary.bestV6SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV6PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV6SourceSurfacePass).toBe(6);
    expect(report.summary.bestV6MvfClean).toBe(6);
    expect(report.summary.bestV6PrimeWaveformPass).toBe(2);
    expect(v6Best?.hiddenVolumeClean).toBe(7);
    expect(v6Best?.maxSystolicXDescentPressureDropMmHg).toBeGreaterThan(3);
    expect(v6Best?.maxSystolicReservoirVolumeRiseMl).toBeGreaterThan(30);
    expect(v6Best?.maxPvTangentAngleJumpDeg).toBeGreaterThan(170);
    expect(v6Fixed?.sourceSurfacePass).toBe(6);
    expect(v6Fixed?.mvfClean).toBe(6);
    expect(v7Wall?.sourceSurfacePass).toBe(6);
    expect(v7Wall?.sourcePreservingPhasePv).toBe(0);
    expect(v7Wall?.maxVLoopArea).toBeLessThan(v6Best!.maxVLoopArea);
    expect(v7Wall?.primeWaveformPass).toBeLessThan(v6Best!.primeWaveformPass);
  });

  it("keeps runtime and atrial enablement claims blocked", () => {
    expect(report.claimBoundary.runtimeWiring).toBe(false);
    expect(report.claimBoundary.morphologyAcceptance).toBe(false);
    expect(report.claimBoundary.AVPlaneEnablement).toBe(false);
    expect(report.claimBoundary.pressureSubstitution).toBe(false);
    expect(report.claimBoundary.LandAtrialUnlock).toBe(false);
    expect(report.decision.blockedClaims).toContain("runtime-wiring");
    expect(report.decision.blockedClaims).toContain("morphology-acceptance");
    expect(report.decision.blockedClaims).toContain("AV-plane-enable");
    expect(report.decision.blockedClaims).toContain("LandAtrial-unlock");
  });
});
