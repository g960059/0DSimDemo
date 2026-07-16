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
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

const inputPath = valueAfter("--input");
const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallClosedLoopResultV1;
const beat = lastCompleteBeat(result);
if (beat.length === 0) throw new Error("input has no complete beat");

const peakMvFlow = maximum(beat.map((sample) => sample.flowMlPerSec.MV));
const openThreshold = Math.max(1, 0.01 * peakMvFlow);
const mvOpen = beat.map((sample) => sample.flowMlPerSec.MV > openThreshold);
const mvoIndex = cyclicOpeningAfterLongestClosedRun(
  mvOpen,
);
const mvcIndex = cyclicClosingBeforeOpening(mvOpen, mvoIndex);
const atrialOnsetPhase01 = normalAtrialCalciumOnsetPhase01();
const atrialOnsetIndex = beat.findIndex((sample) =>
  sample.cyclePhase01 >= atrialOnsetPhase01);
const reservoir = cyclicSegmentInclusive(beat, mvcIndex, mvoIndex);
const conduit = cyclicSegmentInclusive(beat, mvoIndex, atrialOnsetIndex);
const pumping = cyclicSegmentInclusive(beat, atrialOnsetIndex, mvcIndex);
const phaseByIndex = new Map<number, "reservoir" | "conduit" | "pumping">();
markCyclicSegment(phaseByIndex, beat.length, mvcIndex, mvoIndex, "reservoir");
markCyclicSegment(phaseByIndex, beat.length, mvoIndex, atrialOnsetIndex, "conduit");
markCyclicSegment(phaseByIndex, beat.length, atrialOnsetIndex, mvcIndex, "pumping");
const atrialCalcium = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.atrial;
const lobe = measureLaPvTwoLobesV2(beat.map((sample, index) => ({
  theta: sample.cyclePhase01,
  laVolumeMl: sample.nodeVolumeMl.LA,
  laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
  laActivation01: clamp01(
    (sample.freeCalciumUM.LA - atrialCalcium.diastolicCalciumUM) /
      Math.max(atrialCalcium.peakAmplitudeUM, Number.EPSILON),
  ),
  phase: phaseByIndex.get(index) ?? "transition" as const,
})));
const branchOrder = measureLaPvReservoirConduitOrderV1({
  reservoir: reservoir.map(pvPoint),
  conduit: conduit.map(pvPoint),
});
const early = conduit;
const late = pumping;
const laSlsCycleLedger = measureLaSlsCycleLedger(result, beat);

