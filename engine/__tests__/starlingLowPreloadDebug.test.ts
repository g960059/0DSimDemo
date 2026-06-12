import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import {
  parseLowPreloadDebugArgs,
  reportToBeatPairOverlayCsv,
  reportToBeatPairOverlaySummaryCsv,
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

const runHeavyTests = process.env.CIRCLEHEART_HEAVY_TESTS === "1";
const heavyIt = (name: string, fn: () => void | Promise<void>) => {
  return runHeavyTests ? it(name, fn) : it.skip(name, fn);
};

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
      expect(["none", "aInfCap", "activeReserveCap"]).toContain(t?.lowStretchLimiter);
      expect(Number.isFinite(t?.lowStretchLimiterGate)).toBe(true);
      expect(Number.isFinite(t?.aInfRaw)).toBe(true);
      expect(Number.isFinite(t?.aInfCap)).toBe(true);
      expect(Number.isFinite(t?.aInfLimiterDelta)).toBe(true);
      expect(Number.isFinite(t?.activeTargetLimiter)).toBe(true);
      expect(Number.isFinite(t?.sigmaActTargetRaw)).toBe(true);
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

  it("builds a schema-v17 low-preload report with active, valve, clamp, TBV audit, return-map, filling morphology, and tau/dt fields", () => {
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

    expect(report.schemaVersion).toBe(17);
    expect(report.heartModel).toBe("activeStress");
    expect(report.returnMapMode).toBe("both");
    expect(report.beatPairOverlay).toBe(false);
    expect(report.tbvCorrectionMode).toBe("on");
    expect(report.aorticFlowClampMode).toBe("hard");
    expect(report.lambdaActScope).toBe("all");
    expect(report.lambdaActTerms).toBe("kd+fiso");
    expect(report.lowStretchLimiterMode).toBe("none");
    expect(report.lowStretchLimiterScope).toBe("lv");
    expect(report.activeReservePreset).toBe("none");
    expect(report.dtScenarios).toHaveLength(1);
    expect(report.points).toHaveLength(1);
    const point = report.points[0];
    expect(point.deltaVolumeMl).toBe(0);
    expect(point.beatTrace.length).toBeGreaterThan(0);
    expect(point.beatTrace[0].active.LV?.KdMean).toEqual(expect.any(Number));
    expect(point.beatTrace[0].active.LV?.activeTargetLimiterMin).toEqual(expect.any(Number));
    expect(point.beatTrace[0].active.LV?.activeTargetLimiterHitFraction).toEqual(expect.any(Number));
    expect(point.beatTrace[0].AoPMax).toEqual(expect.any(Number));
    expect(point.beatTrace[0].QAoCapRatioMax).toEqual(expect.any(Number));
    expect(point.beatTrace[0].QAoNearCap95Fraction).toEqual(expect.any(Number));
    expect(point.beatTrace[0].QAoLocalCapActiveFraction).toEqual(expect.any(Number));
    expect(point.returnMap.features.QAoMax?.centralSlope).toEqual(expect.any(Number));
    expect(point.beatTrace[0].active.LV?.sigmaActTargetReductionFractionMean).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.MV_E_forward_mL).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.MV_A_forward_mL).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.MV_A_fraction).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.MV_mid_forward_mL).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.MV_forward_peak_count).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.MV_mid_forward_peak_count).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.QMV_near_zero_return_count).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.MV_open_close_reopen_count).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.LAP_LVP_zero_crossing_count).toEqual(expect.any(Number));
    expect(["E-only", "E+A", "E+mid+A", "weak-A", "indeterminate"]).toContain(point.beatTrace[0].filling.fillingMorphologyClass);
    expect(point.beatTrace[0].filling.LA_A_loop_area).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.LA_A_loop_fraction).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.atrialSystoleTransmitralGradientMean).toEqual(expect.any(Number));
    expect(point.beatTrace[0].filling.atrialSystoleMVOpenFraction).toEqual(expect.any(Number));
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
    expect(Number.isFinite(report.summary.maxAbsReturnMapSlopeESVL)).toBe(true);
    expect(Number.isFinite(report.summary.maxBranchAmplitudeFractionCOL)).toBe(true);
    expect(Number.isFinite(report.summary.maxBranchAmplitudeFractionESVL)).toBe(true);
    expect(Number.isFinite(report.summary.minMVAForwardMl)).toBe(true);
    expect(Number.isFinite(report.summary.minMVAFraction)).toBe(true);
    expect(Number.isFinite(report.summary.minLAAloopFraction)).toBe(true);
    expect(Number.isFinite(report.summary.maxAtrialSystoleTransmitralGradientMean)).toBe(true);
    expect(Number.isFinite(report.summary.minAtrialSystoleMVOpenFraction)).toBe(true);
    expect(Number.isFinite(report.summary.maxSanitizeAbsMl)).toBe(true);
    expect(Number.isFinite(report.summary.maxProjectionAppliedMl)).toBe(true);

    const md = reportToMarkdown(report);
    expect(md).toContain("worst signal");
    expect(md).toContain("one-beat EDV slope");
    expect(md).toContain("two-beat EDV slope");
    expect(md).toContain("one-beat ESV slope");
    expect(md).toContain("MV/LA filling diagnostics");
    expect(md).toContain("beat-pair overlay");
    expect(md).toContain("MV mid mL");
    expect(md).toContain("morphology");
    expect(md).toContain("MV A mL");
    expect(md).toContain("branch CO frac");
    expect(md).toContain("Dynamic-flow clamps");
    expect(md).toContain("TBV / Clamp Audit");
    const csv = reportToCsv(report);
    expect(csv).toContain("LV_KdMean");
    expect(csv).toContain("LV_lambdaActMean");
    expect(csv).toContain("LV_lambdaForKdMean");
    expect(csv).toContain("LV_lambdaForFIsoMean");
    expect(csv).toContain("LV_lambdaActMinusRawMean");
    expect(csv).toContain("LV_aInfRawMean");
    expect(csv).toContain("LV_activeTargetLimiterMean");
    expect(csv).toContain("LV_activeTargetLimiterMin");
    expect(csv).toContain("LV_sigmaActTargetReductionFractionMean");
    expect(csv).toContain("branchAmplitudeFractionCO_L");
    expect(csv).toContain("branchAmplitudeFractionESV_L");
    expect(csv).toContain("returnMapEDVSlope");
    expect(csv).toContain("returnMapESVSlope");
    expect(csv).toContain("MV_A_forward_mL");
    expect(csv).toContain("MV_mid_forward_mL");
    expect(csv).toContain("MV_forward_peak_count");
    expect(csv).toContain("QMV_near_zero_return_count");
    expect(csv).toContain("MV_open_close_reopen_count");
    expect(csv).toContain("fillingMorphologyClass");
    expect(csv).toContain("LA_A_loop_fraction");
    expect(csv).toContain("atrialSystoleMVOpenFraction");
    expect(csv).toContain("tbvAuditClass");
  });

  it("can emit phase-aligned last-two-beat overlay rows for active/ejection versus MV event timing", () => {
    const report = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [-1300],
      dtValues: [0.002],
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      traceBeats: 4,
      sampleHz: 40,
      returnMapMode: "none",
      beatPairOverlay: true,
      quietClampLog: true,
    });

    expect(report.schemaVersion).toBe(17);
    expect(report.beatPairOverlay).toBe(true);
    const overlay = report.points[0].beatPairOverlay;
    expect(overlay).toBeDefined();
    expect(overlay?.beats).toHaveLength(2);
    expect(overlay?.rows.length).toBeGreaterThan(0);
    expect(overlay?.summary).toBeDefined();
    expect(overlay?.summary?.beatSummaries).toHaveLength(2);
    expect(overlay?.summary?.signals.some((signal) => signal.signal === "QAo")).toBe(true);
    expect(overlay?.summary?.signals.some((signal) => signal.signal === "LV.a")).toBe(true);
    expect(overlay?.summary?.windows.some((window) => window.window === "ejection")).toBe(true);
    expect(overlay?.summary?.divergenceThreshold).toBeGreaterThan(0);
    const row = overlay?.rows[0];
    expect(row?.pairBeat).toMatch(/previous|last/);
    expect(row?.QMV).toEqual(expect.any(Number));
    expect(row?.xiMV).toEqual(expect.any(Number));
    expect(row?.LAP_minus_LVP).toEqual(expect.any(Number));
    expect(row?.VLV).toEqual(expect.any(Number));
    expect(row?.LV_c).toEqual(expect.any(Number));
    expect(row?.LV_a).toEqual(expect.any(Number));
    expect(row?.LV_sigmaActTarget).toEqual(expect.any(Number));
    expect(row?.LV_sigmaAct).toEqual(expect.any(Number));
    expect(row?.QAo).toEqual(expect.any(Number));
    expect(row?.xiAoV).toEqual(expect.any(Number));
    expect(row?.AoP_minus_LVP).toEqual(expect.any(Number));

    const csv = reportToBeatPairOverlayCsv(report);
    expect(csv).toContain("pairBeat");
    expect(csv).toContain("LAP_minus_LVP");
    expect(csv).toContain("LV_sigmaActTarget");
    expect(csv).toContain("AoP_minus_LVP");
    const summaryCsv = reportToBeatPairOverlaySummaryCsv(report);
    expect(summaryCsv).toContain("recordType");
    expect(summaryCsv).toContain("firstDivergencePhase");
    expect(summaryCsv).toContain("highOutputBeat");
    expect(summaryCsv).toContain("signal");
    expect(summaryCsv).toContain("window");
    const md = reportToMarkdown(report);
    expect(md).toContain("Beat-pair overlay divergence summary");
    expect(md).toContain("High/low labels");
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
      "--low-stretch-limiter=activeReserveCap",
      "--low-stretch-limiter-scope=ventricles",
      "--active-reserve-preset=thresholdMild",
      "--return-map-deltas=-1250,-1400",
      "--tbv-correction=off",
      "--beat-pair-overlay",
    ]);

    expect(opts.returnMapMode).toBe("none");
    expect(opts.quietClampLog).toBe(true);
    expect(opts.maxReturnMapPoints).toBe(2);
    expect(opts.lambdaActScope).toBe("ventricles");
    expect(opts.lambdaActTerms).toBe("kd");
    expect(opts.lowStretchLimiterMode).toBe("activeReserveCap");
    expect(opts.lowStretchLimiterScope).toBe("ventricles");
    expect(opts.activeReservePreset).toBe("thresholdMild");
    expect(opts.returnMapDeltasMl).toEqual([-1250, -1400]);
    expect(opts.tbvCorrectionMode).toBe("off");
    expect(opts.beatPairOverlay).toBe(true);
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

  it("supports off-by-default AoV soft-flow-clamp diagnostics", () => {
    const debugOpts = parseLowPreloadDebugArgs([
      "--out=unused",
      "--deltas=0",
      "--dt=0.002",
      "--aortic-flow-clamp=local-c1-0.95",
      "--branch-only",
      "--trace-beats=2",
      "--sample-hz=40",
      "--quiet-clamp-log",
    ]);
    const report = runLowPreloadDebug(debugOpts);
    expect(report.aorticFlowClampMode).toBe("local-c1-0.95");
    expect(report.points[0].beatTrace[0].QAoMax).toEqual(expect.any(Number));
    expect(report.points[0].beatTrace[0].QAoLocalCapActiveFraction).toEqual(expect.any(Number));

    const matrixOpts = parseLowPreloadMatrixArgs([
      "--out=unused",
      "--deltas=0",
      "--dt=0.002",
      "--lambda-act-tau=0",
      "--aortic-flow-clamp=hard,soft-rational,local-c2-0.98",
      "--branch-only",
      "--trace-beats=2",
      "--sample-hz=40",
      "--quiet-progress",
    ]);
    const matrix = runLowPreloadMatrix(matrixOpts);
    expect(matrix.aorticFlowClampModes).toEqual(["hard", "local-c2-0.98", "soft-rational"]);
    expect(matrix.scenarios.map((scenario) => scenario.aorticFlowClampMode)).toEqual(["hard", "local-c2-0.98", "soft-rational"]);
    expect(matrix.summary.maxQAoCapRatioMax).toEqual(expect.any(Number));
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

  it("applies low-stretch limiter only to the requested chamber scope", () => {
    const lvOnly = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: 5600,
      deltasMl: [0],
      dtValues: [0.002],
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      lowStretchLimiterMode: "aInfCap",
      lowStretchLimiterScope: "lv",
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
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      lowStretchLimiterMode: "activeReserveCap",
      lowStretchLimiterScope: "ventricles",
      traceBeats: 2,
      sampleHz: 40,
      returnMapMode: "none",
      quietClampLog: true,
    }).points[0].activeStressTerminal;

    expect(lvOnly.LV?.lowStretchLimiter).toBe("aInfCap");
    expect(lvOnly.RV?.lowStretchLimiter).toBe("none");
    expect(ventricles.LV?.lowStretchLimiter).toBe("activeReserveCap");
    expect(ventricles.RV?.lowStretchLimiter).toBe("activeReserveCap");
    expect(ventricles.LA?.lowStretchLimiter).toBe("none");
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

  heavyIt("builds a low-preload matrix report with branch pass and selected return maps", () => {
    const opts = parseLowPreloadMatrixArgs([
      "--out=unused",
      "--deltas=0",
      "--dt=0.002",
      "--lambda-act-tau=0,0.15",
      "--lambda-act-scope=lv",
      "--lambda-act-terms=kd,fiso,kd+fiso",
      "--low-stretch-limiter=none,aInfCap,activeReserveCap",
      "--low-stretch-limiter-scope=lv",
      "--active-reserve-preset=directMild,directMedium",
      "--max-return-map-points=1",
      "--trace-beats=2",
      "--sample-hz=40",
      "--quiet-progress",
    ]);
    const report = runLowPreloadMatrix(opts);

    expect(report.schemaVersion).toBe(13);
    expect(report.heartModels).toEqual(["activeStress"]);
    expect(report.aorticFlowClampModes).toEqual(["hard"]);
    expect(report.scenarios).toHaveLength(7);
    expect(report.scenarios[0].heartModel).toBe("activeStress");
    expect(report.scenarios[0].aorticFlowClampMode).toBe("hard");
    expect(report.scenarios.filter((scenario) => scenario.lambdaActTauSec === 0)).toHaveLength(4);
    expect(report.scenarios.filter((scenario) => scenario.lambdaActTauSec === 0 && scenario.lowStretchLimiterMode === "none")).toHaveLength(1);
    expect(report.scenarios.filter((scenario) => scenario.lowStretchLimiterMode !== "none")).toHaveLength(3);
    expect(report.scenarios.find((scenario) => scenario.lambdaActTauSec === 0 && scenario.lowStretchLimiterMode === "aInfCap")).toBeDefined();
    expect(report.scenarios.filter((scenario) => scenario.lowStretchLimiterMode === "activeReserveCap").map((scenario) => scenario.activeReservePreset)).toEqual(["directMild", "directMedium"]);
    expect(report.scenarios.find((scenario) => scenario.lambdaActTerms === "kd" && scenario.lambdaActTauSec === 0.15)).toBeDefined();
    expect(report.scenarios[0].selectedDeltasMl).toHaveLength(1);
    expect(Number.isFinite(report.scenarios[0].shapeSummary.meanCOLErrorFractionVsBaseline)).toBe(true);
    expect(Number.isFinite(report.scenarios[0].shapeSummary.lowPreloadSlopeRatioVsBaseline)).toBe(true);
    expect(report.scenarios[0].shapeSummary.lowPreloadMonotonicityViolations).toEqual(expect.any(Number));
    expect(report.scenarios[0].waveformGates.map((gate) => gate.label)).toEqual(["normal", "HR100", "HR100-rearm"]);
    expect(report.scenarios[0].waveformGates[0].maxDeltaMetric).toEqual(expect.any(String));
    expect(report.summary.maxWaveformGateDeltaMetric).toEqual(expect.any(String));
    expect(report.summary.maxSanitizeAbsMl).toEqual(expect.any(Number));
    expect(report.summary.maxProjectionAppliedMl).toEqual(expect.any(Number));
    expect(report.summary.maxMeanCOLErrorFractionVsBaseline).toEqual(expect.any(Number));
    expect(report.summary.maxActiveReserveHitFraction).toEqual(expect.any(Number));
    expect(report.summary.branchLocalizationCounts.mixed).toEqual(expect.any(Number));
    expect(report.summary.branchLocalizationCounts["edv-dominant"]).toEqual(expect.any(Number));
    expect(report.summary.branchLocalizationCounts["esv/ejection-dominant"]).toEqual(expect.any(Number));
    expect(report.summary.maxCleanAbsOneBeatESVSlope).toEqual(expect.any(Number));
    expect(report.summary.maxCleanAbsOneBeatVolumeFeatureSlope).toEqual(expect.any(Number));
    expect(report.summary.minMVAForwardMl).toEqual(expect.any(Number));
    expect(report.summary.minMVAFraction).toEqual(expect.any(Number));
    expect(report.summary.minLAAloopFraction).toEqual(expect.any(Number));
    expect(report.summary.minAtrialSystoleMVOpenFraction).toEqual(expect.any(Number));
    expect(report.summary.maxFillingBranchMVAFraction).toEqual(expect.any(Number));
    expect(report.summary.maxFillingBranchMidFraction).toEqual(expect.any(Number));
    expect(report.summary.maxFillingBranchLAAloopFraction).toEqual(expect.any(Number));
    expect(report.summary.nearZeroReturnAlternationCount).toEqual(expect.any(Number));
    expect(report.summary.reopenCountAlternationCount).toEqual(expect.any(Number));
    expect(report.summary.pressureCrossingAlternationCount).toEqual(expect.any(Number));
    expect(report.summary.maxInterwaveXiMinAbs).toEqual(expect.any(Number));
    expect(report.summary.maxInterwaveOpen01MinAbs).toEqual(expect.any(Number));
    expect(report.summary.fillingMorphologyAlternationCount).toEqual(expect.any(Number));
    expect(report.summary.peakCountAlternationCount).toEqual(expect.any(Number));
    expect(report.summary.classificationCounts.baseline).toBeGreaterThan(0);
    expect(report.scenarios[0].evaluation.classification).toBe("baseline");
    expect(report.scenarios[0].evaluation.branchEnvelopeClass).toEqual(expect.any(String));
    expect(report.scenarios[0].evaluation.branchLocalizationClass).toEqual(expect.any(String));
    expect(report.scenarios[0].evaluation.maxCleanAbsOneBeatESVSlope).toEqual(expect.any(Number));
    expect(report.scenarios[0].evaluation.maxCleanAbsOneBeatVolumeFeatureSlope).toEqual(expect.any(Number));
    expect(report.scenarios[0].evaluation.worstDeltaCleanSlopeCovered).toEqual(expect.any(Boolean));
    expect(report.scenarios[0].evaluation.cleanSlopeCoverageClass).toEqual(expect.any(String));
    expect(report.scenarios[0].evaluation.returnMapEvidenceLevel).toEqual(expect.any(String));
    expect(report.scenarios[0].evaluation.requiresFullJacobianConfirmation).toEqual(expect.any(Boolean));
    expect(Array.isArray(report.scenarios[0].evaluation.cleanSlopeCoveredDeltasMl)).toBe(true);
    expect(Array.isArray(report.scenarios[0].evaluation.cleanSlopeMissingDeltasMl)).toBe(true);
    expect(report.scenarios[0].perDeltaEvaluation).toHaveLength(1);
    expect(report.scenarios[0].perDeltaEvaluation[0].branchEnvelopeClass).toEqual(expect.any(String));
    expect(report.scenarios[0].perDeltaEvaluation[0].branchLocalizationClass).toEqual(expect.any(String));
    expect(report.scenarios[0].perDeltaEvaluation[0].oneBeatESVSlope).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].maxAbsOneBeatVolumeFeatureSlope).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].MV_A_forward_mL).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].MV_A_fraction).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].MV_mid_forward_mL).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].MV_forward_peak_count).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].QMV_near_zero_return_count).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].MV_open_close_reopen_count).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingMorphologyClass).toEqual(expect.any(String));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingBranch?.MV_A_forward_fraction).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingBranch?.MV_mid_forward_fraction).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingBranch?.nearZeroReturnAlternates).toEqual(expect.any(Boolean));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingBranch?.reopenCountAlternates).toEqual(expect.any(Boolean));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingBranch?.pressureCrossingAlternates).toEqual(expect.any(Boolean));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingBranch?.interwaveXiMinAbs).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingBranch?.morphologyClassA).toEqual(expect.any(String));
    expect(report.scenarios[0].perDeltaEvaluation[0].fillingBranch?.morphologyClassB).toEqual(expect.any(String));
    expect(report.scenarios[0].perDeltaEvaluation[0].LA_A_loop_fraction).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].atrialSystoleMVOpenFraction).toEqual(expect.any(Number));
    expect(report.scenarios[0].perDeltaEvaluation[0].cleanForReturnMapSlope).toEqual(expect.any(Boolean));
    expect(report.scenarios[0].points.some((point) => point.returnMap.status === "ok")).toBe(true);
    expect(matrixReportToMarkdown(report)).toContain("Selected return-map points");
    expect(matrixReportToMarkdown(report)).toContain("Per-delta primary branch / slope view");
    expect(matrixReportToMarkdown(report)).toContain("Classification counts");
    expect(matrixReportToMarkdown(report)).toContain("Branch localization counts");
    expect(matrixReportToMarkdown(report)).toContain("Filling morphology alternation counts");
    expect(matrixReportToMarkdown(report)).toContain("Primary MV event alternation counts");
    expect(matrixReportToMarkdown(report)).toContain("LA/MV filling regime diagnostics");
    expect(matrixReportToMarkdown(report)).toContain("MV reopen count");
    expect(matrixReportToMarkdown(report)).toContain("Normal / HR100 waveform gates");
    expect(matrixReportToMarkdown(report)).toContain("TBV / Clamp Audit");
    expect(matrixReportToMarkdown(report)).toContain("dip/re-rise");
    expect(matrixReportToMarkdown(report)).toContain("scalar EDV");
    expect(matrixReportToMarkdown(report)).toContain("full-state Poincare Jacobian");
    expect(matrixReportToCsv(report)).toContain("returnMapSelected");
    expect(matrixReportToCsv(report)).toContain("heartModel");
    expect(matrixReportToCsv(report)).toContain("tbvCorrectionMode");
    expect(matrixReportToCsv(report)).toContain("lowStretchLimiterMode");
    expect(matrixReportToCsv(report)).toContain("activeReservePreset");
    expect(matrixReportToCsv(report)).toContain("meanCOLErrorFractionVsBaseline");
    expect(matrixReportToCsv(report)).toContain("branchAmplitudeFractionESV_L");
    expect(matrixReportToCsv(report)).toContain("scenarioBranchLocalizationClass");
    expect(matrixReportToCsv(report)).toContain("perDeltaBranchLocalizationClass");
    expect(matrixReportToCsv(report)).toContain("oneBeatESVSlope");
    expect(matrixReportToCsv(report)).toContain("maxAbsOneBeatVolumeFeatureSlope");
    expect(matrixReportToCsv(report)).toContain("MV_A_forward_mL");
    expect(matrixReportToCsv(report)).toContain("MV_mid_forward_mL");
    expect(matrixReportToCsv(report)).toContain("MV_forward_peak_count");
    expect(matrixReportToCsv(report)).toContain("fillingBranch_MV_A_forward_fraction");
    expect(matrixReportToCsv(report)).toContain("fillingBranch_reopenCountAlternates");
    expect(matrixReportToCsv(report)).toContain("fillingBranch_pressureCrossingAlternates");
    expect(matrixReportToCsv(report)).toContain("fillingBranch_morphologyAlternates");
    expect(matrixReportToCsv(report)).toContain("LA_A_loop_fraction");
    expect(matrixReportToCsv(report)).toContain("scenarioClassification");
    expect(matrixReportToCsv(report)).toContain("cleanForReturnMapSlope");
    expect(matrixReportToCsv(report)).toContain("worstDeltaCleanSlopeCovered");
    expect(matrixReportToCsv(report)).toContain("returnMapEvidenceLevel");
  });

  heavyIt("supports branch-only matrix runs without selected return-map points", () => {
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

  heavyIt("supports activeStress vs elastance heart-model matrix comparison", () => {
    const opts = parseLowPreloadMatrixArgs([
      "--out=unused",
      "--heart-model=activeStress,elastance",
      "--deltas=0",
      "--dt=0.002",
      "--lambda-act-tau=0",
      "--branch-only",
      "--trace-beats=2",
      "--sample-hz=40",
      "--quiet-progress",
    ]);
    const report = runLowPreloadMatrix(opts);

    expect(opts.heartModels).toEqual(["activeStress", "elastance"]);
    expect(report.scenarios.map((scenario) => scenario.heartModel)).toEqual(["activeStress", "elastance"]);
  });
});
