import {
  createSourceImpulseV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

/**
 * Accepted, finite, authored PAC/PVC source schedule.
 *
 * This owner emits electrical source proposals only. In particular it does
 * not decide capture, model refractoriness, modify a sinus generator, invent
 * a compensatory pause, or infer retrograde conduction or fusion.
 */

export const AUTHORED_ECTOPY_EVENT_V2_ID =
  "authored-ectopy-event-v2" as const;
export const ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CONFIGURATION_V2_ID =
  "accepted-authored-ectopy-schedule-configuration-v2" as const;
export const ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_IDENTITY_V2_ID =
  "accepted-authored-ectopy-schedule-identity-v2" as const;
export const ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID =
  "accepted-authored-ectopy-schedule-state-v2" as const;
export const ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_TRIAL_V2_ID =
  "accepted-authored-ectopy-schedule-trial-v2" as const;
export const AUTHORED_ECTOPY_SOURCE_IMPULSE_METADATA_V2_ID =
  "authored-ectopy-source-impulse-metadata-v2" as const;

export const ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2 = deepFreeze({
  scope: "finite-authored-pac-pvc-electrical-source-schedule" as const,
  timingOwner: "absolute-accepted-time" as const,
  authoredActivationTimes: "signed-finite" as const,
  acceptedOwnerTime: "nonnegative-finite" as const,
  initializationHistory:
    "events-at-or-before-initial-accepted-time-are-consumed-not-reemitted" as const,
  intervalConvention: "open-start-closed-end" as const,
  canonicalOrder:
    "activation-time-then-source-id-code-unit-then-source-sequence-then-authored-ectopy-id" as const,
  sameTimeBatching: "complete-without-truncation" as const,
  sourceImpulseSchema: "source-impulse-v2" as const,
  emittedSourceKind: "authored-ectopy" as const,
  parentCapturedActivation: null,
  pacRoute: "atrial" as const,
  pvcRoute: "ventricular" as const,
  sinusResetPolicy:
    "pac-metadata-only-enclosing-composition-may-apply-only-after-confirmed-pac-capture" as const,
  pvcSinusResetPolicyClaimed: false as const,
  sourceMutationClaimed: false as const,
  stochasticBurdenClaimed: false as const,
  compensatoryPauseClaimed: false as const,
  retrogradeVaConductionClaimed: false as const,
  fusionClaimed: false as const,
  qrsMorphologyClaimed: false as const,
  captureClaimed: false as const,
  refractoryClaimed: false as const,
  clinicalValidityClaimed: false as const,
  acceptedStateImmutable: true as const,
  trialEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
  configurationIdentity:
    "sha-256-over-complete-canonical-schedule-configuration" as const,
});

export type PacSinusResetPolicyV2 = "reset" | "preserve";

export type AuthoredPacEventInputV2 = Readonly<{
  eventKind: "pac";
  authoredEctopyId: string;
  sourceId: string;
  sourceSequence: number;
  /** Signed finite absolute electrical activation time, in seconds. */
  activationTimeSec: number;
  chamber: "atrial";
  sinusResetPolicy: PacSinusResetPolicyV2;
}>;

export type AuthoredPvcEventInputV2 = Readonly<{
  eventKind: "pvc";
  authoredEctopyId: string;
  sourceId: string;
  sourceSequence: number;
  /** Signed finite absolute electrical activation time, in seconds. */
  activationTimeSec: number;
  chamber: "ventricular";
}>;

export type AuthoredEctopyEventInputV2 =
  | AuthoredPacEventInputV2
  | AuthoredPvcEventInputV2;

type AuthoredEctopyEventBaseV2 = Readonly<{
  eventSchemaId: typeof AUTHORED_ECTOPY_EVENT_V2_ID;
  schemaVersion: 2;
  authoredEctopyId: string;
  sourceId: string;
  sourceSequence: number;
  activationTimeSec: number;
}>;

export type AuthoredPacEventV2 = AuthoredEctopyEventBaseV2 & Readonly<{
  eventKind: "pac";
  chamber: "atrial";
  sinusResetPolicy: PacSinusResetPolicyV2;
}>;

export type AuthoredPvcEventV2 = AuthoredEctopyEventBaseV2 & Readonly<{
  eventKind: "pvc";
  chamber: "ventricular";
}>;

export type AuthoredEctopyEventV2 = AuthoredPacEventV2 | AuthoredPvcEventV2;

export type AcceptedAuthoredEctopyScheduleConfigurationInputV2 = Readonly<{
  configurationId: string;
  ownerInstanceId: string;
  scheduleId: string;
  events: readonly AuthoredEctopyEventInputV2[];
}>;

export type AcceptedAuthoredEctopyScheduleConfigurationV2 = Readonly<{
  configurationSchemaId:
    typeof ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CONFIGURATION_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  ownerInstanceId: string;
  scheduleId: string;
  temporalSemantics: Readonly<{
    clock: "absolute-accepted-time";
    intervalConvention: "open-start-closed-end";
    translationInvariant: false;
  }>;
  eventCount: number;
  events: readonly AuthoredEctopyEventV2[];
}>;

export type AcceptedAuthoredEctopyScheduleIdentityV2 = Readonly<{
  identitySchemaId: typeof ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_IDENTITY_V2_ID;
  schemaVersion: 2;
  configurationSchemaId:
    typeof ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CONFIGURATION_V2_ID;
  configurationId: string;
  ownerInstanceId: string;
  scheduleId: string;
  temporalSemantics:
    AcceptedAuthoredEctopyScheduleConfigurationV2["temporalSemantics"];
  eventCount: number;
  events: readonly AuthoredEctopyEventV2[];
}>;

export type AuthoredPacSourceImpulseMetadataV2 = Readonly<{
  metadataSchemaId: typeof AUTHORED_ECTOPY_SOURCE_IMPULSE_METADATA_V2_ID;
  schemaVersion: 2;
  sourceImpulseId: string;
  eventKind: "pac";
  authoredEctopyId: string;
  chamber: "atrial";
  sourceId: string;
  sourceSequence: number;
  activationTimeSec: number;
  /** Metadata only; this owner never applies the policy. */
  sinusResetPolicy: PacSinusResetPolicyV2;
}>;

export type AuthoredPvcSourceImpulseMetadataV2 = Readonly<{
  metadataSchemaId: typeof AUTHORED_ECTOPY_SOURCE_IMPULSE_METADATA_V2_ID;
  schemaVersion: 2;
  sourceImpulseId: string;
  eventKind: "pvc";
  authoredEctopyId: string;
  chamber: "ventricular";
  sourceId: string;
  sourceSequence: number;
  activationTimeSec: number;
}>;

export type AuthoredEctopySourceImpulseMetadataV2 =
  | AuthoredPacSourceImpulseMetadataV2
  | AuthoredPvcSourceImpulseMetadataV2;

export type AcceptedAuthoredEctopyScheduleStateV2 = Readonly<{
  stateSchemaId: typeof ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID;
  schemaVersion: 2;
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2;
  initializedAcceptedTimeSec: number;
  initializedHistoryEventCount: number;
  revision: number;
  acceptedTimeSec: number;
  /** Number of configured events at or before acceptedTimeSec. */
  cursor: number;
  /** Events emitted by committed trials; initialization history is excluded. */
  acceptedEmittedImpulseCount: number;
}>;

export type AcceptedAuthoredEctopyScheduleTrialV2 = Readonly<{
  trialSchemaId: typeof ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_TRIAL_V2_ID;
  schemaVersion: 2;
  configurationId: string;
  ownerInstanceId: string;
  scheduleId: string;
  baseRevision: number;
  candidateRevision: number;
  baseCursor: number;
  candidateCursor: number;
  startTimeSec: number;
  candidateTimeSec: number;
  /** Complete canonical source-impulse slice for (start, candidate]. */
  sourceImpulses: readonly SourceImpulseV2[];
  /**
   * Direct lookup by SourceImpulseV2.sourceImpulseId. A composition can use a
   * captured activation's parentSourceImpulseId to recover PAC reset metadata.
   */
  metadataBySourceImpulseId: Readonly<
    Record<string, AuthoredEctopySourceImpulseMetadataV2>
  >;
  candidateState: AcceptedAuthoredEctopyScheduleStateV2;
}>;

export type AcceptedAuthoredEctopyMaximumStepV2 = Readonly<{
  requestedStepSec: number;
  requestedEndTimeSec: number;
  maximumStepSec: number;
  candidateTimeSec: number;
  clippedByEvent: boolean;
  boundaryActivationTimeSec: number | null;
  boundaryAuthoredEctopyId: string | null;
  boundaryBatchEventCount: number;
}>;

const TEMPORAL_SEMANTICS = deepFreeze({
  clock: "absolute-accepted-time" as const,
  intervalConvention: "open-start-closed-end" as const,
  translationInvariant: false as const,
});

const CONFIGURATION_INPUT_KEYS = Object.freeze([
  "configurationId",
  "ownerInstanceId",
  "scheduleId",
  "events",
] as const);
const CONFIGURATION_KEYS = Object.freeze([
  "configurationSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "scheduleId",
  "temporalSemantics",
  "eventCount",
  "events",
] as const);
const TEMPORAL_SEMANTICS_KEYS = Object.freeze([
  "clock",
  "intervalConvention",
  "translationInvariant",
] as const);
const EVENT_BASE_INPUT_KEYS = Object.freeze([
  "eventKind",
  "authoredEctopyId",
  "sourceId",
  "sourceSequence",
  "activationTimeSec",
  "chamber",
] as const);
const PAC_INPUT_KEYS = Object.freeze([
  ...EVENT_BASE_INPUT_KEYS,
  "sinusResetPolicy",
] as const);
const PVC_INPUT_KEYS = EVENT_BASE_INPUT_KEYS;
const EVENT_BASE_KEYS = Object.freeze([
  "eventSchemaId",
  "schemaVersion",
  ...EVENT_BASE_INPUT_KEYS,
] as const);
const PAC_EVENT_KEYS = Object.freeze([
  ...EVENT_BASE_KEYS,
  "sinusResetPolicy",
] as const);
const PVC_EVENT_KEYS = EVENT_BASE_KEYS;
const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "configuration",
  "initializedAcceptedTimeSec",
  "initializedHistoryEventCount",
  "revision",
  "acceptedTimeSec",
  "cursor",
  "acceptedEmittedImpulseCount",
] as const);
const TRIAL_KEYS = Object.freeze([
  "trialSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "scheduleId",
  "baseRevision",
  "candidateRevision",
  "baseCursor",
  "candidateCursor",
  "startTimeSec",
  "candidateTimeSec",
  "sourceImpulses",
  "metadataBySourceImpulseId",
  "candidateState",
] as const);

