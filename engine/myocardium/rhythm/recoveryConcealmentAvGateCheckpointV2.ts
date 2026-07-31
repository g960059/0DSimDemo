import {
  RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID,
  RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM,
  createRecoveryConcealmentAvGateConfigurationV2,
  validateRecoveryConcealmentAvGateConfigurationV2,
  validateRecoveryConcealmentAvGateStateV2,
  type RecoveryConcealmentAvGateAcceptedStateV2,
  type RecoveryConcealmentAvGateConfigurationV2,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV2";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_V2_ID =
  "circleheart.recovery-concealment-proximal-av-owner-checkpoint.v2" as const;

export const RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_CLAIM_V2 = deepFreeze({
  exactResumeScope:
    "complete-proximal-av-configuration-input-clock-counters-refractory-and-last-output" as const,
  fullConfigurationStored: true as const,
  completeAcceptedStateStored: true as const,
  outerOwnerRevisionAndInputClockCrossChecked: true as const,
  expectedConfigurationRequirement:
    "exact-complete-canonical-content-match-not-id-only" as const,
  integrity:
    "sha-256-over-complete-canonical-json-payload-for-change-detection" as const,
  authenticationClaimed: false as const,
  restoreResult: "detached-recursively-immutable-accepted-state" as const,
  migrationClaimed: false as const,
  clockRebaseClaimed: false as const,
  ventricularActivationCheckpointClaimed: false as const,
  proximalAvOwnerSemantics: RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM,
});

export type RecoveryConcealmentAvGateCheckpointPayloadV2 = Readonly<{
  checkpointId: typeof RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  stateSchemaId: typeof RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID;
  configurationId: string;
  proximalAvOwnerInstanceId: string;
  revision: number;
  acceptedAtrialActivationTimeSec: number;
  configuration: RecoveryConcealmentAvGateConfigurationV2;
  acceptedState: RecoveryConcealmentAvGateAcceptedStateV2;
  exactResumeClaim:
    typeof RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_CLAIM_V2;
}>;

export type RecoveryConcealmentAvGateCheckpointV2 =
  RecoveryConcealmentAvGateCheckpointPayloadV2 & Readonly<{
    checkpointSha256: string;
  }>;

const PAYLOAD_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "stateSchemaId",
  "configurationId",
  "proximalAvOwnerInstanceId",
  "revision",
  "acceptedAtrialActivationTimeSec",
  "configuration",
  "acceptedState",
  "exactResumeClaim",
] as const);
const CHECKPOINT_KEYS = Object.freeze([
  ...PAYLOAD_KEYS,
  "checkpointSha256",
] as const);

