/**
 * Five-patch sidecar-owned Newton options. This deliberately does not extend
 * the shared DampedNewtonV1 API: exact columns are an implementation detail of
 * NoAvpdFivePatchLandTriSegV1 and must not alter older mechanics artifacts.
 */
export type FivePatchDampedNewtonOptionsV1 = {
  readonly unknownScales: readonly number[];
  readonly residualScales: readonly number[];
  readonly maxIterations: number;
  readonly residualTolerance: number;
  readonly derivativeRelativeStep: number;
  readonly lineSearchReduction: number;
  readonly minLineSearchStep: number;
  /**
   * Optional modified-Newton policy.  The default rebuilds the finite-difference
   * Jacobian at every iteration, preserving the original solver path.
   */
  readonly jacobianReuse?: {
    /** Number of accepted Newton updates that may reuse the same Jacobian. */
    readonly maxAcceptedSteps: number;
    /** Force a rebuild when the accepted residual ratio is worse than this. */
    readonly refreshWhenResidualRatioExceeds: number;
    /** Retry a failed stale-Jacobian step once with a freshly rebuilt Jacobian. */
    readonly retryWithFreshJacobianOnFailure: boolean;
  };
  /**
   * Optional exact raw-residual derivative for selected Jacobian columns.
   * Returning null delegates that column to the existing finite difference.
   * The callback must be pure and must not advance model state.
   */
  readonly analyticJacobianColumn?: (
    unknowns: readonly number[],
    column: number,
  ) => readonly number[] | null;
  readonly admissible?: (unknowns: readonly number[]) => boolean;
};

export type FivePatchDampedNewtonResultV1 = {
  readonly unknowns: readonly number[];
  readonly converged: boolean;
  readonly finite: boolean;
  readonly iterations: number;
  readonly residualEvaluations: number;
  readonly jacobianEvaluations: number;
  readonly jacobianReusedIterations: number;
  readonly freshJacobianRetries: number;
  readonly lineSearchBacktracks: number;
  readonly maxScaledResidual: number;
  /** Final scaled residual vector retained for fail-closed attribution. */
  readonly finalScaledResiduals: readonly number[];
  readonly maximumResidualIndex: number | null;
  readonly residualHistory: readonly number[];
  readonly failureReason: string | null;
};

/**
 * Small dense damped Newton solver for research sidecars.  It owns no model
 * state; residualAt must be pure, so failed iterations cannot advance memory.
 */