const VERIFIED_CONFIGURATIONS = new WeakSet<object>();

export function createAcceptedAuthoredEctopyScheduleConfigurationV2(
  input: AcceptedAuthoredEctopyScheduleConfigurationInputV2,
): AcceptedAuthoredEctopyScheduleConfigurationV2 {
  // Fail closed on accessors, sparse arrays, symbols, invalid Unicode, and
  // non-JSON values before reading fields into the accepted configuration.
  canonicalJsonStringify(input);
  const record = requirePlainRecord(input, "authored ectopy configuration input");
  requireExactKeys(
    record,
    CONFIGURATION_INPUT_KEYS,
    "authored ectopy configuration input",
  );
  validateDenseArray(input.events, "authored ectopy configuration input.events");

  const ids = new Set<string>();
  const sourceSequenceKeys = new Set<string>();
  const events = input.events.map((event, index) => {
    const copied = copyEventInput(
      event,
      `authored ectopy configuration input.events[${index}]`,
    );
    if (ids.has(copied.authoredEctopyId)) {
      throw new Error(
        `authored ectopy schedule contains duplicate authoredEctopyId: ${copied.authoredEctopyId}`,
      );
    }
    ids.add(copied.authoredEctopyId);
    const key = canonicalJsonStringify([
      copied.sourceId,
      copied.sourceSequence,
    ]);
    if (sourceSequenceKeys.has(key)) {
      throw new Error(
        "authored ectopy schedule contains a duplicate source sequence key",
      );
    }
    sourceSequenceKeys.add(key);
    return copied;
  });
  events.sort(compareEventOrder);

  const configuration = deepFreeze({
    configurationSchemaId:
      ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CONFIGURATION_V2_ID,
    schemaVersion: 2 as const,
    configurationId: requireNonemptyString(
      input.configurationId,
      "authored ectopy configuration input.configurationId",
    ),
    ownerInstanceId: requireNonemptyString(
      input.ownerInstanceId,
      "authored ectopy configuration input.ownerInstanceId",
    ),
    scheduleId: requireNonemptyString(
      input.scheduleId,
      "authored ectopy configuration input.scheduleId",
    ),
    temporalSemantics: TEMPORAL_SEMANTICS,
    eventCount: events.length,
    events: Object.freeze(events),
  }) satisfies AcceptedAuthoredEctopyScheduleConfigurationV2;
  // Also ensures all constructed identifiers remain canonical JSON strings.
  canonicalJsonStringify(configuration);
  VERIFIED_CONFIGURATIONS.add(configuration);
  return configuration;
}

