import { describe, expect, it } from "vitest";

import {
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PARAMETER_SET_V1,
} from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";

const DT_SEC = 0.002;
type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;

describe("fixed rounded-ejection construction V1", () => {
  it("owns the coherent matched-alpha/material/source-outflow assembly", () => {
    const fixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
    expect(fixture.roundedEjectionAssemblyClaim).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_FIXTURE_V1_CLAIM,
    );
    expect("selectedAorticOutflowProfile" in fixture.runtime.vascular)
      .toBe(false);
    expect("algebraicProximalArterialRootsProfile" in fixture.runtime.vascular)
      .toBe(false);
    expect(MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PARAMETER_SET_V1.values.Tref)
      .toBe(120_000);
    expect(MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PARAMETER_SET_V1.values.nTm)
      .toBe(5);
    expect(MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PARAMETER_SET_V1.values.kuw)
      .toBe(104);
    expect(MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_PARAMETER_SET_V1.values.kws)
      .toBe(4.8);
    expect(fixture.provider.parameterSetId).toContain(
      "main-wire-ventricular-rounded-ejection-profile-v1",
    );
    expect(
      fixture.rhythm.configuration.avGateParameters.minimumConductionDelaySec,
    ).toBe(0.08);
    expect(fixture.rhythm.configuration.distalGate.hvConductionDelaySec)
      .toBe(0.04);
  });

  it("has a single rounded LV ejection episode with normal raw LV-Ao gradient and timing", () => {
    const fixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
    const cycleFixture = fixture as unknown as Parameters<
      typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
    >[0];
    let accepted = fixture.cold.acceptedState;
    let trace: readonly Sample[] = [];
    for (let cycleIndex = 1; cycleIndex <= 12; cycleIndex += 1) {
      const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
        cycleFixture,
        accepted,
        cycleIndex,
        DT_SEC,
      );
      accepted = run.terminalAcceptedState;
      trace = run.traceSamples;
    }

    const episode = primaryForwardEpisodeV1(trace, "AoV");
    const timing = ventricularTimingV1(trace, "MV", episode);
    const ejection = cyclicSliceV1(trace, episode.start, episode.end);
    const gradients = ejection.map(
      (sample) =>
        sample.absolutePressureMmHg.LV - sample.absolutePressureMmHg.Ao,
    );
    const gradientMean = timeWeightedMeanV1(ejection, gradients);
    const lvp = ejection.map((sample) => sample.absolutePressureMmHg.LV);
    const aop = ejection.map((sample) => sample.absolutePressureMmHg.Ao);
    const aovFlow = ejection.map((sample) => sample.valveFlowMlPerSec.AoV);
    const peakIndex = lvp.indexOf(Math.max(...lvp));
    const peakPhase = peakIndex / Math.max(1, lvp.length - 1);
    const flowPeakPhase = aovFlow.indexOf(Math.max(...aovFlow)) /
      Math.max(1, aovFlow.length - 1);
    const central = lvp.slice(
      Math.floor(0.25 * lvp.length),
      Math.ceil(0.75 * lvp.length),
    );
    const fullRange = Math.max(...lvp) - Math.min(...lvp);
    const centralRangeFraction =
      (Math.max(...central) - Math.min(...central)) / fullRange;
    const lvPressureRate = pressureRateExtremaV1(trace, "LV");

    // Qualitative morphology gate, not a point-wise fit. Human high-fidelity
    // LV/aortic examples show one broad, gently rounded systolic crest whose
    // exact contour remains load- and wave-reflection-dependent (Murgo et al.,
    // Circulation 1980, doi:10.1161/01.CIR.62.1.105; O'Rourke & Avolio,
    // Circ Res 1980, doi:10.1161/01.RES.46.3.363). A late pressure upturn can
    // also be a conductance-catheter contact artifact (PMCID: PMC4241179), so
    // the model is gated against both a broad flat plateau and a second crest.
    expect(episode.count).toBe(1);
    expect(timing.ejectionTimeSec).toBeGreaterThanOrEqual(0.24);
    expect(timing.ejectionTimeSec).toBeLessThanOrEqual(0.28);
    expect(timing.isovolumicContractionTimeSec).toBeGreaterThanOrEqual(0.02);
    expect(timing.isovolumicContractionTimeSec).toBeLessThanOrEqual(0.07);
    expect(timing.isovolumicRelaxationTimeSec).toBeGreaterThanOrEqual(0.059);
    expect(timing.isovolumicRelaxationTimeSec).toBeLessThanOrEqual(0.134);
    expect(timing.teiIndex).toBeGreaterThanOrEqual(0.29);
    expect(timing.teiIndex).toBeLessThanOrEqual(0.65);
    expect(gradientMean).toBeGreaterThanOrEqual(3);
    expect(gradientMean).toBeLessThanOrEqual(6);
    expect(Math.max(...gradients)).toBeGreaterThanOrEqual(6);
    expect(Math.max(...gradients)).toBeLessThanOrEqual(11);
    expect(peakPhase).toBeGreaterThanOrEqual(0.35);
    expect(peakPhase).toBeLessThanOrEqual(0.7);
    expect(flowPeakPhase).toBeGreaterThanOrEqual(0.05);
    expect(flowPeakPhase).toBeLessThanOrEqual(0.4);
    expect(centralRangeFraction).toBeGreaterThanOrEqual(0.08);
    expect(centralRangeFraction).toBeLessThanOrEqual(0.3);
    expect(significantPeakCountV1(lvp)).toBe(1);
    expect(significantPeakCountV1(aop)).toBe(1);
    expect(significantPeakCountV1(aovFlow)).toBe(1);
    expect(totalVariationRatioV1(lvp)).toBeLessThanOrEqual(2.2);
    expect(totalVariationRatioV1(aop)).toBeLessThanOrEqual(2.2);
    expect(totalVariationRatioV1(aovFlow)).toBeLessThanOrEqual(2.2);
    expect(lvPressureRate.maximum).toBeGreaterThanOrEqual(1_500);
    expect(lvPressureRate.maximum).toBeLessThanOrEqual(2_500);
    expect(lvPressureRate.minimum).toBeLessThanOrEqual(-790);
    expect(lvPressureRate.minimum).toBeGreaterThanOrEqual(-1_400);
  }, 60_000);
});

