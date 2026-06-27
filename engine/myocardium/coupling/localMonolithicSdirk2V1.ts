import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
  stepPrescribedCalciumTransientV1,
  type PrescribedCalciumInput,
} from "@/engine/myocardium/calcium";
import { IDENTITY_FIBER_NOMINAL_V1_PARAMS, IdentityFiberNominalV1 } from "@/engine/myocardium/homogenization";
import {
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
  evaluateThickSphereV2SelectedBackend,
  type ThickSphereV2SelectedParameterSet,
  type ThickSphereV2SelectedVentricle,
} from "@/engine/myocardium/kinematics";
import type { MyocardialKinematicsOutput } from "@/engine/myocardium/kinematics";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
  evaluatePassiveExponentialEnergyV1,
  evaluateVirtualPowerGeneralizedForceV1,
} from "@/engine/myocardium/mechanics";
import type { GeneralizedForceOutput, PassiveMaterialOutput } from "@/engine/myocardium/mechanics";
import {
  LAND2017_SDIRK2_GAMMA,
  LAND2017_SDIRK2_TABLEAU,
  deriveLand2017Sdirk2StageKinematics,
  evaluateLand2017Sdirk2StageOutput,
  writeLand2017Sdirk2StageResidual,
  type Land2017Sdirk2StageInput,
} from "@/engine/myocardium/myofilament/land2017";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import {
  LAND2017_STATE_SIZE,
  type LandSourceOutput,
} from "@/engine/myocardium/myofilament/land2017/types";

export const LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID =
  "local-monolithic-sdirk2-v1";
export const LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY =
  "phase5b-local-monolithic-sdirk2-reference-only";
export const LOCAL_MONOLITHIC_SDIRK2_V1_LAND_SOLVER_METHOD =
  "writeLand2017Sdirk2StageResidual";
export const LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION =
  1 + LAND2017_STATE_SIZE;

export type LocalMonolithicSdirk2V1StageIndex = 0 | 1;

export type LocalMonolithicSdirk2V1SampleId =
  | "phase5b-lv-local-sdirk2-reference"
  | "phase5b-rv-local-sdirk2-reference";

export type LocalMonolithicSdirk2V1SampleDefinition = {
  readonly id: LocalMonolithicSdirk2V1SampleId;
  readonly ventricle: ThickSphereV2SelectedVentricle;
  readonly parameterSet: ThickSphereV2SelectedParameterSet;
  readonly previousCavityVolumeM3: number;
  readonly targetRootCavityVolumeM3: number;
  readonly initialGuessCavityVolumeM3: number;
  readonly dtSec: number;
  readonly calciumInput: PrescribedCalciumInput;
  readonly previousCalciumState: readonly [number, number];
  readonly previousLandState: readonly [number, number, number, number, number, number];
  readonly elasticLoadStiffnessPaPerM3: number;
  readonly maxNewtonIterations: number;
  readonly residualTolerancePa: number;
  readonly derivativeRelativeStep: number;
  readonly lineSearchMinStep: number;
  readonly lineSearchReduction: number;
  readonly landResidualTolerance: number;
};

export type LocalMonolithicSdirk2V1LandSolveEvidence = {
  readonly method: typeof LOCAL_MONOLITHIC_SDIRK2_V1_LAND_SOLVER_METHOD;
  readonly residualSource: "Land 2017 SDIRK2 stage residual";
  readonly stageScheme: "SDIRK2";
  readonly stageIndex: LocalMonolithicSdirk2V1StageIndex;
  readonly gamma: typeof LAND2017_SDIRK2_GAMMA;
  readonly ok: boolean;
  readonly residualNorm: number;
  readonly residualTolerance: number;
  readonly residualVector: readonly number[];
  readonly previousState: readonly number[];
  readonly stageState: readonly number[];
  readonly stage0State?: readonly number[];
  readonly stateUpdateLinf: number;
  readonly outputFinite: boolean;
  readonly stateFinite: boolean;
  readonly sourceActiveFiberStressPa: number;
  readonly stabilizationStiffnessPa: number;
  readonly minimumPopulation: number;
  readonly stateConservationResidual: number;
};

export type LocalMonolithicSdirk2V1CalciumEvidence = {
  readonly modelParameterSetId: typeof PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID;
  readonly targetId: string;
  readonly stageIndex: LocalMonolithicSdirk2V1StageIndex;
  readonly cValue: number;
  readonly activationEventId: number;
  readonly absoluteTimeSinceActivationSec: number;
  readonly cycleLengthSec: number;
  readonly stageIncrementDtSec: number;
  readonly dtSecSemantics: "sequential-stage-increment";
  readonly freeCalciumUM: number;
  readonly previousState: readonly number[];
  readonly nextState: readonly number[];
  readonly finite: boolean;
};

export type LocalMonolithicSdirk2V1RateEvidence = {
  readonly previousFiberEngineeringStrain: number;
  readonly stageFiberEngineeringStrain: number;
  readonly landStageStrainRatePerSec: number;
  readonly formulaStrainRatePerSec: number;
  readonly stage0StrainRatePerSec?: number;
  readonly strainRateResidualAbsPerSec: number;
  readonly previousCoordinateSI: number;
  readonly stageCoordinateSI: number;
  readonly stageCoordinateRateSI: number;
  readonly formulaCoordinateRateSI: number;
  readonly stage0CoordinateRateSI?: number;
  readonly coordinateRateResidualAbsSI: number;
  readonly kinematicsStrainRatePerSec: number;
  readonly tolerance: number;
  readonly pass: boolean;
};

export type LocalMonolithicSdirk2V1StackEvaluation = {
  readonly stageIndex: LocalMonolithicSdirk2V1StageIndex;
  readonly cavityVolumeM3: number;
  readonly previousCavityVolumeM3: number;
  readonly coordinateRateM3PerSec: number;
  readonly fiberEngineeringStrain: number;
  readonly fiberEngineeringStrainRatePerSec: number;
  readonly dStrainDVolume: number;
  readonly pressureMapPa: number;
  readonly sourceActiveFiberStressPa: number;
  readonly wallActiveNominalStressPa: number;
  readonly passiveNominalStressPa: number;
  readonly viscousNominalStressPa: number;
  readonly conjugateForceSI: number;
  readonly virtualPowerResidualW: number;
  readonly localForceBalanceResidualPa: number;
  readonly elasticLoadPa: number;
  readonly targetExternalPressurePa: number;
  readonly land: LocalMonolithicSdirk2V1LandSolveEvidence;
  readonly rateDerivation: LocalMonolithicSdirk2V1RateEvidence;
  readonly finite: boolean;
};

export type LocalMonolithicSdirk2V1NewtonEvidence = {
  readonly ok: boolean;
  readonly unknownVectorDimension: typeof LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION;
  readonly coupledUnknowns: readonly [
    "cavityVolumeM3",
    "CaTRPN",
    "B",
    "W",
    "S",
    "zetaW",
    "zetaS",
  ];
  readonly stageIndex: LocalMonolithicSdirk2V1StageIndex;
  readonly iterationCount: number;
  readonly maxIterations: number;
  readonly initialResidualAbsPa: number;
  readonly finalResidualAbsPa: number;
  readonly initialResidualNorm: number;
  readonly finalResidualNorm: number;
  readonly finalLandResidualNorm: number;
  readonly finalLandStateUpdateLinf: number;
  readonly residualTolerancePa: number;
  readonly lineSearchTrialCount: number;
  readonly lineSearchBacktrackCount: number;
  readonly derivativeEvaluationCount: number;
  readonly residualEvaluationCount: number;
  readonly finalJacobianDeterminant: number;
  readonly finalVolumeDerivativePaPerM3: number;
  readonly residualHistoryPa: readonly number[];
  readonly residualNormHistory: readonly number[];
};

