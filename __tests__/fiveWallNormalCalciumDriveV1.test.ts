import { describe, expect, it } from "vitest";

import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COEFFICIENT_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_RANGE_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_FIT_ANCHOR_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceFitAnchorV1";

describe("five-wall normal prescribed calcium drive V1", () => {
  it("is periodic, finite, and exactly shared within each tissue class", () => {
    const first = evaluateFiveWallNormalCalciumDriveV1(0.137);
    const nextCycle = evaluateFiveWallNormalCalciumDriveV1(1.137);
    expect(nextCycle.freeCalciumUMByWall).toEqual(first.freeCalciumUMByWall);
    expect(first.freeCalciumUMByWall.LA).toBe(first.freeCalciumUMByWall.RA);
    expect(first.freeCalciumUMByWall.LVFW).toBe(first.freeCalciumUMByWall.SEP);
    expect(first.freeCalciumUMByWall.SEP).toBe(first.freeCalciumUMByWall.RVFW);
    expect(first.finite).toBe(true);
  });

  it("reaches the declared diastolic floor and peak amplitude", () => {
    const p = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const samples = Array.from({ length: 20_001 }, (_, index) =>
      evaluateFiveWallNormalCalciumDriveV1(index / 20_000));
    const atrial = samples.map((sample) => sample.freeCalciumUMByWall.LA);
    const ventricular = samples.map((sample) => sample.freeCalciumUMByWall.LVFW);
    expect(Math.min(...atrial)).toBeCloseTo(p.atrial.diastolicCalciumUM, 10);
    expect(Math.max(...atrial)).toBeCloseTo(
      p.atrial.diastolicCalciumUM + p.atrial.peakAmplitudeUM,
      6,
    );
    expect(Math.min(...ventricular)).toBeCloseTo(
      p.ventricular.diastolicCalciumUM,
      10,
    );
    expect(Math.max(...ventricular)).toBeCloseTo(
      p.ventricular.diastolicCalciumUM + p.ventricular.peakAmplitudeUM,
      6,
    );
  });

  it("places the atrial pulse before the ventricular pulse by the AV delay", () => {
    const p = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const atAtrialOnset = evaluateFiveWallNormalCalciumDriveV1(
      p.cycleLengthSec - p.atrioventricularDelaySec +
        p.atrial.electricalToCalciumDelaySec,
    );
    const atVentricularOnset = evaluateFiveWallNormalCalciumDriveV1(
      p.cycleLengthSec + p.ventricular.electricalToCalciumDelaySec,
    );
    expect(atAtrialOnset.atrialNormalizedPulse01).toBeCloseTo(0, 12);
    expect(atVentricularOnset.ventricularNormalizedPulse01).toBeCloseTo(0, 12);
    expect(atVentricularOnset.atrialTimeSinceCalciumOnsetSec)
      .toBeCloseTo(p.atrioventricularDelaySec, 12);
  });

  it("declares no mechanical feedback or PV morphology input", () => {
    const output = evaluateFiveWallNormalCalciumDriveV1(0.5);
    const forbiddenInputs = ["volume", "pressure", "flow", "strain"];
    expect(forbiddenInputs.every((name) => !Object.hasOwn(output, name))).toBe(true);
    expect(output.claim.pvLoopMorphologyFitAllowed).toBe(false);
    expect(output.claim.conservedCalciumCyclingClaimed).toBe(false);
  });

  it("allows an exact zero transient amplitude for loss-of-drive cases", () => {
    const p = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const noAtrialPulse = {
      ...p,
      parameterSetId: "zero-atrial-calcium-pulse-v1",
      atrial: { ...p.atrial, peakAmplitudeUM: 0 },
    };
    for (const timeSec of [0, 0.25, 0.5, 0.75, 1]) {
      const output = evaluateFiveWallNormalCalciumDriveV1(timeSec, noAtrialPulse);
      expect(output.freeCalciumUMByWall.LA).toBe(p.atrial.diastolicCalciumUM);
      expect(output.freeCalciumUMByWall.RA).toBe(p.atrial.diastolicCalciumUM);
      expect(output.claim.exactZeroPulseAmplitudeAllowed).toBe(true);
    }
  });

  it("preserves the Standard-65 unequal-tau output exactly", () => {
    const output = evaluateFiveWallNormalCalciumDriveV1(0.137);
    expect({
      cyclePhase01: output.cyclePhase01,
      atrialTimeSinceCalciumOnsetSec:
        output.atrialTimeSinceCalciumOnsetSec,
      ventricularTimeSinceCalciumOnsetSec:
        output.ventricularTimeSinceCalciumOnsetSec,
      atrialNormalizedPulse01: output.atrialNormalizedPulse01,
      ventricularNormalizedPulse01: output.ventricularNormalizedPulse01,
      LA: output.freeCalciumUMByWall.LA,
      LVFW: output.freeCalciumUMByWall.LVFW,
    }).toEqual({
      cyclePhase01: 0.137,
      atrialTimeSinceCalciumOnsetSec: 0.28500000000000003,
      ventricularTimeSinceCalciumOnsetSec: 0.125,
      atrialNormalizedPulse01: 0.43866869441284956,
      ventricularNormalizedPulse01: 0.9297275121967827,
      LA: 0.3193343472064248,
      LVFW: 0.9374574858551367,
    });
  });
});

