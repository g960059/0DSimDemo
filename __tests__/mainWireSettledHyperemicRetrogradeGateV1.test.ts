import { describe, expect, it } from "vitest";

import {
  measureSettledHyperemicRetrogradeGateV1,
} from "@/tools/coronary/measureSettledHyperemicRetrogradeGateV1";

describe("settled maximal-hyperemia retrograde gate V1", () => {
  it("pins the LAD subendocardial material-retrograde window and nadir", () => {
    const measurement = measureSettledHyperemicRetrogradeGateV1();

    expect(measurement).toMatchObject({
      settlingCycleCount: 3,
      measurementCycleIndex: 4,
      maximalHyperemia01: 1,
      flowSite: "LAD.subendocardial.precapillary-R1",
      materialRetrogradeThresholdMlPerSec: -0.5,
      window: {
        startPhaseSec: 0.898,
        endPhaseSec: 0.97,
        widthSec: 0.072,
        firstThresholdSamplePhaseSec: 0.9,
        lastThresholdSamplePhaseSec: 0.968,
      },
      nadir: {
        phaseSec: 0.914,
      },
    });
    expectRelative(
      measurement.nadir.magnitudeMlPerSec,
      2.1872647659423703,
      1e-12,
    );
    expect(measurement.roughness.ratio).toBeGreaterThanOrEqual(1);
    expect(measurement.roughness.ratio).toBeLessThanOrEqual(1 + 1e-12);
  }, 30_000);
});

function expectRelative(
  actual: number,
  expected: number,
  tolerance: number,
): void {
  expect(Math.abs(actual - expected) / Math.abs(expected))
    .toBeLessThanOrEqual(tolerance);
}
