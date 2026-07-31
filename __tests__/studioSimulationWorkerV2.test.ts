import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  RegisteredModelSimulationAdapterV2,
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  StudioSimulationWorkerClientV2,
  type StudioSimulationWorkerTransportV2,
} from "@/studio/workers/StudioSimulationWorkerClientV2";
import {
  STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
  createStudioSimulationAdvanceRequestV2,
  createStudioSimulationDisposeRequestV2,
  createStudioSimulationInitializeRequestV2,
  validateStudioSimulationWorkerRequestV2,
  validateStudioSimulationWorkerResponseV2,
} from "@/studio/workers/StudioSimulationWorkerProtocolV2";
import {
  StudioSimulationWorkerRuntimeV2,
} from "@/studio/workers/StudioSimulationWorkerRuntimeV2";

afterEach(() => {
  vi.useRealTimers();
});

describe("Studio simulation worker V2 protocol", () => {
  it("detaches and freezes exact portable initialize requests", () => {
    const fixture = {
      controls: { heartRateBpm: 60 },
      values: [1, 2],
    };
    const request = validateStudioSimulationWorkerRequestV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      kind: "initialize",
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture,
      checkpoint: {
        acceptedRevision: 4,
        acceptedTimeSec: 0.4,
        payload: { state: [3, 4] },
      },
    });
    fixture.controls.heartRateBpm = 90;
    fixture.values.push(3);

    expect(request).toMatchObject({
      requestId: 1,
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: {
        controls: { heartRateBpm: 60 },
        values: [1, 2],
      },
    });
    if (request.kind !== "initialize") {
      throw new Error("expected an initialize request");
    }
    expect(Object.isFrozen(request)).toBe(true);
    expect(Object.isFrozen(request.fixture)).toBe(true);
    expect(Object.isFrozen(request.checkpoint?.payload)).toBe(true);
  });

  it("rejects unknown, explicitly undefined, accessor, and poisoned request data", () => {
    const base = initializeRequestV2(1);
    expect(() => validateStudioSimulationWorkerRequestV2({
      ...base,
      targetGeneration: 4,
    })).toThrow(/fields must match exactly/);
    expect(() => validateStudioSimulationWorkerRequestV2({
      ...base,
      checkpoint: undefined,
    })).toThrow(/checkpoint.*plain data object/);

    const getter = vi.fn(() => ({ value: 1 }));
    const accessor = { ...base } as Record<string, unknown>;
    Object.defineProperty(accessor, "fixture", {
      enumerable: true,
      get: getter,
    });
    expect(() => validateStudioSimulationWorkerRequestV2(accessor))
      .toThrow(/enumerable data property/);
    expect(getter).not.toHaveBeenCalled();

    const customPrototype = Object.create({ poisoned: true });
    Object.defineProperties(
      customPrototype,
      Object.getOwnPropertyDescriptors(base),
    );
    expect(() => validateStudioSimulationWorkerRequestV2(customPrototype))
      .toThrow(/custom prototype/);

    const values = [1];
    const map = vi.fn(() => [Number.NaN]);
    const poisonedPrototype = Object.create(Array.prototype);
    Object.defineProperty(poisonedPrototype, "map", { value: map });
    Object.setPrototypeOf(values, poisonedPrototype);
    expect(() => validateStudioSimulationWorkerRequestV2({
      ...base,
      fixture: { values },
    })).toThrow(/array must not use a custom prototype/);
    expect(map).not.toHaveBeenCalled();
  });

  it("enforces request IDs, exact variants, and bounded step counts", () => {
    expect(() => createStudioSimulationAdvanceRequestV2(0, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    })).toThrow(/positive safe integer/);
    for (const stepCount of [0, 9, 1.5, Number.NaN]) {
      expect(() => createStudioSimulationAdvanceRequestV2(1, {
        runtimeSessionId: "runtime/session-1",
        scenarioId: "scenario/baseline",
        stepCount,
      })).toThrow(/within \[1, 8\]/);
    }
    expect(() => validateStudioSimulationWorkerRequestV2({
      ...createStudioSimulationDisposeRequestV2(1, "runtime/session-1"),
      scenarioId: undefined,
    })).toThrow(/fields must match exactly/);
  });

  it("validates and detaches exact response frames and output values", () => {
    const source = frameV2({
      outputs: {
        "pressure.lv": outputV2("pressure.lv", [80, 120]),
      },
    });
    const response = validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
      frame: source,
    });
    (source.outputs["pressure.lv"].value as number[]).push(70);

    expect(response).toMatchObject({
      kind: "initialized",
      frame: {
        runtimeSessionId: "runtime/session-1",
        outputs: {
          "pressure.lv": { value: [80, 120] },
        },
      },
    });
    expect(Object.isFrozen(response)).toBe(true);
    if (response.status === "ok" && response.kind === "initialized") {
      expect(Object.isFrozen(response.frame.outputs)).toBe(true);
      expect(Object.isFrozen(
        response.frame.outputs["pressure.lv"].value,
      )).toBe(true);
    }
  });

  it("rejects malformed response fields without invoking accessors", () => {
    const getter = vi.fn(() => frameV2());
    const accessor: Record<string, unknown> = {
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
    };
    Object.defineProperty(accessor, "frame", {
      enumerable: true,
      get: getter,
    });
    expect(() => validateStudioSimulationWorkerResponseV2(accessor))
      .toThrow(/enumerable data property/);
    expect(getter).not.toHaveBeenCalled();

    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
      frame: frameV2({ acceptedTimeSec: Number.NaN }),
    })).toThrow(/finite/);
    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
      frame: frameV2({
        outputs: { wrong: outputV2("another", 1) },
      }),
    })).toThrow(/must match output map key/);
    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: -0,
      status: "error",
      message: "failure",
    })).toThrow(/nonnegative safe integer/);
    expect(() => validateStudioSimulationWorkerResponseV2({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "error",
      message: "failure",
      kind: undefined,
    })).toThrow(/fields must match exactly/);
  });
});

