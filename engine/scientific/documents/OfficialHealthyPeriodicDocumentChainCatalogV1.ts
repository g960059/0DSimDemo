import {
  mainWireScientificCaseDocumentRefIssuesV1,
  type MainWireScientificCaseDocumentV1,
  type MainWireScientificCaseDocumentRefV1,
} from "@/engine/scientific/documents/MainWireScientificCaseDocumentV1";
import {
  mainWireScientificPresetDocumentRefIssuesV1,
  type MainWireScientificPresetDocumentV1,
  type MainWireScientificPresetDocumentRefV1,
} from "@/engine/scientific/documents/MainWireScientificPresetDocumentV1";
import {
  mainWireScientificWorkspaceDocumentRefIssuesV1,
  type MainWireScientificWorkspaceDocumentV1,
  type MainWireScientificWorkspaceDocumentRefV1,
} from "@/engine/scientific/documents/MainWireScientificWorkspaceDocumentV1";
import {
  MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID,
  type MainWireScientificSessionExactCheckpointV3,
} from "@/engine/scientific/runtime/MainWireScientificExactCheckpointV3";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
} from "@/engine/scientific/presets/officialHealthyPeriodicCheckpointPresetV1";
import {
  cloneAndFreezeCanonicalJson,
  SHA256_HEX_PATTERN,
  simulationReleaseRefIssuesV1,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";

export const OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_SCHEMA_ID =
  "circleheart-official-scientific-document-chain-catalog-v1" as const;
export const OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_PATH =
  "data/scientific/catalogs/official-healthy-periodic-document-chain-v1.json" as const;
export const OFFICIAL_HEALTHY_PERIODIC_V3_CHECKPOINT_PATH =
  "data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v3.json" as const;
export const OFFICIAL_HEALTHY_PERIODIC_PRESET_DOCUMENT_V1_PATH =
  "data/scientific/documents/presets/official-healthy-periodic-v1.json" as const;
export const OFFICIAL_HEALTHY_PERIODIC_CASE_DOCUMENT_V1_PATH =
  "data/scientific/documents/cases/official-healthy-periodic-v1.json" as const;
export const OFFICIAL_HEALTHY_PERIODIC_WORKSPACE_DOCUMENT_V1_PATH =
  "data/scientific/documents/workspaces/official-healthy-periodic-v1.json" as const;

/**
 * Application-owned root of trust for the external catalog. The catalog in
 * turn binds every scientific document and checkpoint byte-for-byte. These
 * values are updated only when the checked-in catalog is intentionally
 * regenerated and reviewed.
 */
export const OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING =
  Object.freeze({
    byteLength: 2_715 as const,
    rawFileSha256:
      "a02ef9c8b9834dbdcbbff28e3aa9eeb0b5ae462ff4c899759d2a77fe9ca2c83b" as const,
    releaseRef: Object.freeze({
      id: "circleheart/adult-five-wall-noncoronary" as const,
      version: "0.2.0" as const,
      sha256:
        "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4" as const,
    }),
    sessionInputSha256:
      "4c637109b4c858b4cc5755e7b0bb039bfb4dbb57fc5e1b2b156fc2f1f6e3eae1" as const,
    checkpointRawFileSha256:
      "f3d8913125bfcd8e5d2066674157b4882164bcb0f9575d1ac67f8baf6aec2a14" as const,
    checkpointSha256:
      "e63b33b17b3d62bdca417aa8315ba3046b0758c6401a3633e917b6b5114511f6" as const,
    presetRef: Object.freeze({
      schemaId:
        "circleheart-main-wire-scientific-preset-document-ref-v1" as const,
      sha256:
        "0e4ff59d0f55485e954374ca18138ab164c3428132455a6465eb3f79d553c8aa" as const,
    }),
    caseRef: Object.freeze({
      schemaId:
        "circleheart-main-wire-scientific-case-document-ref-v1" as const,
      sha256:
        "c5644512b2e2589847f6b4471794c9fbca062b68190f06fd8405002a664f7861" as const,
    }),
    workspaceRef: Object.freeze({
      schemaId:
        "circleheart-main-wire-scientific-workspace-document-ref-v1" as const,
      sha256:
        "5faed3f4de4750cfaadd21dfd37a9b3be5f50ac669e4e99575c2e75c8f9c9bab" as const,
    }),
  });

export type OfficialScientificJsonAssetBindingV1 = Readonly<{
  path: string;
  mediaType: "application/json";
  byteLength: number;
  rawFileSha256: string;
  rawFileDigestSemantics: "raw-file-bytes-sha256";
}>;

export type OfficialScientificDocumentAssetBindingV1<TRef> =
  OfficialScientificJsonAssetBindingV1 & Readonly<{ ref: TRef }>;

export type OfficialHealthyPeriodicDocumentChainCatalogV1 = Readonly<{
  schema: Readonly<{
    id: typeof OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_SCHEMA_ID;
    version: 1;
  }>;
  entry: Readonly<{
    presetId: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID;
    presetVersion:
      typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION;
    trustClass: "application-catalog-official-pinned";
    releaseRef: SimulationReleaseRef;
    source: Readonly<{
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v2";
      checkpointSchemaVersion: 2;
      checkpointSha256: string;
    }>;
    target: Readonly<{
      sessionInputSha256: string;
      checkpoint: OfficialScientificJsonAssetBindingV1 & Readonly<{
        checkpointId:
          typeof MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID;
        checkpointSchemaVersion: 3;
        checkpointSha256: string;
      }>;
      presetDocument: OfficialScientificDocumentAssetBindingV1<
        MainWireScientificPresetDocumentRefV1
      >;
      caseDocument: OfficialScientificDocumentAssetBindingV1<
        MainWireScientificCaseDocumentRefV1
      >;
      workspaceDocument: OfficialScientificDocumentAssetBindingV1<
        MainWireScientificWorkspaceDocumentRefV1
      >;
    }>;
    claims: Readonly<{
      officialTrustExternalToScientificDocuments: true;
      sourceV2VerifiedBeforePromotion: true;
      sourceV2EnvelopeRelabeledAsV3: false;
      promotedViaExactRestoreAndV3Serialization: true;
      terminalPeriod1TrackerPreserved: true;
      clinicalValidationClaimed: false;
      patientSpecificFitClaimed: false;
    }>;
  }>;
}>;

export type OfficialHealthyPeriodicDocumentChainIdentityV1 = Readonly<{
  presetId: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID;
  presetVersion:
    typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION;
}>;

/** Host-neutral verified asset bundle supplied to the scientific kernel. */
export type LoadedOfficialHealthyPeriodicDocumentChainV1 = Readonly<{
  identity: OfficialHealthyPeriodicDocumentChainIdentityV1;
  release: SimulationReleaseV1;
  catalog: OfficialHealthyPeriodicDocumentChainCatalogV1;
  checkpoint: MainWireScientificSessionExactCheckpointV3;
  presetDocument: MainWireScientificPresetDocumentV1;
  caseDocument: MainWireScientificCaseDocumentV1;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  provenance: Readonly<{
    catalogSchemaId:
      OfficialHealthyPeriodicDocumentChainCatalogV1["schema"]["id"];
    catalogSchemaVersion: 1;
    catalogRawFileSha256: string;
    checkpointRawFileSha256: string;
    checkpointSha256: string;
    sessionInputSha256: string;
    presetRef: MainWireScientificPresetDocumentRefV1;
    caseRef: MainWireScientificCaseDocumentRefV1;
    workspaceRef: MainWireScientificWorkspaceDocumentRefV1;
  }>;
}>;

export class OfficialHealthyPeriodicDocumentChainCatalogValidationErrorV1
  extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`official healthy document-chain catalog rejected: ${immutable.join("; ")}`);
    this.name =
      "OfficialHealthyPeriodicDocumentChainCatalogValidationErrorV1";
    this.issues = immutable;
  }
}

