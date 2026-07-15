import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1BackwardEulerCommittedIntervalLedgerV1,
  type PhaseB1BackwardEulerCommittedIntervalLedgerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerCommittedIntervalLedgerV1";
import {
  runPhaseB1BackwardEulerEventScheduleRunnerV1,
  type PhaseB1BackwardEulerEventScheduleRunnerFailureV1,
  type PhaseB1BackwardEulerEventScheduleRunnerResultV1,
  type PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  buildPhaseB1CompleteEndpointProjectionV1,
  evaluatePhaseB1CompleteEndpointMetricV1,
  type PhaseB1CompleteEndpointMetricResultV1,
  type PhaseB1CompleteEndpointProjectionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1CompleteEndpointMetricV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_NOMINAL_DT_SEC_V1,
  assertBuilderIssuedPhaseB1ProjectSyntheticFiveWallResponseResultV1,
  runPhaseB1ProjectSyntheticFiveWallResponseProtocolV1,
  type PhaseB1ProjectSyntheticFiveWallResponseResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticFiveWallResponseProtocolV1";
import type {
  PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import {
  encodePhaseB1StoredDifferentialStateV1,
  buildPhaseB1StoredDifferentialLabelsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
  type PhaseB1QuiescentReferenceEventFreeCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEventFreeCaseV1";
import {
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentPressureReferenceInverseV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1,
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID,
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusScheduledEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  BLOOD_COMPARTMENT_IDS,
  FOUR_CHAMBER_SI_UNITS,
  FOUR_CHAMBER_SIGN_CONVENTIONS,
  FOUR_CHAMBER_OWNERSHIP,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_V1_ID =
  "phase-b1-project-synthetic-quiescent-parent-one-supercycle-be-v1" as const;

export const PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b1-project-synthetic-quiescent-parent-one-supercycle-be-policy-v1",
    cycleIndex: 0 as const,
    supportedNominalTimeStepsSec: Object.freeze([
      0.001,
      0.0005,
      0.00025,
    ] as const),
    referenceNominalTimeStepSec: 0.001 as const,
    expectedFiveWallEventCount: 5 as const,
    startPhase: "cycle-zero-before-first-calcium-drive-event" as const,
    endPhase: "cycle-one-same-phase-before-first-calcium-drive-event" as const,
    traceState:
      "complete-stored-differential-plus-triseg-with-absolute-time-separate" as const,
    flowQuadrature: "backward-euler-endpoint" as const,
    oneSupercycleDistanceUse: "diagnostic-only" as const,
    periodicityAcceptance: false as const,
    fullBeatAcceptance: false as const,
    eventIntegratedAcceptance: false as const,
    cycleEnergyAcceptance: false as const,
    physiologicalValidation: false as const,
    phaseB1Acceptance: false as const,
    releaseRuntimeReachable: false as const,
    testOnly: true as const,
  } as const);

export type PhaseB1ProjectSyntheticOneSupercycleBeInputV1 = Readonly<{
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
  nominalDtSec: number;
  sha256Hex: CanonicalSha256HexProvider;
}>;

export type PhaseB1ProjectSyntheticOneSupercycleTraceBindingsV1 = Readonly<{
  traceSchemaId: "phase-b1-one-supercycle-be-complete-trace-bindings-v1";
  stateCoordinateOrder:
    "stored-differential-state-followed-by-two-triseg-algebraic-coordinates";
  stateScalarCount: 61 | 56;
  stateLabels: readonly string[];
  attemptCount: number;
  committedStepCount: number;
  eventTransactionCount: number;
  sourceParentEndpointSha256: string;
  initialEndpointSha256: string;
  finalEndpointSha256: string;
  orderedAttemptTraceSha256: string;
  orderedStepTraceSha256: string;
  eventTransactionTraceSha256: string;
  traceBundleContentSha256: string;
}>;

export type PhaseB1ProjectSyntheticOneSupercycleIntervalAuditV1 = Readonly<{
  auditId: "phase-b1-project-synthetic-exact-one-schedule-supercycle-audit-v1";
  sourceIntervalLedgerProvenanceVerified: true;
  startAtScheduleCycleOriginExact: true;
  endAtNextScheduleCycleOriginExact: true;
  durationEqualsScheduleRepeatPeriodExact: true;
  runnerRequestedEndMatchesNextCycleOriginExact: true;
  scheduledEventsExactlyCycleZeroFiveWallSequence: true;
  runnerOrderedEventsMatchScheduledEventsExactly: true;
  allFiveWallEventsCommittedExactlyOnce: true;
  exactOneScheduleSupercycleVerified: true;
  periodOneEndpointStateClaimed: false;
  periodicityAcceptanceClaimed: false;
  fullBeatAcceptanceClaimed: false;
}>;

type StaticResultFields = Readonly<{
  runnerId: typeof PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_V1_ID;
  policyId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_POLICY_V1.policyId;
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1;
  sourceCaseId: typeof PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID;
  slsMode: "on" | "off";
  scheduleId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID;
  scheduleSha256: string;
  nominalDtSec: number;
  cycleIndex: 0;
  startTimeSec: 0;
  endTimeSec: 0.8;
  scheduledEvents:
    readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[];
  sourceParentAuthenticated: true;
  canonicalProjectSyntheticScheduleAuthenticated: true;
  sourceParentReferenceEndpointProvidedAsRunnerInitialCondition: true;
  sourceDestinationRegistryObjectRetained: boolean;
  sourceDestinationRegistryContentSha256: string;
  sourceWallMaterialBindingContentSha256: string;
  scheduleWallMaterialBindingContentSha256: string;
  testFailureProbeUsed: false;
  periodicityAcceptancePass: false;
  periodOneAttractorAcceptancePass: false;
  multiStartAcceptancePass: false;
  timestepConvergenceAcceptancePass: false;
  cycleEnergyAcceptancePass: false;
  fullBeatAcceptancePass: false;
  eventIntegratedAcceptancePass: false;
  physiologicalValidationPass: false;
  supportedReferenceEnvelopePass: false;
  phaseB1AcceptancePass: false;
  sdirk2OrCondensedParityPass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
}>;

export type PhaseB1ProjectSyntheticOneSupercycleBeSuccessV1 =
  StaticResultFields & Readonly<{
    completed: true;
    scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
    committedIntervalLedger: PhaseB1BackwardEulerCommittedIntervalLedgerV1;
    oneSupercycleIntervalAudit:
      PhaseB1ProjectSyntheticOneSupercycleIntervalAuditV1;
    fiveWallResponseProtocol:
      PhaseB1ProjectSyntheticFiveWallResponseResultV1 | null;
    fiveWallResponseProtocolRequiredForThisRun: boolean;
    fiveWallScaleSeparatedResponseDetected: boolean;
    responseEvidenceBindingPolicyPass: boolean;
    oneSupercycleEvidenceBundleContentSha256: string;
    completeOneSupercycleEvidenceBundleContentBound: boolean;
    completeEndpointMetric: PhaseB1CompleteEndpointMetricResultV1;
    traceBindings: PhaseB1ProjectSyntheticOneSupercycleTraceBindingsV1;
    sourceParentEndpointReplayedExactlyAtRunStart: boolean;
    allFiveWallEventsCommittedExactlyOnce: boolean;
    exactEventIntegratedMonolithicBackwardEulerExecuted: boolean;
    eightEdgeBackwardEulerFlowVolumesReported: boolean;
    oneSupercycleConservationGatePass: boolean;
    completeStateTraceContentBound: boolean;
    projectSyntheticOneSupercycleBeExecutionPass: boolean;
    referenceDtFiveWallResponsePass: boolean;
  }>;

export type PhaseB1ProjectSyntheticOneSupercycleBeFailureV1 =
  StaticResultFields & Readonly<{
    completed: false;
    failureStage:
      | "event-schedule-runner"
      | "post-run-ledger-metric-or-trace";
    failureReason: string;
    scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerResultV1;
    lastEndpointProjection: PhaseB1CompleteEndpointProjectionV1;
    orderedAttemptTraceSha256: string;
    projectSyntheticOneSupercycleBeExecutionPass: false;
    referenceDtFiveWallResponsePass: false;
  }>;

export type PhaseB1ProjectSyntheticOneSupercycleBeResultV1 =
  | PhaseB1ProjectSyntheticOneSupercycleBeSuccessV1
  | PhaseB1ProjectSyntheticOneSupercycleBeFailureV1;

/**
 * Executes exactly one candidate-prior normal-sinus supercycle from the
 * authenticated quiescent parent. A completed run is evidence of one-cycle
 * execution and conservation only; it is deliberately not a periodic-state,
 * full-beat-acceptance, physiology, or Phase-B1 acceptance result.
 */
export function runPhaseB1ProjectSyntheticOneSupercycleBeV1(
  input: PhaseB1ProjectSyntheticOneSupercycleBeInputV1,
): PhaseB1ProjectSyntheticOneSupercycleBeResultV1 {
  assertExactPlainRecordV1(input, [
    "sourceCase",
    "schedule",
    "nominalDtSec",
    "sha256Hex",
  ], "Phase B1 one-supercycle BE input");
  if (typeof input.sha256Hex !== "function") {
    throw new Error("one-supercycle BE requires a SHA-256 provider");
  }
  const sourceCase = validateSourceCase(input.sourceCase);
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const nominalDtSec = requireSupportedNominalTimeStep(input.nominalDtSec);
  if (
    schedule.sourceBindings.phaseB1WallMaterialBindingSha256
      !== sourceCase.wallMaterialBinding.contentSha256
  ) {
    throw new Error(
      "one-supercycle schedule and quiescent parent wall binding differ",
    );
  }
  const startTimeSec = 0 as const;
  const endTimeSec = schedule.cycleLengthSec;
  if (!Object.is(endTimeSec, 0.8)) {
    throw new Error("one-supercycle schedule must retain the 0.8 s cycle");
  }
  const scheduledEvents =
    generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      startTimeSec,
      endTimeSec,
      input.sha256Hex,
    );
  validateCycleZeroEvents(scheduledEvents);
  const staticFields = buildStaticFields(
    sourceCase,
    schedule,
    scheduledEvents,
    nominalDtSec,
  );
  const scheduleRun = runPhaseB1BackwardEulerEventScheduleRunnerV1({
    model: sourceCase.model,
    wallMaterialBinding: sourceCase.wallMaterialBinding,
    previousEndpoint: sourceCase.referenceEndpoint,
    endTimeSec,
    nominalDtSec,
    orderedEvents: Object.freeze(scheduledEvents.map((event) =>
      event.calciumDriveEvent)),
  });
  if (scheduleRun.completed === false) {
    const lastEndpointProjection = buildPhaseB1CompleteEndpointProjectionV1({
      endpoint: scheduleRun.lastAcceptedEndpoint,
      sha256Hex: input.sha256Hex,
    });
    return Object.freeze({
      ...staticFields,
      completed: false,
      failureStage: "event-schedule-runner",
      failureReason: scheduleRun.failureReason,
      scheduleRun,
      lastEndpointProjection,
      orderedAttemptTraceSha256: buildAttemptTraceSha256(
        scheduleRun,
        input.sha256Hex,
      ),
      projectSyntheticOneSupercycleBeExecutionPass: false,
      referenceDtFiveWallResponsePass: false,
    });
  }

  try {
    const committedIntervalLedger =
      buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
        scheduleRun,
    });
    const completeEndpointMetric = evaluatePhaseB1CompleteEndpointMetricV1({
      referenceEndpoint: scheduleRun.initialEndpoint,
      candidateEndpoint: scheduleRun.finalEndpoint,
      registry: sourceCase.destinationRegistry,
      sha256Hex: input.sha256Hex,
    });
    const traceBindings = buildTraceBindings(
      sourceCase,
      scheduleRun,
      input.sha256Hex,
    );
    const sourceParentProjection = buildPhaseB1CompleteEndpointProjectionV1({
      endpoint: sourceCase.referenceEndpoint,
      sha256Hex: input.sha256Hex,
    });
    const sourceParentEndpointReplayedExactlyAtRunStart =
      Object.is(scheduleRun.initialEndpoint.timeSec, startTimeSec)
      && traceBindings.initialEndpointSha256
        === sourceParentProjection.contentSha256;
    const allFiveWallEventsCommittedExactlyOnce =
      scheduleRun.allOrderedEventsCommittedExactlyOnce
      && scheduleRun.orderedEvents.length
        === PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_POLICY_V1
          .expectedFiveWallEventCount
      && scheduleRun.eventBoundaryCount
        === PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_POLICY_V1
          .expectedFiveWallEventCount;
    const oneSupercycleIntervalAudit =
      buildPhaseB1ProjectSyntheticOneSupercycleIntervalAuditV1(
        schedule,
        scheduledEvents,
        scheduleRun,
        committedIntervalLedger,
        allFiveWallEventsCommittedExactlyOnce,
      );
    const fiveWallResponseProtocolRequiredForThisRun = Object.is(
      nominalDtSec,
      PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_NOMINAL_DT_SEC_V1,
    );
    const fiveWallResponseProtocol =
      fiveWallResponseProtocolRequiredForThisRun
        ? runPhaseB1ProjectSyntheticFiveWallResponseProtocolV1({
          schedule,
          scheduleRun,
          sha256Hex: input.sha256Hex,
        })
        : null;
    const fiveWallScaleSeparatedResponseDetected =
      fiveWallResponseProtocol?.response
        .projectSyntheticFiveWallEventTrainScaleSeparatedResponseDetected
        ?? false;
    if (fiveWallResponseProtocol !== null) {
      assertBuilderIssuedPhaseB1ProjectSyntheticFiveWallResponseResultV1(
        fiveWallResponseProtocol,
        input.sha256Hex,
      );
    }
    const responseEvidenceBindingPolicyPass =
      fiveWallResponseProtocolRequiredForThisRun
        ? fiveWallResponseProtocol !== null
          && isSha256(fiveWallResponseProtocol.contentSha256)
          && fiveWallResponseProtocol.response
            .sourceRunnerProvenanceCertified
        : fiveWallResponseProtocol === null;
    const exactEventIntegratedMonolithicBackwardEulerExecuted =
      scheduleRun.eventScheduleComponentPass
      && scheduleRun.acceptedTransactions.every((transaction) =>
        transaction.eventFreeMonolithicAtomicStepIntegrated
        && transaction.preJumpForcingParityVerified
        && transaction.calciumParametersOwnedByWallBinding);
    const eightEdgeBackwardEulerFlowVolumesReported =
      committedIntervalLedger.edgeOrder.length === 8
      && committedIntervalLedger.edgeOrder.every((flowId) =>
        Object.hasOwn(
          committedIntervalLedger.integratedEdgeVolumeByFlow,
          flowId,
        ));
    const completeStateTraceContentBound = [
      traceBindings.sourceParentEndpointSha256,
      traceBindings.initialEndpointSha256,
      traceBindings.finalEndpointSha256,
      traceBindings.orderedAttemptTraceSha256,
      traceBindings.orderedStepTraceSha256,
      traceBindings.eventTransactionTraceSha256,
      traceBindings.traceBundleContentSha256,
    ].every(isSha256)
      && traceBindings.eventTransactionCount
        === PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_POLICY_V1
          .expectedFiveWallEventCount;
    const sourceDestinationRegistryObjectRetained = Object.is(
      scheduleRun.newtonScaleRegistryObjectAtRunStart,
      sourceCase.destinationRegistry,
    );
    const oneSupercycleEvidenceBundleContentSha256 = computeCanonicalSha256({
      schemaId: "phase-b1-one-supercycle-be-evidence-bundle-binding-v1",
      runnerId: PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_V1_ID,
      policyId:
        PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_POLICY_V1.policyId,
      slsMode: sourceCase.slsMode,
      nominalDtSec,
      scheduleSha256: schedule.contentSha256,
      exactIntervalAuditId: oneSupercycleIntervalAudit.auditId,
      committedIntervalRegistrySha256:
        committedIntervalLedger.newtonScaleRegistryContentSha256,
      completeStateTraceBundleSha256:
        traceBindings.traceBundleContentSha256,
      fiveWallResponseProtocolContentSha256:
        fiveWallResponseProtocol?.contentSha256 ?? null,
      fiveWallResponseProtocolRequiredForThisRun,
    }, input.sha256Hex);
    const completeOneSupercycleEvidenceBundleContentBound =
      responseEvidenceBindingPolicyPass
      && isSha256(oneSupercycleEvidenceBundleContentSha256);
    const projectSyntheticOneSupercycleBeExecutionPass =
      sourceParentEndpointReplayedExactlyAtRunStart
      && sourceDestinationRegistryObjectRetained
      && scheduleRun.testFailureProbeUsed === false
      && allFiveWallEventsCommittedExactlyOnce
      && oneSupercycleIntervalAudit.exactOneScheduleSupercycleVerified
      && exactEventIntegratedMonolithicBackwardEulerExecuted
      && eightEdgeBackwardEulerFlowVolumesReported
      && committedIntervalLedger.structuralAndNumericalIntervalLedgerGatesPass
      && completeStateTraceContentBound
      && completeOneSupercycleEvidenceBundleContentBound;
    const referenceDtFiveWallResponsePass =
      fiveWallResponseProtocolRequiredForThisRun
      && responseEvidenceBindingPolicyPass
      && fiveWallScaleSeparatedResponseDetected;
    return Object.freeze({
      ...staticFields,
      sourceDestinationRegistryObjectRetained,
      completed: true,
      scheduleRun,
      committedIntervalLedger,
      oneSupercycleIntervalAudit,
      fiveWallResponseProtocol,
      fiveWallResponseProtocolRequiredForThisRun,
      fiveWallScaleSeparatedResponseDetected,
      responseEvidenceBindingPolicyPass,
      oneSupercycleEvidenceBundleContentSha256,
      completeOneSupercycleEvidenceBundleContentBound,
      completeEndpointMetric,
      traceBindings,
      sourceParentEndpointReplayedExactlyAtRunStart,
      allFiveWallEventsCommittedExactlyOnce,
      exactEventIntegratedMonolithicBackwardEulerExecuted,
      eightEdgeBackwardEulerFlowVolumesReported,
      oneSupercycleConservationGatePass:
        oneSupercycleIntervalAudit.exactOneScheduleSupercycleVerified
        && committedIntervalLedger
          .committedIntervalTotalBloodVolumeConservationGatePass,
      completeStateTraceContentBound,
      projectSyntheticOneSupercycleBeExecutionPass,
      referenceDtFiveWallResponsePass,
    });
  } catch (error) {
    const lastEndpointProjection = buildPhaseB1CompleteEndpointProjectionV1({
      endpoint: scheduleRun.finalEndpoint,
      sha256Hex: input.sha256Hex,
    });
    return Object.freeze({
      ...staticFields,
      completed: false,
      failureStage: "post-run-ledger-metric-or-trace",
      failureReason: errorMessage(error),
      scheduleRun,
      lastEndpointProjection,
      orderedAttemptTraceSha256: buildAttemptTraceSha256(
        scheduleRun,
        input.sha256Hex,
      ),
      projectSyntheticOneSupercycleBeExecutionPass: false,
      referenceDtFiveWallResponsePass: false,
    });
  }
}

