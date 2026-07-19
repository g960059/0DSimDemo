import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2,
  runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
    .defaultMaximumBeatCount,
);
const retainedBoundaryCount = integerArgument(
  "--retain",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
    .defaultRetainedBoundaryCount,
);
const requirePeriod1 = process.argv.includes("--require-p1");
const result = await runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2({
  dtSec,
  maximumBeatCount,
  retainedBoundaryCount,
});
const latest = result.observations.at(-1) ?? null;
const latestPeriod1 = latest?.period1 ?? null;
const groupMaximum = latestPeriod1 === null
  ? null
  : Object.freeze(Object.fromEntries(Object.entries(latestPeriod1.groups)
    .map(([group, report]) => [group, report.maximumNormalizedDelta])));

process.stdout.write(`${JSON.stringify(Object.freeze({
  experimentId: result.experimentId,
  claim: result.claim,
  protocolIdentityHash: result.protocolIdentityHash,
  dtSec: result.dtSec,
  cycleLengthSec: result.cycleLengthSec,
  stepsPerBeat: result.stepsPerBeat,
  completedBeatCount: result.completedBeatCount,
  attemptedStepCount: result.attemptedStepCount,
  committedStepCount: result.committedStepCount,
  requirePeriod1,
  terminationReason: result.terminationReason,
  integrationCompletedWithoutFailure:
    result.integrationCompletedWithoutFailure,
  periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
  period2OrbitSuspected: result.period2OrbitSuspected,
  classification: result.classification,
  latestPeriod1MaximumNormalizedDelta:
    latest?.period1?.overall.maximumNormalizedDelta ?? null,
  latestPeriod1WorstGroup: latest?.period1?.overall.worstGroup ?? null,
  latestPeriod1WorstPath: latest?.period1?.overall.worstPath ?? null,
  latestPeriod1MaximumNormalizedDeltaByGroup: groupMaximum,
  latestPeriod2MaximumNormalizedDelta:
    latest?.period2?.overall.maximumNormalizedDelta ?? null,
  terminalAcceptedTimeSec: result.terminalState.acceptedTimeSec,
  terminalRevision: result.terminalState.revision,
  terminalFixedGlobalTotalBloodVolumeMl:
    result.terminalState.fixedGlobalTotalBloodVolumeMl,
  retainedBoundaryBeatIndices:
    result.retainedBoundaries.map((boundary) => boundary.beatIndex),
  performance: result.performance,
  failure: result.failure,
}), null, 2)}\n`);

if (!result.integrationCompletedWithoutFailure
    || (requirePeriod1 && !result.periodicSteadyStateClaimed)) {
  process.exitCode = 1;
}

function numericArgument(name: string, fallback: number): number {
  const value = argumentValue(name);
  const parsed = value === null ? fallback : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be positive and finite`);
  }
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const parsed = numericArgument(name, fallback);
  if (!Number.isInteger(parsed)) throw new Error(`${name} must be an integer`);
  return parsed;
}

function argumentValue(name: string): string | null {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}
