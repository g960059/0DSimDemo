import { describe, expect, it } from "vitest";

import {
  ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_V2,
  initialPeriodicPrescribedCalciumDriverStateV2,
  propagatePeriodicPrescribedCalciumIntervalV2,
  trialPeriodicPrescribedCalciumDriverV2,
  type PeriodicPrescribedCalciumDriverParamsV2,
  type PeriodicPrescribedCalciumDriverStateV2,
} from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2";

const atrial: PeriodicPrescribedCalciumDriverParamsV2 = {
  targetId: "LA",
  cycleLengthSec: 1,
  eventOnsetSec: 0.78,
  eventStrength01: 1,
  calcium: ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  minimumReleaseSamples: 4,
};

describe("PeriodicPrescribedCalciumDriverV2", () => {
  it("splits a non-aligned release boundary and preserves interval composition", () => {
    const previous = Object.freeze({ riseState01: 0.17, decayState01: 0.09 });
    const whole = propagatePeriodicPrescribedCalciumIntervalV2(previous, 0.785, 0.807, atrial);
    const first = propagatePeriodicPrescribedCalciumIntervalV2(previous, 0.785, 0.7993, atrial);
    const second = propagatePeriodicPrescribedCalciumIntervalV2(
      first.nextState,
      0.7993,
      0.807,
      atrial,
    );

    expect(whole.releaseBoundaryCount).toBe(1);
    expect(Math.abs(whole.nextState.riseState01 - second.nextState.riseState01))
      .toBeLessThan(1e-12);
    expect(Math.abs(whole.nextState.decayState01 - second.nextState.decayState01))
      .toBeLessThan(1e-12);

    const crossing = trialPeriodicPrescribedCalciumDriverV2(previous, 0.790, 0.005, atrial);
    expect(crossing.valid, crossing.issues.join(", ")).toBe(true);
    expect(crossing.integrationAudit.endpointReleaseBoundaryCount).toBe(1);
    expect(crossing.midpointFreeCalciumUM).toBeGreaterThan(0);
    expect(PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_V2.sharedMyocardiumV1Modified)
      .toBe(false);
  });

  it("agrees at common physical nodes across 5, 2.5, and 1.25 ms grids", () => {
    const coarse = runTo(1, 0.005);
    const medium = runTo(1, 0.0025);
    const fine = runTo(1, 0.00125);
    for (const field of ["riseState01", "decayState01"] as const) {
      expect(Math.abs(coarse[field] - medium[field])).toBeLessThan(2e-12);
      expect(Math.abs(medium[field] - fine[field])).toBeLessThan(2e-12);
    }
  });

  it("handles a release that continues across the cardiac-cycle boundary", () => {
    const wrapped: PeriodicPrescribedCalciumDriverParamsV2 = {
      ...atrial,
      eventOnsetSec: 0.985,
    };
    const previous = Object.freeze({ riseState01: 0.03, decayState01: 0.02 });
    const whole = propagatePeriodicPrescribedCalciumIntervalV2(previous, 0.99, 1.02, wrapped);
    const left = propagatePeriodicPrescribedCalciumIntervalV2(previous, 0.99, 1, wrapped);
    const right = propagatePeriodicPrescribedCalciumIntervalV2(left.nextState, 1, 1.02, wrapped);
    expect(Math.abs(whole.nextState.riseState01 - right.nextState.riseState01))
      .toBeLessThan(1e-12);
    expect(Math.abs(whole.nextState.decayState01 - right.nextState.decayState01))
      .toBeLessThan(1e-12);
  });
});

function runTo(endTimeSec: number, dtSec: number): PeriodicPrescribedCalciumDriverStateV2 {
  let state = initialPeriodicPrescribedCalciumDriverStateV2();
  const steps = Math.round(endTimeSec / dtSec);
  for (let step = 1; step <= steps; step += 1) {
    const trial = trialPeriodicPrescribedCalciumDriverV2(state, step * dtSec, dtSec, atrial);
    expect(trial.valid, trial.issues.join(", ")).toBe(true);
    state = trial.nextState;
  }
  return state;
}
