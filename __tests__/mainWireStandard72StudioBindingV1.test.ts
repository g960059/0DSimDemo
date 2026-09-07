import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { createCircleHeartExactModelReleaseV1 as releaseFactory, MAIN_WIRE_STANDARD72_DEFAULT_FIXTURE_V1 as fixture,
  MAIN_WIRE_STANDARD72_SETTLED_CHECKPOINT_V1 as checkpoint } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";
import inherited from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import { MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard71ControlsV1";
import { applyMainWireIntegratedStudioRoundedEjectionControlV1 as applyControl,
  reduceMainWireIntegratedStudioRoundedEjectionControlV1 as reduceControl,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1 as oldControls } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionControlsV1";
import { mainWireIntegratedStudioControlValueFromFixtureV3 as projected } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import { assertExactModelKernelManifestV3 } from "@/studio/contracts/v2/modelSurface";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { assertBoundExecutionPlanV1 } from "@/runtime/executionPlan/BoundExecutionPlanV1";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID as pvAnalysis,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID as starlingAnalysis } from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";

const tbv = "hemodynamics.total-blood-volume-ml", scenarioId = "baseline";
// This integration test exercises the actual live worker tier; construction,
// corrupted checkpoint, and continuation tests separately retain full checks.
const previousTier = hotPathIntegrityTierV1();
beforeAll(() => selectHotPathIntegrityTierV1("hot-path-lean"));
afterAll(() => selectHotPathIntegrityTierV1(previousTier));

async function capture(release: ReturnType<typeof releaseFactory>, runtimeSessionId: string) {
  const frame = release.executables.simulationAdapter.currentFrame({ runtimeSessionId, scenarioId });
  const methods = resolveMainWireAnalysisMethodsForSurfaceV1(surface);
  const model = composeStandardModelContractV1(release.manifest, surface, methods.capabilities).contract;
  return release.executables.experimentCapture.captureAcceptedCandidate({ experimentId: "72/continuation-test", model,
    desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
      scenarios: [{ scenarioId, label: "baseline", fixture }],
      surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
    correlation: { runtimeSessionId, scenarios: [{ scenarioId, expectedInputEpoch: frame.inputEpoch }] } });
}

