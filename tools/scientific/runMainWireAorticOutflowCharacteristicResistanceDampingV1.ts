import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_ANALYSIS_CLAIM_V1,
  measureMainWireAorticOutflowCharacteristicResistanceDampingV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCharacteristicResistanceDampingV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_PLACEMENT_PROFILE_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_V1_ID,
  resolveMainWireAorticOutflowCharacteristicResistanceDampingContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowCharacteristicResistanceDampingV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V8 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V8_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV8";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const dtSec = numericArgument("--dt", 0.0005);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const inputs =
  MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_PLACEMENT_PROFILE_IDS_V1
    .flatMap((placementProfileId) =>
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CONTEXT_IDS_V1
        .map((contextId) => {
          const context =
            resolveMainWireAorticOutflowCharacteristicResistanceDampingContextV1(
              contextId,
            );
          const run =
            runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
              { dtSec, maximumBeatCount },
              CANDIDATE.kuwProfileId,
              context.complianceProfileId,
              placementProfileId,
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
            );
          return Object.freeze({ contextId, placementProfileId, run });
        }));

const analysis =
  measureMainWireAorticOutflowCharacteristicResistanceDampingV1(inputs);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidate: CANDIDATE,
    candidateClaim: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V8_CLAIM,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_ANALYSIS_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(inputs.map((input) => Object.freeze({
    contextId: input.contextId,
    placementProfileId: input.placementProfileId,
    protocolIdentityHash: input.run.periodicResult.protocolIdentityHash,
    protocolComponentHashes:
      input.run.periodicResult.protocolComponentHashes,
  }))),
  analysis,
  interpretationBoundary: Object.freeze({
    localLinearExchangeModeProxyIsFullClosedLoopPoleAnalysis: false as const,
    limitingContextsAreIndependentValidationCohort: false as const,
    fullCombinedLoadEnvelopeStillRequired: true as const,
    parameterOptimizationOrFitting: false as const,
    clinicalValidationClaimed: false as const,
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
  process.stdout.write(JSON.stringify({
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_CHARACTERISTIC_RESISTANCE_DAMPING_V1_ID,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    allProtocolIdentitiesDistinct: analysis.allProtocolIdentitiesDistinct,
    allResistanceSumsPreservedWithinRoundoff:
      analysis.allResistanceSumsPreservedWithinRoundoff,
    allUpstreamProfileExposesDistinctSecondaryPeak:
      analysis.allUpstreamProfileExposesDistinctSecondaryPeak,
    land2017ProfileIsStrictSinglePeakAcrossLimitingContexts:
      analysis.land2017ProfileIsStrictSinglePeakAcrossLimitingContexts,
    land2017ProfileIsDistinctSinglePeakAcrossLimitingContexts:
      analysis.land2017ProfileIsDistinctSinglePeakAcrossLimitingContexts,
    placementSummaries: analysis.placementSummaries,
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
