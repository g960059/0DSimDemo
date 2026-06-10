import { describe, expect, it } from "vitest";
import {
  ActiveStressChamberModel,
  chamberActivation,
  defaultActiveLA,
  defaultActiveLV,
  defaultActiveRA,
} from "@/engine/chambers";

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

  it("uses lambdaAct only when the off-by-default lag experiment is enabled", () => {
    const base = {
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
    const tauOff = new ActiveStressChamberModel({ ...defaultActiveLV, tauLambdaActSec: 0 });
    const tauOn = new ActiveStressChamberModel({ ...defaultActiveLV, tauLambdaActSec: 0.25 });
    const lowAct = { c: 0.55, a: 0.5, r: 0, tensionPa: 0, lambdaAct: 0.75 };
    const highAct = { ...lowAct, lambdaAct: 1.05 };

    expect(tauOff.pressure(80, lowAct, base)).toBeCloseTo(tauOff.pressure(80, highAct, base), 9);
    expect(Math.abs(tauOn.pressure(80, lowAct, base) - tauOn.pressure(80, highAct, base))).toBeGreaterThan(1);
    const d = tauOn.internalDerivatives(80, highAct, base);
    expect(Number.isFinite(d.lambdaActDot)).toBe(true);
  });

  it("can scope lambdaAct lag to Kd, fIso, or both active-stress terms", () => {
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
    const internal = { c: 0.55, a: 0.5, r: 0, tensionPa: 0, lambdaAct: 0.75 };
    const kdOnly = new ActiveStressChamberModel({ ...defaultActiveLV, tauLambdaActSec: 0.25, lambdaActTerms: "kd" });
    const fIsoOnly = new ActiveStressChamberModel({ ...defaultActiveLV, tauLambdaActSec: 0.25, lambdaActTerms: "fiso" });
    const both = new ActiveStressChamberModel({ ...defaultActiveLV, tauLambdaActSec: 0.25, lambdaActTerms: "kd+fiso" });

    const kd = kdOnly.debugActiveStressTerms(80, internal, ctx);
    const fIso = fIsoOnly.debugActiveStressTerms(80, internal, ctx);
    const bothTerms = both.debugActiveStressTerms(80, internal, ctx);

    expect(kd.lambdaActTerms).toBe("kd");
    expect(kd.lambdaForKd).toBeCloseTo(internal.lambdaAct, 9);
    expect(kd.lambdaForFIso).toBeCloseTo(kd.lambdaRaw, 9);
    expect(fIso.lambdaActTerms).toBe("fiso");
    expect(fIso.lambdaForKd).toBeCloseTo(fIso.lambdaRaw, 9);
    expect(fIso.lambdaForFIso).toBeCloseTo(internal.lambdaAct, 9);
    expect(bothTerms.lambdaActTerms).toBe("kd+fiso");
    expect(bothTerms.lambdaForKd).toBeCloseTo(internal.lambdaAct, 9);
    expect(bothTerms.lambdaForFIso).toBeCloseTo(internal.lambdaAct, 9);
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
});