describe("Studio simulation worker V2 runtime", () => {
  it("serializes one exact session and rejects wrong Scenario identity", async () => {
    const harness = runtimeHarnessV2();
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();

    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/wrong",
      stepCount: 1,
    }));
    await harness.runtime.whenIdle();
    expect(harness.adapter.advanceOnePresentationStep).not.toHaveBeenCalled();
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      message: expect.stringMatching(/identity mismatch/),
    });

    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 2,
    }));
    await harness.runtime.whenIdle();
    expect(harness.adapter.advanceOnePresentationStep).toHaveBeenCalledTimes(2);
    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 3,
      status: "ok",
      kind: "advanced",
      frames: [
        { acceptedRevision: 1 },
        { acceptedRevision: 2 },
      ],
    });
  });

  it("rejects a loaded adapter for another model before creating a session", async () => {
    const harness = runtimeHarnessV2();
    harness.runtime.enqueue(initializeRequestV2(
      1,
      "model/another-release",
    ));
    await harness.runtime.whenIdle();

    expect(harness.adapter.createSession).not.toHaveBeenCalled();
    expect(harness.adapter.disposeSession).not.toHaveBeenCalled();
    expect(harness.port.messages).toEqual([
      expect.objectContaining({
        requestId: 1,
        status: "error",
        message: expect.stringMatching(/modelId.*requested model/),
      }),
    ]);
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.runtime.state).toBe("failed");
  });

  it("decodes before loading an adapter and consumes malformed request IDs", async () => {
    const harness = runtimeHarnessV2();
    const getter = vi.fn(() => ({ value: 1 }));
    const request = {
      ...initializeRequestV2(7),
    } as unknown as Record<string, unknown>;
    Object.defineProperty(request, "fixture", {
      enumerable: true,
      get: getter,
    });

    harness.runtime.enqueue(request);
    harness.runtime.enqueue(initializeRequestV2(6));
    await harness.runtime.whenIdle();

    expect(getter).not.toHaveBeenCalled();
    expect(harness.loadAdapter).not.toHaveBeenCalled();
    expect(harness.port.messages).toEqual([
      expect.objectContaining({ requestId: 7, status: "error" }),
      expect.objectContaining({
        requestId: 6,
        status: "error",
        message: expect.stringMatching(/increase strictly/),
      }),
    ]);
  });

  it("turns uninspectable messages into uncorrelated errors", async () => {
    const harness = runtimeHarnessV2();
    const revocable = Proxy.revocable({}, {});
    revocable.revoke();

    expect(() => harness.runtime.enqueue(revocable.proxy)).not.toThrow();
    await harness.runtime.whenIdle();

    expect(harness.loadAdapter).not.toHaveBeenCalled();
    expect(harness.port.messages).toEqual([
      expect.objectContaining({ requestId: 0, status: "error" }),
    ]);
  });

  it("bounds the active-plus-queued request count", async () => {
    const createGate = deferredV2<void>();
    const harness = runtimeHarnessV2({
      createSession: vi.fn(() => createGate.promise),
    });
    harness.runtime.enqueue(initializeRequestV2(1));
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(3, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));

    expect(harness.port.messages).toContainEqual(expect.objectContaining({
      requestId: 3,
      status: "error",
      message: "simulation worker queue capacity exceeded",
    }));
    createGate.resolve();
    await harness.runtime.whenIdle();
    expect(harness.adapter.advanceOnePresentationStep).toHaveBeenCalledTimes(1);
  });

  it("makes queued disposal terminal and rejects later work", async () => {
    const advanceGate = deferredV2<StudioSimulationFrameV2>();
    const harness = runtimeHarnessV2({
      advanceOnePresentationStep: vi.fn(() => advanceGate.promise),
    });
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(2, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));
    harness.runtime.enqueue(createStudioSimulationDisposeRequestV2(
      3,
      "runtime/session-1",
    ));
    harness.runtime.enqueue(createStudioSimulationAdvanceRequestV2(4, {
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    }));

    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 4,
      status: "error",
      message: expect.stringMatching(/accepts no further requests/),
    });
    advanceGate.resolve(frameV2({ acceptedRevision: 1, acceptedTimeSec: 0.1 }));
    await harness.runtime.whenIdle();
    expect(harness.adapter.disposeSession).toHaveBeenCalledTimes(1);
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.runtime.state).toBe("closed");
  });

  it("fails closed when disposal targets another session", async () => {
    const harness = runtimeHarnessV2();
    harness.runtime.enqueue(initializeRequestV2(1));
    await harness.runtime.whenIdle();

    harness.runtime.enqueue(createStudioSimulationDisposeRequestV2(
      2,
      "runtime/forged",
    ));
    await harness.runtime.whenIdle();

    expect(harness.port.messages.at(-1)).toMatchObject({
      requestId: 2,
      status: "error",
      message: expect.stringMatching(/identity mismatch/),
    });
    expect(harness.adapter.disposeSession).toHaveBeenCalledWith(
      "runtime/session-1",
    );
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.runtime.state).toBe("failed");
  });

  it("cleans up a session whose initialization completes after termination", async () => {
    const createGate = deferredV2<void>();
    const createSession = vi.fn(() => createGate.promise);
    const harness = runtimeHarnessV2({ createSession });
    harness.runtime.enqueue(initializeRequestV2(1));
    await vi.waitFor(() => expect(createSession).toHaveBeenCalledTimes(1));

    harness.runtime.terminate();
    createGate.resolve();
    await harness.runtime.whenIdle();

    expect(harness.adapter.disposeSession).toHaveBeenCalledWith(
      "runtime/session-1",
    );
    expect(harness.port.close).toHaveBeenCalledTimes(1);
    expect(harness.port.messages).toEqual([]);
    expect(harness.runtime.state).toBe("closed");
  });

  it("disposes and closes after initialization or frame-validation failure", async () => {
    const createFailure = runtimeHarnessV2({
      createSession: vi.fn(() => Promise.reject(new Error("create failed"))),
    });
    createFailure.runtime.enqueue(initializeRequestV2(1));
    await createFailure.runtime.whenIdle();
    expect(createFailure.adapter.disposeSession).toHaveBeenCalledWith(
      "runtime/session-1",
    );
    expect(createFailure.port.close).toHaveBeenCalledTimes(1);
    expect(createFailure.runtime.state).toBe("failed");

    const invalidFrame = runtimeHarnessV2({
      currentFrame: vi.fn(() => frameV2({
        runtimeSessionId: "runtime/forged",
      })),
    });
    invalidFrame.runtime.enqueue(initializeRequestV2(1));
    await invalidFrame.runtime.whenIdle();
    expect(invalidFrame.adapter.disposeSession).toHaveBeenCalledTimes(1);
    expect(invalidFrame.port.close).toHaveBeenCalledTimes(1);
    expect(invalidFrame.runtime.state).toBe("failed");
  });
});

