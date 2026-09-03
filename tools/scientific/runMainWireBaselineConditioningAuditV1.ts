import { spawn, execFileSync, type ChildProcessWithoutNullStreams } from
  "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import settledBaselineCheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";
import {
  buildMainWireBaselineConditioningCenterConstructionV1,
  createMainWireBaselineConditioningCenterCacheArtifactV1,
  validateMainWireBaselineConditioningCenterCacheArtifactV1,
  type MainWireBaselineConditioningCenterConstructionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningCenterCacheV1";
import {
  buildMainWireBaselineConditioningAuditV1,
  buildMainWireBaselineConditioningTasksV1,
  executeMainWireBaselineConditioningTaskAtNominalDtV1,
  verifyMainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningTaskResultV1,
  type MainWireBaselineConditioningTaskV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  buildMainWireBaselineConditioningRefinedDerivativeAuditV1,
  buildMainWireBaselineConditioningRefinedTasksV1,
  MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningRefinedDerivativeAuditV1";
import {
  buildMainWireBaselineConditioningPerturbationAttributionV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningPerturbationAttributionV1";
import {
  validateMainWireIntegratedModelStandard70CheckpointV1,
  type MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";

const workerTask = argumentV1("--worker-task");
if (workerTask !== null) {
  await runWorkerV1(workerTask);
} else if (hasFlagV1("--perturbation-attribution")) {
  await runPerturbationAttributionV1();
} else if (hasFlagV1("--refined-derivative-audit")) {
  await runRefinedDerivativeCoordinatorV1();
} else {
  await runCoordinatorV1();
}

async function runCoordinatorV1(): Promise<void> {
  const mode = parseModeV1(argumentV1("--mode") ?? "rest-pilot");
  const requestedParallelism = parsePositiveIntegerV1(
    argumentV1("--parallelism") ?? "8",
    "parallelism",
  );
  const maximumParallelism = Math.max(1, availableParallelism() - 1);
  const tasks = buildMainWireBaselineConditioningTasksV1({ mode });
  const effectiveParallelism = Math.min(
    requestedParallelism,
    maximumParallelism,
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
      .maximumParallelEvaluations,
    tasks.length,
  );
  const protocolCommit = gitV1([
    "log",
    "-1",
    "--format=%H",
    "--",
    "analysis/policies/mainWire/MainWireBaselineConditioningStudyV1.ts",
  ]);
  const executionCommit = gitV1(["rev-parse", "HEAD"]);
  process.stderr.write(
    `[conditioning] ${mode}: ${tasks.length} tasks, `
      + `${effectiveParallelism} workers\n`,
  );
  const startedAt = performance.now();
  let completed = 0;
  const progress = (result: MainWireBaselineConditioningTaskResultV1) => {
    completed += 1;
    process.stderr.write(
      `[conditioning] ${completed}/${tasks.length} ${result.task.taskId}: `
        + `${result.evaluationStatus}, `
        + `${Math.round(result.wallTimeMs)} ms, `
        + `${result.completedCycleCount ?? "-"} cycles\n`,
    );
  };
  const centerTasks = tasks.filter(({ coordinateId }) => coordinateId === null);
  const perturbationTasks = tasks.filter(({ coordinateId }) =>
    coordinateId !== null);
  const centerCacheRequested = !hasFlagV1("--no-center-checkpoint-cache");
  const centerCacheDirectory = resolve(
    argumentV1("--center-checkpoint-cache-dir")
      ?? "artifacts/main-wire-baseline-conditioning-v1/condition-centers",
  );
  let centerCacheEffective = centerCacheRequested;
  if (centerCacheEffective) {
    try {
      await mkdir(centerCacheDirectory, { recursive: true });
    } catch (error) {
      centerCacheEffective = false;
      process.stderr.write(
        `[conditioning] center cache disabled: ${errorMessageV1(error)}\n`,
      );
    }
  }
  const centerCacheLookups = await Promise.all(centerTasks.map((task) =>
    loadCenterCacheV1(
      task.conditionId,
      centerCacheEffective,
      centerCacheDirectory,
    )));
  if (centerCacheEffective) {
    process.stderr.write(
      `[conditioning] center cache: `
        + `${centerCacheLookups.filter(({ status }) => status === "hit").length} hit, `
        + `${centerCacheLookups.filter(({ status }) => status === "miss").length} miss, `
        + `${centerCacheLookups.filter(({ status }) => status === "rejected").length} rejected\n`,
    );
  }
  const lookupByTaskId = new Map(centerTasks.map((task, index) =>
    [task.taskId, centerCacheLookups[index]] as const));
  const initialCenterJobs = centerTasks.map((task, index) => {
    const lookup = centerCacheLookups[index];
    return lookup.status === "hit"
      ? Object.freeze({
          task,
          sourceAnchorKind: "verified-condition-cache" as const,
          sourceCheckpoint: lookup.checkpoint,
          returnCheckpoint: true,
          nominalDtSec:
            MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
              .explorationNominalDtSec,
        })
      : defaultCenterJobV1(task);
  });
  const initialCenterExecutions = await runPoolV1(
    initialCenterJobs,
    effectiveParallelism,
    ({ result }) => {
      const lookup = lookupByTaskId.get(result.task.taskId);
      if (lookup?.status === "hit" && !centerResultAdmittedV1(result)) {
        process.stderr.write(
          `[conditioning] center cache reconfirmation failed: `
            + `${result.task.conditionId}; recomputing from the declared anchor\n`,
        );
        return;
      }
      progress(result);
    },
  );
  const centerExecutions = [...initialCenterExecutions];
  const fallbackCenters = initialCenterExecutions.flatMap(
    (execution, index) =>
      centerCacheLookups[index].status === "hit"
        && !centerResultAdmittedV1(execution.result)
        ? [Object.freeze({ index, job: defaultCenterJobV1(centerTasks[index]) })]
        : [],
  );
  if (fallbackCenters.length > 0) {
    const fallbackExecutions = await runPoolV1(
      fallbackCenters.map(({ job }) => job),
      Math.min(effectiveParallelism, fallbackCenters.length),
      ({ result }) => progress(result),
    );
    fallbackCenters.forEach(({ index }, fallbackIndex) => {
      centerExecutions[index] = fallbackExecutions[fallbackIndex];
    });
  }
  const fallbackConditionIds = new Set(fallbackCenters.map(({ index }) =>
    centerTasks[index].conditionId));
  const checkpointByCondition = new Map<string,
    MainWireIntegratedModelStandard70CheckpointV1>();
  for (const [index, execution] of centerExecutions.entries()) {
    if (
      execution.acceptedCheckpoint === null
      || !centerResultAdmittedV1(execution.result)
    ) {
      throw new Error(
        `conditioning center failed exact or safety admission: `
          + execution.result.task.conditionId,
      );
    }
    const lookup = centerCacheLookups[index];
    const selectedCheckpoint = lookup.status === "hit"
      && !fallbackConditionIds.has(execution.result.task.conditionId)
      ? lookup.checkpoint!
      : execution.acceptedCheckpoint;
    checkpointByCondition.set(
      execution.result.task.conditionId,
      selectedCheckpoint,
    );
  }
  let centerCacheWriteCount = 0;
  let centerCacheWriteFailureCount = 0;
  if (centerCacheEffective) {
    await Promise.all(centerExecutions.map(async (execution, index) => {
      const lookup = centerCacheLookups[index];
      if (
        lookup.status === "hit"
        && !fallbackConditionIds.has(execution.result.task.conditionId)
      ) return;
      try {
        await writeCenterCacheV1(
          lookup,
          execution.acceptedCheckpoint!,
        );
        centerCacheWriteCount += 1;
      } catch (error) {
        centerCacheWriteFailureCount += 1;
        process.stderr.write(
          `[conditioning] center cache write failed for `
            + `${execution.result.task.conditionId}: ${errorMessageV1(error)}\n`,
        );
      }
    }));
  }
  const perturbationExecutions = await runPoolV1(
    perturbationTasks.map((task) => {
      const sourceCheckpoint = checkpointByCondition.get(task.conditionId);
      if (sourceCheckpoint === undefined) {
        throw new Error(`conditioning center checkpoint is missing: ${task.conditionId}`);
      }
      return Object.freeze({
        task,
        sourceAnchorKind: "condition-center" as const,
        sourceCheckpoint,
        returnCheckpoint: false,
        nominalDtSec:
          MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
            .explorationNominalDtSec,
      });
    }),
    effectiveParallelism,
    ({ result }) => progress(result),
  );
  const evaluations = [
    ...centerExecutions.map(({ result }) => result),
    ...perturbationExecutions.map(({ result }) => result),
  ];
  const batchWallTimeMs = performance.now() - startedAt;
  const audit = await buildMainWireBaselineConditioningAuditV1({
    mode,
    protocolCommit,
    executionCommit,
    requestedParallelism,
    effectiveParallelism,
    batchWallTimeMs,
    evaluations,
    centerCheckpointCache: Object.freeze({
      policy:
        MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.conditioningPolicy
          .centerCheckpointReuse,
      requested: centerCacheRequested,
      effective: centerCacheEffective,
      hitCount: centerCacheLookups.filter(({ status }) => status === "hit")
        .length,
      missCount: centerCacheLookups.filter(({ status }) => status === "miss")
        .length,
      rejectedEntryCount: centerCacheLookups.filter(({ status }) =>
        status === "rejected").length,
      reconfirmationFallbackCount: fallbackCenters.length,
      writeCount: centerCacheWriteCount,
      writeFailureCount: centerCacheWriteFailureCount,
    }),
  });
  const serialized = `${JSON.stringify(audit, null, 2)}\n`;
  const output = argumentV1("--output");
  if (output === null) {
    process.stdout.write(serialized);
  } else {
    const outputPath = resolve(output);
    await writeFile(outputPath, serialized, "utf8");
    process.stdout.write(`${outputPath}\n`);
  }
}

async function runRefinedDerivativeCoordinatorV1(): Promise<void> {
  const coarseAuditPath = resolve(requiredArgumentV1("--coarse-audit"));
  const coarseAuditInput = JSON.parse(
    await readFile(coarseAuditPath, "utf8"),
  ) as unknown;
  const coarseAudit = await verifyMainWireBaselineConditioningAuditV1(
    coarseAuditInput,
  );
  if (
    coarseAudit.status !== "completed"
    || coarseAudit.mode !== "primary-envelope"
  ) {
    throw new Error(
      "refined derivative audit requires a completed primary-envelope audit",
    );
  }
  const requestedParallelism = parsePositiveIntegerV1(
    argumentV1("--parallelism") ?? "8",
    "parallelism",
  );
  const tasks = buildMainWireBaselineConditioningRefinedTasksV1();
  const effectiveParallelism = Math.min(
    requestedParallelism,
    Math.max(1, availableParallelism() - 1),
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
      .maximumParallelEvaluations,
    tasks.length,
  );
  const refinedNominalDtSec =
    MAIN_WIRE_BASELINE_CONDITIONING_REFINED_DERIVATIVE_POLICY_V1
      .refinedNominalDtSec;
  const protocolCommit = gitV1([
    "log",
    "-1",
    "--format=%H",
    "--",
    "analysis/methods/mainWire/"
      + "MainWireBaselineConditioningRefinedDerivativeAuditV1.ts",
  ]);
  const executionCommit = gitV1(["rev-parse", "HEAD"]);
  const cacheDirectory = resolve(
    argumentV1("--coarse-center-checkpoint-cache-dir")
      ?? "artifacts/main-wire-baseline-conditioning-v1/condition-centers",
  );
  const centerTasks = tasks.filter(({ coordinateId }) => coordinateId === null);
  const perturbationTasks = tasks.filter(({ coordinateId }) =>
    coordinateId !== null);
  process.stderr.write(
    `[conditioning-refined] ${tasks.length} tasks at ${refinedNominalDtSec} s, `
      + `${effectiveParallelism} workers\n`,
  );
  const lookups = await Promise.all(centerTasks.map((task) =>
    loadCenterCacheV1(task.conditionId, true, cacheDirectory)));
  const centerJobs = centerTasks.map((task, index): WorkerJobV1 => {
    const lookup = lookups[index];
    if (
      lookup.status !== "hit"
      || lookup.checkpoint === null
      || lookup.construction === null
    ) {
      throw new Error(
        `refined derivative audit requires the verified coarse center cache: `
          + task.conditionId,
      );
    }
    return Object.freeze({
      task,
      sourceAnchorKind: "verified-condition-cache" as const,
      sourceCheckpoint: lookup.checkpoint,
      returnCheckpoint: true,
      nominalDtSec: refinedNominalDtSec,
    });
  });
  const startedAt = performance.now();
  let completed = 0;
  const progress = (result: MainWireBaselineConditioningTaskResultV1) => {
    completed += 1;
    process.stderr.write(
      `[conditioning-refined] ${completed}/${tasks.length} `
        + `${result.task.taskId}: ${result.evaluationStatus}, `
        + `${Math.round(result.wallTimeMs)} ms\n`,
    );
  };
  const centerExecutions = await runPoolV1(
    centerJobs,
    Math.min(effectiveParallelism, centerJobs.length),
    ({ result }) => progress(result),
  );
  const refinedCheckpointByCondition = new Map<string,
    MainWireIntegratedModelStandard70CheckpointV1>();
  const centerSources = centerExecutions.map((execution, index) => {
    const lookup = lookups[index];
    if (
      !centerResultAdmittedV1(execution.result)
      || execution.acceptedCheckpoint === null
      || lookup.checkpoint === null
      || lookup.construction === null
    ) {
      throw new Error(
        `refined derivative center failed exact or safety admission: `
          + execution.result.task.conditionId,
      );
    }
    refinedCheckpointByCondition.set(
      execution.result.task.conditionId,
      execution.acceptedCheckpoint,
    );
    return Object.freeze({
      conditionId: execution.result.task.conditionId,
      coarseConstructionIdentitySha256:
        lookup.construction.constructionIdentitySha256,
      coarseCheckpointSha256: lookup.checkpoint.checkpointSha256,
      refinedCheckpointSha256:
        execution.acceptedCheckpoint.checkpointSha256,
    });
  });
  const perturbationJobs = perturbationTasks.map((task): WorkerJobV1 => {
    const sourceCheckpoint = refinedCheckpointByCondition.get(task.conditionId);
    if (sourceCheckpoint === undefined) {
      throw new Error(
        `refined condition center is missing: ${task.conditionId}`,
      );
    }
    return Object.freeze({
      task,
      sourceAnchorKind: "condition-center" as const,
      sourceCheckpoint,
      returnCheckpoint: false,
      nominalDtSec: refinedNominalDtSec,
    });
  });
  const perturbationExecutions = await runPoolV1(
    perturbationJobs,
    effectiveParallelism,
    ({ result }) => progress(result),
  );
  const batchWallTimeMs = performance.now() - startedAt;
  const audit =
    await buildMainWireBaselineConditioningRefinedDerivativeAuditV1({
      coarseAudit: coarseAuditInput,
      fineEvaluations: Object.freeze([
        ...centerExecutions.map(({ result }) => Object.freeze({
          nominalDtSec: refinedNominalDtSec,
          taskResult: result,
        })),
        ...perturbationExecutions.map(({ result }) => Object.freeze({
          nominalDtSec: refinedNominalDtSec,
          taskResult: result,
        })),
      ]),
      centerSources,
      protocolCommit,
      executionCommit,
      requestedParallelism,
      effectiveParallelism,
      batchWallTimeMs,
      refinedNominalDtSec,
    });
  const serialized = `${JSON.stringify(audit, null, 2)}\n`;
  const output = argumentV1("--output");
  if (output === null) {
    process.stdout.write(serialized);
  } else {
    const outputPath = resolve(output);
    await writeFile(outputPath, serialized, "utf8");
    process.stdout.write(`${outputPath}\n`);
  }
}

async function runPerturbationAttributionV1(): Promise<void> {
  const coarseAuditInput = JSON.parse(await readFile(
    resolve(requiredArgumentV1("--coarse-audit")),
    "utf8",
  )) as unknown;
  const refinedAuditInput = JSON.parse(await readFile(
    resolve(requiredArgumentV1("--refined-audit")),
    "utf8",
  )) as unknown;
  const attribution =
    await buildMainWireBaselineConditioningPerturbationAttributionV1(
      coarseAuditInput,
      refinedAuditInput,
    );
  const serialized = `${JSON.stringify(attribution, null, 2)}\n`;
  const output = argumentV1("--output");
  if (output === null) {
    process.stdout.write(serialized);
  } else {
    const outputPath = resolve(output);
    await writeFile(outputPath, serialized, "utf8");
    process.stdout.write(`${outputPath}\n`);
  }
}

type CenterCacheLookupV1 = Readonly<{
  status: "disabled" | "hit" | "miss" | "rejected";
  construction: MainWireBaselineConditioningCenterConstructionV1 | null;
  cachePath: string | null;
  checkpoint: MainWireIntegratedModelStandard70CheckpointV1 | null;
}>;

async function loadCenterCacheV1(
  conditionId: string,
  enabled: boolean,
  cacheDirectory: string,
): Promise<CenterCacheLookupV1> {
  if (!enabled) {
    return Object.freeze({
      status: "disabled" as const,
      construction: null,
      cachePath: null,
      checkpoint: null,
    });
  }
  const construction =
    await buildMainWireBaselineConditioningCenterConstructionV1(conditionId);
  const cachePath = join(
    cacheDirectory,
    `${construction.constructionIdentitySha256}.json`,
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(cachePath, "utf8")) as unknown;
  } catch (error) {
    if (isMissingFileV1(error)) {
      return Object.freeze({
        status: "miss" as const,
        construction,
        cachePath,
        checkpoint: null,
      });
    }
    process.stderr.write(
      `[conditioning] center cache entry rejected for ${conditionId}: `
        + `${errorMessageV1(error)}\n`,
    );
    return Object.freeze({
      status: "rejected" as const,
      construction,
      cachePath,
      checkpoint: null,
    });
  }
  try {
    const artifact =
      await validateMainWireBaselineConditioningCenterCacheArtifactV1(
        parsed,
        construction,
      );
    return Object.freeze({
      status: "hit" as const,
      construction,
      cachePath,
      checkpoint: artifact.checkpoint,
    });
  } catch (error) {
    process.stderr.write(
      `[conditioning] center cache entry rejected for ${conditionId}: `
        + `${errorMessageV1(error)}\n`,
    );
    return Object.freeze({
      status: "rejected" as const,
      construction,
      cachePath,
      checkpoint: null,
    });
  }
}

async function writeCenterCacheV1(
  lookup: CenterCacheLookupV1,
  checkpoint: MainWireIntegratedModelStandard70CheckpointV1,
): Promise<void> {
  if (lookup.construction === null || lookup.cachePath === null) {
    throw new Error("conditioning center cache destination is unavailable");
  }
  const artifact =
    await createMainWireBaselineConditioningCenterCacheArtifactV1(
      lookup.construction,
      checkpoint,
    );
  const temporaryPath = `${lookup.cachePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(artifact)}\n`, "utf8");
  await rename(temporaryPath, lookup.cachePath);
}

function defaultCenterJobV1(
  task: MainWireBaselineConditioningTaskV1,
): WorkerJobV1 {
  return Object.freeze({
    task,
    sourceAnchorKind: task.conditionId === "rest-hr70"
      ? "cold" as const
      : "standard-baseline" as const,
    sourceCheckpoint: settledBaselineCheckpointJson,
    returnCheckpoint: true,
    nominalDtSec:
      MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
        .explorationNominalDtSec,
  });
}

async function runWorkerV1(encodedTask: string): Promise<void> {
  const decoded = Buffer.from(encodedTask, "base64url").toString("utf8");
  const job = parseWorkerJobV1(JSON.parse(decoded) as unknown);
  const sourceCheckpoint =
    await validateMainWireIntegratedModelStandard70CheckpointV1(
      job.sourceCheckpoint,
    );
  const execution = await executeMainWireBaselineConditioningTaskAtNominalDtV1(
    job.task,
    sourceCheckpoint,
    job.sourceAnchorKind,
    job.nominalDtSec,
  );
  process.stdout.write(JSON.stringify(Object.freeze({
    result: execution.result,
    acceptedCheckpoint: job.returnCheckpoint
      ? execution.acceptedCheckpoint
      : null,
  })));
}

async function runPoolV1(
  jobs: readonly WorkerJobV1[],
  parallelism: number,
  onCompleted: (
    execution: WorkerExecutionV1,
  ) => void,
): Promise<readonly WorkerExecutionV1[]> {
  let nextIndex = 0;
  const results = new Array<WorkerExecutionV1>(
    jobs.length,
  );
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
        const child = spawnTaskV1(jobs[index]);
        active.add(child.process);
        let result: WorkerExecutionV1;
        try {
          result = await child.result;
        } finally {
          active.delete(child.process);
        }
        results[index] = result;
        onCompleted(result);
      }
    }));
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
  return Object.freeze(results);
}

