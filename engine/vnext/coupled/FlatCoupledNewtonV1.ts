import {
  createFlatDenseLuWorkspaceV1,
  factorFlatDenseMatrixV1,
  solveFactoredFlatDenseSystemV1,
  type FlatDenseLuWorkspaceV1,
} from "@/engine/vnext/coupled/FlatDenseLuV1";

export const FLAT_COUPLED_NEWTON_V1_ID =
  "flat-coupled-damped-newton-v1" as const;

export type FlatCoupledSystemV1 = Readonly<{
  dimension: number;
  evaluateResidual: (
    unknowns: Float64Array,
    destination: Float64Array,
  ) => void;
  evaluateJacobian: (
    unknowns: Float64Array,
    rowMajorDestination: Float64Array,
  ) => void;
}>;

export type FlatCoupledNewtonOptionsV1 = Readonly<{
  maximumIterations: number;
  maximumLineSearchBacktracks: number;
  residualInfinityTolerance: number;
  updateInfinityTolerance: number;
  armijoCoefficient: number;
  minimumAbsolutePivot: number;
  lowerBoundByUnknown: Float64Array;
  upperBoundByUnknown: Float64Array;
}>;

export type FlatCoupledNewtonWorkspaceV1 = Readonly<{
  dimension: number;
  current: Float64Array;
  residual: Float64Array;
  jacobian: Float64Array;
  rightHandSide: Float64Array;
  update: Float64Array;
  trial: Float64Array;
  trialResidual: Float64Array;
  linear: FlatDenseLuWorkspaceV1;
}>;

export type FlatCoupledNewtonResultV1 =
  | Readonly<{
    status: "converged";
    solution: Float64Array;
    iterations: number;
    residualInfinityNorm: number;
    residualEvaluationCount: number;
    jacobianEvaluationCount: number;
    lineSearchBacktrackCount: number;
  }>
  | Readonly<{
    status: "failed";
    reason:
      | "initial-residual-evaluation"
      | "jacobian-evaluation"
      | "singular-jacobian"
      | "stagnated"
      | "line-search"
      | "maximum-iterations";
    message: string;
    lastCandidate: Float64Array;
    iterations: number;
    residualInfinityNorm: number;
    residualEvaluationCount: number;
    jacobianEvaluationCount: number;
    lineSearchBacktrackCount: number;
  }>;

export function createFlatCoupledNewtonWorkspaceV1(
  dimension: number,
): FlatCoupledNewtonWorkspaceV1 {
  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new RangeError("coupled Newton dimension must be a positive integer");
  }
  return Object.freeze({
    dimension,
    current: new Float64Array(dimension),
    residual: new Float64Array(dimension),
    jacobian: new Float64Array(dimension * dimension),
    rightHandSide: new Float64Array(dimension),
    update: new Float64Array(dimension),
    trial: new Float64Array(dimension),
    trialResidual: new Float64Array(dimension),
    linear: createFlatDenseLuWorkspaceV1(dimension),
  });
}