describe("Studio simulation worker V2 client", () => {
  it("validates input and response identity while returning detached frames", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const fixture = { value: 1 };
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture,
    });
    fixture.value = 2;
    expect(transport.messages[0]).toMatchObject({
      expectedModelId: "model/main-wire-v3-r1",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await expect(initialized).resolves.toMatchObject({
      runtimeSessionId: "runtime/session-1",
    });

    const advanced = client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    });
    transport.emitMessage(advancedResponseV2(2, [frameV2({
      acceptedRevision: 1,
      acceptedTimeSec: 0.1,
    })]));
    await expect(advanced).resolves.toHaveLength(1);
  });

  it("rejects input accessors without invoking or posting them", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const getter = vi.fn(() => "runtime/session-1");
    const input: Record<string, unknown> = {
      expectedModelId: "model/main-wire-v3-r1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    };
    Object.defineProperty(input, "runtimeSessionId", {
      enumerable: true,
      get: getter,
    });

    await expect(client.initialize(input as any)).rejects
      .toThrow(/enumerable data property/);
    expect(getter).not.toHaveBeenCalled();
    expect(transport.messages).toEqual([]);
  });

  it("terminates on malformed, unknown, or cross-session responses", async () => {
    for (const response of [
      { ...initializedResponseV2(9) },
      initializedResponseV2(1, { runtimeSessionId: "runtime/forged" }),
      initializedResponseV2(1, { modelId: "model/forged" }),
    ]) {
      const transport = new FakeWorkerTransportV2();
      const client = new StudioSimulationWorkerClientV2({ transport });
      const initialized = client.initialize({
        expectedModelId: "model/main-wire-v3-r1",
        runtimeSessionId: "runtime/session-1",
        scenarioId: "scenario/baseline",
        fixture: { value: 1 },
      });
      transport.emitMessage(response);
      await expect(initialized).rejects.toThrow(/pending request|identity mismatch/);
      expect(transport.terminate).toHaveBeenCalledTimes(1);
    }

    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    const getter = vi.fn(() => frameV2());
    const malformed: Record<string, unknown> = {
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 1,
      status: "ok",
      kind: "initialized",
    };
    Object.defineProperty(malformed, "frame", {
      enumerable: true,
      get: getter,
    });
    transport.emitMessage(malformed);
    await expect(initialized).rejects.toThrow(/enumerable data property/);
    expect(getter).not.toHaveBeenCalled();
    expect(transport.terminate).toHaveBeenCalledTimes(1);
  });

  it("makes timeout terminal for every pending request", async () => {
    vi.useFakeTimers();
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({
      transport,
      responseTimeoutMs: 10,
    });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    const assertion = expect(initialized).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    expect(transport.terminate).toHaveBeenCalledTimes(1);
    await expect(client.advance({
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      stepCount: 1,
    })).rejects.toThrow(/not active/);
  });

  it("shares one dispose operation and terminates exactly once", async () => {
    const transport = new FakeWorkerTransportV2();
    const client = new StudioSimulationWorkerClientV2({ transport });
    const initialized = client.initialize({
      expectedModelId: "model/main-wire-v3-r1",
      runtimeSessionId: "runtime/session-1",
      scenarioId: "scenario/baseline",
      fixture: { value: 1 },
    });
    transport.emitMessage(initializedResponseV2(1));
    await initialized;

    const first = client.dispose("runtime/session-1");
    const second = client.dispose("runtime/session-1");
    expect(second).toBe(first);
    expect(transport.messages).toHaveLength(2);
    transport.emitMessage({
      protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
      requestId: 2,
      status: "ok",
      kind: "disposed",
    });
    await expect(Promise.all([first, second])).resolves.toEqual([
      undefined,
      undefined,
    ]);
    expect(transport.terminate).toHaveBeenCalledTimes(1);
    client.terminate();
    expect(transport.terminate).toHaveBeenCalledTimes(1);
  });
});

