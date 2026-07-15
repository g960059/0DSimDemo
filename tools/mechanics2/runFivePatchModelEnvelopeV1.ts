import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { preProcessFile } from "typescript";

import {
  FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";

import {
  buildFivePatchModelEnvelopeArmReadinessPlanV1,
  buildFivePatchModelEnvelopeDtRefinementPlanV1,
  buildFivePatchModelEnvelopeFullProtocolPlanV1,
  buildFivePatchModelEnvelopePreflightPlanV1,
  buildFivePatchEnvelopePreflightSpecV1,
  buildFivePatchEnvelopeProtocolSpecV1,
  buildFivePatchModelEnvelopeScreeningPlanV1,
  buildFivePatchModelEnvelopeStressValidationPlanV1,
  runFivePatchModelEnvelopePreflightBatchV1,
  runFivePatchModelEnvelopeProtocolBatchV1,
  runFivePatchModelEnvelopeProtocolRunV1,
  selectFivePatchEnvelopeShardV1,
  type FivePatchEnvelopePreflightResultV1,
  type FivePatchEnvelopeProtocolPlanSelectionV1,
  type FivePatchEnvelopeProtocolRunRequestV1,
  type FivePatchEnvelopeProtocolRunResultV1,
  type FivePatchEnvelopeShardV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  initialNoAvpdFivePatchLandTriSegStateV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");

export const FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1 = Object.freeze([
  "data/mechanics2/protocols/five-patch-model-envelope-v1.json",
  "engine/mechanics2/activation/Land2017ActiveOnlyV1.ts",
  "engine/mechanics2/activation/LiteratureLand2017ActiveOnlyParamsV1.ts",
  "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV1.ts",
  "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2.ts",
  "engine/mechanics2/constitutive/EquilibriumPassiveSlsParallelV1.ts",
  "engine/mechanics2/constitutive/LandActivePassiveSlsV1.ts",
  "engine/mechanics2/diagnostics/FivePatchRawCycleDiagnosticsV1.ts",
  "engine/mechanics2/diagnostics/LaPvLobeMeasurementV2.ts",
  "engine/mechanics2/envelope/DeterministicMaximinLhsV1.ts",
  "engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1.ts",
  "engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1.ts",
  "engine/mechanics2/geometry/OneFiberVolumeGeometryV1.ts",
  "engine/mechanics2/geometry/TriSegGeometryV1.ts",
  "engine/mechanics2/solver/FivePatchDampedNewtonV1.ts",
  "engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1.ts",
  "engine/mechanics2/valve/SmoothInertialValveV2.ts",
  "engine/myocardium/atrialLandNiederer2018.ts",
  "engine/myocardium/calcium/PrescribedCalciumTransientV1.ts",
  "engine/myocardium/contracts.ts",
  "engine/myocardium/myofilament/land2017/equations.ts",
  "engine/myocardium/myofilament/land2017/jacobian.ts",
  "engine/myocardium/myofilament/land2017/outputs.ts",
  "engine/myocardium/myofilament/land2017/parameterSets.ts",
  "engine/myocardium/myofilament/land2017/residual.ts",
  "engine/myocardium/myofilament/land2017/sdirk2.ts",
  "engine/myocardium/myofilament/land2017/solver.ts",
  "engine/myocardium/myofilament/land2017/stabilization.ts",
  "engine/myocardium/myofilament/land2017/types.ts",
  "engine/myocardium/units.ts",
  "package-lock.json",
] as const);

const FIVE_PATCH_ENVELOPE_HARNESS_SOURCE_PATHS_V1 = Object.freeze([
  "tools/mechanics2/runFivePatchModelEnvelopeV1.ts",
] as const);

const fixedExecutionPolicy =
  FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1.executionPolicy;

/**
 * Human-readable execution identity embedded in every persisted run.
 *
 * This is intentionally not a CLI option. The protocol descriptor fixes both
 * the 32-beat settle/assess schedule and its 1e-4 full-state return-map
 * tolerance before any candidate is executed.
 */
export const FIVE_PATCH_ENVELOPE_FIXED_SETTLE_AND_ASSESS_PROVENANCE_V1 =
  Object.freeze({
    cliOverrideAllowed: false as const,
    fullStateReturnMapMaxAbsDimensionlessTolerance:
      fixedExecutionPolicy.fullStateReturnMapMaxAbsDimensionlessTolerance,
    settleAndAssessSchedule: fixedExecutionPolicy.settleAndAssess,
    phaseExecution: Object.freeze([
      Object.freeze({
        phase: "screening" as const,
        beats: fixedExecutionPolicy.screening.beats,
        dtSec: fixedExecutionPolicy.screening.dtSec,
      }),
      Object.freeze({
        phase: "stress-validation" as const,
        beats: fixedExecutionPolicy.stressValidation.beats,
        dtSec: fixedExecutionPolicy.stressValidation.dtSec,
      }),
      Object.freeze({
        phase: "dt-refinement" as const,
        beats: fixedExecutionPolicy.dtRefinement.beats,
        dtSec: fixedExecutionPolicy.dtRefinement.dtSec,
      }),
    ]),
  });

export type FivePatchModelEnvelopeCliOptionsV1 = {
  readonly mode: "preflight" | "protocol";
  readonly phase: FivePatchEnvelopeProtocolPlanSelectionV1 | null;
  readonly dtSec: number | null;
  readonly stepCount: number | null;
  readonly shard: FivePatchEnvelopeShardV1;
  readonly outputDirectory: string | null;
  readonly planOnly: boolean;
  readonly streamToDisk: boolean;
};

type EngineResultV1 =
  | FivePatchEnvelopePreflightResultV1
  | FivePatchEnvelopeProtocolRunResultV1;

type FivePatchModelEnvelopeArtifactFieldsV1 = {
  readonly parameterIdentitySha256: string;
  readonly provenance: FivePatchModelEnvelopeArtifactProvenanceV1;
  readonly normalizedSha256: string;
};

export type FivePatchModelEnvelopePersistedProtocolResultV1 =
  FivePatchEnvelopeProtocolRunResultV1 &
    FivePatchModelEnvelopeArtifactFieldsV1;

export type FivePatchModelEnvelopePersistedResultV1 =
  | (FivePatchEnvelopePreflightResultV1 &
      FivePatchModelEnvelopeArtifactFieldsV1)
  | FivePatchModelEnvelopePersistedProtocolResultV1;

export type FivePatchModelEnvelopeArtifactProvenanceV1 = {
  readonly protocolDefinitionSha256: string;
  readonly settleAndAssessProtocolSha256: string;
  readonly implementationSha256: string;
  readonly harnessImplementationSha256: string;
  readonly runRequestSha256: string;
  readonly initialStateSha256: string;
  readonly fixedSettleAndAssessProtocol:
    typeof FIVE_PATCH_ENVELOPE_FIXED_SETTLE_AND_ASSESS_PROVENANCE_V1;
  readonly implementationDependencyCoverage:
    "all-repository-local-static-imports-transitively-closed";
  readonly implementationSourcePaths:
    typeof FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1;
  readonly harnessSourcePaths:
    typeof FIVE_PATCH_ENVELOPE_HARNESS_SOURCE_PATHS_V1;
  readonly artifactHashDefinition:
    "sha256-of-json-body-excluding-normalizedSha256";
};

export type FivePatchModelEnvelopeAssemblyManifestV1 = {
  readonly artifactCount: number;
  readonly orderedRunIds: readonly string[];
  readonly orderedArtifactNormalizedSha256s: readonly string[];
  readonly protocolDefinitionSha256: string;
  readonly settleAndAssessProtocolSha256: string;
  readonly implementationSha256: string;
  readonly harnessImplementationSha256: string;
  readonly assemblyNormalizedSha256: string;
};

export type FivePatchModelEnvelopeCompactRunSummaryV1 = {
  readonly runOrdinal: number;
  readonly runId: string;
  readonly status: EngineResultV1["status"];
  readonly stepsAccepted: number;
  readonly stepsAttempted: number;
  readonly parameterIdentitySha256: string;
  readonly artifactNormalizedSha256: string;
  readonly retainedCycleEndpointCount: number;
  readonly periodicityStatus: EngineResultV1["periodicity"]["status"];
  readonly laPvLobeMeasurementStatus: string | null;
  readonly laPvALoopAreaMmHgMl: number | null;
  readonly laPvVLoopAreaMmHgMl: number | null;
  readonly laPvAToVAreaRatio: number | null;
  readonly laPvLobesSteadyStateInterpretationEligible: boolean | null;
  readonly vLoopMechanismTraceStatus: string | null;
  readonly matchedVolumeReservoirMinusConduitStatus: string | null;
  readonly maximumAbsoluteLaPressureComponentClosureResidualMmHg:
    number | null;
};

export type FivePatchModelEnvelopeProtocolStreamingResultV1 = {
  readonly executedRunCount: number;
  readonly results: readonly FivePatchModelEnvelopeCompactRunSummaryV1[];
};

type FivePatchModelEnvelopeProtocolStreamingDependenciesV1 = {
  readonly executeRun?: typeof runFivePatchModelEnvelopeProtocolRunV1;
};

export function parseFivePatchModelEnvelopeCliArgsV1(
  args: readonly string[],
): FivePatchModelEnvelopeCliOptionsV1 {
  let preflight = false;
  let phase: FivePatchEnvelopeProtocolPlanSelectionV1 | null = null;
  let dtSec = 0.005;
  let stepCount = 1;
  let dtWasProvided = false;
  let stepsWereProvided = false;
  let shard: FivePatchEnvelopeShardV1 = { shardIndex: 0, shardCount: 1 };
  let outputDirectory: string | null = null;
  let planOnly = false;
  let streamToDisk = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    const value = args[index + 1];
    switch (argument) {
      case "--preflight":
        preflight = true;
        break;
      case "--phase":
        phase = parsePhase(value);
        index += 1;
        break;
      case "--dt":
        dtSec = parseFinite(value, argument);
        dtWasProvided = true;
        index += 1;
        break;
      case "--steps":
        stepCount = parseFinite(value, argument);
        stepsWereProvided = true;
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
      case "--stream-to-disk":
        streamToDisk = true;
        break;
      case "--help":
      case "-h":
        throw new Error(usageText());
      default:
        throw new Error(`unknown argument: ${argument}\n${usageText()}`);
    }
  }
  if (preflight === (phase != null)) {
    throw new Error("choose exactly one of --preflight or --phase");
  }
  if (preflight) {
    if (!Number.isInteger(stepCount) || stepCount < 1 || stepCount > 4) {
      throw new Error("--steps must be an integer in [1, 4]");
    }
    if (!(dtSec > 0) || dtSec > 0.01) {
      throw new Error("--dt must lie in (0, 0.01]");
    }
  } else if (dtWasProvided || stepsWereProvided) {
    throw new Error("protocol phases use the committed beats/dt; --dt and --steps are preflight-only");
  }
  if (streamToDisk && preflight) {
    throw new Error("--stream-to-disk is available only for protocol phases");
  }
  if (streamToDisk && planOnly) {
    throw new Error("--stream-to-disk cannot be combined with --plan-only");
  }
  if (streamToDisk && outputDirectory == null) {
    throw new Error("--stream-to-disk requires --output-dir");
  }
  return Object.freeze({
    mode: preflight ? "preflight" as const : "protocol" as const,
    phase,
    dtSec: preflight ? dtSec : null,
    stepCount: preflight ? stepCount : null,
    shard: Object.freeze(shard),
    outputDirectory,
    planOnly,
    streamToDisk,
  });
}

export function fivePatchEnvelopeParameterIdentitySha256V1(
  canonicalIdentity: string,
): string {
  return createHash("sha256").update(canonicalIdentity, "utf8").digest("hex");
}

export function runFivePatchModelEnvelopeCliV1(
  args: readonly string[] = process.argv.slice(2),
): readonly FivePatchModelEnvelopePersistedResultV1[] {
  const options = parseFivePatchModelEnvelopeCliArgsV1(args);
  const completePlan = options.mode === "preflight"
    ? buildFivePatchModelEnvelopePreflightPlanV1({
        dtSec: options.dtSec!,
        stepCount: options.stepCount!,
      })
    : protocolPlan(options.phase!);
  const shardPlan = selectFivePatchEnvelopeShardV1(
    completePlan,
    options.shard,
  );
  if (options.streamToDisk) {
    const streaming = runFivePatchModelEnvelopeProtocolStreamingToDiskV1(
      shardPlan as readonly FivePatchEnvelopeProtocolRunRequestV1[],
      options.outputDirectory!,
    );
    writeCliSummary({
      options,
      completePlanRunCount: completePlan.length,
      shardRunCount: shardPlan.length,
      executedRunCount: streaming.executedRunCount,
      results: streaming.results,
    });
    // Full payloads have already been persisted and released. Preserve the
    // existing full-result return contract for non-streaming callers only.
    return Object.freeze([]);
  }
  const engineResults: readonly EngineResultV1[] = options.planOnly
    ? Object.freeze([])
    : options.mode === "preflight"
      ? runFivePatchModelEnvelopePreflightBatchV1(shardPlan)
      : runFivePatchModelEnvelopeProtocolBatchV1(
          shardPlan as readonly FivePatchEnvelopeProtocolRunRequestV1[],
        );
  const results = Object.freeze(engineResults.map(withArtifactProvenance));
  if (options.outputDirectory != null) {
    for (const result of results) {
      const destination = resolve(
        options.outputDirectory,
        `${safeFileName(result.runId)}.json`,
      );
      writeJsonAtomically(destination, result);
    }
  }
  writeCliSummary({
    options,
    completePlanRunCount: completePlan.length,
    shardRunCount: shardPlan.length,
    executedRunCount: results.length,
    results: results.map((result, runOrdinal) => compactRunSummary(
      result,
      runOrdinal,
    )),
  });
  return results;
}

/**
 * Execute an already-built canonical protocol plan in its supplied order.
 *
 * The caller builds and shards the committed plan. There is deliberately no
 * resume, skip, retry, ranking, or adaptive-plan behavior here: every request
 * is executed exactly once, even when its destination exists or an earlier
 * result reports numerical failure. Persistence finishes before the next run.
 */
export function runFivePatchModelEnvelopeProtocolStreamingToDiskV1(
  requests: readonly FivePatchEnvelopeProtocolRunRequestV1[],
  outputDirectory: string,
  runOptions: Parameters<typeof runFivePatchModelEnvelopeProtocolRunV1>[1] = {},
  dependencies: FivePatchModelEnvelopeProtocolStreamingDependenciesV1 = {},
): FivePatchModelEnvelopeProtocolStreamingResultV1 {
  if (outputDirectory.trim() === "") {
    throw new Error("streaming output directory must be non-empty");
  }
  const executeRun = dependencies.executeRun ??
    runFivePatchModelEnvelopeProtocolRunV1;
  const summaries: FivePatchModelEnvelopeCompactRunSummaryV1[] = [];
  for (let runOrdinal = 0; runOrdinal < requests.length; runOrdinal += 1) {
    const result = withArtifactProvenance(
      executeRun(requests[runOrdinal]!, runOptions),
    );
    const destination = resolve(
      outputDirectory,
      `${safeFileName(result.runId)}.json`,
    );
    writeJsonAtomically(destination, result);
    summaries.push(compactRunSummary(result, runOrdinal));
  }
  return Object.freeze({
    executedRunCount: summaries.length,
    results: Object.freeze(summaries),
  });
}

function withArtifactProvenance(
  result: EngineResultV1,
): FivePatchModelEnvelopePersistedResultV1 {
  const spec = "phase" in result.request
    ? buildFivePatchEnvelopeProtocolSpecV1(result.request)
    : buildFivePatchEnvelopePreflightSpecV1(result.request);
  if (result.runId !== spec.runId) {
    throw new Error(`runId does not match canonical coordinates: ${result.runId}`);
  }
  if (
    result.parameterIdentityCanonicalJson !==
      spec.parameterIdentityCanonicalJson
  ) {
    throw new Error(`parameter identity does not match canonical coordinates: ${result.runId}`);
  }
  const parameterIdentitySha256 =
    fivePatchEnvelopeParameterIdentitySha256V1(
      result.parameterIdentityCanonicalJson,
    );
  const sourceIdentity = currentFivePatchEnvelopeSourceIdentityV1();
  const provenance: FivePatchModelEnvelopeArtifactProvenanceV1 = Object.freeze({
    ...sourceIdentity,
    runRequestSha256: sha256Json(result.request),
    initialStateSha256: sha256Json(
      initialNoAvpdFivePatchLandTriSegStateV1(
        spec.params,
        spec.initialVolumeOverridesMl,
      ),
    ),
    fixedSettleAndAssessProtocol:
      FIVE_PATCH_ENVELOPE_FIXED_SETTLE_AND_ASSESS_PROVENANCE_V1,
    implementationDependencyCoverage:
      "all-repository-local-static-imports-transitively-closed" as const,
    implementationSourcePaths:
      FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1,
    harnessSourcePaths: FIVE_PATCH_ENVELOPE_HARNESS_SOURCE_PATHS_V1,
    artifactHashDefinition:
      "sha256-of-json-body-excluding-normalizedSha256" as const,
  });
  const body = Object.freeze({
    ...result,
    parameterIdentitySha256,
    provenance,
  });
  return Object.freeze({
    ...body,
    normalizedSha256: sha256Json(body),
  });
}

export function validateFivePatchModelEnvelopePersistedResultV1(
  value: unknown,
): FivePatchModelEnvelopePersistedResultV1 {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("five-patch envelope artifact must be an object");
  }
  const artifact = value as FivePatchModelEnvelopePersistedResultV1;
  if (typeof artifact.normalizedSha256 !== "string") {
    throw new Error("five-patch envelope artifact has no normalized hash");
  }
  const {
    normalizedSha256: _normalizedSha256,
    ...body
  } = artifact;
  if (sha256Json(body) !== artifact.normalizedSha256) {
    throw new Error("five-patch envelope artifact normalized hash mismatch");
  }
  if (
    fivePatchEnvelopeParameterIdentitySha256V1(
      artifact.parameterIdentityCanonicalJson,
    ) !== artifact.parameterIdentitySha256
  ) {
    throw new Error("five-patch envelope artifact parameter identity hash mismatch");
  }
  const sourceIdentity = currentFivePatchEnvelopeSourceIdentityV1();
  if (
    artifact.provenance.protocolDefinitionSha256 !==
      sourceIdentity.protocolDefinitionSha256
  ) {
    throw new Error("five-patch envelope artifact protocol hash mismatch");
  }
  if (
    artifact.provenance.settleAndAssessProtocolSha256 !==
      sourceIdentity.settleAndAssessProtocolSha256
  ) {
    throw new Error(
      "five-patch envelope artifact settle-and-assess protocol hash mismatch",
    );
  }
  if (
    JSON.stringify(artifact.provenance.fixedSettleAndAssessProtocol) !==
      JSON.stringify(
        FIVE_PATCH_ENVELOPE_FIXED_SETTLE_AND_ASSESS_PROVENANCE_V1,
      )
  ) {
    throw new Error(
      "five-patch envelope artifact fixed settle-and-assess protocol mismatch",
    );
  }
  if (
    artifact.provenance.implementationSha256 !==
      sourceIdentity.implementationSha256
  ) {
    throw new Error("five-patch envelope artifact implementation hash mismatch");
  }
  if (
    artifact.provenance.harnessImplementationSha256 !==
      sourceIdentity.harnessImplementationSha256
  ) {
    throw new Error("five-patch envelope artifact harness hash mismatch");
  }
  if (
    artifact.provenance.implementationDependencyCoverage !==
      "all-repository-local-static-imports-transitively-closed" ||
    JSON.stringify(artifact.provenance.implementationSourcePaths) !==
      JSON.stringify(FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1) ||
    JSON.stringify(artifact.provenance.harnessSourcePaths) !==
      JSON.stringify(FIVE_PATCH_ENVELOPE_HARNESS_SOURCE_PATHS_V1)
  ) {
    throw new Error("five-patch envelope artifact source manifest mismatch");
  }
  if (sha256Json(artifact.request) !== artifact.provenance.runRequestSha256) {
    throw new Error("five-patch envelope artifact run-request hash mismatch");
  }
  const spec = "phase" in artifact.request
    ? buildFivePatchEnvelopeProtocolSpecV1(artifact.request)
    : buildFivePatchEnvelopePreflightSpecV1(artifact.request);
  if (artifact.runId !== spec.runId) {
    throw new Error("five-patch envelope artifact runId is not canonical");
  }
  if (
    artifact.parameterIdentityCanonicalJson !==
      spec.parameterIdentityCanonicalJson
  ) {
    throw new Error("five-patch envelope artifact parameter identity is not canonical");
  }
  if (
    JSON.stringify(artifact.initialVolumeOverridesMl) !==
      JSON.stringify(spec.initialVolumeOverridesMl)
  ) {
    throw new Error("five-patch envelope artifact initial volume overrides are not canonical");
  }
  const expectedInitialStateSha256 = sha256Json(
    initialNoAvpdFivePatchLandTriSegStateV1(
      spec.params,
      spec.initialVolumeOverridesMl,
    ),
  );
  if (
    artifact.provenance.initialStateSha256 !== expectedInitialStateSha256
  ) {
    throw new Error("five-patch envelope artifact initial-state hash mismatch");
  }
  return artifact;
}

