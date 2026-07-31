import {
  ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CLAIM_V2,
  ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_STATE_V2_ID,
  validateAcceptedComposedRhythmTransactionConfigurationV2,
  validateAcceptedComposedRhythmTransactionStateV2,
  type AcceptedComposedRhythmTransactionConfigurationV2,
  type AcceptedComposedRhythmTransactionStateV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import {
  ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_CLAIM_V1,
  checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1,
  restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1,
  type AcceptedAuthoredVentricularPacingReplaySourceCheckpointV1,
} from "@/engine/myocardium/rhythm/acceptedAuthoredVentricularPacingReplaySourceCheckpointV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CHECKPOINT_V2_ID =
  "circleheart.accepted-composed-rhythm-transaction-checkpoint.v2" as const;

export const ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CHECKPOINT_CLAIM_V2 =
  deepFreeze({
    exactResumeScope:
      "complete-transaction-configuration-owned-substates-pending-queues-five-calcium-states-clocks-and-counters" as const,
    externalAfSourceOwnerStateStored: false as const,
    externalAfSourceOwnerCheckpointRequiredSeparately: true as const,
    fullConfigurationStored: true as const,
    completeOwnedAcceptedStateStored: true as const,
    integrity:
      "sha-256-over-complete-canonical-json-payload-for-change-detection" as const,
    authenticationClaimed: false as const,
    expectedConfigurationRequirement:
      "exact-complete-canonical-content-match-not-id-only" as const,
    restoreResult: "detached-recursively-immutable-accepted-state" as const,
    migrationClaimed: false as const,
    clockRebaseClaimed: false as const,
    proximalAvGateV2Ownership:
      ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CLAIM_V2
        .proximalAvGateV2Ownership,
    proximalAvGateV2CompleteAcceptedStateStored: true as const,
    authoredVentricularPacingReplay: Object.freeze({
      optionalNestedCheckpointStored: true as const,
      nullWhenSourceNotConfigured: true as const,
      completeAcceptedOwnerStateStored: true as const,
      nestedIntegrity:
        ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_CLAIM_V1,
      nestedStateCrossCheckedAgainstTransactionAcceptedState: true as const,
    }),
    transactionSemantics: ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CLAIM_V2,
  });

export type AcceptedComposedRhythmTransactionCheckpointPayloadV2 = Readonly<{
  checkpointId: typeof ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  stateSchemaId: typeof ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_STATE_V2_ID;
  revision: number;
  acceptedTimeSec: number;
  configuration: AcceptedComposedRhythmTransactionConfigurationV2;
  acceptedState: AcceptedComposedRhythmTransactionStateV2;
  authoredVentricularPacingReplay:
    AcceptedAuthoredVentricularPacingReplaySourceCheckpointV1 | null;
  exactResumeClaim:
    typeof ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CHECKPOINT_CLAIM_V2;
}>;

export type AcceptedComposedRhythmTransactionCheckpointV2 =
  AcceptedComposedRhythmTransactionCheckpointPayloadV2 & Readonly<{
    checkpointSha256: string;
  }>;

export async function checkpointAcceptedComposedRhythmTransactionStateV2(
  state: AcceptedComposedRhythmTransactionStateV2,
): Promise<AcceptedComposedRhythmTransactionCheckpointV2> {
  validateAcceptedComposedRhythmTransactionStateV2(state);
  const authoredVentricularPacingReplay =
    state.authoredVentricularPacingReplayState === null
      ? null
      : await checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        state.authoredVentricularPacingReplayState,
      );
  const payload = deepFreeze({
    checkpointId: ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    stateSchemaId: ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_STATE_V2_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    configuration: state.configuration,
    acceptedState: state,
    authoredVentricularPacingReplay,
    exactResumeClaim:
      ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CHECKPOINT_CLAIM_V2,
  }) satisfies AcceptedComposedRhythmTransactionCheckpointPayloadV2;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function restoreAcceptedComposedRhythmTransactionStateV2(
  input: unknown,
  expectedConfiguration: AcceptedComposedRhythmTransactionConfigurationV2,
): Promise<AcceptedComposedRhythmTransactionStateV2> {
  validateAcceptedComposedRhythmTransactionConfigurationV2(
    expectedConfiguration,
  );
  const record = requirePlainRecord(input, "composed rhythm checkpoint");
  requireExactKeys(record, [
    "checkpointId", "schemaVersion", "stateSchemaId", "revision",
    "acceptedTimeSec", "configuration", "acceptedState", "exactResumeClaim",
    "authoredVentricularPacingReplay",
    "checkpointSha256",
  ], "composed rhythm checkpoint");
  canonicalJsonStringify(record);
  if (
    record.checkpointId
      !== ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CHECKPOINT_V2_ID
    || record.schemaVersion !== 2
    || record.stateSchemaId
      !== ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_STATE_V2_ID
  ) {
    throw new Error("unsupported composed rhythm checkpoint schema");
  }
  if (
    typeof record.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.checkpointSha256)
  ) {
    throw new Error("composed rhythm checkpoint SHA-256 is invalid");
  }
  const checkpoint = record as unknown as
    AcceptedComposedRhythmTransactionCheckpointV2;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("composed rhythm checkpoint SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(
        ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_CHECKPOINT_CLAIM_V2,
      )
  ) {
    throw new Error("composed rhythm checkpoint claim mismatch");
  }
  const restored = detachedFrozenCopy<
    AcceptedComposedRhythmTransactionStateV2
  >(checkpoint.acceptedState);
  const storedConfiguration = detachedFrozenCopy<
    AcceptedComposedRhythmTransactionConfigurationV2
  >(checkpoint.configuration);
  validateAcceptedComposedRhythmTransactionConfigurationV2(
    storedConfiguration,
  );
  validateAcceptedComposedRhythmTransactionStateV2(restored);
  const storedJson = canonicalJsonStringify(storedConfiguration);
  if (storedJson !== canonicalJsonStringify(restored.configuration)) {
    throw new Error("composed rhythm checkpoint configuration and state split");
  }
  if (storedJson !== canonicalJsonStringify(expectedConfiguration)) {
    throw new Error("composed rhythm checkpoint expected configuration mismatch");
  }
  if (
    checkpoint.revision !== restored.revision
    || checkpoint.acceptedTimeSec !== restored.acceptedTimeSec
  ) {
    throw new Error("composed rhythm checkpoint outer and state clocks split");
  }
  const expectedPacingConfiguration =
    storedConfiguration.authoredVentricularPacingReplay;
  if (expectedPacingConfiguration === null) {
    if (
      checkpoint.authoredVentricularPacingReplay !== null
      || restored.authoredVentricularPacingReplayState !== null
    ) {
      throw new Error(
        "composed rhythm checkpoint authored pacing replay null ownership split",
      );
    }
  } else {
    if (
      checkpoint.authoredVentricularPacingReplay === null
      || restored.authoredVentricularPacingReplayState === null
    ) {
      throw new Error(
        "composed rhythm checkpoint authored pacing replay owner is missing",
      );
    }
    const nestedPacingState =
      await restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        checkpoint.authoredVentricularPacingReplay,
        expectedPacingConfiguration,
      );
    if (
      canonicalJsonStringify(nestedPacingState)
        !== canonicalJsonStringify(
          restored.authoredVentricularPacingReplayState,
        )
    ) {
      throw new Error(
        "composed rhythm checkpoint authored pacing replay nested state split",
      );
    }
  }
  return restored;
}

function detachedFrozenCopy<T>(input: unknown): T {
  return deepFreeze(JSON.parse(canonicalJsonStringify(input)) as T);
}

function requirePlainRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
