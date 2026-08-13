import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  evaluateEnergyConjugateTriSegV1,
  evaluateTriSegGeometryV1,
  evaluateTriSegWallSecondDerivativeV1,
  type EnergyConjugateTriSegEvaluationV1,
  type TriSegCoordinatesV1,
  type TriSegGeometryV1,
  type TriSegWallGeometryParametersV1,
  type TriSegWallRecordV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  type WholeHeartMechanicsChamberValuesV1,
  type WholeHeartMechanicsDiagnosticsV1,
  type WholeHeartMechanicsProviderEvaluationV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsSerializableValueV1,
  type WholeHeartMechanicsStateCodecV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID =
  "main-wire-five-wall-land-triseg-provider-v1" as const;

export const MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM = Object.freeze({
  wallTopology:
    "Land-active-plus-equilibrium-passive-plus-parallel-one-state-SLS" as const,
  wallCount: 5 as const,
  ventricularGeometry: "energy-conjugate-TriSeg" as const,
  ventricularGeometryMechanics: "finite-thickness-membrane-only" as const,
  koiterBendingApplied: false as const,
  atrialGeometry: "fixed-wall-self-similar-one-fiber" as const,
  internalSolve: "simultaneous-scaled-damped-Newton" as const,
  internalUnknowns: Object.freeze(["V_m_S", "y_m"] as const),
  residual:
    "algorithmic-virtual-work-gradient-times-coordinate-scale-divided-by-one-joule" as const,
  trialMaterialLinearization:
    "smooth-branch-exact-one-step-BE-tangent-with-declared-Clarke-midpoints" as const,
  trialGeometryLinearization:
    "analytic-spherical-cap-implicit-hessian-with-center-material-tangent" as const,
  trialTransmuralPressureVolumeTangent:
    "analytic-center-material-consistent-four-chamber-Schur-complement" as const,
  trialTransmuralPressureVolumeTangentUnits: "mmHg-per-mL" as const,
  trialTransmuralPressureVolumeTangentIncludesPericardium: false as const,
  pressureVolumeTangentUnavailableWhen:
    "cold-solve-only-or-invalid-analytic-hessian" as const,
  finiteDifferenceJacobian: false as const,
  localStableEquilibriumRequired: true as const,
  algorithmicJacobianSymmetryRequired: true as const,
  thermodynamicPotentialForLandActiveClaimed: false as const,
  materialStressAdmissionBoundary:
    "owner-must-supply-fiber-stress-work-conjugate-to-effective-log-strain;an-equibiaxial-scalar-is-not-automatically-admissible" as const,
  hiddenBloodVolumeMl: 0 as const,
  pistonVolumeApplied: false as const,
  circulationOwnedHere: false as const,
  valveOwnedHere: false as const,
  parameterFittingOwnedHere: false as const,
  modelCoreWiringOwnedHere: false as const,
  trialSemantics: "pure-from-one-accepted-state" as const,
  rollbackOnFailure: true as const,
});

export const MAIN_WIRE_FIVE_WALL_IDS_V1 = Object.freeze([
  "LA",
  "LVFW",
  "SEP",
  "RVFW",
  "RA",
] as const);

export type MainWireFiveWallIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_IDS_V1)[number];
export type MainWireFiveWallRecordV1<T> =
  Readonly<Record<MainWireFiveWallIdV1, T>>;
export type MainWireFiveWallVentricularWallIdV1 =
  "LVFW" | "SEP" | "RVFW";
export type MainWireFiveWallVentricularVolumeColumnsV1 = Readonly<{
  LV: number;
  RV: number;
}>;
export type MainWireFiveWallVentricularCoronaryBoundaryTangentV1 = Readonly<{
  effectiveFiberLogStrainPerMlByWall: Readonly<Record<
    MainWireFiveWallVentricularWallIdV1,
    MainWireFiveWallVentricularVolumeColumnsV1
  >>;
  landActiveKirchhoffStressPaPerMlByWall: Readonly<Record<
    MainWireFiveWallVentricularWallIdV1,
    MainWireFiveWallVentricularVolumeColumnsV1
  >>;
}>;

export type MainWireFiveWallFreeCalciumDriveV1 = Readonly<{
  freeCalciumUMByWall: MainWireFiveWallRecordV1<number>;
}>;

export type MainWireFiveWallMaterialEvaluationV1<TWallState> = Readonly<{
  state: TWallState;
  fiberLogStrain: number;
  fiberKirchhoffStressPa: number;
  /** Active-only Kirchhoff stress used by the coronary IMP coupling. */
  activeFiberKirchhoffStressPa: number;
  /** Consistent d(tau_fiber)/d(log fiber strain) for this trial state. */
  algorithmicFiberTangentPa: number;
  /** Active-only consistent d(tau_active)/d(log fiber strain). */
  activeFiberAlgorithmicTangentPa: number;
  /**
   * Optional local antiderivative of the algorithmic trial-stress map. This is
   * diagnostic only and is never called stored or thermodynamic energy.
   */
  algorithmicStressPrimitiveDensityJPerM3?: number;
  iterationCount: number;
  residualNorm: number;
  finite: boolean;
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
  readback: WholeHeartMechanicsSerializableValueV1 | null;
}>;

/**
 * Adapter boundary for the separately owned Moyer/Land/SLS material. The
 * provider never inspects or updates the material state itself.
 */
export type MainWireFiveWallLandSlsMaterialKernelV1<TWallState> = Readonly<{
  modelId: string;
  parameterSetId: string;
  parameterIdentityHash: string;
  topology:
    "Land-active-plus-equilibrium-passive-plus-parallel-one-state-SLS";
  stateCodec: WholeHeartMechanicsStateCodecV1<TWallState>;
  /**
   * A trusted kernel may consume the provider-owned accepted wall state
   * read-only. Defensive kernels continue to receive a fresh codec clone.
   */
  acceptedStateInputMode: "defensive-clone" | "trusted-read-only";
  /**
   * An exclusive result state is newly owned by that evaluation and is never
   * reused or mutated by the kernel after return.
   */
  evaluationStateOwnershipMode: "defensive-clone" | "exclusive-result";
  initializeColdAtFixedInput(input: Readonly<{
    fiberLogStrain: number;
    freeCalciumUM: number;
  }>): MainWireFiveWallMaterialEvaluationV1<TWallState>;
  evaluateTrialFromAccepted(input: Readonly<{
    previousAcceptedState: TWallState;
    candidateFiberLogStrain: number;
    candidateFreeCalciumUM: number;
    stepDtSec: number;
  }>): MainWireFiveWallMaterialEvaluationV1<TWallState>;
  /**
   * Optional model-owned hot path. It must return the identical constitutive
   * state, stresses and tangents as `evaluateTrialFromAccepted`, but may omit
   * presentation/audit readback that rejected outer Newton candidates never
   * consume.
   */
  evaluateNumericalTrialFromAccepted?(input: Readonly<{
    previousAcceptedState: TWallState;
    candidateFiberLogStrain: number;
    candidateFreeCalciumUM: number;
    stepDtSec: number;
  }>): MainWireFiveWallMaterialEvaluationV1<TWallState>;
}>;

export type MainWireAtrialOneFiberGeometryParamsV1 = Readonly<{
  wallMaterialVolumeM3: number;
  referenceCavityBloodVolumeM3: number;
}>;

export type MainWireFiveWallInternalSolverOptionsV1 = Readonly<{
  maximumIterations?: number;
  scaledResidualInfinityTolerance?: number;
  scaledUpdateInfinityTolerance?: number;
  strictStabilityEigenvalueByOneJ?: number;
  maximumLineSearchBacktracks?: number;
  junctionRadiusLowerBoundM?: number;
  coldConsistencyMaximumIterations?: number;
  coldConsistencyScaledCoordinateTolerance?: number;
  coldMaterialResidualTolerance?: number;
}>;

export type MainWireFiveWallLandTriSegProviderParamsV1<TWallState> = Readonly<{
  parameterSetId: string;
  materialByWall:
    MainWireFiveWallRecordV1<MainWireFiveWallLandSlsMaterialKernelV1<TWallState>>;
  atria: Readonly<{
    LA: MainWireAtrialOneFiberGeometryParamsV1;
    RA: MainWireAtrialOneFiberGeometryParamsV1;
  }>;
  trisegWalls: TriSegWallRecordV1<TriSegWallGeometryParametersV1>;
  initialTriSegCoordinates: TriSegCoordinatesV1;
  internalCoordinateScales: TriSegCoordinatesV1;
  solver?: MainWireFiveWallInternalSolverOptionsV1;
}>;

export type MainWireFiveWallLandTriSegStateV1<TWallState> = Readonly<{
  wallStateByWall: MainWireFiveWallRecordV1<TWallState>;
  trisegCoordinates: TriSegCoordinatesV1;
}>;

export type MainWireFiveWallScaledAlgorithmicJacobianByOneJV1 =
  readonly (readonly number[])[];

export type MainWireFiveWallLandTriSegReadbackV1 = Readonly<{
  providerModelId: typeof MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID;
  solveMode: "cold" | "trial";
  hiddenBloodVolumeMl: 0;
  pistonVolumeApplied: false;
  internalCoordinates: Readonly<{
    septalMidwallCapVolumeM3: number;
    junctionRadiusM: number;
  }>;
  effectiveFiberLogStrainByWall: MainWireFiveWallRecordV1<number>;
  fiberKirchhoffStressPaByWall: MainWireFiveWallRecordV1<number>;
  algorithmicStressPrimitiveJByWall: MainWireFiveWallRecordV1<number | null>;
  totalAlgorithmicStressPrimitiveJ: number | null;
  rawAlgorithmicGeneralizedForce: Readonly<{
    septalMidwallCapVolumePa: number;
    junctionRadiusN: number;
  }>;
  scaledAlgorithmicGeneralizedForceByOneJ: readonly number[];
  scaledAlgorithmicJacobianByOneJ:
    MainWireFiveWallScaledAlgorithmicJacobianByOneJV1;
  jacobianDerivativeSource: "analytic-triseg-hessian";
  jacobianAntisymmetricMaximumAbsoluteByOneJ: number;
  jacobianAntisymmetricRelative: number;
  jacobianSymmetricWithinTolerance: boolean;
  symmetricJacobianMinimumEigenvalueByOneJ: number;
  strictLocalStableEquilibrium: boolean;
  materialIterationCount: number;
  maximumMaterialResidualNorm: number;
  coldConsistencyIterations: number | null;
  coldConsistencyScaledCoordinateUpdate: number | null;
  evaluationCounters?: MainWireFiveWallLandTriSegEvaluationCountersV1;
  ventricularCoronaryBoundaryTangent?:
    MainWireFiveWallVentricularCoronaryBoundaryTangentV1;
  triseg: Readonly<{
    leftVentricularPressurePa: number;
    rightVentricularPressurePa: number;
  }>;
  wallMaterialReadbackByWall:
    MainWireFiveWallRecordV1<WholeHeartMechanicsSerializableValueV1 | null>;
  claim: typeof MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM;
}>;

export type MainWireFiveWallLandTriSegEvaluationCountersV1 = Readonly<{
  solveInternalCoordinatesCallCount: 1;
  evaluateCandidateCallCount: number;
  atrialMaterialEvaluationCountByWall: Readonly<{
    LA: number;
    RA: number;
  }>;
  atrialFiberLogStrainObservationCountByWall: Readonly<{
    LA: number;
    RA: number;
  }>;
  atrialFiberLogStrainChangeCountByWall: Readonly<{
    LA: number;
    RA: number;
  }>;
  atrialFiberLogStrainDistinctInputCountByWall: Readonly<{
    LA: number;
    RA: number;
  }>;
}>;

export type MainWireFiveWallLandTriSegProviderV1<TWallState> =
  WholeHeartMechanicsProviderV1<
    MainWireFiveWallLandTriSegStateV1<TWallState>,
    MainWireFiveWallFreeCalciumDriveV1
  >;

