import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
  validateStudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  invalidateStudioSupabaseModelReleaseResolverCacheV1,
  studioSupabaseModelReleaseResolverV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import type {
  StudioModelSurfacePinV1,
  StudioResolvedModelReleaseV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import {
  composeModelSurfacePresentationBundleV1,
  type ModelSurfacePresentationBundleV1,
} from "@/studio/application/modelSurface/ModelSurfacePresentationBundleV1";
import {
  resolveRegisteredAnalysisMethodsV1,
  type RegisteredAnalysisMethodsV1,
} from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import standardClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import standardSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-analysis-v1.json";
import standardRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json";

export const DEFAULT_STUDIO_MODEL_ID_V2:
typeof MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 =
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1;

export type StudioClientCompositionV2 = Readonly<{
  exactModel: Readonly<{
    modelId: string;
    stage: "dev" | "stable" | "retired";
    defaultFixture: StudioJsonValueV2;
    workerReleaseTicket: StudioModelWorkerReleaseTicketV2;
  }>;
  modelSurface: ModelSurfacePresentationBundleV1<RegisteredAnalysisMethodsV1>;
  activeBundleVersion?: number;
}>;

export type StudioDefaultClientCompositionV2 = StudioClientCompositionV2;

let browserCompositionPromiseV2:
  Promise<StudioDefaultClientCompositionV2> | undefined;
const browserExperimentCompositionPromisesV2 = new Map<
  string,
  Promise<StudioClientCompositionV2>
>();
const browserSnapshotCompositionPromisesV2 = new Map<
  string,
  Promise<StudioClientCompositionV2>
>();
let browserLocalStandardModelLabCompositionPromiseV1:
  Promise<StudioClientCompositionV2> | undefined;

/**
 * Development inventory refreshes must observe active-bundle and lifecycle
 * moves made after the SPA first resolved them. Ordinary Sessions keep their
 * pinned composition; clearing these Promises cannot mutate a running Worker.
 */
export function invalidateStudioClientCompositionCachesV2(): void {
  invalidateStudioSupabaseModelReleaseResolverCacheV1();
  browserCompositionPromiseV2 = undefined;
  browserExperimentCompositionPromisesV2.clear();
  browserSnapshotCompositionPromisesV2.clear();
}

async function createRegistryClientCompositionV2(
  modelId?: string,
  surfacePin?: StudioModelSurfacePinV1,
): Promise<StudioClientCompositionV2> {
  if (modelId !== undefined && surfacePin === undefined) {
    throw new Error("Exact model resolution requires a Surface pin");
  }
  const resolver = studioSupabaseModelReleaseResolverV1();
  if (resolver === null) {
    if (modelId === undefined) {
      return loadStudioLocalStandardClientCompositionV1();
    }
    if (
      modelId === standardClientDescriptorV1.manifest.modelId
      && surfacePin !== undefined
      && surfacePin.surfaceSeriesId === standardSurfaceReleaseV1.surfaceSeriesId
      && (
        surfacePin.kind !== "release"
        || surfacePin.surfaceReleaseId === standardSurfaceReleaseV1.surfaceReleaseId
      )
    ) {
      // The unconfigured browser repository is intentionally local-only.
      // Reuse the one committed Standard bundle without inventing another
      // exact identity.
      return loadStudioLocalStandardModelLabClientCompositionV1();
    }
    throw new Error(
      "Unconfigured local registry cannot resolve the requested exact model and Surface pin",
    );
  }
  const release = modelId === undefined
    ? await resolver.resolveActiveBundle()
    : await resolver.resolveExactModel(modelId, surfacePin!);
  return composeStudioClientCompositionV2(release);
}

/**
 * Explicit local Standard-ABI composition for the one development Model Lab.
 * The browser receives only the admitted manifest/fixture projection; the
 * persistent Worker imports and owns the numerical artifact.
 */
export function loadStudioLocalStandardClientCompositionV1():
Promise<StudioClientCompositionV2> {
  if (browserLocalStandardModelLabCompositionPromiseV1 !== undefined) {
    return browserLocalStandardModelLabCompositionPromiseV1;
  }
  const pending = Promise.resolve().then(() => {
    if (
      standardClientDescriptorV1.schemaId
      !== "circleheart-standard-exact-model-client-descriptor-v1"
    ) {
      throw new Error("Standard Model Lab client descriptor identity mismatch");
    }
    assertExactModelKernelManifestV3(standardClientDescriptorV1.manifest);
    assertModelSurfaceReleaseManifestV1(standardSurfaceReleaseV1);
    const artifactUrl = localStandardArtifactUrlV1();
    const workerReleaseTicket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: standardClientDescriptorV1.manifest.modelId,
      artifactRevisionId:
        standardRegistryAdmissionLockV1.artifactRevisionId,
      manifest: standardClientDescriptorV1.manifest,
      surfaceRelease: standardSurfaceReleaseV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl,
    });
    return composeStudioClientCompositionV2(Object.freeze({
      defaultFixture: standardClientDescriptorV1.defaultFixture,
      stage: "dev" as const,
      ticket: workerReleaseTicket,
      surfaceStage: "dev" as const,
    }));
  });
  browserLocalStandardModelLabCompositionPromiseV1 = pending;
  void pending.catch(() => {
    if (browserLocalStandardModelLabCompositionPromiseV1 === pending) {
      browserLocalStandardModelLabCompositionPromiseV1 = undefined;
    }
  });
  return pending;
}

