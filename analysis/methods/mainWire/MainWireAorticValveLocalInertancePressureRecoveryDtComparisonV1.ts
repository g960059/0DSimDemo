import {
  compareMainWireAorticValveLocalInertancePressureRecoveryFactorialV1,
  type MainWireAorticValveLocalInertancePressureRecoveryFactorialInputV1,
  type MainWireAorticValveLocalInertancePressureRecoveryFactorialV1,
  type MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLocalInertancePressureRecoveryFactorialV1";
import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1,
  type MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticValveLocalInertancePressureRecoveryFactorialV1";

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_V1_ID =
  "main-wire-aortic-valve-local-inertance-pressure-recovery-dt-comparison-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_VALUES_SEC_V1 =
  Object.freeze([0.002, 0.001, 0.0005] as const);

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "three-independent-cold-start-factorials" as const,
    dtValuesSec:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_VALUES_SEC_V1,
    lastHalvingCoarseDtSec: 0.001 as const,
    lastHalvingFineDtSec: 0.0005 as const,
    continuousRelativeTolerance: 0.01,
    gradientRelativeTolerance: 0.01,
    eventTimeAbsoluteToleranceSec: 0.001,
    waveformTopologyRequiresStablePeakAndEpisodeCounts: true as const,
    qualitativeMechanismRejectionMayPersistWithoutQuantitativeDtConvergence:
      true as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticValveLocalInertancePressureRecoveryDtInputV1 =
  MainWireAorticValveLocalInertancePressureRecoveryFactorialInputV1 &
  Readonly<{ dtSec: number }>;

export type MainWireAorticValveLocalInertancePressureRecoveryDtConvergenceV1 =
  Readonly<{
    armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1;
    allRunsPeriod1AndIntegrated: boolean;
    relativeFineMinusCoarse: Readonly<{
      aorticForwardVolume: number;
      meanAorticPressure: number;
      leftVentricularEjectionFraction: number;
      aorticMaximumFlow: number;
      meanSimplifiedDopplerGradient: number;
      peakSimplifiedDopplerGradient: number;
      externalReferenceDistance: number;
    }>;
    absoluteFineMinusCoarse: Readonly<{
      ejectionTimeProxySec: number;
      accelerationTimeProxySec: number;
    }>;
    waveformTopology: Readonly<{
      coarseFlowPeakCountAboveFivePercent: number;
      fineFlowPeakCountAboveFivePercent: number;
      coarseThresholdEpisodeCount: number;
      fineThresholdEpisodeCount: number;
      stable: boolean;
    }>;
    gate: Readonly<{
      continuousMetricsWithinTolerance: boolean;
      gradientMetricsWithinTolerance: boolean;
      eventTimesWithinTolerance: boolean;
      waveformTopologyStable: boolean;
      passed: boolean;
    }>;
  }>;

export type MainWireAorticValveLocalInertancePressureRecoveryDtComparisonV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    factorials:
      readonly MainWireAorticValveLocalInertancePressureRecoveryFactorialV1[];
    convergence:
      readonly MainWireAorticValveLocalInertancePressureRecoveryDtConvergenceV1[];
    allFactorialsNumericallyValid: boolean;
    quantitativeTimeStepRobustnessEstablished: boolean;
    qualitativeRejection: Readonly<{
      localOnlyPeakFlowHigherThanCanonicalAtEveryDt: boolean;
      localOnlyPeakDopplerHigherThanCanonicalAtEveryDt: boolean;
      combinedPeakDopplerHigherThanCanonicalAtEveryDt: boolean;
      combinedSecondaryPeakPersistsAtEveryDt: boolean;
      externalReferenceDistanceNotImprovedByLocalInertanceAtEveryDt: boolean;
      mechanismRejectionPersistsAtEveryDt: boolean;
    }>;
    conclusion:
      | "numerically-inconclusive"
      | "mechanism-not-rejected"
      | "mechanism-rejected-qualitatively-but-quantitative-dt-convergence-failed"
      | "mechanism-rejected-with-quantitative-dt-robustness";
    claim:
      typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_CLAIM_V1;
  }>;