/** Strict shape loader. Trust comes from the separately pinned raw digest. */
export function loadOfficialHealthyPeriodicDocumentChainCatalogV1(
  value: unknown,
): OfficialHealthyPeriodicDocumentChainCatalogV1 {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new OfficialHealthyPeriodicDocumentChainCatalogValidationErrorV1([
      error instanceof Error ? error.message : "catalog is not canonical JSON",
    ]);
  }
  const issues = catalogIssues(safe);
  if (issues.length > 0) {
    throw new OfficialHealthyPeriodicDocumentChainCatalogValidationErrorV1(
      issues,
    );
  }
  return safe as unknown as OfficialHealthyPeriodicDocumentChainCatalogV1;
}

function catalogIssues(value: unknown): string[] {
  const issues = exactObjectIssues(value, ["schema", "entry"], "catalog");
  if (!isRecord(value)) return issues;
  issues.push(...fixedObjectIssues(value.schema, "catalog.schema", {
    id: OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_SCHEMA_ID,
    version: 1,
  }));
  issues.push(...exactObjectIssues(value.entry, [
    "presetId",
    "presetVersion",
    "trustClass",
    "releaseRef",
    "source",
    "target",
    "claims",
  ], "catalog.entry"));
  if (!isRecord(value.entry)) return issues;
  const entry = value.entry;
  if (entry.presetId !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID) {
    issues.push("catalog.entry.presetId is unsupported");
  }
  if (
    entry.presetVersion
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION
  ) issues.push("catalog.entry.presetVersion is unsupported");
  if (entry.trustClass !== "application-catalog-official-pinned") {
    issues.push("catalog.entry.trustClass is unsupported");
  }
  issues.push(...simulationReleaseRefIssuesV1(entry.releaseRef)
    .map((issue) => `catalog.entry.${issue}`));
  issues.push(...fixedObjectIssues(entry.source, "catalog.entry.source", {
    checkpointId: "main-wire-scientific-session-exact-checkpoint-v2",
    checkpointSchemaVersion: 2,
    checkpointSha256:
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING.checkpointSha256,
  }));
  issues.push(...targetIssues(entry.target));
  issues.push(...fixedObjectIssues(entry.claims, "catalog.entry.claims", {
    officialTrustExternalToScientificDocuments: true,
    sourceV2VerifiedBeforePromotion: true,
    sourceV2EnvelopeRelabeledAsV3: false,
    promotedViaExactRestoreAndV3Serialization: true,
    terminalPeriod1TrackerPreserved: true,
    clinicalValidationClaimed: false,
    patientSpecificFitClaimed: false,
  }));
  return issues;
}

