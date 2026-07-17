import {
  cloneAndFreezeCanonicalJson,
  type CanonicalJsonObject,
} from "@/engine/scientific/release/canonicalJson";
import {
  SHA256_HEX_PATTERN,
} from "@/engine/scientific/release/sha256";
import {
  simulationReleaseRefIssuesV1,
  type SimulationReleaseRefV1,
} from "@/engine/scientific/release/simulationRelease";

export const BUILD_ARTIFACT_REF_V1_SCHEMA_ID =
  "circleheart-build-artifact-ref-v1" as const;

export const BUILD_ARTIFACT_GIT_WORKTREE_STATUS_VALUES_V1 = Object.freeze([
  "clean",
  "dirty",
] as const);
export type BuildArtifactGitWorktreeStatusV1 =
  (typeof BUILD_ARTIFACT_GIT_WORKTREE_STATUS_VALUES_V1)[number];

export type BuildArtifactNumericalRuntimeAbiRefV1 = Readonly<{
  id: string;
  version: string;
}>;

export type BuildArtifactSourceRefV1 = Readonly<{
  repository: string;
  gitCommitSha: string;
  gitTreeSha: string;
  gitWorktreeStatus: BuildArtifactGitWorktreeStatusV1;
}>;

/**
 * Exact executable provenance. Every source/build field is supplied by the
 * caller or CI; this host-neutral loader never probes Git or the environment.
 */
export type BuildArtifactRefV1 = Readonly<{
  schemaId: typeof BUILD_ARTIFACT_REF_V1_SCHEMA_ID;
  simulationReleaseRef: SimulationReleaseRefV1;
  numericalRuntimeAbi: BuildArtifactNumericalRuntimeAbiRefV1;
  source: BuildArtifactSourceRefV1;
  artifactSha256: string;
}>;

export class BuildArtifactRefValidationErrorV1 extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutableIssues = Object.freeze([...issues]);
    super(`build artifact ref rejected: ${immutableIssues.join("; ")}`);
    this.name = "BuildArtifactRefValidationErrorV1";
    this.issues = immutableIssues;
  }
}

/** Validates, detaches, and recursively freezes caller/CI-supplied values. */
export function loadBuildArtifactRefV1(value: unknown): BuildArtifactRefV1 {
  let safe: CanonicalJsonObject;
  try {
    safe = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new BuildArtifactRefValidationErrorV1([
      error instanceof Error
        ? error.message
        : "build artifact ref is not canonical JSON data",
    ]);
  }
  const issues = buildArtifactRefIssuesV1(safe);
  if (issues.length > 0) throw new BuildArtifactRefValidationErrorV1(issues);
  return safe as unknown as BuildArtifactRefV1;
}

export function buildArtifactRefIssuesV1(value: unknown): readonly string[] {
  const issues = exactObjectIssues(value, [
    "schemaId",
    "simulationReleaseRef",
    "numericalRuntimeAbi",
    "source",
    "artifactSha256",
  ], "buildArtifactRef");
  if (!isRecord(value)) return Object.freeze(issues);

  if (value.schemaId !== BUILD_ARTIFACT_REF_V1_SCHEMA_ID) {
    issues.push(
      `buildArtifactRef.schemaId must be ${BUILD_ARTIFACT_REF_V1_SCHEMA_ID}`,
    );
  }
  issues.push(...simulationReleaseRefIssuesV1(value.simulationReleaseRef)
    .map((issue) => `buildArtifactRef.simulationReleaseRef.${stripRefPath(issue)}`));
  issues.push(...numericalRuntimeAbiIssues(value.numericalRuntimeAbi));
  issues.push(...sourceRefIssues(value.source));
  validateSha256(
    value.artifactSha256,
    "buildArtifactRef.artifactSha256",
    issues,
  );
  return Object.freeze(issues);
}

function numericalRuntimeAbiIssues(value: unknown): string[] {
  const path = "buildArtifactRef.numericalRuntimeAbi";
  const issues = exactObjectIssues(value, ["id", "version"], path);
  if (!isRecord(value)) return issues;
  validatePortableId(value.id, `${path}.id`, issues);
  validateSemver(value.version, `${path}.version`, issues);
  return issues;
}

function sourceRefIssues(value: unknown): string[] {
  const path = "buildArtifactRef.source";
  const issues = exactObjectIssues(value, [
    "repository",
    "gitCommitSha",
    "gitTreeSha",
    "gitWorktreeStatus",
  ], path);
  if (!isRecord(value)) return issues;
  if (
    typeof value.repository !== "string"
    || value.repository.length === 0
    || value.repository.trim() !== value.repository
  ) {
    issues.push(`${path}.repository must be a non-empty trimmed string`);
  }
  validateGitObjectSha(value.gitCommitSha, `${path}.gitCommitSha`, issues);
  validateGitObjectSha(value.gitTreeSha, `${path}.gitTreeSha`, issues);
  if (!BUILD_ARTIFACT_GIT_WORKTREE_STATUS_VALUES_V1.includes(
    value.gitWorktreeStatus as BuildArtifactGitWorktreeStatusV1,
  )) {
    issues.push(`${path}.gitWorktreeStatus must be clean or dirty`);
  }
  return issues;
}

function validateGitObjectSha(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value !== "string" || !GIT_OBJECT_SHA_PATTERN.test(value)) {
    issues.push(`${path} must be a full lowercase 40- or 64-character Git object SHA`);
  }
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

function stripRefPath(issue: string): string {
  return issue.startsWith("ref.") ? issue.slice("ref.".length) : issue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const GIT_OBJECT_SHA_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
