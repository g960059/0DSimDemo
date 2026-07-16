import { readFileSync } from "node:fs";

import {
  measureLaPvReservoirConduitOrderV1,
} from "@/engine/mechanics2/diagnostics/LaPvReservoirConduitOrderV1";
import {
  measureLaPvTwoLobesV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";
import type {
  MainWireNormalAdultFiveWallClosedLoopResultV1,
  MainWireNormalAdultFiveWallClosedLoopSampleV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

const inputPath = valueAfter("--input");
const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallClosedLoopResultV1;
const beat = lastCompleteBeat(result);
if (beat.length === 0) throw new Error("input has no complete beat");

const peakMvFlow = maximum(beat.map((sample) => sample.flowMlPerSec.MV));
const openThreshold = Math.max(1, 0.01 * peakMvFlow);
const mvoIndex = beat.findIndex((sample, index) =>
  sample.flowMlPerSec.MV > openThreshold &&
  (index === 0 || beat[index - 1]!.flowMlPerSec.MV <= openThreshold));
const atrialOnsetIndex = beat.findIndex((sample) => sample.cyclePhase01 >= 0.852);
const reservoir = mvoIndex > 0 ? beat.slice(0, mvoIndex + 1) : [];
const conduit = mvoIndex >= 0 && atrialOnsetIndex > mvoIndex
  ? beat.slice(mvoIndex, atrialOnsetIndex + 1)
  : [];
const lobe = measureLaPvTwoLobesV2(beat.map((sample) => ({
  theta: sample.cyclePhase01,
  laVolumeMl: sample.nodeVolumeMl.LA,
  laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
  laActivation01: clamp01((sample.freeCalciumUM.LA - 0.1) / 0.5),
  phase: sample.cyclePhase01 >= 0.852
    ? "pumping" as const
    : mvoIndex >= 0 && sample.cyclePhase01 >= beat[mvoIndex]!.cyclePhase01
      ? "conduit" as const
      : "reservoir" as const,
})));
const branchOrder = measureLaPvReservoirConduitOrderV1({
  reservoir: reservoir.map(pvPoint),
  conduit: conduit.map(pvPoint),
});
const early = beat.filter((sample) =>
  mvoIndex >= 0 &&
  sample.cyclePhase01 >= beat[mvoIndex]!.cyclePhase01 &&
  sample.cyclePhase01 < 0.65);
const late = beat.filter((sample) => sample.cyclePhase01 >= 0.75);

process.stdout.write(`${JSON.stringify({
  inputPath,
  mode: result.mode,
  completed: result.completed,
  completedBeatCount: result.completedBeatCount,
  failure: result.failure,
  beatTimeRangeSec: [beat[0]!.timeSec, beat.at(-1)!.timeSec],
  events: {
    mvoPhase01: mvoIndex >= 0 ? beat[mvoIndex]!.cyclePhase01 : null,
    atrialCalciumOnsetPhase01: 0.852,
    mvOpenThresholdMlPerSec: openThreshold,
  },
  ranges: {
    laVolumeMl: range(beat.map((sample) => sample.nodeVolumeMl.LA)),
    laPressureMmHg: range(beat.map((sample) =>
      sample.chamberTransmuralPressureMmHg.LA)),
    lvVolumeMl: range(beat.map((sample) => sample.nodeVolumeMl.LV)),
    lvPressureMmHg: range(beat.map((sample) =>
      sample.chamberTransmuralPressureMmHg.LV)),
    mvFlowMlPerSec: range(beat.map((sample) => sample.flowMlPerSec.MV)),
    pvFlowMlPerSec: range(beat.map((sample) => sample.flowMlPerSec.PVein_LA)),
  },
  hemodynamics: {
    lvEjectionFraction:
      (maximum(beat.map((sample) => sample.nodeVolumeMl.LV))
        - minimum(beat.map((sample) => sample.nodeVolumeMl.LV)))
      / maximum(beat.map((sample) => sample.nodeVolumeMl.LV)),
    cardiacOutputLPerMin:
      mean(beat.map((sample) => sample.flowMlPerSec.AoV)) * 60 / 1000,
    mitralEPeakMlPerSec: early.length > 0
      ? maximum(early.map((sample) => sample.flowMlPerSec.MV))
      : null,
    mitralAPeakMlPerSec: late.length > 0
      ? maximum(late.map((sample) => sample.flowMlPerSec.MV))
      : null,
  },
  laPvTwoLobes: lobe,
  reservoirConduitOrder: branchOrder,
  residualMaxima: {
    mechanics: maximum(beat.map((sample) =>
      sample.diagnostics.mechanicsResidualNorm)),
    circulation: maximum(beat.map((sample) =>
      sample.diagnostics.circulationScaledResidualInfinityNorm)),
    continuityMl: maximum(beat.map((sample) =>
      Math.abs(sample.diagnostics.maximumContinuityResidualMl))),
    totalBloodVolumeMl: maximum(beat.map((sample) =>
      Math.abs(sample.diagnostics.totalBloodVolumeErrorMl))),
  },
}, null, 2)}\n`);

function lastCompleteBeat(
  value: MainWireNormalAdultFiveWallClosedLoopResultV1,
): readonly MainWireNormalAdultFiveWallClosedLoopSampleV1[] {
  if (value.completedBeatCount <= 0) return [];
  const end = value.completedBeatCount * value.stepsPerBeat;
  return value.samples.slice(end - value.stepsPerBeat, end);
}

function pvPoint(sample: MainWireNormalAdultFiveWallClosedLoopSampleV1) {
  return Object.freeze({
    laVolumeMl: sample.nodeVolumeMl.LA,
    laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
  });
}

function valueAfter(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function range(values: readonly number[]): readonly [number, number] {
  return Object.freeze([minimum(values), maximum(values)]);
}

function minimum(values: readonly number[]): number {
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  return Math.max(...values);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
