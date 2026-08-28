import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  analyzeMainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitTrefPassiveGridV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PARETO_EXPERIMENT_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-tref-passive-pareto-experiment-v1" as const;

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
const gridRuns =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1
    .map((profileId) =>
      runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitTrefPassiveResearchV1(
        options,
        profileId,
      ));
const pareto =
  analyzeMainWireVentricularCalciumSourceTraceFitTrefPassiveParetoV1(
    canonical.periodicResult,
    gridRuns.map((run) => ({
      profileId: run.profile.profileId,
      periodicResult: run.periodicResult,
    })),
    GEOMETRY,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PARETO_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profileOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1,
    independentCanonicalColdStartPerArm: true as const,
    fixedObservationGeometry: GEOMETRY,
    circulationRuntimeChangedAcrossGrid: false as const,
    fixedTotalBloodVolumeChangedAcrossGrid: false as const,
    aorticValveAreaOrLawChangedAcrossGrid: false as const,
    numericTargetOptimizationApplied: false as const,
  }),
  pareto,
  interpretationBoundary: Object.freeze({
    canonicalControlIsClinicalGroundTruth: false as const,
    canonicalControlIsPriorMacroPhenotypeReference: true as const,
    equalObjectiveWeightingIsClinicalWeighting: false as const,
    sourceMeasurementCovarianceAvailable: false as const,
    hemodynamicMeasurementCovarianceAvailable: false as const,
    gradientsParticipateInParetoObjectives: false as const,
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
  const compactReadback = (
    readback: typeof pareto.canonicalControl,
  ) => ({
    periodic: readback.periodicSteadyStateClaimed,
    aorticForwardVolumeMl: readback.cycle.aorticForwardVolumeMl,
    meanAorticPressureMmHg: readback.cycle.meanAorticAbsolutePressureMmHg,
    leftVentricularEjectionFraction:
      readback.cycle.leftVentricularEjectionFraction01,
    aorticEjectionTimeMs:
      readback.cycle.aorticEjectionTimeProxySec * 1000,
    aorticMaximumFlowMlPerSec:
      readback.cycle.aorticMaximumFlowMlPerSec,
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
  });
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    interpretationEligible: pareto.interpretationEligible,
    paretoProfileIds: pareto.paretoProfileIds,
    rankByMacroRestorationDistance:
      pareto.rankByMacroRestorationDistance,
    rankByFillingPressureDistance:
      pareto.rankByFillingPressureDistance,
    rankByOutflowShapeDistance:
      pareto.rankByOutflowShapeDistance,
    rankByEqualWeightThreeObjectiveDistance:
      pareto.rankByEqualWeightThreeObjectiveDistance,
    canonical: {
      ...compactReadback(pareto.canonicalControl),
      ejectionConcentrationIndex:
        pareto.canonicalEjectionConcentrationIndex,
    },
    arms: pareto.arms.map((arm) => ({
      profileId: arm.profile.profileId,
      ventricularLandTrefScaleFromBaseline:
        arm.profile.ventricularLandTrefScaleFromBaseline,
      ventricularPassiveScaleFromBaseline:
        arm.profile.ventricularEquilibriumPassiveScaleFromBaseline,
      ...compactReadback(arm.readback),
      ejectionConcentrationIndex: arm.ejectionConcentrationIndex,
      ejectionConcentrationIndexRelativeDifferenceFromCanonical:
        arm.ejectionConcentrationIndexRelativeDifferenceFromCanonical,
      objectives: arm.objectives,
      paretoOptimal: arm.paretoOptimal,
      paretoDominatedByProfileIds: arm.paretoDominatedByProfileIds,
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
