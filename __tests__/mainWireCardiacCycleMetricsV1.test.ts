import { describe, expect, it } from "vitest";
import { MainWireCardiacCycleCollectorV1 } from "@/analysis/methods/mainWire/MainWireCardiacCycleCollectorV1";
import { mainWireCardiacCycleOutputValueV1 } from "@/analysis/methods/mainWire/MainWireCardiacCyclePresentationV1";
import { createStudioSimulationPresentationBatchV2 } from "@/studio/workers/StudioSimulationPresentationBatchV2";
import type { StudioSimulationFrameV2, StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import previous from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import next from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import { assertAdditiveModelSurfaceUpgradeV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { selectPresentationAnalysisIdsV1 } from "@/components/workbench/presentation/WorkbenchPresentationOutputSelectionV3";
import { MainWireFillingFlowCollectorV1 } from "@/analysis/methods/mainWire/MainWireFillingFlowCollectorV1";
import { buildMainWireFillingFlowMetricsV1 as fillingMetrics, MAIN_WIRE_FILLING_FLOW_METHOD_V1_ID as fillingMethodId,
  MAIN_WIRE_FILLING_FLOW_OUTPUT_IDS_V1 as fillingIds, MAIN_WIRE_FILLING_FLOW_REQUIRED_EXACT_OUTPUT_IDS_V1 as fillingInputs } from "@/analysis/methods/mainWire/MainWireFillingFlowMetricsV1";
import { mainWireFillingFlowOutputValueV1 } from "@/analysis/methods/mainWire/MainWireCardiacCyclePresentationV1";

import {
  MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
  MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1,
  MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1,
  buildMainWireCardiacCycleMetricsV1,
  requireMainWireCardiacCyclePresentationIntervalSecV1,
  type MainWireCardiacCycleAcceptedSampleV1,
} from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";

const DT_SEC = 0.002;

describe("bounded presentation analysis collector", () => {
  it("inherits every current control, graph and PVA method; selection is opt-in", () => {
    expect(() => assertAdditiveModelSurfaceUpgradeV1(previous, next)).not.toThrow();
    const old = resolveMainWireAnalysisMethodsForSurfaceV1(previous);
    const methods = resolveMainWireAnalysisMethodsForSurfaceV1(next);
    expect(methods.periodicPvaDerivation).toBe(old.periodicPvaDerivation);
    expect(old.presentationMethods).toEqual([]);
    expect(methods.presentationMethods.map(m => m.methodId)).toEqual([MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID, fillingMethodId]);
    expect(next.derivedOutputCatalog).toHaveLength(previous.derivedOutputCatalog.length + 16);
    expect(next.controlCatalog).toEqual(previous.controlCatalog);
    expect(next.graphCatalog).toEqual(previous.graphCatalog);
    expect(selectPresentationAnalysisIdsV1(["hemodynamics.pressure.absolute.LV"], next, methods.presentationMethods)).toEqual([]);
    expect(selectPresentationAnalysisIdsV1(Object.values(MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1), next, methods.presentationMethods))
      .toEqual([MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID]);
    expect(selectPresentationAnalysisIdsV1(Object.values(fillingIds), next, methods.presentationMethods)).toEqual([fillingMethodId]);
  });

  it.each([1, 8, 16, 31, 256])("computes only at complete beats, independent of packet size %i", size => {
    const samples = samplesV1();
    const collector = new MainWireCardiacCycleCollectorV1();
    const emissions: StudioSimulationAnalysisV2[] = [];
    for (let i = 0; i < samples.length; i += size) {
      const emission = collector.ingest(sampleBatch(samples.slice(i, i + size)));
      if (emission) emissions.push(emission);
    }
    expect(emissions).toHaveLength(2); // Pending once, then one complete beat, not every packet.
    expect(emissions.at(-1)?.payload).toEqual(buildMainWireCardiacCycleMetricsV1(samples));
    expect(emissions.at(-1)).toMatchObject({ inputEpoch: 1, sourceAcceptedTimeSec: 2 });
  });

  it("invalidates on epoch changes, gaps and unavailable signals, then recovers", () => {
    for (const fault of ["epoch", "gap", "signal"] as const) {
      const collector = new MainWireCardiacCycleCollectorV1();
      const samples = samplesV1();
      expect(collector.ingest(sampleBatch(samples))?.payload).toMatchObject({ status: "available" });
      const tail = samples.at(-1)!;
      const first = { ...tail, inputEpoch: fault === "epoch" ? 2 : 1,
        acceptedRevision: tail.acceptedRevision + 1,
        acceptedTimeSec: tail.acceptedTimeSec + (fault === "gap" ? .004 : .002),
        values: fault === "signal" ? { ...tail.values, "hemodynamics.flow.valve.MV": null } : tail.values };
      expect(collector.ingest(sampleBatch([first]))?.payload).toMatchObject({ status: "unavailable" });
      const resumed = samples.map(s => ({ ...s, inputEpoch: first.inputEpoch,
        acceptedRevision: s.acceptedRevision + first.acceptedRevision + 1,
        acceptedTimeSec: s.acceptedTimeSec + first.acceptedTimeSec + .002 }));
      expect(collector.ingest(sampleBatch(resumed))?.payload).toMatchObject({ status: "available" });
    }
  });

  it("does not retain an unbounded noncycling record", () => {
    const collector = new MainWireCardiacCycleCollectorV1();
    const source = samplesV1();
    const flat = Array.from({ length: 8_100 }, (_, index) => ({ ...source[0]!,
      acceptedRevision: index, acceptedTimeSec: index * DT_SEC }));
    expect(collector.ingest(sampleBatch(flat))?.payload).toMatchObject({ status: "unavailable" });
    const resumed = source.map(s => ({ ...s, acceptedRevision: s.acceptedRevision + flat.length,
      acceptedTimeSec: s.acceptedTimeSec + flat.length * DT_SEC }));
    expect(collector.ingest(sampleBatch(resumed))?.payload).toMatchObject({ status: "available" });
  });

  it.each(["flat", "dip"] as const)("invalidates a %s phase immediately instead of treating it as a cycle wrap", mode => {
    const collector = new MainWireCardiacCycleCollectorV1();
    const source = samplesV1();
    expect(collector.ingest(sampleBatch(source))?.payload).toMatchObject({ status: "available" });
    const last = source.at(-1)!;
    const phaseId = MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1[0];
    const invalid = { ...last, acceptedRevision: last.acceptedRevision + 1,
      acceptedTimeSec: last.acceptedTimeSec + .002,
      values: { ...last.values, [phaseId]: last.values[phaseId]! - (mode === "dip" ? .004 : 0) } };
    expect(() => buildMainWireCardiacCycleMetricsV1([...source, invalid])).toThrow(/phase must increase/);
    expect(collector.ingest(sampleBatch([invalid]))?.payload).toMatchObject({ status: "unavailable" });
    const resumed = source.map(s => ({ ...s, acceptedRevision: s.acceptedRevision + invalid.acceptedRevision + 1,
      acceptedTimeSec: s.acceptedTimeSec + invalid.acceptedTimeSec + .002 }));
    expect(collector.ingest(sampleBatch(resumed))?.payload).toMatchObject({ status: "available" });
  });

  it("keeps analysis outside exact frames and fails closed across identity/epoch boundaries", () => {
    const samples = samplesV1(), batch = sampleBatch(samples);
    const analysis = new MainWireCardiacCycleCollectorV1().ingest(batch)!;
    const id = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.leftVentricularIsovolumicContractionTimeMs;
    expect(batch.terminalFrame.outputs[id]).toBeUndefined();
    expect(mainWireCardiacCycleOutputValueV1([analysis], batch.terminalFrame, id)?.value).toBeCloseTo(20, 10);
    expect(mainWireCardiacCycleOutputValueV1([analysis], batch.terminalFrame, id)?.quality).toBe("accepted-derived");
    for (const override of [{ inputEpoch: 2 }, { scenarioId: "other" }, { runtimeSessionId: "other" },
      { modelId: "other" }, { sourceAcceptedRevision: 9999 }, { sourceAcceptedTimeSec: 99 },
      { payload: { status: "unavailable", reason: "presentation-analysis-rejected" } }]) {
      expect(mainWireCardiacCycleOutputValueV1([{ ...analysis, ...override }], batch.terminalFrame, id))
        .toMatchObject({ value: null, quality: "not-assessed" });
    }
    expect(mainWireCardiacCycleOutputValueV1([analysis], batch.terminalFrame, "not-this-method")).toBeUndefined();
  });
});

function sampleBatch(samples: readonly MainWireCardiacCycleAcceptedSampleV1[]) {
  const frames: StudioSimulationFrameV2[] = samples.map(s => ({
    modelId: "model/test", runtimeSessionId: "runtime/test", scenarioId: "scenario/test",
    inputEpoch: s.inputEpoch, acceptedRevision: s.acceptedRevision, acceptedTimeSec: s.acceptedTimeSec,
    outputs: Object.fromEntries(Object.entries(s.values).map(([outputId, value]) => [outputId, {
      outputId, value, availability: value === null ? "not-evaluated-at-accepted-state" : "available",
      quality: value === null ? "not-assessed" : "authoritative-state",
    }])),
  }));
  return createStudioSimulationPresentationBatchV2(frames, MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1);
}

describe("Flow-event timing and windowed pressure-rate analysis", () => {
  it("pins its sampling contract to the exact manifest-owned presentation interval", () => {
    expect(requireMainWireCardiacCyclePresentationIntervalSecV1({
      presentationDtSec: 0.002,
    })).toBe(0.002);
    expect(() => requireMainWireCardiacCyclePresentationIntervalSecV1({
      presentationDtSec: 0.004,
    })).toThrow(/requires the exact 2-ms presentation interval/);
  });

  it("derives flow timing, Tei-like index, and 10-ms windowed pressure rates", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1());

    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    expect(result.methodId).toBe(MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID);
    expect(result.source).toMatchObject({
      cycleStartTimeSec: 1,
      cycleEndTimeSec: 2,
      cycleDurationSec: 1,
      timebase: "every-exact-presentation-boundary-no-resampling",
    });
    expect(result.aorticEjection.positiveFlowDurationSec).toBeCloseTo(0.3, 12);
    expect(result.aorticEjection.forwardVolumeMl).toBeCloseTo(15, 12);
    expect(result.flowEvents.isovolumicContractionTimeSec).toBeCloseTo(0.02, 12);
    expect(result.flowEvents.isovolumicRelaxationTimeSec).toBeCloseTo(0.08, 12);

    const ids = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1;
    expect(result.values[ids.leftVentricularIsovolumicContractionTimeMs]).toBeCloseTo(20, 12);
    expect(result.values[ids.leftVentricularIsovolumicRelaxationTimeMs]).toBeCloseTo(80, 12);
    expect(result.values[ids.leftVentricularMyocardialPerformanceIndex]).toBeCloseTo(1 / 3, 12);

    for (const [windowSec, maximumOutputId, minimumOutputId] of [
      [0.01, ids.leftVentricularMaximumPressureRate10Ms, ids.leftVentricularMinimumPressureRate10Ms],
    ] as const) {
      const expectedMaximum = 40 * Math.sin(Math.PI * windowSec) / windowSec;
      expect(Math.abs(result.values[maximumOutputId]! - expectedMaximum))
        .toBeLessThan(0.3);
      expect(Math.abs(result.values[minimumOutputId]! + expectedMaximum))
        .toBeLessThan(0.3);
    }
    const expectedRvMaximum = 10 * Math.sin(Math.PI * 0.01) / 0.01;
    expect(Math.abs(
      result.values[ids.rightVentricularMaximumPressureRate10Ms]!
        - expectedRvMaximum,
    )).toBeLessThan(0.1);
    expect(Math.abs(
      result.values[ids.rightVentricularMinimumPressureRate10Ms]!
        + expectedRvMaximum,
    )).toBeLessThan(0.1);
  });

  it("keeps timing components nullable instead of inventing missing mitral events", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1({
      mitralFlow: () => 0,
    }));

    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    const ids = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1;
    expect(result.values[ids.leftVentricularIsovolumicContractionTimeMs]).toBeNull();
    expect(result.values[ids.leftVentricularIsovolumicRelaxationTimeMs]).toBeNull();
    expect(result.values[ids.leftVentricularMyocardialPerformanceIndex]).toBeNull();
  });

  it.each(["ICT", "IRT"] as const)("rejects %s spanning forward mitral flow, while retaining independent measurements", interval => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1({
      mitralFlow: phase => triangularPulseV1(phase, .02, .08, .18, 100)
        + triangularPulseV1(phase, .6, .7, .9, 200)
        + (interval === "ICT" ? triangularPulseV1(phase, .19, .205, .22, 50)
          : triangularPulseV1(phase, .48, .51, .54, 50)),
    }));
    expect(result.status).toBe("available");
    const ids = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1;
    const rejected = interval === "ICT" ? ids.leftVentricularIsovolumicContractionTimeMs
      : ids.leftVentricularIsovolumicRelaxationTimeMs;
    const retained = interval === "ICT" ? ids.leftVentricularIsovolumicRelaxationTimeMs
      : ids.leftVentricularIsovolumicContractionTimeMs;
    expect(result.values[rejected]).toBeNull();
    expect(result.values[ids.leftVentricularMyocardialPerformanceIndex]).toBeNull();
    expect(result.values[retained]).toBeCloseTo(interval === "ICT" ? 100 : 20, 9);
    expect(result.values[ids.leftVentricularMaximumPressureRate10Ms]).toBeGreaterThan(0);
  });

  it("fails closed when more than one material forward ejection is present", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1({
      aorticFlow: (phase) =>
        triangularPulseV1(phase, 0.2, 0.35, 0.5, 100)
        + triangularPulseV1(phase, 0.65, 0.7, 0.75, 40),
    }));

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "multiple-material-aortic-forward-ejections",
    });
  });

  it("rejects omitted or decimated samples rather than treating a visual buffer as exact timing", () => {
    const samples = samplesV1();
    expect(() => buildMainWireCardiacCycleMetricsV1(samples.filter((_, index) => index % 2 === 0)))
      .toThrow(/2-ms grid/);
    expect(() => buildMainWireCardiacCycleMetricsV1([...samples.slice(0, 10), ...samples.slice(11)]))
      .toThrow(/2-ms grid/);
  });

  it("waits for two complete phase boundaries and rejects mixed epochs", () => {
    expect(buildMainWireCardiacCycleMetricsV1(samplesV1().slice(0, Math.round(1.5 / DT_SEC))))
      .toMatchObject({
        status: "unavailable",
        reason: "insufficient-complete-regular-sinus-cycles",
      });
    const mixed = [...samplesV1()];
    mixed[mixed.length - 1] = Object.freeze({
      ...mixed.at(-1)!,
      inputEpoch: 2,
    });
    expect(() => buildMainWireCardiacCycleMetricsV1(mixed))
      .toThrow(/cross input epochs/);
  });
});

