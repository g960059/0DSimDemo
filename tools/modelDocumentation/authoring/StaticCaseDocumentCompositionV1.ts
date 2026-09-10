import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve, relative } from "node:path";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { MAIN_WIRE_HFREF_DILATED_REFERENCE_V1 as reference, assessMainWireHfrefDilatedRestV1 as assess } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import type { observeMainWireHfrefCaseV2 } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV2";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import type { MainWireStaticCaseCheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireStaticCaseCheckpointV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as releaseFor } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { mainWireIntegratedStudioFixtureProjectionV3 as projection } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import type { ScenarioPresetV2 } from "@/studio/contracts/v2/content";
import { resolvedMainWireEquationDataV1 } from "./ResolvedMainWireEquationDataV1";
import saved from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.json";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure,
  completeMainWireStandard70TimingAndInletTraceV1 as completeWindow } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireStandard70TimingAndInletV2 as timing } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as settlementPolicy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_RELAXATION_TAU_POLICY_V1 as tauPolicy } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";

type Seal = { directory: string; sourceSha256: string; archive: { filename: string; sha256: string };
  results: { filename: string; sha256: string }[] };
type Cold = { task: { dt: number; name: string }; observation: ReturnType<typeof observeMainWireHfrefCaseV2>;
  construction: Checkpoint["construction"]; constructionSha256: string; qualifiedCheckpoint: Checkpoint;
  capture: ScenarioPresetV2["capture"]; cycles: number;
  classification: { status: string }; auditClosure: { overall: { maximumNormalizedDelta: number } };
  trace: Parameters<typeof measure>[0]["terminalTrace"]; lookahead: Parameters<typeof measure>[0]["terminalTrace"];
  beat: Parameters<typeof measure>[0]["completedBeat"] };
type Pv = { strokeWork: { joule: number }; potentialEnergy: { joule: number; lowVolumeTangentExtensionSpanMl: number };
  pva: { joule: number }; limitations: readonly string[]; methodId: string };
type PassiveCase = { point: { active: number; referenceArea: number; wallVolume: number }; constructionSha256: string;
  curves: { rvVolumeMl: number; matched: { target: number; status: string;
    observation: { volumes: { LV: number; RV: number }; maximumActivePa: number; maximumSlsPa: number } }[] }[] };
type Evidence = { schemaId: string; status: string; publicPromotionAuthorized: boolean;
  reference: typeof reference; referenceSha256: string; bindings: Seal[];
  cases: { nominalDtSec: number; construction: Checkpoint["construction"]; constructionSha256: string;
    baselineComparison: ReturnType<typeof assess>; morphology: ReturnType<typeof measure> }[];
  pv: { baseline: { left: Pv; right: Pv }; hfref: { left: Pv; right: Pv } };
  conditionalPassive: { source: string; plan: unknown; cases: PassiveCase[] };
  referenceCorrection: { previousEvidencePath: string; previousEvidenceSha256: string;
    previousReferenceSha256: string; sourceId: string; path: string; from: number; to: number; url: string };
  operationEvidence: unknown; unresolved: string[] };
type Bundle = { schemaId: string; recordSha256: string; manifest: ReturnType<typeof releaseFor>["manifest"];
  surface: typeof surface; artifactSha256: string; artifactRevisionId: string;
  baseline: ScenarioPresetV2; presets: ScenarioPresetV2[] };
const sha = (b: string | Uint8Array) => createHash("sha256").update(b).digest("hex");
const same = (a: unknown, b: unknown, label: string) => {
  if (canonical(a) !== canonical(b)) throw new Error(`Case documentation binding differs: ${label}`);
};
const fileName = (value: string) => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)) throw new Error("Invalid evidence member path");
  return value;
};

/** Authoring-time evidence check, not an adoption vote or a fitting engine.
 * Reuses sealed experiments and owned exact construction, never healthy gates. */
