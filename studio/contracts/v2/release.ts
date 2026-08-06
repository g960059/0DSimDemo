import type {
  RegisteredModelPackageManifestV2,
} from "./model";
import {
  assertPortableModelIdentifierV2,
  assertRegisteredModelPackageManifestV2,
} from "./model";

export const STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID =
  "circleheart-studio-model-worker-release-ticket-v2" as const;

/**
 * Artifact entry-point contract. It is loader metadata, not model identity.
 * Changing executable behaviour still requires a new immutable `modelId`.
 */
export type RegisteredModelModuleAbiV2 =
  | "legacy-main-wire-v3-development-36"
  /** Exports createCircleHeartExactModelReleaseV1 -> manifest + executables. */
  | "circleheart-exact-model-esm-v1";

export type StudioModelWorkerReleaseTicketV2 = Readonly<{
  schemaId: typeof STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID;
  modelId: string;
  manifest: RegisteredModelPackageManifestV2;
  moduleAbi: RegisteredModelModuleAbiV2;
  artifactUrl: string;
}>;

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
  const record = exactPlainRecordV2(value, [
    "artifactUrl",
    "manifest",
    "modelId",
    "moduleAbi",
    "schemaId",
  ], "$");
  if (record.schemaId !== STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID) {
    throw new StudioModelReleaseValidationErrorV2(
      "$.schemaId",
      "schema identity mismatch",
    );
  }
  assertPortableModelIdentifierV2(record.modelId, "$.modelId");
  assertRegisteredModelPackageManifestV2(record.manifest);
  if (record.manifest.modelId !== record.modelId) {
    throw new StudioModelReleaseValidationErrorV2(
      "$.manifest.modelId",
      "must match the release ticket modelId",
    );
  }
  const moduleAbi = validateRegisteredModelModuleAbiV2(
    record.moduleAbi,
    "$.moduleAbi",
  );
  const artifactUrl = validateArtifactUrlV2(
    record.artifactUrl,
    "$.artifactUrl",
  );
  return Object.freeze({
    schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
    modelId: record.modelId,
    manifest: ownPortableManifestV2(record.manifest),
    moduleAbi,
    artifactUrl,
  });
}

export function validateRegisteredModelModuleAbiV2(
  value: unknown,
  path = "$.moduleAbi",
): RegisteredModelModuleAbiV2 {
  if (
    value !== "legacy-main-wire-v3-development-36"
    && value !== "circleheart-exact-model-esm-v1"
  ) {
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
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) {
    throw new StudioModelReleaseValidationErrorV2(path, "must be a plain object");
  }
  const actualKeys = Object.keys(value).sort();
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
  return value as Record<string, unknown>;
}

function isLoopbackHostV2(hostname: string): boolean {
  return hostname === "127.0.0.1"
    || hostname === "localhost"
    || hostname === "[::1]";
}

function ownPortableManifestV2(
  value: RegisteredModelPackageManifestV2,
): RegisteredModelPackageManifestV2 {
  return deepFreezeV2(
    JSON.parse(JSON.stringify(value)) as RegisteredModelPackageManifestV2,
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
