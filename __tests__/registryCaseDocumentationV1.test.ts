import { describe, it, expect } from "vitest";
import baseline from "@/studio/presentation/modelDocumentation/packages/standard73-document-v2.json";
import hfref from "@/studio/presentation/modelDocumentation/packages/standard73-hfref-document-v2.json";
import { registryCaseAssessmentRowsV1 as rowsFor, registryCaseSourcesV1 as sourcesFor } from "@/tools/modelDocumentation/authoring/RegistryCaseAssessmentRowsV1";
import { compileRegistryCaseDocumentV1 as compile } from "@/tools/modelDocumentation/compileRegistryCaseDocumentV1";
import type { MainWireStaticCaseFittingResultV1 as Result } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { registryCaseReviewIndexV1 as indexFor } from "@/tools/modelDocumentation/authoring/RegistryCaseReviewDocumentV1";

// Saved observations exercise presentation without another settling run. They
// are test inputs only, never reclassified as current qualification evidence.
describe("case registration documentation", () => {
  it.each(["ja", "en"] as const)("retains baseline targets and reference warnings in %s", locale => {
    const o = baseline.scientificRecord.measurements.observations[0];
    const result = { rest: { referenceId: "baseline", status: "passed", assessment: o.rest,
      observation: { checks: o.checks } } } as unknown as Result;
    const rows = rowsFor(result, { status: "grid-evaluated", relaxation: o.tau }, locale);
    const ci = rows.find(r => r.id === "systemic-net-flow.cardiac-index")!;
    expect(ci).toMatchObject({ role: "target", status: "passed", value: o.rest.operating[0].actual, unit: "L/min/m2" });
    for (const id of ["left-ventricle.maximum-dpdt", "left-ventricle.minimum-dpdt"]) {
      const row = rows.find(r => r.id === id)!;
      expect(row.role).toBe("reference");
      expect(row.status).toBe("warning");
      expect(row.sources.length).toBeGreaterThan(0);
    }
    expect(rows.find(r => r.id === "lv.tau.weiss")?.value).toBe(o.tau.weiss.tauMs);
    expect(rows.filter(r => r.role === "target" || r.role === "reference").every(r => r.sources.length > 0)).toBe(true);
    // Numerical/construction guards are engineering criteria, not fabricated
    // population references. Keep their stated rationale when no paper is cited.
    expect(rows.filter(r => !r.sources.length).every(r => ["guard", "numerical"].includes(r.role) && r.rationale.length > 0)).toBe(true);
  });
  it.each(["ja", "en"] as const)("keeps HFrEF's own screen/preferences, units and evidence in %s", locale => {
    const o = hfref.scientificRecord.measurements.observations[0];
    const result = { rest: { referenceId: "hfref-chronic-dilated-v1", status: "passed", assessment: o.assessment } } as unknown as Result;
    const rows = rowsFor(result, {}, locale);
    expect(rows).toHaveLength(o.assessment.screen.length + o.assessment.targets.length);
    expect(rows.find(r => r.id === "screen.lvef")).toMatchObject({ role: "guard", unit: "fraction", value: o.values.lvef,
      ranges: [{ lower: .2, upper: .4 }] });
    expect(rows.find(r => r.id === "targets.lvef")).toMatchObject({ role: "target", ranges: [{ lower: .25, upper: .35 }] });
    expect(rows.find(r => r.id === "targets.weissTauMs")).toMatchObject({ unit: "ms", value: o.values.weissTauMs });
    expect(rows.find(r => r.id === "targets.ci")).toMatchObject({ unit: "L/min/m2" });
    expect(rows.some(r => r.id.includes("systemic-net-flow"))).toBe(false);
    expect(rows.every(r => r.sources.length > 0 && r.sources.every(s => /^https:\/\//.test(s.url)))).toBe(true);
    const source = sourcesFor("hfref-chronic-dilated-v1", locale).find(s => s.id === "kato-1996-dcm-pv")!;
    expect(source.description).toContain(locale === "ja" ? "Weiss" : "High-fidelity");
  });
  it("does not turn absent observations into a zero or a successful row", () => {
    const o = hfref.scientificRecord.measurements.observations[0];
    const assessment = structuredClone(o.assessment);
    Object.assign(assessment.targets.find(r => r.metricId === "weissTauMs")!, { actual: null, status: "unresolved" });
    const result = { rest: { referenceId: "hfref-chronic-dilated-v1", status: "held", assessment } } as unknown as Result;
    expect(rowsFor(result, {}, "ja").find(r => r.id === "targets.weissTauMs")).toMatchObject({ value: null, status: "unassessed" });
    expect(() => rowsFor({ rest: { status: "unavailable" } } as Result, {}, "ja")).toThrow(/unavailable/);
  });
  it("refuses held, incomplete, warm or substituted evidence before creating any document", async () => {
    const candidateInputs = { test: true };
    const result = { candidateInputs, modelId: "test-model", nominalDtSec: .002, initialization: { kind: "cold" },
      resultSha256: "test-result", rest: { referenceId: "baseline" } };
    const input = { documentId: "test-document", preparationSourceSha256: "a".repeat(64), dossier: { identity: { modelId: "test-model", referenceId: "baseline" },
      candidateInputs, status: "review-pending", publicPromotionAuthorized: false }, results: [result, { ...result, nominalDtSec: .001 }], grids: [{}, {}],
      launch: { binding: { sourceResultSha256: "test-result" }, preset: { modelId: "test-model", presetId: "test-preset" } },
      continuation: { presetId: "test-preset", steps: 1000, completeFramesAndTerminalCaptureEqual: true } };
    const reject = async (patch: unknown) => expect(compile({ ...input, ...patch as object } as unknown as Parameters<typeof compile>[0])).rejects.toThrow();
    await reject({ dossier: { ...input.dossier, status: "held" } });
    await reject({ results: [result] });
    await reject({ results: [result, { ...result, nominalDtSec: .001, initialization: { kind: "parameter-continuation" } }] });
    await reject({ results: [result, { ...result, nominalDtSec: .001, candidateInputs: { other: true } }] });
    await reject({ continuation: { ...input.continuation, steps: 999 } });
    await reject({ launch: { ...input.launch, binding: { sourceResultSha256: "another-case-result" } } });
    await reject({ dossier: { ...input.dossier, publicPromotionAuthorized: true } });
    // All superficial fields passing is still not an authenticated dossier.
    await expect(compile(input as unknown as Parameters<typeof compile>[0])).rejects.toThrow(/digest/);
  });
  it("labels registration as pending and does not invent a proposal for held cases", () => {
    const html = indexFor([{ title: "held test", status: "held", documentFile: "baseline-document.json", issues: ["not-qualified"] },
      { title: "ready test", status: "review-pending", documentFile: "hfref-document.json", issues: [], registrationProposalFile: "hfref-registration-proposal.json" }]);
    expect(html.match(/registration-proposal.json/g)).toHaveLength(1);
    expect(html).toContain("1/2レビュー未完了");
    expect(html).toContain("not-qualified");
  });
});
