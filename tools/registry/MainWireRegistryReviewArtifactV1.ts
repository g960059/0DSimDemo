import { build } from "vite";
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { canonicalJsonStringify as canonical } from "@/engine/integrity";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import type { MainWireStaticCaseFittingResultV1 as Result } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as factory,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1 as fixtureSchema } from "@/domain/model/MainWireStaticCaseIdentityV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV4";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";
import { STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID as presetSchema, type ScenarioPresetV2 } from "@/studio/contracts/v2/content";
import { fittingFileSha256V1 as sha } from "../scientific/SealedFittingRunV1";
import lock from "@/data/model-releases/standard73/publication.json";

const same = (a: unknown, b: unknown, label: string) => {
  if (canonical(a) !== canonical(b)) throw new Error(`Review artifact mismatch: ${label}`);
};

/** Build once per candidate collection, never once per case. The source graph
 * identifies which archived numerical files must still match this artifact. */
export async function buildMainWireRegistryReviewArtifactV1() {
  const compile = async () => {
    const built = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": process.cwd() } },
      define: { "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY": JSON.stringify("hot-path-lean") },
      build: { target: "es2022", minify: false, sourcemap: false, write: false,
        lib: { entry: resolve("studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseExactModelV1.entry.ts"), formats: ["es"] },
        rollupOptions: { output: { inlineDynamicImports: true } } } });
    const result = Array.isArray(built) ? built[0]! : built;
    const chunks = "output" in result ? result.output.filter(o => o.type === "chunk") : [];
    if (chunks.length !== 1 || chunks[0]!.imports.length || chunks[0]!.dynamicImports.length) throw new Error("Artifact must be self-contained");
    return { bytes: new TextEncoder().encode(chunks[0]!.code), paths: chunks[0]!.moduleIds
      .filter(id => id.startsWith(process.cwd() + "/") && !id.includes("/node_modules/"))
      .map(id => relative(process.cwd(), id.split("?")[0]!)) };
  };
  const first = await compile(), second = await compile();
  same(sha(first.bytes), sha(second.bytes), "deterministic builds");
  const source = factory(), namespace = await importExactExecutableArtifactModuleV2(first.bytes);
  const compiled = await (namespace.createCircleHeartExactModelReleaseV1 as typeof factory)();
  same(source.manifest, compiled.manifest, "compiled manifest");
  const manifestBytes = new TextEncoder().encode(canonical(source.manifest));
  const framed = new Uint8Array(8 + manifestBytes.length + first.bytes.length), lengths = new DataView(framed.buffer);
  lengths.setUint32(0, manifestBytes.length, false); lengths.setUint32(4, first.bytes.length, false);
  framed.set(manifestBytes, 8); framed.set(first.bytes, 8 + manifestBytes.length);
  const sourceFiles = await Promise.all([...new Set([...first.paths, "package-lock.json"])].sort()
    .map(async path => ({ path, sha256: sha(await readFile(path)) })));
  return { bytes: first.bytes, source, compiled, sourceFiles, surface, analysisMethods: methods(surface).capabilities,
    artifactSha256: sha(first.bytes), artifactRevisionId: sha(framed), deterministicBuilds: 2 };
}

/** The already admitted exact bytes remain authoritative when shared UI
 * validators change the source build. Every case must still pass the complete
 * source/admitted-artifact continuation below; this does not admit new bytes. */
export async function loadRegisteredMainWireReviewArtifactV1() {
  const sourceBuild = await buildMainWireRegistryReviewArtifactV1();
  const bytes = new Uint8Array(await readFile(resolve("data/model-releases/standard73/artifact.mjs.txt")));
  if (sha(bytes) !== lock.artifactSha256) throw new Error("Registered exact bytes differ from publication lock");
  const namespace = await importExactExecutableArtifactModuleV2(bytes);
  const compiled = await (namespace.createCircleHeartExactModelReleaseV1 as typeof factory)();
  same(sourceBuild.source.manifest, compiled.manifest, "source/registered manifest");
  const manifestBytes = new TextEncoder().encode(canonical(compiled.manifest));
  const framed = new Uint8Array(8 + manifestBytes.length + bytes.length), lengths = new DataView(framed.buffer);
  lengths.setUint32(0, manifestBytes.length, false); lengths.setUint32(4, bytes.length, false);
  framed.set(manifestBytes, 8); framed.set(bytes, 8 + manifestBytes.length);
  if (sha(framed) !== lock.artifactRevisionId) throw new Error("Registered artifact identity differs");
  return { ...sourceBuild, bytes, compiled, artifactSha256: lock.artifactSha256, artifactRevisionId: lock.artifactRevisionId,
    sourceBuildArtifactRevisionId: sourceBuild.artifactRevisionId, usesAdmittedArtifact: true };
}
export function assertMainWireReviewNumericalSourceV1(artifactFiles: readonly { path: string; sha256: string }[],
  numericalFiles: readonly { path: string; sha256: string }[]) {
  const original = new Map(numericalFiles.map(f => [f.path, f.sha256]));
  for (const file of artifactFiles) {
    if (!original.has(file.path)) throw new Error(`Numerical source was not archived: ${file.path}; rerun this case`);
    if (original.get(file.path) !== file.sha256) throw new Error(`Numerical source changed since qualification: ${file.path}; rerun this case`);
  }
}