function samplesV1(overrides: Readonly<{
  aorticFlow?: (phase: number) => number;
  mitralFlow?: (phase: number) => number;
}> = {}): readonly MainWireCardiacCycleAcceptedSampleV1[] {
  const sampleCount = Math.round(2.01 / DT_SEC) + 1;
  return Object.freeze(Array.from({ length: sampleCount }, (_, index) => {
    const acceptedTimeSec = index * DT_SEC;
    const phase = normalizedPhaseV1(acceptedTimeSec);
    const aorticFlow = overrides.aorticFlow?.(phase)
      ?? triangularPulseV1(phase, 0.2, 0.35, 0.5, 100);
    const mitralFlow = overrides.mitralFlow?.(phase)
      ?? (phase < 0.18 ? 100 * (0.18 - phase) : Math.max(0, 100 * (phase - 0.58)));
    return Object.freeze({
      inputEpoch: 1,
      acceptedRevision: index,
      acceptedTimeSec,
      values: Object.freeze({
        "rhythm.phase.regular-sinus": phase,
        "hemodynamics.flow.valve.MV": mitralFlow,
        "hemodynamics.flow.valve.AoV": aorticFlow,
        "hemodynamics.pressure.absolute.LV":
          80 + 20 * Math.sin(2 * Math.PI * phase),
        "hemodynamics.pressure.absolute.RV":
          20 + 5 * Math.sin(2 * Math.PI * phase),
      }),
    });
  }));
}

