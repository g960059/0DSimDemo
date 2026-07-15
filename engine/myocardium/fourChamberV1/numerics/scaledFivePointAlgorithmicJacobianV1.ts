import {
  normalizeStrictAffineConstraintsV1,
  strictlyInsideAffineConstraintsV1,
  type StrictAffineConstraintV1,
} from "@/engine/myocardium/fourChamberV1/numerics/strictAffineDomainV1";

export const SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID =
  "four-chamber-scaled-five-point-algorithmic-jacobian-v1" as const;

export type ScaledFivePointResidualEvaluatorV1 = (unknowns: readonly number[]) => readonly number[];

export type ScaledFivePointAlgorithmicJacobianOptionsV1 = Readonly<{
  unknownScales: readonly number[];
  residualScales: readonly number[];
  lowerBounds: readonly (number | null)[];
  strictAffineConstraints?: readonly StrictAffineConstraintV1[];
  scaledStep: number;
}>;

export type ScaledFivePointAlgorithmicJacobianV1 = Readonly<{
  algorithmId: typeof SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID;
  rawJacobian: readonly (readonly number[])[];
  scaledJacobian: readonly (readonly number[])[];
  stencilByColumn: readonly (
    | "centered-five-point"
    | "forward-five-point"
    | "backward-five-point"
  )[];
  scaledStep: number;
  scaledStepByColumn: readonly number[];
}>;

export type ScaledFivePointJacobianDirectionalAuditV1 = Readonly<{
  algorithmId: typeof SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID;
  scaledDirectionalDerivativeFromJacobian: readonly number[];
  scaledDirectionalDerivativeFromIndependentStencil: readonly number[];
  maximumAbsoluteDifference: number;
  maximumRelativeDifference: number;
  differenceTwoNorm: number;
  referenceTwoNorm: number;
  relativeTwoNormDifference: number;
  independentScaledStep: number;
}>;

/**
 * Deterministic, scale-aware five-point Jacobian used only by the four-chamber
 * test reference.  It is deliberately an injected algorithmic Jacobian, not
 * a hidden Newton fallback.  A one-sided fourth-order stencil is used only
 * when a centered stencil would leave a declared admissible domain.
 */
export function evaluateScaledFivePointAlgorithmicJacobianV1(
  evaluateResidual: ScaledFivePointResidualEvaluatorV1,
  unknowns: readonly number[],
  options: ScaledFivePointAlgorithmicJacobianOptionsV1,
): ScaledFivePointAlgorithmicJacobianV1 {
  const { unknownScales, residualScales, lowerBounds, scaledStep } = options;
  assertVector(unknowns, "unknowns");
  assertPositiveVector(unknownScales, unknowns.length, "unknownScales");
  assertPositiveVector(residualScales, undefined, "residualScales");
  assertLowerBounds(lowerBounds, unknowns.length);
  const affineConstraints = normalizeStrictAffineConstraintsV1(
    options.strictAffineConstraints,
    unknowns.length,
  );
  requirePositiveFinite(scaledStep, "scaledStep");
  if (!insideDeclaredDomain(unknowns, lowerBounds, affineConstraints)) {
    throw new Error("algorithmic Jacobian base point is outside the declared domain");
  }
  const baselineResidual = copyResidual(evaluateResidual(unknowns), residualScales.length);
  if (baselineResidual.length !== residualScales.length) {
    throw new Error("evaluateResidual returned an inconsistent residual dimension");
  }

  const rawJacobian = Array.from(
    { length: residualScales.length },
    () => Array<number>(unknowns.length).fill(0),
  );
  const scaledJacobian = Array.from(
    { length: residualScales.length },
    () => Array<number>(unknowns.length).fill(0),
  );
  const stencilByColumn: Array<
    "centered-five-point" | "forward-five-point" | "backward-five-point"
  > = [];
  const scaledStepByColumn: number[] = [];

  for (let column = 0; column < unknowns.length; column += 1) {
    let columnScaledStep = scaledStep;
    let stencil: "centered-five-point" | "forward-five-point" | "backward-five-point" | null = null;
    for (let halving = 0; halving <= 24; halving += 1) {
      const candidateStep = columnScaledStep * unknownScales[column];
      if (offsetsInsideDomain(
        unknowns,
        column,
        candidateStep,
        [-2, -1, 1, 2],
        lowerBounds,
        affineConstraints,
      )) {
        stencil = "centered-five-point";
        break;
      }
      if (offsetsInsideDomain(
        unknowns,
        column,
        candidateStep,
        [1, 2, 3, 4],
        lowerBounds,
        affineConstraints,
      )) {
        stencil = "forward-five-point";
        break;
      }
      if (offsetsInsideDomain(
        unknowns,
        column,
        candidateStep,
        [-1, -2, -3, -4],
        lowerBounds,
        affineConstraints,
      )) {
        stencil = "backward-five-point";
        break;
      }
      columnScaledStep *= 0.5;
    }
    if (stencil === null) {
      throw new Error(`No admissible five-point stencil for column ${column}`);
    }
    const step = columnScaledStep * unknownScales[column];
    const offsets = stencil === "centered-five-point"
      ? [-2, -1, 1, 2]
      : stencil === "forward-five-point"
        ? [1, 2, 3, 4]
        : [-1, -2, -3, -4];
    const samples = offsets.map((multiple) => evaluateOffset(
        evaluateResidual,
        unknowns,
        column,
        multiple * step,
        residualScales.length,
      ));
    stencilByColumn.push(stencil);
    scaledStepByColumn.push(columnScaledStep);

    for (let row = 0; row < residualScales.length; row += 1) {
      const derivative = stencil === "centered-five-point"
        ? (
          samples[0][row]
          - 8 * samples[1][row]
          + 8 * samples[2][row]
          - samples[3][row]
        ) / (12 * step)
        : stencil === "forward-five-point" ? (
          -25 * baselineResidual[row]
          + 48 * samples[0][row]
          - 36 * samples[1][row]
          + 16 * samples[2][row]
          - 3 * samples[3][row]
        ) / (12 * step) : (
          25 * baselineResidual[row]
          - 48 * samples[0][row]
          + 36 * samples[1][row]
          - 16 * samples[2][row]
          + 3 * samples[3][row]
        ) / (12 * step);
      requireFinite(derivative, `rawJacobian[${row}][${column}]`);
      rawJacobian[row][column] = derivative;
      scaledJacobian[row][column] = derivative * unknownScales[column] / residualScales[row];
      requireFinite(scaledJacobian[row][column], `scaledJacobian[${row}][${column}]`);
    }
  }

  return Object.freeze({
    algorithmId: SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID,
    rawJacobian: freezeMatrix(rawJacobian),
    scaledJacobian: freezeMatrix(scaledJacobian),
    stencilByColumn: Object.freeze(stencilByColumn),
    scaledStep,
    scaledStepByColumn: Object.freeze(scaledStepByColumn),
  });
}

