import { createHash, randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2,
  type FivePatchPhysiologyEnvelopePlanPointV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2";
import {
  buildFivePatchPhysiologyEnvelopeResolvedRunV2,
  buildFivePatchPhysiologyEnvelopePlanV2,
  runFivePatchPhysiologyEnvelopeV2,
  selectFivePatchPhysiologyEnvelopeShardV2,
  type FivePatchPhysiologyEnvelopePlanSelectionV2,
  type FivePatchPhysiologyEnvelopeRunResultV2,
  type FivePatchPhysiologyEnvelopeShardV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeRunnerV2";
import {
  FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1,
  assertFivePatchEnvelopeImplementationManifestClosedV1,
} from "@/tools/mechanics2/runFivePatchModelEnvelopeV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_CLI_ID_V2 =
  "five-patch-physiology-envelope-cli-v2" as const;

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V2 =
  Object.freeze(Array.from(new Set([
    ...FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1,
    "data/mechanics2/protocols/five-patch-physiology-envelope-v2.json",
    "engine/mechanics2/diagnostics/FivePatchFillingRelaxationDiagnosticsV1.ts",
    "engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2.ts",
    "engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeParameterApplicationV2.ts",
    "engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeRunnerV2.ts",
  ])).sort());

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_HARNESS_SOURCE_PATHS_V2 =
  Object.freeze([
    "tools/mechanics2/runFivePatchModelEnvelopeV1.ts",
    "tools/mechanics2/runFivePatchPhysiologyEnvelopeV2.ts",
  ] as const);

export type FivePatchPhysiologyEnvelopeCliOptionsV2 = {
  readonly phase: FivePatchPhysiologyEnvelopePlanSelectionV2;
  readonly shard: FivePatchPhysiologyEnvelopeShardV2;
  readonly outputDirectory: string | null;
  readonly planOnly: boolean;
};

export type FivePatchPhysiologyEnvelopePersistedResultV2 =
  FivePatchPhysiologyEnvelopeRunResultV2 & {
    readonly artifact: {
      readonly protocolSemanticSha256: string;
      readonly implementationSha256: string;
      readonly harnessSha256: string;
      readonly implementationSourcePaths:
        typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V2;
      readonly harnessSourcePaths:
        typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_HARNESS_SOURCE_PATHS_V2;
      readonly requestSha256: string;
      readonly parameterIdentitySha256: string;
      readonly hashDefinition:
        "sha256-of-json-body-excluding-artifact.normalizedSha256";
      readonly normalizedSha256: string;
    };
  };

export type FivePatchPhysiologyEnvelopeRunSummaryV2 = {
  readonly ordinal: number;
  readonly runId: string;
  readonly status: FivePatchPhysiologyEnvelopeRunResultV2["status"];
  readonly stepsAccepted: number;
  readonly stepCount: number;
  readonly numericalEligibilityPassed: boolean;
  readonly periodicityStatus:
    FivePatchPhysiologyEnvelopeRunResultV2["periodicity"]["status"];
  readonly normalizedSha256: string;
};

export type FivePatchPhysiologyEnvelopeAssemblyManifestV2 = {
  readonly cliId: typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_CLI_ID_V2;
  readonly protocolId: typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.protocolId;
  readonly phase: FivePatchPhysiologyEnvelopePlanSelectionV2;
  readonly shard: FivePatchPhysiologyEnvelopeShardV2;
  readonly completePlanRunCount: number;
  readonly shardPlanRunCount: number;
  readonly executedRunCount: number;
  readonly orderedRunIds: readonly string[];
  readonly orderedArtifactSha256s: readonly string[];
  readonly protocolSemanticSha256: string;
  readonly assemblySha256: string;
};

export function parseFivePatchPhysiologyEnvelopeCliArgsV2(
  args: readonly string[],
): FivePatchPhysiologyEnvelopeCliOptionsV2 {
  let phase: FivePatchPhysiologyEnvelopePlanSelectionV2 | null = null;
  let shard: FivePatchPhysiologyEnvelopeShardV2 = {
    shardIndex: 0,
    shardCount: 1,
  };
  let outputDirectory: string | null = null;
  let planOnly = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    const value = args[index + 1];
    switch (argument) {
      case "--phase":
        phase = parsePhase(value);
        index += 1;
        break;
      case "--shard":
        shard = parseShard(value);
        index += 1;
        break;
      case "--output-dir":
        if (value == null || value.trim() === "") {
          throw new Error("--output-dir requires a non-empty path");
        }
        outputDirectory = resolve(value);
        index += 1;
        break;
      case "--plan-only":
        planOnly = true;
        break;
      case "--help":
      case "-h":
        throw new Error(usageText());
      default:
        throw new Error(`unknown argument: ${argument}\n${usageText()}`);
    }
  }
  if (phase == null) throw new Error(`--phase is required\n${usageText()}`);
  if (planOnly && outputDirectory != null) {
    throw new Error("--plan-only cannot be combined with --output-dir");
  }
  return Object.freeze({
    phase,
    shard: Object.freeze(shard),
    outputDirectory,
    planOnly,
  });
}

/**
 * Executes the immutable canonical shard in order. There is deliberately no
 * resume, skip-existing, retry, ranking, or adaptive stopping path.
 */
export function runFivePatchPhysiologyEnvelopeCliV2(
  args: readonly string[] = process.argv.slice(2),
  dependencies: {
    readonly executeRun?: typeof runFivePatchPhysiologyEnvelopeV2;
  } = {},
): readonly FivePatchPhysiologyEnvelopePersistedResultV2[] {
  const options = parseFivePatchPhysiologyEnvelopeCliArgsV2(args);
  const completePlan = buildFivePatchPhysiologyEnvelopePlanV2(options.phase);
  const shardPlan = selectFivePatchPhysiologyEnvelopeShardV2(
    completePlan,
    options.shard,
  );
  if (options.planOnly) {
    writeStdout({
      cliId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_CLI_ID_V2,
      mode: "plan-only",
      phase: options.phase,
      shard: options.shard,
      completePlanRunCount: completePlan.length,
      shardPlanRunCount: shardPlan.length,
      requests: shardPlan,
    });
    return Object.freeze([]);
  }

  const executeRun = dependencies.executeRun ??
    runFivePatchPhysiologyEnvelopeV2;
  // Full results are retained only for in-process callers without persistence.
  // Disk-backed envelope execution releases each raw-cycle payload before the
  // next coordinate and retains only compact hashes/summaries in memory.
  const retainedResults: FivePatchPhysiologyEnvelopePersistedResultV2[] = [];
  const artifactRecords: Array<{
    readonly runId: string;
    readonly normalizedSha256: string;
  }> = [];
  const summaries: FivePatchPhysiologyEnvelopeRunSummaryV2[] = [];
  for (let ordinal = 0; ordinal < shardPlan.length; ordinal += 1) {
    const result = withArtifact(shardPlan[ordinal]!, executeRun(
      shardPlan[ordinal]!,
    ));
    artifactRecords.push(Object.freeze({
      runId: result.runId,
      normalizedSha256: result.artifact.normalizedSha256,
    }));
    summaries.push(compactSummary(result, ordinal));
    if (options.outputDirectory != null) {
      writeJsonAtomically(
        resolve(options.outputDirectory, `${safeFileName(result.runId)}.json`),
        result,
      );
    } else {
      retainedResults.push(result);
    }
  }
  const manifest = buildManifest(
    options,
    completePlan,
    shardPlan,
    artifactRecords,
  );
  if (options.outputDirectory != null) {
    writeJsonAtomically(
      resolve(options.outputDirectory, "_assembly-manifest.json"),
      manifest,
    );
  }
  writeStdout({
    ...manifest,
    results: summaries,
  });
  return Object.freeze(retainedResults);
}

export function validateFivePatchPhysiologyEnvelopePersistedResultV2(
  value: unknown,
): FivePatchPhysiologyEnvelopePersistedResultV2 {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("V2 physiology-envelope artifact must be an object");
  }
  const result = value as FivePatchPhysiologyEnvelopePersistedResultV2;
  const { artifact, ...resultBody } = result;
  if (artifact == null || typeof artifact.normalizedSha256 !== "string") {
    throw new Error("V2 physiology-envelope artifact metadata is missing");
  }
  const { normalizedSha256: _hash, ...artifactWithoutHash } = artifact;
  const expected = sha256Json({
    ...resultBody,
    artifact: artifactWithoutHash,
  });
  if (expected !== artifact.normalizedSha256) {
    throw new Error("V2 physiology-envelope normalized hash mismatch");
  }
  if (
    artifact.protocolSemanticSha256 !==
      sha256Json(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2)
  ) {
    throw new Error("V2 physiology-envelope protocol hash mismatch");
  }
  const sourceIdentity = currentSourceIdentity();
  if (
    artifact.implementationSha256 !== sourceIdentity.implementationSha256 ||
    artifact.harnessSha256 !== sourceIdentity.harnessSha256 ||
    JSON.stringify(artifact.implementationSourcePaths) !== JSON.stringify(
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V2,
    ) ||
    JSON.stringify(artifact.harnessSourcePaths) !== JSON.stringify(
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_HARNESS_SOURCE_PATHS_V2,
    )
  ) {
    throw new Error("V2 physiology-envelope implementation provenance mismatch");
  }
  if (artifact.requestSha256 !== sha256Json(result.request)) {
    throw new Error("V2 physiology-envelope request hash mismatch");
  }
  if (
    artifact.parameterIdentitySha256 !==
      sha256Text(result.parameterIdentityCanonicalJson)
  ) {
    throw new Error("V2 physiology-envelope parameter identity hash mismatch");
  }
  const resolved = buildFivePatchPhysiologyEnvelopeResolvedRunV2(
    result.request,
  );
  if (result.runId !== resolved.runId) {
    throw new Error("V2 physiology-envelope run ID is not canonical");
  }
  if (
    result.parameterIdentityCanonicalJson !==
      resolved.parameterIdentityCanonicalJson
  ) {
    throw new Error("V2 physiology-envelope effective parameters are not canonical");
  }
  if (
    JSON.stringify(result.initialVolumeOverridesMl) !==
      JSON.stringify(resolved.scenarioConfig.initialVolumeOverridesMl)
  ) {
    throw new Error("V2 physiology-envelope initial volumes are not canonical");
  }
  return result;
}