export type LocalMonolithicSdirk2V1FiniteHealth = {
  readonly kinematicsFinite: boolean;
  readonly landFinite: boolean;
  readonly passiveFinite: boolean;
  readonly generalizedForceFinite: boolean;
  readonly pressureMapFinite: boolean;
  readonly localResidualFinite: boolean;
  readonly stateFinite: boolean;
  readonly pass: boolean;
};

export type LocalMonolithicSdirk2V1StageResult = {
  readonly modelId: typeof LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID;
  readonly claimBoundary: typeof LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY;
  readonly sampleId: LocalMonolithicSdirk2V1SampleId;
  readonly stageIndex: LocalMonolithicSdirk2V1StageIndex;
  readonly cValue: number;
  readonly targetStageCavityVolumeM3: number;
  readonly solvedCavityVolumeM3: number;
  readonly targetExternalPressurePa: number;
  readonly calcium: LocalMonolithicSdirk2V1CalciumEvidence;
  readonly final: LocalMonolithicSdirk2V1StackEvaluation;
  readonly target: Omit<LocalMonolithicSdirk2V1StackEvaluation, "localForceBalanceResidualPa" | "targetExternalPressurePa">;
  readonly newton: LocalMonolithicSdirk2V1NewtonEvidence;
  readonly finiteHealth: LocalMonolithicSdirk2V1FiniteHealth;
  readonly pass: boolean;
  readonly deterministicHash: string;
};

export type LocalMonolithicSdirk2V1SampleResult = {
  readonly modelId: typeof LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID;
  readonly claimBoundary: typeof LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY;
  readonly id: LocalMonolithicSdirk2V1SampleId;
  readonly ventricle: ThickSphereV2SelectedVentricle;
  readonly coordinateId: string;
  readonly parameterSetId: string;
  readonly stages: readonly [
    LocalMonolithicSdirk2V1StageResult,
    LocalMonolithicSdirk2V1StageResult,
  ];
  readonly finalStageIndex: 1;
  readonly finalStateSource: "Y1";
  readonly solvedCavityVolumeM3: number;
  readonly finalLandState: readonly number[];
  readonly allStageLandSolvesOk: boolean;
  readonly maxLandResidualNorm: number;
  readonly maxLocalForceBalanceResidualAbsPa: number;
  readonly finiteHealthPass: boolean;
  readonly pass: boolean;
  readonly deterministicHash: string;
};

export type LocalMonolithicSdirk2V1ReferenceSuite = {
  readonly modelId: typeof LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID;
  readonly claimBoundary: typeof LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY;
  readonly tableau: typeof LAND2017_SDIRK2_TABLEAU;
  readonly stageSolvePolicy: "sequential-7-unknown-stage-solves";
  readonly finalStateSource: "Y1";
  readonly samples: readonly LocalMonolithicSdirk2V1SampleResult[];
  readonly sampleCount: number;
  readonly lvCovered: boolean;
  readonly rvCovered: boolean;
  readonly allSamplesPass: boolean;
  readonly maxLocalForceBalanceResidualAbsPa: number;
  readonly maxLandResidualNorm: number;
  readonly stableSummaryHash: string;
};

type StageContext = {
  readonly definition: LocalMonolithicSdirk2V1SampleDefinition;
  readonly stageIndex: LocalMonolithicSdirk2V1StageIndex;
  readonly cValue: number;
  readonly calcium: LocalMonolithicSdirk2V1CalciumEvidence;
  readonly previousFiberEngineeringStrain: number;
  readonly previousLandState: readonly number[];
  readonly targetStageCavityVolumeM3: number;
  readonly initialGuessCavityVolumeM3: number;
  readonly initialGuessLandState: readonly number[];
  readonly stage0?: {
    readonly state: readonly number[];
    readonly fiberEngineeringStrain: number;
    readonly cavityVolumeM3: number;
    readonly freeCalciumUM: number;
    readonly coordinateRateM3PerSec: number;
  };
};

type ResidualEvaluation = {
  readonly stack: LocalMonolithicSdirk2V1StackEvaluation;
  readonly residualPa: number;
  readonly landResidualNorm: number;
  readonly residualNorm: number;
  readonly residualVector: Float64Array;
  readonly unknownVector: Float64Array;
};

type DerivativeEvaluation = ResidualEvaluation & {
  readonly jacobian: Float64Array;
  readonly jacobianDeterminant: number;
  readonly volumeDerivativePaPerM3: number;
};

const RATE_DERIVATION_TOLERANCE = 1e-12;

const DEFAULT_SAMPLE_DEFINITIONS: readonly LocalMonolithicSdirk2V1SampleDefinition[] = Object.freeze([
  {
    id: "phase5b-lv-local-sdirk2-reference",
    ventricle: "LV",
    parameterSet: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
    previousCavityVolumeM3: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3 * 0.985,
    targetRootCavityVolumeM3: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3 * 1.035,
    initialGuessCavityVolumeM3: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3 * 0.995,
    dtSec: 0.001,
    calciumInput: {
      targetId: "phase5b-lv-prescribed-ca",
      activationEventId: 1,
      timeSinceActivationSec: 0.056,
      cycleLengthSec: 0.8,
      activationStrength01: 1,
      dtSec: 0.001,
    },
    previousCalciumState: [0.18, 0.07],
    previousLandState: [0.55, 0.12, 0.08, 0.04, 0.06, 0.12],
    elasticLoadStiffnessPaPerM3: 2.4e8,
    maxNewtonIterations: 10,
    residualTolerancePa: 1e-7,
    derivativeRelativeStep: 1e-5,
    lineSearchMinStep: 1 / 1024,
    lineSearchReduction: 0.5,
    landResidualTolerance: 1e-9,
  },
  {
    id: "phase5b-rv-local-sdirk2-reference",
    ventricle: "RV",
    parameterSet: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
    previousCavityVolumeM3: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.anchorCavityVolumeM3 * 1.02,
    targetRootCavityVolumeM3: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.anchorCavityVolumeM3 * 0.965,
    initialGuessCavityVolumeM3: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.anchorCavityVolumeM3 * 1.005,
    dtSec: 0.001,
    calciumInput: {
      targetId: "phase5b-rv-prescribed-ca",
      activationEventId: 1,
      timeSinceActivationSec: 0.064,
      cycleLengthSec: 0.8,
      activationStrength01: 1,
      dtSec: 0.001,
    },
    previousCalciumState: [0.16, 0.08],
    previousLandState: [0.52, 0.14, 0.07, 0.035, 0.055, 0.11],
    elasticLoadStiffnessPaPerM3: 1.8e8,
    maxNewtonIterations: 10,
    residualTolerancePa: 1e-7,
    derivativeRelativeStep: 1e-5,
    lineSearchMinStep: 1 / 1024,
    lineSearchReduction: 0.5,
    landResidualTolerance: 1e-9,
  },
] as const);

