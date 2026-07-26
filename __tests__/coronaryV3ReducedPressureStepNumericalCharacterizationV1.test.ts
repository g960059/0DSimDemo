import { describe, expect, it } from "vitest";

import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V1,
  CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V1,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V1,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1,
  compareCoronaryV3ReducedPressureStepArmNumericsV1,
  type CoronaryV3ReducedPressureStepArmNumericalSampleV1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepNumericalCharacterizationV1";
import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_MEASUREMENT_STATION_V1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepResponseV1";
import {
  describeCoronaryV3StepResponseMetricsV1,
  type CoronaryStepResponseBeatV1,
  type CoronaryStepResponseMetricsResultV1,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";

describe("coronary V3 reduced pressure-step numerical characterization", () => {
  it("predeclares both integrations, physical windows, boundaries, and numerical-only gates", () => {
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V1)
      .toMatchObject({
        dtSec: 0.002,
        acceptedAutoregulationWindowSec: 1,
        baselineEquilibrationMaximumDurationSec: 400,
        equilibriumRequiredConsecutiveWindows: 3,
        equilibriumMaximumAbsoluteLogToneChangePerWindow: 8e-4,
        equilibriumMaximumAbsoluteLogQmTargetRatio: 0.02,
        baselineObservationDurationSec: 15,
        postStepObservationDurationSec: 85,
        baselineMetricsWindowDurationSec: 15,
        finalMetricsWindowDurationSec: 15,
        fixedAbsoluteRightAtrialPressureMmHg: 5,
        fixedPerivascularExternalPressureMmHg: 0,
        maximumAbsoluteInitializerContinuityResidualMlPerSec: 1e-8,
        maximumAbsoluteStepLedgerResidualMl: 1e-8,
        maximumAbsoluteNodeContinuityResidualMl: 1e-8,
      });
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V1.dtSec)
      .toBe(0.001);
    for (const protocol of [
      CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V1,
      CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V1,
    ]) {
      expect(protocol.fixedIntramyocardialPressureMmHgByTerritoryLayer)
        .toEqual({
          LAD: { subepicardial: 10, subendocardial: 10 },
          LCx: { subepicardial: 10, subendocardial: 10 },
          RCA: { subepicardial: 10, subendocardial: 10 },
        });
    }
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1)
      .toMatchObject({
        maximumCrossingMidpointDifferenceSec: 1,
        maximumFinalNormalizedResponseRelativeDifference: 0.02,
        maximumPassiveOppositeAmplitudeRelativeDifference: 0.05,
        missingCrossingPasses: false,
        missingOppositeExcursionPasses: false,
        nearZeroDenominatorPasses: false,
        numericalQaOnly: true,
        biologicalTolerance: false,
        originalPaperT50ComparisonApplied: false,
        policyDeclaredBeforeFineOutput: true,
      });
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V1)
      .toMatchObject({
        exactLeftMainCannulaRepresented: false,
        distalZeroFlowWedgeRepresented: false,
        constantFlowBoundaryRepresented: false,
        originalPaperT50Compared: false,
        biologicalValidationEstablished: false,
        physiologicalAcceptanceEstablished: false,
        releaseAcceptanceEstablished: false,
      });
  });

  it("passes overlapping relative-time crossings and the declared response/amplitude bounds", () => {
    const coarse = makeSample({
      dtSec: 0.002,
      interventionTimeSec: 128,
      finalPressureFlow: 18,
      passiveOppositeAmplitude: 2,
    });
    const fine = makeSample({
      dtSec: 0.001,
      interventionTimeSec: 101,
      finalPressureFlow: 18.1,
      passiveOppositeAmplitude: 2.04,
    });
    const compared = compareCoronaryV3ReducedPressureStepArmNumericsV1(
      coarse,
      fine,
    );

    expect(compared.dtBindingPassed).toBe(true);
    expect(compared.integrity.passed).toBe(true);
    expect(compared.surrogateBoundary.passed).toBe(true);
    expect(compared.crossing).toMatchObject({
      bothCrossingsPresent: true,
      bracketsOverlap: true,
      passed: true,
    });
    expect(compared.crossing.coarse!.lowerSecAfterIntervention).toBe(4);
    expect(compared.crossing.fine!.lowerSecAfterIntervention).toBe(5);
    expect(compared.finalNormalizedResponse.relativeDifference)
      .toBeCloseTo(Math.abs(0.8 - 0.81) / 0.81, 12);
    expect(compared.finalNormalizedResponse.passed).toBe(true);
    expect(compared.passiveOppositeAmplitude.relativeDifference)
      .toBeCloseTo(0.04 / 2.04, 12);
    expect(compared.passiveOppositeAmplitude.passed).toBe(true);
    expect(compared.numericalQaPassed).toBe(true);
    expect(compared.biologicalValidationEstablished).toBe(false);
  });

  it("allows nonoverlapping brackets only when relative-time midpoints remain within one window", () => {
    const coarse = makeSample({ dtSec: 0.002, interventionTimeSec: 80 });
    const fine = makeSample({ dtSec: 0.001, interventionTimeSec: 120 });
    const coarseBracket = coarse.metrics.fitFreeBaselineFinalHalfResponseBracket!;
    const fineBracket = fine.metrics.fitFreeBaselineFinalHalfResponseBracket!;
    const movedCoarse = withMetrics(coarse, {
      ...coarse.metrics,
      fitFreeBaselineFinalHalfResponseBracket: {
        ...coarseBracket,
        lowerTimeSec: coarse.interventionTimeSec + 4,
        upperTimeSec: coarse.interventionTimeSec + 4.5,
      },
    });
    const movedFine = withMetrics(fine, {
      ...fine.metrics,
      fitFreeBaselineFinalHalfResponseBracket: {
        ...fineBracket,
        lowerTimeSec: fine.interventionTimeSec + 5,
        upperTimeSec: fine.interventionTimeSec + 5.5,
      },
    });
    const compared = compareCoronaryV3ReducedPressureStepArmNumericsV1(
      movedCoarse,
      movedFine,
    );
    expect(compared.crossing.bracketsOverlap).toBe(false);
    expect(compared.crossing.absoluteMidpointDifferenceSec).toBe(1);
    expect(compared.crossing.passed).toBe(true);
  });

  it("does not fabricate a pass when a crossing or opposite excursion is absent", () => {
    const coarse = makeSample({ dtSec: 0.002 });
    const fine = makeSample({ dtSec: 0.001 });
    const noCrossing = withMetrics(fine, {
      ...fine.metrics,
      fitFreeBaselineFinalHalfResponseBracket: null,
    });
    const crossingComparison =
      compareCoronaryV3ReducedPressureStepArmNumericsV1(coarse, noCrossing);
    expect(crossingComparison.crossing).toMatchObject({
      bothCrossingsPresent: false,
      absoluteMidpointDifferenceSec: null,
      passed: false,
    });
    expect(crossingComparison.numericalQaPassed).toBe(false);

    const noExcursion = withMetrics(fine, {
      ...fine.metrics,
      passiveExtremum: {
        ...fine.metrics.passiveExtremum,
        signedOppositeAmplitudeFromBaselineMmHgSecPerMl: 0,
        absoluteOppositeAmplitudeFromBaselineMmHgSecPerMl: 0,
        oppositeDirectionObserved: false,
      },
    });
    const passiveComparison =
      compareCoronaryV3ReducedPressureStepArmNumericsV1(coarse, noExcursion);
    expect(passiveComparison.passiveOppositeAmplitude).toMatchObject({
      fineOppositeDirectionObserved: false,
      relativeDifference: null,
      passed: false,
    });
    expect(passiveComparison.numericalQaPassed).toBe(false);
  });

  it("fails closed for a near-zero normalized-response denominator or failed conservation", () => {
    const coarse = makeSample({ dtSec: 0.002 });
    const nearZeroFine = makeSample({
      dtSec: 0.001,
      finalPressureFlow: 10.000000001,
    });
    const denominatorComparison =
      compareCoronaryV3ReducedPressureStepArmNumericsV1(
        coarse,
        nearZeroFine,
      );
    expect(denominatorComparison.finalNormalizedResponse).toMatchObject({
      denominatorGatePassed: false,
      relativeDifference: null,
      passed: false,
    });
    expect(denominatorComparison.numericalQaPassed).toBe(false);

    const unconservedFine = Object.freeze({
      ...makeSample({ dtSec: 0.001 }),
      conservationToleranceSatisfied: false,
    });
    const integrityComparison =
      compareCoronaryV3ReducedPressureStepArmNumericsV1(
        coarse,
        unconservedFine,
      );
    expect(integrityComparison.integrity.passed).toBe(false);
    expect(integrityComparison.numericalQaPassed).toBe(false);
  });

  it("rejects final-response and passive-amplitude errors above their numerical bounds", () => {
    const coarse = makeSample({
      dtSec: 0.002,
      finalPressureFlow: 18,
      passiveOppositeAmplitude: 2,
    });
    const fine = makeSample({
      dtSec: 0.001,
      finalPressureFlow: 19,
      passiveOppositeAmplitude: 2.2,
    });
    const compared = compareCoronaryV3ReducedPressureStepArmNumericsV1(
      coarse,
      fine,
    );
    expect(compared.finalNormalizedResponse.relativeDifference)
      .toBeGreaterThan(0.02);
    expect(compared.finalNormalizedResponse.passed).toBe(false);
    expect(compared.passiveOppositeAmplitude.relativeDifference)
      .toBeGreaterThan(0.05);
    expect(compared.passiveOppositeAmplitude.passed).toBe(false);
    expect(compared.numericalQaPassed).toBe(false);
  });
});

