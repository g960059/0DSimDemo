import { describe, expect, it } from "vitest";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from
  "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { compareMainWireRestingReferencesV1 as compare } from
  "@/analysis/methods/mainWire/MainWireRestingReferenceComparisonV1";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1 as profile } from
  "@/analysis/registry/MainWireRestingReferenceProfileV1";
import evidence from "@/data/physiology/main-wire-normal-reference-evidence-v1.json";

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
function fixture(): Mutable<Beat> {
  const landmarks = (inlet: string, outlet: string) => ({ inletValveId: inlet, semilunarValveId: outlet,
    endDiastolic: { event: "valve-closure-zero-flow-crossing", valveId: inlet, timeSec: 10.1,
      volumeMl: 145, absolutePressureMmHg: 11, transmuralPressureMmHg: 11 },
    endSystolic: { event: "valve-closure-zero-flow-crossing", valveId: outlet, timeSec: 10.5,
      volumeMl: 60, absolutePressureMmHg: 100, transmuralPressureMmHg: 100 } });
  // Synthetic consumed fields only, not a registered candidate or launch.
  return { startTimeSec: 10, endTimeSec: 11, durationSec: 1,
    pressureSummaries: Object.fromEntries(Object.entries({ Ao: 90, PA: 18, PVein: 12, LA: 8, RA: 3 })
      .map(([key, mean]) => [key, { timeWeightedMeanMmHg: mean, minimumMmHg: mean - 8, maximumMmHg: mean + 10 }])),
    valveFlowVolumes: { AoV: { forwardVolumeMl: 95, reverseVolumeMl: 0, netVolumeMl: 95 },
      PV: { forwardVolumeMl: 95, reverseVolumeMl: 0, netVolumeMl: 95 } },
    leftVentricularValveEventMetrics: landmarks("MV", "AoV"), rightVentricularValveEventMetrics: landmarks("TV", "PV"),
    valveForwardPressureGradients: { AoV: { forwardFlowDurationSec: .3 }, PV: { forwardFlowDurationSec: .32 } },
  } as Mutable<Beat>;
}
const entry = (result: ReturnType<typeof compare>, id: string) => result.entries.find(e => e.metricId === id)!;

describe("same-method resting reference comparisons", () => {
  it("covers all 16 unresolved target observations plus mean PAP without replacing their gates", () => {
    const required = evidence.checkGroups.filter(g => g.evaluationRole === "physiological-target").flatMap(g => g.checkIds);
    const ids = profile.entries.map(e => e.metricId);
    expect(required).toHaveLength(16);
    expect(new Set(ids).size).toBe(17);
    expect(required.every(id => profile.entries.some(e => (e.historicalCheckId ?? e.metricId) === id))).toBe(true);
    expect(profile.entries.every(e => evidence.sources.some(s => s.sourceId === e.sourceId))).toBe(true);
    const r = compare(fixture(), 1.9);
    expect(r.admissionDecision).toBe("not-performed");
    expect(r.observationApplicabilityEstablished).toBe(false);
    expect(r.physiologicalNormalityClaimed).toBe(false);
  });

  it("keeps both anatomical CMR strata and derives EF from native closure volumes", () => {
    const b = fixture();
    b.leftVentricularValveEventMetrics.endSystolic!.volumeMl = 70.3; // ESVi37: male interval only.
    b.leftVentricularValveEventMetrics.eventDefinedEjectionFraction01 = .99; // ignored redundant field.
    const r = compare(b, 1.9), esv = entry(r, "left-ventricle.esv-index");
    expect(esv.actual).toBeCloseTo(37);
    expect(esv.comparisons.map(c => c.status)).toEqual(["inside-source-range", "outside-source-range"]);
    expect(entry(r, "left-ventricle.ejection-fraction").actual).toBeCloseTo((145 - 70.3) / 145);
    expect(profile.subject.sex).toBe("unspecified");
    expect(profile.subject.age).toBe("unspecified");
  });

  it("keeps absent bounds absent and a small PAP exceedance outside without epsilon", () => {
    const b = fixture(); b.pressureSummaries.PA.minimumMmHg = 12.00001;
    const r = compare(b, 1.9);
    expect(entry(r, "pulmonary-artery-pressure.minimum").comparisons[0]!.status).toBe("outside-source-range");
    expect(entry(r, "aortic-pressure.minimum").comparisons).toEqual([]);
    expect(entry(r, "pulmonary-valve.ejection-time").comparisons).toEqual([]);
    expect(entry(r, "pcwp-surrogate.mean").comparisons[0]!.range.lower).toBeNull();
    expect(entry(r, "pcwp-surrogate.mean").comparisons[0]!.status).toBe("not-above-source-upper-limit");
    const a = entry(r, "aortic-pressure.maximum");
    expect(a.role).toBe("method-context");
    expect(a.comparisons).toHaveLength(12);
    expect(a.comparisons.every(c => c.statistic === "published-10th-90th-percentiles")).toBe(true);
  });

  it("uses signed flow and distinguishes the HR-conditional interval from the published SVI range", () => {
    const b = fixture(); b.valveFlowVolumes.AoV.reverseVolumeMl = 19; b.valveFlowVolumes.AoV.netVolumeMl = 76;
    const r = compare(b, 1.9);
    expect(entry(r, "systemic-net-flow.cardiac-index").actual).toBeCloseTo(2.4);
    expect(entry(r, "systemic-net-flow.stroke-volume-index").actual).toBe(40);
    expect(r.flowCoupling.ciMinusHrTimesSviOver1000).toBeCloseTo(0);
    expect(r.flowCoupling.ciConditionalSviIntervalMlPerM2.lower).toBeCloseTo(2500 / 60);
    expect(r.flowCoupling.conditionalIntervalIsPublishedSviReference).toBe(false);
    expect(r.flowCoupling.forwardMinusNetCi).toBeCloseTo(.6);
  });

  it("leaves missing native end-systolic landmarks unavailable, not volume-extrema fallback", () => {
    const b = fixture(); b.leftVentricularValveEventMetrics.endSystolic = null;
    const e = entry(compare(b, 1.9), "left-ventricle.edv-index");
    expect(e.actual).toBeNull();
    expect(e.comparisons.every(c => c.status === "unavailable")).toBe(true);
  });

  it.each([0, 2, NaN, Infinity])("rejects undeclared or invalid BSA %s", bsa => {
    expect(() => compare(fixture(), bsa)).toThrow();
  });
  it("rejects malformed consumed fields and unsupported heart rates", () => {
    const changes = [
      (b: Mutable<Beat>) => { b.durationSec = .8; b.endTimeSec = 10.8; },
      (b: Mutable<Beat>) => { b.pressureSummaries.Ao.maximumMmHg = NaN; },
      (b: Mutable<Beat>) => { b.pressureSummaries.Ao.minimumMmHg = 120; },
      (b: Mutable<Beat>) => { b.valveForwardPressureGradients.PV.forwardFlowDurationSec = 0; },
      (b: Mutable<Beat>) => { b.rightVentricularValveEventMetrics.endSystolic!.timeSec = 12; },
      (b: Mutable<Beat>) => { b.rightVentricularValveEventMetrics.endSystolic!.volumeMl = Infinity; },
      (b: Mutable<Beat>) => { b.rightVentricularValveEventMetrics.endSystolic!.valveId = "AoV"; },
    ];
    for (const corrupt of changes) { const b = fixture(); corrupt(b); expect(() => compare(b, 1.9)).toThrow(); }
  });
});
