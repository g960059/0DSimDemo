import {
  LAND2017_STATE_SIZE,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";
import { evaluateLand2017StepOutput } from "@/engine/myocardium/myofilament/land2017/outputs";
import {
  LAND2017_LOCAL_JACOBIAN_SIZE,
  writeLand2017BackwardEulerResidualJacobian,
} from "@/engine/myocardium/myofilament/land2017/jacobian";
import { writeLand2017BackwardEulerResidual } from "@/engine/myocardium/myofilament/land2017/residual";
import {
  validateLand2017EquationState,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";

export type Land2017SolveFailureReason =
  | "domain-error"
  | "line-search-failed"
  | "max-iterations"
  | "nonfinite-residual"
  | "singular-jacobian";

export type Land2017StepSolveOptions = {
  readonly maxIterations?: number;
  readonly residualTolerance?: number;
  readonly lineSearchMinStep?: number;
  readonly lineSearchReduction?: number;
  readonly initialGuess?: ArrayLike<number>;
};

export type Land2017StepSolveResult = {
  readonly ok: boolean;
  readonly nextState: Float64Array;
  readonly output?: LandSourceOutput;
  readonly iterations: number;
  readonly residualNorm: number;
  readonly lineSearchSteps: number;
  readonly substeps: number;
  readonly stepRejected: boolean;
  readonly failureReason?: Land2017SolveFailureReason;
  readonly failureMessage?: string;
};

export type Land2017SubstepSolveOptions = Land2017StepSolveOptions & {
  readonly substeps?: number;
  readonly previousFreeCalciumUM?: number;
};

type ResidualEvaluation =
  | { ok: true; residual: Float64Array; norm: number }
  | { ok: false; reason: "domain-error" | "nonfinite-residual"; message: string };

const DEFAULT_SOLVE_OPTIONS = {
  maxIterations: 12,
  residualTolerance: 1e-9,
  lineSearchMinStep: 1 / 1024,
  lineSearchReduction: 0.5,
} as const;

export function solveLand2017BackwardEulerStep(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017StepSolveOptions = {},
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017StepSolveResult {
  const opts = { ...DEFAULT_SOLVE_OPTIONS, ...options };
  let next = Float64Array.from(options.initialGuess ?? previous);
  let lineSearchSteps = 0;
  const previousValidation = validatePreviousState(previous);
  if (previousValidation.ok === false) {
    return failed(next, 0, Number.POSITIVE_INFINITY, lineSearchSteps, "domain-error", previousValidation.message);
  }

  for (let iteration = 0; iteration <= opts.maxIterations; iteration += 1) {
    const residualEvaluation = evaluateResidual(next, previous, input, parameterSet);
    if (residualEvaluation.ok === false) {
      return failed(
        next,
        iteration,
        Number.POSITIVE_INFINITY,
        lineSearchSteps,
        residualEvaluation.reason,
        residualEvaluation.message,
      );
    }
    const { residual, norm } = residualEvaluation;
    if (norm <= opts.residualTolerance) {
      return succeeded(next, input, iteration, norm, lineSearchSteps, parameterSet);
    }
    if (iteration === opts.maxIterations) {
      return failed(next, iteration, norm, lineSearchSteps, "max-iterations", "Newton iteration limit reached");
    }

    let jacobian: Float64Array;
    try {
      jacobian = writeLand2017BackwardEulerResidualJacobian(next, input, parameterSet);
    } catch (error) {
      return failed(next, iteration, norm, lineSearchSteps, "domain-error", (error as Error).message);
    }

    let delta: Float64Array;
    try {
      delta = solveDenseLinearSystem6(jacobian, residual.map((value) => -value));
    } catch (error) {
      return failed(next, iteration, norm, lineSearchSteps, "singular-jacobian", (error as Error).message);
    }

    let accepted: Float64Array | null = null;
    let acceptedNorm = Number.POSITIVE_INFINITY;
    for (let alpha = 1; alpha >= opts.lineSearchMinStep; alpha *= opts.lineSearchReduction) {
      lineSearchSteps += 1;
      const candidate = addScaled(next, delta, alpha);
      const candidateEvaluation = evaluateResidual(candidate, previous, input, parameterSet);
      if (!candidateEvaluation.ok) continue;
      if (candidateEvaluation.norm < norm && candidateEvaluation.norm < acceptedNorm) {
        accepted = candidate;
        acceptedNorm = candidateEvaluation.norm;
        break;
      }
    }

    if (!accepted) {
      return failed(next, iteration, norm, lineSearchSteps, "line-search-failed", "No admissible residual-reducing Newton step");
    }
    next = accepted;
  }

  return failed(next, opts.maxIterations, Number.POSITIVE_INFINITY, lineSearchSteps, "max-iterations", "Newton iteration limit reached");
}

export function solveLand2017BackwardEulerSubsteps(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017SubstepSolveOptions = {},
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017StepSolveResult {
  const substeps = options.substeps ?? 1;
  if (!Number.isInteger(substeps) || substeps <= 0) {
    throw new Error("Land 2017 substeps must be a positive integer");
  }
  if (substeps === 1) {
    return solveLand2017BackwardEulerStep(previous, input, options, parameterSet);
  }

  let state = Float64Array.from(previous);
  let totalIterations = 0;
  let totalLineSearchSteps = 0;
  const previousFreeCalciumUM = options.previousFreeCalciumUM ?? input.freeCalciumUM;
  let lastOutput: LandSourceOutput | undefined;

  for (let substep = 0; substep < substeps; substep += 1) {
    const startFraction = substep / substeps;
    const endFraction = (substep + 1) / substeps;
    const substepInput: LandStepInput = {
      freeCalciumUM: interpolate(previousFreeCalciumUM, input.freeCalciumUM, endFraction),
      previousFiberEngineeringStrain: interpolate(
        input.previousFiberEngineeringStrain,
        input.stageFiberEngineeringStrain,
        startFraction,
      ),
      stageFiberEngineeringStrain: interpolate(
        input.previousFiberEngineeringStrain,
        input.stageFiberEngineeringStrain,
        endFraction,
      ),
      dtSec: input.dtSec / substeps,
      stage: input.stage,
    };
    const result = solveLand2017BackwardEulerStep(
      state,
      substepInput,
      { ...options, initialGuess: state },
      parameterSet,
    );
    totalIterations += result.iterations;
    totalLineSearchSteps += result.lineSearchSteps;
    if (!result.ok) {
      return {
        ...result,
        iterations: totalIterations,
        lineSearchSteps: totalLineSearchSteps,
        substeps,
      };
    }
    state = result.nextState;
    lastOutput = result.output;
  }

  return {
    ok: true,
    nextState: state,
    output: lastOutput ?? evaluateLand2017StepOutput(state, input, parameterSet),
    iterations: totalIterations,
    residualNorm: 0,
    lineSearchSteps: totalLineSearchSteps,
    substeps,
    stepRejected: false,
  };
}

function validatePreviousState(previous: ArrayLike<number>): { ok: true } | { ok: false; message: string } {
  try {
    validateLand2017EquationState(previous);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

function evaluateResidual(
  next: ArrayLike<number>,
  previous: ArrayLike<number>,
  input: LandStepInput,
  parameterSet: Land2017EquationParameters,
): ResidualEvaluation {
  try {
    const residual = writeLand2017BackwardEulerResidual(next, previous, input, parameterSet);
    const norm = infinityNorm(residual);
    if (!Number.isFinite(norm)) {
      return { ok: false, reason: "nonfinite-residual", message: "Residual norm is non-finite" };
    }
    return { ok: true, residual, norm };
  } catch (error) {
    return { ok: false, reason: "domain-error", message: (error as Error).message };
  }
}

function succeeded(
  next: Float64Array,
  input: LandStepInput,
  iterations: number,
  residualNorm: number,
  lineSearchSteps: number,
  parameterSet: Land2017EquationParameters,
): Land2017StepSolveResult {
  return {
    ok: true,
    nextState: Float64Array.from(next),
    output: evaluateLand2017StepOutput(next, input, parameterSet),
    iterations,
    residualNorm,
    lineSearchSteps,
    substeps: 1,
    stepRejected: false,
  };
}

function failed(
  next: Float64Array,
  iterations: number,
  residualNorm: number,
  lineSearchSteps: number,
  reason: Land2017SolveFailureReason,
  message: string,
): Land2017StepSolveResult {
  return {
    ok: false,
    nextState: Float64Array.from(next),
    iterations,
    residualNorm,
    lineSearchSteps,
    substeps: 1,
    stepRejected: true,
    failureReason: reason,
    failureMessage: message,
  };
}

function solveDenseLinearSystem6(matrix: Float64Array, rhs: Float64Array): Float64Array {
  if (matrix.length !== LAND2017_LOCAL_JACOBIAN_SIZE || rhs.length !== LAND2017_STATE_SIZE) {
    throw new Error("Land 2017 dense solve expects a 6x6 matrix and 6-vector");
  }
  const a = Float64Array.from(matrix);
  const b = Float64Array.from(rhs);
  const n = LAND2017_STATE_SIZE;

  for (let pivot = 0; pivot < n; pivot += 1) {
    let pivotRow = pivot;
    let pivotAbs = Math.abs(a[pivot * n + pivot]);
    for (let row = pivot + 1; row < n; row += 1) {
      const candidateAbs = Math.abs(a[row * n + pivot]);
      if (candidateAbs > pivotAbs) {
        pivotAbs = candidateAbs;
        pivotRow = row;
      }
    }
    if (pivotAbs < 1e-14 || !Number.isFinite(pivotAbs)) {
      throw new Error("Land 2017 residual Jacobian is singular");
    }
    if (pivotRow !== pivot) {
      for (let column = pivot; column < n; column += 1) {
        const left = pivot * n + column;
        const right = pivotRow * n + column;
        const tmp = a[left];
        a[left] = a[right];
        a[right] = tmp;
      }
      const tmp = b[pivot];
      b[pivot] = b[pivotRow];
      b[pivotRow] = tmp;
    }

    for (let row = pivot + 1; row < n; row += 1) {
      const factor = a[row * n + pivot] / a[pivot * n + pivot];
      a[row * n + pivot] = 0;
      for (let column = pivot + 1; column < n; column += 1) {
        a[row * n + column] -= factor * a[pivot * n + column];
      }
      b[row] -= factor * b[pivot];
    }
  }

  const x = new Float64Array(n);
  for (let row = n - 1; row >= 0; row -= 1) {
    let sum = b[row];
    for (let column = row + 1; column < n; column += 1) {
      sum -= a[row * n + column] * x[column];
    }
    x[row] = sum / a[row * n + row];
  }
  return x;
}

function addScaled(state: ArrayLike<number>, delta: ArrayLike<number>, alpha: number): Float64Array {
  const out = new Float64Array(LAND2017_STATE_SIZE);
  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    out[index] = state[index] + alpha * delta[index];
  }
  return out;
}

function infinityNorm(values: ArrayLike<number>): number {
  let norm = 0;
  for (let index = 0; index < values.length; index += 1) {
    norm = Math.max(norm, Math.abs(values[index]));
  }
  return norm;
}

function interpolate(start: number, end: number, fraction: number): number {
  return start + (end - start) * fraction;
}
