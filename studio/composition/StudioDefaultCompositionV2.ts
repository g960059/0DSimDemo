import type {
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import type { StudioReleaseStageV1 } from "@/studio/contracts/v2/modelSurface";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";
import type {
  StudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
  validateStudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import type {
  StudioSimulationAnalysisExecutionPlanResolverV2,
} from "@/studio/contracts/v2/simulation";
import {
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  invalidateStudioSupabaseModelReleaseResolverCacheV1,
  studioSupabaseModelReleaseResolverV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import type {
  StudioModelSurfacePinV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import {
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import standardClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import standardSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-v1.json";
import standardRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json";

export const DEFAULT_STUDIO_MODEL_ID_V2:
typeof MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 =
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1;

export type StudioClientCompositionV2 = Readonly<{
  defaultModelId: string;
  releaseStage: StudioReleaseStageV1;
  defaultFixture: StudioJsonValueV2;
  contract: ModelContractV2;
  analysisExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
  workerReleaseTicket: StudioModelWorkerReleaseTicketV2;
  surfaceReleaseId: string;
  surfaceSeriesId: string;
  surfaceStage: StudioReleaseStageV1;
  activeBundleVersion?: number;
}>;

export type StudioDefaultClientCompositionV2 = StudioClientCompositionV2;

export const DEFAULT_STUDIO_ANALYSIS_EXECUTION_PLAN_V2 =
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3;

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
  return Object.freeze({
    defaultModelId: release.contract.modelId,
    releaseStage: release.stage,
    defaultFixture: release.defaultFixture,
    contract: release.contract,
    analysisExecutionPlan: analysisExecutionPlanForProfileV2(
      release.analysisProfileId,
    ),
    workerReleaseTicket: release.ticket,
    surfaceReleaseId: release.surfaceReleaseId,
    surfaceSeriesId: release.surfaceSeriesId,
    surfaceStage: release.surfaceStage,
    ...(release.activeBundleVersion === undefined
      ? {}
      : { activeBundleVersion: release.activeBundleVersion }),
  });
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
    const composed = composeStandardModelContractV1(
      standardClientDescriptorV1.manifest,
      standardSurfaceReleaseV1,
    );
    const artifactUrl = localStandardArtifactUrlV1();
    const workerReleaseTicket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: composed.contract.modelId,
      artifactRevisionId:
        standardRegistryAdmissionLockV1.artifactRevisionId,
      manifest: standardClientDescriptorV1.manifest,
      surfaceRelease: standardSurfaceReleaseV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl,
    });
    return Object.freeze({
      defaultModelId: composed.contract.modelId,
      releaseStage: "dev" as const,
      defaultFixture: standardClientDescriptorV1.defaultFixture,
      contract: composed.contract,
      analysisExecutionPlan:
        resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
      workerReleaseTicket,
      surfaceReleaseId: composed.surface.surfaceReleaseId,
      surfaceSeriesId: standardSurfaceReleaseV1.surfaceSeriesId,
      surfaceStage: "dev" as const,
    });
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
    : resolved.href;
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
      composition.contract.modelId !== modelId
      || composition.surfaceSeriesId !== surfaceSeriesId
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
      composition.contract.modelId !== modelId
      || composition.surfaceSeriesId !== surfaceSeriesId
      || composition.surfaceReleaseId !== surfaceReleaseId
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

function analysisExecutionPlanForProfileV2(
  profileId: string,
): StudioSimulationAnalysisExecutionPlanResolverV2 {
  if (profileId === "standard-no-model-analysis-v1") {
    return () => null;
  }
  if (profileId === "main-wire-integrated-standard-v1") {
    return resolveMainWireIntegratedStudioAnalysisExecutionPlanV3;
  }
  throw new Error(`Unsupported Studio analysis profile ${profileId}`);
}
