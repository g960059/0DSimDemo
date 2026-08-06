import {
  ACCEPTED_COMPOSED_RHYTHM_TRANSACTION_STATE_V2_ID,
  validateAcceptedComposedRhythmTransactionConfigurationV2,
  validateAcceptedComposedRhythmTransactionStateV2,
  type AcceptedComposedRhythmTransactionConfigurationV2,
  type AcceptedComposedRhythmTransactionStateV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import {
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
    "acceptedTimeSec", "configuration", "acceptedState",
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
