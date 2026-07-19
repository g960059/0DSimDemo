import {
  loadOfficialHealthyPeriodicCheckpointPresetDocumentV1,
  loadOfficialScientificPresetCatalogV1,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
  type OfficialHealthyPeriodicCheckpointPresetDocumentV1,
  type OfficialScientificPresetCatalogV1,
} from "@/engine/scientific/presets/officialHealthyPeriodicCheckpointPresetV1";
import {
  canonicalJsonStringify,
  sameSimulationReleaseRef,
  sha256CanonicalJsonHex,
  sha256TextHex,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";
import type {
  MainWireScientificSessionExactCheckpointV2,
} from "@/engine/scientific/runtime";

export type BundledOfficialHealthyPeriodicPresetIdentityV1 = Readonly<{
  presetId: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID;
  presetVersion:
    typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION;
}>;

export type OfficialHealthyPeriodicPresetBundleAssetsV1 = Readonly<{
  catalogRawJson: string;
  presetRawJson: string;
  checkpointRawJson: string;
}>;

export type LoadedBundledOfficialHealthyPeriodicPresetV1 = Readonly<{
  identity: BundledOfficialHealthyPeriodicPresetIdentityV1;
  catalog: OfficialScientificPresetCatalogV1;
  presetDocument: OfficialHealthyPeriodicCheckpointPresetDocumentV1;
  checkpoint: MainWireScientificSessionExactCheckpointV2;
  release: SimulationReleaseV1;
  provenance: Readonly<{
    catalogSchemaId: OfficialScientificPresetCatalogV1["schema"]["id"];
    catalogSchemaVersion: 1;
    manifestRawFileSha256: string;
    checkpointRawFileSha256: string;
    checkpointSha256: string;
  }>;
}>;

export class BundledOfficialHealthyPeriodicPresetValidationErrorV1
  extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`bundled official healthy periodic preset rejected: ${immutable.join("; ")}`);
    this.name = "BundledOfficialHealthyPeriodicPresetValidationErrorV1";
    this.issues = immutable;
  }
}

/**
 * Pure-source verification seam used by tests and build-time audits. It is not
 * reachable through the Worker command protocol; production commands always
 * use the statically bundled assets above.
 */
