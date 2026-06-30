import { writeLand2017Rhs, type Land2017EquationParameters } from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  LAND2017_STATE_SIZE,
  assertLand2017StateVectorLength,
  deriveLand2017StepKinematics,
  type LandContinuousInput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export function writeLand2017BackwardEulerResidual(
  next: ArrayLike<number>,
  previous: ArrayLike<number>,
  input: LandStepInput,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  outResidual: Float64Array = new Float64Array(LAND2017_STATE_SIZE),
): Float64Array {
  assertLand2017StateVectorLength(next, "Land 2017 BE residual next state");
  assertLand2017StateVectorLength(previous, "Land 2017 BE residual previous state");
  assertLand2017StateVectorLength(outResidual, "Land 2017 BE residual output");

  const kinematics = deriveLand2017StepKinematics(input);
  const rhsInput: LandContinuousInput = {
    freeCalciumUM: input.freeCalciumUM,
    fiberEngineeringStrain: input.stageFiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: kinematics.stageFiberEngineeringStrainRatePerSec,
    zetaDriveFiberEngineeringStrainRatePerSec:
      kinematics.stageZetaDriveFiberEngineeringStrainRatePerSec,
  };
  const rhs = writeLand2017Rhs(next, rhsInput, parameterSet);

  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    outResidual[index] = next[index] - previous[index] - input.dtSec * rhs[index];
  }
  return outResidual;
}
