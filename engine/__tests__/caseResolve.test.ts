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
    expect(KNOB_MAPPING_VERSION).toBe("knobmap-0.2-activestress");
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

  it("the valve-lesion intervention wrapper sets the severity knob", () => {
    const inst = neutralInstance({ interventions: [{ uid: "i1", id: "aorticStenosis", args: { severity: "severe" } }] });
    expect(effectiveKnobs(inst, defaultParams()).aorticStenosis).toBe(1.0);
    expect(INTERVENTIONS.aorticStenosis.tier).toBe("teaching");
  });
});
