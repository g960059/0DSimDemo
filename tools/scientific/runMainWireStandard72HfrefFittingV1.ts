import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { MAIN_WIRE_STANDARD72_HFREF_SEARCH_PLAN_V1 as plan,
  runMainWireStandard72HfrefCaseV1 as evaluate, compareMainWireHfrefResultsV1 as compare,
  mainWireHfrefInitialPointsV1 as initialPoints, mainWireHfrefNeighborPointsV1 as neighbors,
  reassessMainWireStandard72HfrefResultV1 as reassess,
  type MainWireHfrefFittingResultV1 as Result, type MainWireHfrefFittingTaskV1 as Task,
  type MainWireHfrefPointV1 as Point } from "@/analysis/methods/mainWire/MainWireStandard72HfrefFittingV1";
import { runFittingJsonWorkersV1, readFittingWorkerStdinV1 } from "./runFittingJsonWorkersV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";

async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" }, workers: { type: "string" },
    "reuse-initial": { type: "string" }, worker: { type: "boolean" }, help: { type: "boolean" } } });
  if (values.help) {
    process.stdout.write("Usage: npm run fit:scientific:hfref-v1 -- --output NEW_DIRECTORY [--workers 4]\n"
      + "Fixed source-backed HFrEF reference; 27-point LVFW+SEP/TBV/resistance screen and at most four bounded neighbor polls.\n"
      + "Uses exact72 lean execution/checkpoint continuation. Saves plan before launching workers; never adopts a baseline/preset.\n"
      + "--reuse-initial PRIOR_DIRECTORY re-observes its source-bound initial 27 exact traces under the unchanged reference; no reintegration.\n"); return;
  }
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (values.worker) {
    if (values.output || values.workers || values["reuse-initial"]) throw new Error("Internal HFrEF worker takes only stdin");
    const result = await evaluate(await readFittingWorkerStdinV1() as Task, AbortSignal.timeout(180_000));
    process.stdout.write(`${JSON.stringify(result)}\n`); return;
  }
  const workers = Number(values.workers ?? 4);
  if (!values.output || !Number.isInteger(workers) || workers < 1 || workers > 8) throw new Error("Require new --output directory and 1–8 workers");
  const output = resolve(values.output); await mkdir(output);
  const reference = resolveMainWireFittingReferenceV1("hfref-lv-systolic-v1");
  const referenceSha256 = await sha256CanonicalJsonHex(reference);
  const source = await beginFittingSourceSnapshotV1(join(output, "execution"));
  const registered = { reference, referenceSha256, plan, seedCandidateInputs: seed.candidateInputs,
    seedCheckpointImported: false, initialGridInitialization: "independent-cold", sourceSha256: source.sourceSha256,
    initialExecutionSource: values["reuse-initial"] ? resolve(values["reuse-initial"]) : null };
  const files = [join(output, "plan.json")];
  await writeFile(files[0]!, JSON.stringify({ ...registered, planSha256: await sha256CanonicalJsonHex(registered) }, null, 2) + "\n", { flag: "wx" });
  const started = performance.now(), results: Result[] = [], visited = new Set<string>();
  const rounds: { round: number; count: number; wallTimeMs: number }[] = [];
  const best = () => results.filter(r => r.assessment?.ranking).sort(compare)[0];
  const run = async (points: readonly Point[], round: number, anchor?: Result) => {
    process.stderr.write(`HFrEF: round ${round}, ${points.length} candidates, ${results.length} completed.\n`);
    const tasks: Task[] = points.map(point => ({ point, expectedReferenceSha256: referenceSha256,
      ...(anchor?.evaluation.status === "accepted" ? { initialization: {
        kind: "standard72-parameter-continuation" as const, checkpoint: anchor.evaluation.checkpoint,
        sourceCandidateInputs: anchor.candidateInputs, sourceNominalDtSec: anchor.evaluation.nominalDtSec } } : {}) }));
    const begin = performance.now();
    const batch = await runFittingJsonWorkersV1<Result>({ scriptPath: fileURLToPath(import.meta.url), concurrency: workers,
      jobs: tasks.map(task => ({ args: ["--worker"], input: canonicalJsonStringify(task) })) });
    rounds.push({ round, count: points.length, wallTimeMs: performance.now() - begin });
    for (let i = 0; i < batch.length; i++) {
      const r = batch[i]!, task = tasks[i]!;
      const { resultSha256, ...body } = r;
      if (r.referenceSha256 !== referenceSha256 || canonicalJsonStringify(r.point) !== canonicalJsonStringify(task.point)
        || resultSha256 !== await sha256CanonicalJsonHex(body)) throw new Error("HFrEF worker result not bound to request");
      const filename = join(output, `trial-${String(results.length).padStart(3, "0")}.json`);
      await writeFile(filename, JSON.stringify(r) + "\n", { flag: "wx" }); files.push(filename);
      visited.add(canonicalJsonStringify(r.point)); results.push(r);
    }
  };
  let stopReason = "neighbor-budget";
  let step = plan.initialStepFraction;
  if (values["reuse-initial"]) {
    const directory = resolve(values["reuse-initial"]);
    const sidecar = JSON.parse(await readFile(join(directory, "execution.source.json"), "utf8")) as {
      results: { filename: string; sha256: string }[]; sourceSha256: string; archive: { filename: string; sha256: string } };
    const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
    if (sidecar.archive.filename !== "execution.source.tar.gz"
      || digest(await readFile(join(directory, sidecar.archive.filename))) !== sidecar.archive.sha256) throw new Error("HFrEF reused source archive mismatch");
    for (const [i, point] of initialPoints().entries()) {
      const filename = `trial-${String(i).padStart(3, "0")}.json`, bytes = await readFile(join(directory, filename));
      if (digest(bytes) !== sidecar.results.find(r => r.filename === filename)?.sha256) throw new Error("HFrEF reused result/source mismatch");
      const previous = JSON.parse(bytes.toString()) as Result;
      if (canonicalJsonStringify(previous.point) !== canonicalJsonStringify(point)) throw new Error("HFrEF reused grid mismatch");
      const r = await reassess(previous), file = join(output, filename);
      await writeFile(file, JSON.stringify(r) + "\n", { flag: "wx" }); files.push(file);
      results.push(r); visited.add(canonicalJsonStringify(point));
    }
    const provenanceFile = join(output, "initial-execution-source.json"); files.push(provenanceFile);
    await writeFile(provenanceFile, JSON.stringify({ directory, ...sidecar }) + "\n", { flag: "wx" });
    rounds.push({ round: 0, count: results.length, wallTimeMs: performance.now() - started });
    process.stderr.write(`HFrEF: re-observed ${results.length} retained initial results without reintegration.\n`);
  } else await run(initialPoints(), 0);
  for (let round = 1; round <= plan.maximumNeighborRounds; round++) {
    const anchor = best();
    if (!anchor) { stopReason = "no-observable-candidate"; break; }
    if (anchor.assessment?.screenPassed && anchor.assessment.preferredTargetsMet) { stopReason = "preferred-targets-met"; break; }
    const points = neighbors(anchor.point, step, visited);
    if (!points.length) { step /= 2; continue; }
    if (results.length + points.length > plan.maximumEvaluations) { stopReason = "evaluation-budget"; break; }
    await run(points, round, anchor);
    if (compare(best()!, anchor) >= 0) step /= 2;
  }
  const chosen = best();
  if (chosen?.assessment?.screenPassed && chosen.assessment.preferredTargetsMet) stopReason = "preferred-targets-met";
  const report = { schemaId: "main-wire-hfref-search-report-v1", ...registered, rounds, workers,
    wallTimeMs: performance.now() - started, stopReason, evaluations: results.length,
    reusedInitialExecutions: values["reuse-initial"] ? 27 : 0,
    newNumericalExecutions: results.length - (values["reuse-initial"] ? 27 : 0),
    bestTrialIndex: chosen ? results.indexOf(chosen) : null,
    screenPassedCount: results.filter(r => r.assessment?.screenPassed).length,
    preferredTargetsMetCount: results.filter(r => r.assessment?.screenPassed && r.assessment.preferredTargetsMet).length,
    trials: results.map((r, trialIndex) => ({ trialIndex, point: r.point, resultSha256: r.resultSha256,
      status: r.status, evaluationStatus: r.evaluation.status,
      cycles: r.evaluation.status === "accepted" ? r.evaluation.completedCycleCount : null,
      wallTimeMs: r.evaluation.wallTimeMs, issue: r.observationIssue ?? (r.evaluation.status === "accepted" ? null : r.evaluation.message),
      values: r.observation?.values ?? null, assessment: r.assessment })),
    finalQualificationPerformed: false, publicPromotionAuthorized: false,
    globalOptimumClaimed: false, biologicalIdentifiabilityClaimed: false };
  const reportFile = join(output, "report.json"); files.push(reportFile);
  await writeFile(reportFile, JSON.stringify({ ...report, reportSha256: await sha256CanonicalJsonHex(report) }, null, 2) + "\n", { flag: "wx" });
  await source.finish(files);
  process.stdout.write(JSON.stringify({ output, evaluations: results.length, screenPassed: report.screenPassedCount,
    preferredTargetsMet: report.preferredTargetsMetCount, bestTrial: report.bestTrialIndex,
    bestPoint: chosen?.point, bestValues: chosen?.observation?.values,
    wallTimeMs: report.wallTimeMs, referenceSha256, publicPromotionAuthorized: false }) + "\n");
}
await main().catch(error => { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode ||= 1; });
