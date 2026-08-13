import {
  createFlatDenseLuWorkspaceV1,
  factorPreparedFlatDenseMatrixV1,
  solvePreparedFactoredFlatDenseSystemV1,
  type FlatDenseLuWorkspaceV1,
} from "@/engine/vnext/coupled/FlatDenseLuV1";
import type {
  FlatCoupledNewtonOptionsV1,
  FlatCoupledNewtonResultV1,
  FlatCoupledSystemV1,
} from "@/engine/vnext/coupled/FlatCoupledNewtonV1";

export const FLAT_COUPLED_SCALED_POWELL_DOGLEG_V1_ID =
  "flat-coupled-scaled-powell-dogleg-v1" as const;

export type FlatCoupledDoglegOptionsV1 = Omit<
  FlatCoupledNewtonOptionsV1,
  | "maximumLineSearchBacktracks"
  | "maximumAcceptedStepsPerJacobian"
  | "armijoCoefficient"
> & Readonly<{
  initialTrustRegionRadius: number;
  maximumTrustRegionRadius: number;
  minimumTrustRegionRadius: number;
  maximumTrustRegionTrialsPerIteration: number;
  acceptanceRatio: number;
}>;

export type FlatCoupledDoglegWorkspaceV1 = Readonly<{
  dimension: number;
  current: Float64Array;
  residual: Float64Array;
  scaledResidual: Float64Array;
  scaledJacobian: Float64Array;
  rightHandSide: Float64Array;
  newtonStep: Float64Array;
  gradient: Float64Array;
  jacobianGradient: Float64Array;
  cauchyStep: Float64Array;
  doglegStep: Float64Array;
  physicalUpdate: Float64Array;
  predictedResidual: Float64Array;
  trial: Float64Array;
  trialResidual: Float64Array;
  trialScaledResidual: Float64Array;
  linear: FlatDenseLuWorkspaceV1;
}>;

export type FlatCoupledDoglegSolveV1 = Readonly<{
  solverId: typeof FLAT_COUPLED_SCALED_POWELL_DOGLEG_V1_ID;
  result: FlatCoupledNewtonResultV1;
  rejectedTrialCount: number;
  trustRegionContractionCount: number;
  trustRegionExpansionCount: number;
  finalTrustRegionRadius: number;
}>;

export function createFlatCoupledDoglegWorkspaceV1(
  dimension: number,
): FlatCoupledDoglegWorkspaceV1 {
  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new RangeError("coupled dogleg dimension must be a positive integer");
  }
  return Object.freeze({
    dimension,
    current: new Float64Array(dimension),
    residual: new Float64Array(dimension),
    scaledResidual: new Float64Array(dimension),
    scaledJacobian: new Float64Array(dimension * dimension),
    rightHandSide: new Float64Array(dimension),
    newtonStep: new Float64Array(dimension),
    gradient: new Float64Array(dimension),
    jacobianGradient: new Float64Array(dimension),
    cauchyStep: new Float64Array(dimension),
    doglegStep: new Float64Array(dimension),
    physicalUpdate: new Float64Array(dimension),
    predictedResidual: new Float64Array(dimension),
    trial: new Float64Array(dimension),
    trialResidual: new Float64Array(dimension),
    trialScaledResidual: new Float64Array(dimension),
    linear: createFlatDenseLuWorkspaceV1(dimension),
  });
}

/**
 * Scale-aware Powell dogleg for the same model-owned nonlinear system used by
 * the flat Newton solver. The trust-region merit selects trials only; accepted
 * convergence remains exclusively owned by `isResidualConverged` when present.
 */
