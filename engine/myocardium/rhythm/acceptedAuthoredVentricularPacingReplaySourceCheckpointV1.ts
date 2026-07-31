import {
  ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1,
  ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID,
  validateAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  validateAcceptedAuthoredVentricularPacingReplaySourceStateV1,
  type AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  type AcceptedAuthoredVentricularPacingReplaySourceStateV1,
} from "@/engine/myocardium/rhythm/acceptedAuthoredVentricularPacingReplaySourceV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_V1_ID =
  "circleheart.accepted-authored-ventricular-pacing-replay-source-checkpoint.v1" as const;

/**
 * The unkeyed digest detects content changes. It is not authentication: a
 * party able to replace the payload can also compute a replacement digest.
 */
export const ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_CLAIM_V1 =
  deepFreeze({
    exactResumeScope:
      "complete-authored-ventricular-pacing-replay-configuration-clock-cursor-history-and-counters" as const,
    fullConfigurationStored: true as const,
    completeAcceptedStateStored: true as const,
    outerStateCrossChecks: Object.freeze([
      "revision",
      "acceptedTimeSec",
      "cursor",
      "acceptedEmittedImpulseCount",
    ] as const),
    integrity:
      "sha-256-over-complete-canonical-json-payload-for-change-detection" as const,
    authenticationClaimed: false as const,
    expectedConfigurationRequirement:
      "exact-complete-canonical-content-match-not-id-only" as const,
    restoreResult: "detached-recursively-immutable-accepted-state" as const,
    migrationClaimed: false as const,
    clockRebaseClaimed: false as const,
    replaySemantics:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CLAIM_V1,
  });

export type AcceptedAuthoredVentricularPacingReplaySourceCheckpointPayloadV1 =
  Readonly<{
    checkpointId: typeof ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_V1_ID;
    schemaVersion: 1;
    stateSchemaId: typeof ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID;
    revision: number;
    acceptedTimeSec: number;
    cursor: number;
    acceptedEmittedImpulseCount: number;
    configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1;
    acceptedState: AcceptedAuthoredVentricularPacingReplaySourceStateV1;
    exactResumeClaim: typeof ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_CLAIM_V1;
  }>;

export type AcceptedAuthoredVentricularPacingReplaySourceCheckpointV1 =
  AcceptedAuthoredVentricularPacingReplaySourceCheckpointPayloadV1 &
    Readonly<{
      checkpointSha256: string;
    }>;

const CHECKPOINT_PAYLOAD_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "stateSchemaId",
  "revision",
  "acceptedTimeSec",
  "cursor",
  "acceptedEmittedImpulseCount",
  "configuration",
  "acceptedState",
  "exactResumeClaim",
] as const);
const CHECKPOINT_KEYS = Object.freeze([
  ...CHECKPOINT_PAYLOAD_KEYS,
  "checkpointSha256",
] as const);

export async function checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1(
  state: AcceptedAuthoredVentricularPacingReplaySourceStateV1,
): Promise<AcceptedAuthoredVentricularPacingReplaySourceCheckpointV1> {
  validateAcceptedAuthoredVentricularPacingReplaySourceStateV1(state);
  const payload = deepFreeze({
    checkpointId:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    stateSchemaId:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    cursor: state.cursor,
    acceptedEmittedImpulseCount: state.acceptedEmittedImpulseCount,
    configuration: state.configuration,
    acceptedState: state,
    exactResumeClaim:
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_CLAIM_V1,
  }) satisfies AcceptedAuthoredVentricularPacingReplaySourceCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, schedule substitution, or clock rebase. */
export async function restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
  input: unknown,
  expectedConfiguration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
): Promise<AcceptedAuthoredVentricularPacingReplaySourceStateV1> {
  const expected = detachedValidatedConfiguration(expectedConfiguration);
  const record = requirePlainRecord(
    input,
    "authored ventricular pacing replay checkpoint",
  );
  requireExactKeys(
    record,
    CHECKPOINT_KEYS,
    "authored ventricular pacing replay checkpoint",
  );
  canonicalJsonStringify(record);
  if (
    record.checkpointId !==
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_V1_ID ||
    record.schemaVersion !== 1 ||
    record.stateSchemaId !==
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_STATE_V1_ID
  ) {
    throw new Error(
      "unsupported authored ventricular pacing replay checkpoint schema",
    );
  }
  if (
    typeof record.checkpointSha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(record.checkpointSha256)
  ) {
    throw new Error(
      "authored ventricular pacing replay checkpoint SHA-256 is invalid",
    );
  }

  const checkpoint =
    record as unknown as AcceptedAuthoredVentricularPacingReplaySourceCheckpointV1;
  const { checkpointSha256, ...payload } = checkpoint;
  if ((await sha256CanonicalJsonHex(payload)) !== checkpointSha256) {
    throw new Error(
      "authored ventricular pacing replay checkpoint SHA-256 mismatch",
    );
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim) !==
    canonicalJsonStringify(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_CLAIM_V1,
    )
  ) {
    throw new Error(
      "authored ventricular pacing replay checkpoint claim mismatch",
    );
  }

  const restored =
    detachedFrozenCopy<AcceptedAuthoredVentricularPacingReplaySourceStateV1>(
      checkpoint.acceptedState,
    );
  validateAcceptedAuthoredVentricularPacingReplaySourceStateV1(restored);
  const storedConfiguration =
    detachedFrozenCopy<AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1>(
      checkpoint.configuration,
    );
  validateAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1(
    storedConfiguration,
  );
  const storedConfigurationJson = canonicalJsonStringify(storedConfiguration);
  if (
    storedConfigurationJson !== canonicalJsonStringify(restored.configuration)
  ) {
    throw new Error(
      "authored ventricular pacing replay checkpoint configuration and accepted state split",
    );
  }
  if (storedConfigurationJson !== canonicalJsonStringify(expected)) {
    throw new Error(
      "authored ventricular pacing replay checkpoint expected configuration mismatch",
    );
  }
  if (
    checkpoint.revision !== restored.revision ||
    checkpoint.acceptedTimeSec !== restored.acceptedTimeSec ||
    checkpoint.cursor !== restored.cursor ||
    checkpoint.acceptedEmittedImpulseCount !==
      restored.acceptedEmittedImpulseCount
  ) {
    throw new Error(
      "authored ventricular pacing replay checkpoint outer and accepted state split",
    );
  }

  const result =
    detachedFrozenCopy<AcceptedAuthoredVentricularPacingReplaySourceStateV1>(
      restored,
    );
  validateAcceptedAuthoredVentricularPacingReplaySourceStateV1(result);
  return result;
}

function detachedValidatedConfiguration(
  configuration: AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
): AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1 {
  validateAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1(
    configuration,
  );
  const detached =
    detachedFrozenCopy<AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1>(
      configuration,
    );
  validateAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1(
    detached,
  );
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
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}
