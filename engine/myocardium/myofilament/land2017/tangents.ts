import {
  evaluateLand2017AlgebraicTerms,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  solveLand2017BackwardEulerStep,
  type Land2017StepSolveOptions,
} from "@/engine/myocardium/myofilament/land2017/solver";
import {
  LAND2017_STATE_INDEX,
  assertLand2017StateVectorLength,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export type Land2017TangentOptions = Land2017StepSolveOptions & {
  readonly epsilonStrain?: number;
};

export function computeLand2017AlgorithmicTangentPa(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017TangentOptions = {},
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): number {
  const epsilon = options.epsilonStrain ?? 1e-5;
  const plusInput = {
    ...input,
    stageFiberEngineeringStrain: input.stageFiberEngineeringStrain + epsilon,
  };
  const minusInput = {
    ...input,
    stageFiberEngineeringStrain: input.stageFiberEngineeringStrain - epsilon,
  };
  const plus = solveLand2017BackwardEulerStep(previous, plusInput, options, parameterSet);
  const minus = solveLand2017BackwardEulerStep(previous, minusInput, options, parameterSet);
  if (!plus.ok || !plus.output) {
    throw new Error(`Cannot compute Land 2017 algorithmic tangent: plus solve failed (${plus.failureReason})`);
  }
  if (!minus.ok || !minus.output) {
    throw new Error(`Cannot compute Land 2017 algorithmic tangent: minus solve failed (${minus.failureReason})`);
  }
  return (plus.output.sourceActiveFiberStressPa - minus.output.sourceActiveFiberStressPa) / (2 * epsilon);
}

export function computeLand2017FrozenStateTangentPa(
  state: ArrayLike<number>,
  input: Pick<LandStepInput, "stageFiberEngineeringStrain">,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): number {
  assertLand2017StateVectorLength(state, "Land 2017 frozen tangent state");
  const p = parameterSet.values;
  const lambda = 1 + input.stageFiberEngineeringStrain;
  const hDerivative = land2017LengthFactorDerivative(lambda, p.beta0);
  const W = state[LAND2017_STATE_INDEX.W];
  const S = state[LAND2017_STATE_INDEX.S];
  const zetaW = state[LAND2017_STATE_INDEX.zetaW];
  const zetaS = state[LAND2017_STATE_INDEX.zetaS];
  return (hDerivative * p.Tref * (S * (zetaS + 1) + W * zetaW)) / p.rs;
}

export function evaluateLand2017SolvedStepWithTangents(
  previous: ArrayLike<number>,
  input: LandStepInput,
  options: Land2017TangentOptions = {},
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
) {
  const solved = solveLand2017BackwardEulerStep(previous, input, options, parameterSet);
  if (!solved.ok || !solved.output) return solved;
  return {
    ...solved,
    output: {
      ...solved.output,
      algorithmicTangentPa: computeLand2017AlgorithmicTangentPa(previous, input, options, parameterSet),
      frozenStateTangentPa: computeLand2017FrozenStateTangentPa(solved.nextState, input, parameterSet),
    },
  };
}

export function land2017LengthFactorDerivative(lambda: number, beta0: number): number {
  const cappedLambda = Math.min(lambda, 1.2);
  const h0 = 1 + beta0 * (cappedLambda + Math.min(cappedLambda, 0.87) - 1.87);
  if (h0 <= 0 || lambda >= 1.2) return 0;
  if (cappedLambda < 0.87) return 2 * beta0;
  return beta0;
}

export function computeLand2017FrozenStateTangentByFiniteDifferencePa(
  state: ArrayLike<number>,
  input: Pick<LandStepInput, "stageFiberEngineeringStrain" | "freeCalciumUM">,
  epsilon = 1e-6,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): number {
  const plus = directStressAtStrain(state, input.stageFiberEngineeringStrain + epsilon, parameterSet);
  const minus = directStressAtStrain(state, input.stageFiberEngineeringStrain - epsilon, parameterSet);
  return (plus - minus) / (2 * epsilon);
}

function directStressAtStrain(
  state: ArrayLike<number>,
  stageFiberEngineeringStrain: number,
  parameterSet: Land2017EquationParameters,
): number {
  const p = parameterSet.values;
  const terms = evaluateLand2017AlgebraicTerms(
    state,
    { fiberEngineeringStrain: stageFiberEngineeringStrain },
    parameterSet,
  );
  const W = state[LAND2017_STATE_INDEX.W];
  const S = state[LAND2017_STATE_INDEX.S];
  const zetaW = state[LAND2017_STATE_INDEX.zetaW];
  const zetaS = state[LAND2017_STATE_INDEX.zetaS];
  return (terms.h * p.Tref * (S * (zetaS + 1) + W * zetaW)) / p.rs;
}
