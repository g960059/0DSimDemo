import {
  createSourceImpulseV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

/**
 * Accepted finite ventricular-pacing validation replay source.
 *
 * The caller authors every time and identity. This owner only replays typed
 * ventricular `pacing` source proposals; it does not label them PVCs, decide
 * capture, model a pacemaker, or embed a clinical recording.
 */

export const AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_V1_ID =
  "authored-ventricular-pacing-replay-event-v1" as const;
export const ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CONFIGURATION_V1_ID =
  "accepted-authored-ventricular-pacing-replay-source-configuration-v1" as const;
export const ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_IDENTITY_V1_ID =
  "accepted-authored-ventricular-pacing-replay-source-identity-v1" as const;
export const ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID =
  "accepted-authored-ventricular-pacing-replay-source-state-v1" as const;
export const ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_TRIAL_V1_ID =
  "accepted-authored-ventricular-pacing-replay-source-trial-v1" as const;
export const AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_IMPULSE_METADATA_V1_ID =
  "authored-ventricular-pacing-replay-source-impulse-metadata-v1" as const;

export const MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_COUNT_V1 =
  100_000 as const;
export const MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_IMPULSES_PER_TRIAL_V1 =
  4_096 as const;

export const ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1 =
  deepFreeze({
    scope:
      "finite-authored-ventricular-pacing-validation-replay-source" as const,
    validationReplayBackend: true as const,
    literatureContext:
      "Clark-et-al-1997-matched-mean-regular-versus-irregular-intervention" as const,
    literatureRole:
      "protocol-motivation-only-not-component-reproduction-or-validation" as const,
    patientDataBundled: false as const,
    authoredActivationTimes:
      "signed-finite-strictly-increasing-in-input-order" as const,
    authoredSourceSequences:
      "nonnegative-safe-integer-strictly-increasing-in-input-order" as const,
    acceptedOwnerTime: "nonnegative-finite" as const,
    initializationHistory:
      "events-at-or-before-initial-accepted-time-are-consumed-not-reemitted" as const,
    intervalConvention: "open-start-closed-end" as const,
    duplicateTimePolicy: "rejected-at-configuration-creation" as const,
    sameTimeBatching:
      "one-event-only-because-duplicate-activation-times-are-invalid" as const,
    sourceImpulseSchema: "source-impulse-v2" as const,
    emittedSourceKind: "pacing" as const,
    emittedChamber: "ventricular" as const,
    parentCapturedActivation: null,
    pvcLabelClaimed: false as const,
    matchedMeanEnforcedByOwner: false as const,
    clark1997ReproductionClaimed: false as const,
    pacemakerPhysiologyClaimed: false as const,
    sensingClaimed: false as const,
    captureClaimed: false as const,
    refractoryOrBlankingClaimed: false as const,
    pacingSiteOrPropagationClaimed: false as const,
    qrsOrEcgClaimed: false as const,
    hemodynamicEffectClaimed: false as const,
    clinicalValidityClaimed: false as const,
    hardFailureBounds: Object.freeze({
      configuredEventCount:
        MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_COUNT_V1,
      emittedImpulsesPerTrial:
        MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_IMPULSES_PER_TRIAL_V1,
    }),
    hardBoundsArePhysiologicalClaim: false as const,
    hardBoundExhaustion:
      "hard-error-without-truncation-or-source-substitution" as const,
    configurationIdentity:
      "sha-256-over-complete-canonical-replay-configuration" as const,
    acceptedStateImmutable: true as const,
    trialEvaluationPure: true as const,
    commitValidation: "exact-deterministic-recomputation" as const,
    rollbackReturnsAcceptedIdentity: true as const,
  });

export type AuthoredVentricularPacingReplayEventInputV1 = Readonly<{
  pacingEventId: string;
  sourceSequence: number;
  /** Signed finite absolute ventricular pacing time, in seconds. */
  activationTimeSec: number;
}>;

export type AuthoredVentricularPacingReplayEventV1 = Readonly<{
  eventSchemaId: typeof AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_V1_ID;
  schemaVersion: 1;
  pacingEventId: string;
  sourceSequence: number;
  activationTimeSec: number;
}>;

export type AcceptedAuthoredVentricularPacingReplaySourceConfigurationInputV1 =
  Readonly<{
    configurationId: string;
    ownerInstanceId: string;
    replayId: string;
    sourceId: string;
    events: readonly AuthoredVentricularPacingReplayEventInputV1[];
  }>;

export type AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1 =
  Readonly<{
    configurationSchemaId: typeof ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CONFIGURATION_V1_ID;
    schemaVersion: 1;
    configurationId: string;
    ownerInstanceId: string;
    replayId: string;
    sourceId: string;
    temporalSemantics: Readonly<{
      clock: "absolute-accepted-time";
      intervalConvention: "open-start-closed-end";
      duplicateActivationTimes: "rejected";
      translationInvariant: false;
    }>;
    eventCount: number;
    events: readonly AuthoredVentricularPacingReplayEventV1[];
  }>;

export type AcceptedAuthoredVentricularPacingReplaySourceIdentityV1 = Readonly<{
  identitySchemaId: typeof ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_IDENTITY_V1_ID;
  schemaVersion: 1;
  configurationSchemaId: typeof ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CONFIGURATION_V1_ID;
  configurationId: string;
  ownerInstanceId: string;
  replayId: string;
  sourceId: string;
  temporalSemantics: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1["temporalSemantics"];
  eventCount: number;
  events: readonly AuthoredVentricularPacingReplayEventV1[];
}>;

export type AuthoredVentricularPacingReplaySourceImpulseMetadataV1 = Readonly<{
  metadataSchemaId: typeof AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_IMPULSE_METADATA_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  replayId: string;
  sourceImpulseId: string;
  pacingEventId: string;
  chamber: "ventricular";
  sourceKind: "pacing";
  sourceId: string;
  sourceSequence: number;
  activationTimeSec: number;
}>;

export type AcceptedAuthoredVentricularPacingReplaySourceStateV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID;
  schemaVersion: 1;
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1;
  initializedAcceptedTimeSec: number;
  initializedHistoryEventCount: number;
  revision: number;
  acceptedTimeSec: number;
  /** Number of configured events at or before acceptedTimeSec. */
  cursor: number;
  /** Events emitted by committed trials; initialization history is excluded. */
  acceptedEmittedImpulseCount: number;
}>;

