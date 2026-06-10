import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import { runLowPreloadDebug, reportToCsv, reportToMarkdown } from "@/tools/debugStarlingLowPreload";

describe("low-preload Starling debug diagnostics", () => {
  it("exposes finite active-stress diagnostic terms", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.25, 0.001, 60);

    const terms = core.debugActiveStressDiagnostics();
    expect(terms.LV).toBeDefined();
    expect(terms.RV).toBeDefined();
    for (const chamber of ["LV", "RV", "LA", "RA"] as const) {
      const t = terms[chamber];
      expect(t).toBeDefined();
      expect(Number.isFinite(t?.lambda)).toBe(true);
      expect(Number.isFinite(t?.Kd)).toBe(true);
      expect(Number.isFinite(t?.aInf)).toBe(true);
      expect(Number.isFinite(t?.tauA)).toBe(true);
      expect(t?.fIso).toBeGreaterThanOrEqual(0);
      expect(t?.fIso).toBeLessThanOrEqual(1);
      expect(t?.gOver).toBeGreaterThanOrEqual(0);
      expect(t?.gOver).toBeLessThanOrEqual(1);
      expect(t?.forceVelocityScale).toBeGreaterThan(0);
    }
  });

  it("reports clamp and valve diagnostic records without mutating dynamics", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.2, 0.001, 60);

    const diagnostics = core.debugClampDiagnostics();
    expect(diagnostics.totalClampHits).toBeGreaterThanOrEqual(0);
    expect(diagnostics.nodeClampHits).toBeDefined();
    expect(diagnostics.dynamicFlowClampHits).toBeDefined();
    expect(diagnostics.valveDiodeClampHits).toBeDefined();
  });

  it("builds a schema-v3 low-preload report with active, valve, clamp, return-map, and dt fields", () => {
    const report = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      traceBeats: 2,
      sampleHz: 40,
    });

    expect(report.schemaVersion).toBe(3);
    expect(report.dtScenarios).toHaveLength(1);
    expect(report.points).toHaveLength(1);
    const point = report.points[0];
    expect(point.deltaVolumeMl).toBe(0);
    expect(point.beatTrace.length).toBeGreaterThan(0);
    expect(point.beatTrace[0].active.LV?.KdMean).toEqual(expect.any(Number));
    expect(point.valveTrace.AoV.maxQ).toEqual(expect.any(Number));
    expect(point.clampDiagnostics.nodeClampHits).toBeDefined();
    expect(point.returnMap.method).toBe("edv-section-volume-preserving-lv-pvein-central-difference");
    expect(point.returnMap.status).toBe("ok");
    expect(point.returnMap.sectionBeat).toEqual(expect.any(Number));
    expect(Number.isFinite(point.returnMap.sectionPhi)).toBe(true);
    expect(Number.isFinite(point.returnMap.sectionVlvMl)).toBe(true);
    expect(Number.isFinite(point.returnMap.features.EDV_L?.centralSlope)).toBe(true);
    expect(Number.isFinite(point.returnMap.features.CO_L?.centralSlope)).toBe(true);
    expect(Number.isFinite(report.summary.maxAbsReturnMapSlopeEDVL)).toBe(true);

    const md = reportToMarkdown(report);
    expect(md).toContain("worst signal");
    expect(md).toContain("EDV return slope");
    expect(md).toContain("Dynamic-flow clamps");
    const csv = reportToCsv(report);
    expect(csv).toContain("LV_KdMean");
    expect(csv).toContain("returnMapEDVSlope");
  });
});
