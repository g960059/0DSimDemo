import { describe, expect, it } from "vitest";
import {
  beginGuytonSteadyMapRequest,
  expireGuytonSteadyMapGhost,
  GUYTON_STEADY_GHOST_DURATION_MS,
  initialGuytonSteadyMapState,
  markGuytonSteadyMapPendingWarning,
  receiveGuytonBaseMapResponse,
  receiveGuytonSweepProgressResponse,
  receiveGuytonSweepResponse,
  type GuytonSteadyMapState,
} from "@/components/guytonSteadyMapTransition";
import type {
  GuytonBaseMapResponse,
  GuytonCurve,
  GuytonPaneData,
  GuytonSide,
  StarlingSweepProgressMessage,
  StarlingSweepResponse,
} from "@/engine/guytonStarling";

describe("Guyton steady-map transition state", () => {
  it("moves the current map to ghost when a new signature starts", () => {
    const current = promotedState("old", 100);
    const next = beginGuytonSteadyMapRequest(current, "new", 200);

    expect(next.current).toBeUndefined();
    expect(next.pending?.signature).toBe("new");
    expect(next.ghost?.signature).toBe("old");
    expect(next.ghost?.expiresAtMs).toBeUndefined();
  });

  it("does not promote a base-map response by itself", () => {
    const state = beginGuytonSteadyMapRequest(initialGuytonSteadyMapState("right"), "sig", 0);
    const next = receiveGuytonBaseMapResponse(state, "right", baseMap("sig"), 100);

    expect(next.current).toBeUndefined();
    expect(next.preview?.pane.venousReturn.source).toBe("volume-constrained");
    expect(next.pending?.baseMap?.venousReturn.source).toBe("volume-constrained");
    expect(next.pending?.sweep).toBeUndefined();
  });

  it("does not promote a sweep response by itself", () => {
    const state = beginGuytonSteadyMapRequest(initialGuytonSteadyMapState("right"), "sig", 0);
    const next = receiveGuytonSweepResponse(state, sweep("sig"), 100);

    expect(next.current).toBeUndefined();
    expect(next.pending?.sweep?.signature).toBe("sig");
    expect(next.pending?.baseMap).toBeUndefined();
  });

  it("promotes only when base-map and sweep match the pending signature", () => {
    const state = beginGuytonSteadyMapRequest(initialGuytonSteadyMapState("right"), "sig", 0);
    const withBase = receiveGuytonBaseMapResponse(state, "right", baseMap("sig"), 100);
    const promoted = receiveGuytonSweepResponse(withBase, sweep("sig"), 200);

    expect(promoted.pending).toBeUndefined();
    expect(promoted.current?.signature).toBe("sig");
    expect(promoted.current?.pane.venousReturn.source).toBe("volume-constrained");
    expect(promoted.current?.sweep.right?.points).toHaveLength(2);
  });

  it("keeps progress previews out of current until the final sweep arrives", () => {
    const current = promotedState("old", 100);
    const pending = beginGuytonSteadyMapRequest(current, "new", 200);
    const withBase = receiveGuytonBaseMapResponse(pending, "right", baseMap("new"), 300);
    const withProgress = receiveGuytonSweepProgressResponse(withBase, progress("new", 3, 7), 400);

    expect(withProgress.current).toBeUndefined();
    expect(withProgress.preview?.signature).toBe("new");
    expect(withProgress.preview?.progress).toEqual({ completedPoints: 3, totalPoints: 7 });
    expect(withProgress.ghost?.signature).toBe("old");
    expect(withProgress.ghost?.expiresAtMs).toBeUndefined();

    const promoted = receiveGuytonSweepResponse(withProgress, sweep("new"), 500);
    expect(promoted.current?.signature).toBe("new");
    expect(promoted.preview).toBeUndefined();
    expect(promoted.ghost?.expiresAtMs).toBe(500 + GUYTON_STEADY_GHOST_DURATION_MS);
  });

  it("ignores stale worker responses", () => {
    const current = promotedState("current", 100);
    const pending = beginGuytonSteadyMapRequest(current, "next", 200);
    const afterStaleBase = receiveGuytonBaseMapResponse(pending, "right", baseMap("old"), 300);
    const afterStaleProgress = receiveGuytonSweepProgressResponse(afterStaleBase, progress("old", 3, 7), 350);
    const afterStaleSweep = receiveGuytonSweepResponse(afterStaleProgress, sweep("old"), 400);

    expect(afterStaleSweep.current).toBeUndefined();
    expect(afterStaleSweep.pending?.signature).toBe("next");
    expect(afterStaleSweep.ghost?.signature).toBe("current");
  });

  it("keeps the ghost while a new map is still pending", () => {
    const current = promotedState("old", 100);
    const pending = beginGuytonSteadyMapRequest(current, "new", 200);
    const afterLongPending = expireGuytonSteadyMapGhost(pending, 200 + GUYTON_STEADY_GHOST_DURATION_MS + 30_000);

    expect(afterLongPending.ghost?.signature).toBe("old");
    expect(afterLongPending.ghost?.expiresAtMs).toBeUndefined();
  });

  it("expires the ghost after the promoted map has been visible for the ghost duration", () => {
    const current = promotedState("old", 100);
    const pending = beginGuytonSteadyMapRequest(current, "new", 200);
    const withBase = receiveGuytonBaseMapResponse(pending, "right", baseMap("new"), 10_000);
    const promoted = receiveGuytonSweepResponse(withBase, sweep("new"), 10_500);

    const before = expireGuytonSteadyMapGhost(promoted, 10_500 + GUYTON_STEADY_GHOST_DURATION_MS - 1);
    const after = expireGuytonSteadyMapGhost(promoted, 10_500 + GUYTON_STEADY_GHOST_DURATION_MS);

    expect(promoted.ghost?.signature).toBe("old");
    expect(promoted.ghost?.expiresAtMs).toBe(10_500 + GUYTON_STEADY_GHOST_DURATION_MS);
    expect(before.ghost?.signature).toBe("old");
    expect(after.ghost).toBeUndefined();
  });

  it("keeps worker-unavailable warnings on the pending state", () => {
    const state = beginGuytonSteadyMapRequest(initialGuytonSteadyMapState("right"), "sig", 0);
    const warned = markGuytonSteadyMapPendingWarning(state, "sig", "Steady map worker unavailable", 10);

    expect(warned.pending?.warnings).toContain("Steady map worker unavailable");
  });
});

