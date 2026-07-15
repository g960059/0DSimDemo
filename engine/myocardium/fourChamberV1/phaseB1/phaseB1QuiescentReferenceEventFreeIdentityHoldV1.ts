import {
  stepPhaseB1EventFreeMonolithicBackwardEulerV1,
  type PhaseB1EventFreeMonolithicStepResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1,
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
  type PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_V1_ID =
  "phase-b1-project-synthetic-quiescent-reference-event-free-identity-hold-v1" as const;

export const PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1 =
  Object.freeze([0.125e-3, 0.25e-3, 0.5e-3] as const);

export const PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b1-project-synthetic-quiescent-reference-event-free-identity-hold-policy-v1",
    dtGridSec:
      PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1,
    everyStepStartsFromSameReferenceEndpointIndependently: true as const,
    nonTimeStateComparison:
      "Object.is-over-complete-newton-topology-and-ten-calcium-scalars" as const,
    expectedStoredScalarCountBySlsMode: Object.freeze({
      on: 61 as const,
      off: 56 as const,
    }),
    acceptedNewtonStepCount: 0 as const,
    maximumAbsoluteChamberTargetPressureDifferencePa:
      PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
        .maximumAbsoluteChamberTargetPressureDifferencePa,
    maximumAbsoluteInertialFlowAccelerationM3PerSec2:
      PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_POLICY_V1
        .maximumAbsoluteInertialFlowAccelerationM3PerSec2,
    eventSchedulerIntegrated: false as const,
    adaptiveRescalingAllowed: false as const,
  } as const);

export type PhaseB1QuiescentReferenceEventFreeIdentityStepAuditV1 = Readonly<{
  dtSec: number;
  result: PhaseB1EventFreeMonolithicStepResultV1;
  converged: boolean;
  previousEndpointReplaysReferenceTimeExact: boolean;
  previousEndpointNonTimeStateExact: boolean;
  nextTimeAdvanceExact: boolean;
  nextNewtonTopologyExact: boolean;
  nextCalciumStateExact: boolean;
  allCalciumScalarsExactlyZero: boolean;
  comparedNewtonScalarCount: number | null;
  comparedCalciumScalarCount: number | null;
  acceptedNewtonStepCountExactZero: boolean;
  finalScaledResidualInfinityNorm: number | null;
  finalScaledUpdateInfinityNorm: number | null;
  scaledResidualGatePass: boolean;
  scaledUpdateGatePass: boolean;
  allClosedLoopFlowsExactlyZero: boolean;
  maximumAbsoluteVolumeResidualM3PerSec: number | null;
  totalBloodVolumeChangeM3: number | null;
  exactVolumeIdentityPass: boolean;
  maximumAbsoluteChamberTargetPressureDifferencePa: number | null;
  chamberPressureGatePass: boolean;
  maximumAbsoluteInertialFlowAccelerationM3PerSec2: number | null;
  inertialFlowAccelerationGatePass: boolean;
  destinationRegistryObjectIdentityAtInvocation: boolean;
  eventFree: boolean;
  noProjectionClippingClampOrFallback: boolean;
  slsTopologyPreserved: boolean;
  pass: boolean;
}>;

export type PhaseB1QuiescentReferenceEventFreeIdentityHoldResultV1 = Readonly<{
  holdId:
    typeof PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_V1_ID;
  slsMode: "on" | "off";
  case: PhaseB1QuiescentReferenceEventFreeCaseV1;
  dtGridSec:
    typeof PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1;
  stepAudits: readonly PhaseB1QuiescentReferenceEventFreeIdentityStepAuditV1[];
  everyStepStartedFromSameReferenceEndpointIndependently: boolean;
  destinationRegistryObjectReusedAcrossAllSteps: boolean;
  destinationRegistryRecompiledDuringHold: false;
  adaptiveRescalingApplied: false;
  allDtGridStepsPass: boolean;
  projectSyntheticToleranceCertifiedIdentityHoldPass: boolean;
  analyticalExactEquilibriumClaimed: false;
  closedLoopStationarityPass: false;
  physiologicalReferenceAcceptancePass: false;
  supportedReferenceEnvelopePass: false;
  fullBeatAcceptancePass: false;
  eventIntegratedAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
}>;

/**
 * Runs three independent event-free BE probes from one accepted endpoint. A
 * pass means the stored non-time state is bit-identical and the small residual
 * pressure mismatch is within the declared inverse/BE tolerances. It is not a
 * claim of analytical exact equilibrium or a physiological operating point.
 */
