import {
  computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep,
  evaluateLand2017ContinuousOutput,
  solveLand2017BackwardEulerStep,
  type Land2017EquationParameters,
  type LandSourceOutput,
} from "@/engine/myocardium/myofilament/land2017";
import {
  fullHotPathInvariantsEnabledV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  PARALLEL_ONE_STATE_SLS_CLAIM_V1,
  initialParallelOneStateSlsStateV1,
  stepParallelOneStateSlsBackwardEulerV1,
  type ParallelOneStateSlsEvaluationV1,
  type ParallelOneStateSlsParamsV1,
  type ParallelOneStateSlsStateV1,
} from "@/engine/myocardium/mechanics/parallelOneStateSlsV1";

export const LAND_SLS_WALL_MATERIAL_V1_ID =
  "land-active-equilibrium-passive-parallel-sls-wall-v1" as const;

export const LAND_SLS_WALL_MATERIAL_CLAIM_V1 = Object.freeze({
  stressAssembly: "equilibrium-passive-plus-Land-active-plus-parallel-SLS" as const,
  activeLaw: "Land-2017-active-only" as const,
  externalSeriesElasticElement: false as const,
  postHocForceVelocityMultiplier: false as const,
  intrinsicLandDistortionStatesRetained: true as const,
  exactZeroViabilityAllowed: true as const,
  equilibriumPassiveLawOwnedHere: false as const,
  phasePressureOrFlowShapeInput: false as const,
  algorithmicTangent:
    "smooth-branch-exact-one-step-BE-with-Clarke-midpoint-at-zetaS-0-and-minus-1" as const,
});

const DEFAULT_LAND_STATE = Object.freeze([0.18, 0.22, 0.04, 0.02, 0, 0] as const);

export type LandSlsWallMaterialParamsV1 = {
  readonly parameterSetId: string;
  readonly landEquationParameters: Land2017EquationParameters;
  /** Maps geometry stretch exp(e) to the Land sarcomere stretch. */
  readonly landSlackStretch: number;
  /** Effective fiber-family projection; a measurable homogenization axis. */
  readonly orientationFraction01: number;
  /** Viable active myocardium fraction; zero is an exact active-stress off state. */
  readonly viableActiveFraction01: number;
  readonly sls: ParallelOneStateSlsParamsV1;
};

export type LandSlsWallMaterialStateV1 = {
  readonly landState: Float64Array;
  readonly slsState: ParallelOneStateSlsStateV1;
  readonly previousFiberLogStrain: number;
  readonly previousFreeCalciumUM: number;
};

export type LandSlsWallEquilibriumPassiveInputV1 = {
  readonly stressPa: number;
  readonly tangentPa: number;
  readonly storedEnergyDensityJPerM3: number;
};

export type LandSlsWallMaterialEvaluationV1 = {
  readonly modelId: typeof LAND_SLS_WALL_MATERIAL_V1_ID;
  readonly parameterSetId: string;
  readonly state: LandSlsWallMaterialStateV1;
  readonly fiberLogStrain: number;
  readonly landStretch: number;
  readonly landEngineeringStrain: number;
  readonly land: LandSourceOutput;
  readonly activeNominalStressPa: number;
  readonly activeKirchhoffStressPa: number;
  readonly equilibriumPassive: LandSlsWallEquilibriumPassiveInputV1;
  readonly sls: ParallelOneStateSlsEvaluationV1;
  readonly totalKirchhoffStressPa: number;
  readonly activeAlgorithmicTangentPa: number;
  readonly totalAlgorithmicTangentPa: number;
  readonly passiveAndSlsTangentPa: number;
  readonly landSolverIterations: number;
  readonly landSolverResidualNorm: number;
  readonly finite: boolean;
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly claim: typeof LAND_SLS_WALL_MATERIAL_CLAIM_V1;
};

