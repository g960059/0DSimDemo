import {
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import type { ValveMomentumOutputV1 } from
  "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import {
  evaluateFourChamberBackwardEulerVolumeResidualV1,
  type FourChamberBackwardEulerVolumeResidualV1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  evaluateFourChamberClosedLoopSameTimeLevelV1,
  getRuntimeTriSegEquilibriumResidualV2,
  type FourChamberClosedLoopSameTimeLevelEvaluationV1,
  type FourChamberClosedLoopSameTimeLevelInputV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/closedLoopSameTimeLevelV1";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  deriveOdeResidualScalePerSec,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  auditScaledFivePointAlgorithmicJacobianDirectionV1,
  evaluateScaledFivePointAlgorithmicJacobianV1,
  type ScaledFivePointAlgorithmicJacobianV1,
  type ScaledFivePointJacobianDirectionalAuditV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import {
  solveScaledDampedNewtonV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDampedNewtonFailureReasonV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicNumericalPolicyV1";
import {
  assertInsidePhaseB1LandSimplexNewtonDomainV1,
  buildPhaseB1LandSimplexNewtonDomainV1,
  minimumPhaseB1LandSimplexMarginV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/landSimplexNewtonDomainV1";
import {
  createPhaseB1EndpointStateV1,
  decodePhaseB1EndpointTopologyVectorsV1,
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1CalciumStateByWallV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  assertPhaseB1WallRuntimeMaterialV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  evaluatePhaseB1WallBackwardEulerV1,
  evaluatePhaseB1WallMaterialStateV1,
  type PhaseB1WallBackwardEulerEvaluationV1,
  type PhaseB1WallMaterialStateEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  buildPhaseB1NewtonResidualLabelsV1,
  buildPhaseB1NewtonUnknownLabelsV1,
  type PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type FourChamberWallId,
  type InertialFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_EVENT_FREE_MONOLITHIC_BE_V1_ID =
  "four-chamber-phase-b1-event-free-monolithic-backward-euler-v1" as const;

export const PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID =
  "four-chamber-phase-b1-candidate-prior-test-reference-v1" as const;

export const PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID =
  "four-chamber-phase-b1-physiology-envelope-candidate-v1" as const;

export const PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID =
  "four-chamber-phase-b1-mechanistic-rebuild-v2" as const;

export const PHASE_B1_EVENT_FREE_MONOLITHIC_MODEL_IDS_V1 = Object.freeze([
  PHASE_B1_EVENT_FREE_PROJECT_SYNTHETIC_MODEL_V1_ID,
  PHASE_B1_EVENT_FREE_PHYSIOLOGY_ENVELOPE_CANDIDATE_MODEL_V1_ID,
  PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID,
] as const);

export type PhaseB1EventFreeMonolithicModelIdV1 =
  typeof PHASE_B1_EVENT_FREE_MONOLITHIC_MODEL_IDS_V1[number];

export const PHASE_B1_EVENT_FREE_GLOBAL_JACOBIAN_AUDIT_V1_ID =
  "phase-b1-event-free-global-semismooth-jacobian-audit-v1" as const;

export const PHASE_B1_ACCEPTED_NEWTON_BASE_TRISEG_CONSTRAINT_JACOBIAN_ROWS_V1_ID =
  "phase-b1-accepted-newton-base-triseg-constraint-jacobian-rows-v1" as const;

const BUILDER_ISSUED_ACCEPTED_TRISEG_JACOBIAN_ROWS = new WeakSet<object>();
const ACCEPTED_TRISEG_JACOBIAN_ROW_SOURCE = new WeakMap<object, Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  dtSec: number;
}>>();

export type PhaseB1EventFreeClosedLoopParametersV1 = Omit<
  FourChamberClosedLoopSameTimeLevelInputV1,
  "state" | "evaluateWall"
>;

export type PhaseB1EventFreeMonolithicModelV1 = Readonly<{
  modelId: PhaseB1EventFreeMonolithicModelIdV1;
  closedLoopParameters: PhaseB1EventFreeClosedLoopParametersV1;
  newtonScaleRegistry: FourChamberNewtonScaleRegistryV1;
  candidatePriorOnly: true;
  physiologicalValidation: false;
  phaseB1Acceptance: false;
  releaseRuntimeReachable: false;
}>;

export function assertPhaseB1EventFreeMonolithicModelIdV1(
  value: unknown,
): asserts value is PhaseB1EventFreeMonolithicModelIdV1 {
  if (
    typeof value !== "string"
    || !PHASE_B1_EVENT_FREE_MONOLITHIC_MODEL_IDS_V1.includes(
      value as PhaseB1EventFreeMonolithicModelIdV1,
    )
  ) {
    throw new Error(
      "Phase B1 event-free modelId must be an explicitly supported candidate ID",
    );
  }
}

export type PhaseB1EventFreeEndpointEvaluationV1 = Readonly<{
  evaluationId: "phase-b1-event-free-same-time-level-evaluation-v1";
  endpoint: PhaseB1EndpointStateV1;
  freeCalciumUMByWall: Readonly<Record<FourChamberWallId, number>>;
  wallMaterialByWall: Readonly<
    Record<FourChamberWallId, PhaseB1WallMaterialStateEvaluationV1>
  >;
  closedLoop: FourChamberClosedLoopSameTimeLevelEvaluationV1;
  explicitActiveStressTimeDerivativeAtFixedStatePaPerSecByWall:
    Readonly<Record<FourChamberWallId, 0>>;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
}>;

export type PhaseB1EventFreeResidualEvaluationV1 = Readonly<{
  residual: readonly number[];
  residualLabels: readonly string[];
  volumeResidual: FourChamberBackwardEulerVolumeResidualV1;
  momentumResidualPaByFlow: Readonly<Record<InertialFlowId, number>>;
  wallBackwardEulerByWall: Readonly<
    Record<FourChamberWallId, PhaseB1WallBackwardEulerEvaluationV1>
  >;
  landResidualPerSecByWall: Readonly<Record<FourChamberWallId, readonly number[]>>;
  slsResidualPerSecByWall: Readonly<Record<FourChamberWallId, number>> | null;
  triSegResidualNPerM: Readonly<{ axial: number; radial: number }>;
  nextEndpoint: PhaseB1EndpointStateV1;
  nextEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
  calciumResidualCount: 0;
  innerLandSolveUsed: false;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
}>;

export type PhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsV1 =
  Readonly<{
    snapshotId:
      typeof PHASE_B1_ACCEPTED_NEWTON_BASE_TRISEG_CONSTRAINT_JACOBIAN_ROWS_V1_ID;
    slsMode: PhaseB1SlsModeV1;
    unknownCount: 51 | 46;
    residualCount: 51 | 46;
    dtSec: number;
    triSegResidualRowIndices: readonly [number, number];
    rawJacobianRows: readonly [readonly number[], readonly number[]];
    capturedFromAcceptedNewtonBase: true;
    lineSearchTrialJacobianConsumed: false;
    genericNewtonPolicyChanged: false;
    numericalResultChangedByCapture: false;
    testReferenceOnly: true;
    phaseB1Acceptance: false;
    releaseRuntimeReachable: false;
  }>;

export type PhaseB1EventFreeMonolithicStepSuccessV1 = Readonly<{
  converged: true;
  solverId: typeof PHASE_B1_EVENT_FREE_MONOLITHIC_BE_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  unknownCount: 51 | 46;
  residualCount: 51 | 46;
  calciumStoredStateCount: 10;
  calciumNewtonUnknownCount: 0;
  calciumResidualCount: 0;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  calciumDriveStateByWallAtEndLeftLimit: PhaseB1CalciumStateByWallV1;
  previousEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
  nextEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
  residualEvaluation: PhaseB1EventFreeResidualEvaluationV1;
  acceptedNewtonBaseTriSegConstraintJacobianRows:
    PhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  minimumLandSimplexMargin: number;
  totalBloodVolumeChangeM3: number;
  fullLandGeometryAndHydraulicCrossCouplingAssemblyImplemented: true;
  semismoothDirectionalConsistencyAuditCompleted: false;
  crossBlockNonzeroAuditCompleted: false;
  algorithmicJacobian:
    "semismooth-constitutive-linearization-scaled-five-point-full-system-reference";
  eventFree: true;
  innerLandSolveUsed: false;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
  postStepBloodVolumeProjectionApplied: false;
  flowClampApplied: false;
  wholeHeartLandEnergyAuditCompleted: false;
  differentiatedLandKinematicsAuditCompleted: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export function assertPhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsSourceBindingV1(
  input: Readonly<{
    snapshot: PhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsV1;
    model: PhaseB1EventFreeMonolithicModelV1;
    wallMaterialBinding: PhaseB1WallMaterialBindingV1;
    previousEndpoint: PhaseB1EndpointStateV1;
    nextEndpointLeftLimit: PhaseB1EndpointStateV1;
    dtSec: number;
  }>,
): PhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsV1 {
  assertExactPlainRecordV1(input, [
    "snapshot",
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "nextEndpointLeftLimit",
    "dtSec",
  ], "accepted Newton-base TriSeg Jacobian-row source binding");
  const source = ACCEPTED_TRISEG_JACOBIAN_ROW_SOURCE.get(input.snapshot);
  if (
    !BUILDER_ISSUED_ACCEPTED_TRISEG_JACOBIAN_ROWS.has(input.snapshot)
    || source === undefined
    || !Object.is(source.model, input.model)
    || !Object.is(source.wallMaterialBinding, input.wallMaterialBinding)
    || !Object.is(source.previousEndpoint, input.previousEndpoint)
    || !Object.is(source.nextEndpointLeftLimit, input.nextEndpointLeftLimit)
    || !Object.is(source.dtSec, input.dtSec)
  ) {
    throw new Error(
      "accepted Newton-base TriSeg Jacobian rows are forged or source-unbound",
    );
  }
  return input.snapshot;
}

export type PhaseB1EventFreeMonolithicStepFailureV1 = Readonly<{
  converged: false;
  solverId: typeof PHASE_B1_EVENT_FREE_MONOLITHIC_BE_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  unknownCount: 51 | 46;
  reason: ScaledDampedNewtonFailureReasonV1 | "final-evaluation-failed";
  message: string;
  rollbackEndpoint: PhaseB1EndpointStateV1;
  lastAcceptedDiagnosticEndpoint: PhaseB1EndpointStateV1 | null;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
  postStepBloodVolumeProjectionApplied: false;
  flowClampApplied: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1EventFreeMonolithicStepResultV1 =
  | PhaseB1EventFreeMonolithicStepSuccessV1
  | PhaseB1EventFreeMonolithicStepFailureV1;

export type PhaseB1EventFreeMonolithicStepInputV1 = Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  dtSec: number;
}>;

export type PhaseB1EventFreeGlobalJacobianAuditInputV1 = Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  dtSec: number;
}>;

export type PhaseB1EventFreeGlobalJacobianCrossBlocksV1 = Readonly<{
  landResidualByMechanicalGeometry: number;
  hydraulicMomentumByLandState: number;
  triSegEquilibriumByLandState: number;
  slsResidualByMechanicalGeometry: number | null;
  hydraulicMomentumBySlsState: number | null;
  triSegEquilibriumBySlsState: number | null;
  minimumRequiredScaledMagnitude: number;
  allRequiredBlocksNonzero: boolean;
  slsBlockPhysicallyAbsent: boolean;
}>;

export type PhaseB1EventFreeGlobalJacobianAuditV1 = Readonly<{
  auditId: typeof PHASE_B1_EVENT_FREE_GLOBAL_JACOBIAN_AUDIT_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  unknownCount: 51 | 46;
  residualCount: 51 | 46;
  dtSec: number;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  modelId: PhaseB1EventFreeMonolithicModelV1["modelId"];
  wallMaterialBindingSha256: string;
  newtonScaleRegistryContentSha256: string;
  numericalPolicyId:
    typeof PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.policyId;
  unknownLabels: readonly string[];
  residualLabels: readonly string[];
  scaledDirection: readonly number[];
  algorithmicJacobian: ScaledFivePointAlgorithmicJacobianV1;
  directionalAudit: ScaledFivePointJacobianDirectionalAuditV1;
  crossBlocks: PhaseB1EventFreeGlobalJacobianCrossBlocksV1;
  directionalRelativeTwoNormTolerance: number;
  baseScaledResidualInfinityNorm: number;
  baseScaledResidualTolerance: number;
  acceptedBaseResidualVerified: boolean;
  semismoothDirectionalConsistencyAuditAccepted: boolean;
  crossBlockNonzeroAuditAccepted: boolean;
  accepted: boolean;
  generalizedActiveSetFrozenAtAcceptedBase: true;
  nonlinearResidualUsedAsIndependentKinkOracle: false;
  independentStencilUsesSameFrozenSemismoothMap: true;
  constitutivePartialsIndependentlyValidatedByThisAudit: false;
  testReferenceOnly: true;
  phaseB1Acceptance: false;
  releaseRuntimeReachable: false;
}>;

export function evaluatePhaseB1EventFreeEndpointV1(
  model: PhaseB1EventFreeMonolithicModelV1,
  wallMaterialBinding: PhaseB1WallMaterialBindingV1,
  endpoint: PhaseB1EndpointStateV1,
): PhaseB1EventFreeEndpointEvaluationV1 {
  validateModelBoundary(model);
  validateBindingAgainstModel(wallMaterialBinding);
  encodePhaseB1EndpointTopologyVectorsV1(endpoint);
  const endpointSnapshot = createPhaseB1EndpointStateV1({
    timeSec: endpoint.timeSec,
    differentialState: endpoint.differentialState,
    triSegCoordinates: endpoint.triSegCoordinates,
  });
  const vectors = encodePhaseB1EndpointTopologyVectorsV1(endpointSnapshot);
  const differential = endpointSnapshot.differentialState;
  const freeCalciumUMByWall = wallRecord((wallId) => {
    const calcium = differential.calciumByWall[wallId];
    const material = assertPhaseB1WallRuntimeMaterialV1(
      wallMaterialBinding.runtimeByWall[wallId],
    );
    return evaluateExactEventCalciumV1(
      [calcium.r, calcium.d],
      material.prescribedCalciumParameters,
    ).freeCalciumUM;
  });
  const materialMutable: Partial<Record<
    FourChamberWallId,
    PhaseB1WallMaterialStateEvaluationV1
  >> = {};
  const closedLoop = evaluateFourChamberClosedLoopSameTimeLevelV1({
    ...model.closedLoopParameters,
    state: Object.freeze({
      timeSec: endpointSnapshot.timeSec,
      bloodVolumesM3: differential.bloodVolumesM3,
      inertialFlowsM3PerSec: differential.inertialFlowsM3PerSec,
      triSegCoordinates: endpointSnapshot.triSegCoordinates,
    }),
    evaluateWall: ({
      wallId,
      fiberLogStrain,
      wallReferenceMaterialVolumeM3,
    }) => {
      const material = assertPhaseB1WallRuntimeMaterialV1(
        wallMaterialBinding.runtimeByWall[wallId],
      );
      const alphaV = differential.slsMode === "on"
        ? differential.slsAlphaVByWall[wallId]
        : null;
      const evaluation = evaluatePhaseB1WallMaterialStateV1({
        wallMaterial: material,
        fiberLogStrain,
        freeCalciumUM: freeCalciumUMByWall[wallId],
        landState: differential.landByWall[wallId],
        slsMode: differential.slsMode,
        alphaV,
      });
      materialMutable[wallId] = evaluation;
      const slsStoredEnergyJ = wallReferenceMaterialVolumeM3
        * evaluation.sls.storedEnergyDensityJPerM3;
      const slsPhysicalDissipationW = evaluation.sls.mode === "on"
        ? wallReferenceMaterialVolumeM3
          * evaluation.sls.overstressPa * evaluation.sls.overstressPa
          / (
            material.passiveSls.compiledSls.EVPa
            * material.passiveSls.compiledSls.tauSec
          )
        : 0;
      return Object.freeze({
        equilibriumPassive: evaluation.passive,
        activeKirchhoffStressPa: evaluation.wallActiveKirchhoffStressPa,
        // Land has no explicit time dependence at fixed material state. Its
        // state/geometry dependence remains inside the monolithic residual.
        activeStressTimeDerivativePaPerSec: 0,
        slsOverstressPa: evaluation.sls.overstressPa,
        slsStoredEnergyJ,
        slsPhysicalDissipationW,
        totalKirchhoffStressPa: evaluation.totalWallKirchhoffStressPa,
        totalTangentAtFixedInternalStatePa:
          evaluation.totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
      });
    },
  });
  const wallMaterialByWall = wallRecord((wallId) => {
    const material = materialMutable[wallId];
    if (material === undefined) {
      throw new Error(`closed-loop assembly did not evaluate wall ${wallId}`);
    }
    assertClose(
      material.totalWallKirchhoffStressPa,
      closedLoop.wallMechanics[wallId].totalKirchhoffStressPa,
      `${wallId}.shared total stress`,
    );
    return material;
  });
  if (vectors.slsMode !== differential.slsMode) {
    throw new Error("Phase B1 endpoint topology mode drifted during evaluation");
  }
  return Object.freeze({
    evaluationId: "phase-b1-event-free-same-time-level-evaluation-v1",
    endpoint: endpointSnapshot,
    freeCalciumUMByWall,
    wallMaterialByWall,
    closedLoop,
    explicitActiveStressTimeDerivativeAtFixedStatePaPerSecByWall:
      wallRecord(() => 0 as const),
    projectionApplied: false,
    hiddenStateClippingApplied: false,
  });
}

export function stepPhaseB1EventFreeMonolithicBackwardEulerV1(
  input: PhaseB1EventFreeMonolithicStepInputV1,
): PhaseB1EventFreeMonolithicStepResultV1 {
  assertExactPlainRecordV1(
    input,
    ["model", "wallMaterialBinding", "previousEndpoint", "dtSec"],
    "Phase B1 event-free monolithic step input",
  );
  validateModelBoundary(input.model);
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  encodePhaseB1EndpointTopologyVectorsV1(
    input.previousEndpoint,
  );
  const previousEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  const previousVectors = encodePhaseB1EndpointTopologyVectorsV1(
    previousEndpoint,
  );
  validateBindingAgainstModel(input.wallMaterialBinding);
  const slsMode = previousVectors.slsMode;
  const layout = buildLayout(
    input.model.newtonScaleRegistry,
    slsMode,
  );
  const calciumDriveStateByWallAtEndLeftLimit = propagateCalciumByWall(
    previousEndpoint.differentialState.calciumByWall,
    input.wallMaterialBinding,
    dtSec,
  );
  const nextTimeSec = previousEndpoint.timeSec + dtSec;
  const previousEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    input.wallMaterialBinding,
    previousEndpoint,
  );
  const initialUnknowns = Object.freeze([
    ...previousVectors.nonCalciumDifferentialState,
    ...previousVectors.algebraicState,
  ]);
  assertInsidePhaseB1LandSimplexNewtonDomainV1(
    initialUnknowns,
    layout.landDomain,
  );
  const decodeEndpoint = (unknowns: readonly number[]) =>
    decodePhaseB1EndpointTopologyVectorsV1({
      timeSec: nextTimeSec,
      slsMode,
      calciumByWall: calciumDriveStateByWallAtEndLeftLimit,
      nonCalciumDifferentialState: unknowns.slice(0, -2),
      algebraicState: unknowns.slice(-2),
    });
  const evaluateResidual = (unknowns: readonly number[]) =>
    evaluateMonolithicResidual(
      input.model,
      input.wallMaterialBinding,
      previousEndpoint,
      previousEvaluation,
      decodeEndpoint(unknowns),
      dtSec,
    );
  let retainedAcceptedBaseJacobian:
    | Readonly<{
      unknowns: readonly number[];
      rawTriSegRows: readonly [readonly number[], readonly number[]];
    }>
    | null = null;
  const newton = solveScaledDampedNewtonV1({
    initialUnknowns,
    unknownScales: layout.unknownScales,
    residualScales: layout.residualScales,
    strictLowerBounds: layout.strictLowerBounds,
    strictAffineConstraints: layout.landDomain.strictAffineConstraints,
    options: {
      maxIterations:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.maxNewtonIterations,
      residualInfinityTolerance:
        input.model.newtonScaleRegistry.tolerances.globalResidualInfinityNorm,
      updateInfinityTolerance:
        input.model.newtonScaleRegistry.tolerances.globalUpdateInfinityNorm,
      armijoCoefficient:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.armijoCoefficient,
      lineSearchContraction:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.lineSearchContraction,
      maxLineSearchBacktracks:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.maxLineSearchBacktracks,
      minimumStepLength:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.minimumStepLength,
      fractionToBoundarySafety:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.fractionToBoundarySafety,
      relativePivotTolerance:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.relativePivotTolerance,
    },
    evaluate: (unknowns, context) => {
      let residualEvaluation: PhaseB1EventFreeResidualEvaluationV1;
      try {
        residualEvaluation = evaluateResidual(unknowns);
      } catch (error) {
        return {
          status: "inadmissible" as const,
          reason: errorMessage(error),
        };
      }
      try {
        const baseEndpoint = residualEvaluation.nextEndpoint;
        const semismoothResidualOnly = (trialUnknowns: readonly number[]) =>
          evaluateSemismoothLinearizedMonolithicResidual(
            input.model,
            input.wallMaterialBinding,
            previousEndpoint,
            baseEndpoint,
            residualEvaluation,
            decodeEndpoint(trialUnknowns),
            dtSec,
          );
        assertResidualsRoundoffEqual(
          semismoothResidualOnly(unknowns),
          residualEvaluation.residual,
          "semismooth linearization base residual",
        );
        const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
          semismoothResidualOnly,
          unknowns,
          {
            unknownScales: layout.unknownScales,
            residualScales: layout.residualScales,
            lowerBounds: layout.strictLowerBounds,
            strictAffineConstraints:
              layout.landDomain.strictAffineConstraints,
            scaledStep:
              PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
                .algorithmicJacobianScaledStep,
          },
        );
        const rawJacobianRowMajor = jacobian.rawJacobian.flat();
        if (context.phase === "newton") {
          const rowA = layout.unknownCount - 2;
          const rowB = layout.unknownCount - 1;
          retainedAcceptedBaseJacobian = Object.freeze({
            unknowns: Object.freeze(Array.from(unknowns)),
            rawTriSegRows: Object.freeze([
              Object.freeze(Array.from(jacobian.rawJacobian[rowA])),
              Object.freeze(Array.from(jacobian.rawJacobian[rowB])),
            ] as const),
          });
        }
        return {
          status: "ok" as const,
          residual: residualEvaluation.residual,
          jacobianRowMajor: rawJacobianRowMajor,
          diagnostic: Object.freeze({
            triSegResidualNPerM:
              getRuntimeTriSegEquilibriumResidualV2(
                residualEvaluation.nextEvaluation.closedLoop,
              ).euclideanNPerM,
            minimumLandSimplexMargin:
              minimumPhaseB1LandSimplexMarginV1(
                unknowns,
                layout.landDomain,
              ),
          }),
        };
      } catch (error) {
        return {
          status: "failed" as const,
          reason: errorMessage(error),
        };
      }
    },
  });

  if (newton.converged === false) {
    let lastAcceptedDiagnosticEndpoint: PhaseB1EndpointStateV1 | null = null;
    try {
      lastAcceptedDiagnosticEndpoint = decodeEndpoint(
        newton.lastAcceptedUnknowns,
      );
    } catch {
      lastAcceptedDiagnosticEndpoint = null;
    }
    return failureResult(
      slsMode,
      layout.unknownCount,
      newton.reason,
      newton.message,
      previousEndpoint,
      lastAcceptedDiagnosticEndpoint,
      newton.diagnostics,
    );
  }

  try {
    const nextEndpointLeftLimit = decodeEndpoint(newton.unknowns);
    const residualEvaluation = evaluateMonolithicResidual(
      input.model,
      input.wallMaterialBinding,
      previousEndpoint,
      previousEvaluation,
      nextEndpointLeftLimit,
      dtSec,
    );
    const minimumLandSimplexMargin = minimumPhaseB1LandSimplexMarginV1(
      newton.unknowns,
      layout.landDomain,
    );
    if (!(minimumLandSimplexMargin > 0)) {
      throw new Error("accepted Land state is not strictly inside its simplex");
    }
    if (
      retainedAcceptedBaseJacobian === null
      || !vectorsExactlyEqual(
        retainedAcceptedBaseJacobian.unknowns,
        newton.unknowns,
      )
    ) {
      throw new Error(
        "accepted Newton base lost its canonical TriSeg Jacobian rows",
      );
    }
    const acceptedNewtonBaseTriSegConstraintJacobianRows =
      issueAcceptedNewtonBaseTriSegConstraintJacobianRows({
        model: input.model,
        wallMaterialBinding: input.wallMaterialBinding,
        previousEndpoint,
        nextEndpointLeftLimit,
        dtSec,
        slsMode,
        unknownCount: layout.unknownCount,
        rawTriSegRows: retainedAcceptedBaseJacobian.rawTriSegRows,
      });
    const totalBloodVolumeChangeM3 = sumBloodVolumes(
      nextEndpointLeftLimit.differentialState.bloodVolumesM3,
    ) - sumBloodVolumes(
      previousEndpoint.differentialState.bloodVolumesM3,
    );
    return Object.freeze({
      converged: true,
      solverId: PHASE_B1_EVENT_FREE_MONOLITHIC_BE_V1_ID,
      slsMode,
      unknownCount: layout.unknownCount,
      residualCount: layout.unknownCount,
      calciumStoredStateCount: 10,
      calciumNewtonUnknownCount: 0,
      calciumResidualCount: 0,
      previousEndpoint,
      nextEndpointLeftLimit,
      calciumDriveStateByWallAtEndLeftLimit,
      previousEvaluation,
      nextEvaluation: residualEvaluation.nextEvaluation,
      residualEvaluation,
      acceptedNewtonBaseTriSegConstraintJacobianRows,
      newtonDiagnostics: newton.diagnostics,
      minimumLandSimplexMargin,
      totalBloodVolumeChangeM3,
      fullLandGeometryAndHydraulicCrossCouplingAssemblyImplemented: true,
      semismoothDirectionalConsistencyAuditCompleted: false,
      crossBlockNonzeroAuditCompleted: false,
      algorithmicJacobian:
        "semismooth-constitutive-linearization-scaled-five-point-full-system-reference",
      eventFree: true,
      innerLandSolveUsed: false,
      projectionApplied: false,
      hiddenStateClippingApplied: false,
      postStepBloodVolumeProjectionApplied: false,
      flowClampApplied: false,
      wholeHeartLandEnergyAuditCompleted: false,
      differentiatedLandKinematicsAuditCompleted: false,
      phaseB1Acceptance: false,
      testReferenceOnly: true,
      releaseRuntimeReachable: false,
    });
  } catch (error) {
    return failureResult(
      slsMode,
      layout.unknownCount,
      "final-evaluation-failed",
      errorMessage(error),
      previousEndpoint,
      null,
      newton.diagnostics,
    );
  }
}

/**
 * Independently audits the accepted-base generalized Jacobian used by the B1
 * test reference. Both construction and directional differencing operate on
 * the same frozen active-set semismooth map; the nonlinear residual is not a
 * valid centered-difference oracle at Land's declared kink ties.
 */
export function auditPhaseB1EventFreeMonolithicGlobalJacobianV1(
  input: PhaseB1EventFreeGlobalJacobianAuditInputV1,
): PhaseB1EventFreeGlobalJacobianAuditV1 {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "nextEndpointLeftLimit",
    "dtSec",
  ], "Phase B1 event-free global Jacobian audit input");
  validateModelBoundary(input.model);
  validateBindingAgainstModel(input.wallMaterialBinding);
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  const previousEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  const nextEndpointLeftLimit = createPhaseB1EndpointStateV1({
    timeSec: input.nextEndpointLeftLimit.timeSec,
    differentialState: input.nextEndpointLeftLimit.differentialState,
    triSegCoordinates: input.nextEndpointLeftLimit.triSegCoordinates,
  });
  assertRoundoffEqual(
    nextEndpointLeftLimit.timeSec,
    previousEndpoint.timeSec + dtSec,
    "global Jacobian audit endpoint time",
  );
  const previousVectors = encodePhaseB1EndpointTopologyVectorsV1(
    previousEndpoint,
  );
  const nextVectors = encodePhaseB1EndpointTopologyVectorsV1(
    nextEndpointLeftLimit,
  );
  if (previousVectors.slsMode !== nextVectors.slsMode) {
    throw new Error("global Jacobian audit cannot change SLS topology");
  }
  const expectedCalcium = propagateCalciumByWall(
    previousEndpoint.differentialState.calciumByWall,
    input.wallMaterialBinding,
    dtSec,
  );
  for (const wallId of WALL_IDS) {
    assertRoundoffEqual(
      nextEndpointLeftLimit.differentialState.calciumByWall[wallId].r,
      expectedCalcium[wallId].r,
      `${wallId} left-limit calcium r`,
    );
    assertRoundoffEqual(
      nextEndpointLeftLimit.differentialState.calciumByWall[wallId].d,
      expectedCalcium[wallId].d,
      `${wallId} left-limit calcium d`,
    );
  }
  const slsMode = nextVectors.slsMode;
  const layout = buildLayout(input.model.newtonScaleRegistry, slsMode);
  const unknowns = Object.freeze([
    ...nextVectors.nonCalciumDifferentialState,
    ...nextVectors.algebraicState,
  ]);
  assertInsidePhaseB1LandSimplexNewtonDomainV1(unknowns, layout.landDomain);
  const previousEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    input.wallMaterialBinding,
    previousEndpoint,
  );
  const baseResidual = evaluateMonolithicResidual(
    input.model,
    input.wallMaterialBinding,
    previousEndpoint,
    previousEvaluation,
    nextEndpointLeftLimit,
    dtSec,
  );
  const baseScaledResidualInfinityNorm = Math.max(
    ...baseResidual.residual.map((value, row) =>
      Math.abs(value / layout.residualScales[row])),
  );
  const baseScaledResidualTolerance = input.model.newtonScaleRegistry
    .tolerances.globalResidualInfinityNorm;
  const acceptedBaseResidualVerified =
    baseScaledResidualInfinityNorm <= baseScaledResidualTolerance;
  const decodeTrial = (trialUnknowns: readonly number[]) =>
    decodePhaseB1EndpointTopologyVectorsV1({
      timeSec: nextEndpointLeftLimit.timeSec,
      slsMode,
      calciumByWall: expectedCalcium,
      nonCalciumDifferentialState: trialUnknowns.slice(0, -2),
      algebraicState: trialUnknowns.slice(-2),
    });
  const semismoothResidual = (trialUnknowns: readonly number[]) =>
    evaluateSemismoothLinearizedMonolithicResidual(
      input.model,
      input.wallMaterialBinding,
      previousEndpoint,
      nextEndpointLeftLimit,
      baseResidual,
      decodeTrial(trialUnknowns),
      dtSec,
    );
  assertResidualsRoundoffEqual(
    semismoothResidual(unknowns),
    baseResidual.residual,
    "global Jacobian audit base residual",
  );
  const jacobianOptions = Object.freeze({
    unknownScales: layout.unknownScales,
    residualScales: layout.residualScales,
    lowerBounds: layout.strictLowerBounds,
    strictAffineConstraints: layout.landDomain.strictAffineConstraints,
    scaledStep:
      PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
        .algorithmicJacobianScaledStep,
  });
  const algorithmicJacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
    semismoothResidual,
    unknowns,
    jacobianOptions,
  );
  const directionPattern = [-3, -2, -1, 0.5, 1, 2, 3] as const;
  const scaledDirection = Object.freeze(unknowns.map((_, index) =>
    directionPattern[index % directionPattern.length]));
  let independentScaledStep = jacobianOptions.scaledStep
    * PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .independentDirectionalAuditStepRatioToConstruction;
  let directionalAudit: ScaledFivePointJacobianDirectionalAuditV1 | null = null;
  for (let halving = 0; halving <= 24; halving += 1) {
    try {
      directionalAudit = auditScaledFivePointAlgorithmicJacobianDirectionV1(
        semismoothResidual,
        unknowns,
        scaledDirection,
        algorithmicJacobian,
        jacobianOptions,
        independentScaledStep,
      );
      break;
    } catch (error) {
      if (
        halving === 24
        || !errorMessage(error).includes(
          "Independent directional stencil violates the declared domain",
        )
      ) {
        throw error;
      }
      independentScaledStep *= 0.5;
    }
  }
  if (directionalAudit === null) {
    throw new Error("global Jacobian directional audit did not produce a result");
  }

  const unknownLabels = buildPhaseB1NewtonUnknownLabelsV1(slsMode);
  const residualLabels = buildPhaseB1NewtonResidualLabelsV1(slsMode);
  const mechanicalGeometryColumns = indicesMatching(unknownLabels, (label) =>
    label === "circulation.volume.V_LA"
    || label === "circulation.volume.V_LV"
    || label === "circulation.volume.V_RA"
    || label === "circulation.volume.V_RV"
    || label === "algebraic.triseg.V_m_S"
    || label === "algebraic.triseg.y_m");
  const landColumns = indicesMatching(unknownLabels, (label) =>
    label.includes(".land."));
  const slsColumns = indicesMatching(unknownLabels, (label) =>
    label.includes(".sls."));
  const landRows = indicesMatching(residualLabels, (label) =>
    label.includes(".land."));
  const slsRows = indicesMatching(residualLabels, (label) =>
    label.includes(".sls."));
  const hydraulicRows = indicesMatching(residualLabels, (label) =>
    label.startsWith("residual.circulation.flow."));
  const triSegRows = indicesMatching(residualLabels, (label) =>
    label.startsWith("residual.triseg.equilibrium."));
  const requiredScaledMagnitude =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .minimumRequiredScaledCrossBlockMagnitude;
  const landResidualByMechanicalGeometry = maximumAbsoluteMatrixBlock(
    algorithmicJacobian.scaledJacobian,
    landRows,
    mechanicalGeometryColumns,
  );
  const hydraulicMomentumByLandState = maximumAbsoluteMatrixBlock(
    algorithmicJacobian.scaledJacobian,
    hydraulicRows,
    landColumns,
  );
  const triSegEquilibriumByLandState = maximumAbsoluteMatrixBlock(
    algorithmicJacobian.scaledJacobian,
    triSegRows,
    landColumns,
  );
  const slsResidualByMechanicalGeometry = slsMode === "on"
    ? maximumAbsoluteMatrixBlock(
      algorithmicJacobian.scaledJacobian,
      slsRows,
      mechanicalGeometryColumns,
    )
    : null;
  const hydraulicMomentumBySlsState = slsMode === "on"
    ? maximumAbsoluteMatrixBlock(
      algorithmicJacobian.scaledJacobian,
      hydraulicRows,
      slsColumns,
    )
    : null;
  const triSegEquilibriumBySlsState = slsMode === "on"
    ? maximumAbsoluteMatrixBlock(
      algorithmicJacobian.scaledJacobian,
      triSegRows,
      slsColumns,
    )
    : null;
  const requiredBlockMagnitudes = [
    landResidualByMechanicalGeometry,
    hydraulicMomentumByLandState,
    triSegEquilibriumByLandState,
    ...(slsMode === "on"
      ? [
        requireFinite(
          slsResidualByMechanicalGeometry,
          "slsResidualByMechanicalGeometry",
        ),
        requireFinite(
          hydraulicMomentumBySlsState,
          "hydraulicMomentumBySlsState",
        ),
        requireFinite(
          triSegEquilibriumBySlsState,
          "triSegEquilibriumBySlsState",
        ),
      ]
      : []),
  ];
  const slsBlockPhysicallyAbsent = slsMode === "off"
    && slsRows.length === 0
    && slsColumns.length === 0;
  const allRequiredBlocksNonzero = requiredBlockMagnitudes.every(
    (value) => value > requiredScaledMagnitude,
  ) && (slsMode === "on" || slsBlockPhysicallyAbsent);
  const crossBlocks = Object.freeze({
    landResidualByMechanicalGeometry,
    hydraulicMomentumByLandState,
    triSegEquilibriumByLandState,
    slsResidualByMechanicalGeometry,
    hydraulicMomentumBySlsState,
    triSegEquilibriumBySlsState,
    minimumRequiredScaledMagnitude: requiredScaledMagnitude,
    allRequiredBlocksNonzero,
    slsBlockPhysicallyAbsent,
  });
  const directionalRelativeTwoNormTolerance =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .semismoothDirectionalConsistencyRelativeTwoNormTolerance;
  const semismoothDirectionalConsistencyAuditAccepted =
    directionalAudit.relativeTwoNormDifference
      < directionalRelativeTwoNormTolerance;
  return Object.freeze({
    auditId: PHASE_B1_EVENT_FREE_GLOBAL_JACOBIAN_AUDIT_V1_ID,
    slsMode,
    unknownCount: layout.unknownCount,
    residualCount: layout.unknownCount,
    dtSec,
    previousEndpoint,
    nextEndpointLeftLimit,
    modelId: input.model.modelId,
    wallMaterialBindingSha256: input.wallMaterialBinding.contentSha256,
    newtonScaleRegistryContentSha256:
      input.model.newtonScaleRegistry.registryContentSha256,
    numericalPolicyId:
      PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.policyId,
    unknownLabels,
    residualLabels,
    scaledDirection,
    algorithmicJacobian,
    directionalAudit,
    crossBlocks,
    directionalRelativeTwoNormTolerance,
    baseScaledResidualInfinityNorm,
    baseScaledResidualTolerance,
    acceptedBaseResidualVerified,
    semismoothDirectionalConsistencyAuditAccepted,
    crossBlockNonzeroAuditAccepted: allRequiredBlocksNonzero,
    accepted:
      acceptedBaseResidualVerified
      && semismoothDirectionalConsistencyAuditAccepted
      && allRequiredBlocksNonzero,
    generalizedActiveSetFrozenAtAcceptedBase: true,
    nonlinearResidualUsedAsIndependentKinkOracle: false,
    independentStencilUsesSameFrozenSemismoothMap: true,
    constitutivePartialsIndependentlyValidatedByThisAudit: false,
    testReferenceOnly: true,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
}

function evaluateMonolithicResidual(
  model: PhaseB1EventFreeMonolithicModelV1,
  binding: PhaseB1WallMaterialBindingV1,
  previousEndpoint: PhaseB1EndpointStateV1,
  previousEvaluation: PhaseB1EventFreeEndpointEvaluationV1,
  nextEndpoint: PhaseB1EndpointStateV1,
  dtSec: number,
): PhaseB1EventFreeResidualEvaluationV1 {
  const previous = previousEndpoint.differentialState;
  const next = nextEndpoint.differentialState;
  if (previous.slsMode !== next.slsMode) {
    throw new Error("SLS topology cannot change within a monolithic step");
  }
  const nextEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    model,
    binding,
    nextEndpoint,
  );
  const volumeResidual = evaluateFourChamberBackwardEulerVolumeResidualV1({
    previousVolumesM3: previous.bloodVolumesM3,
    nextVolumesM3: next.bloodVolumesM3,
    nextFlowsM3PerSec: nextEvaluation.closedLoop.allFlowsM3PerSec,
    dtSec,
  });
  const momentumResidualPaByFlow = inertialRecord((flowId) => {
    const momentum = nextEvaluation.closedLoop.inertialMomentum[flowId];
    const inertancePaSec2PerM3 = flowId === "Q_VC" || flowId === "Q_PV"
      ? model.closedLoopParameters.inletLossParametersByFlow[flowId]
        .inertancePaSec2PerM3
      : (momentum as ValveMomentumOutputV1).inertancePaSec2PerM3;
    return requireFinite(
      inertancePaSec2PerM3
        * (
          next.inertialFlowsM3PerSec[flowId]
          - previous.inertialFlowsM3PerSec[flowId]
        ) / dtSec
        - momentum.pressureGradientPa
        + momentum.signedLossPressurePa,
      `momentumResidualPaByFlow.${flowId}`,
    );
  });
  const wallBackwardEulerByWall = wallRecord((wallId) => {
    const material = assertPhaseB1WallRuntimeMaterialV1(
      binding.runtimeByWall[wallId],
    );
    return evaluatePhaseB1WallBackwardEulerV1({
      wallMaterial: material,
      previousFiberLogStrain:
        previousEvaluation.wallMaterialByWall[wallId].fiberLogStrain,
      nextFiberLogStrain:
        nextEvaluation.wallMaterialByWall[wallId].fiberLogStrain,
      endpointFreeCalciumUM: nextEvaluation.freeCalciumUMByWall[wallId],
      previousLandState: previous.landByWall[wallId],
      nextLandState: next.landByWall[wallId],
      slsMode: next.slsMode,
      previousAlphaV: previous.slsMode === "on"
        ? previous.slsAlphaVByWall[wallId]
        : null,
      nextAlphaV: next.slsMode === "on"
        ? next.slsAlphaVByWall[wallId]
        : null,
      dtSec,
    });
  });
  const landResidualPerSecByWall = wallRecord((wallId) => Object.freeze(
    wallBackwardEulerByWall[wallId].landResidual.map((value) =>
      requireFinite(value / dtSec, `${wallId}.landResidualPerSec`)),
  ));
  const slsResidualPerSecByWall = next.slsMode === "on"
    ? wallRecord((wallId) => requireFinite(
      requireFinite(
        wallBackwardEulerByWall[wallId].slsResidual,
        `${wallId}.slsResidual`,
      ) / dtSec,
      `${wallId}.slsResidualPerSec`,
    ))
    : null;
  const runtimeTriSegResidual = getRuntimeTriSegEquilibriumResidualV2(
    nextEvaluation.closedLoop,
  );
  const triSegResidualNPerM = Object.freeze({
    axial: runtimeTriSegResidual.axialNPerM,
    radial: runtimeTriSegResidual.radialNPerM,
  });
  const residual = Object.freeze([
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      volumeResidual.residualsM3PerSec[id]),
    ...INERTIAL_FLOW_IDS.map((id) => momentumResidualPaByFlow[id]),
    ...WALL_IDS.flatMap((wallId) => landResidualPerSecByWall[wallId]),
    ...(slsResidualPerSecByWall === null
      ? []
      : WALL_IDS.map((wallId) => slsResidualPerSecByWall[wallId])),
    triSegResidualNPerM.axial,
    triSegResidualNPerM.radial,
  ]);
  const residualLabels = buildPhaseB1NewtonResidualLabelsV1(next.slsMode);
  if (residual.length !== residualLabels.length) {
    throw new Error("Phase B1 monolithic residual dimension drifted");
  }
  residual.forEach((value, index) => requireFinite(value, `residual[${index}]`));
  return Object.freeze({
    residual,
    residualLabels,
    volumeResidual,
    momentumResidualPaByFlow,
    wallBackwardEulerByWall,
    landResidualPerSecByWall,
    slsResidualPerSecByWall,
    triSegResidualNPerM,
    nextEndpoint,
    nextEvaluation,
    calciumResidualCount: 0,
    innerLandSolveUsed: false,
    projectionApplied: false,
    hiddenStateClippingApplied: false,
  });
}