export function runPhaseB1QuiescentReferenceEventFreeIdentityHoldV1(
  candidate: PhaseB1QuiescentReferenceEventFreeCaseV1,
): PhaseB1QuiescentReferenceEventFreeIdentityHoldResultV1 {
  if (
    candidate.caseId !== PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID
    || candidate.projectSyntheticQuiescentReferenceEventFreeCasePass !== true
    || candidate.staticAudit.pass !== true
    || candidate.registryAudit.pass !== true
    || !Object.is(
      candidate.destinationRegistry,
      candidate.model.newtonScaleRegistry,
    )
  ) {
    throw new Error(
      "identity hold requires one accepted quiescent event-free case",
    );
  }
  const referenceEndpoint = candidate.referenceEndpoint;
  const registryAtProtocolStart = candidate.destinationRegistry;
  const invocationRegistries: typeof registryAtProtocolStart[] = [];
  const stepAudits = Object.freeze(
    PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1
      .map((dtSec) => {
        const registryAtInvocation = candidate.model.newtonScaleRegistry;
        invocationRegistries.push(registryAtInvocation);
        const result = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
          model: candidate.model,
          wallMaterialBinding: candidate.wallMaterialBinding,
          previousEndpoint: referenceEndpoint,
          dtSec,
        });
        return auditStep(
          candidate,
          referenceEndpoint,
          dtSec,
          result,
          Object.is(registryAtInvocation, registryAtProtocolStart),
        );
      }),
  );
  const everyStepStartedFromSameReferenceEndpointIndependently =
    stepAudits.every((audit) =>
      audit.previousEndpointReplaysReferenceTimeExact
      && audit.previousEndpointNonTimeStateExact);
  const destinationRegistryObjectReusedAcrossAllSteps =
    invocationRegistries.length
      === PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1
        .length
    && invocationRegistries.every((registry) =>
      Object.is(registry, registryAtProtocolStart));
  const allDtGridStepsPass = stepAudits.length
    === PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1
      .length
    && stepAudits.every((audit) => audit.pass);
  const projectSyntheticToleranceCertifiedIdentityHoldPass =
    candidate.projectSyntheticQuiescentReferenceEventFreeCasePass
    && everyStepStartedFromSameReferenceEndpointIndependently
    && destinationRegistryObjectReusedAcrossAllSteps
    && allDtGridStepsPass;
  return Object.freeze({
    holdId: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_V1_ID,
    slsMode: candidate.slsMode,
    case: candidate,
    dtGridSec:
      PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_DT_GRID_SEC_V1,
    stepAudits,
    everyStepStartedFromSameReferenceEndpointIndependently,
    destinationRegistryObjectReusedAcrossAllSteps,
    destinationRegistryRecompiledDuringHold: false as const,
    adaptiveRescalingApplied: false as const,
    allDtGridStepsPass,
    projectSyntheticToleranceCertifiedIdentityHoldPass,
    analyticalExactEquilibriumClaimed: false as const,
    closedLoopStationarityPass: false as const,
    physiologicalReferenceAcceptancePass: false as const,
    supportedReferenceEnvelopePass: false as const,
    fullBeatAcceptancePass: false as const,
    eventIntegratedAcceptancePass: false as const,
    physiologicalValidationPass: false as const,
    phaseB1AcceptancePass: false as const,
    modelCoreIntegration: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
    testOnly: true as const,
  });
}

