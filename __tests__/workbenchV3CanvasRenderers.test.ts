import { describe, expect, it } from "vitest";

import {
  SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3,
  buildSingleBeatPvOrientationGuidesV3,
  buildSweepingWaveformSegmentsV3,
  extractLastCompletePvBeatV3,
  lastCompleteCycleRangeV3,
  nextHystereticNumericDomainV3,
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
});