/**
 * Minimal constitutive result consumed by rejected outer Newton candidates.
 *
 * It deliberately omits the public Land/SLS audit ledgers.  The accepted root
 * is evaluated through the public path before commit, so those ledgers remain
 * part of the durable mechanics boundary without being allocated for every
 * numerical probe.
 */
export type LandSlsWallNumericalTrialV1 = Readonly<{
  state: LandSlsWallMaterialStateV1;
  fiberLogStrain: number;
  totalKirchhoffStressPa: number;
  activeKirchhoffStressPa: number;
  totalAlgorithmicTangentPa: number;
  activeAlgorithmicTangentPa: number;
  landSolverIterations: number;
  residualNorm: number;
}>;

export type LandSlsWallColdResultV1 = {
  readonly state: LandSlsWallMaterialStateV1;
  readonly fixedInputIterations: number;
  readonly maximumStateUpdate: number;
  readonly converged: boolean;
};

export function initializeLandSlsWallAtFixedInputV1(
  fiberLogStrain: number,
  freeCalciumUM: number,
  params: LandSlsWallMaterialParamsV1,
  options: {
    readonly relaxationDtSec?: number;
    readonly maximumIterations?: number;
    readonly stateTolerance?: number;
  } = {},
): LandSlsWallColdResultV1 {
  validateParams(params);
  requireFinite(fiberLogStrain, "fiberLogStrain");
  requireNonnegative(freeCalciumUM, "freeCalciumUM");
  const relaxationDtSec = options.relaxationDtSec ?? 0.002;
  const maximumIterations = options.maximumIterations ?? 800;
  const stateTolerance = options.stateTolerance ?? 1e-10;
  requirePositive(relaxationDtSec, "relaxationDtSec");
  if (!Number.isInteger(maximumIterations) || maximumIterations <= 0) {
    throw new Error("maximumIterations must be a positive integer");
  }
  requirePositive(stateTolerance, "stateTolerance");

  const engineeringStrain = landEngineeringStrain(fiberLogStrain, params);
  let landState = Float64Array.from(DEFAULT_LAND_STATE);
  let maximumStateUpdate = Number.POSITIVE_INFINITY;
  let iterations = 0;
  for (; iterations < maximumIterations; iterations += 1) {
    const solved = solveLand2017BackwardEulerStep(
      landState,
      {
        freeCalciumUM,
        previousFiberEngineeringStrain: engineeringStrain,
        stageFiberEngineeringStrain: engineeringStrain,
        dtSec: relaxationDtSec,
        stage: { scheme: "BE", stageIndex: 0 },
      },
      {
        maxIterations: 20,
        residualTolerance: 1e-10,
        lineSearchMinStep: 1 / 4096,
      },
      params.landEquationParameters,
    );
    if (!solved.ok) {
      throw new Error(
        `Land fixed-input initialization failed: ${solved.failureReason ?? "unknown"}`,
      );
    }
    maximumStateUpdate = maxDifference(landState, solved.nextState);
    landState = solved.nextState;
    if (maximumStateUpdate <= stateTolerance) {
      iterations += 1;
      break;
    }
  }
  const converged = maximumStateUpdate <= stateTolerance;
  return Object.freeze({
    state: Object.freeze({
      landState: Float64Array.from(landState),
      slsState: initialParallelOneStateSlsStateV1(fiberLogStrain),
      previousFiberLogStrain: fiberLogStrain,
      previousFreeCalciumUM: freeCalciumUM,
    }),
    fixedInputIterations: iterations,
    maximumStateUpdate,
    converged,
  });
}

