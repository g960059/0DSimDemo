import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import {
  assertExactModelKernelManifestV3,
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
  validateStudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  DynamicExactModelRuntimeLoaderV2,
} from "@/studio/infrastructure/model/DynamicExactModelRuntimeLoaderV2";
import mainWireIntegratedStudioStandardArtifactV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.artifact.mjs?raw";
import mainWireIntegratedStudioStandardClientV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioStandardRuntimeHostV1,
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import {
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";
import mainWireIntegratedStudioStandardSurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-v1.json";
import {
  createDefaultExperimentSurfaceV3,
} from "@/components/workbench/WorkbenchSurfaceV3";

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

describe("Standard Main Wire Integrated Studio exact model", () => {
  it("requires the complete Standard kernel catalog contract", () => {
    const { modelMetricCatalog: _removed, ...withoutMetricCatalog } =
      mainWireIntegratedStudioStandardClientV1.manifest;
    expect(() => assertExactModelKernelManifestV3(withoutMetricCatalog))
      .toThrow(/modelMetricCatalog|keys must be exactly/);
  });

  it("uses the committed Standard bundle when Supabase is unconfigured", async () => {
    vi.resetModules();
    vi.doMock(
      "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1",
      () => ({
        studioSupabaseModelReleaseResolverV1: () => null,
        invalidateStudioSupabaseModelReleaseResolverCacheV1: () => undefined,
      }),
    );
    vi.doMock("@/studio/contracts/v2/release", async () => {
      const actual = await vi.importActual<typeof import(
        "@/studio/contracts/v2/release"
      )>("@/studio/contracts/v2/release");
      return {
        ...actual,
        // Vitest resolves import.meta.url as file:. Browser builds resolve the
        // same committed asset over HTTP(S); this test owns fallback identity.
        validateStudioModelWorkerReleaseTicketV2: (value: unknown) => value,
      };
    });

    try {
      const composition = await import(
        "@/studio/composition/StudioDefaultCompositionV2"
      );
      await expect(composition.loadStudioDefaultClientCompositionV2())
        .resolves.toMatchObject({
          defaultModelId:
            mainWireIntegratedStudioStandardClientV1.manifest.modelId,
          surfaceReleaseId:
            mainWireIntegratedStudioStandardSurfaceV1.surfaceReleaseId,
          surfaceSeriesId:
            mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
          workerReleaseTicket: {
            moduleAbi: "circleheart-exact-model-esm-v1",
          },
        });
      await expect(composition.loadStudioExperimentClientCompositionV2(
        mainWireIntegratedStudioStandardClientV1.manifest.modelId,
        mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
      )).resolves.toMatchObject({
        defaultModelId:
          mainWireIntegratedStudioStandardClientV1.manifest.modelId,
        surfaceReleaseId:
          mainWireIntegratedStudioStandardSurfaceV1.surfaceReleaseId,
        surfaceSeriesId:
          mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
      });
      await expect(composition.loadStudioExperimentClientCompositionV2(
        "model/pre-standard",
        mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
      )).rejects.toThrow(/cannot resolve the requested exact model/);
    } finally {
      vi.doUnmock(
        "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1",
      );
      vi.doUnmock("@/studio/contracts/v2/release");
      vi.resetModules();
    }
  });

  it("accepts only the Standard worker ABI and exact Surface ticket", () => {
    const ticket = validateStudioModelWorkerReleaseTicketV2({
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: mainWireIntegratedStudioStandardClientV1.manifest.modelId,
      manifest: mainWireIntegratedStudioStandardClientV1.manifest,
      surfaceRelease: mainWireIntegratedStudioStandardSurfaceV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: "https://registry.example/model-releases/standard.mjs",
    });
    expect(ticket.moduleAbi).toBe("circleheart-exact-model-esm-v1");
    expect(() => validateStudioModelWorkerReleaseTicketV2({
      ...ticket,
      moduleAbi: "unsupported-exact-model-abi",
    })).toThrow(/unsupported exact-model module ABI/);
    expect(() => validateStudioModelWorkerReleaseTicketV2({
      ...ticket,
      surfaceRelease: undefined,
    })).toThrow(/surfaceRelease|portable JSON data model/);
  });

  it("loads one immutable Standard artifact and fails closed", async () => {
    const bytes = standardExecutableArtifactBytesV3();
    const fetchArtifact = vi.fn(async () => artifactFetchResponseV3(bytes));
    const loader = new DynamicExactModelRuntimeLoaderV2(fetchArtifact);
    const ticket = {
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: mainWireIntegratedStudioStandardClientV1.manifest.modelId,
      manifest: mainWireIntegratedStudioStandardClientV1.manifest,
      surfaceRelease: mainWireIntegratedStudioStandardSurfaceV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: "https://registry.example/model-releases/standard.mjs",
    } as const;

    const first = loader.load(ticket);
    expect(loader.load(ticket)).toBe(first);
    await expect(first).resolves.toMatchObject({
      contract: { modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 },
      simulationAdapter: {
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
      },
    });
    expect(fetchArtifact).toHaveBeenCalledOnce();

    await expect(loader.load({
      ...ticket,
      artifactUrl: "https://registry.example/model-releases/other.mjs",
    })).rejects.toThrow(/another immutable release ticket/);

    const mismatchLoader = new DynamicExactModelRuntimeLoaderV2(
      async () => artifactFetchResponseV3(bytes),
    );
    await expect(mismatchLoader.load({
      ...ticket,
      manifest: {
        ...ticket.manifest,
        runtime: {
          ...ticket.manifest.runtime,
          scope: `${ticket.manifest.runtime.scope}-mismatch`,
        },
      },
    })).rejects.toThrow(/manifest does not match the registry/);

    const missingArtifactLoader = new DynamicExactModelRuntimeLoaderV2(
      async () => ({
        ok: false,
        status: 404,
        async arrayBuffer() { return new ArrayBuffer(0); },
      }),
    );
    await expect(missingArtifactLoader.load(ticket)).rejects.toThrow(
      /artifact fetch failed \(404\)/,
    );
  }, 60_000);

  it("warm-starts Standard controls at the accepted clock", async () => {
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-control-warm-start";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    }]);
    let before = host.currentFrame(runtimeSessionId, scenarioId);
    for (let ordinal = 0; ordinal < 50; ordinal += 1) {
      before = host.advanceOnePresentationStep(runtimeSessionId, scenarioId);
    }
    const warmed = await host.applyControl(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1
        .ventricularContractilityScale,
      1.2,
      0,
    );
    expect(warmed).toMatchObject({
      inputEpoch: 1,
      acceptedRevision: before.acceptedRevision,
      acceptedTimeSec: before.acceptedTimeSec,
    });
    expect(host.advanceOnePresentationStep(runtimeSessionId, scenarioId))
      .toMatchObject({ inputEpoch: 1 });
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("composes the complete Workbench catalog and emits beat metrics", async () => {
    const composed = composeStandardModelContractV1(
      mainWireIntegratedStudioStandardClientV1.manifest,
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    expect(composed.contract.controlCatalog.map(({ controlId }) => controlId))
      .toEqual(Object.values(MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1));
    expect(composed.contract.outputCatalog.map(({ outputId }) => outputId))
      .toEqual(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3);
    expect(composed.contract.graphCatalog.map(({ graphId }) => graphId))
      .toEqual([
        "hemodynamics.pressure.waveform",
        "hemodynamics.flow.waveform",
        "hemodynamics.pressure-volume",
        "hemodynamics.guyton-starling",
      ]);

    const workbenchSurface = createDefaultExperimentSurfaceV3(composed.contract);
    expect(workbenchSurface.graphPanes.map(({ graphId }) => graphId)).toEqual([
      "hemodynamics.pressure.waveform",
      "hemodynamics.pressure-volume",
    ]);
    expect(workbenchSurface.outputPanes[0]?.items.map(({ outputId }) => outputId))
      .toEqual([
        "rhythm.heart-rate.instantaneous",
        "hemodynamics.output.native-left",
        "hemodynamics.pressure.mean.Ao",
        "hemodynamics.ejection-fraction.LV-extrema",
        "hemodynamics.pressure.mean.LA",
      ]);

    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-workbench-parity";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    }]);
    let frame = host.currentFrame(runtimeSessionId, scenarioId);
    for (let ordinal = 0; ordinal < 1_700; ordinal += 1) {
      frame = host.advanceOnePresentationStep(runtimeSessionId, scenarioId);
      if (frame.outputs["hemodynamics.output.native-left"]?.value !== null) break;
    }
    for (const outputId of [
      "hemodynamics.output.native-left",
      "hemodynamics.pressure.mean.Ao",
      "hemodynamics.ejection-fraction.LV-extrema",
      "hemodynamics.pressure.mean.LA",
    ]) {
      expect(frame.outputs[outputId]).toMatchObject({
        outputId,
        availability: "available",
        quality: "accepted-derived",
        value: expect.any(Number),
      });
    }
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("admits a captured Standard checkpoint without discarding beat state", async () => {
    const release = createCircleHeartExactModelReleaseV1();
    const model = composeStandardModelContractV1(
      release.manifest,
      mainWireIntegratedStudioStandardSurfaceV1,
    ).contract;
    const simulation = release.executables.simulationAdapter;
    const runtimeSessionId = "session/standard-snapshot-admission";
    const scenarioId = "scenario/baseline";
    await simulation.createSession({
      runtimeSessionId,
      scenarios: [{
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      }],
    });
    for (let ordinal = 0; ordinal < 500; ordinal += 1) {
      await simulation.advanceOnePresentationStep({ runtimeSessionId, scenarioId });
    }
    const captured = await release.executables.experimentCapture
      .captureAcceptedCandidate({
        experimentId: "experiment/standard-snapshot-admission",
        model,
        desiredContent: {
          modelId: release.manifest.modelId,
          surfaceSeriesId:
            mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
          scenarios: [{
            scenarioId,
            label: "Baseline",
            fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
          }],
          surface: EMPTY_SURFACE_V2,
        },
        correlation: {
          runtimeSessionId,
          scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
        },
      });
    const checkpoint = captured.content.scenarios[0]!.capture.checkpoint;
    expect(checkpoint.payload).toMatchObject({
      checkpointId:
        "circleheart.main-wire-integrated-model-standard-exact-checkpoint.v1",
      numericalCheckpoint: expect.objectContaining({
        revision: checkpoint.acceptedRevision,
        acceptedTimeSec: checkpoint.acceptedTimeSec,
      }),
    });
    await expect(release.executables.snapshotGate.admitFrozenCandidate({
      model,
      content: {
        ...captured.content,
        surfaceSeriesId:
          mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
      },
    })).resolves.toEqual({ status: "passed" });
    expect(captured.content.scenarios[0]!.capture.checkpoint).toEqual(checkpoint);
    simulation.disposeSession(runtimeSessionId);
  }, 120_000);

  it("connects Standard PV analysis to the bidirectional plan", async () => {
    const plan = resolveMainWireIntegratedStudioAnalysisExecutionPlanV3(
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
    );
    expect(plan?.partitions).toEqual([
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
    ]);
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-pv-analysis";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    }]);
    const source = host.currentFrame(runtimeSessionId, scenarioId);
    const analysis = await host.requestAnalysis(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      source.inputEpoch,
      source.acceptedRevision,
      source.acceptedTimeSec,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
    );
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
    expect(analysis.modelId).toBe(MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1);
    expect(payload.left.starlingLocus.status)
      .toBe("responsive-fixed-tbv-preview");
    expect(payload.left.starlingLocus.points.length).toBeGreaterThan(2);
    expect(payload.left.starlingLocus.points.every((point) =>
      point.ventricularPressureVolumeLoop.length >= 12)).toBe(true);
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(source);
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("keeps controls in Surface and never introduces a ParameterSet", () => {
    const composition = composeStandardModelContractV1(
      mainWireIntegratedStudioStandardClientV1.manifest,
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    expect(composition.contract.modelId)
      .toBe(MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1);
    expect(composition.contract.controlCatalog.map(({ changeSemantics }) =>
      changeSemantics)).toEqual(
        composition.contract.controlCatalog.map(() =>
          "accepted-state-warm-start"),
      );
    expect(JSON.stringify(mainWireIntegratedStudioStandardSurfaceV1))
      .not.toMatch(/ParameterSet/);
    expect(mainWireIntegratedStudioStandardSurfaceV1.graphCatalog)
      .toHaveLength(4);
  });
});

function standardExecutableArtifactBytesV3(): Uint8Array {
  return new TextEncoder().encode(mainWireIntegratedStudioStandardArtifactV1);
}

function artifactFetchResponseV3(bytes: Uint8Array): Readonly<{
  ok: true;
  status: 200;
  arrayBuffer(): Promise<ArrayBuffer>;
}> {
  return Object.freeze({
    ok: true as const,
    status: 200 as const,
    async arrayBuffer() {
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
    },
  });
}
