import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V2 as CANDIDATE,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV2";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_CLAIM_V1,
  resolveMainWireVentricularLandStrongBridgeDeactivationExitProfileV1,
  type MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandStrongBridgeDeactivationExitBracketV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1,
  type MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_STRONG_BRIDGE_DEACTIVATION_EXIT_COMBINED_LOAD_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-strong-bridge-deactivation-exit-combined-load-envelope-v1" as const;

const deactivationProfileId = deactivationProfileArgument();
const deactivationProfile =
  resolveMainWireVentricularLandStrongBridgeDeactivationExitProfileV1(
    deactivationProfileId,
  );
const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const twitchRetentionCandidateId = twitchRetentionCandidateArgument();

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
          twitchRetentionCandidateId,
          context.circulatoryLoadPointId,
          context.stressedVenousVolumePointId,
          context.trefForceLoadProfileId,
          CANDIDATE.sourceVelocityDistortionProfileId,
          deactivationProfileId,
        ),
    }));
const envelope =
  measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1(
    runs,
    twitchRetentionCandidateId,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_STRONG_BRIDGE_DEACTIVATION_EXIT_COMBINED_LOAD_ENVELOPE_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidate: Object.freeze({
      ...CANDIDATE,
      twitchRetentionCandidateId,
    }),
    deactivationProfile,
    deactivationClaim:
      MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    macroHemodynamicRecalibrationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
  }),
  exactIdentities: Object.freeze(runs.map(({ contextId, run }) =>
    Object.freeze({
      contextId,
      protocolIdentityHash: run.periodicResult.protocolIdentityHash,
      protocolComponentHashes: run.periodicResult.protocolComponentHashes,
      runnerClaim: run.claim,
    }))),
  envelope,
  interpretationBoundary: Object.freeze({
    mechanismIsReducedOrderHypothesisNotLand2017SourceEquation: true as const,
    strictExternalIntervalsUsedAsFalsificationNotFitTargets: true as const,
    factorialEffectsDescribeOnlyTheSpecifiedCornerDomain: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    clinicalValidationEstablished: false as const,
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
    deactivationProfile,
    ranges: envelope.ranges,
    diastolicRanges: envelope.diastolicRanges,
    strictExternalIntervalMatchCounts:
      envelope.strictExternalIntervalMatchCounts,
    strictFailureContextIds: envelope.strictFailureContextIds,
    allRunsPeriod1AndIntegrated: envelope.allRunsPeriod1AndIntegrated,
    morphologyPreservedAcrossEnvelope:
      envelope.morphologyPreservedAcrossEnvelope,
    allGradientAndVelocityIntervalsMatched:
      envelope.allGradientAndVelocityIntervalsMatched,
    arms: envelope.arms.map((arm) => ({
      contextId: arm.context.contextId,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.coreMetrics.ejectionTimeSec * 1000,
      strokeVolumeMl: arm.coreMetrics.aorticForwardVolumeMl,
      peakVelocityMPerSec:
        arm.coreMetrics.peakVenaContractaVelocityMPerSec,
      meanGradientMmHg: arm.coreMetrics.meanDopplerGradientMmHg,
      peakGradientMmHg: arm.coreMetrics.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.coreMetrics.meanAorticPressureMmHg,
      leftVentricularEjectionFraction01:
        arm.coreMetrics.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      strictExternalIntervalFailures:
        arm.strictExternalIntervalFailures,
      diastolicMetrics: arm.diastolicMetrics,
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
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function numericArgument(name: string, fallback: number): number {
  const raw = optionalArgument(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}

function deactivationProfileArgument():
  MainWireVentricularLandStrongBridgeDeactivationExitProfileIdV1 {
  const value = optionalArgument("--profile")
    ?? "strong-to-blocked-deactivation-thirty-per-sec-directional-gate";
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_STRONG_BRIDGE_DEACTIVATION_EXIT_PROFILE_IDS_V1
      .find((profileId) => profileId === value);
  if (resolved === undefined) {
    throw new Error(`unsupported --profile: ${value}`);
  }
  return resolved;
}

function twitchRetentionCandidateArgument():
  MainWireVentricularLandSourceTwitchRetentionCandidateIdV1 {
  const value = optionalArgument("--twitch-candidate");
  if (value === null) return CANDIDATE.twitchRetentionCandidateId;
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1
      .find((candidateId) => candidateId === value);
  if (resolved === undefined) {
    throw new Error(`unsupported --twitch-candidate: ${value}`);
  }
  return resolved;
}