export function validateFivePatchModelEnvelopePersistedProtocolResultV1(
  value: unknown,
): FivePatchModelEnvelopePersistedProtocolResultV1 {
  const artifact = validateFivePatchModelEnvelopePersistedResultV1(value);
  if (!("phase" in artifact.request)) {
    throw new Error("five-patch envelope artifact is not a protocol result");
  }
  return artifact as FivePatchModelEnvelopePersistedProtocolResultV1;
}

export function validateFivePatchModelEnvelopeAssemblyV1(
  values: readonly unknown[],
  expectedRequests: readonly FivePatchEnvelopeProtocolRunRequestV1[],
): FivePatchModelEnvelopeAssemblyManifestV1 {
  if (values.length !== expectedRequests.length) {
    throw new Error(
      `five-patch envelope assembly count mismatch: expected ${expectedRequests.length}, received ${values.length}`,
    );
  }
  const artifacts = values.map(
    validateFivePatchModelEnvelopePersistedProtocolResultV1,
  );
  const byRunId = new Map<
    string,
    FivePatchModelEnvelopePersistedProtocolResultV1
  >();
  for (const artifact of artifacts) {
    if (byRunId.has(artifact.runId)) {
      throw new Error(`duplicate five-patch envelope runId: ${artifact.runId}`);
    }
    byRunId.set(artifact.runId, artifact);
  }
  const orderedArtifacts = expectedRequests.map((request) => {
    const runId = buildFivePatchEnvelopeProtocolSpecV1(request).runId;
    const artifact = byRunId.get(runId);
    if (artifact == null) {
      throw new Error(`missing five-patch envelope runId: ${runId}`);
    }
    if (sha256Json(artifact.request) !== sha256Json(request)) {
      throw new Error(`five-patch envelope request mismatch: ${runId}`);
    }
    return artifact;
  });
  const sourceIdentity = currentFivePatchEnvelopeSourceIdentityV1();
  const body = Object.freeze({
    artifactCount: orderedArtifacts.length,
    orderedRunIds: Object.freeze(orderedArtifacts.map((value) => value.runId)),
    orderedArtifactNormalizedSha256s: Object.freeze(
      orderedArtifacts.map((value) => value.normalizedSha256),
    ),
    ...sourceIdentity,
  });
  return Object.freeze({
    ...body,
    assemblyNormalizedSha256: sha256Json(body),
  });
}

