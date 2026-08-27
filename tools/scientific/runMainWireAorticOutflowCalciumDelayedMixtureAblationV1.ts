import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticOutflowCalciumDelayedMixtureV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumDelayedMixtureComparisonV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-calcium-delayed-mixture-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const canonical =
  runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
    { dtSec, maximumBeatCount },
    "canonical",
  );
const delayedMixtureRuns =
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1.map(
    (profileId) =>
      runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1(
        { dtSec, maximumBeatCount },
        profileId,
      ),
  );
const comparison = compareMainWireAorticOutflowCalciumDelayedMixtureV1(
  canonical.periodicResult,
  delayedMixtureRuns.map((run) => Object.freeze({
    profileId: run.profile.profileId,
    periodicResult: run.periodicResult,
  })),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    ablationClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  exactIdentities: Object.freeze({
    canonicalProtocolIdentityHash:
      canonical.periodicResult.protocolIdentityHash,
    canonicalCalciumDriveStableHash:
      canonical.periodicResult.protocolComponentHashes
        .calciumDriveFixedParamsStableHash,
    delayedMixtureProtocolIdentityHashes: Object.freeze(Object.fromEntries(
      delayedMixtureRuns.map((run) => [
        run.profile.profileId,
        run.periodicResult.protocolIdentityHash,
      ]),
    )),
    delayedMixtureCalciumDriveStableHashes: Object.freeze(Object.fromEntries(
      delayedMixtureRuns.map((run) => [
        run.profile.profileId,
        run.periodicResult.protocolComponentHashes
          .calciumDriveFixedParamsStableHash,
      ]),
    )),
  }),
  resolvedCandidates: Object.freeze(delayedMixtureRuns.map((run) =>
    Object.freeze({
      profile: run.profile,
      calciumDriveParams: run.calciumDriveParams,
      runnerClaim: run.claim,
    }))),
  comparison,
  interpretationBoundary: Object.freeze({
    physiologicalAcceptanceEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    referenceContextIsClinicalPassFail: false as const,
    pressureFlowProxyIsClinicalWia: false as const,
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
    canonicalTerminationReason:
      report.comparison.canonical.cycle.terminationReason,
    candidates: report.comparison.delayedMixtures.map((arm) => ({
      profileId: arm.profile!.profileId,
      terminationReason: arm.cycle.terminationReason,
      retainedDirectionalCandidate:
        arm.candidateScreen!.retainedDirectionalCandidate,
      morphologyPreserved:
        arm.morphologyScreen!.morphologyPreserved,
      retainedMorphologySafeDirectionalCandidate:
        arm.morphologyScreen!.retainedMorphologySafeDirectionalCandidate,
      referenceNormalizedCandidate:
        arm.morphologyScreen!.referenceNormalizedMorphologySafeCandidate,
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
