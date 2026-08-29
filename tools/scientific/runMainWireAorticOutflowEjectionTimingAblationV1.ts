import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticOutflowEjectionTimingArmsV1,
  measureMainWireAorticOutflowEjectionTimingArmV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowEjectionTimingAblationV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_FIXED_AMPLITUDE_DECAY_CLAIM_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumFixedAmplitudeDecayAblationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ABLATION_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ABLATION_V1_ID,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARM_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingAblationV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingResearchArmV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_GAMMA_W_RESEARCH_CLAIM_V1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const arms = MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARM_IDS_V1.map(
  (armId) => measureMainWireAorticOutflowEjectionTimingArmV1(
    runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingResearchArmV1(
      { dtSec, maximumBeatCount },
      armId,
    ),
  ),
);
const comparison = compareMainWireAorticOutflowEjectionTimingArmsV1(arms);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ABLATION_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder: MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ARM_IDS_V1,
    ablationClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_ABLATION_CLAIM_V1,
    calciumClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_FIXED_AMPLITUDE_DECAY_CLAIM_V1,
    gammaWClaim:
      MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_GAMMA_W_RESEARCH_CLAIM_V1,
  }),
  comparison,
  interpretationBoundary: Object.freeze({
    causalBracketNotParameterFit: true as const,
    longestEtArmIsNotAutomaticallyPreferred: true as const,
    macroHemodynamicRecalibrationDeferred: true as const,
    gradientIsReadbackNotObjective: true as const,
    dtRefinementRequiredBeforeCanonicalAdoption: true as const,
    clinicalValidationClaimed: false as const,
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
    summary: comparison.summary,
    arms: comparison.arms.map((arm) => {
      const contrast = comparison.contrastsToCanonical.find((candidate) =>
        candidate.armId === arm.armId)!;
      const lvfw = arm.loadedShortening.walls.LVFW;
      return {
        armId: arm.armId,
        causalAxis: arm.causalAxis,
        calciumDecayScale: arm.calciumDecayScaleFromBaseline,
        calciumExposureScale: arm.calciumExposureScaleFromBaseline,
        gammaWScale: arm.gammaWScaleFromBaseline,
        ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
        deltaEjectionTimeMs: contrast.deltaEjectionTimeMs,
        accelerationTimeMs:
          arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
        isometricTensionTimeToPeakMs:
          arm.isometricAtSourceRestingStretch.activeTwitch.timeToPeakSec * 1000,
        isometricTensionRelaxationTime50Ms:
          arm.isometricAtSourceRestingStretch.activeTwitch
            .relaxationTime50Sec! * 1000,
        isometricTensionRelaxationTime95Ms:
          arm.isometricAtSourceRestingStretch.activeTwitch
            .relaxationTime95Sec! * 1000,
        loadedLvfwPeakStressKPa: lvfw.recordedWholeHeart.peakActiveStressKPa,
        loadedLvfwPeakFractionOfDistortionSuppressed:
          lvfw.distortionContribution
            .loadedPeakStressFractionOfDistortionSuppressedReplay,
        loadedLvfwPeakFractionOfFixedOnsetLength:
          lvfw.totalShorteningHistoryContribution
            .loadedPeakStressFractionOfFixedOnsetLength,
        aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
        relativeAorticForwardVolumeChange:
          contrast.relativeAorticForwardVolumeChange,
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
        aorticRootPulsePressureMmHg:
          arm.monitoring.aorticRootPulsePressureMmHg,
        leftVentricularEjectionFraction01:
          arm.cycle.leftVentricularEjectionFraction01,
        aorticFlowPeakCount:
          arm.cycle.aorticFlowPeakCountAboveFivePercent,
        terminationReason: arm.cycle.terminationReason,
      };
    }),
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
