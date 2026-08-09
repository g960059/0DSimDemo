import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  validateAndOwnMainWireIntegratedModelCompletedBeatMetricsV3,
  type MainWireIntegratedModelBeatAccumulatorCheckpointV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type {
  MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V1_ID =
  "circleheart.main-wire-integrated-model-standard-exact-checkpoint.v1" as const;

export type MainWireIntegratedModelStandardCheckpointPayloadV1 = Readonly<{
  checkpointId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  revision: number;
  acceptedTimeSec: number;
  numericalCheckpoint: MainWireIntegratedModelCheckpointV3;
  beatAccumulator: MainWireIntegratedModelBeatAccumulatorCheckpointV3;
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
}>;

export type MainWireIntegratedModelStandardCheckpointV1 =
  MainWireIntegratedModelStandardCheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

export type RestoredMainWireIntegratedModelStandardCheckpointV1<TWallState> =
  Readonly<{
    acceptedState: MainWireIntegratedModelAcceptedStateV3<TWallState>;
    beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
    completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
  }>;

export async function checkpointMainWireIntegratedModelStandardV1<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV3<TWallState>,
  state: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3,
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null,
): Promise<MainWireIntegratedModelStandardCheckpointV1> {
  // Own every exact-output accumulator value before the first await so a
  // later Worker message cannot splice a newer beat into this accepted state.
  const beatAccumulatorCheckpoint = beatAccumulator.checkpoint();
  const capturedCompletedBeatMetrics = completedBeatMetrics;
  const numericalCheckpoint = await checkpointMainWireIntegratedModelV3(
    context,
    state,
  );
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    numericalCheckpoint,
    beatAccumulator: beatAccumulatorCheckpoint,
    completedBeatMetrics: capturedCompletedBeatMetrics,
  }) satisfies MainWireIntegratedModelStandardCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function restoreMainWireIntegratedModelStandardV1<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV3<TWallState>,
  input: unknown,
): Promise<RestoredMainWireIntegratedModelStandardCheckpointV1<TWallState>> {
  const checkpoint = await validateMainWireIntegratedModelStandardCheckpointV1(
    input,
  );
  const acceptedState = await restoreMainWireIntegratedModelV3(
    context,
    checkpoint.numericalCheckpoint,
  );
  const beatAccumulator = MainWireIntegratedModelBeatAccumulatorV3.restore(
    checkpoint.beatAccumulator,
  );
  const completedBeatMetrics = checkpoint.completedBeatMetrics === null
    ? null
    : validateAndOwnMainWireIntegratedModelCompletedBeatMetricsV3(
      checkpoint.completedBeatMetrics,
    );
  return Object.freeze({
    acceptedState,
    beatAccumulator,
    completedBeatMetrics,
  });
}

/**
 * Validates the Standard exact wrapper before another exact-model boundary
 * reads its nested numerical checkpoint. Numerical checkpoint semantics stay
 * owned by the legacy V5 codec; the wrapper additionally owns exact beat
 * accumulator state and binds both layers to one accepted clock and digest.
 */
export async function validateMainWireIntegratedModelStandardCheckpointV1(
  input: unknown,
): Promise<MainWireIntegratedModelStandardCheckpointV1> {
  assertStandardCheckpointEnvelopeV1(input);
  const checkpoint = input;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("integrated Standard checkpoint SHA-256 mismatch");
  }
  if (
    checkpoint.numericalCheckpoint.revision !== checkpoint.revision
    || checkpoint.numericalCheckpoint.acceptedTimeSec
      !== checkpoint.acceptedTimeSec
  ) {
    throw new Error("integrated Standard checkpoint owner clocks differ");
  }
  return checkpoint;
}

function assertStandardCheckpointEnvelopeV1(
  input: unknown,
): asserts input is MainWireIntegratedModelStandardCheckpointV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("integrated Standard checkpoint must be a plain object");
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("integrated Standard checkpoint must be a plain object");
  }
  const keys = Reflect.ownKeys(input);
  const expected = [
    "checkpointId",
    "schemaVersion",
    "revision",
    "acceptedTimeSec",
    "numericalCheckpoint",
    "beatAccumulator",
    "completedBeatMetrics",
    "checkpointSha256",
  ].sort();
  if (
    keys.some((key) => typeof key !== "string")
    || keys.length !== expected.length
    || (keys as string[]).sort().some((key, index) => key !== expected[index])
  ) {
    throw new Error("integrated Standard checkpoint has unexpected fields");
  }
  const checkpoint = input as Partial<MainWireIntegratedModelStandardCheckpointV1>;
  if (
    checkpoint.checkpointId
      !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V1_ID
    || checkpoint.schemaVersion !== 1
  ) {
    throw new Error("unsupported integrated Standard checkpoint schema");
  }
  if (
    typeof checkpoint.revision !== "number"
    || !Number.isSafeInteger(checkpoint.revision)
    || checkpoint.revision < 0
    || typeof checkpoint.acceptedTimeSec !== "number"
    || !Number.isFinite(checkpoint.acceptedTimeSec)
    || checkpoint.acceptedTimeSec < 0
  ) {
    throw new Error("integrated Standard checkpoint clock is invalid");
  }
  if (
    typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)
  ) {
    throw new Error("integrated Standard checkpoint SHA-256 is invalid");
  }
}
