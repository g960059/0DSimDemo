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
import {
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type {
  MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V2_ID =
  "circleheart.main-wire-integrated-model-standard-exact-checkpoint.v2" as const;

export type MainWireIntegratedModelStandardCheckpointContextV2<TWallState> =
  Readonly<
    MainWireIntegratedModelCheckpointContextV3<TWallState>
    & {
      mechanismResearchInputs:
        MainWireIntegratedModelMechanismResearchInputsV3;
    }
  >;

export type MainWireIntegratedModelStandardCheckpointPayloadV2 = Readonly<{
  checkpointId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  revision: number;
  acceptedTimeSec: number;
  mechanismResearchInputIdentitySha256: string;
  numericalCheckpoint: MainWireIntegratedModelCheckpointV3;
  beatAccumulator: MainWireIntegratedModelBeatAccumulatorCheckpointV3;
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
}>;

export type MainWireIntegratedModelStandardCheckpointV2 =
  MainWireIntegratedModelStandardCheckpointPayloadV2 & Readonly<{
    checkpointSha256: string;
  }>;

export type RestoredMainWireIntegratedModelStandardCheckpointV2<TWallState> =
  Readonly<{
    acceptedState: MainWireIntegratedModelAcceptedStateV3<TWallState>;
    beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
    completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
  }>;

export async function checkpointMainWireIntegratedModelStandardV2<TWallState>(
  context: MainWireIntegratedModelStandardCheckpointContextV2<TWallState>,
  state: MainWireIntegratedModelAcceptedStateV3<TWallState>,
  beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3,
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null,
): Promise<MainWireIntegratedModelStandardCheckpointV2> {
  // Own every exact-output accumulator and fixture value before the first
  // await so one checkpoint cannot splice state from another fixture epoch.
  const beatAccumulatorCheckpoint = beatAccumulator.checkpoint();
  const capturedCompletedBeatMetrics = completedBeatMetrics;
  const ownedMechanismResearchInputs =
    validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
      context.mechanismResearchInputs,
    );
  const [numericalCheckpoint, mechanismResearchInputIdentitySha256] =
    await Promise.all([
      checkpointMainWireIntegratedModelV3(context, state),
      sha256CanonicalJsonHex(ownedMechanismResearchInputs),
    ]);
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    mechanismResearchInputIdentitySha256,
    numericalCheckpoint,
    beatAccumulator: beatAccumulatorCheckpoint,
    completedBeatMetrics: capturedCompletedBeatMetrics,
  }) satisfies MainWireIntegratedModelStandardCheckpointPayloadV2;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function restoreMainWireIntegratedModelStandardV2<TWallState>(
  context: MainWireIntegratedModelStandardCheckpointContextV2<TWallState>,
  input: unknown,
): Promise<RestoredMainWireIntegratedModelStandardCheckpointV2<TWallState>> {
  const checkpoint = await validateMainWireIntegratedModelStandardCheckpointV2(
    input,
  );
  const expectedMechanismResearchInputIdentitySha256 =
    await sha256CanonicalJsonHex(
      validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
        context.mechanismResearchInputs,
      ),
    );
  if (
    checkpoint.mechanismResearchInputIdentitySha256
      !== expectedMechanismResearchInputIdentitySha256
  ) {
    throw new Error(
      "integrated Standard checkpoint mechanism research input SHA-256 identity mismatch",
    );
  }
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
 * reads its nested numerical checkpoint. V2 additionally binds the complete
 * validated mechanism tuple that can affect Standard exact outputs.
 */
export async function validateMainWireIntegratedModelStandardCheckpointV2(
  input: unknown,
): Promise<MainWireIntegratedModelStandardCheckpointV2> {
  assertStandardCheckpointEnvelopeV2(input);
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

function assertStandardCheckpointEnvelopeV2(
  input: unknown,
): asserts input is MainWireIntegratedModelStandardCheckpointV2 {
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
    "mechanismResearchInputIdentitySha256",
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
  const checkpoint = input as Partial<MainWireIntegratedModelStandardCheckpointV2>;
  if (
    checkpoint.checkpointId
      !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD_CHECKPOINT_V2_ID
    || checkpoint.schemaVersion !== 2
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
    typeof checkpoint.mechanismResearchInputIdentitySha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(
      checkpoint.mechanismResearchInputIdentitySha256,
    )
  ) {
    throw new Error(
      "integrated Standard checkpoint mechanism research input SHA-256 is invalid",
    );
  }
  if (
    typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)
  ) {
    throw new Error("integrated Standard checkpoint SHA-256 is invalid");
  }
}
