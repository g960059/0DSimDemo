import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { readMainWireHistoricalFittingEvidenceV1 as history, unwrapMainWireFittingEvidenceV1 as unwrap } from "@/analysis/registry/MainWireCaseInputRecordV1";
import { reobserveMainWireCaseV1 as observe } from "@/analysis/methods/mainWire/MainWireCaseComparisonV1";
import { renderRegistryCaseReviewDocumentV1 as render, registryCaseReviewHtmlV1 as html } from "../modelDocumentation/authoring/RegistryCaseReviewDocumentV1";
import { readSealedFittingRunV1 as sealed } from "./SealedFittingRunV1";
import { beginFittingSourceSnapshotV1 as snapshotFor } from "./FittingSourceSnapshotV1";
import { writeFittingRunJsonV1 as writeJson, writeFittingRunTextV1 as writeText } from "./FittingRunFilesV1";

/** The caller chooses the stage. No directory-based guess about scientific
 * compatibility, no checkpoint restoration and no new qualification claim. */
export async function refreshMainWireRegistryMaterialV1(input: { stage: "observe" | "documents"; input: string; output: string }) {
  if (!["observe", "documents"].includes(input.stage)) throw new Error("Choose observe or documents");
  const run = await sealed(input.input), report = await run.readJson("report.json") as {
    rows?: { referenceId: string; candidateFile: string | null }[];
    cases?: { referenceId: string; documentFile: string | null }[];
  };
  const selected = input.stage === "observe" ? report.rows : report.cases;
  if (!selected?.length || new Set(selected.map(r => r.referenceId)).size !== selected.length)
    throw new Error(input.stage === "observe" ? "Observe requires a sealed numerical registry run" : "Documents requires a sealed prepared registry bundle");
  const output = resolve(input.output); await mkdir(output);
  const snapshot = await snapshotFor(join(output, "execution")), files: string[] = [], rows = [];
  const started = performance.now();
  const save = async (name: string, value: unknown) => { files.push(await writeJson(output, name, value)); };
  for (const row of selected) {
    try {
      if (input.stage === "observe") {
        const file = (row as NonNullable<typeof report.rows>[number]).candidateFile;
        if (!file) throw new Error("No numerical candidate; original input hold retained");
        const c = await run.readJson(file) as { referenceId: string; recordSha256: string; executionFiles: string[];
          candidateInputs: unknown; publicPromotionAuthorized: boolean };
        const { recordSha256, ...body } = c;
        if (recordSha256 !== await hash(body) || c.referenceId !== row.referenceId || c.publicPromotionAuthorized !== false
          || c.executionFiles.length !== 2) throw new Error("Numerical candidate binding differs");
        const results = [];
        for (const [index, name] of c.executionFiles.entries()) {
          const raw = unwrap(await run.readJson(name));
          const original = await history(raw);
          if (original.record.referenceId !== row.referenceId
            || await hash(original.record.candidateInputs) !== await hash(c.candidateInputs)
            || original.numericalSourceSha256 !== run.seal.sourceSha256 || original.nominalDtSec !== [.002, .001][index])
            throw new Error("Original input/source/grid binding differs");
          const observation = await observe(raw, snapshot.sourceSha256);
          const target = `${row.referenceId}-${index === 0 ? "2ms" : "1ms"}-observation.json`;
          await save(target, observation);
          results.push({ file: target, sourceResultSha256: observation.sourceResultSha256,
            previousRestStatus: observation.previousRestStatus, restStatus: observation.rest.status,
            cycleReviewIssues: observation.cycleObservation.reviewIssues });
        }
        rows.push({ referenceId: row.referenceId, status: "reobserved-not-requalified", results });
      } else {
        const file = (row as NonNullable<typeof report.cases>[number]).documentFile;
        if (!file) throw new Error("No saved dossier; original material hold retained");
        const document = await run.readJson(file) as Parameters<typeof render>[0];
        const rendering = await run.readJson(`${row.referenceId}-render-input.json`) as Parameters<typeof render>[1];
        const { contentSha256, ...body } = document;
        if (contentSha256 !== await hash(body) || document.identity.referenceId !== row.referenceId)
          throw new Error("Saved dossier digest or case differs");
        const target = `${row.referenceId}.html`;
        files.push(await writeText(output, target, await html(render(document, rendering))));
        await save(file, document);
        await save(`${row.referenceId}-render-input.json`, rendering);
        rows.push({ referenceId: row.referenceId, status: "rendered-original-assessment", documentFile: file, htmlFile: target,
          originalAssessmentStatus: document.status, sourceDossierSha256: contentSha256 });
      }
    } catch (error) {
      rows.push({ referenceId: row.referenceId, status: "material-held", issue: error instanceof Error ? error.message : String(error) });
    }
  }
  const result = { schemaId: "main-wire-registry-material-refresh-v1", stage: input.stage,
    inputRun: run.directory, inputSourceSha256: run.seal.sourceSha256, refreshSourceSha256: snapshot.sourceSha256,
    rows, wallTimeMs: performance.now() - started, numericalStepsExecuted: 0, checkpointsRestored: 0,
    qualificationExecuted: false, publicPromotionAuthorized: false,
    scope: input.stage === "observe" ? "new rest/cycle observation from unchanged raw evidence; paired qualification and Surface completion not rerun"
      : "layout-only research dossier; original measurements, interpretation and assessment retained; no new publication document admission" };
  await save("report.json", result);
  await snapshot.finish(files);
  return result;
}
async function main() {
  const { values } = parseArgs({ options: { stage: { type: "string" }, input: { type: "string" }, output: { type: "string" }, help: { type: "boolean" } } });
  if (values.help) {
    process.stdout.write("Usage: npm run fit:registry:refresh -- --stage observe|documents --input SEALED_RUN --output NEW_DIRECTORY\n"
      + "observe: original numerical run -> current rest/cycle measurements, without paired requalification.\n"
      + "documents: prepared review bundle -> new dossier layout, preserving ALL saved scientific content.\n"
      + "For full reassessment and Surface analysis use fit:registry:prepare; for changed numerical inputs use fit:registry or fit:registry:family.\n"
      + "Always creates a new stage record. Does not resume or overwrite the old run, import checkpoints, fit, mint or publish.\n"); return;
  }
  if (!values.input || !values.output || !["observe", "documents"].includes(values.stage ?? "")) throw new Error("Require --stage observe|documents, --input and --output");
  const result = await refreshMainWireRegistryMaterialV1({ stage: values.stage as "observe" | "documents", input: values.input, output: values.output });
  process.stdout.write(JSON.stringify(result) + "\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
