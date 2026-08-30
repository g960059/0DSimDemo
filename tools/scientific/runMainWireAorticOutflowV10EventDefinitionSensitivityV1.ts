import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowV10EventDefinitionSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10EventDefinitionSensitivityV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const run =
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
    { dtSec, maximumBeatCount },
    CANDIDATE.kuwProfileId,
    CANDIDATE.complianceProfileId,
    CANDIDATE.characteristicResistancePlacementProfileId,
    CANDIDATE.rootInertanceProfileId,
    CANDIDATE.sarcomereReferenceProfileId,
    CANDIDATE.calciumSensitivityLengthProfileId,
    CANDIDATE.twitchRetentionCandidateId,
    "baseline",
    "baseline",
    CANDIDATE.trefForceLoadProfileId,
    CANDIDATE.sourceVelocityDistortionProfileId,
    CANDIDATE.strongBridgeDeactivationExitProfileId,
    CANDIDATE.atrioventricularDelayProfileId,
    CANDIDATE.pressureRecoveryProfileId,
    CANDIDATE.recoveredRootPortValveProfileId,
  );
const sensitivity =
  measureMainWireAorticOutflowV10EventDefinitionSensitivityV1(run);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidate: CANDIDATE,
    candidateClaim: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_CLAIM,
    independentCanonicalColdStart: true as const,
    systemicRecalibrationApplied: false as const,
    parameterSearchOrFittingApplied: false as const,
  }),
  exactIdentity: Object.freeze({
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
    runnerClaim: run.claim,
  }),
  run: Object.freeze({
    terminationReason: run.periodicResult.terminationReason,
    periodicSteadyStateClaimed:
      run.periodicResult.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      run.periodicResult.integrationCompletedWithoutFailure,
    completedBeatCount: run.periodicResult.completedBeatCount,
  }),
  sensitivity,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (outputPath !== null) {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
}

process.stdout.write(`${JSON.stringify({
  methodId: sensitivity.methodId,
  dtSec,
  maximumBeatCount,
  outputPath: outputPath === null ? null : path.resolve(outputPath),
  run: report.run,
  positiveAorticPeakFlowMlPerSec:
    sensitivity.positiveAorticPeakFlowMlPerSec,
  flowDefinitions: sensitivity.flowDefinitions.map((definition) => ({
    definitionId: definition.definitionId,
    thresholdMlPerSec: definition.thresholdMlPerSec,
    episodeCount: definition.episode.cyclicEpisodeCount,
    extraActiveSampleCountOutsidePrimaryEpisode:
      definition.episode.extraActiveSampleCountOutsidePrimaryEpisode,
    ictLikeMs: definition.timing.mvcToStartSec * 1000,
    ejectionTimeMs: definition.timing.durationSec * 1000,
    ivrtLikeMs: definition.timing.endToMvoSec * 1000,
    teiLike: definition.timing.teiLike,
    timingPartitionOrderSatisfied:
      definition.timing.mvcStartEndMvoCyclicOrderSatisfied,
  })),
  exactLocalPortPressureCrossing: {
    ictLikeMs:
      sensitivity.exactLocalPortPressureCrossing.timing.mvcToStartSec * 1000,
    ejectionTimeMs:
      sensitivity.exactLocalPortPressureCrossing.timing.durationSec * 1000,
    ivrtLikeMs:
      sensitivity.exactLocalPortPressureCrossing.timing.endToMvoSec * 1000,
    teiLike: sensitivity.exactLocalPortPressureCrossing.timing.teiLike,
    timingPartitionOrderSatisfied:
      sensitivity.exactLocalPortPressureCrossing.timing
        .mvcStartEndMvoCyclicOrderSatisfied,
  },
  forwardVolumeWindows: sensitivity.forwardVolumeWindows.map((window) => ({
    windowId: window.windowId,
    durationMs: window.centralForwardVolumeWindowDurationSec * 1000,
    totalForwardVolumeMl: window.totalForwardVolumeMl,
    centralForwardVolumeFraction01: window.centralForwardVolumeFraction01,
    valveEventTimingUnavailableReason:
      window.valveEventTimingUnavailableReason,
  })),
  currentReferences: sensitivity.currentReferences,
})}\n`);

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
