import catalogRawJson from "@/data/scientific/catalogs/official-healthy-periodic-document-chain-v1.json?raw";
import workspaceDocumentRawJson from "@/data/scientific/documents/workspaces/official-healthy-periodic-v1.json?raw";

import {
  loadMainWireScientificWorkspaceDocumentV1,
  loadOfficialHealthyPeriodicDocumentChainCatalogV1,
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING,
  type MainWireScientificWorkspaceDocumentV1,
  type OfficialHealthyPeriodicDocumentChainIdentityV1,
} from "@/engine/scientific/documents";
import {
  canonicalJsonStringify,
  sha256TextHex,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const BUNDLED_OFFICIAL_HEALTHY_PERIODIC_WORKSPACE_DOCUMENT_V1_CLAIM =
  Object.freeze({
    presentationOnly: true as const,
    externalCatalogPinVerified: true as const,
    caseRefVerified: true as const,
    checkpointBytesImported: false as const,
    releaseArtifactImported: false as const,
    callerAssetPayloadAccepted: false as const,
  });

export type LoadedBundledOfficialHealthyPeriodicWorkspaceDocumentV1 =
  Readonly<{
    identity: OfficialHealthyPeriodicDocumentChainIdentityV1;
    releaseRef: SimulationReleaseRef;
    workspaceDocument: MainWireScientificWorkspaceDocumentV1;
    provenance: Readonly<{
      catalogSchemaId:
        "circleheart-official-scientific-document-chain-catalog-v1";
      catalogSchemaVersion: 1;
      catalogRawFileSha256: string;
      workspaceRawFileSha256: string;
      caseRef: MainWireScientificWorkspaceDocumentV1["content"]["caseDocumentRef"];
      workspaceRef: MainWireScientificWorkspaceDocumentV1["ref"];
    }>;
  }>;

/**
 * Main-thread presentation adapter. It verifies only the pinned catalog and
 * workspace bytes, keeping the V3 checkpoint and full release Worker-only.
 */
export async function loadBundledOfficialHealthyPeriodicWorkspaceDocumentV1(
  identity: OfficialHealthyPeriodicDocumentChainIdentityV1,
): Promise<LoadedBundledOfficialHealthyPeriodicWorkspaceDocumentV1> {
  const binding =
    OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING;
  if (
    !isRecord(identity)
    || !hasExactKeys(identity, ["presetId", "presetVersion"])
    || identity.presetId !== "circleheart/official-healthy-periodic"
    || identity.presetVersion !== "1.0.0"
  ) throw new Error("official workspace identity/version is unsupported");
  if (
    utf8ByteLength(catalogRawJson) !== binding.byteLength
    || await sha256TextHex(catalogRawJson) !== binding.rawFileSha256
  ) throw new Error("official workspace catalog trust anchor mismatch");
  const catalog = loadOfficialHealthyPeriodicDocumentChainCatalogV1(
    parseDeterministic(catalogRawJson, "official workspace catalog"),
  );
  const workspaceBinding = catalog.entry.target.workspaceDocument;
  if (
    catalog.entry.presetId !== identity.presetId
    || catalog.entry.presetVersion !== identity.presetVersion
    || !sameRef(workspaceBinding.ref, binding.workspaceRef)
    || utf8ByteLength(workspaceDocumentRawJson) !== workspaceBinding.byteLength
    || await sha256TextHex(workspaceDocumentRawJson)
      !== workspaceBinding.rawFileSha256
  ) throw new Error("official workspace raw binding mismatch");
  const workspaceDocument =
    await loadMainWireScientificWorkspaceDocumentV1(
      parseDeterministic(
        workspaceDocumentRawJson,
        "official workspace document",
      ),
    );
  if (
    !sameRef(workspaceDocument.ref, binding.workspaceRef)
    || !sameRef(workspaceDocument.content.caseDocumentRef, binding.caseRef)
  ) throw new Error("official workspace document identity mismatch");
  return Object.freeze({
    identity: Object.freeze({ ...identity }),
    releaseRef: Object.freeze({ ...catalog.entry.releaseRef }),
    workspaceDocument,
    provenance: Object.freeze({
      catalogSchemaId: catalog.schema.id,
      catalogSchemaVersion: catalog.schema.version,
      catalogRawFileSha256: binding.rawFileSha256,
      workspaceRawFileSha256: workspaceBinding.rawFileSha256,
      caseRef: workspaceDocument.content.caseDocumentRef,
      workspaceRef: workspaceDocument.ref,
    }),
  });
}

function parseDeterministic(raw: string, label: string): unknown {
  const value = JSON.parse(raw) as unknown;
  if (`${canonicalJsonStringify(value)}\n` !== raw) {
    throw new Error(`${label} is not deterministic canonical JSON bytes`);
  }
  return value;
}

function sameRef(left: unknown, right: unknown): boolean {
  return isRecord(left) && isRecord(right)
    && hasExactKeys(left, ["schemaId", "sha256"])
    && hasExactKeys(right, ["schemaId", "sha256"])
    && left.schemaId === right.schemaId
    && left.sha256 === right.sha256;
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return JSON.stringify(Object.keys(value).sort())
    === JSON.stringify([...expected].sort());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