/**
 * Evaluates the global residual map used only to construct a generalized
 * Jacobian at `baseEndpoint`. Smooth geometry and flow terms are reevaluated
 * at the trial state, while each wall's stress and BE material rows use the
 * exact generalized partials frozen at the base active set. This prevents a
 * centered finite-difference stencil from averaging across Land's declared
 * cap, plateau, positive-part, or absolute-value tie branches.
 */
function evaluateSemismoothLinearizedMonolithicResidual(
  model: PhaseB1EventFreeMonolithicModelV1,
  binding: PhaseB1WallMaterialBindingV1,
  previousEndpoint: PhaseB1EndpointStateV1,
  baseEndpoint: PhaseB1EndpointStateV1,
  baseResidual: PhaseB1EventFreeResidualEvaluationV1,
  trialEndpoint: PhaseB1EndpointStateV1,
  dtSec: number,
): readonly number[] {
  const previous = previousEndpoint.differentialState;
  const base = baseEndpoint.differentialState;
  const trial = trialEndpoint.differentialState;
  if (base.slsMode !== trial.slsMode || previous.slsMode !== trial.slsMode) {
    throw new Error("SLS topology cannot change in a semismooth linearization");
  }

  const trialClosedLoop = evaluateFourChamberClosedLoopSameTimeLevelV1({
    ...model.closedLoopParameters,
    state: Object.freeze({
      timeSec: trialEndpoint.timeSec,
      bloodVolumesM3: trial.bloodVolumesM3,
      inertialFlowsM3PerSec: trial.inertialFlowsM3PerSec,
      triSegCoordinates: trialEndpoint.triSegCoordinates,
    }),
    evaluateWall: ({
      wallId,
      fiberLogStrain,
      wallReferenceMaterialVolumeM3,
    }) => {
      const material = assertPhaseB1WallRuntimeMaterialV1(
        binding.runtimeByWall[wallId],
      );
      const trialAlpha = trial.slsMode === "on"
        ? trial.slsAlphaVByWall[wallId]
        : null;
      const trialMaterial = evaluatePhaseB1WallMaterialStateV1({
        wallMaterial: material,
        fiberLogStrain,
        freeCalciumUM:
          baseResidual.nextEvaluation.freeCalciumUMByWall[wallId],
        landState: trial.landByWall[wallId],
        slsMode: trial.slsMode,
        alphaV: trialAlpha,
      });
      const baseMaterial =
        baseResidual.nextEvaluation.wallMaterialByWall[wallId];
      const baseLand = base.landByWall[wallId];
      const trialLand = trial.landByWall[wallId];
      const landIncrementStressPa = baseMaterial
        .totalStressPartialsPaByLandState.reduce(
          (sum, partial, index) =>
            sum + partial * (trialLand[index] - baseLand[index]),
          0,
        );
      const strainIncrementStressPa =
        baseMaterial.totalStressPartialPaPerFiberLogStrainAtFixedInternalState
        * (fiberLogStrain - baseMaterial.fiberLogStrain);
      const alphaIncrementStressPa = trial.slsMode === "on"
        ? requireFinite(
          baseMaterial.totalStressPartialPaPerAlphaV,
          `${wallId}.baseStressPartialByAlphaV`,
        ) * (
          trial.slsAlphaVByWall[wallId]
          - (base.slsMode === "on"
            ? base.slsAlphaVByWall[wallId]
            : unreachableSlsMode())
        )
        : 0;
      const totalKirchhoffStressPa = requireFinite(
        baseMaterial.totalWallKirchhoffStressPa
          + strainIncrementStressPa
          + landIncrementStressPa
          + alphaIncrementStressPa,
        `${wallId}.semismoothLinearizedTotalStressPa`,
      );
      const slsStoredEnergyJ = wallReferenceMaterialVolumeM3
        * trialMaterial.sls.storedEnergyDensityJPerM3;
      const slsPhysicalDissipationW = trialMaterial.sls.mode === "on"
        ? wallReferenceMaterialVolumeM3
          * trialMaterial.sls.overstressPa * trialMaterial.sls.overstressPa
          / (
            material.passiveSls.compiledSls.EVPa
            * material.passiveSls.compiledSls.tauSec
          )
        : 0;
      return Object.freeze({
        equilibriumPassive: trialMaterial.passive,
        activeKirchhoffStressPa: trialMaterial.wallActiveKirchhoffStressPa,
        activeStressTimeDerivativePaPerSec: 0,
        slsOverstressPa: trialMaterial.sls.overstressPa,
        slsStoredEnergyJ,
        slsPhysicalDissipationW,
        totalKirchhoffStressPa,
        totalTangentAtFixedInternalStatePa:
          baseMaterial.totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
      });
    },
  });

  const volumeResidual = evaluateFourChamberBackwardEulerVolumeResidualV1({
    previousVolumesM3: previous.bloodVolumesM3,
    nextVolumesM3: trial.bloodVolumesM3,
    nextFlowsM3PerSec: trialClosedLoop.allFlowsM3PerSec,
    dtSec,
  });
  const momentumResidualPaByFlow = inertialRecord((flowId) => {
    const momentum = trialClosedLoop.inertialMomentum[flowId];
    const inertancePaSec2PerM3 = flowId === "Q_VC" || flowId === "Q_PV"
      ? model.closedLoopParameters.inletLossParametersByFlow[flowId]
        .inertancePaSec2PerM3
      : (momentum as ValveMomentumOutputV1).inertancePaSec2PerM3;
    return requireFinite(
      inertancePaSec2PerM3
        * (
          trial.inertialFlowsM3PerSec[flowId]
          - previous.inertialFlowsM3PerSec[flowId]
        ) / dtSec
        - momentum.pressureGradientPa
        + momentum.signedLossPressurePa,
      `semismoothMomentumResidualPaByFlow.${flowId}`,
    );
  });
  const landResidualPerSecByWall = wallRecord((wallId) => {
    const baseWall = baseResidual.wallBackwardEulerByWall[wallId];
    const baseLand = base.landByWall[wallId];
    const trialLand = trial.landByWall[wallId];
    const strainIncrement =
      trialClosedLoop.wallMechanics[wallId].fiberLogStrain
      - baseResidual.nextEvaluation.closedLoop.wallMechanics[wallId]
        .fiberLogStrain;
    if (
      baseWall.landResidual.length !== 6
      || baseWall.landStateJacobianRowMajor.length !== 36
      || baseWall.landResidualPartialByNextFiberLogStrain.length !== 6
    ) {
      throw new Error(`${wallId}.Land generalized block dimension drifted`);
    }
    return Object.freeze(baseWall.landResidual.map((baseValue, row) => {
      let value = baseValue
        + baseWall.landResidualPartialByNextFiberLogStrain[row]
          * strainIncrement;
      for (let column = 0; column < 6; column += 1) {
        value += baseWall.landStateJacobianRowMajor[row * 6 + column]
          * (trialLand[column] - baseLand[column]);
      }
      return requireFinite(
        value / dtSec,
        `${wallId}.semismoothLandResidualPerSec[${row}]`,
      );
    }));
  });
  const slsResidualPerSecByWall = trial.slsMode === "on"
    ? wallRecord((wallId) => {
      const baseWall = baseResidual.wallBackwardEulerByWall[wallId];
      const strainIncrement =
        trialClosedLoop.wallMechanics[wallId].fiberLogStrain
        - baseResidual.nextEvaluation.closedLoop.wallMechanics[wallId]
          .fiberLogStrain;
      const alphaIncrement = trial.slsAlphaVByWall[wallId]
        - (base.slsMode === "on"
          ? base.slsAlphaVByWall[wallId]
          : unreachableSlsMode());
      return requireFinite(
        (
          requireFinite(baseWall.slsResidual, `${wallId}.baseSlsResidual`)
          + requireFinite(
            baseWall.slsResidualPartialByNextFiberLogStrain,
            `${wallId}.baseSlsResidualPartialByStrain`,
          ) * strainIncrement
          + requireFinite(
            baseWall.slsResidualPartialByNextAlphaV,
            `${wallId}.baseSlsResidualPartialByAlphaV`,
          ) * alphaIncrement
        ) / dtSec,
        `${wallId}.semismoothSlsResidualPerSec`,
      );
    })
    : null;
  const runtimeTriSegResidual = getRuntimeTriSegEquilibriumResidualV2(
    trialClosedLoop,
  );
  const residual = Object.freeze([
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      volumeResidual.residualsM3PerSec[id]),
    ...INERTIAL_FLOW_IDS.map((id) => momentumResidualPaByFlow[id]),
    ...WALL_IDS.flatMap((wallId) => landResidualPerSecByWall[wallId]),
    ...(slsResidualPerSecByWall === null
      ? []
      : WALL_IDS.map((wallId) => slsResidualPerSecByWall[wallId])),
    runtimeTriSegResidual.axialNPerM,
    runtimeTriSegResidual.radialNPerM,
  ]);
  if (residual.length !== baseResidual.residual.length) {
    throw new Error("semismooth global residual dimension drifted");
  }
  residual.forEach((value, index) =>
    requireFinite(value, `semismoothResidual[${index}]`));
  return residual;
}

