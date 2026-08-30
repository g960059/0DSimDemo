import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
  validateMainWireSelectedAorticOutflowCirculationProfileV1,
  type MainWireSelectedAorticOutflowCirculationProfileV1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  MainWireAorticRecoveredRootPortBeatAccumulatorV1,
  validateAndOwnMainWireAorticRecoveredRootPortCompletedBeatMetricsV1,
  type MainWireAorticRecoveredRootPortCompletedBeatMetricsV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortBeatMetricsV1";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  validateAndOwnMainWireIntegratedModelCompletedBeatMetricsV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  validateMainWireIntegratedModelStandardCheckpointV2,
  type MainWireIntegratedModelStandardCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRelaxationProfileV1";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1_ID,
} from "@/engine/valves/MainWireAorticRecoveredRootProfileV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  decodeCanonicalFlatDataV1,
  encodeCanonicalFlatDataIntoV1,
  measureCanonicalFlatDataV1,
} from "@/engine/vnext/CanonicalFlatDataV1";
import {
  MainWireSelectedAorticPortSessionExtensionV1,
  type MainWireSelectedAorticPortExactBeatStateCheckpointV1,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID =
  "circleheart.main-wire-integrated-model-standard66-exact-checkpoint.v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1 =
  deepFreezeV1({
    fixtureId:
      MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
    ventricularMaterialProfileId:
      MAIN_WIRE_VENTRICULAR_LAND_ET_RELAXATION_PROFILE_V1_ID,
    aorticOutflowCirculationProfileId:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1.profileId,
    aorticRecoveredRootProfileId:
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1_ID,
    aorticValveEvaluatorId:
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
    matchedAlphaRegularSinusProfileId:
      MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
    matchedAlphaCalciumLawId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_V1_ID,
    matchedAlphaCalciumPersistenceId:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_EXACT_PERSISTENCE_V1_ID,
  });

export type MainWireIntegratedModelStandard66SelectedIdentityV1 =
  typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1;

/**
 * Construction identity supplied by the selected fixture owner. The returned
 * context owns the one fixed profile value, so a later caller mutation cannot
 * splice a different profile into an in-flight checkpoint.
 */
export type MainWireIntegratedModelStandard66CheckpointContextV1 = Readonly<{
  fixedAssemblyId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID;
  selectedAorticOutflowProfile:
    MainWireSelectedAorticOutflowCirculationProfileV1;
}>;

export type MainWireIntegratedModelStandard66CheckpointPayloadV1 = Readonly<{
  checkpointId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  revision: number;
  acceptedTimeSec: number;
  selectedModelIdentity:
    MainWireIntegratedModelStandard66SelectedIdentityV1;
  selectedAorticOutflowProfileIdentitySha256: string;
  baseStandardCheckpointV2:
    MainWireIntegratedModelStandardCheckpointV2;
  selectedAorticPortExactBeatState:
    MainWireSelectedAorticPortExactBeatStateCheckpointV1;
}>;

export type MainWireIntegratedModelStandard66CheckpointV1 =
  MainWireIntegratedModelStandard66CheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

export function createMainWireIntegratedModelStandard66CheckpointContextV1(
  input: Readonly<{
    fixedAssemblyId: unknown;
    selectedAorticOutflowProfile: unknown;
  }>,
): MainWireIntegratedModelStandard66CheckpointContextV1 {
  const record = plainExactRecordV1(
    input,
    ["fixedAssemblyId", "selectedAorticOutflowProfile"],
    "Standard66 checkpoint context",
  );
  if (
    record.fixedAssemblyId
      !== MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID
  ) {
    throw new Error("Standard66 checkpoint fixture identity mismatch");
  }
  const profile = record.selectedAorticOutflowProfile;
  if (profile === null || typeof profile !== "object" || Array.isArray(profile)) {
    throw new Error("Standard66 checkpoint selected profile must be an object");
  }
  const issues = validateMainWireSelectedAorticOutflowCirculationProfileV1(
    profile as MainWireSelectedAorticOutflowCirculationProfileV1,
  );
  if (issues.length > 0) {
    throw new Error(
      `Standard66 checkpoint selected profile mismatch: ${issues.join("; ")}`,
    );
  }
  return Object.freeze({
    fixedAssemblyId:
      MAIN_WIRE_INTEGRATED_MODEL_SELECTED_AORTIC_OUTFLOW_FIXTURE_V1_ID,
    selectedAorticOutflowProfile:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
  });
}

/**
 * Wraps the unchanged Standard V2 numerical/exact-output checkpoint together
 * with the selected aortic analysis state. No 76-f64 instantaneous readback is
 * persisted; it is reconstructed only by a later accepted step.
 */
export async function checkpointMainWireIntegratedModelStandard66V1(
  context: MainWireIntegratedModelStandard66CheckpointContextV1,
  baseStandardCheckpointV2: unknown,
  selectedAorticPortExactBeatState: unknown,
): Promise<MainWireIntegratedModelStandard66CheckpointV1> {
  const ownedContext =
    createMainWireIntegratedModelStandard66CheckpointContextV1(context);
  // Detach both caller-owned trees synchronously. The nested validators and
  // SHA operations await WebCrypto, so retaining either input would permit a
  // later task to splice a different accepted epoch into this checkpoint.
  const detachedBaseStandardCheckpointV2 =
    detachedFrozenCheckpointSnapshotV1<
      MainWireIntegratedModelStandardCheckpointV2
    >(baseStandardCheckpointV2);
  const detachedSelectedExactBeatState = detachedFrozenCheckpointSnapshotV1<
    MainWireSelectedAorticPortExactBeatStateCheckpointV1
  >(selectedAorticPortExactBeatState);
  const ownedSelectedExactBeatState = ownSelectedExactBeatStateV1(
    detachedSelectedExactBeatState,
  );
  const [ownedBaseStandardCheckpointV2, selectedProfileSha256] =
    await Promise.all([
      validateMainWireIntegratedModelStandardCheckpointV2(
        detachedBaseStandardCheckpointV2,
      ),
      sha256CanonicalJsonHex(ownedContext.selectedAorticOutflowProfile),
    ]);
  assertSynchronizedExactBeatStatesV1(
    ownedBaseStandardCheckpointV2,
    ownedSelectedExactBeatState,
  );
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    revision: ownedBaseStandardCheckpointV2.revision,
    acceptedTimeSec: ownedBaseStandardCheckpointV2.acceptedTimeSec,
    selectedModelIdentity:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1,
    selectedAorticOutflowProfileIdentitySha256: selectedProfileSha256,
    baseStandardCheckpointV2: ownedBaseStandardCheckpointV2,
    selectedAorticPortExactBeatState: detachedSelectedExactBeatState,
  }) satisfies MainWireIntegratedModelStandard66CheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/**
 * Owns and validates the complete object wrapper. Restore of the numerical
 * state deliberately remains with a future Standard66 Session seam; this
 * module does not reinterpret the embedded Standard V2 owner.
 */