export function solveFivePatchDampedNewtonV1(
  initialUnknowns: readonly number[],
  residualAt: (unknowns: readonly number[]) => readonly number[] | null,
  options: FivePatchDampedNewtonOptionsV1,
): FivePatchDampedNewtonResultV1 {
  validateOptions(initialUnknowns, options);
  const n = initialUnknowns.length;
  let unknowns = [...initialUnknowns];
  let evaluations = 0;
  let jacobianEvaluations = 0;
  let jacobianReusedIterations = 0;
  let freshJacobianRetries = 0;
  let backtracks = 0;
  const history: number[] = [];
  const reuse = options.jacobianReuse ?? {
    maxAcceptedSteps: 0,
    refreshWhenResidualRatioExceeds: 1,
    retryWithFreshJacobianOnFailure: false,
  };
  let jacobian: number[] | null = null;
  let acceptedStepsSinceJacobian = 0;

  const evaluate = (candidate: readonly number[]): number[] | null => {
    if (options.admissible && !options.admissible(candidate)) return null;
    const raw = residualAt(candidate);
    evaluations += 1;
    if (raw == null || raw.length !== n || raw.some((value) => !Number.isFinite(value))) {
      return null;
    }
    return raw.map((value, index) => value / options.residualScales[index]!);
  };

  let residual = evaluate(unknowns);
  if (residual == null) {
    return result(false, false, 0, Number.POSITIVE_INFINITY, "initial-residual-invalid");
  }

  for (let iteration = 0; iteration <= options.maxIterations; iteration += 1) {
    const convergenceNorm = maxAbs(residual);
    history.push(convergenceNorm);
    if (convergenceNorm <= options.residualTolerance) {
      return result(true, true, iteration, convergenceNorm, null);
    }
    if (iteration === options.maxIterations) {
      return result(
        false,
        true,
        iteration,
        convergenceNorm,
        "maximum-iterations",
      );
    }

    const mustRebuild = jacobian == null
      || acceptedStepsSinceJacobian > reuse.maxAcceptedSteps;
    if (mustRebuild) {
      const rebuilt = buildJacobian(unknowns, residual);
      if (rebuilt.matrix == null) {
        return result(
          false,
          false,
          iteration,
          convergenceNorm,
          rebuilt.failureReason,
        );
      }
      jacobian = rebuilt.matrix;
      acceptedStepsSinceJacobian = 0;
    } else {
      jacobianReusedIterations += 1;
    }

    let retriedFresh = false;
    while (true) {
      let step: number[] | null = null;
      try {
        step = solveDense(jacobian, residual.map((value) => -value), n);
      } catch {
        step = null;
      }

      let acceptedResidual: number[] | null = null;
      let acceptedUnknowns: number[] | null = null;
      if (step != null) {
        for (
          let alpha = 1;
          alpha >= options.minLineSearchStep;
          alpha *= options.lineSearchReduction
        ) {
          const candidate = unknowns.map((value, index) => value + alpha * step![index]!);
          const candidateResidual = evaluate(candidate);
          if (
            candidateResidual != null &&
            maxAbs(candidateResidual) < convergenceNorm
          ) {
            acceptedUnknowns = candidate;
            acceptedResidual = candidateResidual;
            break;
          }
          backtracks += 1;
        }
      }

      if (acceptedUnknowns != null && acceptedResidual != null) {
        const residualRatio = maxAbs(acceptedResidual) / convergenceNorm;
        unknowns = acceptedUnknowns;
        residual = acceptedResidual;
        acceptedStepsSinceJacobian += 1;
        if (residualRatio > reuse.refreshWhenResidualRatioExceeds) {
          jacobian = null;
        }
        break;
      }

      const staleJacobian = acceptedStepsSinceJacobian > 0;
      if (
        !retriedFresh
        && staleJacobian
        && reuse.retryWithFreshJacobianOnFailure
      ) {
        const rebuilt = buildJacobian(unknowns, residual);
        if (rebuilt.matrix == null) {
          return result(
            false,
            false,
            iteration,
            convergenceNorm,
            rebuilt.failureReason,
          );
        }
        jacobian = rebuilt.matrix;
        acceptedStepsSinceJacobian = 0;
        freshJacobianRetries += 1;
        retriedFresh = true;
        continue;
      }
      return result(
        false,
        step != null,
        iteration,
        convergenceNorm,
        step == null ? "singular-jacobian" : "line-search-failed",
      );
    }
  }

  return result(false, false, options.maxIterations, maxAbs(residual), "unreachable");

  function result(
    converged: boolean,
    finite: boolean,
    iterations: number,
    maxScaledResidual: number,
    failureReason: string | null,
  ): FivePatchDampedNewtonResultV1 {
    const finalScaledResiduals = residual == null
      ? Object.freeze([] as number[])
      : Object.freeze([...residual]);
    const maximumResidualIndex = finalScaledResiduals.length === 0
      ? null
      : finalScaledResiduals.reduce(
          (best, value, index) =>
            Math.abs(value) > Math.abs(finalScaledResiduals[best]!)
              ? index
              : best,
          0,
        );
    return {
      unknowns,
      converged,
      finite,
      iterations,
      residualEvaluations: evaluations,
      jacobianEvaluations,
      jacobianReusedIterations,
      freshJacobianRetries,
      lineSearchBacktracks: backtracks,
      maxScaledResidual,
      finalScaledResiduals,
      maximumResidualIndex,
      residualHistory: history,
      failureReason,
    };
  }

  function buildJacobian(
    atUnknowns: readonly number[],
    atResidual: readonly number[],
  ): { readonly matrix: number[] | null; readonly failureReason: string } {
    jacobianEvaluations += 1;
    const matrix = new Array<number>(n * n).fill(0);
    // Ask for every analytic column before any finite-difference perturbation.
    // This lets callers reuse the already evaluated base constitutive state.
    const analyticColumns = Array.from(
      { length: n },
      (_unused, column) => options.analyticJacobianColumn?.(
        atUnknowns,
        column,
      ) ?? null,
    );
    for (let column = 0; column < n; column += 1) {
      const analyticColumn = analyticColumns[column];
      if (analyticColumn != null) {
        if (
          analyticColumn.length !== n ||
          analyticColumn.some((value) => !Number.isFinite(value))
        ) {
          return {
            matrix: null,
            failureReason: `analytic-derivative-${column}-invalid`,
          };
        }
        for (let row = 0; row < n; row += 1) {
          matrix[row * n + column] =
            analyticColumn[row]! / options.residualScales[row]!;
        }
        continue;
      }
      const h = options.derivativeRelativeStep
        * Math.max(Math.abs(atUnknowns[column]!), options.unknownScales[column]!);
      let perturbed = [...atUnknowns];
      perturbed[column] += h;
      let perturbedResidual = evaluate(perturbed);
      let signedH = h;
      if (perturbedResidual == null) {
        perturbed = [...atUnknowns];
        perturbed[column] -= h;
        perturbedResidual = evaluate(perturbed);
        signedH = -h;
      }
      if (perturbedResidual == null) {
        return { matrix: null, failureReason: `derivative-${column}-invalid` };
      }
      for (let row = 0; row < n; row += 1) {
        matrix[row * n + column] = (
          perturbedResidual[row]! - atResidual[row]!
        ) / signedH;
      }
    }
    return { matrix, failureReason: "" };
  }
}

