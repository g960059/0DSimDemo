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
  resolveMainWireVentricularCalciumSourceTraceFitParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";
import type {
  FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1,
  resolveMainWireVentricularCalciumSourceTraceFitRecalibrationPointV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationAxisIdV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1,
  type MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitRecalibrationPointsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-recalibration-sensitivity-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1 =
  Object.freeze([
    "aortic-forward-volume",
    "mean-aortic-pressure",
    "left-ventricular-ejection-fraction",
    "aortic-ejection-time",
    "aortic-maximum-flow",
    "peak-left-ventricular-pressure",
    "left-ventricular-end-diastolic-volume",
    "mean-left-atrial-absolute-pressure",
    "mean-pulmonary-vein-absolute-pressure",
    "mean-central-venous-absolute-pressure",
  ] as const);

export type MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1)[number];

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_CLAIM_V1 =
  Object.freeze({
    source: "independent-cold-start-last-retained-complete-beat" as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    ventricularCalciumProfileHeldFixed: true as const,
    oneFactorAtATime: true as const,
    lowScale: 0.75 as const,
    highScale: 1.3333333333333333 as const,
    centralParameterCoordinate: "natural-log-scale" as const,
    sensitivityDefinition:
      "high-minus-low-output-divided-by-baseline-output-and-log-scale-span" as const,
    midpointDefectDefinition:
      "half-high-plus-low-minus-baseline-divided-by-absolute-baseline" as const,
    svdRowsAreBaselineRelativeAndEquallyWeighted: true as const,
    measurementCovarianceApplied: false as const,
    gradientRowsExcludedFromSvdToAvoidDuplicatingFixedEoaFlowInformation:
      true as const,
    stationSeparatedAorticGradientsStillReported: true as const,
    leftVentricularEndDiastolicPressureProxy:
      "accepted-sample-at-maximum-LV-volume-no-interpolation" as const,
    centralVenousPressureProxy: "cycle-mean-VC-absolute-node-pressure" as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    clinicalTargetsApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    practicalRankThresholdsAreDiagnosticNotStatistical: true as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireVentricularCalciumSourceTraceFitRecalibrationArmInputV1 =
  Readonly<{
    pointId:
      MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  }>;

export type MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1 =
  Readonly<Record<
    MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1,
    number
  >>;

export type MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1 =
  Readonly<{
    protocolIdentityHash: string;
    calciumDriveFixedParamsStableHash: string;
    periodicSteadyStateClaimed: boolean;
    integrationCompletedWithoutFailure: boolean;
    cycle: MainWireAorticOutflowCalciumWaveformCycleMetricsV1;
    observationStations: MainWireAorticValveObservationStationsV1;
    fillingAndPressureReadback: Readonly<{
      meanLeftAtrialAbsolutePressureMmHg: number;
      meanLeftAtrialTransmuralPressureMmHg: number;
      meanPulmonaryVeinAbsolutePressureMmHg: number;
      meanCentralVenousAbsolutePressureMmHg: number;
      meanPulmonaryArteryAbsolutePressureMmHg: number;
      leftVentricularEndDiastolicVolumeMl: number;
      leftVentricularEndDiastolicAbsolutePressureMmHg: number;
      leftVentricularEndDiastolicTransmuralPressureMmHg: number;
      leftVentricularEndDiastolicSamplePhase01: number;
      fixedTotalBloodVolumeMl: number;
    }>;
    svdObservableValues:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
  }>;

export type MainWireVentricularCalciumSourceTraceFitRecalibrationArmV1 =
  Readonly<{
    point: MainWireVentricularCalciumSourceTraceFitRecalibrationPointV1;
  }> & MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1;

export type MainWireVentricularCalciumSourceTraceFitRecalibrationAxisSensitivityV1 =
  Readonly<{
    axisId:
      MainWireVentricularCalciumSourceTraceFitRecalibrationAxisIdV1;
    lowPointId:
      MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1;
    highPointId:
      MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1;
    lowScaleFromBaseline: number;
    highScaleFromBaseline: number;
    naturalLogScaleSpan: number;
    baselineRelativeSensitivity:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
    baselineRelativeMidpointDefect:
      MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1;
  }>;

export type MainWireRectangularSvdV1 = Readonly<{
  rowCount: number;
  columnCount: number;
  singularValues: readonly number[];
  relativeSingularValues: readonly number[];
  rightSingularVectorsByMode: readonly (readonly number[])[];
  leftSingularVectorsByMode: readonly (readonly number[])[];
  numericalRank: number;
  numericalRankTolerance: number;
  effectiveRankAtRelativeThreshold: Readonly<{
    p01: number;
    p05: number;
    p10: number;
  }>;
  conditionNumberAtNumericalRank: number | null;
  weakestRightSingularVector: readonly number[];
  maximumRightOrthogonalityResidual: number;
  maximumLeftOrthogonalityResidualForNonzeroModes: number;
  maximumAbsoluteReconstructionResidual: number;
  jacobiConverged: boolean;
  jacobiIterationCount: number;
}>;

export type MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_V1_ID;
    geometry: MainWireAorticValveObservationGeometryV1;
    rowObservableIds:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1;
    columnAxisIds:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1;
    arms:
      readonly MainWireVentricularCalciumSourceTraceFitRecalibrationArmV1[];
    allArmsShareCalciumDriveIdentity: boolean;
    allArmsPeriod1AndIntegrated: boolean;
    interpretationEligible: boolean;
    axisSensitivities:
      readonly MainWireVentricularCalciumSourceTraceFitRecalibrationAxisSensitivityV1[];
    dimensionlessSensitivityMatrixByObservableThenAxis:
      readonly (readonly number[])[];
    parameterColumnCosineSimilarity:
      readonly (readonly number[])[];
    svd: MainWireRectangularSvdV1;
    weakestParameterCombination: Readonly<Record<
      MainWireVentricularCalciumSourceTraceFitRecalibrationAxisIdV1,
      number
    >>;
    claim:
      typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_CLAIM_V1;
  }>;

export function measureMainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1(
  inputs:
    readonly MainWireVentricularCalciumSourceTraceFitRecalibrationArmInputV1[],
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1 {
  const byPoint = new Map<
    MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1,
    MainWireVentricularCalciumSourceTraceFitRecalibrationArmInputV1
  >();
  for (const input of inputs) {
    if (byPoint.has(input.pointId)) {
      throw new Error(`duplicate calcium recalibration point: ${input.pointId}`);
    }
    byPoint.set(input.pointId, input);
  }
  if (byPoint.size !==
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1.length) {
    throw new Error(
      `calcium recalibration sensitivity requires ${
        MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1.length
      } arms`,
    );
  }
  const calciumDriveParams =
    resolveMainWireVentricularCalciumSourceTraceFitParamsV1();
  const arms = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1
      .map((pointId) => {
        const input = byPoint.get(pointId);
        if (input === undefined) {
          throw new Error(`missing calcium recalibration point: ${pointId}`);
        }
        return measureArm(input, geometry, calciumDriveParams);
      }),
  );
  const baseline = requiredArm(arms, "baseline");
  const axisSensitivities = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1
      .map((axisId) => measureAxisSensitivity(axisId, arms, baseline)),
  );
  const dimensionlessSensitivityMatrixByObservableThenAxis = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1
      .map((observableId) => Object.freeze(axisSensitivities.map((axis) =>
        axis.baselineRelativeSensitivity[observableId]))),
  );
  const svd = analyzeDimensionlessSensitivityMatrixSvdV1(
    dimensionlessSensitivityMatrixByObservableThenAxis,
  );
  const weakestParameterCombination = Object.freeze(Object.fromEntries(
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1
      .map((axisId, index) => [
        axisId,
        svd.weakestRightSingularVector[index]!,
      ]),
  )) as Readonly<Record<
    MainWireVentricularCalciumSourceTraceFitRecalibrationAxisIdV1,
    number
  >>;
  const calciumHashes = new Set(arms.map((arm) =>
    arm.calciumDriveFixedParamsStableHash));
  const allArmsShareCalciumDriveIdentity = calciumHashes.size === 1;
  const allArmsPeriod1AndIntegrated = arms.every((arm) =>
    arm.periodicSteadyStateClaimed
    && arm.integrationCompletedWithoutFailure);
  return Object.freeze({
    methodId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_V1_ID,
    geometry: Object.freeze({ ...geometry }),
    rowObservableIds:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1,
    columnAxisIds:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_AXIS_IDS_V1,
    arms,
    allArmsShareCalciumDriveIdentity,
    allArmsPeriod1AndIntegrated,
    interpretationEligible:
      allArmsShareCalciumDriveIdentity && allArmsPeriod1AndIntegrated,
    axisSensitivities,
    dimensionlessSensitivityMatrixByObservableThenAxis,
    parameterColumnCosineSimilarity: columnCosineSimilarity(
      dimensionlessSensitivityMatrixByObservableThenAxis,
    ),
    svd,
    weakestParameterCombination,
    claim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireVentricularCalciumSourceTraceFitRecalibrationArmInputV1,
  geometry: MainWireAorticValveObservationGeometryV1,
  calciumDriveParams:
    ReturnType<typeof resolveMainWireVentricularCalciumSourceTraceFitParamsV1>,
): MainWireVentricularCalciumSourceTraceFitRecalibrationArmV1 {
  const point =
    resolveMainWireVentricularCalciumSourceTraceFitRecalibrationPointV1(
      input.pointId,
    );
  return Object.freeze({
    point,
    ...measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
      input.periodicResult,
      calciumDriveParams,
      input.pointId,
      geometry,
    ),
  });
}

