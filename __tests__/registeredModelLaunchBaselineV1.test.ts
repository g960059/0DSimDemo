import { afterEach, describe, expect, it, vi } from "vitest";
import { REGISTERED_CURRENT_MODEL_BASELINE_V1 as baseline } from "@/studio/registry/RegisteredCurrentModelBaselineV1";
import { resolveRegisteredModelLaunchCheckpointV1, resolveRegisteredModelLaunchDefaultsV1 } from "@/studio/registry/RegisteredModelLaunchBaselineV1";
import { mainWireStaticCaseFittingSeedV1 } from "@/analysis/registry/MainWireStaticCaseFittingSeedV1";
import { registeredCurrentBaselinePresentationV1 } from "@/studio/presentation/CurrentBaselinePresentationV1";
import { loadStudioLocalCurrentClientCompositionV1 as localComposition,
  loadStudioDefaultClientCompositionV2, loadStudioExperimentClientCompositionV2,
  loadStudioSnapshotClientCompositionV2, invalidateStudioClientCompositionCachesV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import * as releaseResolvers from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";
import currentSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import descriptor from "@/data/model-releases/CurrentModelReleaseV1";
import lock from "@/data/model-releases/standard73/publication.json";
import savedCurrentDocument from "@/studio/presentation/modelDocumentation/packages/standard73-document-v2.json";
import { materializeExactModelControlValuesV1 } from "@/studio/application/model/ExactModelControlValuesV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { CURRENT_BASELINE_V1 as adopted } from "@/data/model-baselines/CurrentBaselineV1";
import selected from "@/data/model-baselines/current-baseline-selection-v1.json";

describe("current Standard73 launch baseline", () => {
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
  it("materializes all53 controls, both presets and inherited analyses without loading numerical source", async () => {
    const composition = await localComposition();
    expect(composition.exactModel.modelId).toBe(baseline.modelId);
    expect(composition.exactModel.defaultCheckpoint).toBe(baseline.checkpoint);
    expect(composition.exactModel.workerReleaseTicket.manifest).toEqual(descriptor.manifest);
    expect(composition.exactModel.workerReleaseTicket.artifactRevisionId).toBe(lock.artifactRevisionId);
    const controls = materializeExactModelControlValuesV1(composition.modelSurface.contract,
      composition.exactModel.defaultFixture, composition.exactModel.fixtureProjection);
    expect(Object.keys(controls)).toHaveLength(53);
    expect(composition.presets?.map(p => p.presetId)).toEqual(lock.cases.map(c => c.presetId));
    expect(controls["rhythm.heart-rate-bpm"]).toEqual({ status: "value", value: 70 });
    expect(controls["hemodynamics.total-blood-volume-ml"]).toEqual({ status: "value", value: 4935 });
    expect(controls["myocardium.active-tension-scale.LVFW"]).toEqual({ status: "value", value: 1 });
    expect(composition.modelSurface.identity.surfaceReleaseId).toBe(currentSurface.surfaceReleaseId);
    expect(composition.modelSurface.analysis.periodicPvaDerivation).toBeDefined();
  });
  it("resolves new, pinned experiment, and snapshot through the same current Surface", async () => {
    vi.spyOn(releaseResolvers, "studioSupabaseModelReleaseResolverV1").mockReturnValue(null);
    const current = await loadStudioDefaultClientCompositionV2();
    for (const loaded of [await loadStudioExperimentClientCompositionV2(baseline.modelId, surface.surfaceSeriesId),
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
