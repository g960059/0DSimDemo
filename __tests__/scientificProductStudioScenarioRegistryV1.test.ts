import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ScientificWorkbenchResearchControlStoreV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import type {
  ScientificProductStudioScenarioControllerV1,
} from "@/components/scientificProduct/ScientificProductStudioScenarioControllerV1";
import type {
  ScientificProductStudioHemodynamicAnalysisErrorEventV1,
  ScientificProductStudioHemodynamicAnalysisRequestV1,
  ScientificProductStudioHemodynamicAnalysisSnapshotEventV1,
} from "@/components/scientificProduct/ScientificProductStudioHemodynamicAnalysisCoordinatorV1";
import type {
  MainWireScientificHemodynamicJobSnapshotV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import type {
  StudioArtifactKindV1,
  StudioArtifactRefV1,
  StudioSettledAnalysisSourceV1,
} from "@/studio/contracts/v1";

const registryMocks = vi.hoisted(() => ({
  bootstrap: vi.fn(),
  createController: vi.fn(),
  coordinators: [] as MockAnalysisCoordinatorV1[],
}));

vi.mock(
  "@/components/scientificProduct/ScientificProductStudioBootstrapV1",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import(
        "@/components/scientificProduct/ScientificProductStudioBootstrapV1"
      )
    >();
    return {
      ...actual,
      bootstrapScientificProductStudioSourceV1: registryMocks.bootstrap,
    };
  },
);

vi.mock(
  "@/components/scientificProduct/ScientificProductStudioScenarioControllerV1",
  () => ({
    ScientificProductStudioScenarioControllerV1: class {
      static readonly create = registryMocks.createController;
    },
  }),
);

vi.mock(
  "@/components/scientificProduct/ScientificProductStudioHemodynamicAnalysisCoordinatorV1",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import(
        "@/components/scientificProduct/ScientificProductStudioHemodynamicAnalysisCoordinatorV1"
      )
    >();
    return {
      ...actual,
      createScientificProductStudioHemodynamicAnalysisCoordinatorV1:
        vi.fn((options: Readonly<{
          onSnapshot(
            event: ScientificProductStudioHemodynamicAnalysisSnapshotEventV1,
          ): void;
          onError(
            event: ScientificProductStudioHemodynamicAnalysisErrorEventV1,
          ): void;
        }>) => {
          const coordinator: MockAnalysisCoordinatorV1 = {
            requestLatest: vi.fn(),
            clearDemand: vi.fn(),
            dispose: vi.fn(async () => undefined),
            onSnapshot: options.onSnapshot,
            onError: options.onError,
          };
          registryMocks.coordinators.push(coordinator);
          return coordinator;
        }),
    };
  },
);

