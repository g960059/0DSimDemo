import { afterEach, describe, expect, it, vi } from "vitest";
import { REGISTERED_CURRENT_MODEL_BASELINE_V1 as baseline } from "@/studio/registry/RegisteredCurrentModelBaselineV1";
import { resolveRegisteredModelLaunchCheckpointV1, resolveRegisteredModelLaunchDefaultsV1 } from "@/studio/registry/RegisteredModelLaunchBaselineV1";
import { mainWireStaticCaseFittingSeedV1 } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import { registeredCurrentBaselinePresentationV1 } from "@/studio/presentation/CurrentBaselinePresentationV1";
import { loadStudioLocalCurrentClientCompositionV1 as localComposition,
  loadStudioDefaultClientCompositionV2, loadStudioExperimentClientCompositionV2,
  loadStudioSnapshotClientCompositionV2, invalidateStudioClientCompositionCachesV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import * as releaseResolvers from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import oldSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import currentSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV5";
import descriptor from "@/data/model-releases/CurrentModelReleaseV1";
import lock from "@/data/model-releases/standard73/publication.json";
import savedCurrentDocument from "@/studio/presentation/modelDocumentation/packages/standard73-document-v2.json";
import { materializeExactModelControlValuesV1 } from "@/studio/application/model/ExactModelControlValuesV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { CURRENT_BASELINE_V1 as adopted } from "@/data/model-baselines/CurrentBaselineV1";
import selected from "@/data/model-baselines/current-baseline-selection-v1.json";
import { CURRENT_MODEL_PRESETS_V1 } from "@/data/model-releases/CurrentModelReleaseV1";
import { MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1 } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";

describe("current Standard73 launch baseline", () => {
  it("defaults to pressure-crossing analysis and exposes four independently owned presets", async () => {
    const production = await localComposition();
    expect(production.modelSurface.identity.surfaceReleaseId).toBe(currentSurface.surfaceReleaseId);
    expect(production.exactModel.defaultCheckpoint).toBe(baseline.checkpoint);
    expect(currentSurface.controlCatalog).toEqual(oldSurface.controlCatalog);
    expect(production.presets).toHaveLength(4);
    expect(new Set(production.presets!.map(p => p.presetId)).size).toBe(4);
    expect(production.presets!.slice(2).map(p => p.title)).toEqual(["AS · 弁狭窄のみ・高勾配", "AS · 低EF・低流量・低勾配"]);
    expect(Object.values(MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1).map(d => d.adoptedPresetId).sort())
      .toEqual(production.presets!.map(p => p.presetId).sort());
    for (const d of Object.values(MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1)) expect(mainWireStaticCaseFittingSeedV1(d.referenceId)).toBeDefined();
  });
  it("keeps settled AS captures matched to their normal-valve inputs without rewriting original admission", async () => {
    const production = await localComposition();
    const presets = CURRENT_MODEL_PRESETS_V1.slice(2);
    expect(presets[0]!.description).not.toContain("PVAが出ない");
    for (const [i, p] of presets.entries()) {
      const { checkpointSha256, ...body } = p.capture.checkpoint.payload as Record<string, unknown>;
      expect(await sha256CanonicalJsonHex(body)).toBe(checkpointSha256);
      expect(checkpointSha256).toBe([
        "f520d1aed1c19838af986ee082eec3bd2cb0b96b475f754d8be471ecfad4a1d0",
        "8afed77d2f489b75b968e1104193e8a9f72066ab35e99bd513d0f394a7716a16",
      ][i]);
      expect(p.capture.checkpoint.acceptedTimeSec).toBeGreaterThan(40);
      const f = structuredClone(p.capture.fixture) as typeof descriptor.defaultFixture;
      expect(f.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2).toBe(.8);
      f.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2 = 3.5;
      expect(f).toEqual(production.presets![i]!.capture.fixture);
      expect(p.presetId.startsWith("research/")).toBe(false);
      expect(p.modelId).toBe(lock.modelId);
      expect(lock.cases.some(existing => existing.presetId === p.presetId)).toBe(false);
    }
  });
  afterEach(() => { vi.restoreAllMocks(); invalidateStudioClientCompositionCachesV2(); });
  it("binds own settled capture to the reviewed fixture and fitting selection", async () => {
    const { recordSha256, ...recordBody } = adopted;
    expect(await sha256CanonicalJsonHex(recordBody)).toBe(recordSha256);
    expect(selected.recordSha256).toBe(recordSha256);
    expect(selected.document).toEqual({ documentId: savedCurrentDocument.documentId, contentSha256: savedCurrentDocument.contentSha256 });
    expect(selected.baselineId).toBe(savedCurrentDocument.identity.baselineId);
    expect(baseline.assessment).toBe(adopted.assessment);
    expect(baseline.document).toBe(adopted.document);
    const raw = baseline.checkpoint.payload as Record<string, unknown>;
    const { checkpointSha256, ...body } = raw;
    expect(await sha256CanonicalJsonHex(body)).toBe(checkpointSha256);
    expect(checkpointSha256).toBe(lock.cases[0].checkpointSha256);
    expect(raw.checkpointId).toContain("standard-73");
    expect(baseline.checkpoint.acceptedTimeSec).toBeGreaterThan(40);
    expect(baseline.fixture).toEqual(descriptor.defaultFixture);
    expect(mainWireStaticCaseFittingSeedV1("baseline")).toMatchObject({
      anatomyId: "baseline-v1", ventricularContractilityScale: 1,
      hemodynamicResearchInputs: descriptor.defaultFixture.hemodynamicResearchInputs,
      mechanismResearchInputs: descriptor.defaultFixture.mechanismResearchInputs,
    });
    expect(Object.isFrozen(baseline.checkpoint)).toBe(true);
  });
  it("materializes all53 controls, four presets and inherited analyses without loading numerical source", async () => {
    const composition = await localComposition();
    expect(composition.exactModel.modelId).toBe(baseline.modelId);
    expect(composition.exactModel.defaultCheckpoint).toBe(baseline.checkpoint);
    expect(composition.exactModel.workerReleaseTicket.manifest).toEqual(descriptor.manifest);
    expect(composition.exactModel.workerReleaseTicket.artifactRevisionId).toBe(lock.artifactRevisionId);
    const controls = materializeExactModelControlValuesV1(composition.modelSurface.contract,
      composition.exactModel.defaultFixture, composition.exactModel.fixtureProjection);
    expect(Object.keys(controls)).toHaveLength(53);
    expect(composition.presets?.slice(0, 2).map(p => p.presetId)).toEqual(lock.cases.map(c => c.presetId));
    expect(controls["rhythm.heart-rate-bpm"]).toEqual({ status: "value", value: 70 });
    expect(controls["hemodynamics.total-blood-volume-ml"]).toEqual({ status: "value", value: 4935 });
    expect(controls["myocardium.active-tension-scale.LVFW"]).toEqual({ status: "value", value: 1 });
    expect(composition.modelSurface.identity.surfaceReleaseId).toBe(currentSurface.surfaceReleaseId);
    expect(composition.modelSurface.analysis.periodicPvaDerivation).toBeDefined();
  });
  it("resolves new, pinned experiment, and snapshot through the same current Surface", async () => {
    vi.spyOn(releaseResolvers, "studioSupabaseModelReleaseResolverV1").mockReturnValue(null);
    const current = await loadStudioDefaultClientCompositionV2();
    for (const loaded of [await loadStudioExperimentClientCompositionV2(baseline.modelId, currentSurface.surfaceSeriesId),
      await loadStudioSnapshotClientCompositionV2(baseline.modelId, currentSurface.surfaceSeriesId, currentSurface.surfaceReleaseId)]) {
      expect(loaded).toBe(current);
      expect(loaded.exactModel.defaultCheckpoint).toBe(baseline.checkpoint);
    }
    const pinned = await loadStudioSnapshotClientCompositionV2(baseline.modelId, surface.surfaceSeriesId, surface.surfaceReleaseId);
    expect(pinned.modelSurface.identity.surfaceReleaseId).toBe(surface.surfaceReleaseId);
    expect(pinned.exactModel.defaultCheckpoint).toBe(baseline.checkpoint);
    expect(pinned).not.toBe(current);
    await expect(loadStudioSnapshotClientCompositionV2(baseline.modelId, surface.surfaceSeriesId, "unrelated")).rejects.toThrow(/Surface/);
    await expect(loadStudioExperimentClientCompositionV2("circleheart.main-wire-integrated-transaction-v3.algebraic-pulmonary-root.standard-70",
      surface.surfaceSeriesId)).rejects.toThrow(/current exact model/);
  });
  it("uses compatible remote metadata without mutating release records", async () => {
    const local = await localComposition();
    const release = Object.freeze({ ticket: local.exactModel.workerReleaseTicket,
      defaultFixture: descriptor.defaultFixture, stage: "stable" as const, surfaceStage: "stable" as const, activeBundleVersion: 5 });
    const before = JSON.stringify(release);
    vi.spyOn(releaseResolvers, "studioSupabaseModelReleaseResolverV1").mockReturnValue({ resolveActiveBundle: vi.fn(async () => release) } as never);
    const remote = await loadStudioDefaultClientCompositionV2();
    expect(remote.exactModel.defaultCheckpoint).toBe(baseline.checkpoint);
    expect(remote.activeBundleVersion).toBe(5);
    expect(JSON.stringify(release)).toBe(before);
  });
  it("never attaches a checkpoint or baseline report to an edited/unrelated fixture", async () => {
    const local = await localComposition(), ticket = local.exactModel.workerReleaseTicket;
    const changed = { ...descriptor.defaultFixture, hemodynamicResearchInputs: {
      ...descriptor.defaultFixture.hemodynamicResearchInputs, totalBloodVolumeMl: 4940 } };
    expect(resolveRegisteredModelLaunchCheckpointV1(baseline.modelId, changed)).toBeUndefined();
    expect(registeredCurrentBaselinePresentationV1(baseline.modelId, changed, "ja")).toBeUndefined();
    expect(registeredCurrentBaselinePresentationV1("unrelated", baseline.fixture, "ja")).toBeUndefined();
    for (const input of [
      { ticket, defaultFixture: changed },
      { ticket: { ...ticket, modelId: "unrelated" }, defaultFixture: descriptor.defaultFixture },
      { ticket: { ...ticket, manifest: { ...ticket.manifest, modelId: "unrelated" } }, defaultFixture: descriptor.defaultFixture },
      { ticket: { ...ticket, surfaceRelease: { ...surface, displayName: "unreviewed" } }, defaultFixture: descriptor.defaultFixture },
      { ticket: { ...ticket, surfaceRelease: { ...currentSurface, displayName: "unreviewed" } }, defaultFixture: descriptor.defaultFixture },
    ]) expect(resolveRegisteredModelLaunchDefaultsV1(input).defaultCheckpoint).toBeUndefined();
  });
  it("retains contextual cautions instead of presenting all observations as normal", () => {
    const report = registeredCurrentBaselinePresentationV1(baseline.modelId, baseline.fixture, "ja")!;
    expect(report.summary).toContain("正常性の一括判定ではありません");
    for (const id of ["left-ventricle.maximum-dpdt", "left-ventricle.minimum-dpdt", "timing.ict", "timing.tei-index", "pulmonary-artery-pressure.minimum"]) {
      expect(report.items.find(item => item.itemId === id)?.status).toBe("warning");
    }
    expect(report.items.find(item => item.itemId === "lv-relaxation-tau")).toMatchObject({ value: "32.0 / 52.4 ms", status: "reference" });
    expect(report.items.find(item => item.itemId === "aortic-valve.mean-gradient")?.detail).toContain("Doppler");
  });
});
