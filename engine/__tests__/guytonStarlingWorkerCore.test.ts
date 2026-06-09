import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import type {
  GuytonBaseMapResponse,
  GuytonPaneData,
  StarlingSweepRequest,
  StarlingSweepWorkerMessage,
} from "@/engine/guytonStarling";
import {
  buildColdStarlingSweepResponse,
  buildGuytonBaseMapResponse,
  buildGuytonStarlingWorkerMessages,
  buildStarlingSweepResponse,
  classifyStarlingSweepDeltaPolicy,
  postGuytonStarlingWorkerMessages,
  postGuytonStarlingWorkerMessagesAsync,
  resolveStarlingSweepDeltas,
  STARLING_HIGH_PRELOAD_DELTAS_ML,
  STARLING_LOW_PRELOAD_DELTAS_ML,
  STARLING_NORMAL_PRELOAD_DELTAS_ML,
  type GuytonChainWorkerLike,
} from "@/engine/guytonStarlingWorkerCore";
import { postGuytonChainWorkerMessages } from "@/engine/guytonStarlingChainWorkerCore";
import type {
  GuytonChainWorkerMessage,
  GuytonChainWorkerRequest,
} from "@/engine/guytonStarlingChainProtocol";

describe("Guyton / Starling worker helpers", () => {
  it("builds an exact volume-constrained base map for both sides", () => {
    const req = request();
    const response = buildGuytonBaseMapResponse(req);

    expect(response.type).toBe("base-map");
    expect(response.requestId).toBe(req.requestId);
    expect(response.signature).toBe(req.signature);
    expect(response.instanceId).toBe(req.instanceId);
    expectFiniteExactPane(response.right, "right");
    expectFiniteExactPane(response.left, "left");
    expectBaseMapTiming(response);
  });

  it("requests cycle-mean snapshots for worker base maps", () => {
    const original = ModelCore.prototype.vascularReturnSnapshot;
    const calls: Array<{ side: "right" | "left"; mode: string | undefined }> = [];
    const spy = vi.spyOn(ModelCore.prototype, "vascularReturnSnapshot")
      .mockImplementation(function (this: ModelCore, side, options) {
        calls.push({ side, mode: options?.mode });
        return original.call(this, side, options);
      });
    try {
      const response = buildGuytonBaseMapResponse(request());

      expect(response.error).toBeUndefined();
      expect(calls.filter((call) => call.mode === "cycle-mean").map((call) => call.side).sort())
        .toEqual(["left", "right"]);
      expect(response.warnings.some((warning) => warning.includes("cycle-mean snapshot fallback"))).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it("falls back to instant snapshots when cycle-mean base-map snapshots fail", () => {
    const original = ModelCore.prototype.vascularReturnSnapshot;
    const spy = vi.spyOn(ModelCore.prototype, "vascularReturnSnapshot")
      .mockImplementation(function (this: ModelCore, side, options) {
        if (options?.mode === "cycle-mean") throw new Error("forced cycle-mean failure");
        return original.call(this, side, options);
      });
    try {
      const response = buildGuytonBaseMapResponse(request());

      expect(response.error).toBeUndefined();
      expectFiniteExactPane(response.right, "right");
      expectFiniteExactPane(response.left, "left");
      expect(response.warnings.filter((warning) => warning.includes("cycle-mean snapshot fallback"))).toHaveLength(2);
    } finally {
      spy.mockRestore();
    }
  });

  it("builds the default Starling sweep message with pressure-sorted points", () => {
    const req = request();
    const response = buildStarlingSweepResponse(req);

    expect(response.type).toBe("starling-sweep");
    expect(response.requestId).toBe(req.requestId);
    expect(response.signature).toBe(req.signature);
    expect(response.instanceId).toBe(req.instanceId);
    expect(response.right?.points).toHaveLength(7);
    expect(response.left?.points).toHaveLength(7);
    expect(response.right?.points.map((point) => point.deltaVolumeMl).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      ...STARLING_NORMAL_PRELOAD_DELTAS_ML,
    ]);
    expect(response.right?.fit?.kind).toBe("monotone-pchip");
    expect(response.right?.fit?.extrapolatedRight?.length).toBeGreaterThan(2);
    expectSortedByPressure(response.right?.points ?? []);
    expectSortedByPressure(response.left?.points ?? []);
    expectSweepTiming(response);
  });

  it("chooses adaptive default deltas and preserves custom deltas", () => {
    expect(classifyStarlingSweepDeltaPolicy({ RAPMean: 1.5, LAPMean: 5 }, 5600)).toBe("low-preload");
    expect(classifyStarlingSweepDeltaPolicy({ RAPMean: 3, LAPMean: 15 }, 5600)).toBe("high-preload");
    expect(classifyStarlingSweepDeltaPolicy({ RAPMean: 3, LAPMean: 7 }, 5600)).toBe("normal-preload");
    expect(resolveStarlingSweepDeltas(request(), {
      metrics: { RAPMean: 1, LAPMean: 3 } as never,
      targetVolumeMl: 4600,
    })).toEqual([...STARLING_LOW_PRELOAD_DELTAS_ML]);
    expect(resolveStarlingSweepDeltas(request(), {
      metrics: { RAPMean: 11, LAPMean: 5 } as never,
      targetVolumeMl: 5600,
    })).toEqual([...STARLING_HIGH_PRELOAD_DELTAS_ML]);
    expect(resolveStarlingSweepDeltas(request({ deltasMl: [-100, 0, 250] }), {
      metrics: { RAPMean: 11, LAPMean: 15 } as never,
      targetVolumeMl: 7000,
    })).toEqual([-100, 0, 250]);
  });

  it("keeps warm-start sweep close to the cold reference helper", () => {
    const req = request({ deltasMl: [-600, -300, 0, 300, 600] });
    const warm = buildStarlingSweepResponse(req);
    const cold = buildColdStarlingSweepResponse(req);

    for (const side of ["right", "left"] as const) {
      const warmByDelta = pointsByDelta(warm[side]?.points ?? []);
      const coldByDelta = pointsByDelta(cold[side]?.points ?? []);
      expect(Array.from(warmByDelta.keys()).sort((a, b) => a - b)).toEqual(
        Array.from(coldByDelta.keys()).sort((a, b) => a - b),
      );
      for (const [delta, warmPoint] of warmByDelta) {
        const coldPoint = coldByDelta.get(delta);
        expect(coldPoint).toBeDefined();
        expect(Math.abs(warmPoint.x - (coldPoint?.x ?? NaN))).toBeLessThan(0.15);
        expect(Math.abs(warmPoint.y - (coldPoint?.y ?? NaN))).toBeLessThan(0.08);
      }
    }
    expectSweepTiming(warm);
  });

  it("falls back to the cold retarget path when warm retarget reports failure", () => {
    const spy = vi.spyOn(ModelCore.prototype, "retargetTBVFromCurrentState").mockReturnValue({
      ok: false,
      targetTBVMl: 0,
      beforeTBVMl: 0,
      afterTBVMl: 0,
      errorMl: Number.NaN,
      iterations: 0,
      reason: "residual",
    });
    try {
      const response = buildStarlingSweepResponse(request());

      expect(response.error).toBeUndefined();
      expect(response.timing?.retargetFallbackCount).toBe(6);
      expect(response.warnings.filter((warning) => warning.includes("warm retarget fallback"))).toHaveLength(6);
      expect(response.right?.points).toHaveLength(7);
      expect(response.left?.points).toHaveLength(7);
    } finally {
      spy.mockRestore();
    }
  });

  it("supports custom deltas while preserving the requested delta set", () => {
    const deltasMl = [-450, 0, 150, 600, -150];
    const response = buildStarlingSweepResponse(request({ deltasMl }));

    expect(response.right?.points.map((point) => point.deltaVolumeMl).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      -450,
      -150,
      0,
      150,
      600,
    ]);
    expect(response.left?.points.map((point) => point.deltaVolumeMl).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      -450,
      -150,
      0,
      150,
      600,
    ]);
    expectSortedByPressure(response.right?.points ?? []);
    expectSortedByPressure(response.left?.points ?? []);
  });

  it("keeps base-map and sweep failures independent", () => {
    const req = request();
    const messages = buildGuytonStarlingWorkerMessages(req, {
      buildBaseMapResponse: () => {
        throw new Error("base failed");
      },
      buildStarlingSweepResponse: () => emptySweep(req),
    });

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ type: "base-map", error: "base failed" });
    expect(messages[1]).toMatchObject({ type: "starling-sweep" });
    expect(messages[1]).not.toHaveProperty("error");

    const reverse = buildGuytonStarlingWorkerMessages(req, {
      buildBaseMapResponse: () => emptyBaseMap(req),
      buildStarlingSweepResponse: () => {
        throw new Error("sweep failed");
      },
    });

    expect(reverse).toHaveLength(2);
    expect(reverse[0]).toMatchObject({ type: "base-map" });
    expect(reverse[0]).not.toHaveProperty("error");
    expect(reverse[1]).toMatchObject({ type: "starling-sweep", error: "sweep failed" });
  });

  it("posts the base map before starting sweep computation", () => {
    const req = request();
    const events: string[] = [];

    postGuytonStarlingWorkerMessages(
      req,
      (message) => events.push(`post:${message.type}`),
      {
        buildBaseMapResponse: () => {
          events.push("compute:base");
          return emptyBaseMap(req);
        },
        buildStarlingSweepResponse: () => {
          events.push("compute:sweep");
          return emptySweep(req);
        },
      },
    );

    expect(events).toEqual([
      "compute:base",
      "post:base-map",
      "compute:sweep",
      "post:starling-sweep",
    ]);
  });

  it("posts the base map before parallel chain workers and matches sync warm results", async () => {
    const req = request();
    const events: string[] = [];
    const chainRequests: GuytonChainWorkerRequest[] = [];
    const messages: StarlingSweepWorkerMessage[] = [];
    const progressMessages: Array<{
      completedPoints: number;
      totalPoints: number;
      rightPointCount: number;
      rightHasFit: boolean;
      rightHasExtrapolation: boolean;
    }> = [];

    await postGuytonStarlingWorkerMessagesAsync(
      req,
      (message) => {
        events.push(`post:${message.type}`);
        if (message.type === "starling-sweep-progress") {
          progressMessages.push({
            completedPoints: message.completedPoints,
            totalPoints: message.totalPoints,
            rightPointCount: message.right?.points.length ?? 0,
            rightHasFit: !!message.right?.fit,
            rightHasExtrapolation: !!message.right?.fit?.extrapolatedLeft || !!message.right?.fit?.extrapolatedRight,
          });
        }
        if (message.type === "starling-sweep") messages.push(message);
      },
      { createChainWorker: () => new InlineChainWorker(events, chainRequests) },
    );

    expect(events[0]).toBe("post:base-map");
    expect(events.filter((event) => event.startsWith("chain:"))).toEqual([
      "chain:positive:300,600,900",
      "chain:negative:-300,-600,-900",
    ]);
    expect(progressMessages.length).toBeGreaterThan(0);
    expect(progressMessages[0].completedPoints).toBe(1);
    expect(progressMessages[0].rightPointCount).toBe(1);
    expect(progressMessages[0].rightHasFit).toBe(false);
    expect(progressMessages.every((message) => message.totalPoints === 7)).toBe(true);
    for (let i = 1; i < progressMessages.length; i++) {
      expect(progressMessages[i].completedPoints).toBeGreaterThanOrEqual(progressMessages[i - 1].completedPoints);
    }
    expect(progressMessages.some((message) => message.completedPoints >= 3 && message.rightHasFit)).toBe(true);
    expect(progressMessages.every((message) => !message.rightHasExtrapolation)).toBe(true);
    expect(chainRequests).toHaveLength(2);
    expect(chainRequests[0].baselineState).toBe(chainRequests[1].baselineState);
    expect(messages).toHaveLength(1);
    const parallel = messages[0];
    const sync = buildStarlingSweepResponse(req);

    expect(parallel.timing?.parallel).toBe(true);
    expectFiniteNonNegative(parallel.timing?.chainWallMs);
    expect(parallel.timing?.parallelFallback).toBeUndefined();
    expect(parallel.right?.fit?.extrapolatedRight?.length).toBeGreaterThan(2);
    expect(parallel.right?.points.map((point) => point.deltaVolumeMl).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      ...STARLING_NORMAL_PRELOAD_DELTAS_ML,
    ]);
    expectSweepClose(parallel, sync);
  });

  it("falls back to sync warm sweep when a chain worker cannot be created", async () => {
    const req = request();
    const messages: StarlingSweepWorkerMessage[] = [];

    await postGuytonStarlingWorkerMessagesAsync(
      req,
      (message) => {
        if (message.type === "starling-sweep") messages.push(message);
      },
      {
        createChainWorker: () => {
          throw new Error("child unavailable");
        },
      },
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].error).toBeUndefined();
    expect(messages[0].timing?.parallel).toBe(false);
    expect(messages[0].timing?.parallelFallback).toContain("child unavailable");
    expect(messages[0].warnings.some((warning) => warning.includes("parallel chain fallback"))).toBe(true);
    expect(messages[0].right?.points).toHaveLength(7);
    expect(messages[0].left?.points).toHaveLength(7);
  });

  it("supports custom deltas through the parallel chain path", async () => {
    const req = request({ deltasMl: [-450, 0, 150, 600, -150] });
    const messages: StarlingSweepWorkerMessage[] = [];

    await postGuytonStarlingWorkerMessagesAsync(
      req,
      (message) => {
        if (message.type === "starling-sweep") messages.push(message);
      },
      { createChainWorker: () => new InlineChainWorker() },
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].timing?.parallel).toBe(true);
    expect(messages[0].right?.points.map((point) => point.deltaVolumeMl).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      -450,
      -150,
      0,
      150,
      600,
    ]);
    expect(messages[0].left?.points.map((point) => point.deltaVolumeMl).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      -450,
      -150,
      0,
      150,
      600,
    ]);
    expectSortedByPressure(messages[0].right?.points ?? []);
    expectSortedByPressure(messages[0].left?.points ?? []);
  });
});

