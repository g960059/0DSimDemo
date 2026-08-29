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
import {
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILE_IDS_V1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceVelocityDistortionBracketV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_SOURCE_VELOCITY_DISTORTION_V1_ID =
  "main-wire-aortic-outflow-land-source-velocity-distortion-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const arms = MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILE_IDS_V1
  .map((profileId) => {
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
        "tref-force-load-baseline",
        profileId,
      );
    return Object.freeze({
      profile: run.sourceVelocityDistortionProfile,
      protocolIdentityHash: run.periodicResult.protocolIdentityHash,
      cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        profileId,
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
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_SOURCE_VELOCITY_DISTORTION_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profileIds:
      MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_PROFILE_IDS_V1,
    profileClaim:
      MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_DISTORTION_CLAIM_V1,
    sourceTwitchRetentionCandidateId:
      "source-twitch-retention-canonical" as const,
    trefForceLoadProfileId: "tref-force-load-baseline" as const,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    profileBracketFixedBeforeThisClosedLoopExecution: true as const,
    noncanonicalAeffIsNotSourceIdentity: true as const,
    macroHemodynamicRecalibrationApplied: false as const,
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
      profileId: arm.profile.profileId,
      aeffScale: arm.profile.aeffScaleFromIntactHumanSource,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      fullyOpenUniformFlowDopplerGradientLowerBoundMmHg:
        arm.cycle.aorticFullyOpenUniformFlowDopplerGradientLowerBoundMmHg,
      dynamicAreaDopplerPenaltyFactor:
        arm.cycle.aorticDynamicAreaDopplerPenaltyFactor,
      jetVelocityWaveformNonuniformityFactor:
        arm.cycle.aorticJetVelocityWaveformNonuniformityFactor,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      diastolicFlow: arm.diastolicFlow.value,
      diastolicFlowUnavailabilityReason: arm.diastolicFlow.reason,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
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
