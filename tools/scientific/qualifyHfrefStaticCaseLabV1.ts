import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as createFixture } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { collectMainWireStandard72FittingCycleV1 as collect } from "@/analysis/methods/mainWire/MainWireStandard72BaselineCalibrationEvaluatorV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as policy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 as compare } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify,
  type MainWireIntegratedModelPeriodicCycleObservationV3 as Cycle } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { observeMainWireHfrefCaseV2 as observe } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV2";
import { assessMainWireHfrefDilatedRestV1 as assess, MAIN_WIRE_HFREF_DILATED_REFERENCE_V1 as reference } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as factory,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1 as schemaId } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseIdentityV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, type ScenarioCaptureV2 } from "@/studio/contracts/v2/content";
import type { StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID as pvId,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID as starlingId } from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import { mergeMainWireStructuralAnalysesV1 as merge } from "@/analysis/methods/mainWire/MainWireStructuralAnalysisExecutionV1";
import { buildMainWirePeriodicPvaMethodV14 as pva } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import type { MainWireIntegratedModelStarlingLocusV3 as Locus } from "@/analysis/methods/mainWire/MainWireGuytonStarlingOrientationV3";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { runFittingJsonWorkersV1, readFittingWorkerStdinV1 } from "./runFittingJsonWorkersV1";
import { mainWireStaticCaseFittingSeedV1 as caseSeed } from "@/analysis/registry/MainWireStaticCaseFittingSeedV1";

// One bounded integration qualification, not a new fitter or public mint.
selectHotPathIntegrityTierV1("hot-path-lean");
const protocol = "hfref-static-case-lab-qualification-v1";
type Case = "baseline" | "hfref";
type ColdTask = { kind: "cold"; name: Case; dt: .002 | .001; smoke: boolean };
type AnalysisTask = { kind: "analysis"; name: Case; artifact: string; capture: string;
  analysisId: typeof pvId | typeof starlingId; partition: "hypovolemic" | "hypervolemic" };
