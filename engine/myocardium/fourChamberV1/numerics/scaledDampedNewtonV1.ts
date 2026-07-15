import {
  computeStrictAffineFractionToBoundaryV1,
  evaluateStrictAffineConstraintMarginsV1,
  normalizeStrictAffineConstraintsV1,
  strictlyInsideAffineConstraintsV1,
  type StrictAffineConstraintV1,
} from "@/engine/myocardium/fourChamberV1/numerics/strictAffineDomainV1";

/**
 * Small dense, transaction-safe nonlinear solver for the four-chamber model.
 *
 * The model callback owns the physical residual and its generalized Jacobian.
 * This module deliberately has no finite-difference fallback: every Newton and
 * line-search evaluation therefore re-enters the model's current active set.
 */

export const SCALED_DAMPED_NEWTON_V1_DEFAULTS = Object.freeze({
  maxIterations: 24,
  residualInfinityTolerance: 1e-8,
  updateInfinityTolerance: 1e-8,
  armijoCoefficient: 1e-4,
  lineSearchContraction: 0.5,
  maxLineSearchBacktracks: 24,
  minimumStepLength: 1e-12,
  fractionToBoundarySafety: 0.995,
  relativePivotTolerance: 64 * Number.EPSILON,
} as const);

export type ScaledDampedNewtonEvaluationContextV1 = {
  readonly iteration: number;
  readonly phase: "newton" | "line-search";
  readonly backtrack: number;
  readonly stepLength: number;
};

export type ScaledDampedNewtonModelEvaluationV1 =
  | {
    readonly status: "ok";
    /** Physical residual, before residual scaling. */
    readonly residual: ArrayLike<number>;
    /** Physical Jacobian d(residual_i)/d(unknown_j), row-major. */
    readonly jacobianRowMajor: ArrayLike<number>;
    readonly diagnostic?: unknown;
  }
  | {
    /** Recoverable domain rejection. A line-search trial will be shortened. */
    readonly status: "inadmissible";
    readonly reason: string;
    readonly diagnostic?: unknown;
  }
  | {
    /** Non-recoverable model evaluation failure. */
    readonly status: "failed";
    readonly reason: string;
    readonly diagnostic?: unknown;
  };

export type ScaledDampedNewtonEvaluatorV1 = (
  unknowns: ReadonlyArray<number>,
  context: ScaledDampedNewtonEvaluationContextV1,
) => ScaledDampedNewtonModelEvaluationV1;

export type ScaledDampedNewtonOptionsV1 = {
  readonly maxIterations?: number;
  readonly residualInfinityTolerance?: number;
  readonly updateInfinityTolerance?: number;
  readonly armijoCoefficient?: number;
  readonly lineSearchContraction?: number;
  readonly maxLineSearchBacktracks?: number;
  readonly minimumStepLength?: number;
  readonly fractionToBoundarySafety?: number;
  readonly relativePivotTolerance?: number;
};

export type ScaledDampedNewtonInputV1 = {
  /** This array is copied and is never mutated. */
  readonly initialUnknowns: ReadonlyArray<number>;
  /** Fixed physical scale for every unknown. */
  readonly unknownScales: ReadonlyArray<number>;
  /** Fixed physical scale for every residual equation. */
  readonly residualScales: ReadonlyArray<number>;
  /** null means unbounded; finite lower bounds are strict. */
  readonly strictLowerBounds?: ReadonlyArray<number | null>;
  /** Additional physical-space half-spaces, each coefficients dot x > lowerBound. */
  readonly strictAffineConstraints?: ReadonlyArray<StrictAffineConstraintV1>;
  readonly evaluate: ScaledDampedNewtonEvaluatorV1;
  readonly options?: ScaledDampedNewtonOptionsV1;
};

export type ScaledDenseLuDiagnosticsV1 = {
  readonly dimension: number;
  readonly matrixInfinityNorm: number;
  readonly maximumAbsoluteOriginalEntry: number;
  readonly maximumAbsoluteFactorEntry: number;
  readonly minimumAbsolutePivot: number;
  readonly maximumAbsolutePivot: number;
  readonly relativeMinimumPivot: number;
  readonly pivotGrowthFactor: number;
  readonly rowSwapCount: number;
  readonly pivotThreshold: number;
};

export type ScaledDenseLuFailureReasonV1 =
  | "invalid-dimension"
  | "dimension-mismatch"
  | "invalid-relative-pivot-tolerance"
  | "non-finite-input"
  | "singular-or-near-singular"
  | "non-finite-factorization";

export type ScaledDenseLuResultV1 =
  | {
    readonly success: true;
    readonly solution: ReadonlyArray<number>;
    readonly diagnostics: ScaledDenseLuDiagnosticsV1;
  }
  | {
    readonly success: false;
    readonly reason: ScaledDenseLuFailureReasonV1;
    readonly message: string;
    readonly diagnostics: ScaledDenseLuDiagnosticsV1 | null;
  };

export type FractionToBoundaryResultV1 =
  | {
    readonly admissible: true;
    readonly maximumStepLength: number;
    readonly limitingUnknownIndex: number | null;
  }
  | {
    readonly admissible: false;
    readonly maximumStepLength: 0;
    readonly limitingUnknownIndex: number;
    readonly reason: "current-state-not-strictly-interior" | "non-finite-boundary-step";
  };

export type ScaledDampedNewtonIterationOutcomeV1 =
  | "accepted"
  | "converged"
  | "scaled-linear-solve-failed"
  | "non-descent-direction"
  | "fraction-to-boundary-failed"
  | "line-search-failed";

export type ScaledDampedNewtonIterationDiagnosticsV1 = {
  /** One-based Newton solve number; zero is reserved for initial convergence. */
  readonly iteration: number;
  readonly residualInfinityNorm: number;
  readonly residualTwoNorm: number;
  readonly merit: number;
  readonly previousAcceptedUpdateInfinityNorm: number;
  readonly rawNewtonUpdateInfinityNorm: number | null;
  readonly fractionToBoundaryMaximumStep: number | null;
  readonly fractionToBoundaryLimitingUnknownIndex: number | null;
  readonly fractionToBoundaryLimitingAffineConstraintId: string | null;
  readonly acceptedStepLength: number | null;
  readonly acceptedUpdateInfinityNorm: number | null;
  readonly backtrackCount: number;
  readonly inadmissibleTrialCount: number;
  readonly nonFiniteTrialCount: number;
  readonly linearSolve: ScaledDenseLuDiagnosticsV1 | null;
  readonly outcome: ScaledDampedNewtonIterationOutcomeV1;
  readonly modelDiagnostic?: unknown;
  readonly acceptedTrialModelDiagnostic?: unknown;
};

