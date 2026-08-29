import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  measureMainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_V1_ID,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingCandidateLoadResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1.flatMap(
    (contextId) =>
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1.map(
        (candidateId) =>
          runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingCandidateLoadResearchV1(
            { dtSec, maximumBeatCount },
            candidateId,
            contextId,
          ),
      ),
  );
const envelope =
  measureMainWireAorticOutflowEjectionTimingCandidateLoadEnvelopeV1(
    runs.map((run) => Object.freeze({
      candidateId: run.candidate.candidateId,
      contextId: run.context.contextId,
      periodicResult: run.periodicResult,
    })),
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_IDS_V1,
    loadContextOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_LOAD_CONTEXT_IDS_V1,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_CANDIDATE_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(runs.map((run) => Object.freeze({
    candidateId: run.candidate.candidateId,
    contextId: run.context.contextId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
  }))),
  resolvedRuns: Object.freeze(runs.map((run) => Object.freeze({
    candidate: run.candidate,
    context: run.context,
    materialPoint: run.materialPoint,
    circulatoryLoadPoint: run.circulatoryLoadPoint,
    stressedVenousVolumePoint: run.stressedVenousVolumePoint,
    runnerClaim: run.claim,
  }))),
  envelope,
  interpretationBoundary: Object.freeze({
    sourceAeffRecalibrationEstablished: false as const,
    loadedShorteningValidationEstablished: false as const,
    accelerationTimeNormalized: false as const,
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
    allProtocolIdentitiesDistinct: envelope.allProtocolIdentitiesDistinct,
    candidateEnvelope: envelope.candidateEnvelope,
    arms: envelope.arms.map((arm) => ({
      contextId: arm.context.contextId,
      candidateId: arm.candidate.candidateId,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      meanRightAtrialPressureMmHg:
        arm.meanRightAtrialAbsolutePressureMmHg,
      meanLeftAtrialPressureMmHg:
        arm.meanLeftAtrialAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      lvfwActiveStressDistinctPeakCount:
        arm.lvfwActiveStressDistinctPeakCountAboveFivePercent,
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
