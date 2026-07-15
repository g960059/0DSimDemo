import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import type {
  PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
  PHASE_B1_EVENT_INTEGRATED_SLS_BE_FAILURE_PROBE_V1_ID,
  PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1,
  runPhaseB1EventIntegratedMonolithicTransactionV1,
  runPhaseB1EventIntegratedMonolithicTransactionSlsAuditFailureProbeV1,
  type PhaseB1EventIntegratedMonolithicTransactionFailureV1,
  type PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import {
  createPhaseB1EndpointStateV1,
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyStageSnapshotV1";
import type {
  PhaseB1WallCalciumDriveEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WholeHeartExactCalciumEventCoordinatorV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID =
  "phase-b1-backward-euler-explicit-event-schedule-runner-v1" as const;

export const PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID =
  "phase-b1-backward-euler-event-schedule-test-failure-probe-v1" as const;

export const PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_SLS_AUDIT_FAILURE_PROBE_V1_ID =
  "phase-b1-backward-euler-event-schedule-sls-audit-test-failure-probe-v1" as const;

export const PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RETRY_DEPTHS_V1 =
  Object.freeze([0, 1, 2, 3] as const);

export const PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_REFINEMENT_FACTORS_V1 =
  Object.freeze([1, 2, 4, 8] as const);

const PHASE_B1_COMMITTED_EVENT_SCHEDULE_SUCCESS_RESULTS_V1 =
  new WeakSet<object>();

export const PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1 = Object.freeze({
  policyId: "phase-b1-backward-euler-explicit-event-schedule-policy-v1",
  intervalEventOwnership: "right-continuous-start-events-in-open-closed-interval" as const,
  requestedSegmentBoundary:
    "minimum-of-original-nominal-grid-boundary-next-event-and-run-end" as const,
  oneUlpNominalBoundaryCoalescence:
    "exact-event-endpoint-combines-only-with-an-immediately-adjacent-binary64-grid-boundary" as const,
  oneUlpRunEndNominalBoundaryCoalescence:
    "exact-run-end-replaces-only-an-immediately-adjacent-binary64-original-grid-boundary-without-crossing-an-event" as const,
  eventTimeSnappingAllowed: false as const,
  runEndTimeSnappingAllowed: false as const,
  epsilonBoundaryToleranceAllowed: false as const,
  retryDepths: PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RETRY_DEPTHS_V1,
  retryRefinementFactors:
    PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_REFINEMENT_FACTORS_V1,
  failedSegmentRetry: "recursive-bisection-from-requested-segment-entry" as const,
  endpointEventsDuringRetry: "final-right-child-only" as const,
  failedRequestedSegmentCommit: "discard-all-provisional-retry-children" as const,
  hiddenSubdivisionAllowed: false as const,
  explicitRecordedSolverRetry: true as const,
  slsBackwardEulerPreCommitPolicyId:
    PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId,
  failedSlsBackwardEulerAuditRetry:
    "same-explicit-recursive-bisection-as-any-atomic-transaction-failure" as const,
  adaptiveRescalingAllowed: false as const,
  testOnly: true as const,
  fullBeatAcceptance: false as const,
  periodicityAcceptance: false as const,
  physiologicalValidation: false as const,
  phaseB1Acceptance: false as const,
  releaseRuntimeReachable: false as const,
} as const);

type RetryDepth =
  typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RETRY_DEPTHS_V1[number];
type RefinementFactor =
  typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_REFINEMENT_FACTORS_V1[number];

export type PhaseB1RunEndNominalGridBoundaryCoalescenceDirectionV1 =
  | "run-end-immediate-predecessor"
  | "run-end-immediate-successor"
  | null;

export type PhaseB1EventNominalGridBoundaryCoalescenceDirectionV1 =
  | "event-immediate-predecessor"
  | "event-immediate-successor"
  | null;

export type PhaseB1BackwardEulerEventScheduleRunnerInputV1 = Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  endTimeSec: number;
  nominalDtSec: number;
  orderedEvents: readonly PhaseB1WallCalciumDriveEventV1[];
}>;

export type PhaseB1BackwardEulerEventScheduleFailureProbeV1 = Readonly<{
  probeId:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID;
  failAttemptKeys: readonly string[];
}>;

export type PhaseB1BackwardEulerEventScheduleSlsAuditFailureProbeV1 =
  Readonly<{
    probeId:
      typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_SLS_AUDIT_FAILURE_PROBE_V1_ID;
    failAttemptKeys: readonly string[];
  }>;

export type PhaseB1BackwardEulerEventScheduleAttemptAuditV1 = Readonly<{
  attemptIndex: number;
  attemptIndexWithinRequestedSegment: number;
  requestedSegmentIndex: number;
  attemptKey: string;
  binaryPath: string;
  retryDepth: RetryDepth;
  refinementFactor: RefinementFactor;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  eventKeysAtEnd: readonly string[];
  endpointEventBatchPresent: boolean;
  eventBatchAtRequestedSegmentEndExact: boolean;
  accepted: boolean;
  acceptedTransaction:
    PhaseB1EventIntegratedMonolithicTransactionSuccessV1 | null;
  failedTransaction:
    PhaseB1EventIntegratedMonolithicTransactionFailureV1 | null;
  failureStage: string | null;
  failureReason: string | null;
  rollbackEndpoint: PhaseB1EndpointStateV1 | null;
  rollbackEndpointMatchesAttemptEntryExact: boolean | null;
  registryObjectIdentityAtInvocation: boolean;
  transactionContractAuditPass: boolean;
  testFailureInjected: boolean;
  committedToCompletedPrefix: boolean;
}>;

export type PhaseB1BackwardEulerEventScheduleRequestedSegmentSuccessV1 =
  Readonly<{
    completed: true;
    requestedSegmentIndex: number;
    nominalGridIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    durationSec: number;
    nominalGridBoundaryTimeSec: number;
    endedAtNominalGridBoundary: boolean;
    endedAtRunBoundary: boolean;
    endedAtEventBoundary: boolean;
    offGridEventSplit: boolean;
    rawMinimumBoundaryTimeSec: number;
    requestedEndIsRawMinimumBoundary: boolean;
    requestedEndBoundarySelectionPolicyPass: boolean;
    oneUlpNominalGridBoundaryCoalescenceDirection:
      PhaseB1EventNominalGridBoundaryCoalescenceDirectionV1;
    oneUlpNominalGridBoundaryCoalesced: boolean;
    oneUlpRunEndNominalGridBoundaryCoalescenceDirection:
      PhaseB1RunEndNominalGridBoundaryCoalescenceDirectionV1;
    oneUlpRunEndNominalGridBoundaryCoalescenceEligible: boolean;
    oneUlpRunEndNominalGridBoundaryCoalesced: boolean;
    eventKeysAtEnd: readonly string[];
    entryEndpoint: PhaseB1EndpointStateV1;
    exitEndpoint: PhaseB1EndpointStateV1;
    attempts: readonly PhaseB1BackwardEulerEventScheduleAttemptAuditV1[];
    acceptedTransactions:
      readonly PhaseB1EventIntegratedMonolithicTransactionSuccessV1[];
    solverRetryUsed: boolean;
    solverRetrySubdivisionCount: number;
    maximumRetryDepthUsed: RetryDepth;
    pass: boolean;
  }>;

export type PhaseB1BackwardEulerEventScheduleRequestedSegmentFailureV1 =
  Readonly<{
    completed: false;
    requestedSegmentIndex: number;
    nominalGridIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    durationSec: number;
    nominalGridBoundaryTimeSec: number;
    endedAtNominalGridBoundary: boolean;
    endedAtRunBoundary: boolean;
    endedAtEventBoundary: boolean;
    offGridEventSplit: boolean;
    rawMinimumBoundaryTimeSec: number;
    requestedEndIsRawMinimumBoundary: boolean;
    requestedEndBoundarySelectionPolicyPass: boolean;
    oneUlpNominalGridBoundaryCoalescenceDirection:
      PhaseB1EventNominalGridBoundaryCoalescenceDirectionV1;
    oneUlpNominalGridBoundaryCoalescenceEligible: boolean;
    oneUlpNominalGridBoundaryCoalesced: false;
    oneUlpRunEndNominalGridBoundaryCoalescenceDirection:
      PhaseB1RunEndNominalGridBoundaryCoalescenceDirectionV1;
    oneUlpRunEndNominalGridBoundaryCoalescenceEligible: boolean;
    oneUlpRunEndNominalGridBoundaryCoalesced: false;
    eventKeysAtEnd: readonly string[];
    entryEndpoint: PhaseB1EndpointStateV1;
    rollbackEndpoint: PhaseB1EndpointStateV1;
    rollbackToRequestedSegmentEntryExact: boolean;
    attempts: readonly PhaseB1BackwardEulerEventScheduleAttemptAuditV1[];
    failedAttempt: PhaseB1BackwardEulerEventScheduleAttemptAuditV1;
    failureStage: string;
    failureReason: string;
    discardedProvisionalAcceptedTransactionCount: number;
    solverRetryUsed: boolean;
    solverRetrySubdivisionCount: number;
    maximumRetryDepthUsed: RetryDepth;
  }>;

type RunnerStaticFields = Readonly<{
  runnerId: typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID;
  policyId: typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.policyId;
  transactionId:
    typeof PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID;
  slsBackwardEulerPreCommitPolicyId:
    typeof PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId;
  slsMode: "on" | "off";
  modelObjectAtRunStart: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBindingObjectAtRunStart: PhaseB1WallMaterialBindingV1;
  newtonScaleRegistryObjectAtRunStart: FourChamberNewtonScaleRegistryV1;
  initialEndpoint: PhaseB1EndpointStateV1;
  requestedEndTimeSec: number;
  nominalDtSec: number;
  orderedEvents: readonly PhaseB1WallCalciumDriveEventV1[];
  retryDepths:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RETRY_DEPTHS_V1;
  retryRefinementFactors:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_REFINEMENT_FACTORS_V1;
  originalNominalGridRetainedAcrossEventSplits: true;
  oneUlpNominalBoundaryCoalescence:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.oneUlpNominalBoundaryCoalescence;
  oneUlpRunEndNominalBoundaryCoalescence:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.oneUlpRunEndNominalBoundaryCoalescence;
  eventTimeSnappingApplied: false;
  runEndTimeSnappingApplied: false;
  epsilonBoundaryToleranceApplied: false;
  intervalEventOwnership:
    typeof PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.intervalEventOwnership;
  endpointEventsAssignedToFinalRightRetryChildOnly: true;
  hiddenSubdivisionUsed: false;
  adaptiveRescalingApplied: false;
  testFailureProbeUsed: boolean;
  fullBeatAcceptancePass: false;
  periodicityAcceptancePass: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
  testOnly: true;
}>;

export type PhaseB1BackwardEulerEventScheduleRunnerSuccessV1 =
  RunnerStaticFields & Readonly<{
    completed: true;
    finalEndpoint: PhaseB1EndpointStateV1;
    requestedSegments:
      readonly PhaseB1BackwardEulerEventScheduleRequestedSegmentSuccessV1[];
    acceptedTransactions:
      readonly PhaseB1EventIntegratedMonolithicTransactionSuccessV1[];
    attempts: readonly PhaseB1BackwardEulerEventScheduleAttemptAuditV1[];
    requestedSegmentCount: number;
    acceptedTransactionCount: number;
    attemptedTransactionCount: number;
    eventBoundaryCount: number;
    offGridEventSplitCount: number;
    oneUlpNominalGridBoundaryCoalescenceCount: number;
    oneUlpRunEndNominalGridBoundaryCoalescenceCount: number;
    solverRetrySubdivisionCount: number;
    solverRetryAttemptCount: number;
    maximumRetryDepthUsed: RetryDepth;
    explicitSolverRetryUsed: boolean;
    allOrderedEventsCommittedExactlyOnce: boolean;
    registryObjectReusedAcrossAllAttempts: boolean;
    expectedNewtonUnknownCount: 51 | 46;
    everyAcceptedTransactionHasExpectedNewtonTopology: boolean;
    everyAcceptedTransactionProjectionClippingClampAndFallbackFree: boolean;
    everyAcceptedTransactionContractAuditPass: boolean;
    everyRequestedSegmentBoundarySelectionPolicyPass: boolean;
    acceptedTransactionsMatchCompletedSegmentFlatteningByObjectIdentity: boolean;
    acceptedTransactionsMatchCommittedAttemptProjectionByObjectIdentity: boolean;
    uncommittedAcceptedAttemptTransactionCount: number;
    committedTransactionProvenanceAuditPass: boolean;
    eventScheduleComponentPass: boolean;
  }>;

export type PhaseB1BackwardEulerEventScheduleRunnerFailureV1 =
  RunnerStaticFields & Readonly<{
    completed: false;
    lastAcceptedEndpoint: PhaseB1EndpointStateV1;
    rollbackEndpoint: PhaseB1EndpointStateV1;
    completedRequestedSegments:
      readonly PhaseB1BackwardEulerEventScheduleRequestedSegmentSuccessV1[];
    failedRequestedSegment:
      PhaseB1BackwardEulerEventScheduleRequestedSegmentFailureV1;
    completedTransactionsBeforeFailure:
      readonly PhaseB1EventIntegratedMonolithicTransactionSuccessV1[];
    attempts: readonly PhaseB1BackwardEulerEventScheduleAttemptAuditV1[];
    completedRequestedSegmentCount: number;
    completedTransactionCount: number;
    attemptedTransactionCount: number;
    committedEventBoundaryCount: number;
    committedOffGridEventSplitCount: number;
    committedOneUlpNominalGridBoundaryCoalescenceCount: number;
    committedOneUlpRunEndNominalGridBoundaryCoalescenceCount: number;
    solverRetrySubdivisionCount: number;
    solverRetryAttemptCount: number;
    maximumRetryDepthUsed: RetryDepth;
    explicitSolverRetryUsed: boolean;
    rollbackToFailedRequestedSegmentEntryExact: boolean;
    partialRetryChildrenCommitted: false;
    failureStage: string;
    failureReason: string;
    eventScheduleComponentPass: false;
  }>;

export type PhaseB1BackwardEulerEventScheduleRunnerResultV1 =
  | PhaseB1BackwardEulerEventScheduleRunnerSuccessV1
  | PhaseB1BackwardEulerEventScheduleRunnerFailureV1;

/**
 * Authenticates the live success object produced by this module. This is an
 * in-process provenance boundary, not a serializer: reconstructed or merely
 * shape-compatible objects are deliberately rejected.
 */
export function assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1(
  value: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
): PhaseB1BackwardEulerEventScheduleRunnerSuccessV1 {
  if (
    value === null
    || typeof value !== "object"
    || !PHASE_B1_COMMITTED_EVENT_SCHEDULE_SUCCESS_RESULTS_V1.has(value)
    || value.completed !== true
    || value.eventScheduleComponentPass !== true
  ) {
    throw new Error(
      "event-schedule success must be the live committed result produced by the canonical runner",
    );
  }
  return value;
}

type ValidatedInput = Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  registryAtRunStart: FourChamberNewtonScaleRegistryV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  initialEndpoint: PhaseB1EndpointStateV1;
  endTimeSec: number;
  nominalDtSec: number;
  orderedEvents: readonly PhaseB1WallCalciumDriveEventV1[];
  slsMode: "on" | "off";
}>;

type AttemptDraft = Omit<
  PhaseB1BackwardEulerEventScheduleAttemptAuditV1,
  "committedToCompletedPrefix"
>;

type SegmentDescriptor = Readonly<{
  requestedSegmentIndex: number;
  globalAttemptIndexOffset: number;
  nominalGridIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  nominalGridBoundaryTimeSec: number;
  endedAtNominalGridBoundary: boolean;
  endedAtRunBoundary: boolean;
  endedAtEventBoundary: boolean;
  offGridEventSplit: boolean;
  rawMinimumBoundaryTimeSec: number;
  requestedEndIsRawMinimumBoundary: boolean;
  requestedEndBoundarySelectionPolicyPass: boolean;
  oneUlpNominalGridBoundaryCoalescenceDirection:
    PhaseB1EventNominalGridBoundaryCoalescenceDirectionV1;
  oneUlpNominalGridBoundaryCoalescenceEligible: boolean;
  oneUlpRunEndNominalGridBoundaryCoalescenceDirection:
    PhaseB1RunEndNominalGridBoundaryCoalescenceDirectionV1;
  oneUlpRunEndNominalGridBoundaryCoalescenceEligible: boolean;
  eventsAtEnd: readonly PhaseB1WallCalciumDriveEventV1[];
}>;

type RecursiveSegmentSuccess = Readonly<{
  ok: true;
  endpoint: PhaseB1EndpointStateV1;
  transactions: readonly PhaseB1EventIntegratedMonolithicTransactionSuccessV1[];
  subdivisionCount: number;
}>;

type RecursiveSegmentFailure = Readonly<{
  ok: false;
  failedAttemptDraft: AttemptDraft;
  failureStage: string;
  failureReason: string;
  provisionalAcceptedTransactions:
    readonly PhaseB1EventIntegratedMonolithicTransactionSuccessV1[];
  subdivisionCount: number;
}>;

type RecursiveSegmentResult = RecursiveSegmentSuccess | RecursiveSegmentFailure;

type ProbeContext = Readonly<{
  failureKind: "transaction" | "sls-backward-euler-identity-audit";
  configuredFailureKeys: ReadonlySet<string>;
  consumedFailureKeys: Set<string>;
}> | null;

/**
 * Classifies exact binary64 adjacency only. Following the existing event/grid
 * trace convention, the direction names identify which immediate neighbour
 * the original nominal-grid boundary is relative to the exact run end:
 * `run-end-immediate-predecessor` means the grid is the predecessor of the
 * run end. Equality and every wider gap deliberately return null.
 */
export function classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
  nominalGridBoundaryTimeSec: number,
  runEndTimeSec: number,
): PhaseB1RunEndNominalGridBoundaryCoalescenceDirectionV1 {
  return isImmediateBinary64Successor(
    nominalGridBoundaryTimeSec,
    runEndTimeSec,
  )
    ? "run-end-immediate-predecessor"
    : isImmediateBinary64Successor(
      runEndTimeSec,
      nominalGridBoundaryTimeSec,
    )
      ? "run-end-immediate-successor"
      : null;
}

