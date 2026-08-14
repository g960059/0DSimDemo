import { describe, expect, it } from "vitest";

import {
  COUPLED_HEMODYNAMICS_LAYOUT_V1,
  coupledHemodynamicsUnknownIndexV1,
} from "@/engine/vnext/coupled/CoupledHemodynamicsLayoutV1";
import {
  bindFlatCoupledNewtonWorkspaceV1,
  createFlatCoupledNewtonWorkspaceV1,
  solveFlatCoupledSystemV1,
  type FlatCoupledNewtonOptionsV1,
  type FlatCoupledSystemV1,
} from "@/engine/vnext/coupled/FlatCoupledNewtonV1";
import {
  createFlatCoupledDoglegWorkspaceV1,
  solveFlatCoupledSystemWithDoglegV1,
  type FlatCoupledDoglegOptionsV1,
} from "@/engine/vnext/coupled/FlatCoupledDoglegV1";
import {
  createFlatDenseLuWorkspaceV1,
  factorFlatDenseMatrixV1,
  solveFactoredFlatDenseSystemV1,
} from "@/engine/vnext/coupled/FlatDenseLuV1";
import {
  bindMainWireFiveWallCoupledNewtonSolveLayoutV1,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";

const DIMENSION = 32;

describe("coupled hemodynamics solver V1 infrastructure", () => {
  it("freezes a 14 + 16 + 2 layout without renumbering the condensed prefix", () => {
    expect(COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks).toEqual({
      nonCoronary: { start: 0, length: 14, endExclusive: 14 },
      coronary: { start: 14, length: 16, endExclusive: 30 },
      triSeg: { start: 30, length: 2, endExclusive: 32 },
    });
    expect(COUPLED_HEMODYNAMICS_LAYOUT_V1.phase2aCondensedUnknownCount)
      .toBe(30);
    expect(COUPLED_HEMODYNAMICS_LAYOUT_V1.totalUnknownCount).toBe(32);
    expect(COUPLED_HEMODYNAMICS_LAYOUT_V1.dependentBloodVolumeUnknown)
      .toBe("noncoronary.volume.SV");
    expect(COUPLED_HEMODYNAMICS_LAYOUT_V1
      .dependentBloodVolumeStoredInUnknownVector).toBe(false);
    expect(coupledHemodynamicsUnknownIndexV1("coronary.volume.LAD.Art"))
      .toBe(14);
    expect(coupledHemodynamicsUnknownIndexV1(
      "TriSeg.septalMidwallCapVolume",
    )).toBe(30);
  });

  it("admits only the exact compiler-projected Main Wire solve layout", () => {
    expect(bindMainWireFiveWallCoupledNewtonSolveLayoutV1({
      dimension: 30,
      ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks,
    })).toEqual({
      dimension: 30,
      ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks,
    });
    expect(() => bindMainWireFiveWallCoupledNewtonSolveLayoutV1({
      dimension: 30,
      nonCoronary: COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.coronary,
      coronary: COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.nonCoronary,
      triSeg: COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.triSeg,
    })).toThrow(/block layout drifted/);
  });

  it("solves a deterministic 32-row system without mutating its matrix", () => {
    const matrix = diagonallyDominantMatrix(DIMENSION);
    const originalMatrix = matrix.slice();
    const expected = Float64Array.from(
      { length: DIMENSION },
      (_, index) => 0.25 + index * 0.03125,
    );
    const rightHandSide = multiplyMatrixVector(matrix, expected);
    const solution = new Float64Array(DIMENSION);
    const workspace = createFlatDenseLuWorkspaceV1(DIMENSION);

    expect(factorFlatDenseMatrixV1(matrix, workspace)).toBe(true);
    solveFactoredFlatDenseSystemV1(workspace, rightHandSide, solution);

    expect(Array.from(matrix)).toEqual(Array.from(originalMatrix));
    for (let index = 0; index < DIMENSION; index += 1) {
      expect(solution[index]).toBeCloseTo(expected[index]!, 12);
    }
  });

  it("converges a cross-block nonlinear 32-row system", () => {
    const root = Float64Array.from(
      { length: DIMENSION },
      (_, index) => 0.75 + index * 0.01,
    );
    const system = manufacturedCoupledSystem(root);
    const initial = Float64Array.from(root, (value, index) =>
      value + (index % 2 === 0 ? 0.18 : -0.14));
    const initialBeforeSolve = initial.slice();
    const result = solveFlatCoupledSystemV1(
      system,
      initial,
      defaultOptions(DIMENSION),
      createFlatCoupledNewtonWorkspaceV1(DIMENSION),
    );

    expect(result.status).toBe("converged");
    if (result.status !== "converged") {
      throw new Error(result.message);
    }
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.iterations).toBeLessThanOrEqual(8);
    expect(result.residualInfinityNorm).toBeLessThan(1e-11);
    expect(Array.from(initial)).toEqual(Array.from(initialBeforeSolve));
    for (let index = 0; index < DIMENSION; index += 1) {
      expect(result.solution[index]).toBeCloseTo(root[index]!, 9);
    }
  });

  it("solves directly through one compiler-style contiguous workspace", () => {
    const dimension = 2;
    const f64Count = 2 * dimension * dimension + 7 * dimension;
    const storage = new Float64Array(f64Count);
    let offset = 0;
    const vector = () => {
      const view = storage.subarray(offset, offset + dimension);
      offset += dimension;
      return view;
    };
    const matrix = () => {
      const view = storage.subarray(
        offset,
        offset + dimension * dimension,
      );
      offset += dimension * dimension;
      return view;
    };
    const current = vector();
    const residual = vector();
    const jacobian = matrix();
    const factors = matrix();
    const rightHandSide = vector();
    const transformedRightHandSide = vector();
    const update = vector();
    const trial = vector();
    const trialResidual = vector();
    expect(offset).toBe(f64Count);
    const workspace = bindFlatCoupledNewtonWorkspaceV1({
      dimension,
      current,
      residual,
      jacobian,
      factors,
      rightHandSide,
      transformedRightHandSide,
      update,
      trial,
      trialResidual,
      pivots: new Int32Array(dimension),
    });
    const root = new Float64Array([1.25, 0.75]);
    const result = solveFlatCoupledSystemV1(
      manufacturedCoupledSystem(root),
      new Float64Array([1.1, 0.9]),
      defaultOptions(dimension),
      workspace,
    );

    expect(result.status).toBe("converged");
    if (result.status !== "converged") throw new Error(result.message);
    expect(result.solution[0]).toBeCloseTo(root[0]!, 10);
    expect(result.solution[1]).toBeCloseTo(root[1]!, 10);
    expect(workspace.current.buffer).toBe(storage.buffer);
    expect(workspace.jacobian.buffer).toBe(storage.buffer);
    expect(workspace.linear.factors.buffer).toBe(storage.buffer);
    expect(workspace.jacobian.some((value) => value !== 0)).toBe(true);
    expect(workspace.linear.factors.some((value) => value !== 0)).toBe(true);
  });

  it("rejects overlapping or structurally forged Newton workspaces", () => {
    const dimension = 1;
    const shared = new Float64Array(9);
    const views = {
      dimension,
      current: shared.subarray(0, 1),
      residual: shared.subarray(1, 2),
      jacobian: shared.subarray(2, 3),
      factors: shared.subarray(3, 4),
      rightHandSide: shared.subarray(4, 5),
      transformedRightHandSide: shared.subarray(5, 6),
      update: shared.subarray(6, 7),
      trial: shared.subarray(7, 8),
      trialResidual: shared.subarray(8, 9),
      pivots: new Int32Array(1),
    };
    expect(() => bindFlatCoupledNewtonWorkspaceV1({
      ...views,
      residual: views.current,
    })).toThrow(/must not overlap/);

    const admitted = bindFlatCoupledNewtonWorkspaceV1(views);
    const forged = Object.freeze({
      ...admitted,
      current: new Float64Array(1),
    });
    expect(() => solveFlatCoupledSystemV1(
      manufacturedCoupledSystem(new Float64Array([1])),
      new Float64Array([0.9]),
      defaultOptions(1),
      forged,
    )).toThrow(/workspace is not admitted/);
  });

  it("fails closed on a singular Jacobian and preserves the caller seed", () => {
    const initial = new Float64Array(DIMENSION).fill(0.5);
    const original = initial.slice();
    const system: FlatCoupledSystemV1 = Object.freeze({
      dimension: DIMENSION,
      evaluateResidual: (_unknowns, destination) => destination.fill(1),
      evaluateJacobian: (_unknowns, destination) => destination.fill(0),
    });
    const result = solveFlatCoupledSystemV1(
      system,
      initial,
      defaultOptions(DIMENSION),
    );

    expect(result.status).toBe("failed");
    if (result.status !== "failed") {
      throw new Error("singular system unexpectedly converged");
    }
    expect(result.reason).toBe("singular-jacobian");
    expect(Array.from(initial)).toEqual(Array.from(original));
  });

  it("lets the physical component own its mixed convergence gate", () => {
    let jacobianEvaluationCount = 0;
    const system: FlatCoupledSystemV1 = Object.freeze({
      dimension: 1,
      evaluateResidual: (unknowns, destination) => {
        destination[0] = unknowns[0]! - 1;
      },
      isResidualConverged: (_unknowns, residual) =>
        Math.abs(residual[0]!) <= 0.5,
      evaluateJacobian: (_unknowns, destination) => {
        jacobianEvaluationCount += 1;
        destination[0] = 1;
      },
    });
    const result = solveFlatCoupledSystemV1(
      system,
      new Float64Array([0.5]),
      defaultOptions(1),
    );

    expect(result.status).toBe("converged");
    if (result.status !== "converged") throw new Error(result.message);
    expect(result.iterations).toBe(0);
    expect(result.residualInfinityNorm).toBe(0.5);
    expect(jacobianEvaluationCount).toBe(0);
  });

  it("fails closed when a model-owned convergence gate cannot be evaluated", () => {
    const system: FlatCoupledSystemV1 = Object.freeze({
      dimension: 1,
      evaluateResidual: (_unknowns, destination) => {
        destination[0] = 0.25;
      },
      isResidualConverged: () => {
        throw new Error("component admission unavailable");
      },
      evaluateJacobian: (_unknowns, destination) => {
        destination[0] = 1;
      },
    });
    const result = solveFlatCoupledSystemV1(
      system,
      new Float64Array([0.5]),
      defaultOptions(1),
    );

    expect(result.status).toBe("failed");
    if (result.status !== "failed") {
      throw new Error("failing convergence gate unexpectedly converged");
    }
    expect(result.reason).toBe("convergence-evaluation");
    expect(result.message).toBe("component admission unavailable");
  });

  it("accepts a line-search trial that satisfies the component convergence law", () => {
    const system: FlatCoupledSystemV1 = Object.freeze({
      dimension: 1,
      evaluateResidual: (unknowns, destination) => {
        destination[0] = unknowns[0]! <= 0.5 ? 1 : 1.05;
      },
      isResidualConverged: (unknowns, residual) =>
        unknowns[0]! > 0.5 && Math.abs(residual[0]!) <= 1.05,
      evaluateJacobian: (_unknowns, destination) => {
        destination[0] = -1;
      },
    });
    const result = solveFlatCoupledSystemV1(
      system,
      new Float64Array([0.5]),
      defaultOptions(1),
    );

    expect(result.status).toBe("converged");
    if (result.status !== "converged") throw new Error(result.message);
    expect(result.iterations).toBe(1);
    expect(result.solution[0]).toBe(1.5);
    expect(result.residualInfinityNorm).toBe(1.05);
    expect(result.lineSearchBacktrackCount).toBe(0);
  });

  it("keeps a coupled linear conservation boundary inside every line-search trial", () => {
    const dimension = 2;
    const root = new Float64Array([0.45, 0.45]);
    let maximumObservedSum = 0;
    let coupledLimitCount = 0;
    const system: FlatCoupledSystemV1 = Object.freeze({
      dimension,
      assertCandidateAdmissible: (unknowns) => {
        const sum = unknowns[0]! + unknowns[1]!;
        maximumObservedSum = Math.max(maximumObservedSum, sum);
        if (!(sum < 1)) {
          throw new RangeError("manufactured dependent volume is exhausted");
        }
      },
      maximumAdmissibleStepLength: (current, update) => {
        coupledLimitCount += 1;
        const delta = update[0]! + update[1]!;
        return delta <= 0
          ? 1
          : (1 - current[0]! - current[1]!) / delta;
      },
      evaluateResidual: (unknowns, destination) => {
        for (let index = 0; index < dimension; index += 1) {
          destination[index] = unknowns[index]! * unknowns[index]!
            - root[index]! * root[index]!;
        }
      },
      evaluateJacobian: (unknowns, destination) => {
        destination.fill(0);
        for (let index = 0; index < dimension; index += 1) {
          destination[index * dimension + index] = 2 * unknowns[index]!;
        }
      },
    });
    const result = solveFlatCoupledSystemV1(
      system,
      new Float64Array([0.05, 0.05]),
      defaultOptions(dimension),
    );

    expect(result.status).toBe("converged");
    if (result.status !== "converged") throw new Error(result.message);
    expect(coupledLimitCount).toBeGreaterThan(0);
    expect(maximumObservedSum).toBeLessThan(1);
    expect(result.solution[0]).toBeCloseTo(root[0]!, 10);
    expect(result.solution[1]).toBeCloseTo(root[1]!, 10);
  });

  it("converges the same cross-block root with a scaled Powell dogleg", () => {
    const root = Float64Array.from(
      { length: DIMENSION },
      (_, index) => 0.75 + index * 0.01,
    );
    const system = manufacturedCoupledSystem(root);
    const initial = Float64Array.from(root, (value, index) =>
      value + (index % 2 === 0 ? 0.18 : -0.14));
    const initialBeforeSolve = initial.slice();
    const solved = solveFlatCoupledSystemWithDoglegV1(
      system,
      initial,
      defaultDoglegOptions(DIMENSION),
      createFlatCoupledDoglegWorkspaceV1(DIMENSION),
    );

    expect(solved.solverId).toBe("flat-coupled-scaled-powell-dogleg-v1");
    expect(solved.result.status).toBe("converged");
    if (solved.result.status !== "converged") {
      throw new Error(solved.result.message);
    }
    expect(Array.from(initial)).toEqual(Array.from(initialBeforeSolve));
    expect(solved.result.residualInfinityNorm).toBeLessThan(1e-11);
    for (let index = 0; index < DIMENSION; index += 1) {
      expect(solved.result.solution[index]).toBeCloseTo(root[index]!, 9);
    }
  });

  it("keeps component convergence authoritative over trust-region merit", () => {
    const system: FlatCoupledSystemV1 = Object.freeze({
      dimension: 1,
      evaluateResidual: (unknowns, destination) => {
        destination[0] = unknowns[0]! <= 0.5 ? 1 : 1.05;
      },
      isResidualConverged: (unknowns, residual) =>
        unknowns[0]! > 0.5 && Math.abs(residual[0]!) <= 1.05,
      evaluateJacobian: (_unknowns, destination) => {
        destination[0] = -1;
      },
    });
    const solved = solveFlatCoupledSystemWithDoglegV1(
      system,
      new Float64Array([0.5]),
      defaultDoglegOptions(1),
    );

    expect(solved.result.status).toBe("converged");
    if (solved.result.status !== "converged") {
      throw new Error(solved.result.message);
    }
    expect(solved.result.iterations).toBe(1);
    expect(solved.result.solution[0]).toBe(1.5);
    expect(solved.result.residualInfinityNorm).toBe(1.05);
    expect(solved.rejectedTrialCount).toBe(0);
  });

  it("does not accept a non-root stationary least-squares point", () => {
    const system: FlatCoupledSystemV1 = Object.freeze({
      dimension: 1,
      evaluateResidual: (_unknowns, destination) => {
        destination[0] = 1;
      },
      isResidualConverged: () => false,
      evaluateJacobian: (_unknowns, destination) => {
        destination[0] = 0;
      },
    });
    const solved = solveFlatCoupledSystemWithDoglegV1(
      system,
      new Float64Array([0.5]),
      defaultDoglegOptions(1),
    );

    expect(solved.result.status).toBe("failed");
    if (solved.result.status !== "failed") {
      throw new Error("stationary non-root unexpectedly converged");
    }
    expect(solved.result.reason).toBe("singular-jacobian");
    expect(solved.rejectedTrialCount).toBeGreaterThan(0);
    expect(solved.trustRegionContractionCount).toBeGreaterThan(0);
  });
});

