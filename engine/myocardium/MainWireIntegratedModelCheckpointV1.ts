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
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V1_ID,
  validateMainWireIntegratedModelAcceptedStateV1,
  wrapMainWireIntegratedModelAcceptedStateV1,
  type MainWireIntegratedModelAcceptedStateV1,
  type MainWireIntegratedRhythmContextV1,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV1";
import {
  checkpointAcceptedFiveWallRhythmCalciumStateV1,
  restoreAcceptedFiveWallRhythmCalciumStateV1,
  type AcceptedFiveWallRhythmCalciumCheckpointV1,
} from "@/engine/myocardium/rhythm/acceptedFiveWallRhythmCalciumOwnerV1";
import {
  sha256AcceptedRhythmEventScheduleIdentityV1,
} from "@/engine/myocardium/rhythm/acceptedRhythmEventScheduleV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V1_ID =
  "circleheart.main-wire-integrated-model-checkpoint.v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V1 = Object.freeze({
  acceptedTuple:
    "coronary-v3-plus-rhythm-calcium-v1-plus-dynamic-mcs-flow-and-model-binding-v1" as const,
  integrity:
    "outer-sha-256-over-canonical-json-containing-two-nested-sha-checkpoints" as const,
  nestedIntegrity: Object.freeze({
    coronary: "verified-coronary-v3-sha-checkpoint" as const,
    rhythmCalcium: "verified-rhythm-calcium-v1-sha-checkpoint" as const,
    dynamicMechanicalSupport:
      "covered-by-outer-sha-and-rehydrated-against-expected-profile-and-structural-config" as const,
  }),
  rhythmScheduleIdentity:
    "sha-256-over-complete-canonical-rhythm-schedule-content" as const,
  dynamicMechanicalSupportProfileIdentity:
    "sha-256-over-complete-canonical-dynamic-inertance-profile-content" as const,
  dynamicMechanicalSupportStructuralHydraulicIdentity:
    "sha-256-over-accepted-rotary-structural-hydraulic-projection" as const,
  exactResumeScope:
    "all-coronary-v3-owners-mid-autoregulation-window-rhythm-cursor-five-calcium-states-and-four-dynamic-device-flows" as const,
  ownerClock:
    "outer-coronary-v3-rhythm-calcium-and-rhythm-schedule-clocks-must-match" as const,
  dynamicMechanicalSupportStateStored:
    "q-ml-per-sec-plus-detached-profile-and-structural-hydraulic-snapshots" as const,
  dynamicMechanicalSupportProfileStored: true as const,
  dynamicMechanicalSupportStructuralHydraulicConfigStored: true as const,
  dynamicMechanicalSupportFullDeviceConfigStored: false as const,
  dynamicMechanicalSupportControllerCommandStored: false as const,
  rhythmEventScheduleStored: false as const,
  providerStored: false as const,
  exactRestoreRequiresExpectedProvider: true as const,
  exactRestoreRequiresExpectedRhythmBindingAndSchedule: true as const,
  exactRestoreRequiresExpectedDynamicInertanceProfile: true as const,
  exactRestoreRequiresExpectedDynamicStructuralHydraulicConfig: true as const,
  externalSessionMustOwnDeviceConfigAndControllerCommand: true as const,
  dynamicProfileReleaseApprovalClaimed: false as const,
  deviceConfigReleaseApprovalClaimed: false as const,
  simulationReady: false as const,
});

export type MainWireIntegratedModelCheckpointContextV1<TWallState> = Readonly<
  MainWireFiveWallCoronaryCheckpointContextV3<TWallState>
  & {
    rhythm: MainWireIntegratedRhythmContextV1;
    dynamicMechanicalSupportProfile:
      DynamicMechanicalSupportInertanceProfileV1;
    dynamicMechanicalSupportConfig: MechanicalSupportConfigV1;
  }
>;

export type MainWireIntegratedModelCheckpointPayloadV1 = Readonly<{
  checkpointId: typeof MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  transactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  rhythmScheduleIdentitySha256: string;
  dynamicMechanicalSupportProfileIdentitySha256: string;
  dynamicMechanicalSupportStructuralHydraulicIdentitySha256: string;
  coronary: MainWireFiveWallCoronaryCheckpointV3;
  rhythmCalcium: AcceptedFiveWallRhythmCalciumCheckpointV1;
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1;
  exactResumeClaim: typeof MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V1;
}>;