export type ScaledDampedNewtonDiagnosticsV1 = {
  readonly newtonIterationCount: number;
  readonly acceptedStepCount: number;
  readonly modelEvaluationCount: number;
  readonly totalBacktrackCount: number;
  readonly finalResidualInfinityNorm: number | null;
  readonly finalUpdateInfinityNorm: number;
  readonly history: ReadonlyArray<ScaledDampedNewtonIterationDiagnosticsV1>;
};

export type ScaledDampedNewtonFailureReasonV1 =
  | "non-finite-initial-unknown"
  | "initial-state-outside-lower-bound"
  | "initial-state-outside-affine-constraint"
  | "model-evaluation-inadmissible"
  | "model-evaluation-failed"
  | "model-evaluation-threw"
  | "invalid-model-output"
  | "non-finite-model-output"
  | "scaled-linear-solve-failed"
  | "non-descent-direction"
  | "fraction-to-boundary-failed"
  | "line-search-failed"
  | "maximum-iterations";

export type ScaledDampedNewtonResultV1 =
  | {
    readonly converged: true;
    /** Committed solution. The caller's initial array remains untouched. */
    readonly unknowns: ReadonlyArray<number>;
    readonly diagnostics: ScaledDampedNewtonDiagnosticsV1;
  }
  | {
    readonly converged: false;
    readonly reason: ScaledDampedNewtonFailureReasonV1;
    readonly message: string;
    /** Transactional rollback value: always a copy of initialUnknowns. */
    readonly unknowns: ReadonlyArray<number>;
    /** Diagnostic only; must not be committed after failure. */
    readonly lastAcceptedUnknowns: ReadonlyArray<number>;
    readonly diagnostics: ScaledDampedNewtonDiagnosticsV1;
  };

export type ScaledJacobian2x2DiagnosticsV1 = {
  readonly determinant: number;
  readonly frobeniusNorm: number;
  readonly sigmaMaximum: number;
  readonly sigmaMinimum: number;
  readonly conditionNumber2: number;
  readonly relativeSigmaMinimum: number;
  readonly relativeSingularValueTolerance: number;
  readonly numericallySingular: boolean;
};

type ResolvedOptions = Required<ScaledDampedNewtonOptionsV1>;

type NormalizedEvaluation = {
  readonly residual: Float64Array;
  readonly jacobianRowMajor: Float64Array;
  readonly diagnostic?: unknown;
};

type EvaluationAttempt =
  | { readonly status: "ok"; readonly evaluation: NormalizedEvaluation }
  | {
    readonly status: "inadmissible" | "failed" | "threw" | "invalid-output" | "non-finite-output";
    readonly message: string;
    readonly diagnostic?: unknown;
  };

/**
 * Solve a nonlinear system in physical variables using a fixed, dimensionless
 * Newton system J_s d_s = -r_s. Failure is transactional: unknowns rolls back
 * to the supplied initial values and only lastAcceptedUnknowns exposes progress.
 */
