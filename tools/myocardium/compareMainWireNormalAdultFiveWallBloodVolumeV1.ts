import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireNormalAdultFiveWallBloodVolumeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallBloodVolumeComparisonV1";
import type {
  MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

const controlPath = requiredArgument("--control");
const challengerPath = requiredArgument("--challenger");
const outputPath = path.resolve(requiredArgument("--output"));
const comparison = compareMainWireNormalAdultFiveWallBloodVolumeV1(
  readSummary(controlPath),
  readSummary(challengerPath),
);

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(comparison, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  outputPath,
  interpretable: comparison.interpretable,
  interpretabilityReasons: comparison.interpretabilityReasons,
  pairing: comparison.pairing,
  metrics: comparison.metrics,
  topology: comparison.topology,
  claim: comparison.claim,
}, null, 2)}\n`);

function readSummary(
  inputPath: string,
): MainWireNormalAdultFiveWallPeriodicSummaryV1 {
  return JSON.parse(readFileSync(inputPath, "utf8")) as
    MainWireNormalAdultFiveWallPeriodicSummaryV1;
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) throw new Error(`${name} is required`);
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