function solveDense(matrix: readonly number[], rhs: readonly number[], n: number): number[] {
  const a = [...matrix];
  const b = [...rhs];
  for (let pivot = 0; pivot < n; pivot += 1) {
    let pivotRow = pivot;
    for (let row = pivot + 1; row < n; row += 1) {
      if (Math.abs(a[row * n + pivot]!) > Math.abs(a[pivotRow * n + pivot]!)) {
        pivotRow = row;
      }
    }
    const pivotValue = a[pivotRow * n + pivot]!;
    if (!Number.isFinite(pivotValue) || Math.abs(pivotValue) < 1e-14) {
      throw new Error("singular");
    }
    if (pivotRow !== pivot) {
      for (let column = pivot; column < n; column += 1) {
        const left = pivot * n + column;
        const right = pivotRow * n + column;
        [a[left], a[right]] = [a[right]!, a[left]!];
      }
      [b[pivot], b[pivotRow]] = [b[pivotRow]!, b[pivot]!];
    }
    for (let row = pivot + 1; row < n; row += 1) {
      const factor = a[row * n + pivot]! / a[pivot * n + pivot]!;
      for (let column = pivot; column < n; column += 1) {
        a[row * n + column] -= factor * a[pivot * n + column]!;
      }
      b[row] -= factor * b[pivot]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    let value = b[row]!;
    for (let column = row + 1; column < n; column += 1) {
      value -= a[row * n + column]! * x[column]!;
    }
    x[row] = value / a[row * n + row]!;
  }
  if (x.some((value) => !Number.isFinite(value))) throw new Error("nonfinite");
  return x;
}

function validateOptions(
  initialUnknowns: readonly number[],
  options: FivePatchDampedNewtonOptionsV1,
): void {
  const n = initialUnknowns.length;
  if (n === 0 || options.unknownScales.length !== n || options.residualScales.length !== n) {
    throw new Error("FivePatchDampedNewtonV1 dimensions must match and be nonzero");
  }
  if (initialUnknowns.some((value) => !Number.isFinite(value))) {
    throw new Error("initialUnknowns must be finite");
  }
  for (const [field, values] of [
    ["unknownScales", options.unknownScales],
    ["residualScales", options.residualScales],
  ] as const) {
    if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
      throw new Error(`${field} must be positive and finite`);
    }
  }
  if (!Number.isInteger(options.maxIterations) || options.maxIterations < 1) {
    throw new Error("maxIterations must be a positive integer");
  }
  if (!Number.isFinite(options.residualTolerance) || options.residualTolerance <= 0) {
    throw new Error("residualTolerance must be positive and finite");
  }
  if (!Number.isFinite(options.derivativeRelativeStep) || options.derivativeRelativeStep <= 0) {
    throw new Error("derivativeRelativeStep must be positive and finite");
  }
  if (!Number.isFinite(options.lineSearchReduction) || options.lineSearchReduction <= 0 || options.lineSearchReduction >= 1) {
    throw new Error("lineSearchReduction must be in (0, 1)");
  }
  if (!Number.isFinite(options.minLineSearchStep) || options.minLineSearchStep <= 0 || options.minLineSearchStep > 1) {
    throw new Error("minLineSearchStep must be in (0, 1]");
  }
  if (options.jacobianReuse != null) {
    const reuse = options.jacobianReuse;
    if (!Number.isInteger(reuse.maxAcceptedSteps) || reuse.maxAcceptedSteps < 0) {
      throw new Error("jacobianReuse.maxAcceptedSteps must be a nonnegative integer");
    }
    if (
      !Number.isFinite(reuse.refreshWhenResidualRatioExceeds)
      || reuse.refreshWhenResidualRatioExceeds <= 0
      || reuse.refreshWhenResidualRatioExceeds > 1
    ) {
      throw new Error("jacobianReuse.refreshWhenResidualRatioExceeds must be in (0, 1]");
    }
    if (typeof reuse.retryWithFreshJacobianOnFailure !== "boolean") {
      throw new Error("jacobianReuse.retryWithFreshJacobianOnFailure must be boolean");
    }
  }
}

function maxAbs(values: readonly number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}