export type AcceptedAuthoredVentricularPacingReplaySourceTrialV1 = Readonly<{
  trialSchemaId: typeof ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_TRIAL_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  replayId: string;
  sourceId: string;
  baseRevision: number;
  candidateRevision: number;
  baseCursor: number;
  candidateCursor: number;
  startTimeSec: number;
  candidateTimeSec: number;
  /** Complete source slice for (startTimeSec, candidateTimeSec]. */
  sourceImpulses: readonly SourceImpulseV2[];
  metadataBySourceImpulseId: Readonly<
    Record<string, AuthoredVentricularPacingReplaySourceImpulseMetadataV1>
  >;
  candidateState: AcceptedAuthoredVentricularPacingReplaySourceStateV1;
}>;

export type AcceptedAuthoredVentricularPacingReplaySourceMaximumStepV1 =
  Readonly<{
    requestedStepSec: number;
    requestedEndTimeSec: number;
    maximumStepSec: number;
    candidateTimeSec: number;
    clippedByEvent: boolean;
    boundaryActivationTimeSec: number | null;
    boundaryPacingEventId: string | null;
    /** Always one at a boundary because duplicate times are rejected. */
    boundaryBatchEventCount: 0 | 1;
  }>;

const TEMPORAL_SEMANTICS = deepFreeze({
  clock: "absolute-accepted-time" as const,
  intervalConvention: "open-start-closed-end" as const,
  duplicateActivationTimes: "rejected" as const,
  translationInvariant: false as const,
});

const CONFIGURATION_INPUT_KEYS = Object.freeze([
  "configurationId",
  "ownerInstanceId",
  "replayId",
  "sourceId",
  "events",
] as const);
const CONFIGURATION_KEYS = Object.freeze([
  "configurationSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "replayId",
  "sourceId",
  "temporalSemantics",
  "eventCount",
  "events",
] as const);
const TEMPORAL_SEMANTICS_KEYS = Object.freeze([
  "clock",
  "intervalConvention",
  "duplicateActivationTimes",
  "translationInvariant",
] as const);
const EVENT_INPUT_KEYS = Object.freeze([
  "pacingEventId",
  "sourceSequence",
  "activationTimeSec",
] as const);
const EVENT_KEYS = Object.freeze([
  "eventSchemaId",
  "schemaVersion",
  ...EVENT_INPUT_KEYS,
] as const);
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
  "replayId",
  "sourceId",
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

