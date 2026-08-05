import { describe, expect, it } from "vitest";

import {
  WORKBENCH_PRESENTATION_SAMPLE_CAPACITY_V3,
  WORKBENCH_PRESENTATION_HISTORY_MAX_DEPTH_V3,
  WorkbenchScenarioPresentationSampleStoreV3,
  appendWorkbenchPresentationSamplesV3,
  appendWorkbenchExactOrbitSamplesV3,
  buildPvBackBufferRemainderV3,
  buildSweepingWaveformSegmentsV3,
  buildWorkbenchTraceLegendModelV3,
  boundedCanvasPixelRatioV3,
  createWorkbenchCanvasFrameSchedulerV3,
  extractLivePvTrajectoryV3,
  extractLastCompletePvBeatV3,
  extendPvSystolicRelationToPlotBoundaryV3,
  extendPvVolumeDomainToExtrapolatedInterceptsV3,
  firstSampleAtOrAfterV3,
  guytonStarlingPlotDomainV3,
  isWorkbenchPresentationSampleV3,
  lastCompleteCycleRangeV3,
  latestSweepingWaveformPointV3,
  nextStableNumericDomainStateV3,
  niceNumericDomainV3,
  numericTicksV3,
  orderedFiniteWorkbenchSamplesV3,
  projectHistoricalPvEpochV3,
  workbenchHistoryAlphaV3,
  deriveWorkbenchScenarioItemColorV3,
  reconcileWorkbenchGraphColorsV3,
  resolveWorkbenchGraphTraceStyleV3,
  starlingCurvePointsV3,
  starlingPresentationFocusV3,
  updateWorkbenchScenarioBaseColorV3,
  type WorkbenchPvPointV3,
  type WorkbenchScalarSampleV3,
} from "@/components/workbench/v3";
import type { MainWireIntegratedModelStructuralReturnOrientationV3 } from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import type {
  ExperimentSurfaceGraphPaneV2,
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";

const TEST_CYCLE_PHASE_OUTPUT_ID_V3 = "custom.clock/cycle-fraction";

const sampleV3 = (
  acceptedTimeSec: number,
  cyclePhase01: number | null,
  values: Readonly<Record<string, number | null>>,
  identity: Readonly<{
    inputEpoch?: number;
    acceptedRevision?: number;
    presentationTimeSec?: number;
  }> = {},
): WorkbenchScalarSampleV3 =>
  Object.freeze({
    inputEpoch: identity.inputEpoch ?? 0,
    acceptedRevision:
      identity.acceptedRevision ??
      Math.max(0, Math.round(acceptedTimeSec / 0.002)),
    acceptedTimeSec,
    presentationTimeSec: identity.presentationTimeSec ?? acceptedTimeSec,
    values: Object.freeze({
      ...values,
      [TEST_CYCLE_PHASE_OUTPUT_ID_V3]: cyclePhase01,
    }),
  });

describe("V3-neutral Workbench Canvas helpers", () => {
  it("focuses the Starling viewport on the confirmed downturn and ignores history extremes", () => {
    const orientation = structuralOrientationV3([
      [-1, 0.2],
      [4, 3.4],
      [8, 5.2],
      [12, 5.8],
      [16, 5.7],
      [22, 5.5],
      [40, 4.8],
    ]);
    const history = structuralOrientationV3([
      [-2, 0.1],
      [8, 5],
      [16, 5.6],
      [30, 5.3],
      [80, 3],
    ]);

    expect(starlingPresentationFocusV3(orientation)).toEqual({
      peakPressureMmHg: 12,
      firstDecliningPressureMmHg: 16,
      confirmedDecliningPressureMmHg: 22,
      pressureMaximumMmHg: 19.2,
    });
    const focused = guytonStarlingPlotDomainV3(orientation);
    expect(focused.pressureMaximumMmHg).toBeLessThan(25);
    expect(guytonStarlingPlotDomainV3(orientation, [history])).toEqual(focused);
  });

  it("interpolates eligible Starling points without extrapolating through a boundary", () => {
    const curve = starlingCurvePointsV3([
      {
        fillingPressureMmHg: -12,
        cardiacOutputLPerMin: 0,
        curveEligible: false,
      },
      {
        fillingPressureMmHg: -2,
        cardiacOutputLPerMin: 0.08,
        curveEligible: true,
      },
      {
        fillingPressureMmHg: 0,
        cardiacOutputLPerMin: 0.7,
        curveEligible: true,
      },
      {
        fillingPressureMmHg: 2,
        cardiacOutputLPerMin: 2.4,
        curveEligible: true,
      },
      {
        fillingPressureMmHg: 5,
        cardiacOutputLPerMin: 4.8,
        curveEligible: true,
      },
    ]);

    expect(curve[0]).toEqual({ pressureMmHg: -2, flowLPerMin: 0.08 });
    expect(curve.at(-1)).toEqual({ pressureMmHg: 5, flowLPerMin: 4.8 });
    expect(
      curve.every(
        ({ pressureMmHg, flowLPerMin }) =>
          pressureMmHg >= -2 &&
          pressureMmHg <= 5 &&
          flowLPerMin >= 0.08 &&
          flowLPerMin <= 4.8,
      ),
    ).toBe(true);
  });

  it("splits a sweeping waveform at time wraps and around the forward cursor gap", () => {
    const samples = [
      sampleV3(0.2, null, { pressure: 20 }),
      sampleV3(0.25, null, { pressure: 25 }),
      sampleV3(0.5, null, { pressure: 50 }),
      sampleV3(0.9, null, { pressure: 90 }),
      sampleV3(1, null, { pressure: 100 }),
      sampleV3(1.2, null, { pressure: 120 }),
    ];

    const segments = buildSweepingWaveformSegmentsV3(samples, "pressure", {
      windowSec: 1,
      forwardGapFraction: 0.1,
    });

    expect(segments.map((segment) => segment.length)).toEqual([1, 2, 2]);
    expect(segments[0]?.[0]?.phaseSec).toBeCloseTo(0.2);
    expect(segments[1]?.map(({ phaseSec }) => phaseSec)).toEqual([0.5, 0.9]);
    expect(segments[2]?.[0]?.phaseSec).toBe(0);
    expect(segments[2]?.[1]?.phaseSec).toBeCloseTo(0.2);
    expect(segments.flat().some(({ phaseSec }) => phaseSec === 0.25)).toBe(
      false,
    );
  });

  it("places each waveform cap on that trace's newest finite live sample", () => {
    const samples = [
      sampleV3(6.01, null, { pressure: 80 }),
      sampleV3(6.25, null, { pressure: 96 }),
    ];

    expect(latestSweepingWaveformPointV3(samples, "pressure", 6)).toEqual({
      phaseSec: 0.25,
      value: 96,
    });
    expect(
      latestSweepingWaveformPointV3(
        [...samples, sampleV3(6.5, null, { pressure: null })],
        "pressure",
        6,
      ),
    ).toEqual({
      phaseSec: 0.25,
      value: 96,
    });
  });

  it("uses nice ticks, expands without clipping, and contracts only after six commits", () => {
    let state = nextStableNumericDomainStateV3(null, [0, 100], {
      commitKey: "beat/0",
      paddingFraction: 0,
    });
    expect(state.domain).toEqual([0, 100]);
    for (let beat = 1; beat <= 5; beat += 1) {
      state = nextStableNumericDomainStateV3(state, [35, 60], {
        commitKey: `beat/${beat}`,
        paddingFraction: 0,
      });
      expect(state.domain).toEqual([0, 100]);
    }
    state = nextStableNumericDomainStateV3(state, [35, 60], {
      commitKey: "beat/6",
      paddingFraction: 0,
    });
    expect(state.domain).toEqual([35, 60]);
    expect(
      nextStableNumericDomainStateV3(state, [-20, 80], {
        commitKey: "beat/7",
        paddingFraction: 0,
      }).domain,
    ).toEqual([-20, 80]);
    expect(niceNumericDomainV3([-2, 12])).toEqual([-5, 15]);
    expect(numericTicksV3([-5, 15])).toEqual([-5, 0, 5, 10, 15]);
  });

  it("uses model-emitted cycle wraps to select the newest complete PV beat", () => {
    const samples = [
      sampleV3(0.7, 0.7, { volume: 110, pressure: 12 }),
      sampleV3(0.9, 0.9, { volume: 120, pressure: 10 }),
      sampleV3(1.1, 0.1, { volume: 118, pressure: 15 }),
      sampleV3(1.4, 0.4, { volume: 90, pressure: 110 }),
      sampleV3(1.9, 0.9, { volume: 120, pressure: 10 }),
      sampleV3(2.1, 0.1, { volume: 118, pressure: 15 }),
      sampleV3(2.2, 0.2, { volume: 110, pressure: 55 }),
    ];

    expect(
      lastCompleteCycleRangeV3(samples, TEST_CYCLE_PHASE_OUTPUT_ID_V3),
    ).toEqual({
      startIndex: 2,
      endIndexInclusive: 5,
    });
    const beat = extractLastCompletePvBeatV3(
      samples,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    );
    expect(beat.map(({ acceptedTimeSec }) => acceptedTimeSec)).toEqual([
      1.1, 1.4, 1.9, 2.1,
    ]);
    const trajectory = extractLivePvTrajectoryV3(
      samples,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    );
    expect(trajectory.completedBeat).toEqual(beat);
    expect(
      trajectory.liveSegment.map(({ acceptedTimeSec }) => acceptedTimeSec),
    ).toEqual([2.1, 2.2]);
    expect(trajectory.liveSegment.at(-1)).toMatchObject({
      cyclePhase01: 0.2,
      volumeMl: 110,
      pressureMmHg: 55,
    });
  });

  it("renders a moving partial PV trajectory before the first complete beat", () => {
    const samples = [
      sampleV3(0.2, 0.2, { volume: 118, pressure: 20 }),
      sampleV3(0.4, 0.4, { volume: 88, pressure: 112 }),
      sampleV3(0.6, 0.6, { volume: 70, pressure: 65 }),
    ];

    expect(
      extractLivePvTrajectoryV3(
        samples,
        "volume",
        "pressure",
        TEST_CYCLE_PHASE_OUTPUT_ID_V3,
      ),
    ).toEqual({
      completedBeat: [],
      liveSegment: [
        {
          acceptedTimeSec: 0.2,
          cyclePhase01: 0.2,
          volumeMl: 118,
          pressureMmHg: 20,
        },
        {
          acceptedTimeSec: 0.4,
          cyclePhase01: 0.4,
          volumeMl: 88,
          pressureMmHg: 112,
        },
        {
          acceptedTimeSec: 0.6,
          cyclePhase01: 0.6,
          volumeMl: 70,
          pressureMmHg: 65,
        },
      ],
    });
  });

  it("replaces the completed PV back buffer by phase without an alpha seam", () => {
    const completed: readonly WorkbenchPvPointV3[] = Object.freeze([
      { acceptedTimeSec: 1, cyclePhase01: 0.1, volumeMl: 120, pressureMmHg: 10 },
      { acceptedTimeSec: 1.3, cyclePhase01: 0.4, volumeMl: 80, pressureMmHg: 110 },
      { acceptedTimeSec: 1.8, cyclePhase01: 0.9, volumeMl: 118, pressureMmHg: 12 },
      { acceptedTimeSec: 2, cyclePhase01: 0.1, volumeMl: 120, pressureMmHg: 10 },
    ]);
    const live: readonly WorkbenchPvPointV3[] = Object.freeze([
      { acceptedTimeSec: 2, cyclePhase01: 0.1, volumeMl: 120, pressureMmHg: 10 },
      { acceptedTimeSec: 2.2, cyclePhase01: 0.3, volumeMl: 92, pressureMmHg: 82 },
    ]);

    const remainder = buildPvBackBufferRemainderV3(completed, live);
    expect(remainder[0]).toMatchObject({
      cyclePhase01: 0.3,
      volumeMl: expect.closeTo(93.3333333333),
      pressureMmHg: expect.closeTo(76.6666666667),
    });
    expect(remainder.slice(1)).toEqual(completed.slice(1));
    expect(buildPvBackBufferRemainderV3(completed, live.slice(0, 1))).toBe(
      completed,
    );
  });

  it("does not infer a complete beat when model cycle phase is absent", () => {
    const samples = [
      sampleV3(0, null, { volume: 100, pressure: 10 }),
      sampleV3(0.5, null, { volume: 80, pressure: 100 }),
      sampleV3(1, null, { volume: 100, pressure: 10 }),
    ];

    expect(
      lastCompleteCycleRangeV3(samples, TEST_CYCLE_PHASE_OUTPUT_ID_V3),
    ).toBeNull();
    expect(
      extractLastCompletePvBeatV3(
        samples,
        "volume",
        "pressure",
        TEST_CYCLE_PHASE_OUTPUT_ID_V3,
      ),
    ).toEqual([]);
  });

  it("reuses PV projection only for immutable historical epochs", () => {
    const history = Object.freeze([
      sampleV3(0, 0, { volume: 120, pressure: 10 }),
      sampleV3(0.25, 0.25, { volume: 100, pressure: 80 }),
      sampleV3(0.5, 0.5, { volume: 65, pressure: 120 }),
      sampleV3(0.9, 0.9, { volume: 115, pressure: 12 }),
      sampleV3(1, 0, { volume: 120, pressure: 10 }),
    ]);
    const first = projectHistoricalPvEpochV3(
      history,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    );
    const reused = projectHistoricalPvEpochV3(
      history,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    );
    const differentBinding = projectHistoricalPvEpochV3(
      history,
      "volume",
      "pressure",
      "other-cycle-phase",
    );

    expect(reused).toBe(first);
    expect(first.completedBeat.length).toBeGreaterThanOrEqual(3);
    expect(differentBinding).not.toBe(first);
  });

  it("uses only catalog-bound arbitrary PV output IDs", () => {
    const volumeOutputId = "arbitrary/x-axis";
    const pressureOutputId = "arbitrary/y-axis";
    const cyclePhaseOutputId = "arbitrary/cycle-boundary";
    const samples = [
      [0.1, 0.1, 120, 10],
      [0.5, 0.5, 80, 110],
      [0.9, 0.9, 118, 12],
      [1.1, 0.1, 116, 16],
      [1.5, 0.5, 78, 112],
      [1.9, 0.9, 119, 11],
      [2.1, 0.1, 117, 15],
    ].map(([acceptedTimeSec, phase, volume, pressure]) =>
      Object.freeze({
        inputEpoch: 0,
        acceptedRevision: Math.round(acceptedTimeSec / 0.002),
        acceptedTimeSec,
        presentationTimeSec: acceptedTimeSec,
        values: Object.freeze({
          [volumeOutputId]: volume,
          [pressureOutputId]: pressure,
          [cyclePhaseOutputId]: phase,
          // A hard-coded Main Wire phase would never form a cycle here.
          "rhythm.phase.regular-sinus": 0.5,
        }),
      }),
    );

    const beat = extractLastCompletePvBeatV3(
      samples,
      volumeOutputId,
      pressureOutputId,
      cyclePhaseOutputId,
    );

    expect(beat.map(({ acceptedTimeSec }) => acceptedTimeSec)).toEqual([
      1.1, 1.5, 1.9, 2.1,
    ]);
    expect(beat[1]).toMatchObject({
      cyclePhase01: 0.5,
      volumeMl: 78,
      pressureMmHg: 112,
    });
  });

  it("extends only the PV volume lower bound to finite extrapolated intercepts", () => {
    expect(
      extendPvVolumeDomainToExtrapolatedInterceptsV3([40, 190], [-20, 5]),
    ).toEqual([-24.5, 190]);
    expect(
      extendPvVolumeDomainToExtrapolatedInterceptsV3([40, 190], [60]),
    ).toEqual([40, 190]);
  });

  it("extends ESPVR from V0 to whichever visible upper boundary is reached first", () => {
    const relation = {
      status: "complete-preview",
      systolicEnvelope: {
        elastanceMmHgPerMl: 2,
        extrapolatedVolumeAxisInterceptMl: 20,
      },
    } as any;
    expect(
      extendPvSystolicRelationToPlotBoundaryV3(
        relation,
        [0, 200],
        [0, 150],
      ),
    ).toEqual([
      { volumeMl: 20, pressureMmHg: 0 },
      { volumeMl: 95, pressureMmHg: 150 },
    ]);
    expect(
      extendPvSystolicRelationToPlotBoundaryV3(
        relation,
        [0, 60],
        [0, 150],
      ),
    ).toEqual([
      { volumeMl: 20, pressureMmHg: 0 },
      { volumeMl: 60, pressureMmHg: 80 },
    ]);
  });

  it("keeps monotonic Worker samples on the allocation-free fast path", () => {
    const ordered = Object.freeze([
      sampleV3(0, 0, {}),
      sampleV3(0.002, 0.002, {}),
      sampleV3(0.004, 0.004, {}),
    ]);

    expect(orderedFiniteWorkbenchSamplesV3(ordered)).toBe(ordered);
    expect(firstSampleAtOrAfterV3(ordered, 0.001)).toBe(1);
    expect(firstSampleAtOrAfterV3(ordered, 1)).toBe(ordered.length);

    const malformed = [
      ordered[2]!,
      sampleV3(Number.NaN, null, {}),
      ordered[0]!,
    ];
    expect(
      orderedFiniteWorkbenchSamplesV3(malformed).map(
        (sample) => sample.acceptedTimeSec,
      ),
    ).toEqual([0, 0.004]);
  });

  it("bounds Retina backing-store cost while preserving CSS resolution", () => {
    expect(boundedCanvasPixelRatioV3(0.5)).toBe(1);
    expect(boundedCanvasPixelRatioV3(2)).toBe(2);
    expect(boundedCanvasPixelRatioV3(4)).toBe(2);
    expect(boundedCanvasPixelRatioV3(Number.NaN)).toBe(1);
  });

  it("coalesces saturated Canvas updates into one pending animation frame", () => {
    let requestCount = 0;
    let cancelCount = 0;
    let renderCount = 0;
    let pending: (() => void) | null = null;
    const scheduler = createWorkbenchCanvasFrameSchedulerV3(
      () => {
        renderCount += 1;
      },
      (callback) => {
        requestCount += 1;
        pending = callback;
        return requestCount;
      },
      () => {
        cancelCount += 1;
      },
    );

    for (let index = 0; index < 2_000; index += 1) scheduler.schedule();
    expect(requestCount).toBe(1);
    expect(cancelCount).toBe(0);
    (pending as (() => void) | null)?.();
    expect(renderCount).toBe(1);

    scheduler.schedule();
    expect(requestCount).toBe(2);
    scheduler.dispose();
    expect(cancelCount).toBe(1);
  });

  it("keeps a minute-long exact stream bounded and preserves bucket extrema", () => {
    let presentation: readonly WorkbenchScalarSampleV3[] = [];
    const dtSec = 0.002;
    const sourceSampleCount = 30_000;
    const batchSize = 16;
    for (let start = 0; start < sourceSampleCount; start += batchSize) {
      const batch = Array.from(
        { length: Math.min(batchSize, sourceSampleCount - start) },
        (_, offset) => {
          const ordinal = start + offset;
          const timeSec = ordinal * dtSec;
          return sampleV3(timeSec, (timeSec % 0.8) / 0.8, {
            pressure: ordinal % 83 === 0 ? 180 : 80 + 20 * Math.sin(timeSec),
            flow: ordinal % 71 === 0 ? -40 : 5 + 10 * Math.cos(timeSec),
            volume: 100 + 25 * Math.sin(timeSec * 2),
          });
        },
      );
      presentation = appendWorkbenchPresentationSamplesV3(presentation, batch);
      expect(presentation.length).toBeLessThanOrEqual(
        WORKBENCH_PRESENTATION_SAMPLE_CAPACITY_V3,
      );
    }

    expect(presentation.length).toBeLessThanOrEqual(362);
    expect(
      presentation.at(-1)!.acceptedTimeSec - presentation[0]!.acceptedTimeSec,
    ).toBeLessThanOrEqual(6.002);
    const retainedExactSourceCount = presentation.reduce(
      (total, sample) =>
        total +
        (isWorkbenchPresentationSampleV3(sample)
          ? sample.presentationEnvelope.sourceSampleCount
          : 0),
      0,
    );
    expect(retainedExactSourceCount).toBeGreaterThanOrEqual(2_990);
    expect(retainedExactSourceCount).toBeLessThanOrEqual(3_010);
    for (const outputId of ["pressure", "flow", "volume"]) {
      const segments = buildSweepingWaveformSegmentsV3(presentation, outputId, {
        windowSec: 6,
        forwardGapFraction: 0,
      });
      expect(segments.flat().length).toBeGreaterThanOrEqual(
        presentation.length,
      );
      expect(segments.flat().length).toBeLessThanOrEqual(
        presentation.length * 4,
      );
      expect(segments.flat().every(({ value }) => Number.isFinite(value)))
        .toBe(true);
    }

    const oneBucket = appendWorkbenchPresentationSamplesV3(
      [],
      [
        sampleV3(0, 0, { pressure: 10 }),
        sampleV3(0.002, 0.002, { pressure: 180 }),
        sampleV3(0.004, 0.004, { pressure: -20 }),
      ],
    );
    expect(oneBucket).toHaveLength(1);
    const projected = buildSweepingWaveformSegmentsV3(oneBucket, "pressure", {
      windowSec: 6,
      forwardGapFraction: 0,
    }).flat();
    expect(projected).toEqual([
      { phaseSec: 0, value: 10 },
      { phaseSec: 0.002, value: 180 },
      { phaseSec: 0.004, value: -20 },
    ]);
  });

  it("starts a new trace on the smallest representable backward clock step", () => {
    const previous = appendWorkbenchPresentationSamplesV3(
      [],
      [sampleV3(1, 0.5, { pressure: 100, volume: 120 })],
    );
    const restoredTimeSec = 1 - Number.EPSILON / 2;
    const restored = sampleV3(restoredTimeSec, 0.25, {
      pressure: 12,
      volume: 99,
    });

    const presentation = appendWorkbenchPresentationSamplesV3(previous, [
      restored,
    ]);

    expect(restoredTimeSec).toBeLessThan(1);
    expect(presentation).toHaveLength(1);
    expect(presentation[0]).toMatchObject(restored);
    expect(presentation[0]?.values).toBe(restored.values);
    expect(presentation[0]?.presentationEnvelope).toEqual({
      bucketOrdinal: 60,
      sourceSampleCount: 1,
      firsts: {
        [TEST_CYCLE_PHASE_OUTPUT_ID_V3]: 0.25,
        pressure: 12,
        volume: 99,
      },
      minimums: {
        [TEST_CYCLE_PHASE_OUTPUT_ID_V3]: 0.25,
        pressure: 12,
        volume: 99,
      },
      maximums: {
        [TEST_CYCLE_PHASE_OUTPUT_ID_V3]: 0.25,
        pressure: 12,
        volume: 99,
      },
      firstPresentationTimesSec: {
        [TEST_CYCLE_PHASE_OUTPUT_ID_V3]: restoredTimeSec,
        pressure: restoredTimeSec,
        volume: restoredTimeSec,
      },
      minimumPresentationTimesSec: {
        [TEST_CYCLE_PHASE_OUTPUT_ID_V3]: restoredTimeSec,
        pressure: restoredTimeSec,
        volume: restoredTimeSec,
      },
      maximumPresentationTimesSec: {
        [TEST_CYCLE_PHASE_OUTPUT_ID_V3]: restoredTimeSec,
        pressure: restoredTimeSec,
        volume: restoredTimeSec,
      },
    });
  });

  it("keeps bounded presentation samples independent per Scenario and clones a visual window safely", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3({
      bucketSec: 0.01,
      windowSec: 0.04,
      capacity: 4,
    });
    let notifications = 0;
    const unsubscribe = store.subscribe(() => {
      notifications += 1;
    });
    const baselineTerminalSample = sampleV3(0.009, 0.01, { pressure: 12 });

    store.append("baseline", [
      sampleV3(0, 0, { pressure: 10 }),
      baselineTerminalSample,
    ]);
    store.append("intervention", [sampleV3(0, 0, { pressure: 80 })]);

    expect(store.scenarioCount).toBe(2);
    expect(store.getScenarioSnapshot("baseline")).toHaveLength(1);
    expect(store.getScenarioSnapshot("baseline")[0]?.acceptedTimeSec).toBe(
      0.009,
    );
    expect(store.getScenarioSnapshot("baseline")[0]?.values).toBe(
      baselineTerminalSample.values,
    );
    expect(store.getScenarioSnapshot("intervention")[0]?.values.pressure).toBe(
      80,
    );

    expect(store.cloneScenario("baseline", "baseline-copy")).toBe(true);
    const clonedWindow = store.getScenarioSnapshot("baseline-copy");
    const clonedExact = store.getScenarioExactOrbitSnapshot("baseline-copy");
    expect(clonedWindow).toBe(store.getScenarioSnapshot("baseline"));
    expect(clonedExact).toBe(store.getScenarioExactOrbitSnapshot("baseline"));
    expect(store.getScenarioOrbitHistorySnapshot("baseline-copy")).toEqual([]);
    store.append("baseline-copy", [sampleV3(0.02, 0.02, { pressure: 20 })]);
    expect(store.getScenarioSnapshot("baseline-copy")).not.toBe(clonedWindow);
    expect(
      store.getScenarioSnapshot("baseline-copy").at(-1)?.presentationTimeSec,
    ).toBe(0.02);
    expect(store.getScenarioExactOrbitSnapshot("baseline-copy")).not.toBe(
      clonedExact,
    );
    expect(store.getScenarioExactOrbitSnapshot("baseline")).toBe(clonedExact);
    expect(store.getScenarioOrbitHistorySnapshot("baseline-copy")).toEqual([]);
    expect(store.getScenarioSnapshot("baseline")).toBe(clonedWindow);
    expect(store.getScenarioSnapshot("baseline")).toHaveLength(1);

    expect(store.resetScenario("baseline")).toBe(true);
    expect(store.getSnapshot()).toHaveProperty("baseline", []);
    expect(store.removeScenario("intervention")).toBe(true);
    expect(store.getSnapshot()).not.toHaveProperty("intervention");
    expect(store.removeScenario("missing")).toBe(false);
    expect(store.cloneScenario("missing", "copy")).toBe(false);
    expect(notifications).toBe(6);
    unsubscribe();
  });

  it("retains exact 2 ms PV samples without presentation bucketing", () => {
    const exact = Array.from({ length: 1_000 }, (_, index) =>
      sampleV3(index * 0.002, (index % 400) / 400, {
        pressure: index,
        volume: 120 - index / 100,
      }),
    );
    const retained = appendWorkbenchExactOrbitSamplesV3([], exact, {
      capacity: 1_200,
      windowSec: 2.1,
    });

    expect(retained).toHaveLength(exact.length);
    expect(retained[537]).toBe(exact[537]);
    expect(
      retained.every((sample) => !("presentationEnvelope" in sample)),
    ).toBe(true);
  });

  it("connects sweep epochs on one timeline and archives exact PV epochs", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3({
      bucketSec: 0.001,
      windowSec: 0.05,
      capacity: 100,
      exactOrbitWindowSec: 1,
      exactOrbitCapacity: 600,
    });
    store.append("baseline", [
      sampleV3(
        0.996,
        0.2,
        { pressure: 80 },
        {
          inputEpoch: 0,
          acceptedRevision: 498,
        },
      ),
      sampleV3(
        0.998,
        0.3,
        { pressure: 82 },
        {
          inputEpoch: 0,
          acceptedRevision: 499,
        },
      ),
    ]);
    store.append("baseline", [
      sampleV3(
        0,
        0,
        { pressure: 90 },
        {
          inputEpoch: 1,
          acceptedRevision: 0,
        },
      ),
      sampleV3(
        0.002,
        0.01,
        { pressure: 92 },
        {
          inputEpoch: 1,
          acceptedRevision: 1,
        },
      ),
    ]);

    const sweep = store.getScenarioSnapshot("baseline");
    expect(sweep.map(({ presentationTimeSec }) => presentationTimeSec)).toEqual(
      [0.996, 0.998, 0.998, 1],
    );
    expect(sweep.map(({ inputEpoch }) => inputEpoch)).toEqual([0, 0, 1, 1]);
    expect(
      buildSweepingWaveformSegmentsV3(sweep, "pressure", {
        windowSec: 6,
        forwardGapFraction: 0,
      }).map((segment) => segment.length),
    ).toEqual([4]);

    expect(
      store
        .getScenarioExactOrbitSnapshot("baseline")
        .map(({ acceptedTimeSec }) => acceptedTimeSec),
    ).toEqual([0, 0.002]);
    expect(store.getScenarioOrbitHistorySnapshot("baseline")).toMatchObject([
      {
        inputEpoch: 0,
        sourceAcceptedRevision: 499,
        sourceAcceptedTimeSec: 0.998,
      },
    ]);
  });

  it("fails closed on an unexpected same-epoch accepted-clock rewind", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3({
      bucketSec: 0.001,
      windowSec: 6,
      capacity: 384,
    });
    store.append("baseline", [
      sampleV3(
        1,
        0.5,
        { pressure: 100 },
        { inputEpoch: 2, acceptedRevision: 500 },
      ),
    ]);
    store.append("baseline", [
      sampleV3(
        0.5,
        0.25,
        { pressure: 80 },
        { inputEpoch: 2, acceptedRevision: 250 },
      ),
    ]);

    expect(store.getScenarioSnapshot("baseline")).toHaveLength(1);
    expect(store.getScenarioSnapshot("baseline")[0]).toMatchObject({
      inputEpoch: 2,
      acceptedRevision: 250,
      acceptedTimeSec: 0.5,
      presentationTimeSec: 0.5,
    });
    expect(store.getScenarioExactOrbitSnapshot("baseline")).toHaveLength(1);
    expect(store.getScenarioOrbitHistorySnapshot("baseline")).toEqual([]);
  });

  it("caps per-Scenario exact orbit history at three completed epochs", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3();
    for (let inputEpoch = 0; inputEpoch <= 4; inputEpoch += 1) {
      store.append("baseline", [
        sampleV3(
          0,
          0,
          { pressure: 80 + inputEpoch },
          { inputEpoch, acceptedRevision: 0 },
        ),
      ]);
    }
    const history = store.getScenarioOrbitHistorySnapshot("baseline");
    expect(history).toHaveLength(WORKBENCH_PRESENTATION_HISTORY_MAX_DEPTH_V3);
    expect(history.map(({ inputEpoch }) => inputEpoch)).toEqual([1, 2, 3]);
    expect(store.getScenarioExactOrbitSnapshot("baseline")[0]?.inputEpoch).toBe(
      4,
    );
  });

  it("fades historical graph states by recency", () => {
    expect([0, 1, 2].map((index) => workbenchHistoryAlphaV3(index, 3))).toEqual(
      [0.08, 0.14, 0.2],
    );
    expect(workbenchHistoryAlphaV3(-1, 3)).toBe(0);
  });

  it("builds compact Scenario groups without repeating Scenario names per trace", () => {
    const model = buildWorkbenchTraceLegendModelV3([
      { traceKey: "a:lvp", scenarioId: "a", scenarioLabel: "Baseline", itemId: "lvp", itemLabel: "LVP", color: "#ff5a78" },
      { traceKey: "a:lap", scenarioId: "a", scenarioLabel: "Baseline", itemId: "lap", itemLabel: "LAP", color: "#b78bfa" },
      { traceKey: "b:lvp", scenarioId: "b", scenarioLabel: "Copy", itemId: "lvp", itemLabel: "LVP", color: "#d58a19" },
      { traceKey: "b:lap", scenarioId: "b", scenarioLabel: "Copy", itemId: "lap", itemLabel: "LAP", color: "#e0a645" },
      { traceKey: "b:lap", scenarioId: "b", scenarioLabel: "Ignored", itemId: "lap", itemLabel: "Ignored", color: "#000000" },
    ]);

    expect(model.mode).toBe("groups");
    expect(model.scenarios.map(({ label }) => label)).toEqual([
      "Baseline",
      "Copy",
    ]);
    expect(model.items.map(({ label }) => label)).toEqual(["LVP", "LAP"]);
    expect(model.traces).toHaveLength(4);
    expect(
      buildWorkbenchTraceLegendModelV3(model.traces.slice(0, 2)).mode,
    ).toBe("items");
  });

  it("uses a soft zero floor and asymmetric headroom without flattening AoP", () => {
    expect(niceNumericDomainV3([3, 122], {
      softZeroFloor: true,
      softZeroSpanFraction: 0.25,
      lowerPaddingFraction: 0.04,
      upperPaddingFraction: 0.12,
      minimumUpperPadding: 3,
    })).toEqual([0, 150]);
    expect(niceNumericDomainV3([72, 122], {
      softZeroFloor: true,
      softZeroSpanFraction: 0.25,
      lowerPaddingFraction: 0.04,
      upperPaddingFraction: 0.12,
      minimumUpperPadding: 3,
    })).toEqual([60, 140]);
  });

  it("materializes one stable color for every Scenario/item trace", () => {
    const pane: ExperimentSurfaceGraphPaneV2 = {
      paneId: "pane/pressure",
      role: "graph",
      label: "Pressure",
      order: 0,
      priority: 10,
      graphId: "graph/pressure",
      scenarioScope: { mode: "visible-scenarios" },
      excludedTraces: [],
      windowSec: 2,
      series: ["lvp", "lap", "aop"].map((seriesId, order) => ({
        seriesId,
        label: seriesId.toUpperCase(),
        order,
      })),
    };
    const surface: ExperimentSurfaceV2 = {
      graphPanes: [pane],
      outputPanes: [],
      controlPanes: [],
      note: { text: "" },
    };
    const reconciled = reconcileWorkbenchGraphColorsV3(surface, [
      { scenarioId: "scenario/a" },
      { scenarioId: "scenario/b" },
    ]);

    expect(reconciled.graphPanes).toHaveLength(1);
    expect(reconciled.graphPanes[0]?.traceColors).toHaveLength(6);
    expect(
      new Set(
        reconciled.graphPanes[0]?.traceColors?.map(
          ({ scenarioId, seriesId }) => `${scenarioId}:${seriesId}`,
        ),
      ).size,
    ).toBe(6);
  });

  it("uses Scenario base color only for future allocations", () => {
    const pane: ExperimentSurfaceGraphPaneV2 = {
      paneId: "pane/pressure",
      role: "graph",
      label: "Pressure",
      order: 0,
      priority: 10,
      graphId: "graph/pressure",
      scenarioScope: { mode: "visible-scenarios" },
      excludedTraces: [],
      windowSec: 2,
      series: [
        {
          seriesId: "lvp",
          label: "LVP",
          order: 0,
        },
      ],
    };
    const allocated = reconcileWorkbenchGraphColorsV3(
      {
        graphPanes: [pane],
        outputPanes: [],
        controlPanes: [],
        note: { text: "" },
      },
      [{ scenarioId: "scenario/a" }],
    );
    const existing = allocated.graphPanes[0]?.traceColors;
    expect(
      updateWorkbenchScenarioBaseColorV3(
        allocated,
        "scenario/missing",
        "#8b76d1",
      ),
    ).toBe(allocated);
    const recoloredBase = updateWorkbenchScenarioBaseColorV3(
      allocated,
      "scenario/a",
      "#8b76d1",
    );
    expect(recoloredBase.graphPanes[0]?.traceColors).toEqual(existing);

    const withNewItem: ExperimentSurfaceV2 = {
      ...recoloredBase,
      graphPanes: [
        {
          ...recoloredBase.graphPanes[0]!,
          series: [
            ...recoloredBase.graphPanes[0]!.series,
            { seriesId: "lap", label: "LAP", order: 1 },
          ],
        },
      ],
    };
    const reconciled = reconcileWorkbenchGraphColorsV3(withNewItem, [
      { scenarioId: "scenario/a" },
    ]);
    expect(
      reconciled.graphPanes[0]?.traceColors?.find(
        ({ seriesId }) => seriesId === "lvp",
      )?.automaticColorHex,
    ).toBe(existing?.[0]?.automaticColorHex);
    expect(
      reconciled.graphPanes[0]?.traceColors?.find(
        ({ seriesId }) => seriesId === "lap",
      )?.automaticColorHex,
    ).toBe(deriveWorkbenchScenarioItemColorV3("#8b76d1", 1));
  });

  it("allocates a single-chamber PV loop from the Scenario base color", () => {
    const pane: ExperimentSurfaceGraphPaneV2 = {
      paneId: "pane/pv",
      role: "graph",
      label: "PV loop",
      order: 0,
      priority: 10,
      graphId: "hemodynamics.pressure-volume",
      scenarioScope: { mode: "visible-scenarios" },
      excludedTraces: [],
      historyDepth: 1,
      pressureVolumeAnalysisMode: "responsive-preview",
      series: [{ seriesId: "LV", label: "LV", order: 0 }],
    };
    const reconciled = reconcileWorkbenchGraphColorsV3(
      {
        graphPanes: [pane],
        outputPanes: [],
        controlPanes: [],
        note: { text: "" },
      },
      [{ scenarioId: "scenario/a" }],
      "series",
    );

    expect(reconciled.scenarioColorSeeds?.[0]?.colorHex).toBe("#2f8fd3");
    expect(reconciled.graphPanes[0]?.traceColors?.[0]?.automaticColorHex)
      .toBe("#2f8fd3");
  });

  it("lets an exact Scenario/item custom color win over its frozen automatic color", () => {
    const surface: ExperimentSurfaceV2 = {
      scenarioColorSeeds: [
        { scenarioId: "scenario/a", colorHex: "#167db8" },
        { scenarioId: "scenario/b", colorHex: "#a96c08" },
      ],
      graphPanes: [],
      outputPanes: [],
      controlPanes: [],
      note: { text: "" },
    };
    const pane: ExperimentSurfaceGraphPaneV2 = {
      paneId: "pane/pressure",
      role: "graph",
      label: "Pressure",
      order: 0,
      priority: 10,
      graphId: "graph/pressure",
      scenarioScope: { mode: "visible-scenarios" },
      excludedTraces: [],
      windowSec: 2,
      traceColors: [
        {
          scenarioId: "scenario/b",
          seriesId: "lvp",
          automaticColorHex: "#a96c08",
          customColorHex: "#db2777",
        },
      ],
      series: [
        {
          seriesId: "lvp",
          label: "LVP",
          order: 0,
        },
      ],
    };
    const style = resolveWorkbenchGraphTraceStyleV3({
      pane,
      surface,
      renderer: "sweep",
      authoredScenarioCount: 2,
      scenarioId: "scenario/b",
      scenarioIndex: 1,
      seriesId: "lvp",
    });

    expect(style).toEqual({ color: "#db2777" });
  });

  it("resolves widely separated one-Scenario item colors per theme", () => {
    const pane: ExperimentSurfaceGraphPaneV2 = {
      paneId: "pane/pressure",
      role: "graph",
      label: "Pressure",
      order: 0,
      priority: 10,
      graphId: "graph/pressure",
      scenarioScope: { mode: "visible-scenarios" },
      excludedTraces: [],
      series: [],
    };
    const surface: ExperimentSurfaceV2 = {
      graphPanes: [pane],
      outputPanes: [],
      controlPanes: [],
      note: { text: "" },
    };
    const color = (seriesId: "LVP" | "LAP" | "AoP", appTheme: "light" | "dark") =>
      resolveWorkbenchGraphTraceStyleV3({
        pane,
        surface,
        renderer: "sweep",
        authoredScenarioCount: 1,
        scenarioId: "scenario/a",
        scenarioIndex: 0,
        seriesId,
        appTheme,
      }).color;

    expect([color("LVP", "dark"), color("LAP", "dark"), color("AoP", "dark")])
      .toEqual(["#ff5a78", "#b78bfa", "#33b1ff"]);
    expect([color("LVP", "light"), color("LAP", "light"), color("AoP", "light")])
      .toEqual(["#c72c50", "#6f42c1", "#0072a8"]);
  });
});

