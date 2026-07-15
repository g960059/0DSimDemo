import {
  stepPhaseB1EventFreeMonolithicBackwardEulerV1,
  type PhaseB1EventFreeMonolithicModelV1,
  type PhaseB1EventFreeMonolithicStepResultV1,
  type PhaseB1EventFreeMonolithicStepSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  createPhaseB1EndpointStateV1,
  decodePhaseB1EndpointTopologyVectorsV1,
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  runPhaseB1WholeHeartCalciumEventCoordinatorV1,
  type PhaseB1WallCalciumDriveEventV1,
  type PhaseB1WholeHeartCalciumEventCoordinatorResultV1,
  type PhaseB1WholeHeartCalciumEventCoordinatorSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WholeHeartExactCalciumEventCoordinatorV1";
import {
  reinitializePhaseB1PostEventTriSegV1,
  type PhaseB1PostEventTriSegReinitializationResultV1,
  type PhaseB1PostEventTriSegReinitializationSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/postEventTriSegReinitializationV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1,
  assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1,
  PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1,
  PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID,
  PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
  type PhaseB1WholeHeartSlsBackwardEulerAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  buildPhaseB1WholeHeartMechanicalEnergyStageSnapshotV1,
  type PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyStageSnapshotV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID =
  "four-chamber-phase-b1-event-integrated-monolithic-transaction-v1" as const;

export const PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b1-event-integrated-sls-be-precommit-acceptance-policy-v1",
    auditId: PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID,
    normalizedIdentityResidualTolerance:
      PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
    alphaMismatchTolerance:
      PHASE_B1_WHOLE_HEART_SLS_BE_ALPHA_MISMATCH_TOLERANCE_V1,
    auditTiming: "post-monolithic-left-limit-pre-event-commit" as const,
    failedAuditDisposition:
      "atomic-rollback-then-explicit-runner-binary-retry" as const,
    thresholdRelaxationAllowed: false as const,
    postSolveProjectionAllowed: false as const,
  } as const);

export const PHASE_B1_EVENT_INTEGRATED_SLS_BE_FAILURE_PROBE_V1_ID =
  "phase-b1-event-integrated-sls-be-precommit-test-failure-probe-v1" as const;

export type PhaseB1EventIntegratedMonolithicTransactionInputV1 = Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  endTimeSec: number;
  coincidentEventsAtEnd: readonly PhaseB1WallCalciumDriveEventV1[];
}>;

export type PhaseB1EventIntegratedSlsBeFailureProbeV1 = Readonly<{
  probeId: typeof PHASE_B1_EVENT_INTEGRATED_SLS_BE_FAILURE_PROBE_V1_ID;
}>;