export function validateAcceptedAuthoredEctopyScheduleConfigurationV2(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
): void {
  const record = requirePlainRecord(
    configuration,
    "accepted authored ectopy schedule configuration",
  );
  requireExactKeys(
    record,
    CONFIGURATION_KEYS,
    "accepted authored ectopy schedule configuration",
  );
  if (
    configuration.configurationSchemaId
      !== ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CONFIGURATION_V2_ID
    || configuration.schemaVersion !== 2
  ) {
    throw new Error("authored ectopy configuration schema is invalid");
  }
  requireNonemptyString(configuration.configurationId, "configuration id");
  requireNonemptyString(configuration.ownerInstanceId, "owner instance id");
  requireNonemptyString(configuration.scheduleId, "schedule id");
  const temporal = requirePlainRecord(
    configuration.temporalSemantics,
    "authored ectopy temporal semantics",
  );
  requireExactKeys(
    temporal,
    TEMPORAL_SEMANTICS_KEYS,
    "authored ectopy temporal semantics",
  );
  if (
    configuration.temporalSemantics.clock !== "absolute-accepted-time"
    || configuration.temporalSemantics.intervalConvention
      !== "open-start-closed-end"
    || configuration.temporalSemantics.translationInvariant !== false
  ) {
    throw new Error("authored ectopy temporal semantics are invalid");
  }
  if (
    !Object.isFrozen(configuration)
    || !Object.isFrozen(configuration.temporalSemantics)
    || !Object.isFrozen(configuration.events)
  ) {
    throw new Error("authored ectopy configuration must be immutable");
  }
  validateDenseArray(configuration.events, "authored ectopy events");
  if (configuration.eventCount !== configuration.events.length) {
    throw new Error("authored ectopy event count does not match events");
  }
  if (VERIFIED_CONFIGURATIONS.has(configuration)) return;

  const rebuilt = createAcceptedAuthoredEctopyScheduleConfigurationV2({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    scheduleId: configuration.scheduleId,
    events: configuration.events.map((event, index) =>
      eventToInput(event, `authored ectopy events[${index}]`)),
  });
  if (canonicalJsonStringify(configuration) !== canonicalJsonStringify(rebuilt)) {
    throw new Error(
      "authored ectopy configuration does not match canonical full content",
    );
  }
  if (configuration.events.some((event) => !Object.isFrozen(event))) {
    throw new Error("authored ectopy events must be immutable");
  }
  VERIFIED_CONFIGURATIONS.add(configuration);
}