function initializeRequestV2(
  requestId: number,
  expectedModelId = "model/main-wire-v3-r1",
) {
  return createStudioSimulationInitializeRequestV2(requestId, {
    expectedModelId,
    runtimeSessionId: "runtime/session-1",
    scenarioId: "scenario/baseline",
    fixture: { value: 1 },
  });
}

function initializedResponseV2(
  requestId: number,
  frameOverrides: Partial<StudioSimulationFrameV2> = {},
) {
  return {
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    status: "ok" as const,
    kind: "initialized" as const,
    frame: frameV2(frameOverrides),
  };
}

function advancedResponseV2(
  requestId: number,
  frames: readonly StudioSimulationFrameV2[],
) {
  return {
    protocol: STUDIO_SIMULATION_WORKER_PROTOCOL_V2,
    requestId,
    status: "ok" as const,
    kind: "advanced" as const,
    frames,
  };
}

function frameV2(
  overrides: Partial<StudioSimulationFrameV2> = {},
): StudioSimulationFrameV2 {
  return {
    modelId: "model/main-wire-v3-r1",
    runtimeSessionId: "runtime/session-1",
    scenarioId: "scenario/baseline",
    inputEpoch: 0,
    acceptedRevision: 0,
    acceptedTimeSec: 0,
    outputs: {
      "pressure.lv": outputV2("pressure.lv", 80),
    },
    ...overrides,
  };
}