function makeSample(input: Readonly<{
  dtSec: 0.002 | 0.001;
  interventionTimeSec?: number;
  finalPressureFlow?: number;
  passiveOppositeAmplitude?: number;
}>): CoronaryV3ReducedPressureStepArmNumericalSampleV1 {
  const interventionTimeSec = input.interventionTimeSec ?? 100;
  const finalPressureFlow = input.finalPressureFlow ?? 18;
  const passiveOppositeAmplitude = input.passiveOppositeAmplitude ?? 2;
  const beats = makeBeats(
    interventionTimeSec,
    finalPressureFlow,
    passiveOppositeAmplitude,
  );
  const metrics = describeCoronaryV3StepResponseMetricsV1({
    interventionTimeSec,
    baselineWindow: Object.freeze({
      startTimeSec: interventionTimeSec - 15,
      endTimeSec: interventionTimeSec,
    }),
    finalWindow: Object.freeze({
      startTimeSec: interventionTimeSec + 70,
      endTimeSec: interventionTimeSec + 85,
    }),
    persistenceBeatCount: 3,
    measurementStation:
      CORONARY_V3_REDUCED_PRESSURE_STEP_MEASUREMENT_STATION_V1,
    beats,
  });
  return Object.freeze({
    armId: "80-to-100:tone-active",
    dtSec: input.dtSec,
    interventionTimeSec,
    metrics,
    allFinite: true,
    conservationToleranceSatisfied: true,
  });
}

