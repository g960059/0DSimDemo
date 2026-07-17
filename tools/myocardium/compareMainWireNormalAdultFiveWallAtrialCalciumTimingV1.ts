import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallAtrialCalciumTimingComparisonV1";
import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

const canonicalPath = requiredArgument("--canonical");
const challengerPath = requiredArgument("--challenger");
const outputPath = optionalArgument("--output");
const comparison = compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
  readSummary(canonicalPath),
  readSummary(challengerPath),
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
    interpretable: comparison.interpretable,
    interpretabilityReasons: comparison.interpretabilityReasons,
    pairing: comparison.pairing,
    metrics: comparison.metrics,
    topology: comparison.topology,
    directionReadback: comparison.directionReadback,
    claim: comparison.claim,
  }, null, 2)}\n`);
}

function readSummary(
  inputPath: string,
): MainWireNormalAdultFiveWallPeriodicSummaryV1 {
  return JSON.parse(readFileSync(inputPath, "utf8")) as
    MainWireNormalAdultFiveWallPeriodicSummaryV1;
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
