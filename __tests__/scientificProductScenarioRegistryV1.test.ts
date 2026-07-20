import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ScientificWorkbenchOfficialCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchOfficialCycleV1";
import {
  SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1,
  assembleScientificWorkbenchTerminalCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchTerminalCycleV1";
import type {
  MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type MainWireScientificObservableValueV1,
} from "@/engine/scientific/observables";
import type {
  MainWireScientificValidatedTerminalCycleV1,
} from "@/engine/scientific/metrics";
import type {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";
import type {
  ScientificWorkbenchResearchControlDraftV0,
  ScientificWorkbenchResearchControlOwnerActionsV0,
  ScientificWorkbenchResearchControlSnapshotInputV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";

const registryMocks = vi.hoisted(() => ({
  createdClients: [] as Array<{
    terminate: ReturnType<typeof vi.fn>;
  }>,
  clientConstructorError: null as Error | null,
  loadOfficialCycle: vi.fn(),
  analysisCoordinators: [] as Array<{
    requestLatest: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    onJobSnapshot: (event: unknown) => void;
    onError: (event: unknown) => void;
  }>,
  pvAnalysisCoordinators: [] as Array<{
    requestLatest: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    onJobSnapshot: (event: unknown) => void;
    onError: (event: unknown) => void;
  }>,
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

vi.mock(
  "@/components/scientificProduct/ScientificProductHemodynamicAnalysisCoordinatorV1",
  () => ({
    SCIENTIFIC_PRODUCT_HEMODYNAMIC_ANALYSIS_PROVENANCE_V1:
      "independent-case-source-warm-continuation",
    ScientificProductHemodynamicAnalysisCoordinatorV1: class {
      readonly requestLatest = vi.fn();
      readonly dispose = vi.fn(async () => undefined);
      readonly onJobSnapshot: (event: unknown) => void;
      readonly onError: (event: unknown) => void;

      constructor(options: Readonly<{
        onJobSnapshot: (event: unknown) => void;
        onError: (event: unknown) => void;
      }>) {
        this.onJobSnapshot = options.onJobSnapshot;
        this.onError = options.onError;
        registryMocks.analysisCoordinators.push(this);
      }
    },
  }),
);

vi.mock(
  "@/components/scientificProduct/ScientificProductPvRelationAnalysisCoordinatorV1",
  () => ({
    SCIENTIFIC_PRODUCT_PV_RELATION_ANALYSIS_PROVENANCE_V1:
      "independent-case-source-warm-continuation",
    ScientificProductPvRelationAnalysisCoordinatorV1: class {
      readonly requestLatest = vi.fn();
      readonly dispose = vi.fn(async () => undefined);
      readonly onJobSnapshot: (event: unknown) => void;
      readonly onError: (event: unknown) => void;

      constructor(options: Readonly<{
        onJobSnapshot: (event: unknown) => void;
        onError: (event: unknown) => void;
      }>) {
        this.onJobSnapshot = options.onJobSnapshot;
        this.onError = options.onError;
        registryMocks.pvAnalysisCoordinators.push(this);
      }
    },
  }),
);

import {
  completeTransientMetricBeatV1,
  ScientificProductScenarioRegistryV1,
  uniqueScenarioNameV1,
  type ScientificProductLoadedRuntimeV1,
  type ScientificProductScenarioPresentationV1,
} from "@/components/scientificProduct/ScientificProductScenarioRegistryV1";
import {
  readScientificProductSavedScenarioCatalogV1,
  removeScientificProductSavedScenarioV1,
  saveScientificProductScenarioV1,
  SCIENTIFIC_PRODUCT_SAVED_SCENARIO_STORAGE_KEY_V1,
  writeScientificProductSavedScenarioCatalogV1,
  type ScientificProductSavedScenarioStorageV1,
} from "@/components/scientificProduct/ScientificProductSavedScenarioCatalogV1";
import {
  createScientificProductValidationContextV1,
} from "@/components/scientificProduct/ScientificProductValidationContextV1";
import {
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
  resolveScientificProductCaseRouteV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";

describe("scientific product scenario registry V1", () => {
  beforeEach(() => {
    registryMocks.createdClients.length = 0;
    registryMocks.clientConstructorError = null;
    registryMocks.analysisCoordinators.length = 0;
    registryMocks.pvAnalysisCoordinators.length = 0;
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

  it("retains the rendered generation until the next parameter generation is renderable", async () => {
    const firstRevision = 96_100;
    const secondRevision = 96_200;
    const firstSource = protocolResultSource(firstRevision, 96.1);
    const secondSource = protocolResultSource(secondRevision, 96.2);
    const snapshots = [firstSource, secondSource].map((source) =>
      guytonJobSnapshotFixture({
        source,
        sequence: 0,
        stage: "complete",
        status: "complete",
        completedPointCount: 3,
        result: guytonJobResultFixture(source),
      }));
    let startOrdinal = 0;
    let resolveSecondStart!: (response: unknown) => void;
    const client = jobClientFixture((command) => {
      if (command.kind !== "startGuytonStarlingProtocolJob") {
        throw new Error(`Unexpected command ${command.kind}`);
      }
      const snapshot = snapshots[startOrdinal++]!;
      if (startOrdinal === 2) {
        return new Promise((resolve) => {
          resolveSecondStart = resolve;
        });
      }
      return guytonJobStartResponse(command, snapshot, 100);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("generation-history-session", client, firstRevision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestHemodynamicProtocol(
        scenarioId,
        "guyton-starling",
        "standard",
      );
      await flushMicrotasks();
      const firstGlobalSnapshot =
        registry.getHemodynamicProtocolSeriesSnapshot();
      const firstGeneration = registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      ).current;
      expect(firstGeneration?.source.sourceIdentity).toMatchObject({
        revision: firstRevision,
        parameterEpoch: 0,
        controlStateSha256: sessionDigest("generation-history-session"),
      });

      publishSourceIdentity(registry, scenarioId, {
        revision: secondRevision,
        acceptedTimeSec: 96.2,
        parameterEpoch: 1,
        controlStateSha256: "a".repeat(64),
      });
      registry.requestHemodynamicProtocol(
        scenarioId,
        "guyton-starling",
        "standard",
      );

      const whilePending = registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      );
      expect(registry.getHemodynamicProtocolSeriesSnapshot())
        .not.toBe(firstGlobalSnapshot);
      expect(whilePending.current).toBe(firstGeneration);
      expect(whilePending.pending).toMatchObject({
        status: "running",
        renderable: false,
        source: {
          sourceIdentity: {
            revision: secondRevision,
            parameterEpoch: 1,
            controlStateSha256: "a".repeat(64),
          },
        },
      });

      const secondCommand = client.request.mock.calls[1]![0];
      resolveSecondStart(guytonJobStartResponse(
        secondCommand,
        snapshots[1]!,
        100,
      ));
      await flushMicrotasks();

      const promoted = registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      );
      expect(promoted.pending).toBeNull();
      expect(promoted.current).toMatchObject({
        renderable: true,
        source: { sourceIdentity: { revision: secondRevision } },
      });
      expect(promoted.history).toHaveLength(1);
      expect(promoted.history[0]).toBe(firstGeneration);
    } finally {
      registry.dispose();
    }
  });

  it("keeps the current curve and exposes the replacement failure", async () => {
    const firstRevision = 96_300;
    const secondRevision = 96_400;
    const firstSource = protocolResultSource(firstRevision, 96.3);
    let startOrdinal = 0;
    const client = jobClientFixture((command) => {
      if (command.kind !== "startGuytonStarlingProtocolJob") {
        throw new Error(`Unexpected command ${command.kind}`);
      }
      startOrdinal += 1;
      if (startOrdinal === 2) {
        return Object.freeze({
          ok: false as const,
          requestId: command.requestId,
          sessionId: command.sessionId,
          commandKind: command.kind,
          error: Object.freeze({ message: "replacement solver stopped" }),
        });
      }
      const snapshot = guytonJobSnapshotFixture({
        source: firstSource,
        sequence: 0,
        stage: "complete",
        status: "complete",
        completedPointCount: 3,
        result: guytonJobResultFixture(firstSource),
      });
      return guytonJobStartResponse(command, snapshot, 100);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("generation-failure-session", client, firstRevision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      await flushMicrotasks();
      const current = registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      ).current;
      publishSourceIdentity(registry, scenarioId, {
        revision: secondRevision,
        acceptedTimeSec: 96.4,
        parameterEpoch: 1,
        controlStateSha256: "b".repeat(64),
      });
      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      await flushMicrotasks();

      const failed = registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      );
      expect(failed.current).toBe(current);
      expect(failed.pending).toBeNull();
      expect(failed.lastFailure).toMatchObject({
        errorMessage: "replacement solver stopped",
        source: { sourceIdentity: { revision: secondRevision } },
      });
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({
          status: "error",
          errorMessage: "replacement solver stopped",
        });
    } finally {
      registry.dispose();
    }
  });

  it("recalculates detail for the same parameter source without adding history", async () => {
    const revision = 96_600;
    const source = protocolResultSource(revision, 96.6);
    const client = jobClientFixture((command) => {
      if (command.kind !== "startGuytonStarlingProtocolJob") {
        throw new Error(`Unexpected command ${command.kind}`);
      }
      const snapshot = guytonJobSnapshotFixture({
        source,
        sequence: 0,
        stage: "complete",
        status: "complete",
        completedPointCount: 3,
        result: guytonJobResultFixture(source),
      });
      return guytonJobStartResponse(command, snapshot, 100);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("detail-recalculation-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestHemodynamicProtocol(
        scenarioId,
        "guyton-starling",
        "standard",
      );
      await flushMicrotasks();
      registry.requestHemodynamicProtocol(
        scenarioId,
        "guyton-starling",
        "settled-reference",
      );
      await flushMicrotasks();

      expect(client.request.mock.calls.map(([command]) =>
        command.detailMode)).toEqual(["standard", "settled-reference"]);
      expect(registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      )).toMatchObject({
        current: { snapshot: { detailMode: "settled-reference" } },
        pending: null,
        history: [],
      });
    } finally {
      registry.dispose();
    }
  });

  it("arbitrates multiple pane demands into one strongest calculation", async () => {
    vi.useFakeTimers();
    const revision = 96_800;
    const client = jobClientFixture((command) => {
      if (command.kind === "startGuytonStarlingProtocolJob") {
        return new Promise(() => undefined);
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("demand-arbitration-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;
    const demand = (detailMode: "standard" | "settled-reference") =>
      Object.freeze({
        scenarioId,
        kind: "guyton-starling" as const,
        detailMode,
      });

    try {
      registry.setHemodynamicProtocolDemand("pane-a", demand("standard"));
      registry.setHemodynamicProtocolDemand(
        "pane-b",
        demand("settled-reference"),
      );
      registry.setHemodynamicProtocolDemand("pane-c", demand("standard"));
      expect(client.request.mock.calls.map(([command]) =>
        command.detailMode)).toEqual(["standard", "compare"]);

      registry.setHemodynamicProtocolDemand("pane-b", null);
      expect(client.request.mock.calls.map(([command]) =>
        command.detailMode)).toEqual(["standard", "compare"]);
      registry.setHemodynamicProtocolDemand("pane-a", null);
      expect(client.request).toHaveBeenCalledTimes(2);
      registry.setHemodynamicProtocolDemand("pane-c", null);
      await vi.advanceTimersByTimeAsync(0);
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({ status: "idle" });
      expect(registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      ).pending).toBeNull();
    } finally {
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

  it("routes a correlated live target through independent analysis and returns to the visible P1 route", async () => {
    const revision = 98_200;
    const targetSha256 = "c".repeat(64);
    const visibleSource = protocolResultSource(revision + 20, 98.22);
    const visibleSnapshot = guytonJobSnapshotFixture({
      source: visibleSource,
      sequence: 0,
      stage: "complete",
      status: "complete",
      completedPointCount: 3,
      result: guytonJobResultFixture(visibleSource),
    });
    const client = jobClientFixture((command) => {
      if (command.kind === "startGuytonStarlingProtocolJob") {
        return guytonJobStartResponse(command, visibleSnapshot, 100);
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("live-analysis-routing", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      publishLiveTarget(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 98.201,
        parameterEpoch: 4,
        controlStateSha256: targetSha256,
      });
      registry.setHemodynamicProtocolDemand("live-pane", Object.freeze({
        scenarioId,
        kind: "guyton-starling" as const,
        detailMode: "standard" as const,
      }));

      expect(client.request).not.toHaveBeenCalled();
      expect(registryMocks.analysisCoordinators).toHaveLength(1);
      const coordinator = registryMocks.analysisCoordinators[0]!;
      expect(coordinator.requestLatest).toHaveBeenCalledOnce();
      const request = coordinator.requestLatest.mock.calls[0]![0];
      expect(request).toMatchObject({
        visibleParameterEpoch: 4,
        visibleControlStateSha256: targetSha256,
        targetControlState: { targetStateSha256: targetSha256 },
      });

      const hiddenSource = protocolResultSource(revision + 9, 101.5);
      coordinator.onJobSnapshot(hiddenAnalysisSnapshotEvent(
        request,
        guytonJobSnapshotFixture({
          source: hiddenSource,
          sequence: 0,
          stage: "complete",
          status: "complete",
          completedPointCount: 3,
          result: guytonJobResultFixture(hiddenSource),
        }),
      ));
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({
          status: "complete",
          calculationSource: "independent-case-source-warm-continuation",
          sourceIdentity: {
            revision: revision + 1,
            acceptedTimeSec: 98.201,
            parameterEpoch: 4,
            controlStateSha256: targetSha256,
          },
          jobSnapshot: { source: { revision: revision + 9 } },
        });

      publishPeriodicSource(registry, scenarioId, {
        revision: revision + 20,
        acceptedTimeSec: 98.22,
        parameterEpoch: 5,
        controlStateSha256: "d".repeat(64),
      });
      await flushMicrotasks();
      expect(coordinator.dispose).toHaveBeenCalledOnce();
      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual(["startGuytonStarlingProtocolJob"]);
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({
          status: "complete",
          calculationSource: "visible-period1-source",
        });
    } finally {
      registry.dispose();
    }
  });

  it("ignores hidden-analysis callbacks superseded by a newer visible target", () => {
    const revision = 98_400;
    const client = jobClientFixture(() => {
      throw new Error("visible worker must not own a live-target calculation");
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("live-analysis-stale", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      publishLiveTarget(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 98.401,
        parameterEpoch: 1,
        controlStateSha256: "e".repeat(64),
      });
      registry.setHemodynamicProtocolDemand("live-pane", Object.freeze({
        scenarioId,
        kind: "guyton-starling" as const,
        detailMode: "standard" as const,
      }));
      const coordinator = registryMocks.analysisCoordinators[0]!;
      const firstRequest = coordinator.requestLatest.mock.calls[0]![0];

      publishLiveTarget(registry, scenarioId, {
        revision: revision + 2,
        acceptedTimeSec: 98.402,
        parameterEpoch: 2,
        controlStateSha256: "f".repeat(64),
      });
      expect(coordinator.requestLatest).toHaveBeenCalledTimes(2);
      const secondRequest = coordinator.requestLatest.mock.calls[1]![0];
      const firstSnapshot = guytonJobSnapshotFixture({
        source: protocolResultSource(revision + 10, 110),
        sequence: 0,
        stage: "complete",
        status: "complete",
        completedPointCount: 3,
      });
      coordinator.onJobSnapshot(hiddenAnalysisSnapshotEvent(
        firstRequest,
        firstSnapshot,
      ));
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({ status: "running", jobSnapshot: null });

      coordinator.onJobSnapshot(hiddenAnalysisSnapshotEvent(
        secondRequest,
        firstSnapshot,
      ));
      expect(registry.getHemodynamicProtocol(scenarioId, "guyton-starling"))
        .toMatchObject({
          status: "complete",
          sourceIdentity: {
            revision: revision + 2,
            parameterEpoch: 2,
          },
        });
    } finally {
      registry.dispose();
    }
  });

  it("retains the current curve when independent live-target analysis fails", async () => {
    const revision = 98_600;
    const firstSource = protocolResultSource(revision, 98.6);
    const client = jobClientFixture((command) => {
      if (command.kind !== "startGuytonStarlingProtocolJob") {
        throw new Error(`Unexpected command ${command.kind}`);
      }
      const snapshot = guytonJobSnapshotFixture({
        source: firstSource,
        sequence: 0,
        stage: "complete",
        status: "complete",
        completedPointCount: 3,
        result: guytonJobResultFixture(firstSource),
      });
      return guytonJobStartResponse(command, snapshot, 100);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("live-analysis-failure", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestHemodynamicProtocol(scenarioId, "guyton-starling");
      await flushMicrotasks();
      const previous = registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      ).current;
      const targetSha256 = "1".repeat(64);
      publishLiveTarget(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 98.601,
        parameterEpoch: 1,
        controlStateSha256: targetSha256,
      });
      registry.setHemodynamicProtocolDemand("live-pane", Object.freeze({
        scenarioId,
        kind: "guyton-starling" as const,
        detailMode: "standard" as const,
      }));
      const coordinator = registryMocks.analysisCoordinators[0]!;
      const request = coordinator.requestLatest.mock.calls[0]![0];
      coordinator.onError(hiddenAnalysisErrorEvent(
        request,
        "independent settlement failed",
      ));

      const series = registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      );
      expect(series.current).toBe(previous);
      expect(series.pending).toBeNull();
      expect(series.lastFailure).toMatchObject({
        errorMessage: "independent settlement failed",
        source: { sourceIdentity: { controlStateSha256: targetSha256 } },
      });
    } finally {
      registry.dispose();
    }
  });

  it("defers final-demand disposal so an immediate demand re-add keeps the analysis worker", async () => {
    vi.useFakeTimers();
    const revision = 98_800;
    const client = jobClientFixture(() => {
      throw new Error("visible worker must not own a live-target calculation");
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("live-analysis-demand", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;
    const demand = Object.freeze({
      scenarioId,
      kind: "guyton-starling" as const,
      detailMode: "standard" as const,
    });

    try {
      publishLiveTarget(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 98.801,
        parameterEpoch: 1,
        controlStateSha256: "2".repeat(64),
      });
      registry.setHemodynamicProtocolDemand("strict-pane", demand);
      const coordinator = registryMocks.analysisCoordinators[0]!;
      registry.setHemodynamicProtocolDemand("strict-pane", null);
      registry.setHemodynamicProtocolDemand("strict-pane", demand);
      await vi.advanceTimersByTimeAsync(0);
      expect(coordinator.dispose).not.toHaveBeenCalled();

      registry.setHemodynamicProtocolDemand("strict-pane", null);
      await vi.advanceTimersByTimeAsync(0);
      expect(coordinator.dispose).toHaveBeenCalledOnce();
      expect(registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      ).pending).toBeNull();
    } finally {
      registry.dispose();
      vi.useRealTimers();
    }
  });

  it("runs PV relations only on demand and promotes progressive endpoints", async () => {
    vi.useFakeTimers();
    const revision = 99_000;
    const source = protocolResultSource(revision, 99);
    const startedSnapshot = pvRelationJobSnapshotFixture({
      source,
      sequence: 1,
      status: "running",
      beatCount: 0,
    });
    const progressiveSnapshot = pvRelationJobSnapshotFixture({
      source,
      sequence: 2,
      status: "running",
      beatCount: 2,
    });
    const result = pvRelationJobResultFixture(source, 6);
    const completeSnapshot = pvRelationJobSnapshotFixture({
      source,
      sequence: 3,
      status: "complete",
      beatCount: 6,
      result,
    });
    let pollOrdinal = 0;
    const client = pvRelationJobClientFixture((command) => {
      if (command.kind === "startPvRelationsProtocolJob") {
        return pvRelationJobStartResponse(command, startedSnapshot, 100);
      }
      if (command.kind === "pollPvRelationsProtocolJob") {
        return pvRelationJobProgressResponse(
          command,
          pollOrdinal++ === 0 ? progressiveSnapshot : completeSnapshot,
        );
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("pv-relation-demand-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      expect(client.request).not.toHaveBeenCalled();
      registry.setPvRelationProtocolDemand("pv-pane", { scenarioId });
      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual(["startPvRelationsProtocolJob"]);
      await flushMicrotasks();
      expect(registry.getPvRelationProtocolSeries(scenarioId)).toMatchObject({
        current: null,
        pending: { renderable: false, snapshot: { status: "running" } },
      });

      await vi.advanceTimersByTimeAsync(100);
      expect(registry.getPvRelationProtocolSeries(scenarioId)).toMatchObject({
        current: {
          renderable: true,
          snapshot: {
            status: "running",
            jobSnapshot: { beats: [{ beatIndex: 0 }, { beatIndex: 1 }] },
          },
        },
        pending: null,
      });

      await vi.advanceTimersByTimeAsync(100);
      const completed = registry.getPvRelationProtocol(scenarioId);
      expect(completed).toMatchObject({
        status: "complete",
        result,
      });
      expect(completed.jobSnapshot?.beats).toHaveLength(6);
      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual([
          "startPvRelationsProtocolJob",
          "pollPvRelationsProtocolJob",
          "pollPvRelationsProtocolJob",
        ]);

      registry.setPvRelationProtocolDemand("pv-pane", null);
      await vi.advanceTimersByTimeAsync(0);
      registry.setPvRelationProtocolDemand("pv-pane", { scenarioId });
      expect(client.request).toHaveBeenCalledTimes(3);
    } finally {
      registry.dispose();
      vi.useRealTimers();
    }
  });

  it("rejects a stale PV relation start and cancels the orphaned job", async () => {
    const revision = 99_100;
    const source = protocolResultSource(revision, 99.1);
    let resolveStart!: (response: unknown) => void;
    const client = pvRelationJobClientFixture((command) => {
      if (command.kind === "startPvRelationsProtocolJob") {
        return new Promise((resolve) => {
          resolveStart = resolve;
        });
      }
      if (command.kind === "cancelPvRelationsProtocolJob") {
        return pvRelationJobCancelResponse(command);
      }
      throw new Error(`Unexpected command ${command.kind}`);
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("pv-relation-stale-session", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      registry.requestPvRelationProtocol(scenarioId);
      publishSourceIdentity(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 99.102,
      });
      const startCommand = client.request.mock.calls[0]![0];
      resolveStart(pvRelationJobStartResponse(
        startCommand,
        pvRelationJobSnapshotFixture({
          source,
          sequence: 1,
          status: "running",
          beatCount: 0,
        }),
        100,
      ));
      await flushMicrotasks();

      expect(client.request.mock.calls.map(([command]) => command.kind))
        .toEqual([
          "startPvRelationsProtocolJob",
          "cancelPvRelationsProtocolJob",
        ]);
      expect(registry.getPvRelationProtocol(scenarioId))
        .toMatchObject({ status: "idle", result: null, jobSnapshot: null });
    } finally {
      registry.dispose();
    }
  });

  it("routes live PV relations through the hidden target and retains the last renderable generation", () => {
    const revision = 99_200;
    const client = pvRelationJobClientFixture(() => {
      throw new Error("the visible worker must not analyse a live target");
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("pv-live-target-routing", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      publishLiveTarget(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 99.201,
        parameterEpoch: 1,
        controlStateSha256: "1".repeat(64),
      });
      registry.setPvRelationProtocolDemand("pv-live-pane", { scenarioId });

      expect(client.request).not.toHaveBeenCalled();
      expect(registryMocks.pvAnalysisCoordinators).toHaveLength(1);
      const coordinator = registryMocks.pvAnalysisCoordinators[0]!;
      const firstRequest = coordinator.requestLatest.mock.calls[0]![0];
      expect(firstRequest).toMatchObject({
        visibleParameterEpoch: 1,
        visibleControlStateSha256: "1".repeat(64),
      });
      const firstSource = protocolResultSource(revision + 50, 120);
      coordinator.onJobSnapshot(hiddenPvAnalysisSnapshotEvent(
        firstRequest,
        pvRelationJobSnapshotFixture({
          source: firstSource,
          sequence: 1,
          status: "running",
          beatCount: 2,
        }),
      ));
      expect(registry.getPvRelationProtocolSeries(scenarioId)).toMatchObject({
        current: {
          renderable: true,
          snapshot: {
            calculationSource: "independent-case-source-warm-continuation",
            sourceIdentity: { controlStateSha256: "1".repeat(64) },
          },
        },
      });

      publishLiveTarget(registry, scenarioId, {
        revision: revision + 2,
        acceptedTimeSec: 99.202,
        parameterEpoch: 2,
        controlStateSha256: "2".repeat(64),
      });
      expect(coordinator.requestLatest).toHaveBeenCalledTimes(2);
      const secondRequest = coordinator.requestLatest.mock.calls[1]![0];
      coordinator.onJobSnapshot(hiddenPvAnalysisSnapshotEvent(
        firstRequest,
        pvRelationJobSnapshotFixture({
          source: firstSource,
          sequence: 2,
          status: "complete",
          beatCount: 6,
          result: pvRelationJobResultFixture(firstSource, 6),
        }),
      ));
      expect(registry.getPvRelationProtocol(scenarioId)).toMatchObject({
        status: "running",
        sourceIdentity: { controlStateSha256: "2".repeat(64) },
        jobSnapshot: null,
      });

      const secondSource = protocolResultSource(revision + 60, 130);
      coordinator.onJobSnapshot(hiddenPvAnalysisSnapshotEvent(
        secondRequest,
        pvRelationJobSnapshotFixture({
          source: secondSource,
          sequence: 1,
          status: "running",
          beatCount: 2,
        }),
      ));
      const series = registry.getPvRelationProtocolSeries(scenarioId);
      expect(series.current?.snapshot?.sourceIdentity.controlStateSha256)
        .toBe("2".repeat(64));
      expect(series.history[0]?.snapshot?.sourceIdentity.controlStateSha256)
        .toBe("1".repeat(64));

      publishLiveTarget(registry, scenarioId, {
        revision: revision + 3,
        acceptedTimeSec: 99.203,
        parameterEpoch: 3,
        controlStateSha256: "3".repeat(64),
      });
      const thirdRequest = coordinator.requestLatest.mock.calls[2]![0];
      coordinator.onError(hiddenPvAnalysisErrorEvent(
        thirdRequest,
        "hidden target reached P2",
      ));
      expect(registry.getPvRelationProtocolSeries(scenarioId).current?.snapshot
        ?.sourceIdentity.controlStateSha256).toBe("2".repeat(64));
      expect(registry.getPvRelationProtocolSeries(scenarioId).lastFailure)
        .toMatchObject({ errorMessage: "hidden target reached P2" });
    } finally {
      registry.dispose();
    }
  });

  it("does not recompute a completed hidden PV relation when the same target becomes visible P1", async () => {
    const revision = 99_300;
    const targetDigest = "3".repeat(64);
    const client = pvRelationJobClientFixture(() => {
      throw new Error("same-target visible P1 must reuse hidden PV evidence");
    });
    const registry = new ScientificProductScenarioRegistryV1(
      healthyResolution(),
      loadedRuntime("pv-hidden-visible-reuse", client, revision),
    );
    const scenarioId = registry.getDescriptorSnapshot()[0]!.id;

    try {
      publishLiveTarget(registry, scenarioId, {
        revision: revision + 1,
        acceptedTimeSec: 99.301,
        parameterEpoch: 4,
        controlStateSha256: targetDigest,
      });
      registry.setPvRelationProtocolDemand("pv-live-pane", { scenarioId });
      const coordinator = registryMocks.pvAnalysisCoordinators[0]!;
      const request = coordinator.requestLatest.mock.calls[0]![0];
      const hiddenSource = protocolResultSource(revision + 40, 130);
      coordinator.onJobSnapshot(hiddenPvAnalysisSnapshotEvent(
        request,
        pvRelationJobSnapshotFixture({
          source: hiddenSource,
          sequence: 2,
          status: "complete",
          beatCount: 6,
          result: pvRelationJobResultFixture(hiddenSource, 6),
        }),
      ));

      publishPeriodicSource(registry, scenarioId, {
        revision: revision + 80,
        acceptedTimeSec: 140,
        parameterEpoch: 4,
        controlStateSha256: targetDigest,
      });
      await flushMicrotasks();

      expect(client.request).not.toHaveBeenCalled();
      expect(registry.getPvRelationProtocol(scenarioId)).toMatchObject({
        status: "complete",
        calculationSource: "independent-case-source-warm-continuation",
        sourceIdentity: { controlStateSha256: targetDigest },
      });
    } finally {
      registry.dispose();
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

describe("scientific product saved-scenario catalog V1", () => {
  it("round-trips an immutable release-bound snapshot and replaces the same id", () => {
    const storage = savedScenarioMemoryStorage();
    const presentation = savedScenarioPresentation();
    const first = saveScientificProductScenarioV1(
      readScientificProductSavedScenarioCatalogV1(null),
      {
        id: "my-baseline",
        name: "  My baseline  ",
        color: "#2563eb",
        presentation,
        controlStateSha256: "9".repeat(64),
        controls: savedScenarioControls(),
        savedAt: new Date("2026-07-20T03:04:05.000Z"),
      },
    );

    expect(first.scenarios).toHaveLength(1);
    expect(first.scenarios[0]).toMatchObject({
      id: "my-baseline",
      name: "My baseline",
      sourceCaseId: healthyResolution().caseEntry.caseId,
      releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
      workspaceSha256: "8".repeat(64),
      controlStateSha256: "9".repeat(64),
      controls: savedScenarioControls(),
      savedAtIso: "2026-07-20T03:04:05.000Z",
    });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.scenarios)).toBe(true);
    expect(Object.isFrozen(first.scenarios[0]?.controls)).toBe(true);
    expect(writeScientificProductSavedScenarioCatalogV1(first, storage)).toBe(true);

    const restored = readScientificProductSavedScenarioCatalogV1(storage);
    expect(restored).toEqual(first);
    expect(Object.isFrozen(restored.scenarios[0]?.releaseRef)).toBe(true);

    const replaced = saveScientificProductScenarioV1(restored, {
      id: "my-baseline",
      name: "Updated baseline",
      color: "#0f766e",
      presentation,
      controlStateSha256: "a".repeat(64),
      controls: Object.freeze({
        ...savedScenarioControls(),
        systemic: 1.5,
      }),
      savedAt: new Date("2026-07-20T04:05:06.000Z"),
    });
    expect(replaced.scenarios).toHaveLength(1);
    expect(replaced.scenarios[0]).toMatchObject({
      name: "Updated baseline",
      controlStateSha256: "a".repeat(64),
      controls: { systemic: 1.5 },
    });
    expect(removeScientificProductSavedScenarioV1(replaced, "my-baseline").scenarios)
      .toEqual([]);
  });

  it("fails closed for unknown presets, out-of-domain controls, and duplicate ids", () => {
    const storage = savedScenarioMemoryStorage();
    const valid = saveScientificProductScenarioV1(
      readScientificProductSavedScenarioCatalogV1(null),
      {
        id: "saved-1",
        name: "Saved one",
        color: "#2563eb",
        presentation: savedScenarioPresentation(),
        controlStateSha256: "9".repeat(64),
        controls: savedScenarioControls(),
        savedAt: new Date("2026-07-20T03:04:05.000Z"),
      },
    );
    expect(writeScientificProductSavedScenarioCatalogV1(valid, storage)).toBe(true);
    const validSerialized = storage.serialized();
    const parsed = JSON.parse(validSerialized) as {
      scenarios: Array<Record<string, unknown>>;
    };

    parsed.scenarios[0]!.sourceCaseId = "main-wire/not-a-product-case";
    storage.replace(JSON.stringify(parsed));
    expect(readScientificProductSavedScenarioCatalogV1(storage).scenarios)
      .toEqual([]);

    const outOfDomain = JSON.parse(validSerialized) as {
      scenarios: Array<{ controls: Record<string, unknown> }>;
    };
    outOfDomain.scenarios[0]!.controls.systemic = 1.25;
    storage.replace(JSON.stringify(outOfDomain));
    expect(readScientificProductSavedScenarioCatalogV1(storage).scenarios)
      .toEqual([]);

    const duplicated = JSON.parse(validSerialized) as {
      scenarios: Array<Record<string, unknown>>;
    };
    duplicated.scenarios.push({ ...duplicated.scenarios[0]! });
    storage.replace(JSON.stringify(duplicated));
    expect(readScientificProductSavedScenarioCatalogV1(storage).scenarios)
      .toEqual([]);

    expect(() => saveScientificProductScenarioV1(valid, {
      id: "bad-control",
      name: "Bad control",
      color: "#2563eb",
      presentation: savedScenarioPresentation(),
      controlStateSha256: "9".repeat(64),
      controls: {
        ...savedScenarioControls(),
        peepCmH2O: 7,
      },
      savedAt: new Date("2026-07-20T03:04:05.000Z"),
    })).toThrow("outside the release-bound control domain");
  });
});

describe("scientific product validation context V1", () => {
  it("separates healthy reference findings from passing numerical-integrity gates", () => {
    const cycle = scientificProductValidationCycle();
    const frames = [...cycle.frames];
    for (const observableId of [
      "solver.mechanics.residual_norm",
      "solver.circulation.scaled_residual_infinity_norm",
      "solver.continuity.maximum_residual",
      "conservation.total_blood_volume.error",
    ] as const satisfies readonly MainWireScientificObservableIdV1[]) {
      frames[0] = replaceValidationObservable(
        frames[0]!,
        observableId,
        Object.freeze({
          observableId,
          value: null,
          availability: "not-evaluated-at-accepted-state" as const,
          quality: "not-assessed" as const,
        }),
      );
    }

    const context = createScientificProductValidationContextV1(Object.freeze({
      ...cycle,
      frames: Object.freeze(frames),
    }));

    expect(context).toMatchObject({
      cycleAvailable: true,
      cycleEvidence: "validated-periodic-P1",
      referenceSubject: {
        bodySurfaceAreaM2: 1.9,
        state: "resting-adult-research-reference",
      },
    });
    expect(context.referenceResults).toHaveLength(6);
    expect(context.referenceResults.find(({ gateId }) => gateId === "healthy.lv.edvi"))
      .toMatchObject({
        value: expect.closeTo(120 / 1.9, 10),
        unit: "mL/m²",
        status: "within-reference",
      });
    expect(context.referenceResults.find(({ gateId }) => gateId === "healthy.lv.esvi"))
      .toMatchObject({
        value: expect.closeTo(80 / 1.9, 10),
        status: "outside-reference",
      });
    expect(context.referenceResults.find(({ gateId }) => gateId === "healthy.lv.ef"))
      .toMatchObject({
        value: expect.closeTo(1 / 3, 10),
        unit: "fraction",
        status: "outside-reference",
      });
    expect(context.numericalResults).toHaveLength(4);
    expect(context.numericalResults).toEqual(context.numericalResults.map(
      () => expect.objectContaining({ value: 0, status: "pass" }),
    ));
    expect(context.valveFlow.find(({ valveId }) => valveId === "AoV"))
      .toMatchObject({
        forwardVolumeMl: expect.closeTo(100 / Math.PI, 3),
        reverseVolumeMl: expect.closeTo(100 / Math.PI, 3),
        regurgitantFractionPercent: expect.closeTo(100, 3),
        peakGradientMmHg: expect.closeTo(15, 3),
      });
    expect(context.waveformAvailability).toHaveLength(7);
    expect(context.waveformAvailability.every(({ complete }) => complete))
      .toBe(true);
  });

  it("fails a forged cycle closed and localizes missing accepted-step evidence", () => {
    const cycle = scientificProductValidationCycle();
    const forged = Object.freeze({
      ...cycle,
      evidence: Object.freeze({
        ...cycle.evidence,
        periodicOrbitClassifiedP1: false,
      }),
    }) as unknown as MainWireScientificValidatedTerminalCycleV1;
    expect(createScientificProductValidationContextV1(forged)).toMatchObject({
      cycleAvailable: false,
      cycleEvidence: "unavailable",
      referenceResults: [],
      numericalResults: [],
    });

    const frames = [...cycle.frames];
    frames[10] = replaceValidationObservable(
      frames[10]!,
      "solver.mechanics.residual_norm",
      Object.freeze({
        observableId: "solver.mechanics.residual_norm",
        value: -1,
        availability: "available",
        quality: "accepted-derived",
      }),
    );
    frames[10] = replaceValidationObservable(
      frames[10]!,
      "solver.circulation.scaled_residual_infinity_norm",
      Object.freeze({
        observableId: "solver.circulation.scaled_residual_infinity_norm",
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      }),
    );
    frames[10] = replaceValidationObservable(
      frames[10]!,
      "valve.AoV.flow",
      Object.freeze({
        observableId: "valve.AoV.flow",
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      }),
    );
    const context = createScientificProductValidationContextV1(Object.freeze({
      ...cycle,
      frames: Object.freeze(frames),
    }));

    expect(context.cycleAvailable).toBe(true);
    expect(context.numericalResults.find(
      ({ gateId }) => gateId === "numerics.mechanics.residual",
    )).toMatchObject({ value: 1, status: "error" });
    expect(context.numericalResults.find(
      ({ gateId }) => gateId === "numerics.circulation.residual",
    )).toMatchObject({ value: null, status: "unavailable" });
    expect(context.numericalResults.filter(({ status }) => status === "pass"))
      .toHaveLength(2);
    expect(context.valveFlow.find(({ valveId }) => valveId === "AoV"))
      .toMatchObject({
        forwardVolumeMl: null,
        reverseVolumeMl: null,
        regurgitantFractionPercent: null,
      });
    expect(context.waveformAvailability.find(
      ({ observableId }) => observableId === "valve.AoV.flow",
    )).toMatchObject({
      availableFrameCount: 500,
      totalFrameCount: 501,
      complete: false,
    });
  });
});

function savedScenarioMemoryStorage(): ScientificProductSavedScenarioStorageV1 &
Readonly<{
  serialized: () => string;
  replace: (value: string) => void;
}> {
  let value: string | null = null;
  return Object.freeze({
    getItem: (key: string) => key === SCIENTIFIC_PRODUCT_SAVED_SCENARIO_STORAGE_KEY_V1
      ? value
      : null,
    setItem: (key: string, next: string) => {
      if (key !== SCIENTIFIC_PRODUCT_SAVED_SCENARIO_STORAGE_KEY_V1) {
        throw new Error(`unexpected storage key ${key}`);
      }
      value = next;
    },
    serialized: () => {
      if (value === null) throw new Error("saved scenario fixture was not written");
      return value;
    },
    replace: (next: string) => {
      value = next;
    },
  });
}

function savedScenarioPresentation(): ScientificProductScenarioPresentationV1 {
  return Object.freeze({
    descriptor: Object.freeze({
      id: "fixture-scenario",
      name: "Fixture scenario",
      color: "#2563eb",
      isVisible: true,
      lifecycle: "ready" as const,
      statusMessage: "Ready",
      source: Object.freeze({
        caseId: healthyResolution().caseEntry.caseId,
        releaseId: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.id,
        releaseVersion: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.version,
        releaseSha256: SCIENTIFIC_PRODUCT_RELEASE_REF_V1.sha256,
      }),
    }),
    workspaceDocument: Object.freeze({
      ref: Object.freeze({ sha256: "8".repeat(64) }),
    }),
  }) as unknown as ScientificProductScenarioPresentationV1;
}

function savedScenarioControls(): ScientificWorkbenchResearchControlDraftV0 {
  return Object.freeze({
    systemic: 1,
    pulmonary: 1,
    venousTone: 0.15,
    arterialStiffness: 0.75,
    peepCmH2O: 0,
    pericardialFluidVolumeMl: 0,
  });
}

function scientificProductValidationCycle():
ReturnType<typeof assembleScientificWorkbenchTerminalCycleV1> {
  const frames = Array.from(
    {
      length:
        SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.expectedObservableSampleCount,
    },
    (_, index) => scientificProductValidationFrame(
      20_000 + index,
      20 + index * SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec,
      index === 0 ? "exact-checkpoint-restore" : "accepted-step",
    ),
  );
  return assembleScientificWorkbenchTerminalCycleV1(frames[0]!, frames.slice(1));
}

function scientificProductValidationFrame(
  revision: number,
  acceptedTimeSec: number,
  source: MainWireScientificObservableFrameV1["source"],
): MainWireScientificObservableFrameV1 {
  const phaseSec = acceptedTimeSec - 20;
  const omega = 2 * Math.PI * phaseSec;
  const sourceValues: Partial<Record<MainWireScientificObservableIdV1, number>> = {
    "hemodynamics.pressure.absolute.LA": 10 + 2 * Math.sin(omega),
    "hemodynamics.pressure.absolute.RA": 5 + Math.sin(omega),
    "hemodynamics.pressure.absolute.LV": 100 + 15 * Math.sin(omega),
    "hemodynamics.pressure.absolute.RV": 25 + 5 * Math.sin(omega),
    "hemodynamics.pressure.absolute.Ao": 90 + 10 * Math.sin(omega),
    "hemodynamics.pressure.absolute.PA": 15 + 5 * Math.sin(omega),
    "hemodynamics.pressure.absolute.PVein": 12 + 2 * Math.sin(omega),
    "hemodynamics.volume.LV": 100 + 20 * Math.cos(omega),
    "hemodynamics.volume.RV": 115 + 15 * Math.cos(omega),
    "valve.MV.flow": 50 + 100 * Math.sin(omega),
    "valve.AoV.flow": 100 * Math.sin(omega),
    "valve.TV.flow": 40 + 80 * Math.sin(omega),
    "valve.PV.flow": 80 + 20 * Math.sin(omega),
  };
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((entry) => [
      entry.observableId,
      entry.modelingStatus === "not-modeled"
        ? Object.freeze({
          observableId: entry.observableId,
          value: null,
          availability: "not-modeled" as const,
          quality: "not-assessed" as const,
        })
        : Object.freeze({
          observableId: entry.observableId,
          value: sourceValues[entry.observableId] ?? 0,
          availability: "available" as const,
          quality: "accepted-derived" as const,
        }),
    ]),
  ) as MainWireScientificObservableFrameV1["values"];
  return Object.freeze({
    frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
    sourceObservationId: "main-wire-scientific-session-observation-v1",
    source,
    revision,
    acceptedTimeSec,
    values: Object.freeze(values),
  });
}

function replaceValidationObservable(
  frame: MainWireScientificObservableFrameV1,
  observableId: MainWireScientificObservableIdV1,
  replacement: MainWireScientificObservableValueV1,
): MainWireScientificObservableFrameV1 {
  return Object.freeze({
    ...frame,
    values: Object.freeze({
      ...frame.values,
      [observableId]: replacement,
    }),
  });
}

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
  detailMode?: "standard" | "settled-reference" | "compare";
}>;

type PvRelationJobCommandFixture = Readonly<{
  kind:
    | "startPvRelationsProtocolJob"
    | "pollPvRelationsProtocolJob"
    | "cancelPvRelationsProtocolJob";
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

function pvRelationJobClientFixture(
  handler: (command: PvRelationJobCommandFixture) => unknown,
) {
  const request = vi.fn(async (command: PvRelationJobCommandFixture) => (
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

function pvRelationPressurePointFixture(
  beatIndex: number,
  phase: "end-diastole" | "end-systole",
) {
  const endDiastole = phase === "end-diastole";
  return Object.freeze({
    sampleIndex: endDiastole ? 480 : 220,
    phase01: endDiastole ? 0.96 : 0.44,
    volumeMl: endDiastole ? 125 - beatIndex * 5 : 52 - beatIndex * 0.5,
    absolutePressureMmHg: endDiastole ? 10 : 115 - beatIndex * 3,
    transmuralPressureMmHg: endDiastole ? 8 : 112 - beatIndex * 3,
    externalPressureMmHg: endDiastole ? 2 : 3,
  });
}

function pvRelationBeatFixture(beatIndex: number) {
  return Object.freeze({
    beatIndex,
    role: beatIndex === 0 ? "baseline" as const : "preload-reduction" as const,
    vcRaResistanceScaleStart: Math.max(1, 2 ** (beatIndex - 1)),
    vcRaResistanceScaleEnd: 2 ** beatIndex,
    resistanceScaleAtEndDiastole: 2 ** beatIndex,
    resistanceScaleAtEndSystole: 2 ** beatIndex,
    interventionRampCompletedBeforeEndDiastole: true,
    fixedTotalBloodVolumeMl: 5_000,
    samples: Object.freeze([]),
    endDiastolic: pvRelationPressurePointFixture(beatIndex, "end-diastole"),
    endSystolic: pvRelationPressurePointFixture(beatIndex, "end-systole"),
    strokeWorkTransmuralMmHgMl: 7_000 - beatIndex * 350,
    meanRapTransmuralMmHg: 5 - beatIndex * 0.5,
    meanLapTransmuralMmHg: 10 - beatIndex * 0.6,
    netCardiacOutputLMin: 5 - beatIndex * 0.15,
    totalBloodVolumeAbsoluteErrorMl: 0,
    maximumContinuityAbsoluteResidualMl: 0,
    classification: "fit-eligible" as const,
    valid: true,
    rejectionReason: null,
  });
}

function pvRelationJobResultFixture(
  source: ReturnType<typeof protocolResultSource>,
  beatCount: number,
) {
  return Object.freeze({
    protocolId: "main-wire-scientific-pv-relations-protocol-v2" as const,
    protocolVersion: "2.0.0" as const,
    source: Object.freeze({
      revision: source.revision,
      acceptedTimeSec: source.acceptedTimeSec,
      fixedTotalBloodVolumeMl: source.fixedTotalBloodVolumeMl,
    }),
    beats: Object.freeze(Array.from(
      { length: beatCount },
      (_, beatIndex) => pvRelationBeatFixture(beatIndex),
    )),
  });
}

function pvRelationJobSnapshotFixture(input: Readonly<{
  source: ReturnType<typeof protocolResultSource>;
  sequence: number;
  status: "running" | "complete";
  beatCount: number;
  result?: ReturnType<typeof pvRelationJobResultFixture>;
}>) {
  const beats = Object.freeze(Array.from(
    { length: input.beatCount },
    (_, beatIndex) => pvRelationBeatFixture(beatIndex),
  ));
  return Object.freeze({
    jobId: "pv-relation-job-1",
    sequence: input.sequence,
    status: input.status,
    stage: input.status === "complete"
      ? "complete" as const
      : "preload-reduction" as const,
    source: Object.freeze({
      revision: input.source.revision,
      acceptedTimeSec: input.source.acceptedTimeSec,
      fixedTotalBloodVolumeMl: input.source.fixedTotalBloodVolumeMl,
    }),
    sourceFingerprint: "d".repeat(64),
    cacheStatus: "miss" as const,
    beats,
    progress: input.status === "running" && beats.length > 0
      ? Object.freeze({
        protocolId: "main-wire-scientific-pv-relations-protocol-v2" as const,
        completedBeatCount: beats.length,
        minimumTotalBeatCount: 6,
        maximumTotalBeatCount: 8,
        latestBeat: beats.at(-1),
        beats,
        fitPointSelection: Object.freeze({}),
        provisionalAnalysis: Object.freeze({}),
        canStopEarly: false,
      })
      : null,
    result: input.result ?? null,
    errorMessage: null,
  });
}

function pvRelationJobStartResponse(
  command: PvRelationJobCommandFixture,
  snapshot: ReturnType<typeof pvRelationJobSnapshotFixture>,
  suggestedPollIntervalMs: number,
) {
  return Object.freeze({
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: "startPvRelationsProtocolJob" as const,
    payload: Object.freeze({
      kind: "pvRelationsProtocolJobStarted" as const,
      job: Object.freeze({
        jobId: snapshot.jobId,
        snapshot,
        suggestedPollIntervalMs,
      }),
    }),
  });
}

function pvRelationJobProgressResponse(
  command: PvRelationJobCommandFixture,
  snapshot: ReturnType<typeof pvRelationJobSnapshotFixture>,
) {
  return Object.freeze({
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: "pollPvRelationsProtocolJob" as const,
    payload: Object.freeze({
      kind: "pvRelationsProtocolJobProgress" as const,
      snapshot,
    }),
  });
}

function pvRelationJobCancelResponse(command: PvRelationJobCommandFixture) {
  return Object.freeze({
    ok: true as const,
    requestId: command.requestId,
    sessionId: command.sessionId,
    commandKind: "cancelPvRelationsProtocolJob" as const,
    payload: Object.freeze({
      kind: "pvRelationsProtocolJobCancelled" as const,
      jobId: command.jobId,
    }),
  });
}

function publishSourceIdentity(
  registry: ScientificProductScenarioRegistryV1,
  scenarioId: string,
  identity: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    parameterEpoch?: number;
    controlStateSha256?: string;
  }>,
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
        parameterEpoch:
          identity.parameterEpoch ?? input.source.context.parameterEpoch,
        controlState: identity.controlStateSha256 === undefined
          ? input.source.context.controlState
          : Object.freeze({
            ...input.source.context.controlState,
            targetStateSha256: identity.controlStateSha256,
          }),
        stateIdentity: Object.freeze({
          ...input.source.context.stateIdentity,
          revision: identity.revision,
          acceptedTimeSec: identity.acceptedTimeSec,
        }),
      }),
    }),
  });
  disconnect();
}

function publishLiveTarget(
  registry: ScientificProductScenarioRegistryV1,
  scenarioId: string,
  identity: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    parameterEpoch: number;
    controlStateSha256: string;
  }>,
): void {
  const store = registry.getRuntime(scenarioId)!.controlStore;
  const ownerToken = Symbol("protocol-live-target");
  const disconnect = store.connectOwner(ownerToken, { current: null });
  const snapshot = store.getSnapshot();
  const { actions: _actions, ownerConnected: _ownerConnected, ...input } =
    snapshot;
  const controlState = Object.freeze({
    ...input.source.context.controlState,
    targetStateSha256: identity.controlStateSha256,
  });
  const context = Object.freeze({
    ...input.source.context,
    parameterEpoch: identity.parameterEpoch,
    controlState,
    stateIdentity: Object.freeze({
      ...input.source.context.stateIdentity,
      revision: identity.revision,
      acceptedTimeSec: identity.acceptedTimeSec,
    }),
  });
  const boundaryFrame = Object.freeze({
    ...input.source.frames.at(-1),
    revision: identity.revision,
    acceptedTimeSec: identity.acceptedTimeSec,
  }) as MainWireScientificObservableFrameV1;
  store.publishOwnerSnapshot(ownerToken, {
    ...input,
    phase: "live-running",
    candidate: Object.freeze({
      sessionId: `candidate-${identity.parameterEpoch}`,
      context,
      boundaryFrame,
    }),
    frames: Object.freeze([boundaryFrame]),
    targetControlStateSha256: identity.controlStateSha256,
    liveTransitionOriginAcceptedTimeSec: identity.acceptedTimeSec,
    liveActive: true,
    busy: true,
    noChange: false,
    provenance: Object.freeze({
      displayedFrameOwner: "candidate" as const,
      displayedParameterEpoch: identity.parameterEpoch,
      displayedControlStateSha256: identity.controlStateSha256,
      displayedEvidence: "open-transient-no-periodic-claim" as const,
    }),
  });
  disconnect();
}

function publishPeriodicSource(
  registry: ScientificProductScenarioRegistryV1,
  scenarioId: string,
  identity: Readonly<{
    revision: number;
    acceptedTimeSec: number;
    parameterEpoch: number;
    controlStateSha256: string;
  }>,
): void {
  const store = registry.getRuntime(scenarioId)!.controlStore;
  const ownerToken = Symbol("protocol-periodic-source");
  const disconnect = store.connectOwner(ownerToken, { current: null });
  const snapshot = store.getSnapshot();
  const { actions: _actions, ownerConnected: _ownerConnected, ...input } =
    snapshot;
  const sourceFrame = Object.freeze({
    ...input.source.frames.at(-1),
    revision: identity.revision,
    acceptedTimeSec: identity.acceptedTimeSec,
  }) as MainWireScientificObservableFrameV1;
  const source = Object.freeze({
    ...input.source,
    frames: Object.freeze([sourceFrame]),
    context: Object.freeze({
      ...input.source.context,
      parameterEpoch: identity.parameterEpoch,
      controlState: Object.freeze({
        ...input.source.context.controlState,
        targetStateSha256: identity.controlStateSha256,
      }),
      stateIdentity: Object.freeze({
        ...input.source.context.stateIdentity,
        revision: identity.revision,
        acceptedTimeSec: identity.acceptedTimeSec,
      }),
    }),
  });
  store.publishOwnerSnapshot(ownerToken, {
    ...input,
    phase: "idle",
    source,
    candidate: null,
    frames: source.frames,
    targetControlStateSha256: null,
    liveTransitionOriginAcceptedTimeSec: null,
    liveActive: false,
    busy: false,
    noChange: true,
    provenance: Object.freeze({
      displayedFrameOwner: "source" as const,
      displayedParameterEpoch: identity.parameterEpoch,
      displayedControlStateSha256: identity.controlStateSha256,
      displayedEvidence:
        "target-period1-and-following-cycle-validated" as const,
    }),
  });
  disconnect();
}

type HiddenAnalysisRequestFixture = Readonly<{
  requestToken: string;
  visibleParameterEpoch: number;
  visibleControlStateSha256: string;
  detailMode: "standard" | "settled-reference" | "compare";
}>;

function hiddenAnalysisSnapshotEvent(
  request: HiddenAnalysisRequestFixture,
  snapshot: ReturnType<typeof guytonJobSnapshotFixture>,
) {
  return Object.freeze({
    requestToken: request.requestToken,
    visibleParameterEpoch: request.visibleParameterEpoch,
    visibleControlStateSha256: request.visibleControlStateSha256,
    detailMode: request.detailMode,
    provenance: "independent-case-source-warm-continuation" as const,
    snapshot,
  });
}

function hiddenAnalysisErrorEvent(
  request: HiddenAnalysisRequestFixture,
  message: string,
) {
  return Object.freeze({
    requestToken: request.requestToken,
    visibleParameterEpoch: request.visibleParameterEpoch,
    visibleControlStateSha256: request.visibleControlStateSha256,
    detailMode: request.detailMode,
    provenance: "independent-case-source-warm-continuation" as const,
    phase: "settlement" as const,
    message,
    previousSnapshotRetained: true as const,
  });
}

type HiddenPvAnalysisRequestFixture = Readonly<{
  requestToken: string;
  visibleParameterEpoch: number;
  visibleControlStateSha256: string;
}>;

function hiddenPvAnalysisSnapshotEvent(
  request: HiddenPvAnalysisRequestFixture,
  snapshot: ReturnType<typeof pvRelationJobSnapshotFixture>,
) {
  return Object.freeze({
    requestToken: request.requestToken,
    visibleParameterEpoch: request.visibleParameterEpoch,
    visibleControlStateSha256: request.visibleControlStateSha256,
    provenance: "independent-case-source-warm-continuation" as const,
    snapshot,
  });
}

function hiddenPvAnalysisErrorEvent(
  request: HiddenPvAnalysisRequestFixture,
  message: string,
) {
  return Object.freeze({
    requestToken: request.requestToken,
    visibleParameterEpoch: request.visibleParameterEpoch,
    visibleControlStateSha256: request.visibleControlStateSha256,
    provenance: "independent-case-source-warm-continuation" as const,
    phase: "settlement" as const,
    message,
    previousSnapshotRetained: true as const,
  });
}
