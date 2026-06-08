import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
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
  postGuytonStarlingWorkerMessages,
} from "@/engine/guytonStarlingWorkerCore";

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
  });

  it("builds the default Starling sweep message with pressure-sorted points", () => {
    const req = request();
    const response = buildStarlingSweepResponse(req);

    expect(response.type).toBe("starling-sweep");
    expect(response.requestId).toBe(req.requestId);
    expect(response.signature).toBe(req.signature);
    expect(response.instanceId).toBe(req.instanceId);
    expect(response.right?.points).toHaveLength(5);
    expect(response.left?.points).toHaveLength(5);
    expect(response.right?.points.map((point) => point.deltaVolumeMl).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      -600,
      -300,
      0,
      300,
      600,
    ]);
    expectSortedByPressure(response.right?.points ?? []);
    expectSortedByPressure(response.left?.points ?? []);
  });

  it("keeps warm-start sweep close to the cold reference helper", () => {
    const req = request();
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
}

function expectSortedByPressure(points: { x: number }[]): void {
  for (let i = 1; i < points.length; i++) {
    expect(points[i].x).toBeGreaterThanOrEqual(points[i - 1].x);
  }
}

function pointsByDelta(points: { deltaVolumeMl?: number; x: number; y: number }[]): Map<number, { x: number; y: number }> {
  return new Map(points.map((point) => [point.deltaVolumeMl ?? NaN, point]));
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
