import { clamp, expClamped, frac, raisedCosinePulse, sigmoid } from "@/engine/math";

// Heart-chamber pressure models, decoupled from the graph core (ROADMAP S2 /
// upgrade-plan M2). The graph core owns node/edge/flow/mass-balance; a
// ChamberModel owns how a heart chamber turns volume + internal state into a
// transmural pressure, and how its internal Ca/activation states evolve.
//
// Two implementations:
//   - ElastanceChamberModel    : time-varying elastance (atria; LV/RV fallback)
//   - ActiveStressChamberModel : single-fibre / active-stress (LV/RV default)

export const MMHG_TO_PA = 133.322;
export const ML_TO_M3 = 1e-6;

export type Chamber = "LV" | "RV" | "LA" | "RA";

/** Internal Ca-transient / troponin-activation/reservoir state of an active chamber. */
export type ChamberInternal = { c: number; a: number; r: number };

/** Inputs the chamber needs from the rest of the model at evaluation time. */
export type ChamberCtx = {
  HR: number;
  contractility: number;
  relaxation: number;
  phi: number; // cumulative cardiac phase (beats); theta = frac(phi)
  // active-stress scaling knobs
  tmaxScale: number;
  geomScale: number;
  caReleaseScale: number;
  lvVolumeMl?: number;
  lvShortening01?: number;
  mvOpen01?: number;
  aovOpen01?: number;
  systolicGate?: number;
};

export interface ChamberModel {
  /** Transmural pressure (mmHg) for the given volume + internal state. */
  pressure(V: number, internal: ChamberInternal, ctx: ChamberCtx): number;
  /** Derivatives of the internal Ca/activation states (zero for elastance). */
  internalDerivatives(V: number, internal: ChamberInternal, ctx: ChamberCtx): { cDot: number; aDot: number; rDot: number };
  /** Initial internal state for reset(). */
  initialInternal(): ChamberInternal;
}

// ----- Active-stress chamber -------------------------------------------------

export type ActiveChamberParams = {
  V0: number;
  Vw: number;
  Vref: number;
  Vmin: number;
  Trel0: number;
  TrelMin: number;
  TrelMax: number;
  etaRel: number;
  HR0: number;
  tauCa0: number;
  etaCa: number;
  cDia: number;
  Arel0: number;
  gFFR: number;
  gFFR2: number;
  Kd0: number;
  betaLambda: number;
  betaKd: number;
  hillN: number;
  kOn: number;
  kOff: number;
  sigmaPas0: number;
  bPas: number;
  lambdaPas0: number;
  Tmax0: number;
  kOver: number;
  lambdaFail: number;
  geomChi: number;
  thetaOn: number;
  pressureFloorMmHg?: number;
  atrialLeadSec?: number;
  // PR5 (human plan): AV-plane descent as an effective-volume correction (NOT a
  // hidden reservoir branch). During LV systole the AV plane descends and the
  // atrium's effective volume shifts, shaping reservoir filling / x-descent.
  // Veff = V + avPlaneGainMl * lvShortening01. Default undefined/0 = no shift.
  avPlaneGainMl?: number;
  reservoirBranchGain?: number;
  reservoirStrokeMl?: number;
  reservoirSleeveVuMl?: number;
  reservoirSleeveCompliance?: number;
  reservoirSleeveP0?: number;
  reservoirSleeveMinVolumeMl?: number;
  reservoirSleeveMaxVolumeMl?: number;
  reservoirQPressureFloorGuard?: number;
  reservoirSleeveMinPressureGuard?: number;
  reservoirSleeveMinPressureGuardWidthMl?: number;
  reservoirTauFill?: number;
  reservoirTauRecoil?: number;
  reservoirTauRecoilIVR?: number;
  reservoirReleaseTheta?: number;
  reservoirValveThreshold?: number;
};

export type BranchSolveFlag = "ok" | "lowVolumeConstrained" | "unbracketedEndpoint";