export function validateFivePatchPhysiologyEnvelopeAssemblyManifestV2(
  value: unknown,
): FivePatchPhysiologyEnvelopeAssemblyManifestV2 {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("V2 physiology-envelope assembly manifest must be an object");
  }
  const manifest = value as FivePatchPhysiologyEnvelopeAssemblyManifestV2;
  const { assemblySha256, ...body } = manifest;
  if (
    typeof assemblySha256 !== "string" ||
    assemblySha256 !== sha256Json(body)
  ) {
    throw new Error("V2 physiology-envelope assembly hash mismatch");
  }
  if (
    manifest.cliId !== FIVE_PATCH_PHYSIOLOGY_ENVELOPE_CLI_ID_V2 ||
    manifest.protocolId !== FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.protocolId ||
    manifest.protocolSemanticSha256 !==
      sha256Json(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2)
  ) {
    throw new Error("V2 physiology-envelope assembly identity mismatch");
  }
  if (
    ![
      "arm-numerical-readiness",
      "screening",
      "stress-validation",
      "dt-refinement",
      "full",
    ].includes(manifest.phase) ||
    !Number.isInteger(manifest.shard?.shardIndex) ||
    !Number.isInteger(manifest.shard?.shardCount) ||
    manifest.shard.shardCount < 1 ||
    manifest.shard.shardIndex < 0 ||
    manifest.shard.shardIndex >= manifest.shard.shardCount ||
    !Number.isInteger(manifest.completePlanRunCount) ||
    !Number.isInteger(manifest.shardPlanRunCount) ||
    !Number.isInteger(manifest.executedRunCount) ||
    manifest.completePlanRunCount < 0 ||
    manifest.shardPlanRunCount < 0 ||
    manifest.executedRunCount < 0 ||
    manifest.shardPlanRunCount > manifest.completePlanRunCount ||
    manifest.executedRunCount !== manifest.shardPlanRunCount ||
    !Array.isArray(manifest.orderedRunIds) ||
    !Array.isArray(manifest.orderedArtifactSha256s) ||
    manifest.orderedRunIds.length !== manifest.executedRunCount ||
    manifest.orderedArtifactSha256s.length !== manifest.executedRunCount ||
    manifest.orderedRunIds.some((id) => typeof id !== "string") ||
    manifest.orderedArtifactSha256s.some((hash) =>
      typeof hash !== "string" || !/^[0-9a-f]{64}$/.test(hash)
    )
  ) {
    throw new Error("V2 physiology-envelope assembly structure mismatch");
  }
  return manifest;
}