import {
  ScientificProductStudioScenarioRegistryV1,
  type ScientificProductStudioScenarioRuntimeV1,
} from "@/components/scientificProduct/ScientificProductStudioScenarioRegistryV1";
import {
  resolveScientificProductCaseRouteV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
} from "@/studio/contracts/v1";
import {
  InMemoryContentAddressedArtifactStoreV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";

describe("Scientific Product Studio scenario registry V1", () => {
  beforeEach(() => {
    registryMocks.bootstrap.mockReset();
    registryMocks.createController.mockReset();
    registryMocks.coordinators.length = 0;
    registryMocks.bootstrap.mockImplementation(
      async (input: Readonly<{ scenarioId: string }>) =>
        bootstrapFixtureV1(input.scenarioId),
    );
    registryMocks.createController.mockImplementation(
      async (input: Readonly<{
        bootstrap: Readonly<{ testScenarioId: string }>;
      }>) => {
        const fixture = controllerFixtureV1(
          settledSourceV1(input.bootstrap.testScenarioId, 0, "9"),
        );
        loadedControllerFixturesV1.set(
          input.bootstrap.testScenarioId,
          fixture,
        );
        return fixture.controller;
      },
    );
    loadedControllerFixturesV1.clear();
  });

  it("accepts only the latest request and relabels a role-only promotion without restarting the numerical sweep", async () => {
    const scenarioId = "scenario/registry-latest";
    const sourceA = settledSourceV1(scenarioId, 1, "1");
    const sourceB = settledSourceV1(scenarioId, 2, "2");
    const controller = controllerFixtureV1(sourceA);
    const registry = registryFixtureV1(scenarioId, controller);
    registry.connect();
    const coordinator = registryMocks.coordinators[0]!;

    registry.setHemodynamicProtocolDemand("graph-pane", {
      scenarioId,
      kind: "guyton-starling",
      detailMode: "compare",
    });
    expect(coordinator.requestLatest).toHaveBeenCalledTimes(1);
    const requestA = requestAtV1(coordinator, 0);

    controller.setSettledSource(sourceB);
    controller.emitStore();
    expect(coordinator.requestLatest).toHaveBeenCalledTimes(2);
    const requestB = requestAtV1(coordinator, 1);

    coordinator.onSnapshot(completeSnapshotEventV1(requestA, 1));
    expect(
      registry.getHemodynamicProtocolSeries(
        scenarioId,
        "guyton-starling",
      ).current,
    ).toBeNull();

    coordinator.onSnapshot(completeSnapshotEventV1(requestB, 2));
    const candidate = registry.getHemodynamicProtocolSeries(
      scenarioId,
      "guyton-starling",
    ).current;
    expect(candidate).toMatchObject({
      status: "complete",
      source: {
        sourceIdentityKey: expect.any(String),
        sourceIdentity: {
          calculationSource: "automatic-strict-candidate",
        },
      },
      snapshot: {
        calculationSource: "automatic-strict-candidate",
      },
    });

    controller.setSettledSource(Object.freeze({
      ...sourceB,
      sourceRole: "promoted-settled-source" as const,
    }));
    controller.emitStore();

    const promoted = registry.getHemodynamicProtocolSeries(
      scenarioId,
      "guyton-starling",
    ).current;
    expect(coordinator.requestLatest).toHaveBeenCalledTimes(2);
    expect(promoted?.generationId).toBe(candidate?.generationId);
    expect(promoted?.source.sourceIdentityKey)
      .toBe(candidate?.source.sourceIdentityKey);
    expect(promoted).toMatchObject({
      source: {
        sourceIdentity: {
          calculationSource: "visible-period1-source",
        },
      },
      snapshot: {
        calculationSource: "visible-period1-source",
        sourceIdentity: {
          calculationSource: "visible-period1-source",
        },
      },
    });

    await registry.dispose();
  });

  it("surfaces a pre-first-snapshot acquisition failure through the protocol snapshot and subscription", async () => {
    const scenarioId = "scenario/registry-pre-first-failure";
    const controller = controllerFixtureV1(
      settledSourceV1(scenarioId, 1, "3"),
    );
    const registry = registryFixtureV1(scenarioId, controller);
    const coordinator = registryMocks.coordinators[0]!;
    const protocolListener = vi.fn();
    registry.subscribeHemodynamicProtocols(protocolListener);

    registry.setHemodynamicProtocolDemand("graph-pane", {
      scenarioId,
      kind: "guyton-starling",
      detailMode: "standard",
    });
    const request = requestAtV1(coordinator, 0);
    coordinator.onError(Object.freeze({
      requestToken: request.requestToken,
      source: request.source,
      detailMode: request.detailMode,
      message: "artifact restore failed before Worker startup",
      previousSnapshotRetained: true as const,
    }));

    const series = registry.getHemodynamicProtocolSeries(
      scenarioId,
      "guyton-starling",
    );
    const aggregate =
      registry.getHemodynamicProtocolSeriesSnapshot().scenarios[
        `${scenarioId}:guyton-starling`
      ];
    expect(protocolListener).toHaveBeenCalledOnce();
    expect(series).toMatchObject({
      current: null,
      pending: null,
      lastFailure: {
        generationId: expect.stringMatching(
          /^studio-hemodynamic-generation-/,
        ),
        source: null,
        sequence: 0,
        errorMessage: "artifact restore failed before Worker startup",
      },
    });
    expect(aggregate?.lastFailure).toEqual(series.lastFailure);
    expect(coordinator.clearDemand).toHaveBeenCalledOnce();

    await registry.dispose();
  });

  it("removes protocol state and joins removed scenario disposal when the whole registry is disposed", async () => {
    const initialScenarioId = "scenario/registry-removal-initial";
    const initialController = controllerFixtureV1(
      settledSourceV1(initialScenarioId, 0, "4"),
    );
    const registry = registryFixtureV1(initialScenarioId, initialController);
    registry.connect();
    const addedScenarioId = registry.addPreset("main-wire/as-severe");
    expect(addedScenarioId).not.toBeNull();
    await waitForV1(() =>
      registryMocks.coordinators.length === 2
      && registry.getDescriptorSnapshot().some((descriptor) =>
        descriptor.id === addedScenarioId && descriptor.lifecycle === "ready"
      )
    );
    const addedController = loadedControllerFixturesV1.get(
      addedScenarioId!,
    )!;
    const addedCoordinator = registryMocks.coordinators[1]!;

    registry.setHemodynamicProtocolDemand("added-graph-pane", {
      scenarioId: addedScenarioId!,
      kind: "guyton-starling",
      detailMode: "standard",
    });
    const addedRequest = requestAtV1(addedCoordinator, 0);
    addedCoordinator.onSnapshot(completeSnapshotEventV1(addedRequest, 1));
    expect(
      registry.getHemodynamicProtocolSeriesSnapshot().scenarios[
        `${addedScenarioId}:guyton-starling`
      ],
    ).toBeDefined();

    const coordinatorDisposeGate = deferredV1<void>();
    const controllerDisposeGate = deferredV1<void>();
    addedCoordinator.dispose.mockImplementation(
      () => coordinatorDisposeGate.promise,
    );
    addedController.controller.dispose.mockImplementation(
      () => controllerDisposeGate.promise,
    );

    expect(registry.remove(addedScenarioId!)).toBe(true);
    expect(registry.getDescriptorSnapshot().some(({ id }) =>
      id === addedScenarioId
    )).toBe(false);
    expect(
      registry.getHemodynamicProtocolSeriesSnapshot().scenarios[
        `${addedScenarioId}:guyton-starling`
      ],
    ).toBeUndefined();
    expect(addedCoordinator.dispose).toHaveBeenCalledOnce();
    expect(addedController.controller.dispose).toHaveBeenCalledOnce();

    let registryDisposed = false;
    const registryDisposal = registry.dispose().then(() => {
      registryDisposed = true;
    });
    await Promise.resolve();
    expect(registryDisposed).toBe(false);

    coordinatorDisposeGate.resolve(undefined);
    controllerDisposeGate.resolve(undefined);
    await registryDisposal;
    expect(registryDisposed).toBe(true);
    expect(registryMocks.coordinators[0]!.dispose).toHaveBeenCalledOnce();
    expect(initialController.controller.dispose).toHaveBeenCalledOnce();
  });

  it("reconciles demand registered while a scenario is loading as soon as its coordinator attaches", async () => {
    const bootstrapGate = deferredV1<
      ReturnType<typeof bootstrapFixtureV1>
    >();
    registryMocks.bootstrap.mockImplementationOnce(
      () => bootstrapGate.promise,
    );
    const initialScenarioId = "scenario/registry-reattach-initial";
    const initialController = controllerFixtureV1(
      settledSourceV1(initialScenarioId, 0, "5"),
    );
    const registry = registryFixtureV1(initialScenarioId, initialController);
    registry.connect();

    const addedScenarioId = registry.addPreset("main-wire/as-severe");
    expect(addedScenarioId).not.toBeNull();
    registry.setHemodynamicProtocolDemand("loading-graph-pane", {
      scenarioId: addedScenarioId!,
      kind: "guyton-starling",
      detailMode: "settled-reference",
    });
    expect(registryMocks.coordinators).toHaveLength(1);

    bootstrapGate.resolve(bootstrapFixtureV1(addedScenarioId!));
    await waitForV1(() =>
      registryMocks.coordinators.length === 2
      && registryMocks.coordinators[1]!.requestLatest.mock.calls.length === 1
    );
    const attachedRequest = requestAtV1(registryMocks.coordinators[1]!, 0);
    expect(attachedRequest).toMatchObject({
      source: {
        scenarioId: addedScenarioId,
        sourceRole: "initial-settled-source",
      },
      detailMode: "settled-reference",
    });

    await registry.dispose();
  });

  it("does not rerender three unrelated lanes when one of four frame stores advances", async () => {
    const initialScenarioId = "scenario/registry-four-lane-initial";
    const initialController = controllerFixtureV1(
      settledSourceV1(initialScenarioId, 0, "6"),
    );
    const registry = registryFixtureV1(initialScenarioId, initialController);
    registry.connect();
    const addedScenarioIds = [
      registry.addPreset("main-wire/as-severe"),
      registry.addPreset("main-wire/as-severe"),
      registry.addPreset("main-wire/as-severe"),
    ];
    expect(addedScenarioIds.every((id) => id !== null)).toBe(true);
    await waitForV1(() =>
      registry.getDescriptorSnapshot().length === 4
      && registry.getDescriptorSnapshot().every(({ lifecycle }) =>
        lifecycle === "ready"
      )
    );

    const scenarioIds = [initialScenarioId, ...addedScenarioIds] as string[];
    const renderCounts =
      new Map(scenarioIds.map((scenarioId) => [scenarioId, 0]));
    const lastSnapshots = new Map(scenarioIds.map((scenarioId) => [
      scenarioId,
      registry.getScenarioPresentationSnapshot(scenarioId),
    ]));
    const unsubscribers = scenarioIds.map((scenarioId) =>
      registry.subscribeScenarioPresentation(scenarioId, () => {
        const next = registry.getScenarioPresentationSnapshot(scenarioId);
        if (next !== lastSnapshots.get(scenarioId)) {
          lastSnapshots.set(scenarioId, next);
          renderCounts.set(scenarioId, renderCounts.get(scenarioId)! + 1);
        }
      })
    );

    const before = new Map(lastSnapshots);
    initialController.emitFrames();

    expect(Object.fromEntries(renderCounts)).toEqual({
      [initialScenarioId]: 1,
      [scenarioIds[1]!]: 0,
      [scenarioIds[2]!]: 0,
      [scenarioIds[3]!]: 0,
    });
    expect(registry.getScenarioPresentationSnapshot(initialScenarioId))
      .not.toBe(before.get(initialScenarioId));
    for (const scenarioId of scenarioIds.slice(1)) {
      expect(registry.getScenarioPresentationSnapshot(scenarioId))
        .toBe(before.get(scenarioId));
    }

    for (const unsubscribe of unsubscribers) unsubscribe();
    await registry.dispose();
  });
});

type MockAnalysisCoordinatorV1 = Readonly<{
  requestLatest: ReturnType<typeof vi.fn>;
  clearDemand: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  onSnapshot(
    event: ScientificProductStudioHemodynamicAnalysisSnapshotEventV1,
  ): void;
  onError(
    event: ScientificProductStudioHemodynamicAnalysisErrorEventV1,
  ): void;
}>;

type ControlStoreFixtureV1 = Readonly<{
  store: ScientificWorkbenchResearchControlStoreV0;
  emitStore(): void;
  emitFrames(): void;
}>;

type ControllerFixtureV1 = Readonly<{
  controller: ScientificProductStudioScenarioControllerV1 & Readonly<{
    dispose: ReturnType<typeof vi.fn>;
  }>;
  setSettledSource(source: StudioSettledAnalysisSourceV1 | null): void;
  emitStore(): void;
  emitFrames(): void;
}>;

const loadedControllerFixturesV1 = new Map<string, ControllerFixtureV1>();

function registryFixtureV1(
  scenarioId: string,
  controllerFixture: ControllerFixtureV1,
): ScientificProductStudioScenarioRegistryV1 {
  const resolution = resolveScientificProductCaseRouteV1("normal-sinus");
  if (resolution === null) throw new Error("healthy case fixture unavailable");
  const runtime: ScientificProductStudioScenarioRuntimeV1 = Object.freeze({
    scenarioId,
    caseEntry: resolution.caseEntry,
    workspaceDocument: Object.freeze(
      {},
    ) as MainWireScientificWorkspaceDocumentV1,
    controlStore: controllerFixture.controller.controlStore,
    controller: controllerFixture.controller,
    analysisArtifacts: new InMemoryContentAddressedArtifactStoreV1(),
  });
  return new ScientificProductStudioScenarioRegistryV1(resolution, runtime);
}

function controllerFixtureV1(
  initialSource: StudioSettledAnalysisSourceV1 | null,
): ControllerFixtureV1 {
  let settledSource = initialSource;
  const controlStore = controlStoreFixtureV1();
  const dispose = vi.fn(async () => undefined);
  const controller = {
    controlStore: controlStore.store,
    get settledAnalysisSource() {
      return settledSource;
    },
    get status() {
      return null;
    },
    dispose,
    promoteSteadyCandidate: vi.fn(async () => undefined),
    pinSteadyCandidate: vi.fn(async () => undefined),
  } as unknown as ScientificProductStudioScenarioControllerV1 & Readonly<{
    dispose: ReturnType<typeof vi.fn>;
  }>;
  return Object.freeze({
    controller,
    setSettledSource(source: StudioSettledAnalysisSourceV1 | null): void {
      settledSource = source;
    },
    emitStore: controlStore.emitStore,
    emitFrames: controlStore.emitFrames,
  });
}

function controlStoreFixtureV1(): ControlStoreFixtureV1 {
  const listeners = new Set<() => void>();
  const frameListeners = new Set<() => void>();
  let frames: readonly unknown[] = Object.freeze([]);
  let snapshot = presentationControlSnapshotV1(frames);
  const store = {
    getSnapshot(): unknown {
      return snapshot;
    },
    getFramesSnapshot(): readonly unknown[] {
      return frames;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeFrames(listener: () => void): () => void {
      frameListeners.add(listener);
      return () => frameListeners.delete(listener);
    },
  } as unknown as ScientificWorkbenchResearchControlStoreV0;
  return Object.freeze({
    store,
    emitStore(): void {
      for (const listener of [...listeners]) listener();
    },
    emitFrames(): void {
      frames = Object.freeze([]);
      snapshot = presentationControlSnapshotV1(frames);
      for (const listener of [...frameListeners]) listener();
    },
  });
}

function presentationControlSnapshotV1(
  frames: readonly unknown[],
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    frames,
    presentationBeatEstimate: null,
    parameterGenerationHistory: Object.freeze([]),
    liveTransitionOriginAcceptedTimeSec: null,
    provenance: Object.freeze({
      displayedEvidence: "open-transient-no-periodic-claim",
    }),
  });
}