/** Shared pure readback for canonical controls, source baseline, and candidates. */
export function measureMainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1,
  armId: string,
  geometry: MainWireAorticValveObservationGeometryV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationReadbackV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(`${armId} has no retained complete beat`);
  }
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    calciumDriveParams,
    armId,
  );
  const observationStations =
    measureMainWireAorticValveObservationStationsV1(result, geometry);
  const mean = (values: readonly number[]): number =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  let endDiastolicSample = beat.samples[0]!;
  for (const sample of beat.samples.slice(1)) {
    if (sample.nodeVolumeMl.LV > endDiastolicSample.nodeVolumeMl.LV) {
      endDiastolicSample = sample;
    }
  }
  const fillingAndPressureReadback = Object.freeze({
    meanLeftAtrialAbsolutePressureMmHg: mean(beat.samples.map((sample) =>
      sample.nodeAbsolutePressureMmHg.LA)),
    meanLeftAtrialTransmuralPressureMmHg: mean(beat.samples.map((sample) =>
      sample.chamberTransmuralPressureMmHg.LA)),
    meanPulmonaryVeinAbsolutePressureMmHg: mean(beat.samples.map((sample) =>
      sample.nodeAbsolutePressureMmHg.PVein)),
    meanCentralVenousAbsolutePressureMmHg: mean(beat.samples.map((sample) =>
      sample.circulationNodeAbsolutePressureMmHg.VC)),
    meanPulmonaryArteryAbsolutePressureMmHg: mean(beat.samples.map((sample) =>
      sample.nodeAbsolutePressureMmHg.PA)),
    leftVentricularEndDiastolicVolumeMl: endDiastolicSample.nodeVolumeMl.LV,
    leftVentricularEndDiastolicAbsolutePressureMmHg:
      endDiastolicSample.nodeAbsolutePressureMmHg.LV,
    leftVentricularEndDiastolicTransmuralPressureMmHg:
      endDiastolicSample.chamberTransmuralPressureMmHg.LV,
    leftVentricularEndDiastolicSamplePhase01:
      endDiastolicSample.cyclePhase01,
    fixedTotalBloodVolumeMl:
      result.protocolIdentity.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl,
  });
  const svdObservableValues = Object.freeze({
    "aortic-forward-volume": cycle.aorticForwardVolumeMl,
    "mean-aortic-pressure": cycle.meanAorticAbsolutePressureMmHg,
    "left-ventricular-ejection-fraction":
      cycle.leftVentricularEjectionFraction01,
    "aortic-ejection-time": cycle.aorticEjectionTimeProxySec,
    "aortic-maximum-flow": cycle.aorticMaximumFlowMlPerSec,
    "peak-left-ventricular-pressure": cycle.peakLeftVentricularPressureMmHg,
    "left-ventricular-end-diastolic-volume":
      fillingAndPressureReadback.leftVentricularEndDiastolicVolumeMl,
    "mean-left-atrial-absolute-pressure":
      fillingAndPressureReadback.meanLeftAtrialAbsolutePressureMmHg,
    "mean-pulmonary-vein-absolute-pressure":
      fillingAndPressureReadback.meanPulmonaryVeinAbsolutePressureMmHg,
    "mean-central-venous-absolute-pressure":
      fillingAndPressureReadback.meanCentralVenousAbsolutePressureMmHg,
  } satisfies MainWireVentricularCalciumSourceTraceFitRecalibrationObservableRecordV1);
  for (const [observableId, value] of Object.entries(svdObservableValues)) {
    if (!Number.isFinite(value)) {
      throw new Error(`${armId} ${observableId} is not finite`);
    }
  }
  return Object.freeze({
    protocolIdentityHash: result.protocolIdentityHash,
    calciumDriveFixedParamsStableHash:
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    cycle,
    observationStations,
    fillingAndPressureReadback,
    svdObservableValues,
  });
}