function primaryForwardEpisodeV1(
  samples: readonly Sample[],
  valveId: "AoV",
) {
  const peak = Math.max(...samples.map((sample) =>
    sample.valveFlowMlPerSec[valveId]));
  const threshold = Math.max(1, 0.01 * peak);
  const open = samples.map((sample) =>
    sample.valveFlowMlPerSec[valveId] > threshold);
  const runs: Array<readonly [number, number]> = [];
  let start: number | null = null;
  for (let index = 0; index < open.length; index += 1) {
    if (open[index] && start === null) start = index;
    if (!open[index] && start !== null) {
      runs.push(Object.freeze([start, index - 1] as const));
      start = null;
    }
  }
  if (start !== null) runs.push(Object.freeze([start, open.length - 1]));
  if (runs.length !== 1) {
    throw new Error(`expected one AoV episode, received ${runs.length}`);
  }
  return Object.freeze({
    start: runs[0]![0],
    end: runs[0]![1],
    threshold,
    count: runs.length,
  });
}

function ventricularTimingV1(
  samples: readonly Sample[],
  inletValveId: "MV",
  outlet: Readonly<{ start: number; end: number }>,
) {
  const inletPeak = Math.max(...samples.map((sample) =>
    sample.valveFlowMlPerSec[inletValveId]));
  const inletThreshold = Math.max(1, 0.01 * inletPeak);
  const inletOpen = samples.map((sample) =>
    sample.valveFlowMlPerSec[inletValveId] > inletThreshold);
  const inletClosure = previousTransitionV1(
    inletOpen,
    outlet.start,
    true,
    false,
  );
  const outletClosure = (outlet.end + 1) % samples.length;
  const inletOpening = nextTransitionV1(
    inletOpen,
    outletClosure,
    false,
    true,
  );
  const delta = (from: number, to: number) => {
    const steps = to >= from ? to - from : samples.length - from + to;
    return steps * DT_SEC;
  };
  const isovolumicContractionTimeSec = delta(inletClosure, outlet.start);
  const ejectionTimeSec = (outlet.end - outlet.start + 1) * DT_SEC;
  const isovolumicRelaxationTimeSec = delta(outletClosure, inletOpening);
  return Object.freeze({
    isovolumicContractionTimeSec,
    ejectionTimeSec,
    isovolumicRelaxationTimeSec,
    teiIndex:
      (isovolumicContractionTimeSec + isovolumicRelaxationTimeSec) /
      ejectionTimeSec,
  });
}

function previousTransitionV1(
  values: readonly boolean[],
  before: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (before - offset + values.length) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("prior valve transition is unresolved");
}

function nextTransitionV1(
  values: readonly boolean[],
  after: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (after + offset) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("next valve transition is unresolved");
}

function cyclicSliceV1(
  samples: readonly Sample[],
  start: number,
  end: number,
): readonly Sample[] {
  if (end >= start) return samples.slice(start, end + 1);
  return [...samples.slice(start), ...samples.slice(0, end + 1)];
}

function timeWeightedMeanV1(
  samples: readonly Sample[],
  values: readonly number[],
): number {
  const duration = samples.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  return values.reduce((sum, value, index) =>
    sum + value * samples[index]!.acceptedDtSec, 0) / duration;
}

function pressureRateExtremaV1(
  samples: readonly Sample[],
  chamber: "LV",
) {
  const rates = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg[chamber] -
      samples[index]!.absolutePressureMmHg[chamber]) /
    sample.acceptedDtSec);
  return Object.freeze({
    maximum: Math.max(...rates),
    minimum: Math.min(...rates),
  });
}

function significantPeakCountV1(values: readonly number[]): number {
  const prominenceThreshold = Math.max(
    0.5,
    0.05 * (Math.max(...values) - Math.min(...values)),
  );
  const peaks: number[] = [];
  for (let index = 1; index < values.length - 1; index += 1) {
    if (values[index]! > values[index - 1]! &&
        values[index]! >= values[index + 1]!) peaks.push(index);
  }
  return peaks.filter((index, ordinal) => {
    const left = ordinal === 0 ? 0 : peaks[ordinal - 1]!;
    const right = ordinal === peaks.length - 1
      ? values.length - 1
      : peaks[ordinal + 1]!;
    const prominence = values[index]! - Math.max(
      Math.min(...values.slice(left, index + 1)),
      Math.min(...values.slice(index, right + 1)),
    );
    return prominence >= prominenceThreshold;
  }).length;
}

function totalVariationRatioV1(values: readonly number[]): number {
  const range = Math.max(...values) - Math.min(...values);
  if (range <= 0) return Number.POSITIVE_INFINITY;
  return values.slice(1).reduce((sum, value, index) =>
    sum + Math.abs(value - values[index]!), 0) / range;
}
