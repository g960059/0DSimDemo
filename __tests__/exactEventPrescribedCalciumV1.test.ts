import { describe, expect, it } from "vitest";

import {
  applyExactEventCalciumStimulusV1,
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
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";

const PARAMETERS = Object.freeze({
  tauRiseSec: 0.04,
  tauDecaySec: 0.2,
  calciumRestUM: 0.08,
  calciumGainUMPerUnitDrive: 0.5,
}) satisfies ExactEventCalciumParametersV1;

const ALPHA_PARAMETERS = Object.freeze({
  tauRiseSec: 0.125,
  tauDecaySec: 0.125,
  calciumRestUM: 0.1,
  calciumGainUMPerUnitDrive: 0.7,
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

  it("uses the exact repeated-root semigroup at equal time constants", () => {
    const strength = 2.5;
    const afterEvent = applyExactEventCalciumStimulusV1(
      zeroExactEventCalciumStateV1(),
      strength,
    );
    const durationSec = 0.375;
    const dimensionlessDuration =
      durationSec / ALPHA_PARAMETERS.tauRiseSec;
    const decay = Math.exp(-dimensionlessDuration);
    const direct = propagateExactEventCalciumV1(
      afterEvent,
      durationSec,
      ALPHA_PARAMETERS,
    );
    const split = propagateExactEventCalciumV1(
      propagateExactEventCalciumV1(
        afterEvent,
        0.137,
        ALPHA_PARAMETERS,
      ),
      durationSec - 0.137,
      ALPHA_PARAMETERS,
    );

    expect(direct[0]).toBeCloseTo(strength * decay, 15);
    expect(direct[1]).toBeCloseTo(
      strength * (1 + dimensionlessDuration) * decay,
      15,
    );
    expect(direct[1] - direct[0]).toBeCloseTo(
      strength * dimensionlessDuration * decay,
      15,
    );
    expect(split[0]).toBeCloseTo(direct[0], 15);
    expect(split[1]).toBeCloseTo(direct[1], 15);
  });

  it("keeps calcium continuous across an equal-tau event", () => {
    const before: ExactEventCalciumStateV1 = Object.freeze([0.25, 0.75]);
    const beforeCalcium = evaluateExactEventCalciumV1(
      before,
      ALPHA_PARAMETERS,
    );
    const after = applyExactEventCalciumStimulusV1(before, 0.5);
    const afterCalcium = evaluateExactEventCalciumV1(
      after,
      ALPHA_PARAMETERS,
    );

    expect(after).toEqual([0.75, 1.25]);
    expect(afterCalcium.driveDifference).toBe(beforeCalcium.driveDifference);
    expect(afterCalcium.freeCalciumUM).toBe(beforeCalcium.freeCalciumUM);
  });

  it("remains finite when duration divided by equal tau overflows", () => {
    const extreme = Object.freeze({
      ...ALPHA_PARAMETERS,
      tauRiseSec: Number.MIN_VALUE,
      tauDecaySec: Number.MIN_VALUE,
    });
    expect(propagateExactEventCalciumV1(
      Object.freeze([1, 2]),
      Number.MAX_VALUE,
      extreme,
    )).toEqual([0, 0]);
  });

  it("still rejects a decay time shorter than the rise time", () => {
    expect(() => propagateExactEventCalciumV1(
      Object.freeze([0, 0]),
      0,
      Object.freeze({
        ...ALPHA_PARAMETERS,
        tauDecaySec: ALPHA_PARAMETERS.tauRiseSec / 2,
      }),
    )).toThrow(/must not be shorter/);
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

  it("analytically closes the equal-tau periodic fixed point", () => {
    const periodic = Object.freeze({
      diastolicCalciumUM: 0.164321,
      peakAmplitudeUM: 0.592586 - 0.164321,
      riseTimeConstantSec: 0.1234750900275888,
      decayTimeConstantSec: 0.1234750900275888,
    });
    const converted = convertPeriodicBiexponentialToExactEventCalciumV1(
      periodic,
      1,
    );
    const beforeNextEvent = propagateExactEventCalciumV1(
      converted.periodicStateImmediatelyAfterEvent,
      1,
      converted.parameters,
    );
    const nextPeriod = applyExactEventCalciumStimulusV1(beforeNextEvent, 1);
    const trough = evaluateExactEventCalciumV1(
      converted.periodicStateImmediatelyAfterEvent,
      converted.parameters,
    ).freeCalciumUM;
    const peak = evaluateExactEventCalciumV1(
      propagateExactEventCalciumV1(
        converted.periodicStateImmediatelyAfterEvent,
        converted.reference.timeToPeakSec,
        converted.parameters,
      ),
      converted.parameters,
    ).freeCalciumUM;

    expect(nextPeriod[0]).toBeCloseTo(
      converted.periodicStateImmediatelyAfterEvent[0],
      15,
    );
    expect(nextPeriod[1]).toBeCloseTo(
      converted.periodicStateImmediatelyAfterEvent[1],
      15,
    );
    expect(trough).toBeCloseTo(periodic.diastolicCalciumUM, 11);
    expect(peak - trough).toBeCloseTo(periodic.peakAmplitudeUM, 11);
  });

  it("remains finite and closed over many equal-tau periods", () => {
    const params =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        100,
      );
    const converted = convertPeriodicBiexponentialToExactEventCalciumV1(
      {
        diastolicCalciumUM: params.ventricular.diastolicCalciumUM,
        peakAmplitudeUM: params.ventricular.peakAmplitudeUM,
        riseTimeConstantSec: params.ventricular.riseTimeConstantSec,
        decayTimeConstantSec: params.ventricular.decayTimeConstantSec,
      },
      params.cycleLengthSec,
    );
    let state = converted.periodicStateImmediatelyAfterEvent;
    for (let cycleIndex = 0; cycleIndex < 10_000; cycleIndex += 1) {
      state = applyExactEventCalciumStimulusV1(
        propagateExactEventCalciumV1(
          state,
          params.cycleLengthSec,
          converted.parameters,
        ),
        1,
      );
      if (
        !Number.isFinite(state[0])
        || !Number.isFinite(state[1])
        || state[1] < state[0]
      ) {
        throw new Error("equal-tau periodic state lost its finite invariant");
      }
    }

    expect(state[0]).toBeCloseTo(
      converted.periodicStateImmediatelyAfterEvent[0],
      15,
    );
    expect(state[1]).toBeCloseTo(
      converted.periodicStateImmediatelyAfterEvent[1],
      15,
    );
    expect(evaluateExactEventCalciumV1(
      state,
      converted.parameters,
    ).freeCalciumUM).toBeCloseTo(
      params.ventricular.diastolicCalciumUM,
      11,
    );
  });

  it("matches the direct periodic alpha evaluator across the HR envelope", () => {
    let maximumAbsoluteErrorUM = 0;
    for (
      let heartRateBpm = 40;
      heartRateBpm <= 100;
      heartRateBpm += 0.25
    ) {
      const params =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
          heartRateBpm,
        );
      const converted = convertPeriodicBiexponentialToExactEventCalciumV1(
        {
          diastolicCalciumUM: params.ventricular.diastolicCalciumUM,
          peakAmplitudeUM: params.ventricular.peakAmplitudeUM,
          riseTimeConstantSec: params.ventricular.riseTimeConstantSec,
          decayTimeConstantSec: params.ventricular.decayTimeConstantSec,
        },
        params.cycleLengthSec,
      );
      for (let phaseIndex = 0; phaseIndex <= 1_000; phaseIndex += 1) {
        const phaseSec = params.cycleLengthSec * phaseIndex / 1_000;
        const exactEventCalcium = evaluateExactEventCalciumV1(
          propagateExactEventCalciumV1(
            converted.periodicStateImmediatelyAfterEvent,
            phaseSec,
            converted.parameters,
          ),
          converted.parameters,
        ).freeCalciumUM;
        const directCalcium = evaluateFiveWallNormalCalciumDriveV1(
          params.ventricular.electricalToCalciumDelaySec + phaseSec,
          params,
        ).freeCalciumUMByWall.LVFW;
        maximumAbsoluteErrorUM = Math.max(
          maximumAbsoluteErrorUM,
          Math.abs(exactEventCalcium - directCalcium),
        );
      }
    }

    // Alpha conversion crosses the same 12-significant-digit persisted-
    // parameter boundary as the unequal converter. This is alpha-only; the
    // existing Standard-65 replay tolerance remains unchanged.
    expect(maximumAbsoluteErrorUM).toBeLessThanOrEqual(3e-12);
  });

  it("bounds canonicalization error across every admitted heart rate", () => {
    let maximumTroughErrorUM = 0;
    let maximumPeakExcursionErrorUM = 0;
    const priors = [
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.ventricular,
    ] as const;
    const heartRateRange =
      MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3.heartRateBpm;
    expect(Number.isInteger(heartRateRange.minimum)).toBe(true);
    expect(Number.isInteger(heartRateRange.maximum)).toBe(true);
    expect(Number.isInteger(heartRateRange.step)).toBe(true);
    expect(heartRateRange.step).toBeGreaterThan(0);

    for (
      let heartRateBpm = heartRateRange.minimum;
      heartRateBpm <= heartRateRange.maximum;
      heartRateBpm += heartRateRange.step
    ) {
      const cycleLengthSec = 60 / heartRateBpm;
      for (const prior of priors) {
        const converted = convertPeriodicBiexponentialToExactEventCalciumV1(
          prior,
          cycleLengthSec,
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

        maximumTroughErrorUM = Math.max(
          maximumTroughErrorUM,
          Math.abs(trough - prior.diastolicCalciumUM),
        );
        maximumPeakExcursionErrorUM = Math.max(
          maximumPeakExcursionErrorUM,
          Math.abs(
            (peak - trough) - prior.peakAmplitudeUM,
          ),
        );
      }
    }

    // This is a scientific tolerance for the model-owned decimal precision
    // boundary, not a generic floating-point matcher. It covers every value
    // admitted by the integer-step Standard heart-rate control.
    expect(maximumTroughErrorUM).toBeLessThanOrEqual(1e-12);
    expect(maximumPeakExcursionErrorUM).toBeLessThanOrEqual(1e-12);
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
