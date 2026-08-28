import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_MACRO_RESTORATION_OBSERVABLE_IDS_V1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateComparisonV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1,
  measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumSourceTraceFitParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1,
  type MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveGridV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PARETO_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-tref-passive-pareto-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_SOURCE_BASELINE_PROFILE_ID_V1 =
  "tref-1p00-passive-1p000" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_OUTFLOW_SHAPE_OBSERVABLE_IDS_V1 =
  Object.freeze([
    "aortic-ejection-time",
    "aortic-maximum-flow",
  ] as const satisfies readonly MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1[]);

const PARETO_DOMINANCE_ABSOLUTE_TOLERANCE = 1e-12;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PARETO_CLAIM_V1 =
  Object.freeze({
    source: "independent-cold-start-last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    fixedFactorialProfileCount:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1.length,
    canonicalControlRole:
      "prior-macro-phenotype-reference-not-clinical-ground-truth" as const,
    sourceBaselineProfileId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_SOURCE_BASELINE_PROFILE_ID_V1,
    objectiveDefinition:
      "three-separate-unweighted-rms-relative-distances-to-canonical-control" as const,
    macroObjectiveIncludes:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_MACRO_RESTORATION_OBSERVABLE_IDS_V1,
    fillingPressureObjectiveIncludes: Object.freeze([
      "mean-left-atrial-absolute-pressure",
      "mean-pulmonary-vein-absolute-pressure",
      "mean-central-venous-absolute-pressure",
      "left-ventricular-end-diastolic-absolute-pressure",
    ] as const),
    outflowShapeObjectiveIncludes:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_OUTFLOW_SHAPE_OBSERVABLE_IDS_V1,
    equalWeightCompositeIsDiagnosticNotClinicalUtility: true as const,
    paretoDominanceAbsoluteTolerance:
      PARETO_DOMINANCE_ABSOLUTE_TOLERANCE,
    measurementCovarianceApplied: false as const,
    clinicalTargetsApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    aorticGradientStationsKeptDistinct: true as const,
    gradientsExcludedFromObjectivesToAvoidDuplicateFixedEoaFlowWeighting:
      true as const,
    pressureRecoveryFeedsBackIntoExactModel: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoInputV1 =
  Readonly<{
    profileId:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1 =
  Readonly<{
    macroRestorationRmsRelativeDistanceToCanonical: number;
    fillingPressureRmsRelativeDistanceToCanonical: number;
    outflowShapeRmsRelativeDistanceToCanonical: number;
    equalWeightThreeObjectiveRmsDistanceToCanonical: number;
  }>;

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectiveEvaluationV1 =
  Readonly<{
    relativeDifferenceFromCanonical:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
    leftVentricularEndDiastolicPressureRelativeDifferenceFromCanonical:
      number;
    ejectionConcentrationIndex: number;
    ejectionConcentrationIndexRelativeDifferenceFromCanonical: number;
    objectives:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1;
  }>;

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoArmV1 =
  Readonly<{
    profile: MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1;
    readback:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    relativeDifferenceFromCanonical:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
    leftVentricularEndDiastolicPressureRelativeDifferenceFromCanonical:
      number;
    ejectionConcentrationIndex: number;
    ejectionConcentrationIndexRelativeDifferenceFromCanonical: number;
    objectives:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1;
    paretoDominatedByProfileIds:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1[];
    paretoOptimal: boolean;
  }>;

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PARETO_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    canonicalControl:
      MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;
    canonicalEjectionConcentrationIndex: number;
    arms:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoArmV1[];
    sourceBaseline:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoArmV1;
    paretoProfileIds:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1[];
    rankByMacroRestorationDistance:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1[];
    rankByFillingPressureDistance:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1[];
    rankByOutflowShapeDistance:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1[];
    rankByEqualWeightThreeObjectiveDistance:
      readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1[];
    sourceGridArmsShareCalciumDriveIdentity: boolean;
    canonicalAndSourceCalciumDriveIdentitiesAreDistinct: boolean;
    allRunsPeriod1AndIntegrated: boolean;
    interpretationEligible: boolean;
    claim:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PARETO_CLAIM_V1;
  }>;

export function analyzeMainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1(
  canonicalControlResult: MainWireNormalAdultFiveWallPeriodicResultV1,
  inputs:
    readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1 {
  const byId = new Map<
    MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1,
    MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoInputV1
  >();
  for (const input of inputs) {
    if (byId.has(input.profileId)) {
      throw new Error(`duplicate source-calcium Tref/passive arm: ${input.profileId}`);
    }
    byId.set(input.profileId, input);
  }
  if (byId.size
    !== MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1.length) {
    throw new Error(
      `source-calcium Tref/passive Pareto analysis requires ${
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1.length
      } arms`,
    );
  }
  const dtSec = canonicalControlResult.dtSec;
  if (inputs.some((input) => input.periodicResult.dtSec !== dtSec)) {
    throw new Error("source-calcium Tref/passive Pareto analysis requires one common dt");
  }
  const canonicalControl =
    measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
      canonicalControlResult,
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      "canonical-control",
      geometry,
    );
  const canonicalEjectionConcentrationIndex = ejectionConcentrationIndex(
    canonicalControl,
    "canonical-control",
  );
  const sourceCalcium =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const provisional = MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1
    .map((profileId) => {
      const input = byId.get(profileId);
      if (input === undefined) {
        throw new Error(`missing source-calcium Tref/passive arm: ${profileId}`);
      }
      const profile =
        resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1(
          profileId,
        );
      const readback =
        measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
          input.periodicResult,
          sourceCalcium,
          profileId,
          geometry,
        );
      return {
        profile,
        readback,
        ...evaluateMainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1(
          readback,
          canonicalControl,
          profileId,
        ),
      };
    });
  const arms = Object.freeze(provisional.map((candidate) => {
    const paretoDominatedByProfileIds = Object.freeze(provisional
      .filter((other) => other.profile.profileId !== candidate.profile.profileId
        && dominates(other.objectives, candidate.objectives))
      .map((other) => other.profile.profileId));
    return Object.freeze({
      ...candidate,
      paretoDominatedByProfileIds,
      paretoOptimal: paretoDominatedByProfileIds.length === 0,
    });
  }));
  const sourceBaseline = arms.find((arm) => arm.profile.profileId
    === MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_SOURCE_BASELINE_PROFILE_ID_V1);
  if (sourceBaseline === undefined) {
    throw new Error("source-calcium Tref/passive source baseline is missing");
  }
  const rank = (
    select: (
      arm: MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoArmV1,
    ) => number,
  ) => Object.freeze([...arms]
    .sort((left, right) => select(left) - select(right))
    .map((arm) => arm.profile.profileId));
  const sourceHashes = new Set(arms.map((arm) =>
    arm.readback.calciumDriveFixedParamsStableHash));
  const sourceGridArmsShareCalciumDriveIdentity = sourceHashes.size === 1;
  const canonicalAndSourceCalciumDriveIdentitiesAreDistinct =
    canonicalControl.calciumDriveFixedParamsStableHash
      !== sourceBaseline.readback.calciumDriveFixedParamsStableHash;
  const allRunsPeriod1AndIntegrated = [
    canonicalControl,
    ...arms.map((arm) => arm.readback),
  ].every((readback) => readback.periodicSteadyStateClaimed
    && readback.integrationCompletedWithoutFailure);
  return Object.freeze({
    methodId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PARETO_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    canonicalControl,
    canonicalEjectionConcentrationIndex,
    arms,
    sourceBaseline,
    paretoProfileIds: Object.freeze(arms
      .filter((arm) => arm.paretoOptimal)
      .map((arm) => arm.profile.profileId)),
    rankByMacroRestorationDistance: rank((arm) =>
      arm.objectives.macroRestorationRmsRelativeDistanceToCanonical),
    rankByFillingPressureDistance: rank((arm) =>
      arm.objectives.fillingPressureRmsRelativeDistanceToCanonical),
    rankByOutflowShapeDistance: rank((arm) =>
      arm.objectives.outflowShapeRmsRelativeDistanceToCanonical),
    rankByEqualWeightThreeObjectiveDistance: rank((arm) =>
      arm.objectives.equalWeightThreeObjectiveRmsDistanceToCanonical),
    sourceGridArmsShareCalciumDriveIdentity,
    canonicalAndSourceCalciumDriveIdentitiesAreDistinct,
    allRunsPeriod1AndIntegrated,
    interpretationEligible:
      sourceGridArmsShareCalciumDriveIdentity
      && canonicalAndSourceCalciumDriveIdentitiesAreDistinct
      && allRunsPeriod1AndIntegrated,
    claim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PARETO_CLAIM_V1,
  });
}

/** Shared objective evaluation for paired post-grid mechanism probes. */
export function evaluateMainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1(
  readback: MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
  canonicalControl:
    MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
  label: string,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectiveEvaluationV1 {
  const relativeDifferenceFromCanonical = relativeRecord(
    readback.svdObservableValues,
    canonicalControl.svdObservableValues,
  );
  const leftVentricularEndDiastolicPressureRelativeDifferenceFromCanonical =
    relativeDifference(
      readback.fillingAndPressureReadback
        .leftVentricularEndDiastolicAbsolutePressureMmHg,
      canonicalControl.fillingAndPressureReadback
        .leftVentricularEndDiastolicAbsolutePressureMmHg,
      "left-ventricular-end-diastolic-absolute-pressure",
    );
  const concentration = ejectionConcentrationIndex(readback, label);
  const canonicalConcentration = ejectionConcentrationIndex(
    canonicalControl,
    "canonical-control",
  );
  return Object.freeze({
    relativeDifferenceFromCanonical,
    leftVentricularEndDiastolicPressureRelativeDifferenceFromCanonical,
    ejectionConcentrationIndex: concentration,
    ejectionConcentrationIndexRelativeDifferenceFromCanonical:
      concentration / canonicalConcentration - 1,
    objectives: objectives(
      relativeDifferenceFromCanonical,
      leftVentricularEndDiastolicPressureRelativeDifferenceFromCanonical,
    ),
  });
}

function objectives(
  relative:
    MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
  leftVentricularEndDiastolicPressureRelative: number,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1 {
  const macroRestorationRmsRelativeDistanceToCanonical = rms(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_MACRO_RESTORATION_OBSERVABLE_IDS_V1
      .map((id) => relative[id]),
  );
  const fillingPressureRmsRelativeDistanceToCanonical = rms([
    relative["mean-left-atrial-absolute-pressure"],
    relative["mean-pulmonary-vein-absolute-pressure"],
    relative["mean-central-venous-absolute-pressure"],
    leftVentricularEndDiastolicPressureRelative,
  ]);
  const outflowShapeRmsRelativeDistanceToCanonical = rms(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_OUTFLOW_SHAPE_OBSERVABLE_IDS_V1
      .map((id) => relative[id]),
  );
  return Object.freeze({
    macroRestorationRmsRelativeDistanceToCanonical,
    fillingPressureRmsRelativeDistanceToCanonical,
    outflowShapeRmsRelativeDistanceToCanonical,
    equalWeightThreeObjectiveRmsDistanceToCanonical: rms([
      macroRestorationRmsRelativeDistanceToCanonical,
      fillingPressureRmsRelativeDistanceToCanonical,
      outflowShapeRmsRelativeDistanceToCanonical,
    ]),
  });
}

function dominates(
  left: MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1,
  right: MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1,
): boolean {
  const leftValues = objectiveVector(left);
  const rightValues = objectiveVector(right);
  return leftValues.every((value, index) =>
    value <= rightValues[index]! + PARETO_DOMINANCE_ABSOLUTE_TOLERANCE)
    && leftValues.some((value, index) =>
      value < rightValues[index]! - PARETO_DOMINANCE_ABSOLUTE_TOLERANCE);
}

function objectiveVector(
  value: MainWireVentricularCalciumSourceTraceFitTrefPassiveObjectivesV1,
): readonly number[] {
  return [
    value.macroRestorationRmsRelativeDistanceToCanonical,
    value.fillingPressureRmsRelativeDistanceToCanonical,
    value.outflowShapeRmsRelativeDistanceToCanonical,
  ];
}

function relativeRecord(
  value: MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
  reference: MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1 {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1
      .map((id) => [id, relativeDifference(value[id], reference[id], id)]),
  )) as MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
}

function relativeDifference(
  value: number,
  reference: number,
  label: string,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(reference)
    || Math.abs(reference) <= 1e-12) {
    throw new Error(`${label} requires finite values and a nonzero reference`);
  }
  return value / reference - 1;
}

function ejectionConcentrationIndex(
  readback: MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1,
  label: string,
): number {
  const value = readback.cycle.aorticMaximumFlowMlPerSec
    * readback.cycle.aorticEjectionTimeProxySec
    / readback.cycle.aorticForwardVolumeMl;
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${label} has an invalid ejection concentration index`);
  }
  return value;
}

function rms(values: readonly number[]): number {
  if (values.length === 0 || !values.every(Number.isFinite)) {
    throw new Error("RMS requires a nonempty finite vector");
  }
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)
    / values.length);
}
