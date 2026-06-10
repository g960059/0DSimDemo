import { describe, expect, it } from "vitest";
import {
  beginGuytonSteadyMapRequest,
  expireGuytonSteadyMapGhost,
  GUYTON_STEADY_GHOST_DURATION_MS,
  guytonSteadyMapStressWarnings,
  guytonSteadyMapWarnings,
  initialGuytonSteadyMapState,
  markGuytonSteadyMapPendingWarning,
  receiveGuytonBaseMapResponse,
  receiveGuytonSweepAuditResponse,
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
  StarlingSweepAuditMessage,
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
    const withProgress = receiveGuytonSweepProgressResponse(withBase, progress("new", 1, 7, 1), 400);

    expect(withProgress.current).toBeUndefined();
    expect(withProgress.preview?.signature).toBe("new");
    expect(withProgress.preview?.progress).toEqual({ completedPoints: 1, totalPoints: 7 });
    expect(withProgress.preview?.sweep?.right?.points).toHaveLength(1);
    expect(withProgress.preview?.sweep?.right?.fit).toBeUndefined();
    expect(withProgress.ghost?.signature).toBe("old");
    expect(withProgress.ghost?.expiresAtMs).toBeUndefined();

    const promoted = receiveGuytonSweepResponse(withProgress, sweep("new"), 500);
    expect(promoted.current?.signature).toBe("new");
    expect(promoted.preview).toBeUndefined();
    expect(promoted.ghost?.expiresAtMs).toBe(500 + GUYTON_STEADY_GHOST_DURATION_MS);
  });

  it("stores raw progress until enough points are available for a fit", () => {
    const pending = beginGuytonSteadyMapRequest(initialGuytonSteadyMapState("right"), "sig", 0);
    const withBase = receiveGuytonBaseMapResponse(pending, "right", baseMap("sig"), 10);
    const onePoint = receiveGuytonSweepProgressResponse(withBase, progress("sig", 1, 7, 1), 20);
    const twoPoints = receiveGuytonSweepProgressResponse(onePoint, progress("sig", 2, 7, 2), 30);
    const threePoints = receiveGuytonSweepProgressResponse(twoPoints, progress("sig", 3, 7, 3), 40);

    expect(onePoint.preview?.sweep?.right?.points).toHaveLength(1);
    expect(onePoint.preview?.sweep?.right?.fit).toBeUndefined();
    expect(twoPoints.preview?.sweep?.right?.points).toHaveLength(2);
    expect(twoPoints.preview?.sweep?.right?.fit).toBeUndefined();
    expect(threePoints.preview?.sweep?.right?.points).toHaveLength(3);
    expect(threePoints.preview?.sweep?.right?.fit?.kind).toBe("monotone-pchip");
    expect(threePoints.current).toBeUndefined();
  });

  it("ignores stale worker responses", () => {
    const current = promotedState("current", 100);
    const pending = beginGuytonSteadyMapRequest(current, "next", 200);
    const afterStaleBase = receiveGuytonBaseMapResponse(pending, "right", baseMap("old"), 300);
    const afterStaleProgress = receiveGuytonSweepProgressResponse(afterStaleBase, progress("old", 3, 7, 3), 350);
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

  it("adds legacy audit points without re-promoting or changing ghost expiry", () => {
    const current = promotedState("sig", 100);
    const audited = receiveGuytonSweepAuditResponse(current, audit("sig"), 200);

    expect(audited.current?.signature).toBe("sig");
    expect(audited.current?.promotedAtMs).toBe(current.current?.promotedAtMs);
    expect(audited.current?.sweep.right?.audit?.addedDeltasMl).toEqual([-600, -300, 300, 900]);
    expect(audited.current?.sweep.right?.audit?.points.some((point) => point.pointSource === "audit-added")).toBe(true);
    expect(audited.ghost?.expiresAtMs).toBe(current.ghost?.expiresAtMs);
  });

  it("ignores stale legacy audit responses", () => {
    const current = promotedState("sig", 100);
    const stale = receiveGuytonSweepAuditResponse(current, audit("old"), 200);

    expect(stale.current?.sweep.right?.audit).toBeUndefined();
  });

  it("keeps stress endpoint caps out of high-priority warnings", () => {
    const pending = beginGuytonSteadyMapRequest(initialGuytonSteadyMapState("right"), "sig", 0);
    const withBase = receiveGuytonBaseMapResponse(pending, "right", baseMap("sig"), 10);
    const withStress = receiveGuytonSweepResponse(withBase, stressSweep("sig"), 20);

    expect(guytonSteadyMapWarnings(withStress)).toEqual([]);
    expect(guytonSteadyMapStressWarnings(withStress)).toEqual(["+300 mL: sweep point did not fully settle"]);
  });

  it("keeps invalid endpoint warnings high-priority", () => {
    const pending = beginGuytonSteadyMapRequest(initialGuytonSteadyMapState("right"), "sig", 0);
    const withBase = receiveGuytonBaseMapResponse(pending, "right", baseMap("sig"), 10);
    const withInvalid = receiveGuytonSweepResponse(withBase, invalidSweep("sig"), 20);

    expect(guytonSteadyMapWarnings(withInvalid)).toEqual(["+300 mL: health warning"]);
    expect(guytonSteadyMapStressWarnings(withInvalid)).toEqual([]);
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

function stressSweep(signature: string): StarlingSweepResponse {
  return {
    requestId: `req-${signature}`,
    signature,
    instanceId: "inst",
    right: {
      side: "right",
      points: [{ x: 2, y: 4.8, label: "+300 mL", settled: false, status: "ok", quality: "stress", deltaVolumeMl: 300 }],
      warnings: ["+300 mL: sweep point did not fully settle"],
    },
    left: {
      side: "left",
      points: [{ x: 8, y: 4.8, label: "+300 mL", settled: false, status: "ok", quality: "stress", deltaVolumeMl: 300 }],
      warnings: ["+300 mL: sweep point did not fully settle"],
    },
    warnings: ["+300 mL: sweep point did not fully settle"],
  };
}

function audit(signature: string): StarlingSweepAuditMessage {
  return {
    type: "starling-sweep-audit",
    requestId: `req-${signature}`,
    signature,
    instanceId: "inst",
    right: {
      side: "right",
      points: [],
      audit: {
        points: [
          { x: 2, y: 4.8, deltaVolumeMl: 0, pointSource: "calibrated-anchor" },
          { x: 3, y: 5.0, deltaVolumeMl: -300, pointSource: "audit-added" },
        ],
        holdoutErrorLMin: 0.1,
        addedDeltasMl: [-600, -300, 300, 900],
        reusedDeltasMl: [-900, -450, 0, 600],
        exploration: [
          { deltaVolumeMl: -300, explorationReason: "low-preload-shape", candidateRank: 1 },
        ],
      },
      warnings: [],
    },
    left: {
      side: "left",
      points: [],
      audit: {
        points: [
          { x: 8, y: 4.8, deltaVolumeMl: 0, pointSource: "calibrated-anchor" },
          { x: 9, y: 5.0, deltaVolumeMl: -300, pointSource: "audit-added" },
        ],
        holdoutErrorLMin: 0.1,
        addedDeltasMl: [-600, -300, 300, 900],
        reusedDeltasMl: [-900, -450, 0, 600],
        exploration: [
          { deltaVolumeMl: -300, explorationReason: "low-preload-shape", candidateRank: 1 },
        ],
      },
      warnings: [],
    },
    warnings: [],
  };
}

function invalidSweep(signature: string): StarlingSweepResponse {
  return {
    requestId: `req-${signature}`,
    signature,
    instanceId: "inst",
    right: {
      side: "right",
      points: [{ x: 2, y: 4.8, label: "+300 mL", settled: false, status: "warning", quality: "invalid", deltaVolumeMl: 300 }],
      warnings: ["+300 mL: health warning"],
    },
    left: {
      side: "left",
      points: [{ x: 8, y: 4.8, label: "+300 mL", settled: false, status: "warning", quality: "invalid", deltaVolumeMl: 300 }],
      warnings: ["+300 mL: health warning"],
    },
    warnings: ["+300 mL: health warning"],
  };
}

function progress(
  signature: string,
  completedPoints: number,
  totalPoints: number,
  pointCount = 2,
): StarlingSweepProgressMessage {
  const rightPoints = [
    { x: 2, y: 4.8 },
    { x: 4, y: 5.4 },
    { x: 6, y: 6.1 },
  ].slice(0, pointCount);
  const leftPoints = [
    { x: 8, y: 4.8 },
    { x: 10, y: 5.4 },
    { x: 12, y: 6.1 },
  ].slice(0, pointCount);
  return {
    type: "starling-sweep-progress",
    ...sweep(signature),
    right: {
      side: "right",
      points: rightPoints,
      fit: pointCount >= 3
        ? { kind: "monotone-pchip", points: rightPoints, sourcePointCount: pointCount, warnings: [] }
        : undefined,
      warnings: [],
    },
    left: {
      side: "left",
      points: leftPoints,
      fit: pointCount >= 3
        ? { kind: "monotone-pchip", points: leftPoints, sourcePointCount: pointCount, warnings: [] }
        : undefined,
      warnings: [],
    },
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