export function classifyPhaseB1EventNominalGridBoundaryCoalescenceV1(
  nominalGridBoundaryTimeSec: number,
  eventTimeSec: number,
): PhaseB1EventNominalGridBoundaryCoalescenceDirectionV1 {
  return isImmediateBinary64Successor(
    eventTimeSec,
    nominalGridBoundaryTimeSec,
  )
    ? "event-immediate-predecessor"
    : isImmediateBinary64Successor(
      nominalGridBoundaryTimeSec,
      eventTimeSec,
    )
      ? "event-immediate-successor"
      : null;
}

export function isPhaseB1RunEndNominalGridBoundaryCoalescenceEligibleV1(
  nominalGridBoundaryTimeSec: number,
  runEndTimeSec: number,
  nextEventTimeSec: number,
): boolean {
  return classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
    nominalGridBoundaryTimeSec,
    runEndTimeSec,
  ) !== null && !(nextEventTimeSec < runEndTimeSec);
}

/**
 * Advances one explicitly recorded backward-Euler schedule. Prescribed-calcium
 * events own (start,end], split the original nominal grid before the existing
 * atomic transaction is called, and are never propagated retrospectively.
 */
export function runPhaseB1BackwardEulerEventScheduleRunnerV1(
  input: PhaseB1BackwardEulerEventScheduleRunnerInputV1,
): PhaseB1BackwardEulerEventScheduleRunnerResultV1 {
  return runSchedule(input, null);
}