function validateSourceCase(
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1,
): PhaseB1QuiescentReferenceEventFreeCaseV1 {
  assertExactPlainRecordV1(sourceCase, [
    "caseId",
    "slsMode",
    "inverse",
    "acceptedInverseEndpoint",
    "referenceEndpoint",
    "model",
    "wallMaterialBinding",
    "destinationEvaluation",
    "destinationRegistry",
    "registryAudit",
    "staticAudit",
    "projectSyntheticQuiescentReferenceEventFreeCasePass",
    "closedLoopStationarityPass",
    "physiologicalReferenceAcceptancePass",
    "supportedReferenceEnvelopePass",
    "fullBeatAcceptancePass",
    "physiologicalValidationPass",
    "phaseB1AcceptancePass",
    "modelCoreIntegration",
    "browserRuntimeAdopted",
    "releaseRuntimeReachable",
    "testOnly",
  ], "Phase B1 one-supercycle source case");
  assertCanonicalPhaseB1QuiescentPressureReferenceInverseResultV1(
    sourceCase.inverse,
  );
  if (
    sourceCase.caseId !== PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID
    || sourceCase.slsMode !== sourceCase.inverse.slsMode
    || sourceCase.referenceEndpoint.differentialState.slsMode
      !== sourceCase.slsMode
    || !Object.is(sourceCase.referenceEndpoint.timeSec, 0)
    || sourceCase.projectSyntheticQuiescentReferenceEventFreeCasePass !== true
    || sourceCase.registryAudit.pass !== true
    || sourceCase.staticAudit.pass !== true
    || sourceCase.staticAudit.fixedCalciumExactZero !== true
    || sourceCase.staticAudit.allClosedLoopFlowsExactlyZero !== true
    || !Object.is(
      sourceCase.destinationRegistry,
      sourceCase.model.newtonScaleRegistry,
    )
    || sourceCase.destinationRegistry.fixedBeforeRun !== true
    || sourceCase.destinationRegistry.adaptiveRescaling !== false
    || sourceCase.closedLoopStationarityPass !== false
    || sourceCase.physiologicalReferenceAcceptancePass !== false
    || sourceCase.supportedReferenceEnvelopePass !== false
    || sourceCase.fullBeatAcceptancePass !== false
    || sourceCase.physiologicalValidationPass !== false
    || sourceCase.phaseB1AcceptancePass !== false
    || sourceCase.modelCoreIntegration !== false
    || sourceCase.browserRuntimeAdopted !== false
    || sourceCase.releaseRuntimeReachable !== false
    || sourceCase.testOnly !== true
  ) {
    throw new Error("one-supercycle requires its accepted quiescent test parent");
  }
  return sourceCase;
}

