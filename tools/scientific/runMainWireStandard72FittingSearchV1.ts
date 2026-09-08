import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { canonicalJsonStringify } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { runMainWireStandard72FittingWorkflowV1 as evaluate, validateMainWireStandard72SavedFittingResultV1 as validateSaved } from "@/analysis/methods/mainWire/MainWireStandard72FittingWorkflowV1";
import { runMainWireStandard72FittingSearchV1 as search, type MainWireStandard72FittingSearchTaskV1 as Task } from "@/analysis/methods/mainWire/MainWireStandard72FittingSearchV1";
import { resolveMainWireStandard72FittingSearchPlanV1 as resolvePlan,
  type MainWireStandard72FittingSearchOptionsV1 as Options } from "@/analysis/policies/mainWire/MainWireStandard72FittingSearchPolicyV1";
import checkpoint from "@/studio/integrations/mainWireIntegratedV3/standard72-settled-baseline-checkpoint.json";
import type { MainWireIntegratedModelStandard72CheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { runFittingJsonWorkersV1, readFittingWorkerStdinV1 } from "./runFittingJsonWorkersV1";

const aliases = { tbv: "hemodynamics.total-blood-volume-ml", resistance: "hemodynamics.systemic-resistance",
  stiffness: "hemodynamics.arterial-stiffness", active: "myocardium.common-ventricular-active-tension-scale" } as const;

async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" }, candidate: { type: "string" }, reuse: { type: "string" },
    tbv: { type: "string" }, parameters: { type: "string" }, plan: { type: "string" },
    "max-evaluations": { type: "string" }, workers: { type: "string" }, worker: { type: "boolean" }, help: { type: "boolean" } } });
  if (values.help) {
    process.stdout.write("Usage: npm run search:scientific:main-wire-standard72-v1 -- --output NEW_DIRECTORY [--candidate JSON | --tbv ML] [--reuse FITTED_JSON] [--parameters tbv,resistance,stiffness,active] [--max-evaluations 25] [--workers 4]\n"
      + "Default: TBV, systemic resistance and arterial stiffness; active amplitude is opt-in. --plan OPTIONS_JSON supplies explicit narrower parameter bounds and budget instead of --parameters/--max-evaluations.\n"
      + "Runs bounded local resting pattern search, saves report.json and up to three finalist-N.json files. Qualified rest is not final qualification, biological parameter identification, or baseline adoption.\n"
      + "The evaluation budget is a ceiling: an incomplete final neighborhood is not launched.\n"
      + "Final check: npm run qualify:scientific:main-wire-standard72-v1 -- --reuse NEW_DIRECTORY/finalist-1.json --output NEW_REPORT.json\n"); return;
  }
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (values.worker) {
    if (Object.entries(values).some(([key, value]) => key !== "worker" && value !== undefined)) throw new Error("Internal search worker accepts only --worker and task JSON on stdin");
    const result = await evaluate(await readFittingWorkerStdinV1() as Task);
    process.stdout.write(`${JSON.stringify(result)}\n`); return;
  }
  if (!values.output || (values.candidate && values.tbv) || (values.plan && (values.parameters || values["max-evaluations"]))) {
    throw new Error("Require --output NEW_DIRECTORY; candidate/tbv and plan/parameter overrides are mutually exclusive; see --help");
  }
  const workers = Number(values.workers ?? 4);
  if (!Number.isInteger(workers) || workers < 1 || workers > 8) throw new Error("--workers must be an integer in [1, 8]");
  const reference = resolveMainWireFittingReferenceV1("baseline");
  const reuse = values.reuse ? await validateSaved(JSON.parse(await readFile(values.reuse, "utf8"))) : undefined;
  let candidateInputs = values.candidate ? JSON.parse(await readFile(values.candidate, "utf8"))
    : reuse?.evaluation.candidateInputs ?? reference.selectedConstruction.candidateInputs;
  if (values.tbv) candidateInputs = { ...candidateInputs, hemodynamicResearchInputs: {
    ...candidateInputs.hemodynamicResearchInputs, totalBloodVolumeMl: Number(values.tbv) } };
  const options: Options = values.plan ? JSON.parse(await readFile(values.plan, "utf8")) : {
    ...(values["max-evaluations"] ? { maximumEvaluations: Number(values["max-evaluations"]) } : {}),
    ...(values.parameters ? { parameters: values.parameters.split(",").map(name => {
      if (!Object.hasOwn(aliases, name)) throw new Error(`Unsupported parameter alias: ${name}`);
      return { parameterId: aliases[name as keyof typeof aliases] };
    }) } : {}),
  };
  resolvePlan(candidateInputs, options); // Reject plan errors before creating output or workers.
  const output = resolve(values.output); await mkdir(output); // Exclusive; never overwrite a prior search.
  const seed = { candidateInputs, ...(reuse ? { reuse } : { source: {
    checkpoint: checkpoint as unknown as Checkpoint, candidateInputs: reference.selectedConstruction.candidateInputs } }) };
  let completed = 0;
  const result = await search({ seed, options }, async (tasks, signal) => {
    process.stderr.write(`Resting search: evaluating ${tasks.length} candidate(s), ${completed} completed.\n`);
    const results = await runFittingJsonWorkersV1<Awaited<ReturnType<typeof evaluate>>>({
      scriptPath: fileURLToPath(import.meta.url), concurrency: workers, signal,
      jobs: tasks.map(task => ({ args: ["--worker"], input: canonicalJsonStringify(task) })),
    });
    completed += results.length;
    return results;
  });
  // Partial completed evidence is retained on interruption, without claiming a completed search.
  await writeFile(join(output, "report.json"), `${JSON.stringify(result.report, null, 2)}\n`, { flag: "wx" });
  for (const [index, finalist] of result.finalists.entries()) {
    await writeFile(join(output, `finalist-${index + 1}.json`), `${JSON.stringify(finalist, null, 2)}\n`, { flag: "wx" });
  }
  process.stdout.write(`${JSON.stringify({ output, status: result.report.status, stopReason: result.report.stopReason,
    completedEvaluations: result.report.completedEvaluations, submittedEvaluations: result.report.submittedEvaluations,
    finalists: result.finalists.length, workers, wallTimeMs: result.report.wallTimeMs,
    finalQualificationPerformed: false, publicBaselinePromotionAuthorized: false, reportSha256: result.report.reportSha256 })}\n`);
  if (result.report.status !== "candidates-found") process.exitCode ||= 1;
}
await main().catch(error => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode ||= 1; });
