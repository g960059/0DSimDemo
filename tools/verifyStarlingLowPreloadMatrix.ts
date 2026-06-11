import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import type { LambdaActTerms, LowStretchLimiterMode } from "@/engine/chambers";
import type { SimSample } from "@/engine/protocol";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import {
  paramsWithLambdaActTau,
  paramsWithLowStretchLimiter,
  runLowPreloadDebug,
  selectSuspiciousPointIndices,
  type ActiveReservePreset,
  type LambdaActScope,
  type TBVCorrectionMode,
} from "@/tools/debugStarlingLowPreload";

type DebugReport = ReturnType<typeof runLowPreloadDebug>;
type DebugPoint = DebugReport["points"][number];

type MatrixOptions = {
  outDir: string;
  targetVolumeMl: number;
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  lambdaActScopes: LambdaActScope[];
  lambdaActTermsValues: LambdaActTerms[];
  lowStretchLimiterModes: LowStretchLimiterMode[];
  lowStretchLimiterScopes: LambdaActScope[];
  activeReservePresets: ActiveReservePreset[];
  tbvCorrectionModes: TBVCorrectionMode[];
  maxReturnMapPoints: number;
  traceBeats: number;
  sampleHz: number;
  includeAllScope: boolean;
  progress?: boolean;
  partialWrite?: (report: MatrixReport) => void;
};

type WaveformGateLabel = "normal" | "HR100" | "HR100-rearm";
type WaveformGateMetrics = {
  settled: boolean;
  settleReason: string;
  periodBeats: number;
  CO_L: number;
  CO_R: number;
  EDV_L: number;
  ESV_L: number;
  EF_L: number;
  LVPMax: number;
  QAoMax: number;
  maxDpdtLVP: number;
  clampHitCount: number;
  valveReverseVolumeMl: number;
};
type WaveformGateComparison = {
  label: WaveformGateLabel;
  HR: number;
  baseline: WaveformGateMetrics;
  candidate: WaveformGateMetrics;
  delta: Pick<WaveformGateMetrics, "CO_L" | "CO_R" | "EDV_L" | "ESV_L" | "EF_L" | "LVPMax" | "QAoMax" | "maxDpdtLVP" | "clampHitCount" | "valveReverseVolumeMl">;
  maxDeltaMetric: keyof WaveformGateComparison["delta"];
  maxDeltaFraction: number;
};

type MatrixScenario = {
  dt: number;
  lambdaActTauSec: number;
  lambdaActScope: LambdaActScope;
  lambdaActTerms: LambdaActTerms;
  lowStretchLimiterMode: LowStretchLimiterMode;
  lowStretchLimiterScope: LambdaActScope;
  activeReservePreset: ActiveReservePreset;
  tbvCorrectionMode: TBVCorrectionMode;
  selectedDeltasMl: number[];
  shapeSummary: ShapeSummary;
  branchSummary: DebugReport["summary"];
  returnMapSummary: DebugReport["summary"];
  waveformGates: WaveformGateComparison[];
  points: DebugPoint[];
};

type ShapeSummary = {
  meanCOLErrorFractionVsBaseline: number;
  meanSVLErrorFractionVsBaseline: number;
  lowPreloadMonotonicityViolations: number;
  dipReRiseScoreLMin: number;
  lowPreloadSlopeRatioVsBaseline: number;
  maxActiveReserveHitFraction: number;
  minActiveReserveScale: number;
  maxSigmaActTargetReductionFraction: number;
};

type MatrixReport = {
  schemaVersion: 6;
  generatedAt: string;
  measurementMode: string;
  targetVolumeMl: number;
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  lambdaActScopes: LambdaActScope[];
  lambdaActTermsValues: LambdaActTerms[];
  lowStretchLimiterModes: LowStretchLimiterMode[];
  lowStretchLimiterScopes: LambdaActScope[];
  activeReservePresets: ActiveReservePreset[];
  tbvCorrectionModes: TBVCorrectionMode[];
  maxReturnMapPoints: number;
  traceBeats: number;
  sampleHz: number;
  scenarios: MatrixScenario[];
  summary: {
    scenarioCount: number;
    maxBranchAmplitudeFractionCOL: number;
    maxBranchAmplitudeFractionEDVL: number;
    maxBranchAmplitudeFractionESVL: number;
    maxClampHitCount: number;
    maxMeanCOLErrorFractionVsBaseline: number;
    maxMeanSVLErrorFractionVsBaseline: number;
    maxLowPreloadMonotonicityViolations: number;
    maxDipReRiseScoreLMin: number;
    minLowPreloadSlopeRatioVsBaseline: number;
    maxActiveReserveHitFraction: number;
    minActiveReserveScale: number;
    maxSigmaActTargetReductionFraction: number;
    maxWaveformGateDeltaFraction: number;
    maxWaveformGateDeltaMetric: string | null;
    maxSanitizeAbsMl: number;
    maxProjectionAppliedMl: number;
    contaminatedPointCount: number;
    selectedReturnMapPointCount: number;
  };
};

const DEFAULT_DELTAS = [0, -900, -1000, -1100, -1200, -1250, -1300, -1400, -1500, -1600];
const DEFAULT_DT_VALUES = [0.001, 0.0005];
const DEFAULT_TAU_VALUES = [0, 0.05, 0.1, 0.15, 0.2, 0.4];
const DEFAULT_SCOPES: LambdaActScope[] = ["lv", "ventricles"];
const DEFAULT_TERMS: LambdaActTerms[] = ["kd", "fiso", "kd+fiso"];
const DEFAULT_LOW_STRETCH_LIMITERS: LowStretchLimiterMode[] = ["none"];
const DEFAULT_LOW_STRETCH_LIMITER_SCOPES: LambdaActScope[] = ["lv"];
const DEFAULT_ACTIVE_RESERVE_PRESETS: ActiveReservePreset[] = ["directMild", "directMedium", "thresholdMild", "thresholdMedium"];
const DEFAULT_TBV_CORRECTION_MODES: TBVCorrectionMode[] = ["on"];
const WAVEFORM_RUN_OPTIONS = { collectSamples: false, recordHistory: true, historyLimit: 720 };
const WAVEFORM_SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 };