function makeBeats(
  interventionTimeSec: number,
  finalPressureFlow: number,
  passiveOppositeAmplitude: number,
): readonly CoronaryStepResponseBeatV1[] {
  const baseline = 10;
  const values = [
    ...new Array<number>(15).fill(baseline),
    ...Array.from({ length: 85 }, (_, index) => {
      if (index === 0) return baseline - passiveOppositeAmplitude;
      return Math.min(finalPressureFlow, baseline + index);
    }),
  ];
  return Object.freeze(values.map((pressureFlow, index) => {
    const meanObservedFlowMlPerSec = 2;
    const meanDownstreamReferencePressureMmHg = 5;
    const startTimeSec = interventionTimeSec - 15 + index;
    return Object.freeze({
      beatIndex: index,
      startTimeSec,
      endTimeSec: startTimeSec + 1,
      meanUpstreamPressureMmHg:
        meanDownstreamReferencePressureMmHg
        + pressureFlow * meanObservedFlowMlPerSec,
      meanDownstreamReferencePressureMmHg,
      meanObservedFlowMlPerSec,
      meanCoronaryBloodVolumeMl: 30,
    });
  }));
}

function withMetrics(
  sample: CoronaryV3ReducedPressureStepArmNumericalSampleV1,
  metrics: CoronaryStepResponseMetricsResultV1,
): CoronaryV3ReducedPressureStepArmNumericalSampleV1 {
  return Object.freeze({ ...sample, metrics: Object.freeze(metrics) });
}
