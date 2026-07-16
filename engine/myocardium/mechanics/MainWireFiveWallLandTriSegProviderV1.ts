import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  evaluateEnergyConjugateTriSegV1,
  evaluateTriSegGeometryV1,
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
  atrialGeometry: "fixed-wall-self-similar-one-fiber" as const,
  internalSolve: "simultaneous-scaled-damped-Newton" as const,
  internalUnknowns: Object.freeze(["V_m_S", "y_m"] as const),
  residual:
    "algorithmic-virtual-work-gradient-times-coordinate-scale-divided-by-one-joule" as const,
  finiteDifferenceJacobian: true as const,
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

export type MainWireFiveWallFreeCalciumDriveV1 = Readonly<{
  freeCalciumUMByWall: MainWireFiveWallRecordV1<number>;
}>;

export type MainWireFiveWallMaterialEvaluationV1<TWallState> = Readonly<{
  state: TWallState;
  fiberLogStrain: number;
  fiberKirchhoffStressPa: number;
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
}>;

export type MainWireAtrialOneFiberGeometryParamsV1 = Readonly<{
  wallMaterialVolumeM3: number;
  referenceCavityBloodVolumeM3: number;
}>;

export type MainWireFiveWallInternalSolverOptionsV1 = Readonly<{
  maximumIterations?: number;
  scaledResidualInfinityTolerance?: number;
  scaledUpdateInfinityTolerance?: number;
  finiteDifferenceScaledStep?: number;
  jacobianSymmetryRelativeTolerance?: number;
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
  jacobianFiniteDifferenceScaledStepUsed: number;
  jacobianAntisymmetricMaximumAbsoluteByOneJ: number;
  jacobianAntisymmetricRelative: number;
  jacobianSymmetricWithinTolerance: boolean;
  symmetricJacobianMinimumEigenvalueByOneJ: number;
  strictLocalStableEquilibrium: boolean;
  materialIterationCount: number;
  maximumMaterialResidualNorm: number;
  coldConsistencyIterations: number | null;
  coldConsistencyScaledCoordinateUpdate: number | null;
  triseg: Readonly<{
    leftVentricularPressurePa: number;
    rightVentricularPressurePa: number;
  }>;
  wallMaterialReadbackByWall:
    MainWireFiveWallRecordV1<WholeHeartMechanicsSerializableValueV1 | null>;
  claim: typeof MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_CLAIM;
}>;

export type MainWireFiveWallLandTriSegProviderV1<TWallState> =
  WholeHeartMechanicsProviderV1<
    MainWireFiveWallLandTriSegStateV1<TWallState>,
    MainWireFiveWallFreeCalciumDriveV1
  >;

type ResolvedSolverOptionsV1 = Required<MainWireFiveWallInternalSolverOptionsV1>;

type CandidateEvaluationV1<TWallState> = Readonly<{
  state: MainWireFiveWallLandTriSegStateV1<TWallState>;
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
  jacobianFiniteDifferenceScaledStepUsed: number;
  jacobianAntisymmetricMaximumAbsoluteByOneJ: number;
  jacobianAntisymmetricRelative: number;
  jacobianSymmetricWithinTolerance: boolean;
  symmetricJacobianMinimumEigenvalueByOneJ: number;
  strictLocalStableEquilibrium: true;
  iterations: number;
  acceptedLineSearchSteps: number;
  lineSearchBacktracks: number;
  residualNorm: number;
}>;

type InternalSolveFailureV1<TWallState> = Readonly<{
  converged: false;
  reason:
    | "invalid-initial-state"
    | "finite-difference-failed"
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
  }>;

