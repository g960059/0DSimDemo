import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1 as template } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MAIN_WIRE_STATIC_CASE_FIXTURE_SCHEMA_ID_V1 as schemaId } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseIdentityV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import inherited from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import { MAIN_WIRE_STANDARD71_BASELINE_HEMODYNAMIC_INPUTS_V1 as hemo, MAIN_WIRE_STANDARD71_BASELINE_MECHANISM_INPUTS_V1 as mechanism } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 as methods } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import type { MainWireStaticCaseCheckpointV1 } from "@/engine/myocardium/MainWireStaticCaseCheckpointV1";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import localBundle from "@/data/model-releases/standard73/bundle.json";
import localPackage from "@/data/model-releases/standard73/package.json";
import baselineDoc from "@/studio/presentation/modelDocumentation/packages/standard73-document-v1.json";
import hfrefDoc from "@/studio/presentation/modelDocumentation/packages/standard73-hfref-document-v1.json";
import cycleSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import { MainWireCardiacCycleCollectorV1 } from "@/analysis/methods/mainWire/MainWireCardiacCycleCollectorV1";
import { buildMainWireCardiacCycleMetricsV1, MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1 as cycleInputs,
  MAIN_WIRE_CARDIAC_CYCLE_ANALYSIS_OUTPUT_IDS_V1 as cycleOutputs,
  type MainWireCardiacCycleAcceptedSampleV1 } from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";
