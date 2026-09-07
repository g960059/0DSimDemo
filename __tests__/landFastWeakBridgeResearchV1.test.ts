import { describe, expect, it } from "vitest";
import { equilibrateFastWeakBridgeV1, liftFastWeakBridgeV1,
  stepFastWeakBridgeV1, fastWeakBridgeNominalStressV1 } from "@/engine/myocardium/experiments/LandFastWeakBridgeResearchV1";
import { LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as p,
  createLand2017StrongBridgeDeactivationExitV2 } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { writeLand2017Rhs } from "@/engine/myocardium/myofilament/land2017/equations";
import { evaluateLand2017ContinuousOutput } from "@/engine/myocardium/myofilament/land2017";

describe("independent component-only fast weak-bridge reduction", () => {
  it.each([1, 1.1, 1.2, 1.23])("preserves full-source fixed-length equilibrium at stretch %s", stretch => {
    for (const calciumUM of [.11, .3, .6, 1.0]) {
      const input = { stretch, calciumUM, stretchRatePerSec: 0 };
      const state = equilibrateFastWeakBridgeV1(calciumUM, stretch, p);
      const full = liftFastWeakBridgeV1(state, input, p);
      const fullInput = { freeCalciumUM: calciumUM, fiberEngineeringStrain: stretch - 1,
        fiberEngineeringStrainRatePerSec: 0 };
      expect(Math.max(...Array.from(writeLand2017Rhs(full, fullInput, p), Math.abs))).toBeLessThan(1e-10);
      const advanced = stepFastWeakBridgeV1(state, input, .1, p);
      for (const k of Object.keys(state) as (keyof typeof state)[]) expect(advanced[k]).toBeCloseTo(state[k], 12);
      expect(fastWeakBridgeNominalStressV1(state, input, p))
        .toBeCloseTo(evaluateLand2017ContinuousOutput(full, fullInput, p).sourceActiveFiberStressPa, 9);
    }
  });

  it("keeps populations positive under large implicit steps without mutating the accepted state", () => {
    let state = equilibrateFastWeakBridgeV1(.11, 1.1, p);
    for (let i = 0; i < 500; ++i) {
      const before = { ...state };
      const input = { calciumUM: i % 2 ? .06 : 1.5, stretch: 1.1,
        stretchRatePerSec: i % 3 - 1 };
      const next = stepFastWeakBridgeV1(state, input, .1, p);
      expect(state).toEqual(before);
      const full = liftFastWeakBridgeV1(next, input, p);
      expect(Math.min(full[1]!, full[2]!, full[3]!, 1 - full[1]! - full[2]! - full[3]!)).toBeGreaterThanOrEqual(0);
      expect(next.caTroponin).toBeGreaterThan(0);
      expect(next.caTroponin).toBeLessThanOrEqual(1);
      state = next;
    }
  });

  it("has first-order convergence to the isometric calcium-step troponin solution", () => {
    const initial = equilibrateFastWeakBridgeV1(.11, 1.1, p);
    const input = { calciumUM: .6, stretch: 1.1, stretchRatePerSec: 0 };
    const target = equilibrateFastWeakBridgeV1(.6, 1.1, p);
    const rate = p.values.kTRPN * (1 + (.6 / (.805 - .24)) ** 2), end = .02;
    const expected = target.caTroponin + (initial.caTroponin - target.caTroponin) * Math.exp(-rate * end);
    const errors = [.001, .0005, .00025].map(dt => {
      let state = initial;
      for (let i = 0; i < Math.round(end / dt); ++i) state = stepFastWeakBridgeV1(state, input, dt, p);
      return Math.abs(state.caTroponin - expected);
    });
    expect(errors[0]! / errors[1]!).toBeGreaterThan(1.8);
    expect(errors[1]! / errors[2]!).toBeGreaterThan(1.9);
  });

  it("retains shortening-induced force change instead of imposing a time curve", () => {
    const initial = equilibrateFastWeakBridgeV1(.6, 1.1, p);
    const stresses = [-.1, 0, .1].map(stretchRatePerSec => {
      const input = { calciumUM: .6, stretch: 1.1, stretchRatePerSec };
      const state = stepFastWeakBridgeV1(initial, input, .002, p);
      return fastWeakBridgeNominalStressV1(state, input, p);
    });
    expect(stresses[0]).toBeLessThan(stresses[1]!);
    expect(stresses[2]).toBeGreaterThan(stresses[1]!);
  });

  it("rejects undefined reduction extensions and invalid inputs instead of projecting them", () => {
    const state = equilibrateFastWeakBridgeV1(.11, 1.1, p);
    const input = { calciumUM: .6, stretch: 1.1, stretchRatePerSec: 0 };
    expect(() => stepFastWeakBridgeV1(state, input, .002, { ...p,
      strongBridgeDeactivationExit: createLand2017StrongBridgeDeactivationExitV2(60, 16) })).toThrow(/does not support/);
    for (const dt of [0, -1, NaN, Infinity]) expect(() => stepFastWeakBridgeV1(state, input, dt, p)).toThrow();
    expect(() => stepFastWeakBridgeV1({ ...state, strong: 1 }, input, .002, p)).toThrow(/state/);
    expect(() => stepFastWeakBridgeV1(state, { ...input, stretch: 0 }, .002, p)).toThrow(/input/);
    expect(() => stepFastWeakBridgeV1(state, input, .002, { ...p,
      values: { ...p.values, gammaW: -1 } })).toThrow(/rates/);
  });
});
