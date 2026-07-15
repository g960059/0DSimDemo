/**
 * Equilibrium exponential passive spring plus one parallel Maxwell arm.
 *
 * This module is intentionally independent of every active-stress law.  Its
 * natural-log strain and Kirchhoff stress form a work-conjugate one-dimensional
 * pair, and its single overstress state is updated transactionally.
 */
export const EQUILIBRIUM_PASSIVE_SLS_PARALLEL_V1_ID =
  "equilibrium-passive-sls-parallel-v1" as const;

export const EQUILIBRIUM_PASSIVE_SLS_PARALLEL_CLAIM_V1 = Object.freeze({
  topology: "equilibrium-passive-spring-plus-parallel-maxwell-arm" as const,
  strainMeasure: "natural-log-strain" as const,
  stressMeasure: "one-dimensional-Kirchhoff-stress" as const,
  workConjugatePair:
    "Kirchhoff-stress-times-natural-log-strain-rate" as const,
  passivePotential:
    "C2-smoothed-tension-only-exponential-stored-energy" as const,
  slsUpdate: "backward-euler-one-state-overstress" as const,
  activeStressEvaluated: false as const,
  seriesElasticElementEvaluated: false as const,
  pureTrialExplicitCommit: true as const,
});

export type EquilibriumPassiveParamsV1 = {
  readonly tangentModulusPa: number;
  readonly exponentialSlope: number;
  readonly referenceStrain: number;
  readonly tensionTransitionStrain: number;
};

export type OneStateParallelSlsParamsV1 = {
  readonly enabled: boolean;
  readonly modulusPa: number;
  readonly relaxationTimeSec: number;
};

export type EquilibriumPassiveSlsParallelParamsV1 = {
  /** Stable provenance identity; changing it requires a cold trajectory. */
  readonly parameterSetId: string;
  readonly passive: EquilibriumPassiveParamsV1;
  readonly sls: OneStateParallelSlsParamsV1;
};

declare const PREPARED_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1:
  unique symbol;

export type PreparedEquilibriumPassiveSlsParallelParamsV1 =
  EquilibriumPassiveSlsParallelParamsV1 & {
    readonly [PREPARED_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1]: true;
  };

const PREPARED_PARAM_OBJECTS = new WeakSet<object>();

export const DEFAULT_EQUILIBRIUM_PASSIVE_SLS_PARALLEL_PARAMS_V1 =
  prepareEquilibriumPassiveSlsParallelParamsV1({
    parameterSetId: "equilibrium-passive-sls-parallel-engineering-seed-v1",
    passive: {
      tangentModulusPa: 8_000,
      exponentialSlope: 8,
      referenceStrain: 0,
      tensionTransitionStrain: 0.02,
    },
    sls: {
      enabled: true,
      modulusPa: 6_000,
      relaxationTimeSec: 0.08,
    },
  });

export type EquilibriumPassiveEvaluationV1 =
  | {
      readonly valid: true;
      readonly finite: true;
      readonly failureReason: null;
      readonly totalStrain: number;
      readonly stressPa: number;
      readonly tangentPa: number;
      readonly storageJPerM3: number;
    }
  | {
      readonly valid: false;
      readonly finite: boolean;
      readonly failureReason: string;
      readonly totalStrain: number;
      readonly stressPa: null;
      readonly tangentPa: null;
      readonly storageJPerM3: null;
    };

export type OneStateParallelSlsBalanceV1 = {
  readonly workIncrementJPerM3: number;
  readonly storageIncrementJPerM3: number;
  readonly physicalRelaxationDissipationJPerM3: number;
  readonly backwardEulerNumericalDissipationJPerM3: number;
  readonly physicalRelaxationDissipationRateWPerM3: number;
  readonly backwardEulerNumericalDissipationRateWPerM3: number;
  readonly discreteBalanceResidualJPerM3: number;
};

export type EquilibriumPassiveSlsParallelStateV1 = {
  readonly totalStrain: number;
  readonly slsOverstressPa: number;
};

export type EquilibriumPassiveSlsParallelReadbackV1 = {
  readonly passiveEquilibriumStressPa: number;
  readonly passiveEquilibriumTangentPa: number;
  readonly passiveEquilibriumStorageJPerM3: number;
  readonly slsOverstressPa: number;
  readonly slsAlgorithmicTangentPa: number;
  readonly slsStorageJPerM3: number;
  readonly passivePlusSlsStressPa: number;
  readonly passivePlusSlsAlgorithmicTangentPa: number;
  readonly slsBalance: OneStateParallelSlsBalanceV1;
  readonly claim: typeof EQUILIBRIUM_PASSIVE_SLS_PARALLEL_CLAIM_V1;
};

