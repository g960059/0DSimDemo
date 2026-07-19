import catalogRawJson from "@/data/scientific/catalogs/official-healthy-periodic-document-chain-v1.json?raw";
import checkpointRawJson from "@/data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v3.json?raw";
import presetDocumentRawJson from "@/data/scientific/documents/presets/official-healthy-periodic-v1.json?raw";
import caseDocumentRawJson from "@/data/scientific/documents/cases/official-healthy-periodic-v1.json?raw";
import workspaceDocumentRawJson from "@/data/scientific/documents/workspaces/official-healthy-periodic-v1.json?raw";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadMainWireScientificCaseDocumentV1,
  loadMainWireScientificPresetDocumentV1,
  loadMainWireScientificWorkspaceDocumentV1,
  loadOfficialHealthyPeriodicDocumentChainCatalogV1,
  OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING,
  type LoadedOfficialHealthyPeriodicDocumentChainV1,
  type OfficialHealthyPeriodicDocumentChainIdentityV1,
  type OfficialHealthyPeriodicDocumentChainCatalogV1,
  type OfficialScientificJsonAssetBindingV1,
} from "@/engine/scientific/documents";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
} from "@/engine/scientific/presets";
import {
  canonicalJsonStringify,
  loadSimulationReleaseV1,
  sameSimulationReleaseRef,
  sha256TextHex,
} from "@/engine/scientific/release";
import {
  loadMainWireScientificSessionExactCheckpointV3,
  type MainWireScientificSessionExactCheckpointV3,
} from "@/engine/scientific/runtime";

export const BUNDLED_OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_V1_CLAIM =
  Object.freeze({
    commandInput: "preset-identity-and-version-only" as const,
    catalogTrustRoot: "compile-time-pinned-external-catalog" as const,
    completeRawAssetChainVerified: true as const,
    assetDigestSemantics: "raw-file-bytes-sha256" as const,
    deterministicByteForm: "canonical-json-plus-one-line-feed" as const,
    exactCheckpointSchemaVersion: 3 as const,
    exactSessionInputRequired: true as const,
    officialTrustStoredInScientificDocuments: false as const,
    callerAssetPayloadAccepted: false as const,
    silentV2SubstitutionApplied: false as const,
    runtimeFetchRequired: false as const,
  });

export type OfficialHealthyPeriodicDocumentChainBundleAssetsV1 = Readonly<{
  catalogRawJson: string;
  checkpointRawJson: string;
  presetDocumentRawJson: string;
  caseDocumentRawJson: string;
  workspaceDocumentRawJson: string;
}>;

export type LoadedBundledOfficialHealthyPeriodicDocumentChainV1 =
  LoadedOfficialHealthyPeriodicDocumentChainV1;

export class BundledOfficialHealthyPeriodicDocumentChainValidationErrorV1
  extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`bundled official healthy document chain rejected: ${immutable.join("; ")}`);
    this.name =
      "BundledOfficialHealthyPeriodicDocumentChainValidationErrorV1";
    this.issues = immutable;
  }
}

const BUNDLED_ASSETS = Object.freeze({
  catalogRawJson,
  checkpointRawJson,
  presetDocumentRawJson,
  caseDocumentRawJson,
  workspaceDocumentRawJson,
});

/** Test-only byte-parity seam; production uses the verified loader below. */
export const BUNDLED_OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_RAW_ASSETS_FOR_TEST_V1 =
  BUNDLED_ASSETS;

/** Browser Worker adapter. The caller selects identity only, never asset bytes. */
export async function loadBundledOfficialHealthyPeriodicDocumentChainV1(
  identity: OfficialHealthyPeriodicDocumentChainIdentityV1,
): Promise<LoadedBundledOfficialHealthyPeriodicDocumentChainV1> {
  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  return verifyOfficialHealthyPeriodicDocumentChainBundleAssetsV1(
    identity,
    release,
    BUNDLED_ASSETS,
  );
}

