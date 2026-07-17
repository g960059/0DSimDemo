/**
 * One-state Maxwell branch in parallel with externally-owned equilibrium
 * passive and active stresses.
 *
 *   sigma_v = E_v (e - alpha)
 *   alpha_dot = (e - alpha) / tau
 *
 * The strain is fiber log strain. This module owns only the viscous branch;
 * it must not duplicate the equilibrium passive spring.
 */
export const PARALLEL_ONE_STATE_SLS_V1_ID =
  "parallel-one-state-sls-log-strain-v1" as const;

export const PARALLEL_ONE_STATE_SLS_CLAIM_V1 = Object.freeze({
  topology: "one-Maxwell-branch-parallel-to-external-equilibrium-and-active-stress" as const,
  state: "viscous-fiber-log-strain-alpha" as const,
  integration: "backward-Euler-closed-form" as const,
  equilibriumPassiveStressOwnedHere: false as const,
  activeStressOwnedHere: false as const,
  nonlinearSpring: false as const,
  phaseOrPressureShapeInput: false as const,
});

export type ParallelOneStateSlsParamsV1 = {
  readonly parameterSetId: string;
  readonly branchModulusPa: number;
  readonly relaxationTimeSec: number;
};

export type ParallelOneStateSlsStateV1 = {
  readonly viscousLogStrain: number;
};

export type ParallelOneStateSlsBackwardEulerInputV1 = {
  readonly previousFiberLogStrain: number;
  readonly nextFiberLogStrain: number;
  readonly dtSec: number;
};

export type ParallelOneStateSlsEvaluationV1 = {
  readonly modelId: typeof PARALLEL_ONE_STATE_SLS_V1_ID;
  readonly parameterSetId: string;
  readonly state: ParallelOneStateSlsStateV1;
  readonly previousOverstressPa: number;
  readonly nextOverstressPa: number;
  readonly dNextOverstressDNextFiberLogStrainPa: number;
  readonly stateResidual: number;
  readonly previousStoredEnergyDensityJPerM3: number;
  readonly nextStoredEnergyDensityJPerM3: number;
  readonly stressWorkIncrementDensityJPerM3: number;
  readonly physicalDissipationIncrementDensityJPerM3: number;
  readonly backwardEulerNumericalDissipationIncrementDensityJPerM3: number;
  readonly discreteEnergyBalanceResidualJPerM3: number;
  readonly finite: boolean;
  readonly passive: boolean;
  readonly claim: typeof PARALLEL_ONE_STATE_SLS_CLAIM_V1;
};

/** Cold state has zero overstress at the supplied strain. */
export function initialParallelOneStateSlsStateV1(
  fiberLogStrain: number,
): ParallelOneStateSlsStateV1 {
  requireFinite(fiberLogStrain, "fiberLogStrain");
  return Object.freeze({ viscousLogStrain: fiberLogStrain });
}

