import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runMainWireNormalAdultFiveWallClosedLoopV1,
  type MainWireNormalAdultFiveWallExperimentModeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireNormalAdultLaSlsModeV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

const mode = argument("--mode", "canonical") as
  MainWireNormalAdultFiveWallExperimentModeV1;
const laSlsMode = argument("--la-sls", "on") as MainWireNormalAdultLaSlsModeV1;
const beatCount = integerArgument("--beats", 1);
const dtSec = numberArgument("--dt", 0.005);
const outputPath = argument(
  "--output",
  path.resolve(
    "data/myocardium/protocols",
    `mainwire-normal-adult-five-wall-${mode}-v1.json`,
  ),
);

const result = runMainWireNormalAdultFiveWallClosedLoopV1({
  mode,
  laSlsMode,
  beatCount,
  dtSec,
});
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

const finalClosure = result.beatClosure.at(-1) ?? null;
process.stdout.write(`${JSON.stringify({
  outputPath,
  mode: result.mode,
  laSlsMode: result.laSlsMode,
  completed: result.completed,
  completedBeatCount: result.completedBeatCount,
  sampleCount: result.samples.length,
  failure: result.failure,
  finalClosure,
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
