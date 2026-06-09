import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import {
  buildGuytonDiagnostics,
  buildCommittedGuytonPaneData,
  buildGuytonPaneData,
  defaultGuytonAxis,
  expandGuytonAxisToFit,
  guytonSnapshotPoints,
  interpolateCurveY,
  liveGuytonOperatingPoint,
  sampleVenousReturnCurve,
} from "@/engine/guytonStarling";
import { solveReturnFlowAtDownstreamPressure } from "@/engine/guytonVascular";
import { runScenario } from "@/engine/harness";
import type { SimMetrics, SimObservables, SimSample } from "@/engine/protocol";

const FAST_OPTIONS = { settleSeconds: 35, measureSeconds: 8 };

describe("Guyton / Starling pane helpers", () => {
  it("anchors the right-sided venous-return curve at the operating point", () => {
    const pane = buildGuytonPaneData("right", metrics(), obs());
    const atRap = nearest(pane.venousReturn.points, pane.operatingPoint.pressure);
    const atPmsf = nearest(pane.classicVenousReturn.points, pane.fillingPressure);

    expect(pane.gradient).toBeCloseTo(7, 6);
    expect(pane.summary.effectiveResistanceMmHgPerLMin).toBeCloseTo(1.4, 2);
    expect(Math.abs(atRap.y - 5)).toBeLessThan(0.15);
    expect(atPmsf.y).toBeLessThan(0.1);
  });

  it("shows a waterfall plateau when downstream pressure is below collapse pressure", () => {
    const curve = sampleVenousReturnCurve({
      fillingPressure: 12,
      resistanceMmHgPerLMin: 1.2,
      collapsePressure: 2,
      xMin: -8,
      xMax: 12,
      n: 80,
      waterfall: true,
    });
    const low = nearest(curve, -7).y;
    const lower = nearest(curve, -5).y;
    const above = nearest(curve, 8).y;

    expect(Math.abs(low - lower)).toBeLessThan(0.2);
    expect(above).toBeLessThan(low - 2);
    expect(Math.min(...curve.map((p) => p.y))).toBeGreaterThanOrEqual(0);
  });

  it("builds a left-sided pulmonary return summary from pulmonary filling observables", () => {
    const pane = buildGuytonPaneData("left", metrics({ LAPMean: 8, CO_L: 4.8 }), obs({
      Pmpf: 12,
      PmpfTm: 12,
      PmpfAbs: 13,
      pulmonaryVenousReturnGradient: 5,
      Palv: 4,
    }));

    expect(pane.fillingPressureLabel).toBe("Pmpf");
    expect(pane.title).toBe("Pulmonary venous return / LV preload sweep");
    expect(pane.operatingPoint.pressure).toBe(8);
    expect(pane.gradient).toBeCloseTo(5, 6);
    expect(pane.summary.effectiveComplianceMlPerMmHg).toBeGreaterThan(0);
    expect(pane.venousReturn.points.length).toBeGreaterThan(50);
  });

  it("keeps the sampled operating-map domain sticky while the live point moves", () => {
    const baseline = buildGuytonPaneData("right", metrics(), obs());
    const moved = buildGuytonPaneData(
      "right",
      metrics({ RAPMean: 6, CO_R: 6.2 }),
      obs({
        RAP: 6,
        Pmsf: 12,
        PmsfTm: 12,
        PmsfAbs: 12,
        vrGradient: 6,
      }),
    );

    expect(moved.operatingPoint.pressure).not.toBe(baseline.operatingPoint.pressure);
    expect(moved.operatingPoint.flow).not.toBe(baseline.operatingPoint.flow);
    expect(xDomain(moved.venousReturn.points)).toEqual(xDomain(baseline.venousReturn.points));
    expect(xDomain(moved.classicVenousReturn.points)).toEqual(xDomain(baseline.classicVenousReturn.points));
    expect(xDomain(moved.localStarling.points)).toEqual(xDomain(baseline.localStarling.points));
  });

  it("keeps the local Starling surrogate out of normal snapshot points", () => {
    const pane = buildGuytonPaneData("right", metrics(), obs());
    const snapshotPoints = guytonSnapshotPoints(pane, undefined);
    const sweepPoints = [{ x: 4, y: 5.2 }, { x: 7, y: 6.1 }];
    const withSweep = guytonSnapshotPoints(pane, {
      requestId: "test",
      signature: "sig",
      instanceId: "inst",
      warnings: [],
      right: { side: "right", points: sweepPoints, warnings: [] },
    });

    expect(pane.localStarling.source).toBe("local-starling-surrogate");
    expect(pane.localStarling.stroke).toBe("starling");
    expect(pane.localStarling.dashed).toBe(true);
    expect(snapshotPoints).toHaveLength(
      pane.venousReturn.points.length + pane.classicVenousReturn.points.length + 5,
    );
    expect(withSweep).toHaveLength(snapshotPoints.length + sweepPoints.length);
  });

  it("reports Guyton mismatch diagnostics from curve interpolation", () => {
    const curve = sampleVenousReturnCurve({
      fillingPressure: 10,
      resistanceMmHgPerLMin: 1,
      collapsePressure: -10,
      xMin: 0,
      xMax: 10,
      n: 11,
      waterfall: false,
    });
    const diagnostics = buildGuytonDiagnostics({
      venousReturn: {
        id: "test",
        label: "test",
        source: "waterfall-linearized",
        stroke: "venous",
        points: curve,
      },
      pumpPoint: { pressure: 5, flow: 5 },
      returnPoint: { pressure: 5, flow: 3.8 },
    });

    expect(interpolateCurveY(curve, 5)).toBeCloseTo(5, 8);
    expect(diagnostics.source).toBe("curve-interpolation");
    expect(diagnostics.pump.mismatchLMin).toBeCloseTo(0, 8);
    expect(diagnostics.pump.exceedsThreshold).toBe(false);
    expect(diagnostics.return.mismatchLMin).toBeCloseTo(1.2, 8);
    expect(diagnostics.return.exceedsThreshold).toBe(true);
  });

  it("moves the systemic Guyton estimate right/up when target blood volume rises", () => {
    const base = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 5600 });
    const loaded = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 6200 });
    const basePane = buildGuytonPaneData("right", base.metrics, base.core.debugObservables());
    const loadedPane = buildGuytonPaneData("right", loaded.metrics, loaded.core.debugObservables());

    expect(loadedPane.fillingPressure).toBeGreaterThan(basePane.fillingPressure);
    expect(loadedPane.summary.stressedVolumeMl).toBeGreaterThan(basePane.summary.stressedVolumeMl);
  });

  it("reports beat-mean systemic and pulmonary venous return in L/min", () => {
    const result = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 5600 });
    const beat = lastCompleteBeatWindow(result.samples);
    const mean = (key: "SVF" | "PVF") => beat.reduce((sum, sample) => sum + sample[key], 0) / beat.length;

    expect(result.metrics.systemicVenousReturnLMin).toBeCloseTo(mean("SVF") * 60 / 1000, 6);
    expect(result.metrics.pulmonaryVenousReturnLMin).toBeCloseTo(mean("PVF") * 60 / 1000, 6);
  });

  it("uses structural vascular snapshots when supplied", () => {
    const result = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 5600 });
    const pane = buildGuytonPaneData(
      "right",
      result.metrics,
      result.core.debugObservables(),
      result.core.vascularReturnSnapshot("right"),
    );

    expect(pane.venousReturn.source).toBe("structural-linearized");
    expect(pane.summary.effectiveResistanceMmHgPerLMin).toBeGreaterThan(0);
    expect(pane.venousReturn.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
    for (let i = 1; i < pane.venousReturn.points.length; i++) {
      expect(pane.venousReturn.points[i].y).toBeLessThanOrEqual(pane.venousReturn.points[i - 1].y + 1e-6);
    }
  });

  it("uses exact volume-constrained curves only for committed maps", () => {
    const result = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 5600 });
    const snapshot = result.core.vascularReturnSnapshot("right");
    const livePane = buildGuytonPaneData(
      "right",
      result.metrics,
      result.core.debugObservables(),
      snapshot,
    );
    const committedPane = buildCommittedGuytonPaneData(
      "right",
      result.metrics,
      result.core.debugObservables(),
      snapshot,
    );

    expect(livePane.venousReturn.source).toBe("structural-linearized");
    expect(committedPane.venousReturn.source).toBe("volume-constrained");
    expect(committedPane.classicVenousReturn.source).toBe("structural-linearized");
    expect(committedPane.guytonDiagnostics.source).toBe("exact-solver");
  });

  it("anchors committed filling pressure at exact zero return", () => {
    const result = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 5600 });
    const snapshot = result.core.vascularReturnSnapshot("right");
    const committedPane = buildCommittedGuytonPaneData(
      "right",
      result.metrics,
      result.core.debugObservables(),
      snapshot,
    );
    const atFill = solveReturnFlowAtDownstreamPressure(snapshot, committedPane.fillingPressure);
    const snapshotPoints = guytonSnapshotPoints(committedPane, undefined);

    expect(atFill.y).toBeLessThan(0.05);
    expect(snapshotPoints.some((point) => point.x === committedPane.fillingPressure && point.y === 0)).toBe(true);
  });

  it("keeps Guyton axes preset and expands without auto-shrinking", () => {
    const right = defaultGuytonAxis("right");

    expect(right).toEqual({ xMin: -5, xMax: 20, yMin: 0, yMax: 10 });
    expect(defaultGuytonAxis("left")).toEqual({ xMin: 0, xMax: 30, yMin: 0, yMax: 10 });
    expect(expandGuytonAxisToFit(right, [{ x: 0, y: 5 }, { x: 12, y: 8 }])).toEqual(right);

    const expanded = expandGuytonAxisToFit(right, [{ x: -8, y: 2 }, { x: 24, y: 13 }]);
    expect(expanded.xMin).toBeLessThan(right.xMin);
    expect(expanded.xMax).toBeGreaterThan(right.xMax);
    expect(expanded.yMin).toBe(right.yMin);
    expect(expanded.yMax).toBeGreaterThan(right.yMax);
  });

  it("extracts the live operating point without rebuilding map curves", () => {
    const m = metrics({ RAPMean: 4, LAPMean: 9, CO_R: 5.2, CO_L: 4.9 });

    expect(liveGuytonOperatingPoint("right", m)).toEqual({ pressure: 4, flow: 5.2 });
    expect(liveGuytonOperatingPoint("left", m)).toEqual({ pressure: 9, flow: 4.9 });
  });

  it("surfaces finite committed Guyton diagnostics from a settled real core", () => {
    const result = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 5600 });
    for (const side of ["right", "left"] as const) {
      const pane = buildCommittedGuytonPaneData(
        side,
        result.metrics,
        result.core.debugObservables(),
        result.core.vascularReturnSnapshot(side),
      );

      expect(Number.isFinite(pane.returnOperatingPoint.flow)).toBe(true);
      expect(Number.isFinite(pane.guytonDiagnostics.pump.guytonFlow)).toBe(true);
      expect(Number.isFinite(pane.guytonDiagnostics.pump.mismatchLMin)).toBe(true);
      expect(Number.isFinite(pane.guytonDiagnostics.return.guytonFlow)).toBe(true);
      expect(Number.isFinite(pane.guytonDiagnostics.return.mismatchLMin)).toBe(true);
    }
  });

  it("substantially reduces the default left Guyton residual with cycle-mean snapshots", () => {
    const result = runScenario(DEFAULT_PARAMS, { targetTBV: 5600 });
    const side = "left";
    const instant = buildCommittedGuytonPaneData(
      side,
      result.metrics,
      result.core.debugObservables(),
      result.core.vascularReturnSnapshot(side),
    );
    const cycleMean = buildCommittedGuytonPaneData(
      side,
      result.metrics,
      result.core.debugObservables(),
      result.core.vascularReturnSnapshot(side, { mode: "cycle-mean", dt: 0.001, sampleHz: 60 }),
    );

    expect(Math.abs(instant.guytonDiagnostics.pump.mismatchLMin)).toBeGreaterThan(1);
    expect(Math.abs(cycleMean.guytonDiagnostics.pump.mismatchLMin)).toBeLessThan(0.25);
    expect(Math.abs(cycleMean.guytonDiagnostics.return.mismatchLMin)).toBeLessThan(0.25);
  });

  it("keeps cycle-mean right Guyton residuals near the instant-snapshot residuals", () => {
    const result = runScenario(DEFAULT_PARAMS, { targetTBV: 5600 });
    const side = "right";
    const instant = buildCommittedGuytonPaneData(
      side,
      result.metrics,
      result.core.debugObservables(),
      result.core.vascularReturnSnapshot(side),
    );
    const cycleMean = buildCommittedGuytonPaneData(
      side,
      result.metrics,
      result.core.debugObservables(),
      result.core.vascularReturnSnapshot(side, { mode: "cycle-mean", dt: 0.001, sampleHz: 60 }),
    );

    expect(Number.isFinite(cycleMean.guytonDiagnostics.pump.mismatchLMin)).toBe(true);
    expect(Number.isFinite(cycleMean.guytonDiagnostics.return.mismatchLMin)).toBe(true);
    expect(Math.abs(cycleMean.guytonDiagnostics.pump.mismatchLMin))
      .toBeLessThanOrEqual(Math.abs(instant.guytonDiagnostics.pump.mismatchLMin) + 0.05);
    expect(Math.abs(cycleMean.guytonDiagnostics.return.mismatchLMin))
      .toBeLessThanOrEqual(Math.abs(instant.guytonDiagnostics.return.mismatchLMin) + 0.05);
  });
});

