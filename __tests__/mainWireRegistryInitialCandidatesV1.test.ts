import { afterEach, describe, expect, it, vi } from "vitest";
import { ownMainWireRegistryProposalsV1 as own, mainWireInitialCandidatePrefixV1 as prefix,
  selectMainWireInitialCandidateV1 as select, mainWireInitialCandidateComparisonV1 as comparison,
  assessMainWireInitialCandidateV1 as assessInitial,
  type MainWireInitialCandidateMaterialV1 as Start } from "@/tools/scientific/MainWireRegistryInitialCandidatesV1";
import { readRegistryInitialCandidatesV1 as readStarts } from "@/tools/scientific/prepareMainWireRegistryReviewV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import { MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1 as definitions } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { createMainWireCaseInputRecordV1 as record, bindMainWireCaseInputRecordV1 as bind } from "@/analysis/registry/MainWireCaseInputRecordV1";
import { MAIN_WIRE_STATIC_CASE_MODEL_ID_V1 as modelId } from "@/domain/model/MainWireStaticCaseIdentityV1";
import * as fitting from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import * as protocols from "@/tools/scientific/MainWireRegistryCaseProtocolsV1";
import { searchMainWireRegistryCaseV1 as search } from "@/tools/scientific/MainWireRegistryCaseSearchV1";
import { compareMainWireCaseEvidenceV1 as compareEvidence } from "@/analysis/methods/mainWire/MainWireCaseComparisonV1";
import { composeRegistryCaseReviewDocumentV1 as documentFor } from "@/tools/modelDocumentation/authoring/RegistryCaseReviewDocumentV1";
import { mainWireRegistryFamilyLayersV1 as family } from "@/tools/scientific/runMainWireRegistryFamilyV1";

afterEach(() => vi.restoreAllMocks());
// Scheduling/material fixtures only. No physiological evidence is synthesized.
const start = (startId: string, rank: number, status: "review-pending" | "held" = "held", hold = false): Start => ({
  startId, inputIssue: null, inputRecord: null, binding: null, candidateInputs: seed("baseline"), executionFiles: [], previousEvidenceFile: null,
  score: { status: "synthetic", rank: [rank], targetsMet: status === "review-pending", observations: [], holds: [] },
  assessment: { status, qualification: { issues: hold ? ["synthetic-measurement-hold"] : [] },
    searchHoldIssues: hold ? ["synthetic-measurement-hold"] : [], caseTargetIssues: [] },
});