/**
 * Test-only structured failure injection. The production input remains closed
 * and has no callback or executor injection point. Attempt keys use
 * `<requestedSegmentIndex>:root` and then L/R binary paths.
 */
export function runPhaseB1BackwardEulerEventScheduleFailureProbeV1(
  input: PhaseB1BackwardEulerEventScheduleRunnerInputV1,
  probe: PhaseB1BackwardEulerEventScheduleFailureProbeV1,
): PhaseB1BackwardEulerEventScheduleRunnerResultV1 {
  const context = validateFailureProbe(probe, "transaction");
  return runScheduleWithValidatedProbe(input, context);
}

/** Test-only deterministic pre-commit SLS-audit rejection injection. */
export function runPhaseB1BackwardEulerEventScheduleSlsAuditFailureProbeV1(
  input: PhaseB1BackwardEulerEventScheduleRunnerInputV1,
  probe: PhaseB1BackwardEulerEventScheduleSlsAuditFailureProbeV1,
): PhaseB1BackwardEulerEventScheduleRunnerResultV1 {
  const context = validateFailureProbe(
    probe,
    "sls-backward-euler-identity-audit",
  );
  return runScheduleWithValidatedProbe(input, context);
}

function runScheduleWithValidatedProbe(
  input: PhaseB1BackwardEulerEventScheduleRunnerInputV1,
  context: Exclude<ProbeContext, null>,
): PhaseB1BackwardEulerEventScheduleRunnerResultV1 {
  const result = runSchedule(input, context);
  if (
    context.consumedFailureKeys.size
      !== context.configuredFailureKeys.size
  ) {
    const missing = [...context.configuredFailureKeys].filter((key) =>
      !context.consumedFailureKeys.has(key));
    throw new Error(
      `failure probe did not reach configured attempts [${missing.join(", ")}]`,
    );
  }
  return result;
}