export const MAIN_WIRE_FIVE_WALL_NUMERICAL_MECHANICS_STEP_V1_ID =
  "main-wire-five-wall-numerical-mechanics-step-v1" as const;

/**
 * Opaque, one-accepted-step numerical mechanics context.
 *
 * This token is deliberately narrower than the public whole-heart mechanics
 * contract. It may be prepared only from a provider instance minted by this
 * module, and its private accepted snapshot never crosses the WeakMap
 * boundary. Rejected nonlinear candidates therefore avoid public trial
 * wrappers, serialization and readback parsing. The selected root is still
 * materialized through the ordinary checked contract before durable commit.
 */
export type MainWireFiveWallNumericalMechanicsStepV1<TState> = Readonly<{
  numericalStepId: typeof MAIN_WIRE_FIVE_WALL_NUMERICAL_MECHANICS_STEP_V1_ID;
  providerId: typeof MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID;
  parameterIdentityHash: string;
  candidateTimeSec: number;
  stepDtSec: number;
  /** Invariant type only; the value is never present at runtime. */
  readonly __stateType?: TState;
}>;

export type MainWireFiveWallNumericalMechanicsEvaluationV1<TState> =
  Readonly<{
    candidateMaterialState: TState;
    candidateVolumesMl: WholeHeartMechanicsChamberValuesV1;
    transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
    transmuralPressureVolumeTangentMmHgPerMl?:
      WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
    effectiveFiberLogStrainByWall: MainWireFiveWallRecordV1<number>;
    activeFiberKirchhoffStressPaByWall: MainWireFiveWallRecordV1<number>;
    ventricularCoronaryBoundaryTangent?:
      MainWireFiveWallVentricularCoronaryBoundaryTangentV1;
    iterationCount: number;
    residualNorm: number;
    evaluationCounters?: MainWireFiveWallLandTriSegEvaluationCountersV1;
  }>;

type ErasedNumericalMechanicsEvaluationV1 =
  MainWireFiveWallNumericalMechanicsEvaluationV1<unknown>;

type ErasedNumericalProviderFactoryV1 = Readonly<{
  prepare(input: Readonly<{
    previousAcceptedMaterialState: unknown;
    candidateTimeSec: number;
    stepDtSec: number;
    drivingInputs: MainWireFiveWallFreeCalciumDriveV1;
  }>): Readonly<{
    evaluate(
      candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
    ): ErasedNumericalMechanicsEvaluationV1;
  }>;
}>;

const NUMERICAL_PROVIDER_FACTORIES_V1 =
  new WeakMap<object, ErasedNumericalProviderFactoryV1>();

const NUMERICAL_STEP_INTERNALS_V1 = new WeakMap<
  object,
  Readonly<{
    evaluate(
      candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
    ): ErasedNumericalMechanicsEvaluationV1;
  }>
>();

type ResolvedSolverOptionsV1 = Required<MainWireFiveWallInternalSolverOptionsV1>;

type CandidateEvaluationV1<TWallState> = Readonly<{
  volumesMl: WholeHeartMechanicsChamberValuesV1;
  /**
   * Public/cold evaluations materialize an owned state immediately. Numerical
   * candidates keep this null and materialize only the converged result.
   */
  state: MainWireFiveWallLandTriSegStateV1<TWallState> | null;
  internalCoordinates: TriSegCoordinatesV1;
  geometry: TriSegGeometryV1;
  triseg: EnergyConjugateTriSegEvaluationV1;
  materialByWall: MainWireFiveWallRecordV1<
    MainWireFiveWallMaterialEvaluationV1<TWallState>
  >;
  effectiveFiberLogStrainByWall: MainWireFiveWallRecordV1<number>;
  fiberKirchhoffStressPaByWall: MainWireFiveWallRecordV1<number>;
  algorithmicStressPrimitiveJByWall: MainWireFiveWallRecordV1<number | null>;
  totalAlgorithmicStressPrimitiveJ: number | null;
  rawAlgorithmicGeneralizedForce: Readonly<{
    septalMidwallCapVolumePa: number;
    junctionRadiusN: number;
  }>;
  scaledAlgorithmicGeneralizedForceByOneJ: readonly number[];
  transmuralPressuresMmHg: WholeHeartMechanicsChamberValuesV1;
  materialIterationCount: number;
  maximumMaterialResidualNorm: number;
}>;

type InternalSolveSuccessV1<TWallState> = Readonly<{
  converged: true;
  candidate: CandidateEvaluationV1<TWallState>;
  scaledUnknowns: readonly number[];
  scaledAlgorithmicJacobianByOneJ:
    MainWireFiveWallScaledAlgorithmicJacobianByOneJV1;
  jacobianDerivativeSource: "analytic-triseg-hessian";
  jacobianAntisymmetricMaximumAbsoluteByOneJ: number;
  jacobianAntisymmetricRelative: number;
  jacobianSymmetricWithinTolerance: boolean;
  symmetricJacobianMinimumEigenvalueByOneJ: number;
  strictLocalStableEquilibrium: true;
  iterations: number;
  acceptedLineSearchSteps: number;
  lineSearchBacktracks: number;
  residualNorm: number;
  evaluationCounters?: MainWireFiveWallLandTriSegEvaluationCountersV1;
}>;

type InternalSolveFailureV1<TWallState> = Readonly<{
  converged: false;
  reason:
    | "invalid-initial-state"
    | "analytic-jacobian-failed"
    | "singular-jacobian"
    | "line-search-failed"
    | "maximum-iterations"
    | "algorithmic-force-jacobian-not-symmetric"
    | "stationary-point-not-strict-local-stable-equilibrium";
  message: string;
  rollbackCandidate: CandidateEvaluationV1<TWallState> | null;
  lastCandidate: CandidateEvaluationV1<TWallState> | null;
  iterations: number;
  acceptedLineSearchSteps: number;
  lineSearchBacktracks: number;
  residualNorm: number;
}>;

type InternalSolveResultV1<TWallState> =
  | InternalSolveSuccessV1<TWallState>
  | InternalSolveFailureV1<TWallState>;

type EvaluationModeV1<TWallState> =
  | Readonly<{ kind: "cold" }>
  | Readonly<{
    kind: "trial";
    previousState: MainWireFiveWallLandTriSegStateV1<TWallState>;
    stepDtSec: number;
    materialEvaluationMode?: "public" | "numerical";
  }>;

type AtrialWallIdV1 = "LA" | "RA";

type TrialAtrialMaterialReuseKeyV1<TWallState> = Readonly<{
  previousAcceptedState: TWallState;
  candidateFiberLogStrain: number;
  candidateFreeCalciumUM: number;
  stepDtSec: number;
}>;

type TrialAtrialMaterialReuseEntryV1<TWallState> = Readonly<{
  key: TrialAtrialMaterialReuseKeyV1<TWallState>;
  evaluation: MainWireFiveWallMaterialEvaluationV1<TWallState>;
}>;

type TrialAtrialMaterialReuseV1<TWallState> = {
  LA: TrialAtrialMaterialReuseEntryV1<TWallState> | null;
  RA: TrialAtrialMaterialReuseEntryV1<TWallState> | null;
};

type MutableEvaluationCountersV1 = {
  evaluateCandidateCallCount: number;
  atrialMaterialEvaluationCountByWall: { LA: number; RA: number };
  atrialFiberLogStrainObservationCountByWall: { LA: number; RA: number };
  atrialFiberLogStrainChangeCountByWall: { LA: number; RA: number };
  atrialFiberLogStrainDistinctInputsByWall: {
    LA: Set<number>;
    RA: Set<number>;
  };
  lastAtrialFiberLogStrainByWall: {
    LA: number | null;
    RA: number | null;
  };
};

const PA_PER_MMHG = 133.322;
const ONE_JOULE = 1;
const STATE_SCHEMA_VERSION = 2;
const DEFAULT_SOLVER: ResolvedSolverOptionsV1 = Object.freeze({
  maximumIterations: 48,
  scaledResidualInfinityTolerance: 1e-9,
  scaledUpdateInfinityTolerance: 1e-11,
  strictStabilityEigenvalueByOneJ: 1e-10,
  maximumLineSearchBacktracks: 28,
  junctionRadiusLowerBoundM: 1e-5,
  coldConsistencyMaximumIterations: 6,
  coldConsistencyScaledCoordinateTolerance: 1e-10,
  coldMaterialResidualTolerance: 1e-9,
});

