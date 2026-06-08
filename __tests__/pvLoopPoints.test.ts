import { describe, expect, it } from "vitest";
import type { SimSample } from "@/engine/protocol";
import {
  isCompletePvLoopBeatAfterBufferStart,
  isDrawablePvLoopBeatData,
  lastCompleteBeatRange,
  pvLoopBeatData,
  pvLoopBeatDataForDisplay,
  pvLoopCurrentBufferForDisplay,
} from "@/components/pvLoopPoints";

const sample = (phi: number, v: number): SimSample => ({
  t: phi,
  phi,
  VLV: v,
  LVP: v + 100,
  VLA: v + 1,
  LAP: v + 2,
  VRV: v + 3,
  RVP: v + 4,
  VRA: v + 5,
  RAP: v + 6,
} as SimSample);

const sampleAt = (t: number, phi: number, v: number): SimSample => ({
  ...sample(phi, v),
  t,
  phi,
} as SimSample);

describe("PV loop point helpers", () => {
  it("uses the last complete beat and includes the closing point", () => {
    const buf = [
      sample(0, 10),
      sample(0.5, 20),
      sample(1, 30),
      sample(1.5, 40),
      sample(2, 50),
      sample(2.1, 60),
    ];

    expect(lastCompleteBeatRange(buf)).toEqual({ start: 2, end: 5, closingIndex: 5 });

    const beat = pvLoopBeatData(buf, "LV");
    expect(beat?.beatSampleCount).toBe(4);
    expect(beat?.points).toEqual([
      { v: 30, p: 130 },
      { v: 40, p: 140 },
      { v: 50, p: 150 },
      { v: 60, p: 160 },
    ]);
    expect(beat?.vMin).toBe(30);
    expect(beat?.vMax).toBe(60);
  });

  it("uses the available partial beat before the first completed beat", () => {
    const buf = [
      sample(0, 10),
      sample(0.4, 20),
      sample(0.8, 30),
    ];

    expect(lastCompleteBeatRange(buf)).toEqual({ start: 0, end: 3, closingIndex: -1 });
    expect(pvLoopBeatData(buf, "RV")?.points).toEqual([
      { v: 13, p: 14 },
      { v: 23, p: 24 },
      { v: 33, p: 34 },
    ]);
  });

  it("keeps the existing LA minimum sample guard", () => {
    const shortLa = pvLoopBeatData([
      sample(0, 10),
      sample(0.5, 20),
      sample(1, 30),
    ], "LA");

    expect(shortLa).toBeDefined();
    expect(isDrawablePvLoopBeatData("LV", shortLa!)).toBe(true);
    expect(isDrawablePvLoopBeatData("LA", shortLa!)).toBe(false);
  });

  it("uses only post-break samples for the promoted current loop", () => {
    const oldSamples = [
      sampleAt(8.0, 20.0, 10),
      sampleAt(8.4, 20.5, 20),
      sampleAt(8.8, 21.0, 30),
      sampleAt(9.0, 21.1, 40),
    ];
    const newSamples = [
      sampleAt(10.0, 7.3, 100),
      sampleAt(10.4, 7.8, 110),
      sampleAt(10.8, 8.05, 120),
    ];

    expect(pvLoopCurrentBufferForDisplay([...oldSamples, ...newSamples], 10)).toEqual(newSamples);
  });

  it("keeps the previous ghost available before the promoted current beat is complete", () => {
    const previousBuffer = [
      sampleAt(8.0, 20.0, 10),
      sampleAt(8.4, 20.5, 20),
      sampleAt(8.8, 21.0, 30),
      sampleAt(9.0, 21.1, 40),
    ];
    const currentPartial = [
      sampleAt(10.0, 7.3, 100),
      sampleAt(10.4, 7.8, 110),
      sampleAt(10.8, 8.05, 120),
    ];

    const display = pvLoopBeatDataForDisplay({
      buffer: [...previousBuffer, ...currentPartial],
      previousBuffer,
      waveformBreakT: 10,
      chamber: "LV",
      showPrevious: true,
    });

    expect(display.currentBuffer).toEqual(currentPartial);
    expect(display.currentBeatData).toBeNull();
    expect(display.previousBeatData?.points).toEqual([
      { v: 10, p: 110 },
      { v: 20, p: 120 },
      { v: 30, p: 130 },
      { v: 40, p: 140 },
    ]);
  });

  it("shows the promoted current loop after a complete post-break beat exists", () => {
    const currentComplete = [
      sampleAt(10.0, 7.3, 100),
      sampleAt(10.4, 7.8, 110),
      sampleAt(10.8, 8.0, 120),
      sampleAt(11.2, 8.5, 130),
      sampleAt(11.6, 9.0, 140),
      sampleAt(12.0, 9.1, 150),
    ];

    const display = pvLoopBeatDataForDisplay({
      buffer: currentComplete,
      waveformBreakT: 10,
      chamber: "LV",
      showPrevious: false,
    });

    expect(display.currentBeatData).not.toBeNull();
    expect(isCompletePvLoopBeatAfterBufferStart(currentComplete, display.currentBeatData!)).toBe(true);
    expect(display.currentBeatData?.points).toEqual([
      { v: 120, p: 220 },
      { v: 130, p: 230 },
      { v: 140, p: 240 },
      { v: 150, p: 250 },
    ]);
  });
});
