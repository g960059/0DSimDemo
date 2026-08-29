import {
  evaluateLand2017AlgebraicTerms,
  land2017CaTRPNUnblockingFactor,
  land2017GammaSu,
  land2017GammaWu,
  land2017StrongBridgeDeactivationExitRatePerSec,
  validateLand2017ContinuousInput,
  validateLand2017EquationState,
  writeLand2017Rhs,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { evaluateLand2017StepOutput } from "@/engine/myocardium/myofilament/land2017/outputs";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { writeLand2017BackwardEulerResidual } from "@/engine/myocardium/myofilament/land2017/residual";
import {
  LAND2017_SDIRK2_GAMMA,
  evaluateLand2017Sdirk2StageOutput,
  land2017Sdirk2Stage0ContinuousInput,
  land2017Sdirk2StageContinuousInput,
  writeLand2017Sdirk2StageResidual,
  type Land2017Sdirk2StageInput,
} from "@/engine/myocardium/myofilament/land2017/sdirk2";
import {
  LAND2017_STATE_INDEX,
  LAND2017_STATE_SIZE,
  deriveLand2017StepKinematics,
  type LandContinuousInput,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export type Land2017SolveFailureReason =
  | "domain-error"
  | "line-search-failed"
  | "max-iterations"
  | "nonfinite-residual"
  | "residual-postcondition-failed"
  | "singular-jacobian";

export type Land2017StepSolveOptions = {
  /** Legacy Newton-oracle compatibility; ignored by the direct solve. */
  readonly maxIterations?: number;
  readonly residualTolerance?: number;
  /** Legacy Newton-oracle compatibility; ignored by the direct solve. */
  readonly lineSearchMinStep?: number;
  /** Legacy Newton-oracle compatibility; ignored by the direct solve. */
  readonly lineSearchReduction?: number;
  /** Used only as failure readback; it is not an input to the direct solve. */
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
  readonly sdirk2Stage0?: Land2017Sdirk2StageSolveSummary;
  readonly sdirk2Stage1?: Land2017Sdirk2StageSolveSummary;
};

export type Land2017SubstepSolveOptions = Land2017StepSolveOptions & {
  readonly substeps?: number;
  readonly previousFreeCalciumUM?: number;
};

export type Land2017Sdirk2StepSolveOptions = Land2017StepSolveOptions & {
  readonly previousFreeCalciumUM?: number;
};

export type Land2017Sdirk2StageSolveSummary = {
  readonly stageIndex: 0 | 1;
  readonly ok: boolean;
  readonly iterations: number;
  readonly residualNorm: number;
  readonly lineSearchSteps: number;
  readonly failureReason?: Land2017SolveFailureReason;
  readonly failureMessage?: string;
};

const DEFAULT_RESIDUAL_TOLERANCE = 1e-9;

/**
 * Exact solution of the six Land 2017 backward-Euler equations.
 *
 * For fixed end-step strain and calcium, CaTRPN, zetaW, and zetaS are affine
 * scalar equations. Their solved values fix all coefficients in the remaining
 * affine B/W/S population block, which is solved by a specialized 3x3 LU.
 */
export function solveLand2017BackwardEulerStep(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017StepSolveOptions = {},
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017StepSolveResult {
  const previousValidation = validatePreviousState(previous);
  if (previousValidation.ok === false) {
    return failed(
      Float64Array.from(options.initialGuess ?? previous),
      Number.POSITIVE_INFINITY,
      "domain-error",
      previousValidation.message,
    );
  }

  let next: Float64Array;
  try {
    const kinematics = deriveLand2017StepKinematics(input);
    next = solveLand2017AffineStage(
      previous,
      input.dtSec,
      {
        freeCalciumUM: input.freeCalciumUM,
        fiberEngineeringStrain: input.stageFiberEngineeringStrain,
        fiberEngineeringStrainRatePerSec:
          kinematics.stageFiberEngineeringStrainRatePerSec,
        zetaDriveFiberEngineeringStrainRatePerSec:
          kinematics.stageZetaDriveFiberEngineeringStrainRatePerSec,
      },
      parameterSet,
    );
  } catch (error) {
    return failed(
      Float64Array.from(options.initialGuess ?? previous),
      Number.POSITIVE_INFINITY,
      classifyDirectSolveError(error),
      errorMessage(error),
    );
  }

  return finishDirectSolve(
    next,
    options.residualTolerance ?? DEFAULT_RESIDUAL_TOLERANCE,
    () => writeLand2017BackwardEulerResidual(next, previous, input, parameterSet),
    () => evaluateLand2017StepOutput(next, input, parameterSet),
  );
}

export function solveLand2017BackwardEulerSubsteps(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017SubstepSolveOptions = {},
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017StepSolveResult {
  const substeps = options.substeps ?? 1;
  if (!Number.isInteger(substeps) || substeps <= 0) {
    throw new Error("Land 2017 substeps must be a positive integer");
  }
  if (substeps === 1) {
    return solveLand2017BackwardEulerStep(previous, input, options, parameterSet);
  }

  let state = Float64Array.from(previous);
  const previousFreeCalciumUM =
    options.previousFreeCalciumUM ?? input.freeCalciumUM;
  let lastOutput: LandSourceOutput | undefined;
  let maximumResidualNorm = 0;

  for (let substep = 0; substep < substeps; substep += 1) {
    const startFraction = substep / substeps;
    const endFraction = (substep + 1) / substeps;
    const substepInput: LandStepInput = {
      freeCalciumUM: interpolate(
        previousFreeCalciumUM,
        input.freeCalciumUM,
        endFraction,
      ),
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
      ...(input.stageZetaDriveFiberEngineeringStrainRatePerSec === undefined
        ? {}
        : {
          stageZetaDriveFiberEngineeringStrainRatePerSec:
            input.stageZetaDriveFiberEngineeringStrainRatePerSec,
        }),
      dtSec: input.dtSec / substeps,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const result = solveLand2017BackwardEulerStep(
      state,
      substepInput,
      options,
      parameterSet,
    );
    if (!result.ok) return { ...result, substeps };
    state = result.nextState;
    lastOutput = result.output;
    maximumResidualNorm = Math.max(maximumResidualNorm, result.residualNorm);
  }

  return {
    ok: true,
    nextState: state,
    output: lastOutput ?? evaluateLand2017StepOutput(state, input, parameterSet),
    iterations: 0,
    residualNorm: maximumResidualNorm,
    lineSearchSteps: 0,
    substeps,
    stepRejected: false,
  };
}

export function solveLand2017Sdirk2Step(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017Sdirk2StepSolveOptions = {},
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017StepSolveResult {
  const previousValidation = validatePreviousState(previous);
  if (previousValidation.ok === false) {
    return failed(
      Float64Array.from(options.initialGuess ?? previous),
      Number.POSITIVE_INFINITY,
      "domain-error",
      previousValidation.message,
    );
  }
  const previousFreeCalciumUM =
    options.previousFreeCalciumUM ?? input.freeCalciumUM;
  const stage0FiberEngineeringStrain = interpolate(
    input.previousFiberEngineeringStrain,
    input.stageFiberEngineeringStrain,
    LAND2017_SDIRK2_GAMMA,
  );
  const stage0Input: Land2017Sdirk2StageInput = {
    freeCalciumUM: interpolate(
      previousFreeCalciumUM,
      input.freeCalciumUM,
      LAND2017_SDIRK2_GAMMA,
    ),
    previousFiberEngineeringStrain: input.previousFiberEngineeringStrain,
    stageFiberEngineeringStrain: stage0FiberEngineeringStrain,
    dtSec: input.dtSec,
    stage: {
      scheme: "SDIRK2",
      stageIndex: 0,
      gamma: LAND2017_SDIRK2_GAMMA,
    },
  };
  const stage0 = solveLand2017DirectSdirk2Stage(
    previous,
    previous,
    stage0Input,
    options,
    parameterSet,
  );
  const stage0Summary = sdirk2StageSummary(0, stage0);
  if (!stage0.ok) {
    return { ...stage0, substeps: 2, sdirk2Stage0: stage0Summary };
  }

  const stage1Input: Land2017Sdirk2StageInput = {
    freeCalciumUM: input.freeCalciumUM,
    previousFiberEngineeringStrain: input.previousFiberEngineeringStrain,
    stageFiberEngineeringStrain: input.stageFiberEngineeringStrain,
    dtSec: input.dtSec,
    stage: {
      scheme: "SDIRK2",
      stageIndex: 1,
      gamma: LAND2017_SDIRK2_GAMMA,
    },
    stage0: {
      state: stage0.nextState,
      fiberEngineeringStrain: stage0FiberEngineeringStrain,
      cavityVolumeM3: 0,
      freeCalciumUM: stage0Input.freeCalciumUM,
    },
  };
  let stage1Base: Float64Array;
  try {
    const rhs0 = writeLand2017Rhs(
      stage0.nextState,
      land2017Sdirk2Stage0ContinuousInput(stage1Input),
      parameterSet,
    );
    stage1Base = Float64Array.from(
      previous,
      (value, index) => value
        + input.dtSec * (1 - LAND2017_SDIRK2_GAMMA) * rhs0[index]!,
    );
  } catch (error) {
    const stage1Failure = failed(
      stage0.nextState,
      Number.POSITIVE_INFINITY,
      "domain-error",
      errorMessage(error),
    );
    return {
      ...stage1Failure,
      substeps: 2,
      sdirk2Stage0: stage0Summary,
      sdirk2Stage1: sdirk2StageSummary(1, stage1Failure),
    };
  }
  const stage1 = solveLand2017DirectSdirk2Stage(
    previous,
    stage1Base,
    stage1Input,
    options,
    parameterSet,
  );
  return {
    ...stage1,
    residualNorm: Math.max(stage0.residualNorm, stage1.residualNorm),
    substeps: 2,
    sdirk2Stage0: stage0Summary,
    sdirk2Stage1: sdirk2StageSummary(1, stage1),
  };
}

/**
 * Solves y = base + dt*f(y), where f is the Land 2017 affine stage RHS.
 * SDIRK2 stage one uses a base containing its already evaluated explicit
 * stage-zero contribution and dt = gamma*stepDt.
 */
export function solveLand2017AffineStage(
  base: ArrayLike<number>,
  implicitDtSec: number,
  continuousInput: LandContinuousInput,
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Float64Array {
  if (base.length !== LAND2017_STATE_SIZE) {
    throw new Error("Land 2017 affine stage base must contain six states");
  }
  if (!(implicitDtSec > 0) || !Number.isFinite(implicitDtSec)) {
    throw new Error("Land 2017 affine stage dt must be positive and finite");
  }
  const p = parameterSet.values;
  const d = parameterSet.derived;
  validateLand2017ContinuousInput(continuousInput, p);

  const lambda = 1 + continuousInput.fiberEngineeringStrain;
  const caT50 = p.CaT50Ref + p.beta1 * (Math.min(lambda, 1.2) - 1);
  const caDrive = Math.pow(
    continuousInput.freeCalciumUM / caT50,
    p.nTRPN,
  );
  const caTRPN = (
    base[LAND2017_STATE_INDEX.CaTRPN]
    + implicitDtSec * p.kTRPN * caDrive
  ) / (1 + implicitDtSec * p.kTRPN * (caDrive + 1));
  const zetaDrive =
    continuousInput.zetaDriveFiberEngineeringStrainRatePerSec
    ?? continuousInput.fiberEngineeringStrainRatePerSec;
  const zetaW = (
    base[LAND2017_STATE_INDEX.zetaW] + implicitDtSec * d.Aw * zetaDrive
  ) / (1 + implicitDtSec * d.cw);
  const zetaS = (
    base[LAND2017_STATE_INDEX.zetaS] + implicitDtSec * d.As * zetaDrive
  ) / (1 + implicitDtSec * d.cs);

  const bindingRate =
    d.kb * land2017CaTRPNUnblockingFactor(caTRPN, p);
  const unbindingRate = p.ku * Math.pow(caTRPN, p.nTm / 2);
  const weakLossRate =
    d.kwu + p.kws + land2017GammaWu(zetaW, p);
  const strongLossRate = d.ksu + land2017GammaSu(zetaS, p);
  const strongBridgeDeactivationExitRate =
    land2017StrongBridgeDeactivationExitRatePerSec(
      caTRPN,
      parameterSet,
      continuousInput,
    );
  const population = solveLand2017PopulationStageWithDeactivationExit(
    base,
    implicitDtSec,
    bindingRate,
    unbindingRate,
    weakLossRate,
    strongLossRate,
    strongBridgeDeactivationExitRate,
    parameterSet,
  );
  const next = new Float64Array(LAND2017_STATE_SIZE);
  next[LAND2017_STATE_INDEX.CaTRPN] = caTRPN;
  next[LAND2017_STATE_INDEX.B] = population[0];
  next[LAND2017_STATE_INDEX.W] = population[1];
  next[LAND2017_STATE_INDEX.S] = population[2];
  next[LAND2017_STATE_INDEX.zetaW] = zetaW;
  next[LAND2017_STATE_INDEX.zetaS] = zetaS;
  validateLand2017EquationState(next);
  return next;
}

function solveLand2017PopulationStageWithDeactivationExit(
  base: ArrayLike<number>,
  implicitDtSec: number,
  bindingRate: number,
  unbindingRate: number,
  weakLossRate: number,
  strongLossRate: number,
  deactivationRatePerSec: number,
  parameterSet: Land2017EquationParameters,
): readonly [number, number, number] {
  const p = parameterSet.values;
  const extension = parameterSet.strongBridgeDeactivationExit;
  const solveBranch = (
    branchRatePerSec: number,
    equilibriumStrongToWeakRatio: number,
  ) => {
    const exitsToBlocked = extension?.exitDestination === "blocked";
    return solveLand2017PopulationBlock(
      1 + implicitDtSec * (bindingRate + unbindingRate),
      implicitDtSec * (
        bindingRate
        + (exitsToBlocked
          ? branchRatePerSec * equilibriumStrongToWeakRatio
          : 0)
      ),
      implicitDtSec * (
        bindingRate - (exitsToBlocked ? branchRatePerSec : 0)
      ),
      implicitDtSec * p.kuw,
      1 + implicitDtSec * (p.kuw + weakLossRate),
      implicitDtSec * p.kuw,
      -implicitDtSec * (
        p.kws + branchRatePerSec * equilibriumStrongToWeakRatio
      ),
      1 + implicitDtSec * (strongLossRate + branchRatePerSec),
      base[LAND2017_STATE_INDEX.B] + implicitDtSec * bindingRate,
      base[LAND2017_STATE_INDEX.W] + implicitDtSec * p.kuw,
      base[LAND2017_STATE_INDEX.S],
    );
  };
  if (
    extension === undefined
    || extension.strongPopulationGate === "none"
  ) {
    return solveBranch(deactivationRatePerSec, 0);
  }
  const equilibriumStrongToWeakRatio = p.kws / parameterSet.derived.ksu;
  const inactive = solveBranch(0, equilibriumStrongToWeakRatio);
  const inactiveExcess = inactive[2]
    - equilibriumStrongToWeakRatio * inactive[1];
  const branchTolerance = 128 * Number.EPSILON;
  if (inactiveExcess <= branchTolerance) return inactive;
  const active = solveBranch(
    deactivationRatePerSec,
    equilibriumStrongToWeakRatio,
  );
  const activeExcess = active[2]
    - equilibriumStrongToWeakRatio * active[1];
  if (activeExcess >= -branchTolerance) return active;
  throw new Error(
    "Land 2017 deactivation population gate has no consistent affine branch",
  );
}

/**
 * Specialized LU for
 *
 *   [a00 a01 a02] [x0]   [b0]
 *   [a10 a11 a12] [x1] = [b1]
 *   [  0 a21 a22] [x2]   [b2].
 */
export function solveLand2017PopulationBlock(
  a00: number,
  a01: number,
  a02: number,
  a10: number,
  a11: number,
  a12: number,
  a21: number,
  a22: number,
  b0: number,
  b1: number,
  b2: number,
): readonly [number, number, number] {
  const scale = Math.max(
    1,
    Math.abs(a00),
    Math.abs(a01),
    Math.abs(a02),
    Math.abs(a10),
    Math.abs(a11),
    Math.abs(a12),
    Math.abs(a21),
    Math.abs(a22),
  );
  if (!(Math.abs(a00) > 1e-14 * scale)) {
    throw new Error("Land 2017 population block is singular at B pivot");
  }
  const multiplier10 = a10 / a00;
  const reduced11 = a11 - multiplier10 * a01;
  const reduced12 = a12 - multiplier10 * a02;
  const reducedB1 = b1 - multiplier10 * b0;
  if (!(Math.abs(reduced11) > 1e-14 * scale)) {
    throw new Error("Land 2017 population block is singular at W pivot");
  }
  const multiplier21 = a21 / reduced11;
  const reduced22 = a22 - multiplier21 * reduced12;
  const reducedB2 = b2 - multiplier21 * reducedB1;
  if (!(Math.abs(reduced22) > 1e-14 * scale)) {
    throw new Error("Land 2017 population block is singular at S pivot");
  }
  const x2 = reducedB2 / reduced22;
  const x1 = (reducedB1 - reduced12 * x2) / reduced11;
  const x0 = (b0 - a01 * x1 - a02 * x2) / a00;
  if (
    !Number.isFinite(x0)
    || !Number.isFinite(x1)
    || !Number.isFinite(x2)
  ) {
    throw new Error("Land 2017 population block solution is non-finite");
  }
  return [x0, x1, x2];
}

function solveLand2017DirectSdirk2Stage(
  previous: ArrayLike<number>,
  base: ArrayLike<number>,
  input: Land2017Sdirk2StageInput,
  options: Land2017StepSolveOptions,
  parameterSet: Land2017EquationParameters,
): Land2017StepSolveResult {
  let next: Float64Array;
  try {
    next = solveLand2017AffineStage(
      base,
      input.dtSec * LAND2017_SDIRK2_GAMMA,
      land2017Sdirk2StageContinuousInput(input),
      parameterSet,
    );
  } catch (error) {
    return failed(
      Float64Array.from(options.initialGuess ?? previous),
      Number.POSITIVE_INFINITY,
      classifyDirectSolveError(error),
      errorMessage(error),
    );
  }
  return finishDirectSolve(
    next,
    options.residualTolerance ?? DEFAULT_RESIDUAL_TOLERANCE,
    () => writeLand2017Sdirk2StageResidual(
      next,
      previous,
      input,
      parameterSet,
    ),
    () => evaluateLand2017Sdirk2StageOutput(next, input, parameterSet),
  );
}

function finishDirectSolve(
  next: Float64Array,
  residualTolerance: number,
  residual: () => Float64Array,
  output: () => LandSourceOutput,
): Land2017StepSolveResult {
  let residualNorm: number;
  try {
    validateLand2017EquationState(next);
    residualNorm = infinityNorm(residual());
  } catch (error) {
    return failed(
      next,
      Number.POSITIVE_INFINITY,
      "domain-error",
      errorMessage(error),
    );
  }
  if (!Number.isFinite(residualNorm)) {
    return failed(
      next,
      residualNorm,
      "nonfinite-residual",
      "Direct Land 2017 solution residual is non-finite",
    );
  }
  if (residualNorm > residualTolerance) {
    return failed(
      next,
      residualNorm,
      "residual-postcondition-failed",
      `Direct Land 2017 solution residual ${residualNorm} exceeds ${residualTolerance}`,
    );
  }
  const evaluated = output();
  if (!evaluated.health.finite) {
    return failed(
      next,
      residualNorm,
      "domain-error",
      "Direct Land 2017 solution failed population/output postconditions",
    );
  }
  return {
    ok: true,
    nextState: Float64Array.from(next),
    output: evaluated,
    iterations: 0,
    residualNorm,
    lineSearchSteps: 0,
    substeps: 1,
    stepRejected: false,
  };
}

function validatePreviousState(
  previous: ArrayLike<number>,
): { ok: true } | { ok: false; message: string } {
  try {
    validateLand2017EquationState(previous);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

function failed(
  next: ArrayLike<number>,
  residualNorm: number,
  reason: Land2017SolveFailureReason,
  message: string,
): Land2017StepSolveResult {
  return {
    ok: false,
    nextState: Float64Array.from(next),
    iterations: 0,
    residualNorm,
    lineSearchSteps: 0,
    substeps: 1,
    stepRejected: true,
    failureReason: reason,
    failureMessage: message,
  };
}

function sdirk2StageSummary(
  stageIndex: 0 | 1,
  result: Land2017StepSolveResult,
): Land2017Sdirk2StageSolveSummary {
  return {
    stageIndex,
    ok: result.ok,
    iterations: result.iterations,
    residualNorm: result.residualNorm,
    lineSearchSteps: result.lineSearchSteps,
    failureReason: result.failureReason,
    failureMessage: result.failureMessage,
  };
}

function infinityNorm(values: ArrayLike<number>): number {
  let norm = 0;
  for (let index = 0; index < values.length; index += 1) {
    norm = Math.max(norm, Math.abs(values[index]!));
  }
  return norm;
}

function interpolate(start: number, end: number, fraction: number): number {
  return start + (end - start) * fraction;
}

function classifyDirectSolveError(
  error: unknown,
): "domain-error" | "singular-jacobian" {
  return errorMessage(error).includes("singular")
    ? "singular-jacobian"
    : "domain-error";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
