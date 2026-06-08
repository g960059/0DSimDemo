import { describe, expect, it } from "vitest";
import type { SimSample } from "@/engine/protocol";
import {
  isDrawablePvLoopBeatData,
  lastCompleteBeatRange,
  pvLoopBeatData,
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
});
