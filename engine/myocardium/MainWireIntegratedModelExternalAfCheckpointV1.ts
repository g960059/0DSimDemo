import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_CLAIM_V1,
  MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_V1_ID,
  validateMainWireIntegratedModelExternalAfAcceptedStateV1,
  wrapMainWireIntegratedModelExternalAfAcceptedStateV1,
  type MainWireIntegratedModelExternalAfAcceptedStateV1,
  type MainWireIntegratedModelExternalAfBindingContextV1,
} from "@/engine/myocardium/MainWireIntegratedModelExternalAfTransactionV1";
import {
  checkpointAcceptedAfAtrialSourceStateV1,
  restoreAcceptedAfAtrialSourceStateV1,
  type AcceptedAfAtrialSourceCheckpointV1,
} from "@/engine/myocardium/rhythm/acceptedAfAtrialSourceOwnerCheckpointV1";
import {
  sha256AcceptedAfAtrialSourceIdentityV1,
  validateAcceptedAfAtrialSourceConfigurationV1,
  type AcceptedAfAtrialSourceConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedAfAtrialSourceOwnerV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_V1_ID =
  "circleheart.main-wire-integrated-model-external-af-wrapper-checkpoint.v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_CLAIM_V1 =
  deepFreeze({
    acceptedTuple:
      "accepted-AF-source-owner-v1-plus-main-wire-integrated-model-v3" as const,
    integrity:
      "outer-sha-256-over-canonical-json-containing-AF-and-main-V3-nested-sha-checkpoints" as const,
    nestedIntegrity: Object.freeze({
      afSource:
        "verified-AF-owner-checkpoint-with-PRNG-spare-history-and-all-random-counters" as const,
      integratedModel:
        "verified-main-V3-checkpoint-with-coronary-composed-rhythm-calcium-and-dynamic-MCS-state" as const,
    }),
    ownerClock:
      "outer-AF-source-and-main-V3-clocks-and-revisions-must-match-exactly" as const,
    configurationIdentity: Object.freeze({
      afSource:
        "sha-256-over-complete-AF-owner-configuration-and-construction-claim" as const,
      composedRhythm:
        "sha-256-over-complete-main-V3-composed-rhythm-configuration" as const,
      jointBinding:
        "sha-256-over-both-identities-and-external-AF-owner-instance" as const,
    }),
    fullAfOwnerStateStored: true as const,
    fullMainV3CheckpointStored: true as const,
    providerStored: false as const,
    exactRestoreRequiresExpectedProviderAndCompleteContexts: true as const,
    authenticationClaimed: false as const,
    migrationClaimed: false as const,
    clockRebaseClaimed: false as const,
    coordinatedAfAtrialCalciumClaimed: false as const,
    patientFittingClaimed: false as const,
    newPhysiologicalValidationClaimed: false as const,
    clinicalValidityClaimed: false as const,
    transactionSemantics:
      MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_CLAIM_V1,
  });

export type MainWireIntegratedModelExternalAfCheckpointContextV1<TWallState> =
  Readonly<{
    afSourceConfiguration: AcceptedAfAtrialSourceConfigurationV1;
    integratedModel: MainWireIntegratedModelCheckpointContextV3<TWallState>;
  }>;

export type MainWireIntegratedModelExternalAfCheckpointPayloadV1 = Readonly<{
  checkpointId: typeof MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_V1_ID;
  schemaVersion: 1;
  transactionId: typeof MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  afSourceConfigurationIdentitySha256: string;
  composedRhythmConfigurationIdentitySha256: string;
  jointExternalAfBindingIdentitySha256: string;
  afSource: AcceptedAfAtrialSourceCheckpointV1;
  integratedModel: MainWireIntegratedModelCheckpointV3;
  exactResumeClaim: typeof MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_CLAIM_V1;
}>;

export type MainWireIntegratedModelExternalAfCheckpointV1 =
  MainWireIntegratedModelExternalAfCheckpointPayloadV1 &
    Readonly<{ checkpointSha256: string }>;

const CHECKPOINT_PAYLOAD_KEYS = Object.freeze([
  "checkpointId",
  "schemaVersion",
  "transactionId",
  "revision",
  "acceptedTimeSec",
  "afSourceConfigurationIdentitySha256",
  "composedRhythmConfigurationIdentitySha256",
  "jointExternalAfBindingIdentitySha256",
  "afSource",
  "integratedModel",
  "exactResumeClaim",
] as const);
const CHECKPOINT_KEYS = Object.freeze([
  ...CHECKPOINT_PAYLOAD_KEYS,
  "checkpointSha256",
] as const);

export async function checkpointMainWireIntegratedModelExternalAfV1<TWallState>(
  context: MainWireIntegratedModelExternalAfCheckpointContextV1<TWallState>,
  state: MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>,
): Promise<MainWireIntegratedModelExternalAfCheckpointV1> {
  validateCheckpointContext(context);
  const bindingContext = bindingContextFromCheckpointContext(context);
  validateMainWireIntegratedModelExternalAfAcceptedStateV1(
    state,
    bindingContext,
  );
  const [
    afSource,
    integratedModel,
    afSourceConfigurationIdentitySha256,
    composedRhythmConfigurationIdentitySha256,
  ] = await Promise.all([
    checkpointAcceptedAfAtrialSourceStateV1(state.afSource),
    checkpointMainWireIntegratedModelV3(
      context.integratedModel,
      state.integratedModel,
    ),
    sha256AcceptedAfAtrialSourceIdentityV1(context.afSourceConfiguration),
    sha256CanonicalJsonHex(context.integratedModel.rhythm.configuration),
  ]);
  const jointExternalAfBindingIdentitySha256 = await jointBindingIdentitySha256(
    afSourceConfigurationIdentitySha256,
    composedRhythmConfigurationIdentitySha256,
    context.afSourceConfiguration.ownerInstanceId,
  );
  assertNestedClocks(
    state.revision,
    state.acceptedTimeSec,
    afSource,
    integratedModel,
  );
  if (
    integratedModel.composedRhythmConfigurationIdentitySha256 !==
    composedRhythmConfigurationIdentitySha256
  ) {
    throw new Error(
      "external-AF wrapper and nested V3 rhythm identities differ",
    );
  }
  const payload = deepFreeze({
    checkpointId: MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    transactionId: MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_V1_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    afSourceConfigurationIdentitySha256,
    composedRhythmConfigurationIdentitySha256,
    jointExternalAfBindingIdentitySha256,
    afSource,
    integratedModel,
    exactResumeClaim:
      MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_CLAIM_V1,
  }) satisfies MainWireIntegratedModelExternalAfCheckpointPayloadV1;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Exact restore only; no clock rebase, migration, or context substitution. */
export async function restoreMainWireIntegratedModelExternalAfV1<TWallState>(
  context: MainWireIntegratedModelExternalAfCheckpointContextV1<TWallState>,
  input: unknown,
): Promise<MainWireIntegratedModelExternalAfAcceptedStateV1<TWallState>> {
  validateCheckpointContext(context);
  assertCheckpointEnvelope(input);
  canonicalJsonStringify(input);
  const checkpoint = input;
  const { checkpointSha256, ...payload } = checkpoint;
  if ((await sha256CanonicalJsonHex(payload)) !== checkpointSha256) {
    throw new Error("external-AF integrated checkpoint outer SHA-256 mismatch");
  }
  if (
    canonicalJsonStringify(checkpoint.exactResumeClaim) !==
    canonicalJsonStringify(
      MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_CLAIM_V1,
    )
  ) {
    throw new Error("external-AF integrated checkpoint claim mismatch");
  }
  const [
    expectedAfSourceConfigurationIdentitySha256,
    expectedComposedRhythmConfigurationIdentitySha256,
  ] = await Promise.all([
    sha256AcceptedAfAtrialSourceIdentityV1(context.afSourceConfiguration),
    sha256CanonicalJsonHex(context.integratedModel.rhythm.configuration),
  ]);
  const expectedJointExternalAfBindingIdentitySha256 =
    await jointBindingIdentitySha256(
      expectedAfSourceConfigurationIdentitySha256,
      expectedComposedRhythmConfigurationIdentitySha256,
      context.afSourceConfiguration.ownerInstanceId,
    );
  if (
    checkpoint.afSourceConfigurationIdentitySha256 !==
    expectedAfSourceConfigurationIdentitySha256
  ) {
    throw new Error(
      "external-AF integrated checkpoint AF configuration identity mismatch",
    );
  }
  if (
    checkpoint.composedRhythmConfigurationIdentitySha256 !==
      expectedComposedRhythmConfigurationIdentitySha256 ||
    checkpoint.integratedModel.composedRhythmConfigurationIdentitySha256 !==
      expectedComposedRhythmConfigurationIdentitySha256
  ) {
    throw new Error(
      "external-AF integrated checkpoint rhythm configuration identity mismatch",
    );
  }
  if (
    checkpoint.jointExternalAfBindingIdentitySha256 !==
    expectedJointExternalAfBindingIdentitySha256
  ) {
    throw new Error(
      "external-AF integrated checkpoint joint configuration binding mismatch",
    );
  }
  assertNestedClocks(
    checkpoint.revision,
    checkpoint.acceptedTimeSec,
    checkpoint.afSource,
    checkpoint.integratedModel,
  );
  const [afSource, integratedModel] = await Promise.all([
    restoreAcceptedAfAtrialSourceStateV1(
      checkpoint.afSource,
      context.afSourceConfiguration,
    ),
    restoreMainWireIntegratedModelV3(
      context.integratedModel,
      checkpoint.integratedModel,
    ),
  ]);
  if (
    afSource.revision !== checkpoint.revision ||
    integratedModel.revision !== checkpoint.revision ||
    afSource.acceptedTimeSec !== checkpoint.acceptedTimeSec ||
    integratedModel.acceptedTimeSec !== checkpoint.acceptedTimeSec
  ) {
    throw new Error(
      "external-AF integrated checkpoint restored owner clocks differ",
    );
  }
  return wrapMainWireIntegratedModelExternalAfAcceptedStateV1(
    afSource,
    integratedModel,
    bindingContextFromCheckpointContext(context),
  );
}

function validateCheckpointContext<TWallState>(
  context: MainWireIntegratedModelExternalAfCheckpointContextV1<TWallState>,
): void {
  assertExactKeys(
    context,
    ["afSourceConfiguration", "integratedModel"],
    "external-AF integrated checkpoint context",
  );
  validateAcceptedAfAtrialSourceConfigurationV1(context.afSourceConfiguration);
  if (
    context.integratedModel === null ||
    typeof context.integratedModel !== "object" ||
    context.integratedModel.rhythm === null ||
    typeof context.integratedModel.rhythm !== "object" ||
    context.integratedModel.rhythm.configuration === undefined
  ) {
    throw new Error(
      "external-AF integrated checkpoint expected Main V3 context is required",
    );
  }
  const rhythmConfiguration = context.integratedModel.rhythm.configuration;
  if (
    rhythmConfiguration.atrialSource.mode !== "external-af" ||
    rhythmConfiguration.atrialSource.externalAfOwnerInstanceId !==
      context.afSourceConfiguration.ownerInstanceId
  ) {
    throw new Error(
      "external-AF integrated checkpoint context owner binding mismatch",
    );
  }
}

function bindingContextFromCheckpointContext<TWallState>(
  context: MainWireIntegratedModelExternalAfCheckpointContextV1<TWallState>,
): MainWireIntegratedModelExternalAfBindingContextV1 {
  return Object.freeze({
    afSourceConfiguration: context.afSourceConfiguration,
    rhythm: context.integratedModel.rhythm,
    dynamicMechanicalSupportProfile:
      context.integratedModel.dynamicMechanicalSupportProfile,
    dynamicMechanicalSupportConfig:
      context.integratedModel.dynamicMechanicalSupportConfig,
  });
}

async function jointBindingIdentitySha256(
  afSourceConfigurationIdentitySha256: string,
  composedRhythmConfigurationIdentitySha256: string,
  externalAfOwnerInstanceId: string,
): Promise<string> {
  return sha256CanonicalJsonHex({
    schemaId: "main-wire-integrated-model-external-af-binding-v1",
    afSourceConfigurationIdentitySha256,
    composedRhythmConfigurationIdentitySha256,
    externalAfOwnerInstanceId,
  });
}

function assertNestedClocks(
  revision: number,
  acceptedTimeSec: number,
  afSource: Readonly<{ revision: number; acceptedTimeSec: number }>,
  integratedModel: Readonly<{ revision: number; acceptedTimeSec: number }>,
): void {
  requireNonnegativeSafeInteger(
    revision,
    "external-AF integrated checkpoint revision",
  );
  requireNonnegativeFinite(
    acceptedTimeSec,
    "external-AF integrated checkpoint acceptedTimeSec",
  );
  if (
    afSource.revision !== revision ||
    integratedModel.revision !== revision ||
    afSource.acceptedTimeSec !== acceptedTimeSec ||
    integratedModel.acceptedTimeSec !== acceptedTimeSec
  ) {
    throw new Error(
      "external-AF integrated checkpoint nested owner clocks differ",
    );
  }
}

function assertCheckpointEnvelope(
  input: unknown,
): asserts input is MainWireIntegratedModelExternalAfCheckpointV1 {
  assertExactKeys(input, CHECKPOINT_KEYS, "external-AF integrated checkpoint");
  const typed = input as Partial<MainWireIntegratedModelExternalAfCheckpointV1>;
  if (
    typed.checkpointId !==
      MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_CHECKPOINT_V1_ID ||
    typed.schemaVersion !== 1 ||
    typed.transactionId !==
      MAIN_WIRE_INTEGRATED_MODEL_EXTERNAL_AF_TRANSACTION_V1_ID
  ) {
    throw new Error("unsupported external-AF integrated checkpoint schema");
  }
  digest(typed.checkpointSha256, "external-AF checkpoint SHA-256");
  digest(
    typed.afSourceConfigurationIdentitySha256,
    "external-AF checkpoint AF configuration identity",
  );
  digest(
    typed.composedRhythmConfigurationIdentitySha256,
    "external-AF checkpoint rhythm configuration identity",
  );
  digest(
    typed.jointExternalAfBindingIdentitySha256,
    "external-AF checkpoint joint binding identity",
  );
}

function digest(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${field} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function requireNonnegativeSafeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function requireNonnegativeFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative finite`);
  }
  return Object.is(value, -0) ? 0 : value;
}

function assertExactKeys(
  value: unknown,
  expected: readonly string[],
  field: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${field} must be a plain object`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    throw new Error(`${field} contains a non-string key`);
  }
  const actual = (keys as string[]).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