export async function validateMainWireIntegratedModelStandard66CheckpointV1(
  input: unknown,
): Promise<MainWireIntegratedModelStandard66CheckpointV1> {
  // Snapshot at function entry, before the first digest await. Validation
  // returns this recursively frozen owner rather than the caller's object.
  const checkpoint = detachedFrozenCheckpointSnapshotV1<
    MainWireIntegratedModelStandard66CheckpointV1
  >(input);
  assertCheckpointEnvelopeV1(checkpoint);
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("Standard66 checkpoint outer SHA-256 mismatch");
  }
  assertSelectedIdentityV1(checkpoint.selectedModelIdentity);
  const expectedSelectedProfileSha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
  );
  if (
    checkpoint.selectedAorticOutflowProfileIdentitySha256
      !== expectedSelectedProfileSha256
  ) {
    throw new Error("Standard66 checkpoint selected profile identity mismatch");
  }
  const [ownedBase, ownedSelected] = await Promise.all([
    validateMainWireIntegratedModelStandardCheckpointV2(
      checkpoint.baseStandardCheckpointV2,
    ),
    Promise.resolve(
      ownSelectedExactBeatStateV1(
        checkpoint.selectedAorticPortExactBeatState,
      ),
    ),
  ]);
  if (
    checkpoint.revision !== ownedBase.revision
    || !Object.is(
      checkpoint.acceptedTimeSec,
      ownedBase.acceptedTimeSec,
    )
  ) {
    throw new Error("Standard66 checkpoint owner clocks differ");
  }
  assertSynchronizedExactBeatStatesV1(ownedBase, ownedSelected);
  return checkpoint;
}

