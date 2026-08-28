import {
  measureMainWireAorticValveObservationStationsV1,
  type MainWireAorticValveObservationGeometryV1,
  type MainWireAorticValveObservationStationsV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  type MainWireAorticOutflowCalciumWaveformCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumParamsAgainstSourceTraceV1,
  type MainWireVentricularCalciumSourceTraceApproximationMetricsV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
  type MainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-dt-comparison-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_IDS_V1 =
  Object.freeze([
    "canonical-analytic",
    "source-extrema-scalar-matched",
    "source-whole-trace-alpha-fit",
  ] as const);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_VALUES_SEC_V1 =
  Object.freeze([0.002, 0.001, 0.0005] as const);

export type MainWireVentricularCalciumSourceTraceFitComparisonProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_IDS_V1)[number];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_CLAIM_V1 =
  Object.freeze({
    source: "independent-cold-start-last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    sourceTraceFitUsesHemodynamics: false as const,
    sourceTraceFitUsesLandTension: false as const,
    closedLoopComparisonChangesOnlyVentricularCalciumParams: true as const,
    isometricStretchContexts: Object.freeze([1, 1.1] as const),
    observationStationsAreAnalysisOnly: true as const,
    dtValuesSec: MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_VALUES_SEC_V1,
    continuousLastHalvingTolerance: 0.01,
    gradientLastHalvingTolerance: 0.01,
    eventTimeLastHalvingToleranceSec: 0.001,
    fittingToHemodynamicOutcomesApplied: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireVentricularCalciumSourceTraceFitDtArmInputV1 = Readonly<{
  profileId: MainWireVentricularCalciumSourceTraceFitComparisonProfileIdV1;
  dtSec: number;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  sourceTraceOnsetOffsetSec: number;
}>;

export type MainWireVentricularCalciumSourceTraceFitDtArmV1 = Readonly<{
  profileId: MainWireVentricularCalciumSourceTraceFitComparisonProfileIdV1;
  dtSec: number;
  sourceApproximation:
    MainWireVentricularCalciumSourceTraceApproximationMetricsV1;
  isometricAtLandStretch1:
    MainWireVentricularLandIsometricTwitchAuditV1;
  isometricAtLandStretch1p1:
    MainWireVentricularLandIsometricTwitchAuditV1;
  cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
  observationStations: MainWireAorticValveObservationStationsV1;
}>;

export type MainWireVentricularCalciumSourceTraceFitDtConvergenceV1 =
  Readonly<{
    profileId: MainWireVentricularCalciumSourceTraceFitComparisonProfileIdV1;
    allRunsPeriod1AndIntegrated: boolean;
    lastHalvingFineDtSec: 0.0005;
    lastHalvingCoarseDtSec: 0.001;
    relativeFineMinusCoarse: Readonly<{
      aorticForwardVolume: number;
      aorticMaximumFlow: number;
      meanSimplifiedDopplerGradient: number;
      peakSimplifiedDopplerGradient: number;
      cardiacOutput: number;
      meanAorticPressure: number;
      peakLeftVentricularPressure: number;
      leftVentricularEjectionFraction: number;
      lvfwIsometricPeakAtStretch1: number;
      lvfwIsometricPeakAtStretch1p1: number;
    }>;
    absoluteEventTimeFineMinusCoarseSec: Readonly<{
      aorticEjectionTimeProxy: number;
      timeFromAorticFlowOnsetToPeak: number;
      isometricTimeToPeakAtStretch1: number;
    }>;
    gate: Readonly<{
      continuousMetricsWithinTolerance: boolean;
      gradientMetricsWithinTolerance: boolean;
      eventTimesWithinTolerance: boolean;
      passed: boolean;
    }>;
  }>;

export type MainWireVentricularCalciumSourceTraceFitDtComparisonV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    arms: readonly MainWireVentricularCalciumSourceTraceFitDtArmV1[];
    convergence:
      readonly MainWireVentricularCalciumSourceTraceFitDtConvergenceV1[];
    claim:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_CLAIM_V1;
  }>;

export function compareMainWireVentricularCalciumSourceTraceFitDtV1(
  inputs: readonly MainWireVentricularCalciumSourceTraceFitDtArmInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireVentricularCalciumSourceTraceFitDtComparisonV1 {
  const byKey = new Map<string,
    MainWireVentricularCalciumSourceTraceFitDtArmInputV1>();
  for (const input of inputs) {
    const key = armKey(input.profileId, input.dtSec);
    if (byKey.has(key)) throw new Error(`duplicate calcium dt arm: ${key}`);
    byKey.set(key, input);
  }
  const expectedCount =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_IDS_V1.length
    * MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_VALUES_SEC_V1.length;
  if (byKey.size !== expectedCount) {
    throw new Error(`calcium dt comparison requires ${expectedCount} arms`);
  }
  const arms = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_IDS_V1.flatMap(
      (profileId) =>
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_VALUES_SEC_V1.map(
          (dtSec) => {
            const input = byKey.get(armKey(profileId, dtSec));
            if (input === undefined) {
              throw new Error(`missing calcium dt arm: ${armKey(profileId, dtSec)}`);
            }
            if (input.periodicResult.dtSec !== dtSec) {
              throw new Error(`calcium dt arm ${armKey(profileId, dtSec)} result dt mismatch`);
            }
            return measureArm(input, geometry);
          },
        ),
    ),
  );
  const convergence = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PROFILE_IDS_V1.map(
      (profileId) => measureConvergence(
        profileId,
        arms.filter((arm) => arm.profileId === profileId),
      ),
    ),
  );
  return Object.freeze({
    methodId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    arms,
    convergence,
    claim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireVentricularCalciumSourceTraceFitDtArmInputV1,
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireVentricularCalciumSourceTraceFitDtArmV1 {
  return Object.freeze({
    profileId: input.profileId,
    dtSec: input.dtSec,
    sourceApproximation:
      measureMainWireVentricularCalciumParamsAgainstSourceTraceV1(
        input.calciumDriveParams,
        input.sourceTraceOnsetOffsetSec,
      ),
    isometricAtLandStretch1:
      measureMainWireVentricularLandIsometricTwitchAuditV1(
        input.calciumDriveParams,
        { dtSec: input.dtSec, fixedLandStretch: 1 },
      ),
    isometricAtLandStretch1p1:
      measureMainWireVentricularLandIsometricTwitchAuditV1(
        input.calciumDriveParams,
        { dtSec: input.dtSec, fixedLandStretch: 1.1 },
      ),
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      input.periodicResult,
      input.calciumDriveParams,
      `${input.profileId}@${input.dtSec}`,
    ),
    observationStations: measureMainWireAorticValveObservationStationsV1(
      input.periodicResult,
      geometry,
    ),
  });
}

function measureConvergence(
  profileId: MainWireVentricularCalciumSourceTraceFitComparisonProfileIdV1,
  arms: readonly MainWireVentricularCalciumSourceTraceFitDtArmV1[],
): MainWireVentricularCalciumSourceTraceFitDtConvergenceV1 {
  const coarse = arms.find((arm) => arm.dtSec === 0.001);
  const fine = arms.find((arm) => arm.dtSec === 0.0005);
  if (coarse === undefined || fine === undefined || arms.length !== 3) {
    throw new Error(`${profileId} dt convergence requires three arms`);
  }
  const relativeFineMinusCoarse = Object.freeze({
    aorticForwardVolume: relativeChange(
      fine.cycle.aorticForwardVolumeMl,
      coarse.cycle.aorticForwardVolumeMl,
    ),
    aorticMaximumFlow: relativeChange(
      fine.cycle.aorticMaximumFlowMlPerSec,
      coarse.cycle.aorticMaximumFlowMlPerSec,
    ),
    meanSimplifiedDopplerGradient: relativeChange(
      fine.cycle.meanDopplerGradientMmHg,
      coarse.cycle.meanDopplerGradientMmHg,
    ),
    peakSimplifiedDopplerGradient: relativeChange(
      fine.cycle.peakDopplerGradientMmHg,
      coarse.cycle.peakDopplerGradientMmHg,
    ),
    cardiacOutput: relativeChange(
      fine.cycle.netAorticCardiacOutputLPerMin,
      coarse.cycle.netAorticCardiacOutputLPerMin,
    ),
    meanAorticPressure: relativeChange(
      fine.cycle.meanAorticAbsolutePressureMmHg,
      coarse.cycle.meanAorticAbsolutePressureMmHg,
    ),
    peakLeftVentricularPressure: relativeChange(
      fine.cycle.peakLeftVentricularPressureMmHg,
      coarse.cycle.peakLeftVentricularPressureMmHg,
    ),
    leftVentricularEjectionFraction: relativeChange(
      fine.cycle.leftVentricularEjectionFraction01,
      coarse.cycle.leftVentricularEjectionFraction01,
    ),
    lvfwIsometricPeakAtStretch1: relativeChange(
      fine.isometricAtLandStretch1.activeTwitch.peakKPa,
      coarse.isometricAtLandStretch1.activeTwitch.peakKPa,
    ),
    lvfwIsometricPeakAtStretch1p1: relativeChange(
      fine.isometricAtLandStretch1p1.activeTwitch.peakKPa,
      coarse.isometricAtLandStretch1p1.activeTwitch.peakKPa,
    ),
  });
  const absoluteEventTimeFineMinusCoarseSec = Object.freeze({
    aorticEjectionTimeProxy: Math.abs(
      fine.cycle.aorticEjectionTimeProxySec
      - coarse.cycle.aorticEjectionTimeProxySec,
    ),
    timeFromAorticFlowOnsetToPeak: Math.abs(
      fine.cycle.timeFromAorticFlowOnsetToPeakSec
      - coarse.cycle.timeFromAorticFlowOnsetToPeakSec,
    ),
    isometricTimeToPeakAtStretch1: Math.abs(
      fine.isometricAtLandStretch1.activeTwitch.timeToPeakSec
      - coarse.isometricAtLandStretch1.activeTwitch.timeToPeakSec,
    ),
  });
  const continuousTolerance =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_CLAIM_V1
      .continuousLastHalvingTolerance;
  const gradientTolerance =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_CLAIM_V1
      .gradientLastHalvingTolerance;
  const eventTolerance =
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_COMPARISON_CLAIM_V1
      .eventTimeLastHalvingToleranceSec;
  const continuousMetricsWithinTolerance = [
    relativeFineMinusCoarse.aorticForwardVolume,
    relativeFineMinusCoarse.aorticMaximumFlow,
    relativeFineMinusCoarse.cardiacOutput,
    relativeFineMinusCoarse.meanAorticPressure,
    relativeFineMinusCoarse.peakLeftVentricularPressure,
    relativeFineMinusCoarse.leftVentricularEjectionFraction,
    relativeFineMinusCoarse.lvfwIsometricPeakAtStretch1,
    relativeFineMinusCoarse.lvfwIsometricPeakAtStretch1p1,
  ].every((value) => Math.abs(value) <= continuousTolerance);
  const gradientMetricsWithinTolerance = [
    relativeFineMinusCoarse.meanSimplifiedDopplerGradient,
    relativeFineMinusCoarse.peakSimplifiedDopplerGradient,
  ].every((value) => Math.abs(value) <= gradientTolerance);
  const eventTimesWithinTolerance = Object.values(
    absoluteEventTimeFineMinusCoarseSec,
  ).every((value) => value <= eventTolerance);
  const allRunsPeriod1AndIntegrated = arms.every((arm) =>
    arm.cycle.periodicSteadyStateClaimed
    && arm.cycle.integrationCompletedWithoutFailure);
  return Object.freeze({
    profileId,
    allRunsPeriod1AndIntegrated,
    lastHalvingFineDtSec: 0.0005 as const,
    lastHalvingCoarseDtSec: 0.001 as const,
    relativeFineMinusCoarse,
    absoluteEventTimeFineMinusCoarseSec,
    gate: Object.freeze({
      continuousMetricsWithinTolerance,
      gradientMetricsWithinTolerance,
      eventTimesWithinTolerance,
      passed:
        allRunsPeriod1AndIntegrated
        && continuousMetricsWithinTolerance
        && gradientMetricsWithinTolerance
        && eventTimesWithinTolerance,
    }),
  });
}

function armKey(
  profileId: MainWireVentricularCalciumSourceTraceFitComparisonProfileIdV1,
  dtSec: number,
): string {
  return `${profileId}@${dtSec}`;
}

function relativeChange(value: number, reference: number): number {
  if (reference === 0) throw new Error("relative change reference is zero");
  return value / reference - 1;
}
