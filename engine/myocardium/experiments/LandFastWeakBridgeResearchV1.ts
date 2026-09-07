import {
  land2017CaT50, land2017CaTRPNUnblockingFactor, land2017GammaSu,
  land2017GammaWu, land2017LengthFactor,
} from "@/engine/myocardium/myofilament/land2017/equations";
import type { Land2017SourceParameterSet } from "@/engine/myocardium/myofilament/land2017/parameterSets";

/** Component-only, independent four-state approximation; NOT a Land checkpoint.
 * Eliminate dW/dt and d(zetaW)/dt by setting them to zero (Land 2017 Eqs 49,51).
 * Keep troponin, blocked/strong populations, and strong distortion dynamic.
 * This preserves fixed-length equilibrium but not fast weak-bridge memory.
 * No extra bridge-exit law, force projection, or chamber pressure input.
 */
export const LAND_FAST_WEAK_BRIDGE_RESEARCH_V1 = "land-fast-weak-bridge-research-v1";
export type FastWeakBridgeStateV1 = {
  caTroponin: number; blocked: number; strong: number; strongDistortion: number;
};
export type FastWeakBridgeInputV1 = {
  calciumUM: number; stretch: number; stretchRatePerSec: number;
};

function rates(input: FastWeakBridgeInputV1, p: Land2017SourceParameterSet) {
  if (p.strongBridgeDeactivationExit !== undefined) {
    throw new Error("fast-weak reduction does not support the added bridge-exit law");
  }
  const ca50 = land2017CaT50(input.stretch, p.values);
  if (![input.calciumUM, input.stretch, input.stretchRatePerSec, ca50].every(Number.isFinite)
    || input.calciumUM <= 0 || input.stretch <= 0 || ca50 <= 0) {
    throw new Error("invalid fast-weak component input");
  }
  const v = p.values, d = p.derived;
  if (![v.kTRPN, v.nTRPN, v.ku, v.nTm, v.kuw, v.kws, v.rs, v.Tref,
    d.kb, d.cw, d.cs, d.ksu, d.Aw, d.As].every(x => Number.isFinite(x) && x > 0)
    || ![d.kwu, v.gammaS, v.gammaW].every(x => Number.isFinite(x) && x >= 0)
    || !Number.isFinite(v.beta0)) throw new Error("invalid fast-weak rates");
  const weakDistortion = d.Aw * input.stretchRatePerSec / d.cw;
  const weakFraction = v.kuw / (v.kuw + d.kwu + v.kws + land2017GammaWu(weakDistortion, v));
  return { weakDistortion, weakFraction, caDrive: (input.calciumUM / ca50) ** v.nTRPN };
}

function validateState(state: FastWeakBridgeStateV1) {
  if (![state.caTroponin, state.blocked, state.strong, state.strongDistortion].every(Number.isFinite) || state.caTroponin <= 0
    || state.caTroponin > 1 || state.blocked < 0 || state.strong < 0
    || state.blocked + state.strong > 1) throw new Error("invalid fast-weak state");
}

export function equilibrateFastWeakBridgeV1(calciumUM: number, stretch: number,
  p: Land2017SourceParameterSet): FastWeakBridgeStateV1 {
  const r = rates({ calciumUM, stretch, stretchRatePerSec: 0 }, p), v = p.values;
  const caTroponin = r.caDrive / (1 + r.caDrive);
  const bOverF = p.derived.kb * land2017CaTRPNUnblockingFactor(caTroponin, v)
    * (1 - r.weakFraction) / (v.ku * caTroponin ** (v.nTm / 2));
  const sOverF = v.kws * r.weakFraction / p.derived.ksu;
  const freeAndWeak = 1 / (1 + bOverF + sOverF);
  const state = { caTroponin, blocked: bOverF * freeAndWeak,
    strong: sOverF * freeAndWeak, strongDistortion: 0 };
  validateState(state);
  return state;
}

export function liftFastWeakBridgeV1(state: FastWeakBridgeStateV1,
  input: FastWeakBridgeInputV1, p: Land2017SourceParameterSet): Float64Array {
  validateState(state);
  const r = rates(input, p);
  return Float64Array.of(state.caTroponin, state.blocked,
    r.weakFraction * (1 - state.blocked - state.strong), state.strong,
    r.weakDistortion, state.strongDistortion);
}

export function fastWeakBridgeNominalStressV1(state: FastWeakBridgeStateV1,
  input: FastWeakBridgeInputV1, p: Land2017SourceParameterSet): number {
  const s = liftFastWeakBridgeV1(state, input, p);
  return land2017LengthFactor(input.stretch, p.values) * p.values.Tref / p.values.rs
    * (s[3]! * (s[5]! + 1) + s[2]! * s[4]!);
}

export function stepFastWeakBridgeV1(previous: FastWeakBridgeStateV1,
  input: FastWeakBridgeInputV1, dtSec: number, p: Land2017SourceParameterSet): FastWeakBridgeStateV1 {
  validateState(previous);
  if (!Number.isFinite(dtSec) || dtSec <= 0) throw new Error("invalid fast-weak step");
  const r = rates(input, p), v = p.values, d = p.derived, h = dtSec;
  const caTroponin = (previous.caTroponin + h * v.kTRPN * r.caDrive)
    / (1 + h * v.kTRPN * (1 + r.caDrive));
  const strongDistortion = (previous.strongDistortion + h * d.As * input.stretchRatePerSec)
    / (1 + h * d.cs);
  const a = d.kb * land2017CaTRPNUnblockingFactor(caTroponin, v) * (1 - r.weakFraction);
  const b = v.ku * caTroponin ** (v.nTm / 2);
  const c = v.kws * r.weakFraction, decay = d.ksu + land2017GammaSu(strongDistortion, v);
  // BE for B <-> F <-> S, where F=U+W. Positive flux form avoids subtractive
  // recovery of F. The implicit Markov solve conserves B+F+S without projection.
  const freeAndWeak = ((1 - previous.blocked - previous.strong)
    + h * b * previous.blocked / (1 + h * b)
    + h * decay * previous.strong / (1 + h * decay))
    / (1 + h * a / (1 + h * b) + h * c / (1 + h * decay));
  const state = { caTroponin, strongDistortion,
    blocked: (previous.blocked + h * a * freeAndWeak) / (1 + h * b),
    strong: (previous.strong + h * c * freeAndWeak) / (1 + h * decay) };
  validateState(state);
  return state;
}