function runSchedule(
  rawInput: PhaseB1BackwardEulerEventScheduleRunnerInputV1,
  probe: ProbeContext,
): PhaseB1BackwardEulerEventScheduleRunnerResultV1 {
  const input = validateInput(rawInput);
  const staticFields = buildStaticFields(input, probe !== null);
  const completedSegments:
    PhaseB1BackwardEulerEventScheduleRequestedSegmentSuccessV1[] = [];
  const committedTransactions:
    PhaseB1EventIntegratedMonolithicTransactionSuccessV1[] = [];
  const globalAttempts: PhaseB1BackwardEulerEventScheduleAttemptAuditV1[] = [];
  const startTimeSec = input.initialEndpoint.timeSec;
  let endpoint = input.initialEndpoint;
  let eventCursor = 0;
  let nominalGridIndex = 0;
  let requestedSegmentIndex = 0;
  let committedEventBoundaryCount = 0;
  let committedOffGridEventSplitCount = 0;
  let committedOneUlpNominalGridBoundaryCoalescenceCount = 0;
  let committedOneUlpRunEndNominalGridBoundaryCoalescenceCount = 0;

  while (endpoint.timeSec < input.endTimeSec) {
    const nominalGridBoundaryTimeSec = startTimeSec
      + (nominalGridIndex + 1) * input.nominalDtSec;
    if (nominalGridBoundaryTimeSec <= endpoint.timeSec) {
      nominalGridIndex += 1;
      continue;
    }
    const nextEventTimeSec = input.orderedEvents[eventCursor]
      ?.calciumDriveTimeSec ?? Number.POSITIVE_INFINITY;
    const rawMinimumBoundaryTimeSec = Math.min(
      nominalGridBoundaryTimeSec,
      nextEventTimeSec,
      input.endTimeSec,
    );
    const oneUlpNominalGridBoundaryCoalescenceDirection =
      nominalGridBoundaryTimeSec < input.endTimeSec
        ? classifyPhaseB1EventNominalGridBoundaryCoalescenceV1(
          nominalGridBoundaryTimeSec,
          nextEventTimeSec,
        )
        : null;
    const oneUlpRunEndNominalGridBoundaryCoalescenceDirection =
      classifyPhaseB1RunEndNominalGridBoundaryCoalescenceV1(
        nominalGridBoundaryTimeSec,
        input.endTimeSec,
      );
    // Never cross an earlier event merely to eliminate a run-end/grid sliver.
    // An event exactly at run end remains safe because the selected boundary
    // is still its exact prescribed time and therefore preserves (start,end].
    const oneUlpRunEndNominalGridBoundaryCoalescenceEligible =
      isPhaseB1RunEndNominalGridBoundaryCoalescenceEligibleV1(
        nominalGridBoundaryTimeSec,
        input.endTimeSec,
        nextEventTimeSec,
      );
    const eventAwareRequestedEndTimeSec =
      oneUlpNominalGridBoundaryCoalescenceDirection
        === "event-immediate-successor"
        ? nextEventTimeSec
        : rawMinimumBoundaryTimeSec;
    const requestedEndTimeSec =
      oneUlpRunEndNominalGridBoundaryCoalescenceEligible
        ? input.endTimeSec
        : eventAwareRequestedEndTimeSec;
    if (!(requestedEndTimeSec > endpoint.timeSec)) {
      throw new Error("event scheduler failed to make positive time progress");
    }
    const eventEndIndex = eventGroupEndIndex(
      input.orderedEvents,
      eventCursor,
      requestedEndTimeSec,
    );
    const eventsAtEnd = Object.freeze(
      input.orderedEvents.slice(eventCursor, eventEndIndex),
    );
    const endedAtEventBoundary = eventsAtEnd.length > 0;
    const requestedEndIsRawMinimumBoundary = Object.is(
      requestedEndTimeSec,
      rawMinimumBoundaryTimeSec,
    );
    const oneUlpNominalGridBoundaryCoalescenceEligible =
      endedAtEventBoundary
      && oneUlpNominalGridBoundaryCoalescenceDirection !== null;
    const requestedEndBoundarySelectionPolicyPass =
      requestedEndIsRawMinimumBoundary
      || (
        oneUlpNominalGridBoundaryCoalescenceEligible
        && Object.is(requestedEndTimeSec, nextEventTimeSec)
      )
      || (
        oneUlpRunEndNominalGridBoundaryCoalescenceEligible
        && Object.is(requestedEndTimeSec, input.endTimeSec)
      );
    const descriptor: SegmentDescriptor = Object.freeze({
      requestedSegmentIndex,
      globalAttemptIndexOffset: globalAttempts.length,
      nominalGridIndex,
      startTimeSec: endpoint.timeSec,
      endTimeSec: requestedEndTimeSec,
      nominalGridBoundaryTimeSec,
      endedAtNominalGridBoundary:
        Object.is(requestedEndTimeSec, nominalGridBoundaryTimeSec),
      endedAtRunBoundary: Object.is(requestedEndTimeSec, input.endTimeSec),
      endedAtEventBoundary,
      offGridEventSplit:
        endedAtEventBoundary
        && !Object.is(requestedEndTimeSec, nominalGridBoundaryTimeSec),
      rawMinimumBoundaryTimeSec,
      requestedEndIsRawMinimumBoundary,
      requestedEndBoundarySelectionPolicyPass,
      oneUlpNominalGridBoundaryCoalescenceDirection,
      oneUlpNominalGridBoundaryCoalescenceEligible,
      oneUlpRunEndNominalGridBoundaryCoalescenceDirection,
      oneUlpRunEndNominalGridBoundaryCoalescenceEligible,
      eventsAtEnd,
    });
    const segmentEntry = endpoint;
    const requestedSegmentEntrySnapshot = copyEndpoint(segmentEntry);
    const attemptDrafts: AttemptDraft[] = [];
    const recursive = executeSegmentRecursive(
      input,
      descriptor,
      segmentEntry,
      requestedEndTimeSec,
      eventsAtEnd,
      0,
      "root",
      attemptDrafts,
      probe,
    );
    const finalizedAttempts = finalizeAttempts(
      attemptDrafts,
      recursive.ok,
    );
    globalAttempts.push(...finalizedAttempts);
    const maximumRetryDepthUsed = maximumAttemptDepth(finalizedAttempts);
    if (recursive.ok === false) {
      const failedAttemptIndex = attemptDrafts.indexOf(
        recursive.failedAttemptDraft,
      );
      if (failedAttemptIndex < 0) {
        throw new Error("failed attempt was lost from the segment audit");
      }
      const failedAttempt = finalizedAttempts[failedAttemptIndex];
      const rollbackToRequestedSegmentEntryExact = endpointStateExact(
        requestedSegmentEntrySnapshot,
        segmentEntry,
      );
      const failedRequestedSegment:
        PhaseB1BackwardEulerEventScheduleRequestedSegmentFailureV1 =
        Object.freeze({
          completed: false,
          requestedSegmentIndex,
          nominalGridIndex,
          startTimeSec: descriptor.startTimeSec,
          endTimeSec: descriptor.endTimeSec,
          durationSec: descriptor.endTimeSec - descriptor.startTimeSec,
          nominalGridBoundaryTimeSec,
          endedAtNominalGridBoundary: descriptor.endedAtNominalGridBoundary,
          endedAtRunBoundary: descriptor.endedAtRunBoundary,
          endedAtEventBoundary,
          offGridEventSplit: descriptor.offGridEventSplit,
          rawMinimumBoundaryTimeSec: descriptor.rawMinimumBoundaryTimeSec,
          requestedEndIsRawMinimumBoundary:
            descriptor.requestedEndIsRawMinimumBoundary,
          requestedEndBoundarySelectionPolicyPass:
            descriptor.requestedEndBoundarySelectionPolicyPass,
          oneUlpNominalGridBoundaryCoalescenceDirection:
            descriptor.oneUlpNominalGridBoundaryCoalescenceDirection,
          oneUlpNominalGridBoundaryCoalescenceEligible:
            descriptor.oneUlpNominalGridBoundaryCoalescenceEligible,
          oneUlpNominalGridBoundaryCoalesced: false,
          oneUlpRunEndNominalGridBoundaryCoalescenceDirection:
            descriptor.oneUlpRunEndNominalGridBoundaryCoalescenceDirection,
          oneUlpRunEndNominalGridBoundaryCoalescenceEligible:
            descriptor.oneUlpRunEndNominalGridBoundaryCoalescenceEligible,
          oneUlpRunEndNominalGridBoundaryCoalesced: false,
          eventKeysAtEnd: canonicalEventKeys(eventsAtEnd),
          entryEndpoint: segmentEntry,
          rollbackEndpoint: requestedSegmentEntrySnapshot,
          rollbackToRequestedSegmentEntryExact,
          attempts: finalizedAttempts,
          failedAttempt,
          failureStage: recursive.failureStage,
          failureReason: recursive.failureReason,
          discardedProvisionalAcceptedTransactionCount:
            recursive.provisionalAcceptedTransactions.length,
          solverRetryUsed: finalizedAttempts.some((attempt) =>
            attempt.retryDepth > 0),
          solverRetrySubdivisionCount: recursive.subdivisionCount,
          maximumRetryDepthUsed,
        });
      return Object.freeze({
        ...staticFields,
        completed: false,
        lastAcceptedEndpoint: segmentEntry,
        rollbackEndpoint: requestedSegmentEntrySnapshot,
        completedRequestedSegments: Object.freeze(completedSegments),
        failedRequestedSegment,
        completedTransactionsBeforeFailure:
          Object.freeze(committedTransactions),
        attempts: Object.freeze(globalAttempts),
        completedRequestedSegmentCount: completedSegments.length,
        completedTransactionCount: committedTransactions.length,
        attemptedTransactionCount: globalAttempts.length,
        committedEventBoundaryCount,
        committedOffGridEventSplitCount,
        committedOneUlpNominalGridBoundaryCoalescenceCount,
        committedOneUlpRunEndNominalGridBoundaryCoalescenceCount,
        solverRetrySubdivisionCount: sum(
          completedSegments,
          (segment) => segment.solverRetrySubdivisionCount,
        ) + recursive.subdivisionCount,
        solverRetryAttemptCount: globalAttempts.filter((attempt) =>
          attempt.retryDepth > 0).length,
        maximumRetryDepthUsed: maximumAttemptDepth(globalAttempts),
        explicitSolverRetryUsed: globalAttempts.some((attempt) =>
          attempt.retryDepth > 0),
        rollbackToFailedRequestedSegmentEntryExact:
          rollbackToRequestedSegmentEntryExact,
        partialRetryChildrenCommitted: false,
        failureStage: recursive.failureStage,
        failureReason: recursive.failureReason,
        eventScheduleComponentPass: false,
      });
    }

    endpoint = recursive.endpoint;
    const acceptedTransactions = Object.freeze([...recursive.transactions]);
    const segmentPass = Object.is(endpoint.timeSec, requestedEndTimeSec)
      && descriptor.requestedEndBoundarySelectionPolicyPass
      && finalizedAttempts.every((attempt) =>
        attempt.registryObjectIdentityAtInvocation
        && attempt.transactionContractAuditPass)
      && acceptedTransactions.length === finalizedAttempts.filter((attempt) =>
        attempt.accepted).length
      && acceptedTransactions.every((transaction) =>
        finalizedAttempts.some((attempt) =>
          attempt.acceptedTransaction === transaction));
    const successSegment:
      PhaseB1BackwardEulerEventScheduleRequestedSegmentSuccessV1 =
      Object.freeze({
        completed: true,
        requestedSegmentIndex,
        nominalGridIndex,
        startTimeSec: descriptor.startTimeSec,
        endTimeSec: descriptor.endTimeSec,
        durationSec: descriptor.endTimeSec - descriptor.startTimeSec,
        nominalGridBoundaryTimeSec,
        endedAtNominalGridBoundary: descriptor.endedAtNominalGridBoundary,
        endedAtRunBoundary: descriptor.endedAtRunBoundary,
        endedAtEventBoundary,
        offGridEventSplit: descriptor.offGridEventSplit,
        rawMinimumBoundaryTimeSec: descriptor.rawMinimumBoundaryTimeSec,
        requestedEndIsRawMinimumBoundary:
          descriptor.requestedEndIsRawMinimumBoundary,
        requestedEndBoundarySelectionPolicyPass:
          descriptor.requestedEndBoundarySelectionPolicyPass,
        oneUlpNominalGridBoundaryCoalescenceDirection:
          descriptor.oneUlpNominalGridBoundaryCoalescenceDirection,
        oneUlpNominalGridBoundaryCoalesced:
          descriptor.oneUlpNominalGridBoundaryCoalescenceEligible,
        oneUlpRunEndNominalGridBoundaryCoalescenceDirection:
          descriptor.oneUlpRunEndNominalGridBoundaryCoalescenceDirection,
        oneUlpRunEndNominalGridBoundaryCoalescenceEligible:
          descriptor.oneUlpRunEndNominalGridBoundaryCoalescenceEligible,
        oneUlpRunEndNominalGridBoundaryCoalesced:
          descriptor.oneUlpRunEndNominalGridBoundaryCoalescenceEligible,
        eventKeysAtEnd: canonicalEventKeys(eventsAtEnd),
        entryEndpoint: segmentEntry,
        exitEndpoint: endpoint,
        attempts: finalizedAttempts,
        acceptedTransactions,
        solverRetryUsed: finalizedAttempts.some((attempt) =>
          attempt.retryDepth > 0),
        solverRetrySubdivisionCount: recursive.subdivisionCount,
        maximumRetryDepthUsed,
        pass: segmentPass,
      });
    completedSegments.push(successSegment);
    committedTransactions.push(...acceptedTransactions);
    if (endedAtEventBoundary) {
      eventCursor = eventEndIndex;
      committedEventBoundaryCount += 1;
    }
    if (descriptor.offGridEventSplit) committedOffGridEventSplitCount += 1;
    if (descriptor.oneUlpNominalGridBoundaryCoalescenceEligible) {
      committedOneUlpNominalGridBoundaryCoalescenceCount += 1;
    }
    if (descriptor.oneUlpRunEndNominalGridBoundaryCoalescenceEligible) {
      committedOneUlpRunEndNominalGridBoundaryCoalescenceCount += 1;
    }
    if (
      descriptor.endedAtNominalGridBoundary
      || descriptor.oneUlpNominalGridBoundaryCoalescenceEligible
      || descriptor.oneUlpRunEndNominalGridBoundaryCoalescenceEligible
    ) nominalGridIndex += 1;
    requestedSegmentIndex += 1;
  }

  if (eventCursor !== input.orderedEvents.length) {
    throw new Error("event scheduler reached run end with unconsumed events");
  }
  const expectedNewtonUnknownCount = (
    input.slsMode === "on" ? 51 : 46
  ) as 51 | 46;
  const allOrderedEventsCommittedExactlyOnce = committedEventKeys(
    committedTransactions,
  ).join("\u0000") === canonicalEventKeys(input.orderedEvents).join("\u0000");
  const registryObjectReusedAcrossAllAttempts = globalAttempts.every((attempt) =>
    attempt.registryObjectIdentityAtInvocation);
  const everyAcceptedTransactionHasExpectedNewtonTopology =
    committedTransactions.every((transaction) =>
      transaction.leftLimitStep.unknownCount === expectedNewtonUnknownCount
      && transaction.leftLimitStep.residualCount === expectedNewtonUnknownCount
      && transaction.leftLimitStep.calciumNewtonUnknownCount === 0
      && transaction.leftLimitStep.calciumResidualCount === 0);
  const everyAcceptedTransactionProjectionClippingClampAndFallbackFree =
    committedTransactions.every(noProjectionClippingClampOrFallback);
  const everyAcceptedTransactionContractAuditPass = completedSegments.every(
    (segment) => segment.pass,
  ) && globalAttempts.every((attempt) =>
    attempt.accepted ? attempt.transactionContractAuditPass : true);
  const everyRequestedSegmentBoundarySelectionPolicyPass =
    completedSegments.every((segment) =>
      segment.requestedEndBoundarySelectionPolicyPass);
  const completedSegmentTransactionProjection = completedSegments.flatMap(
    (segment) => segment.acceptedTransactions,
  );
  const committedAttemptTransactionProjection = globalAttempts.flatMap(
    (attempt) => attempt.committedToCompletedPrefix
      && attempt.acceptedTransaction !== null
      ? [attempt.acceptedTransaction]
      : [],
  );
  const uncommittedAcceptedAttemptTransactionCount = globalAttempts.filter(
    (attempt) =>
      attempt.acceptedTransaction !== null
      && !attempt.committedToCompletedPrefix,
  ).length;
  const acceptedTransactionsMatchCompletedSegmentFlatteningByObjectIdentity =
    sameOrderedObjectReferences(
      committedTransactions,
      completedSegmentTransactionProjection,
    );
  const acceptedTransactionsMatchCommittedAttemptProjectionByObjectIdentity =
    sameOrderedObjectReferences(
      committedTransactions,
      committedAttemptTransactionProjection,
    );
  const committedTransactionProvenanceAuditPass =
    acceptedTransactionsMatchCompletedSegmentFlatteningByObjectIdentity
    && acceptedTransactionsMatchCommittedAttemptProjectionByObjectIdentity
    && uncommittedAcceptedAttemptTransactionCount === 0;
  const eventScheduleComponentPass = Object.is(
    endpoint.timeSec,
    input.endTimeSec,
  )
    && allOrderedEventsCommittedExactlyOnce
    && registryObjectReusedAcrossAllAttempts
    && everyAcceptedTransactionHasExpectedNewtonTopology
    && everyAcceptedTransactionProjectionClippingClampAndFallbackFree
    && everyAcceptedTransactionContractAuditPass
    && everyRequestedSegmentBoundarySelectionPolicyPass
    && committedTransactionProvenanceAuditPass;
  const success = Object.freeze({
    ...staticFields,
    completed: true,
    finalEndpoint: endpoint,
    requestedSegments: Object.freeze(completedSegments),
    acceptedTransactions: Object.freeze(committedTransactions),
    attempts: Object.freeze(globalAttempts),
    requestedSegmentCount: completedSegments.length,
    acceptedTransactionCount: committedTransactions.length,
    attemptedTransactionCount: globalAttempts.length,
    eventBoundaryCount: committedEventBoundaryCount,
    offGridEventSplitCount: committedOffGridEventSplitCount,
    oneUlpNominalGridBoundaryCoalescenceCount:
      committedOneUlpNominalGridBoundaryCoalescenceCount,
    oneUlpRunEndNominalGridBoundaryCoalescenceCount:
      committedOneUlpRunEndNominalGridBoundaryCoalescenceCount,
    solverRetrySubdivisionCount: sum(
      completedSegments,
      (segment) => segment.solverRetrySubdivisionCount,
    ),
    solverRetryAttemptCount: globalAttempts.filter((attempt) =>
      attempt.retryDepth > 0).length,
    maximumRetryDepthUsed: maximumAttemptDepth(globalAttempts),
    explicitSolverRetryUsed: globalAttempts.some((attempt) =>
      attempt.retryDepth > 0),
    allOrderedEventsCommittedExactlyOnce,
    registryObjectReusedAcrossAllAttempts,
    expectedNewtonUnknownCount,
    everyAcceptedTransactionHasExpectedNewtonTopology,
    everyAcceptedTransactionProjectionClippingClampAndFallbackFree,
    everyAcceptedTransactionContractAuditPass,
    everyRequestedSegmentBoundarySelectionPolicyPass,
    acceptedTransactionsMatchCompletedSegmentFlatteningByObjectIdentity,
    acceptedTransactionsMatchCommittedAttemptProjectionByObjectIdentity,
    uncommittedAcceptedAttemptTransactionCount,
    committedTransactionProvenanceAuditPass,
    eventScheduleComponentPass,
  });
  PHASE_B1_COMMITTED_EVENT_SCHEDULE_SUCCESS_RESULTS_V1.add(success);
  return success;
}