export function solveScaledDampedNewtonV1(
  input: ScaledDampedNewtonInputV1,
): ScaledDampedNewtonResultV1 {
  const dimension = input.initialUnknowns.length;
  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new Error("initialUnknowns must contain at least one unknown");
  }
  validateScaleVector(input.unknownScales, dimension, "unknownScales");
  validateScaleVector(input.residualScales, dimension, "residualScales");
  if (typeof input.evaluate !== "function") throw new Error("evaluate must be a function");
  const options = resolveOptions(input.options);
  const initialUnknowns = freezeNumbers(input.initialUnknowns);
  const unknownScales = Float64Array.from(input.unknownScales);
  const residualScales = Float64Array.from(input.residualScales);
  const lowerBounds = normalizeLowerBounds(input.strictLowerBounds, dimension);
  const affineConstraints = normalizeStrictAffineConstraintsV1(
    input.strictAffineConstraints,
    dimension,
  );
  const history: ScaledDampedNewtonIterationDiagnosticsV1[] = [];
  let modelEvaluationCount = 0;
  let totalBacktrackCount = 0;
  let acceptedStepCount = 0;
  let newtonIterationCount = 0;
  let lastResidualInfinityNorm: number | null = null;
  let lastAcceptedUpdateInfinityNorm = 0;

  const makeDiagnostics = (): ScaledDampedNewtonDiagnosticsV1 => Object.freeze({
    newtonIterationCount,
    acceptedStepCount,
    modelEvaluationCount,
    totalBacktrackCount,
    finalResidualInfinityNorm: lastResidualInfinityNorm,
    finalUpdateInfinityNorm: lastAcceptedUpdateInfinityNorm,
    history: Object.freeze(history.slice()),
  });
  const fail = (
    reason: ScaledDampedNewtonFailureReasonV1,
    message: string,
    lastAccepted: ReadonlyArray<number>,
  ): ScaledDampedNewtonResultV1 => Object.freeze({
    converged: false as const,
    reason,
    message,
    unknowns: initialUnknowns,
    lastAcceptedUnknowns: freezeNumbers(lastAccepted),
    diagnostics: makeDiagnostics(),
  });

  for (let index = 0; index < dimension; index += 1) {
    if (!Number.isFinite(initialUnknowns[index])) {
      return fail("non-finite-initial-unknown", `initialUnknowns[${index}] must be finite`, initialUnknowns);
    }
    const lowerBound = lowerBounds[index];
    if (lowerBound !== null && !(initialUnknowns[index] > lowerBound)) {
      return fail(
        "initial-state-outside-lower-bound",
        `initialUnknowns[${index}] must be strictly greater than its lower bound`,
        initialUnknowns,
      );
    }
  }
  const initialAffineMargins = evaluateStrictAffineConstraintMarginsV1(
    initialUnknowns,
    affineConstraints,
  );
  const violatedInitialAffineConstraint = initialAffineMargins.find(
    ({ margin }) => !(margin > 0),
  );
  if (violatedInitialAffineConstraint !== undefined) {
    return fail(
      "initial-state-outside-affine-constraint",
      `initialUnknowns must be strictly inside affine constraint ${violatedInitialAffineConstraint.constraintId}`,
      initialUnknowns,
    );
  }

  let current = initialUnknowns.slice();

  for (let iteration = 0; iteration <= options.maxIterations; iteration += 1) {
    const currentAttempt = callEvaluator(
      input.evaluate,
      current,
      { iteration, phase: "newton", backtrack: 0, stepLength: 0 },
      dimension,
    );
    modelEvaluationCount += 1;
    if (currentAttempt.status !== "ok") {
      return fail(
        mapEvaluationFailure(currentAttempt.status),
        `Newton evaluation ${iteration} failed: ${currentAttempt.message}`,
        current,
      );
    }

    const physicalResidual = currentAttempt.evaluation.residual;
    const physicalJacobian = currentAttempt.evaluation.jacobianRowMajor;
    const scaledResidual = scaleResidualVectorV1(physicalResidual, residualScales);
    const residualInfinityNorm = infinityNorm(scaledResidual);
    const residualTwoNorm = twoNorm(scaledResidual);
    const merit = 0.5 * residualTwoNorm * residualTwoNorm;
    lastResidualInfinityNorm = residualInfinityNorm;

    // After at least one accepted update, the accepted-step norm and the
    // residual at the resulting state form the usual two-part convergence
    // test. Iteration zero is excluded because no update has yet been tested.
    if (
      iteration > 0
      && residualInfinityNorm <= options.residualInfinityTolerance
      && lastAcceptedUpdateInfinityNorm <= options.updateInfinityTolerance
    ) {
      return Object.freeze({
        converged: true as const,
        unknowns: freezeNumbers(current),
        diagnostics: makeDiagnostics(),
      });
    }

    const updateLimitReached = iteration === options.maxIterations;
    if (!updateLimitReached) newtonIterationCount += 1;

    const scaledJacobian = scaleDenseJacobianRowMajorV1(
      physicalJacobian,
      unknownScales,
      residualScales,
    );
    const negativeScaledResidual = Float64Array.from(scaledResidual, (value) => -value);
    const linearSolve = solveScaledDensePartialPivotLuV1(
      scaledJacobian,
      negativeScaledResidual,
      options.relativePivotTolerance,
    );
    if (linearSolve.success === false) {
      history.push(freezeIterationDiagnostic({
        iteration: iteration + 1,
        residualInfinityNorm,
        residualTwoNorm,
        merit,
        previousAcceptedUpdateInfinityNorm: lastAcceptedUpdateInfinityNorm,
        rawNewtonUpdateInfinityNorm: null,
        fractionToBoundaryMaximumStep: null,
        fractionToBoundaryLimitingUnknownIndex: null,
        fractionToBoundaryLimitingAffineConstraintId: null,
        acceptedStepLength: null,
        acceptedUpdateInfinityNorm: null,
        backtrackCount: 0,
        inadmissibleTrialCount: 0,
        nonFiniteTrialCount: 0,
        linearSolve: linearSolve.diagnostics,
        outcome: "scaled-linear-solve-failed",
        modelDiagnostic: currentAttempt.evaluation.diagnostic,
      }));
      return fail(
        "scaled-linear-solve-failed",
        `Scaled dense LU failed (${linearSolve.reason}): ${linearSolve.message}`,
        current,
      );
    }

    const scaledDirection = linearSolve.solution;
    const rawUpdateInfinityNorm = infinityNorm(scaledDirection);
    const physicalDirection = Float64Array.from(
      scaledDirection,
      (value, index) => value * unknownScales[index],
    );
    if (!allFinite(physicalDirection)) {
      return fail("scaled-linear-solve-failed", "Newton direction became non-finite", current);
    }

    if (
      residualInfinityNorm <= options.residualInfinityTolerance
      && rawUpdateInfinityNorm <= options.updateInfinityTolerance
    ) {
      lastAcceptedUpdateInfinityNorm = rawUpdateInfinityNorm;
      history.push(freezeIterationDiagnostic({
        iteration: iteration + 1,
        residualInfinityNorm,
        residualTwoNorm,
        merit,
        previousAcceptedUpdateInfinityNorm: iteration === 0
          ? 0
          : history[history.length - 1]?.acceptedUpdateInfinityNorm ?? 0,
        rawNewtonUpdateInfinityNorm: rawUpdateInfinityNorm,
        fractionToBoundaryMaximumStep: 1,
        fractionToBoundaryLimitingUnknownIndex: null,
        fractionToBoundaryLimitingAffineConstraintId: null,
        acceptedStepLength: 0,
        acceptedUpdateInfinityNorm: rawUpdateInfinityNorm,
        backtrackCount: 0,
        inadmissibleTrialCount: 0,
        nonFiniteTrialCount: 0,
        linearSolve: linearSolve.diagnostics,
        outcome: "converged",
        modelDiagnostic: currentAttempt.evaluation.diagnostic,
      }));
      return Object.freeze({
        converged: true as const,
        unknowns: freezeNumbers(current),
        diagnostics: makeDiagnostics(),
      });
    }

    if (updateLimitReached) {
      return fail(
        "maximum-iterations",
        `Newton did not satisfy residual and update tolerances in ${options.maxIterations} updates`,
        current,
      );
    }

    const jacobianTimesDirection = multiplyDenseMatrixVector(scaledJacobian, scaledDirection, dimension);
    const directionalDerivative = dot(scaledResidual, jacobianTimesDirection);
    if (!Number.isFinite(directionalDerivative) || directionalDerivative >= 0) {
      history.push(freezeIterationDiagnostic({
        iteration: iteration + 1,
        residualInfinityNorm,
        residualTwoNorm,
        merit,
        previousAcceptedUpdateInfinityNorm: lastAcceptedUpdateInfinityNorm,
        rawNewtonUpdateInfinityNorm: rawUpdateInfinityNorm,
        fractionToBoundaryMaximumStep: null,
        fractionToBoundaryLimitingUnknownIndex: null,
        fractionToBoundaryLimitingAffineConstraintId: null,
        acceptedStepLength: null,
        acceptedUpdateInfinityNorm: null,
        backtrackCount: 0,
        inadmissibleTrialCount: 0,
        nonFiniteTrialCount: 0,
        linearSolve: linearSolve.diagnostics,
        outcome: "non-descent-direction",
        modelDiagnostic: currentAttempt.evaluation.diagnostic,
      }));
      return fail(
        "non-descent-direction",
        "Scaled Newton direction is not a descent direction for the residual merit",
        current,
      );
    }

    const lowerFractionToBoundary = computeFractionToBoundaryStepV1(
      current,
      physicalDirection,
      lowerBounds,
      options.fractionToBoundarySafety,
    );
    const affineFractionToBoundary = computeStrictAffineFractionToBoundaryV1(
      current,
      physicalDirection,
      affineConstraints,
      options.fractionToBoundarySafety,
    );
    const fractionToBoundary = combineFractionToBoundary(
      lowerFractionToBoundary,
      affineFractionToBoundary,
    );
    if (!fractionToBoundary.admissible || fractionToBoundary.maximumStepLength < options.minimumStepLength) {
      history.push(freezeIterationDiagnostic({
        iteration: iteration + 1,
        residualInfinityNorm,
        residualTwoNorm,
        merit,
        previousAcceptedUpdateInfinityNorm: lastAcceptedUpdateInfinityNorm,
        rawNewtonUpdateInfinityNorm: rawUpdateInfinityNorm,
        fractionToBoundaryMaximumStep: fractionToBoundary.maximumStepLength,
        fractionToBoundaryLimitingUnknownIndex: fractionToBoundary.limitingUnknownIndex,
        fractionToBoundaryLimitingAffineConstraintId:
          fractionToBoundary.limitingAffineConstraintId,
        acceptedStepLength: null,
        acceptedUpdateInfinityNorm: null,
        backtrackCount: 0,
        inadmissibleTrialCount: 0,
        nonFiniteTrialCount: 0,
        linearSolve: linearSolve.diagnostics,
        outcome: "fraction-to-boundary-failed",
        modelDiagnostic: currentAttempt.evaluation.diagnostic,
      }));
      return fail(
        "fraction-to-boundary-failed",
        "No numerically meaningful strictly interior Newton step is available",
        current,
      );
    }

    let stepLength = Math.min(1, fractionToBoundary.maximumStepLength);
    let acceptedTrial: number[] | null = null;
    let acceptedTrialDiagnostic: unknown;
    let acceptedBacktrackCount = 0;
    let inadmissibleTrialCount = 0;
    let nonFiniteTrialCount = 0;
    let lineSearchTrialCount = 0;
    let lastTrialMessage = "no trial was evaluated";

    for (let backtrack = 0; backtrack <= options.maxLineSearchBacktracks; backtrack += 1) {
      if (stepLength < options.minimumStepLength) break;
      lineSearchTrialCount += 1;
      const trial = current.map((value, index) => value + stepLength * physicalDirection[index]);
      if (
        !strictlyInsideBounds(trial, lowerBounds)
        || !strictlyInsideAffineConstraintsV1(trial, affineConstraints)
      ) {
        inadmissibleTrialCount += 1;
        lastTrialMessage = "trial was not strictly inside the declared domain";
      } else {
        const trialAttempt = callEvaluator(
          input.evaluate,
          trial,
          { iteration: iteration + 1, phase: "line-search", backtrack, stepLength },
          dimension,
        );
        modelEvaluationCount += 1;
        if (trialAttempt.status === "ok") {
          const trialScaledResidual = scaleResidualVectorV1(
            trialAttempt.evaluation.residual,
            residualScales,
          );
          const trialTwoNorm = twoNorm(trialScaledResidual);
          const trialMerit = 0.5 * trialTwoNorm * trialTwoNorm;
          const armijoBound = merit + options.armijoCoefficient * stepLength * directionalDerivative;
          if (Number.isFinite(trialMerit) && trialMerit <= armijoBound) {
            acceptedTrial = trial;
            acceptedTrialDiagnostic = trialAttempt.evaluation.diagnostic;
            acceptedBacktrackCount = backtrack;
            break;
          }
          lastTrialMessage = "trial did not satisfy Armijo sufficient decrease";
        } else if (
          trialAttempt.status === "failed"
          || trialAttempt.status === "threw"
          || trialAttempt.status === "invalid-output"
        ) {
          return fail(
            mapEvaluationFailure(trialAttempt.status),
            `Line-search evaluation failed: ${trialAttempt.message}`,
            current,
          );
        }
        if (trialAttempt.status === "inadmissible") {
          inadmissibleTrialCount += 1;
          lastTrialMessage = trialAttempt.message;
        } else if (trialAttempt.status === "non-finite-output") {
          nonFiniteTrialCount += 1;
          lastTrialMessage = trialAttempt.message;
        }
      }

      if (backtrack < options.maxLineSearchBacktracks) {
        stepLength *= options.lineSearchContraction;
      }
    }

    totalBacktrackCount += acceptedTrial === null
      ? Math.max(0, lineSearchTrialCount - 1)
      : acceptedBacktrackCount;

    if (acceptedTrial === null) {
      const attemptedBacktracks = Math.max(0, lineSearchTrialCount - 1);
      history.push(freezeIterationDiagnostic({
        iteration: iteration + 1,
        residualInfinityNorm,
        residualTwoNorm,
        merit,
        previousAcceptedUpdateInfinityNorm: lastAcceptedUpdateInfinityNorm,
        rawNewtonUpdateInfinityNorm: rawUpdateInfinityNorm,
        fractionToBoundaryMaximumStep: fractionToBoundary.maximumStepLength,
        fractionToBoundaryLimitingUnknownIndex: fractionToBoundary.limitingUnknownIndex,
        fractionToBoundaryLimitingAffineConstraintId:
          fractionToBoundary.limitingAffineConstraintId,
        acceptedStepLength: null,
        acceptedUpdateInfinityNorm: null,
        backtrackCount: attemptedBacktracks,
        inadmissibleTrialCount,
        nonFiniteTrialCount,
        linearSolve: linearSolve.diagnostics,
        outcome: "line-search-failed",
        modelDiagnostic: currentAttempt.evaluation.diagnostic,
      }));
      return fail(
        "line-search-failed",
        `Armijo line search failed after ${lineSearchTrialCount} trials `
          + `(${attemptedBacktracks} backtracks): ${lastTrialMessage}`,
        current,
      );
    }

    lastAcceptedUpdateInfinityNorm = stepLength * rawUpdateInfinityNorm;
    acceptedStepCount += 1;
    history.push(freezeIterationDiagnostic({
      iteration: iteration + 1,
      residualInfinityNorm,
      residualTwoNorm,
      merit,
      previousAcceptedUpdateInfinityNorm: iteration === 0 ? 0 : history[history.length - 1]?.acceptedUpdateInfinityNorm ?? 0,
      rawNewtonUpdateInfinityNorm: rawUpdateInfinityNorm,
      fractionToBoundaryMaximumStep: fractionToBoundary.maximumStepLength,
      fractionToBoundaryLimitingUnknownIndex: fractionToBoundary.limitingUnknownIndex,
      fractionToBoundaryLimitingAffineConstraintId:
        fractionToBoundary.limitingAffineConstraintId,
      acceptedStepLength: stepLength,
      acceptedUpdateInfinityNorm: lastAcceptedUpdateInfinityNorm,
      backtrackCount: acceptedBacktrackCount,
      inadmissibleTrialCount,
      nonFiniteTrialCount,
      linearSolve: linearSolve.diagnostics,
      outcome: "accepted",
      modelDiagnostic: currentAttempt.evaluation.diagnostic,
      acceptedTrialModelDiagnostic: acceptedTrialDiagnostic,
    }));
    current = acceptedTrial;
  }

  return fail("maximum-iterations", "Newton iteration limit reached", current);
}

