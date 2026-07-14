import { describe, expect, it } from "vitest";

import {
  ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_BOUNDARY_V1,
  VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  initialPeriodicPrescribedCalciumDriverStateV1,
  trialPeriodicPrescribedCalciumDriverV1,
  type PeriodicPrescribedCalciumDriverParamsV1,
} from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV1";

const ventricular: PeriodicPrescribedCalciumDriverParamsV1 = {
  targetId: "LV-free-wall",
  cycleLengthSec: 1,
  eventOnsetSec: 0,
  eventStrength01: 1,
  calcium: VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  minimumReleaseSamples: 4,
};

describe("PeriodicPrescribedCalciumDriverV1", () => {
  it("keeps event timing separate from a dimensional two-state calcium waveform", () => {
    let state = initialPeriodicPrescribedCalciumDriverStateV1();
    let peak = 0;
    let peakTime = 0;
    for (let step = 1; step <= 200; step += 1) {
      const trial = trialPeriodicPrescribedCalciumDriverV1(state, step * 0.005, 0.005, ventricular);
      expect(trial.valid, trial.issues.join(", ")).toBe(true);
      state = trial.nextState;
      if (trial.freeCalciumUM > peak) {
        peak = trial.freeCalciumUM;
        peakTime = step * 0.005;
      }
    }
    expect(peak).toBeGreaterThan(0.75);
    expect(peak).toBeLessThan(0.95);
    expect(peakTime).toBeGreaterThan(0.07);
    expect(peakTime).toBeLessThan(0.12);
    expect(PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_BOUNDARY_V1.conservedCalciumCycling)
      .toBe(false);
  });

  it("wraps a late atrial event without resetting its calcium states", () => {
    const params: PeriodicPrescribedCalciumDriverParamsV1 = {
      targetId: "LA",
      cycleLengthSec: 1,
      eventOnsetSec: 0.78,
      eventStrength01: 1,
      calcium: ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
      minimumReleaseSamples: 4,
    };
    let state = initialPeriodicPrescribedCalciumDriverStateV1();
    let beforeWrap = 0;
    let afterWrap = 0;
    for (let step = 1; step <= 220; step += 1) {
      const trial = trialPeriodicPrescribedCalciumDriverV1(state, step * 0.005, 0.005, params);
      expect(trial.valid, trial.issues.join(", ")).toBe(true);
      state = trial.nextState;
      if (step === 199) beforeWrap = trial.freeCalciumUM;
      if (step === 201) afterWrap = trial.freeCalciumUM;
    }
    expect(beforeWrap).toBeGreaterThan(params.calcium.rateTargets[2]!.diastolicCalciumUM);
    expect(afterWrap).toBeGreaterThan(params.calcium.rateTargets[2]!.diastolicCalciumUM);
  });

  it("rejects a step that can skip the finite-width release pulse", () => {
    const trial = trialPeriodicPrescribedCalciumDriverV1(
      initialPeriodicPrescribedCalciumDriverStateV1(),
      0.02,
      0.02,
      ventricular,
    );
    expect(trial.valid).toBe(false);
    expect(trial.nextState).toBe(trial.previousState);
    expect(trial.issues.join(" ")).toMatch(/too coarse/);
  });
});