function outputV2(outputId: string, value: number | number[]) {
  return {
    outputId,
    value,
    availability: "available" as const,
    quality: "authoritative-state" as const,
  };
}

function runtimeHarnessV2(overrides: Readonly<{
  createSession?: RegisteredModelSimulationAdapterV2["createSession"];
  currentFrame?: RegisteredModelSimulationAdapterV2["currentFrame"];
  advanceOnePresentationStep?:
    RegisteredModelSimulationAdapterV2["advanceOnePresentationStep"];
}> = {}) {
  let revision = 0;
  const adapter: RegisteredModelSimulationAdapterV2 = {
    modelId: "model/main-wire-v3-r1",
    fixtureSchemaId: "fixture/main-wire-v3-r1",
    checkpointCodecId: "checkpoint/main-wire-v3-r1",
    createSession: overrides.createSession ?? vi.fn(() => Promise.resolve()),
    disposeSession: vi.fn(),
    currentFrame: overrides.currentFrame ?? vi.fn(() => frameV2()),
    advanceOnePresentationStep: overrides.advanceOnePresentationStep
      ?? vi.fn(() => {
        revision += 1;
        return Promise.resolve(frameV2({
          acceptedRevision: revision,
          acceptedTimeSec: revision / 10,
        }));
      }),
    replaceFixture: vi.fn(() => Promise.resolve(0)),
    currentInputEpoch: vi.fn(() => 0),
  };
  const port = {
    messages: [] as unknown[],
    postMessage: vi.fn((message: unknown) => {
      port.messages.push(message);
    }),
    close: vi.fn(),
  };
  const loadAdapter = vi.fn(() => Promise.resolve(adapter));
  const runtime = new StudioSimulationWorkerRuntimeV2({
    loadSimulationAdapter: loadAdapter,
    port,
  });
  return { adapter, loadAdapter, port, runtime };
}

function deferredV2<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

class FakeWorkerTransportV2 implements StudioSimulationWorkerTransportV2 {
  readonly messages: unknown[] = [];
  readonly terminate = vi.fn();
  readonly #messageListeners = new Set<(event: MessageEvent<unknown>) => void>();
  readonly #errorListeners = new Set<(event: ErrorEvent) => void>();

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  addEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.add(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.#errorListeners.add(listener as (event: ErrorEvent) => void);
    }
  }

  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  removeEventListener(
    type: "message" | "error",
    listener: ((event: MessageEvent<unknown>) => void)
      | ((event: ErrorEvent) => void),
  ): void {
    if (type === "message") {
      this.#messageListeners.delete(
        listener as (event: MessageEvent<unknown>) => void,
      );
    } else {
      this.#errorListeners.delete(listener as (event: ErrorEvent) => void);
    }
  }

  emitMessage(data: unknown): void {
    for (const listener of this.#messageListeners) {
      listener({ data } as MessageEvent<unknown>);
    }
  }
}
