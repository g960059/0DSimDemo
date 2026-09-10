import { describe, expect, it } from "vitest";
import raw from "@/data/physiology/main-wire-hfref-reference-v1.json";
import bundle from "@/data/model-releases/standard73/bundle.json";
import { resolveMainWireFittingReferenceV1 as reference } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { validateMainWireHfrefReferenceV1 as validate, assessMainWireHfrefRestV1 as assess } from "@/analysis/policies/mainWire/MainWireHfrefReferenceV1";
import { readMainWireHfrefBeatV1 as readBeat, observeMainWireHfrefTimingContextV1 as context } from "@/analysis/methods/mainWire/MainWireHfrefObservationV1";
import { observeMainWireBaselineV2 as observe } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
const beat = () => structuredClone(bundle.baseline.capture.checkpoint.payload.base.completedBeatMetrics) as Mutable<Beat>;
const values = { lvef: .3, lvedvi: 120, ci: 2.52, meanLa: 14, meanRa: 5, meanAo: 80 };

describe("source-backed HFrEF construction, separate from healthy adoption", () => {
  it("registers all criterion provenance and preserves the baseline target", () => {
    expect(() => validate(raw)).not.toThrow();
    expect(reference("baseline").target.kind).toBe("construction-corridors");
    expect(reference("hfref-lv-systolic-v1").target.evidence).toEqual(raw);
    expect(() => reference("toString")).toThrow(/unregistered/);
    expect(Object.isFrozen(reference("hfref-lv-systolic-v1").target.evidence.restScreen)).toBe(true);
    const copy = structuredClone(raw); copy.restScreen[0]!.sourceIds = [];
    expect(() => validate(copy)).toThrow(/provenance/);
    copy.restScreen[0]!.sourceIds = ["invented"];
    expect(() => validate(copy)).toThrow(/provenance/);
    copy.restScreen[0]!.sourceIds = raw.restScreen[0]!.sourceIds;
    copy.fittingTargets[0]!.upper = .5;
    expect(() => validate(copy)).toThrow(/inside/);
  });
  it("keeps screening, target residuals, context and publication distinct", () => {
    const r = assess({ ...values, positiveDpDt: 2900, flowEToA: .6, weissTauMs: null });
    expect(r).toMatchObject({ status: "passed", screenPassed: true, preferredTargetsMet: true,
      ranking: [0, 0, 0, 0], finalQualification: "not-performed", publicPromotionAuthorized: false });
    const marginal = assess({ ...values, lvef: .39 });
    expect(marginal.screenPassed).toBe(true); expect(marginal.preferredTargetsMet).toBe(false);
    expect(marginal.targets.find(t => t.metricId === "lvef")!.normalizedError).toBeCloseTo(.4);
    expect(assess({ ...values, ci: 3.0 }).screenPassed).toBe(true); // low CI is NOT a disease requirement
    expect(assess({ ...values, meanLa: 8 }).screenPassed).toBe(true); // nor mandatory resting congestion
    expect(assess({ ...values, lvef: .401 }).screenPassed).toBe(false);
  });
  it("fails closed for every missing/nonfinite screen observation", () => {
    for (const rule of raw.restScreen) for (const invalid of [null, NaN, Infinity]) {
      expect(assess({ ...values, [rule.metricId]: invalid })).toMatchObject({
        status: "unresolved", screenPassed: false, ranking: null });
    }
    expect(assess({}).status).toBe("unresolved");
  });
  it("records the Patel table/abstract discrepancy without turning timing context into a gate", () => {
    const source = raw.sources.find(s => s.sourceId === "patel-2020-timing")!;
    expect(source.observations).toMatchObject({ relaxationTimeMs: { median: 93.3, q1: 67.3, q3: 122 } });
    expect(source.limitations).toContain("原著内に不一致");
    expect([...raw.restScreen, ...raw.fittingTargets].some(r => r.metricId === "irtMs")).toBe(false);
  });
  it("uses a worst auxiliary interval error, never a sum of dependent measurements", () => {
    const r = assess({ ...values, lvedvi: 90, ci: 2.05 });
    expect(r.ranking![3]).toBeCloseTo(.25);
    expect(r.targets.map(t => t.metricId)).toEqual(["lvef", "lvedvi", "ci"]);
    expect(raw.interpretation.dependencies).toContain("0.07");
  });
  it("observes native closures and signed net flow and reports their algebraic coupling", () => {
    const b = beat();
    const lv = b.leftVentricularValveEventMetrics;
    lv.endDiastolic!.volumeMl = 228; lv.endSystolic!.volumeMl = 159.6;
    for (const id of ["AoV", "PV"] as const) b.valveFlowVolumes[id] = {
      forwardVolumeMl: 68.4, reverseVolumeMl: 0, netVolumeMl: 68.4, sameValveRegurgitantFraction: 0 };
    const m = readBeat(b);
    expect(m.values.lvef).toBeCloseTo(.3); expect(m.values.ci).toBeCloseTo(2.52);
    expect(m.values.ciMinusHrTimesEfEdvi).toBeCloseTo(0);
    b.valveFlowVolumes.AoV.reverseVolumeMl = 8;
    b.valveFlowVolumes.AoV.netVolumeMl = 60.4;
    expect(readBeat(b).values.ci).toBeLessThan(m.values.ci!);
    b.leftVentricularValveEventMetrics.endSystolic = null;
    expect(() => readBeat(b)).toThrow(/closure/);
  });
  it("does not label the current healthy baseline as HFrEF", () => {
    expect(assess(readBeat(beat()).values).screenPassed).toBe(false);
  });
  it("retains unresolved inflow peaks as context without hiding corrupt raw flow", () => {
    // Synthetic timing-only fixture: no claim about a simulated patient.
    const b = beat(); b.startTimeSec = 0; b.endTimeSec = 1; b.durationSec = 1; b.endAtrialCaptureId = "end";
    for (const v of [b.leftVentricularValveEventMetrics, b.rightVentricularValveEventMetrics]) {
      v.endDiastolic!.timeSec = .1; v.endSystolic!.timeSec = .5;
    }
    b.valveForwardPressureGradients.AoV.forwardFlowDurationSec = .3;
    b.valveForwardPressureGradients.PV.forwardFlowDurationSec = .3;
    const knots = [[.15, 0, 0], [.2, 0, 0], [.3, 100, 0], [.4, 150, 0], [.5, 0, 0],
      [.6, 0, 0], [.7, 0, 8], [.8, 0, 2], [.9, 0, 2], [1, 0, 2], [1.1, 0, 1], [1.2, 0, 0]];
    const samples = knots.map(([t, outflow, inflow], i) => ({ acceptedTimeSec: t!,
      acceptedDtSec: t! - (knots[i - 1]?.[0] ?? .1),
      valveFlowMlPerSec: { MV: inflow!, TV: inflow!, AoV: outflow!, PV: outflow! },
      acceptedEventIdentity: { atrialCapturedActivationId: t === 1 ? "end" : null } }));
    expect(() => observe({ samples, completedBeat: b })).toThrow();
    expect(context(samples, b)).toMatchObject({ observation: null, issue: { code: "unresolved-a-wave" } });
    expect(assess({ ...values, flowEToA: null }).screenPassed).toBe(true);
    samples[4]!.valveFlowMlPerSec.MV = NaN;
    expect(() => context(samples, b)).toThrow(/invalid|nonfinite/);
  });
});
