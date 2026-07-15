import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const STRICT_AFFINE_DOMAIN_V1_ID =
  "four-chamber-strict-affine-domain-v1" as const;

/** A physical-space half-space: coefficients dot unknowns > lowerBound. */
export type StrictAffineConstraintV1 = Readonly<{
  constraintId: string;
  coefficients: readonly number[];
  lowerBound: number;
}>;

export type StrictAffineConstraintMarginV1 = Readonly<{
  constraintId: string;
  constraintIndex: number;
  margin: number;
}>;

export type StrictAffineFractionToBoundaryV1 =
  | Readonly<{
    admissible: true;
    maximumStepLength: number;
    limitingConstraintIndex: number | null;
    limitingConstraintId: string | null;
  }>
  | Readonly<{
    admissible: false;
    maximumStepLength: 0;
    limitingConstraintIndex: number;
    limitingConstraintId: string;
    reason:
      | "current-state-not-strictly-interior"
      | "non-finite-boundary-step";
  }>;

export function normalizeStrictAffineConstraintsV1(
  input: readonly StrictAffineConstraintV1[] | undefined,
  dimension: number,
): readonly StrictAffineConstraintV1[] {
  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new Error("strict affine domain dimension must be a positive integer");
  }
  if (input === undefined) return Object.freeze([]);
  assertDensePlainArrayV1(input, undefined, "strictAffineConstraints");
  const ids = new Set<string>();
  return Object.freeze(input.map((constraint, index) => {
    assertExactPlainRecordV1(
      constraint,
      ["constraintId", "coefficients", "lowerBound"],
      `strictAffineConstraints[${index}]`,
    );
    const constraintId = requireNonEmptyString(
      constraint.constraintId,
      `strictAffineConstraints[${index}].constraintId`,
    );
    if (ids.has(constraintId)) {
      throw new Error(`strictAffineConstraints contains duplicate ID ${constraintId}`);
    }
    ids.add(constraintId);
    assertDensePlainArrayV1(
      constraint.coefficients,
      dimension,
      `strictAffineConstraints[${index}].coefficients`,
    );
    const coefficients = Object.freeze(constraint.coefficients.map(
      (coefficient, column) => requireFinite(
        coefficient,
        `strictAffineConstraints[${index}].coefficients[${column}]`,
      ),
    ));
    if (!coefficients.some((coefficient) => coefficient !== 0)) {
      throw new Error(`strictAffineConstraints[${index}] must constrain at least one unknown`);
    }
    return Object.freeze({
      constraintId,
      coefficients,
      lowerBound: requireFinite(
        constraint.lowerBound,
        `strictAffineConstraints[${index}].lowerBound`,
      ),
    });
  }));
}

export function evaluateStrictAffineConstraintMarginsV1(
  unknowns: ArrayLike<number>,
  constraints: readonly StrictAffineConstraintV1[],
): readonly StrictAffineConstraintMarginV1[] {
  return Object.freeze(constraints.map((constraint, constraintIndex) => {
    if (constraint.coefficients.length !== unknowns.length) {
      throw new Error(
        `strict affine constraint ${constraint.constraintId} dimension mismatch`,
      );
    }
    let value = -constraint.lowerBound;
    for (let column = 0; column < unknowns.length; column += 1) {
      value += requireFinite(unknowns[column], `unknowns[${column}]`)
        * constraint.coefficients[column];
    }
    return Object.freeze({
      constraintId: constraint.constraintId,
      constraintIndex,
      margin: requireFinite(value, `${constraint.constraintId}.margin`),
    });
  }));
}

export function strictlyInsideAffineConstraintsV1(
  unknowns: ArrayLike<number>,
  constraints: readonly StrictAffineConstraintV1[],
): boolean {
  return evaluateStrictAffineConstraintMarginsV1(unknowns, constraints)
    .every(({ margin }) => margin > 0);
}

export function computeStrictAffineFractionToBoundaryV1(
  current: ArrayLike<number>,
  direction: ArrayLike<number>,
  constraints: readonly StrictAffineConstraintV1[],
  safety: number,
): StrictAffineFractionToBoundaryV1 {
  if (current.length !== direction.length) {
    throw new Error("strict affine boundary current and direction dimensions differ");
  }
  if (!Number.isFinite(safety) || safety <= 0 || safety >= 1) {
    throw new Error("strict affine boundary safety must lie strictly between zero and one");
  }
  let maximumStepLength = 1;
  let limitingConstraintIndex: number | null = null;
  let limitingConstraintId: string | null = null;
  const margins = evaluateStrictAffineConstraintMarginsV1(current, constraints);
  for (const { constraintId, constraintIndex, margin } of margins) {
    if (!(margin > 0)) {
      return Object.freeze({
        admissible: false,
        maximumStepLength: 0,
        limitingConstraintIndex: constraintIndex,
        limitingConstraintId: constraintId,
        reason: "current-state-not-strictly-interior",
      });
    }
    const constraint = constraints[constraintIndex];
    let directionalMargin = 0;
    for (let column = 0; column < direction.length; column += 1) {
      directionalMargin += requireFinite(direction[column], `direction[${column}]`)
        * constraint.coefficients[column];
    }
    if (!Number.isFinite(directionalMargin)) {
      return Object.freeze({
        admissible: false,
        maximumStepLength: 0,
        limitingConstraintIndex: constraintIndex,
        limitingConstraintId: constraintId,
        reason: "non-finite-boundary-step",
      });
    }
    if (directionalMargin < 0) {
      const safeBoundaryNumerator = safety * margin;
      const outwardRate = -directionalMargin;
      // Only form the quotient when it can limit a unit step. This avoids
      // rejecting a harmless full step when a very distant boundary would
      // make the unconstrained quotient overflow to +Infinity.
      if (safeBoundaryNumerator < outwardRate) {
        const candidate = safeBoundaryNumerator / outwardRate;
        if (!Number.isFinite(candidate) || candidate <= 0) {
          return Object.freeze({
            admissible: false,
            maximumStepLength: 0,
            limitingConstraintIndex: constraintIndex,
            limitingConstraintId: constraintId,
            reason: "non-finite-boundary-step",
          });
        }
        if (candidate < maximumStepLength) {
          maximumStepLength = candidate;
          limitingConstraintIndex = constraintIndex;
          limitingConstraintId = constraintId;
        }
      }
    }
  }
  return Object.freeze({
    admissible: true,
    maximumStepLength,
    limitingConstraintIndex,
    limitingConstraintId,
  });
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}