export type ReservoirBranchState = {
  qMl: number;
  vBodyMl: number;
  vReservoirMl: number;
  pBodyMmHg: number;
  pReservoirMmHg: number;
  equilibriumErrorMmHg: number;
  solveFlag: BranchSolveFlag;
  sleeveOverMax01: number;
  pressureMmHg: number;
};

export function sphereRadii(VeffMl: number, VwMl: number) {
  const Vi = Math.max(VeffMl, 1e-3) * ML_TO_M3;
  const Vw = Math.max(VwMl, 1e-3) * ML_TO_M3;
  const ri = Math.pow((3 * Vi) / (4 * Math.PI), 1 / 3);
  const ro = Math.pow(ri * ri * ri + (3 * Vw) / (4 * Math.PI), 1 / 3);
  const h = Math.max(ro - ri, 1e-5);
  const rm = 0.5 * (ri + ro);
  return { ri, ro, h, rm };
}

export function rmRefFromParams(p: ActiveChamberParams) {
  return sphereRadii(Math.max(p.Vref - p.V0, p.Vmin), p.Vw).rm;
}


// Default LV/RV active-stress parameters. These are calibration targets, not
// fixed physiological constants.
// M12-lite calibration — full record: docs/research/m12-lite-calibration-journal.md
// and derivations-geometry-and-edpvr.md. Two coupled fixes:
//  (1) FORCE: the old supra-physiological Tmax0 (~382 kPa = legacy lvTmaxScale=4.5 fudge)
//      was compensating an artificially low geomChi. The exact thick-sphere Laplace factor
//      geomChi = (ri+ro)^2/(4 ri^2) is 1.360 (LV) / 1.139 (RV) — ~3.8x the old 0.36/0.28.
//      Re-attributing it lets Tmax0 drop to a PHYSIOLOGICAL ceiling (135 / 57 kPa; realised
//      peak sigma_act ~10-11 kPa, cf in-vivo ES ~16 total [Genet 2014]).
//  (2) DIASTOLE: geomChi multiplies the PASSIVE term too (Ptm = geomChi*(2h/rm)*(sigmaPas+
//      sigmaAct)), so raising geomChi 3.8x inadvertently stiffened the EDPVR 3.8x while
//      sigmaPas0=2000 (tuned to the old wrong geomChi) was never recalibrated. The LV
//      passive law is refit to a Klotz-valid EDPVR through (120 mL, 10 mmHg) AT the
//      corrected geometry, with Vref HELD at 120 (so rmRef/ejection mechanics are preserved
//      and EF does not collapse). bPas is STEEP (high-volume limb P140~23.5) — required so
//      the MR/volume-overload case resists dilation instead of flooring the LV. RV passive
//      uses the geomChi-compensation (sigmaPas0 492 = 2000*0.28/1.1385).
// Result (settled Normal): CO 4.40, MAP 85, AoP 120/78, EF 0.604, E/A 1.90 — strictly
// better than the prior baseline and physically honest. KNOWN residuals deferred to
// M12-proper (see journal): EDV ~97 / LAP ~1.7 still low (LA-side filling-circuit /
// pulmonary-venous-return structure; LAP<RAP near-inversion); over-right PV-loop apex +
// absent AoP incisura (single-node Windkessel, no wave reflection); RV EDPVR steep refit;
// hypovolemia RA-floor; 2-region passive law for full-range Klotz fidelity.
export const defaultActiveLV: ActiveChamberParams = {
  V0: 10,
  Vw: 150,
  Vref: 120,
  Vmin: 2,
  Trel0: 0.08,
  TrelMin: 0.045,
  TrelMax: 0.12,
  etaRel: 0.35,
  HR0: 75,
  tauCa0: 0.18,
  etaCa: 0.40,
  cDia: 0.0,
  Arel0: 0.18,
  gFFR: 0.15,
  gFFR2: 0.06,
  Kd0: 0.18,
  betaLambda: 3.0,
  betaKd: -0.2,
  hillN: 3.0,
  kOn: 25,
  kOff: 15,
  sigmaPas0: 200.133, // M12-lite: steep Klotz EDPVR refit at corrected geomChi; was 2000 (tuned to old geomChi 0.36)
  bPas: 23.2,         // M12-lite: steep high-volume limb (Klotz P140~23.5) for MR dilation-resistance; was 10.0
  lambdaPas0: 0.9025, // M12-lite: EDPVR shape fit; was 0.85
  Tmax0: 135000, // M12-lite: physiological ceiling (~135 kPa); was 382500 (4.5x fudge)
  kOver: 35,
  lambdaFail: 1.45,
  geomChi: 1.359637, // M12-lite: exact thick-sphere Laplace (ri+ro)^2/(4 ri^2); was 0.36
  thetaOn: 0.0,
  pressureFloorMmHg: -5,
  reservoirBranchGain: 0,
  reservoirStrokeMl: 0,
  reservoirSleeveVuMl: 12,
  reservoirSleeveCompliance: 3.0,
  reservoirSleeveP0: 0,
  reservoirSleeveMinVolumeMl: 1,
  reservoirSleeveMaxVolumeMl: 35,
  reservoirQPressureFloorGuard: 0,
  reservoirSleeveMinPressureGuard: 0,
  reservoirSleeveMinPressureGuardWidthMl: 4,
  reservoirTauFill: 0.10,
  reservoirTauRecoil: 0.15,
  reservoirTauRecoilIVR: 0.035,
  reservoirReleaseTheta: 0.55,
  reservoirValveThreshold: 0.15,
};

