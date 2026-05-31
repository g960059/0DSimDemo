import { describe, expect, it } from "vitest";
import { runScenario } from "@/engine/harness";
import { defaultActiveLV } from "@/engine/chambers";
import { DEFAULT_PARAMS } from "@/constants";

/**
 * Guards for the S2a ChamberModel extraction. These lock in subtle behaviors
 * that the baseline snapshot alone would not catch.
 */
describe("ChamberModel behavior parity (S2a refactor guards)", () => {
  it("AV-plane reservoir state is neutral at default stroke0", () => {
    const explicitZero = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 0 } } },
    });
    const defaultRun = runScenario(DEFAULT_PARAMS);
    expect(explicitZero.metrics).toEqual(defaultRun.metrics);
    expect(explicitZero.health).toEqual(defaultRun.health);
    expect(explicitZero.samples.at(-1)?.rLA).toBe(0);
  });

  it("LA reservoir stroke changes pressure without changing chamber blood volume", () => {
    const base = runScenario(DEFAULT_PARAMS);
    const reservoir = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 10 } } },
    });
    expect(reservoir.samples.some((s) => s.rLA > 0.1)).toBe(true);
    expect(Math.abs(reservoir.metrics.TBV - base.metrics.TBV)).toBeLessThan(1);
    expect(Math.abs(reservoir.metrics.LAPMean - base.metrics.LAPMean)).toBeGreaterThan(0.05);
  });

  it("LA reservoir follows valve-gated ejection rise and IVR recoil", () => {
    const reservoir = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 10 } } },
    });
    expect(Math.max(...reservoir.samples.map((s) => s.rLA))).toBeLessThanOrEqual(10);
    expect(Math.min(...reservoir.samples.map((s) => s.rLA))).toBeGreaterThanOrEqual(0);
    expect(reservoir.samples.some((s) => s.rRA !== 0)).toBe(false);

    let ejectionRise = false;
    let ivrRecoil = false;
    for (let i = 1; i < reservoir.samples.length; i++) {
      const prev = reservoir.samples[i - 1];
      const cur = reservoir.samples[i];
      const dr = cur.rLA - prev.rLA;
      if (cur.QAo > 1 && cur.QMV <= 0 && dr > 0.0005) ejectionRise = true;
      if (cur.QAo <= 0 && cur.QMV <= 0 && prev.rLA > 0.1 && dr < -0.0005) ivrRecoil = true;
    }
    expect(ejectionRise).toBe(true);
    expect(ivrRecoil).toBe(true);
  });

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
