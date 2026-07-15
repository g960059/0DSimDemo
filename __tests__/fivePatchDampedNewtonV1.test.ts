import { describe, expect, it } from "vitest";

import {
  solveFivePatchDampedNewtonV1,
} from "@/engine/mechanics2/solver/FivePatchDampedNewtonV1";

const options = {
  unknownScales: [1, 1],
  residualScales: [1, 1],
  maxIterations: 20,
  residualTolerance: 1e-10,
  derivativeRelativeStep: 1e-6,
  lineSearchReduction: 0.5,
  minLineSearchStep: 1 / 1024,
} as const;

const residual = ([x, y]: readonly number[]) => [
  x! * x! + y! - 5,
  x! + y! * y! - 3,
];

describe("FivePatchDampedNewtonV1", () => {
  it("uses exact selected Jacobian columns without changing the root", () => {
    const finiteDifference = solveFivePatchDampedNewtonV1(
      [1, 1],
      residual,
      options,
    );
    const analytic = solveFivePatchDampedNewtonV1([1, 1], residual, {
      ...options,
      analyticJacobianColumn: ([x, y], column) => column === 0
        ? [2 * x!, 1]
        : column === 1
          ? [1, 2 * y!]
          : null,
    });

    expect(analytic.converged).toBe(true);
    expect(analytic.unknowns[0]).toBeCloseTo(finiteDifference.unknowns[0]!, 8);
    expect(analytic.unknowns[1]).toBeCloseTo(finiteDifference.unknowns[1]!, 8);
    expect(analytic.residualEvaluations).toBeLessThan(
      finiteDifference.residualEvaluations,
    );
  });

  it("mixes an analytic column with FD fallback under nonunit residual scales", () => {
    const scaledOptions = {
      ...options,
      residualScales: [7, 0.2] as const,
    };
    const finiteDifference = solveFivePatchDampedNewtonV1(
      [1, 1],
      residual,
      scaledOptions,
    );
    const mixed = solveFivePatchDampedNewtonV1([1, 1], residual, {
      ...scaledOptions,
      analyticJacobianColumn: ([x], column) =>
        column === 0 ? [2 * x!, 1] : null,
    });

    expect(finiteDifference.converged).toBe(true);
    expect(mixed.converged).toBe(true);
    expect(mixed.unknowns[0]).toBeCloseTo(finiteDifference.unknowns[0]!, 8);
    expect(mixed.unknowns[1]).toBeCloseTo(finiteDifference.unknowns[1]!, 8);
    expect(mixed.residualEvaluations).toBeLessThan(
      finiteDifference.residualEvaluations,
    );
  });
});
