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
import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";
import { resolveRegisteredExactModelFixtureProjectionV1 } from
  "@/studio/registry/RegisteredExactModelFixtureProjectionV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from
  "@/domain/model/MainWireStandardIdentityV1";
import standardClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import standardSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-analysis-v1.json";
import standardRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json";
import selectedAorticOutflowClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.client.json";
import selectedAorticOutflowRetainedSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v1.json";
import selectedAorticOutflowSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v2.json";
import selectedAorticOutflowRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/selected-aortic-outflow-standard66-registry-admission-lock.json";
import algebraicProximalRootsClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicProximalRootsExactModelV1.client.json";
import algebraicProximalRootsSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-algebraic-proximal-roots-standard67-v1.json";
import algebraicProximalRootsRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-proximal-roots-standard67-registry-admission-lock.json";
import roundedEjectionClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionExactModelV1.client.json";
import roundedEjectionSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionSurfaceV1";
import roundedEjectionRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-registry-admission-lock.json";
import qualifiedBaselineClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualifiedBaselineExactModelV1.client.json";
import qualifiedBaselineSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualifiedBaselineSurfaceV1";
import qualifiedBaselineRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-registry-admission-lock.json";
import algebraicPulmonaryRootClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json";
import algebraicPulmonaryRootSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import algebraicPulmonaryRootRegistryAdmissionLockV1 from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-registry-admission-lock.json";

export const DEFAULT_STUDIO_MODEL_ID_V2:
typeof MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1 =
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1;