export function canonicalAcceptedAuthoredEctopyScheduleIdentityV2(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
): AcceptedAuthoredEctopyScheduleIdentityV2 {
  validateAcceptedAuthoredEctopyScheduleConfigurationV2(configuration);
  return deepFreeze({
    identitySchemaId: ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_IDENTITY_V2_ID,
    schemaVersion: 2 as const,
    configurationSchemaId:
      ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CONFIGURATION_V2_ID,
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    scheduleId: configuration.scheduleId,
    temporalSemantics: { ...configuration.temporalSemantics },
    eventCount: configuration.eventCount,
    events: configuration.events.map(copyEvent),
  });
}

export function canonicalAcceptedAuthoredEctopyScheduleJsonV2(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
): string {
  return canonicalJsonStringify(
    canonicalAcceptedAuthoredEctopyScheduleIdentityV2(configuration),
  );
}

export async function sha256AcceptedAuthoredEctopyScheduleIdentityV2(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
): Promise<string> {
  return sha256CanonicalJsonHex(
    canonicalAcceptedAuthoredEctopyScheduleIdentityV2(configuration),
  );
}

export function initializeAcceptedAuthoredEctopyScheduleStateV2(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
  acceptedTimeSec = 0,
): AcceptedAuthoredEctopyScheduleStateV2 {
  const ownedConfiguration = copyConfiguration(configuration);
  const time = requireNonnegativeFinite(
    acceptedTimeSec,
    "authored ectopy initial accepted time",
  );
  const historicalCount = upperBoundActivationTime(
    ownedConfiguration.events,
    time,
  );
  return Object.freeze({
    stateSchemaId: ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID,
    schemaVersion: 2 as const,
    configuration: ownedConfiguration,
    initializedAcceptedTimeSec: time,
    initializedHistoryEventCount: historicalCount,
    revision: 0,
    acceptedTimeSec: time,
    cursor: historicalCount,
    acceptedEmittedImpulseCount: 0,
  });
}

