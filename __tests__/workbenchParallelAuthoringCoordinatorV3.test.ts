import { describe, expect, it, vi } from "vitest";
import {
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
  type ExperimentScenarioV2,
  type ExperimentSnapshotV2,
  type ExperimentSurfaceV2,
  type ExperimentWorkspaceV2,
} from "@/studio/contracts/v2/content";
import type {
  StudioSimulationWorkerQualifiedSnapshotCommitV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import {
  StudioSimulationWorkerClientV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import {
  WorkbenchParallelAuthoringCoordinatorV3,
  type WorkbenchParallelAuthoringInputV3,
} from "@/components/workbench/v3/WorkbenchParallelAuthoringCoordinatorV3";

describe("WorkbenchParallelAuthoringCoordinatorV3", () => {
  it("seeds an existing Draft with the latest ordered lane captures", async () => {
    const durableWorkspace = workspaceV3({
      draftVersion: 7,
      scenarios: [scenarioV3("scenario/baseline", "Baseline", 1)],
    });
    const currentScenarios = [
      scenarioV3("scenario/baseline", "Baseline", 11),
      scenarioV3("scenario/comparison", "Comparison", 23),
    ];
    const nextSurface = surfaceV3("Latest surface");
    const savedWorkspace = workspaceV3({
      draftVersion: 8,
      scenarios: currentScenarios,
      surface: nextSurface,
    });
    const client = clientDoubleV3();
    client.saveDraft.mockResolvedValue(savedWorkspace);
    const coordinator = new WorkbenchParallelAuthoringCoordinatorV3(
      () => client as unknown as StudioSimulationWorkerClientV2,
    );

    await expect(coordinator.saveDraft(inputV3({
      scenarios: currentScenarios,
      activeScenarioId: "scenario/comparison",
      surface: nextSurface,
      workspace: durableWorkspace,
    }))).resolves.toBe(savedWorkspace);

    expect(client.initialize).toHaveBeenCalledOnce();
    const initialized = client.initialize.mock.calls[0]![0];
    expect(initialized).toMatchObject({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/authoring-1",
      scenarioId: "scenario/comparison",
      scenarioLabel: "Comparison",
      fixture: { value: 23 },
      checkpoint: {
        acceptedRevision: 23,
        acceptedTimeSec: 2.3,
      },
    });
    expect(initialized.authoringSeed.workspace).toMatchObject({
      experimentId: "experiment/workbench",
      draftVersion: 7,
      content: {
        scenarios: currentScenarios,
        surface: nextSurface,
      },
    });
    expect(client.saveDraft).toHaveBeenCalledWith({
      runtimeSessionId: "runtime/authoring-1",
      scenarioId: "scenario/comparison",
      experimentId: "experiment/workbench",
      surface: nextSurface,
      expectedDraftVersion: 7,
    });
    expect(client.terminate).toHaveBeenCalledOnce();
  });

  it("assembles every exact Scenario through Presets on first Save", async () => {
    const scenarios = [
      scenarioV3("scenario/baseline", "Baseline", 5),
      scenarioV3("scenario/comparison", "Comparison", 8),
      scenarioV3("scenario/device", "Device", 13),
    ];
    const savedWorkspace = workspaceV3({
      draftVersion: 0,
      scenarios,
    });
    const client = clientDoubleV3();
    client.saveDraft.mockResolvedValue(savedWorkspace);
    const coordinator = new WorkbenchParallelAuthoringCoordinatorV3(
      () => client as unknown as StudioSimulationWorkerClientV2,
    );

    const saved = await coordinator.saveDraft(inputV3({
      scenarios,
      activeScenarioId: "scenario/baseline",
      workspace: null,
    }));

    expect(saved).toBe(savedWorkspace);
    expect(client.initialize).toHaveBeenCalledWith({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/authoring-1",
      scenarioId: "scenario/baseline",
      scenarioLabel: "Baseline",
      fixture: { value: 5 },
      checkpoint: scenarios[0]!.capture.checkpoint,
    });
    expect(client.initialize.mock.calls[0]![0]).not.toHaveProperty(
      "authoringSeed",
    );
    expect(client.addScenarioFromPreset).toHaveBeenCalledTimes(2);
    expect(client.addScenarioFromPreset).toHaveBeenNthCalledWith(1, {
      runtimeSessionId: "runtime/authoring-1",
      scenarioId: "scenario/comparison",
      label: "Comparison",
      preset: expect.objectContaining({
        presetId: "transient/parallel-authoring/1",
        modelId: "model/main-wire-v3-r1",
        capture: scenarios[1]!.capture,
      }),
    });
    expect(client.addScenarioFromPreset).toHaveBeenNthCalledWith(2, {
      runtimeSessionId: "runtime/authoring-1",
      scenarioId: "scenario/device",
      label: "Device",
      preset: expect.objectContaining({
        presetId: "transient/parallel-authoring/2",
        modelId: "model/main-wire-v3-r1",
        capture: scenarios[2]!.capture,
      }),
    });
    expect(client.selectScenario).toHaveBeenCalledWith({
      runtimeSessionId: "runtime/authoring-1",
      scenarioId: "scenario/baseline",
    });
    expect(client.saveDraft).toHaveBeenCalledWith(expect.objectContaining({
      scenarioId: "scenario/baseline",
      expectedDraftVersion: null,
    }));
    expect(client.initialize.mock.invocationCallOrder[0]).toBeLessThan(
      client.addScenarioFromPreset.mock.invocationCallOrder[0]!,
    );
    expect(client.selectScenario.mock.invocationCallOrder[0]).toBeLessThan(
      client.saveDraft.mock.invocationCallOrder[0]!,
    );
    expect(client.terminate).toHaveBeenCalledOnce();
  });

  it("returns the Worker's sealed qualified Snapshot commit unchanged", async () => {
    const durableScenario = scenarioV3(
      "scenario/baseline",
      "Durable Baseline",
      3,
    );
    const liveScenario = scenarioV3(
      "scenario/baseline",
      "Live Baseline",
      31,
    );
    const workspace = workspaceV3({
      draftVersion: 9,
      scenarios: [durableScenario],
    });
    const commit = Object.freeze({
      snapshot: snapshotV3("snapshot/next", workspace),
      workspace: workspaceV3({
        draftVersion: 10,
        scenarios: [durableScenario],
      }),
    }) as unknown as StudioSimulationWorkerQualifiedSnapshotCommitV2;
    const client = clientDoubleV3();
    client.createSnapshot.mockResolvedValue(commit);
    const coordinator = new WorkbenchParallelAuthoringCoordinatorV3(
      () => client as unknown as StudioSimulationWorkerClientV2,
    );

    const created = await coordinator.createSnapshot(inputV3({
      scenarios: [liveScenario],
      activeScenarioId: liveScenario.scenarioId,
      workspace,
    }));

    expect(created).toBe(commit);
    expect(client.initialize).toHaveBeenCalledWith(expect.objectContaining({
      scenarioId: durableScenario.scenarioId,
      scenarioLabel: durableScenario.label,
      fixture: durableScenario.capture.fixture,
      checkpoint: durableScenario.capture.checkpoint,
      authoringSeed: expect.objectContaining({ workspace }),
    }));
    expect(client.createSnapshot).toHaveBeenCalledWith({
      runtimeSessionId: "runtime/authoring-1",
      scenarioId: "scenario/baseline",
      experimentId: "experiment/workbench",
      expectedDraftVersion: 9,
      expectedHeadSnapshotId: null,
    });
    expect(client.terminate).toHaveBeenCalledOnce();
  });

  it("terminates a transient client when an authoring operation rejects", async () => {
    const client = clientDoubleV3();
    client.saveDraft.mockRejectedValue(new Error("capture failed"));
    const coordinator = new WorkbenchParallelAuthoringCoordinatorV3(
      () => client as unknown as StudioSimulationWorkerClientV2,
    );

    await expect(coordinator.saveDraft(inputV3({
      scenarios: [scenarioV3("scenario/baseline", "Baseline", 2)],
      activeScenarioId: "scenario/baseline",
      workspace: null,
    }))).rejects.toThrow("capture failed");
    expect(client.terminate).toHaveBeenCalledOnce();
  });

  it("rejects empty or non-member Scenario inputs before allocating a Worker", async () => {
    const factory = vi.fn(() =>
      clientDoubleV3() as unknown as StudioSimulationWorkerClientV2);
    const coordinator = new WorkbenchParallelAuthoringCoordinatorV3(factory);

    await expect(coordinator.saveDraft(inputV3({
      scenarios: [],
      activeScenarioId: "scenario/missing",
      workspace: null,
    }))).rejects.toThrow(/at least one Scenario/);
    await expect(coordinator.saveDraft(inputV3({
      scenarios: [scenarioV3("scenario/baseline", "Baseline", 1)],
      activeScenarioId: "scenario/missing",
      workspace: null,
    }))).rejects.toThrow(/not in the gathered captures/);
    await expect(coordinator.saveDraft(inputV3({
      workspace: null,
      snapshots: [snapshotV3(
        "snapshot/orphan",
        workspaceV3({
          draftVersion: 1,
          scenarios: [scenarioV3("scenario/baseline", "Baseline", 1)],
        }),
      )],
    }))).rejects.toThrow(/without their Workspace/);
    expect(factory).not.toHaveBeenCalled();
  });
});

function clientDoubleV3() {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    addScenarioFromPreset: vi.fn().mockResolvedValue(undefined),
    selectScenario: vi.fn().mockResolvedValue(undefined),
    saveDraft: vi.fn(),
    createSnapshot: vi.fn(),
    terminate: vi.fn(),
  };
}

function inputV3(
  overrides: Partial<WorkbenchParallelAuthoringInputV3>,
): WorkbenchParallelAuthoringInputV3 {
  return {
    modelId: "model/main-wire-v3-r1",
    scenarios: [scenarioV3("scenario/baseline", "Baseline", 1)],
    activeScenarioId: "scenario/baseline",
    surface: surfaceV3("Workbench note"),
    workspace: null,
    snapshots: [],
    experimentId: "experiment/workbench",
    runtimeSessionId: "runtime/authoring-1",
    ...overrides,
  };
}

function scenarioV3(
  scenarioId: string,
  label: string,
  clock: number,
): ExperimentScenarioV2 {
  return {
    scenarioId,
    label,
    capture: {
      fixture: { value: clock },
      checkpoint: {
        acceptedRevision: clock,
        acceptedTimeSec: clock / 10,
        payload: { state: [clock] },
      },
    },
  };
}

function surfaceV3(note: string): ExperimentSurfaceV2 {
  return {
    graphPanes: [],
    outputPanes: [],
    controlPanes: [],
    note: { text: note },
  };
}

function workspaceV3(input: Readonly<{
  draftVersion: number;
  scenarios: readonly ExperimentScenarioV2[];
  surface?: ExperimentSurfaceV2;
}>): ExperimentWorkspaceV2 {
  return {
    schemaId: STUDIO_EXPERIMENT_WORKSPACE_V2_SCHEMA_ID,
    experimentId: "experiment/workbench",
    draftVersion: input.draftVersion,
    headSnapshotId: null,
    basedOnSnapshotId: null,
    content: {
      modelId: "model/main-wire-v3-r1",
      scenarios: input.scenarios,
      surface: input.surface ?? surfaceV3("Workbench note"),
    },
  };
}

function snapshotV3(
  snapshotId: string,
  workspace: ExperimentWorkspaceV2,
): ExperimentSnapshotV2 {
  return {
    schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
    snapshotId,
    experimentId: workspace.experimentId,
    parentSnapshotId: workspace.basedOnSnapshotId,
    content: workspace.content,
    createdAt: "2026-08-01T00:00:00.000Z",
  };
}