describe("matched-alpha saturating ventricular calcium heart-rate law V1", () => {
  const source = MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_FIT_ANCHOR_V1;

  it("reproduces the HR60 source-fit anchor exactly", () => {
    const params =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        60,
      );
    expect(params.parameterSetId).toBe(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
    );
    expect(params.cycleLengthSec).toBe(1);
    expect(params.atrioventricularDelaySec).toBe(0.12);
    expect(params.atrial).toBe(FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial);
    expect(params.ventricular).toEqual({
      diastolicCalciumUM: 0.164321,
      peakAmplitudeUM: 0.592586 - 0.164321,
      riseTimeConstantSec: 0.1234750900275888,
      decayTimeConstantSec: 0.1234750900275888,
      electricalToCalciumDelaySec: 0.012,
    });
    expect(source.sourceTraceOnsetOffsetSec).toBe(0.007222906291484831);
    expect(source.sourceTraceOnsetOffsetChangesElectricalToCalciumDelay)
      .toBe(false);
    expect(source.ventricularElectricalToCalciumDelaySec).toBe(0.012);
    expect(source.ventricularElectricalToCalciumDelaySource)
      .toBe("five-wall-normal-calcium-component-timing-prior-v1");
    expect(source.ventricularElectricalToCalciumDelayDerivedFromSourceFit)
      .toBe(false);
    expect(source.sourceDoi).toBe("10.1016/j.yjmcc.2017.03.008");
    expect(source.sourceFigure).toBe("Figure 6 left panel");
    expect(source.sourceFitProfileId)
      .toBe("land2017-figure6-whole-trace-alpha-fit");
    expect(source.derivationMethodId)
      .toBe("main-wire-ventricular-calcium-source-trace-fit-v1");
    expect(source.sourceTraceId)
      .toBe("land2017-figure6-coppini-calcium-trace-v1");
    expect(source.figureDigitizationUsed).toBe(true);
    expect(source.originalNumericSourceTraceUsed).toBe(false);
    expect(source.sourceMeasurementCovarianceAvailable).toBe(false);
    expect(source.hemodynamicOutcomeUsedToDeriveFit).toBe(false);
    expect(source.landTensionOutcomeUsedToDeriveFit).toBe(false);
  });

  it("pins the admitted coefficient and archived central-law points", () => {
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COEFFICIENT_V1,
    ).toBe(0.4);
    const expectedTauByHeartRate = [
      [40, 0.1337589682068882],
      [50, 0.1280477283184513],
      [60, 0.1234750900275888],
      [75, 0.11810747217472255],
      [90, 0.1139818739760287],
      [100, 0.11172488165232111],
    ] as const;
    for (const [heartRateBpm, expectedTauSec] of expectedTauByHeartRate) {
      const params =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
          heartRateBpm,
        );
      expect(params.ventricular.riseTimeConstantSec).toBe(expectedTauSec);
      expect(params.ventricular.decayTimeConstantSec).toBe(expectedTauSec);
    }
  });

  it("resolves every admitted continuous interior from the fixed formula", () => {
    for (const heartRateBpm of [40, 40.5, 55.25, 60, 67.75, 83.125, 99.5, 100]) {
      const params =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
          heartRateBpm,
        );
      const reference =
        MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_HEART_RATE_BPM_V1;
      const coordinate = (heartRateBpm - reference) / (heartRateBpm + reference);
      const expectedTau = source.ventricularAlphaTimeConstantSec * Math.exp(
        -MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_COEFFICIENT_V1
          * coordinate,
      );
      expect(params.cycleLengthSec).toBe(60 / heartRateBpm);
      expect(params.ventricular.riseTimeConstantSec).toBe(expectedTau);
      expect(params.ventricular.decayTimeConstantSec).toBe(expectedTau);
      expect(params.ventricular.diastolicCalciumUM)
        .toBe(source.ventricularDiastolicCalciumUM);
      expect(
        params.ventricular.diastolicCalciumUM
          + params.ventricular.peakAmplitudeUM,
      ).toBe(source.ventricularPeakCalciumUM);
    }
  });

  it("is positive, bounded, and strictly shortens tau over 40-100 bpm", () => {
    const range =
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_RANGE_V1;
    const globalLower = source.ventricularAlphaTimeConstantSec * Math.exp(-0.4);
    const globalUpper = source.ventricularAlphaTimeConstantSec * Math.exp(0.4);
    let previousTau = Number.POSITIVE_INFINITY;
    for (
      let heartRateBpm = range.minimumBpm;
      heartRateBpm <= range.maximumBpm;
      heartRateBpm += 0.25
    ) {
      const tau =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
          heartRateBpm,
        ).ventricular.riseTimeConstantSec;
      expect(tau).toBeGreaterThan(globalLower);
      expect(tau).toBeLessThan(globalUpper);
      expect(tau).toBeLessThan(previousTau);
      previousTau = tau;
    }
  });

  it("is periodic with exact extrema and the analytic alpha-limit integral", () => {
    const params =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        73.25,
      );
    const cycle = params.cycleLengthSec;
    const tau = params.ventricular.riseTimeConstantSec;
    const onset = params.ventricular.electricalToCalciumDelaySec;
    const carry = Math.exp(-cycle / tau);
    const ageOffset = cycle * carry / (1 - carry);
    const raw = (timeSec: number): number =>
      (timeSec + ageOffset) * Math.exp(-timeSec / tau);
    const peakTime = Math.min(cycle, Math.max(0, tau - ageOffset));
    const minimum = raw(0);
    const amplitude = raw(peakTime) - minimum;
    const expectedIntegral = (
      tau * tau * (1 - carry) - cycle * minimum
    ) / amplitude;

    const atOnset = evaluateFiveWallNormalCalciumDriveV1(onset, params);
    const atPeak = evaluateFiveWallNormalCalciumDriveV1(
      onset + peakTime,
      params,
    );
    expect(atOnset.ventricularNormalizedPulse01).toBe(0);
    expect(atOnset.freeCalciumUMByWall.LVFW)
      .toBe(source.ventricularDiastolicCalciumUM);
    expect(atPeak.ventricularNormalizedPulse01).toBe(1);
    expect(atPeak.freeCalciumUMByWall.LVFW)
      .toBe(source.ventricularPeakCalciumUM);

    const withinCycle = evaluateFiveWallNormalCalciumDriveV1(
      onset + 0.317 * cycle,
      params,
    );
    const nextCycle = evaluateFiveWallNormalCalciumDriveV1(
      onset + 1.317 * cycle,
      params,
    );
    expect(nextCycle.ventricularNormalizedPulse01)
      .toBeCloseTo(withinCycle.ventricularNormalizedPulse01, 14);

    const intervalCount = 20_000;
    const intervalSec = cycle / intervalCount;
    let trapezoidSum = 0;
    for (let index = 0; index <= intervalCount; index += 1) {
      const pulse = evaluateFiveWallNormalCalciumDriveV1(
        onset + index * intervalSec,
        params,
      ).ventricularNormalizedPulse01;
      expect(pulse).toBeGreaterThanOrEqual(0);
      expect(pulse).toBeLessThanOrEqual(1);
      trapezoidSum += (index === 0 || index === intervalCount ? 0.5 : 1)
        * pulse;
    }
    expect(intervalSec * trapezoidSum).toBeCloseTo(expectedIntegral, 8);
  });

  it("admits an explicit no-op wall scale at the alpha limit", () => {
    const params =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        60,
      );
    const withNoOpScale = {
      ...params,
      decayTimeScaleByWall: Object.freeze({ LVFW: 1 }),
    };
    const unscaled = evaluateFiveWallNormalCalciumDriveV1(0.2, params);
    const explicitlyUnscaled = evaluateFiveWallNormalCalciumDriveV1(
      0.2,
      withNoOpScale,
    );
    expect(explicitlyUnscaled.freeCalciumUMByWall.LVFW)
      .toBe(unscaled.freeCalciumUMByWall.LVFW);
  });

  it("is the continuous limit of the unequal-tau evaluator", () => {
    const params =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        60,
      );
    const nearAlpha = {
      ...params,
      ventricular: {
        ...params.ventricular,
        decayTimeConstantSec:
          params.ventricular.riseTimeConstantSec * (1 + 1e-6),
      },
    };
    for (const timeSec of [0.012, 0.05, 0.137, 0.25, 0.5, 0.9]) {
      const exact = evaluateFiveWallNormalCalciumDriveV1(
        timeSec,
        params,
      ).ventricularNormalizedPulse01;
      const nearby = evaluateFiveWallNormalCalciumDriveV1(
        timeSec,
        nearAlpha,
      ).ventricularNormalizedPulse01;
      expect(nearby).toBeCloseTo(exact, 5);
    }
  });

  it("fails closed outside the public heart-rate range", () => {
    for (const heartRateBpm of [
      39.999,
      100.001,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expect(() =>
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
          heartRateBpm,
        )
      ).toThrow(/40-100 bpm/);
    }
  });
});
