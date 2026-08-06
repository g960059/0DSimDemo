import { describe, expect, it } from "vitest";

import {
  SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3,
  WORKBENCH_PRESENTATION_SAMPLE_CAPACITY_V3,
  WORKBENCH_PRESENTATION_HISTORY_MAX_DEPTH_V3,
  WorkbenchScenarioPresentationSampleStoreV3,
  appendWorkbenchPresentationSamplesV3,
  appendWorkbenchExactOrbitSamplesV3,
  buildSingleBeatPvOrientationGuidesV3,
  buildSweepingWaveformSegmentsV3,
  buildWorkbenchScenarioLegendItemsV3,
  buildWorkbenchTraceColorLegendItemsV3,
  boundedCanvasPixelRatioV3,
  createWorkbenchCanvasFrameSchedulerV3,
  extractLivePvTrajectoryV3,
  extractLastCompletePvBeatV3,
  firstSampleAtOrAfterV3,
  isWorkbenchPresentationSampleV3,
  lastCompleteCycleRangeV3,
  latestSweepingWaveformPointV3,
  nextHystereticNumericDomainV3,
  orderedFiniteWorkbenchSamplesV3,
  projectHistoricalPvEpochV3,
  workbenchScenarioLineDashV3,
  workbenchHistoryAlphaV3,
  type WorkbenchPvPointV3,
  type WorkbenchScalarSampleV3,
} from "@/components/workbench/v3";

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
): WorkbenchScalarSampleV3 => Object.freeze({
  inputEpoch: identity.inputEpoch ?? 0,
  acceptedRevision: identity.acceptedRevision
    ?? Math.max(0, Math.round(acceptedTimeSec / 0.002)),
  acceptedTimeSec,
  presentationTimeSec: identity.presentationTimeSec ?? acceptedTimeSec,
  values: Object.freeze({
    ...values,
    [TEST_CYCLE_PHASE_OUTPUT_ID_V3]: cyclePhase01,
  }),
});