/** Scale a physical residual with fixed row scales. */
export function scaleResidualVectorV1(
  residual: ArrayLike<number>,
  residualScales: ArrayLike<number>,
): Float64Array {
  if (residual.length !== residualScales.length) {
    throw new Error("residual and residualScales must have equal length");
  }
  const scaled = new Float64Array(residual.length);
  for (let row = 0; row < residual.length; row += 1) {
    const value = residual[row];
    const scale = residualScales[row];
    if (!Number.isFinite(value)) throw new Error(`residual[${row}] must be finite`);
    if (!Number.isFinite(scale) || scale <= 0) throw new Error(`residualScales[${row}] must be positive and finite`);
    scaled[row] = value / scale;
  }
  return scaled;
}

/** Construct diag(1/rScale) J diag(xScale), row-major. */
export function scaleDenseJacobianRowMajorV1(
  jacobianRowMajor: ArrayLike<number>,
  unknownScales: ArrayLike<number>,
  residualScales: ArrayLike<number>,
): Float64Array {
  const dimension = unknownScales.length;
  if (residualScales.length !== dimension || jacobianRowMajor.length !== dimension * dimension) {
    throw new Error("Jacobian and scale dimensions do not match");
  }
  const scaled = new Float64Array(jacobianRowMajor.length);
  for (let row = 0; row < dimension; row += 1) {
    const residualScale = residualScales[row];
    if (!Number.isFinite(residualScale) || residualScale <= 0) {
      throw new Error(`residualScales[${row}] must be positive and finite`);
    }
    for (let column = 0; column < dimension; column += 1) {
      const unknownScale = unknownScales[column];
      const entry = jacobianRowMajor[row * dimension + column];
      if (!Number.isFinite(unknownScale) || unknownScale <= 0) {
        throw new Error(`unknownScales[${column}] must be positive and finite`);
      }
      if (!Number.isFinite(entry)) throw new Error(`jacobianRowMajor[${row * dimension + column}] must be finite`);
      const scaledEntry = entry * unknownScale / residualScale;
      if (!Number.isFinite(scaledEntry)) throw new Error("scaled Jacobian entry became non-finite");
      scaled[row * dimension + column] = scaledEntry;
    }
  }
  return scaled;
}

