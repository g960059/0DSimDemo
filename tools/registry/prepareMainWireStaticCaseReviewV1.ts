import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { build } from "vite";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { assessMainWireStaticBaselineQualificationV1 as assess } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as factory,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1 as fixtureSchema } from "@/domain/model/MainWireStaticCaseIdentityV1";
import { readMainWireStaticCaseFittingResultV1 as readResult, assessMainWireStaticCaseRestV1 as rest,
  buildMainWireStaticCaseFittingPolicyIdentityV1 as policyIdentity } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { assessMainWireHfrefDilatedRestV1 as assessHfref, MAIN_WIRE_HFREF_DILATED_REFERENCE_V1 as reference } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import { mainWireStandard70TimingAndInletObservationTraceV1 as trace } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireHfrefCaseV2 as observeCase } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV2";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as periodic,
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 as numerical } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";
import { beginFittingSourceSnapshotV1 } from "../scientific/FittingSourceSnapshotV1";
import { STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID } from "@/studio/contracts/v2/content";

// Local review preparation only. No registry client, numbered identity, vote,
// active baseline selection or historical document is written by this command.
selectHotPathIntegrityTierV1("hot-path-lean");
const { values } = parseArgs({ options: { qualification: { type: "string" }, hfref: { type: "string" }, fine: { type: "string" }, output: { type: "string" } } });
if (!values.qualification || !values.hfref || !values.fine || !values.output)
  throw new Error("Require --qualification BASELINE_JSON --hfref COARSE_RESULT --fine FINE_RESULT --output NEW_DIRECTORY");
const sha = (b: string | Uint8Array) => createHash("sha256").update(b).digest("hex");
const json = async (path: string) => JSON.parse(await readFile(path, "utf8"));
const same = (a: unknown, b: unknown, label: string) => { if (canonical(a) !== canonical(b)) throw new Error(`Review package mismatch: ${label}`); };
async function boundDirectory(path: string) {
  const seal = await json(join(path, "execution.source.json"));
  if (sha(JSON.stringify(seal.files)) !== seal.sourceSha256) throw new Error("Source inventory differs");
  for (const item of [seal.archive, ...seal.results]) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(item.filename)
      || sha(await readFile(join(path, item.filename))) !== item.sha256) throw new Error("Source archive or recorded result differs");
  }
  return seal;
}
const output = resolve(values.output); await mkdir(output);
const snapshot = await beginFittingSourceSnapshotV1(join(output, "execution")), files: string[] = [];
const save = async (name: string, value: unknown) => { const p = join(output, name);
  await writeFile(p, JSON.stringify(value, null, 2) + "\n", { flag: "wx" }); files.push(p); };
