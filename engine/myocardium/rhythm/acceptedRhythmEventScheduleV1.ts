import type {
  ExactEventCalciumEventV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import { canonicalJsonStringify } from
  "@/engine/scientific/release/canonicalJson";
import { sha256CanonicalJsonHex } from
  "@/engine/scientific/release/sha256";

export const ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID =
  "accepted-rhythm-event-schedule-v1" as const;

export const ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID =
  "accepted-rhythm-schedule-cursor-state-v1" as const;

export const ACCEPTED_RHYTHM_SCHEDULE_CHECKPOINT_V1_ID =
  "accepted-rhythm-schedule-checkpoint-v1" as const;

export const ACCEPTED_RHYTHM_SCHEDULE_CANONICAL_IDENTITY_V1_ID =
  "accepted-rhythm-schedule-canonical-identity-v1" as const;

export const RHYTHM_BEAT_MORPHOLOGIES_V1 = Object.freeze([
  "sinus",
  "pac",
  "pvc",
  "atrial-fibrillatory",
  "atrial-flutter",
  "ventricular-escape",
  "paced",
  "other",
] as const);

export type RhythmBeatMorphologyV1 =
  (typeof RHYTHM_BEAT_MORPHOLOGIES_V1)[number];

export const ACCEPTED_RHYTHM_EVENT_SCHEDULE_CLAIM_V1 = Object.freeze({
  transactionNeutral: true as const,
  timingOwner: "absolute-accepted-time-event-sequence" as const,
  intervalConvention: "open-start-closed-end" as const,
  simultaneousEventBatching: true as const,
  strictCanonicalOrderKey:
    "activation-time-priority-source-id-source-sequence" as const,
  mutableSchedulerObject: false as const,
  trialEvaluationPure: true as const,
  failedTrialConsumesCursor: false as const,
  checkpointState: "accepted-time-revision-and-event-cursor" as const,
  scheduleFingerprintSecurity:
    "fnv32-fast-guard-not-checkpoint-or-release-identity" as const,
  cryptographicScheduleIdentity:
    "sha256-over-complete-canonical-schedule-identity" as const,
  minimalCursorCheckpointRequiresOuterScheduleSha256: true as const,
  eventGenerationPhysiologyClaimed: false as const,
  calciumEventAdapter:
    "exact-event-prescribed-calcium-v1-time-and-strength" as const,
});

export type RhythmActivationEventInputV1 = Readonly<{
  eventId: string;
  /** Stable generator identity; compared by locale-independent code-unit order. */
  sourceId: string;
  /** Generator-owned sequence number, used after sourceId in the order key. */
  sourceSequence: number;
  /** Lower integer values sort before higher values at the same time. */
  priority: number;
  beatId: string;
  beatOrdinal: number;
  morphology: RhythmBeatMorphologyV1;
  activationTimeSec: number;
  targetIds: readonly string[];
  activationStrength01: number;
}>;

/**
 * One absolute-time accepted activation. Coincident activations form one batch
 * but retain strict (priority, sourceId, sourceSequence) order. A single event
 * may coactivate several targets; callers select the target before passing
 * calciumEvent to a per-wall exact-event calcium kernel.
 */
export type AcceptedRhythmActivationEventV1 = Readonly<{
  eventId: string;
  sourceId: string;
  sourceSequence: number;
  priority: number;
  beatId: string;
  beatOrdinal: number;
  morphology: RhythmBeatMorphologyV1;
  activationTimeSec: number;
  targetIds: readonly string[];
  activationStrength01: number;
  calciumEvent: ExactEventCalciumEventV1;
}>;

export type AcceptedRhythmEventScheduleV1 = Readonly<{
  scheduleType: typeof ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID;
  scheduleId: string;
  /** Deterministic binding guard, not a cryptographic integrity signature. */
  scheduleFingerprint: string;
  temporalSemantics: Readonly<{
    clock: "absolute-accepted-time";
    intervalConvention: "open-start-closed-end";
    translationInvariant: false;
  }>;
  eventCount: number;
  events: readonly AcceptedRhythmActivationEventV1[];
}>;

/**
 * Complete cryptographic preimage. The legacy 32-bit fingerprint remains a
 * fast binding guard, but is never sufficient for checkpoint/release identity.
 */
export type AcceptedRhythmScheduleCanonicalIdentityV1 = Readonly<{
  identitySchemaId:
    typeof ACCEPTED_RHYTHM_SCHEDULE_CANONICAL_IDENTITY_V1_ID;
  schemaVersion: 1;
  scheduleType: typeof ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID;
  scheduleId: string;
  legacyScheduleFingerprintFnv32: string;
  temporalSemantics: AcceptedRhythmEventScheduleV1["temporalSemantics"];
  eventCount: number;
  events: readonly AcceptedRhythmActivationEventV1[];
}>;

/** Minimal JSON-safe accepted owner. cursor counts all events at or before time. */
export type AcceptedRhythmScheduleStateV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID;
  schemaVersion: 1;
  scheduleId: string;
  scheduleFingerprint: string;
  scheduleEventCount: number;
  revision: number;
  acceptedTimeSec: number;
  cursor: number;
}>;

