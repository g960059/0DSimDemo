import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV9";
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
        ),
    }));
const envelope =
  measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1(runs);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    contextOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
        .map((context) => context.contextId),
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
    candidate: CANDIDATE,
    candidateClaim: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9_CLAIM,
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
    strictExternalIntervalsUsedAsFalsificationNotFitTargets: true as const,
    factorialEffectsDescribeOnlyTheSpecifiedCornerDomain: true as const,
    TrefAxisIsCompletePhysiologicalInotropyModel: false as const,
    macroHemodynamicRecalibrationApplied: false as const,
    clinicalValidationEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
  }),
});
const serialized = JSON.stringify(report, null, 2) + "\n";

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  const rankedEjectionTimeTerms = [...envelope.factorialTerms]
    .sort((left, right) => Math.abs(
      right.metrics.ejectionTimeSec.orthogonalEffect,
    ) - Math.abs(left.metrics.ejectionTimeSec.orthogonalEffect))
    .map((term) => Object.freeze({
      termId: term.termId,
      order: term.order,
      effectMs: term.metrics.ejectionTimeSec.orthogonalEffect * 1000,
      effectFractionOfGrandMean:
        term.metrics.ejectionTimeSec.orthogonalEffectFractionOfGrandMean,
    }));
  process.stdout.write(JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    ranges: envelope.ranges,
    diastolicRanges: envelope.diastolicRanges,
    strictExternalIntervalMatchCounts:
      envelope.strictExternalIntervalMatchCounts,
    strictFailureContextIds: envelope.strictFailureContextIds,
    allRunsPeriod1AndIntegrated: envelope.allRunsPeriod1AndIntegrated,
    morphologyPreservedAcrossEnvelope:
      envelope.morphologyPreservedAcrossEnvelope,
    strictSampleLocalMaximumMorphologyPreservedAcrossEnvelope:
      envelope.strictSampleLocalMaximumMorphologyPreservedAcrossEnvelope,
    distinctPeakMorphologyPreservedAcrossEnvelope:
      envelope.distinctPeakMorphologyPreservedAcrossEnvelope,
    maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum:
      envelope
        .maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum,
    allDiastolicFlowReadbacksAvailable:
      envelope.allDiastolicFlowReadbacksAvailable,
    allProtocolIdentitiesDistinct: envelope.allProtocolIdentitiesDistinct,
    allGradientAndVelocityIntervalsMatched:
      envelope.allGradientAndVelocityIntervalsMatched,
    maximumAbsoluteFactorialReconstructionResidual:
      envelope.maximumAbsoluteFactorialReconstructionResidual,
    rankedEjectionTimeTerms,
    arms: envelope.arms.map((arm) => ({
      contextId: arm.context.contextId,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.coreMetrics.ejectionTimeSec * 1000,
      accelerationTimeMs: arm.coreMetrics.accelerationTimeSec * 1000,
      aorticForwardVolumeMl: arm.coreMetrics.aorticForwardVolumeMl,
      forwardFlowContinuityEquivalentEoaCm2:
        arm.coreMetrics.forwardFlowContinuityEquivalentEoaCm2,
      meanGradientEquivalentEoaCm2:
        arm.coreMetrics.meanGradientEquivalentEoaCm2,
      peakVenaContractaVelocityMPerSec:
        arm.coreMetrics.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg:
        arm.coreMetrics.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg:
        arm.coreMetrics.peakDopplerGradientMmHg,
      meanAorticPressureMmHg:
        arm.coreMetrics.meanAorticPressureMmHg,
      leftVentricularEjectionFraction01:
        arm.coreMetrics.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      distinctFlowPeakCount:
        arm.cycle.aorticFlowDistinctPeakCountAboveFivePercent,
      maximumSecondaryFlowPeakProminenceFractionOfGlobalMaximum:
        arm.cycle
          .maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum,
      strictExternalIntervalFailures:
        arm.strictExternalIntervalFailures,
      diastolicMetrics: arm.diastolicMetrics,
    })),
  }) + "\n");
}

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(name + "="));
  if (equalsArgument !== undefined) {
    const value = equalsArgument.slice(name.length + 1);
    if (value === "") throw new Error(name + " requires a value");
    return value;
  }
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(name + " requires a value");
  }
  return value;
}

function numericArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!(parsed > 0) || !Number.isFinite(parsed)) {
    throw new Error(name + " must be positive and finite");
  }
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(name + " must be an integer");
  return value;
}
