import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticValveAblationV1,
  type MainWireAorticValveAblationArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticValveResearchProfileV1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";

export const MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_EXPERIMENT_V1_ID =
  "main-wire-aortic-valve-pressure-recovery-opening-ablation-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
  dtSec,
  maximumBeatCount,
  laSlsMode: "on",
  pericardiumMode: "on",
  pericardiumCase: "healthy-slack",
  initialization: "canonical",
  valveDiseaseBracketIds: Object.freeze([]),
});
const armInputs: MainWireAorticValveAblationArmInputV1[] = [{
  armId: "canonical",
  periodicResult: canonical,
}];
const profileRuns = MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1.map(
  (profileId) => {
    const run = runMainWireNormalAdultFiveWallAorticValveResearchProfileV1(
      { dtSec, maximumBeatCount },
      profileId,
    );
    armInputs.push({ armId: profileId, periodicResult: run.periodicResult });
    return run;
  },
);
const comparison = compareMainWireAorticValveAblationV1(armInputs);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_VALVE_PRESSURE_RECOVERY_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    independentCanonicalColdStartPerArm: true as const,
    normalValveAreaInputOnly: true as const,
    pressureRecoveryRootDiameterCm: 3 as const,
    parameterSearchOrFitting: false as const,
    armOrder: Object.freeze(armInputs.map(({ armId }) => armId)),
  }),
  exactProtocolIdentityHashes: Object.freeze(Object.fromEntries(
    armInputs.map(({ armId, periodicResult }) => [
      armId,
      periodicResult.protocolIdentityHash,
    ]),
  )),
  profiles: Object.freeze(profileRuns.map(({ profile }) => profile)),
  comparison,
  interpretation: Object.freeze({
    physiologicalAcceptanceEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    pressureStationSeparationRequired: true as const,
    dtRefinementRequiredBeforeAdoption: true as const,
    loadEnvelopeRequiredBeforeAdoption: true as const,
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
      armId: arm.armId,
      terminationReason: arm.terminationReason,
      periodicSteadyStateClaimed: arm.periodicSteadyStateClaimed,
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