export function solveFlatCoupledSystemWithDoglegV1(
  system: FlatCoupledSystemV1,
  initialUnknowns: Float64Array,
  options: FlatCoupledDoglegOptionsV1,
  workspace: FlatCoupledDoglegWorkspaceV1 =
    createFlatCoupledDoglegWorkspaceV1(system.dimension),
): FlatCoupledDoglegSolveV1 {
  validateInputs(system, initialUnknowns, options, workspace);
  const {
    current,
    residual,
    scaledResidual,
    scaledJacobian,
    rightHandSide,
    newtonStep,
    gradient,
    jacobianGradient,
    cauchyStep,
    doglegStep,
    physicalUpdate,
    predictedResidual,
    trial,
    trialResidual,
    trialScaledResidual,
    linear,
  } = workspace;
  current.set(initialUnknowns);
  let residualEvaluationCount = 0;
  let jacobianEvaluationCount = 0;
  let rejectedTrialCount = 0;
  let trustRegionContractionCount = 0;
  let trustRegionExpansionCount = 0;
  let trustRegionRadius = options.initialTrustRegionRadius;

  try {
    system.evaluateResidual(current, residual);
    residualEvaluationCount += 1;
    requireFiniteVector(residual, "initial coupled dogleg residual");
  } catch (error) {
    return envelope(
      failure(
        "initial-residual-evaluation",
        errorMessage(error),
        current,
        0,
        Number.POSITIVE_INFINITY,
        residualEvaluationCount,
        jacobianEvaluationCount,
      ),
      rejectedTrialCount,
      trustRegionContractionCount,
      trustRegionExpansionCount,
      trustRegionRadius,
    );
  }

  for (let iteration = 0;
    iteration <= options.maximumIterations;
    iteration += 1) {
    const residualInfinityNorm = infinityNorm(residual);
    let residualConverged: boolean;
    try {
      residualConverged = residualIsConverged(
        system,
        current,
        residual,
        residualInfinityNorm,
        options,
      );
    } catch (error) {
      return envelope(
        failure(
          "convergence-evaluation",
          errorMessage(error),
          current,
          iteration,
          residualInfinityNorm,
          residualEvaluationCount,
          jacobianEvaluationCount,
        ),
        rejectedTrialCount,
        trustRegionContractionCount,
        trustRegionExpansionCount,
        trustRegionRadius,
      );
    }
    if (residualConverged) {
      return envelope(
        success(
          current,
          iteration,
          residualInfinityNorm,
          residualEvaluationCount,
          jacobianEvaluationCount,
        ),
        rejectedTrialCount,
        trustRegionContractionCount,
        trustRegionExpansionCount,
        trustRegionRadius,
      );
    }
    if (iteration === options.maximumIterations) {
      return envelope(
        failure(
          "maximum-iterations",
          "flat coupled dogleg reached its iteration limit",
          current,
          iteration,
          residualInfinityNorm,
          residualEvaluationCount,
          jacobianEvaluationCount,
        ),
        rejectedTrialCount,
        trustRegionContractionCount,
        trustRegionExpansionCount,
        trustRegionRadius,
      );
    }

    try {
      system.evaluateJacobian(current, scaledJacobian);
      jacobianEvaluationCount += 1;
      equilibrateJacobianInPlace(scaledJacobian, options);
      scaleResidual(residual, scaledResidual, options);
      writeGradient(scaledJacobian, scaledResidual, gradient);
      multiplyMatrixVector(
        scaledJacobian,
        gradient,
        jacobianGradient,
      );
      writeCauchyStep(gradient, jacobianGradient, cauchyStep);
    } catch (error) {
      return envelope(
        failure(
          "jacobian-evaluation",
          errorMessage(error),
          current,
          iteration,
          residualInfinityNorm,
          residualEvaluationCount,
          jacobianEvaluationCount,
        ),
        rejectedTrialCount,
        trustRegionContractionCount,
        trustRegionExpansionCount,
        trustRegionRadius,
      );
    }

    linear.factors.set(scaledJacobian);
    const hasNewtonStep = factorPreparedFlatDenseMatrixV1(
      linear,
      options.minimumAbsolutePivot,
    );
    if (hasNewtonStep) {
      for (let index = 0; index < system.dimension; index += 1) {
        rightHandSide[index] = -scaledResidual[index]!;
      }
      solvePreparedFactoredFlatDenseSystemV1(
        linear,
        rightHandSide,
        newtonStep,
      );
    } else {
      newtonStep.fill(0);
    }

    const currentMerit = halfSquaredNorm(scaledResidual);
    let accepted = false;
    let stagnated = false;
    let lastError = hasNewtonStep
      ? "no trust-region trial was accepted"
      : "singular Jacobian and no Cauchy trust-region trial was accepted";
    for (let trialIndex = 0;
      trialIndex < options.maximumTrustRegionTrialsPerIteration;
      trialIndex += 1) {
      writeDoglegStep(
        cauchyStep,
        newtonStep,
        hasNewtonStep,
        trustRegionRadius,
        doglegStep,
      );
      for (let index = 0; index < system.dimension; index += 1) {
        physicalUpdate[index] = doglegStep[index]!
          * options.unknownScaleByUnknown[index]!;
      }
      let admissibleFraction: number;
      try {
        admissibleFraction = admissibleStepLength(
          system,
          current,
          physicalUpdate,
          options,
        );
      } catch (error) {
        lastError = errorMessage(error);
        admissibleFraction = 0;
      }
      if (!(admissibleFraction > 0)) {
        rejectedTrialCount += 1;
        const contracted = Math.max(
          options.minimumTrustRegionRadius,
          0.25 * trustRegionRadius,
        );
        if (contracted < trustRegionRadius) {
          trustRegionContractionCount += 1;
        }
        trustRegionRadius = contracted;
        if (trustRegionRadius <= options.minimumTrustRegionRadius) break;
        continue;
      }
      if (admissibleFraction > 0 && admissibleFraction < 1) {
        for (let index = 0; index < system.dimension; index += 1) {
          doglegStep[index] *= admissibleFraction;
          physicalUpdate[index] *= admissibleFraction;
        }
      }
      if (
        hasNewtonStep
        && infinityNorm(physicalUpdate) <= options.updateInfinityTolerance
      ) {
        stagnated = true;
        lastError = "trust-region update stagnated above component tolerance";
        break;
      }
      try {
        for (let index = 0; index < system.dimension; index += 1) {
          trial[index] = current[index]! + physicalUpdate[index]!;
        }
        requireWithinBounds(trial, options);
        system.assertCandidateAdmissible?.(trial);
        system.evaluateResidual(trial, trialResidual);
        residualEvaluationCount += 1;
        requireFiniteVector(trialResidual, "trust-region coupled residual");
        scaleResidual(trialResidual, trialScaledResidual, options);
        const componentConverged = residualIsConverged(
          system,
          trial,
          trialResidual,
          infinityNorm(trialResidual),
          options,
        );
        multiplyMatrixVector(
          scaledJacobian,
          doglegStep,
          predictedResidual,
        );
        for (let index = 0; index < system.dimension; index += 1) {
          predictedResidual[index] += scaledResidual[index]!;
        }
        const predictedReduction = currentMerit
          - halfSquaredNorm(predictedResidual);
        const actualReduction = currentMerit
          - halfSquaredNorm(trialScaledResidual);
        const ratio = predictedReduction > 0
          ? actualReduction / predictedReduction
          : Number.NEGATIVE_INFINITY;
        const stepNorm = euclideanNorm(doglegStep);

        if (
          componentConverged
          || (actualReduction > 0 && ratio >= options.acceptanceRatio)
        ) {
          current.set(trial);
          residual.set(trialResidual);
          accepted = true;
          if (
            ratio > 0.75
            && stepNorm >= 0.9 * trustRegionRadius
            && trustRegionRadius < options.maximumTrustRegionRadius
          ) {
            trustRegionRadius = Math.min(
              options.maximumTrustRegionRadius,
              2 * trustRegionRadius,
            );
            trustRegionExpansionCount += 1;
          }
          break;
        }
        lastError = `trial ratio ${ratio} did not justify acceptance`;
      } catch (error) {
        lastError = errorMessage(error);
      }

      rejectedTrialCount += 1;
      const contracted = Math.max(
        options.minimumTrustRegionRadius,
        0.25 * trustRegionRadius,
      );
      if (contracted < trustRegionRadius) {
        trustRegionContractionCount += 1;
      }
      trustRegionRadius = contracted;
      if (trustRegionRadius <= options.minimumTrustRegionRadius) break;
    }
    if (!accepted) {
      return envelope(
        failure(
          stagnated
            ? "stagnated"
            : hasNewtonStep ? "line-search" : "singular-jacobian",
          `flat coupled dogleg trust region failed: ${lastError}`,
          current,
          iteration,
          residualInfinityNorm,
          residualEvaluationCount,
          jacobianEvaluationCount,
        ),
        rejectedTrialCount,
        trustRegionContractionCount,
        trustRegionExpansionCount,
        trustRegionRadius,
      );
    }
  }
  throw new Error("unreachable flat coupled dogleg state");
}

