import {
  land2017CaT50, land2017CaTRPNUnblockingFactor, land2017GammaSu,
  land2017GammaWu, land2017LengthFactor,
} from "@/engine/myocardium/myofilament/land2017/equations";
import type { Land2017SourceParameterSet } from "@/engine/myocardium/myofilament/land2017/parameterSets";

/** Independent, component-only hypothesis, NOT a Land checkpoint or RDQ20.
 * Six states: C, B, W, S, Mw=W*zetaW, Ms=S*zetaS. Incoming bridges have zero
 * excess distortion (also on W->S); departures carry their pool's mean.
 * Thus M'd = Ad*N*lambda' - outgoingRate*M. The mean recovers through actual
 * replacement, not Land's steady-population cw/cs approximation. The default
 * flux-only variant does not use phi/cw/cs. An explicitly named alternative
 * adds phenomenological phi-scaled turnover relaxation (see excessRecovery).
 * Detachment at the mean is a closure, not an exact reduction
 * of a strain-distribution PDE. Chemical energy/ATP are not represented.
 * No extra exit, force clipping, chamber pressure, or valve-event input.
 */
export const LAND_POPULATION_MOMENT_RESEARCH_V1 = "land-population-moment-research-v1";
export type PopulationMomentRecoveryV1 = "flux-only" | "source-phi-turnover-closure";
export type PopulationMomentStateV1 = Readonly<{
  caTroponin: number; blocked: number; weak: number; strong: number;
  weakMoment: number; strongMoment: number;
}>;
export type PopulationMomentInputV1 = Readonly<{
  calciumUM: number; stretch: number; stretchRatePerSec: number;
}>;

export function validatePopulationMomentStateV1(s: PopulationMomentStateV1): void {
  if (![s.caTroponin, s.blocked, s.weak, s.strong, s.weakMoment, s.strongMoment].every(Number.isFinite)
    || s.caTroponin <= 0 || s.caTroponin > 1
    || Math.min(s.blocked, s.weak, s.strong, 1 - s.blocked - s.weak - s.strong) < 0
    || (s.weak === 0 && s.weakMoment !== 0) || (s.strong === 0 && s.strongMoment !== 0)) {
    throw new Error("invalid population-moment state (including empty-pool moment)");
  }
}

function mean(moment: number, population: number): number {
  // Empty pools cannot hide stored distortion. No epsilon denominator or clamp.
  const value = population === 0 ? 0 : moment / population;
  if (!Number.isFinite(value)) throw new Error("nonfinite population-moment mean distortion");
  return value;
}

function excessRecovery(p: Land2017SourceParameterSet, recovery: PopulationMomentRecoveryV1): number {
  if (recovery === "flux-only") return 0;
  if (recovery !== "source-phi-turnover-closure" || !Number.isFinite(p.values.phi) || p.values.phi < 1) {
    throw new Error("unsupported population-moment recovery closure");
  }
  // Additional within-pool relaxation proportional to incoming turnover.
  // This is a PHENOMENOLOGICAL hypothesis, not the zero-distortion birth /
  // mean-departure balance alone, and not a derived variance correction.
  // It retains the source phi with no new coefficient. It vanishes when
  // there is no incoming flux; it does not claim chemical energy closure.
  return p.values.phi - 1;
}

function validate(input: PopulationMomentInputV1, p: Land2017SourceParameterSet) {
  if (p.strongBridgeDeactivationExit !== undefined) {
    throw new Error("population-moment hypothesis does not support the added bridge-exit law");
  }
  const v = p.values, d = p.derived;
  if (![v.kTRPN, v.ku, v.kuw, v.kws, v.gammaS, v.gammaW, d.kb, d.kwu, d.ksu]
    .every(x => Number.isFinite(x) && x >= 0)
    || ![v.nTRPN, v.nTm, v.rs, v.Tref, d.Aw, d.As].every(x => Number.isFinite(x) && x > 0)
    || v.rs >= 1 || ![v.beta0, v.beta1, v.CaT50Ref].every(Number.isFinite)) {
    throw new Error("invalid population-moment parameters");
  }
  const ca50 = land2017CaT50(input.stretch, v);
  if (![input.calciumUM, input.stretch, input.stretchRatePerSec, ca50].every(Number.isFinite)
    || input.calciumUM < 0 || input.stretch <= 0 || ca50 <= 0) {
    throw new Error("invalid population-moment input");
  }
  const drive = (input.calciumUM / ca50) ** v.nTRPN;
  if (!Number.isFinite(drive)) throw new Error("nonfinite population-moment calcium drive");
  return drive;
}

export function equilibratePopulationMomentV1(calciumUM: number, stretch: number,
  p: Land2017SourceParameterSet): PopulationMomentStateV1 {
  const drive = validate({ calciumUM, stretch, stretchRatePerSec: 0 }, p);
  const v = p.values, d = p.derived, caTroponin = drive / (1 + drive);
  if (!(caTroponin > 0 && v.ku > 0 && d.kwu + v.kws > 0 && d.ksu > 0)) {
    throw new Error("population-moment equilibrium requires nondegenerate rates and positive calcium");
  }
  const bOverU = d.kb * land2017CaTRPNUnblockingFactor(caTroponin, v)
    / (v.ku * caTroponin ** (v.nTm / 2));
  const wOverU = v.kuw / (d.kwu + v.kws), sOverU = v.kws * wOverU / d.ksu;
  const u = 1 / (1 + bOverU + wOverU + sOverU);
  const state = { caTroponin, blocked: bOverU * u, weak: wOverU * u,
    strong: sOverU * u, weakMoment: 0, strongMoment: 0 };
  validatePopulationMomentStateV1(state);
  return state;
}

