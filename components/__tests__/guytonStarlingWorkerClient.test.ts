import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import type {
  GuytonBaseMapResponse,
  GuytonStarlingWorkerMessage,
  StarlingSweepProgressMessage,
  StarlingSweepRequest,
  StarlingSweepWorkerMessage,
} from "@/engine/guytonStarling";
import {
  __clearGuytonStarlingWorkerClientForTests,
  measureGuytonStarlingBrowserWorkerTiming,
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

  fail(message = "worker failed"): void {
    this.onerror?.({ message } as ErrorEvent);
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
    }, { createWorker: createFakeWorker, delayMs: 0, idleTimeoutMs: 1000 });
    requestGuytonStarlingWorkerMessages({ ...req, requestId: "req-2" }, {
      onMessage: (message) => second.push(message),
      onDone: () => { secondDone += 1; },
    }, { createWorker: createFakeWorker, delayMs: 0, idleTimeoutMs: 1000 });

    vi.advanceTimersByTime(0);
    expect(workers).toHaveLength(1);
    expect(workers[0].posts).toHaveLength(1);

    workers[0].emit(baseMap(req));
    workers[0].emit(sweep(req));

    expect(first.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(second.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(firstDone).toBe(1);
    expect(secondDone).toBe(1);
    expect(workers[0].terminated).toBe(false);
    vi.advanceTimersByTime(999);
    expect(workers[0].terminated).toBe(false);
    vi.advanceTimersByTime(1);
    expect(workers[0].terminated).toBe(true);
  });

  it("reuses the default persistent worker for sequential signatures", () => {
    const firstReq = request({ signature: "inst-1:first" });
    const secondReq = request({ requestId: "req-2", signature: "inst-1:second" });
    const firstMessages: GuytonStarlingWorkerMessage[] = [];
    const secondMessages: GuytonStarlingWorkerMessage[] = [];

    requestGuytonStarlingWorkerMessages(firstReq, {
      onMessage: (message) => firstMessages.push(message),
    }, { createWorker: createFakeWorker, delayMs: 0, idleTimeoutMs: 1000 });
    vi.advanceTimersByTime(0);
    expect(workers).toHaveLength(1);

    workers[0].emit(baseMap(firstReq));
    workers[0].emit(sweep(firstReq));
    expect(firstMessages.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(workers[0].terminated).toBe(false);

    requestGuytonStarlingWorkerMessages(secondReq, {
      onMessage: (message) => secondMessages.push(message),
    }, { createWorker: createFakeWorker, delayMs: 0, idleTimeoutMs: 1000 });
    vi.advanceTimersByTime(0);
    expect(workers).toHaveLength(1);
    expect(workers[0].posts).toEqual([firstReq, secondReq]);

    workers[0].emit(baseMap(secondReq));
    workers[0].emit(sweep(secondReq));
    expect(secondMessages.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(workers[0].terminated).toBe(false);
  });

  it("can keep per-request worker termination for one-shot timing-sensitive callers", () => {
    const req = request();

    requestGuytonStarlingWorkerMessages(req, {
      onMessage: () => undefined,
    }, { createWorker: createFakeWorker, delayMs: 0, workerMode: "per-request" });
    vi.advanceTimersByTime(0);

    expect(workers).toHaveLength(1);
    workers[0].emit(sweep(req));
    expect(workers[0].terminated).toBe(true);
  });

  it("fails active persistent subscriptions and recreates the worker after an error", () => {
    const firstReq = request({ signature: "inst-1:error" });
    const secondReq = request({ requestId: "req-2", signature: "inst-1:after-error" });
    const errors: string[] = [];
    let doneCount = 0;

    requestGuytonStarlingWorkerMessages(firstReq, {
      onMessage: () => undefined,
      onError: (message) => errors.push(message),
      onDone: () => { doneCount += 1; },
    }, { createWorker: createFakeWorker, delayMs: 0, idleTimeoutMs: 1000 });
    vi.advanceTimersByTime(0);
    expect(workers).toHaveLength(1);

    workers[0].fail("boom");
    expect(errors).toEqual(["boom"]);
    expect(doneCount).toBe(1);
    expect(workers[0].terminated).toBe(true);

    requestGuytonStarlingWorkerMessages(secondReq, {
      onMessage: () => undefined,
    }, { createWorker: createFakeWorker, delayMs: 0, idleTimeoutMs: 1000 });
    vi.advanceTimersByTime(0);
    expect(workers).toHaveLength(2);
    expect(workers[1].posts).toEqual([secondReq]);
  });

  it("replays already posted base maps to late subscribers", () => {
    const req = request();
    const early: GuytonStarlingWorkerMessage[] = [];
    const late: GuytonStarlingWorkerMessage[] = [];
    let lateStarts = 0;

    requestGuytonStarlingWorkerMessages(req, {
      onMessage: (message) => early.push(message),
    }, { createWorker: createFakeWorker, delayMs: 0 });
    vi.advanceTimersByTime(0);
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

  it("keeps the in-flight worker open for progress messages and replays them", () => {
    const req = request();
    const early: GuytonStarlingWorkerMessage[] = [];
    const late: GuytonStarlingWorkerMessage[] = [];
    let earlyDone = 0;

    requestGuytonStarlingWorkerMessages(req, {
      onMessage: (message) => early.push(message),
      onDone: () => { earlyDone += 1; },
    }, { createWorker: createFakeWorker, delayMs: 0 });
    vi.advanceTimersByTime(0);

    workers[0].emit(baseMap(req));
    workers[0].emit(progress(req, 3, 7));
    expect(workers[0].terminated).toBe(false);
    expect(earlyDone).toBe(0);

    requestGuytonStarlingWorkerMessages({ ...req, requestId: "req-late" }, {
      onMessage: (message) => late.push(message),
    }, { createWorker: createFakeWorker, delayMs: 0 });
    expect(late.map((message) => message.type)).toEqual(["base-map", "starling-sweep-progress"]);

    workers[0].emit(sweep(req));
    expect(early.map((message) => message.type)).toEqual(["base-map", "starling-sweep-progress", "starling-sweep"]);
    expect(earlyDone).toBe(1);
    expect(workers[0].terminated).toBe(false);
  });

  it("completes adaptive subscriptions at the final sweep and ignores late audit messages", () => {
    const req = request();
    const messages: GuytonStarlingWorkerMessage[] = [];
    let doneCount = 0;

    requestGuytonStarlingWorkerMessages(req, {
      onMessage: (message) => messages.push(message),
      onDone: () => { doneCount += 1; },
    }, { createWorker: createFakeWorker, delayMs: 0, idleTimeoutMs: 1000 });
    vi.advanceTimersByTime(0);

    workers[0].emit(baseMap(req));
    workers[0].emit(sweep(req));
    expect(messages.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(doneCount).toBe(1);
    expect(workers[0].terminated).toBe(false);

    workers[0].emit(audit(req));
    expect(messages.map((message) => message.type)).toEqual(["base-map", "starling-sweep"]);
    expect(doneCount).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(workers[0].terminated).toBe(true);
  });

  it("cancels a delayed request when all subscribers leave before start", () => {
    const unsubscribe = requestGuytonStarlingWorkerMessages(request(), {
      onMessage: () => undefined,
    }, { createWorker: createFakeWorker, delayMs: 450 });

    unsubscribe();
    vi.advanceTimersByTime(500);

    expect(workers).toHaveLength(0);
  });

  it("measures browser worker timing milestones without sharing in-flight state", async () => {
    const req = request();
    const promise = measureGuytonStarlingBrowserWorkerTiming(req, { createWorker: createFakeWorker });

    expect(workers).toHaveLength(1);
    expect(workers[0].posts).toEqual([req]);

    vi.advanceTimersByTime(5);
    workers[0].emit(baseMap(req));
    vi.advanceTimersByTime(7);
    workers[0].emit(progress(req, 1, 7));
    vi.advanceTimersByTime(11);
    workers[0].emit(progressWithFit(req));
    vi.advanceTimersByTime(13);
    workers[0].emit(sweep(req));

    const timing = await promise;
    expect(workers[0].terminated).toBe(true);
    expect(timing.workerCreateMs).toBeGreaterThanOrEqual(0);
    expect(timing.baseMapMs).not.toBeNull();
    expect(timing.firstProgressMs).not.toBeNull();
    expect(timing.firstFitMs).not.toBeNull();
    expect(timing.finalSweepMs).not.toBeNull();
    expect(timing.totalMs).toBeGreaterThanOrEqual(timing.finalSweepMs ?? 0);
    expect(timing.firstFitMs ?? 0).toBeGreaterThan(timing.firstProgressMs ?? 0);
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

function calibratedSweep(req: StarlingSweepRequest): StarlingSweepWorkerMessage {
  return {
    ...sweep(req),
    timing: {
      positiveChainMs: 1,
      negativeChainMs: 1,
      assembleMs: 0,
      totalMs: 2,
      retargetFallbackCount: 0,
      mode: "calibrated",
    },
  };
}

function audit(req: StarlingSweepRequest): GuytonStarlingWorkerMessage {
  return {
    type: "starling-sweep-audit",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: { side: "right", points: [], warnings: [], audit: { points: [], holdoutErrorLMin: 0, addedDeltasMl: [], reusedDeltasMl: [], exploration: [] } },
    left: { side: "left", points: [], warnings: [], audit: { points: [], holdoutErrorLMin: 0, addedDeltasMl: [], reusedDeltasMl: [], exploration: [] } },
    warnings: [],
  };
}

function progress(
  req: StarlingSweepRequest,
  completedPoints: number,
  totalPoints: number,
): StarlingSweepProgressMessage {
  return {
    type: "starling-sweep-progress",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    right: { side: "right", points: [], warnings: [] },
    left: { side: "left", points: [], warnings: [] },
    warnings: [],
    completedPoints,
    totalPoints,
  };
}

function progressWithFit(req: StarlingSweepRequest): StarlingSweepProgressMessage {
  return {
    ...progress(req, 3, 7),
    right: {
      side: "right",
      points: [{ x: 1, y: 4 }, { x: 2, y: 5 }, { x: 3, y: 6 }],
      fit: { kind: "monotone-pchip", points: [{ x: 1, y: 4 }, { x: 2, y: 5 }], sourcePointCount: 3, warnings: [] },
      warnings: [],
    },
  };
}