export function localMonolithicSdirk2V1DefaultSampleDefinitions():
  readonly LocalMonolithicSdirk2V1SampleDefinition[] {
  return DEFAULT_SAMPLE_DEFINITIONS;
}

export function runLocalMonolithicSdirk2V1ReferenceSuite(
  definitions: readonly LocalMonolithicSdirk2V1SampleDefinition[] =
    DEFAULT_SAMPLE_DEFINITIONS,
): LocalMonolithicSdirk2V1ReferenceSuite {
  const samples = definitions.map(runLocalMonolithicSdirk2V1Sample);
  const maxLocalForceBalanceResidualAbsPa = Math.max(
    ...samples.map((sample) => sample.maxLocalForceBalanceResidualAbsPa),
  );
  const maxLandResidualNorm = Math.max(...samples.map((sample) => sample.maxLandResidualNorm));
  const allSamplesPass = samples.every((sample) => sample.pass);
  const suiteWithoutHash = {
    modelId: LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
    claimBoundary: LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY,
    tableau: LAND2017_SDIRK2_TABLEAU,
    stageSolvePolicy: "sequential-7-unknown-stage-solves",
    finalStateSource: "Y1",
    samples,
    sampleCount: samples.length,
    lvCovered: samples.some((sample) => sample.ventricle === "LV"),
    rvCovered: samples.some((sample) => sample.ventricle === "RV"),
    allSamplesPass,
    maxLocalForceBalanceResidualAbsPa,
    maxLandResidualNorm,
  } satisfies Omit<LocalMonolithicSdirk2V1ReferenceSuite, "stableSummaryHash">;

  return {
    ...suiteWithoutHash,
    stableSummaryHash: stableHash(sanitizeForStableHash(suiteWithoutHash)),
  };
}

export function runLocalMonolithicSdirk2V1Sample(
  definition: LocalMonolithicSdirk2V1SampleDefinition,
): LocalMonolithicSdirk2V1SampleResult {
  assertDefinition(definition);
  const previousKinematics = evaluateKinematics(
    definition,
    definition.previousCavityVolumeM3,
    definition.previousCavityVolumeM3,
    0,
  );
  const stage0Target =
    definition.previousCavityVolumeM3
    + LAND2017_SDIRK2_GAMMA
      * (definition.targetRootCavityVolumeM3 - definition.previousCavityVolumeM3);
  const stage0Calcium = prescribedCalciumStageEvidence(
    definition,
    0,
    definition.previousCalciumState,
  );
  const stage0 = solveStage({
    definition,
    stageIndex: 0,
    cValue: LAND2017_SDIRK2_TABLEAU.c0,
    calcium: stage0Calcium,
    previousFiberEngineeringStrain: previousKinematics.fiberEngineeringStrain,
    previousLandState: definition.previousLandState,
    targetStageCavityVolumeM3: stage0Target,
    initialGuessCavityVolumeM3: stage0Target,
    initialGuessLandState: definition.previousLandState,
  });
  const stage1Calcium = prescribedCalciumStageEvidence(
    definition,
    1,
    stage0.calcium.nextState,
  );
  const stage1 = solveStage({
    definition,
    stageIndex: 1,
    cValue: LAND2017_SDIRK2_TABLEAU.c1,
    calcium: stage1Calcium,
    previousFiberEngineeringStrain: previousKinematics.fiberEngineeringStrain,
    previousLandState: definition.previousLandState,
    targetStageCavityVolumeM3: definition.targetRootCavityVolumeM3,
    initialGuessCavityVolumeM3: definition.targetRootCavityVolumeM3,
    initialGuessLandState: stage0.final.land.stageState,
    stage0: {
      state: stage0.final.land.stageState,
      fiberEngineeringStrain: stage0.final.fiberEngineeringStrain,
      cavityVolumeM3: stage0.solvedCavityVolumeM3,
      freeCalciumUM: stage0.calcium.freeCalciumUM,
      coordinateRateM3PerSec: stage0.final.coordinateRateM3PerSec,
    },
  });
  const allStageLandSolvesOk =
    stage0.final.land.ok
    && stage1.final.land.ok;
  const maxLandResidualNorm = Math.max(
    stage0.final.land.residualNorm,
    stage1.final.land.residualNorm,
  );
  const maxLocalForceBalanceResidualAbsPa = Math.max(
    Math.abs(stage0.final.localForceBalanceResidualPa),
    Math.abs(stage1.final.localForceBalanceResidualPa),
  );
  const finiteHealthPass = stage0.finiteHealth.pass && stage1.finiteHealth.pass;
  const pass =
    stage0.pass
    && stage1.pass
    && allStageLandSolvesOk
    && maxLandResidualNorm <= definition.landResidualTolerance
    && maxLocalForceBalanceResidualAbsPa <= definition.residualTolerancePa
    && finiteHealthPass;
  const sampleWithoutHash = {
    modelId: LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
    claimBoundary: LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY,
    id: definition.id,
    ventricle: definition.ventricle,
    coordinateId: definition.parameterSet.coordinateId,
    parameterSetId: definition.parameterSet.parameterSetId,
    stages: [stage0, stage1],
    finalStageIndex: 1,
    finalStateSource: "Y1",
    solvedCavityVolumeM3: stage1.solvedCavityVolumeM3,
    finalLandState: stage1.final.land.stageState,
    allStageLandSolvesOk,
    maxLandResidualNorm,
    maxLocalForceBalanceResidualAbsPa,
    finiteHealthPass,
    pass,
  } satisfies Omit<LocalMonolithicSdirk2V1SampleResult, "deterministicHash">;

  return {
    ...sampleWithoutHash,
    deterministicHash: stableHash(sanitizeForStableHash(sampleWithoutHash)),
  };
}