export function buildPhaseB1ProjectSyntheticOneSupercycleIntervalAuditV1(
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  scheduledEvents:
    readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[],
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
  ledger: PhaseB1BackwardEulerCommittedIntervalLedgerV1,
  allFiveWallEventsCommittedExactlyOnce: boolean,
): PhaseB1ProjectSyntheticOneSupercycleIntervalAuditV1 {
  validateCycleZeroEvents(scheduledEvents);
  const sourceIntervalLedgerProvenanceVerified =
    ledger.sourceRunnerSuccessAuthenticatedInProcess
    && ledger.runnerCommittedTransactionProvenanceVerified
    && ledger.uncommittedOrFailedAttemptTransactionCountConsumed === 0
    && ledger.sourceTestFailureProbeUsed === false
    && ledger.nonProbeEvidenceEligibilityPass
    && ledger.supercycleSemanticsEvaluatedByLedger === false;
  const startAtScheduleCycleOriginExact =
    Object.is(scheduleRun.initialEndpoint.timeSec, 0)
    && Object.is(ledger.startTimeSec, 0);
  const endAtNextScheduleCycleOriginExact =
    Object.is(scheduleRun.finalEndpoint.timeSec, schedule.cycleLengthSec)
    && Object.is(ledger.endTimeSec, schedule.cycleLengthSec);
  const durationEqualsScheduleRepeatPeriodExact =
    Object.is(ledger.durationSec, schedule.repeatPolicy.repeatPeriodSec)
    && Object.is(schedule.cycleLengthSec, schedule.repeatPolicy.repeatPeriodSec);
  const runnerRequestedEndMatchesNextCycleOriginExact = Object.is(
    scheduleRun.requestedEndTimeSec,
    schedule.cycleLengthSec,
  );
  const runnerOrderedEventsMatchScheduledEventsExactly =
    scheduleRun.orderedEvents.length === scheduledEvents.length
    && scheduleRun.orderedEvents.every((runnerEvent, index) => {
      const scheduledEvent = scheduledEvents[index].calciumDriveEvent;
      return runnerEvent.wallId === scheduledEvent.wallId
        && runnerEvent.eventId === scheduledEvent.eventId
        && Object.is(
          runnerEvent.calciumDriveTimeSec,
          scheduledEvent.calciumDriveTimeSec,
        )
        && Object.is(runnerEvent.strength, scheduledEvent.strength)
        && runnerEvent.timingOwner === scheduledEvent.timingOwner;
    });
  const exactOneScheduleSupercycleVerified =
    sourceIntervalLedgerProvenanceVerified
    && startAtScheduleCycleOriginExact
    && endAtNextScheduleCycleOriginExact
    && durationEqualsScheduleRepeatPeriodExact
    && runnerRequestedEndMatchesNextCycleOriginExact
    && runnerOrderedEventsMatchScheduledEventsExactly
    && allFiveWallEventsCommittedExactlyOnce;
  if (!exactOneScheduleSupercycleVerified) {
    throw new Error("committed interval is not exactly schedule supercycle zero");
  }
  return Object.freeze({
    auditId:
      "phase-b1-project-synthetic-exact-one-schedule-supercycle-audit-v1",
    sourceIntervalLedgerProvenanceVerified: true,
    startAtScheduleCycleOriginExact: true,
    endAtNextScheduleCycleOriginExact: true,
    durationEqualsScheduleRepeatPeriodExact: true,
    runnerRequestedEndMatchesNextCycleOriginExact: true,
    scheduledEventsExactlyCycleZeroFiveWallSequence: true,
    runnerOrderedEventsMatchScheduledEventsExactly: true,
    allFiveWallEventsCommittedExactlyOnce: true,
    exactOneScheduleSupercycleVerified: true,
    periodOneEndpointStateClaimed: false,
    periodicityAcceptanceClaimed: false,
    fullBeatAcceptanceClaimed: false,
  });
}

