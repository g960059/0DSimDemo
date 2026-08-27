import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticOutflowDriverRootAblationV1,
  type MainWireAorticOutflowDriverRootArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowDriverRootComparisonV1";
import {
  compareMainWireAorticValveAblationV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import {
  replayMainWireAorticValveLocalInertanceV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveLocalInertanceReplayV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDriverRootAblationV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticValveLocalInertanceResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1,
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-driver-root-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs = MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1.map(
  (armId) => runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
    { dtSec, maximumBeatCount },
    armId,
  ),
);
const comparisonInputs: MainWireAorticOutflowDriverRootArmInputV1[] =
  runs.map((run) => ({
    armId: run.arm.armId,
    periodicResult: run.periodicResult,
  }));
const comparison =
  compareMainWireAorticOutflowDriverRootAblationV1(comparisonInputs);
const localAorticValveInertanceReplay =
  replayMainWireAorticValveLocalInertanceV1(runs[0]!.periodicResult);
const coupledLocalAorticValveInertanceRun =
  runMainWireNormalAdultFiveWallAorticValveLocalInertanceResearchV1({
    dtSec,
    maximumBeatCount,
  });
const coupledLocalAorticValveInertanceComparison =
  compareMainWireAorticValveAblationV1([
    {
      armId: "canonical",
      periodicResult: runs[0]!.periodicResult,
    },
    {
      armId: "historical-topology-local-inertance",
      periodicResult: coupledLocalAorticValveInertanceRun.periodicResult,
    },
  ]);
const systemicResistanceRuns = ([
  "systemic-resistance-low",
  "systemic-resistance-high",
] as const).map((pointId) => ({
  point: resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(pointId),
  periodicResult: runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
    { dtSec, maximumBeatCount },
    pointId,
  ),
}));
const systemicResistanceContext = Object.freeze([
  Object.freeze({
    point: resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1("baseline"),
    periodicResult: runs[0]!.periodicResult,
  }),
  ...systemicResistanceRuns,
].map(({ point, periodicResult }) => Object.freeze({
  point,
  exactProtocolIdentityHash: periodicResult.protocolIdentityHash,
  outcome: Object.freeze({
    terminationReason: periodicResult.terminationReason,
    periodicSteadyStateClaimed: periodicResult.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      periodicResult.integrationCompletedWithoutFailure,
  }),
  aorticValve:
    measureMainWireValveDiseaseCycleMetricsV1(periodicResult).valves.AoV,
  hemodynamics:
    summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(periodicResult)
      .hemodynamics,
})));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder: MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_ARM_IDS_V1,
    ablationClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_DRIVER_ROOT_ABLATION_CLAIM_V1,
  }),
  exactProtocolIdentityHashes: Object.freeze(Object.fromEntries(
    runs.map((run) => [
      run.arm.armId,
      run.periodicResult.protocolIdentityHash,
    ]),
  )),
  resolvedArms: Object.freeze(runs.map((run) => Object.freeze({
    arm: run.arm,
    materialPoint: run.materialPoint,
    aorticRootInertanceProfile: run.aorticRootInertanceProfile,
    claim: run.claim,
  }))),
  comparison,
  localAorticValveInertanceReplay,
  coupledLocalAorticValveInertance: Object.freeze({
    profile: coupledLocalAorticValveInertanceRun.profile,
    exactProtocolIdentityHash:
      coupledLocalAorticValveInertanceRun.periodicResult.protocolIdentityHash,
    externalFlowStateAudit:
      coupledLocalAorticValveInertanceRun.externalFlowStateAudit,
    runnerClaim: coupledLocalAorticValveInertanceRun.claim,
    comparison: coupledLocalAorticValveInertanceComparison,
  }),
  systemicResistanceContext,
  interpretation: Object.freeze({
    physiologicalAcceptanceEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    localAorticValveInertanceTestedInThisExperiment: true as const,
    localAorticValveStateAdded: false as const,
    dtRefinementRequiredBeforeAdoption: true as const,
    pressureRecoveryExperimentMustRemainPressureStationSeparated: true as const,
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