function spawnTaskV1(job: WorkerJobV1): Readonly<{
  process: ChildProcessWithoutNullStreams;
  result: Promise<WorkerExecutionV1>;
}> {
  const executable = resolve(process.cwd(), "node_modules/.bin/vite-node");
  const script = fileURLToPath(import.meta.url);
  const encoded = Buffer.from(JSON.stringify(job), "utf8").toString(
    "base64url",
  );
  const child = spawn(executable, [
    "--script",
    script,
    "--worker-task",
    encoded,
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const result = new Promise<WorkerExecutionV1>(
    (resolveResult, reject) => {
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
        if (stdout.length > 2_000_000) {
          child.kill("SIGTERM");
          reject(new Error(
            `conditioning worker output overflow: ${job.task.taskId}`,
          ));
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
            `conditioning worker ${job.task.taskId} exited ${code ?? signal}: `
              + stderr.trim(),
          ));
          return;
        }
        try {
          resolveResult(parseWorkerExecutionV1(JSON.parse(stdout) as unknown));
        } catch (error) {
          reject(new Error(
            `conditioning worker ${job.task.taskId} returned invalid JSON: `
              + (error instanceof Error ? error.message : String(error)),
          ));
        }
      });
    },
  );
  return Object.freeze({ process: child, result });
}