export type AcceptedRhythmScheduleTrialV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID;
  scheduleId: string;
  scheduleFingerprint: string;
  baseRevision: number;
  baseCursor: number;
  startTimeSec: number;
  candidateTimeSec: number;
  candidateCursor: number;
  activationEvents: readonly AcceptedRhythmActivationEventV1[];
}>;

export type AcceptedRhythmScheduleCheckpointV1 = Readonly<{
  checkpointId: typeof ACCEPTED_RHYTHM_SCHEDULE_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  stateSchemaId: typeof ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID;
  scheduleId: string;
  scheduleFingerprint: string;
  scheduleEventCount: number;
  revision: number;
  acceptedTimeSec: number;
  cursor: number;
}>;

export type AcceptedRhythmMaximumStepV1 = Readonly<{
  requestedStepSec: number;
  requestedEndTimeSec: number;
  maximumStepSec: number;
  candidateTimeSec: number;
  clippedByEvent: boolean;
  boundaryEventId: string | null;
  boundaryActivationTimeSec: number | null;
}>;

const TEMPORAL_SEMANTICS = Object.freeze({
  clock: "absolute-accepted-time" as const,
  intervalConvention: "open-start-closed-end" as const,
  translationInvariant: false as const,
});

/**
 * Validation cache only. Schedule objects are recursively immutable, so a
 * complete structural/fingerprint audit has the same result for their entire
 * lifetime. This cache never owns simulation state or changes model output.
 */
const VERIFIED_SCHEDULES = new WeakSet<object>();
/**
 * A live cursor is a capability bound to the exact schedule object that
 * created or restored it. The compact JSON state deliberately keeps only the
 * legacy fingerprint; detached live use must therefore pass through the
 * checkpoint restore boundary, where the complete outer schedule SHA is
 * checked by the owner before this capability is recreated.
 */
const LIVE_SCHEDULE_BY_STATE = new WeakMap<
  AcceptedRhythmScheduleStateV1,
  AcceptedRhythmEventScheduleV1
>();

