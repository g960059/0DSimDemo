import {
  createDynamicMechanicalSupportAcceptedStateV1,
  restoreDynamicMechanicalSupportAcceptedStateV1,
  validateDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportAcceptedStateV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import { validateMechanicalSupportConfigV1 } from
  "@/engine/devices/networkV1";
import type { MechanicalSupportConfigV1 } from
  "@/engine/devices/typesV1";
import {
  checkpointMainWireFiveWallCoronaryV3,
  restoreMainWireFiveWallCoronaryV3,
  type MainWireFiveWallCoronaryCheckpointContextV3,
  type MainWireFiveWallCoronaryCheckpointV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID,
  validateMainWireIntegratedModelAcceptedStateV2,
  wrapMainWireIntegratedModelAcceptedStateV2,
  type MainWireIntegratedGeneratedRhythmContextV2,
  type MainWireIntegratedModelAcceptedStateV2,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV2";
import {
  checkpointAcceptedGeneratedFiveWallRhythmCalciumStateV1,
  restoreAcceptedGeneratedFiveWallRhythmCalciumStateV1,
  type AcceptedGeneratedFiveWallRhythmCalciumCheckpointV1,
} from "@/engine/myocardium/rhythm/acceptedGeneratedFiveWallRhythmCalciumOwnerV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V2_ID =
  "circleheart.main-wire-integrated-model-generated-rhythm-checkpoint.v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V2 = Object.freeze({
  acceptedTuple:
    "coronary-v3-plus-generated-rhythm-calcium-v1-plus-dynamic-mcs-flow-and-model-binding-v1" as const,
  integrity:
    "outer-sha-256-over-canonical-json-containing-two-nested-sha-checkpoints" as const,
  nestedIntegrity: Object.freeze({
    coronary: "verified-coronary-v3-sha-checkpoint" as const,
    generatedRhythmCalcium:
      "verified-generated-rhythm-calcium-and-generator-sha-checkpoints" as const,
    dynamicMechanicalSupport:
      "covered-by-outer-sha-and-rehydrated-against-expected-profile-and-structural-config" as const,
  }),
  generatedRhythmBindingIdentity:
    "sha-256-over-complete-generator-config-and-five-wall-calcium-binding" as const,
  dynamicMechanicalSupportProfileIdentity:
    "sha-256-over-complete-canonical-dynamic-inertance-profile-content" as const,
  dynamicMechanicalSupportStructuralHydraulicIdentity:
    "sha-256-over-accepted-rotary-structural-hydraulic-projection" as const,
  exactResumeScope:
    "all-coronary-v3-owners-generated-av-pending-event-queue-five-calcium-states-and-four-dynamic-device-flows" as const,
  ownerClock:
    "outer-coronary-generated-rhythm-calcium-and-nested-generator-clocks-must-match" as const,
  generatedRhythmBindingStored: true as const,
  generatedPendingEffectiveEventsStored: true as const,
  dynamicMechanicalSupportStateStored:
    "q-ml-per-sec-plus-detached-profile-and-structural-hydraulic-snapshots" as const,
  dynamicMechanicalSupportProfileStored: true as const,
  dynamicMechanicalSupportStructuralHydraulicConfigStored: true as const,
  dynamicMechanicalSupportFullDeviceConfigStored: false as const,
  dynamicMechanicalSupportControllerCommandStored: false as const,
  providerStored: false as const,
  exactRestoreRequiresExpectedProvider: true as const,
  exactRestoreRequiresExpectedGeneratedRhythmBinding: true as const,
  exactRestoreRequiresExpectedDynamicInertanceProfile: true as const,
  exactRestoreRequiresExpectedDynamicStructuralHydraulicConfig: true as const,
  externalSessionMustOwnDeviceConfigAndControllerCommand: true as const,
  iabpGeneratedRhythmSynchronizationClaimed: false as const,
  dynamicProfileReleaseApprovalClaimed: false as const,
  deviceConfigReleaseApprovalClaimed: false as const,
  simulationReady: false as const,
});

export type MainWireIntegratedModelCheckpointContextV2<TWallState> = Readonly<
  MainWireFiveWallCoronaryCheckpointContextV3<TWallState>
  & {
    rhythm: MainWireIntegratedGeneratedRhythmContextV2;
    dynamicMechanicalSupportProfile:
      DynamicMechanicalSupportInertanceProfileV1;
    dynamicMechanicalSupportConfig: MechanicalSupportConfigV1;
  }
>;

export type MainWireIntegratedModelCheckpointPayloadV2 = Readonly<{
  checkpointId: typeof MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  transactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID;
  revision: number;
  acceptedTimeSec: number;
  generatedRhythmBindingIdentitySha256: string;
  dynamicMechanicalSupportProfileIdentitySha256: string;
  dynamicMechanicalSupportStructuralHydraulicIdentitySha256: string;
  coronary: MainWireFiveWallCoronaryCheckpointV3;
  generatedRhythmCalcium:
    AcceptedGeneratedFiveWallRhythmCalciumCheckpointV1;
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1;
  exactResumeClaim: typeof MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V2;
}>;

