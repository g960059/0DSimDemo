import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import type {
  GuytonStarlingWorkerMessage,
  GuytonBaseMapResponse,
  GuytonPaneData,
  StarlingSweepRequest,
  StarlingSweepAuditMessage,
  StarlingSweepWorkerMessage,
} from "@/engine/guytonStarling";
import {
  buildStarlingSweepAuditMessage,
  buildColdStarlingSweepResponse,
  buildGuytonBaseMapResponse,
  buildGuytonStarlingWorkerMessages,
  buildStarlingSweepResponse,
  buildWorkerBaseline,
  buildParallelStarlingSweepAuditMessage,
  classifyStarlingSweepDeltaPolicy,
  postGuytonStarlingWorkerMessages,
  postGuytonStarlingWorkerMessagesAsync,
  resolveStarlingSweepDeltas,
  calibratedAnchorDeltasForPolicy,
  STARLING_HIGH_PRELOAD_DELTAS_ML,
  STARLING_LOW_PRELOAD_DELTAS_ML,
  STARLING_NORMAL_PRELOAD_DELTAS_ML,
  type GuytonChainWorkerLike,
} from "@/engine/guytonStarlingWorkerCore";
import { postGuytonChainWorkerMessages } from "@/engine/guytonStarlingChainWorkerCore";
import type {
  GuytonChainId,
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

  it("builds the default adaptive Starling sweep message with pressure-sorted exploration points", () => {
    const req = request();
    const response = buildStarlingSweepResponse(req);

    expect(response.type).toBe("starling-sweep");
    expect(response.requestId).toBe(req.requestId);
    expect(response.signature).toBe(req.signature);
    expect(response.instanceId).toBe(req.instanceId);
    expect(response.right?.points.length).toBeGreaterThanOrEqual(5);
    expect(response.left?.points.length).toBe(response.right?.points.length);
    expect(response.right?.points.some((point) => point.deltaVolumeMl === 0)).toBe(true);
    expect(response.right?.points.some((point) => (point.deltaVolumeMl ?? 0) < 0)).toBe(true);
    expect(response.right?.points.some((point) => (point.deltaVolumeMl ?? 0) > 0)).toBe(true);
    expect(response.right?.points.every((point) => point.pointSource === "adaptive-exploration")).toBe(true);
    expect(response.right?.points.every((point) => point.periodBeats === 1 || point.periodBeats === 2)).toBe(true);
    expect(response.left?.points.every((point) => point.periodLabel === "period-1" || point.periodLabel === "period-2")).toBe(true);
    expect(response.timing?.mode).toBe("adaptive");
    expect(response.right?.calibration?.mode).toBe("adaptive");
    expect(response.right?.fit?.kind).toBe("pchip");
    expect(response.right?.fit?.mode).toBe("measured");
    expect(response.right?.fit?.extrapolatedRight).toBeUndefined();
    expect(response.right?.interpretation).toMatchObject({
      xAxis: "RAP",
      yAxis: "CO",
      sweepVariable: "TBV delta",
      fitBasis: "adaptive exploration",
      zeroFlowConstrained: false,
    });
    expect(response.left?.interpretation).toMatchObject({
      xAxis: "LAP",
      yAxis: "CO",
      fitBasis: "adaptive exploration",
      zeroFlowConstrained: false,
    });
    expect(response.right?.interpretation?.measuredRangeMmHg?.max).toBeGreaterThan(response.right?.interpretation?.measuredRangeMmHg?.min ?? Infinity);
    expectSortedByPressure(response.right?.points ?? []);
    expectSortedByPressure(response.left?.points ?? []);
    expectSweepTiming(response);
  });

  it("does not build a post-final audit for the default adaptive sweep", () => {
    const req = request();
    const baseline = buildWorkerBaseline(req);
    const response = buildStarlingSweepResponse(req, baseline);
    const audit = buildStarlingSweepAuditMessage(req, baseline, response);

    expect(response.timing?.mode).toBe("adaptive");
    expect(audit).toBeUndefined();
  });

  it("does not build a full7 audit for custom sweeps or full7 fallback responses", () => {
    const req = request({ deltasMl: [-300, 0, 300] });
    const baseline = buildWorkerBaseline(req);
    const response = buildStarlingSweepResponse(req, baseline);
    expect(buildStarlingSweepAuditMessage(req, baseline, response)).toBeUndefined();

    const fallbackBaseline = buildWorkerBaseline(request());
    fallbackBaseline.calibratedFallbackReasons = ["left return residual threshold"];
    const fallback = buildStarlingSweepResponse(request(), fallbackBaseline);
    expect(buildStarlingSweepAuditMessage(request(), fallbackBaseline, fallback)).toBeUndefined();
  });

  it("keeps adaptive Starling display even when committed Guyton residual diagnostics exceed threshold", () => {
    const req = request();
    const baseline = buildWorkerBaseline(req);
    buildGuytonBaseMapResponse(req, baseline);
    baseline.calibratedFallbackReasons = ["left return residual threshold"];

    const response = buildStarlingSweepResponse(req, baseline);

    expect(response.timing?.mode).toBe("adaptive");
    expect(response.right?.calibration?.mode).toBe("adaptive");
    expect(response.right?.interpretation?.fitBasis).toBe("adaptive exploration");
    expect(response.warnings.some((warning) => warning.includes("calibrated Starling fallback"))).toBe(false);
  });

  it("chooses adaptive default deltas and preserves custom deltas", () => {
    expect(classifyStarlingSweepDeltaPolicy({ RAPMean: 1.5, LAPMean: 5 }, 5600)).toBe("low-preload");
    expect(classifyStarlingSweepDeltaPolicy({ RAPMean: 3, LAPMean: 15 }, 5600)).toBe("high-preload");
    expect(classifyStarlingSweepDeltaPolicy({ RAPMean: 3, LAPMean: 7 }, 5600)).toBe("normal-preload");
    expect(calibratedAnchorDeltasForPolicy("low-preload")).toEqual([-200, 0, 600, 1200]);
    expect(calibratedAnchorDeltasForPolicy("normal-preload")).toEqual([-900, -450, 0, 600]);
    expect(calibratedAnchorDeltasForPolicy("high-preload")).toEqual([-1500, -900, -300, 300]);
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
      expect(response.timing?.retargetFallbackCount).toBeGreaterThanOrEqual(3);
      expect(response.warnings.filter((warning) => warning.includes("warm retarget fallback")).length).toBeGreaterThanOrEqual(3);
      expect(response.right?.points.length).toBeGreaterThanOrEqual(4);
      expect(response.left?.points.length).toBeGreaterThanOrEqual(4);
    } finally {
      spy.mockRestore();
    }
  });

  it("keeps chain seeding on warm retarget fallback when metrics remain seed reliable", () => {
    const req = request();
    const baseline = buildWorkerBaseline(req);
    const progress: GuytonChainWorkerMessage[] = [];
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
      postGuytonChainWorkerMessages({
        type: "solve-chain",
        chainId: "negative",
        requestId: req.requestId,
        signature: req.signature,
        instanceId: req.instanceId,
        params: req.params,
        targetVolumeMl: req.targetVolumeMl,
        baselineState: baseline.state,
        chainDeltas: [-450, -900],
      }, (message) => {
        if (message.type === "chain-progress") progress.push(message);
      });
    } finally {
      spy.mockRestore();
    }

    expect(progress).toHaveLength(2);
    expect(progress[0].type === "chain-progress" ? progress[0].result.run.seededFromDeltaMl : undefined).toBe(0);
    expect(progress[0].type === "chain-progress" ? progress[0].result.run.reliability.seedReliable : undefined).toBe(true);
    expect(progress[1].type === "chain-progress" ? progress[1].result.run.seededFromDeltaMl : undefined).toBe(-450);
    expect(progress[1].type === "chain-progress" ? progress[1].result.run.seedAccepted : undefined).toBe(true);
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
    expect(response.right?.interpretation?.fitBasis).toBe("custom anchors");
    expect(response.right?.interpretation?.anchorDeltasMl).toEqual(deltasMl);
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

  it("posts the base map before progressive adaptive sweep points", async () => {
    const req = request();
    const events: string[] = [];
    const messages: StarlingSweepWorkerMessage[] = [];
    const audits: StarlingSweepAuditMessage[] = [];
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
        if (message.type === "starling-sweep-audit") audits.push(message);
      },
      { createChainWorker: () => new InlineChainWorker(events, []) },
    );

    expect(events[0]).toBe("post:base-map");
    expect(events.filter((event) => event.startsWith("chain:"))).toEqual([
      "chain:positive:250,500,750,1000",
      "chain:negative:-125,-250,-375,-500,-625,-750,-875,-1000,-1125,-1250,-1375,-1500",
    ]);
    expect(progressMessages.length).toBeGreaterThan(0);
    expect(progressMessages[0].completedPoints).toBe(1);
    expect(progressMessages[0].rightPointCount).toBe(1);
    expect(progressMessages[0].rightHasFit).toBe(false);
    expect(progressMessages.every((message) => message.totalPoints >= message.completedPoints)).toBe(true);
    for (let i = 1; i < progressMessages.length; i++) {
      expect(progressMessages[i].completedPoints).toBeGreaterThanOrEqual(progressMessages[i - 1].completedPoints);
    }
    expect(progressMessages.some((message) => message.completedPoints >= 3 && message.rightHasFit)).toBe(true);
    expect(progressMessages.every((message) => !message.rightHasExtrapolation)).toBe(true);
    expect(messages).toHaveLength(1);
    expect(audits).toHaveLength(0);
    const parallel = messages[0];
    const sync = buildStarlingSweepResponse(req);

    expect(parallel.timing?.parallel).toBe(true);
    expectFiniteNonNegative(parallel.timing?.chainWallMs);
    expect(parallel.timing?.parallelFallback).toBeUndefined();
    expect(parallel.timing?.mode).toBe("adaptive");
    expect(parallel.right?.fit?.extrapolatedRight).toBeUndefined();
    expect(parallel.right?.points.every((point) => point.pointSource === "adaptive-exploration")).toBe(true);
    expectSweepClose(parallel, sync);
  });

  it("falls back to sync warm sweep for custom deltas when a chain worker cannot be created", async () => {
    const req = request({ deltasMl: [-300, 0, 300] });
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
    expect(messages[0].right?.points).toHaveLength(3);
    expect(messages[0].left?.points).toHaveLength(3);
  });

  it("stops posting async sweep messages when the request is cancelled after the base map", async () => {
    const req = request({ deltasMl: [-150, 0, 150] });
    const messages: GuytonStarlingWorkerMessage[] = [];
    let cancelled = false;

    await postGuytonStarlingWorkerMessagesAsync(
      req,
      (message) => {
        messages.push(message);
        if (message.type === "base-map") cancelled = true;
      },
      {
        createChainWorker: () => new InlineChainWorker(),
        isCancelled: () => cancelled,
      },
    );

    expect(messages.map((message) => message.type)).toEqual(["base-map"]);
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

  it("can keep positive and negative chain workers alive across sequential sweeps", async () => {
    const workers = new Map<GuytonChainId, InlineChainWorker>();
    const createCounts: Record<GuytonChainId, number> = {
      positive: 0,
      negative: 0,
      "audit-low": 0,
      "audit-mid": 0,
      "audit-high": 0,
      "audit-plateau": 0,
    };
    const createChainWorker = (chainId: GuytonChainId): InlineChainWorker => {
      let worker = workers.get(chainId);
      if (!worker) {
        worker = new InlineChainWorker();
        workers.set(chainId, worker);
        createCounts[chainId] += 1;
      }
      return worker;
    };
    const messages: StarlingSweepWorkerMessage[] = [];

    await postGuytonStarlingWorkerMessagesAsync(
      request({ signature: "right:inst-1:first", deltasMl: [-150, 0, 150] }),
      (message) => {
        if (message.type === "starling-sweep") messages.push(message);
      },
      { createChainWorker, persistentChainWorkers: true },
    );
    await postGuytonStarlingWorkerMessagesAsync(
      request({ requestId: "req-2", signature: "right:inst-1:second", deltasMl: [-150, 0, 150] }),
      (message) => {
        if (message.type === "starling-sweep") messages.push(message);
      },
      { createChainWorker, persistentChainWorkers: true },
    );

    expect(createCounts.positive).toBe(1);
    expect(createCounts.negative).toBe(1);
    expect([...workers.values()].every((worker) => !worker.terminated)).toBe(true);
    expect(messages).toHaveLength(2);
    expect(messages.every((message) => message.timing?.parallel === true)).toBe(true);
    expect(messages.every((message) => message.right?.points.length === 3)).toBe(true);
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
