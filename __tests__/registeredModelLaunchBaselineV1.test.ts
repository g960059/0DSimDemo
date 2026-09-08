import { afterEach, describe, expect, it, vi } from "vitest";
import { REGISTERED_CURRENT_MODEL_BASELINE_V1 as baseline } from "@/studio/registry/RegisteredCurrentModelBaselineV1";
import { resolveRegisteredModelLaunchCheckpointV1, resolveRegisteredModelLaunchDefaultsV1 } from "@/studio/registry/RegisteredModelLaunchBaselineV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { registeredCurrentBaselinePresentationV1 } from "@/studio/presentation/CurrentBaselinePresentationV1";
import { loadStudioLocalAlgebraicPulmonaryRootClientCompositionV1 as localComposition,
  loadStudioDefaultClientCompositionV2, loadStudioExperimentClientCompositionV2,
  loadStudioSnapshotClientCompositionV2, invalidateStudioClientCompositionCachesV2 } from "@/studio/composition/StudioDefaultCompositionV2";
import * as releaseResolvers from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import descriptor from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1.client.json";
import lock from "@/studio/integrations/mainWireIntegratedV3/standard72-registry-admission-lock.json";
import { materializeExactModelControlValuesV1 } from "@/studio/application/model/ExactModelControlValuesV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("current Standard72 launch baseline", () => {
  afterEach(() => { vi.restoreAllMocks(); invalidateStudioClientCompositionCachesV2(); });
  it("binds own settled capture to the reviewed fixture and fitting selection", async () => {
    const raw = baseline.checkpoint.payload as Record<string, unknown>;
    const { checkpointSha256, ...body } = raw;
    expect(await sha256CanonicalJsonHex(body)).toBe(checkpointSha256);
    expect(checkpointSha256).toBe(lock.releaseQualification.launchCheckpointSha256);
    expect(raw.checkpointId).toContain("standard72");
    expect(baseline.checkpoint.acceptedTimeSec).toBeGreaterThan(40);
    expect(await sha256CanonicalJsonHex(baseline.fixture)).toBe(lock.releaseQualification.defaultFixtureSha256);
    expect(baseline.fixture).toEqual(descriptor.defaultFixture);
    expect(resolveMainWireFittingReferenceV1("baseline").selectedConstruction).toMatchObject({
      modelId: baseline.modelId, baselineId: baseline.baselineId,
      candidateInputs: { ventricularContractilityScale: 1,
        hemodynamicResearchInputs: descriptor.defaultFixture.hemodynamicResearchInputs,
        mechanismResearchInputs: descriptor.defaultFixture.mechanismResearchInputs },
    });
    expect(Object.isFrozen(baseline.checkpoint)).toBe(true);
  });
  it("materializes all52 controls and inherited analyses without loading numerical source", async () => {
    const composition = await localComposition();
    expect(composition.exactModel.modelId).toBe(baseline.modelId);
    expect(composition.exactModel.defaultCheckpoint).toBe(baseline.checkpoint);
    expect(composition.exactModel.workerReleaseTicket.manifest).toEqual(descriptor.manifest);
    expect(composition.exactModel.workerReleaseTicket.artifactRevisionId).toBe(lock.artifactRevisionId);
    const controls = materializeExactModelControlValuesV1(composition.modelSurface.contract,
      composition.exactModel.defaultFixture, composition.exactModel.fixtureProjection);
    expect(Object.keys(controls)).toHaveLength(52);
    expect(controls["rhythm.heart-rate-bpm"]).toEqual({ status: "value", value: 70 });
    expect(controls["hemodynamics.total-blood-volume-ml"]).toEqual({ status: "value", value: 4935 });
    expect(controls["myocardium.active-tension-scale.LVFW"]).toEqual({ status: "value", value: 1 });
    expect(composition.modelSurface.identity.surfaceReleaseId).toBe(surface.surfaceReleaseId);
    expect(composition.modelSurface.analysis.periodicPvaDerivation).toBeDefined();
  });
  it("resolves new, pinned experiment, and snapshot through the same current Surface", async () => {
    vi.spyOn(releaseResolvers, "studioSupabaseModelReleaseResolverV1").mockReturnValue(null);
    const current = await loadStudioDefaultClientCompositionV2();
    for (const loaded of [await loadStudioExperimentClientCompositionV2(baseline.modelId, surface.surfaceSeriesId),
      await loadStudioSnapshotClientCompositionV2(baseline.modelId, surface.surfaceSeriesId, surface.surfaceReleaseId)]) {
      expect(loaded).toBe(current);
      expect(loaded.exactModel.defaultCheckpoint).toBe(baseline.checkpoint);
    }
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