import { loadStudioLocalBeatMetricsClientCompositionV1 } from "@/studio/composition/StudioDefaultCompositionV2";
import { CURRENT_BASELINE_V1 } from "@/data/model-baselines/CurrentBaselineV1";
import type { StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";

const originalTier = hotPathIntegrityTierV1();
beforeEach(() => selectHotPathIntegrityTierV1("hot-path-lean"));
afterEach(() => selectHotPathIntegrityTierV1(originalTier));
const fixture = (dilated: boolean) => ({ ...template, schemaId, anatomyId: dilated ? "dilated-lv-v1" : "baseline-v1",
  hemodynamicResearchInputs: { ...hemo, systemicResistance: dilated ? 1.2 : hemo.systemicResistance },
  mechanismResearchInputs: { ...mechanism, chamberMechanics: { ...mechanism.chamberMechanics,
    activeTensionScaleByWall: { ...mechanism.chamberMechanics.activeTensionScaleByWall, LVFW: dilated ? .35 : 1, SEP: dilated ? .35 : 1 } } } });

describe("static case exact adapter and inherited Surface", () => {
  it("launches the additive beat-metric candidate from the same exact baseline capture", async () => {
    const composition = await loadStudioLocalBeatMetricsClientCompositionV1();
    expect(composition.modelSurface.identity.surfaceReleaseId).toBe(cycleSurface.surfaceReleaseId);
    expect(composition.modelSurface.analysis.presentationMethods).toHaveLength(1);
    expect(composition.modelSurface.analysis.periodicPvaDerivation).toBe(methods(surface).periodicPvaDerivation);
    expect(composition.exactModel.modelId).toBe(localBundle.manifest.modelId);
    expect(composition.exactModel.defaultCheckpoint).toEqual(CURRENT_BASELINE_V1.capture.checkpoint);
    expect(composition.exactModel.workerReleaseTicket.artifactRevisionId).toBe(localPackage.artifactRevisionId);
  });

  it.each([localBundle.baseline, ...localBundle.presets])("observes full 2-ms beats in $presetId without modifying exact outputs", async preset => {
    const adapter = release().executables.simulationAdapter;
    const identity = { runtimeSessionId: "cycle-test", scenarioId: "case" };
    const collector = new MainWireCardiacCycleCollectorV1();
    const samples: MainWireCardiacCycleAcceptedSampleV1[] = [];
    const emissions: StudioSimulationAnalysisV2[] = [];
    await adapter.createSession({ runtimeSessionId: identity.runtimeSessionId, scenarios: [{ scenarioId: identity.scenarioId, ...preset.capture }] });
    try {
      for (let i = 0; i < 75; i++) {
        const batch = await adapter.advancePresentationBatch({ ...identity, stepCount: 16, presentationOutputIds: cycleInputs });
        const emission = collector.ingest(batch);
        if (emission) emissions.push(emission);
        for (let row = 0; row < batch.acceptedRevisions.length; row++) samples.push({
          inputEpoch: batch.terminalFrame.inputEpoch, acceptedRevision: batch.acceptedRevisions[row]!,
          acceptedTimeSec: batch.acceptedTimesSec[row]!, values: Object.fromEntries(cycleInputs.map((id, column) =>
            [id, batch.outputStates[row * cycleInputs.length + column]! < 2 ? batch.outputValues[row * cycleInputs.length + column]! : null])),
        });
      }
      const reference = buildMainWireCardiacCycleMetricsV1(samples);
      expect(reference.status).toBe("available");
      expect(emissions.at(-1)?.payload).toEqual(reference);
      expect(emissions.length).toBeGreaterThanOrEqual(2);
      expect(emissions.length).toBeLessThanOrEqual(5);
      if (reference.status !== "available") return;
      expect(Object.values(reference.values).every(value => typeof value === "number" && Number.isFinite(value))).toBe(true);
      const frame = adapter.currentFrame(identity);
      for (const id of cycleOutputs) expect(frame.outputs[id]).toBeUndefined();
      expect(reference.source.cycleDurationSec).toBeCloseTo(60 / Number(frame.outputs["rhythm.heart-rate.instantaneous"]?.value), 5);
    } finally { adapter.disposeSession(identity.runtimeSessionId); }
  }, 40_000);

  it("pins own baseline/case captures, documents and the production-framed executable revision without activating it", async () => {
    const { recordSha256, ...body } = localBundle;
    expect(await hash(body)).toBe(localPackage.bundleSha256); expect(recordSha256).toBe(localPackage.bundleSha256);
    expect(localBundle.manifest).toEqual(release().manifest); expect(localBundle.surface).toEqual(surface);
    expect(localPackage.publicRegistration).toBe(false); expect(localPackage.activeDefaultChanged).toBe(false);
    const artifact = await readFile("data/model-releases/standard73/artifact.mjs.txt");
    const sha = (b: Uint8Array | string) => createHash("sha256").update(b).digest("hex");
    expect(sha(artifact)).toBe(localPackage.artifactSha256);
    const manifest = Buffer.from(canonical(localBundle.manifest)), lengths = Buffer.alloc(8);
    lengths.writeUInt32BE(manifest.length, 0); lengths.writeUInt32BE(artifact.length, 4);
    expect(sha(Buffer.concat([lengths, manifest, artifact]))).toBe(localPackage.artifactRevisionId);
    const documents = [baselineDoc, hfrefDoc];
    for (const [i, p] of [localBundle.baseline, ...localBundle.presets].entries()) {
      const doc = documents[i], { contentSha256, ...body } = doc, entry = localPackage.cases[i];
      expect(sha(JSON.stringify(body))).toBe(contentSha256); expect(contentSha256).toBe(entry.documentSha256);
      expect(doc.identity.modelId).toBe(localPackage.modelId); expect(doc.identity.surfaceReleaseId).toBe(localPackage.surfaceReleaseId);
      expect(p.presetId).toBe(entry.presetId); expect(doc.identity.baselineId).toBe(p.presetId);
      expect(p.capture.checkpoint.payload.checkpointSha256).toBe(entry.checkpointSha256);
      expect(p.capture.checkpoint.payload.checkpointId).toBe("circleheart.main-wire-static-case-checkpoint.standard-73.v1");
      expect(doc.scientificRecord.measurements.construction).toEqual(p.capture.checkpoint.payload.construction);
    }
    expect(hfrefDoc.scientificRecord.measurements.historicalEvidence.documentId).toBe("hfref-static-case-document-v4");
  });

  it("keeps every inherited pane/item/control contract except the explicitly versioned mass-aware derivation", () => {
    const changed = new Set(["surfaceReleaseId", "surfaceSeriesId", "displayName", "derivedOutputCatalog", "controlCatalog", "predecessorSurfaceReleaseId"]);
    for (const [key, value] of Object.entries(inherited)) if (!changed.has(key)) expect(surface[key as keyof typeof surface]).toEqual(value);
    const exact = release(), contract = composeStandardModelContractV1(exact.manifest, surface, methods(surface).capabilities).contract;
    expect(contract.modelId).toContain("static-anatomy.standard-73");
    expect(exact.manifest.fixtureSchema.fixtureSchemaId).toBe(schemaId);
    expect(exact.manifest.primitiveControlCatalog.length).toBeGreaterThan(20);
    expect(surface.controlCatalog.slice(0, -1)).toEqual(inherited.controlCatalog);
    expect(surface.controlCatalog.at(-1)?.controlId).toBe("myocardium.lv-contractility");
    expect(surface.derivedOutputCatalog.map(o => o.outputId)).toEqual(inherited.derivedOutputCatalog.map(o => o.outputId));
  });

  it("preserves anatomy through controls, capture and reload; rejects fixture-only anatomy changes atomically", async () => {
    const exact = release(), adapter = exact.executables.simulationAdapter;
    const model = composeStandardModelContractV1(exact.manifest, surface, methods(surface).capabilities).contract;
    const f = fixture(true), identity = { runtimeSessionId: "case", scenarioId: "a" };
    await adapter.createSession({ runtimeSessionId: "case", scenarios: [{ scenarioId: "a", fixture: f }] });
    for (let i = 0; i < 100; i++) await adapter.advanceOnePresentationStep(identity);
    const changed = await adapter.applyControl({ ...identity, controlId: "myocardium.lv-contractility", value: .4, expectedInputEpoch: 0 });
    expect(changed.inputEpoch).toBe(1);
    const updated = { ...f, mechanismResearchInputs: { ...f.mechanismResearchInputs,
      chamberMechanics: { ...f.mechanismResearchInputs.chamberMechanics,
        activeTensionScaleByWall: { ...f.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, LVFW: .4, SEP: .4 } } } };
    const before = adapter.currentFrame(identity);
    await expect(adapter.replaceFixture({ ...identity, fixture: fixture(false) })).rejects.toThrow(/anatomy/);
    expect(adapter.currentFrame(identity)).toEqual(before);
    const captured = await exact.executables.experimentCapture.captureAcceptedCandidate({ experimentId: "case-test", model,
      desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
        scenarios: [{ scenarioId: "a", label: "case", fixture: updated }],
        surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
      correlation: { runtimeSessionId: "case", scenarios: [{ scenarioId: "a", expectedInputEpoch: 1 }] } });
    const capture = captured.content.scenarios[0]!.capture;
    expect((capture.checkpoint.payload as unknown as MainWireStaticCaseCheckpointV1).construction.anatomy.caseId).toBe("dilated-lv-v1");
    await exact.executables.captureAdapter.validateCapture({ model, capture });
    await adapter.createSession({ runtimeSessionId: "reload", scenarios: [{ scenarioId: "a", ...capture }] });
    for (let i = 0; i < 100; i++) {
      const a = await adapter.advanceOnePresentationStep(identity), b = await adapter.advanceOnePresentationStep({ ...identity, runtimeSessionId: "reload" });
      expect(b.outputs).toEqual(a.outputs); expect(b.acceptedTimeSec).toBe(a.acceptedTimeSec);
    }
    adapter.disposeSession("case"); adapter.disposeSession("reload");
  }, 20_000);
});
