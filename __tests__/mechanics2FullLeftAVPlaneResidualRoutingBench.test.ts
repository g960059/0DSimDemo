import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1,
  runFullLeftAVPlaneResidualRoutingBenchV1,
} from "@/engine/mechanics2/benches/FullLeftAVPlaneResidualRoutingBench";

describe("FullLeftAVPlaneResidualRoutingBenchV1", () => {
  const report = runFullLeftAVPlaneResidualRoutingBenchV1();

  const summaryFor = (variantId: string) => {
    const summary = report.variantSummaries.find((row) => row.variantId === variantId);
    expect(summary).toBeDefined();
    return summary!;
  };

  const rowsFor = (variantId: string) => report.rows.filter((row) => row.variantId === variantId);

  it("can run a normal-HR75-only fast loop for visual research", () => {
	  const normalReport = runFullLeftAVPlaneResidualRoutingBenchV1({ profileIds: ["normal-hr75"] });
	  const normalRows = normalReport.rows.filter((row) => row.profileId === "normal-hr75");
	  const visualCandidates = normalRows.filter((row) =>
	    [
	      "full-left-v16-area-receiver-hysteresis-v23",
	      "full-left-v16-receiver-state-hysteresis-v24",
	      "full-left-v16-lvreceiver-capacity-hysteresis-v25",
	      "full-left-v16-phase-locked-avplane-hysteresis-v26",
	      "full-left-normal-first-large-vloop-hysteresis-v27",
	      "full-left-normal-first-wall-viscoelastic-hysteresis-v28",
	      "full-left-normal-first-path-state-hysteresis-v29",
	      "full-left-normal-first-conduit-cup-hysteresis-v30",
	      "full-left-normal-first-capacity-path-hysteresis-v31",
	      "full-left-normal-first-lv-reference-receiver-v32",
	    ].includes(row.family)
	    && row.sourceSurfacePass
	    && row.mvfClean
	    && row.phaseOrientedPvPass
	    && row.hiddenVolumeClean
	    && row.phasePv.vLoopArea >= 40
	    && row.phasePv.postOpeningEarlyPressureDropMmHg > 1.0
	    && row.phasePv.postOpeningEarlyVolumeDropMl > 0.8
	    && !row.phasePv.failureReasons.includes("mv-opening-starts-upward")
	    && !row.phasePv.failureReasons.includes("mv-opening-conduit-start-not-downstroke")
	  );

	  expect(normalReport.summary.totalProfiles).toBe(1);
	  expect(normalReport.rows).toHaveLength(270);
	  expect(normalReport.summary.bestOverallVariantId).toBe("v2-force-fixed8-pv36-mvsoft");
	  expect(normalReport.summary.bestOverallSourcePreservingPhasePv).toBe(1);
	  expect(visualCandidates.map((row) => row.variantId)).toContain(
	    "v28-wall-v16visco3-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
	  );
	  expect(visualCandidates.map((row) => row.variantId)).toContain(
	    "v28-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
	  );
	  const bestV28VisualArea = Math.max(
	    ...visualCandidates
	      .filter((row) => row.family === "full-left-normal-first-wall-viscoelastic-hysteresis-v28")
	      .map((row) => row.phasePv.vLoopArea),
	  );
	  const bestV29Visual = visualCandidates
	    .filter((row) => row.family === "full-left-normal-first-path-state-hysteresis-v29")
	    .sort((a, b) => b.phasePv.vLoopArea - a.phasePv.vLoopArea)[0];
	  expect(bestV29Visual?.variantId).toBe(
	    "v29-wall-v16pathmem75-relief16-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
	  );
	  expect(bestV29Visual!.phasePv.vLoopArea).toBeGreaterThan(bestV28VisualArea);
	  const bestV31Visual = visualCandidates
	    .filter((row) => row.family === "full-left-normal-first-capacity-path-hysteresis-v31")
	    .sort((a, b) => b.phasePv.vLoopArea - a.phasePv.vLoopArea)[0];
	  expect(bestV31Visual?.variantId).toBe(
	    "v31-wall-v16cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  );
	  expect(bestV31Visual!.phasePv.vLoopArea).toBeGreaterThan(bestV29Visual!.phasePv.vLoopArea);
	  expect(bestV31Visual!.phasePv.vLoopArea).toBeGreaterThan(55);
	  expect(bestV31Visual!.mvForwardPeakCount).toBe(2);
	  const v32Visual = visualCandidates.find((row) =>
	    row.variantId ===
	    "v32-wall-v16lvref56-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv16-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite"
	  );
	  expect(v32Visual).toBeDefined();
	  expect(v32Visual!.phasePv.vLoopArea).toBeGreaterThan(bestV31Visual!.phasePv.vLoopArea);
	  expect(v32Visual!.phasePv.vLoopArea).toBeGreaterThan(70);
	  expect(v32Visual!.phasePv.postOpeningEarlyPressureDropMmHg).toBeGreaterThan(4);
	  expect(v32Visual!.phasePv.postOpeningEarlyVolumeDropMl).toBeGreaterThan(10);
	  expect(v32Visual!.maxLvReceiverReferenceVolumeShiftMl).toBeGreaterThan(10);
	  expect(v32Visual!.mvForwardPeakCount).toBe(2);
	  const bestReceiverVisual = visualCandidates
	    .filter((row) => row.family === "full-left-normal-first-lv-reference-receiver-v32")
	    .sort((a, b) => b.phasePv.vLoopArea - a.phasePv.vLoopArea)[0];
	  expect(bestReceiverVisual?.variantId).toBe(
	    "v33-wall-v16lvref56-cap150-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
	  );
	  expect(bestReceiverVisual!.phasePv.vLoopArea).toBeGreaterThan(110);
	  expect(bestReceiverVisual!.phasePv.meanReservoirConduitSeparationMmHg).toBeGreaterThan(4);
	  expect(bestReceiverVisual!.phasePv.conduitBellyDepthMmHg).toBeGreaterThan(1.2);
	  expect(bestReceiverVisual!.phasePv.postOpeningEarlyPressureDropMmHg).toBeGreaterThan(5);
	  expect(bestReceiverVisual!.phasePv.postOpeningEarlyVolumeDropMl).toBeGreaterThan(9);
	  expect(bestReceiverVisual!.mvForwardPeakCount).toBe(2);
	  const bestV36Visual = visualCandidates
	    .filter((row) => row.variantId.startsWith("v36-"))
	    .sort((a, b) => b.phasePv.vLoopArea - a.phasePv.vLoopArea)[0];
	  expect(bestV36Visual?.variantId).toBe(
	    "v36-wall-v16lvref48-cap150-visco6-pathmem90-relief45-cupwide-lvrcup04-phaselock04-lvrecv8-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
	  );
	  expect(bestV36Visual!.phasePv.vLoopArea).toBeGreaterThan(90);
	  expect(bestV36Visual!.phasePv.vLoopArea).toBeLessThan(bestReceiverVisual!.phasePv.vLoopArea);
	  expect(bestV36Visual!.phasePv.conduitBellyDepthMmHg).toBeGreaterThan(1.2);
	  expect(bestV36Visual!.mvForwardPeakCount).toBe(2);
	  const v37Rows = normalRows.filter((row) => row.variantId.startsWith("v37-"));
	  const deepestV37 = [...v37Rows].sort((a, b) =>
	    b.phasePv.conduitBellyDepthMmHg - a.phasePv.conduitBellyDepthMmHg
	  )[0];
	  expect(v37Rows).toHaveLength(6);
	  expect(v37Rows.every((row) =>
	    !(row.sourceSurfacePass && row.mvfClean && row.phaseOrientedPvPass && row.hiddenVolumeClean
	      && row.failureReasons.length === 0)
	  )).toBe(true);
	  expect(deepestV37!.phasePv.conduitBellyDepthMmHg).toBeGreaterThan(4);
	  expect(deepestV37!.mvForwardPeakCount).toBe(1);
	  expect(deepestV37!.phasePv.failureReasons).toContain("a-loop-area-too-small");
	  const v38Rows = normalRows.filter((row) => row.variantId.startsWith("v38-"));
	  const bestV38Area = [...v38Rows].sort((a, b) => b.phasePv.vLoopArea - a.phasePv.vLoopArea)[0];
	  expect(v38Rows).toHaveLength(4);
	  expect(v38Rows.some((row) => row.sourceSurfacePass && row.mvfClean)).toBe(true);
	  expect(v38Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
	  expect(bestV38Area!.phasePv.vLoopArea).toBeGreaterThan(90);
	  expect(bestV38Area!.phasePv.conduitBellyDepthMmHg).toBeLessThan(1.5);
	  expect(bestV38Area!.phasePv.failureReasons).toContain("a-loop-area-too-small");
	  expect(visualCandidates.every((row) => row.phasePv.vLoopArea >= 40)).toBe(true);
	  expect(visualCandidates.every((row) => row.phasePv.postOpeningEarlyPressureDropMmHg > 1.0)).toBe(true);
	  expect(visualCandidates.every((row) => row.phasePv.postOpeningEarlyVolumeDropMl > 0.8)).toBe(true);
	});

  it("records the full-left LA-AV-plane residual routing experiment", () => {
    expect(report.reportId).toBe(FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1);
    expect(report.mode).toBe("full-left-heart-la-avplane-mv-pv-routing-no-runtime");
	  expect(report.rows).toHaveLength(1890);
	  expect(report.variantSummaries).toHaveLength(270);
	  expect(new Set(report.rows.map((row) => row.family)).size).toBe(40);
  });

  it("keeps x-descent depth and signed-lobe orientation as readbacks instead of hard failures", () => {
    const allReasons = report.rows.flatMap((row) => row.phasePv.failureReasons);

    expect(allReasons).not.toContain("missing-systolic-x-descent-reservoir");
    expect(allReasons).not.toContain("a-v-lobes-not-opposed");
    expect(allReasons).not.toContain("pv-global-fold-kink");
    expect(allReasons).toContain("v-loop-area-too-small");
    expect(allReasons).toContain("mv-opening-conduit-start-not-downstroke");
    expect(allReasons).toContain("mv-opening-transition-not-clean");

    expect(report.rows.every((row) => row.hiddenVolumeClean)).toBe(true);
    expect(report.rows.some((row) => row.phaseOrientedPvPass)).toBe(true);
    expect(report.rows.some((row) => row.sourcePreservingPhasePv)).toBe(true);
  });

  it("keeps the blood V-loop area threshold permissive enough for emerging loops", () => {
    const v20Rows = rowsFor(report.summary.bestV20VariantId);
    const preloadLow = v20Rows.find((row) => row.profileId === "preload-low");
    expect(preloadLow).toBeDefined();
    expect(preloadLow!.phasePv.vLoopArea).toBeLessThan(55);
    expect(preloadLow!.phasePv.bloodVLoopAreaPass).toBe(true);
    expect(preloadLow!.phaseOrientedPvPass).toBe(true);
  });

  it("preserves the bounded legacy full-residual signal while keeping source/MVF limits visible", () => {
    expect(report.summary.bestFullResidualVariantId).toBe("full-residual-forcebalance-fixed6-pv36-mvsoft");
    expect(report.summary.bestFullResidualSourcePreservingPhasePv).toBe(4);
    expect(report.summary.bestFullResidualPhaseOrientedPvPass).toBe(6);
    expect(report.summary.bestFullResidualSourceSurfacePass).toBe(4);
    expect(report.summary.reviewStatus).toBe("full-left-avp-residual-positive-signal");

    const bestRows = rowsFor(report.summary.bestFullResidualVariantId);
    expect(bestRows).toHaveLength(7);
    expect(bestRows.filter((row) => row.sourcePreservingPhasePv).map((row) => row.profileId)).toEqual([
      "normal-hr75",
      "normal-hr90",
      "preload-high",
      "afterload-high",
    ]);
    expect(bestRows.some((row) =>
      row.phasePv.failureReasons.includes("mv-opening-conduit-start-not-downstroke")
    )).toBe(true);
    expect(bestRows.some((row) => !row.mvfClean)).toBe(true);
    expect(bestRows.some((row) => row.phaseOrientedPvPass && !row.sourcePreservingPhasePv)).toBe(true);
  });

  it("keeps representative historical mechanism families bounded after the gate cleanup", () => {
    const expected = [
      ["bestSmoothCore", "smooth-core-force-fixed6-pv36-mvsoft", 0, 0, 1, 0],
      ["bestV2", "v2-force-fixed8-pv36-mvsoft", 4, 5, 4, 0],
      ["bestV3", "v3-wall-fixed8-pv36-mvloss", 3, 4, 4, 7],
      ["bestV4", "v4-wall-veltarget-fixed8-pv36-mvsoft", 0, 0, 3, 3],
      ["bestV5", "v5-wall-phaseowned-fixed8-pv36-mvsoft", 0, 0, 0, 3],
      ["bestV6", "v6-force-refcap-fixed8-pv36-mvloss", 1, 1, 5, 0],
      ["bestV8", "v8-force-refcap-venous-fixed8-pv36-mvloss", 2, 2, 6, 0],
      ["bestV9", "v9-force-dynref-fixed8-pv36-mvloss", 2, 2, 6, 0],
      ["bestV10", "v10-force-separated-fixed8-pv36-mvloss", 0, 1, 0, 0],
      ["bestV11", "v11-wall-accepted-fixed10-pv44-mvloss", 0, 2, 0, 0],
	      ["bestV12", "v12-force-effcav-pr175-fixed8-pv36-mvloss", 2, 2, 6, 0],
	      ["bestV13", "v13-wall-effcav-c1accel16-pr150-fixed8-pv36-mvloss", 2, 2, 5, 1],
	      ["bestV14", "v14-wall-effcav-traj20-pr150-fixed8-pv36-mvloss", 2, 2, 5, 6],
	      ["bestV15", "v15-wall-effcav-traj20-mvtarget05-pr150-fixed8-pv36-mvloss", 2, 2, 5, 6],
      ["bestV16", "v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss", 2, 2, 5, 6],
      ["bestV17", "v17-force-hyst-traj20-pr175-fixed12-pv52-mvloss", 1, 1, 6, 2],
      ["bestV18", "v18-wall-hyst2-retain-fixed12-pv56-mvsmooth", 1, 1, 3, 7],
      ["bestV20", "v20-force-hyststate-slowpath-fixed14-pv64-mvsmooth", 1, 1, 4, 6],
      ["bestV21", "v21-force-branchmem-fixed14-pv64-mvsmooth", 0, 0, 5, 5],
    ] as const;

    for (const [prefix, variantId, sourcePhase, phase, source, prime] of expected) {
      expect(report.summary[`${prefix}VariantId` as keyof typeof report.summary]).toBe(variantId);
      expect(report.summary[`${prefix}SourcePreservingPhasePv` as keyof typeof report.summary]).toBe(sourcePhase);
      expect(report.summary[`${prefix}PhaseOrientedPvPass` as keyof typeof report.summary]).toBe(phase);
      expect(report.summary[`${prefix}SourceSurfacePass` as keyof typeof report.summary]).toBe(source);
      expect(report.summary[`${prefix}PrimeWaveformPass` as keyof typeof report.summary]).toBe(prime);
      expect(summaryFor(variantId).hiddenVolumeClean).toBe(7);
    }
  });

  it("records V19 recoil hysteresis as a negative signal rather than a promotion path", () => {
    const v18Best = summaryFor(report.summary.bestV18VariantId);
    const v19Best = summaryFor(report.summary.bestV19VariantId);
    const v19Rows = rowsFor(report.summary.bestV19VariantId);

    expect(report.summary.bestV19VariantId).toBe("v19-wall-hyst3-recoil-fixed12-pv60-mvsmooth");
    expect(report.summary.bestV19SourcePreservingPhasePv).toBe(1);
    expect(report.summary.bestV19PhaseOrientedPvPass).toBe(1);
    expect(report.summary.bestV19SourceSurfacePass).toBe(3);
    expect(report.summary.bestV19MvfClean).toBe(4);
    expect(report.summary.bestV19PrimeWaveformPass).toBe(7);
    expect(report.summary.bestV19CapacityAxisPhaseOrientedPvPass).toBe(6);
    expect(report.summary.bestV19SourcePreservingCapacityAxisPhasePv).toBe(3);
    expect(report.summary.bestV19MaxReferenceCapacityShiftMl).toBeGreaterThan(20);
    expect(report.summary.bestV19MaxAppliedFixedBloodPressureReliefMmHg).toBeGreaterThan(4);
    expect(report.summary.bestV19MaxBloodXDescentPressureDropMmHg).toBeGreaterThan(4);

    expect(v19Best.hiddenVolumeClean).toBe(7);
    expect(v19Best.primeWaveformPass).toBe(v18Best.primeWaveformPass);
    expect(v19Best.maxVLoopArea).toBeLessThan(v18Best.maxVLoopArea);
    expect(v19Rows).toHaveLength(7);
    expect(v19Rows.filter((row) => row.phaseOrientedPvPass).map((row) => row.profileId)).toEqual([
      "preload-low",
    ]);
    expect(v19Rows.filter((row) => !row.phaseOrientedPvPass)
      .every((row) => row.phasePv.failureReasons.includes("v-loop-area-too-small"))).toBe(true);
    expect(v19Rows.every((row) => !row.phasePv.failureReasons.includes("mv-opening-conduit-start-not-downstroke")))
      .toBe(true);
  });

  it("records V20 stateful reservoir-conduit hysteresis as source-cleaner with one bounded phase signal", () => {
    const v20Best = summaryFor(report.summary.bestV20VariantId);
    const v20Rows = rowsFor(report.summary.bestV20VariantId);

    expect(report.summary.bestV20VariantId).toBe("v20-force-hyststate-slowpath-fixed14-pv64-mvsmooth");
    expect(report.summary.bestV20SourcePreservingPhasePv).toBe(1);
    expect(report.summary.bestV20PhaseOrientedPvPass).toBe(1);
    expect(report.summary.bestV20SourceSurfacePass).toBe(4);
    expect(report.summary.bestV20MvfClean).toBe(5);
    expect(report.summary.bestV20PrimeWaveformPass).toBe(6);
    expect(report.summary.bestV20CapacityAxisPhaseOrientedPvPass).toBe(5);
    expect(report.summary.bestV20SourcePreservingCapacityAxisPhasePv).toBe(3);

    expect(v20Best.hiddenVolumeClean).toBe(7);
    expect(v20Best.maxTransactionResidualNormMl).toBeLessThan(0.25);
    expect(v20Best.maxVLoopArea).toBeGreaterThan(summaryFor(report.summary.bestV19VariantId).maxVLoopArea);
    expect(v20Rows).toHaveLength(7);
    expect(v20Rows.filter((row) => row.phaseOrientedPvPass).map((row) => row.profileId)).toEqual([
      "preload-low",
    ]);
    expect(v20Rows.filter((row) => !row.phaseOrientedPvPass)
      .every((row) => row.phasePv.failureReasons.includes("v-loop-area-too-small"))).toBe(true);
    expect(v20Rows.find((row) => row.profileId === "preload-low")!.postMvoConduit.earlyConduitPressureDropMmHg)
      .toBeGreaterThan(1.5);
  });

  it("records V21 branch-memory plus LV-receiver relief as negative blood-phase evidence", () => {
    const v21Best = summaryFor(report.summary.bestV21VariantId);
    const v21Rows = rowsFor(report.summary.bestV21VariantId);

    expect(report.summary.bestV21VariantId).toBe("v21-force-branchmem-fixed14-pv64-mvsmooth");
    expect(report.summary.bestV21SourcePreservingPhasePv).toBe(0);
    expect(report.summary.bestV21PhaseOrientedPvPass).toBe(0);
    expect(report.summary.bestV21SourceSurfacePass).toBe(5);
    expect(report.summary.bestV21MvfClean).toBe(5);
    expect(report.summary.bestV21PrimeWaveformPass).toBe(5);
    expect(report.summary.bestV21CapacityAxisPhaseOrientedPvPass).toBe(6);
    expect(report.summary.bestV21SourcePreservingCapacityAxisPhasePv).toBe(5);

    expect(v21Best.hiddenVolumeClean).toBe(7);
    expect(v21Rows).toHaveLength(7);
    expect(v21Rows.every((row) => !row.phaseOrientedPvPass)).toBe(true);
    expect(v21Rows.some((row) => row.postMvoConduit.earlyConduitMeanLvReceiverReliefMmHg > 0)).toBe(true);
    expect(v21Rows.some((row) => row.phasePv.vLoopArea > 20)).toBe(true);
  });

  it("records V22 as a V16-shape transfer into weak hysteresis and LV-receiver ownership", () => {
    const v22VariantId = "v22-wall-v16transfer-lvrecv-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss";
    const v22Best = summaryFor(v22VariantId);
    const v22Rows = rowsFor(v22VariantId);

    expect(v22Best.sourcePreservingPhasePv).toBe(2);
    expect(v22Best.phaseOrientedPvPass).toBe(2);
    expect(v22Best.sourceSurfacePass).toBe(6);
    expect(v22Best.mvfClean).toBe(6);
    expect(v22Best.primeWaveformPass).toBe(7);
    expect(v22Best.hiddenVolumeClean).toBe(7);
    expect(v22Best.maxVLoopArea).toBeGreaterThan(70);

    expect(v22Rows.filter((row) => row.sourcePreservingPhasePv).map((row) => row.profileId)).toEqual([
      "normal-hr75",
      "preload-low",
    ]);
    expect(v22Rows.find((row) => row.profileId === "normal-hr75")!.postMvoConduit.earlyConduitMeanLvReceiverReliefMmHg)
      .toBeGreaterThan(0);
    expect(v22Rows.filter((row) => !row.phaseOrientedPvPass)
      .every((row) => row.phasePv.failureReasons.includes("v-loop-area-too-small"))).toBe(true);
  });

  it("records V23 as a normal-first V16 transfer with stronger conduit receiver/loss evidence", () => {
    const v22VariantId = "v22-wall-v16transfer-lvrecv-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss";
    const v23VariantId = "v23-wall-v16area-lvrecv3-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite";
    const v22Best = summaryFor(v22VariantId);
    const v23Best = summaryFor(v23VariantId);
    const v23Rows = rowsFor(v23VariantId);
    const normal = v23Rows.find((row) => row.profileId === "normal-hr75");
    const contractilityHigh = v23Rows.find((row) => row.profileId === "contractility-high");

    expect(v23Best.sourcePreservingPhasePv).toBeGreaterThan(v22Best.sourcePreservingPhasePv);
    expect(v23Best.phaseOrientedPvPass).toBeGreaterThan(v22Best.phaseOrientedPvPass);
    expect(v23Best.primeWaveformPass).toBe(7);
    expect(v23Best.hiddenVolumeClean).toBe(7);

    expect(v23Rows.filter((row) => row.sourcePreservingPhasePv).map((row) => row.profileId)).toEqual([
      "normal-hr75",
      "preload-low",
      "contractility-high",
    ]);
    expect(normal).toBeDefined();
    expect(normal!.sourceSurfacePass).toBe(true);
    expect(normal!.mvfClean).toBe(true);
    expect(normal!.phaseOrientedPvPass).toBe(true);
    expect(normal!.phasePv.postOpeningEarlyPressureDropMmHg).toBeGreaterThan(2.4);
    expect(normal!.phasePv.postOpeningEarlyVolumeDropMl).toBeGreaterThan(7.0);
    expect(contractilityHigh?.sourcePreservingPhasePv).toBe(true);
    expect(v23Rows.filter((row) => !row.phaseOrientedPvPass)
      .every((row) => row.phasePv.failureReasons.includes("v-loop-area-too-small"))).toBe(true);
  });

  it("records V24 receiver-path state as neutral-to-slight V-loop area evidence, not normal-shape adoption", () => {
    const v16VariantId = "v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss";
    const v23VariantId = "v23-wall-v16area-lvrecv3-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite";
    const v24VariantId = "v24-wall-v16receiverstate-lvrecv3-rpathslow-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite";
    const v16Normal = rowsFor(v16VariantId).find((row) => row.profileId === "normal-hr75");
    const v23Best = summaryFor(v23VariantId);
    const v24Best = summaryFor(v24VariantId);
    const v24Rows = rowsFor(v24VariantId);
    const normal = v24Rows.find((row) => row.profileId === "normal-hr75");
    const contractilityHigh = v24Rows.find((row) => row.profileId === "contractility-high");

    expect(v24Best.sourcePreservingPhasePv).toBe(v23Best.sourcePreservingPhasePv);
    expect(v24Best.phaseOrientedPvPass).toBe(v23Best.phaseOrientedPvPass);
    expect(v24Best.primeWaveformPass).toBe(7);
    expect(v24Best.hiddenVolumeClean).toBe(7);
    expect(v24Best.maxVLoopArea).toBeGreaterThan(v23Best.maxVLoopArea);

    expect(v24Rows.filter((row) => row.sourcePreservingPhasePv).map((row) => row.profileId)).toEqual([
      "normal-hr75",
      "preload-low",
      "contractility-high",
    ]);
    expect(normal).toBeDefined();
    expect(v16Normal).toBeDefined();
    expect(normal!.sourceSurfacePass).toBe(true);
    expect(normal!.mvfClean).toBe(true);
    expect(normal!.phaseOrientedPvPass).toBe(true);
    expect(normal!.phasePv.vLoopArea).toBeLessThan(v16Normal!.phasePv.vLoopArea);
    expect(normal!.phasePv.postOpeningEarlyPressureDropMmHg).toBeGreaterThan(2.4);
    expect(normal!.postMvoConduit.earlyConduitMeanLvReceiverReliefMmHg).toBeGreaterThan(0.12);
    expect(contractilityHigh?.sourcePreservingPhasePv).toBe(true);
    expect(v24Rows.filter((row) => !row.phaseOrientedPvPass)
      .every((row) => row.phasePv.failureReasons.includes("v-loop-area-too-small"))).toBe(true);
  });

  it("records V25/V26 as normal-first receiver-capacity and phase-locked path evidence, with prime readback only", () => {
    const v16VariantId = "v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss";
    const v25VariantId = "v25-wall-v16lvreceivercap-lvrecv3-rcapslow-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite";
    const v26VariantId = "v26-wall-v16phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite";
    const v16Normal = rowsFor(v16VariantId).find((row) => row.profileId === "normal-hr75")!;
    const v25Normal = rowsFor(v25VariantId).find((row) => row.profileId === "normal-hr75")!;
    const v26Rows = rowsFor(v26VariantId);
    const v26FamilyRows = report.rows.filter((row) => row.family === "full-left-v16-phase-locked-avplane-hysteresis-v26");
    const v26Normal = v26Rows.find((row) => row.profileId === "normal-hr75")!;
    const v26Best = summaryFor(v26VariantId);

    expect(v26Best.sourcePreservingPhasePv).toBe(3);
    expect(v26Best.sourceSurfacePass).toBe(5);
    expect(v26Best.mvfClean).toBe(5);
    expect(v26Best.hiddenVolumeClean).toBe(7);
    expect(v26Best.maxEffectiveCavityCapacityMl).toBeGreaterThan(v25Normal.maxEffectiveCavityCapacityMl);
    expect(v26Rows.filter((row) => row.sourcePreservingPhasePv).map((row) => row.profileId)).toEqual([
      "normal-hr75",
      "preload-low",
      "contractility-high",
    ]);

    expect(v25Normal.sourcePreservingPhasePv).toBe(true);
    expect(v25Normal.phasePv.vLoopArea).toBeLessThan(v16Normal.phasePv.vLoopArea);
    expect(v26Normal.sourcePreservingPhasePv).toBe(true);
    expect(v26Normal.phasePv.vLoopArea).toBeGreaterThan(v16Normal.phasePv.vLoopArea);
    expect(v26Normal.phasePv.failureReasons).toEqual([]);
    expect(v26FamilyRows.some((row) => !row.primeWaveformPass && row.failureReasons.length === 0)).toBe(true);
    expect(report.rows.flatMap((row) => row.failureReasons)).not.toContain("prime-waveform-fail");
  });

  it("keeps owner SVG candidates hidden when no blood/MVF/opening-clean row is visually acceptable", () => {
    const svg = readFileSync(
      "data/mechanics2/visuals/full-left-av-plane-residual-routing-review.svg",
      "utf8",
    );

	    expect(svg).toContain("Blood-volume LA PV is the only physiology-facing display");
    expect(svg.match(/no plotted candidate/g)?.length).toBe(6);
    expect(svg).not.toContain("best V19 recoil hysteresis\" fill=\"none\"");
    expect(svg).toContain("best V20 pressure");
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