export function solveFlatCoupledSystemV1(
  system: FlatCoupledSystemV1,
  initialUnknowns: Float64Array,
  options: FlatCoupledNewtonOptionsV1,
  workspace: FlatCoupledNewtonWorkspaceV1 =
    createFlatCoupledNewtonWorkspaceV1(system.dimension),
): FlatCoupledNewtonResultV1 {
  validateInputs(system, initialUnknowns, options, workspace);
  const {
    current,
    residual,
    jacobian,
    rightHandSide,
    update,
    trial,
    trialResidual,
    linear,
  } = workspace;
  current.set(initialUnknowns);
  let residualEvaluationCount = 0;
  let jacobianEvaluationCount = 0;
  let lineSearchBacktrackCount = 0;

  try {
    system.evaluateResidual(current, residual);
    residualEvaluationCount += 1;
    requireFiniteVector(residual, "initial coupled residual");
  } catch (error) {
    return failure(
      "initial-residual-evaluation",
      errorMessage(error),
      current,
      0,
      Number.POSITIVE_INFINITY,
      residualEvaluationCount,
      jacobianEvaluationCount,
      lineSearchBacktrackCount,
    );
  }

  for (let iteration = 0;
    iteration <= options.maximumIterations;
    iteration += 1) {
    const residualInfinityNorm = infinityNorm(residual);
    if (residualInfinityNorm <= options.residualInfinityTolerance) {
      return success(
        current,
        iteration,
        residualInfinityNorm,
        residualEvaluationCount,
        jacobianEvaluationCount,
        lineSearchBacktrackCount,
      );
    }
    if (iteration === options.maximumIterations) {
      return failure(
        "maximum-iterations",
        "flat coupled Newton reached its iteration limit",
        current,
        iteration,
        residualInfinityNorm,
        residualEvaluationCount,
        jacobianEvaluationCount,
        lineSearchBacktrackCount,
      );
    }

    try {
      system.evaluateJacobian(current, jacobian);
      jacobianEvaluationCount += 1;
      requireFiniteVector(jacobian, "coupled Jacobian");
    } catch (error) {
      return failure(
        "jacobian-evaluation",
        errorMessage(error),
        current,
        iteration,
        residualInfinityNorm,
        residualEvaluationCount,
        jacobianEvaluationCount,
        lineSearchBacktrackCount,
      );
    }
    if (!factorFlatDenseMatrixV1(
      jacobian,
      linear,
      options.minimumAbsolutePivot,
    )) {
      return failure(
        "singular-jacobian",
        "flat coupled Newton Jacobian is singular or ill-conditioned",
        current,
        iteration,
        residualInfinityNorm,
        residualEvaluationCount,
        jacobianEvaluationCount,
        lineSearchBacktrackCount,
      );
    }
    for (let index = 0; index < system.dimension; index += 1) {
      rightHandSide[index] = -residual[index]!;
    }
    solveFactoredFlatDenseSystemV1(linear, rightHandSide, update);
    const updateInfinityNorm = infinityNorm(update);
    if (updateInfinityNorm <= options.updateInfinityTolerance) {
      return failure(
        "stagnated",
        "flat coupled Newton update stagnated above residual tolerance",
        current,
        iteration,
        residualInfinityNorm,
        residualEvaluationCount,
        jacobianEvaluationCount,
        lineSearchBacktrackCount,
      );
    }

    let stepLength = admissibleStepLength(current, update, options);
    let accepted = false;
    let lastError = "no residual-decreasing admissible candidate";
    for (let backtrack = 0;
      backtrack <= options.maximumLineSearchBacktracks;
      backtrack += 1) {
      for (let index = 0; index < system.dimension; index += 1) {
        trial[index] = current[index]! + stepLength * update[index]!;
      }
      try {
        requireWithinBounds(trial, options);
        system.evaluateResidual(trial, trialResidual);
        residualEvaluationCount += 1;
        requireFiniteVector(trialResidual, "line-search coupled residual");
        if (
          infinityNorm(trialResidual)
          <= (1 - options.armijoCoefficient * stepLength)
            * residualInfinityNorm
        ) {
          current.set(trial);
          residual.set(trialResidual);
          accepted = true;
          break;
        }
        lastError = "candidate did not satisfy the Armijo residual decrease";
      } catch (error) {
        lastError = errorMessage(error);
      }
      stepLength *= 0.5;
      lineSearchBacktrackCount += 1;
    }
    if (!accepted) {
      return failure(
        "line-search",
        `flat coupled Newton line search failed: ${lastError}`,
        current,
        iteration,
        residualInfinityNorm,
        residualEvaluationCount,
        jacobianEvaluationCount,
        lineSearchBacktrackCount,
      );
    }
  }
  throw new Error("unreachable flat coupled Newton state");
}

