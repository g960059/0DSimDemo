import { describe, it, expect } from "vitest";
import { LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as p } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { equilibratePopulationMomentV1, stepPopulationMomentV1, populationMomentNominalStressV1 } from "@/engine/myocardium/experiments/LandPopulationMomentResearchV1";
import { stepPopulationMomentWithTangentV1, equilibratePopulationMomentWithTangentV1 } from "@/engine/myocardium/experiments/LandPopulationMomentTangentResearchV1";

describe("population-moment material consistent analytic tangent", () => {
  it.each(["flux-only", "source-phi-turnover-closure"] as const)("matches the actual %s one-step derivative", recovery => {
    for (const ca of [.11, .3, .6]) for (const stretch of [.87, .97, 1.1, 1.166, 1.2, 1.22])
      for (const dt of [.0005, .001, .002]) for (const velocity of [-.8, 0, .5]) {
        const previousStretch = stretch - velocity * dt;
        const previous = { ...equilibratePopulationMomentV1(ca, previousStretch, p), weakMoment: -.001, strongMoment: -.003 };
        const before = { ...previous };
        const result = stepPopulationMomentWithTangentV1(previous, ca, previousStretch, stretch, dt, p, recovery);
        const stress = (lambda: number) => populationMomentNominalStressV1(stepPopulationMomentV1(previous,
          { calciumUM: ca, stretch: lambda, stretchRatePerSec: (lambda - previousStretch) / dt }, dt, p, recovery), lambda, p);
        const eps = 1e-7, numeric = (stress(stretch + eps) - stress(stretch - eps)) / (2 * eps);
        expect(Math.abs(numeric - result.dNominalStressDStretchPa) / Math.max(1, Math.abs(numeric))).toBeLessThan(5e-5);
        expect(result.nominalStressPa).toBe(stress(stretch));
        expect(previous).toEqual(before);
      }
  });
  it("includes the full equilibrium Ca/length sensitivity in cold tangents", () => {
    for (const ca of [.11, .3, .6]) for (const stretch of [.87, .97, 1.1, 1.166, 1.2, 1.22]) {
      const value = equilibratePopulationMomentWithTangentV1(ca, stretch, p);
      const stress = (l: number) => populationMomentNominalStressV1(equilibratePopulationMomentV1(ca, l, p), l, p);
      const eps = 1e-7, numeric = (stress(stretch + eps) - stress(stretch - eps)) / (2 * eps);
      expect(Math.abs(numeric - value.dNominalStressDStretchPa) / Math.max(1, Math.abs(numeric))).toBeLessThan(1e-5);
    }
  });
  it("handles initially empty pools without epsilon distortion memories", () => {
    const state = { caTroponin: .1, blocked: .5, weak: 0, strong: 0, weakMoment: 0, strongMoment: 0 };
    const r = stepPopulationMomentWithTangentV1(state, .3, 1.1, 1.099, .002, p);
    expect(Number.isFinite(r.dNominalStressDStretchPa)).toBe(true);
    const frozen = { ...p, values: { ...p.values, kuw: 0, kws: 0 } };
    expect(stepPopulationMomentWithTangentV1(state, .3, 1.1, 1.099, .002, frozen).dNominalStressDStretchPa).toBe(0);
  });
});
