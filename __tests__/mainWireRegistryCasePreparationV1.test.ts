import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { createMainWireCaseInputRecordV1 as create, readMainWireCaseInputRecordV1 as read,
  readMainWireHistoricalFittingEvidenceV1 as history, bindMainWireCaseInputRecordV1 as bind,
  compareMainWireCaseInputsV1 as compare, unwrapMainWireFittingEvidenceV1 as unwrap } from "@/analysis/registry/MainWireCaseInputRecordV1";
import { MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1 as definitions } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import { CURRENT_MODEL_PRESETS_V1 as adopted } from "@/data/model-releases/CurrentModelReleaseV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { writeFittingRunJsonV1 as save } from "@/tools/scientific/FittingRunFilesV1";
import { prepareRegistryCaseAssessmentV1 as assess, resolveMainWireRegistryCaseProtocolV1 as protocol,
  type RegistryCaseProtocolV1 as Protocol } from "@/tools/scientific/MainWireRegistryCaseProtocolsV1";
import * as fitting from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import * as observer from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import * as traceSource from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { runMainWireStaticBaselineQualificationGridV1 as baselineGrid,
  assessMainWireStaticBaselineQualificationV1 as baselinePair } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { compareMainWireCaseEvidenceV1 as compareEvidence } from "@/analysis/methods/mainWire/MainWireCaseComparisonV1";
import { readSealedFittingRunV1 as sealed, fittingFileSha256V1 as fileHash } from "@/tools/scientific/SealedFittingRunV1";
import { assertMainWireReviewNumericalSourceV1 as assertSource } from "@/tools/registry/MainWireRegistryReviewArtifactV1";
import { composeRegistryCaseReviewDocumentV1 as documentFor, mainWireReviewBeatSamplesV1 as beatSamples,
  registryCaseReviewIndexV1 as indexFor } from "@/tools/modelDocumentation/authoring/RegistryCaseReviewDocumentV1";
import { readRegistryReviewCandidateV1 as reviewCandidate } from "@/tools/scientific/prepareMainWireRegistryReviewV1";
import * as initialization from "@/analysis/methods/mainWire/MainWireCaseInitializationAgreementV1";
import * as protocols from "@/tools/scientific/MainWireRegistryCaseProtocolsV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStaticCaseIdentityV1";

const temporary: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(temporary.splice(0).map(p => rm(p, { recursive: true, force: true }))); });
const record = () => create({ modelId: "retired-model", referenceId: "third-test-case", candidateInputs: { volume: 10, removed: 2 },
  previousAssessment: { status: "historical-only" }, provenance: { kind: "new-construction", sourceRecordSha256: "a".repeat(64), description: "Test only" } });

