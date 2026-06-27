import { describe, expect, it } from "vitest";
import type { SimSample } from "@/engine/protocol";
import {
  buildPvLoopDebugSamples,
  nearestPvLoopDebugCanvasPoint,
  pvLoopDebugOptionsFromInputs,
  resamplePvLoopDebugSamples,
  summarizePvLoopDebugSamples,
} from "@/components/pvLoopDebugOverlay";

function sample(overrides: Partial<SimSample>): SimSample {
  return {
    t: 0,
    AoP: 80,
    PAP: 22,
    LAP: 8,
    RAP: 4,
    LVP: 10,
    RVP: 8,
    QAo: 0,
    QPA: 0,
    QPV: 0,
    QMV: 0,
    QTV: 0,
    PVF: 0,
    SVF: 0,
    QCapSV: 0,
    QPArtPCap: 0,
    QCorLAD: 0,
    QCorLCx: 0,
    QCorRCA: 0,
    QCorTotal: 0,
    QCS: 0,
    VLV: 100,
    VRV: 100,
    VLA: 28,
    VRA: 30,
    VSystemicVenous: 3200,
    VPulmonaryVenous: 600,
    P_PVein: 8,
    phi: 1,
    aLV: 0,
    aRV: 0,
    aLA: 0,
    aRA: 0,
    cRA: 0,
    rLA: 0,
    rRA: 0,
    xiMV: 0,
    xiAoV: 0,
    xiTV: 0,
    xiPV: 0,
    dP_MV: 0,
    dP_AoV: 0,
    dP_TV: 0,
    dP_PV: 0,
    AoV_areaRatio: 0,
    AoV_loss_R: 0,
    AoV_loss_B: 0,
    AoV_loss_residual: 0,
    AoV_qNextPreDiode: 0,
    AoV_qNextPostDiode: 0,
    AoV_qNextPreFlowClamp: 0,
    AoV_qNextPostFlowClamp: 0,
    AoV_qDotPreDiode: 0,
    AoV_qDotPostDiode: 0,
    AoV_qDotPreFlowClamp: 0,
    AoV_qDotRaw: 0,
    AoV_qDotPost: 0,
    AoV_qDotClampHit01: 0,
    AoV_qDotClampImpulse: 0,
    AoV_diodeImpulse: 0,
    AoV_flowClampImpulse: 0,
    LVPressureFloorHit01: 0,
    RVPressureFloorHit01: 0,
    ELV_active: 0,
    ERV_active: 0,
    ELV_timeVarying: 0,
    ERV_timeVarying: 0,
    Pperi: 0,
    Ppc: 0,
    VHeart: 0,
    septumShiftMl: 0,
    VLVeff: 0,
    VRVeff: 0,
    PLVfw: 0,
    PRVfw: 0,
    PVI_LV: 0,
    PVI_RV: 0,
    septalForceMmHg: 0,
    PLADArt: 0,
    PLCxArt: 0,
    PRCAArt: 0,
    PCS: 0,
    PimLAD: 0,
    PimLCx: 0,
    PimRCA: 0,
    TBV: 5600,
    ...overrides,
  };
}

const lvBeat = [
  sample({ t: 0, phi: 1.0, VLV: 100, LVP: 10, xiMV: 0, xiAoV: 0 }),
  sample({ t: 0.02, phi: 1.05, VLV: 101, LVP: 11, xiMV: 1, xiAoV: 0 }),
  sample({ t: 0.04, phi: 1.2, VLV: 110, LVP: 12, xiMV: 1, xiAoV: 0 }),
  sample({ t: 0.06, phi: 1.4, VLV: 110, LVP: 28, xiMV: 0, xiAoV: 0 }),
  sample({
    t: 0.08,
    phi: 1.6,
    VLV: 105,
    LVP: 45,
    xiMV: 0,
    xiAoV: 1,
    AoV_qDotRaw: 5,
    AoV_qDotPost: 3,
    AoV_qDotClampHit01: 1,
    AoV_qDotClampImpulse: -2,
  }),
  sample({ t: 0.1, phi: 1.8, VLV: 95, LVP: 43, xiMV: 0, xiAoV: 1, LVPressureFloorHit01: 1 }),
  sample({ t: 0.12, phi: 2.0, VLV: 90, LVP: 20, xiMV: 0, xiAoV: 0 }),
];