export async function verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
  identity: BundledOfficialHealthyPeriodicPresetIdentityV1,
  release: SimulationReleaseV1,
  assets: OfficialHealthyPeriodicPresetBundleAssetsV1,
): Promise<LoadedBundledOfficialHealthyPeriodicPresetV1> {
  const issues: string[] = [];
  if (
    identity.presetId
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID
    || identity.presetVersion
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION
  ) {
    throw new BundledOfficialHealthyPeriodicPresetValidationErrorV1([
      "preset identity/version is not present in the bundled catalog",
    ]);
  }

  const catalogValue = parseDeterministicJsonAsset(
    assets.catalogRawJson,
    "preset catalog",
  );
  const catalog = loadOfficialScientificPresetCatalogV1(catalogValue);
  const entry = catalog.entries[0];
  if (
    entry.presetId !== identity.presetId
    || entry.presetVersion !== identity.presetVersion
  ) issues.push("catalog entry does not match the requested preset identity/version");
  if (
    entry.manifest.byteLength
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .manifestByteLength
    || entry.manifest.rawFileSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .manifestRawFileSha256
  ) issues.push("catalog entry does not match the compile-time preset trust anchor");

  await verifyRawAsset(
    assets.presetRawJson,
    entry.manifest.byteLength,
    entry.manifest.rawFileSha256,
    "preset manifest",
    issues,
  );
  const presetDocumentValue = parseDeterministicJsonAsset(
    assets.presetRawJson,
    "preset manifest",
  );
  const presetDocument = loadOfficialHealthyPeriodicCheckpointPresetDocumentV1(
    presetDocumentValue,
  );
  if (
    presetDocument.preset.id !== identity.presetId
    || presetDocument.preset.version !== identity.presetVersion
  ) issues.push("preset document does not match the requested identity/version");

  const checkpointDescriptor = presetDocument.initialization.checkpoint;
  if (
    checkpointDescriptor.byteLength
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .checkpointByteLength
    || checkpointDescriptor.rawFileSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .checkpointRawFileSha256
    || checkpointDescriptor.checkpointEnvelopeSha256
      !== OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING
        .checkpointSha256
  ) issues.push("preset checkpoint does not match the compile-time trust anchor");
  await verifyRawAsset(
    assets.checkpointRawJson,
    checkpointDescriptor.byteLength,
    checkpointDescriptor.rawFileSha256,
    "checkpoint",
    issues,
  );
  const checkpointValue = parseDeterministicJsonAsset(
    assets.checkpointRawJson,
    "checkpoint",
  );
  if (!isRecord(checkpointValue)) {
    throw new BundledOfficialHealthyPeriodicPresetValidationErrorV1([
      "checkpoint must be a JSON object",
    ]);
  }
  const checkpoint = checkpointValue as unknown as
    MainWireScientificSessionExactCheckpointV2;
  if (
    checkpoint.checkpointId !== checkpointDescriptor.checkpointId
    || checkpoint.schemaVersion !== checkpointDescriptor.checkpointSchemaVersion
    || checkpoint.checkpointSha256
      !== checkpointDescriptor.checkpointEnvelopeSha256
  ) issues.push("checkpoint envelope identity does not match the preset document");
  const { checkpointSha256: statedCheckpointSha256, ...checkpointPayload } =
    checkpoint;
  const computedCheckpointSha256 = await sha256CanonicalJsonHex(
    checkpointPayload,
  );
  if (
    statedCheckpointSha256 !== computedCheckpointSha256
    || checkpointDescriptor.checkpointEnvelopeSha256
      !== computedCheckpointSha256
  ) issues.push("inner checkpoint canonical SHA-256 mismatch");

  if (
    !sameSimulationReleaseRef(
      release.ref,
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_BINDING.releaseRef,
    )
    ||
    !sameSimulationReleaseRef(release.ref, presetDocument.releaseRef)
    || !sameSimulationReleaseRef(release.ref, checkpoint.releaseRef)
  ) issues.push("full current SimulationReleaseRef does not match the preset chain");

  if (issues.length > 0) {
    throw new BundledOfficialHealthyPeriodicPresetValidationErrorV1(issues);
  }
  return Object.freeze({
    identity: Object.freeze({ ...identity }),
    catalog,
    presetDocument,
    checkpoint,
    release,
    provenance: Object.freeze({
      catalogSchemaId: catalog.schema.id,
      catalogSchemaVersion: catalog.schema.version,
      manifestRawFileSha256: entry.manifest.rawFileSha256,
      checkpointRawFileSha256: checkpointDescriptor.rawFileSha256,
      checkpointSha256: checkpointDescriptor.checkpointEnvelopeSha256,
    }),
  });
}

function parseDeterministicJsonAsset(raw: string, label: string): unknown {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new BundledOfficialHealthyPeriodicPresetValidationErrorV1([
      `${label} is not valid JSON: ${errorMessage(error)}`,
    ]);
  }
  let canonical: string;
  try {
    canonical = `${canonicalJsonStringify(value)}\n`;
  } catch (error) {
    throw new BundledOfficialHealthyPeriodicPresetValidationErrorV1([
      `${label} is outside canonical JSON: ${errorMessage(error)}`,
    ]);
  }
  if (raw !== canonical) {
    throw new BundledOfficialHealthyPeriodicPresetValidationErrorV1([
      `${label} is not the deterministic canonical JSON byte form`,
    ]);
  }
  return value;
}

async function verifyRawAsset(
  raw: string,
  expectedByteLength: number,
  expectedSha256: string,
  label: string,
  issues: string[],
): Promise<void> {
  const byteLength = utf8ByteLength(raw);
  if (byteLength !== expectedByteLength) {
    issues.push(`${label} raw-file byte length mismatch`);
  }
  if (await sha256TextHex(raw) !== expectedSha256) {
    issues.push(`${label} raw-file SHA-256 mismatch`);
  }
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
