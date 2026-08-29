import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_ANALYSIS_CLAIM_V1,
  measureMainWireAorticOutflowEjectionTimingRefinementV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowEjectionTimingRefinementV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_V1_ID,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowEjectionTimingRefinementV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingRefinementResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CLAIM_V1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRefinementCandidatesV1";

const dtSec = numericArgument("--dt", 0.001);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1.flatMap(
    (contextId) =>
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1.map(
        (candidateId) =>
          runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingRefinementResearchV1(
            { dtSec, maximumBeatCount },
            candidateId,
            contextId,
          ),
      ),
  );
const refinement = measureMainWireAorticOutflowEjectionTimingRefinementV1(
  runs.map((run) => Object.freeze({
    candidateId: run.candidate.candidateId,
    contextId: run.context.contextId,
    periodicResult: run.periodicResult,
  })),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CANDIDATE_IDS_V1,
    contextOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CONTEXT_IDS_V1,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_CLAIM_V1,
    materialClaim: MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_EJECTION_TIMING_REFINEMENT_ANALYSIS_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(runs.map((run) => Object.freeze({
    candidateId: run.candidate.candidateId,
    contextId: run.context.contextId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
  }))),
  refinement,
  interpretationBoundary: Object.freeze({
    loadedShorteningSourceValidationEstablished: false as const,
    accelerationTimeNormalized: false as const,
    fullLoadEnvelopeRequiredForPreferredCandidate: true as const,
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
    allProtocolIdentitiesDistinct: refinement.allProtocolIdentitiesDistinct,
    etFirstDecision: refinement.etFirstDecision,
    candidateSummaries: refinement.candidateSummaries.map((summary) => ({
      candidateId: summary.candidate.candidateId,
      aeffScale: summary.candidate.aeffScaleFromBaseline,
      phiScale: summary.candidate.phiScaleFromBaseline,
      distortionSteadyGainScale:
        summary.candidate.distortionSteadyGainScaleFromBaseline,
      twitchTimingCandidateId: summary.candidate.twitchTimingCandidateId,
      minimumEjectionTimeMs: summary.minimumEjectionTimeSec * 1000,
      maximumEjectionTimeMs: summary.maximumEjectionTimeSec * 1000,
      isometricTensionTimeToPeakMs:
        summary.isometricAtSourceRestingStretch.activeTwitch.timeToPeakSec
        * 1000,
      isometricTensionRelaxationTime50Ms:
        summary.isometricAtSourceRestingStretch.activeTwitch
          .relaxationTime50Sec! * 1000,
      isometricTensionRelaxationTime95Ms:
        summary.isometricAtSourceRestingStretch.activeTwitch
          .relaxationTime95Sec! * 1000,
      maximumRelativeStrokeVolumeChange:
        summary.maximumAbsoluteRelativeAorticForwardVolumeChangeFromContextCanonical,
      maximumRelativeMeanAorticPressureChange:
        summary.maximumAbsoluteRelativeMeanAorticPressureChangeFromContextCanonical,
      etFirstSelectionPassed: summary.etFirstSelectionPassed,
      accelerationTimeWithinReferenceAtBothContexts:
        summary.accelerationTimeWithinReferenceAtBothContexts,
    })),
    arms: refinement.arms.map((arm) => ({
      contextId: arm.context.contextId,
      candidateId: arm.candidate.candidateId,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
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
