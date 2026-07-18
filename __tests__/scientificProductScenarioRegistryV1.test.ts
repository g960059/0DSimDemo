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

const registryMocks = vi.hoisted(() => ({
  createdClients: [] as Array<{
    terminate: ReturnType<typeof vi.fn>;
  }>,
  clientConstructorError: null as Error | null,
  loadOfficialCycle: vi.fn(),
}));

vi.mock("@/engine/scientificBrowser", () => ({
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