function executeSegmentRecursive(
  input: ValidatedInput,
  requested: SegmentDescriptor,
  entryEndpoint: PhaseB1EndpointStateV1,
  endTimeSec: number,
  eventsAtEnd: readonly PhaseB1WallCalciumDriveEventV1[],
  retryDepth: RetryDepth,
  binaryPath: string,
  attempts: AttemptDraft[],
  probe: ProbeContext,
): RecursiveSegmentResult {
  const attemptIndexWithinRequestedSegment = attempts.length;
  const attemptIndex = requested.globalAttemptIndexOffset
    + attemptIndexWithinRequestedSegment;
  const attemptKey = `${requested.requestedSegmentIndex}:${binaryPath}`;
  const registryAtInvocation = input.model.newtonScaleRegistry;
  const registryObjectIdentityAtInvocation = Object.is(
    registryAtInvocation,
    input.registryAtRunStart,
  );
  const injected = probe?.configuredFailureKeys.has(attemptKey) ?? false;
  let acceptedTransaction:
    PhaseB1EventIntegratedMonolithicTransactionSuccessV1 | null = null;
  let failedTransaction:
    PhaseB1EventIntegratedMonolithicTransactionFailureV1 | null = null;
  let failureStage: string | null = null;
  let failureReason: string | null = null;
  let rollbackEndpoint: PhaseB1EndpointStateV1 | null = null;
  if (injected && probe?.failureKind === "transaction") {
    probe!.consumedFailureKeys.add(attemptKey);
    failureStage = "test-injected-transaction-failure";
    failureReason = `structured test failure at ${attemptKey}`;
    rollbackEndpoint = entryEndpoint;
  } else {
    try {
      if (injected) probe!.consumedFailureKeys.add(attemptKey);
      const transactionInput = {
        model: input.model,
        wallMaterialBinding: input.wallMaterialBinding,
        previousEndpoint: entryEndpoint,
        endTimeSec,
        coincidentEventsAtEnd: eventsAtEnd,
      } as const;
      const transaction = injected
        ? runPhaseB1EventIntegratedMonolithicTransactionSlsAuditFailureProbeV1(
          transactionInput,
          {
            probeId:
              PHASE_B1_EVENT_INTEGRATED_SLS_BE_FAILURE_PROBE_V1_ID,
          },
        )
        : runPhaseB1EventIntegratedMonolithicTransactionV1(transactionInput);
      if (transaction.ok === true) acceptedTransaction = transaction;
      else {
        failedTransaction = transaction;
        failureStage = transaction.failureStage;
        failureReason = transaction.failureReason;
        rollbackEndpoint = transaction.rollbackEndpoint;
      }
    } catch (error) {
      failureStage = "transaction-threw";
      failureReason = errorMessage(error);
      rollbackEndpoint = entryEndpoint;
    }
  }
  const accepted = acceptedTransaction !== null;
  const rollbackEndpointMatchesAttemptEntryExact = accepted
    ? null
    : rollbackEndpoint !== null
      && endpointStateExact(rollbackEndpoint, entryEndpoint);
  const attemptDraft: AttemptDraft = Object.freeze({
    attemptIndex,
    attemptIndexWithinRequestedSegment,
    requestedSegmentIndex: requested.requestedSegmentIndex,
    attemptKey,
    binaryPath,
    retryDepth,
    refinementFactor:
      PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_REFINEMENT_FACTORS_V1[
        retryDepth
      ],
    startTimeSec: entryEndpoint.timeSec,
    endTimeSec,
    durationSec: endTimeSec - entryEndpoint.timeSec,
    eventKeysAtEnd: canonicalEventKeys(eventsAtEnd),
    endpointEventBatchPresent: eventsAtEnd.length > 0,
    eventBatchAtRequestedSegmentEndExact:
      eventsAtEnd.length === 0 || Object.is(endTimeSec, requested.endTimeSec),
    accepted,
    acceptedTransaction,
    failedTransaction,
    failureStage,
    failureReason,
    rollbackEndpoint,
    rollbackEndpointMatchesAttemptEntryExact,
    registryObjectIdentityAtInvocation,
    transactionContractAuditPass: acceptedTransaction === null
      ? rollbackEndpointMatchesAttemptEntryExact === true
      : auditAcceptedTransaction(
        acceptedTransaction,
        input,
        entryEndpoint,
        endTimeSec,
        eventsAtEnd,
      ),
    testFailureInjected: injected,
  });
  attempts.push(attemptDraft);
  if (acceptedTransaction !== null) {
    return Object.freeze({
      ok: true,
      endpoint: acceptedTransaction.nextEndpoint,
      transactions: Object.freeze([acceptedTransaction]),
      subdivisionCount: 0,
    });
  }
  if (rollbackEndpointMatchesAttemptEntryExact !== true) {
    return Object.freeze({
      ok: false,
      failedAttemptDraft: attemptDraft,
      failureStage: "rollback-contract",
      failureReason: "failed transaction did not replay its attempt entry",
      provisionalAcceptedTransactions: Object.freeze([]),
      subdivisionCount: 0,
    });
  }
  if (retryDepth === 3) {
    return Object.freeze({
      ok: false,
      failedAttemptDraft: attemptDraft,
      failureStage: failureStage ?? "transaction-failed",
      failureReason: failureReason ?? "transaction failed",
      provisionalAcceptedTransactions: Object.freeze([]),
      subdivisionCount: 0,
    });
  }
  const midpoint = entryEndpoint.timeSec
    + 0.5 * (endTimeSec - entryEndpoint.timeSec);
  if (!(midpoint > entryEndpoint.timeSec && midpoint < endTimeSec)) {
    return Object.freeze({
      ok: false,
      failedAttemptDraft: attemptDraft,
      failureStage: "unrepresentable-retry-midpoint",
      failureReason: "failed segment cannot be bisected in binary64",
      provisionalAcceptedTransactions: Object.freeze([]),
      subdivisionCount: 0,
    });
  }
  const nextDepth = (retryDepth + 1) as RetryDepth;
  const left = executeSegmentRecursive(
    input,
    requested,
    entryEndpoint,
    midpoint,
    Object.freeze([]),
    nextDepth,
    binaryPath === "root" ? "L" : `${binaryPath}L`,
    attempts,
    probe,
  );
  if (left.ok === false) {
    return Object.freeze({
      ...left,
      subdivisionCount: 1 + left.subdivisionCount,
    });
  }
  const right = executeSegmentRecursive(
    input,
    requested,
    left.endpoint,
    endTimeSec,
    eventsAtEnd,
    nextDepth,
    binaryPath === "root" ? "R" : `${binaryPath}R`,
    attempts,
    probe,
  );
  if (right.ok === false) {
    return Object.freeze({
      ...right,
      provisionalAcceptedTransactions: Object.freeze([
        ...left.transactions,
        ...right.provisionalAcceptedTransactions,
      ]),
      subdivisionCount:
        1 + left.subdivisionCount + right.subdivisionCount,
    });
  }
  return Object.freeze({
    ok: true,
    endpoint: right.endpoint,
    transactions: Object.freeze([
      ...left.transactions,
      ...right.transactions,
    ]),
    subdivisionCount:
      1 + left.subdivisionCount + right.subdivisionCount,
  });
}