function nearest(points: { x: number; y: number }[], x: number): { x: number; y: number } {
  return points.reduce((best, point) => (
    Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best
  ), points[0]);
}

function xDomain(points: { x: number }[]): [number, number] {
  const xs = points.map((point) => point.x);
  return [Math.min(...xs), Math.max(...xs)];
}

function lastCompleteBeatWindow(samples: SimSample[]): SimSample[] {
  const curBeat = Math.floor(samples[samples.length - 1].phi);
  const target = curBeat - 1;
  let start = -1;
  let end = -1;
  for (let i = 0; i < samples.length; i++) {
    const beat = Math.floor(samples[i].phi);
    if (start === -1 && beat === target) start = i;
    else if (start !== -1 && beat > target) {
      end = i;
      break;
    }
  }
  if (start !== -1 && end !== -1 && end - start >= 5) return samples.slice(start, end + 1);
  throw new Error("No complete beat in scenario samples");
}

function metrics(overrides: Partial<SimMetrics> = {}): SimMetrics {
  return {
    HR: 75,
    AoPMean: 90,
    AoPSys: 120,
    AoPDia: 80,
    PAPMean: 18,
    RAPMean: 3,
    LAPMean: 9,
    LVEDPApprox: 12,
    RVEDPApprox: 8,
    AoVMeanGradient: 2,
    AoVPeakGradient: 6,
    SV_L: 64,
    SV_R: 66,
    CO_L: 4.8,
    CO_R: 5,
    systemicVenousReturnLMin: 5,
    pulmonaryVenousReturnLMin: 4.8,
    MVForwardVolumeMl: 64,
    MVReverseVolumeMl: 0,
    MVNetVolumeMl: 64,
    MVRegurgitantFraction: 0,
    AoVForwardVolumeMl: 64,
    AoVReverseVolumeMl: 0,
    AoVNetVolumeMl: 64,
    AoVRegurgitantFraction: 0,
    TVForwardVolumeMl: 66,
    TVReverseVolumeMl: 0,
    TVNetVolumeMl: 66,
    TVRegurgitantFraction: 0,
    PVForwardVolumeMl: 66,
    PVReverseVolumeMl: 0,
    PVNetVolumeMl: 66,
    PVRegurgitantFraction: 0,
    EF_LApprox: 0.6,
    EF_RApprox: 0.52,
    TBV: 5600,
    Pmsf: 10,
    vrGradient: 7,
    stressedVolumeSystemic: 900,
    unstressedVolumeSystemic: 3000,
    CorFlowLADMlMin: 95,
    CorFlowLCxMlMin: 60,
    CorFlowRCAMlMin: 70,
    CorFlowTotalMlMin: 225,
    CorPctCO: 4.7,
    CorDiastolicFractionLAD: 0.62,
    CorDiastolicFractionLCx: 0.55,
    CorDiastolicFractionRCA: 0.45,
    FFR_LAD: 0.98,
    FFR_LCx: 0.98,
    FFR_RCA: 0.98,
    CorSupplyDemandL: 1,
    CorSupplyDemandR: 1,
    ...overrides,
  };
}

