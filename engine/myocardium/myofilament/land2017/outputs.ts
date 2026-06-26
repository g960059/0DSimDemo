import {
  evaluateLand2017AlgebraicTerms,
  land2017StateConservationResidual,
  land2017StateMinimumPopulation,
  validateLand2017ContinuousInput,
  validateLand2017EquationState,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { computeLand2017ActiveStiffnessPa } from "@/engine/myocardium/myofilament/land2017/stabilization";
import {
  LAND2017_STATE_INDEX,
  assertLand2017StateVectorLength,
  deriveLand2017StepKinematics,
  type LandContinuousInput,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export function evaluateLand2017ContinuousOutput(
  state: ArrayLike<number>,
  input: LandContinuousInput,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): LandSourceOutput {
  assertLand2017StateVectorLength(state, "Land 2017 output state");
  const p = parameterSet.values;
  let inputDomainValid = true;
  try {
    validateLand2017ContinuousInput(input, p);
  } catch {
    inputDomainValid = false;
  }
  let stateDomainValid = true;
  try {
    validateLand2017EquationState(state);
  } catch {
    stateDomainValid = false;
  }

  const terms = evaluateLand2017AlgebraicTerms(state, input, parameterSet);
  const W = state[LAND2017_STATE_INDEX.W];
  const S = state[LAND2017_STATE_INDEX.S];
  const zetaW = state[LAND2017_STATE_INDEX.zetaW];
  const zetaS = state[LAND2017_STATE_INDEX.zetaS];

  // Eqs 53 and 32.
  const sourceActiveFiberStressPa = (terms.h * p.Tref * (S * (zetaS + 1) + W * zetaW)) / p.rs;
  const sourceActivePowerDensityWPerM3 =
    sourceActiveFiberStressPa * input.fiberEngineeringStrainRatePerSec;
  const stabilizationStiffnessPa = computeLand2017ActiveStiffnessPa(state, input, parameterSet);
  const stateConservationResidual = land2017StateConservationResidual(state);
  const minimumPopulation = land2017StateMinimumPopulation(state);
  const finite =
    inputDomainValid &&
    stateDomainValid &&
    terms.lambda > 0 &&
    minimumPopulation >= 0 &&
    stateConservationResidual <= 1e-12 &&
    allFinite([
      ...Array.from({ length: state.length }, (_, index) => state[index]),
      input.freeCalciumUM,
      input.fiberEngineeringStrain,
      input.fiberEngineeringStrainRatePerSec,
      sourceActiveFiberStressPa,
      stabilizationStiffnessPa,
      sourceActivePowerDensityWPerM3,
      stateConservationResidual,
      minimumPopulation,
    ]);

  return {
    sourceActiveFiberStressPa,
    sourceStressConvention: "land2017-Ta",
    stabilizationStiffnessPa,
    sourceActivePowerDensityWPerM3,
    health: {
      finite,
      stateConservationResidual,
      minimumPopulation,
      projectionUsed: false,
    },
  };
}

export function evaluateLand2017StepOutput(
  state: ArrayLike<number>,
  input: LandStepInput,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): LandSourceOutput {
  const kinematics = deriveLand2017StepKinematics(input);
  return evaluateLand2017ContinuousOutput(
    state,
    {
      freeCalciumUM: input.freeCalciumUM,
      fiberEngineeringStrain: input.stageFiberEngineeringStrain,
      fiberEngineeringStrainRatePerSec: kinematics.stageFiberEngineeringStrainRatePerSec,
    },
    parameterSet,
  );
}

function allFinite(values: readonly number[]): boolean {
  return values.every((value) => Number.isFinite(value));
}
