import { mkdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStaticCaseIdentityV1";
import { CURRENT_MODEL_PRESETS_V1 as adopted } from "@/data/model-releases/CurrentModelReleaseV1";
import { MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1 as definitions, resolveMainWireStaticCaseDefinitionV1 as definition,
  type MainWireCaseReferenceIdV1 as Reference, type MainWireStaticCaseCandidateV1 as Candidate } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/analysis/registry/MainWireStaticCaseFittingSeedV1";
import { createMainWireCaseInputRecordV1 as inputRecord, readMainWireCaseInputRecordV1 as readInput,
  readMainWireHistoricalFittingEvidenceV1 as history, bindMainWireCaseInputRecordV1 as bind,
  unwrapMainWireFittingEvidenceV1 as unwrap } from "@/analysis/registry/MainWireCaseInputRecordV1";
import { readMainWireStaticCaseFittingResultV1 as readResult, runMainWireStaticCaseFittingV1 as fit,
  buildMainWireStaticCaseFittingPolicyIdentityV1 as policyHash } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { mainWireCaseScoreImprovesV1 as improves, assertMainWireCaseSearchInputsV1 as preflight } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import { searchMainWireRegistryCaseV1 as searchCase } from "./MainWireRegistryCaseSearchV1";
import { assessMainWireCaseInitializationAgreementV1 as initializationAgreement } from "@/analysis/methods/mainWire/MainWireCaseInitializationAgreementV1";
import { ownMainWireRegistryProposalsV1 as ownProposals, mainWireInitialCandidatePrefixV1 as prefix,
  selectMainWireInitialCandidateV1 as selectInitial, assessMainWireInitialCandidateV1 as assessInitial,
  mainWireInitialCandidateComparisonV1 as initialComparison,
  type MainWireRegistryProposalV1 as Proposal } from "./MainWireRegistryInitialCandidatesV1";
import { resolveMainWireCaseSearchProfileV1 as profile } from "@/analysis/registry/MainWireCaseSearchProfilesV1";
import { compareMainWireCaseEvidenceV1 as compare } from "@/analysis/methods/mainWire/MainWireCaseComparisonV1";
import { beginFittingSourceSnapshotV1, resumeFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { readFittingWorkerStdinV1 as stdin } from "./runFittingJsonWorkersV1";
import { openFittingRunJournalV1, runJournaledFittingBatchV1 as batch } from "./FittingRunJournalV1";
import { readSealedFittingRunV1 } from "./SealedFittingRunV1";
import { resolveMainWireRegistryCaseProtocolV1 as protocol, prepareRegistryCaseAssessmentV1 as assess } from "./MainWireRegistryCaseProtocolsV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";

type Job = { kind: "qualification-grid" | "rest-screen"; referenceId: Reference; startId?: string; nominalDtSec: .002 | .001;
  candidateInputs: Candidate; sourceSha256: string; reuse?: unknown };
type Outcome = { status: "completed"; grid: unknown } | { status: "operational-failed" | "qualification-error"; message: string };
type Screen = Awaited<ReturnType<typeof fit>>;
const message = (e: unknown) => e instanceof Error ? e.message : String(e);

async function prepareInputs(p: Proposal) {
  const d = definition(p.referenceId);
  if (p.coordinateIds !== undefined && (!Array.isArray(p.coordinateIds) || !p.coordinateIds.length
    || new Set(p.coordinateIds).size !== p.coordinateIds.length || p.coordinateIds.some(id => !profile(p.referenceId).coordinateIds.includes(id))))
    throw new Error("Case search coordinates must be a distinct nonempty subset of the allowed profile");
  const previous = adopted.find(a => a.presetId === d.adoptedPresetId);
  let record, previousEvidence: unknown | null = null;
  if (p.historyFile) {
    const parsed = JSON.parse(await readFile(resolve(p.historyFile), "utf8"));
    if (parsed.schemaId === "main-wire-case-input-record-v1") record = await readInput(parsed);
    else { previousEvidence = unwrap(parsed); record = (await history(previousEvidence)).record; }
  } else if (p.candidateInputs) {
    record = await inputRecord({ modelId, referenceId: p.referenceId, candidateInputs: p.candidateInputs,
      previousAssessment: null, provenance: { kind: "new-construction", sourceRecordSha256: await hash(p.candidateInputs),
        description: p.interpretation ?? "Explicit new initial construction; no prior fitted result or checkpoint." } });
  } else {
    if (!previous) throw new Error("Adopted case missing; supply an explicit initial construction");
    record = await inputRecord({ modelId: previous.modelId, referenceId: p.referenceId, candidateInputs: seed(p.referenceId),
      previousAssessment: null, provenance: { kind: "adopted-case", sourceRecordSha256: await hash(previous),
        description: `Adopted full input from ${previous.presetId}; historical qualification is not reused.` } });
  }
  if (record.modelId !== modelId && !p.interpretation) throw new Error("Cross-model input transfer requires an explicit interpretation");
  const binding = await bind({ record, targetModelId: modelId, referenceId: p.referenceId,
    interpretation: p.interpretation ?? "Unchanged input meanings in the same exact model; independent cold reconstruction.",
    ...(p.historyFile && p.candidateInputs ? { mappedInputs: p.candidateInputs } : {}),
    validate: input => d.ownInputs(input as Candidate) });
  preflight(p.referenceId, (binding as { candidateInputs: Candidate }).candidateInputs, p.coordinateIds);
  return { record, binding: binding as { candidateInputs: Candidate; interpretation: string } & typeof binding, previousEvidence };
}

async function main() {
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (process.argv.includes("--worker")) {
    const job = await stdin() as Job;
    if (job.kind === "rest-screen") {
      process.stdout.write(JSON.stringify(await fit({ ...job, abortSignal: AbortSignal.timeout(1_800_000) })) + "\n"); return;
    }
    if (job.kind !== "qualification-grid" || job.reuse !== undefined) throw new Error("Final grid jobs must start cold");
    let outcome: Outcome;
    try { outcome = { status: "completed", grid: await protocol(job.referenceId).runGrid({ ...job, abortSignal: AbortSignal.timeout(1_800_000) }) }; }
    catch (error) { outcome = { status: "qualification-error", message: message(error) }; }
    // An analysis exception retains its reason; a crashed process is a different outcome.
    process.stdout.write(JSON.stringify(outcome) + "\n"); return;
  }
  const { values } = parseArgs({ options: { output: { type: "string" }, resume: { type: "string" }, cases: { type: "string" }, plan: { type: "string" },
    workers: { type: "string" }, minutes: { type: "string" }, "final-minutes": { type: "string" },
    evaluations: { type: "string" }, finalists: { type: "string" }, help: { type: "boolean" } } });
  if (values.help) {
    process.stdout.write("Usage: npm run fit:registry -- --output NEW_DIRECTORY [--cases baseline,hfref-chronic-dilated-v1] [--workers 4] [--minutes 30]\n"
      + "Or --plan JSON_ARRAY: referenceId, optional startId (default initial), historyFile, candidateInputs, interpretation, coordinateIds.\n"
      + "Repeat one case with up to four distinct start IDs and identical ordered coordinates; all initial cold pairs run before selection.\n"
      + "Qualified initial candidates take priority, then the best searchable existing case score; ties keep declared order.\n"
      + "Default: all active adopted cases. Every case runs independent cold 2/1ms checks; baseline also runs its existing preload protocol.\n"
      + "History reads inputs without restoring the old runtime. Cross-model transfer needs an explicit interpretation.\n"
      + "Unsatisfied cases use one local search: --evaluations 25 per case (including ALL initial candidates), --finalists 3.\n"
      + "A finalist must retain case targets in independent cold 2/1ms checks. Rejected finalists remain recorded; alternatives use the same budget.\n"
      + "The total --minutes budget includes all cases, search and final checks. --final-minutes reserves the smaller of 5 minutes or one third by default.\n"
      + "Search workers stop before that reserve; it does not guarantee that final checks finish. Budget exhaustion is an operational hold.\n"
      + "Resume: --resume DIRECTORY (no other options). Same source, environment, plan, order, anchors and used budgets only.\n"
      + "Completed jobs (including recorded operational failures) are read; only interrupted/unrecorded jobs restart. Use a new run to retry a completed failure.\n"
      + "Offline time is excluded; an unrecorded hard-kill tail is approximated by one heartbeat second.\n"
      + "No mint, gate change, public adoption, release bundle or default change.\n"); return;
  }
  if (values.resume && Object.keys(values).some(k => k !== "resume")) throw new Error("Resume keeps the saved specification; do not supply new options");
  type Prepared = { proposal: Proposal; inputs: Awaited<ReturnType<typeof prepareInputs>> | null; issue: string | null };
  type Plan = { schemaId: string; modelId: string; sourceSha256: string; surface: typeof surface;
    concurrency: number; minutes: number; finalMinutes: number; maximumEvaluations: number; maximumFinalChecks: number;
    prepared: { proposal: Proposal; inputs: (Omit<NonNullable<Prepared["inputs"]>, "previousEvidence"> & { previousEvidenceFile: string | null }) | null; issue: string | null }[] };
  let prior: Plan | undefined;
  if (values.resume) {
    try {
      await readFile(join(resolve(values.resume), "execution.source.json"));
      const sealed = await readSealedFittingRunV1(values.resume);
      await sealed.readJson("report.json");
      process.stdout.write(JSON.stringify({ output: sealed.directory, status: "already-completed", executedJobs: 0 }) + "\n"); return;
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    prior = JSON.parse(await readFile(join(resolve(values.resume), "plan.json"), "utf8")) as Plan;
    if (prior.schemaId !== "main-wire-registry-resumable-run-v2" || prior.modelId !== modelId || canonical(prior.surface) !== canonical(surface))
      throw new Error("Run predates resumable execution or has another model/Surface; start a new run");
  }
  const concurrency = prior?.concurrency ?? Number(values.workers ?? 4), minutes = prior?.minutes ?? Number(values.minutes ?? 30);
  const finalMinutes = prior?.finalMinutes ?? Number(values["final-minutes"] ?? Math.min(5, minutes / 3));
  const maximumEvaluations = prior?.maximumEvaluations ?? Number(values.evaluations ?? 25);
  const maximumFinalChecks = prior?.maximumFinalChecks ?? Number(values.finalists ?? 3);
  if ((!values.output && !values.resume) || values.plan && values.cases || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8
    || !Number.isFinite(minutes) || minutes <= 0 || minutes > 60
    || !Number.isFinite(finalMinutes) || finalMinutes < 0 || finalMinutes > minutes
    || !Number.isInteger(maximumEvaluations) || maximumEvaluations < 1 || maximumEvaluations > 128
    || !Number.isInteger(maximumFinalChecks) || maximumFinalChecks < 1 || maximumFinalChecks > 8)
    throw new Error("Require new --output or --resume; workers 1–8, minutes >0 and <=60, final-minutes 0..minutes, evaluations 1–128 and finalists 1–8");
  const all = Object.keys(definitions) as Reference[];
  const active = all.filter(id => adopted.some(a => definitions[id].adoptedPresetId === a.presetId));
  if (!prior && !values.plan && !values.cases && (adopted.length !== active.length
    || adopted.some(a => !active.some(id => definitions[id].adoptedPresetId === a.presetId))))
    throw new Error("Active adopted cases and fitting definitions differ; no case may be silently omitted");
  const proposals = ownProposals(prior ? prior.prepared.map(p => p.proposal) : values.plan ? JSON.parse(await readFile(values.plan, "utf8"))
    : (values.cases ? values.cases.split(",") : active).map(referenceId => ({ referenceId })), maximumEvaluations);
  const output = resolve(values.resume ?? values.output!);
  const prepared: Prepared[] = prior ? await Promise.all(prior.prepared.map(async p => ({ ...p, inputs: p.inputs ? {
    record: p.inputs.record, binding: p.inputs.binding,
    previousEvidence: p.inputs.previousEvidenceFile ? JSON.parse(await readFile(join(output, p.inputs.previousEvidenceFile), "utf8")) : null,
  } : null }))) : await Promise.all(proposals.map(async p => {
    try { return { proposal: p, inputs: await prepareInputs(p), issue: null }; }
    catch (error) { return { proposal: p, inputs: null, issue: message(error) }; }
  }));
  if (!prior) await mkdir(output);
  const snapshot = await (prior ? resumeFittingSourceSnapshotV1 : beginFittingSourceSnapshotV1)(join(output, "execution"));
  if (prior && prior.sourceSha256 !== snapshot.sourceSha256) throw new Error("Resume plan source differs");
  const jobs: Job[] = prepared.flatMap(p => p.inputs
    ? ([.002, .001] as const).map(nominalDtSec => ({ kind: "qualification-grid" as const, referenceId: p.proposal.referenceId, startId: p.proposal.startId, nominalDtSec,
      candidateInputs: p.inputs!.binding.candidateInputs, sourceSha256: snapshot.sourceSha256 })) : []);
  const fileFor = (j: Job) => `${prefix({ referenceId: j.referenceId, startId: j.startId ?? "initial" })}-${j.nominalDtSec === .002 ? "2ms" : "1ms"}.json`;
  const plan = prior ?? { schemaId: "main-wire-registry-resumable-run-v2", modelId, sourceSha256: snapshot.sourceSha256,
    surface, analysisMethods: methods(surface).capabilities, concurrency, minutes, finalMinutes, maximumEvaluations, maximumFinalChecks,
    prepared: prepared.map(p => ({ ...p, inputs: p.inputs ? { record: p.inputs.record, binding: p.inputs.binding,
      previousEvidenceFile: p.inputs.previousEvidence ? `${prefix(p.proposal)}-previous-result.json` : null } : null })),
    jobs: jobs.map(j => ({ ...j, file: fileFor(j) })), publicPromotionAuthorized: false };
  const journal = await openFittingRunJournalV1({ directory: output, identity: { sourceSha256: snapshot.sourceSha256, planSha256: await hash(plan) },
    maximumWallTimeMs: minutes * 60_000, resume: !!prior });
  const save = journal.saveJson, remainingMs = journal.remainingMs;
  const runGridBatch = async (gridJobs: readonly Job[], filenames: readonly string[]) => batch<Outcome>({
    journal, scriptPath: fileURLToPath(import.meta.url), concurrency, remainingMs,
    jobs: gridJobs.map((j, i) => ({ filename: filenames[i]!, input: j, identity: j })),
    onResult: async (result, index, reused) => {
      process.stdout.write(JSON.stringify({ case: gridJobs[index]!.referenceId, startId: gridJobs[index]!.startId, file: filenames[index], dt: gridJobs[index]!.nominalDtSec, status: result.status, reused }) + "\n"); },
    onFailure: error => ({ status: "operational-failed", message: error.message }),
    onBudget: () => ({ status: "operational-failed", message: "run-wall-time-budget: final grid not completed" }),
  });
  const grid = (outcome: Outcome) => outcome.status === "completed" ? outcome.grid : outcome;
  const rows: { referenceId: string; title: string; status: string; issues: readonly string[]; candidateFile: string | null;
    initialCandidatesFile: string; selectedStartId: string }[] = [];
  try {
    await save("plan.json", plan);
    for (const p of prepared) if (p.inputs) {
      const rebound = await bind({ record: p.inputs.record, targetModelId: modelId, referenceId: p.proposal.referenceId,
        interpretation: p.inputs.binding.interpretation, mappedInputs: p.inputs.binding.candidateInputs,
        validate: v => definition(p.proposal.referenceId).ownInputs(v as Candidate) });
      if (canonical(rebound) !== canonical(p.inputs.binding)) throw new Error("Saved input mapping differs");
      if (p.inputs.previousEvidence) {
        if (canonical((await history(p.inputs.previousEvidence)).record) !== canonical(p.inputs.record)) throw new Error("Saved history/input origin differs");
        await save(`${prefix(p.proposal)}-previous-result.json`, p.inputs.previousEvidence);
      }
    }
    const outcomes = await runGridBatch(jobs, jobs.map(fileFor));
    for (const referenceId of new Set(proposals.map(p => p.referenceId))) {
      const starts = await Promise.all(prepared.filter(p => p.proposal.referenceId === referenceId).map(async p => {
        const indices = jobs.flatMap((j, i) => j.referenceId === referenceId && j.startId === p.proposal.startId ? [i] : []);
        const initialFinal = { coarse: indices.length ? grid(outcomes[indices[0]!]!) : null,
          fine: indices.length ? grid(outcomes[indices[1]!]!) : null, files: indices.map(i => fileFor(jobs[i]!)) };
        return { ...p, startId: p.proposal.startId, initialFinal,
          ...await assessInitial(referenceId, p.inputs ? initialFinal : null) };
      }));
      const { selected: p } = selectInitial(starts), selectedStartId = p.startId;
      const localMaximumEvaluations = maximumEvaluations - starts.length + 1;
      const initialCandidatesFile = `${referenceId}-initial-candidates.json`;
      await save(initialCandidatesFile, initialComparison(referenceId, maximumEvaluations, starts.map(s => ({
          startId: s.startId, inputIssue: s.issue, candidateInputs: s.inputs?.binding.candidateInputs ?? null,
          inputRecord: s.inputs?.record ?? null, binding: s.inputs?.binding ?? null, executionFiles: s.initialFinal.files,
          previousEvidenceFile: s.inputs?.previousEvidence ? `${prefix(s.proposal)}-previous-result.json` : null,
          score: s.score, assessment: s.assessment }))));
      if (!p.inputs) { rows.push({ referenceId, title: referenceId, status: "input-held", issues: starts.flatMap(s => s.issue ? [s.issue] : []),
        candidateFile: null, initialCandidatesFile, selectedStartId }); continue; }
      const initialFinal = p.initialFinal, initialOutcome = p.outcome;
      const evaluationFiles = new Map([["evaluation-001", initialFinal.files[0]!]]);
      const caseBudget = await journal.event(`${referenceId}-search-budget`, { maximumEvaluations, localMaximumEvaluations, maximumFinalChecks, finalMinutes, selectedStartId },
        () => ({ maximumWallTimeMs: remainingMs(), reservedFinalWallTimeMs: Math.min(finalMinutes * 60_000, remainingMs()) }));
      const fitted = await searchCase({ referenceId, candidateInputs: p.inputs.binding.candidateInputs,
        initialOutcome, initialFinal, assess: final => assess(protocol(referenceId), final),
        checkInitialization: (evaluation, final) => initializationAgreement({
          warm: evaluation.outcome.status === "saved-result-ready" ? evaluation.outcome.result : null,
          cold: (final.coarse as { result?: unknown } | null)?.result }),
        coordinateIds: p.proposal.coordinateIds, maximumEvaluations: localMaximumEvaluations, maximumFinalChecks, ...caseBudget,
        timeSnapshot: key => journal.stamp(`${referenceId}-${key}`),
        evaluateBatch: async probes => {
          const filenames = probes.map(e => `${referenceId}-search-${e.id}.json`);
          // Store request identities before dispatch, including the exact anchor.
          await save(`${referenceId}-poll-${probes[0]!.id}.json`, probes.map(e => ({ id: e.id, candidateInputs: e.candidateInputs,
            sourceSha256: snapshot.sourceSha256, nominalDtSec: .002, policyIdentitySha256: initialOutcome.status === "saved-result-ready" ? initialOutcome.result.policyIdentitySha256 : null,
            initialization: e.reuse ? { kind: "continuation", resultSha256: e.reuse.resultSha256,
              checkpointSha256: e.reuse.execution.checkpoint.checkpointSha256 } : { kind: "cold" }, file: filenames[probes.indexOf(e)] })));
          const values = await batch<Screen>({ journal, scriptPath: fileURLToPath(import.meta.url), concurrency,
            remainingMs: () => Math.max(0, remainingMs() - finalMinutes * 60_000),
            jobs: probes.map((e, i) => ({ filename: filenames[i]!, input: { ...e, kind: "rest-screen", referenceId,
              nominalDtSec: .002, sourceSha256: snapshot.sourceSha256 },
              identity: { kind: "rest-screen", referenceId, candidateInputs: e.candidateInputs, nominalDtSec: .002,
                sourceSha256: snapshot.sourceSha256, reuse: e.reuse ? { resultSha256: e.reuse.resultSha256,
                  checkpointSha256: e.reuse.execution.checkpoint.checkpointSha256 } : null } })),
            onResult: async (outcome, index, reused) => { evaluationFiles.set(probes[index]!.id, filenames[index]!);
              process.stdout.write(JSON.stringify({ case: referenceId, evaluation: probes[index]!.id, status: outcome.status, reused }) + "\n"); },
            onFailure: error => ({ status: "operational-interrupted", phase: "worker-process", message: error.message, modelId, wallTimeMs: 0 }),
            onBudget: () => ({ status: "operational-interrupted", phase: "search-wall-time-budget", message: "Search time exhausted; final-check reserve retained", modelId, wallTimeMs: 0 }) });
          // Never accept a result for another source, method, grid or anchor.
          for (const [i, outcome] of values.entries()) if (outcome.status === "saved-result-ready") {
            const r = await readResult(outcome.result), e = probes[i]!, reuse = e.reuse;
            const initialization = reuse ? { kind: canonical(reuse.candidateInputs) === canonical(e.candidateInputs) ? "exact-checkpoint" : "parameter-continuation",
              sourceResultSha256: reuse.resultSha256, checkpointSha256: reuse.execution.checkpoint.checkpointSha256,
              sourceCandidateInputs: reuse.candidateInputs, sourceNominalDtSec: reuse.nominalDtSec } : { kind: "cold" };
            const expected = await hash({ modelId, sourceSha256: snapshot.sourceSha256, candidateInputs: e.candidateInputs,
              nominalDtSec: .002, initialization, policyIdentitySha256: await policyHash(referenceId) });
            if (r.rest.referenceId !== referenceId || r.requestIdentitySha256 !== expected) throw new Error("Search result execution identity differs");
          }
          return values;
        },
        qualify: async evaluation => {
          const finalJobs: Job[] = ([.002, .001] as const).map(nominalDtSec => ({ kind: "qualification-grid", referenceId,
            nominalDtSec, candidateInputs: evaluation.candidateInputs, sourceSha256: snapshot.sourceSha256 }));
          const filenames = finalJobs.map(j => `${referenceId}-final-${evaluation.id}-${j.nominalDtSec === .002 ? "2ms" : "1ms"}.json`);
          await save(`${referenceId}-final-${evaluation.id}-request.json`, finalJobs);
          const completed = await runGridBatch(finalJobs, filenames);
          return { coarse: grid(completed[0]!), fine: grid(completed[1]!), files: filenames };
        } });
      const { selected } = fitted, assessment = selected.assessment;
      const coarse = (selected.final.coarse as { result?: unknown } | null)?.result;
      const candidateInputs = selected.candidateInputs;
      const binding = await bind({ record: p.inputs.record, targetModelId: modelId, referenceId, mappedInputs: candidateInputs,
        interpretation: canonical(candidateInputs) === canonical(p.inputs.binding.candidateInputs) ? p.inputs.binding.interpretation
          : `${p.inputs.binding.interpretation} Bounded case fitting changed only its declared search coordinates; all initial inputs and failed checks remain recorded.`,
        validate: input => definition(referenceId).ownInputs(input as Candidate) });
      const searchFile = `${referenceId}-search.json`;
      if (fitted.search) {
        const s = fitted.search;
        const retained = [...s.evaluations].filter(e => e.score.rank !== null)
          .sort((a, b) => improves(a.score, b.score) ? -1 : improves(b.score, a.score) ? 1 : 0).slice(0, 3);
        await save(searchFile, { ...s, evaluations: s.evaluations.map(({ outcome, ...e }) => ({ ...e,
          outcome: { status: outcome.status, file: evaluationFiles.get(e.id), ...(outcome.status === "saved-result-ready"
            ? { resultSha256: outcome.result.resultSha256, initialization: outcome.result.initialization,
              cycles: outcome.result.execution.completedCycleCount } : { message: outcome.message }) } })),
        retainedCandidates: retained.map(e => ({ evaluationId: e.id, candidateInputs: e.candidateInputs, score: e.score,
          evidenceFile: evaluationFiles.get(e.id), finalDecision: s.finalChecks.find(f => f.evaluationId === e.id)?.decision ?? null })),
        finalCandidateFile: `${referenceId}-candidate.json`, publicPromotionAuthorized: false });
        await save(`${referenceId}-best-input.json`, { candidateInputs: s.bestCandidateInputs, score: s.bestScore,
          qualification: "see-final-checks-separately", selectedFinalId: s.selectedFinalId, publicPromotionAuthorized: false });
      }
      let evidence = null, evidenceIssue: string | null = coarse ? null : "coarse-raw-evidence-unavailable";
      if (coarse) {
        try { const r = await readResult(coarse);
          evidence = { resultSha256: r.resultSha256, checkpoint: r.execution.checkpoint, rest: r.rest,
            referenceContext: r.referenceContext, cycles: r.execution.completedCycleCount };
        } catch (error) { evidenceIssue = message(error); }
      }
      const candidateFile = `${referenceId}-candidate.json`;
      const comparisonFile = `${referenceId}-comparison.json`;
      await save(comparisonFile, await compare({ referenceId, previous: p.inputs.previousEvidence, current: coarse ?? null,
        analysisSourceSha256: snapshot.sourceSha256 }));
      const candidate = { schemaId: "main-wire-registry-research-candidate-v1", modelId, surface, referenceId,
        sourceSha256: snapshot.sourceSha256, inputRecord: p.inputs.record, binding,
        candidateInputs, evidence, evidenceIssue, assessment,
        executionFiles: selected.final.files, comparisonFile,
        previousEvidenceFile: p.inputs.previousEvidence ? `${prefix(p.proposal)}-previous-result.json` : null,
        initialCandidatesFile, selectedStartId,
        adjustment: { reason: fitted.reason, searchFile: fitted.search ? searchFile : null,
          finalEvaluationId: selected.evaluationId,
          selectedFinalId: fitted.search?.selectedFinalId ?? null, bestEvaluationId: fitted.search?.bestId ?? null }, publicPromotionAuthorized: false };
      await save(`${referenceId}-inputs.json`, p.inputs.record);
      await save(`${referenceId}-qualification.json`, assessment.qualification);
      await save(candidateFile, { ...candidate, recordSha256: await hash(candidate) });
      rows.push({ referenceId, title: assessment.title, status: evidenceIssue ? "held" : assessment.status,
        issues: [...assessment.qualification.issues, ...assessment.caseTargetIssues, ...(evidenceIssue ? [evidenceIssue] : []),
          ...(fitted.search && !fitted.search.selectedFinalId ? [`search:${fitted.reason}; no final-qualified candidate`] : [])], candidateFile,
        initialCandidatesFile, selectedStartId });
    }
    const completedAtMs = await journal.stamp("completed");
    await save("report.json", { modelId, sourceSha256: snapshot.sourceSha256, surfaceReleaseId: surface.surfaceReleaseId,
      rows, wallTimeMs: completedAtMs, scope: "case-owned-bounded-search-and-independent-final-checks",
      timing: { basis: "active fitting time; source archive/setup and offline time excluded", hardKillTailAllowanceMs: 1000, hardKillTailExact: false },
      search: { maximumEvaluationsPerCase: maximumEvaluations, maximumFinalChecksPerCase: maximumFinalChecks,
        maximumWallTimeMs: minutes * 60_000, reservedFinalWallTimeMs: finalMinutes * 60_000 },
      publication: "not-authorized", allCasesReported: rows.length === new Set(proposals.map(p => p.referenceId)).size,
      initialCandidateCount: proposals.length });
    const md = ["# Registry fitting", "", "まず元の入力を独立cold 2/1 msで確認し、未達の症例だけを許可済みの範囲で探索します。最終確認と症例の目標は別々に記録します。正式採択・公開は行っていません。", "",
      "初期候補は、指定順で最初に最終条件を満たしたものを選びます。該当例がなければ数値・測定の保留のない候補を症例スコアで比較します。これは臨床的な最良例を選ぶ規則ではありません。", "",
      ...rows.flatMap(r => [`## ${r.title}`, "", `状態: ${r.status}`, "",
        ...(r.issues.length ? r.issues.map(i => `- ${i}`) : ["自動確認での保留なし。波形・症例の意味等のレビューは未完了です。"]), "",
        `[初期候補の比較](./${r.initialCandidatesFile})（選択: ${r.selectedStartId}）`, "",
        ...(r.candidateFile ? [`[入力・出自・観測・確認資料](./${r.candidateFile})`, ""] : [])])].join("\n");
    await journal.saveText("REPORT.md", md);
    await snapshot.finish(journal.files());
    process.stdout.write(JSON.stringify({ output, rows, wallTimeMs: completedAtMs, publicPromotionAuthorized: false }) + "\n");
  } catch (error) { await save(`attempt-${journal.attempt}-failure.json`, { status: "run-incomplete", message: message(error), publicPromotionAuthorized: false }); throw error; }
  finally { await journal.close(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