function validateInputs(
  system: FlatCoupledSystemV1,
  initialUnknowns: Float64Array,
  options: FlatCoupledNewtonOptionsV1,
  workspace: FlatCoupledNewtonWorkspaceV1,
): void {
  if (!Number.isInteger(system.dimension) || system.dimension <= 0) {
    throw new RangeError("coupled system dimension must be a positive integer");
  }
  if (workspace.dimension !== system.dimension) {
    throw new RangeError("coupled Newton workspace dimension differs");
  }
  requireLength(initialUnknowns, system.dimension, "initial unknowns");
  requireFiniteVector(initialUnknowns, "initial unknowns");
  requireLength(
    options.lowerBoundByUnknown,
    system.dimension,
    "lower bounds",
  );
  requireLength(
    options.upperBoundByUnknown,
    system.dimension,
    "upper bounds",
  );
  if (!Number.isInteger(options.maximumIterations)
      || options.maximumIterations <= 0
      || !Number.isInteger(options.maximumLineSearchBacktracks)
      || options.maximumLineSearchBacktracks < 0) {
    throw new RangeError("coupled Newton iteration limits are invalid");
  }
  requirePositiveFinite(
    options.residualInfinityTolerance,
    "residualInfinityTolerance",
  );
  requirePositiveFinite(
    options.updateInfinityTolerance,
    "updateInfinityTolerance",
  );
  requirePositiveFinite(options.minimumAbsolutePivot, "minimumAbsolutePivot");
  if (!Number.isFinite(options.armijoCoefficient)
      || options.armijoCoefficient <= 0
      || options.armijoCoefficient >= 1) {
    throw new RangeError("armijoCoefficient must be finite within (0, 1)");
  }
  for (let index = 0; index < system.dimension; index += 1) {
    const lower = options.lowerBoundByUnknown[index]!;
    const upper = options.upperBoundByUnknown[index]!;
    if (Number.isNaN(lower) || Number.isNaN(upper) || !(upper > lower)) {
      throw new RangeError(`coupled Newton bounds[${index}] are invalid`);
    }
  }
  requireWithinBounds(initialUnknowns, options);
}

function admissibleStepLength(
  current: Float64Array,
  update: Float64Array,
  options: FlatCoupledNewtonOptionsV1,
): number {
  let stepLength = 1;
  for (let index = 0; index < current.length; index += 1) {
    const delta = update[index]!;
    if (delta < 0 && Number.isFinite(options.lowerBoundByUnknown[index]!)) {
      stepLength = Math.min(
        stepLength,
        0.99 * (current[index]! - options.lowerBoundByUnknown[index]!)
          / -delta,
      );
    } else if (
      delta > 0
      && Number.isFinite(options.upperBoundByUnknown[index]!)
    ) {
      stepLength = Math.min(
        stepLength,
        0.99 * (options.upperBoundByUnknown[index]! - current[index]!)
          / delta,
      );
    }
  }
  if (!Number.isFinite(stepLength) || stepLength <= 0) {
    throw new RangeError("coupled Newton has no positive admissible step");
  }
  return stepLength;
}

function requireWithinBounds(
  values: Float64Array,
  options: FlatCoupledNewtonOptionsV1,
): void {
  for (let index = 0; index < values.length; index += 1) {
    if (
      !(values[index]! > options.lowerBoundByUnknown[index]!)
      || !(values[index]! < options.upperBoundByUnknown[index]!)
    ) {
      throw new RangeError(`coupled unknown[${index}] left its open bounds`);
    }
  }
}

function requireLength(
  value: Float64Array,
  expected: number,
  label: string,
): void {
  if (!(value instanceof Float64Array) || value.length !== expected) {
    throw new RangeError(`${label} must contain ${expected} f64 values`);
  }
}

function requireFiniteVector(value: Float64Array, label: string): void {
  if (value.some((entry) => !Number.isFinite(entry))) {
    throw new RangeError(`${label} must contain only finite values`);
  }
}

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite`);
  }
}

function infinityNorm(values: Float64Array): number {
  let maximum = 0;
  for (let index = 0; index < values.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(values[index]!));
  }
  return maximum;
}

function success(
  current: Float64Array,
  iterations: number,
  residualInfinityNorm: number,
  residualEvaluationCount: number,
  jacobianEvaluationCount: number,
  lineSearchBacktrackCount: number,
): FlatCoupledNewtonResultV1 {
  return Object.freeze({
    status: "converged" as const,
    solution: current.slice(),
    iterations,
    residualInfinityNorm,
    residualEvaluationCount,
    jacobianEvaluationCount,
    lineSearchBacktrackCount,
  });
}

function failure(
  reason: Extract<FlatCoupledNewtonResultV1, { status: "failed" }>["reason"],
  message: string,
  current: Float64Array,
  iterations: number,
  residualInfinityNorm: number,
  residualEvaluationCount: number,
  jacobianEvaluationCount: number,
  lineSearchBacktrackCount: number,
): FlatCoupledNewtonResultV1 {
  return Object.freeze({
    status: "failed" as const,
    reason,
    message,
    lastCandidate: current.slice(),
    iterations,
    residualInfinityNorm,
    residualEvaluationCount,
    jacobianEvaluationCount,
    lineSearchBacktrackCount,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