export function populationMomentNominalStressV1(s: PopulationMomentStateV1,
  stretch: number, p: Land2017SourceParameterSet): number {
  validatePopulationMomentStateV1(s);
  validate({ calciumUM: 0, stretch, stretchRatePerSec: 0 }, p);
  const stress = land2017LengthFactor(stretch, p.values) * p.values.Tref / p.values.rs
    * (s.strong + s.strongMoment + s.weakMoment);
  if (!Number.isFinite(stress)) throw new Error("nonfinite population-moment stress");
  return stress;
}

export function populationMomentRhsV1(s: PopulationMomentStateV1,
  input: PopulationMomentInputV1, p: Land2017SourceParameterSet,
  recovery: PopulationMomentRecoveryV1 = "flux-only"): PopulationMomentStateV1 {
  validatePopulationMomentStateV1(s);
  const drive = validate(input, p), v = p.values, d = p.derived;
  const u = 1 - s.blocked - s.weak - s.strong;
  const weakExit = d.kwu + v.kws + land2017GammaWu(mean(s.weakMoment, s.weak), v);
  const strongExit = d.ksu + land2017GammaSu(mean(s.strongMoment, s.strong), v);
  const extra = excessRecovery(p, recovery);
  return {
    caTroponin: v.kTRPN * (drive * (1 - s.caTroponin) - s.caTroponin),
    blocked: d.kb * land2017CaTRPNUnblockingFactor(s.caTroponin, v) * u
      - v.ku * s.caTroponin ** (v.nTm / 2) * s.blocked,
    weak: v.kuw * u - weakExit * s.weak,
    strong: v.kws * s.weak - strongExit * s.strong,
    weakMoment: d.Aw * s.weak * input.stretchRatePerSec - weakExit * s.weakMoment
      - extra * v.kuw * u * mean(s.weakMoment, s.weak),
    strongMoment: d.As * s.strong * input.stretchRatePerSec - strongExit * s.strongMoment
      - extra * v.kws * s.weak * mean(s.strongMoment, s.strong),
  };
}

/** First-order linearly implicit step, NOT full nonlinear backward Euler.
 * Ca is BE; detachment rates are frozen at the previous mean distortion.
 * The resulting Markov population block and moment losses are implicit.
 * This avoids a new Newton solver for component screening. Time refinement
 * remains necessary; positivity does not establish accuracy or closed-loop
 * stability. No adaptive hidden step, normalization, or state projection.
 */
export function stepPopulationMomentV1(previous: PopulationMomentStateV1,
  input: PopulationMomentInputV1, dtSec: number, p: Land2017SourceParameterSet,
  recovery: PopulationMomentRecoveryV1 = "flux-only"): PopulationMomentStateV1 {
  validatePopulationMomentStateV1(previous);
  if (!Number.isFinite(dtSec) || dtSec <= 0) throw new Error("invalid population-moment step");
  const drive = validate(input, p), v = p.values, d = p.derived, h = dtSec;
  const extra = excessRecovery(p, recovery);
  const caTroponin = (previous.caTroponin + h * v.kTRPN * drive)
    / (1 + h * v.kTRPN * (1 + drive));
  const a = d.kb * land2017CaTRPNUnblockingFactor(caTroponin, v);
  const b = v.ku * caTroponin ** (v.nTm / 2);
  const l = d.kwu + land2017GammaWu(mean(previous.weakMoment, previous.weak), v);
  const q = d.ksu + land2017GammaSu(mean(previous.strongMoment, previous.strong), v);
  const db = 1 + h * b, dw = 1 + h * (l + v.kws), ds = 1 + h * q;
  // Positive elimination of U from B <-> U <-> W -> S -> U.
  // Unlike 1-B-W-S recovery, every numerator term here is nonnegative.
  const u = ((1 - previous.blocked - previous.weak - previous.strong)
    + h * b * previous.blocked / db
    + h * (l + h * q * v.kws / ds) * previous.weak / dw
    + h * q * previous.strong / ds)
    / (1 + h * a / db + h * v.kuw * (1 + h * v.kws / ds) / dw);
  const blocked = (previous.blocked + h * a * u) / db;
  const weak = (previous.weak + h * v.kuw * u) / dw;
  const strong = (previous.strong + h * v.kws * weak) / ds;
  const momentWeakDenominator = dw + (weak === 0 ? 0 : h * extra * v.kuw * u / weak);
  const momentStrongDenominator = ds + (strong === 0 ? 0 : h * extra * v.kws * weak / strong);
  if (![momentWeakDenominator, momentStrongDenominator].every(Number.isFinite)) {
    throw new Error("nonfinite population-moment loss denominator");
  }
  const next = { caTroponin, blocked, weak, strong,
    weakMoment: (previous.weakMoment + h * d.Aw * weak * input.stretchRatePerSec)
      / momentWeakDenominator,
    strongMoment: (previous.strongMoment + h * d.As * strong * input.stretchRatePerSec)
      / momentStrongDenominator };
  validatePopulationMomentStateV1(next);
  if (Math.abs(u - (1 - blocked - weak - strong)) > 2e-13) {
    throw new Error("population-moment Markov conservation postcondition failed");
  }
  return next;
}