const same = (a: unknown, b: unknown, label: string) => {
  if (canonical(a) !== canonical(b)) throw new Error(`Parity failed: ${label}`);
};
function inputs(name: Case) {
  const seed = caseSeed(name === "hfref" ? "hfref-chronic-dilated-v1" : "baseline");
  return { anatomyId: seed.anatomyId, hemo: seed.hemodynamicResearchInputs, mechanism: seed.mechanismResearchInputs } as const;
}
async function cold(task: ColdTask) {
  const started = performance.now(), c = inputs(task.name);
  const fixture = createFixture(c.anatomyId, c.hemo, 1, c.mechanism);
  const session = Session.create(c.anatomyId, c.hemo, 1, c.mechanism);
  const construction = (await session.checkpoint()).construction, constructionSha256 = await hash(construction);
  const boundaries = [session.currentAcceptedState()], observations: Cycle[] = [];
  const options = { period1NormalizedTolerance: policy.period1NormalizedTolerance,
    period2NormalizedTolerance: policy.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta: policy.period2MinimumPeriod1NormalizedDelta, consecutiveCycles: policy.consecutiveCycles };
  let classification = classify(observations, options), cycles = 0;
  for (let i = 1; i <= (task.smoke ? 2 : policy.maximumCycleCount); i++) {
    collect(session, fixture, i, task.dt);
    const current = session.currentAcceptedState(), previous = boundaries.at(-1)!;
    if (current.composedRhythm.acceptedAtrialCaptureCount - previous.composedRhythm.acceptedAtrialCaptureCount !== 1
      || current.composedRhythm.acceptedVentricularCaptureCount - previous.composedRhythm.acceptedVentricularCaptureCount !== 1) throw new Error("Non-sinus cycle evidence");
    observations.push({ cycleIndex: i, evidenceRole: "canonical-periodic-protocol", protocolIdentityHash: constructionSha256,
      period1: compare(current, previous, scales, fixture.config),
      period2: boundaries.length < 2 ? null : compare(current, boundaries.at(-2)!, scales, fixture.config) });
    if (observations.length > policy.consecutiveCycles) observations.shift();
    boundaries.push(current); if (boundaries.length > 3) boundaries.shift();
    cycles = i; classification = classify(observations, options);
    if (classification.status !== "not-converged") break;
    if (performance.now() - started > 360_000) throw new Error("Cold settlement exceeded six minutes");
  }
  if (!task.smoke && classification.status !== "period1-converged") throw new Error("No period-1 settlement");
  const before = session.currentAcceptedState();
  const trace = collect(session, fixture, cycles + 1, task.dt);
  const auditClosure = compare(session.currentAcceptedState(), before, scales, fixture.config);
  const beat = session.observe().completedBeatMetrics;
  if (!beat) throw new Error("No complete beat");
  const qualifiedCheckpoint = await session.checkpoint();
  // Preserve the qualified boundary, then extend raw measurement through the
  // following filling phase. The lookahead is not the launch checkpoint.
  const lookahead = collect(session, fixture, cycles + 2, task.dt);
  const observation = observe(beat, [...trace, ...lookahead]);
  const launch = await Session.restore(JSON.parse(JSON.stringify(qualifiedCheckpoint)), c.anatomyId, c.hemo, 1, c.mechanism);
  const t = launch.currentAcceptedState().acceptedTimeSec, aligned = Math.ceil((t - 1e-12) / .002) * .002;
  if (aligned > t + 1e-12) launch.advanceToPresentationTimeWithSelectedOutputProjectionV1(aligned, []);
  const checkpoint = await launch.checkpoint();
  same(checkpoint.base.completedBeatMetrics, qualifiedCheckpoint.base.completedBeatMetrics, "launch retained beat");
  const capture: ScenarioCaptureV2 = { fixture: { ...template, schemaId, anatomyId: c.anatomyId,
    hemodynamicResearchInputs: c.hemo, mechanismResearchInputs: c.mechanism },
    checkpoint: { acceptedRevision: checkpoint.base.revision, acceptedTimeSec: checkpoint.base.acceptedTimeSec, payload: checkpoint as never } };
  return { task, construction, constructionSha256, cycles, classification, auditClosure, trace, lookahead, beat,
    qualifiedCheckpoint, capture, observation, assessment: assess(observation), wallTimeMs: performance.now() - started };
}
type ColdResult = Awaited<ReturnType<typeof cold>>;
async function compiledRelease(path: string) {
  const module = await importExactExecutableArtifactModuleV2(new Uint8Array(await readFile(path)));
  if (typeof module.createCircleHeartExactModelReleaseV1 !== "function") throw new Error("Missing artifact factory");
  return await module.createCircleHeartExactModelReleaseV1() as ReturnType<typeof factory>;
}
async function analysis(task: AnalysisTask) {
  const started = performance.now(), release = await compiledRelease(task.artifact), adapter = release.executables.simulationAdapter;
  const capture = JSON.parse(await readFile(task.capture, "utf8")) as ScenarioCaptureV2;
  const identity = { runtimeSessionId: `qualification/${task.name}`, scenarioId: task.name };
  await adapter.createSession({ runtimeSessionId: identity.runtimeSessionId, scenarios: [{ scenarioId: task.name, ...capture }] });
  const frame = adapter.currentFrame(identity), progress: unknown[] = [];
  const result = await adapter.requestAnalysis({ ...identity, analysisId: task.analysisId, analysisPartition: task.partition,
    expectedInputEpoch: frame.inputEpoch, expectedAcceptedRevision: frame.acceptedRevision, expectedAcceptedTimeSec: frame.acceptedTimeSec,
    onProgress: a => { const left = (a.payload as { left: { starlingLocus: Locus } }).left.starlingLocus;
      progress.push({ elapsedMs: performance.now() - started, status: left.status,
        completedPointCount: "completedPointCount" in left ? left.completedPointCount : null }); } });
  same(adapter.currentFrame(identity), frame, "analysis did not advance live case");
  adapter.disposeSession(identity.runtimeSessionId);
  return { task, result, progress, wallTimeMs: performance.now() - started };
}
type AnalysisResult = Awaited<ReturnType<typeof analysis>>;
type WorkerResult<T> = { ok: true; value: T } | { ok: false; error: string };
async function workers<T>(tasks: readonly (ColdTask | AnalysisTask)[], concurrency: number) {
  return runFittingJsonWorkersV1<WorkerResult<T>>({ concurrency, scriptPath: fileURLToPath(import.meta.url),
    signal: AbortSignal.timeout(900_000), jobs: tasks.map(t => ({ args: ["--worker"], input: canonical(t) })) });
}