export type EquilibriumPassiveSlsParallelTrialV1 = {
  readonly previousState: EquilibriumPassiveSlsParallelStateV1;
  readonly nextState: EquilibriumPassiveSlsParallelStateV1 | null;
  readonly readback: EquilibriumPassiveSlsParallelReadbackV1 | null;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly string[];
};

export function prepareEquilibriumPassiveSlsParallelParamsV1(
  params: EquilibriumPassiveSlsParallelParamsV1,
): PreparedEquilibriumPassiveSlsParallelParamsV1 {
  const snapshot: EquilibriumPassiveSlsParallelParamsV1 = {
    parameterSetId: params.parameterSetId,
    passive: { ...params.passive },
    sls: { ...params.sls },
  };
  const issues = validateEquilibriumPassiveSlsParallelParamsV1(snapshot);
  if (issues.length > 0) throw new Error(issues.join("; "));
  const prepared = Object.freeze({
    ...snapshot,
    passive: Object.freeze(snapshot.passive),
    sls: Object.freeze(snapshot.sls),
  }) as PreparedEquilibriumPassiveSlsParallelParamsV1;
  PREPARED_PARAM_OBJECTS.add(prepared);
  return prepared;
}

export function validateEquilibriumPassiveSlsParallelParamsV1(
  params: EquilibriumPassiveSlsParallelParamsV1,
): readonly string[] {
  const issues = validateEquilibriumPassiveParamsV1(params.passive);
  if (
    typeof params.parameterSetId !== "string" ||
    params.parameterSetId.trim().length === 0
  ) {
    issues.push("parameterSetId must be a non-empty string");
  }
  if (typeof params.sls.enabled !== "boolean") {
    issues.push("sls.enabled must be boolean");
  }
  if (!(params.sls.modulusPa >= 0) || !Number.isFinite(params.sls.modulusPa)) {
    issues.push("sls.modulusPa must be nonnegative and finite");
  }
  if (
    !(params.sls.relaxationTimeSec > 0) ||
    !Number.isFinite(params.sls.relaxationTimeSec)
  ) {
    issues.push("sls.relaxationTimeSec must be positive and finite");
  }
  return issues;
}

export function evaluateEquilibriumPassiveStressV1(
  totalStrain: number,
  params: EquilibriumPassiveParamsV1,
): EquilibriumPassiveEvaluationV1 {
  const parameterIssues = validateEquilibriumPassiveParamsV1(params);
  if (parameterIssues.length > 0) {
    return invalidPassiveEvaluation(
      totalStrain,
      nestedNumbersFinite(params) && Number.isFinite(totalStrain),
      parameterIssues.join("; "),
    );
  }
  if (!Number.isFinite(totalStrain)) {
    return invalidPassiveEvaluation(
      totalStrain,
      false,
      "totalStrain must be finite",
    );
  }
  const tensile = smoothTensionStrain(
    totalStrain - params.referenceStrain,
    params.tensionTransitionStrain,
  );
  const exponentialArgument = params.exponentialSlope * tensile.value;
  if (
    !Number.isFinite(exponentialArgument) ||
    exponentialArgument > MAX_SAFE_EXP_ARGUMENT
  ) {
    return invalidPassiveEvaluation(
      totalStrain,
      false,
      "passive equilibrium evaluation exceeded its finite numerical domain",
    );
  }
  const exponential = Math.exp(exponentialArgument);
  const exponentialMinusOne = Math.expm1(exponentialArgument);
  const baseStressPa =
    (params.tangentModulusPa / params.exponentialSlope) *
    exponentialMinusOne;
  const baseTangentPa = params.tangentModulusPa * exponential;
  const stressPa = baseStressPa * tensile.firstDerivative;
  const tangentPa =
    baseTangentPa * tensile.firstDerivative * tensile.firstDerivative +
    baseStressPa * tensile.secondDerivative;
  const storageJPerM3 =
    (params.tangentModulusPa /
      (params.exponentialSlope * params.exponentialSlope)) *
    (exponentialMinusOne - exponentialArgument);
  if (![stressPa, tangentPa, storageJPerM3].every(Number.isFinite)) {
    return invalidPassiveEvaluation(
      totalStrain,
      false,
      "passive equilibrium evaluation produced a non-finite value",
    );
  }
  return Object.freeze({
    valid: true,
    finite: true,
    failureReason: null,
    totalStrain,
    stressPa,
    tangentPa,
    storageJPerM3,
  });
}