function validateInputs(
  system: FlatCoupledSystemV1,
  initialUnknowns: Float64Array,
  options: FlatCoupledDoglegOptionsV1,
  workspace: FlatCoupledDoglegWorkspaceV1,
): void {
  if (!Number.isInteger(system.dimension) || system.dimension <= 0) {
    throw new RangeError("coupled system dimension must be a positive integer");
  }
  if (workspace.dimension !== system.dimension) {
    throw new RangeError("coupled dogleg workspace dimension differs");
  }
  requireLength(initialUnknowns, system.dimension, "initial unknowns");
  requireFiniteVector(initialUnknowns, "initial unknowns");
  requireLength(options.unknownScaleByUnknown, system.dimension, "unknown scales");
  requireLength(options.residualScaleByEquation, system.dimension, "residual scales");
  requireLength(options.lowerBoundByUnknown, system.dimension, "lower bounds");
  requireLength(options.upperBoundByUnknown, system.dimension, "upper bounds");
  if (!Number.isInteger(options.maximumIterations)
      || options.maximumIterations <= 0
      || !Number.isInteger(options.maximumTrustRegionTrialsPerIteration)
      || options.maximumTrustRegionTrialsPerIteration <= 0) {
    throw new RangeError("coupled dogleg iteration limits are invalid");
  }
  requirePositiveFinite(options.residualInfinityTolerance, "residualInfinityTolerance");
  requirePositiveFinite(options.updateInfinityTolerance, "updateInfinityTolerance");
  requirePositiveFinite(options.minimumAbsolutePivot, "minimumAbsolutePivot");
  requirePositiveFinite(options.initialTrustRegionRadius, "initialTrustRegionRadius");
  requirePositiveFinite(options.maximumTrustRegionRadius, "maximumTrustRegionRadius");
  requirePositiveFinite(options.minimumTrustRegionRadius, "minimumTrustRegionRadius");
  if (options.minimumTrustRegionRadius > options.initialTrustRegionRadius
      || options.initialTrustRegionRadius > options.maximumTrustRegionRadius) {
    throw new RangeError("coupled dogleg trust-region radii are inconsistent");
  }
  if (!Number.isFinite(options.acceptanceRatio)
      || options.acceptanceRatio <= 0
      || options.acceptanceRatio >= 1) {
    throw new RangeError("acceptanceRatio must be finite within (0, 1)");
  }
  for (let index = 0; index < system.dimension; index += 1) {
    requirePositiveFinite(options.unknownScaleByUnknown[index]!, `unknownScaleByUnknown[${index}]`);
    requirePositiveFinite(options.residualScaleByEquation[index]!, `residualScaleByEquation[${index}]`);
    const lower = options.lowerBoundByUnknown[index]!;
    const upper = options.upperBoundByUnknown[index]!;
    if (Number.isNaN(lower) || Number.isNaN(upper) || !(upper > lower)) {
      throw new RangeError(`coupled dogleg bounds[${index}] are invalid`);
    }
  }
  requireWithinBounds(initialUnknowns, options);
  system.assertCandidateAdmissible?.(initialUnknowns);
}