function solveStage(context: StageContext): LocalMonolithicSdirk2V1StageResult {
  const targetUnknownVector = makeUnknownVector(
    context.targetStageCavityVolumeM3,
    context.initialGuessLandState,
  );
  const targetStackWithoutBalance = evaluateStageStackAtUnknown(
    context,
    targetUnknownVector,
    0,
  );
  const targetExternalPressurePa = targetStackWithoutBalance.pressureMapPa;
  const targetStack = {
    ...targetStackWithoutBalance,
    elasticLoadPa: 0,
  };
  const stackEvaluations: LocalMonolithicSdirk2V1StackEvaluation[] = [];
  const residualHistoryPa: number[] = [];
  const residualNormHistory: number[] = [];
  let derivativeEvaluationCount = 0;
  let lineSearchTrialCount = 0;
  let lineSearchBacktrackCount = 0;
  let finalJacobianDeterminant = Number.NaN;
  let finalVolumeDerivativePaPerM3 = Number.NaN;
  let unknownVector = makeUnknownVector(
    context.initialGuessCavityVolumeM3,
    context.initialGuessLandState,
  );

  const residualAt = (candidateUnknownVector: Float64Array): ResidualEvaluation => {
    const stackWithoutBalance = evaluateStageStackAtUnknown(
      context,
      candidateUnknownVector,
      targetExternalPressurePa,
    );
    const cavityVolumeM3 = candidateUnknownVector[0];
    const elasticLoadPa =
      context.definition.elasticLoadStiffnessPaPerM3
      * (cavityVolumeM3 - context.targetStageCavityVolumeM3);
    const residualPa =
      stackWithoutBalance.pressureMapPa + elasticLoadPa - targetExternalPressurePa;
    const stack = {
      ...stackWithoutBalance,
      elasticLoadPa,
      targetExternalPressurePa,
      localForceBalanceResidualPa: residualPa,
      finite:
        stackWithoutBalance.finite
        && Number.isFinite(elasticLoadPa)
        && Number.isFinite(targetExternalPressurePa)
        && Number.isFinite(residualPa),
    };
    const residualVector = normalizedMonolithicResidualVector(
      stack.land.residualVector,
      stack.land.residualNorm,
      residualPa,
      context.definition,
    );
    const residualNorm = infinityNorm(residualVector);
    stackEvaluations.push(stack);
    return {
      stack,
      residualPa,
      landResidualNorm: stack.land.residualNorm,
      residualNorm,
      residualVector,
      unknownVector: Float64Array.from(candidateUnknownVector),
    };
  };

  const residualAndJacobianAt = (candidateUnknownVector: Float64Array): DerivativeEvaluation => {
    const center = residualAt(candidateUnknownVector);
    const jacobian = finiteDifferenceJacobian(context, candidateUnknownVector, residualAt);
    derivativeEvaluationCount += 2 * LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION;
    return {
      ...center,
      jacobian: jacobian.matrix,
      jacobianDeterminant: jacobian.determinant,
      volumeDerivativePaPerM3: jacobian.volumeDerivativePaPerM3,
    };
  };

  let finalEvaluation = residualAndJacobianAt(unknownVector);
  for (let iteration = 0; iteration <= context.definition.maxNewtonIterations; iteration += 1) {
    finalEvaluation = residualAndJacobianAt(unknownVector);
    finalJacobianDeterminant = finalEvaluation.jacobianDeterminant;
    finalVolumeDerivativePaPerM3 = finalEvaluation.volumeDerivativePaPerM3;
    residualHistoryPa.push(finalEvaluation.residualPa);
    residualNormHistory.push(finalEvaluation.residualNorm);
    const residualAbsPa = Math.abs(finalEvaluation.residualPa);
    if (
      residualAbsPa <= context.definition.residualTolerancePa
      && finalEvaluation.landResidualNorm <= context.definition.landResidualTolerance
    ) {
      return stageResult(
        context,
        targetStack,
        targetExternalPressurePa,
        finalEvaluation.stack.cavityVolumeM3,
        finalEvaluation,
        {
          ok: true,
          unknownVectorDimension: LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION,
          coupledUnknowns: monolithicUnknownLabels(),
          stageIndex: context.stageIndex,
          iterationCount: iteration,
          maxIterations: context.definition.maxNewtonIterations,
          initialResidualAbsPa: Math.abs(residualHistoryPa[0]),
          finalResidualAbsPa: residualAbsPa,
          initialResidualNorm: residualNormHistory[0],
          finalResidualNorm: finalEvaluation.residualNorm,
          finalLandResidualNorm: finalEvaluation.landResidualNorm,
          finalLandStateUpdateLinf: finalEvaluation.stack.land.stateUpdateLinf,
          residualTolerancePa: context.definition.residualTolerancePa,
          lineSearchTrialCount,
          lineSearchBacktrackCount,
          derivativeEvaluationCount,
          residualEvaluationCount: stackEvaluations.length,
          finalJacobianDeterminant,
          finalVolumeDerivativePaPerM3,
          residualHistoryPa,
          residualNormHistory,
        },
        stackEvaluations,
      );
    }
    if (
      iteration === context.definition.maxNewtonIterations
      || !Number.isFinite(finalJacobianDeterminant)
      || Math.abs(finalJacobianDeterminant) < 1e-30
    ) {
      break;
    }

    let newtonStep: Float64Array;
    try {
      newtonStep = solveDenseLinearSystem(
        finalEvaluation.jacobian,
        finalEvaluation.residualVector.map((value) => -value),
        LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION,
      );
    } catch {
      break;
    }
    let accepted: ResidualEvaluation | undefined;
    let acceptedUnknownVector = unknownVector;
    let localBacktracks = 0;
    for (
      let alpha = 1;
      alpha >= context.definition.lineSearchMinStep;
      alpha *= context.definition.lineSearchReduction
    ) {
      lineSearchTrialCount += 1;
      const candidateUnknownVector = addScaled(unknownVector, newtonStep, alpha);
      if (!volumeInDomain(context.definition, candidateUnknownVector[0])) {
        lineSearchBacktrackCount += 1;
        localBacktracks += 1;
        continue;
      }
      const candidate = residualAt(candidateUnknownVector);
      if (
        candidate.stack.finite
        && candidate.residualNorm < finalEvaluation.residualNorm
      ) {
        accepted = candidate;
        acceptedUnknownVector = candidateUnknownVector;
        break;
      }
      lineSearchBacktrackCount += 1;
      localBacktracks += 1;
    }
    if (!accepted) {
      lineSearchBacktrackCount += localBacktracks === 0 ? 1 : 0;
      break;
    }
    unknownVector = acceptedUnknownVector;
  }

  return stageResult(
    context,
    targetStack,
    targetExternalPressurePa,
    finalEvaluation.stack.cavityVolumeM3,
    finalEvaluation,
    {
      ok: false,
      unknownVectorDimension: LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION,
      coupledUnknowns: monolithicUnknownLabels(),
      stageIndex: context.stageIndex,
      iterationCount: Math.max(0, residualHistoryPa.length - 1),
      maxIterations: context.definition.maxNewtonIterations,
      initialResidualAbsPa: Math.abs(residualHistoryPa[0] ?? Number.NaN),
      finalResidualAbsPa: Math.abs(finalEvaluation.residualPa),
      initialResidualNorm: residualNormHistory[0] ?? Number.NaN,
      finalResidualNorm: finalEvaluation.residualNorm,
      finalLandResidualNorm: finalEvaluation.landResidualNorm,
      finalLandStateUpdateLinf: finalEvaluation.stack.land.stateUpdateLinf,
      residualTolerancePa: context.definition.residualTolerancePa,
      lineSearchTrialCount,
      lineSearchBacktrackCount,
      derivativeEvaluationCount,
      residualEvaluationCount: stackEvaluations.length,
      finalJacobianDeterminant,
      finalVolumeDerivativePaPerM3,
      residualHistoryPa,
      residualNormHistory,
    },
    stackEvaluations,
  );
}

