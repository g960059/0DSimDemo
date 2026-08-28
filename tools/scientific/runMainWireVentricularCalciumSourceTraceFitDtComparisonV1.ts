import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireVentricularCalciumSourceTraceFitDtV1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_VALUES_SEC_V1,
  type MainWireVentricularCalciumSourceTraceFitComparisonProfileIdV1,
  type MainWireVentricularCalciumSourceTraceFitDtArmInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitDtComparisonV1";
import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  resolveMainWireVentricularCalciumSourceConstrainedParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceConstrainedPriorV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_EXPERIMENT_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-dt-experiment-v1" as const;

const GEOMETRY = Object.freeze({
  geometryId: "fixed-lvot-d2p3cm-aa-d3p0cm-v1",
  provenance: "fixed-research-bracket" as const,
  lvotCrossSectionalAreaCm2: Math.PI * (2.3 / 2) ** 2,
  ascendingAorticCrossSectionalAreaCm2: Math.PI * (3 / 2) ** 2,
}) satisfies MainWireAorticValveObservationGeometryV1;

const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const inputs: MainWireVentricularCalciumSourceTraceFitDtArmInputV1[] = [];
for (const dtSec of
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_VALUES_SEC_V1) {
  inputs.push(runSourceConstrainedArm(
    "canonical-analytic",
    "canonical",
    dtSec,
  ));
  inputs.push(runSourceConstrainedArm(
    "source-extrema-scalar-matched",
    "land2017-figure6-source-constrained-biexponential",
    dtSec,
  ));
  const wholeTrace =
    runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitResearchV1({
      dtSec,
      maximumBeatCount,
    });
  inputs.push(Object.freeze({
    profileId: "source-whole-trace-alpha-fit" as const,
    dtSec,
    periodicResult: wholeTrace.periodicResult,
    calciumDriveParams: wholeTrace.calciumDriveParams,
    sourceTraceOnsetOffsetSec:
      wholeTrace.profile.sourceTraceOnsetOffsetSec,
  }));
}

const comparison = compareMainWireVentricularCalciumSourceTraceFitDtV1(
  inputs,
  GEOMETRY,
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtValuesSec:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_DT_VALUES_SEC_V1,
    maximumBeatCount,
    independentCanonicalColdStartPerArm: true as const,
    fixedObservationGeometry: GEOMETRY,
    onlyVentricularCalciumParamsDifferAcrossProfiles: true as const,
    exactFrameMutation: false as const,
  }),
  comparison,
  interpretationBoundary: Object.freeze({
    figureDigitizationIsConstructionEvidenceOnly: true as const,
    originalNumericSourceTraceAvailable: false as const,
    sourceMeasurementCovarianceAvailable: false as const,
    observationGeometryIsSubjectSpecific: false as const,
    observationGeometryIsFitted: false as const,
    pressureRecoveryFeedsBackIntoExactModel: false as const,
    hemodynamicOutcomeUsedToDeriveCalciumProfile: false as const,
    clinicalNormalityPassFailApplied: false as const,
    systemicRecalibrationApplied: false as const,
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
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    convergence: comparison.convergence.map((entry) => ({
      profileId: entry.profileId,
      allRunsPeriod1AndIntegrated: entry.allRunsPeriod1AndIntegrated,
      gate: entry.gate,
      relativeFineMinusCoarse: entry.relativeFineMinusCoarse,
      absoluteEventTimeFineMinusCoarseSec:
        entry.absoluteEventTimeFineMinusCoarseSec,
    })),
    fineDtArms: comparison.arms
      .filter((arm) => arm.dtSec === 0.0005)
      .map((arm) => ({
        profileId: arm.profileId,
        sourceNrmse:
          arm.sourceApproximation.normalizedRootMeanSquareErrorBySourceAmplitude,
        aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
        aorticMaximumFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
        aorticEjectionTimeMs:
          arm.cycle.aorticEjectionTimeProxySec * 1000,
        meanAorticPressureMmHg:
          arm.cycle.meanAorticAbsolutePressureMmHg,
        leftVentricularEjectionFraction:
          arm.cycle.leftVentricularEjectionFraction01,
        gradientMmHg: arm.observationStations.timeMeanGradientMmHg,
        peakGradientMmHg: arm.observationStations.peakGradientMmHg,
      })),
  })}\n`);
}

function runSourceConstrainedArm(
  comparisonProfileId:
    MainWireVentricularCalciumSourceTraceFitComparisonProfileIdV1,
  sourceProfileId:
    "canonical" | "land2017-figure6-source-constrained-biexponential",
  dtSec: number,
): MainWireVentricularCalciumSourceTraceFitDtArmInputV1 {
  const run =
    runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1(
      { dtSec, maximumBeatCount },
      sourceProfileId,
    );
  return Object.freeze({
    profileId: comparisonProfileId,
    dtSec,
    periodicResult: run.periodicResult,
    calciumDriveParams:
      resolveMainWireVentricularCalciumSourceConstrainedParamsV1(
        sourceProfileId,
      ),
    sourceTraceOnsetOffsetSec: 0,
  });
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
