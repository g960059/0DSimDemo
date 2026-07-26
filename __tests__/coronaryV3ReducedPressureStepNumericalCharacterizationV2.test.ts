import { describe, expect, it } from "vitest";

import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V1,
  CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V1,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID,
  compareCoronaryV3ReducedPressureStepArmNumericsV1,
  type CoronaryV3ReducedPressureStepArmNumericalSampleV1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepNumericalCharacterizationV1";
import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2,
  CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V2,
  CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V2,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V2,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2,
  compareCoronaryV3ReducedPressureStepArmNumericsV2,
  type CoronaryV3ReducedPressureStepArmIdV2,
  type CoronaryV3ReducedPressureStepArmNumericalSampleV2,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepNumericalCharacterizationV2";
import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_MEASUREMENT_STATION_V1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepResponseV1";
import {
  describeCoronaryV3StepResponseMetricsV1,
  type CoronaryStepResponseBeatV1,
  type CoronaryStepResponseMetricsResultV1,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";

describe("coronary V3 reduced pressure-step numerical characterization V2", () => {
  it("keeps V1 intact and preregisters a distinct 1 ms / 0.5 ms V2 identity", () => {
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID)
      .not.toBe(
        CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID,
      );
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V1.dtSec)
      .toBe(0.002);
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V1.dtSec)
      .toBe(0.001);
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_COARSE_PROTOCOL_V2.dtSec)
      .toBe(0.001);
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_FINE_PROTOCOL_V2.dtSec)
      .toBe(0.0005);
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2)
      .toMatchObject({
        firstFiveAcceptedWindowCount: 5,
        transientDirectionRequirement:
          "direction-independent-absolute-deviation",
        oppositeDirectionExcursionRequired: false,
        maximumFirstFiveWindowAbsoluteTransientRelativeDifference: 0.05,
        physiologicalThresholdsDefined: false,
        knownV1OutputUsedToChoosePhysiologicalThresholds: false,
        knownV1OutputUsedToChooseNumericalTolerance: false,
        originalPaperT50ComparisonApplied: false,
        policyDeclaredBeforeNewFineOutput: true,
      });
  });

  it("records the new-fine preregistration and keeps every validation claim false", () => {
    expect(CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CLAIM_V2)
      .toMatchObject({
        predecessorV1ArtifactRetained: true,
        predecessorV1FailureReclassified: false,
        knownV1OutputMotivatedDirectionIndependentMetricDefinition: true,
        knownV1OutputUsedToChoosePhysiologicalThresholds: false,
        knownV1OutputUsedToChooseNumericalTolerance: false,
        policyDeclaredBeforeNewFineOutput: true,
        newFineDtSec: 0.0005,
        newFineOutputAvailableWhenPolicyDeclared: false,
        newFineOutputUsedToChoosePolicy: false,
        firstFiveWindowMetricAppliedUniformlyToAllFourArms: true,
        directionDependentOppositeExcursionGateApplied: false,
        exactLeftMainCannulaRepresented: false,
        distalZeroFlowWedgeRepresented: false,
        originalPaperT50Compared: false,
        dankelmanProtocolReproduced: false,
        biologicalValidationEstablished: false,
        physiologicalAcceptanceEstablished: false,
        independentValidationEstablished: false,
        clinicalValidationEstablished: false,
        releaseAcceptanceEstablished: false,
      });
  });

  it("uses the same direction-independent first-five-window comparison for all four arms", () => {
    for (const armId of CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2) {
      const coarse = makeSample({
        armId,
        dtSec: 0.001,
        interventionTimeSec: 128,
        earlyMaximumAbsoluteTransient: 6,
        finalPressureFlow: 18,
      });
      const fine = makeSample({
        armId,
        dtSec: 0.0005,
        interventionTimeSec: 101,
        earlyMaximumAbsoluteTransient: 6.1,
        finalPressureFlow: 18.1,
      });
      const compared = compareCoronaryV3ReducedPressureStepArmNumericsV2(
        coarse,
        fine,
      );

      expect(compared.dtBindingPassed).toBe(true);
      expect(compared.integrity.passed).toBe(true);
      expect(compared.surrogateBoundary.passed).toBe(true);
      expect(compared.crossing.passed).toBe(true);
      expect(compared.finalNormalizedResponse.passed).toBe(true);
      expect(compared.firstFiveWindowMaximumAbsoluteTransient).toMatchObject({
        definition:
          "direction-independent-maximum-absolute-transient-from-baseline",
        requiredAcceptedWindowCount: 5,
        coarseContributingAcceptedWindowCount: 5,
        fineContributingAcceptedWindowCount: 5,
        coarseCoveragePassed: true,
        fineCoveragePassed: true,
        coarseMaximumAbsoluteTransientMmHgSecPerMl: 6,
        oppositeDirectionExcursionRequired: false,
        denominatorGatePassed: true,
        passed: true,
      });
      expect(
        compared.firstFiveWindowMaximumAbsoluteTransient
          .fineMaximumAbsoluteTransientMmHgSecPerMl,
      ).toBeCloseTo(6.1, 12);
      expect(
        compared.firstFiveWindowMaximumAbsoluteTransient.relativeDifference,
      ).toBeCloseTo(0.1 / 6.1, 12);
      expect(compared.numericalQaPassed).toBe(true);
      expect(compared.biologicalValidationEstablished).toBe(false);
      expect(compared.physiologicalAcceptanceEstablished).toBe(false);
    }
  });

  it("preserves the V1 opposite-excursion failure while V2 compares the absolute transient", () => {
    const coarseV2 = makeSample({
      armId: "100-to-80:tone-frozen",
      dtSec: 0.001,
      earlyMaximumAbsoluteTransient: 6,
      finalPressureFlow: 18,
    });
    const fineV2 = makeSample({
      armId: "100-to-80:tone-frozen",
      dtSec: 0.0005,
      earlyMaximumAbsoluteTransient: 6.1,
      finalPressureFlow: 18.1,
    });
    expect(coarseV2.metrics.passiveExtremum.oppositeDirectionObserved)
      .toBe(false);
    expect(fineV2.metrics.passiveExtremum.oppositeDirectionObserved)
      .toBe(false);

    const v1 = compareCoronaryV3ReducedPressureStepArmNumericsV1(
      asV1Sample(coarseV2, 0.002),
      asV1Sample(fineV2, 0.001),
    );
    expect(v1.passiveOppositeAmplitude).toMatchObject({
      coarseOppositeDirectionObserved: false,
      fineOppositeDirectionObserved: false,
      passed: false,
    });
    expect(v1.numericalQaPassed).toBe(false);

    const v2 = compareCoronaryV3ReducedPressureStepArmNumericsV2(
      coarseV2,
      fineV2,
    );
    expect(v2.firstFiveWindowMaximumAbsoluteTransient.passed).toBe(true);
    expect(v2.numericalQaPassed).toBe(true);
  });

  it("fails closed above five percent or without all first five accepted windows", () => {
    const coarse = makeSample({
      armId: "80-to-100:tone-active",
      dtSec: 0.001,
      earlyMaximumAbsoluteTransient: 6,
      finalPressureFlow: 18,
    });
    const divergentFine = makeSample({
      armId: "80-to-100:tone-active",
      dtSec: 0.0005,
      earlyMaximumAbsoluteTransient: 7,
      finalPressureFlow: 18,
    });
    const divergent = compareCoronaryV3ReducedPressureStepArmNumericsV2(
      coarse,
      divergentFine,
    );
    expect(divergent.firstFiveWindowMaximumAbsoluteTransient.relativeDifference)
      .toBeCloseTo(1 / 7, 12);
    expect(divergent.firstFiveWindowMaximumAbsoluteTransient.passed).toBe(false);
    expect(divergent.numericalQaPassed).toBe(false);

    const missingWindowFine = withMetrics(divergentFine, {
      ...divergentFine.metrics,
      beatObservables: divergentFine.metrics.beatObservables.filter((beat) =>
        Math.abs(
          beat.startTimeSec - (divergentFine.interventionTimeSec + 4),
        ) > 1e-9),
    });
    const missing = compareCoronaryV3ReducedPressureStepArmNumericsV2(
      coarse,
      missingWindowFine,
    );
    expect(missing.firstFiveWindowMaximumAbsoluteTransient).toMatchObject({
      fineContributingAcceptedWindowCount: 4,
      fineCoveragePassed: false,
      relativeDifference: null,
      passed: false,
    });
    expect(missing.numericalQaPassed).toBe(false);
  });
});