function validateCycleZeroEvents(
  events: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[],
): void {
  if (events.length !== 5) {
    throw new Error("one-supercycle requires exactly five wall events");
  }
  for (let index = 0; index < events.length; index += 1) {
    if (
      events[index].cycleIndex !== 0
      || events[index].wallId
        !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1[index]
    ) throw new Error("one-supercycle event order or cycle index drifted");
  }
}

function buildStaticFields(
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1,
  schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  scheduledEvents:
    readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[],
  nominalDtSec: number,
): StaticResultFields {
  return Object.freeze({
    runnerId: PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_V1_ID,
    policyId:
      PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_POLICY_V1.policyId,
    sourceCase,
    sourceCaseId: PHASE_B1_QUIESCENT_REFERENCE_EVENT_FREE_CASE_V1_ID,
    slsMode: sourceCase.slsMode,
    scheduleId:
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID,
    scheduleSha256: schedule.contentSha256,
    nominalDtSec,
    cycleIndex: 0,
    startTimeSec: 0,
    endTimeSec: 0.8,
    scheduledEvents,
    sourceParentAuthenticated: true,
    canonicalProjectSyntheticScheduleAuthenticated: true,
    sourceParentReferenceEndpointProvidedAsRunnerInitialCondition: true,
    sourceDestinationRegistryObjectRetained: Object.is(
      sourceCase.destinationRegistry,
      sourceCase.model.newtonScaleRegistry,
    ),
    sourceDestinationRegistryContentSha256:
      sourceCase.destinationRegistry.registryContentSha256,
    sourceWallMaterialBindingContentSha256:
      sourceCase.wallMaterialBinding.contentSha256,
    scheduleWallMaterialBindingContentSha256:
      schedule.sourceBindings.phaseB1WallMaterialBindingSha256,
    testFailureProbeUsed: false,
    periodicityAcceptancePass: false,
    periodOneAttractorAcceptancePass: false,
    multiStartAcceptancePass: false,
    timestepConvergenceAcceptancePass: false,
    cycleEnergyAcceptancePass: false,
    fullBeatAcceptancePass: false,
    eventIntegratedAcceptancePass: false,
    physiologicalValidationPass: false,
    supportedReferenceEnvelopePass: false,
    phaseB1AcceptancePass: false,
    sdirk2OrCondensedParityPass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
  });
}