export function createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1(
  input: AcceptedAuthoredVentricularPacingReplaySourceConfigurationInputV1,
): AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1 {
  canonicalJsonStringify(input);
  const record = requirePlainRecord(
    input,
    "authored ventricular pacing replay configuration input",
  );
  requireExactKeys(
    record,
    CONFIGURATION_INPUT_KEYS,
    "authored ventricular pacing replay configuration input",
  );
  validateDenseArray(
    input.events,
    "authored ventricular pacing replay configuration input.events",
  );
  if (
    input.events.length > MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_COUNT_V1
  ) {
    throw new Error(
      `authored ventricular pacing replay exceeds hard configured-event bound ${MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_COUNT_V1}`,
    );
  }

  const eventIds = new Set<string>();
  let previousActivationTimeSec: number | null = null;
  let previousSourceSequence: number | null = null;
  const events = input.events.map((event, index) => {
    const copied = copyEventInput(
      event,
      `authored ventricular pacing replay events[${index}]`,
    );
    if (eventIds.has(copied.pacingEventId)) {
      throw new Error(
        `authored ventricular pacing replay contains duplicate pacingEventId: ${copied.pacingEventId}`,
      );
    }
    eventIds.add(copied.pacingEventId);
    if (
      previousActivationTimeSec !== null &&
      !(copied.activationTimeSec > previousActivationTimeSec)
    ) {
      throw new Error(
        "authored ventricular pacing replay activation times must be strictly increasing; duplicate times are invalid",
      );
    }
    if (
      previousSourceSequence !== null &&
      !(copied.sourceSequence > previousSourceSequence)
    ) {
      throw new Error(
        "authored ventricular pacing replay source sequences must be strictly increasing",
      );
    }
    previousActivationTimeSec = copied.activationTimeSec;
    previousSourceSequence = copied.sourceSequence;
    return copied;
  });

  const configuration = deepFreeze({
    configurationSchemaId:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CONFIGURATION_V1_ID,
    schemaVersion: 1 as const,
    configurationId: requireNonemptyString(
      input.configurationId,
      "authored ventricular pacing replay configurationId",
    ),
    ownerInstanceId: requireNonemptyString(
      input.ownerInstanceId,
      "authored ventricular pacing replay ownerInstanceId",
    ),
    replayId: requireNonemptyString(
      input.replayId,
      "authored ventricular pacing replay replayId",
    ),
    sourceId: requireNonemptyString(
      input.sourceId,
      "authored ventricular pacing replay sourceId",
    ),
    temporalSemantics: TEMPORAL_SEMANTICS,
    eventCount: events.length,
    events,
  }) satisfies AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1;
  canonicalJsonStringify(configuration);
  VERIFIED_CONFIGURATIONS.add(configuration);
  return configuration;
}

export function validateAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
): void {
  const record = requirePlainRecord(
    configuration,
    "accepted authored ventricular pacing replay configuration",
  );
  requireExactKeys(
    record,
    CONFIGURATION_KEYS,
    "accepted authored ventricular pacing replay configuration",
  );
  canonicalJsonStringify(record);
  if (
    configuration.configurationSchemaId !==
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CONFIGURATION_V1_ID ||
    configuration.schemaVersion !== 1
  ) {
    throw new Error(
      "accepted authored ventricular pacing replay configuration schema is invalid",
    );
  }
  requireNonemptyString(configuration.configurationId, "configuration id");
  requireNonemptyString(configuration.ownerInstanceId, "owner instance id");
  requireNonemptyString(configuration.replayId, "replay id");
  requireNonemptyString(configuration.sourceId, "source id");
  const temporal = requirePlainRecord(
    configuration.temporalSemantics,
    "authored ventricular pacing replay temporal semantics",
  );
  requireExactKeys(
    temporal,
    TEMPORAL_SEMANTICS_KEYS,
    "authored ventricular pacing replay temporal semantics",
  );
  if (
    configuration.temporalSemantics.clock !== "absolute-accepted-time" ||
    configuration.temporalSemantics.intervalConvention !==
      "open-start-closed-end" ||
    configuration.temporalSemantics.duplicateActivationTimes !== "rejected" ||
    configuration.temporalSemantics.translationInvariant !== false
  ) {
    throw new Error(
      "authored ventricular pacing replay temporal semantics are invalid",
    );
  }
  if (
    !Object.isFrozen(configuration) ||
    !Object.isFrozen(configuration.temporalSemantics) ||
    !Object.isFrozen(configuration.events)
  ) {
    throw new Error(
      "accepted authored ventricular pacing replay configuration must be immutable",
    );
  }
  validateDenseArray(
    configuration.events,
    "accepted authored ventricular pacing replay events",
  );
  const eventCount = requireNonnegativeSafeInteger(
    configuration.eventCount,
    "authored ventricular pacing replay event count",
  );
  if (
    eventCount !== configuration.events.length ||
    eventCount > MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_COUNT_V1
  ) {
    throw new Error(
      "authored ventricular pacing replay event count does not match its bounded events",
    );
  }
  if (VERIFIED_CONFIGURATIONS.has(configuration)) return;

  const rebuilt =
    createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1({
      configurationId: configuration.configurationId,
      ownerInstanceId: configuration.ownerInstanceId,
      replayId: configuration.replayId,
      sourceId: configuration.sourceId,
      events: configuration.events.map((event, index) =>
        eventToInput(
          event,
          `accepted authored ventricular pacing replay events[${index}]`,
        ),
      ),
    });
  if (
    canonicalJsonStringify(configuration) !== canonicalJsonStringify(rebuilt)
  ) {
    throw new Error(
      "authored ventricular pacing replay configuration does not match canonical full content",
    );
  }
  if (configuration.events.some((event) => !Object.isFrozen(event))) {
    throw new Error(
      "accepted authored ventricular pacing replay events must be immutable",
    );
  }
  VERIFIED_CONFIGURATIONS.add(configuration);
}

