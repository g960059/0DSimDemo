import { describe, expect, it } from "vitest";
import {
  activationHuxleyForceVelocityRatioV1 as fv, activationHuxleyNominalStressV1 as stress,
  activationHuxleySteadyActivationV1 as target, equilibrateActivationHuxleyV1 as equilibrium,
  stepActivationHuxleyV1 as step, validateActivationHuxleyStateV1,
  type ActivationHuxleyParametersV1,
  equilibrateCalciumExposureHuxleyV1 as exposureEquilibrium, stepCalciumExposureHuxleyV1 as exposureStep,
  calciumExposureHuxleyNominalStressV1 as exposureStress,
} from "@/engine/myocardium/experiments/ActivationHuxleyResearchV1";
import { equilibratePopulationMomentV1, populationMomentNominalStressV1 } from "@/engine/myocardium/experiments/LandPopulationMomentResearchV1";
import { LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as land } from "@/engine/myocardium/myofilament/land2017/parameterSets";

const { CaT50Ref, beta1, nTRPN, TRPN50, nTm, beta0, Tref } = land.values;
const p: ActivationHuxleyParametersV1 = { regulatoryTimeConstantSec: .03, basalTurnoverPerSec: 134.31,
  velocityDetachment: 25.184, distortionCoupling: 32.653 / .778,
  steadyForce: { CaT50Ref, beta1, nTRPN, TRPN50, nTm, beta0, Tref } };
