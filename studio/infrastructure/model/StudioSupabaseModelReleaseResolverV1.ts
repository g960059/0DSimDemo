import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ModelContractV2,
  RegisteredModelPackageManifestV2,
} from "@/studio/contracts/v2/model";
import {
  assertPortableStudioJsonObjectV2,
  deriveModelContractFromManifestV2,
} from "@/studio/contracts/v2/model";
import type {
  ExactModelKernelManifestV3,
  StudioReleaseChannelV1,
  StudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  assertExactModelKernelManifestV3,
  assertStudioReleaseChannelV1,
  assertStudioReleaseStageV1,
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import type { StudioJsonObjectV2 } from "@/studio/contracts/v2/json";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
  validateRegisteredModelModuleAbiV2,
  validateStudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  readStudioSupabaseConfigurationV1,
  studioSupabaseClientV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseClientV1";
import {
  StudioSupabaseModelSurfaceResolverV1,
  studioSupabaseModelSurfaceResolverV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelSurfaceResolverV1";

export type StudioResolvedModelReleaseV1 = Readonly<{
  contract: ModelContractV2;
  defaultFixture: StudioJsonObjectV2;
  analysisProfileId: string;
  stage: StudioReleaseStageV1;
  ticket: StudioModelWorkerReleaseTicketV2;
  surfaceReleaseId?: string;
  surfaceStage?: StudioReleaseStageV1;
}>;

export type StudioModelReleaseRpcResultV1 = Readonly<{
  data: unknown;
  error: Readonly<{ message: string }> | null;
}>;

export interface StudioModelReleaseRpcPortV1 {
  call(
    functionName: "get_model_release_v3" | "get_model_release_channel_v3",
    parameters: Readonly<Record<string, string>>,
  ): Promise<StudioModelReleaseRpcResultV1>;
}

export type StudioExactModelUnavailableReasonV1 =
  | "registry-read-failed"
  | "not-registered-or-loadable"
  | "invalid-release-record";

export class StudioExactModelUnavailableErrorV1 extends Error {
  readonly modelId: string;
  readonly reason: StudioExactModelUnavailableReasonV1;

  constructor(
    modelId: string,
    reason: StudioExactModelUnavailableReasonV1,
    detail?: string,
  ) {
    super(detail === undefined
      ? `Exact model ${modelId} is unavailable (${reason})`
      : `Exact model ${modelId} is unavailable (${reason}): ${detail}`);
    this.name = "StudioExactModelUnavailableErrorV1";
    this.modelId = modelId;
    this.reason = reason;
  }
}

/**
 * Hash-free browser projection of the trusted exact-model registry.
 * Exact model promises are cached for the page lifetime; channel pointers are
 * deliberately resolved afresh and immediately pinned to the returned ID.
 */
export class StudioSupabaseModelReleaseResolverV1 {
  readonly #rpc: StudioModelReleaseRpcPortV1;
  readonly #supabaseOrigin: string;
  readonly #surfaceResolver: StudioSupabaseModelSurfaceResolverV1 | null;
  readonly #releasePromises = new Map<string, Promise<StudioResolvedModelReleaseV1>>();

  constructor(dependencies: Readonly<{
    rpc: StudioModelReleaseRpcPortV1;
    supabaseOrigin: string;
    surfaceResolver?: StudioSupabaseModelSurfaceResolverV1 | null;
  }>) {
    this.#rpc = dependencies.rpc;
    this.#supabaseOrigin = validateSupabaseOriginV1(dependencies.supabaseOrigin);
    this.#surfaceResolver = dependencies.surfaceResolver ?? null;
  }

  resolveExactModel(modelId: string): Promise<StudioResolvedModelReleaseV1> {
    const cached = this.#releasePromises.get(modelId);
    if (cached !== undefined) return cached;
    const pending = this.#readExactModel(modelId);
    this.#releasePromises.set(modelId, pending);
    void pending.catch(() => {
      if (this.#releasePromises.get(modelId) === pending) {
        this.#releasePromises.delete(modelId);
      }
    });
    return pending;
  }

  async resolveChannel(
    channel: StudioReleaseChannelV1,
  ): Promise<StudioResolvedModelReleaseV1> {
    assertStudioReleaseChannelV1(channel);
    const resolved = await this.#readOne(
      "get_model_release_channel_v3",
      Object.freeze({ p_channel: channel }),
      channel,
    );
    const cached = this.#releasePromises.get(resolved.contract.modelId);
    if (cached !== undefined) return cached;
    const owned = Promise.resolve(resolved);
    this.#releasePromises.set(resolved.contract.modelId, owned);
    return owned;
  }

  async #readOne(
    functionName: "get_model_release_v3" | "get_model_release_channel_v3",
    parameters: Readonly<Record<string, string>>,
    surfaceChannel?: StudioReleaseChannelV1,
  ): Promise<StudioResolvedModelReleaseV1> {
    const result = await this.#rpc.call(functionName, parameters);
    if (result.error !== null) {
      throw new Error(`Exact model registry lookup failed: ${result.error.message}`);
    }
    if (!Array.isArray(result.data) || result.data.length !== 1) {
      throw new Error("Exact model release is unavailable");
    }
    return this.#ownReleaseRow(result.data[0], surfaceChannel);
  }

  async #readExactModel(modelId: string): Promise<StudioResolvedModelReleaseV1> {
    const result = await this.#rpc.call(
      "get_model_release_v3",
      Object.freeze({ p_model_id: modelId }),
    );
    if (result.error !== null) {
      throw new StudioExactModelUnavailableErrorV1(
        modelId,
        "registry-read-failed",
        result.error.message,
      );
    }
    if (!Array.isArray(result.data) || result.data.length !== 1) {
      throw new StudioExactModelUnavailableErrorV1(
        modelId,
        "not-registered-or-loadable",
      );
    }
    try {
      return await this.#ownReleaseRow(result.data[0]);
    } catch (error) {
      throw new StudioExactModelUnavailableErrorV1(
        modelId,
        "invalid-release-record",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async #ownReleaseRow(
    value: unknown,
    requestedSurfaceChannel?: StudioReleaseChannelV1,
  ): Promise<StudioResolvedModelReleaseV1> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Exact model registry returned an invalid row");
    }
    const row = value as Record<string, unknown>;
    const modelId = requiredStringV1(row.model_id, "model_id");
    const artifactPath = requiredStringV1(row.artifact_path, "artifact_path");
    const moduleAbi = validateRegisteredModelModuleAbiV2(
      row.module_abi,
      "$.module_abi",
    );
    assertPortableStudioJsonObjectV2(
      row.default_fixture,
      "$.default_fixture",
    );
    const defaultFixture = ownJsonObjectV1(row.default_fixture);
    const analysisProfileId = requiredStringV1(
      row.analysis_profile_id,
      "analysis_profile_id",
    );
    assertStudioReleaseStageV1(row.stage, "$.stage");
    const artifactUrl = publicArtifactUrlV1(this.#supabaseOrigin, artifactPath);
    if (moduleAbi === "circleheart-exact-model-esm-v1") {
      assertExactModelKernelManifestV3(row.manifest);
      const kernel = ownJsonObjectV1(row.manifest) as
        unknown as ExactModelKernelManifestV3;
      if (this.#surfaceResolver === null) {
        throw new Error("Standard exact model requires the Model Surface registry");
      }
      const surfaceChannel = requestedSurfaceChannel
        ?? (row.stage === "dev" ? "research" : "default");
      const surface = await this.#surfaceResolver.resolveChannelManifest(
        surfaceChannel,
        kernel.modelFamilyId,
      );
      const composed = composeStandardModelContractV1(
        kernel,
        surface.manifest,
      );
      const ticket = validateStudioModelWorkerReleaseTicketV2({
        schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
        modelId,
        manifest: kernel,
        surfaceRelease: surface.manifest,
        moduleAbi,
        artifactUrl,
      });
      return Object.freeze({
        contract: composed.contract,
        defaultFixture,
        analysisProfileId,
        stage: row.stage,
        ticket,
        surfaceReleaseId: composed.surface.surfaceReleaseId,
        surfaceStage: surface.stage,
      });
    }
    const ticket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId,
      manifest: row.manifest as RegisteredModelPackageManifestV2,
      moduleAbi,
      artifactUrl,
    });
    return Object.freeze({
      contract: deriveModelContractFromManifestV2(ticket.manifest),
      defaultFixture,
      analysisProfileId,
      stage: row.stage,
      ticket,
    });
  }
}