export function canonicalAcceptedAuthoredVentricularPacingReplaySourceIdentityV1(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
): AcceptedAuthoredVentricularPacingReplaySourceIdentityV1 {
  validateAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1(
    configuration,
  );
  return deepFreeze({
    identitySchemaId:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_IDENTITY_V1_ID,
    schemaVersion: 1 as const,
    configurationSchemaId:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CONFIGURATION_V1_ID,
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    replayId: configuration.replayId,
    sourceId: configuration.sourceId,
    temporalSemantics: { ...configuration.temporalSemantics },
    eventCount: configuration.eventCount,
    events: configuration.events.map((event) => Object.freeze({ ...event })),
  });
}

export function canonicalAcceptedAuthoredVentricularPacingReplaySourceJsonV1(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
): string {
  return canonicalJsonStringify(
    canonicalAcceptedAuthoredVentricularPacingReplaySourceIdentityV1(
      configuration,
    ),
  );
}

export async function sha256AcceptedAuthoredVentricularPacingReplaySourceIdentityV1(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
): Promise<string> {
  return sha256CanonicalJsonHex(
    canonicalAcceptedAuthoredVentricularPacingReplaySourceIdentityV1(
      configuration,
    ),
  );
}

export function initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  acceptedTimeSec = 0,
): AcceptedAuthoredVentricularPacingReplaySourceStateV1 {
  const ownedConfiguration = copyConfiguration(configuration);
  const time = requireNonnegativeFinite(
    acceptedTimeSec,
    "authored ventricular pacing replay initial accepted time",
  );
  const historicalCount = upperBoundActivationTime(
    ownedConfiguration.events,
    time,
  );
  return Object.freeze({
    stateSchemaId:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID,
    schemaVersion: 1 as const,
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
export function evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
  acceptedState: AcceptedAuthoredVentricularPacingReplaySourceStateV1,
  candidateTimeSec: number,
): AcceptedAuthoredVentricularPacingReplaySourceTrialV1 {
  validateAcceptedAuthoredVentricularPacingReplaySourceStateV1(acceptedState);
  const candidateTime = requireNonnegativeFinite(
    candidateTimeSec,
    "authored ventricular pacing replay trial candidate time",
  );
  if (!(candidateTime > acceptedState.acceptedTimeSec)) {
    throw new Error(
      "authored ventricular pacing replay candidate time must exceed accepted time",
    );
  }
  requireIncrementable(
    acceptedState.revision,
    "authored ventricular pacing replay revision",
  );
  const candidateCursor = upperBoundActivationTime(
    acceptedState.configuration.events,
    candidateTime,
  );
  const dueEventCount = candidateCursor - acceptedState.cursor;
  if (
    dueEventCount > MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_IMPULSES_PER_TRIAL_V1
  ) {
    throw new Error(
      `authored ventricular pacing replay exceeds hard per-trial impulse bound ${MAX_AUTHORED_VENTRICULAR_PACING_REPLAY_IMPULSES_PER_TRIAL_V1}; retry with a shorter accepted step`,
    );
  }
  const events = acceptedState.configuration.events.slice(
    acceptedState.cursor,
    candidateCursor,
  );
  const sourceImpulses = Object.freeze(
    events.map((event) =>
      sourceImpulseForEvent(acceptedState.configuration, event),
    ),
  );
  const metadataBySourceImpulseId = metadataIndexForEvents(
    acceptedState.configuration,
    events,
  );
  const acceptedEmittedImpulseCount = safeAdd(
    acceptedState.acceptedEmittedImpulseCount,
    sourceImpulses.length,
    "authored ventricular pacing replay emitted impulse count",
  );
  const candidateRevision = safeAdd(
    acceptedState.revision,
    1,
    "authored ventricular pacing replay revision",
  );
  const candidateState = Object.freeze({
    stateSchemaId:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: acceptedState.configuration,
    initializedAcceptedTimeSec: acceptedState.initializedAcceptedTimeSec,
    initializedHistoryEventCount: acceptedState.initializedHistoryEventCount,
    revision: candidateRevision,
    acceptedTimeSec: candidateTime,
    cursor: candidateCursor,
    acceptedEmittedImpulseCount,
  }) satisfies AcceptedAuthoredVentricularPacingReplaySourceStateV1;

  return Object.freeze({
    trialSchemaId:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_TRIAL_V1_ID,
    schemaVersion: 1 as const,
    configurationId: acceptedState.configuration.configurationId,
    ownerInstanceId: acceptedState.configuration.ownerInstanceId,
    replayId: acceptedState.configuration.replayId,
    sourceId: acceptedState.configuration.sourceId,
    baseRevision: acceptedState.revision,
    candidateRevision,
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
export function commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
  acceptedState: AcceptedAuthoredVentricularPacingReplaySourceStateV1,
  trial: AcceptedAuthoredVentricularPacingReplaySourceTrialV1,
): AcceptedAuthoredVentricularPacingReplaySourceStateV1 {
  validateAcceptedAuthoredVentricularPacingReplaySourceStateV1(acceptedState);
  validateTrialEnvelope(trial);
  const expected = evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
    acceptedState,
    trial.candidateTimeSec,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "authored ventricular pacing replay trial does not match its accepted base",
    );
  }
  return expected.candidateState;
}

/** A rejected trial consumes nothing and returns the exact accepted identity. */
export function rollbackAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
  acceptedState: AcceptedAuthoredVentricularPacingReplaySourceStateV1,
  trial: AcceptedAuthoredVentricularPacingReplaySourceTrialV1,
): AcceptedAuthoredVentricularPacingReplaySourceStateV1 {
  validateAcceptedAuthoredVentricularPacingReplaySourceStateV1(acceptedState);
  validateTrialEnvelope(trial);
  const expected = evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
    acceptedState,
    trial.candidateTimeSec,
  );
  if (canonicalJsonStringify(trial) !== canonicalJsonStringify(expected)) {
    throw new Error(
      "authored ventricular pacing replay trial does not match its accepted base",
    );
  }
  return acceptedState;
}

