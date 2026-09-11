import { describe, it, expect } from "vitest";
import { MAIN_WIRE_AS_REFERENCE_V1 as reference, MAIN_WIRE_AS_LOW_FLOW_REFERENCE_V1 as lowReference, validateMainWireAsReferenceV1 as validate, assessMainWireAsRestV1 as assess } from "@/analysis/policies/mainWire/MainWireAsReferenceV1";
import { resolveMainWireStaticCaseDefinitionV1 as definition } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import { withMainWireCaseSearchCoordinateV1 as update } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import { mainWireAorticJetVelocityV1 as velocity, observeMainWireAorticJetV1 as observe } from "@/analysis/methods/mainWire/MainWireAorticJetObservationV1";
import { evaluateMainWireQuasiSteadyOrificeValveV2 as evaluate, MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 as rho,
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2 as pa } from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import { MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1 as valves } from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { registryCaseAssessmentRowsV1 as rowsFor, registryCaseSourcesV1 as sourcesFor,
  registryCaseNarrativeV1 as narrative } from "@/tools/modelDocumentation/authoring/RegistryCaseAssessmentRowsV1";
import { compareMainWireDiseasePairedMetricV1 as pairedMetric } from "@/analysis/methods/mainWire/MainWireHfrefCaseQualificationV1";
import { resolveStudioItemPresentationV1 as presentation } from "@/studio/presentation/StudioItemPresentationCatalogV1";