try {
  const qualificationSeal = await boundDirectory(dirname(resolve(values.qualification)));
  const report = await json(values.qualification) as Awaited<ReturnType<typeof assess>>;
  const { reportSha256, ...reportBody } = report;
  if (reportSha256 !== await hash(reportBody)) throw new Error("Qualification digest differs");
  same(await assess(report.grids), report, "current baseline assessment");
  if (report.status !== "qualified" || report.grids.coarse.status !== "grid-evaluated") throw new Error("Own baseline qualification required");
  const coarse = report.grids.coarse.result, c = coarse.candidateInputs;
  if (coarse.sourceSha256 !== qualificationSeal.sourceSha256
    || !qualificationSeal.results.some((r: { filename: string; sha256: string }) => r.filename === "qualification.json"
      && r.sha256 === sha(JSON.stringify(report, null, 2) + "\n"))) throw new Error("Qualification is not in the sealed run");
  const disease = [];
  for (const [file, dt] of [[values.hfref, .002], [values.fine, .001]] as const) {
    const seal = await boundDirectory(dirname(resolve(file))), raw = await readFile(file, "utf8");
    const r = await readResult(JSON.parse(raw));
    if (!seal.results.some((s: { filename: string; sha256: string }) => s.filename === basename(file)
      && s.sha256 === sha(raw)) || r.sourceSha256 !== seal.sourceSha256)
      throw new Error("HFrEF result is not in its sealed run");
    if (r.nominalDtSec !== dt || r.initialization.kind !== "cold" || r.candidateInputs.anatomyId !== "dilated-lv-v1"
      || r.rest.referenceId !== "hfref-chronic-dilated-v1" || r.policyIdentitySha256 !== await policyIdentity("hfref-chronic-dilated-v1"))
      throw new Error("Independent current-reference HFrEF grids required");
    same(r.requestIdentitySha256, await hash({ modelId: r.modelId, sourceSha256: r.sourceSha256, candidateInputs: r.candidateInputs,
      nominalDtSec: r.nominalDtSec, initialization: r.initialization, policyIdentitySha256: r.policyIdentitySha256 }), "HFrEF request identity");
    const d = r.execution.diagnostics;
    same(classify(d.periodicObservations, periodic), r.execution.classification, "HFrEF periodic classification");
    if (!d.allOffAndOwnerClocksCheckedEveryStep || d.invariantPolicyId !== numerical.policyId
      || d.cycleEvidence.length !== r.execution.completedCycleCount || d.cycleEvidence.some((c, i) => c.cycleIndex !== i + 1
        || c.acceptedStepCount <= 0 || c.atrialCaptureCount !== 1 || c.ventricularCaptureCount !== 1
        || !(c.maximumGlobalVolumeErrorMl <= numerical.invariantTolerance.globalTotalBloodVolumeErrorMl)
        || !(c.maximumCoronaryLedgerErrorMl <= numerical.invariantTolerance.coronaryBloodVolumeLedgerResidualMl))
      || d.periodicObservations.some(o => o.protocolIdentityHash !== r.requestIdentitySha256)
      || trace(d).some(s => !(s.acceptedDtSec > 0 && s.acceptedDtSec <= dt + numerical.invariantTolerance.acceptedOwnerClockSkewSec)))
      throw new Error("HFrEF native grid or conservation evidence differs");
    same(rest("hfref-chronic-dilated-v1", r.execution), r.rest, "HFrEF rest reobservation");
    if (r.rest.status !== "passed") throw new Error("HFrEF rest criteria not met");
    disease.push(r);
  }
  same(disease[0]!.sourceSha256, disease[1]!.sourceSha256, "HFrEF paired source");
  same(disease[0]!.candidateInputs, disease[1]!.candidateInputs, "HFrEF paired inputs");
  const observation = (r: typeof coarse) => observeCase(r.execution.diagnostics.completedBeat, trace(r.execution.diagnostics));
  const baselineObservation = observation(coarse), hfrefObservations = disease.map(observation);
  const comparisons = ["lvef", "rvef", "lvedvi", "lvesvi", "rvedvi", "rvesvi", "ci", "meanLa", "meanRa", "meanPap", "meanAo"].map(key => {
    const a = hfrefObservations[0]!.values[key]!, b = hfrefObservations[1]!.values[key]!;
    const tolerance = key.endsWith("ef") ? .005 : key.startsWith("mean") ? .5 : Math.abs(b) * .01;
    return { key, coarse: a, fine: b, tolerance, passed: Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance };
  });
  if (comparisons.some(c => !c.passed)) throw new Error("HFrEF two-grid sensitivity differs from the prior selected-case protocol");
  const release = factory();
  async function buildArtifact() {
    const built = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": process.cwd() } },
      define: { "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY": JSON.stringify("hot-path-lean") },
      build: { target: "es2022", minify: false, sourcemap: false, write: false,
        lib: { entry: resolve("studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseExactModelV1.entry.ts"), formats: ["es"] },
        rollupOptions: { output: { inlineDynamicImports: true } } } });
    const result = Array.isArray(built) ? built[0]! : built;
    const chunks = "output" in result ? result.output.filter(o => o.type === "chunk") : [];
    if (chunks.length !== 1 || chunks[0]!.imports.length || chunks[0]!.dynamicImports.length) throw new Error("Artifact must be self-contained");
    return new TextEncoder().encode(chunks[0]!.code);
  }
  const bytes = await buildArtifact(), second = await buildArtifact();
  if (sha(bytes) !== sha(second)) throw new Error("Current deterministic artifacts differ");
  const artifactPath = join(output, "artifact.mjs"); await writeFile(artifactPath, bytes, { flag: "wx" }); files.push(artifactPath);
  const namespace = await importExactExecutableArtifactModuleV2(bytes);
  const compiled = await (namespace.createCircleHeartExactModelReleaseV1 as () => ReturnType<typeof factory>)();
  same(compiled.manifest, release.manifest, "compiled manifest");
  const source = await Session.restore(coarse.execution.checkpoint, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  const before = source.currentAcceptedState().acceptedTimeSec, launchTime = Math.ceil((before - 1e-12) / .002) * .002;
  if (launchTime > before + 1e-12) source.advanceToPresentationTimeWithSelectedOutputProjectionV1(launchTime, []);
  const launch = await source.checkpoint();
  same(launch.base.completedBeatMetrics, coarse.execution.diagnostics.completedBeat, "launch retained qualified complete beat");
  const captureFor = async (r: typeof coarse) => {
    const c = r.candidateInputs;
    const s = await Session.restore(r.execution.checkpoint, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
    const t = s.currentAcceptedState().acceptedTimeSec, aligned = Math.ceil((t - 1e-12) / .002) * .002;
    if (aligned > t + 1e-12) s.advanceToPresentationTimeWithSelectedOutputProjectionV1(aligned, []);
    const cp = await s.checkpoint(); same(cp.base.completedBeatMetrics, r.execution.diagnostics.completedBeat, "case launch retained beat");
    return { fixture: { ...template, schemaId: fixtureSchema, anatomyId: c.anatomyId,
      hemodynamicResearchInputs: c.hemodynamicResearchInputs, mechanismResearchInputs: c.mechanismResearchInputs },
    checkpoint: { acceptedRevision: cp.base.revision, acceptedTimeSec: cp.base.acceptedTimeSec, payload: cp as never } };
  };
  const baseline = validateScenarioPresetV2({ schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, modelId: release.manifest.modelId,
    presetId: "standard73-baseline-v1", title: "baseline", description: "安静・洞調律・補助循環なしの基準設定。", capture: await captureFor(coarse) });
  const presets = [validateScenarioPresetV2({ schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, modelId: release.manifest.modelId,
    presetId: "standard73-hfref-chronic-dilated-v1", title: "HFrEF · 慢性左室拡大型",
    description: "左室の拡大と収縮能低下を組み合わせた安静時の教育例。AMIや経時的なリモデリングではない。", capture: await captureFor(disease[0]!) })];
  const model = composeStandardModelContractV1(release.manifest, surface, methods(surface).capabilities).contract;
  const continuation = [];
  for (const preset of [baseline, ...presets]) {
    if (preset.modelId !== model.modelId) throw new Error("Preset model differs");
    const id = { runtimeSessionId: `review-package/${preset.presetId}`, scenarioId: preset.presetId };
    try {
      for (const r of [release, compiled]) {
        await r.executables.captureAdapter.validateCapture({ model, capture: preset.capture });
        await r.executables.simulationAdapter.createSession({ runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: id.scenarioId, ...preset.capture }] });
      }
      for (let i = 0; i < 1000; i++) same(await release.executables.simulationAdapter.advanceOnePresentationStep(id),
        await compiled.executables.simulationAdapter.advanceOnePresentationStep(id), `${preset.presetId}:source/artifact step ${i}`);
      const capture = async (r: typeof release) => (await r.executables.experimentCapture.captureAcceptedCandidate({
        experimentId: "review-package-memory-only", model,
        desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
          scenarios: [{ scenarioId: id.scenarioId, label: preset.title, fixture: preset.capture.fixture }],
          surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
        correlation: { runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: id.scenarioId, expectedInputEpoch: 0 }] },
      })).content.scenarios[0]!.capture;
      same(await capture(release), await capture(compiled), "terminal full capture");
      continuation.push({ presetId: preset.presetId, steps: 1000, completeFramesAndTerminalCaptureEqual: true });
    } finally { for (const r of [release, compiled]) r.executables.simulationAdapter.disposeSession(id.runtimeSessionId); }
  }
  const manifestBytes = new TextEncoder().encode(canonical(release.manifest));
  const framed = new Uint8Array(8 + manifestBytes.length + bytes.length), lengths = new DataView(framed.buffer);
  lengths.setUint32(0, manifestBytes.length, false); lengths.setUint32(4, bytes.length, false);
  framed.set(manifestBytes, 8); framed.set(bytes, 8 + manifestBytes.length);
  const body = { schemaId: "local-hfref-model-lab-bundle-v1", manifest: release.manifest, surface,
    artifactSha256: sha(bytes), artifactRevisionId: sha(framed), baseline, presets,
    reference, assessment: assessHfref(hfrefObservations[0]!, baselineObservation),
    qualificationReportSha256: reportSha256,
    baselineQualification: { reportSha256, executionSourceSha256: qualificationSeal.sourceSha256,
      qualifiedCheckpointSha256: coarse.execution.checkpoint.checkpointSha256,
      launchCheckpointSha256: launch.checkpointSha256,
      sourceAcceptedTimeSec: before, targetAcceptedTimeSec: launchTime, completedBeatUnchanged: true },
    hfrefQualification: { coarse: disease[0]!.resultSha256, fine: disease[1]!.resultSha256,
      sourceSha256: disease[0]!.sourceSha256, comparisons, clinicalNormalityClaimed: false },
    caseLineage: { priorCheckpointImported: false, explanation: "Both selected launch captures come from independent cold calculations in the final exact owner. Historical research records retain their own identities." },
    reviewPreparation: { sourceSha256: snapshot.sourceSha256, deterministicBuilds: 2, continuation,
      publicPromotionAuthorized: false, formalModelFrozen: true } };
  await save("bundle.json", { ...body, recordSha256: await hash(body) });
  await save("report.json", { status: "local-review-bundle-prepared", artifactSha256: sha(bytes),
    baselineQualificationReportSha256: reportSha256, continuation, publicPromotionAuthorized: false,
    remaining: ["Bind an own baseline document and the preserved HFrEF document", "Verify the changed baseline launch in the ordinary Worker",
      "Freeze and review the distinct final exact/Surface/document/registry package before adoption"] });
  console.log(JSON.stringify({ output, status: "local-review-bundle-prepared", publicPromotionAuthorized: false }));
} catch (error) { await save("failure.json", { message: error instanceof Error ? error.message : String(error) }); throw error; }
finally { await snapshot.finish(files); }
