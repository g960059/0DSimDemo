import { spawn, execFileSync, type ChildProcessWithoutNullStreams } from
  "node:child_process";
import { writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import settledBaselineCheckpointJson from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";
import {
  buildMainWireBaselineConditioningAuditV1,
  buildMainWireBaselineConditioningTasksV1,
  evaluateMainWireBaselineConditioningTaskV1,
  type MainWireBaselineConditioningAuditV1,
  type MainWireBaselineConditioningTaskResultV1,
  type MainWireBaselineConditioningTaskV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  validateMainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";

const workerTask = argumentV1("--worker-task");
if (workerTask !== null) {
  await runWorkerV1(workerTask);
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
  const evaluations = await runPoolV1(
    tasks,
    effectiveParallelism,
    (completed, total, result) => {
      process.stderr.write(
        `[conditioning] ${completed}/${total} ${result.task.taskId}: `
          + `${result.evaluationStatus}, `
          + `${Math.round(result.wallTimeMs)} ms, `
          + `${result.completedCycleCount ?? "-"} cycles\n`,
      );
    },
  );
  const batchWallTimeMs = performance.now() - startedAt;
  const audit = await buildMainWireBaselineConditioningAuditV1({
    mode,
    protocolCommit,
    executionCommit,
    requestedParallelism,
    effectiveParallelism,
    batchWallTimeMs,
    evaluations,
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

async function runWorkerV1(encodedTask: string): Promise<void> {
  const decoded = Buffer.from(encodedTask, "base64url").toString("utf8");
  const task = parseTaskV1(JSON.parse(decoded) as unknown);
  const sourceCheckpoint =
    await validateMainWireIntegratedModelStandard68CheckpointV1(
      settledBaselineCheckpointJson,
    );
  const result = await evaluateMainWireBaselineConditioningTaskV1(
    task,
    sourceCheckpoint,
  );
  process.stdout.write(JSON.stringify(result));
}

async function runPoolV1(
  tasks: readonly MainWireBaselineConditioningTaskV1[],
  parallelism: number,
  onCompleted: (
    completed: number,
    total: number,
    result: MainWireBaselineConditioningTaskResultV1,
  ) => void,
): Promise<readonly MainWireBaselineConditioningTaskResultV1[]> {
  let nextIndex = 0;
  let completed = 0;
  const results = new Array<MainWireBaselineConditioningTaskResultV1>(
    tasks.length,
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
        if (index >= tasks.length) return;
        const child = spawnTaskV1(tasks[index]);
        active.add(child.process);
        let result: MainWireBaselineConditioningTaskResultV1;
        try {
          result = await child.result;
        } finally {
          active.delete(child.process);
        }
        results[index] = result;
        completed += 1;
        onCompleted(completed, tasks.length, result);
      }
    }));
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
  return Object.freeze(results);
}

function spawnTaskV1(task: MainWireBaselineConditioningTaskV1): Readonly<{
  process: ChildProcessWithoutNullStreams;
  result: Promise<MainWireBaselineConditioningTaskResultV1>;
}> {
  const executable = resolve(process.cwd(), "node_modules/.bin/vite-node");
  const script = fileURLToPath(import.meta.url);
  const encoded = Buffer.from(JSON.stringify(task), "utf8").toString(
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
  const result = new Promise<MainWireBaselineConditioningTaskResultV1>(
    (resolveResult, reject) => {
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
        if (stdout.length > 2_000_000) {
          child.kill("SIGTERM");
          reject(new Error(`conditioning worker output overflow: ${task.taskId}`));
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
            `conditioning worker ${task.taskId} exited ${code ?? signal}: `
              + stderr.trim(),
          ));
          return;
        }
        try {
          resolveResult(parseTaskResultV1(JSON.parse(stdout) as unknown));
        } catch (error) {
          reject(new Error(
            `conditioning worker ${task.taskId} returned invalid JSON: `
              + (error instanceof Error ? error.message : String(error)),
          ));
        }
      });
    },
  );
  return Object.freeze({ process: child, result });
}

function parseTaskResultV1(
  input: unknown,
): MainWireBaselineConditioningTaskResultV1 {
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
  ) {
    throw new Error(`worker result is incomplete for ${task.taskId}`);
  }
  return input as MainWireBaselineConditioningTaskResultV1;
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

function gitV1(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}
