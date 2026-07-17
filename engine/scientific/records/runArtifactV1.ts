import {
  buildArtifactRefIssuesV1,
  type BuildArtifactRefV1,
} from "@/engine/scientific/records/buildArtifactRefV1";
import {
  cloneAndFreezeCanonicalJson,
  type CanonicalJsonArray,
  type CanonicalJsonObject,
  type CanonicalJsonValue,
} from "@/engine/scientific/release/canonicalJson";
import {
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release/sha256";

export const RUN_ARTIFACT_REF_V1_SCHEMA_ID =
  "circleheart-run-artifact-ref-v1" as const;
export const RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID =
  "circleheart-run-artifact-content-v1" as const;

export type RunArtifactRefV1 = Readonly<{
  schemaId: typeof RUN_ARTIFACT_REF_V1_SCHEMA_ID;
  sha256: string;
}>;

export type RunArtifactCanonicalInitializationIdentityV1 = Readonly<{
  kind: "canonical-initialization";
  protocolId: string;
  protocolVersion: string;
}>;

export type RunArtifactExactCheckpointIdentityV1 = Readonly<{
  kind: "exact-checkpoint";
  checkpointSha256: string;
}>;

export type RunArtifactInitializationIdentityV1 =
  | RunArtifactCanonicalInitializationIdentityV1
  | RunArtifactExactCheckpointIdentityV1;

export type RunArtifactContentV1 = Readonly<{
  schemaId: typeof RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID;
  buildArtifactRef: BuildArtifactRefV1;
  protocolDescriptor: CanonicalJsonObject;
  initializationIdentity: RunArtifactInitializationIdentityV1;
  executionLedger: CanonicalJsonArray;
  outputs: CanonicalJsonValue;
  audits: CanonicalJsonValue;
}>;

export type RunArtifactV1 = Readonly<{
  ref: RunArtifactRefV1;
  content: RunArtifactContentV1;
}>;

export type RunArtifactContentInputV1 = Readonly<{
  buildArtifactRef: BuildArtifactRefV1;
  protocolDescriptor: CanonicalJsonObject;
  initializationIdentity: RunArtifactInitializationIdentityV1;
  executionLedger: CanonicalJsonArray;
  outputs: CanonicalJsonValue;
  audits: CanonicalJsonValue;
}>;

export class RunArtifactValidationErrorV1 extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutableIssues = Object.freeze([...issues]);
    super(`run artifact rejected: ${immutableIssues.join("; ")}`);
    this.name = "RunArtifactValidationErrorV1";
    this.issues = immutableIssues;
  }
}

/**
 * Creates content-addressed run provenance. The only generated field is the
 * SHA-256 of caller-supplied canonical content; no clock, random source, Git,
 * host, or environment value is consulted.
 */
export async function createRunArtifactV1(
  input: RunArtifactContentInputV1,
): Promise<RunArtifactV1> {
  let safeInput: CanonicalJsonObject;
  try {
    safeInput = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(input);
  } catch (error) {
    throw new RunArtifactValidationErrorV1([
      error instanceof Error
        ? error.message
        : "run artifact input is not canonical JSON data",
    ]);
  }
  const inputIssues = exactObjectIssues(safeInput, [
    "buildArtifactRef",
    "protocolDescriptor",
    "initializationIdentity",
    "executionLedger",
    "outputs",
    "audits",
  ], "run artifact input");
  if (inputIssues.length > 0) {
    throw new RunArtifactValidationErrorV1(inputIssues);
  }

  const content = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId: RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
    buildArtifactRef: safeInput.buildArtifactRef,
    protocolDescriptor: safeInput.protocolDescriptor,
    initializationIdentity: safeInput.initializationIdentity,
    executionLedger: safeInput.executionLedger,
    outputs: safeInput.outputs,
    audits: safeInput.audits,
  });
  const issues = runArtifactContentIssuesV1(content);
  if (issues.length > 0) throw new RunArtifactValidationErrorV1(issues);

  const typedContent = content as unknown as RunArtifactContentV1;
  const ref = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    schemaId: RUN_ARTIFACT_REF_V1_SCHEMA_ID,
    sha256: await sha256CanonicalJsonHex(typedContent),
  });
  return cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ref,
    content: typedContent,
  }) as unknown as RunArtifactV1;
}

