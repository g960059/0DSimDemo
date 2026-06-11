import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import {
  parseLowPreloadDebugArgs,
  runLowPreloadDebug,
  selectSuspiciousPointIndices,
  reportToCsv,
  reportToMarkdown,
} from "@/tools/debugStarlingLowPreload";
import {
  matrixReportToCsv,
  matrixReportToMarkdown,
  parseLowPreloadMatrixArgs,
  runLowPreloadMatrix,
} from "@/tools/verifyStarlingLowPreloadMatrix";

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
      expect(Number.isFinite(t?.lambdaRaw)).toBe(true);
      expect(Number.isFinite(t?.lambdaAct)).toBe(true);
      expect(Number.isFinite(t?.lambdaForKd)).toBe(true);
      expect(Number.isFinite(t?.lambdaForFIso)).toBe(true);
      expect(["kd", "fiso", "kd+fiso"]).toContain(t?.lambdaActTerms);
      expect(Number.isFinite(t?.Kd)).toBe(true);
      expect(Number.isFinite(t?.aInf)).toBe(true);
      expect(Number.isFinite(t?.tauA)).toBe(true);
      expect(t?.fIso).toBeGreaterThanOrEqual(0);
      expect(t?.fIso).toBeLessThanOrEqual(1);
      expect(t?.gOver).toBeGreaterThanOrEqual(0);
      expect(t?.gOver).toBeLessThanOrEqual(1);
      expect(t?.forceVelocityScale).toBeGreaterThan(0);
      expect(Number.isFinite(t?.dLogCompositeActive_dLambdaAct)).toBe(true);
      expect(Number.isFinite(t?.lambdaActMinusRaw)).toBe(true);
      expect(Number.isFinite(t?.dLogCompositeActive_dLambda)).toBe(true);
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
    expect(diagnostics.sanitizeLastStep.absMl).toBeGreaterThanOrEqual(0);
    expect(diagnostics.sanitizeCurrentBeat.byNodeAbsMl).toBeDefined();
    expect(diagnostics.tbvProjectionLastStep.absAppliedMl).toBeGreaterThanOrEqual(0);
    expect(diagnostics.tbvProjectionCurrentBeat.byNodeAbsMl).toBeDefined();
  });

  it("records requested and applied TBV projection corrections", () => {
    const core = new ModelCore(DEFAULT_PARAMS);
    core.initializeVenousPressuresForTargetTBV(5600);
    const snapshot = core.packState();
    core.unpackState({ ...snapshot, expectedTBV: snapshot.expectedTBV + 20 });
    core.setTBVCorrectionAuditOptions({ gain: 1, maxTotalCorrectionMl: 2, maxNodeVolumeMl: 2 });

    core.step(0.001);

    const diagnostics = core.debugClampDiagnostics();
    expect(diagnostics.tbvProjectionLastStep.requestedMl).toBeGreaterThan(0);
    expect(diagnostics.tbvProjectionLastStep.absAppliedMl).toBeGreaterThan(0);
    expect(diagnostics.tbvProjectionCurrentBeat.absAppliedMl).toBeGreaterThan(0);
    expect(Math.abs(diagnostics.tbvProjectionLastStep.lastErrorAfterMl)).toBeLessThan(
      Math.abs(diagnostics.tbvProjectionLastStep.lastErrorBeforeMl),
    );
    expect(Object.keys(diagnostics.tbvProjectionLastStep.byNodeAbsMl).length).toBeGreaterThan(0);
  });

  it("builds a schema-v8 low-preload report with active, valve, clamp, TBV audit, return-map, and tau/dt fields", () => {
    const report = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "both",
      quietClampLog: true,
    });

    expect(report.schemaVersion).toBe(8);
    expect(report.returnMapMode).toBe("both");
    expect(report.tbvCorrectionMode).toBe("on");
    expect(report.lambdaActScope).toBe("all");
    expect(report.lambdaActTerms).toBe("kd+fiso");
    expect(report.dtScenarios).toHaveLength(1);
    expect(report.points).toHaveLength(1);
    const point = report.points[0];
    expect(point.deltaVolumeMl).toBe(0);
    expect(point.beatTrace.length).toBeGreaterThan(0);
    expect(point.beatTrace[0].active.LV?.KdMean).toEqual(expect.any(Number));
    expect(point.valveTrace.AoV.maxQ).toEqual(expect.any(Number));
    expect(point.clampDiagnostics.nodeClampHits).toBeDefined();
    expect(point.tbvAudit.correctionMode).toBe("on");
    expect(["clean", "contaminated"]).toContain(point.tbvAudit.classification);
    expect(Number.isFinite(point.tbvAudit.sanitizeAbsMl)).toBe(true);
    expect(Number.isFinite(point.tbvAudit.projectionAppliedMl)).toBe(true);
    expect(point.returnMap.method).toBe("edv-section-volume-preserving-lv-pvein-central-difference");
    expect(point.returnMap.sectionInterpolation).toBe("sample-peak");
    expect(point.returnMap.status).toBe("ok");
    expect(point.returnMap.sectionBeat).toEqual(expect.any(Number));
    expect(Number.isFinite(point.returnMap.sectionPhi)).toBe(true);
    expect(Number.isFinite(point.returnMap.sectionVlvMl)).toBe(true);
    expect(Number.isFinite(point.returnMap.features.EDV_L?.centralSlope)).toBe(true);
    expect(Number.isFinite(point.returnMap.features.CO_L?.centralSlope)).toBe(true);
    expect(Number.isFinite(point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope)).toBe(true);
    expect(point.returnMap.primaryMode).toBe("volumeLambdaActFixed");
    expect(point.returnMap.modes.volumeLambdaActFixed?.oneBeat).toBeDefined();
    expect(point.returnMap.modes.volumeLambdaActReset?.twoBeatSamePhase).toBeDefined();
    expect(point.returnMap.branchAmplitude.CO_L).toEqual(expect.any(Number));
    expect(point.returnMap.branchAmplitudeFraction.CO_L).toEqual(expect.any(Number));
    expect(Number.isFinite(report.summary.maxAbsReturnMapSlopeEDVL)).toBe(true);
    expect(Number.isFinite(report.summary.maxBranchAmplitudeFractionCOL)).toBe(true);
    expect(Number.isFinite(report.summary.maxSanitizeAbsMl)).toBe(true);
    expect(Number.isFinite(report.summary.maxProjectionAppliedMl)).toBe(true);

    const md = reportToMarkdown(report);
    expect(md).toContain("worst signal");
    expect(md).toContain("one-beat EDV slope");
    expect(md).toContain("two-beat EDV slope");
    expect(md).toContain("branch CO frac");
    expect(md).toContain("Dynamic-flow clamps");
    expect(md).toContain("TBV / Clamp Audit");
    const csv = reportToCsv(report);
    expect(csv).toContain("LV_KdMean");
    expect(csv).toContain("LV_lambdaActMean");
    expect(csv).toContain("LV_lambdaForKdMean");
    expect(csv).toContain("LV_lambdaForFIsoMean");
    expect(csv).toContain("LV_lambdaActMinusRawMean");
    expect(csv).toContain("branchAmplitudeFractionCO_L");
    expect(csv).toContain("returnMapEDVSlope");
    expect(csv).toContain("tbvAuditClass");
  });

  it("can run the off-by-default lambdaAct tau experiment without changing runtime defaults", () => {
    const report = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0, 0.15],
      lambdaActScope: "all",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "both",
      quietClampLog: true,
    });

    expect(report.dtScenarios.map((s) => s.lambdaActTauSec)).toEqual([0, 0.15]);
    const tauPoint = report.dtScenarios[1].points[0];
    expect(tauPoint.activeStressTerminal.LV?.tauLambdaActSec).toBeCloseTo(0.15, 6);
    expect(Number.isFinite(tauPoint.activeStressTerminal.LV?.lambdaAct)).toBe(true);
  });

  it("parses branch-only, return-map mode, quiet logging, max points, lambdaAct scope, and lambdaAct terms options", () => {
    const opts = parseLowPreloadDebugArgs([
      "--branch-only",
      "--quiet-clamp-log",
      "--max-return-map-points=2",
      "--lambda-act-scope=ventricles",
      "--lambda-act-terms=kd",
      "--return-map-deltas=-1250,-1400",
      "--tbv-correction=off",
    ]);

    expect(opts.returnMapMode).toBe("none");
    expect(opts.quietClampLog).toBe(true);
    expect(opts.maxReturnMapPoints).toBe(2);
    expect(opts.lambdaActScope).toBe("ventricles");
    expect(opts.lambdaActTerms).toBe("kd");
    expect(opts.returnMapDeltasMl).toEqual([-1250, -1400]);
    expect(opts.tbvCorrectionMode).toBe("off");
  });

  it("supports TBV correction off and low audit modes", () => {
    const offReport = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
      tbvCorrectionMode: "off",
    });
    const lowReport = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
      tbvCorrectionMode: "low",
    });

    expect(offReport.points[0].tbvAudit.correctionMode).toBe("off");
    expect(offReport.points[0].tbvAudit.projectionAbsAppliedMl).toBe(0);
    expect(lowReport.points[0].tbvAudit.correctionMode).toBe("low");
    expect(Number.isFinite(lowReport.points[0].tbvAudit.projectionAbsAppliedMl)).toBe(true);
  });

  it("can skip return-map diagnostics while preserving branch amplitude fields", () => {
    const report = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
    });

    const point = report.points[0];
    expect(point.returnMap.status).toBe("skipped");
    expect(point.returnMap.failureReason).toMatch(/disabled/);
    expect(point.returnMap.branchAmplitude.CO_L).toEqual(expect.any(Number));
    expect(Number.isFinite(report.summary.maxBranchAmplitudeFractionCOL)).toBe(true);
  });

  it("applies lambdaAct tau only to the requested active-stress term", () => {
    const kdOnly = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0.15],
      lambdaActScope: "lv",
      lambdaActTerms: "kd",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
    }).points[0].beatTrace.at(-1)?.active.LV;
    const fIsoOnly = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0.15],
      lambdaActScope: "lv",
      lambdaActTerms: "fiso",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
    }).points[0].beatTrace.at(-1)?.active.LV;

    expect(Number.isFinite(kdOnly?.lambdaForKdMean)).toBe(true);
    expect(kdOnly?.lambdaForFIsoMean).toBeCloseTo(kdOnly?.lambdaRawMean ?? NaN, 3);
    expect(fIsoOnly?.lambdaForKdMean).toBeCloseTo(fIsoOnly?.lambdaRawMean ?? NaN, 3);
    expect(Number.isFinite(fIsoOnly?.lambdaForFIsoMean)).toBe(true);
  });

  it("applies lambdaAct tau only to the requested chamber scope", () => {
    const lvOnly = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0.15],
      lambdaActScope: "lv",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
    }).points[0].activeStressTerminal;
    const ventricles = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0.15],
      lambdaActScope: "ventricles",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
    }).points[0].activeStressTerminal;

    expect(lvOnly.LV?.tauLambdaActSec).toBeCloseTo(0.15, 6);
    expect(lvOnly.RV?.tauLambdaActSec).toBe(0);
    expect(ventricles.LV?.tauLambdaActSec).toBeCloseTo(0.15, 6);
    expect(ventricles.RV?.tauLambdaActSec).toBeCloseTo(0.15, 6);
    expect(ventricles.LA?.tauLambdaActSec).toBe(0);
  });

  it("selects suspicious return-map points without duplicates", () => {
    const report = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0, -1250],
      dtValues: [0.002],
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
    });

    const selected = selectSuspiciousPointIndices(report.points, 2);
    expect(new Set(selected).size).toBe(selected.length);
    expect(selected.length).toBeGreaterThan(0);
    expect(selected.length).toBeLessThanOrEqual(2);
  });

  it("builds a low-preload matrix report with branch pass and selected return maps", () => {
    const opts = parseLowPreloadMatrixArgs([
      "--out=unused",
      "--deltas=0",
      "--dt=0.002",
      "--lambda-act-tau=0,0.15",
      "--lambda-act-scope=lv",
      "--lambda-act-terms=kd,fiso,kd+fiso",
      "--max-return-map-points=1",
      "--trace-beats=2",
      "--sample-hz=40",
      "--quiet-progress",
    ]);
    const report = runLowPreloadMatrix(opts);

    expect(report.schemaVersion).toBe(4);
    expect(report.scenarios).toHaveLength(4);
    expect(report.scenarios.filter((scenario) => scenario.lambdaActTauSec === 0)).toHaveLength(1);
    expect(report.scenarios[1].lambdaActTerms).toBe("kd");
    expect(report.scenarios[0].selectedDeltasMl).toHaveLength(1);
    expect(report.scenarios[0].waveformGates.map((gate) => gate.label)).toEqual(["normal", "HR100", "HR100-rearm"]);
    expect(report.scenarios[0].waveformGates[0].maxDeltaMetric).toEqual(expect.any(String));
    expect(report.summary.maxWaveformGateDeltaMetric).toEqual(expect.any(String));
    expect(report.summary.maxSanitizeAbsMl).toEqual(expect.any(Number));
    expect(report.summary.maxProjectionAppliedMl).toEqual(expect.any(Number));
    expect(report.scenarios[0].points.some((point) => point.returnMap.status === "ok")).toBe(true);
    expect(matrixReportToMarkdown(report)).toContain("Selected return-map points");
    expect(matrixReportToMarkdown(report)).toContain("Normal / HR100 waveform gates");
    expect(matrixReportToMarkdown(report)).toContain("TBV / Clamp Audit");
    expect(matrixReportToCsv(report)).toContain("returnMapSelected");
    expect(matrixReportToCsv(report)).toContain("tbvCorrectionMode");
    expect(matrixReportToCsv(report)).toContain("branchAmplitudeFractionESV_L");
  });

  it("supports branch-only matrix runs without selected return-map points", () => {
    const opts = parseLowPreloadMatrixArgs([
      "--out=unused",
      "--deltas=0",
      "--dt=0.002",
      "--lambda-act-tau=0",
      "--branch-only",
      "--trace-beats=2",
      "--sample-hz=40",
      "--quiet-progress",
    ]);
    const report = runLowPreloadMatrix(opts);

    expect(opts.maxReturnMapPoints).toBe(0);
    expect(report.summary.selectedReturnMapPointCount).toBe(0);
    expect(report.scenarios[0].selectedDeltasMl).toEqual([]);
    expect(report.scenarios[0].points.every((point) => point.returnMap.status === "skipped")).toBe(true);
  });
});
