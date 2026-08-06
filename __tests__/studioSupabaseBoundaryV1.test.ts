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
  StudioSupabaseModelReleaseResolverV1,
} from "@/studio/infrastructure/model/StudioSupabaseModelReleaseResolverV1";
import {
  createMainWireIntegratedStudioModelPackageV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3";

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