export const defaultActiveRV: ActiveChamberParams = {
  ...defaultActiveLV,
  V0: 15,
  Vw: 55,
  Vref: 135,
  sigmaPas0: 492, // M12-lite: geomChi-compensation 2000*0.28/1.1385 (gentle RV EDPVR; steep Klotz refit deferred to M12-proper)
  bPas: 10.0,
  lambdaPas0: 0.85,
  Tmax0: 57176, // M12-lite: physiological ceiling (RV:LV ratio preserved); was 162000
  geomChi: 1.138505, // M12-lite: exact thick-sphere Laplace for RV ref geometry; was 0.28
};

export const defaultActiveLA: ActiveChamberParams = {
  ...defaultActiveLV,
  // PR4 (human plan): LA recalibrated as a SINGLE thin-walled active-stress
  // chamber. Soft passive (was sigmaPas0 2000 = volume-clamp) + physiological
  // atrial active stress (Tmax0 25 kPa, ~1/5 of LV) so the a-wave is a real
  // active bump, not passive end-filling. Starting point for re-calibration.
  V0: 5,
  Vw: 16,
  Vref: 45,
  Vmin: 1,
  Trel0: 0.10,
  TrelMin: 0.06,
  TrelMax: 0.13,
  tauCa0: 0.08,
  Arel0: 0.10,
  Kd0: 0.18,
  betaLambda: 2.0,
  hillN: 2.5,
  kOn: 15,
  kOff: 8,
  sigmaPas0: 300,
  bPas: 10,
  lambdaPas0: 0.88,
  Tmax0: 25000,
  geomChi: 1.1,
  thetaOn: 0.80,
  pressureFloorMmHg: -2,
  atrialLeadSec: 0.16,
  avPlaneGainMl: 12, // PR5: AV-plane descent effective-volume gain (tune 8-18 mL)
  // PR2 (human plan): turn OFF the hidden LA body+sleeve reservoir branch. LA is
  // a single active-stress chamber; reservoir function should come from pulmonary
  // venous return + MV closure + AV-plane descent + LA wall relaxation, NOT an
  // internal sleeve. The reservoir* fields below stay as DEBUG/diagnostic only.
  reservoirBranchGain: 0,
  reservoirStrokeMl: 0,
  reservoirSleeveVuMl: 8,
  reservoirSleeveCompliance: 3.0,
  reservoirSleeveP0: 0,
  reservoirSleeveMinVolumeMl: 1,
  reservoirSleeveMaxVolumeMl: 35,
  reservoirQPressureFloorGuard: 1,
  reservoirSleeveMinPressureGuard: 1,
  reservoirSleeveMinPressureGuardWidthMl: 4,
  reservoirTauFill: 0.10,
  reservoirTauRecoilIVR: 0.035,
  reservoirValveThreshold: 0.15,
};