export type StudioClientCompositionV2 = Readonly<{
  exactModel: Readonly<{
    modelId: string;
    stage: "dev" | "stable" | "retired";
    defaultFixture: StudioJsonValueV2;
    fixtureProjection: ExactModelFixtureProjectionV1;
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
const browserLocalSelectedAorticOutflowCompositionPromisesV1 = new Map<
  string,
  Promise<StudioClientCompositionV2>
>();
let browserLocalAlgebraicProximalRootsCompositionPromiseV1:
  Promise<StudioClientCompositionV2> | undefined;
let browserLocalRoundedEjectionCompositionPromiseV1:
  Promise<StudioClientCompositionV2> | undefined;
let browserLocalQualifiedBaselineCompositionPromiseV1:
  Promise<StudioClientCompositionV2> | undefined;
let browserLocalAlgebraicPulmonaryRootCompositionPromiseV1:
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
      return loadStudioLocalAlgebraicPulmonaryRootClientCompositionV1();
    }
    if (
      modelId === standardClientDescriptorV1.manifest.modelId
      && surfacePin !== undefined
      && localSurfacePinMatchesV1(standardSurfaceReleaseV1, surfacePin)
    ) {
      // The unconfigured browser repository is intentionally local-only.
      // Keep the historical Standard65 bundle reachable only through its
      // explicit Model Lab or a saved-content identity pair.
      return loadStudioLocalStandardModelLabClientCompositionV1();
    }
    if (
      modelId === selectedAorticOutflowClientDescriptorV1.manifest.modelId
      && surfacePin !== undefined
      && localSurfacePinMatchesV1(
        selectedAorticOutflowSurfaceReleaseV1,
        surfacePin,
      )
    ) {
      return loadStudioLocalSelectedAorticOutflowClientCompositionV1();
    }
    if (
      modelId === selectedAorticOutflowClientDescriptorV1.manifest.modelId
      && surfacePin !== undefined
      && localSurfacePinMatchesV1(
        selectedAorticOutflowRetainedSurfaceReleaseV1,
        surfacePin,
      )
    ) {
      return loadStudioLocalSelectedAorticOutflowClientCompositionForSurfaceV1(
        selectedAorticOutflowRetainedSurfaceReleaseV1,
      );
    }
    if (
      modelId === algebraicProximalRootsClientDescriptorV1.manifest.modelId
      && surfacePin !== undefined
      && localSurfacePinMatchesV1(
        algebraicProximalRootsSurfaceReleaseV1,
        surfacePin,
      )
    ) {
      return loadStudioLocalAlgebraicProximalRootsClientCompositionV1();
    }
    if (
      modelId === roundedEjectionClientDescriptorV1.manifest.modelId
      && surfacePin !== undefined
      && localSurfacePinMatchesV1(
        roundedEjectionSurfaceReleaseV1,
        surfacePin,
      )
    ) {
      return loadStudioLocalRoundedEjectionClientCompositionV1();
    }
    if (
      modelId === qualifiedBaselineClientDescriptorV1.manifest.modelId
      && surfacePin !== undefined
      && localSurfacePinMatchesV1(
        qualifiedBaselineSurfaceReleaseV1,
        surfacePin,
      )
    ) {
      return loadStudioLocalQualifiedBaselineClientCompositionV1();
    }
    if (
      modelId === algebraicPulmonaryRootClientDescriptorV1.manifest.modelId
      && surfacePin !== undefined
      && localSurfacePinMatchesV1(
        algebraicPulmonaryRootSurfaceReleaseV1,
        surfacePin,
      )
    ) {
      return loadStudioLocalAlgebraicPulmonaryRootClientCompositionV1();
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

/** Preserve the historical Standard65 Model Lab entry point. */
export const loadStudioLocalStandardModelLabClientCompositionV1 =
  loadStudioLocalStandardClientCompositionV1;

/** Local default Workbench composition for the selected Standard66 release. */
export function loadStudioLocalSelectedAorticOutflowClientCompositionV1():
Promise<StudioClientCompositionV2> {
  return loadStudioLocalSelectedAorticOutflowClientCompositionForSurfaceV1(
    selectedAorticOutflowSurfaceReleaseV1,
  );
}

function loadStudioLocalSelectedAorticOutflowClientCompositionForSurfaceV1(
  surfaceRelease: unknown,
): Promise<StudioClientCompositionV2> {
  assertModelSurfaceReleaseManifestV1(surfaceRelease);
  const key = surfaceRelease.surfaceReleaseId;
  const cached = browserLocalSelectedAorticOutflowCompositionPromisesV1.get(
    key,
  );
  if (cached !== undefined) return cached;
  const pending = Promise.resolve().then(() => {
    if (
      selectedAorticOutflowClientDescriptorV1.schemaId
      !== "circleheart-standard-exact-model-client-descriptor-v1"
    ) {
      throw new Error(
        "Selected Standard66 client descriptor identity mismatch",
      );
    }
    assertExactModelKernelManifestV3(
      selectedAorticOutflowClientDescriptorV1.manifest,
    );
    const workerReleaseTicket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: selectedAorticOutflowClientDescriptorV1.manifest.modelId,
      artifactRevisionId:
        selectedAorticOutflowRegistryAdmissionLockV1.artifactRevisionId,
      manifest: selectedAorticOutflowClientDescriptorV1.manifest,
      surfaceRelease,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: localSelectedAorticOutflowArtifactUrlV1(),
    });
    return composeStudioClientCompositionV2(Object.freeze({
      defaultFixture: selectedAorticOutflowClientDescriptorV1.defaultFixture,
      stage: "dev" as const,
      ticket: workerReleaseTicket,
      surfaceStage: "dev" as const,
    }));
  });
  browserLocalSelectedAorticOutflowCompositionPromisesV1.set(key, pending);
  void pending.catch(() => {
    if (
      browserLocalSelectedAorticOutflowCompositionPromisesV1.get(key)
        === pending
    ) {
      browserLocalSelectedAorticOutflowCompositionPromisesV1.delete(key);
    }
  });
  return pending;
}