/**
 * Dense partial-pivot LU solve for an already dimensionless/scaled system.
 * Both inputs are copied. The pivot gate is relative to the matrix infinity norm.
 */
export function solveScaledDensePartialPivotLuV1(
  matrixRowMajor: ArrayLike<number>,
  rightHandSide: ArrayLike<number>,
  relativePivotTolerance = SCALED_DAMPED_NEWTON_V1_DEFAULTS.relativePivotTolerance,
): ScaledDenseLuResultV1 {
  const dimension = rightHandSide.length;
  if (!Number.isInteger(dimension) || dimension <= 0) {
    return luFailure("invalid-dimension", "rightHandSide must contain at least one entry", null);
  }
  if (matrixRowMajor.length !== dimension * dimension) {
    return luFailure("dimension-mismatch", "matrix must contain dimension squared entries", null);
  }
  if (!Number.isFinite(relativePivotTolerance) || relativePivotTolerance <= 0) {
    return luFailure("invalid-relative-pivot-tolerance", "relativePivotTolerance must be positive and finite", null);
  }
  if (!allFinite(matrixRowMajor) || !allFinite(rightHandSide)) {
    return luFailure("non-finite-input", "matrix and rightHandSide must be finite", null);
  }

  const lu = Float64Array.from(matrixRowMajor);
  const transformedRightHandSide = Float64Array.from(rightHandSide);
  let matrixInfinityNorm = 0;
  let maximumAbsoluteOriginalEntry = 0;
  for (let row = 0; row < dimension; row += 1) {
    let rowSum = 0;
    for (let column = 0; column < dimension; column += 1) {
      const absolute = Math.abs(lu[row * dimension + column]);
      rowSum += absolute;
      maximumAbsoluteOriginalEntry = Math.max(maximumAbsoluteOriginalEntry, absolute);
    }
    matrixInfinityNorm = Math.max(matrixInfinityNorm, rowSum);
  }
  const pivotThreshold = relativePivotTolerance * matrixInfinityNorm;
  let maximumAbsoluteFactorEntry = maximumAbsoluteOriginalEntry;
  let minimumAbsolutePivot = Number.POSITIVE_INFINITY;
  let maximumAbsolutePivot = 0;
  let rowSwapCount = 0;

  const diagnostics = (): ScaledDenseLuDiagnosticsV1 => {
    const finiteMinimumPivot = Number.isFinite(minimumAbsolutePivot) ? minimumAbsolutePivot : 0;
    return Object.freeze({
      dimension,
      matrixInfinityNorm,
      maximumAbsoluteOriginalEntry,
      maximumAbsoluteFactorEntry,
      minimumAbsolutePivot: finiteMinimumPivot,
      maximumAbsolutePivot,
      relativeMinimumPivot: matrixInfinityNorm > 0 ? finiteMinimumPivot / matrixInfinityNorm : 0,
      pivotGrowthFactor: maximumAbsoluteOriginalEntry > 0
        ? maximumAbsoluteFactorEntry / maximumAbsoluteOriginalEntry
        : Number.POSITIVE_INFINITY,
      rowSwapCount,
      pivotThreshold,
    });
  };

  if (matrixInfinityNorm === 0) {
    return luFailure("singular-or-near-singular", "scaled matrix is identically zero", diagnostics());
  }

  for (let column = 0; column < dimension; column += 1) {
    let pivotRow = column;
    let pivotAbsolute = Math.abs(lu[column * dimension + column]);
    for (let row = column + 1; row < dimension; row += 1) {
      const candidate = Math.abs(lu[row * dimension + column]);
      if (candidate > pivotAbsolute) {
        pivotAbsolute = candidate;
        pivotRow = row;
      }
    }
    if (!Number.isFinite(pivotAbsolute)) {
      return luFailure("non-finite-factorization", "pivot became non-finite", diagnostics());
    }
    if (pivotAbsolute <= pivotThreshold) {
      minimumAbsolutePivot = Math.min(minimumAbsolutePivot, pivotAbsolute);
      return luFailure(
        "singular-or-near-singular",
        `scaled pivot ${column} is at or below the relative threshold`,
        diagnostics(),
      );
    }
    if (pivotRow !== column) {
      for (let entryColumn = 0; entryColumn < dimension; entryColumn += 1) {
        const firstIndex = column * dimension + entryColumn;
        const secondIndex = pivotRow * dimension + entryColumn;
        const temporary = lu[firstIndex];
        lu[firstIndex] = lu[secondIndex];
        lu[secondIndex] = temporary;
      }
      const rightHandSideTemporary = transformedRightHandSide[column];
      transformedRightHandSide[column] = transformedRightHandSide[pivotRow];
      transformedRightHandSide[pivotRow] = rightHandSideTemporary;
      rowSwapCount += 1;
    }

    const pivot = lu[column * dimension + column];
    const absolutePivot = Math.abs(pivot);
    minimumAbsolutePivot = Math.min(minimumAbsolutePivot, absolutePivot);
    maximumAbsolutePivot = Math.max(maximumAbsolutePivot, absolutePivot);
    for (let row = column + 1; row < dimension; row += 1) {
      const rowOffset = row * dimension;
      const factor = lu[rowOffset + column] / pivot;
      if (!Number.isFinite(factor)) {
        return luFailure("non-finite-factorization", "elimination factor became non-finite", diagnostics());
      }
      lu[rowOffset + column] = factor;
      transformedRightHandSide[row] -= factor * transformedRightHandSide[column];
      for (let entryColumn = column + 1; entryColumn < dimension; entryColumn += 1) {
        const index = rowOffset + entryColumn;
        lu[index] -= factor * lu[column * dimension + entryColumn];
        maximumAbsoluteFactorEntry = Math.max(maximumAbsoluteFactorEntry, Math.abs(lu[index]));
      }
      if (!Number.isFinite(transformedRightHandSide[row])) {
        return luFailure("non-finite-factorization", "transformed right-hand side became non-finite", diagnostics());
      }
    }
  }

  const solution = new Float64Array(dimension);
  for (let row = dimension - 1; row >= 0; row -= 1) {
    let value = transformedRightHandSide[row];
    for (let column = row + 1; column < dimension; column += 1) {
      value -= lu[row * dimension + column] * solution[column];
    }
    value /= lu[row * dimension + row];
    if (!Number.isFinite(value)) {
      return luFailure("non-finite-factorization", "back substitution became non-finite", diagnostics());
    }
    solution[row] = value;
  }
  return Object.freeze({
    success: true as const,
    solution: freezeNumbers(solution),
    diagnostics: diagnostics(),
  });
}