function assertResidualsRoundoffEqual(
  actual: readonly number[],
  expected: readonly number[],
  field: string,
): void {
  if (actual.length !== expected.length) {
    throw new Error(`${field} length mismatch`);
  }
  for (let index = 0; index < actual.length; index += 1) {
    const tolerance = 2048 * Number.EPSILON * Math.max(
      1,
      Math.abs(actual[index]),
      Math.abs(expected[index]),
    );
    if (Math.abs(actual[index] - expected[index]) > tolerance) {
      throw new Error(`${field}[${index}] disagrees with the nonlinear residual`);
    }
  }
}

function unreachableSlsMode(): never {
  throw new Error("unreachable SLS mode mismatch");
}

function buildLayout(
  registry: FourChamberNewtonScaleRegistryV1,
  slsMode: PhaseB1SlsModeV1,
) {
  const labels = buildPhaseB1NewtonUnknownLabelsV1(slsMode);
  const landDomain = buildPhaseB1LandSimplexNewtonDomainV1(slsMode);
  const unknownScales = labels.map((label) => scaleForLabel(label, registry));
  const residualScales = labels.map((label) => {
    if (label.startsWith("circulation.volume.")) {
      return deriveOdeResidualScalePerSec(scaleForLabel(label, registry));
    }
    if (label.startsWith("circulation.flow.")) {
      return registry.residualScales.flowMomentumPa;
    }
    if (label.includes(".land.") || label.includes(".sls.")) {
      return deriveOdeResidualScalePerSec(scaleForLabel(label, registry));
    }
    if (label.startsWith("algebraic.triseg.")) {
      return registry.residualScales.publishedTriSegEquilibriumNPerM;
    }
    throw new Error(`No Phase B1 residual scale for ${label}`);
  });
  const strictLowerBounds = [...landDomain.strictLowerBounds];
  for (let index = 0; index < BLOOD_COMPARTMENT_IDS.length; index += 1) {
    strictLowerBounds[index] =
      PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
        .strictBloodVolumeLowerBoundM3;
  }
  strictLowerBounds[strictLowerBounds.length - 1] =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .strictJunctionRadiusLowerBoundM;
  const unknownCount = labels.length as 51 | 46;
  if (
    unknownCount !== (slsMode === "on" ? 51 : 46)
    || residualScales.length !== unknownCount
    || strictLowerBounds.length !== unknownCount
  ) {
    throw new Error("Phase B1 event-free monolithic layout dimension drifted");
  }
  return Object.freeze({
    unknownCount,
    labels,
    unknownScales: Object.freeze(unknownScales),
    residualScales: Object.freeze(residualScales),
    strictLowerBounds: Object.freeze(strictLowerBounds),
    landDomain,
  });
}