export function runLowPreloadMatrix(opts: MatrixOptions): MatrixReport {
  const scopes = opts.includeAllScope
    ? Array.from(new Set([...opts.lambdaActScopes, "all" as LambdaActScope]))
    : opts.lambdaActScopes;
  const scenarios: MatrixScenario[] = [];
  const waveformBaselineCache = new Map<string, WaveformGateMetrics>();
  const branchBaselineCache = new Map<string, DebugPoint[]>();
  const specs = matrixScenarioSpecs(opts, scopes);
  specs.forEach((spec, index) => {
    const { lambdaActScope, lambdaActTauSec, lambdaActTerms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, tbvCorrectionMode, dt } = spec;
    if (opts.progress) {
      // eslint-disable-next-line no-console
      console.log(
        `[matrix] ${index + 1}/${specs.length} dt=${dt} tau=${lambdaActTauSec} scope=${lambdaActScope} terms=${lambdaActTerms} limiter=${lowStretchLimiterMode}/${lowStretchLimiterScope} preset=${activeReservePreset} tbv=${tbvCorrectionMode}`,
      );
    }
    const branchReport = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: opts.targetVolumeMl,
      deltasMl: opts.deltasMl,
      dtValues: [dt],
      lambdaActTauSecValues: [lambdaActTauSec],
      lambdaActScope,
      lambdaActTerms,
      lowStretchLimiterMode,
      lowStretchLimiterScope,
      activeReservePreset,
      tbvCorrectionMode,
      traceBeats: opts.traceBeats,
      sampleHz: opts.sampleHz,
      returnMapMode: "none",
      quietClampLog: true,
    });
    const selectedIndices = selectSuspiciousPointIndices(branchReport.points, opts.maxReturnMapPoints);
    const selectedDeltasMl = selectedIndices.map((index) => branchReport.points[index]?.deltaVolumeMl).filter(isFiniteNumber);
    const returnMapReport = selectedDeltasMl.length === 0
      ? branchReport
      : runLowPreloadDebug({
          outDir: "unused",
          targetVolumeMl: opts.targetVolumeMl,
          deltasMl: opts.deltasMl,
          dtValues: [dt],
          lambdaActTauSecValues: [lambdaActTauSec],
          lambdaActScope,
          lambdaActTerms,
          lowStretchLimiterMode,
          lowStretchLimiterScope,
          activeReservePreset,
          tbvCorrectionMode,
          traceBeats: opts.traceBeats,
          sampleHz: opts.sampleHz,
          returnMapMode: "both",
          returnMapDeltasMl: selectedDeltasMl,
          quietClampLog: true,
        });
    const baselineKey = branchBaselineKey(dt, tbvCorrectionMode);
    if (lambdaActTauSec === 0 && lowStretchLimiterMode === "none") {
      branchBaselineCache.set(baselineKey, branchReport.points);
    }
    const baselinePoints = branchBaselineCache.get(baselineKey) ?? branchReport.points;
    scenarios.push({
      dt,
      lambdaActTauSec,
      lambdaActScope,
      lambdaActTerms,
      lowStretchLimiterMode,
      lowStretchLimiterScope,
      activeReservePreset,
      tbvCorrectionMode,
      selectedDeltasMl,
      shapeSummary: buildShapeSummary(branchReport.points, baselinePoints),
      branchSummary: branchReport.summary,
      returnMapSummary: returnMapReport.summary,
      waveformGates: buildWaveformGateComparisons(
        opts.targetVolumeMl,
        dt,
        opts.sampleHz,
        lambdaActScope,
        lambdaActTauSec,
        lambdaActTerms,
        lowStretchLimiterMode,
        lowStretchLimiterScope,
        activeReservePreset,
        waveformBaselineCache,
      ),
      points: returnMapReport.points,
    });
    opts.partialWrite?.(buildMatrixReport(opts, scopes, scenarios));
  });
  return buildMatrixReport(opts, scopes, scenarios);
}

