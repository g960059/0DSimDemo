import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
  validateMainWireSelectedAorticOutflowCirculationProfileV1,
  type MainWireSelectedAorticOutflowCirculationProfileV1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  restoreMainWireIntegratedModelStandardV2,
  validateMainWireIntegratedModelStandardCheckpointV2,
  type MainWireIntegratedModelStandardCheckpointContextV2,
  type MainWireIntegratedModelStandardCheckpointV2,
  type RestoredMainWireIntegratedModelStandardCheckpointV2,
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

/** Construction identity supplied by the fixed selected fixture owner. */
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
}>;

export type MainWireIntegratedModelStandard66CheckpointV1 =
  MainWireIntegratedModelStandard66CheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

export type MainWireIntegratedModelStandard66RestoreContextV1<TWallState> =
  Readonly<{
    base: MainWireIntegratedModelStandardCheckpointContextV2<TWallState>;
    selected: MainWireIntegratedModelStandard66CheckpointContextV1;
  }>;

export type RestoredMainWireIntegratedModelStandard66CheckpointV1<TWallState> =
  RestoredMainWireIntegratedModelStandardCheckpointV2<TWallState> & Readonly<{
    selectedAorticPortExtension:
      MainWireSelectedAorticPortSessionExtensionV1;
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
 * Wraps the unchanged Standard V2 numerical checkpoint with the selected
 * construction identity. Instantaneous selected readback is not persisted,
 * and no selected beat-derived analysis state belongs to this exact image.
 */
export async function checkpointMainWireIntegratedModelStandard66V1(
  context: MainWireIntegratedModelStandard66CheckpointContextV1,
  baseStandardCheckpointV2: unknown,
): Promise<MainWireIntegratedModelStandard66CheckpointV1> {
  const ownedContext =
    createMainWireIntegratedModelStandard66CheckpointContextV1(context);
  const detachedBaseStandardCheckpointV2 =
    detachedFrozenCheckpointSnapshotV1<
      MainWireIntegratedModelStandardCheckpointV2
    >(baseStandardCheckpointV2);
  const [ownedBaseStandardCheckpointV2, selectedProfileSha256] =
    await Promise.all([
      validateMainWireIntegratedModelStandardCheckpointV2(
        detachedBaseStandardCheckpointV2,
      ),
      sha256CanonicalJsonHex(ownedContext.selectedAorticOutflowProfile),
    ]);
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    revision: ownedBaseStandardCheckpointV2.revision,
    acceptedTimeSec: ownedBaseStandardCheckpointV2.acceptedTimeSec,
    selectedModelIdentity:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1,
    selectedAorticOutflowProfileIdentitySha256: selectedProfileSha256,
    baseStandardCheckpointV2: ownedBaseStandardCheckpointV2,
  }) satisfies MainWireIntegratedModelStandard66CheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/**
 * Restores the exact numerical owner and creates an empty transactional
 * selected-readback owner. The latter is repopulated by the next accepted
 * step and therefore contributes no persistent continuation semantics.
 */
export async function restoreMainWireIntegratedModelStandard66V1<TWallState>(
  context: MainWireIntegratedModelStandard66RestoreContextV1<TWallState>,
  input: unknown,
): Promise<RestoredMainWireIntegratedModelStandard66CheckpointV1<TWallState>> {
  const contextRecord = plainExactRecordV1(
    context,
    ["base", "selected"],
    "Standard66 restore context",
  );
  const baseContext = contextRecord.base as
    MainWireIntegratedModelStandardCheckpointContextV2<TWallState>;
  createMainWireIntegratedModelStandard66CheckpointContextV1(
    contextRecord.selected as
      MainWireIntegratedModelStandard66CheckpointContextV1,
  );
  const checkpoint = await validateMainWireIntegratedModelStandard66CheckpointV1(
    input,
  );
  const restoredBase = await restoreMainWireIntegratedModelStandardV2(
    baseContext,
    checkpoint.baseStandardCheckpointV2,
  );
  if (
    restoredBase.acceptedState.revision !== checkpoint.revision
    || !Object.is(
      restoredBase.acceptedState.acceptedTimeSec,
      checkpoint.acceptedTimeSec,
    )
  ) {
    throw new Error("restored Standard66 owner clocks differ");
  }
  const selectedAorticPortExtension =
    MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
  return Object.freeze({
    ...restoredBase,
    selectedAorticPortExtension,
  });
}

/** Owns and validates the complete selected wrapper before restore. */
export async function validateMainWireIntegratedModelStandard66CheckpointV1(
  input: unknown,
): Promise<MainWireIntegratedModelStandard66CheckpointV1> {
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
  const ownedBase = await validateMainWireIntegratedModelStandardCheckpointV2(
    checkpoint.baseStandardCheckpointV2,
  );
  if (
    checkpoint.revision !== ownedBase.revision
    || !Object.is(checkpoint.acceptedTimeSec, ownedBase.acceptedTimeSec)
  ) {
    throw new Error("Standard66 checkpoint owner clocks differ");
  }
  return checkpoint;
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
 * Canonical-flat cloning detaches before async digest work and preserves the
 * complete IEEE-754 primitive while keeping this wrapper in its JSON model.
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
