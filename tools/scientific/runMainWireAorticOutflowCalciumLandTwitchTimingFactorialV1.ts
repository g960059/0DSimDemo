import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PRIOR_CLAIM_V1,
  type MainWireVentricularCalciumSourceConstrainedProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceConstrainedPriorV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumLandTwitchTimingResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_CLAIM_V1,
  resolveMainWireVentricularLandTwitchTimingWallMaterialV1,
  type MainWireVentricularLandTwitchTimingCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandTwitchTimingCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_LAND_TWITCH_TIMING_FACTORIAL_V1_ID =
  "main-wire-aortic-outflow-calcium-land-twitch-timing-factorial-v1" as const;

const SOURCE_PROFILE_ID =
  "land2017-figure6-source-constrained-biexponential" as const;
const TIMING_CANDIDATE_ID =
  "land-rw-three-quarters-trpn50-six-fifths" as const;
const calciumProfileIds = Object.freeze([
  "canonical",
  SOURCE_PROFILE_ID,
] as const satisfies readonly MainWireVentricularCalciumSourceConstrainedProfileIdV1[]);
const twitchTimingCandidateIds = Object.freeze([
  "canonical",
  TIMING_CANDIDATE_ID,
] as const satisfies readonly MainWireVentricularLandTwitchTimingCandidateIdV1[]);

const dtSec = numericArgument("--dt", 0.002);
const twitchDtSec = numericArgument("--twitch-dt", 0.001);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const arms = calciumProfileIds.flatMap((calciumProfileId) =>
  twitchTimingCandidateIds.map((twitchTimingCandidateId) => {
    const run =
      runMainWireNormalAdultFiveWallVentricularCalciumLandTwitchTimingResearchV1(
        { dtSec, maximumBeatCount },
        calciumProfileId,
        twitchTimingCandidateId,
      );
    const material =
      resolveMainWireVentricularLandTwitchTimingWallMaterialV1(
        twitchTimingCandidateId,
      );
    return Object.freeze({
      armId: `${calciumProfileId}__${twitchTimingCandidateId}`,
      calciumProfile: run.calciumProfile,
      twitchTimingCandidate: run.twitchTimingCandidate,
      cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        `${calciumProfileId} by ${twitchTimingCandidateId}`,
      ),
      isometric: measureMainWireVentricularLandIsometricTwitchAuditV1(
        run.calciumDriveParams,
        { dtSec: twitchDtSec, fixedLandStretch: 1 },
        material,
      ),
      runnerClaim: run.claim,
    });
  }),
);

const metricIds = Object.freeze([
  "aorticEjectionTimeProxySec",
  "aorticMaximumFlowMlPerSec",
  "meanDopplerGradientMmHg",
  "peakDopplerGradientMmHg",
  "aorticForwardVolumeMl",
  "meanAorticAbsolutePressureMmHg",
] as const);
const contrasts = Object.freeze(Object.fromEntries(metricIds.map((metricId) => {
  const canonical = arm("canonical", "canonical").cycle[metricId];
  const sourceCalcium = arm(SOURCE_PROFILE_ID, "canonical").cycle[metricId];
  const timing = arm("canonical", TIMING_CANDIDATE_ID).cycle[metricId];
  const combined = arm(SOURCE_PROFILE_ID, TIMING_CANDIDATE_ID).cycle[metricId];
  return [metricId, Object.freeze({
    canonical,
    sourceCalciumMainEffect: sourceCalcium - canonical,
    twitchTimingMainEffect: timing - canonical,
    combined,
    interactionDifferenceOfDifferences:
      combined - sourceCalcium - timing + canonical,
  })];
})));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_LAND_TWITCH_TIMING_FACTORIAL_V1_ID,
  design: Object.freeze({
    dtSec,
    twitchDtSec,
    maximumBeatCount,
    calciumProfileIds,
    twitchTimingCandidateIds,
    calciumClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PRIOR_CLAIM_V1,
    timingClaim:
      MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_CLAIM_V1,
  }),
  arms,
  contrasts,
  interpretationBoundary: Object.freeze({
    fixedTwoByTwoCausalInteractionReadback: true as const,
    parameterSearchOrFitting: false as const,
    commonAorticValveLawAndCirculatoryLoad: true as const,
    macroHemodynamicRecalibrationDeferred: true as const,
    clinicalValidationClaimed: false as const,
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
    arms: report.arms.map((entry) => ({
      armId: entry.armId,
      calciumPeakUM: entry.isometric.calcium.maximum,
      isometricPeakKPa: entry.isometric.activeTwitch.peakKPa,
      isometricTimeToPeakMs:
        entry.isometric.activeTwitch.timeToPeakSec * 1000,
      isometricRelaxationTime50Ms:
        entry.isometric.activeTwitch.relaxationTime50Sec === null
          ? null
          : entry.isometric.activeTwitch.relaxationTime50Sec * 1000,
      isometricRelaxationTime95Ms:
        entry.isometric.activeTwitch.relaxationTime95Sec === null
          ? null
          : entry.isometric.activeTwitch.relaxationTime95Sec * 1000,
      ejectionTimeMs: entry.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        entry.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: entry.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: entry.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: entry.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: entry.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: entry.cycle.meanAorticAbsolutePressureMmHg,
      flowPeakCount: entry.cycle.aorticFlowPeakCountAboveFivePercent,
      terminationReason: entry.cycle.terminationReason,
    })),
    contrasts: report.contrasts,
  })}\n`);
}

function arm(
  calciumProfileId: MainWireVentricularCalciumSourceConstrainedProfileIdV1,
  twitchTimingCandidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
) {
  const found = arms.find((entry) =>
    entry.calciumProfile.profileId === calciumProfileId
    && entry.twitchTimingCandidate.candidateId === twitchTimingCandidateId);
  if (found === undefined) throw new Error("factorial arm not found");
  return found;
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