function equilibrateJacobianInPlace(
  jacobian: Float64Array,
  options: FlatCoupledDoglegOptionsV1,
): void {
  const dimension = options.unknownScaleByUnknown.length;
  for (let row = 0; row < dimension; row += 1) {
    const inverseResidualScale = 1 / options.residualScaleByEquation[row]!;
    for (let column = 0; column < dimension; column += 1) {
      const index = row * dimension + column;
      const value = jacobian[index]!
        * options.unknownScaleByUnknown[column]!
        * inverseResidualScale;
      if (!Number.isFinite(value)) {
        throw new RangeError("scaled coupled Jacobian must contain only finite values");
      }
      jacobian[index] = value;
    }
  }
}

function scaleResidual(
  source: Float64Array,
  destination: Float64Array,
  options: FlatCoupledDoglegOptionsV1,
): void {
  for (let index = 0; index < source.length; index += 1) {
    destination[index] = source[index]! / options.residualScaleByEquation[index]!;
  }
}

function writeGradient(
  matrix: Float64Array,
  residual: Float64Array,
  destination: Float64Array,
): void {
  const dimension = residual.length;
  for (let column = 0; column < dimension; column += 1) {
    let value = 0;
    for (let row = 0; row < dimension; row += 1) {
      value += matrix[row * dimension + column]! * residual[row]!;
    }
    destination[column] = value;
  }
}