process.stdout.write(`${JSON.stringify({
  inputPath,
  mode: result.mode,
  completed: result.completed,
  completedBeatCount: result.completedBeatCount,
  failure: result.failure,
  beatTimeRangeSec: [beat[0]!.timeSec, beat.at(-1)!.timeSec],
  events: {
    mvoPhase01: mvoIndex >= 0 ? beat[mvoIndex]!.cyclePhase01 : null,
    mvcPhase01: mvcIndex >= 0 ? beat[mvcIndex]!.cyclePhase01 : null,
    atrialCalciumOnsetPhase01: atrialOnsetPhase01,
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
    mitralPeakCountAboveFivePercent: localPeakCount(
      beat.map((sample) => sample.flowMlPerSec.MV),
      0.05,
    ),
    aorticValvePeakCountAboveFivePercent: localPeakCount(
      beat.map((sample) => sample.flowMlPerSec.AoV),
      0.05,
    ),
    lvPressurePeakCountAboveFivePercent: localPeakCount(
      beat.map((sample) => sample.chamberTransmuralPressureMmHg.LV),
      0.05,
    ),
  },
  laSlsCycleLedger,
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

/**
 * The atrial A-wave can remain above threshold across phase 1 -> 0. Early
 * diastolic MVO is therefore the opening transition preceded by the longest
 * cyclic closed interval, not necessarily the first positive sample.
 */
function cyclicOpeningAfterLongestClosedRun(open: readonly boolean[]): number {
  if (open.length === 0 || open.every(Boolean) || open.every((value) => !value)) {
    return -1;
  }
  let bestOpening = -1;
  let bestClosedCount = -1;
  for (let index = 0; index < open.length; index += 1) {
    const previous = (index - 1 + open.length) % open.length;
    if (!open[index] || open[previous]) continue;
    let closedCount = 0;
    let cursor = previous;
    while (!open[cursor] && closedCount < open.length) {
      closedCount += 1;
      cursor = (cursor - 1 + open.length) % open.length;
    }
    if (closedCount > bestClosedCount) {
      bestClosedCount = closedCount;
      bestOpening = index;
    }
  }
  return bestOpening;
}

function cyclicClosingBeforeOpening(
  open: readonly boolean[],
  openingIndex: number,
): number {
  if (openingIndex < 0 || open.length === 0) return -1;
  let cursor = (openingIndex - 1 + open.length) % open.length;
  if (open[cursor]) return -1;
  for (let guard = 0; guard < open.length; guard += 1) {
    const previous = (cursor - 1 + open.length) % open.length;
    if (open[previous]) return cursor;
    cursor = previous;
  }
  return -1;
}

function cyclicSegmentInclusive<T>(
  values: readonly T[],
  startIndex: number,
  endIndex: number,
): readonly T[] {
  if (startIndex < 0 || endIndex < 0 || values.length === 0) return [];
  const output: T[] = [];
  let cursor = startIndex;
  for (let guard = 0; guard <= values.length; guard += 1) {
    output.push(values[cursor]!);
    if (cursor === endIndex) return output;
    cursor = (cursor + 1) % values.length;
  }
  return [];
}

function markCyclicSegment<T>(
  target: Map<number, T>,
  length: number,
  startIndex: number,
  endIndex: number,
  value: T,
): void {
  if (startIndex < 0 || endIndex < 0 || length === 0) return;
  let cursor = startIndex;
  for (let guard = 0; guard <= length; guard += 1) {
    target.set(cursor, value);
    if (cursor === endIndex) return;
    cursor = (cursor + 1) % length;
  }
}

function normalAtrialCalciumOnsetPhase01(): number {
  const params = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  return positiveModulo(
    params.cycleLengthSec - params.atrioventricularDelaySec +
      params.atrial.electricalToCalciumDelaySec,
    params.cycleLengthSec,
  ) / params.cycleLengthSec;
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function localPeakCount(values: readonly number[], thresholdFraction: number): number {
  if (values.length < 3) return 0;
  const threshold = thresholdFraction * maximum(values);
  let count = 0;
  for (let index = 1; index < values.length - 1; index += 1) {
    if (
      values[index]! > threshold &&
      values[index]! > values[index - 1]! &&
      values[index]! >= values[index + 1]!
    ) count += 1;
  }
  return count;
}

function measureLaSlsCycleLedger(
  result: MainWireNormalAdultFiveWallClosedLoopResultV1,
  beat: readonly MainWireNormalAdultFiveWallClosedLoopSampleV1[],
) {
  const mode = result.laSlsMode ?? "on";
  const wallVolumeMl = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria.LA
    .wallMaterialVolumeMl;
  const onModulusPa = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.wallMaterialByWall.LA
    .sls.branchModulusPa;
  const tauSec = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.wallMaterialByWall.LA
    .sls.relaxationTimeSec;
  const end = result.completedBeatCount * result.stepsPerBeat;
  const preceding = result.samples[end - result.stepsPerBeat - 1] ?? null;
  const sequence = preceding === null ? [...beat] : [preceding, ...beat];
  const maximumAbsoluteStressPa = maximum(
    beat.map((sample) => Math.abs(sample.wallStressPa.LA.sls)),
  );
  if (mode === "exact-off") {
    return Object.freeze({
      mode,
      mechanicallyExactOff: maximumAbsoluteStressPa === 0,
      maximumAbsoluteStressPa,
      stressWorkMilliJ: 0,
      storedEnergyChangeMilliJ: 0,
      physicalDissipationMilliJ: 0,
      backwardEulerNumericalDissipationMilliJ: 0,
      physicalToNumericalDissipationRatio: null,
      discreteBalanceResidualMilliJ: 0,
    });
  }
  let stressWorkDensity = 0;
  let storedEnergyChangeDensity = 0;
  let physicalDissipationDensity = 0;
  let numericalDissipationDensity = 0;
  for (let index = 1; index < sequence.length; index += 1) {
    const previous = sequence[index - 1]!;
    const next = sequence[index]!;
    const previousElastic = previous.wallStressPa.LA.sls / onModulusPa;
    const nextElastic = next.wallStressPa.LA.sls / onModulusPa;
    const previousStrain = Math.log(
      previous.nodeVolumeMl.LA + 0.5 * wallVolumeMl,
    ) / 3;
    const nextStrain = Math.log(
      next.nodeVolumeMl.LA + 0.5 * wallVolumeMl,
    ) / 3;
    stressWorkDensity += next.wallStressPa.LA.sls *
      (nextStrain - previousStrain);
    storedEnergyChangeDensity += 0.5 * onModulusPa *
      (nextElastic ** 2 - previousElastic ** 2);
    physicalDissipationDensity += onModulusPa * result.dtSec / tauSec *
      nextElastic ** 2;
    numericalDissipationDensity += 0.5 * onModulusPa *
      (nextElastic - previousElastic) ** 2;
  }
  const densityToMilliJ = (densityJPerM3: number) =>
    densityJPerM3 * wallVolumeMl * 1e-3;
  const balanceDensity = stressWorkDensity - storedEnergyChangeDensity -
    physicalDissipationDensity - numericalDissipationDensity;
  return Object.freeze({
    mode,
    mechanicallyExactOff: false,
    maximumAbsoluteStressPa,
    stressWorkMilliJ: densityToMilliJ(stressWorkDensity),
    storedEnergyChangeMilliJ: densityToMilliJ(storedEnergyChangeDensity),
    physicalDissipationMilliJ: densityToMilliJ(physicalDissipationDensity),
    backwardEulerNumericalDissipationMilliJ:
      densityToMilliJ(numericalDissipationDensity),
    physicalToNumericalDissipationRatio: numericalDissipationDensity > 0
      ? physicalDissipationDensity / numericalDissipationDensity
      : null,
    discreteBalanceResidualMilliJ: densityToMilliJ(balanceDensity),
  });
}