export type PhaseB1EventIntegratedMonolithicTransactionSuccessV1 = Readonly<{
  ok: true;
  transactionId: typeof PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpoint: PhaseB1EndpointStateV1;
  leftLimitStep: PhaseB1EventFreeMonolithicStepSuccessV1;
  actualCommittedDurationSec: number;
  mechanicalEnergyStageSnapshot:
    PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1;
  slsBackwardEulerPreCommitPolicyId:
    typeof PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId;
  slsBackwardEulerPreCommitAudit:
    PhaseB1WholeHeartSlsBackwardEulerAuditV1;
  slsBackwardEulerPreCommitGatePass: true;
  slsBackwardEulerAuditCompletedBeforeEventCommit: true;
  testSlsBackwardEulerAuditFailureInjected: false;
  coordinator: PhaseB1WholeHeartCalciumEventCoordinatorSuccessV1;
  postEventTriSegReinitialization:
    PhaseB1PostEventTriSegReinitializationSuccessV1 | null;
  preJumpForcingParityVerified: true;
  calciumParametersOwnedByWallBinding: true;
  eventFreeMonolithicAtomicStepIntegrated: true;
  aggregateEventBatchCommittedOnce: boolean;
  algebraicReinitializationCallCount: 0 | 1;
  rollbackSnapshotReturned: false;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1EventIntegratedMonolithicTransactionFailureV1 = Readonly<{
  ok: false;
  transactionId: typeof PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID;
  failureStage:
    | "event-free-monolithic-step"
    | "sls-backward-euler-identity-audit"
    | "event-batch-preparation"
    | "post-event-triseg-reinitialization"
    | "integration-contract";
  failureReason: string;
  rollbackEndpoint: PhaseB1EndpointStateV1;
  leftLimitStep: PhaseB1EventFreeMonolithicStepResultV1 | null;
  slsBackwardEulerPreCommitPolicyId:
    typeof PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId;
  slsBackwardEulerPreCommitAudit:
    PhaseB1WholeHeartSlsBackwardEulerAuditV1 | null;
  slsBackwardEulerPreCommitGatePass: boolean | null;
  slsBackwardEulerAuditCompletedBeforeEventCommit: boolean;
  testSlsBackwardEulerAuditFailureInjected: boolean;
  coordinator: PhaseB1WholeHeartCalciumEventCoordinatorResultV1 | null;
  postEventTriSegReinitialization:
    PhaseB1PostEventTriSegReinitializationResultV1 | null;
  eventBatchCommitted: false;
  rollbackSnapshotReturned: true;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1EventIntegratedMonolithicTransactionResultV1 =
  | PhaseB1EventIntegratedMonolithicTransactionSuccessV1
  | PhaseB1EventIntegratedMonolithicTransactionFailureV1;

/**
 * Executes one atomic whole-heart endpoint transaction:
 * propagate every calcium pair to t-, solve the 51/46-variable event-free
 * system once, apply all coincident wall events simultaneously, and solve the
 * two TriSeg constraints once without changing any differential coordinate.
 */
export function runPhaseB1EventIntegratedMonolithicTransactionV1(
  input: PhaseB1EventIntegratedMonolithicTransactionInputV1,
): PhaseB1EventIntegratedMonolithicTransactionResultV1 {
  return runTransaction(input, false);
}

/** Test-only probe; the production transaction input remains strictly closed. */
export function runPhaseB1EventIntegratedMonolithicTransactionSlsAuditFailureProbeV1(
  input: PhaseB1EventIntegratedMonolithicTransactionInputV1,
  probe: PhaseB1EventIntegratedSlsBeFailureProbeV1,
): PhaseB1EventIntegratedMonolithicTransactionResultV1 {
  assertExactPlainRecordV1(
    probe,
    ["probeId"],
    "Phase B1 event-integrated SLS BE failure probe",
  );
  if (probe.probeId !== PHASE_B1_EVENT_INTEGRATED_SLS_BE_FAILURE_PROBE_V1_ID) {
    throw new Error("event-integrated SLS BE failure probe ID is invalid");
  }
  return runTransaction(input, true);
}

function runTransaction(
  input: PhaseB1EventIntegratedMonolithicTransactionInputV1,
  testSlsBackwardEulerAuditFailureInjected: boolean,
): PhaseB1EventIntegratedMonolithicTransactionResultV1 {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "endTimeSec",
    "coincidentEventsAtEnd",
  ], "Phase B1 event-integrated monolithic transaction input");
  encodePhaseB1EndpointTopologyVectorsV1(input.previousEndpoint);
  const previousEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  const endTimeSec = requireFinite(input.endTimeSec, "endTimeSec");
  if (!(endTimeSec > previousEndpoint.timeSec)) {
    throw new Error("endTimeSec must be greater than the previous endpoint time");
  }
  const startVectors = encodePhaseB1EndpointTopologyVectorsV1(
    previousEndpoint,
  );
  let leftLimitStep: PhaseB1EventFreeMonolithicStepResultV1 | null = null;
  let slsBackwardEulerPreCommitAudit:
    PhaseB1WholeHeartSlsBackwardEulerAuditV1 | null = null;
  let mechanicalEnergyStageSnapshot:
    PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1 | null = null;
  let slsBackwardEulerPreCommitGatePass: boolean | null = null;
  let postEventTriSegReinitialization:
    PhaseB1PostEventTriSegReinitializationResultV1 | null = null;
  const rollback = (
    failureStage:
      PhaseB1EventIntegratedMonolithicTransactionFailureV1["failureStage"],
    failureReason: string,
    coordinator: PhaseB1WholeHeartCalciumEventCoordinatorResultV1 | null,
  ): PhaseB1EventIntegratedMonolithicTransactionFailureV1 => Object.freeze({
    ok: false,
    transactionId: PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
    failureStage,
    failureReason,
    rollbackEndpoint: previousEndpoint,
    leftLimitStep,
    slsBackwardEulerPreCommitPolicyId:
      PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId,
    slsBackwardEulerPreCommitAudit,
    slsBackwardEulerPreCommitGatePass,
    slsBackwardEulerAuditCompletedBeforeEventCommit:
      slsBackwardEulerPreCommitAudit !== null,
    testSlsBackwardEulerAuditFailureInjected,
    coordinator,
    postEventTriSegReinitialization,
    eventBatchCommitted: false,
    rollbackSnapshotReturned: true,
    projectionApplied: false,
    hiddenStateClippingApplied: false,
    phaseB1Acceptance: false,
    testReferenceOnly: true,
    releaseRuntimeReachable: false,
  });
  let wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  try {
    wallMaterialBinding = assertPhaseB1WallMaterialBindingV1(
      input.wallMaterialBinding,
    );
  } catch (error) {
    return rollback("integration-contract", errorMessage(error), null);
  }
  const calciumParametersByWall = wallRecord((wallId) =>
    wallMaterialBinding.runtimeByWall[wallId]
      .prescribedCalciumParameters);

  let coordinator: PhaseB1WholeHeartCalciumEventCoordinatorResultV1;
  try {
    coordinator = runPhaseB1WholeHeartCalciumEventCoordinatorV1({
      startTimeSec: previousEndpoint.timeSec,
      endTimeSec,
      slsMode: startVectors.slsMode,
      calciumDriveStateByWallAtStart: startVectors.calciumByWall,
      calciumParametersByWall,
      nonCalciumDifferentialStateAtStart:
        startVectors.nonCalciumDifferentialState,
      algebraicStateAtStart: startVectors.algebraicState,
      coincidentEventsAtEnd: input.coincidentEventsAtEnd,
      atomicStep: (atomicInput) => {
      assertVectorExactlyEqual(
        atomicInput.nonCalciumDifferentialStateAtStart,
        startVectors.nonCalciumDifferentialState,
        "atomic start non-calcium state",
      );
      assertVectorExactlyEqual(
        atomicInput.algebraicStateAtStart,
        startVectors.algebraicState,
        "atomic start algebraic state",
      );
      const candidate = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
        model: input.model,
        wallMaterialBinding,
        previousEndpoint,
        dtSec: atomicInput.durationSec,
      });
      leftLimitStep = candidate;
      if (candidate.converged === false) {
        return Object.freeze({
          accepted: false as const,
          failureReason: `${candidate.reason}: ${candidate.message}`,
        });
      }
      assertCalciumParity(
        candidate.calciumDriveStateByWallAtEndLeftLimit,
        atomicInput.calciumDriveStateByWallAtEndLeftLimit,
        "left-limit calcium drive",
      );
      for (const wallId of WALL_IDS) {
        assertRoundoffEqual(
          candidate.nextEvaluation.freeCalciumUMByWall[wallId],
          atomicInput.knownFreeCalciumUMByWallAtEndLeftLimit[wallId],
          `left-limit free calcium ${wallId}`,
        );
      }
      mechanicalEnergyStageSnapshot =
        buildPhaseB1WholeHeartMechanicalEnergyStageSnapshotV1({
          model: input.model,
          wallMaterialBinding,
          acceptedStep: candidate,
          dtSec: atomicInput.durationSec,
        });
      slsBackwardEulerPreCommitAudit =
        auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1({
          model: input.model,
          wallMaterialBinding,
          previousEndpoint,
          nextEndpointLeftLimit: candidate.nextEndpointLeftLimit,
          dtSec: atomicInput.durationSec,
        });
      assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1({
        audit: slsBackwardEulerPreCommitAudit,
        model: input.model,
        wallMaterialBinding,
        previousEndpoint,
        nextEndpointLeftLimit: candidate.nextEndpointLeftLimit,
        dtSec: atomicInput.durationSec,
      });
      slsBackwardEulerPreCommitGatePass =
        slsBackwardEulerPreCommitAudit.normalizedIdentityAccepted
        && !testSlsBackwardEulerAuditFailureInjected;
      if (!slsBackwardEulerPreCommitGatePass) {
        return Object.freeze({
          accepted: false as const,
          failureReason: slsAuditFailureReason(
            slsBackwardEulerPreCommitAudit,
            testSlsBackwardEulerAuditFailureInjected,
          ),
        });
      }
      const nextVectors = encodePhaseB1EndpointTopologyVectorsV1(
        candidate.nextEndpointLeftLimit,
      );
      return Object.freeze({
        accepted: true as const,
        nonCalciumDifferentialStateAtEndLeftLimit:
          nextVectors.nonCalciumDifferentialState,
        algebraicStateAtEndLeftLimit: nextVectors.algebraicState,
      });
      },
      reinitializeAlgebraicState: (reinitializationInput) => {
      const endpointAfterCalciumJump =
        decodePhaseB1EndpointTopologyVectorsV1({
          timeSec: reinitializationInput.timeSec,
          slsMode: reinitializationInput.slsMode,
          calciumByWall:
            reinitializationInput.calciumDriveStateByWallAfterEventBatch,
          nonCalciumDifferentialState:
            reinitializationInput.nonCalciumDifferentialStateAtAcceptedEnd,
          algebraicState:
            reinitializationInput.algebraicStateAtEndLeftLimit,
        });
      const candidate = reinitializePhaseB1PostEventTriSegV1({
        model: input.model,
        wallMaterialBinding,
        endpointAfterCalciumJump,
      });
      postEventTriSegReinitialization = candidate;
      if (candidate.converged === false) {
        return Object.freeze({
          accepted: false as const,
          failureReason: `${candidate.reason}: ${candidate.message}`,
        });
      }
      assertDifferentialStatesExactlyEqual(
        candidate.endpointAfterReinitialization,
        endpointAfterCalciumJump,
      );
      return Object.freeze({
        accepted: true as const,
        algebraicStateAfterReinitialization: Object.freeze([
          candidate.endpointAfterReinitialization.triSegCoordinates.V_m_S,
          candidate.endpointAfterReinitialization.triSegCoordinates.y_m,
        ]),
      });
      },
    });
  } catch (error) {
    return rollback("integration-contract", errorMessage(error), null);
  }

  if (coordinator.ok === false) {
    if (coordinator.failureStage === "event-batch-preparation") {
      return rollback(
        "event-batch-preparation",
        coordinator.failureReason,
        coordinator,
      );
    }
    if (coordinator.failureStage === "atomic-step") {
      return rollback(
        slsBackwardEulerPreCommitAudit !== null
          && slsBackwardEulerPreCommitGatePass === false
          ? "sls-backward-euler-identity-audit"
          : leftLimitStep?.converged === true
            ? "integration-contract"
            : "event-free-monolithic-step",
        coordinator.failureReason,
        coordinator,
      );
    }
    return rollback(
      postEventTriSegReinitialization?.converged === true
        ? "integration-contract"
        : "post-event-triseg-reinitialization",
      coordinator.failureReason,
      coordinator,
    );
  }
  if (leftLimitStep === null || leftLimitStep.converged !== true) {
    return rollback(
      "integration-contract",
      "successful coordinator lost its monolithic step result",
      coordinator,
    );
  }
  if (
    slsBackwardEulerPreCommitAudit === null
    || slsBackwardEulerPreCommitGatePass !== true
    || testSlsBackwardEulerAuditFailureInjected
  ) {
    return rollback(
      "integration-contract",
      "successful coordinator lost its accepted pre-commit SLS BE audit",
      coordinator,
    );
  }
  if (mechanicalEnergyStageSnapshot === null) {
    return rollback(
      "integration-contract",
      "successful coordinator lost its accepted mechanical energy stage snapshot",
      coordinator,
    );
  }
  if (
    coordinator.algebraicReinitializationCallCount === 1
    && (
      postEventTriSegReinitialization === null
      || postEventTriSegReinitialization.converged !== true
    )
  ) {
    return rollback(
      "integration-contract",
      "successful coordinator lost its post-event TriSeg reinitialization",
      coordinator,
    );
  }
  let nextEndpoint: PhaseB1EndpointStateV1;
  try {
    nextEndpoint = decodePhaseB1EndpointTopologyVectorsV1({
      timeSec: endTimeSec,
      slsMode: coordinator.slsMode,
      calciumByWall: coordinator.calciumDriveStateByWallAfterEventBatch,
      nonCalciumDifferentialState:
        coordinator.nonCalciumDifferentialStateAfterEventBatch,
      algebraicState: coordinator.algebraicStateAfterReinitialization,
    });
  } catch (error) {
    return rollback(
      "integration-contract",
      errorMessage(error),
      coordinator,
    );
  }
  return Object.freeze({
    ok: true,
    transactionId: PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
    previousEndpoint,
    nextEndpoint,
    leftLimitStep,
    actualCommittedDurationSec: endTimeSec - previousEndpoint.timeSec,
    mechanicalEnergyStageSnapshot,
    slsBackwardEulerPreCommitPolicyId:
      PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId,
    slsBackwardEulerPreCommitAudit,
    slsBackwardEulerPreCommitGatePass: true,
    slsBackwardEulerAuditCompletedBeforeEventCommit: true,
    testSlsBackwardEulerAuditFailureInjected: false,
    coordinator,
    postEventTriSegReinitialization:
      postEventTriSegReinitialization as
        PhaseB1PostEventTriSegReinitializationSuccessV1 | null,
    preJumpForcingParityVerified: true,
    calciumParametersOwnedByWallBinding: true,
    eventFreeMonolithicAtomicStepIntegrated: true,
    aggregateEventBatchCommittedOnce: coordinator.eventBatchCommitted,
    algebraicReinitializationCallCount:
      coordinator.algebraicReinitializationCallCount,
    rollbackSnapshotReturned: false,
    projectionApplied: false,
    hiddenStateClippingApplied: false,
    phaseB1Acceptance: false,
    testReferenceOnly: true,
    releaseRuntimeReachable: false,
  });
}

