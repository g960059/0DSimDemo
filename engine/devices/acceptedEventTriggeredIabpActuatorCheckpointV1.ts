import {
  ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1,
  ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID,
  createAcceptedEventTriggeredIabpActuatorConfigurationV1,
  validateAcceptedEventTriggeredIabpActuatorConfigurationV1,
  validateAcceptedEventTriggeredIabpActuatorStateV1,
  type AcceptedEventTriggeredIabpActuatorConfigurationV1,
  type AcceptedEventTriggeredIabpActuatorStateV1,
} from "@/engine/devices/acceptedEventTriggeredIabpActuatorOwnerV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_V1_ID =
  "circleheart.accepted-event-triggered-iabp-actuator-checkpoint.v1" as const;

/**
 * Exact replay checkpoint for the standalone actuator owner. The unkeyed
 * digest detects content changes; it is not an authentication mechanism.
 */
export const ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_CLAIM_V1 =
  deepFreeze({
    exactResumeScope:
      "complete-explicit-configuration-accepted-clock-revision-capture-closure-count-and-transition-memory" as const,
    fullConfigurationStored: true as const,
    completeAcceptedStateStored: true as const,
    duplicatedClockRevisionAndLineageCrossChecked: true as const,
    integrity:
      "sha-256-over-complete-canonical-json-payload-for-change-detection" as const,
    authenticationClaimed: false as const,
    expectedConfigurationRequirement:
      "exact-complete-canonical-content-match-not-id-only" as const,
    restoreResult: "detached-recursively-immutable-accepted-state" as const,
    migrationClaimed: false as const,
    clockRebaseClaimed: false as const,
    standaloneActuatorSemantics:
      ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1,
  });

export type AcceptedEventTriggeredIabpActuatorCheckpointPayloadV1 = Readonly<{
  checkpointId:
    typeof ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  stateSchemaId: typeof ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID;
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1;
  acceptedState: AcceptedEventTriggeredIabpActuatorStateV1;
  /** Duplicated intentionally and cross-checked against acceptedState. */
  revision: number;
  /** Duplicated intentionally and cross-checked against acceptedState. */
  acceptedTimeSec: number;
  /** Duplicated intentionally and cross-checked against acceptedState. */
  acceptedVentricularActivationCount: number;
  /** Duplicated intentionally and cross-checked against acceptedState. */
  currentCapturedVentricularActivationId: string | null;
  /** Duplicated intentionally and cross-checked against acceptedState. */
  lastAcceptedAorticValveClosureEventId: string | null;
  /** Duplicated intentionally and cross-checked against acceptedState. */
  transitionId: string;
  exactResumeClaim:
    typeof ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_CLAIM_V1;
}>;

export type AcceptedEventTriggeredIabpActuatorCheckpointV1 =
  AcceptedEventTriggeredIabpActuatorCheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

const CHECKPOINT_PAYLOAD_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "stateSchemaId",
  "configuration",
  "acceptedState",
  "revision",
  "acceptedTimeSec",
  "acceptedVentricularActivationCount",
  "currentCapturedVentricularActivationId",
  "lastAcceptedAorticValveClosureEventId",
  "transitionId",
  "exactResumeClaim",
] as const);

const CHECKPOINT_KEYS = Object.freeze([
  ...CHECKPOINT_PAYLOAD_KEYS,
  "checkpointSha256",
] as const);

