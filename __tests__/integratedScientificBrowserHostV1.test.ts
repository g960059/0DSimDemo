import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MainWireIntegratedScientificWorkerKernelV1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerKernelV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerProtocolV1";
import {
  MainWireIntegratedScientificSession,
  integratedLanePresentationTargetTimeSecV1,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  MainWireIntegratedScientificWorkerClientV1,
  createDefaultMainWireIntegratedScientificWorkerV1,
  type MainWireIntegratedScientificWorkerLikeV1,
} from "@/engine/scientificBrowser/MainWireIntegratedScientificWorkerClientV1";
import {
  MainWireIntegratedScientificBrowserHostV1Impl,
} from "@/engine/scientificBrowser/MainWireIntegratedScientificBrowserHostV1";

describe("MainWireIntegratedScientificBrowserHostV1", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("uses hot-path-lean for the live host while direct Worker creation defaults to full-invariant", () => {
    const requestedTiers: string[] = [];
    const host = new MainWireIntegratedScientificBrowserHostV1Impl({
      clientFactory: (tier) => {
        requestedTiers.push(tier);
        return {
          requestCount: 0,
          request: async () => {
            throw new Error("not used");
          },
          terminate: () => undefined,
        };
      },
    });
    expect(requestedTiers).toEqual(["hot-path-lean"]);
    host.terminate();

    const workerOptions: WorkerOptions[] = [];
    vi.stubGlobal("Worker", class {
      constructor(_url: URL, options: WorkerOptions) {
        workerOptions.push(options);
      }
    });
    createDefaultMainWireIntegratedScientificWorkerV1();
    createDefaultMainWireIntegratedScientificWorkerV1("hot-path-lean");
    expect(workerOptions.map(({ name }) => name)).toEqual([
      "full-invariant",
      "hot-path-lean",
    ]);
  });

  it("continues bit-exactly across structured-clone Worker rotation from an off-grid accepted time", async () => {
    const source = await MainWireIntegratedScientificSession.create();
    advanceDirectSessionThroughOrdinalV1(source, 406);
    installProviderV1(
      source,
      failingProviderV1(
        (candidateTimeSec) => candidateTimeSec > 0.8125,
      ),
    );
    const offGrid = source.advanceToPresentationTime(
      integratedLanePresentationTargetTimeSecV1(407),
    );
    expect(offGrid).toMatchObject({
      status: "failed",
      acceptedTimeSec: 0.8125,
      partiallyAdvanced: true,
    });
    const offGridCheckpoint = await source.checkpointOperational();

    const expected = await MainWireIntegratedScientificSession
      .restoreOperationalCheckpoint(structuredClone(offGridCheckpoint));
    const expectedAdvance = expected.advanceToPresentationTime(
      integratedLanePresentationTargetTimeSecV1(407),
    );
    expect(expectedAdvance).toMatchObject({
      status: "advanced",
      acceptedTimeSec:
        integratedLanePresentationTargetTimeSecV1(407),
    });
    const expectedCheckpoint = await expected.checkpointOperational();

    const firstWorker = new KernelBackedWorker();
    const firstHost = hostFor("rotation-host-a", firstWorker);
    const restoredA = await firstHost.restoreOperationalCheckpoint({
      sessionId: "rotated-session-a",
      checkpoint: structuredClone(offGridCheckpoint),
    });
    expect(restoredA.presentationOrdinal).toBeNull();
    expect(restoredA.acceptedTimeSec).toBe(0.8125);
    const advancedA = await firstHost.advanceToPresentationOrdinal(
      restoredA,
      407,
    );
    expect(advancedA).toMatchObject({
      status: "advanced",
      presentationOrdinal: 407,
      presentationTimeSec:
        integratedLanePresentationTargetTimeSecV1(407),
      emittedPresentationSample: true,
      session: {
        acceptedTimeSec:
          integratedLanePresentationTargetTimeSecV1(407),
        presentationOrdinal: 407,
      },
    });
    const checkpointA = await firstHost.getOperationalCheckpoint(
      advancedA.session,
    );
    expect(checkpointA.checkpoint).toEqual(expectedCheckpoint);
    await firstHost.dispose(checkpointA.session);
    firstHost.terminate();
    expect(firstWorker.terminateCount).toBe(1);

    const secondWorker = new KernelBackedWorker();
    const secondHost = hostFor("rotation-host-b", secondWorker);
    const restoredB = await secondHost.restoreOperationalCheckpoint({
      sessionId: "rotated-session-b",
      checkpoint: structuredClone(offGridCheckpoint),
    });
    const advancedB = await secondHost.advanceToPresentationOrdinal(
      restoredB,
      407,
    );
    expect(advancedB.session.observableFrame).toEqual(
      advancedA.session.observableFrame,
    );
    expect(
      (await secondHost.getOperationalCheckpoint(advancedB.session))
        .checkpoint,
    ).toEqual(expectedCheckpoint);
    secondHost.terminate();
  }, 20_000);

  it("fails closed on response mismatch, timeout, Worker error, and explicit termination", async () => {
    const mismatchWorker = new ManualWorker();
    const mismatchClient = clientFor(mismatchWorker);
    const pending = mismatchClient.request({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "observe",
      requestId: "mismatch-request",
      sessionId: "mismatch-session",
    });
    mismatchWorker.emitMessage({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      hotPathIntegrityTier: "full-invariant",
      ok: true,
      requestId: "mismatch-request",
      sessionId: "other-session",
      commandKind: "observe",
      laneDescriptor: {},
      payload: {},
      error: null,
    });
    await expectTransportError(pending, "protocol-mismatch");
    expect(mismatchWorker.terminateCount).toBe(1);

    vi.useFakeTimers();
    const timeoutWorker = new ManualWorker();
    const timeoutClient = new MainWireIntegratedScientificWorkerClientV1({
      workerFactory: () => timeoutWorker,
      requestTimeoutMs: 25,
    });
    const timedOut = timeoutClient.request({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "observe",
      requestId: "timeout-request",
      sessionId: "timeout-session",
    });
    const timeoutExpectation =
      expectTransportError(timedOut, "request-timeout");
    await vi.advanceTimersByTimeAsync(25);
    await timeoutExpectation;
    expect(timeoutWorker.terminateCount).toBe(1);
    vi.useRealTimers();

    const errorWorker = new ManualWorker();
    const errorClient = clientFor(errorWorker);
    const errored = errorClient.request({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "observe",
      requestId: "error-request",
      sessionId: "error-session",
    });
    errorWorker.emitError("worker crashed");
    await expectTransportError(errored, "worker-error");
    expect(errorWorker.terminateCount).toBe(1);

    const terminatedWorker = new ManualWorker();
    const terminatedClient = clientFor(terminatedWorker);
    const terminated = terminatedClient.request({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "observe",
      requestId: "terminated-request",
      sessionId: "terminated-session",
    });
    terminatedClient.terminate();
    await expectTransportError(terminated, "client-terminated");
    expect(terminatedWorker.terminateCount).toBe(1);
  });

  it("rejects ordinal skips before model execution and returns frames and capabilities on supported operations", async () => {
    const worker = new KernelBackedWorker();
    const host = hostFor("live-host", worker);
    const created = await host.createWorkerOwnedPreset("live-session");
    expect(created).toMatchObject({
      hotPathIntegrityTier: "full-invariant",
      presentationOrdinal: 0,
      acceptedRevision: 0,
      acceptedTimeSec: 0,
      laneDescriptor: {
        capabilities: {
          interactiveResearchControls: { available: false },
          operationalWorkerRotationCheckpoint: { available: true },
        },
      },
    });
    await expect(
      host.advanceToPresentationOrdinal(created, 2),
    ).rejects.toMatchObject({
      name: "MainWireIntegratedScientificBrowserHostErrorV1",
      code: "scientific-command-rejected",
      scientificError: {
        error: { code: "presentation-ordinal-mismatch" },
      },
    });

    const advanced = await host.advanceToPresentationOrdinal(created, 1);
    expect(advanced).toMatchObject({
      status: "advanced",
      internalAcceptedSubstepCount: 1,
      emittedPresentationSample: true,
      observableFrame: {
        frameId:
          "main-wire-integrated-v3-experimental-observable-frame-v1",
      },
    });
    const observed = await host.observe(advanced.session);
    expect(observed.observableFrame).toEqual(advanced.observableFrame);
    host.terminate();
  });
});