function obs(overrides: Partial<SimObservables> = {}): SimObservables {
  return {
    Pmsf: 10,
    PmsfTm: 10,
    PmsfAbs: 10,
    vrGradient: 7,
    RAP: 3,
    stressedVolumeSystemic: 900,
    unstressedVolumeSystemic: 3000,
    systemicComplianceEff: 90,
    systemicExternalPressureWeighted: 0,
    venousStressedVolume: 600,
    venousUnstressedVolume: 2000,
    pulmonaryVenousVolume: 500,
    pulmonaryVenousStressedVolume: 40,
    pulmonaryVenousUnstressedVolume: 460,
    pulmonaryVenousComplianceEff: 8,
    pulmonaryVenousExternalPressureWeighted: 1,
    Pmpf: 5,
    PmpfTm: 5,
    PmpfAbs: 6,
    pulmonaryVenousReturnGradient: -3,
    pVeinVcGradient: 1,
    tbvCorrectionMagPerBeat: 0,
    tbvCorrectionLastStepMl: 0,
    expectedTBV: 5600,
    tbvErrorMl: 0,
    Pth: -2,
    Palv: 0,
    Q_VC_RA: 80,
    Q_TV: 80,
    Q_PV: 80,
    Q_PCap_PVen: 80,
    xiTV: 1,
    xiPV: 1,
    dP_TV: 1,
    dP_PV: 4,
    P_SV: 6,
    P_VC: 4,
    P_PVen: 8,
    P_PVein: 7,
    Pperi: 0,
    Ppc: 0,
    VHeart: 350,
    septumShiftMl: 0,
    VLVeff: 120,
    VRVeff: 140,
    PLVfw: 12,
    PRVfw: 8,
    PVI_LV: 0,
    PVI_RV: 0,
    septalForceMmHg: 0,
    Q_LAD: 1.6,
    Q_LCx: 1.0,
    Q_RCA: 1.2,
    Q_Cor_total: 3.8,
    Q_CS_RA: 3.8,
    P_LAD_Art: 88,
    P_LCx_Art: 88,
    P_RCA_Art: 88,
    P_CS: 5,
    PimLAD: 25,
    PimLCx: 22,
    PimRCA: 12,
    FFR_LAD: 0.98,
    FFR_LCx: 0.98,
    FFR_RCA: 0.98,
    ...overrides,
  };
}
