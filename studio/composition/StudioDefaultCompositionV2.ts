import type {
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
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
  deriveModelContractFromManifestV2,
} from "@/studio/contracts/v2/model";
import {
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  TrustedRegisteredModelClientCatalogV2,
} from "@/studio/infrastructure/model/TrustedRegisteredModelClientCatalogV2";
import {
  invalidateStudioSupabaseModelReleaseResolverCacheV1,
  studioSupabaseModelReleaseResolverV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import type {
  StudioModelSurfacePinV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import {
  createMainWireIntegratedStudioExecutableReleaseV3 as
    createAdmittedMainWireIntegratedStudioExecutableReleaseV3,
  createMainWireIntegratedStudioModelPackageV3 as
    createAdmittedMainWireIntegratedStudioModelPackageV3,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3 as
    ADMITTED_MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
} from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs";
import type {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
  MainWireIntegratedStudioExecutableReleaseV3,
  MainWireIntegratedStudioFixtureV3,
  MainWireIntegratedStudioModelPackageV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3";
import {
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";
import standardClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import standardSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-v1.json";

export const DEFAULT_STUDIO_MODEL_ID_V2:
typeof MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3 =
  ADMITTED_MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3;

export type StudioClientCompositionV2 = Readonly<{
  defaultModelId: string;
  releaseStage: StudioReleaseStageV1;
  defaultFixture: StudioJsonValueV2;
  contract: ModelContractV2;
  analysisExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
  workerReleaseTicket?: StudioModelWorkerReleaseTicketV2;
  surfaceReleaseId?: string;
  surfaceSeriesId?: string;
  surfaceStage?: StudioReleaseStageV1;
  activeBundleVersion?: number;
}>;

export type StudioDefaultClientCompositionV2 = StudioClientCompositionV2;

export const DEFAULT_STUDIO_ANALYSIS_EXECUTION_PLAN_V2 =
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3;

export type StudioDefaultWorkerCompositionV2 = Readonly<{
  defaultModelId: typeof DEFAULT_STUDIO_MODEL_ID_V2;
  defaultFixture: MainWireIntegratedStudioFixtureV3;
  runtime: ResolvedExactModelRuntimeV2;
}>;

let browserCompositionPromiseV2:
  Promise<StudioDefaultClientCompositionV2> | undefined;
const browserExactCompositionPromisesV2 = new Map<
  string,
  Promise<StudioClientCompositionV2>
>();
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
  browserExactCompositionPromisesV2.clear();
  browserExperimentCompositionPromisesV2.clear();
  browserSnapshotCompositionPromisesV2.clear();
}

/**
 * Loads the one registry-admitted development release into the hash-free
 * client catalog. Startup intentionally creates no Preset, Experiment,
 * Snapshot, Placement, or Lesson content.
 *
 * Authoring remains outside this main-thread composition. The persistent
 * Worker loads the exact runtime below and owns both live simulation and the
 * accepted-boundary Experiment/Snapshot bridge against that single runtime host.
 */
export async function createStudioDefaultClientCompositionV2():
Promise<StudioDefaultClientCompositionV2> {
  // The main thread needs only the registry's public package projection. It
  // must not instantiate the numerical executable bundle owned by the Worker.
  const admittedPackage =
    createAdmittedMainWireIntegratedStudioModelPackageV3() as
      MainWireIntegratedStudioModelPackageV3;
  const contract = deriveModelContractFromManifestV2(
    admittedPackage.manifest,
  );
  if (contract.modelId !== DEFAULT_STUDIO_MODEL_ID_V2) {
    throw new Error("Studio default model registration returned another model");
  }
  return Object.freeze({
    defaultModelId: DEFAULT_STUDIO_MODEL_ID_V2,
    releaseStage: "stable",
    defaultFixture: admittedPackage.defaultFixture,
    contract,
    analysisExecutionPlan: DEFAULT_STUDIO_ANALYSIS_EXECUTION_PLAN_V2,
  });
}

async function createRegistryClientCompositionV2(
  modelId?: string,
  surfacePin?: StudioModelSurfacePinV1,
): Promise<StudioClientCompositionV2> {
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
      // The unconfigured browser repository is intentionally local-only, but
      // a Model Lab Save must still reopen through the ordinary Experiment
      // route. Reuse the exact committed local Standard bundle rather than
      // silently substituting the legacy bundled default.
      return loadStudioLocalStandardModelLabClientCompositionV1();
    }
    if (modelId === DEFAULT_STUDIO_MODEL_ID_V2 && surfacePin === undefined) {
      return createStudioDefaultClientCompositionV2();
    }
    throw new Error(
      "Unconfigured local registry cannot resolve the requested exact model and Surface pin",
    );
  }
  const release = modelId === undefined
    ? await resolver.resolveActiveBundle()
    : await resolver.resolveExactModel(modelId, surfacePin);
  return Object.freeze({
    defaultModelId: release.contract.modelId,
    releaseStage: release.stage,
    defaultFixture: release.defaultFixture,
    contract: release.contract,
    analysisExecutionPlan: analysisExecutionPlanForProfileV2(
      release.analysisProfileId,
    ),
    workerReleaseTicket: release.ticket,
    ...(release.surfaceReleaseId === undefined
      ? {}
      : { surfaceReleaseId: release.surfaceReleaseId }),
    ...(release.surfaceSeriesId === undefined
      ? {}
      : { surfaceSeriesId: release.surfaceSeriesId }),
    ...(release.surfaceStage === undefined
      ? {}
      : { surfaceStage: release.surfaceStage }),
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

/** Worker-only exact runtime; its model host must never be mistaken for the
 * main-thread authoring owner. */
export async function createStudioDefaultWorkerCompositionV2():
Promise<StudioDefaultWorkerCompositionV2> {
  const resolved = await resolveDefaultWorkerReleaseV2();
  return Object.freeze({
    defaultModelId: DEFAULT_STUDIO_MODEL_ID_V2,
    defaultFixture: resolved.defaultFixture,
    runtime: resolved.registry.resolveExactRuntime(DEFAULT_STUDIO_MODEL_ID_V2),
  });
}

async function resolveDefaultWorkerReleaseV2() {
  // The Worker trusts the registry-admitted distribution and imports its
  // committed artifact as ordinary ESM. Exact-byte evaluation belongs to
  // registry admission/CI, not to every client startup. The generated JS
  // loses TypeScript's non-empty fixture-path tuple annotation, so this cast
  // restores the source release type before the registry revalidates it.
  const admittedRelease =
    createAdmittedMainWireIntegratedStudioExecutableReleaseV3() as unknown as
      MainWireIntegratedStudioExecutableReleaseV3;
  const registry = new TrustedRegisteredModelClientCatalogV2([
    {
      manifest: admittedRelease.manifest,
      executables: admittedRelease.executables,
    },
  ]);
  const contract = registry.resolveContract(DEFAULT_STUDIO_MODEL_ID_V2);
  if (contract.modelId !== DEFAULT_STUDIO_MODEL_ID_V2) {
    throw new Error("Studio default model registration returned another model");
  }
  const fixtureValidation = registry.resolveExactRuntime(DEFAULT_STUDIO_MODEL_ID_V2)
    .fixtureAdapter.validateCompleteFixture({
      context: {
        scenarioId: "scenario/default-composition",
        modelId: DEFAULT_STUDIO_MODEL_ID_V2,
      },
      fixture: admittedRelease.defaultFixture,
    });
  if (fixtureValidation !== undefined) {
    throw new Error("Studio default fixture validator must be synchronous");
  }
  return Object.freeze({
    defaultFixture: admittedRelease.defaultFixture,
    registry,
  });
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

/** Existing content pins its exact modelId and never follows the active bundle. */
export function loadStudioModelClientCompositionV2(
  modelId: string,
): Promise<StudioClientCompositionV2> {
  if (modelId === DEFAULT_STUDIO_MODEL_ID_V2) {
    const resolver = studioSupabaseModelReleaseResolverV1();
    if (resolver === null) return createStudioDefaultClientCompositionV2();
  }
  const cached = browserExactCompositionPromisesV2.get(modelId);
  if (cached !== undefined) return cached;
  const pending = createRegistryClientCompositionV2(modelId).then(
    (composition) => {
      if (composition.contract.modelId !== modelId) {
        throw new Error("Exact model registry returned another modelId");
      }
      return composition;
    },
  );
  browserExactCompositionPromisesV2.set(modelId, pending);
  void pending.catch(() => {
    if (browserExactCompositionPromisesV2.get(modelId) === pending) {
      browserExactCompositionPromisesV2.delete(modelId);
    }
  });
  return pending;
}

/** Mutable content follows additive releases in its pinned Surface series. */
export function loadStudioExperimentClientCompositionV2(
  modelId: string,
  surfaceSeriesId?: string,
): Promise<StudioClientCompositionV2> {
  if (surfaceSeriesId === undefined) {
    return loadStudioModelClientCompositionV2(modelId);
  }
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
  surfaceSeriesId?: string,
  surfaceReleaseId?: string,
): Promise<StudioClientCompositionV2> {
  if (surfaceSeriesId === undefined && surfaceReleaseId === undefined) {
    return loadStudioModelClientCompositionV2(modelId);
  }
  if (surfaceSeriesId === undefined || surfaceReleaseId === undefined) {
    return Promise.reject(new Error("Snapshot Surface pin is incomplete"));
  }
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
  if (profileId === "main-wire-integrated-v3") {
    return resolveMainWireIntegratedStudioAnalysisExecutionPlanV3;
  }
  if (profileId === "main-wire-integrated-standard-v1") {
    return resolveMainWireIntegratedStudioAnalysisExecutionPlanV3;
  }
  throw new Error(`Unsupported Studio analysis profile ${profileId}`);
}
