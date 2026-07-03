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
    expect(report.rows).toHaveLength(700);
    expect(report.variantSummaries).toHaveLength(100);
  });

  it("rejects the earlier full-left residual signal once reservoir bowing quality is required", () => {
    expect(report.summary.bestFullResidualVariantId).toBe("full-residual-forcebalance-fixed6-pv36-mvsoft");
    expect(report.summary.bestFullResidualSourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestFullResidualPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestFullResidualSourceSurfacePass).toBe(4);

    const raw = report.variantSummaries.find((summary) => summary.variantId === "raw-traction-reference");
    const force = report.variantSummaries.find((summary) =>
      summary.variantId === "force-balance-cap32-drive6-hyd004-fast"
    );
    expect(raw?.sourcePreservingPhasePv).toBe(0);
    expect(raw?.phaseOrientedPvPass).toBe(0);
    expect(force?.sourcePreservingPhasePv).toBe(0);
    expect(force?.phaseOrientedPvPass).toBe(0);
  });

  it("routes all current full residual rows to the next reservoir-conduit hysteresis owner", () => {
    const bestRows = report.rows.filter((row) => row.variantId === report.summary.bestFullResidualVariantId);
    expect(bestRows.filter((row) => row.sourcePreservingPhasePv).map((row) => row.profileId)).toEqual([]);
    expect(bestRows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(bestRows.every((row) => row.phasePv.failureReasons.includes("reservoir-limb-not-bowed"))).toBe(true);
    expect(report.summary.reviewStatus).toBe("full-left-avp-residual-mixed");
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

  it("shows V2 coordinate residual ownership still lacks reservoir-conduit hysteresis quality", () => {
    const v2Force = report.variantSummaries.find((summary) =>
      summary.variantId === "v2-force-fixed8-pv36-mvsoft"
    );
    const v2Wall = report.variantSummaries.find((summary) =>
      summary.variantId === "v2-wall-fixed8-pv36-mvsoft"
    );
    expect(report.summary.bestOverallVariantId).toBe("v2-force-fixed10-pv44-mvsoft");
    expect(report.summary.bestV2SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV2PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV2SourceSurfacePass).toBe(4);
    expect(v2Force?.primeWaveformPass).toBe(0);
    expect(v2Wall?.primeWaveformPass).toBeGreaterThanOrEqual(5);
    expect(v2Wall?.sourcePreservingPhasePv).toBe(0);
  });

  it("shows V3 MV loss can smooth prime only by trading away source-preserving phase", () => {
    const v3Wall = report.variantSummaries.find((summary) =>
      summary.variantId === "v3-wall-fixed8-pv36-mvloss"
    );
    expect(report.summary.bestV3VariantId).toBe("v3-wall-fixed8-pv36-mvloss");
    expect(report.summary.bestV3PrimeWaveformPass).toBe(7);
    expect(report.summary.bestV3SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV3SourcePreservingPhasePv).toBeLessThanOrEqual(
      report.summary.bestV2SourcePreservingPhasePv,
    );
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

  it("keeps V6 reference-capacity evidence bounded by blood-quality failures", () => {
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

  it("rejects reference-capacity venous routing once blood x-descent and MV-opening transition quality are required", () => {
    const v8Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v8-force-refcap-venous-fixed8-pv36-mvloss"
    );
    const v8Rows = report.rows.filter((row) => row.family === "full-left-reference-capacity-venous-residual-v8");
    expect(report.summary.bestV8VariantId).toBe("v8-force-refcap-venous-fixed8-pv36-mvloss");
    expect(report.summary.bestV8SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV8PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV8SourceSurfacePass).toBe(6);
    expect(report.summary.bestV8MvfClean).toBe(6);
    expect(report.summary.bestV8PrimeWaveformPass).toBe(0);
    expect(report.summary.bestV8CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV8SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.variantsWithAnySourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(v8Best?.hiddenVolumeClean).toBe(7);
    expect(v8Best?.maxVLoopArea).toBeGreaterThan(70);
    expect(v8Best?.maxCapacityAxisVLoopArea).toBeGreaterThan(65);
    expect(v8Best?.maxReferenceCapacityShiftMl).toBeGreaterThan(10);
    expect(v8Best?.maxEffectiveCavityCapacityMl).toBeGreaterThan(10);
    expect(v8Best?.maxPressureReferenceCapacityMl).toBe(0);
    expect(v8Best?.maxCounterfactualFixedBloodPressureReliefMmHg).toBeGreaterThan(2);
    expect(v8Best?.maxAppliedFixedBloodPressureReliefMmHg).toBe(0);
    expect(v8Best?.maxBloodXDescentPressureDropMmHg).toBeGreaterThan(2);
    expect(v8Best?.phaseOrientedPvPass).toBe(0);
    expect(v8Rows.every((row) => row.qAvPlaneKinematicForwardVolumeMl > 10)).toBe(true);
    expect(v8Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v8Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
  });

  it("keeps dynamic reference pressure as pressure-relief evidence without passing blood-quality morphology", () => {
    const v9Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v9-force-dynref-fixed8-pv36-mvloss"
    );
    const v9Rows = report.rows.filter((row) =>
      row.family === "full-left-dynamic-reference-pressure-residual-v9"
    );
    expect(report.summary.bestV9VariantId).toBe("v9-force-dynref-fixed8-pv36-mvloss");
    expect(report.summary.bestV9SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV9PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV9SourceSurfacePass).toBe(6);
    expect(report.summary.bestV9MvfClean).toBe(6);
    expect(report.summary.bestV9PrimeWaveformPass).toBe(0);
    expect(report.summary.bestV9CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV9SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.bestV9MaxCounterfactualFixedBloodPressureReliefMmHg).toBeGreaterThan(2);
    expect(report.summary.bestV9MaxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(2);
    expect(report.summary.bestV9MaxAppliedFixedBloodPressureReliefMmHg)
      .toBe(report.summary.bestV9MaxCounterfactualFixedBloodPressureReliefMmHg);
    expect(report.summary.bestV9MaxReferenceCapacityShiftMl).toBeGreaterThan(10);
    expect(report.summary.bestV9MaxPressureReferenceCapacityMl).toBe(report.summary.bestV9MaxReferenceCapacityShiftMl);
    expect(report.summary.bestV9MaxEffectiveCavityCapacityMl).toBe(report.summary.bestV9MaxReferenceCapacityShiftMl);
    expect(report.summary.bestV9MaxBloodXDescentPressureDropMmHg).toBeGreaterThan(2);
    expect(report.summary.variantsWithAnyAppliedFixedBloodPressureRelief).toBe(56);
    expect(v9Best?.hiddenVolumeClean).toBe(7);
    expect(v9Best?.maxVLoopArea).toBeGreaterThan(70);
    expect(v9Best?.maxCapacityAxisVLoopArea).toBeGreaterThan(65);
    expect(v9Best?.maxReferenceCapacityShiftMl).toBeGreaterThan(10);
    expect(v9Best?.maxPressureReferenceCapacityMl).toBe(v9Best?.maxReferenceCapacityShiftMl);
    expect(v9Best?.maxEffectiveCavityCapacityMl).toBe(v9Best?.maxReferenceCapacityShiftMl);
    expect(v9Best?.maxCounterfactualFixedBloodPressureReliefMmHg).toBeGreaterThan(2);
    expect(v9Best?.maxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(2);
    expect(v9Best?.maxBloodXDescentPressureDropMmHg).toBeGreaterThan(2);
    expect(v9Best?.phaseOrientedPvPass).toBe(0);
    expect(v9Rows.every((row) => row.qAvPlaneKinematicForwardVolumeMl > 10)).toBe(true);
    expect(v9Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v9Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
  });

  it("rejects separated capacity residual ownership as a source-preserving effective-cavity V-loop fix", () => {
    const v10Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v10-force-separated-vel06-fixed10-pv44-mvsoft"
    );
    const v10Rows = report.rows.filter((row) =>
      row.family === "full-left-separated-capacity-residual-v10"
    );
    expect(report.summary.bestV10VariantId).toBe("v10-force-separated-vel06-fixed10-pv44-mvsoft");
    expect(report.summary.bestV10SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV10PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV10SourceSurfacePass).toBe(0);
    expect(report.summary.bestV10MvfClean).toBe(6);
    expect(report.summary.bestV10PrimeWaveformPass).toBe(2);
    expect(report.summary.bestV10CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV10SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.bestV10MaxPressureReferenceCapacityMl).toBeGreaterThan(10);
    expect(report.summary.bestV10MaxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(2);
    expect(report.summary.bestV10MaxAppliedFixedBloodPressureReliefMmHg)
      .toBe(report.summary.bestV10MaxCounterfactualFixedBloodPressureReliefMmHg);
    expect(report.summary.bestV10MaxBloodXDescentPressureDropMmHg).toBeGreaterThan(3);
    expect(v10Best?.hiddenVolumeClean).toBe(7);
    expect(v10Best?.maxPvTangentAngleJumpDeg).toBeGreaterThan(170);
    expect(v10Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v10Rows.every((row) => !row.sourcePreservingPhasePv)).toBe(true);
    expect(v10Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
  });

  it("rejects accepted-state LA wall/AV-plane/MV/PV residual ownership as a source-preserving effective-cavity V-loop fix", () => {
    const v11Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v11-force-accepted-late16-slowrel-fixed14-pv52-mvsoft"
    );
    const v11Rows = report.rows.filter((row) =>
      row.family === "full-left-accepted-state-residual-v11"
    );
    const v11Smooth = report.variantSummaries.find((summary) =>
      summary.variantId === "v11-force-accepted-mvsmooth-fixed14-pv52"
    );
    expect(report.summary.bestV11VariantId).toBe("v11-force-accepted-late16-slowrel-fixed14-pv52-mvsoft");
    expect(report.summary.bestV11SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV11PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV11SourceSurfacePass).toBe(0);
    expect(report.summary.bestV11MvfClean).toBe(6);
    expect(report.summary.bestV11PrimeWaveformPass).toBe(0);
    expect(report.summary.bestV11CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV11SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.bestV11MaxReferenceCapacityShiftMl).toBeGreaterThan(4);
    expect(report.summary.bestV11MaxPressureReferenceCapacityMl)
      .toBe(report.summary.bestV11MaxReferenceCapacityShiftMl);
    expect(report.summary.bestV11MaxEffectiveCavityCapacityMl)
      .toBe(report.summary.bestV11MaxReferenceCapacityShiftMl);
    expect(report.summary.bestV11MaxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(0.5);
    expect(report.summary.bestV11MaxBloodXDescentPressureDropMmHg).toBeGreaterThan(3);
    expect(v11Best?.hiddenVolumeClean).toBe(7);
    expect(v11Best?.maxPressureReferenceCapacityMl).toBeGreaterThan(4);
    expect(v11Best?.maxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(0.5);
    expect(v11Best?.capacityAxisPhaseOrientedPvPass).toBe(0);
    expect(v11Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v11Rows.every((row) => !row.sourcePreservingPhasePv)).toBe(true);
    expect(v11Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
    expect(v11Smooth?.primeWaveformPass).toBeGreaterThan(0);
    expect(v11Smooth?.sourceSurfacePass).toBe(0);
    expect(v11Smooth?.phaseOrientedPvPass).toBe(0);
  });

  it("keeps the effective-cavity pressure law signal shadow-only while improving physiologic pressure relief", () => {
    const v12Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v12-force-effcav-pr175-fixed8-pv36-mvloss"
    );
    const v12Prime04 = report.variantSummaries.find((summary) =>
      summary.variantId === "v12-wall-effcav-pr150-primevel04-fixed8-pv36-mvloss"
    );
    const v12Prime24 = report.variantSummaries.find((summary) =>
      summary.variantId === "v12-wall-effcav-pr150-primevel24-fixed8-pv36-mvloss"
    );
    const v12Rows = report.rows.filter((row) =>
      row.family === "full-left-effective-cavity-pressure-law-v12"
    );
    expect(report.summary.bestV12VariantId).toBe("v12-force-effcav-pr175-fixed8-pv36-mvloss");
    expect(report.summary.bestV12SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV12PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV12SourceSurfacePass).toBe(6);
    expect(report.summary.bestV12MvfClean).toBe(6);
    expect(report.summary.bestV12PrimeWaveformPass).toBe(0);
    expect(report.summary.bestV12CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV12SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.bestV12MaxReferenceCapacityShiftMl).toBeGreaterThan(16);
    expect(report.summary.bestV12MaxPressureReferenceCapacityMl).toBeGreaterThan(28);
    expect(report.summary.bestV12MaxEffectiveCavityCapacityMl).toBe(report.summary.bestV12MaxReferenceCapacityShiftMl);
    expect(report.summary.bestV12MaxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(3.5);
    expect(report.summary.bestV12MaxCounterfactualFixedBloodPressureReliefMmHg).toBeLessThan(
      report.summary.bestV12MaxAppliedFixedBloodPressureReliefMmHg,
    );
    expect(report.summary.bestV12MaxBloodXDescentPressureDropMmHg).toBeGreaterThan(2);
    expect(v12Best?.hiddenVolumeClean).toBe(7);
    expect(v12Best?.capacityAxisPhaseOrientedPvPass).toBe(0);
    expect(v12Best?.maxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(3.5);
    expect(v12Prime04?.sourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(v12Prime04?.primeWaveformPass).toBe(0);
    expect(v12Prime04?.maxPrimeC1ContinuityScore).toBeLessThan(v12Best!.maxPrimeC1ContinuityScore);
    expect(v12Prime24?.primeWaveformPass).toBe(0);
    expect(v12Prime24?.maxPrimeC1ContinuityScore).toBeGreaterThan(v12Prime04!.maxPrimeC1ContinuityScore);
    expect(v12Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v12Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
  });

  it("shows accepted-coordinate C1 limiting is only a partial prime/readback signal", () => {
    const v13Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v13-wall-effcav-c1accel08-pr150-fixed8-pv36-mvloss"
    );
    const v13PrimeBest = report.variantSummaries.find((summary) =>
      summary.variantId === "v13-wall-effcav-c1accel08-pr150-fixed8-pv36-mvloss"
    );
    const v12Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v12-wall-effcav-pr150-fixed8-pv36-mvloss"
    );
    const v13Rows = report.rows.filter((row) =>
      row.family === "full-left-c1-coordinate-pressure-law-v13"
    );
    expect(report.summary.bestV13VariantId).toBe("v13-wall-effcav-c1accel08-pr150-fixed8-pv36-mvloss");
    expect(report.summary.bestV13SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV13PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV13SourceSurfacePass).toBe(4);
    expect(report.summary.bestV13MvfClean).toBe(4);
    expect(report.summary.bestV13PrimeWaveformPass).toBe(2);
    expect(report.summary.bestV13CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV13SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.bestV13MaxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(1.5);
    expect(v13Best?.hiddenVolumeClean).toBe(7);
    expect(v13Best!.maxPrimeC1ContinuityScore).toBeGreaterThan(v12Best!.maxPrimeC1ContinuityScore);
    expect(v13PrimeBest?.primeWaveformPass).toBe(2);
    expect(v13PrimeBest?.sourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(v13Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v13Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
  });

  it("shows continuous trajectory law improves prime continuity without solving LA-MV coupling", () => {
    const v14Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v14-wall-effcav-traj20-pr150-fixed8-pv36-mvloss"
    );
    const v14SourceBest = report.variantSummaries.find((summary) =>
      summary.variantId === "v14-force-effcav-traj14-pr175-fixed10-pv44-mvloss"
    );
    const v13Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v13-wall-effcav-c1accel16-pr150-fixed8-pv36-mvloss"
    );
    const v14Rows = report.rows.filter((row) =>
      row.family === "full-left-continuous-trajectory-law-v14"
    );
    expect(report.summary.bestV14VariantId).toBe("v14-wall-effcav-traj20-pr150-fixed8-pv36-mvloss");
    expect(report.summary.bestV14SourceSurfacePass).toBe(5);
    expect(report.summary.bestV14MvfClean).toBe(5);
    expect(report.summary.bestV14PrimeWaveformPass).toBe(6);
    expect(report.summary.bestV14CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV14SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.bestV14PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV14MaxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(2.7);
    expect(v14Best?.hiddenVolumeClean).toBe(7);
    expect(v14Best!.maxPrimeC1ContinuityScore).toBeLessThan(v13Best!.maxPrimeC1ContinuityScore);
    expect(v14SourceBest?.sourceSurfacePass).toBe(6);
    expect(v14SourceBest?.mvfClean).toBe(6);
    expect(v14SourceBest?.primeWaveformPass).toBe(0);
    expect(v14Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v14Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
  });

  it("rejects accepted-output MV target residuals as sufficient LA-MV trajectory ownership", () => {
    const v15Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v15-wall-effcav-traj20-mvtarget05-pr150-fixed8-pv36-mvloss"
    );
    const v15StrongTarget = report.variantSummaries.find((summary) =>
      summary.variantId === "v15-wall-effcav-traj20-mvtarget10-pr150-fixed8-pv36-mvloss"
    );
    const v15SourceBest = report.variantSummaries.find((summary) =>
      summary.variantId === "v15-force-effcav-traj14-mvtarget10-pr175-fixed10-pv44-mvloss"
    );
    const v14Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v14-wall-effcav-traj20-pr150-fixed8-pv36-mvloss"
    );
    const v14SourceBest = report.variantSummaries.find((summary) =>
      summary.variantId === "v14-force-effcav-traj14-pr175-fixed10-pv44-mvloss"
    );
    const v15Rows = report.rows.filter((row) =>
      row.family === "full-left-continuous-mv-coupled-law-v15"
    );
    expect(report.summary.bestV15VariantId)
      .toBe("v15-wall-effcav-traj20-mvtarget05-pr150-fixed8-pv36-mvloss");
    expect(report.summary.bestV15SourceSurfacePass).toBe(report.summary.bestV14SourceSurfacePass);
    expect(report.summary.bestV15MvfClean).toBe(report.summary.bestV14MvfClean);
    expect(report.summary.bestV15PrimeWaveformPass).toBe(report.summary.bestV14PrimeWaveformPass);
    expect(report.summary.bestV15CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV15SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.bestV15PhaseOrientedPvPass).toBe(0);
    expect(v15Best?.hiddenVolumeClean).toBe(7);
    expect(v15Best?.maxPrimeC1ContinuityScore).toBe(v14Best?.maxPrimeC1ContinuityScore);
    expect(v15StrongTarget?.sourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(v15SourceBest?.sourceSurfacePass).toBe(v14SourceBest?.sourceSurfacePass);
    expect(v15SourceBest?.mvfClean).toBe(v14SourceBest?.mvfClean);
    expect(v15SourceBest?.primeWaveformPass).toBe(0);
    expect(v15Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v15Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
  });

  it("rejects implicit MV candidate state as sufficient without a stronger LA-MV solve", () => {
    const v16Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss"
    );
    const v16StrongWall = report.variantSummaries.find((summary) =>
      summary.variantId === "v16-wall-effcav-traj20-mvimplicit10-pr150-fixed8-pv36-mvloss"
    );
    const v16Force = report.variantSummaries.find((summary) =>
      summary.variantId === "v16-force-effcav-traj14-mvimplicit02-pr175-fixed10-pv44-mvloss"
    );
    const v15Best = report.variantSummaries.find((summary) =>
      summary.variantId === "v15-wall-effcav-traj20-mvtarget05-pr150-fixed8-pv36-mvloss"
    );
    const v16Rows = report.rows.filter((row) =>
      row.family === "full-left-implicit-mv-state-trajectory-law-v16"
    );
    expect(report.summary.bestV16VariantId)
      .toBe("v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss");
    expect(report.summary.bestV16SourceSurfacePass).toBe(report.summary.bestV15SourceSurfacePass);
    expect(report.summary.bestV16MvfClean).toBe(report.summary.bestV15MvfClean);
    expect(report.summary.bestV16PrimeWaveformPass).toBe(report.summary.bestV15PrimeWaveformPass);
    expect(report.summary.bestV16CapacityAxisPhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV16SourcePreservingCapacityAxisPhasePv).toBe(0);
    expect(report.summary.bestV16PhaseOrientedPvPass).toBe(0);
    expect(v16Best?.hiddenVolumeClean).toBe(7);
    expect(v16Best?.maxPrimeC1ContinuityScore).toBeLessThan(v15Best!.maxPrimeC1ContinuityScore);
    expect(v16StrongWall?.sourceSurfacePass).toBeLessThan(v16Best!.sourceSurfacePass);
    expect(v16Force?.primeWaveformPass).toBe(0);
    expect(v16Rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(v16Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
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