describe("V3-neutral Workbench Canvas helpers", () => {
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
    expect(segments.flat().some(({ phaseSec }) => phaseSec === 0.25)).toBe(false);
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
    expect(latestSweepingWaveformPointV3(
      [...samples, sampleV3(6.5, null, { pressure: null })],
      "pressure",
      6,
    )).toEqual({
      phaseSec: 0.25,
      value: 96,
    });
  });

  it("expands immediately but contracts only after a well-inset range change", () => {
    const previous = Object.freeze([0, 100] as const);

    expect(nextHystereticNumericDomainV3(previous, [10, 90])).toBe(previous);
    const contracted = nextHystereticNumericDomainV3(previous, [35, 60]);
    expect(contracted[0]).toBeGreaterThan(30);
    expect(contracted[1]).toBeLessThan(65);
    expect(nextHystereticNumericDomainV3(previous, [-20, 80])).toEqual([
      -28,
      100,
    ]);
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

    expect(lastCompleteCycleRangeV3(
      samples,
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    )).toEqual({
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
      1.1,
      1.4,
      1.9,
      2.1,
    ]);
    const trajectory = extractLivePvTrajectoryV3(
      samples,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    );
    expect(trajectory.completedBeat).toEqual(beat);
    expect(trajectory.liveSegment.map(({ acceptedTimeSec }) =>
      acceptedTimeSec)).toEqual([2.1, 2.2]);
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

    expect(extractLivePvTrajectoryV3(
      samples,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    )).toEqual({
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

  it("does not infer a complete beat when model cycle phase is absent", () => {
    const samples = [
      sampleV3(0, null, { volume: 100, pressure: 10 }),
      sampleV3(0.5, null, { volume: 80, pressure: 100 }),
      sampleV3(1, null, { volume: 100, pressure: 10 }),
    ];

    expect(lastCompleteCycleRangeV3(
      samples,
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    )).toBeNull();
    expect(extractLastCompletePvBeatV3(
      samples,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
    ))
      .toEqual([]);
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
      "transmural",
      true,
    );
    const reused = projectHistoricalPvEpochV3(
      history,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
      "transmural",
      true,
    );
    const differentGuideMode = projectHistoricalPvEpochV3(
      history,
      "volume",
      "pressure",
      TEST_CYCLE_PHASE_OUTPUT_ID_V3,
      "transmural",
      false,
    );

    expect(reused).toBe(first);
    expect(first.completedBeat.length).toBeGreaterThanOrEqual(3);
    expect(differentGuideMode).not.toBe(first);
    expect(differentGuideMode.orientationGuides).toBeNull();
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
    ].map(([acceptedTimeSec, phase, volume, pressure]) => Object.freeze({
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
    }));

    const beat = extractLastCompletePvBeatV3(
      samples,
      volumeOutputId,
      pressureOutputId,
      cyclePhaseOutputId,
    );

    expect(beat.map(({ acceptedTimeSec }) => acceptedTimeSec)).toEqual([
      1.1,
      1.5,
      1.9,
      2.1,
    ]);
    expect(beat[1]).toMatchObject({
      cyclePhase01: 0.5,
      volumeMl: 78,
      pressureMmHg: 112,
    });
  });

  it("labels single-beat transmural guides and never upgrades them to formal relations", () => {
    const beat: readonly WorkbenchPvPointV3[] = Object.freeze([
      { acceptedTimeSec: 0, cyclePhase01: 0, volumeMl: 120, pressureMmHg: 10 },
      { acceptedTimeSec: 0.2, cyclePhase01: 0.2, volumeMl: 110, pressureMmHg: 80 },
      { acceptedTimeSec: 0.4, cyclePhase01: 0.4, volumeMl: 60, pressureMmHg: 120 },
      { acceptedTimeSec: 0.6, cyclePhase01: 0.6, volumeMl: 65, pressureMmHg: 20 },
      { acceptedTimeSec: 0.9, cyclePhase01: 0.9, volumeMl: 120, pressureMmHg: 10 },
    ].map((point) => Object.freeze(point)));

    const guides = buildSingleBeatPvOrientationGuidesV3(beat, "transmural");
    expect(guides?.semantics).toBe(
      SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3,
    );
    expect(guides?.endSystolicRadialReference)
      .toContainEqual(guides?.systolicReferenceContact);
    expect(guides?.klotzInformedDiastolicReference)
      .toContainEqual(guides?.maximumVolumeContact);
    expect(buildSingleBeatPvOrientationGuidesV3(beat, "intracavitary"))
      .toBeNull();
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

    const malformed = [ordered[2]!, sampleV3(Number.NaN, null, {}), ordered[0]!];
    expect(orderedFiniteWorkbenchSamplesV3(malformed).map((sample) =>
      sample.acceptedTimeSec)).toEqual([0, 0.004]);
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
      () => { renderCount += 1; },
      (callback) => {
        requestCount += 1;
        pending = callback;
        return requestCount;
      },
      () => { cancelCount += 1; },
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
      presentation = appendWorkbenchPresentationSamplesV3(
        presentation,
        batch,
      );
      expect(presentation.length)
        .toBeLessThanOrEqual(WORKBENCH_PRESENTATION_SAMPLE_CAPACITY_V3);
    }

    expect(presentation.length).toBeLessThanOrEqual(362);
    expect(presentation.at(-1)!.acceptedTimeSec
      - presentation[0]!.acceptedTimeSec).toBeLessThanOrEqual(6.002);
    const retainedExactSourceCount = presentation.reduce(
      (total, sample) => total + (isWorkbenchPresentationSampleV3(sample)
        ? sample.presentationEnvelope.sourceSampleCount
        : 0),
      0,
    );
    expect(retainedExactSourceCount).toBeGreaterThanOrEqual(2_990);
    expect(retainedExactSourceCount).toBeLessThanOrEqual(3_010);
    for (const outputId of ["pressure", "flow", "volume"]) {
      const segments = buildSweepingWaveformSegmentsV3(
        presentation,
        outputId,
        { windowSec: 6, forwardGapFraction: 0 },
      );
      expect(segments.flat()).toHaveLength(presentation.length);
      expect(segments.flat().every((point) =>
        point.envelopeMinimum !== undefined
        && point.envelopeMaximum !== undefined)).toBe(true);
    }

    const oneBucket = appendWorkbenchPresentationSamplesV3([], [
      sampleV3(0, 0, { pressure: 10 }),
      sampleV3(0.002, 0.002, { pressure: 180 }),
      sampleV3(0.004, 0.004, { pressure: -20 }),
    ]);
    expect(oneBucket).toHaveLength(1);
    const projected = buildSweepingWaveformSegmentsV3(
      oneBucket,
      "pressure",
      { windowSec: 6, forwardGapFraction: 0 },
    ).flat();
    expect(projected[0]).toMatchObject({
      value: -20,
      envelopeMinimum: -20,
      envelopeMaximum: 180,
    });
  });

  it("starts a new trace on the smallest representable backward clock step", () => {
    const previous = appendWorkbenchPresentationSamplesV3([], [
      sampleV3(1, 0.5, { pressure: 100, volume: 120 }),
    ]);
    const restoredTimeSec = 1 - Number.EPSILON / 2;
    const restored = sampleV3(
      restoredTimeSec,
      0.25,
      { pressure: 12, volume: 99 },
    );

    const presentation = appendWorkbenchPresentationSamplesV3(
      previous,
      [restored],
    );

    expect(restoredTimeSec).toBeLessThan(1);
    expect(presentation).toHaveLength(1);
    expect(presentation[0]).toMatchObject(restored);
    expect(presentation[0]?.values).toBe(restored.values);
    expect(presentation[0]?.presentationEnvelope).toEqual({
      bucketOrdinal: 60,
      sourceSampleCount: 1,
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
    });
  });

  it("keeps bounded presentation samples independent per Scenario and clones a visual window safely", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3({
      bucketSec: 0.01,
      windowSec: 0.04,
      capacity: 4,
    });
    let notifications = 0;
    const unsubscribe = store.subscribe(() => { notifications += 1; });
    const baselineTerminalSample = sampleV3(0.009, 0.01, { pressure: 12 });

    store.append("baseline", [
      sampleV3(0, 0, { pressure: 10 }),
      baselineTerminalSample,
    ]);
    store.append("intervention", [
      sampleV3(0, 0, { pressure: 80 }),
    ]);

    expect(store.scenarioCount).toBe(2);
    expect(store.getScenarioSnapshot("baseline")).toHaveLength(1);
    expect(store.getScenarioSnapshot("baseline")[0]?.acceptedTimeSec)
      .toBe(0.009);
    expect(store.getScenarioSnapshot("baseline")[0]?.values)
      .toBe(baselineTerminalSample.values);
    expect(store.getScenarioSnapshot("intervention")[0]?.values.pressure)
      .toBe(80);

    expect(store.cloneScenario("baseline", "baseline-copy")).toBe(true);
    const clonedWindow = store.getScenarioSnapshot("baseline-copy");
    const clonedExact = store.getScenarioExactOrbitSnapshot("baseline-copy");
    expect(clonedWindow).toBe(store.getScenarioSnapshot("baseline"));
    expect(clonedExact).toBe(store.getScenarioExactOrbitSnapshot("baseline"));
    expect(store.getScenarioOrbitHistorySnapshot("baseline-copy")).toEqual([]);
    store.append("baseline-copy", [
      sampleV3(0.02, 0.02, { pressure: 20 }),
    ]);
    expect(store.getScenarioSnapshot("baseline-copy")).not.toBe(clonedWindow);
    expect(store.getScenarioSnapshot("baseline-copy").at(-1)
      ?.presentationTimeSec).toBe(0.02);
    expect(store.getScenarioExactOrbitSnapshot("baseline-copy"))
      .not.toBe(clonedExact);
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
    const exact = Array.from({ length: 1_000 }, (_, index) => sampleV3(
      index * 0.002,
      (index % 400) / 400,
      { pressure: index, volume: 120 - index / 100 },
    ));
    const retained = appendWorkbenchExactOrbitSamplesV3([], exact, {
      capacity: 1_200,
      windowSec: 2.1,
    });

    expect(retained).toHaveLength(exact.length);
    expect(retained[537]).toBe(exact[537]);
    expect(retained.every((sample) =>
      !("presentationEnvelope" in sample))).toBe(true);
  });

  it("keeps sweep time monotonic across input epochs and archives exact PV epochs", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3({
      bucketSec: 0.001,
      windowSec: 0.05,
      capacity: 100,
      exactOrbitWindowSec: 1,
      exactOrbitCapacity: 600,
    });
    store.append("baseline", [
      sampleV3(0.996, 0.2, { pressure: 80 }, {
        inputEpoch: 0,
        acceptedRevision: 498,
      }),
      sampleV3(0.998, 0.3, { pressure: 82 }, {
        inputEpoch: 0,
        acceptedRevision: 499,
      }),
    ]);
    store.append("baseline", [
      sampleV3(0, 0, { pressure: 90 }, {
        inputEpoch: 1,
        acceptedRevision: 0,
      }),
      sampleV3(0.002, 0.01, { pressure: 92 }, {
        inputEpoch: 1,
        acceptedRevision: 1,
      }),
    ]);

    const sweep = store.getScenarioSnapshot("baseline");
    expect(sweep.map(({ presentationTimeSec }) => presentationTimeSec))
      .toEqual([0.996, 0.998, 0.998, 1]);
    expect(sweep.map(({ inputEpoch }) => inputEpoch)).toEqual([0, 0, 1, 1]);
    expect(buildSweepingWaveformSegmentsV3(sweep, "pressure", {
      windowSec: 6,
      forwardGapFraction: 0,
    }).map((segment) => segment.length)).toEqual([2, 2]);

    expect(store.getScenarioExactOrbitSnapshot("baseline").map(
      ({ acceptedTimeSec }) => acceptedTimeSec,
    )).toEqual([0, 0.002]);
    expect(store.getScenarioOrbitHistorySnapshot("baseline")).toMatchObject([{
      inputEpoch: 0,
      sourceAcceptedRevision: 499,
      sourceAcceptedTimeSec: 0.998,
    }]);
  });

  it("fails closed on an unexpected same-epoch accepted-clock rewind", () => {
    const store = new WorkbenchScenarioPresentationSampleStoreV3({
      bucketSec: 0.001,
      windowSec: 6,
      capacity: 384,
    });
    store.append("baseline", [sampleV3(
      1,
      0.5,
      { pressure: 100 },
      { inputEpoch: 2, acceptedRevision: 500 },
    )]);
    store.append("baseline", [sampleV3(
      0.5,
      0.25,
      { pressure: 80 },
      { inputEpoch: 2, acceptedRevision: 250 },
    )]);

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
      store.append("baseline", [sampleV3(
        0,
        0,
        { pressure: 80 + inputEpoch },
        { inputEpoch, acceptedRevision: 0 },
      )]);
    }
    const history = store.getScenarioOrbitHistorySnapshot("baseline");
    expect(history).toHaveLength(WORKBENCH_PRESENTATION_HISTORY_MAX_DEPTH_V3);
    expect(history.map(({ inputEpoch }) => inputEpoch)).toEqual([1, 2, 3]);
    expect(store.getScenarioExactOrbitSnapshot("baseline")[0]?.inputEpoch)
      .toBe(4);
  });

  it("fades historical graph states by recency", () => {
    expect([0, 1, 2].map((index) => workbenchHistoryAlphaV3(index, 3)))
      .toEqual([0.08, 0.14, 0.2]);
    expect(workbenchHistoryAlphaV3(-1, 3)).toBe(0);
  });

  it("uses signal/chamber color and Scenario dash as independent legend axes", () => {
    expect([0, 1, 2, 3].map(workbenchScenarioLineDashV3)).toEqual([
      [],
      [7, 4],
      [2, 3],
      [8, 3, 2, 3],
    ]);
    expect(() => workbenchScenarioLineDashV3(4)).toThrow(/between 0 and 3/);
    const scenarioItems = buildWorkbenchScenarioLegendItemsV3([
      { scenarioId: "baseline", scenarioLabel: "Baseline", scenarioStatus: "live" },
      { scenarioId: "baseline", scenarioLabel: "Ignored duplicate" },
      { scenarioId: "afterload", scenarioLabel: "Afterload", scenarioStatus: "cached" },
      { scenarioId: "inotrope", scenarioLabel: "Inotrope", scenarioStyleIndex: 3 },
    ]);
    expect(scenarioItems).toEqual([
      {
        scenarioId: "baseline",
        label: "Baseline",
        status: "live",
        styleIndex: 0,
        lineDash: [],
      },
      {
        scenarioId: "afterload",
        label: "Afterload",
        status: "cached",
        styleIndex: 1,
        lineDash: [7, 4],
      },
      {
        scenarioId: "inotrope",
        label: "Inotrope",
        styleIndex: 3,
        lineDash: [8, 3, 2, 3],
      },
    ]);
    expect(buildWorkbenchTraceColorLegendItemsV3([
      { colorKey: "lvp", label: "LVP", color: "#ef4444" },
      { colorKey: "lvp", label: "LVP duplicate", color: "#000000" },
      { colorKey: "lap", label: "LAP", color: "#0ea5e9" },
    ])).toEqual([
      { colorKey: "lvp", label: "LVP", color: "#ef4444" },
      { colorKey: "lap", label: "LAP", color: "#0ea5e9" },
    ]);
  });
});
