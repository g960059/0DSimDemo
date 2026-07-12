import { describe, expect, it } from "vitest";

import {
  FIXED_CONTRACTILE_HILL_MAPPING_V1,
  advanceContractileActivationExactV1,
  calciumDriveFromEventsV1,
  calciumKernelTimeToPeakSecV1,
  fixedContractileHillDriveV1,
  initialEventDrivenContractileActivationStateV1,
  measureActivationTimingV1,
  normalizedCalciumKernelV1,
  readCalciumKernelTimingV1,
  stepEventDrivenContractileActivationV1,
  validateEventDrivenContractileActivationParamsV1,
  type ActivationTimingSampleV1,
  type EventDrivenContractileActivationParamsV1,
} from "@/engine/mechanics2/activation/EventDrivenContractileActivationV1";

const LOCAL_EVENT_PARAMS: EventDrivenContractileActivationParamsV1 = {
  electricalEventReference: "local-atrial-depolarization",
  electricalToCalciumDelaySec: 0.015,
  calciumKernel: {
    riseTauSec: 0.025,
    decayTauSec: 0.075,
  },
  contractileKinetics: {
    onRatePerSec: 40,
    offRatePerSec: 14,
  },
};

const PRESCRIBED_EVENT_PARAMS: EventDrivenContractileActivationParamsV1 = {
  ...LOCAL_EVENT_PARAMS,
  electricalEventReference: "prescribed-calcium-onset",
  electricalToCalciumDelaySec: 0,
};

