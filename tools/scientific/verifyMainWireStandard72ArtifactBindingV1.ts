import { buildStandard72ArtifactV1 } from "@/tools/registry/BuildStandard72ArtifactV1";
import { prepareStandard72RegistryAdmissionV1, readStandard72AdmissionFilesV1 } from "@/tools/registry/Standard72RegistryAdmissionV1";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { canonicalJsonStringify } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { createCircleHeartExactModelReleaseV1 as sourceFactory, MAIN_WIRE_STANDARD72_DEFAULT_FIXTURE_V1 as fixture,
  MAIN_WIRE_STANDARD72_SETTLED_CHECKPOINT_V1 as checkpoint } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1";
import { importExactExecutableArtifactModuleV2 } from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import { validateExecutableBundleV2 } from "@/studio/infrastructure/model/ExactModelExecutableValidationV1";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import { resolveMainWireAnalysisMethodsForSurfaceV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";

// Local executable verification only. Writes a candidate package/evidence, not
// an admission lock and never changes a registry/default or uploads anything.
const { values } = parseArgs({ options: { output: { type: "string" },
  "reference-artifact": { type: "string" }, "reference-sha256": { type: "string" } } });
if (!values.output) throw new Error("--output NEW_DIR");
if (Boolean(values["reference-artifact"]) !== Boolean(values["reference-sha256"])) {
  throw new Error("Reference parity requires both --reference-artifact and --reference-sha256");
}
const output = resolve(values.output), root = process.cwd();
const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const same = (a: unknown, b: unknown, label: string) => {
  if (canonicalJsonStringify(a) !== canonicalJsonStringify(b)) throw new Error(`Standard72 artifact mismatch: ${label}`);
};
const compile = () => buildStandard72ArtifactV1(root);
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
// Optional extraction control against the reviewed research executable in the
// same JS engine. No retired implementation or platform-specific golden hash
// is added to the production runtime or CI continuation contract.
const referenceParity: { sha256: string; cases: { condition: string; steps: number; finalCheckpointEqual: boolean }[] } | null =
  values["reference-artifact"] ? { sha256: values["reference-sha256"]!, cases: [] } : null;
if (referenceParity) {
  const referenceBytes = await readFile(resolve(values["reference-artifact"]!));
  if (sha(referenceBytes) !== referenceParity.sha256) throw new Error("Reference artifact SHA mismatch");
  const module = await importExactExecutableArtifactModuleV2(referenceBytes);
  if (typeof module.createCircleHeartExactModelReleaseV1 !== "function") throw new Error("Reference factory missing");
  const reference = await module.createCircleHeartExactModelReleaseV1() as ReturnType<typeof sourceFactory>;
  same(reference.manifest, source.manifest, "reference/extracted manifest");
  for (const condition of ["settled", "cold-TBV4940", "controlled-TBV4940"]) {
    const runtimeSessionId = `72/extraction/${condition}`, scenarioId = "baseline";
    const initialFixture = condition === "cold-TBV4940"
      ? { ...fixture, hemodynamicResearchInputs: { ...fixture.hemodynamicResearchInputs, totalBloodVolumeMl: 4940 } } : fixture;
    const desiredFixture = condition === "settled" ? fixture
      : { ...fixture, hemodynamicResearchInputs: { ...fixture.hemodynamicResearchInputs, totalBloodVolumeMl: 4940 } };
    try {
      for (const release of [artifact, reference]) {
        await release.executables.simulationAdapter.createSession({ runtimeSessionId, scenarios: [{ scenarioId, fixture: initialFixture }] });
        if (condition === "controlled-TBV4940") await release.executables.simulationAdapter.applyControl({
          runtimeSessionId, scenarioId, controlId: "hemodynamics.total-blood-volume-ml", value: 4940, expectedInputEpoch: 0,
        });
      }
      same(artifact.executables.simulationAdapter.currentFrame({ runtimeSessionId, scenarioId }),
        reference.executables.simulationAdapter.currentFrame({ runtimeSessionId, scenarioId }), `reference ${condition} initial`);
      for (let i = 0; i < 1000; i++) {
        same(await artifact.executables.simulationAdapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId }),
          await reference.executables.simulationAdapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId }), `reference ${condition} step ${i + 1}`);
      }
      const checkpoints = [];
      for (const release of [artifact, reference]) {
        const frame = release.executables.simulationAdapter.currentFrame({ runtimeSessionId, scenarioId });
        const capture = await release.executables.experimentCapture.captureAcceptedCandidate({ experimentId: "72/extraction", model,
          desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
            scenarios: [{ scenarioId, label: "baseline", fixture: desiredFixture }],
            surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
          correlation: { runtimeSessionId, scenarios: [{ scenarioId, expectedInputEpoch: frame.inputEpoch }] } });
        checkpoints.push(capture.content.scenarios[0]!.capture.checkpoint.payload);
      }
      same(checkpoints[0], checkpoints[1], `reference ${condition} final checkpoint`);
      referenceParity.cases.push({ condition, steps: 1000, finalCheckpointEqual: true });
    } finally {
      artifact.executables.simulationAdapter.disposeSession(runtimeSessionId);
      reference.executables.simulationAdapter.disposeSession(runtimeSessionId);
    }
  }
}
const scenarioId = "baseline", runtimeSessionId = "72/artifact";
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
  // A control replaces the Session and empties predictor history. Require a
  // populated history so the continuation check cannot pass accidentally
  // merely because both sides happen to restart from the context seed.
  for (let i = 0; i < 8; i++) same(await adapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId }),
    await sourceAdapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId }), "history-populated source/artifact frame");
  const frame = adapter.currentFrame({ runtimeSessionId, scenarioId });
  const captured = await artifact.executables.experimentCapture.captureAcceptedCandidate({ experimentId: "72/local-binding", model,
    desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
      scenarios: [{ scenarioId, label: "Baseline", fixture }],
      surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
    correlation: { runtimeSessionId, scenarios: [{ scenarioId, expectedInputEpoch: frame.inputEpoch }] } });
  const capture = captured.content.scenarios[0]!.capture;
  const capturedPayload = capture.checkpoint.payload as unknown as { coupledPredictor?: { historyDepth: number } };
  if (capturedPayload.coupledPredictor?.historyDepth !== 4) throw new Error("Artifact capture did not retain a warm predictor");
  await artifact.executables.captureAdapter.validateCapture({ model, capture });
  const restoredId = "72/artifact-restored";
  await adapter.createSession({ runtimeSessionId: restoredId, scenarios: [{ scenarioId, fixture: capture.fixture, checkpoint: capture.checkpoint }] });
  try {
    for (let i = 0; i < 1000; i++) {
      const continued = await adapter.advanceOnePresentationStep({ runtimeSessionId: restoredId, scenarioId });
      const uninterrupted = await adapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId });
      same({ time: continued.acceptedTimeSec, revision: continued.acceptedRevision, outputs: continued.outputs },
        { time: uninterrupted.acceptedTimeSec, revision: uninterrupted.acceptedRevision, outputs: uninterrupted.outputs },
        `history-populated captured continuation step ${i + 1}`);
    }
  } finally { adapter.disposeSession(restoredId); }
  const snapshot = await artifact.executables.snapshotGate.admitFrozenCandidate({ model,
    content: { ...captured.content, surfaceSeriesId: surface.surfaceSeriesId } });
  if (snapshot.status !== "passed") throw new Error(`Snapshot gate: ${JSON.stringify(snapshot)}`);
  const manifestBytes = new TextEncoder().encode(canonicalJsonStringify(source.manifest));
  const framed = new Uint8Array(8 + manifestBytes.length + first.length), lengths = new DataView(framed.buffer, 0, 8);
  lengths.setUint32(0, manifestBytes.length, false); lengths.setUint32(4, first.length, false);
  framed.set(manifestBytes, 8); framed.set(first, 8 + manifestBytes.length);
  const report = { schemaId: "main-wire-standard72-local-artifact-binding-v1", modelId: model.modelId,
    status: "passed", artifactSha256: sha(first), artifactRevisionId: sha(framed), artifactBytes: first.length,
    launchCheckpointSha256: checkpoint.checkpointSha256, deterministicDoubleBuild: true, sourceArtifactFrames: "exact",
    capturedContinuation: "exact", capturedPredictorDepth: capturedPayload.coupledPredictor.historyDepth, capturedContinuationSteps: 1000, postControlWarmupSteps: 8,
    snapshotAdmission: snapshot.status, referenceParity,
    surfaceReleaseId: surface.surfaceReleaseId, surfaceInheritedWithoutCatalogChanges: true,
    registryAdmitted: false, browserVerified: false, published: false, wallTimeMs: performance.now() - started };
  const admitted = await prepareStandard72RegistryAdmissionV1(readStandard72AdmissionFilesV1(root, {
    artifact: first, clientJson: JSON.stringify({ schemaId: "circleheart-standard-exact-model-client-descriptor-v1",
      manifest: source.manifest, defaultFixture: fixture }),
  }), model.modelId);
  await mkdir(output, { recursive: false });
  await writeFile(resolve(output, "Standard72.artifact.mjs"), admitted.artifact, { flag: "wx" });
  await writeFile(resolve(output, "Standard72.client.json"), JSON.stringify({ schemaId: "circleheart-standard-exact-model-client-descriptor-v1",
    manifest: source.manifest, defaultFixture: fixture }, null, 2) + "\n", { flag: "wx" });
  await writeFile(resolve(output, "artifact-binding.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  process.stdout.write(JSON.stringify(report) + "\n");
} finally {
  sourceAdapter.disposeSession(runtimeSessionId); adapter.disposeSession(runtimeSessionId);
}
