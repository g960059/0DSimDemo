import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ANALYSIS_CLAIM_V1,
  measureMainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_V1_ID,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingCharacteristicResistancePlacementResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_CLAIM_V1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

const dtSec = numericArgument("--dt", 0.001);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1
    .map((armId) =>
      runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingCharacteristicResistancePlacementResearchV1(
        { dtSec, maximumBeatCount },
        armId,
      ));
const comparison =
  measureMainWireAorticOutflowEjectionTimingCharacteristicResistancePlacementV1(
    runs.map((run) => Object.freeze({
      armId: run.arm.armId,
      placementProfile: run.placementProfile,
      periodicResult: run.periodicResult,
    })),
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ARM_IDS_V1,
    placementClaim:
      MAIN_WIRE_AORTIC_CHARACTERISTIC_RESISTANCE_PLACEMENT_CLAIM_V1,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CHARACTERISTIC_RESISTANCE_PLACEMENT_ANALYSIS_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(runs.map((run) => Object.freeze({
    armId: run.arm.armId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
  }))),
  resolvedRuns: Object.freeze(runs.map((run) => Object.freeze({
    arm: run.arm,
    materialPoint: run.materialPoint,
    placementProfile: run.placementProfile,
    runnerClaim: run.claim,
  }))),
  comparison,
  interpretationBoundary: Object.freeze({
    sourceAeffRecalibrationEstablished: false as const,
    characteristicResistanceAnatomicalLocationEstablished: false as const,
    pulsatileCircuitEquivalenceEstablished: false as const,
    loadEnvelopeTestedInThisExperiment: false as const,
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
      comparison.allProtocolIdentitiesDistinct,
    allRunsPeriod1Integrated: comparison.allRunsPeriod1Integrated,
    allLinearResistanceSumsPreservedWithinRoundoff:
      comparison.allLinearResistanceSumsPreservedWithinRoundoff,
    anyPlacementRetainedForEtPriorityAndImprovesAtProxy:
      comparison.anyPlacementRetainedForEtPriorityAndImprovesAtProxy,
    arms: comparison.arms.map((arm) => ({
      armId: arm.arm.armId,
      terminationReason: arm.cycle.terminationReason,
      movedFraction01:
        arm.placementProfile
          ?.fractionMovedUpstreamOfAorticRootCompliance01 ?? 0,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeProxyMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanNodeGradientMmHg: arm.cycle.meanNodeGradientMmHg,
      peakNodeGradientMmHg: arm.cycle.peakNodeGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      lvfwActiveStressDistinctPeakCount:
        arm.lvfwActiveStressDistinctPeakCountAboveFivePercent,
      morphologyPreserved: arm.morphologyPreserved,
      etWithinReference: arm.etWithinReference,
      atProxyWithinReference: arm.atProxyWithinReference,
      peakVelocityWithinReference: arm.peakVelocityWithinReference,
      meanGradientWithinReference: arm.meanGradientWithinReference,
      retainedForEtPriority: arm.retainedForEtPriority,
      resistanceSumResidualMmHgSecPerMl:
        arm.linearResistanceSumResidualMmHgSecPerMl,
    })),
    contrasts:
      comparison.contrastsFromSameMechanicsCanonicalPlacement.map(
        (contrast) => ({
          armId: contrast.armId,
          referenceArmId: contrast.referenceArmId,
          movedFraction01: contrast.movedFraction01,
          ejectionTimeChangeMs: contrast.ejectionTimeChangeSec * 1000,
          accelerationTimeProxyChangeMs:
            contrast.accelerationTimeProxyChangeSec * 1000,
          peakFlowChangeMlPerSec: contrast.peakFlowChangeMlPerSec,
          meanGradientChangeMmHg: contrast.meanGradientChangeMmHg,
          peakGradientChangeMmHg: contrast.peakGradientChangeMmHg,
          retainedForEtPriority: contrast.retainedForEtPriority,
          atProxyImproved: contrast.atProxyImproved,
        }),
      ),
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