function withArtifact(
  request: FivePatchPhysiologyEnvelopePlanPointV2,
  result: FivePatchPhysiologyEnvelopeRunResultV2,
): FivePatchPhysiologyEnvelopePersistedResultV2 {
  if (JSON.stringify(request) !== JSON.stringify(result.request)) {
    throw new Error("executor returned a result for different coordinates");
  }
  const artifactWithoutHash = Object.freeze({
    protocolSemanticSha256:
      sha256Json(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2),
    ...currentSourceIdentity(),
    implementationSourcePaths:
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V2,
    harnessSourcePaths:
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_HARNESS_SOURCE_PATHS_V2,
    requestSha256: sha256Json(result.request),
    parameterIdentitySha256:
      sha256Text(result.parameterIdentityCanonicalJson),
    hashDefinition:
      "sha256-of-json-body-excluding-artifact.normalizedSha256" as const,
  });
  const body = Object.freeze({
    ...result,
    artifact: artifactWithoutHash,
  });
  return Object.freeze({
    ...result,
    artifact: Object.freeze({
      ...artifactWithoutHash,
      normalizedSha256: sha256Json(body),
    }),
  });
}

function buildManifest(
  options: FivePatchPhysiologyEnvelopeCliOptionsV2,
  completePlan: readonly FivePatchPhysiologyEnvelopePlanPointV2[],
  shardPlan: readonly FivePatchPhysiologyEnvelopePlanPointV2[],
  artifacts: readonly {
    readonly runId: string;
    readonly normalizedSha256: string;
  }[],
): FivePatchPhysiologyEnvelopeAssemblyManifestV2 {
  const body = Object.freeze({
    cliId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_CLI_ID_V2,
    protocolId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.protocolId,
    phase: options.phase,
    shard: options.shard,
    completePlanRunCount: completePlan.length,
    shardPlanRunCount: shardPlan.length,
    executedRunCount: artifacts.length,
    orderedRunIds: Object.freeze(artifacts.map((artifact) => artifact.runId)),
    orderedArtifactSha256s: Object.freeze(
      artifacts.map((artifact) => artifact.normalizedSha256),
    ),
    protocolSemanticSha256:
      sha256Json(FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2),
  });
  return Object.freeze({
    ...body,
    assemblySha256: sha256Json(body),
  });
}