function buildTraceBindings(
  sourceCase: PhaseB1QuiescentReferenceEventFreeCaseV1,
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticOneSupercycleTraceBindingsV1 {
  const sourceParentProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: sourceCase.referenceEndpoint,
    sha256Hex,
  });
  const initialProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: scheduleRun.initialEndpoint,
    sha256Hex,
  });
  const finalProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: scheduleRun.finalEndpoint,
    sha256Hex,
  });
  const stateLabels = Object.freeze([
    ...buildPhaseB1StoredDifferentialLabelsV1(scheduleRun.slsMode),
    "algebraic.triseg.V_m_S",
    "algebraic.triseg.y_m",
  ]);
  const stateScalarCount = (scheduleRun.slsMode === "on" ? 61 : 56) as
    61 | 56;
  if (stateLabels.length !== stateScalarCount) {
    throw new Error("one-supercycle trace state topology drifted");
  }
  const orderedAttemptTraceSha256 = buildAttemptTraceSha256(
    scheduleRun,
    sha256Hex,
  );
  const attemptByTransaction = new Map<
    PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
    PhaseB1BackwardEulerEventScheduleRunnerSuccessV1["attempts"][number]
  >();
  for (const attempt of scheduleRun.attempts) {
    if (attempt.acceptedTransaction !== null) {
      if (attemptByTransaction.has(attempt.acceptedTransaction)) {
        throw new Error("one-supercycle transaction has duplicate attempts");
      }
      attemptByTransaction.set(attempt.acceptedTransaction, attempt);
    }
  }
  const stepTrace = scheduleRun.acceptedTransactions.map(
    (transaction, stepIndex) => {
      const attempt = attemptByTransaction.get(transaction);
      if (attempt === undefined || !attempt.committedToCompletedPrefix) {
        throw new Error("one-supercycle committed transaction lost retry provenance");
      }
      return Object.freeze({
        stepIndex,
        attemptIndex: attempt.attemptIndex,
        attemptKey: attempt.attemptKey,
        retryDepth: attempt.retryDepth,
        binaryPath: attempt.binaryPath,
        startTimeSec: transaction.previousEndpoint.timeSec,
        endTimeSec: transaction.nextEndpoint.timeSec,
        durationSec:
          transaction.nextEndpoint.timeSec - transaction.previousEndpoint.timeSec,
        actualCommittedDurationSec: transaction.actualCommittedDurationSec,
        eventKeys: transaction.coordinator.eventKeys,
        startState: endpointTraceValues(transaction.previousEndpoint),
        endLeftLimitState:
          endpointTraceValues(transaction.leftLimitStep.nextEndpointLeftLimit),
        endPostEventState: endpointTraceValues(transaction.nextEndpoint),
        endpointFlowsM3PerSec: Object.freeze(
          FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) =>
            transaction.leftLimitStep.nextEvaluation.closedLoop
              .allFlowsM3PerSec[flowId]),
        ),
        volumeResidualM3PerSec: Object.freeze(
          BLOOD_COMPARTMENT_IDS.map((compartmentId) =>
            transaction.leftLimitStep.residualEvaluation.volumeResidual
              .residualsM3PerSec[compartmentId]),
        ),
        slsBackwardEulerPreCommit: Object.freeze({
          policyId: transaction.slsBackwardEulerPreCommitPolicyId,
          auditId: transaction.slsBackwardEulerPreCommitAudit.auditId,
          mode: transaction.slsBackwardEulerPreCommitAudit.mode,
          auditCompletedBeforeEventCommit:
            transaction.slsBackwardEulerAuditCompletedBeforeEventCommit,
          gatePass: transaction.slsBackwardEulerPreCommitGatePass,
          normalizedIdentityResidual:
            transaction.slsBackwardEulerPreCommitAudit
              .normalizedIdentityResidual,
          normalizedIdentityResidualTolerance:
            transaction.slsBackwardEulerPreCommitAudit
              .normalizedIdentityResidualTolerance,
          maximumAbsoluteAlphaMismatch:
            transaction.slsBackwardEulerPreCommitAudit
              .maximumAbsoluteAlphaMismatch,
          alphaMismatchTolerance:
            transaction.slsBackwardEulerPreCommitAudit
              .alphaMismatchTolerance,
          slsStatePhysicallyAbsent:
            transaction.slsBackwardEulerPreCommitAudit
              .slsStatePhysicallyAbsent,
        }),
        newton: Object.freeze({
          unknownCount: transaction.leftLimitStep.unknownCount,
          residualCount: transaction.leftLimitStep.residualCount,
          calciumNewtonUnknownCount:
            transaction.leftLimitStep.calciumNewtonUnknownCount,
          calciumResidualCount: transaction.leftLimitStep.calciumResidualCount,
          iterationCount:
            transaction.leftLimitStep.newtonDiagnostics.newtonIterationCount,
          finalScaledResidualInfinityNorm:
            transaction.leftLimitStep.newtonDiagnostics
              .finalResidualInfinityNorm,
          finalScaledUpdateInfinityNorm:
            transaction.leftLimitStep.newtonDiagnostics
              .finalUpdateInfinityNorm,
          minimumLandSimplexMargin:
            transaction.leftLimitStep.minimumLandSimplexMargin,
        }),
      });
    },
  );
  const orderedStepTraceSha256 = computeCanonicalSha256(Object.freeze({
    traceId: "phase-b1-one-supercycle-be-ordered-step-trace-v1",
    stateLabels,
    stateScalarCount,
    flowOrder: FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
    compartmentOrder: BLOOD_COMPARTMENT_IDS,
    steps: Object.freeze(stepTrace),
  }), sha256Hex);
  const eventTransactions = scheduleRun.acceptedTransactions.flatMap(
    (transaction, stepIndex) => transaction.coordinator.eventCount === 0
      ? []
      : [Object.freeze({
        stepIndex,
        timeSec: transaction.nextEndpoint.timeSec,
        eventKeys: transaction.coordinator.eventKeys,
        eventCountByWall: transaction.coordinator.eventCountByWall,
        aggregateEventStrengthByWall:
          transaction.coordinator.aggregateEventStrengthByWall,
        calciumAtStart:
          transaction.coordinator.calciumDriveStateByWallAtStart,
        calciumAtEndLeftLimit:
          transaction.coordinator.calciumDriveStateByWallAtEndLeftLimit,
        calciumAfterEventBatch:
          transaction.coordinator.calciumDriveStateByWallAfterEventBatch,
        algebraicStateAtEndLeftLimit:
          transaction.coordinator.algebraicStateAtEndLeftLimit,
        algebraicStateAfterReinitialization:
          transaction.coordinator.algebraicStateAfterReinitialization,
        algebraicReinitializationCallCount:
          transaction.algebraicReinitializationCallCount,
      })],
  );
  const eventTransactionTraceSha256 = computeCanonicalSha256(Object.freeze({
    traceId: "phase-b1-one-supercycle-be-event-transaction-trace-v1",
    eventTransactions: Object.freeze(eventTransactions),
  }), sha256Hex);
  const bundlePayload = Object.freeze({
    traceSchemaId: "phase-b1-one-supercycle-be-complete-trace-bindings-v1",
    sourceParentEndpointSha256: sourceParentProjection.contentSha256,
    initialEndpointSha256: initialProjection.contentSha256,
    finalEndpointSha256: finalProjection.contentSha256,
    orderedAttemptTraceSha256,
    orderedStepTraceSha256,
    eventTransactionTraceSha256,
  });
  return Object.freeze({
    traceSchemaId:
      "phase-b1-one-supercycle-be-complete-trace-bindings-v1",
    stateCoordinateOrder:
      "stored-differential-state-followed-by-two-triseg-algebraic-coordinates",
    stateScalarCount,
    stateLabels,
    attemptCount: scheduleRun.attempts.length,
    committedStepCount: scheduleRun.acceptedTransactions.length,
    eventTransactionCount: eventTransactions.length,
    ...bundlePayload,
    traceBundleContentSha256: computeCanonicalSha256(bundlePayload, sha256Hex),
  });
}

