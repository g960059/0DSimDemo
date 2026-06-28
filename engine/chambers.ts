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
export type LambdaActTerms = "kd" | "fiso" | "kd+fiso";
export type LowStretchLimiterMode = "none" | "aInfCap" | "activeReserveCap" | "fIsoSlopeRelax";

/** Internal Ca-transient / troponin-activation/reservoir/tension state of an active chamber. */
export type ChamberInternal = { c: number; a: number; r: number; tensionPa?: number; lambdaAct?: number };
export type ChamberInternalDerivatives = { cDot: number; aDot: number; rDot: number; tensionPaDot?: number; lambdaActDot?: number };

/** Inputs the chamber needs from the rest of the model at evaluation time. */
export type ChamberCtx = {
  HR: number;
  contractility: number;
  relaxation: number;
  phi: number; // cumulative cardiac phase (beats); theta = frac(phi)
  chamber?: Chamber;
  avDelaySec?: number; // atrial activation lead before ventricular phase 0/QRS
  atrialElectromechanicalDelaySec?: number;
  ventricularElectromechanicalDelaySec?: number;
  // active-stress scaling knobs
  tmaxScale: number;
  geomScale: number;
  caReleaseScale: number;
  pairedVentricleVolumeMl?: number;
  pairedVentricleShortening01?: number;
  pairedVentricleShorteningVelocity01PerSec?: number;
  inletValveOpen01?: number;
  outletValveOpen01?: number;
  side?: "left" | "right";
  // Legacy left-heart names retained for old probes/tests. New code should use
  // the paired/inlet/outlet fields so RA can reference RV/TV/PV instead of LV/MV/AoV.
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
  internalDerivatives(V: number, internal: ChamberInternal, ctx: ChamberCtx): ChamberInternalDerivatives;
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
  passiveHingeWidth?: number;
  Tmax0: number;
  tauLambdaActSec?: number;
  lambdaActTerms?: LambdaActTerms;
  lowStretchLimiter?: LowStretchLimiterMode;
  lowStretchLimiterKnee?: number;
  lowStretchLimiterWidth?: number;
  lowStretchLimiterStrength?: number;
  lowStretchLimiterActivationThreshold?: number;
  tauTensionRiseSec?: number;
  tauTensionFallSec?: number;
  tensionInstantMix?: number;
  forceVelocityShorteningCoeff?: number;
  forceVelocityLengtheningCoeff?: number;
  forceVelocityMin?: number;
  forceVelocityMax?: number;
  kOver: number;
  lambdaFail: number;
  geomChi: number;
  thetaOn: number;
  pressureFloorMmHg?: number;
  atrialLeadSec?: number;
  // PR5 (human plan): AV-plane descent as an effective wall-volume correction
  // (NOT a hidden reservoir branch). During paired ventricular ejection the AV
  // plane descends, reducing atrial wall stretch/capacity pressure and shaping
  // the x-descent. LA uses LV/MV/AoV; RA uses RV/TV/PV.
  // Vwall = V - avPlaneGainMl * gatedDescent01. Default undefined/0 = no shift.
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

export type ChamberPressureTerms = {
  lambda: number;
  passiveStretch: number;
  sigmaPas: number;
  sigmaActTarget: number;
  sigmaAct: number;
  pressureUnclampedMmHg: number;
  pressureMmHg: number;
  pressureFloorHit01: number;
};

export type ActiveStressDebugTerms = ChamberPressureTerms & {
  c: number;
  a: number;
  Kd: number;
  aInf: number;
  tauA: number;
  fIso: number;
  fIsoRaw: number;
  fIsoLimiter: number;
  fIsoLimiterDelta: number;
  gOver: number;
  forceVelocityScale: number;
  tensionFilterActive01: number;
  lambdaRaw: number;
  lambdaAct: number;
  lambdaForKd: number;
  lambdaForFIso: number;
  lambdaActTerms: LambdaActTerms;
  tauLambdaActSec: number;
  dLogAInf_dLambdaAct: number;
  dLogFIso_dLambdaAct: number;
  dLogGOver_dLambdaRaw: number;
  dLogCompositeActive_dLambdaAct: number;
  lambdaActMinusRaw: number;
  lambdaActTransferTauSec: number;
  lowStretchLimiter: LowStretchLimiterMode;
  lowStretchLimiterGate: number;
  lowStretchLimiterStrength: number;
  aInfRaw: number;
  aInfCap: number;
  aInfLimiterDelta: number;
  activeTargetLimiter: number;
  sigmaActTargetRaw: number;
  dLogAInf_dLambda: number;
  dLogFIso_dLambda: number;
  dLogGOver_dLambda: number;
  dLogCompositeActive_dLambda: number;
};

function smoothPositiveHinge(x: number, width: number): number {
  if (width <= 0) return Math.max(x, 0);
  return width * Math.log1p(Math.exp(clamp(x / width, -40, 40)));
}

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
  kOff: 12,
  sigmaPas0: 200.133, // M12-lite: steep Klotz EDPVR refit at corrected geomChi; was 2000 (tuned to old geomChi 0.36)
  bPas: 23.2,         // M12-lite: steep high-volume limb (Klotz P140~23.5) for MR dilation-resistance; was 10.0
  lambdaPas0: 0.9025, // M12-lite: EDPVR shape fit; was 0.85
  Tmax0: 135000, // M12-lite: physiological ceiling (~135 kPa); was 382500 (4.5x fudge)
  tauTensionRiseSec: 0,
  tauTensionFallSec: 0,
  tensionInstantMix: 1,
  forceVelocityShorteningCoeff: 0.001,
  forceVelocityLengtheningCoeff: 0.0005,
  forceVelocityMin: 0.98,
  forceVelocityMax: 1.01,
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
  Tmax0: 74088, // RV/PVF refit: restores normal RVEF while keeping the RV ceiling well below LV; was 57176
  kOff: 12,
  tauTensionRiseSec: 0,
  tauTensionFallSec: 0,
  tensionInstantMix: 1,
  forceVelocityShorteningCoeff: 0.0008,
  forceVelocityLengtheningCoeff: 0.0004,
  forceVelocityMin: 0.98,
  forceVelocityMax: 1.01,
  geomChi: 1.138505, // M12-lite: exact thick-sphere Laplace for RV ref geometry; was 0.28
};