function structuralOrientationV3(
  points: readonly (readonly [number, number])[],
): MainWireIntegratedModelStructuralReturnOrientationV3 {
  return {
    side: "left",
    semantics:
      "frozen-accepted-step-volume-constrained-structural-orientation-not-simulated-response",
    pressureBasis: "absolute",
    sourceAcceptedRevision: 1,
    sourceAcceptedTimeSec: 1,
    downstreamNode: "LA",
    downstreamPressureLabel: "LAP",
    fillingPressureLabel: "Pmpf orientation",
    fillingPressureMmHg: 13,
    operatingPoint: {
      downstreamPressureMmHg: 8,
      returnFlowLPerMin: 5.2,
      returnPath: "PVein_LA",
    },
    anchoring: {
      status: "starling-operating-anchor",
      method: "downstream-pressure-translation",
      downstreamPressureOffsetMmHg: 0,
      volumeResidualMl: 0,
    },
    curve: [
      { downstreamPressureMmHg: -2, returnFlowLPerMin: 7, flowLimited: true },
      { downstreamPressureMmHg: 13, returnFlowLPerMin: 0, flowLimited: false },
    ],
    starlingLocus: {
      status: "responsive-fixed-tbv-preview",
      protocolId: "protocol/test",
      warmupDurationSec: 0,
      measurementDurationSec: 10,
      minimumBeatCount: 3,
      maximumBeatCount: 20,
      slowControllerPolicy: "coronary-tone-frozen-at-branch-source",
      completedPointCount: points.length,
      totalPointCount: points.length,
      points: points.map(
        ([fillingPressureMmHg, cardiacOutputLPerMin], index) => ({
          totalBloodVolumeMl: 3_000 + index * 300,
          fillingPressureMmHg,
          cardiacOutputLPerMin,
          role: index === 2 ? "operating-anchor" : "continuation",
          quality: "locally-converged",
          curveEligible: true,
          completedBeatCount: 3,
          maximumNormalizedBeatDelta: 0.5,
          settled: false,
          finiteAndFixedTbvPassed: true,
          evidence: "responsive-preview",
          measurementWindowStatus: "complete-beat-converged",
          acceptedMeasurementDurationSec: 3,
          ventricularPressureVolumeLoop: Array.from(
            { length: 16 },
            (_, sampleIndex) => ({
              volumeMl: 55 + index * 3 + sampleIndex * 4,
              pressureMmHg: Math.max(
                4,
                90 + index * 8 - sampleIndex * 4,
              ),
            }),
          ),
          ventricularPressureVolumeLandmarks: {
            pressureBasis: "transmural",
            endDiastolic: {
              volumeMl: 120 + index * 5,
              pressureMmHg: 6 + index,
              event: "maximum-volume",
            },
            endSystolic: {
              volumeMl: 55 + index * 3,
              pressureMmHg: 90 + index * 8,
              event: "semilunar-valve-closure",
            },
          },
        }),
      ),
    },
    limitations: [],
  };
}
