import { LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1 } from
  "@/engine/myocardium/atrialLandNiederer2018";
import {
  evaluateLand2017AlgebraicTerms,
  land2017CaTRPNUnblockingFactor,
  type Land2017EquationParameters,
} from "@/engine/myocardium/myofilament/land2017/equations";
import { evaluateLand2017ContinuousOutput } from
  "@/engine/myocardium/myofilament/land2017/outputs";
import {
  solveLand2017BackwardEulerSubsteps,
  type Land2017SubstepSolveOptions,
} from "@/engine/myocardium/myofilament/land2017/solver";
import {
  LAND2017_EQUATIONS_VERSION,
  LAND2017_STATE_LABELS,
} from "@/engine/myocardium/myofilament/land2017/types";

export const LAND2017_ACTIVE_ONLY_V1_ID =
  "land2017-active-only-log-strain-adapter-v1" as const;

export const LAND2017_ACTIVE_ONLY_CLAIM_V1 = Object.freeze({
  role: "component-comparator-not-runtime-owner" as const,
  equationVersion: LAND2017_EQUATIONS_VERSION,
  prescribedFreeCalciumInput: true as const,
  calciumCyclingModelled: false as const,
  externalSeriesElasticElementAdded: false as const,
  postHocForceVelocityMultiplierAdded: false as const,
  activeStressGainAdded: false as const,
  passiveStressIncluded: false as const,
  slsStressIncluded: false as const,
  sourceStressMeasure: "nominal-conjugate-to-land-stretch" as const,
  wallStressMeasure: "Kirchhoff-conjugate-to-fiber-log-strain" as const,
  lengthMap: "lambdaLand=lambdaLandSlack*exp(fiberLogStrain)" as const,
  stressMap: "tauActive=lambdaLand*sourceNominalActiveStress" as const,
  primaryFeStressConventionReconfirmationRequiredBeforeRuntimePromotion:
    true as const,
  transactionalState: "pure-trial-explicit-commit" as const,
});

export type Land2017ActiveOnlyParamsV1 = {
  readonly parameterSet: Land2017EquationParameters;
  readonly parameterPackId: string;
  readonly parameterPackStableHash: string;
  readonly lambdaLandSlack: number;
  readonly solveOptions: Land2017SubstepSolveOptions;
};

export type Land2017ActiveOnlyStateV1 = {
  readonly landState: readonly number[];
  readonly previousFiberLogStrain: number;
  readonly previousFreeCalciumUm: number;
};

export type Land2017ActiveOnlyTrialInputV1 = {
  readonly dtSec: number;
  readonly fiberLogStrain: number;
  readonly freeCalciumUm: number;
};

export type Land2017ActiveOnlyReadbackV1 = {
  readonly sourceNominalActiveStressPa: number;
  readonly wallActiveKirchhoffStressPa: number;
  readonly fiberLogStrain: number;
  readonly fiberLogStrainRatePerSec: number;
  readonly previousLandStretch: number;
  readonly landStretch: number;
  readonly landStretchRatePerSec: number;
  readonly continuousSourcePowerDensityWPerM3: number;
  readonly continuousWallPowerDensityWPerM3: number;
  readonly continuousPowerResidualWPerM3: number;
  readonly discreteWorkConjugateKirchhoffStressPa: number;
  readonly discreteSourcePowerDensityWPerM3: number;
  readonly discreteWallPowerDensityWPerM3: number;
  readonly discretePowerResidualWPerM3: number;
  readonly sourceReportedPowerDensityWPerM3: number;
  readonly sourceReportedPowerResidualWPerM3: number;
  readonly finiteDifferenceLogToStretchJacobian: number;
  readonly finiteDifferenceWorkConjugateKirchhoffStressPa: number;
  readonly finiteDifferenceWorkConjugacyResidualPa: number;
  readonly state: Readonly<Record<(typeof LAND2017_STATE_LABELS)[number], number>>;
  readonly health: {
    readonly finite: boolean;
    readonly stateConservationResidual: number;
    readonly minimumPopulation: number;
    readonly projectionUsed: boolean;
  };
  readonly solver: {
    readonly iterations: number;
    readonly residualNorm: number;
    readonly lineSearchSteps: number;
    readonly substeps: number;
  };
  readonly claim: typeof LAND2017_ACTIVE_ONLY_CLAIM_V1;
};

