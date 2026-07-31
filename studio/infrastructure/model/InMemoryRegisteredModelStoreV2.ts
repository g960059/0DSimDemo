import type {
  ModelContractV2,
  RegisteredModelPackageManifestV2,
  RegisteredModelResolverPortV2,
  ResolvedModelPackageV2,
} from "@/studio/contracts/v2/model";
import {
  assertCaptureAdapterMatchesModelV2,
  assertModelContractV2,
  assertPortableModelIdentifierV2,
  assertRegisteredModelPackageManifestV2,
  deriveModelContractFromManifestV2,
  ModelContractValidationErrorV2,
} from "@/studio/contracts/v2/model";
import type {
  ExactModelRuntimeResolverPortV2,
  RegisteredModelExecutableBundleV2,
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import {
  cloneAndFreezeStudioJson,
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";

type StoredRegisteredModelV2 = Readonly<{
  resolvedPackage: ResolvedModelPackageV2;
  exactRuntime: ResolvedExactModelRuntimeV2;
  canonicalManifest: string;
  executableArtifact: Uint8Array;
}>;

type PreparedRegistrationInputV2 = Omit<
  StoredRegisteredModelV2,
  "exactRuntime"
>;

export type RegisterExactModelPackageInputV2 = Readonly<{
  manifest: RegisteredModelPackageManifestV2;
  /** Exact built artifact bytes, consumed only by trusted registry admission. */
  executableArtifact: Uint8Array;
  /** Trusted server loader must materialize this exact byte artifact. */
  loadExecutables(
    executableArtifact: Uint8Array,
  ): RegisteredModelExecutableBundleV2;
}>;

export class RegisteredModelValidationErrorV2 extends Error {
  constructor(message: string) {
    super(`Studio V2 model registration rejected: ${message}`);
    this.name = "RegisteredModelValidationErrorV2";
  }
}

export class RegisteredModelConflictErrorV2 extends Error {
  constructor(modelId: string) {
    super(
      `Studio V2 model registration conflicts with immutable modelId ${modelId}`,
    );
    this.name = "RegisteredModelConflictErrorV2";
  }
}

export class RegisteredModelNotFoundErrorV2 extends Error {
  constructor(modelId: string) {
    super(`Studio V2 registered model not found: ${modelId}`);
    this.name = "RegisteredModelNotFoundErrorV2";
  }
}

/**
 * Registry-owned, digest-addressed storage for exact V2 model releases.
 *
 * The SHA-256 is used only as the private map key. Callers register and resolve
 * by exact opaque `modelId`; neither resolution path hashes content or exposes
 * the digest.
 */
export class InMemoryRegisteredModelStoreV2
implements RegisteredModelResolverPortV2, ExactModelRuntimeResolverPortV2 {
  readonly #digestByModelId = new Map<string, string>();
  readonly #packageByDigest = new Map<string, StoredRegisteredModelV2>();

  get modelCount(): number {
    return this.#digestByModelId.size;
  }

  get packageCount(): number {
    return this.#packageByDigest.size;
  }

  async registerExactPackage(
    input: RegisterExactModelPackageInputV2,
  ): Promise<ModelContractV2> {
    const prepared = prepareRegistrationInputV2(input);
    const digest = await sha256ExactPackageV2(
      prepared.canonicalManifest,
      prepared.executableArtifact,
    );

    const priorDigest = this.#digestByModelId.get(
      prepared.resolvedPackage.contract.modelId,
    );
    if (priorDigest !== undefined) {
      const prior = this.#packageByDigest.get(priorDigest);
      if (
        priorDigest !== digest
        || prior === undefined
        || prior.canonicalManifest !== prepared.canonicalManifest
        || !sameBytesV2(
          prior.executableArtifact,
          prepared.executableArtifact,
        )
      ) {
        throw new RegisteredModelConflictErrorV2(
          prepared.resolvedPackage.contract.modelId,
        );
      }
      return prior.resolvedPackage.contract;
    }

    const priorPackage = this.#packageByDigest.get(digest);
    if (
      priorPackage !== undefined
      && (
        priorPackage.canonicalManifest !== prepared.canonicalManifest
        || !sameBytesV2(
          priorPackage.executableArtifact,
          prepared.executableArtifact,
        )
      )
    ) {
      throw new RegisteredModelValidationErrorV2(
        "SHA-256 collision across unequal canonical model packages",
      );
    }

    const executables = input.loadExecutables(
      new Uint8Array(prepared.executableArtifact),
    );
    validateExecutableBundleV2(
      executables,
      prepared.resolvedPackage.contract,
    );
    const stored: StoredRegisteredModelV2 = Object.freeze({
      ...prepared,
      exactRuntime: freezeExactRuntimeV2(
        executables,
        prepared.resolvedPackage.contract,
      ),
    });

    // No await occurs between the final conflict checks and this commit.
    this.#packageByDigest.set(digest, stored);
    this.#digestByModelId.set(
      prepared.resolvedPackage.contract.modelId,
      digest,
    );
    return prepared.resolvedPackage.contract;
  }

  resolveContract(modelId: string): ModelContractV2 {
    return this.#resolveStoredV2(modelId).resolvedPackage.contract;
  }

  resolvePackage(modelId: string): ResolvedModelPackageV2 {
    return this.#resolveStoredV2(modelId).resolvedPackage;
  }

  resolveExactRuntime(modelId: string): ResolvedExactModelRuntimeV2 {
    return this.#resolveStoredV2(modelId).exactRuntime;
  }

  #resolveStoredV2(modelId: string): StoredRegisteredModelV2 {
    assertPortableModelIdentifierV2(modelId, "$.modelId");
    const digest = this.#digestByModelId.get(modelId);
    const stored = digest === undefined
      ? undefined
      : this.#packageByDigest.get(digest);
    if (stored === undefined) {
      throw new RegisteredModelNotFoundErrorV2(modelId);
    }
    return stored;
  }
}