function scaleForLabel(
  label: string,
  registry: FourChamberNewtonScaleRegistryV1,
): number {
  const volume = /^circulation\.volume\.V_(.+)$/.exec(label);
  if (volume !== null) {
    const id = volume[1] as keyof typeof registry.unknownScales.bloodVolumeM3;
    return registry.unknownScales.bloodVolumeM3[id];
  }
  if (label.startsWith("circulation.flow.")) {
    return registry.unknownScales.inertialFlowM3PerSec;
  }
  if (/\.land\.(CaTRPN|B|W|S)$/.test(label)) {
    return registry.unknownScales.calciumAndPopulation;
  }
  const distortion = /^tissue\.(LA|RA|LVFW|SEP|RVFW)\.patch-0\.land\.xi[WS]$/.exec(label);
  if (distortion !== null) {
    return registry.unknownScales.landDistortionByWall[
      distortion[1] as FourChamberWallId
    ];
  }
  if (label.endsWith(".sls.alphaV")) {
    return registry.unknownScales.slsViscousStrain;
  }
  if (label === "algebraic.triseg.V_m_S") {
    return registry.unknownScales.septalMidwallVolumeM3;
  }
  if (label === "algebraic.triseg.y_m") {
    return registry.unknownScales.junctionRadiusM;
  }
  throw new Error(`No Phase B1 unknown scale for ${label}`);
}

