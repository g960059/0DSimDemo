import {
  landDistortionEquivalenceParametersV1,
  rateFreeXiToSourceZetaV1,
  sourceZetaToRateFreeXiV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeDistortionEquivalenceV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  validateLand2017EquationState,
  writeLand2017Rhs,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { writeLand2017BackwardEulerResidualJacobian } from
  "@/engine/myocardium/myofilament/land2017/jacobian";
import {
  evaluateLand2017ContinuousOutput,
} from "@/engine/myocardium/myofilament/land2017/outputs";
import { writeLand2017BackwardEulerResidual } from
  "@/engine/myocardium/myofilament/land2017/residual";
import {
  LAND2017_STATE_INDEX,
  LAND2017_STATE_SIZE,
  assertLand2017StateVectorLength,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export const RATE_FREE_LAND2017_V1_ID =
  "land2017-active-only-rate-free-xi-v1" as const;

export const RATE_FREE_LAND2017_STATE_LABELS_V1 = Object.freeze([
  "CaTRPN",
  "B",
  "W",
  "S",
  "xiW",
  "xiS",
] as const);

export type RateFreeLand2017StateV1 = readonly [
  CaTRPN: number,
  B: number,
  W: number,
  S: number,
  xiW: number,
  xiS: number,
];

export type RateFreeLand2017ContinuousInputV1 = Readonly<{
  freeCalciumUM: number;
  landStretch: number;
}>;

export type RateFreeLand2017BackwardEulerInputV1 = Readonly<{
  freeCalciumUM: number;
  previousLandStretch: number;
  stageLandStretch: number;
  dtSec: number;
}>;

export type RateFreeLand2017OutputV1 = Readonly<{
  modelId: typeof RATE_FREE_LAND2017_V1_ID;
  sourceOutput: LandSourceOutput;
  reconstructedSourceState: readonly number[];
  landStretch: number;
  landStretchRatePerSec: number;
  strainRateUsedByStateEquations: false;
  sourceStressConvention: "land2017-Ta";
}>;

export type RateFreeLand2017BackwardEulerEquivalenceAuditV1 = Readonly<{
  auditId: "land2017-rate-free-xi-backward-euler-source-equivalence-v1";
  sourcePreviousState: readonly number[];
  sourceNextState: readonly number[];
  rateFreeResidual: readonly number[];
  sourceResidual: readonly number[];
  residualDifference: readonly number[];
  maximumAbsoluteResidualDifference: number;
  rateFreeOutput: RateFreeLand2017OutputV1;
  sourceOutput: LandSourceOutput;
  activeStressDifferencePa: number;
  sourceRateReconstructedForAuditOnly: true;
  productionStateResidualUsesStrainRate: false;
  projectionApplied: false;
}>;

export function sourceLand2017StateToRateFreeV1(
  sourceState: ArrayLike<number>,
  landStretch: number,
  parameterSet: Land2017EquationParameters,
): RateFreeLand2017StateV1 {
  assertLand2017StateVectorLength(sourceState, "source Land state");
  validateLand2017EquationState(sourceState);
  const lambda = requirePositiveFinite(landStretch, "landStretch");
  const distortion = landDistortionEquivalenceParametersV1(parameterSet.derived);
  const xi = sourceZetaToRateFreeXiV1({
    w: sourceState[LAND2017_STATE_INDEX.zetaW],
    s: sourceState[LAND2017_STATE_INDEX.zetaS],
  }, lambda, distortion);
  return frozenRateFreeState([
    sourceState[LAND2017_STATE_INDEX.CaTRPN],
    sourceState[LAND2017_STATE_INDEX.B],
    sourceState[LAND2017_STATE_INDEX.W],
    sourceState[LAND2017_STATE_INDEX.S],
    xi.w,
    xi.s,
  ]);
}

export function rateFreeLand2017StateToSourceV1(
  rateFreeState: ArrayLike<number>,
  landStretch: number,
  parameterSet: Land2017EquationParameters,
): Float64Array {
  assertLand2017StateVectorLength(rateFreeState, "rate-free Land state");
  const lambda = requirePositiveFinite(landStretch, "landStretch");
  const distortion = landDistortionEquivalenceParametersV1(parameterSet.derived);
  const zeta = rateFreeXiToSourceZetaV1({
    w: requireFinite(rateFreeState[4], "rateFreeState.xiW"),
    s: requireFinite(rateFreeState[5], "rateFreeState.xiS"),
  }, lambda, distortion);
  const sourceState = Float64Array.from([
    requireFinite(rateFreeState[0], "rateFreeState.CaTRPN"),
    requireFinite(rateFreeState[1], "rateFreeState.B"),
    requireFinite(rateFreeState[2], "rateFreeState.W"),
    requireFinite(rateFreeState[3], "rateFreeState.S"),
    zeta.w,
    zeta.s,
  ]);
  validateLand2017EquationState(sourceState);
  return sourceState;
}

export function writeRateFreeLand2017RhsV1(
  rateFreeState: ArrayLike<number>,
  input: RateFreeLand2017ContinuousInputV1,
  parameterSet: Land2017EquationParameters,
  out: Float64Array = new Float64Array(LAND2017_STATE_SIZE),
): Float64Array {
  validateContinuousInput(input);
  assertLand2017StateVectorLength(out, "rate-free Land RHS output");
  const sourceState = rateFreeLand2017StateToSourceV1(
    rateFreeState,
    input.landStretch,
    parameterSet,
  );
  const sourceRhsWithZeroStretchRate = writeLand2017Rhs(
    sourceState,
    {
      freeCalciumUM: input.freeCalciumUM,
      fiberEngineeringStrain: input.landStretch - 1,
      fiberEngineeringStrainRatePerSec: 0,
      zetaDriveFiberEngineeringStrainRatePerSec: 0,
    },
    parameterSet,
  );
  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    out[index] = requireFinite(
      sourceRhsWithZeroStretchRate[index],
      "rate-free Land RHS[" + index + "]",
    );
  }
  return out;
}

export function writeRateFreeLand2017BackwardEulerResidualV1(
  next: ArrayLike<number>,
  previous: ArrayLike<number>,
  input: RateFreeLand2017BackwardEulerInputV1,
  parameterSet: Land2017EquationParameters,
  out: Float64Array = new Float64Array(LAND2017_STATE_SIZE),
): Float64Array {
  validateBackwardEulerInput(input);
  assertLand2017StateVectorLength(next, "rate-free Land BE next state");
  assertLand2017StateVectorLength(previous, "rate-free Land BE previous state");
  assertLand2017StateVectorLength(out, "rate-free Land BE residual output");
  rateFreeLand2017StateToSourceV1(previous, input.previousLandStretch, parameterSet);
  const rhs = writeRateFreeLand2017RhsV1(next, {
    freeCalciumUM: input.freeCalciumUM,
    landStretch: input.stageLandStretch,
  }, parameterSet);
  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    out[index] = requireFinite(
      next[index] - previous[index] - input.dtSec * rhs[index],
      "rate-free Land BE residual[" + index + "]",
    );
  }
  return out;
}