function buildMatrixReport(opts: MatrixOptions, scopes: LambdaActScope[], scenarios: MatrixScenario[]): MatrixReport {
  const maxWaveformGate = scenarios
    .flatMap((scenario) => scenario.waveformGates)
    .reduce<{ fraction: number; metric: string | null }>(
      (best, gate) => gate.maxDeltaFraction > best.fraction
        ? { fraction: gate.maxDeltaFraction, metric: `${gate.label}:${gate.maxDeltaMetric}` }
        : best,
      { fraction: 0, metric: null },
    );
  return {
    schemaVersion: 6,
    generatedAt: new Date().toISOString(),
    measurementMode: "branch-only broad low-preload matrix followed by selected EDV-section return-map diagnostics; optional TBV correction on/off/low contamination axis; off-by-default low-stretch limiter comparator axis",
    targetVolumeMl: opts.targetVolumeMl,
    deltasMl: opts.deltasMl,
    dtValues: opts.dtValues,
    lambdaActTauSecValues: opts.lambdaActTauSecValues,
    lambdaActScopes: scopes,
    lambdaActTermsValues: opts.lambdaActTermsValues,
    lowStretchLimiterModes: Array.from(new Set(["none" as LowStretchLimiterMode, ...opts.lowStretchLimiterModes])),
    lowStretchLimiterScopes: opts.lowStretchLimiterScopes,
    activeReservePresets: opts.activeReservePresets,
    tbvCorrectionModes: opts.tbvCorrectionModes,
    maxReturnMapPoints: opts.maxReturnMapPoints,
    traceBeats: opts.traceBeats,
    sampleHz: opts.sampleHz,
    scenarios,
    summary: {
      scenarioCount: scenarios.length,
      maxBranchAmplitudeFractionCOL: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionCOL)),
      maxBranchAmplitudeFractionEDVL: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionEDVL)),
      maxBranchAmplitudeFractionESVL: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionESVL)),
      maxClampHitCount: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxClampHitCount)),
      maxMeanCOLErrorFractionVsBaseline: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.shapeSummary.meanCOLErrorFractionVsBaseline))),
      maxMeanSVLErrorFractionVsBaseline: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.shapeSummary.meanSVLErrorFractionVsBaseline))),
      maxLowPreloadMonotonicityViolations: Math.max(0, ...scenarios.map((s) => s.shapeSummary.lowPreloadMonotonicityViolations)),
      maxDipReRiseScoreLMin: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.shapeSummary.dipReRiseScoreLMin))),
      minLowPreloadSlopeRatioVsBaseline: finiteMin(scenarios.map((s) => s.shapeSummary.lowPreloadSlopeRatioVsBaseline)),
      maxActiveReserveHitFraction: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.shapeSummary.maxActiveReserveHitFraction))),
      minActiveReserveScale: finiteMin(scenarios.map((s) => s.shapeSummary.minActiveReserveScale)),
      maxSigmaActTargetReductionFraction: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.shapeSummary.maxSigmaActTargetReductionFraction))),
      maxWaveformGateDeltaFraction: maxWaveformGate.fraction,
      maxWaveformGateDeltaMetric: maxWaveformGate.metric,
      maxSanitizeAbsMl: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxSanitizeAbsMl)),
      maxProjectionAppliedMl: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxProjectionAppliedMl)),
      contaminatedPointCount: scenarios.reduce((sum, scenario) => sum + scenario.returnMapSummary.contaminatedPointCount, 0),
      selectedReturnMapPointCount: scenarios.reduce((sum, scenario) => sum + scenario.selectedDeltasMl.length, 0),
    },
  };
}

function matrixScenarioSpecs(
  opts: MatrixOptions,
  scopes: LambdaActScope[],
): Array<{
  dt: number;
  lambdaActTauSec: number;
  lambdaActScope: LambdaActScope;
  lambdaActTerms: LambdaActTerms;
  lowStretchLimiterMode: LowStretchLimiterMode;
  lowStretchLimiterScope: LambdaActScope;
  activeReservePreset: ActiveReservePreset;
  tbvCorrectionMode: TBVCorrectionMode;
}> {
  const specs: Array<{
    dt: number;
    lambdaActTauSec: number;
    lambdaActScope: LambdaActScope;
    lambdaActTerms: LambdaActTerms;
    lowStretchLimiterMode: LowStretchLimiterMode;
    lowStretchLimiterScope: LambdaActScope;
    activeReservePreset: ActiveReservePreset;
    tbvCorrectionMode: TBVCorrectionMode;
  }> = [];
  for (const dt of opts.dtValues) {
    for (const tbvCorrectionMode of opts.tbvCorrectionModes) {
      specs.push({
        dt,
        lambdaActTauSec: 0,
        lambdaActScope: "all",
        lambdaActTerms: "kd+fiso",
        lowStretchLimiterMode: "none",
        lowStretchLimiterScope: "lv",
        activeReservePreset: "none",
        tbvCorrectionMode,
      });
      for (const lowStretchLimiterMode of opts.lowStretchLimiterModes.filter((mode) => mode !== "none")) {
        for (const lowStretchLimiterScope of opts.lowStretchLimiterScopes) {
          const presets = lowStretchLimiterMode === "activeReserveCap" ? opts.activeReservePresets : ["none" as ActiveReservePreset];
          for (const activeReservePreset of presets) {
            specs.push({
              dt,
              lambdaActTauSec: 0,
              lambdaActScope: "all",
              lambdaActTerms: "kd+fiso",
              lowStretchLimiterMode,
              lowStretchLimiterScope,
              activeReservePreset,
              tbvCorrectionMode,
            });
          }
        }
      }
      for (const lambdaActTauSec of opts.lambdaActTauSecValues.filter((tau) => tau > 0)) {
        for (const lambdaActScope of scopes) {
          for (const lambdaActTerms of opts.lambdaActTermsValues) {
            specs.push({
              dt,
              lambdaActTauSec,
              lambdaActScope,
              lambdaActTerms,
              lowStretchLimiterMode: "none",
              lowStretchLimiterScope: "lv",
              activeReservePreset: "none",
              tbvCorrectionMode,
            });
          }
        }
      }
    }
  }
  return specs;
}

function branchBaselineKey(dt: number, tbvCorrectionMode: TBVCorrectionMode): string {
  return `${dt}|${tbvCorrectionMode}`;
}

function buildShapeSummary(points: DebugPoint[], baselinePoints: DebugPoint[]): ShapeSummary {
  const baselineByDelta = new Map(baselinePoints.map((point) => [String(point.deltaVolumeMl), point]));
  const matched = points
    .map((point) => ({ point, baseline: baselineByDelta.get(String(point.deltaVolumeMl)) }))
    .filter((entry): entry is { point: DebugPoint; baseline: DebugPoint } => !!entry.baseline);
  const coErrors = matched
    .map(({ point, baseline }) => fractionalAbsDelta(point.periodMetrics.CO_L, baseline.periodMetrics.CO_L, 0.05))
    .filter(Number.isFinite);
  const svErrors = matched
    .map(({ point, baseline }) => fractionalAbsDelta(point.periodMetrics.SV_L, baseline.periodMetrics.SV_L, 1))
    .filter(Number.isFinite);
  const lowPoints = points
    .filter((point) => point.deltaVolumeMl <= 0)
    .filter((point) => Number.isFinite(point.periodMetrics.LAPMean) && Number.isFinite(point.periodMetrics.CO_L))
    .sort((a, b) => a.periodMetrics.LAPMean - b.periodMetrics.LAPMean);
  const lowBaselinePoints = baselinePoints
    .filter((point) => point.deltaVolumeMl <= 0)
    .filter((point) => Number.isFinite(point.periodMetrics.LAPMean) && Number.isFinite(point.periodMetrics.CO_L))
    .sort((a, b) => a.periodMetrics.LAPMean - b.periodMetrics.LAPMean);
  const active = activeReserveStats(points);
  const candidateSlope = lowPreloadSlope(lowPoints);
  const baselineSlope = lowPreloadSlope(lowBaselinePoints);
  return {
    meanCOLErrorFractionVsBaseline: meanNumbers(coErrors),
    meanSVLErrorFractionVsBaseline: meanNumbers(svErrors),
    lowPreloadMonotonicityViolations: countMonotonicityViolations(lowPoints),
    dipReRiseScoreLMin: dipReRiseScore(lowPoints),
    lowPreloadSlopeRatioVsBaseline: safeSlopeRatio(candidateSlope, baselineSlope),
    maxActiveReserveHitFraction: active.maxHitFraction,
    minActiveReserveScale: active.minScale,
    maxSigmaActTargetReductionFraction: active.maxReductionFraction,
  };
}

