import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_CLAIM_V1,
  measureMainWireVentricularLoadedShorteningAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLoadedShorteningAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_EXPERIMENT_V1_ID =
  "main-wire-ventricular-loaded-shortening-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const delayedProfileId =
  "ventricular-calcium-half-delayed-by-rise-time-exposure-preserving" as const;
const runInputs = Object.freeze([
  Object.freeze({
    profileId: "canonical" as const,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    periodicResult:
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec, maximumBeatCount },
        "canonical",
      ).periodicResult,
  }),
  (() => {
    const run =
      runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1(
        { dtSec, maximumBeatCount },
        delayedProfileId,
      );
    return Object.freeze({
      profileId: delayedProfileId,
      calciumDriveParams:
        resolveMainWireVentricularCalciumDelayedMixtureParamsV1(
          delayedProfileId,
        ),
      periodicResult: run.periodicResult,
    });
  })(),
]);
const arms = runInputs.map((input) => Object.freeze({
  profileId: input.profileId,
  isometricAtSourceRestingStretch:
    measureMainWireVentricularLandIsometricTwitchAuditV1(
      input.calciumDriveParams,
      { dtSec, fixedLandStretch: 1 },
    ),
  loadedShortening: measureMainWireVentricularLoadedShorteningAuditV1(
    input.periodicResult,
    input.calciumDriveParams,
  ),
}));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profileOrder: Object.freeze(runInputs.map(({ profileId }) => profileId)),
    loadedShorteningClaim:
      MAIN_WIRE_VENTRICULAR_LOADED_SHORTENING_AUDIT_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    counterfactualReplayFeedsBackIntoWholeHeart: false as const,
    distortionSuppressionIsAProposedCanonicalChange: false as const,
    sourceTraceReproductionEstablished: false as const,
    causalFlowImprovementEstablished: false as const,
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
    arms: report.arms.map(({ profileId, loadedShortening }) => ({
      profileId,
      periodicSteadyStateClaimed:
        loadedShortening.source.periodicSteadyStateClaimed,
      ejectionDurationMs:
        loadedShortening.aorticEjectionEpisode.durationSec * 1000,
      walls: Object.fromEntries(Object.entries(loadedShortening.walls).map(
        ([wallId, wall]) => [wallId, {
          stretchAtEjectionOnset:
            wall.strainHistory.landStretchAtAorticFlowOnset,
          netEjectionShortening: wall.strainHistory.netEjectionShortening,
          maximumEjectionShorteningRatePerSec:
            wall.strainHistory.maximumEjectionShorteningRatePerSec,
          recordedPeakStressKPa: wall.recordedWholeHeart.peakActiveStressKPa,
          fullReplayPeakStressKPa:
            wall.fullKinematicsReplay.peakActiveStressKPa,
          distortionSuppressedPeakStressKPa:
            wall.distortionSuppressedReplay.peakActiveStressKPa,
          fixedAtEjectionOnsetPeakStressKPa:
            wall.fixedAtEjectionOnsetReplay.peakActiveStressKPa,
          peakStressFraction:
            wall.distortionContribution
              .loadedPeakStressFractionOfDistortionSuppressedReplay,
          stressAtFlowPeakFraction:
            wall.distortionContribution
              .loadedStressAtAorticFlowPeakFractionOfDistortionSuppressedReplay,
          dynamicLengthPeakStressFraction:
            wall.dynamicLengthContribution
              .distortionFreeDynamicLengthPeakStressFractionOfFixedOnsetLength,
          dynamicLengthStressAtFlowPeakFraction:
            wall.dynamicLengthContribution
              .distortionFreeDynamicLengthStressAtAorticFlowPeakFractionOfFixedOnsetLength,
          totalShorteningHistoryPeakStressFraction:
            wall.totalShorteningHistoryContribution
              .loadedPeakStressFractionOfFixedOnsetLength,
          replayRelativeResidual:
            wall.replayConsistency
              .maximumRelativeRecordedVsFullReplayStressResidual,
        }],
      )),
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
