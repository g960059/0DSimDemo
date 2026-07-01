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

  it("keeps low-stretch limiter off by default", () => {
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
    const internal = { c: 0.8, a: 0.7, r: 0, tensionPa: 0, lambdaAct: 1 };
    const base = new ActiveStressChamberModel(defaultActiveLV);
    const explicitNone = new ActiveStressChamberModel({ ...defaultActiveLV, lowStretchLimiter: "none" });

    expect(explicitNone.pressure(45, internal, ctx)).toBeCloseTo(base.pressure(45, internal, ctx), 9);
    expect(explicitNone.debugActiveStressTerms(45, internal, ctx).lowStretchLimiter).toBe("none");
  });

  it("can cap low-stretch aInf without increasing activation", () => {
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
    const internal = { c: 5, a: 0.7, r: 0, tensionPa: 0, lambdaAct: 1 };
    const limited = new ActiveStressChamberModel({
      ...defaultActiveLV,
      lowStretchLimiter: "aInfCap",
      lowStretchLimiterStrength: 0.5,
      lowStretchLimiterKnee: 0.95,
      lowStretchLimiterWidth: 0.25,
    });
    const terms = limited.debugActiveStressTerms(45, internal, ctx);

    expect(terms.lowStretchLimiter).toBe("aInfCap");
    expect(terms.lowStretchLimiterGate).toBeGreaterThan(0);
    expect(terms.aInf).toBeLessThanOrEqual(terms.aInfRaw);
    expect(terms.aInfLimiterDelta).toBeGreaterThan(0);
    expect(terms.dLogAInf_dLambda).toBeCloseTo(
      defaultActiveLV.hillN * defaultActiveLV.betaLambda * (1 - terms.aInfRaw),
      12,
    );
    expect(terms.dLogAInf_dLambda).toBeLessThan(
      defaultActiveLV.hillN * defaultActiveLV.betaLambda * (1 - terms.aInf),
    );
  });

  it("can reduce low-stretch active target reserve without raising force", () => {
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
    const internal = { c: 0.8, a: 1, r: 0, tensionPa: 0, lambdaAct: 1 };
    const base = new ActiveStressChamberModel(defaultActiveLV);
    const limited = new ActiveStressChamberModel({
      ...defaultActiveLV,
      lowStretchLimiter: "activeReserveCap",
      lowStretchLimiterStrength: 0.4,
      lowStretchLimiterKnee: 0.95,
      lowStretchLimiterWidth: 0.25,
      lowStretchLimiterActivationThreshold: 0.4,
    });
    const baseTerms = base.debugActiveStressTerms(45, internal, ctx);
    const limitedTerms = limited.debugActiveStressTerms(45, internal, ctx);

    expect(limitedTerms.lowStretchLimiter).toBe("activeReserveCap");
    expect(limitedTerms.activeTargetLimiter).toBeLessThan(1);
    expect(limitedTerms.sigmaActTarget).toBeLessThanOrEqual(baseTerms.sigmaActTarget);
    expect(limited.pressure(45, internal, ctx)).toBeLessThanOrEqual(base.pressure(45, internal, ctx));
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

  it("stateful atrial AV-plane release uses internal descent without changing default algebraic mode", () => {
    const algebraic = new ActiveStressChamberModel(defaultActiveLA);
    const stateful = new ActiveStressChamberModel({
      ...defaultActiveLA,
      avPlaneDescentRiseTauSec: 0.02,
      avPlaneDescentReleaseTauSec: 0.14,
      avPlaneDescentMaxRiseVelocity01PerSec: 20,
      avPlaneDescentMaxReleaseVelocity01PerSec: 6,
    });
    const baseCtx = {
      HR: 75,
      contractility: 1,
      relaxation: 1,
      phi: 0.4,
      tmaxScale: 1,
      geomScale: 1,
      caReleaseScale: 1,
      side: "left" as const,
      pairedVentricleShortening01: 0.8,
      pairedVentricleShorteningVelocity01PerSec: 2,
      inletValveOpen01: 0,
      outletValveOpen01: 1,
    };
    const risingInternal = { c: 0, a: 0, r: 0.2 };
    const algebraicGeometry = algebraic.debugGeometryTerms(50, baseCtx, risingInternal);
    const statefulGeometry = stateful.debugGeometryTerms(50, baseCtx, risingInternal);
    expect(algebraicGeometry.avPlaneStatefulRelease01).toBe(0);
    expect(algebraicGeometry.avPlaneDescent01).toBeCloseTo(0.8, 9);
    expect(statefulGeometry.avPlaneStatefulRelease01).toBe(1);
    expect(statefulGeometry.avPlaneTargetDescent01).toBeCloseTo(0.8, 9);
    expect(statefulGeometry.avPlaneDescent01).toBeCloseTo(0.2, 9);
    expect(stateful.internalDerivatives(50, risingInternal, baseCtx).rDot).toBeGreaterThan(0);

    const releaseCtx = { ...baseCtx, inletValveOpen01: 1, pairedVentricleShorteningVelocity01PerSec: -1 };
    const releaseInternal = { c: 0, a: 0, r: 0.8 };
    const releaseGeometry = stateful.debugGeometryTerms(50, releaseCtx, releaseInternal);
    expect(releaseGeometry.avPlaneTargetDescent01).toBe(0);
    expect(releaseGeometry.avPlaneDescent01).toBeCloseTo(0.8, 9);
    expect(stateful.internalDerivatives(50, releaseInternal, releaseCtx).rDot).toBeLessThan(0);

    const inletHeld = new ActiveStressChamberModel({
      ...defaultActiveLA,
      avPlaneDescentRiseTauSec: 0.02,
      avPlaneDescentReleaseTauSec: 0.14,
      avPlaneDescentMaxRiseVelocity01PerSec: 20,
      avPlaneDescentMaxReleaseVelocity01PerSec: 6,
      avPlaneDescentReleaseInletOpenHold: 1,
      avPlaneDescentReleaseInletOpenThreshold: 0,
    });
    const heldOpenDerivatives = inletHeld.internalDerivatives(50, releaseInternal, releaseCtx);
    const heldClosedDerivatives = inletHeld.internalDerivatives(50, releaseInternal, {
      ...releaseCtx,
      inletValveOpen01: 0,
      pairedVentricleShortening01: 0,
    });
    const heldOpenGeometry = inletHeld.debugGeometryTerms(50, releaseCtx, releaseInternal);
    expect(heldOpenGeometry.avPlaneDescentReleaseInletOpenHold).toBe(1);
    expect(heldOpenGeometry.avPlaneDescentReleaseInletOpenThreshold).toBe(0);
    expect(Math.abs(heldOpenDerivatives.rDot)).toBeLessThan(1e-9);
    expect(heldClosedDerivatives.rDot).toBeLessThan(0);
  });
});
