import { describe, expect, it, vi } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MainWireIntegratedModelStandard66TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard66TypedAuthoritySessionV1";
import { assertModelContractV2, type ModelContractV2 } from "@/studio/contracts/v2/model";
import { STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1 } from "@/studio/contracts/v2/modelSurface";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CHECKPOINT_CODEC_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
  MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1,
  createMainWireIntegratedStudioSelectedAorticOutflowKernelV1,
  createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import {
  createCircleHeartExactModelReleaseV1 as createSelectedArtifactReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.entry";

const PROXIMAL_PRESSURE =
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port";

describe("selected-aortic-outflow Standard66 Studio exact adapter V1", () => {
  it("declares the selected identity, HR-only cold-restart control, and all 185 exact outputs", () => {
    const kernel =
      createMainWireIntegratedStudioSelectedAorticOutflowKernelV1();

    expect(kernel).toMatchObject({
      modelId:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
      fixtureSchema: {
        fixtureSchemaId:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_FIXTURE_SCHEMA_ID_V1,
      },
      checkpointCodec: {
        checkpointCodecId:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CHECKPOINT_CODEC_ID_V1,
        definition: {
          checkpointId:
            "circleheart.main-wire-integrated-model-standard66-exact-checkpoint.v1",
          schemaVersion: 1,
        },
      },
      runtime: {
        fixtureChangeSemantics:
          "atomic-cold-restart-at-zero-clock-new-fixture-epoch",
      },
    });
    expect(kernel.primitiveControlCatalog).toEqual([
      expect.objectContaining({
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
            .heartRateBpm,
        changeSemantics: "cold-restart",
      }),
    ]);
    expect(new Set([
      ...kernel.primitiveSignalCatalog,
      ...kernel.modelMetricCatalog,
    ].map(({ outputId }) => outputId))).toEqual(
      new Set(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1),
    );
    expect(
      kernel.primitiveSignalCatalog.length + kernel.modelMetricCatalog.length,
    ).toBe(185);
    expect(kernel.capabilities.some((capability) =>
      capability.startsWith("analysis/"))).toBe(false);
    expect(createSelectedArtifactReleaseV1().manifest.modelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
    );

    const contract = exactContractV1();
    expect(() => assertModelContractV2(contract)).not.toThrow();
  });

  it("cold-restarts HR atomically and retains the prior owner when replacement construction fails", async () => {
    const host =
      new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1();
    await host.createSession("selected-runtime", [{
      scenarioId: "baseline",
      fixture:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
    }]);

    const cold = host.currentFrame("selected-runtime", "baseline");
    expect(cold).toMatchObject({
      modelId:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
      inputEpoch: 0,
      acceptedRevision: 0,
      acceptedTimeSec: 0,
    });
    expect(Object.keys(cold.outputs)).toHaveLength(185);
    expect(cold.outputs[PROXIMAL_PRESSURE]).toMatchObject({
      value: null,
      availability: "not-evaluated-at-accepted-state",
    });

    const advanced = host.advanceOnePresentationStep(
      "selected-runtime",
      "baseline",
    );
    expect(advanced.acceptedTimeSec).toBe(0.002);
    expect(advanced.outputs[PROXIMAL_PRESSURE]).toMatchObject({
      availability: "available",
    });

    const baseFixture =
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1;
    const incompatible = {
      ...baseFixture,
      mechanismResearchInputs: {
        ...baseFixture.mechanismResearchInputs,
        chamberMechanics: {
          ...baseFixture.mechanismResearchInputs.chamberMechanics,
          calciumDecayTimeScaleByWall: {
            ...baseFixture.mechanismResearchInputs.chamberMechanics
              .calciumDecayTimeScaleByWall,
            LVFW: 1.01,
          },
        },
      },
    };
    await expect(host.replaceFixture(
      "selected-runtime",
      "baseline",
      incompatible,
    )).rejects.toThrow(/requires unit calcium decay-time/);
    expect(host.currentInputEpoch("selected-runtime", "baseline")).toBe(0);
    expect(host.currentFrame("selected-runtime", "baseline")).toEqual(
      advanced,
    );

    const createSpy = vi.spyOn(
      MainWireIntegratedModelStandard66TypedAuthoritySessionV1,
      "create",
    ).mockRejectedValueOnce(new Error("synthetic replacement failure"));
    try {
      await expect(host.applyControl(
        "selected-runtime",
        "baseline",
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
          .heartRateBpm,
        61,
        0,
      )).rejects.toThrow(/synthetic replacement failure/);
    } finally {
      createSpy.mockRestore();
    }
    expect(host.currentInputEpoch("selected-runtime", "baseline")).toBe(0);
    expect(host.currentFrame("selected-runtime", "baseline")).toEqual(
      advanced,
    );

    const restarted = await host.applyControl(
      "selected-runtime",
      "baseline",
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
        .heartRateBpm,
      61,
      0,
    );
    expect(restarted).toMatchObject({
      inputEpoch: 1,
      acceptedRevision: 0,
      acceptedTimeSec: 0,
    });
    expect(restarted.outputs[PROXIMAL_PRESSURE]).toMatchObject({
      value: null,
      availability: "not-evaluated-at-accepted-state",
    });
    expect(host.advanceOnePresentationStep("selected-runtime", "baseline"))
      .toMatchObject({ inputEpoch: 1, acceptedTimeSec: 0.002 });
    await expect(host.applyControl(
      "selected-runtime",
      "baseline",
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
        .heartRateBpm,
      62,
      0,
    )).rejects.toThrow(/input epoch is stale/);
  }, 120_000);

  it("captures and restores the named Standard66 object checkpoint without persisting the 76-f64 readback", async () => {
    const release =
      createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1();
    const model = exactContractV1();
    const runtimeSessionId = "selected-capture-runtime";
    const scenarioId = "baseline";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId,
      scenarios: [{
        scenarioId,
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
      }],
    });
    await release.executables.simulationAdapter.advanceOnePresentationStep({
      runtimeSessionId,
      scenarioId,
    });

    const captured = await release.executables.experimentCapture
      .captureAcceptedCandidate({
        experimentId: "selected-experiment",
        model,
        desiredContent: {
          modelId:
            MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
          surfaceSeriesId: "selected-surface-series",
          scenarios: [{
            scenarioId,
            label: "Baseline",
            fixture:
              MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
          }],
          surface: emptySurfaceV1(),
        },
        correlation: {
          runtimeSessionId,
          scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
        },
      });
    const capture = captured.content.scenarios[0]!.capture;
    expect(capture.checkpoint).toMatchObject({
      acceptedRevision: 1,
      acceptedTimeSec: 0.002,
      payload: {
        checkpointId:
          "circleheart.main-wire-integrated-model-standard66-exact-checkpoint.v1",
        schemaVersion: 1,
      },
    });
    expect(JSON.stringify(capture.checkpoint.payload)).not.toContain(
      "acceptedNumericalReadback",
    );
    await expect(release.executables.captureAdapter.validateCapture({
      model,
      capture,
    })).resolves.toBeUndefined();
    await expect(release.executables.snapshotGate.admitFrozenCandidate({
      model,
      content: Object.freeze({
        ...captured.content,
        surfaceSeriesId: "selected-surface-series",
      }),
    })).resolves.toEqual({ status: "passed" });

    const restoredHost =
      new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1();
    await restoredHost.createSession("selected-restored-runtime", [{
      scenarioId,
      fixture: capture.fixture,
      checkpoint: capture.checkpoint,
    }]);
    const restored = restoredHost.currentFrame(
      "selected-restored-runtime",
      scenarioId,
    );
    expect(restored).toMatchObject({
      acceptedRevision: 1,
      acceptedTimeSec: 0.002,
    });
    expect(restored.outputs[PROXIMAL_PRESSURE]).toMatchObject({
      value: null,
      availability: "not-evaluated-at-accepted-state",
    });
    expect(restoredHost.advanceOnePresentationStep(
      "selected-restored-runtime",
      scenarioId,
    ).outputs[PROXIMAL_PRESSURE]).toMatchObject({
      availability: "available",
    });
  }, 120_000);
});

function exactContractV1(): ModelContractV2 {
  const kernel =
    createMainWireIntegratedStudioSelectedAorticOutflowKernelV1();
  return Object.freeze({
    modelId: kernel.modelId,
    modelFamilyId: kernel.modelFamilyId,
    displayName: "Selected aortic outflow Standard 66",
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