/** Pure raw-source verifier used by the Worker loader and tamper tests. */
export async function verifyOfficialHealthyPeriodicDocumentChainBundleAssetsV1(
  identity: OfficialHealthyPeriodicDocumentChainIdentityV1,
  untrustedRelease: unknown,
  assets: OfficialHealthyPeriodicDocumentChainBundleAssetsV1,
): Promise<LoadedBundledOfficialHealthyPeriodicDocumentChainV1> {
  assertIdentity(identity);
  const release = await loadSimulationReleaseV1(untrustedRelease);
  const issues: string[] = [];
  const catalogByteLength = utf8ByteLength(assets.catalogRawJson);
  const catalogRawFileSha256 = await sha256TextHex(assets.catalogRawJson);
  if (
    catalogByteLength
      !== OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING.byteLength
    || catalogRawFileSha256
      !== OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING
        .rawFileSha256
  ) issues.push("external catalog does not match its compile-time trust anchor");

  const catalog = loadOfficialHealthyPeriodicDocumentChainCatalogV1(
    parseDeterministicJsonAsset(assets.catalogRawJson, "external catalog"),
  );
  assertCatalogMatchesCompileTimeBinding(catalog, issues);
  if (
    catalog.entry.presetId !== identity.presetId
    || catalog.entry.presetVersion !== identity.presetVersion
  ) issues.push("catalog identity does not match the requested preset");
  if (!sameSimulationReleaseRef(release.ref, catalog.entry.releaseRef)) {
    issues.push("catalog releaseRef does not match the exact Worker release");
  }

  const target = catalog.entry.target;
  const checkpointValue = await verifyBoundRawAsset(
    assets.checkpointRawJson,
    target.checkpoint,
    "V3 checkpoint",
    issues,
  );
  const presetValue = await verifyBoundRawAsset(
    assets.presetDocumentRawJson,
    target.presetDocument,
    "preset document",
    issues,
  );
  const caseValue = await verifyBoundRawAsset(
    assets.caseDocumentRawJson,
    target.caseDocument,
    "case document",
    issues,
  );
  const workspaceValue = await verifyBoundRawAsset(
    assets.workspaceDocumentRawJson,
    target.workspaceDocument,
    "workspace document",
    issues,
  );
  if (issues.length > 0) {
    throw new BundledOfficialHealthyPeriodicDocumentChainValidationErrorV1(
      issues,
    );
  }

  try {
    const checkpoint =
      await loadMainWireScientificSessionExactCheckpointV3(
        {
          releaseRef: release.ref,
          sessionInputSha256: target.sessionInputSha256,
        },
        checkpointValue,
      );
    const presetDocument = await loadMainWireScientificPresetDocumentV1(
      release,
      presetValue,
    );
    const caseDocument = await loadMainWireScientificCaseDocumentV1(
      release,
      caseValue,
    );
    const workspaceDocument =
      await loadMainWireScientificWorkspaceDocumentV1(workspaceValue);
    assertChainIdentity(
      catalog,
      checkpoint,
      presetDocument,
      caseDocument,
      workspaceDocument,
    );
    return Object.freeze({
      identity: Object.freeze({ ...identity }),
      release,
      catalog,
      checkpoint,
      presetDocument,
      caseDocument,
      workspaceDocument,
      provenance: Object.freeze({
        catalogSchemaId: catalog.schema.id,
        catalogSchemaVersion: catalog.schema.version,
        catalogRawFileSha256,
        checkpointRawFileSha256: target.checkpoint.rawFileSha256,
        checkpointSha256: checkpoint.checkpointSha256,
        sessionInputSha256: checkpoint.sessionInputSha256,
        presetRef: presetDocument.ref,
        caseRef: caseDocument.ref,
        workspaceRef: workspaceDocument.ref,
      }),
    });
  } catch (error) {
    throw new BundledOfficialHealthyPeriodicDocumentChainValidationErrorV1([
      error instanceof Error ? error.message : String(error),
    ]);
  }
}

