import {
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
} from "@/engine/scientific/release";
import {
  createCatalogRefV1,
  loadCatalogDocumentV1,
  loadCatalogRefV1,
  sameCatalogRefV1,
  type CatalogDocumentV1,
  type CatalogRefV1,
} from "@/engine/modelSurface/v1/CatalogRefV1";
import {
  isCapabilityStageV1,
  type CapabilityStageV1,
} from "@/engine/modelSurface/v1/CapabilityStageV1";
import {
  loadModelSurfaceModelRefV1,
  sameModelSurfaceModelRefV1,
  type ModelSurfaceModelRefV1,
} from "@/engine/modelSurface/v1/ModelSurfaceIdentityV1";
import {
  loadModelSurfaceMigrationRefV1,
  type ModelSurfaceMigrationRefV1,
} from "@/engine/modelSurface/v1/ModelSurfaceMigrationV1";
import {
  assertModelSurfaceExactKeysV1,
  modelSurfaceArrayV1,
  modelSurfaceNonEmptyStringV1,
  modelSurfacePositiveIntegerV1,
  modelSurfaceRecordV1,
  modelSurfaceSha256V1,
} from "@/engine/modelSurface/v1/validationV1";

export const MODEL_SURFACE_MANIFEST_V1_SCHEMA_ID =
  "circleheart.model-surface-manifest.v1" as const;
export const MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION = 1 as const;

export type PerformanceProfileRefV1 = Readonly<{
  profileId: string;
  schemaVersion: number;
  contentSha256: string;
}>;

export type ModelSurfaceManifestRefV1 = Readonly<{
  manifestId: string;
  schemaVersion: 1;
  contentSha256: string;
}>;

export type ModelSurfaceManifestV1 = Readonly<{
  schemaId: typeof MODEL_SURFACE_MANIFEST_V1_SCHEMA_ID;
  schemaVersion: typeof MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION;
  modelRef: ModelSurfaceModelRefV1;
  topologyManifest: CatalogRefV1;
  observableCatalog: CatalogRefV1;
  metricCatalogs: readonly CatalogRefV1[];
  controlCatalogs: readonly CatalogRefV1[];
  plotRecipeCatalog: CatalogRefV1;
  viewSetCatalog: CatalogRefV1;
  protocolCatalog: CatalogRefV1;
  evidenceCatalog: CatalogRefV1;
  capabilityStageById: Readonly<Record<string, CapabilityStageV1>>;
  performanceProfiles: readonly PerformanceProfileRefV1[];
  migrations: readonly ModelSurfaceMigrationRefV1[];
}>;

export type ResolvedModelSurfaceManifestV1 = Readonly<{
  manifestRef: ModelSurfaceManifestRefV1;
  manifest: ModelSurfaceManifestV1;
  catalogs: readonly CatalogDocumentV1[];
}>;

export type ModelSurfaceResolutionErrorCodeV1 =
  | "catalog-ref-mismatch"
  | "duplicate-catalog"
  | "duplicate-catalog-ref"
  | "manifest-ref-mismatch"
  | "model-catalog-identity-mismatch"
  | "model-identity-mismatch"
  | "unreferenced-catalog"
  | "unknown-catalog";

export class ModelSurfaceResolutionErrorV1 extends Error {
  readonly code: ModelSurfaceResolutionErrorCodeV1;

  constructor(code: ModelSurfaceResolutionErrorCodeV1, message: string) {
    super(`model surface resolution rejected: ${message}`);
    this.name = "ModelSurfaceResolutionErrorV1";
    this.code = code;
  }
}

export function loadModelSurfaceManifestRefV1(
  value: unknown,
): ModelSurfaceManifestRefV1 {
  const record = modelSurfaceRecordV1(value, "manifest ref");
  assertModelSurfaceExactKeysV1(
    record,
    ["manifestId", "schemaVersion", "contentSha256"],
    [],
    "manifest ref",
  );
  const schemaVersion = modelSurfacePositiveIntegerV1(
    record.schemaVersion,
    "manifestRef.schemaVersion",
  );
  if (schemaVersion !== MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION) {
    throw new Error(
      `model surface schema rejected: unsupported manifest ref schema ${schemaVersion}`,
    );
  }
  return Object.freeze({
    manifestId: modelSurfaceNonEmptyStringV1(
      record.manifestId,
      "manifestRef.manifestId",
    ),
    schemaVersion: MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION,
    contentSha256: modelSurfaceSha256V1(
      record.contentSha256,
      "manifestRef.contentSha256",
    ),
  });
}