function ownSelectedExactBeatStateV1(
  input: unknown,
): MainWireSelectedAorticPortExactBeatStateCheckpointV1 {
  return MainWireSelectedAorticPortSessionExtensionV1
    .restoreExactBeatStateV1(input)
    .checkpointExactBeatStateV1();
}

function assertSynchronizedExactBeatStatesV1(
  base: MainWireIntegratedModelStandardCheckpointV2,
  selected: MainWireSelectedAorticPortExactBeatStateCheckpointV1,
): void {
  const baseAccumulator = MainWireIntegratedModelBeatAccumulatorV3
    .restore(base.beatAccumulator)
    .checkpoint();
  const selectedAccumulator = MainWireAorticRecoveredRootPortBeatAccumulatorV1
    .restore(selected.selectedBeatAccumulator)
    .checkpoint();
  const baseLatest = ownBaseLatestMetricsV1(base.completedBeatMetrics);
  const selectedLatest = ownSelectedLatestMetricsV1(
    selected.latestCompletedBeatMetrics,
  );
  const baseActive = baseAccumulator.active;
  const selectedActive = selectedAccumulator.active;

  if ((baseActive === null) !== (selectedActive === null)) {
    throw new Error("Standard66 base and selected active-beat availability differs");
  }
  if (baseActive !== null && selectedActive !== null) {
    if (
      baseActive.startAtrialCaptureId
        !== selectedActive.startAtrialCaptureId
      || !Object.is(baseActive.startTimeSec, selectedActive.startTimeSec)
      || !Object.is(
        baseActive.previous.timeSec,
        selectedActive.previous.timeSec,
      )
      || !Object.is(baseActive.previous.timeSec, base.acceptedTimeSec)
      || !Object.is(selectedActive.previous.timeSec, base.acceptedTimeSec)
      || !Object.is(
        baseActive.previous.aorticValveFlowMlPerSec,
        selectedActive.previous.aorticValveFlowMlPerSec,
      )
      || !Object.is(
        baseActive.valveForwardPressureGradientAccumulators.AoV
          .forwardFlowDurationSec,
        selectedActive.forwardFlowDurationSec,
      )
    ) {
      throw new Error("Standard66 base and selected active beats differ");
    }
  }

  if ((baseLatest === null) !== (selectedLatest === null)) {
    throw new Error(
      "Standard66 base and selected completed-beat availability differs",
    );
  }
  if (baseLatest === null || selectedLatest === null) return;
  if (
    baseActive === null
    || selectedActive === null
    || baseLatest.startAtrialCaptureId
      !== selectedLatest.startAtrialCaptureId
    || baseLatest.endAtrialCaptureId !== selectedLatest.endAtrialCaptureId
    || !Object.is(baseLatest.startTimeSec, selectedLatest.startTimeSec)
    || !Object.is(baseLatest.endTimeSec, selectedLatest.endTimeSec)
    || !Object.is(baseLatest.durationSec, selectedLatest.durationSec)
    || baseLatest.endTimeSec > base.acceptedTimeSec
    || baseActive.startAtrialCaptureId !== baseLatest.endAtrialCaptureId
    || selectedActive.startAtrialCaptureId
      !== selectedLatest.endAtrialCaptureId
    || !Object.is(baseActive.startTimeSec, baseLatest.endTimeSec)
    || !Object.is(selectedActive.startTimeSec, selectedLatest.endTimeSec)
    || !Object.is(
      baseLatest.valveForwardPressureGradients.AoV.forwardFlowDurationSec,
      selectedLatest.localValveForwardPressureGradient.forwardFlowDurationSec,
    )
    || !Object.is(
      selectedLatest.localValveForwardPressureGradient.forwardFlowDurationSec,
      selectedLatest.venaContractaBernoulliForwardPressureGradient
        .forwardFlowDurationSec,
    )
  ) {
    throw new Error("Standard66 base and selected completed beats differ");
  }
}

