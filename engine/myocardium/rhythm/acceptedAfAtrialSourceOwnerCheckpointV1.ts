import {
  ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1,
  ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID,
  initializeAcceptedAfAtrialSourceStateV1,
  validateAcceptedAfAtrialSourceStateV1,
  type AcceptedAfAtrialSourceConfigurationV1,
  type AcceptedAfAtrialSourceStateV1,
  type AfAtrialSchedulingIntervalV1,
  type AfDeterministicRandomStateV1,
} from "@/engine/myocardium/rhythm/acceptedAfAtrialSourceOwnerV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_V1_ID =
  "circleheart.accepted-af-atrial-source-checkpoint.v1" as const;

/**
 * Unkeyed SHA-256 detects accidental/unbound content changes. It is not an
 * authentication mechanism: a writer who can replace the payload can also
 * calculate another digest.
 */
export const ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_CLAIM_V1 = deepFreeze({
  exactResumeScope:
    "complete-configuration-clock-source-sequence-MA-history-random-engine-Gaussian-spare-Gamma-attempt-tilt-and-nonpositive-parent-rejection-counters-and-next-lineage" as const,
  fullConfigurationStored: true as const,
  completeAcceptedStateStored: true as const,
  randomStateExact: true as const,
  outerStateCrossChecks: Object.freeze([
    "revision",
    "acceptedTimeSec",
    "nextSourceSequence",
    "nextSourceActivationTimeSec",
    "acceptedSourceImpulseCount",
    "innovationHistoryNewestFirstSec",
    "randomState",
    "nextSourceSchedulingInterval",
  ] as const),
  integrity:
    "sha-256-over-complete-canonical-json-payload-for-change-detection" as const,
  authenticationClaimed: false as const,
  expectedConfigurationRequirement:
    "exact-complete-canonical-content-match-not-id-only" as const,
  restoreResult: "detached-recursively-immutable-accepted-state" as const,
  migrationClaimed: false as const,
  clockRebaseClaimed: false as const,
  sourceSemantics: ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1,
});

export type AcceptedAfAtrialSourceCheckpointPayloadV1 = Readonly<{
  checkpointId: typeof ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  stateSchemaId: typeof ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  nextSourceSequence: number;
  nextSourceActivationTimeSec: number;
  acceptedSourceImpulseCount: number;
  innovationHistoryNewestFirstSec: readonly number[];
  randomState: AfDeterministicRandomStateV1;
  nextSourceSchedulingInterval: AfAtrialSchedulingIntervalV1 | null;
  configuration: AcceptedAfAtrialSourceConfigurationV1;
  acceptedState: AcceptedAfAtrialSourceStateV1;
  exactResumeClaim: typeof ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_CLAIM_V1;
}>;

export type AcceptedAfAtrialSourceCheckpointV1 =
  AcceptedAfAtrialSourceCheckpointPayloadV1 &
    Readonly<{
      checkpointSha256: string;
    }>;

const CHECKPOINT_PAYLOAD_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "stateSchemaId",
  "revision",
  "acceptedTimeSec",
  "nextSourceSequence",
  "nextSourceActivationTimeSec",
  "acceptedSourceImpulseCount",
  "innovationHistoryNewestFirstSec",
  "randomState",
  "nextSourceSchedulingInterval",
  "configuration",
  "acceptedState",
  "exactResumeClaim",
] as const);
const CHECKPOINT_KEYS = Object.freeze([
  ...CHECKPOINT_PAYLOAD_KEYS,
  "checkpointSha256",
] as const);