export type Land2017ActiveOnlyTrialV1 = {
  readonly previousState: Land2017ActiveOnlyStateV1;
  readonly nextState: Land2017ActiveOnlyStateV1 | null;
  readonly readback: Land2017ActiveOnlyReadbackV1 | null;
  readonly valid: boolean;
  readonly finite: boolean;
  readonly issues: readonly string[];
};

export const DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1:
Land2017ActiveOnlyParamsV1 = Object.freeze({
  parameterSet:
    LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1
      .effectiveEquationParameters,
  parameterPackId:
    LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.parameterPackId,
  parameterPackStableHash:
    LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.parameterPackStableHash,
  lambdaLandSlack: 1,
  solveOptions: Object.freeze({
    maxIterations: 20,
    residualTolerance: 1e-10,
    lineSearchMinStep: 1 / 4096,
    substeps: 4,
  }),
});

export function initialLand2017ActiveOnlyStateV1(
  fiberLogStrain: number,
  freeCalciumUm: number,
  params: Land2017ActiveOnlyParamsV1 =
    DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1,
): Land2017ActiveOnlyStateV1 {
  validateParams(params);
  const landStretch = landStretchAt(fiberLogStrain, params.lambdaLandSlack);
  const landState = Object.freeze(Array.from(land2017IsometricSteadyStateV1(
    landStretch,
    freeCalciumUm,
    params.parameterSet,
  )));
  return Object.freeze({
    landState,
    previousFiberLogStrain: fiberLogStrain,
    previousFreeCalciumUm: freeCalciumUm,
  });
}

