import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { runMainWireStaticCaseFittingV1 as run, readMainWireStaticCaseFittingResultV1 as read,
  type MainWireStaticCaseFittingRequestV1 as Request, type MainWireCaseReferenceIdV1 as Reference } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/analysis/registry/MainWireStaticCaseFittingSeedV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { readFittingWorkerStdinV1, runFittingJsonWorkersV1 } from "./runFittingJsonWorkersV1";

type Job = { id: string; referenceId: Reference; candidateInputs?: Request["candidateInputs"]; reuseFile?: string; nominalDtSec?: Request["nominalDtSec"] };
async function main() {
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (process.argv.includes("--worker")) {
    const request = await readFittingWorkerStdinV1() as Request;
    const result = await run({ ...request, abortSignal: AbortSignal.timeout(600_000) });
    process.stdout.write(JSON.stringify(result) + "\n"); return;
  }
  const { values } = parseArgs({ options: { output: { type: "string" }, reference: { type: "string" },
    candidate: { type: "string" }, reuse: { type: "string" }, dt: { type: "string" },
    plan: { type: "string" }, workers: { type: "string" }, help: { type: "boolean" } } });
  if (values.help) {
    process.stdout.write("Usage: npm run fit:case -- --output NEW_DIRECTORY --reference baseline|hfref-chronic-dilated-v1 [--candidate FILE] [--reuse RESULT_FILE] [--dt 0.002|0.001]\n"
      + "Batch: --output NEW_DIRECTORY --plan JOB_ARRAY_JSON [--workers 1..8]\n"
      + "Each job contains id, referenceId, optional candidateInputs/reuseFile/nominalDtSec. Results retain input order.\n"
      + "Uses Standard73 finite static anatomy, NOT retained Standard72. Reference selection changes assessment, not equations.\n"
      + "Rest screening only: no automatic optimization, paired-grid qualification, reserve, mint or preset adoption.\n"); return;
  }
  if (!values.output || Boolean(values.plan) === Boolean(values.reference)
    || (values.plan && [values.candidate, values.reuse, values.dt].some(Boolean))) throw new Error("Choose --reference or --plan and a new --output directory");
  const concurrency = Number(values.workers ?? 4);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error("Workers must be 1–8");
  const jobs: Job[] = values.plan ? JSON.parse(await readFile(values.plan, "utf8")) : [{ id: "case", referenceId: values.reference as Reference,
    ...(values.candidate ? { candidateInputs: JSON.parse(await readFile(values.candidate, "utf8")) } : {}),
    ...(values.reuse ? { reuseFile: values.reuse } : {}),
    ...(values.dt ? { nominalDtSec: Number(values.dt) as Request["nominalDtSec"] } : {}) }];
  if (!Array.isArray(jobs) || jobs.length === 0 || jobs.length > 64 || new Set(jobs.map(j => j.id)).size !== jobs.length
    || jobs.some(j => !/^[a-z0-9][a-z0-9-]{0,63}$/.test(j.id)
      || Object.keys(j).some(k => !["id", "referenceId", "candidateInputs", "reuseFile", "nominalDtSec"].includes(k))))
    throw new Error("Require 1–64 uniquely named jobs with known fields");
  const requests = await Promise.all(jobs.map(async j => {
    const saved = j.reuseFile ? await read(JSON.parse(await readFile(j.reuseFile, "utf8"))) : undefined;
    return { referenceId: j.referenceId, candidateInputs: j.candidateInputs ?? saved?.candidateInputs ?? seed(j.referenceId),
      ...(saved ? { reuse: saved } : {}), nominalDtSec: j.nominalDtSec ?? .002 };
  }));
  const output = resolve(values.output); await mkdir(output);
  const snapshot = await beginFittingSourceSnapshotV1(join(output, "execution"));
  const started = performance.now(), files: string[] = [];
  const save = async (name: string, value: unknown) => {
    const path = join(output, name); await writeFile(path, JSON.stringify(value, null, 2) + "\n", { flag: "wx" }); files.push(path);
  };
  await save("plan.json", { jobs, sourceSha256: snapshot.sourceSha256, concurrency,
    scope: "research-periodic-rest-screen", publicPromotionAuthorized: false });
  try {
    const results = await runFittingJsonWorkersV1<Awaited<ReturnType<typeof run>>>({
      scriptPath: fileURLToPath(import.meta.url), concurrency, signal: AbortSignal.timeout(1_800_000),
      jobs: requests.map(r => ({ args: ["--worker"], input: JSON.stringify({ ...r, sourceSha256: snapshot.sourceSha256 }) })) });
    const summary = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i]!, id = jobs[i]!.id;
      await save(`${id}.json`, result.status === "saved-result-ready" ? result.result : result);
      if (result.status === "saved-result-ready") {
        await read(result.result);
        summary.push({ id, status: result.status, rest: result.result.rest.status,
          initialization: result.result.initialization.kind, cycles: result.result.execution.completedCycleCount,
          wallTimeMs: result.result.wallTimeMs, referenceId: result.result.rest.referenceId });
      } else summary.push({ id, ...result });
    }
    const report = { jobs: summary, wallTimeMs: performance.now() - started, publicPromotionAuthorized: false };
    await save("report.json", report); process.stdout.write(JSON.stringify(report) + "\n");
    if (results.some(r => r.status !== "saved-result-ready")) process.exitCode = 1;
  } catch (error) {
    await save("failure.json", { status: "operational-failure", message: error instanceof Error ? error.message : String(error) });
    throw error;
  } finally { await snapshot.finish(files); }
}
await main();