function multiplyMatrixVector(
  matrix: Float64Array,
  vector: Float64Array,
  destination: Float64Array,
): void {
  const dimension = vector.length;
  for (let row = 0; row < dimension; row += 1) {
    let value = 0;
    for (let column = 0; column < dimension; column += 1) {
      value += matrix[row * dimension + column]! * vector[column]!;
    }
    destination[row] = value;
  }
}

function writeCauchyStep(
  gradient: Float64Array,
  jacobianGradient: Float64Array,
  destination: Float64Array,
): void {
  const gradientSquaredNorm = squaredNorm(gradient);
  const jacobianGradientSquaredNorm = squaredNorm(jacobianGradient);
  if (!(gradientSquaredNorm > 0) || !(jacobianGradientSquaredNorm > 0)) {
    destination.fill(0);
    return;
  }
  const coefficient = -gradientSquaredNorm / jacobianGradientSquaredNorm;
  for (let index = 0; index < gradient.length; index += 1) {
    destination[index] = coefficient * gradient[index]!;
  }
}

function writeDoglegStep(
  cauchy: Float64Array,
  newton: Float64Array,
  hasNewtonStep: boolean,
  radius: number,
  destination: Float64Array,
): void {
  const cauchyNorm = euclideanNorm(cauchy);
  if (!hasNewtonStep) {
    writeRadialStep(cauchy, cauchyNorm, radius, destination);
    return;
  }
  const newtonNorm = euclideanNorm(newton);
  if (newtonNorm <= radius) {
    destination.set(newton);
    return;
  }
  if (cauchyNorm >= radius) {
    writeRadialStep(cauchy, cauchyNorm, radius, destination);
    return;
  }
  let differenceSquaredNorm = 0;
  let cauchyDotDifference = 0;
  for (let index = 0; index < cauchy.length; index += 1) {
    const difference = newton[index]! - cauchy[index]!;
    differenceSquaredNorm += difference * difference;
    cauchyDotDifference += cauchy[index]! * difference;
  }
  const discriminant = Math.max(
    0,
    cauchyDotDifference * cauchyDotDifference
      + differenceSquaredNorm * (radius * radius - cauchyNorm * cauchyNorm),
  );
  const rawFraction = differenceSquaredNorm > 0
    ? (-cauchyDotDifference + Math.sqrt(discriminant))
      / differenceSquaredNorm
    : 0;
  const fraction = Math.min(1, Math.max(0, rawFraction));
  for (let index = 0; index < cauchy.length; index += 1) {
    destination[index] = cauchy[index]!
      + fraction * (newton[index]! - cauchy[index]!);
  }
}

function writeRadialStep(
  source: Float64Array,
  norm: number,
  radius: number,
  destination: Float64Array,
): void {
  if (!(norm > 0)) {
    destination.fill(0);
    return;
  }
  const scale = Math.min(1, radius / norm);
  for (let index = 0; index < source.length; index += 1) {
    destination[index] = scale * source[index]!;
  }
}

