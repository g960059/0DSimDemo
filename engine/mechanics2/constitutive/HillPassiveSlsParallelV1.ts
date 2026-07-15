import {
  DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
  evaluateHillPassiveEquilibriumV1,
  prepareHillCeSeeSlsParamsV1,
  type HillCeSeeSlsParamsV1,
  type HillCeSeeSlsSlsBalanceReadbackV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";

/**
 * Equilibrium passive spring plus one parallel Maxwell overstress state.
 *
 * This deliberately owns only equilibrium-passive and SLS parameters. Hill CE,
 * SEE, calcium, and serial-root solver fields are absent from its public pack.
 */
export const HILL_PASSIVE_SLS_PARALLEL_CLAIM_V1 = Object.freeze({
  topology: "equilibrium-passive-spring-plus-parallel-maxwell-arm" as const,
  strainMeasure: "natural-log-strain" as const,
  stressMeasure: "one-dimensional-Kirchhoff-stress" as const,
  workConjugatePair:
    "Kirchhoff-stress-times-natural-log-strain-rate" as const,
  passiveSource: "pr467-hill-equilibrium-passive-potential" as const,
  slsUpdate: "backward-euler-one-state-overstress" as const,
  contractileElementEvaluated: false as const,
  seriesElasticElementEvaluated: false as const,
  calciumActivationEvaluated: false as const,
  pureTrialExplicitCommit: true as const,
});

export type HillPassiveSlsParallelParamsV1 = {
  /** Stable provenance identity; changing it requires a cold trajectory. */
  readonly parameterSetId: string;
  readonly passive: HillCeSeeSlsParamsV1["passive"];
  readonly sls: HillCeSeeSlsParamsV1["sls"];
};

declare const PREPARED_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1: unique symbol;

export type PreparedHillPassiveSlsParallelParamsV1 =
  HillPassiveSlsParallelParamsV1 & {
    readonly [PREPARED_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1]: true;
  };

const PREPARED_PARAM_OBJECTS = new WeakSet<object>();
const PASSIVE_EVALUATION_ADAPTERS = new WeakMap<
  object,
  HillCeSeeSlsParamsV1
>();

/** Exact passive/SLS projection of the original engineering seed. */
export const DEFAULT_HILL_PASSIVE_SLS_PARALLEL_PARAMS_V1 =
  prepareHillPassiveSlsParallelParamsV1({
    parameterSetId: DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.parameterSetId,
    passive: DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.passive,
    sls: DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.sls,
  });

export type HillPassiveSlsParallelStateV1 = {
  readonly totalStrain: number;
  readonly slsOverstressPa: number;
};

export type HillPassiveSlsParallelTrialV1 = {
  readonly previousState: HillPassiveSlsParallelStateV1;
  readonly nextState: HillPassiveSlsParallelStateV1 | null;
  readonly readback: {
    readonly passiveEquilibriumStressPa: number;
    readonly passiveEquilibriumTangentPa: number;
    readonly passiveEquilibriumStorageJPerM3: number;
    readonly slsOverstressPa: number;
    readonly slsAlgorithmicTangentPa: number;
    readonly slsStorageJPerM3: number;
    readonly passivePlusSlsStressPa: number;
    readonly passivePlusSlsAlgorithmicTangentPa: number;
    readonly slsBalance: HillCeSeeSlsSlsBalanceReadbackV1;
    readonly claim: typeof HILL_PASSIVE_SLS_PARALLEL_CLAIM_V1;
  } | null;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly string[];
};

export function initialHillPassiveSlsParallelStateV1(
  totalStrain: number,
  slsOverstressPa = 0,
): HillPassiveSlsParallelStateV1 {
  requireFinite(totalStrain, "totalStrain");
  requireFinite(slsOverstressPa, "slsOverstressPa");
  return Object.freeze({ totalStrain, slsOverstressPa });
}

export function trialHillPassiveSlsParallelV1(
  previous: HillPassiveSlsParallelStateV1,
  input: { readonly dtSec: number; readonly totalStrain: number },
  params: HillPassiveSlsParallelParamsV1,
): HillPassiveSlsParallelTrialV1 {
  const issues: string[] = [];
  if (!PREPARED_PARAM_OBJECTS.has(params)) {
    issues.push(...validateHillPassiveSlsParallelParamsV1(params));
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
  if (issues.length > 0) return failed(previous, issues);

  const passive = evaluateHillPassiveEquilibriumV1(
    input.totalStrain,
    passiveEvaluationAdapter(params),
  );
  if (!passive.valid) {
    return failed(previous, [
      `passive equilibrium invalid: ${passive.failureReason}`,
    ]);
  }
  const strainIncrement = input.totalStrain - previous.totalStrain;
  const slsTrial = backwardEulerSls(
    previous.slsOverstressPa,
    strainIncrement,
    input.dtSec,
    sls,
  );
  if (!slsTrial.finite) {
    return failed(previous, ["SLS update produced a non-finite readback"]);
  }
  const nextState = Object.freeze({
    totalStrain: input.totalStrain,
    slsOverstressPa: slsTrial.overstressPa,
  });
  const readback = Object.freeze({
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
    claim: HILL_PASSIVE_SLS_PARALLEL_CLAIM_V1,
  });
  const finite = numericLeaves(readback).every(Number.isFinite);
  return finite
    ? Object.freeze({
        previousState: previous,
        nextState,
        readback,
        valid: true,
        finite: true,
        issues: Object.freeze([]),
      })
    : failed(previous, ["passive/SLS readback produced a non-finite value"]);
}

export function prepareHillPassiveSlsParallelParamsV1(
  params: HillPassiveSlsParallelParamsV1,
): PreparedHillPassiveSlsParallelParamsV1 {
  const snapshot: HillPassiveSlsParallelParamsV1 = {
    parameterSetId: params.parameterSetId,
    passive: { ...params.passive },
    sls: { ...params.sls },
  };
  const issues = validateHillPassiveSlsParallelParamsV1(snapshot);
  if (issues.length > 0) throw new Error(issues.join("; "));
  const prepared = Object.freeze({
    ...snapshot,
    passive: Object.freeze(snapshot.passive),
    sls: Object.freeze(snapshot.sls),
  }) as PreparedHillPassiveSlsParallelParamsV1;
  PREPARED_PARAM_OBJECTS.add(prepared);
  PASSIVE_EVALUATION_ADAPTERS.set(prepared, createPassiveEvaluationAdapter(prepared));
  return prepared;
}

export function validateHillPassiveSlsParallelParamsV1(
  params: HillPassiveSlsParallelParamsV1,
): readonly string[] {
  const issues: string[] = [];
  if (
    typeof params.parameterSetId !== "string" ||
    params.parameterSetId.trim().length === 0
  ) {
    issues.push("parameterSetId must be a non-empty string");
  }
  if (
    !(params.passive.tangentModulusPa > 0) ||
    !Number.isFinite(params.passive.tangentModulusPa)
  ) {
    issues.push("passive.tangentModulusPa must be positive and finite");
  }
  if (
    !(params.passive.exponentialSlope > 0) ||
    !Number.isFinite(params.passive.exponentialSlope)
  ) {
    issues.push("passive.exponentialSlope must be positive and finite");
  }
  if (!Number.isFinite(params.passive.referenceStrain)) {
    issues.push("passive.referenceStrain must be finite");
  }
  if (
    !(params.passive.tensionTransitionStrain > 0) ||
    !Number.isFinite(params.passive.tensionTransitionStrain)
  ) {
    issues.push(
      "passive.tensionTransitionStrain must be positive and finite",
    );
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

function passiveEvaluationAdapter(
  params: HillPassiveSlsParallelParamsV1,
): HillCeSeeSlsParamsV1 {
  return (
    PASSIVE_EVALUATION_ADAPTERS.get(params) ??
    createPassiveEvaluationAdapter(params)
  );
}

/**
 * Compatibility adapter for the tracked V1 passive evaluator. Its CE/SEE/Ca
 * defaults are validated but never evaluated by that pure passive entry point.
 */
function createPassiveEvaluationAdapter(
  params: HillPassiveSlsParallelParamsV1,
): HillCeSeeSlsParamsV1 {
  return prepareHillCeSeeSlsParamsV1({
    ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
    parameterSetId: params.parameterSetId,
    passive: params.passive,
    sls: params.sls,
  });
}

export function commitHillPassiveSlsParallelTrialV1(
  trial: HillPassiveSlsParallelTrialV1,
): HillPassiveSlsParallelStateV1 {
  if (!trial.valid || !trial.finite || trial.nextState == null) {
    throw new Error("cannot commit an invalid passive/SLS trial");
  }
  return Object.freeze({ ...trial.nextState });
}

function backwardEulerSls(
  previousOverstressPa: number,
  strainIncrement: number,
  dtSec: number,
  sls: HillCeSeeSlsParamsV1["sls"],
) {
  if (!sls.enabled || sls.modulusPa === 0) {
    return Object.freeze({
      finite: true,
      overstressPa: 0,
      storageJPerM3: 0,
      algorithmicTangentPa: 0,
      balance: ZERO_SLS_BALANCE,
    });
  }
  const modulusPa = sls.modulusPa;
  const denominator = 1 + dtSec / sls.relaxationTimeSec;
  const overstressPa =
    (previousOverstressPa + modulusPa * strainIncrement) / denominator;
  const previousStorage =
    previousOverstressPa * previousOverstressPa / (2 * modulusPa);
  const storageJPerM3 = overstressPa * overstressPa / (2 * modulusPa);
  const storageIncrementJPerM3 = storageJPerM3 - previousStorage;
  const physicalRelaxationDissipationJPerM3 =
    dtSec * overstressPa * overstressPa /
    (modulusPa * sls.relaxationTimeSec);
  const qIncrement = overstressPa - previousOverstressPa;
  const backwardEulerNumericalDissipationJPerM3 =
    qIncrement * qIncrement / (2 * modulusPa);
  const workIncrementJPerM3 = overstressPa * strainIncrement;
  const balance: HillCeSeeSlsSlsBalanceReadbackV1 = Object.freeze({
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

function failed(
  previous: HillPassiveSlsParallelStateV1,
  issues: readonly string[],
): HillPassiveSlsParallelTrialV1 {
  return Object.freeze({
    previousState: previous,
    nextState: null,
    readback: null,
    valid: false,
    finite: false,
    issues: Object.freeze([...issues]),
  });
}

function numericLeaves(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value == null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numericLeaves);
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
}

const ZERO_SLS_BALANCE: HillCeSeeSlsSlsBalanceReadbackV1 = Object.freeze({
  workIncrementJPerM3: 0,
  storageIncrementJPerM3: 0,
  physicalRelaxationDissipationJPerM3: 0,
  backwardEulerNumericalDissipationJPerM3: 0,
  physicalRelaxationDissipationRateWPerM3: 0,
  backwardEulerNumericalDissipationRateWPerM3: 0,
  discreteBalanceResidualJPerM3: 0,
});