export function createAcceptedRhythmEventScheduleV1(
  scheduleId: string,
  eventInputs: readonly RhythmActivationEventInputV1[],
): AcceptedRhythmEventScheduleV1 {
  const normalizedScheduleId = requireNonemptyString(scheduleId, "scheduleId");
  validateDenseArray(eventInputs, "eventInputs");
  const eventIds = new Set<string>();
  const sourceSequenceKeys = new Set<string>();
  const beatDefinitions = new Map<string, Readonly<{
    beatOrdinal: number;
    morphology: RhythmBeatMorphologyV1;
  }>>();
  const beatIdByOrdinal = new Map<number, string>();
  let previousEvent: AcceptedRhythmActivationEventV1 | null = null;

  const events = eventInputs.map((input, index) => {
    const field = `eventInputs[${index}]`;
    const eventId = requireNonemptyString(input.eventId, `${field}.eventId`);
    if (eventIds.has(eventId)) {
      throw new Error(`eventInputs contains duplicate eventId: ${eventId}`);
    }
    eventIds.add(eventId);
    const sourceId = requireNonemptyString(
      input.sourceId,
      `${field}.sourceId`,
    );
    const sourceSequence = requireNonnegativeInteger(
      input.sourceSequence,
      `${field}.sourceSequence`,
    );
    const priority = requireInteger(input.priority, `${field}.priority`);
    const beatId = requireNonemptyString(input.beatId, `${field}.beatId`);
    const beatOrdinal = requirePositiveInteger(
      input.beatOrdinal,
      `${field}.beatOrdinal`,
    );
    const morphology = requireMorphology(input.morphology, `${field}.morphology`);
    const activationTimeSec = requireNonnegativeFinite(
      input.activationTimeSec,
      `${field}.activationTimeSec`,
    );
    const existingBeat = beatDefinitions.get(beatId);
    if (
      existingBeat !== undefined
      && (
        existingBeat.beatOrdinal !== beatOrdinal
        || existingBeat.morphology !== morphology
      )
    ) {
      throw new Error("events sharing beatId must share ordinal and morphology");
    }
    if (existingBeat === undefined) {
      beatDefinitions.set(beatId, Object.freeze({ beatOrdinal, morphology }));
    }
    const existingBeatId = beatIdByOrdinal.get(beatOrdinal);
    if (existingBeatId !== undefined && existingBeatId !== beatId) {
      throw new Error("one beat ordinal cannot identify multiple beatId values");
    }
    beatIdByOrdinal.set(beatOrdinal, beatId);
    const targetIds = normalizeTargetIds(input.targetIds, `${field}.targetIds`);
    const activationStrength01 = requireUnitInterval(
      input.activationStrength01,
      `${field}.activationStrength01`,
    );
    const calciumEvent = Object.freeze({
      timeSec: activationTimeSec,
      strength: activationStrength01,
    });
    const event = Object.freeze({
      eventId,
      sourceId,
      sourceSequence,
      priority,
      beatId,
      beatOrdinal,
      morphology,
      activationTimeSec,
      targetIds,
      activationStrength01,
      calciumEvent,
    });
    if (previousEvent !== null) {
      const order = compareRhythmActivationOrderKey(previousEvent, event);
      if (order === 0) {
        throw new Error("rhythm schedule contains a duplicate canonical order key");
      }
      if (order > 0) {
        throw new Error("rhythm events are not in strict canonical order");
      }
    }
    const sourceSequenceKey = `${sourceId}\u0000${sourceSequence}`;
    if (sourceSequenceKeys.has(sourceSequenceKey)) {
      throw new Error(
        `eventInputs contains duplicate source sequence: ${sourceId}#${sourceSequence}`,
      );
    }
    sourceSequenceKeys.add(sourceSequenceKey);
    previousEvent = event;
    return event;
  });

  const frozenEvents = Object.freeze(events);
  const scheduleFingerprint = fingerprintSchedule(
    normalizedScheduleId,
    frozenEvents,
  );
  const schedule = Object.freeze({
    scheduleType: ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID,
    scheduleId: normalizedScheduleId,
    scheduleFingerprint,
    temporalSemantics: TEMPORAL_SEMANTICS,
    eventCount: frozenEvents.length,
    events: frozenEvents,
  });
  VERIFIED_SCHEDULES.add(schedule);
  return schedule;
}