export const defaultActiveRA: ActiveChamberParams = {
  ...defaultActiveLA,
  Vref: 35,
  Vw: 18.2,
  Arel0: 0.10,
  sigmaPas0: 210,
  bPas: 19,
  lambdaPas0: 0.90,
  Tmax0: 8000,
  geomChi: 1.112,
  pressureFloorMmHg: -5,
  atrialLeadSec: 0.16,
  reservoirBranchGain: 0,
  reservoirStrokeMl: 0,
  reservoirSleeveVuMl: 12,
  reservoirSleeveCompliance: 3.0,
  reservoirSleeveP0: 0,
  reservoirSleeveMinVolumeMl: 1,
  reservoirSleeveMaxVolumeMl: 35,
  reservoirQPressureFloorGuard: 0,
  reservoirSleeveMinPressureGuard: 0,
  reservoirSleeveMinPressureGuardWidthMl: 4,
};

export class ActiveStressChamberModel implements ChamberModel {
  // Reference mid-wall radius is constant per chamber; precompute it once
  // instead of recomputing the cube roots on every pressure/rhs evaluation.
  private readonly rmRef: number;

  constructor(public readonly ap: ActiveChamberParams) {
    this.rmRef = rmRefFromParams(ap);
  }

  private geometry(V: number): { lambda: number; h: number; rm: number } {
    const ap = this.ap;
    const VeffMl = Math.max(V - ap.V0, ap.Vmin);
    const { h, rm } = sphereRadii(VeffMl, ap.Vw);
    return { lambda: rm / Math.max(this.rmRef, 1e-9), h, rm };
  }

  private twoBranchEnabled(): boolean {
    const ap = this.ap;
    return (ap.reservoirBranchGain ?? 0) > 0 && (ap.reservoirStrokeMl ?? 0) > 0;
  }

  private bodyPressure(V: number, internal: ChamberInternal, ctx: ChamberCtx): number {
    const ap = this.ap;
    const a = clamp(internal.a, 0, 1);
    const { lambda, h, rm } = this.geometry(V);
    const stretch = lambda - ap.lambdaPas0;
    const sigmaPas = ap.sigmaPas0 * (expClamped(ap.bPas * stretch) - 1);
    const gOver = 1 / (1 + expClamped(ap.kOver * (lambda - ap.lambdaFail)));

    // Realistic f_iso so tension rapidly drops as the heart empties.
    const f_iso = clamp((lambda - ap.lambdaPas0 + 0.3) / 0.35, 0, 1);

    const sigmaAct = ap.Tmax0 * ctx.tmaxScale * ctx.contractility * a * gOver * f_iso;
    const sigma = sigmaPas + sigmaAct;
    const PtmPa = ctx.geomScale * ap.geomChi * (2 * h / Math.max(rm, 1e-6)) * sigma;
    return clamp(PtmPa / MMHG_TO_PA, ap.pressureFloorMmHg ?? -5, 260);
  }

  pressure(V: number, internal: ChamberInternal, ctx: ChamberCtx): number {
    if (!this.twoBranchEnabled()) {
      // PR5: AV-plane descent effective-volume correction (atria only, via
      // avPlaneGainMl). lvShortening01 rises through LV systole.
      const avp = this.ap.avPlaneGainMl ?? 0;
      const Veff = avp > 0 ? V + avp * clamp(ctx.lvShortening01 ?? 0, 0, 1) : V;
      return this.bodyPressure(Veff, internal, ctx);
    }
    return this.reservoirBranchState(V, internal, ctx).pressureMmHg;
  }