/**
 * Independent five-point directional check in scaled coordinates. The audit
 * step must differ from the five-point construction step in acceptance tests.
 */
export function auditScaledFivePointAlgorithmicJacobianDirectionV1(
  evaluateResidual: ScaledFivePointResidualEvaluatorV1,
  unknowns: readonly number[],
  scaledDirection: readonly number[],
  jacobian: ScaledFivePointAlgorithmicJacobianV1,
  options: ScaledFivePointAlgorithmicJacobianOptionsV1,
  independentScaledStep: number,
): ScaledFivePointJacobianDirectionalAuditV1 {
  assertVector(scaledDirection, "scaledDirection");
  if (scaledDirection.length !== unknowns.length) {
    throw new Error("scaledDirection length must equal unknown dimension");
  }
  if (jacobian.algorithmId !== SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID) {
    throw new Error("jacobian must be produced by the four-chamber algorithmic Jacobian");
  }
  requirePositiveFinite(independentScaledStep, "independentScaledStep");
  const norm = Math.hypot(...scaledDirection);
  requirePositiveFinite(norm, "scaledDirection norm");
  const unitDirection = scaledDirection.map((value) => value / norm);
  const directionalTrial = (multiple: -2 | -1 | 1 | 2) => unknowns.map((value, index) =>
    value + multiple * independentScaledStep * unitDirection[index]
      * options.unknownScales[index]);
  const minusTwo = directionalTrial(-2);
  const minusOne = directionalTrial(-1);
  const plusOne = directionalTrial(1);
  const plusTwo = directionalTrial(2);
  const affineConstraints = normalizeStrictAffineConstraintsV1(
    options.strictAffineConstraints,
    unknowns.length,
  );
  for (const trial of [minusTwo, minusOne, plusOne, plusTwo]) {
    if (!insideDeclaredDomain(trial, options.lowerBounds, affineConstraints)) {
      throw new Error("Independent directional stencil violates the declared domain");
    }
  }
  const minusTwoResidual = copyResidual(
    evaluateResidual(minusTwo),
    options.residualScales.length,
  );
  const minusOneResidual = copyResidual(
    evaluateResidual(minusOne),
    options.residualScales.length,
  );
  const plusOneResidual = copyResidual(
    evaluateResidual(plusOne),
    options.residualScales.length,
  );
  const plusTwoResidual = copyResidual(
    evaluateResidual(plusTwo),
    options.residualScales.length,
  );
  const fromIndependentStencil = plusOneResidual.map((_, row) => (
    minusTwoResidual[row]
    - 8 * minusOneResidual[row]
    + 8 * plusOneResidual[row]
    - plusTwoResidual[row]
  ) / (12 * independentScaledStep * options.residualScales[row]));
  const fromJacobian = jacobian.scaledJacobian.map((row) =>
    row.reduce((sum, value, column) => sum + value * unitDirection[column], 0));
  let maximumAbsoluteDifference = 0;
  let maximumRelativeDifference = 0;
  let squaredDifferenceNorm = 0;
  let squaredJacobianNorm = 0;
  let squaredIndependentNorm = 0;
  for (let row = 0; row < fromJacobian.length; row += 1) {
    const absolute = Math.abs(fromJacobian[row] - fromIndependentStencil[row]);
    const relative = absolute / Math.max(
      1e-14,
      Math.abs(fromJacobian[row]),
      Math.abs(fromIndependentStencil[row]),
    );
    maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, absolute);
    maximumRelativeDifference = Math.max(maximumRelativeDifference, relative);
    squaredDifferenceNorm += absolute * absolute;
    squaredJacobianNorm += fromJacobian[row] * fromJacobian[row];
    squaredIndependentNorm += fromIndependentStencil[row] * fromIndependentStencil[row];
  }
  const differenceTwoNorm = Math.sqrt(squaredDifferenceNorm);
  const referenceTwoNorm = Math.max(
    1e-14,
    Math.sqrt(squaredJacobianNorm),
    Math.sqrt(squaredIndependentNorm),
  );
  return Object.freeze({
    algorithmId: SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID,
    scaledDirectionalDerivativeFromJacobian: Object.freeze(fromJacobian),
    scaledDirectionalDerivativeFromIndependentStencil: Object.freeze(fromIndependentStencil),
    maximumAbsoluteDifference,
    maximumRelativeDifference,
    differenceTwoNorm,
    referenceTwoNorm,
    relativeTwoNormDifference: differenceTwoNorm / referenceTwoNorm,
    independentScaledStep,
  });
}