function compactSummary(
  result: FivePatchPhysiologyEnvelopePersistedResultV2,
  ordinal: number,
): FivePatchPhysiologyEnvelopeRunSummaryV2 {
  return Object.freeze({
    ordinal,
    runId: result.runId,
    status: result.status,
    stepsAccepted: result.stepsAccepted,
    stepCount: result.stepCount,
    numericalEligibilityPassed: result.numericalEligibility.passed,
    periodicityStatus: result.periodicity.status,
    normalizedSha256: result.artifact.normalizedSha256,
  });
}

function parsePhase(
  value: string | undefined,
): FivePatchPhysiologyEnvelopePlanSelectionV2 {
  if (
    value === "arm-numerical-readiness" ||
    value === "screening" ||
    value === "stress-validation" ||
    value === "dt-refinement" ||
    value === "full"
  ) return value;
  throw new Error(`invalid --phase: ${String(value)}`);
}

function parseShard(value: string | undefined): FivePatchPhysiologyEnvelopeShardV2 {
  const match = /^(\d+)\/(\d+)$/.exec(value ?? "");
  if (match == null) throw new Error("--shard must use zero-based i/n syntax");
  const shardIndex = Number(match[1]);
  const shardCount = Number(match[2]);
  if (shardCount < 1 || shardIndex < 0 || shardIndex >= shardCount) {
    throw new Error("--shard must satisfy 0 <= i < n");
  }
  return Object.freeze({ shardIndex, shardCount });
}

function safeFileName(runId: string): string {
  return runId.replace(/[^A-Za-z0-9._-]+/g, "_");
}

function writeJsonAtomically(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function sha256Json(value: unknown): string {
  return sha256Text(JSON.stringify(value));
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

let cachedSourceIdentity: {
  readonly implementationSha256: string;
  readonly harnessSha256: string;
} | null = null;

function currentSourceIdentity(): {
  readonly implementationSha256: string;
  readonly harnessSha256: string;
} {
  if (cachedSourceIdentity != null) return cachedSourceIdentity;
  assertFivePatchEnvelopeImplementationManifestClosedV1(
    [
      ...FIVE_PATCH_PHYSIOLOGY_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V2,
      ...FIVE_PATCH_PHYSIOLOGY_ENVELOPE_HARNESS_SOURCE_PATHS_V2,
    ],
  );
  cachedSourceIdentity = Object.freeze({
    implementationSha256: hashSourceManifest(
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V2,
    ),
    harnessSha256: hashSourceManifest(
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_HARNESS_SOURCE_PATHS_V2,
    ),
  });
  return cachedSourceIdentity;
}

function hashSourceManifest(paths: readonly string[]): string {
  const hash = createHash("sha256");
  for (const path of [...paths].sort()) {
    hash.update(path, "utf8");
    hash.update("\0", "utf8");
    hash.update(readFileSync(resolve(repoRoot, path)));
    hash.update("\0", "utf8");
  }
  return hash.digest("hex");
}

function writeStdout(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usageText(): string {
  return [
    "Usage:",
    "  --phase arm-numerical-readiness|screening|stress-validation|dt-refinement|full",
    "  [--shard zeroBasedIndex/shardCount] [--output-dir PATH] [--plan-only]",
    "",
    "The plan is immutable. There is no retry, resume, winner score, local optimizer,",
    "adaptive stopping, or V-loop-based selection path.",
  ].join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runFivePatchPhysiologyEnvelopeCliV2();
}
