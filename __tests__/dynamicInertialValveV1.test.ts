import { describe, expect, it } from "vitest";
import {
  backwardEulerDynamicValveFlowV1,
  backwardEulerDynamicValveOpeningFractionV1,
  evaluateDynamicInertialValveV1,
  type DynamicInertialValveParamsV1,
} from "@/engine/mechanics2/valve/DynamicInertialValveV1";

const PARAMS: DynamicInertialValveParamsV1 = Object.freeze({
  valveId: "MV",
  openAreaCm2: 4,
  minimumAreaCm2: 0.04,
  bloodDensityKgPerM3: 1_060,
  effectiveLengthCm: 1,
  openLinearResistanceMmHgSecPerMl: 0.001,
  openingRatePerMmHgSec: 26.7,
  closingRatePerMmHgSec: 26.7,
  openingThresholdMmHg: 0,
  closingThresholdMmHg: 0,
  driveTransitionWidthMmHg: 0.05,
  flowSmoothingMlPerSec: 0.5,
});

describe("DynamicInertialValveV1", () => {
  it("keeps the exact backward-Euler opening update bounded without clamps", () => {
    for (const previous of [0, 0.2, 0.8, 1]) {
      for (const pressureGradient of [-100, -2, -0.01, 0, 0.01, 3, 100]) {
        for (const dtSec of [0.001, 0.005, 0.1, 1]) {
          const opening = backwardEulerDynamicValveOpeningFractionV1(
            previous,
            pressureGradient,
            dtSec,
            PARAMS,
          );
          expect(opening).toBeGreaterThanOrEqual(0);
          expect(opening).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("solves both implicit residuals and derives L and B from geometry", () => {
    const previous = { qMlPerSec: 12, openingFraction01: 0.25 };
    const input = {
      dtSec: 0.005,
      upstreamPressureMmHg: 12,
      downstreamPressureMmHg: 9,
    };
    const opening = backwardEulerDynamicValveOpeningFractionV1(
      previous.openingFraction01,
      3,
      input.dtSec,
      PARAMS,
    );
    const flow = backwardEulerDynamicValveFlowV1(
      previous,
      opening,
      input,
      PARAMS,
    );
    const output = evaluateDynamicInertialValveV1(
      previous,
      { qMlPerSec: flow, openingFraction01: opening },
      input,
      PARAMS,
    );
    expect(Math.abs(output.openingStateResidual01)).toBeLessThan(1e-12);
    expect(Math.abs(output.openingStateResidualLogit)).toBeLessThan(1e-12);
    expect(Math.abs(output.pressureFlowResidualMmHg)).toBeLessThan(1e-10);
    expect(output.inertanceMmHgSec2PerMl).toBeCloseTo(
      1_060 * 1e-4 / (133.322 * output.effectiveAreaCm2),
      14,
    );
    expect(output.bernoulliMmHgSec2PerMl2).toBeCloseTo(
      0.5 * 1_060 * 1e-4 /
        (133.322 * output.effectiveAreaCm2 ** 2),
      14,
    );
    expect(output.dissipatedPowerMmHgMlPerSec).toBeGreaterThanOrEqual(0);
  });

  it("has unit pressure-gradient slope at fixed independent area", () => {
    const previous = { qMlPerSec: 20, openingFraction01: 0.5 };
    const candidate = { qMlPerSec: 10, openingFraction01: 0.4 };
    const baseInput = {
      dtSec: 0.005,
      upstreamPressureMmHg: 10,
      downstreamPressureMmHg: 9,
    };
    const h = 1e-6;
    const minus = evaluateDynamicInertialValveV1(
      previous,
      candidate,
      { ...baseInput, upstreamPressureMmHg: 10 - h },
      PARAMS,
    );
    const plus = evaluateDynamicInertialValveV1(
      previous,
      candidate,
      { ...baseInput, upstreamPressureMmHg: 10 + h },
      PARAMS,
    );
    expect(
      (plus.pressureFlowResidualMmHg - minus.pressureFlowResidualMmHg) /
        (2 * h),
    ).toBeCloseTo(1, 8);
  });
});
