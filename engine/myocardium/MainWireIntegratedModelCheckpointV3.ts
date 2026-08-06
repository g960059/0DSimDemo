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
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
  validateMainWireIntegratedModelAcceptedStateV3,
  wrapMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedComposedRhythmContextV3,
  type MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  checkpointAcceptedComposedRhythmTransactionStateV2,
  restoreAcceptedComposedRhythmTransactionStateV2,
  type AcceptedComposedRhythmTransactionCheckpointV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionCheckpointV2";
import {
  validateAcceptedComposedRhythmTransactionConfigurationV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import {
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";

export const MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID =
  "circleheart.main-wire-integrated-model-composed-rhythm-checkpoint.v4" as const;

export type MainWireIntegratedModelCheckpointContextV3<TWallState> = Readonly<
  MainWireFiveWallCoronaryCheckpointContextV3<TWallState>
  & {
    rhythm: MainWireIntegratedComposedRhythmContextV3;
    dynamicMechanicalSupportProfile:
      DynamicMechanicalSupportInertanceProfileV1;
    dynamicMechanicalSupportConfig: MechanicalSupportConfigV1;
    hemodynamicResearchInputs:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
  }
>;

export type MainWireIntegratedModelCheckpointPayloadV3 = Readonly<{
  checkpointId: typeof MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID;
  schemaVersion: 4;
  transactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID;
  revision: number;
  acceptedTimeSec: number;
  composedRhythmConfigurationIdentitySha256: string;
  dynamicMechanicalSupportProfileIdentitySha256: string;
  dynamicMechanicalSupportStructuralHydraulicIdentitySha256: string;
  hemodynamicResearchInputIdentitySha256: string;
  coronary: MainWireFiveWallCoronaryCheckpointV3;
  composedRhythm: AcceptedComposedRhythmTransactionCheckpointV2;
  dynamicMechanicalSupport: DynamicMechanicalSupportAcceptedStateV1;
}>;

export type MainWireIntegratedModelCheckpointV3 =
  MainWireIntegratedModelCheckpointPayloadV3 & Readonly<{
    checkpointSha256: string;
  }>;

export async function checkpointMainWireIntegratedModelV3<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV3<TWallState>,
  state: MainWireIntegratedModelAcceptedStateV3<TWallState>,
): Promise<MainWireIntegratedModelCheckpointV3> {
  validateCheckpointContext(context);
  validateMainWireIntegratedModelAcceptedStateV3(
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
    composedRhythm,
    composedRhythmConfigurationIdentitySha256,
    dynamicMechanicalSupportProfileIdentitySha256,
    dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
    hemodynamicResearchInputIdentitySha256,
  ] = await Promise.all([
    checkpointMainWireFiveWallCoronaryV3(context, state.coronary),
    checkpointAcceptedComposedRhythmTransactionStateV2(
      state.composedRhythm,
    ),
    sha256CanonicalJsonHex(context.rhythm.configuration),
    sha256CanonicalJsonHex(
      dynamicMechanicalSupport.inertanceProfileSnapshot,
    ),
    sha256CanonicalJsonHex(
      dynamicMechanicalSupport.structuralHydraulicProjection,
    ),
    sha256CanonicalJsonHex(
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
        context.hemodynamicResearchInputs,
      ),
    ),
  ]);
  assertNestedClocks(
    state.revision,
    state.acceptedTimeSec,
    coronary,
    composedRhythm,
  );
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
    schemaVersion: 4 as const,
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    composedRhythmConfigurationIdentitySha256,
    dynamicMechanicalSupportProfileIdentitySha256,
    dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
    hemodynamicResearchInputIdentitySha256,
    coronary,
    composedRhythm,
    dynamicMechanicalSupport,
  }) satisfies MainWireIntegratedModelCheckpointPayloadV3;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only; no clock rebase, model migration, or external AF restore. */
