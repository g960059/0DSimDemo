import { afterEach, describe, expect, it, vi } from "vitest";
import { REGISTERED_CURRENT_MODEL_BASELINE_V1 as baseline } from "@/studio/registry/RegisteredCurrentModelBaselineV1";
import { resolveRegisteredModelLaunchCheckpointV1, resolveRegisteredModelLaunchDefaultsV1 } from "@/studio/registry/RegisteredModelLaunchBaselineV1";
import { MAIN_WIRE_FITTING_SEED_V1 as fittingSeed } from "@/analysis/registry/MainWireFittingSeedV1";
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
import { readPreparedBaselineCaseV1, preparedBaselineLaunchV1 } from "@/studio/registry/PreparedBaselineCaseV1";
import { mainWireBaselineAssessmentPresentationV1 } from "@/studio/presentation/CurrentBaselinePresentationV1";
import binding from "@/studio/integrations/mainWireIntegratedV3/standard72-baseline-binding-evidence.json";
import eligibility from "@/data/model-baselines/standard72-reviewed-eligibility-v1.json";
import { STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID } from "@/studio/contracts/v2/content";

// Known baseline capture; synthetic hashes test package integrity, not final
// scientific qualification. The exporter re-observes the real paired report.
async function packageFixture() {
  const checkpoint = baseline.checkpoint.payload as any;
  const record = { schemaId: "prepared-main-wire-baseline-case-v1", preset: {
    schemaId: STUDIO_SCENARIO_PRESET_V2_SCHEMA_ID, presetId: "test/baseline-copy", modelId: baseline.modelId,
    title: "Local candidate", description: "Synthetic package-binding test", capture: {
      fixture: baseline.fixture, checkpoint: baseline.checkpoint } },
    surfaceReleaseId: surface.surfaceReleaseId, artifactRevisionId: lock.artifactRevisionId, artifactSha256: lock.artifactSha256,
    fixtureSha256: await sha256CanonicalJsonHex(baseline.fixture),
    assessment: { rest: binding.rest, native: eligibility.observations[0]!.native,
      tau: eligibility.observations[0]!.tau, beat: {
        ventricularAbsolutePressureRateExtrema: checkpoint.baseStandardCheckpointV2.completedBeatMetrics.ventricularAbsolutePressureRateExtrema,
        valveForwardPressureGradients: checkpoint.baseStandardCheckpointV2.completedBeatMetrics.valveForwardPressureGradients }, reserveVerified: true },
    evidence: { qualificationReportSha256: "a".repeat(64), qualificationPolicySha256: "b".repeat(64),
      referenceSha256: "c".repeat(64), executionSourceSha256: "d".repeat(64),
      qualifiedCheckpointSha256: checkpoint.checkpointSha256, launchCheckpointSha256: checkpoint.checkpointSha256,
      sourceArtifactContinuationSteps: 1000 }, publicBaselinePromotionAuthorized: false };
  return { ...record, recordSha256: await sha256CanonicalJsonHex(record) };
}

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
    expect(fittingSeed).toMatchObject({
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
  it("selects an owned preset for a new session without changing the registered baseline or ticket", async () => {
    const raw = await packageFixture(), before = JSON.stringify(baseline);
    const candidate = await readPreparedBaselineCaseV1(raw);
    const composition = await localComposition(), ticket = composition.exactModel.workerReleaseTicket;
    const launch = preparedBaselineLaunchV1(candidate, ticket);
    expect(launch).toEqual({ defaultFixture: baseline.fixture, defaultCheckpoint: baseline.checkpoint });
    expect(Object.isFrozen(candidate.preset.capture)).toBe(true);
    raw.preset.title = "edited after read";
    expect(candidate.preset.title).toBe("Local candidate");
    expect(JSON.stringify(baseline)).toBe(before);
    expect(composition.exactModel.defaultFixture).toEqual(baseline.fixture);
    expect(() => preparedBaselineLaunchV1(candidate, { ...ticket, artifactRevisionId: "e".repeat(64) })).toThrow(/incompatible/);
    const view = mainWireBaselineAssessmentPresentationV1(candidate.assessment, "ja", "candidate");
    expect(view.summary).toContain("採用・公開はしていません");
    expect(view.items).toEqual(registeredCurrentBaselinePresentationV1(baseline.modelId, baseline.fixture, "ja")!.items);
  });
  it("rejects edited and rehashed incomplete evidence, stale artifacts, checkpoint clocks and mixed assessments", async () => {
    const raw = await packageFixture();
    raw.preset.title = "tampered";
    await expect(readPreparedBaselineCaseV1(raw)).rejects.toThrow(/digest/);
    for (const mutate of [
      (p: any) => { delete p.evidence.executionSourceSha256; },
      (p: any) => { p.evidence.sourceArtifactContinuationSteps = 0; },
      (p: any) => { p.artifactRevisionId = "e".repeat(64); },
      (p: any) => { p.preset.capture.checkpoint.acceptedTimeSec += .002; },
      (p: any) => { p.assessment.beat.valveForwardPressureGradients.AoV.peakMmHg += 1; },
      (p: any) => { p.assessment.reserveVerified = false; },
    ]) {
      const changed = JSON.parse(JSON.stringify(await packageFixture())); mutate(changed);
      const { recordSha256: _old, ...body } = changed;
      changed.recordSha256 = await sha256CanonicalJsonHex(body);
      await expect(readPreparedBaselineCaseV1(changed)).rejects.toThrow();
    }
  });
});