function slsAuditFailureReason(
  audit: PhaseB1WholeHeartSlsBackwardEulerAuditV1,
  testFailureInjected: boolean,
): string {
  return [
    "whole-heart SLS backward-Euler pre-commit audit rejected",
    `mode=${audit.mode}`,
    `normalizedIdentityResidual=${audit.normalizedIdentityResidual}`,
    `normalizedIdentityResidualTolerance=${audit.normalizedIdentityResidualTolerance}`,
    `maximumAbsoluteAlphaMismatch=${audit.maximumAbsoluteAlphaMismatch}`,
    `alphaMismatchTolerance=${audit.alphaMismatchTolerance}`,
    `testFailureInjected=${testFailureInjected}`,
  ].join("; ");
}

function assertCalciumParity(
  actual: Readonly<Record<FourChamberWallId, Readonly<{ r: number; d: number }>>>,
  expected: Readonly<Record<FourChamberWallId, Readonly<{ r: number; d: number }>>>,
  field: string,
): void {
  for (const wallId of WALL_IDS) {
    assertRoundoffEqual(actual[wallId].r, expected[wallId].r, `${field}.${wallId}.r`);
    assertRoundoffEqual(actual[wallId].d, expected[wallId].d, `${field}.${wallId}.d`);
  }
}