function promotedState(signature: string, nowMs: number): GuytonSteadyMapState {
  const pending = beginGuytonSteadyMapRequest(initialGuytonSteadyMapState("right"), signature, nowMs);
  const withBase = receiveGuytonBaseMapResponse(pending, "right", baseMap(signature), nowMs + 10);
  return receiveGuytonSweepResponse(withBase, sweep(signature), nowMs + 20);
}

function baseMap(signature: string): GuytonBaseMapResponse {
  return {
    type: "base-map",
    requestId: `req-${signature}`,
    signature,
    instanceId: "inst",
    right: pane("right"),
    left: pane("left"),
    warnings: [],
  };
}

function sweep(signature: string): StarlingSweepResponse {
  return {
    requestId: `req-${signature}`,
    signature,
    instanceId: "inst",
    right: {
      side: "right",
      points: [{ x: 2, y: 4.8 }, { x: 6, y: 6.1 }],
      warnings: [],
    },
    left: {
      side: "left",
      points: [{ x: 8, y: 4.8 }, { x: 12, y: 6.1 }],
      warnings: [],
    },
    warnings: [],
  };
}

function progress(signature: string, completedPoints: number, totalPoints: number): StarlingSweepProgressMessage {
  return {
    type: "starling-sweep-progress",
    ...sweep(signature),
    completedPoints,
    totalPoints,
  };
}

function pane(side: GuytonSide): GuytonPaneData {
  const venousReturn: GuytonCurve = {
    id: `${side}-vr`,
    label: "Exact VR",
    source: "volume-constrained",
    stroke: "venous",
    points: [{ x: 0, y: 5 }, { x: 5, y: 3 }, { x: 10, y: 0 }],
  };
  const classicVenousReturn: GuytonCurve = {
    id: `${side}-classic`,
    label: "Classic",
    source: "structural-linearized",
    stroke: "classic",
    dashed: true,
    points: [{ x: 0, y: 5 }, { x: 10, y: 0 }],
  };
  return {
    side,
    title: side === "right" ? "Systemic Guyton / RV Starling" : "Pulmonary venous return / LV preload sweep",
    xLabel: side === "right" ? "RAP / CVP (mmHg)" : "LAP / PCWP (mmHg)",
    yLabel: "Flow (L/min)",
    operatingPoint: { pressure: side === "right" ? 3 : 9, flow: 5 },
    returnOperatingPoint: { pressure: side === "right" ? 3 : 9, flow: 4.9 },
    guytonDiagnostics: {
      source: "exact-solver",
      pump: {
        pressure: side === "right" ? 3 : 9,
        observedFlow: 5,
        guytonFlow: 5,
        mismatchLMin: 0,
        mismatchFraction: 0,
        exceedsThreshold: false,
      },
      return: {
        pressure: side === "right" ? 3 : 9,
        observedFlow: 4.9,
        guytonFlow: 5,
        mismatchLMin: 0.1,
        mismatchFraction: 0.02040816326530612,
        exceedsThreshold: false,
      },
    },
    fillingPressure: side === "right" ? 10 : 15,
    fillingPressureLabel: side === "right" ? "Pmsf" : "Pmpf",
    gradient: 7,
    collapsePressure: 0,
    venousReturn,
    classicVenousReturn,
    localStarling: {
      id: `${side}-local-starling`,
      label: "Local",
      source: "local-starling-surrogate",
      stroke: "starling",
      points: [],
    },
    summary: {
      stressedVolumeMl: 1000,
      unstressedVolumeMl: 3000,
      effectiveComplianceMlPerMmHg: 100,
      externalPressureWeightedMmHg: 0,
      effectiveResistanceMmHgPerLMin: 1.2,
    },
    warnings: [],
  };
}
