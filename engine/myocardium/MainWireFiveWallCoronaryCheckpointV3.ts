import {
  validateCoronaryAutoregulationWindowBindingV3,
  type CoronaryAcceptedAutoregulationStateV3,
  type CoronaryAutoregulationWindowBindingV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  checkpointMainWireFiveWallCoronaryV2,
  restoreMainWireFiveWallCoronaryV2,
  type MainWireFiveWallCoronaryCheckpointContextV2,
  type MainWireFiveWallCoronaryCheckpointV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryCheckpointV2";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID,
  mainWireFiveWallCoronaryBaseStateV2,
  validateMainWireFiveWallCoronaryAcceptedStateV3,
  wrapMainWireFiveWallCoronaryAcceptedStateV3,
  type MainWireFiveWallCoronaryAcceptedStateV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const MAIN_WIRE_FIVE_WALL_CORONARY_CHECKPOINT_V3_ID =
  "circleheart.main-wire-five-wall-coronary-checkpoint.v3" as const;

export type MainWireFiveWallCoronaryCheckpointContextV3<TWallState> =
  MainWireFiveWallCoronaryCheckpointContextV2<TWallState> & Readonly<{
    coronaryAutoregulationBinding: CoronaryAutoregulationWindowBindingV3;
  }>;

export type MainWireFiveWallCoronaryCheckpointPayloadV3 = Readonly<{
  checkpointId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_CHECKPOINT_V3_ID;
  schemaVersion: 3;
  transactionId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID;
  revision: number;
  acceptedTimeSec: number;
  baseCheckpointV2: MainWireFiveWallCoronaryCheckpointV2;
  coronaryAutoregulationBinding: CoronaryAutoregulationWindowBindingV3;
  coronaryAutoregulation: CoronaryAcceptedAutoregulationStateV3;
}>;

export type MainWireFiveWallCoronaryCheckpointV3 =
  MainWireFiveWallCoronaryCheckpointPayloadV3 & Readonly<{
    checkpointSha256: string;
  }>;

export async function checkpointMainWireFiveWallCoronaryV3<TWallState>(
  context: MainWireFiveWallCoronaryCheckpointContextV3<TWallState>,
  state: MainWireFiveWallCoronaryAcceptedStateV3<TWallState>,
): Promise<MainWireFiveWallCoronaryCheckpointV3> {
  validateMainWireFiveWallCoronaryAcceptedStateV3(state);
  assertBindingEquals(
    state.coronaryAutoregulationBinding,
    context.coronaryAutoregulationBinding,
  );
  const baseCheckpointV2 = await checkpointMainWireFiveWallCoronaryV2(
    context,
    mainWireFiveWallCoronaryBaseStateV2(state),
  );
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_FIVE_WALL_CORONARY_CHECKPOINT_V3_ID,
    schemaVersion: 3 as const,
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    baseCheckpointV2,
    coronaryAutoregulationBinding:
      copyBinding(state.coronaryAutoregulationBinding),
    coronaryAutoregulation: state.coronaryAutoregulation,
  }) satisfies MainWireFiveWallCoronaryCheckpointPayloadV3;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function restoreMainWireFiveWallCoronaryV3<TWallState>(
  context: MainWireFiveWallCoronaryCheckpointContextV3<TWallState>,
  input: unknown,
): Promise<MainWireFiveWallCoronaryAcceptedStateV3<TWallState>> {
  assertCheckpointEnvelopeV3(input);
  const checkpoint = input as MainWireFiveWallCoronaryCheckpointV3;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("five-wall coronary V3 checkpoint SHA-256 mismatch");
  }
  assertBindingEquals(
    checkpoint.coronaryAutoregulationBinding,
    context.coronaryAutoregulationBinding,
  );
  const base = await restoreMainWireFiveWallCoronaryV2(
    context,
    checkpoint.baseCheckpointV2,
  );
  if (base.revision !== checkpoint.revision
    || base.acceptedTimeSec !== checkpoint.acceptedTimeSec) {
    throw new Error("five-wall coronary V3 nested checkpoint clock mismatch");
  }
  const restored = wrapMainWireFiveWallCoronaryAcceptedStateV3(
    base,
    checkpoint.coronaryAutoregulationBinding,
    checkpoint.coronaryAutoregulation,
  );
  validateMainWireFiveWallCoronaryAcceptedStateV3(restored);
  return restored;
}

function assertCheckpointEnvelopeV3(
  input: unknown,
): asserts input is MainWireFiveWallCoronaryCheckpointV3 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("unsupported five-wall coronary V3 checkpoint schema");
  }
  const checkpoint = input as Partial<MainWireFiveWallCoronaryCheckpointV3>;
  if (
    checkpoint.checkpointId !== MAIN_WIRE_FIVE_WALL_CORONARY_CHECKPOINT_V3_ID
    || checkpoint.schemaVersion !== 3
    || checkpoint.transactionId
      !== MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID
  ) throw new Error("unsupported five-wall coronary V3 checkpoint schema");
  assertExactKeys(
    input as object,
    [
      "checkpointId",
      "schemaVersion",
      "transactionId",
      "revision",
      "acceptedTimeSec",
      "baseCheckpointV2",
      "coronaryAutoregulationBinding",
      "coronaryAutoregulation",
      "checkpointSha256",
    ],
    "five-wall coronary V3 checkpoint envelope",
  );
  if (typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)) {
    throw new Error("five-wall coronary V3 checkpoint SHA-256 is invalid");
  }
}

function assertBindingEquals(
  actual: CoronaryAutoregulationWindowBindingV3,
  expected: CoronaryAutoregulationWindowBindingV3,
): void {
  validateCoronaryAutoregulationWindowBindingV3(expected);
  if (canonicalJsonStringify(actual) !== canonicalJsonStringify(expected)) {
    throw new Error("five-wall coronary V3 autoregulation binding mismatch");
  }
}

function assertExactKeys(
  value: object,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} keys mismatch`);
  }
}

function copyBinding(
  binding: CoronaryAutoregulationWindowBindingV3,
): CoronaryAutoregulationWindowBindingV3 {
  return Object.freeze({
    ...binding,
    windowPolicy: Object.freeze({ ...binding.windowPolicy }),
  });
}