export type MainWireIntegratedModelCheckpointV2 =
  MainWireIntegratedModelCheckpointPayloadV2 & Readonly<{
    checkpointSha256: string;
  }>;

export async function checkpointMainWireIntegratedModelV2<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV2<TWallState>,
  state: MainWireIntegratedModelAcceptedStateV2<TWallState>,
): Promise<MainWireIntegratedModelCheckpointV2> {
  validateCheckpointContext(context);
  validateMainWireIntegratedModelAcceptedStateV2(
    state,
    context.rhythm,
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  const dynamicMechanicalSupport =
    createDynamicMechanicalSupportAcceptedStateV1(
      context.dynamicMechanicalSupportProfile,
      context.dynamicMechanicalSupportConfig,
      state.dynamicMechanicalSupport.acceptedFlowMlPerSec,
    );
  const [
    coronary,
    generatedRhythmCalcium,
    generatedRhythmBindingIdentitySha256,
    dynamicMechanicalSupportProfileIdentitySha256,
    dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
  ] = await Promise.all([
    checkpointMainWireFiveWallCoronaryV3(context, state.coronary),
    checkpointAcceptedGeneratedFiveWallRhythmCalciumStateV1(
      state.generatedRhythmCalcium,
      context.rhythm.binding,
    ),
    sha256CanonicalJsonHex(context.rhythm.binding),
    sha256CanonicalJsonHex(
      dynamicMechanicalSupport.inertanceProfileSnapshot,
    ),
    sha256CanonicalJsonHex(
      dynamicMechanicalSupport.structuralHydraulicProjection,
    ),
  ]);
  assertNestedClocks(
    state.revision,
    state.acceptedTimeSec,
    coronary,
    generatedRhythmCalcium,
  );
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    generatedRhythmBindingIdentitySha256,
    dynamicMechanicalSupportProfileIdentitySha256,
    dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
    coronary,
    generatedRhythmCalcium,
    dynamicMechanicalSupport,
    exactResumeClaim: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V2,
  }) satisfies MainWireIntegratedModelCheckpointPayloadV2;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only; no clock rebase, model migration, or command restore. */
export async function restoreMainWireIntegratedModelV2<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV2<TWallState>,
  input: unknown,
): Promise<MainWireIntegratedModelAcceptedStateV2<TWallState>> {
  validateCheckpointContext(context);
  const expectedDynamicBinding = createDynamicMechanicalSupportAcceptedStateV1(
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  assertCheckpointEnvelope(input);
  const checkpoint = input as MainWireIntegratedModelCheckpointV2;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error(
      "generated integrated model checkpoint outer SHA-256 mismatch",
    );
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim)
      !== canonicalJsonStringify(
        MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V2,
      )
  ) throw new Error("generated integrated model checkpoint claim mismatch");

  const [
    expectedGeneratedRhythmBindingIdentitySha256,
    expectedDynamicMechanicalSupportProfileIdentitySha256,
    expectedDynamicMechanicalSupportStructuralHydraulicIdentitySha256,
  ] = await Promise.all([
    sha256CanonicalJsonHex(context.rhythm.binding),
    sha256CanonicalJsonHex(expectedDynamicBinding.inertanceProfileSnapshot),
    sha256CanonicalJsonHex(
      expectedDynamicBinding.structuralHydraulicProjection,
    ),
  ]);
  if (
    checkpoint.generatedRhythmBindingIdentitySha256
      !== expectedGeneratedRhythmBindingIdentitySha256
  ) {
    throw new Error(
      "generated integrated model checkpoint rhythm binding SHA-256 identity mismatch",
    );
  }
  if (
    checkpoint.dynamicMechanicalSupportProfileIdentitySha256
      !== expectedDynamicMechanicalSupportProfileIdentitySha256
  ) {
    throw new Error(
      "generated integrated model checkpoint dynamic MCS profile SHA-256 identity mismatch",
    );
  }
  if (
    checkpoint.dynamicMechanicalSupportStructuralHydraulicIdentitySha256
      !== expectedDynamicMechanicalSupportStructuralHydraulicIdentitySha256
  ) {
    throw new Error(
      "generated integrated model checkpoint dynamic MCS structural hydraulic SHA-256 identity mismatch",
    );
  }

  assertNestedClocks(
    checkpoint.revision,
    checkpoint.acceptedTimeSec,
    checkpoint.coronary,
    checkpoint.generatedRhythmCalcium,
  );
  const [coronary, generatedRhythmCalcium] = await Promise.all([
    restoreMainWireFiveWallCoronaryV3(context, checkpoint.coronary),
    restoreAcceptedGeneratedFiveWallRhythmCalciumStateV1(
      checkpoint.generatedRhythmCalcium,
      context.rhythm.binding,
    ),
  ]);
  const dynamicMechanicalSupport =
    restoreDynamicMechanicalSupportAcceptedStateV1(
      checkpoint.dynamicMechanicalSupport,
      expectedDynamicBinding,
    );
  if (
    coronary.revision !== checkpoint.revision
    || generatedRhythmCalcium.revision !== checkpoint.revision
    || generatedRhythmCalcium.generatorState.revision
      !== checkpoint.revision
    || coronary.acceptedTimeSec !== checkpoint.acceptedTimeSec
    || generatedRhythmCalcium.acceptedTimeSec
      !== checkpoint.acceptedTimeSec
    || generatedRhythmCalcium.generatorState.acceptedTimeSec
      !== checkpoint.acceptedTimeSec
  ) throw new Error("generated integrated model restored owner clocks differ");

  const restored = wrapMainWireIntegratedModelAcceptedStateV2(
    coronary,
    generatedRhythmCalcium,
    dynamicMechanicalSupport,
    context.rhythm,
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  validateMainWireIntegratedModelAcceptedStateV2(
    restored,
    context.rhythm,
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  return restored;
}

function validateCheckpointContext<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV2<TWallState>,
): void {
  if (context === null || typeof context !== "object") {
    throw new Error("generated integrated checkpoint context is required");
  }
  if (context.provider === null || typeof context.provider !== "object") {
    throw new Error(
      "generated integrated checkpoint expected provider is required",
    );
  }
  if (
    context.rhythm === null
    || typeof context.rhythm !== "object"
    || context.rhythm.binding === undefined
  ) {
    throw new Error(
      "generated integrated checkpoint expected rhythm binding is required",
    );
  }
  validateDynamicMechanicalSupportInertanceProfileV1(
    context.dynamicMechanicalSupportProfile,
  );
  validateMechanicalSupportConfigV1(context.dynamicMechanicalSupportConfig);
}