function normalizedPhaseV1(timeSec: number): number {
  const rounded = Math.round(timeSec * 1e12) / 1e12;
  const phase = Math.round(
    (rounded - Math.floor(rounded)) * 1e12,
  ) / 1e12;
  return phase >= 1 - 1e-12 ? 0 : phase;
}

function triangularPulseV1(
  phase: number,
  start: number,
  peak: number,
  end: number,
  maximum: number,
): number {
  if (phase <= start || phase >= end) return 0;
  return phase <= peak
    ? maximum * (phase - start) / (peak - start)
    : maximum * (end - phase) / (end - peak);
}

describe("volumetric mitral and pulmonary venous filling observations", () => {
  it("pairs E with the FOLLOWING A; measures analytic slopes, S2, D and matched zero-crossing durations", () => {
    const result = fillingMetrics(fillingSamples());
    expect(result.status).toBe("available");
    expect(result.source).toEqual({ cycleStartTimeSec: 1, atrialActivationTimeSec: 2, observationEndTimeSec: 3 });
    const expected = { mitralPeakEToA: 2, mitralDecelerationTimeMs: 200, mitralADurationMs: 160,
      pulmonarySystolicPeakFlowMlPerSec: 80, pulmonaryDiastolicPeakFlowMlPerSec: 100, pulmonaryPeakSToD: .8,
      pulmonaryArPeakMagnitudeMlPerSec: 30, pulmonaryArDurationMs: 180, pulmonaryArMinusADurationMs: 20 };
    for (const [name, value] of Object.entries(expected))
      expect(result.values[fillingIds[name as keyof typeof fillingIds]], name).toBeCloseTo(value, 9);
    expect(result.unavailableReasons).toEqual({});
  });

  it("does not equate residual E flow with a measured A onset, but retains resolved peak ratios and PV measurements", () => {
    const samples = fillingSamples((p, t, mv) => mv + (p < .18 || p > .6 ? 10 : 0));
    const result = fillingMetrics(samples);
    expect(result.values[fillingIds.mitralPeakEToA]).toBeCloseTo(210 / 110, 9);
    expect(result.values[fillingIds.mitralADurationMs]).toBeNull();
    expect(result.values[fillingIds.pulmonaryArMinusADurationMs]).toBeNull();
    expect(result.values[fillingIds.pulmonaryArDurationMs]).toBeCloseTo(180, 9);
    expect(result.unavailableReasons[fillingIds.mitralADurationMs]).toMatch(/no-separate-observed-zero/);
  });

  it.each(["fused", "multiple", "short-downstroke"])("does not force a mitral measurement with %s E waves", mode => {
    const result = fillingMetrics(fillingSamples((p, _t, mv) => {
      if (mode === "fused") return p > .6 ? (p - .6) * 100 : p < .18 ? mv + 40 : mv;
      if (mode === "multiple") return mv + triangularPulseV1(p, .78, .8, .82, 100);
      return p > .6 ? triangularPulseV1(p, .6, .99, 1.05, 200) : mv;
    }));
    expect(result.values[fillingIds.mitralDecelerationTimeMs]).toBeNull();
    if (mode !== "short-downstroke") expect(result.values[fillingIds.mitralPeakEToA]).toBeNull();
    expect(result.values[fillingIds.pulmonaryDiastolicPeakFlowMlPerSec]).toBeCloseTo(100, 9);
  });

  it.each([false, true])("rejects multiple A episodes over the whole late-filling interval (larger first: %s)", largerFirst => {
    const result = fillingMetrics(fillingSamples((p, _t, mv) => p < .22
      ? triangularPulseV1(p, .02, .06, .1, largerFirst ? 100 : 20)
        + triangularPulseV1(p, .12, .15, .18, largerFirst ? 20 : 100)
      : mv));
    for (const id of [fillingIds.mitralPeakEToA, fillingIds.mitralADurationMs, fillingIds.pulmonaryArMinusADurationMs])
      expect(result.values[id], id).toBeNull();
    expect(result.values[fillingIds.mitralDecelerationTimeMs]).toBeCloseTo(200, 9);
    expect(result.values[fillingIds.pulmonaryPeakSToD]).toBeCloseTo(.8, 9);
    expect(result.values[fillingIds.pulmonaryArDurationMs]).toBeCloseTo(180, 9);
  });

  it("does not hide a reopened A-region pulse still flowing at the following ejection", () => {
    const result = fillingMetrics(fillingSamples((p, time, mv) => mv
      + (time >= 2 ? triangularPulseV1(p, .19, .205, .24, 40) : 0)));
    expect(result.values[fillingIds.mitralPeakEToA]).toBeNull();
    expect(result.values[fillingIds.mitralADurationMs]).toBeNull();
    expect(result.values[fillingIds.pulmonaryArMinusADurationMs]).toBeNull();
  });

  it.each(["absent", "sustained"])("leaves Ar unavailable when %s instead of assigning zero or systolic reversal", mode => {
    const result = fillingMetrics(fillingSamples(undefined, (p, _t, pv) => mode === "absent"
      ? Math.max(0, pv) : (p > .01 && p < .4 ? -30 : pv)));
    expect(result.values[fillingIds.pulmonaryArPeakMagnitudeMlPerSec]).toBeNull();
    expect(result.values[fillingIds.pulmonaryArDurationMs]).toBeNull();
    expect(result.values[fillingIds.mitralPeakEToA]).toBeCloseTo(2, 9);
  });

  it("does not relabel early S1 as S2 or a systolic-window endpoint as a peak", () => {
    for (const flow of [(p: number, pv: number) => p >= .22 && p <= .5 ? 0 : pv,
      (p: number, pv: number) => p >= .22 && p <= .5 ? 100 * p : pv]) {
      const result = fillingMetrics(fillingSamples(undefined, (p, _t, pv) => flow(p, pv)));
      expect(result.values[fillingIds.pulmonarySystolicPeakFlowMlPerSec]).toBeNull();
      expect(result.values[fillingIds.pulmonaryPeakSToD]).toBeNull();
      expect(result.values[fillingIds.pulmonaryDiastolicPeakFlowMlPerSec]).toBeCloseTo(100, 9);
    }
  });

  it("makes ratio/timing invariant to constant flow scaling, without inventing a velocity conversion", () => {
    const result = fillingMetrics(fillingSamples((_p, _t, mv) => mv * 3, (_p, _t, pv) => pv * 3));
    expect(result.values[fillingIds.mitralPeakEToA]).toBeCloseTo(2, 9);
    expect(result.values[fillingIds.mitralDecelerationTimeMs]).toBeCloseTo(200, 9);
    expect(result.values[fillingIds.pulmonaryPeakSToD]).toBeCloseTo(.8, 9);
    expect(result.values[fillingIds.pulmonaryArPeakMagnitudeMlPerSec]).toBeCloseTo(90, 9);
  });

  it("rejects incomplete cycles, epochs, invalid signals, non-monotone phase and missing 2-ms rows", () => {
    const source = fillingSamples();
    for (const samples of [source.slice(0, 1000), source.filter((_, i) => i !== 750),
      source.map((s, i) => i === 750 ? { ...s, inputEpoch: 2 } : s),
      source.map((s, i) => i === 750 ? { ...s, values: { ...s.values, [fillingInputs[1]]: Number.NaN } } : s),
      source.map((s, i) => i === 750 ? { ...s, values: { ...s.values, [fillingInputs[0]]: .4 } } : s)]) {
      expect(fillingMetrics(samples).status).toBe("unavailable");
    }
  });

  it.each([1, 16, 73, 512])("streams bounded complete filling sequences independent of packet size %i", size => {
    const samples = fillingSamples(), collector = new MainWireFillingFlowCollectorV1();
    const emissions: StudioSimulationAnalysisV2[] = [];
    for (let i = 0; i < samples.length; i += size) {
      const emission = collector.ingest(fillingBatch(samples.slice(i, i + size)));
      if (emission) emissions.push(emission);
    }
    expect(emissions).toHaveLength(2);
    expect(emissions.at(-1)?.payload).toEqual(fillingMetrics(samples));
    expect(emissions.at(-1)?.sourceAcceptedTimeSec).toBe(3);
  });

  it("invalidates on controls/gaps/invalid columns, recovers and bounds a noncycling input", () => {
    const source = fillingSamples();
    for (const mode of ["epoch", "gap", "signal", "flat-phase"] as const) {
      const collector = new MainWireFillingFlowCollectorV1();
      expect(collector.ingest(fillingBatch(source))?.payload).toMatchObject({ status: "available" });
      const last = source.at(-1)!;
      const invalid = Array.from({ length: mode === "flat-phase" ? 8_100 : 1 }, (_, index) => ({ ...last,
        inputEpoch: mode === "epoch" ? 2 : 1, acceptedRevision: last.acceptedRevision + index + 1,
        acceptedTimeSec: last.acceptedTimeSec + (index + 1) * .002 + (mode === "gap" ? .002 : 0),
        values: mode === "signal" ? { ...last.values, [fillingInputs[3]]: null } : last.values,
      }));
      expect(collector.ingest(fillingBatch(invalid))?.payload).toMatchObject({ status: "unavailable" });
      const tail = invalid.at(-1)!;
      const resumed = source.map(s => ({ ...s, inputEpoch: tail.inputEpoch,
        acceptedRevision: s.acceptedRevision + tail.acceptedRevision + 1,
        acceptedTimeSec: s.acceptedTimeSec + tail.acceptedTimeSec + .002 }));
      expect(collector.ingest(fillingBatch(resumed))?.payload).toMatchObject({ status: "available" });
    }
  });

  it("keeps nullable values independent and excludes another method, case, epoch or future result", () => {
    const samples = fillingSamples((p, _t, mv) => mv + (p < .18 || p > .6 ? 10 : 0));
    const batch = fillingBatch(samples), analysis = new MainWireFillingFlowCollectorV1().ingest(batch)!;
    const read = (value: StudioSimulationAnalysisV2, id = fillingIds.mitralPeakEToA as string) =>
      mainWireFillingFlowOutputValueV1([value], batch.terminalFrame, id);
    expect(read(analysis)).toMatchObject({ quality: "accepted-derived", availability: "available" });
    expect(read(analysis, fillingIds.mitralADurationMs)).toMatchObject({ quality: "not-assessed", value: null });
    expect(read(analysis, "unknown-output")).toBeUndefined();
    for (const override of [{ inputEpoch: 2 }, { scenarioId: "other" }, { runtimeSessionId: "other" }, { modelId: "other" },
      { sourceAcceptedRevision: 9999 }, { sourceAcceptedTimeSec: 99 }, { analysisId: MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID }])
      expect(read({ ...analysis, ...override })).toMatchObject({ quality: "not-assessed", value: null });
    for (const id of Object.values(fillingIds)) expect(batch.terminalFrame.outputs[id]).toBeUndefined();
  });
});

