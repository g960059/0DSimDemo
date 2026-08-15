import {
  bindFlatDenseLuWorkspaceV1,
  createFlatDenseLuWorkspaceV1,
  factorFlatDenseMatrixV1,
  solvePreparedFactoredFlatDenseSystemV1,
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
  /**
   * Optional model-owned convergence gate. When supplied, it replaces the
   * generic raw infinity-norm test so mixed component tolerances remain the
   * accepted-state authority.
   */
  isResidualConverged?: (
    unknowns: Float64Array,
    residual: Float64Array,
  ) => boolean;
  /** Additional coupled-domain gate beyond separable per-unknown bounds. */
  assertCandidateAdmissible?: (unknowns: Float64Array) => void;
  /**
   * Exact upper fraction for a coupled-domain line-search direction. Values
   * at or above one leave the full Newton step available; the solver applies
   * its own interior safety factor when the returned limit is below one.
   */
  maximumAdmissibleStepLength?: (
    current: Float64Array,
    update: Float64Array,
  ) => number;
}>;

export type FlatCoupledNewtonOptionsV1 = Readonly<{
  maximumIterations: number;
  maximumLineSearchBacktracks: number;
  /** Maximum accepted Newton updates before rebuilding and refactoring J. */
  maximumAcceptedStepsPerJacobian?: number;
  residualInfinityTolerance: number;
  updateInfinityTolerance: number;
  armijoCoefficient: number;
  minimumAbsolutePivot: number;
  /** Physical unknown represented by one normalized linear-solve unit. */
  unknownScaleByUnknown: Float64Array;
  /** Physical residual represented by one normalized linear-solve unit. */
  residualScaleByEquation: Float64Array;
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

export type FlatCoupledNewtonWorkspaceViewsV1 = Readonly<{
  dimension: number;
  current: Float64Array;
  residual: Float64Array;
  jacobian: Float64Array;
  factors: Float64Array;
  rightHandSide: Float64Array;
  transformedRightHandSide: Float64Array;
  update: Float64Array;
  trial: Float64Array;
  trialResidual: Float64Array;
  pivots: Int32Array;
}>;

const ADMITTED_FLAT_COUPLED_NEWTON_WORKSPACES_V1 = new WeakSet<object>();

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
      | "convergence-evaluation"
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
  const linear = createFlatDenseLuWorkspaceV1(dimension);
  return bindFlatCoupledNewtonWorkspaceV1({
    dimension,
    current: new Float64Array(dimension),
    residual: new Float64Array(dimension),
    jacobian: new Float64Array(dimension * dimension),
    factors: linear.factors,
    rightHandSide: new Float64Array(dimension),
    transformedRightHandSide: linear.transformedRightHandSide,
    update: new Float64Array(dimension),
    trial: new Float64Array(dimension),
    trialResidual: new Float64Array(dimension),
    pivots: linear.pivotRowByColumn,
  });
}

/**
 * Binds compiler-owned typed segments to the generic Newton/LU solver without
 * copying or reallocating them. All mutable byte ranges must be disjoint.
 */
export function bindFlatCoupledNewtonWorkspaceV1(
  views: FlatCoupledNewtonWorkspaceViewsV1,
): FlatCoupledNewtonWorkspaceV1 {
  const dimension = views.dimension;
  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new RangeError("coupled Newton dimension must be a positive integer");
  }
  const vectors = [
    [views.current, "current"],
    [views.residual, "residual"],
    [views.rightHandSide, "right-hand side"],
    [views.transformedRightHandSide, "transformed right-hand side"],
    [views.update, "update"],
    [views.trial, "trial"],
    [views.trialResidual, "trial residual"],
  ] as const;
  for (const [view, label] of vectors) {
    requireLength(view, dimension, `coupled Newton ${label}`);
  }
  requireLength(
    views.jacobian,
    dimension * dimension,
    "coupled Newton Jacobian",
  );
  requireLength(
    views.factors,
    dimension * dimension,
    "coupled Newton factors",
  );
  if (!(views.pivots instanceof Int32Array) || views.pivots.length !== dimension) {
    throw new RangeError(
      `coupled Newton pivots must contain ${dimension} int32 values`,
    );
  }
  requireDisjointWorkspaceViewsV1([
    views.current,
    views.residual,
    views.jacobian,
    views.factors,
    views.rightHandSide,
    views.transformedRightHandSide,
    views.update,
    views.trial,
    views.trialResidual,
    views.pivots,
  ]);
  const workspace = Object.freeze({
    dimension,
    current: views.current,
    residual: views.residual,
    jacobian: views.jacobian,
    rightHandSide: views.rightHandSide,
    update: views.update,
    trial: views.trial,
    trialResidual: views.trialResidual,
    linear: bindFlatDenseLuWorkspaceV1({
      dimension,
      factors: views.factors,
      pivotRowByColumn: views.pivots,
      transformedRightHandSide: views.transformedRightHandSide,
    }),
  });
  ADMITTED_FLAT_COUPLED_NEWTON_WORKSPACES_V1.add(workspace);
  return workspace;
}

