import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticOutflowCalciumWaveformV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumWaveformAblationV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-calcium-waveform-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs = MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1.map(
  (profileId) =>
    runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
      { dtSec, maximumBeatCount },
      profileId,
    ),
);
const comparison = compareMainWireAorticOutflowCalciumWaveformV1(
  runs.map((run) => Object.freeze({
    profileId: run.profile.profileId,
    periodicResult: run.periodicResult,
  })),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_WAVEFORM_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profileOrder: MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1,
    ablationClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  resolvedArms: Object.freeze(runs.map((run) => Object.freeze({
    profile: run.profile,
    calciumDriveParams: run.calciumDriveParams,
    exactProtocolIdentityHash: run.periodicResult.protocolIdentityHash,
    exactProtocolComponentHashes: run.periodicResult.protocolComponentHashes,
    runnerClaim: run.claim,
  }))),
  comparison,
  interpretationBoundary: Object.freeze({
    physiologicalAcceptanceEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    referenceContextIsClinicalPassFail: false as const,
    pressureStationDifferencePreserved: true as const,
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
    arms: report.comparison.arms.map((arm) => ({
      profileId: arm.profileId,
      terminationReason: arm.terminationReason,
      retainedDirectionalCandidate:
        arm.candidateScreen?.retainedDirectionalCandidate ?? null,
      referenceNormalizedCandidate:
        arm.candidateScreen?.referenceNormalizedCandidate ?? null,
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
