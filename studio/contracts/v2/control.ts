/**
 * Numeric range semantics shared by registry admission and every runtime
 * control boundary. The lattice is anchored at `minimum`; ordinary IEEE-754
 * rounding is tolerated, but values materially between declared steps are not.
 */
export type StudioNumericControlRangeV2 = Readonly<{
  controlId: string;
  minimum: number;
  maximum: number;
  step: number;
}>;

const MINIMUM_STEP_LATTICE_TOLERANCE_V2 = 1e-12;
const MAXIMUM_STEP_LATTICE_TOLERANCE_V2 = 1e-7;
const STEP_LATTICE_ROUNDING_FACTOR_V2 = 32;
const MAXIMUM_RELIABLE_STEP_OFFSET_V2 = Math.floor(
  MAXIMUM_STEP_LATTICE_TOLERANCE_V2
    / (STEP_LATTICE_ROUNDING_FACTOR_V2 * Number.EPSILON),
);

/** Returns an actionable reason when a numeric control value is inadmissible. */
export function studioNumericControlValueIssueV2(
  value: number,
  definition: StudioNumericControlRangeV2,
): string | undefined {
  if (!Number.isFinite(value) || Object.is(value, -0)) {
    return "must be a finite number and must not be negative zero";
  }
  if (
    !Number.isFinite(definition.minimum)
    || !Number.isFinite(definition.maximum)
    || !Number.isFinite(definition.step)
    || Object.is(definition.minimum, -0)
    || Object.is(definition.maximum, -0)
    || Object.is(definition.step, -0)
    || !(definition.minimum < definition.maximum)
    || !(definition.step > 0)
  ) {
    return "cannot be checked against an invalid registered numeric range";
  }
  if (value < definition.minimum || value > definition.maximum) {
    return `must be within [${definition.minimum}, ${definition.maximum}]`;
  }

  const offsetInSteps = (value - definition.minimum) / definition.step;
  if (
    !Number.isFinite(offsetInSteps)
    || offsetInSteps < 0
    || offsetInSteps > MAXIMUM_RELIABLE_STEP_OFFSET_V2
  ) {
    return "cannot be represented reliably on the registered step lattice";
  }
  const nearestStep = Math.round(offsetInSteps);
  const distanceInSteps = Math.abs(offsetInSteps - nearestStep);
  if (!Number.isFinite(distanceInSteps)) {
    return "cannot be represented reliably on the registered step lattice";
  }
  const roundingTolerance = STEP_LATTICE_ROUNDING_FACTOR_V2
    * Number.EPSILON
    * Math.max(1, Math.abs(offsetInSteps));
  const toleranceInSteps = Math.min(
    MAXIMUM_STEP_LATTICE_TOLERANCE_V2,
    Math.max(MINIMUM_STEP_LATTICE_TOLERANCE_V2, roundingTolerance),
  );
  if (distanceInSteps > toleranceInSteps) {
    return `must lie on the step lattice ${definition.minimum} + n * `
      + `${definition.step}`;
  }
  return undefined;
}
