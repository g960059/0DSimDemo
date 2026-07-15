import { describe, expect, it } from "vitest";
import {
  solveScaledDampedNewtonV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  computeStrictAffineFractionToBoundaryV1,
  normalizeStrictAffineConstraintsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/strictAffineDomainV1";
import {
  evaluateScaledFivePointAlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import {
  assertInsidePhaseB1LandSimplexNewtonDomainV1,
  buildPhaseB1LandSimplexNewtonDomainV1,
  minimumPhaseB1LandSimplexMarginV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/landSimplexNewtonDomainV1";
import {
  buildPhaseB1NewtonUnknownLabelsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";

describe("four-chamber Phase B1 Land simplex Newton domain", () => {
  it.each(["on", "off"] as const)(
    "binds all five Land simplexes to the %s Newton topology",
    (mode) => {
      const domain = buildPhaseB1LandSimplexNewtonDomainV1(mode);
      expect(domain.unknownCount).toBe(mode === "on" ? 51 : 46);
      expect(domain.strictLowerBounds.filter((bound) => bound === 0))
        .toHaveLength(20);
      expect(domain.strictAffineConstraints).toHaveLength(10);
      expect(domain.strictAffineConstraints.map(({ constraintId }) => constraintId))
        .toEqual([
          "LA.one-minus-CaTRPN-positive",
          "LA.unbound-population-U-positive",
          "RA.one-minus-CaTRPN-positive",
          "RA.unbound-population-U-positive",
          "LVFW.one-minus-CaTRPN-positive",
          "LVFW.unbound-population-U-positive",
          "SEP.one-minus-CaTRPN-positive",
          "SEP.unbound-population-U-positive",
          "RVFW.one-minus-CaTRPN-positive",
          "RVFW.unbound-population-U-positive",
        ]);
      const interior = interiorUnknowns(mode);
      expect(minimumPhaseB1LandSimplexMarginV1(interior, domain))
        .toBeCloseTo(0.1, 15);
      expect(() => assertInsidePhaseB1LandSimplexNewtonDomainV1(
        interior,
        domain,
      )).not.toThrow();

      const outside = [...interior];
      const labels = buildPhaseB1NewtonUnknownLabelsV1(mode);
      outside[labels.indexOf("tissue.LA.patch-0.land.B")] = 0.6;
      outside[labels.indexOf("tissue.LA.patch-0.land.W")] = 0.3;
      outside[labels.indexOf("tissue.LA.patch-0.land.S")] = 0.2;
      expect(() => assertInsidePhaseB1LandSimplexNewtonDomainV1(
        outside,
        domain,
      )).toThrow(/strictly inside its simplex/);
    },
  );

  it("computes a scale-safe affine fraction to the U boundary", () => {
    const constraints = normalizeStrictAffineConstraintsV1([{
      constraintId: "U-positive",
      coefficients: [-1, -1, -1],
      lowerBound: -1,
    }], 3);
    const result = computeStrictAffineFractionToBoundaryV1(
      [0.2, 0.2, 0.2],
      [1, 1, 1],
      constraints,
      0.9,
    );
    expect(result.admissible).toBe(true);
    if (!result.admissible) return;
    expect(result.maximumStepLength).toBeCloseTo(0.12, 15);
    expect(result.limitingConstraintId).toBe("U-positive");
    const trial = [0.2, 0.2, 0.2].map(
      (value, index) => value + result.maximumStepLength * [1, 1, 1][index],
    );
    expect(1 - trial.reduce((sum, value) => sum + value, 0))
      .toBeCloseTo((1 - 0.9) * 0.4, 15);
  });

  it("does not reject a safe unit step when the remote boundary quotient overflows", () => {
    const constraints = normalizeStrictAffineConstraintsV1([{
      constraintId: "remote-lower-bound",
      coefficients: [1],
      lowerBound: 0,
    }], 1);
    const result = computeStrictAffineFractionToBoundaryV1(
      [Number.MAX_VALUE],
      [-1e-300],
      constraints,
      0.995,
    );
    expect(result).toEqual({
      admissible: true,
      maximumStepLength: 1,
      limitingConstraintIndex: null,
      limitingConstraintId: null,
    });
  });

  it("rejects non-exact affine constraint records and invalid safety factors", () => {
    expect(() => normalizeStrictAffineConstraintsV1([{
      constraintId: "x-positive",
      coefficients: [1],
      lowerBound: 0,
      undeclared: true,
    } as never], 1)).toThrow(/must contain exactly/);
    const constraints = normalizeStrictAffineConstraintsV1([{
      constraintId: "x-positive",
      coefficients: [1],
      lowerBound: 0,
    }], 1);
    expect(() => computeStrictAffineFractionToBoundaryV1(
      [1],
      [-1],
      constraints,
      1,
    )).toThrow(/strictly between zero and one/);
  });

  it("keeps nonlinear Newton iterates strictly inside a coupled simplex", () => {
    const constraints = normalizeStrictAffineConstraintsV1([{
      constraintId: "U-positive",
      coefficients: [-1, -1, -1],
      lowerBound: -1,
    }], 3);
    const evaluated: number[][] = [];
    const target = [0.3, 0.3, 0.3];
    const result = solveScaledDampedNewtonV1({
      initialUnknowns: [0.02, 0.02, 0.02],
      unknownScales: [1, 1, 1],
      residualScales: [1, 1, 1],
      strictLowerBounds: [0, 0, 0],
      strictAffineConstraints: constraints,
      options: {
        maxIterations: 30,
        residualInfinityTolerance: 1e-11,
        updateInfinityTolerance: 1e-11,
      },
      evaluate: (unknowns) => {
        evaluated.push([...unknowns]);
        return {
          status: "ok" as const,
          residual: unknowns.map((value, index) =>
            value * value - target[index] * target[index]),
          jacobianRowMajor: [
            2 * unknowns[0], 0, 0,
            0, 2 * unknowns[1], 0,
            0, 0, 2 * unknowns[2],
          ],
        };
      },
    });
    expect(result.converged).toBe(true);
    expect(result.unknowns).toEqual(expect.arrayContaining([
      expect.closeTo(0.3, 10),
      expect.closeTo(0.3, 10),
      expect.closeTo(0.3, 10),
    ]));
    expect(evaluated.every((values) =>
      values.every((value) => value > 0)
      && values.reduce((sum, value) => sum + value, 0) < 1)).toBe(true);
    expect(result.diagnostics.history.some((iteration) =>
      iteration.fractionToBoundaryLimitingAffineConstraintId === "U-positive"))
      .toBe(true);
  });

  it("uses a backward five-point column near an affine upper boundary", () => {
    const constraints = normalizeStrictAffineConstraintsV1([{
      constraintId: "one-minus-x-positive",
      coefficients: [-1],
      lowerBound: -1,
    }], 1);
    const x = 0.9999;
    const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
      ([value]) => [value * value],
      [x],
      {
        unknownScales: [1],
        residualScales: [1],
        lowerBounds: [0],
        strictAffineConstraints: constraints,
        scaledStep: 1e-3,
      },
    );
    expect(jacobian.stencilByColumn).toEqual(["backward-five-point"]);
    expect(jacobian.rawJacobian[0][0]).toBeCloseTo(2 * x, 10);
  });

  it("halves the five-point step until a centered affine-domain stencil fits", () => {
    const constraints = normalizeStrictAffineConstraintsV1([{
      constraintId: "one-minus-x-positive",
      coefficients: [-1],
      lowerBound: -1,
    }], 1);
    const x = 0.5;
    const polynomial = (value: number) => value ** 4
      + 2 * value ** 3
      - 7 * value;
    const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
      ([value]) => [polynomial(value)],
      [x],
      {
        unknownScales: [1],
        residualScales: [1],
        lowerBounds: [0],
        strictAffineConstraints: constraints,
        scaledStep: 0.3,
      },
    );
    expect(jacobian.stencilByColumn).toEqual(["centered-five-point"]);
    expect(jacobian.scaledStepByColumn[0]).toBeCloseTo(0.15, 15);
    expect(jacobian.rawJacobian[0][0]).toBeCloseTo(-5, 12);
  });

  it("rejects an undeclared SLS topology instead of aliasing it to off", () => {
    expect(() => buildPhaseB1LandSimplexNewtonDomainV1("invalid" as never))
      .toThrow(/must be on or off/);
  });
});

function interiorUnknowns(mode: "on" | "off"): number[] {
  return buildPhaseB1NewtonUnknownLabelsV1(mode).map((label) => {
    if (label.startsWith("circulation.volume.")) return 1e-4;
    if (label.startsWith("circulation.flow.")) return 0;
    if (label.endsWith(".land.CaTRPN")) return 0.5;
    if (/\.land\.(B|W|S)$/.test(label)) return 0.1;
    if (/\.land\.(xiW|xiS)$/.test(label)) return 0;
    if (label.endsWith(".sls.alphaV")) return 0;
    if (label === "algebraic.triseg.V_m_S") return 0;
    if (label === "algebraic.triseg.y_m") return 0.03;
    throw new Error(`unhandled test label ${label}`);
  });
}
