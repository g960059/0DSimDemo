import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_AUDIT_CLAIM_V1,
  measureMainWireVentricularSeriesElasticReplayAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularSeriesElasticReplayAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_EXPERIMENT_V1_ID =
  "main-wire-ventricular-series-elastic-replay-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const run = runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
  { dtSec, maximumBeatCount },
  "canonical",
);
const audit = measureMainWireVentricularSeriesElasticReplayAuditV1(
  run.periodicResult,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    auditClaim: MAIN_WIRE_VENTRICULAR_SERIES_ELASTIC_REPLAY_AUDIT_CLAIM_V1,
  }),
  audit,
  interpretationBoundary: Object.freeze({
    prescribedCanonicalCalciumAndTotalFiberStrainHistory: true as const,
    seriesMechanismFeedsBackIntoWholeHeart: false as const,
    closedLoopEjectionTimeChangeMeasured: false as const,
    screeningQuestion:
      "whether-physiologic-series-extension-retains-or-prolongs-loaded-active-stress" as const,
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
    sourceEjectionTimeMs: audit.aorticEjectionEpisode.durationSec * 1000,
    arms: audit.arms.map((arm) => ({
      profileId: arm.profile.profileId,
      seriesStiffnessKPa: arm.profile.seriesHenckyStiffnessKPa,
      converged: arm.converged,
      simulatedCycleCount: arm.simulatedCycleCount,
      peakStressKPa: arm.peakTransmittedActiveStressKPa,
      stressAtFlowPeakKPa: arm.transmittedActiveStressAtAorticFlowPeakKPa,
      stressAtFlowEndKPa: arm.transmittedActiveStressAtAorticFlowEndKPa,
      stressImpulseKPaSec: arm.positiveTransmittedActiveStressImpulseKPaSec,
      durationAboveHalfPeakMs: arm.durationAboveHalfPeakSec * 1000,
      maximumSeriesExtensionPercent:
        arm.maximumSeriesExtensionFraction01 * 100,
      seriesExtensionAtFlowEndPercent:
        arm.seriesExtensionAtAorticFlowEndFraction01 * 100,
      internalEjectionShorteningPercent:
        arm.internalContractileShorteningDuringEjectionFraction01 * 100,
      totalEjectionShorteningPercent:
        arm.totalLandShorteningDuringEjectionFraction01 * 100,
      localPeakCount: arm.localPeakCountAboveFivePercentPeak,
      tensionClampSampleCount: arm.tensionClampSampleCount,
      maximumForceResidualKPa:
        arm.maximumSeriesForceEquilibriumResidualKPa,
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
