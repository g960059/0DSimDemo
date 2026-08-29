import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceVelocityDistortionBracketV1";
import type {
  MainWireVentricularLandTrefForceLoadProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_SOURCE_VELOCITY_DISTORTION_FORCE_REFINEMENT_V1_ID =
  "main-wire-aortic-outflow-land-source-velocity-distortion-force-refinement-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const combinations = Object.freeze([
  combination("source-Aeff-four-thirds", "tref-force-load-baseline"),
  combination("source-Aeff-four-thirds", "tref-force-load-high"),
  combination("source-Aeff-three-halves", "tref-force-load-baseline"),
  combination("source-Aeff-three-halves", "tref-force-load-high"),
  combination("source-Aeff-five-thirds", "tref-force-load-baseline"),
  combination("source-Aeff-five-thirds", "tref-force-load-high"),
]);

const arms = combinations.map((combinationValue) => {
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
      { dtSec, maximumBeatCount },
      "land-whole-organ-kuw-nu4",
      "arterial-stiffness-twofold",
      "Land2017-characteristic-impedance-matched",
      "aortic-root-inertance-two-fifths",
      "land-sarcomere-reference-plus-5-percent",
      "land-beta1-canonical",
      "source-twitch-retention-canonical",
      "baseline",
      "baseline",
      combinationValue.trefForceLoadProfileId,
      combinationValue.velocityDistortionProfileId,
    );
  return Object.freeze({
    combination: combinationValue,
    resolvedVelocityDistortionProfile: run.sourceVelocityDistortionProfile,
    resolvedTrefForceLoadProfile: run.trefForceLoadProfile,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      run.calciumDriveParams,
      combinationValue.armId,
    ),
    diastolicFlow:
      measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
        run.periodicResult,
      ),
    runnerClaim: run.claim,
  });
});

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_SOURCE_VELOCITY_DISTORTION_FORCE_REFINEMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    combinations,
    independentCanonicalColdStartPerArm: true as const,
    velocityBracketSelectedAfterPriorFixedBroadBracket: true as const,
    forceAxisWasPreExistingFixedLoadResponseAxis: true as const,
    numericOptimizerApplied: false as const,
    parameterSearchOrFitting: false as const,
  }),
  arms: Object.freeze(arms),
  interpretationBoundary: Object.freeze({
    sourceTwitchKineticsHeldExactly: true as const,
    noncanonicalAeffIsNotSourceIdentity: true as const,
    macroHemodynamicRecalibrationIsBoundedForceResponseOnly: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
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
    arms: arms.map((arm) => ({
      armId: arm.combination.armId,
      aeffScale:
        arm.resolvedVelocityDistortionProfile.aeffScaleFromIntactHumanSource,
      trefScale:
        arm.resolvedTrefForceLoadProfile.trefScaleFromRetainedCandidate,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      diastolicFlow: arm.diastolicFlow.value,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
    })),
  })}\n`);
}

function combination(
  velocityDistortionProfileId:
    MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
  trefForceLoadProfileId: MainWireVentricularLandTrefForceLoadProfileIdV1,
) {
  return Object.freeze({
    armId: `${velocityDistortionProfileId}-${trefForceLoadProfileId}`,
    velocityDistortionProfileId,
    trefForceLoadProfileId,
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
