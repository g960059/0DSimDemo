import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
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
    const neutral = applyKnobs(DEFAULT_PARAMS, neutralKnobs(DEFAULT_PARAMS), KNOB_MAPPING_VERSION);
    const ar = applyKnobs(DEFAULT_PARAMS, { ...neutralKnobs(DEFAULT_PARAMS), aorticRegurgitation: 0.6 }, KNOB_MAPPING_VERSION);
    const baselineMetrics = run(neutral).metrics;
    const arMetrics = run(ar).metrics;

    expect(arMetrics.AoVReverseVolumeMl).toBeGreaterThan(baselineMetrics.AoVReverseVolumeMl + 0.5);
    expect(arMetrics.AoVRegurgitantFraction).toBeGreaterThan(baselineMetrics.AoVRegurgitantFraction + 0.01);
  });

  it("mitral regurgitation increases mitral reverse volume and regurgitant fraction", () => {
    const neutral = applyKnobs(DEFAULT_PARAMS, neutralKnobs(DEFAULT_PARAMS), KNOB_MAPPING_VERSION);
    const mr = applyKnobs(DEFAULT_PARAMS, { ...neutralKnobs(DEFAULT_PARAMS), mitralRegurgitation: 1.0 }, KNOB_MAPPING_VERSION);
    const baselineMetrics = run(neutral).metrics;
    const mrMetrics = run(mr).metrics;

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
