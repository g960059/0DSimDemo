import { describe, expect, it } from "vitest";
import { REGISTERED_STANDARD70_LAUNCH_BASELINE_V1 as launch,
  validateMainWireStandard70LaunchBaselineV1, resolveRegisteredModelLaunchCheckpointV1 } from
  "@/studio/registry/RegisteredModelLaunchBaselineV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { resolveRegisteredExactModelBaselineValidationV1 } from
  "@/studio/registry/RegisteredExactModelBaselineValidationV1";
import { loadStudioLocalAlgebraicPulmonaryRootClientCompositionV1 } from
  "@/studio/composition/StudioDefaultCompositionV2";
import { materializeExactModelControlValuesV1 } from "@/studio/application/model/ExactModelControlValuesV1";
import descriptor from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("selected Standard70 launch baseline", () => {
  it("binds selected inputs, full capture, report and fitting reference without changing the exact descriptor", async () => {
    const before = JSON.stringify(descriptor);
    expect(await sha256CanonicalJsonHex(launch.candidateInputs)).toBe(launch.provenance.candidateIdentitySha256);
    const raw = launch.capture.checkpoint.payload as Record<string, unknown>;
    const { checkpointSha256, ...body } = raw;
    expect(await sha256CanonicalJsonHex(body)).toBe(checkpointSha256);
    const preparation = launch.provenance.launchPreparation;
    const { checkpointSha256: sourceHash, ...sourceBody } = launch.qualificationCheckpoint;
    expect(await sha256CanonicalJsonHex(sourceBody)).toBe(sourceHash);
    expect(sourceHash).toBe(preparation.sourceCheckpointSha256);
    expect(launch.qualificationCheckpoint).toMatchObject(launch.validationReport.checkpoint);
    const target = launch.capture.checkpoint.payload as unknown as typeof launch.qualificationCheckpoint;
    expect(target.baseStandardCheckpointV2.completedBeatMetrics)
      .toEqual(launch.qualificationCheckpoint.baseStandardCheckpointV2.completedBeatMetrics);
    expect(preparation.sourceCheckpointSha256).toBe(launch.validationReport.checkpoint.checkpointSha256);
    expect(preparation.sourceAcceptedTimeSec).toBe(launch.validationReport.checkpoint.acceptedTimeSec);
    expect(preparation.targetCheckpointSha256).toBe(checkpointSha256);
    expect(preparation.targetAcceptedTimeSec).toBe(launch.capture.checkpoint.acceptedTimeSec);
    expect(preparation.advancedDurationSec).toBe(preparation.targetAcceptedTimeSec - preparation.sourceAcceptedTimeSec);
    expect(preparation.advancedDurationSec).toBeGreaterThanOrEqual(0);
    expect(preparation.advancedDurationSec).toBeLessThanOrEqual(0.002 + 1e-10);
    expect(preparation.completedBeatUnchanged).toBe(true);
    expect(launch.validationReport.assessment!.pressureRateQuality.grids.coarse.checkpointSha256)
      .toBe(preparation.sourceCheckpointSha256);
    expect(resolveMainWireFittingReferenceV1("baseline").selectedConstruction).toEqual({
      modelId: launch.modelId, baselineId: launch.baselineId, candidateInputs: launch.candidateInputs,
    });
    expect(resolveRegisteredExactModelBaselineValidationV1(launch.modelId)).toEqual(launch.validationReport);
    expect(Object.isFrozen(launch.capture.checkpoint)).toBe(true);
    expect(JSON.stringify(descriptor)).toBe(before);
  });

  it("materializes new-session values from the launch fixture while retaining the exact manifest", async () => {
    const composition = await loadStudioLocalAlgebraicPulmonaryRootClientCompositionV1();
    expect(composition.exactModel.modelId).toBe(descriptor.manifest.modelId);
    expect(composition.exactModel.workerReleaseTicket.manifest).toEqual(descriptor.manifest);
    expect(composition.exactModel.defaultFixture).toEqual(launch.capture.fixture);
    expect(composition.exactModel.defaultCheckpoint).toBe(launch.capture.checkpoint);
    const controls = materializeExactModelControlValuesV1(composition.modelSurface.contract,
      composition.exactModel.defaultFixture, composition.exactModel.fixtureProjection);
    expect(controls["rhythm.heart-rate-bpm"]).toEqual({
      status: "value", value: launch.candidateInputs.hemodynamicResearchInputs.heartRateBpm,
    });
    expect(controls["hemodynamics.systemic-resistance"]).toEqual({
      status: "value", value: launch.candidateInputs.hemodynamicResearchInputs.systemicResistance,
    });
    expect(controls["myocardium.active-tension-scale.LVFW"]).toEqual({
      status: "value", value: launch.candidateInputs.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall.LVFW,
    });
  });

  it("never pairs the selected checkpoint with an unrelated or stale remote launch fixture", () => {
    expect(resolveRegisteredModelLaunchCheckpointV1(launch.modelId, launch.capture.fixture)).toBe(launch.capture.checkpoint);
    expect(resolveRegisteredModelLaunchCheckpointV1("unrelated", launch.capture.fixture)).toBeUndefined();
    expect(resolveRegisteredModelLaunchCheckpointV1(launch.modelId, descriptor.defaultFixture)).toBeUndefined();
    const changed = JSON.parse(JSON.stringify(launch.capture.fixture));
    changed.hemodynamicResearchInputs.totalBloodVolumeMl += 1;
    expect(resolveRegisteredModelLaunchCheckpointV1(launch.modelId, changed)).toBeUndefined();
  });

  it("rejects inconsistent fixture, candidate, report and checkpoint pairings before launch", () => {
    const mutations = [
      (v: any) => { v.modelId = "different"; },
      (v: any) => { v.candidateInputs.ventricularContractilityScale = 1.1; },
      (v: any) => { v.capture.fixture.hemodynamicResearchInputs.totalBloodVolumeMl += 1; },
      (v: any) => { v.capture.checkpoint.acceptedRevision += 1; },
      (v: any) => { v.capture.checkpoint.payload.acceptedTimeSec += 1; },
      (v: any) => { v.capture.checkpoint.payload.checkpointSha256 = "f".repeat(64); },
      (v: any) => { v.validationReport.status = "failed"; },
      (v: any) => { v.provenance.candidateIdentitySha256 = "f".repeat(64); },
      (v: any) => { v.provenance.clinicalValidationClaimed = true; },
      (v: any) => { v.provenance.qualificationEvidencePaths = []; },
      (v: any) => { delete v.provenance.launchPreparation; },
      (v: any) => { v.provenance.launchPreparation.sourceCheckpointSha256 = "f".repeat(64); },
      (v: any) => { v.provenance.launchPreparation.sourceAcceptedTimeSec += 0.001; },
      (v: any) => { v.provenance.launchPreparation.targetCheckpointSha256 = "f".repeat(64); },
      (v: any) => { v.provenance.launchPreparation.targetAcceptedTimeSec += 0.001; },
      (v: any) => { v.provenance.launchPreparation.advancedDurationSec = -0.001; },
      (v: any) => { v.provenance.launchPreparation.completedBeatUnchanged = false; },
      (v: any) => { delete v.qualificationCheckpoint; },
      (v: any) => { v.qualificationCheckpoint.checkpointSha256 = "f".repeat(64); },
      (v: any) => { v.qualificationCheckpoint.revision += 1; },
      (v: any) => { v.qualificationCheckpoint.acceptedTimeSec = v.capture.checkpoint.acceptedTimeSec + 1; },
      (v: any) => { v.qualificationCheckpoint.baseStandardCheckpointV2.completedBeatMetrics = null; },
      (v: any) => { v.capture.checkpoint.payload.baseStandardCheckpointV2.completedBeatMetrics.meanAorticPressureMmHg += 1; },
      (v: any) => {
        const p = v.provenance.launchPreparation;
        p.targetAcceptedTimeSec = p.sourceAcceptedTimeSec + 0.004;
        p.advancedDurationSec = p.targetAcceptedTimeSec - p.sourceAcceptedTimeSec;
        v.capture.checkpoint.acceptedTimeSec = v.capture.checkpoint.payload.acceptedTimeSec = p.targetAcceptedTimeSec;
      },
    ];
    for (const mutate of mutations) {
      const changed = JSON.parse(JSON.stringify(launch));
      mutate(changed);
      expect(() => validateMainWireStandard70LaunchBaselineV1(changed)).toThrow();
    }
  });
});