export async function checkpointAcceptedAfAtrialSourceStateV1(
  state: AcceptedAfAtrialSourceStateV1,
): Promise<AcceptedAfAtrialSourceCheckpointV1> {
  validateAcceptedAfAtrialSourceStateV1(state);
  const payload = deepFreeze({
    checkpointId: ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    stateSchemaId: ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    nextSourceSequence: state.nextSourceSequence,
    nextSourceActivationTimeSec: state.nextSourceActivationTimeSec,
    acceptedSourceImpulseCount: state.acceptedSourceImpulseCount,
    innovationHistoryNewestFirstSec: state.innovationHistoryNewestFirstSec,
    randomState: state.randomState,
    nextSourceSchedulingInterval: state.nextSourceSchedulingInterval,
    configuration: state.configuration,
    acceptedState: state,
    exactResumeClaim: ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_CLAIM_V1,
  }) satisfies AcceptedAfAtrialSourceCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, seed replacement, or clock rebasing. */
export async function restoreAcceptedAfAtrialSourceStateV1(
  input: unknown,
  expectedConfiguration: AcceptedAfAtrialSourceConfigurationV1,
): Promise<AcceptedAfAtrialSourceStateV1> {
  const expected = validatedDetachedConfiguration(expectedConfiguration);
  const checkpointRecord = requirePlainRecord(
    input,
    "AF atrial source checkpoint",
  );
  requireExactKeys(
    checkpointRecord,
    CHECKPOINT_KEYS,
    "AF atrial source checkpoint",
  );
  canonicalJsonStringify(checkpointRecord);
  assertCheckpointEnvelope(checkpointRecord);
  const checkpoint =
    checkpointRecord as unknown as AcceptedAfAtrialSourceCheckpointV1;
  const { checkpointSha256, ...payload } = checkpoint;
  if ((await sha256CanonicalJsonHex(payload)) !== checkpointSha256) {
    throw new Error("AF atrial source checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim) !==
    canonicalJsonStringify(ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_CLAIM_V1)
  ) {
    throw new Error("AF atrial source checkpoint claim mismatch");
  }

  const restored = detachedFrozenCopy<AcceptedAfAtrialSourceStateV1>(
    checkpoint.acceptedState,
  );
  validateAcceptedAfAtrialSourceStateV1(restored);
  const storedConfiguration =
    detachedFrozenCopy<AcceptedAfAtrialSourceConfigurationV1>(
      checkpoint.configuration,
    );
  const storedConfigurationJson = canonicalJsonStringify(storedConfiguration);
  if (
    storedConfigurationJson !== canonicalJsonStringify(restored.configuration)
  ) {
    throw new Error(
      "AF atrial source checkpoint configuration and accepted state split",
    );
  }
  if (storedConfigurationJson !== canonicalJsonStringify(expected)) {
    throw new Error(
      "AF atrial source checkpoint expected configuration mismatch",
    );
  }
  const outerChecks: readonly [unknown, unknown, string][] = [
    [checkpoint.revision, restored.revision, "revision"],
    [checkpoint.acceptedTimeSec, restored.acceptedTimeSec, "acceptedTimeSec"],
    [
      checkpoint.nextSourceSequence,
      restored.nextSourceSequence,
      "nextSourceSequence",
    ],
    [
      checkpoint.nextSourceActivationTimeSec,
      restored.nextSourceActivationTimeSec,
      "nextSourceActivationTimeSec",
    ],
    [
      checkpoint.acceptedSourceImpulseCount,
      restored.acceptedSourceImpulseCount,
      "acceptedSourceImpulseCount",
    ],
  ];
  for (const [outer, inner, field] of outerChecks) {
    if (outer !== inner) {
      throw new Error(
        `AF atrial source checkpoint outer and accepted ${field} split`,
      );
    }
  }
  const canonicalOuterChecks: readonly [unknown, unknown, string][] = [
    [
      checkpoint.innovationHistoryNewestFirstSec,
      restored.innovationHistoryNewestFirstSec,
      "innovation history",
    ],
    [checkpoint.randomState, restored.randomState, "random state"],
    [
      checkpoint.nextSourceSchedulingInterval,
      restored.nextSourceSchedulingInterval,
      "next-source scheduling lineage",
    ],
  ];
  for (const [outer, inner, field] of canonicalOuterChecks) {
    if (canonicalJsonStringify(outer) !== canonicalJsonStringify(inner)) {
      throw new Error(
        `AF atrial source checkpoint outer and accepted ${field} split`,
      );
    }
  }

  const result = detachedFrozenCopy<AcceptedAfAtrialSourceStateV1>(restored);
  validateAcceptedAfAtrialSourceStateV1(result);
  return result;
}

function validatedDetachedConfiguration(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
): AcceptedAfAtrialSourceConfigurationV1 {
  const detached =
    detachedFrozenCopy<AcceptedAfAtrialSourceConfigurationV1>(configuration);
  // Initialization validates the complete configuration and exercises the
  // declared seed expansion and finite MA history without exposing ID-only
  // matching. Typical AF parameters make the history physical; an invalid
  // realized history fails closed just as a live initialization does.
  return initializeAcceptedAfAtrialSourceStateV1(detached, {
    acceptedTimeSec: 0,
    firstSourceActivationTimeSec: 1,
  }).configuration;
}

function assertCheckpointEnvelope(checkpoint: Record<string, unknown>): void {
  if (
    checkpoint.checkpointId !== ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_V1_ID ||
    checkpoint.schemaVersion !== 1 ||
    checkpoint.stateSchemaId !== ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID
  ) {
    throw new Error("unsupported AF atrial source checkpoint schema");
  }
  if (
    typeof checkpoint.checkpointSha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)
  ) {
    throw new Error("AF atrial source checkpoint SHA-256 is invalid");
  }
}

function detachedFrozenCopy<T>(input: unknown): T {
  return deepFreeze(JSON.parse(canonicalJsonStringify(input)) as T);
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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
