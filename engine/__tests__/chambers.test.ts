import { describe, expect, it } from "vitest";
import { runScenario } from "@/engine/harness";
import { ActiveStressChamberModel, defaultActiveLA, defaultActiveLV } from "@/engine/chambers";
import { DEFAULT_PARAMS } from "@/constants";

/**
 * Guards for the S2a ChamberModel extraction. These lock in subtle behaviors
 * that the baseline snapshot alone would not catch.
 */
describe("ChamberModel behavior parity (S2a refactor guards)", () => {
  it("AV-plane reservoir disabled gates are neutral against each other", () => {
    const strokeZero = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 0, reservoirBranchGain: 1 } } },
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialInertanceL: 0 } },
    });
    const gainZero = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 94, reservoirBranchGain: 0 } } },
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialInertanceL: 0 } },
    });
    expect(strokeZero.metrics).toEqual(gainZero.metrics);
    expect(strokeZero.health).toEqual(gainZero.health);
    expect(strokeZero.samples.at(-1)).toEqual(gainZero.samples.at(-1));
    expect(strokeZero.samples.at(-1)?.rLA).toBe(0);
  });

  it("PV ostial inertance nonpositive gates are neutral against each other", () => {
    const negative = runScenario({
      ...DEFAULT_PARAMS,
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialInertanceL: -1 } },
    });
    const explicitZero = runScenario({
      ...DEFAULT_PARAMS,
      edgeOverrides: { PVein_LA: { R: 0.0075, pvOstialInertanceL: 0 } },
    });
    expect(explicitZero.metrics).toEqual(negative.metrics);
    expect(explicitZero.health).toEqual(negative.health);
    expect(explicitZero.samples.at(-1)).toEqual(negative.samples.at(-1));
  });

  it("two-branch LA reservoir follows valve-gated ejection rise and IVR recoil", () => {
    const reservoir = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 12, reservoirBranchGain: 1 } } },
    });
    expect(Math.max(...reservoir.samples.map((s) => s.rLA))).toBeLessThanOrEqual(12);
    expect(Math.min(...reservoir.samples.map((s) => s.rLA))).toBeGreaterThanOrEqual(0);
    expect(reservoir.samples.some((s) => s.rRA !== 0)).toBe(false);
    expect(reservoir.samples.some((s) => (s.qLAReservoirMl ?? 0) > 0.1)).toBe(true);

    let ejectionRise = false;
    let ivrRecoil = false;
    let checkedPartition = false;
    for (let i = 1; i < reservoir.samples.length; i++) {
      const prev = reservoir.samples[i - 1];
      const cur = reservoir.samples[i];
      const dr = cur.rLA - prev.rLA;
      if (cur.QAo > 1 && cur.QMV <= 0 && dr > 0.0005) ejectionRise = true;
      if (cur.QAo <= 0 && cur.QMV <= 0 && prev.rLA > 0.1 && dr < -0.0005) ivrRecoil = true;
      if (cur.VLABodyMl != null && cur.VLAReservoirMl != null) {
        checkedPartition = true;
        expect(cur.twoBranchSolveFlag).toBe("ok");
        expect(Math.abs(cur.VLABodyMl + cur.VLAReservoirMl - cur.VLA)).toBeLessThan(1e-6);
        expect(Math.abs(cur.PLAEquilibriumErrorMmHg ?? 0)).toBeLessThan(1e-4);
      }
    }
    expect(ejectionRise).toBe(true);
    expect(ivrRecoil).toBe(true);
    expect(checkedPartition).toBe(true);

    const ctx = {
      HR: 75,
      contractility: 1,
      relaxation: 1,
      phi: 0,
      tmaxScale: 1,
      geomScale: 1,
      caReleaseScale: 1,
      lvShortening01: 0.5,
      mvOpen01: 0,
      aovOpen01: 1,
    };
    const lowVolume = new ActiveStressChamberModel({
      ...defaultActiveLA,
      reservoirBranchGain: 1,
      reservoirStrokeMl: 10,
    }).reservoirBranchState(3, { c: 0, a: 0, r: 5 }, ctx);
    expect(lowVolume.solveFlag).toBe("lowVolumeConstrained");
    expect(Math.abs(lowVolume.vBodyMl + lowVolume.vReservoirMl - 3)).toBeLessThan(1e-12);

    const unbracketed = new ActiveStressChamberModel({
      ...defaultActiveLA,
      reservoirBranchGain: 1,
      reservoirStrokeMl: 10,
      pressureFloorMmHg: -5,
      reservoirSleeveP0: 100,
      reservoirQPressureFloorGuard: 0,
      reservoirSleeveMinPressureGuard: 0,
    }).reservoirBranchState(40, { c: 0, a: 0, r: 5 }, ctx);
    expect(unbracketed.solveFlag).toBe("unbracketedEndpoint");
    expect(Math.abs(unbracketed.vBodyMl + unbracketed.vReservoirMl - 40)).toBeLessThan(1e-12);

    const guarded = new ActiveStressChamberModel({
      ...defaultActiveLA,
      reservoirBranchGain: 1,
      reservoirStrokeMl: 50,
      reservoirSleeveVuMl: 0,
      reservoirSleeveCompliance: 1,
      reservoirQPressureFloorGuard: 1,
    }).reservoirBranchState(25, { c: 0, a: 0, r: 50 }, ctx);
    expect(guarded.solveFlag).toBe("ok");
    expect(guarded.qMl).toBeLessThan(50);
    expect(Math.abs(guarded.vBodyMl + guarded.vReservoirMl - 25)).toBeLessThan(1e-12);
    expect(Math.abs(guarded.equilibriumErrorMmHg)).toBeLessThan(1e-4);

    const minPressureGuarded = new ActiveStressChamberModel({
      ...defaultActiveLA,
      pressureFloorMmHg: -4,
      reservoirBranchGain: 1,
      reservoirStrokeMl: 50,
      reservoirSleeveVuMl: 0,
      reservoirSleeveCompliance: 1.5,
      reservoirSleeveMinPressureGuard: 1,
      reservoirSleeveMinPressureGuardWidthMl: 4,
    }).reservoirBranchState(23, { c: 0, a: 0, r: 0 }, ctx);
    expect(minPressureGuarded.solveFlag).toBe("ok");
    expect(Math.abs(minPressureGuarded.equilibriumErrorMmHg)).toBeLessThan(1e-4);
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