export function createMainWireFiveWallLandTriSegProviderV1<TWallState>(
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
): MainWireFiveWallLandTriSegProviderV1<TWallState> {
  const solver = resolveSolverOptions(params.solver);
  validateParams(params, solver);
  const parameterIdentityHash = providerParameterIdentityHash(params, solver);
  const parameterIdentityInputsAreImmutable =
    providerParameterIdentityInputsAreImmutableV1(params, solver);
  const stateCodec = createStateCodec(params.materialByWall);

  const initializeCold: MainWireFiveWallLandTriSegProviderV1<TWallState>["initializeCold"] =
    (input) => {
      if (!parameterIdentityInputsAreImmutable) {
        assertEffectiveParameterIdentity(params, solver, parameterIdentityHash);
      }
      validateDrive(input.drivingInputs);
      validateVolumes(input.volumesMl);
      const initialUnknowns = coordinatesToScaledUnknowns(
        params.initialTriSegCoordinates,
        params,
      );
      const initialCandidate = evaluateCandidate(
        input.volumesMl,
        input.drivingInputs,
        initialUnknowns,
        { kind: "cold" },
        params,
        solver,
      );
      let seed = initialUnknowns;
      let lastSolve: InternalSolveResultV1<TWallState> | null = null;
      let lastCoordinateUpdate = Number.POSITIVE_INFINITY;
      let coldConsistencyIterations = 0;

      for (
        let consistency = 0;
        consistency < solver.coldConsistencyMaximumIterations;
        consistency += 1
      ) {
        const solved = solveInternalCoordinates(
          input.volumesMl,
          input.drivingInputs,
          seed,
          { kind: "cold" },
          params,
          solver,
        );
        lastSolve = solved;
        coldConsistencyIterations = consistency + 1;
        if (solved.converged === false) {
          return failedProviderEvaluation(
            requireMaterializedCandidateStateV1(initialCandidate),
            initialCandidate.transmuralPressuresMmHg,
            solved,
            "cold",
            coldConsistencyIterations,
            Number.isFinite(lastCoordinateUpdate) ? lastCoordinateUpdate : null,
          );
        }
        lastCoordinateUpdate = maximumDifference(seed, solved.scaledUnknowns);
        seed = solved.scaledUnknowns;
        if (
          consistency >= 1
          && lastCoordinateUpdate <= solver.coldConsistencyScaledCoordinateTolerance
          && solved.candidate.maximumMaterialResidualNorm
            <= solver.coldMaterialResidualTolerance
        ) {
          return successfulProviderEvaluation(
            solved,
            "cold",
            coldConsistencyIterations,
            lastCoordinateUpdate,
            params,
          );
        }
      }

      if (lastSolve === null || lastSolve.converged === true) {
        const failure = internalFailure<TWallState>({
          reason: "maximum-iterations",
          message: "cold consistency iteration did not settle",
          rollbackCandidate: initialCandidate,
          lastCandidate: lastSolve?.converged ? lastSolve.candidate : initialCandidate,
          iterations: lastSolve?.converged ? lastSolve.iterations : 0,
          acceptedLineSearchSteps:
            lastSolve?.converged ? lastSolve.acceptedLineSearchSteps : 0,
          lineSearchBacktracks:
            lastSolve?.converged ? lastSolve.lineSearchBacktracks : 0,
          residualNorm: lastSolve?.converged
            ? lastSolve.residualNorm
            : Number.MAX_VALUE,
        });
        return failedProviderEvaluation(
          requireMaterializedCandidateStateV1(initialCandidate),
          initialCandidate.transmuralPressuresMmHg,
          failure,
          "cold",
          coldConsistencyIterations,
          Number.isFinite(lastCoordinateUpdate) ? lastCoordinateUpdate : null,
        );
      }
      return failedProviderEvaluation(
        requireMaterializedCandidateStateV1(initialCandidate),
        initialCandidate.transmuralPressuresMmHg,
        lastSolve,
        "cold",
        coldConsistencyIterations,
        Number.isFinite(lastCoordinateUpdate) ? lastCoordinateUpdate : null,
      );
    };

  const evaluateTrial: MainWireFiveWallLandTriSegProviderV1<TWallState>["evaluateTrial"] =
    (input) => {
      if (!parameterIdentityInputsAreImmutable) {
        assertEffectiveParameterIdentity(params, solver, parameterIdentityHash);
      }
      validateDrive(input.drivingInputs);
      validateVolumes(input.candidateVolumesMl);
      requirePositive(input.stepDtSec, "stepDtSec");
      // The whole-heart contract owns one private accepted snapshot for this
      // prepared step. This provider explicitly promises read-only access to
      // it; each material kernel separately declares whether it needs a wall
      // clone. Re-cloning the five-wall aggregate for every outer candidate
      // adds no isolation for these trusted kernels.
      const previous = input.previousAcceptedState.materialState;
      const initialUnknowns = coordinatesToScaledUnknowns(
        previous.trisegCoordinates,
        params,
      );
      const solved = solveInternalCoordinates(
        input.candidateVolumesMl,
        input.drivingInputs,
        initialUnknowns,
        { kind: "trial", previousState: previous, stepDtSec: input.stepDtSec },
        params,
        solver,
      );
      if (solved.converged === false) {
        return failedProviderEvaluation(
          // Failure results obey the same exclusive-result ownership contract
          // even when the trusted prepared snapshot was used as solver input.
          stateCodec.clone(previous),
          zeroChambers(),
          solved,
          "trial",
          null,
          null,
        );
      }
      return successfulProviderEvaluation(
        solved,
        "trial",
        null,
        null,
        params,
      );
    };

  const provider = Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
    parameterSetId: params.parameterSetId,
    parameterIdentityHash,
    stateSchemaVersion: STATE_SCHEMA_VERSION,
    stateCodec,
    acceptedStateInputMode:
      "trusted-read-only-prepared-snapshot" as const,
    evaluationResultOwnershipMode: "exclusive-result" as const,
    initializeCold,
    evaluateTrial,
  });
  NUMERICAL_PROVIDER_FACTORIES_V1.set(provider, Object.freeze({
    prepare: (input) => {
      if (!parameterIdentityInputsAreImmutable) {
        assertEffectiveParameterIdentity(params, solver, parameterIdentityHash);
      }
      requireFinite(input.candidateTimeSec, "candidateTimeSec");
      requirePositive(input.stepDtSec, "stepDtSec");
      validateDrive(input.drivingInputs);
      const previous = stateCodec.clone(
        input.previousAcceptedMaterialState as
          MainWireFiveWallLandTriSegStateV1<TWallState>,
      );
      const drive = input.drivingInputs;
      const initialUnknowns = coordinatesToScaledUnknowns(
        previous.trisegCoordinates,
        params,
      );
      return Object.freeze({
        evaluate: (candidateVolumesMl) => {
          validateVolumes(candidateVolumesMl);
          const solved = solveInternalCoordinates(
            candidateVolumesMl,
            drive,
            initialUnknowns,
            {
              kind: "trial",
              previousState: previous,
              stepDtSec: input.stepDtSec,
              materialEvaluationMode: "numerical",
            },
            params,
            solver,
          );
          if (solved.converged === false) {
            throw new Error(
              `five-wall numerical mechanics candidate failed: ${solved.message}`,
            );
          }
          return numericalMechanicsEvaluationFromSolveV1(
            candidateVolumesMl,
            solved,
            params,
          ) as ErasedNumericalMechanicsEvaluationV1;
        },
      });
    },
  }));
  return provider;
}

/**
 * Attempts the model-owned numerical candidate path. Unsupported mechanics
 * providers return null and continue through the generic checked contract.
 */
export function tryPrepareMainWireFiveWallNumericalMechanicsStepV1<TState>(
  provider: WholeHeartMechanicsProviderV1<
    TState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  input: Readonly<{
    previousAcceptedMaterialState: TState;
    candidateTimeSec: number;
    stepDtSec: number;
    drivingInputs: MainWireFiveWallFreeCalciumDriveV1;
  }>,
): MainWireFiveWallNumericalMechanicsStepV1<TState> | null {
  const factory = NUMERICAL_PROVIDER_FACTORIES_V1.get(provider);
  if (factory === undefined) return null;
  const internals = factory.prepare(input);
  const step: MainWireFiveWallNumericalMechanicsStepV1<TState> = Object.freeze({
    numericalStepId: MAIN_WIRE_FIVE_WALL_NUMERICAL_MECHANICS_STEP_V1_ID,
    providerId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
    parameterIdentityHash: provider.parameterIdentityHash,
    candidateTimeSec: input.candidateTimeSec,
    stepDtSec: input.stepDtSec,
  });
  NUMERICAL_STEP_INTERNALS_V1.set(step, internals);
  return step;
}

/** Model-owned candidate evaluation; no public trial or serialized readback. */
export function evaluateMainWireFiveWallNumericalMechanicsCandidateV1<TState>(
  step: MainWireFiveWallNumericalMechanicsStepV1<TState>,
  candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
): MainWireFiveWallNumericalMechanicsEvaluationV1<TState> {
  if (
    step.numericalStepId
      !== MAIN_WIRE_FIVE_WALL_NUMERICAL_MECHANICS_STEP_V1_ID
  ) {
    throw new Error("unsupported numerical mechanics step identity");
  }
  const internals = NUMERICAL_STEP_INTERNALS_V1.get(step);
  if (internals === undefined) {
    throw new Error("numerical mechanics step was not minted by this runtime");
  }
  return internals.evaluate(candidateVolumesMl) as
    MainWireFiveWallNumericalMechanicsEvaluationV1<TState>;
}

function numericalMechanicsEvaluationFromSolveV1<TWallState>(
  candidateVolumesMl: WholeHeartMechanicsChamberValuesV1,
  solved: InternalSolveSuccessV1<TWallState>,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
): MainWireFiveWallNumericalMechanicsEvaluationV1<
  MainWireFiveWallLandTriSegStateV1<TWallState>
> {
  let consistentTangent: ConsistentMechanicsTangentV1 | undefined;
  try {
    consistentTangent =
      consistentTransmuralPressureVolumeTangentMmHgPerMl(solved, params);
  } catch {
    consistentTangent = undefined;
  }
  return Object.freeze({
    candidateMaterialState: materializeCandidateStateV1(
      solved.candidate,
      params,
      "trial",
    ),
    candidateVolumesMl: solved.candidate.volumesMl,
    transmuralPressuresMmHg: solved.candidate.transmuralPressuresMmHg,
    ...(consistentTangent === undefined
      ? {}
      : {
        transmuralPressureVolumeTangentMmHgPerMl:
          consistentTangent.transmuralPressureVolumeTangentMmHgPerMl,
        ventricularCoronaryBoundaryTangent:
          consistentTangent.ventricularCoronaryBoundaryTangent,
      }),
    effectiveFiberLogStrainByWall:
      solved.candidate.effectiveFiberLogStrainByWall,
    activeFiberKirchhoffStressPaByWall: fiveWallRecord((wallId) =>
      solved.candidate.materialByWall[wallId].activeFiberKirchhoffStressPa),
    iterationCount: solved.iterations,
    residualNorm: solved.residualNorm,
    ...(solved.evaluationCounters === undefined
      ? {}
      : { evaluationCounters: solved.evaluationCounters }),
  });
}

function solveInternalCoordinates<TWallState>(
  volumesMl: WholeHeartMechanicsChamberValuesV1,
  drive: MainWireFiveWallFreeCalciumDriveV1,
  initialScaledUnknowns: readonly number[],
  mode: EvaluationModeV1<TWallState>,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
  solver: ResolvedSolverOptionsV1,
): InternalSolveResultV1<TWallState> {
  let current = [...initialScaledUnknowns];
  let currentCandidate: CandidateEvaluationV1<TWallState>;
  let acceptedLineSearchSteps = 0;
  let lineSearchBacktracks = 0;
  const evaluationCounters =
    (drive as MainWireFiveWallFreeCalciumDriveV1 & Readonly<{
      evaluationCounterCollection?: "enabled";
    }>).evaluationCounterCollection === "enabled"
      ? createMutableEvaluationCounters()
      : null;
  // Reuse is deliberately private to one trial-mode TriSeg solve. Cold
  // consistency has different state semantics, and widening this lifetime
  // across solves would make separate whole-heart candidates share a result.
  const trialAtrialMaterialReuse: TrialAtrialMaterialReuseV1<TWallState> | null =
    mode.kind === "trial" ? { LA: null, RA: null } : null;
  try {
    currentCandidate = evaluateCandidate(
      volumesMl,
      drive,
      current,
      mode,
      params,
      solver,
      evaluationCounters,
      trialAtrialMaterialReuse,
    );
  } catch (error) {
    return internalFailure({
      reason: "invalid-initial-state",
      message: errorMessage(error),
      rollbackCandidate: null,
      lastCandidate: null,
      iterations: 0,
      acceptedLineSearchSteps,
      lineSearchBacktracks,
      residualNorm: Number.MAX_VALUE,
    });
  }
  const rollbackCandidate = currentCandidate;

  for (let iteration = 0; iteration <= solver.maximumIterations; iteration += 1) {
    const residualNorm = infinityNorm(
      currentCandidate.scaledAlgorithmicGeneralizedForceByOneJ,
    );
    if (residualNorm <= solver.scaledResidualInfinityTolerance) {
      let jacobian: MainWireFiveWallScaledAlgorithmicJacobianByOneJV1;
      try {
        jacobian = analyticScaledInternalJacobian(
          currentCandidate,
          params,
        );
      } catch (error) {
        return internalFailure({
          reason: "analytic-jacobian-failed",
          message: errorMessage(error),
          rollbackCandidate,
          lastCandidate: currentCandidate,
          iterations: iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
        });
      }
      const stability = evaluateAlgorithmicJacobianStability(
        jacobian,
        solver,
      );
      if (!stability.jacobianSymmetricWithinTolerance) {
        return internalFailure({
          reason: "algorithmic-force-jacobian-not-symmetric",
          message:
            "analytic algorithmic generalized-force Hessian lost symmetry",
          rollbackCandidate,
          lastCandidate: currentCandidate,
          iterations: iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
        });
      }
      if (!stability.strictLocalStableEquilibrium) {
        return internalFailure({
          reason: "stationary-point-not-strict-local-stable-equilibrium",
          message:
            "internal stationary point is not a strict local stable algorithmic equilibrium",
          rollbackCandidate,
          lastCandidate: currentCandidate,
          iterations: iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
        });
      }
      return Object.freeze({
        converged: true as const,
        candidate: currentCandidate,
        scaledUnknowns: Object.freeze([...current]),
        scaledAlgorithmicJacobianByOneJ: jacobian,
        jacobianDerivativeSource: "analytic-triseg-hessian" as const,
        ...stability,
        strictLocalStableEquilibrium: true as const,
        iterations: iteration,
        acceptedLineSearchSteps,
        lineSearchBacktracks,
        residualNorm,
        ...(evaluationCounters === null
          ? {}
          : {
            evaluationCounters:
              freezeEvaluationCounters(evaluationCounters),
          }),
      });
    }
    if (iteration === solver.maximumIterations) {
      return internalFailure({
        reason: "maximum-iterations",
        message: "internal Newton solve reached its iteration limit",
        rollbackCandidate,
        lastCandidate: currentCandidate,
        iterations: iteration,
        acceptedLineSearchSteps,
        lineSearchBacktracks,
        residualNorm,
      });
    }

    let jacobian: MainWireFiveWallScaledAlgorithmicJacobianByOneJV1;
    try {
      jacobian = analyticScaledInternalJacobian(
        currentCandidate,
        params,
      );
    } catch (error) {
      return internalFailure({
        reason: "analytic-jacobian-failed",
        message: errorMessage(error),
        rollbackCandidate,
        lastCandidate: currentCandidate,
        iterations: iteration,
        acceptedLineSearchSteps,
        lineSearchBacktracks,
        residualNorm,
      });
    }
    const update = solveLinearSystem(
      jacobian,
      currentCandidate.scaledAlgorithmicGeneralizedForceByOneJ,
    )
      ?.map((value) => -value) ?? null;
    if (update === null) {
      return internalFailure({
        reason: "singular-jacobian",
        message: "scaled internal Newton Jacobian is singular or ill-conditioned",
        rollbackCandidate,
        lastCandidate: currentCandidate,
        iterations: iteration,
        acceptedLineSearchSteps,
        lineSearchBacktracks,
        residualNorm,
      });
    }
    if (infinityNorm(update) <= solver.scaledUpdateInfinityTolerance) {
      return internalFailure({
        reason: "singular-jacobian",
        message: "internal Newton update stagnated above residual tolerance",
        rollbackCandidate,
        lastCandidate: currentCandidate,
        iterations: iteration,
        acceptedLineSearchSteps,
        lineSearchBacktracks,
        residualNorm,
      });
    }

    let accepted: Readonly<{
      scaled: readonly number[];
      candidate: CandidateEvaluationV1<TWallState>;
    }> | null = null;
    let stepLength = 1;
    for (
      let backtrack = 0;
      backtrack <= solver.maximumLineSearchBacktracks;
      backtrack += 1
    ) {
      const trial = current.map((value, index) =>
        value + stepLength * update[index]!);
      try {
        const candidate = evaluateCandidate(
          volumesMl,
          drive,
          trial,
          mode,
          params,
          solver,
          evaluationCounters,
          trialAtrialMaterialReuse,
        );
        const candidateNorm = infinityNorm(
          candidate.scaledAlgorithmicGeneralizedForceByOneJ,
        );
        if (candidateNorm <= (1 - 1e-4 * stepLength) * residualNorm) {
          accepted = Object.freeze({
            scaled: Object.freeze([...trial]),
            candidate,
          });
          break;
        }
      } catch {
        // Candidate left the admissible TriSeg/material domain. Backtrack.
      }
      stepLength *= 0.5;
      lineSearchBacktracks += 1;
    }
    if (accepted === null) {
      return internalFailure({
        reason: "line-search-failed",
        message: "damped Newton could not find a residual-decreasing admissible step",
        rollbackCandidate,
        lastCandidate: currentCandidate,
        iterations: iteration,
        acceptedLineSearchSteps,
        lineSearchBacktracks,
        residualNorm,
      });
    }
    current = [...accepted.scaled];
    currentCandidate = accepted.candidate;
    acceptedLineSearchSteps += 1;
  }
  throw new Error("unreachable internal Newton state");
}

