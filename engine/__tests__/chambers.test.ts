import { describe, expect, it } from "vitest";
import { runScenario } from "@/engine/harness";
import { DEFAULT_PARAMS } from "@/constants";

/**
 * Guards for the S2a ChamberModel extraction. These lock in subtle behaviors
 * that the baseline snapshot alone would not catch (and document a known quirk).
 */
describe("ChamberModel behavior parity (S2a refactor guards)", () => {
  it("active-stress mode ignores node.active overrides (uses module defaults)", () => {
    // KNOWN QUIRK (pre-existing, preserved by the refactor): the active-stress
    // LV/RV models are built from the module defaultActive* params, so
    // nodeOverrides.*.active has no effect. Documented here; a future phase may
    // wire node.active through if per-instance active params are wanted.
    const base = runScenario(DEFAULT_PARAMS);
    const overridden = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LV: { active: { Tmax0: 999999 } } as unknown as Record<string, number> },
    });
    expect(overridden.metrics.CO_L).toBeCloseTo(base.metrics.CO_L, 6);
    expect(overridden.metrics.EF_LApprox).toBeCloseTo(base.metrics.EF_LApprox, 6);
  });

  it("elastance fallback DOES respond to LV elastance node overrides", () => {
    const base = runScenario({ ...DEFAULT_PARAMS, heartModel: "elastance" });
    const stiffer = runScenario({
      ...DEFAULT_PARAMS,
      heartModel: "elastance",
      nodeOverrides: { LV: { Ees: 4.8 } }, // 2x the default 2.4
    });
    // A higher end-systolic elastance must move the operating point. MAP is
    // buffered by the closed loop (~0.7 mmHg here), but EF responds strongly.
    expect(Math.abs(stiffer.metrics.EF_LApprox - base.metrics.EF_LApprox)).toBeGreaterThan(0.05);
  });

  it("active-stress and elastance are distinct operating points", () => {
    const active = runScenario(DEFAULT_PARAMS);
    const elastance = runScenario({ ...DEFAULT_PARAMS, heartModel: "elastance" });
    expect(Math.abs(active.metrics.CO_L - elastance.metrics.CO_L)).toBeGreaterThan(0.01);
  });
});
