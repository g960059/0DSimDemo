import type {
  ArtifactStorePortV1,
  StudioArtifactKindV1,
  StudioArtifactRefV1,
  StudioJsonObjectV1,
  StudioJsonValueV1,
  StudioJsonWriteV1,
} from "@/studio/contracts/v1";
import {
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
} from "@/studio/contracts/v1";
import {
  cloneAndFreezeStudioJsonV1,
  sha256StudioJsonHexV1,
  studioCanonicalJsonStringifyV1,
} from "./studioCanonicalJsonV1";

const STUDIO_JSON_BLOB_V1_SCHEMA_ID =
  "circleheart-studio-json-blob-v1" as const;
const SHA256_HEX_PATTERN_V1 = /^[0-9a-f]{64}$/;

const ARTIFACT_KINDS_V1 = new Set<StudioArtifactKindV1>([
  "model-package",
  "run-artifact",
  "simulation-input",
  "snapshot-envelope",
  "studio-json",
]);

type StoredJsonArtifactV1 = Readonly<{
  ref: StudioArtifactRefV1;
  envelope: StudioJsonObjectV1;
  content: StudioJsonValueV1;
  canonicalEnvelope: string;
}>;

export class StudioArtifactStoreValidationErrorV1 extends Error {
  constructor(message: string) {
    super(`Studio artifact rejected: ${message}`);
    this.name = "StudioArtifactStoreValidationErrorV1";
  }
}

export class StudioArtifactNotFoundErrorV1 extends Error {
  constructor(ref: StudioArtifactRefV1) {
    super(`Studio artifact not found: ${ref.kind}:${ref.sha256}`);
    this.name = "StudioArtifactNotFoundErrorV1";
  }
}

/**
 * Deterministic, host-neutral JSON CAS for the first Studio vertical slice.
 *
 * The digest covers kind + media type + canonical content, preventing the same
 * bytes from being reinterpreted under a different artifact contract. Entries
 * are detached and deeply frozen before they become visible.
 */
export class InMemoryContentAddressedArtifactStoreV1
implements ArtifactStorePortV1 {
  private readonly entries = new Map<string, StoredJsonArtifactV1>();

  get entryCount(): number {
    return this.entries.size;
  }

  async putJson<TKind extends StudioArtifactKindV1>(
    write: StudioJsonWriteV1<TKind>,
  ): Promise<StudioArtifactRefV1<TKind>> {
    assertWriteV1(write);
    let envelope: StudioJsonObjectV1;
    try {
      envelope = cloneAndFreezeStudioJsonV1<StudioJsonObjectV1>({
        schemaId: STUDIO_JSON_BLOB_V1_SCHEMA_ID,
        kind: write.kind,
        mediaType: write.mediaType,
        content: write.content,
      });
    } catch (error) {
      throw new StudioArtifactStoreValidationErrorV1(errorMessageV1(error));
    }

    const canonicalEnvelope = studioCanonicalJsonStringifyV1(envelope);
    const sha256 = await sha256StudioJsonHexV1(envelope);
    const ref = Object.freeze({
      schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
      kind: write.kind,
      sha256,
      mediaType: write.mediaType,
      byteLength: new TextEncoder().encode(canonicalEnvelope).byteLength,
    }) satisfies StudioArtifactRefV1<TKind>;
    const existing = this.entries.get(sha256);
    if (existing !== undefined) {
      if (existing.canonicalEnvelope !== canonicalEnvelope) {
        throw new StudioArtifactStoreValidationErrorV1(
          "SHA-256 collision across unequal canonical envelopes",
        );
      }
      return existing.ref as StudioArtifactRefV1<TKind>;
    }

    const content = envelope.content;
    const stored = Object.freeze({
      ref,
      envelope,
      content,
      canonicalEnvelope,
    });
    this.entries.set(sha256, stored);
    return ref;
  }

  async readJson(
    ref: StudioArtifactRefV1,
  ): Promise<StudioJsonValueV1> {
    assertRefV1(ref);
    const stored = this.entries.get(ref.sha256);
    if (stored === undefined || !sameRefV1(stored.ref, ref)) {
      throw new StudioArtifactNotFoundErrorV1(ref);
    }
    return stored.content;
  }

  async has(ref: StudioArtifactRefV1): Promise<boolean> {
    assertRefV1(ref);
    const stored = this.entries.get(ref.sha256);
    return stored !== undefined && sameRefV1(stored.ref, ref);
  }
}

function assertWriteV1(
  write: StudioJsonWriteV1,
): void {
  if (write === null || typeof write !== "object") {
    throw new StudioArtifactStoreValidationErrorV1(
      "write command must be an object",
    );
  }
  if (!ARTIFACT_KINDS_V1.has(write.kind)) {
    throw new StudioArtifactStoreValidationErrorV1(
      `unsupported kind ${String(write.kind)}`,
    );
  }
  if (
    typeof write.mediaType !== "string"
    || write.mediaType.length === 0
    || write.mediaType.trim() !== write.mediaType
  ) {
    throw new StudioArtifactStoreValidationErrorV1(
      "mediaType must be a non-empty trimmed string",
    );
  }
}

function assertRefV1(ref: StudioArtifactRefV1): void {
  if (ref === null || typeof ref !== "object") {
    throw new StudioArtifactStoreValidationErrorV1(
      "artifact ref must be an object",
    );
  }
  if (ref.schemaId !== STUDIO_ARTIFACT_REF_V1_SCHEMA_ID) {
    throw new StudioArtifactStoreValidationErrorV1(
      "artifact ref schemaId mismatch",
    );
  }
  if (!ARTIFACT_KINDS_V1.has(ref.kind)) {
    throw new StudioArtifactStoreValidationErrorV1(
      `unsupported artifact ref kind ${String(ref.kind)}`,
    );
  }
  if (!SHA256_HEX_PATTERN_V1.test(ref.sha256)) {
    throw new StudioArtifactStoreValidationErrorV1(
      "artifact ref sha256 must be lowercase SHA-256 hex",
    );
  }
  if (
    typeof ref.mediaType !== "string"
    || ref.mediaType.length === 0
    || ref.mediaType.trim() !== ref.mediaType
  ) {
    throw new StudioArtifactStoreValidationErrorV1(
      "artifact ref mediaType is invalid",
    );
  }
  if (!Number.isSafeInteger(ref.byteLength) || ref.byteLength < 0) {
    throw new StudioArtifactStoreValidationErrorV1(
      "artifact ref byteLength must be a nonnegative safe integer",
    );
  }
}

function sameRefV1(
  left: StudioArtifactRefV1,
  right: StudioArtifactRefV1,
): boolean {
  return left.schemaId === right.schemaId
    && left.kind === right.kind
    && left.sha256 === right.sha256
    && left.mediaType === right.mediaType
    && left.byteLength === right.byteLength;
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