/** Returns a detached, immutable full-schedule SHA-256 preimage. */
export function canonicalAcceptedRhythmEventScheduleIdentityV1(
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedRhythmScheduleCanonicalIdentityV1 {
  assertScheduleHeader(schedule);
  return Object.freeze({
    identitySchemaId: ACCEPTED_RHYTHM_SCHEDULE_CANONICAL_IDENTITY_V1_ID,
    schemaVersion: 1 as const,
    scheduleType: schedule.scheduleType,
    scheduleId: schedule.scheduleId,
    legacyScheduleFingerprintFnv32: schedule.scheduleFingerprint,
    temporalSemantics: Object.freeze({ ...schedule.temporalSemantics }),
    eventCount: schedule.eventCount,
    events: Object.freeze(schedule.events.map((event) => Object.freeze({
      eventId: event.eventId,
      sourceId: event.sourceId,
      sourceSequence: event.sourceSequence,
      priority: event.priority,
      beatId: event.beatId,
      beatOrdinal: event.beatOrdinal,
      morphology: event.morphology,
      activationTimeSec: event.activationTimeSec,
      targetIds: Object.freeze([...event.targetIds]),
      activationStrength01: event.activationStrength01,
      calciumEvent: Object.freeze({ ...event.calciumEvent }),
    }))),
  });
}

export function canonicalAcceptedRhythmEventScheduleJsonV1(
  schedule: AcceptedRhythmEventScheduleV1,
): string {
  return canonicalJsonStringify(
    canonicalAcceptedRhythmEventScheduleIdentityV1(schedule),
  );
}

export async function sha256AcceptedRhythmEventScheduleIdentityV1(
  schedule: AcceptedRhythmEventScheduleV1,
): Promise<string> {
  return sha256CanonicalJsonHex(
    canonicalAcceptedRhythmEventScheduleIdentityV1(schedule),
  );
}

export function initializeAcceptedRhythmScheduleStateV1(
  schedule: AcceptedRhythmEventScheduleV1,
  acceptedTimeSec = 0,
  revision = 0,
): AcceptedRhythmScheduleStateV1 {
  assertScheduleHeader(schedule);
  const time = requireNonnegativeFinite(acceptedTimeSec, "acceptedTimeSec");
  requireNonnegativeInteger(revision, "revision");
  return freezeState({
    schedule,
    revision,
    acceptedTimeSec: time,
    cursor: upperBoundActivationTime(schedule.events, time),
  });
}

/**
 * Pure trial evaluation. It returns events in (previous.acceptedTimeSec,
 * candidateTimeSec] and never mutates or consumes the accepted cursor.
 */
export function evaluateAcceptedRhythmScheduleTrialV1(
  previous: AcceptedRhythmScheduleStateV1,
  candidateTimeSec: number,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedRhythmScheduleTrialV1 {
  assertStateMatchesSchedule(previous, schedule);
  const candidate = requireNonnegativeFinite(
    candidateTimeSec,
    "candidateTimeSec",
  );
  if (!(candidate > previous.acceptedTimeSec)) {
    throw new Error("candidateTimeSec must exceed acceptedTimeSec");
  }
  const candidateCursor = upperBoundActivationTime(schedule.events, candidate);
  const activationEvents = Object.freeze(
    schedule.events.slice(previous.cursor, candidateCursor),
  );
  return Object.freeze({
    stateSchemaId: ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID,
    scheduleId: schedule.scheduleId,
    scheduleFingerprint: schedule.scheduleFingerprint,
    baseRevision: previous.revision,
    baseCursor: previous.cursor,
    startTimeSec: previous.acceptedTimeSec,
    candidateTimeSec: candidate,
    candidateCursor,
    activationEvents,
  });
}

export function commitAcceptedRhythmScheduleTrialV1(
  previous: AcceptedRhythmScheduleStateV1,
  trial: AcceptedRhythmScheduleTrialV1,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedRhythmScheduleStateV1 {
  assertTrialBaseMatches(previous, trial, schedule);
  const expected = evaluateAcceptedRhythmScheduleTrialV1(
    previous,
    trial.candidateTimeSec,
    schedule,
  );
  if (
    trial.candidateCursor !== expected.candidateCursor
    || trial.activationEvents.length !== expected.activationEvents.length
    || trial.activationEvents.some(
      (event, index) => event !== expected.activationEvents[index],
    )
  ) {
    throw new Error("rhythm trial event slice does not match the schedule");
  }
  return freezeState({
    schedule,
    revision: previous.revision + 1,
    acceptedTimeSec: trial.candidateTimeSec,
    cursor: trial.candidateCursor,
  });
}

/** A rejected transaction consumes nothing and returns the same accepted owner. */
export function rollbackAcceptedRhythmScheduleTrialV1(
  previous: AcceptedRhythmScheduleStateV1,
  trial: AcceptedRhythmScheduleTrialV1,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedRhythmScheduleStateV1 {
  assertTrialBaseMatches(previous, trial, schedule);
  return previous;
}

/**
 * Restricts a proposed step to the next unconsumed activation-batch boundary.
 * An event exactly at the requested endpoint owns that endpoint but does not
 * count as a shortened step. boundaryEventId names the first canonical event
 * in a coincident batch; time-based cursor advancement owns the entire batch.
 */
export function maximumAcceptedRhythmScheduleStepV1(
  previous: AcceptedRhythmScheduleStateV1,
  requestedStepSec: number,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedRhythmMaximumStepV1 {
  assertStateMatchesSchedule(previous, schedule);
  const requestedStep = requirePositiveFinite(
    requestedStepSec,
    "requestedStepSec",
  );
  const requestedEndTimeSec = previous.acceptedTimeSec + requestedStep;
  if (!Number.isFinite(requestedEndTimeSec)) {
    throw new Error("requested step end time must remain finite");
  }
  const nextEvent = schedule.events[previous.cursor] ?? null;
  if (
    nextEvent !== null
    && nextEvent.activationTimeSec <= requestedEndTimeSec
  ) {
    const maximumStepSec = nextEvent.activationTimeSec
      - previous.acceptedTimeSec;
    if (!(maximumStepSec > 0)) {
      throw new Error("next rhythm event must lie after acceptedTimeSec");
    }
    return Object.freeze({
      requestedStepSec: requestedStep,
      requestedEndTimeSec,
      maximumStepSec,
      candidateTimeSec: nextEvent.activationTimeSec,
      clippedByEvent: nextEvent.activationTimeSec < requestedEndTimeSec,
      boundaryEventId: nextEvent.eventId,
      boundaryActivationTimeSec: nextEvent.activationTimeSec,
    });
  }
  return Object.freeze({
    requestedStepSec: requestedStep,
    requestedEndTimeSec,
    maximumStepSec: requestedStep,
    candidateTimeSec: requestedEndTimeSec,
    clippedByEvent: false,
    boundaryEventId: null,
    boundaryActivationTimeSec: null,
  });
}

/** Direct per-target adapter for advanceExactEventCalciumV1. */
export function exactEventCalciumEventsForRhythmTargetV1(
  activationEvents: readonly AcceptedRhythmActivationEventV1[],
  targetId: string,
): readonly ExactEventCalciumEventV1[] {
  const target = requireNonemptyString(targetId, "targetId");
  validateDenseArray(activationEvents, "activationEvents");
  return Object.freeze(activationEvents.flatMap((event) =>
    event.targetIds.includes(target) ? [event.calciumEvent] : []));
}

export function checkpointAcceptedRhythmScheduleStateV1(
  state: AcceptedRhythmScheduleStateV1,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedRhythmScheduleCheckpointV1 {
  assertStateMatchesSchedule(state, schedule);
  return Object.freeze({
    checkpointId: ACCEPTED_RHYTHM_SCHEDULE_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    stateSchemaId: state.stateSchemaId,
    scheduleId: state.scheduleId,
    scheduleFingerprint: state.scheduleFingerprint,
    scheduleEventCount: state.scheduleEventCount,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    cursor: state.cursor,
  });
}

export function restoreAcceptedRhythmScheduleStateV1(
  candidate: unknown,
  schedule: AcceptedRhythmEventScheduleV1,
): AcceptedRhythmScheduleStateV1 {
  assertScheduleHeader(schedule);
  const checkpoint = requirePlainRecord(candidate, "rhythm checkpoint");
  requireExactKeys(checkpoint, [
    "checkpointId",
    "schemaVersion",
    "stateSchemaId",
    "scheduleId",
    "scheduleFingerprint",
    "scheduleEventCount",
    "revision",
    "acceptedTimeSec",
    "cursor",
  ], "rhythm checkpoint");
  if (
    checkpoint.checkpointId !== ACCEPTED_RHYTHM_SCHEDULE_CHECKPOINT_V1_ID
    || checkpoint.schemaVersion !== 1
    || checkpoint.stateSchemaId !== ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID
  ) {
    throw new Error("unsupported accepted rhythm schedule checkpoint schema");
  }
  const checkpointScheduleId = requireNonemptyString(
    checkpoint.scheduleId,
    "checkpoint.scheduleId",
  );
  const checkpointFingerprint = requireNonemptyString(
    checkpoint.scheduleFingerprint,
    "checkpoint.scheduleFingerprint",
  );
  const checkpointEventCount = requireNonnegativeInteger(
    checkpoint.scheduleEventCount,
    "checkpoint.scheduleEventCount",
  );
  if (
    checkpointScheduleId !== schedule.scheduleId
    || checkpointFingerprint !== schedule.scheduleFingerprint
    || checkpointEventCount !== schedule.eventCount
  ) throw new Error("rhythm checkpoint schedule identity mismatch");
  const state = freezeState({
    schedule,
    revision: requireNonnegativeInteger(
      checkpoint.revision,
      "checkpoint.revision",
    ),
    acceptedTimeSec: requireNonnegativeFinite(
      checkpoint.acceptedTimeSec,
      "checkpoint.acceptedTimeSec",
    ),
    cursor: requireNonnegativeInteger(
      checkpoint.cursor,
      "checkpoint.cursor",
    ),
  });
  assertStateMatchesSchedule(state, schedule);
  return state;
}

function freezeState(input: Readonly<{
  schedule: AcceptedRhythmEventScheduleV1;
  revision: number;
  acceptedTimeSec: number;
  cursor: number;
}>): AcceptedRhythmScheduleStateV1 {
  const state = Object.freeze({
    stateSchemaId: ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID,
    schemaVersion: 1 as const,
    scheduleId: input.schedule.scheduleId,
    scheduleFingerprint: input.schedule.scheduleFingerprint,
    scheduleEventCount: input.schedule.eventCount,
    revision: input.revision,
    acceptedTimeSec: input.acceptedTimeSec,
    cursor: input.cursor,
  });
  LIVE_SCHEDULE_BY_STATE.set(state, input.schedule);
  return state;
}

function assertScheduleHeader(schedule: AcceptedRhythmEventScheduleV1): void {
  if (
    schedule.scheduleType !== ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID
    || schedule.temporalSemantics.clock !== "absolute-accepted-time"
    || schedule.temporalSemantics.intervalConvention
      !== "open-start-closed-end"
    || schedule.temporalSemantics.translationInvariant !== false
    || schedule.eventCount !== schedule.events.length
    || !Object.isFrozen(schedule)
    || !Object.isFrozen(schedule.events)
  ) {
    throw new Error("invalid accepted rhythm event schedule header");
  }
  requireNonemptyString(schedule.scheduleId, "schedule.scheduleId");
  requireNonemptyString(
    schedule.scheduleFingerprint,
    "schedule.scheduleFingerprint",
  );
  if (VERIFIED_SCHEDULES.has(schedule)) return;
  auditExternalSchedule(schedule);
  VERIFIED_SCHEDULES.add(schedule);
}

/**
 * A schedule normally enters through createAcceptedRhythmEventScheduleV1.
 * This audit prevents a hand-built or deserialized frozen object from using a
 * stale fingerprint, hidden fields, or a malformed nested event while still
 * satisfying only the shallow header checks above.
 */
function auditExternalSchedule(
  schedule: AcceptedRhythmEventScheduleV1,
): void {
  const scheduleRecord = requirePlainRecord(schedule, "schedule");
  requireExactKeys(scheduleRecord, [
    "scheduleType",
    "scheduleId",
    "scheduleFingerprint",
    "temporalSemantics",
    "eventCount",
    "events",
  ], "schedule");
  const temporalRecord = requirePlainRecord(
    schedule.temporalSemantics,
    "schedule.temporalSemantics",
  );
  requireExactKeys(temporalRecord, [
    "clock",
    "intervalConvention",
    "translationInvariant",
  ], "schedule.temporalSemantics");
  if (!Object.isFrozen(schedule.temporalSemantics)) {
    throw new Error("schedule temporal semantics must be immutable");
  }
  validateDenseArray(schedule.events, "schedule.events");
  const inputs = schedule.events.map((event, index) => {
    const field = `schedule.events[${index}]`;
    const eventRecord = requirePlainRecord(event, field);
    requireExactKeys(eventRecord, [
      "eventId",
      "sourceId",
      "sourceSequence",
      "priority",
      "beatId",
      "beatOrdinal",
      "morphology",
      "activationTimeSec",
      "targetIds",
      "activationStrength01",
      "calciumEvent",
    ], field);
    const calciumRecord = requirePlainRecord(
      event.calciumEvent,
      `${field}.calciumEvent`,
    );
    requireExactKeys(
      calciumRecord,
      ["timeSec", "strength"],
      `${field}.calciumEvent`,
    );
    if (
      !Object.isFrozen(event)
      || !Object.isFrozen(event.targetIds)
      || !Object.isFrozen(event.calciumEvent)
    ) {
      throw new Error(`${field} and its nested values must be immutable`);
    }
    if (
      event.calciumEvent.timeSec !== event.activationTimeSec
      || event.calciumEvent.strength !== event.activationStrength01
    ) {
      throw new Error(`${field}.calciumEvent differs from activation fields`);
    }
    return Object.freeze({
      eventId: event.eventId,
      sourceId: event.sourceId,
      sourceSequence: event.sourceSequence,
      priority: event.priority,
      beatId: event.beatId,
      beatOrdinal: event.beatOrdinal,
      morphology: event.morphology,
      activationTimeSec: event.activationTimeSec,
      targetIds: event.targetIds,
      activationStrength01: event.activationStrength01,
    }) satisfies RhythmActivationEventInputV1;
  });
  const rebuilt = createAcceptedRhythmEventScheduleV1(
    schedule.scheduleId,
    Object.freeze(inputs),
  );
  if (schedule.scheduleFingerprint !== rebuilt.scheduleFingerprint) {
    throw new Error("accepted rhythm schedule fingerprint does not match content");
  }
}

function assertStateMatchesSchedule(
  state: AcceptedRhythmScheduleStateV1,
  schedule: AcceptedRhythmEventScheduleV1,
): void {
  assertScheduleHeader(schedule);
  if (LIVE_SCHEDULE_BY_STATE.get(state) !== schedule) {
    throw new Error(
      "accepted rhythm state is not a live capability for this exact schedule",
    );
  }
  if (
    state.stateSchemaId !== ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID
    || state.schemaVersion !== 1
    || state.scheduleId !== schedule.scheduleId
    || state.scheduleFingerprint !== schedule.scheduleFingerprint
    || state.scheduleEventCount !== schedule.eventCount
  ) {
    throw new Error("accepted rhythm state does not match schedule identity");
  }
  requireNonnegativeInteger(state.revision, "state.revision");
  requireNonnegativeFinite(state.acceptedTimeSec, "state.acceptedTimeSec");
  requireNonnegativeInteger(state.cursor, "state.cursor");
  if (state.cursor > schedule.eventCount) {
    throw new Error("accepted rhythm cursor exceeds schedule event count");
  }
  const expectedCursor = upperBoundActivationTime(
    schedule.events,
    state.acceptedTimeSec,
  );
  if (state.cursor !== expectedCursor) {
    throw new Error("accepted rhythm cursor does not match acceptedTimeSec");
  }
}

function assertTrialBaseMatches(
  previous: AcceptedRhythmScheduleStateV1,
  trial: AcceptedRhythmScheduleTrialV1,
  schedule: AcceptedRhythmEventScheduleV1,
): void {
  assertStateMatchesSchedule(previous, schedule);
  if (
    trial.stateSchemaId !== ACCEPTED_RHYTHM_SCHEDULE_STATE_V1_ID
    || trial.scheduleId !== schedule.scheduleId
    || trial.scheduleFingerprint !== schedule.scheduleFingerprint
    || trial.baseRevision !== previous.revision
    || trial.baseCursor !== previous.cursor
    || trial.startTimeSec !== previous.acceptedTimeSec
    || !(trial.candidateTimeSec > previous.acceptedTimeSec)
  ) {
    throw new Error("stale or foreign accepted rhythm schedule trial");
  }
}

function upperBoundActivationTime(
  events: readonly AcceptedRhythmActivationEventV1[],
  timeSec: number,
): number {
  let lower = 0;
  let upper = events.length;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (events[middle]!.activationTimeSec <= timeSec) lower = middle + 1;
    else upper = middle;
  }
  return lower;
}

function normalizeTargetIds(
  targetIds: readonly string[],
  field: string,
): readonly string[] {
  validateDenseArray(targetIds, field);
  if (targetIds.length === 0) {
    throw new Error(`${field} must contain at least one target`);
  }
  const normalized = targetIds.map((targetId, index) =>
    requireNonemptyString(targetId, `${field}[${index}]`));
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) {
    throw new Error(`${field} must not contain duplicate targets`);
  }
  return Object.freeze([...normalized].sort(compareCanonicalStrings));
}

function fingerprintSchedule(
  scheduleId: string,
  events: readonly AcceptedRhythmActivationEventV1[],
): string {
  const identity = JSON.stringify({
    scheduleType: ACCEPTED_RHYTHM_EVENT_SCHEDULE_V1_ID,
    scheduleId,
    temporalSemantics: TEMPORAL_SEMANTICS,
    events: events.map((event) => ({
      eventId: event.eventId,
      sourceId: event.sourceId,
      sourceSequence: event.sourceSequence,
      priority: event.priority,
      beatId: event.beatId,
      beatOrdinal: event.beatOrdinal,
      morphology: event.morphology,
      activationTimeSec: event.activationTimeSec,
      targetIds: event.targetIds,
      activationStrength01: event.activationStrength01,
    })),
  });
  let hash = 0x811c9dc5;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function requireMorphology(
  value: unknown,
  field: string,
): RhythmBeatMorphologyV1 {
  if (!RHYTHM_BEAT_MORPHOLOGIES_V1.includes(
    value as RhythmBeatMorphologyV1,
  )) {
    throw new Error(`${field} is not a supported beat morphology`);
  }
  return value as RhythmBeatMorphologyV1;
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}

function requireInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`${field} must be an integer`);
  }
  return value;
}

function requireNonnegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative integer`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireUnitInterval(value: unknown, field: string): number {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < 0
    || value > 1
  ) {
    throw new Error(`${field} must lie in [0, 1]`);
  }
  return value;
}

function validateDenseArray(value: readonly unknown[], field: string): void {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) {
      throw new Error(`${field} must not contain holes`);
    }
  }
}

function requirePlainRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error(`${field} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  field: string,
): void {
  const actual = Object.keys(value).sort(compareCanonicalStrings);
  const expected = [...keys].sort(compareCanonicalStrings);
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${field} has an unexpected field set`);
  }
}

function compareCanonicalStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareRhythmActivationOrderKey(
  left: Pick<
    AcceptedRhythmActivationEventV1,
    "activationTimeSec" | "priority" | "sourceId" | "sourceSequence"
  >,
  right: Pick<
    AcceptedRhythmActivationEventV1,
    "activationTimeSec" | "priority" | "sourceId" | "sourceSequence"
  >,
): number {
  if (left.activationTimeSec !== right.activationTimeSec) {
    return left.activationTimeSec < right.activationTimeSec ? -1 : 1;
  }
  if (left.priority !== right.priority) {
    return left.priority < right.priority ? -1 : 1;
  }
  const sourceOrder = compareCanonicalStrings(left.sourceId, right.sourceId);
  if (sourceOrder !== 0) return sourceOrder;
  if (left.sourceSequence !== right.sourceSequence) {
    return left.sourceSequence < right.sourceSequence ? -1 : 1;
  }
  return 0;
}