function validateInput(
  input: PhaseB1BackwardEulerEventScheduleRunnerInputV1,
): ValidatedInput {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "endTimeSec",
    "nominalDtSec",
    "orderedEvents",
  ], "Phase B1 backward-Euler event schedule input");
  validateModel(input.model);
  const wallMaterialBinding = assertPhaseB1WallMaterialBindingV1(
    input.wallMaterialBinding,
  );
  const initialEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  const topology = encodePhaseB1EndpointTopologyVectorsV1(initialEndpoint);
  const endTimeSec = requireFinite(input.endTimeSec, "endTimeSec");
  if (!(endTimeSec > initialEndpoint.timeSec)) {
    throw new Error("endTimeSec must be greater than previousEndpoint.timeSec");
  }
  const nominalDtSec = requirePositiveFinite(
    input.nominalDtSec,
    "nominalDtSec",
  );
  if (!(initialEndpoint.timeSec + nominalDtSec > initialEndpoint.timeSec)) {
    throw new Error(
      "nominalDtSec must advance the original grid in binary64",
    );
  }
  assertDensePlainArrayV1(input.orderedEvents, undefined, "orderedEvents");
  const orderedEvents = Object.freeze(input.orderedEvents.map((event, index) =>
    copyEvent(event, initialEndpoint.timeSec, endTimeSec, index)));
  const eventKeys = new Set<string>();
  let previousTime = initialEndpoint.timeSec;
  for (const [index, event] of orderedEvents.entries()) {
    if (event.calciumDriveTimeSec < previousTime) {
      throw new Error(
        `orderedEvents[${index}] must preserve nondecreasing event time`,
      );
    }
    previousTime = event.calciumDriveTimeSec;
    const key = eventKey(event);
    if (eventKeys.has(key)) {
      throw new Error(`orderedEvents contains duplicate wall/event key ${key}`);
    }
    eventKeys.add(key);
  }
  return Object.freeze({
    model: input.model,
    registryAtRunStart: input.model.newtonScaleRegistry,
    wallMaterialBinding,
    initialEndpoint,
    endTimeSec,
    nominalDtSec,
    orderedEvents,
    slsMode: topology.slsMode,
  });
}