function safeSlopeRatio(candidateSlope: number, baselineSlope: number): number {
  if (!Number.isFinite(candidateSlope) || !Number.isFinite(baselineSlope) || Math.abs(baselineSlope) < 1e-9) return 1;
  return candidateSlope / baselineSlope;
}

function activeReserveStats(points: DebugPoint[]): {
  maxHitFraction: number;
  minScale: number;
  maxReductionFraction: number;
} {
  const summaries = points.flatMap((point) => point.beatTrace.flatMap((beat) => beat.active.LV ? [beat.active.LV] : []));
  return {
    maxHitFraction: Math.max(0, ...summaries.map((summary) => finiteOrZero(summary.activeTargetLimiterHitFraction))),
    minScale: finiteMin(summaries.map((summary) => summary.activeTargetLimiterMin)),
    maxReductionFraction: Math.max(0, ...summaries.map((summary) => finiteOrZero(summary.sigmaActTargetReductionFractionMean))),
  };
}

function countMonotonicityViolations(points: DebugPoint[]): number {
  let count = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].periodMetrics.CO_L < points[i - 1].periodMetrics.CO_L - 0.05) count++;
  }
  return count;
}

function dipReRiseScore(points: DebugPoint[]): number {
  let maxScore = 0;
  for (let i = 1; i < points.length; i++) {
    const drop = points[i - 1].periodMetrics.CO_L - points[i].periodMetrics.CO_L;
    if (drop <= 0.05) continue;
    const futureMax = Math.max(...points.slice(i + 1).map((point) => point.periodMetrics.CO_L).filter(Number.isFinite));
    if (Number.isFinite(futureMax)) maxScore = Math.max(maxScore, futureMax - points[i].periodMetrics.CO_L);
  }
  return maxScore;
}

function lowPreloadSlope(points: DebugPoint[]): number {
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].periodMetrics.LAPMean - points[i - 1].periodMetrics.LAPMean;
    if (Math.abs(dx) > 1e-6) return (points[i].periodMetrics.CO_L - points[i - 1].periodMetrics.CO_L) / dx;
  }
  return Number.NaN;
}

function buildWaveformGateComparisons(
  targetVolumeMl: number,
  dt: number,
  sampleHz: number,
  scope: LambdaActScope,
  tauSec: number,
  terms: LambdaActTerms,
  lowStretchLimiterMode: LowStretchLimiterMode,
  lowStretchLimiterScope: LambdaActScope,
  activeReservePreset: ActiveReservePreset,
  baselineCache: Map<string, WaveformGateMetrics>,
): WaveformGateComparison[] {
  return [
    waveformGateComparison("normal", DEFAULT_PARAMS.HR, targetVolumeMl, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, baselineCache),
    waveformGateComparison("HR100", 100, targetVolumeMl, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, baselineCache),
    waveformGateComparison("HR100-rearm", 100, targetVolumeMl, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, baselineCache),
  ];
}

function waveformGateComparison(
  label: WaveformGateLabel,
  HR: number,
  targetVolumeMl: number,
  dt: number,
  sampleHz: number,
  scope: LambdaActScope,
  tauSec: number,
  terms: LambdaActTerms,
  lowStretchLimiterMode: LowStretchLimiterMode,
  lowStretchLimiterScope: LambdaActScope,
  activeReservePreset: ActiveReservePreset,
  baselineCache: Map<string, WaveformGateMetrics>,
): WaveformGateComparison {
  const baselineKey = `${label}|${HR}|${targetVolumeMl}|${dt}|${sampleHz}`;
  let baseline = baselineCache.get(baselineKey);
  if (!baseline) {
    baseline = measureWaveformGate(label, HR, targetVolumeMl, dt, sampleHz, "all", 0, "kd+fiso");
    baselineCache.set(baselineKey, baseline);
  }
  const candidate = tauSec <= 0 && lowStretchLimiterMode === "none"
    ? baseline
    : measureWaveformGate(label, HR, targetVolumeMl, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset);
  const delta = {
    CO_L: candidate.CO_L - baseline.CO_L,
    CO_R: candidate.CO_R - baseline.CO_R,
    EDV_L: candidate.EDV_L - baseline.EDV_L,
    ESV_L: candidate.ESV_L - baseline.ESV_L,
    EF_L: candidate.EF_L - baseline.EF_L,
    LVPMax: candidate.LVPMax - baseline.LVPMax,
    QAoMax: candidate.QAoMax - baseline.QAoMax,
    maxDpdtLVP: candidate.maxDpdtLVP - baseline.maxDpdtLVP,
    clampHitCount: candidate.clampHitCount - baseline.clampHitCount,
    valveReverseVolumeMl: candidate.valveReverseVolumeMl - baseline.valveReverseVolumeMl,
  };
  const maxDelta = maxWaveformDelta(delta, baseline);
  return {
    label,
    HR,
    baseline,
    candidate,
    delta,
    maxDeltaMetric: maxDelta.metric,
    maxDeltaFraction: maxDelta.fraction,
  };
}

