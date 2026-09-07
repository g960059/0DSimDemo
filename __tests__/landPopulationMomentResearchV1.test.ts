import { describe, expect, it } from "vitest";
import {
  equilibratePopulationMomentV1, populationMomentNominalStressV1,
  populationMomentRhsV1, stepPopulationMomentV1, validatePopulationMomentStateV1,
  type PopulationMomentStateV1,
} from "@/engine/myocardium/experiments/LandPopulationMomentResearchV1";
import { LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as p,
  createLand2017StrongBridgeDeactivationExitV2 } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { solveLand2017BackwardEulerStep } from "@/engine/myocardium/myofilament/land2017";
import { land2017LengthFactor } from "@/engine/myocardium/myofilament/land2017/equations";

const keys = ["caTroponin", "blocked", "weak", "strong", "weakMoment", "strongMoment"] as const;

describe("research-only population-weighted bridge distortion hypothesis", () => {
  it.each([1, 1.1, 1.166, 1.23])("preserves source equilibrium at stretch %s", stretch => {
    for (const calciumUM of [.11, .3, .6, 1]) {
      const state = equilibratePopulationMomentV1(calciumUM, stretch, p);
      const input = { calciumUM, stretch, stretchRatePerSec: 0 };
      expect(Math.max(...Object.values(populationMomentRhsV1(state, input, p)).map(Math.abs))).toBeLessThan(1e-10);
      const next = stepPopulationMomentV1(state, input, .1, p);
      for (const k of keys) expect(next[k]).toBeCloseTo(state[k], 12);
    }
  });

  it("matches the full source BE isometric twitch, not just its peak", () => {
    const stretch = 1.166;
    let state = equilibratePopulationMomentV1(.164321, stretch, p);
    let land = Float64Array.of(state.caTroponin, state.blocked, state.weak, state.strong, 0, 0);
    for (let i = 0; i < 900; ++i) {
      const t = i * .002, calciumUM = .164321 + .428265 * (t / .13) * Math.exp(1 - t / .13);
      state = stepPopulationMomentV1(state, { calciumUM, stretch, stretchRatePerSec: 0 }, .002, p);
      const next = solveLand2017BackwardEulerStep(land, { freeCalciumUM: calciumUM,
        previousFiberEngineeringStrain: stretch - 1, stageFiberEngineeringStrain: stretch - 1,
        dtSec: .002, stage: { scheme: "BE", stageIndex: 0 } }, {}, p);
      expect(next.ok).toBe(true);
      land = next.nextState;
      [state.caTroponin, state.blocked, state.weak, state.strong].forEach((v, k) => expect(v).toBeCloseTo(land[k]!, 11));
      expect(populationMomentNominalStressV1(state, stretch, p)).toBeCloseTo(next.output!.sourceActiveFiberStressPa, 7);
      expect(state.weakMoment).toBe(0);
      expect(state.strongMoment).toBe(0);
    }
  });

  it("conserves nonnegative populations without projection under large alternating steps", () => {
    let state = equilibratePopulationMomentV1(.11, 1.1, p);
    for (let i = 0; i < 500; ++i) {
      const before = { ...state };
      state = stepPopulationMomentV1(state, { calciumUM: i % 2 ? 0 : 1.5,
        stretch: 1.1, stretchRatePerSec: i % 3 - 1 }, .1, p);
      expect(before).not.toBe(state);
      expect(Math.min(state.blocked, state.weak, state.strong,
        1 - state.blocked - state.weak - state.strong)).toBeGreaterThanOrEqual(0);
    }
  });

  it("cannot store distortion in an empty population or hide a nonfinite mean", () => {
    const state = { caTroponin: .1, blocked: .5, weak: 0, strong: 0, weakMoment: 0, strongMoment: 0 };
    const input = { calciumUM: .6, stretch: 1.1, stretchRatePerSec: -.2 };
    const next = stepPopulationMomentV1(state, input, .001, p);
    expect(next.weak).toBeGreaterThan(0);
    expect(next.strong).toBeGreaterThan(0);
    expect(next.weakMoment).toBeLessThan(0);
    expect(() => validatePopulationMomentStateV1({ ...state, weakMoment: 1 })).toThrow(/empty-pool/);
    expect(() => stepPopulationMomentV1({ ...state, weak: Number.MIN_VALUE, weakMoment: 1 }, input, .001, p)).toThrow(/nonfinite/);
  });

  it("carries the mean with surviving bridges when there is no incoming flux", () => {
    const noInflow = { ...p, values: { ...p.values, kuw: 0, kws: 0 } };
    let state: PopulationMomentStateV1 = { caTroponin: .1, blocked: .5,
      weak: 0, strong: .25, weakMoment: 0, strongMoment: -.2 };
    const initialForce = populationMomentNominalStressV1(state, 1.1, noInflow);
    for (let i = 0; i < 50; ++i) {
      const before = state;
      state = stepPopulationMomentV1(state, { calciumUM: 0, stretch: 1.1, stretchRatePerSec: 0 }, .002, noInflow);
      expect(state.strongMoment / state.strong).toBeCloseTo(-.8, 13);
      expect(state.strong).toBeLessThan(before.strong);
      expect(populationMomentNominalStressV1(state, 1.1, noInflow))
        .toBeCloseTo(initialForce * state.strong / .25, 8);
      expect(before).not.toBe(state);
    }
  });

  it("has consistent spring work in the frozen-population, constant-overlap limit", () => {
    const frozen = { ...p, values: { ...p.values, beta0: 0, kTRPN: 0, ku: 0,
      kuw: 0, kws: 0, gammaW: 0, gammaS: 0 }, derived: { ...p.derived, kb: 0, kwu: 0, ksu: 0 } };
    const initial: PopulationMomentStateV1 = { caTroponin: .1, blocked: .25,
      weak: .25, strong: .25, weakMoment: .01, strongMoment: -.02 };
    const energy = (s: PopulationMomentStateV1) => p.values.Tref / p.values.rs
      * (s.weakMoment ** 2 / s.weak / (2 * p.derived.Aw)
        + (s.strong + s.strongMoment) ** 2 / s.strong / (2 * p.derived.As));
    let state = initial, stretch = 1.1, workOnBridges = 0;
    for (const rate of [-.2, .4, -.1]) {
      const previousForce = populationMomentNominalStressV1(state, stretch, frozen);
      const delta = rate * .01;
      state = stepPopulationMomentV1(state, { calciumUM: .3, stretch: stretch + delta,
        stretchRatePerSec: rate }, .01, frozen);
      const nextForce = populationMomentNominalStressV1(state, stretch + delta, frozen);
      // Nominal stress is conjugate to lambda; Kirchhoff=lambda*nominal to log(lambda).
      workOnBridges += .5 * (previousForce + nextForce) * delta;
      stretch += delta;
    }
    expect(workOnBridges).toBeCloseTo(energy(state) - energy(initial), 9);
    expect(state.strong).toBe(initial.strong);
    expect(state.weak).toBe(initial.weak);
    // This limited check does not assert ATP/transition energy conservation.
  });

  it("is first-order consistent with its own ODE including mean-dependent detachment", () => {
    const initial = { ...equilibratePopulationMomentV1(.4, 1.1, p), weakMoment: -.001, strongMoment: -.005 };
    const input = { calciumUM: .45, stretch: 1.1, stretchRatePerSec: -.25 };
    const rhs = populationMomentRhsV1(initial, input, p);
    const error = [1e-5, 5e-6, 2.5e-6].map(dt => {
      const next = stepPopulationMomentV1(initial, input, dt, p);
      return Math.max(...keys.map(k => Math.abs((next[k] - initial[k]) / dt - rhs[k])));
    });
    expect(error[0]! / error[1]!).toBeGreaterThan(1.9);
    expect(error[1]! / error[2]!).toBeGreaterThan(1.9);
  });

  it("converges under refinement during shortening and subsequent hold", () => {
    const solve = (dt: number) => {
      let state = equilibratePopulationMomentV1(.6, 1.166, p);
      for (let i = 1; i <= Math.round(.15 / dt); ++i) {
        const time = i * dt, rate = time <= .05 + 1e-12 ? -.4 : 0;
        state = stepPopulationMomentV1(state, { calciumUM: time <= .05 + 1e-12 ? .6 : .164321,
          stretch: 1.166 - .4 * Math.min(time, .05), stretchRatePerSec: rate }, dt, p);
      }
      return state;
    };
    const reference = solve(.00003125);
    const errors = [.002, .001, .0005].map(dt => {
      const result = solve(dt);
      return Math.max(...keys.map(k => Math.abs(result[k] - reference[k])));
    });
    expect(errors[0]! / errors[1]!).toBeGreaterThan(1.7);
    expect(errors[1]! / errors[2]!).toBeGreaterThan(1.8);
  });

  it("does not use phi, cw/cs, clip negative force, or mutate its input", () => {
    const state = { ...equilibratePopulationMomentV1(.4, 1.1, p), strongMoment: -.7 };
    const before = { ...state };
    const input = { calciumUM: .4, stretch: 1.1, stretchRatePerSec: 0 };
    const alternative = { ...p, values: { ...p.values, phi: 123 }, derived: { ...p.derived, cw: 12345, cs: 6789 } };
    expect(stepPopulationMomentV1(state, input, .001, alternative)).toEqual(stepPopulationMomentV1(state, input, .001, p));
    expect(state).toEqual(before);
    expect(populationMomentNominalStressV1(state, 1.1, p)).toBeLessThan(0);
    expect(land2017LengthFactor(1.1, p.values)).toBeGreaterThan(0);
    expect(() => stepPopulationMomentV1(state, input, .001, { ...p,
      strongBridgeDeactivationExit: createLand2017StrongBridgeDeactivationExitV2(60, 16) })).toThrow(/does not support/);
    for (const dt of [0, -1, NaN, Infinity]) expect(() => stepPopulationMomentV1(state, input, dt, p)).toThrow(/step/);
  });

  it("makes the optional phenomenological recovery explicit and reduces to strict flux at phi=1", () => {
    const initial = { ...equilibratePopulationMomentV1(.4, 1.1, p), weakMoment: -.001, strongMoment: -.005 };
    const input = { calciumUM: .45, stretch: 1.1, stretchRatePerSec: -.25 };
    const phi1 = { ...p, values: { ...p.values, phi: 1 } };
    expect(stepPopulationMomentV1(initial, input, .001, phi1, "source-phi-turnover-closure"))
      .toEqual(stepPopulationMomentV1(initial, input, .001, phi1));
    const rhs = populationMomentRhsV1(initial, input, p, "source-phi-turnover-closure");
    const error = [1e-5, 5e-6].map(dt => {
      const next = stepPopulationMomentV1(initial, input, dt, p, "source-phi-turnover-closure");
      return Math.max(...keys.map(k => Math.abs((next[k] - initial[k]) / dt - rhs[k])));
    });
    expect(error[0]! / error[1]!).toBeGreaterThan(1.9);
    expect(() => stepPopulationMomentV1(initial, input, .001,
      { ...p, values: { ...p.values, phi: .9 } }, "source-phi-turnover-closure")).toThrow(/recovery closure/);
  });

  it("does not add recovery without incoming bridges, even with the optional phi closure", () => {
    const noInflow = { ...p, values: { ...p.values, kuw: 0, kws: 0 } };
    const initial = { caTroponin: .1, blocked: .5, weak: 0, strong: .25, weakMoment: 0, strongMoment: -.2 };
    const input = { calciumUM: 0, stretch: 1.1, stretchRatePerSec: 0 };
    expect(stepPopulationMomentV1(initial, input, .002, noInflow, "source-phi-turnover-closure"))
      .toEqual(stepPopulationMomentV1(initial, input, .002, noInflow));
    expect(populationMomentRhsV1(initial, input, noInflow, "source-phi-turnover-closure"))
      .toEqual(populationMomentRhsV1(initial, input, noInflow));
  });

  it("retains zero isometric distortion and admits an initially empty pool with the optional closure", () => {
    let state: PopulationMomentStateV1 = { caTroponin: .1, blocked: .5, weak: 0, strong: 0, weakMoment: 0, strongMoment: 0 };
    for (let i = 0; i < 500; ++i) {
      state = stepPopulationMomentV1(state, { calciumUM: i % 2 ? .1 : .6, stretch: 1.1,
        stretchRatePerSec: 0 }, .002, p, "source-phi-turnover-closure");
      expect(state.weakMoment).toBe(0);
      expect(state.strongMoment).toBe(0);
    }
    expect(() => stepPopulationMomentV1(state, { calciumUM: .6, stretch: 1.1,
      stretchRatePerSec: -.1 }, .1, { ...p, values: { ...p.values, phi: 1e308 } },
    "source-phi-turnover-closure")).toThrow(/nonfinite/);
  });
});