function validateModel(model: PhaseB1EventFreeMonolithicModelV1): void {
  assertExactPlainRecordV1(model, [
    "modelId",
    "closedLoopParameters",
    "newtonScaleRegistry",
    "candidatePriorOnly",
    "physiologicalValidation",
    "phaseB1Acceptance",
    "releaseRuntimeReachable",
  ], "Phase B1 event schedule model");
  if (
    model.modelId !== "four-chamber-phase-b1-candidate-prior-test-reference-v1"
    || model.candidatePriorOnly !== true
    || model.physiologicalValidation !== false
    || model.phaseB1Acceptance !== false
    || model.releaseRuntimeReachable !== false
  ) {
    throw new Error("event schedule accepts only the Phase B1 test reference model");
  }
  assertCanonicalFourChamberNewtonScaleRegistryV1(model.newtonScaleRegistry);
}

function copyEvent(
  event: PhaseB1WallCalciumDriveEventV1,
  startTimeSec: number,
  endTimeSec: number,
  index: number,
): PhaseB1WallCalciumDriveEventV1 {
  const field = `orderedEvents[${index}]`;
  assertExactPlainRecordV1(event, [
    "wallId",
    "eventId",
    "calciumDriveTimeSec",
    "strength",
    "timingOwner",
  ], field);
  if (!WALL_IDS.includes(event.wallId as FourChamberWallId)) {
    throw new Error(`${field}.wallId is invalid`);
  }
  if (typeof event.eventId !== "string" || event.eventId.trim().length === 0) {
    throw new Error(`${field}.eventId must be a nonempty string`);
  }
  const calciumDriveTimeSec = requireFinite(
    event.calciumDriveTimeSec,
    `${field}.calciumDriveTimeSec`,
  );
  if (!(calciumDriveTimeSec > startTimeSec && calciumDriveTimeSec <= endTimeSec)) {
    throw new Error(`${field}.calciumDriveTimeSec must lie in (start,end]`);
  }
  const strength = requireNonNegativeFinite(event.strength, `${field}.strength`);
  if (event.timingOwner !== "tissue-manifest-electrical-to-calcium-delay") {
    throw new Error(`${field}.timingOwner is invalid`);
  }
  return Object.freeze({
    wallId: event.wallId as FourChamberWallId,
    eventId: event.eventId,
    calciumDriveTimeSec,
    strength,
    timingOwner: "tissue-manifest-electrical-to-calcium-delay",
  });
}

function validateFailureProbe(
  probe:
    | PhaseB1BackwardEulerEventScheduleFailureProbeV1
    | PhaseB1BackwardEulerEventScheduleSlsAuditFailureProbeV1,
  failureKind: Exclude<ProbeContext, null>["failureKind"],
): Exclude<ProbeContext, null> {
  assertExactPlainRecordV1(probe, [
    "probeId",
    "failAttemptKeys",
  ], "Phase B1 event schedule failure probe");
  const expectedProbeId = failureKind === "transaction"
    ? PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_FAILURE_PROBE_V1_ID
    : PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_SLS_AUDIT_FAILURE_PROBE_V1_ID;
  if (probe.probeId !== expectedProbeId) {
    throw new Error("failure probe ID mismatch");
  }
  assertDensePlainArrayV1(
    probe.failAttemptKeys,
    undefined,
    "failureProbe.failAttemptKeys",
  );
  const keys = probe.failAttemptKeys.map((key, index) => {
    if (
      typeof key !== "string"
      || !/^(0|[1-9][0-9]*):(root|[LR]+)$/.test(key)
    ) throw new Error(`failureProbe.failAttemptKeys[${index}] is invalid`);
    return key;
  });
  if (new Set(keys).size !== keys.length) {
    throw new Error("failureProbe.failAttemptKeys must be unique");
  }
  return Object.freeze({
    failureKind,
    configuredFailureKeys: new Set(keys),
    consumedFailureKeys: new Set<string>(),
  });
}

function buildStaticFields(
  input: ValidatedInput,
  testFailureProbeUsed: boolean,
): RunnerStaticFields {
  return Object.freeze({
    runnerId: PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RUNNER_V1_ID,
    policyId: PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.policyId,
    transactionId: PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
    slsBackwardEulerPreCommitPolicyId:
      PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId,
    slsMode: input.slsMode,
    modelObjectAtRunStart: input.model,
    wallMaterialBindingObjectAtRunStart: input.wallMaterialBinding,
    newtonScaleRegistryObjectAtRunStart: input.registryAtRunStart,
    initialEndpoint: input.initialEndpoint,
    requestedEndTimeSec: input.endTimeSec,
    nominalDtSec: input.nominalDtSec,
    orderedEvents: input.orderedEvents,
    retryDepths: PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_RETRY_DEPTHS_V1,
    retryRefinementFactors:
      PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_REFINEMENT_FACTORS_V1,
    originalNominalGridRetainedAcrossEventSplits: true,
    oneUlpNominalBoundaryCoalescence:
      PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1
        .oneUlpNominalBoundaryCoalescence,
    oneUlpRunEndNominalBoundaryCoalescence:
      PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1
        .oneUlpRunEndNominalBoundaryCoalescence,
    eventTimeSnappingApplied: false,
    runEndTimeSnappingApplied: false,
    epsilonBoundaryToleranceApplied: false,
    intervalEventOwnership:
      PHASE_B1_BACKWARD_EULER_EVENT_SCHEDULE_POLICY_V1.intervalEventOwnership,
    endpointEventsAssignedToFinalRightRetryChildOnly: true,
    hiddenSubdivisionUsed: false,
    adaptiveRescalingApplied: false,
    testFailureProbeUsed,
    fullBeatAcceptancePass: false,
    periodicityAcceptancePass: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
    testOnly: true,
  });
}