export async function checkpointAcceptedEventTriggeredIabpActuatorStateV1(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
): Promise<AcceptedEventTriggeredIabpActuatorCheckpointV1> {
  validateAcceptedEventTriggeredIabpActuatorStateV1(state);
  const payload = deepFreeze({
    checkpointId:
      ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    stateSchemaId: ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID,
    configuration: state.configuration,
    acceptedState: state,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    acceptedVentricularActivationCount:
      state.acceptedVentricularActivationCount,
    currentCapturedVentricularActivationId:
      state.currentCapturedVentricularActivation?.capturedActivationId ?? null,
    lastAcceptedAorticValveClosureEventId:
      state.lastAcceptedAorticValveClosure?.closureEventId ?? null,
    transitionId: state.transitionMemory.transitionId,
    exactResumeClaim:
      ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_CLAIM_V1,
  }) satisfies AcceptedEventTriggeredIabpActuatorCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, clock rebasing, or ID-only matching. */
export async function restoreAcceptedEventTriggeredIabpActuatorStateV1(
  input: unknown,
  expectedConfiguration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
): Promise<AcceptedEventTriggeredIabpActuatorStateV1> {
  const expected = validatedDetachedConfiguration(expectedConfiguration);
  const checkpointRecord = requirePlainRecord(
    input,
    "event-triggered IABP checkpoint",
  );
  requireExactKeys(
    checkpointRecord,
    CHECKPOINT_KEYS,
    "event-triggered IABP checkpoint",
  );
  canonicalJsonStringify(checkpointRecord);
  assertCheckpointEnvelope(checkpointRecord);

  const checkpoint = checkpointRecord as unknown as
    AcceptedEventTriggeredIabpActuatorCheckpointV1;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("event-triggered IABP checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(
        ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_CLAIM_V1,
      )
  ) {
    throw new Error("event-triggered IABP checkpoint claim mismatch");
  }

  const restored = detachedFrozenCopy<
    AcceptedEventTriggeredIabpActuatorStateV1
  >(checkpoint.acceptedState);
  validateAcceptedEventTriggeredIabpActuatorStateV1(restored);
  const storedConfiguration = detachedFrozenCopy<
    AcceptedEventTriggeredIabpActuatorConfigurationV1
  >(checkpoint.configuration);
  const storedConfigurationJson = canonicalJsonStringify(storedConfiguration);
  if (
    storedConfigurationJson
      !== canonicalJsonStringify(restored.configuration)
  ) {
    throw new Error(
      "event-triggered IABP checkpoint configuration and accepted state split",
    );
  }
  if (storedConfigurationJson !== canonicalJsonStringify(expected)) {
    throw new Error(
      "event-triggered IABP checkpoint expected configuration mismatch",
    );
  }

  const currentActivationId =
    restored.currentCapturedVentricularActivation?.capturedActivationId
      ?? null;
  const lastClosureEventId =
    restored.lastAcceptedAorticValveClosure?.closureEventId ?? null;
  if (
    checkpoint.revision !== restored.revision
    || checkpoint.acceptedTimeSec !== restored.acceptedTimeSec
    || checkpoint.acceptedVentricularActivationCount
      !== restored.acceptedVentricularActivationCount
    || checkpoint.currentCapturedVentricularActivationId
      !== currentActivationId
    || checkpoint.lastAcceptedAorticValveClosureEventId
      !== lastClosureEventId
    || checkpoint.transitionId !== restored.transitionMemory.transitionId
  ) {
    throw new Error(
      "event-triggered IABP checkpoint outer and accepted state lineage split",
    );
  }

  const result = detachedFrozenCopy<
    AcceptedEventTriggeredIabpActuatorStateV1
  >(restored);
  validateAcceptedEventTriggeredIabpActuatorStateV1(result);
  return result;
}

function validatedDetachedConfiguration(
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
): AcceptedEventTriggeredIabpActuatorConfigurationV1 {
  const detached = detachedFrozenCopy<
    AcceptedEventTriggeredIabpActuatorConfigurationV1
  >(configuration);
  validateAcceptedEventTriggeredIabpActuatorConfigurationV1(detached);
  return createAcceptedEventTriggeredIabpActuatorConfigurationV1({
    configurationId: detached.configurationId,
    ownerInstanceId: detached.ownerInstanceId,
    assistRatio: detached.assistRatio,
    balloonVolumeMl: detached.balloonVolumeMl,
    inflationTransitionDurationSec:
      detached.inflationTransitionDurationSec,
    deflationTransitionDurationSec:
      detached.deflationTransitionDurationSec,
    placementNode: detached.placementNode,
  });
}

function assertCheckpointEnvelope(checkpoint: Record<string, unknown>): void {
  if (
    checkpoint.checkpointId
      !== ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_V1_ID
    || checkpoint.schemaVersion !== 1
    || checkpoint.stateSchemaId
      !== ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_STATE_V1_ID
  ) {
    throw new Error("unsupported event-triggered IABP checkpoint schema");
  }
  if (
    typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)
  ) {
    throw new Error("event-triggered IABP checkpoint SHA-256 is invalid");
  }
}

function detachedFrozenCopy<T>(input: unknown): T {
  return deepFreeze(JSON.parse(canonicalJsonStringify(input)) as T);
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
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length
    || actual.some((key, index) => key !== wanted[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}
