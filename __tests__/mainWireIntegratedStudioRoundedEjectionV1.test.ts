import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_CHECKPOINT_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68OutputRegistryV1";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import {
  composeStandardModelContractV1,
  STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
} from "@/studio/contracts/v2/modelSurface";
import {
  resolveMainWireAnalysisMethodsForSurfaceV1,
} from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  createMainWireIntegratedStudioRoundedEjectionKernelV1,
  createMainWireIntegratedStudioRoundedEjectionReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  createMainWireIntegratedStudioRoundedEjectionSettledReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1,
  applyMainWireIntegratedStudioRoundedEjectionControlV1,
  reduceMainWireIntegratedStudioRoundedEjectionControlV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionControlsV1";
import {
  mainWireIntegratedStudioFixtureProjectionV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import roundedSurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionSurfaceV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";

const ET =
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1;
const MEAN_AV_GRADIENT =
  "hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.AoV";
const PEAK_AV_GRADIENT =
  "hemodynamics.pressure-gradient.valve.peak-hydraulic-forward.AoV";
const MAX_DPDT =
  "hemodynamics.pressure-rate.maximum-accepted-step.absolute.LV";
const MIN_DPDT =
  "hemodynamics.pressure-rate.minimum-accepted-step.absolute.LV";

describe("rounded-ejection Standard68 exact Workbench release", () => {
  it("binds ET and both structural analyses without reserving derived PVA in exact frames", () => {
    const kernel = createMainWireIntegratedStudioRoundedEjectionKernelV1();
    expect(kernel.modelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
    );
    expect(kernel.modelMetricCatalog.map(({ outputId }) => outputId))
      .toContain(ET);
    expect(kernel.capabilities).toEqual(expect.arrayContaining([
      `analysis/${MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID}`,
      `analysis/${MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID}`,
    ]));
    expect(kernel.modelMetricCatalog.map(({ outputId }) => outputId))
      .not.toContain("myocardium.energy.pressure-volume-area.LV");
    expect(roundedSurfaceV1.exposedExactOutputIds).toContain(ET);
    expect(roundedSurfaceV1.exposedExactOutputIds).toContain(
      "hemodynamics.pressure.absolute.Ao",
    );
    expect(roundedSurfaceV1.exposedExactOutputIds).not.toContain(
      "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
    );
    expect(roundedSurfaceV1.derivedOutputCatalog.map(({ outputId }) => outputId))
      .toEqual(expect.arrayContaining([
        "myocardium.energy.potential.LV-pressure-volume-area",
        "myocardium.energy.pressure-volume-area.LV",
      ]));
    const pvGraph = roundedSurfaceV1.graphCatalog.find(
      ({ graphId }) => graphId === "hemodynamics.pressure-volume",
    );
    expect(pvGraph?.requiredCapabilities).toEqual(expect.arrayContaining([
      `analysis/${MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID}`,
      `analysis/${MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID}`,
    ]));
    const methods = resolveMainWireAnalysisMethodsForSurfaceV1(
      roundedSurfaceV1,
    );
    const composed = composeStandardModelContractV1(
      kernel,
      roundedSurfaceV1,
      methods.capabilities,
    );
    expect(composed.contract.outputCatalog.map(({ outputId }) => outputId))
      .toEqual(expect.arrayContaining([
        ET,
        "hemodynamics.pressure.absolute.Ao",
        MEAN_AV_GRADIENT,
        PEAK_AV_GRADIENT,
        MAX_DPDT,
        MIN_DPDT,
        "myocardium.energy.potential.LV-pressure-volume-area",
        "myocardium.energy.pressure-volume-area.LV",
      ]));
    expect(kernel.primitiveControlCatalog).toEqual(
      MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1,
    );
    expect(kernel.primitiveControlCatalog).toHaveLength(52);
    expect(roundedSurfaceV1.controlCatalog.map(({ controlId }) => controlId))
      .toEqual(kernel.primitiveControlCatalog.map(({ controlId }) => controlId));
    expect(kernel.primitiveControlCatalog.some(({ controlId }) =>
      controlId.startsWith("myocardium.calcium-decay-time-scale."),
    )).toBe(false);
  });

  it("applies and projects every admitted non-calcium controller", () => {
    for (const definition of
      MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_CONTROL_CATALOG_V1) {
      const candidate = definition.defaultValue + definition.step
        <= definition.maximum
        ? definition.defaultValue + definition.step
        : definition.defaultValue - definition.step;
      const fixture = applyMainWireIntegratedStudioRoundedEjectionControlV1(
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
        definition.controlId,
        candidate,
      );
      const projected = mainWireIntegratedStudioFixtureProjectionV3
        .controlValue(fixture, definition.controlId);
      expect(projected, definition.controlId).toEqual({
        status: "value",
        value: candidate,
      });
      expect(
        reduceMainWireIntegratedStudioRoundedEjectionControlV1(
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
          definition.controlId,
          definition.defaultValue,
        ).changes.length,
        definition.controlId,
      ).toBeGreaterThan(0);
    }
  });

  it("starts the canonical baseline from its qualified settled checkpoint", async () => {
    const release =
      createMainWireIntegratedStudioRoundedEjectionSettledReleaseV1();
    const runtimeSessionId = "standard68/settled-default";
    const scenarioId = "baseline";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId,
      scenarios: [{
        scenarioId,
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
      }],
    });
    try {
      const frame = release.executables.simulationAdapter.currentFrame({
        runtimeSessionId,
        scenarioId,
      });
      expect(frame.acceptedTimeSec).toBe(134);
      expect(frame.acceptedRevision).toBe(67_036);
      expect(frame.outputs[ET]?.value).toBeCloseTo(0.252, 8);
      const changed = await release.executables.simulationAdapter.applyControl({
        runtimeSessionId,
        scenarioId,
        controlId: "hemodynamics.systemic-resistance",
        value: 1.01,
        expectedInputEpoch: frame.inputEpoch,
      });
      expect(changed.inputEpoch).toBe(frame.inputEpoch + 1);
      expect(changed.acceptedTimeSec).toBe(frame.acceptedTimeSec);
      expect(changed.acceptedRevision).toBe(frame.acceptedRevision);
    } finally {
      release.executables.simulationAdapter.disposeSession(runtimeSessionId);
    }
  });

  it("reports normal-range ET, hydraulic AV gradients, and LV dP/dt after settlement", async () => {
    const release = createMainWireIntegratedStudioRoundedEjectionReleaseV1();
    const runtimeSessionId = "standard68/metrics";
    const scenarioId = "baseline";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId,
      scenarios: [{
        scenarioId,
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
      }],
    });
    try {
      const frame = await advanceToV1(
        release,
        runtimeSessionId,
        scenarioId,
        12,
      );
      const value = (outputId: string) => frame.outputs[outputId]?.value;
      expect(value(ET)).toBeGreaterThanOrEqual(0.24);
      expect(value(ET)).toBeLessThanOrEqual(0.28);
      expect(value(MEAN_AV_GRADIENT)).toBeGreaterThanOrEqual(3);
      expect(value(MEAN_AV_GRADIENT)).toBeLessThanOrEqual(6);
      expect(value(PEAK_AV_GRADIENT)).toBeGreaterThanOrEqual(6);
      expect(value(PEAK_AV_GRADIENT)).toBeLessThanOrEqual(11);
      expect(value(MAX_DPDT)).toBeGreaterThanOrEqual(1_500);
      expect(value(MAX_DPDT)).toBeLessThanOrEqual(2_500);
      expect(value(MIN_DPDT)).toBeLessThanOrEqual(-790);
      expect(value(MIN_DPDT)).toBeGreaterThanOrEqual(-1_400);
    } finally {
      release.executables.simulationAdapter.disposeSession(runtimeSessionId);
    }
  }, 120_000);

  it("retains complete formal PV loops after production-artifact checkpoint restore", async () => {
    const artifactModule = await import(
      /* @vite-ignore */
      new URL(
        "../studio/integrations/mainWireIntegratedV3/" +
          "MainWireIntegratedStudioRoundedEjectionExactModelV1.artifact.mjs",
        import.meta.url,
      ).href
    );
    const release = artifactModule.createCircleHeartExactModelReleaseV1() as
      ReturnType<typeof createMainWireIntegratedStudioRoundedEjectionReleaseV1>;
    const model = exactContractV1();
    const sourceRuntimeSessionId = "standard68/formal-pv/source";
    const restoredRuntimeSessionId = "standard68/formal-pv/restored";
    const scenarioId = "baseline";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId: sourceRuntimeSessionId,
      scenarios: [{
        scenarioId,
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
      }],
    });
    try {
      const source = await advanceToV1(
        release,
        sourceRuntimeSessionId,
        scenarioId,
        4,
      );
      const captured = await release.executables.experimentCapture
        .captureAcceptedCandidate({
          experimentId: "standard68-formal-pv",
          model,
          desiredContent: {
            modelId: MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
            surfaceSeriesId: roundedSurfaceV1.surfaceSeriesId,
            scenarios: [{
              scenarioId,
              label: "Baseline",
              fixture:
                MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
            }],
            surface: emptySurfaceV1(),
          },
          correlation: {
            runtimeSessionId: sourceRuntimeSessionId,
            scenarios: [{ scenarioId, expectedInputEpoch: source.inputEpoch }],
          },
        });
      const capture = captured.content.scenarios[0]!.capture;
      expect(capture.checkpoint.payload).toMatchObject({
        checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_CHECKPOINT_V1_ID,
      });
      await release.executables.simulationAdapter.createSession({
        runtimeSessionId: restoredRuntimeSessionId,
        scenarios: [{ scenarioId, fixture: capture.fixture, checkpoint: capture.checkpoint }],
      });
      const restored = release.executables.simulationAdapter.currentFrame({
        runtimeSessionId: restoredRuntimeSessionId,
        scenarioId,
      });
      const analysis = await release.executables.simulationAdapter.requestAnalysis({
        runtimeSessionId: restoredRuntimeSessionId,
        scenarioId,
        analysisId:
          MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
        expectedInputEpoch: restored.inputEpoch,
        expectedAcceptedRevision: restored.acceptedRevision,
        expectedAcceptedTimeSec: restored.acceptedTimeSec,
        analysisPartition:
          MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
      });
      const payload = analysis.payload as unknown as Readonly<{
        left: Readonly<{
          starlingLocus: Readonly<{
            status: string;
            points: readonly Readonly<{
              ventricularPressureVolumeLoop: readonly unknown[];
            }>[];
          }>;
        }>;
      }>;
      expect(payload.left.starlingLocus.status).toBe(
        "measured-fixed-tbv-protocol",
      );
      expect(payload.left.starlingLocus.points.length).toBeGreaterThanOrEqual(4);
      expect(payload.left.starlingLocus.points.every(
        ({ ventricularPressureVolumeLoop }) =>
          ventricularPressureVolumeLoop.length >= 12,
      )).toBe(true);
    } finally {
      release.executables.simulationAdapter.disposeSession(sourceRuntimeSessionId);
      release.executables.simulationAdapter.disposeSession(restoredRuntimeSessionId);
    }
  }, 240_000);
});