function fillingSamples(mitral?: (phase: number, time: number, flow: number) => number,
  pulmonary?: (phase: number, time: number, flow: number) => number): MainWireCardiacCycleAcceptedSampleV1[] {
  return Array.from({ length: 1701 }, (_, index) => {
    const time = index * .002, p = normalizedPhaseV1(time);
    const mv = triangularPulseV1(p, .6, .7, .9, 200) + triangularPulseV1(p, .02, .08, .18, time < 2 ? 50 : 100);
    const pv = triangularPulseV1(p, .192, .202, .212, 500) + triangularPulseV1(p, .26, .34, .48, 80)
      + triangularPulseV1(p, .56, .68, .85, 100) - triangularPulseV1(p, .01, .1, .19, 30);
    return { inputEpoch: 1, acceptedRevision: index, acceptedTimeSec: time, values: {
      [fillingInputs[0]]: p, [fillingInputs[1]]: mitral?.(p, time, mv) ?? mv,
      [fillingInputs[2]]: triangularPulseV1(p, .22, .35, .5, 100),
      [fillingInputs[3]]: pulmonary?.(p, time, pv) ?? pv,
    } };
  });
}

function fillingBatch(samples: readonly MainWireCardiacCycleAcceptedSampleV1[]) {
  return createStudioSimulationPresentationBatchV2(samples.map(s => ({
    modelId: "model/test", runtimeSessionId: "runtime/test", scenarioId: "scenario/test",
    inputEpoch: s.inputEpoch, acceptedRevision: s.acceptedRevision, acceptedTimeSec: s.acceptedTimeSec,
    outputs: Object.fromEntries(Object.entries(s.values).map(([outputId, value]) => [outputId, {
      outputId, value, availability: value === null ? "not-evaluated-at-accepted-state" as const : "available" as const,
      quality: value === null ? "not-assessed" as const : "authoritative-state" as const,
    }])),
  })), fillingInputs);
}