function prepareRegistrationInputV2(
  input: RegisterExactModelPackageInputV2,
): PreparedRegistrationInputV2 {
  if (
    !(input.executableArtifact instanceof Uint8Array)
    || input.executableArtifact.byteLength === 0
  ) {
    throw new RegisteredModelValidationErrorV2(
      "exact executable artifact bytes must be a nonempty Uint8Array",
    );
  }
  if (typeof input.loadExecutables !== "function") {
    throw new RegisteredModelValidationErrorV2(
      "trusted executable loader is required",
    );
  }
  let detached: unknown;
  try {
    detached = cloneAndFreezeStudioJson(
      input.manifest,
    );
  } catch (error) {
    throw new RegisteredModelValidationErrorV2(errorMessageV2(error));
  }

  try {
    assertRegisteredModelPackageManifestV2(detached);
  } catch (error) {
    if (error instanceof ModelContractValidationErrorV2) {
      throw new RegisteredModelValidationErrorV2(error.message);
    }
    throw error;
  }

  const manifest = detached;
  const contract = deriveModelContractFromManifestV2(manifest);
  assertModelContractV2(contract);
  const executableArtifact = new Uint8Array(input.executableArtifact);
  const resolvedPackage = Object.freeze({
    contract,
    manifest,
  });
  return Object.freeze({
    resolvedPackage,
    canonicalManifest: studioCanonicalJsonStringify(manifest),
    executableArtifact,
  });
}

export function validateExecutableBundleV2(
  bundle: RegisteredModelExecutableBundleV2,
  model: ModelContractV2,
): void {
  if (bundle === null || typeof bundle !== "object") {
    throw new RegisteredModelValidationErrorV2(
      "executable bundle must be an object",
    );
  }
  assertExactExecutableKeysV2(bundle, [
    "modelId",
    "fixtureSchemaId",
    "checkpointCodecId",
    "snapshotGateId",
    "captureAdapter",
    "draftCapture",
    "snapshotGate",
    "fixtureAdapter",
    "simulationAdapter",
  ], "executable bundle");
  assertExactExecutableKeysV2(bundle.captureAdapter, [
    "modelId",
    "fixtureSchemaId",
    "checkpointCodecId",
    "validateFixture",
    "validateCapture",
  ], "capture adapter");
  assertExactExecutableKeysV2(bundle.draftCapture, [
    "modelId",
    "fixtureSchemaId",
    "checkpointCodecId",
    "captureAcceptedCandidate",
  ], "Draft capture adapter");
  assertExactExecutableKeysV2(bundle.snapshotGate, [
    "modelId",
    "snapshotGateId",
    "qualifyFrozenCandidate",
  ], "Snapshot gate adapter");
  assertExactExecutableKeysV2(bundle.fixtureAdapter, [
    "modelId",
    "fixtureSchemaId",
    "validateCompleteFixture",
    ...(bundle.fixtureAdapter.reduceKnobAction === undefined
      ? []
      : ["reduceKnobAction"]),
  ], "fixture adapter");
  assertExactExecutableKeysV2(bundle.simulationAdapter, [
    "modelId",
    "fixtureSchemaId",
    "checkpointCodecId",
    "createSession",
    "disposeSession",
    "currentFrame",
    "advanceOnePresentationStep",
    "replaceFixture",
    "currentInputEpoch",
  ], "simulation adapter");
  if (
    bundle.modelId !== model.modelId
    || bundle.fixtureSchemaId !== model.fixtureSchemaId
    || bundle.checkpointCodecId !== model.checkpointCodecId
    || bundle.snapshotGateId !== model.snapshotGateId
  ) {
    throw new RegisteredModelValidationErrorV2(
      "executable bundle identity must exactly match its manifest",
    );
  }
  assertCaptureAdapterMatchesModelV2(bundle.captureAdapter, model);
  if (
    bundle.draftCapture?.modelId !== model.modelId
    || bundle.draftCapture.fixtureSchemaId !== model.fixtureSchemaId
    || bundle.draftCapture.checkpointCodecId !== model.checkpointCodecId
    || typeof bundle.draftCapture.captureAcceptedCandidate !== "function"
    || bundle.snapshotGate?.modelId !== model.modelId
    || bundle.snapshotGate.snapshotGateId !== model.snapshotGateId
    || typeof bundle.snapshotGate.qualifyFrozenCandidate !== "function"
    || bundle.fixtureAdapter?.modelId !== model.modelId
    || bundle.fixtureAdapter.fixtureSchemaId !== model.fixtureSchemaId
    || typeof bundle.fixtureAdapter.validateCompleteFixture !== "function"
    || bundle.simulationAdapter?.modelId !== model.modelId
    || bundle.simulationAdapter.fixtureSchemaId !== model.fixtureSchemaId
    || bundle.simulationAdapter.checkpointCodecId !== model.checkpointCodecId
    || typeof bundle.simulationAdapter.createSession !== "function"
    || typeof bundle.simulationAdapter.disposeSession !== "function"
    || typeof bundle.simulationAdapter.currentFrame !== "function"
    || typeof bundle.simulationAdapter.advanceOnePresentationStep !== "function"
    || typeof bundle.simulationAdapter.replaceFixture !== "function"
    || typeof bundle.simulationAdapter.currentInputEpoch !== "function"
    || (
      bundle.fixtureAdapter.reduceKnobAction !== undefined
      && typeof bundle.fixtureAdapter.reduceKnobAction !== "function"
    )
  ) {
    throw new RegisteredModelValidationErrorV2(
      "every executable adapter must exactly match the manifest identities",
    );
  }
}

