import { describe, expect, it } from "vitest";

import {
  measureSettledHyperemicRetrogradeGateV1,
} from "@/tools/coronary/measureSettledHyperemicRetrogradeGateV1";

describe("settled maximal-hyperemia retrograde gate V1", () => {
  it("derives and pins the settled LAD subendocardial precapillary-R1 gate", () => {
    const measurement = measureSettledHyperemicRetrogradeGateV1();

    expect(measurement).toMatchObject({
      gateId:
        "settled-lad-subendocardial-precapillary-r1-maximal-hyperemia-tone-floor-retrograde-gate-v1",
      settlingCycleCount: 11,
      measurementCycleIndex: 12,
      maximalHyperemia01: 1,
      flowSite: "LAD.subendocardial.precapillary-R1",
      materialRetrogradeThresholdMlPerSec: -0.5,
      window: {
        startPhaseSec: 0.9,
        endPhaseSec: 0.97,
        widthSec: 0.07,
        firstThresholdSamplePhaseSec: 0.902,
        lastThresholdSamplePhaseSec: 0.968,
      },
      nadir: {
        phaseSec: 0.916,
      },
      convergence: {
        criterionId: "consecutive-cycle-four-pin-convergence-v1",
        previousSettlingCycleCount: 10,
        previousMeasurementCycleIndex: 11,
        nadirMagnitudeRelativeTolerance: 1e-4,
        nadirPhaseDifferenceSec: 0,
        windowStartDifferenceSec: 0,
        windowWidthDifferenceSec: 0,
        timePinsRequireExactNominalGridAgreement: true,
      },
    });
    expectRelative(
      measurement.nadir.magnitudeMlPerSec,
      2.2890876548286965,
      1e-12,
    );
    expect(measurement.convergence.nadirMagnitudeRelativeDifference)
      .toBeLessThanOrEqual(
        measurement.convergence.nadirMagnitudeRelativeTolerance,
      );
    // For a unimodal bracket the ratio is exactly one by construction. This
    // bound guards only extra total variation from ringing inside the window.
    expect(measurement.roughness.ratio).toBeGreaterThanOrEqual(1);
    expect(measurement.roughness.ratio).toBeLessThanOrEqual(1 + 1e-12);
  }, 45_000);
});

function expectRelative(
  actual: number,
  expected: number,
  tolerance: number,
): void {
  expect(Math.abs(actual - expected) / Math.abs(expected))
    .toBeLessThanOrEqual(tolerance);
}