/** Pure open-start/closed-end trial evaluation. */
export function evaluateAcceptedAuthoredEctopyScheduleTrialV2(
  acceptedState: AcceptedAuthoredEctopyScheduleStateV2,
  candidateTimeSec: number,
): AcceptedAuthoredEctopyScheduleTrialV2 {
  validateAcceptedAuthoredEctopyScheduleStateV2(acceptedState);
  const candidateTime = requireNonnegativeFinite(
    candidateTimeSec,
    "authored ectopy trial candidate time",
  );
  if (!(candidateTime > acceptedState.acceptedTimeSec)) {
    throw new Error(
      "authored ectopy trial candidate time must exceed accepted time",
    );
  }
  requireIncrementable(acceptedState.revision, "authored ectopy revision");
  const candidateCursor = upperBoundActivationTime(
    acceptedState.configuration.events,
    candidateTime,
  );
  const events = acceptedState.configuration.events.slice(
    acceptedState.cursor,
    candidateCursor,
  );
  const sourceImpulses = Object.freeze(events.map((event) =>
    sourceImpulseForEvent(acceptedState.configuration, event)));
  const metadataBySourceImpulseId = metadataIndexForEvents(
    acceptedState.configuration,
    events,
  );
  const acceptedEmittedImpulseCount = acceptedState.acceptedEmittedImpulseCount
    + sourceImpulses.length;
  if (!Number.isSafeInteger(acceptedEmittedImpulseCount)) {
    throw new Error("authored ectopy emitted impulse count is not safe");
  }
  const candidateState = Object.freeze({
    stateSchemaId: ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID,
    schemaVersion: 2 as const,
    configuration: acceptedState.configuration,
    initializedAcceptedTimeSec: acceptedState.initializedAcceptedTimeSec,
    initializedHistoryEventCount: acceptedState.initializedHistoryEventCount,
    revision: acceptedState.revision + 1,
    acceptedTimeSec: candidateTime,
    cursor: candidateCursor,
    acceptedEmittedImpulseCount,
  }) satisfies AcceptedAuthoredEctopyScheduleStateV2;

  return Object.freeze({
    trialSchemaId: ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_TRIAL_V2_ID,
    schemaVersion: 2 as const,
    configurationId: acceptedState.configuration.configurationId,
    ownerInstanceId: acceptedState.configuration.ownerInstanceId,
    scheduleId: acceptedState.configuration.scheduleId,
    baseRevision: acceptedState.revision,
    candidateRevision: acceptedState.revision + 1,
    baseCursor: acceptedState.cursor,
    candidateCursor,
    startTimeSec: acceptedState.acceptedTimeSec,
    candidateTimeSec: candidateTime,
    sourceImpulses,
    metadataBySourceImpulseId,
    candidateState,
  });
}

/** Exact deterministic recomputation from the accepted base. */
export function commitAcceptedAuthoredEctopyScheduleTrialV2(
  acceptedState: AcceptedAuthoredEctopyScheduleStateV2,
  trial: AcceptedAuthoredEctopyScheduleTrialV2,
): AcceptedAuthoredEctopyScheduleStateV2 {
  validateAcceptedAuthoredEctopyScheduleStateV2(acceptedState);
  validateTrialEnvelope(trial);
  const expected = evaluateAcceptedAuthoredEctopyScheduleTrialV2(
    acceptedState,
    trial.candidateTimeSec,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "authored ectopy trial does not match its accepted base",
    );
  }
  return expected.candidateState;
}

/** A rejected trial consumes nothing and returns the exact accepted identity. */
export function rollbackAcceptedAuthoredEctopyScheduleTrialV2(
  acceptedState: AcceptedAuthoredEctopyScheduleStateV2,
  trial: AcceptedAuthoredEctopyScheduleTrialV2,
): AcceptedAuthoredEctopyScheduleStateV2 {
  validateAcceptedAuthoredEctopyScheduleStateV2(acceptedState);
  validateTrialEnvelope(trial);
  const expected = evaluateAcceptedAuthoredEctopyScheduleTrialV2(
    acceptedState,
    trial.candidateTimeSec,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "authored ectopy trial does not match its accepted base",
    );
  }
  return acceptedState;
}

/**
 * Clips a requested step at the next unconsumed exact event time. All events
 * at that boundary remain in one complete batch when the clipped trial runs.
 */