/** Local default Workbench composition for the Standard67 successor. */
export function loadStudioLocalAlgebraicProximalRootsClientCompositionV1():
Promise<StudioClientCompositionV2> {
  if (browserLocalAlgebraicProximalRootsCompositionPromiseV1 !== undefined) {
    return browserLocalAlgebraicProximalRootsCompositionPromiseV1;
  }
  const pending = Promise.resolve().then(() => {
    if (
      algebraicProximalRootsClientDescriptorV1.schemaId
      !== "circleheart-standard-exact-model-client-descriptor-v1"
    ) {
      throw new Error("Standard67 client descriptor identity mismatch");
    }
    assertExactModelKernelManifestV3(
      algebraicProximalRootsClientDescriptorV1.manifest,
    );
    assertModelSurfaceReleaseManifestV1(
      algebraicProximalRootsSurfaceReleaseV1,
    );
    const workerReleaseTicket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: algebraicProximalRootsClientDescriptorV1.manifest.modelId,
      artifactRevisionId:
        algebraicProximalRootsRegistryAdmissionLockV1.artifactRevisionId,
      manifest: algebraicProximalRootsClientDescriptorV1.manifest,
      surfaceRelease: algebraicProximalRootsSurfaceReleaseV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: localAlgebraicProximalRootsArtifactUrlV1(),
    });
    return composeStudioClientCompositionV2(Object.freeze({
      defaultFixture: algebraicProximalRootsClientDescriptorV1.defaultFixture,
      stage: "dev" as const,
      ticket: workerReleaseTicket,
      surfaceStage: "dev" as const,
    }));
  });
  browserLocalAlgebraicProximalRootsCompositionPromiseV1 = pending;
  void pending.catch(() => {
    if (browserLocalAlgebraicProximalRootsCompositionPromiseV1 === pending) {
      browserLocalAlgebraicProximalRootsCompositionPromiseV1 = undefined;
    }
  });
  return pending;
}

/** Local default Workbench composition for the rounded-ejection Standard68. */
export function loadStudioLocalRoundedEjectionClientCompositionV1():
Promise<StudioClientCompositionV2> {
  if (browserLocalRoundedEjectionCompositionPromiseV1 !== undefined) {
    return browserLocalRoundedEjectionCompositionPromiseV1;
  }
  const pending = Promise.resolve().then(() => {
    if (
      roundedEjectionClientDescriptorV1.schemaId
      !== "circleheart-standard-exact-model-client-descriptor-v1"
    ) {
      throw new Error("Standard68 client descriptor identity mismatch");
    }
    assertExactModelKernelManifestV3(
      roundedEjectionClientDescriptorV1.manifest,
    );
    assertModelSurfaceReleaseManifestV1(roundedEjectionSurfaceReleaseV1);
    const workerReleaseTicket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: roundedEjectionClientDescriptorV1.manifest.modelId,
      artifactRevisionId:
        roundedEjectionRegistryAdmissionLockV1.artifactRevisionId,
      manifest: roundedEjectionClientDescriptorV1.manifest,
      surfaceRelease: roundedEjectionSurfaceReleaseV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: localRoundedEjectionArtifactUrlV1(),
    });
    return composeStudioClientCompositionV2(Object.freeze({
      defaultFixture: roundedEjectionClientDescriptorV1.defaultFixture,
      stage: "dev" as const,
      ticket: workerReleaseTicket,
      surfaceStage: "dev" as const,
    }));
  });
  browserLocalRoundedEjectionCompositionPromiseV1 = pending;
  void pending.catch(() => {
    if (browserLocalRoundedEjectionCompositionPromiseV1 === pending) {
      browserLocalRoundedEjectionCompositionPromiseV1 = undefined;
    }
  });
  return pending;
}

/** Local default Workbench composition for the qualified Standard69 baseline. */
export function loadStudioLocalQualifiedBaselineClientCompositionV1():
Promise<StudioClientCompositionV2> {
  if (browserLocalQualifiedBaselineCompositionPromiseV1 !== undefined) {
    return browserLocalQualifiedBaselineCompositionPromiseV1;
  }
  const pending = Promise.resolve().then(() => {
    if (
      qualifiedBaselineClientDescriptorV1.schemaId
      !== "circleheart-standard-exact-model-client-descriptor-v1"
    ) {
      throw new Error("Standard69 client descriptor identity mismatch");
    }
    assertExactModelKernelManifestV3(
      qualifiedBaselineClientDescriptorV1.manifest,
    );
    assertModelSurfaceReleaseManifestV1(qualifiedBaselineSurfaceReleaseV1);
    const workerReleaseTicket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: qualifiedBaselineClientDescriptorV1.manifest.modelId,
      artifactRevisionId:
        qualifiedBaselineRegistryAdmissionLockV1.artifactRevisionId,
      manifest: qualifiedBaselineClientDescriptorV1.manifest,
      surfaceRelease: qualifiedBaselineSurfaceReleaseV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: localQualifiedBaselineArtifactUrlV1(),
    });
    return composeStudioClientCompositionV2(Object.freeze({
      defaultFixture: qualifiedBaselineClientDescriptorV1.defaultFixture,
      stage: "dev" as const,
      ticket: workerReleaseTicket,
      surfaceStage: "dev" as const,
    }));
  });
  browserLocalQualifiedBaselineCompositionPromiseV1 = pending;
  void pending.catch(() => {
    if (browserLocalQualifiedBaselineCompositionPromiseV1 === pending) {
      browserLocalQualifiedBaselineCompositionPromiseV1 = undefined;
    }
  });
  return pending;
}

