import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { readMainWireStaticCaseFittingResultV1 as readResult } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { assessMainWireStaticBaselineQualificationV1 as assessBaseline } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { mainWireIntegratedStudioFixtureProjectionV3 as projection } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import { observeMainWireHfrefCaseV2 as observe } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV2";
import { assessMainWireHfrefDilatedRestV1 as assess, MAIN_WIRE_HFREF_DILATED_REFERENCE_V1 as reference } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure,
  mainWireStandard70TimingAndInletObservationTraceV1 as trace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireStandard70TimingAndInletV2 as timing } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { resolvedMainWireEquationDataV1 as equationsFor } from "./FittedBaselineDocumentCompositionV1";
import type { StaticCaseDocumentContentV1 } from "./StaticCaseDocumentCompositionV1";
import saved from "@/studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.json";
import shared from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.json";

/** New own-model rest records; historical supporting experiments remain named
 * as historical. No per-mint page, numerical integration or adoption vote. */
export async function composeBoundStaticCaseDocumentV1(input: { qualificationPath: string; coarsePath: string;
  finePath: string; bundlePath: string; documentId: string }) {
  const json = async (p: string) => JSON.parse(await readFile(p, "utf8"));
  const same = (a: unknown, b: unknown, name: string) => { if (canonical(a) !== canonical(b)) throw new Error(`Bound case document: ${name}`); };
  const bundle = await json(input.bundlePath), { recordSha256, ...body } = bundle;
  same(await hash(body), recordSha256, "bundle digest");
  same(bundle.manifest, release().manifest, "exact manifest"); same(bundle.surface, surface, "Surface");
  const artifact = await readFile(join(dirname(input.bundlePath), "artifact.mjs"));
  same(createHash("sha256").update(artifact).digest("hex"), bundle.artifactSha256, "artifact");
  const qualification = await json(input.qualificationPath) as Awaited<ReturnType<typeof assessBaseline>>;
  same(await assessBaseline(qualification.grids), qualification, "baseline qualification");
  if (qualification.status !== "qualified" || qualification.grids.coarse.status !== "grid-evaluated") throw new Error("Qualified own baseline required");
  same(qualification.reportSha256, bundle.baselineQualification.reportSha256, "baseline binding");
  const results = await Promise.all([input.coarsePath, input.finePath].map(async p => readResult(await json(p))));
  results.forEach((r, i) => {
    same(r.resultSha256, bundle.hfrefQualification[i === 0 ? "coarse" : "fine"], "HFrEF source binding");
    if (r.nominalDtSec !== [.002, .001][i] || r.initialization.kind !== "cold" || r.rest.status !== "passed") throw new Error("Independent cold case grids required");
  });
  const preset = bundle.presets[0];
  if (bundle.presets.length !== 1 || preset.modelId !== bundle.manifest.modelId) throw new Error("One bound HFrEF preset required");
  const c = results[0]!.candidateInputs, checkpoint = preset.capture.checkpoint.payload;
  same(preset.capture.fixture.anatomyId, c.anatomyId, "fixture anatomy");
  same(preset.capture.fixture.hemodynamicResearchInputs, c.hemodynamicResearchInputs, "fixture hemodynamics");
  same(preset.capture.fixture.mechanismResearchInputs, c.mechanismResearchInputs, "fixture mechanisms");
  same(preset.capture.checkpoint.acceptedTimeSec, checkpoint.base.acceptedTimeSec, "checkpoint time envelope");
  same(preset.capture.checkpoint.acceptedRevision, checkpoint.base.revision, "checkpoint revision envelope");
  const owner = await Session.restore(checkpoint, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  same(await owner.checkpoint(), checkpoint, "own capture roundtrip");
  same(checkpoint.base.completedBeatMetrics, results[0]!.execution.diagnostics.completedBeat, "launch beat");
  const fixture = fixtureFor(c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  const prior = saved.scientificRecord.measurements;
  same(checkpoint.construction, prior.construction, "historical supporting-experiment construction");
  same(reference, prior.reference, "unchanged phenotype reference");
  const baselineResult = qualification.grids.coarse.result, d = baselineResult.execution.diagnostics;
  const baseline = observe(d.completedBeat, trace(d));
  const observations = results.map(r => {
    const d = r.execution.diagnostics, o = observe(d.completedBeat, trace(d)), a = assess(o, baseline);
    if (!a.screenPassed || !a.preferredTargetsMet) throw new Error("Case criteria or preferences not met");
    return { dtSec: r.nominalDtSec, values: o.values, assessment: a, tau: o.tau,
      morphology: measure({ ...d, timingAndInletObserver: timing }), cycles: r.execution.completedCycleCount,
      maximumNormalizedDelta: d.periodicObservations.at(-1)!.period1.overall.maximumNormalizedDelta };
  });
  const equations = equationsFor(c, checkpoint.base, fixture);
  equations.anatomy = { ...equations.anatomy, triSeg: { ...equations.anatomy.triSeg, wallGeometryParameters: fixture.staticAnatomy.trisegWalls } };
  equations.constructionNote = saved.scientificRecord.equations.constructionNote;
  const measurements = { ...prior, modelId: bundle.manifest.modelId, surfaceReleaseId: surface.surfaceReleaseId,
    surfaceSeriesId: surface.surfaceSeriesId, baselineId: preset.presetId,
    releaseStatus: "frozen-local-release-review-pending", reference, observations, baseline: baseline.values,
    construction: checkpoint.construction,
    settings: bundle.manifest.primitiveControlCatalog.map((s: { controlId: string }) => ({ ...s,
      observed: projection.controlValue(preset.capture.fixture, s.controlId) })),
    qualification: { sourceSha256: results[0]!.sourceSha256, evidenceSha256: recordSha256,
      referenceSha256: await hash(reference), artifactSha256: bundle.artifactSha256,
      artifactRevisionId: bundle.artifactRevisionId, checkpointSha256: checkpoint.checkpointSha256 },
    registrationProposal: { ...prior.registrationProposal, status: "ready-for-independent-review",
      requiredBeforePublicRegistration: ["Approve and pin the complete local package through the agreed 1/2 independent review.", "Explicit registry publication and active-default selection are separate actions."] },
    historicalEvidence: { documentId: saved.documentId, contentSha256: saved.contentSha256,
      scope: "PV energetics, conditional passive curves, operation diagnostics and slow-tail experiments retain their original research identities. Rest comparison and launch are new own-model records." },
  };
  const content = { ...measurements, title: "HFrEF · 慢性左室拡大型", equations,
    moduleIds: saved.scientificRecord.modules.map(m => m.id), material: shared.scientificRecord.measurements.material,
    analysisMethods: methods(surface).capabilities } as unknown as StaticCaseDocumentContentV1;
  return { documentId: input.documentId, measurements, content,
    sourceFiles: [input.qualificationPath, input.coarsePath, input.finePath, input.bundlePath,
      "studio/presentation/modelDocumentation/packages/hfref-static-case-document-v4.json"] };
}