function diagonallyDominantMatrix(dimension: number): Float64Array {
  const matrix = new Float64Array(dimension * dimension);
  for (let row = 0; row < dimension; row += 1) {
    matrix[row * dimension + row] = 4 + row * 0.01;
    matrix[row * dimension + ((row + 1) % dimension)] = -0.25;
    matrix[row * dimension + ((row + 7) % dimension)] = 0.125;
  }
  return matrix;
}

function multiplyMatrixVector(
  matrix: Float64Array,
  vector: Float64Array,
): Float64Array {
  const dimension = vector.length;
  const product = new Float64Array(dimension);
  for (let row = 0; row < dimension; row += 1) {
    let value = 0;
    for (let column = 0; column < dimension; column += 1) {
      value += matrix[row * dimension + column]! * vector[column]!;
    }
    product[row] = value;
  }
  return product;
}

function manufacturedCoupledSystem(
  root: Float64Array,
): FlatCoupledSystemV1 {
  const coupling = 0.04;
  const target = Float64Array.from(root, (value, row) => {
    const neighbor = (row + 7) % root.length;
    return value * value + coupling * root[neighbor]!;
  });
  return Object.freeze({
    dimension: root.length,
    evaluateResidual: (unknowns, destination) => {
      for (let row = 0; row < root.length; row += 1) {
        const neighbor = (row + 7) % root.length;
        destination[row] = unknowns[row]! * unknowns[row]!
          + coupling * unknowns[neighbor]! - target[row]!;
      }
    },
    evaluateJacobian: (unknowns, destination) => {
      destination.fill(0);
      for (let row = 0; row < root.length; row += 1) {
        destination[row * root.length + row] = 2 * unknowns[row]!;
        destination[row * root.length + ((row + 7) % root.length)] =
          coupling;
      }
    },
  });
}

function defaultOptions(dimension: number): FlatCoupledNewtonOptionsV1 {
  return Object.freeze({
    maximumIterations: 12,
    maximumLineSearchBacktracks: 12,
    residualInfinityTolerance: 1e-12,
    updateInfinityTolerance: 1e-14,
    armijoCoefficient: 1e-4,
    minimumAbsolutePivot: 1e-14,
    unknownScaleByUnknown: new Float64Array(dimension).fill(1),
    residualScaleByEquation: new Float64Array(dimension).fill(1),
    lowerBoundByUnknown: new Float64Array(dimension).fill(0.01),
    upperBoundByUnknown: new Float64Array(dimension).fill(4),
  });
}

function defaultDoglegOptions(
  dimension: number,
): FlatCoupledDoglegOptionsV1 {
  return Object.freeze({
    ...defaultOptions(dimension),
    initialTrustRegionRadius: 2,
    maximumTrustRegionRadius: 32,
    minimumTrustRegionRadius: 1e-12,
    maximumTrustRegionTrialsPerIteration: 16,
    acceptanceRatio: 1e-4,
  });
}