/** Local default Workbench composition for the Standard70 successor. */
export function loadStudioLocalAlgebraicPulmonaryRootClientCompositionV1():
Promise<StudioClientCompositionV2> {
  if (browserLocalAlgebraicPulmonaryRootCompositionPromiseV1 !== undefined) {
    return browserLocalAlgebraicPulmonaryRootCompositionPromiseV1;
  }
  const pending = Promise.resolve().then(() => {
    if (
      algebraicPulmonaryRootClientDescriptorV1.schemaId
      !== "circleheart-standard-exact-model-client-descriptor-v1"
    ) {
      throw new Error("Standard70 client descriptor identity mismatch");
    }
    assertExactModelKernelManifestV3(
      algebraicPulmonaryRootClientDescriptorV1.manifest,
    );
    assertModelSurfaceReleaseManifestV1(
      algebraicPulmonaryRootSurfaceReleaseV1,
    );
    const workerReleaseTicket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: algebraicPulmonaryRootClientDescriptorV1.manifest.modelId,
      artifactRevisionId:
        algebraicPulmonaryRootRegistryAdmissionLockV1.artifactRevisionId,
      manifest: algebraicPulmonaryRootClientDescriptorV1.manifest,
      surfaceRelease: algebraicPulmonaryRootSurfaceReleaseV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: localAlgebraicPulmonaryRootArtifactUrlV1(),
    });
    return composeStudioClientCompositionV2(Object.freeze({
      defaultFixture: algebraicPulmonaryRootClientDescriptorV1.defaultFixture,
      stage: "dev" as const,
      ticket: workerReleaseTicket,
      surfaceStage: "dev" as const,
    }));
  });
  browserLocalAlgebraicPulmonaryRootCompositionPromiseV1 = pending;
  void pending.catch(() => {
    if (browserLocalAlgebraicPulmonaryRootCompositionPromiseV1 === pending) {
      browserLocalAlgebraicPulmonaryRootCompositionPromiseV1 = undefined;
    }
  });
  return pending;
}

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

function localSelectedAorticOutflowArtifactUrlV1(): string {
  const loopbackBase = "http://127.0.0.1/";
  const resolved = new URL(
    "../integrations/mainWireIntegratedV3/"
      + "MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.artifact.mjs",
    import.meta.url,
  );
  return resolved.protocol === "file:"
    ? new URL(
        "__circleheart_local_selected_aortic_outflow_standard66_artifact__.mjs",
        loopbackBase,
      ).href
    : localSelectedAorticOutflowArtifactRevisionUrlV1(resolved).href;
}

export function localSelectedAorticOutflowArtifactRevisionUrlV1(
  resolved: URL,
): URL {
  const revisioned = new URL(resolved);
  revisioned.searchParams.set(
    "revision",
    selectedAorticOutflowRegistryAdmissionLockV1.artifactRevisionId,
  );
  return revisioned;
}

function localAlgebraicProximalRootsArtifactUrlV1(): string {
  const loopbackBase = "http://127.0.0.1/";
  const resolved = new URL(
    "../integrations/mainWireIntegratedV3/"
      + "MainWireIntegratedStudioAlgebraicProximalRootsExactModelV1.artifact.mjs",
    import.meta.url,
  );
  return resolved.protocol === "file:"
    ? new URL(
        "__circleheart_local_algebraic_proximal_roots_standard67_artifact__.mjs",
        loopbackBase,
      ).href
    : localAlgebraicProximalRootsArtifactRevisionUrlV1(resolved).href;
}

