import type { Land2017RuntimeParameters } from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const ACTIVATION_HUXLEY_RESEARCH_V1 = "activation-huxley-component-research-v1" as const;

/** Research hypothesis, not Land/RDQ20, a production material, or a checkpoint.
 *
 * One phenomenological regulatory state a + two normalized Huxley moments n,z:
 *   a' = (aInf(Ca,lambda)-a)/tau
 *   n' = r0*a - R*n
 *   z' = r0*a - R*z + kappa*lambdaDot*n, R=r0+alpha*|lambdaDot|
 *   nominal active stress = Tref*h(lambda)*z.
 * tau=0 is an explicit algebraic-regulation CONTROL, not a small hidden step.
 * n is occupancy normalized by the fully activated isometric occupancy, not
 * a directly measured fraction. z is the normalized first distortion moment.
 *
 * The two moment balances follow from strain-independent f+g and linear XB
 * springs (Regazzoni et al., doi:10.1007/s10013-020-00433-z, Eq 17). Extending
 * the source by a time-dependent recruitment a is OUR reduced regulation law.
 * No equality with that paper's constant-permissivity calibration is claimed.
 * Here aInf retains Land's equilibrium force-Ca relation, including its stated
 * low-troponin cap; it does NOT retain Land's dynamical populations or kinetics.
 * a bound-positive birth rate with a spatially uniform total exit can realize
 * these moment equations. ATP energetics, strain distributions/variance and
 * detailed tropomyosin cooperativity are not resolved.
 *
 * Negative transient z is possible under imposed fast shortening and is NOT
 * clipped. It is not sufficient to establish an admissible organ material.
 */
export type ActivationHuxleyStateV1 = Readonly<{
  activation: number;
  attachedNormalized: number;
  forceMomentNormalized: number;
}>;
/** Alternative transfer-order hypothesis: lag Ca exposure BEFORE evaluating
 * the nonlinear Ca/length recruitment instead of lagging recruitment AFTER it.
 * This is a phenomenological regulatory exposure, NOT free calcium, a Ca mass
 * compartment or a literal troponin-bound concentration. Same state count and
 * equilibrium curve; it deliberately changes the dynamical length coupling.
 */
export type CalciumExposureHuxleyStateV1 = Readonly<{
  calciumExposureUM: number;
  attachedNormalized: number;
  forceMomentNormalized: number;
}>;
export type ActivationHuxleyInputV1 = Readonly<{
  calciumUM: number;
  stretch: number;
  stretchRatePerSec: number; // SLdot/SL0, not log-stretch rate
}>;
export type ActivationHuxleyParametersV1 = Readonly<{
  regulatoryTimeConstantSec: number;
  basalTurnoverPerSec: number;
  velocityDetachment: number;
  distortionCoupling: number;
  // Only these static fields are used; no Land rate is silently inherited.
  steadyForce: Pick<Land2017RuntimeParameters,
    "CaT50Ref" | "beta1" | "nTRPN" | "TRPN50" | "nTm" | "beta0" | "Tref">;
}>;

function validateParameters(p: ActivationHuxleyParametersV1) {
  if (!Object.values(p.steadyForce).every(Number.isFinite)
    || ![p.steadyForce.CaT50Ref, p.steadyForce.nTRPN, p.steadyForce.TRPN50,
      p.steadyForce.nTm, p.steadyForce.Tref, p.basalTurnoverPerSec, p.distortionCoupling]
      .every(x => Number.isFinite(x) && x > 0)
    || ![p.regulatoryTimeConstantSec, p.velocityDetachment].every(x => Number.isFinite(x) && x >= 0)
    || p.distortionCoupling <= p.velocityDetachment) {
    throw new Error("invalid activation-Huxley parameters or nonpositive maximum shortening velocity");
  }
}

export function validateActivationHuxleyStateV1(s: ActivationHuxleyStateV1) {
  if (![s.activation, s.attachedNormalized, s.forceMomentNormalized].every(Number.isFinite)
    || s.activation < 0 || s.activation > 1 || s.attachedNormalized < 0 || s.attachedNormalized > 1
    || (s.attachedNormalized === 0 && s.forceMomentNormalized !== 0)) {
    throw new Error("invalid activation-Huxley state or moment in empty population");
  }
}

export function activationHuxleySteadyActivationV1(ca: number, stretch: number,
  p: ActivationHuxleyParametersV1): number {
  validateParameters(p);
  const ca50 = p.steadyForce.CaT50Ref + p.steadyForce.beta1 * (Math.min(stretch, 1.2) - 1);
  if (!Number.isFinite(ca) || ca < 0 || !Number.isFinite(stretch) || stretch <= 0 || !Number.isFinite(ca50) || ca50 <= 0) {
    throw new Error("invalid activation-Huxley calcium or stretch");
  }
  if (ca === 0) return 0;
  const drive = (ca / ca50) ** p.steadyForce.nTRPN;
  const c = drive === Infinity ? 1 : drive / (1 + drive);
  if (c === 0) return 0;
  const halfPower = c ** (p.steadyForce.nTm / 2);
  return 1 / (1 + p.steadyForce.TRPN50 ** p.steadyForce.nTm * Math.min(1 / halfPower, 100) / halfPower);
}

export function equilibrateActivationHuxleyV1(ca: number, stretch: number,
  p: ActivationHuxleyParametersV1): ActivationHuxleyStateV1 {
  const a = activationHuxleySteadyActivationV1(ca, stretch, p);
  return { activation: a, attachedNormalized: a, forceMomentNormalized: a };
}

