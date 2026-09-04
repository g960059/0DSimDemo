import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { evaluateMainWireStandard70BaselineCalibrationCandidateV1 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { MAIN_WIRE_BASELINE_SYNTHETIC_RECOVERY_V1 as policy, recoveryResidualV1,
  runMainWireBaselineSyntheticRecoveryV1, type RecoveryControlV1, type RecoveryStartV1 } from
  "@/analysis/methods/mainWire/MainWireBaselineSyntheticRecoveryV1";
import { mapDesignInOrderV1 } from "./mainWireBaselineDesignExecutionV1";

const { values } = parseArgs({ options: { output: { type: "string" }, parallelism: { type: "string", default: "4" },
  worker: { type: "boolean" }, control: { type: "string" }, start: { type: "string" }, help: { type: "boolean" } } });
if (values.help) {
  process.stdout.write("Usage: npm run recover:baseline:synthetic -- --output NEW_DIRECTORY [--parallelism 1..4]\n"
    + "Runs two frozen synthetic controls from two frozen starts. Local smoke only; no model/baseline adoption.\n"
    + "At most 20 exact evaluations per job (17 search + target + cold/refined finalist), 15-minute job timeout.\n"
    + "Requires a clean committed worktree; outputs never overwrite prior evidence.\n");
  process.exit(0);
}
if (!values.output) throw new Error("--output NEW_DIRECTORY is required");
if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) {
  throw new Error("synthetic recovery requires a clean committed worktree");
}
const executionCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const output = resolve(values.output);
await mkdir(output); // No overwrite or reuse of an incomplete run.
const started = performance.now();
type Result = Awaited<ReturnType<typeof runMainWireBaselineSyntheticRecoveryV1>>;
if (values.worker) {
  if (!Object.hasOwn(policy.controls, values.control ?? "") || !Object.hasOwn(policy.starts, values.start ?? "")) {
    throw new Error("worker requires a declared control and start");
  }
  const selection = { controlId: values.control as RecoveryControlV1, startId: values.start as RecoveryStartV1 };
  let index = 0;
  let executionTier = "full-invariant" as "full-invariant" | "hot-path-lean";
  await writeJson("protocol.json", { executionCommit, selection, policy,
    reference: resolveMainWireFittingReferenceV1("baseline"), maximumWallTimeMs: 900_000 });
  try {
    const result = await runMainWireBaselineSyntheticRecoveryV1(selection, async (request) => {
      // Target/start/final cold and refined evaluations retain full invariants;
      // only nearby incumbent continuation uses the existing admitted lean tier.
      executionTier = request.initialization?.kind === "standard70-parameter-continuation" ? "hot-path-lean" : "full-invariant";
      selectHotPathIntegrityTierV1(executionTier);
      await writeJson(`${index}.request.json`, request); // Survives a worker failure.
      return evaluateMainWireStandard70BaselineCalibrationCandidateV1(request);
    }, async ({ ordinal, stage, evaluation }) => {
      if (ordinal !== index) throw new Error("recovery evidence ordering mismatch");
      await writeJson(`${index}.result.json`, { ...evaluation, executionTier });
      await writeJson(`${index}.record.json`, { ordinal, stage, executionTier,
        requestIdentitySha256: evaluation.requestIdentitySha256, status: evaluation.status });
      process.stderr.write(`[recovery ${selection.controlId}/${selection.startId}] ${index++} ${stage}: ${evaluation.status}\n`);
    });
    await writeJson("result.json", { executionCommit, wallTimeMs: performance.now() - started, result });
  } catch (error) {
    await writeJson("failure.json", { executionCommit, completedEvaluationCount: index,
      status: "operational-or-provenance-failure", message: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  }
} else {
  const parallelism = Number(values.parallelism);
  if (!Number.isInteger(parallelism) || parallelism < 1 || parallelism > 4) throw new Error("--parallelism must be 1..4");
  const jobs = (Object.keys(policy.controls) as RecoveryControlV1[]).flatMap((controlId) =>
    (Object.keys(policy.starts) as RecoveryStartV1[]).map((startId) => ({ controlId, startId })));
  await writeJson("protocol.json", { executionCommit, policy, policyIdentitySha256: await sha256CanonicalJsonHex(policy),
    reference: resolveMainWireFittingReferenceV1("baseline"), parallelism, jobs,
    targetExecution: "independent-cold-target-per-start-no-shared-target-checkpoint", maximumWallTimePerJobMs: 900_000 });
  const runs = await mapDesignInOrderV1(jobs, parallelism, async (job) => {
    const directory = resolve(output, `${job.controlId}-${job.startId}`);
    const outcome = await new Promise<{ code: number | null; timedOut: boolean }>((done, reject) => {
      const child = spawn(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script",
        "tools/scientific/runMainWireBaselineSyntheticRecoveryV1.ts", "--worker", "--control", job.controlId,
        "--start", job.startId, "--output", directory], { stdio: "inherit" });
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; child.kill("SIGTERM"); }, 900_000);
      child.once("error", (error) => { clearTimeout(timer); reject(error); });
      child.once("exit", (code) => { clearTimeout(timer); done({ code, timedOut }); });
    });
    let result: Result | null = null;
    if (outcome.code === 0) result = JSON.parse(await readFile(resolve(directory, "result.json"), "utf8")).result as Result;
    return { ...job, directory, ...outcome, result };
  });
  const comparisons = (Object.keys(policy.controls) as RecoveryControlV1[]).map((controlId) => {
    const pair = runs.filter((run) => run.controlId === controlId);
    const [a, b] = pair.map((run) => run.result && "search" in run.result ? run.result.search : null);
    const comparable = a?.best.evaluation.assessment.status === "admitted" && b?.best.evaluation.assessment.status === "admitted";
    return { controlId, status: comparable ? "compared" : "unresolved",
      maximumNormalizedOutputDifference: comparable ? recoveryResidualV1(a.best.evaluation.observations, b.best.evaluation.observations) : null,
      candidatePointsEqual: comparable ? JSON.stringify(a.best.point) === JSON.stringify(b.best.point) : null,
      claim: "two-start-local-output-comparison-not-unique-parameter-identification" };
  });
  const passed = runs.every((run) => run.result?.status === "local-smoke-passed")
    && comparisons.every((comparison) => comparison.maximumNormalizedOutputDifference !== null
      && comparison.maximumNormalizedOutputDifference <= policy.maximumNormalizedTargetResidual);
  await writeJson("result.json", { executionCommit, wallTimeMs: performance.now() - started,
    status: passed ? "local-smoke-passed" : "local-smoke-unresolved", runs, comparisons,
    finalQualificationPending: policy.qualificationPending, claims: policy.claims });
  process.stdout.write(`${output}/result.json\n`);
  if (!passed) process.exitCode = 1;
}
async function writeJson(name: string, value: unknown) {
  await writeFile(resolve(output, name), `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
}