export async function composeStaticCaseDocumentV1(input: {
  evidencePath: string; bundlePath: string; documentId: string;
}) {
  if (!/^[a-z0-9][a-z0-9.-]+$/.test(input.documentId)) throw new Error("Invalid document ID");
  const evidenceBytes = await readFile(input.evidencePath, "utf8");
  const evidence = JSON.parse(evidenceBytes) as Evidence;
  if (evidence.schemaId !== "hfref-selected-case-evidence-v1" || evidence.status !== "assembled-not-formally-adopted"
    || evidence.publicPromotionAuthorized !== false || evidence.cases.length !== 2) throw new Error("Unexpected case evidence");
  same(evidence.reference, reference, "current physiological reference");
  if (evidence.referenceSha256 !== await hash(reference)) throw new Error("Reference digest differs");
  const root = resolve(dirname(input.evidencePath), "..");
  const sourceFiles = [input.evidencePath, input.bundlePath];
  for (const binding of evidence.bindings) {
    const directory = join(root, fileName(binding.directory));
    const sourcePath = join(directory, "execution.source.json");
    const seal = JSON.parse(await readFile(sourcePath, "utf8"));
    sourceFiles.push(relative(process.cwd(), sourcePath));
    if (sha(JSON.stringify(seal.files)) !== binding.sourceSha256
      || seal.sourceSha256 !== binding.sourceSha256) throw new Error("Execution source inventory differs");
    same(seal.archive, binding.archive, "source archive");
    same(seal.results, binding.results, "result inventory");
    if (sha(await readFile(join(directory, fileName(seal.archive.filename)))) !== seal.archive.sha256) throw new Error("Source archive digest differs");
    for (const result of binding.results) {
      if (sha(await readFile(join(directory, fileName(result.filename)))) !== result.sha256) throw new Error("Result digest differs");
    }
  }
  const lab = evidence.bindings.find(b => b.directory === "static-case-lab-004");
  if (!lab) throw new Error("Missing selected construction qualification");
  const cold = await Promise.all([0, 1, 2].map(async i => {
    const result = JSON.parse(await readFile(join(root, lab.directory, `cold-${i}.json`), "utf8"));
    if (!result.ok) throw new Error("Missing completed cold result");
    return result.value as Cold;
  }));
  const bundle = JSON.parse(await readFile(input.bundlePath, "utf8")) as Bundle;
  const { recordSha256, ...body } = bundle;
  if (recordSha256 !== await hash(body)) throw new Error("Bundle digest differs");
  same(bundle.manifest, releaseFor().manifest, "current exact manifest");
  same(bundle.surface, surface, "current Surface");
  const artifactPath = join(dirname(input.bundlePath), "artifact.mjs");
  if (sha(await readFile(artifactPath)) !== bundle.artifactSha256) throw new Error("Artifact digest differs");
  const preset = bundle.presets.find(p => p.presetId === "research/hfref-chronic-dilated-v1");
  if (!preset || bundle.presets.length !== 1) throw new Error("Expected one selected HFrEF candidate");
  same(preset.capture, cold[1]!.capture, "selected launch capture");
  same(bundle.baseline.capture, cold[0]!.capture, "baseline launch capture");
  const observations = [];
  for (const [i, c] of cold.slice(1).entries()) {
    if (c.task.dt !== [.002, .001][i] || c.classification.status !== "period1-converged"
      || !Number.isFinite(c.auditClosure.overall.maximumNormalizedDelta)
      || c.auditClosure.overall.maximumNormalizedDelta > settlementPolicy.period1NormalizedTolerance) throw new Error("Invalid cold/fine qualification");
    const a = assess(c.observation, i === 0 ? cold[0]!.observation : undefined);
    if (!a.screenPassed || !a.preferredTargetsMet) throw new Error("Case reference is not met");
    same(evidence.cases[i]!.baselineComparison, a, "assessment recomputed from sealed observation");
    same(evidence.cases[i]!.construction, c.construction, "resolved construction");
    if (c.constructionSha256 !== await hash(c.construction)) throw new Error("Construction digest differs");
    const window = completeWindow({ terminalTrace: c.trace, completedBeatEndTimeSec: c.beat.endTimeSec,
      runLookaheadCycle: () => c.lookahead });
    const morphology = measure({ terminalTrace: c.trace, ...window, completedBeat: c.beat, timingAndInletObserver: timing });
    same(evidence.cases[i]!.morphology, morphology, "morphology recomputed from raw accepted trace");
    observations.push({ dtSec: c.task.dt, values: c.observation.values, assessment: a,
      tau: c.observation.tau, morphology,
      cycles: c.cycles, maximumNormalizedDelta: c.auditClosure.overall.maximumNormalizedDelta });
  }
  for (const name of ["baseline", "hfref"] as const) {
    const sealed = JSON.parse(await readFile(join(root, lab.directory, `pva-${name}.json`), "utf8"));
    for (const side of ["left", "right"] as const) {
      for (const [key, value] of Object.entries(evidence.pv[name][side])) same(value,
        key === "espvrMethod" ? sealed[side].espvr.primaryMethod
          : key === "edpvrMethod" ? sealed[side].edpvr.method : sealed[side][key], "sealed PV " + key);
    }
  }
  const passive = JSON.parse(await readFile(join(root, "passive-conditional-001/report.json"), "utf8"));
  same(evidence.conditionalPassive.plan, passive.plan, "passive protocol");
  for (const item of evidence.conditionalPassive.cases) {
    const source = (passive.cases as PassiveCase[]).find(c => canonical(c.point) === canonical(item.point));
    if (!source) throw new Error("Missing passive source condition");
    same(item, { point: source.point, constructionSha256: source.constructionSha256,
      curves: source.curves.map(c => ({ rvVolumeMl: c.rvVolumeMl, matched: c.matched })) }, "passive observations");
  }
  const passiveAt = (area: number, volume: number) => {
    const result = evidence.conditionalPassive.cases.find(c => c.point.referenceArea === area && c.point.wallVolume === volume)
      ?.curves.find(c => c.rvVolumeMl === 140)?.matched.find(m => m.target === 10);
    if (!result || result.status !== "observed" || result.observation.maximumActivePa !== 0
      || result.observation.maximumSlsPa !== 0) throw new Error("Missing zero-active relaxed passive contrast");
    return result.observation.volumes.LV;
  };
  const slowTailBinding = evidence.bindings.find(b => b.directory === "static-case-slow-tail-001");
  if (!slowTailBinding || !evidence.bindings.some(b => b.directory === "static-case-lab-003")) throw new Error("Missing slow-tail lineage");
  type Tail = { ok: boolean; value: { input: { sha256: string; checkpointSha256: string }; dt: number; extensionCycles: number;
    originalObservation: Cold["observation"]; observation: Cold["observation"];
    rows: { overall: { worstPath: string; worstEntry: { currentValue: number; referenceValue: number } } }[] } };
  const tails = JSON.parse(await readFile(join(root, slowTailBinding.directory, "results.json"), "utf8")) as Tail[];
  const slowTail = await Promise.all(tails.map(async ({ ok, value: tail }, i) => {
    const inputPath = join(root, "static-case-lab-003", `cold-${i + 1}.json`);
    const bytes = await readFile(inputPath, "utf8"), original = JSON.parse(bytes).value as Cold;
    const { checkpointSha256, ...checkpointBody } = original.qualifiedCheckpoint;
    if (!ok || tail.dt !== cold[i + 1]!.task.dt || tail.extensionCycles !== tail.rows.length
      || sha(bytes) !== tail.input.sha256 || checkpointSha256 !== tail.input.checkpointSha256
      || await hash(checkpointBody) !== checkpointSha256) throw new Error("Slow-tail input differs");
    same(original.qualifiedCheckpoint.base, cold[i + 1]!.qualifiedCheckpoint.base, "historical slow-tail starting numerical state");
    same(original.qualifiedCheckpoint.coupledPredictor, cold[i + 1]!.qualifiedCheckpoint.coupledPredictor, "slow-tail predictor");
    same(original.construction, cold[i + 1]!.construction, "slow-tail construction");
    same(tail.originalObservation, cold[i + 1]!.observation, "slow-tail initial measurements");
    const first = tail.rows[0]!.overall, last = tail.rows.at(-1)!.overall;
    if (first.worstPath !== last.worstPath) throw new Error("Slow-tail summary requires a common observed state");
    return { dtSec: tail.dt, extensionCycles: tail.extensionCycles, inputPath: relative(process.cwd(), inputPath),
      inputSha256: tail.input.sha256, startingCheckpointSha256: tail.input.checkpointSha256,
      launchStateParity: "historical lab-003 base, coupled predictor, construction and initial observations match lab-004",
      statePath: first.worstPath, initialStateValue: first.worstEntry.referenceValue, finalStateValue: last.worstEntry.currentValue,
      initialValues: tail.originalObservation.values, finalValues: tail.observation.values,
      sourceSha256: slowTailBinding.sourceSha256 };
  }));
  const checkpoint = preset.capture.checkpoint.payload as unknown as Checkpoint;
  const construction = checkpoint.construction;
  const f = fixtureFor(construction.anatomy.caseId, construction.hemodynamicInputs, 1, construction.mechanismInputs);
  // Exact owner checks the full geometry, state, checksum and solver predictor.
  await Session.restore(checkpoint, f.staticAnatomy.caseId, f.hemodynamicResearchInputs, 1, f.mechanismResearchInputs);
  const equations = resolvedMainWireEquationDataV1({ hemodynamicResearchInputs: f.hemodynamicResearchInputs,
    mechanismResearchInputs: f.mechanismResearchInputs, ventricularContractilityScale: 1 }, checkpoint.base, f);
  equations.anatomy = { ...equations.anatomy, triSeg: { ...equations.anatomy.triSeg,
    wallGeometryParameters: f.staticAnatomy.trisegWalls } };
  const baselineWalls = cold[0]!.construction.anatomy.trisegWalls;
  const areaScale = construction.anatomy.trisegWalls.LVFW.referenceMidwallAreaM2 / baselineWalls.LVFW.referenceMidwallAreaM2;
  const tissueScale = construction.anatomy.trisegWalls.LVFW.wallMaterialVolumeM3 / baselineWalls.LVFW.wallMaterialVolumeM3;
  const septum = construction.anatomy.trisegWalls.SEP;
  if (Math.abs(septum.referenceMidwallAreaM2 / baselineWalls.SEP.referenceMidwallAreaM2 - areaScale) > 1e-12
    || Math.abs(septum.wallMaterialVolumeM3 / baselineWalls.SEP.wallMaterialVolumeM3 - tissueScale) > 1e-12) throw new Error("Separate LV/septal explanation required");
  same(construction.anatomy.trisegWalls.RVFW, baselineWalls.RVFW, "unchanged RV geometry");
  same(construction.anatomy.atria, cold[0]!.construction.anatomy.atria, "unchanged atrial anatomy");
  same(construction.calcium, cold[0]!.construction.calcium, "unchanged calcium source");
  same(construction.referenceWallMaterial, cold[0]!.construction.referenceWallMaterial, "unchanged material");
  for (const key of ["calciumDecayTimeScaleByWall", "passiveStiffnessScaleByWall"] as const) {
    same(construction.mechanismInputs.chamberMechanics[key], cold[0]!.construction.mechanismInputs.chamberMechanics[key], "unchanged " + key);
  }
  const bsa = reference.scope.bodySurfaceAreaM2, density = construction.anatomy.myocardialDensityKgPerM3;
  equations.constructionNote = {
    ja: `BSA ${bsa} m²、心筋密度${density} kg/m³。LV自由壁・中隔は基準面積を${areaScale.toPrecision(3)}倍、心筋体積を${tissueScale.toPrecision(3)}倍にした固定構成です。右室自由壁・心房は共通です。これは経時的なリモデリングや、特定患者の画像計測を再現したものではありません。実際の壁体積を心膜内占有量に含めますが、心膜袋の容量・硬さ・液量は変えていません。`,
    en: `BSA ${bsa} m²; density ${density} kg/m³. LV free-wall/septal reference area and tissue volume are fixed at ${areaScale.toPrecision(3)} and ${tissueScale.toPrecision(3)} times reference. RV free wall and atria are unchanged. This is neither evolving remodeling nor measured patient anatomy. Actual tissue occupies the unchanged pericardial bag; capacity, stiffness and fluid are not retuned.`,
  };
  const measurements = {
    schemaId: "main-wire-static-case-documentation-v1", modelId: bundle.manifest.modelId,
    surfaceReleaseId: surface.surfaceReleaseId, surfaceSeriesId: surface.surfaceSeriesId,
    baselineId: preset.presetId, releaseStatus: "local-candidate-not-registered", clinicalNormalityClaimed: false,
    reference, observations, baseline: cold[0]!.observation.values, construction, tauPolicy,
    settings: bundle.manifest.primitiveControlCatalog.map(c => ({ ...c,
      observed: projection.controlValue(preset.capture.fixture, c.controlId) })),
    pv: evidence.pv, conditionalPassive: evidence.conditionalPassive,
    passiveComparison: { rvVolumeMl: 140, lvTransmuralPressureMmHg: 10,
      baselineVolumeMl: passiveAt(1, 1), caseVolumeMl: passiveAt(areaScale, tissueScale) }, slowTail,
    referenceCorrection: evidence.referenceCorrection,
    // Raw error stacks stay in the bound research archive; portable documents
    // retain diagnostic messages, not host-specific call stacks.
    operationEvidence: JSON.parse(canonical(evidence.operationEvidence), (key, value) =>
      key === "error" && typeof value === "string" ? value.split("\n")[0] : value) as unknown,
    unresolved: evidence.unresolved.filter(t => !t.startsWith("Independent adoption review")),
    qualification: { sourceSha256: lab.sourceSha256, evidenceSha256: sha(evidenceBytes),
      referenceSha256: evidence.referenceSha256, artifactSha256: bundle.artifactSha256,
      artifactRevisionId: bundle.artifactRevisionId, checkpointSha256: checkpoint.checkpointSha256 },
    registrationProposal: {
      status: "ready-for-independent-review", adopted: false, writesPerformed: false,
      scope: "One resting, chronic dilated, LV-dominant educational case in a two-anatomy exact model.",
      requiredBeforePublicRegistration: ["At least one unconditional formal-adoption approval of the two requested reviewers.",
        "Freeze a new exact release and compatible Surface; independently build and verify their own artifact and exact captures.",
        "Preserve this reviewed evidence, replace no production72 checkpoint, and bind the final preset/document to that release."],
      startup: "Qualified 2ms saved capture; independent cold/fine checked only at the selected recipe. TBV7000 cold2ms remains a known initialization failure.",
      interaction: "Both presets carry complete primitive inputs and their own anatomy-bearing checkpoint. Switching replaces the scenario, never remaps geometry in place.",
    },
  };
  const content = { ...measurements, title: "HFrEF · 慢性左室拡大型",
    equations, moduleIds: saved.scientificRecord.modules.map(m => m.id),
    material: saved.scientificRecord.measurements.material,
    analysisMethods: methods(surface).capabilities };
  return { documentId: input.documentId, measurements, content, sourceFiles };
}
export type StaticCaseDocumentContentV1 = Awaited<ReturnType<typeof composeStaticCaseDocumentV1>>["content"];