export function loadModelSurfaceManifestV1(
  value: unknown,
): ModelSurfaceManifestV1 {
  const frozen = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  const record = modelSurfaceRecordV1(frozen, "manifest");
  assertModelSurfaceExactKeysV1(
    record,
    [
      "schemaId",
      "schemaVersion",
      "modelRef",
      "topologyManifest",
      "observableCatalog",
      "metricCatalogs",
      "controlCatalogs",
      "plotRecipeCatalog",
      "viewSetCatalog",
      "protocolCatalog",
      "evidenceCatalog",
      "capabilityStageById",
      "performanceProfiles",
      "migrations",
    ],
    [],
    "manifest",
  );
  if (
    record.schemaId !== MODEL_SURFACE_MANIFEST_V1_SCHEMA_ID
    || record.schemaVersion !== MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION
  ) {
    throw new Error("model surface schema rejected: unsupported manifest schema");
  }
  const capabilities = modelSurfaceRecordV1(
    record.capabilityStageById,
    "manifest.capabilityStageById",
  );
  for (const [capabilityId, stage] of Object.entries(capabilities)) {
    modelSurfaceNonEmptyStringV1(
      capabilityId,
      "manifest capability ID",
    );
    if (!isCapabilityStageV1(stage)) {
      throw new Error(
        `model surface schema rejected: capability ${capabilityId} has unknown stage ${String(stage)}`,
      );
    }
  }
  const manifest = {
    schemaId: MODEL_SURFACE_MANIFEST_V1_SCHEMA_ID,
    schemaVersion: MODEL_SURFACE_MANIFEST_V1_SCHEMA_VERSION,
    modelRef: loadModelSurfaceModelRefV1(record.modelRef),
    topologyManifest: loadCatalogRefV1(record.topologyManifest),
    observableCatalog: loadCatalogRefV1(record.observableCatalog),
    metricCatalogs: Object.freeze(
      modelSurfaceArrayV1(
        record.metricCatalogs,
        "manifest.metricCatalogs",
      ).map(loadCatalogRefV1),
    ),
    controlCatalogs: Object.freeze(
      modelSurfaceArrayV1(
        record.controlCatalogs,
        "manifest.controlCatalogs",
      ).map(loadCatalogRefV1),
    ),
    plotRecipeCatalog: loadCatalogRefV1(record.plotRecipeCatalog),
    viewSetCatalog: loadCatalogRefV1(record.viewSetCatalog),
    protocolCatalog: loadCatalogRefV1(record.protocolCatalog),
    evidenceCatalog: loadCatalogRefV1(record.evidenceCatalog),
    capabilityStageById:
      capabilities as Readonly<Record<string, CapabilityStageV1>>,
    performanceProfiles: Object.freeze(
      modelSurfaceArrayV1(
        record.performanceProfiles,
        "manifest.performanceProfiles",
      ).map(loadPerformanceProfileRefV1),
    ),
    migrations: Object.freeze(
      modelSurfaceArrayV1(
        record.migrations,
        "manifest.migrations",
      ).map(loadModelSurfaceMigrationRefV1),
    ),
  } satisfies ModelSurfaceManifestV1;
  assertUniqueCatalogRefsV1(allManifestCatalogRefsV1(manifest));
  return frozen as unknown as ModelSurfaceManifestV1;
}

export function allManifestCatalogRefsV1(
  manifest: ModelSurfaceManifestV1,
): readonly CatalogRefV1[] {
  return Object.freeze([
    manifest.topologyManifest,
    manifest.observableCatalog,
    ...manifest.metricCatalogs,
    ...manifest.controlCatalogs,
    manifest.plotRecipeCatalog,
    manifest.viewSetCatalog,
    manifest.protocolCatalog,
    manifest.evidenceCatalog,
  ]);
}

