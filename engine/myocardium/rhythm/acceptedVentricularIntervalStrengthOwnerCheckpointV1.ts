import {
  ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1,
  ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID,
  createAcceptedVentricularIntervalStrengthConfigurationV1,
  validateAcceptedVentricularIntervalStrengthConfigurationV1,
  validateAcceptedVentricularIntervalStrengthStateV1,
  type AcceptedVentricularIntervalStrengthConfigurationV1,
  type AcceptedVentricularIntervalStrengthStateV1,
} from "@/engine/myocardium/rhythm/acceptedVentricularIntervalStrengthOwnerV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_V1_ID =
  "circleheart.accepted-ventricular-interval-strength-checkpoint.v1" as const;

/**
 * The unkeyed SHA-256 digest detects content change. It is not authentication:
 * a party able to replace the payload can also calculate a replacement digest.
 */
export const ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_CLAIM_V1 =
  deepFreeze({
    exactResumeScope:
      "complete-configuration-clock-counters-sr-load-capture-lineage-and-last-deposit-metadata" as const,
    fullConfigurationStored: true as const,
    completeAcceptedStateStored: true as const,
    outerClockAndRevisionCrossCheckedAgainstAcceptedState: true as const,
    integrity:
      "sha-256-over-complete-canonical-json-payload-for-change-detection" as const,
    authenticationClaimed: false as const,
    expectedConfigurationRequirement:
      "exact-complete-canonical-content-match-not-id-only" as const,
    restoreResult: "detached-recursively-immutable-accepted-state" as const,
    migrationClaimed: false as const,
    clockRebaseClaimed: false as const,
    intervalStrengthSemantics:
      ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1,
  });

export type AcceptedVentricularIntervalStrengthCheckpointPayloadV1 = Readonly<{
  checkpointId:
    typeof ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  stateSchemaId:
    typeof ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1;
  acceptedState: AcceptedVentricularIntervalStrengthStateV1;
  exactResumeClaim:
    typeof ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_CLAIM_V1;
}>;

export type AcceptedVentricularIntervalStrengthCheckpointV1 =
  AcceptedVentricularIntervalStrengthCheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

const CHECKPOINT_PAYLOAD_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "stateSchemaId",
  "revision",
  "acceptedTimeSec",
  "configuration",
  "acceptedState",
  "exactResumeClaim",
] as const);
const CHECKPOINT_KEYS = Object.freeze([
  ...CHECKPOINT_PAYLOAD_KEYS,
  "checkpointSha256",
] as const);

export async function checkpointAcceptedVentricularIntervalStrengthStateV1(
  state: AcceptedVentricularIntervalStrengthStateV1,
): Promise<AcceptedVentricularIntervalStrengthCheckpointV1> {
  validateAcceptedVentricularIntervalStrengthStateV1(state);
  const payload = Object.freeze({
    checkpointId:
      ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    stateSchemaId: ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    configuration: state.configuration,
    acceptedState: state,
    exactResumeClaim:
      ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_CLAIM_V1,
  }) satisfies AcceptedVentricularIntervalStrengthCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, clock rebase, or ID-only matching. */
export async function restoreAcceptedVentricularIntervalStrengthStateV1(
  input: unknown,
  expectedConfiguration:
    AcceptedVentricularIntervalStrengthConfigurationV1,
): Promise<AcceptedVentricularIntervalStrengthStateV1> {
  const expected = detachedValidatedConfiguration(expectedConfiguration);
  const record = requirePlainRecord(input, "interval-strength checkpoint");
  requireExactKeys(record, CHECKPOINT_KEYS, "interval-strength checkpoint");
  canonicalJsonStringify(record);
  if (
    record.checkpointId
      !== ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_V1_ID
    || record.schemaVersion !== 1
    || record.stateSchemaId
      !== ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_STATE_V1_ID
  ) {
    throw new Error("unsupported interval-strength checkpoint schema");
  }
  if (
    typeof record.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.checkpointSha256)
  ) {
    throw new Error("interval-strength checkpoint SHA-256 is invalid");
  }

  const checkpoint = record as unknown as
    AcceptedVentricularIntervalStrengthCheckpointV1;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("interval-strength checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(
        ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_CLAIM_V1,
      )
  ) {
    throw new Error("interval-strength checkpoint claim mismatch");
  }

  const restored = detachedFrozenCopy<
    AcceptedVentricularIntervalStrengthStateV1
  >(checkpoint.acceptedState);
  validateAcceptedVentricularIntervalStrengthStateV1(restored);
  const storedConfiguration = detachedFrozenCopy<
    AcceptedVentricularIntervalStrengthConfigurationV1
  >(checkpoint.configuration);
  validateAcceptedVentricularIntervalStrengthConfigurationV1(
    storedConfiguration,
  );
  const storedJson = canonicalJsonStringify(storedConfiguration);
  if (storedJson !== canonicalJsonStringify(restored.configuration)) {
    throw new Error(
      "interval-strength checkpoint configuration and state split",
    );
  }
  if (storedJson !== canonicalJsonStringify(expected)) {
    throw new Error(
      "interval-strength checkpoint expected configuration mismatch",
    );
  }
  if (
    checkpoint.revision !== restored.revision
    || checkpoint.acceptedTimeSec !== restored.acceptedTimeSec
  ) {
    throw new Error(
      "interval-strength checkpoint outer and accepted clocks split",
    );
  }

  const result = detachedFrozenCopy<
    AcceptedVentricularIntervalStrengthStateV1
  >(restored);
  validateAcceptedVentricularIntervalStrengthStateV1(result);
  return result;
}

function detachedValidatedConfiguration(
  configuration: AcceptedVentricularIntervalStrengthConfigurationV1,
): AcceptedVentricularIntervalStrengthConfigurationV1 {
  validateAcceptedVentricularIntervalStrengthConfigurationV1(configuration);
  return createAcceptedVentricularIntervalStrengthConfigurationV1({
    configurationId: configuration.configurationId,
    ownerInstanceId: configuration.ownerInstanceId,
    parameterProvenance: {
      kind: configuration.parameterProvenance.kind,
      sourceId: configuration.parameterProvenance.sourceId,
    },
    recoveryTimeConstantSec: configuration.recoveryTimeConstantSec,
    releaseFractionBeta: configuration.releaseFractionBeta,
    releasedLoadReturnFractionR:
      configuration.releasedLoadReturnFractionR,
    intervalInfluxInhibitionFractionH:
      configuration.intervalInfluxInhibitionFractionH,
    referenceCycleLengthSec: configuration.referenceCycleLengthSec,
  });
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
