import { describe, expect, it } from "vitest";
import { resolveKnobEdit, resolveRawEdit, rawDisplayParams, type KnobState } from "@/engine/instanceKnobs";
import { KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
import { defaultParams } from "@/engine/ModelCore";

const V = KNOB_MAPPING_VERSION;

describe("knob-primary instance reducers (compose semantics)", () => {
  it("raw edit then clinical knob compose without double-count or loss", () => {
    const base = defaultParams();
    // 1) Raw SVR edit on a legacy (no-knob) instance -> direct param edit.
    let s: KnobState = resolveRawEdit({ params: base }, { systemicResistance: 2.0 }, V);
    expect(s.params.systemicResistance).toBeCloseTo(2.0, 9);
    expect(s.knobs).toBeUndefined();
    // 2) Now move the Afterload knob to 1.3 -> the prior raw edit becomes the
    //    baseline, and afterload multiplies on top (no loss, no double-count).
    s = resolveKnobEdit(s, { ...neutralKnobs(s.params), afterload: 1.3 }, V);
    expect(s.knobBaseline!.systemicResistance).toBeCloseTo(2.0, 9);
    expect(s.params.systemicResistance).toBeCloseTo(2.0 * 1.3, 9);
  });

  it("routes a raw absolute-knob edit (HR) to the knob so it is NOT a dead no-op", () => {
    const base = defaultParams();
    const primary = resolveKnobEdit({ params: base }, { ...neutralKnobs(base), afterload: 1.5 }, V);
    // A raw HR edit on a knob-primary instance must actually change HR.
    const after = resolveRawEdit(primary, { HR: 120 }, V);
    expect(after.knobs!.HR).toBe(120);
    expect(after.params.HR).toBe(120); // live value follows, not re-pinned to the old knob HR
  });

  it("a raw multiplier edit lands on the baseline (display uses baseline, no jump)", () => {
    const base = defaultParams();
    const primary = resolveKnobEdit({ params: base }, { ...neutralKnobs(base), afterload: 2.0 }, V);
    const after = resolveRawEdit(primary, { systemicResistance: 1.6 }, V);
    expect(after.knobBaseline!.systemicResistance).toBeCloseTo(1.6, 9); // what the user set
    // rawDisplayParams shows the baseline value for the slider (not the derived 3.2).
    expect(rawDisplayParams(after).systemicResistance).toBeCloseTo(1.6, 9);
  });

  it("returning diastolicStiffness to neutral CLEARS the b_pas override (no stale stiffness)", () => {
    const base = defaultParams();
    const stiff = resolveKnobEdit({ params: base }, { ...neutralKnobs(base), diastolicStiffness: 2.5 }, V);
    expect((stiff.params.nodeOverrides?.LV?.active as Record<string, number>)?.bPas).toBeGreaterThan(base ? 0 : 0);
    const back = resolveKnobEdit(stiff, { ...neutralKnobs(base), diastolicStiffness: 1 }, V);
    // The override key is present (so the live merge clears it) and carries no
    // stiffness — the live core un-stiffens instead of retaining the old override.
    expect("nodeOverrides" in back.params).toBe(true);
    expect(back.params.nodeOverrides).toBeUndefined();
  });

  it("rawDisplayParams reflects absolute knobs from the derived params", () => {
    const base = defaultParams();
    const primary = resolveKnobEdit({ params: base }, { ...neutralKnobs(base), HR: 100, afterload: 1.5 }, V);
    const view = rawDisplayParams(primary);
    expect(view.HR).toBe(100); // absolute knob shown from derived params
    expect(view.systemicResistance).toBeCloseTo(base.systemicResistance, 9); // baseline (knob multiplies separately)
  });
});
