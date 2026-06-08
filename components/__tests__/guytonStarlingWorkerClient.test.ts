import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import type {
  GuytonBaseMapResponse,
  GuytonStarlingWorkerMessage,
  StarlingSweepRequest,
  StarlingSweepWorkerMessage,
} from "@/engine/guytonStarling";
import {
  __clearGuytonStarlingWorkerClientForTests,
  requestGuytonStarlingWorkerMessages,
  type GuytonStarlingWorkerLike,
} from "@/components/guytonStarlingWorkerClient";

class FakeGuytonWorker implements GuytonStarlingWorkerLike {
  onmessage: ((event: MessageEvent<GuytonStarlingWorkerMessage>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  posts: StarlingSweepRequest[] = [];
  terminated = false;

  postMessage(request: StarlingSweepRequest): void {
    this.posts.push(request);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(message: GuytonStarlingWorkerMessage): void {
    this.onmessage?.({ data: message } as MessageEvent<GuytonStarlingWorkerMessage>);
  }
}

describe("Guyton / Starling worker client", () => {
  let workers: FakeGuytonWorker[];

  beforeEach(() => {
    vi.useFakeTimers();
    workers = [];
  });

  afterEach(() => {
    __clearGuytonStarlingWorkerClientForTests();
    vi.useRealTimers();
  });

  it("shares one in-flight worker request across matching signatures", () => {
    const req = request();
    const first: GuytonStarlingWorkerMessage[] = [];
    const second: GuytonStarlingWorkerMessage[] = [];
    let firstDone = 0;
    let secondDone = 0;

    requestGuytonStarlingWorkerMessages(req, {
      onMessage: (message) => first.push(message),
      onDone: () => { firstDone += 1; },
    }, { createWorker: createFakeWorker, delayMs: 0 });
    requestGuytonStarlingWorkerMessages({ ...req, requestId: "req-2" }, {
      onMessage: (message) => second.push(message),
      onDone: () => { secondDone += 1; },
    }, { createWorker: createFakeWorker, delayMs: 0 });

    vi.runOnlyPendingTimers();
    expect(workers).toHaveLength(1);
    expect(workers[0].posts).toHaveLength(1);

    workers[0].emit(baseMap(req));
    workers[0].emit(sweep(req));

    expect(first.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(second.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(firstDone).toBe(1);
    expect(secondDone).toBe(1);
    expect(workers[0].terminated).toBe(true);
  });

  it("replays already posted base maps to late subscribers", () => {
    const req = request();
    const early: GuytonStarlingWorkerMessage[] = [];
    const late: GuytonStarlingWorkerMessage[] = [];
    let lateStarts = 0;

    requestGuytonStarlingWorkerMessages(req, {
      onMessage: (message) => early.push(message),
    }, { createWorker: createFakeWorker, delayMs: 0 });
    vi.runOnlyPendingTimers();
    workers[0].emit(baseMap(req));

    requestGuytonStarlingWorkerMessages({ ...req, requestId: "req-late" }, {
      onStart: () => { lateStarts += 1; },
      onMessage: (message) => late.push(message),
    }, { createWorker: createFakeWorker, delayMs: 0 });

    expect(workers).toHaveLength(1);
    expect(lateStarts).toBe(1);
    expect(late.map((message) => message.type)).toEqual(["base-map"]);

    workers[0].emit(sweep(req));
    expect(early.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(late.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
  });

  it("cancels a delayed request when all subscribers leave before start", () => {
    const unsubscribe = requestGuytonStarlingWorkerMessages(request(), {
      onMessage: () => undefined,
    }, { createWorker: createFakeWorker, delayMs: 450 });

    unsubscribe();
    vi.advanceTimersByTime(500);

    expect(workers).toHaveLength(0);
  });

  function createFakeWorker(): FakeGuytonWorker {
    const worker = new FakeGuytonWorker();
    workers.push(worker);
    return worker;
  }
});

function request(overrides: Partial<StarlingSweepRequest> = {}): StarlingSweepRequest {
  return {
    requestId: "req-1",
    signature: "inst-1:baseline",
    instanceId: "inst-1",
    params: DEFAULT_PARAMS,
    targetVolumeMl: 5600,
    ...overrides,
  };
}

function baseMap(req: StarlingSweepRequest): GuytonBaseMapResponse {
  return {
    type: "base-map",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    warnings: [],
  };
}

function sweep(req: StarlingSweepRequest): StarlingSweepWorkerMessage {
  return {
    type: "starling-sweep",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: { side: "right", points: [], warnings: [] },
    left: { side: "left", points: [], warnings: [] },
    warnings: [],
  };
}