  private sleevePressure(VResMl: number, qMl: number): number {
    const ap = this.ap;
    const vu = ap.reservoirSleeveVuMl ?? 12;
    const compliance = Math.max(ap.reservoirSleeveCompliance ?? 3.0, 0.25);
    const p0 = ap.reservoirSleeveP0 ?? 0;
    const pressureFloor = ap.pressureFloorMmHg ?? -5;
    const vEff = Math.max(VResMl - vu - qMl, -compliance * 5);
    const pressure = clamp(p0 + vEff / compliance, pressureFloor, 80);
    const guard = clamp(ap.reservoirSleeveMinPressureGuard ?? 0, 0, 1);
    if (guard <= 0) return pressure;

    const sleeveMin = Math.max(ap.reservoirSleeveMinVolumeMl ?? 1, 0);
    const width = Math.max(ap.reservoirSleeveMinPressureGuardWidthMl ?? 4, 1e-6);
    const proximity = clamp((sleeveMin + width - VResMl) / width, 0, 1);
    if (proximity <= 0) return pressure;
    return clamp(pressure - guard * proximity * Math.max(0, pressure - pressureFloor), pressureFloor, 80);
  }

  private effectiveReservoirQ(totalMl: number, rawQMl: number, bodyMinMl: number, internal: ChamberInternal, ctx: ChamberCtx): number {
    const ap = this.ap;
    const guard = clamp(ap.reservoirQPressureFloorGuard ?? 0, 0, 1);
    if (guard <= 0 || rawQMl <= 0) return rawQMl;

    const vu = ap.reservoirSleeveVuMl ?? 12;
    const compliance = Math.max(ap.reservoirSleeveCompliance ?? 3.0, 0.25);
    const p0 = ap.reservoirSleeveP0 ?? 0;
    const pTarget = Math.max(ap.pressureFloorMmHg ?? -5, this.bodyPressure(bodyMinMl, internal, ctx));
    const maxReservoirVolume = Math.max(totalMl - bodyMinMl, 0);
    const qCap = Math.max(0, maxReservoirVolume - vu + compliance * (p0 - pTarget));
    if (!Number.isFinite(qCap)) return rawQMl;
    return rawQMl - guard * Math.max(0, rawQMl - qCap);
  }

  reservoirBranchState(VLA: number, internal: ChamberInternal, ctx: ChamberCtx): ReservoirBranchState {
    const ap = this.ap;
    const total = Math.max(VLA, 0);
    const stroke = Math.max(ap.reservoirStrokeMl ?? 0, 0);
    const gain = Math.max(ap.reservoirBranchGain ?? 0, 0);
    const pressureFloor = ap.pressureFloorMmHg ?? -5;
    const sleeveMin = Math.max(ap.reservoirSleeveMinVolumeMl ?? 1, 0);
    const bodyMin = Math.max(ap.V0 + ap.Vmin, 0);
    const rawQ = clamp(internal.r, 0, stroke) * gain;
    const q = this.effectiveReservoirQ(total, rawQ, bodyMin, internal, ctx);
    const sleeveMax = Math.max(ap.reservoirSleeveMaxVolumeMl ?? Infinity, 0);
    const finalize = (vBodyRaw: number, solveFlag: BranchSolveFlag): ReservoirBranchState => {
      const vBody = clamp(vBodyRaw, 0, total);
      const vReservoir = total - vBody;
      const pBody = this.bodyPressure(vBody, internal, ctx);
      const pReservoir = this.sleevePressure(vReservoir, q);
      return {
        qMl: q,
        vBodyMl: vBody,
        vReservoirMl: vReservoir,
        pBodyMmHg: pBody,
        pReservoirMmHg: pReservoir,
        equilibriumErrorMmHg: pBody - pReservoir,
        solveFlag,
        sleeveOverMax01: Number.isFinite(sleeveMax) && sleeveMax > 0 && vReservoir > sleeveMax ? 1 : 0,
        pressureMmHg: clamp(0.5 * (pBody + pReservoir), pressureFloor, 260),
      };
    };

    if (total < bodyMin + sleeveMin) {
      const weight = bodyMin / Math.max(bodyMin + sleeveMin, 1e-9);
      return finalize(total * weight, "lowVolumeConstrained");
    }

    let lo = bodyMin;
    let hi = total - sleeveMin;
    const f = (vBody: number) => this.bodyPressure(vBody, internal, ctx) - this.sleevePressure(total - vBody, q);
    const fLo = f(lo);
    const fHi = f(hi);
    if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo > 0 || fHi < 0) {
      return finalize(Math.abs(fLo) <= Math.abs(fHi) ? lo : hi, "unbracketedEndpoint");
    }

