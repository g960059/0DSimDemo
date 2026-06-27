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
import { evaluateLand2017StepOutput } from "@/engine/myocardium/myofilament/land2017/outputs";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { writeLand2017BackwardEulerResidual } from "@/engine/myocardium/myofilament/land2017/residual";
import {
  LAND2017_STATE_SIZE,
  deriveLand2017StepKinematics,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017/types";

export const LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID = "local-monolithic-be-v1";
export const LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY =
  "phase5a-local-monolithic-be-reference-only";
export const LOCAL_MONOLITHIC_BE_V1_LAND_SOLVER_METHOD =
  "writeLand2017BackwardEulerResidual";
export const LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION = 1 + LAND2017_STATE_SIZE;

export type LocalMonolithicBeV1SampleId =
  | "phase5a-lv-local-be-reference"
  | "phase5a-rv-local-be-reference";

export type LocalMonolithicBeV1SampleDefinition = {
  readonly id: LocalMonolithicBeV1SampleId;
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

export type LocalMonolithicBeV1LandSolveEvidence = {
  readonly method: typeof LOCAL_MONOLITHIC_BE_V1_LAND_SOLVER_METHOD;
  readonly residualSource: "Land 2017 backward-Euler residual";
  readonly stageScheme: "BE";
  readonly stageIndex: 0;
  readonly ok: boolean;
  readonly residualNorm: number;
  readonly residualTolerance: number;
  readonly residualVector: readonly number[];
  readonly previousState: readonly number[];
  readonly nextState: readonly number[];
  readonly stateUpdateLinf: number;
  readonly outputFinite: boolean;
  readonly stateFinite: boolean;
  readonly sourceActiveFiberStressPa: number;
  readonly stabilizationStiffnessPa: number;
  readonly minimumPopulation: number;
  readonly stateConservationResidual: number;
};

export type LocalMonolithicBeV1CalciumEvidence = {
  readonly modelParameterSetId: typeof PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID;
  readonly targetId: string;
  readonly activationEventId: number;
  readonly timeSinceActivationSec: number;
  readonly cycleLengthSec: number;
  readonly dtSec: number;
  readonly freeCalciumUM: number;
  readonly finite: boolean;
};

export type LocalMonolithicBeV1StrainRateEvidence = {
  readonly previousFiberEngineeringStrain: number;
  readonly stageFiberEngineeringStrain: number;
  readonly landDerivedStrainRatePerSec: number;
  readonly finiteDifferenceStrainRatePerSec: number;
  readonly instantaneousKinematicsStrainRatePerSec: number;
  readonly derivationResidualAbsPerSec: number;
  readonly tolerancePerSec: number;
  readonly pass: boolean;
};

export type LocalMonolithicBeV1StackEvaluation = {
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
  readonly land: LocalMonolithicBeV1LandSolveEvidence;
  readonly strainRate: LocalMonolithicBeV1StrainRateEvidence;
  readonly finite: boolean;
};

export type LocalMonolithicBeV1NewtonEvidence = {
  readonly ok: boolean;
  readonly unknownVectorDimension: typeof LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION;
  readonly coupledUnknowns: readonly [
    "cavityVolumeM3",
    "CaTRPN",
    "B",
    "W",
    "S",
    "zetaW",
    "zetaS",
  ];
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

export type LocalMonolithicBeV1FiniteHealth = {
  readonly kinematicsFinite: boolean;
  readonly landFinite: boolean;
  readonly passiveFinite: boolean;
  readonly generalizedForceFinite: boolean;
  readonly pressureMapFinite: boolean;
  readonly localResidualFinite: boolean;
  readonly stateFinite: boolean;
  readonly pass: boolean;
};

export type LocalMonolithicBeV1SampleResult = {
  readonly modelId: typeof LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID;
  readonly claimBoundary: typeof LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY;
  readonly id: LocalMonolithicBeV1SampleId;
  readonly ventricle: ThickSphereV2SelectedVentricle;
  readonly coordinateId: string;
  readonly parameterSetId: string;
  readonly calcium: LocalMonolithicBeV1CalciumEvidence;
  readonly targetRootCavityVolumeM3: number;
  readonly solvedCavityVolumeM3: number;
  readonly targetExternalPressurePa: number;
  readonly final: LocalMonolithicBeV1StackEvaluation;
  readonly target: Omit<LocalMonolithicBeV1StackEvaluation, "localForceBalanceResidualPa" | "targetExternalPressurePa">;
  readonly newton: LocalMonolithicBeV1NewtonEvidence;
  readonly finiteHealth: LocalMonolithicBeV1FiniteHealth;
  readonly allLandSolvesOk: boolean;
  readonly maxLandResidualNorm: number;
  readonly maxLocalForceBalanceResidualAbsPa: number;
  readonly pass: boolean;
  readonly deterministicHash: string;
};

export type LocalMonolithicBeV1ReferenceSuite = {
  readonly modelId: typeof LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID;
  readonly claimBoundary: typeof LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY;
  readonly samples: readonly LocalMonolithicBeV1SampleResult[];
  readonly sampleCount: number;
  readonly lvCovered: boolean;
  readonly rvCovered: boolean;
  readonly allSamplesPass: boolean;
  readonly maxLocalForceBalanceResidualAbsPa: number;
  readonly maxLandResidualNorm: number;
  readonly stableSummaryHash: string;
};

type ResidualEvaluation = {
  readonly stack: LocalMonolithicBeV1StackEvaluation;
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

const STRAIN_RATE_DERIVATION_TOLERANCE_PER_SEC = 1e-12;

const DEFAULT_SAMPLE_DEFINITIONS: readonly LocalMonolithicBeV1SampleDefinition[] = Object.freeze([
  {
    id: "phase5a-lv-local-be-reference",
    ventricle: "LV",
    parameterSet: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
    previousCavityVolumeM3: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3 * 0.985,
    targetRootCavityVolumeM3: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3 * 1.035,
    initialGuessCavityVolumeM3: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.anchorCavityVolumeM3 * 0.995,
    dtSec: 0.001,
    calciumInput: {
      targetId: "phase5a-lv-prescribed-ca",
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
    id: "phase5a-rv-local-be-reference",
    ventricle: "RV",
    parameterSet: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
    previousCavityVolumeM3: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.anchorCavityVolumeM3 * 1.02,
    targetRootCavityVolumeM3: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.anchorCavityVolumeM3 * 0.965,
    initialGuessCavityVolumeM3: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.anchorCavityVolumeM3 * 1.005,
    dtSec: 0.001,
    calciumInput: {
      targetId: "phase5a-rv-prescribed-ca",
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

export function localMonolithicBeV1DefaultSampleDefinitions():
  readonly LocalMonolithicBeV1SampleDefinition[] {
  return DEFAULT_SAMPLE_DEFINITIONS;
}

export function runLocalMonolithicBeV1ReferenceSuite(
  definitions: readonly LocalMonolithicBeV1SampleDefinition[] =
    DEFAULT_SAMPLE_DEFINITIONS,
): LocalMonolithicBeV1ReferenceSuite {
  const samples = definitions.map(runLocalMonolithicBeV1Sample);
  const maxLocalForceBalanceResidualAbsPa = Math.max(
    ...samples.map((sample) => sample.maxLocalForceBalanceResidualAbsPa),
  );
  const maxLandResidualNorm = Math.max(...samples.map((sample) => sample.maxLandResidualNorm));
  const allSamplesPass = samples.every((sample) => sample.pass);
  const suiteWithoutHash = {
    modelId: LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
    claimBoundary: LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY,
    samples,
    sampleCount: samples.length,
    lvCovered: samples.some((sample) => sample.ventricle === "LV"),
    rvCovered: samples.some((sample) => sample.ventricle === "RV"),
    allSamplesPass,
    maxLocalForceBalanceResidualAbsPa,
    maxLandResidualNorm,
  } satisfies Omit<LocalMonolithicBeV1ReferenceSuite, "stableSummaryHash">;

  return {
    ...suiteWithoutHash,
    stableSummaryHash: stableHash(sanitizeForStableHash(suiteWithoutHash)),
  };
}

export function runLocalMonolithicBeV1Sample(
  definition: LocalMonolithicBeV1SampleDefinition,
): LocalMonolithicBeV1SampleResult {
  assertDefinition(definition);
  const calcium = prescribedCalciumEvidence(definition);
  const previousKinematics = evaluateKinematics(
    definition,
    definition.previousCavityVolumeM3,
    definition.previousCavityVolumeM3,
  );
  const targetUnknownVector = makeUnknownVector(
    definition.targetRootCavityVolumeM3,
    definition.previousLandState,
  );
  const targetStackWithoutBalance = evaluateStackAtUnknown(
    definition,
    targetUnknownVector,
    calcium.freeCalciumUM,
    previousKinematics.fiberEngineeringStrain,
    0,
  );
  const targetExternalPressurePa =
    targetStackWithoutBalance.pressureMapPa;
  const targetStack = {
    ...targetStackWithoutBalance,
    elasticLoadPa: 0,
  };
  const stackEvaluations: LocalMonolithicBeV1StackEvaluation[] = [];
  const residualHistoryPa: number[] = [];
  const residualNormHistory: number[] = [];
  let derivativeEvaluationCount = 0;
  let lineSearchTrialCount = 0;
  let lineSearchBacktrackCount = 0;
  let finalJacobianDeterminant = Number.NaN;
  let finalVolumeDerivativePaPerM3 = Number.NaN;
  let unknownVector = makeUnknownVector(
    definition.initialGuessCavityVolumeM3,
    definition.previousLandState,
  );

  const residualAt = (candidateUnknownVector: Float64Array): ResidualEvaluation => {
    const stackWithoutBalance = evaluateStackAtUnknown(
      definition,
      candidateUnknownVector,
      calcium.freeCalciumUM,
      previousKinematics.fiberEngineeringStrain,
      targetExternalPressurePa,
    );
    const cavityVolumeM3 = candidateUnknownVector[0];
    const elasticLoadPa =
      definition.elasticLoadStiffnessPaPerM3
      * (cavityVolumeM3 - definition.targetRootCavityVolumeM3);
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
      definition,
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
    const jacobian = finiteDifferenceJacobian(definition, candidateUnknownVector, residualAt);
    derivativeEvaluationCount += 2 * LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION;
    return {
      ...center,
      jacobian: jacobian.matrix,
      jacobianDeterminant: jacobian.determinant,
      volumeDerivativePaPerM3: jacobian.volumeDerivativePaPerM3,
    };
  };

  let finalEvaluation = residualAndJacobianAt(unknownVector);
  for (let iteration = 0; iteration <= definition.maxNewtonIterations; iteration += 1) {
    finalEvaluation = residualAndJacobianAt(unknownVector);
    finalJacobianDeterminant = finalEvaluation.jacobianDeterminant;
    finalVolumeDerivativePaPerM3 = finalEvaluation.volumeDerivativePaPerM3;
    residualHistoryPa.push(finalEvaluation.residualPa);
    residualNormHistory.push(finalEvaluation.residualNorm);
    const residualAbsPa = Math.abs(finalEvaluation.residualPa);
    if (
      residualAbsPa <= definition.residualTolerancePa
      && finalEvaluation.landResidualNorm <= definition.landResidualTolerance
    ) {
      return sampleResult(
        definition,
        calcium,
        targetStack,
        targetExternalPressurePa,
        finalEvaluation.stack.cavityVolumeM3,
        finalEvaluation,
        {
          ok: true,
          unknownVectorDimension: LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION,
          coupledUnknowns: monolithicUnknownLabels(),
          iterationCount: iteration,
          maxIterations: definition.maxNewtonIterations,
          initialResidualAbsPa: Math.abs(residualHistoryPa[0]),
          finalResidualAbsPa: residualAbsPa,
          initialResidualNorm: residualNormHistory[0],
          finalResidualNorm: finalEvaluation.residualNorm,
          finalLandResidualNorm: finalEvaluation.landResidualNorm,
          finalLandStateUpdateLinf: finalEvaluation.stack.land.stateUpdateLinf,
          residualTolerancePa: definition.residualTolerancePa,
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
      iteration === definition.maxNewtonIterations
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
        LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION,
      );
    } catch {
      break;
    }
    let accepted: ResidualEvaluation | undefined;
    let acceptedUnknownVector = unknownVector;
    let localBacktracks = 0;
    for (
      let alpha = 1;
      alpha >= definition.lineSearchMinStep;
      alpha *= definition.lineSearchReduction
    ) {
      lineSearchTrialCount += 1;
      const candidateUnknownVector = addScaled(unknownVector, newtonStep, alpha);
      if (!volumeInDomain(definition, candidateUnknownVector[0])) {
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

  return sampleResult(
    definition,
    calcium,
    targetStack,
    targetExternalPressurePa,
    finalEvaluation.stack.cavityVolumeM3,
    finalEvaluation,
    {
      ok: false,
      unknownVectorDimension: LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION,
      coupledUnknowns: monolithicUnknownLabels(),
      iterationCount: Math.max(0, residualHistoryPa.length - 1),
      maxIterations: definition.maxNewtonIterations,
      initialResidualAbsPa: Math.abs(residualHistoryPa[0] ?? Number.NaN),
      finalResidualAbsPa: Math.abs(finalEvaluation.residualPa),
      initialResidualNorm: residualNormHistory[0] ?? Number.NaN,
      finalResidualNorm: finalEvaluation.residualNorm,
      finalLandResidualNorm: finalEvaluation.landResidualNorm,
      finalLandStateUpdateLinf: finalEvaluation.stack.land.stateUpdateLinf,
      residualTolerancePa: definition.residualTolerancePa,
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

function sampleResult(
  definition: LocalMonolithicBeV1SampleDefinition,
  calcium: LocalMonolithicBeV1CalciumEvidence,
  target: Omit<LocalMonolithicBeV1StackEvaluation, "localForceBalanceResidualPa" | "targetExternalPressurePa">,
  targetExternalPressurePa: number,
  solvedCavityVolumeM3: number,
  finalEvaluation: DerivativeEvaluation,
  newton: LocalMonolithicBeV1NewtonEvidence,
  stackEvaluations: readonly LocalMonolithicBeV1StackEvaluation[],
): LocalMonolithicBeV1SampleResult {
  const finiteHealth = finiteHealthSummary(finalEvaluation.stack);
  const allLandSolvesOk = finalEvaluation.stack.land.ok;
  const maxLandResidualNorm = finalEvaluation.stack.land.residualNorm;
  const maxLocalForceBalanceResidualAbsPa =
    Math.abs(finalEvaluation.stack.localForceBalanceResidualPa);
  const pass =
    newton.ok
    && newton.iterationCount > 0
    && newton.unknownVectorDimension === LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION
    && Number.isFinite(newton.finalJacobianDeterminant)
    && Number.isFinite(newton.finalVolumeDerivativePaPerM3)
    && newton.residualEvaluationCount > 0
    && newton.derivativeEvaluationCount > 0
    && newton.lineSearchTrialCount >= newton.iterationCount
    && newton.finalLandResidualNorm <= definition.landResidualTolerance
    && newton.finalResidualAbsPa <= definition.residualTolerancePa
    && allLandSolvesOk
    && maxLandResidualNorm <= definition.landResidualTolerance
    && maxLocalForceBalanceResidualAbsPa <= definition.residualTolerancePa
    && finalEvaluation.stack.strainRate.pass
    && finiteHealth.pass
    && calcium.finite;
  const resultWithoutHash = {
    modelId: LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
    claimBoundary: LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY,
    id: definition.id,
    ventricle: definition.ventricle,
    coordinateId: definition.parameterSet.coordinateId,
    parameterSetId: definition.parameterSet.parameterSetId,
    calcium,
    targetRootCavityVolumeM3: definition.targetRootCavityVolumeM3,
    solvedCavityVolumeM3,
    targetExternalPressurePa,
    final: finalEvaluation.stack,
    target,
    newton,
    finiteHealth,
    allLandSolvesOk,
    maxLandResidualNorm,
    maxLocalForceBalanceResidualAbsPa,
    pass,
  } satisfies Omit<LocalMonolithicBeV1SampleResult, "deterministicHash">;

  return {
    ...resultWithoutHash,
    deterministicHash: stableHash(sanitizeForStableHash(resultWithoutHash)),
  };
}

function evaluateStackAtUnknown(
  definition: LocalMonolithicBeV1SampleDefinition,
  unknownVector: Float64Array,
  freeCalciumUM: number,
  previousFiberEngineeringStrain: number,
  targetExternalPressurePa: number,
): Omit<LocalMonolithicBeV1StackEvaluation, "elasticLoadPa" | "localForceBalanceResidualPa" | "targetExternalPressurePa"> {
  const cavityVolumeM3 = unknownVector[0];
  const nextLandState = landStateFromUnknownVector(unknownVector);
  const kinematics = evaluateKinematics(definition, cavityVolumeM3, definition.previousCavityVolumeM3);
  const landInput: LandStepInput = {
    freeCalciumUM,
    previousFiberEngineeringStrain,
    stageFiberEngineeringStrain: kinematics.fiberEngineeringStrain,
    dtSec: definition.dtSec,
    stage: { scheme: "BE", stageIndex: 0 },
  };
  const landKinematics = deriveLand2017StepKinematics(landInput);
  const landResidual = writeLand2017BackwardEulerResidual(
    nextLandState,
    definition.previousLandState,
    landInput,
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  );
  const source = evaluateLand2017StepOutput(
    nextLandState,
    landInput,
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  );
  const active = IdentityFiberNominalV1.evaluate({
    source,
    instance: {
      moduleId: "homogenization",
      instanceId: `phase5a-${definition.ventricle.toLowerCase()}`,
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
    coordinateRatesSI: [
      (cavityVolumeM3 - definition.previousCavityVolumeM3) / definition.dtSec,
    ],
    coordinateUnitsById: { [definition.parameterSet.coordinateId]: "m3" },
  });
  const pressureMapPa =
    force.volumeCoordinatePressurePa?.[definition.parameterSet.coordinateId] ?? Number.NaN;
  const strainRate = strainRateEvidence(
    previousFiberEngineeringStrain,
    kinematics,
    landKinematics.stageFiberEngineeringStrainRatePerSec,
    definition.dtSec,
  );
  const land = landSolveEvidence(
    landResidual,
    nextLandState,
    source,
    definition,
  );
  const finite =
    kinematics.geometryHealth.finite
    && kinematics.geometryHealth.inCalibrationDomain
    && land.outputFinite
    && finitePassive(passive)
    && finiteGeneralizedForce(force)
    && Number.isFinite(pressureMapPa)
    && Number.isFinite(targetExternalPressurePa)
    && strainRate.pass;

  return {
    cavityVolumeM3,
    previousCavityVolumeM3: definition.previousCavityVolumeM3,
    coordinateRateM3PerSec:
      (cavityVolumeM3 - definition.previousCavityVolumeM3) / definition.dtSec,
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
    strainRate,
    finite,
  };
}

function evaluateKinematics(
  definition: LocalMonolithicBeV1SampleDefinition,
  valueSI: number,
  previousValueSI: number,
): MyocardialKinematicsOutput {
  return evaluateThickSphereV2SelectedBackend(
    {
      coordinates: [
        {
          id: definition.parameterSet.coordinateId,
          valueSI,
          previousValueSI,
          rateSI: (valueSI - previousValueSI) / definition.dtSec,
          unit: "m3",
        },
      ],
      instance: {
        moduleId: "kinematics",
        instanceId: `phase5a-${definition.ventricle.toLowerCase()}`,
      },
    },
    definition.parameterSet,
  );
}

function prescribedCalciumEvidence(
  definition: LocalMonolithicBeV1SampleDefinition,
): LocalMonolithicBeV1CalciumEvidence {
  const calcium = stepPrescribedCalciumTransientV1(
    Float64Array.from(definition.previousCalciumState),
    definition.calciumInput,
  );
  const freeCalciumUM = calcium.output.freeCalciumUM;
  return {
    modelParameterSetId: PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
    targetId: definition.calciumInput.targetId,
    activationEventId: definition.calciumInput.activationEventId,
    timeSinceActivationSec: definition.calciumInput.timeSinceActivationSec,
    cycleLengthSec: definition.calciumInput.cycleLengthSec,
    dtSec: definition.calciumInput.dtSec,
    freeCalciumUM,
    finite:
      Number.isFinite(freeCalciumUM)
      && Number.isFinite(calcium.output.riseState01)
      && Number.isFinite(calcium.output.decayState01),
  };
}

function strainRateEvidence(
  previousFiberEngineeringStrain: number,
  kinematics: MyocardialKinematicsOutput,
  landDerivedStrainRatePerSec: number,
  dtSec: number,
): LocalMonolithicBeV1StrainRateEvidence {
  const finiteDifferenceStrainRatePerSec =
    (kinematics.fiberEngineeringStrain - previousFiberEngineeringStrain) / dtSec;
  const derivationResidualAbsPerSec =
    Math.abs(landDerivedStrainRatePerSec - finiteDifferenceStrainRatePerSec);
  return {
    previousFiberEngineeringStrain,
    stageFiberEngineeringStrain: kinematics.fiberEngineeringStrain,
    landDerivedStrainRatePerSec,
    finiteDifferenceStrainRatePerSec,
    instantaneousKinematicsStrainRatePerSec: kinematics.fiberEngineeringStrainRatePerSec,
    derivationResidualAbsPerSec,
    tolerancePerSec: STRAIN_RATE_DERIVATION_TOLERANCE_PER_SEC,
    pass:
      Number.isFinite(landDerivedStrainRatePerSec)
      && Number.isFinite(finiteDifferenceStrainRatePerSec)
      && Number.isFinite(kinematics.fiberEngineeringStrainRatePerSec)
      && derivationResidualAbsPerSec <= STRAIN_RATE_DERIVATION_TOLERANCE_PER_SEC,
  };
}

function landSolveEvidence(
  residualVector: Float64Array,
  nextState: Float64Array,
  source: LandSourceOutput,
  definition: LocalMonolithicBeV1SampleDefinition,
): LocalMonolithicBeV1LandSolveEvidence {
  const residualNorm = infinityNorm(residualVector);
  const stateFinite = Array.from(nextState).every(Number.isFinite);
  const outputFinite =
    source.health.finite
    && Number.isFinite(source.sourceActiveFiberStressPa)
    && Number.isFinite(source.stabilizationStiffnessPa)
    && Number.isFinite(source.sourceActivePowerDensityWPerM3);
  return {
    method: LOCAL_MONOLITHIC_BE_V1_LAND_SOLVER_METHOD,
    residualSource: "Land 2017 backward-Euler residual",
    stageScheme: "BE",
    stageIndex: 0,
    ok:
      residualNorm <= definition.landResidualTolerance
      && outputFinite
      && stateFinite,
    residualNorm,
    residualTolerance: definition.landResidualTolerance,
    residualVector: Array.from(residualVector),
    previousState: Array.from(definition.previousLandState),
    nextState: Array.from(nextState),
    stateUpdateLinf: stateUpdateLinf(definition.previousLandState, nextState),
    outputFinite,
    stateFinite,
    sourceActiveFiberStressPa: source.sourceActiveFiberStressPa,
    stabilizationStiffnessPa: source.stabilizationStiffnessPa,
    minimumPopulation: source.health.minimumPopulation,
    stateConservationResidual: source.health.stateConservationResidual,
  };
}

function finiteHealthSummary(
  stack: LocalMonolithicBeV1StackEvaluation,
): LocalMonolithicBeV1FiniteHealth {
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
  const unknownVector = new Float64Array(LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION);
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
  definition: LocalMonolithicBeV1SampleDefinition,
): Float64Array {
  const residual = new Float64Array(LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION);
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
  definition: LocalMonolithicBeV1SampleDefinition,
  unknownVector: Float64Array,
  residualAt: (candidateUnknownVector: Float64Array) => ResidualEvaluation,
): {
  readonly matrix: Float64Array;
  readonly determinant: number;
  readonly volumeDerivativePaPerM3: number;
} {
  const n = LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION;
  const matrix = new Float64Array(n * n);
  const volumeStep = derivativeStep(definition, unknownVector[0]);
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
  definition: LocalMonolithicBeV1SampleDefinition,
  cavityVolumeM3: number,
): number {
  const rawStep = Math.max(Math.abs(cavityVolumeM3) * definition.derivativeRelativeStep, 1e-10);
  const lowerRoom = cavityVolumeM3 - definition.parameterSet.sweepCavityVolumeMinM3;
  const upperRoom = definition.parameterSet.sweepCavityVolumeMaxM3 - cavityVolumeM3;
  const bounded = Math.min(rawStep, lowerRoom * 0.45, upperRoom * 0.45);
  if (!Number.isFinite(bounded) || bounded <= 0) {
    throw new Error("local-monolithic-be-v1 finite-difference derivative step left calibration domain");
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
    throw new Error("local-monolithic-be-v1 Land state finite-difference derivative step left state domain");
  }
  return bounded;
}

function solveDenseLinearSystem(
  matrix: Float64Array,
  rhs: Float64Array,
  n: number,
): Float64Array {
  if (matrix.length !== n * n || rhs.length !== n) {
    throw new Error("local-monolithic-be-v1 dense solve dimension mismatch");
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
      throw new Error("local-monolithic-be-v1 dense solve singular Jacobian");
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

function monolithicUnknownLabels(): LocalMonolithicBeV1NewtonEvidence["coupledUnknowns"] {
  return ["cavityVolumeM3", "CaTRPN", "B", "W", "S", "zetaW", "zetaS"];
}

function volumeInDomain(
  definition: LocalMonolithicBeV1SampleDefinition,
  cavityVolumeM3: number,
): boolean {
  return Number.isFinite(cavityVolumeM3)
    && cavityVolumeM3 >= definition.parameterSet.sweepCavityVolumeMinM3
    && cavityVolumeM3 <= definition.parameterSet.sweepCavityVolumeMaxM3;
}

function assertDefinition(definition: LocalMonolithicBeV1SampleDefinition): void {
  if (definition.parameterSet.ventricle !== definition.ventricle) {
    throw new Error("local-monolithic-be-v1 sample ventricle must match selected v2 parameter set");
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
      throw new Error(`local-monolithic-be-v1 ${field} must be positive and finite`);
    }
  }
  if (!Number.isInteger(definition.maxNewtonIterations) || definition.maxNewtonIterations <= 0) {
    throw new Error("local-monolithic-be-v1 maxNewtonIterations must be a positive integer");
  }
  if (!volumeInDomain(definition, definition.previousCavityVolumeM3)) {
    throw new Error("local-monolithic-be-v1 previous cavity volume must be inside selected v2 calibration domain");
  }
  if (!volumeInDomain(definition, definition.targetRootCavityVolumeM3)) {
    throw new Error("local-monolithic-be-v1 target root cavity volume must be inside selected v2 calibration domain");
  }
  if (!volumeInDomain(definition, definition.initialGuessCavityVolumeM3)) {
    throw new Error("local-monolithic-be-v1 initial guess cavity volume must be inside selected v2 calibration domain");
  }
  if (definition.lineSearchReduction <= 0 || definition.lineSearchReduction >= 1) {
    throw new Error("local-monolithic-be-v1 lineSearchReduction must be in (0,1)");
  }
  if (definition.previousLandState.length !== 6) {
    throw new Error("local-monolithic-be-v1 previousLandState must contain six Land states");
  }
  if (definition.previousCalciumState.length !== 2) {
    throw new Error("local-monolithic-be-v1 previousCalciumState must contain two prescribed calcium states");
  }
  if (VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID !== "virtual-power-generalized-force-v1") {
    throw new Error("local-monolithic-be-v1 requires virtual-power-generalized-force-v1");
  }
  if (LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID !== "land2017-intact-human-37c-source-v1") {
    throw new Error("local-monolithic-be-v1 requires the fixed Land 2017 source parameter set");
  }
}
