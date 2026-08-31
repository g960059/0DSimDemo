import {
  validateMainWireIntegratedModelStandard66CheckpointV1,
  type MainWireIntegratedModelStandard66CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66CheckpointV1";
import {
  decodeCanonicalFlatCheckpointV1,
  encodeCanonicalFlatCheckpointV1,
} from "@/engine/vnext/CanonicalFlatDataV1";
import {
  validateAndOwnMainWireFiveWallCoupledPredictorCheckpointV2,
  type MainWireFiveWallCoupledPredictorCheckpointV2,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledPredictorV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CANONICAL_CHECKPOINT_V3_ID =
  "circleheart-main-wire-integrated-model-standard66-canonical-checkpoint-v3" as const;

export type MainWireIntegratedModelStandard66CanonicalCheckpointV3 = Readonly<{
  checkpointId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CANONICAL_CHECKPOINT_V3_ID;
  schemaVersion: 3;
  revision: number;
  acceptedTimeSec: number;
  standard66Checkpoint: MainWireIntegratedModelStandard66CheckpointV1;
  coupledPredictor: MainWireFiveWallCoupledPredictorCheckpointV2;
}>;

/**
 * Owns both exact branches before the first digest await, checks their shared
 * accepted epoch, and writes one canonical binary envelope. The Standard66
 * object wrapper continues to own numerical continuation semantics; this V3
 * boundary adds only algorithmic predictor history.
 */
export async function encodeMainWireIntegratedModelStandard66CanonicalCheckpointV3(
  standard66CheckpointInput: unknown,
  coupledPredictorInput: unknown,
): Promise<Uint8Array> {
  const standard66CheckpointPromise =
    validateMainWireIntegratedModelStandard66CheckpointV1(
      standard66CheckpointInput,
    );
  const coupledPredictor =
    validateAndOwnMainWireFiveWallCoupledPredictorCheckpointV2(
      coupledPredictorInput,
    );
  const standard66Checkpoint = await standard66CheckpointPromise;
  assertPredictorAcceptedClockV3(
    standard66Checkpoint.revision,
    standard66Checkpoint.acceptedTimeSec,
    coupledPredictor,
  );
  return encodeCanonicalFlatCheckpointV1(Object.freeze({
    checkpointId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CANONICAL_CHECKPOINT_V3_ID,
    schemaVersion: 3 as const,
    revision: standard66Checkpoint.revision,
    acceptedTimeSec: standard66Checkpoint.acceptedTimeSec,
    standard66Checkpoint,
    coupledPredictor,
  }) satisfies MainWireIntegratedModelStandard66CanonicalCheckpointV3);
}

/** Decodes, recursively owns, and cross-validates one canonical V3 image. */
export async function decodeMainWireIntegratedModelStandard66CanonicalCheckpointV3(
  input: Uint8Array,
): Promise<MainWireIntegratedModelStandard66CanonicalCheckpointV3> {
  return validateAndOwnMainWireIntegratedModelStandard66CanonicalCheckpointV3(
    await decodeCanonicalFlatCheckpointV1(input),
  );
}

export async function validateAndOwnMainWireIntegratedModelStandard66CanonicalCheckpointV3(
  input: unknown,
): Promise<MainWireIntegratedModelStandard66CanonicalCheckpointV3> {
  const record = plainExactRecordV3(
    input,
    [
      "checkpointId",
      "schemaVersion",
      "revision",
      "acceptedTimeSec",
      "standard66Checkpoint",
      "coupledPredictor",
    ],
  );
  const checkpointId = ownDataValueV3(record, "checkpointId");
  const schemaVersion = ownDataValueV3(record, "schemaVersion");
  const revision = ownDataValueV3(record, "revision");
  const acceptedTimeSec = ownDataValueV3(record, "acceptedTimeSec");
  if (
    checkpointId
      !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CANONICAL_CHECKPOINT_V3_ID
    || schemaVersion !== 3
  ) {
    throw new Error("unsupported Standard66 canonical checkpoint schema");
  }
  if (
    typeof revision !== "number"
    || !Number.isSafeInteger(revision)
    || revision < 0
    || typeof acceptedTimeSec !== "number"
    || !Number.isFinite(acceptedTimeSec)
    || acceptedTimeSec < 0
  ) {
    throw new Error("Standard66 canonical checkpoint clock is invalid");
  }

  // Both nested validators detach synchronously before either digest can
  // yield, so a direct object caller cannot splice epochs during validation.
  const standard66CheckpointPromise =
    validateMainWireIntegratedModelStandard66CheckpointV1(
      ownDataValueV3(record, "standard66Checkpoint"),
    );
  const coupledPredictor =
    validateAndOwnMainWireFiveWallCoupledPredictorCheckpointV2(
      ownDataValueV3(record, "coupledPredictor"),
    );
  const standard66Checkpoint = await standard66CheckpointPromise;
  if (
    revision !== standard66Checkpoint.revision
    || !Object.is(acceptedTimeSec, standard66Checkpoint.acceptedTimeSec)
  ) {
    throw new Error("Standard66 canonical checkpoint owner clocks differ");
  }
  assertPredictorAcceptedClockV3(
    revision,
    acceptedTimeSec,
    coupledPredictor,
  );
  return Object.freeze({
    checkpointId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CANONICAL_CHECKPOINT_V3_ID,
    schemaVersion: 3 as const,
    revision,
    acceptedTimeSec,
    standard66Checkpoint,
    coupledPredictor,
  });
}

function assertPredictorAcceptedClockV3(
  revision: number,
  acceptedTimeSec: number,
  predictor: MainWireFiveWallCoupledPredictorCheckpointV2,
): void {
  // An empty predictor is legitimate both for a cold Session and immediately
  // after an object-only restore. A retained history, however, is usable only
  // at the exact accepted epoch from which its current root was recorded.
  if (predictor.historyDepth === 0) return;
  if (
    predictor.expectedBaseRevision !== revision
    || !Object.is(
      predictor.expectedBaseAcceptedTimeSec,
      acceptedTimeSec,
    )
  ) {
    throw new Error(
      "Standard66 canonical predictor clock differs from accepted state",
    );
  }
}

function plainExactRecordV3(
  input: unknown,
  expectedKeys: readonly string[],
): object {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Standard66 canonical checkpoint must be a plain object");
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("Standard66 canonical checkpoint must be a plain object");
  }
  const keys = Reflect.ownKeys(input);
  const expected = [...expectedKeys].sort();
  if (
    keys.some((key) => typeof key !== "string")
    || keys.length !== expected.length
    || (keys as string[]).sort().some((key, index) => key !== expected[index])
  ) {
    throw new Error(
      "Standard66 canonical checkpoint has unexpected fields",
    );
  }
  return input;
}

function ownDataValueV3(record: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) {
    throw new Error(
      `Standard66 canonical checkpoint ${key} must be a data field`,
    );
  }
  return descriptor.value;
}