function stageResult(
  context: StageContext,
  target: Omit<LocalMonolithicSdirk2V1StackEvaluation, "localForceBalanceResidualPa" | "targetExternalPressurePa">,
  targetExternalPressurePa: number,
  solvedCavityVolumeM3: number,
  finalEvaluation: DerivativeEvaluation,
  newton: LocalMonolithicSdirk2V1NewtonEvidence,
  stackEvaluations: readonly LocalMonolithicSdirk2V1StackEvaluation[],
): LocalMonolithicSdirk2V1StageResult {
  const finiteHealth = finiteHealthSummary(finalEvaluation.stack);
  const pass =
    newton.ok
    && newton.iterationCount > 0
    && newton.unknownVectorDimension === LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION
    && Number.isFinite(newton.finalJacobianDeterminant)
    && Number.isFinite(newton.finalVolumeDerivativePaPerM3)
    && newton.residualEvaluationCount > 0
    && newton.derivativeEvaluationCount > 0
    && newton.lineSearchTrialCount >= newton.iterationCount
    && newton.finalLandResidualNorm <= context.definition.landResidualTolerance
    && newton.finalResidualAbsPa <= context.definition.residualTolerancePa
    && finalEvaluation.stack.land.ok
    && finalEvaluation.stack.rateDerivation.pass
    && finiteHealth.pass
    && context.calcium.finite
    && stackEvaluations.length > 0;
  const resultWithoutHash = {
    modelId: LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
    claimBoundary: LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY,
    sampleId: context.definition.id,
    stageIndex: context.stageIndex,
    cValue: context.cValue,
    targetStageCavityVolumeM3: context.targetStageCavityVolumeM3,
    solvedCavityVolumeM3,
    targetExternalPressurePa,
    calcium: context.calcium,
    final: finalEvaluation.stack,
    target,
    newton,
    finiteHealth,
    pass,
  } satisfies Omit<LocalMonolithicSdirk2V1StageResult, "deterministicHash">;

  return {
    ...resultWithoutHash,
    deterministicHash: stableHash(sanitizeForStableHash(resultWithoutHash)),
  };
}

function evaluateStageStackAtUnknown(
  context: StageContext,
  unknownVector: Float64Array,
  targetExternalPressurePa: number,
): Omit<LocalMonolithicSdirk2V1StackEvaluation, "elasticLoadPa" | "localForceBalanceResidualPa" | "targetExternalPressurePa"> {
  const definition = context.definition;
  const cavityVolumeM3 = unknownVector[0];
  const stageLandState = landStateFromUnknownVector(unknownVector);
  const coordinateRateM3PerSec = deriveStageCoordinateRate(context, cavityVolumeM3);
  const kinematics = evaluateKinematics(
    definition,
    cavityVolumeM3,
    definition.previousCavityVolumeM3,
    coordinateRateM3PerSec,
  );
  const landInput = landInputForStage(context, kinematics.fiberEngineeringStrain);
  const landKinematics = deriveLand2017Sdirk2StageKinematics(landInput);
  const landResidual = writeLand2017Sdirk2StageResidual(
    stageLandState,
    context.previousLandState,
    landInput,
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  );
  const source = evaluateLand2017Sdirk2StageOutput(
    stageLandState,
    landInput,
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  );
  const active = IdentityFiberNominalV1.evaluate({
    source,
    instance: {
      moduleId: "homogenization",
      instanceId: `phase5b-${definition.ventricle.toLowerCase()}-stage${context.stageIndex}`,
    },
    wallReferenceVolumeM3: kinematics.wallReferenceVolumeM3,
  }, IDENTITY_FIBER_NOMINAL_V1_PARAMS);
  const passive = evaluatePassiveExponentialEnergyV1({
    fiberEngineeringStrain: kinematics.fiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: kinematics.fiberEngineeringStrainRatePerSec,
  });
  const force = evaluateVirtualPowerGeneralizedForceV1({
    kinematics,
    active,
    passive,
    coordinateRatesSI: [coordinateRateM3PerSec],
    coordinateUnitsById: { [definition.parameterSet.coordinateId]: "m3" },
  });
  const pressureMapPa =
    force.volumeCoordinatePressurePa?.[definition.parameterSet.coordinateId] ?? Number.NaN;
  const rateDerivation = rateEvidence(
    context,
    cavityVolumeM3,
    kinematics,
    coordinateRateM3PerSec,
    landKinematics.stageFiberEngineeringStrainRatePerSec,
  );
  const land = landSolveEvidence(
    context,
    landResidual,
    stageLandState,
    source,
  );
  const finite =
    kinematics.geometryHealth.finite
    && kinematics.geometryHealth.inCalibrationDomain
    && land.outputFinite
    && finitePassive(passive)
    && finiteGeneralizedForce(force)
    && Number.isFinite(pressureMapPa)
    && Number.isFinite(targetExternalPressurePa)
    && rateDerivation.pass;

  return {
    stageIndex: context.stageIndex,
    cavityVolumeM3,
    previousCavityVolumeM3: definition.previousCavityVolumeM3,
    coordinateRateM3PerSec,
    fiberEngineeringStrain: kinematics.fiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: kinematics.fiberEngineeringStrainRatePerSec,
    dStrainDVolume: kinematics.dStrainDCoordinate[0],
    pressureMapPa,
    sourceActiveFiberStressPa: source.sourceActiveFiberStressPa,
    wallActiveNominalStressPa: active.wallActiveNominalStressPa,
    passiveNominalStressPa: passive.passiveNominalStressPa,
    viscousNominalStressPa: passive.viscousNominalStressPa,
    conjugateForceSI: force.conjugateForcesSI[0],
    virtualPowerResidualW: force.virtualPowerResidualW,
    land,
    rateDerivation,
    finite,
  };
}

function landInputForStage(
  context: StageContext,
  stageFiberEngineeringStrain: number,
): Land2017Sdirk2StageInput {
  if (context.stageIndex === 0) {
    return {
      freeCalciumUM: context.calcium.freeCalciumUM,
      previousFiberEngineeringStrain: context.previousFiberEngineeringStrain,
      stageFiberEngineeringStrain,
      dtSec: context.definition.dtSec,
      stage: {
        scheme: "SDIRK2",
        stageIndex: 0,
        gamma: LAND2017_SDIRK2_GAMMA,
      },
    };
  }
  if (!context.stage0) {
    throw new Error("local-monolithic-sdirk2-v1 stage1 requires stage0 history");
  }
  return {
    freeCalciumUM: context.calcium.freeCalciumUM,
    previousFiberEngineeringStrain: context.previousFiberEngineeringStrain,
    stageFiberEngineeringStrain,
    dtSec: context.definition.dtSec,
    stage: {
      scheme: "SDIRK2",
      stageIndex: 1,
      gamma: LAND2017_SDIRK2_GAMMA,
    },
    stage0: {
      state: context.stage0.state,
      fiberEngineeringStrain: context.stage0.fiberEngineeringStrain,
      cavityVolumeM3: context.stage0.cavityVolumeM3,
      freeCalciumUM: context.stage0.freeCalciumUM,
    },
  };
}