export type MainWireIntegratedModelCheckpointV1 =
  MainWireIntegratedModelCheckpointPayloadV1 & Readonly<{
    checkpointSha256: string;
  }>;

export async function checkpointMainWireIntegratedModelV1<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV1<TWallState>,
  state: MainWireIntegratedModelAcceptedStateV1<TWallState>,
): Promise<MainWireIntegratedModelCheckpointV1> {
  validateCheckpointContext(context);
  validateMainWireIntegratedModelAcceptedStateV1(
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
    rhythmCalcium,
    rhythmScheduleIdentitySha256,
    dynamicMechanicalSupportProfileIdentitySha256,
    dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
  ] = await Promise.all([
    checkpointMainWireFiveWallCoronaryV3(context, state.coronary),
    checkpointAcceptedFiveWallRhythmCalciumStateV1(
      state.rhythmCalcium,
      context.rhythm.binding,
      context.rhythm.schedule,
    ),
    sha256AcceptedRhythmEventScheduleIdentityV1(context.rhythm.schedule),
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
    rhythmCalcium,
  );
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    rhythmScheduleIdentitySha256,
    dynamicMechanicalSupportProfileIdentitySha256,
    dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
    coronary,
    rhythmCalcium,
    dynamicMechanicalSupport,
    exactResumeClaim: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V1,
  }) satisfies MainWireIntegratedModelCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only; no clock rebase, profile migration, or command restore. */