function auditStep(
  candidate: PhaseB1QuiescentReferenceEventFreeCaseV1,
  referenceEndpoint: PhaseB1EndpointStateV1,
  dtSec: number,
  result: PhaseB1EventFreeMonolithicStepResultV1,
  destinationRegistryObjectIdentityAtInvocation: boolean,
): PhaseB1QuiescentReferenceEventFreeIdentityStepAuditV1 {
  if (result.converged === false) {
    return Object.freeze({
      dtSec,
      result,
      converged: false,
      previousEndpointReplaysReferenceTimeExact: false,
      previousEndpointNonTimeStateExact: false,
      nextTimeAdvanceExact: false,
      nextNewtonTopologyExact: false,
      nextCalciumStateExact: false,
      allCalciumScalarsExactlyZero: false,
      comparedNewtonScalarCount: null,
      comparedCalciumScalarCount: null,
      acceptedNewtonStepCountExactZero: false,
      finalScaledResidualInfinityNorm:
        result.newtonDiagnostics.finalResidualInfinityNorm,
      finalScaledUpdateInfinityNorm:
        result.newtonDiagnostics.finalUpdateInfinityNorm,
      scaledResidualGatePass: false,
      scaledUpdateGatePass: false,
      allClosedLoopFlowsExactlyZero: false,
      maximumAbsoluteVolumeResidualM3PerSec: null,
      totalBloodVolumeChangeM3: null,
      exactVolumeIdentityPass: false,
      maximumAbsoluteChamberTargetPressureDifferencePa: null,
      chamberPressureGatePass: false,
      maximumAbsoluteInertialFlowAccelerationM3PerSec2: null,
      inertialFlowAccelerationGatePass: false,
      destinationRegistryObjectIdentityAtInvocation,
      eventFree: false,
      noProjectionClippingClampOrFallback: false,
      slsTopologyPreserved: false,
      pass: false,
    });
  }
  const referenceTopology = encodePhaseB1EndpointTopologyVectorsV1(
    referenceEndpoint,
  );
  const previousTopology = encodePhaseB1EndpointTopologyVectorsV1(
    result.previousEndpoint,
  );
  const nextTopology = encodePhaseB1EndpointTopologyVectorsV1(
    result.nextEndpointLeftLimit,
  );
  const referenceNewtonScalars = Object.freeze([
    ...referenceTopology.nonCalciumDifferentialState,
    ...referenceTopology.algebraicState,
  ]);
  const previousNewtonScalars = Object.freeze([
    ...previousTopology.nonCalciumDifferentialState,
    ...previousTopology.algebraicState,
  ]);
  const nextNewtonScalars = Object.freeze([
    ...nextTopology.nonCalciumDifferentialState,
    ...nextTopology.algebraicState,
  ]);
  const previousEndpointReplaysReferenceTimeExact = Object.is(
    result.previousEndpoint.timeSec,
    referenceEndpoint.timeSec,
  );
  const previousEndpointNonTimeStateExact =
    previousTopology.slsMode === referenceTopology.slsMode
    && exactNumberArray(previousNewtonScalars, referenceNewtonScalars)
    && exactCalcium(previousTopology.calciumByWall, referenceTopology.calciumByWall);
  const nextTimeAdvanceExact = Object.is(
    result.nextEndpointLeftLimit.timeSec,
    referenceEndpoint.timeSec + dtSec,
  );
  const nextNewtonTopologyExact =
    nextTopology.slsMode === referenceTopology.slsMode
    && exactNumberArray(nextNewtonScalars, referenceNewtonScalars);
  const nextCalciumStateExact = exactCalcium(
    nextTopology.calciumByWall,
    referenceTopology.calciumByWall,
  ) && exactCalcium(
    result.calciumDriveStateByWallAtEndLeftLimit,
    referenceTopology.calciumByWall,
  );
  const allCalciumScalarsExactlyZero = WALL_IDS.every((wallId) => {
    const state = nextTopology.calciumByWall[wallId];
    return Object.is(state.r, 0) && Object.is(state.d, 0);
  });
  const acceptedNewtonStepCountExactZero =
    result.newtonDiagnostics.acceptedStepCount
      === PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
        .acceptedNewtonStepCount;
  const finalScaledResidualInfinityNorm =
    result.newtonDiagnostics.finalResidualInfinityNorm;
  const finalScaledUpdateInfinityNorm =
    result.newtonDiagnostics.finalUpdateInfinityNorm;
  const scaledResidualGatePass =
    finalScaledResidualInfinityNorm !== null
    && finalScaledResidualInfinityNorm
      <= candidate.destinationRegistry.tolerances.globalResidualInfinityNorm;
  const scaledUpdateGatePass = finalScaledUpdateInfinityNorm
    <= candidate.destinationRegistry.tolerances.globalUpdateInfinityNorm;
  const allClosedLoopFlowsExactlyZero = Object.values(
    result.nextEvaluation.closedLoop.allFlowsM3PerSec,
  ).every((flow) => flow === 0);
  const maximumAbsoluteVolumeResidualM3PerSec =
    result.residualEvaluation.volumeResidual.maximumAbsoluteResidualM3PerSec;
  const totalBloodVolumeChangeM3 =
    result.residualEvaluation.volumeResidual.totalBloodVolumeChangeM3;
  const exactVolumeIdentityPass =
    maximumAbsoluteVolumeResidualM3PerSec === 0
    && totalBloodVolumeChangeM3 === 0
    && result.residualEvaluation.volumeResidual.summedResidualM3PerSec === 0
    && result.totalBloodVolumeChangeM3 === 0;
  const maximumAbsoluteChamberTargetPressureDifferencePa = maximumAbsolute(
    Object.values(result.nextEvaluation.closedLoop.chamberAbsolutePressurePa)
      .map((pressure) =>
        pressure - candidate.inverse.commonVascularTargetPressurePa),
  );
  const chamberPressureGatePass =
    maximumAbsoluteChamberTargetPressureDifferencePa
      <= PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
        .maximumAbsoluteChamberTargetPressureDifferencePa;
  const maximumAbsoluteInertialFlowAccelerationM3PerSec2 = maximumAbsolute(
    INERTIAL_FLOW_IDS.map((flowId) =>
      result.nextEvaluation.closedLoop.inertialMomentum[flowId]
        .flowAccelerationM3PerSec2),
  );
  const inertialFlowAccelerationGatePass =
    maximumAbsoluteInertialFlowAccelerationM3PerSec2
      <= PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
        .maximumAbsoluteInertialFlowAccelerationM3PerSec2;
  const noProjectionClippingClampOrFallback =
    !result.projectionApplied
    && !result.hiddenStateClippingApplied
    && !result.postStepBloodVolumeProjectionApplied
    && !result.flowClampApplied
    && !result.residualEvaluation.projectionApplied
    && !result.residualEvaluation.hiddenStateClippingApplied
    && !result.residualEvaluation.volumeResidual.bloodVolumeProjectionApplied
    && !result.residualEvaluation.volumeResidual.flowClampApplied
    && !result.residualEvaluation.volumeResidual.fallbackApplied
    && !result.nextEvaluation.projectionApplied
    && !result.nextEvaluation.hiddenStateClippingApplied
    && !result.nextEvaluation.closedLoop.projectionApplied
    && !result.nextEvaluation.closedLoop.flowClampApplied
    && !result.nextEvaluation.closedLoop.fallbackApplied;
  const slsTopologyPreserved =
    result.slsMode === candidate.slsMode
    && result.nextEndpointLeftLimit.differentialState.slsMode
      === candidate.slsMode
    && (candidate.slsMode === "on"
      ? Object.hasOwn(
        result.nextEndpointLeftLimit.differentialState,
        "slsAlphaVByWall",
      )
      : !Object.hasOwn(
        result.nextEndpointLeftLimit.differentialState,
        "slsAlphaVByWall",
      ));
  const expectedNewtonScalarCount = candidate.slsMode === "on" ? 51 : 46;
  const comparedNewtonScalarCount = nextNewtonScalars.length;
  const comparedCalciumScalarCount = 2 * WALL_IDS.length;
  const pass = previousEndpointReplaysReferenceTimeExact
    && previousEndpointNonTimeStateExact
    && nextTimeAdvanceExact
    && nextNewtonTopologyExact
    && nextCalciumStateExact
    && allCalciumScalarsExactlyZero
    && comparedNewtonScalarCount === expectedNewtonScalarCount
    && comparedCalciumScalarCount === 10
    && comparedNewtonScalarCount + comparedCalciumScalarCount
      === PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_IDENTITY_HOLD_POLICY_V1
        .expectedStoredScalarCountBySlsMode[candidate.slsMode]
    && acceptedNewtonStepCountExactZero
    && scaledResidualGatePass
    && scaledUpdateGatePass
    && allClosedLoopFlowsExactlyZero
    && exactVolumeIdentityPass
    && chamberPressureGatePass
    && inertialFlowAccelerationGatePass
    && destinationRegistryObjectIdentityAtInvocation
    && result.eventFree
    && noProjectionClippingClampOrFallback
    && slsTopologyPreserved;
  return Object.freeze({
    dtSec,
    result,
    converged: true,
    previousEndpointReplaysReferenceTimeExact,
    previousEndpointNonTimeStateExact,
    nextTimeAdvanceExact,
    nextNewtonTopologyExact,
    nextCalciumStateExact,
    allCalciumScalarsExactlyZero,
    comparedNewtonScalarCount,
    comparedCalciumScalarCount,
    acceptedNewtonStepCountExactZero,
    finalScaledResidualInfinityNorm,
    finalScaledUpdateInfinityNorm,
    scaledResidualGatePass,
    scaledUpdateGatePass,
    allClosedLoopFlowsExactlyZero,
    maximumAbsoluteVolumeResidualM3PerSec,
    totalBloodVolumeChangeM3,
    exactVolumeIdentityPass,
    maximumAbsoluteChamberTargetPressureDifferencePa,
    chamberPressureGatePass,
    maximumAbsoluteInertialFlowAccelerationM3PerSec2,
    inertialFlowAccelerationGatePass,
    destinationRegistryObjectIdentityAtInvocation,
    eventFree: result.eventFree,
    noProjectionClippingClampOrFallback,
    slsTopologyPreserved,
    pass,
  });
}

function exactNumberArray(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}

function exactCalcium(
  left: PhaseB1EndpointStateV1["differentialState"]["calciumByWall"],
  right: PhaseB1EndpointStateV1["differentialState"]["calciumByWall"],
): boolean {
  return WALL_IDS.every((wallId) =>
    Object.is(left[wallId].r, right[wallId].r)
    && Object.is(left[wallId].d, right[wallId].d));
}

function maximumAbsolute(values: readonly number[]): number {
  if (values.length === 0) throw new Error("maximumAbsolute requires values");
  return Math.max(...values.map((value, index) => {
    if (!Number.isFinite(value)) {
      throw new Error(`maximumAbsolute values[${index}] must be finite`);
    }
    return Math.abs(value);
  }));
}