export function writeRateFreeLand2017BackwardEulerResidualJacobianV1(
  next: ArrayLike<number>,
  input: RateFreeLand2017BackwardEulerInputV1,
  parameterSet: Land2017EquationParameters,
  out: Float64Array = new Float64Array(LAND2017_STATE_SIZE * LAND2017_STATE_SIZE),
): Float64Array {
  validateBackwardEulerInput(input);
  if (out.length !== LAND2017_STATE_SIZE * LAND2017_STATE_SIZE) {
    throw new Error("rate-free Land BE Jacobian output must contain 36 entries");
  }
  const sourceNext = rateFreeLand2017StateToSourceV1(
    next,
    input.stageLandStretch,
    parameterSet,
  );
  const sourceJacobian = writeLand2017BackwardEulerResidualJacobian(
    sourceNext,
    sourceStepInput(input),
    parameterSet,
    out,
  );
  if (!Array.from(sourceJacobian).every(Number.isFinite)) {
    throw new Error("rate-free Land BE Jacobian must remain finite");
  }
  return sourceJacobian;
}

export function evaluateRateFreeLand2017OutputV1(
  rateFreeState: ArrayLike<number>,
  input: RateFreeLand2017ContinuousInputV1,
  landStretchRatePerSec: number,
  parameterSet: Land2017EquationParameters,
): RateFreeLand2017OutputV1 {
  validateContinuousInput(input);
  const lambdaRate = requireFinite(
    landStretchRatePerSec,
    "landStretchRatePerSec",
  );
  const sourceState = rateFreeLand2017StateToSourceV1(
    rateFreeState,
    input.landStretch,
    parameterSet,
  );
  const sourceOutput = evaluateLand2017ContinuousOutput(
    sourceState,
    {
      freeCalciumUM: input.freeCalciumUM,
      fiberEngineeringStrain: input.landStretch - 1,
      fiberEngineeringStrainRatePerSec: lambdaRate,
      zetaDriveFiberEngineeringStrainRatePerSec: lambdaRate,
    },
    parameterSet,
  );
  return Object.freeze({
    modelId: RATE_FREE_LAND2017_V1_ID,
    sourceOutput,
    reconstructedSourceState: Object.freeze(Array.from(sourceState)),
    landStretch: input.landStretch,
    landStretchRatePerSec: lambdaRate,
    strainRateUsedByStateEquations: false,
    sourceStressConvention: "land2017-Ta",
  });
}

