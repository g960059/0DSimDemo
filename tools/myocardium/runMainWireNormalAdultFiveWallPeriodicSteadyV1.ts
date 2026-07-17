import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallPeriodicInitializationV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireNormalAdultLaSlsModeV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  FiveWallNormalCalciumDrivePriorVariantV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

const dtSec = numberArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--max-beats", 32);
const laSlsMode = argument("--la-sls", "on") as
  MainWireNormalAdultLaSlsModeV1;
const initialization = argument("--init", "canonical") as
  MainWireNormalAdultFiveWallPeriodicInitializationV1;
const calciumDrivePriorVariant = argument(
  "--calcium-prior",
  "land-atrial-twitch-output",
) as FiveWallNormalCalciumDrivePriorVariantV1;
const outputPath = argument(
  "--output",
  path.resolve(
    "data/myocardium/protocols",
    `mainwire-normal-adult-five-wall-periodic-${initialization}-v1.json`,
  ),
);

const result = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
  dtSec,
  maximumBeatCount,
  laSlsMode,
  initialization,
  calciumDrivePriorVariant,
});
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

const latestClosure = result.beatClosure.at(-1) ?? null;
process.stdout.write(`${JSON.stringify({
  outputPath,
  initialization: result.initialization,
  laSlsMode: result.laSlsMode,
  calciumDrivePriorVariant: result.calciumDrivePriorVariant,
  calciumParameterSetId:
    result.protocolIdentity.calciumDrive.parameterSetId,
  dtSec: result.dtSec,
  requestedMaximumBeatCount: result.requestedMaximumBeatCount,
  completedBeatCount: result.completedBeatCount,
  terminationReason: result.terminationReason,
  periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
  period2OrbitSuspected: result.period2OrbitSuspected,
  retainedBeatIndices: result.retainedCompleteBeats.map((beat) =>
    beat.beatIndex),
  initializationAudit: result.initializationAudit,
  latestClosure: latestClosure === null ? null : {
    beatIndex: latestClosure.beatIndex,
    period1MaximumNormalizedDelta:
      latestClosure.period1?.overall.maximumNormalizedDelta ?? null,
    period1WorstPath: latestClosure.period1?.overall.worstPath ?? null,
    period2MaximumNormalizedDelta:
      latestClosure.period2?.overall.maximumNormalizedDelta ?? null,
    period2WorstPath: latestClosure.period2?.overall.worstPath ?? null,
  },
  failure: result.failure,
}, null, 2)}\n`);

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function numberArgument(name: string, fallback: number): number {
  const value = Number(argument(name, String(fallback)));
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const value = numberArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}
