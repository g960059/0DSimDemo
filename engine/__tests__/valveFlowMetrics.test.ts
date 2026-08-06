import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { runScenario } from "@/engine/harness";
import type { CoreRuntimeParams, SimMetrics } from "@/engine/protocol";

describe("valve flow metrics", () => {
  const run = (params: Partial<CoreRuntimeParams>) =>
    runScenario(params, { settleMode: "converge", measureSeconds: 4 });

  it("reports finite low regurgitant fractions for the normal baseline", () => {
    const metrics = run(DEFAULT_PARAMS).metrics;

    for (const value of valveRegurgitantFractions(metrics)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(0.02);
    }
  });

  it("aortic regurgitation increases aortic reverse volume and regurgitant fraction", () => {
    const baselineMetrics = run(DEFAULT_PARAMS).metrics;
    const arMetrics = run({
      ...DEFAULT_PARAMS,
      AoV_Aleak: DEFAULT_PARAMS.AoV_Amax * 0.083 * 0.6,
    }).metrics;

    expect(arMetrics.AoVReverseVolumeMl).toBeGreaterThan(baselineMetrics.AoVReverseVolumeMl + 0.5);
    expect(arMetrics.AoVRegurgitantFraction).toBeGreaterThan(baselineMetrics.AoVRegurgitantFraction + 0.01);
  });

  it("mitral regurgitation increases mitral reverse volume and regurgitant fraction", () => {
    const baselineMetrics = run(DEFAULT_PARAMS).metrics;
    const mrMetrics = run({
      ...DEFAULT_PARAMS,
      MV_Aleak: DEFAULT_PARAMS.MV_Amax * 0.11,
    }).metrics;

    expect(mrMetrics.MVReverseVolumeMl).toBeGreaterThan(baselineMetrics.MVReverseVolumeMl + 0.5);
    expect(mrMetrics.MVRegurgitantFraction).toBeGreaterThan(baselineMetrics.MVRegurgitantFraction + 0.01);
  });
});

function valveRegurgitantFractions(metrics: SimMetrics): number[] {
  return [
    metrics.MVRegurgitantFraction,
    metrics.AoVRegurgitantFraction,
    metrics.TVRegurgitantFraction,
    metrics.PVRegurgitantFraction,
  ];
}
