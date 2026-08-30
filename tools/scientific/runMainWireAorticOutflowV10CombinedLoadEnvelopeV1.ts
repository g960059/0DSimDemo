import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowV10CombinedLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10CombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
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

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
    .map((context) => Object.freeze({
      contextId: context.contextId,
      run:
        runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
          { dtSec, maximumBeatCount },
          CANDIDATE.kuwProfileId,
          context.complianceProfileId,
          CANDIDATE.characteristicResistancePlacementProfileId,
          CANDIDATE.rootInertanceProfileId,
          CANDIDATE.sarcomereReferenceProfileId,
          CANDIDATE.calciumSensitivityLengthProfileId,
          CANDIDATE.twitchRetentionCandidateId,
          context.circulatoryLoadPointId,
          context.stressedVenousVolumePointId,
          context.trefForceLoadProfileId,
          CANDIDATE.sourceVelocityDistortionProfileId,
          CANDIDATE.strongBridgeDeactivationExitProfileId,
          CANDIDATE.atrioventricularDelayProfileId,
          CANDIDATE.pressureRecoveryProfileId,
          CANDIDATE.recoveredRootPortValveProfileId,
        ),
    }));
const envelope = measureMainWireAorticOutflowV10CombinedLoadEnvelopeV1(runs);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidate: CANDIDATE,
    candidateClaim: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_CLAIM,
    contextOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
        .map((context) => context.contextId),
  }),
  exactIdentities: Object.freeze(runs.map(({ contextId, run }) =>
    Object.freeze({
      contextId,
      protocolIdentityHash: run.periodicResult.protocolIdentityHash,
      protocolComponentHashes: run.periodicResult.protocolComponentHashes,
      runnerClaim: run.claim,
    }))),
  envelope,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (outputPath !== null) {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
}

const baseByContext = new Map(envelope.baseEnvelope.arms.map((arm) =>
  [arm.context.contextId, arm]));
process.stdout.write(`${JSON.stringify({
  methodId: envelope.methodId,
  dtSec,
  maximumBeatCount,
  outputPath: outputPath === null ? null : path.resolve(outputPath),
  stationRanges: envelope.stationRanges,
  baseRanges: envelope.baseEnvelope.ranges,
  diastolicRanges: envelope.baseEnvelope.diastolicRanges,
  allRunsPeriod1AndIntegrated: envelope.allRunsPeriod1AndIntegrated,
  distinctPeakMorphologyPreservedAcrossEnvelope:
    envelope.baseEnvelope.distinctPeakMorphologyPreservedAcrossEnvelope,
  maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum:
    envelope.baseEnvelope
      .maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum,
  allOwnedOpeningTargetsWithinTolerance:
    envelope.allOwnedOpeningTargetsWithinTolerance,
  allSourceResistanceReadbacksWithinTolerance:
    envelope.allSourceResistanceReadbacksWithinTolerance,
  allExactPowerBalancesWithinTolerance:
    envelope.allExactPowerBalancesWithinTolerance,
  allValveDissipationLedgersWithinTolerance:
    envelope.allValveDissipationLedgersWithinTolerance,
  allStationReconstructionResidualsWithinTolerance:
    envelope.allStationReconstructionResidualsWithinTolerance,
  strictExternalIntervalMatchCounts:
    envelope.baseEnvelope.strictExternalIntervalMatchCounts,
  strictFailureContextIds: envelope.baseEnvelope.strictFailureContextIds,
  arms: envelope.stationArms.map((station) => {
    const base = baseByContext.get(station.contextId)!;
    return {
      contextId: station.contextId,
      terminationReason: base.cycle.terminationReason,
      ejectionTimeMs: base.coreMetrics.ejectionTimeSec * 1000,
      strokeVolumeMl: base.coreMetrics.aorticForwardVolumeMl,
      meanDopplerGradientMmHg: base.coreMetrics.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: base.coreMetrics.peakDopplerGradientMmHg,
      meanRawNodeGradientMmHg:
        station.pressureStations.timeMeanGradientMmHg.rawLvMinusReservoirNode,
      peakRawNodeGradientMmHg:
        station.pressureStations.peakInstantaneousGradientMmHg
          .rawLvMinusReservoirNode,
      meanLocalPortGradientMmHg:
        station.pressureStations.timeMeanGradientMmHg
          .exactLvMinusProximalPort,
      peakLocalPortGradientMmHg:
        station.pressureStations.peakInstantaneousGradientMmHg
          .exactLvMinusProximalPort,
      distinctPeakCount:
        base.cycle.aorticFlowDistinctPeakCountAboveFivePercent,
      failures: base.strictExternalIntervalFailures,
    };
  }),
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