    for (let i = 0; i < 32; i++) {
      const mid = 0.5 * (lo + hi);
      if (f(mid) >= 0) hi = mid;
      else lo = mid;
    }
    return finalize(0.5 * (lo + hi), "ok");
  }

  internalDerivatives(V: number, internal: ChamberInternal, ctx: ChamberCtx): { cDot: number; aDot: number; rDot: number } {
    const ap = this.ap;
    const c = Math.max(internal.c, 0);
    const a = clamp(internal.a, 0, 1);
    const { lambda } = this.geometry(V);

    const HR = Math.max(ctx.HR, 20);
    const T = 60 / HR;
    const T0 = 60 / ap.HR0;
    const Trel = clamp(ap.Trel0 * Math.pow(T / T0, ap.etaRel), ap.TrelMin, ap.TrelMax);
    const durationTheta = clamp(Trel / T, 0.02, 0.3);
    const theta = frac(ctx.phi);
    const thetaOnEff = ap.atrialLeadSec != null ? frac(1 - ap.atrialLeadSec / T) : ap.thetaOn;
    const pulse = raisedCosinePulse(theta, thetaOnEff, durationTheta, T);

    const betaDrive = clamp((ctx.contractility - 1) / 1.5, 0, 1);
    const tauCa = (ap.tauCa0 * Math.pow(T / T0, ap.etaCa)) / Math.max(ctx.relaxation, 0.2);
    const ffr = Math.max(0, 1 + ap.gFFR * ((HR - ap.HR0) / ap.HR0) - ap.gFFR2 * Math.pow(Math.max(0, (HR - ap.HR0) / ap.HR0), 2));
    const Arel = ap.Arel0 * ctx.caReleaseScale * ffr * (1 + 0.2 * betaDrive) * ctx.contractility;
    const cDot = clamp(-(c - ap.cDia) / Math.max(tauCa, 0.02) + Arel * pulse, -20, 20);

    const Kd = ap.Kd0 * expClamped(-ap.betaLambda * (lambda - 1) + ap.betaKd * betaDrive);
    const cn = Math.pow(Math.max(c, 0), ap.hillN);
    const kn = Math.pow(Math.max(Kd, 1e-6), ap.hillN);
    const aInf = cn / Math.max(cn + kn, 1e-9);
    const tauA = 1 / Math.max(ap.kOn * cn + ap.kOff, 0.5);
    const aDot = clamp((aInf - a) / tauA, -20, 20);
    const rDot = reservoirQDot(ap, internal, ctx, theta);
    return { cDot, aDot, rDot };
  }

  initialInternal(): ChamberInternal {
    return { c: this.ap.cDia, a: 0, r: 0 };
  }
}

