import { describe, expect, it } from "vitest";
import { runScenario } from "@/engine/harness";
import { defaultActiveLV } from "@/engine/chambers";
import { DEFAULT_PARAMS } from "@/constants";

/**
 * Guards for the S2a ChamberModel extraction. These lock in subtle behaviors
 * that the baseline snapshot alone would not catch.
 */
describe("ChamberModel behavior parity (S2a refactor guards)", () => {
  it("active-stress mode RESPECTS node.active overrides (per-instance chamber params)", () => {
    // The active-stress LV/RV models are rebuilt from node.active in
    // setImmediateParameters, so a nodeOverrides.*.active edit changes the
    // operating point instead of silently no-op'ing (the diastolic-stiffness
    // / b_pas path the knob layer depends on). Previously this silently did
    // nothing — that bug is now fixed.
    const base = runScenario(DEFAULT_PARAMS);
    const stiffer = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LV: { active: { bPas: defaultActiveLV.bPas * 2 } } as unknown as Record<string, number> },
    });
    // A stiffer passive LV (higher EDPVR beta) raises end-diastolic pressure.
    expect(stiffer.metrics.LVEDPApprox).toBeGreaterThan(base.metrics.LVEDPApprox + 1);
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