export function activationHuxleyNominalStressV1(s: ActivationHuxleyStateV1, stretch: number,
  p: ActivationHuxleyParametersV1): number {
  validateActivationHuxleyStateV1(s);
  activationHuxleySteadyActivationV1(0, stretch, p);
  const l = Math.min(stretch, 1.2);
  const h = Math.max(0, 1 + p.steadyForce.beta0 * (l + Math.min(l, .87) - 1.87));
  const stress = p.steadyForce.Tref * h * s.forceMomentNormalized;
  if (!Number.isFinite(stress)) throw new Error("nonfinite activation-Huxley stress");
  return stress;
}

/** Full backward Euler for these three affine equations at fixed candidate
 * Ca/stretch/velocity. Lower-triangular positive population solve; no Newton,
 * hidden subdivision, projection, or filtering. This is not an exact-in-time
 * integrator. Time-step refinement is required even though populations stay
 * bounded for arbitrarily large dt.
 */
export function stepActivationHuxleyV1(old: ActivationHuxleyStateV1,
  input: ActivationHuxleyInputV1, dt: number, p: ActivationHuxleyParametersV1): ActivationHuxleyStateV1 {
  validateActivationHuxleyStateV1(old);
  const target = activationHuxleySteadyActivationV1(input.calciumUM, input.stretch, p);
  if (!(Number.isFinite(dt) && dt > 0 && Number.isFinite(input.stretchRatePerSec))) {
    throw new Error("invalid activation-Huxley time step or velocity");
  }
  const tau = p.regulatoryTimeConstantSec;
  const activation = tau === 0 ? target : (tau * old.activation + dt * target) / (tau + dt);
  const next = { activation, ...stepMoments(old, activation, input.stretchRatePerSec, dt, p) };
  validateActivationHuxleyStateV1(next);
  return next;
}

function stepMoments(old: { attachedNormalized: number; forceMomentNormalized: number },
  activation: number, velocity: number, dt: number, p: ActivationHuxleyParametersV1) {
  const hSource = dt * p.basalTurnoverPerSec * activation;
  const denominator = 1 + dt * (p.basalTurnoverPerSec + p.velocityDetachment * Math.abs(velocity));
  const attachedNormalized = (old.attachedNormalized + hSource) / denominator;
  const forceMomentNormalized = (old.forceMomentNormalized + hSource
    + dt * p.distortionCoupling * velocity * attachedNormalized) / denominator;
  return { attachedNormalized, forceMomentNormalized };
}

export function validateCalciumExposureHuxleyStateV1(s: CalciumExposureHuxleyStateV1) {
  if (!Number.isFinite(s.calciumExposureUM) || s.calciumExposureUM < 0) throw new Error("invalid regulatory calcium exposure");
  validateActivationHuxleyStateV1({ activation: 0, attachedNormalized: s.attachedNormalized, forceMomentNormalized: s.forceMomentNormalized });
}
export function equilibrateCalciumExposureHuxleyV1(ca: number, stretch: number,
  p: ActivationHuxleyParametersV1): CalciumExposureHuxleyStateV1 {
  const s = equilibrateActivationHuxleyV1(ca, stretch, p);
  return { calciumExposureUM: ca, attachedNormalized: s.attachedNormalized, forceMomentNormalized: s.forceMomentNormalized };
}
export function calciumExposureHuxleyNominalStressV1(s: CalciumExposureHuxleyStateV1, stretch: number,
  p: ActivationHuxleyParametersV1): number {
  validateCalciumExposureHuxleyStateV1(s);
  return activationHuxleyNominalStressV1({ activation: 0, attachedNormalized: s.attachedNormalized,
    forceMomentNormalized: s.forceMomentNormalized }, stretch, p);
}
export function stepCalciumExposureHuxleyV1(old: CalciumExposureHuxleyStateV1,
  input: ActivationHuxleyInputV1, dt: number, p: ActivationHuxleyParametersV1): CalciumExposureHuxleyStateV1 {
  validateCalciumExposureHuxleyStateV1(old);
  activationHuxleySteadyActivationV1(input.calciumUM, input.stretch, p);
  if (!(Number.isFinite(dt) && dt > 0 && Number.isFinite(input.stretchRatePerSec))) throw new Error("invalid exposure-Huxley step");
  const tau = p.regulatoryTimeConstantSec;
  const calciumExposureUM = tau === 0 ? input.calciumUM : (tau * old.calciumExposureUM + dt * input.calciumUM) / (tau + dt);
  const target = activationHuxleySteadyActivationV1(calciumExposureUM, input.stretch, p);
  const next = { calciumExposureUM, ...stepMoments(old, target, input.stretchRatePerSec, dt, p) };
  validateCalciumExposureHuxleyStateV1(next);
  return next;
}

/** Constant-activation, constant-velocity steady relation, normalized by the
 * same length's isometric force. Positive input means shortening. It is NOT
 * a prediction that a finite specimen can shorten indefinitely at fixed SL.
 */
export function activationHuxleyForceVelocityRatioV1(shorteningPerSec: number,
  p: ActivationHuxleyParametersV1): number {
  validateParameters(p);
  if (!Number.isFinite(shorteningPerSec)) throw new Error("nonfinite shortening velocity");
  const r = p.basalTurnoverPerSec + p.velocityDetachment * Math.abs(shorteningPerSec);
  return p.basalTurnoverPerSec / r
    * (1 - p.distortionCoupling * shorteningPerSec / r);
}