function measureAxisSensitivity(
  axisId: MainWireVentricularCalciumSourceTraceFitRecalibrationAxisIdV1,
  arms: readonly MainWireVentricularCalciumSourceTraceFitRecalibrationArmV1[],
  baseline: MainWireVentricularCalciumSourceTraceFitRecalibrationArmV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationAxisSensitivityV1 {
  const low = arms.find((arm) =>
    arm.point.axis === axisId && arm.point.level === "low");
  const high = arms.find((arm) =>
    arm.point.axis === axisId && arm.point.level === "high");
  if (low === undefined || high === undefined) {
    throw new Error(`${axisId} requires low and high arms`);
  }
  const naturalLogScaleSpan = Math.log(high.point.axisScaleFromBaseline)
    - Math.log(low.point.axisScaleFromBaseline);
  if (!(naturalLogScaleSpan > 0) || !Number.isFinite(naturalLogScaleSpan)) {
    throw new Error(`${axisId} has an invalid log scale span`);
  }
  const sensitivity = {} as Record<
    MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1,
    number
  >;
  const midpointDefect = {} as Record<
    MainWireVentricularCalciumSourceTraceFitRecalibrationObservableIdV1,
    number
  >;
  for (const observableId of
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_OBSERVABLE_IDS_V1) {
    const base = baseline.svdObservableValues[observableId];
    const scale = Math.abs(base);
    if (!(scale > 1e-12) || !Number.isFinite(scale)) {
      throw new Error(`${observableId} baseline is too small for normalization`);
    }
    sensitivity[observableId] = (
      high.svdObservableValues[observableId]
      - low.svdObservableValues[observableId]
    ) / (base * naturalLogScaleSpan);
    midpointDefect[observableId] = (
      0.5 * (
        high.svdObservableValues[observableId]
        + low.svdObservableValues[observableId]
      ) - base
    ) / scale;
  }
  return Object.freeze({
    axisId,
    lowPointId: low.point.pointId,
    highPointId: high.point.pointId,
    lowScaleFromBaseline: low.point.axisScaleFromBaseline,
    highScaleFromBaseline: high.point.axisScaleFromBaseline,
    naturalLogScaleSpan,
    baselineRelativeSensitivity: Object.freeze(sensitivity),
    baselineRelativeMidpointDefect: Object.freeze(midpointDefect),
  });
}

function requiredArm(
  arms: readonly MainWireVentricularCalciumSourceTraceFitRecalibrationArmV1[],
  pointId: MainWireVentricularCalciumSourceTraceFitRecalibrationPointIdV1,
): MainWireVentricularCalciumSourceTraceFitRecalibrationArmV1 {
  const arm = arms.find((candidate) => candidate.point.pointId === pointId);
  if (arm === undefined) throw new Error(`missing recalibration arm: ${pointId}`);
  return arm;
}

/** Small dependency-free SVD through a symmetric Jacobi eigensolve of A^T A. */
export function analyzeDimensionlessSensitivityMatrixSvdV1(
  matrix: readonly (readonly number[])[],
): MainWireRectangularSvdV1 {
  const rowCount = matrix.length;
  const columnCount = matrix[0]?.length ?? 0;
  if (rowCount === 0 || columnCount === 0 || rowCount < columnCount) {
    throw new Error("sensitivity SVD requires a nonempty matrix with rows >= columns");
  }
  if (matrix.some((row) => row.length !== columnCount)) {
    throw new Error("sensitivity SVD matrix must be rectangular");
  }
  if (!matrix.every((row) => row.every(Number.isFinite))) {
    throw new Error("sensitivity SVD matrix must be finite");
  }
  const gram = Array.from({ length: columnCount }, (_, i) =>
    Array.from({ length: columnCount }, (_, j) =>
      matrix.reduce((sum, row) => sum + row[i]! * row[j]!, 0)));
  const eigen = symmetricJacobiEigen(gram);
  const modes = eigen.values.map((value, index) => ({
    singularValue: Math.sqrt(Math.max(0, value)),
    right: eigen.vectorsByMode[index]!,
  })).sort((a, b) => b.singularValue - a.singularValue);
  for (const mode of modes) orientVectorDeterministically(mode.right);
  const singularValues = Object.freeze(modes.map((mode) => mode.singularValue));
  const maximumSingularValue = singularValues[0]!;
  const numericalRankTolerance = Math.max(rowCount, columnCount)
    * Number.EPSILON * maximumSingularValue;
  const numericalRank = singularValues.filter((value) =>
    value > numericalRankTolerance).length;
  const rightSingularVectorsByMode = Object.freeze(modes.map((mode) =>
    Object.freeze([...mode.right])));
  const leftSingularVectorsByMode = Object.freeze(modes.map((mode) => {
    if (!(mode.singularValue > numericalRankTolerance)) {
      return Object.freeze(Array.from({ length: rowCount }, () => 0));
    }
    return Object.freeze(matrix.map((row) =>
      dot(row, mode.right) / mode.singularValue));
  }));
  const relativeSingularValues = Object.freeze(singularValues.map((value) =>
    maximumSingularValue === 0 ? 0 : value / maximumSingularValue));
  const reconstructed = Array.from({ length: rowCount }, (_, i) =>
    Array.from({ length: columnCount }, (_, j) => modes.reduce(
      (sum, mode, modeIndex) => sum
        + leftSingularVectorsByMode[modeIndex]![i]!
          * mode.singularValue * mode.right[j]!,
      0,
    )));
  const maximumAbsoluteReconstructionResidual = maximumAbsolute(
    matrix.flatMap((row, i) => row.map((value, j) =>
      value - reconstructed[i]![j]!)),
  );
  const nonzeroLeft = leftSingularVectorsByMode.slice(0, numericalRank);
  const smallestNumerical = numericalRank === 0
    ? null
    : singularValues[numericalRank - 1]!;
  return Object.freeze({
    rowCount,
    columnCount,
    singularValues,
    relativeSingularValues,
    rightSingularVectorsByMode,
    leftSingularVectorsByMode,
    numericalRank,
    numericalRankTolerance,
    effectiveRankAtRelativeThreshold: Object.freeze({
      p01: relativeSingularValues.filter((value) => value >= 0.01).length,
      p05: relativeSingularValues.filter((value) => value >= 0.05).length,
      p10: relativeSingularValues.filter((value) => value >= 0.1).length,
    }),
    conditionNumberAtNumericalRank:
      smallestNumerical === null || smallestNumerical === 0
        ? null
        : maximumSingularValue / smallestNumerical,
    weakestRightSingularVector:
      rightSingularVectorsByMode[columnCount - 1]!,
    maximumRightOrthogonalityResidual:
      orthogonalityResidual(rightSingularVectorsByMode),
    maximumLeftOrthogonalityResidualForNonzeroModes:
      nonzeroLeft.length === 0 ? 0 : orthogonalityResidual(nonzeroLeft),
    maximumAbsoluteReconstructionResidual,
    jacobiConverged: eigen.converged,
    jacobiIterationCount: eigen.iterationCount,
  });
}

function symmetricJacobiEigen(matrix: readonly (readonly number[])[]): Readonly<{
  values: readonly number[];
  vectorsByMode: number[][];
  converged: boolean;
  iterationCount: number;
}> {
  const n = matrix.length;
  if (matrix.some((row) => row.length !== n)) {
    throw new Error("Jacobi eigen input must be square");
  }
  const a = matrix.map((row) => [...row]);
  const vectors = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => Number(i === j)));
  const frobenius = Math.sqrt(a.reduce((sum, row) =>
    sum + row.reduce((rowSum, value) => rowSum + value * value, 0), 0));
  const tolerance = Math.max(1, frobenius) * Number.EPSILON * n * 16;
  const maximumIterations = Math.max(1, 100 * n * n);
  let converged = n === 1;
  let iterationCount = 0;
  for (; iterationCount < maximumIterations && !converged; iterationCount += 1) {
    let p = 0;
    let q = 1;
    let largest = Math.abs(a[p]![q]!);
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const candidate = Math.abs(a[i]![j]!);
        if (candidate > largest) {
          largest = candidate;
          p = i;
          q = j;
        }
      }
    }
    if (largest <= tolerance) {
      converged = true;
      break;
    }
    const app = a[p]![p]!;
    const aqq = a[q]![q]!;
    const apq = a[p]![q]!;
    const theta = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    for (let k = 0; k < n; k += 1) {
      if (k === p || k === q) continue;
      const akp = a[k]![p]!;
      const akq = a[k]![q]!;
      const rotatedP = c * akp - s * akq;
      const rotatedQ = s * akp + c * akq;
      a[k]![p] = rotatedP;
      a[p]![k] = rotatedP;
      a[k]![q] = rotatedQ;
      a[q]![k] = rotatedQ;
    }
    a[p]![p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    a[q]![q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    a[p]![q] = 0;
    a[q]![p] = 0;
    for (let k = 0; k < n; k += 1) {
      const vkp = vectors[k]![p]!;
      const vkq = vectors[k]![q]!;
      vectors[k]![p] = c * vkp - s * vkq;
      vectors[k]![q] = s * vkp + c * vkq;
    }
  }
  const vectorsByMode = Array.from({ length: n }, (_, mode) =>
    Array.from({ length: n }, (_, row) => vectors[row]![mode]!));
  return Object.freeze({
    values: Object.freeze(a.map((row, index) => row[index]!)),
    vectorsByMode,
    converged,
    iterationCount,
  });
}

