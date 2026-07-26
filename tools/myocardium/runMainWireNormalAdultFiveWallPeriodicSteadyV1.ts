import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallCycleWarmStartV1,
  type MainWireNormalAdultFiveWallPeriodicInitializationV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireNormalAdultLaSlsModeV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  MainWireNormalAdultCommonPericardiumCaseV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import type {
  MainWireCommonPericardiumModeV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import type {
  MainWireFourValveDiseaseBracketIdV1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";

const dtSec = numberArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--max-beats", 32);
const laSlsMode = argument("--la-sls", "on") as
  MainWireNormalAdultLaSlsModeV1;
const pericardiumMode = argument("--pericardium", "on") as
  MainWireCommonPericardiumModeV1;
const pericardiumCase = argument(
  "--pericardium-case",
  "healthy-slack",
) as MainWireNormalAdultCommonPericardiumCaseV1;
const warmStartPath = optionalArgument("--warm-start");
const warmStart = warmStartPath === null ? undefined : loadWarmStart(warmStartPath);
const valveDiseaseBracketIds = Object.freeze(
  [...commaSeparatedArgument("--valve-disease")].sort((left, right) =>
    left.localeCompare(right)),
) as readonly MainWireFourValveDiseaseBracketIdV1[];
const valveDiseasePathTag = valveDiseaseBracketIds.length === 0
  ? "healthy-valves"
  : valveDiseaseBracketIds.join("+").toLowerCase();
const initialization = argument(
  "--init",
  warmStart === undefined ? "canonical" : "cycle-boundary-warm-start",
) as
  MainWireNormalAdultFiveWallPeriodicInitializationV1;
const outputPath = argument(
  "--output",
  path.resolve(
    "data/myocardium/protocols",
    `mainwire-normal-adult-five-wall-periodic-${initialization}-${laSlsMode}`
      + `-pericardium-${pericardiumMode}-${pericardiumCase}`
      + `-${valveDiseasePathTag}`
      + `-${Math.round(dtSec * 1e6)}us-v1.json`,
  ),
);

const result = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
  dtSec,
  maximumBeatCount,
  laSlsMode,
  pericardiumMode,
  pericardiumCase,
  valveDiseaseBracketIds,
  initialization,
  warmStart,
});
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

const latestClosure = result.beatClosure.at(-1) ?? null;
process.stdout.write(`${JSON.stringify({
  outputPath,
  initialization: result.initialization,
  laSlsMode: result.laSlsMode,
  pericardiumMode: result.pericardiumMode,
  pericardiumCase: result.pericardiumCase,
  pericardiumParameterSetId: result.pericardiumParameterSetId,
  valvePresetParameterSetId: result.valvePreset.parameterSetId,
  valveDiseaseBracketIds: result.valvePreset.bracketIds,
  dtSec: result.dtSec,
  requestedMaximumBeatCount: result.requestedMaximumBeatCount,
  completedBeatCount: result.completedBeatCount,
  terminationReason: result.terminationReason,
  periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
  period2OrbitSuspected: result.period2OrbitSuspected,
  retainedBeatIndices: result.retainedCompleteBeats.map((beat) =>
    beat.beatIndex),
  terminalWarmStartAvailable:
    result.terminalCycleBoundaryWarmStart !== null,
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

function optionalArgument(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function commaSeparatedArgument(name: string): readonly string[] {
  const value = optionalArgument(name);
  if (value === null || value.trim() === "") return Object.freeze([]);
  const entries = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  return Object.freeze(entries);
}

function loadWarmStart(pathname: string): MainWireNormalAdultFiveWallCycleWarmStartV1 {
  const parsed = JSON.parse(readFileSync(pathname, "utf8")) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("warm-start file must contain an object");
  }
  const record = parsed as Record<string, unknown>;
  const candidate = record.terminalCycleBoundaryWarmStart ?? parsed;
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new Error("warm-start file has no terminal cycle-boundary checkpoint");
  }
  return candidate as MainWireNormalAdultFiveWallCycleWarmStartV1;
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
