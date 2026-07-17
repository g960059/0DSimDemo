import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireNormalAdultFiveWallDtHalvingV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallDtHalvingV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const coarsePath = requiredArgument("--coarse");
const finePath = requiredArgument("--fine");
const outputPath = optionalArgument("--output");
const comparison = compareMainWireNormalAdultFiveWallDtHalvingV1(
  readResult(coarsePath),
  readResult(finePath),
);
const json = `${JSON.stringify(comparison, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(json);
} else {
  const resolvedOutput = path.resolve(outputPath);
  mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  writeFileSync(resolvedOutput, json);
  process.stdout.write(`${JSON.stringify({
    outputPath: resolvedOutput,
    coarseDtSec: comparison.coarseDtSec,
    fineDtSec: comparison.fineDtSec,
    bothPeriod1Converged: comparison.bothPeriod1Converged,
    interpretable: comparison.interpretable,
    interpretabilityReasons: comparison.interpretabilityReasons,
    signalMetrics: comparison.signalMetrics,
    claim: comparison.claim,
  }, null, 2)}\n`);
}

function readResult(
  inputPath: string,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  return JSON.parse(readFileSync(inputPath, "utf8")) as
    MainWireNormalAdultFiveWallPeriodicResultV1;
}

function requiredArgument(name: string): string {
  const value = optionalArgument(name);
  if (value === null) throw new Error(`${name} is required`);
  return value;
}

function optionalArgument(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