function prescribedCalciumStageEvidence(
  definition: LocalMonolithicSdirk2V1SampleDefinition,
  stageIndex: LocalMonolithicSdirk2V1StageIndex,
  previousState: ArrayLike<number>,
): LocalMonolithicSdirk2V1CalciumEvidence {
  const cValue = stageIndex === 0 ? LAND2017_SDIRK2_TABLEAU.c0 : LAND2017_SDIRK2_TABLEAU.c1;
  const stageIncrementDtSec =
    stageIndex === 0
      ? LAND2017_SDIRK2_GAMMA * definition.dtSec
      : (1 - LAND2017_SDIRK2_GAMMA) * definition.dtSec;
  const absoluteTimeSinceActivationSec =
    definition.calciumInput.timeSinceActivationSec + cValue * definition.dtSec;
  const input: PrescribedCalciumInput = {
    ...definition.calciumInput,
    timeSinceActivationSec: absoluteTimeSinceActivationSec,
    dtSec: stageIncrementDtSec,
  };
  const calcium = stepPrescribedCalciumTransientV1(
    previousState,
    input,
  );
  const freeCalciumUM = calcium.output.freeCalciumUM;
  return {
    modelParameterSetId: PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
    targetId: definition.calciumInput.targetId,
    stageIndex,
    cValue,
    activationEventId: definition.calciumInput.activationEventId,
    absoluteTimeSinceActivationSec,
    cycleLengthSec: definition.calciumInput.cycleLengthSec,
    stageIncrementDtSec,
    dtSecSemantics: "sequential-stage-increment",
    freeCalciumUM,
    previousState: Array.from(previousState),
    nextState: Array.from(calcium.nextState),
    finite:
      Number.isFinite(freeCalciumUM)
      && Array.from(calcium.nextState).every(Number.isFinite)
      && Number.isFinite(calcium.output.riseState01)
      && Number.isFinite(calcium.output.decayState01),
  };
}

function rateEvidence(
  context: StageContext,
  stageCoordinateSI: number,
  kinematics: MyocardialKinematicsOutput,
  stageCoordinateRateSI: number,
  landStageStrainRatePerSec: number,
): LocalMonolithicSdirk2V1RateEvidence {
  const formulaCoordinateRateSI = deriveStageCoordinateRate(context, stageCoordinateSI);
  const formulaStrainRatePerSec =
    context.stageIndex === 0
      ? (
        kinematics.fiberEngineeringStrain
        - context.previousFiberEngineeringStrain
      )
        / (LAND2017_SDIRK2_GAMMA * context.definition.dtSec)
      : stage1FormulaStrainRate(context, kinematics.fiberEngineeringStrain);
  const strainRateResidualAbsPerSec =
    Math.abs(landStageStrainRatePerSec - formulaStrainRatePerSec);
  const coordinateRateResidualAbsSI =
    Math.abs(stageCoordinateRateSI - formulaCoordinateRateSI);
  return {
    previousFiberEngineeringStrain: context.previousFiberEngineeringStrain,
    stageFiberEngineeringStrain: kinematics.fiberEngineeringStrain,
    landStageStrainRatePerSec,
    formulaStrainRatePerSec,
    ...(context.stage0
      ? { stage0StrainRatePerSec: stage0FormulaStrainRate(context) }
      : {}),
    strainRateResidualAbsPerSec,
    previousCoordinateSI: context.definition.previousCavityVolumeM3,
    stageCoordinateSI,
    stageCoordinateRateSI,
    formulaCoordinateRateSI,
    ...(context.stage0
      ? { stage0CoordinateRateSI: context.stage0.coordinateRateM3PerSec }
      : {}),
    coordinateRateResidualAbsSI,
    kinematicsStrainRatePerSec: kinematics.fiberEngineeringStrainRatePerSec,
    tolerance: RATE_DERIVATION_TOLERANCE,
    pass:
      Number.isFinite(landStageStrainRatePerSec)
      && Number.isFinite(formulaStrainRatePerSec)
      && Number.isFinite(stageCoordinateRateSI)
      && Number.isFinite(formulaCoordinateRateSI)
      && Number.isFinite(kinematics.fiberEngineeringStrainRatePerSec)
      && strainRateResidualAbsPerSec <= RATE_DERIVATION_TOLERANCE
      && coordinateRateResidualAbsSI <= RATE_DERIVATION_TOLERANCE,
  };
}

function stage0FormulaStrainRate(context: StageContext): number {
  if (!context.stage0) return Number.NaN;
  return (
    context.stage0.fiberEngineeringStrain
    - context.previousFiberEngineeringStrain
  )
    / (LAND2017_SDIRK2_GAMMA * context.definition.dtSec);
}

function stage1FormulaStrainRate(context: StageContext, stageFiberEngineeringStrain: number): number {
  if (!context.stage0) {
    throw new Error("local-monolithic-sdirk2-v1 stage1 strain-rate formula requires stage0 history");
  }
  const stage0Rate = stage0FormulaStrainRate(context);
  return (
    stageFiberEngineeringStrain
    - context.previousFiberEngineeringStrain
    - context.definition.dtSec * (1 - LAND2017_SDIRK2_GAMMA) * stage0Rate
  )
    / (LAND2017_SDIRK2_GAMMA * context.definition.dtSec);
}

function deriveStageCoordinateRate(
  context: StageContext,
  stageCoordinateSI: number,
): number {
  if (context.stageIndex === 0) {
    return (
      stageCoordinateSI
      - context.definition.previousCavityVolumeM3
    )
      / (LAND2017_SDIRK2_GAMMA * context.definition.dtSec);
  }
  if (!context.stage0) {
    throw new Error("local-monolithic-sdirk2-v1 stage1 coordinate rate requires stage0 history");
  }
  return (
    stageCoordinateSI
    - context.definition.previousCavityVolumeM3
    - context.definition.dtSec
      * (1 - LAND2017_SDIRK2_GAMMA)
      * context.stage0.coordinateRateM3PerSec
  )
    / (LAND2017_SDIRK2_GAMMA * context.definition.dtSec);
}

function evaluateKinematics(
  definition: LocalMonolithicSdirk2V1SampleDefinition,
  valueSI: number,
  previousValueSI: number,
  rateSI: number,
): MyocardialKinematicsOutput {
  return evaluateThickSphereV2SelectedBackend(
    {
      coordinates: [
        {
          id: definition.parameterSet.coordinateId,
          valueSI,
          previousValueSI,
          rateSI,
          unit: "m3",
        },
      ],
      instance: {
        moduleId: "kinematics",
        instanceId: `phase5b-${definition.ventricle.toLowerCase()}`,
      },
    },
    definition.parameterSet,
  );
}

function landSolveEvidence(
  context: StageContext,
  residualVector: Float64Array,
  stageState: Float64Array,
  source: LandSourceOutput,
): LocalMonolithicSdirk2V1LandSolveEvidence {
  const residualNorm = infinityNorm(residualVector);
  const stateFinite = Array.from(stageState).every(Number.isFinite);
  const outputFinite =
    source.health.finite
    && Number.isFinite(source.sourceActiveFiberStressPa)
    && Number.isFinite(source.stabilizationStiffnessPa)
    && Number.isFinite(source.sourceActivePowerDensityWPerM3);
  return {
    method: LOCAL_MONOLITHIC_SDIRK2_V1_LAND_SOLVER_METHOD,
    residualSource: "Land 2017 SDIRK2 stage residual",
    stageScheme: "SDIRK2",
    stageIndex: context.stageIndex,
    gamma: LAND2017_SDIRK2_GAMMA,
    ok:
      residualNorm <= context.definition.landResidualTolerance
      && outputFinite
      && stateFinite,
    residualNorm,
    residualTolerance: context.definition.landResidualTolerance,
    residualVector: Array.from(residualVector),
    previousState: Array.from(context.previousLandState),
    stageState: Array.from(stageState),
    ...(context.stage0 ? { stage0State: Array.from(context.stage0.state) } : {}),
    stateUpdateLinf: stateUpdateLinf(context.previousLandState, stageState),
    outputFinite,
    stateFinite,
    sourceActiveFiberStressPa: source.sourceActiveFiberStressPa,
    stabilizationStiffnessPa: source.stabilizationStiffnessPa,
    minimumPopulation: source.health.minimumPopulation,
    stateConservationResidual: source.health.stateConservationResidual,
  };
}

