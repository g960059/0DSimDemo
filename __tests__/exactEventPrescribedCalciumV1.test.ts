import { describe, expect, it } from "vitest";

import {
  canonicalizeDerivedExactEventCalciumParameterV1,
  advanceExactEventCalciumV1,
  convertPeriodicBiexponentialToExactEventCalciumV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
  type ExactEventCalciumEventV1,
  type ExactEventCalciumParametersV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";

const PARAMETERS = Object.freeze({
  tauRiseSec: 0.04,
  tauDecaySec: 0.2,
  calciumRestUM: 0.08,
  calciumGainUMPerUnitDrive: 0.5,
}) satisfies ExactEventCalciumParametersV1;

describe("exact-event prescribed calcium V1", () => {
  it("canonicalizes transcendental-derived parameters across ULP drift", () => {
    expect(canonicalizeDerivedExactEventCalciumParameterV1(
      5.405356353915279,
    )).toBe(canonicalizeDerivedExactEventCalciumParameterV1(
      5.4053563539152805,
    ));
    expect(canonicalizeDerivedExactEventCalciumParameterV1(
      5.405356353915279,
    )).toBe(5.40535635392);
  });

  it("propagates both states by their exact exponential semigroup", () => {
    const initial: ExactEventCalciumStateV1 = Object.freeze([0.4, 1.2]);
    const durationSec = 0.17;
    const direct = propagateExactEventCalciumV1(
      initial,
      durationSec,
      PARAMETERS,
    );
    const split = propagateExactEventCalciumV1(
      propagateExactEventCalciumV1(initial, 0.07, PARAMETERS),
      0.1,
      PARAMETERS,
    );

    expect(direct[0]).toBeCloseTo(
      initial[0] * Math.exp(-durationSec / PARAMETERS.tauRiseSec),
      15,
    );
    expect(direct[1]).toBeCloseTo(
      initial[1] * Math.exp(-durationSec / PARAMETERS.tauDecaySec),
      15,
    );
    expect(split[0]).toBeCloseTo(direct[0], 15);
    expect(split[1]).toBeCloseTo(direct[1], 15);
  });

  it("analytically preserves the periodic trough and peak excursion", () => {
    const periodic = Object.freeze({
      diastolicCalciumUM: 0.1,
      peakAmplitudeUM: 0.7,
      riseTimeConstantSec: 0.03,
      decayTimeConstantSec: 0.15,
    });
    const converted = convertPeriodicBiexponentialToExactEventCalciumV1(
      periodic,
      1,
    );
    const trough = evaluateExactEventCalciumV1(
      converted.periodicStateImmediatelyAfterEvent,
      converted.parameters,
    ).freeCalciumUM;
    const peakState = propagateExactEventCalciumV1(
      converted.periodicStateImmediatelyAfterEvent,
      converted.reference.timeToPeakSec,
      converted.parameters,
    );
    const peak = evaluateExactEventCalciumV1(
      peakState,
      converted.parameters,
    ).freeCalciumUM;

    expect(trough).toBeCloseTo(periodic.diastolicCalciumUM, 11);
    expect(peak - trough).toBeCloseTo(periodic.peakAmplitudeUM, 11);
  });

  it("owns the open-start, closed-end interval exactly", () => {
    const acceptedAtEnd = advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      1,
      1.5,
      [Object.freeze({ timeSec: 1.5, strength: 1 })],
      PARAMETERS,
    );

    expect(acceptedAtEnd).toEqual([1, 1]);
    expect(() => advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      1,
      1.5,
      [Object.freeze({ timeSec: 1, strength: 1 })],
      PARAMETERS,
    )).toThrow(/\(startTimeSec, endTimeSec\]/);
  });

  it("reduces simultaneous events deterministically across input order", () => {
    const events = Object.freeze([
      Object.freeze({ timeSec: 0.2, strength: 0.3 }),
      Object.freeze({ timeSec: 0.2, strength: 0.1 }),
      Object.freeze({ timeSec: 0.2, strength: 0.2 }),
    ]) satisfies readonly ExactEventCalciumEventV1[];
    const permuted = Object.freeze([events[2], events[0], events[1]]);
    const first = advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      0,
      0.7,
      events,
      PARAMETERS,
    );
    const second = advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      0,
      0.7,
      permuted,
      PARAMETERS,
    );

    expect(second).toEqual(first);
  });

  it("is retry-pure and never mutates accepted state or event input", () => {
    const accepted: ExactEventCalciumStateV1 = Object.freeze([0.25, 0.75]);
    const events = Object.freeze([
      Object.freeze({ timeSec: 0.3, strength: 0.4 }),
    ]) satisfies readonly ExactEventCalciumEventV1[];
    const acceptedBefore = JSON.stringify(accepted);
    const eventsBefore = JSON.stringify(events);

    const firstTrial = advanceExactEventCalciumV1(
      accepted,
      0,
      0.5,
      events,
      PARAMETERS,
    );
    const retryTrial = advanceExactEventCalciumV1(
      accepted,
      0,
      0.5,
      events,
      PARAMETERS,
    );

    expect(retryTrial).toEqual(firstTrial);
    expect(JSON.stringify(accepted)).toBe(acceptedBefore);
    expect(JSON.stringify(events)).toBe(eventsBefore);
    expect(Object.isFrozen(firstTrial)).toBe(true);
  });
});
