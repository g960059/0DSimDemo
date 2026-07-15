import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1BackwardEulerCommittedIntervalLedgerV1,
  type PhaseB1BackwardEulerCommittedIntervalLedgerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerCommittedIntervalLedgerV1";
import {
  assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1,
  type PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  buildPhaseB1CompleteEndpointProjectionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1CompleteEndpointMetricV1";
import {
  validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
  type PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1,
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
  validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  type PhaseB1ProjectSyntheticNormalSinusScheduledEventV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_EXPECTATION_V1_ID =
  "phase-b1-normal-sinus-committed-supercycle-expectation-v1" as const;

export const PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_AUDIT_V1_ID =
  "phase-b1-normal-sinus-committed-supercycle-audit-v1" as const;

const EXPECTED_EVENT_COUNT = 5 as const;

const CLAIM_BOUNDARY = deepFreeze({
  exactCommittedScheduleSupercycleRequiredForAudit: true,
  periodicConvergenceClaimed: false,
  fullBeatAcceptanceClaimed: false,
  multiStartAcceptanceClaimed: false,
  timestepConvergenceClaimed: false,
  cycleEnergyAcceptanceClaimed: false,
  physiologicalValidationClaimed: false,
  phaseB1AcceptanceClaimed: false,
  modelCoreOrBrowserRuntimeAdopted: false,
  releaseRuntimeReachable: false,
} as const);

const BUILDER_ISSUED_EXPECTATIONS = new WeakSet<object>();
const BUILDER_ISSUED_AUDITS = new WeakSet<object>();

export type PhaseB1NormalSinusCommittedSupercycleEventExpectationV1 =
  Readonly<{
    eventKey: string;
    cycleIndex: number;
    wallId: string;
    eventId: string;
    calciumDriveTimeSec: number;
    strength: number;
    timingOwner: string;
  }>;

export type PhaseB1NormalSinusCommittedSupercycleExpectationPayloadV1 =
  Readonly<{
    expectationId:
      typeof PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_EXPECTATION_V1_ID;
    definitionContentSha256: string;
    scheduleContentSha256: string;
    cycleIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    durationSec: number;
    nominalDtSec: number;
    eventIntervalOwnership: "(start,end]";
    expectedEventCount: typeof EXPECTED_EVENT_COUNT;
    expectedEvents: readonly PhaseB1NormalSinusCommittedSupercycleEventExpectationV1[];
    exactTimesComputedFromIntegerCycleIndex: true;
    durationComputedAsEndTimeMinusStartTime: true;
    cycleZeroSpecialCaseAllowed: false;
    claimBoundary: typeof CLAIM_BOUNDARY;
  }>;

export type PhaseB1NormalSinusCommittedSupercycleExpectationV1 =
  PhaseB1NormalSinusCommittedSupercycleExpectationPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

export type BuildPhaseB1NormalSinusCommittedSupercycleExpectationInputV1 =
  Readonly<{
    definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    cycleIndex: number;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export type PhaseB1NormalSinusCommittedSupercycleAuditPayloadV1 = Readonly<{
  auditId: typeof PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_AUDIT_V1_ID;
  expectationContentSha256: string;
  definitionContentSha256: string;
  scheduleContentSha256: string;
  cycleIndex: number;
  slsMode: "on" | "off";
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  nominalDtSec: number;
  initialEndpointContentSha256: string;
  finalEndpointContentSha256: string;
  runnerAttemptTraceContentSha256: string;
  committedIntervalLedgerSummaryContentSha256: string;
  runnerSuccessAuthenticatedInProcess: true;
  runnerModelObjectMatchesDefinitionRegistry: true;
  runnerWallBindingMatchesSchedule: true;
  runnerRegistryObjectRetained: true;
  exactCycleTimesVerified: true;
  exactCycleIndexedFiveEventSequenceVerified: true;
  allFiveEventsCommittedExactlyOnce: true;
  committedLedgerProvenanceVerified: true;
  noFailureProbeConsumed: true;
  projectionClippingClampAndFallbackFree: boolean;
  structuralAndNumericalIntervalLedgerGatesPass: boolean;
  maximumRelativeTotalBloodVolumeDrift: number;
  committedSupercycleAuditPass: boolean;
  claimBoundary: typeof CLAIM_BOUNDARY;
}>;

export type PhaseB1NormalSinusCommittedSupercycleAuditV1 =
  PhaseB1NormalSinusCommittedSupercycleAuditPayloadV1 & Readonly<{
    contentSha256: string;
    expectation: PhaseB1NormalSinusCommittedSupercycleExpectationV1;
    sourceScheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
    committedIntervalLedger: PhaseB1BackwardEulerCommittedIntervalLedgerV1;
  }>;

export type BuildPhaseB1NormalSinusCommittedSupercycleAuditInputV1 =
  Readonly<{
    definition: PhaseB1NormalSinusBePeriodicConvergenceDefinitionV1;
    schedule: PhaseB1ProjectSyntheticNormalSinusEventScheduleV1;
    cycleIndex: number;
    scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export function buildPhaseB1NormalSinusCommittedSupercycleExpectationV1(
  input: BuildPhaseB1NormalSinusCommittedSupercycleExpectationInputV1,
): PhaseB1NormalSinusCommittedSupercycleExpectationV1 {
  assertExactPlainRecordV1(input, [
    "definition",
    "schedule",
    "cycleIndex",
    "sha256Hex",
  ], "Phase B1 committed-supercycle expectation input");
  requireSha256Provider(input.sha256Hex);
  const definition =
    validatePhaseB1NormalSinusBePeriodicConvergenceDefinitionV1(
      input.definition,
      input.sha256Hex,
    );
  const schedule = validatePhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    input.schedule,
    input.sha256Hex,
  );
  const cycleIndex = requireNonNegativeSafeInteger(
    input.cycleIndex,
    "cycleIndex",
  );
  if (cycleIndex >= definition.maximumSupercycles) {
    throw new Error("committed-supercycle cycleIndex exceeds the fixed cap");
  }
  if (
    definition.scheduleContentSha256 !== schedule.contentSha256
    || definition.sourceWallMaterialBindingContentSha256
      !== schedule.sourceBindings.phaseB1WallMaterialBindingSha256
  ) {
    throw new Error("committed-supercycle definition and schedule differ");
  }
  const startTimeSec = cycleIndex * definition.cycleLengthSec;
  const endTimeSec = (cycleIndex + 1) * definition.cycleLengthSec;
  // The committed ledger owns duration as finalEndpoint.timeSec minus
  // initialEndpoint.timeSec. Preserve that exact IEEE-754 operation here too:
  // for later integer-indexed cycles it need not equal the literal period bit
  // pattern even though both endpoints remain exactly i*T and (i+1)*T.
  const durationSec = endTimeSec - startTimeSec;
  if (!(durationSec > 0)) {
    throw new Error("committed-supercycle endpoint-derived duration must be positive");
  }
  const scheduledEvents =
    generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
      schedule,
      startTimeSec,
      endTimeSec,
      input.sha256Hex,
    );
  assertCanonicalCycleEvents(scheduledEvents, cycleIndex);
  const payload = deepFreeze<
    PhaseB1NormalSinusCommittedSupercycleExpectationPayloadV1
  >({
    expectationId:
      PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_EXPECTATION_V1_ID,
    definitionContentSha256: definition.contentSha256,
    scheduleContentSha256: schedule.contentSha256,
    cycleIndex,
    startTimeSec,
    endTimeSec,
    durationSec,
    nominalDtSec: definition.nominalDtSec,
    eventIntervalOwnership: "(start,end]",
    expectedEventCount: EXPECTED_EVENT_COUNT,
    expectedEvents: Object.freeze(scheduledEvents.map(eventSummary)),
    exactTimesComputedFromIntegerCycleIndex: true,
    durationComputedAsEndTimeMinusStartTime: true,
    cycleZeroSpecialCaseAllowed: false,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const expectation = deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
  BUILDER_ISSUED_EXPECTATIONS.add(expectation);
  return expectation;
}

export function assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleExpectationV1(
  value: PhaseB1NormalSinusCommittedSupercycleExpectationV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusCommittedSupercycleExpectationV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_EXPECTATIONS.has(value)
    || value.expectationId
      !== PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_EXPECTATION_V1_ID
  ) {
    throw new Error("committed-supercycle expectation is not builder-issued");
  }
  const { contentSha256, ...payload } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("committed-supercycle expectation content hash drifted");
  }
  return value;
}

export function buildPhaseB1NormalSinusCommittedSupercycleAuditV1(
  input: BuildPhaseB1NormalSinusCommittedSupercycleAuditInputV1,
): PhaseB1NormalSinusCommittedSupercycleAuditV1 {
  assertExactPlainRecordV1(input, [
    "definition",
    "schedule",
    "cycleIndex",
    "scheduleRun",
    "sha256Hex",
  ], "Phase B1 committed-supercycle audit input");
  requireSha256Provider(input.sha256Hex);
  const expectation =
    buildPhaseB1NormalSinusCommittedSupercycleExpectationV1({
      definition: input.definition,
      schedule: input.schedule,
      cycleIndex: input.cycleIndex,
      sha256Hex: input.sha256Hex,
    });
  const definition = input.definition;
  const schedule = input.schedule;
  const scheduleRun =
    assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1(
      input.scheduleRun,
    );
  if (
    scheduleRun.slsMode !== definition.slsMode
    || !Object.is(scheduleRun.nominalDtSec, definition.nominalDtSec)
    || !Object.is(scheduleRun.initialEndpoint.timeSec, expectation.startTimeSec)
    || !Object.is(scheduleRun.requestedEndTimeSec, expectation.endTimeSec)
    || !Object.is(scheduleRun.finalEndpoint.timeSec, expectation.endTimeSec)
  ) {
    throw new Error("committed-supercycle runner cycle time or mode differs");
  }
  if (
    scheduleRun.newtonScaleRegistryObjectAtRunStart.registryContentSha256
      !== definition.newtonScaleRegistryContentSha256
    || scheduleRun.wallMaterialBindingObjectAtRunStart.contentSha256
      !== schedule.sourceBindings.phaseB1WallMaterialBindingSha256
  ) {
    throw new Error("committed-supercycle runner provenance binding differs");
  }
  assertRunnerEventsMatchExpectation(scheduleRun, expectation);
  const committedIntervalLedger =
    buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({ scheduleRun });
  if (
    !Object.is(
      scheduleRun.newtonScaleRegistryObjectAtRunStart,
      scheduleRun.modelObjectAtRunStart.newtonScaleRegistry,
    )
    || committedIntervalLedger.startTimeSec !== expectation.startTimeSec
    || committedIntervalLedger.endTimeSec !== expectation.endTimeSec
    || committedIntervalLedger.durationSec !== expectation.durationSec
    || committedIntervalLedger.slsMode !== definition.slsMode
    || committedIntervalLedger.newtonScaleRegistryContentSha256
      !== definition.newtonScaleRegistryContentSha256
  ) {
    throw new Error("committed-supercycle ledger binding differs");
  }
  const initialProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: scheduleRun.initialEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const finalProjection = buildPhaseB1CompleteEndpointProjectionV1({
    endpoint: scheduleRun.finalEndpoint,
    sha256Hex: input.sha256Hex,
  });
  const runnerAttemptTraceContentSha256 = computeCanonicalSha256(
    runnerAttemptTracePayload(scheduleRun),
    input.sha256Hex,
  );
  const committedIntervalLedgerSummaryContentSha256 = computeCanonicalSha256(
    ledgerSummaryPayload(committedIntervalLedger),
    input.sha256Hex,
  );
  const committedLedgerProvenanceVerified =
    committedIntervalLedger.sourceRunnerSuccessAuthenticatedInProcess
    && committedIntervalLedger.runnerCommittedTransactionProvenanceVerified
    && committedIntervalLedger.uncommittedOrFailedAttemptTransactionCountConsumed
      === 0
    && committedIntervalLedger.sourceModelObjectIdentityRetained
    && committedIntervalLedger.sourceWallMaterialBindingObjectIdentityRetained
    && committedIntervalLedger.sourceRegistryObjectIdentityRetained
    && committedIntervalLedger.nonProbeEvidenceEligibilityPass;
  const allFiveEventsCommittedExactlyOnce =
    scheduleRun.allOrderedEventsCommittedExactlyOnce
    && scheduleRun.eventBoundaryCount === EXPECTED_EVENT_COUNT
    && scheduleRun.orderedEvents.length === EXPECTED_EVENT_COUNT;
  const exactCycleIndexedFiveEventSequenceVerified =
    runnerEventsMatchExpectation(scheduleRun, expectation);
  const exactCycleTimesVerified =
    Object.is(scheduleRun.initialEndpoint.timeSec, expectation.startTimeSec)
    && Object.is(scheduleRun.requestedEndTimeSec, expectation.endTimeSec)
    && Object.is(scheduleRun.finalEndpoint.timeSec, expectation.endTimeSec)
    && Object.is(committedIntervalLedger.durationSec, expectation.durationSec);
  const noFailureProbeConsumed = scheduleRun.testFailureProbeUsed === false
    && committedIntervalLedger.sourceTestFailureProbeUsed === false;
  const projectionClippingClampAndFallbackFree =
    scheduleRun.everyAcceptedTransactionProjectionClippingClampAndFallbackFree
    && committedIntervalLedger.everyStepProjectionClippingClampAndFallbackFree;
  const committedSupercycleAuditPass =
    scheduleRun.eventScheduleComponentPass
    && committedLedgerProvenanceVerified
    && exactCycleTimesVerified
    && exactCycleIndexedFiveEventSequenceVerified
    && allFiveEventsCommittedExactlyOnce
    && noFailureProbeConsumed
    && projectionClippingClampAndFallbackFree;
  if (!committedSupercycleAuditPass) {
    throw new Error("committed-supercycle exact/provenance audit failed");
  }
  const payload = deepFreeze<PhaseB1NormalSinusCommittedSupercycleAuditPayloadV1>({
    auditId: PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_AUDIT_V1_ID,
    expectationContentSha256: expectation.contentSha256,
    definitionContentSha256: definition.contentSha256,
    scheduleContentSha256: schedule.contentSha256,
    cycleIndex: expectation.cycleIndex,
    slsMode: definition.slsMode,
    startTimeSec: expectation.startTimeSec,
    endTimeSec: expectation.endTimeSec,
    durationSec: expectation.durationSec,
    nominalDtSec: expectation.nominalDtSec,
    initialEndpointContentSha256: initialProjection.contentSha256,
    finalEndpointContentSha256: finalProjection.contentSha256,
    runnerAttemptTraceContentSha256,
    committedIntervalLedgerSummaryContentSha256,
    runnerSuccessAuthenticatedInProcess: true,
    runnerModelObjectMatchesDefinitionRegistry: true,
    runnerWallBindingMatchesSchedule: true,
    runnerRegistryObjectRetained: true,
    exactCycleTimesVerified: true,
    exactCycleIndexedFiveEventSequenceVerified: true,
    allFiveEventsCommittedExactlyOnce: true,
    committedLedgerProvenanceVerified: true,
    noFailureProbeConsumed: true,
    projectionClippingClampAndFallbackFree,
    structuralAndNumericalIntervalLedgerGatesPass:
      committedIntervalLedger.structuralAndNumericalIntervalLedgerGatesPass,
    maximumRelativeTotalBloodVolumeDrift:
      committedIntervalLedger.maximumRelativeTotalBloodVolumeDrift,
    committedSupercycleAuditPass,
    claimBoundary: CLAIM_BOUNDARY,
  });
  const audit = deepFreeze<PhaseB1NormalSinusCommittedSupercycleAuditV1>({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
    expectation,
    sourceScheduleRun: scheduleRun,
    committedIntervalLedger,
  });
  BUILDER_ISSUED_AUDITS.add(audit);
  return audit;
}

export function assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1(
  value: PhaseB1NormalSinusCommittedSupercycleAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusCommittedSupercycleAuditV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || !BUILDER_ISSUED_AUDITS.has(value)
    || value.auditId !== PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_AUDIT_V1_ID
  ) {
    throw new Error("committed-supercycle audit is not builder-issued");
  }
  assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleExpectationV1(
    value.expectation,
    sha256Hex,
  );
  assertCommittedPhaseB1BackwardEulerEventScheduleSuccessV1(
    value.sourceScheduleRun,
  );
  const {
    contentSha256,
    expectation: _expectation,
    sourceScheduleRun: _sourceScheduleRun,
    committedIntervalLedger: _committedIntervalLedger,
    ...payload
  } = value;
  if (computeCanonicalSha256(payload, sha256Hex) !== contentSha256) {
    throw new Error("committed-supercycle audit content hash drifted");
  }
  return value;
}

function assertCanonicalCycleEvents(
  events: readonly PhaseB1ProjectSyntheticNormalSinusScheduledEventV1[],
  cycleIndex: number,
): void {
  if (events.length !== EXPECTED_EVENT_COUNT) {
    throw new Error("normal-sinus supercycle must contain exactly five events");
  }
  events.forEach((event, index) => {
    if (
      event.cycleIndex !== cycleIndex
      || event.wallId
        !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1[index]
      || !event.calciumDriveEvent.eventId.includes(`:cycle-${cycleIndex}:`)
    ) {
      throw new Error("normal-sinus supercycle reused another cycle's events");
    }
  });
}

function eventSummary(
  event: PhaseB1ProjectSyntheticNormalSinusScheduledEventV1,
): PhaseB1NormalSinusCommittedSupercycleEventExpectationV1 {
  return deepFreeze({
    eventKey: event.eventKey,
    cycleIndex: event.cycleIndex,
    wallId: event.wallId,
    eventId: event.calciumDriveEvent.eventId,
    calciumDriveTimeSec: event.calciumDriveEvent.calciumDriveTimeSec,
    strength: event.calciumDriveEvent.strength,
    timingOwner: event.calciumDriveEvent.timingOwner,
  });
}

function assertRunnerEventsMatchExpectation(
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
  expectation: PhaseB1NormalSinusCommittedSupercycleExpectationV1,
): void {
  if (!runnerEventsMatchExpectation(scheduleRun, expectation)) {
    throw new Error("committed-supercycle runner events differ from cycle expectation");
  }
}

function runnerEventsMatchExpectation(
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
  expectation: PhaseB1NormalSinusCommittedSupercycleExpectationV1,
): boolean {
  return scheduleRun.orderedEvents.length === expectation.expectedEvents.length
    && scheduleRun.orderedEvents.every((event, index) => {
      const expected = expectation.expectedEvents[index];
      return `${event.wallId}:${event.eventId}` === expected.eventKey
        && event.wallId === expected.wallId
        && event.eventId === expected.eventId
        && Object.is(event.calciumDriveTimeSec, expected.calciumDriveTimeSec)
        && Object.is(event.strength, expected.strength)
        && event.timingOwner === expected.timingOwner;
    });
}

function runnerAttemptTracePayload(
  scheduleRun: PhaseB1BackwardEulerEventScheduleRunnerSuccessV1,
): unknown {
  return deepFreeze({
    traceId: "phase-b1-normal-sinus-committed-supercycle-runner-attempt-trace-v1",
    requestedEndTimeSec: scheduleRun.requestedEndTimeSec,
    nominalDtSec: scheduleRun.nominalDtSec,
    oneUlpNominalBoundaryCoalescence:
      scheduleRun.oneUlpNominalBoundaryCoalescence,
    oneUlpRunEndNominalBoundaryCoalescence:
      scheduleRun.oneUlpRunEndNominalBoundaryCoalescence,
    eventTimeSnappingApplied: scheduleRun.eventTimeSnappingApplied,
    runEndTimeSnappingApplied: scheduleRun.runEndTimeSnappingApplied,
    epsilonBoundaryToleranceApplied:
      scheduleRun.epsilonBoundaryToleranceApplied,
    orderedEventKeys: scheduleRun.orderedEvents.map((event) =>
      `${event.wallId}:${event.eventId}`),
    requestedSegments: scheduleRun.requestedSegments.map((segment) =>
      deepFreeze({
        requestedSegmentIndex: segment.requestedSegmentIndex,
        nominalGridIndex: segment.nominalGridIndex,
        startTimeSec: segment.startTimeSec,
        endTimeSec: segment.endTimeSec,
        nominalGridBoundaryTimeSec: segment.nominalGridBoundaryTimeSec,
        rawMinimumBoundaryTimeSec: segment.rawMinimumBoundaryTimeSec,
        requestedEndIsRawMinimumBoundary:
          segment.requestedEndIsRawMinimumBoundary,
        requestedEndBoundarySelectionPolicyPass:
          segment.requestedEndBoundarySelectionPolicyPass,
        oneUlpNominalGridBoundaryCoalescenceDirection:
          segment.oneUlpNominalGridBoundaryCoalescenceDirection,
        oneUlpNominalGridBoundaryCoalesced:
          segment.oneUlpNominalGridBoundaryCoalesced,
        oneUlpRunEndNominalGridBoundaryCoalescenceDirection:
          segment.oneUlpRunEndNominalGridBoundaryCoalescenceDirection,
        oneUlpRunEndNominalGridBoundaryCoalescenceEligible:
          segment.oneUlpRunEndNominalGridBoundaryCoalescenceEligible,
        oneUlpRunEndNominalGridBoundaryCoalesced:
          segment.oneUlpRunEndNominalGridBoundaryCoalesced,
        endedAtRunBoundary: segment.endedAtRunBoundary,
        endedAtEventBoundary: segment.endedAtEventBoundary,
        eventKeysAtEnd: segment.eventKeysAtEnd,
      })),
    attempts: scheduleRun.attempts.map((attempt) => deepFreeze({
      attemptIndex: attempt.attemptIndex,
      requestedSegmentIndex: attempt.requestedSegmentIndex,
      attemptKey: attempt.attemptKey,
      binaryPath: attempt.binaryPath,
      retryDepth: attempt.retryDepth,
      startTimeSec: attempt.startTimeSec,
      endTimeSec: attempt.endTimeSec,
      eventKeysAtEnd: attempt.eventKeysAtEnd,
      accepted: attempt.accepted,
      failureStage: attempt.failureStage,
      failureReason: attempt.failureReason,
      committedToCompletedPrefix: attempt.committedToCompletedPrefix,
      transactionContractAuditPass: attempt.transactionContractAuditPass,
      testFailureInjected: attempt.testFailureInjected,
    })),
  });
}

function ledgerSummaryPayload(
  ledger: PhaseB1BackwardEulerCommittedIntervalLedgerV1,
): unknown {
  return deepFreeze({
    summaryId: "phase-b1-normal-sinus-committed-supercycle-ledger-summary-v1",
    ledgerId: ledger.ledgerId,
    slsMode: ledger.slsMode,
    startTimeSec: ledger.startTimeSec,
    endTimeSec: ledger.endTimeSec,
    durationSec: ledger.durationSec,
    committedTransactionCount: ledger.committedTransactionCount,
    sourceOneUlpRunEndNominalBoundaryCoalescencePolicy:
      ledger.sourceOneUlpRunEndNominalBoundaryCoalescencePolicy,
    sourceRunEndTimeSnappingApplied:
      ledger.sourceRunEndTimeSnappingApplied,
    runEndNominalGridBoundaryCoalescenceCount:
      ledger.runEndNominalGridBoundaryCoalescenceCount,
    runEndNominalGridBoundaryCoalescenceTrace:
      ledger.runEndNominalGridBoundaryCoalescenceTrace,
    integratedEdgeVolumeByFlow: Object.fromEntries(
      FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => {
        const value = ledger.integratedEdgeVolumeByFlow[flowId];
        return [flowId, deepFreeze({
          signedVolumeM3: value.signedVolumeM3,
          forwardVolumeM3: value.forwardVolumeM3,
          regurgitantVolumeM3: value.regurgitantVolumeM3,
          signedDecompositionResidualM3: value.signedDecompositionResidualM3,
        })];
      }),
    ),
    maximumRelativeTotalBloodVolumeDrift:
      ledger.maximumRelativeTotalBloodVolumeDrift,
    maximumAbsoluteCompartmentClosureResidualM3:
      ledger.maximumAbsoluteCompartmentClosureResidualM3,
    maximumScaledResidualInfinityNorm:
      ledger.maximumScaledResidualInfinityNorm,
    maximumScaledUpdateInfinityNorm:
      ledger.maximumScaledUpdateInfinityNorm,
    minimumLandSimplexMargin: ledger.minimumLandSimplexMargin,
    maximumSlsNormalizedIdentityResidual:
      ledger.maximumSlsNormalizedIdentityResidual,
    maximumSlsAbsoluteAlphaMismatch: ledger.maximumSlsAbsoluteAlphaMismatch,
    maximumSlsAbsoluteExpandedIdentityResidualJDiagnostic:
      ledger.maximumSlsAbsoluteExpandedIdentityResidualJDiagnostic,
    everyStepProjectionClippingClampAndFallbackFree:
      ledger.everyStepProjectionClippingClampAndFallbackFree,
    structuralAndNumericalIntervalLedgerGatesPass:
      ledger.structuralAndNumericalIntervalLedgerGatesPass,
  });
}

function requireSha256Provider(
  value: unknown,
): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") {
    throw new Error("committed-supercycle audit requires a SHA-256 provider");
  }
}

function requireNonNegativeSafeInteger(value: unknown, field: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value < 0
  ) {
    throw new Error(`${field} must be a non-negative safe integer`);
  }
  return value;
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