function bootstrapFixtureV1(scenarioId: string): Readonly<{
  testScenarioId: string;
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
}> {
  return Object.freeze({
    testScenarioId: scenarioId,
    workspaceDocument: Object.freeze(
      {},
    ) as MainWireScientificWorkspaceDocumentV1,
  });
}

function requestAtV1(
  coordinator: MockAnalysisCoordinatorV1,
  index: number,
): ScientificProductStudioHemodynamicAnalysisRequestV1 {
  const request = coordinator.requestLatest.mock.calls[index]?.[0] as
    | ScientificProductStudioHemodynamicAnalysisRequestV1
    | undefined;
  if (request === undefined) throw new Error(`missing request ${index}`);
  return request;
}

function completeSnapshotEventV1(
  request: ScientificProductStudioHemodynamicAnalysisRequestV1,
  sequence: number,
): ScientificProductStudioHemodynamicAnalysisSnapshotEventV1 {
  const snapshot = {
    jobId: `job-${request.source.targetGeneration}`,
    detailMode: request.detailMode,
    sequence,
    status: "complete",
    progress: {
      fastPreviewCompletedPointCount: 0,
    },
    rightVascularFunction: {
      points: [{ rightAtrialPressureMmHg: 0 }, {
        rightAtrialPressureMmHg: 1,
      }],
    },
  } as unknown as MainWireScientificHemodynamicJobSnapshotV2;
  return Object.freeze({
    requestToken: request.requestToken,
    source: request.source,
    sourceIdentity: Object.freeze({
      revision: 100 + request.source.targetGeneration,
      acceptedTimeSec: 10 + request.source.targetGeneration,
      totalBloodVolumeMl: 5_000,
      parameterEpoch: request.source.targetGeneration,
      controlStateSha256: request.source.targetInputSha256,
    }),
    detailMode: request.detailMode,
    snapshot,
  });
}

