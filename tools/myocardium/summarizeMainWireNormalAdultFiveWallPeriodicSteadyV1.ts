import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const inputPath = requiredArgument("--input");
const outputPath = optionalArgument("--output");
const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallPeriodicResultV1;
const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result);
const json = `${JSON.stringify(summary, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(json);
} else {
  const resolvedOutput = path.resolve(outputPath);
  mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  writeFileSync(resolvedOutput, json);
  process.stdout.write(`${JSON.stringify({
    outputPath: resolvedOutput,
    selectedBeatIndex: summary.selectedBeat.beatIndex,
    terminationReason: summary.source.terminationReason,
    morphologyInterpretation: summary.morphologyInterpretation,
  }, null, 2)}\n`);
}

function requiredArgument(name: string): string {
  const value = optionalArgument(name);
  if (value === null) throw new Error(`${name} requires a value`);
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
