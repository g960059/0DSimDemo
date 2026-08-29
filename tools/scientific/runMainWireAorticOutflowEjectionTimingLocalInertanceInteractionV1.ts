import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ANALYSIS_CLAIM_V1,
  measureMainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_V1_ID,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingLocalInertanceInteractionResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const dtSec = numericArgument("--dt", 0.001);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1
    .map((armId) =>
      runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingLocalInertanceInteractionResearchV1(
        { dtSec, maximumBeatCount },
        armId,
      ));
const interaction =
  measureMainWireAorticOutflowEjectionTimingLocalInertanceInteractionV1(
    runs.map((run) => Object.freeze({
      armId: run.arm.armId,
      periodicResult: run.periodicResult,
    })),
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ARM_IDS_V1,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOCAL_INERTANCE_INTERACTION_ANALYSIS_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(runs.map((run) => Object.freeze({
    armId: run.arm.armId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
  }))),
  resolvedRuns: Object.freeze(runs.map((run) => Object.freeze({
    arm: run.arm,
    materialPoint: run.materialPoint,
    localInertanceProfile: run.localInertanceProfile,
    externalFlowStateAudit: run.externalFlowStateAudit,
    runnerClaim: run.claim,
  }))),
  interaction,
  interpretationBoundary: Object.freeze({
    sourceAeffRecalibrationEstablished: false as const,
    localInertanceAnatomicalLengthEstablished: false as const,
    pressureRecoveryTestedInThisInteraction: false as const,
    loadEnvelopeTestedInThisInteraction: false as const,
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
    allProtocolIdentitiesDistinct:
      interaction.allProtocolIdentitiesDistinct,
    priorCanonicalPhysicalInertanceFailureReproduced:
      interaction.priorCanonicalPhysicalInertanceFailureReproduced,
    etCandidatePhysicalInertanceInteraction:
      interaction.etCandidatePhysicalInertanceInteraction,
    arms: interaction.arms.map((arm) => ({
      armId: arm.arm.armId,
      terminationReason: arm.cycle.terminationReason,
      localInertanceMmHgSec2PerMl:
        arm.localInertanceMmHgSec2PerMl,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      lvfwActiveStressDistinctPeakCount:
        arm.lvfwActiveStressDistinctPeakCountAboveFivePercent,
      morphologyPreserved: arm.morphologyPreserved,
      etWithinReference: arm.etWithinReference,
      atWithinReference: arm.atWithinReference,
      peakVelocityWithinReference: arm.peakVelocityWithinReference,
      meanGradientWithinReference: arm.meanGradientWithinReference,
      allPrimaryScreensPassed: arm.allPrimaryScreensPassed,
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