function settledSourceV1(
  scenarioId: string,
  generation: number,
  digit: string,
): StudioSettledAnalysisSourceV1 {
  return Object.freeze({
    scenarioId,
    targetGeneration: generation,
    sourceRole: generation === 0
      ? "initial-settled-source" as const
      : "automatic-strict-candidate" as const,
    targetInputSha256: digit.repeat(64),
    sourceRunRef: artifactRefV1("run-artifact", `${digit}a`),
    simulationInputRef: artifactRefV1("simulation-input", `${digit}b`),
    snapshotRef: artifactRefV1("snapshot-envelope", `${digit}c`),
    execution: Object.freeze({
      modelRef: "model/main-wire@1",
      runtimeRef: "runtime/browser-worker@1",
      solverRef: "solver/main-wire@1",
      stateCodecRef: "codec/main-wire@1",
      protocolRef: "protocol/settled@1",
    }),
  });
}

function artifactRefV1<TKind extends StudioArtifactKindV1>(
  kind: TKind,
  seed: string,
): StudioArtifactRefV1<TKind> {
  const normalized = seed.repeat(64).slice(0, 64).replace(
    /[^0-9a-f]/g,
    "a",
  );
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind,
    sha256: normalized,
    mediaType: "application/json",
    byteLength: 1,
  });
}

type DeferredV1<T> = Readonly<{
  promise: Promise<T>;
  resolve(value: T): void;
}>;

function deferredV1<T>(): DeferredV1<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => {
    resolve = accept;
  });
  return Object.freeze({ promise, resolve });
}

async function waitForV1(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("timed out waiting for state");
    await new Promise((resolve) => globalThis.setTimeout(resolve, 1));
  }
}
