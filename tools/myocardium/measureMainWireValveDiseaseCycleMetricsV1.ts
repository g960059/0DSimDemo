import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const inputPath = requiredValueAfter("--input");
const outputPath = requiredValueAfter("--output");
const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallPeriodicResultV1;
const metrics = measureMainWireValveDiseaseCycleMetricsV1(result);

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(metrics, null, 2)}\n`);

process.stdout.write(`${JSON.stringify({
  inputPath,
  outputPath,
  beatIndex: metrics.source.beatIndex,
  interpretationEligible: metrics.interpretationEligible,
  bracketIds: result.valveResearchInput.bracketIds,
  valves: Object.fromEntries(Object.entries(metrics.valves).map(
    ([valveId, valve]) => [valveId, {
      forwardVolumeMl: valve.forwardVolumeMl,
      reverseVolumeMl: valve.reverseVolumeMl,
      sameValveRegurgitantFraction: valve.sameValveRegurgitantFraction,
      peakForwardGradientMmHg: valve.peakForwardGradientMmHg,
      peakForwardJetVelocityMPerSec: valve.peakForwardJetVelocityMPerSec,
      peakSimplifiedDopplerGradientMmHg:
        valve.peakSimplifiedDopplerGradientMmHg,
      forwardEpisodeCount: valve.forwardEpisodeCount,
      reverseEpisodeCount: valve.reverseEpisodeCount,
    }],
  )),
  global: metrics.global,
})}\n`);

function requiredValueAfter(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
