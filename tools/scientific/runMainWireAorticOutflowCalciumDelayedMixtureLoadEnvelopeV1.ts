import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
  measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-calcium-delayed-mixture-load-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1.map(
    (loadPointId) => Object.freeze({
      loadPointId,
      canonicalResult:
        runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
          { dtSec, maximumBeatCount },
          loadPointId,
        ),
      candidateRun:
        runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchV1(
          { dtSec, maximumBeatCount },
          MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
          loadPointId,
        ),
    }),
  );
const envelope =
  measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1(
    runs.map((run) => Object.freeze({
      loadPointId: run.loadPointId,
      canonicalResult: run.canonicalResult,
      candidateResult: run.candidateRun.periodicResult,
    })),
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profileId:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
    loadPointOrder:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1,
    independentCanonicalColdStartPerArm: true as const,
    outcomeInformedProfileSelection: true as const,
    numericParameterFittingOrOptimization: false as const,
  }),
  exactIdentities: Object.freeze(runs.map((run) => Object.freeze({
    loadPointId: run.loadPointId,
    canonicalProtocolIdentityHash: run.canonicalResult.protocolIdentityHash,
    candidateProtocolIdentityHash:
      run.candidateRun.periodicResult.protocolIdentityHash,
    candidateRunnerClaim: run.candidateRun.claim,
  }))),
  envelope,
  interpretationBoundary: Object.freeze({
    physiologicalAcceptanceEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    loadEnvelopeIsClinicalValidation: false as const,
    referenceContextIsClinicalPassFail: false as const,
    dtRefinementRequiredBeforeAdoption: true as const,
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
    allRunsPeriod1AndIntegrated: envelope.allRunsPeriod1AndIntegrated,
    morphologyPreservedAcrossEnvelope:
      envelope.morphologyPreservedAcrossEnvelope,
    morphologySafeDirectionalCandidateAcrossEnvelope:
      envelope.morphologySafeDirectionalCandidateAcrossEnvelope,
    referenceNormalizedAcrossEnvelope:
      envelope.referenceNormalizedAcrossEnvelope,
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
