import type { SupabaseClient } from "@supabase/supabase-js";

import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import {
  resolveStudioAnalysisMethodsForSurfaceV1,
  type StudioPeriodicPvaDerivationV1,
} from "@/studio/analysis/StudioAnalysisMethodRegistryV1";
import type {
  StudioSimulationAnalysisExecutionPlanResolverV2,
} from "@/studio/contracts/v2/simulation";
import {
  assertPortableStudioJsonObjectV2,
} from "@/studio/contracts/v2/model";
import type {
  ExactModelKernelManifestV3,
  ModelSurfaceReleaseManifestV1,
  StudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
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
  analysisExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
  periodicPvaDerivation: StudioPeriodicPvaDerivationV1 | null;
  stage: StudioReleaseStageV1;
  ticket: StudioModelWorkerReleaseTicketV2;
  surfaceReleaseId: string;
  surfaceSeriesId: string;
  surfaceStage: StudioReleaseStageV1;
  activeBundleVersion?: number;
}>;

export type StudioModelSurfacePinV1 =
  | Readonly<{
      kind: "series";
      surfaceSeriesId: string;
    }>
  | Readonly<{
      kind: "release";
      surfaceSeriesId: string;
      surfaceReleaseId: string;
    }>;

export type StudioModelReleaseRpcResultV1 = Readonly<{
  data: unknown;
  error: Readonly<{ message: string }> | null;
}>;

