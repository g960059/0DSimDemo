import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runMainWireNormalAdultFiveWallDtHalvingV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallDtHalvingV1";
import type {
  MainWireNormalAdultFiveWallPeriodicInitializationV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireNormalAdultLaSlsModeV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

const coarseDtSec = numberArgument("--coarse-dt", 0.004);
const maximumBeatCount = integerArgument("--max-beats", 32);
const laSlsMode = argument("--la-sls", "on") as
  MainWireNormalAdultLaSlsModeV1;
const initialization = argument("--init", "canonical") as
  MainWireNormalAdultFiveWallPeriodicInitializationV1;
const outputPath = argument(
  "--output",
  path.resolve(
    "data/myocardium/protocols",
    `mainwire-normal-adult-five-wall-dt-halving-${initialization}-v1.json`,
  ),
);

const result = runMainWireNormalAdultFiveWallDtHalvingV1({
  coarseDtSec,
  maximumBeatCount,
  laSlsMode,
  initialization,
});
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  outputPath,
  coarseDtSec: result.coarse.dtSec,
  fineDtSec: result.fine.dtSec,
  maximumBeatCount,
  laSlsMode,
  initialization,
  coarseTerminationReason: result.coarse.terminationReason,
  fineTerminationReason: result.fine.terminationReason,
  interpretable: result.comparison.interpretable,
  interpretabilityReasons: result.comparison.interpretabilityReasons,
  signalMetrics: result.comparison.signalMetrics,
  claim: result.comparison.claim,
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