function buildAttemptTraceSha256(
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerResultV1,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  return computeCanonicalSha256(Object.freeze({
    traceId: "phase-b1-one-supercycle-be-ordered-attempt-trace-v1",
    completed: scheduleRun.completed,
    attempts: Object.freeze(scheduleRun.attempts.map((attempt) =>
      Object.freeze({
        attemptIndex: attempt.attemptIndex,
        requestedSegmentIndex: attempt.requestedSegmentIndex,
        attemptKey: attempt.attemptKey,
        binaryPath: attempt.binaryPath,
        retryDepth: attempt.retryDepth,
        refinementFactor: attempt.refinementFactor,
        startTimeSec: attempt.startTimeSec,
        endTimeSec: attempt.endTimeSec,
        eventKeysAtEnd: attempt.eventKeysAtEnd,
        accepted: attempt.accepted,
        failureStage: attempt.failureStage,
        failureReason: attempt.failureReason,
        rollbackEndpoint: attempt.rollbackEndpoint === null
          ? null
          : endpointTraceValues(attempt.rollbackEndpoint),
        acceptedEndpoint: attempt.acceptedTransaction === null
          ? null
          : endpointTraceValues(attempt.acceptedTransaction.nextEndpoint),
        registryObjectIdentityAtInvocation:
          attempt.registryObjectIdentityAtInvocation,
        transactionContractAuditPass: attempt.transactionContractAuditPass,
        testFailureInjected: attempt.testFailureInjected,
        committedToCompletedPrefix: attempt.committedToCompletedPrefix,
      }))),
  }), sha256Hex);
}

