import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  measureMainWireVentricularLoadedShorteningAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLoadedShorteningAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ABLATION_V1_ID,
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ARM_IDS_V1,
  type MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityDistortionAmplitudeAblationV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowVelocityDistortionAmplitudeResearchArmV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireNormalAdultVentricularWallMaterialResearchV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const selectedArmIds = selectedArms(optionalArgument("--arms"));
const calcium = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;

const arms =
  selectedArmIds.map(
    (armId) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowVelocityDistortionAmplitudeResearchArmV1(
          { dtSec, maximumBeatCount },
          armId,
        );
      const material =
        resolveMainWireNormalAdultVentricularWallMaterialResearchV1(
          run.arm.ventricularMaterialPointId,
        );
      return Object.freeze({
        arm: run.arm,
        materialPoint: run.materialPoint,
        cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
          run.periodicResult,
          calcium,
          armId,
        ),
        isometric: measureMainWireVentricularLandIsometricTwitchAuditV1(
          calcium,
          { dtSec, fixedLandStretch: 1 },
          material,
        ),
        loadedShortening: measureMainWireVentricularLoadedShorteningAuditV1(
          run.periodicResult,
          calcium,
          {
            wallMaterialParams: material,
            expectedMechanicsProviderParameterIdentityHash:
              run.periodicResult.protocolIdentity.mechanicsProvider
                .parameterIdentityHash,
          },
        ),
        runnerClaim: run.claim,
      });
    },
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ABLATION_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder: selectedArmIds,
    completeEnvelopeExecuted:
      selectedArmIds.length
      === MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ARM_IDS_V1.length,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_CLAIM_V1,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    causalEnvelopeNotParameterFit: true as const,
    isometricInvarianceRequired: true as const,
    macroHemodynamicRecalibrationDeferred: true as const,
    gradientIsReadbackNotObjective: true as const,
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
    arms: report.arms.map((arm) => ({
      armId: arm.arm.armId,
      aeffScale: arm.arm.aeffScaleFromBaseline,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      peakAorticFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      isometricTensionTimeToPeakMs:
        arm.isometric.activeTwitch.timeToPeakSec * 1000,
      isometricTensionRelaxationTime50Ms:
        arm.isometric.activeTwitch.relaxationTime50Sec! * 1000,
      isometricTensionRelaxationTime95Ms:
        arm.isometric.activeTwitch.relaxationTime95Sec! * 1000,
      loadedLvfwPeakStressKPa:
        arm.loadedShortening.walls.LVFW.recordedWholeHeart.peakActiveStressKPa,
      loadedLvfwPeakFractionOfDistortionSuppressed:
        arm.loadedShortening.walls.LVFW.distortionContribution
          .loadedPeakStressFractionOfDistortionSuppressedReplay,
      loadedLvfwPeakFractionOfFixedOnsetLength:
        arm.loadedShortening.walls.LVFW.totalShorteningHistoryContribution
          .loadedPeakStressFractionOfFixedOnsetLength,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      terminationReason: arm.cycle.terminationReason,
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

function selectedArms(
  value: string | null,
): readonly MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1[] {
  if (value === null) {
    return MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ARM_IDS_V1;
  }
  const requested = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (requested.length === 0) throw new Error("--arms requires at least one arm");
  const allowed = new Set<string>(
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_AMPLITUDE_ARM_IDS_V1,
  );
  for (const armId of requested) {
    if (!allowed.has(armId)) throw new Error(`unsupported --arms value: ${armId}`);
  }
  return Object.freeze(
    requested as MainWireAorticOutflowVelocityDistortionAmplitudeArmIdV1[],
  );
}
