import {
  LAND2017_STATE_INDEX,
  LAND2017_STATE_SIZE,
  type LandContinuousInput,
  assertLand2017StateVectorLength,
} from "@/engine/myocardium/myofilament/land2017/types";
import type {
  Land2017DerivedParameters,
  Land2017RuntimeParameters,
  Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { requireFiniteNumber } from "@/engine/myocardium/units";

export type Land2017AlgebraicTerms = {
  readonly lambda: number;
  readonly lambdaForLengthDependence: number;
  readonly CaT50: number;
  readonly h: number;
  readonly U: number;
  readonly gammawu: number;
  readonly gammasu: number;
};

export type Land2017EquationParameters = Land2017SourceParameterSet;

export const LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT = 100;

export function writeLand2017Rhs(
  state: ArrayLike<number>,
  input: LandContinuousInput,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  out: Float64Array = new Float64Array(LAND2017_STATE_SIZE),
): Float64Array {
  assertLand2017StateVectorLength(state, "Land 2017 RHS state");
  assertLand2017StateVectorLength(out, "Land 2017 RHS output");
  const p = parameterSet.values;
  const d = parameterSet.derived;
  validateLand2017ContinuousInput(input, p);
  validateLand2017EquationState(state);

  const CaTRPN = state[LAND2017_STATE_INDEX.CaTRPN];
  const B = state[LAND2017_STATE_INDEX.B];
  const W = state[LAND2017_STATE_INDEX.W];
  const S = state[LAND2017_STATE_INDEX.S];
  const zetaW = state[LAND2017_STATE_INDEX.zetaW];
  const zetaS = state[LAND2017_STATE_INDEX.zetaS];
  const lambdaDot =
    input.zetaDriveFiberEngineeringStrainRatePerSec
    ?? input.fiberEngineeringStrainRatePerSec;
  const terms = evaluateLand2017AlgebraicTerms(state, input, parameterSet);
  const nTmHalf = p.nTm / 2;
  const strongToBlockedRate =
    land2017StrongToBlockedDeactivationRatePerSec(
      CaTRPN,
      parameterSet,
      input,
    );

  // Eq 47.
  const caDrive = Math.pow(input.freeCalciumUM / terms.CaT50, p.nTRPN);
  out[LAND2017_STATE_INDEX.CaTRPN] = p.kTRPN * (caDrive * (1 - CaTRPN) - CaTRPN);

  // Eq 48. The Land 2017 numerical limit is explicit source behavior, not projection.
  out[LAND2017_STATE_INDEX.B] =
    d.kb * land2017CaTRPNUnblockingFactor(CaTRPN, p) * terms.U
    - p.ku * Math.pow(CaTRPN, nTmHalf) * B
    + strongToBlockedRate * S;

  // Eq 49.
  out[LAND2017_STATE_INDEX.W] =
    p.kuw * terms.U - d.kwu * W - p.kws * W - terms.gammawu * W;

  // Eq 50.
  out[LAND2017_STATE_INDEX.S] =
    p.kws * W - d.ksu * S - terms.gammasu * S
    - strongToBlockedRate * S;

  // Eq 51.
  out[LAND2017_STATE_INDEX.zetaW] = d.Aw * lambdaDot - d.cw * zetaW;

  // Eq 52.
  out[LAND2017_STATE_INDEX.zetaS] = d.As * lambdaDot - d.cs * zetaS;

  return out;
}

export function evaluateLand2017AlgebraicTerms(
  state: ArrayLike<number>,
  input: Pick<LandContinuousInput, "fiberEngineeringStrain">,
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017AlgebraicTerms {
  assertLand2017StateVectorLength(state, "Land 2017 algebraic state");
  const p = parameterSet.values;
  const lambda = 1 + requireFiniteNumber(input.fiberEngineeringStrain, "fiberEngineeringStrain");
  const B = requireFiniteNumber(state[LAND2017_STATE_INDEX.B], "Land 2017 state B");
  const W = requireFiniteNumber(state[LAND2017_STATE_INDEX.W], "Land 2017 state W");
  const S = requireFiniteNumber(state[LAND2017_STATE_INDEX.S], "Land 2017 state S");
  const zetaW = requireFiniteNumber(state[LAND2017_STATE_INDEX.zetaW], "Land 2017 state zetaW");
  const zetaS = requireFiniteNumber(state[LAND2017_STATE_INDEX.zetaS], "Land 2017 state zetaS");
  const lambdaForLengthDependence = Math.min(lambda, 1.2);

  return {
    lambda,
    lambdaForLengthDependence,
    CaT50: land2017CaT50(lambda, p),
    h: land2017LengthFactor(lambda, p),
    U: 1 - B - W - S,
    gammawu: land2017GammaWu(zetaW, p),
    gammasu: land2017GammaSu(zetaS, p),
  };
}

export function land2017CaT50(lambda: number, p: Land2017RuntimeParameters): number {
  // Eqs 29-31.
  return p.CaT50Ref + p.beta1 * (Math.min(lambda, 1.2) - 1);
}

export function land2017LengthFactor(lambda: number, p: Land2017RuntimeParameters): number {
  // Eqs 29-31.
  const lambdaForLengthDependence = Math.min(lambda, 1.2);
  const h0 = 1 + p.beta0 * (lambdaForLengthDependence + Math.min(lambdaForLengthDependence, 0.87) - 1.87);
  return Math.max(0, h0);
}

export function land2017GammaWu(zetaW: number, p: Land2017RuntimeParameters): number {
  // Eq 56.
  return p.gammaW * Math.abs(zetaW);
}

export function land2017CaTRPNUnblockingFactor(
  CaTRPN: number,
  p: Land2017RuntimeParameters,
): number {
  // Eq 48 source term with the Land 2017 stated numerical limit.
  return Math.min(
    Math.pow(CaTRPN, -p.nTm / 2),
    LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT,
  );
}

export function land2017CaTRPNUnblockingFactorDerivative(
  CaTRPN: number,
  p: Land2017RuntimeParameters,
): number {
  const raw = Math.pow(CaTRPN, -p.nTm / 2);
  if (raw >= LAND2017_EQ48_CA_TRPN_UNBLOCKING_FACTOR_LIMIT) return 0;
  return (-p.nTm / 2) * Math.pow(CaTRPN, -p.nTm / 2 - 1);
}

export function land2017GammaSu(zetaS: number, p: Land2017RuntimeParameters): number {
  // Eq 57.
  if (zetaS + 1 < 0) return p.gammaS * (-zetaS - 1);
  if (zetaS + 1 > 1) return p.gammaS * zetaS;
  return 0;
}

export function land2017GammaWuDerivative(zetaW: number, p: Land2017RuntimeParameters): number {
  if (zetaW > 0) return p.gammaW;
  if (zetaW < 0) return -p.gammaW;
  return 0;
}

export function land2017GammaSuDerivative(zetaS: number, p: Land2017RuntimeParameters): number {
  if (zetaS < -1) return -p.gammaS;
  if (zetaS > 0) return p.gammaS;
  return 0;
}

export function land2017StrongToBlockedDeactivationRatePerSec(
  CaTRPN: number,
  parameterSet: Land2017EquationParameters,
  input?: Pick<
    LandContinuousInput,
    "freeCalciumUM" | "fiberEngineeringStrain"
  >,
): number {
  return evaluateStrongToBlockedDeactivationRateTerms(
    CaTRPN,
    parameterSet,
    input,
  ).ratePerSec;
}

export function land2017StrongToBlockedDeactivationRateDerivativePerSec(
  CaTRPN: number,
  parameterSet: Land2017EquationParameters,
  input?: Pick<
    LandContinuousInput,
    "freeCalciumUM" | "fiberEngineeringStrain"
  >,
): number {
  return evaluateStrongToBlockedDeactivationRateTerms(
    CaTRPN,
    parameterSet,
    input,
  ).derivativeByCaTRPNPerSec;
}

export function land2017StrongToBlockedDeactivationRateStageStrainDerivativePerSec(
  CaTRPN: number,
  parameterSet: Land2017EquationParameters,
  input?: Pick<
    LandContinuousInput,
    "freeCalciumUM" | "fiberEngineeringStrain"
  >,
): number {
  return evaluateStrongToBlockedDeactivationRateTerms(
    CaTRPN,
    parameterSet,
    input,
  ).derivativeByFiberEngineeringStrainPerSec;
}

function evaluateStrongToBlockedDeactivationRateTerms(
  CaTRPN: number,
  parameterSet: Land2017EquationParameters,
  input?: Pick<
    LandContinuousInput,
    "freeCalciumUM" | "fiberEngineeringStrain"
  >,
): Readonly<{
  ratePerSec: number;
  derivativeByCaTRPNPerSec: number;
  derivativeByFiberEngineeringStrainPerSec: number;
}> {
  const extension = parameterSet.strongToBlockedDeactivation;
  if (extension === undefined) {
    return Object.freeze({
      ratePerSec: 0,
      derivativeByCaTRPNPerSec: 0,
      derivativeByFiberEngineeringStrainPerSec: 0,
    });
  }
  const maximumRatePerSec = requireFiniteNumber(
    extension.maximumRatePerSec,
    "Land 2017 strong-to-blocked deactivation maximum rate",
  );
  if (maximumRatePerSec < 0) {
    throw new Error(
      "Land 2017 strong-to-blocked deactivation maximum rate must be non-negative",
    );
  }
  if (
    extension.cooperativeGatePower !== 1
    && extension.cooperativeGatePower !== 2
  ) {
    throw new Error(
      "Land 2017 strong-to-blocked cooperative gate power must be one or two",
    );
  }
  if (!(CaTRPN > 0) || !Number.isFinite(CaTRPN)) {
    throw new Error(
      "Land 2017 strong-to-blocked deactivation requires positive finite CaTRPN",
    );
  }
  const exponent = parameterSet.values.nTm;
  const thresholdPower = Math.pow(parameterSet.values.TRPN50, exponent);
  const calciumPower = Math.pow(CaTRPN, exponent);
  const denominator = thresholdPower + calciumPower;
  const baseGate = thresholdPower / denominator;
  const baseGateDerivative = -thresholdPower * exponent
    * Math.pow(CaTRPN, exponent - 1) / (denominator * denominator);
  const levelGate = Math.pow(baseGate, extension.cooperativeGatePower);
  const levelGateDerivative = extension.cooperativeGatePower
    * Math.pow(baseGate, extension.cooperativeGatePower - 1)
    * baseGateDerivative;
  const direction = deactivationDirectionGateTerms(
    CaTRPN,
    parameterSet.values,
    extension.deactivationDirectionGate,
    input,
  );
  return Object.freeze({
    ratePerSec: maximumRatePerSec * levelGate * direction.gate,
    derivativeByCaTRPNPerSec: maximumRatePerSec * (
      levelGateDerivative * direction.gate
      + levelGate * direction.derivativeByCaTRPN
    ),
    derivativeByFiberEngineeringStrainPerSec:
      maximumRatePerSec * levelGate
      * direction.derivativeByFiberEngineeringStrain,
  });
}

function deactivationDirectionGateTerms(
  CaTRPN: number,
  p: Land2017RuntimeParameters,
  gateKind: "none" | "relative-CaTRPN-relaxation-excess",
  input?: Pick<
    LandContinuousInput,
    "freeCalciumUM" | "fiberEngineeringStrain"
  >,
): Readonly<{
  gate: number;
  derivativeByCaTRPN: number;
  derivativeByFiberEngineeringStrain: number;
}> {
  if (gateKind === "none") {
    return Object.freeze({
      gate: 1,
      derivativeByCaTRPN: 0,
      derivativeByFiberEngineeringStrain: 0,
    });
  }
  if (input === undefined) {
    throw new Error(
      "Land 2017 directional deactivation gate requires calcium and strain",
    );
  }
  const freeCalciumUM = requireFiniteNumber(
    input.freeCalciumUM,
    "Land 2017 directional deactivation gate free calcium",
  );
  const fiberEngineeringStrain = requireFiniteNumber(
    input.fiberEngineeringStrain,
    "Land 2017 directional deactivation gate fiber strain",
  );
  const lambda = 1 + fiberEngineeringStrain;
  const CaT50 = land2017CaT50(lambda, p);
  const calciumDrive = Math.pow(freeCalciumUM / CaT50, p.nTRPN);
  const relativeRelaxationExcess =
    1 - calciumDrive * (1 - CaTRPN) / CaTRPN;
  if (relativeRelaxationExcess <= 64 * Number.EPSILON) {
    return Object.freeze({
      gate: 0,
      derivativeByCaTRPN: 0,
      derivativeByFiberEngineeringStrain: 0,
    });
  }
  const dCaT50DStrain = lambda < 1.2 ? p.beta1 : 0;
  const dCalciumDriveDStrain = calciumDrive
    * (-p.nTRPN * dCaT50DStrain / CaT50);
  return Object.freeze({
    gate: Math.min(1, relativeRelaxationExcess),
    derivativeByCaTRPN: calciumDrive / (CaTRPN * CaTRPN),
    derivativeByFiberEngineeringStrain:
      -(1 - CaTRPN) / CaTRPN * dCalciumDriveDStrain,
  });
}

export function validateLand2017ContinuousInput(
  input: LandContinuousInput,
  p: Land2017RuntimeParameters,
): void {
  const freeCalciumUM = requireFiniteNumber(input.freeCalciumUM, "LandContinuousInput.freeCalciumUM");
  if (freeCalciumUM < 0) throw new Error("LandContinuousInput.freeCalciumUM must be non-negative");

  const fiberEngineeringStrain = requireFiniteNumber(
    input.fiberEngineeringStrain,
    "LandContinuousInput.fiberEngineeringStrain",
  );
  const lambda = 1 + fiberEngineeringStrain;
  if (lambda <= 0) throw new Error("Land 2017 lambda = 1 + fiberEngineeringStrain must be positive");

  requireFiniteNumber(
    input.fiberEngineeringStrainRatePerSec,
    "LandContinuousInput.fiberEngineeringStrainRatePerSec",
  );
  if (input.zetaDriveFiberEngineeringStrainRatePerSec !== undefined) {
    requireFiniteNumber(
      input.zetaDriveFiberEngineeringStrainRatePerSec,
      "LandContinuousInput.zetaDriveFiberEngineeringStrainRatePerSec",
    );
  }

  const CaT50 = land2017CaT50(lambda, p);
  if (CaT50 <= 0 || !Number.isFinite(CaT50)) {
    throw new Error("Land 2017 CaT50 must be positive and finite");
  }
}

export function validateLand2017EquationState(state: ArrayLike<number>): void {
  assertLand2017StateVectorLength(state, "Land 2017 equation state");
  const CaTRPN = requireFiniteNumber(state[LAND2017_STATE_INDEX.CaTRPN], "Land 2017 state CaTRPN");
  const B = requireFiniteNumber(state[LAND2017_STATE_INDEX.B], "Land 2017 state B");
  const W = requireFiniteNumber(state[LAND2017_STATE_INDEX.W], "Land 2017 state W");
  const S = requireFiniteNumber(state[LAND2017_STATE_INDEX.S], "Land 2017 state S");
  requireFiniteNumber(state[LAND2017_STATE_INDEX.zetaW], "Land 2017 state zetaW");
  requireFiniteNumber(state[LAND2017_STATE_INDEX.zetaS], "Land 2017 state zetaS");

  if (CaTRPN <= 0 || CaTRPN > 1) {
    throw new Error("Land 2017 state CaTRPN must be within (0, 1] for Eq 48");
  }

  const U = 1 - B - W - S;
  if (Math.min(B, W, S, U) < 0) {
    throw new Error("Land 2017 state populations B, W, S, and derived U must be non-negative");
  }
}

export function land2017StateMinimumPopulation(state: ArrayLike<number>): number {
  assertLand2017StateVectorLength(state, "Land 2017 population state");
  const CaTRPN = state[LAND2017_STATE_INDEX.CaTRPN];
  const B = state[LAND2017_STATE_INDEX.B];
  const W = state[LAND2017_STATE_INDEX.W];
  const S = state[LAND2017_STATE_INDEX.S];
  const U = 1 - B - W - S;
  return Math.min(CaTRPN, 1 - CaTRPN, B, W, S, U);
}

export function land2017StateConservationResidual(state: ArrayLike<number>): number {
  assertLand2017StateVectorLength(state, "Land 2017 conservation state");
  const B = state[LAND2017_STATE_INDEX.B];
  const W = state[LAND2017_STATE_INDEX.W];
  const S = state[LAND2017_STATE_INDEX.S];
  const U = 1 - B - W - S;
  return Math.abs(1 - (U + B + W + S));
}

export function land2017DerivedParameters(
  parameterSet: Land2017EquationParameters = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
): Land2017DerivedParameters {
  return parameterSet.derived;
}
