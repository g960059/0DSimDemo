import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { assessMainWireStaticBaselineQualificationV1 as assess } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { mainWireIntegratedStudioFixtureProjectionV3 as projection } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import { resolvedMainWireEquationDataV1 as equationsFor } from "./FittedBaselineDocumentCompositionV1";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure,
  mainWireStandard70TimingAndInletObservationTraceV1 as trace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireStandard70TimingAndInletV2 as timing } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { observeMainWireBaselineV2 as native } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { buildMainWireProspectiveBaselineChecksV1 as checksFor } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineChecksV1";
import { MAIN_WIRE_PROSPECTIVE_BASELINE_ADMISSION_V1 as policy,
  assessMainWireProspectiveRestV1 as restFor } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { mainWireBaselineGateRoleV1 as role } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineGateRolesV1";
import saved from "@/studio/presentation/modelDocumentation/packages/standard72-document-v1.json";
import type { MainWireStaticCaseCheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireStaticCaseCheckpointV1";
import type { MainWireDocumentContentV1 } from "./MainWireDocumentV1";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";

/** Reuses the model/baseline authoring view. This adapter supplies own static
 * construction, observations and launch state; it is not a per-mint page. */
export async function composeStaticBaselineDocumentV1(input: {
  qualificationPath: string; bundlePath: string; documentId: string;
}) {
  if (!/^[a-z0-9][a-z0-9.-]+$/.test(input.documentId) || input.documentId === saved.documentId) throw new Error("New document ID required");
  const same = (a: unknown, b: unknown, what: string) => { if (canonical(a) !== canonical(b)) throw new Error(`Static baseline document: ${what}`); };
  const report = JSON.parse(await readFile(input.qualificationPath, "utf8")) as Awaited<ReturnType<typeof assess>>;
  same(await assess(report.grids), report, "qualification reobservation");
  if (report.status !== "qualified" || report.grids.coarse.status !== "grid-evaluated") throw new Error("Own qualified baseline required");
  const bundle = JSON.parse(await readFile(input.bundlePath, "utf8"));
  const { recordSha256, ...body } = bundle;
  if (recordSha256 !== await hash(body) || bundle.baselineQualification.reportSha256 !== report.reportSha256) throw new Error("Bundle/qualification binding differs");
  same(bundle.manifest, release().manifest, "exact manifest"); same(bundle.surface, surface, "Surface/analysis pins");
  if (createHash("sha256").update(await readFile(join(dirname(input.bundlePath), "artifact.mjs"))).digest("hex") !== bundle.artifactSha256)
    throw new Error("Static baseline document artifact differs");
  const preset = validateScenarioPresetV2(bundle.baseline), launch = preset.capture.checkpoint.payload as unknown as Checkpoint;
  if (preset.modelId !== bundle.manifest.modelId || preset.capture.checkpoint.acceptedTimeSec !== launch.base.acceptedTimeSec
    || preset.capture.checkpoint.acceptedRevision !== launch.base.revision) throw new Error("Preset model or checkpoint envelope differs");
  const result = report.grids.coarse.result, c = result.candidateInputs, qualified = result.execution.checkpoint;
  const fixture = fixtureFor(c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  const restored = await Session.restore(launch, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  same(await restored.checkpoint(), launch, "own launch checkpoint roundtrip");
  const t = qualified.base.acceptedTimeSec, aligned = Math.ceil((t - 1e-12) / .002) * .002;
  same(bundle.baselineQualification, { reportSha256: report.reportSha256, executionSourceSha256: result.sourceSha256,
    qualifiedCheckpointSha256: qualified.checkpointSha256, launchCheckpointSha256: launch.checkpointSha256,
    sourceAcceptedTimeSec: t, targetAcceptedTimeSec: aligned, completedBeatUnchanged: true }, "qualified-to-launch binding");
  same(launch.base.acceptedTimeSec, aligned, "launch time");
  same(launch.base.completedBeatMetrics, result.execution.diagnostics.completedBeat, "launch retained beat");
  const declaredFixture = preset.capture.fixture as unknown as { anatomyId: string;
    hemodynamicResearchInputs: typeof c.hemodynamicResearchInputs; mechanismResearchInputs: typeof c.mechanismResearchInputs };
  same(declaredFixture.anatomyId, c.anatomyId, "fixture anatomy");
  same(declaredFixture.hemodynamicResearchInputs, c.hemodynamicResearchInputs, "fixture hemodynamics");
  same(declaredFixture.mechanismResearchInputs, c.mechanismResearchInputs, "fixture mechanisms");
  const equations = equationsFor(c, launch.base, fixture), prior = saved.scientificRecord;
  equations.anatomy = { ...equations.anatomy, triSeg: { ...equations.anatomy.triSeg,
    wallGeometryParameters: fixture.staticAnatomy.trisegWalls } };
  const observations = [report.grids.coarse, report.grids.fine].map(grid => {
    if (grid.status !== "grid-evaluated" || !grid.preloadReserve) throw new Error("Both grids and reserve required");
    const d = grid.result.execution.diagnostics, measured = measure({ ...d, timingAndInletObserver: timing });
    const checks = checksFor(measured, true), rest = restFor(d.completedBeat, checks, measured.cardiacSizeAndFunction.bodySurfaceAreaM2);
    return { dtSec: grid.result.nominalDtSec, rest, native: native({ samples: trace(d), completedBeat: d.completedBeat }),
      tau: grid.relaxation, checks: checks.map(c => ({ ...c, historicalRole: role(c.checkId) })), measurements: measured,
      reserveMeasurement: grid.preloadReserve };
  });
  const measurements = {
    schemaId: "main-wire-static-baseline-documentation-v1", modelId: bundle.manifest.modelId,
    surfaceReleaseId: surface.surfaceReleaseId, surfaceSeriesId: surface.surfaceSeriesId, baselineId: preset.presetId,
    releaseStatus: "local-candidate-not-registered", clinicalNormalityClaimed: false,
    fixtureIdentity: preset.capture.fixture as typeof prior.measurements.fixtureIdentity,
    settings: bundle.manifest.primitiveControlCatalog.map((control: typeof prior.measurements.settings[number]) => {
      const value = projection.controlValue(preset.capture.fixture, control.controlId);
      if (value.status === "unsupported") throw new Error("Unobserved control: " + control.controlId);
      return { ...control, defaultValue: value.status === "mixed" ? null : value.value };
    }),
    material: prior.measurements.material, calcium: equations.calcium, assembly: prior.measurements.assembly,
    qualification: { cycles: result.execution.completedCycleCount,
      checkpoint: { checkpointId: qualified.checkpointId, checkpointSha256: qualified.checkpointSha256,
        acceptedTimeSec: qualified.base.acceptedTimeSec, revision: qualified.base.revision },
      launchPreparation: { sourceCheckpointSha256: qualified.checkpointSha256, sourceAcceptedTimeSec: t,
        targetCheckpointSha256: launch.checkpointSha256, targetAcceptedTimeSec: aligned, targetRevision: launch.base.revision,
        advancedDurationSec: aligned - t, baseTickSec: .002, completedBeatUnchanged: true },
      reportSha256: report.reportSha256, executionSourceSha256: result.sourceSha256,
      artifactSha256: bundle.artifactSha256, artifactRevisionId: bundle.artifactRevisionId, preparedBundleSha256: recordSha256 },
    admission: { policy, constructionSha256: await hash(qualified.construction),
      pressureRateQuality: report.pressureRateQuality!, reserve: report.preloadReserve! }, observations,
    evidence: prior.measurements.evidence, morphologyPolicy: prior.measurements.morphologyPolicy,
    settlementPolicy: prior.measurements.settlementPolicy, tauPolicy: prior.measurements.tauPolicy,
    surfaceDefinition: surface, construction: qualified.construction,
    reusedConstitutiveDocument: { documentId: saved.documentId, contentSha256: saved.contentSha256,
      scope: "Constitutive modules only; coefficients, initial state and baseline assessment are resolved here." },
  };
  const content = { ...measurements, equations, title: "Circulation · static anatomy",
    moduleIds: prior.modules.map(m => m.id), analysisMethods: methods(surface).capabilities,
    copy: {
      release: { ja: "研究・教育用 · 固定形状モデル候補 · 未登録", en: "Research and education · static-anatomy candidate · unregistered" },
      changes: { ja: "baselineと慢性左室拡大型HFrEFの二つの固定形状を扱う候補です。このページは共通の数理モデルとbaselineを説明します。疾患の設定・評価は別の症例文書に保存しています。",
        en: "This candidate supports two fixed anatomies: baseline and chronic LV-dilated HFrEF. This page describes the shared model and baseline; disease settings and assessments have a separate case document." },
      provenance: { ja: "このモデル自身を2 ms・1 msで独立に初期状態から計算し、定常拍と固定制御下の低・高容量応答を評価しました。baselineは自身のcheckpointから起動し、ソースと実行物で1,000ステップの継続を照合しています。",
        en: "Own-model independent cold 2/1 ms runs assess rest and fixed-control low/high preload responses. Baseline starts from its own checkpoint, with 1,000-step source/artifact continuation checked." },
      assessment: { ja: "このbaseline自身の検証記録です。HFrEFに健常者の基準を当てはめた結果ではありません。正式採用・公開と臨床的妥当性の確立は別です。",
        en: "Qualification belongs to this baseline, not application of healthy criteria to HFrEF. Formal adoption, publication and clinical validation are separate." },
      records: [{ ja: "2 ms · 独立cold検証", en: "2 ms · independent cold qualification" },
        { ja: "1 ms · 独立cold検証", en: "1 ms · independent cold qualification" }],
    },
  } satisfies MainWireDocumentContentV1;
  return { documentId: input.documentId, measurements, content,
    sourceFiles: [input.qualificationPath, input.bundlePath, join(dirname(input.qualificationPath), "execution.source.json")] };
}
