import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  compareMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionComparisonV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1,
  resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveDistortionResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_EXPERIMENT_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-tref-passive-distortion-experiment-v1" as const;

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
const pairs =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1
    .map((candidateId) => {
      const candidate =
        resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidateV1(
          candidateId,
        );
      const pairedBaseline =
        runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchV1(
          options,
          candidate.pairedBaselineProfileId,
        );
      const distortion =
        runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveDistortionResearchV1(
          options,
          candidateId,
        );
      return Object.freeze({ candidate, pairedBaseline, distortion });
    });
const comparison =
  compareMainWireVentricularCalciumSourceTraceFitTrefPassiveDistortionCandidatesV1(
    canonical.periodicResult,
    pairs.map((pair) => ({
      candidateId: pair.candidate.candidateId,
      pairedBaselineResult: pair.pairedBaseline.periodicResult,
      distortionResult: pair.distortion.periodicResult,
    })),
    GEOMETRY,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_DISTORTION_CANDIDATE_IDS_V1,
    independentCanonicalColdStartPerRun: true as const,
    fixedObservationGeometry: GEOMETRY,
    pairedDifferenceChangesOnlyExistingLandDistortionTransient: true as const,
    circulationRuntimeChangedWithinPair: false as const,
    fixedTotalBloodVolumeChangedWithinPair: false as const,
    aorticValveAreaOrLawChangedWithinPair: false as const,
    numericTargetOptimizationApplied: false as const,
  }),
  comparison,
  interpretationBoundary: Object.freeze({
    canonicalControlIsClinicalGroundTruth: false as const,
    canonicalControlIsPriorMacroPhenotypeReference: true as const,
    equalObjectiveWeightingIsClinicalWeighting: false as const,
    sourceMeasurementCovarianceAvailable: false as const,
    hemodynamicMeasurementCovarianceAvailable: false as const,
    gradientsParticipateInObjectives: false as const,
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
    readback: typeof comparison.canonicalControl,
    evaluation:
      typeof comparison.arms[number]["distortionEvaluation"] | null,
  ) => ({
    periodic: readback.periodicSteadyStateClaimed,
    aorticForwardVolumeMl: readback.cycle.aorticForwardVolumeMl,
    meanAorticPressureMmHg: readback.cycle.meanAorticAbsolutePressureMmHg,
    leftVentricularEjectionFraction:
      readback.cycle.leftVentricularEjectionFraction01,
    aorticEjectionTimeMs: readback.cycle.aorticEjectionTimeProxySec * 1000,
    aorticMaximumFlowMlPerSec: readback.cycle.aorticMaximumFlowMlPerSec,
    peakLeftVentricularPressureMmHg:
      readback.cycle.peakLeftVentricularPressureMmHg,
    meanLeftAtrialPressureMmHg:
      readback.fillingAndPressureReadback.meanLeftAtrialAbsolutePressureMmHg,
    meanPulmonaryVeinPressureMmHg:
      readback.fillingAndPressureReadback.meanPulmonaryVeinAbsolutePressureMmHg,
    meanCentralVenousPressureMmHg:
      readback.fillingAndPressureReadback.meanCentralVenousAbsolutePressureMmHg,
    leftVentricularEndDiastolicPressureMmHg:
      readback.fillingAndPressureReadback
        .leftVentricularEndDiastolicAbsolutePressureMmHg,
    timeMeanGradientMmHg: readback.observationStations.timeMeanGradientMmHg,
    peakGradientMmHg: readback.observationStations.peakGradientMmHg,
    ...(evaluation === null
      ? {}
      : {
        ejectionConcentrationIndex: evaluation.ejectionConcentrationIndex,
        objectives: evaluation.objectives,
      }),
  });
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    interpretationEligible: comparison.interpretationEligible,
    candidatesDominatingPairedBaseline:
      comparison.candidatesDominatingPairedBaseline,
    rankByDistortionEqualWeightThreeObjectiveDistance:
      comparison.rankByDistortionEqualWeightThreeObjectiveDistance,
    canonical: compact(comparison.canonicalControl, null),
    pairs: comparison.arms.map((arm) => ({
      candidateId: arm.candidate.candidateId,
      pairedBaselineProfileId: arm.candidate.pairedBaselineProfileId,
      pairedBaseline: compact(
        arm.pairedBaselineReadback,
        arm.pairedBaselineEvaluation,
      ),
      distortion: compact(
        arm.distortionReadback,
        arm.distortionEvaluation,
      ),
      pairedRelativeDifference:
        arm.distortionRelativeDifferenceFromPairedBaseline,
      pairedLvedpRelativeDifference:
        arm.distortionLeftVentricularEndDiastolicPressureRelativeDifferenceFromPairedBaseline,
      pairedEjectionConcentrationIndexRelativeDifference:
        arm.distortionEjectionConcentrationIndexRelativeDifferenceFromPairedBaseline,
      objectiveFractionalDeltaFromPairedBaseline:
        arm.objectiveFractionalDeltaFromPairedBaseline,
      dominatesPairedBaselineAcrossThreeObjectives:
        arm.dominatesPairedBaselineAcrossThreeObjectives,
    })),
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
