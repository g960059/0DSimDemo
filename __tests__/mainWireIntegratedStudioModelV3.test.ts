import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  type MainWireIntegratedModelHemodynamicResearchInputKeyV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_SESSION_V3_ID,
  MainWireIntegratedModelSessionV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  createStudioDefaultClientCompositionV2,
  createStudioDefaultWorkerCompositionV2,
  DEFAULT_STUDIO_MODEL_ID_V2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type {
  ExperimentSurfaceV2,
} from "@/studio/contracts/v2/content";
import {
  InMemoryRegisteredModelStoreV2,
} from "@/studio/infrastructure/model/InMemoryRegisteredModelStoreV2";
import {
  DynamicExactModelRuntimeLoaderV2,
} from "@/studio/infrastructure/model/DynamicExactModelRuntimeLoaderV2";
import {
  STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/release";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_HOT_PATH_INTEGRITY_TIER_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
  MainWireIntegratedStudioRuntimeHostV3,
  createMainWireIntegratedStudioModelPackageV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3";
import mainWireIntegratedStudioExecutableArtifactV3 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs?raw";

const EMPTY_SURFACE_V2: ExperimentSurfaceV2 = Object.freeze({
  graphPanes: Object.freeze([]),
  outputPanes: Object.freeze([]),
  controlPanes: Object.freeze([]),
  note: Object.freeze({ text: "" }),
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("registered Main Wire Integrated Studio Model V3", () => {
  it("retries the shared browser composition after a transient rejection", async () => {
    vi.resetModules();
    let attempts = 0;
    vi.doMock(
      "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs",
      async () => {
        const actual = await vi.importActual<typeof import(
          "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs"
        )>(
          "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs",
        );
        return {
          ...actual,
          createMainWireIntegratedStudioModelPackageV3() {
            attempts += 1;
            if (attempts === 1) {
              throw new Error("transient artifact delivery failure");
            }
            return actual.createMainWireIntegratedStudioModelPackageV3();
          },
        };
      },
    );

    try {
      const composition = await import(
        "@/studio/composition/StudioDefaultCompositionV2"
      );
      const first = composition.loadStudioDefaultClientCompositionV2();
      expect(composition.loadStudioDefaultClientCompositionV2()).toBe(first);
      await expect(first).rejects.toThrow(/transient artifact delivery/);

      const second = composition.loadStudioDefaultClientCompositionV2();
      expect(second).not.toBe(first);
      expect(composition.loadStudioDefaultClientCompositionV2()).toBe(second);
      await expect(second).resolves.toMatchObject({
        defaultModelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      });
      expect(attempts).toBe(2);
    } finally {
      vi.doUnmock(
        "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs",
      );
      vi.resetModules();
    }
  });

  it("makes the exact V3 release the content-free default without client hashing", async () => {
    vi.stubGlobal("crypto", undefined);

    const composition = await createStudioDefaultClientCompositionV2();

    expect(composition.defaultModelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    );
    expect(DEFAULT_STUDIO_MODEL_ID_V2).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    );
    expect(composition.contract.modelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    );
    expect(composition.defaultFixture).toEqual(
      MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
    );
    expect(Object.keys(composition).sort()).toEqual([
      "analysisExecutionPlan",
      "contract",
      "defaultFixture",
      "defaultModelId",
    ]);
    expect("authoring" in composition).toBe(false);
    expect("runtime" in composition).toBe(false);
  });

  it("materializes only the exact executable artifact at registry admission", async () => {
    const modelPackage = createMainWireIntegratedStudioModelPackageV3();
    expect(modelPackage.manifest.runtime).toMatchObject({
      hotPathIntegrityTier:
        MAIN_WIRE_INTEGRATED_STUDIO_HOT_PATH_INTEGRITY_TIER_V3,
    });
    expect(() => modelPackage.createRegistryAdmission(new Uint8Array()))
      .toThrow(/nonempty exact build artifact bytes/);

    const registry = new InMemoryRegisteredModelStoreV2();
    await expect(registry.registerExactPackage(
      modelPackage.createRegistryAdmission(
        new Uint8Array([0x56, 0x33, 0x01]),
      ),
    )).rejects.toThrow(/artifact could not be evaluated/);
    expect(registry.modelCount).toBe(0);
    expect(registry.packageCount).toBe(0);

    const artifact = exactExecutableArtifactBytesV3();
    const admission = modelPackage.createRegistryAdmission(artifact);
    artifact[0] = 0;

    await expect(registry.registerExactPackage(admission)).resolves.toEqual(
      expect.objectContaining({
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      }),
    );
    expect(registry.resolveExactRuntime(
      MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    ).simulationAdapter.modelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
    );
  });

  it("loads the immutable development-36 artifact from a hash-free Worker ticket", async () => {
    const artifact = exactExecutableArtifactBytesV3();
    const modelPackage = createMainWireIntegratedStudioModelPackageV3();
    const fetchArtifact = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      async arrayBuffer() {
        return artifact.buffer.slice(
          artifact.byteOffset,
          artifact.byteOffset + artifact.byteLength,
        ) as ArrayBuffer;
      },
    });
    const loader = new DynamicExactModelRuntimeLoaderV2(fetchArtifact);
    const ticket = {
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: modelPackage.manifest.modelId,
      manifest: modelPackage.manifest,
      moduleAbi: "legacy-main-wire-v3-development-36",
      artifactUrl: "https://registry.example/model-releases/development-36.mjs",
    } as const;

    const first = loader.load(ticket);
    expect(loader.load(ticket)).toBe(first);
    await expect(first).resolves.toMatchObject({
      contract: { modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3 },
      simulationAdapter: {
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      },
    });
    expect(fetchArtifact).toHaveBeenCalledOnce();
    expect(fetchArtifact).toHaveBeenCalledWith(ticket.artifactUrl);
  });

  it("enforces the exact control lattice through the admitted simulation adapter", async () => {
    const composition = await createStudioDefaultWorkerCompositionV2();
    const simulation = composition.runtime.simulationAdapter;
    const runtimeSessionId = "session/v3-exact-control-lattice";
    const scenarioId = "scenario/exact-control-lattice";
    await simulation.createSession({
      runtimeSessionId,
      scenarios: [{ scenarioId, fixture: composition.defaultFixture }],
    });
    const cold = simulation.currentFrame({ runtimeSessionId, scenarioId });

    await expect(simulation.applyControl({
      runtimeSessionId,
      scenarioId,
      controlId:
        MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3.systemicResistance,
      value: 1.001,
      expectedInputEpoch: 0,
    })).rejects.toThrow(/step lattice/);
    expect(simulation.currentInputEpoch({ runtimeSessionId, scenarioId }))
      .toBe(0);
    expect(simulation.currentFrame({ runtimeSessionId, scenarioId }))
      .toEqual(cold);

    await expect(simulation.applyControl({
      runtimeSessionId,
      scenarioId,
      controlId:
        MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3.systemicResistance,
      value: 1.01,
      expectedInputEpoch: 0,
    })).resolves.toMatchObject({ inputEpoch: 1 });
    simulation.disposeSession(runtimeSessionId);
  });

  it("runs, captures, restores, and retires exact V3 runtime sessions", async () => {
    const composition = await createStudioDefaultWorkerCompositionV2();
    const model = composition.runtime.contract;
    const simulation = composition.runtime.simulationAdapter;
    const runtimeSessionId = "session/v3-live";
    const scenarioId = "scenario/baseline";

    await simulation.createSession({
      runtimeSessionId,
      scenarios: [{
        scenarioId,
        fixture: composition.defaultFixture,
      }],
    });

    const cold = simulation.currentFrame({ runtimeSessionId, scenarioId });
    expect(cold).toMatchObject({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      acceptedRevision: 0,
      acceptedTimeSec: 0,
      inputEpoch: 0,
    });
    expect(Object.keys(cold.outputs).sort()).toEqual(
      [...MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3].sort(),
    );

    let advanced = await simulation.advanceOnePresentationStep({
      runtimeSessionId,
      scenarioId,
    });
    expect(advanced.acceptedRevision).toBeGreaterThan(0);
    expect(advanced.acceptedTimeSec).toBe(0.002);
    for (const output of Object.values(advanced.outputs)) {
      if (output.value !== null) {
        expect(
          typeof output.value === "number"
            ? Number.isFinite(output.value)
            : output.value.every(Number.isFinite),
        ).toBe(true);
      }
    }
    for (let ordinal = 2; ordinal <= 500; ordinal += 1) {
      advanced = await simulation.advanceOnePresentationStep({
        runtimeSessionId,
        scenarioId,
      });
    }
    expect(advanced.acceptedTimeSec).toBe(1);

    await expect(simulation.replaceFixture({
      runtimeSessionId,
      scenarioId,
      fixture: composition.defaultFixture,
    })).resolves.toBe(1);
    expect(simulation.currentInputEpoch({ runtimeSessionId, scenarioId }))
      .toBe(1);
    const warmStartedFrame = simulation.currentFrame({
      runtimeSessionId,
      scenarioId,
    });
    expect(warmStartedFrame).toMatchObject({
      acceptedRevision: advanced.acceptedRevision,
      acceptedTimeSec: advanced.acceptedTimeSec,
      inputEpoch: 1,
    });
    advanced = await simulation.advanceOnePresentationStep({
      runtimeSessionId,
      scenarioId,
    });

    const captured = await composition.runtime.experimentCapture
      .captureAcceptedCandidate({
      experimentId: "experiment/v3-live",
      model,
      desiredContent: {
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
        scenarios: [{
          scenarioId,
          label: "Baseline",
          fixture: composition.defaultFixture,
        }],
        surface: EMPTY_SURFACE_V2,
      },
      correlation: {
        runtimeSessionId,
        scenarios: [{ scenarioId, expectedInputEpoch: 1 }],
      },
      });
    const checkpoint = captured.content.scenarios[0]!.capture.checkpoint;
    expect(checkpoint.acceptedRevision).toBe(advanced.acceptedRevision);
    expect(checkpoint.acceptedTimeSec).toBe(advanced.acceptedTimeSec);

    const admissionResult = await composition.runtime.snapshotGate
      .admitFrozenCandidate({
        model,
        content: captured.content,
      });
    expect(admissionResult.status).toBe("passed");
    expect(captured.content.scenarios[0]!.capture.checkpoint)
      .toEqual(checkpoint);

    simulation.disposeSession(runtimeSessionId);
    await expect(simulation.createSession({
      runtimeSessionId,
      scenarios: [{ scenarioId, fixture: composition.defaultFixture }],
    })).rejects.toThrow(/active or retired/);

    const restoredSessionId = "session/v3-restored";
    await simulation.createSession({
      runtimeSessionId: restoredSessionId,
      scenarios: [{
        scenarioId,
        fixture: composition.defaultFixture,
        checkpoint,
      }],
    });
    expect(simulation.currentFrame({
      runtimeSessionId: restoredSessionId,
      scenarioId,
    })).toMatchObject({
      acceptedRevision: checkpoint.acceptedRevision,
      acceptedTimeSec: checkpoint.acceptedTimeSec,
    });
    simulation.disposeSession(restoredSessionId);

    const tampered = JSON.parse(JSON.stringify(checkpoint));
    tampered.payload.checkpointSha256 = "0".repeat(64);
    await expect(simulation.createSession({
      runtimeSessionId: "session/v3-tampered",
      scenarios: [{
        scenarioId,
        fixture: composition.defaultFixture,
        checkpoint: tampered,
      }],
    })).rejects.toThrow(/checkpoint|SHA|hash|digest/i);
  }, 120_000);

  it("publishes one observation's clock and values even if accepted state moved", async () => {
    const composition = await createStudioDefaultWorkerCompositionV2();
    const simulation = composition.runtime.simulationAdapter;
    const runtimeSessionId = "session/v3-observation-clock";
    const scenarioId = "scenario/baseline";
    await simulation.createSession({
      runtimeSessionId,
      scenarios: [{ scenarioId, fixture: composition.defaultFixture }],
    });
    const clockSpy = vi.spyOn(
      MainWireIntegratedModelSessionV3.prototype,
      "currentAcceptedState",
    ).mockReturnValue({
      revision: 999,
      acceptedTimeSec: 999,
    } as ReturnType<MainWireIntegratedModelSessionV3["currentAcceptedState"]>);

    const frame = simulation.currentFrame({ runtimeSessionId, scenarioId });

    expect(frame.acceptedRevision).toBe(0);
    expect(frame.acceptedTimeSec).toBe(0);
    expect(clockSpy).not.toHaveBeenCalled();
    clockSpy.mockRestore();
    simulation.disposeSession(runtimeSessionId);
  });

  it("serves the V3 structural orientation on demand without mutating the session", async () => {
    const host = new MainWireIntegratedStudioRuntimeHostV3();
    const runtimeSessionId = "session/v3-side-analysis";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
    }]);
    const coldFrame = host.currentFrame(runtimeSessionId, scenarioId);
    const coldAnalysis = await host.requestAnalysis(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      coldFrame.inputEpoch,
      coldFrame.acceptedRevision,
      coldFrame.acceptedTimeSec,
      "hypovolemic",
    );
    expect(coldAnalysis).toMatchObject({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
      runtimeSessionId,
      scenarioId,
      inputEpoch: coldFrame.inputEpoch,
      sourceAcceptedRevision: coldFrame.acceptedRevision,
      sourceAcceptedTimeSec: coldFrame.acceptedTimeSec,
      analysisId:
        MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      payload: {
        status: "available",
        right: {
          curve: expect.any(Array),
          starlingLocus: {
            status: "responsive-fixed-tbv-preview",
            points: expect.arrayContaining([
              expect.objectContaining({ settled: false }),
            ]),
          },
        },
        left: {
          curve: expect.any(Array),
          starlingLocus: {
            status: "responsive-fixed-tbv-preview",
            points: expect.any(Array),
          },
        },
      },
    });
    expect(Object.isFrozen(coldAnalysis.payload)).toBe(true);
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(coldFrame);

    await expect(host.requestAnalysis(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      coldFrame.inputEpoch,
      coldFrame.acceptedRevision + 1,
      coldFrame.acceptedTimeSec,
    )).rejects.toThrow(/clocks are stale/);
    await expect(host.requestAnalysis(
      runtimeSessionId,
      scenarioId,
      "analysis/unknown",
      coldFrame.inputEpoch,
      coldFrame.acceptedRevision,
      coldFrame.acceptedTimeSec,
    )).rejects.toThrow(/not registered/);
    await expect(host.requestAnalysis(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      coldFrame.inputEpoch,
      coldFrame.acceptedRevision,
      coldFrame.acceptedTimeSec,
      "lateral",
    )).rejects.toThrow(/partition is not registered/);
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(coldFrame);
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("warm-starts controls atomically and changes actual V3 outputs", async () => {
    const host = new MainWireIntegratedStudioRuntimeHostV3();
    const runtimeSessionId = "session/v3-control-reset";
    const scenarioId = "scenario/research-input";
    await host.createSession(runtimeSessionId, [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
    }]);

    let baseline = host.currentFrame(runtimeSessionId, scenarioId);
    for (let ordinal = 1; ordinal <= 250; ordinal += 1) {
      baseline = host.advanceOnePresentationStep(runtimeSessionId, scenarioId);
    }
    const baselineAoPressure = baseline.outputs[
      "hemodynamics.pressure.absolute.Ao"
    ]!.value;
    expect(typeof baselineAoPressure).toBe("number");

    const warmed = await host.applyControl(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3.systemicResistance,
      1.1,
      0,
    );
    expect(warmed).toMatchObject({
      transition: "accepted-state-warm-start",
      inputEpoch: 1,
      frame: {
        inputEpoch: 1,
        acceptedRevision: baseline.acceptedRevision,
        acceptedTimeSec: baseline.acceptedTimeSec,
      },
    });
    expect(host.currentFixture(runtimeSessionId, scenarioId))
      .toMatchObject({
        hemodynamicResearchInputs: { systemicResistance: 1.1 },
      });

    let adjusted = warmed.frame;
    for (let ordinal = 1; ordinal <= 500; ordinal += 1) {
      adjusted = host.advanceOnePresentationStep(runtimeSessionId, scenarioId);
      for (const output of Object.values(adjusted.outputs)) {
        if (output.value !== null) {
          expect(typeof output.value === "number" && Number.isFinite(output.value))
            .toBe(true);
        }
      }
      if (ordinal === 250) {
        expect(adjusted.outputs[
          "hemodynamics.pressure.absolute.Ao"
        ]!.value).not.toBe(baselineAoPressure);
      }
    }
    expect(adjusted).toMatchObject({
      inputEpoch: 1,
      acceptedTimeSec: baseline.acceptedTimeSec + 1,
    });

    const beforeRejectedAction = host.currentFrame(
      runtimeSessionId,
      scenarioId,
    );
    await expect(host.applyControl(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3.venousTone,
      0.16,
      0,
    )).rejects.toThrow(/stale/);
    await expect(host.applyControl(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3.venousTone,
      5,
      1,
    )).rejects.toThrow(/within/);
    expect(host.currentInputEpoch(runtimeSessionId, scenarioId)).toBe(1);
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(
      beforeRejectedAction,
    );
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("warm-starts every control endpoint and emits finite accepted-step outputs", async () => {
    const host = new MainWireIntegratedStudioRuntimeHostV3();
    const inputKeys = Object.keys(
      MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3,
    ) as MainWireIntegratedModelHemodynamicResearchInputKeyV3[];
    const endpoints = inputKeys.flatMap((inputKey) => {
      const range =
        MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3[inputKey];
      return [range.minimum, range.maximum].map((value) => ({
        inputKey,
        controlId: MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3[inputKey],
        value,
      }));
    });

    for (const [index, endpoint] of endpoints.entries()) {
      const runtimeSessionId = `session/v3-endpoint-${index}`;
      const scenarioId = `scenario/${endpoint.inputKey}`;
      await host.createSession(runtimeSessionId, [{
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
      }]);

      let before = host.currentFrame(runtimeSessionId, scenarioId);
      for (let ordinal = 1; ordinal <= 50; ordinal += 1) {
        before = host.advanceOnePresentationStep(runtimeSessionId, scenarioId);
      }
      const warmed = await host.applyControl(
        runtimeSessionId,
        scenarioId,
        endpoint.controlId,
        endpoint.value,
        0,
      );
      expect(warmed).toMatchObject({
        transition: "accepted-state-warm-start",
        inputEpoch: 1,
        frame: {
          inputEpoch: 1,
          acceptedRevision: before.acceptedRevision,
          acceptedTimeSec: before.acceptedTimeSec,
        },
      });
      expect(host.currentInputEpoch(runtimeSessionId, scenarioId)).toBe(1);
      expect(
        host.currentFixture(runtimeSessionId, scenarioId)
          .hemodynamicResearchInputs[endpoint.inputKey],
      ).toBe(endpoint.value);
      expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(
        warmed.frame,
      );

      let frame = warmed.frame;
      for (let ordinal = 1; ordinal <= 50; ordinal += 1) {
        frame = host.advanceOnePresentationStep(
          runtimeSessionId,
          scenarioId,
        );
      }
      expect(frame).toMatchObject({
        inputEpoch: 1,
        acceptedTimeSec: before.acceptedTimeSec + 0.1,
      });
      for (const output of Object.values(frame.outputs)) {
        const definition = MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.find(
          ({ outputId }) => outputId === output.outputId,
        )!;
        if (definition.kind === "metric") {
          expect(output).toMatchObject({
            value: null,
            availability: "not-evaluated-at-accepted-state",
          });
        } else {
          expect(output.availability).toBe("available");
          expect(typeof output.value).toBe("number");
          expect(Number.isFinite(output.value)).toBe(true);
        }
      }

      host.closeSession(runtimeSessionId);
    }
  }, 120_000);

  it("rejects every off-lattice V3 control atomically and remains usable", async () => {
    const host = new MainWireIntegratedStudioRuntimeHostV3();
    const inputKeys = Object.keys(
      MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3,
    ) as MainWireIntegratedModelHemodynamicResearchInputKeyV3[];

    for (const [index, inputKey] of inputKeys.entries()) {
      const runtimeSessionId = `session/v3-off-lattice-${index}`;
      const scenarioId = `scenario/off-lattice-${inputKey}`;
      const range =
        MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3[inputKey];
      await host.createSession(runtimeSessionId, [{
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
      }]);
      const beforeFixture = host.currentFixture(runtimeSessionId, scenarioId);
      const beforeFrame = host.currentFrame(runtimeSessionId, scenarioId);

      await expect(host.applyControl(
        runtimeSessionId,
        scenarioId,
        MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3[inputKey],
        range.minimum + range.step / 2,
        0,
      )).rejects.toThrow(/step lattice/);
      expect(host.currentInputEpoch(runtimeSessionId, scenarioId)).toBe(0);
      expect(host.currentFixture(runtimeSessionId, scenarioId))
        .toEqual(beforeFixture);
      expect(host.currentFrame(runtimeSessionId, scenarioId))
        .toEqual(beforeFrame);

      await expect(host.applyControl(
        runtimeSessionId,
        scenarioId,
        MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3[inputKey],
        range.minimum + range.step,
        0,
      )).resolves.toMatchObject({ inputEpoch: 1 });
      host.closeSession(runtimeSessionId);
    }
  }, 120_000);

  it("pins warm-start controls without introducing a durable ParameterSet", () => {
    const modelPackage = createMainWireIntegratedStudioModelPackageV3();

    expect(modelPackage.manifest.runtime.numericalSessionId).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_SESSION_V3_ID,
    );
    expect(modelPackage.manifest.catalogs.controlCatalog.map(
      ({ controlId, changeSemantics }) => ({
        controlId,
        changeSemantics,
      }),
    )).toEqual(Object.values(MAIN_WIRE_INTEGRATED_STUDIO_CONTROL_IDS_V3).map(
      (controlId) => ({
        controlId,
        changeSemantics: "accepted-state-warm-start",
      }),
    ));
    expect("parameterCatalog" in modelPackage.manifest.catalogs).toBe(false);
    expect(JSON.stringify(modelPackage.manifest)).not.toMatch(/ParameterSet/);
    expect(modelPackage.manifest.catalogs.graphCatalog).toHaveLength(4);
    expect(modelPackage.manifest.catalogs.graphCatalog[0]).toMatchObject({
      graphId: "hemodynamics.pressure.waveform",
      renderer: "sweep",
      defaultSeriesIds: ["LVP", "LAP", "AoP"],
      seriesCatalog: [
        {
          kind: "scalar",
          seriesId: "LVP",
          outputId: "hemodynamics.pressure.absolute.LV",
        },
        {
          kind: "scalar",
          seriesId: "LAP",
          outputId: "hemodynamics.pressure.absolute.LA",
        },
        {
          kind: "scalar",
          seriesId: "AoP",
          outputId: "hemodynamics.pressure.absolute.Ao",
        },
        {
          kind: "scalar",
          seriesId: "RAP",
          outputId: "hemodynamics.pressure.absolute.RA",
        },
        {
          kind: "scalar",
          seriesId: "RVP",
          outputId: "hemodynamics.pressure.absolute.RV",
        },
        {
          kind: "scalar",
          seriesId: "PAP",
          outputId: "hemodynamics.pressure.absolute.PA",
        },
        {
          kind: "scalar",
          seriesId: "PVeinP",
          outputId: "hemodynamics.pressure.absolute.PVein",
        },
        {
          kind: "scalar",
          seriesId: "VCP",
          outputId: "hemodynamics.pressure.absolute.VC",
        },
        {
          kind: "scalar",
          seriesId: "Pperi",
          outputId: "pericardium.pressure.excess",
        },
        {
          kind: "scalar",
          seriesId: "Ppl",
          outputId: "respiration.pressure.pleural",
        },
        {
          kind: "scalar",
          seriesId: "Palv",
          outputId: "respiration.pressure.alveolar",
        },
      ],
    });
    expect(modelPackage.manifest.catalogs.graphCatalog.filter(
      ({ renderer }) => renderer === "pressure-volume",
    )).toEqual([{
      graphId: "hemodynamics.pressure-volume",
      renderer: "pressure-volume",
      defaultSeriesIds: ["LV"],
      seriesCatalog: [
        {
          kind: "pressure-volume",
          seriesId: "LV",
          volumeOutputId: "hemodynamics.volume.LV",
          pressureOutputId: "hemodynamics.pressure.transmural.LV",
          pressureBasis: "transmural",
          cyclePhaseOutputId: "rhythm.phase.regular-sinus",
        },
        {
          kind: "pressure-volume",
          seriesId: "RV",
          volumeOutputId: "hemodynamics.volume.RV",
          pressureOutputId: "hemodynamics.pressure.transmural.RV",
          pressureBasis: "transmural",
          cyclePhaseOutputId: "rhythm.phase.regular-sinus",
        },
        {
          kind: "pressure-volume",
          seriesId: "RA",
          volumeOutputId: "hemodynamics.volume.RA",
          pressureOutputId: "hemodynamics.pressure.transmural.RA",
          pressureBasis: "transmural",
          cyclePhaseOutputId: "rhythm.phase.regular-sinus",
        },
        {
          kind: "pressure-volume",
          seriesId: "LA",
          volumeOutputId: "hemodynamics.volume.LA",
          pressureOutputId: "hemodynamics.pressure.transmural.LA",
          pressureBasis: "transmural",
          cyclePhaseOutputId: "rhythm.phase.regular-sinus",
        },
      ],
    }]);
    expect(modelPackage.manifest.catalogs.graphCatalog.filter(
      ({ renderer }) => renderer === "structural-return",
    )).toEqual([{
      graphId: "hemodynamics.guyton-starling",
      renderer: "structural-return",
      analysisId:
        MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      side: "both",
    }]);
  });
});

function exactExecutableArtifactBytesV3(): Uint8Array {
  return new TextEncoder().encode(
    mainWireIntegratedStudioExecutableArtifactV3,
  );
}
