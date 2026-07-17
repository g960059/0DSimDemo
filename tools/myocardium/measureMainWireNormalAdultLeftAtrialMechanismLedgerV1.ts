import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireNormalAdultLeftAtrialMechanismLedgerV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultLeftAtrialMechanismLedgerV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const inputPath = requiredArgument("--input");
const outputPath = optionalArgument("--output");
const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallPeriodicResultV1;
const currentBeat = result.retainedCompleteBeats.at(-1);
const previousBeat = result.retainedCompleteBeats.at(-2);

if (
  currentBeat === undefined
  || currentBeat.samples.length !== result.stepsPerBeat
) {
  throw new Error("periodic result lacks a complete terminal beat");
}
if (
  previousBeat === undefined
  || previousBeat.beatIndex !== currentBeat.beatIndex - 1
  || previousBeat.samples.length !== result.stepsPerBeat
) {
  throw new Error(
    "LA mechanism ledger requires the complete beat immediately preceding the terminal beat",
  );
}

const ledger = measureMainWireNormalAdultLeftAtrialMechanismLedgerV1({
  precedingSample: previousBeat.samples.at(-1)!,
  samples: currentBeat.samples,
  dtSec: result.dtSec,
});
const json = `${JSON.stringify(ledger, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(json);
} else {
  const resolvedOutput = path.resolve(outputPath);
  mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  writeFileSync(resolvedOutput, json);
  process.stdout.write(`${JSON.stringify({
    outputPath: resolvedOutput,
    sampleCount: ledger.samples.length,
    intervalCount: ledger.intervals.length,
    audit: ledger.audit,
    claim: ledger.claim,
  }, null, 2)}\n`);
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
