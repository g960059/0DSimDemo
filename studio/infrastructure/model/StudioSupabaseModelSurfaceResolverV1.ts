import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ModelSurfaceReleaseManifestV1,
  StudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  assertModelSurfaceReleaseManifestV1,
  assertStudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  readStudioSupabaseConfigurationV1,
  studioSupabaseClientV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseClientV1";

export type StudioResolvedModelSurfaceManifestV1 = Readonly<{
  manifest: ModelSurfaceReleaseManifestV1;
  stage: StudioReleaseStageV1;
}>;

export type StudioModelSurfaceRpcResultV1 = Readonly<{
  data: unknown;
  error: Readonly<{ message: string }> | null;
}>;

export interface StudioModelSurfaceRpcPortV1 {
  call(
    functionName:
      | "get_model_surface_release_v1"
      | "get_model_surface_series_latest_v1",
    parameters: Readonly<Record<string, string>>,
  ): Promise<StudioModelSurfaceRpcResultV1>;
}

/** Resolves immutable Surface manifests; client composition owns pairing. */
export class StudioSupabaseModelSurfaceResolverV1 {
  readonly #rpc: StudioModelSurfaceRpcPortV1;

  constructor(input: Readonly<{
    rpc: StudioModelSurfaceRpcPortV1;
  }>) {
    this.#rpc = input.rpc;
  }

  resolveExactSurfaceManifest(
    surfaceReleaseId: string,
    modelFamilyId: string,
  ): Promise<StudioResolvedModelSurfaceManifestV1> {
    return this.#readManifestOne(
      "get_model_surface_release_v1",
      Object.freeze({ p_surface_release_id: surfaceReleaseId }),
      modelFamilyId,
      surfaceReleaseId,
    );
  }

  resolveLatestSeriesManifest(
    surfaceSeriesId: string,
    modelFamilyId: string,
    modelId: string,
  ): Promise<StudioResolvedModelSurfaceManifestV1> {
    return this.#readManifestOne(
      "get_model_surface_series_latest_v1",
      Object.freeze({
        p_surface_series_id: surfaceSeriesId,
        p_model_id: modelId,
      }),
      modelFamilyId,
    );
  }

  async #readManifestOne(
    functionName:
      | "get_model_surface_release_v1"
      | "get_model_surface_series_latest_v1",
    parameters: Readonly<Record<string, string>>,
    modelFamilyId: string,
    expectedSurfaceReleaseId?: string,
  ): Promise<StudioResolvedModelSurfaceManifestV1> {
    const result = await this.#rpc.call(functionName, parameters);
    if (result.error !== null) {
      throw new Error(
        `Model Surface registry lookup failed: ${result.error.message}`,
      );
    }
    if (!Array.isArray(result.data) || result.data.length !== 1) {
      throw new Error("Model Surface release is unavailable");
    }
    const rowValue = result.data[0];
    if (
      rowValue === null
      || typeof rowValue !== "object"
      || Array.isArray(rowValue)
    ) {
      throw new Error("Model Surface registry returned an invalid row");
    }
    const row = rowValue as Record<string, unknown>;
    assertModelSurfaceReleaseManifestV1(row.manifest);
    if (row.manifest.modelFamilyId !== modelFamilyId) {
      throw new Error("Model Surface registry returned another model family");
    }
    if (
      expectedSurfaceReleaseId !== undefined
      && row.manifest.surfaceReleaseId !== expectedSurfaceReleaseId
    ) {
      throw new Error("Model Surface registry returned another release");
    }
    assertStudioReleaseStageV1(row.stage, "$.surfaceRelease.stage");
    return Object.freeze({
      manifest: ownSurfaceManifestV1(row.manifest),
      stage: row.stage,
    });
  }

}

let sharedResolverV1:
  | StudioSupabaseModelSurfaceResolverV1
  | null
  | undefined;

export function studioSupabaseModelSurfaceResolverV1():
StudioSupabaseModelSurfaceResolverV1 | null {
  if (sharedResolverV1 !== undefined) return sharedResolverV1;
  const configuration = readStudioSupabaseConfigurationV1();
  const client = studioSupabaseClientV1();
  sharedResolverV1 = configuration === null || client === null
    ? null
    : new StudioSupabaseModelSurfaceResolverV1({
        rpc: supabaseRpcPortV1(client),
      });
  return sharedResolverV1;
}

function supabaseRpcPortV1(client: SupabaseClient): StudioModelSurfaceRpcPortV1 {
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

function ownSurfaceManifestV1(
  value: ModelSurfaceReleaseManifestV1,
): ModelSurfaceReleaseManifestV1 {
  return deepFreezeSurfaceV1(
    structuredClone(value) as ModelSurfaceReleaseManifestV1,
  );
}

function deepFreezeSurfaceV1<TValue>(value: TValue): TValue {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeSurfaceV1(child);
    }
    Object.freeze(value);
  }
  return value;
}
