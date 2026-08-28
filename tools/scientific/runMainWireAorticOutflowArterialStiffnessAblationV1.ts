import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1,
  measureMainWireAorticOutflowArterialStiffnessAblationV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-arterial-stiffness-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs = MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1.map(
  (pointId) => Object.freeze({
    pointId,
    periodicResult:
      runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
        { dtSec, maximumBeatCount },
        pointId,
      ),
  }),
);
const ablation = measureMainWireAorticOutflowArterialStiffnessAblationV1(runs);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    pointOrder: MAIN_WIRE_AORTIC_OUTFLOW_ARTERIAL_STIFFNESS_POINT_IDS_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveBracket: false as const,
  }),
  exactIdentities: Object.freeze(runs.map((run) => Object.freeze({
    pointId: run.pointId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    circulationRuntimeStableHash:
      run.periodicResult.protocolComponentHashes.circulationRuntimeStableHash,
  }))),
  ablation,
  interpretationBoundary: Object.freeze({
    globalArterialStiffnessIsProximalAorticCompliance: false as const,
    localAreaComplianceComparedDirectly: false as const,
    anatomicalSupportLengthRequiredForLocalAreaCompliance: true as const,
    physiologicalAcceptanceEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
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
    allRunsPeriod1AndIntegrated: ablation.allRunsPeriod1AndIntegrated,
    peakGradientStrictlyDecreasesWithStiffness:
      ablation.peakGradientStrictlyDecreasesWithStiffness,
    peakFlowStrictlyDecreasesWithStiffness:
      ablation.peakFlowStrictlyDecreasesWithStiffness,
    ejectionTimeStrictlyIncreasesWithStiffness:
      ablation.ejectionTimeStrictlyIncreasesWithStiffness,
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
