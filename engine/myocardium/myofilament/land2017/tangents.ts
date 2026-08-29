import {
  evaluateLand2017AlgebraicTerms,
  land2017CaTRPNUnblockingFactor,
  land2017CaTRPNUnblockingFactorDerivative,
  land2017GammaSu,
  land2017GammaWu,
  land2017GammaWuDerivative,
  land2017StrongToBlockedDeactivationRateDerivativePerSec,
  land2017StrongToBlockedDeactivationRatePerSec,
  land2017StrongToBlockedDeactivationRateStageStrainDerivativePerSec,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  solveLand2017BackwardEulerStep,
  solveLand2017PopulationBlock,
  type Land2017StepSolveOptions,
} from "@/engine/myocardium/myofilament/land2017/solver";
import {
  LAND2017_STATE_INDEX,
  assertLand2017StateVectorLength,
  deriveLand2017StepKinematics,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export type Land2017TangentOptions = Land2017StepSolveOptions & {
  readonly epsilonStrain?: number;
};

/**
 * Consistent derivative of the converged BE active nominal stress with
 * respect to the stage engineering strain. Smooth branches use exact implicit
 * differentiation of the same affine scalar-plus-3x3 factorization used by the
 * direct step. At zetaS=0 and zetaS=-1, where gamma_su is nonsmooth, the
 * declared centered Clarke-midpoint selection is retained.
 */
export function computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep(
  solvedNextState: ArrayLike<number>,
  input: LandStepInput,
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): number {
  assertLand2017StateVectorLength(
    solvedNextState,
    "Land 2017 consistent tangent solved state",
  );
  const p = parameterSet.values;
  const d = parameterSet.derived;
  const terms = evaluateLand2017AlgebraicTerms(
    solvedNextState,
    { fiberEngineeringStrain: input.stageFiberEngineeringStrain },
    parameterSet,
  );
  const CaTRPN = solvedNextState[LAND2017_STATE_INDEX.CaTRPN];
  const B = solvedNextState[LAND2017_STATE_INDEX.B];
  const W = solvedNextState[LAND2017_STATE_INDEX.W];
  const S = solvedNextState[LAND2017_STATE_INDEX.S];
  const zetaW = solvedNextState[LAND2017_STATE_INDEX.zetaW];
  const zetaS = solvedNextState[LAND2017_STATE_INDEX.zetaS];
  const dt = input.dtSec;
  const calciumDrive = Math.pow(
    input.freeCalciumUM / terms.CaT50,
    p.nTRPN,
  );
  const dCaT50DStageStrain = terms.lambda < 1.2 ? p.beta1 : 0;
  const dCalciumDriveDStageStrain = calciumDrive
    * (-p.nTRPN * dCaT50DStageStrain / terms.CaT50);
  const caResidualStrainDerivative = -dt
    * p.kTRPN
    * dCalciumDriveDStageStrain
    * (1 - CaTRPN);
  const dCaTRPNDStrain = -caResidualStrainDerivative
    / (1 + dt * p.kTRPN * (calciumDrive + 1));

  deriveLand2017StepKinematics(input);
  const zetaDriveDependsOnStageStrain =
    input.stageZetaDriveFiberEngineeringStrainRatePerSec === undefined;
  const dZetaWDStrain = zetaDriveDependsOnStageStrain
    ? d.Aw / (1 + dt * d.cw)
    : 0;
  const dZetaSDStrain = zetaDriveDependsOnStageStrain
    ? d.As / (1 + dt * d.cs)
    : 0;
  const nTmHalf = p.nTm / 2;
  const unblocking = land2017CaTRPNUnblockingFactor(CaTRPN, p);
  const bindingRate = d.kb * unblocking;
  const unbindingRate = p.ku * Math.pow(CaTRPN, nTmHalf);
  const weakLossRate =
    d.kwu + p.kws + land2017GammaWu(zetaW, p);
  const strongLossRate = d.ksu + land2017GammaSu(zetaS, p);
  const strongToBlockedRate =
    land2017StrongToBlockedDeactivationRatePerSec(
      CaTRPN,
      parameterSet,
      {
        freeCalciumUM: input.freeCalciumUM,
        fiberEngineeringStrain: input.stageFiberEngineeringStrain,
      },
    );
  const strongToBlockedRateDerivative =
    land2017StrongToBlockedDeactivationRateDerivativePerSec(
      CaTRPN,
      parameterSet,
      {
        freeCalciumUM: input.freeCalciumUM,
        fiberEngineeringStrain: input.stageFiberEngineeringStrain,
      },
    );
  const strongToBlockedRateStrainDerivative =
    land2017StrongToBlockedDeactivationRateStageStrainDerivativePerSec(
      CaTRPN,
      parameterSet,
      {
        freeCalciumUM: input.freeCalciumUM,
        fiberEngineeringStrain: input.stageFiberEngineeringStrain,
      },
    );
  const dBResidualDCaTRPN = -dt * (
    d.kb
      * land2017CaTRPNUnblockingFactorDerivative(CaTRPN, p)
      * terms.U
    - p.ku
      * nTmHalf
      * Math.pow(CaTRPN, nTmHalf - 1)
      * B
    + strongToBlockedRateDerivative * S
  );
  const dWResidualDZetaW =
    dt * W * land2017GammaWuDerivative(zetaW, p);
  const dSResidualDZetaS =
    dt * S * centralSemismoothGammaSuDerivative(zetaS, p.gammaS);
  const dSResidualDCaTRPN =
    dt * strongToBlockedRateDerivative * S;
  const dBResidualDStrain =
    -dt * strongToBlockedRateStrainDerivative * S;
  const dSResidualDStrain =
    dt * strongToBlockedRateStrainDerivative * S;
  const populationDerivative = solveLand2017PopulationBlock(
    1 + dt * (bindingRate + unbindingRate),
    dt * bindingRate,
    dt * (bindingRate - strongToBlockedRate),
    dt * p.kuw,
    1 + dt * (p.kuw + weakLossRate),
    dt * p.kuw,
    -dt * p.kws,
    1 + dt * (strongLossRate + strongToBlockedRate),
    -dBResidualDCaTRPN * dCaTRPNDStrain - dBResidualDStrain,
    -dWResidualDZetaW * dZetaWDStrain,
    -dSResidualDCaTRPN * dCaTRPNDStrain
      - dSResidualDZetaS * dZetaSDStrain - dSResidualDStrain,
  );
  const populationDistortion = S * (zetaS + 1) + W * zetaW;
  const stressScalePa = terms.h * p.Tref / p.rs;
  let tangentPa = land2017LengthFactorDerivative(terms.lambda, p.beta0)
    * p.Tref / p.rs
    * populationDistortion;
  tangentPa += stressScalePa * (
    zetaW * populationDerivative[1]
    + (zetaS + 1) * populationDerivative[2]
    + W * dZetaWDStrain
    + S * dZetaSDStrain
  );
  if (!Number.isFinite(tangentPa)) {
    throw new Error("Land 2017 consistent tangent is non-finite");
  }
  return tangentPa;
}

/**
 * Exact strain derivative of a fixed-calcium, zero-rate Land equilibrium.
 * This is the constitutive tangent of the cold-initialization map, not a
 * one-step BE tangent.
 */
export function computeLand2017SteadyStateTangentPaFromSolvedState(
  solvedState: ArrayLike<number>,
  freeCalciumUM: number,
  fiberEngineeringStrain: number,
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): number {
  assertLand2017StateVectorLength(
    solvedState,
    "Land 2017 steady tangent solved state",
  );
  const p = parameterSet.values;
  const d = parameterSet.derived;
  const terms = evaluateLand2017AlgebraicTerms(
    solvedState,
    { fiberEngineeringStrain },
    parameterSet,
  );
  const CaTRPN = solvedState[LAND2017_STATE_INDEX.CaTRPN];
  const B = solvedState[LAND2017_STATE_INDEX.B];
  const S = solvedState[LAND2017_STATE_INDEX.S];
  const calciumDrive = Math.pow(freeCalciumUM / terms.CaT50, p.nTRPN);
  const dCaT50DStrain = terms.lambda < 1.2 ? p.beta1 : 0;
  const dCalciumDriveDStrain = calciumDrive
    * (-p.nTRPN * dCaT50DStrain / terms.CaT50);
  const dCaTRPNDStrain =
    dCalciumDriveDStrain / ((calciumDrive + 1) * (calciumDrive + 1));
  const nTmHalf = p.nTm / 2;
  const bindingRate =
    d.kb * land2017CaTRPNUnblockingFactor(CaTRPN, p);
  const unbindingRate = p.ku * Math.pow(CaTRPN, nTmHalf);
  const strongToBlockedRate =
    land2017StrongToBlockedDeactivationRatePerSec(
      CaTRPN,
      parameterSet,
      { freeCalciumUM, fiberEngineeringStrain },
    );
  const strongToBlockedRateDerivative =
    land2017StrongToBlockedDeactivationRateDerivativePerSec(
      CaTRPN,
      parameterSet,
      { freeCalciumUM, fiberEngineeringStrain },
    );
  const dPopulationResidualDCaTRPN = -(
    d.kb
      * land2017CaTRPNUnblockingFactorDerivative(CaTRPN, p)
      * terms.U
    - p.ku
      * nTmHalf
      * Math.pow(CaTRPN, nTmHalf - 1)
      * B
    + strongToBlockedRateDerivative * S
  );
  const dStrongPopulationResidualDCaTRPN =
    strongToBlockedRateDerivative * S;
  const populationDerivative = solveLand2017PopulationBlock(
    bindingRate + unbindingRate,
    bindingRate,
    bindingRate - strongToBlockedRate,
    p.kuw,
    p.kuw + d.kwu + p.kws,
    p.kuw,
    -p.kws,
    d.ksu + strongToBlockedRate,
    -dPopulationResidualDCaTRPN * dCaTRPNDStrain,
    0,
    -dStrongPopulationResidualDCaTRPN * dCaTRPNDStrain,
  );
  const populationDistortion = S;
  const stressScalePa = terms.h * p.Tref / p.rs;
  const tangentPa =
    land2017LengthFactorDerivative(terms.lambda, p.beta0)
      * p.Tref / p.rs
      * populationDistortion
    + stressScalePa * populationDerivative[2];
  if (!Number.isFinite(tangentPa)) {
    throw new Error("Land 2017 steady-state tangent is non-finite");
  }
  return tangentPa;
}

/**
 * At the two one-sided gamma_su recruitment corners, the classical derivative
 * is undefined. Retain the established midpoint of the valid one-sided
 * derivatives; away from the corners this is the exact active-branch slope.
 */
function centralSemismoothGammaSuDerivative(
  zetaS: number,
  gammaS: number,
): number {
  const kinkTolerance = 64 * Number.EPSILON;
  if (Math.abs(zetaS) <= kinkTolerance) {
    return 0.5 * gammaS;
  }
  if (Math.abs(zetaS + 1) <= kinkTolerance) {
    return -0.5 * gammaS;
  }
  if (zetaS < -1) return -gammaS;
  if (zetaS > 0) return gammaS;
  return 0;
}

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
