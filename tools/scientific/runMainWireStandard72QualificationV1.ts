import { constants, existsSync } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { cloneAndFreezeCanonicalJson, canonicalJsonStringify } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { validateMainWireStandard72SavedFittingResultV1 } from "@/analysis/methods/mainWire/MainWireStandard72FittingWorkflowV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { runFittingJsonWorkersV1, readFittingWorkerStdinV1 } from "./runFittingJsonWorkersV1";

type GridResult = Awaited<ReturnType<typeof import("@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1").runMainWireStandard72QualificationGridV1>>;
type NominalDt = .002 | .001;
const maximumCandidateBytes = 1_048_576;

async function main() {
  const { values } = parseArgs({ options: {
    output: { type: "string" }, reuse: { type: "string" }, candidate: { type: "string" },
    tbv: { type: "string" }, help: { type: "boolean" },
    worker: { type: "boolean" }, dt: { type: "string" },
  } });
  if (values.help) {
    process.stdout.write("Usage: npm run qualify:scientific:main-wire-standard72-v1 -- --output NEW_JSON [--reuse SAVED_FITTING_JSON | --candidate CANDIDATE_JSON | --tbv ML]\n"
      + "Runs the same candidate independently from cold at 2ms and 1ms in two child processes, then assesses resting behavior, pressure-rate/tau and fixed-tone preload reserve. The default candidate is the registry baseline.\n"
      + "--reuse validates a saved Standard72 fitting result and takes only its candidate parameters; prior checkpoints and qualification are not reused. --tbv changes baseline total blood volume.\n"
      + "Writes a new report without overwriting files. Exit 0 means qualified; exit 1 means held or an execution/input error. This does not publish or adopt a baseline, qualify afterload, or claim clinical validation.\n"
      + "Internal worker usage: CI=true with --worker --dt .002|.001, candidate JSON on stdin and grid-result JSON on stdout.\n");
    return;
  }
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (values.worker) {
    if (values.output !== undefined || values.reuse !== undefined || values.candidate !== undefined || values.tbv !== undefined
      || (values.dt !== ".002" && values.dt !== ".001")) {
      throw new Error("Internal worker requires only --worker --dt .002|.001 and candidate JSON on stdin");
    }
    const candidateInputs = cloneAndFreezeCanonicalJson(await readFittingWorkerStdinV1(maximumCandidateBytes)) as Candidate;
    const { runMainWireStandard72QualificationGridV1 } = await import("@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1");
    const result = await runMainWireStandard72QualificationGridV1({ candidateInputs, nominalDtSec: Number(values.dt) as NominalDt });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (!values.output || values.dt !== undefined
    || [values.reuse, values.candidate, values.tbv].filter(value => value !== undefined).length > 1) {
    throw new Error("Require --output NEW_JSON and at most one of --reuse, --candidate or --tbv; see --help");
  }
  const output = resolve(values.output);
  if (existsSync(output)) throw new Error("Output already exists; choose a new file");
  await access(dirname(output), constants.W_OK);
  const saved = values.reuse === undefined ? undefined
    : await validateMainWireStandard72SavedFittingResultV1(JSON.parse(await readFile(values.reuse, "utf8")));
  let candidateInputs: Candidate = values.candidate === undefined
    ? saved?.evaluation.candidateInputs ?? resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs
    : JSON.parse(await readFile(values.candidate, "utf8"));
  if (values.tbv !== undefined) {
    const totalBloodVolumeMl = Number(values.tbv);
    if (!Number.isFinite(totalBloodVolumeMl) || totalBloodVolumeMl <= 0) throw new Error("--tbv requires positive finite milliliters");
    candidateInputs = { ...candidateInputs, hemodynamicResearchInputs: { ...candidateInputs.hemodynamicResearchInputs, totalBloodVolumeMl } };
  }
  // Snapshot once: both independent processes receive exactly these bytes.
  const encodedCandidate = canonicalJsonStringify(cloneAndFreezeCanonicalJson(candidateInputs));
  if (Buffer.byteLength(encodedCandidate) > maximumCandidateBytes) throw new Error("Candidate input exceeds 1 MiB");
  const { assessMainWireStandard72FittingQualificationV1 } = await import("@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1");
  const [coarse, fine] = await runFittingJsonWorkersV1<GridResult>({
    scriptPath: fileURLToPath(import.meta.url), concurrency: 2,
    jobs: [".002", ".001"].map(dt => ({ args: ["--worker", "--dt", dt], input: encodedCandidate })),
  });
  if (!coarse || !fine) throw new Error("Final qualification requires both grid results");
  const report = await assessMainWireStandard72FittingQualificationV1({ coarse, fine });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify({ output, modelId: report.modelId, status: report.status,
    reportSha256: report.reportSha256, initialization: "independent-cold-per-grid",
    nominalDtSec: [.002, .001], publicBaselinePromotionAuthorized: false,
    afterloadQualified: false, clinicalValidationClaimed: false })}\n`);
  if (report.status !== "qualified") process.exitCode = 1;
}

await main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode ||= 1;
});