describe("Standard72 local source release integration", () => {
  it("reuses the unchanged compatible production Surface and all pinned analysis", () => {
    const { surfaceReleaseId: _a, predecessorSurfaceReleaseId: _b, displayName: _c, ...actual } = surface;
    const { surfaceReleaseId: _d, predecessorSurfaceReleaseId: _e, displayName: _f, ...expected } = inherited;
    expect(actual).toEqual(expected);
    expect(surface).toBe(inherited);
    const release = releaseFactory();
    expect(() => assertExactModelKernelManifestV3(release.manifest)).not.toThrow();
    expect(release.manifest.capabilities).toEqual(expect.arrayContaining([`analysis/${pvAnalysis}`, `analysis/${starlingAnalysis}`]));
    const exact = [...release.manifest.primitiveSignalCatalog, ...release.manifest.modelMetricCatalog].map(o => o.outputId);
    expect(surface.exposedExactOutputIds.every(id => exact.includes(id))).toBe(true);
  });

  it("projects all52 primitive defaults and uses one71-only TBV lattice for reducer and manifest", () => {
    const release = releaseFactory();
    expect(release.manifest.primitiveControlCatalog).toHaveLength(52);
    for (const control of release.manifest.primitiveControlCatalog) {
      expect(projected(fixture, control.controlId)).toEqual({ status: "value", value: control.defaultValue });
      expect(() => applyControl(fixture, control.controlId, control.defaultValue!, MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1)).not.toThrow();
      expect(() => reduceControl(fixture, control.controlId, control.defaultValue!, MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1)).not.toThrow();
    }
    expect(MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1.get(tbv)).toMatchObject({ minimum: 4200, maximum: 7000, step: 5, defaultValue: 4935 });
    expect(oldControls.find(c => c.controlId === tbv)?.step).toBe(50);
    for (const value of [4930, 4935, 4940]) expect(applyControl(fixture, tbv, value, MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1).hemodynamicResearchInputs.totalBloodVolumeMl).toBe(value);
    expect(() => applyControl(fixture, tbv, 4935)).toThrow(/step/);
    expect(() => applyControl(fixture, tbv, 4936, MAIN_WIRE_STANDARD71_CONTROL_BY_ID_V1)).toThrow(/step/);
  });

  it.each([false, true])("starts settled through either adapter (execution plan=%s), and changes/resets TBV atomically", async execution => {
    const release = releaseFactory(), adapter = release.executables.simulationAdapter, runtimeSessionId = `72/adapter/${execution}`;
    const scenarios = [{ scenarioId, fixture }];
    const bound = release.executables.executionPlan.bind();
    assertBoundExecutionPlanV1(bound, release.executables.executionPlan.descriptor);
    if (execution) await release.executables.executionPlan.createSession({ runtimeSessionId, scenarios,
      boundExecutionPlans: new Map([[scenarioId, bound]]) });
    else await adapter.createSession({ runtimeSessionId, scenarios });
    try {
      let frame = adapter.currentFrame({ runtimeSessionId, scenarioId });
      expect(frame.acceptedTimeSec).toBe(checkpoint.acceptedTimeSec);
      expect(frame.acceptedRevision).toBe(checkpoint.revision);
      expect(frame.modelId).toBe(release.manifest.modelId);
      for (const value of [4940, 4935]) {
        frame = await adapter.applyControl({ runtimeSessionId, scenarioId, controlId: tbv, value, expectedInputEpoch: frame.inputEpoch });
        expect(frame.modelId).toBe(release.manifest.modelId);
        frame = await adapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId });
      }
      expect(frame.inputEpoch).toBe(2);
    } finally { adapter.disposeSession(runtimeSessionId); }
  }, 30_000);

  it("does not install the settled checkpoint in a different fixture", async () => {
    const release = releaseFactory(), runtimeSessionId = "72/other-fixture", adapter = release.executables.simulationAdapter;
    await adapter.createSession({ runtimeSessionId, scenarios: [{ scenarioId,
      fixture: { ...fixture, hemodynamicResearchInputs: { ...fixture.hemodynamicResearchInputs, totalBloodVolumeMl: 4940 } } }] });
    try { expect(adapter.currentFrame({ runtimeSessionId, scenarioId }).acceptedTimeSec).toBe(0); }
    finally { adapter.disposeSession(runtimeSessionId); }
  });

  it.each([false, true])("keeps warm history in actual experiment capture and continuation (after control=%s)", async afterControl => {
    const release = releaseFactory(), adapter = release.executables.simulationAdapter;
    const sourceId = `72/capture/${afterControl}`, restoredId = `${sourceId}/restored`;
    await adapter.createSession({ runtimeSessionId: sourceId, scenarios: [{ scenarioId, fixture }] });
    try {
      if (afterControl) await adapter.applyControl({ runtimeSessionId: sourceId, scenarioId, controlId: tbv, value: 4935, expectedInputEpoch: 0 });
      for (let i = 0; i < 8; i++) await adapter.advanceOnePresentationStep({ runtimeSessionId: sourceId, scenarioId });
      const before = adapter.currentFrame({ runtimeSessionId: sourceId, scenarioId });
      const saved = (await capture(release, sourceId)).content.scenarios[0]!.capture;
      expect(saved.checkpoint.payload).toMatchObject({ checkpointId: checkpoint.checkpointId, coupledPredictor: { historyDepth: 4 } });
      expect(adapter.currentFrame({ runtimeSessionId: sourceId, scenarioId })).toEqual(before);
      await adapter.createSession({ runtimeSessionId: restoredId, scenarios: [{ scenarioId, fixture: saved.fixture, checkpoint: saved.checkpoint }] });
      for (let i = 0; i < 500; i++) {
        const a = await adapter.advanceOnePresentationStep({ runtimeSessionId: sourceId, scenarioId });
        const b = await adapter.advanceOnePresentationStep({ runtimeSessionId: restoredId, scenarioId });
        expect({ time: b.acceptedTimeSec, revision: b.acceptedRevision, outputs: b.outputs })
          .toEqual({ time: a.acceptedTimeSec, revision: a.acceptedRevision, outputs: a.outputs });
      }
      expect((await capture(release, restoredId)).content.scenarios[0]!.capture.checkpoint.payload)
        .toEqual((await capture(release, sourceId)).content.scenarios[0]!.capture.checkpoint.payload);
    } finally { adapter.disposeSession(restoredId); adapter.disposeSession(sourceId); }
  }, 30_000);

  it.each([starlingAnalysis, pvAnalysis])("retains nonmutating native structural analysis: %s", async analysisId => {
    const release = releaseFactory(), adapter = release.executables.simulationAdapter, runtimeSessionId = `72/analysis/${analysisId}`;
    await adapter.createSession({ runtimeSessionId, scenarios: [{ scenarioId, fixture }] });
    try {
      for (let i = 0; i < 8; i++) await adapter.advanceOnePresentationStep({ runtimeSessionId, scenarioId });
      const before = adapter.currentFrame({ runtimeSessionId, scenarioId });
      const beforeCheckpoint = (await capture(release, runtimeSessionId)).content.scenarios[0]!.capture.checkpoint.payload;
      expect(beforeCheckpoint).toMatchObject({ coupledPredictor: { historyDepth: 4 } });
      const analysis = await adapter.requestAnalysis({ runtimeSessionId, scenarioId, analysisId,
        expectedInputEpoch: before.inputEpoch, expectedAcceptedRevision: before.acceptedRevision,
        expectedAcceptedTimeSec: before.acceptedTimeSec, analysisPartition: "hypovolemic" });
      expect(analysis.modelId).toBe(release.manifest.modelId);
      expect(analysis.payload).toBeTruthy();
      expect(adapter.currentFrame({ runtimeSessionId, scenarioId })).toEqual(before);
      expect((await capture(release, runtimeSessionId)).content.scenarios[0]!.capture.checkpoint.payload).toEqual(beforeCheckpoint);
      if (analysisId === pvAnalysis) {
        const payload = analysis.payload as unknown as { left: { starlingLocus: { status: string; points: { ventricularPressureVolumeLoop: unknown[] }[] } } };
        expect(payload.left.starlingLocus.status).toBe("measured-fixed-tbv-protocol");
        expect(payload.left.starlingLocus.points.length).toBeGreaterThanOrEqual(4);
        expect(payload.left.starlingLocus.points.every(p => p.ventricularPressureVolumeLoop.length >= 12)).toBe(true);
      }
    } finally { adapter.disposeSession(runtimeSessionId); }
  }, 180_000);
});
