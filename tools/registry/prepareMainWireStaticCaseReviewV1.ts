import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { build } from "vite";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { assessMainWireStaticBaselineQualificationV1 as assess } from "@/analysis/methods/mainWire/MainWireStaticBaselineQualificationV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as factory } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";
import { beginFittingSourceSnapshotV1 } from "../scientific/FittingSourceSnapshotV1";
import type { ScenarioPresetV2 } from "@/studio/contracts/v2/content";

// Local review preparation only. No registry client, numbered identity, vote,
// active baseline selection or historical document is written by this command.
selectHotPathIntegrityTierV1("hot-path-lean");
const { values } = parseArgs({ options: { qualification: { type: "string" }, lab: { type: "string" }, output: { type: "string" } } });
if (!values.qualification || !values.lab || !values.output) throw new Error("Require --qualification FILE --lab DIRECTORY --output NEW_DIRECTORY");
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
  const labSeal = await boundDirectory(values.lab), prior = await json(join(values.lab, "bundle.json"));
  const { recordSha256, ...priorBody } = prior;
  if (recordSha256 !== await hash(priorBody)) throw new Error("Original case bundle digest differs");
  const priorArtifact = await readFile(join(values.lab, "artifact.mjs"));
  if (sha(priorArtifact) !== prior.artifactSha256) throw new Error("Original artifact differs");
  const release = factory(); same(release.manifest, prior.manifest, "manifest"); same(surface, prior.surface, "Surface and analysis pins");
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
  if (sha(bytes) !== sha(second) || sha(bytes) !== prior.artifactSha256) throw new Error("Current deterministic artifact differs from reviewed execution; requalify affected behavior");
  const artifactPath = join(output, "artifact.mjs"); await writeFile(artifactPath, bytes, { flag: "wx" }); files.push(artifactPath);
  const namespace = await importExactExecutableArtifactModuleV2(bytes);
  const compiled = await (namespace.createCircleHeartExactModelReleaseV1 as () => ReturnType<typeof factory>)();
  same(compiled.manifest, release.manifest, "compiled manifest");
  const source = await Session.restore(coarse.execution.checkpoint, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  const before = source.currentAcceptedState().acceptedTimeSec, launchTime = Math.ceil((before - 1e-12) / .002) * .002;
  if (launchTime > before + 1e-12) source.advanceToPresentationTimeWithSelectedOutputProjectionV1(launchTime, []);
  const launch = await source.checkpoint();
  same(launch.base.completedBeatMetrics, coarse.execution.diagnostics.completedBeat, "launch retained qualified complete beat");
  const fixture = { ...prior.baseline.capture.fixture, anatomyId: c.anatomyId,
    hemodynamicResearchInputs: c.hemodynamicResearchInputs, mechanismResearchInputs: c.mechanismResearchInputs };
  const baseline = validateScenarioPresetV2({ ...prior.baseline, capture: { fixture,
    checkpoint: { acceptedRevision: launch.base.revision, acceptedTimeSec: launch.base.acceptedTimeSec, payload: launch as never } } });
  const presets = prior.presets.map(validateScenarioPresetV2) as ScenarioPresetV2[];
  if (presets.length !== 1 || presets[0]!.presetId !== "research/hfref-chronic-dilated-v1") throw new Error("Expected the selected single HFrEF recipe");
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
  const body = { ...priorBody, baseline, presets,
    baselineQualification: { reportSha256, executionSourceSha256: qualificationSeal.sourceSha256,
      qualifiedCheckpointSha256: coarse.execution.checkpoint.checkpointSha256,
      launchCheckpointSha256: launch.checkpointSha256,
      sourceAcceptedTimeSec: before, targetAcceptedTimeSec: launchTime, completedBeatUnchanged: true },
    caseLineage: { historicalLabSourceSha256: labSeal.sourceSha256, historicalBundleSha256: recordSha256,
      hfrefCaptureUnchanged: true, historicalBaselineComparisonCapture: prior.baseline.capture,
      explanation: "HFrEF's saved scientific comparison retains its original baseline observation. The selected baseline launch is independently qualified here; historical comparison data are not rewritten." },
    reviewPreparation: { sourceSha256: snapshot.sourceSha256, deterministicBuilds: 2, continuation,
      publicPromotionAuthorized: false, formalModelFrozen: false } };
  await save("bundle.json", { ...body, recordSha256: await hash(body) });
  await save("report.json", { status: "local-review-bundle-prepared", artifactSha256: sha(bytes),
    baselineQualificationReportSha256: reportSha256, continuation, publicPromotionAuthorized: false,
    remaining: ["Bind an own baseline document and the preserved HFrEF document", "Verify the changed baseline launch in the ordinary Worker",
      "Freeze and review the distinct final exact/Surface/document/registry package before adoption"] });
  console.log(JSON.stringify({ output, status: "local-review-bundle-prepared", publicPromotionAuthorized: false }));
} catch (error) { await save("failure.json", { message: error instanceof Error ? error.message : String(error) }); throw error; }
finally { await snapshot.finish(files); }