describe("registry input and candidate-material boundaries", () => {
  it("reads inert old evidence and binds explicitly mapped inputs without restoring any runtime", async () => {
    const restore = vi.spyOn(Session, "restore").mockImplementation(async () => { throw new Error("Retired runtime unavailable"); });
    const body = { schemaId: "main-wire-static-case-fitting-result-v1", modelId: "retired-model", sourceSha256: "a".repeat(64),
      candidateInputs: { volume: 10, removed: 2 }, rest: { referenceId: "third-test-case", status: "historical-only" },
      execution: { status: "accepted", checkpoint: "intentionally-not-restorable", diagnostics: { raw: [1, 2] } } };
    const previous = await history({ ...body, resultSha256: await hash(body) });
    expect(previous.diagnostics).toEqual(body.execution.diagnostics);
    const mapped = await bind({ record: previous.record, targetModelId: "new-model", referenceId: "third-test-case",
      mappedInputs: { volume: 12, added: 3 }, interpretation: "Explicit new-model mapping for a test", validate: v => v });
    expect(mapped).toMatchObject({ initialization: "cold", priorCheckpointImported: false, publicPromotionAuthorized: false });
    expect((mapped as { changes: unknown }).changes).toEqual([
      { path: "/added", kind: "added", previous: null, current: 3 },
      { path: "/removed", kind: "removed", previous: 2, current: null },
      { path: "/volume", kind: "changed", previous: 10, current: 12 },
    ]);
    expect(restore).not.toHaveBeenCalled();
    await expect(history({ ...body, resultSha256: "f".repeat(64) })).rejects.toThrow(/digest/);
  });
  it("rejects edited records, reference substitutions and silent target defaults", async () => {
    const r = await record();
    await expect(read({ ...r, candidateInputs: { volume: 50 } })).rejects.toThrow(/digest/);
    await expect(bind({ record: r, targetModelId: "new", referenceId: "other", interpretation: "explicit", validate: v => v })).rejects.toThrow(/interpretation/);
    await expect(bind({ record: r, targetModelId: "new", referenceId: r.referenceId, interpretation: "explicit",
      validate: v => ({ ...v as object, silentDefault: true }) })).rejects.toThrow(/silently/);
    expect(compare({ "a/b": 1 }, { "a/b": 2 })[0]!.path).toBe("/a~1b");
    expect(compare(r.candidateInputs, structuredClone(r.candidateInputs))).toEqual([]);
  });
  it("derives every active initial input from its adopted record and preserves reference scope", () => {
    const active = Object.values(definitions).filter(d => d.adoptedPresetId !== null);
    expect(active).toHaveLength(adopted.length);
    expect(() => seed("as-high-gradient-valve-only-v1")).toThrow(/Adopted case/);
    for (const d of active) {
      const preset = adopted.find(p => p.presetId === d.adoptedPresetId)!;
      const fixture = preset.capture.fixture as unknown as Record<string, unknown>;
      const c = seed(d.referenceId);
      expect(c).toMatchObject({ anatomyId: fixture.anatomyId, ventricularContractilityScale: 1,
        hemodynamicResearchInputs: fixture.hemodynamicResearchInputs, mechanismResearchInputs: fixture.mechanismResearchInputs });
      expect(d.context().reference.referenceId).toBe(d.referenceId);
    }
    const c = seed("hfref-chronic-dilated-v1");
    expect(() => definitions["hfref-chronic-dilated-v1"].ownInputs({ ...c,
      hemodynamicResearchInputs: { ...c.hemodynamicResearchInputs, heartRateBpm: 60 } })).toThrow(/HR70-only/);
  });
  it("passes a third case through assessment material without embedding healthy rules", async () => {
    const d: Protocol = { referenceId: "third-test-case", adoptedPresetId: "not-adopted", title: "Test only",
      reviewItems: ["case-specific-evidence"], runGrid: async () => null,
      assessPair: async input => ({ status: "checks-passed", issues: [], input }) };
    const grids = { coarse: { marker: 1 }, fine: { marker: 2 } };
    expect(await assess(d, grids)).toMatchObject({ referenceId: d.referenceId, status: "review-pending",
      qualification: { input: grids }, reviewItems: [{ id: "case-specific-evidence", status: "review-pending" }], publicPromotionAuthorized: false });
    expect(await assess({ ...d, assessPair: async () => ({ status: "held", issues: ["missing-required-observation"] }) }, grids))
      .toMatchObject({ status: "held", qualification: { issues: ["missing-required-observation"] } });
    expect(await assess({ ...d, assessPair: async () => { throw new Error("invalid evidence"); } }, grids))
      .toMatchObject({ status: "held", qualification: { issues: ["invalid evidence"] } });
    expect(await assess(d, { ...grids, fine: { status: "qualification-error", message: "native observation failed" } }))
      .toMatchObject({ status: "held", qualification: { issues: ["fine:qualification-error:native observation failed"] } });
  });
  it("keeps raw baseline evidence when its native observation is unavailable", async () => {
    const result = { execution: { diagnostics: { completedBeat: { marker: "raw-beat" } } } };
    vi.spyOn(fitting, "runMainWireStaticCaseFittingV1").mockResolvedValue({ status: "saved-result-ready", result } as never);
    vi.spyOn(traceSource, "mainWireStandard70TimingAndInletObservationTraceV1").mockReturnValue([]);
    vi.spyOn(observer, "observeMainWireBaselineV2").mockImplementation(() => {
      throw new observer.MainWireBaselineObservationUnavailableErrorV2("incomplete-filling-phase", "right", "test held observation");
    });
    const grid = await baselineGrid({ candidateInputs: seed("baseline"), sourceSha256: "a".repeat(64), nominalDtSec: .002 });
    expect(grid).toMatchObject({ status: "grid-observation-held", result, issue: { code: "incomplete-filling-phase" } });
    const paired = await baselinePair({ coarse: grid, fine: grid });
    expect(paired.status).toBe("held");
    expect(paired.issues).toContain("coarse:observation:incomplete-filling-phase");
    expect(paired.issues).not.toContain("coarse:execution-failed");
  });
  it("checks cold targets separately from qualification and ignores pair file metadata", async () => {
    const d: Protocol = { referenceId: "third-test-case", adoptedPresetId: "none", title: "Test only", reviewItems: [],
      runGrid: async () => null, assessPair: async () => ({ status: "checks-passed", issues: [] }),
      scoreRest: grid => ({ status: "test", rank: [0], targetsMet: (grid as { met: boolean }).met,
        observations: [], holds: ["target:outside-interval"] }) };
    const pair = { coarse: { met: true }, fine: { met: true }, files: ["coarse.json", "fine.json"] };
    expect(await assess(d, pair)).toMatchObject({ status: "review-pending", caseTargetIssues: [], searchHoldIssues: [] });
    expect(await assess(d, { ...pair, fine: { met: false } })).toMatchObject({ status: "held",
      qualification: { status: "checks-passed" }, caseTargetIssues: ["fine:case-target:target:outside-interval"], searchHoldIssues: [] });
    expect(await assess({ ...d, assessPair: async () => ({ status: "held", issues: ["paired-grid-sensitivity"] }) }, pair))
      .toMatchObject({ status: "held", searchHoldIssues: ["paired-grid-sensitivity"] });
  });
  it("permits baseline target fitting without treating skipped reserve or numerical failures as physiological evidence", async () => {
    const grid = { status: "grid-evaluated", issues: ["rest:held"], preloadReserve: null, result: { rest: {
      referenceId: "baseline", status: "held", assessment: { operating: [{ metricId: "test-output", actual: 1, lower: 2, upper: 3, status: "failed" }],
        unavailable: [], invalidOrFailedRetained: [], anatomyReviewRequired: false } } } };
    const known = ["coarse:rest-reobservation", "coarse:grid-hold", "coarse:reserve-input-binding", "paired-preload-reserve"];
    const p = { ...protocol("baseline"), assessPair: async () => ({ status: "held", issues: known }) };
    expect(await assess(p, { coarse: grid, fine: grid })).toMatchObject({ status: "held", searchHoldIssues: [] });
    expect(await assess({ ...p, assessPair: async () => ({ status: "held", issues: [...known, "paired-pressure-rate-quality"] }) }, { coarse: grid, fine: grid }))
      .toMatchObject({ status: "held", searchHoldIssues: ["paired-pressure-rate-quality"] });
    const observationHeld = { ...grid, issues: ["unclassified-observation-failure"] };
    expect((await assess(p, { coarse: observationHeld, fine: observationHeld })).searchHoldIssues).toEqual(known);
    for (const patch of [{ invalidOrFailedRetained: ["waveform.LVP.single-peak-no-ringing"] },
      { invalidOrFailedRetained: ["reference-observation-invalid"] }, { anatomyReviewRequired: true }]) {
      const guarded = { ...grid, result: { rest: { ...grid.result.rest,
        assessment: { ...grid.result.rest.assessment, ...patch } } } };
      expect((await assess(p, { coarse: guarded, fine: guarded })).searchHoldIssues).toEqual(known);
      expect(p.scoreRest(guarded).rank).toBeNull();
    }
  });
  it("publishes complete result files without overwriting earlier work", async () => {
    const directory = await mkdtemp(join(tmpdir(), "circleheart-fitting-result-")); temporary.push(directory);
    const path = await save(directory, "case.json", { complete: true });
    await expect(save(directory, "case.json", { changed: true })).rejects.toThrow();
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual({ complete: true });
    expect(await readdir(directory)).toEqual(["case.json"]);
    await expect(save(directory, "../escape.json", {})).rejects.toThrow(/filename/);
  });
  it("keeps missing or incompatible prior raw evidence distinct from zero change", async () => {
    const restore = vi.spyOn(Session, "restore");
    const comparison = await compareEvidence({ referenceId: "baseline", previous: null, current: { invalid: true }, analysisSourceSha256: "a".repeat(64) });
    expect(comparison).toMatchObject({ status: "incomplete", rows: [], previous: { status: "missing" },
      current: { status: "unavailable" }, numericalStepsExecuted: 0, historicalCheckpointRestored: false, publicPromotionAuthorized: false });
    expect(restore).not.toHaveBeenCalled();
  });
  it("reuses the same dossier for an unrelated held case without importing historical HFrEF claims", async () => {
    const comparison = await compareEvidence({ referenceId: "third-test-case" as never, previous: null, current: null, analysisSourceSha256: "a".repeat(64) });
    const out = await documentFor({ referenceId: "third-test-case", title: "Test <script>alert(1)</script>", kind: "preset",
      description: "Case-specific meaning", modelId: "test-model", surface: { test: true }, context: { caseRule: "not-a-normal-rule" },
      assessment: { reviewItems: ["case-specific-review"] }, status: "held", issues: ["missing raw data"], comparison,
      results: [], previousDiagnostics: null, candidateInputs: { testOnly: 1 }, inputBinding: null, sourceFiles: [] });
    expect(out.document).toMatchObject({ identity: { referenceId: "third-test-case" }, status: "held", equations: null,
      observations: [], historicalSupportingExperiments: "not-revalidated", publicPromotionAuthorized: false });
    expect(out.html).toContain("&lt;script&gt;");
    expect(out.html).not.toContain("<script>");
    expect(out.html).toContain("case-specific-review");
    expect(out.html).not.toContain("historical supporting-experiment construction");
    const { contentSha256, ...body } = out.document;
    expect(contentSha256).toBe(await hash(body));
  });
  it("requires the actual artifact source graph, not just an unchanged model ID", () => {
    const files = [{ path: "engine/exact.ts", sha256: "a".repeat(64) }, { path: "package-lock.json", sha256: "b".repeat(64) }];
    expect(() => assertSource(files, [...files, { path: "tools/research.ts", sha256: "c".repeat(64) }])).not.toThrow();
    expect(() => assertSource(files, files.slice(0, 1))).toThrow(/package-lock/);
    expect(() => assertSource(files, [{ ...files[0]!, sha256: "c".repeat(64) }, files[1]!])).toThrow(/rerun/);
  });
  it("requires every chosen file to belong to a valid sealed run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "circleheart-fitting-seal-")); temporary.push(dir);
    const result = await save(dir, "case.json", { marker: 1 }), archive = await save(dir, "source.json", { testArchive: true });
    const sourceFiles = [{ path: "engine/test.ts", sha256: "a".repeat(64) }];
    const seal = { schemaId: "fitting-source-snapshot-v1", sourceSha256: fileHash(JSON.stringify(sourceFiles)), files: sourceFiles,
      archive: { filename: "source.json", sha256: fileHash(await readFile(archive)) },
      results: [{ filename: "case.json", sha256: fileHash(await readFile(result)) }] };
    await save(dir, "execution.source.json", seal);
    const run = await sealed(dir);
    expect(await run.readJson("case.json")).toEqual({ marker: 1 });
    await save(dir, "not-sealed.json", { extra: true });
    await expect(run.readJson("not-sealed.json")).rejects.toThrow(/not part/);
    await expect(run.readJson("../case.json")).rejects.toThrow(/member/);
    await expect(reviewCandidate({ schemaId: "main-wire-registry-research-candidate-v1" }, run)).rejects.toThrow(/Unexpected/);
    // Removal is a corruption too; there is no fallback to another result.
    await rm(result);
    await expect(sealed(dir)).rejects.toThrow();
  });
  it("accepts the current CLI envelopes but never treats a failure wrapper as raw evidence", () => {
    const raw = { schemaId: "main-wire-static-case-fitting-result-v1" };
    expect(unwrap(raw)).toBe(raw);
    expect(unwrap({ status: "saved-result-ready", result: raw })).toBe(raw);
    expect(unwrap({ status: "completed", grid: { status: "grid-evaluated", result: raw } })).toBe(raw);
    expect(unwrap({ status: "completed", grid: { status: "grid-observation-held", result: raw } })).toBe(raw);
    expect(() => unwrap({ status: "operational-failed", result: raw })).toThrow(/envelope/);
  });
  it("uses the entire native completed beat, not the truncated terminal numerical cycle, for PV figures", () => {
    const sample = (t: number) => ({ acceptedTimeSec: t, acceptedDtSec: .1 });
    const d = { completedBeat: { startTimeSec: 0, endTimeSec: .4 }, terminalTrace: [.3, .4, .5].map(sample),
      timingAndInletPrecedingTrace: [.1, .2].map(sample) };
    expect(beatSamples(d as never).map(p => p.acceptedTimeSec)).toEqual([.1, .2, .3, .4]);
    expect(() => beatSamples({ ...d, timingAndInletPrecedingTrace: [sample(.1)] } as never)).toThrow(/contiguously/);
  });
  it("keeps material-held cases in the index and escapes imported titles", () => {
    const html = indexFor([{ title: "No data <script>", status: "material-held", issues: ["source missing"], documentFile: null },
      { title: "One case", status: "review-pending", issues: [], documentFile: "one-case-document.json" }]);
    expect(html).toContain("No data &lt;script&gt;");
    expect(html).toContain("source missing");
    expect(html).toContain('href="one-case.html"');
    expect(html).not.toContain("<script>");
  });
  it("does not let an edited full input borrow a successful result even after its hashes are recomputed", async () => {
    const candidateInputs = seed("baseline"), sourceSha256 = "a".repeat(64);
    const inputRecord = await create({ modelId, referenceId: "baseline", candidateInputs, previousAssessment: null,
      provenance: { kind: "new-construction", sourceRecordSha256: sourceSha256, description: "test" } });
    const binding = await bind({ record: inputRecord, targetModelId: modelId, referenceId: "baseline",
      interpretation: "test unchanged meaning", validate: v => definitions.baseline.ownInputs(v as never) });
    const body = { schemaId: "main-wire-registry-research-candidate-v1", modelId, sourceSha256, surface,
      referenceId: "baseline", candidateInputs, inputRecord, binding, evidence: null,
      executionFiles: ["coarse.json", "fine.json"], publicPromotionAuthorized: false };
    const run = { seal: { sourceSha256 } as never, readJson: async () => ({ status: "completed", grid: { result: {} } }) };
    vi.spyOn(fitting, "readMainWireStaticCaseFittingResultV1").mockResolvedValue({ candidateInputs: { ...candidateInputs,
      hemodynamicResearchInputs: { ...candidateInputs.hemodynamicResearchInputs, totalBloodVolumeMl: 4800 } } } as never);
    await expect(reviewCandidate({ ...body, recordSha256: await hash(body) }, run)).rejects.toThrow(/full case inputs/);
    const swapped = { ...body, surface: { ...surface, surfaceReleaseId: "wrong-surface" } };
    await expect(reviewCandidate({ ...swapped, recordSha256: await hash(swapped) }, run)).rejects.toThrow(/Surface/);
  });
  it("binds an initial-versus-final comparison to the search's actual cold evidence", async () => {
    const candidateInputs = seed("baseline"), sourceSha256 = "a".repeat(64);
    const inputRecord = await create({ modelId, referenceId: "baseline", candidateInputs, previousAssessment: null,
      provenance: { kind: "new-construction", sourceRecordSha256: sourceSha256, description: "test" } });
    const binding = await bind({ record: inputRecord, targetModelId: modelId, referenceId: "baseline",
      interpretation: "test", validate: v => definitions.baseline.ownInputs(v as never) });
    const body = { schemaId: "main-wire-registry-research-candidate-v1", modelId, sourceSha256, surface,
      referenceId: "baseline", candidateInputs, inputRecord, binding, evidence: null,
      executionFiles: ["coarse.json", "fine.json"], adjustment: { searchFile: "search.json", selectedFinalId: null }, publicPromotionAuthorized: false };
    const raw = (dt: number) => ({ schemaId: "main-wire-static-case-fitting-result-v1", modelId, sourceSha256, candidateInputs,
      resultSha256: "b".repeat(64), rest: { referenceId: "baseline" }, nominalDtSec: dt, initialization: { kind: "cold" } });
    const search = { referenceId: "baseline", selectedFinalId: null, evaluations: [{ id: "evaluation-001", candidateInputs,
      outcome: { file: "initial.json", resultSha256: "b".repeat(64) } }] };
    let initial = { ...raw(.002), sourceSha256: "c".repeat(64) };
    const run = { seal: { sourceSha256 } as never, readJson: async (name: string) => name === "search.json" ? search
      : { status: "completed", grid: { status: "saved-result-ready", result: name === "initial.json" ? initial : raw(name === "coarse.json" ? .002 : .001) } } };
    vi.spyOn(fitting, "readMainWireStaticCaseFittingResultV1").mockImplementation(async value => value as never);
    await expect(reviewCandidate({ ...body, recordSha256: await hash(body) }, run)).rejects.toThrow(/Initial search evidence/);
    initial = { ...raw(.001) };
    await expect(reviewCandidate({ ...body, recordSha256: await hash(body) }, run)).rejects.toThrow(/Initial search evidence/);
  });
  it("recomputes initialization evidence, rejects missing or edited checks, and preserves a hold after a passed cold pair", async () => {
    // Wiring-only fixtures: native trace comparison and result-digest validation
    // have their own tests. No simulation is needed to test this trust boundary.
    const candidateInputs = seed("baseline"), sourceSha256 = "a".repeat(64);
    const inputRecord = await create({ modelId, referenceId: "baseline", candidateInputs, previousAssessment: null,
      provenance: { kind: "new-construction", sourceRecordSha256: sourceSha256, description: "wiring test" } });
    const binding = await bind({ record: inputRecord, targetModelId: modelId, referenceId: "baseline",
      interpretation: "test", validate: v => definitions.baseline.ownInputs(v as never) });
    const body = { schemaId: "main-wire-registry-research-candidate-v1", modelId, sourceSha256, surface,
      referenceId: "baseline", candidateInputs, inputRecord, binding, evidence: null,
      executionFiles: ["coarse.json", "fine.json"], adjustment: { searchFile: "search.json", selectedFinalId: "evaluation-002",
        finalEvaluationId: "evaluation-002" }, publicPromotionAuthorized: false };
    const candidate = { ...body, recordSha256: await hash(body) };
    const raw = (dt: number, warm = false) => ({ schemaId: "main-wire-static-case-fitting-result-v1", modelId, sourceSha256, candidateInputs,
      resultSha256: (warm ? "c" : "b").repeat(64), rest: { referenceId: "baseline" }, nominalDtSec: dt,
      initialization: { kind: warm ? "parameter-continuation" : "cold" } });
    const warm = raw(.002, true), cold = raw(.002);
    let check = { status: "passed", issues: [] as string[], reportSha256: "d".repeat(64) };
    const decision: { initializationCheck?: unknown } = { initializationCheck: check };
    const search = { referenceId: "baseline", selectedFinalId: "evaluation-002", finalChecks: [{ evaluationId: "evaluation-002", decision }],
      evaluations: [{ id: "evaluation-001", candidateInputs, outcome: { file: "initial.json", resultSha256: cold.resultSha256 } },
        { id: "evaluation-002", candidateInputs, outcome: { file: "warm.json", resultSha256: warm.resultSha256 } }] };
    const run = { seal: { sourceSha256 } as never, readJson: async (name: string) => name === "search.json" ? search
      : { status: "completed", grid: { status: "saved-result-ready", result: name === "warm.json" ? warm : raw(name === "fine.json" ? .001 : .002) } } };
    vi.spyOn(fitting, "readMainWireStaticCaseFittingResultV1").mockImplementation(async v => v as never);
    const recheck = vi.spyOn(initialization, "assessMainWireCaseInitializationAgreementV1").mockImplementation(async () => check as never);
    vi.spyOn(protocols, "prepareRegistryCaseAssessmentV1").mockResolvedValue({ status: "review-pending", qualification: {
      status: "checks-passed", issues: [] }, searchHoldIssues: [], caseTargetIssues: [] } as never);
    expect((await reviewCandidate(candidate, run)).assessment.status).toBe("review-pending");
    expect(recheck).toHaveBeenCalledWith({ warm, cold });
    delete decision.initializationCheck;
    await expect(reviewCandidate(candidate, run)).rejects.toThrow(/comparison evidence missing/);
    decision.initializationCheck = { ...check, status: "held" };
    await expect(reviewCandidate(candidate, run)).rejects.toThrow(/comparison from raw evidence/);
    check = { status: "held", issues: ["initialization-dependent:absolutePressureMmHg.LV"], reportSha256: "e".repeat(64) };
    decision.initializationCheck = check;
    const held = await reviewCandidate(candidate, run);
    expect(held.assessment.status).toBe("held");
    expect(held.assessment.searchHoldIssues).toEqual(check.issues);
    expect(held.initializationWarm).toBe(warm);
  });
});