/** Clips a requested step at the next unconsumed authored pacing event. */
export function maximumAcceptedAuthoredVentricularPacingReplaySourceStepV1(
  acceptedState: AcceptedAuthoredVentricularPacingReplaySourceStateV1,
  requestedStepSec: number,
): AcceptedAuthoredVentricularPacingReplaySourceMaximumStepV1 {
  validateAcceptedAuthoredVentricularPacingReplaySourceStateV1(acceptedState);
  const requestedStep = requirePositiveFinite(
    requestedStepSec,
    "authored ventricular pacing replay requested step",
  );
  const requestedEndTimeSec = acceptedState.acceptedTimeSec + requestedStep;
  if (!Number.isFinite(requestedEndTimeSec)) {
    throw new Error(
      "authored ventricular pacing replay requested end time must remain finite",
    );
  }
  const nextEvent =
    acceptedState.configuration.events[acceptedState.cursor] ?? null;
  if (
    nextEvent !== null &&
    nextEvent.activationTimeSec <= requestedEndTimeSec
  ) {
    const maximumStepSec =
      nextEvent.activationTimeSec - acceptedState.acceptedTimeSec;
    if (!(maximumStepSec > 0)) {
      throw new Error(
        "next authored ventricular pacing event must follow accepted time",
      );
    }
    return Object.freeze({
      requestedStepSec: requestedStep,
      requestedEndTimeSec,
      maximumStepSec,
      candidateTimeSec: nextEvent.activationTimeSec,
      clippedByEvent: nextEvent.activationTimeSec < requestedEndTimeSec,
      boundaryActivationTimeSec: nextEvent.activationTimeSec,
      boundaryPacingEventId: nextEvent.pacingEventId,
      boundaryBatchEventCount: 1 as const,
    });
  }
  return Object.freeze({
    requestedStepSec: requestedStep,
    requestedEndTimeSec,
    maximumStepSec: requestedStep,
    candidateTimeSec: requestedEndTimeSec,
    clippedByEvent: false,
    boundaryActivationTimeSec: null,
    boundaryPacingEventId: null,
    boundaryBatchEventCount: 0 as const,
  });
}