function auditAcceptedTransaction(
  transaction: PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
  input: ValidatedInput,
  entryEndpoint: PhaseB1EndpointStateV1,
  endTimeSec: number,
  eventsAtEnd: readonly PhaseB1WallCalciumDriveEventV1[],
): boolean {
  const expectedUnknownCount = input.slsMode === "on" ? 51 : 46;
  let slsAuditSourceBindingPass = false;
  let mechanicalEnergyStageSnapshotSourceBindingPass = false;
  try {
    assertPhaseB1WholeHeartSlsBackwardEulerAuditSourceBindingV1({
      audit: transaction.slsBackwardEulerPreCommitAudit,
      model: input.model,
      wallMaterialBinding: input.wallMaterialBinding,
      previousEndpoint: entryEndpoint,
      nextEndpointLeftLimit: transaction.leftLimitStep.nextEndpointLeftLimit,
      dtSec: endTimeSec - entryEndpoint.timeSec,
    });
    slsAuditSourceBindingPass = true;
    assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1({
      snapshot: transaction.mechanicalEnergyStageSnapshot,
      model: input.model,
      wallMaterialBinding: input.wallMaterialBinding,
      acceptedStep: transaction.leftLimitStep,
      dtSec: endTimeSec - entryEndpoint.timeSec,
    });
    mechanicalEnergyStageSnapshotSourceBindingPass = true;
  } catch {
    slsAuditSourceBindingPass = false;
    mechanicalEnergyStageSnapshotSourceBindingPass = false;
  }
  return transaction.ok
    && endpointStateExact(transaction.previousEndpoint, entryEndpoint)
    && Object.is(transaction.nextEndpoint.timeSec, endTimeSec)
    && Object.is(
      transaction.actualCommittedDurationSec,
      endTimeSec - entryEndpoint.timeSec,
    )
    && transaction.slsBackwardEulerPreCommitPolicyId
      === PHASE_B1_EVENT_INTEGRATED_SLS_BE_PRECOMMIT_POLICY_V1.policyId
    && transaction.slsBackwardEulerPreCommitGatePass
    && transaction.slsBackwardEulerPreCommitAudit.normalizedIdentityAccepted
    && transaction.slsBackwardEulerAuditCompletedBeforeEventCommit
    && !transaction.testSlsBackwardEulerAuditFailureInjected
    && slsAuditSourceBindingPass
    && mechanicalEnergyStageSnapshotSourceBindingPass
    && transaction.leftLimitStep.unknownCount === expectedUnknownCount
    && transaction.leftLimitStep.residualCount === expectedUnknownCount
    && transaction.leftLimitStep.calciumNewtonUnknownCount === 0
    && transaction.leftLimitStep.calciumResidualCount === 0
    && transaction.coordinator.atomicStepCallCount === 1
    && transaction.coordinator.eventKeys.join("\u0000")
      === canonicalEventKeys(eventsAtEnd).join("\u0000")
    && transaction.coordinator.eventCount === eventsAtEnd.length
    && transaction.coordinator.eventBatchCommitted === (eventsAtEnd.length > 0)
    && transaction.algebraicReinitializationCallCount
      === (eventsAtEnd.length > 0 ? 1 : 0)
    && Object.is(input.model.newtonScaleRegistry, input.registryAtRunStart)
    && noProjectionClippingClampOrFallback(transaction);
}

function noProjectionClippingClampOrFallback(
  transaction: PhaseB1EventIntegratedMonolithicTransactionSuccessV1,
): boolean {
  const step = transaction.leftLimitStep;
  const residual = step.residualEvaluation;
  const closedLoop = step.nextEvaluation.closedLoop;
  const reinitialization = transaction.postEventTriSegReinitialization;
  return !transaction.projectionApplied
    && !transaction.hiddenStateClippingApplied
    && !step.projectionApplied
    && !step.hiddenStateClippingApplied
    && !step.postStepBloodVolumeProjectionApplied
    && !step.flowClampApplied
    && !residual.projectionApplied
    && !residual.hiddenStateClippingApplied
    && !residual.volumeResidual.bloodVolumeProjectionApplied
    && !residual.volumeResidual.flowClampApplied
    && !residual.volumeResidual.fallbackApplied
    && !step.nextEvaluation.projectionApplied
    && !step.nextEvaluation.hiddenStateClippingApplied
    && !closedLoop.projectionApplied
    && !closedLoop.flowClampApplied
    && !closedLoop.fallbackApplied
    && (reinitialization === null
      || (
        !reinitialization.projectionApplied
        && !reinitialization.fallbackApplied
      ));
}

function finalizeAttempts(
  drafts: readonly AttemptDraft[],
  requestedSegmentCompleted: boolean,
): readonly PhaseB1BackwardEulerEventScheduleAttemptAuditV1[] {
  return Object.freeze(drafts.map((draft) => Object.freeze({
    ...draft,
    committedToCompletedPrefix: requestedSegmentCompleted && draft.accepted,
  })));
}

function isImmediateBinary64Successor(lower: number, upper: number): boolean {
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || !(upper > lower)) {
    return false;
  }
  if (lower === 0) return Object.is(upper, Number.MIN_VALUE);
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setFloat64(0, lower, false);
  const bits = view.getBigUint64(0, false);
  view.setBigUint64(0, lower > 0 ? bits + 1n : bits - 1n, false);
  return Object.is(view.getFloat64(0, false), upper);
}

function eventGroupEndIndex(
  events: readonly PhaseB1WallCalciumDriveEventV1[],
  startIndex: number,
  timeSec: number,
): number {
  if (events[startIndex]?.calciumDriveTimeSec !== timeSec) return startIndex;
  let cursor = startIndex;
  while (events[cursor]?.calciumDriveTimeSec === timeSec) cursor += 1;
  return cursor;
}

function canonicalEventKeys(
  events: readonly PhaseB1WallCalciumDriveEventV1[],
): readonly string[] {
  const wallOrder = new Map(WALL_IDS.map((wallId, index) => [wallId, index]));
  return Object.freeze([...events].sort((left, right) => {
    if (left.calciumDriveTimeSec !== right.calciumDriveTimeSec) {
      return left.calciumDriveTimeSec - right.calciumDriveTimeSec;
    }
    const wallDifference = wallOrder.get(left.wallId)!
      - wallOrder.get(right.wallId)!;
    if (wallDifference !== 0) return wallDifference;
    return left.eventId < right.eventId ? -1 : left.eventId > right.eventId ? 1 : 0;
  }).map(eventKey));
}

function committedEventKeys(
  transactions:
    readonly PhaseB1EventIntegratedMonolithicTransactionSuccessV1[],
): readonly string[] {
  return Object.freeze(transactions.flatMap((transaction) =>
    transaction.coordinator.eventKeys));
}

function eventKey(event: PhaseB1WallCalciumDriveEventV1): string {
  return `${event.wallId}:${event.eventId}`;
}

function copyEndpoint(
  endpoint: PhaseB1EndpointStateV1,
): PhaseB1EndpointStateV1 {
  return createPhaseB1EndpointStateV1({
    timeSec: endpoint.timeSec,
    differentialState: endpoint.differentialState,
    triSegCoordinates: endpoint.triSegCoordinates,
  });
}

function endpointStateExact(
  left: PhaseB1EndpointStateV1,
  right: PhaseB1EndpointStateV1,
): boolean {
  if (!Object.is(left.timeSec, right.timeSec)) return false;
  const leftTopology = encodePhaseB1EndpointTopologyVectorsV1(left);
  const rightTopology = encodePhaseB1EndpointTopologyVectorsV1(right);
  return leftTopology.slsMode === rightTopology.slsMode
    && exactNumberArray(
      leftTopology.nonCalciumDifferentialState,
      rightTopology.nonCalciumDifferentialState,
    )
    && exactNumberArray(
      leftTopology.algebraicState,
      rightTopology.algebraicState,
    )
    && WALL_IDS.every((wallId) =>
      Object.is(
        leftTopology.calciumByWall[wallId].r,
        rightTopology.calciumByWall[wallId].r,
      )
      && Object.is(
        leftTopology.calciumByWall[wallId].d,
        rightTopology.calciumByWall[wallId].d,
      ));
}

function exactNumberArray(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}

function maximumAttemptDepth(
  attempts: readonly Pick<
    PhaseB1BackwardEulerEventScheduleAttemptAuditV1,
    "retryDepth"
  >[],
): RetryDepth {
  if (attempts.length === 0) return 0;
  return Math.max(...attempts.map((attempt) => attempt.retryDepth)) as RetryDepth;
}

function sameOrderedObjectReferences(
  left: readonly object[],
  right: readonly object[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}

function sum<Value>(
  values: readonly Value[],
  select: (value: Value) => number,
): number {
  return values.reduce((total, value) => total + select(value), 0);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const number = requireFinite(value, field);
  if (!(number > 0)) throw new Error(`${field} must be positive`);
  return number;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const number = requireFinite(value, field);
  if (number < 0) throw new Error(`${field} must be nonnegative`);
  return number;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