export function initialEquilibriumPassiveSlsParallelStateV1(
  totalStrain: number,
  slsOverstressPa = 0,
): EquilibriumPassiveSlsParallelStateV1 {
  requireFinite(totalStrain, "totalStrain");
  requireFinite(slsOverstressPa, "slsOverstressPa");
  return Object.freeze({ totalStrain, slsOverstressPa });
}

export function trialEquilibriumPassiveSlsParallelV1(
  previous: EquilibriumPassiveSlsParallelStateV1,
  input: { readonly dtSec: number; readonly totalStrain: number },
  params: EquilibriumPassiveSlsParallelParamsV1,
): EquilibriumPassiveSlsParallelTrialV1 {
  const issues: string[] = [];
  if (!PREPARED_PARAM_OBJECTS.has(params)) {
    issues.push(...validateEquilibriumPassiveSlsParallelParamsV1(params));
  }
  if (!(input.dtSec > 0) || !Number.isFinite(input.dtSec)) {
    issues.push("dtSec must be positive and finite");
  }
  for (const [field, value] of Object.entries({
    previousTotalStrain: previous.totalStrain,
    previousSlsOverstressPa: previous.slsOverstressPa,
    totalStrain: input.totalStrain,
  })) {
    if (!Number.isFinite(value)) issues.push(`${field} must be finite`);
  }
  const sls = params.sls;
  if ((!sls.enabled || sls.modulusPa === 0) && previous.slsOverstressPa !== 0) {
    issues.push("disabled SLS requires exactly zero accepted overstress");
  }
  if (issues.length > 0) return failedTrial(previous, issues);

  const passive = evaluateEquilibriumPassiveStressV1(
    input.totalStrain,
    params.passive,
  );
  if (!passive.valid) {
    return failedTrial(previous, [
      `passive equilibrium invalid: ${passive.failureReason}`,
    ]);
  }
  const slsTrial = backwardEulerSls(
    previous.slsOverstressPa,
    input.totalStrain - previous.totalStrain,
    input.dtSec,
    sls,
  );
  if (!slsTrial.finite) {
    return failedTrial(previous, ["SLS update produced a non-finite readback"]);
  }
  const nextState = Object.freeze({
    totalStrain: input.totalStrain,
    slsOverstressPa: slsTrial.overstressPa,
  });
  const readback: EquilibriumPassiveSlsParallelReadbackV1 = Object.freeze({
    passiveEquilibriumStressPa: passive.stressPa,
    passiveEquilibriumTangentPa: passive.tangentPa,
    passiveEquilibriumStorageJPerM3: passive.storageJPerM3,
    slsOverstressPa: slsTrial.overstressPa,
    slsAlgorithmicTangentPa: slsTrial.algorithmicTangentPa,
    slsStorageJPerM3: slsTrial.storageJPerM3,
    passivePlusSlsStressPa: passive.stressPa + slsTrial.overstressPa,
    passivePlusSlsAlgorithmicTangentPa:
      passive.tangentPa + slsTrial.algorithmicTangentPa,
    slsBalance: slsTrial.balance,
    claim: EQUILIBRIUM_PASSIVE_SLS_PARALLEL_CLAIM_V1,
  });
  return numericLeaves(readback).every(Number.isFinite)
    ? Object.freeze({
        previousState: previous,
        nextState,
        readback,
        valid: true,
        finite: true,
        issues: Object.freeze([]),
      })
    : failedTrial(previous, [
        "passive/SLS readback produced a non-finite value",
      ]);
}

export function commitEquilibriumPassiveSlsParallelTrialV1(
  trial: EquilibriumPassiveSlsParallelTrialV1,
): EquilibriumPassiveSlsParallelStateV1 {
  if (!trial.valid || !trial.finite || trial.nextState == null) {
    throw new Error("cannot commit an invalid passive/SLS trial");
  }
  return Object.freeze({ ...trial.nextState });
}

function validateEquilibriumPassiveParamsV1(
  params: EquilibriumPassiveParamsV1,
): string[] {
  const issues: string[] = [];
  if (!(params.tangentModulusPa > 0) || !Number.isFinite(params.tangentModulusPa)) {
    issues.push("passive.tangentModulusPa must be positive and finite");
  }
  if (!(params.exponentialSlope > 0) || !Number.isFinite(params.exponentialSlope)) {
    issues.push("passive.exponentialSlope must be positive and finite");
  }
  if (!Number.isFinite(params.referenceStrain)) {
    issues.push("passive.referenceStrain must be finite");
  }
  if (
    !(params.tensionTransitionStrain > 0) ||
    !Number.isFinite(params.tensionTransitionStrain)
  ) {
    issues.push("passive.tensionTransitionStrain must be positive and finite");
  }
  return issues;
}

