import {
  ACCEPTED_DISTAL_CONDUCTION_GATE_CLAIM_V1,
  ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID,
  createDistalConductionGateConfigurationV1,
  validateAcceptedDistalConductionGateStateV1,
  validateDistalConductionGateConfigurationV1,
  type AcceptedDistalConductionGateStateV1,
  type DistalConductionGateConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedDistalConductionGateV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_V1_ID =
  "circleheart.accepted-distal-conduction-gate-checkpoint.v1" as const;

/**
 * The unkeyed digest detects content changes; it is not authentication because
 * a party replacing the payload can also calculate a replacement digest.
 */
export const ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_CLAIM_V1 = deepFreeze({
  exactResumeScope:
    "complete-distal-gate-configuration-clock-counters-readiness-and-mask-position" as const,
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
  distalGateSemantics: ACCEPTED_DISTAL_CONDUCTION_GATE_CLAIM_V1,
});

export type AcceptedDistalConductionGateCheckpointPayloadV1 = Readonly<{
  checkpointId: typeof ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  stateSchemaId: typeof ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  configuration: DistalConductionGateConfigurationV1;
  acceptedState: AcceptedDistalConductionGateStateV1;
  exactResumeClaim:
    typeof ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_CLAIM_V1;
}>;

export type AcceptedDistalConductionGateCheckpointV1 =
  AcceptedDistalConductionGateCheckpointPayloadV1 & Readonly<{
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

export async function checkpointAcceptedDistalConductionGateStateV1(
  state: AcceptedDistalConductionGateStateV1,
): Promise<AcceptedDistalConductionGateCheckpointV1> {
  validateAcceptedDistalConductionGateStateV1(state);
  const payload = Object.freeze({
    checkpointId: ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    stateSchemaId: ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    configuration: state.configuration,
    acceptedState: state,
    exactResumeClaim: ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_CLAIM_V1,
  }) satisfies AcceptedDistalConductionGateCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, clock rebase, or ID-only matching. */
export async function restoreAcceptedDistalConductionGateStateV1(
  input: unknown,
  expectedConfiguration: DistalConductionGateConfigurationV1,
): Promise<AcceptedDistalConductionGateStateV1> {
  const expected = detachedValidatedConfiguration(expectedConfiguration);
  const record = requirePlainRecord(input, "distal gate checkpoint");
  requireExactKeys(record, CHECKPOINT_KEYS, "distal gate checkpoint");
  canonicalJsonStringify(record);
  if (record.checkpointId !== ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_V1_ID
    || record.schemaVersion !== 1
    || record.stateSchemaId !== ACCEPTED_DISTAL_CONDUCTION_GATE_STATE_V1_ID) {
    throw new Error("unsupported distal gate checkpoint schema");
  }
  if (typeof record.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.checkpointSha256)) {
    throw new Error("distal gate checkpoint SHA-256 is invalid");
  }

  const checkpoint = record as unknown as AcceptedDistalConductionGateCheckpointV1;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("distal gate checkpoint SHA-256 mismatch");
  }
  if (canonicalJsonStringify(checkpoint.exactResumeClaim)
    !== canonicalJsonStringify(
      ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_CLAIM_V1,
    )) {
    throw new Error("distal gate checkpoint claim mismatch");
  }

  const restored = detachedFrozenCopy<AcceptedDistalConductionGateStateV1>(
    checkpoint.acceptedState,
  );
  validateAcceptedDistalConductionGateStateV1(restored);
  const storedConfiguration = detachedFrozenCopy<
    DistalConductionGateConfigurationV1
  >(checkpoint.configuration);
  validateDistalConductionGateConfigurationV1(storedConfiguration);
  const storedJson = canonicalJsonStringify(storedConfiguration);
  if (storedJson !== canonicalJsonStringify(restored.configuration)) {
    throw new Error("distal gate checkpoint configuration and state split");
  }
  if (storedJson !== canonicalJsonStringify(expected)) {
    throw new Error("distal gate checkpoint expected configuration mismatch");
  }
  if (checkpoint.revision !== restored.revision
    || checkpoint.acceptedTimeSec !== restored.acceptedTimeSec) {
    throw new Error("distal gate checkpoint outer and accepted clocks split");
  }

  const result = detachedFrozenCopy<AcceptedDistalConductionGateStateV1>(restored);
  validateAcceptedDistalConductionGateStateV1(result);
  return result;
}

function detachedValidatedConfiguration(
  configuration: DistalConductionGateConfigurationV1,
): DistalConductionGateConfigurationV1 {
  validateDistalConductionGateConfigurationV1(configuration);
  return createDistalConductionGateConfigurationV1({
    configurationId: configuration.configurationId,
    gateInstanceId: configuration.gateInstanceId,
    parameterProvenance: {
      kind: configuration.parameterProvenance.kind,
      sourceId: configuration.parameterProvenance.sourceId,
    },
    hvConductionDelaySec: configuration.hvConductionDelaySec,
    distalEffectiveRefractoryPeriodSec:
      configuration.distalEffectiveRefractoryPeriodSec,
    modeConfiguration: configuration.modeConfiguration.mode === "authored-mask"
      ? {
        mode: "authored-mask",
        pattern: configuration.modeConfiguration.pattern,
        repeatPolicy: configuration.modeConfiguration.repeatPolicy,
      }
      : { mode: configuration.modeConfiguration.mode },
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
  if (actual.length !== required.length
    || actual.some((key, index) => key !== required[index])) {
    throw new Error(`${field} keys are invalid`);
  }
}