export function trialLandSlsWallMaterialV1(
  previous: LandSlsWallMaterialStateV1,
  input: {
    readonly nextFiberLogStrain: number;
    readonly nextFreeCalciumUM: number;
    readonly dtSec: number;
    readonly equilibriumPassive: LandSlsWallEquilibriumPassiveInputV1;
  },
  params: LandSlsWallMaterialParamsV1,
): LandSlsWallMaterialEvaluationV1 {
  const issues: string[] = [];
  try {
    validateParamsOncePerObject(params);
    // The previous state is this kernel's own output from the previous accepted
    // step, re-checked here on every wall of every candidate. It is a defensive
    // precondition, not a reported value, so it belongs to the full-invariant
    // tier; see engine/hotPathIntegrityTierV1.ts. Cold initialization and the
    // accepted-state evaluation below still validate unconditionally, and a
    // state arriving from a checkpoint therefore still passes through a check.
    if (fullHotPathInvariantsEnabledV1()) validateState(previous);
    requireFinite(input.nextFiberLogStrain, "nextFiberLogStrain");
    requireNonnegative(input.nextFreeCalciumUM, "nextFreeCalciumUM");
    requirePositive(input.dtSec, "dtSec");
    validatePassive(input.equilibriumPassive);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
    return invalidEvaluation(previous, input, params, issues);
  }

  const previousEngineeringStrain = landEngineeringStrain(
    previous.previousFiberLogStrain,
    params,
  );
  const nextEngineeringStrain = landEngineeringStrain(
    input.nextFiberLogStrain,
    params,
  );
  const landStepInput = {
    freeCalciumUM: input.nextFreeCalciumUM,
    previousFiberEngineeringStrain: previousEngineeringStrain,
    stageFiberEngineeringStrain: nextEngineeringStrain,
    dtSec: input.dtSec,
    stage: { scheme: "BE", stageIndex: 0 } as const,
  };
  // This wall kernel intentionally owns one backward-Euler Land step per
  // accepted mechanics step. A substepped Land map has a different algorithmic
  // tangent and must not silently enter this one-step constitutive contract.
  const solved = solveLand2017BackwardEulerStep(
    previous.landState,
    landStepInput,
    {
      maxIterations: 20,
      residualTolerance: 1e-9,
      lineSearchMinStep: 1 / 4096,
    },
    params.landEquationParameters,
  );
  if (!solved.ok || !solved.output) {
    issues.push(`Land trial failed: ${solved.failureReason ?? "unknown"}`);
    return invalidEvaluation(previous, input, params, issues);
  }
  const sls = stepParallelOneStateSlsBackwardEulerV1(
    previous.slsState,
    {
      previousFiberLogStrain: previous.previousFiberLogStrain,
      nextFiberLogStrain: input.nextFiberLogStrain,
      dtSec: input.dtSec,
    },
    params.sls,
  );
  const landStretch = 1 + nextEngineeringStrain;
  const activeNominalStressPa = solved.output.sourceActiveFiberStressPa;
  const activeKirchhoffStressPa =
    landStretch *
    params.orientationFraction01 *
    params.viableActiveFraction01 *
    activeNominalStressPa;
  const activeNominalAlgorithmicTangentPa =
    computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep(
      solved.nextState,
      landStepInput,
      params.landEquationParameters,
    );
  const activeAlgorithmicTangentPa =
    params.orientationFraction01
    * params.viableActiveFraction01
    * (
      landStretch * activeNominalStressPa
      + landStretch * landStretch * activeNominalAlgorithmicTangentPa
    );
  const totalKirchhoffStressPa =
    input.equilibriumPassive.stressPa +
    activeKirchhoffStressPa +
    sls.nextOverstressPa;
  const passiveAndSlsTangentPa =
    input.equilibriumPassive.tangentPa +
    sls.dNextOverstressDNextFiberLogStrainPa;
  const totalAlgorithmicTangentPa =
    passiveAndSlsTangentPa + activeAlgorithmicTangentPa;
  const state = Object.freeze({
    // The direct Land solver returns a freshly allocated state and never
    // retains or mutates it after return.  This material evaluation owns that
    // result exclusively, so copying the six values again only adds five
    // typed-array allocations for every rejected whole-heart candidate.
    landState: solved.nextState,
    slsState: sls.state,
    previousFiberLogStrain: input.nextFiberLogStrain,
    previousFreeCalciumUM: input.nextFreeCalciumUM,
  });
  const finite = [
    landStretch,
    nextEngineeringStrain,
    activeNominalStressPa,
    activeKirchhoffStressPa,
    totalKirchhoffStressPa,
    activeAlgorithmicTangentPa,
    totalAlgorithmicTangentPa,
    passiveAndSlsTangentPa,
    solved.residualNorm,
  ].every(Number.isFinite) && solved.output.health.finite && sls.finite;
  if (!finite) issues.push("wall material evaluation produced a non-finite value");
  if (!sls.passive) issues.push("parallel SLS failed its discrete passivity identity");
  return Object.freeze({
    modelId: LAND_SLS_WALL_MATERIAL_V1_ID,
    parameterSetId: params.parameterSetId,
    state,
    fiberLogStrain: input.nextFiberLogStrain,
    landStretch,
    landEngineeringStrain: nextEngineeringStrain,
    land: solved.output,
    activeNominalStressPa,
    activeKirchhoffStressPa,
    equilibriumPassive: Object.freeze({ ...input.equilibriumPassive }),
    sls,
    totalKirchhoffStressPa,
    activeAlgorithmicTangentPa,
    totalAlgorithmicTangentPa,
    passiveAndSlsTangentPa,
    landSolverIterations: solved.iterations,
    landSolverResidualNorm: solved.residualNorm,
    finite,
    valid: finite && issues.length === 0,
    issues: Object.freeze(issues),
    claim: LAND_SLS_WALL_MATERIAL_CLAIM_V1,
  });
}

