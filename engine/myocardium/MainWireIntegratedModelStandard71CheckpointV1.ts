import {
  restoreMainWireIntegratedModelStandardV2,
  validateMainWireIntegratedModelStandardCheckpointV2,
  type MainWireIntegratedModelStandardCheckpointContextV2,
  type MainWireIntegratedModelStandardCheckpointV2,
  type RestoredMainWireIntegratedModelStandardCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedRegularSinusRhythmV3";
import { MAIN_WIRE_STANDARD71_CALCIUM_PROFILE_V1_ID } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import {
  MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1,
  MAIN_WIRE_STANDARD71_MATERIAL_PROFILE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  decodeCanonicalFlatDataV1,
  encodeCanonicalFlatDataIntoV1,
  measureCanonicalFlatDataV1,
} from "@/engine/vnext/CanonicalFlatDataV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_CHECKPOINT_V1_ID =
  "circleheart.main-wire-integrated-model-standard71-exact-checkpoint.v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_IDENTITY_V1 = deepFreezeV1({
  fixtureId:
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID,
  ventricularMaterialProfileId:
    MAIN_WIRE_STANDARD71_MATERIAL_PROFILE_V1_ID,
  ventricularMaterialParameterHash:
    MAIN_WIRE_STANDARD71_LAND_PARAMETERS_V1
      .parameterSetStableHash,
  regularSinusProfileId:
    MAIN_WIRE_INTEGRATED_MATCHED_ALPHA_FIXED_REGULAR_SINUS_PROFILE_V1_ID,
  ventricularCalciumProfileId:
    MAIN_WIRE_STANDARD71_CALCIUM_PROFILE_V1_ID,
  aorticOutflowConstruction: "source-loss-algebraic-root-without-pressure-recovery" as const,
  systemicArterialComplianceScale: 0.65,
  aorticRootInertanceScale: 0,
  pulmonaryArterialRootProfileId:
    MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID,
  pulmonaryArterialRootConstruction:
    "source-loss-algebraic-flow-without-momentum-memory" as const,
});

export type MainWireIntegratedModelStandard71CheckpointV1 = Readonly<{
  checkpointId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  revision: number;
  acceptedTimeSec: number;
  modelIdentity: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_IDENTITY_V1;
  baseStandardCheckpointV2: MainWireIntegratedModelStandardCheckpointV2;
  checkpointSha256: string;
}>;

export type MainWireIntegratedModelStandard71RestoreContextV1<TWallState> =
  Readonly<{
    base: MainWireIntegratedModelStandardCheckpointContextV2<TWallState>;
    standard71AssemblyId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID;
  }>;

export async function checkpointMainWireIntegratedModelStandard71V1(
  standard71AssemblyId: unknown,
  baseStandardCheckpointV2: unknown,
): Promise<MainWireIntegratedModelStandard71CheckpointV1> {
  assertAssemblyIdV1(standard71AssemblyId);
  const detached = detachedFrozenCheckpointSnapshotV1<
    MainWireIntegratedModelStandardCheckpointV2
  >(baseStandardCheckpointV2);
  const base = await validateMainWireIntegratedModelStandardCheckpointV2(
    detached,
  );
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    revision: base.revision,
    acceptedTimeSec: base.acceptedTimeSec,
    modelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_IDENTITY_V1,
    baseStandardCheckpointV2: base,
  });
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

export async function restoreMainWireIntegratedModelStandard71V1<TWallState>(
  context: MainWireIntegratedModelStandard71RestoreContextV1<TWallState>,
  input: unknown,
): Promise<RestoredMainWireIntegratedModelStandardCheckpointV2<TWallState>> {
  const contextRecord = plainExactRecordV1(
    context,
    ["base", "standard71AssemblyId"],
    "Standard71 restore context",
  );
  assertAssemblyIdV1(contextRecord.standard71AssemblyId);
  const checkpoint = await validateMainWireIntegratedModelStandard71CheckpointV1(
    input,
  );
  const restored = await restoreMainWireIntegratedModelStandardV2(
    contextRecord.base as MainWireIntegratedModelStandardCheckpointContextV2<TWallState>,
    checkpoint.baseStandardCheckpointV2,
  );
  if (
    restored.acceptedState.revision !== checkpoint.revision
    || !Object.is(
      restored.acceptedState.acceptedTimeSec,
      checkpoint.acceptedTimeSec,
    )
  ) {
    throw new Error("restored Standard71 owner clocks differ");
  }
  return restored;
}

export async function validateMainWireIntegratedModelStandard71CheckpointV1(
  input: unknown,
): Promise<MainWireIntegratedModelStandard71CheckpointV1> {
  const checkpoint = detachedFrozenCheckpointSnapshotV1<
    MainWireIntegratedModelStandard71CheckpointV1
  >(input);
  const record = plainExactRecordV1(
    checkpoint,
    [
      "checkpointId",
      "schemaVersion",
      "revision",
      "acceptedTimeSec",
      "modelIdentity",
      "baseStandardCheckpointV2",
      "checkpointSha256",
    ],
    "Standard71 checkpoint",
  );
  if (
    record.checkpointId !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_CHECKPOINT_V1_ID
    || record.schemaVersion !== 1
  ) {
    throw new Error("unsupported Standard71 checkpoint schema");
  }
  if (
    typeof record.revision !== "number"
    || !Number.isSafeInteger(record.revision)
    || record.revision < 0
    || typeof record.acceptedTimeSec !== "number"
    || !Number.isFinite(record.acceptedTimeSec)
    || record.acceptedTimeSec < 0
    || typeof record.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.checkpointSha256)
  ) {
    throw new Error("Standard71 checkpoint envelope is invalid");
  }
  assertModelIdentityV1(record.modelIdentity);
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("Standard71 checkpoint outer SHA-256 mismatch");
  }
  const base = await validateMainWireIntegratedModelStandardCheckpointV2(
    checkpoint.baseStandardCheckpointV2,
  );
  if (
    checkpoint.revision !== base.revision
    || !Object.is(checkpoint.acceptedTimeSec, base.acceptedTimeSec)
  ) {
    throw new Error("Standard71 checkpoint owner clocks differ");
  }
  return checkpoint;
}

function assertAssemblyIdV1(
  value: unknown,
): asserts value is typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID {
  if (
    value
      !== MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_FIXTURE_V1_ID
  ) {
    throw new Error("Standard71 checkpoint fixture identity mismatch");
  }
}

function assertModelIdentityV1(input: unknown): void {
  const expected = MAIN_WIRE_INTEGRATED_MODEL_STANDARD71_IDENTITY_V1;
  const record = plainExactRecordV1(
    input,
    Object.keys(expected),
    "Standard71 model identity",
  );
  for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
    if (record[key] !== expected[key]) {
      throw new Error("Standard71 model identity mismatch");
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
  const actual = Reflect.ownKeys(input);
  const expected = [...keys].sort();
  if (
    actual.some((key) => typeof key !== "string")
    || actual.length !== expected.length
    || (actual as string[]).sort().some((key, index) => key !== expected[index])
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

function detachedFrozenCheckpointSnapshotV1<T>(input: unknown): T {
  canonicalJsonStringify(input);
  const byteLength = measureCanonicalFlatDataV1(input);
  const encoded = new Uint8Array(byteLength);
  const written = encodeCanonicalFlatDataIntoV1(input, encoded);
  if (written !== byteLength) {
    throw new Error("Standard71 checkpoint snapshot length changed");
  }
  return deepFreezeV1(decodeCanonicalFlatDataV1(encoded) as T);
}