let sharedResolverV1: StudioSupabaseModelReleaseResolverV1 | null | undefined;

export function studioSupabaseModelReleaseResolverV1():
StudioSupabaseModelReleaseResolverV1 | null {
  if (sharedResolverV1 !== undefined) return sharedResolverV1;
  const configuration = readStudioSupabaseConfigurationV1();
  const client = studioSupabaseClientV1();
  sharedResolverV1 = configuration === null || client === null
    ? null
    : new StudioSupabaseModelReleaseResolverV1({
        rpc: supabaseRpcPortV1(client),
        supabaseOrigin: configuration.url,
        surfaceResolver: studioSupabaseModelSurfaceResolverV1(),
      });
  return sharedResolverV1;
}

function supabaseRpcPortV1(client: SupabaseClient): StudioModelReleaseRpcPortV1 {
  return Object.freeze({
    async call(functionName, parameters) {
      const result = await client.rpc(functionName, parameters);
      return Object.freeze({
        data: result.data,
        error: result.error === null
          ? null
          : Object.freeze({ message: result.error.message }),
      });
    },
  });
}

function publicArtifactUrlV1(origin: string, artifactPath: string): string {
  const segments = artifactPath.split("/");
  if (
    segments.length < 2
    || segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    throw new Error("Exact model artifact path is invalid");
  }
  return `${origin}/storage/v1/object/public/${segments.map(encodeURIComponent).join("/")}`;
}

function validateSupabaseOriginV1(value: string): string {
  const parsed = new URL(value);
  if (
    parsed.protocol !== "https:"
    && !(parsed.protocol === "http:" && (
      parsed.hostname === "127.0.0.1"
      || parsed.hostname === "localhost"
      || parsed.hostname === "[::1]"
    ))
  ) {
    throw new Error("Model registry origin must use HTTPS or loopback HTTP");
  }
  return parsed.origin;
}

function requiredStringV1(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    throw new Error(`Exact model registry ${field} is invalid`);
  }
  return value;
}

function ownJsonObjectV1(value: StudioJsonObjectV2): StudioJsonObjectV2 {
  return deepFreezeV1(JSON.parse(JSON.stringify(value)) as StudioJsonObjectV2);
}

function deepFreezeV1<TValue>(value: TValue): TValue {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeV1(child);
    }
    Object.freeze(value);
  }
  return value;
}
