import {
  assertPortableModelIdentifierV2,
} from "./model";
import type {
  ExactModelKernelManifestV3,
  ModelSurfaceReleaseManifestV1,
} from "./modelSurface";
import {
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
  composeStandardModelContractV1,
} from "./modelSurface";

export const STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID =
  "circleheart-studio-model-worker-release-ticket-v2" as const;

/**
 * Artifact entry-point contract. It is loader metadata, not model identity.
 * One scientific `modelId` may have multiple byte-exact implementation
 * revisions. Changing admitted numerical behaviour still requires a new
 * immutable `modelId`.
 */
/** Exports createCircleHeartExactModelReleaseV1 -> manifest + executables. */
export type RegisteredModelModuleAbiV2 = "circleheart-exact-model-esm-v1";

export type StudioStandardModelWorkerReleaseTicketV2 = Readonly<{
  schemaId: typeof STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID;
  modelId: string;
  analysisProfileId: string;
  artifactRevisionId: string;
  manifest: ExactModelKernelManifestV3;
  surfaceRelease: ModelSurfaceReleaseManifestV1;
  moduleAbi: "circleheart-exact-model-esm-v1";
  artifactUrl: string;
}>;

export type StudioModelWorkerReleaseTicketV2 =
  StudioStandardModelWorkerReleaseTicketV2;

export class StudioModelReleaseValidationErrorV2 extends Error {
  constructor(path: string, message: string) {
    super(`Studio model release V2 rejected ${path}: ${message}`);
    this.name = "StudioModelReleaseValidationErrorV2";
  }
}

/** Owns one registry response before it crosses the Worker boundary. */
export function validateStudioModelWorkerReleaseTicketV2(
  value: unknown,
): StudioModelWorkerReleaseTicketV2 {
  const envelope = plainRecordV2(value, "$");
  const moduleAbi = validateRegisteredModelModuleAbiV2(
    envelope.moduleAbi,
    "$.moduleAbi",
  );
  const record = exactPlainRecordV2(value, [
    "analysisProfileId",
    "artifactRevisionId",
    "artifactUrl",
    "manifest",
    "modelId",
    "moduleAbi",
    "schemaId",
    "surfaceRelease",
  ], "$");
  if (record.schemaId !== STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID) {
    throw new StudioModelReleaseValidationErrorV2(
      "$.schemaId",
      "schema identity mismatch",
    );
  }
  assertPortableModelIdentifierV2(record.modelId, "$.modelId");
  assertPortableModelIdentifierV2(
    record.analysisProfileId,
    "$.analysisProfileId",
  );
  if (
    typeof record.artifactRevisionId !== "string"
    || !/^[0-9a-f]{64}$/.test(record.artifactRevisionId)
  ) {
    throw new StudioModelReleaseValidationErrorV2(
      "$.artifactRevisionId",
      "must be a lowercase SHA-256 implementation revision",
    );
  }
  const artifactUrl = validateArtifactUrlV2(
    record.artifactUrl,
    "$.artifactUrl",
  );
  assertExactModelKernelManifestV3(record.manifest);
  assertModelSurfaceReleaseManifestV1(record.surfaceRelease);
  if (record.manifest.modelId !== record.modelId) {
    throw new StudioModelReleaseValidationErrorV2(
      "$.manifest.modelId",
      "must match the release ticket modelId",
    );
  }
  // The ticket pins one immutable, compatible Surface. Recompose at every
  // trust boundary so a caller cannot smuggle a mismatched presentation
  // contract beside an otherwise valid numerical kernel.
  composeStandardModelContractV1(record.manifest, record.surfaceRelease);
  return Object.freeze({
    schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
    modelId: record.modelId,
    analysisProfileId: record.analysisProfileId,
    artifactRevisionId: record.artifactRevisionId,
    manifest: ownPortableValueV2(record.manifest),
    surfaceRelease: ownPortableValueV2(record.surfaceRelease),
    moduleAbi,
    artifactUrl,
  });
}

export function validateRegisteredModelModuleAbiV2(
  value: unknown,
  path = "$.moduleAbi",
): RegisteredModelModuleAbiV2 {
  if (value !== "circleheart-exact-model-esm-v1") {
    throw new StudioModelReleaseValidationErrorV2(
      path,
      "unsupported exact-model module ABI",
    );
  }
  return value;
}

function validateArtifactUrlV2(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    throw new StudioModelReleaseValidationErrorV2(
      path,
      "must be a nonempty absolute URL",
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new StudioModelReleaseValidationErrorV2(
      path,
      "must be an absolute URL",
    );
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    throw new StudioModelReleaseValidationErrorV2(
      path,
      "must not contain credentials",
    );
  }
  if (
    parsed.protocol !== "https:"
    && !(parsed.protocol === "http:" && isLoopbackHostV2(parsed.hostname))
  ) {
    throw new StudioModelReleaseValidationErrorV2(
      path,
      "must use HTTPS (or local loopback HTTP)",
    );
  }
  return parsed.href;
}

function exactPlainRecordV2(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): Record<string, unknown> {
  const record = plainRecordV2(value, path);
  const actualKeys = Object.keys(record).sort();
  const sortedExpected = [...expectedKeys].sort();
  if (
    actualKeys.length !== sortedExpected.length
    || actualKeys.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new StudioModelReleaseValidationErrorV2(
      path,
      `keys must be exactly ${sortedExpected.join(", ")}`,
    );
  }
  return record;
}

function plainRecordV2(
  value: unknown,
  path: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) {
    throw new StudioModelReleaseValidationErrorV2(path, "must be a plain object");
  }
  return value as Record<string, unknown>;
}

function isLoopbackHostV2(hostname: string): boolean {
  return hostname === "127.0.0.1"
    || hostname === "localhost"
    || hostname === "[::1]";
}

function ownPortableValueV2<TValue>(value: TValue): TValue {
  return deepFreezeV2(
    JSON.parse(JSON.stringify(value)) as TValue,
  );
}

function deepFreezeV2<TValue>(value: TValue): TValue {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeV2(child);
    }
    Object.freeze(value);
  }
  return value;
}