export function freezeExactRuntimeV2(
  bundle: RegisteredModelExecutableBundleV2,
  contract: ModelContractV2,
): ResolvedExactModelRuntimeV2 {
  return Object.freeze({
    contract,
    captureAdapter: Object.freeze({
      modelId: bundle.captureAdapter.modelId,
      fixtureSchemaId: bundle.captureAdapter.fixtureSchemaId,
      checkpointCodecId: bundle.captureAdapter.checkpointCodecId,
      validateFixture: bundle.captureAdapter.validateFixture,
      validateCapture: bundle.captureAdapter.validateCapture,
    }),
    draftCapture: Object.freeze({
      modelId: bundle.draftCapture.modelId,
      fixtureSchemaId: bundle.draftCapture.fixtureSchemaId,
      checkpointCodecId: bundle.draftCapture.checkpointCodecId,
      captureAcceptedCandidate: bundle.draftCapture.captureAcceptedCandidate,
    }),
    snapshotGate: Object.freeze({
      modelId: bundle.snapshotGate.modelId,
      snapshotGateId: bundle.snapshotGate.snapshotGateId,
      qualifyFrozenCandidate: bundle.snapshotGate.qualifyFrozenCandidate,
    }),
    fixtureAdapter: Object.freeze({
      modelId: bundle.fixtureAdapter.modelId,
      fixtureSchemaId: bundle.fixtureAdapter.fixtureSchemaId,
      validateCompleteFixture: bundle.fixtureAdapter.validateCompleteFixture,
      ...(bundle.fixtureAdapter.reduceKnobAction === undefined
        ? {}
        : { reduceKnobAction: bundle.fixtureAdapter.reduceKnobAction }),
    }),
    simulationAdapter: Object.freeze({
      modelId: bundle.simulationAdapter.modelId,
      fixtureSchemaId: bundle.simulationAdapter.fixtureSchemaId,
      checkpointCodecId: bundle.simulationAdapter.checkpointCodecId,
      createSession: bundle.simulationAdapter.createSession,
      disposeSession: bundle.simulationAdapter.disposeSession,
      currentFrame: bundle.simulationAdapter.currentFrame,
      advanceOnePresentationStep:
        bundle.simulationAdapter.advanceOnePresentationStep,
      replaceFixture: bundle.simulationAdapter.replaceFixture,
      currentInputEpoch: bundle.simulationAdapter.currentInputEpoch,
    }),
  });
}

function assertExactExecutableKeysV2(
  value: unknown,
  expected: readonly string[],
  name: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new RegisteredModelValidationErrorV2(`${name} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw new RegisteredModelValidationErrorV2(
      `${name} must contain exactly ${required.join(", ")}`,
    );
  }
}

async function sha256ExactPackageV2(
  canonicalManifest: string,
  executableArtifact: Uint8Array,
): Promise<string> {
  const manifestBytes = new TextEncoder().encode(canonicalManifest);
  const combined = new Uint8Array(8 + manifestBytes.length + executableArtifact.length);
  const lengths = new DataView(combined.buffer, combined.byteOffset, 8);
  lengths.setUint32(0, manifestBytes.length, false);
  lengths.setUint32(4, executableArtifact.length, false);
  combined.set(manifestBytes, 8);
  combined.set(executableArtifact, 8 + manifestBytes.length);
  const subtle = globalThis.crypto?.subtle;
  if (subtle === undefined) {
    throw new RegisteredModelValidationErrorV2("Web Crypto is required");
  }
  const digest = await subtle.digest("SHA-256", combined);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

function sameBytesV2(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}


function errorMessageV2(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type {
  RegisteredModelPackageManifestV2,
  ResolvedModelPackageV2,
};
