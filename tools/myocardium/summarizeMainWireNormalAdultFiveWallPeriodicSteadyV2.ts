import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV2";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const inputPath = requiredValueAfter("--input");
const outputPath = requiredValueAfter("--output");
const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallPeriodicResultV3;
const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(result);
const json = `${JSON.stringify(summary, null, 2)}\n`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, json);

process.stdout.write(`${JSON.stringify({
  summaryId: summary.summaryId,
  inputPath,
  outputPath,
  status: summary.status,
  selectedBeatIndex: summary.selectedCycle.beatIndex,
  nominalGridCount: summary.selectedCycle.nominalGridCount,
  acceptedIntervalCount: summary.selectedCycle.acceptedIntervalCount,
  acceptedEventCount: summary.selectedCycle.acceptedEventCount,
  terminationReason: summary.source.terminationReason,
  jsonBytes: Buffer.byteLength(json),
})}\n`);

function requiredValueAfter(name: string): string {
  const value = optionalValueAfter(name);
  if (value === null) throw new Error(`${name} is required`);
  return value;
}

function optionalValueAfter(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