function propagateCalciumByWall(
  calciumAtStart: PhaseB1CalciumStateByWallV1,
  binding: PhaseB1WallMaterialBindingV1,
  dtSec: number,
): PhaseB1CalciumStateByWallV1 {
  return wallRecord((wallId) => {
    const state = calciumAtStart[wallId];
    const material = assertPhaseB1WallRuntimeMaterialV1(
      binding.runtimeByWall[wallId],
    );
    const propagated = propagateExactEventCalciumV1(
      [state.r, state.d],
      dtSec,
      material.prescribedCalciumParameters,
    );
    return Object.freeze({ r: propagated[0], d: propagated[1] });
  });
}

function issueAcceptedNewtonBaseTriSegConstraintJacobianRows(input: Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  dtSec: number;
  slsMode: PhaseB1SlsModeV1;
  unknownCount: 51 | 46;
  rawTriSegRows: readonly [readonly number[], readonly number[]];
}>): PhaseB1AcceptedNewtonBaseTriSegConstraintJacobianRowsV1 {
  const rows = Object.freeze(input.rawTriSegRows.map((row, rowIndex) => {
    if (row.length !== input.unknownCount) {
      throw new Error(
        `accepted TriSeg Jacobian row ${rowIndex} has the wrong length`,
      );
    }
    return Object.freeze(row.map((value, columnIndex) =>
      requireFinite(
        value,
        `accepted TriSeg Jacobian row ${rowIndex} column ${columnIndex}`,
      )));
  })) as readonly [readonly number[], readonly number[]];
  const snapshot = Object.freeze({
    snapshotId:
      PHASE_B1_ACCEPTED_NEWTON_BASE_TRISEG_CONSTRAINT_JACOBIAN_ROWS_V1_ID,
    slsMode: input.slsMode,
    unknownCount: input.unknownCount,
    residualCount: input.unknownCount,
    dtSec: input.dtSec,
    triSegResidualRowIndices: Object.freeze([
      input.unknownCount - 2,
      input.unknownCount - 1,
    ] as const),
    rawJacobianRows: rows,
    capturedFromAcceptedNewtonBase: true as const,
    lineSearchTrialJacobianConsumed: false as const,
    genericNewtonPolicyChanged: false as const,
    numericalResultChangedByCapture: false as const,
    testReferenceOnly: true as const,
    phaseB1Acceptance: false as const,
    releaseRuntimeReachable: false as const,
  });
  BUILDER_ISSUED_ACCEPTED_TRISEG_JACOBIAN_ROWS.add(snapshot);
  ACCEPTED_TRISEG_JACOBIAN_ROW_SOURCE.set(snapshot, Object.freeze({
    model: input.model,
    wallMaterialBinding: input.wallMaterialBinding,
    previousEndpoint: input.previousEndpoint,
    nextEndpointLeftLimit: input.nextEndpointLeftLimit,
    dtSec: input.dtSec,
  }));
  return snapshot;
}