export function localAlgebraicProximalRootsArtifactRevisionUrlV1(
  resolved: URL,
): URL {
  const revisioned = new URL(resolved);
  revisioned.searchParams.set(
    "revision",
    algebraicProximalRootsRegistryAdmissionLockV1.artifactRevisionId,
  );
  return revisioned;
}

function localRoundedEjectionArtifactUrlV1(): string {
  const loopbackBase = "http://127.0.0.1/";
  const resolved = new URL(
    "../integrations/mainWireIntegratedV3/"
      + "MainWireIntegratedStudioRoundedEjectionExactModelV1.artifact.mjs",
    import.meta.url,
  );
  return resolved.protocol === "file:"
    ? new URL(
        "__circleheart_local_rounded_ejection_standard68_artifact__.mjs",
        loopbackBase,
      ).href
    : localRoundedEjectionArtifactRevisionUrlV1(resolved).href;
}

export function localRoundedEjectionArtifactRevisionUrlV1(
  resolved: URL,
): URL {
  const revisioned = new URL(resolved);
  revisioned.searchParams.set(
    "revision",
    roundedEjectionRegistryAdmissionLockV1.artifactRevisionId,
  );
  return revisioned;
}

function localQualifiedBaselineArtifactUrlV1(): string {
  const loopbackBase = "http://127.0.0.1/";
  const resolved = new URL(
    "../integrations/mainWireIntegratedV3/"
      + "MainWireIntegratedStudioQualifiedBaselineExactModelV1.artifact.mjs",
    import.meta.url,
  );
  return resolved.protocol === "file:"
    ? new URL(
        "__circleheart_local_qualified_baseline_standard69_artifact__.mjs",
        loopbackBase,
      ).href
    : localQualifiedBaselineArtifactRevisionUrlV1(resolved).href;
}

export function localQualifiedBaselineArtifactRevisionUrlV1(
  resolved: URL,
): URL {
  const revisioned = new URL(resolved);
  revisioned.searchParams.set(
    "revision",
    qualifiedBaselineRegistryAdmissionLockV1.artifactRevisionId,
  );
  return revisioned;
}

function localAlgebraicPulmonaryRootArtifactUrlV1(): string {
  const loopbackBase = "http://127.0.0.1/";
  const resolved = new URL(
    "../integrations/mainWireIntegratedV3/"
      + "MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.artifact.mjs",
    import.meta.url,
  );
  return resolved.protocol === "file:"
    ? new URL(
        "__circleheart_local_algebraic_pulmonary_root_standard70_artifact__.mjs",
        loopbackBase,
      ).href
    : localAlgebraicPulmonaryRootArtifactRevisionUrlV1(resolved).href;
}

export function localAlgebraicPulmonaryRootArtifactRevisionUrlV1(
  resolved: URL,
): URL {
  const revisioned = new URL(resolved);
  revisioned.searchParams.set(
    "revision",
    algebraicPulmonaryRootRegistryAdmissionLockV1.artifactRevisionId,
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
      fixtureProjection: resolveRegisteredExactModelFixtureProjectionV1(
        {
          modelId: release.ticket.modelId,
          fixtureSchemaId:
            release.ticket.manifest.fixtureSchema.fixtureSchemaId,
        },
      ),
      workerReleaseTicket: release.ticket,
    }),
    modelSurface,
    ...(release.activeBundleVersion === undefined
      ? {}
      : { activeBundleVersion: release.activeBundleVersion }),
  });
}

function localSurfacePinMatchesV1(
  surfaceRelease: Readonly<{
    surfaceSeriesId: string;
    surfaceReleaseId: string;
  }>,
  surfacePin: StudioModelSurfacePinV1,
): boolean {
  return surfacePin.surfaceSeriesId === surfaceRelease.surfaceSeriesId
    && (
      surfacePin.kind !== "release"
      || surfacePin.surfaceReleaseId === surfaceRelease.surfaceReleaseId
    );
}