let cachedFivePatchEnvelopeSourceIdentityV1: {
  readonly protocolDefinitionSha256: string;
  readonly settleAndAssessProtocolSha256: string;
  readonly implementationSha256: string;
  readonly harnessImplementationSha256: string;
} | null = null;

function currentFivePatchEnvelopeSourceIdentityV1() {
  if (cachedFivePatchEnvelopeSourceIdentityV1 != null) {
    return cachedFivePatchEnvelopeSourceIdentityV1;
  }
  assertFivePatchEnvelopeImplementationManifestClosedV1();
  cachedFivePatchEnvelopeSourceIdentityV1 = Object.freeze({
    protocolDefinitionSha256: sha256Json(
      FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1,
    ),
    settleAndAssessProtocolSha256: sha256Json(
      FIVE_PATCH_ENVELOPE_FIXED_SETTLE_AND_ASSESS_PROVENANCE_V1,
    ),
    implementationSha256: hashSourceManifest(
      FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1,
    ),
    harnessImplementationSha256: hashSourceManifest(
      FIVE_PATCH_ENVELOPE_HARNESS_SOURCE_PATHS_V1,
    ),
  });
  return cachedFivePatchEnvelopeSourceIdentityV1;
}

/**
 * Prove that the explicit implementation manifest is closed over every
 * repository-local static import/export. This keeps artifact provenance from
 * silently omitting a transitive runtime or type dependency when an import is
 * added to any listed source file.
 */
