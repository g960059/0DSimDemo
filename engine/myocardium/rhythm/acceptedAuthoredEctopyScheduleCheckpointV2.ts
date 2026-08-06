import {
  ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2,
  ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID,
  validateAcceptedAuthoredEctopyScheduleConfigurationV2,
  validateAcceptedAuthoredEctopyScheduleStateV2,
  type AcceptedAuthoredEctopyScheduleConfigurationV2,
  type AcceptedAuthoredEctopyScheduleStateV2,
} from "@/engine/myocardium/rhythm/acceptedAuthoredEctopyScheduleV2";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_V2_ID =
  "circleheart.accepted-authored-ectopy-schedule-checkpoint.v2" as const;

/**
 * The unkeyed digest detects content changes. It is not authentication: a
 * party able to replace the payload can also compute a replacement digest.
 */
export const ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_CLAIM_V2 = deepFreeze({
  exactResumeScope:
    "complete-authored-ectopy-schedule-configuration-clock-cursor-history-and-counters" as const,
  fullConfigurationStored: true as const,
  completeAcceptedStateStored: true as const,
  outerClockRevisionAndCursorCrossCheckedAgainstAcceptedState: true as const,
  integrity:
    "sha-256-over-complete-canonical-json-payload-for-change-detection" as const,
  authenticationClaimed: false as const,
  expectedConfigurationRequirement:
    "exact-complete-canonical-content-match-not-id-only" as const,
  restoreResult: "detached-recursively-immutable-accepted-state" as const,
  migrationClaimed: false as const,
  clockRebaseClaimed: false as const,
  scheduleSemantics: ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2,
});

export type AcceptedAuthoredEctopyScheduleCheckpointPayloadV2 = Readonly<{
  checkpointId: typeof ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  stateSchemaId: typeof ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID;
  revision: number;
  acceptedTimeSec: number;
  cursor: number;
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2;
  acceptedState: AcceptedAuthoredEctopyScheduleStateV2;
  exactResumeClaim:
    typeof ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_CLAIM_V2;
}>;

export type AcceptedAuthoredEctopyScheduleCheckpointV2 =
  AcceptedAuthoredEctopyScheduleCheckpointPayloadV2 & Readonly<{
    checkpointSha256: string;
  }>;

const CHECKPOINT_PAYLOAD_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "stateSchemaId",
  "revision",
  "acceptedTimeSec",
  "cursor",
  "configuration",
  "acceptedState",
  "exactResumeClaim",
] as const);
const CHECKPOINT_KEYS = Object.freeze([
  ...CHECKPOINT_PAYLOAD_KEYS,
  "checkpointSha256",
] as const);

export async function checkpointAcceptedAuthoredEctopyScheduleStateV2(
  state: AcceptedAuthoredEctopyScheduleStateV2,
): Promise<AcceptedAuthoredEctopyScheduleCheckpointV2> {
  validateAcceptedAuthoredEctopyScheduleStateV2(state);
  const payload = Object.freeze({
    checkpointId: ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    stateSchemaId: ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    cursor: state.cursor,
    configuration: state.configuration,
    acceptedState: state,
    exactResumeClaim:
      ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_CLAIM_V2,
  }) satisfies AcceptedAuthoredEctopyScheduleCheckpointPayloadV2;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, schedule substitution, or clock rebase. */
export async function restoreAcceptedAuthoredEctopyScheduleStateV2(
  input: unknown,
  expectedConfiguration: AcceptedAuthoredEctopyScheduleConfigurationV2,
): Promise<AcceptedAuthoredEctopyScheduleStateV2> {
  const expected = detachedValidatedConfiguration(expectedConfiguration);
  const record = requirePlainRecord(input, "authored ectopy checkpoint");
  requireExactKeys(record, CHECKPOINT_KEYS, "authored ectopy checkpoint");
  canonicalJsonStringify(record);
  if (
    record.checkpointId
      !== ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_V2_ID
    || record.schemaVersion !== 2
    || record.stateSchemaId
      !== ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_STATE_V2_ID
  ) {
    throw new Error("unsupported authored ectopy checkpoint schema");
  }
  if (
    typeof record.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.checkpointSha256)
  ) {
    throw new Error("authored ectopy checkpoint SHA-256 is invalid");
  }

  const checkpoint = record as unknown as
    AcceptedAuthoredEctopyScheduleCheckpointV2;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("authored ectopy checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(
        ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_CLAIM_V2,
      )
  ) {
    throw new Error("authored ectopy checkpoint claim mismatch");
  }

  const restored = detachedFrozenCopy<AcceptedAuthoredEctopyScheduleStateV2>(
    checkpoint.acceptedState,
  );
  validateAcceptedAuthoredEctopyScheduleStateV2(restored);
  const storedConfiguration = detachedFrozenCopy<
    AcceptedAuthoredEctopyScheduleConfigurationV2
  >(checkpoint.configuration);
  validateAcceptedAuthoredEctopyScheduleConfigurationV2(storedConfiguration);
  const storedConfigurationJson = canonicalJsonStringify(storedConfiguration);
  if (
    storedConfigurationJson !== canonicalJsonStringify(restored.configuration)
  ) {
    throw new Error(
      "authored ectopy checkpoint configuration and accepted state split",
    );
  }
  if (storedConfigurationJson !== canonicalJsonStringify(expected)) {
    throw new Error(
      "authored ectopy checkpoint expected configuration mismatch",
    );
  }
  if (
    checkpoint.revision !== restored.revision
    || checkpoint.acceptedTimeSec !== restored.acceptedTimeSec
    || checkpoint.cursor !== restored.cursor
  ) {
    throw new Error(
      "authored ectopy checkpoint outer and accepted clocks split",
    );
  }

  const result = detachedFrozenCopy<AcceptedAuthoredEctopyScheduleStateV2>(
    restored,
  );
  validateAcceptedAuthoredEctopyScheduleStateV2(result);
  return result;
}

function detachedValidatedConfiguration(
  configuration: AcceptedAuthoredEctopyScheduleConfigurationV2,
): AcceptedAuthoredEctopyScheduleConfigurationV2 {
  validateAcceptedAuthoredEctopyScheduleConfigurationV2(configuration);
  const detached = detachedFrozenCopy<
    AcceptedAuthoredEctopyScheduleConfigurationV2
  >(configuration);
  validateAcceptedAuthoredEctopyScheduleConfigurationV2(detached);
  return detached;
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
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}
