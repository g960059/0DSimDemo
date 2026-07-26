import { describe, expect, it } from "vitest";

import {
  createScientificWorkbenchDisplayClockV1,
} from "@/components/scientificProduct/ScientificWorkbenchDisplayClockV1";
import {
  projectScientificTransientPhasesV1,
  scientificOpenTransientElapsedSecondsV1,
  scientificSharedOpenTransientElapsedSecondsV1,
  scientificPvHistoryAlphaV1,
  scientificPvParameterGenerationAlphaV1,
  scientificPvTrajectoryDomainPointsV1,
  scientificPvTrajectoriesV1,
  normalizeScientificPvHistoryBeatsV1,
  normalizeScientificPvParameterHistoryCountV1,
  scientificWaveformTransitionValuesV1,
  scientificWaveformRetainsParameterGenerationV1,
  type ScientificWorkbenchWaveformSeriesV1,
  type ScientificWorkbenchPvSeriesV1,
} from "@/components/scientificProduct/ScientificWorkbenchAnimatedChartsV1";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";

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

  it("uses the bounded 0/1/3/5/6 parameter-generation history scale", () => {
    expect(normalizeScientificPvParameterHistoryCountV1(Number.NaN)).toBe(0);
    expect(normalizeScientificPvParameterHistoryCountV1(0)).toBe(0);
    expect(normalizeScientificPvParameterHistoryCountV1(1)).toBe(1);
    expect(normalizeScientificPvParameterHistoryCountV1(3)).toBe(3);
    expect(normalizeScientificPvParameterHistoryCountV1(5)).toBe(5);
    expect(normalizeScientificPvParameterHistoryCountV1(6)).toBe(6);
    expect(normalizeScientificPvParameterHistoryCountV1(99)).toBe(6);
    expect(scientificPvParameterGenerationAlphaV1(1, 6)).toBeGreaterThan(
      scientificPvParameterGenerationAlphaV1(6, 6),
    );
    expect(scientificPvParameterGenerationAlphaV1(6, 6)).toBeGreaterThan(0);
    expect(scientificPvParameterGenerationAlphaV1(7, 6)).toBe(0);
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

  it("includes a previous parameter loop in ordinary beat history even when parameter history is off", () => {
    const oldCycle = Object.freeze([
      pvFrame(8, 35, -5),
      pvFrame(8.5, 90, 160),
      pvFrame(9, 35, -5),
    ]);
    const item = pvSeries([
      pvFrame(10, 55, 10),
      pvFrame(10.2, 54, 12),
    ]);
    const withHistory = {
      ...item,
      scenario: {
        ...item.scenario,
        parameterGenerationHistory: [{
          targetGeneration: 4,
          parameterEpoch: 4,
          controlStateSha256: "a".repeat(64),
          frames: oldCycle,
          periodicCycleFrames: oldCycle,
          cycleDurationSec: 1,
          transientOriginAcceptedTimeSec: 8,
          displayedEvidence: "open-transient-no-periodic-claim" as const,
        }],
      },
    } as ScientificWorkbenchPvSeriesV1;

    const trajectories = scientificPvTrajectoriesV1(
      withHistory,
      8,
      undefined,
      6,
    );
    expect(trajectories).toEqual(expect.arrayContaining([
      expect.objectContaining({
        age: expect.closeTo(1.2, 12),
        kind: "parameter-boundary",
        parameterHistoryAge: 1,
      }),
    ]));
    const domainPoints = scientificPvTrajectoryDomainPointsV1(trajectories);
    expect(Math.min(...domainPoints.map(({ volume }) => volume))).toBe(35);
    expect(Math.max(...domainPoints.map(({ pressure }) => pressure))).toBe(160);
    expect(scientificPvTrajectoriesV1(
      withHistory,
      8,
      undefined,
      0,
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "parameter-boundary",
      }),
    ]));

    const withPartialHistory = {
      ...withHistory,
      scenario: {
        ...withHistory.scenario,
        parameterGenerationHistory: [{
          ...withHistory.scenario.parameterGenerationHistory[0]!,
          periodicCycleFrames: null,
          cycleDurationSec: null,
        }],
      },
    } as ScientificWorkbenchPvSeriesV1;
    expect(scientificPvTrajectoriesV1(
      withPartialHistory,
      8,
      undefined,
      6,
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "parameter-boundary",
        parameterHistoryAge: 1,
        points: expect.arrayContaining([
          expect.objectContaining({ volume: 35, pressure: -5 }),
          expect.objectContaining({ volume: 90, pressure: 160 }),
        ]),
      }),
    ]));
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

  it("retains waveform parameter history only until the new window is full", () => {
    const scenario = {
      id: "live-a",
      frames: [pvFrame(10, 0, 0), pvFrame(14.99, 0, 0)],
      parameterGenerationHistory: [{
        frames: [pvFrame(5, 0, 0), pvFrame(10, 0, 0)],
      }],
      transientOriginAcceptedTimeSec: 10,
      displayedEvidence: "open-transient-no-periodic-claim",
    } as unknown as Parameters<
      typeof scientificWaveformRetainsParameterGenerationV1
    >[0];

    expect(scientificWaveformRetainsParameterGenerationV1(scenario, 5))
      .toBe(true);
    expect(scientificWaveformRetainsParameterGenerationV1({
      ...scenario,
      frames: [pvFrame(10, 0, 0), pvFrame(15, 0, 0)],
    }, 5)).toBe(false);
  });

  it("joins the previous and incoming waveform into one full-alpha sweep", () => {
    const previousFrames = Object.freeze([
      waveformFrame(8, 80),
      waveformFrame(9, 90),
      waveformFrame(9.9, 99),
    ]);
    const currentFrames = Object.freeze([
      waveformFrame(10, 100),
      waveformFrame(10.2, 102),
    ]);
    const item = {
      key: "scenario-1:aop",
      observableId: "hemodynamics.pressure.absolute.Ao",
      signalName: "AoP",
      color: "#4da3ff",
      scenario: {
        id: "scenario-1",
        name: "Scenario 1",
        color: "#4da3ff",
        isVisible: true,
        frames: currentFrames,
        parameterGenerationHistory: [{
          targetGeneration: 0,
          parameterEpoch: 0,
          controlStateSha256: "a".repeat(64),
          frames: previousFrames,
          periodicCycleFrames: null,
          cycleDurationSec: 1,
          transientOriginAcceptedTimeSec: 8,
          displayedEvidence: "open-transient-no-periodic-claim" as const,
        }],
        periodicCycleFrames: null,
        cycleDurationSec: 1,
        transientOriginAcceptedTimeSec: 10,
        displayedEvidence: "open-transient-no-periodic-claim" as const,
      },
    } as ScientificWorkbenchWaveformSeriesV1;

    const transition = scientificWaveformTransitionValuesV1(item, 5);
    expect(transition.retainsPreviousGeneration).toBe(true);
    expect(transition.values.map(({ value }) => value)).toEqual([
      80,
      90,
      99,
      100,
      102,
    ]);
    expect(transition.values.map(({ timeSec }) => timeSec)).toEqual([
      3,
      4,
      4.9,
      0,
      expect.closeTo(0.2, 12),
    ]);
    expect(transition.values.map(({ breakBefore }) => breakBefore)).toEqual([
      true,
      false,
      false,
      true,
      false,
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
      parameterGenerationHistory: [],
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
): MainWireScientificObservableFrameV1 {
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
  } as unknown as MainWireScientificObservableFrameV1;
}

function waveformFrame(
  acceptedTimeSec: number,
  pressureMmHg: number,
): MainWireScientificObservableFrameV1 {
  return {
    acceptedTimeSec,
    values: {
      "hemodynamics.pressure.absolute.Ao": {
        availability: "available",
        value: pressureMmHg,
      },
    },
  } as unknown as MainWireScientificObservableFrameV1;
}
