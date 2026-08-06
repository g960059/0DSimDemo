import {
  ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CLAIM_V2,
  ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID,
  initializeAcceptedVentricularBackupSourceStateV2,
  validateAcceptedVentricularBackupSourceConfigurationV2,
  validateAcceptedVentricularBackupSourceStateV2,
  type AcceptedVentricularBackupSourceConfigurationV2,
  type AcceptedVentricularBackupSourceStateV2,
} from "@/engine/myocardium/rhythm/acceptedVentricularBackupSourceOwnerV2";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_V2_ID =
  "circleheart.accepted-ventricular-backup-source-owner-checkpoint.v2" as const;

/** Unkeyed SHA-256 is change detection, not authentication. */
export const ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_CLAIM_V2 =
  deepFreeze({
    exactResumeScope:
      "complete-configuration-initial-signed-history-clock-due-times-counters-last-attempts-and-capture-lineage" as const,
    fullConfigurationStored: true as const,
    completeAcceptedStateStored: true as const,
    outerClockRevisionAndDueTimesCrossCheckedAgainstAcceptedState: true as const,
    integrity:
      "sha-256-over-complete-canonical-json-payload-for-change-detection" as const,
    authenticationClaimed: false as const,
    expectedConfigurationRequirement:
      "exact-complete-canonical-content-match-not-id-only" as const,
    restoreResult: "detached-recursively-immutable-accepted-state" as const,
    migrationClaimed: false as const,
    clockRebaseClaimed: false as const,
    ownerSemantics: ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CLAIM_V2,
  });

export type AcceptedVentricularBackupSourceOwnerCheckpointPayloadV2 =
  Readonly<{
    checkpointId:
      typeof ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_V2_ID;
    schemaVersion: 2;
    stateSchemaId: typeof ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID;
    revision: number;
    acceptedTimeSec: number;
    nextIntrinsicEscapeDueTimeSec: number;
    nextVviPaceDueTimeSec: number;
    configuration: AcceptedVentricularBackupSourceConfigurationV2;
    acceptedState: AcceptedVentricularBackupSourceStateV2;
    exactResumeClaim:
      typeof ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_CLAIM_V2;
  }>;

export type AcceptedVentricularBackupSourceOwnerCheckpointV2 =
  AcceptedVentricularBackupSourceOwnerCheckpointPayloadV2 & Readonly<{
    checkpointSha256: string;
  }>;

const CHECKPOINT_PAYLOAD_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "stateSchemaId",
  "revision",
  "acceptedTimeSec",
  "nextIntrinsicEscapeDueTimeSec",
  "nextVviPaceDueTimeSec",
  "configuration",
  "acceptedState",
  "exactResumeClaim",
] as const);
const CHECKPOINT_KEYS = Object.freeze([
  ...CHECKPOINT_PAYLOAD_KEYS,
  "checkpointSha256",
] as const);

export async function checkpointAcceptedVentricularBackupSourceStateV2(
  state: AcceptedVentricularBackupSourceStateV2,
): Promise<AcceptedVentricularBackupSourceOwnerCheckpointV2> {
  validateAcceptedVentricularBackupSourceStateV2(state);
  const payload = Object.freeze({
    checkpointId:
      ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    stateSchemaId: ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    nextIntrinsicEscapeDueTimeSec: state.nextIntrinsicEscapeDueTimeSec,
    nextVviPaceDueTimeSec: state.nextVviPaceDueTimeSec,
    configuration: state.configuration,
    acceptedState: state,
    exactResumeClaim:
      ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_CLAIM_V2,
  }) satisfies AcceptedVentricularBackupSourceOwnerCheckpointPayloadV2;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, parameter substitution, or clock rebase. */
export async function restoreAcceptedVentricularBackupSourceStateV2(
  input: unknown,
  expectedConfiguration: AcceptedVentricularBackupSourceConfigurationV2,
): Promise<AcceptedVentricularBackupSourceStateV2> {
  const expected = detachedValidatedConfiguration(expectedConfiguration);
  const record = requirePlainRecord(input, "ventricular backup checkpoint");
  requireExactKeys(record, CHECKPOINT_KEYS, "ventricular backup checkpoint");
  canonicalJsonStringify(record);
  if (
    record.checkpointId
      !== ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_V2_ID
    || record.schemaVersion !== 2
    || record.stateSchemaId
      !== ACCEPTED_VENTRICULAR_BACKUP_SOURCE_STATE_V2_ID
  ) throw new Error("unsupported ventricular backup checkpoint schema");
  if (
    typeof record.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.checkpointSha256)
  ) throw new Error("ventricular backup checkpoint SHA-256 is invalid");

  const checkpoint = record as unknown as
    AcceptedVentricularBackupSourceOwnerCheckpointV2;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("ventricular backup checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(
        ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_CLAIM_V2,
      )
  ) throw new Error("ventricular backup checkpoint claim mismatch");

  const restored = detachedFrozenCopy<AcceptedVentricularBackupSourceStateV2>(
    checkpoint.acceptedState,
  );
  validateAcceptedVentricularBackupSourceStateV2(restored);
  const storedConfiguration = detachedFrozenCopy<
    AcceptedVentricularBackupSourceConfigurationV2
  >(checkpoint.configuration);
  validateAcceptedVentricularBackupSourceConfigurationV2(storedConfiguration);
  const storedConfigurationJson = canonicalJsonStringify(storedConfiguration);
  if (storedConfigurationJson !== canonicalJsonStringify(restored.configuration)) {
    throw new Error("ventricular backup checkpoint configuration and state split");
  }
  if (storedConfigurationJson !== canonicalJsonStringify(expected)) {
    throw new Error("ventricular backup checkpoint expected configuration mismatch");
  }
  if (
    checkpoint.revision !== restored.revision
    || checkpoint.acceptedTimeSec !== restored.acceptedTimeSec
    || checkpoint.nextIntrinsicEscapeDueTimeSec
      !== restored.nextIntrinsicEscapeDueTimeSec
    || checkpoint.nextVviPaceDueTimeSec !== restored.nextVviPaceDueTimeSec
  ) throw new Error("ventricular backup checkpoint outer and accepted clocks split");

  const result = detachedFrozenCopy<AcceptedVentricularBackupSourceStateV2>(restored);
  validateAcceptedVentricularBackupSourceStateV2(result);
  return result;
}

function detachedValidatedConfiguration(
  configuration: AcceptedVentricularBackupSourceConfigurationV2,
): AcceptedVentricularBackupSourceConfigurationV2 {
  const detached = detachedFrozenCopy<AcceptedVentricularBackupSourceConfigurationV2>(
    configuration,
  );
  validateAcceptedVentricularBackupSourceConfigurationV2(detached);
  // Initialization additionally exercises configuration-derived timer math.
  initializeAcceptedVentricularBackupSourceStateV2(detached, {
    acceptedTimeSec: 0,
    priorAcceptedVentricularCapture: {
      capturedActivationId: "checkpoint-configuration-validation-capture",
      parentSourceImpulseId: "checkpoint-configuration-validation-impulse",
      sourceKind: "av-output",
      sourceId: "checkpoint-configuration-validation-source",
      sourceSequence: 0,
      activationTimeSec: -Math.min(
        detached.intrinsicEscapeCycleLengthSec,
        detached.vviLowerRateIntervalSec,
      ) / 2,
    },
  });
  return detached;
}

function detachedFrozenCopy<T>(input: unknown): T {
  return deepFreeze(JSON.parse(canonicalJsonStringify(input)) as T);
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
  ) throw new Error(`${field} keys are invalid`);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