/**
 * Allocation-lean counterpart of `trialLandSlsWallMaterialV1` for a numerical
 * candidate that may be rejected by an enclosing Newton solve.  The equations,
 * operation order and admission conditions intentionally mirror the public
 * evaluation.  A parity test fixes that relationship.
 */
export function trialLandSlsWallMaterialNumericalV1(
  previous: LandSlsWallMaterialStateV1,
  input: {
    readonly nextFiberLogStrain: number;
    readonly nextFreeCalciumUM: number;
    readonly dtSec: number;
    readonly equilibriumPassive: LandSlsWallEquilibriumPassiveInputV1;
  },
  params: LandSlsWallMaterialParamsV1,
): LandSlsWallNumericalTrialV1 {
  validateParamsOncePerObject(params);
  if (fullHotPathInvariantsEnabledV1()) validateState(previous);
  requireFinite(input.nextFiberLogStrain, "nextFiberLogStrain");
  requireNonnegative(input.nextFreeCalciumUM, "nextFreeCalciumUM");
  requirePositive(input.dtSec, "dtSec");
  validatePassive(input.equilibriumPassive);

  const previousEngineeringStrain = landEngineeringStrain(
    previous.previousFiberLogStrain,
    params,
  );
  const nextEngineeringStrain = landEngineeringStrain(
    input.nextFiberLogStrain,
    params,
  );
  const landStepInput = {
    freeCalciumUM: input.nextFreeCalciumUM,
    previousFiberEngineeringStrain: previousEngineeringStrain,
    stageFiberEngineeringStrain: nextEngineeringStrain,
    dtSec: input.dtSec,
    stage: { scheme: "BE", stageIndex: 0 } as const,
  };
  const solved = solveLand2017BackwardEulerStep(
    previous.landState,
    landStepInput,
    {
      maxIterations: 20,
      residualTolerance: 1e-9,
      lineSearchMinStep: 1 / 4096,
    },
    params.landEquationParameters,
  );
  if (!solved.ok || !solved.output) {
    throw new Error(`Land trial failed: ${solved.failureReason ?? "unknown"}`);
  }

  // Closed-form one-state SLS step. Keep the expression order identical to
  // stepParallelOneStateSlsBackwardEulerV1; the full energy ledger is used to
  // enforce the same discrete passivity admission without materializing it.
  const ratio = input.dtSec / params.sls.relaxationTimeSec;
  const nextViscousLogStrain = (
    previous.slsState.viscousLogStrain
    + ratio * input.nextFiberLogStrain
  ) / (1 + ratio);
  const previousElasticStrain = previous.previousFiberLogStrain
    - previous.slsState.viscousLogStrain;
  const nextElasticStrain = input.nextFiberLogStrain
    - nextViscousLogStrain;
  const nextOverstressPa = numericalCanonicalZeroV1(
    params.sls.branchModulusPa * nextElasticStrain,
  );
  const stateResidual = nextViscousLogStrain
    - previous.slsState.viscousLogStrain
    - ratio * nextElasticStrain;
  const previousStoredEnergyDensityJPerM3 = numericalCanonicalZeroV1(
    0.5 * params.sls.branchModulusPa * previousElasticStrain ** 2,
  );
  const nextStoredEnergyDensityJPerM3 = numericalCanonicalZeroV1(
    0.5 * params.sls.branchModulusPa * nextElasticStrain ** 2,
  );
  const stressWorkIncrementDensityJPerM3 = numericalCanonicalZeroV1(
    nextOverstressPa * (
      input.nextFiberLogStrain - previous.previousFiberLogStrain
    ),
  );
  const physicalDissipationIncrementDensityJPerM3 = numericalCanonicalZeroV1(
    params.sls.branchModulusPa * ratio * nextElasticStrain ** 2,
  );
  const backwardEulerNumericalDissipationIncrementDensityJPerM3 =
    numericalCanonicalZeroV1(
      0.5 * params.sls.branchModulusPa
      * (nextElasticStrain - previousElasticStrain) ** 2,
    );
  const discreteEnergyBalanceResidualJPerM3 = numericalCanonicalZeroV1(
    stressWorkIncrementDensityJPerM3
    - (nextStoredEnergyDensityJPerM3
      - previousStoredEnergyDensityJPerM3)
    - physicalDissipationIncrementDensityJPerM3
    - backwardEulerNumericalDissipationIncrementDensityJPerM3,
  );
  const slsFinite = [
    nextViscousLogStrain,
    nextOverstressPa,
    stateResidual,
    previousStoredEnergyDensityJPerM3,
    nextStoredEnergyDensityJPerM3,
    stressWorkIncrementDensityJPerM3,
    physicalDissipationIncrementDensityJPerM3,
    backwardEulerNumericalDissipationIncrementDensityJPerM3,
    discreteEnergyBalanceResidualJPerM3,
  ].every(Number.isFinite);
  const energyTolerance = 1e-10 * Math.max(
    1,
    Math.abs(stressWorkIncrementDensityJPerM3),
    previousStoredEnergyDensityJPerM3,
    nextStoredEnergyDensityJPerM3,
  );
  if (
    !slsFinite
    || physicalDissipationIncrementDensityJPerM3 < -energyTolerance
    || backwardEulerNumericalDissipationIncrementDensityJPerM3
      < -energyTolerance
    || Math.abs(discreteEnergyBalanceResidualJPerM3) > energyTolerance
  ) {
    throw new Error("parallel SLS failed its discrete passivity identity");
  }

  const landStretch = 1 + nextEngineeringStrain;
  const activeNominalStressPa = solved.output.sourceActiveFiberStressPa;
  const activeKirchhoffStressPa = landStretch
    * params.orientationFraction01
    * params.viableActiveFraction01
    * activeNominalStressPa;
  const activeNominalAlgorithmicTangentPa =
    computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep(
      solved.nextState,
      landStepInput,
      params.landEquationParameters,
    );
  const activeAlgorithmicTangentPa = params.orientationFraction01
    * params.viableActiveFraction01
    * (
      landStretch * activeNominalStressPa
      + landStretch * landStretch * activeNominalAlgorithmicTangentPa
    );
  const totalKirchhoffStressPa = input.equilibriumPassive.stressPa
    + activeKirchhoffStressPa
    + nextOverstressPa;
  const totalAlgorithmicTangentPa = input.equilibriumPassive.tangentPa
    + params.sls.branchModulusPa / (1 + ratio)
    + activeAlgorithmicTangentPa;
  const residualNorm = Math.max(
    Math.abs(solved.residualNorm),
    Math.abs(stateResidual),
  );
  if (![
    landStretch,
    activeNominalStressPa,
    activeKirchhoffStressPa,
    totalKirchhoffStressPa,
    activeAlgorithmicTangentPa,
    totalAlgorithmicTangentPa,
    residualNorm,
  ].every(Number.isFinite)) {
    throw new Error("wall material evaluation produced a non-finite value");
  }
  return Object.freeze({
    state: Object.freeze({
      // The direct solver created this array exclusively for this result.
      landState: solved.nextState,
      slsState: Object.freeze({ viscousLogStrain: nextViscousLogStrain }),
      previousFiberLogStrain: input.nextFiberLogStrain,
      previousFreeCalciumUM: input.nextFreeCalciumUM,
    }),
    fiberLogStrain: input.nextFiberLogStrain,
    totalKirchhoffStressPa,
    activeKirchhoffStressPa,
    totalAlgorithmicTangentPa,
    activeAlgorithmicTangentPa,
    landSolverIterations: solved.iterations,
    residualNorm,
  });
}

