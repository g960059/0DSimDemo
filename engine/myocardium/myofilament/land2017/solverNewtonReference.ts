/**
 * Test-only reference oracle for the pre-direct-solve Land implementation.
 *
 * Production modules must import solver.ts, never this file. The deliberately
 * general Newton/line-search implementation is retained so tests can compare
 * the direct affine factorization with an independently solved residual.
 */
import {
  validateLand2017EquationState,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import {
  LAND2017_LOCAL_JACOBIAN_SIZE,
  writeLand2017BackwardEulerResidualJacobian,
} from "@/engine/myocardium/myofilament/land2017/jacobian";
import { evaluateLand2017StepOutput } from "@/engine/myocardium/myofilament/land2017/outputs";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { writeLand2017BackwardEulerResidual } from "@/engine/myocardium/myofilament/land2017/residual";
import {
  LAND2017_SDIRK2_GAMMA,
  evaluateLand2017Sdirk2StageOutput,
  writeLand2017Sdirk2StageResidual,
  type Land2017Sdirk2StageInput,
} from "@/engine/myocardium/myofilament/land2017/sdirk2";
import type {
  Land2017Sdirk2StageSolveSummary,
  Land2017Sdirk2StepSolveOptions,
  Land2017StepSolveOptions,
  Land2017StepSolveResult,
} from "@/engine/myocardium/myofilament/land2017/solver";
import {
  LAND2017_STATE_SIZE,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

const DEFAULTS = {
  maxIterations: 12,
  residualTolerance: 1e-9,
  lineSearchMinStep: 1 / 1024,
  lineSearchReduction: 0.5,
} as const;

export function solveLand2017BackwardEulerStepNewtonReference(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017StepSolveOptions = {},
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017StepSolveResult {
  try {
    validateLand2017EquationState(previous);
  } catch (error) {
    return failure(
      options.initialGuess ?? previous,
      0,
      Number.POSITIVE_INFINITY,
      0,
      "domain-error",
      errorMessage(error),
    );
  }
  return newtonReferenceSolve(
    options.initialGuess ?? previous,
    options,
    (state) => writeLand2017BackwardEulerResidual(
      state,
      previous,
      input,
      parameterSet,
    ),
    (state) => writeLand2017BackwardEulerResidualJacobian(
      state,
      input,
      parameterSet,
    ),
    (state) => evaluateLand2017StepOutput(state, input, parameterSet),
  );
}

export function solveLand2017Sdirk2StepNewtonReference(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017Sdirk2StepSolveOptions = {},
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017StepSolveResult {
  try {
    validateLand2017EquationState(previous);
  } catch (error) {
    return failure(
      options.initialGuess ?? previous,
      0,
      Number.POSITIVE_INFINITY,
      0,
      "domain-error",
      errorMessage(error),
    );
  }
  const previousFreeCalciumUM =
    options.previousFreeCalciumUM ?? input.freeCalciumUM;
  const stage0Strain = interpolate(
    input.previousFiberEngineeringStrain,
    input.stageFiberEngineeringStrain,
    LAND2017_SDIRK2_GAMMA,
  );
  const stage0 = solveLand2017BackwardEulerStepNewtonReference(
    previous,
    {
      freeCalciumUM: interpolate(
        previousFreeCalciumUM,
        input.freeCalciumUM,
        LAND2017_SDIRK2_GAMMA,
      ),
      previousFiberEngineeringStrain: input.previousFiberEngineeringStrain,
      stageFiberEngineeringStrain: stage0Strain,
      dtSec: input.dtSec * LAND2017_SDIRK2_GAMMA,
      stage: { scheme: "BE", stageIndex: 0 },
    },
    options,
    parameterSet,
  );
  const stage0Summary = summary(0, stage0);
  if (!stage0.ok) {
    return { ...stage0, substeps: 2, sdirk2Stage0: stage0Summary };
  }
  const stage1Input: Land2017Sdirk2StageInput = {
    freeCalciumUM: input.freeCalciumUM,
    previousFiberEngineeringStrain: input.previousFiberEngineeringStrain,
    stageFiberEngineeringStrain: input.stageFiberEngineeringStrain,
    dtSec: input.dtSec,
    stage: {
      scheme: "SDIRK2",
      stageIndex: 1,
      gamma: LAND2017_SDIRK2_GAMMA,
    },
    stage0: {
      state: stage0.nextState,
      fiberEngineeringStrain: stage0Strain,
      cavityVolumeM3: 0,
      freeCalciumUM: interpolate(
        previousFreeCalciumUM,
        input.freeCalciumUM,
        LAND2017_SDIRK2_GAMMA,
      ),
    },
  };
  const stage1 = newtonReferenceSolve(
    stage0.nextState,
    options,
    (state) => writeLand2017Sdirk2StageResidual(
      state,
      previous,
      stage1Input,
      parameterSet,
    ),
    (state, residual) => finiteDifferenceJacobian(
      state,
      residual,
      (candidate) => writeLand2017Sdirk2StageResidual(
        candidate,
        previous,
        stage1Input,
        parameterSet,
      ),
    ),
    (state) => evaluateLand2017Sdirk2StageOutput(
      state,
      stage1Input,
      parameterSet,
    ),
  );
  return {
    ...stage1,
    iterations: stage0.iterations + stage1.iterations,
    residualNorm: Math.max(stage0.residualNorm, stage1.residualNorm),
    lineSearchSteps: stage0.lineSearchSteps + stage1.lineSearchSteps,
    substeps: 2,
    sdirk2Stage0: stage0Summary,
    sdirk2Stage1: summary(1, stage1),
  };
}

function newtonReferenceSolve(
  initial: ArrayLike<number>,
  options: Land2017StepSolveOptions,
  residualAt: (state: Float64Array) => Float64Array,
  jacobianAt: (
    state: Float64Array,
    residual: Float64Array,
  ) => Float64Array,
  outputAt: (state: Float64Array) => LandSourceOutput,
): Land2017StepSolveResult {
  const opts = { ...DEFAULTS, ...options };
  let next = Float64Array.from(initial);
  let lineSearchSteps = 0;
  for (let iteration = 0; iteration <= opts.maxIterations; iteration += 1) {
    let residual: Float64Array;
    let norm: number;
    try {
      residual = residualAt(next);
      norm = infinityNorm(residual);
    } catch (error) {
      return failure(
        next,
        iteration,
        Number.POSITIVE_INFINITY,
        lineSearchSteps,
        "domain-error",
        errorMessage(error),
      );
    }
    if (!Number.isFinite(norm)) {
      return failure(
        next,
        iteration,
        norm,
        lineSearchSteps,
        "nonfinite-residual",
        "Residual norm is non-finite",
      );
    }
    if (norm <= opts.residualTolerance) {
      return {
        ok: true,
        nextState: Float64Array.from(next),
        output: outputAt(next),
        iterations: iteration,
        residualNorm: norm,
        lineSearchSteps,
        substeps: 1,
        stepRejected: false,
      };
    }
    if (iteration === opts.maxIterations) {
      return failure(
        next,
        iteration,
        norm,
        lineSearchSteps,
        "max-iterations",
        "Newton iteration limit reached",
      );
    }
    let delta: Float64Array;
    try {
      delta = solveDense6x6(
        jacobianAt(next, residual),
        Float64Array.from(residual, (value) => -value),
      );
    } catch (error) {
      return failure(
        next,
        iteration,
        norm,
        lineSearchSteps,
        "singular-jacobian",
        errorMessage(error),
      );
    }
    let accepted: Float64Array | null = null;
    for (
      let alpha = 1;
      alpha >= opts.lineSearchMinStep;
      alpha *= opts.lineSearchReduction
    ) {
      lineSearchSteps += 1;
      const candidate = Float64Array.from(
        next,
        (value, index) => value + alpha * delta[index]!,
      );
      try {
        if (infinityNorm(residualAt(candidate)) < norm) {
          accepted = candidate;
          break;
        }
      } catch {
        // Reference Newton uses the same admissible-domain line search.
      }
    }
    if (accepted === null) {
      return failure(
        next,
        iteration,
        norm,
        lineSearchSteps,
        "line-search-failed",
        "No admissible residual-reducing Newton step",
      );
    }
    next = accepted;
  }
  throw new Error("unreachable Land Newton reference state");
}

function finiteDifferenceJacobian(
  state: Float64Array,
  residual: Float64Array,
  residualAt: (state: Float64Array) => Float64Array,
): Float64Array {
  const jacobian = new Float64Array(LAND2017_LOCAL_JACOBIAN_SIZE);
  for (let column = 0; column < LAND2017_STATE_SIZE; column += 1) {
    const step = Math.max(1e-8, Math.abs(state[column]!) * 1e-6);
    const perturbed = Float64Array.from(state);
    perturbed[column] += step;
    const upper = residualAt(perturbed);
    for (let row = 0; row < LAND2017_STATE_SIZE; row += 1) {
      jacobian[row * LAND2017_STATE_SIZE + column] =
        (upper[row]! - residual[row]!) / step;
    }
  }
  return jacobian;
}

function solveDense6x6(
  matrix: Float64Array,
  rhs: Float64Array,
): Float64Array {
  const a = Float64Array.from(matrix);
  const b = Float64Array.from(rhs);
  for (let pivot = 0; pivot < LAND2017_STATE_SIZE; pivot += 1) {
    let pivotRow = pivot;
    for (let row = pivot + 1; row < LAND2017_STATE_SIZE; row += 1) {
      if (
        Math.abs(a[row * LAND2017_STATE_SIZE + pivot]!)
        > Math.abs(a[pivotRow * LAND2017_STATE_SIZE + pivot]!)
      ) pivotRow = row;
    }
    const pivotValue = a[pivotRow * LAND2017_STATE_SIZE + pivot]!;
    if (!(Math.abs(pivotValue) > 1e-14) || !Number.isFinite(pivotValue)) {
      throw new Error("Land 2017 reference residual Jacobian is singular");
    }
    if (pivotRow !== pivot) {
      for (
        let column = pivot;
        column < LAND2017_STATE_SIZE;
        column += 1
      ) {
        const left = pivot * LAND2017_STATE_SIZE + column;
        const right = pivotRow * LAND2017_STATE_SIZE + column;
        [a[left], a[right]] = [a[right]!, a[left]!];
      }
      [b[pivot], b[pivotRow]] = [b[pivotRow]!, b[pivot]!];
    }
    for (
      let row = pivot + 1;
      row < LAND2017_STATE_SIZE;
      row += 1
    ) {
      const factor = a[row * LAND2017_STATE_SIZE + pivot]!
        / a[pivot * LAND2017_STATE_SIZE + pivot]!;
      for (
        let column = pivot + 1;
        column < LAND2017_STATE_SIZE;
        column += 1
      ) {
        a[row * LAND2017_STATE_SIZE + column] -=
          factor * a[pivot * LAND2017_STATE_SIZE + column]!;
      }
      b[row] -= factor * b[pivot]!;
    }
  }
  const result = new Float64Array(LAND2017_STATE_SIZE);
  for (let row = LAND2017_STATE_SIZE - 1; row >= 0; row -= 1) {
    let value = b[row]!;
    for (
      let column = row + 1;
      column < LAND2017_STATE_SIZE;
      column += 1
    ) {
      value -= a[row * LAND2017_STATE_SIZE + column]! * result[column]!;
    }
    result[row] = value / a[row * LAND2017_STATE_SIZE + row]!;
  }
  return result;
}

function failure(
  next: ArrayLike<number>,
  iterations: number,
  residualNorm: number,
  lineSearchSteps: number,
  failureReason: NonNullable<Land2017StepSolveResult["failureReason"]>,
  failureMessage: string,
): Land2017StepSolveResult {
  return {
    ok: false,
    nextState: Float64Array.from(next),
    iterations,
    residualNorm,
    lineSearchSteps,
    substeps: 1,
    stepRejected: true,
    failureReason,
    failureMessage,
  };
}

function summary(
  stageIndex: 0 | 1,
  result: Land2017StepSolveResult,
): Land2017Sdirk2StageSolveSummary {
  return {
    stageIndex,
    ok: result.ok,
    iterations: result.iterations,
    residualNorm: result.residualNorm,
    lineSearchSteps: result.lineSearchSteps,
    failureReason: result.failureReason,
    failureMessage: result.failureMessage,
  };
}

function infinityNorm(values: ArrayLike<number>): number {
  let result = 0;
  for (let index = 0; index < values.length; index += 1) {
    result = Math.max(result, Math.abs(values[index]!));
  }
  return result;
}

function interpolate(start: number, end: number, fraction: number): number {
  return start + (end - start) * fraction;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