export function trialLand2017ActiveOnlyV1(
  previous: Land2017ActiveOnlyStateV1,
  input: Land2017ActiveOnlyTrialInputV1,
  params: Land2017ActiveOnlyParamsV1 =
    DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1,
): Land2017ActiveOnlyTrialV1 {
  try {
    validateParams(params);
    validateState(previous);
    validateInput(input);
    const previousLandStretch = landStretchAt(
      previous.previousFiberLogStrain,
      params.lambdaLandSlack,
    );
    const landStretch = landStretchAt(
      input.fiberLogStrain,
      params.lambdaLandSlack,
    );
    const solved = solveLand2017BackwardEulerSubsteps(
      previous.landState,
      {
        freeCalciumUM: input.freeCalciumUm,
        previousFiberEngineeringStrain: previousLandStretch - 1,
        stageFiberEngineeringStrain: landStretch - 1,
        dtSec: input.dtSec,
        stage: { scheme: "BE", stageIndex: 0 },
      },
      {
        ...params.solveOptions,
        previousFreeCalciumUM: previous.previousFreeCalciumUm,
      },
      params.parameterSet,
    );
    if (!solved.ok || solved.output == null) {
      return failedTrial(
        previous,
        solved.failureMessage ?? solved.failureReason ?? "Land solve failed",
      );
    }
    const sourceStressPa = solved.output.sourceActiveFiberStressPa;
    const logIncrement =
      input.fiberLogStrain - previous.previousFiberLogStrain;
    const fiberLogStrainRatePerSec = logIncrement / input.dtSec;
    const landStretchIncrement = landStretch - previousLandStretch;
    const landStretchRatePerSec = landStretchIncrement / input.dtSec;
    const wallStressPa = landStretch * sourceStressPa;
    const continuousSourcePower =
      sourceStressPa * landStretch * fiberLogStrainRatePerSec;
    const continuousWallPower = wallStressPa * fiberLogStrainRatePerSec;
    const discreteScale = logarithmicIncrementScale(
      previousLandStretch,
      landStretch,
      logIncrement,
    );
    const discreteWallStressPa = sourceStressPa * discreteScale;
    const discreteSourcePower = sourceStressPa * landStretchRatePerSec;
    const discreteWallPower =
      discreteWallStressPa * fiberLogStrainRatePerSec;
    const sourceReportedPower =
      solved.output.sourceActivePowerDensityWPerM3;
    const finiteDifferenceJacobian = finiteDifferenceLandStretchJacobian(
      input.fiberLogStrain,
      params.lambdaLandSlack,
    );
    const finiteDifferenceWallStressPa =
      sourceStressPa * finiteDifferenceJacobian;
    const nextState = Object.freeze({
      landState: Object.freeze(Array.from(solved.nextState)),
      previousFiberLogStrain: input.fiberLogStrain,
      previousFreeCalciumUm: input.freeCalciumUm,
    });
    const state = Object.freeze(Object.fromEntries(
      LAND2017_STATE_LABELS.map((label, index) => [
        label,
        solved.nextState[index]!,
      ]),
    )) as Readonly<
      Record<(typeof LAND2017_STATE_LABELS)[number], number>
    >;
    const readback: Land2017ActiveOnlyReadbackV1 = Object.freeze({
      sourceNominalActiveStressPa: sourceStressPa,
      wallActiveKirchhoffStressPa: wallStressPa,
      fiberLogStrain: input.fiberLogStrain,
      fiberLogStrainRatePerSec,
      previousLandStretch,
      landStretch,
      landStretchRatePerSec,
      continuousSourcePowerDensityWPerM3: continuousSourcePower,
      continuousWallPowerDensityWPerM3: continuousWallPower,
      continuousPowerResidualWPerM3:
        continuousWallPower - continuousSourcePower,
      discreteWorkConjugateKirchhoffStressPa: discreteWallStressPa,
      discreteSourcePowerDensityWPerM3: discreteSourcePower,
      discreteWallPowerDensityWPerM3: discreteWallPower,
      discretePowerResidualWPerM3: discreteWallPower - discreteSourcePower,
      sourceReportedPowerDensityWPerM3: sourceReportedPower,
      sourceReportedPowerResidualWPerM3:
        sourceReportedPower - discreteSourcePower,
      finiteDifferenceLogToStretchJacobian: finiteDifferenceJacobian,
      finiteDifferenceWorkConjugateKirchhoffStressPa:
        finiteDifferenceWallStressPa,
      finiteDifferenceWorkConjugacyResidualPa:
        finiteDifferenceWallStressPa - wallStressPa,
      state,
      health: Object.freeze({ ...solved.output.health }),
      solver: Object.freeze({
        iterations: solved.iterations,
        residualNorm: solved.residualNorm,
        lineSearchSteps: solved.lineSearchSteps,
        substeps: solved.substeps,
      }),
      claim: LAND2017_ACTIVE_ONLY_CLAIM_V1,
    });
    const finite = numericLeaves(readback).every(Number.isFinite);
    if (!finite || !readback.health.finite) {
      return failedTrial(previous, "Land output left its finite state domain");
    }
    return Object.freeze({
      previousState: previous,
      nextState,
      readback,
      valid: true,
      finite: true,
      issues: Object.freeze([]),
    });
  } catch (error) {
    return failedTrial(
      previous,
      error instanceof Error ? error.message : "unknown Land active-only error",
    );
  }
}

export function commitLand2017ActiveOnlyTrialV1(
  trial: Land2017ActiveOnlyTrialV1,
): Land2017ActiveOnlyStateV1 {
  if (!trial.valid || !trial.finite || trial.nextState == null) {
    throw new Error("cannot commit an invalid Land active-only trial");
  }
  return Object.freeze({
    landState: Object.freeze(Array.from(trial.nextState.landState)),
    previousFiberLogStrain: trial.nextState.previousFiberLogStrain,
    previousFreeCalciumUm: trial.nextState.previousFreeCalciumUm,
  });
}

