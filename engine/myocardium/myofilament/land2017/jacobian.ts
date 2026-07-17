import {
  evaluateLand2017AlgebraicTerms,
  land2017CaTRPNUnblockingFactor,
  land2017CaTRPNUnblockingFactorDerivative,
  land2017GammaSuDerivative,
  land2017GammaWuDerivative,
  validateLand2017ContinuousInput,
  validateLand2017EquationState,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  LAND2017_STATE_INDEX,
  LAND2017_STATE_SIZE,
  assertLand2017StateVectorLength,
  deriveLand2017StepKinematics,
  type LandContinuousInput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export const LAND2017_LOCAL_JACOBIAN_SIZE = LAND2017_STATE_SIZE * LAND2017_STATE_SIZE;

/**
 * Exact partial derivative dR_BE/d(epsilon_stage) at fixed next state.
 * The BE kinematics own the strain-rate derivative; an explicitly prescribed
 * zeta drive is therefore held fixed.
 */
export function writeLand2017BackwardEulerResidualStageStrainDerivative(
  next: ArrayLike<number>,
  input: LandStepInput,
  parameterSet: Land2017EquationParameters =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  outDerivative: Float64Array = new Float64Array(LAND2017_STATE_SIZE),
): Float64Array {
  assertLand2017StateVectorLength(
    next,
    "Land 2017 BE residual strain derivative next state",
  );
  assertLand2017StateVectorLength(
    outDerivative,
    "Land 2017 BE residual strain derivative output",
  );
  const kinematics = deriveLand2017StepKinematics(input);
  const rhsInput: LandContinuousInput = {
    freeCalciumUM: input.freeCalciumUM,
    fiberEngineeringStrain: input.stageFiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec:
      kinematics.stageFiberEngineeringStrainRatePerSec,
    zetaDriveFiberEngineeringStrainRatePerSec:
      kinematics.stageZetaDriveFiberEngineeringStrainRatePerSec,
  };
  const p = parameterSet.values;
  const d = parameterSet.derived;
  validateLand2017ContinuousInput(rhsInput, p);
  validateLand2017EquationState(next);

  outDerivative.fill(0);
  const terms = evaluateLand2017AlgebraicTerms(next, rhsInput, parameterSet);
  const CaTRPN = next[LAND2017_STATE_INDEX.CaTRPN];
  const calciumDrive = Math.pow(
    input.freeCalciumUM / terms.CaT50,
    p.nTRPN,
  );
  const dCaT50DStageStrain = terms.lambda < 1.2 ? p.beta1 : 0;
  const dCalciumDriveDStageStrain = calciumDrive
    * (-p.nTRPN * dCaT50DStageStrain / terms.CaT50);
  outDerivative[LAND2017_STATE_INDEX.CaTRPN] = -input.dtSec
    * p.kTRPN
    * dCalciumDriveDStageStrain
    * (1 - CaTRPN);

  if (input.stageZetaDriveFiberEngineeringStrainRatePerSec === undefined) {
    outDerivative[LAND2017_STATE_INDEX.zetaW] = -d.Aw;
    outDerivative[LAND2017_STATE_INDEX.zetaS] = -d.As;
  }
  return outDerivative;
}

export function writeLand2017BackwardEulerResidualJacobian(
  next: ArrayLike<number>,
  input: LandStepInput,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  outJacobian: Float64Array = new Float64Array(LAND2017_LOCAL_JACOBIAN_SIZE),
): Float64Array {
  assertLand2017StateVectorLength(next, "Land 2017 BE residual Jacobian next state");
  if (outJacobian.length !== LAND2017_LOCAL_JACOBIAN_SIZE) {
    throw new Error(`Land 2017 BE residual Jacobian output must contain ${LAND2017_LOCAL_JACOBIAN_SIZE} entries`);
  }

  const kinematics = deriveLand2017StepKinematics(input);
  const rhsInput: LandContinuousInput = {
    freeCalciumUM: input.freeCalciumUM,
    fiberEngineeringStrain: input.stageFiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: kinematics.stageFiberEngineeringStrainRatePerSec,
    zetaDriveFiberEngineeringStrainRatePerSec:
      kinematics.stageZetaDriveFiberEngineeringStrainRatePerSec,
  };
  const p = parameterSet.values;
  const d = parameterSet.derived;
  validateLand2017ContinuousInput(rhsInput, p);
  validateLand2017EquationState(next);

  outJacobian.fill(0);
  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    outJacobian[index * LAND2017_STATE_SIZE + index] = 1;
  }

  const CaTRPN = next[LAND2017_STATE_INDEX.CaTRPN];
  const B = next[LAND2017_STATE_INDEX.B];
  const W = next[LAND2017_STATE_INDEX.W];
  const S = next[LAND2017_STATE_INDEX.S];
  const zetaW = next[LAND2017_STATE_INDEX.zetaW];
  const zetaS = next[LAND2017_STATE_INDEX.zetaS];
  const terms = evaluateLand2017AlgebraicTerms(next, rhsInput, parameterSet);
  const dt = input.dtSec;
  const nTmHalf = p.nTm / 2;
  const CaTRPNUnblockingFactor = land2017CaTRPNUnblockingFactor(CaTRPN, p);
  const CaTRPNPosHalf = Math.pow(CaTRPN, nTmHalf);

  // Eq 47.
  const caDrive = Math.pow(input.freeCalciumUM / terms.CaT50, p.nTRPN);
  subtractRhsDerivative(outJacobian, LAND2017_STATE_INDEX.CaTRPN, LAND2017_STATE_INDEX.CaTRPN, dt, p.kTRPN * (-caDrive - 1));

  // Eq 48.
  const dBCaTRPN =
    d.kb * land2017CaTRPNUnblockingFactorDerivative(CaTRPN, p) * terms.U -
    p.ku * nTmHalf * Math.pow(CaTRPN, nTmHalf - 1) * B;
  subtractRhsDerivative(outJacobian, LAND2017_STATE_INDEX.B, LAND2017_STATE_INDEX.CaTRPN, dt, dBCaTRPN);
  subtractRhsDerivative(
    outJacobian,
    LAND2017_STATE_INDEX.B,
    LAND2017_STATE_INDEX.B,
    dt,
    -d.kb * CaTRPNUnblockingFactor - p.ku * CaTRPNPosHalf,
  );
  subtractRhsDerivative(
    outJacobian,
    LAND2017_STATE_INDEX.B,
    LAND2017_STATE_INDEX.W,
    dt,
    -d.kb * CaTRPNUnblockingFactor,
  );
  subtractRhsDerivative(
    outJacobian,
    LAND2017_STATE_INDEX.B,
    LAND2017_STATE_INDEX.S,
    dt,
    -d.kb * CaTRPNUnblockingFactor,
  );

  // Eq 49.
  subtractRhsDerivative(outJacobian, LAND2017_STATE_INDEX.W, LAND2017_STATE_INDEX.B, dt, -p.kuw);
  subtractRhsDerivative(
    outJacobian,
    LAND2017_STATE_INDEX.W,
    LAND2017_STATE_INDEX.W,
    dt,
    -p.kuw - d.kwu - p.kws - terms.gammawu,
  );
  subtractRhsDerivative(outJacobian, LAND2017_STATE_INDEX.W, LAND2017_STATE_INDEX.S, dt, -p.kuw);
  subtractRhsDerivative(
    outJacobian,
    LAND2017_STATE_INDEX.W,
    LAND2017_STATE_INDEX.zetaW,
    dt,
    -W * land2017GammaWuDerivative(zetaW, p),
  );

  // Eq 50.
  subtractRhsDerivative(outJacobian, LAND2017_STATE_INDEX.S, LAND2017_STATE_INDEX.W, dt, p.kws);
  subtractRhsDerivative(
    outJacobian,
    LAND2017_STATE_INDEX.S,
    LAND2017_STATE_INDEX.S,
    dt,
    -d.ksu - terms.gammasu,
  );
  subtractRhsDerivative(
    outJacobian,
    LAND2017_STATE_INDEX.S,
    LAND2017_STATE_INDEX.zetaS,
    dt,
    -S * land2017GammaSuDerivative(zetaS, p),
  );

  // Eq 51.
  subtractRhsDerivative(outJacobian, LAND2017_STATE_INDEX.zetaW, LAND2017_STATE_INDEX.zetaW, dt, -d.cw);

  // Eq 52.
  subtractRhsDerivative(outJacobian, LAND2017_STATE_INDEX.zetaS, LAND2017_STATE_INDEX.zetaS, dt, -d.cs);

  return outJacobian;
}

function subtractRhsDerivative(
  outJacobian: Float64Array,
  row: number,
  column: number,
  dtSec: number,
  rhsDerivative: number,
): void {
  outJacobian[row * LAND2017_STATE_SIZE + column] -= dtSec * rhsDerivative;
}