function measureWaveformGate(
  label: WaveformGateLabel,
  HR: number,
  targetVolumeMl: number,
  dt: number,
  sampleHz: number,
  scope: LambdaActScope,
  tauSec: number,
  terms: LambdaActTerms,
  lowStretchLimiterMode: LowStretchLimiterMode = "none",
  lowStretchLimiterScope: LambdaActScope = "lv",
  activeReservePreset: ActiveReservePreset = "none",
): WaveformGateMetrics {
  return withQuietClampLogs(() => measureWaveformGateImpl(label, HR, targetVolumeMl, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset));
}

function measureWaveformGateImpl(
  label: WaveformGateLabel,
  HR: number,
  targetVolumeMl: number,
  dt: number,
  sampleHz: number,
  scope: LambdaActScope,
  tauSec: number,
  terms: LambdaActTerms,
  lowStretchLimiterMode: LowStretchLimiterMode = "none",
  lowStretchLimiterScope: LambdaActScope = "lv",
  activeReservePreset: ActiveReservePreset = "none",
): WaveformGateMetrics {
  const params = paramsWithLowStretchLimiter(
    paramsWithLambdaActTau(label === "HR100-rearm" ? DEFAULT_PARAMS : { ...DEFAULT_PARAMS, HR }, tauSec, scope, terms),
    lowStretchLimiterMode,
    lowStretchLimiterScope,
    activeReservePreset,
  );
  const core = new ModelCore(params);
  core.initializeVenousPressuresForTargetTBV(targetVolumeMl);
  if (label === "HR100-rearm") {
    core.settleToSteady(WAVEFORM_SETTLE_POLICY, dt, sampleHz, WAVEFORM_RUN_OPTIONS);
    core.setImmediateParameters({ HR });
  }
  const settle = core.settleToSteady(WAVEFORM_SETTLE_POLICY, dt, sampleHz, WAVEFORM_RUN_OPTIONS);
  const periodBeats = settle.periodBeats ?? 1;
  const metrics = core.metrics({ windowBeats: periodBeats });
  const beatSeconds = 60 / Math.max(HR, 1);
  const samples = core.runFor(beatSeconds * Math.max(2, periodBeats + 1), dt, sampleHz, {
    collectSamples: true,
    recordHistory: false,
  });
  const volumes = samples.map((sample) => sample.VLV).filter(Number.isFinite);
  const edv = Math.max(...volumes);
  const esv = Math.min(...volumes);
  const lvp = samples.map((sample) => sample.LVP).filter(Number.isFinite);
  const qao = samples.map((sample) => sample.QAo).filter(Number.isFinite);
  return {
    settled: settle.settled,
    settleReason: settle.reason,
    periodBeats,
    CO_L: metrics.CO_L,
    CO_R: metrics.CO_R,
    EDV_L: edv,
    ESV_L: esv,
    EF_L: Number.isFinite(edv) && edv > 1e-9 ? (edv - esv) / edv : Number.NaN,
    LVPMax: Math.max(...lvp),
    QAoMax: Math.max(...qao),
    maxDpdtLVP: maxDerivative(samples, "LVP"),
    clampHitCount: core.debugClampDiagnostics().totalClampHits,
    valveReverseVolumeMl: valveReverseVolumeMl(samples),
  };
}

function withQuietClampLogs<T>(fn: () => T): T {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const text = args.map((arg) => String(arg)).join(" ");
    if (/\bclamp\b/i.test(text)) return;
    originalWarn(...args);
  };
  try {
    return fn();
  } finally {
    console.warn = originalWarn;
  }
}

function maxDerivative(samples: SimSample[], key: keyof SimSample): number {
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    if (dt <= 0) continue;
    const derivative = (Number(samples[i][key]) - Number(samples[i - 1][key])) / dt;
    if (Number.isFinite(derivative)) max = Math.max(max, derivative);
  }
  return Number.isFinite(max) ? max : Number.NaN;
}

function valveReverseVolumeMl(samples: SimSample[]): number {
  return ["QMV", "QAo", "QTV", "QPV"].reduce((sum, key) => sum + integrateNegativeMagnitude(samples, key as keyof SimSample), 0);
}

function integrateNegativeMagnitude(samples: SimSample[], key: keyof SimSample): number {
  if (samples.length < 2) return 0;
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    area += 0.5 * dt * (Math.max(0, -Number(samples[i][key])) + Math.max(0, -Number(samples[i - 1][key])));
  }
  return area;
}

function maxWaveformGateFractionForScenario(scenario: MatrixScenario): number {
  return Math.max(0, ...scenario.waveformGates.map((gate) => gate.maxDeltaFraction));
}

function maxWaveformDelta(
  delta: WaveformGateComparison["delta"],
  baseline: WaveformGateMetrics,
): { metric: keyof WaveformGateComparison["delta"]; fraction: number } {
  const keys: Array<keyof WaveformGateComparison["delta"]> = [
    "CO_L",
    "CO_R",
    "EDV_L",
    "ESV_L",
    "EF_L",
    "LVPMax",
    "QAoMax",
    "maxDpdtLVP",
  ];
  return keys.reduce<{ metric: keyof WaveformGateComparison["delta"]; fraction: number }>((best, key) => {
    const baselineValue = Number(baseline[key as keyof WaveformGateMetrics]);
    const deltaValue = Number(delta[key]);
    const fraction = Number.isFinite(deltaValue) ? Math.abs(deltaValue) / Math.max(Math.abs(baselineValue), 1e-6) : 0;
    return fraction > best.fraction ? { metric: key, fraction } : best;
  }, { metric: "CO_L", fraction: 0 });
}