function assertNestedClocks(
  revision: number,
  acceptedTimeSec: number,
  coronary: Readonly<{ revision: number; acceptedTimeSec: number }>,
  generatedRhythmCalcium: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    generatorCheckpoint: Readonly<{
      revision: number;
      acceptedTimeSec: number;
    }>;
  }>,
): void {
  nonnegativeInteger(revision, "generated integrated checkpoint revision");
  nonnegativeFinite(
    acceptedTimeSec,
    "generated integrated checkpoint acceptedTimeSec",
  );
  if (
    coronary.revision !== revision
    || generatedRhythmCalcium.revision !== revision
    || generatedRhythmCalcium.generatorCheckpoint.revision !== revision
    || coronary.acceptedTimeSec !== acceptedTimeSec
    || generatedRhythmCalcium.acceptedTimeSec !== acceptedTimeSec
    || generatedRhythmCalcium.generatorCheckpoint.acceptedTimeSec
      !== acceptedTimeSec
  ) {
    throw new Error(
      "generated integrated model checkpoint nested owner clocks differ",
    );
  }
}

function assertCheckpointEnvelope(
  input: unknown,
): asserts input is MainWireIntegratedModelCheckpointV2 {
  plainRecord(input, "generated integrated model checkpoint");
  exactKeys(input, [
    "checkpointId",
    "schemaVersion",
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "generatedRhythmBindingIdentitySha256",
    "dynamicMechanicalSupportProfileIdentitySha256",
    "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
    "coronary",
    "generatedRhythmCalcium",
    "dynamicMechanicalSupport",
    "exactResumeClaim",
    "checkpointSha256",
  ], "generated integrated model checkpoint");
  const typed = input as Partial<MainWireIntegratedModelCheckpointV2>;
  if (
    typed.checkpointId !== MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V2_ID
    || typed.schemaVersion !== 2
    || typed.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V2_ID
  ) throw new Error("unsupported generated integrated model checkpoint schema");
  digest(typed.checkpointSha256, "generated integrated checkpoint SHA-256");
  digest(
    typed.generatedRhythmBindingIdentitySha256,
    "generated integrated checkpoint rhythm binding SHA-256 identity",
  );
  digest(
    typed.dynamicMechanicalSupportProfileIdentitySha256,
    "generated integrated checkpoint dynamic MCS profile SHA-256 identity",
  );
  digest(
    typed.dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
    "generated integrated checkpoint dynamic MCS structural hydraulic SHA-256 identity",
  );
}

function digest(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function plainRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label} must be a plain object`);
  }
}

function exactKeys(
  value: object,
  expected: readonly string[],
  label: string,
): void {
  const actual = Reflect.ownKeys(value);
  if (actual.some((key) => typeof key !== "string")) {
    throw new Error(`${label} contains a non-string key`);
  }
  const actualStrings = (actual as string[]).sort();
  const expectedStrings = [...expected].sort();
  if (
    actualStrings.length !== expectedStrings.length
    || actualStrings.some((key, index) => key !== expectedStrings[index])
  ) throw new Error(`${label} has an unexpected field set`);
}

function nonnegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
  return value;
}

function nonnegativeFinite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and nonnegative`);
  }
  return value;
}