function numericalCanonicalZeroV1(value: number): number {
  return value === 0 ? 0 : value;
}

export function evaluateAcceptedLandSlsWallStateV1(
  state: LandSlsWallMaterialStateV1,
  equilibriumPassive: LandSlsWallEquilibriumPassiveInputV1,
  params: LandSlsWallMaterialParamsV1,
): Omit<
  LandSlsWallMaterialEvaluationV1,
  | "sls"
  | "landSolverIterations"
  | "landSolverResidualNorm"
  | "activeAlgorithmicTangentPa"
  | "totalAlgorithmicTangentPa"
> & {
  readonly slsOverstressPa: number;
} {
  validateParamsOncePerObject(params);
  // Defensive precondition on this kernel's own accepted state; see the note in
  // trialLandSlsWallMaterialV1 and engine/hotPathIntegrityTierV1.ts.
  if (fullHotPathInvariantsEnabledV1()) validateState(state);
  validatePassive(equilibriumPassive);
  const landStretch = Math.exp(state.previousFiberLogStrain) * params.landSlackStretch;
  const landEngineering = landStretch - 1;
  const land = evaluateLand2017ContinuousOutput(state.landState, {
    freeCalciumUM: state.previousFreeCalciumUM,
    fiberEngineeringStrain: landEngineering,
    fiberEngineeringStrainRatePerSec: 0,
  }, params.landEquationParameters);
  const activeNominalStressPa = land.sourceActiveFiberStressPa;
  const activeKirchhoffStressPa = landStretch * params.orientationFraction01 *
    params.viableActiveFraction01 * activeNominalStressPa;
  const slsOverstressPa = params.sls.branchModulusPa *
    (state.previousFiberLogStrain - state.slsState.viscousLogStrain);
  const totalKirchhoffStressPa = equilibriumPassive.stressPa +
    activeKirchhoffStressPa + slsOverstressPa;
  const finite = [landStretch, activeNominalStressPa, activeKirchhoffStressPa,
    slsOverstressPa, totalKirchhoffStressPa].every(Number.isFinite) && land.health.finite;
  return Object.freeze({
    modelId: LAND_SLS_WALL_MATERIAL_V1_ID,
    parameterSetId: params.parameterSetId,
    state: cloneLandSlsWallMaterialStateV1(state),
    fiberLogStrain: state.previousFiberLogStrain,
    landStretch,
    landEngineeringStrain: landEngineering,
    land,
    activeNominalStressPa,
    activeKirchhoffStressPa,
    equilibriumPassive: Object.freeze({ ...equilibriumPassive }),
    slsOverstressPa,
    totalKirchhoffStressPa,
    passiveAndSlsTangentPa: equilibriumPassive.tangentPa + params.sls.branchModulusPa,
    finite,
    valid: finite,
    issues: Object.freeze(finite ? [] : ["accepted wall state is non-finite"]),
    claim: LAND_SLS_WALL_MATERIAL_CLAIM_V1,
  });
}