function backwardEulerSls(
  previousOverstressPa: number,
  strainIncrement: number,
  dtSec: number,
  params: OneStateParallelSlsParamsV1,
) {
  if (!params.enabled || params.modulusPa === 0) {
    return Object.freeze({
      finite: true,
      overstressPa: 0,
      storageJPerM3: 0,
      algorithmicTangentPa: 0,
      balance: ZERO_SLS_BALANCE,
    });
  }
  const modulusPa = params.modulusPa;
  const denominator = 1 + dtSec / params.relaxationTimeSec;
  const overstressPa =
    (previousOverstressPa + modulusPa * strainIncrement) / denominator;
  const previousStorage =
    previousOverstressPa * previousOverstressPa / (2 * modulusPa);
  const storageJPerM3 = overstressPa * overstressPa / (2 * modulusPa);
  const storageIncrementJPerM3 = storageJPerM3 - previousStorage;
  const physicalRelaxationDissipationJPerM3 =
    dtSec * overstressPa * overstressPa /
    (modulusPa * params.relaxationTimeSec);
  const qIncrement = overstressPa - previousOverstressPa;
  const backwardEulerNumericalDissipationJPerM3 =
    qIncrement * qIncrement / (2 * modulusPa);
  const workIncrementJPerM3 = overstressPa * strainIncrement;
  const balance: OneStateParallelSlsBalanceV1 = Object.freeze({
    workIncrementJPerM3,
    storageIncrementJPerM3,
    physicalRelaxationDissipationJPerM3,
    backwardEulerNumericalDissipationJPerM3,
    physicalRelaxationDissipationRateWPerM3:
      physicalRelaxationDissipationJPerM3 / dtSec,
    backwardEulerNumericalDissipationRateWPerM3:
      backwardEulerNumericalDissipationJPerM3 / dtSec,
    discreteBalanceResidualJPerM3:
      workIncrementJPerM3 -
      storageIncrementJPerM3 -
      physicalRelaxationDissipationJPerM3 -
      backwardEulerNumericalDissipationJPerM3,
  });
  const finite = [
    overstressPa,
    storageJPerM3,
    modulusPa / denominator,
    ...Object.values(balance),
  ].every(Number.isFinite);
  return Object.freeze({
    finite,
    overstressPa,
    storageJPerM3,
    algorithmicTangentPa: modulusPa / denominator,
    balance,
  });
}

function smoothTensionStrain(strain: number, transition: number) {
  if (strain <= 0) {
    return Object.freeze({ value: 0, firstDerivative: 0, secondDerivative: 0 });
  }
  if (strain >= transition) {
    return Object.freeze({
      value: strain - 0.5 * transition,
      firstDerivative: 1,
      secondDerivative: 0,
    });
  }
  const t = strain / transition;
  return Object.freeze({
    value: transition * (t * t * t - 0.5 * t * t * t * t),
    firstDerivative: 3 * t * t - 2 * t * t * t,
    secondDerivative: (6 * t - 6 * t * t) / transition,
  });
}

function invalidPassiveEvaluation(
  totalStrain: number,
  finite: boolean,
  failureReason: string,
): EquilibriumPassiveEvaluationV1 {
  return Object.freeze({
    valid: false,
    finite,
    failureReason,
    totalStrain,
    stressPa: null,
    tangentPa: null,
    storageJPerM3: null,
  });
}

function failedTrial(
  previousState: EquilibriumPassiveSlsParallelStateV1,
  issues: readonly string[],
): EquilibriumPassiveSlsParallelTrialV1 {
  return Object.freeze({
    previousState,
    nextState: null,
    readback: null,
    valid: false,
    finite: false,
    issues: Object.freeze([...issues]),
  });
}

function nestedNumbersFinite(value: unknown): boolean {
  return numericLeaves(value).every(Number.isFinite);
}

function numericLeaves(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value == null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numericLeaves);
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
}

const MAX_SAFE_EXP_ARGUMENT = 700;

const ZERO_SLS_BALANCE: OneStateParallelSlsBalanceV1 = Object.freeze({
  workIncrementJPerM3: 0,
  storageIncrementJPerM3: 0,
  physicalRelaxationDissipationJPerM3: 0,
  backwardEulerNumericalDissipationJPerM3: 0,
  physicalRelaxationDissipationRateWPerM3: 0,
  backwardEulerNumericalDissipationRateWPerM3: 0,
  discreteBalanceResidualJPerM3: 0,
});
