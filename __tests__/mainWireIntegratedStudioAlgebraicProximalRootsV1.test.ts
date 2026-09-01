import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_CHECKPOINT_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedModelStandard67CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_TYPED_AUTHORITY_SESSION_V1_ID,
} from "@/engine/vnext/MainWireIntegratedModelStandard67TypedAuthoritySessionV1";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import {
  STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
} from "@/studio/contracts/v2/modelSurface";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_CHECKPOINT_CODEC_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  createMainWireIntegratedStudioAlgebraicProximalRootsKernelV1,
  createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1,
  createMainWireIntegratedStudioSelectedAorticOutflowKernelV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";

const PROXIMAL_PRESSURE =
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port";

describe("algebraic proximal-roots Standard67 Studio exact adapter V1", () => {
  it("binds the new numerical identity while preserving the exact output meanings", () => {
    const standard66 =
      createMainWireIntegratedStudioSelectedAorticOutflowKernelV1();
    const standard67 =
      createMainWireIntegratedStudioAlgebraicProximalRootsKernelV1();

    expect(standard66.modelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
    );
    expect(standard67).toMatchObject({
      modelId:
        MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
      equations: {
        fixtureId:
          MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID,
        proximalArterialRootsProfileId:
          "main-wire-algebraic-proximal-arterial-roots-profile-v1",
      },
      runtime: {
        numericalSessionId:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_TYPED_AUTHORITY_SESSION_V1_ID,
      },
      checkpointCodec: {
        checkpointCodecId:
          MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_CHECKPOINT_CODEC_ID_V1,
        definition: {
          checkpointId:
            MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_CHECKPOINT_V1_ID,
        },
      },
    });
    expect(standard66.equations).not.toHaveProperty(
      "proximalArterialRootsProfileId",
    );
    expect(new Set([
      ...standard67.primitiveSignalCatalog,
      ...standard67.modelMetricCatalog,
    ].map(({ outputId }) => outputId))).toEqual(
      new Set(MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1),
    );
  });

  it("captures, restores, and continues the Standard67 owner exactly", async () => {
    const release =
      createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1();
    const model = exactContractV1();
    const scenarioId = "baseline";
    const sourceSessionId = "standard67/source";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId: sourceSessionId,
      scenarios: [{
        scenarioId,
        fixture:
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
      }],
    });
    const sourceFrame =
      await release.executables.simulationAdapter.advanceOnePresentationStep({
        runtimeSessionId: sourceSessionId,
        scenarioId,
      });
    expect(sourceFrame).toMatchObject({
      modelId:
        MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
      acceptedRevision: 1,
      acceptedTimeSec: 0.002,
    });
    expect(sourceFrame.outputs[PROXIMAL_PRESSURE]).toMatchObject({
      availability: "available",
    });

    const captured = await release.executables.experimentCapture
      .captureAcceptedCandidate({
        experimentId: "standard67-experiment",
        model,
        desiredContent: {
          modelId:
            MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
          surfaceSeriesId: "standard67-surface-series",
          scenarios: [{
            scenarioId,
            label: "Baseline",
            fixture:
              MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
          }],
          surface: emptySurfaceV1(),
        },
        correlation: {
          runtimeSessionId: sourceSessionId,
          scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
        },
      });
    const capture = captured.content.scenarios[0]!.capture;
    expect(capture.checkpoint.payload).toMatchObject({
      checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD67_CHECKPOINT_V1_ID,
      selectedModelIdentity: {
        fixtureId:
          MAIN_WIRE_INTEGRATED_MODEL_ALGEBRAIC_PROXIMAL_ROOTS_FIXTURE_V1_ID,
        algebraicProximalArterialRootsProfileId:
          "main-wire-algebraic-proximal-arterial-roots-profile-v1",
      },
      algebraicProximalArterialRootsProfileIdentitySha256:
        expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    await expect(release.executables.captureAdapter.validateCapture({
      model,
      capture,
    })).resolves.toBeUndefined();

    const restoredSessionId = "standard67/restored";
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId: restoredSessionId,
      scenarios: [{
        scenarioId,
        fixture: capture.fixture,
        checkpoint: capture.checkpoint,
      }],
    });
    expect(release.executables.simulationAdapter.currentFrame({
      runtimeSessionId: restoredSessionId,
      scenarioId,
    })).toMatchObject({
      acceptedRevision: 1,
      acceptedTimeSec: 0.002,
    });

    const uninterrupted =
      await release.executables.simulationAdapter.advanceOnePresentationStep({
        runtimeSessionId: sourceSessionId,
        scenarioId,
      });
    const continued =
      await release.executables.simulationAdapter.advanceOnePresentationStep({
        runtimeSessionId: restoredSessionId,
        scenarioId,
      });
    expect(continued.acceptedRevision).toBe(uninterrupted.acceptedRevision);
    expect(continued.acceptedTimeSec).toBe(uninterrupted.acceptedTimeSec);
    expect(continued.inputEpoch).toBe(uninterrupted.inputEpoch);
    expect(continued.outputs).toEqual(uninterrupted.outputs);
  }, 120_000);
});

function exactContractV1(): ModelContractV2 {
  const kernel =
    createMainWireIntegratedStudioAlgebraicProximalRootsKernelV1();
  return Object.freeze({
    modelId: kernel.modelId,
    modelFamilyId: kernel.modelFamilyId,
    displayName: "Main Wire Standard 67",
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