function vectorsExactlyEqual(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}

function validateModelBoundary(model: PhaseB1EventFreeMonolithicModelV1): void {
  assertExactPlainRecordV1(model, [
    "modelId",
    "closedLoopParameters",
    "newtonScaleRegistry",
    "candidatePriorOnly",
    "physiologicalValidation",
    "phaseB1Acceptance",
    "releaseRuntimeReachable",
  ], "Phase B1 event-free monolithic model");
  assertPhaseB1EventFreeMonolithicModelIdV1(model.modelId);
  const hasFiniteThicknessTriSeg = model.closedLoopParameters
    .finiteThicknessTriSegBendingPriorV2 !== undefined;
  if (
    model.modelId === PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID
      ? !hasFiniteThicknessTriSeg
      : hasFiniteThicknessTriSeg
  ) {
    throw new Error(
      model.modelId === PHASE_B1_EVENT_FREE_MECHANISTIC_REBUILD_V2_MODEL_ID
        ? "mechanistic-rebuild v2 requires finite-thickness energy-conjugate TriSeg"
        : "legacy Phase B1 model IDs must retain the published-Taylor TriSeg owner",
    );
  }
  if (
    model.candidatePriorOnly !== true
    || model.physiologicalValidation !== false
    || model.phaseB1Acceptance !== false
    || model.releaseRuntimeReachable !== false
  ) {
    throw new Error("Phase B1 event-free solver accepts only an unvalidated candidate model");
  }
  assertCanonicalFourChamberNewtonScaleRegistryV1(model.newtonScaleRegistry);
}