export function maximumAcceptedAuthoredEctopyScheduleStepV2(
  acceptedState: AcceptedAuthoredEctopyScheduleStateV2,
  requestedStepSec: number,
): AcceptedAuthoredEctopyMaximumStepV2 {
  validateAcceptedAuthoredEctopyScheduleStateV2(acceptedState);
  const requestedStep = requirePositiveFinite(
    requestedStepSec,
    "authored ectopy requested step",
  );
  const requestedEndTimeSec = acceptedState.acceptedTimeSec + requestedStep;
  if (!Number.isFinite(requestedEndTimeSec)) {
    throw new Error("authored ectopy requested end time must remain finite");
  }
  const nextEvent = acceptedState.configuration.events[acceptedState.cursor]
    ?? null;
  if (nextEvent !== null && nextEvent.activationTimeSec <= requestedEndTimeSec) {
    const maximumStepSec = nextEvent.activationTimeSec
      - acceptedState.acceptedTimeSec;
    if (!(maximumStepSec > 0)) {
      throw new Error("next authored ectopy event must follow accepted time");
    }
    return Object.freeze({
      requestedStepSec: requestedStep,
      requestedEndTimeSec,
      maximumStepSec,
      candidateTimeSec: nextEvent.activationTimeSec,
      clippedByEvent: nextEvent.activationTimeSec < requestedEndTimeSec,
      boundaryActivationTimeSec: nextEvent.activationTimeSec,
      boundaryAuthoredEctopyId: nextEvent.authoredEctopyId,
      boundaryBatchEventCount: countEventsAtTime(
        acceptedState.configuration.events,
        acceptedState.cursor,
        nextEvent.activationTimeSec,
      ),
    });
  }
  return Object.freeze({
    requestedStepSec: requestedStep,
    requestedEndTimeSec,
    maximumStepSec: requestedStep,
    candidateTimeSec: requestedEndTimeSec,
    clippedByEvent: false,
    boundaryActivationTimeSec: null,
    boundaryAuthoredEctopyId: null,
    boundaryBatchEventCount: 0,
  });
}

export function validateAcceptedAuthoredEctopyScheduleStateV2(
  state: AcceptedAuthoredEctopyScheduleStateV2,
): void {
  const record = requirePlainRecord(state, "accepted authored ectopy state");
  requireExactKeys(record, STATE_KEYS, "accepted authored ectopy state");
  if (
    state.stateSchemaId !== ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID
    || state.schemaVersion !== 2
  ) {
    throw new Error("accepted authored ectopy state schema is invalid");
  }
  if (!Object.isFrozen(state)) {
    throw new Error("accepted authored ectopy state must be immutable");
  }
  validateAcceptedAuthoredEctopyScheduleConfigurationV2(state.configuration);
  const initializedTime = requireNonnegativeFinite(
    state.initializedAcceptedTimeSec,
    "authored ectopy initialized accepted time",
  );
  const acceptedTime = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "authored ectopy accepted time",
  );
  if (acceptedTime < initializedTime) {
    throw new Error("authored ectopy accepted time precedes initialization");
  }
  const initializedHistoryEventCount = requireNonnegativeSafeInteger(
    state.initializedHistoryEventCount,
    "authored ectopy initialized history count",
  );
  const revision = requireNonnegativeSafeInteger(
    state.revision,
    "authored ectopy revision",
  );
  const cursor = requireNonnegativeSafeInteger(
    state.cursor,
    "authored ectopy cursor",
  );
  const emittedCount = requireNonnegativeSafeInteger(
    state.acceptedEmittedImpulseCount,
    "authored ectopy emitted impulse count",
  );
  const expectedInitialHistory = upperBoundActivationTime(
    state.configuration.events,
    initializedTime,
  );
  const expectedCursor = upperBoundActivationTime(
    state.configuration.events,
    acceptedTime,
  );
  if (initializedHistoryEventCount !== expectedInitialHistory) {
    throw new Error(
      "authored ectopy initialized history count does not match initial time",
    );
  }
  if (cursor !== expectedCursor) {
    throw new Error("authored ectopy cursor does not match accepted time");
  }
  if (emittedCount !== cursor - initializedHistoryEventCount) {
    throw new Error("authored ectopy emitted count does not match cursor");
  }
  if (revision === 0 && acceptedTime !== initializedTime) {
    throw new Error("unadvanced authored ectopy state changed accepted time");
  }
  if (revision > 0 && !(acceptedTime > initializedTime)) {
    throw new Error("advanced authored ectopy state must advance accepted time");
  }
}