function finiteHealthSummary(
  stack: LocalMonolithicSdirk2V1StackEvaluation,
): LocalMonolithicSdirk2V1FiniteHealth {
  const kinematicsFinite =
    Number.isFinite(stack.fiberEngineeringStrain)
    && Number.isFinite(stack.fiberEngineeringStrainRatePerSec)
    && Number.isFinite(stack.dStrainDVolume);
  const landFinite = stack.land.ok && stack.land.outputFinite && stack.land.stateFinite;
  const passiveFinite =
    Number.isFinite(stack.passiveNominalStressPa)
    && Number.isFinite(stack.viscousNominalStressPa);
  const generalizedForceFinite =
    Number.isFinite(stack.conjugateForceSI)
    && Number.isFinite(stack.virtualPowerResidualW);
  const pressureMapFinite = Number.isFinite(stack.pressureMapPa);
  const localResidualFinite = Number.isFinite(stack.localForceBalanceResidualPa);
  const stateFinite = [
    stack.cavityVolumeM3,
    stack.previousCavityVolumeM3,
    stack.coordinateRateM3PerSec,
    stack.sourceActiveFiberStressPa,
    stack.wallActiveNominalStressPa,
    stack.elasticLoadPa,
    stack.targetExternalPressurePa,
  ].every(Number.isFinite);

  return {
    kinematicsFinite,
    landFinite,
    passiveFinite,
    generalizedForceFinite,
    pressureMapFinite,
    localResidualFinite,
    stateFinite,
    pass:
      kinematicsFinite
      && landFinite
      && passiveFinite
      && generalizedForceFinite
      && pressureMapFinite
      && localResidualFinite
      && stateFinite,
  };
}

function finitePassive(passive: PassiveMaterialOutput): boolean {
  return Number.isFinite(passive.passiveNominalStressPa)
    && Number.isFinite(passive.viscousNominalStressPa)
    && Number.isFinite(passive.dPassiveStressDStrainPa)
    && Number.isFinite(passive.storedEnergyDensityJPerM3)
    && Number.isFinite(passive.dissipationDensityWPerM3);
}

function finiteGeneralizedForce(output: GeneralizedForceOutput): boolean {
  return Number.isFinite(output.virtualPowerResidualW)
    && Array.from(output.conjugateForcesSI).every(Number.isFinite)
    && Array.from(output.activeContributionsSI).every(Number.isFinite)
    && Array.from(output.passiveContributionsSI).every(Number.isFinite)
    && Array.from(output.viscousContributionsSI).every(Number.isFinite);
}

function makeUnknownVector(
  cavityVolumeM3: number,
  landState: ArrayLike<number>,
): Float64Array {
  const unknownVector = new Float64Array(LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION);
  unknownVector[0] = cavityVolumeM3;
  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    unknownVector[index + 1] = landState[index];
  }
  return unknownVector;
}

function landStateFromUnknownVector(unknownVector: Float64Array): Float64Array {
  return unknownVector.slice(1, 1 + LAND2017_STATE_SIZE);
}

function normalizedMonolithicResidualVector(
  landResidualVector: readonly number[],
  landResidualNorm: number,
  forceResidualPa: number,
  definition: LocalMonolithicSdirk2V1SampleDefinition,
): Float64Array {
  const residual = new Float64Array(LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION);
  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    residual[index] = landResidualVector[index] / definition.landResidualTolerance;
  }
  residual[LAND2017_STATE_SIZE] = forceResidualPa / definition.residualTolerancePa;
  if (!Number.isFinite(landResidualNorm)) {
    residual[0] = Number.POSITIVE_INFINITY;
  }
  return residual;
}

function finiteDifferenceJacobian(
  context: StageContext,
  unknownVector: Float64Array,
  residualAt: (candidateUnknownVector: Float64Array) => ResidualEvaluation,
): {
  readonly matrix: Float64Array;
  readonly determinant: number;
  readonly volumeDerivativePaPerM3: number;
} {
  const n = LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION;
  const matrix = new Float64Array(n * n);
  const volumeStep = derivativeStep(context.definition, unknownVector[0]);
  let volumeDerivativePaPerM3 = Number.NaN;

  for (let column = 0; column < n; column += 1) {
    const h = column === 0
      ? volumeStep
      : landStateDerivativeStep(unknownVector, column);
    const plusUnknown = Float64Array.from(unknownVector);
    const minusUnknown = Float64Array.from(unknownVector);
    plusUnknown[column] += h;
    minusUnknown[column] -= h;
    const plus = residualAt(plusUnknown);
    const minus = residualAt(minusUnknown);
    for (let row = 0; row < n; row += 1) {
      matrix[row * n + column] =
        (plus.residualVector[row] - minus.residualVector[row]) / (2 * h);
    }
    if (column === 0) {
      volumeDerivativePaPerM3 = (plus.residualPa - minus.residualPa) / (2 * h);
    }
  }

  return {
    matrix,
    determinant: denseDeterminant(matrix, n),
    volumeDerivativePaPerM3,
  };
}

function derivativeStep(
  definition: LocalMonolithicSdirk2V1SampleDefinition,
  cavityVolumeM3: number,
): number {
  const rawStep = Math.max(Math.abs(cavityVolumeM3) * definition.derivativeRelativeStep, 1e-10);
  const lowerRoom = cavityVolumeM3 - definition.parameterSet.sweepCavityVolumeMinM3;
  const upperRoom = definition.parameterSet.sweepCavityVolumeMaxM3 - cavityVolumeM3;
  const bounded = Math.min(rawStep, lowerRoom * 0.45, upperRoom * 0.45);
  if (!Number.isFinite(bounded) || bounded <= 0) {
    throw new Error("local-monolithic-sdirk2-v1 finite-difference derivative step left calibration domain");
  }
  return bounded;
}

function landStateDerivativeStep(
  unknownVector: Float64Array,
  column: number,
): number {
  const value = unknownVector[column];
  const rawStep = Math.max(Math.abs(value) * 1e-5, 1e-8);
  if (column === 1) {
    return boundedPositiveStep(rawStep, value, 1 - value);
  }
  if (column >= 2 && column <= 4) {
    const b = unknownVector[2];
    const w = unknownVector[3];
    const s = unknownVector[4];
    const unboundPopulation = 1 - b - w - s;
    return boundedPositiveStep(rawStep, value, unboundPopulation);
  }
  return rawStep;
}

function boundedPositiveStep(rawStep: number, value: number, upperRoom: number): number {
  const lowerRoom = value;
  const bounded = Math.min(rawStep, lowerRoom * 0.45, upperRoom * 0.45);
  if (!Number.isFinite(bounded) || bounded <= 0) {
    throw new Error("local-monolithic-sdirk2-v1 Land state finite-difference derivative step left state domain");
  }
  return bounded;
}