/**
 * Value-preserving copy of a wall state; also the provider's state-codec clone,
 * so it runs for every wall of every snapshot the mechanics contract takes.
 *
 * The precondition check on the incoming state is defensive — the copy itself
 * is unconditional and exact — so it belongs to the full-invariant tier; see
 * engine/hotPathIntegrityTierV1.ts.
 */
export function cloneLandSlsWallMaterialStateV1(
  state: LandSlsWallMaterialStateV1,
): LandSlsWallMaterialStateV1 {
  if (fullHotPathInvariantsEnabledV1()) validateState(state);
  return Object.freeze({
    landState: Float64Array.from(state.landState),
    slsState: Object.freeze({ ...state.slsState }),
    previousFiberLogStrain: state.previousFiberLogStrain,
    previousFreeCalciumUM: state.previousFreeCalciumUM,
  });
}

function landEngineeringStrain(
  fiberLogStrain: number,
  params: LandSlsWallMaterialParamsV1,
): number {
  const stretch = params.landSlackStretch * Math.exp(fiberLogStrain);
  if (!(stretch > 0) || !Number.isFinite(stretch)) {
    throw new Error("Land stretch must be positive and finite");
  }
  return stretch - 1;
}

function validateParams(params: LandSlsWallMaterialParamsV1): void {
  if (!params.parameterSetId.trim()) throw new Error("parameterSetId must be non-empty");
  if (!params.landEquationParameters?.parameterSetStableHash) {
    throw new Error("landEquationParameters must have a stable parameter identity");
  }
  requirePositive(params.landSlackStretch, "landSlackStretch");
  requireUnitIntervalPositive(params.orientationFraction01, "orientationFraction01");
  requireUnitIntervalInclusive(params.viableActiveFraction01, "viableActiveFraction01");
}

