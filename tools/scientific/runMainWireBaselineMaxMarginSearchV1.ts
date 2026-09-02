import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from
  "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import settledBaselineCheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  validateMainWireIntegratedModelStandard68CheckpointV1,
  type MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  evaluateMainWireBaselineCalibrationCandidateV1,
  type MainWireBaselineCalibrationEvaluationV1,
} from "@/analysis/methods/mainWire/MainWireBaselineCalibrationEvaluatorV1";
import {
  buildMainWireBaselineSearchDesignV1,
  compareMainWireBaselineCandidateObjectivesV1,
  scoreMainWireBaselineCandidateObjectiveV1,
  type MainWireBaselineCandidateObjectiveV1,
  type MainWireBaselineSearchCandidateV1,
} from "@/analysis/methods/mainWire/MainWireBaselineMaxMarginSearchV1";
import type {
  MainWireBaselineNumericalFloorAuditV1,
  MainWireBaselineNumericalFloorMetricV1,
} from "@/analysis/methods/mainWire/MainWireBaselineNumericalFloorAuditV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
  compileMainWireBaselineConditioningStudyV1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";
import type {
  MainWireBaselineCalibrationCandidateInputsV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

type SearchWorkerJobV1 = Readonly<{
  candidate: MainWireBaselineSearchCandidateV1;
  sourceCheckpoint: unknown;
  sourceCandidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[];
}>;

type SearchEvaluationV1 = Readonly<{
  candidateId: string;
  stage: MainWireBaselineSearchCandidateV1["stage"];
  ordinal: number;
  coordinateValues: Readonly<Record<string, number>>;
  transformedCoordinateValues: Readonly<Record<string, number>>;
  sourceCheckpointSha256: string;
  evaluationStatus: MainWireBaselineCalibrationEvaluationV1["status"];
  evaluationPhase: string | null;
  requestIdentitySha256: string | null;
  initializationKind: string | null;
  wallTimeMs: number;
  completedCycleCount: number | null;
  classificationStatus: string | null;
  constructionGateStatus: string | null;
  failedConstructionCheckIds: readonly string[];
  objective: MainWireBaselineCandidateObjectiveV1 | null;
  message: string | null;
}>;

type SearchWorkerExecutionV1 = Readonly<{
  evaluation: SearchEvaluationV1;
  candidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
  acceptedCheckpoint: MainWireIntegratedModelStandard68CheckpointV1 | null;
}>;

const encodedWorkerJob = argumentV1("--worker-job");
if (encodedWorkerJob !== null) {
  await runWorkerV1(encodedWorkerJob);
} else {
  await runCoordinatorV1();
}

async function runCoordinatorV1(): Promise<void> {
  const floorPath = resolve(requiredArgumentV1("--numerical-floor"));
  const outputPath = resolve(requiredArgumentV1("--output"));
  const requestedParallelism = positiveIntegerV1(
    argumentV1("--parallelism") ?? "8",
    "parallelism",
  );
  const numericalFloorJson = JSON.parse(
    await readFile(floorPath, "utf8"),
  ) as unknown;
  const numericalFloor = parseNumericalFloorV1(numericalFloorJson);
  const numericalFloorArtifactSha256 = await sha256CanonicalJsonHex(
    numericalFloorJson,
  );
  const sourceCheckpoint =
    await validateMainWireIntegratedModelStandard68CheckpointV1(
      settledBaselineCheckpointJson,
    );
  const initialCandidates = buildMainWireBaselineSearchDesignV1({
    stage: "initial",
  });
  const effectiveParallelism = Math.min(
    requestedParallelism,
    Math.max(1, availableParallelism() - 1),
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
      .maximumParallelEvaluations,
    initialCandidates.length,
  );
  process.stderr.write(
    `[baseline-search] ${initialCandidates.length} initial candidates, `
      + `${effectiveParallelism} workers\n`,
  );
  const startedAt = performance.now();
  let completed = 0;
  const progress = ({ evaluation }: SearchWorkerExecutionV1) => {
    completed += 1;
    process.stderr.write(
      `[baseline-search] ${completed} ${evaluation.candidateId}: `
        + `${evaluation.evaluationStatus}, `
        + `${evaluation.objective?.status ?? "unscored"}, `
        + `margin=${formatV1(
          evaluation.objective?.worstBufferedInteriorMargin ?? null,
        )}, ${Math.round(evaluation.wallTimeMs)} ms, `
        + `${evaluation.completedCycleCount ?? "-"} cycles\n`,
    );
  };
  const sourceCandidateInputs = initialCandidates[0].candidateInputs;
  const initial = await runPoolV1(initialCandidates.map((candidate) =>
    Object.freeze({
      candidate,
      sourceCheckpoint,
      sourceCandidateInputs,
      numericalFloors: numericalFloor.metricFloors,
    })), effectiveParallelism, progress);
  const bestInitial = bestExecutionV1(initial);
  if (bestInitial.acceptedCheckpoint === null) {
    throw new Error("best initial candidate has no accepted checkpoint");
  }
  const refinementCandidates = buildMainWireBaselineSearchDesignV1({
    stage: "refinement",
    center: bestInitial.candidateInputs,
  });
  process.stderr.write(
    `[baseline-search] ${refinementCandidates.length} refinement candidates `
      + `around ${bestInitial.evaluation.candidateId}\n`,
  );
  const refinement = await runPoolV1(refinementCandidates.map((candidate) =>
    Object.freeze({
      candidate,
      sourceCheckpoint: bestInitial.acceptedCheckpoint,
      sourceCandidateInputs: bestInitial.candidateInputs,
      numericalFloors: numericalFloor.metricFloors,
    })), effectiveParallelism, progress);
  const all = [...initial, ...refinement];
  const ranked = [...all].sort(compareExecutionsV1);
  const best = ranked[0];
  const policy = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.searchPolicy;
  const finalists = ranked.slice(0, policy.finalistCount);
  const bestMargin = best.evaluation.objective
    ?.worstBufferedInteriorMargin ?? Number.NEGATIVE_INFINITY;
  const equivalentCandidateIds = ranked.filter(({ evaluation }) => {
    const objective = evaluation.objective;
    return objective?.status === "feasible"
      && objective.worstBufferedInteriorMargin !== null
      && bestMargin - objective.worstBufferedInteriorMargin
        <= policy.equivalentWorstMarginEpsilon;
  }).map(({ evaluation }) => evaluation.candidateId);
  const study = await compileMainWireBaselineConditioningStudyV1();
  const protocolCommit = gitV1([
    "log",
    "-1",
    "--format=%H",
    "--",
    "analysis/policies/mainWire/MainWireBaselineConditioningStudyV1.ts",
  ]);
  const executionCommit = gitV1(["rev-parse", "HEAD"]);
  const batchWallTimeMs = performance.now() - startedAt;
  const summedEvaluationWallTimeMs = all.reduce((sum, execution) =>
    sum + execution.evaluation.wallTimeMs, 0);
  const report = Object.freeze({
    schemaVersion: 1 as const,
    searchId: "main-wire-baseline-max-margin-search-result-v1" as const,
    studyIdentitySha256: study.studyIdentitySha256,
    protocolCommit,
    executionCommit,
    numericalFloorArtifactPath: floorPath,
    numericalFloorArtifactSha256,
    requestedParallelism,
    effectiveParallelism,
    batchWallTimeMs,
    summedEvaluationWallTimeMs,
    observedThroughputSpeedup: batchWallTimeMs > 0
      ? summedEvaluationWallTimeMs / batchWallTimeMs
      : 0,
    initialCandidateCount: initial.length,
    refinementCandidateCount: refinement.length,
    acceptedCandidateCount: all.filter(({ evaluation }) =>
      evaluation.evaluationStatus === "accepted").length,
    feasibleCandidateCount: all.filter(({ evaluation }) =>
      evaluation.objective?.status === "feasible").length,
    bestInitialCandidateId: bestInitial.evaluation.candidateId,
    bestCandidateId: best.evaluation.candidateId,
    finalistCandidateIds: Object.freeze(finalists.map(({ evaluation }) =>
      evaluation.candidateId)),
    equivalentCandidateIds: Object.freeze(equivalentCandidateIds),
    ranking: Object.freeze(ranked.map(({ evaluation }, index) =>
      Object.freeze({ rank: index + 1, candidateId: evaluation.candidateId }))),
    evaluations: Object.freeze(all.map(({ evaluation }) => evaluation)),
    claim: Object.freeze({
      evidenceRole: "construction" as const,
      restCorridorsOnly: true as const,
      preloadReserveQualified: false as const,
      perturbationSafetyQualified: false as const,
      finalistRefinedDtQualified: false as const,
      uniqueParameterVectorClaimed: false as const,
      selectionClaimed: false as const,
    }),
  });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${outputPath}\n`);
}

async function runWorkerV1(encoded: string): Promise<void> {
  const decoded = Buffer.from(encoded, "base64url").toString("utf8");
  const job = parseWorkerJobV1(JSON.parse(decoded) as unknown);
  const sourceCheckpoint =
    await validateMainWireIntegratedModelStandard68CheckpointV1(
      job.sourceCheckpoint,
    );
  const exactSource = sameCoordinatesV1(
    job.candidate.candidateInputs,
    job.sourceCandidateInputs,
  );
  const evaluation = await evaluateMainWireBaselineCalibrationCandidateV1({
    hemodynamicResearchInputs:
      job.candidate.candidateInputs.hemodynamicResearchInputs,
    mechanismResearchInputs:
      job.candidate.candidateInputs.mechanismResearchInputs,
    ventricularContractilityScale:
      job.candidate.candidateInputs.ventricularContractilityScale,
    nominalDtSec:
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
        .explorationNominalDtSec,
    initialization: exactSource
      ? Object.freeze({
          kind: "standard68-exact-checkpoint" as const,
          checkpoint: sourceCheckpoint,
        })
      : Object.freeze({
          kind: "standard68-parameter-continuation" as const,
          sourceCheckpoint,
          sourceHemodynamicResearchInputs:
            job.sourceCandidateInputs.hemodynamicResearchInputs,
          sourceVentricularContractilityScale:
            job.sourceCandidateInputs.ventricularContractilityScale,
          sourceMechanismResearchInputs:
            job.sourceCandidateInputs.mechanismResearchInputs,
        }),
  });
  const compact = compactEvaluationV1(
    job.candidate,
    sourceCheckpoint.checkpointSha256,
    evaluation,
    job.numericalFloors,
  );
  process.stdout.write(JSON.stringify(Object.freeze({
    evaluation: compact,
    candidateInputs: job.candidate.candidateInputs,
    acceptedCheckpoint: evaluation.status === "accepted"
      ? evaluation.exactResult.checkpoint
      : null,
  })));
}

function compactEvaluationV1(
  candidate: MainWireBaselineSearchCandidateV1,
  sourceCheckpointSha256: string,
  evaluation: MainWireBaselineCalibrationEvaluationV1,
  numericalFloors: readonly MainWireBaselineNumericalFloorMetricV1[],
): SearchEvaluationV1 {
  const common = Object.freeze({
    candidateId: candidate.candidateId,
    stage: candidate.stage,
    ordinal: candidate.ordinal,
    coordinateValues: candidate.coordinateValues,
    transformedCoordinateValues: candidate.transformedCoordinateValues,
    sourceCheckpointSha256,
  });
  if (evaluation.status !== "accepted") {
    return Object.freeze({
      ...common,
      evaluationStatus: evaluation.status,
      evaluationPhase: evaluation.phase,
      requestIdentitySha256: evaluation.requestIdentitySha256,
      initializationKind: null,
      wallTimeMs: evaluation.wallTimeMs,
      completedCycleCount: evaluation.partial?.completedCycleCount ?? null,
      classificationStatus: evaluation.partial?.classificationStatus ?? null,
      constructionGateStatus: null,
      failedConstructionCheckIds: Object.freeze([]),
      objective: null,
      message: evaluation.message,
    });
  }
  return Object.freeze({
    ...common,
    evaluationStatus: evaluation.status,
    evaluationPhase: null,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    initializationKind: evaluation.initializationKind,
    wallTimeMs: evaluation.wallTimeMs,
    completedCycleCount: evaluation.exactResult.completedCycleCount,
    classificationStatus: evaluation.exactResult.classification.status,
    constructionGateStatus: evaluation.constructionGateStatus,
    failedConstructionCheckIds: evaluation.failedConstructionCheckIds,
    objective: scoreMainWireBaselineCandidateObjectiveV1({
      checks: evaluation.exactResult.checks,
      candidate: candidate.candidateInputs,
      numericalFloors,
    }),
    message: null,
  });
}

async function runPoolV1(
  jobs: readonly SearchWorkerJobV1[],
  parallelism: number,
  onCompleted: (execution: SearchWorkerExecutionV1) => void,
): Promise<readonly SearchWorkerExecutionV1[]> {
  let nextIndex = 0;
  const results = new Array<SearchWorkerExecutionV1>(jobs.length);
  const active = new Set<ChildProcessWithoutNullStreams>();
  const stop = () => {
    for (const child of active) child.kill("SIGTERM");
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await Promise.all(Array.from({ length: parallelism }, async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= jobs.length) return;
        const spawned = spawnWorkerV1(jobs[index]);
        active.add(spawned.process);
        let execution: SearchWorkerExecutionV1;
        try {
          execution = await spawned.result;
        } finally {
          active.delete(spawned.process);
        }
        results[index] = execution;
        onCompleted(execution);
      }
    }));
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
  return Object.freeze(results);
}

function spawnWorkerV1(job: SearchWorkerJobV1): Readonly<{
  process: ChildProcessWithoutNullStreams;
  result: Promise<SearchWorkerExecutionV1>;
}> {
  const executable = resolve(process.cwd(), "node_modules/.bin/vite-node");
  const script = fileURLToPath(import.meta.url);
  const encoded = Buffer.from(JSON.stringify(job), "utf8").toString("base64url");
  const child = spawn(executable, [
    "--script",
    script,
    "--worker-job",
    encoded,
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const result = new Promise<SearchWorkerExecutionV1>((resolveResult, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (stdout.length > 2_000_000) {
        child.kill("SIGTERM");
        reject(new Error(`search worker output overflow: ${job.candidate.candidateId}`));
      }
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      if (stderr.length > 100_000) stderr = stderr.slice(-100_000);
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code !== 0) {
        reject(new Error(
          `search worker ${job.candidate.candidateId} exited ${code ?? signal}: `
            + stderr.trim(),
        ));
        return;
      }
      try {
        resolveResult(parseWorkerExecutionV1(JSON.parse(stdout) as unknown));
      } catch (error) {
        reject(new Error(
          `search worker ${job.candidate.candidateId} returned invalid JSON: `
            + (error instanceof Error ? error.message : String(error)),
        ));
      }
    });
  });
  return Object.freeze({ process: child, result });
}

function bestExecutionV1(
  evaluations: readonly SearchWorkerExecutionV1[],
): SearchWorkerExecutionV1 {
  const ranked = evaluations.filter(({ evaluation }) =>
    evaluation.objective !== null).sort(compareExecutionsV1);
  const best = ranked[0];
  if (best === undefined) throw new Error("baseline search produced no scored candidate");
  return best;
}

function compareExecutionsV1(
  left: SearchWorkerExecutionV1,
  right: SearchWorkerExecutionV1,
): number {
  if (left.evaluation.objective === null) return 1;
  if (right.evaluation.objective === null) return -1;
  return compareMainWireBaselineCandidateObjectivesV1(
    left.evaluation.objective,
    right.evaluation.objective,
  );
}

function sameCoordinatesV1(
  left: MainWireBaselineCalibrationCandidateInputsV1,
  right: MainWireBaselineCalibrationCandidateInputsV1,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseNumericalFloorV1(input: unknown): MainWireBaselineNumericalFloorAuditV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("numerical-floor artifact must be an object");
  }
  const record = input as Partial<MainWireBaselineNumericalFloorAuditV1>;
  if (
    record.auditId !== "main-wire-baseline-numerical-floor-audit-v1"
    || record.status !== "completed"
    || !Array.isArray(record.metricFloors)
    || record.metricFloors.length < 1
  ) {
    throw new Error("numerical-floor artifact is incomplete");
  }
  return input as MainWireBaselineNumericalFloorAuditV1;
}

function parseWorkerJobV1(input: unknown): SearchWorkerJobV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("search worker job must be an object");
  }
  const record = input as Record<string, unknown>;
  if (
    record.candidate === null || typeof record.candidate !== "object"
    || record.sourceCheckpoint === null
      || typeof record.sourceCheckpoint !== "object"
    || record.sourceCandidateInputs === null
      || typeof record.sourceCandidateInputs !== "object"
    || !Array.isArray(record.numericalFloors)
  ) {
    throw new Error("search worker job is incomplete");
  }
  return input as SearchWorkerJobV1;
}

function parseWorkerExecutionV1(input: unknown): SearchWorkerExecutionV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("search worker execution must be an object");
  }
  const record = input as Record<string, unknown>;
  if (
    record.evaluation === null || typeof record.evaluation !== "object"
    || record.candidateInputs === null
      || typeof record.candidateInputs !== "object"
  ) {
    throw new Error("search worker execution is incomplete");
  }
  return input as SearchWorkerExecutionV1;
}

function argumentV1(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function requiredArgumentV1(name: string): string {
  const value = argumentV1(name);
  if (value === null) throw new Error(`${name} is required`);
  return value;
}

function positiveIntegerV1(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function gitV1(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

function formatV1(value: number | null): string {
  return value === null ? "-" : value.toFixed(4);
}