export async function resolveModelSurfaceManifestV1(input: Readonly<{
  manifestId: string;
  manifestRef: unknown;
  manifest: unknown;
  catalogs: readonly unknown[];
  expectedModelRef: ModelSurfaceModelRefV1;
}>): Promise<ResolvedModelSurfaceManifestV1> {
  const manifestId = modelSurfaceNonEmptyStringV1(
    input.manifestId,
    "manifestId",
  );
  const manifestRef = loadModelSurfaceManifestRefV1(input.manifestRef);
  if (manifestRef.manifestId !== manifestId) {
    throw new ModelSurfaceResolutionErrorV1(
      "manifest-ref-mismatch",
      `manifest ref ${manifestRef.manifestId} does not identify ${manifestId}`,
    );
  }
  const manifest = loadModelSurfaceManifestV1(input.manifest);
  const expectedModelRef = loadModelSurfaceModelRefV1(
    input.expectedModelRef,
  );
  assertSameModelRefOrThrowV1(
    expectedModelRef,
    manifest.modelRef,
    "model-identity-mismatch",
    "manifest modelRef does not match the requested exact model identity",
  );
  const actualManifestSha256 = await sha256CanonicalJsonHex(manifest);
  if (actualManifestSha256 !== manifestRef.contentSha256) {
    throw new ModelSurfaceResolutionErrorV1(
      "manifest-ref-mismatch",
      "manifest content SHA-256 does not match its ref",
    );
  }

  const catalogs = input.catalogs.map(loadCatalogDocumentV1);
  const catalogsById = new Map<string, CatalogDocumentV1>();
  for (const catalog of catalogs) {
    if (catalogsById.has(catalog.catalogId)) {
      throw new ModelSurfaceResolutionErrorV1(
        "duplicate-catalog",
        `catalog ${catalog.catalogId} is supplied more than once`,
      );
    }
    catalogsById.set(catalog.catalogId, catalog);
  }

  const refs = allManifestCatalogRefsV1(manifest);
  for (const ref of refs) {
    const catalog = catalogsById.get(ref.catalogId);
    if (catalog === undefined) {
      throw new ModelSurfaceResolutionErrorV1(
        "unknown-catalog",
        `manifest references unknown catalog ${ref.catalogId}`,
      );
    }
    assertSameModelRefOrThrowV1(
      manifest.modelRef,
      catalog.modelRef,
      "model-catalog-identity-mismatch",
      `catalog ${catalog.catalogId} belongs to a different exact model identity`,
    );
    const actualRef = await createCatalogRefV1(catalog);
    if (!sameCatalogRefV1(ref, actualRef)) {
      throw new ModelSurfaceResolutionErrorV1(
        "catalog-ref-mismatch",
        `catalog ${ref.catalogId} does not match schema version and content SHA-256`,
      );
    }
  }
  const referencedIds = new Set(refs.map(({ catalogId }) => catalogId));
  const unreferenced = catalogs.find(
    ({ catalogId }) => !referencedIds.has(catalogId),
  );
  if (unreferenced !== undefined) {
    throw new ModelSurfaceResolutionErrorV1(
      "unreferenced-catalog",
      `catalog ${unreferenced.catalogId} is not referenced by the manifest`,
    );
  }
  return Object.freeze({
    manifestRef,
    manifest,
    catalogs: Object.freeze(catalogs),
  });
}

function assertSameModelRefOrThrowV1(
  expected: ModelSurfaceModelRefV1,
  actual: ModelSurfaceModelRefV1,
  code:
    | "model-catalog-identity-mismatch"
    | "model-identity-mismatch",
  message: string,
): void {
  if (!sameModelSurfaceModelRefV1(expected, actual)) {
    throw new ModelSurfaceResolutionErrorV1(code, message);
  }
}

function assertUniqueCatalogRefsV1(refs: readonly CatalogRefV1[]): void {
  const ids = new Set<string>();
  for (const ref of refs) {
    if (ids.has(ref.catalogId)) {
      throw new ModelSurfaceResolutionErrorV1(
        "duplicate-catalog-ref",
        `manifest repeats catalog ${ref.catalogId}`,
      );
    }
    ids.add(ref.catalogId);
  }
}

function loadPerformanceProfileRefV1(
  value: unknown,
): PerformanceProfileRefV1 {
  const record = modelSurfaceRecordV1(value, "performance profile ref");
  assertModelSurfaceExactKeysV1(
    record,
    ["profileId", "schemaVersion", "contentSha256"],
    [],
    "performance profile ref",
  );
  return Object.freeze({
    profileId: modelSurfaceNonEmptyStringV1(
      record.profileId,
      "performanceProfileRef.profileId",
    ),
    schemaVersion: modelSurfacePositiveIntegerV1(
      record.schemaVersion,
      "performanceProfileRef.schemaVersion",
    ),
    contentSha256: modelSurfaceSha256V1(
      record.contentSha256,
      "performanceProfileRef.contentSha256",
    ),
  });
}
