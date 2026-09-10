import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { readMainWireStaticCaseFittingResultV1 as read, assessMainWireStaticCaseRestV1 as assess,
  buildMainWireStaticCaseFittingPolicyIdentityV1 as policyIdentity } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { observeMainWireValveCycleV3 as cycle } from "@/analysis/methods/mainWire/MainWireValveCycleObservationV3";
import { mainWireStandard70TimingAndInletObservationTraceV1 as trace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";

/** Replay saved observations, NOT the simulation. Keep numerical provenance
 * and current analysis provenance separate; no restored state is advanced. */
export async function reobserveMainWireCaseV1(input: unknown, analysisSourceSha256: string) {
  if (!/^[a-f0-9]{64}$/.test(analysisSourceSha256)) throw new Error("Current analysis source digest required");
  const saved = await read(input), d = saved.execution.diagnostics;
  const cycleObservation = cycle({ samples: trace(d), completedBeat: d.completedBeat });
  const referenceId = saved.rest.referenceId;
  const body = { schemaId: "main-wire-case-reobservation-v1", sourceResultSha256: saved.resultSha256,
    numericalSourceSha256: saved.sourceSha256, analysisSourceSha256, modelId: saved.modelId,
    checkpointSha256: saved.execution.checkpoint.checkpointSha256, nominalDtSec: saved.nominalDtSec,
    candidateInputs: saved.candidateInputs, previousObservationContext: saved.referenceContext,
    previousRestStatus: saved.rest.status, previousIssue: saved.rest.status === "unavailable" ? saved.rest.issue : null,
    currentFittingPolicySha256: await policyIdentity(referenceId), cycleObservation,
    rest: assess(referenceId, saved.execution),
    interpretation: "Same immutable accepted samples; a new observation is not a new numerical run, grid qualification or adoption.",
    numericalStepsExecuted: 0, publicPromotionAuthorized: false };
  return { ...body, reobservationSha256: await hash(body) };
}

async function main() {
  const { values } = parseArgs({ options: { input: { type: "string", multiple: true }, output: { type: "string" } } });
  if (!values.input?.length || !values.output) throw new Error("Usage: npm run observe:case -- --input RESULT.json [--input ...] --output NEW_DIRECTORY");
  const output = resolve(values.output); await mkdir(output);
  const snapshot = await beginFittingSourceSnapshotV1(join(output, "observation")), files: string[] = [];
  try {
    for (const [index, path] of values.input.entries()) {
      const parsed = JSON.parse(await readFile(resolve(path), "utf8"));
      const result = await reobserveMainWireCaseV1(parsed.result ?? parsed, snapshot.sourceSha256);
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
