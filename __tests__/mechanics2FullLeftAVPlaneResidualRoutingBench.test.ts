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
      row.sourceSurfacePass
      && row.mvfClean
      && row.primeWaveformPass
      && row.phaseOrientedPvPass
      && row.hiddenVolumeClean
      && !row.phasePv.failureReasons.includes("mv-opening-starts-upward")
      && !row.phasePv.failureReasons.includes("mv-opening-conduit-start-not-downstroke")
    );

    expect(normalReport.summary.totalProfiles).toBe(1);
    expect(normalReport.rows).toHaveLength(128);
    expect(normalReport.summary.bestOverallVariantId).toBe("v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss");
    expect(normalReport.summary.bestOverallSourcePreservingPhasePv).toBe(1);
    expect(visualCandidates.map((row) => row.variantId)).toContain(
      "v16-wall-effcav-traj20-mvimplicit02-pr150-fixed8-pv36-mvloss",
    );
    expect(visualCandidates.every((row) => row.phasePv.postOpeningEarlyPressureDropMmHg > 1.0)).toBe(true);
    expect(visualCandidates.every((row) => row.phasePv.postOpeningEarlyVolumeDropMl > 5.0)).toBe(true);
  });

  it("records the full-left LA-AV-plane residual routing experiment", () => {
    expect(report.reportId).toBe(FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1);
    expect(report.mode).toBe("full-left-heart-la-avplane-mv-pv-routing-no-runtime");
    expect(report.rows).toHaveLength(896);
    expect(report.variantSummaries).toHaveLength(128);
    expect(new Set(report.rows.map((row) => row.family)).size).toBe(29);
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
      ["bestV12", "v12-wall-effcav-pr150-fixed8-pv36-mvloss", 1, 1, 5, 0],
      ["bestV13", "v13-wall-effcav-c1accel12-pr150-fixed8-pv36-mvloss", 2, 2, 4, 0],
      ["bestV14", "v14-force-effcav-traj14-pr175-fixed10-pv44-mvloss", 1, 1, 6, 0],
      ["bestV15", "v15-force-effcav-traj14-mvtarget10-pr175-fixed10-pv44-mvloss", 1, 1, 6, 0],
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

  it("keeps owner SVG candidates hidden when no blood/MVF/opening-clean row is visually acceptable", () => {
    const svg = readFileSync(
      "data/mechanics2/visuals/full-left-av-plane-residual-routing-review.svg",
      "utf8",
    );

    expect(svg).toContain("Effective-cavity LA PV is a shadow diagnostic axis, not acceptance");
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
