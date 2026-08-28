import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1";
import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PRIOR_CLAIM_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceTraceFitPriorV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitRecalibrationPointsV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_EXPERIMENT_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-recalibration-sensitivity-experiment-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_DEFAULT_MAXIMUM_BEAT_COUNT_V1 =
  48 as const;

const GEOMETRY = Object.freeze({
  geometryId: "fixed-lvot-d2p3cm-aa-d3p0cm-v1",
  provenance: "fixed-research-bracket" as const,
  lvotCrossSectionalAreaCm2: Math.PI * (2.3 / 2) ** 2,
  ascendingAorticCrossSectionalAreaCm2: Math.PI * (3 / 2) ** 2,
}) satisfies MainWireAorticValveObservationGeometryV1;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_DEFAULT_MAXIMUM_BEAT_COUNT_V1,
);
const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1
    .map((pointId) =>
      runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationResearchV1(
        { dtSec, maximumBeatCount },
        pointId,
      ));
const sensitivity =
  measureMainWireVentricularCalciumSourceTraceFitRecalibrationSensitivityV1(
    runs.map((run) => ({
      pointId: run.point.pointId,
      periodicResult: run.periodicResult,
    })),
    GEOMETRY,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_SENSITIVITY_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    pointOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_POINT_IDS_V1,
    independentCanonicalColdStartPerPoint: true as const,
    fixedObservationGeometry: GEOMETRY,
    sourceCalciumPriorClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PRIOR_CLAIM_V1,
  }),
  sensitivity,
  interpretationBoundary: Object.freeze({
    localOneFactorSensitivityOnly: true as const,
    sourceCalciumProfileRefittedWithinGrid: false as const,
    aorticValveAreaOrLawChanged: false as const,
    vascularUnstressedVolumesChanged: false as const,
    measurementCovarianceAvailable: false as const,
    equalObservableWeightingIsClinicalWeighting: false as const,
    svdEstablishesParameterIdentifiability: false as const,
    clinicalTargetsApplied: false as const,
    candidateParameterAdjustmentApplied: false as const,
    parameterOptimizationOrPatientFitApplied: false as const,
    canonicalAdoptionEstablished: false as const,
  }),
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  const baseline = sensitivity.arms.find((arm) =>
    arm.point.pointId === "baseline")!;
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    interpretationEligible: sensitivity.interpretationEligible,
    baseline: {
      cycle: {
        aorticForwardVolumeMl: baseline.cycle.aorticForwardVolumeMl,
        aorticMaximumFlowMlPerSec: baseline.cycle.aorticMaximumFlowMlPerSec,
        aorticEjectionTimeMs:
          baseline.cycle.aorticEjectionTimeProxySec * 1000,
        meanAorticPressureMmHg:
          baseline.cycle.meanAorticAbsolutePressureMmHg,
        leftVentricularEjectionFraction:
          baseline.cycle.leftVentricularEjectionFraction01,
      },
      fillingAndPressureReadback: baseline.fillingAndPressureReadback,
      timeMeanGradientMmHg:
        baseline.observationStations.timeMeanGradientMmHg,
      peakGradientMmHg: baseline.observationStations.peakGradientMmHg,
    },
    svd: {
      singularValues: sensitivity.svd.singularValues,
      relativeSingularValues: sensitivity.svd.relativeSingularValues,
      numericalRank: sensitivity.svd.numericalRank,
      effectiveRankAtRelativeThreshold:
        sensitivity.svd.effectiveRankAtRelativeThreshold,
      conditionNumberAtNumericalRank:
        sensitivity.svd.conditionNumberAtNumericalRank,
      reconstructionResidual:
        sensitivity.svd.maximumAbsoluteReconstructionResidual,
    },
    weakestParameterCombination: sensitivity.weakestParameterCombination,
    maximumAbsoluteMidpointDefectByAxis:
      Object.fromEntries(sensitivity.axisSensitivities.map((axis) => [
        axis.axisId,
        Math.max(...Object.values(axis.baselineRelativeMidpointDefect)
          .map(Math.abs)),
      ])),
    parameterColumnCosineSimilarity:
      sensitivity.parameterColumnCosineSimilarity,
  })}\n`);
}

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(`${name}=`));
  if (equalsArgument !== undefined) {
    const value = equalsArgument.slice(name.length + 1);
    if (value === "") throw new Error(`${name} requires a value`);
    return value;
  }
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function numericArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!(parsed > 0) || !Number.isFinite(parsed)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}
