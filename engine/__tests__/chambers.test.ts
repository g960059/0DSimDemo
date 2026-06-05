import { describe, expect, it } from "vitest";
import { runScenario } from "@/engine/harness";
import { ActiveStressChamberModel, chamberActivation, defaultActiveLA, defaultActiveLV, defaultActiveRA } from "@/engine/chambers";
import { DEFAULT_PARAMS } from "@/constants";

/**
 * Guards for the S2a ChamberModel extraction. These lock in subtle behaviors
 * that the baseline snapshot alone would not catch.
 */
describe("ChamberModel behavior parity (S2a refactor guards)", () => {
  it("uses a ventricular double-Hill elastance activation without a late systolic plateau", () => {
    const HR = 75;
    const T = 60 / HR;
    const at = (seconds: number) => chamberActivation("LV", seconds / T, HR);

    expect(at(0)).toBeCloseTo(0, 6);
    expect(at(0.10)).toBeGreaterThan(0.08);
    expect(at(0.10)).toBeLessThan(0.20);
    expect(at(0.20)).toBeGreaterThan(at(0.10));
    expect(at(0.30)).toBeGreaterThan(0.9);
    expect(at(0.45)).toBeGreaterThan(0.08);
    expect(at(0.45)).toBeLessThan(0.16);
    expect(at(0.60)).toBeLessThan(0.02);
  });

  it("uses AV delay as atrial lead for time-varying elastance without shifting ventricular phase", () => {
    const HR = 75;
    const T = 60 / HR;
    const scanPeak = (chamber: "LA" | "LV", avDelaySec: number) => {
      let best = { theta: 0, value: -Infinity };
      for (let i = 0; i <= 800; i++) {
        const theta = i / 800;
        const value = chamberActivation(chamber, theta, HR, avDelaySec);
        if (value > best.value) best = { theta, value };
      }
      return best.theta * T;
    };

    const laShortDelayPeak = scanPeak("LA", 0.08);
    const laLongDelayPeak = scanPeak("LA", 0.20);
    const lvShortDelayPeak = scanPeak("LV", 0.08);
    const lvLongDelayPeak = scanPeak("LV", 0.20);
    const lvDelayedPeak = (() => {
      let best = { theta: 0, value: -Infinity };
      for (let i = 0; i <= 800; i++) {
        const theta = i / 800;
        const value = chamberActivation("LV", theta, HR, 0.16, 0.03, 0.05);
        if (value > best.value) best = { theta, value };
      }
      return best.theta * T;
    })();

    expect(laShortDelayPeak - laLongDelayPeak).toBeGreaterThan(0.09);
    expect(lvShortDelayPeak).toBeCloseTo(lvLongDelayPeak, 3);
    expect(lvDelayedPeak - lvShortDelayPeak).toBeGreaterThan(0.04);
  });

  it("ventricular active stress respects bounded force-velocity coupling", () => {
    const lv = new ActiveStressChamberModel({
      ...defaultActiveLV,
      forceVelocityShorteningCoeff: 0.05,
      forceVelocityLengtheningCoeff: 0.02,
      forceVelocityMin: 0.75,
      forceVelocityMax: 1.08,
    });
    const ctx = {
      HR: 75,
      contractility: 1,
      relaxation: 1,
      phi: 0.28,
      chamber: "LV" as const,
      tmaxScale: 0.7,
      geomScale: 1,
      caReleaseScale: 1,
      inletValveOpen01: 0,
      outletValveOpen01: 1,
    };
    const internal = { c: 0, a: 0.08, r: 0 };
    const staticPressure = lv.pressure(110, internal, {
      ...ctx,
      pairedVentricleShorteningVelocity01PerSec: 0,
    });
    const shorteningPressure = lv.pressure(110, internal, {
      ...ctx,
      pairedVentricleShorteningVelocity01PerSec: 4,
    });
    const lengtheningPressure = lv.pressure(110, internal, {
      ...ctx,
      outletValveOpen01: 0,
      pairedVentricleShorteningVelocity01PerSec: -2,
    });

    expect(shorteningPressure).toBeLessThan(staticPressure - 2);
    expect(lengtheningPressure).toBeGreaterThan(staticPressure);
  });

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
      if (cur.xiAoV > 0.2 && cur.xiMV < 0.2 && dr > 0.0005) ejectionRise = true;
      if (cur.xiAoV < 0.2 && cur.xiMV < 0.2 && prev.rLA > 0.1 && dr < -0.0005) ivrRecoil = true;
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
    expect(guarded.solveFlag).not.toBe("lowVolumeConstrained");
    expect(guarded.qMl).toBeLessThan(50);
    expect(Math.abs(guarded.vBodyMl + guarded.vReservoirMl - 25)).toBeLessThan(1e-12);
    if (guarded.solveFlag === "ok") {
      expect(Math.abs(guarded.equilibriumErrorMmHg)).toBeLessThan(1e-4);
    }

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

  it("atrial AV-plane gain uses side-specific paired ventricle and inlet valve context", () => {
    const la = new ActiveStressChamberModel(defaultActiveLA);
    const internal = { c: 0, a: 0, r: 0 };
    const baseCtx = {
      HR: 75,
      contractility: 1,
      relaxation: 1,
      phi: 0.4,
      tmaxScale: 1,
      geomScale: 1,
      caReleaseScale: 1,
      pairedVentricleShortening01: 0.8,
      outletValveOpen01: 0,
    };
    const open = la.pressure(50, internal, { ...baseCtx, side: "left", inletValveOpen01: 1 });
    const closed = la.pressure(50, internal, { ...baseCtx, side: "left", inletValveOpen01: 0 });
    expect(closed).toBeLessThan(open - 0.1);

    const activeInternal = { c: 0.5, a: 0, r: 0 };
    const openDerivatives = la.internalDerivatives(50, activeInternal, { ...baseCtx, side: "left", inletValveOpen01: 1 });
    const closedDerivatives = la.internalDerivatives(50, activeInternal, { ...baseCtx, side: "left", inletValveOpen01: 0 });
    expect(closedDerivatives.aDot).toBeLessThan(openDerivatives.aDot);

    const ra = new ActiveStressChamberModel(defaultActiveRA);
    const raOpen = ra.pressure(50, internal, { ...baseCtx, side: "right", inletValveOpen01: 1 });
    const raClosed = ra.pressure(50, internal, { ...baseCtx, side: "right", inletValveOpen01: 0 });
    expect(raClosed).toBeLessThan(raOpen - 0.1);
    const raOpenDerivatives = ra.internalDerivatives(50, activeInternal, { ...baseCtx, side: "right", inletValveOpen01: 1 });
    const raClosedDerivatives = ra.internalDerivatives(50, activeInternal, { ...baseCtx, side: "right", inletValveOpen01: 0 });
    expect(raClosedDerivatives.aDot).toBeLessThan(raOpenDerivatives.aDot);

    const legacyLeftOnly = ra.pressure(50, internal, {
      ...baseCtx,
      side: "right",
      lvShortening01: 0.8,
      mvOpen01: 0,
      pairedVentricleShortening01: undefined,
      inletValveOpen01: undefined,
    });
    const noDescent = ra.pressure(50, internal, {
      ...baseCtx,
      side: "right",
      pairedVentricleShortening01: 0,
      inletValveOpen01: 0,
    });
    expect(legacyLeftOnly).toBeCloseTo(noDescent, 9);
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
      nodeOverrides: { LV: { Ees: 3.2 } }, // 2x the default 1.6
    });
    // A higher end-systolic elastance must move the operating point. MAP is
    // buffered by the closed loop (~0.7 mmHg here), but EF responds strongly.
    expect(Math.abs(stiffer.metrics.EF_LApprox - base.metrics.EF_LApprox)).toBeGreaterThan(0.05);
  });

  it("elastance fallback keeps the LV pressure loop free of a gross mid-systolic notch", () => {
    const result = runScenario(
      { ...DEFAULT_PARAMS, heartModel: "elastance" },
      { settleSeconds: 30, measureSeconds: 2, sampleHz: 400 },
    );
    const samples = result.samples;
    const beatEnd = Math.floor(samples.at(-1)?.phi ?? 0);
    const beat = samples.filter((s) => s.phi >= beatEnd - 1 && s.phi < beatEnd);
    const systolic = beat.filter((s) => s.LVP > 40);
    let topDip = 0;
    for (let i = 1; i < systolic.length - 1; i++) {
      const before = Math.max(...systolic.slice(0, i).map((s) => s.LVP));
      const after = Math.max(...systolic.slice(i + 1).map((s) => s.LVP));
      topDip = Math.max(topDip, Math.min(before, after) - systolic[i].LVP);
    }

    expect(result.metrics.AoPSys).toBeGreaterThan(100);
    expect(result.metrics.AoPDia).toBeGreaterThan(70);
    expect(result.metrics.EF_LApprox).toBeGreaterThan(0.50);
    expect(topDip).toBeLessThan(8);
  });

  it("active-stress and elastance are distinct operating points", () => {
    const active = runScenario(DEFAULT_PARAMS);
    const elastance = runScenario({ ...DEFAULT_PARAMS, heartModel: "elastance" });
    expect(Math.abs(active.metrics.CO_L - elastance.metrics.CO_L)).toBeGreaterThan(0.01);
  });
});
