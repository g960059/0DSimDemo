import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import settledCheckpoint from "@/studio/integrations/mainWireIntegratedV3/standard72-settled-baseline-checkpoint.json";
import type { MainWireIntegratedModelStandard72CheckpointV1 } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { runMainWireStandard72FittingWorkflowV1, validateMainWireStandard72SavedFittingResultV1 } from "@/analysis/methods/mainWire/MainWireStandard72FittingWorkflowV1";

const { values } = parseArgs({ options: {
  candidate: { type: "string" }, reuse: { type: "string" }, tbv: { type: "string" },
  output: { type: "string" }, cold: { type: "boolean" }, help: { type: "boolean" },
} });
if (values.help) {
  process.stdout.write("Usage: npm run fit:scientific:main-wire-standard72-v1 -- --output NEW_FILE [--candidate CANDIDATE_JSON | --tbv ML] [--reuse SAVED_RESULT | --cold]\n"
    + "Executes a candidate, assesses periodic resting behavior and saves a reusable exact72 checkpoint. Paired-grid pressure-rate/tau and preload-reserve qualification are not performed; this does not adopt a fitted baseline.\n");
  process.exit(0);
}
if (!values.output || (values.candidate && values.tbv) || (values.reuse && values.cold)) throw new Error("Require --output NEW_FILE; candidate/tbv and reuse/cold are mutually exclusive");
const output = resolve(values.output);
if (existsSync(output)) throw new Error("Output already exists; choose a new file");
selectHotPathIntegrityTierV1("hot-path-lean");
const saved = values.reuse ? await validateMainWireStandard72SavedFittingResultV1(JSON.parse(await readFile(values.reuse, "utf8"))) : undefined;
let candidateInputs = values.candidate ? JSON.parse(await readFile(values.candidate, "utf8"))
  : saved?.evaluation.candidateInputs ?? resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs;
if (values.tbv) candidateInputs = { ...candidateInputs, hemodynamicResearchInputs: { ...candidateInputs.hemodynamicResearchInputs, totalBloodVolumeMl: Number(values.tbv) } };
const source = saved || values.cold ? undefined : { checkpoint: settledCheckpoint as unknown as MainWireIntegratedModelStandard72CheckpointV1,
  candidateInputs: resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs };
const run = await runMainWireStandard72FittingWorkflowV1({ candidateInputs, reuse: saved, source, cold: values.cold });
if (run.status !== "saved-result-ready") {
  process.stdout.write(`${JSON.stringify(run)}\n`); process.exitCode = 1;
} else {
  await writeFile(output, `${JSON.stringify(run.result, null, 2)}\n`, { flag: "wx" });
  const reopened = await validateMainWireStandard72SavedFittingResultV1(JSON.parse(await readFile(output, "utf8")));
  process.stdout.write(`${JSON.stringify({ output, modelId: reopened.modelId, cycles: reopened.evaluation.completedCycleCount,
    restStatus: reopened.evaluation.rest.status, qualification: reopened.evaluation.qualification,
    checkpointSha256: reopened.evaluation.checkpoint.checkpointSha256, wallTimeMs: reopened.evaluation.wallTimeMs })}\n`);
}