export function compareMainWireAorticValveLocalInertancePressureRecoveryDtV1(
  inputs:
    readonly MainWireAorticValveLocalInertancePressureRecoveryDtInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireAorticValveLocalInertancePressureRecoveryDtComparisonV1 {
  const expectedCount =
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_VALUES_SEC_V1.length
    * MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1.length;
  if (inputs.length !== expectedCount) {
    throw new Error(`AoV L x recovery dt comparison requires ${expectedCount} arms`);
  }
  const keys = new Set(inputs.map((input) => `${input.dtSec}/${input.armId}`));
  if (keys.size !== expectedCount) {
    throw new Error("AoV L x recovery dt comparison has duplicate arms");
  }
  const factorials = Object.freeze(
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_VALUES_SEC_V1
      .map((dtSec) => {
        const atDt = inputs.filter((input) => input.dtSec === dtSec);
        if (atDt.length !==
          MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1.length) {
          throw new Error(`AoV L x recovery dt comparison missing dt=${dtSec}`);
        }
        if (atDt.some((input) => input.periodicResult.dtSec !== dtSec)) {
          throw new Error(`AoV L x recovery result dt mismatch at dt=${dtSec}`);
        }
        return compareMainWireAorticValveLocalInertancePressureRecoveryFactorialV1(
          atDt,
          geometry,
        );
      }),
  );
  const coarse = requiredFactorial(factorials, 0.001);
  const fine = requiredFactorial(factorials, 0.0005);
  const convergence = Object.freeze(
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1.map(
      (armId) => measureConvergence(
        armId,
        requiredArm(coarse, armId),
        requiredArm(fine, armId),
      ),
    ),
  );
  const allFactorialsNumericallyValid = factorials.every((factorial) =>
    factorial.numericalGate.passed);
  const quantitativeTimeStepRobustnessEstablished = convergence.every(
    (entry) => entry.gate.passed,
  );
  const comparisons = factorials.map((factorial) => Object.freeze({
    canonical: requiredArm(factorial, "canonical"),
    local: requiredArm(
      factorial,
      "fixed-lvot-d2p3cm-column-l7cm-local-inertance",
    ),
    combined: requiredArm(
      factorial,
      "fixed-lvot-d2p3cm-column-l7cm-local-inertance-plus-pressure-recovery-aa-d3p0cm",
    ),
    decision: factorial.nextStepDecision,
  }));
  const qualitativeRejection = Object.freeze({
    localOnlyPeakFlowHigherThanCanonicalAtEveryDt: comparisons.every(
      ({ local, canonical }) => local.ablation.aorticMaximumFlowMlPerSec
        > canonical.ablation.aorticMaximumFlowMlPerSec,
    ),
    localOnlyPeakDopplerHigherThanCanonicalAtEveryDt: comparisons.every(
      ({ local, canonical }) =>
        local.observationStations.peakGradientMmHg.simplifiedDoppler
          > canonical.observationStations.peakGradientMmHg.simplifiedDoppler,
    ),
    combinedPeakDopplerHigherThanCanonicalAtEveryDt: comparisons.every(
      ({ combined, canonical }) =>
        combined.observationStations.peakGradientMmHg.simplifiedDoppler
          > canonical.observationStations.peakGradientMmHg.simplifiedDoppler,
    ),
    combinedSecondaryPeakPersistsAtEveryDt: comparisons.every(
      ({ combined }) => combined.ablation.aorticFlowPeakCountAboveFivePercent > 1,
    ),
    externalReferenceDistanceNotImprovedByLocalInertanceAtEveryDt:
      comparisons.every(({ local, canonical }) =>
        local.externalReferenceCompatibility.primaryReferenceBandDistanceRms
          >= canonical.externalReferenceCompatibility
            .primaryReferenceBandDistanceRms),
    mechanismRejectionPersistsAtEveryDt: comparisons.every(
      ({ decision }) => decision === "stop-local-inertance-as-primary-av-remedy",
    ),
  });
  const allQualitativeRejectionChecks = Object.values(qualitativeRejection)
    .every(Boolean);
  const conclusion = !allFactorialsNumericallyValid
    ? "numerically-inconclusive" as const
    : !allQualitativeRejectionChecks
      ? "mechanism-not-rejected" as const
      : quantitativeTimeStepRobustnessEstablished
        ? "mechanism-rejected-with-quantitative-dt-robustness" as const
        : "mechanism-rejected-qualitatively-but-quantitative-dt-convergence-failed" as const;
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    factorials,
    convergence,
    allFactorialsNumericallyValid,
    quantitativeTimeStepRobustnessEstablished,
    qualitativeRejection,
    conclusion,
    claim:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_CLAIM_V1,
  });
}