type WorkerJobV1 = Readonly<{
  task: MainWireBaselineConditioningTaskV1;
  sourceAnchorKind:
    MainWireBaselineConditioningTaskResultV1["sourceAnchorKind"];
  sourceCheckpoint: unknown;
  returnCheckpoint: boolean;
  nominalDtSec: number;
}>;

type WorkerExecutionV1 = Readonly<{
  result: MainWireBaselineConditioningTaskResultV1;
  acceptedCheckpoint: MainWireIntegratedModelStandard70CheckpointV1 | null;
}>;

function parseWorkerExecutionV1(input: unknown): WorkerExecutionV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("worker execution must be an object");
  }
  const record = input as Record<string, unknown>;
  const result = parseTaskResultV1(record.result);
  const acceptedCheckpoint = record.acceptedCheckpoint === null
    ? null
    : record.acceptedCheckpoint as MainWireIntegratedModelStandard70CheckpointV1;
  return Object.freeze({ result, acceptedCheckpoint });
}

function parseTaskResultV1(input: unknown): MainWireBaselineConditioningTaskResultV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("worker result must be an object");
  }
  const record = input as Partial<MainWireBaselineConditioningTaskResultV1>;
  const task = parseTaskV1(record.task);
  if (
    typeof record.evaluationStatus !== "string"
    || typeof record.wallTimeMs !== "number"
    || !Number.isFinite(record.wallTimeMs)
    || !Array.isArray(record.checks)
    || !Array.isArray(record.failedConstructionCheckIds)
    || !Array.isArray(record.failedObjectiveCheckIds)
    || !Array.isArray(record.failedSafetySentinelCheckIds)
    || (record.evaluationStatus === "accepted"
      && (record.objectiveGateStatus !== "passed"
        && record.objectiveGateStatus !== "failed"))
    || (record.evaluationStatus === "accepted"
      && (record.safetySentinelStatus !== "passed"
        && record.safetySentinelStatus !== "failed"))
  ) {
    throw new Error(`worker result is incomplete for ${task.taskId}`);
  }
  return input as MainWireBaselineConditioningTaskResultV1;
}

