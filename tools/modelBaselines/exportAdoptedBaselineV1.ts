import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import { resolve, join } from "node:path";
import { stageAdoptedBaselineV1 } from "./StageAdoptedBaselineV1";

const { values } = parseArgs({ options: { case: { type: "string" }, document: { type: "string" },
  output: { type: "string" }, help: { type: "boolean" } } });
if (values.help) {
  console.log("Usage: npx vite-node --script tools/modelBaselines/exportAdoptedBaselineV1.ts --case CASE_JSON --document COMPILED_DOCUMENT_JSON --output NEW_DIRECTORY\nStages record.json + selection.json for a reviewed local adoption; does not select, mint or publish.");
} else {
  if (!values.case || !values.document || !values.output) throw new Error("Require --case, --document and --output");
  const staged = await stageAdoptedBaselineV1(JSON.parse(await readFile(values.case, "utf8")),
    JSON.parse(await readFile(values.document, "utf8")));
  const output = resolve(values.output);
  await mkdir(output); // exclusive directory: never overwrite a previous staging result
  for (const key of ["record", "selection"] as const) await writeFile(join(output, key + ".json"),
    JSON.stringify(staged[key], null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ output, baselineId: staged.record.baselineId, modelId: staged.record.modelId,
    documentId: staged.record.document.documentId, selected: false, minted: false, published: false }));
}