function createMutableEvaluationCounters(): MutableEvaluationCountersV1 {
  return {
    evaluateCandidateCallCount: 0,
    atrialMaterialEvaluationCountByWall: { LA: 0, RA: 0 },
    atrialFiberLogStrainObservationCountByWall: { LA: 0, RA: 0 },
    atrialFiberLogStrainChangeCountByWall: { LA: 0, RA: 0 },
    atrialFiberLogStrainDistinctInputsByWall: {
      LA: new Set<number>(),
      RA: new Set<number>(),
    },
    lastAtrialFiberLogStrainByWall: { LA: null, RA: null },
  };
}

function recordAtrialFiberLogStrain(
  counters: MutableEvaluationCountersV1,
  wallId: "LA" | "RA",
  value: number,
): void {
  counters.atrialFiberLogStrainObservationCountByWall[wallId] += 1;
  const previous = counters.lastAtrialFiberLogStrainByWall[wallId];
  if (previous !== null && value !== previous) {
    counters.atrialFiberLogStrainChangeCountByWall[wallId] += 1;
  }
  counters.lastAtrialFiberLogStrainByWall[wallId] = value;
  counters.atrialFiberLogStrainDistinctInputsByWall[wallId].add(value);
}

function freezeEvaluationCounters(
  counters: MutableEvaluationCountersV1,
): MainWireFiveWallLandTriSegEvaluationCountersV1 {
  return Object.freeze({
    solveInternalCoordinatesCallCount: 1 as const,
    evaluateCandidateCallCount: counters.evaluateCandidateCallCount,
    atrialMaterialEvaluationCountByWall: Object.freeze({
      ...counters.atrialMaterialEvaluationCountByWall,
    }),
    atrialFiberLogStrainObservationCountByWall: Object.freeze({
      ...counters.atrialFiberLogStrainObservationCountByWall,
    }),
    atrialFiberLogStrainChangeCountByWall: Object.freeze({
      ...counters.atrialFiberLogStrainChangeCountByWall,
    }),
    atrialFiberLogStrainDistinctInputCountByWall: Object.freeze({
      LA: counters.atrialFiberLogStrainDistinctInputsByWall.LA.size,
      RA: counters.atrialFiberLogStrainDistinctInputsByWall.RA.size,
    }),
  });
}

function evaluateCandidate<TWallState>(
  volumesMl: WholeHeartMechanicsChamberValuesV1,
  drive: MainWireFiveWallFreeCalciumDriveV1,
  scaledUnknowns: readonly number[],
  mode: EvaluationModeV1<TWallState>,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
  solver: ResolvedSolverOptionsV1,
  evaluationCounters: MutableEvaluationCountersV1 | null = null,
  trialAtrialMaterialReuse:
    TrialAtrialMaterialReuseV1<TWallState> | null = null,
): CandidateEvaluationV1<TWallState> {
  if (evaluationCounters !== null) {
    evaluationCounters.evaluateCandidateCallCount += 1;
  }
  validateScaledUnknownCount(scaledUnknowns);
  const coordinates = scaledUnknownsToCoordinates(scaledUnknowns, params);
  if (!(coordinates.junctionRadiusM > solver.junctionRadiusLowerBoundM)) {
    throw new Error("junction radius left its strict admissible domain");
  }
  const geometry = evaluateTriSegGeometryV1({
    leftVentricularCavityVolumeM3: volumesMl.LV * 1e-6,
    rightVentricularCavityVolumeM3: volumesMl.RV * 1e-6,
    coordinates,
    walls: params.trisegWalls,
  });
  const atrialBaseStrain = Object.freeze({
    LA: atrialFiberLogStrain(volumesMl.LA * 1e-6, params.atria.LA),
    RA: atrialFiberLogStrain(volumesMl.RA * 1e-6, params.atria.RA),
  });
  if (evaluationCounters !== null) {
    recordAtrialFiberLogStrain(
      evaluationCounters,
      "LA",
      atrialBaseStrain.LA,
    );
    recordAtrialFiberLogStrain(
      evaluationCounters,
      "RA",
      atrialBaseStrain.RA,
    );
  }
  const effectiveFiberLogStrainByWall = Object.freeze({
    LA: atrialBaseStrain.LA,
    LVFW: geometry.walls.LVFW.fiberLogStrain,
    SEP: geometry.walls.SEP.fiberLogStrain,
    RVFW: geometry.walls.RVFW.fiberLogStrain,
    RA: atrialBaseStrain.RA,
  });
  const materialByWall = fiveWallRecord((wallId) => {
    const kernel = params.materialByWall[wallId];
    const fiberLogStrain = effectiveFiberLogStrainByWall[wallId];
    const freeCalciumUM = drive.freeCalciumUMByWall[wallId];
    const evaluation = mode.kind === "cold"
      ? kernel.initializeColdAtFixedInput({ fiberLogStrain, freeCalciumUM })
      : wallId === "LA" || wallId === "RA"
        ? evaluateTrialAtrialMaterialWithReuse(
          wallId,
          kernel,
          mode.previousState.wallStateByWall[wallId],
          fiberLogStrain,
          freeCalciumUM,
          mode.stepDtSec,
          trialAtrialMaterialReuse,
          evaluationCounters,
          mode.materialEvaluationMode === "numerical",
        )
        : (mode.materialEvaluationMode === "numerical"
            && kernel.evaluateNumericalTrialFromAccepted !== undefined
          ? kernel.evaluateNumericalTrialFromAccepted
          : kernel.evaluateTrialFromAccepted)({
          // Every constitutive evaluation receives a fresh clone of exactly the
          // same accepted wall state. Candidate order therefore cannot advance
          // or contaminate constitutive history.
          previousAcceptedState: materialAcceptedStateForEvaluationV1(
            kernel,
            mode.previousState.wallStateByWall[wallId],
          ),
          candidateFiberLogStrain: fiberLogStrain,
          candidateFreeCalciumUM: freeCalciumUM,
          stepDtSec: mode.stepDtSec,
        });
    if (
      mode.kind === "cold"
      && evaluationCounters !== null
      && (wallId === "LA" || wallId === "RA")
    ) {
      evaluationCounters.atrialMaterialEvaluationCountByWall[wallId] += 1;
    }
    validateMaterialEvaluation(evaluation, fiberLogStrain, wallId);
    return evaluation;
  });
  const fiberKirchhoffStressPaByWall = fiveWallRecord((wallId) =>
    materialByWall[wallId].fiberKirchhoffStressPa);
  const triseg = evaluateEnergyConjugateTriSegV1({
    geometry,
    fiberKirchhoffStressPaByWall: Object.freeze({
      LVFW: fiberKirchhoffStressPaByWall.LVFW,
      SEP: fiberKirchhoffStressPaByWall.SEP,
      RVFW: fiberKirchhoffStressPaByWall.RVFW,
    }),
  });
  const wallVolumeM3ByWall = fiveWallRecord((wallId) => wallId === "LA"
    ? params.atria.LA.wallMaterialVolumeM3
    : wallId === "RA"
      ? params.atria.RA.wallMaterialVolumeM3
      : params.trisegWalls[wallId].wallMaterialVolumeM3);
  const algorithmicStressPrimitiveJByWall = fiveWallRecord((wallId) => {
    const primitive =
      materialByWall[wallId].algorithmicStressPrimitiveDensityJPerM3;
    return primitive === undefined ? null : wallVolumeM3ByWall[wallId] * primitive;
  });
  const allPrimitivesAvailable = MAIN_WIRE_FIVE_WALL_IDS_V1.every((wallId) =>
    algorithmicStressPrimitiveJByWall[wallId] !== null);
  const totalAlgorithmicStressPrimitiveJ = allPrimitivesAvailable
    ? sumFiveWalls((wallId) => algorithmicStressPrimitiveJByWall[wallId]!)
    : null;
  const rawAlgorithmicGeneralizedForce = Object.freeze({
    septalMidwallCapVolumePa:
      triseg.membraneGeneralizedForce.septalMidwallCapVolumePa,
    junctionRadiusN: triseg.membraneGeneralizedForce.junctionRadiusN,
  });
  const scaledAlgorithmicGeneralizedForceByOneJ = Object.freeze([
    rawAlgorithmicGeneralizedForce.septalMidwallCapVolumePa
      * params.internalCoordinateScales.septalMidwallCapVolumeM3 / ONE_JOULE,
    rawAlgorithmicGeneralizedForce.junctionRadiusN
      * params.internalCoordinateScales.junctionRadiusM / ONE_JOULE,
  ]);
  const leftAtrialPressurePa = atrialPressurePa(
    volumesMl.LA * 1e-6,
    params.atria.LA,
    fiberKirchhoffStressPaByWall.LA,
  );
  const rightAtrialPressurePa = atrialPressurePa(
    volumesMl.RA * 1e-6,
    params.atria.RA,
    fiberKirchhoffStressPaByWall.RA,
  );
  const transmuralPressuresMmHg = Object.freeze({
    LA: leftAtrialPressurePa / PA_PER_MMHG,
    LV: triseg.cavityTransmuralPressuresPa.LV / PA_PER_MMHG,
    RA: rightAtrialPressurePa / PA_PER_MMHG,
    RV: triseg.cavityTransmuralPressuresPa.RV / PA_PER_MMHG,
  });
  const materialIterationCount = sumFiveWalls((wallId) =>
    materialByWall[wallId].iterationCount);
  const maximumMaterialResidualNorm = Math.max(...MAIN_WIRE_FIVE_WALL_IDS_V1.map(
    (wallId) => materialByWall[wallId].residualNorm,
  ));
  assertFiniteNumbers({
    materialIterationCount,
    maximumMaterialResidualNorm,
    ...transmuralPressuresMmHg,
  });
  if (totalAlgorithmicStressPrimitiveJ !== null) {
    requireFinite(
      totalAlgorithmicStressPrimitiveJ,
      "totalAlgorithmicStressPrimitiveJ",
    );
  }
  const state = mode.kind === "trial"
      && mode.materialEvaluationMode === "numerical"
    ? null
    : materializeCandidateStateV1(
      Object.freeze({ materialByWall, internalCoordinates: coordinates }),
      params,
      mode.kind,
    );
  return Object.freeze({
    volumesMl: Object.freeze({ ...volumesMl }),
    state,
    internalCoordinates: coordinates,
    geometry,
    triseg,
    materialByWall,
    effectiveFiberLogStrainByWall,
    fiberKirchhoffStressPaByWall,
    algorithmicStressPrimitiveJByWall,
    totalAlgorithmicStressPrimitiveJ,
    rawAlgorithmicGeneralizedForce,
    scaledAlgorithmicGeneralizedForceByOneJ,
    transmuralPressuresMmHg,
    materialIterationCount,
    maximumMaterialResidualNorm,
  });
}