function validateBindingAgainstModel(
  binding: PhaseB1WallMaterialBindingV1,
): void {
  assertPhaseB1WallMaterialBindingV1(binding);
  if (
    binding.descriptor.phaseB1AcceptanceClaimed !== false
    || binding.descriptor.physiologicalValidationClaimed !== false
  ) {
    throw new Error("Phase B1 wall binding exceeds the event-free claim boundary");
  }
  for (const wallId of WALL_IDS) {
    const material = assertPhaseB1WallRuntimeMaterialV1(
      binding.runtimeByWall[wallId],
    );
    if (material.wallId !== wallId) {
      throw new Error(
        `Phase B1 wall binding key ${wallId} contains material ${material.wallId}`,
      );
    }
  }
}

function failureResult(
  slsMode: PhaseB1SlsModeV1,
  unknownCount: 51 | 46,
  reason: PhaseB1EventFreeMonolithicStepFailureV1["reason"],
  message: string,
  rollbackEndpoint: PhaseB1EndpointStateV1,
  lastAcceptedDiagnosticEndpoint: PhaseB1EndpointStateV1 | null,
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1,
): PhaseB1EventFreeMonolithicStepFailureV1 {
  return Object.freeze({
    converged: false,
    solverId: PHASE_B1_EVENT_FREE_MONOLITHIC_BE_V1_ID,
    slsMode,
    unknownCount,
    reason,
    message,
    rollbackEndpoint,
    lastAcceptedDiagnosticEndpoint,
    newtonDiagnostics,
    projectionApplied: false,
    hiddenStateClippingApplied: false,
    postStepBloodVolumeProjectionApplied: false,
    flowClampApplied: false,
    phaseB1Acceptance: false,
    testReferenceOnly: true,
    releaseRuntimeReachable: false,
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

function inertialRecord<Value>(
  build: (flowId: InertialFlowId) => Value,
): Readonly<Record<InertialFlowId, Value>> {
  return Object.freeze(Object.fromEntries(INERTIAL_FLOW_IDS.map((flowId) => [
    flowId,
    build(flowId),
  ]))) as Readonly<Record<InertialFlowId, Value>>;
}

function sumBloodVolumes(
  volumes: Readonly<Record<(typeof BLOOD_COMPARTMENT_IDS)[number], number>>,
): number {
  return BLOOD_COMPARTMENT_IDS.reduce((sum, id) => sum + volumes[id], 0);
}

function indicesMatching(
  labels: readonly string[],
  predicate: (label: string) => boolean,
): readonly number[] {
  return Object.freeze(labels.flatMap((label, index) =>
    predicate(label) ? [index] : []));
}

function maximumAbsoluteMatrixBlock(
  matrix: readonly (readonly number[])[],
  rows: readonly number[],
  columns: readonly number[],
): number {
  if (rows.length === 0 || columns.length === 0) {
    throw new Error("global Jacobian audit block must be nonempty");
  }
  let maximum = 0;
  for (const row of rows) {
    for (const column of columns) {
      maximum = Math.max(
        maximum,
        Math.abs(requireFinite(
          matrix[row]?.[column],
          `scaledJacobian[${row}][${column}]`,
        )),
      );
    }
  }
  return maximum;
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

function assertClose(left: number, right: number, field: string): void {
  const tolerance = 128 * Number.EPSILON
    * Math.max(1, Math.abs(left), Math.abs(right));
  if (Math.abs(left - right) > tolerance) {
    throw new Error(`${field} disagrees with the material kernel`);
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
  if (result <= 0) throw new Error(`${field} must be positive`);
  return result;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