/** Analytic zero-rate equilibrium of the tracked Land source equations. */
export function land2017IsometricSteadyStateV1(
  landStretch: number,
  freeCalciumUm: number,
  parameterSet: Land2017EquationParameters,
): Float64Array {
  if (!(landStretch > 0) || !Number.isFinite(landStretch)) {
    throw new Error("landStretch must be positive and finite");
  }
  if (!(freeCalciumUm > 0) || !Number.isFinite(freeCalciumUm)) {
    throw new Error("freeCalciumUm must be positive and finite");
  }
  const p = parameterSet.values;
  const d = parameterSet.derived;
  const terms = evaluateLand2017AlgebraicTerms(
    Float64Array.from([0.5, 0, 0, 0, 0, 0]),
    { fiberEngineeringStrain: landStretch - 1 },
    parameterSet,
  );
  const caDrive = Math.pow(freeCalciumUm / terms.CaT50, p.nTRPN);
  const caTroponin = caDrive / (1 + caDrive);
  const bCoefficient =
    (d.kb * land2017CaTRPNUnblockingFactor(caTroponin, p)) /
    (p.ku * Math.pow(caTroponin, p.nTm / 2));
  const wCoefficient = p.kuw / (d.kwu + p.kws);
  const sCoefficient = (p.kws * wCoefficient) / d.ksu;
  const unbound =
    1 / (1 + bCoefficient + wCoefficient + sCoefficient);
  const state = Float64Array.from([
    caTroponin,
    bCoefficient * unbound,
    wCoefficient * unbound,
    sCoefficient * unbound,
    0,
    0,
  ]);
  const output = evaluateLand2017ContinuousOutput(
    state,
    {
      freeCalciumUM: freeCalciumUm,
      fiberEngineeringStrain: landStretch - 1,
      fiberEngineeringStrainRatePerSec: 0,
    },
    parameterSet,
  );
  if (!output.health.finite) {
    throw new Error("analytic Land equilibrium left the source state domain");
  }
  return state;
}

function landStretchAt(fiberLogStrain: number, lambdaLandSlack: number): number {
  const value = lambdaLandSlack * Math.exp(fiberLogStrain);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error("Land stretch must be positive and finite");
  }
  return value;
}

function finiteDifferenceLandStretchJacobian(
  fiberLogStrain: number,
  lambdaLandSlack: number,
): number {
  const step = 1e-6;
  return (
    landStretchAt(fiberLogStrain + step, lambdaLandSlack) -
    landStretchAt(fiberLogStrain - step, lambdaLandSlack)
  ) / (2 * step);
}

function logarithmicIncrementScale(
  previousStretch: number,
  stretch: number,
  logIncrement: number,
): number {
  if (Math.abs(logIncrement) <= 1e-12) return stretch;
  return (stretch - previousStretch) / logIncrement;
}

function validateParams(params: Land2017ActiveOnlyParamsV1): void {
  if (!(params.lambdaLandSlack > 0) || !Number.isFinite(params.lambdaLandSlack)) {
    throw new Error("lambdaLandSlack must be positive and finite");
  }
  if (params.parameterPackId.trim().length === 0) {
    throw new Error("parameterPackId must be non-empty");
  }
  if (params.parameterPackStableHash.trim().length === 0) {
    throw new Error("parameterPackStableHash must be non-empty");
  }
}

function validateState(state: Land2017ActiveOnlyStateV1): void {
  if (state.landState.length !== LAND2017_STATE_LABELS.length) {
    throw new Error("Land active-only state must contain six source states");
  }
  if (!Array.from(state.landState).every(Number.isFinite)) {
    throw new Error("Land active-only state must be finite");
  }
  if (!Number.isFinite(state.previousFiberLogStrain)) {
    throw new Error("previousFiberLogStrain must be finite");
  }
  if (!(state.previousFreeCalciumUm >= 0) ||
      !Number.isFinite(state.previousFreeCalciumUm)) {
    throw new Error("previousFreeCalciumUm must be finite and non-negative");
  }
}

function validateInput(input: Land2017ActiveOnlyTrialInputV1): void {
  if (!(input.dtSec > 0) || !Number.isFinite(input.dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  if (!Number.isFinite(input.fiberLogStrain)) {
    throw new Error("fiberLogStrain must be finite");
  }
  if (!(input.freeCalciumUm >= 0) || !Number.isFinite(input.freeCalciumUm)) {
    throw new Error("freeCalciumUm must be finite and non-negative");
  }
}

function failedTrial(
  previousState: Land2017ActiveOnlyStateV1,
  issue: string,
): Land2017ActiveOnlyTrialV1 {
  return Object.freeze({
    previousState,
    nextState: null,
    readback: null,
    valid: false,
    finite: false,
    issues: Object.freeze([issue]),
  });
}

function numericLeaves(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value == null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numericLeaves);
}