function evaluateOffset(
  evaluateResidual: ScaledFivePointResidualEvaluatorV1,
  unknowns: readonly number[],
  column: number,
  offset: number,
  expectedResidualLength: number,
): readonly number[] {
  const trial = [...unknowns];
  trial[column] += offset;
  return copyResidual(evaluateResidual(trial), expectedResidualLength);
}

function offsetsInsideDomain(
  unknowns: readonly number[],
  column: number,
  step: number,
  multiples: readonly number[],
  lowerBounds: readonly (number | null)[],
  affineConstraints: readonly StrictAffineConstraintV1[],
): boolean {
  return multiples.every((multiple) => {
    const trial = [...unknowns];
    trial[column] += multiple * step;
    return insideDeclaredDomain(trial, lowerBounds, affineConstraints);
  });
}

function insideDeclaredDomain(
  unknowns: readonly number[],
  lowerBounds: readonly (number | null)[],
  affineConstraints: readonly StrictAffineConstraintV1[],
): boolean {
  for (let index = 0; index < unknowns.length; index += 1) {
    const lower = lowerBounds[index];
    if (lower !== null && !(unknowns[index] > lower)) return false;
  }
  return strictlyInsideAffineConstraintsV1(unknowns, affineConstraints);
}

function copyResidual(values: readonly number[], expectedLength: number): readonly number[] {
  assertVector(values, "residual");
  if (values.length !== expectedLength) {
    throw new Error(`Residual length changed from ${expectedLength} to ${values.length}`);
  }
  return [...values];
}

function assertVector(values: readonly number[], field: string): void {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${field} must be a nonempty dense array`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index)) throw new Error(`${field} must not contain holes`);
    requireFinite(values[index], `${field}[${index}]`);
  }
}

function assertPositiveVector(
  values: readonly number[],
  expectedLength: number | undefined,
  field: string,
): void {
  assertVector(values, field);
  if (expectedLength !== undefined && values.length !== expectedLength) {
    throw new Error(`${field} length must equal ${expectedLength}`);
  }
  values.forEach((value, index) => requirePositiveFinite(value, `${field}[${index}]`));
}

function assertLowerBounds(values: readonly (number | null)[], expectedLength: number): void {
  if (!Array.isArray(values) || values.length !== expectedLength) {
    throw new Error(`lowerBounds length must equal ${expectedLength}`);
  }
  values.forEach((value, index) => {
    if (value !== null) requireFinite(value, `lowerBounds[${index}]`);
  });
}

function freezeMatrix(matrix: number[][]): readonly (readonly number[])[] {
  return Object.freeze(matrix.map((row) => Object.freeze(row)));
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
}

function requirePositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be positive and finite`);
}
