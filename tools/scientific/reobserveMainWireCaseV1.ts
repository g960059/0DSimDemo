import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { reobserveMainWireCaseV1 } from "@/analysis/methods/mainWire/MainWireCaseComparisonV1";
import { unwrapMainWireFittingEvidenceV1 as unwrap } from "@/analysis/registry/MainWireCaseInputRecordV1";
export { reobserveMainWireCaseV1 };
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";

async function main() {
  const { values } = parseArgs({ options: { input: { type: "string", multiple: true }, output: { type: "string" } } });
  if (!values.input?.length || !values.output) throw new Error("Usage: npm run observe:case -- --input RESULT.json [--input ...] --output NEW_DIRECTORY");
  const output = resolve(values.output); await mkdir(output);
  const snapshot = await beginFittingSourceSnapshotV1(join(output, "observation")), files: string[] = [];
  try {
    for (const [index, path] of values.input.entries()) {
      const parsed = JSON.parse(await readFile(resolve(path), "utf8"));
      const result = await reobserveMainWireCaseV1(unwrap(parsed), snapshot.sourceSha256);
      const target = join(output, `${String(index + 1).padStart(2, "0")}-${basename(path)}`);
      await writeFile(target, JSON.stringify(result, null, 2) + "\n", { flag: "wx" }); files.push(target);
      process.stdout.write(JSON.stringify({ input: path, output: target, previous: result.previousRestStatus,
        rest: result.rest.status, issues: result.cycleObservation.reviewIssues,
        rightClosure: result.cycleObservation.right.timing?.inletClosureSelection,
        lv: result.rest.referenceId === "hfref-chronic-dilated-v1" && result.rest.status !== "unavailable" ? result.rest.observation.values : null }) + "\n");
    }
  } finally { await snapshot.finish(files); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