function assertCatalogMatchesCompileTimeBinding(
  catalog: OfficialHealthyPeriodicDocumentChainCatalogV1,
  issues: string[],
): void {
  const binding = OFFICIAL_HEALTHY_PERIODIC_DOCUMENT_CHAIN_CATALOG_V1_BINDING;
  const target = catalog.entry.target;
  if (
    !sameSimulationReleaseRef(catalog.entry.releaseRef, binding.releaseRef)
    || target.sessionInputSha256 !== binding.sessionInputSha256
    || target.checkpoint.rawFileSha256 !== binding.checkpointRawFileSha256
    || target.checkpoint.checkpointSha256 !== binding.checkpointSha256
    || canonicalJsonStringify(target.presetDocument.ref)
      !== canonicalJsonStringify(binding.presetRef)
    || canonicalJsonStringify(target.caseDocument.ref)
      !== canonicalJsonStringify(binding.caseRef)
    || canonicalJsonStringify(target.workspaceDocument.ref)
      !== canonicalJsonStringify(binding.workspaceRef)
  ) issues.push("external catalog content does not match compile-time identity binding");
}

async function verifyBoundRawAsset(
  raw: string,
  binding: OfficialScientificJsonAssetBindingV1,
  label: string,
  issues: string[],
): Promise<unknown> {
  if (utf8ByteLength(raw) !== binding.byteLength) {
    issues.push(`${label} raw-file byte length mismatch`);
  }
  if (await sha256TextHex(raw) !== binding.rawFileSha256) {
    issues.push(`${label} raw-file SHA-256 mismatch`);
  }
  return parseDeterministicJsonAsset(raw, label);
}

function parseDeterministicJsonAsset(raw: string, label: string): unknown {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new BundledOfficialHealthyPeriodicDocumentChainValidationErrorV1([
      `${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
  if (`${canonicalJsonStringify(value)}\n` !== raw) {
    throw new BundledOfficialHealthyPeriodicDocumentChainValidationErrorV1([
      `${label} is not deterministic canonical JSON bytes`,
    ]);
  }
  return value;
}

function assertChainIdentity(
  catalog: OfficialHealthyPeriodicDocumentChainCatalogV1,
  checkpoint: MainWireScientificSessionExactCheckpointV3,
  presetDocument: LoadedOfficialHealthyPeriodicDocumentChainV1["presetDocument"],
  caseDocument: LoadedOfficialHealthyPeriodicDocumentChainV1["caseDocument"],
  workspaceDocument:
    LoadedOfficialHealthyPeriodicDocumentChainV1["workspaceDocument"],
): void {
  const target = catalog.entry.target;
  if (
    checkpoint.checkpointSha256 !== target.checkpoint.checkpointSha256
    || checkpoint.sessionInputSha256 !== target.sessionInputSha256
    || canonicalJsonStringify(presetDocument.ref)
      !== canonicalJsonStringify(target.presetDocument.ref)
    || canonicalJsonStringify(caseDocument.ref)
      !== canonicalJsonStringify(target.caseDocument.ref)
    || canonicalJsonStringify(workspaceDocument.ref)
      !== canonicalJsonStringify(target.workspaceDocument.ref)
    || caseDocument.content.startDescriptor.kind !== "exact-checkpoint-v3"
    || caseDocument.content.startDescriptor.checkpointSha256
      !== checkpoint.checkpointSha256
    || caseDocument.content.startDescriptor.sessionInputSha256
      !== checkpoint.sessionInputSha256
    || canonicalJsonStringify(caseDocument.content.lineage.sourcePresetRef)
      !== canonicalJsonStringify(presetDocument.ref)
    || canonicalJsonStringify(workspaceDocument.content.caseDocumentRef)
      !== canonicalJsonStringify(caseDocument.ref)
  ) throw new Error("catalog, checkpoint, preset, case, or workspace identity mismatch");
}

function assertIdentity(
  identity: OfficialHealthyPeriodicDocumentChainIdentityV1,
): void {
  if (
    !isRecord(identity)
    || !hasExactKeys(identity, ["presetId", "presetVersion"])
    || identity.presetId !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID
    || identity.presetVersion
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION
  ) {
    throw new BundledOfficialHealthyPeriodicDocumentChainValidationErrorV1([
      "preset identity/version is not present in the bundled document catalog",
    ]);
  }
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sorted = [...expected].sort();
  return JSON.stringify(actual) === JSON.stringify(sorted);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