export async function checkpointRecoveryConcealmentAvGateStateV2(
  state: RecoveryConcealmentAvGateAcceptedStateV2,
): Promise<RecoveryConcealmentAvGateCheckpointV2> {
  validateRecoveryConcealmentAvGateStateV2(state);
  const payload = deepFreeze({
    checkpointId: RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    stateSchemaId: RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID,
    configurationId: state.configuration.configurationId,
    proximalAvOwnerInstanceId:
      state.configuration.proximalAvOwnerInstanceId,
    revision: state.revision,
    acceptedAtrialActivationTimeSec:
      state.acceptedAtrialActivationTimeSec,
    configuration: state.configuration,
    acceptedState: state,
    exactResumeClaim: RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_CLAIM_V2,
  }) satisfies RecoveryConcealmentAvGateCheckpointPayloadV2;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only: no migration, ID-only match, or clock rebasing. */
export async function restoreRecoveryConcealmentAvGateStateV2(
  input: unknown,
  expectedConfiguration: RecoveryConcealmentAvGateConfigurationV2,
): Promise<RecoveryConcealmentAvGateAcceptedStateV2> {
  const expected = detachedValidatedConfiguration(expectedConfiguration);
  const checkpointRecord = requirePlainRecord(
    input,
    "proximal AV checkpoint",
  );
  requireExactKeys(checkpointRecord, CHECKPOINT_KEYS, "proximal AV checkpoint");
  canonicalJsonStringify(checkpointRecord);
  assertEnvelope(checkpointRecord);
  const checkpoint = checkpointRecord as unknown as
    RecoveryConcealmentAvGateCheckpointV2;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("proximal AV checkpoint SHA-256 mismatch");
  }
  if (canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(
        RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_CLAIM_V2,
      )) {
    throw new Error("proximal AV checkpoint claim mismatch");
  }

  const restored = detachedFrozenCopy<RecoveryConcealmentAvGateAcceptedStateV2>(
    checkpoint.acceptedState,
  );
  validateRecoveryConcealmentAvGateStateV2(restored);
  const storedConfiguration = detachedFrozenCopy<
    RecoveryConcealmentAvGateConfigurationV2
  >(checkpoint.configuration);
  validateRecoveryConcealmentAvGateConfigurationV2(storedConfiguration);
  const storedJson = canonicalJsonStringify(storedConfiguration);
  if (storedJson !== canonicalJsonStringify(restored.configuration)) {
    throw new Error(
      "proximal AV checkpoint configuration and accepted state split",
    );
  }
  if (storedJson !== canonicalJsonStringify(expected)) {
    throw new Error("proximal AV checkpoint expected configuration mismatch");
  }
  if (checkpoint.configurationId !== restored.configuration.configurationId
    || checkpoint.proximalAvOwnerInstanceId
      !== restored.configuration.proximalAvOwnerInstanceId) {
    throw new Error("proximal AV checkpoint outer owner binding split");
  }
  if (checkpoint.revision !== restored.revision
    || checkpoint.acceptedAtrialActivationTimeSec
      !== restored.acceptedAtrialActivationTimeSec) {
    throw new Error("proximal AV checkpoint outer and accepted clocks split");
  }
  const result = detachedFrozenCopy<RecoveryConcealmentAvGateAcceptedStateV2>(
    restored,
  );
  validateRecoveryConcealmentAvGateStateV2(result);
  return result;
}

function detachedValidatedConfiguration(
  configuration: RecoveryConcealmentAvGateConfigurationV2,
): RecoveryConcealmentAvGateConfigurationV2 {
  validateRecoveryConcealmentAvGateConfigurationV2(configuration);
  return createRecoveryConcealmentAvGateConfigurationV2({
    configurationId: configuration.configurationId,
    proximalAvOwnerInstanceId: configuration.proximalAvOwnerInstanceId,
    parameterProvenance: {
      kind: configuration.parameterProvenance.kind,
      sourceId: configuration.parameterProvenance.sourceId,
    },
    minimumProximalAvConductionDelaySec:
      configuration.minimumProximalAvConductionDelaySec,
    proximalAvRecoveryDelayAmplitudeSec:
      configuration.proximalAvRecoveryDelayAmplitudeSec,
    proximalAvRecoveryTimeConstantSec:
      configuration.proximalAvRecoveryTimeConstantSec,
    postProximalAvOutputRefractorySec:
      configuration.postProximalAvOutputRefractorySec,
    concealedProximalAvRefractoryExtensionSec:
      configuration.concealedProximalAvRefractoryExtensionSec,
  });
}

function assertEnvelope(checkpoint: Record<string, unknown>): void {
  if (checkpoint.checkpointId
      !== RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_V2_ID
    || checkpoint.schemaVersion !== 2
    || checkpoint.stateSchemaId
      !== RECOVERY_CONCEALMENT_AV_GATE_STATE_V2_ID) {
    throw new Error("unsupported proximal AV checkpoint schema");
  }
  if (typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)) {
    throw new Error("proximal AV checkpoint SHA-256 is invalid");
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
  if (actual.length !== required.length
    || actual.some((key, index) => key !== required[index])) {
    throw new Error(`${field} keys are invalid`);
  }
}