/** Model Lab and the unconfigured local Workbench share one exact bundle. */
export const loadStudioLocalStandardModelLabClientCompositionV1 =
  loadStudioLocalStandardClientCompositionV1;

function localStandardArtifactUrlV1(): string {
  const loopbackBase = "http://127.0.0.1/";
  const resolved = new URL(
    "../integrations/mainWireIntegratedV3/"
      + "MainWireIntegratedStudioExactModelV1.artifact.mjs",
    import.meta.url,
  );
  // Vitest resolves import.meta.url against the filesystem. A file: URL
  // must never cross the Worker ticket boundary; the tests do not fetch it,
  // and production/dev browser builds always resolve the emitted asset from
  // their HTTPS or loopback HTTP origin.
  return resolved.protocol === "file:"
    ? new URL("__circleheart_local_standard_artifact__.mjs", loopbackBase).href
    : localStandardArtifactRevisionUrlV1(resolved).href;
}

export function localStandardArtifactRevisionUrlV1(resolved: URL): URL {
  const revisioned = new URL(resolved);
  revisioned.searchParams.set(
    "revision",
    standardRegistryAdmissionLockV1.artifactRevisionId,
  );
  return revisioned;
}

/** One active-bundle composition shared across StrictMode remounts. */
export function loadStudioDefaultClientCompositionV2():
Promise<StudioDefaultClientCompositionV2> {
  if (browserCompositionPromiseV2 !== undefined) {
    return browserCompositionPromiseV2;
  }
  const pending = createRegistryClientCompositionV2();
  browserCompositionPromiseV2 = pending;
  void pending.catch(() => {
    // A transient fetch/evaluation failure must not poison the browser
    // composition for the rest of the page lifetime. Only clear the Promise
    // that actually failed so a later successful load cannot be displaced.
    if (browserCompositionPromiseV2 === pending) {
      browserCompositionPromiseV2 = undefined;
    }
  });
  return pending;
}

/** Mutable content follows additive releases in its pinned Surface series. */
export function loadStudioExperimentClientCompositionV2(
  modelId: string,
  surfaceSeriesId: string,
): Promise<StudioClientCompositionV2> {
  const key = `${modelId}\u0000${surfaceSeriesId}`;
  const cached = browserExperimentCompositionPromisesV2.get(key);
  if (cached !== undefined) return cached;
  const pending = createRegistryClientCompositionV2(modelId, {
    kind: "series",
    surfaceSeriesId,
  }).then((composition) => {
    if (
      composition.exactModel.modelId !== modelId
      || composition.modelSurface.identity.surfaceSeriesId !== surfaceSeriesId
    ) {
      throw new Error("Experiment Surface series resolution changed identity");
    }
    return composition;
  });
  browserExperimentCompositionPromisesV2.set(key, pending);
  void pending.catch(() => {
    if (browserExperimentCompositionPromisesV2.get(key) === pending) {
      browserExperimentCompositionPromisesV2.delete(key);
    }
  });
  return pending;
}

/** Immutable content always reloads the exact Surface sealed by its Snapshot. */
export function loadStudioSnapshotClientCompositionV2(
  modelId: string,
  surfaceSeriesId: string,
  surfaceReleaseId: string,
): Promise<StudioClientCompositionV2> {
  const key = `${modelId}\u0000${surfaceReleaseId}`;
  const cached = browserSnapshotCompositionPromisesV2.get(key);
  if (cached !== undefined) return cached;
  const pending = createRegistryClientCompositionV2(modelId, {
    kind: "release",
    surfaceSeriesId,
    surfaceReleaseId,
  }).then((composition) => {
    if (
      composition.exactModel.modelId !== modelId
      || composition.modelSurface.identity.surfaceSeriesId !== surfaceSeriesId
      || composition.modelSurface.identity.surfaceReleaseId !== surfaceReleaseId
    ) {
      throw new Error("Snapshot exact Surface resolution changed identity");
    }
    return composition;
  });
  browserSnapshotCompositionPromisesV2.set(key, pending);
  void pending.catch(() => {
    if (browserSnapshotCompositionPromisesV2.get(key) === pending) {
      browserSnapshotCompositionPromisesV2.delete(key);
    }
  });
  return pending;
}

function composeStudioClientCompositionV2(
  release: StudioResolvedModelReleaseV1,
): StudioClientCompositionV2 {
  const analysis = resolveRegisteredAnalysisMethodsV1(
    release.ticket.surfaceRelease,
    [
      ...release.ticket.manifest.primitiveSignalCatalog,
      ...release.ticket.manifest.modelMetricCatalog,
    ],
  );
  const modelSurface = composeModelSurfacePresentationBundleV1({
    kernel: release.ticket.manifest,
    surfaceRelease: release.ticket.surfaceRelease,
    stage: release.surfaceStage,
    analysis,
  });
  if (modelSurface.contract.modelId !== release.ticket.modelId) {
    throw new Error("Client exact model and Model Surface identities differ");
  }
  return Object.freeze({
    exactModel: Object.freeze({
      modelId: release.ticket.modelId,
      stage: release.stage,
      defaultFixture: release.defaultFixture,
      workerReleaseTicket: release.ticket,
    }),
    modelSurface,
    ...(release.activeBundleVersion === undefined
      ? {}
      : { activeBundleVersion: release.activeBundleVersion }),
  });
}