describe("PV loop debug overlay helpers", () => {
  it("builds raw debug samples with source index, phase, valve, qDot, and floor markers", () => {
    const samples = buildPvLoopDebugSamples(lvBeat, { start: 0, end: 6, closingIndex: 6 }, "LV");

    expect(samples).toHaveLength(7);
    expect(samples[0]).toMatchObject({ sourceIndex: 0, beatSampleIndex: 0, beatIndex: 1 });
    expect(samples.map((entry) => entry.phase)).toContain("filling");
    expect(samples.map((entry) => entry.phase)).toContain("ejection");
    expect(samples.flatMap((entry) => entry.markers.map((marker) => marker.label))).toEqual(expect.arrayContaining([
      "MV open",
      "AoV open",
      "AoV qDot clamp hit",
      "AoV qDot raw-post",
      "AoV qDot impulse",
      "LV pressure floor",
    ]));

    const summary = summarizePvLoopDebugSamples(samples);
    expect(summary.markerCounts.valve).toBeGreaterThanOrEqual(2);
    expect(summary.markerCounts.qdotClamp).toBeGreaterThanOrEqual(3);
    expect(summary.markerCounts.pressureFloor).toBe(1);
  });

  it("keeps LA/RA loops drawable while marking phase and event diagnostics unsupported", () => {
    const samples = buildPvLoopDebugSamples(lvBeat, { start: 0, end: 6, closingIndex: 6 }, "LA");

    expect(samples).toHaveLength(7);
    expect(samples.every((entry) => entry.phase === "unsupported")).toBe(true);
    expect(samples.flatMap((entry) => entry.markers)).toEqual([]);
    expect(summarizePvLoopDebugSamples(samples).supported).toBe(false);
  });

  it("linearly resamples without losing endpoint or source bracket metadata", () => {
    const raw = buildPvLoopDebugSamples(lvBeat, { start: 0, end: 6, closingIndex: 6 }, "LV");
    const resampled = resamplePvLoopDebugSamples(raw, 5);

    expect(resampled).toHaveLength(5);
    expect(resampled[0]).toMatchObject({
      point: raw[0].point,
      leftSourceIndex: 0,
      rightSourceIndex: 0,
    });
    expect(resampled.at(-1)).toMatchObject({
      point: raw.at(-1)?.point,
      leftSourceIndex: 5,
      rightSourceIndex: 6,
    });
    expect(resampled[2].leftSourceIndex).toBeLessThanOrEqual(resampled[2].rightSourceIndex);

    const boundaryPoint = resamplePvLoopDebugSamples(raw, 9).find((point) => (
      point.leftSourceIndex === 5 && point.rightSourceIndex === 6 && point.beatSampleIndex < 8
    ));
    expect(boundaryPoint?.theta).toBeGreaterThan(0.8);
  });

  it("finds the nearest canvas point within a bounded hit radius", () => {
    const nearest = nearestPvLoopDebugCanvasPoint([
      { x: 0, y: 0, id: "a" },
      { x: 20, y: 0, id: "b" },
    ], { x: 18, y: 1 }, 4);

    expect(nearest?.id).toBe("b");
    expect(nearestPvLoopDebugCanvasPoint([{ x: 0, y: 0 }], { x: 20, y: 0 }, 4)).toBeNull();
  });

  it("parses panel, URL, and localStorage debug trace options", () => {
    expect(pvLoopDebugOptionsFromInputs({ panelEnabled: true, panelTraceMode: "both" })).toEqual({
      enabled: true,
      traceMode: "both",
    });
    expect(pvLoopDebugOptionsFromInputs({ search: "?pvDebug=resampled" })).toEqual({
      enabled: true,
      traceMode: "resampled",
    });
    expect(pvLoopDebugOptionsFromInputs({ storageEnabled: "1", storageTraceMode: "both" })).toEqual({
      enabled: true,
      traceMode: "both",
    });
    expect(pvLoopDebugOptionsFromInputs({ panelEnabled: true, search: "?pvDebug=off" })).toEqual({
      enabled: false,
      traceMode: "raw",
    });
  });
});