function reservoirQDot(ap: ActiveChamberParams, internal: ChamberInternal, ctx: ChamberCtx, theta: number): number {
  const stroke = Math.max(ap.reservoirStrokeMl ?? 0, 0);
  const gain = Math.max(ap.reservoirBranchGain ?? 0, 0);
  if (stroke <= 0 || gain <= 0) return 0;

  const q = clamp(internal.r, 0, stroke);
  const th = ap.reservoirValveThreshold ?? 0.15;
  const mvOpenRaw = ctx.mvOpen01;
  const aovOpenRaw = ctx.aovOpen01;
  const descentTarget = stroke * clamp(ctx.lvShortening01 ?? 0, 0, 1);
  let target = q;
  let tau = ap.reservoirTauFill ?? 0.10;

  if (mvOpenRaw != null && aovOpenRaw != null) {
    const mvOpen = clamp(mvOpenRaw, 0, 1);
    const aovOpen = clamp(aovOpenRaw, 0, 1);
    const mvClosed = mvOpen <= th;
    const aovClosed = aovOpen <= th;
    if (aovOpen > th && mvClosed) {
      target = descentTarget;
      tau = ap.reservoirTauFill ?? 0.10;
    } else if (aovClosed && mvClosed) {
      target = 0;
      tau = ap.reservoirTauRecoilIVR ?? 0.035;
    } else if (mvOpen > th) {
      target = 0;
      tau = Math.max(ap.reservoirTauRecoilIVR ?? 0.035, 0.035);
    }
  } else {
    const gate = ctx.systolicGate ?? systolicReservoirGate(theta, ap.reservoirReleaseTheta ?? 0.55);
    target = descentTarget * gate;
    tau = target > q ? (ap.reservoirTauFill ?? 0.10) : Math.max(ap.reservoirTauRecoilIVR ?? 0.035, 0.035);
  }

  return clamp(
    (target - q) / Math.max(tau, 1e-3),
    -stroke / 0.025,
    stroke / 0.04,
  );
}

function systolicReservoirGate(theta: number, releaseTheta: number): number {
  const rel = clamp(releaseTheta, 0.05, 0.95);
  if (theta < rel) return 1;
  const x = clamp((theta - rel) / Math.max(1 - rel, 1e-6), 0, 1);
  return 0.5 * (1 + Math.cos(Math.PI * x));
}

// ----- Elastance chamber -----------------------------------------------------

export type ElastanceParams = {
  V0: number;
  alpha: number;
  beta: number;
  Ees: number;
  chamber: Chamber;
};

/** Normalized time-varying elastance activation e(theta) for a chamber. */
export function chamberActivation(chamber: Chamber, phi: number, HR: number): number {
  const theta = frac(phi);
  const T = 60 / Math.max(HR, 1);
  const TsV = 0.30 * Math.pow(T / 0.80, 0.35);
  const TsA = 0.12 * Math.pow(T / 0.80, 0.25);
  const eps = 0.02;
  const window = (localSec: number, width: number) => {
    const g = sigmoid(localSec / eps) * sigmoid((width - localSec) / eps);
    const mid = 0.5 * width;
    const gmax = sigmoid(mid / eps) * sigmoid((width - mid) / eps);
    return g / Math.max(gmax, 1e-9);
  };
  if (chamber === "LV" || chamber === "RV") {
    return window(theta * T, TsV);
  }
  const tauA = frac(theta + 0.16 / T) * T;
  return 0.35 * window(tauA, TsA);
}

export class ElastanceChamberModel implements ChamberModel {
  constructor(public readonly ep: ElastanceParams) {}

  pressure(V: number, _internal: ChamberInternal, ctx: ChamberCtx): number {
    const ep = this.ep;
    const Veff = Math.max(V - ep.V0, 0);
    const Ped = ep.beta * (Math.exp(clamp(ep.alpha * Veff, -20, 20)) - 1);
    const Pes = ep.Ees * Veff;
    const e = chamberActivation(ep.chamber, ctx.phi, ctx.HR);
    return clamp(Ped + e * (Pes - Ped), -5, 250);
  }

  internalDerivatives(): { cDot: number; aDot: number; rDot: number } {
    return { cDot: 0, aDot: 0, rDot: 0 };
  }

  initialInternal(): ChamberInternal {
    return { c: 0, a: 0, r: 0 };
  }
}
