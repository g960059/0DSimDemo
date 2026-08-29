import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_FACTORIAL_V1_ID,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityDistortionTrefFactorialV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowVelocityDistortionTrefResearchArmV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const calcium = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const selectedArmIds = selectedArmsArgument();

const arms = selectedArmIds.map(
    (armId) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowVelocityDistortionTrefResearchArmV1(
          { dtSec, maximumBeatCount },
          armId,
        );
      const samples = run.periodicResult.retainedCompleteBeats.at(-1)!.samples;
      return Object.freeze({
        arm: run.arm,
        materialPoint: run.materialPoint,
        cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
          run.periodicResult,
          calcium,
          armId,
        ),
        diastolicFlow:
          measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
            run.periodicResult,
          ),
        monitoring: Object.freeze({
          meanRightAtrialAbsolutePressureMmHg: mean(samples.map((sample) =>
            sample.circulationNodeAbsolutePressureMmHg.RA)),
          meanLeftAtrialAbsolutePressureMmHg: mean(samples.map((sample) =>
            sample.circulationNodeAbsolutePressureMmHg.LA)),
        }),
        runnerClaim: run.claim,
      });
    },
  );

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_FACTORIAL_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder: selectedArmIds,
    claim: MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_CLAIM_V1,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    trefIsOrthogonalActiveForceScaleAxis: true as const,
    etPreservationProspectivelyEvaluated: true as const,
    gradientIsReadbackNotObjective: true as const,
    parameterFitOrCanonicalAdoptionEstablished: false as const,
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
      trefScale: arm.arm.trefScaleFromBaseline,
      resolvedAeff: arm.materialPoint.resolvedVentricularLandAeff,
      resolvedTrefPa: arm.materialPoint.resolvedVentricularLandTrefPa,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      fullyOpenUniformFlowDopplerGradientLowerBoundMmHg:
        arm.cycle.aorticFullyOpenUniformFlowDopplerGradientLowerBoundMmHg,
      dynamicAreaDopplerPenaltyFactor:
        arm.cycle.aorticDynamicAreaDopplerPenaltyFactor,
      jetVelocityWaveformNonuniformityFactor:
        arm.cycle.aorticJetVelocityWaveformNonuniformityFactor,
      diastolicFlow: arm.diastolicFlow.value,
      diastolicFlowUnavailabilityReason: arm.diastolicFlow.reason,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      meanRightAtrialPressureMmHg:
        arm.monitoring.meanRightAtrialAbsolutePressureMmHg,
      meanLeftAtrialPressureMmHg:
        arm.monitoring.meanLeftAtrialAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      terminationReason: arm.cycle.terminationReason,
    })),
  })}\n`);
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

function selectedArmsArgument(): readonly (
  typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARM_IDS_V1[number]
)[] {
  const requested = optionalArgument("--arms");
  if (requested === null) {
    return MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARM_IDS_V1;
  }
  const values = requested.split(",").filter((value) => value !== "");
  if (values.length === 0) throw new Error("--arms requires at least one arm");
  const supported = new Set<string>(
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARM_IDS_V1,
  );
  for (const value of values) {
    if (!supported.has(value)) {
      throw new Error(`unsupported --arms value: ${value}`);
    }
  }
  return Object.freeze(values) as readonly (
    typeof MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_TREF_ARM_IDS_V1[number]
  )[];
}