function targetIssues(value: unknown): string[] {
  const path = "catalog.entry.target";
  const issues = exactObjectIssues(value, [
    "sessionInputSha256",
    "checkpoint",
    "presetDocument",
    "caseDocument",
    "workspaceDocument",
  ], path);
  if (!isRecord(value)) return issues;
  sha256Issues(value.sessionInputSha256, `${path}.sessionInputSha256`, issues);
  issues.push(...checkpointAssetIssues(value.checkpoint, `${path}.checkpoint`));
  issues.push(...documentAssetIssues(
    value.presetDocument,
    `${path}.presetDocument`,
    OFFICIAL_HEALTHY_PERIODIC_PRESET_DOCUMENT_V1_PATH,
    mainWireScientificPresetDocumentRefIssuesV1,
  ));
  issues.push(...documentAssetIssues(
    value.caseDocument,
    `${path}.caseDocument`,
    OFFICIAL_HEALTHY_PERIODIC_CASE_DOCUMENT_V1_PATH,
    mainWireScientificCaseDocumentRefIssuesV1,
  ));
  issues.push(...documentAssetIssues(
    value.workspaceDocument,
    `${path}.workspaceDocument`,
    OFFICIAL_HEALTHY_PERIODIC_WORKSPACE_DOCUMENT_V1_PATH,
    mainWireScientificWorkspaceDocumentRefIssuesV1,
  ));
  return issues;
}

function checkpointAssetIssues(value: unknown, path: string): string[] {
  const issues = jsonAssetIssues(value, path, [
    "checkpointId",
    "checkpointSchemaVersion",
    "checkpointSha256",
  ]);
  if (!isRecord(value)) return issues;
  if (value.path !== OFFICIAL_HEALTHY_PERIODIC_V3_CHECKPOINT_PATH) {
    issues.push(`${path}.path is unsupported`);
  }
  if (value.checkpointId
    !== MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID) {
    issues.push(`${path}.checkpointId is unsupported`);
  }
  if (value.checkpointSchemaVersion !== 3) {
    issues.push(`${path}.checkpointSchemaVersion must be 3`);
  }
  sha256Issues(value.checkpointSha256, `${path}.checkpointSha256`, issues);
  return issues;
}

function documentAssetIssues(
  value: unknown,
  path: string,
  expectedPath: string,
  refIssues: (value: unknown, path: string) => readonly string[],
): string[] {
  const issues = jsonAssetIssues(value, path, ["ref"]);
  if (!isRecord(value)) return issues;
  if (value.path !== expectedPath) issues.push(`${path}.path is unsupported`);
  issues.push(...refIssues(value.ref, `${path}.ref`));
  return issues;
}

function jsonAssetIssues(
  value: unknown,
  path: string,
  extraKeys: readonly string[],
): string[] {
  const issues = exactObjectIssues(value, [
    "path",
    "mediaType",
    "byteLength",
    "rawFileSha256",
    "rawFileDigestSemantics",
    ...extraKeys,
  ], path);
  if (!isRecord(value)) return issues;
  if (value.mediaType !== "application/json") {
    issues.push(`${path}.mediaType must be application/json`);
  }
  if (!Number.isSafeInteger(value.byteLength) || (value.byteLength as number) <= 0) {
    issues.push(`${path}.byteLength must be a positive safe integer`);
  }
  sha256Issues(value.rawFileSha256, `${path}.rawFileSha256`, issues);
  if (value.rawFileDigestSemantics !== "raw-file-bytes-sha256") {
    issues.push(`${path}.rawFileDigestSemantics is unsupported`);
  }
  return issues;
}

function fixedObjectIssues(
  value: unknown,
  path: string,
  expected: Readonly<Record<string, unknown>>,
): string[] {
  const issues = exactObjectIssues(value, Object.keys(expected), path);
  if (!isRecord(value)) return issues;
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (value[key] !== expectedValue) issues.push(`${path}.${key} is unsupported`);
  }
  return issues;
}

function exactObjectIssues(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : [`${path} must contain exactly keys ${expected.join(", ")}`];
}

function sha256Issues(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN.test(value)) {
    issues.push(`${path} must be a lowercase SHA-256 digest`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