const id = "as-high-gradient-valve-only-v1";
const lowId = "as-low-flow-reduced-ef-v1";
describe("source-backed high-gradient AS construction", () => {
  it("allows only the declared valve lesion without weakening baseline/HFrEF input scope", () => {
    const c = update(seed("baseline"), "aortic-area", .75);
    expect(definition(id).ownInputs(c)).toEqual(c);
    expect(() => definition("baseline").ownInputs(c)).toThrow(/valve/);
    const mr = { ...c, mechanismResearchInputs: { ...c.mechanismResearchInputs, valveAreas: { ...c.mechanismResearchInputs.valveAreas,
      MV: { ...c.mechanismResearchInputs.valveAreas.MV, closedReverseEroaCm2: .2 } } } };
    expect(() => definition(id).ownInputs(mr)).toThrow(/valve/);
    expect(() => definition(id).ownInputs(seed("hfref-chronic-dilated-v1"))).toThrow(/anatomy/);
    expect(() => update(c, "aortic-area", .1)).toThrow(/domain/);
    expect(() => definition(id).ownInputs(update(c, "lv-active", 1.1))).toThrow(/Valve-only/);
    expect(() => definition(id).ownInputs(update(c, "tbv", c.hemodynamicResearchInputs.totalBloodVolumeMl + 100))).toThrow(/Valve-only/);
    expect(() => definition(lowId).ownInputs(update(seed("hfref-chronic-dilated-v1"), "aortic-area", .8))).not.toThrow();
    expect(() => definition(lowId).ownInputs(c)).toThrow(/anatomy/);
  });
  it("requires provenance and does not force contextual AT, tau or filling pressure into the gate", () => {
    const copy = { ...reference, restScreen: reference.restScreen.map((r, i) => i ? r : { ...r, sourceIds: [] }) };
    expect(() => validate(copy)).toThrow(/provenance/);
    const construction = structuredClone(reference); construction.construction.sourceIds = [];
    expect(() => validate(construction)).toThrow(/provenance/);
    const values = { avEffectiveAreaCm2: .75, avVmax: 4.5, avBernoulliMeanGradient: 45, lvef: .55, forwardSvi: 40 };
    expect(assess({ values })).toMatchObject({ screenPassed: true, preferredTargetsMet: true });
    expect(assess({ values: { ...values, avBernoulliMeanGradient: 25 } }).screenPassed).toBe(false);
    expect(assess({ values: { ...values, forwardSvi: null } })).toMatchObject({ screenPassed: true, preferredTargetsMet: false, preferenceStatus: "unresolved" });
    expect(assess({ values: { ...values, lvef: null } }).ranking).not.toBeNull();
    expect(assess({ values: { ...values, forwardSvi: 35 } }).preferredTargetsMet).toBe(false);
    expect(assess({ values: { ...values, avBernoulliMeanGradient: 60 } }).preferredTargetsMet).toBe(false);
    expect(assess({ values: { ...values, avVmax: 7, avBernoulliMeanGradient: 110 } }).screenPassed).toBe(true);
    expect(assess({ values: { ...values, avEffectiveAreaCm2: 0 } }).screenPassed).toBe(false);
  });
  it("uses the low-flow reference's own strict boundaries, without inherited healthy or HFrEF gates", () => {
    const values = { avEffectiveAreaCm2: .8, avVmax: 3, avBernoulliMeanGradient: 25, lvef: .3, forwardSvi: 30 };
    expect(assess({ values }, lowReference)).toMatchObject({ screenPassed: true, preferredTargetsMet: true });
    for (const change of [{ lvef: .5 }, { avBernoulliMeanGradient: 40 }, { forwardSvi: 35.01 }, { avVmax: 4 }, { lvef: 0 }])
      expect(assess({ values: { ...values, ...change } }, lowReference).screenPassed).toBe(false);
    expect(assess({ values: { ...values, forwardSvi: 35 } }, lowReference).screenPassed).toBe(true);
    expect(assess({ values: { ...values, lvef: null } }, lowReference).ranking).toBeNull();
    const excluded = assess({ values: { ...values, lvef: .5 } }, lowReference).screen.find(r => r.metricId === "lvef")!;
    expect(excluded.normalizedError).toBeGreaterThan(1e-9);
  });
  it("requires all teaching targets without turning their corridors into clinical classification limits", () => {
    const values = { avEffectiveAreaCm2: .8, avVmax: 3, avBernoulliMeanGradient: 25, lvef: .3, forwardSvi: 30 };
    for (const patch of [{ avBernoulliMeanGradient: 17.5 }, { forwardSvi: 24 }]) {
      const a = assess({ values: { ...values, ...patch } }, lowReference);
      expect(a).toMatchObject({ screenPassed: true, preferredTargetsMet: false });
    }
    for (const r of [reference, lowReference]) {
      expect(r.fittingTargets.find(t => t.priority === 1)!.rationale).toContain("任意条件という意味ではない");
      expect(r.sources.find(s => s.sourceId === "esc-eacts-as-2025")!.locator).toContain("Section 8.2.1");
    }
  });
  it("compares event resolution and high gradients without accepting larger numerical discrepancies", () => {
    expect(pairedMetric("etMs", 313.0000000000047, 310.0000000000023)).toMatchObject({ tolerance: 3, passed: true });
    expect(pairedMetric("avAccelerationTimeMs", 113.0001, 110).passed).toBe(false);
    expect(pairedMetric("avBernoulliMeanGradient", 63.575, 63).passed).toBe(true);
    expect(pairedMetric("avBernoulliMeanGradient", 64, 63).passed).toBe(false);
    expect(pairedMetric("avBernoulliMeanGradient", 4.51, 4).passed).toBe(false);
    expect(pairedMetric("meanAo", 100.51, 100).passed).toBe(false);
    expect(pairedMetric("lvef", .51, .5).passed).toBe(false);
    expect(pairedMetric("etMs", null, 310).passed).toBe(false);
  });
  it.each(["ja", "en"] as const)("explains the actual construction and the EF boundary in %s", locale => {
    const result = { candidateInputs: update(seed("baseline"), "aortic-area", .8), rest: { referenceId: id, status: "passed",
      observation: { values: { lvef: .5015, avVmax: 4.15, avBernoulliMeanGradient: 48.2, forwardSvi: 41.1,
        etMs: 294, avAccelerationTimeMs: 92, avAtEt: .313, meanLa: 10, weissTauMs: 33.2 } } } } as never;
    const text = narrative(result, locale).join(" ");
    expect(text).toContain("50.15"); expect(text).toContain("0.80"); expect(text).toContain("1.00");
    expect(text).toContain(locale === "ja" ? "EF保持を採用条件にしていません" : "not a preserved-EF selection requirement");
    expect(text).toContain(locale === "ja" ? "全項目の通過" : "Every operating target must pass");
    expect(text).toContain(locale === "ja" ? "臨床Dopplerの時間基準との一致は未検証" : "clinical Doppler timing has not been validated");
    for (const itemId of ["hemodynamics.duration.jet-acceleration.AoV", "hemodynamics.ratio.jet-AT-to-ET.AoV"]) {
      const item = presentation({ kind: "output", itemId, fallbackEnglishLabel: "test", locale });
      expect(item.description).toContain(locale === "ja" ? "未検証" : "not been validated");
    }
    for (const kind of ["mean", "peak"]) {
      const item = presentation({ kind: "output", itemId: `hemodynamics.pressure-gradient.${kind}-bernoulli-jet.AoV`,
        fallbackEnglishLabel: "test", locale });
      expect(item.description.toLowerCase()).toContain(locale === "ja" ? "ほぼ同じ" : "nearly equals");
      expect(item.description).toContain(locale === "ja" ? "測定差は再現しません" : "gap");
    }
  });
  it("describes low-flow active-tension inputs without assuming every allowed scale is reduced", () => {
    const c = update(update(seed("hfref-chronic-dilated-v1"), "aortic-area", .8), "lv-active", 1.1);
    expect(() => definition(lowId).ownInputs(c)).not.toThrow();
    const result = { candidateInputs: c, rest: { referenceId: lowId, status: "passed",
      observation: { values: { lvef: .3 } } } } as never;
    const text = narrative(result, "en").join(" ");
    expect(text).toContain("1.10"); expect(text).not.toContain("reduced active tension");
  });
  it("reconstructs the accepted-state jet using active EOA, not the maximum opening area", () => {
    for (const area of [.5, .75, 3.5]) for (const opening of [.1, .5, 1]) {
      const state = { leafletOpeningFraction01: opening }, params = { ...valves.valves.AoV, maximumForwardEoaCm2: area };
      const e = evaluate(state, { dtSec: .002, upstreamPressureMmHg: 160, downstreamPressureMmHg: 80 }, state, params);
      expect(Number.isFinite(e.flowMlPerSec)).toBe(true);
      expect(velocity(160, 80, e.flowMlPerSec)).toBeCloseTo(e.flowMlPerSec / (100 * e.activeEoaCm2), 10);
      if (opening < 1) expect(velocity(160, 80, e.flowMlPerSec)).toBeGreaterThan(e.flowMlPerSec / (100 * area));
    }
    expect(velocity(50, 80, 0)).toBe(0);
    expect(() => velocity(50, 80, 10)).toThrow(/law/);
  });
  it("integrates instantaneous 4v² over forward flow and rejects incomplete episodes", () => {
    const area = .75, resistance = valves.valves.AoV.backgroundLinearResistanceMmHgSecPerMl;
    const samples = Array.from({ length: 501 }, (_, i) => {
      const t = i * .002, q = t > .1 && t < .4 ? 300 * Math.sin(Math.PI * (t - .1) / .3) : 0;
      const v = q / (100 * area);
      return { acceptedTimeSec: t, acceptedDtSec: .002, absolutePressureMmHg: { LV: 80 + resistance * q + rho / (2 * pa) * v ** 2, Ao: 80 }, valveFlowMlPerSec: { AoV: q } };
    });
    const forwardVolumeMl = samples.reduce((sum, p, i) => i ? sum + .001 * (samples[i - 1]!.valveFlowMlPerSec.AoV + p.valveFlowMlPerSec.AoV) : 0, 0);
    const beat = { startTimeSec: 0, endTimeSec: 1, valveForwardPressureGradients: { AoV: { forwardFlowDurationSec: .3 } }, valveFlowVolumes: { AoV: { forwardVolumeMl } } } as never;
    const result = observe(beat, samples, 1.9);
    expect(result.values.avVmax).toBeCloseTo(4, 10);
    expect(result.values.avBernoulliPeakGradient).toBeCloseTo(64, 10);
    expect(result.values.avBernoulliMeanGradient).toBeCloseTo(32, 8);
    expect(result.values.avEffectiveAreaCm2).toBeCloseTo(area, 10);
    expect(result.values.avAtEt).toBeCloseTo(.5, 10);
    expect(() => observe(beat, samples.slice(90), 1.9)).toThrow(/complete/);
  });
  it.each(["ja", "en"] as const)("keeps AS-specific methods and provenance in %s documentation", locale => {
    const assessment = assess({ values: { avEffectiveAreaCm2: .75, avVmax: 4.5, avBernoulliMeanGradient: 45, lvef: .55, forwardSvi: 40 } });
    const rows = rowsFor({ rest: { referenceId: id, status: "passed", assessment } } as never, {}, locale);
    expect(rows).toHaveLength(5); expect(rows.every(r => r.sources.length > 0)).toBe(true);
    expect(rows.find(r => r.id === "screen.avVmax")?.unit).toBe("m/s");
    expect(sourcesFor(id, locale).some(s => s.id.includes("hfref") || s.id.includes("dcm"))).toBe(false);
    const lowAssessment = assess({ values: { avEffectiveAreaCm2: .8, avVmax: 3, avBernoulliMeanGradient: 25, lvef: .3, forwardSvi: 30 } }, lowReference);
    const lowRows = rowsFor({ rest: { referenceId: lowId, status: "passed", assessment: lowAssessment } } as never, {}, locale);
    expect(lowRows).toHaveLength(7); expect(lowRows.every(r => r.sources.length > 0)).toBe(true);
    expect(lowRows.find(r => r.id === "screen.lvef")!.ranges[0]!.upperInclusive).toBe(false);
    expect(sourcesFor(lowId, locale).length).toBeGreaterThanOrEqual(4);
  });
});