function endpointTraceValues(
  endpoint: PhaseB1EventIntegratedMonolithicTransactionSuccessV1[
    "nextEndpoint"
  ],
): readonly number[] {
  const values = Object.freeze([
    ...encodePhaseB1StoredDifferentialStateV1(endpoint.differentialState),
    endpoint.triSegCoordinates.V_m_S,
    endpoint.triSegCoordinates.y_m,
  ]);
  const expected = endpoint.differentialState.slsMode === "on" ? 61 : 56;
  if (values.length !== expected || values.some((value) =>
    !Number.isFinite(value))) {
    throw new Error("one-supercycle trace endpoint topology is invalid");
  }
  return values;
}

function requireSupportedNominalTimeStep(value: unknown): number {
  if (
    typeof value !== "number"
    || !PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_POLICY_V1
      .supportedNominalTimeStepsSec.includes(value as 0.001)
  ) throw new Error("one-supercycle nominalDtSec is not predeclared");
  return value;
}

function isSha256(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const PHASE_B1_PROJECT_SYNTHETIC_ONE_SUPERCYCLE_BE_SEMANTICS_V1 =
  Object.freeze({
    units: FOUR_CHAMBER_SI_UNITS,
    signConventions: FOUR_CHAMBER_SIGN_CONVENTIONS,
    ownership: FOUR_CHAMBER_OWNERSHIP,
    walls: WALL_IDS,
    compartments: BLOOD_COMPARTMENT_IDS,
    flows: FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
  } as const);