function ownBaseLatestMetricsV1(
  input: unknown,
): MainWireIntegratedModelCompletedBeatMetricsV3 | null {
  return input === null
    ? null
    : validateAndOwnMainWireIntegratedModelCompletedBeatMetricsV3(input);
}

function ownSelectedLatestMetricsV1(
  input: unknown,
): MainWireAorticRecoveredRootPortCompletedBeatMetricsV1 | null {
  return input === null
    ? null
    : validateAndOwnMainWireAorticRecoveredRootPortCompletedBeatMetricsV1(
      input,
    );
}

function assertCheckpointEnvelopeV1(
  input: unknown,
): asserts input is MainWireIntegratedModelStandard66CheckpointV1 {
  const record = plainExactRecordV1(
    input,
    [
      "checkpointId",
      "schemaVersion",
      "revision",
      "acceptedTimeSec",
      "selectedModelIdentity",
      "selectedAorticOutflowProfileIdentitySha256",
      "baseStandardCheckpointV2",
      "selectedAorticPortExactBeatState",
      "checkpointSha256",
    ],
    "Standard66 checkpoint",
  );
  if (
    record.checkpointId
      !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID
    || record.schemaVersion !== 1
  ) {
    throw new Error("unsupported Standard66 checkpoint schema");
  }
  if (
    typeof record.revision !== "number"
    || !Number.isSafeInteger(record.revision)
    || record.revision < 0
    || typeof record.acceptedTimeSec !== "number"
    || !Number.isFinite(record.acceptedTimeSec)
    || record.acceptedTimeSec < 0
  ) {
    throw new Error("Standard66 checkpoint clock is invalid");
  }
  for (const [label, value] of [
    [
      "selected profile identity",
      record.selectedAorticOutflowProfileIdentitySha256,
    ],
    ["outer", record.checkpointSha256],
  ] as const) {
    if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
      throw new Error(`Standard66 checkpoint ${label} SHA-256 is invalid`);
    }
  }
}

function assertSelectedIdentityV1(input: unknown): void {
  const expected = MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1;
  const record = plainExactRecordV1(
    input,
    Object.keys(expected),
    "Standard66 selected model identity",
  );
  for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
    if (record[key] !== expected[key]) {
      throw new Error("Standard66 selected model identity mismatch");
    }
  }
}

function plainExactRecordV1(
  input: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${label} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label} must be a plain object`);
  }
  const ownKeys = Reflect.ownKeys(input);
  if (ownKeys.some((key) => typeof key !== "string")) {
    throw new Error(`${label} contains a non-string key`);
  }
  const actual = [...(ownKeys as string[])].sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} has an unexpected field set`);
  }
  return input as Record<string, unknown>;
}

function deepFreezeV1<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeV1(child);
    }
    Object.freeze(value);
  }
  return value;
}

/**
 * Canonical-flat encode/decode provides a synchronous detached data owner and
 * preserves the complete IEEE-754 primitive, including signed zero. The
 * canonical-JSON preflight deliberately narrows this object checkpoint to its
 * existing JSON data model (no typed arrays, accessors, holes, or classes).
 */
function detachedFrozenCheckpointSnapshotV1<T>(input: unknown): T {
  canonicalJsonStringify(input);
  const byteLength = measureCanonicalFlatDataV1(input);
  const encoded = new Uint8Array(byteLength);
  const written = encodeCanonicalFlatDataIntoV1(input, encoded);
  if (written !== byteLength) {
    throw new Error("Standard66 checkpoint snapshot length changed");
  }
  return deepFreezeV1(decodeCanonicalFlatDataV1(encoded) as T);
}