const PA_PER_MMHG = 133.322;
const ONE_JOULE = 1;
const STATE_SCHEMA_VERSION = 2;
const DEFAULT_SOLVER: ResolvedSolverOptionsV1 = Object.freeze({
  maximumIterations: 48,
  scaledResidualInfinityTolerance: 1e-9,
  scaledUpdateInfinityTolerance: 1e-11,
  finiteDifferenceScaledStep: 2e-5,
  jacobianSymmetryRelativeTolerance: 2e-4,
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
  const stateCodec = createStateCodec(params.materialByWall);

  const initializeCold: MainWireFiveWallLandTriSegProviderV1<TWallState>["initializeCold"] =
    (input) => {
      assertEffectiveParameterIdentity(params, solver, parameterIdentityHash);
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
            initialCandidate.state,
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
          initialCandidate.state,
          initialCandidate.transmuralPressuresMmHg,
          failure,
          "cold",
          coldConsistencyIterations,
          Number.isFinite(lastCoordinateUpdate) ? lastCoordinateUpdate : null,
        );
      }
      return failedProviderEvaluation(
        initialCandidate.state,
        initialCandidate.transmuralPressuresMmHg,
        lastSolve,
        "cold",
        coldConsistencyIterations,
        Number.isFinite(lastCoordinateUpdate) ? lastCoordinateUpdate : null,
      );
    };

  const evaluateTrial: MainWireFiveWallLandTriSegProviderV1<TWallState>["evaluateTrial"] =
    (input) => {
      assertEffectiveParameterIdentity(params, solver, parameterIdentityHash);
      validateDrive(input.drivingInputs);
      validateVolumes(input.candidateVolumesMl);
      requirePositive(input.stepDtSec, "stepDtSec");
      const previous = stateCodec.clone(input.previousAcceptedState.materialState);
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
          previous,
          zeroChambers(),
          solved,
          "trial",
          null,
          null,
        );
      }
      return successfulProviderEvaluation(solved, "trial", null, null);
    };

  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
    parameterSetId: params.parameterSetId,
    parameterIdentityHash,
    stateSchemaVersion: STATE_SCHEMA_VERSION,
    stateCodec,
    initializeCold,
    evaluateTrial,
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
  try {
    currentCandidate = evaluateCandidate(
      volumesMl,
      drive,
      current,
      mode,
      params,
      solver,
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
      let audited: ReturnType<typeof finiteDifferenceJacobianWithSymmetryAudit>;
      try {
        audited = finiteDifferenceJacobianWithSymmetryAudit(
          (candidate) => evaluateCandidate(
            volumesMl,
            drive,
            candidate,
            mode,
            params,
            solver,
          ).scaledAlgorithmicGeneralizedForceByOneJ,
          current,
          solver,
        );
      } catch (error) {
        return internalFailure({
          reason: "finite-difference-failed",
          message: errorMessage(error),
          rollbackCandidate,
          lastCandidate: currentCandidate,
          iterations: iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
        });
      }
      const { jacobian, stability, stepUsed } = audited;
      if (!stability.jacobianSymmetricWithinTolerance) {
        return internalFailure({
          reason: "algorithmic-force-jacobian-not-symmetric",
          message:
            "finite-difference algorithmic generalized-force Jacobian is not symmetric: "
            + `relative antisymmetry ${stability.jacobianAntisymmetricRelative} `
            + `exceeds ${solver.jacobianSymmetryRelativeTolerance}; maximum absolute `
            + `${stability.jacobianAntisymmetricMaximumAbsoluteByOneJ} 1/J; `
            + `scaled step ${stepUsed}`,
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
        jacobianFiniteDifferenceScaledStepUsed: stepUsed,
        ...stability,
        strictLocalStableEquilibrium: true as const,
        iterations: iteration,
        acceptedLineSearchSteps,
        lineSearchBacktracks,
        residualNorm,
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
      jacobian = finiteDifferenceJacobian(
        (candidate) => evaluateCandidate(
          volumesMl,
          drive,
          candidate,
          mode,
          params,
          solver,
        ).scaledAlgorithmicGeneralizedForceByOneJ,
        current,
        solver.finiteDifferenceScaledStep,
      );
    } catch (error) {
      return internalFailure({
        reason: "finite-difference-failed",
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

function evaluateCandidate<TWallState>(
  volumesMl: WholeHeartMechanicsChamberValuesV1,
  drive: MainWireFiveWallFreeCalciumDriveV1,
  scaledUnknowns: readonly number[],
  mode: EvaluationModeV1<TWallState>,
  params: MainWireFiveWallLandTriSegProviderParamsV1<TWallState>,
  solver: ResolvedSolverOptionsV1,
): CandidateEvaluationV1<TWallState> {
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
      : kernel.evaluateTrialFromAccepted({
        // Every Newton/finite-difference candidate receives a fresh clone of
        // exactly the same accepted wall state. Candidate order therefore
        // cannot advance or contaminate constitutive history.
        previousAcceptedState: kernel.stateCodec.clone(
          mode.previousState.wallStateByWall[wallId],
        ),
        candidateFiberLogStrain: fiberLogStrain,
        candidateFreeCalciumUM: freeCalciumUM,
        stepDtSec: mode.stepDtSec,
      });
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
  const state = Object.freeze({
    wallStateByWall: fiveWallRecord((wallId) =>
      params.materialByWall[wallId].stateCodec.clone(materialByWall[wallId].state)),
    trisegCoordinates: Object.freeze({ ...coordinates }),
  });
  return Object.freeze({
    state,
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

function successfulProviderEvaluation<TWallState>(
  solved: InternalSolveSuccessV1<TWallState>,
  solveMode: "cold" | "trial",
  coldConsistencyIterations: number | null,
  coldConsistencyScaledCoordinateUpdate: number | null,
): WholeHeartMechanicsProviderEvaluationV1<
  MainWireFiveWallLandTriSegStateV1<TWallState>
> {
  const readback = buildReadback(
    solved,
    solveMode,
    coldConsistencyIterations,
    coldConsistencyScaledCoordinateUpdate,
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
    materialState: solved.candidate.state,
    transmuralPressuresMmHg: solved.candidate.transmuralPressuresMmHg,
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
    lastInternalCoordinates: fallback?.state.trisegCoordinates ?? null,
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
): MainWireFiveWallLandTriSegReadbackV1 {
  const candidate = solved.candidate;
  return Object.freeze({
    providerModelId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
    solveMode,
    hiddenBloodVolumeMl: 0 as const,
    pistonVolumeApplied: false as const,
    internalCoordinates: candidate.state.trisegCoordinates,
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
    jacobianFiniteDifferenceScaledStepUsed:
      solved.jacobianFiniteDifferenceScaledStepUsed,
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
  const symmetricWithinTolerance =
    relative <= solver.jacobianSymmetryRelativeTolerance;
  return Object.freeze({
    jacobianAntisymmetricMaximumAbsoluteByOneJ: antisymmetricMaximum,
    jacobianAntisymmetricRelative: relative,
    jacobianSymmetricWithinTolerance: symmetricWithinTolerance,
    symmetricJacobianMinimumEigenvalueByOneJ: minimumEigenvalue,
    strictLocalStableEquilibrium: symmetricWithinTolerance
      && minimumEigenvalue > solver.strictStabilityEigenvalueByOneJ,
  });
}

function finiteDifferenceJacobian(
  evaluate: (scaledUnknowns: readonly number[]) => readonly number[],
  center: readonly number[],
  step: number,
): MainWireFiveWallScaledAlgorithmicJacobianByOneJV1 {
  const n = center.length;
  const columns: number[][] = [];
  for (let column = 0; column < n; column += 1) {
    const lower = [...center];
    const upper = [...center];
    lower[column] -= step;
    upper[column] += step;
    const lowerValue = evaluate(lower);
    const upperValue = evaluate(upper);
    if (lowerValue.length !== n || upperValue.length !== n) {
      throw new Error(
        "algorithmic generalized-force dimension changed during finite difference",
      );
    }
    columns.push(upperValue.map((value, row) =>
      (value - lowerValue[row]!) / (2 * step)));
  }
  const result = Array.from({ length: n }, (_, row) => Object.freeze(
    Array.from({ length: n }, (_, column) => columns[column]![row]!),
  ));
  if (!result.flat().every(Number.isFinite)) {
    throw new Error("finite-difference algorithmic Jacobian contains non-finite values");
  }
  return Object.freeze(result);
}

/**
 * The nominal central-difference step remains the first audit. If it crosses a
 * constitutive branch boundary, smaller dyadic steps can recover a local
 * tangent that does not straddle that boundary; if small steps instead expose
 * the constitutive residual floor, the existing larger dyadic steps remain
 * available. Accept the first width in the declared priority order that meets
 * the unchanged symmetry tolerance. If none passes, retain the least
 * antisymmetric attempted Jacobian only so the existing hard gate can report
 * the failure.
 */
export function finiteDifferenceJacobianWithSymmetryAudit(
  evaluate: (scaledUnknowns: readonly number[]) => readonly number[],
  center: readonly number[],
  solver: ResolvedSolverOptionsV1,
): Readonly<{
  jacobian: MainWireFiveWallScaledAlgorithmicJacobianByOneJV1;
  stability: ReturnType<typeof evaluateAlgorithmicJacobianStability>;
  stepUsed: number;
}> {
  let best: Readonly<{
    jacobian: MainWireFiveWallScaledAlgorithmicJacobianByOneJV1;
    stability: ReturnType<typeof evaluateAlgorithmicJacobianStability>;
    stepUsed: number;
  }> | null = null;
  let lastError: unknown = null;
  for (const factor of [1, 0.5, 0.25, 0.125, 2, 4, 8] as const) {
    const stepUsed = solver.finiteDifferenceScaledStep * factor;
    try {
      const jacobian = finiteDifferenceJacobian(evaluate, center, stepUsed);
      const stability = evaluateAlgorithmicJacobianStability(jacobian, solver);
      if (
        best === null ||
        stability.jacobianAntisymmetricRelative <
          best.stability.jacobianAntisymmetricRelative
      ) {
        best = Object.freeze({ jacobian, stability, stepUsed });
      }
      if (stability.jacobianSymmetricWithinTolerance) return best;
    } catch (error) {
      lastError = error;
    }
  }
  if (best !== null) return best;
  throw lastError ?? new Error("finite-difference symmetry audit produced no Jacobian");
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
  });
  if (evaluation.algorithmicStressPrimitiveDensityJPerM3 !== undefined) {
    requireFinite(
      evaluation.algorithmicStressPrimitiveDensityJPerM3,
      `${wallId}.algorithmicStressPrimitiveDensityJPerM3`,
    );
  }
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
    finiteDifferenceScaledStep: resolved.finiteDifferenceScaledStep,
    jacobianSymmetryRelativeTolerance: resolved.jacobianSymmetryRelativeTolerance,
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
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_FIVE_WALL_IDS_V1.map((wallId) => [wallId, build(wallId)]),
  )) as MainWireFiveWallRecordV1<T>;
}

function sumFiveWalls(build: (wallId: MainWireFiveWallIdV1) => number): number {
  return MAIN_WIRE_FIVE_WALL_IDS_V1.reduce((sum, wallId) => sum + build(wallId), 0);
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