export function stepParallelOneStateSlsBackwardEulerV1(
  previous: ParallelOneStateSlsStateV1,
  input: ParallelOneStateSlsBackwardEulerInputV1,
  params: ParallelOneStateSlsParamsV1,
): ParallelOneStateSlsEvaluationV1 {
  validateParams(params);
  requireFinite(previous.viscousLogStrain, "previous.viscousLogStrain");
  requireFinite(input.previousFiberLogStrain, "input.previousFiberLogStrain");
  requireFinite(input.nextFiberLogStrain, "input.nextFiberLogStrain");
  requirePositive(input.dtSec, "input.dtSec");

  const ratio = input.dtSec / params.relaxationTimeSec;
  const nextViscousLogStrain =
    (previous.viscousLogStrain + ratio * input.nextFiberLogStrain) /
    (1 + ratio);
  const state = Object.freeze({ viscousLogStrain: nextViscousLogStrain });
  const previousElasticStrain =
    input.previousFiberLogStrain - previous.viscousLogStrain;
  const nextElasticStrain =
    input.nextFiberLogStrain - nextViscousLogStrain;
  const previousOverstressPa = canonicalZero(
    params.branchModulusPa * previousElasticStrain,
  );
  const nextOverstressPa = canonicalZero(
    params.branchModulusPa * nextElasticStrain,
  );
  const dNextOverstressDNextFiberLogStrainPa =
    params.branchModulusPa / (1 + ratio);
  const stateResidual =
    nextViscousLogStrain - previous.viscousLogStrain -
    ratio * nextElasticStrain;

  const previousStoredEnergyDensityJPerM3 = canonicalZero(
    0.5 * params.branchModulusPa * previousElasticStrain ** 2,
  );
  const nextStoredEnergyDensityJPerM3 = canonicalZero(
    0.5 * params.branchModulusPa * nextElasticStrain ** 2,
  );
  const stressWorkIncrementDensityJPerM3 = canonicalZero(
    nextOverstressPa *
    (input.nextFiberLogStrain - input.previousFiberLogStrain),
  );
  const physicalDissipationIncrementDensityJPerM3 = canonicalZero(
    params.branchModulusPa * ratio * nextElasticStrain ** 2,
  );
  const backwardEulerNumericalDissipationIncrementDensityJPerM3 = canonicalZero(
    0.5 * params.branchModulusPa *
    (nextElasticStrain - previousElasticStrain) ** 2,
  );
  const discreteEnergyBalanceResidualJPerM3 = canonicalZero(
    stressWorkIncrementDensityJPerM3 -
    (nextStoredEnergyDensityJPerM3 - previousStoredEnergyDensityJPerM3) -
    physicalDissipationIncrementDensityJPerM3 -
    backwardEulerNumericalDissipationIncrementDensityJPerM3,
  );

  const finite = Object.values({
    nextViscousLogStrain,
    previousOverstressPa,
    nextOverstressPa,
    dNextOverstressDNextFiberLogStrainPa,
    stateResidual,
    previousStoredEnergyDensityJPerM3,
    nextStoredEnergyDensityJPerM3,
    stressWorkIncrementDensityJPerM3,
    physicalDissipationIncrementDensityJPerM3,
    backwardEulerNumericalDissipationIncrementDensityJPerM3,
    discreteEnergyBalanceResidualJPerM3,
  }).every(Number.isFinite);
  const tolerance = 1e-10 * Math.max(
    1,
    Math.abs(stressWorkIncrementDensityJPerM3),
    previousStoredEnergyDensityJPerM3,
    nextStoredEnergyDensityJPerM3,
  );
  const passive =
    finite &&
    physicalDissipationIncrementDensityJPerM3 >= -tolerance &&
    backwardEulerNumericalDissipationIncrementDensityJPerM3 >= -tolerance &&
    Math.abs(discreteEnergyBalanceResidualJPerM3) <= tolerance;

  return Object.freeze({
    modelId: PARALLEL_ONE_STATE_SLS_V1_ID,
    parameterSetId: params.parameterSetId,
    state,
    previousOverstressPa,
    nextOverstressPa,
    dNextOverstressDNextFiberLogStrainPa,
    stateResidual,
    previousStoredEnergyDensityJPerM3,
    nextStoredEnergyDensityJPerM3,
    stressWorkIncrementDensityJPerM3,
    physicalDissipationIncrementDensityJPerM3,
    backwardEulerNumericalDissipationIncrementDensityJPerM3,
    discreteEnergyBalanceResidualJPerM3,
    finite,
    passive,
    claim: PARALLEL_ONE_STATE_SLS_CLAIM_V1,
  });
}

function validateParams(params: ParallelOneStateSlsParamsV1): void {
  if (typeof params.parameterSetId !== "string" || params.parameterSetId.trim() === "") {
    throw new Error("params.parameterSetId must be non-empty");
  }
  requireNonnegative(params.branchModulusPa, "params.branchModulusPa");
  requirePositive(params.relaxationTimeSec, "params.relaxationTimeSec");
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}

function requirePositive(value: number, label: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${label} must be positive and finite`);
  }
}

function requireNonnegative(value: number, label: string): void {
  if (value < 0 || !Number.isFinite(value)) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
}

function canonicalZero(value: number): number {
  return value === 0 ? 0 : value;
}