type CombinedFractionToBoundaryV1 = Readonly<{
  admissible: boolean;
  maximumStepLength: number;
  limitingUnknownIndex: number | null;
  limitingAffineConstraintId: string | null;
}>;

function combineFractionToBoundary(
  lower: FractionToBoundaryResultV1,
  affine: ReturnType<typeof computeStrictAffineFractionToBoundaryV1>,
): CombinedFractionToBoundaryV1 {
  if (!lower.admissible) {
    return Object.freeze({
      admissible: false,
      maximumStepLength: 0,
      limitingUnknownIndex: lower.limitingUnknownIndex,
      limitingAffineConstraintId: null,
    });
  }
  if (!affine.admissible) {
    return Object.freeze({
      admissible: false,
      maximumStepLength: 0,
      limitingUnknownIndex: null,
      limitingAffineConstraintId: affine.limitingConstraintId,
    });
  }
  if (affine.maximumStepLength < lower.maximumStepLength) {
    return Object.freeze({
      admissible: true,
      maximumStepLength: affine.maximumStepLength,
      limitingUnknownIndex: null,
      limitingAffineConstraintId: affine.limitingConstraintId,
    });
  }
  return Object.freeze({
    admissible: true,
    maximumStepLength: lower.maximumStepLength,
    limitingUnknownIndex: lower.limitingUnknownIndex,
    limitingAffineConstraintId: null,
  });
}