function copyEventInput(
  input: AuthoredEctopyEventInputV2,
  field: string,
): AuthoredEctopyEventV2 {
  const record = requirePlainRecord(input, field);
  const eventKind = requireEventKind(input.eventKind, `${field}.eventKind`);
  requireExactKeys(
    record,
    eventKind === "pac" ? PAC_INPUT_KEYS : PVC_INPUT_KEYS,
    field,
  );
  const common = {
    eventSchemaId: AUTHORED_ECTOPY_EVENT_V2_ID,
    schemaVersion: 2 as const,
    eventKind,
    authoredEctopyId: requireNonemptyString(
      input.authoredEctopyId,
      `${field}.authoredEctopyId`,
    ),
    sourceId: requireNonemptyString(input.sourceId, `${field}.sourceId`),
    sourceSequence: requireNonnegativeSafeInteger(
      input.sourceSequence,
      `${field}.sourceSequence`,
    ),
    activationTimeSec: normalizeFinite(
      input.activationTimeSec,
      `${field}.activationTimeSec`,
    ),
  };
  if (eventKind === "pac") {
    if (input.chamber !== "atrial") {
      throw new Error(`${field}.chamber must be atrial for PAC`);
    }
    return Object.freeze({
      ...common,
      eventKind: "pac" as const,
      chamber: "atrial" as const,
      sinusResetPolicy: requireSinusResetPolicy(
        input.sinusResetPolicy,
        `${field}.sinusResetPolicy`,
      ),
    });
  }
  if (input.chamber !== "ventricular") {
    throw new Error(`${field}.chamber must be ventricular for PVC`);
  }
  return Object.freeze({
    ...common,
    eventKind: "pvc" as const,
    chamber: "ventricular" as const,
  });
}

function eventToInput(
  event: AuthoredEctopyEventV2,
  field: string,
): AuthoredEctopyEventInputV2 {
  const record = requirePlainRecord(event, field);
  const eventKind = requireEventKind(event.eventKind, `${field}.eventKind`);
  requireExactKeys(
    record,
    eventKind === "pac" ? PAC_EVENT_KEYS : PVC_EVENT_KEYS,
    field,
  );
  if (
    event.eventSchemaId !== AUTHORED_ECTOPY_EVENT_V2_ID
    || event.schemaVersion !== 2
  ) {
    throw new Error(`${field} schema is invalid`);
  }
  if (event.eventKind === "pac") {
    return Object.freeze({
      eventKind: "pac",
      authoredEctopyId: event.authoredEctopyId,
      sourceId: event.sourceId,
      sourceSequence: event.sourceSequence,
      activationTimeSec: event.activationTimeSec,
      chamber: "atrial",
      sinusResetPolicy: event.sinusResetPolicy,
    });
  }
  return Object.freeze({
    eventKind: "pvc",
    authoredEctopyId: event.authoredEctopyId,
    sourceId: event.sourceId,
    sourceSequence: event.sourceSequence,
    activationTimeSec: event.activationTimeSec,
    chamber: "ventricular",
  });
}

function copyEvent(event: AuthoredEctopyEventV2): AuthoredEctopyEventV2 {
  return event.eventKind === "pac"
    ? Object.freeze({ ...event, sinusResetPolicy: event.sinusResetPolicy })
    : Object.freeze({ ...event });
}

function copyConfiguration(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
): AcceptedAuthoredEctopyScheduleConfigurationV2 {
  validateAcceptedAuthoredEctopyScheduleConfigurationV2(configuration);
  return createAcceptedAuthoredEctopyScheduleConfigurationV2({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    scheduleId: configuration.scheduleId,
    events: configuration.events.map((event, index) =>
      eventToInput(event, `authored ectopy events[${index}]`)),
  });
}

function sourceImpulseForEvent(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
  event: AuthoredEctopyEventV2,
): SourceImpulseV2 {
  return createSourceImpulseV2({
    sourceImpulseId: sourceImpulseIdForEvent(configuration, event),
    parentCapturedActivationId: null,
    chamber: event.chamber,
    sourceKind: "authored-ectopy",
    sourceId: event.sourceId,
    sourceSequence: event.sourceSequence,
    activationTimeSec: event.activationTimeSec,
  });
}

function sourceImpulseIdForEvent(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
  event: AuthoredEctopyEventV2,
): string {
  return framedId("authored-ectopy-source-impulse-v2", [
    configuration.configurationId,
    configuration.ownerInstanceId,
    configuration.scheduleId,
    event.authoredEctopyId,
  ]);
}

