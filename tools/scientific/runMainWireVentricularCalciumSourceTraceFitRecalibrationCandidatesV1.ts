import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitRecalibrationCandidateComparisonV1";
import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationCandidateResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_EXPERIMENT_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-recalibration-candidate-experiment-v1" as const;

const GEOMETRY = Object.freeze({
  geometryId: "fixed-lvot-d2p3cm-aa-d3p0cm-v1",
  provenance: "fixed-research-bracket" as const,
  lvotCrossSectionalAreaCm2: Math.PI * (2.3 / 2) ** 2,
  ascendingAorticCrossSectionalAreaCm2: Math.PI * (3 / 2) ** 2,
}) satisfies MainWireAorticValveObservationGeometryV1;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const options = Object.freeze({ dtSec, maximumBeatCount });

const canonical =
  runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1(
    options,
    "canonical",
  );
const sourceBaseline =
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1(
    options,
  );
const candidateRuns =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1
    .map((candidateId) =>
      runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitRecalibrationCandidateResearchV1(
        options,
        candidateId,
      ));
const comparison =
  compareMainWireVentricularCalciumSourceTraceFitRecalibrationCandidatesV1(
    canonical.periodicResult,
    sourceBaseline.periodicResult,
    candidateRuns.map((run) => ({
      candidateId: run.candidate.candidateId,
      periodicResult: run.periodicResult,
    })),
    GEOMETRY,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_RECALIBRATION_CANDIDATE_IDS_V1,
    independentCanonicalColdStartPerArm: true as const,
    fixedObservationGeometry: GEOMETRY,
    numericTargetOptimizationApplied: false as const,
  }),
  comparison,
  interpretationBoundary: Object.freeze({
    canonicalControlIsClinicalGroundTruth: false as const,
    canonicalControlIsPriorMacroPhenotypeReference: true as const,
    equalObservableWeightingIsClinicalWeighting: false as const,
    sourceMeasurementCovarianceAvailable: false as const,
    hemodynamicMeasurementCovarianceAvailable: false as const,
    clinicalTargetsApplied: false as const,
    candidateSelectionEstablished: false as const,
    patientFitOrCanonicalAdoptionEstablished: false as const,
  }),
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  const compact = (
    id: string,
    readback: typeof comparison.sourceBaseline,
  ) => ({
    id,
    periodic: readback.periodicSteadyStateClaimed,
    cycle: {
      aorticForwardVolumeMl: readback.cycle.aorticForwardVolumeMl,
      meanAorticPressureMmHg: readback.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction:
        readback.cycle.leftVentricularEjectionFraction01,
      aorticEjectionTimeMs: readback.cycle.aorticEjectionTimeProxySec * 1000,
      aorticMaximumFlowMlPerSec: readback.cycle.aorticMaximumFlowMlPerSec,
      peakLeftVentricularPressureMmHg:
        readback.cycle.peakLeftVentricularPressureMmHg,
    },
    fillingAndPressureReadback: readback.fillingAndPressureReadback,
    timeMeanGradientMmHg: readback.observationStations.timeMeanGradientMmHg,
    peakGradientMmHg: readback.observationStations.peakGradientMmHg,
  });
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    interpretationEligible: comparison.interpretationEligible,
    sourceBaselineDistance: comparison.sourceBaselineDistance,
    rankByMacroRestorationDistance:
      comparison.rankByMacroRestorationDistance,
    rankByGuardrailDistance: comparison.rankByGuardrailDistance,
    arms: [
      compact("canonical-control", comparison.canonicalControl),
      compact("source-baseline", comparison.sourceBaseline),
      ...comparison.candidates.map((candidate) => ({
        ...compact(candidate.candidate.candidateId, candidate.readback),
        observableCountCloserToCanonicalThanSourceBaseline:
          candidate.observableCountCloserToCanonicalThanSourceBaseline,
        macroRestorationRmsRelativeDistanceToCanonical:
          candidate.macroRestorationRmsRelativeDistanceToCanonical,
        guardrailRmsRelativeDistanceToCanonical:
          candidate.guardrailRmsRelativeDistanceToCanonical,
        allObservableRmsRelativeDistanceToCanonical:
          candidate.allObservableRmsRelativeDistanceToCanonical,
      })),
    ],
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