function admissibleStepLength(
  system: FlatCoupledSystemV1,
  current: Float64Array,
  update: Float64Array,
  options: FlatCoupledDoglegOptionsV1,
): number {
  let stepLength = 1;
  for (let index = 0; index < current.length; index += 1) {
    const delta = update[index]!;
    if (delta < 0 && Number.isFinite(options.lowerBoundByUnknown[index]!)) {
      stepLength = Math.min(stepLength, 0.99
        * (current[index]! - options.lowerBoundByUnknown[index]!) / -delta);
    } else if (delta > 0 && Number.isFinite(options.upperBoundByUnknown[index]!)) {
      stepLength = Math.min(stepLength, 0.99
        * (options.upperBoundByUnknown[index]! - current[index]!) / delta);
    }
  }
  const coupledLimit = system.maximumAdmissibleStepLength?.(current, update);
  if (coupledLimit !== undefined) {
    if (!Number.isFinite(coupledLimit) || coupledLimit <= 0) {
      throw new RangeError("coupled dogleg system returned no positive admissible step");
    }
    if (coupledLimit < 1) stepLength = Math.min(stepLength, 0.99 * coupledLimit);
  }
  if (!Number.isFinite(stepLength) || stepLength <= 0) {
    throw new RangeError("coupled dogleg has no positive admissible step");
  }
  return stepLength;
}

function residualIsConverged(
  system: FlatCoupledSystemV1,
  unknowns: Float64Array,
  residual: Float64Array,
  residualInfinityNorm: number,
  options: FlatCoupledDoglegOptionsV1,
): boolean {
  const converged = system.isResidualConverged === undefined
    ? residualInfinityNorm <= options.residualInfinityTolerance
    : system.isResidualConverged(unknowns, residual);
  if (typeof converged !== "boolean") {
    throw new TypeError("coupled convergence gate must return a boolean");
  }
  return converged;
}

function requireWithinBounds(
  values: Float64Array,
  options: FlatCoupledDoglegOptionsV1,
): void {
  for (let index = 0; index < values.length; index += 1) {
    if (!(values[index]! > options.lowerBoundByUnknown[index]!)
        || !(values[index]! < options.upperBoundByUnknown[index]!)) {
      throw new RangeError(`coupled unknown[${index}] left its open bounds`);
    }
  }
}

function requireLength(value: Float64Array, expected: number, label: string): void {
  if (!(value instanceof Float64Array) || value.length !== expected) {
    throw new RangeError(`${label} must contain ${expected} f64 values`);
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

function squaredNorm(values: Float64Array): number {
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    sum += values[index]! * values[index]!;
  }
  return sum;
}

function halfSquaredNorm(values: Float64Array): number {
  return 0.5 * squaredNorm(values);
}

function euclideanNorm(values: Float64Array): number {
  return Math.sqrt(squaredNorm(values));
}

function success(
  current: Float64Array,
  iterations: number,
  residualInfinityNorm: number,
  residualEvaluationCount: number,
  jacobianEvaluationCount: number,
): FlatCoupledNewtonResultV1 {
  return Object.freeze({
    status: "converged" as const,
    solution: current.slice(),
    iterations,
    residualInfinityNorm,
    residualEvaluationCount,
    jacobianEvaluationCount,
    lineSearchBacktrackCount: 0,
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
    lineSearchBacktrackCount: 0,
  });
}

function envelope(
  result: FlatCoupledNewtonResultV1,
  rejectedTrialCount: number,
  trustRegionContractionCount: number,
  trustRegionExpansionCount: number,
  finalTrustRegionRadius: number,
): FlatCoupledDoglegSolveV1 {
  return Object.freeze({
    solverId: FLAT_COUPLED_SCALED_POWELL_DOGLEG_V1_ID,
    result,
    rejectedTrialCount,
    trustRegionContractionCount,
    trustRegionExpansionCount,
    finalTrustRegionRadius,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
