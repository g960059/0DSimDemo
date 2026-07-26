import {
  ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CLAIM_V2,
  ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID,
  initializeAcceptedElectricalCaptureOwnerStateV2,
  validateAcceptedElectricalCaptureOwnerStateV2,
  type AcceptedElectricalCaptureOwnerConfigurationV2,
  type AcceptedElectricalCaptureOwnerStateV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_V2_ID =
  "circleheart.accepted-electrical-capture-owner-checkpoint.v2" as const;

/**
 * The digest detects accidental or unkeyed content changes. It is deliberately
 * not described as authentication: a party able to replace the payload can
 * also calculate a new unkeyed SHA-256 digest.
 */
export const ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_CLAIM_V2 =
  deepFreeze({
    exactResumeScope:
      "complete-owner-configuration-clock-counters-and-both-capture-gates" as const,
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
    captureOwnerSemantics: ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CLAIM_V2,
  });

export type AcceptedElectricalCaptureOwnerCheckpointPayloadV2 = Readonly<{
  checkpointId: typeof ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  stateSchemaId: typeof ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID;
  /** Duplicated intentionally and cross-checked against acceptedState. */
  revision: number;
  /** Duplicated intentionally and cross-checked against acceptedState. */
  acceptedTimeSec: number;
  configuration: AcceptedElectricalCaptureOwnerConfigurationV2;
  acceptedState: AcceptedElectricalCaptureOwnerStateV2;
  exactResumeClaim:
    typeof ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_CLAIM_V2;
}>;

export type AcceptedElectricalCaptureOwnerCheckpointV2 =
  AcceptedElectricalCaptureOwnerCheckpointPayloadV2 & Readonly<{
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

export async function checkpointAcceptedElectricalCaptureOwnerStateV2(
  state: AcceptedElectricalCaptureOwnerStateV2,
): Promise<AcceptedElectricalCaptureOwnerCheckpointV2> {
  validateAcceptedElectricalCaptureOwnerStateV2(state);
  const payload = Object.freeze({
    checkpointId: ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    stateSchemaId: ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    configuration: state.configuration,
    acceptedState: state,
    exactResumeClaim:
      ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_CLAIM_V2,
  }) satisfies AcceptedElectricalCaptureOwnerCheckpointPayloadV2;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, clock rebasing, or ID-only matching. */
export async function restoreAcceptedElectricalCaptureOwnerStateV2(
  input: unknown,
  expectedConfiguration: AcceptedElectricalCaptureOwnerConfigurationV2,
): Promise<AcceptedElectricalCaptureOwnerStateV2> {
  const expected = validatedDetachedConfiguration(expectedConfiguration);
  const checkpointRecord = requirePlainRecord(input, "capture owner checkpoint");
  requireExactKeys(
    checkpointRecord,
    CHECKPOINT_KEYS,
    "capture owner checkpoint",
  );
  // Validate the data model before reading envelope values: accessors,
  // prototypes, nonfinite numbers, sparse arrays, and cycles fail closed.
  canonicalJsonStringify(checkpointRecord);
  assertCheckpointEnvelope(checkpointRecord);

  const checkpoint = checkpointRecord as unknown as
    AcceptedElectricalCaptureOwnerCheckpointV2;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("capture owner checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
    !== canonicalJsonStringify(
      ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_CLAIM_V2,
    )
  ) {
    throw new Error("capture owner checkpoint claim mismatch");
  }

  const restored = detachedFrozenCopy<AcceptedElectricalCaptureOwnerStateV2>(
    checkpoint.acceptedState,
  );
  validateAcceptedElectricalCaptureOwnerStateV2(restored);
  const storedConfiguration = detachedFrozenCopy<
    AcceptedElectricalCaptureOwnerConfigurationV2
  >(checkpoint.configuration);

  const storedConfigurationJson = canonicalJsonStringify(storedConfiguration);
  if (
    storedConfigurationJson
      !== canonicalJsonStringify(restored.configuration)
  ) {
    throw new Error(
      "capture owner checkpoint configuration and accepted state split",
    );
  }
  if (storedConfigurationJson !== canonicalJsonStringify(expected)) {
    throw new Error("capture owner checkpoint expected configuration mismatch");
  }
  if (
    checkpoint.revision !== restored.revision
    || checkpoint.acceptedTimeSec !== restored.acceptedTimeSec
  ) {
    throw new Error("capture owner checkpoint outer and accepted clocks split");
  }

  // Validation above establishes the complete semantic invariants. Re-copying
  // makes the returned ownership independent of the parsed checkpoint object.
  const result = detachedFrozenCopy<AcceptedElectricalCaptureOwnerStateV2>(
    restored,
  );
  validateAcceptedElectricalCaptureOwnerStateV2(result);
  return result;
}

function validatedDetachedConfiguration(
  configuration: AcceptedElectricalCaptureOwnerConfigurationV2,
): AcceptedElectricalCaptureOwnerConfigurationV2 {
  const detached = detachedFrozenCopy<
    AcceptedElectricalCaptureOwnerConfigurationV2
  >(configuration);
  // Initialization exercises the configuration's exact schema, chamber route,
  // refractory-duration, and unique-gate validation without exposing a second
  // configuration validator.
  return initializeAcceptedElectricalCaptureOwnerStateV2(detached, {
    acceptedTimeSec: 0,
    atrialPriorCapture: null,
    ventricularPriorCapture: null,
  }).configuration;
}

function assertCheckpointEnvelope(checkpoint: Record<string, unknown>): void {
  if (
    checkpoint.checkpointId
      !== ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_V2_ID
    || checkpoint.schemaVersion !== 2
    || checkpoint.stateSchemaId
      !== ACCEPTED_ELECTRICAL_CAPTURE_OWNER_STATE_V2_ID
  ) {
    throw new Error("unsupported capture owner checkpoint schema");
  }
  if (
    typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)
  ) {
    throw new Error("capture owner checkpoint SHA-256 is invalid");
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