/** Compute a strict-lower-bound-safe maximum step in physical variables. */
export function computeFractionToBoundaryStepV1(
  current: ArrayLike<number>,
  direction: ArrayLike<number>,
  strictLowerBounds: ReadonlyArray<number | null>,
  safety: number = SCALED_DAMPED_NEWTON_V1_DEFAULTS.fractionToBoundarySafety,
): FractionToBoundaryResultV1 {
  if (current.length !== direction.length || current.length !== strictLowerBounds.length) {
    throw new Error("current, direction, and strictLowerBounds must have equal length");
  }
  if (!Number.isFinite(safety) || safety <= 0 || safety >= 1) {
    throw new Error("fraction-to-boundary safety must lie strictly between zero and one");
  }
  let maximumStepLength = 1;
  let limitingUnknownIndex: number | null = null;
  for (let index = 0; index < current.length; index += 1) {
    const value = current[index];
    const delta = direction[index];
    const lowerBound = strictLowerBounds[index];
    if (!Number.isFinite(value) || !Number.isFinite(delta)) {
      return Object.freeze({
        admissible: false as const,
        maximumStepLength: 0 as const,
        limitingUnknownIndex: index,
        reason: "non-finite-boundary-step" as const,
      });
    }
    if (lowerBound === null) continue;
    if (!Number.isFinite(lowerBound)) throw new Error(`strictLowerBounds[${index}] must be finite or null`);
    const distance = value - lowerBound;
    if (!(distance > 0)) {
      return Object.freeze({
        admissible: false as const,
        maximumStepLength: 0 as const,
        limitingUnknownIndex: index,
        reason: "current-state-not-strictly-interior" as const,
      });
    }
    if (delta < 0) {
      const candidate = safety * distance / -delta;
      if (!Number.isFinite(candidate) || candidate <= 0) {
        return Object.freeze({
          admissible: false as const,
          maximumStepLength: 0 as const,
          limitingUnknownIndex: index,
          reason: "non-finite-boundary-step" as const,
        });
      }
      if (candidate < maximumStepLength) {
        maximumStepLength = candidate;
        limitingUnknownIndex = index;
      }
    }
  }
  return Object.freeze({
    admissible: true as const,
    maximumStepLength,
    limitingUnknownIndex,
  });
}

/**
 * Exact singular values and 2-norm condition diagnostic for a 2x2 scaled
 * Jacobian. Internal normalization avoids overflow in the quadratic formula.
 */
export function diagnoseScaledJacobian2x2V1(
  scaledJacobianRowMajor: ArrayLike<number>,
  relativeSingularValueTolerance = 64 * Number.EPSILON,
): ScaledJacobian2x2DiagnosticsV1 {
  if (scaledJacobianRowMajor.length !== 4) throw new Error("2x2 Jacobian must contain four entries");
  if (!allFinite(scaledJacobianRowMajor)) throw new Error("2x2 scaled Jacobian must be finite");
  if (!Number.isFinite(relativeSingularValueTolerance) || relativeSingularValueTolerance <= 0) {
    throw new Error("relativeSingularValueTolerance must be positive and finite");
  }
  const a = scaledJacobianRowMajor[0];
  const b = scaledJacobianRowMajor[1];
  const c = scaledJacobianRowMajor[2];
  const d = scaledJacobianRowMajor[3];
  const maximumAbsoluteEntry = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
  if (maximumAbsoluteEntry === 0) {
    return Object.freeze({
      determinant: 0,
      frobeniusNorm: 0,
      sigmaMaximum: 0,
      sigmaMinimum: 0,
      conditionNumber2: Number.POSITIVE_INFINITY,
      relativeSigmaMinimum: 0,
      relativeSingularValueTolerance,
      numericallySingular: true,
    });
  }
  const an = a / maximumAbsoluteEntry;
  const bn = b / maximumAbsoluteEntry;
  const cn = c / maximumAbsoluteEntry;
  const dn = d / maximumAbsoluteEntry;
  const sumSquares = an * an + bn * bn + cn * cn + dn * dn;
  const normalizedDeterminant = an * dn - bn * cn;
  const discriminant = Math.sqrt(Math.max(0, sumSquares * sumSquares - 4 * normalizedDeterminant * normalizedDeterminant));
  const sigmaMaximumNormalized = Math.sqrt(0.5 * (sumSquares + discriminant));
  const sigmaMinimumNormalized = sigmaMaximumNormalized > 0
    ? Math.abs(normalizedDeterminant) / sigmaMaximumNormalized
    : 0;
  const sigmaMaximum = maximumAbsoluteEntry * sigmaMaximumNormalized;
  const sigmaMinimum = maximumAbsoluteEntry * sigmaMinimumNormalized;
  const relativeSigmaMinimum = sigmaMaximum > 0 ? sigmaMinimum / sigmaMaximum : 0;
  return Object.freeze({
    determinant: a * d - b * c,
    frobeniusNorm: maximumAbsoluteEntry * Math.sqrt(sumSquares),
    sigmaMaximum,
    sigmaMinimum,
    conditionNumber2: sigmaMinimum > 0 ? sigmaMaximum / sigmaMinimum : Number.POSITIVE_INFINITY,
    relativeSigmaMinimum,
    relativeSingularValueTolerance,
    numericallySingular: relativeSigmaMinimum <= relativeSingularValueTolerance,
  });
}

function callEvaluator(
  evaluate: ScaledDampedNewtonEvaluatorV1,
  unknowns: ReadonlyArray<number>,
  context: ScaledDampedNewtonEvaluationContextV1,
  dimension: number,
): EvaluationAttempt {
  let raw: ScaledDampedNewtonModelEvaluationV1;
  try {
    raw = evaluate(freezeNumbers(unknowns), Object.freeze({ ...context }));
  } catch (error) {
    return {
      status: "threw",
      message: error instanceof Error ? error.message : String(error),
    };
  }
  if (raw.status === "inadmissible" || raw.status === "failed") {
    return { status: raw.status, message: raw.reason, diagnostic: raw.diagnostic };
  }
  if (raw.status !== "ok") {
    return { status: "invalid-output", message: "model evaluation returned an unknown status" };
  }
  if (raw.residual.length !== dimension || raw.jacobianRowMajor.length !== dimension * dimension) {
    return {
      status: "invalid-output",
      message: "model residual or Jacobian dimensions do not match the unknown dimension",
      diagnostic: raw.diagnostic,
    };
  }
  if (!allFinite(raw.residual) || !allFinite(raw.jacobianRowMajor)) {
    return {
      status: "non-finite-output",
      message: "model residual or Jacobian contains a non-finite value",
      diagnostic: raw.diagnostic,
    };
  }
  return {
    status: "ok",
    evaluation: {
      residual: Float64Array.from(raw.residual),
      jacobianRowMajor: Float64Array.from(raw.jacobianRowMajor),
      diagnostic: raw.diagnostic,
    },
  };
}