/** Validates content identity, detaches, and recursively freezes persisted data. */
export async function loadRunArtifactV1(value: unknown): Promise<RunArtifactV1> {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new RunArtifactValidationErrorV1([
      error instanceof Error
        ? error.message
        : "run artifact is not canonical JSON data",
    ]);
  }

  const issues = exactObjectIssues(safe, ["ref", "content"], "runArtifact");
  issues.push(...runArtifactRefIssuesV1(safe.ref));
  issues.push(...runArtifactContentIssuesV1(safe.content));
  if (issues.length > 0) throw new RunArtifactValidationErrorV1(issues);

  const typedRef = safe.ref as unknown as RunArtifactRefV1;
  const typedContent = safe.content as unknown as RunArtifactContentV1;
  const expected = await sha256CanonicalJsonHex(typedContent);
  if (typedRef.sha256 !== expected) {
    throw new RunArtifactValidationErrorV1([
      "runArtifact.ref.sha256 does not match the canonical content digest",
    ]);
  }
  return safe as unknown as RunArtifactV1;
}

export function runArtifactRefIssuesV1(value: unknown): readonly string[] {
  const path = "runArtifact.ref";
  const issues = exactObjectIssues(value, ["schemaId", "sha256"], path);
  if (!isRecord(value)) return Object.freeze(issues);
  if (value.schemaId !== RUN_ARTIFACT_REF_V1_SCHEMA_ID) {
    issues.push(`${path}.schemaId must be ${RUN_ARTIFACT_REF_V1_SCHEMA_ID}`);
  }
  validateSha256(value.sha256, `${path}.sha256`, issues);
  return Object.freeze(issues);
}

export function runArtifactContentIssuesV1(value: unknown): readonly string[] {
  const path = "runArtifact.content";
  const issues = exactObjectIssues(value, [
    "schemaId",
    "buildArtifactRef",
    "protocolDescriptor",
    "initializationIdentity",
    "executionLedger",
    "outputs",
    "audits",
  ], path);
  if (!isRecord(value)) return Object.freeze(issues);
  if (value.schemaId !== RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID) {
    issues.push(`${path}.schemaId must be ${RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID}`);
  }
  issues.push(...buildArtifactRefIssuesV1(value.buildArtifactRef)
    .map((issue) => `${path}.${issue}`));
  if (!isRecord(value.protocolDescriptor)) {
    issues.push(`${path}.protocolDescriptor must be a canonical JSON object`);
  }
  issues.push(...initializationIdentityIssues(value.initializationIdentity));
  if (!Array.isArray(value.executionLedger)) {
    issues.push(`${path}.executionLedger must be a canonical JSON array`);
  }
  return Object.freeze(issues);
}

function initializationIdentityIssues(value: unknown): string[] {
  const path = "runArtifact.content.initializationIdentity";
  if (!isRecord(value)) return [`${path} must be an object`];
  if (value.kind === "canonical-initialization") {
    const issues = exactObjectIssues(value, [
      "kind", "protocolId", "protocolVersion",
    ], path);
    validatePortableId(value.protocolId, `${path}.protocolId`, issues);
    validateSemver(value.protocolVersion, `${path}.protocolVersion`, issues);
    return issues;
  }
  if (value.kind === "exact-checkpoint") {
    const issues = exactObjectIssues(value, [
      "kind", "checkpointSha256",
    ], path);
    validateSha256(value.checkpointSha256, `${path}.checkpointSha256`, issues);
    return issues;
  }
  return [`${path}.kind is unsupported`];
}

function validateSha256(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN.test(value)) {
    issues.push(`${path} must be a lowercase 64-character SHA-256 hex digest`);
  }
}

function validatePortableId(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (
    typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value)
  ) {
    issues.push(`${path} must be a non-empty portable identifier`);
  }
}

function validateSemver(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value !== "string" || !SEMVER_PATTERN.test(value)) {
    issues.push(`${path} must be an exact semantic version`);
  }
}

function exactObjectIssues(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  const expected = new Set(expectedKeys);
  const issues: string[] = [];
  for (const key of expectedKeys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      issues.push(`${path}.${key} is required`);
    }
  }
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) issues.push(`${path}.${key} is not allowed`);
  }
  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
