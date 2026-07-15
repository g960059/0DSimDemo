import {
  evaluateFourChamberVolumeRatesV1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  writeRateFreeLand2017RhsV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  diagnoseScaledJacobian2x2V1,
  solveScaledDensePartialPivotLuV1,
  type ScaledJacobian2x2DiagnosticsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  assertPhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsSourceBindingV1,
  auditPhaseB1EventFreeMonolithicGlobalJacobianV1,
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsV1,
  type PhaseB1EventFreeGlobalJacobianAuditV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicNumericalPolicyV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_DIFFERENTIATED_STAGE_KINEMATICS_V1_ID =
  "four-chamber-phase-b1-differentiated-stage-kinematics-v1" as const;

export const PHASE_B1_ACCEPTED_BE_STAGE_KINEMATICS_SNAPSHOT_V1_ID =
  "phase-b1-accepted-backward-euler-stage-kinematics-snapshot-v1" as const;

export type PhaseB1DifferentiatedStageKinematicsInputV1 = Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  dtSec: number;
}>;

export type PhaseB1DifferentiatedStageKinematicsV1 = Readonly<{
  kinematicsId: typeof PHASE_B1_DIFFERENTIATED_STAGE_KINEMATICS_V1_ID;
  method: "differentiate-frozen-active-set-TriSeg-constraint-at-same-time-level";
  slsMode: "on" | "off";
  globalJacobianAudit: PhaseB1EventFreeGlobalJacobianAuditV1;
  volumeRateM3PerSecByCompartment: Readonly<Record<BloodCompartmentId, number>>;
  landStateRatePerSecByWall: Readonly<Record<FourChamberWallId, readonly number[]>>;
  slsAlphaRatePerSecByWall: Readonly<Record<FourChamberWallId, number>> | null;
  triSegCoordinateRate: Readonly<{
    septalMidwallCapVolumeM3PerSec: number;
    junctionRadiusMPerSec: number;
  }>;
  fiberLogStrainRatePerSecByWall: Readonly<Record<FourChamberWallId, number>>;
  scaledTriSegJacobianDiagnostics: ScaledJacobian2x2DiagnosticsV1;
  differentiatedConstraintResidualNPerMSec: Readonly<{
    axial: number;
    radial: number;
    infinityNorm: number;
    tolerance: number;
    accepted: boolean;
  }>;
  stepHalvingAudit: Readonly<{
    coarseDirectionalStepSec: number;
    fineDirectionalStepSec: number;
    stepHalvingFactor: 2;
    coarseFiberLogStrainRatePerSecByWall:
      Readonly<Record<FourChamberWallId, number>>;
    fineFiberLogStrainRatePerSecByWall:
      Readonly<Record<FourChamberWallId, number>>;
    maximumNormalizedRateDifference: number;
    relativeTolerance: number;
    accepted: boolean;
  }>;
  landDirectionCount: 30;
  allThirtyLandStateRatesAssembledIntoDifferentiatedConstraintInput: true;
  atrialLandColumnsStructurallyZeroInTriSegEquilibriumRows: true;
  landRateSource: "rate-free-Land-RHS-at-accepted-stage";
  volumeRateSource: "canonical-eight-volume-incidence-ledger-at-accepted-stage";
  calciumRateEntersInstantaneousMechanicalConstraint: false;
  laggedEndpointStrainDifferenceUsed: false;
  accepted: boolean;
  testReferenceOnly: true;
  phaseB1Acceptance: false;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1AcceptedBackwardEulerStageKinematicsSnapshotV1 =
  Readonly<{
    kinematicsId:
      typeof PHASE_B1_ACCEPTED_BE_STAGE_KINEMATICS_SNAPSHOT_V1_ID;
    method:
      "differentiate-accepted-Newton-base-TriSeg-constraint-at-same-time-level";
    slsMode: "on" | "off";
    acceptedNewtonBaseTriSegConstraintJacobianRows:
      PhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsV1;
    volumeRateM3PerSecByCompartment:
      Readonly<Record<BloodCompartmentId, number>>;
    landStateRatePerSecByWall:
      Readonly<Record<FourChamberWallId, readonly number[]>>;
    slsAlphaRatePerSecByWall:
      Readonly<Record<FourChamberWallId, number>> | null;
    triSegCoordinateRate: Readonly<{
      septalMidwallCapVolumeM3PerSec: number;
      junctionRadiusMPerSec: number;
    }>;
    fiberLogStrainRatePerSecByWall:
      Readonly<Record<FourChamberWallId, number>>;
    scaledTriSegJacobianDiagnostics: ScaledJacobian2x2DiagnosticsV1;
    differentiatedConstraintResidualNPerMSec: Readonly<{
      axial: number;
      radial: number;
      infinityNorm: number;
      tolerance: number;
      accepted: boolean;
    }>;
    stepHalvingAudit: PhaseB1DifferentiatedStageKinematicsV1["stepHalvingAudit"];
    landDirectionCount: 30;
    allThirtyLandStateRatesAssembledIntoDifferentiatedConstraintInput: true;
    atrialLandColumnsStructurallyZeroInTriSegEquilibriumRows: true;
    landRateSource: "rate-free-Land-RHS-at-accepted-stage";
    volumeRateSource:
      "canonical-eight-volume-incidence-ledger-at-accepted-stage";
    calciumRateEntersInstantaneousMechanicalConstraint: false;
    laggedEndpointStrainDifferenceUsed: false;
    acceptedNewtonBaseJacobianRowsUsed: true;
    independentGlobalJacobianAuditRepeated: false;
    genericNewtonPolicyChanged: false;
    accepted: boolean;
    testReferenceOnly: true;
    phaseB1Acceptance: false;
    releaseRuntimeReachable: false;
  }>;

export function reconstructPhaseB1AcceptedBackwardEulerStageKinematicsSnapshotV1(
  input: Readonly<{
    model: PhaseB1EventFreeMonolithicModelV1;
    wallMaterialBinding: PhaseB1WallMaterialBindingV1;
    previousEndpoint: PhaseB1EndpointStateV1;
    nextEndpointLeftLimit: PhaseB1EndpointStateV1;
    dtSec: number;
    acceptedNewtonBaseTriSegConstraintJacobianRows:
      PhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsV1;
  }>,
): PhaseB1AcceptedBackwardEulerStageKinematicsSnapshotV1 {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "nextEndpointLeftLimit",
    "dtSec",
    "acceptedNewtonBaseTriSegConstraintJacobianRows",
  ], "Phase B1 accepted BE stage kinematics snapshot input");
  const binding = assertPhaseB1WallMaterialBindingV1(
    input.wallMaterialBinding,
  );
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  const jacobianRows =
    assertPhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsSourceBindingV1({
      snapshot: input.acceptedNewtonBaseTriSegConstraintJacobianRows,
      model: input.model,
      wallMaterialBinding: binding,
      previousEndpoint: input.previousEndpoint,
      nextEndpointLeftLimit: input.nextEndpointLeftLimit,
      dtSec,
    });
  const previousEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  const nextEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.nextEndpointLeftLimit.timeSec,
    differentialState: input.nextEndpointLeftLimit.differentialState,
    triSegCoordinates: input.nextEndpointLeftLimit.triSegCoordinates,
  });
  assertRoundoffEqual(
    nextEndpoint.timeSec,
    previousEndpoint.timeSec + dtSec,
    "accepted BE stage kinematics endpoint time",
  );
  const next = nextEndpoint.differentialState;
  if (
    previousEndpoint.differentialState.slsMode !== next.slsMode
    || jacobianRows.slsMode !== next.slsMode
  ) {
    throw new Error("accepted BE stage kinematics changed SLS topology");
  }
  const nextEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    binding,
    nextEndpoint,
  );
  const volumeRateM3PerSecByCompartment =
    evaluateFourChamberVolumeRatesV1(
      nextEvaluation.closedLoop.allFlowsM3PerSec,
    ).volumeRatesM3PerSec;
  const landStateRatePerSecByWall = wallRecord((wallId) => Object.freeze(
    Array.from(writeRateFreeLand2017RhsV1(
      next.landByWall[wallId],
      {
        freeCalciumUM: nextEvaluation.freeCalciumUMByWall[wallId],
        landStretch:
          nextEvaluation.wallMaterialByWall[wallId].length.landStretch,
      },
      binding.runtimeByWall[wallId].landEquationParameters,
    )),
  ));
  const slsAlphaRatePerSecByWall = next.slsMode === "on"
    ? wallRecord((wallId) => {
      const material = binding.runtimeByWall[wallId].passiveSls.compiledSls;
      const strain = nextEvaluation.closedLoop.wallMechanics[wallId]
        .fiberLogStrain;
      return requireFinite(
        (strain - next.slsAlphaVByWall[wallId]) / material.tauSec,
        `${wallId}.acceptedSlsAlphaRatePerSec`,
      );
    })
    : null;
  const knownDifferentialRate = Object.freeze([
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      volumeRateM3PerSecByCompartment[id]),
    ...INERTIAL_FLOW_IDS.map(() => 0),
    ...WALL_IDS.flatMap((wallId) => landStateRatePerSecByWall[wallId]),
    ...(slsAlphaRatePerSecByWall === null
      ? []
      : WALL_IDS.map((wallId) => slsAlphaRatePerSecByWall[wallId])),
    0,
    0,
  ]);
  if (knownDifferentialRate.length !== jacobianRows.unknownCount) {
    throw new Error("accepted BE kinematics rate-vector dimension drifted");
  }
  const coordinateColumns = [
    jacobianRows.unknownCount - 2,
    jacobianRows.unknownCount - 1,
  ] as const;
  const knownResidualRate = jacobianRows.rawJacobianRows.map((row) =>
    knownDifferentialRate.reduce((sum, rate, column) =>
      sum + row[column] * rate, 0));
  const registry = input.model.newtonScaleRegistry;
  const coordinateScales = [
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  ] as const;
  const residualScale = registry.residualScales
    .publishedTriSegEquilibriumNPerM;
  const scaledCoordinateJacobian = jacobianRows.rawJacobianRows.flatMap(
    (row) => coordinateColumns.map((column, coordinateIndex) =>
      row[column] * coordinateScales[coordinateIndex] / residualScale),
  );
  const scaledTriSegJacobianDiagnostics = diagnoseScaledJacobian2x2V1(
    scaledCoordinateJacobian,
  );
  if (scaledTriSegJacobianDiagnostics.numericallySingular) {
    throw new Error("accepted differentiated TriSeg Jacobian is singular");
  }
  const coordinateRateSolve = solveScaledDensePartialPivotLuV1(
    scaledCoordinateJacobian,
    knownResidualRate.map((value) => -value / residualScale),
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .relativePivotTolerance,
  );
  if (coordinateRateSolve.success === false) {
    throw new Error(
      `accepted differentiated TriSeg solve failed: ${coordinateRateSolve.message}`,
    );
  }
  const coordinateRate = Object.freeze([
    requireFinite(
      coordinateRateSolve.solution[0] * coordinateScales[0],
      "accepted septalMidwallCapVolumeM3PerSec",
    ),
    requireFinite(
      coordinateRateSolve.solution[1] * coordinateScales[1],
      "accepted junctionRadiusMPerSec",
    ),
  ] as const);
  const differentiatedConstraintResidual = jacobianRows.rawJacobianRows.map(
    (row, rowIndex) => requireFinite(
      knownResidualRate[rowIndex]
        + row[coordinateColumns[0]] * coordinateRate[0]
        + row[coordinateColumns[1]] * coordinateRate[1],
      `accepted differentiatedConstraintResidual[${rowIndex}]`,
    ),
  );
  const constraintInfinityNorm = Math.max(
    ...differentiatedConstraintResidual.map(Math.abs),
  );
  const constraintTolerance =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .differentiatedTriSegConstraintResidualToleranceNPerMSec;
  const coarseDirectionalStepSec =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .differentiatedKinematicsDirectionalStepSec;
  if (!(nextEndpoint.timeSec > coarseDirectionalStepSec)) {
    throw new Error("accepted differentiated kinematics endpoint is too early");
  }
  const fineDirectionalStepSec = coarseDirectionalStepSec
    / PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .differentiatedKinematicsStepHalvingFactor;
  const coarseFiberLogStrainRatePerSecByWall = differentiateFiberStrain(
    input.model,
    binding,
    nextEndpoint,
    volumeRateM3PerSecByCompartment,
    coordinateRate,
    coarseDirectionalStepSec,
  );
  const fineFiberLogStrainRatePerSecByWall = differentiateFiberStrain(
    input.model,
    binding,
    nextEndpoint,
    volumeRateM3PerSecByCompartment,
    coordinateRate,
    fineDirectionalStepSec,
  );
  const fiberRateScalePerSec = registry.unknownScales.fiberLogStrain / dtSec;
  const maximumNormalizedRateDifference = Math.max(...WALL_IDS.map(
    (wallId) => Math.abs(
      coarseFiberLogStrainRatePerSecByWall[wallId]
      - fineFiberLogStrainRatePerSecByWall[wallId],
    ) / (
      fiberRateScalePerSec
      + Math.max(
        Math.abs(coarseFiberLogStrainRatePerSecByWall[wallId]),
        Math.abs(fineFiberLogStrainRatePerSecByWall[wallId]),
      )
    ),
  ));
  const halvingTolerance =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .differentiatedKinematicsHalvingRelativeTolerance;
  const constraintAccepted = constraintInfinityNorm < constraintTolerance;
  const stepHalvingAudit = Object.freeze({
    coarseDirectionalStepSec,
    fineDirectionalStepSec,
    stepHalvingFactor: 2 as const,
    coarseFiberLogStrainRatePerSecByWall,
    fineFiberLogStrainRatePerSecByWall,
    maximumNormalizedRateDifference,
    relativeTolerance: halvingTolerance,
    accepted: maximumNormalizedRateDifference < halvingTolerance,
  });
  return Object.freeze({
    kinematicsId: PHASE_B1_ACCEPTED_BE_STAGE_KINEMATICS_SNAPSHOT_V1_ID,
    method:
      "differentiate-accepted-Newton-base-TriSeg-constraint-at-same-time-level",
    slsMode: next.slsMode,
    acceptedNewtonBaseTriSegConstraintJacobianRows: jacobianRows,
    volumeRateM3PerSecByCompartment,
    landStateRatePerSecByWall,
    slsAlphaRatePerSecByWall,
    triSegCoordinateRate: Object.freeze({
      septalMidwallCapVolumeM3PerSec: coordinateRate[0],
      junctionRadiusMPerSec: coordinateRate[1],
    }),
    fiberLogStrainRatePerSecByWall: fineFiberLogStrainRatePerSecByWall,
    scaledTriSegJacobianDiagnostics,
    differentiatedConstraintResidualNPerMSec: Object.freeze({
      axial: differentiatedConstraintResidual[0],
      radial: differentiatedConstraintResidual[1],
      infinityNorm: constraintInfinityNorm,
      tolerance: constraintTolerance,
      accepted: constraintAccepted,
    }),
    stepHalvingAudit,
    landDirectionCount: 30,
    allThirtyLandStateRatesAssembledIntoDifferentiatedConstraintInput: true,
    atrialLandColumnsStructurallyZeroInTriSegEquilibriumRows: true,
    landRateSource: "rate-free-Land-RHS-at-accepted-stage",
    volumeRateSource:
      "canonical-eight-volume-incidence-ledger-at-accepted-stage",
    calciumRateEntersInstantaneousMechanicalConstraint: false,
    laggedEndpointStrainDifferenceUsed: false,
    acceptedNewtonBaseJacobianRowsUsed: true,
    independentGlobalJacobianAuditRepeated: false,
    genericNewtonPolicyChanged: false,
    accepted: constraintAccepted && stepHalvingAudit.accepted,
    testReferenceOnly: true,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
}

export function reconstructPhaseB1DifferentiatedStageKinematicsV1(
  input: PhaseB1DifferentiatedStageKinematicsInputV1,
): PhaseB1DifferentiatedStageKinematicsV1 {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "nextEndpointLeftLimit",
    "dtSec",
  ], "Phase B1 differentiated stage kinematics input");
  const binding = assertPhaseB1WallMaterialBindingV1(
    input.wallMaterialBinding,
  );
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  const previousEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  const nextEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.nextEndpointLeftLimit.timeSec,
    differentialState: input.nextEndpointLeftLimit.differentialState,
    triSegCoordinates: input.nextEndpointLeftLimit.triSegCoordinates,
  });
  assertRoundoffEqual(
    nextEndpoint.timeSec,
    previousEndpoint.timeSec + dtSec,
    "differentiated kinematics endpoint time",
  );
  const next = nextEndpoint.differentialState;
  if (previousEndpoint.differentialState.slsMode !== next.slsMode) {
    throw new Error("differentiated kinematics cannot change SLS topology");
  }
  const nextEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    binding,
    nextEndpoint,
  );
  const globalJacobianAudit =
    auditPhaseB1EventFreeMonolithicGlobalJacobianV1({
      model: input.model,
      wallMaterialBinding: binding,
      previousEndpoint,
      nextEndpointLeftLimit: nextEndpoint,
      dtSec,
    });
  const volumeRateM3PerSecByCompartment =
    evaluateFourChamberVolumeRatesV1(
      nextEvaluation.closedLoop.allFlowsM3PerSec,
    ).volumeRatesM3PerSec;
  const landStateRatePerSecByWall = wallRecord((wallId) => {
    const material = binding.runtimeByWall[wallId];
    const rate = writeRateFreeLand2017RhsV1(
      next.landByWall[wallId],
      {
        freeCalciumUM: nextEvaluation.freeCalciumUMByWall[wallId],
        landStretch:
          nextEvaluation.wallMaterialByWall[wallId].length.landStretch,
      },
      material.landEquationParameters,
    );
    return Object.freeze(Array.from(rate));
  });
  const slsAlphaRatePerSecByWall = next.slsMode === "on"
    ? wallRecord((wallId) => {
      const material = binding.runtimeByWall[wallId].passiveSls.compiledSls;
      const strain = nextEvaluation.closedLoop.wallMechanics[wallId]
        .fiberLogStrain;
      return requireFinite(
        (strain - next.slsAlphaVByWall[wallId]) / material.tauSec,
        `${wallId}.slsAlphaRatePerSec`,
      );
    })
    : null;
  const knownDifferentialRate = Object.freeze([
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      volumeRateM3PerSecByCompartment[id]),
    ...INERTIAL_FLOW_IDS.map(() => 0),
    ...WALL_IDS.flatMap((wallId) => landStateRatePerSecByWall[wallId]),
    ...(slsAlphaRatePerSecByWall === null
      ? []
      : WALL_IDS.map((wallId) => slsAlphaRatePerSecByWall[wallId])),
    0,
    0,
  ]);
  if (knownDifferentialRate.length !== globalJacobianAudit.unknownCount) {
    throw new Error("differentiated kinematics rate-vector dimension drifted");
  }
  const residualRows = [
    globalJacobianAudit.residualCount - 2,
    globalJacobianAudit.residualCount - 1,
  ] as const;
  const coordinateColumns = [
    globalJacobianAudit.unknownCount - 2,
    globalJacobianAudit.unknownCount - 1,
  ] as const;
  const rawJacobian = globalJacobianAudit.algorithmicJacobian.rawJacobian;
  const knownResidualRate = residualRows.map((row) =>
    knownDifferentialRate.reduce((sum, rate, column) =>
      sum + rawJacobian[row][column] * rate, 0));
  const registry = input.model.newtonScaleRegistry;
  const coordinateScales = [
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  ] as const;
  const residualScale = registry.residualScales
    .publishedTriSegEquilibriumNPerM;
  const scaledCoordinateJacobian = residualRows.flatMap((row) =>
    coordinateColumns.map((column, coordinateIndex) =>
      rawJacobian[row][column] * coordinateScales[coordinateIndex]
      / residualScale));
  const scaledTriSegJacobianDiagnostics = diagnoseScaledJacobian2x2V1(
    scaledCoordinateJacobian,
  );
  if (scaledTriSegJacobianDiagnostics.numericallySingular) {
    throw new Error("differentiated TriSeg Jacobian is numerically singular");
  }
  const coordinateRateSolve = solveScaledDensePartialPivotLuV1(
    scaledCoordinateJacobian,
    knownResidualRate.map((value) => -value / residualScale),
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .relativePivotTolerance,
  );
  if (coordinateRateSolve.success === false) {
    throw new Error(
      `differentiated TriSeg coordinate-rate solve failed: ${coordinateRateSolve.message}`,
    );
  }
  const coordinateRate = Object.freeze([
    requireFinite(
      coordinateRateSolve.solution[0] * coordinateScales[0],
      "septalMidwallCapVolumeM3PerSec",
    ),
    requireFinite(
      coordinateRateSolve.solution[1] * coordinateScales[1],
      "junctionRadiusMPerSec",
    ),
  ] as const);
  const differentiatedConstraintResidual = residualRows.map((row, rowIndex) =>
    requireFinite(
      knownResidualRate[rowIndex]
      + rawJacobian[row][coordinateColumns[0]] * coordinateRate[0]
      + rawJacobian[row][coordinateColumns[1]] * coordinateRate[1],
      `differentiatedConstraintResidual[${rowIndex}]`,
    ));
  const constraintInfinityNorm = Math.max(
    ...differentiatedConstraintResidual.map(Math.abs),
  );
  const constraintTolerance =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .differentiatedTriSegConstraintResidualToleranceNPerMSec;

  const coarseDirectionalStepSec =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .differentiatedKinematicsDirectionalStepSec;
  if (!(nextEndpoint.timeSec > coarseDirectionalStepSec)) {
    throw new Error("differentiated kinematics endpoint time is too early");
  }
  const fineDirectionalStepSec = coarseDirectionalStepSec
    / PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .differentiatedKinematicsStepHalvingFactor;
  const coarseFiberLogStrainRatePerSecByWall = differentiateFiberStrain(
    input.model,
    binding,
    nextEndpoint,
    volumeRateM3PerSecByCompartment,
    coordinateRate,
    coarseDirectionalStepSec,
  );
  const fineFiberLogStrainRatePerSecByWall = differentiateFiberStrain(
    input.model,
    binding,
    nextEndpoint,
    volumeRateM3PerSecByCompartment,
    coordinateRate,
    fineDirectionalStepSec,
  );
  const fiberRateScalePerSec = registry.unknownScales.fiberLogStrain / dtSec;
  const maximumNormalizedRateDifference = Math.max(...WALL_IDS.map(
    (wallId) => Math.abs(
      coarseFiberLogStrainRatePerSecByWall[wallId]
      - fineFiberLogStrainRatePerSecByWall[wallId],
    ) / (
      fiberRateScalePerSec
      + Math.max(
        Math.abs(coarseFiberLogStrainRatePerSecByWall[wallId]),
        Math.abs(fineFiberLogStrainRatePerSecByWall[wallId]),
      )
    ),
  ));
  const halvingTolerance =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .differentiatedKinematicsHalvingRelativeTolerance;
  const stepHalvingAudit = Object.freeze({
    coarseDirectionalStepSec,
    fineDirectionalStepSec,
    stepHalvingFactor: 2 as const,
    coarseFiberLogStrainRatePerSecByWall,
    fineFiberLogStrainRatePerSecByWall,
    maximumNormalizedRateDifference,
    relativeTolerance: halvingTolerance,
    accepted: maximumNormalizedRateDifference < halvingTolerance,
  });
  const constraintAccepted = constraintInfinityNorm < constraintTolerance;
  return Object.freeze({
    kinematicsId: PHASE_B1_DIFFERENTIATED_STAGE_KINEMATICS_V1_ID,
    method:
      "differentiate-frozen-active-set-TriSeg-constraint-at-same-time-level",
    slsMode: next.slsMode,
    globalJacobianAudit,
    volumeRateM3PerSecByCompartment,
    landStateRatePerSecByWall,
    slsAlphaRatePerSecByWall,
    triSegCoordinateRate: Object.freeze({
      septalMidwallCapVolumeM3PerSec: coordinateRate[0],
      junctionRadiusMPerSec: coordinateRate[1],
    }),
    fiberLogStrainRatePerSecByWall:
      fineFiberLogStrainRatePerSecByWall,
    scaledTriSegJacobianDiagnostics,
    differentiatedConstraintResidualNPerMSec: Object.freeze({
      axial: differentiatedConstraintResidual[0],
      radial: differentiatedConstraintResidual[1],
      infinityNorm: constraintInfinityNorm,
      tolerance: constraintTolerance,
      accepted: constraintAccepted,
    }),
    stepHalvingAudit,
    landDirectionCount: 30,
    allThirtyLandStateRatesAssembledIntoDifferentiatedConstraintInput: true,
    atrialLandColumnsStructurallyZeroInTriSegEquilibriumRows: true,
    landRateSource: "rate-free-Land-RHS-at-accepted-stage",
    volumeRateSource:
      "canonical-eight-volume-incidence-ledger-at-accepted-stage",
    calciumRateEntersInstantaneousMechanicalConstraint: false,
    laggedEndpointStrainDifferenceUsed: false,
    accepted:
      globalJacobianAudit.accepted
      && constraintAccepted
      && stepHalvingAudit.accepted,
    testReferenceOnly: true,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
}

function differentiateFiberStrain(
  model: PhaseB1EventFreeMonolithicModelV1,
  binding: PhaseB1WallMaterialBindingV1,
  endpoint: PhaseB1EndpointStateV1,
  volumeRates: Readonly<Record<BloodCompartmentId, number>>,
  coordinateRate: readonly [number, number],
  hSec: number,
): Readonly<Record<FourChamberWallId, number>> {
  const minus = evaluatePhaseB1EventFreeEndpointV1(
    model,
    binding,
    kinematicTrial(endpoint, volumeRates, coordinateRate, -hSec),
  );
  const plus = evaluatePhaseB1EventFreeEndpointV1(
    model,
    binding,
    kinematicTrial(endpoint, volumeRates, coordinateRate, hSec),
  );
  return wallRecord((wallId) => requireFinite(
    (
      plus.closedLoop.wallMechanics[wallId].fiberLogStrain
      - minus.closedLoop.wallMechanics[wallId].fiberLogStrain
    ) / (2 * hSec),
    `${wallId}.fiberLogStrainRatePerSec`,
  ));
}

function kinematicTrial(
  endpoint: PhaseB1EndpointStateV1,
  volumeRates: Readonly<Record<BloodCompartmentId, number>>,
  coordinateRate: readonly [number, number],
  hSec: number,
): PhaseB1EndpointStateV1 {
  const differential = endpoint.differentialState;
  const common = Object.freeze({
    bloodVolumesM3: Object.freeze(Object.fromEntries(
      BLOOD_COMPARTMENT_IDS.map((id) => [
        id,
        differential.bloodVolumesM3[id] + hSec * volumeRates[id],
      ]),
    )) as Readonly<Record<BloodCompartmentId, number>>,
    inertialFlowsM3PerSec: differential.inertialFlowsM3PerSec,
    calciumByWall: differential.calciumByWall,
    landByWall: differential.landByWall,
  });
  return createPhaseB1EndpointStateV1({
    timeSec: endpoint.timeSec + hSec,
    differentialState: differential.slsMode === "on"
      ? Object.freeze({
        ...common,
        slsMode: "on" as const,
        slsAlphaVByWall: differential.slsAlphaVByWall,
      })
      : Object.freeze({ ...common, slsMode: "off" as const }),
    triSegCoordinates: Object.freeze({
      V_m_S: endpoint.triSegCoordinates.V_m_S
        + hSec * coordinateRate[0],
      y_m: endpoint.triSegCoordinates.y_m
        + hSec * coordinateRate[1],
    }),
  });
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

function assertRoundoffEqual(
  actual: number,
  expected: number,
  field: string,
): void {
  const tolerance = 128 * Number.EPSILON
    * Math.max(1, Math.abs(actual), Math.abs(expected));
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${field} mismatch`);
  }
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (!(result > 0)) throw new Error(`${field} must be positive`);
  return result;
}