function materializeCandidateStateV1<TWallState>(
  candidate: Readonly<{
    materialByWall: MainWireFiveWallRecordV1<
      MainWireFiveWallMaterialEvaluationV1<TWallState>
    >;
    internalCoordinates: TriSegCoordinatesV1;
  }>,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
  solveMode: "cold" | "trial",
): MainWireFiveWallLandTriSegStateV1<TWallState> {
  return Object.freeze({
    // Atrial reuse hits share one private evaluation across the internal
    // TriSeg candidates. Public trial materialization therefore keeps the
    // previous defensive-clone rule. Model-owned numerical candidates delay
    // this work until the converged root rather than cloning at every probe.
    wallStateByWall: fiveWallRecord((wallId) => {
      const kernel = params.materialByWall[wallId];
      const canRetainExclusiveResult =
        kernel.evaluationStateOwnershipMode === "exclusive-result"
        && (
          solveMode === "cold"
          || (wallId !== "LA" && wallId !== "RA")
        );
      return canRetainExclusiveResult
        ? candidate.materialByWall[wallId].state
        : kernel.stateCodec.clone(candidate.materialByWall[wallId].state);
    }),
    trisegCoordinates: Object.freeze({ ...candidate.internalCoordinates }),
  });
}

function requireMaterializedCandidateStateV1<TWallState>(
  candidate: CandidateEvaluationV1<TWallState>,
): MainWireFiveWallLandTriSegStateV1<TWallState> {
  if (candidate.state === null) {
    throw new Error("public mechanics candidate state was not materialized");
  }
  return candidate.state;
}

function evaluateTrialAtrialMaterialWithReuse<TWallState>(
  wallId: AtrialWallIdV1,
  kernel: MainWireFiveWallLandSlsMaterialKernelV1<TWallState>,
  previousAcceptedState: TWallState,
  candidateFiberLogStrain: number,
  candidateFreeCalciumUM: number,
  stepDtSec: number,
  reuse: TrialAtrialMaterialReuseV1<TWallState> | null,
  evaluationCounters: MutableEvaluationCountersV1 | null,
  numerical: boolean,
): MainWireFiveWallMaterialEvaluationV1<TWallState> {
  if (reuse === null) {
    throw new Error("trial atrial material reuse is unavailable");
  }
  /*
   * `evaluateTrialFromAccepted` has exactly four candidate-varying inputs, and
   * all four are present in this key: previousAcceptedState,
   * candidateFiberLogStrain, candidateFreeCalciumUM and stepDtSec. That is
   * complete because the cache is private to one wall (fixing the kernel and
   * its parameters) and one solve; the internal TriSeg coordinates are not an
   * atrial-kernel input, while their only possible atrial consequence, fiber
   * strain, is keyed explicitly.
   */
  const key = Object.freeze({
    previousAcceptedState,
    candidateFiberLogStrain,
    candidateFreeCalciumUM,
    stepDtSec,
  });
  const cached = reuse[wallId];
  if (cached !== null && trialAtrialMaterialReuseKeysMatch(cached.key, key)) {
    return cached.evaluation;
  }
  if (evaluationCounters !== null) {
    evaluationCounters.atrialMaterialEvaluationCountByWall[wallId] += 1;
  }
  const evaluateTrial = numerical
      && kernel.evaluateNumericalTrialFromAccepted !== undefined
    ? kernel.evaluateNumericalTrialFromAccepted
    : kernel.evaluateTrialFromAccepted;
  const evaluation = evaluateTrial({
    // Keep the constitutive isolation guarantee on a cache miss: the kernel
    // never receives the accepted wall object held by this solve.
    previousAcceptedState: materialAcceptedStateForEvaluationV1(
      kernel,
      previousAcceptedState,
    ),
    candidateFiberLogStrain,
    candidateFreeCalciumUM,
    stepDtSec,
  });
  validateMaterialEvaluation(evaluation, candidateFiberLogStrain, wallId);
  reuse[wallId] = Object.freeze({ key, evaluation });
  return evaluation;
}

function trialAtrialMaterialReuseKeysMatch<TWallState>(
  left: TrialAtrialMaterialReuseKeyV1<TWallState>,
  right: TrialAtrialMaterialReuseKeyV1<TWallState>,
): boolean {
  return left.previousAcceptedState === right.previousAcceptedState
    && Object.is(
      left.candidateFiberLogStrain,
      right.candidateFiberLogStrain,
    )
    && Object.is(
      left.candidateFreeCalciumUM,
      right.candidateFreeCalciumUM,
    )
    && Object.is(left.stepDtSec, right.stepDtSec);
}

function materialAcceptedStateForEvaluationV1<TWallState>(
  kernel: MainWireFiveWallLandSlsMaterialKernelV1<TWallState>,
  previousAcceptedState: TWallState,
): TWallState {
  return kernel.acceptedStateInputMode === "trusted-read-only"
    ? previousAcceptedState
    : kernel.stateCodec.clone(previousAcceptedState);
}

type VentricularMaterialTangentsV1 = Readonly<{
  LVFW: number;
  SEP: number;
  RVFW: number;
}>;

function ventricularMaterialTangents<TWallState>(
  center: CandidateEvaluationV1<TWallState>,
): VentricularMaterialTangentsV1 {
  const wallIds = ["LVFW", "SEP", "RVFW"] as const;
  const tangentByWall = {} as Record<(typeof wallIds)[number], number>;
  for (const wallId of wallIds) {
    const tangent = center.materialByWall[wallId].algorithmicFiberTangentPa;
    requireFinite(tangent, `${wallId}.algorithmicFiberTangentPa`);
    tangentByWall[wallId] = tangent;
  }
  return Object.freeze(tangentByWall);
}

type TriSegAlgorithmicHessianV1 = readonly (readonly number[])[];
type ConsistentMechanicsTangentV1 = Readonly<{
  transmuralPressureVolumeTangentMmHgPerMl:
    WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1;
  ventricularCoronaryBoundaryTangent:
    MainWireFiveWallVentricularCoronaryBoundaryTangentV1;
}>;

/**
 * Exact Hessian of the center trial's algorithmic stress primitive in physical
 * generalized coordinates [V_L, V_R, V_S, y]. Each wall contributes
 *
 *   V_wall (C_alg grad(e) grad(e)^T + tau Hessian(e)).
 *
 * Writing the mirrored entry from the same computed scalar makes symmetry a
 * construction invariant rather than a finite-difference audit.
 */
function analyticTriSegAlgorithmicHessian<TWallState>(
  center: CandidateEvaluationV1<TWallState>,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
): TriSegAlgorithmicHessianV1 {
  const tangentByWall = ventricularMaterialTangents(center);
  const hessian = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  const capVolumeGradientByWall = {
    LVFW: [-1, 0, 1] as const,
    SEP: [0, 0, 1] as const,
    RVFW: [0, 1, 1] as const,
  };
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    const first = center.triseg.wallDerivativeByWall[wallId];
    const second = evaluateTriSegWallSecondDerivativeV1(
      center.geometry.walls[wallId],
    );
    const capGradient = capVolumeGradientByWall[wallId];
    const strainGradient = [
      capGradient[0] * first.dFiberLogStrainDCapVolumePerM3,
      capGradient[1] * first.dFiberLogStrainDCapVolumePerM3,
      capGradient[2] * first.dFiberLogStrainDCapVolumePerM3,
      first.dFiberLogStrainDJunctionRadiusPerM,
    ] as const;
    const wallVolumeM3 = params.trisegWalls[wallId].wallMaterialVolumeM3;
    const stressPa = center.fiberKirchhoffStressPaByWall[wallId];
    const tangentPa = tangentByWall[wallId];
    for (let row = 0; row < 4; row += 1) {
      for (let column = row; column < 4; column += 1) {
        let strainSecondDerivative: number;
        if (row === 3 && column === 3) {
          strainSecondDerivative =
            second.d2FiberLogStrainDJunctionRadius2PerM2;
        } else if (column === 3) {
          strainSecondDerivative =
            capGradient[row]!
            * second
              .d2FiberLogStrainDCapVolumeDJunctionRadiusPerM4;
        } else {
          strainSecondDerivative =
            capGradient[row]!
            * capGradient[column]!
            * second.d2FiberLogStrainDCapVolume2PerM6;
        }
        const contribution = wallVolumeM3 * (
          tangentPa * strainGradient[row]! * strainGradient[column]!
          + stressPa * strainSecondDerivative
        );
        hessian[row]![column] += contribution;
        if (row !== column) hessian[column]![row] += contribution;
      }
    }
  }
  if (!hessian.flat().every(Number.isFinite)) {
    throw new Error("analytic TriSeg algorithmic Hessian is non-finite");
  }
  return Object.freeze(hessian.map((row) => Object.freeze(row)));
}

function analyticScaledInternalJacobian<TWallState>(
  center: CandidateEvaluationV1<TWallState>,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
): MainWireFiveWallScaledAlgorithmicJacobianByOneJV1 {
  const hessian = analyticTriSegAlgorithmicHessian(center, params);
  const scales = [
    params.internalCoordinateScales.septalMidwallCapVolumeM3,
    params.internalCoordinateScales.junctionRadiusM,
  ] as const;
  const j00 = hessian[2]![2]! * scales[0] * scales[0] / ONE_JOULE;
  const j01 = hessian[2]![3]! * scales[0] * scales[1] / ONE_JOULE;
  const j11 = hessian[3]![3]! * scales[1] * scales[1] / ONE_JOULE;
  return Object.freeze([
    Object.freeze([j00, j01]),
    Object.freeze([j01, j11]),
  ]);
}

/**
 * Linearizes the two ventricular cavity pressures and two internal equilibrium
 * equations together, then eliminates the internal TriSeg coordinates by the
 * Schur complement. The returned four-chamber map is transmural only.
 */
