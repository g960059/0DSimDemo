import { describe, expect, it } from "vitest";
import {
  effectiveKnobs,
  INTERVENTIONS,
  KNOB_MAPPING_VERSION,
  resolveInstance,
  type CaseInstanceSpec,
} from "@/engine/caseResolve";
import { OFFICIAL_BASELINES } from "@/engine/caseBaselines";
import { defaultParams } from "@/engine/ModelCore";
import type { CoreRuntimeParams } from "@/engine/protocol";

const V = KNOB_MAPPING_VERSION;
const neutralInstance = (over: Partial<CaseInstanceSpec> = {}): CaseInstanceSpec => ({
  baseline: "active-normal",
  knobs: {},
  interventions: [],
  rawPatch: {},
  ...over,
});

describe("engine case resolution (#3-a)", () => {
  it("stamps the current active-stress mapping version", () => {
    expect(KNOB_MAPPING_VERSION).toBe("knobmap-0.3-activestress");
  });

  it("a neutral instance resolves back to the baseline params + TBV", () => {
    const r = resolveInstance(neutralInstance(), OFFICIAL_BASELINES, V);
    expect(r.params).toEqual(defaultParams());
    expect(r.targetVolume).toBe(5600);
  });

  it("throws (no silent fallback) on an unknown knobMappingVersion", () => {
    expect(() => resolveInstance(neutralInstance(), OFFICIAL_BASELINES, "knobmap-9.9-bogus")).toThrow(/Unknown knobMappingVersion/);
  });

  it("throws on an unknown baseline id (no silent substitute)", () => {
    expect(() => resolveInstance(neutralInstance({ baseline: "nope" }), OFFICIAL_BASELINES, V)).toThrow(/Unknown baseline/);
  });

  it("knob overrides resolve through to raw params (LV contractility -> lvTmaxScale)", () => {
    const base = defaultParams();
    const r = resolveInstance(neutralInstance({ knobs: { contractility: 0.6 } }), OFFICIAL_BASELINES, V);
    expect(r.params.lvTmaxScale).toBeCloseTo(base.lvTmaxScale * 0.6, 9);
  });

  it("interventions compose in knob space (dobutamine raises inotropy)", () => {
    const base = defaultParams();
    const inst = neutralInstance({ interventions: [{ uid: "i1", id: "dobutamine", args: { dose: 10 } }] });
    const k = effectiveKnobs(inst, base);
    expect(k.contractility).toBeCloseTo(1 + 0.05 * 10, 9); // *1.5
    const r = resolveInstance(inst, OFFICIAL_BASELINES, V);
    expect(r.params.lvTmaxScale).toBeGreaterThan(base.lvTmaxScale);
  });

  it("volume interventions fold into targetVolume", () => {
    const r = resolveInstance(neutralInstance({ interventions: [{ uid: "i1", id: "fluidBolus", args: { mL: 500 } }] }), OFFICIAL_BASELINES, V);
    expect(r.targetVolume).toBe(5600 + 500);
  });

  it("rawPatch is absolute and wins over the resolved knobs", () => {
    const r = resolveInstance(neutralInstance({ knobs: { afterload: 1.5 }, rawPatch: { systemicResistance: 2.0 } }), OFFICIAL_BASELINES, V);
    expect(r.params.systemicResistance).toBeCloseTo(2.0, 9); // rawPatch, not base*1.5
  });

  it("rawPatch nodeOverrides DEEP-merge with knob-driven overrides (rawPatch leaf wins, others survive)", () => {
    // diastolicStiffness emits nodeOverrides.LV/RV.active.bPas. A rawPatch that
    // edits a DIFFERENT active leaf must not erase the knob-driven b_pas.
    const r = resolveInstance(
      neutralInstance({
        knobs: { diastolicStiffness: 2.0 },
        rawPatch: { nodeOverrides: { LV: { V0: 12 } } } as Partial<CoreRuntimeParams>,
      }),
      OFFICIAL_BASELINES,
      V,
    );
    const lv = r.params.nodeOverrides?.LV as Record<string, unknown>;
    expect((lv?.active as Record<string, number>)?.bPas).toBeGreaterThan(0); // knob override survived
    expect(lv?.V0).toBe(12);                                                  // rawPatch leaf applied
    expect((r.params.nodeOverrides?.RV?.active as Record<string, number>)?.bPas).toBeGreaterThan(0); // RV survived
  });

  it("fluidBolus applies BOTH its volumeDelta AND its venousTone knob bump", () => {
    const inst = neutralInstance({ interventions: [{ uid: "i1", id: "fluidBolus", args: { mL: 500 } }] });
    const base = defaultParams();
    expect(effectiveKnobs(inst, base).venousTone).toBeCloseTo(base.venousTone + 0.0001 * 500, 9);
    expect(resolveInstance(inst, OFFICIAL_BASELINES, V).targetVolume).toBe(5600 + 500);
  });

  it("a malformed intervention arg falls back to default, never NaN", () => {
    const inst = neutralInstance({ interventions: [{ uid: "i1", id: "dobutamine", args: { dose: "abc" } }] });
    const k = effectiveKnobs(inst, defaultParams());
    expect(Number.isFinite(k.contractility)).toBe(true);
    expect(k.contractility).toBeCloseTo(1 + 0.05 * 5, 9); // dose defaults to 5
    // an unknown severity enum defaults to moderate (not a silent no-op via NaN)
    const as = neutralInstance({ interventions: [{ uid: "i2", id: "aorticStenosis", args: { severity: "typo" } }] });
    expect(effectiveKnobs(as, defaultParams()).aorticStenosis).toBe(0.66); // SEV.moderate, not NaN/no-op
  });

  it("the valve-lesion intervention wrapper sets the severity knob", () => {
    const inst = neutralInstance({ interventions: [{ uid: "i1", id: "aorticStenosis", args: { severity: "severe" } }] });
    expect(effectiveKnobs(inst, defaultParams()).aorticStenosis).toBe(1.0);
    expect(INTERVENTIONS.aorticStenosis.tier).toBe("teaching");
  });
});