export function assertFivePatchEnvelopeImplementationManifestClosedV1(
  paths: readonly string[] =
    FIVE_PATCH_ENVELOPE_IMPLEMENTATION_SOURCE_PATHS_V1,
): void {
  const normalizedPaths = paths.map(normalizeRepoRelativePath);
  const manifest = new Set(normalizedPaths);
  const missing: string[] = [];
  for (const importerPath of [...manifest].sort()) {
    const absoluteImporterPath = resolve(repoRoot, importerPath);
    if (!existsSync(absoluteImporterPath) || !statSync(absoluteImporterPath).isFile()) {
      throw new Error(
        `five-patch implementation manifest source does not exist: ${importerPath}`,
      );
    }
    if (!isStaticModuleSource(importerPath)) continue;
    const source = readFileSync(absoluteImporterPath, "utf8");
    const importedFiles = preProcessFile(source, true, true).importedFiles;
    for (const importedFile of importedFiles) {
      const dependencyPath = resolveRepoLocalModulePath(
        importerPath,
        importedFile.fileName,
      );
      if (dependencyPath != null && !manifest.has(dependencyPath)) {
        missing.push(`${importerPath} -> ${dependencyPath}`);
      }
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `five-patch implementation source manifest is not import-closed:\n${[
        ...new Set(missing),
      ].sort().join("\n")}`,
    );
  }
}