function assertDifferentialStatesExactlyEqual(
  actual: PhaseB1EndpointStateV1,
  expected: PhaseB1EndpointStateV1,
): void {
  const actualVectors = encodePhaseB1EndpointTopologyVectorsV1(actual);
  const expectedVectors = encodePhaseB1EndpointTopologyVectorsV1(expected);
  assertCalciumParity(
    actualVectors.calciumByWall,
    expectedVectors.calciumByWall,
    "post-event differential calcium",
  );
  assertVectorExactlyEqual(
    actualVectors.nonCalciumDifferentialState,
    expectedVectors.nonCalciumDifferentialState,
    "post-event non-calcium differential state",
  );
}

function assertVectorExactlyEqual(
  actual: readonly number[],
  expected: readonly number[],
  field: string,
): void {
  if (actual.length !== expected.length) throw new Error(`${field} length mismatch`);
  for (let index = 0; index < actual.length; index += 1) {
    if (!Object.is(actual[index], expected[index])) {
      throw new Error(`${field}[${index}] mismatch`);
    }
  }
}

function assertRoundoffEqual(
  actual: number,
  expected: number,
  field: string,
): void {
  const tolerance = 64 * Number.EPSILON * Math.max(
    1,
    Math.abs(actual),
    Math.abs(expected),
  );
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${field} mismatch`);
  }
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
