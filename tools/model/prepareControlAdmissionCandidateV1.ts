import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { CURRENT_MODEL_PRESETS_V1 } from "@/data/model-releases/CurrentModelReleaseV1";
import metadata from "@/data/model-candidates/control-admission-v1/candidate.json";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV5";
import { loadControlAdmissionCandidateModuleV1 } from "@/analysis/methods/mainWire/MainWireControlAdmissionCandidateModuleV1";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { assertPortableStudioJsonObjectV2 } from "@/studio/contracts/v2/model";
import { resolveRegisteredAnalysisMethodsV1 } from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import { prepareMainWireSurfaceAnalysisV1, PreparedSurfaceAnalysisErrorV1 } from "../registry/PrepareMainWireSurfaceAnalysisV1";
import { beginFittingSourceSnapshotV1 } from "../scientific/FittingSourceSnapshotV1";
import { writeFittingRunJsonV1 as write } from "../scientific/FittingRunFilesV1";

// No registry/default writes. Output is a review package, not scientific
// readmission of the predecessor's baseline or disease-reference judgments.
const { values } = parseArgs({ options: { output: { type: "string" } } });
if (!values.output) throw new Error("Require --output NEW_DIRECTORY");
const output = resolve(values.output); await mkdir(output);
const source = await beginFittingSourceSnapshotV1(join(output, "execution"));
const files: string[] = [], rows: unknown[] = [], presets = [];
try {
  const module = await loadControlAdmissionCandidateModuleV1(), Session = module.ControlCandidateSessionV1;
  const exact = module.createCircleHeartExactModelReleaseV1();
  const model = composeStandardModelContractV1(exact.manifest, surface, resolveRegisteredAnalysisMethodsV1(surface).capabilities).contract;
  for (const previous of CURRENT_MODEL_PRESETS_V1) {
    const started = performance.now(), fixture = previous.capture.fixture;
    assertPortableStudioJsonObjectV2(fixture, "$.candidateLaunch.fixture");
    console.log(JSON.stringify({ presetId: previous.presetId, stage: "verify-candidate-continuation" }));
    const session = await Session.restoreWithStepRecovery(previous.capture.checkpoint!.payload, fixture.anatomyId as never,
      fixture.hemodynamicResearchInputs as never, 1, fixture.mechanismResearchInputs as never);
    const start = session.currentAcceptedState().acceptedTimeSec;
    for (let tick = 1; tick <= 5000; tick++) {
      const result = session.advanceToPresentationTimeWithSelectedOutputProjectionV1((Math.round(start / .002) + tick) * .002, []);
      if (result.advance.status !== "advanced") throw new Error(`Candidate launch continuation failed: ${previous.presetId}`);
    }
    const checkpoint = await session.checkpoint();
    const preset = validateScenarioPresetV2({ ...previous, modelId: metadata.manifest.modelId,
      capture: { fixture, checkpoint: { acceptedRevision: checkpoint.base.revision,
        acceptedTimeSec: checkpoint.base.acceptedTimeSec, payload: checkpoint as never } } });
    await exact.executables.captureAdapter.validateCapture({ model, capture: preset.capture });
    const resumed = await Session.restoreWithStepRecovery(checkpoint, fixture.anatomyId as never, fixture.hemodynamicResearchInputs as never, 1, fixture.mechanismResearchInputs as never);
    for (let tick = 1; tick <= 128; tick++) {
      const target = (Math.round(checkpoint.base.acceptedTimeSec / .002) + tick) * .002;
      const live = session.advanceToPresentationTimeWithSelectedOutputProjectionV1(target, []).advance;
      const restored = resumed.advanceToPresentationTimeWithSelectedOutputProjectionV1(target, []).advance;
      if (live.status !== "advanced" || restored.status !== "advanced"
        || live.acceptedTimeSec !== target || restored.acceptedTimeSec !== target)
        throw new Error(`Candidate launch restore did not advance: ${previous.presetId}`);
    }
    if (JSON.stringify(await session.checkpoint()) !== JSON.stringify(await resumed.checkpoint()))
      throw new Error(`Candidate launch exact restore differs: ${previous.presetId}`);
    presets.push(preset);
    console.log(JSON.stringify({ presetId: previous.presetId, stage: "prepare-pinned-surface-analysis" }));
    try {
      const prepared = await prepareMainWireSurfaceAnalysisV1({ preset, surface,
        artifactRevisionId: metadata.artifactRevisionId, preparationSourceSha256: source.sourceSha256 });
      const filename = `${prepared.captureSha256}.json`;
      files.push(await write(output, filename, prepared));
      rows.push({ presetId: preset.presetId, status: "prepared", filename, assessment: prepared.assessment,
        continuation: "10-seconds-new-numerics-plus-exact-restore", previousModelId: previous.modelId,
        importedPredecessorCheckpoint: true, scientificReadmission: "not-claimed", elapsedMs: performance.now() - started });
    } catch (error) {
      if (error instanceof PreparedSurfaceAnalysisErrorV1)
        files.push(await write(output, `held-${presets.length}-analysis.json`, error.analysis));
      rows.push({ presetId: preset.presetId, status: "held", reason: String(error), elapsedMs: performance.now() - started });
      process.exitCode = 1;
    }
    console.log(JSON.stringify(rows.at(-1)));
  }
  files.push(await write(output, "launches.json", { scope: "ephemeral-review-only", modelId: metadata.manifest.modelId,
    artifactRevisionId: metadata.artifactRevisionId, surfaceReleaseId: surface.surfaceReleaseId,
    preparationSourceSha256: source.sourceSha256, presets }));
  files.push(await write(output, "report.json", { modelId: metadata.manifest.modelId, artifactRevisionId: metadata.artifactRevisionId,
    rows, scientificReadmission: "not-claimed", registryWrites: false, activeBundleChanged: false }));
} finally { await source.finish(files); }
