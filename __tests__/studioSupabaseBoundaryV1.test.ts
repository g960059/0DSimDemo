import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExperimentContentV2 } from "@/studio/contracts/v2/content";
import {
  ensureStudioAuthenticatedForSaveV1,
  studioAuthIdentityForUserV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseAuthV1";
import {
  readStudioSupabaseConfigurationV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseClientV1";
import {
  StudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  StudioExactModelUnavailableErrorV1,
  StudioSupabaseModelReleaseResolverV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import {
  StudioSupabaseModelSurfaceResolverV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelSurfaceResolverV1";
import {
  STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/modelSurface";
import {
  createMainWireIntegratedStudioModelPackageV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3";
import standardClientDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import standardSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-standard-v1.json";

describe("Studio Supabase boundary V1", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("accepts only a complete public browser configuration", () => {
    expect(readStudioSupabaseConfigurationV1({})).toBeNull();
    expect(() => readStudioSupabaseConfigurationV1({
      VITE_SUPABASE_URL: "https://project.supabase.co",
    })).toThrow(/both URL and publishable key/);
    expect(() => readStudioSupabaseConfigurationV1({
      VITE_SUPABASE_URL: "https://project.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_never-in-browser",
    })).toThrow(/publishable key/);
    expect(readStudioSupabaseConfigurationV1({
      VITE_SUPABASE_URL: "https://project.supabase.co/path",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser",
    })).toEqual({
      url: "https://project.supabase.co",
      publishableKey: "sb_publishable_browser",
    });
  });

  it("resolves a hash-free exact model ticket and owns its launch fixture", async () => {
    const modelPackage = createMainWireIntegratedStudioModelPackageV3();
    const call = vi.fn().mockResolvedValue({
      data: [{
        model_id: modelPackage.manifest.modelId,
        model_family_id: modelPackage.manifest.modelFamilyId,
        display_name: modelPackage.manifest.displayName,
        manifest: modelPackage.manifest,
        artifact_path: "model-releases/exact/model.mjs",
        module_abi: "legacy-main-wire-v3-development-36",
        default_fixture: modelPackage.defaultFixture,
        analysis_profile_id: "main-wire-integrated-v3",
        stage: "stable",
      }],
      error: null,
    });
    const resolver = new StudioSupabaseModelReleaseResolverV1({
      rpc: { call },
      supabaseOrigin: "https://project.supabase.co/path-is-ignored",
    });

    const first = resolver.resolveExactModel(modelPackage.manifest.modelId);
    expect(resolver.resolveExactModel(modelPackage.manifest.modelId)).toBe(first);
    const resolved = await first;
    expect(resolved).toMatchObject({
      contract: { modelId: modelPackage.manifest.modelId },
      defaultFixture: modelPackage.defaultFixture,
      analysisProfileId: "main-wire-integrated-v3",
      stage: "stable",
      ticket: {
        modelId: modelPackage.manifest.modelId,
        moduleAbi: "legacy-main-wire-v3-development-36",
        artifactUrl:
          "https://project.supabase.co/storage/v1/object/public/model-releases/exact/model.mjs",
      },
    });
    expect(resolved.ticket).not.toHaveProperty("artifactSha256");
    expect(resolved.ticket).not.toHaveProperty("registryFingerprint");
    expect(Object.isFrozen(resolved.defaultFixture)).toBe(true);
    expect(call).toHaveBeenCalledOnce();
  });

  it("keeps an old exact release pinned after the default channel moves", async () => {
    const modelPackage = createMainWireIntegratedStudioModelPackageV3();
    const modelA = modelPackage.manifest.modelId;
    const modelB = modelA.replace("development-36", "standard-abi-test-1");
    const manifestB = {
      ...JSON.parse(JSON.stringify(modelPackage.manifest)),
      modelId: modelB,
    };
    const row = (
      modelId: string,
      manifest: unknown,
      moduleAbi: string,
    ) => ({
      model_id: modelId,
      model_family_id: modelPackage.manifest.modelFamilyId,
      display_name: modelPackage.manifest.displayName,
      manifest,
      artifact_path: `model-releases/exact/${encodeURIComponent(modelId)}.mjs`,
      module_abi: moduleAbi,
      default_fixture: modelPackage.defaultFixture,
      analysis_profile_id: "main-wire-integrated-v3",
      stage: "stable",
    });
    let channelRow = row(
      modelA,
      modelPackage.manifest,
      "legacy-main-wire-v3-development-36",
    );
    const call = vi.fn(async (
      functionName: "get_model_release_v3" | "get_model_release_channel_v3",
      parameters: Readonly<Record<string, string>>,
    ) => ({
      data: [functionName === "get_model_release_channel_v3"
        ? channelRow
        : parameters.p_model_id === modelA
          ? row(
              modelA,
              modelPackage.manifest,
              "legacy-main-wire-v3-development-36",
            )
          : row(modelB, manifestB, "legacy-main-wire-v3-development-36")],
      error: null,
    }));
    const resolver = new StudioSupabaseModelReleaseResolverV1({
      rpc: { call },
      supabaseOrigin: "https://project.supabase.co",
    });

    const exactA = await resolver.resolveExactModel(modelA);
    expect((await resolver.resolveChannel("default")).contract.modelId)
      .toBe(modelA);
    channelRow = row(
      modelB,
      manifestB,
      "legacy-main-wire-v3-development-36",
    );
    expect((await resolver.resolveChannel("default")).contract.modelId)
      .toBe(modelB);
    await expect(resolver.resolveExactModel(modelA)).resolves.toBe(exactA);
    expect(exactA.contract.modelId).toBe(modelA);
  });

  it("reports an unavailable exact release without substituting a channel", async () => {
    const call = vi.fn().mockResolvedValue({ data: [], error: null });
    const resolver = new StudioSupabaseModelReleaseResolverV1({
      rpc: { call },
      supabaseOrigin: "https://project.supabase.co",
    });

    const failure = await resolver.resolveExactModel("model/historical-a")
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(StudioExactModelUnavailableErrorV1);
    expect(failure).toMatchObject({
      modelId: "model/historical-a",
      reason: "not-registered-or-loadable",
    });
    expect(call).toHaveBeenCalledOnce();
    expect(call).toHaveBeenCalledWith(
      "get_model_release_v3",
      { p_model_id: "model/historical-a" },
    );
  });

  it("resolves a Surface separately and rejects a family mismatch", async () => {
    const modelPackage = createMainWireIntegratedStudioModelPackageV3();
    const exact = new StudioSupabaseModelReleaseResolverV1({
      rpc: {
        call: vi.fn().mockResolvedValue({
          data: [{
            model_id: modelPackage.manifest.modelId,
            model_family_id: modelPackage.manifest.modelFamilyId,
            display_name: modelPackage.manifest.displayName,
            manifest: modelPackage.manifest,
            artifact_path: "model-releases/exact/model.mjs",
            module_abi: "legacy-main-wire-v3-development-36",
            default_fixture: modelPackage.defaultFixture,
            analysis_profile_id: "main-wire-integrated-v3",
            stage: "stable",
          }],
          error: null,
        }),
      },
      supabaseOrigin: "https://project.supabase.co",
    });
    const model = (await exact.resolveExactModel(modelPackage.manifest.modelId))
      .contract;
    const manifest = {
      schemaId: STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
      surfaceReleaseId: "surface/main-wire-v1",
      surfaceSeriesId: "surface-series/main-wire",
      predecessorSurfaceReleaseId: null,
      modelFamilyId: model.modelFamilyId,
      displayName: "Main Wire Surface",
      controlCatalog: [],
      derivedOutputCatalog: [],
      graphCatalog: [],
      knobCatalog: [],
      protocolCatalog: [],
    } as const;
    const call = vi.fn().mockResolvedValue({
      data: [{ manifest, stage: "dev" }],
      error: null,
    });
    const resolver = new StudioSupabaseModelSurfaceResolverV1({ rpc: { call } });

    await expect(resolver.resolveChannel("research", model)).resolves.toEqual({
      manifest,
      materialized: {
        surfaceReleaseId: manifest.surfaceReleaseId,
        modelFamilyId: manifest.modelFamilyId,
        controlCatalog: [],
        derivedOutputCatalog: [],
        graphCatalog: [],
        knobCatalog: [],
        protocolCatalog: [],
      },
      stage: "dev",
    });
    const resolvedSurface = await resolver.resolveChannel("research", model);
    expect(Object.isFrozen(resolvedSurface.manifest)).toBe(true);
    expect(Object.isFrozen(resolvedSurface.manifest.controlCatalog)).toBe(true);
    expect(Object.isFrozen(resolvedSurface.materialized)).toBe(true);
    expect(call).toHaveBeenCalledWith(
      "get_model_surface_release_channel_v1",
      {
        p_model_family_id: model.modelFamilyId,
        p_channel: "research",
      },
    );

    const wrongFamily = {
      ...manifest,
      surfaceReleaseId: "surface/other-v1",
      modelFamilyId: "model/other-family",
    };
    call.mockResolvedValueOnce({
      data: [{ manifest: wrongFamily, stage: "stable" }],
      error: null,
    });
    await expect(resolver.resolveChannel("default", model))
      .rejects.toThrow(/must match model family/);

    const newerSurface = {
      ...manifest,
      surfaceReleaseId: "surface/main-wire-v2",
      predecessorSurfaceReleaseId: manifest.surfaceReleaseId,
      graphCatalog: [{
        graphId: "graph.future-signal",
        renderer: "sweep",
        seriesCatalog: [{
          kind: "scalar",
          seriesId: "future-signal",
          outputId: "signal/future",
        }],
        defaultSeriesIds: ["future-signal"],
        requiredCapabilities: ["output/signal/future"],
      }],
    } as const;
    call.mockResolvedValueOnce({
      data: [{ manifest: newerSurface, stage: "stable" }],
      error: null,
    });
    const historicalModelSurface = await resolver.resolveChannel(
      "research",
      model,
    );
    expect(historicalModelSurface.manifest.surfaceReleaseId)
      .toBe(newerSurface.surfaceReleaseId);
    expect(historicalModelSurface.manifest.graphCatalog).toHaveLength(1);
    expect(historicalModelSurface.materialized.graphCatalog).toEqual([]);
  });

  it("reopens a mutable Standard Experiment on the latest additive Surface while a Snapshot stays exact", async () => {
    const surfaceV1 = structuredClone(standardSurfaceReleaseV1) as any;
    const surfaceV2 = {
      ...structuredClone(surfaceV1),
      surfaceReleaseId: "circleheart.main-wire.surface.standard-v2-test",
      predecessorSurfaceReleaseId: surfaceV1.surfaceReleaseId,
      controlCatalog: [...surfaceV1.controlCatalog, {
        controlId: "hemodynamics.pulmonary-resistance",
        preferredPresentation: "slider",
        requiredCapabilities: [
          "control/hemodynamics.pulmonary-resistance",
        ],
      }],
    };
    let latestSurface = surfaceV1;
    const surfaceCall = vi.fn(async (
      functionName: string,
      parameters: Readonly<Record<string, string>>,
    ) => ({
      data: [{
        manifest: functionName === "get_model_surface_release_v1"
          ? parameters.p_surface_release_id === surfaceV1.surfaceReleaseId
            ? surfaceV1
            : surfaceV2
          : latestSurface,
        stage: "dev",
      }],
      error: null,
    }));
    const exactCall = vi.fn().mockResolvedValue({
      data: [{
        model_id: standardClientDescriptorV1.manifest.modelId,
        model_family_id: standardClientDescriptorV1.manifest.modelFamilyId,
        display_name: "Main Wire Standard",
        manifest: standardClientDescriptorV1.manifest,
        artifact_path: "model-releases/exact/standard.mjs",
        module_abi: "circleheart-exact-model-esm-v1",
        default_fixture: standardClientDescriptorV1.defaultFixture,
        analysis_profile_id: "main-wire-integrated-v3",
        stage: "dev",
      }],
      error: null,
    });
    const createResolver = () => new StudioSupabaseModelReleaseResolverV1({
      rpc: { call: exactCall },
      supabaseOrigin: "https://project.supabase.co",
      surfaceResolver: new StudioSupabaseModelSurfaceResolverV1({
        rpc: { call: surfaceCall as any },
      }),
    });
    const seriesPin = {
      kind: "series" as const,
      surfaceSeriesId: surfaceV1.surfaceSeriesId,
    };

    const firstOpen = await createResolver().resolveExactModel(
      standardClientDescriptorV1.manifest.modelId,
      seriesPin,
    );
    expect(firstOpen.surfaceReleaseId).toBe(surfaceV1.surfaceReleaseId);

    latestSurface = surfaceV2;
    const reopened = await createResolver().resolveExactModel(
      standardClientDescriptorV1.manifest.modelId,
      seriesPin,
    );
    expect(reopened.surfaceReleaseId).toBe(surfaceV2.surfaceReleaseId);
    expect(reopened.contract.controlCatalog.some((control) =>
      control.controlId === "hemodynamics.pulmonary-resistance"))
      .toBe(true);

    const frozenSnapshot = await createResolver().resolveExactModel(
      standardClientDescriptorV1.manifest.modelId,
      {
        kind: "release",
        surfaceSeriesId: surfaceV1.surfaceSeriesId,
        surfaceReleaseId: surfaceV1.surfaceReleaseId,
      },
    );
    expect(frozenSnapshot.surfaceReleaseId).toBe(surfaceV1.surfaceReleaseId);
    expect(frozenSnapshot.contract.controlCatalog.some((control) =>
      control.controlId === "hemodynamics.pulmonary-resistance"))
      .toBe(false);
  });

  it("creates an anonymous account only when a Save asks for authentication", async () => {
    const session = { access_token: "token" };
    const getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const signInAnonymously = vi.fn().mockResolvedValue({
      data: { session },
      error: null,
    });
    const client = {
      auth: { getSession, signInAnonymously },
    } as unknown as SupabaseClient;

    await expect(ensureStudioAuthenticatedForSaveV1(client))
      .resolves.toBe(session);
    expect(getSession).toHaveBeenCalledOnce();
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("keeps anonymous backend identity out of the visible profile", () => {
    expect(studioAuthIdentityForUserV1({
      id: "anonymous-user",
      is_anonymous: true,
    } as never)).toEqual({ kind: "anonymous", userId: "anonymous-user" });
    expect(studioAuthIdentityForUserV1({
      id: "account-user",
      is_anonymous: false,
      email: "author@example.com",
      user_metadata: { full_name: "Circle Author" },
    } as never)).toMatchObject({
      kind: "account",
      userId: "account-user",
      displayName: "Circle Author",
      email: "author@example.com",
    });
  });

  it("lets the backend issue the durable Experiment identity on first Save", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        experimentId: "8d8f9f03-e81d-4dc7-8320-7f71367a63c4",
        version: 0,
        title: "Baseline",
        modelId: "model/exact-v3",
        content: experimentContentV1(),
      },
      error: null,
    });
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "author" } } },
          error: null,
        }),
      },
      rpc,
    } as unknown as SupabaseClient;
    const repository = new StudioSupabaseContentRepositoryV1(client);

    const saved = await repository.saveExperiment({
      experimentId: null,
      expectedVersion: null,
      title: "Baseline",
      content: experimentContentV1(),
    });

    expect(saved.experimentId).toBe("8d8f9f03-e81d-4dc7-8320-7f71367a63c4");
    expect(rpc).toHaveBeenCalledWith("save_experiment_v1", expect.objectContaining({
      p_experiment_id: null,
      p_expected_version: null,
      p_model_id: "model/exact-v3",
    }));
  });

  it("reuses the same operation ID when an acknowledged response may have been lost", async () => {
    const stored = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
      removeItem: (key: string) => stored.delete(key),
    });
    const rpc = vi.fn()
      .mockResolvedValueOnce({
        data: null,
        error: new Error("network response lost"),
      })
      .mockResolvedValueOnce({
        data: {
          experimentId: "8d8f9f03-e81d-4dc7-8320-7f71367a63c4",
          version: 0,
        },
        error: null,
      });
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "author" } } },
          error: null,
        }),
      },
      rpc,
    } as unknown as SupabaseClient;
    const command = {
      experimentId: null,
      expectedVersion: null,
      title: "Baseline",
      content: experimentContentV1(),
    } as const;

    await expect(
      new StudioSupabaseContentRepositoryV1(client).saveExperiment(command),
    ).rejects.toThrow(
      /network response lost/,
    );
    // A fresh repository instance represents a reload in the same browser
    // tab; session storage must carry the unacknowledged operation UUID.
    await expect(
      new StudioSupabaseContentRepositoryV1(client).saveExperiment(command),
    ).resolves.toMatchObject({
      experimentId: "8d8f9f03-e81d-4dc7-8320-7f71367a63c4",
      version: 0,
      content: command.content,
    });

    const firstOperationId = rpc.mock.calls[0]?.[1]?.p_operation_id;
    const retriedOperationId = rpc.mock.calls[1]?.[1]?.p_operation_id;
    expect(firstOperationId).toEqual(expect.any(String));
    expect(retriedOperationId).toBe(firstOperationId);
    expect(stored.size).toBe(0);
  });
});

function experimentContentV1(): ExperimentContentV2 {
  return {
    modelId: "model/exact-v3",
    scenarios: [{
      scenarioId: "scenario/baseline",
      label: "Baseline",
      capture: {
        fixture: { control: 1 },
        checkpoint: {
          acceptedRevision: 4,
          acceptedTimeSec: 0.008,
          payload: { state: [1, 2, 3] },
        },
      },
    }],
    surface: {
      graphPanes: [{
        paneId: "pane/waveform",
        role: "graph",
        label: "Waveform",
        order: 0,
        priority: 10,
        graphId: "graph/waveform",
        scenarioScope: { mode: "visible-scenarios" },
        excludedTraces: [],
        windowSec: 2,
        series: [],
      }],
      outputPanes: [],
      controlPanes: [],
      note: { text: "" },
    },
  };
}