async function main() {
  if (process.argv.includes("--worker")) {
    let result: WorkerResult<unknown>;
    try { const t = await readFittingWorkerStdinV1() as ColdTask | AnalysisTask;
      result = { ok: true, value: t.kind === "cold" ? await cold(t) : await analysis(t) };
    } catch (e) { result = { ok: false, error: e instanceof Error ? e.stack ?? e.message : String(e) }; }
    process.stdout.write(JSON.stringify(result) + "\n"); return;
  }
  const output = resolve(process.argv[2]!), smoke = process.argv.includes("--smoke"), started = performance.now();
  await mkdir(output);
  const source = await beginFittingSourceSnapshotV1(join(output, "execution")), files: string[] = [];
  const save = async (name: string, value: unknown) => { const path = join(output, name);
    await writeFile(path, JSON.stringify(value, null, 2) + "\n", { flag: "wx" }); files.push(path); return path; };
  try {
    const tasks: ColdTask[] = [{ kind: "cold", name: "baseline", dt: .002, smoke },
      { kind: "cold", name: "hfref", dt: .002, smoke }, { kind: "cold", name: "hfref", dt: .001, smoke }];
    await save("plan.json", { protocol, sourceSha256: source.sourceSha256, reference, referenceSha256: await hash(reference), tasks,
      nominalDtComparison: "EF within 0.5 percentage points; indexed volumes/CI within 1%; mean pressures within 0.5 mmHg",
      analysis: { protocols: [pvId, starlingId], partitions: ["hypovolemic", "hypervolemic"], concurrency: 4 },
      publicPromotionAuthorized: false, smoke });
    const results = await workers<ColdResult>(tasks, 3);
    for (let i = 0; i < results.length; i++) await save(`cold-${i}.json`, results[i]);
    if (results.some(r => !r.ok)) throw new Error("Cold task failed; see retained results");
    const r = results.map(r => (r as { ok: true; value: ColdResult }).value);
    if (smoke) { await save("report.json", { protocol, status: "smoke-only-not-qualified", wallTimeMs: performance.now() - started }); await source.finish(files); return; }
    if (!r[1]!.assessment.screenPassed || !r[2]!.assessment.screenPassed) throw new Error("Disease screen failed");
    // This is one withheld audit after the three-cycle classifier, not a
    // second (one-cycle) claim of canonical settlement.
    for (const result of r) {
      const delta = result.auditClosure.overall.maximumNormalizedDelta;
      if (!Number.isFinite(delta) || delta > policy.period1NormalizedTolerance) throw new Error("Withheld closure failed");
    }
    const comparisons = ["lvef", "rvef", "lvedvi", "lvesvi", "rvedvi", "rvesvi", "ci", "meanLa", "meanRa", "meanPap", "meanAo"].map(key => {
      const coarse = r[1]!.observation.values[key as keyof typeof r[1]["observation"]["values"]]!;
      const fine = r[2]!.observation.values[key as keyof typeof r[2]["observation"]["values"]]!;
      const tolerance = key.endsWith("ef") ? .005 : key.startsWith("mean") ? .5 : Math.abs(fine) * .01;
      return { key, coarse, fine, tolerance, passed: Math.abs(coarse - fine) <= tolerance };
    });
    await save("step-comparison.json", comparisons);
    if (comparisons.some(c => !c.passed)) throw new Error("Cold fine-step comparison failed");
    const built = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": process.cwd() } },
      define: { "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY": JSON.stringify("hot-path-lean") },
      build: { target: "es2022", minify: false, sourcemap: false, write: false,
        lib: { entry: resolve("studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseExactModelV1.entry.ts"), formats: ["es"] },
        rollupOptions: { output: { inlineDynamicImports: true } } } });
    const outputs = Array.isArray(built) ? built : [built];
    const chunks = "output" in outputs[0]! ? outputs[0].output.filter(o => o.type === "chunk") : [];
    if (chunks.length !== 1 || chunks[0]!.imports.length || chunks[0]!.dynamicImports.length) throw new Error("Artifact is not self-contained");
    const bytes = new TextEncoder().encode(chunks[0]!.code), artifactSha256 = createHash("sha256").update(bytes).digest("hex");
    const artifact = join(output, "artifact.mjs"); await writeFile(artifact, bytes, { flag: "wx" }); files.push(artifact);
    const release = factory(), compiled = await compiledRelease(artifact), adapter = release.executables.simulationAdapter;
    same(release.manifest, compiled.manifest, "artifact manifest");
    const model = composeStandardModelContractV1(release.manifest, surface, methods(surface).capabilities).contract;
    const captures = { baseline: r[0]!.capture, hfref: r[1]!.capture }, capturePaths = {} as Record<Case, string>;
    const routes: unknown[] = [];
    // Geometry changes load the target's qualified capture, never a warm
    // remapping of the source geometry. Each route reuses the real exact host.
    for (const [routeIndex, name] of (["baseline", "hfref", "baseline"] as const).entries()) {
      const capture = captures[name], id = { runtimeSessionId: `route/${routeIndex}`, scenarioId: "case" };
      await release.executables.captureAdapter.validateCapture({ model, capture });
      await adapter.createSession({ runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: id.scenarioId, ...capture }] });
      await compiled.executables.simulationAdapter.createSession({ runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: id.scenarioId, ...JSON.parse(JSON.stringify(capture)) }] });
      for (let k = 0; k < 1000; k++) same(await adapter.advanceOnePresentationStep(id),
        await compiled.executables.simulationAdapter.advanceOnePresentationStep(id), `${name} source/artifact continuation ${k}`);
      routes.push({ name, steps: 1000, finalTimeSec: adapter.currentFrame(id).acceptedTimeSec });
      adapter.disposeSession(id.runtimeSessionId); compiled.executables.simulationAdapter.disposeSession(id.runtimeSessionId);
    }
    for (const name of ["baseline", "hfref"] as const) capturePaths[name] = await save(`capture-${name}.json`, captures[name]);
    const localControls: unknown[] = [];
    for (const name of ["baseline", "hfref"] as const) {
      const id = { runtimeSessionId: `local-controls/${name}`, scenarioId: name }, c = inputs(name);
      await adapter.createSession({ runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: name, ...captures[name] }] });
      const operations = [["hemodynamics.systemic-resistance", 1.16], ["hemodynamics.systemic-resistance", c.hemo.systemicResistance],
        ["hemodynamics.total-blood-volume-ml", c.hemo.totalBloodVolumeMl + 100], ["hemodynamics.total-blood-volume-ml", c.hemo.totalBloodVolumeMl],
        ["myocardium.lv-contractility", name === "hfref" ? .4 : 1.05], ["myocardium.lv-contractility", name === "hfref" ? .35 : 1],
        ["rhythm.heart-rate-bpm", 60], ["rhythm.heart-rate-bpm", 70]] as const;
      for (const [i, [controlId, value]] of operations.entries()) {
        await adapter.applyControl({ ...id, controlId, value, expectedInputEpoch: i });
        for (let j = 0; j < 5; j++) await adapter.advancePresentationBatch({ ...id, stepCount: 200, presentationOutputIds: [] });
        localControls.push({ name, controlId, value, evolvedSeconds: 2, acceptedTimeSec: adapter.currentFrame(id).acceptedTimeSec });
      }
      adapter.disposeSession(id.runtimeSessionId);
    }
    await save("local-controls.json", localControls);
    const analysisTasks: AnalysisTask[] = (["baseline", "hfref"] as const).flatMap(name => [pvId, starlingId].flatMap(analysisId =>
      (["hypovolemic", "hypervolemic"] as const).map(partition => ({ kind: "analysis" as const, name, analysisId, partition, artifact, capture: capturePaths[name] }))));
    process.stdout.write("Cold/fine and artifact parity passed; running 8 structural partitions with 4 workers.\n");
    const analyses = await workers<AnalysisResult>(analysisTasks, 4);
    for (let i = 0; i < analyses.length; i++) await save(`analysis-${i}.json`, analyses[i]);
    if (analyses.some(a => !a.ok)) throw new Error("Structural analysis failed; see retained partitions");
    const summaries: unknown[] = [];
    for (let i = 0; i < analyses.length; i += 2) {
      const a = (analyses[i] as { ok: true; value: AnalysisResult }).value, b = (analyses[i + 1] as { ok: true; value: AnalysisResult }).value;
      const merged = merge([a.result, b.result]);
      await save(`analysis-merged-${i / 2}.json`, merged);
      const payload = merged.payload as unknown as { left: { starlingLocus: Locus }; right: { starlingLocus: Locus } };
      const pv = a.task.analysisId === pvId ? { left: pva(payload.left.starlingLocus, "LV"), right: pva(payload.right.starlingLocus, "RV") } : null;
      if (pv) await save(`pva-${a.task.name}.json`, pv);
      summaries.push({ name: a.task.name, analysisId: a.task.analysisId, pv,
        leftLocus: payload.left.starlingLocus.status, rightLocus: payload.right.starlingLocus.status,
        maximumPartitionWallTimeMs: Math.max(a.wallTimeMs, b.wallTimeMs) });
    }
    const report = { protocol, status: "local-runtime-observed-review-pending", sourceSha256: source.sourceSha256, artifactSha256,
      comparisons, routes, localControls, structuralAnalyses: summaries, publicPromotionAuthorized: false,
      limitations: ["Fixed chronic phenotype, not time-evolving remodeling, regional ischemia or AMI.",
        "Reference coronary bed and absolute demand are unchanged; perfusion per current mass or oxygen adequacy is not validated.",
        "New anatomy's full public control range is not qualified by these resting and local-continuation checks.",
        "Baseline comparison is descriptive, not load matched. Tau quality and all unavailable results are retained."], wallTimeMs: performance.now() - started };
    await save("report.json", report);
    const preset = (id: string, title: string, description: string, capture: ScenarioCaptureV2) => ({
      schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, presetId: id, modelId: model.modelId, title, description, capture });
    const body = { schemaId: "local-hfref-model-lab-bundle-v1", manifest: release.manifest, surface,
      artifactRevisionId: await hash({ manifest: release.manifest, artifactSha256 }), artifactSha256,
      baseline: preset("research/baseline", "baseline", "baselineの形状・循環設定から独立に定常化した比較用症例。", captures.baseline),
      presets: [preset("research/hfref-chronic-dilated-v1", "HFrEF候補：慢性拡大型（LV主体）",
        "LV自由壁・中隔の収縮能低下と心室拡大を組み合わせた安静時の研究候補。慢性期の一つの表現であり、AMIやリモデリングの進行過程は再現しない。正式採用前。", captures.hfref)],
      reference, assessment: assess(r[1]!.observation, r[0]!.observation), qualificationReportSha256: await hash(report) };
    const bundle = { ...body, recordSha256: await hash(body) };
    await save("bundle.json", bundle); await source.finish(files);
    if (process.argv.includes("--install-local")) {
      const dir = resolve("public/research/static-case-v1"); await mkdir(dir, { recursive: true });
      await writeFile(join(dir, "artifact.mjs"), bytes); await writeFile(join(dir, "bundle.json"), JSON.stringify(bundle) + "\n");
    }
    process.stdout.write(JSON.stringify({ output, status: report.status, values: r[1]!.observation.values, wallTimeMs: report.wallTimeMs }) + "\n");
  } catch (e) {
    await save("failure.json", { protocol, error: e instanceof Error ? e.stack ?? e.message : String(e), publicPromotionAuthorized: false });
    await source.finish(files); throw e;
  }
}
await main().catch(e => { process.stderr.write(String(e instanceof Error ? e.stack : e) + "\n"); process.exitCode = 1; });
