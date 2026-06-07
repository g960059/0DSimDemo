import { describe, expect, it } from "vitest";
import {
  integrateFlowVolume,
  regurgitantFractionFromVolumes,
  valveFlowIntegral,
} from "@/engine/flowIntegrals";
import type { SimSample } from "@/engine/protocol";

describe("flow integral helpers", () => {
  it("integrates forward-only flow", () => {
    const samples = [sample(0, { QAo: 10 }), sample(1, { QAo: 10 })];

    expect(valveFlowIntegral(samples, "QAo")).toEqual({
      forwardVolumeMl: 10,
      reverseVolumeMl: 0,
      netVolumeMl: 10,
      regurgitantFraction: 0,
    });
  });

  it("integrates reverse-only flow", () => {
    const samples = [sample(0, { QMV: -4 }), sample(1, { QMV: -4 })];

    expect(valveFlowIntegral(samples, "QMV")).toEqual({
      forwardVolumeMl: 0,
      reverseVolumeMl: 4,
      netVolumeMl: -4,
      regurgitantFraction: 1,
    });
  });

  it("integrates mixed forward, reverse, and net flow", () => {
    const samples = [
      sample(0, { QTV: 12 }),
      sample(1, { QTV: 12 }),
      sample(2, { QTV: -3 }),
      sample(3, { QTV: -3 }),
    ];

    const result = valveFlowIntegral(samples, "QTV");
    expect(result.forwardVolumeMl).toBeCloseTo(18, 12);
    expect(result.reverseVolumeMl).toBeCloseTo(4.5, 12);
    expect(result.netVolumeMl).toBeCloseTo(13.5, 12);
    expect(result.regurgitantFraction).toBeCloseTo(4.5 / 18, 12);
  });

  it("keeps zero-forward regurgitant fraction finite", () => {
    expect(regurgitantFractionFromVolumes(0, 0)).toBe(0);
    expect(regurgitantFractionFromVolumes(0, 5)).toBe(1);
  });

  it("supports caller-provided transforms", () => {
    const samples = [sample(0, { QPV: -2 }), sample(1, { QPV: 6 })];

    expect(integrateFlowVolume(samples, "QPV", Math.abs)).toBe(4);
  });
});

function sample(t: number, flows: Partial<Pick<SimSample, "QMV" | "QAo" | "QTV" | "QPV">>): SimSample {
  return {
    t,
    QMV: 0,
    QAo: 0,
    QTV: 0,
    QPV: 0,
    ...flows,
  } as SimSample;
}