describe("EventDrivenContractileActivationV1", () => {
  it("normalizes the analytic C1 Ca-like kernel at its closed-form peak", () => {
    const kernel = PRESCRIBED_EVENT_PARAMS.calciumKernel;
    const timeToPeakSec = calciumKernelTimeToPeakSecV1(kernel);
    const expectedTimeToPeakSec = kernel.riseTauSec * Math.log1p(
      2 * kernel.decayTauSec / kernel.riseTauSec,
    );

    expect(timeToPeakSec).toBeCloseTo(expectedTimeToPeakSec, 15);
    expect(normalizedCalciumKernelV1(-0.01, kernel)).toBe(0);
    expect(normalizedCalciumKernelV1(0, kernel)).toBe(0);
    expect(normalizedCalciumKernelV1(timeToPeakSec, kernel)).toBeCloseTo(1, 14);

    const epsilonSec = 1e-7;
    const rightDerivativeAtOnset = normalizedCalciumKernelV1(epsilonSec, kernel) /
      epsilonSec;
    expect(rightDerivativeAtOnset).toBeLessThan(0.01);
    expect(normalizedCalciumKernelV1(timeToPeakSec - 1e-5, kernel)).toBeLessThan(1);
    expect(normalizedCalciumKernelV1(timeToPeakSec + 1e-5, kernel)).toBeLessThan(1);
  });

  it("reports kernel TTP and falling-limb RT50 without treating them as stress timing", () => {
    const timing = readCalciumKernelTimingV1(PRESCRIBED_EVENT_PARAMS.calciumKernel);

    expect(timing.peakValue).toBe(1);
    expect(timing.timeToPeakSec).toBeGreaterThan(0);
    expect(timing.relaxationTimeTo50Sec).toBeGreaterThan(0);
    expect(timing.halfRelaxationTimeSinceOnsetSec).toBe(
      timing.timeToPeakSec + timing.relaxationTimeTo50Sec,
    );
    expect(normalizedCalciumKernelV1(
      timing.halfRelaxationTimeSinceOnsetSec,
      PRESCRIBED_EVENT_PARAMS.calciumKernel,
    )).toBeCloseTo(0.5, 14);
  });

  it("sums causal event tails without modulo, cycle reset, or order dependence", () => {
    const events = [{ timeSec: 0 }, { timeSec: 0.08 }];
    const timeSec = 0.12;
    const first = calciumDriveFromEventsV1(
      timeSec,
      [events[0]!],
      PRESCRIBED_EVENT_PARAMS,
    );
    const second = calciumDriveFromEventsV1(
      timeSec,
      [events[1]!],
      PRESCRIBED_EVENT_PARAMS,
    );
    const summed = calciumDriveFromEventsV1(
      timeSec,
      events,
      PRESCRIBED_EVENT_PARAMS,
    );
    const reversed = calciumDriveFromEventsV1(
      timeSec,
      [...events].reverse(),
      PRESCRIBED_EVENT_PARAMS,
    );

    expect(first).toBeGreaterThan(0);
    expect(second).toBeGreaterThan(0);
    expect(summed).toBeCloseTo(first + second, 15);
    expect(reversed).toBeCloseTo(summed, 15);
    expect(summed).toBeGreaterThan(first);
    expect(summed).toBeGreaterThan(second);

    const oldTailAtArbitraryLaterTime = calciumDriveFromEventsV1(
      0.83,
      [{ timeSec: 0 }],
      PRESCRIBED_EVENT_PARAMS,
    );
    expect(oldTailAtArbitraryLaterTime).toBe(
      normalizedCalciumKernelV1(0.83, PRESCRIBED_EVENT_PARAMS.calciumKernel),
    );
    expect(oldTailAtArbitraryLaterTime).toBeGreaterThan(0);
  });

  it("uses a fixed saturating Hill mapping while allowing overlapped drive above one", () => {
    expect(FIXED_CONTRACTILE_HILL_MAPPING_V1).toEqual({
      halfMaxCalciumDrive: 0.5,
      coefficient: 2,
    });
    expect(fixedContractileHillDriveV1(0)).toBe(0);
    expect(fixedContractileHillDriveV1(0.5)).toBe(0.5);
    expect(fixedContractileHillDriveV1(1)).toBeCloseTo(0.8, 15);
    expect(fixedContractileHillDriveV1(2)).toBeGreaterThan(0.9);
    expect(fixedContractileHillDriveV1(Number.MAX_VALUE)).toBe(1);
  });

  it("advances the bounded state by the exact constant-drive solution", () => {
    const previous = { activation01: 0.23 };
    const dtSec = 0.037;
    const hillDrive01 = 0.7;
    const kinetics = { onRatePerSec: 40, offRatePerSec: 10 };
    const onRate = kinetics.onRatePerSec * hillDrive01;
    const offRate = kinetics.offRatePerSec * (1 - hillDrive01);
    const totalRate = onRate + offRate;
    const equilibrium = onRate / totalRate;
    const expected = equilibrium +
      (previous.activation01 - equilibrium) * Math.exp(-totalRate * dtSec);

    const oneStep = advanceContractileActivationExactV1(
      previous,
      dtSec,
      hillDrive01,
      kinetics,
    );
    const firstHalf = advanceContractileActivationExactV1(
      previous,
      0.5 * dtSec,
      hillDrive01,
      kinetics,
    );
    const twoHalves = advanceContractileActivationExactV1(
      firstHalf,
      0.5 * dtSec,
      hillDrive01,
      kinetics,
    );

    expect(oneStep.activation01).toBeCloseTo(expected, 15);
    expect(twoHalves.activation01).toBeCloseTo(oneStep.activation01, 15);
    expect(oneStep.activation01).toBeGreaterThanOrEqual(0);
    expect(oneStep.activation01).toBeLessThanOrEqual(1);
    expect(advanceContractileActivationExactV1(
      { activation01: 1 },
      10,
      0,
      kinetics,
    ).activation01).toBeGreaterThanOrEqual(0);
    expect(advanceContractileActivationExactV1(
      { activation01: 0 },
      10,
      1,
      kinetics,
    ).activation01).toBeLessThanOrEqual(1);
  });

  it("makes the midpoint frozen-drive convention explicit in the event-to-state step", () => {
    const state = initialEventDrivenContractileActivationStateV1();
    const beforeOnset = stepEventDrivenContractileActivationV1(
      state,
      { stepStartTimeSec: 0, dtSec: 0.02, events: [{ timeSec: 0 }] },
      LOCAL_EVENT_PARAMS,
    );
    const afterOnset = stepEventDrivenContractileActivationV1(
      beforeOnset.state,
      { stepStartTimeSec: 0.015, dtSec: 0.02, events: [{ timeSec: 0 }] },
      LOCAL_EVENT_PARAMS,
    );

    expect(beforeOnset.driveSampleTimeSec).toBe(0.01);
    expect(beforeOnset.calciumDrive).toBe(0);
    expect(beforeOnset.state.activation01).toBe(0);
    expect(afterOnset.driveSampleTimeSec).toBe(0.025);
    expect(afterOnset.calciumDrive).toBeGreaterThan(0);
    expect(afterOnset.hillDrive01).toBeGreaterThan(0);
    expect(afterOnset.state.activation01).toBeGreaterThan(0);
    expect(afterOnset.constantDriveEquilibriumActivation01).toBeGreaterThan(0);
    expect(afterOnset.activationRateAtStepStartPerSec).toBeGreaterThan(0);
  });

  it("measures contractile TTP and baseline-relative RT50 from a sampled trace", () => {
    const samples: readonly ActivationTimingSampleV1[] = [
      { timeSec: 0, activation01: 0.2 },
      { timeSec: 1, activation01: 0.4 },
      { timeSec: 2, activation01: 1.0 },
      { timeSec: 3, activation01: 0.6 },
      { timeSec: 4, activation01: 0.2 },
    ];
    const timing = measureActivationTimingV1(
      samples,
      { timeSec: 0.5 },
      {
        electricalEventReference: "local-atrial-depolarization",
        electricalToCalciumDelaySec: 0.1,
      },
    );

    expect(timing.electricalEventReference).toBe("local-atrial-depolarization");
    expect(timing.electricalEventTimeSec).toBe(0.5);
    expect(timing.calciumOnsetTimeSec).toBe(0.6);
    expect(timing.baselineActivation01).toBeCloseTo(0.3, 15);
    expect(timing.peakActivation01).toBe(1);
    expect(timing.peakTimeSec).toBe(2);
    expect(timing.timeFromElectricalEventToPeakSec).toBe(1.5);
    expect(timing.timeFromCalciumOnsetToPeakSec).toBe(1.4);
    expect(timing.halfRelaxationActivation01).toBeCloseTo(0.65, 15);
    expect(timing.halfRelaxationTimeSec).toBeCloseTo(2.875, 15);
    expect(timing.relaxationTimeTo50Sec).toBeCloseTo(0.875, 15);
    expect(timing.reachedHalfRelaxation).toBe(true);
  });

  it("reports an unreached RT50 explicitly instead of inventing a finite fallback", () => {
    const timing = measureActivationTimingV1(
      [
        { timeSec: 0, activation01: 0 },
        { timeSec: 0.1, activation01: 0.8 },
        { timeSec: 0.2, activation01: 1 },
        { timeSec: 0.3, activation01: 0.9 },
      ],
      { timeSec: 0 },
      {
        electricalEventReference: "prescribed-calcium-onset",
        electricalToCalciumDelaySec: 0,
      },
    );

    expect(timing.reachedHalfRelaxation).toBe(false);
    expect(timing.halfRelaxationTimeSec).toBeNull();
    expect(timing.relaxationTimeTo50Sec).toBeNull();
  });

  it("keeps a generated single-event response bounded and yields finite contractile timing", () => {
    const dtSec = 0.0005;
    const event = { timeSec: 0 };
    let state = initialEventDrivenContractileActivationStateV1();
    const samples: ActivationTimingSampleV1[] = [
      { timeSec: -0.02, activation01: state.activation01 },
    ];
    for (let stepStartTimeSec = -0.02; stepStartTimeSec < 0.8; stepStartTimeSec += dtSec) {
      const output = stepEventDrivenContractileActivationV1(
        state,
        { stepStartTimeSec, dtSec, events: [event] },
        LOCAL_EVENT_PARAMS,
      );
      state = output.state;
      expect(state.activation01).toBeGreaterThanOrEqual(0);
      expect(state.activation01).toBeLessThanOrEqual(1);
      samples.push({
        timeSec: output.stepEndTimeSec,
        activation01: state.activation01,
      });
    }
    const timing = measureActivationTimingV1(samples, event, LOCAL_EVENT_PARAMS);

    expect(timing.peakActivation01).toBeGreaterThan(0);
    expect(timing.peakActivation01).toBeLessThanOrEqual(1);
    expect(timing.timeFromElectricalEventToPeakSec).toBeGreaterThan(
      LOCAL_EVENT_PARAMS.electricalToCalciumDelaySec,
    );
    expect(timing.timeFromCalciumOnsetToPeakSec).toBeGreaterThan(0);
    expect(timing.reachedHalfRelaxation).toBe(true);
    expect(timing.relaxationTimeTo50Sec).not.toBeNull();
    expect(timing.relaxationTimeTo50Sec!).toBeGreaterThan(0);
  });

  it("rejects invalid parameters and state instead of silently clamping them", () => {
    expect(() => initialEventDrivenContractileActivationStateV1(-0.01))
      .toThrow(/activation01/);
    expect(() => initialEventDrivenContractileActivationStateV1(1.01))
      .toThrow(/activation01/);
    expect(() => validateEventDrivenContractileActivationParamsV1({
      ...LOCAL_EVENT_PARAMS,
      calciumKernel: { ...LOCAL_EVENT_PARAMS.calciumKernel, riseTauSec: 0 },
    })).toThrow(/riseTauSec/);
    expect(() => validateEventDrivenContractileActivationParamsV1({
      ...LOCAL_EVENT_PARAMS,
      contractileKinetics: { ...LOCAL_EVENT_PARAMS.contractileKinetics, offRatePerSec: Number.NaN },
    })).toThrow(/offRatePerSec/);
    expect(() => validateEventDrivenContractileActivationParamsV1({
      ...PRESCRIBED_EVENT_PARAMS,
      electricalToCalciumDelaySec: 0.01,
    })).toThrow(/must be zero/);
    expect(() => fixedContractileHillDriveV1(-1)).toThrow(/calciumDrive/);
    expect(() => advanceContractileActivationExactV1(
      { activation01: 1.1 },
      0.001,
      0.5,
      LOCAL_EVENT_PARAMS.contractileKinetics,
    )).toThrow(/previous.activation01/);
    expect(() => stepEventDrivenContractileActivationV1(
      { activation01: 0 },
      { stepStartTimeSec: 0, dtSec: 0, events: [] },
      LOCAL_EVENT_PARAMS,
    )).toThrow(/dtSec/);
    expect(() => calciumDriveFromEventsV1(
      0,
      [{ timeSec: Number.POSITIVE_INFINITY }],
      LOCAL_EVENT_PARAMS,
    )).toThrow(/events\[0\].timeSec/);
    expect(() => measureActivationTimingV1(
      [
        { timeSec: 0, activation01: 0 },
        { timeSec: 0, activation01: 1 },
      ],
      { timeSec: 0 },
      {
        electricalEventReference: "prescribed-calcium-onset",
        electricalToCalciumDelaySec: 0,
      },
    )).toThrow(/strictly increasing/);
  });
});
