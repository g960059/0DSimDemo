import { build } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { canonicalJsonStringify } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { createCircleHeartExactModelReleaseV1 as sourceFactory, MAIN_WIRE_STANDARD71_DEFAULT_FIXTURE_V1 as fixture,
  MAIN_WIRE_STANDARD71_SETTLED_CHECKPOINT_V1 as checkpoint } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71ExactModelV1";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import { validateExecutableBundleV2 } from "@/studio/infrastructure/model/ExactModelExecutableValidationV1";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71SurfaceV1";
import { resolveMainWireAnalysisMethodsForSurfaceV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";

// Local executable verification only. Writes a candidate package/evidence, not
// an admission lock and never changes a registry/default or uploads anything.
const { values } = parseArgs({ options: { output: { type: "string" } } });
if (!values.output) throw new Error("--output NEW_DIR");
const output = resolve(values.output), root = process.cwd();
const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const same = (a: unknown, b: unknown, label: string) => {
  if (canonicalJsonStringify(a) !== canonicalJsonStringify(b)) throw new Error(`Standard71 artifact mismatch: ${label}`);
};
async function compile() {
  const built = await build({ configFile: false, logLevel: "silent",
    define: { "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY": JSON.stringify("hot-path-lean") },
    resolve: { alias: { "@": root } },
    build: { target: "es2022", minify: false, sourcemap: false, write: false,
      lib: { entry: resolve(root, "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71ExactModelV1.entry.ts"), formats: ["es"] },
      rollupOptions: { output: { inlineDynamicImports: true } } } });
  const outputs = Array.isArray(built) ? built : [built];
  const chunks = outputs.length === 1 && "output" in outputs[0]! ? outputs[0].output.filter(o => o.type === "chunk") : [];
  if (chunks.length !== 1 || chunks[0]!.imports.length || chunks[0]!.dynamicImports.length) throw new Error("Self-contained artifact required");
  return new TextEncoder().encode(chunks[0]!.code);
}
const started = performance.now();
const first = await compile(), second = await compile();
if (sha(first) !== sha(second)) throw new Error("Two artifact builds differ");
selectHotPathIntegrityTierV1("hot-path-lean");
const namespace = await importExactExecutableArtifactModuleV2(first);
if (typeof namespace.createCircleHeartExactModelReleaseV1 !== "function") throw new Error("Missing exact release factory");
const artifact = await namespace.createCircleHeartExactModelReleaseV1() as ReturnType<typeof sourceFactory>;
const source = sourceFactory();
same(artifact.manifest, source.manifest, "manifest");
const methods = resolveMainWireAnalysisMethodsForSurfaceV1(surface);
const model = composeStandardModelContractV1(source.manifest, surface, methods.capabilities).contract;
validateExecutableBundleV2(artifact.executables, model);
const scenarioId = "baseline", runtimeSessionId = "71/artifact";
for (const release of [source, artifact]) await release.executables.simulationAdapter.createSession({ runtimeSessionId, scenarios: [{ scenarioId, fixture }] });
const sourceAdapter = source.executables.simulationAdapter, adapter = artifact.executables.simulationAdapter;
try {
  const initial = adapter.currentFrame({ runtimeSessionId, scenarioId });
  if (initial.acceptedTimeSec !== checkpoint.acceptedTimeSec || initial.acceptedRevision !== checkpoint.revision) throw new Error("Artifact did not start at its launch checkpoint");
  same(initial, sourceAdapter.currentFrame({ runtimeSessionId, scenarioId }), "initial source/artifact frame");
  for (let i = 0; i < 12; i++) same(await adapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId }),
    await sourceAdapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId }), "advanced source/artifact frame");
  const beforeControl = adapter.currentFrame({ runtimeSessionId, scenarioId });
  same(await adapter.applyControl({ runtimeSessionId, scenarioId, controlId: "hemodynamics.total-blood-volume-ml", value: 4935, expectedInputEpoch: beforeControl.inputEpoch }),
    await sourceAdapter.applyControl({ runtimeSessionId, scenarioId, controlId: "hemodynamics.total-blood-volume-ml", value: 4935, expectedInputEpoch: beforeControl.inputEpoch }), "default TBV action");
  const frame = adapter.currentFrame({ runtimeSessionId, scenarioId });
  const captured = await artifact.executables.experimentCapture.captureAcceptedCandidate({ experimentId: "71/local-binding", model,
    desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
      scenarios: [{ scenarioId, label: "Baseline", fixture }],
      surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
    correlation: { runtimeSessionId, scenarios: [{ scenarioId, expectedInputEpoch: frame.inputEpoch }] } });
  const capture = captured.content.scenarios[0]!.capture;
  await artifact.executables.captureAdapter.validateCapture({ model, capture });
  const restoredId = "71/artifact-restored";
  await adapter.createSession({ runtimeSessionId: restoredId, scenarios: [{ scenarioId, fixture: capture.fixture, checkpoint: capture.checkpoint }] });
  try {
    same((await adapter.advanceOnePresentationStep({ runtimeSessionId: restoredId, scenarioId })).outputs,
      (await adapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId })).outputs, "captured checkpoint continuation");
  } finally { adapter.disposeSession(restoredId); }
  const snapshot = await artifact.executables.snapshotGate.admitFrozenCandidate({ model,
    content: { ...captured.content, surfaceSeriesId: surface.surfaceSeriesId } });
  if (snapshot.status !== "passed") throw new Error(`Snapshot gate: ${JSON.stringify(snapshot)}`);
  const manifestBytes = new TextEncoder().encode(canonicalJsonStringify(source.manifest));
  const framed = new Uint8Array(8 + manifestBytes.length + first.length), lengths = new DataView(framed.buffer, 0, 8);
  lengths.setUint32(0, manifestBytes.length, false); lengths.setUint32(4, first.length, false);
  framed.set(manifestBytes, 8); framed.set(first, 8 + manifestBytes.length);
  const report = { schemaId: "main-wire-standard71-local-artifact-binding-v1", modelId: model.modelId,
    status: "passed", artifactSha256: sha(first), artifactRevisionId: sha(framed), artifactBytes: first.length,
    launchCheckpointSha256: checkpoint.checkpointSha256, deterministicDoubleBuild: true, sourceArtifactFrames: "exact",
    capturedContinuation: "exact", snapshotAdmission: snapshot.status,
    surfaceReleaseId: surface.surfaceReleaseId, surfaceInheritedWithoutCatalogChanges: true,
    registryAdmitted: false, browserVerified: false, published: false, wallTimeMs: performance.now() - started };
  await mkdir(output, { recursive: false });
  await writeFile(resolve(output, "Standard71.artifact.mjs"), first, { flag: "wx" });
  await writeFile(resolve(output, "Standard71.client.json"), JSON.stringify({ schemaId: "circleheart-standard-exact-model-client-descriptor-v1",
    manifest: source.manifest, defaultFixture: fixture }, null, 2) + "\n", { flag: "wx" });
  await writeFile(resolve(output, "artifact-binding.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  process.stdout.write(JSON.stringify(report) + "\n");
} finally {
  sourceAdapter.disposeSession(runtimeSessionId); adapter.disposeSession(runtimeSessionId);
}
