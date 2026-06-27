import type { PassiveMaterialOutput } from "@/engine/myocardium/mechanics/contracts";

export const PASSIVE_EXPONENTIAL_ENERGY_V1_ID = "passive-exponential-energy-v1";
export const PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID =
  "passive-exponential-energy-phase4c-a-readiness-candidate-v1";

export type PassiveExponentialEnergyV1Params = {
  readonly APa: number;
  readonly B: number;
  readonly slackStrain: number;
  readonly smoothWidthStrain: number;
  readonly etaFPaSec: number;
};

export type PassiveExponentialEnergyV1Input = {
  readonly fiberEngineeringStrain: number;
  readonly fiberEngineeringStrainRatePerSec: number;
};

export type SmoothPositiveHingeEvaluation = {
  readonly shiftedStrain: number;
  readonly valueStrain: number;
  readonly dValueDStrain: number;
  readonly d2ValueDStrain2: number;
};

export type PassiveExponentialEnergyV1Output = PassiveMaterialOutput & {
  readonly modelId: typeof PASSIVE_EXPONENTIAL_ENERGY_V1_ID;
  readonly parameterSetId: typeof PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID;
  readonly fiberEngineeringStrain: number;
  readonly fiberEngineeringStrainRatePerSec: number;
  readonly hinge: SmoothPositiveHingeEvaluation;
  readonly passiveStressDerivativeSource: "energy-derivative";
  readonly tangentDerivativeSource: "passive-stress-derivative";
  readonly viscosityLaw: "S_viscous=eta_f*Edot";
};

export const PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS:
  PassiveExponentialEnergyV1Params = Object.freeze({
    APa: 1200,
    B: 18,
    slackStrain: 0.02,
    smoothWidthStrain: 0.03,
    etaFPaSec: 35,
  });

export function evaluatePassiveExponentialEnergyV1(
  input: PassiveExponentialEnergyV1Input,
  params: PassiveExponentialEnergyV1Params =
    PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS,
): PassiveExponentialEnergyV1Output {
  assertValidPassiveExponentialEnergyInput(input);
  assertValidPassiveExponentialEnergyParams(params);

  const hinge = evaluateSmoothPositiveHingeC2(
    input.fiberEngineeringStrain - params.slackStrain,
    params.smoothWidthStrain,
  );
  const expBx = Math.exp(params.B * hinge.valueStrain);
  const storedEnergyDensityJPerM3 =
    params.APa / (params.B * params.B)
    * (expBx - 1 - params.B * hinge.valueStrain);
  const dEnergyDHingePa = params.APa / params.B * (expBx - 1);
  const d2EnergyDHinge2Pa = params.APa * expBx;
  const passiveNominalStressPa = dEnergyDHingePa * hinge.dValueDStrain;
  const dPassiveStressDStrainPa =
    d2EnergyDHinge2Pa * hinge.dValueDStrain * hinge.dValueDStrain
    + dEnergyDHingePa * hinge.d2ValueDStrain2;
  const viscousNominalStressPa = params.etaFPaSec * input.fiberEngineeringStrainRatePerSec;
  const dissipationDensityWPerM3 =
    viscousNominalStressPa * input.fiberEngineeringStrainRatePerSec;

  return {
    modelId: PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
    parameterSetId: PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
    fiberEngineeringStrain: input.fiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: input.fiberEngineeringStrainRatePerSec,
    hinge,
    passiveNominalStressPa,
    viscousNominalStressPa,
    dPassiveStressDStrainPa,
    storedEnergyDensityJPerM3,
    dissipationDensityWPerM3,
    passiveStressDerivativeSource: "energy-derivative",
    tangentDerivativeSource: "passive-stress-derivative",
    viscosityLaw: "S_viscous=eta_f*Edot",
  };
}

export function evaluateSmoothPositiveHingeC2(
  shiftedStrain: number,
  smoothWidthStrain: number,
): SmoothPositiveHingeEvaluation {
  requireFinite(shiftedStrain, "shiftedStrain");
  requirePositiveFinite(smoothWidthStrain, "smoothWidthStrain");

  if (shiftedStrain <= 0) {
    return {
      shiftedStrain,
      valueStrain: 0,
      dValueDStrain: 0,
      d2ValueDStrain2: 0,
    };
  }
  if (shiftedStrain >= smoothWidthStrain) {
    return {
      shiftedStrain,
      valueStrain: shiftedStrain - 0.5 * smoothWidthStrain,
      dValueDStrain: 1,
      d2ValueDStrain2: 0,
    };
  }

  const t = shiftedStrain / smoothWidthStrain;
  return {
    shiftedStrain,
    valueStrain: smoothWidthStrain * (t ** 3 - 0.5 * t ** 4),
    dValueDStrain: 3 * t * t - 2 * t ** 3,
    d2ValueDStrain2: (6 * t - 6 * t * t) / smoothWidthStrain,
  };
}

function assertValidPassiveExponentialEnergyInput(
  input: PassiveExponentialEnergyV1Input,
): void {
  requireFinite(input.fiberEngineeringStrain, "input.fiberEngineeringStrain");
  requireFinite(
    input.fiberEngineeringStrainRatePerSec,
    "input.fiberEngineeringStrainRatePerSec",
  );
}

function assertValidPassiveExponentialEnergyParams(
  params: PassiveExponentialEnergyV1Params,
): void {
  requirePositiveFinite(params.APa, "params.APa");
  requirePositiveFinite(params.B, "params.B");
  requireFinite(params.slackStrain, "params.slackStrain");
  requirePositiveFinite(params.smoothWidthStrain, "params.smoothWidthStrain");
  requireNonnegativeFinite(params.etaFPaSec, "params.etaFPaSec");
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
}

function requirePositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}

function requireNonnegativeFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
}