export const defaultActiveLA: ActiveChamberParams = {
  ...defaultActiveLV,
  // PR4/PR5: LA recalibrated as a SINGLE active-stress chamber. Reservoir
  // function comes from pulmonary venous return + MV closure + AV-plane descent
  // + LA relaxation; the hidden two-branch sleeve remains disabled.
  V0: 5,
  Vw: 16,
  Vref: 45,
  Vmin: 1,
  Trel0: 0.10,
  TrelMin: 0.06,
  TrelMax: 0.13,
  tauCa0: 0.08,
  Arel0: 0.15,
  Kd0: 0.18,
  betaLambda: 2.0,
  hillN: 2.5,
  kOn: 15,
  kOff: 8,
  sigmaPas0: 1900,
  bPas: 10,
  lambdaPas0: 0.88,
  Tmax0: 92000,
  tauTensionRiseSec: 0,
  tauTensionFallSec: 0,
  tensionInstantMix: 1,
  forceVelocityShorteningCoeff: 0,
  forceVelocityLengtheningCoeff: 0,
  geomChi: 1.1,
  thetaOn: 0.80,
  pressureFloorMmHg: -2,
  atrialLeadSec: 0.16,
  avPlaneGainMl: 10,
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
  V0: 5,
  Vw: 18,
  Vref: 45,
  Vmin: 1,
  Trel0: 0.085,
  TrelMin: 0.055,
  TrelMax: 0.120,
  tauCa0: 0.055,
  Arel0: 0.16,
  Kd0: 0.18,
  betaLambda: 1.8,
  hillN: 2.5,
  kOn: 18,
  kOff: 12,
  sigmaPas0: 240,
  bPas: 10,
  lambdaPas0: 0.88,
  Tmax0: 28000,
  tauTensionRiseSec: 0,
  tauTensionFallSec: 0,
  tensionInstantMix: 1,
  forceVelocityShorteningCoeff: 0,
  forceVelocityLengtheningCoeff: 0,
  geomChi: 1.10,
  pressureFloorMmHg: -2,
  atrialLeadSec: 0.17,
  avPlaneGainMl: 12,
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

  private wallVolume(V: number, ctx: ChamberCtx): number {
    const avp = this.ap.avPlaneGainMl ?? 0;
    if (this.twoBranchEnabled() || avp <= 0) return V;
    const descent01 = this.avPlaneDescent01(ctx);
    return Math.max(this.ap.V0 + this.ap.Vmin, V - avp * descent01);
  }

  private pairedShortening01(ctx: ChamberCtx): number {
    const legacyLeft = ctx.side === "right" ? 0 : (ctx.lvShortening01 ?? 0);
    return clamp(ctx.pairedVentricleShortening01 ?? legacyLeft, 0, 1);
  }

  private inletValveOpen01(ctx: ChamberCtx): number | undefined {
    return ctx.inletValveOpen01 ?? (ctx.side === "right" ? undefined : ctx.mvOpen01);
  }

  private outletValveOpen01(ctx: ChamberCtx): number | undefined {
    return ctx.outletValveOpen01 ?? (ctx.side === "right" ? undefined : ctx.aovOpen01);
  }

  private usesTensionFilter(ctx: ChamberCtx): boolean {
    return (ctx.chamber === "LV" || ctx.chamber === "RV")
      && ((this.ap.tauTensionRiseSec ?? 0) > 0 || (this.ap.tauTensionFallSec ?? 0) > 0);
  }

  private lambdaForActivation(lambdaRaw: number, internal: ChamberInternal): number {
    const tau = Math.max(this.ap.tauLambdaActSec ?? 0, 0);
    if (tau <= 0) return lambdaRaw;
    const lambdaAct = internal.lambdaAct;
    return Number.isFinite(lambdaAct) ? clamp(lambdaAct ?? lambdaRaw, 0.25, 2.5) : lambdaRaw;
  }

  private lambdaActTerms(): LambdaActTerms {
    const terms = this.ap.lambdaActTerms ?? "kd+fiso";
    return terms === "kd" || terms === "fiso" || terms === "kd+fiso" ? terms : "kd+fiso";
  }

  private lambdaActAppliesTo(term: "kd" | "fiso"): boolean {
    const terms = this.lambdaActTerms();
    return terms === "kd+fiso" || terms === term;
  }

  private lambdaForTerm(lambdaRaw: number, internal: ChamberInternal, term: "kd" | "fiso"): number {
    if (!this.lambdaActAppliesTo(term)) return lambdaRaw;
    return this.lambdaForActivation(lambdaRaw, internal);
  }

  private lowStretchLimiterMode(): LowStretchLimiterMode {
    const mode = this.ap.lowStretchLimiter ?? "none";
    return mode === "aInfCap" || mode === "activeReserveCap" || mode === "fIsoSlopeRelax" ? mode : "none";
  }

  private lowStretchLimiterStrength(): number {
    const fallback = this.lowStretchLimiterMode() === "fIsoSlopeRelax" ? 0.35 : 0.22;
    return clamp(this.ap.lowStretchLimiterStrength ?? fallback, 0, 0.8);
  }

  private lowStretchLimiterGate(lambdaRaw: number): number {
    if (this.lowStretchLimiterMode() === "none") return 0;
    const knee = this.ap.lowStretchLimiterKnee ?? 0.9;
    const width = Math.max(this.ap.lowStretchLimiterWidth ?? 0.08, 1e-6);
    const x = clamp((knee - lambdaRaw) / width, 0, 1);
    return x * x * (3 - 2 * x);
  }

  private smoothUpperCap(value: number, capValue: number, width = 0.015): number {
    if (value <= capValue || width <= 0) return Math.min(value, capValue);
    return capValue + width * (1 - Math.exp(-(value - capValue) / width));
  }

  private effectiveAInf(aInfRaw: number, lambdaRaw: number): {
    aInf: number;
    cap: number;
    delta: number;
    gate: number;
    strength: number;
  } {
    const gate = this.lowStretchLimiterGate(lambdaRaw);
    const strength = this.lowStretchLimiterStrength();
    if (this.lowStretchLimiterMode() !== "aInfCap" || gate <= 0 || strength <= 0) {
      return { aInf: aInfRaw, cap: 1, delta: 0, gate, strength };
    }
    const capValue = clamp(1 - strength * gate, 0.05, 1);
    const aInf = clamp(this.smoothUpperCap(aInfRaw, capValue), 0, Math.max(capValue, 0));
    return { aInf, cap: capValue, delta: Math.max(0, aInfRaw - aInf), gate, strength };
  }

  private activeTargetLimiter(lambdaRaw: number, a: number): {
    limiter: number;
    gate: number;
    strength: number;
  } {
    const gate = this.lowStretchLimiterGate(lambdaRaw);
    const strength = this.lowStretchLimiterStrength();
    if (this.lowStretchLimiterMode() !== "activeReserveCap" || gate <= 0 || strength <= 0) {
      return { limiter: 1, gate, strength };
    }
    const thresholdRaw = this.ap.lowStretchLimiterActivationThreshold;
    const reserve = thresholdRaw == null
      ? 1
      : clamp((a - clamp(thresholdRaw, 0, 0.98)) / Math.max(1 - clamp(thresholdRaw, 0, 0.98), 1e-6), 0, 1);
    return { limiter: clamp(1 - strength * gate * reserve, 0.1, 1), gate, strength };
  }

  private fIsoRaw(lambdaAct: number): number {
    const ap = this.ap;
    return clamp((lambdaAct - ap.lambdaPas0 + 0.3) / 0.35, 0, 1);
  }

  private effectiveFIso(lambdaAct: number): {
    fIso: number;
    raw: number;
    limiter: number;
    delta: number;
    gate: number;
    strength: number;
  } {
    const raw = this.fIsoRaw(lambdaAct);
    const mode = this.lowStretchLimiterMode();
    const strength = this.lowStretchLimiterStrength();
    if (mode !== "fIsoSlopeRelax" || strength <= 0 || raw <= 0 || raw >= 1) {
      return { fIso: raw, raw, limiter: 1, delta: 0, gate: 0, strength };
    }

    const ap = this.ap;
    const start = ap.lambdaPas0 - 0.3;
    const full = start + 0.35;
    const join = clamp(ap.lowStretchLimiterKnee ?? 0.86, start + 1e-5, full - 1e-5);
    if (lambdaAct >= join) {
      return { fIso: raw, raw, limiter: 1, delta: 0, gate: 0, strength };
    }

    const x = clamp((join - lambdaAct) / Math.max(join - start, 1e-6), 0, 1);
    const gate = x * x * (3 - 2 * x);
    // Multiplicative cap keeps fNew <= fOld everywhere and is C1 at the join
    // because the smoothstep gate has zero slope there.
    const limiter = clamp(1 - strength * gate, 0.05, 1);
    const fIso = raw * limiter;
    return { fIso, raw, limiter, delta: Math.max(0, raw - fIso), gate, strength };
  }

  private dLogEffectiveFIso_dLambda(lambdaAct: number): number {
    const eps = 1e-4;
    const lo = this.effectiveFIso(lambdaAct - eps).fIso;
    const hi = this.effectiveFIso(lambdaAct + eps).fIso;
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 1e-6 || hi <= 1e-6) return 0;
    return (Math.log(hi) - Math.log(lo)) / (2 * eps);
  }

  private activeStressTargetPa(a: number, lambdaRaw: number, lambdaAct: number, ctx: ChamberCtx): number {
    const ap = this.ap;
    const gOver = 1 / (1 + expClamped(ap.kOver * (lambdaRaw - ap.lambdaFail)));
    // Realistic f_iso so tension rapidly drops as the heart empties.
    const f_iso = this.effectiveFIso(lambdaAct).fIso;
    const raw = ap.Tmax0 * ctx.tmaxScale * ctx.contractility * a * gOver * f_iso * this.forceVelocityScale(ctx);
    return raw * this.activeTargetLimiter(lambdaRaw, a).limiter;
  }

  private forceVelocityScale(ctx: ChamberCtx): number {
    if (ctx.chamber !== "LV" && ctx.chamber !== "RV") return 1;
    const ap = this.ap;
    const shorteningCoeff = ap.forceVelocityShorteningCoeff ?? 0;
    const lengtheningCoeff = ap.forceVelocityLengtheningCoeff ?? 0;
    if (shorteningCoeff <= 0 && lengtheningCoeff <= 0) return 1;

    const velocity = clamp(ctx.pairedVentricleShorteningVelocity01PerSec ?? 0, -4, 6);
    const shorteningVelocity = Math.max(velocity, 0);
    const lengtheningVelocity = Math.max(-velocity, 0);
    const outletOpen = clamp(this.outletValveOpen01(ctx) ?? 0, 0, 1);
    const inletOpen = clamp(this.inletValveOpen01(ctx) ?? 0, 0, 1);
    const ejectionGate = outletOpen * clamp(1 - inletOpen, 0, 1);

    // Hill-like force-velocity behavior: active fibre shortening reduces force
    // development; lengthening has only a small stabilising effect.
    const shorteningScale = 1 / (1 + shorteningCoeff * shorteningVelocity * (0.35 + 0.65 * ejectionGate));
    const lengtheningScale = 1 + lengtheningCoeff * Math.min(lengtheningVelocity, 2) * clamp(1 - outletOpen, 0, 1);
    return clamp(shorteningScale * lengtheningScale, ap.forceVelocityMin ?? 0.85, ap.forceVelocityMax ?? 1.05);
  }

  private bodyPressureTerms(
    V: number,
    internal: ChamberInternal,
    ctx: ChamberCtx,
    sourceActiveFiberStressPa?: number,
  ): ChamberPressureTerms {
    const ap = this.ap;
    const a = clamp(internal.a, 0, 1);
    const { lambda, h, rm } = this.geometry(V);
    const lambdaForFIso = this.lambdaForTerm(lambda, internal, "fiso");
    const stretch = smoothPositiveHinge(lambda - ap.lambdaPas0, ap.passiveHingeWidth ?? 0.015);
    const sigmaPas = ap.sigmaPas0 * (expClamped(ap.bPas * stretch) - 1);
    const sigmaActTarget = sourceActiveFiberStressPa == null
      ? this.activeStressTargetPa(a, lambda, lambdaForFIso, ctx)
      : this.finiteExternalActiveFiberStress(sourceActiveFiberStressPa);
    const sigmaAct = sourceActiveFiberStressPa == null && this.usesTensionFilter(ctx)
      ? clamp(
        (internal.tensionPa ?? sigmaActTarget)
          + clamp(ap.tensionInstantMix ?? 0, 0, 1) * (sigmaActTarget - (internal.tensionPa ?? sigmaActTarget)),
        0,
        500000,
      )
      : sigmaActTarget;
    const sigma = sigmaPas + sigmaAct;
    const PtmPa = ctx.geomScale * ap.geomChi * (2 * h / Math.max(rm, 1e-6)) * sigma;
    const pressureUnclampedMmHg = PtmPa / MMHG_TO_PA;
    const pressureFloor = ap.pressureFloorMmHg ?? -5;
    return {
      lambda,
      passiveStretch: stretch,
      sigmaPas,
      sigmaActTarget,
      sigmaAct,
      pressureUnclampedMmHg,
      pressureMmHg: clamp(pressureUnclampedMmHg, pressureFloor, 260),
      pressureFloorHit01: pressureUnclampedMmHg <= pressureFloor ? 1 : 0,
    };
  }

  private bodyPressure(V: number, internal: ChamberInternal, ctx: ChamberCtx): number {
    return this.bodyPressureTerms(V, internal, ctx).pressureMmHg;
  }

  debugPressureTerms(V: number, internal: ChamberInternal, ctx: ChamberCtx): ChamberPressureTerms {
    return this.bodyPressureTerms(this.wallVolume(V, ctx), internal, ctx);
  }

  pressureFromActiveFiberStress(
    V: number,
    internal: ChamberInternal,
    ctx: ChamberCtx,
    sourceActiveFiberStressPa: number,
  ): number {
    return this.debugPressureTermsFromActiveFiberStress(V, internal, ctx, sourceActiveFiberStressPa).pressureMmHg;
  }

  debugPressureTermsFromActiveFiberStress(
    V: number,
    internal: ChamberInternal,
    ctx: ChamberCtx,
    sourceActiveFiberStressPa: number,
  ): ChamberPressureTerms {
    if (this.twoBranchEnabled()) {
      throw new Error("source active-fiber stress pressure adapter does not support two-branch chamber models");
    }
    return this.bodyPressureTerms(
      this.wallVolume(V, ctx),
      internal,
      ctx,
      sourceActiveFiberStressPa,
    );
  }

  private finiteExternalActiveFiberStress(sourceActiveFiberStressPa: number): number {
    if (!Number.isFinite(sourceActiveFiberStressPa)) {
      throw new Error("source active-fiber stress must be finite");
    }
    if (sourceActiveFiberStressPa < 0) {
      throw new Error("source active-fiber stress must be nonnegative");
    }
    return sourceActiveFiberStressPa;
  }

  debugActiveStressTerms(V: number, internal: ChamberInternal, ctx: ChamberCtx): ActiveStressDebugTerms {
    const ap = this.ap;
    const pressure = this.bodyPressureTerms(V, internal, ctx);
    const c = Math.max(internal.c, 0);
    const a = clamp(internal.a, 0, 1);
    const betaDrive = clamp((ctx.contractility - 1) / 1.5, 0, 1);
    const lambdaRaw = pressure.lambda;
    const lambdaAct = this.lambdaForActivation(lambdaRaw, internal);
    const lambdaForKd = this.lambdaForTerm(lambdaRaw, internal, "kd");
    const lambdaForFIso = this.lambdaForTerm(lambdaRaw, internal, "fiso");
    const Kd = ap.Kd0 * expClamped(-ap.betaLambda * (lambdaForKd - 1) + ap.betaKd * betaDrive);
    const cn = Math.pow(Math.max(c, 0), ap.hillN);
    const kn = Math.pow(Math.max(Kd, 1e-6), ap.hillN);
    const aInfRaw = cn / Math.max(cn + kn, 1e-9);
    const aInfLimit = this.effectiveAInf(aInfRaw, lambdaRaw);
    const aInf = aInfLimit.aInf;
    const tauA = 1 / Math.max(ap.kOn * cn + ap.kOff, 0.5);
    const gOver = 1 / (1 + expClamped(ap.kOver * (lambdaRaw - ap.lambdaFail)));
    const fIsoTerms = this.effectiveFIso(lambdaForFIso);
    const fIso = fIsoTerms.fIso;
    const forceVelocityScale = this.forceVelocityScale(ctx);
    const sigmaActTargetRaw = ap.Tmax0 * ctx.tmaxScale * ctx.contractility * a * gOver * fIso * forceVelocityScale;
    const activeLimiter = this.activeTargetLimiter(lambdaRaw, a);
    // Report the raw Kd/aInf length sensitivity. aInfCap is a ceiling on the
    // effective activation and must not make the diagnostic slope look larger.
    const dLogAInf_dLambda = ap.hillN * ap.betaLambda * (1 - aInfRaw);
    const dLogFIso_dLambda = this.dLogEffectiveFIso_dLambda(lambdaForFIso);
    const dLogGOver_dLambda = -ap.kOver * (1 - gOver);
    const terms = this.lambdaActTerms();
    const dLogCompositeActive_dLambdaAct = (this.lambdaActAppliesTo("kd") ? dLogAInf_dLambda : 0)
      + (this.lambdaActAppliesTo("fiso") ? dLogFIso_dLambda : 0);
    return {
      ...pressure,
      c,
      a,
      Kd,
      aInf,
      tauA,
      fIso,
      fIsoRaw: fIsoTerms.raw,
      fIsoLimiter: fIsoTerms.limiter,
      fIsoLimiterDelta: fIsoTerms.delta,
      gOver,
      forceVelocityScale,
      tensionFilterActive01: this.usesTensionFilter(ctx) ? 1 : 0,
      lambdaRaw,
      lambdaAct,
      lambdaForKd,
      lambdaForFIso,
      lambdaActTerms: terms,
      tauLambdaActSec: Math.max(ap.tauLambdaActSec ?? 0, 0),
      dLogAInf_dLambdaAct: dLogAInf_dLambda,
      dLogFIso_dLambdaAct: dLogFIso_dLambda,
      dLogGOver_dLambdaRaw: dLogGOver_dLambda,
      dLogCompositeActive_dLambdaAct,
      lambdaActMinusRaw: lambdaAct - lambdaRaw,
      lambdaActTransferTauSec: Math.max(ap.tauLambdaActSec ?? 0, 0),
      lowStretchLimiter: this.lowStretchLimiterMode(),
      lowStretchLimiterGate: Math.max(aInfLimit.gate, activeLimiter.gate, fIsoTerms.gate),
      lowStretchLimiterStrength: this.lowStretchLimiterStrength(),
      aInfRaw,
      aInfCap: aInfLimit.cap,
      aInfLimiterDelta: aInfLimit.delta,
      activeTargetLimiter: activeLimiter.limiter,
      sigmaActTargetRaw,
      dLogAInf_dLambda,
      dLogFIso_dLambda,
      dLogGOver_dLambda,
      dLogCompositeActive_dLambda: dLogAInf_dLambda + dLogFIso_dLambda + dLogGOver_dLambda,
    };
  }

  passivePressure(V: number, ctx: ChamberCtx): number {
    const passiveCtx = { ...ctx, contractility: 0, tmaxScale: 0, caReleaseScale: 0 };
    return this.bodyPressure(this.wallVolume(V, passiveCtx), { c: 0, a: 0, r: 0, tensionPa: 0 }, passiveCtx);
  }

  pressure(V: number, internal: ChamberInternal, ctx: ChamberCtx): number {
    if (!this.twoBranchEnabled()) {
      // PR5: gated AV-plane descent lowers atrial pressure during paired
      // ventricular ejection and releases by IVR/inlet-valve opening.
      return this.bodyPressure(this.wallVolume(V, ctx), internal, ctx);
    }
    return this.reservoirBranchState(V, internal, ctx).pressureMmHg;
  }

  private avPlaneDescent01(ctx: ChamberCtx): number {
    const shortening = this.pairedShortening01(ctx);
    if (shortening <= 0) return 0;

    const inletOpen = this.inletValveOpen01(ctx);
    if (inletOpen != null) {
      const inletClosed01 = clamp(1 - inletOpen, 0, 1);
      return shortening * inletClosed01;
    }

    const theta = frac(ctx.phi);
    return shortening * (ctx.systolicGate ?? systolicReservoirGate(theta, 0.58));
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

  internalDerivatives(V: number, internal: ChamberInternal, ctx: ChamberCtx): ChamberInternalDerivatives {
    const ap = this.ap;
    const c = Math.max(internal.c, 0);
    const a = clamp(internal.a, 0, 1);
    const { lambda } = this.geometry(this.wallVolume(V, ctx));
    const tauLambdaAct = Math.max(ap.tauLambdaActSec ?? 0, 0);
    const lambdaAct = this.lambdaForActivation(lambda, internal);
    const lambdaForKd = this.lambdaForTerm(lambda, internal, "kd");
    const lambdaForFIso = this.lambdaForTerm(lambda, internal, "fiso");

    const HR = Math.max(ctx.HR, 20);
    const T = 60 / HR;
    const T0 = 60 / ap.HR0;
    const Trel = clamp(ap.Trel0 * Math.pow(T / T0, ap.etaRel), ap.TrelMin, ap.TrelMax);
    const durationTheta = clamp(Trel / T, 0.02, 0.3);
    const theta = frac(ctx.phi);
    const durationSec = durationTheta * T;
    const isAtrium = ctx.chamber === "LA" || ctx.chamber === "RA" || ap.atrialLeadSec != null;
    const atrialElectricalDelaySec = ctx.avDelaySec ?? ap.atrialLeadSec;
    const atrialLeadSec = atrialElectricalDelaySec != null
      ? Math.max(0, atrialElectricalDelaySec - (ctx.atrialElectromechanicalDelaySec ?? 0))
      : undefined;
    const ventricularDelaySec = ctx.ventricularElectromechanicalDelaySec ?? 0;
    const thetaOnEff = isAtrium && atrialLeadSec != null
      ? frac(1 - clamp(atrialLeadSec, 0, Math.max(0, T - durationSec)) / T)
      : frac(clamp(ventricularDelaySec, 0, Math.max(0, T - durationSec)) / T);
    const pulse = raisedCosinePulse(theta, thetaOnEff, durationTheta, T);

    const betaDrive = clamp((ctx.contractility - 1) / 1.5, 0, 1);
    const tauCa = (ap.tauCa0 * Math.pow(T / T0, ap.etaCa)) / Math.max(ctx.relaxation, 0.2);
    const ffr = Math.max(0, 1 + ap.gFFR * ((HR - ap.HR0) / ap.HR0) - ap.gFFR2 * Math.pow(Math.max(0, (HR - ap.HR0) / ap.HR0), 2));
    const Arel = ap.Arel0 * ctx.caReleaseScale * ffr * (1 + 0.2 * betaDrive) * ctx.contractility;
    const cDot = clamp(-(c - ap.cDia) / Math.max(tauCa, 0.02) + Arel * pulse, -20, 20);

    const Kd = ap.Kd0 * expClamped(-ap.betaLambda * (lambdaForKd - 1) + ap.betaKd * betaDrive);
    const cn = Math.pow(Math.max(c, 0), ap.hillN);
    const kn = Math.pow(Math.max(Kd, 1e-6), ap.hillN);
    const aInfRaw = cn / Math.max(cn + kn, 1e-9);
    const aInf = this.effectiveAInf(aInfRaw, lambda).aInf;
    const tauA = 1 / Math.max(ap.kOn * cn + ap.kOff, 0.5);
    const aDot = clamp((aInf - a) / tauA, -20, 20);
    const rDot = reservoirQDot(ap, internal, ctx, theta);
    let tensionPaDot = 0;
    if (this.usesTensionFilter(ctx)) {
      const target = this.activeStressTargetPa(a, lambda, lambdaForFIso, ctx);
      const current = clamp(internal.tensionPa ?? target, 0, 500000);
      const tau = target > current
        ? Math.max(ap.tauTensionRiseSec ?? 0.045, 1e-4)
        : Math.max(ap.tauTensionFallSec ?? 0.100, 1e-4);
      tensionPaDot = clamp((target - current) / tau, -5000000, 5000000);
    }
    const lambdaActDot = tauLambdaAct > 0 ? clamp((lambda - lambdaAct) / Math.max(tauLambdaAct, 1e-4), -20, 20) : 0;
    return { cDot, aDot, rDot, tensionPaDot, lambdaActDot };
  }

  initialInternal(): ChamberInternal {
    return { c: this.ap.cDia, a: 0, r: 0, tensionPa: 0, lambdaAct: 1 };
  }
}