describe("three-state activation-Huxley research hypothesis", () => {
  it.each([.8, 1, 1.1, 1.166, 1.23])("retains the independent Land equilibrium stress at stretch %s", stretch => {
    for (const ca of [.01, .11, .3, .6, 2, 100]) {
      const s = equilibrium(ca, stretch, p);
      expect(stress(s, stretch, p)).toBeCloseTo(populationMomentNominalStressV1(
        equilibratePopulationMomentV1(ca, stretch, land), stretch, land), 8);
      const next = step(s, { calciumUM: ca, stretch, stretchRatePerSec: 0 }, .2, p);
      Object.keys(s).forEach(k => expect(next[k as keyof typeof s]).toBeCloseTo(s[k as keyof typeof s], 14));
    }
  });
  it("has a finite zero-Ca equilibrium without an epsilon calcium floor", () => {
    expect(equilibrium(0, 1.166, p)).toEqual({ activation: 0, attachedNormalized: 0, forceMomentNormalized: 0 });
    expect(target(Number.MAX_VALUE, 1.1, p)).toBeGreaterThan(.9);
  });
  it("preserves bounded populations with large steps and never mutates its input", () => {
    let s = equilibrium(.1, 1.1, p);
    for (let i = 0; i < 200; i++) {
      const copy = { ...s }, before = s;
      s = step(s, { calciumUM: i % 2 ? 0 : 10, stretch: 1.1, stretchRatePerSec: i % 3 - 1 }, .5, p);
      expect(before).toEqual(copy);
      expect(s.activation).toBeGreaterThanOrEqual(0);
      expect(s.activation).toBeLessThanOrEqual(1);
      expect(s.attachedNormalized).toBeGreaterThanOrEqual(0);
      expect(s.attachedNormalized).toBeLessThanOrEqual(1);
    }
  });
  it("solves its own three BE residuals, including transport sign", () => {
    const old = { activation: .4, attachedNormalized: .3, forceMomentNormalized: .2 };
    const input = { calciumUM: .3, stretch: 1.1, stretchRatePerSec: -.7 }, h = .002;
    const n = step(old, input, h, p), r = p.basalTurnoverPerSec + p.velocityDetachment * .7;
    const residual = [n.activation - old.activation - h * (target(.3, 1.1, p) - n.activation) / p.regulatoryTimeConstantSec,
      n.attachedNormalized - old.attachedNormalized - h * (p.basalTurnoverPerSec * n.activation - r * n.attachedNormalized),
      n.forceMomentNormalized - old.forceMomentNormalized - h * (p.basalTurnoverPerSec * n.activation
        - r * n.forceMomentNormalized + p.distortionCoupling * input.stretchRatePerSec * n.attachedNormalized)];
    expect(Math.max(...residual.map(Math.abs))).toBeLessThan(2e-16);
  });
  it("reproduces the analytic force-velocity curve and its finite zero", () => {
    const instantaneous = { ...p, regulatoryTimeConstantSec: 0 };
    for (const v of [-.5, 0, .2, 1, 2, 4]) {
      let s = equilibrium(.6, 1.1, instantaneous);
      for (let i = 0; i < 1000; i++) s = step(s, { calciumUM: .6, stretch: 1.1, stretchRatePerSec: -v }, .002, instantaneous);
      expect(s.forceMomentNormalized / target(.6, 1.1, p)).toBeCloseTo(fv(v, p), 12);
    }
    const vmax = p.basalTurnoverPerSec / (p.distortionCoupling - p.velocityDetachment);
    expect(fv(vmax, p)).toBeCloseTo(0, 14);
    expect(fv(vmax + 1, p)).toBeLessThan(0); // no force clipping
    const epsilon = 1e-6, v0 = p.basalTurnoverPerSec / (p.distortionCoupling + p.velocityDetachment);
    expect((fv(epsilon, p) - 1) / epsilon).toBeCloseTo(-1 / v0, 6);
  });
  it("has no independent distortion recovery when recruitment stops at fixed length", () => {
    let s = { activation: 0, attachedNormalized: .4, forceMomentNormalized: .15 };
    for (let i = 0; i < 50; i++) {
      const before = s;
      s = step(s, { calciumUM: 0, stretch: 1.1, stretchRatePerSec: 0 }, .002, p);
      expect(s.forceMomentNormalized / s.attachedNormalized).toBeCloseTo(.15 / .4, 13);
      expect(s.forceMomentNormalized).toBeLessThan(before.forceMomentNormalized);
    }
  });
  it("converges at first order to the independent continuous zero-Ca solution", () => {
    const t = .1, a0 = .8, n0 = .6, r = p.basalTurnoverPerSec, k = 1 / p.regulatoryTimeConstantSec;
    const exact = n0 * Math.exp(-r * t) + r * a0 * (Math.exp(-k * t) - Math.exp(-r * t)) / (r - k);
    const errors = [.002, .001, .0005].map(h => {
      let s = { activation: a0, attachedNormalized: n0, forceMomentNormalized: n0 };
      for (let i = 0; i < Math.round(t / h); i++) s = step(s, { calciumUM: 0, stretch: 1.1, stretchRatePerSec: 0 }, h, p);
      return Math.abs(s.forceMomentNormalized - exact);
    });
    expect(errors[0]! / errors[1]!).toBeGreaterThan(1.9);
    expect(errors[1]! / errors[2]!).toBeGreaterThan(1.9);
  });
  it("rejects invalid states, nonpositive Ca50 and degenerate maximum velocity", () => {
    expect(() => validateActivationHuxleyStateV1({ activation: .5, attachedNormalized: 0, forceMomentNormalized: .1 })).toThrow(/empty/);
    expect(() => target(.1, 1, { ...p, regulatoryTimeConstantSec: -1 })).toThrow();
    expect(() => target(.1, 1.2, { ...p, steadyForce: { ...p.steadyForce, beta1: -10 } })).toThrow();
    expect(() => target(.1, 1, { ...p, distortionCoupling: p.velocityDetachment })).toThrow();
    expect(() => step(equilibrium(.1, 1, p), { calciumUM: .1, stretch: 1, stretchRatePerSec: Infinity }, .002, p)).toThrow();
  });
  it("the exposure-order alternative has the same equilibrium, including high Ca", () => {
    for (const ca of [0, .1, .6, 2]) for (const stretch of [1, 1.1, 1.166]) {
      const s = exposureEquilibrium(ca, stretch, p);
      expect(exposureStress(s, stretch, p)).toBe(stress(equilibrium(ca, stretch, p), stretch, p));
      const n = exposureStep(s, { calciumUM: ca, stretch, stretchRatePerSec: 0 }, .1, p);
      expect(n.calciumExposureUM).toBeCloseTo(ca, 14);
      expect(n.forceMomentNormalized).toBeCloseTo(s.forceMomentNormalized, 14);
    }
  });
  it("the exposure step preserves positivity and solves its own BE equation without mutating history", () => {
    const old = exposureEquilibrium(.6, 1.166, p), copy = { ...old }, dt = .002;
    const n = exposureStep(old, { calciumUM: .1, stretch: 1.1, stretchRatePerSec: -.4 }, dt, p);
    expect(old).toEqual(copy);
    expect(n.calciumExposureUM - old.calciumExposureUM - dt * (.1 - n.calciumExposureUM) / p.regulatoryTimeConstantSec).toBeCloseTo(0, 15);
    expect(n.calciumExposureUM).toBeGreaterThan(.1);
    expect(n.calciumExposureUM).toBeLessThan(.6);
    expect(() => exposureStep({ ...old, calciumExposureUM: -1 }, { calciumUM: .1, stretch: 1, stretchRatePerSec: 0 }, dt, p)).toThrow();
  });
  it("both regulation orders coincide in the declared algebraic limit, but not for nonzero memory", () => {
    const q = { ...p, regulatoryTimeConstantSec: 0 };
    let a = equilibrium(.1, 1.1, q), c = exposureEquilibrium(.1, 1.1, q);
    for (let i = 0; i < 100; i++) {
      const input = { calciumUM: .1 + .5 * Math.sin(i / 100 * Math.PI), stretch: 1.1 - i / 1000, stretchRatePerSec: -.5 };
      a = step(a, input, .002, q); c = exposureStep(c, input, .002, q);
      expect(c.forceMomentNormalized).toBe(a.forceMomentNormalized);
      expect(c.attachedNormalized).toBe(a.attachedNormalized);
    }
    const input = { calciumUM: .6, stretch: 1, stretchRatePerSec: -1 };
    const a1 = step(equilibrium(.6, 1.166, p), input, .002, p);
    const c1 = exposureStep(exposureEquilibrium(.6, 1.166, p), input, .002, p);
    expect(c1.forceMomentNormalized).toBeLessThan(a1.forceMomentNormalized);
  });
});
