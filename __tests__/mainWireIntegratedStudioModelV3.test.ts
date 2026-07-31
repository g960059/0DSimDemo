import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
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
  MAIN_WIRE_INTEGRATED_STUDIO_DEFAULT_FIXTURE_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_ID_V3,
  createMainWireIntegratedStudioModelPackageV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3";
import mainWireIntegratedStudioExecutableArtifactV3 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs?raw";

const EMPTY_SURFACE_V2: ExperimentSurfaceV2 = Object.freeze({
  groups: Object.freeze([Object.freeze({
    groupId: "group/main",
    label: "Main",
    order: 0,
    priority: 0,
  })]),
  graphs: Object.freeze([]),
  readouts: Object.freeze([]),
  controls: Object.freeze([]),
  note: Object.freeze({
    instanceId: "note/main",
    text: "",
    groupId: "group/main",
    order: 0,
    priority: 0,
  }),
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("registered Main Wire Integrated Studio Model V3", () => {
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
      "contract",
      "defaultFixture",
      "defaultModelId",
    ]);
    expect("authoring" in composition).toBe(false);
    expect("runtime" in composition).toBe(false);
  });

  it("materializes only the exact executable artifact at registry admission", async () => {
    const modelPackage = createMainWireIntegratedStudioModelPackageV3();
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

    const captured = await composition.runtime.draftCapture
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

  it("pins the model session and exposes no durable ParameterSet or control", () => {
    const modelPackage = createMainWireIntegratedStudioModelPackageV3();

    expect(modelPackage.manifest.runtime.numericalSessionId).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_SESSION_V3_ID,
    );
    expect(modelPackage.manifest.catalogs.parameterCatalog).toEqual([]);
    expect(modelPackage.manifest.catalogs.controlCatalog).toEqual([]);
    expect(JSON.stringify(modelPackage.manifest)).not.toMatch(/ParameterSet/);
  });
});

function exactExecutableArtifactBytesV3(): Uint8Array {
  return new TextEncoder().encode(
    mainWireIntegratedStudioExecutableArtifactV3,
  );
}