export async function restoreMainWireIntegratedModelV3<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV3<TWallState>,
  input: unknown,
): Promise<MainWireIntegratedModelAcceptedStateV3<TWallState>> {
  validateCheckpointContext(context);
  const expectedDynamicBinding = createDynamicMechanicalSupportAcceptedStateV1(
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  assertCheckpointEnvelope(input);
  const checkpoint = input;
  const { checkpointSha256, ...payload } = checkpoint;
  if (await sha256CanonicalJsonHex(payload) !== checkpointSha256) {
    throw new Error("composed integrated model checkpoint outer SHA-256 mismatch");
  }

  const [
    expectedComposedRhythmConfigurationIdentitySha256,
    expectedDynamicMechanicalSupportProfileIdentitySha256,
    expectedDynamicMechanicalSupportStructuralHydraulicIdentitySha256,
    expectedHemodynamicResearchInputIdentitySha256,
  ] = await Promise.all([
    sha256CanonicalJsonHex(context.rhythm.configuration),
    sha256CanonicalJsonHex(expectedDynamicBinding.inertanceProfileSnapshot),
    sha256CanonicalJsonHex(
      expectedDynamicBinding.structuralHydraulicProjection,
    ),
    sha256CanonicalJsonHex(
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
        context.hemodynamicResearchInputs,
      ),
    ),
  ]);
  if (
    checkpoint.composedRhythmConfigurationIdentitySha256
      !== expectedComposedRhythmConfigurationIdentitySha256
  ) {
    throw new Error(
      "composed integrated checkpoint rhythm configuration SHA-256 identity mismatch",
    );
  }
  if (
    checkpoint.dynamicMechanicalSupportProfileIdentitySha256
      !== expectedDynamicMechanicalSupportProfileIdentitySha256
  ) {
    throw new Error(
      "composed integrated checkpoint dynamic MCS profile SHA-256 identity mismatch",
    );
  }
  if (
    checkpoint.dynamicMechanicalSupportStructuralHydraulicIdentitySha256
      !== expectedDynamicMechanicalSupportStructuralHydraulicIdentitySha256
  ) {
    throw new Error(
      "composed integrated checkpoint dynamic MCS structural hydraulic SHA-256 identity mismatch",
    );
  }
  if (
    checkpoint.hemodynamicResearchInputIdentitySha256
      !== expectedHemodynamicResearchInputIdentitySha256
  ) {
    throw new Error(
      "composed integrated checkpoint hemodynamic research input SHA-256 identity mismatch",
    );
  }

  assertNestedClocks(
    checkpoint.revision,
    checkpoint.acceptedTimeSec,
    checkpoint.coronary,
    checkpoint.composedRhythm,
  );
  const [coronary, composedRhythm] = await Promise.all([
    restoreMainWireFiveWallCoronaryV3(context, checkpoint.coronary),
    restoreAcceptedComposedRhythmTransactionStateV2(
      checkpoint.composedRhythm,
      context.rhythm.configuration,
    ),
  ]);
  const dynamicMechanicalSupport =
    restoreDynamicMechanicalSupportAcceptedStateV1(
      checkpoint.dynamicMechanicalSupport,
      expectedDynamicBinding,
    );
  if (
    coronary.revision !== checkpoint.revision
    || composedRhythm.revision !== checkpoint.revision
    || coronary.acceptedTimeSec !== checkpoint.acceptedTimeSec
    || composedRhythm.acceptedTimeSec !== checkpoint.acceptedTimeSec
  ) throw new Error("composed integrated model restored owner clocks differ");

  const restored = wrapMainWireIntegratedModelAcceptedStateV3(
    coronary,
    composedRhythm,
    dynamicMechanicalSupport,
    context.rhythm,
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  validateMainWireIntegratedModelAcceptedStateV3(
    restored,
    context.rhythm,
    context.dynamicMechanicalSupportProfile,
    context.dynamicMechanicalSupportConfig,
  );
  return restored;
}

function validateCheckpointContext<TWallState>(
  context: MainWireIntegratedModelCheckpointContextV3<TWallState>,
): void {
  if (context === null || typeof context !== "object") {
    throw new Error("composed integrated checkpoint context is required");
  }
  if (context.provider === null || typeof context.provider !== "object") {
    throw new Error(
      "composed integrated checkpoint expected provider is required",
    );
  }
  if (
    context.rhythm === null
    || typeof context.rhythm !== "object"
    || context.rhythm.configuration === undefined
  ) {
    throw new Error(
      "composed integrated checkpoint expected rhythm configuration is required",
    );
  }
  validateAcceptedComposedRhythmTransactionConfigurationV2(
    context.rhythm.configuration,
  );
  validateDynamicMechanicalSupportInertanceProfileV1(
    context.dynamicMechanicalSupportProfile,
  );
  validateMechanicalSupportConfigV1(context.dynamicMechanicalSupportConfig);
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
    context.hemodynamicResearchInputs,
  );
}

function assertNestedClocks(
  revision: number,
  acceptedTimeSec: number,
  coronary: Readonly<{ revision: number; acceptedTimeSec: number }>,
  composedRhythm: Readonly<{ revision: number; acceptedTimeSec: number }>,
): void {
  nonnegativeInteger(revision, "composed integrated checkpoint revision");
  nonnegativeFinite(
    acceptedTimeSec,
    "composed integrated checkpoint acceptedTimeSec",
  );
  if (
    coronary.revision !== revision
    || composedRhythm.revision !== revision
    || coronary.acceptedTimeSec !== acceptedTimeSec
    || composedRhythm.acceptedTimeSec !== acceptedTimeSec
  ) {
    throw new Error(
      "composed integrated model checkpoint nested owner clocks differ",
    );
  }
}

function assertCheckpointEnvelope(
  input: unknown,
): asserts input is MainWireIntegratedModelCheckpointV3 {
  plainRecord(input, "composed integrated model checkpoint");
  exactKeys(input, [
    "checkpointId",
    "schemaVersion",
    "transactionId",
    "revision",
    "acceptedTimeSec",
    "composedRhythmConfigurationIdentitySha256",
    "dynamicMechanicalSupportProfileIdentitySha256",
    "dynamicMechanicalSupportStructuralHydraulicIdentitySha256",
    "hemodynamicResearchInputIdentitySha256",
    "coronary",
    "composedRhythm",
    "dynamicMechanicalSupport",
    "checkpointSha256",
  ], "composed integrated model checkpoint");
  const typed = input as Partial<MainWireIntegratedModelCheckpointV3>;
  if (
    typed.checkpointId !== MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID
    || typed.schemaVersion !== 4
    || typed.transactionId !== MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID
  ) throw new Error("unsupported composed integrated model checkpoint schema");
  digest(typed.checkpointSha256, "composed integrated checkpoint SHA-256");
  digest(
    typed.composedRhythmConfigurationIdentitySha256,
    "composed integrated checkpoint rhythm configuration SHA-256 identity",
  );
  digest(
    typed.dynamicMechanicalSupportProfileIdentitySha256,
    "composed integrated checkpoint dynamic MCS profile SHA-256 identity",
  );
  digest(
    typed.dynamicMechanicalSupportStructuralHydraulicIdentitySha256,
    "composed integrated checkpoint dynamic MCS structural hydraulic SHA-256 identity",
  );
  digest(
    typed.hemodynamicResearchInputIdentitySha256,
    "composed integrated checkpoint hemodynamic research input SHA-256 identity",
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