export interface StudioModelReleaseRpcPortV1 {
  call(
    functionName: "get_model_release_v2" | "get_active_model_bundle_v2",
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
 * Exact model promises are cached for the page lifetime. The active bundle is
 * resolved atomically and only once by each new Session composition.
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

  /**
   * Drops page-lifetime read promises without mutating any composition already
   * handed to a running Session. A later mutable Experiment open can then
   * observe a newer additive Surface in its pinned series.
   */
  invalidate(): void {
    this.#releasePromises.clear();
  }

  resolveExactModel(
    modelId: string,
    surfacePin: StudioModelSurfacePinV1,
  ): Promise<StudioResolvedModelReleaseV1> {
    const cacheKey = surfacePin.kind === "series"
      ? `${modelId}\u0000series\u0000${surfacePin.surfaceSeriesId}`
      : `${modelId}\u0000release\u0000${surfacePin.surfaceReleaseId}`;
    const cached = this.#releasePromises.get(cacheKey);
    if (cached !== undefined) return cached;
    const pending = this.#readExactModel(modelId, surfacePin);
    this.#releasePromises.set(cacheKey, pending);
    void pending.catch(() => {
      if (this.#releasePromises.get(cacheKey) === pending) {
        this.#releasePromises.delete(cacheKey);
      }
    });
    return pending;
  }

  async resolveActiveBundle(): Promise<StudioResolvedModelReleaseV1> {
    const result = await this.#rpc.call(
      "get_active_model_bundle_v2",
      Object.freeze({}),
    );
    if (result.error !== null) {
      throw new Error(`Active model bundle lookup failed: ${result.error.message}`);
    }
    if (!Array.isArray(result.data) || result.data.length !== 1) {
      throw new Error("Active model bundle is unavailable");
    }
    const value = result.data[0];
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Active model bundle returned an invalid row");
    }
    const row = value as Record<string, unknown>;
    const bundleVersion = nonnegativeIntegerV1(
      row.bundle_version,
      "bundle_version",
    );
    assertModelSurfaceReleaseManifestV1(row.surface_manifest);
    assertStudioReleaseStageV1(row.surface_stage, "$.surface_stage");
    if (row.model_stage !== "stable" || row.surface_stage !== "stable") {
      throw new Error("Active model bundle must contain stable releases");
    }
    if (row.module_abi !== "circleheart-exact-model-esm-v1") {
      throw new Error("Active model bundle must use the Standard module ABI");
    }
    if (row.surface_manifest.surfaceReleaseId !== row.surface_release_id) {
      throw new Error("Active model bundle Surface identity mismatch");
    }
    return this.#ownReleaseRow(
      Object.freeze({ ...row, stage: row.model_stage }),
      undefined,
      Object.freeze({
        manifest: row.surface_manifest,
        stage: row.surface_stage,
      }),
      bundleVersion,
    );
  }

  async #readExactModel(
    modelId: string,
    surfacePin: StudioModelSurfacePinV1,
  ): Promise<StudioResolvedModelReleaseV1> {
    const result = await this.#rpc.call(
      "get_model_release_v2",
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
      return await this.#ownReleaseRow(result.data[0], surfacePin);
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
    surfacePin?: StudioModelSurfacePinV1,
    activeSurface?: Readonly<{
      manifest: ModelSurfaceReleaseManifestV1;
      stage: StudioReleaseStageV1;
    }>,
    activeBundleVersion?: number,
  ): Promise<StudioResolvedModelReleaseV1> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Exact model registry returned an invalid row");
    }
    const row = value as Record<string, unknown>;
    const modelId = requiredStringV1(row.model_id, "model_id");
    const artifactRevisionId = requiredSha256V1(
      row.artifact_revision_id,
      "artifact_revision_id",
    );
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
    assertStudioReleaseStageV1(row.stage, "$.stage");
    const artifactUrl = publicArtifactUrlV1(this.#supabaseOrigin, artifactPath);
    assertExactModelKernelManifestV3(row.manifest);
    const kernel = ownJsonObjectV1(row.manifest) as
      unknown as ExactModelKernelManifestV3;
    if (activeSurface === undefined && this.#surfaceResolver === null) {
      throw new Error("Standard exact model requires the Model Surface registry");
    }
    const surface = activeSurface ?? (surfacePin?.kind === "release"
      ? await this.#surfaceResolver!.resolveExactSurfaceManifest(
          surfacePin.surfaceReleaseId,
          kernel.modelFamilyId,
        )
      : surfacePin?.kind === "series"
        ? await this.#surfaceResolver!.resolveLatestSeriesManifest(
            surfacePin.surfaceSeriesId,
            kernel.modelFamilyId,
            kernel.modelId,
          )
        : (() => {
            throw new Error(
              "Standard exact model requires an exact or series Surface pin",
            );
          })());
    if (
      surfacePin !== undefined
      && surface.manifest.surfaceSeriesId !== surfacePin.surfaceSeriesId
    ) {
      throw new Error("Pinned Model Surface belongs to another series");
    }
    const analysisMethods = resolveStudioAnalysisMethodsForSurfaceV1(
      surface.manifest,
      [...kernel.primitiveSignalCatalog, ...kernel.modelMetricCatalog],
    );
    const composed = composeStandardModelContractV1(
      kernel,
      surface.manifest,
      analysisMethods.capabilities,
    );
    const ticket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId,
      artifactRevisionId,
      manifest: kernel,
      surfaceRelease: surface.manifest,
      moduleAbi,
      artifactUrl,
    });
    return Object.freeze({
      contract: composed.contract,
      defaultFixture,
      analysisExecutionPlan: analysisMethods.resolveExecutionPlan,
      periodicPvaDerivation: analysisMethods.periodicPvaDerivation,
      stage: row.stage,
      ticket,
      surfaceReleaseId: composed.surface.surfaceReleaseId,
      surfaceSeriesId: surface.manifest.surfaceSeriesId,
      surfaceStage: surface.stage,
      ...(activeBundleVersion === undefined
        ? {}
        : { activeBundleVersion }),
    });
  }
}

function requiredSha256V1(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`Exact model registry returned invalid ${field}`);
  }
  return value;
}

function nonnegativeIntegerV1(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`Exact model registry returned invalid ${field}`);
  }
  return value as number;
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

export function invalidateStudioSupabaseModelReleaseResolverCacheV1(): void {
  sharedResolverV1?.invalidate();
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
