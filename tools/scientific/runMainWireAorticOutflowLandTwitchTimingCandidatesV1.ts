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
  runMainWireNormalAdultFiveWallVentricularLandTwitchTimingResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_V1_ID,
  resolveMainWireVentricularLandTwitchTimingWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandTwitchTimingCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_TWITCH_TIMING_CANDIDATES_V1_ID =
  "main-wire-aortic-outflow-land-twitch-timing-candidates-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const arms = MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATE_IDS_V1.map(
  (candidateId) => {
    const run =
      runMainWireNormalAdultFiveWallVentricularLandTwitchTimingResearchV1(
        { dtSec, maximumBeatCount },
        candidateId,
      );
    const material =
      resolveMainWireVentricularLandTwitchTimingWallMaterialV1(candidateId);
    const samples = run.periodicResult.retainedCompleteBeats.at(-1)!.samples;
    return Object.freeze({
      candidate: run.candidate,
      cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        candidateId,
      ),
      isometric: measureMainWireVentricularLandIsometricTwitchAuditV1(
        run.calciumDriveParams,
        { dtSec, fixedLandStretch: 1 },
        material,
      ),
      loadedShortening: measureMainWireVentricularLoadedShorteningAuditV1(
        run.periodicResult,
        run.calciumDriveParams,
        {
          wallMaterialParams: material,
          expectedMechanicsProviderParameterIdentityHash:
            run.periodicResult.protocolIdentity.mechanicsProvider
              .parameterIdentityHash,
        },
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
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_TWITCH_TIMING_CANDIDATES_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateOrder:
      MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATE_IDS_V1,
    candidateExperimentId:
      MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_V1_ID,
    candidateClaim:
      MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_CLAIM_V1,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    candidateValuesChosenWithoutHemodynamics: true as const,
    ejectionTimeIsProspectiveClosedLoopReadback: true as const,
    rawKineticCandidatesNotPeakTensionNormalized: true as const,
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
      candidateId: arm.candidate.candidateId,
      scales: arm.candidate.scaleFromBaselineByParameter,
      isometricPeakKPa: arm.isometric.activeTwitch.peakKPa,
      isometricTensionTimeToPeakMs:
        arm.isometric.activeTwitch.timeToPeakSec * 1000,
      isometricTensionRelaxationTime50Ms:
        arm.isometric.activeTwitch.relaxationTime50Sec! * 1000,
      isometricTensionRelaxationTime95Ms:
        arm.isometric.activeTwitch.relaxationTime95Sec! * 1000,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      peakAorticFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      meanRightAtrialPressureMmHg:
        arm.monitoring.meanRightAtrialAbsolutePressureMmHg,
      meanLeftAtrialPressureMmHg:
        arm.monitoring.meanLeftAtrialAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      loadedLvfwPeakStressKPa:
        arm.loadedShortening.walls.LVFW.recordedWholeHeart.peakActiveStressKPa,
      loadedLvfwPeakFractionOfFixedOnsetLength:
        arm.loadedShortening.walls.LVFW.totalShorteningHistoryContribution
          .loadedPeakStressFractionOfFixedOnsetLength,
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