function request(overrides: Partial<StarlingSweepRequest> = {}): StarlingSweepRequest {
  return {
    requestId: "req-1",
    signature: "right:inst-1:baseline",
    instanceId: "inst-1",
    params: DEFAULT_PARAMS,
    targetVolumeMl: 5600,
    ...overrides,
  };
}

function expectFiniteExactPane(pane: GuytonPaneData | undefined, side: "right" | "left"): void {
  expect(pane?.side).toBe(side);
  expect(pane?.venousReturn.source).toBe("volume-constrained");
  expect(pane?.classicVenousReturn.source).toBe("structural-linearized");
  expect(pane?.venousReturn.points.length).toBeGreaterThan(50);
  expect(pane?.venousReturn.points.every((point) => (
    Number.isFinite(point.x) && Number.isFinite(point.y)
  ))).toBe(true);
  expect(Number.isFinite(pane?.fillingPressure)).toBe(true);
  expect(Number.isFinite(pane?.summary.stressedVolumeMl)).toBe(true);
  expect(Number.isFinite(pane?.returnOperatingPoint.flow)).toBe(true);
  expect(pane?.guytonDiagnostics.source).toBe("exact-solver");
  expect(Number.isFinite(pane?.guytonDiagnostics.pump.mismatchLMin)).toBe(true);
  expect(Number.isFinite(pane?.guytonDiagnostics.return.mismatchLMin)).toBe(true);
}