export function matrixReportToMarkdown(report: MatrixReport): string {
  const lines: string[] = [];
  lines.push("# Starling low-preload branch/return-map matrix");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Measurement: ${report.measurementMode}`);
  lines.push("");
  lines.push("## Scenario summary");
  lines.push("");
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | selected deltas | period-2 | max CO branch frac | max EDV branch frac | max ESV branch frac | mean CO err | mean SV err | monotonicity breaks | dip/re-rise | slope ratio | active hit frac | min active scale | target reduction | max clamp hits | max sanitize abs mL | max projection applied mL | contaminated | max one-beat EDV slope | max two-beat EDV slope | max waveform gate frac | worst waveform metric |");
  lines.push("| --- | --- | ---: | --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const scenario of report.scenarios) {
    const worstWaveform = scenario.waveformGates.reduce<{ label: string; metric: string; fraction: number }>(
      (best, gate) => gate.maxDeltaFraction > best.fraction
        ? { label: gate.label, metric: gate.maxDeltaMetric, fraction: gate.maxDeltaFraction }
        : best,
      { label: "", metric: "", fraction: 0 },
    );
    lines.push([
      scenario.lambdaActScope,
      scenario.lambdaActTerms,
      round(scenario.lambdaActTauSec, 4),
      scenario.lowStretchLimiterMode,
      scenario.lowStretchLimiterScope,
      scenario.activeReservePreset,
      round(scenario.dt, 5),
      scenario.tbvCorrectionMode,
      scenario.selectedDeltasMl.join(", "),
      scenario.returnMapSummary.period2Count,
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionCOL, 4),
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionEDVL, 4),
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionESVL, 4),
      round(scenario.shapeSummary.meanCOLErrorFractionVsBaseline, 4),
      round(scenario.shapeSummary.meanSVLErrorFractionVsBaseline, 4),
      scenario.shapeSummary.lowPreloadMonotonicityViolations,
      round(scenario.shapeSummary.dipReRiseScoreLMin, 4),
      round(scenario.shapeSummary.lowPreloadSlopeRatioVsBaseline, 4),
      round(scenario.shapeSummary.maxActiveReserveHitFraction, 4),
      round(scenario.shapeSummary.minActiveReserveScale, 4),
      round(scenario.shapeSummary.maxSigmaActTargetReductionFraction, 4),
      scenario.returnMapSummary.maxClampHitCount,
      round(scenario.returnMapSummary.maxSanitizeAbsMl, 6),
      round(scenario.returnMapSummary.maxProjectionAppliedMl, 6),
      scenario.returnMapSummary.contaminatedPointCount,
      round(scenario.returnMapSummary.maxAbsReturnMapSlopeEDVL, 4),
      round(scenario.returnMapSummary.maxAbsTwoBeatReturnMapSlopeEDVL, 4),
      round(maxWaveformGateFractionForScenario(scenario), 4),
      worstWaveform.label ? `${worstWaveform.label}:${worstWaveform.metric}` : "",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## TBV / Clamp Audit");
  lines.push("");
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | max CO branch frac | max sanitize abs mL | max projection applied mL | contaminated points |");
  lines.push("| --- | --- | ---: | --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: |");
  for (const scenario of report.scenarios) {
    lines.push([
      scenario.lambdaActScope,
      scenario.lambdaActTerms,
      round(scenario.lambdaActTauSec, 4),
      scenario.lowStretchLimiterMode,
      scenario.lowStretchLimiterScope,
      scenario.activeReservePreset,
      round(scenario.dt, 5),
      scenario.tbvCorrectionMode,
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionCOL, 4),
      round(scenario.returnMapSummary.maxSanitizeAbsMl, 6),
      round(scenario.returnMapSummary.maxProjectionAppliedMl, 6),
      scenario.returnMapSummary.contaminatedPointCount,
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Normal / HR100 waveform gates");
  lines.push("");
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | case | dCO_L | dESV_L | dEF_L | dLVPmax | dQAoMax | dMax dP/dt | dClamp hits | worst metric | worst frac |");
  lines.push("| --- | --- | ---: | --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |");
  for (const scenario of report.scenarios) {
    for (const gate of scenario.waveformGates) {
      lines.push([
        scenario.lambdaActScope,
        scenario.lambdaActTerms,
        round(scenario.lambdaActTauSec, 4),
        scenario.lowStretchLimiterMode,
        scenario.lowStretchLimiterScope,
        scenario.activeReservePreset,
        round(scenario.dt, 5),
        scenario.tbvCorrectionMode,
        gate.label,
        round(gate.delta.CO_L, 4),
        round(gate.delta.ESV_L, 4),
        round(gate.delta.EF_L, 4),
        round(gate.delta.LVPMax, 4),
        round(gate.delta.QAoMax, 4),
        round(gate.delta.maxDpdtLVP, 4),
        round(gate.delta.clampHitCount, 0),
        gate.maxDeltaMetric,
        round(gate.maxDeltaFraction, 4),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## Selected return-map points");
  lines.push("");
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | delta | return-map | branch CO frac | branch EDV frac | branch ESV frac | one-beat EDV slope | two-beat EDV slope | clamps | audit |");
  lines.push("| --- | --- | ---: | --- | --- | --- | ---: | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const scenario of report.scenarios) {
    for (const point of scenario.points.filter((p) => p.returnMap.status !== "skipped")) {
      lines.push([
        scenario.lambdaActScope,
        scenario.lambdaActTerms,
        round(scenario.lambdaActTauSec, 4),
        scenario.lowStretchLimiterMode,
        scenario.lowStretchLimiterScope,
        scenario.activeReservePreset,
        round(scenario.dt, 5),
        scenario.tbvCorrectionMode,
        point.deltaVolumeMl,
        point.returnMap.status,
        round(point.returnMap.branchAmplitudeFraction.CO_L ?? NaN, 4),
        round(point.returnMap.branchAmplitudeFraction.EDV_L ?? NaN, 4),
        round(point.returnMap.branchAmplitudeFraction.ESV_L ?? NaN, 4),
        round(point.returnMap.features.EDV_L?.centralSlope ?? NaN, 4),
        round(point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? NaN, 4),
        point.health.clampHitCount,
        point.tbvAudit.classification,
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Broad branch passes run with `return-map-mode=none`; return-map diagnostics are computed only for selected suspicious deltas.");
  lines.push("- Selection prioritizes high branch amplitude fraction, clamp activity, the lowest finite low-preload point, and the baseline `-1250 mL` representative when present.");
  lines.push("- `TBV correction=off` disables continuous projection after target retargeting; `low` keeps projection enabled with lower debug-only gain/caps.");
  lines.push("- Contaminated points have representative-beat sanitize or projection volume movement above 0.05 mL. They are reported, not removed.");
  lines.push("- `lambdaAct` remains off by default. This matrix compares scope, term, and tau values for diagnosis only.");
  lines.push("- `low-stretch limiter` remains off by default. `aInfCap` and `activeReserveCap` are conservative comparator arms that can only reduce low-stretch activation/target force.");
  lines.push("- Active reserve preset expands only the `activeReserveCap` comparator: direct presets broadly scale low-stretch active target, threshold presets act only at high activation/reserve.");
  lines.push("- Shape gates compare each candidate to the tau=0/no-limiter baseline at matching deltas. They report mean CO/SV preservation, low-preload monotonicity, dip/re-rise, low-side slope preservation, and limiter hit/reduction statistics.");
  lines.push("- Waveform gates compare normal and HR100 settled waveforms against the tau=0 baseline; they are report-only in this PR.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function matrixReportToCsv(report: MatrixReport): string {
  const columns = [
    "lambdaActScope",
    "lambdaActTerms",
    "lambdaActTauSec",
    "lowStretchLimiterMode",
    "lowStretchLimiterScope",
    "activeReservePreset",
    "dt",
    "tbvCorrectionMode",
    "deltaVolumeMl",
    "periodBeats",
    "CO_L",
    "LAPMean",
    "branchAmplitudeFractionCO_L",
    "branchAmplitudeFractionEDV_L",
    "branchAmplitudeFractionESV_L",
    "meanCOLErrorFractionVsBaseline",
    "meanSVLErrorFractionVsBaseline",
    "lowPreloadMonotonicityViolations",
    "dipReRiseScoreLMin",
    "lowPreloadSlopeRatioVsBaseline",
    "maxActiveReserveHitFraction",
    "minActiveReserveScale",
    "maxSigmaActTargetReductionFraction",
    "clampHitCount",
    "tbvAuditClass",
    "sanitizeAbsMl",
    "projectionAppliedMl",
    "returnMapSelected",
    "returnMapStatus",
    "oneBeatEDVSlope",
    "twoBeatEDVSlope",
  ];
  const rows = [columns.join(",")];
  for (const scenario of report.scenarios) {
    const selected = new Set(scenario.selectedDeltasMl.map(String));
    for (const point of scenario.points) {
      rows.push([
        scenario.lambdaActScope,
        scenario.lambdaActTerms,
        scenario.lambdaActTauSec,
        scenario.lowStretchLimiterMode,
        scenario.lowStretchLimiterScope,
        scenario.activeReservePreset,
        scenario.dt,
        scenario.tbvCorrectionMode,
        point.deltaVolumeMl,
        point.settle.periodBeats ?? 1,
        point.periodMetrics.CO_L,
        point.periodMetrics.LAPMean,
        point.returnMap.branchAmplitudeFraction.CO_L ?? "",
        point.returnMap.branchAmplitudeFraction.EDV_L ?? "",
        point.returnMap.branchAmplitudeFraction.ESV_L ?? "",
        scenario.shapeSummary.meanCOLErrorFractionVsBaseline,
        scenario.shapeSummary.meanSVLErrorFractionVsBaseline,
        scenario.shapeSummary.lowPreloadMonotonicityViolations,
        scenario.shapeSummary.dipReRiseScoreLMin,
        scenario.shapeSummary.lowPreloadSlopeRatioVsBaseline,
        scenario.shapeSummary.maxActiveReserveHitFraction,
        scenario.shapeSummary.minActiveReserveScale,
        scenario.shapeSummary.maxSigmaActTargetReductionFraction,
        point.health.clampHitCount,
        point.tbvAudit.classification,
        point.tbvAudit.sanitizeAbsMl,
        point.tbvAudit.projectionAppliedMl,
        selected.has(String(point.deltaVolumeMl)) ? "yes" : "no",
        point.returnMap.status,
        point.returnMap.features.EDV_L?.centralSlope ?? "",
        point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? "",
      ].map(csvCell).join(","));
    }
  }
  return `${rows.join("\n")}\n`;
}

export function parseLowPreloadMatrixArgs(args: string[]): MatrixOptions {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const opts: MatrixOptions = {
    outDir: path.join("artifacts", "starling-low-preload-debug", timestamp),
    targetVolumeMl: 5600,
    deltasMl: DEFAULT_DELTAS,
    dtValues: DEFAULT_DT_VALUES,
    lambdaActTauSecValues: DEFAULT_TAU_VALUES,
    lambdaActScopes: DEFAULT_SCOPES,
    lambdaActTermsValues: DEFAULT_TERMS,
    lowStretchLimiterModes: DEFAULT_LOW_STRETCH_LIMITERS,
    lowStretchLimiterScopes: DEFAULT_LOW_STRETCH_LIMITER_SCOPES,
    activeReservePresets: DEFAULT_ACTIVE_RESERVE_PRESETS,
    tbvCorrectionModes: DEFAULT_TBV_CORRECTION_MODES,
    includeAllScope: false,
    maxReturnMapPoints: 6,
    traceBeats: 10,
    sampleHz: 120,
    progress: true,
  };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--out" && value) opts.outDir = value;
    else if (key === "--target-volume" && value) opts.targetVolumeMl = Number(value);
    else if (key === "--deltas" && value) opts.deltasMl = parseNumberList(value);
    else if (key === "--dt" && value) opts.dtValues = parseNumberList(value);
    else if (key === "--lambda-act-tau" && value) opts.lambdaActTauSecValues = parseNumberList(value);
    else if (key === "--lambda-act-scope" && value) opts.lambdaActScopes = parseScopes(value);
    else if (key === "--lambda-act-terms" && value) opts.lambdaActTermsValues = parseTerms(value);
    else if (key === "--low-stretch-limiter" && value) opts.lowStretchLimiterModes = parseLowStretchLimiterModes(value);
    else if (key === "--low-stretch-limiter-scope" && value) opts.lowStretchLimiterScopes = parseScopes(value);
    else if (key === "--active-reserve-preset" && value) opts.activeReservePresets = parseActiveReservePresets(value);
    else if (key === "--tbv-correction" && value) opts.tbvCorrectionModes = parseTBVCorrectionModes(value);
    else if (key === "--include-all-scope") opts.includeAllScope = true;
    else if (key === "--branch-only") opts.maxReturnMapPoints = 0;
    else if (key === "--max-return-map-points" && value) opts.maxReturnMapPoints = Math.max(0, Math.floor(Number(value)));
    else if (key === "--trace-beats" && value) opts.traceBeats = Math.max(2, Math.floor(Number(value)));
    else if (key === "--sample-hz" && value) opts.sampleHz = Math.max(20, Math.floor(Number(value)));
    else if (key === "--quiet-progress") opts.progress = false;
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function parseTBVCorrectionModes(value: string): TBVCorrectionMode[] {
  const modes = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const mode of modes) {
    if (mode !== "on" && mode !== "off" && mode !== "low") throw new Error(`Invalid TBV correction mode: ${mode}`);
  }
  return modes as TBVCorrectionMode[];
}

function parseTerms(value: string): LambdaActTerms[] {
  const terms = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const term of terms) {
    if (term !== "kd" && term !== "fiso" && term !== "kd+fiso") throw new Error(`Invalid lambdaAct terms: ${term}`);
  }
  return terms as LambdaActTerms[];
}

function parseLowStretchLimiterModes(value: string): LowStretchLimiterMode[] {
  const modes = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const mode of modes) {
    if (mode !== "none" && mode !== "aInfCap" && mode !== "activeReserveCap") {
      throw new Error(`Invalid low-stretch limiter mode: ${mode}`);
    }
  }
  return modes as LowStretchLimiterMode[];
}

function parseActiveReservePresets(value: string): ActiveReservePreset[] {
  const presets = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const preset of presets) {
    if (
      preset !== "none"
      && preset !== "directMild"
      && preset !== "directMedium"
      && preset !== "thresholdMild"
      && preset !== "thresholdMedium"
    ) {
      throw new Error(`Invalid active reserve preset: ${preset}`);
    }
  }
  return presets as ActiveReservePreset[];
}

function parseScopes(value: string): LambdaActScope[] {
  const scopes = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const scope of scopes) {
    if (scope !== "lv" && scope !== "ventricles" && scope !== "all") throw new Error(`Invalid lambdaAct scope: ${scope}`);
  }
  return scopes as LambdaActScope[];
}

function parseNumberList(value: string): number[] {
  return value.split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
}

function meanNumbers(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((acc, value) => acc + value, 0) / finite.length;
}

function fractionalAbsDelta(value: number, baseline: number, floor: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(baseline)) return Number.NaN;
  return Math.abs(value - baseline) / Math.max(Math.abs(baseline), floor);
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function finiteMin(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.min(...finite) : Number.NaN;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function csvCell(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run verify:starling-low-preload-matrix -- [--out=DIR]",
    "       [--deltas=0,-900,-1250] [--dt=0.001,0.0005] [--lambda-act-tau=0,0.15]",
    "       [--lambda-act-scope=lv,ventricles] [--lambda-act-terms=kd,fiso,kd+fiso]",
    "       [--low-stretch-limiter=none,aInfCap,activeReserveCap] [--low-stretch-limiter-scope=lv,ventricles]",
    "       [--active-reserve-preset=directMild,directMedium,thresholdMild,thresholdMedium]",
    "       [--tbv-correction=on,off,low]",
    "       [--include-all-scope] [--branch-only] [--max-return-map-points=6]",
    "       [--quiet-progress]",
    "",
    "Example:",
    "  npm run verify:starling-low-preload-matrix -- --deltas=0,-1250,-1400 --dt=0.001 --lambda-act-tau=0,0.15 --lambda-act-scope=lv --lambda-act-terms=kd,fiso,kd+fiso --low-stretch-limiter=none,aInfCap,activeReserveCap --active-reserve-preset=directMild,directMedium --tbv-correction=on,off --max-return-map-points=2",
  ].join("\n"));
}

function main(): void {
  const options = parseLowPreloadMatrixArgs(process.argv.slice(2));
  mkdirSync(options.outDir, { recursive: true });
  const report = runLowPreloadMatrix({
    ...options,
    partialWrite: (partial) => writeMatrixReport(options.outDir, partial, "partial-"),
  });
  writeMatrixReport(options.outDir, report);

  // eslint-disable-next-line no-console
  console.log(`Wrote Starling low-preload matrix report to ${options.outDir}`);
  // eslint-disable-next-line no-console
  console.log(
    `scenarios=${report.summary.scenarioCount} selectedReturnMapPoints=${report.summary.selectedReturnMapPointCount} ` +
    `maxBranchCOFrac=${round(report.summary.maxBranchAmplitudeFractionCOL, 4)}`,
  );
}

function writeMatrixReport(outDir: string, report: MatrixReport, prefix = ""): void {
  writeFileSync(path.join(outDir, `${prefix}matrix-report.json`), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(path.join(outDir, `${prefix}matrix-report.md`), matrixReportToMarkdown(report));
  writeFileSync(path.join(outDir, `${prefix}branch-table.csv`), matrixReportToCsv(report));
}

if (process.env.STARLING_LOW_PRELOAD_MATRIX_MAIN === "1") main();
