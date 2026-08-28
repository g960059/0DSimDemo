import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticValveLocalInertancePressureRecoveryFactorialV1,
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_ANALYSIS_CLAIM_V1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLocalInertancePressureRecoveryFactorialV1";
import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_CLAIM_V1,
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_V1_ID,
} from "@/engine/myocardium/experiments/MainWireAorticValveLocalInertancePressureRecoveryFactorialV1";
import {
  runMainWireNormalAdultFiveWallAorticValveLocalInertancePressureRecoveryArmV1,
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
const runs =
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1.map(
    (armId) =>
      runMainWireNormalAdultFiveWallAorticValveLocalInertancePressureRecoveryArmV1(
        { dtSec, maximumBeatCount },
        armId,
      ),
  );
const comparison =
  compareMainWireAorticValveLocalInertancePressureRecoveryFactorialV1(
    runs.map((run) => Object.freeze({
      armId: run.arm.armId,
      periodicResult: run.periodicResult,
    })),
    GEOMETRY,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    geometry: GEOMETRY,
    armOrder:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1,
    experimentClaim:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_FACTORIAL_ANALYSIS_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(runs.map((run) => Object.freeze({
    armId: run.arm.armId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
  }))),
  resolvedRuns: Object.freeze(runs.map((run) => Object.freeze({
    arm: run.arm,
    localInertanceProfile: run.localInertanceProfile,
    pressureRecoveryProfile: run.pressureRecoveryProfile,
    externalFlowStateAudit: run.externalFlowStateAudit,
    runnerClaim: run.claim,
  }))),
  comparison,
  interpretationBoundary: Object.freeze({
    physiologicalAcceptanceEstablished: false as const,
    clinicalValidationEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    sourceOrSystemicRecalibrationPerformed: false as const,
    nextStepControlledByComparisonDecision: comparison.nextStepDecision,
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
    numericalGate: comparison.numericalGate,
    waveformGate: comparison.waveformGate,
    mechanismGate: comparison.mechanismGate,
    nextStepDecision: comparison.nextStepDecision,
    arms: comparison.arms.map((arm) => ({
      armId: arm.arm.armId,
      terminationReason: arm.ablation.terminationReason,
      periodicSteadyStateClaimed: arm.ablation.periodicSteadyStateClaimed,
      ejectionTimeMs: arm.flowTiming.ejectionTimeProxySec * 1_000,
      peakFlowMlPerSec: arm.ablation.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg:
        arm.observationStations.timeMeanGradientMmHg.simplifiedDoppler,
      peakDopplerGradientMmHg:
        arm.observationStations.peakGradientMmHg.simplifiedDoppler,
      negativeGradientForwardVolumeMl:
        arm.momentumEnergy.positiveFlowNegativeNodeGradientVolumeMl,
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
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
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