export async function restoreMainWireIntegratedModelV1<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV1<TWallState>,
  input: unknown,
): Promise<MainWireIntegratedModelAcceptedStateV1<TWallState>> {
  validateCheckpointContext(context);
  const expectedDynamicBinding = createDynamicMechanicalSupportAcceptedStateV1(
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  assertCheckpointEnvelope(input);
  const checkpoint = input as MainWireIntegratedModelCheckpointV1;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("integrated model checkpoint outer SHA-256 mismatch");
  }
  if (canonicalJsonStringify(checkpoint.exactResumeClaim)
    !== canonicalJsonStringify(
      MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_CLAIM_V1,
    )) throw new Error("integrated model checkpoint claim mismatch");

  const [
    expectedRhythmScheduleIdentitySha256,
    expectedDynamicMechanicalSupportProfileIdentitySha256,
    expectedDynamicMechanicalSupportStructuralHydraulicIdentitySha256,
  ] = await Promise.all([
    sha256AcceptedRhythmEventScheduleIdentityV1(context.rhythm.schedule),
    sha256CanonicalJsonHex(expectedDynamicBinding.inertanceProfileSnapshot),
    sha256CanonicalJsonHex(
      expectedDynamicBinding.structuralHydraulicProjection,
    ),
  ]);
  if (checkpoint.rhythmScheduleIdentitySha256
    !== expectedRhythmScheduleIdentitySha256) {
    throw new Error(
      "integrated model checkpoint rhythm schedule SHA-256 identity mismatch",
    );
  }
  if (checkpoint.dynamicMechanicalSupportProfileIdentitySha256
    !== expectedDynamicMechanicalSupportProfileIdentitySha256) {
    throw new Error(
      "integrated model checkpoint dynamic MCS profile SHA-256 identity mismatch",
    );
  }
  if (checkpoint.dynamicMechanicalSupportStructuralHydraulicIdentitySha256
    !== expectedDynamicMechanicalSupportStructuralHydraulicIdentitySha256) {
    throw new Error(
      "integrated model checkpoint dynamic MCS structural hydraulic SHA-256 identity mismatch",
    );
  }

  const [coronary, rhythmCalcium] = await Promise.all([
    restoreMainWireFiveWallCoronaryV3(context, checkpoint.coronary),
    restoreAcceptedFiveWallRhythmCalciumStateV1(
      checkpoint.rhythmCalcium,
      context.rhythm.binding,
      context.rhythm.schedule,
    ),
  ]);
  const dynamicMechanicalSupport =
    restoreDynamicMechanicalSupportAcceptedStateV1(
      checkpoint.dynamicMechanicalSupport,
      expectedDynamicBinding,
    );
  assertNestedClocks(
    checkpoint.revision,
    checkpoint.acceptedTimeSec,
    checkpoint.coronary,
    checkpoint.rhythmCalcium,
  );
  if (
    coronary.revision !== checkpoint.revision
    || rhythmCalcium.revision !== checkpoint.revision
    || coronary.acceptedTimeSec !== checkpoint.acceptedTimeSec
    || rhythmCalcium.acceptedTimeSec !== checkpoint.acceptedTimeSec
  ) throw new Error("integrated model restored owner clocks differ");

  const restored = wrapMainWireIntegratedModelAcceptedStateV1(
    coronary,
    rhythmCalcium,
    dynamicMechanicalSupport,
    context.rhythm,
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  validateMainWireIntegratedModelAcceptedStateV1(
    restored,
    context.rhythm,
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  return restored;
}

function validateCheckpointContext<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV1<TWallState>,
): void {
  if (context === null || typeof context !== "object") {
    throw new Error("integrated checkpoint context is required");
  }
  if (context.provider === null || typeof context.provider !== "object") {
    throw new Error("integrated checkpoint expected provider is required");
  }
  if (context.rhythm === null || typeof context.rhythm !== "object") {
    throw new Error("integrated checkpoint expected rhythm context is required");
  }
  if (context.rhythm.binding === undefined
    || context.rhythm.schedule === undefined) {
    throw new Error(
      "integrated checkpoint expected rhythm binding and schedule are required",
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
  rhythmCalcium: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    rhythmSchedule: Readonly<{ revision: number; acceptedTimeSec: number }>;
  }>,
): void {
  nonnegativeInteger(revision, "integrated checkpoint revision");
  nonnegativeFinite(acceptedTimeSec, "integrated checkpoint acceptedTimeSec");
  if (
    coronary.revision !== revision
    || rhythmCalcium.revision !== revision
    || rhythmCalcium.rhythmSchedule.revision !== revision
    || coronary.acceptedTimeSec !== acceptedTimeSec
    || rhythmCalcium.acceptedTimeSec !== acceptedTimeSec
    || rhythmCalcium.rhythmSchedule.acceptedTimeSec !== acceptedTimeSec
  ) throw new Error("integrated model checkpoint nested owner clocks differ");
}

function assertCheckpointEnvelope(
  input: unknown,
): asserts input is MainWireIntegratedModelCheckpointV1 {
  plainRecord(input, "integrated model checkpoint");
  exactKeys(input, [
    "checkpointId",
    "schemaVersion",
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "rhythmScheduleIdentitySha256",
    "dynamicMechanicalSupportProfileIdentitySha256",
    "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
    "coronary",
    "rhythmCalcium",
    "dynamicMechanicalSupport",
    "exactResumeClaim",
    "checkpointSha256",
  ], "integrated model checkpoint");
  const typed = input as Partial<MainWireIntegratedModelCheckpointV1>;
  if (
    typed.checkpointId !== MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V1_ID
    || typed.schemaVersion !== 1
    || typed.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V1_ID
  ) throw new Error("unsupported integrated model checkpoint schema");
  if (typeof typed.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(typed.checkpointSha256)) {
    throw new Error("integrated model checkpoint SHA-256 is invalid");
  }
  if (typeof typed.rhythmScheduleIdentitySha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(typed.rhythmScheduleIdentitySha256)) {
    throw new Error(
      "integrated model checkpoint rhythm schedule SHA-256 identity is invalid",
    );
  }
  if (typeof typed.dynamicMechanicalSupportProfileIdentitySha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(
      typed.dynamicMechanicalSupportProfileIdentitySha256,
    )) {
    throw new Error(
      "integrated model checkpoint dynamic MCS profile SHA-256 identity is invalid",
    );
  }
  if (typeof typed.dynamicMechanicalSupportStructuralHydraulicIdentitySha256
      !== "string"
    || !/^[0-9a-f]{64}$/.test(
      typed.dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
    )) {
    throw new Error(
      "integrated model checkpoint dynamic MCS structural hydraulic SHA-256 identity is invalid",
    );
  }
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
  if (actualStrings.length !== expectedStrings.length
    || actualStrings.some((key, index) => key !== expectedStrings[index])) {
    throw new Error(`${label} has an unexpected field set`);
  }
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
