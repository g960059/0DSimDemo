import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { prepareMainWireBaselineCaseV1 } from "./PrepareMainWireBaselineCaseV1";
import { readBoundFittingQualificationV1 } from "./ReadBoundFittingQualificationV1";

const { values } = parseArgs({ options: { qualification: { type: "string" }, output: { type: "string" },
  title: { type: "string" }, id: { type: "string" }, help: { type: "boolean" } } });
if (values.help) {
  process.stdout.write("Usage: npx vite-node --script tools/modelBaselines/exportMainWireBaselineCaseV1.ts --qualification FINAL_JSON --output NEW_CASE_JSON --id PRESET_ID --title TITLE\n"
    + "Requires final qualification + its source sidecar/archive. Rechecks evidence, restores the candidate and verifies 1000 steps against the unchanged artifact. Produces a local Model Lab import, never changes the default or publishes.\n");
} else {
  if (!values.qualification || !values.output || !values.id || !values.title) throw new Error("Require --qualification, --output, --id and --title");
  const output = resolve(values.output), input = resolve(values.qualification);
  if (existsSync(output)) throw new Error("Output already exists; choose a new file");
  const source = await readBoundFittingQualificationV1(input);
  selectHotPathIntegrityTierV1("hot-path-lean");
  const artifact = await readFile("studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.artifact.mjs");
  const prepared = await prepareMainWireBaselineCaseV1({ ...source, artifact, presetId: values.id, title: values.title });
  await writeFile(output, JSON.stringify(prepared, null, 2) + "\n", { flag: "wx" });
  process.stdout.write(JSON.stringify({ output, modelId: prepared.preset.modelId,
    recordSha256: prepared.recordSha256, acceptedTimeSec: prepared.preset.capture.checkpoint.acceptedTimeSec,
    artifactUnchanged: true, publicBaselinePromotionAuthorized: false }) + "\n");
}