function consistentTransmuralPressureVolumeTangentMmHgPerMl<TWallState>(
  solved: InternalSolveSuccessV1<TWallState>,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
): ConsistentMechanicsTangentV1 | undefined {
  const center = solved.candidate;
  const leftAtrialTangent =
    center.materialByWall.LA.algorithmicFiberTangentPa;
  const rightAtrialTangent =
    center.materialByWall.RA.algorithmicFiberTangentPa;
  if (
    !Number.isFinite(leftAtrialTangent)
    || !Number.isFinite(rightAtrialTangent)
  ) return undefined;
  const hessian = analyticTriSegAlgorithmicHessian(center, params);
  const coordinateScales = [
    params.internalCoordinateScales.septalMidwallCapVolumeM3,
    params.internalCoordinateScales.junctionRadiusM,
  ] as const;

  const ventricularPressureTangent = Array.from(
    { length: 2 },
    () => [0, 0],
  );
  const ventricularWallIds = ["LVFW", "SEP", "RVFW"] as const;
  const capVolumeGradientByWall = {
    LVFW: [-1, 0, 1] as const,
    SEP: [0, 0, 1] as const,
    RVFW: [0, 1, 1] as const,
  };
  const fiberStrainTangent = Object.fromEntries(
    ventricularWallIds.map((wallId) => [wallId, [0, 0]]),
  ) as Record<MainWireFiveWallVentricularWallIdV1, number[]>;
  const activeStressTangent = Object.fromEntries(
    ventricularWallIds.map((wallId) => [wallId, [0, 0]]),
  ) as Record<MainWireFiveWallVentricularWallIdV1, number[]>;
  for (let volumeColumn = 0; volumeColumn < 2; volumeColumn += 1) {
    const forceColumn = [0, 1].map((coordinateRow) =>
      hessian[coordinateRow + 2]![volumeColumn]!
      * coordinateScales[coordinateRow]!
      * 1e-6
      / ONE_JOULE);
    const coordinateResponse = solveLinearSystem(
      solved.scaledAlgorithmicJacobianByOneJ,
      forceColumn,
    );
    if (coordinateResponse === null) return undefined;
    for (let pressureRow = 0; pressureRow < 2; pressureRow += 1) {
      const pressureCoordinateDerivative = [0, 1].reduce(
        (sum, coordinateColumn) => sum
          + hessian[pressureRow]![coordinateColumn + 2]!
          * coordinateScales[coordinateColumn]!
          / PA_PER_MMHG
          * coordinateResponse[coordinateColumn]!,
        0,
      );
      ventricularPressureTangent[pressureRow]![volumeColumn] =
        hessian[pressureRow]![volumeColumn]! * 1e-6 / PA_PER_MMHG
        - pressureCoordinateDerivative;
    }
    for (const wallId of ventricularWallIds) {
      const first = center.triseg.wallDerivativeByWall[wallId];
      const capGradient = capVolumeGradientByWall[wallId];
      const directDerivativePerMl =
        capGradient[volumeColumn]!
        * first.dFiberLogStrainDCapVolumePerM3
        * 1e-6;
      const coordinateDerivativePerMl =
        capGradient[2]
        * first.dFiberLogStrainDCapVolumePerM3
        * coordinateScales[0]
        * coordinateResponse[0]!
        + first.dFiberLogStrainDJunctionRadiusPerM
        * coordinateScales[1]
        * coordinateResponse[1]!;
      const strainDerivativePerMl =
        directDerivativePerMl - coordinateDerivativePerMl;
      fiberStrainTangent[wallId]![volumeColumn] =
        strainDerivativePerMl;
      activeStressTangent[wallId]![volumeColumn] =
        center.materialByWall[wallId].activeFiberAlgorithmicTangentPa
        * strainDerivativePerMl;
    }
  }

  const leftAtrialPressureTangent = atrialPressureVolumeTangentMmHgPerMl(
    center.volumesMl.LA,
    params.atria.LA,
    center.fiberKirchhoffStressPaByWall.LA,
    leftAtrialTangent,
  );
  const rightAtrialPressureTangent = atrialPressureVolumeTangentMmHgPerMl(
    center.volumesMl.RA,
    params.atria.RA,
    center.fiberKirchhoffStressPaByWall.RA,
    rightAtrialTangent,
  );
  const pressureTangent = Object.freeze({
    LA: Object.freeze({ LA: leftAtrialPressureTangent, LV: 0, RA: 0, RV: 0 }),
    LV: Object.freeze({
      LA: 0,
      LV: ventricularPressureTangent[0]![0]!,
      RA: 0,
      RV: ventricularPressureTangent[0]![1]!,
    }),
    RA: Object.freeze({ LA: 0, LV: 0, RA: rightAtrialPressureTangent, RV: 0 }),
    RV: Object.freeze({
      LA: 0,
      LV: ventricularPressureTangent[1]![0]!,
      RA: 0,
      RV: ventricularPressureTangent[1]![1]!,
    }),
  });
  const ventricularCoronaryBoundaryTangent = Object.freeze({
    effectiveFiberLogStrainPerMlByWall: Object.freeze(Object.fromEntries(
      ventricularWallIds.map((wallId) => [
        wallId,
        Object.freeze({
          LV: fiberStrainTangent[wallId]![0]!,
          RV: fiberStrainTangent[wallId]![1]!,
        }),
      ]),
    )) as Readonly<Record<
      MainWireFiveWallVentricularWallIdV1,
      MainWireFiveWallVentricularVolumeColumnsV1
    >>,
    landActiveKirchhoffStressPaPerMlByWall: Object.freeze(Object.fromEntries(
      ventricularWallIds.map((wallId) => [
        wallId,
        Object.freeze({
          LV: activeStressTangent[wallId]![0]!,
          RV: activeStressTangent[wallId]![1]!,
        }),
      ]),
    )) as Readonly<Record<
      MainWireFiveWallVentricularWallIdV1,
      MainWireFiveWallVentricularVolumeColumnsV1
    >>,
  });
  const finite = [
    ...Object.values(pressureTangent).flatMap((row) => Object.values(row)),
    ...ventricularWallIds.flatMap((wallId) => [
      ...Object.values(
        ventricularCoronaryBoundaryTangent
          .effectiveFiberLogStrainPerMlByWall[wallId],
      ),
      ...Object.values(
        ventricularCoronaryBoundaryTangent
          .landActiveKirchhoffStressPaPerMlByWall[wallId],
      ),
    ]),
  ].every(Number.isFinite);
  return finite
    ? Object.freeze({
      transmuralPressureVolumeTangentMmHgPerMl: pressureTangent,
      ventricularCoronaryBoundaryTangent,
    })
    : undefined;
}

function atrialPressureVolumeTangentMmHgPerMl(
  cavityVolumeMl: number,
  params: MainWireAtrialOneFiberGeometryParamsV1,
  fiberKirchhoffStressPa: number,
  algorithmicFiberTangentPa: number,
): number {
  const midwallVolumeM3 = cavityVolumeMl * 1e-6
    + 0.5 * params.wallMaterialVolumeM3;
  const pressureTangentPaPerM3 = params.wallMaterialVolumeM3
    / (3 * midwallVolumeM3 * midwallVolumeM3)
    * (algorithmicFiberTangentPa / 3 - fiberKirchhoffStressPa);
  return pressureTangentPaPerM3 * 1e-6 / PA_PER_MMHG;
}

function successfulProviderEvaluation<TWallState>(
  solved: InternalSolveSuccessV1<TWallState>,
  solveMode: "cold" | "trial",
  coldConsistencyIterations: number | null,
  coldConsistencyScaledCoordinateUpdate: number | null,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
): WholeHeartMechanicsProviderEvaluationV1<
  MainWireFiveWallLandTriSegStateV1<TWallState>
> {
  let consistentTangent: ConsistentMechanicsTangentV1 | undefined;
  if (solveMode === "trial") {
    try {
      consistentTangent =
        consistentTransmuralPressureVolumeTangentMmHgPerMl(
          solved,
          params,
        );
    } catch {
      // The tangent is an optional acceleration contract. A valid center trial
      // remains valid if its analytic Hessian cannot be condensed.
      consistentTangent = undefined;
    }
  }
  const readback = buildReadback(
    solved,
    solveMode,
    coldConsistencyIterations,
    coldConsistencyScaledCoordinateUpdate,
    consistentTangent?.ventricularCoronaryBoundaryTangent,
  );
  const diagnostics: WholeHeartMechanicsDiagnosticsV1 = Object.freeze({
    converged: true,
    finite: true,
    iterationCount: solved.iterations,
    residualNorm: solved.residualNorm,
    errors: Object.freeze([]),
    warnings: Object.freeze(flattenMaterialWarnings(solved.candidate.materialByWall)),
    readback,
  });
  return Object.freeze({
    materialState: requireMaterializedCandidateStateV1(solved.candidate),
    transmuralPressuresMmHg: solved.candidate.transmuralPressuresMmHg,
    ...(consistentTangent === undefined
      ? {}
      : {
        transmuralPressureVolumeTangentMmHgPerMl:
          consistentTangent.transmuralPressureVolumeTangentMmHgPerMl,
      }),
    diagnostics,
  });
}

function failedProviderEvaluation<TWallState>(
  rollbackState: MainWireFiveWallLandTriSegStateV1<TWallState>,
  rollbackPressures: WholeHeartMechanicsChamberValuesV1,
  failure: InternalSolveFailureV1<TWallState>,
  solveMode: "cold" | "trial",
  coldConsistencyIterations: number | null,
  coldConsistencyScaledCoordinateUpdate: number | null,
): WholeHeartMechanicsProviderEvaluationV1<
  MainWireFiveWallLandTriSegStateV1<TWallState>
> {
  const fallback = failure.lastCandidate ?? failure.rollbackCandidate;
  const readback = Object.freeze({
    providerModelId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
    solveMode,
    failureReason: failure.reason,
    failureMessage: failure.message,
    hiddenBloodVolumeMl: 0,
    pistonVolumeApplied: false,
    rollbackOnFailure: true,
    coldConsistencyIterations,
    coldConsistencyScaledCoordinateUpdate,
    lastInternalCoordinates: fallback?.internalCoordinates ?? null,
    lastScaledAlgorithmicGeneralizedForceByOneJ:
      fallback?.scaledAlgorithmicGeneralizedForceByOneJ ?? null,
    lastRawAlgorithmicGeneralizedForce:
      fallback?.rawAlgorithmicGeneralizedForce ?? null,
    lastFiberKirchhoffStressPaByWall:
      fallback?.fiberKirchhoffStressPaByWall ?? null,
    lastMaximumMaterialResidualNorm:
      fallback?.maximumMaterialResidualNorm ?? null,
    claim: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM,
  });
  return Object.freeze({
    materialState: rollbackState,
    transmuralPressuresMmHg: Object.freeze({ ...rollbackPressures }),
    diagnostics: Object.freeze({
      converged: false,
      finite: fallback !== null,
      iterationCount: failure.iterations,
      residualNorm: finiteNonnegative(failure.residualNorm),
      errors: Object.freeze([failure.message]),
      warnings: Object.freeze([]),
      readback,
    }),
  });
}