export function auditRateFreeLand2017BackwardEulerEquivalenceV1(input: Readonly<{
  previousRateFreeState: ArrayLike<number>;
  nextRateFreeState: ArrayLike<number>;
  step: RateFreeLand2017BackwardEulerInputV1;
  parameterSet: Land2017EquationParameters;
}>): RateFreeLand2017BackwardEulerEquivalenceAuditV1 {
  assertExactPlainRecordV1(
    input,
    ["previousRateFreeState", "nextRateFreeState", "step", "parameterSet"],
    "rate-free Land BE equivalence audit input",
  );
  validateBackwardEulerInput(input.step);
  const sourcePreviousState = rateFreeLand2017StateToSourceV1(
    input.previousRateFreeState,
    input.step.previousLandStretch,
    input.parameterSet,
  );
  const sourceNextState = rateFreeLand2017StateToSourceV1(
    input.nextRateFreeState,
    input.step.stageLandStretch,
    input.parameterSet,
  );
  const rateFreeResidual = writeRateFreeLand2017BackwardEulerResidualV1(
    input.nextRateFreeState,
    input.previousRateFreeState,
    input.step,
    input.parameterSet,
  );
  const sourceStep = sourceStepInput(input.step);
  const sourceResidual = writeLand2017BackwardEulerResidual(
    sourceNextState,
    sourcePreviousState,
    sourceStep,
    input.parameterSet,
  );
  const residualDifference = Float64Array.from(rateFreeResidual, (value, index) =>
    value - sourceResidual[index]);
  const landStretchRatePerSec = (
    input.step.stageLandStretch - input.step.previousLandStretch
  ) / input.step.dtSec;
  const rateFreeOutput = evaluateRateFreeLand2017OutputV1(
    input.nextRateFreeState,
    {
      freeCalciumUM: input.step.freeCalciumUM,
      landStretch: input.step.stageLandStretch,
    },
    landStretchRatePerSec,
    input.parameterSet,
  );
  const sourceOutput = evaluateLand2017ContinuousOutput(
    sourceNextState,
    {
      freeCalciumUM: input.step.freeCalciumUM,
      fiberEngineeringStrain: input.step.stageLandStretch - 1,
      fiberEngineeringStrainRatePerSec: landStretchRatePerSec,
      zetaDriveFiberEngineeringStrainRatePerSec: landStretchRatePerSec,
    },
    input.parameterSet,
  );
  return Object.freeze({
    auditId: "land2017-rate-free-xi-backward-euler-source-equivalence-v1",
    sourcePreviousState: Object.freeze(Array.from(sourcePreviousState)),
    sourceNextState: Object.freeze(Array.from(sourceNextState)),
    rateFreeResidual: Object.freeze(Array.from(rateFreeResidual)),
    sourceResidual: Object.freeze(Array.from(sourceResidual)),
    residualDifference: Object.freeze(Array.from(residualDifference)),
    maximumAbsoluteResidualDifference: maxAbs(residualDifference),
    rateFreeOutput,
    sourceOutput,
    activeStressDifferencePa:
      rateFreeOutput.sourceOutput.sourceActiveFiberStressPa
      - sourceOutput.sourceActiveFiberStressPa,
    sourceRateReconstructedForAuditOnly: true,
    productionStateResidualUsesStrainRate: false,
    projectionApplied: false,
  });
}

function sourceStepInput(
  input: RateFreeLand2017BackwardEulerInputV1,
): LandStepInput {
  return {
    freeCalciumUM: input.freeCalciumUM,
    previousFiberEngineeringStrain: input.previousLandStretch - 1,
    stageFiberEngineeringStrain: input.stageLandStretch - 1,
    dtSec: input.dtSec,
    stage: { scheme: "BE", stageIndex: 0 },
  };
}

function validateContinuousInput(
  input: RateFreeLand2017ContinuousInputV1,
): void {
  assertExactPlainRecordV1(
    input,
    ["freeCalciumUM", "landStretch"],
    "rate-free Land continuous input",
  );
  requireNonNegativeFinite(input.freeCalciumUM, "freeCalciumUM");
  requirePositiveFinite(input.landStretch, "landStretch");
}

function validateBackwardEulerInput(
  input: RateFreeLand2017BackwardEulerInputV1,
): void {
  assertExactPlainRecordV1(
    input,
    ["freeCalciumUM", "previousLandStretch", "stageLandStretch", "dtSec"],
    "rate-free Land BE input",
  );
  requireNonNegativeFinite(input.freeCalciumUM, "freeCalciumUM");
  requirePositiveFinite(input.previousLandStretch, "previousLandStretch");
  requirePositiveFinite(input.stageLandStretch, "stageLandStretch");
  requirePositiveFinite(input.dtSec, "dtSec");
}

function frozenRateFreeState(values: readonly number[]): RateFreeLand2017StateV1 {
  if (values.length !== LAND2017_STATE_SIZE || !values.every(Number.isFinite)) {
    throw new Error("rate-free Land state must contain six finite entries");
  }
  return Object.freeze([
    values[0],
    values[1],
    values[2],
    values[3],
    values[4],
    values[5],
  ]);
}

function maxAbs(values: ArrayLike<number>): number {
  let maximum = 0;
  for (let index = 0; index < values.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(values[index]));
  }
  return maximum;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(field + " must be finite");
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(field + " must be positive and finite");
  }
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(field + " must be nonnegative and finite");
  }
  return value;
}
