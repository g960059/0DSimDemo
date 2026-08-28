import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  measureMainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitShortlistLoadResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

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

const runs =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1
    .flatMap((contextId) =>
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1
        .map((armId) =>
          runMainWireNormalAdultFiveWallVentricularCalciumSourceTraceFitShortlistLoadResearchV1(
            options,
            armId,
            contextId,
          )));
const envelope =
  measureMainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1(
    runs.map((run) => Object.freeze({
      armId: run.arm.armId,
      contextId: run.context.contextId,
      periodicResult: run.periodicResult,
    })),
    GEOMETRY,
  );

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_ARM_IDS_V1,
    loadContextOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_CONTEXT_IDS_V1,
    geometry: GEOMETRY,
    experimentClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_SHORTLIST_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(runs.map((run) => Object.freeze({
    armId: run.arm.armId,
    contextId: run.context.contextId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
    providerIdentity: run.resolvedProviderIdentity,
    bloodVolumeIdentity: run.resolvedBloodVolumeIdentity,
  }))),
  resolvedRuns: Object.freeze(runs.map((run) => Object.freeze({
    arm: run.arm,
    context: run.context,
    circulatoryLoadPoint: run.circulatoryLoadPoint,
    stressedVenousVolumePoint: run.stressedVenousVolumePoint,
    runnerClaim: run.claim,
  }))),
  envelope,
  interpretationBoundary: Object.freeze({
    fixedLoadAxesUsedForCalibration: false as const,
    clinicalMitralDctEstablished: false as const,
    separatePulmonaryVeinVelocityMeasured: false as const,
    anatomicValveAreaMeasured: false as const,
    formalPressureVolumeAreaEstablished: false as const,
    clinicalValidationEstablished: false as const,
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
    interpretationEligible: envelope.interpretationEligible,
    allRunsPeriod1AndIntegrated: envelope.allRunsPeriod1AndIntegrated,
    allProtocolIdentitiesDistinct: envelope.allProtocolIdentitiesDistinct,
    allDiastolicFlowReadbacksAvailable:
      envelope.allDiastolicFlowReadbacksAvailable,
    rankAtBaselineByEqualWeightThreeObjectiveDistance:
      envelope.rankAtBaselineByEqualWeightThreeObjectiveDistance,
    candidateSummaries: envelope.candidateSummaries,
    baselineArms: envelope.arms
      .filter((arm) => arm.context.contextId === "baseline")
      .map(compactArm),
    loadArms: envelope.arms.map(compactArm),
  })}\n`);
}

function compactArm(arm: typeof envelope.arms[number]) {
  return Object.freeze({
    contextId: arm.context.contextId,
    armId: arm.arm.armId,
    periodicSteadyStateClaimed: arm.periodicSteadyStateClaimed,
    aorticForwardVolumeMl: arm.readback.cycle.aorticForwardVolumeMl,
    meanAorticPressureMmHg: arm.readback.cycle.meanAorticAbsolutePressureMmHg,
    leftVentricularEjectionFraction01:
      arm.readback.cycle.leftVentricularEjectionFraction01,
    aorticEjectionTimeMs:
      arm.readback.cycle.aorticEjectionTimeProxySec * 1_000,
    aorticMaximumFlowMlPerSec:
      arm.readback.cycle.aorticMaximumFlowMlPerSec,
    meanLeftAtrialPressureMmHg:
      arm.readback.fillingAndPressureReadback.meanLeftAtrialAbsolutePressureMmHg,
    meanPulmonaryVeinPressureMmHg:
      arm.readback.fillingAndPressureReadback.meanPulmonaryVeinAbsolutePressureMmHg,
    leftVentricularEndDiastolicPressureMmHg:
      arm.readback.fillingAndPressureReadback
        .leftVentricularEndDiastolicAbsolutePressureMmHg,
    gradients: arm.readback.observationStations,
    objectives: arm.objectiveEvaluation?.objectives ?? null,
    diastolicFlow: arm.diastolicFlow,
    valveArea: arm.valveArea,
    cycleWork: arm.cycleWork,
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
