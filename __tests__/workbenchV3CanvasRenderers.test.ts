import { describe, expect, it } from "vitest";

import {
  SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3,
  WORKBENCH_PRESENTATION_SAMPLE_CAPACITY_V3,
  WorkbenchPresentationSampleStoreV3,
  appendWorkbenchPresentationSamplesV3,
  buildSingleBeatPvOrientationGuidesV3,
  buildSweepingWaveformSegmentsV3,
  boundedCanvasPixelRatioV3,
  createWorkbenchCanvasFrameSchedulerV3,
  extractLastCompletePvBeatV3,
  firstSampleAtOrAfterV3,
  isWorkbenchPresentationSampleV3,
  lastCompleteCycleRangeV3,
  nextHystereticNumericDomainV3,
  orderedFiniteWorkbenchSamplesV3,
  type WorkbenchPvPointV3,
  type WorkbenchScalarSampleV3,
} from "@/components/workbench/v3";

const sampleV3 = (
  acceptedTimeSec: number,
  cyclePhase01: number | null,
  values: Readonly<Record<string, number | null>>,
): WorkbenchScalarSampleV3 => Object.freeze({
  acceptedTimeSec,
  cyclePhase01,
  values: Object.freeze(values),
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

    expect(lastCompleteCycleRangeV3(samples)).toEqual({
      startIndex: 2,
      endIndexInclusive: 5,
    });
    const beat = extractLastCompletePvBeatV3(samples, "volume", "pressure");
    expect(beat.map(({ acceptedTimeSec }) => acceptedTimeSec)).toEqual([
      1.1,
      1.4,
      1.9,
      2.1,
    ]);
  });

  it("does not infer a complete beat when model cycle phase is absent", () => {
    const samples = [
      sampleV3(0, null, { volume: 100, pressure: 10 }),
      sampleV3(0.5, null, { volume: 80, pressure: 100 }),
      sampleV3(1, null, { volume: 100, pressure: 10 }),
    ];

    expect(lastCompleteCycleRangeV3(samples)).toBeNull();
    expect(extractLastCompletePvBeatV3(samples, "volume", "pressure"))
      .toEqual([]);
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
      minimums: { pressure: 12, volume: 99 },
      maximums: { pressure: 12, volume: 99 },
    });
  });

  it("invalidates only active presentation-store subscribers", () => {
    const store = new WorkbenchPresentationSampleStoreV3();
    let visiblePaneNotifications = 0;
    const unsubscribe = store.subscribe(() => {
      visiblePaneNotifications += 1;
    });
    store.append([sampleV3(0, 0, { pressure: 10 })]);
    expect(visiblePaneNotifications).toBe(1);
    expect(store.subscriberCount).toBe(1);

    unsubscribe();
    store.append([sampleV3(0.002, 0.002, { pressure: 20 })]);
    expect(visiblePaneNotifications).toBe(1);
    expect(store.subscriberCount).toBe(0);
    expect(store.getSnapshot()).toHaveLength(1);
  });
});