function isStaticModuleSource(path: string): boolean {
  return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]
    .includes(extname(path));
}

function resolveRepoLocalModulePath(
  importerPath: string,
  moduleSpecifier: string,
): string | null {
  let unresolvedAbsolutePath: string;
  if (moduleSpecifier.startsWith("@/")) {
    unresolvedAbsolutePath = resolve(repoRoot, moduleSpecifier.slice(2));
  } else if (moduleSpecifier.startsWith(".")) {
    unresolvedAbsolutePath = resolve(
      repoRoot,
      dirname(importerPath),
      moduleSpecifier,
    );
  } else {
    return null;
  }
  const candidates = extname(unresolvedAbsolutePath) === ""
    ? [
        unresolvedAbsolutePath,
        `${unresolvedAbsolutePath}.ts`,
        `${unresolvedAbsolutePath}.tsx`,
        `${unresolvedAbsolutePath}.js`,
        `${unresolvedAbsolutePath}.json`,
        resolve(unresolvedAbsolutePath, "index.ts"),
        resolve(unresolvedAbsolutePath, "index.tsx"),
        resolve(unresolvedAbsolutePath, "index.js"),
      ]
    : [unresolvedAbsolutePath];
  const resolvedDependency = candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
  if (resolvedDependency == null) {
    throw new Error(
      `cannot resolve repository-local import ${moduleSpecifier} from ${importerPath}`,
    );
  }
  return normalizeRepoRelativePath(relative(repoRoot, resolvedDependency));
}