async function advanceToV1(
  release: ReturnType<typeof createMainWireIntegratedStudioRoundedEjectionReleaseV1>,
  runtimeSessionId: string,
  scenarioId: string,
  targetTimeSec: number,
) {
  let frame = release.executables.simulationAdapter.currentFrame({
    runtimeSessionId,
    scenarioId,
  });
  while (frame.acceptedTimeSec < targetTimeSec - 1e-12) {
    const stepCount = Math.min(
      256,
      Math.ceil((targetTimeSec - frame.acceptedTimeSec) / 0.002),
    );
    const batch = await release.executables.simulationAdapter
      .advancePresentationBatch!({
        runtimeSessionId,
        scenarioId,
        stepCount,
        presentationOutputIds: ["rhythm.phase.regular-sinus"],
      });
    frame = batch.terminalFrame;
  }
  return frame;
}

function exactContractV1(): ModelContractV2 {
  const kernel = createMainWireIntegratedStudioRoundedEjectionKernelV1();
  return Object.freeze({
    modelId: kernel.modelId,
    modelFamilyId: kernel.modelFamilyId,
    displayName: "Main Wire Standard 68",
    fixtureSchemaId: kernel.fixtureSchema.fixtureSchemaId,
    checkpointCodecId: kernel.checkpointCodec.checkpointCodecId,
    snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
    controlCatalog: kernel.primitiveControlCatalog,
    outputCatalog: Object.freeze([
      ...kernel.primitiveSignalCatalog,
      ...kernel.modelMetricCatalog,
    ]),
    graphCatalog: Object.freeze([]),
  });
}

function emptySurfaceV1() {
  return Object.freeze({
    graphPanes: Object.freeze([]),
    outputPanes: Object.freeze([]),
    controlPanes: Object.freeze([]),
    note: Object.freeze({ text: "" }),
  });
}