function resolveOptions(input: ScaledDampedNewtonOptionsV1 | undefined): ResolvedOptions {
  const defaults = SCALED_DAMPED_NEWTON_V1_DEFAULTS;
  const options: ResolvedOptions = {
    maxIterations: input?.maxIterations ?? defaults.maxIterations,
    residualInfinityTolerance: input?.residualInfinityTolerance ?? defaults.residualInfinityTolerance,
    updateInfinityTolerance: input?.updateInfinityTolerance ?? defaults.updateInfinityTolerance,
    armijoCoefficient: input?.armijoCoefficient ?? defaults.armijoCoefficient,
    lineSearchContraction: input?.lineSearchContraction ?? defaults.lineSearchContraction,
    maxLineSearchBacktracks: input?.maxLineSearchBacktracks ?? defaults.maxLineSearchBacktracks,
    minimumStepLength: input?.minimumStepLength ?? defaults.minimumStepLength,
    fractionToBoundarySafety: input?.fractionToBoundarySafety ?? defaults.fractionToBoundarySafety,
    relativePivotTolerance: input?.relativePivotTolerance ?? defaults.relativePivotTolerance,
  };
  requirePositiveInteger(options.maxIterations, "maxIterations");
  requireNonNegativeInteger(options.maxLineSearchBacktracks, "maxLineSearchBacktracks");
  requirePositiveFinite(options.residualInfinityTolerance, "residualInfinityTolerance");
  requirePositiveFinite(options.updateInfinityTolerance, "updateInfinityTolerance");
  requirePositiveFinite(options.minimumStepLength, "minimumStepLength");
  requirePositiveFinite(options.relativePivotTolerance, "relativePivotTolerance");
  if (options.minimumStepLength > 1) throw new Error("minimumStepLength must not exceed one");
  if (options.relativePivotTolerance >= 1) throw new Error("relativePivotTolerance must be less than one");
  if (!(options.armijoCoefficient > 0 && options.armijoCoefficient < 0.5)) {
    throw new Error("armijoCoefficient must lie strictly between zero and 0.5");
  }
  if (!(options.lineSearchContraction > 0 && options.lineSearchContraction < 1)) {
    throw new Error("lineSearchContraction must lie strictly between zero and one");
  }
  if (!(options.fractionToBoundarySafety > 0 && options.fractionToBoundarySafety < 1)) {
    throw new Error("fractionToBoundarySafety must lie strictly between zero and one");
  }
  return Object.freeze(options);
}

function normalizeLowerBounds(
  input: ReadonlyArray<number | null> | undefined,
  dimension: number,
): ReadonlyArray<number | null> {
  if (input === undefined) return Object.freeze(Array<number | null>(dimension).fill(null));
  if (input.length !== dimension) throw new Error("strictLowerBounds must match the unknown dimension");
  return Object.freeze(input.map((bound, index) => {
    if (bound !== null && !Number.isFinite(bound)) {
      throw new Error(`strictLowerBounds[${index}] must be finite or null`);
    }
    return bound;
  }));
}

function validateScaleVector(values: ReadonlyArray<number>, dimension: number, field: string): void {
  if (values.length !== dimension) throw new Error(`${field} must match the unknown dimension`);
  values.forEach((value, index) => requirePositiveFinite(value, `${field}[${index}]`));
}

function strictlyInsideBounds(values: ArrayLike<number>, lowerBounds: ReadonlyArray<number | null>): boolean {
  for (let index = 0; index < values.length; index += 1) {
    const bound = lowerBounds[index];
    if (bound !== null && !(values[index] > bound)) return false;
  }
  return true;
}

function multiplyDenseMatrixVector(
  matrixRowMajor: ArrayLike<number>,
  vector: ArrayLike<number>,
  dimension: number,
): Float64Array {
  const result = new Float64Array(dimension);
  for (let row = 0; row < dimension; row += 1) {
    let sum = 0;
    for (let column = 0; column < dimension; column += 1) {
      sum += matrixRowMajor[row * dimension + column] * vector[column];
    }
    result[row] = sum;
  }
  return result;
}

function dot(left: ArrayLike<number>, right: ArrayLike<number>): number {
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) sum += left[index] * right[index];
  return sum;
}

function infinityNorm(values: ArrayLike<number>): number {
  let result = 0;
  for (let index = 0; index < values.length; index += 1) result = Math.max(result, Math.abs(values[index]));
  return result;
}

function twoNorm(values: ArrayLike<number>): number {
  let scale = 0;
  let sumSquares = 1;
  for (let index = 0; index < values.length; index += 1) {
    const absolute = Math.abs(values[index]);
    if (absolute === 0) continue;
    if (scale < absolute) {
      const ratio = scale / absolute;
      sumSquares = 1 + sumSquares * ratio * ratio;
      scale = absolute;
    } else {
      const ratio = absolute / scale;
      sumSquares += ratio * ratio;
    }
  }
  return scale === 0 ? 0 : scale * Math.sqrt(sumSquares);
}

function allFinite(values: ArrayLike<number>): boolean {
  for (let index = 0; index < values.length; index += 1) {
    if (!Number.isFinite(values[index])) return false;
  }
  return true;
}

function freezeNumbers(values: ArrayLike<number>): ReadonlyArray<number> {
  return Object.freeze(Array.from(values));
}

function freezeIterationDiagnostic(
  diagnostic: ScaledDampedNewtonIterationDiagnosticsV1,
): ScaledDampedNewtonIterationDiagnosticsV1 {
  return Object.freeze(diagnostic);
}

function mapEvaluationFailure(status: Exclude<EvaluationAttempt["status"], "ok">): ScaledDampedNewtonFailureReasonV1 {
  switch (status) {
    case "inadmissible": return "model-evaluation-inadmissible";
    case "failed": return "model-evaluation-failed";
    case "threw": return "model-evaluation-threw";
    case "invalid-output": return "invalid-model-output";
    case "non-finite-output": return "non-finite-model-output";
  }
}

function luFailure(
  reason: ScaledDenseLuFailureReasonV1,
  message: string,
  diagnostics: ScaledDenseLuDiagnosticsV1 | null,
): ScaledDenseLuResultV1 {
  return Object.freeze({ success: false as const, reason, message, diagnostics });
}

function requirePositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be positive and finite`);
}

function requirePositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${field} must be a positive integer`);
}

function requireNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${field} must be a non-negative integer`);
}
