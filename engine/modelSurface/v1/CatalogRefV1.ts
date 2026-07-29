import {
  canonicalJsonStringify,
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
  type CanonicalJsonValue,
} from "@/engine/scientific/release";
import {
  loadModelSurfaceModelRefV1,
  type ModelSurfaceModelRefV1,
} from "@/engine/modelSurface/v1/ModelSurfaceIdentityV1";
import {
  assertModelSurfaceExactKeysV1,
  modelSurfaceNonEmptyStringV1,
  modelSurfacePositiveIntegerV1,
  modelSurfaceRecordV1,
  modelSurfaceSha256V1,
} from "@/engine/modelSurface/v1/validationV1";

export type CatalogRefV1 = Readonly<{
  catalogId: string;
  schemaVersion: number;
  contentSha256: string;
}>;

/**
 * Non-normative catalog material. These four slots never participate in a
 * CatalogRef content hash; putting the same data under `content` makes it
 * normative and therefore hashed.
 */
export type CatalogNonNormativeMetadataV1 = Readonly<{
  debugSourcePaths?: Readonly<Record<string, string>>;
  buildTimestamp?: string;
  humanComments?: readonly string[];
  localeStrings?: Readonly<Record<
    string,
    Readonly<Record<string, string>>
  >>;
}>;

export type CatalogDocumentV1<
  TContent extends CanonicalJsonValue = CanonicalJsonValue,
> = Readonly<{
  catalogId: string;
  schemaVersion: number;
  modelRef: ModelSurfaceModelRefV1;
  content: TContent;
  metadata?: CatalogNonNormativeMetadataV1;
}>;

export type CatalogHashPayloadV1<
  TContent extends CanonicalJsonValue = CanonicalJsonValue,
> = Readonly<{
  catalogId: string;
  schemaVersion: number;
  modelRef: ModelSurfaceModelRefV1;
  content: TContent;
}>;

export function loadCatalogRefV1(value: unknown): CatalogRefV1 {
  const record = modelSurfaceRecordV1(value, "catalog ref");
  assertModelSurfaceExactKeysV1(
    record,
    ["catalogId", "schemaVersion", "contentSha256"],
    [],
    "catalog ref",
  );
  return Object.freeze({
    catalogId: modelSurfaceNonEmptyStringV1(
      record.catalogId,
      "catalogRef.catalogId",
    ),
    schemaVersion: modelSurfacePositiveIntegerV1(
      record.schemaVersion,
      "catalogRef.schemaVersion",
    ),
    contentSha256: modelSurfaceSha256V1(
      record.contentSha256,
      "catalogRef.contentSha256",
    ),
  });
}

export function loadCatalogDocumentV1(
  value: unknown,
): CatalogDocumentV1 {
  const frozen = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  const record = modelSurfaceRecordV1(frozen, "catalog document");
  assertModelSurfaceExactKeysV1(
    record,
    ["catalogId", "schemaVersion", "modelRef", "content"],
    ["metadata"],
    "catalog document",
  );
  if (record.metadata !== undefined) {
    const metadata = modelSurfaceRecordV1(
      record.metadata,
      "catalog document metadata",
    );
    assertModelSurfaceExactKeysV1(
      metadata,
      [],
      [
        "debugSourcePaths",
        "buildTimestamp",
        "humanComments",
        "localeStrings",
      ],
      "catalog document metadata",
    );
  }
  return frozen as unknown as CatalogDocumentV1;
}

/**
 * Catalog identity is the canonical JSON of the complete normative envelope:
 * catalog ID, schema version, exact model identity and `content`. Consequently
 * every semantic ID, unit, station, direction, extractor/derivation version,
 * transition, value domain, capability requirement and interpretation
 * boundary placed in `content` is included. Only the explicit `metadata`
 * envelope above is excluded.
 */
export function catalogHashPayloadV1(
  document: CatalogDocumentV1,
): CatalogHashPayloadV1 {
  return Object.freeze({
    catalogId: document.catalogId,
    schemaVersion: document.schemaVersion,
    modelRef: document.modelRef,
    content: document.content,
  });
}

export async function catalogContentSha256V1(
  document: CatalogDocumentV1,
): Promise<string> {
  return sha256CanonicalJsonHex(catalogHashPayloadV1(document));
}

export async function createCatalogRefV1(
  document: CatalogDocumentV1,
): Promise<CatalogRefV1> {
  const loaded = loadCatalogDocumentV1(document);
  return Object.freeze({
    catalogId: loaded.catalogId,
    schemaVersion: loaded.schemaVersion,
    contentSha256: await catalogContentSha256V1(loaded),
  });
}

export function sameCatalogRefV1(
  left: CatalogRefV1,
  right: CatalogRefV1,
): boolean {
  return left.catalogId === right.catalogId
    && left.schemaVersion === right.schemaVersion
    && left.contentSha256 === right.contentSha256;
}

export function sameCatalogNormativeContentV1(
  left: CatalogDocumentV1,
  right: CatalogDocumentV1,
): boolean {
  return canonicalJsonStringify(catalogHashPayloadV1(left))
    === canonicalJsonStringify(catalogHashPayloadV1(right));
}
