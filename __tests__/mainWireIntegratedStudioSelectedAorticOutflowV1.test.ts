import { describe, expect, it, vi } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputKeyV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
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
const LAD_FOCAL_PRESSURE_LOSS = "coronary.pressure-loss.focal.LAD";

describe("selected-aortic-outflow Standard66 Studio exact adapter V1", () => {
  it("declares the selected identity, HR-only cold-restart control, and all 176 exact outputs", () => {
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
    ).toBe(176);
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
    expect(Object.keys(cold.outputs)).toHaveLength(176);
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

  it("emits portable positive zero in frames and presentation batches", async () => {
    const host =
      new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1();
    await host.createSession("selected-portable-runtime", [{
      scenarioId: "baseline",
      fixture:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
    }]);
    const coldFrame = host.currentFrame(
      "selected-portable-runtime",
      "baseline",
    );
    expect(Object.values(coldFrame.outputs).some((output) =>
      Object.is(output.value, -0))).toBe(false);

    const batch = host.advancePresentationBatch(
      "selected-portable-runtime",
      "baseline",
      1,
      [LAD_FOCAL_PRESSURE_LOSS],
    );

    expect(batch.outputValues[0]).toBe(0);
    expect(Object.is(batch.outputValues[0], -0)).toBe(false);
    expect(batch.terminalFrame.outputs[LAD_FOCAL_PRESSURE_LOSS]).toMatchObject({
      value: 0,
      availability: "available",
    });
    expect(Object.is(
      batch.terminalFrame.outputs[LAD_FOCAL_PRESSURE_LOSS]!.value,
      -0,
    )).toBe(false);
    expect(Object.values(batch.terminalFrame.outputs).some((output) =>
      Object.is(output.value, -0))).toBe(false);
  }, 120_000);

  it("keeps complete-fixture validation and execution consistent over a deterministic hemodynamic covering matrix", async () => {
    const release =
      createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1();
    const host =
      new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1();
    const cases = selectedHemodynamicConstructibilityCasesV1();
    const admittedCaseIds: string[] = [];
    const rejectedCaseIds: string[] = [];

    expect(cases.map(({ caseId }) => caseId)).toHaveLength(
      new Set(cases.map(({ caseId }) => caseId)).size,
    );
    for (const { caseId, inputs } of cases) {
      const fixture = Object.freeze({
        ...MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
        hemodynamicResearchInputs: inputs,
      });
      const runtimeSessionId = `selected-constructibility/${caseId}`;
      const scenarioId = "scenario";

      let validationError: unknown;
      try {
        release.executables.fixtureAdapter.validateCompleteFixture({
          context: Object.freeze({
            scenarioId,
            modelId:
              MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
          }),
          fixture,
        });
      } catch (error) {
        validationError = error;
      }
      if (validationError !== undefined) {
        expect(validationError, caseId).toBeInstanceOf(Error);
        expect((validationError as Error).message, caseId)
          .toMatch(/exceeds SV\/VC PV-law support/);
        expect(inputs.venousTone, caseId).toBe(1);
        expect(inputs.totalBloodVolumeMl, caseId).toBe(7_000);
        await expect(
          host.createSession(runtimeSessionId, [{ scenarioId, fixture }]),
          caseId,
        ).rejects.toThrow(/exceeds SV\/VC PV-law support/);
        rejectedCaseIds.push(caseId);
        continue;
      }
      try {
        await host.createSession(runtimeSessionId, [{ scenarioId, fixture }]);
      } catch (error) {
        throw new Error(
          `constructibility case ${caseId} failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { cause: error },
        );
      }
      expect(
        host.advanceOnePresentationStep(runtimeSessionId, scenarioId),
        caseId,
      ).toMatchObject({
        acceptedRevision: expect.any(Number),
        acceptedTimeSec: 0.002,
      });
      host.closeSession(runtimeSessionId);
      admittedCaseIds.push(caseId);
    }
    expect(admittedCaseIds).toHaveLength(7);
    expect(rejectedCaseIds).toEqual([
      "pairwise-endpoint-row-2",
      "pairwise-endpoint-row-5",
      "all-maximum",
    ]);
  }, 120_000);

  it("preflights mechanism inputs through the exact cold constructor", async () => {
    const release =
      createMainWireIntegratedStudioSelectedAorticOutflowReleaseV1();
    const defaultFixture =
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1;
    const unsupportedFixture = Object.freeze({
      ...defaultFixture,
      mechanismResearchInputs: Object.freeze({
        ...defaultFixture.mechanismResearchInputs,
        pericardium: Object.freeze({
          ...defaultFixture.mechanismResearchInputs.pericardium,
          prescribedFluidVolumeMl: 500,
        }),
      }),
    });
    const context = Object.freeze({
      scenarioId: "scenario/pericardial-cold-construction",
      modelId:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
    });

    expect(() => release.executables.fixtureAdapter.validateCompleteFixture({
      context,
      fixture: unsupportedFixture,
    })).toThrow(/pressure-ladder initialization requires Ao pressure above RA/);
    await expect(release.executables.simulationAdapter.createSession({
      runtimeSessionId: "selected-pericardial-cold-construction",
      scenarios: Object.freeze([Object.freeze({
        scenarioId: context.scenarioId,
        fixture: unsupportedFixture,
      })]),
    })).rejects.toThrow(
      /pressure-ladder initialization requires Ao pressure above RA/,
    );

    const admittedFixture = Object.freeze({
      ...unsupportedFixture,
      mechanismResearchInputs: Object.freeze({
        ...unsupportedFixture.mechanismResearchInputs,
        pericardium: Object.freeze({
          ...unsupportedFixture.mechanismResearchInputs.pericardium,
          prescribedFluidVolumeMl: 220,
        }),
      }),
    });
    expect(() => release.executables.fixtureAdapter.validateCompleteFixture({
      context,
      fixture: admittedFixture,
    })).not.toThrow();
  });

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

function selectedHemodynamicConstructibilityCasesV1(): readonly Readonly<{
  caseId: string;
  inputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
}>[] {
  const defaults =
    MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3;
  const keys = MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3;
  const cases: Array<Readonly<{
    caseId: string;
    inputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
  }>> = [Object.freeze({ caseId: "default", inputs: defaults })];

  // The seven nonzero 3-bit columns form an orthogonal strength-2 endpoint
  // array over eight rows: every pair of axes visits all four endpoint pairs
  // exactly twice without expanding to the full 2^7 Cartesian product.
  for (let row = 0; row < 8; row += 1) {
    cases.push(endpointPatternCaseV1(
      `pairwise-endpoint-row-${row}`,
      (_key, index) => bitParityV1(row & (index + 1)) === 0
        ? "minimum"
        : "maximum",
    ));
  }
  if (keys.length !== 7) {
    throw new Error("constructibility endpoint array requires seven axes");
  }
  cases.push(endpointPatternCaseV1("all-maximum", () => "maximum"));
  return Object.freeze(cases);
}

function endpointPatternCaseV1(
  caseId: string,
  endpointAt: (
    key: MainWireIntegratedModelHemodynamicResearchInputKeyV3,
    index: number,
  ) => "minimum" | "maximum",
) {
  const entries = MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3
    .map((key, index) => {
      const endpoint = endpointAt(key, index);
      return [
        key,
        MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3[key][endpoint],
      ] as const;
    });
  return Object.freeze({
    caseId,
    inputs: Object.freeze(Object.fromEntries(entries)) as
      MainWireIntegratedModelHemodynamicResearchInputsV3,
  });
}

function bitParityV1(value: number): 0 | 1 {
  let parity: 0 | 1 = 0;
  for (let remaining = value; remaining > 0; remaining >>= 1) {
    parity = (parity ^ (remaining & 1)) as 0 | 1;
  }
  return parity;
}