class ManualWorker implements MainWireIntegratedScientificWorkerLikeV1 {
  readonly posted: unknown[] = [];
  terminateCount = 0;
  private readonly listeners =
    new Map<string, Set<(event: any) => void>>();

  postMessage(message: unknown): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminateCount += 1;
  }

  addEventListener(
    type: "message" | "messageerror" | "error",
    listener: (event: any) => void,
  ): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(
    type: "message" | "messageerror" | "error",
    listener: (event: any) => void,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  emitMessage(data: unknown): void {
    this.emit("message", { data });
  }

  emitError(message: string): void {
    this.emit("error", {
      message,
      error: new Error(message),
      preventDefault: () => undefined,
    });
  }

  protected emit(type: string, event: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener(event);
    }
  }
}

class KernelBackedWorker extends ManualWorker {
  readonly kernel =
    new MainWireIntegratedScientificWorkerKernelV1();

  override postMessage(message: unknown): void {
    this.posted.push(structuredClone(message));
    queueMicrotask(() => {
      void this.kernel.handle(structuredClone(message)).then((response) => {
        this.emit("message", { data: structuredClone(response) });
      });
    });
  }
}

function clientFor(
  worker: MainWireIntegratedScientificWorkerLikeV1,
): MainWireIntegratedScientificWorkerClientV1 {
  return new MainWireIntegratedScientificWorkerClientV1({
    workerFactory: () => worker,
  });
}

function hostFor(
  hostId: string,
  worker: MainWireIntegratedScientificWorkerLikeV1,
): MainWireIntegratedScientificBrowserHostV1Impl {
  return new MainWireIntegratedScientificBrowserHostV1Impl({
    hostId,
    client: clientFor(worker),
  });
}

async function expectTransportError(
  promise: Promise<unknown>,
  code: string,
): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    name: "MainWireIntegratedScientificWorkerTransportErrorV1",
    code,
  });
}

function advanceDirectSessionThroughOrdinalV1(
  session: MainWireIntegratedScientificSession,
  finalOrdinal: number,
): void {
  for (let ordinal = 1; ordinal <= finalOrdinal; ordinal += 1) {
    const result = session.advanceToPresentationTime(
      integratedLanePresentationTargetTimeSecV1(ordinal),
    );
    if (result.status !== "advanced") {
      throw new Error(`direct advance ${ordinal} ${result.status}`);
    }
  }
}

function installProviderV1(
  session: MainWireIntegratedScientificSession,
  provider: MainWireNormalAdultFiveWallProviderV1,
): void {
  (session as unknown as {
    provider: MainWireNormalAdultFiveWallProviderV1;
  }).provider = provider;
}

function failingProviderV1(
  shouldFail: (candidateTimeSec: number) => boolean,
): MainWireNormalAdultFiveWallProviderV1 {
  const base = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  return Object.freeze({
    ...base,
    evaluateTrial(input) {
      if (shouldFail(input.candidateTimeSec)) {
        throw new Error("forced browser boundary test failure");
      }
      return base.evaluateTrial(input);
    },
  });
}
