import { describe, expect, it } from "vitest";

import {
  createScientificWorkbenchDisplayClockV1,
} from "@/components/scientificProduct/ScientificWorkbenchDisplayClockV1";
import {
  projectScientificTransientPhasesV1,
  scientificOpenTransientElapsedSecondsV1,
  scientificSharedOpenTransientElapsedSecondsV1,
  scientificPvHistoryAlphaV1,
  normalizeScientificPvHistoryBeatsV1,
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