function expectSortedByPressure(points: { x: number }[]): void {
  for (let i = 1; i < points.length; i++) {
    expect(points[i].x).toBeGreaterThanOrEqual(points[i - 1].x);
  }
}

function pointsByDelta(points: { deltaVolumeMl?: number; x: number; y: number }[]): Map<number, { x: number; y: number }> {
  return new Map(points.map((point) => [point.deltaVolumeMl ?? NaN, point]));
}

function expectSweepClose(actual: StarlingSweepWorkerMessage, expected: StarlingSweepWorkerMessage): void {
  for (const side of ["right", "left"] as const) {
    const actualByDelta = pointsByDelta(actual[side]?.points ?? []);
    const expectedByDelta = pointsByDelta(expected[side]?.points ?? []);
    expect(Array.from(actualByDelta.keys()).sort((a, b) => a - b)).toEqual(
      Array.from(expectedByDelta.keys()).sort((a, b) => a - b),
    );
    for (const [delta, actualPoint] of actualByDelta) {
      const expectedPoint = expectedByDelta.get(delta);
      expect(expectedPoint).toBeDefined();
      expect(Math.abs(actualPoint.x - (expectedPoint?.x ?? NaN))).toBeLessThan(1e-9);
      expect(Math.abs(actualPoint.y - (expectedPoint?.y ?? NaN))).toBeLessThan(1e-9);
    }
  }
}