/**
 * Parameter sets are immutable and shared: one frozen object per wall for the
 * life of a parameter setting, revalidated on every wall of every candidate.
 * Validating once per object keeps the check without re-running it about
 * seventeen times per 2 ms step. Membership is by object identity, so a new
 * parameter set is validated again.
 */
const VALIDATED_LAND_SLS_PARAMS_V1 = new WeakSet<object>();

function validateParamsOncePerObject(params: LandSlsWallMaterialParamsV1): void {
  if (VALIDATED_LAND_SLS_PARAMS_V1.has(params)) return;
  validateParams(params);
  VALIDATED_LAND_SLS_PARAMS_V1.add(params);
}

function validateState(state: LandSlsWallMaterialStateV1): void {
  if (!(state.landState instanceof Float64Array) || state.landState.length !== 6) {
    throw new Error("landState must be a six-state Float64Array");
  }
  if (!Array.from(state.landState).every(Number.isFinite)) {
    throw new Error("landState must be finite");
  }
  requireFinite(state.slsState.viscousLogStrain, "slsState.viscousLogStrain");
  requireFinite(state.previousFiberLogStrain, "previousFiberLogStrain");
  requireNonnegative(state.previousFreeCalciumUM, "previousFreeCalciumUM");
}

function validatePassive(value: LandSlsWallEquilibriumPassiveInputV1): void {
  requireFinite(value.stressPa, "equilibriumPassive.stressPa");
  requirePositive(value.tangentPa, "equilibriumPassive.tangentPa");
  requireNonnegative(
    value.storedEnergyDensityJPerM3,
    "equilibriumPassive.storedEnergyDensityJPerM3",
  );
}

