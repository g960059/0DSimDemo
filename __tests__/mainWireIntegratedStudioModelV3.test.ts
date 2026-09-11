import { afterEach, describe, expect, it, vi } from "vitest";

import { EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY, assertBoundExecutionPlanV1 } from "@/runtime/executionPlan/BoundExecutionPlanV1";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID } from "@/analysis/methods/mainWire/MainWireStructuralAnalysisContractV3";
import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import { STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1 } from "@/studio/contracts/v2/simulation";

import { assertAdditiveModelSurfaceUpgradeV1, assertExactModelKernelManifestV3, assertModelSurfaceReleaseManifestV1, assertModelSurfaceReleaseLineageV1, composeStandardModelContractV1, derivationCapabilityV1, outputCapabilityV1 } from "@/studio/contracts/v2/modelSurface";
import { STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID, validateStudioModelWorkerReleaseTicketV2 } from "@/studio/contracts/v2/release";
import { DynamicExactModelRuntimeLoaderV2, fetchImmutableExactModelArtifactV2 } from "@/studio/infrastructure/model/DynamicExactModelRuntimeLoaderV2";
import mainWireIntegratedStudioStandardArtifactV1 from "@/data/model-releases/standard73/artifact.mjs.txt?raw";

import mainWireIntegratedStudioStandardClientV1 from "@/data/model-releases/CurrentModelReleaseV1";

import { MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1, MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1, MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1, MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1, MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 } from "@/domain/model/MainWireStandardIdentityV1";

import { MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID, MAIN_WIRE_PERIODIC_PVA_METHOD_V15_ID } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import { MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1, resolveMainWireAnalysisMethodsForSurfaceV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import mainWireIntegratedStudioStandardSurfaceV1 from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1";

import mainWireIntegratedStudioStandardRegistryLockV1 from "@/data/model-releases/standard73/publication.json";

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

  it("requires the complete Standard kernel catalog contract", () => {
    const { modelMetricCatalog: _removed, ...withoutMetricCatalog } =
      mainWireIntegratedStudioStandardClientV1.manifest;
    expect(() =>
      assertExactModelKernelManifestV3(withoutMetricCatalog),
    ).toThrow(/modelMetricCatalog|keys must be exactly/);
  });

  it("loads the current local model for default, Model Lab, and pinned content", async () => {
    vi.resetModules();
    vi.doMock(
      "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1",
      async (importOriginal) => ({
        ...await importOriginal<
          typeof import("@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1")
        >(),
        studioSupabaseModelReleaseResolverV1: () => null,
        invalidateStudioSupabaseModelReleaseResolverCacheV1: () => undefined,
      }),
    );

    try {
      const composition =
        await import("@/studio/composition/StudioDefaultCompositionV2");
      const current = (await import("@/data/model-releases/CurrentModelReleaseV1")).default;
      const currentLock = (await import("@/data/model-releases/standard73/publication.json")).default;
      const surface = (await import("@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV4")).default;
      const revisioned = composition.localCurrentArtifactRevisionUrlV1(
        new URL("http://127.0.0.1:4176/standard72.artifact.mjs?keep=1"),
      );
      expect(revisioned.searchParams.get("revision")).toBe(
        currentLock.artifactRevisionId,
      );
      expect(revisioned.searchParams.get("keep")).toBe("1");
      expect(composition.DEFAULT_STUDIO_MODEL_ID_V2).toBe(current.manifest.modelId);
      const local = await composition.loadStudioLocalCurrentClientCompositionV1();
      expect(local).toMatchObject({
        exactModel: {
          modelId: current.manifest.modelId,
          defaultFixture: current.defaultFixture,
          workerReleaseTicket: {
            moduleAbi: "circleheart-exact-model-esm-v1",
            artifactRevisionId:
              currentLock.artifactRevisionId,
          },
        },
        modelSurface: {
          identity: {
            surfaceReleaseId: surface.surfaceReleaseId,
            surfaceSeriesId: surface.surfaceSeriesId,
          },
        },
      });
      await expect(composition.loadStudioDefaultClientCompositionV2())
        .resolves.toBe(local);
      const experiment = composition.loadStudioExperimentClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId,
      );
      expect(composition.loadStudioExperimentClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId,
      )).toBe(experiment);
      await expect(experiment).resolves.toBe(local);
      const snapshot = composition.loadStudioSnapshotClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId, surface.surfaceReleaseId,
      );
      expect(composition.loadStudioSnapshotClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId, surface.surfaceReleaseId,
      )).toBe(snapshot);
      await expect(snapshot).resolves.toBe(local);
      expect(local.modelSurface.contract.controlCatalog).toHaveLength(53);
      expect(local.modelSurface.contract.graphCatalog).toEqual(
        surface.graphCatalog.map(({ requiredCapabilities: _required, ...graph }) => graph),
      );
      expect(local.modelSurface.contract.outputCatalog.map(({ outputId }) => outputId))
        .toEqual(expect.arrayContaining(surface.derivedOutputCatalog.map(({ outputId }) => outputId)));
      expect(local.modelSurface.analysis.periodicPvaDerivation?.methodId)
        .toBe(MAIN_WIRE_PERIODIC_PVA_METHOD_V15_ID);

      for (const modelId of [
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
        MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
        MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
        MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
        "model/unknown",
      ]) {
        for (const pending of [
          composition.loadStudioExperimentClientCompositionV2(modelId, surface.surfaceSeriesId),
          composition.loadStudioSnapshotClientCompositionV2(
            modelId, surface.surfaceSeriesId, surface.surfaceReleaseId,
          ),
        ]) {
          await expect(pending).rejects.toMatchObject({
            name: "StudioExactModelUnavailableErrorV1",
            reason: "not-registered-or-loadable",
            modelId,
          });
        }
      }
      await expect(composition.loadStudioExperimentClientCompositionV2(
        current.manifest.modelId, "surface/wrong-series",
      )).rejects.toThrow(/cannot resolve the requested exact model/);
      await expect(composition.loadStudioSnapshotClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId, "surface/wrong-release",
      )).rejects.toThrow(/cannot resolve the requested exact model/);
      // A cached snapshot must still reject a different series.
      await expect(composition.loadStudioSnapshotClientCompositionV2(
        current.manifest.modelId, "surface/wrong-series", surface.surfaceReleaseId,
      )).rejects.toThrow(/Surface/);
      composition.invalidateStudioClientCompositionCachesV2();
      expect(composition.loadStudioExperimentClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId,
      )).not.toBe(experiment);
      await expect(composition.loadStudioDefaultClientCompositionV2()).resolves.toBe(local);
    } finally {
      vi.doUnmock("@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1");
      vi.resetModules();
    }
  });

  it("rejects retired remote bundles and preserves supported remote Surface pins", async () => {
    vi.resetModules();
    const current = (await import("@/data/model-releases/CurrentModelReleaseV1")).default;
    const currentLock = (await import("@/data/model-releases/standard73/publication.json")).default;
    const surface = (await import("@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV1")).default;
    const release = {
      defaultFixture: current.defaultFixture,
      stage: "stable",
      surfaceStage: "stable",
      activeBundleVersion: 7,
      ticket: {
        schemaId: STUDIO_MODEL_WORKER_RELEASE_TICKET_V2_SCHEMA_ID,
        modelId: current.manifest.modelId,
        artifactRevisionId:
          currentLock.artifactRevisionId,
        manifest: current.manifest,
        surfaceRelease: { ...surface, surfaceReleaseId: "surface/current/additive-v2" },
        moduleAbi: "circleheart-exact-model-esm-v1",
        artifactUrl: "https://registry.example/standard72.mjs",
      },
    };
    const resolveActiveBundle = vi.fn().mockResolvedValue(release);
    const resolveExactModel = vi.fn().mockResolvedValue(release);
    vi.doMock(
      "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1",
      async (importOriginal) => ({
        ...await importOriginal<
          typeof import("@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1")
        >(),
        studioSupabaseModelReleaseResolverV1: () => ({
          resolveActiveBundle, resolveExactModel,
        }),
        invalidateStudioSupabaseModelReleaseResolverCacheV1: () => undefined,
      }),
    );
    try {
      const composition =
        await import("@/studio/composition/StudioDefaultCompositionV2");
      await expect(composition.loadStudioDefaultClientCompositionV2())
        .resolves.toMatchObject({ activeBundleVersion: 7 });
      await expect(composition.loadStudioExperimentClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId,
      )).resolves.toMatchObject({
        modelSurface: { identity: { surfaceReleaseId: "surface/current/additive-v2" } },
      });
      expect(resolveExactModel).toHaveBeenLastCalledWith(current.manifest.modelId, {
        kind: "series", surfaceSeriesId: surface.surfaceSeriesId,
      });
      await expect(composition.loadStudioSnapshotClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId, "surface/current/additive-v2",
      )).resolves.toMatchObject({
        modelSurface: { identity: { surfaceReleaseId: "surface/current/additive-v2" } },
      });
      expect(resolveExactModel).toHaveBeenLastCalledWith(current.manifest.modelId, {
        kind: "release",
        surfaceSeriesId: surface.surfaceSeriesId,
        surfaceReleaseId: "surface/current/additive-v2",
      });
      resolveExactModel.mockClear();
      await expect(composition.loadStudioExperimentClientCompositionV2(
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1, surface.surfaceSeriesId,
      )).rejects.toMatchObject({ name: "StudioExactModelUnavailableErrorV1" });
      expect(resolveExactModel).not.toHaveBeenCalled();

      const retired = { ...release, ticket: {
        ...release.ticket, modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
      } };
      resolveActiveBundle.mockResolvedValueOnce(retired);
      composition.invalidateStudioClientCompositionCachesV2();
      await expect(composition.loadStudioDefaultClientCompositionV2())
        .rejects.toMatchObject({ name: "StudioExactModelUnavailableErrorV1" });
      // Rejection must not poison the cache or silently substitute a local model.
      await expect(composition.loadStudioDefaultClientCompositionV2())
        .resolves.toMatchObject({ activeBundleVersion: 7 });
      resolveExactModel.mockResolvedValueOnce(retired);
      await expect(composition.loadStudioExperimentClientCompositionV2(
        current.manifest.modelId, surface.surfaceSeriesId,
      )).rejects.toMatchObject({ name: "StudioExactModelUnavailableErrorV1" });
    } finally {
      vi.doUnmock("@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1");
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
    expect(() => validateStudioModelWorkerReleaseTicketV2({
      ...ticket,
      analysisProfileId: "retired-profile",
    })).toThrow(/optional keys are none/);
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
      contract: { modelId: mainWireIntegratedStudioStandardClientV1.manifest.modelId },
      simulationAdapter: {
        modelId: mainWireIntegratedStudioStandardClientV1.manifest.modelId,
      },
    });
    const loaded = await first;
    expect(loaded.contract.outputCatalog.some(({ outputId }) =>
      MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1.some(
        (analysisOutputId) => analysisOutputId === outputId,
      ))).toBe(true);
    expect(loaded.contract.graphCatalog.length).toBeGreaterThan(0);
    expect(loaded.exactContract.graphCatalog).toHaveLength(0);
    expect(loaded.exactContract.outputCatalog.some(({ outputId }) =>
      MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1.some(
        (analysisOutputId) => analysisOutputId === outputId,
      ))).toBe(false);
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
      modelId: mainWireIntegratedStudioStandardClientV1.manifest.modelId,
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
          fixture: mainWireIntegratedStudioStandardClientV1.defaultFixture,
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
      contract: { modelId: mainWireIntegratedStudioStandardClientV1.manifest.modelId },
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

  it("pins derived analysis methods in Surface without expanding exact identity", () => {
    const exact = mainWireIntegratedStudioStandardClientV1.manifest;
    const exactOutputIds = new Set([
      ...exact.primitiveSignalCatalog,
      ...exact.modelMetricCatalog,
    ].map(({ outputId }) => outputId));
    for (const outputId of
      MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1) {
      expect(exactOutputIds.has(outputId)).toBe(false);
    }
    expect(exact.capabilities.some((capability) =>
      capability.startsWith("derivation/"))).toBe(false);

    const methods = resolveMainWireAnalysisMethodsForSurfaceV1(
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    expect(methods.capabilities).toContain(
      derivationCapabilityV1(
        MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID,
      ),
    );
    expect(methods.resolveExecutionPlan(
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
    )).not.toBeNull();
    expect(methods.periodicPvaDerivation?.methodId).toBe(
      MAIN_WIRE_PERIODIC_PVA_METHOD_V14_ID,
    );
    const composition = composeStandardModelContractV1(
      exact,
      mainWireIntegratedStudioStandardSurfaceV1,
      methods.capabilities,
    );
    expect(composition.contract.modelId).toBe(exact.modelId);
    expect(composition.contract.outputCatalog
      .filter(({ outputId }) =>
        MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1
          .some((analysisOutputId) => analysisOutputId === outputId))
      .map(({ outputId }) => outputId)).toEqual(
      MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1,
    );

    const unsupported = mutableClone(
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    unsupported.derivedOutputCatalog = unsupported.derivedOutputCatalog.map(
      (output) => ({
        ...output,
        derivationId: "analysis-method/unavailable-v1",
        requiredCapabilities: output.requiredCapabilities.map((capability) =>
          capability.startsWith("derivation/")
            ? "derivation/analysis-method/unavailable-v1"
            : capability),
      }),
    );
    assertModelSurfaceReleaseManifestV1(unsupported);
    expect(() => resolveMainWireAnalysisMethodsForSurfaceV1(
      unsupported,
    )).toThrow(/Client does not support analysis derivation/);

    const wrongUnit = mutableClone(
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    wrongUnit.derivedOutputCatalog[0]!.unit = "kJ";
    assertModelSurfaceReleaseManifestV1(wrongUnit);
    expect(() => resolveMainWireAnalysisMethodsForSurfaceV1(
      wrongUnit,
    )).toThrow(/incompatible with Surface/);

  });

  it("lets Surface explicitly expose exact outputs without leaking later primitives", () => {
    const exact = mainWireIntegratedStudioStandardClientV1.manifest;
    const exactOutputIds = [
      ...exact.primitiveSignalCatalog,
      ...exact.modelMetricCatalog,
    ].map(({ outputId }) => outputId);
    expect(
      mainWireIntegratedStudioStandardSurfaceV1.exposedExactOutputIds,
    ).toEqual(exactOutputIds);

    const futureExact = structuredClone(exact);
    futureExact.modelId =
      "circleheart.main-wire-integrated-transaction-v3.test-future-primitive";
    const futureOutputId = "research.future-primitive.signal";
    futureExact.primitiveSignalCatalog.push({
      ...futureExact.primitiveSignalCatalog[0]!,
      outputId: futureOutputId,
    });
    futureExact.capabilities.push(outputCapabilityV1(futureOutputId));
    assertExactModelKernelManifestV3(futureExact);

    const methods = resolveMainWireAnalysisMethodsForSurfaceV1(
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    const composition = composeStandardModelContractV1(
      futureExact,
      mainWireIntegratedStudioStandardSurfaceV1,
      methods.capabilities,
    );
    expect(composition.exactContract.outputCatalog.some(
      ({ outputId }) => outputId === futureOutputId,
    )).toBe(true);
    expect(composition.contract.outputCatalog.some(
      ({ outputId }) => outputId === futureOutputId,
    )).toBe(false);
    expect(composition.exactContract.displayName).toBe(futureExact.modelId);
    expect(composition.contract.displayName).toBe(
      mainWireIntegratedStudioStandardSurfaceV1.displayName,
    );

    const incompatibleExactExposure = mutableClone(
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    incompatibleExactExposure.exposedExactOutputIds.push(
      "research.unsupported-exact-output",
    );
    expect(() => composeStandardModelContractV1(
      exact,
      incompatibleExactExposure,
      methods.capabilities,
    )).toThrow(/unsupported by the pinned exact model/);

    const validatedCurrentSurface: unknown =
      mainWireIntegratedStudioStandardSurfaceV1;
    assertModelSurfaceReleaseManifestV1(validatedCurrentSurface);
    expect(() => assertModelSurfaceReleaseLineageV1(
      validatedCurrentSurface,
    )).not.toThrow();
    expect(() => assertModelSurfaceReleaseLineageV1(
      validatedCurrentSurface,
      validatedCurrentSurface,
    )).toThrow(/root Surface release must not supply a predecessor/);
    const incompatibleSuccessor: any = mutableClone(
      mainWireIntegratedStudioStandardSurfaceV1,
    );
    incompatibleSuccessor.surfaceReleaseId =
      "circleheart.main-wire.surface.workbench-analysis-v2-test";
    incompatibleSuccessor.predecessorSurfaceReleaseId =
      mainWireIntegratedStudioStandardSurfaceV1.surfaceReleaseId;
    incompatibleSuccessor.exposedExactOutputIds.pop();
    const validatedSuccessor: unknown = incompatibleSuccessor;
    assertModelSurfaceReleaseManifestV1(validatedSuccessor);
    expect(() => assertModelSurfaceReleaseLineageV1(
      validatedSuccessor,
    )).toThrow(/requires predecessor/);
    expect(() => assertAdditiveModelSurfaceUpgradeV1(
      validatedCurrentSurface,
      validatedSuccessor,
    )).toThrow(/cannot hide exact output/);
    expect(() => assertModelSurfaceReleaseLineageV1(
      validatedSuccessor,
      validatedCurrentSurface,
    )).toThrow(/cannot hide exact output/);
  });

  it("keeps controls in Surface and never introduces a ParameterSet", () => {
    const composition = composeStandardModelContractV1(
      mainWireIntegratedStudioStandardClientV1.manifest,
      mainWireIntegratedStudioStandardSurfaceV1,
      resolveMainWireAnalysisMethodsForSurfaceV1(
        mainWireIntegratedStudioStandardSurfaceV1,
      ).capabilities,
    );
    expect(composition.contract.modelId).toBe(
      mainWireIntegratedStudioStandardClientV1.manifest.modelId,
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

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
function mutableClone<T>(value: T): Mutable<T> { return structuredClone(value) as Mutable<T>; }

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