function columnCosineSimilarity(
  matrix: readonly (readonly number[])[],
): readonly (readonly number[])[] {
  const columnCount = matrix[0]!.length;
  const columns = Array.from({ length: columnCount }, (_, column) =>
    matrix.map((row) => row[column]!));
  return Object.freeze(columns.map((left, i) => Object.freeze(columns.map(
    (right, j) => {
      if (i === j) return 1;
      const denominator = Math.sqrt(dot(left, left) * dot(right, right));
      return denominator === 0 ? 0 : dot(left, right) / denominator;
    },
  ))));
}

function orthogonalityResidual(
  vectorsByMode: readonly (readonly number[])[],
): number {
  return maximumAbsolute(vectorsByMode.flatMap((left, i) =>
    vectorsByMode.map((right, j) => dot(left, right) - Number(i === j))));
}

function orientVectorDeterministically(vector: number[]): void {
  let pivot = 0;
  for (let index = 1; index < vector.length; index += 1) {
    if (Math.abs(vector[index]!) > Math.abs(vector[pivot]!)) pivot = index;
  }
  if (vector[pivot]! < 0) {
    for (let index = 0; index < vector.length; index += 1) {
      vector[index] = -vector[index]!;
    }
  }
}

function dot(left: readonly number[], right: readonly number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index]!, 0);
}

function maximumAbsolute(values: readonly number[]): number {
  return values.reduce((maximum, value) =>
    Math.max(maximum, Math.abs(value)), 0);
}