function invalidEvaluation(
  previous: LandSlsWallMaterialStateV1,
  input: {
    readonly nextFiberLogStrain: number;
    readonly nextFreeCalciumUM: number;
    readonly dtSec: number;
    readonly equilibriumPassive: LandSlsWallEquilibriumPassiveInputV1;
  },
  params: LandSlsWallMaterialParamsV1,
  issues: readonly string[],
): LandSlsWallMaterialEvaluationV1 {
  const nanPassive = Object.freeze({ stressPa: Number.NaN, tangentPa: Number.NaN,
    storedEnergyDensityJPerM3: Number.NaN });
  const nanSls = Object.freeze({
    modelId: "parallel-one-state-sls-log-strain-v1" as const,
    parameterSetId: params.sls?.parameterSetId ?? "invalid",
    state: Object.freeze({ viscousLogStrain: Number.NaN }),
    previousOverstressPa: Number.NaN,
    nextOverstressPa: Number.NaN,
    dNextOverstressDNextFiberLogStrainPa: Number.NaN,
    stateResidual: Number.NaN,
    previousStoredEnergyDensityJPerM3: Number.NaN,
    nextStoredEnergyDensityJPerM3: Number.NaN,
    stressWorkIncrementDensityJPerM3: Number.NaN,
    physicalDissipationIncrementDensityJPerM3: Number.NaN,
    backwardEulerNumericalDissipationIncrementDensityJPerM3: Number.NaN,
    discreteEnergyBalanceResidualJPerM3: Number.NaN,
    finite: false,
    passive: false,
    claim: PARALLEL_ONE_STATE_SLS_CLAIM_V1,
  }) as ParallelOneStateSlsEvaluationV1;
  return Object.freeze({
    modelId: LAND_SLS_WALL_MATERIAL_V1_ID,
    parameterSetId: params.parameterSetId ?? "invalid",
    state: previous,
    fiberLogStrain: input.nextFiberLogStrain,
    landStretch: Number.NaN,
    landEngineeringStrain: Number.NaN,
    land: {
      sourceActiveFiberStressPa: Number.NaN,
      sourceStressConvention: "land2017-Ta" as const,
      stabilizationStiffnessPa: Number.NaN,
      sourceActivePowerDensityWPerM3: Number.NaN,
      health: { finite: false, stateConservationResidual: Number.NaN,
        minimumPopulation: Number.NaN, projectionUsed: false },
    },
    activeNominalStressPa: Number.NaN,
    activeKirchhoffStressPa: Number.NaN,
    equilibriumPassive: input.equilibriumPassive ?? nanPassive,
    sls: nanSls,
    totalKirchhoffStressPa: Number.NaN,
    activeAlgorithmicTangentPa: Number.NaN,
    totalAlgorithmicTangentPa: Number.NaN,
    passiveAndSlsTangentPa: Number.NaN,
    landSolverIterations: 0,
    landSolverResidualNorm: Number.POSITIVE_INFINITY,
    finite: false,
    valid: false,
    issues: Object.freeze([...issues]),
    claim: LAND_SLS_WALL_MATERIAL_CLAIM_V1,
  });
}

function maxDifference(left: ArrayLike<number>, right: ArrayLike<number>): number {
  let maximum = 0;
  for (let index = 0; index < left.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(left[index]! - right[index]!));
  }
  return maximum;
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
  if (!(value >= 0) || !Number.isFinite(value)) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
}

function requireUnitIntervalPositive(value: number, label: string): void {
  if (!(value > 0 && value <= 1) || !Number.isFinite(value)) {
    throw new Error(`${label} must lie in (0, 1]`);
  }
}

function requireUnitIntervalInclusive(value: number, label: string): void {
  if (!(value >= 0 && value <= 1) || !Number.isFinite(value)) {
    throw new Error(`${label} must lie in [0, 1]`);
  }
}