export function validateAcceptedAuthoredVentricularPacingReplaySourceStateV1(
  state: AcceptedAuthoredVentricularPacingReplaySourceStateV1,
): void {
  const record = requirePlainRecord(
    state,
    "accepted authored ventricular pacing replay state",
  );
  requireExactKeys(
    record,
    STATE_KEYS,
    "accepted authored ventricular pacing replay state",
  );
  if (
    state.stateSchemaId !==
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID ||
    state.schemaVersion !== 1
  ) {
    throw new Error(
      "accepted authored ventricular pacing replay state schema is invalid",
    );
  }
  if (!Object.isFrozen(state)) {
    throw new Error(
      "accepted authored ventricular pacing replay state must be immutable",
    );
  }
  validateAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1(
    state.configuration,
  );
  const initializedTime = requireNonnegativeFinite(
    state.initializedAcceptedTimeSec,
    "authored ventricular pacing replay initialized time",
  );
  const acceptedTime = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "authored ventricular pacing replay accepted time",
  );
  if (acceptedTime < initializedTime) {
    throw new Error(
      "authored ventricular pacing replay accepted time precedes initialization",
    );
  }
  const initializedHistoryEventCount = requireNonnegativeSafeInteger(
    state.initializedHistoryEventCount,
    "authored ventricular pacing replay initialized history count",
  );
  const revision = requireNonnegativeSafeInteger(
    state.revision,
    "authored ventricular pacing replay revision",
  );
  const cursor = requireNonnegativeSafeInteger(
    state.cursor,
    "authored ventricular pacing replay cursor",
  );
  const emittedCount = requireNonnegativeSafeInteger(
    state.acceptedEmittedImpulseCount,
    "authored ventricular pacing replay emitted count",
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
      "authored ventricular pacing replay initialized history count does not match initial time",
    );
  }
  if (cursor !== expectedCursor) {
    throw new Error(
      "authored ventricular pacing replay cursor does not match accepted time",
    );
  }
  if (emittedCount !== cursor - initializedHistoryEventCount) {
    throw new Error(
      "authored ventricular pacing replay emitted count does not match cursor",
    );
  }
  if (revision === 0 && acceptedTime !== initializedTime) {
    throw new Error(
      "unadvanced authored ventricular pacing replay state changed accepted time",
    );
  }
  if (revision > 0 && !(acceptedTime > initializedTime)) {
    throw new Error(
      "advanced authored ventricular pacing replay state must advance accepted time",
    );
  }
}

function copyEventInput(
  input: AuthoredVentricularPacingReplayEventInputV1,
  field: string,
): AuthoredVentricularPacingReplayEventV1 {
  const record = requirePlainRecord(input, field);
  requireExactKeys(record, EVENT_INPUT_KEYS, field);
  return Object.freeze({
    eventSchemaId: AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_V1_ID,
    schemaVersion: 1 as const,
    pacingEventId: requireNonemptyString(
      input.pacingEventId,
      `${field}.pacingEventId`,
    ),
    sourceSequence: requireNonnegativeSafeInteger(
      input.sourceSequence,
      `${field}.sourceSequence`,
    ),
    activationTimeSec: normalizeFinite(
      input.activationTimeSec,
      `${field}.activationTimeSec`,
    ),
  });
}

