import {
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
  type RuntimeExecutionIdentityV1,
  type StudioArtifactKindV1,
  type StudioArtifactRefV1,
  type StudioRunArtifactContentV1,
} from "@/studio/contracts/v1";

export class StudioRunArtifactContentValidationErrorV1 extends Error {
  constructor(message: string) {
    super(`Studio run artifact rejected: ${message}`);
    this.name = "StudioRunArtifactContentValidationErrorV1";
  }
}

/**
 * Strict loader shared by runtime, replay and side-analysis boundaries.
 * Artifact-store JSON is always treated as an untrusted DTO.
 */
export function loadStudioRunArtifactContentV1(
  value: unknown,
): StudioRunArtifactContentV1 {
  const content = recordV1(value, "source run artifact");
  assertExactKeysV1(content, [
    "schemaId",
    "sourceRunRef",
    "simulationInputRef",
    "targetInputSha256",
    "snapshotRef",
    "execution",
    "claims",
  ], "source run artifact");
  if (content.schemaId !== STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID) {
    throw validationErrorV1("source run artifact schema mismatch");
  }
  const sourceRunRef = loadArtifactRefV1(
    content.sourceRunRef,
    "run-artifact",
    "sourceRunRef",
  );
  const simulationInputRef = loadArtifactRefV1(
    content.simulationInputRef,
    "simulation-input",
    "simulationInputRef",
  );
  const snapshotRef = loadArtifactRefV1(
    content.snapshotRef,
    "snapshot-envelope",
    "snapshotRef",
  );
  if (
    typeof content.targetInputSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(content.targetInputSha256)
  ) throw validationErrorV1("source run target identity is invalid");
  const execution = loadExecutionIdentityV1(content.execution);
  const claims = recordV1(content.claims, "source run claims");
  assertExactKeysV1(claims, [
    "steadyStatus",
    "numericalHealth",
    "snapshotIsWarmRestartable",
    "canonicalSignalSamplesStored",
    "canonicalWindowMetricsStored",
  ], "source run claims");
  if (
    claims.steadyStatus !== "converged"
    || claims.numericalHealth !== "passed"
    || claims.snapshotIsWarmRestartable !== true
    || claims.canonicalSignalSamplesStored !== false
    || claims.canonicalWindowMetricsStored !== false
  ) throw validationErrorV1("source run claims mismatch");
  return Object.freeze({
    schemaId: STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
    sourceRunRef,
    simulationInputRef,
    targetInputSha256: content.targetInputSha256,
    snapshotRef,
    execution,
    claims: Object.freeze({
      steadyStatus: "converged",
      numericalHealth: "passed",
      snapshotIsWarmRestartable: true,
      canonicalSignalSamplesStored: false,
      canonicalWindowMetricsStored: false,
    }),
  });
}

function loadExecutionIdentityV1(
  value: unknown,
): RuntimeExecutionIdentityV1 {
  const execution = recordV1(value, "source run execution");
  assertExactKeysV1(execution, [
    "modelRef",
    "runtimeRef",
    "solverRef",
    "stateCodecRef",
    "protocolRef",
  ], "source run execution");
  if (
    Object.values(execution).some((entry) =>
      typeof entry !== "string" || entry.trim().length === 0
    )
  ) throw validationErrorV1("source run execution identity is invalid");
  return Object.freeze({
    modelRef: execution.modelRef as string,
    runtimeRef: execution.runtimeRef as string,
    solverRef: execution.solverRef as string,
    stateCodecRef: execution.stateCodecRef as string,
    protocolRef: execution.protocolRef as string,
  });
}

function loadArtifactRefV1<TKind extends StudioArtifactKindV1>(
  value: unknown,
  expectedKind: TKind,
  path: string,
): StudioArtifactRefV1<TKind> {
  const ref = recordV1(value, path);
  assertExactKeysV1(ref, [
    "schemaId",
    "kind",
    "sha256",
    "mediaType",
    "byteLength",
  ], path);
  if (
    ref.schemaId !== STUDIO_ARTIFACT_REF_V1_SCHEMA_ID
    || ref.kind !== expectedKind
    || typeof ref.sha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(ref.sha256)
    || typeof ref.mediaType !== "string"
    || ref.mediaType.trim().length === 0
    || !Number.isSafeInteger(ref.byteLength)
    || (ref.byteLength as number) < 0
  ) throw validationErrorV1(`${path} is invalid`);
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind: expectedKind,
    sha256: ref.sha256,
    mediaType: ref.mediaType,
    byteLength: ref.byteLength as number,
  });
}

function recordV1(
  value: unknown,
  path: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw validationErrorV1(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeysV1(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) throw validationErrorV1(`${path} field set mismatch`);
}

function validationErrorV1(
  message: string,
): StudioRunArtifactContentValidationErrorV1 {
  return new StudioRunArtifactContentValidationErrorV1(message);
}