function normalizeRepoRelativePath(path: string): string {
  const normalized = relative(repoRoot, resolve(repoRoot, path))
    .split(sep)
    .join("/");
  if (
    normalized === "" ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    resolve(repoRoot, normalized) === repoRoot
  ) {
    throw new Error(`source path lies outside the repository: ${path}`);
  }
  return normalized;
}

function hashSourceManifest(paths: readonly string[]): string {
  const hash = createHash("sha256");
  for (const path of [...paths].sort()) {
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(resolve(repoRoot, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function compactRunSummary(
  result: FivePatchModelEnvelopePersistedResultV1,
  runOrdinal: number,
): FivePatchModelEnvelopeCompactRunSummaryV1 {
  const lobes = result.reportOnlyRawCycleDiagnostics?.leftAtrialPvLobes;
  const mechanism = result.reportOnlyVLoopMechanismAttribution;
  const componentClosureResiduals = result.finalCycleSamples.flatMap(
    (sample) => {
      const value = sample.reportOnlyMechanismReadback?.leftAtrium
        .pressureComponentsMmHg.componentSumMinusTotalMmHg;
      return typeof value === "number" && Number.isFinite(value)
        ? [Math.abs(value)]
        : [];
    },
  );
  return Object.freeze({
    runOrdinal,
    runId: result.runId,
    status: result.status,
    stepsAccepted: result.stepsAccepted,
    stepsAttempted: result.stepsAttempted,
    parameterIdentitySha256: result.parameterIdentitySha256,
    artifactNormalizedSha256: result.normalizedSha256,
    retainedCycleEndpointCount: result.finalCycleSamples.length,
    periodicityStatus: result.periodicity.status,
    laPvLobeMeasurementStatus: lobes?.measurementStatus ?? null,
    laPvALoopAreaMmHgMl: lobes?.aLobe?.absoluteAreaMmHgMl ?? null,
    laPvVLoopAreaMmHgMl: lobes?.vLobe?.absoluteAreaMmHgMl ?? null,
    laPvAToVAreaRatio: lobes?.aToVAbsoluteAreaRatioUnbounded ?? null,
    laPvLobesSteadyStateInterpretationEligible:
      lobes?.steadyStateInterpretationEligible ?? null,
    vLoopMechanismTraceStatus: mechanism?.retainedRawTraceStatus ?? null,
    matchedVolumeReservoirMinusConduitStatus:
      mechanism?.matchedVolumeReservoirMinusConduit.status ?? null,
    maximumAbsoluteLaPressureComponentClosureResidualMmHg:
      componentClosureResiduals.length > 0
        ? Math.max(...componentClosureResiduals)
        : null,
  });
}

function writeCliSummary(input: {
  readonly options: FivePatchModelEnvelopeCliOptionsV1;
  readonly completePlanRunCount: number;
  readonly shardRunCount: number;
  readonly executedRunCount: number;
  readonly results: readonly FivePatchModelEnvelopeCompactRunSummaryV1[];
}): void {
  process.stdout.write(`${JSON.stringify({
    mode: input.options.mode,
    phase: input.options.phase,
    planOnly: input.options.planOnly,
    streamToDisk: input.options.streamToDisk,
    shard: input.options.shard,
    completePlanRunCount: input.completePlanRunCount,
    shardRunCount: input.shardRunCount,
    executedRunCount: input.executedRunCount,
    fixedSettleAndAssessProtocol:
      FIVE_PATCH_ENVELOPE_FIXED_SETTLE_AND_ASSESS_PROVENANCE_V1,
    results: input.results,
    interpretation:
      "fixed-global-envelope; numerical failures are retained and never select, rank, or reject a model class",
  })}\n`);
}

function protocolPlan(phase: FivePatchEnvelopeProtocolPlanSelectionV1) {
  switch (phase) {
    case "arm-readiness":
      return buildFivePatchModelEnvelopeArmReadinessPlanV1();
    case "screening":
      return buildFivePatchModelEnvelopeScreeningPlanV1();
    case "stress-validation":
      return buildFivePatchModelEnvelopeStressValidationPlanV1();
    case "dt-refinement":
      return buildFivePatchModelEnvelopeDtRefinementPlanV1();
    case "full":
      return buildFivePatchModelEnvelopeFullProtocolPlanV1();
  }
}

function writeJsonAtomically(
  destinationPath: string,
  value: unknown,
): void {
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    renameSync(temporaryPath, destinationPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function parsePhase(
  value: string | undefined,
): FivePatchEnvelopeProtocolPlanSelectionV1 {
  if (
    value === "arm-readiness" ||
    value === "screening" ||
    value === "stress-validation" ||
    value === "dt-refinement" ||
    value === "full"
  ) {
    return value;
  }
  throw new Error(
    "--phase must be arm-readiness, screening, stress-validation, dt-refinement, or full",
  );
}

function parseShard(value: string | undefined): FivePatchEnvelopeShardV1 {
  if (value == null) throw new Error("--shard requires index/count");
  const match = /^(\d+)\/(\d+)$/.exec(value);
  if (match == null) throw new Error("--shard must use index/count");
  const shardIndex = Number(match[1]);
  const shardCount = Number(match[2]);
  if (shardCount < 1 || shardIndex < 0 || shardIndex >= shardCount) {
    throw new Error("--shard index must lie in [0, count)");
  }
  return { shardIndex, shardCount };
}

function parseFinite(value: string | undefined, option: string): number {
  if (value == null) throw new Error(`${option} requires a value`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${option} must be finite`);
  return parsed;
}

function safeFileName(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
}

function usageText(): string {
  return [
    "Usage: vite-node --script tools/mechanics2/runFivePatchModelEnvelopeV1.ts <mode> [options]",
    "Modes:",
    "  --preflight            bounded 1-4-step numerical prefix",
    "  --phase <phase>         committed arm-readiness, screening, stress-validation, dt-refinement, or full",
    "Options:",
    "  --steps <1..4>          preflight only (default 1)",
    "  --dt <seconds>          preflight only, (0, 0.01] (default 0.005)",
    "  --shard <index/count>   deterministic canonical-plan shard (default 0/1)",
    "  --output-dir <path>     atomic per-run JSON with canonical parameter identity and SHA-256",
    "  --stream-to-disk        protocol only; persist and release every completed run immediately",
    "  --plan-only             construct and shard the exact plan without simulation",
    "Streaming never resumes or skips existing files; it atomically replaces each completed run.",
    "The full plan is fixed before outcomes and uses an independent cold start per run.",
    "Protocol settle/assess is fixed: 32 beats with a 1e-4 full-state return-map tolerance; there is no CLI override.",
  ].join("\n");
}

const invokedPath = process.argv[1];
if (
  invokedPath != null &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    // Candidate numerical failures are observations and keep exit code zero.
    // Harness/provenance errors throw and set a nonzero exit code.
    runFivePatchModelEnvelopeCliV1();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