export function assertFlatCoupledNewtonWorkspaceV1(
  workspace: FlatCoupledNewtonWorkspaceV1,
  dimension: number,
): void {
  if (
    !ADMITTED_FLAT_COUPLED_NEWTON_WORKSPACES_V1.has(workspace)
    || workspace.dimension !== dimension
  ) {
    throw new RangeError("coupled Newton workspace is not admitted");
  }
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
  const maximumAcceptedStepsPerJacobian =
    options.maximumAcceptedStepsPerJacobian ?? 1;
  let acceptedStepsSinceJacobian = maximumAcceptedStepsPerJacobian;

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
    let residualConverged: boolean;
    const residualMerit = residualInfinityNorm;
    try {
      residualConverged = system.isResidualConverged === undefined
        ? residualInfinityNorm <= options.residualInfinityTolerance
        : system.isResidualConverged(current, residual);
      if (typeof residualConverged !== "boolean") {
        throw new TypeError("coupled convergence gate must return a boolean");
      }
    } catch (error) {
      return failure(
        "convergence-evaluation",
        errorMessage(error),
        current,
        iteration,
        residualInfinityNorm,
        residualEvaluationCount,
        jacobianEvaluationCount,
        lineSearchBacktrackCount,
      );
    }
    if (residualConverged) {
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

    if (acceptedStepsSinceJacobian >= maximumAcceptedStepsPerJacobian) {
      try {
        system.evaluateJacobian(current, jacobian);
        jacobianEvaluationCount += 1;
        equilibrateJacobianInPlace(jacobian, options);
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
      acceptedStepsSinceJacobian = 0;
    }
    for (let index = 0; index < system.dimension; index += 1) {
      rightHandSide[index] = -residual[index]!
        / options.residualScaleByEquation[index]!;
    }
    solvePreparedFactoredFlatDenseSystemV1(
      linear,
      rightHandSide,
      update,
    );
    for (let index = 0; index < system.dimension; index += 1) {
      update[index] *= options.unknownScaleByUnknown[index]!;
    }
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

    let stepLength = admissibleStepLength(
      system,
      current,
      update,
      options,
    );
    let accepted = false;
    let lastError = "no residual-decreasing admissible candidate";
    let minimumTrialMerit = Number.POSITIVE_INFINITY;
    for (let backtrack = 0;
      backtrack <= options.maximumLineSearchBacktracks;
      backtrack += 1) {
      for (let index = 0; index < system.dimension; index += 1) {
        trial[index] = current[index]! + stepLength * update[index]!;
      }
      try {
        requireWithinBounds(trial, options);
        system.assertCandidateAdmissible?.(trial);
        system.evaluateResidual(trial, trialResidual);
        residualEvaluationCount += 1;
        requireFiniteVector(trialResidual, "line-search coupled residual");
        const trialMerit = infinityNorm(trialResidual);
        let componentConverged = false;
        if (system.isResidualConverged !== undefined) {
          componentConverged = system.isResidualConverged(
            trial,
            trialResidual,
          );
        }
        minimumTrialMerit = Math.min(minimumTrialMerit, trialMerit);
        if (typeof componentConverged !== "boolean") {
          throw new TypeError("coupled convergence gate must return a boolean");
        }
        if (
          componentConverged
          || trialMerit
            <= (1 - options.armijoCoefficient * stepLength)
              * residualMerit
        ) {
          current.set(trial);
          residual.set(trialResidual);
          accepted = true;
          acceptedStepsSinceJacobian += 1;
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
        `flat coupled Newton line search failed: ${lastError}; `
          + `current merit ${residualMerit}; minimum trial merit `
          + `${minimumTrialMerit}`,
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
  assertFlatCoupledNewtonWorkspaceV1(workspace, system.dimension);
  requireLength(initialUnknowns, system.dimension, "initial unknowns");
  requireFiniteVector(initialUnknowns, "initial unknowns");
  requireLength(
    options.unknownScaleByUnknown,
    system.dimension,
    "unknown scales",
  );
  requireLength(
    options.residualScaleByEquation,
    system.dimension,
    "residual scales",
  );
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
  if (
    options.maximumAcceptedStepsPerJacobian !== undefined
    && (!Number.isInteger(options.maximumAcceptedStepsPerJacobian)
      || options.maximumAcceptedStepsPerJacobian <= 0)
  ) {
    throw new RangeError(
      "maximumAcceptedStepsPerJacobian must be a positive integer",
    );
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
    requirePositiveFinite(
      options.unknownScaleByUnknown[index]!,
      `unknownScaleByUnknown[${index}]`,
    );
    requirePositiveFinite(
      options.residualScaleByEquation[index]!,
      `residualScaleByEquation[${index}]`,
    );
    const lower = options.lowerBoundByUnknown[index]!;
    const upper = options.upperBoundByUnknown[index]!;
    if (Number.isNaN(lower) || Number.isNaN(upper) || !(upper > lower)) {
      throw new RangeError(`coupled Newton bounds[${index}] are invalid`);
    }
  }
  requireWithinBounds(initialUnknowns, options);
  system.assertCandidateAdmissible?.(initialUnknowns);
}

function equilibrateJacobianInPlace(
  jacobian: Float64Array,
  options: FlatCoupledNewtonOptionsV1,
): void {
  const dimension = options.unknownScaleByUnknown.length;
  for (let row = 0; row < dimension; row += 1) {
    const inverseResidualScale = 1 / options.residualScaleByEquation[row]!;
    for (let column = 0; column < dimension; column += 1) {
      const index = row * dimension + column;
      const equilibrated = jacobian[index]!
        * options.unknownScaleByUnknown[column]! * inverseResidualScale;
      if (!Number.isFinite(equilibrated)) {
        throw new RangeError(
          "equilibrated coupled Jacobian must contain only finite values",
        );
      }
      jacobian[index] = equilibrated;
    }
  }
}

function admissibleStepLength(
  system: FlatCoupledSystemV1,
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
  const coupledLimit = system.maximumAdmissibleStepLength?.(current, update);
  if (coupledLimit !== undefined) {
    if (!Number.isFinite(coupledLimit) || coupledLimit <= 0) {
      throw new RangeError(
        "coupled Newton system returned no positive admissible step",
      );
    }
    if (coupledLimit < 1) {
      stepLength = Math.min(stepLength, 0.99 * coupledLimit);
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

function requireDisjointWorkspaceViewsV1(
  views: readonly ArrayBufferView[],
): void {
  for (let left = 0; left < views.length; left += 1) {
    const first = views[left]!;
    for (let right = left + 1; right < views.length; right += 1) {
      const second = views[right]!;
      if (
        first.buffer === second.buffer
        && first.byteOffset < second.byteOffset + second.byteLength
        && second.byteOffset < first.byteOffset + first.byteLength
      ) {
        throw new RangeError("coupled Newton workspace views must not overlap");
      }
    }
  }
}

function requireFiniteVector(value: Float64Array, label: string): void {
  for (let index = 0; index < value.length; index += 1) {
    if (!Number.isFinite(value[index]!)) {
      throw new RangeError(`${label} must contain only finite values`);
    }
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