function expectBaseMapTiming(response: GuytonBaseMapResponse): void {
  expect(response.timing?.baselineSource).toBe("cold");
  expectFiniteNonNegative(response.timing?.baselineMs);
  expectFiniteNonNegative(response.timing?.baseMapMs);
  expectFiniteNonNegative(response.timing?.totalMs);
  expect(response.timing?.totalMs ?? 0).toBeGreaterThanOrEqual(response.timing?.baseMapMs ?? Infinity);
}

function expectSweepTiming(response: StarlingSweepWorkerMessage): void {
  expectFiniteNonNegative(response.timing?.positiveChainMs);
  expectFiniteNonNegative(response.timing?.negativeChainMs);
  expectFiniteNonNegative(response.timing?.assembleMs);
  expectFiniteNonNegative(response.timing?.totalMs);
  expect(response.timing?.retargetFallbackCount).toBe(0);
}

function expectFiniteNonNegative(value: number | undefined): void {
  expect(typeof value).toBe("number");
  expect(Number.isFinite(value)).toBe(true);
  expect(value ?? -1).toBeGreaterThanOrEqual(0);
}

function emptyBaseMap(req: StarlingSweepRequest): GuytonBaseMapResponse {
  return {
    type: "base-map",
    requestId: req.requestId,
    signature: req.signature,
    instanceId: req.instanceId,
    warnings: [],
  };
}

function emptySweep(req: StarlingSweepRequest): StarlingSweepWorkerMessage {
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

class InlineChainWorker implements GuytonChainWorkerLike {
  onmessage: ((event: MessageEvent<GuytonChainWorkerMessage>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;

  constructor(
    private readonly events: string[] = [],
    private readonly requests: GuytonChainWorkerRequest[] = [],
  ) {}

  postMessage(request: GuytonChainWorkerRequest): void {
    this.events.push(`chain:${request.chainId}:${request.chainDeltas.join(",")}`);
    this.requests.push(request);
    postGuytonChainWorkerMessages(request, (message) => {
      this.onmessage?.({ data: message } as MessageEvent<GuytonChainWorkerMessage>);
    });
  }

  terminate(): void {
    this.terminated = true;
  }
}
