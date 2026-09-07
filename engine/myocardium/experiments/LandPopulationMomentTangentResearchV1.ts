import { land2017CaT50, land2017CaTRPNUnblockingFactor,
  land2017CaTRPNUnblockingFactorDerivative, land2017GammaSu, land2017GammaWu,
  land2017LengthFactor } from "@/engine/myocardium/myofilament/land2017/equations";
import type { Land2017SourceParameterSet } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { equilibratePopulationMomentV1, populationMomentNominalStressV1, stepPopulationMomentV1,
  type PopulationMomentStateV1, type PopulationMomentRecoveryV1 } from "./LandPopulationMomentResearchV1";

/** Derivative of the implemented one-step map, not a continuum elastic modulus.
 * Calcium and accepted history are held fixed; lambdaDot=(lambda-lambdaOld)/dt.
 * Detachment is frozen at the accepted mean in the implemented first-order law.
 * Length/Ca50 cap kinks use the centered Clarke selection. Troponin unblocking
 * retains the source's capped-side derivative at its own saturation boundary.
 */
export function stepPopulationMomentWithTangentV1(previous: PopulationMomentStateV1,
  calciumUM: number, previousStretch: number, stretch: number, dt: number,
  p: Land2017SourceParameterSet, recovery: PopulationMomentRecoveryV1 = "source-phi-turnover-closure") {
  if (!Number.isFinite(previousStretch) || previousStretch <= 0) throw new Error("invalid accepted material stretch");
  const rate = (stretch - previousStretch) / dt;
  const state = stepPopulationMomentV1(previous, { calciumUM, stretch, stretchRatePerSec: rate }, dt, p, recovery);
  const v = p.values, d = p.derived, h = dt, c = state.caTroponin;
  const ca50 = land2017CaT50(stretch, v), drive = (calciumUM / ca50) ** v.nTRPN;
  const slope50 = v.beta1 * belowCapDerivative(stretch, 1.2);
  const driveSlope = -v.nTRPN * drive * slope50 / ca50;
  const cDen = 1 + h * v.kTRPN * (1 + drive);
  const dc = h * v.kTRPN * (1 + h * v.kTRPN - previous.caTroponin) / cDen ** 2 * driveSlope;
  const a = d.kb * land2017CaTRPNUnblockingFactor(c, v), b = v.ku * c ** (v.nTm / 2);
  const da = d.kb * land2017CaTRPNUnblockingFactorDerivative(c, v) * dc;
  const dbRate = v.ku * (v.nTm / 2) * c ** (v.nTm / 2 - 1) * dc;
  const l = d.kwu + land2017GammaWu(previous.weak === 0 ? 0 : previous.weakMoment / previous.weak, v);
  const q = d.ksu + land2017GammaSu(previous.strong === 0 ? 0 : previous.strongMoment / previous.strong, v);
  const db = 1 + h * b, dw = 1 + h * (l + v.kws), ds = 1 + h * q;
  const numeratorU = (1 - previous.blocked - previous.weak - previous.strong)
    + h * b * previous.blocked / db
    + h * (l + h * q * v.kws / ds) * previous.weak / dw + h * q * previous.strong / ds;
  const denominatorU = 1 + h * a / db + h * v.kuw * (1 + h * v.kws / ds) / dw;
  const u = numeratorU / denominatorU;
  const dNumeratorU = h * previous.blocked * dbRate / db ** 2;
  const dDenominatorU = h * da / db - h * h * a * dbRate / db ** 2;
  const du = (dNumeratorU - u * dDenominatorU) / denominatorU;
  const dWeak = h * v.kuw * du / dw, dStrong = h * v.kws * dWeak / ds;
  const extra = recovery === "flux-only" ? 0 : v.phi - 1;
  const momentSlope = (oldM: number, n: number, dn: number, incoming: number,
    dIncoming: number, outgoingDen: number, strainAmplification: number) => {
    if (n === 0) {
      if (oldM !== 0 || dn !== 0 || incoming !== 0 || dIncoming !== 0) throw new Error("undefined empty-pool material tangent");
      return 0;
    }
    const den = outgoingDen + h * extra * incoming / n;
    const dDen = h * extra * (dIncoming / n - incoming * dn / n ** 2);
    const num = oldM + h * strainAmplification * n * rate;
    const dNum = strainAmplification * (h * dn * rate + n);
    return (dNum - num / den * dDen) / den;
  };
  const dMw = momentSlope(previous.weakMoment, state.weak, dWeak, v.kuw * u,
    v.kuw * du, dw, d.Aw);
  const dMs = momentSlope(previous.strongMoment, state.strong, dStrong, v.kws * state.weak,
    v.kws * dWeak, ds, d.As);
  const length = land2017LengthFactor(stretch, v), lengthSlope = lengthFactorSlope(stretch, p);
  const amplitude = state.strong + state.weakMoment + state.strongMoment;
  const nominalStressPa = populationMomentNominalStressV1(state, stretch, p);
  const dNominalStressDStretchPa = v.Tref / v.rs
    * (lengthSlope * amplitude + length * (dStrong + dMw + dMs));
  if (!Number.isFinite(dNominalStressDStretchPa)) throw new Error("nonfinite population-moment tangent");
  return { state, nominalStressPa, dNominalStressDStretchPa };
}

/** Exact fixed-input equilibrium slope: cold initializes at equilibrium, rather
 * than taking a huge artificial time step. This includes population/Ca length
 * sensitivity; using only the partial spring slope would corrupt the cold solve.
 */
export function equilibratePopulationMomentWithTangentV1(calciumUM: number, stretch: number,
  p: Land2017SourceParameterSet) {
  const state = equilibratePopulationMomentV1(calciumUM, stretch, p), v = p.values, d = p.derived;
  const ca50 = land2017CaT50(stretch, v), drive = (calciumUM / ca50) ** v.nTRPN;
  const dc = -v.nTRPN * drive * v.beta1 * belowCapDerivative(stretch, 1.2) / ca50 / (1 + drive) ** 2;
  const c = state.caTroponin, a = d.kb * land2017CaTRPNUnblockingFactor(c, v), b = v.ku * c ** (v.nTm / 2);
  const da = d.kb * land2017CaTRPNUnblockingFactorDerivative(c, v) * dc;
  const db = v.ku * (v.nTm / 2) * c ** (v.nTm / 2 - 1) * dc;
  const wOverU = v.kuw / (d.kwu + v.kws), sOverU = v.kws * wOverU / d.ksu;
  const u = 1 / (1 + a / b + wOverU + sOverU);
  const ds = -sOverU * u ** 2 * (da / b - a * db / b ** 2);
  return { state, nominalStressPa: populationMomentNominalStressV1(state, stretch, p),
    dNominalStressDStretchPa: v.Tref / v.rs * (lengthFactorSlope(stretch, p) * state.strong
      + land2017LengthFactor(stretch, v) * ds) };
}

function belowCapDerivative(value: number, cap: number): number {
  return value < cap ? 1 : value > cap ? 0 : .5;
}
function lengthFactorSlope(stretch: number, p: Land2017SourceParameterSet): number {
  const capped = Math.min(stretch, 1.2);
  const unclipped = 1 + p.values.beta0 * (capped + Math.min(capped, .87) - 1.87);
  return (unclipped > 0 ? 1 : unclipped < 0 ? 0 : .5) * p.values.beta0
    * belowCapDerivative(stretch, 1.2) * (1 + belowCapDerivative(capped, .87));
}
