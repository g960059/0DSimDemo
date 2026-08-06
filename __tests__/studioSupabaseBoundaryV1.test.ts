import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

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

describe("Studio Supabase boundary V1", () => {
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
