import { afterEach, describe, expect, it, vi } from "vitest";

import { MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3 } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { buildNodes } from "@/engine/core/topology";
import { MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID } from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
  EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
  assertBoundExecutionPlanV1,
  bindExecutionPlanV1,
  prepareBoundExecutionPlanSolveGroupV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import { STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1 } from "@/studio/contracts/v2/simulation";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  assertAdditiveModelSurfaceUpgradeV1,
  assertExactModelKernelManifestV3,
  assertModelSurfaceReleaseManifestV1,
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
  validateStudioModelWorkerReleaseTicketV2,
} from "@/studio/contracts/v2/release";
import {
  DynamicExactModelRuntimeLoaderV2,
  fetchImmutableExactModelArtifactV2,
} from "@/studio/infrastructure/model/DynamicExactModelRuntimeLoaderV2";
import mainWireIntegratedStudioStandardArtifactV1 from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.artifact.mjs?raw";
import generatedExecutionPlanV1 from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedExecutionPlanV1.generated.json";
import mainWireIntegratedStudioStandardClientV1 from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioStandardRuntimeHostV1,
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import { resolveMainWireIntegratedStudioAnalysisExecutionPlanV3 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";
import mainWireIntegratedStudioStandardSurfaceV1 from "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-v2.json";
import mainWireIntegratedStudioHistoricalSurfaceV1 from "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-v1.json";
import mainWireIntegratedStudioStandardRegistryLockV1 from "@/studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json";
import { createDefaultExperimentSurfaceV3 } from "@/components/workbench/WorkbenchSurfaceV3";
import { materializeStudioSimulationPresentationFramesV2 } from "@/studio/workers/StudioSimulationPresentationBatchV2";

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
  it("keeps the exact current frame identical to the accepted batch boundary", async () => {
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-current-frame-repeatability";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [
      {
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      },
    ]);
    const first = host.currentFrame(runtimeSessionId, scenarioId);
    const second = host.currentFrame(runtimeSessionId, scenarioId);
    expect(second).toEqual(first);
    const batchFrames = materializeStudioSimulationPresentationFramesV2(
      host.advancePresentationBatch(runtimeSessionId, scenarioId, 16, [
        "hemodynamics.pressure.absolute.LV",
      ]),
    );
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(
      batchFrames.at(-1),
    );
    host.closeSession(runtimeSessionId);
  });

  it("owns an isolated plan workspace for each Scenario and control boundary", async () => {
    const release = createCircleHeartExactModelReleaseV1();
    expect(release.manifest.capabilities).toContain(
      EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
    );
    const simulation = release.executables.simulationAdapter;
    const executionPlan = release.executables.executionPlan;
    const baselineBound = executionPlan.bind();
    const lowVolumeBound = executionPlan.bind();
    assertBoundExecutionPlanV1(baselineBound, executionPlan.descriptor);
    assertBoundExecutionPlanV1(lowVolumeBound, executionPlan.descriptor);
    const runtimeSessionId = "session/standard-plan-scenario-authority";
    const baselineScenarioId = "scenario/baseline";
    const lowVolumeScenarioId = "scenario/low-volume";
    const lowVolumeFixture = Object.freeze({
      ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      hemodynamicResearchInputs: Object.freeze({
        ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1.hemodynamicResearchInputs,
        totalBloodVolumeMl: 4_200,
      }),
    });
    await executionPlan.createSession({
      runtimeSessionId,
      scenarios: [
        {
          scenarioId: baselineScenarioId,
          fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        },
        {
          scenarioId: lowVolumeScenarioId,
          fixture: lowVolumeFixture,
        },
      ],
      boundExecutionPlans: new Map([
        [baselineScenarioId, baselineBound],
        [lowVolumeScenarioId, lowVolumeBound],
      ]),
    });
    const baselineWorkspace = prepareBoundExecutionPlanSolveGroupV1(
      baselineBound,
      "coupled-hemodynamics",
    );
    await simulation.advanceOnePresentationStep({
      runtimeSessionId,
      scenarioId: baselineScenarioId,
    });
    expect(baselineWorkspace.jacobian.some((value) => value !== 0)).toBe(true);
    expect(baselineWorkspace.pivots.some((value) => value !== 0)).toBe(true);
    const lowVolumeWorkspace = prepareBoundExecutionPlanSolveGroupV1(
      lowVolumeBound,
      "coupled-hemodynamics",
    );
    expect(lowVolumeWorkspace.jacobian.every((value) => value === 0)).toBe(
      true,
    );
    await simulation.advanceOnePresentationStep({
      runtimeSessionId,
      scenarioId: lowVolumeScenarioId,
    });
    expect(lowVolumeWorkspace.jacobian.some((value) => value !== 0)).toBe(true);
    expect(lowVolumeWorkspace.jacobian.buffer).not.toBe(
      baselineWorkspace.jacobian.buffer,
    );

    await simulation.applyControl({
      runtimeSessionId,
      scenarioId: baselineScenarioId,
      controlId:
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.totalBloodVolumeMl,
      value: 6_000,
      expectedInputEpoch: 0,
    });
    const retiredWorkspaceSnapshot = new Float64Array(
      baselineWorkspace.jacobian,
    );
    await simulation.advanceOnePresentationStep({
      runtimeSessionId,
      scenarioId: baselineScenarioId,
    });
    expect(baselineWorkspace.jacobian).toEqual(retiredWorkspaceSnapshot);
    simulation.disposeSession(runtimeSessionId);
  });

  it("rejects a compiled multirate schedule until the model implements it", async () => {
    const release = createCircleHeartExactModelReleaseV1();
    const executionPlan = release.executables.executionPlan;
    const runtimeSessionId = "session/standard-multirate-rejection";
    const scenarioId = "scenario/baseline";
    const driftedDescriptor = {
      ...generatedExecutionPlanV1,
      updateSchedule: {
        ...generatedExecutionPlanV1.updateSchedule,
        groups: generatedExecutionPlanV1.updateSchedule.groups.map((group) => ({
          ...group,
          periodTicks: 2,
          effectiveStepSec: 0.004,
        })),
      },
    };
    const boundExecutionPlan = bindExecutionPlanV1(driftedDescriptor, {
      componentKernelIds: [
        ...new Set(
          generatedExecutionPlanV1.stateLayout.blocks.map(
            ({ kernelId }) => kernelId,
          ),
        ),
      ],
      hydraulicPathKernelIds: [
        ...new Set(generatedExecutionPlanV1.hydraulicGraph.pathKernelIds),
      ],
      solveSystemKernelIds: [
        ...new Set(
          generatedExecutionPlanV1.solveGroups.map(
            ({ systemKernelId }) => systemKernelId,
          ),
        ),
      ],
    });

    await expect(
      executionPlan.createSession({
        runtimeSessionId,
        scenarios: [
          {
            scenarioId,
            fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
          },
        ],
        boundExecutionPlans: new Map([[scenarioId, boundExecutionPlan]]),
      }),
    ).rejects.toThrow(/update schedule drifted/);
  });

  it("rejects one bound plan shared by equal Scenario IDs in different sessions", async () => {
    const release = createCircleHeartExactModelReleaseV1();
    const executionPlan = release.executables.executionPlan;
    const bound = executionPlan.bind();
    assertBoundExecutionPlanV1(bound, executionPlan.descriptor);
    const scenarioId = "scenario/shared-name";
    await executionPlan.createSession({
      runtimeSessionId: "session/first",
      scenarios: [
        {
          scenarioId,
          fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        },
      ],
      boundExecutionPlans: new Map([[scenarioId, bound]]),
    });
    await expect(
      executionPlan.createSession({
        runtimeSessionId: "session/second",
        scenarios: [
          {
            scenarioId,
            fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
          },
        ],
        boundExecutionPlans: new Map([[scenarioId, bound]]),
      }),
    ).rejects.toThrow(/cannot be shared between Scenarios/);
    release.executables.simulationAdapter.disposeSession("session/first");
  });

  it("exposes hemorrhage reserve without moving the canonical baseline", () => {
    const ranges = MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3;
    expect(ranges.venousTone).toEqual({
      minimum: 0,
      maximum: 1,
      step: 0.01,
    });
    expect(ranges.totalBloodVolumeMl).toEqual({
      minimum: 4_200,
      maximum: 7_000,
      step: 50,
    });

    const baselineTone =
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3.venousTone;
    const nodes = buildNodes();
    const systemicVein = nodes.find(({ name }) => name === "SV");
    const venaCava = nodes.find(({ name }) => name === "VC");
    expect(systemicVein).toMatchObject({ Vu: 1_653.909, venousToneGain: 770 });
    expect(venaCava).toMatchObject({ Vu: 169.591, venousToneGain: 130 });
    expect(
      systemicVein!.Vu! - systemicVein!.venousToneGain! * baselineTone,
    ).toBeCloseTo(1_590.909 - 350 * baselineTone, 12);
    expect(
      venaCava!.Vu! - venaCava!.venousToneGain! * baselineTone,
    ).toBeCloseTo(159.091 - 60 * baselineTone, 12);

    expect(() =>
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        venousTone: 1,
        totalBloodVolumeMl: 4_200,
      }),
    ).not.toThrow();
    expect(() =>
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        venousTone: 1.01,
      }),
    ).toThrow(/venousTone/);
    expect(() =>
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        totalBloodVolumeMl: 4_199,
      }),
    ).toThrow(/totalBloodVolumeMl/);
  });

  it("cold-starts a portable fixture at the advertised hypovolemic boundary", async () => {
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-hypovolemic-cold-start";
    const scenarioId = "scenario/hypovolemia-4200";
    const fixture = Object.freeze({
      ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      hemodynamicResearchInputs: Object.freeze({
        ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1.hemodynamicResearchInputs,
        totalBloodVolumeMl: 4_200,
      }),
    });
    await expect(
      host.createSession(runtimeSessionId, [{ scenarioId, fixture }]),
    ).resolves.toBeUndefined();
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toMatchObject({
      scenarioId,
      acceptedTimeSec: 0,
    });
    host.closeSession(runtimeSessionId);
  });

  it("requires the complete Standard kernel catalog contract", () => {
    const { modelMetricCatalog: _removed, ...withoutMetricCatalog } =
      mainWireIntegratedStudioStandardClientV1.manifest;
    expect(() =>
      assertExactModelKernelManifestV3(withoutMetricCatalog),
    ).toThrow(/modelMetricCatalog|keys must be exactly/);
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
      const actual = await vi.importActual<
        typeof import("@/studio/contracts/v2/release")
      >("@/studio/contracts/v2/release");
      return {
        ...actual,
        // Vitest resolves import.meta.url as file:. Browser builds resolve the
        // same committed asset over HTTP(S); this test owns fallback identity.
        validateStudioModelWorkerReleaseTicketV2: (value: unknown) => value,
      };
    });

    try {
      const composition =
        await import("@/studio/composition/StudioDefaultCompositionV2");
      expect(
        composition
          .localStandardArtifactRevisionUrlV1(
            new URL("http://127.0.0.1:4176/standard-exact-model.artifact.mjs"),
          )
          .searchParams.get("revision"),
      ).toBe(mainWireIntegratedStudioStandardRegistryLockV1.artifactRevisionId);
      await expect(
        composition.loadStudioDefaultClientCompositionV2(),
      ).resolves.toMatchObject({
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
      await expect(
        composition.loadStudioExperimentClientCompositionV2(
          mainWireIntegratedStudioStandardClientV1.manifest.modelId,
          mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
        ),
      ).resolves.toMatchObject({
        defaultModelId:
          mainWireIntegratedStudioStandardClientV1.manifest.modelId,
        surfaceReleaseId:
          mainWireIntegratedStudioStandardSurfaceV1.surfaceReleaseId,
        surfaceSeriesId:
          mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
      });
      await expect(
        composition.loadStudioExperimentClientCompositionV2(
          "model/pre-standard",
          mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
        ),
      ).rejects.toThrow(/cannot resolve the requested exact model/);
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
      artifactRevisionId:
        mainWireIntegratedStudioStandardRegistryLockV1.artifactRevisionId,
      manifest: mainWireIntegratedStudioStandardClientV1.manifest,
      surfaceRelease: mainWireIntegratedStudioStandardSurfaceV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: "https://registry.example/model-releases/standard.mjs",
    });
    expect(ticket.moduleAbi).toBe("circleheart-exact-model-esm-v1");
    expect(() =>
      validateStudioModelWorkerReleaseTicketV2({
        ...ticket,
        moduleAbi: "unsupported-exact-model-abi",
      }),
    ).toThrow(/unsupported exact-model module ABI/);
    expect(() =>
      validateStudioModelWorkerReleaseTicketV2({
        ...ticket,
        surfaceRelease: undefined,
      }),
    ).toThrow(/surfaceRelease|portable JSON data model/);
  });

  it("fetches immutable exact artifacts from the shared HTTP cache", async () => {
    const fetchV3 = vi.fn(
      async () =>
        new Response(new Uint8Array([1]), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetchV3);

    await expect(
      fetchImmutableExactModelArtifactV2(
        "https://registry.example/model-releases/standard.mjs",
      ),
    ).resolves.toMatchObject({ ok: true, status: 200 });
    expect(fetchV3).toHaveBeenCalledWith(
      "https://registry.example/model-releases/standard.mjs",
      {
        cache: "force-cache",
        credentials: "omit",
        redirect: "error",
      },
    );
  });

  it("loads one immutable Standard artifact and fails closed", async () => {
    expect(mainWireIntegratedStudioStandardArtifactV1).not.toContain(
      "ModelDefinition V1 schemaId is invalid",
    );
    expect(mainWireIntegratedStudioStandardArtifactV1).not.toContain(
      "compileExecutionPlanV1",
    );
    const bytes = standardExecutableArtifactBytesV3();
    const fetchArtifact = vi.fn(async () => artifactFetchResponseV3(bytes));
    const loader = new DynamicExactModelRuntimeLoaderV2(fetchArtifact);
    const ticket = {
      schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
      modelId: mainWireIntegratedStudioStandardClientV1.manifest.modelId,
      artifactRevisionId:
        mainWireIntegratedStudioStandardRegistryLockV1.artifactRevisionId,
      manifest: mainWireIntegratedStudioStandardClientV1.manifest,
      surfaceRelease: mainWireIntegratedStudioStandardSurfaceV1,
      moduleAbi: "circleheart-exact-model-esm-v1",
      artifactUrl: "https://registry.example/model-releases/standard.mjs",
    } as const;

    const coldMeasuredPromise = loader.loadMeasured(ticket);
    const first = loader.load(ticket);
    expect(loader.load(ticket)).toBe(first);
    await expect(first).resolves.toMatchObject({
      contract: { modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 },
      simulationAdapter: {
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
      },
    });
    const loaded = await first;
    const coldMeasured = await coldMeasuredPromise;
    expect(coldMeasured.runtime).toBe(loaded);
    expect(coldMeasured.timing).toMatchObject({
      cacheHit: false,
      artifactBytes: bytes.byteLength,
    });
    expect(coldMeasured.timing.artifactFetchMs).toBeGreaterThanOrEqual(0);
    expect(coldMeasured.timing.moduleImportAndFactoryMs).toBeGreaterThanOrEqual(
      0,
    );
    expect(coldMeasured.timing.contractValidationMs).toBeGreaterThanOrEqual(0);
    expect(coldMeasured.timing.totalMs).toBeGreaterThanOrEqual(0);
    expect(loaded.executionPlan).toMatchObject({
      modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    });
    const boundExecutionPlan = loaded.executionPlan.bind();
    assertBoundExecutionPlanV1(
      boundExecutionPlan,
      loaded.executionPlan.descriptor,
    );
    const warmMeasured = await loader.loadMeasured(ticket);
    expect(warmMeasured.runtime).toBe(loaded);
    expect(warmMeasured.timing).toMatchObject({
      cacheHit: true,
      artifactBytes: bytes.byteLength,
      artifactFetchMs: 0,
      moduleImportAndFactoryMs: 0,
      contractValidationMs: 0,
    });
    expect(warmMeasured.timing.totalMs).toBeGreaterThanOrEqual(0);
    const runtimeSessionId = "session/standard-artifact-repeatability";
    const scenarioId = "scenario/baseline";
    await loaded.executionPlan.createSession({
      runtimeSessionId,
      scenarios: [
        {
          scenarioId,
          fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        },
      ],
      boundExecutionPlans: new Map([[scenarioId, boundExecutionPlan]]),
    });
    const firstFrame = loaded.simulationAdapter.currentFrame({
      runtimeSessionId,
      scenarioId,
    });
    expect(
      loaded.simulationAdapter.currentFrame({
        runtimeSessionId,
        scenarioId,
      }),
    ).toEqual(firstFrame);
    const artifactBatchFrames = materializeStudioSimulationPresentationFramesV2(
      await loaded.simulationAdapter.advancePresentationBatch({
        runtimeSessionId,
        scenarioId,
        stepCount: 16,
        presentationOutputIds: ["hemodynamics.pressure.absolute.LV"],
      }),
    );
    expect(
      loaded.simulationAdapter.currentFrame({
        runtimeSessionId,
        scenarioId,
      }),
    ).toEqual(artifactBatchFrames.at(-1));
    loaded.simulationAdapter.disposeSession(runtimeSessionId);
    expect(fetchArtifact).toHaveBeenCalledOnce();

    await expect(
      loader.load({
        ...ticket,
        artifactUrl: "https://registry.example/model-releases/other.mjs",
      }),
    ).rejects.toThrow(/another immutable release ticket/);

    await expect(
      loader.load({
        ...ticket,
        artifactRevisionId: "b".repeat(64),
        artifactUrl:
          "https://registry.example/model-releases/next/standard.mjs",
      }),
    ).resolves.toMatchObject({
      contract: { modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 },
    });
    expect(fetchArtifact).toHaveBeenCalledTimes(2);

    const mismatchLoader = new DynamicExactModelRuntimeLoaderV2(async () =>
      artifactFetchResponseV3(bytes),
    );
    await expect(
      mismatchLoader.load({
        ...ticket,
        manifest: {
          ...ticket.manifest,
          runtime: {
            ...ticket.manifest.runtime,
            scope: `${ticket.manifest.runtime.scope}-mismatch`,
          },
        },
      }),
    ).rejects.toThrow(/manifest does not match the registry/);

    const missingArtifactLoader = new DynamicExactModelRuntimeLoaderV2(
      async () => ({
        ok: false,
        status: 404,
        async arrayBuffer() {
          return new ArrayBuffer(0);
        },
      }),
    );
    await expect(missingArtifactLoader.load(ticket)).rejects.toThrow(
      /artifact fetch failed \(404\)/,
    );
    await expect(
      missingArtifactLoader.load({
        ...ticket,
        artifactUrl:
          "https://registry.example/model-releases/rebound/standard.mjs",
      }),
    ).rejects.toThrow(/another immutable release ticket/);

    for (const requiredCapability of [
      STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
      EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
    ]) {
      const replacementCapability = `${requiredCapability}/omitted`;
      const manifestWithoutRequiredCapability = {
        ...ticket.manifest,
        capabilities: ticket.manifest.capabilities.map((capability) =>
          capability === requiredCapability
            ? replacementCapability
            : capability,
        ),
      };
      const artifactWithoutRequiredCapability = new TextEncoder().encode(
        mainWireIntegratedStudioStandardArtifactV1.replaceAll(
          requiredCapability,
          replacementCapability,
        ),
      );
      const capabilityLoader = new DynamicExactModelRuntimeLoaderV2(async () =>
        artifactFetchResponseV3(artifactWithoutRequiredCapability),
      );
      await expect(
        capabilityLoader.load({
          ...ticket,
          manifest: manifestWithoutRequiredCapability,
        }),
      ).rejects.toThrow(
        `Exact model manifest omits required runtime capability ${requiredCapability}`,
      );
    }
  }, 60_000);

  it("warm-starts Standard controls at the accepted clock", async () => {
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-control-warm-start";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [
      {
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      },
    ]);
    let before = host.currentFrame(runtimeSessionId, scenarioId);
    for (let ordinal = 0; ordinal < 50; ordinal += 1) {
      before = host.advanceOnePresentationStep(runtimeSessionId, scenarioId);
    }
    const warmed = await host.applyControl(
      runtimeSessionId,
      scenarioId,
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
      1.2,
      0,
    );
    expect(warmed).toMatchObject({
      inputEpoch: 1,
      acceptedRevision: before.acceptedRevision,
      acceptedTimeSec: before.acceptedTimeSec,
    });
    expect(
      host.advanceOnePresentationStep(runtimeSessionId, scenarioId),
    ).toMatchObject({ inputEpoch: 1 });
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("batch-projects selected outputs without changing exact samples", async () => {
    const singleHost = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const batchHost = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const singleSessionId = "session/standard-presentation-parity";
    const batchSessionId = singleSessionId;
    const scenarioId = "scenario/baseline";
    const seed = [
      {
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      },
    ] as const;
    await singleHost.createSession(singleSessionId, seed);
    await batchHost.createSession(batchSessionId, seed);

    const selectedOutputIds = [
      "hemodynamics.pressure.absolute.LV",
      "hemodynamics.pressure.absolute.LA",
      "hemodynamics.pressure.absolute.Ao",
      "hemodynamics.volume.LV",
      "hemodynamics.pressure.transmural.LV",
      "rhythm.phase.regular-sinus",
      "hemodynamics.output.native-left",
    ] as const;
    const singleFrames = Array.from({ length: 1_024 }, () =>
      singleHost.advanceOnePresentationStep(singleSessionId, scenarioId),
    );
    const batchFrames = Array.from({ length: 4 }, () =>
      materializeStudioSimulationPresentationFramesV2(
        batchHost.advancePresentationBatch(
          batchSessionId,
          scenarioId,
          256,
          selectedOutputIds,
        ),
      ),
    ).flat();

    expect(batchFrames).toHaveLength(singleFrames.length);
    for (let index = 0; index < singleFrames.length; index += 1) {
      const single = singleFrames[index]!;
      const batch = batchFrames[index]!;
      expect(batch).toMatchObject({
        acceptedRevision: single.acceptedRevision,
        acceptedTimeSec: single.acceptedTimeSec,
        inputEpoch: single.inputEpoch,
      });
      for (const outputId of selectedOutputIds) {
        expect(batch.outputs[outputId]).toEqual(single.outputs[outputId]);
      }
      expect(Object.keys(batch.outputs).sort()).toEqual(
        (index + 1) % 256 === 0
          ? Object.keys(single.outputs).sort()
          : [...selectedOutputIds].sort(),
      );
    }
    expect(batchFrames.at(-1)).toEqual(singleFrames.at(-1));
    expect(batchHost.currentFrame(batchSessionId, scenarioId)).toEqual(
      singleHost.currentFrame(singleSessionId, scenarioId),
    );
    expect(
      batchFrames[0]?.outputs["hemodynamics.output.native-left"]?.value,
    ).toBeNull();
    expect(
      batchFrames.some(
        (frame) =>
          typeof frame.outputs["hemodynamics.output.native-left"]?.value ===
          "number",
      ),
    ).toBe(true);

    singleHost.closeSession(singleSessionId);
    batchHost.closeSession(batchSessionId);
  }, 120_000);

  it("composes the complete Workbench catalog and emits beat metrics", async () => {
    const composed = composeStandardModelContractV1(
      mainWireIntegratedStudioStandardClientV1.manifest,
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    expect(
      composed.contract.controlCatalog.map(({ controlId }) => controlId),
    ).toEqual(
      Object.values(MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1),
    );
    expect(
      composed.contract.outputCatalog.map(({ outputId }) => outputId),
    ).toEqual(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3);
    expect(
      composed.contract.graphCatalog.map(({ graphId }) => graphId),
    ).toEqual([
      "hemodynamics.pressure.waveform",
      "hemodynamics.flow.waveform",
      "hemodynamics.pressure.waveform.comprehensive-v1",
      "hemodynamics.flow.waveform.comprehensive-v1",
      "hemodynamics.pressure-volume",
      "hemodynamics.guyton-starling",
    ]);

    const workbenchSurface = createDefaultExperimentSurfaceV3(
      composed.contract,
    );
    expect(workbenchSurface.graphPanes.map(({ graphId }) => graphId)).toEqual([
      "hemodynamics.pressure-volume",
      "hemodynamics.guyton-starling",
      "hemodynamics.pressure.waveform.comprehensive-v1",
    ]);
    expect(
      workbenchSurface.outputPanes[0]?.items.map(({ outputId }) => outputId),
    ).toEqual([
      "rhythm.heart-rate.instantaneous",
      "hemodynamics.pressure.systolic.Ao",
      "hemodynamics.pressure.diastolic.Ao",
      "hemodynamics.pressure.mean.Ao",
      "hemodynamics.pressure.systolic.PA",
      "hemodynamics.pressure.diastolic.PA",
      "hemodynamics.pressure.mean.PA",
      "hemodynamics.pressure.mean.LA",
      "hemodynamics.pressure.mean.RA",
      "hemodynamics.volume.end-diastolic.LV-at-MV-closure",
      "hemodynamics.pressure.absolute.end-diastolic.LV-at-MV-closure",
      "hemodynamics.volume.end-systolic.LV-at-AoV-closure",
      "hemodynamics.pressure.absolute.end-systolic.LV-at-AoV-closure",
      "hemodynamics.stroke-volume.LV-event-defined",
      "hemodynamics.ejection-fraction.LV-event-defined",
      "hemodynamics.valve-volume.net.AoV",
      "hemodynamics.output.effective-native-left",
      "myocardium.work.stroke.LV",
      "oxygen.delivery.systemic",
    ]);

    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-workbench-parity";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [
      {
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      },
    ]);
    let frame = host.currentFrame(runtimeSessionId, scenarioId);
    for (let ordinal = 0; ordinal < 1_700; ordinal += 1) {
      frame = host.advanceOnePresentationStep(runtimeSessionId, scenarioId);
      if (frame.outputs["hemodynamics.output.native-left"]?.value !== null)
        break;
    }
    for (const outputId of [
      "hemodynamics.output.native-left",
      "hemodynamics.valve-volume.net.AoV",
      "hemodynamics.pressure.mean.Ao",
      "hemodynamics.ejection-fraction.LV-event-defined",
      "hemodynamics.pressure.mean.LA",
      "oxygen.delivery.systemic",
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
    const executionPlan = release.executables.executionPlan;
    const sourceBoundExecutionPlan = executionPlan.bind();
    assertBoundExecutionPlanV1(
      sourceBoundExecutionPlan,
      executionPlan.descriptor,
    );
    const runtimeSessionId = "session/standard-snapshot-admission";
    const scenarioId = "scenario/baseline";
    await executionPlan.createSession({
      runtimeSessionId,
      scenarios: [
        {
          scenarioId,
          fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        },
      ],
      boundExecutionPlans: new Map([[scenarioId, sourceBoundExecutionPlan]]),
    });
    for (let ordinal = 0; ordinal < 500; ordinal += 1) {
      await simulation.advanceOnePresentationStep({
        runtimeSessionId,
        scenarioId,
      });
    }
    const captured =
      await release.executables.experimentCapture.captureAcceptedCandidate({
        experimentId: "experiment/standard-snapshot-admission",
        model,
        desiredContent: {
          modelId: release.manifest.modelId,
          surfaceSeriesId:
            mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
          scenarios: [
            {
              scenarioId,
              label: "Baseline",
              fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
            },
          ],
          surface: EMPTY_SURFACE_V2,
        },
        correlation: {
          runtimeSessionId,
          scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
        },
      });
    const checkpoint = captured.content.scenarios[0]!.capture.checkpoint;
    const sourceFrame = simulation.currentFrame({
      runtimeSessionId,
      scenarioId,
    });
    expect(checkpoint.payload).toMatchObject({
      checkpointId:
        "circleheart.main-wire-integrated-model-standard-exact-checkpoint.v2",
      numericalCheckpoint: expect.objectContaining({
        revision: checkpoint.acceptedRevision,
        acceptedTimeSec: checkpoint.acceptedTimeSec,
      }),
    });
    await expect(
      release.executables.captureAdapter.validateCapture({
        model,
        capture: {
          ...captured.content.scenarios[0]!.capture,
          fixture: {
            ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
            mechanismResearchInputs: {
              ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1.mechanismResearchInputs,
              oxygenTransport: {
                ...MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1
                  .mechanismResearchInputs.oxygenTransport,
                hemoglobinGPerDl: 10,
              },
            },
          },
        },
      }),
    ).rejects.toThrow("mechanism research input SHA-256 identity mismatch");
    await expect(
      release.executables.snapshotGate.admitFrozenCandidate({
        model,
        content: {
          ...captured.content,
          surfaceSeriesId:
            mainWireIntegratedStudioStandardSurfaceV1.surfaceSeriesId,
        },
      }),
    ).resolves.toEqual({ status: "passed" });
    expect(captured.content.scenarios[0]!.capture.checkpoint).toEqual(
      checkpoint,
    );
    const restoredRuntimeSessionId = `${runtimeSessionId}/restored`;
    const restoredBoundExecutionPlan = executionPlan.bind();
    assertBoundExecutionPlanV1(
      restoredBoundExecutionPlan,
      executionPlan.descriptor,
    );
    await executionPlan.createSession({
      runtimeSessionId: restoredRuntimeSessionId,
      scenarios: [
        {
          scenarioId,
          fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
          checkpoint,
        },
      ],
      boundExecutionPlans: new Map([[scenarioId, restoredBoundExecutionPlan]]),
    });
    const restoredFrame = simulation.currentFrame({
      runtimeSessionId: restoredRuntimeSessionId,
      scenarioId,
    });
    expect(restoredFrame).toMatchObject({
      acceptedRevision: sourceFrame.acceptedRevision,
      acceptedTimeSec: sourceFrame.acceptedTimeSec,
      inputEpoch: sourceFrame.inputEpoch,
    });
    for (let ordinal = 0; ordinal < 128; ordinal += 1) {
      const uninterrupted = await simulation.advanceOnePresentationStep({
        runtimeSessionId,
        scenarioId,
      });
      const restored = await simulation.advanceOnePresentationStep({
        runtimeSessionId: restoredRuntimeSessionId,
        scenarioId,
      });
      expectStudioFramesScientificallyEquivalent(restored, uninterrupted);
    }
    simulation.disposeSession(restoredRuntimeSessionId);
    simulation.disposeSession(runtimeSessionId);
  }, 120_000);

  it("connects Standard PV analyses to their bidirectional plans", async () => {
    const legacyPlan = resolveMainWireIntegratedStudioAnalysisExecutionPlanV3(
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
    );
    const formalPlan = resolveMainWireIntegratedStudioAnalysisExecutionPlanV3(
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
    );
    expect(legacyPlan?.partitions).toEqual([
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
    ]);
    expect(formalPlan?.partitions).toEqual([
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
    ]);
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/standard-pv-analysis";
    const scenarioId = "scenario/baseline";
    await host.createSession(runtimeSessionId, [
      {
        scenarioId,
        fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      },
    ]);
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
    expect(analysis.modelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    );
    expect(payload.left.starlingLocus.status).toBe(
      "responsive-fixed-tbv-preview",
    );
    expect(payload.left.starlingLocus.points.length).toBeGreaterThan(2);
    expect(
      payload.left.starlingLocus.points.every(
        (point) => point.ventricularPressureVolumeLoop.length >= 12,
      ),
    ).toBe(true);
    expect(host.currentFrame(runtimeSessionId, scenarioId)).toEqual(source);
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("publishes the expanded Workbench catalog as an additive Surface v2", () => {
    assertModelSurfaceReleaseManifestV1(
      mainWireIntegratedStudioHistoricalSurfaceV1,
    );
    assertModelSurfaceReleaseManifestV1(
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    assertAdditiveModelSurfaceUpgradeV1(
      mainWireIntegratedStudioHistoricalSurfaceV1,
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    expect(mainWireIntegratedStudioStandardSurfaceV1.surfaceReleaseId).toBe(
      "circleheart.main-wire.surface.workbench-v2",
    );
    expect(
      mainWireIntegratedStudioStandardSurfaceV1.predecessorSurfaceReleaseId,
    ).toBe(mainWireIntegratedStudioHistoricalSurfaceV1.surfaceReleaseId);
  });

  it("keeps controls in Surface and never introduces a ParameterSet", () => {
    const composition = composeStandardModelContractV1(
      mainWireIntegratedStudioStandardClientV1.manifest,
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    expect(composition.contract.modelId).toBe(
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
    );
    expect(
      composition.contract.controlCatalog.map(
        ({ changeSemantics }) => changeSemantics,
      ),
    ).toEqual(
      composition.contract.controlCatalog.map(
        () => "accepted-state-warm-start",
      ),
    );
    expect(
      JSON.stringify(mainWireIntegratedStudioStandardSurfaceV1),
    ).not.toMatch(/ParameterSet/);
    expect(mainWireIntegratedStudioStandardSurfaceV1.graphCatalog).toHaveLength(
      6,
    );
  });
});

function expectStudioFramesScientificallyEquivalent(
  actual: StudioSimulationFrameV2,
  expected: StudioSimulationFrameV2,
): void {
  expect(actual).toMatchObject({
    modelId: expected.modelId,
    scenarioId: expected.scenarioId,
    inputEpoch: expected.inputEpoch,
    acceptedRevision: expected.acceptedRevision,
    acceptedTimeSec: expected.acceptedTimeSec,
  });
  expect(Object.keys(actual.outputs)).toEqual(Object.keys(expected.outputs));
  for (const outputId of Object.keys(expected.outputs)) {
    const actualOutput = actual.outputs[outputId];
    const expectedOutput = expected.outputs[outputId];
    expect(actualOutput).toMatchObject({
      outputId: expectedOutput?.outputId,
      availability: expectedOutput?.availability,
      quality: expectedOutput?.quality,
    });
    const actualValue = actualOutput?.value;
    const expectedValue = expectedOutput?.value;
    if (actualValue === null || expectedValue === null) {
      expect(actualValue).toBe(expectedValue);
      continue;
    }
    if (typeof actualValue !== "number" || typeof expectedValue !== "number") {
      expect(actualValue).toEqual(expectedValue);
      continue;
    }
    const scale = Math.max(1, Math.abs(actualValue), Math.abs(expectedValue));
    expect(Math.abs(actualValue - expectedValue)).toBeLessThanOrEqual(
      1e-9 + 1e-6 * scale,
    );
  }
}

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
