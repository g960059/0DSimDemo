import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticValveLocalInertancePressureRecoveryDtV1,
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_CLAIM_V1,
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_V1_ID,
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_VALUES_SEC_V1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLocalInertancePressureRecoveryDtComparisonV1";
import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_CLAIM_V1,
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

const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const runs =
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_VALUES_SEC_V1
    .flatMap((dtSec) =>
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1.map(
        (armId) => Object.freeze({
          dtSec,
          run:
            runMainWireNormalAdultFiveWallAorticValveLocalInertancePressureRecoveryArmV1(
              { dtSec, maximumBeatCount },
              armId,
            ),
        }),
      ));
const comparison =
  compareMainWireAorticValveLocalInertancePressureRecoveryDtV1(
    runs.map(({ dtSec, run }) => Object.freeze({
      dtSec,
      armId: run.arm.armId,
      periodicResult: run.periodicResult,
    })),
    GEOMETRY,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_V1_ID,
  design: Object.freeze({
    dtValuesSec:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_VALUES_SEC_V1,
    maximumBeatCount,
    geometry: GEOMETRY,
    armOrder:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_ARM_IDS_V1,
    experimentClaim:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_CLAIM_V1,
    dtAnalysisClaim:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PRESSURE_RECOVERY_DT_COMPARISON_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(runs.map(({ dtSec, run }) => Object.freeze({
    dtSec,
    armId: run.arm.armId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
  }))),
  comparison,
  interpretationBoundary: Object.freeze({
    quantitativeTimeStepRobustnessEstablished:
      comparison.quantitativeTimeStepRobustnessEstablished,
    qualitativeMechanismRejection:
      comparison.qualitativeRejection.mechanismRejectionPersistsAtEveryDt,
    physiologicalAcceptanceEstablished: false as const,
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
    conclusion: comparison.conclusion,
    allFactorialsNumericallyValid: comparison.allFactorialsNumericallyValid,
    quantitativeTimeStepRobustnessEstablished:
      comparison.quantitativeTimeStepRobustnessEstablished,
    qualitativeRejection: comparison.qualitativeRejection,
    convergence: comparison.convergence,
    arms: comparison.factorials.flatMap((factorial) =>
      factorial.arms.map((arm) => ({
        dtSec: arm.ablation.dtSec,
        armId: arm.arm.armId,
        flowPeakCountAboveFivePercent:
          arm.ablation.aorticFlowPeakCountAboveFivePercent,
        flowPeaksAboveFivePercent: arm.flowPeaksAboveFivePercent,
        ejectionTimeMs: arm.flowTiming.ejectionTimeProxySec * 1_000,
        peakFlowMlPerSec: arm.ablation.aorticMaximumFlowMlPerSec,
        meanDopplerGradientMmHg:
          arm.observationStations.timeMeanGradientMmHg.simplifiedDoppler,
        peakDopplerGradientMmHg:
          arm.observationStations.peakGradientMmHg.simplifiedDoppler,
        negativeGradientForwardVolumeMl:
          arm.momentumEnergy.positiveFlowNegativeNodeGradientVolumeMl,
        externalReferenceDistance:
          arm.externalReferenceCompatibility.primaryReferenceBandDistanceRms,
      }))),
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