function solveDenseLinearSystem(
  matrix: Float64Array,
  rhs: Float64Array,
  n: number,
): Float64Array {
  if (matrix.length !== n * n || rhs.length !== n) {
    throw new Error("local-monolithic-sdirk2-v1 dense solve dimension mismatch");
  }
  const a = Float64Array.from(matrix);
  const b = Float64Array.from(rhs);

  for (let pivot = 0; pivot < n; pivot += 1) {
    let pivotRow = pivot;
    let pivotAbs = Math.abs(a[pivot * n + pivot]);
    for (let row = pivot + 1; row < n; row += 1) {
      const candidateAbs = Math.abs(a[row * n + pivot]);
      if (candidateAbs > pivotAbs) {
        pivotRow = row;
        pivotAbs = candidateAbs;
      }
    }
    if (!Number.isFinite(pivotAbs) || pivotAbs < 1e-18) {
      throw new Error("local-monolithic-sdirk2-v1 dense solve singular Jacobian");
    }
    if (pivotRow !== pivot) {
      swapRows(a, b, n, pivot, pivotRow);
    }
    const pivotValue = a[pivot * n + pivot];
    for (let row = pivot + 1; row < n; row += 1) {
      const factor = a[row * n + pivot] / pivotValue;
      a[row * n + pivot] = 0;
      for (let column = pivot + 1; column < n; column += 1) {
        a[row * n + column] -= factor * a[pivot * n + column];
      }
      b[row] -= factor * b[pivot];
    }
  }

  const x = new Float64Array(n);
  for (let row = n - 1; row >= 0; row -= 1) {
    let sum = b[row];
    for (let column = row + 1; column < n; column += 1) {
      sum -= a[row * n + column] * x[column];
    }
    x[row] = sum / a[row * n + row];
  }
  return x;
}

function denseDeterminant(matrix: Float64Array, n: number): number {
  const a = Float64Array.from(matrix);
  let determinant = 1;
  let sign = 1;
  for (let pivot = 0; pivot < n; pivot += 1) {
    let pivotRow = pivot;
    let pivotAbs = Math.abs(a[pivot * n + pivot]);
    for (let row = pivot + 1; row < n; row += 1) {
      const candidateAbs = Math.abs(a[row * n + pivot]);
      if (candidateAbs > pivotAbs) {
        pivotRow = row;
        pivotAbs = candidateAbs;
      }
    }
    if (!Number.isFinite(pivotAbs) || pivotAbs < 1e-18) return 0;
    if (pivotRow !== pivot) {
      swapRows(a, undefined, n, pivot, pivotRow);
      sign *= -1;
    }
    const pivotValue = a[pivot * n + pivot];
    determinant *= pivotValue;
    for (let row = pivot + 1; row < n; row += 1) {
      const factor = a[row * n + pivot] / pivotValue;
      for (let column = pivot + 1; column < n; column += 1) {
        a[row * n + column] -= factor * a[pivot * n + column];
      }
    }
  }
  return determinant * sign;
}

function swapRows(
  matrix: Float64Array,
  rhs: Float64Array | undefined,
  n: number,
  rowA: number,
  rowB: number,
): void {
  for (let column = 0; column < n; column += 1) {
    const offsetA = rowA * n + column;
    const offsetB = rowB * n + column;
    const tmp = matrix[offsetA];
    matrix[offsetA] = matrix[offsetB];
    matrix[offsetB] = tmp;
  }
  if (rhs) {
    const tmp = rhs[rowA];
    rhs[rowA] = rhs[rowB];
    rhs[rowB] = tmp;
  }
}

function addScaled(vector: Float64Array, delta: Float64Array, alpha: number): Float64Array {
  const next = Float64Array.from(vector);
  for (let index = 0; index < next.length; index += 1) {
    next[index] += alpha * delta[index];
  }
  return next;
}

function infinityNorm(values: ArrayLike<number>): number {
  let norm = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = Math.abs(values[index]);
    if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;
    norm = Math.max(norm, value);
  }
  return norm;
}

function stateUpdateLinf(previous: ArrayLike<number>, next: ArrayLike<number>): number {
  let update = 0;
  for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
    update = Math.max(update, Math.abs(next[index] - previous[index]));
  }
  return update;
}

function monolithicUnknownLabels(): LocalMonolithicSdirk2V1NewtonEvidence["coupledUnknowns"] {
  return ["cavityVolumeM3", "CaTRPN", "B", "W", "S", "zetaW", "zetaS"];
}

function volumeInDomain(
  definition: LocalMonolithicSdirk2V1SampleDefinition,
  cavityVolumeM3: number,
): boolean {
  return Number.isFinite(cavityVolumeM3)
    && cavityVolumeM3 >= definition.parameterSet.sweepCavityVolumeMinM3
    && cavityVolumeM3 <= definition.parameterSet.sweepCavityVolumeMaxM3;
}

function assertDefinition(definition: LocalMonolithicSdirk2V1SampleDefinition): void {
  if (definition.parameterSet.ventricle !== definition.ventricle) {
    throw new Error("local-monolithic-sdirk2-v1 sample ventricle must match selected v2 parameter set");
  }
  for (const field of [
    "previousCavityVolumeM3",
    "targetRootCavityVolumeM3",
    "initialGuessCavityVolumeM3",
    "dtSec",
    "elasticLoadStiffnessPaPerM3",
    "residualTolerancePa",
    "derivativeRelativeStep",
    "lineSearchMinStep",
    "lineSearchReduction",
    "landResidualTolerance",
  ] as const) {
    const value = definition[field];
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`local-monolithic-sdirk2-v1 ${field} must be positive and finite`);
    }
  }
  if (!Number.isInteger(definition.maxNewtonIterations) || definition.maxNewtonIterations <= 0) {
    throw new Error("local-monolithic-sdirk2-v1 maxNewtonIterations must be a positive integer");
  }
  if (!volumeInDomain(definition, definition.previousCavityVolumeM3)) {
    throw new Error("local-monolithic-sdirk2-v1 previous cavity volume must be inside selected v2 calibration domain");
  }
  if (!volumeInDomain(definition, definition.targetRootCavityVolumeM3)) {
    throw new Error("local-monolithic-sdirk2-v1 target root cavity volume must be inside selected v2 calibration domain");
  }
  if (!volumeInDomain(definition, definition.initialGuessCavityVolumeM3)) {
    throw new Error("local-monolithic-sdirk2-v1 initial guess cavity volume must be inside selected v2 calibration domain");
  }
  if (definition.lineSearchReduction <= 0 || definition.lineSearchReduction >= 1) {
    throw new Error("local-monolithic-sdirk2-v1 lineSearchReduction must be in (0,1)");
  }
  if (definition.previousLandState.length !== 6) {
    throw new Error("local-monolithic-sdirk2-v1 previousLandState must contain six Land states");
  }
  if (definition.previousCalciumState.length !== 2) {
    throw new Error("local-monolithic-sdirk2-v1 previousCalciumState must contain two prescribed calcium states");
  }
  if (VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID !== "virtual-power-generalized-force-v1") {
    throw new Error("local-monolithic-sdirk2-v1 requires virtual-power-generalized-force-v1");
  }
  if (LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID !== "land2017-intact-human-37c-source-v1") {
    throw new Error("local-monolithic-sdirk2-v1 requires the fixed Land 2017 source parameter set");
  }
}