function buildReadback<TWallState>(
  solved: InternalSolveSuccessV1<TWallState>,
  solveMode: "cold" | "trial",
  coldConsistencyIterations: number | null,
  coldConsistencyScaledCoordinateUpdate: number | null,
  ventricularCoronaryBoundaryTangent:
    MainWireFiveWallVentricularCoronaryBoundaryTangentV1 | undefined,
): MainWireFiveWallLandTriSegReadbackV1 {
  const candidate = solved.candidate;
  return Object.freeze({
    providerModelId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
    solveMode,
    hiddenBloodVolumeMl: 0 as const,
    pistonVolumeApplied: false as const,
    internalCoordinates: candidate.internalCoordinates,
    effectiveFiberLogStrainByWall: candidate.effectiveFiberLogStrainByWall,
    fiberKirchhoffStressPaByWall: candidate.fiberKirchhoffStressPaByWall,
    algorithmicStressPrimitiveJByWall:
      candidate.algorithmicStressPrimitiveJByWall,
    totalAlgorithmicStressPrimitiveJ:
      candidate.totalAlgorithmicStressPrimitiveJ,
    rawAlgorithmicGeneralizedForce: candidate.rawAlgorithmicGeneralizedForce,
    scaledAlgorithmicGeneralizedForceByOneJ:
      candidate.scaledAlgorithmicGeneralizedForceByOneJ,
    scaledAlgorithmicJacobianByOneJ:
      solved.scaledAlgorithmicJacobianByOneJ,
    jacobianDerivativeSource: solved.jacobianDerivativeSource,
    jacobianAntisymmetricMaximumAbsoluteByOneJ:
      solved.jacobianAntisymmetricMaximumAbsoluteByOneJ,
    jacobianAntisymmetricRelative: solved.jacobianAntisymmetricRelative,
    jacobianSymmetricWithinTolerance: solved.jacobianSymmetricWithinTolerance,
    symmetricJacobianMinimumEigenvalueByOneJ:
      solved.symmetricJacobianMinimumEigenvalueByOneJ,
    strictLocalStableEquilibrium: solved.strictLocalStableEquilibrium,
    materialIterationCount: candidate.materialIterationCount,
    maximumMaterialResidualNorm: candidate.maximumMaterialResidualNorm,
    coldConsistencyIterations,
    coldConsistencyScaledCoordinateUpdate,
    ...(solved.evaluationCounters === undefined
      ? {}
      : { evaluationCounters: solved.evaluationCounters }),
    ...(ventricularCoronaryBoundaryTangent === undefined
      ? {}
      : { ventricularCoronaryBoundaryTangent }),
    triseg: Object.freeze({
      leftVentricularPressurePa:
        candidate.triseg.cavityTransmuralPressuresPa.LV,
      rightVentricularPressurePa:
        candidate.triseg.cavityTransmuralPressuresPa.RV,
    }),
    wallMaterialReadbackByWall: fiveWallRecord((wallId) =>
      candidate.materialByWall[wallId].readback),
    claim: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM,
  });
}

function evaluateAlgorithmicJacobianStability(
  jacobian: MainWireFiveWallScaledAlgorithmicJacobianByOneJV1,
  solver: ResolvedSolverOptionsV1,
): Readonly<{
  jacobianAntisymmetricMaximumAbsoluteByOneJ: number;
  jacobianAntisymmetricRelative: number;
  jacobianSymmetricWithinTolerance: boolean;
  symmetricJacobianMinimumEigenvalueByOneJ: number;
  strictLocalStableEquilibrium: boolean;
}> {
  const n = jacobian.length;
  const symmetric = Array.from({ length: n }, (_, row) =>
    Array.from({ length: n }, (_, column) =>
      0.5 * (jacobian[row]![column]! + jacobian[column]![row]!)));
  let antisymmetricMaximum = 0;
  let jacobianInfinityNorm = 0;
  for (let row = 0; row < n; row += 1) {
    let rowSum = 0;
    for (let column = 0; column < n; column += 1) {
      antisymmetricMaximum = Math.max(
        antisymmetricMaximum,
        0.5 * Math.abs(
          jacobian[row]![column]! - jacobian[column]![row]!,
        ),
      );
      rowSum += Math.abs(jacobian[row]![column]!);
    }
    jacobianInfinityNorm = Math.max(jacobianInfinityNorm, rowSum);
  }
  const relative = antisymmetricMaximum
    / Math.max(Number.MIN_VALUE, jacobianInfinityNorm);
  const minimumEigenvalue = minimumEigenvalueSymmetric(symmetric);
  const symmetricWithinTolerance = antisymmetricMaximum === 0;
  return Object.freeze({
    jacobianAntisymmetricMaximumAbsoluteByOneJ: antisymmetricMaximum,
    jacobianAntisymmetricRelative: relative,
    jacobianSymmetricWithinTolerance: symmetricWithinTolerance,
    symmetricJacobianMinimumEigenvalueByOneJ: minimumEigenvalue,
    strictLocalStableEquilibrium: symmetricWithinTolerance
      && minimumEigenvalue > solver.strictStabilityEigenvalueByOneJ,
  });
}

function solveLinearSystem(
  matrix: MainWireFiveWallScaledAlgorithmicJacobianByOneJV1,
  rightHandSide: readonly number[],
): number[] | null {
  const n = rightHandSide.length;
  const augmented = Array.from({ length: n }, (_, row) => [
    ...matrix[row]!,
    rightHandSide[row]!,
  ]);
  const scale = Math.max(1, ...matrix.flat().map(Math.abs));
  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(augmented[row]![column]!)
        > Math.abs(augmented[pivot]![column]!)) pivot = row;
    }
    if (Math.abs(augmented[pivot]![column]!) <= 1e-13 * scale) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot]!, augmented[column]!];
    const pivotValue = augmented[column]![column]!;
    for (let entry = column; entry <= n; entry += 1) {
      augmented[column]![entry] /= pivotValue;
    }
    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = augmented[row]![column]!;
      for (let entry = column; entry <= n; entry += 1) {
        augmented[row]![entry] -= factor * augmented[column]![entry]!;
      }
    }
  }
  const solution = augmented.map((row) => row[n]!);
  return solution.every(Number.isFinite) ? solution : null;
}

function minimumEigenvalueSymmetric(matrix: readonly (readonly number[])[]): number {
  const n = matrix.length;
  const work = matrix.map((row) => [...row]);
  for (let sweep = 0; sweep < 32; sweep += 1) {
    let p = 0;
    let q = n > 1 ? 1 : 0;
    let maximum = 0;
    for (let row = 0; row < n; row += 1) {
      for (let column = row + 1; column < n; column += 1) {
        const value = Math.abs(work[row]![column]!);
        if (value > maximum) {
          maximum = value;
          p = row;
          q = column;
        }
      }
    }
    if (maximum <= 1e-13 * Math.max(1, ...work.flat().map(Math.abs))) break;
    const app = work[p]![p]!;
    const aqq = work[q]![q]!;
    const apq = work[p]![q]!;
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let row = 0; row < n; row += 1) {
      if (row === p || row === q) continue;
      const arp = work[row]![p]!;
      const arq = work[row]![q]!;
      work[row]![p] = cosine * arp - sine * arq;
      work[p]![row] = work[row]![p]!;
      work[row]![q] = sine * arp + cosine * arq;
      work[q]![row] = work[row]![q]!;
    }
    work[p]![p] = cosine * cosine * app
      - 2 * sine * cosine * apq
      + sine * sine * aqq;
    work[q]![q] = sine * sine * app
      + 2 * sine * cosine * apq
      + cosine * cosine * aqq;
    work[p]![q] = 0;
    work[q]![p] = 0;
  }
  return Math.min(...work.map((row, index) => row[index]!));
}

function createStateCodec<TWallState>(
  materialByWall:
    MainWireFiveWallRecordV1<MainWireFiveWallLandSlsMaterialKernelV1<TWallState>>,
): WholeHeartMechanicsStateCodecV1<MainWireFiveWallLandTriSegStateV1<TWallState>> {
  return Object.freeze({
    clone: (state) => cloneState(state, materialByWall),
    encode: (state) => Object.freeze({
      schemaVersion: STATE_SCHEMA_VERSION,
      wallStateByWall: Object.freeze(Object.fromEntries(
        MAIN_WIRE_FIVE_WALL_IDS_V1.map((wallId) => [
          wallId,
          materialByWall[wallId].stateCodec.encode(
            materialByWall[wallId].stateCodec.clone(state.wallStateByWall[wallId]),
          ),
        ]),
      )),
      trisegCoordinates: Object.freeze({ ...state.trisegCoordinates }),
    }),
    decode: (encoded) => {
      const record = requirePlainRecord(encoded, "encoded provider state");
      assertExactKeys(
        record,
        ["schemaVersion", "wallStateByWall", "trisegCoordinates"],
        "encoded provider state",
      );
      if (record.schemaVersion !== STATE_SCHEMA_VERSION) {
        throw new Error("encoded provider state schema version mismatch");
      }
      const walls = requirePlainRecord(record.wallStateByWall, "encoded wall states");
      assertExactKeys(walls, MAIN_WIRE_FIVE_WALL_IDS_V1, "encoded wall states");
      const coordinates = requirePlainRecord(
        record.trisegCoordinates,
        "encoded TriSeg coordinates",
      );
      assertExactKeys(
        coordinates,
        ["septalMidwallCapVolumeM3", "junctionRadiusM"],
        "encoded TriSeg coordinates",
      );
      const state = Object.freeze({
        wallStateByWall: fiveWallRecord((wallId) =>
          materialByWall[wallId].stateCodec.decode(walls[wallId]!)),
        trisegCoordinates: Object.freeze({
          septalMidwallCapVolumeM3: requireFinite(
            coordinates.septalMidwallCapVolumeM3,
            "encoded septalMidwallCapVolumeM3",
          ),
          junctionRadiusM: requirePositive(
            coordinates.junctionRadiusM,
            "encoded junctionRadiusM",
          ),
        }),
      });
      return cloneState(state, materialByWall);
    },
  });
}

function cloneState<TWallState>(
  state: MainWireFiveWallLandTriSegStateV1<TWallState>,
  materialByWall:
    MainWireFiveWallRecordV1<MainWireFiveWallLandSlsMaterialKernelV1<TWallState>>,
): MainWireFiveWallLandTriSegStateV1<TWallState> {
  validateStateShape(state);
  return Object.freeze({
    wallStateByWall: fiveWallRecord((wallId) =>
      materialByWall[wallId].stateCodec.clone(state.wallStateByWall[wallId])),
    trisegCoordinates: Object.freeze({ ...state.trisegCoordinates }),
  });
}

function providerParameterIdentityHash<TWallState>(
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
  solver: ResolvedSolverOptionsV1,
): string {
  return stableHash(sanitizeForStableHash({
    providerModelId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
    stateSchemaVersion: STATE_SCHEMA_VERSION,
    parameterSetId: params.parameterSetId,
    materialIdentityByWall: fiveWallRecord((wallId) => ({
      modelId: params.materialByWall[wallId].modelId,
      parameterSetId: params.materialByWall[wallId].parameterSetId,
      parameterIdentityHash: params.materialByWall[wallId].parameterIdentityHash,
    })),
    atria: params.atria,
    trisegWalls: params.trisegWalls,
    initialTriSegCoordinates: params.initialTriSegCoordinates,
    internalCoordinateScales: params.internalCoordinateScales,
    solver,
    fixedResidualEnergyScaleJ: ONE_JOULE,
  }));
}

function assertEffectiveParameterIdentity<TWallState>(
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
  solver: ResolvedSolverOptionsV1,
  expected: string,
): void {
  if (providerParameterIdentityHash(params, solver) !== expected) {
    throw new Error("effective provider parameters changed after construction");
  }
}

/**
 * The identity hash only reads the fields checked here. When every owning
 * object is frozen, re-hashing the same immutable parameter tree for every
 * nonlinear trial cannot detect a mutation and is pure hot-path overhead.
 * Mutable/custom providers deliberately retain the per-call fail-closed
 * identity audit above.
 */
function providerParameterIdentityInputsAreImmutableV1<TWallState>(
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
  solver: ResolvedSolverOptionsV1,
): boolean {
  if (
    !Object.isFrozen(params)
    || !Object.isFrozen(params.materialByWall)
    || !Object.isFrozen(params.atria)
    || !Object.isFrozen(params.atria.LA)
    || !Object.isFrozen(params.atria.RA)
    || !Object.isFrozen(params.trisegWalls)
    || !Object.isFrozen(params.initialTriSegCoordinates)
    || !Object.isFrozen(params.internalCoordinateScales)
    || !Object.isFrozen(solver)
  ) return false;
  for (const wallId of MAIN_WIRE_FIVE_WALL_IDS_V1) {
    if (!Object.isFrozen(params.materialByWall[wallId])) return false;
  }
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    if (!Object.isFrozen(params.trisegWalls[wallId])) return false;
  }
  return true;
}