function eventToInput(
  event: AuthoredVentricularPacingReplayEventV1,
  field: string,
): AuthoredVentricularPacingReplayEventInputV1 {
  const record = requirePlainRecord(event, field);
  requireExactKeys(record, EVENT_KEYS, field);
  if (
    event.eventSchemaId !== AUTHORED_VENTRICULAR_PACING_REPLAY_EVENT_V1_ID ||
    event.schemaVersion !== 1
  ) {
    throw new Error(`${field} schema is invalid`);
  }
  return Object.freeze({
    pacingEventId: event.pacingEventId,
    sourceSequence: event.sourceSequence,
    activationTimeSec: event.activationTimeSec,
  });
}

function copyConfiguration(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
): AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1 {
  validateAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1(
    configuration,
  );
  return createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    replayId: configuration.replayId,
    sourceId: configuration.sourceId,
    events: configuration.events.map((event, index) =>
      eventToInput(
        event,
        `accepted authored ventricular pacing replay events[${index}]`,
      ),
    ),
  });
}

function sourceImpulseForEvent(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  event: AuthoredVentricularPacingReplayEventV1,
): SourceImpulseV2 {
  return createSourceImpulseV2({
    sourceImpulseId: sourceImpulseIdForEvent(configuration, event),
    parentCapturedActivationId: null,
    chamber: "ventricular",
    sourceKind: "pacing",
    sourceId: configuration.sourceId,
    sourceSequence: event.sourceSequence,
    activationTimeSec: event.activationTimeSec,
  });
}

function sourceImpulseIdForEvent(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  event: AuthoredVentricularPacingReplayEventV1,
): string {
  return framedId("authored-ventricular-pacing-replay-source-impulse-v1", [
    configuration.configurationId,
    configuration.ownerInstanceId,
    configuration.replayId,
    configuration.sourceId,
    event.pacingEventId,
    String(event.sourceSequence),
    String(event.activationTimeSec),
  ]);
}

function metadataIndexForEvents(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  events: readonly AuthoredVentricularPacingReplayEventV1[],
): Readonly<
  Record<string, AuthoredVentricularPacingReplaySourceImpulseMetadataV1>
> {
  const index: Record<
    string,
    AuthoredVentricularPacingReplaySourceImpulseMetadataV1
  > = Object.create(null) as Record<
    string,
    AuthoredVentricularPacingReplaySourceImpulseMetadataV1
  >;
  for (const event of events) {
    const sourceImpulseId = sourceImpulseIdForEvent(configuration, event);
    index[sourceImpulseId] = Object.freeze({
      metadataSchemaId:
        AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_IMPULSE_METADATA_V1_ID,
      schemaVersion: 1 as const,
      configurationId: configuration.configurationId,
      ownerInstanceId: configuration.ownerInstanceId,
      replayId: configuration.replayId,
      sourceImpulseId,
      pacingEventId: event.pacingEventId,
      chamber: "ventricular" as const,
      sourceKind: "pacing" as const,
      sourceId: configuration.sourceId,
      sourceSequence: event.sourceSequence,
      activationTimeSec: event.activationTimeSec,
    });
  }
  return Object.freeze(index);
}

function validateTrialEnvelope(
  trial: AcceptedAuthoredVentricularPacingReplaySourceTrialV1,
): void {
  const record = requirePlainRecord(
    trial,
    "authored ventricular pacing replay trial",
  );
  requireExactKeys(
    record,
    TRIAL_KEYS,
    "authored ventricular pacing replay trial",
  );
  canonicalJsonStringify(record);
  if (
    trial.trialSchemaId !==
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_TRIAL_V1_ID ||
    trial.schemaVersion !== 1
  ) {
    throw new Error(
      "authored ventricular pacing replay trial schema is invalid",
    );
  }
  requireNonnegativeFinite(
    trial.candidateTimeSec,
    "authored ventricular pacing replay trial candidate time",
  );
}

function upperBoundActivationTime(
  events: readonly AuthoredVentricularPacingReplayEventV1[],
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

function framedId(prefix: string, fields: readonly string[]): string {
  return `${prefix}:${fields.map((field) => `${field.length}:${field}`).join(":")}`;
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
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function requireIncrementable(value: number, field: string): void {
  if (value === Number.MAX_SAFE_INTEGER) {
    throw new Error(`${field} cannot be incremented safely`);
  }
}

function safeAdd(left: number, right: number, field: string): number {
  const result = left + right;
  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error(`${field} cannot be incremented safely`);
  }
  return result;
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

function requirePlainRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
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
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
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