function centerResultAdmittedV1(
  result: MainWireBaselineConditioningTaskResultV1,
): boolean {
  return result.evaluationStatus === "accepted"
    && result.safetySentinelStatus === "passed";
}

function parseWorkerJobV1(input: unknown): WorkerJobV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("conditioning worker job must be an object");
  }
  const record = input as Record<string, unknown>;
  const task = parseTaskV1(record.task);
  if (
    (record.sourceAnchorKind !== "cold"
      && record.sourceAnchorKind !== "standard-baseline"
      && record.sourceAnchorKind !== "condition-center"
      && record.sourceAnchorKind !== "verified-condition-cache")
    || typeof record.returnCheckpoint !== "boolean"
    || typeof record.nominalDtSec !== "number"
    || !(record.nominalDtSec > 0)
    || !Number.isFinite(record.nominalDtSec)
    || record.sourceCheckpoint === null
    || typeof record.sourceCheckpoint !== "object"
  ) {
    throw new Error(`conditioning worker job is invalid: ${task.taskId}`);
  }
  return input as WorkerJobV1;
}

function parseTaskV1(input: unknown): MainWireBaselineConditioningTaskV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("conditioning task must be an object");
  }
  const record = input as Record<string, unknown>;
  if (
    typeof record.taskId !== "string"
    || typeof record.conditionId !== "string"
    || (record.coordinateId !== null && typeof record.coordinateId !== "string")
    || (record.direction !== -1
      && record.direction !== 0
      && record.direction !== 1)
    || (record.stepFraction !== 0
      && record.stepFraction !== 0.5
      && record.stepFraction !== 1)
  ) {
    throw new Error("conditioning task fields are invalid");
  }
  return input as MainWireBaselineConditioningTaskV1;
}

function parseModeV1(value: string): MainWireBaselineConditioningAuditV1["mode"] {
  if (
    value !== "rest-pilot"
    && value !== "primary-envelope"
    && value !== "full-envelope"
  ) {
    throw new Error(`unsupported conditioning mode: ${value}`);
  }
  return value;
}

function parsePositiveIntegerV1(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
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

function hasFlagV1(name: string): boolean {
  return process.argv.includes(name);
}

function isMissingFileV1(error: unknown): boolean {
  return error !== null
    && typeof error === "object"
    && "code" in error
    && error.code === "ENOENT";
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function gitV1(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}