export async function mainWireReviewPresetV1(result: Result, metadata: { presetId: string; title: string; description: string }) {
  const c = result.candidateInputs;
  const owner = await Session.restore(result.execution.checkpoint, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  const before = owner.currentAcceptedState().acceptedTimeSec, aligned = Math.ceil((before - 1e-12) / .002) * .002;
  if (aligned > before + 1e-12) owner.advanceToPresentationTimeWithSelectedOutputProjectionV1(aligned, []);
  const launch = await owner.checkpoint();
  same(launch.base.completedBeatMetrics, result.execution.diagnostics.completedBeat, "launch retained complete beat");
  return { preset: validateScenarioPresetV2({ schemaId: presetSchema, modelId: result.modelId, ...metadata,
    capture: { fixture: { ...template, schemaId: fixtureSchema, anatomyId: c.anatomyId,
      hemodynamicResearchInputs: c.hemodynamicResearchInputs, mechanismResearchInputs: c.mechanismResearchInputs },
      checkpoint: { acceptedRevision: launch.base.revision, acceptedTimeSec: launch.base.acceptedTimeSec, payload: launch as never } } }),
    binding: { sourceResultSha256: result.resultSha256, qualifiedCheckpointSha256: result.execution.checkpoint.checkpointSha256,
      launchCheckpointSha256: launch.checkpointSha256, sourceAcceptedTimeSec: before, launchAcceptedTimeSec: aligned,
      completedBeatUnchanged: true, priorCheckpointImported: false } };
}

/** One arbitrary case. No baseline/HFrEF count or healthy criteria are assumed. */
export async function verifyMainWireReviewContinuationV1(artifact: Awaited<ReturnType<typeof buildMainWireRegistryReviewArtifactV1>>,
  preset: ScenarioPresetV2) {
  const { source, compiled, surface } = artifact;
  const model = composeStandardModelContractV1(source.manifest, surface, artifact.analysisMethods).contract;
  if (preset.modelId !== model.modelId) throw new Error("Preset model differs");
  const id = { runtimeSessionId: `registry-review/${preset.presetId}`, scenarioId: preset.presetId };
  try {
    for (const release of [source, compiled]) {
      await release.executables.captureAdapter.validateCapture({ model, capture: preset.capture });
      await release.executables.simulationAdapter.createSession({ runtimeSessionId: id.runtimeSessionId,
        scenarios: [{ scenarioId: id.scenarioId, ...preset.capture }] });
    }
    for (let i = 0; i < 1000; i++) same(await source.executables.simulationAdapter.advanceOnePresentationStep(id),
      await compiled.executables.simulationAdapter.advanceOnePresentationStep(id), `${preset.presetId}: step ${i}`);
    const capture = async (release: typeof source) => (await release.executables.experimentCapture.captureAcceptedCandidate({
      experimentId: "registry-review-memory-only", model,
      desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
        scenarios: [{ scenarioId: id.scenarioId, label: preset.title, fixture: preset.capture.fixture }],
        surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
      correlation: { runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: id.scenarioId, expectedInputEpoch: 0 }] },
    })).content.scenarios[0]!.capture;
    same(await capture(source), await capture(compiled), "terminal full capture");
    return { presetId: preset.presetId, steps: 1000, completeFramesAndTerminalCaptureEqual: true };
  } finally { for (const release of [source, compiled]) release.executables.simulationAdapter.disposeSession(id.runtimeSessionId); }
}
