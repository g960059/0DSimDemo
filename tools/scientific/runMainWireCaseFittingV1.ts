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
import { searchMainWireCaseFittingV1 as search, MAIN_WIRE_CASE_FITTING_COORDINATES_V1 as coordinates,
  type MainWireCaseFittingCoordinateIdV1 as CoordinateId } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";

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
    plan: { type: "string" }, workers: { type: "string" }, help: { type: "boolean" }, optimize: { type: "boolean" },
    budget: { type: "string" }, minutes: { type: "string" }, coordinates: { type: "string" } } });
  if (values.help) {
    process.stdout.write("Usage: npm run fit:case -- --output NEW_DIRECTORY --reference baseline|hfref-chronic-dilated-v1 [--candidate FILE] [--reuse RESULT_FILE] [--dt 0.002|0.001]\n"
      + "Batch: --output NEW_DIRECTORY --plan JOB_ARRAY_JSON [--workers 1..8]\n"
      + "Each job contains id, referenceId, optional candidateInputs/reuseFile/nominalDtSec. Results retain input order.\n"
      + "Uses Standard73 finite static anatomy, NOT retained Standard72. Reference selection changes assessment, not equations.\n"
      + "Search: --reference REFERENCE --optimize [--budget 25] [--minutes 10] [--workers 4] [--coordinates tbv,systemic-resistance,arterial-stiffness,lv-active]\n"
      + "Search uses current registry intervals, not invented normal ranges or a unique patient estimate.\n"
      + "Rest screening/search only: no paired-grid qualification, reserve, mint or preset adoption.\n"); return;
  }
  if (!values.output || Boolean(values.plan) === Boolean(values.reference)
    || (values.plan && [values.candidate, values.reuse, values.dt].some(Boolean))) throw new Error("Choose --reference or --plan and a new --output directory");
  const concurrency = Number(values.workers ?? 4);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error("Workers must be 1–8");
  if (values.optimize && values.plan || !values.optimize && [values.budget, values.minutes, values.coordinates].some(Boolean))
    throw new Error("Search options require --reference and --optimize, not --plan");
  const budget = Number(values.budget ?? 25), minutes = Number(values.minutes ?? 10);
  const coordinateIds = values.coordinates ? values.coordinates.split(",") as CoordinateId[] : coordinates.map(d => d.id);
  if (values.optimize && (!Number.isInteger(budget) || budget < 1 || budget > 128 || !Number.isFinite(minutes) || minutes <= 0 || minutes > 60
    || !coordinateIds.length || new Set(coordinateIds).size !== coordinateIds.length || coordinateIds.some(id => !coordinates.some(d => d.id === id))))
    throw new Error("Search requires budget 1–128, minutes >0 and <=60, and distinct supported coordinates");
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
    scope: values.optimize ? "research-periodic-rest-search" : "research-periodic-rest-screen",
    ...(values.optimize ? { budget, minutes, coordinateIds } : {}), publicPromotionAuthorized: false });
  try {
    if (values.optimize) {
      const initial = requests[0]!;
      const signal = AbortSignal.timeout(Math.ceil(minutes * 60_000));
      const report = await search({ referenceId: initial.referenceId, candidateInputs: initial.candidateInputs,
        reuse: initial.reuse, maximumEvaluations: budget, maximumWallTimeMs: minutes * 60_000, coordinateIds,
        evaluateBatch: async jobs => {
          const results = await runFittingJsonWorkersV1<Awaited<ReturnType<typeof run>>>({
            scriptPath: fileURLToPath(import.meta.url), concurrency, signal,
            jobs: jobs.map(job => ({ args: ["--worker"], input: JSON.stringify({ referenceId: initial.referenceId,
              candidateInputs: job.candidateInputs, ...(job.reuse ? { reuse: job.reuse } : {}),
              sourceSha256: snapshot.sourceSha256, nominalDtSec: initial.nominalDtSec }) })) });
          for (const [i, result] of results.entries()) {
            await save(`${jobs[i]!.id}.json`, result.status === "saved-result-ready" ? result.result : result);
            if (result.status === "saved-result-ready") await read(result.result);
            process.stdout.write(JSON.stringify({ id: jobs[i]!.id, status: result.status,
              ...(result.status === "saved-result-ready" ? { rest: result.result.rest.status, cycles: result.result.execution.completedCycleCount,
                initialization: result.result.initialization.kind, wallTimeMs: result.result.wallTimeMs } : { message: result.message }) }) + "\n");
          }
          return results;
        } });
      const { evaluations, ...summary } = report;
      await save("report.json", { ...summary, sourceSha256: snapshot.sourceSha256, nominalDtSec: initial.nominalDtSec,
        evaluations: evaluations.map(({ outcome, ...e }) => ({ ...e, file: `${e.id}.json`, status: outcome.status,
          ...(outcome.status === "saved-result-ready" ? { resultSha256: outcome.result.resultSha256,
            initialization: outcome.result.initialization.kind, cycles: outcome.result.execution.completedCycleCount,
            wallTimeMs: outcome.result.wallTimeMs } : { message: outcome.message }) })) });
      await save("best-candidate.json", report.bestCandidateInputs);
      process.stdout.write(JSON.stringify({ stopReason: report.stopReason, bestId: report.bestId, bestScore: report.bestScore,
        evaluationCount: report.evaluationCount, wallTimeMs: report.wallTimeMs, publicPromotionAuthorized: false }) + "\n");
      return;
    }
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
