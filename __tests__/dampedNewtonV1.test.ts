import { describe, expect, it } from "vitest";

import { solveDampedNewtonV1 } from "@/engine/mechanics2/solver/DampedNewtonV1";

const options = {
  unknownScales: [1, 1],
  residualScales: [1, 1],
  maxIterations: 20,
  residualTolerance: 1e-10,
  derivativeRelativeStep: 1e-6,
  lineSearchReduction: 0.5,
  minLineSearchStep: 1 / 1024,
} as const;

describe("DampedNewtonV1", () => {
  it("solves a coupled nonlinear system", () => {
    const result = solveDampedNewtonV1([1, 1], ([x, y]) => [
      x! * x! + y! - 5,
      x! + y! * y! - 3,
    ], options);
    expect(result.converged).toBe(true);
    expect(result.unknowns[0]).toBeCloseTo(2, 8);
    expect(result.unknowns[1]).toBeCloseTo(1, 8);
    expect(result.maxScaledResidual).toBeLessThanOrEqual(options.residualTolerance);
  });

  it("respects the admissible domain", () => {
    const result = solveDampedNewtonV1([1, 1], ([x, y]) => [
      x! - 0.25,
      y! - 0.5,
    ], {
      ...options,
      admissible: ([x, y]) => x! > 0 && y! > 0,
    });
    expect(result.converged).toBe(true);
    expect(result.unknowns).toEqual(expect.arrayContaining([
      expect.closeTo(0.25, 8),
      expect.closeTo(0.5, 8),
    ]));
  });

  it("reuses a Jacobian without changing the converged nonlinear root", () => {
    const residual = ([x, y]: readonly number[]) => [
      x! * x! + y! - 5,
      x! + y! * y! - 3,
    ];
    const baseline = solveDampedNewtonV1([1, 1], residual, options);
    const modified = solveDampedNewtonV1([1, 1], residual, {
      ...options,
      jacobianReuse: {
        maxAcceptedSteps: 2,
        refreshWhenResidualRatioExceeds: 0.75,
        retryWithFreshJacobianOnFailure: true,
      },
    });

    expect(modified.converged).toBe(true);
    expect(modified.unknowns[0]).toBeCloseTo(baseline.unknowns[0]!, 8);
    expect(modified.unknowns[1]).toBeCloseTo(baseline.unknowns[1]!, 8);
    expect(modified.jacobianReusedIterations).toBeGreaterThan(0);
    expect(modified.jacobianEvaluations).toBeLessThan(baseline.jacobianEvaluations);
  });
});
