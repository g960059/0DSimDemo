import { describe, expect, it } from "vitest";

import {
  createScientificWorkbenchDisplayClockV1,
} from "@/components/scientificProduct/ScientificWorkbenchDisplayClockV1";
import {
  projectScientificTransientPhasesV1,
  scientificOpenTransientElapsedSecondsV1,
  scientificSharedOpenTransientElapsedSecondsV1,
  scientificPvHistoryAlphaV1,
  scientificPvTrajectoriesV1,
  normalizeScientificPvHistoryBeatsV1,
  type ScientificWorkbenchPvSeriesV1,
} from "@/components/scientificProduct/ScientificWorkbenchAnimatedChartsV1";

describe("scientific Workbench display clock V1", () => {
  it("fades the eighth prior PV trajectory completely and bounds persistent history", () => {
    expect(scientificPvHistoryAlphaV1(0, 8, "fade")).toBe(1);
    expect(scientificPvHistoryAlphaV1(1, 8, "fade")).toBeGreaterThan(0);
    expect(scientificPvHistoryAlphaV1(7, 8, "fade")).toBeGreaterThan(0);
    expect(scientificPvHistoryAlphaV1(8, 8, "fade")).toBe(0);
    expect(scientificPvHistoryAlphaV1(1, 8, "persistent")).toBe(0.34);
    expect(scientificPvHistoryAlphaV1(8, 8, "persistent")).toBe(0.34);
    expect(scientificPvHistoryAlphaV1(9, 8, "persistent")).toBe(0);
    expect(normalizeScientificPvHistoryBeatsV1(99)).toBe(16);
    expect(normalizeScientificPvHistoryBeatsV1(-2)).toBe(0);
  });

  it("retains the source periodic PV loop at transition age zero and ages it by accepted beats", () => {
    const sourcePoints = Object.freeze([
      Object.freeze({
        timeSec: 0,
        volume: 40,
        pressure: 5,
        breakBefore: true,
      }),
      Object.freeze({
        timeSec: 1,
        volume: 70,
        pressure: 120,
        breakBefore: false,
      }),
    ]);
    const item = pvSeries([
      pvFrame(10, 55, 10),
      pvFrame(10.2, 54, 12),
    ]);

    const initial = scientificPvTrajectoriesV1(item, 8, sourcePoints);
    expect(initial.map(({ age, kind }) => ({ age, kind }))).toEqual([
      { age: 0, kind: "transient" },
      { age: 0, kind: "retained-source-periodic" },
    ]);
    expect(initial.find(({ kind }) => kind === "retained-source-periodic")?.points)
      .toBe(sourcePoints);

    const afterOneBeat = scientificPvTrajectoriesV1(pvSeries([
      pvFrame(10, 55, 10),
      pvFrame(10.5, 54, 12),
      pvFrame(11, 53, 13),
      pvFrame(11.1, 52, 14),
    ]), 8, sourcePoints);
    expect(afterOneBeat.find(({ kind }) =>
      kind === "retained-source-periodic")?.age).toBe(1);
    expect(scientificPvHistoryAlphaV1(1, 8, "fade")).toBeLessThan(1);
    expect(scientificPvTrajectoriesV1(item, 0, sourcePoints))
      .not.toContainEqual(expect.objectContaining({
        kind: "retained-source-periodic",
      }));
  });

  it("breaks a live waveform path when the sweep phase wraps", () => {
    const projected = projectScientificTransientPhasesV1(
      [1.96, 1.98, 2, 2.02],
      2,
    );

    expect(projected.map(({ breakBefore }) => breakBefore)).toEqual([
      true,
      false,
      true,
      false,
    ]);
    expect(projected.map(({ phase }) => phase)).toEqual([
      1.96,
      1.98,
      0,
      expect.closeTo(0.02, 12),
    ]);
  });

  it("anchors an open transient to its retained accepted-time origin", () => {
    const scenario = {
      id: "live-a",
      frames: [{ acceptedTimeSec: 42.75 }],
      transientOriginAcceptedTimeSec: 40.5,
      displayedEvidence: "open-transient-no-periodic-claim",
    } as unknown as Parameters<typeof scientificOpenTransientElapsedSecondsV1>[0];

    expect(scientificOpenTransientElapsedSecondsV1(scenario)).toBe(2.25);
    expect(scientificOpenTransientElapsedSecondsV1({
      ...scenario,
      displayedEvidence: "retained-period1-source-cycle",
    })).toBeNull();
    expect(scientificOpenTransientElapsedSecondsV1({
      ...scenario,
      transientOriginAcceptedTimeSec: 43,
    })).toBeNull();
    expect(scientificSharedOpenTransientElapsedSecondsV1([
      { scenario },
      { scenario },
    ])).toBe(2.25);
    expect(scientificSharedOpenTransientElapsedSecondsV1([
      { scenario },
      { scenario: { ...scenario, id: "live-b" } },
    ])).toBeNull();
  });

  it("freezes while paused and resumes from the retained presentation phase", () => {
    const clock = createScientificWorkbenchDisplayClockV1(true, 1, 1_000);

    expect(clock.read(2_500)).toMatchObject({
      running: true,
      timeScale: 1,
      elapsedSeconds: 1.5,
    });

    clock.configure(false, 1, 2_500);
    expect(clock.read(20_000)).toMatchObject({
      running: false,
      timeScale: 1,
      elapsedSeconds: 1.5,
    });

    clock.configure(true, 1, 20_000);
    expect(clock.read(20_750)).toMatchObject({
      running: true,
      timeScale: 1,
      elapsedSeconds: 2.25,
    });
  });

  it("changes time scale without introducing a phase jump", () => {
    const clock = createScientificWorkbenchDisplayClockV1(true, 1, 0);

    expect(clock.read(1_000).elapsedSeconds).toBe(1);
    clock.configure(true, 2, 1_000);
    expect(clock.read(1_000).elapsedSeconds).toBe(1);
    expect(clock.read(2_000).elapsedSeconds).toBe(3);

    clock.configure(true, 0.5, 2_000);
    expect(clock.read(2_000).elapsedSeconds).toBe(3);
    expect(clock.read(3_000).elapsedSeconds).toBe(3.5);
  });

  it("rejects non-positive and non-finite time scales", () => {
    expect(() => createScientificWorkbenchDisplayClockV1(true, 0, 0)).toThrow(
      /time scale must be positive/,
    );

    const clock = createScientificWorkbenchDisplayClockV1(true, 1, 0);
    expect(() => clock.configure(true, Number.NaN, 500)).toThrow(
      /time scale must be positive/,
    );
    expect(clock.read(1_000).elapsedSeconds).toBe(1);
  });
});

function pvSeries(
  frames: readonly ReturnType<typeof pvFrame>[],
): ScientificWorkbenchPvSeriesV1 {
  return {
    key: "scenario-1:lv",
    volumeObservableId: "hemodynamics.volume.LV",
    pressureObservableId: "hemodynamics.pressure.absolute.LV",
    signalName: "Left ventricle",
    color: "#4da3ff",
    scenario: {
      id: "scenario-1",
      name: "Scenario 1",
      color: "#4da3ff",
      isVisible: true,
      frames,
      periodicCycleFrames: null,
      cycleDurationSec: 1,
      transientOriginAcceptedTimeSec: 10,
      displayedEvidence: "open-transient-no-periodic-claim",
    },
  } as ScientificWorkbenchPvSeriesV1;
}

function pvFrame(
  acceptedTimeSec: number,
  volume: number,
  pressure: number,
) {
  return {
    acceptedTimeSec,
    values: {
      "hemodynamics.volume.LV": {
        availability: "available",
        value: volume,
      },
      "hemodynamics.pressure.absolute.LV": {
        availability: "available",
        value: pressure,
      },
    },
  } as const;
}
