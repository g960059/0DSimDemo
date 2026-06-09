import { describe, expect, it } from "vitest";
import { pvLoopEndSystolicPoint, type PvLoopBeatData } from "@/components/pvLoopPoints";

function beat(points: Array<{ v: number; p: number }>): PvLoopBeatData {
  return {
    beatRange: { start: 0, end: points.length, closingIndex: -1 },
    beatSampleCount: points.length,
    points,
    vMin: Math.min(...points.map((point) => point.v)),
    vMax: Math.max(...points.map((point) => point.v)),
  };
}

describe("pvLoopEndSystolicPoint", () => {
  it("extracts the max-elastance point for ventricular beats", () => {
    const point = pvLoopEndSystolicPoint(beat([
      { v: 130, p: 10 },
      { v: 90, p: 120 },
      { v: 60, p: 95 },
      { v: 110, p: 20 },
    ]), "LV");

    expect(point).toMatchObject({
      chamber: "LV",
      v: 60,
      p: 95,
      pointIndex: 2,
      method: "max-elastance",
      quality: "ok",
    });
  });

  it("marks low volume-margin points as warning quality", () => {
    const point = pvLoopEndSystolicPoint(beat([
      { v: 3, p: 18 },
      { v: 20, p: 45 },
    ]), "RV");

    expect(point?.quality).toBe("warning");
  });

  it("does not extract atrial ESPVR guide points", () => {
    expect(pvLoopEndSystolicPoint(beat([{ v: 30, p: 8 }, { v: 20, p: 10 }]), "LA")).toBeNull();
  });
});