describe("preregistered initial candidates", () => {
  it("retains operational deadlines instead of diagnosing failed physiology", async () => {
    const failed = { status: "operational-failed", message: "run-wall-time-budget" };
    const result = await assessInitial("baseline", { coarse: failed, fine: failed });
    expect(result.outcome).toMatchObject({ status: "operational-interrupted", message: failed.message });
    expect(result.score).toMatchObject({ status: "operational-interrupted", rank: null, targetsMet: false });
    expect(result.assessment?.status).toBe("held");
  });
  it("keeps a one-case default and permits distinct starts without conflating output files", () => {
    expect(own([{ referenceId: "baseline" }], 1)).toEqual([{ referenceId: "baseline", startId: "initial" }]);
    const proposals = own([{ referenceId: "baseline" }, { referenceId: "baseline", startId: "second" }], 2);
    expect(proposals.map(prefix)).toEqual(["baseline", "baseline--second"]);
    expect(() => own([{ referenceId: "baseline" }, { referenceId: "baseline", startId: "initial" }], 2)).toThrow(/distinct/);
    expect(() => own([{ referenceId: "baseline", startId: "../escape" }], 1)).toThrow(/safe/);
    expect(() => own([{ referenceId: "baseline", newField: true }], 1)).toThrow(/known/);
  });
  it("bounds starts within each case's shared budget and keeps identical ordered coordinates", () => {
    const four = ["a", "b", "c", "d"].map(startId => ({ referenceId: "baseline", startId }));
    expect(own(four, 4)).toHaveLength(4);
    expect(() => own(four, 3)).toThrow(/budget/);
    expect(() => own([...four, { referenceId: "baseline", startId: "e" }], 5)).toThrow(/four/);
    expect(() => own(four, NaN)).toThrow(/1–128/);
    expect(own([{ referenceId: "baseline" }, { referenceId: "hfref-chronic-dilated-v1" }], 1)).toHaveLength(2);
    expect(() => own([{ ...four[0], coordinateIds: ["tbv", "lv-active"] },
      { ...four[1], coordinateIds: ["lv-active", "tbv"] }], 4)).toThrow(/same ordered/);
    expect(() => own([{ referenceId: "baseline", coordinateIds: ["tbv", "tbv"] }], 1)).toThrow(/distinct/);
  });
  it("keeps a selected parent explicit and shared across AS starts", () => {
    const referenceId = "as-low-flow-reduced-ef-v1";
    expect(own([{ referenceId, parentRun: "/sealed/parents" }], 3)[0])
      .toMatchObject({ parentRun: "/sealed/parents", coordinateIds: ["aortic-area"] });
    expect(() => own([{ referenceId, parentRun: "" }], 3)).toThrow();
    expect(() => own([{ referenceId, parentRun: "/a" }, { referenceId, startId: "other", parentRun: "/b" }], 3)).toThrow(/same comparison parent/);
  });
  it("orders the two current comparison layers without substituting missing parents or broadening AS search", () => {
    const proposals = own(Object.values(definitions).map(d => ({ referenceId: d.referenceId })), 3);
    const layers = family(proposals);
    expect(layers.roots.map(p => p.referenceId).sort()).toEqual(["baseline", "hfref-chronic-dilated-v1"]);
    expect(layers.children).toHaveLength(2);
    expect(layers.children.every(p => p.coordinateIds?.join() === "aortic-area")).toBe(true);
    expect(() => family(proposals.filter(p => p.referenceId !== "baseline"))).toThrow(/include baseline/);
    expect(() => family(proposals.map(p => p.referenceId === "as-low-flow-reduced-ef-v1" ? { ...p, coordinateIds: ["lv-active"] } : p)))
      .toThrow(/only aortic-area/);
  });
  it("prefers an independently qualified start over a better-scoring but held start", () => {
    const starts = [start("better-but-held", 0, "review-pending", true), start("qualified", 3, "review-pending"), start("searchable", 1)];
    expect(select(starts)).toMatchObject({ selected: starts[1], reason: "initial-candidate-qualified",
      qualifiedStartIds: ["qualified"], heldStartIds: ["better-but-held"] });
    expect(starts[0]!.assessment!.qualification.issues).toContain("synthetic-measurement-hold");
  });
  it("uses existing rank only among searchable starts and preserves declared-order ties", () => {
    const starts = [start("first", 1), start("second", 1), start("bad", 0, "held", true)];
    expect(select(starts).selected.startId).toBe("first");
    expect(select([starts[1]!, starts[0]!, starts[2]!]).selected.startId).toBe("second");
    expect(select(starts).reason).toBe("best-ranked-searchable-initial-candidate");
    starts[1]!.score = { ...starts[1]!.score, rank: [0] };
    expect(select(starts).selected.startId).toBe("second");
  });
  it("never treats missing observations as zero or silently drops input/measurement holds", () => {
    const missing = { ...start("missing", 0), assessment: null, candidateInputs: null, inputIssue: "bad input" };
    const invalid = { ...start("invalid", 0), score: { ...start("invalid", 0).score, rank: null } };
    const held = start("measured-but-held", 0, "held", true);
    expect(select([missing, invalid, held])).toMatchObject({ reason: "no-searchable-initial-candidate",
      selected: invalid, heldStartIds: ["missing", "invalid", "measured-but-held"] });
    expect(comparison("baseline", 4, [missing, invalid, held]).starts).toHaveLength(3);
  });
  it("counts all initial candidates once rather than multiplying local-search budgets", async () => {
    const candidates = [start("a", 3), start("b", 2), start("c", 1)];
    const material = comparison("baseline", 3, candidates);
    expect(material.localMaximumEvaluations).toBe(1);
    const c = seed("baseline");
    const outcome = { status: "saved-result-ready", result: { candidateInputs: c,
      rest: { referenceId: "baseline", status: "failed", assessment: { operating: [
        { metricId: "synthetic", actual: 1, lower: 2, upper: 3, status: "failed" }], invalidOrFailedRetained: [], unavailable: [], anatomyReviewRequired: false } } } } as never;
    const result = await search({ referenceId: "baseline", candidateInputs: c, initialOutcome: outcome, initialFinal: null,
      maximumEvaluations: material.localMaximumEvaluations, maximumFinalChecks: 1, maximumWallTimeMs: 60000,
      assess: async () => candidates[2]!.assessment!,
      checkInitialization: async () => ({ status: "passed", issues: [] }),
      evaluateBatch: async () => { throw new Error("All evaluations were spent on initial candidates"); }, qualify: async () => null });
    expect(result.search?.evaluationCount).toBe(1);
    expect(result.search?.evaluationCount! + candidates.length - 1).toBe(3);
    expect(material.publicPromotionAuthorized).toBe(false);
  });
  it("rebuilds initial selection from every plan entry and rejects substituted inputs or omitted starts", async () => {
    const sourceSha256 = "a".repeat(64), candidateInputs = seed("baseline");
    const inputRecord = await record({ modelId, referenceId: "baseline", candidateInputs, previousAssessment: null,
      provenance: { kind: "new-construction", sourceRecordSha256: sourceSha256, description: "test" } });
    const binding = await bind({ record: inputRecord, targetModelId: modelId, referenceId: "baseline",
      interpretation: "test", validate: v => definitions.baseline.ownInputs(v as never) });
    const prepared = own([{ referenceId: "baseline", startId: "first" }, { referenceId: "baseline", startId: "second" }], 4)
      .map(proposal => ({ proposal, inputs: { record: inputRecord, binding, previousEvidenceFile: null }, issue: null }));
    const plan = { modelId, sourceSha256, maximumEvaluations: 4, prepared };
    const raw = (dt: number) => ({ modelId, sourceSha256, candidateInputs, nominalDtSec: dt, initialization: { kind: "cold" }, referenceContext: {},
      rest: { referenceId: "baseline", status: "passed", assessment: { operating: [], invalidOrFailedRetained: [], unavailable: [], anatomyReviewRequired: false } } });
    const score = { status: "passed", rank: [0, 0, 0], targetsMet: true, observations: [], holds: [] };
    const assessment = { status: "review-pending" as const, qualification: { issues: [] }, searchHoldIssues: [], caseTargetIssues: [] };
    const material = comparison("baseline", 4, prepared.map(p => ({ startId: p.proposal.startId, inputIssue: null, inputRecord,
      candidateInputs, binding, previousEvidenceFile: null, executionFiles: [`${prefix(p.proposal)}-2ms.json`, `${prefix(p.proposal)}-1ms.json`], score, assessment })));
    let saved = material, substituted = false, sourceSubstituted = false, warm = false;
    const requested: string[] = [];
    const run = { seal: { sourceSha256 } as never, readJson: async (file: string) => {
      requested.push(file);
      if (file === "plan.json") return plan;
      if (file === "starts.json") return saved;
      return { status: "completed", grid: { result: { ...raw(file.endsWith("2ms.json") ? .002 : .001),
        ...(sourceSubstituted ? { sourceSha256: "b".repeat(64) } : {}),
        ...(warm ? { initialization: { kind: "parameter-continuation" } } : {}),
        ...(substituted && file.includes("second") ? { candidateInputs: seed("hfref-chronic-dilated-v1") } : {}) } } };
    } };
    vi.spyOn(fitting, "readMainWireStaticCaseFittingResultV1").mockImplementation(async r => r as never);
    vi.spyOn(protocols, "prepareRegistryCaseAssessmentV1").mockResolvedValue(assessment as never);
    expect((await readStarts("baseline", "starts.json", run)).comparison.selectedStartId).toBe("first");
    expect(requested.filter(f => f.endsWith("ms.json"))).toHaveLength(4);
    saved = { ...material, selectedStartId: "second" };
    await expect(readStarts("baseline", "starts.json", run)).rejects.toThrow(/selection/);
    saved = { ...material, starts: material.starts.slice(0, 1) };
    await expect(readStarts("baseline", "starts.json", run)).rejects.toThrow(/selection/);
    saved = material; substituted = true;
    await expect(readStarts("baseline", "starts.json", run)).rejects.toThrow(/initial full inputs/);
    substituted = false; sourceSubstituted = true;
    await expect(readStarts("baseline", "starts.json", run)).rejects.toThrow(/source, case, grid or initialization/);
    sourceSubstituted = false; warm = true;
    await expect(readStarts("baseline", "starts.json", run)).rejects.toThrow(/source, case, grid or initialization/);
  });
  it("shows every initial status, missing values and provenance in a shallow research dossier", async () => {
    const starts = [start("first", 1), { ...start("missing", 0), inputIssue: "no raw data", assessment: null }];
    starts[0]!.score = { ...starts[0]!.score, observations: [{ metricId: "synthetic-metric", actual: 3, lower: 2, upper: 4, scale: 2 }] };
    const out = await documentFor({ referenceId: "baseline", modelId, title: "Test", description: "Not clinical data", kind: "baseline",
      surface: {}, context: {}, assessment: {}, status: "held", issues: [],
      comparison: await compareEvidence({ referenceId: "baseline", previous: null, current: null, analysisSourceSha256: "a".repeat(64) }),
      results: [], previousDiagnostics: null, candidateInputs: null, inputBinding: null, sourceFiles: [],
      initialCandidates: comparison("baseline", 4, starts) });
    expect(out.html).toContain('href="#initial-candidates"');
    expect(out.html).toContain("first · 選択");
    expect(out.html).toContain("no raw data");
    expect(out.html).toContain("未測定");
    expect(out.document.initialCandidates?.starts).toHaveLength(2);
    expect(out.html).not.toContain("<details><summary>初期候補の比較");
  });
  it("does not turn an operational hold into an assessment mismatch by hashing transport receipts", async () => {
    const sourceSha256 = "a".repeat(64), candidateInputs = seed("baseline");
    const inputRecord = await record({ modelId, referenceId: "baseline", candidateInputs, previousAssessment: null,
      provenance: { kind: "new-construction", sourceRecordSha256: sourceSha256, description: "test" } });
    const binding = await bind({ record: inputRecord, targetModelId: modelId, referenceId: "baseline",
      interpretation: "test", validate: v => definitions.baseline.ownInputs(v as never) });
    const failed = { status: "operational-failed", message: "run-wall-time-budget" };
    const evaluated = await assessInitial("baseline", { coarse: failed, fine: failed });
    const material = comparison("baseline", 1, [{ startId: "initial", inputIssue: null, inputRecord, candidateInputs,
      binding, previousEvidenceFile: null, executionFiles: ["baseline-2ms.json", "baseline-1ms.json"],
      assessment: evaluated.assessment, score: evaluated.score }]);
    const plan = { modelId, sourceSha256, maximumEvaluations: 1, prepared: [{ proposal: own([{ referenceId: "baseline" }], 1)[0],
      issue: null, inputs: { record: inputRecord, binding, previousEvidenceFile: null } }] };
    const run = { seal: { sourceSha256 } as never, readJson: async (name: string) => name === "plan.json" ? plan
      : name === "starts.json" ? material : { ...failed, fittingRunReceiptV1: { spentMs: 50, sourceSha256 } } };
    const reread = await readStarts("baseline", "starts.json", run);
    expect(reread.comparison).toEqual(material);
    expect(reread.starts[0]!.assessment?.status).toBe("held");
    expect(reread.comparison.reason).toBe("no-searchable-initial-candidate");
  });
});
