import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import { runMainWireStaticBaselineQualificationGridV1 as run, assessMainWireStaticBaselineQualificationV1 as assess,
  type MainWireStaticBaselineQualificationGridV1 as Grid } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { readFittingWorkerStdinV1, runFittingJsonWorkersV1 } from "./runFittingJsonWorkersV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";

selectHotPathIntegrityTierV1("hot-path-lean");
type WorkerResult = { ok: true; value: Grid } | { ok: false; message: string };
if (process.argv.includes("--worker")) {
  let result: WorkerResult;
  try {
    const input = await readFittingWorkerStdinV1() as Parameters<typeof run>[0];
    result = { ok: true, value: await run({ ...input, abortSignal: AbortSignal.timeout(900_000) }) };
  } catch (error) { result = { ok: false, message: error instanceof Error ? error.message : String(error) }; }
  process.stdout.write(JSON.stringify(result) + "\n");
} else {
  const { values } = parseArgs({ options: { output: { type: "string" }, candidate: { type: "string" }, help: { type: "boolean" } } });
  if (values.help) {
    console.log("Usage: --output NEW_DIRECTORY [--candidate INPUT_JSON]. Independent cold 2/1 ms baseline, then existing fixed-control preload qualification. Static-anatomy research model only; no disease gate, afterload test, mint or adoption.");
  } else {
    if (!values.output) throw new Error("New --output directory required");
    const output = resolve(values.output); await mkdir(output);
    const candidateInputs = values.candidate ? JSON.parse(await readFile(values.candidate, "utf8")) : seed("baseline");
    const source = await beginFittingSourceSnapshotV1(join(output, "execution")), files: string[] = [];
    const save = async (name: string, value: unknown) => { const path = join(output, name);
      await writeFile(path, JSON.stringify(value, null, 2) + "\n", { flag: "wx" }); files.push(path); };
    const started = performance.now();
    try {
      await save("plan.json", { candidateInputs, sourceSha256: source.sourceSha256, nominalDtSec: [.002, .001],
        initialization: "independent-cold", workers: 2, afterloadTest: false, publicPromotionAuthorized: false });
      const results = await runFittingJsonWorkersV1<WorkerResult>({ scriptPath: fileURLToPath(import.meta.url), concurrency: 2,
        signal: AbortSignal.timeout(1_800_000), jobs: ([.002, .001] as const).map(nominalDtSec => ({ args: ["--worker"],
          input: JSON.stringify({ candidateInputs, nominalDtSec, sourceSha256: source.sourceSha256 }) })) });
      await save("coarse.json", results[0]); await save("fine.json", results[1]);
      if (!results[0]!.ok || !results[1]!.ok) throw new Error("Qualification worker failed; both results are retained");
      const report = await assess({ coarse: results[0]!.value, fine: results[1]!.value }); await save("qualification.json", report);
      const summary = { status: report.status, issues: report.issues, reportSha256: report.reportSha256,
        wallTimeMs: performance.now() - started, publicPromotionAuthorized: false };
      await save("report.json", summary); console.log(JSON.stringify(summary));
      if (report.status !== "qualified") process.exitCode = 1;
    } catch (error) {
      await save("failure.json", { message: error instanceof Error ? error.message : String(error) }); throw error;
    } finally { await source.finish(files); }
  }
}