function makeSample(input: Readonly<{
  armId: CoronaryV3ReducedPressureStepArmIdV2;
  dtSec: 0.001 | 0.0005;
  interventionTimeSec?: number;
  earlyMaximumAbsoluteTransient: number;
  finalPressureFlow: number;
}>): CoronaryV3ReducedPressureStepArmNumericalSampleV2 {
  const interventionTimeSec = input.interventionTimeSec ?? 100;
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
    beats: makeBeats(
      interventionTimeSec,
      input.earlyMaximumAbsoluteTransient,
      input.finalPressureFlow,
    ),
  });
  return Object.freeze({
    armId: input.armId,
    dtSec: input.dtSec,
    interventionTimeSec,
    metrics,
    allFinite: true,
    conservationToleranceSatisfied: true,
  });
}

function makeBeats(
  interventionTimeSec: number,
  earlyMaximumAbsoluteTransient: number,
  finalPressureFlow: number,
): readonly CoronaryStepResponseBeatV1[] {
  const baseline = 10;
  const firstFive = Array.from({ length: 5 }, (_, index) =>
    baseline + earlyMaximumAbsoluteTransient * (index + 1) / 5);
  const values = [
    ...new Array<number>(15).fill(baseline),
    ...firstFive,
    ...new Array<number>(80).fill(finalPressureFlow),
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

function asV1Sample(
  sample: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  dtSec: 0.002 | 0.001,
): CoronaryV3ReducedPressureStepArmNumericalSampleV1 {
  return Object.freeze({ ...sample, dtSec });
}

function withMetrics(
  sample: CoronaryV3ReducedPressureStepArmNumericalSampleV2,
  metrics: CoronaryStepResponseMetricsResultV1,
): CoronaryV3ReducedPressureStepArmNumericalSampleV2 {
  return Object.freeze({ ...sample, metrics: Object.freeze(metrics) });
}