function metadataIndexForEvents(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
  events: readonly AuthoredEctopyEventV2[],
): Readonly<Record<string, AuthoredEctopySourceImpulseMetadataV2>> {
  const index: Record<string, AuthoredEctopySourceImpulseMetadataV2> =
    Object.create(null) as Record<
      string,
      AuthoredEctopySourceImpulseMetadataV2
    >;
  for (const event of events) {
    const sourceImpulseId = sourceImpulseIdForEvent(configuration, event);
    index[sourceImpulseId] = event.eventKind === "pac"
      ? Object.freeze({
        metadataSchemaId: AUTHORED_ECTOPY_SOURCE_IMPULSE_METADATA_V2_ID,
        schemaVersion: 2 as const,
        sourceImpulseId,
        eventKind: "pac" as const,
        authoredEctopyId: event.authoredEctopyId,
        chamber: "atrial" as const,
        sourceId: event.sourceId,
        sourceSequence: event.sourceSequence,
        activationTimeSec: event.activationTimeSec,
        sinusResetPolicy: event.sinusResetPolicy,
      })
      : Object.freeze({
        metadataSchemaId: AUTHORED_ECTOPY_SOURCE_IMPULSE_METADATA_V2_ID,
        schemaVersion: 2 as const,
        sourceImpulseId,
        eventKind: "pvc" as const,
        authoredEctopyId: event.authoredEctopyId,
        chamber: "ventricular" as const,
        sourceId: event.sourceId,
        sourceSequence: event.sourceSequence,
        activationTimeSec: event.activationTimeSec,
      });
  }
  return Object.freeze(index);
}

function validateTrialEnvelope(
  trial: AcceptedAuthoredEctopyScheduleTrialV2,
): void {
  const record = requirePlainRecord(trial, "authored ectopy trial");
  requireExactKeys(record, TRIAL_KEYS, "authored ectopy trial");
  canonicalJsonStringify(record);
  if (
    trial.trialSchemaId !== ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_TRIAL_V2_ID
    || trial.schemaVersion !== 2
  ) {
    throw new Error("authored ectopy trial schema is invalid");
  }
  requireNonnegativeFinite(trial.candidateTimeSec, "trial candidate time");
}

function upperBoundActivationTime(
  events: readonly AuthoredEctopyEventV2[],
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

function countEventsAtTime(
  events: readonly AuthoredEctopyEventV2[],
  firstIndex: number,
  timeSec: number,
): number {
  let index = firstIndex;
  while (index < events.length && events[index]!.activationTimeSec === timeSec) {
    index += 1;
  }
  return index - firstIndex;
}

function compareEventOrder(
  left: AuthoredEctopyEventV2,
  right: AuthoredEctopyEventV2,
): number {
  if (left.activationTimeSec !== right.activationTimeSec) {
    return left.activationTimeSec < right.activationTimeSec ? -1 : 1;
  }
  const sourceIdOrder = compareCodeUnit(left.sourceId, right.sourceId);
  if (sourceIdOrder !== 0) return sourceIdOrder;
  if (left.sourceSequence !== right.sourceSequence) {
    return left.sourceSequence < right.sourceSequence ? -1 : 1;
  }
  return compareCodeUnit(left.authoredEctopyId, right.authoredEctopyId);
}

function framedId(prefix: string, fields: readonly string[]): string {
  return `${prefix}:${fields.map((field) => `${field.length}:${field}`).join(":")}`;
}

function requireEventKind(value: unknown, field: string): "pac" | "pvc" {
  if (value !== "pac" && value !== "pvc") {
    throw new Error(`${field} must be pac or pvc`);
  }
  return value;
}

function requireSinusResetPolicy(
  value: unknown,
  field: string,
): PacSinusResetPolicyV2 {
  if (value !== "reset" && value !== "preserve") {
    throw new Error(`${field} must be reset or preserve`);
  }
  return value;
}

function normalizeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  return Object.is(finite, -0) ? 0 : finite;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (finite < 0) throw new Error(`${field} must be nonnegative`);
  return Object.is(finite, -0) ? 0 : finite;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (!(finite > 0)) throw new Error(`${field} must be positive`);
  return finite;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value < 0
  ) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function requireIncrementable(value: number, field: string): void {
  if (value === Number.MAX_SAFE_INTEGER) {
    throw new Error(`${field} cannot be incremented safely`);
  }
}

function requireNonemptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
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

function requirePlainRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${field} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  field: string,
): void {
  const actual = Object.keys(value).sort(compareCodeUnit);
  const required = [...expected].sort(compareCodeUnit);
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}

function compareCodeUnit(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
