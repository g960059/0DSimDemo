import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ScientificWorkbenchOfficialCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchOfficialCycleV1";
import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import type {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";
import type {
  ScientificWorkbenchResearchControlOwnerActionsV0,
  ScientificWorkbenchResearchControlSnapshotInputV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";

const registryMocks = vi.hoisted(() => ({
  createdClients: [] as Array<{
    terminate: ReturnType<typeof vi.fn>;
  }>,
  clientConstructorError: null as Error | null,
  loadOfficialCycle: vi.fn(),
}));

vi.mock("@/engine/scientificBrowser", () => ({
  MAIN_WIRE_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1: Object.freeze({
    maximumRequestCountPerLifetime: 100_000,
    maximumSessionIdentityCountPerLifetime: 4_096,
    maximumTransientStepCountPerCommand: 16,
    maximumOutputFrameCountPerCommand: 16,
    requestTimeoutMs: 60_000,
  }),
  MainWireScientificWorkerClientV1: class {
    readonly terminate = vi.fn();

    constructor() {
      if (registryMocks.clientConstructorError !== null) {
        throw registryMocks.clientConstructorError;
      }
      registryMocks.createdClients.push(this);
    }
  },
}));

vi.mock(
  "@/components/scientificWorkbench/scientificWorkbenchOfficialCycleV1",
  () => ({
    loadScientificWorkbenchOfficialCycleV1:
      registryMocks.loadOfficialCycle,
  }),
);

import {
  completeTransientMetricBeatV1,
  ScientificProductScenarioRegistryV1,
  uniqueScenarioNameV1,
  type ScientificProductLoadedRuntimeV1,
} from "@/components/scientificProduct/ScientificProductScenarioRegistryV1";
import {
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  resolveScientificProductCaseRouteV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";

describe("scientific product scenario registry V1", () => {
  beforeEach(() => {
    registryMocks.createdClients.length = 0;
    registryMocks.clientConstructorError = null;
    registryMocks.loadOfficialCycle.mockReset();
    registryMocks.loadOfficialCycle.mockImplementation(
      async (_client: unknown, options: Readonly<{ sessionId: string }>) =>
        officialCycle(options.sessionId, 20_000),
    );
  });

  it("publishes descriptor edits and global visibility without mutating the source identity", () => {
    const initialClient = clientFixture();
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("initial-session", initialClient, 10_000),
    );
    const descriptorEvents = vi.fn();
    const frameEvents = vi.fn();
    const unsubscribeDescriptors = registry.subscribeDescriptors(descriptorEvents);
    const unsubscribeFrames = registry.subscribeFrames(frameEvents);
    const initial = registry.getDescriptorSnapshot()[0]!;

    expect(initial).toMatchObject({
      lifecycle: "ready",
      isVisible: true,
      source: {
        caseId: "circleheart/official-healthy-periodic",
      },
    });

    registry.rename(initial.id, "Comparison baseline");
    registry.recolor(initial.id, "#abcdef");
    registry.toggleGlobalVisibility(initial.id);

    const edited = registry.getDescriptorSnapshot()[0]!;
    expect(edited).toMatchObject({
      id: initial.id,
      name: "Comparison baseline",
      color: "#abcdef",
      isVisible: false,
      lifecycle: "ready",
      source: initial.source,
    });
    expect(registry.getRuntime(initial.id)?.descriptor).toBe(edited);
    expect(registry.getPresentation(initial.id)?.descriptor).toBe(edited);
    expect(descriptorEvents).toHaveBeenCalledTimes(3);
    expect(frameEvents).toHaveBeenCalledTimes(3);

    unsubscribeDescriptors();
    unsubscribeFrames();
    registry.dispose();
    expect(initialClient.terminate).toHaveBeenCalledOnce();
  });

  it("guards the last scenario from removal", () => {
    const initialClient = clientFixture();
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("only-session", initialClient, 30_000),
    );
    const onlyId = registry.getDescriptorSnapshot()[0]!.id;

    expect(registry.remove(onlyId)).toBe(false);
    expect(registry.getDescriptorSnapshot()).toHaveLength(1);
    expect(registry.getRuntime(onlyId)).not.toBeNull();
    expect(initialClient.terminate).not.toHaveBeenCalled();

    registry.dispose();
  });

  it("assigns stable human-readable suffixes to repeated preset names", () => {
    expect(uniqueScenarioNameV1("Healthy", [])).toBe("Healthy");
    expect(uniqueScenarioNameV1("Healthy", ["Healthy"])).toBe("Healthy 2");
    expect(uniqueScenarioNameV1("Healthy", ["Healthy", "Healthy 2"]))
      .toBe("Healthy 3");
    expect(uniqueScenarioNameV1("   ", ["Scenario"])).toBe("Scenario 2");
  });

  it("moves an added scenario from loading to ready with its own Worker and store", async () => {
    let completeLoad: (() => void) | null = null;
    registryMocks.loadOfficialCycle.mockImplementation(
      (_client: unknown, options: Readonly<{ sessionId: string }>) =>
        new Promise<ScientificWorkbenchOfficialCycleV1>((resolve) => {
          completeLoad = () => resolve(officialCycle(options.sessionId, 50_000));
        }),
    );

    const initialClient = clientFixture();
    const resolution = healthyResolution();
    const registry = new ScientificProductScenarioRegistryV1(
      resolution,
      loadedRuntime("source-session", initialClient, 40_000),
    );
    const sourceId = registry.getDescriptorSnapshot()[0]!.id;
    const addedId = registry.addPreset(resolution.caseEntry.caseId, {
      name: "Independent comparison",
    });

    expect(addedId).not.toBeNull();
    expect(registry.getDescriptorSnapshot().find(({ id }) => id === addedId))
      .toMatchObject({
        name: "Independent comparison",
        lifecycle: "loading",
        isVisible: true,
      });
    expect(registry.getRuntime(addedId!)).toBeNull();

    completeLoad?.();
    await flushMicrotasks();

    expect(registry.getDescriptorSnapshot().find(({ id }) => id === addedId))
      .toMatchObject({ lifecycle: "ready" });
    const sourceRuntime = registry.getRuntime(sourceId)!;
    const addedRuntime = registry.getRuntime(addedId!)!;
    expect(sourceRuntime).not.toBeNull();
    expect(addedRuntime).not.toBeNull();
    expect(addedRuntime.client).not.toBe(sourceRuntime.client);
    expect(addedRuntime.controlStore).not.toBe(sourceRuntime.controlStore);
    expect(addedRuntime.controlStore.getSnapshot().frames)
      .not.toBe(sourceRuntime.controlStore.getSnapshot().frames);

    const ownerToken = Symbol("source-owner");
    const disconnectSource = sourceRuntime.controlStore.connectOwner(
      ownerToken,
      { current: null },
    );
    expect(sourceRuntime.controlStore.getSnapshot().ownerConnected).toBe(true);
    expect(addedRuntime.controlStore.getSnapshot().ownerConnected).toBe(false);
    disconnectSource();

    registry.toggleGlobalVisibility(addedId!);
    expect(registry.getDescriptorSnapshot().find(({ id }) => id === sourceId))
      .toMatchObject({ isVisible: true });
    expect(registry.getDescriptorSnapshot().find(({ id }) => id === addedId))
      .toMatchObject({ isVisible: false });

    const addedClient = registryMocks.createdClients[0]!;
    expect(registry.remove(addedId!)).toBe(true);
    expect(addedClient.terminate).toHaveBeenCalledOnce();
    expect(initialClient.terminate).not.toHaveBeenCalled();
    expect(registry.getDescriptorSnapshot().map(({ id }) => id)).toEqual([
      sourceId,
    ]);

    registry.dispose();
  });

  it("uses steady mode only to initialize a duplicate, then restores the live default", async () => {
    vi.useFakeTimers();
    const initialClient = clientFixture();
    const resolution = healthyResolution();
    const registry = new ScientificProductScenarioRegistryV1(
      resolution,
      loadedRuntime("duplicate-source", initialClient, 55_000),
    );
    try {
      const duplicateId = registry.addPreset(resolution.caseEntry.caseId, {
        name: "Settled duplicate",
        duplicateDraft: Object.freeze({
          systemic: 0.75,
          pulmonary: 1,
          venousTone: 0.15,
          arterialStiffness: 0.75,
          peepCmH2O: 0,
          pericardialFluidVolumeMl: 0,
        }),
      })!;
      await flushMicrotasks();

      const store = registry.getRuntime(duplicateId)!.controlStore;
      const token = Symbol("duplicate-owner");
      const calls: string[] = [];
      const publish = (
        patch: Partial<ScientificWorkbenchResearchControlSnapshotInputV0>,
      ) => {
        const current = store.getSnapshot();
        const { actions: _actions, ownerConnected: _owner, ...input } = current;
        store.publishOwnerSnapshot(token, { ...input, ...patch });
      };
      const ownerActions: ScientificWorkbenchResearchControlOwnerActionsV0 = {
        setControlValue: (controlId, value) => {
          calls.push(`${controlId}:${value}`);
          const field = {
            "circulation.venous-tone": "venousTone",
            "circulation.arterial-stiffness": "arterialStiffness",
            "ventilation.peep-cm-h2o": "peepCmH2O",
            "pericardium.prescribed-fluid-volume-ml":
              "pericardialFluidVolumeMl",
          }[controlId] as
            | "venousTone"
            | "arterialStiffness"
            | "peepCmH2O"
            | "pericardialFluidVolumeMl"
            | undefined;
          if (field !== undefined) {
            publish({
              draft: Object.freeze({
                ...store.getSnapshot().draft,
                [field]: value,
              }),
              noChange: false,
            });
          }
        },
        commitControlValue: () => undefined,
        setSystemicScale: (systemic) => {
          calls.push(`systemic:${systemic}`);
          publish({
            draft: Object.freeze({ ...store.getSnapshot().draft, systemic }),
            noChange: false,
          });
        },
        setPulmonaryScale: (pulmonary) => {
          calls.push(`pulmonary:${pulmonary}`);
          publish({
            draft: Object.freeze({ ...store.getSnapshot().draft, pulmonary }),
            noChange: false,
          });
        },
        commitSystemicScale: () => undefined,
        commitPulmonaryScale: () => undefined,
        setMode: (mode) => {
          calls.push(`mode:${mode}`);
          publish({ mode });
        },
        applyTransition: () => {
          calls.push("apply");
          publish({ phase: "steady-settling", busy: true, steadyActive: true });
          queueMicrotask(() => publish({
            phase: "idle",
            busy: false,
            steadyActive: false,
            noChange: true,
          }));
        },
        cancelSteady: () => undefined,
        pauseLive: () => undefined,
        resumeLive: () => undefined,
        resetLiveOrFailure: () => undefined,
      };
      const disconnect = store.connectOwner(token, { current: ownerActions });

      await vi.runAllTimersAsync();

      expect(calls).toEqual([
        "systemic:0.75",
        "pulmonary:1",
        "circulation.venous-tone:0.15",
        "circulation.arterial-stiffness:0.75",
        "ventilation.peep-cm-h2o:0",
        "pericardium.prescribed-fluid-volume-ml:0",
        "mode:steady",
        "apply",
        "mode:live",
      ]);
      expect(store.getSnapshot()).toMatchObject({
        phase: "idle",
        mode: "live",
        busy: false,
      });
      disconnect();
    } finally {
      registry.dispose();
      vi.useRealTimers();
    }
  });

  it("terminates a loading scenario immediately when it is removed", () => {
    registryMocks.loadOfficialCycle.mockImplementation(
      () => new Promise<ScientificWorkbenchOfficialCycleV1>(() => undefined),
    );
    const initialClient = clientFixture();
    const resolution = healthyResolution();
    const registry = new ScientificProductScenarioRegistryV1(
      resolution,
      loadedRuntime("source-session", initialClient, 60_000),
    );
    const loadingId = registry.addPreset(resolution.caseEntry.caseId)!;
    const loadingClient = registryMocks.createdClients[0]!;

    expect(registry.remove(loadingId)).toBe(true);
    expect(loadingClient.terminate).toHaveBeenCalledOnce();
    registry.dispose();
  });

  it("publishes a failed scenario instead of throwing when Worker creation fails", () => {
    const initialClient = clientFixture();
    const resolution = healthyResolution();
    const registry = new ScientificProductScenarioRegistryV1(
      resolution,
      loadedRuntime("source-session", initialClient, 70_000),
    );
    registryMocks.clientConstructorError = new Error("Worker unavailable");

    const failedId = registry.addPreset(resolution.caseEntry.caseId);

    expect(failedId).not.toBeNull();
    expect(registry.getDescriptorSnapshot().find(({ id }) => id === failedId))
      .toMatchObject({ lifecycle: "failed", statusMessage: "Worker unavailable" });
    registry.dispose();
  });

  it("publishes graph updates only when the scientific frame reference changes", () => {
    const initialClient = clientFixture();
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("frame-subscription-session", initialClient, 80_000),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;
    const store = registry.getRuntime(scenarioId)!.controlStore;
    const frameEvents = vi.fn();
    const unsubscribeFrames = registry.subscribeFrames(frameEvents);
    const ownerToken = Symbol("frame-subscription-owner");
    const disconnect = store.connectOwner(ownerToken, { current: null });
    const current = store.getSnapshot();
    const { actions: _actions, ownerConnected: _ownerConnected, ...input } = current;

    store.publishOwnerSnapshot(ownerToken, {
      ...input,
      message: "Status-only update",
    });
    expect(frameEvents).not.toHaveBeenCalled();

    store.publishOwnerSnapshot(ownerToken, {
      ...input,
      frames: Object.freeze([...input.frames]),
      message: "New frame snapshot",
    });
    expect(frameEvents).toHaveBeenCalledOnce();

    disconnect();
    unsubscribeFrames();
    registry.dispose();
  });

  it("publishes the vascular curve first, then progressive preload points and the final job result", async () => {
    vi.useFakeTimers();
    const revision = 96_000;
    const source = protocolResultSource(revision, 96);
    const vascularReady = guytonJobSnapshotFixture({
      source,
      sequence: 0,
      stage: "vascular-ready",
      status: "running",
      completedPointCount: 0,
    });
    const firstPoint = guytonJobSnapshotFixture({
      source,
      sequence: 1,
      stage: "continuation",
      status: "running",
      completedPointCount: 1,
    });
    const completeResult = guytonJobResultFixture(source);
    const complete = guytonJobSnapshotFixture({
      source,
      sequence: 2,
      stage: "complete",
      status: "complete",
      completedPointCount: 3,
      result: completeResult,
    });
    let pollOrdinal = 0;
    const client = jobClientFixture((command) => {
      if (command.kind === "startGuytonStarlingProtocolJob") {
        return guytonJobStartResponse(command, vascularReady, 100);
      }
      if (command.kind === "pollGuytonStarlingProtocolJob") {
        const snapshot = pollOrdinal++ === 0 ? firstPoint : complete;
        return guytonJobProgressResponse(command, snapshot);
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("progressive-job-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;
    const protocolEvents = vi.fn();
    const unsubscribe = registry.subscribeHemodynamicProtocols(protocolEvents);

    try {
      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({ status: "running", jobSnapshot: null, result: null });

      await flushMicrotasks();
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({
          status: "running",
          result: null,
          jobSnapshot: {
            stage: "vascular-ready",
            sequence: 0,
            progress: { completedPointCount: 0 },
            rightVascularFunction: { side: "right" },
            leftVascularFunction: { side: "left" },
          },
        });
      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual(["startGuytonStarlingProtocolJob"]);

      await vi.advanceTimersByTimeAsync(100);
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({
          status: "running",
          jobSnapshot: {
            stage: "continuation",
            sequence: 1,
            progress: { completedPointCount: 1 },
          },
        });

      await vi.advanceTimersByTimeAsync(100);
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({
          status: "complete",
          sourceIdentity: {
            revision,
            acceptedTimeSec: 96,
            totalBloodVolumeMl: 5_000,
          },
          result: completeResult,
          jobSnapshot: {
            stage: "complete",
            sequence: 2,
            progress: { completedPointCount: 3 },
          },
          errorMessage: null,
        });
      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual([
          "startGuytonStarlingProtocolJob",
          "pollGuytonStarlingProtocolJob",
          "pollGuytonStarlingProtocolJob",
        ]);
      expect(protocolEvents).toHaveBeenCalledTimes(4);

      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      expect(client.request).toHaveBeenCalledTimes(3);
    } finally {
      unsubscribe();
      registry.dispose();
      vi.useRealTimers();
    }
  });

  it("cancels a job whose start response arrives after the source became stale", async () => {
    const revision = 96_500;
    const source = protocolResultSource(revision, 96.5);
    const vascularReady = guytonJobSnapshotFixture({
      source,
      sequence: 0,
      stage: "vascular-ready",
      status: "running",
      completedPointCount: 0,
    });
    let resolveStart!: (response: unknown) => void;
    const client = jobClientFixture((command) => {
      if (command.kind === "startGuytonStarlingProtocolJob") {
        return new Promise((resolve) => {
          resolveStart = resolve;
        });
      }
      if (command.kind === "cancelGuytonStarlingProtocolJob") {
        return guytonJobCancelResponse(command);
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("stale-start-job-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      publishSourceIdentity(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 96.502,
      });
      const startCommand = client.request.mock.calls[0]![0];
      resolveStart(guytonJobStartResponse(startCommand, vascularReady, 100));
      await flushMicrotasks();

      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual([
          "startGuytonStarlingProtocolJob",
          "cancelGuytonStarlingProtocolJob",
        ]);
      expect(client.request.mock.calls[1]?.[0]).toMatchObject({
        sessionId: "stale-start-job-session",
        jobId: "job-1",
      });
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({ status: "idle", result: null, jobSnapshot: null });
    } finally {
      registry.dispose();
    }
  });

  it("cancels a job whose poll response arrives after the source became stale", async () => {
    vi.useFakeTimers();
    const revision = 96_750;
    const source = protocolResultSource(revision, 96.75);
    const vascularReady = guytonJobSnapshotFixture({
      source,
      sequence: 0,
      stage: "vascular-ready",
      status: "running",
      completedPointCount: 0,
    });
    const firstPoint = guytonJobSnapshotFixture({
      source,
      sequence: 1,
      stage: "continuation",
      status: "running",
      completedPointCount: 1,
    });
    let resolvePoll!: (response: unknown) => void;
    let pollCommand: GuytonJobCommandFixture | null = null;
    const client = jobClientFixture((command) => {
      if (command.kind === "startGuytonStarlingProtocolJob") {
        return guytonJobStartResponse(command, vascularReady, 100);
      }
      if (command.kind === "pollGuytonStarlingProtocolJob") {
        pollCommand = command;
        return new Promise((resolve) => {
          resolvePoll = resolve;
        });
      }
      if (command.kind === "cancelGuytonStarlingProtocolJob") {
        return guytonJobCancelResponse(command);
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("stale-poll-job-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      await flushMicrotasks();
      vi.advanceTimersByTime(100);
      await flushMicrotasks();
      expect(pollCommand).not.toBeNull();

      publishSourceIdentity(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 96.752,
      });
      resolvePoll(guytonJobProgressResponse(pollCommand!, firstPoint));
      await flushMicrotasks();

      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual([
          "startGuytonStarlingProtocolJob",
          "pollGuytonStarlingProtocolJob",
          "cancelGuytonStarlingProtocolJob",
        ]);
      expect(client.request.mock.calls[2]?.[0]).toMatchObject({
        sessionId: "stale-poll-job-session",
        jobId: "job-1",
      });
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({ status: "idle", result: null, jobSnapshot: null });
    } finally {
      registry.dispose();
      vi.useRealTimers();
    }
  });

  it("cancels a progressive job when its source becomes stale before the next poll", async () => {
    vi.useFakeTimers();
    const revision = 97_000;
    const source = protocolResultSource(revision, 97);
    const vascularReady = guytonJobSnapshotFixture({
      source,
      sequence: 0,
      stage: "vascular-ready",
      status: "running",
      completedPointCount: 0,
    });
    const client = jobClientFixture((command) => {
      if (command.kind === "startGuytonStarlingProtocolJob") {
        return guytonJobStartResponse(command, vascularReady, 100);
      }
      if (command.kind === "cancelGuytonStarlingProtocolJob") {
        return guytonJobCancelResponse(command);
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("stale-progressive-job-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      await flushMicrotasks();
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({ status: "running", jobSnapshot: { jobId: "job-1" } });

      publishSourceIdentity(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 97.002,
      });
      await vi.advanceTimersByTimeAsync(100);

      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual([
          "startGuytonStarlingProtocolJob",
          "cancelGuytonStarlingProtocolJob",
        ]);
      expect(client.request.mock.calls[1]?.[0]).toMatchObject({
        sessionId: "stale-progressive-job-session",
        jobId: "job-1",
      });
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({ status: "idle", result: null, jobSnapshot: null });
    } finally {
      registry.dispose();
      vi.useRealTimers();
    }
  });

  it("cancels a running progressive job and clears its poll timer on registry disposal", async () => {
    vi.useFakeTimers();
    const revision = 98_000;
    const source = protocolResultSource(revision, 98);
    const vascularReady = guytonJobSnapshotFixture({
      source,
      sequence: 0,
      stage: "vascular-ready",
      status: "running",
      completedPointCount: 0,
    });
    const client = jobClientFixture((command) => {
      if (command.kind === "startGuytonStarlingProtocolJob") {
        return guytonJobStartResponse(command, vascularReady, 100);
      }
      if (command.kind === "cancelGuytonStarlingProtocolJob") {
        return guytonJobCancelResponse(command);
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("disposed-progressive-job-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      await flushMicrotasks();
      registry.dispose();
      await flushMicrotasks();
      await vi.advanceTimersByTimeAsync(1_000);

      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual([
          "startGuytonStarlingProtocolJob",
          "cancelGuytonStarlingProtocolJob",
        ]);
      expect(client.terminate).toHaveBeenCalledOnce();
    } finally {
      registry.dispose();
      vi.useRealTimers();
    }
  });

  it("extracts metrics only at a complete accepted transient-beat boundary", () => {
    const frames = Object.freeze(Array.from({ length: 501 }, (_, index) =>
      Object.freeze({
        releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
        revision: 90_000 + index,
        acceptedTimeSec: 40 + index * 0.002,
        source: "accepted-step" as const,
      }) as unknown as MainWireScientificObservableFrameV1));

    const beat = completeTransientMetricBeatV1(frames, 40);
    expect(beat).toMatchObject({
      durationSec: 1,
      evidence: {
        transientBeatFullyMeasured: true,
        bothBeatBoundariesMeasured: true,
      },
    });
    expect(beat?.frames).toHaveLength(501);
    expect(completeTransientMetricBeatV1(frames.slice(0, -1), 40)).toBeNull();
    expect(completeTransientMetricBeatV1(frames, 40.002)).toBeNull();
  });
});

function healthyResolution() {
  const resolution = resolveScientificProductCaseRouteV1("normal-sinus");
  if (resolution === null) {
    throw new Error("healthy scientific product route fixture did not resolve");
  }
  return resolution;
}

function clientFixture(): MainWireScientificWorkerClientV1 & {
  terminate: ReturnType<typeof vi.fn>;
} {
  return {
    terminate: vi.fn(),
  } as unknown as MainWireScientificWorkerClientV1 & {
    terminate: ReturnType<typeof vi.fn>;
  };
}

function loadedRuntime(
  sessionId: string,
  client: MainWireScientificWorkerClientV1,
  revision: number,
): ScientificProductLoadedRuntimeV1 {
  return Object.freeze({
    client,
    sessionId,
    result: officialCycle(sessionId, revision),
    kind: "official",
  });
}

function officialCycle(
  sessionId: string,
  revision: number,
): ScientificWorkbenchOfficialCycleV1 {
  const frame = Object.freeze({
    releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
    revision,
    acceptedTimeSec: revision / 1_000,
  }) as unknown as MainWireScientificObservableFrameV1;
  const frames = Object.freeze([frame]);
  const controlState = Object.freeze({
    controls: Object.freeze({
      "circulation.systemic-vascular-resistance-scale": 1,
      "circulation.pulmonary-vascular-resistance-scale": 1,
    }),
    targetStateSha256: sessionDigest(sessionId),
  }) as unknown as MainWireScientificResearchControlTargetStateV0;

  return Object.freeze({
    workspaceDocument: Object.freeze({
      documentId: `workspace-${sessionId}`,
    }) as unknown as MainWireScientificWorkspaceDocumentV1,
    terminalCycle: Object.freeze({
      frames,
      releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
      durationSec: 1,
      evidence: Object.freeze({}),
    }),
    researchControlContext: Object.freeze({
      stateIdentity: Object.freeze({
        revision,
        acceptedTimeSec: revision / 1_000,
        totalBloodVolumeMl: 5_000,
      }),
      controlState,
      parameterEpoch: 0,
    }),
  }) as unknown as ScientificWorkbenchOfficialCycleV1;
}

function sessionDigest(sessionId: string): string {
  const code = [...sessionId].reduce((total, character) => (
    total + character.charCodeAt(0)
  ), 0);
  return code.toString(16).padStart(64, "0").slice(-64);
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function protocolResultSource(revision: number, acceptedTimeSec: number) {
  return Object.freeze({
    revision,
    acceptedTimeSec,
    totalBloodVolumeMl: 5_000,
    fixedTotalBloodVolumeMl: 5_000,
  });
}

type GuytonJobCommandFixture = Readonly<{
  kind:
    | "startGuytonStarlingProtocolJob"
    | "pollGuytonStarlingProtocolJob"
    | "cancelGuytonStarlingProtocolJob";
  requestId: string;
  sessionId: string;
  jobId?: string;
}>;

function jobClientFixture(
  handler: (command: GuytonJobCommandFixture) => unknown,
) {
  const request = vi.fn(async (command: GuytonJobCommandFixture) => (
    handler(command)
  ));
  const client = {
    terminate: vi.fn(),
    request,
  };
  return client as typeof client & MainWireScientificWorkerClientV1;
}

function vascularFunctionFixture(side: "right" | "left") {
  return Object.freeze({
    side,
    xSemantics: side === "right"
      ? "mean-transmural-right-atrial-pressure-cvp-model-equivalent"
      : "mean-transmural-left-atrial-pressure-pcwp-surrogate",
    ySemantics: side === "right"
      ? "systemic-venous-return-l-per-min"
      : "pulmonary-venous-return-l-per-min",
    pressureReferenceOffsetMmHg: 0,
    fillingPressureAbsoluteMmHg: side === "right" ? 7 : 12,
    fillingPressureTransmuralMmHg: side === "right" ? 7 : 12,
    points: Object.freeze([
      Object.freeze({ pressureTransmuralMmHg: 0, flowLMin: 7 }),
      Object.freeze({ pressureTransmuralMmHg: 7, flowLMin: 0 }),
    ]),
  });
}

function preloadPointEvidenceFixture(pointOrdinal: number) {
  const targetScale = 1 - pointOrdinal * 0.05;
  const fixedTotalBloodVolumeMl = 5_000 * targetScale;
  return Object.freeze({
    point: Object.freeze({
      targetScale,
      fixedTotalBloodVolumeMl,
      status: "period1-converged" as const,
      acceptedForPeriod1Locus: true,
      completedBeatCount: 4,
      meanRapTransmuralMmHg: 4 - pointOrdinal,
      meanLapTransmuralMmHg: 9 - pointOrdinal,
      netCardiacOutputLMin: 5 - pointOrdinal * 0.1,
      forwardCardiacOutputLMin: 5 - pointOrdinal * 0.1,
      lvEndDiastolicVolumeMl: 120 - pointOrdinal * 5,
      lvEndSystolicVolumeMl: 50,
      lvStrokeWorkMmHgMl: 7_000,
      latestPeriod1MaximumNormalizedDelta: 0.001,
      latestPeriod2MaximumNormalizedDelta: null,
      period2Branches: null,
      failureReason: null,
    }),
    provenance: Object.freeze({
      pointId: `point-${pointOrdinal}`,
      direction: pointOrdinal === 0 ? "source-baseline" : "lower-volume",
      targetScale,
      seedScale: pointOrdinal === 0 ? 1 : targetScale + 0.05,
      seedKind: pointOrdinal === 0
        ? "source-baseline"
        : "previous-period1",
      adaptiveStepScale: pointOrdinal === 0 ? 0 : 0.05,
      attemptOrdinal: 1,
      continuationAcceptedAsSeed: true,
      refinementReason: "initial",
      auditStatus: "not-scheduled",
      auditMaximumNormalizedStateDelta: null,
    }),
  });
}

function guytonJobSnapshotFixture(input: Readonly<{
  source: ReturnType<typeof protocolResultSource>;
  sequence: number;
  stage:
    | "vascular-ready"
    | "continuation"
    | "independent-audit"
    | "complete";
  status: "running" | "complete";
  completedPointCount: number;
  result?: ReturnType<typeof guytonJobResultFixture>;
}>) {
  return Object.freeze({
    jobId: "job-1",
    sequence: input.sequence,
    status: input.status,
    stage: input.stage,
    source: Object.freeze({
      revision: input.source.revision,
      acceptedTimeSec: input.source.acceptedTimeSec,
      fixedTotalBloodVolumeMl: input.source.fixedTotalBloodVolumeMl,
    }),
    baselinePeriodicity: "period1-converged" as const,
    rightVascularFunction: vascularFunctionFixture("right"),
    leftVascularFunction: vascularFunctionFixture("left"),
    preloadPointEvidence: Object.freeze(Array.from(
      { length: input.completedPointCount },
      (_, pointOrdinal) => preloadPointEvidenceFixture(pointOrdinal),
    )),
    progress: Object.freeze({
      completedPointCount: input.completedPointCount,
      plannedPointCountLowerBound: 3,
      activeDirections: input.status === "running"
        ? Object.freeze(["lower-volume", "higher-volume"] as const)
        : Object.freeze([]),
      completedBeatCount: input.completedPointCount * 4,
    }),
    result: input.result ?? null,
    errorMessage: null,
  });
}

function guytonJobResultFixture(
  source: ReturnType<typeof protocolResultSource>,
) {
  return Object.freeze({
    protocolId: "main-wire-scientific-guyton-starling-protocol-v2",
    protocolVersion: "2.0.0",
    source: Object.freeze({
      revision: source.revision,
      acceptedTimeSec: source.acceptedTimeSec,
      fixedTotalBloodVolumeMl: source.fixedTotalBloodVolumeMl,
    }),
  });
}

function guytonJobStartResponse(
  command: GuytonJobCommandFixture,
  snapshot: ReturnType<typeof guytonJobSnapshotFixture>,
  suggestedPollIntervalMs: number,
) {
  return Object.freeze({
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: "startGuytonStarlingProtocolJob" as const,
    payload: Object.freeze({
      kind: "guytonStarlingProtocolJobStarted" as const,
      job: Object.freeze({
        jobId: snapshot.jobId,
        snapshot,
        suggestedPollIntervalMs,
      }),
    }),
  });
}

function guytonJobProgressResponse(
  command: GuytonJobCommandFixture,
  snapshot: ReturnType<typeof guytonJobSnapshotFixture>,
) {
  return Object.freeze({
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: "pollGuytonStarlingProtocolJob" as const,
    payload: Object.freeze({
      kind: "guytonStarlingProtocolJobProgress" as const,
      snapshot,
    }),
  });
}

function guytonJobCancelResponse(command: GuytonJobCommandFixture) {
  return Object.freeze({
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: "cancelGuytonStarlingProtocolJob" as const,
    payload: Object.freeze({
      kind: "guytonStarlingProtocolJobCancelled" as const,
      jobId: command.jobId,
    }),
  });
}

function publishSourceIdentity(
  registry: ScientificProductScenarioRegistryV1,
  scenarioId: string,
  identity: Readonly<{ revision: number; acceptedTimeSec: number }>,
): void {
  const store = registry.getRuntime(scenarioId)!.controlStore;
  const ownerToken = Symbol("protocol-source-update");
  const disconnect = store.connectOwner(ownerToken, { current: null });
  const snapshot = store.getSnapshot();
  const { actions: _actions, ownerConnected: _ownerConnected, ...input } =
    snapshot;
  store.publishOwnerSnapshot(ownerToken, {
    ...input,
    source: Object.freeze({
      ...input.source,
      context: Object.freeze({
        ...input.source.context,
        stateIdentity: Object.freeze({
          ...input.source.context.stateIdentity,
          ...identity,
        }),
      }),
    }),
  });
  disconnect();
}