function reservoirQDot(ap: ActiveChamberParams, internal: ChamberInternal, ctx: ChamberCtx, theta: number): number {
  const stroke = Math.max(ap.reservoirStrokeMl ?? 0, 0);
  const gain = Math.max(ap.reservoirBranchGain ?? 0, 0);
  if (stroke <= 0 || gain <= 0) return 0;

  const q = clamp(internal.r, 0, stroke);
  const th = ap.reservoirValveThreshold ?? 0.15;
  const inletOpenRaw = ctx.inletValveOpen01 ?? (ctx.side === "right" ? undefined : ctx.mvOpen01);
  const outletOpenRaw = ctx.outletValveOpen01 ?? (ctx.side === "right" ? undefined : ctx.aovOpen01);
  const legacyLeftShortening = ctx.side === "right" ? 0 : (ctx.lvShortening01 ?? 0);
  const descentTarget = stroke * clamp(ctx.pairedVentricleShortening01 ?? legacyLeftShortening, 0, 1);
  let target = q;
  let tau = ap.reservoirTauFill ?? 0.10;

  if (inletOpenRaw != null && outletOpenRaw != null) {
    const inletOpen = clamp(inletOpenRaw, 0, 1);
    const outletOpen = clamp(outletOpenRaw, 0, 1);
    const inletClosed = inletOpen <= th;
    const outletClosed = outletOpen <= th;
    if (outletOpen > th && inletClosed) {
      target = descentTarget;
      tau = ap.reservoirTauFill ?? 0.10;
    } else if (outletClosed && inletClosed) {
      target = 0;
      tau = ap.reservoirTauRecoilIVR ?? 0.035;
    } else if (inletOpen > th) {
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
export function chamberActivation(
  chamber: Chamber,
  phi: number,
  HR: number,
  avDelaySec = 0.16,
  atrialElectromechanicalDelaySec = 0,
  ventricularElectromechanicalDelaySec = 0,
): number {
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
    const delaySec = clamp(ventricularElectromechanicalDelaySec, 0, Math.max(0, T - TsV));
    const localSec = frac(theta - delaySec / T) * T;
    return ventricularDoubleHillActivation(localSec, T, TsV);
  }
  const leadSec = clamp(Math.max(0, avDelaySec - atrialElectromechanicalDelaySec), 0, Math.max(0, T - TsA));
  const tauA = frac(theta + leadSec / T) * T;
  return 0.35 * window(tauA, TsA);
}

function ventricularDoubleHillActivation(localSec: number, cycleSec: number, nominalPeakSec: number): number {
  const tPeak = clamp(nominalPeakSec, 0.18 * cycleSec, 0.42 * cycleSec);
  const x = Math.max(0, localSec) / Math.max(tPeak, 1e-6);
  const eNorm = ventricularDoubleHillRaw(x) / VENTRICULAR_DOUBLE_HILL_PEAK_RAW;
  return clamp(eNorm, 0, 1);
}

const ventricularDoubleHillRaw = (x: number): number => {
  const gRise = Math.pow(x / 0.78, 2.40);
  const gDecay = Math.pow(x / 1.23, 12.00);
  return (gRise / (1 + gRise)) * (1 / (1 + gDecay));
};

const VENTRICULAR_DOUBLE_HILL_PEAK_RAW = ventricularDoubleHillRaw(1);

export class ElastanceChamberModel implements ChamberModel {
  constructor(public readonly ep: ElastanceParams) {}

  pressure(V: number, _internal: ChamberInternal, ctx: ChamberCtx): number {
    const ep = this.ep;
    const Veff = Math.max(V - ep.V0, 0);
    const Ped = ep.beta * (Math.exp(clamp(ep.alpha * Veff, -20, 20)) - 1);
    const Pes = ep.Ees * Veff;
    const e = chamberActivation(
      ep.chamber,
      ctx.phi,
      ctx.HR,
      ctx.avDelaySec,
      ctx.atrialElectromechanicalDelaySec,
      ctx.ventricularElectromechanicalDelaySec,
    );
    return clamp(Ped + e * (Pes - Ped), -5, 250);
  }

  internalDerivatives(): ChamberInternalDerivatives {
    return { cDot: 0, aDot: 0, rDot: 0, tensionPaDot: 0 };
  }

  initialInternal(): ChamberInternal {
    return { c: 0, a: 0, r: 0, tensionPa: 0 };
  }
}