function measureConvergence(
  armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
  coarse: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
  fine: MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1,
): MainWireAorticValveLocalInertancePressureRecoveryDtConvergenceV1 {
  const relativeFineMinusCoarse = Object.freeze({
    aorticForwardVolume: relativeChange(
      fine.macro.aorticForwardVolumeMl,
      coarse.macro.aorticForwardVolumeMl,
    ),
    meanAorticPressure: relativeChange(
      fine.macro.meanAorticPressureMmHg,
      coarse.macro.meanAorticPressureMmHg,
    ),
    leftVentricularEjectionFraction: relativeChange(
      fine.macro.leftVentricularEjectionFraction01,
      coarse.macro.leftVentricularEjectionFraction01,
    ),
    aorticMaximumFlow: relativeChange(
      fine.ablation.aorticMaximumFlowMlPerSec,
      coarse.ablation.aorticMaximumFlowMlPerSec,
    ),
    meanSimplifiedDopplerGradient: relativeChange(
      fine.observationStations.timeMeanGradientMmHg.simplifiedDoppler,
      coarse.observationStations.timeMeanGradientMmHg.simplifiedDoppler,
    ),
    peakSimplifiedDopplerGradient: relativeChange(
      fine.observationStations.peakGradientMmHg.simplifiedDoppler,
      coarse.observationStations.peakGradientMmHg.simplifiedDoppler,
    ),
    externalReferenceDistance: relativeChange(
      fine.externalReferenceCompatibility.primaryReferenceBandDistanceRms,
      coarse.externalReferenceCompatibility.primaryReferenceBandDistanceRms,
    ),
  });
  const absoluteFineMinusCoarse = Object.freeze({
    ejectionTimeProxySec: Math.abs(
      fine.flowTiming.ejectionTimeProxySec
        - coarse.flowTiming.ejectionTimeProxySec,
    ),
    accelerationTimeProxySec: Math.abs(
      fine.flowTiming.accelerationTimeProxySec
        - coarse.flowTiming.accelerationTimeProxySec,
    ),
  });
  const waveformTopology = Object.freeze({
    coarseFlowPeakCountAboveFivePercent:
      coarse.ablation.aorticFlowPeakCountAboveFivePercent,
    fineFlowPeakCountAboveFivePercent:
      fine.ablation.aorticFlowPeakCountAboveFivePercent,
    coarseThresholdEpisodeCount: coarse.flowTiming.thresholdEpisodeCount,
    fineThresholdEpisodeCount: fine.flowTiming.thresholdEpisodeCount,
    stable: coarse.ablation.aorticFlowPeakCountAboveFivePercent
        === fine.ablation.aorticFlowPeakCountAboveFivePercent
      && coarse.flowTiming.thresholdEpisodeCount
        === fine.flowTiming.thresholdEpisodeCount,
  });
  const claim =
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_CLAIM_V1;
  const continuousMetricsWithinTolerance = [
    relativeFineMinusCoarse.aorticForwardVolume,
    relativeFineMinusCoarse.meanAorticPressure,
    relativeFineMinusCoarse.leftVentricularEjectionFraction,
    relativeFineMinusCoarse.aorticMaximumFlow,
    relativeFineMinusCoarse.externalReferenceDistance,
  ].every((value) => Math.abs(value) <= claim.continuousRelativeTolerance);
  const gradientMetricsWithinTolerance = [
    relativeFineMinusCoarse.meanSimplifiedDopplerGradient,
    relativeFineMinusCoarse.peakSimplifiedDopplerGradient,
  ].every((value) => Math.abs(value) <= claim.gradientRelativeTolerance);
  const eventTimesWithinTolerance = Object.values(absoluteFineMinusCoarse)
    .every((value) => value <= claim.eventTimeAbsoluteToleranceSec);
  const gate = Object.freeze({
    continuousMetricsWithinTolerance,
    gradientMetricsWithinTolerance,
    eventTimesWithinTolerance,
    waveformTopologyStable: waveformTopology.stable,
    passed: continuousMetricsWithinTolerance
      && gradientMetricsWithinTolerance
      && eventTimesWithinTolerance
      && waveformTopology.stable,
  });
  return Object.freeze({
    armId,
    allRunsPeriod1AndIntegrated:
      coarse.ablation.periodicSteadyStateClaimed
      && coarse.ablation.integrationCompletedWithoutFailure
      && fine.ablation.periodicSteadyStateClaimed
      && fine.ablation.integrationCompletedWithoutFailure,
    relativeFineMinusCoarse,
    absoluteFineMinusCoarse,
    waveformTopology,
    gate,
  });
}

function requiredFactorial(
  factorials:
    readonly MainWireAorticValveLocalInertancePressureRecoveryFactorialV1[],
  dtSec: number,
): MainWireAorticValveLocalInertancePressureRecoveryFactorialV1 {
  const factorial = factorials.find((candidate) =>
    candidate.arms[0]?.ablation.dtSec === dtSec);
  if (factorial === undefined) throw new Error(`missing AoV factorial dt=${dtSec}`);
  return factorial;
}

function requiredArm(
  factorial: MainWireAorticValveLocalInertancePressureRecoveryFactorialV1,
  armId: MainWireAorticValveLocalInertancePressureRecoveryArmIdV1,
): MainWireAorticValveLocalInertancePressureRecoveryMeasuredArmV1 {
  const arm = factorial.arms.find((candidate) => candidate.arm.armId === armId);
  if (arm === undefined) throw new Error(`missing AoV dt arm: ${armId}`);
  return arm;
}

function relativeChange(value: number, reference: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(reference) || reference === 0) {
    throw new Error("dt comparison requires finite values and nonzero reference");
  }
  return value / reference - 1;
}