function validateParams<TWallState>(
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
  solver: ResolvedSolverOptionsV1,
): void {
  requireNonEmpty(params.parameterSetId, "parameterSetId");
  assertExactKeys(params.materialByWall, MAIN_WIRE_FIVE_WALL_IDS_V1, "materialByWall");
  for (const wallId of MAIN_WIRE_FIVE_WALL_IDS_V1) {
    const material = params.materialByWall[wallId];
    requireNonEmpty(material.modelId, `${wallId}.material.modelId`);
    requireNonEmpty(material.parameterSetId, `${wallId}.material.parameterSetId`);
    requireNonEmpty(
      material.parameterIdentityHash,
      `${wallId}.material.parameterIdentityHash`,
    );
    if (
      material.topology
        !== "Land-active-plus-equilibrium-passive-plus-parallel-one-state-SLS"
    ) throw new Error(`${wallId} material does not satisfy the Land/SLS topology contract`);
    for (const method of ["clone", "encode", "decode"] as const) {
      if (typeof material.stateCodec[method] !== "function") {
        throw new Error(`${wallId}.material.stateCodec.${method} must be a function`);
      }
    }
    if (
      material.acceptedStateInputMode !== "defensive-clone"
      && material.acceptedStateInputMode !== "trusted-read-only"
    ) {
      throw new Error(`${wallId}.material.acceptedStateInputMode is invalid`);
    }
    if (
      material.evaluationStateOwnershipMode !== "defensive-clone"
      && material.evaluationStateOwnershipMode !== "exclusive-result"
    ) {
      throw new Error(
        `${wallId}.material.evaluationStateOwnershipMode is invalid`,
      );
    }
  }
  validateAtrialGeometry(params.atria.LA, "atria.LA");
  validateAtrialGeometry(params.atria.RA, "atria.RA");
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    requirePositive(
      params.trisegWalls[wallId].wallMaterialVolumeM3,
      `${wallId}.wallMaterialVolumeM3`,
    );
    requirePositive(
      params.trisegWalls[wallId].referenceMidwallAreaM2,
      `${wallId}.referenceMidwallAreaM2`,
    );
  }
  requireFinite(
    params.initialTriSegCoordinates.septalMidwallCapVolumeM3,
    "initial septalMidwallCapVolumeM3",
  );
  requirePositive(
    params.initialTriSegCoordinates.junctionRadiusM,
    "initial junctionRadiusM",
  );
  requirePositive(
    params.internalCoordinateScales.septalMidwallCapVolumeM3,
    "septalMidwallCapVolumeM3 scale",
  );
  requirePositive(
    params.internalCoordinateScales.junctionRadiusM,
    "junctionRadiusM scale",
  );
  if (!(params.initialTriSegCoordinates.junctionRadiusM
    > solver.junctionRadiusLowerBoundM)) {
    throw new Error("initial junction radius must exceed its strict lower bound");
  }
}

function validateMaterialEvaluation<TWallState>(
  evaluation: MainWireFiveWallMaterialEvaluationV1<TWallState>,
  expectedFiberLogStrain: number,
  wallId: MainWireFiveWallIdV1,
): void {
  if (!evaluation.valid || !evaluation.finite || evaluation.errors.length > 0) {
    throw new Error(
      `${wallId} material evaluation failed: ${evaluation.errors.join("; ")}`,
    );
  }
  if (!nearlyEqual(evaluation.fiberLogStrain, expectedFiberLogStrain, 1e-11)) {
    throw new Error(`${wallId} material returned a mismatched fiber strain`);
  }
  if (!Number.isInteger(evaluation.iterationCount) || evaluation.iterationCount < 0) {
    throw new Error(`${wallId} material iterationCount must be nonnegative integer`);
  }
  requireNonnegative(evaluation.residualNorm, `${wallId} material residualNorm`);
  assertFiniteNumbers({
    fiberKirchhoffStressPa: evaluation.fiberKirchhoffStressPa,
    activeFiberKirchhoffStressPa: evaluation.activeFiberKirchhoffStressPa,
  });
  if (evaluation.algorithmicStressPrimitiveDensityJPerM3 !== undefined) {
    requireFinite(
      evaluation.algorithmicStressPrimitiveDensityJPerM3,
      `${wallId}.algorithmicStressPrimitiveDensityJPerM3`,
    );
  }
  requireFinite(
    evaluation.algorithmicFiberTangentPa,
    `${wallId}.algorithmicFiberTangentPa`,
  );
  requireFinite(
    evaluation.activeFiberAlgorithmicTangentPa,
    `${wallId}.activeFiberAlgorithmicTangentPa`,
  );
}

function validateStateShape<TWallState>(
  state: MainWireFiveWallLandTriSegStateV1<TWallState>,
): void {
  assertExactKeys(state.wallStateByWall, MAIN_WIRE_FIVE_WALL_IDS_V1, "wallStateByWall");
  requireFinite(
    state.trisegCoordinates.septalMidwallCapVolumeM3,
    "state.septalMidwallCapVolumeM3",
  );
  requirePositive(
    state.trisegCoordinates.junctionRadiusM,
    "state.junctionRadiusM",
  );
}

function validateDrive(drive: MainWireFiveWallFreeCalciumDriveV1): void {
  assertExactKeys(
    drive.freeCalciumUMByWall,
    MAIN_WIRE_FIVE_WALL_IDS_V1,
    "freeCalciumUMByWall",
  );
  for (const wallId of MAIN_WIRE_FIVE_WALL_IDS_V1) {
    requireNonnegative(
      drive.freeCalciumUMByWall[wallId],
      `${wallId}.freeCalciumUM`,
    );
  }
}

function validateVolumes(volumes: WholeHeartMechanicsChamberValuesV1): void {
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    requireNonnegative(volumes[chamber], `${chamber} volume`);
  }
}

function resolveSolverOptions(
  options: MainWireFiveWallInternalSolverOptionsV1 | undefined,
): ResolvedSolverOptionsV1 {
  const resolved = Object.freeze({ ...DEFAULT_SOLVER, ...options });
  if (!Number.isInteger(resolved.maximumIterations) || resolved.maximumIterations <= 0) {
    throw new Error("maximumIterations must be a positive integer");
  }
  if (
    !Number.isInteger(resolved.maximumLineSearchBacktracks)
    || resolved.maximumLineSearchBacktracks < 0
  ) throw new Error("maximumLineSearchBacktracks must be a nonnegative integer");
  if (
    !Number.isInteger(resolved.coldConsistencyMaximumIterations)
    || resolved.coldConsistencyMaximumIterations < 2
  ) throw new Error("coldConsistencyMaximumIterations must be at least two");
  for (const [label, value] of Object.entries({
    scaledResidualInfinityTolerance: resolved.scaledResidualInfinityTolerance,
    scaledUpdateInfinityTolerance: resolved.scaledUpdateInfinityTolerance,
    strictStabilityEigenvalueByOneJ:
      resolved.strictStabilityEigenvalueByOneJ,
    junctionRadiusLowerBoundM: resolved.junctionRadiusLowerBoundM,
    coldConsistencyScaledCoordinateTolerance:
      resolved.coldConsistencyScaledCoordinateTolerance,
    coldMaterialResidualTolerance: resolved.coldMaterialResidualTolerance,
  })) requirePositive(value, label);
  return resolved;
}

function coordinatesToScaledUnknowns<TWallState>(
  coordinates: TriSegCoordinatesV1,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
): readonly number[] {
  return Object.freeze([
    coordinates.septalMidwallCapVolumeM3
      / params.internalCoordinateScales.septalMidwallCapVolumeM3,
    coordinates.junctionRadiusM
      / params.internalCoordinateScales.junctionRadiusM,
  ]);
}

function scaledUnknownsToCoordinates<TWallState>(
  scaled: readonly number[],
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
): TriSegCoordinatesV1 {
  return Object.freeze({
    septalMidwallCapVolumeM3:
      scaled[0]! * params.internalCoordinateScales.septalMidwallCapVolumeM3,
    junctionRadiusM:
      scaled[1]! * params.internalCoordinateScales.junctionRadiusM,
  });
}

function atrialFiberLogStrain(
  cavityVolumeM3: number,
  params: MainWireAtrialOneFiberGeometryParamsV1,
): number {
  requireNonnegative(cavityVolumeM3, "atrial cavity volume");
  const midwallVolumeM3 = cavityVolumeM3 + 0.5 * params.wallMaterialVolumeM3;
  const referenceMidwallVolumeM3 =
    params.referenceCavityBloodVolumeM3 + 0.5 * params.wallMaterialVolumeM3;
  return Math.log(midwallVolumeM3 / referenceMidwallVolumeM3) / 3;
}

function atrialPressurePa(
  cavityVolumeM3: number,
  params: MainWireAtrialOneFiberGeometryParamsV1,
  fiberKirchhoffStressPa: number,
): number {
  const midwallVolumeM3 = cavityVolumeM3 + 0.5 * params.wallMaterialVolumeM3;
  return params.wallMaterialVolumeM3
    * fiberKirchhoffStressPa / (3 * midwallVolumeM3);
}

function internalFailure<TWallState>(
  value: Omit<InternalSolveFailureV1<TWallState>, "converged">,
): InternalSolveFailureV1<TWallState> {
  return Object.freeze({ converged: false as const, ...value });
}

function flattenMaterialWarnings<TWallState>(
  material: MainWireFiveWallRecordV1<MainWireFiveWallMaterialEvaluationV1<TWallState>>,
): string[] {
  return MAIN_WIRE_FIVE_WALL_IDS_V1.flatMap((wallId) =>
    material[wallId].warnings.map((warning) => `${wallId}: ${warning}`));
}

function fiveWallRecord<T>(
  build: (wallId: MainWireFiveWallIdV1) => T,
): MainWireFiveWallRecordV1<T> {
  return Object.freeze({
    LA: build("LA"),
    LVFW: build("LVFW"),
    SEP: build("SEP"),
    RVFW: build("RVFW"),
    RA: build("RA"),
  });
}

function sumFiveWalls(build: (wallId: MainWireFiveWallIdV1) => number): number {
  return build("LA")
    + build("LVFW")
    + build("SEP")
    + build("RVFW")
    + build("RA");
}

function assertExactKeys(
  value: unknown,
  expected: readonly string[],
  label: string,
): asserts value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a record`);
  }
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) throw new Error(`${label} must contain exactly ${sortedExpected.join(", ")}`);
}

function requirePlainRecord(
  value: unknown,
  label: string,
): Record<string, WholeHeartMechanicsSerializableValueV1> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) throw new Error(`${label} must be a plain record`);
  return value as Record<string, WholeHeartMechanicsSerializableValueV1>;
}

function validateAtrialGeometry(
  params: MainWireAtrialOneFiberGeometryParamsV1,
  label: string,
): void {
  requirePositive(params.wallMaterialVolumeM3, `${label}.wallMaterialVolumeM3`);
  requirePositive(
    params.referenceCavityBloodVolumeM3,
    `${label}.referenceCavityBloodVolumeM3`,
  );
}

function validateScaledUnknownCount(
  scaled: readonly number[],
): void {
  const expected = 2;
  if (scaled.length !== expected || !scaled.every(Number.isFinite)) {
    throw new Error(`scaled internal unknowns must contain ${expected} finite values`);
  }
}

function maximumDifference(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;
  return Math.max(...left.map((value, index) => Math.abs(value - right[index]!)));
}

function infinityNorm(values: readonly number[]): number {
  return Math.max(0, ...values.map(Math.abs));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function zeroChambers(): WholeHeartMechanicsChamberValuesV1 {
  return Object.freeze({ LA: 0, LV: 0, RA: 0, RV: 0 });
}

function finiteNonnegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : Number.MAX_VALUE;
}

function nearlyEqual(left: number, right: number, tolerance: number): boolean {
  return Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right));
}

function assertFiniteNumbers(values: Readonly<Record<string, number>>): void {
  for (const [label, value] of Object.entries(values)) requireFinite(value, label);
}

function requireFinite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function requirePositive(value: unknown, label: string): number {
  const finite = requireFinite(value, label);
  if (!(finite > 0)) throw new Error(`${label} must be positive`);
  return finite;
}

function requireNonnegative(value: unknown, label: string): number {
  const finite = requireFinite(value, label);
  if (finite < 0) throw new Error(`${label} must be nonnegative`);
  return finite;
}

function requireNonEmpty(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
  return value;
}
