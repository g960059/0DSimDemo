import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { buildGuytonPaneData, sampleVenousReturnCurve } from "@/engine/guytonStarling";
import { runScenario } from "@/engine/harness";
import type { SimMetrics, SimObservables } from "@/engine/protocol";

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
    expect(pane.operatingPoint.pressure).toBe(8);
    expect(pane.gradient).toBeCloseTo(5, 6);
    expect(pane.summary.effectiveComplianceMlPerMmHg).toBeGreaterThan(0);
    expect(pane.venousReturn.points.length).toBeGreaterThan(50);
  });

  it("moves the systemic Guyton estimate right/up when target blood volume rises", () => {
    const base = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 5600 });
    const loaded = runScenario(DEFAULT_PARAMS, { ...FAST_OPTIONS, targetTBV: 6200 });
    const basePane = buildGuytonPaneData("right", base.metrics, base.core.debugObservables());
    const loadedPane = buildGuytonPaneData("right", loaded.metrics, loaded.core.debugObservables());

    expect(loadedPane.fillingPressure).toBeGreaterThan(basePane.fillingPressure);
    expect(loadedPane.summary.stressedVolumeMl).toBeGreaterThan(basePane.summary.stressedVolumeMl);
  });
});

function nearest(points: { x: number; y: number }[], x: number): { x: number; y: number } {
  return points.reduce((best, point) => (
    Math.abs(point.x - x) < Math.abs(best.x - x) ? point : best
  ), points[0]);
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
    SV_L: 64,
    SV_R: 66,
    CO_L: 4.8,
    CO_R: 5,
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
