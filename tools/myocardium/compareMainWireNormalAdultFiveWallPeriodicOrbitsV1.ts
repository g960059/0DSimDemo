import { readFileSync, writeFileSync } from "node:fs";

import {
  compareMainWireNormalAdultFiveWallPeriodicOrbitsV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const primaryPath = requiredArgument("--primary");
const alternatePath = requiredArgument("--alternate");
const outputPath = optionalArgument("--output");
const primary = readResult(primaryPath);
const alternate = readResult(alternatePath);
const comparison = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
  primary,
  alternate,
);
const serialized = `${JSON.stringify(comparison, null, 2)}\n`;
if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  writeFileSync(outputPath, serialized);
  process.stdout.write(`${JSON.stringify({
    outputPath,
    interpretable: comparison.interpretable,
    interpretabilityReasons: comparison.interpretabilityReasons,
    primaryInitialization: comparison.primaryInitialization,
    alternateInitialization: comparison.alternateInitialization,
    primaryFinalBeatIndex: comparison.primaryFinalBeatIndex,
    alternateFinalBeatIndex: comparison.alternateFinalBeatIndex,
    initializationAudit: comparison.initializationAudit,
    signalMetrics: comparison.signalMetrics,
    claim: comparison.claim,
  }, null, 2)}\n`);
}

function readResult(path: string): MainWireNormalAdultFiveWallPeriodicResultV1 {
  return JSON.parse(readFileSync(path, "utf8")) as
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
