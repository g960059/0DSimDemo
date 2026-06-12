import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore, type AorticFlowClampMode } from "@/engine/ModelCore";
import type { LambdaActTerms, LowStretchLimiterMode } from "@/engine/chambers";
import { DYNAMIC_FLOW_CLAMP_ML_PER_S } from "@/engine/core/topology";
import type { CoreRuntimeParams, HeartModelMode, SimSample } from "@/engine/protocol";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import {
  paramsWithLambdaActTau,
  paramsWithAorticValveComparator,
  paramsWithLowStretchLimiter,
  DEFAULT_AOV_AMAX,
  DEFAULT_AOV_AREF,
  DEFAULT_AOV_B,
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
  heartModels: HeartModelMode[];
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  lambdaActScopes: LambdaActScope[];
  lambdaActTermsValues: LambdaActTerms[];
  lowStretchLimiterModes: LowStretchLimiterMode[];
  lowStretchLimiterScopes: LambdaActScope[];
  activeReservePresets: ActiveReservePreset[];
  tbvCorrectionModes: TBVCorrectionMode[];
  aorticFlowClampModes: AorticFlowClampMode[];
  aovBValues: number[];
  asAovAmaxValues: number[];
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
  QAoCapRatioMax: number;
  QAoNearCap95Fraction: number;
  QAoNearCap98Fraction: number;
  QAoAtCapFraction: number;
  QAoLocalCapActiveFraction: number;
  AoVMeanGradient: number;
  AoVPeakGradient: number;
  AoVFlowWeightedTotalGradient: number;
  AoVFlowWeightedOrificeGradient: number;
  AoVFlowWeightedResistiveGradient: number;
  AoVFlowWeightedBernoulliGradient: number;
  AoVFlowWeightedInertialGradient: number;
  AoVFlowWeightedResidualGradient: number;
  AoVPeakOrificeGradient: number;
  AoVPeakInertialGradient: number;
  AoVPeakResidualGradient: number;
  QAoPeakMeanRatio: number;
  ejectionDurationMs: number;
  maxDpdtLVP: number;
  clampHitCount: number;
  valveReverseVolumeMl: number;
};
type WaveformGateComparison = {
  label: WaveformGateLabel;
  HR: number;
  baseline: WaveformGateMetrics;
  candidate: WaveformGateMetrics;
  delta: Pick<WaveformGateMetrics,
    "CO_L"
    | "CO_R"
    | "EDV_L"
    | "ESV_L"
    | "EF_L"
    | "LVPMax"
    | "QAoMax"
    | "AoVMeanGradient"
    | "AoVPeakGradient"
    | "AoVFlowWeightedTotalGradient"
    | "AoVFlowWeightedOrificeGradient"
    | "AoVFlowWeightedBernoulliGradient"
    | "AoVFlowWeightedInertialGradient"
    | "QAoPeakMeanRatio"
    | "ejectionDurationMs"
    | "maxDpdtLVP"
    | "clampHitCount"
    | "valveReverseVolumeMl"
  >;
  maxDeltaMetric: keyof WaveformGateComparison["delta"];
  maxDeltaFraction: number;
};

type MatrixScenario = {
  heartModel: HeartModelMode;
  dt: number;
  lambdaActTauSec: number;
  lambdaActScope: LambdaActScope;
  lambdaActTerms: LambdaActTerms;
  lowStretchLimiterMode: LowStretchLimiterMode;
  lowStretchLimiterScope: LambdaActScope;
  activeReservePreset: ActiveReservePreset;
  tbvCorrectionMode: TBVCorrectionMode;
  aorticFlowClampMode: AorticFlowClampMode;
  aovB: number;
  aovAmax: number;
  aovAref: number;
  selectedDeltasMl: number[];
  evaluation: ScenarioEvaluation;
  shapeSummary: ShapeSummary;
  branchSummary: DebugReport["summary"];
  returnMapSummary: DebugReport["summary"];
  waveformGates: WaveformGateComparison[];
  perDeltaEvaluation: PerDeltaEvaluation[];
  points: DebugPoint[];
};

type ScenarioClassification = "baseline" | "fail" | "mitigator" | "root-fix-candidate";
type BranchEnvelopeClass = "good" | "mitigated" | "residual" | "poor";
type CleanSlopeCoverageClass = "worst-covered" | "partial" | "none";
type ReturnMapEvidenceLevel =
  | "none"
  | "scalar-edv-clean"
  | "worst-delta-scalar-edv-clean"
  | "full-jacobian-confirmed";

type ScenarioEvaluation = {
  classification: ScenarioClassification;
  branchEnvelopeClass: BranchEnvelopeClass;
  branchLocalizationClass: BranchLocalizationClass;
  reasons: string[];
  worstDeltaVolumeMl: number | null;
  worstLAPMean: number | null;
  maxPerDeltaBranchFractionCOL: number;
  maxPerDeltaBranchFractionEDVL: number;
  maxPerDeltaBranchFractionESVL: number;
  maxCleanAbsOneBeatEDVSlope: number | null;
  maxCleanAbsTwoBeatEDVSlope: number | null;
  maxCleanAbsOneBeatESVSlope: number | null;
  maxCleanAbsTwoBeatESVSlope: number | null;
  maxCleanAbsOneBeatVolumeFeatureSlope: number | null;
  maxCleanAbsTwoBeatVolumeFeatureSlope: number | null;
  cleanReturnMapPointCount: number;
  worstDeltaCleanSlopeCovered: boolean;
  uncoveredWorstDeltaReason?: string;
  cleanSlopeCoverageClass: CleanSlopeCoverageClass;
  cleanSlopeCoveredDeltasMl: number[];
  cleanSlopeMissingDeltasMl: number[];
  returnMapEvidenceLevel: ReturnMapEvidenceLevel;
  requiresFullJacobianConfirmation: boolean;
};

type PerDeltaEvaluation = {
  deltaVolumeMl: number;
  LAPMean: number;
  CO_L: number;
  lastBeatCO_L: number;
  periodBeats: number;
  branchEnvelopeClass: BranchEnvelopeClass;
  branchLocalizationClass: BranchLocalizationClass;
  branchAmplitudeFractionCOL: number;
  branchAmplitudeFractionEDVL: number;
  branchAmplitudeFractionESVL: number;
  activeReserveHitFraction: number;
  activeReserveMinScale: number;
  sigmaActTargetReductionFraction: number;
  returnMapStatus: string;
  cleanForReturnMapSlope: boolean;
  oneBeatEDVSlope: number | null;
  twoBeatEDVSlope: number | null;
  oneBeatESVSlope: number | null;
  twoBeatESVSlope: number | null;
  maxAbsOneBeatVolumeFeatureSlope: number | null;
  maxAbsTwoBeatVolumeFeatureSlope: number | null;
  MV_E_forward_mL: number | null;
  MV_A_forward_mL: number | null;
  MV_A_fraction: number | null;
  MV_A_peak: number | null;
  MV_E_peak: number | null;
  LA_A_loop_area: number | null;
  LA_A_loop_fraction: number | null;
  atrialSystoleTransmitralGradientMean: number | null;
  atrialSystoleTransmitralGradientMax: number | null;
  atrialSystoleMVOpenFraction: number | null;
  MV_mid_forward_mL: number | null;
  MV_mid_peak: number | null;
  MV_forward_peak_count: number | null;
  MV_mid_forward_peak_count: number | null;
  QMV_near_zero_return_count: number | null;
  MV_open_close_reopen_count: number | null;
  MV_interwave_xi_min: number | null;
  MV_interwave_open01_min: number | null;
  LAP_LVP_zero_crossing_count: number | null;
  fillingMorphologyClass: FillingMorphologyClass | null;
  fillingBranch: FillingBranchSummary | null;
  nonsmooth: boolean;
  clampCrossing: boolean;
  tbvAuditClass: string;
};

type FillingMorphologyClass = "E-only" | "E+A" | "E+mid+A" | "weak-A" | "indeterminate";

type FillingBranchSummary = {
  MV_A_forward_abs: number;
  MV_A_forward_fraction: number;
  MV_mid_forward_abs: number;
  MV_mid_forward_fraction: number;
  LA_A_loop_area_abs: number;
  LA_A_loop_area_fraction: number;
  atrialSystoleMVOpenFraction_abs: number;
  nearZeroReturnCountA: number;
  nearZeroReturnCountB: number;
  nearZeroReturnAlternates: boolean;
  reopenCountA: number;
  reopenCountB: number;
  reopenCountAlternates: boolean;
  pressureCrossingCountA: number;
  pressureCrossingCountB: number;
  pressureCrossingAlternates: boolean;
  interwaveXiMinAbs: number;
  interwaveOpen01MinAbs: number;
  forwardPeakCountA: number;
  forwardPeakCountB: number;
  peakCountAlternates: boolean;
  morphologyClassA: FillingMorphologyClass;
  morphologyClassB: FillingMorphologyClass;
  morphologyAlternates: boolean;
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
  schemaVersion: 15;
  generatedAt: string;
  measurementMode: string;
  targetVolumeMl: number;
  heartModels: HeartModelMode[];
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  lambdaActScopes: LambdaActScope[];
  lambdaActTermsValues: LambdaActTerms[];
  lowStretchLimiterModes: LowStretchLimiterMode[];
  lowStretchLimiterScopes: LambdaActScope[];
  activeReservePresets: ActiveReservePreset[];
  tbvCorrectionModes: TBVCorrectionMode[];
  aorticFlowClampModes: AorticFlowClampMode[];
  aovBValues: number[];
  asAovAmaxValues: number[];
  maxReturnMapPoints: number;
  traceBeats: number;
  sampleHz: number;
  scenarios: MatrixScenario[];
  summary: {
    scenarioCount: number;
    maxBranchAmplitudeFractionCOL: number;
    maxBranchAmplitudeFractionEDVL: number;
    maxBranchAmplitudeFractionESVL: number;
    maxBranchAmplitudeFractionQAoMax: number;
    maxBranchAmplitudeFractionAoPMax: number;
    maxQAoCapRatioMax: number;
    maxQAoNearCap90Fraction: number;
    maxQAoNearCap95Fraction: number;
    maxQAoNearCap98Fraction: number;
    maxQAoAtCapFraction: number;
    maxQAoLocalCapActiveFraction: number;
    maxAoVMeanGradient: number;
    maxAoVPeakGradient: number;
    maxAoVFlowWeightedTotalGradient: number;
    maxAoVFlowWeightedOrificeGradient: number;
    maxAoVFlowWeightedBernoulliGradient: number;
    maxAoVFlowWeightedInertialGradient: number;
    maxQAoPeakMeanRatio: number;
    minEjectionDurationMs: number;
    maxCleanAbsOneBeatESVSlope: number | null;
    maxCleanAbsTwoBeatESVSlope: number | null;
    maxCleanAbsOneBeatVolumeFeatureSlope: number | null;
    maxCleanAbsTwoBeatVolumeFeatureSlope: number | null;
    branchLocalizationCounts: Record<BranchLocalizationClass, number>;
    minMVAForwardMl: number;
    minMVAFraction: number;
    minLAAloopArea: number;
    minLAAloopFraction: number;
    maxAtrialSystoleTransmitralGradientMean: number;
    maxAtrialSystoleTransmitralGradientMax: number;
    minAtrialSystoleMVOpenFraction: number;
    maxFillingBranchMVAFraction: number;
    maxFillingBranchMidFraction: number;
    maxFillingBranchLAAloopFraction: number;
    nearZeroReturnAlternationCount: number;
    reopenCountAlternationCount: number;
    pressureCrossingAlternationCount: number;
    maxInterwaveXiMinAbs: number;
    maxInterwaveOpen01MinAbs: number;
    fillingMorphologyAlternationCount: number;
    peakCountAlternationCount: number;
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
    classificationCounts: Record<ScenarioClassification, number>;
  };
};

type BranchLocalizationClass = "edv-dominant" | "esv/ejection-dominant" | "mixed";

const DEFAULT_DELTAS = [0, -900, -1000, -1100, -1200, -1250, -1300, -1400, -1500, -1600];
const DEFAULT_DT_VALUES = [0.001, 0.0005];
const DEFAULT_HEART_MODELS: HeartModelMode[] = ["activeStress"];
const DEFAULT_TAU_VALUES = [0, 0.05, 0.1, 0.15, 0.2, 0.4];
const DEFAULT_SCOPES: LambdaActScope[] = ["lv", "ventricles"];
const DEFAULT_TERMS: LambdaActTerms[] = ["kd", "fiso", "kd+fiso"];
const DEFAULT_LOW_STRETCH_LIMITERS: LowStretchLimiterMode[] = ["none"];
const DEFAULT_LOW_STRETCH_LIMITER_SCOPES: LambdaActScope[] = ["lv"];
const DEFAULT_ACTIVE_RESERVE_PRESETS: ActiveReservePreset[] = ["directMild", "directMedium", "thresholdMild", "thresholdMedium"];
const DEFAULT_TBV_CORRECTION_MODES: TBVCorrectionMode[] = ["on"];
const DEFAULT_AORTIC_FLOW_CLAMP_MODES: AorticFlowClampMode[] = ["hard"];
const DEFAULT_AOV_B_VALUES = [DEFAULT_AOV_B];
const DEFAULT_AS_AOV_AMAX_VALUES = [DEFAULT_AOV_AMAX];
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
    const { heartModel, lambdaActScope, lambdaActTauSec, lambdaActTerms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, tbvCorrectionMode, aorticFlowClampMode, aovB, aovAmax, dt } = spec;
    if (opts.progress) {
      // eslint-disable-next-line no-console
      console.log(
        `[matrix] ${index + 1}/${specs.length} heart=${heartModel} dt=${dt} tau=${lambdaActTauSec} scope=${lambdaActScope} terms=${lambdaActTerms} limiter=${lowStretchLimiterMode}/${lowStretchLimiterScope} preset=${activeReservePreset} tbv=${tbvCorrectionMode} aovClamp=${aorticFlowClampMode} AoV_B=${aovB} AoV_Amax=${aovAmax}`,
      );
    }
    const branchReport = runLowPreloadDebug({
      outDir: "unused",
      targetVolumeMl: opts.targetVolumeMl,
      heartModel,
      deltasMl: opts.deltasMl,
      dtValues: [dt],
      lambdaActTauSecValues: [lambdaActTauSec],
      lambdaActScope,
      lambdaActTerms,
      lowStretchLimiterMode,
      lowStretchLimiterScope,
      activeReservePreset,
      tbvCorrectionMode,
      aorticFlowClampMode,
      aovB,
      aovAmax,
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
        heartModel,
        deltasMl: opts.deltasMl,
        dtValues: [dt],
        lambdaActTauSecValues: [lambdaActTauSec],
        lambdaActScope,
        lambdaActTerms,
        lowStretchLimiterMode,
        lowStretchLimiterScope,
        activeReservePreset,
        tbvCorrectionMode,
        aorticFlowClampMode,
        aovB,
        aovAmax,
        traceBeats: opts.traceBeats,
        sampleHz: opts.sampleHz,
        returnMapMode: "both",
        returnMapDeltasMl: selectedDeltasMl,
        quietClampLog: true,
      });
    const baselineKey = branchBaselineKey(heartModel, dt, tbvCorrectionMode);
    if (isDefaultAorticValveComparator(aovB, aovAmax)
      && lambdaActTauSec === 0
      && lowStretchLimiterMode === "none"
      && aorticFlowClampMode === "hard") {
      branchBaselineCache.set(baselineKey, branchReport.points);
    }
    const baselinePoints = branchBaselineCache.get(baselineKey) ?? branchReport.points;
    const perDeltaEvaluation = buildPerDeltaEvaluation(returnMapReport.points);
    const waveformGates = buildWaveformGateComparisons(
      opts.targetVolumeMl,
      heartModel,
      dt,
      opts.sampleHz,
      lambdaActScope,
      lambdaActTauSec,
      lambdaActTerms,
      lowStretchLimiterMode,
      lowStretchLimiterScope,
      activeReservePreset,
      aorticFlowClampMode,
      aovB,
      aovAmax,
      waveformBaselineCache,
    );
    const shapeSummary = buildShapeSummary(branchReport.points, baselinePoints);
const evaluation = buildScenarioEvaluation({
      lowStretchLimiterMode,
      lambdaActTauSec,
      aorticFlowClampMode,
      aovB,
      aovAmax,
      returnMapSummary: returnMapReport.summary,
      shapeSummary,
      waveformGates,
      perDeltaEvaluation,
    });
    scenarios.push({
      heartModel,
      dt,
      lambdaActTauSec,
      lambdaActScope,
      lambdaActTerms,
      lowStretchLimiterMode,
      lowStretchLimiterScope,
      activeReservePreset,
      tbvCorrectionMode,
      aorticFlowClampMode,
      aovB,
      aovAmax,
      aovAref: DEFAULT_AOV_AREF,
      selectedDeltasMl,
      evaluation,
      shapeSummary,
      branchSummary: branchReport.summary,
      returnMapSummary: returnMapReport.summary,
      waveformGates,
      perDeltaEvaluation,
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
    schemaVersion: 15,
    generatedAt: new Date().toISOString(),
    measurementMode: "branch-only broad low-preload matrix followed by selected EDV-section return-map diagnostics with EDV/ESV/CO/afterload/ejection features; QAo cap proximity, localized AoV soft-cap comparator axes, and off-by-default AoV_B/AoV_Amax physical-loss comparator axes with decomposed resistive/Bernoulli/inertial AoV gradient reporting; LA/MV filling-regime and MV event-count morphology diagnostics with last-two-beat filling branch amplitudes and primary event-count alternation; optional TBV correction on/off/low contamination axis; activeStress/elastance heart-model comparison axis; off-by-default low-stretch limiter and AoV soft-flow-clamp comparator axes",
    targetVolumeMl: opts.targetVolumeMl,
    heartModels: opts.heartModels,
    deltasMl: opts.deltasMl,
    dtValues: opts.dtValues,
    lambdaActTauSecValues: opts.lambdaActTauSecValues,
    lambdaActScopes: scopes,
    lambdaActTermsValues: opts.lambdaActTermsValues,
    lowStretchLimiterModes: Array.from(new Set(["none" as LowStretchLimiterMode, ...opts.lowStretchLimiterModes])),
    lowStretchLimiterScopes: opts.lowStretchLimiterScopes,
    activeReservePresets: opts.activeReservePresets,
    tbvCorrectionModes: opts.tbvCorrectionModes,
    aorticFlowClampModes: opts.aorticFlowClampModes,
    aovBValues: opts.aovBValues,
    asAovAmaxValues: opts.asAovAmaxValues,
    maxReturnMapPoints: opts.maxReturnMapPoints,
    traceBeats: opts.traceBeats,
    sampleHz: opts.sampleHz,
    scenarios,
    summary: {
      scenarioCount: scenarios.length,
      maxBranchAmplitudeFractionCOL: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionCOL)),
      maxBranchAmplitudeFractionEDVL: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionEDVL)),
      maxBranchAmplitudeFractionESVL: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionESVL)),
      maxBranchAmplitudeFractionQAoMax: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionQAoMax)),
      maxBranchAmplitudeFractionAoPMax: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxBranchAmplitudeFractionAoPMax)),
      maxQAoCapRatioMax: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxQAoCapRatioMax)),
      maxQAoNearCap90Fraction: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxQAoNearCap90Fraction)),
      maxQAoNearCap95Fraction: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxQAoNearCap95Fraction)),
      maxQAoNearCap98Fraction: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxQAoNearCap98Fraction)),
      maxQAoAtCapFraction: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxQAoAtCapFraction)),
      maxQAoLocalCapActiveFraction: Math.max(0, ...scenarios.map((s) => s.returnMapSummary.maxQAoLocalCapActiveFraction)),
      maxAoVMeanGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVMeanGradient)))),
      maxAoVPeakGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVPeakGradient)))),
      maxAoVFlowWeightedTotalGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVFlowWeightedTotalGradient)))),
      maxAoVFlowWeightedOrificeGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVFlowWeightedOrificeGradient)))),
      maxAoVFlowWeightedBernoulliGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVFlowWeightedBernoulliGradient)))),
      maxAoVFlowWeightedInertialGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVFlowWeightedInertialGradient)))),
      maxQAoPeakMeanRatio: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.QAoPeakMeanRatio)))),
      minEjectionDurationMs: finiteMin(scenarios.flatMap((s) => s.waveformGates.map((gate) => gate.candidate.ejectionDurationMs))),
      maxCleanAbsOneBeatESVSlope: finiteMaxOrNull(scenarios.map((s) => s.evaluation.maxCleanAbsOneBeatESVSlope ?? Number.NaN)),
      maxCleanAbsTwoBeatESVSlope: finiteMaxOrNull(scenarios.map((s) => s.evaluation.maxCleanAbsTwoBeatESVSlope ?? Number.NaN)),
      maxCleanAbsOneBeatVolumeFeatureSlope: finiteMaxOrNull(scenarios.map((s) => s.evaluation.maxCleanAbsOneBeatVolumeFeatureSlope ?? Number.NaN)),
      maxCleanAbsTwoBeatVolumeFeatureSlope: finiteMaxOrNull(scenarios.map((s) => s.evaluation.maxCleanAbsTwoBeatVolumeFeatureSlope ?? Number.NaN)),
      branchLocalizationCounts: branchLocalizationCounts(scenarios),
      minMVAForwardMl: finiteMin(scenarios.map((s) => s.returnMapSummary.minMVAForwardMl)),
      minMVAFraction: finiteMin(scenarios.map((s) => s.returnMapSummary.minMVAFraction)),
      minLAAloopArea: finiteMin(scenarios.map((s) => s.returnMapSummary.minLAAloopArea)),
      minLAAloopFraction: finiteMin(scenarios.map((s) => s.returnMapSummary.minLAAloopFraction)),
      maxAtrialSystoleTransmitralGradientMean: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.returnMapSummary.maxAtrialSystoleTransmitralGradientMean))),
      maxAtrialSystoleTransmitralGradientMax: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.returnMapSummary.maxAtrialSystoleTransmitralGradientMax))),
      minAtrialSystoleMVOpenFraction: finiteMin(scenarios.map((s) => s.returnMapSummary.minAtrialSystoleMVOpenFraction)),
      maxFillingBranchMVAFraction: Math.max(0, ...scenarios.flatMap((s) => s.perDeltaEvaluation.map((point) => point.fillingBranch?.MV_A_forward_fraction ?? 0))),
      maxFillingBranchMidFraction: Math.max(0, ...scenarios.flatMap((s) => s.perDeltaEvaluation.map((point) => point.fillingBranch?.MV_mid_forward_fraction ?? 0))),
      maxFillingBranchLAAloopFraction: Math.max(0, ...scenarios.flatMap((s) => s.perDeltaEvaluation.map((point) => point.fillingBranch?.LA_A_loop_area_fraction ?? 0))),
      nearZeroReturnAlternationCount: scenarios.reduce((sum, s) => sum + s.perDeltaEvaluation.filter((point) => point.fillingBranch?.nearZeroReturnAlternates).length, 0),
      reopenCountAlternationCount: scenarios.reduce((sum, s) => sum + s.perDeltaEvaluation.filter((point) => point.fillingBranch?.reopenCountAlternates).length, 0),
      pressureCrossingAlternationCount: scenarios.reduce((sum, s) => sum + s.perDeltaEvaluation.filter((point) => point.fillingBranch?.pressureCrossingAlternates).length, 0),
      maxInterwaveXiMinAbs: Math.max(0, ...scenarios.flatMap((s) => s.perDeltaEvaluation.map((point) => point.fillingBranch?.interwaveXiMinAbs ?? 0))),
      maxInterwaveOpen01MinAbs: Math.max(0, ...scenarios.flatMap((s) => s.perDeltaEvaluation.map((point) => point.fillingBranch?.interwaveOpen01MinAbs ?? 0))),
      fillingMorphologyAlternationCount: scenarios.reduce((sum, s) => sum + s.perDeltaEvaluation.filter((point) => point.fillingBranch?.morphologyAlternates).length, 0),
      peakCountAlternationCount: scenarios.reduce((sum, s) => sum + s.perDeltaEvaluation.filter((point) => point.fillingBranch?.peakCountAlternates).length, 0),
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
      classificationCounts: classificationCounts(scenarios),
    },
  };
}

function matrixScenarioSpecs(
  opts: MatrixOptions,
  scopes: LambdaActScope[],
): Array<{
  heartModel: HeartModelMode;
  dt: number;
  lambdaActTauSec: number;
  lambdaActScope: LambdaActScope;
  lambdaActTerms: LambdaActTerms;
  lowStretchLimiterMode: LowStretchLimiterMode;
  lowStretchLimiterScope: LambdaActScope;
  activeReservePreset: ActiveReservePreset;
  tbvCorrectionMode: TBVCorrectionMode;
  aorticFlowClampMode: AorticFlowClampMode;
  aovB: number;
  aovAmax: number;
}> {
  const specs: Array<{
    heartModel: HeartModelMode;
    dt: number;
    lambdaActTauSec: number;
    lambdaActScope: LambdaActScope;
    lambdaActTerms: LambdaActTerms;
    lowStretchLimiterMode: LowStretchLimiterMode;
    lowStretchLimiterScope: LambdaActScope;
    activeReservePreset: ActiveReservePreset;
    tbvCorrectionMode: TBVCorrectionMode;
    aorticFlowClampMode: AorticFlowClampMode;
    aovB: number;
    aovAmax: number;
  }> = [];
  for (const heartModel of opts.heartModels) {
    for (const dt of opts.dtValues) {
      for (const tbvCorrectionMode of opts.tbvCorrectionModes) {
        for (const aorticFlowClampMode of opts.aorticFlowClampModes) {
          for (const aovB of opts.aovBValues) {
            for (const aovAmax of opts.asAovAmaxValues) {
              specs.push({
                heartModel,
                dt,
                lambdaActTauSec: 0,
                lambdaActScope: "all",
                lambdaActTerms: "kd+fiso",
                lowStretchLimiterMode: "none",
                lowStretchLimiterScope: "lv",
                activeReservePreset: "none",
                tbvCorrectionMode,
                aorticFlowClampMode,
                aovB,
                aovAmax,
              });
              for (const lowStretchLimiterMode of opts.lowStretchLimiterModes.filter((mode) => mode !== "none")) {
                for (const lowStretchLimiterScope of opts.lowStretchLimiterScopes) {
                  const presets = lowStretchLimiterMode === "activeReserveCap" ? opts.activeReservePresets : ["none" as ActiveReservePreset];
                  for (const activeReservePreset of presets) {
                    specs.push({
                      heartModel,
                      dt,
                      lambdaActTauSec: 0,
                      lambdaActScope: "all",
                      lambdaActTerms: "kd+fiso",
                      lowStretchLimiterMode,
                      lowStretchLimiterScope,
                      activeReservePreset,
                      tbvCorrectionMode,
                      aorticFlowClampMode,
                      aovB,
                      aovAmax,
                    });
                  }
                }
              }
              for (const lambdaActTauSec of opts.lambdaActTauSecValues.filter((tau) => tau > 0)) {
                for (const lambdaActScope of scopes) {
                  for (const lambdaActTerms of opts.lambdaActTermsValues) {
                    specs.push({
                      heartModel,
                      dt,
                      lambdaActTauSec,
                      lambdaActScope,
                      lambdaActTerms,
                      lowStretchLimiterMode: "none",
                      lowStretchLimiterScope: "lv",
                      activeReservePreset: "none",
                      tbvCorrectionMode,
                      aorticFlowClampMode,
                      aovB,
                      aovAmax,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return specs;
}

function branchBaselineKey(heartModel: HeartModelMode, dt: number, tbvCorrectionMode: TBVCorrectionMode): string {
  return `${heartModel}|${dt}|${tbvCorrectionMode}`;
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

function buildPerDeltaEvaluation(points: DebugPoint[]): PerDeltaEvaluation[] {
  return points.map((point) => {
    const active = activeReserveStats([point]);
    const coBranch = finiteOrZero(point.returnMap.branchAmplitudeFraction.CO_L ?? NaN);
    const edvBranch = finiteOrZero(point.returnMap.branchAmplitudeFraction.EDV_L ?? NaN);
    const esvBranch = finiteOrZero(point.returnMap.branchAmplitudeFraction.ESV_L ?? NaN);
    const oneBeatSlope = finiteOrNull(point.returnMap.features.EDV_L?.centralSlope ?? NaN);
    const twoBeatSlope = finiteOrNull(point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? NaN);
    const oneBeatESVSlope = finiteOrNull(point.returnMap.features.ESV_L?.centralSlope ?? NaN);
    const twoBeatESVSlope = finiteOrNull(point.returnMap.twoBeatSamePhase?.features.ESV_L?.centralSlope ?? NaN);
    const filling = point.beatTrace.at(-1)?.filling;
    const fillingBranch = lastTwoBeatFillingBranch(point);
    return {
      deltaVolumeMl: point.deltaVolumeMl,
      LAPMean: point.periodMetrics.LAPMean,
      CO_L: point.periodMetrics.CO_L,
      lastBeatCO_L: point.lastBeatMetrics.CO_L,
      periodBeats: point.settle.periodBeats ?? 1,
      branchEnvelopeClass: branchEnvelopeClass(coBranch, edvBranch, esvBranch),
      branchLocalizationClass: branchLocalizationClass(coBranch, edvBranch, esvBranch),
      branchAmplitudeFractionCOL: coBranch,
      branchAmplitudeFractionEDVL: edvBranch,
      branchAmplitudeFractionESVL: esvBranch,
      activeReserveHitFraction: active.maxHitFraction,
      activeReserveMinScale: active.minScale,
      sigmaActTargetReductionFraction: active.maxReductionFraction,
      returnMapStatus: point.returnMap.status,
      cleanForReturnMapSlope: isCleanReturnMapPoint(point),
      oneBeatEDVSlope: oneBeatSlope,
      twoBeatEDVSlope: twoBeatSlope,
      oneBeatESVSlope,
      twoBeatESVSlope,
      maxAbsOneBeatVolumeFeatureSlope: finiteMaxOrNull([
        Math.abs(oneBeatSlope ?? Number.NaN),
        Math.abs(oneBeatESVSlope ?? Number.NaN),
      ]),
      maxAbsTwoBeatVolumeFeatureSlope: finiteMaxOrNull([
        Math.abs(twoBeatSlope ?? Number.NaN),
        Math.abs(twoBeatESVSlope ?? Number.NaN),
      ]),
      MV_E_forward_mL: finiteOrNull(filling?.MV_E_forward_mL ?? Number.NaN),
      MV_A_forward_mL: finiteOrNull(filling?.MV_A_forward_mL ?? Number.NaN),
      MV_A_fraction: finiteOrNull(filling?.MV_A_fraction ?? Number.NaN),
      MV_A_peak: finiteOrNull(filling?.MV_A_peak ?? Number.NaN),
      MV_E_peak: finiteOrNull(filling?.MV_E_peak ?? Number.NaN),
      LA_A_loop_area: finiteOrNull(filling?.LA_A_loop_area ?? Number.NaN),
      LA_A_loop_fraction: finiteOrNull(filling?.LA_A_loop_fraction ?? Number.NaN),
      atrialSystoleTransmitralGradientMean: finiteOrNull(filling?.atrialSystoleTransmitralGradientMean ?? Number.NaN),
      atrialSystoleTransmitralGradientMax: finiteOrNull(filling?.atrialSystoleTransmitralGradientMax ?? Number.NaN),
      atrialSystoleMVOpenFraction: finiteOrNull(filling?.atrialSystoleMVOpenFraction ?? Number.NaN),
      MV_mid_forward_mL: finiteOrNull(filling?.MV_mid_forward_mL ?? Number.NaN),
      MV_mid_peak: finiteOrNull(filling?.MV_mid_peak ?? Number.NaN),
      MV_forward_peak_count: finiteOrNull(filling?.MV_forward_peak_count ?? Number.NaN),
      MV_mid_forward_peak_count: finiteOrNull(filling?.MV_mid_forward_peak_count ?? Number.NaN),
      QMV_near_zero_return_count: finiteOrNull(filling?.QMV_near_zero_return_count ?? Number.NaN),
      MV_open_close_reopen_count: finiteOrNull(filling?.MV_open_close_reopen_count ?? Number.NaN),
      MV_interwave_xi_min: finiteOrNull(filling?.MV_interwave_xi_min ?? Number.NaN),
      MV_interwave_open01_min: finiteOrNull(filling?.MV_interwave_open01_min ?? Number.NaN),
      LAP_LVP_zero_crossing_count: finiteOrNull(filling?.LAP_LVP_zero_crossing_count ?? Number.NaN),
      fillingMorphologyClass: filling?.fillingMorphologyClass ?? null,
      fillingBranch,
      nonsmooth: point.returnMap.nonsmooth,
      clampCrossing: point.returnMap.clampCrossing,
      tbvAuditClass: point.tbvAudit.classification,
    };
  });
}

function lastTwoBeatFillingBranch(point: DebugPoint): FillingBranchSummary | null {
  const beats = point.beatTrace.slice(-2);
  if (beats.length < 2) return null;
  const a = beats[0].filling;
  const b = beats[1].filling;
  return {
    MV_A_forward_abs: Math.abs(b.MV_A_forward_mL - a.MV_A_forward_mL),
    MV_A_forward_fraction: fractionalAbsDelta(b.MV_A_forward_mL, a.MV_A_forward_mL, 1),
    MV_mid_forward_abs: Math.abs(b.MV_mid_forward_mL - a.MV_mid_forward_mL),
    MV_mid_forward_fraction: fractionalAbsDelta(b.MV_mid_forward_mL, a.MV_mid_forward_mL, 1),
    LA_A_loop_area_abs: Math.abs(b.LA_A_loop_area - a.LA_A_loop_area),
    LA_A_loop_area_fraction: fractionalAbsDelta(b.LA_A_loop_area, a.LA_A_loop_area, 1),
    atrialSystoleMVOpenFraction_abs: Math.abs(b.atrialSystoleMVOpenFraction - a.atrialSystoleMVOpenFraction),
    nearZeroReturnCountA: a.QMV_near_zero_return_count,
    nearZeroReturnCountB: b.QMV_near_zero_return_count,
    nearZeroReturnAlternates: a.QMV_near_zero_return_count !== b.QMV_near_zero_return_count,
    reopenCountA: a.MV_open_close_reopen_count,
    reopenCountB: b.MV_open_close_reopen_count,
    reopenCountAlternates: a.MV_open_close_reopen_count !== b.MV_open_close_reopen_count,
    pressureCrossingCountA: a.LAP_LVP_zero_crossing_count,
    pressureCrossingCountB: b.LAP_LVP_zero_crossing_count,
    pressureCrossingAlternates: a.LAP_LVP_zero_crossing_count !== b.LAP_LVP_zero_crossing_count,
    interwaveXiMinAbs: Math.abs(b.MV_interwave_xi_min - a.MV_interwave_xi_min),
    interwaveOpen01MinAbs: Math.abs(b.MV_interwave_open01_min - a.MV_interwave_open01_min),
    forwardPeakCountA: a.MV_forward_peak_count,
    forwardPeakCountB: b.MV_forward_peak_count,
    peakCountAlternates: a.MV_forward_peak_count !== b.MV_forward_peak_count,
    morphologyClassA: a.fillingMorphologyClass,
    morphologyClassB: b.fillingMorphologyClass,
    morphologyAlternates: a.fillingMorphologyClass !== b.fillingMorphologyClass,
  };
}

function buildScenarioEvaluation(input: {
  lowStretchLimiterMode: LowStretchLimiterMode;
  lambdaActTauSec: number;
  aorticFlowClampMode: AorticFlowClampMode;
  aovB: number;
  aovAmax: number;
  returnMapSummary: DebugReport["summary"];
  shapeSummary: ShapeSummary;
  waveformGates: WaveformGateComparison[];
  perDeltaEvaluation: PerDeltaEvaluation[];
}): ScenarioEvaluation {
  const maxCO = Math.max(0, ...input.perDeltaEvaluation.map((point) => point.branchAmplitudeFractionCOL));
  const maxEDV = Math.max(0, ...input.perDeltaEvaluation.map((point) => point.branchAmplitudeFractionEDVL));
  const maxESV = Math.max(0, ...input.perDeltaEvaluation.map((point) => point.branchAmplitudeFractionESVL));
  const worst = input.perDeltaEvaluation.reduce<PerDeltaEvaluation | null>(
    (best, point) => !best || point.branchAmplitudeFractionCOL > best.branchAmplitudeFractionCOL ? point : best,
    null,
  );
  const cleanSlopePoints = input.perDeltaEvaluation.filter((point) => point.cleanForReturnMapSlope);
  const maxCleanAbsOneBeat = finiteMaxOrNull(cleanSlopePoints.map((point) => Math.abs(point.oneBeatEDVSlope ?? Number.NaN)));
  const maxCleanAbsTwoBeat = finiteMaxOrNull(cleanSlopePoints.map((point) => Math.abs(point.twoBeatEDVSlope ?? Number.NaN)));
  const worstDeltaCleanSlopeCovered = worst?.cleanForReturnMapSlope === true;
  const suspiciousPoints = input.perDeltaEvaluation.filter((point) => point.branchEnvelopeClass !== "good");
  const cleanSlopeCoveredDeltasMl = cleanSlopePoints.map((point) => point.deltaVolumeMl);
  const cleanSlopeMissingDeltasMl = suspiciousPoints
    .filter((point) => !point.cleanForReturnMapSlope)
    .map((point) => point.deltaVolumeMl);
  const cleanSlopeCoverageClass: CleanSlopeCoverageClass = cleanSlopePoints.length === 0
    ? "none"
    : worstDeltaCleanSlopeCovered ? "worst-covered" : "partial";
  const returnMapEvidenceLevel: ReturnMapEvidenceLevel = cleanSlopePoints.length === 0
    ? "none"
    : worstDeltaCleanSlopeCovered ? "worst-delta-scalar-edv-clean" : "scalar-edv-clean";
  const uncoveredWorstDeltaReason = worstDeltaCleanSlopeCovered ? undefined : describeMissingCleanSlopeCoverage(worst);
  const waveformMax = Math.max(0, ...input.waveformGates.map((gate) => gate.maxDeltaFraction));
  const branchClass = branchEnvelopeClass(maxCO, maxEDV, maxESV);
  const localizationClass = branchLocalizationClass(maxCO, maxEDV, maxESV);
  const reasons: string[] = [];
  const maxCleanAbsOneBeatESV = finiteMaxOrNull(cleanSlopePoints.map((point) => Math.abs(point.oneBeatESVSlope ?? Number.NaN)));
  const maxCleanAbsTwoBeatESV = finiteMaxOrNull(cleanSlopePoints.map((point) => Math.abs(point.twoBeatESVSlope ?? Number.NaN)));
  const maxCleanAbsOneBeatVolumeFeature = finiteMaxOrNull(cleanSlopePoints.map((point) => point.maxAbsOneBeatVolumeFeatureSlope ?? Number.NaN));
  const maxCleanAbsTwoBeatVolumeFeature = finiteMaxOrNull(cleanSlopePoints.map((point) => point.maxAbsTwoBeatVolumeFeatureSlope ?? Number.NaN));
  const slopeOk = worstDeltaCleanSlopeCovered
    && maxCleanAbsOneBeat != null
    && maxCleanAbsOneBeat < 0.85
    && maxCleanAbsTwoBeat != null
    && maxCleanAbsTwoBeat < 0.85;
  const isDefaultBaseline = input.lambdaActTauSec === 0
    && input.lowStretchLimiterMode === "none"
    && input.aorticFlowClampMode === "hard"
    && isDefaultAorticValveComparator(input.aovB, input.aovAmax);

  let classification: ScenarioClassification;
  if (isDefaultBaseline) {
    classification = "baseline";
    reasons.push("tau=0/no-limiter/hard-aortic-clamp/default-AoV baseline");
  } else if (
    input.returnMapSummary.contaminatedPointCount > 0
    || waveformMax > 0.08
    || input.shapeSummary.meanCOLErrorFractionVsBaseline > 0.08
    || input.shapeSummary.meanSVLErrorFractionVsBaseline > 0.08
    || input.shapeSummary.lowPreloadMonotonicityViolations > 0
    || input.shapeSummary.dipReRiseScoreLMin > 0.2
  ) {
    classification = "fail";
    if (input.returnMapSummary.contaminatedPointCount > 0) reasons.push("contaminated points present");
    if (waveformMax > 0.08) reasons.push("normal/HR waveform delta exceeds 8%");
    if (input.shapeSummary.meanCOLErrorFractionVsBaseline > 0.08) reasons.push("mean CO preservation error exceeds 8%");
    if (input.shapeSummary.meanSVLErrorFractionVsBaseline > 0.08) reasons.push("mean SV preservation error exceeds 8%");
    if (input.shapeSummary.lowPreloadMonotonicityViolations > 0) reasons.push("low-preload monotonicity breaks");
    if (input.shapeSummary.dipReRiseScoreLMin > 0.2) reasons.push("dip/re-rise score remains high");
  } else if (
    branchClass === "good"
    && slopeOk
  ) {
    classification = "root-fix-candidate";
    reasons.push("branch envelope small and worst-delta scalar EDV slopes below 0.85");
    reasons.push("pending full-state Jacobian confirmation");
  } else {
    classification = "mitigator";
    if (branchClass === "mitigated" || branchClass === "residual") reasons.push(`branch envelope is ${branchClass}, not root-fixed`);
    if (branchClass === "poor") reasons.push("branch envelope remains large");
    if (branchClass === "good" && !worstDeltaCleanSlopeCovered) reasons.push("branch envelope good, but worst delta lacks clean return-map slope coverage");
    else if (!worstDeltaCleanSlopeCovered) reasons.push("worst branch delta lacks clean return-map slope coverage");
    if (cleanSlopePoints.length === 0) reasons.push("no clean selected return-map slopes");
    else if ((maxCleanAbsOneBeat ?? 0) >= 0.85 || (maxCleanAbsTwoBeat ?? 0) >= 0.85) reasons.push("clean return-map slope remains near or beyond flip threshold");
  }

  const requiresFullJacobianConfirmation = classification === "root-fix-candidate";

  return {
    classification,
    branchEnvelopeClass: branchClass,
    branchLocalizationClass: localizationClass,
    reasons,
    worstDeltaVolumeMl: worst?.deltaVolumeMl ?? null,
    worstLAPMean: finiteOrNull(worst?.LAPMean ?? Number.NaN),
    maxPerDeltaBranchFractionCOL: maxCO,
    maxPerDeltaBranchFractionEDVL: maxEDV,
    maxPerDeltaBranchFractionESVL: maxESV,
    maxCleanAbsOneBeatEDVSlope: maxCleanAbsOneBeat,
    maxCleanAbsTwoBeatEDVSlope: maxCleanAbsTwoBeat,
    maxCleanAbsOneBeatESVSlope: maxCleanAbsOneBeatESV,
    maxCleanAbsTwoBeatESVSlope: maxCleanAbsTwoBeatESV,
    maxCleanAbsOneBeatVolumeFeatureSlope: maxCleanAbsOneBeatVolumeFeature,
    maxCleanAbsTwoBeatVolumeFeatureSlope: maxCleanAbsTwoBeatVolumeFeature,
    cleanReturnMapPointCount: cleanSlopePoints.length,
    worstDeltaCleanSlopeCovered,
    uncoveredWorstDeltaReason,
    cleanSlopeCoverageClass,
    cleanSlopeCoveredDeltasMl,
    cleanSlopeMissingDeltasMl,
    returnMapEvidenceLevel,
    requiresFullJacobianConfirmation,
  };
}

function describeMissingCleanSlopeCoverage(point: PerDeltaEvaluation | null): string | undefined {
  if (!point) return "no branch delta";
  if (point.returnMapStatus !== "ok") return `return-map ${point.returnMapStatus}`;
  if (point.tbvAuditClass !== "clean") return `tbv audit ${point.tbvAuditClass}`;
  if (point.nonsmooth) return "nonsmooth return map";
  if (point.clampCrossing) return "clamp crossing";
  if (point.oneBeatEDVSlope == null || point.twoBeatEDVSlope == null) return "missing scalar EDV slope";
  return "not selected for clean scalar EDV return-map slope";
}

function branchEnvelopeClass(coBranch: number, edvBranch: number, esvBranch: number): BranchEnvelopeClass {
  const maxBranch = Math.max(finiteOrZero(coBranch), finiteOrZero(edvBranch), finiteOrZero(esvBranch));
  if (maxBranch < 0.1) return "good";
  if (maxBranch < 0.3) return "mitigated";
  if (maxBranch < 0.5) return "residual";
  return "poor";
}

function branchLocalizationClass(coBranch: number, edvBranch: number, esvBranch: number): BranchLocalizationClass {
  const edv = finiteOrZero(edvBranch);
  const ejection = Math.max(finiteOrZero(coBranch), finiteOrZero(esvBranch));
  if (edv > ejection * 1.5 && edv >= 0.02) return "edv-dominant";
  if (ejection > edv * 3 && ejection >= 0.02) return "esv/ejection-dominant";
  return "mixed";
}

function isCleanReturnMapPoint(point: DebugPoint): boolean {
  return point.returnMap.status === "ok"
    && point.tbvAudit.classification === "clean"
    && !point.returnMap.nonsmooth
    && !point.returnMap.clampCrossing
    && Number.isFinite(point.returnMap.features.EDV_L?.centralSlope)
    && Number.isFinite(point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope);
}

function classificationCounts(scenarios: MatrixScenario[]): Record<ScenarioClassification, number> {
  return scenarios.reduce<Record<ScenarioClassification, number>>((counts, scenario) => {
    counts[scenario.evaluation.classification]++;
    return counts;
  }, { baseline: 0, fail: 0, mitigator: 0, "root-fix-candidate": 0 });
}

function branchLocalizationCounts(scenarios: MatrixScenario[]): Record<BranchLocalizationClass, number> {
  return scenarios.reduce<Record<BranchLocalizationClass, number>>((counts, scenario) => {
    counts[scenario.evaluation.branchLocalizationClass]++;
    return counts;
  }, { "edv-dominant": 0, "esv/ejection-dominant": 0, mixed: 0 });
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
  heartModel: HeartModelMode,
  dt: number,
  sampleHz: number,
  scope: LambdaActScope,
  tauSec: number,
  terms: LambdaActTerms,
  lowStretchLimiterMode: LowStretchLimiterMode,
  lowStretchLimiterScope: LambdaActScope,
  activeReservePreset: ActiveReservePreset,
  aorticFlowClampMode: AorticFlowClampMode,
  aovB: number,
  aovAmax: number,
  baselineCache: Map<string, WaveformGateMetrics>,
): WaveformGateComparison[] {
  return [
    waveformGateComparison("normal", DEFAULT_PARAMS.HR, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax, baselineCache),
    waveformGateComparison("HR100", 100, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax, baselineCache),
    waveformGateComparison("HR100-rearm", 100, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax, baselineCache),
  ];
}

function waveformGateComparison(
  label: WaveformGateLabel,
  HR: number,
  targetVolumeMl: number,
  heartModel: HeartModelMode,
  dt: number,
  sampleHz: number,
  scope: LambdaActScope,
  tauSec: number,
  terms: LambdaActTerms,
  lowStretchLimiterMode: LowStretchLimiterMode,
  lowStretchLimiterScope: LambdaActScope,
  activeReservePreset: ActiveReservePreset,
  aorticFlowClampMode: AorticFlowClampMode,
  aovB: number,
  aovAmax: number,
  baselineCache: Map<string, WaveformGateMetrics>,
): WaveformGateComparison {
  const baselineKey = `${heartModel}|${label}|${HR}|${targetVolumeMl}|${dt}|${sampleHz}`;
  let baseline = baselineCache.get(baselineKey);
  if (!baseline) {
    baseline = measureWaveformGate(label, HR, targetVolumeMl, heartModel, dt, sampleHz, "all", 0, "kd+fiso", "none", "lv", "none", "hard", DEFAULT_AOV_B, DEFAULT_AOV_AMAX);
    baselineCache.set(baselineKey, baseline);
  }
  const candidate = tauSec <= 0 && lowStretchLimiterMode === "none" && aorticFlowClampMode === "hard" && isDefaultAorticValveComparator(aovB, aovAmax)
    ? baseline
    : measureWaveformGate(label, HR, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax);
  const delta = {
    CO_L: candidate.CO_L - baseline.CO_L,
    CO_R: candidate.CO_R - baseline.CO_R,
    EDV_L: candidate.EDV_L - baseline.EDV_L,
    ESV_L: candidate.ESV_L - baseline.ESV_L,
    EF_L: candidate.EF_L - baseline.EF_L,
    LVPMax: candidate.LVPMax - baseline.LVPMax,
    QAoMax: candidate.QAoMax - baseline.QAoMax,
    AoVMeanGradient: candidate.AoVMeanGradient - baseline.AoVMeanGradient,
    AoVPeakGradient: candidate.AoVPeakGradient - baseline.AoVPeakGradient,
    AoVFlowWeightedTotalGradient: candidate.AoVFlowWeightedTotalGradient - baseline.AoVFlowWeightedTotalGradient,
    AoVFlowWeightedOrificeGradient: candidate.AoVFlowWeightedOrificeGradient - baseline.AoVFlowWeightedOrificeGradient,
    AoVFlowWeightedBernoulliGradient: candidate.AoVFlowWeightedBernoulliGradient - baseline.AoVFlowWeightedBernoulliGradient,
    AoVFlowWeightedInertialGradient: candidate.AoVFlowWeightedInertialGradient - baseline.AoVFlowWeightedInertialGradient,
    QAoPeakMeanRatio: candidate.QAoPeakMeanRatio - baseline.QAoPeakMeanRatio,
    ejectionDurationMs: candidate.ejectionDurationMs - baseline.ejectionDurationMs,
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
  heartModel: HeartModelMode,
  dt: number,
  sampleHz: number,
  scope: LambdaActScope,
  tauSec: number,
  terms: LambdaActTerms,
  lowStretchLimiterMode: LowStretchLimiterMode = "none",
  lowStretchLimiterScope: LambdaActScope = "lv",
  activeReservePreset: ActiveReservePreset = "none",
  aorticFlowClampMode: AorticFlowClampMode = "hard",
  aovB: number = DEFAULT_AOV_B,
  aovAmax: number = DEFAULT_AOV_AMAX,
): WaveformGateMetrics {
  return withQuietClampLogs(() => measureWaveformGateImpl(label, HR, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax));
}

function measureWaveformGateImpl(
  label: WaveformGateLabel,
  HR: number,
  targetVolumeMl: number,
  heartModel: HeartModelMode,
  dt: number,
  sampleHz: number,
  scope: LambdaActScope,
  tauSec: number,
  terms: LambdaActTerms,
  lowStretchLimiterMode: LowStretchLimiterMode = "none",
  lowStretchLimiterScope: LambdaActScope = "lv",
  activeReservePreset: ActiveReservePreset = "none",
  aorticFlowClampMode: AorticFlowClampMode = "hard",
  aovB: number = DEFAULT_AOV_B,
  aovAmax: number = DEFAULT_AOV_AMAX,
): WaveformGateMetrics {
  const params = paramsWithLowStretchLimiter(
    paramsWithLambdaActTau(
      paramsWithAorticValveComparator(
        label === "HR100-rearm" ? { ...DEFAULT_PARAMS, heartModel } : { ...DEFAULT_PARAMS, heartModel, HR },
        aovB,
        aovAmax,
      ),
      tauSec,
      scope,
      terms,
    ),
    lowStretchLimiterMode,
    lowStretchLimiterScope,
    activeReservePreset,
  );
  const core = new ModelCore(params);
  core.setAorticFlowClampMode(aorticFlowClampMode);
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
  const measuredBeatCount = Math.max(1, Math.max(2, periodBeats + 1));
  const volumes = samples.map((sample) => sample.VLV).filter(Number.isFinite);
  const edv = Math.max(...volumes);
  const esv = Math.min(...volumes);
  const lvp = samples.map((sample) => sample.LVP).filter(Number.isFinite);
  const qao = samples.map((sample) => sample.QAo).filter(Number.isFinite);
  const aovEjection = samples.filter((sample) => sample.QAo > 50 && sample.xiAoV > 0.8);
  const qAoMeanDuringEjection = meanNumbers(aovEjection.map((sample) => sample.QAo));
  const qAoProximity = qAoCapProximity(qao, aorticFlowClampMode);
  const aovGradient = aovGradientDecomposition(samples, params);
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
    ...qAoProximity,
    AoVMeanGradient: metrics.AoVMeanGradient,
    AoVPeakGradient: metrics.AoVPeakGradient,
    ...aovGradient,
    QAoPeakMeanRatio: Number.isFinite(qAoMeanDuringEjection) && qAoMeanDuringEjection > 1e-9
      ? Math.max(...qao) / qAoMeanDuringEjection
      : Number.NaN,
    ejectionDurationMs: (aovEjection.length / Math.max(sampleHz, 1) / measuredBeatCount) * 1000,
    maxDpdtLVP: maxDerivative(samples, "LVP"),
    clampHitCount: core.debugClampDiagnostics().totalClampHits,
    valveReverseVolumeMl: valveReverseVolumeMl(samples),
  };
}

function aovGradientDecomposition(samples: SimSample[], params: CoreRuntimeParams): Pick<WaveformGateMetrics,
  "AoVFlowWeightedTotalGradient"
  | "AoVFlowWeightedOrificeGradient"
  | "AoVFlowWeightedResistiveGradient"
  | "AoVFlowWeightedBernoulliGradient"
  | "AoVFlowWeightedInertialGradient"
  | "AoVFlowWeightedResidualGradient"
  | "AoVPeakOrificeGradient"
  | "AoVPeakInertialGradient"
  | "AoVPeakResidualGradient"
> {
  const ejection = samples
    .map((sample, index) => ({ sample, index }))
    .filter(({ sample }) => Number.isFinite(sample.QAo) && sample.QAo > 50 && sample.xiAoV > 0.8);
  if (ejection.length === 0) {
    return {
      AoVFlowWeightedTotalGradient: Number.NaN,
      AoVFlowWeightedOrificeGradient: Number.NaN,
      AoVFlowWeightedResistiveGradient: Number.NaN,
      AoVFlowWeightedBernoulliGradient: Number.NaN,
      AoVFlowWeightedInertialGradient: Number.NaN,
      AoVFlowWeightedResidualGradient: Number.NaN,
      AoVPeakOrificeGradient: Number.NaN,
      AoVPeakInertialGradient: Number.NaN,
      AoVPeakResidualGradient: Number.NaN,
    };
  }
  let qWeight = 0;
  let totalWeighted = 0;
  let orificeWeighted = 0;
  let resistiveWeighted = 0;
  let bernoulliWeighted = 0;
  let inertialWeighted = 0;
  let residualWeighted = 0;
  let peakOrifice = Number.NEGATIVE_INFINITY;
  let peakInertial = Number.NEGATIVE_INFINITY;
  let peakResidual = Number.NEGATIVE_INFINITY;
  for (const { sample, index } of ejection) {
    const q = Math.max(0, sample.QAo);
    const total = sample.LVP - sample.AoP;
    // Use the engine-sampled effective valve losses. They already include
    // Aref/Amax/xi area scaling, so AS comparator reports match runtime physics.
    const resistive = sample.AoV_loss_R;
    const bernoulli = sample.AoV_loss_B;
    const inertial = params.AoV_L * qDerivative(samples, index, "QAo");
    const orifice = resistive + bernoulli;
    const residual = total - orifice - inertial;
    qWeight += q;
    totalWeighted += total * q;
    orificeWeighted += orifice * q;
    resistiveWeighted += resistive * q;
    bernoulliWeighted += bernoulli * q;
    inertialWeighted += inertial * q;
    residualWeighted += residual * q;
    peakOrifice = Math.max(peakOrifice, orifice);
    peakInertial = Math.max(peakInertial, inertial);
    peakResidual = Math.max(peakResidual, residual);
  }
  const denom = Math.max(qWeight, 1e-9);
  return {
    AoVFlowWeightedTotalGradient: totalWeighted / denom,
    AoVFlowWeightedOrificeGradient: orificeWeighted / denom,
    AoVFlowWeightedResistiveGradient: resistiveWeighted / denom,
    AoVFlowWeightedBernoulliGradient: bernoulliWeighted / denom,
    AoVFlowWeightedInertialGradient: inertialWeighted / denom,
    AoVFlowWeightedResidualGradient: residualWeighted / denom,
    AoVPeakOrificeGradient: Number.isFinite(peakOrifice) ? peakOrifice : Number.NaN,
    AoVPeakInertialGradient: Number.isFinite(peakInertial) ? peakInertial : Number.NaN,
    AoVPeakResidualGradient: Number.isFinite(peakResidual) ? peakResidual : Number.NaN,
  };
}

function qDerivative(samples: SimSample[], index: number, key: keyof SimSample): number {
  const previous = samples[index - 1];
  const current = samples[index];
  const next = samples[index + 1];
  if (previous && next && next.t > previous.t) {
    return (Number(next[key]) - Number(previous[key])) / (next.t - previous.t);
  }
  if (previous && current.t > previous.t) {
    return (Number(current[key]) - Number(previous[key])) / (current.t - previous.t);
  }
  if (next && next.t > current.t) {
    return (Number(next[key]) - Number(current[key])) / (next.t - current.t);
  }
  return 0;
}

function qAoCapProximity(values: number[], aorticFlowClampMode: AorticFlowClampMode): Pick<WaveformGateMetrics,
  "QAoCapRatioMax"
  | "QAoNearCap95Fraction"
  | "QAoNearCap98Fraction"
  | "QAoAtCapFraction"
  | "QAoLocalCapActiveFraction"
> {
  const positive = values.filter((value) => Number.isFinite(value) && value > 0);
  const denom = Math.max(positive.length, 1);
  const cap = DYNAMIC_FLOW_CLAMP_ML_PER_S;
  const localThreshold = localAorticIdentityFraction(aorticFlowClampMode);
  const maxValue = positive.length > 0 ? Math.max(...positive) : 0;
  return {
    QAoCapRatioMax: maxValue / cap,
    QAoNearCap95Fraction: positive.filter((value) => value >= cap * 0.95).length / denom,
    QAoNearCap98Fraction: positive.filter((value) => value >= cap * 0.98).length / denom,
    QAoAtCapFraction: positive.filter((value) => value >= cap * 0.999).length / denom,
    QAoLocalCapActiveFraction: localThreshold == null ? 0 : positive.filter((value) => value > cap * localThreshold).length / denom,
  };
}

function localAorticIdentityFraction(mode: AorticFlowClampMode): number | undefined {
  if (mode === "local-c1-0.90") return 0.90;
  if (mode === "local-c1-0.95" || mode === "local-c2-0.95") return 0.95;
  if (mode === "local-c1-0.98" || mode === "local-c2-0.98") return 0.98;
  return undefined;
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
    "AoVMeanGradient",
    "AoVPeakGradient",
    "QAoPeakMeanRatio",
    "ejectionDurationMs",
    "maxDpdtLVP",
  ];
  return keys.reduce<{ metric: keyof WaveformGateComparison["delta"]; fraction: number }>((best, key) => {
    const baselineValue = Number(baseline[key as keyof WaveformGateMetrics]);
    const deltaValue = Number(delta[key]);
    const fraction = Number.isFinite(deltaValue) ? Math.abs(deltaValue) / Math.max(Math.abs(baselineValue), 1e-6) : 0;
    return fraction > best.fraction ? { metric: key, fraction } : best;
  }, { metric: "CO_L", fraction: 0 });
}

function isDefaultAorticValveComparator(aovB: number, aovAmax: number): boolean {
  return Math.abs(aovB - DEFAULT_AOV_B) <= Math.max(DEFAULT_AOV_B, 1) * 1e-9
    && Math.abs(aovAmax - DEFAULT_AOV_AMAX) <= Math.max(DEFAULT_AOV_AMAX, 1) * 1e-9;
}

export function matrixReportToMarkdown(report: MatrixReport): string {
  const lines: string[] = [];
  lines.push("# Starling low-preload branch/return-map matrix");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Measurement: ${report.measurementMode}`);
  lines.push("");
  lines.push("## Classification counts");
  lines.push("");
  lines.push("| baseline | fail | mitigator | root-fix candidate |");
  lines.push("| ---: | ---: | ---: | ---: |");
  lines.push([
    report.summary.classificationCounts.baseline,
    report.summary.classificationCounts.fail,
    report.summary.classificationCounts.mitigator,
    report.summary.classificationCounts["root-fix-candidate"],
  ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  lines.push("");
  lines.push("## Branch localization counts");
  lines.push("");
  lines.push("| EDV dominant | ESV/ejection dominant | mixed |");
  lines.push("| ---: | ---: | ---: |");
  lines.push([
    report.summary.branchLocalizationCounts["edv-dominant"],
    report.summary.branchLocalizationCounts["esv/ejection-dominant"],
    report.summary.branchLocalizationCounts.mixed,
  ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  lines.push("");
  lines.push("## Filling morphology alternation counts");
  lines.push("");
  lines.push("| morphology alternation | peak-count alternation | max MV A branch frac | max MV mid branch frac | max LA A-loop branch frac |");
  lines.push("| ---: | ---: | ---: | ---: | ---: |");
  lines.push([
    report.summary.fillingMorphologyAlternationCount,
    report.summary.peakCountAlternationCount,
    round(report.summary.maxFillingBranchMVAFraction, 4),
    round(report.summary.maxFillingBranchMidFraction, 4),
    round(report.summary.maxFillingBranchLAAloopFraction, 4),
  ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  lines.push("");
  lines.push("## Primary MV event alternation counts");
  lines.push("");
  lines.push("| near-zero return alternation | MV reopen alternation | LAP-LVP crossing alternation | max xi-min branch | max open01-min branch |");
  lines.push("| ---: | ---: | ---: | ---: | ---: |");
  lines.push([
    report.summary.nearZeroReturnAlternationCount,
    report.summary.reopenCountAlternationCount,
    report.summary.pressureCrossingAlternationCount,
    round(report.summary.maxInterwaveXiMinAbs, 4),
    round(report.summary.maxInterwaveOpen01MinAbs, 4),
  ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  lines.push("");
  lines.push("## Scenario summary");
  lines.push("");
  lines.push("| class | branch class | localization | reasons | heart model | scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | AoV clamp | AoV B | AoV Amax | selected deltas | period-2 | worst delta | worst covered | coverage | evidence | needs Jacobian | max CO branch frac | max EDV branch frac | max ESV branch frac | max QAo branch frac | max AoP branch frac | max QAo/cap | near cap >95% | at cap | local cap active | clean slopes | clean one-beat EDV slope | clean two-beat EDV slope | clean one-beat ESV slope | clean two-beat ESV slope | clean one-beat volume max slope | clean two-beat volume max slope | min MV A mL | min MV A frac | min LA A-loop frac | mean CO err | mean SV err | monotonicity breaks | dip/re-rise | slope ratio | active hit frac | min active scale | target reduction | max clamp hits | max sanitize abs mL | max projection applied mL | contaminated | max waveform gate frac | worst waveform metric |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const scenario of report.scenarios) {
    const worstWaveform = scenario.waveformGates.reduce<{ label: string; metric: string; fraction: number }>(
      (best, gate) => gate.maxDeltaFraction > best.fraction
        ? { label: gate.label, metric: gate.maxDeltaMetric, fraction: gate.maxDeltaFraction }
        : best,
      { label: "", metric: "", fraction: 0 },
    );
    lines.push([
      scenario.evaluation.classification,
      scenario.evaluation.branchEnvelopeClass,
      scenario.evaluation.branchLocalizationClass,
      scenario.evaluation.reasons.join("; "),
      scenario.heartModel,
      scenario.lambdaActScope,
      scenario.lambdaActTerms,
      round(scenario.lambdaActTauSec, 4),
      scenario.lowStretchLimiterMode,
      scenario.lowStretchLimiterScope,
      scenario.activeReservePreset,
      round(scenario.dt, 5),
      scenario.tbvCorrectionMode,
      scenario.aorticFlowClampMode,
      scenario.aovB,
      scenario.aovAmax,
      scenario.selectedDeltasMl.join(", "),
      scenario.returnMapSummary.period2Count,
      scenario.evaluation.worstDeltaVolumeMl ?? "",
      scenario.evaluation.worstDeltaCleanSlopeCovered ? "yes" : `no (${scenario.evaluation.uncoveredWorstDeltaReason ?? "unknown"})`,
      scenario.evaluation.cleanSlopeCoverageClass,
      scenario.evaluation.returnMapEvidenceLevel,
      scenario.evaluation.requiresFullJacobianConfirmation ? "yes" : "no",
      round(scenario.evaluation.maxPerDeltaBranchFractionCOL, 4),
      round(scenario.evaluation.maxPerDeltaBranchFractionEDVL, 4),
      round(scenario.evaluation.maxPerDeltaBranchFractionESVL, 4),
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionQAoMax, 4),
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionAoPMax, 4),
      round(scenario.returnMapSummary.maxQAoCapRatioMax, 4),
      round(scenario.returnMapSummary.maxQAoNearCap95Fraction, 4),
      round(scenario.returnMapSummary.maxQAoAtCapFraction, 4),
      round(scenario.returnMapSummary.maxQAoLocalCapActiveFraction, 4),
      scenario.evaluation.cleanReturnMapPointCount,
      round(scenario.evaluation.maxCleanAbsOneBeatEDVSlope ?? NaN, 4),
      round(scenario.evaluation.maxCleanAbsTwoBeatEDVSlope ?? NaN, 4),
      round(scenario.evaluation.maxCleanAbsOneBeatESVSlope ?? NaN, 4),
      round(scenario.evaluation.maxCleanAbsTwoBeatESVSlope ?? NaN, 4),
      round(scenario.evaluation.maxCleanAbsOneBeatVolumeFeatureSlope ?? NaN, 4),
      round(scenario.evaluation.maxCleanAbsTwoBeatVolumeFeatureSlope ?? NaN, 4),
      round(scenario.returnMapSummary.minMVAForwardMl, 4),
      round(scenario.returnMapSummary.minMVAFraction, 4),
      round(scenario.returnMapSummary.minLAAloopFraction, 4),
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
      round(maxWaveformGateFractionForScenario(scenario), 4),
      worstWaveform.label ? `${worstWaveform.label}:${worstWaveform.metric}` : "",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Interpretation notes");
  lines.push("");
  lines.push("- `root-fix-candidate` requires the worst branch delta to have clean scalar EDV return-map slope coverage. If the worst delta is nonsmooth, clamp-crossing, contaminated, or otherwise unmeasured, the scenario remains a mitigator/inconclusive even when the branch envelope is small.");
  lines.push("- `scalar-edv-clean` evidence is not a full-state Floquet/Jacobian result. Any root-fix candidate remains provisional until broader validation, and ideally full-state Poincare Jacobian confirmation, is available.");
  lines.push("- Avoid stacking multiple mitigators just to satisfy the classifier. Multiple-lever tuning should be labeled as a stabilization bundle, not a single-mechanism root fix.");
  lines.push("");
  lines.push("## Per-delta primary branch / slope view");
  lines.push("");
  lines.push("| class | heart model | lambda scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | delta | LAP | CO_L period | CO_L last beat | period | branch class | localization | CO branch frac | EDV branch frac | ESV branch frac | MV reopen A/B | zero return A/B | LAP-LVP crossings A/B | xi-min branch | open01-min branch | MV A mL | MV A frac | MV mid mL | MV peaks | morphology | MV A branch frac | MV mid branch frac | morphology alternates | peak-count alternates | LA A-loop frac | active hit frac | min active scale | target reduction | return-map | clean slope | one-beat EDV slope | two-beat EDV slope | one-beat ESV slope | two-beat ESV slope | one-beat volume max slope | two-beat volume max slope | nonsmooth | audit |");
  lines.push("| --- | --- | --- | --- | ---: | --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |");
  for (const scenario of report.scenarios) {
    for (const point of scenario.perDeltaEvaluation) {
      lines.push([
        scenario.evaluation.classification,
        scenario.heartModel,
        scenario.lambdaActScope,
        scenario.lambdaActTerms,
        round(scenario.lambdaActTauSec, 4),
        scenario.lowStretchLimiterMode,
        scenario.lowStretchLimiterScope,
        scenario.activeReservePreset,
        round(scenario.dt, 5),
        scenario.tbvCorrectionMode,
        point.deltaVolumeMl,
        round(point.LAPMean, 4),
        round(point.CO_L, 4),
        round(point.lastBeatCO_L, 4),
        point.periodBeats,
        point.branchEnvelopeClass,
        point.branchLocalizationClass,
        round(point.branchAmplitudeFractionCOL, 4),
        round(point.branchAmplitudeFractionEDVL, 4),
        round(point.branchAmplitudeFractionESVL, 4),
        point.fillingBranch ? `${point.fillingBranch.reopenCountA}/${point.fillingBranch.reopenCountB}` : "",
        point.fillingBranch ? `${point.fillingBranch.nearZeroReturnCountA}/${point.fillingBranch.nearZeroReturnCountB}` : "",
        point.fillingBranch ? `${point.fillingBranch.pressureCrossingCountA}/${point.fillingBranch.pressureCrossingCountB}` : "",
        round(point.fillingBranch?.interwaveXiMinAbs ?? NaN, 4),
        round(point.fillingBranch?.interwaveOpen01MinAbs ?? NaN, 4),
        round(point.MV_A_forward_mL ?? NaN, 4),
        round(point.MV_A_fraction ?? NaN, 4),
        round(point.MV_mid_forward_mL ?? NaN, 4),
        point.MV_forward_peak_count ?? "",
        point.fillingMorphologyClass ?? "",
        round(point.fillingBranch?.MV_A_forward_fraction ?? NaN, 4),
        round(point.fillingBranch?.MV_mid_forward_fraction ?? NaN, 4),
        point.fillingBranch?.morphologyAlternates ? "yes" : "no",
        point.fillingBranch?.peakCountAlternates ? "yes" : "no",
        round(point.LA_A_loop_fraction ?? NaN, 4),
        round(point.activeReserveHitFraction, 4),
        round(point.activeReserveMinScale, 4),
        round(point.sigmaActTargetReductionFraction, 4),
        point.returnMapStatus,
        point.cleanForReturnMapSlope ? "yes" : "no",
        round(point.oneBeatEDVSlope ?? NaN, 4),
        round(point.twoBeatEDVSlope ?? NaN, 4),
        round(point.oneBeatESVSlope ?? NaN, 4),
        round(point.twoBeatESVSlope ?? NaN, 4),
        round(point.maxAbsOneBeatVolumeFeatureSlope ?? NaN, 4),
        round(point.maxAbsTwoBeatVolumeFeatureSlope ?? NaN, 4),
        point.nonsmooth ? "yes" : "no",
        point.tbvAuditClass,
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## TBV / Clamp Audit");
  lines.push("");
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | AoV B | AoV Amax | max CO branch frac | max sanitize abs mL | max projection applied mL | contaminated points |");
  lines.push("| --- | --- | ---: | --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
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
      scenario.aovB,
      scenario.aovAmax,
      round(scenario.returnMapSummary.maxBranchAmplitudeFractionCOL, 4),
      round(scenario.returnMapSummary.maxSanitizeAbsMl, 6),
      round(scenario.returnMapSummary.maxProjectionAppliedMl, 6),
      scenario.returnMapSummary.contaminatedPointCount,
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## LA/MV filling regime diagnostics");
  lines.push("");
  lines.push("| class | scope | limiter | limiter scope | preset | dt | TBV correction | delta | CO branch frac | EDV branch frac | ESV branch frac | MV E mL | MV A mL | MV A frac | MV mid mL | MV E peak | MV A peak | MV mid peak | MV peaks | mid peaks | QMV zero returns | MV reopen count | xi min E-A | open01 min E-A | LAP-LVP zc | morphology | MV A branch abs | MV A branch frac | MV mid branch abs | MV mid branch frac | LA A-loop branch abs | LA A-loop branch frac | morphology A | morphology B | morphology alternates | peak count A | peak count B | peak-count alternates | LA A-loop area | LA A-loop frac | A mean LAP-LVP | A max LAP-LVP | A MV open frac | period |");
  lines.push("| --- | --- | --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.scenarios) {
    for (const point of scenario.perDeltaEvaluation) {
      lines.push([
        scenario.evaluation.classification,
        scenario.lambdaActScope,
        scenario.lowStretchLimiterMode,
        scenario.lowStretchLimiterScope,
        scenario.activeReservePreset,
        round(scenario.dt, 5),
        scenario.tbvCorrectionMode,
        point.deltaVolumeMl,
        round(point.branchAmplitudeFractionCOL, 4),
        round(point.branchAmplitudeFractionEDVL, 4),
        round(point.branchAmplitudeFractionESVL, 4),
        round(point.MV_E_forward_mL ?? NaN, 4),
        round(point.MV_A_forward_mL ?? NaN, 4),
        round(point.MV_A_fraction ?? NaN, 4),
        round(point.MV_mid_forward_mL ?? NaN, 4),
        round(point.MV_E_peak ?? NaN, 4),
        round(point.MV_A_peak ?? NaN, 4),
        round(point.MV_mid_peak ?? NaN, 4),
        point.MV_forward_peak_count ?? "",
        point.MV_mid_forward_peak_count ?? "",
        point.QMV_near_zero_return_count ?? "",
        point.MV_open_close_reopen_count ?? "",
        round(point.MV_interwave_xi_min ?? NaN, 4),
        round(point.MV_interwave_open01_min ?? NaN, 4),
        point.LAP_LVP_zero_crossing_count ?? "",
        point.fillingMorphologyClass ?? "",
        round(point.fillingBranch?.MV_A_forward_abs ?? NaN, 4),
        round(point.fillingBranch?.MV_A_forward_fraction ?? NaN, 4),
        round(point.fillingBranch?.MV_mid_forward_abs ?? NaN, 4),
        round(point.fillingBranch?.MV_mid_forward_fraction ?? NaN, 4),
        round(point.fillingBranch?.LA_A_loop_area_abs ?? NaN, 4),
        round(point.fillingBranch?.LA_A_loop_area_fraction ?? NaN, 4),
        point.fillingBranch?.morphologyClassA ?? "",
        point.fillingBranch?.morphologyClassB ?? "",
        point.fillingBranch?.morphologyAlternates ? "yes" : "no",
        point.fillingBranch?.forwardPeakCountA ?? "",
        point.fillingBranch?.forwardPeakCountB ?? "",
        point.fillingBranch?.peakCountAlternates ? "yes" : "no",
        round(point.LA_A_loop_area ?? NaN, 4),
        round(point.LA_A_loop_fraction ?? NaN, 4),
        round(point.atrialSystoleTransmitralGradientMean ?? NaN, 4),
        round(point.atrialSystoleTransmitralGradientMax ?? NaN, 4),
        round(point.atrialSystoleMVOpenFraction ?? NaN, 4),
        point.periodBeats,
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## Normal / HR100 waveform gates");
  lines.push("");
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | AoV B | AoV Amax | case | dCO_L | dESV_L | dEF_L | dLVPmax | dQAoMax | candidate QAo/cap | candidate near cap >95% | candidate local cap active | AoV mean grad | AoV peak grad | orifice mean | Bq2 mean | inertial mean | residual mean | QAo peak/mean | ejection ms | baseline QAo/cap | dMax dP/dt | dClamp hits | worst metric | worst frac |");
  lines.push("| --- | --- | ---: | --- | --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |");
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
        scenario.aovB,
        scenario.aovAmax,
        gate.label,
        round(gate.delta.CO_L, 4),
        round(gate.delta.ESV_L, 4),
        round(gate.delta.EF_L, 4),
        round(gate.delta.LVPMax, 4),
        round(gate.delta.QAoMax, 4),
        round(gate.candidate.QAoCapRatioMax, 4),
        round(gate.candidate.QAoNearCap95Fraction, 4),
        round(gate.candidate.QAoLocalCapActiveFraction, 4),
        round(gate.candidate.AoVMeanGradient, 4),
        round(gate.candidate.AoVPeakGradient, 4),
        round(gate.candidate.AoVFlowWeightedOrificeGradient, 4),
        round(gate.candidate.AoVFlowWeightedBernoulliGradient, 4),
        round(gate.candidate.AoVFlowWeightedInertialGradient, 4),
        round(gate.candidate.AoVFlowWeightedResidualGradient, 4),
        round(gate.candidate.QAoPeakMeanRatio, 4),
        round(gate.candidate.ejectionDurationMs, 2),
        round(gate.baseline.QAoCapRatioMax, 4),
        round(gate.delta.maxDpdtLVP, 4),
        round(gate.delta.clampHitCount, 0),
        gate.maxDeltaMetric,
        round(gate.maxDeltaFraction, 4),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## AoV gradient decomposition");
  lines.push("");
  lines.push("These values split the normal/HR waveform AoV pressure loss into total transient gradient, quasi-steady orifice loss (`Rq + Bq|q|`), Bernoulli loss, inertial loss, and residual. Use the orifice columns for AS-like sanity; the total gradient also contains inertial/transient effects.");
  lines.push("");
  lines.push("| heart model | dt | TBV correction | AoV clamp | limiter | preset | AoV B | AoV Amax | case | total mean | orifice mean | Rq mean | Bq2 mean | inertial mean | residual mean | peak orifice | peak inertial | peak residual |");
  lines.push("| --- | ---: | --- | --- | --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.scenarios) {
    for (const gate of scenario.waveformGates) {
      lines.push([
        scenario.heartModel,
        round(scenario.dt, 5),
        scenario.tbvCorrectionMode,
        scenario.aorticFlowClampMode,
        scenario.lowStretchLimiterMode,
        scenario.activeReservePreset,
        scenario.aovB,
        scenario.aovAmax,
        gate.label,
        round(gate.candidate.AoVFlowWeightedTotalGradient, 4),
        round(gate.candidate.AoVFlowWeightedOrificeGradient, 4),
        round(gate.candidate.AoVFlowWeightedResistiveGradient, 4),
        round(gate.candidate.AoVFlowWeightedBernoulliGradient, 4),
        round(gate.candidate.AoVFlowWeightedInertialGradient, 4),
        round(gate.candidate.AoVFlowWeightedResidualGradient, 4),
        round(gate.candidate.AoVPeakOrificeGradient, 4),
        round(gate.candidate.AoVPeakInertialGradient, 4),
        round(gate.candidate.AoVPeakResidualGradient, 4),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## AoV_B / AS sanity");
  lines.push("");
  lines.push("| heart model | dt | TBV correction | AoV clamp | AoV B | AoV Aref | AoV Amax | case | AoV mean grad | AoV peak grad | orifice mean | inertial mean | QAo peak/mean | ejection ms | QAo/cap | branch CO frac | branch ESV frac | waveform worst frac |");
  lines.push("| --- | ---: | --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.scenarios) {
    for (const gate of scenario.waveformGates) {
      lines.push([
        scenario.heartModel,
        round(scenario.dt, 5),
        scenario.tbvCorrectionMode,
        scenario.aorticFlowClampMode,
        scenario.aovB,
        scenario.aovAref,
        scenario.aovAmax,
        gate.label,
        round(gate.candidate.AoVMeanGradient, 4),
        round(gate.candidate.AoVPeakGradient, 4),
        round(gate.candidate.AoVFlowWeightedOrificeGradient, 4),
        round(gate.candidate.AoVFlowWeightedInertialGradient, 4),
        round(gate.candidate.QAoPeakMeanRatio, 4),
        round(gate.candidate.ejectionDurationMs, 2),
        round(gate.candidate.QAoCapRatioMax, 4),
        round(scenario.evaluation.maxPerDeltaBranchFractionCOL, 4),
        round(scenario.evaluation.maxPerDeltaBranchFractionESVL, 4),
        round(gate.maxDeltaFraction, 4),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## Selected return-map points");
  lines.push("");
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | delta | return-map | branch CO frac | branch EDV frac | branch ESV frac | one-beat EDV slope | two-beat EDV slope | one-beat ESV slope | two-beat ESV slope | one-beat volume max slope | two-beat volume max slope | clamps | audit |");
  lines.push("| --- | --- | ---: | --- | --- | --- | ---: | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
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
        round(point.returnMap.features.ESV_L?.centralSlope ?? NaN, 4),
        round(point.returnMap.twoBeatSamePhase?.features.ESV_L?.centralSlope ?? NaN, 4),
        round(finiteMaxOrNull([
          Math.abs(point.returnMap.features.EDV_L?.centralSlope ?? Number.NaN),
          Math.abs(point.returnMap.features.ESV_L?.centralSlope ?? Number.NaN),
        ]) ?? NaN, 4),
        round(finiteMaxOrNull([
          Math.abs(point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? Number.NaN),
          Math.abs(point.returnMap.twoBeatSamePhase?.features.ESV_L?.centralSlope ?? Number.NaN),
        ]) ?? NaN, 4),
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
  lines.push("- Branch localization is report-only: `edv-dominant` means preload/EDV branch motion dominates, `esv/ejection-dominant` means CO/ESV branch motion dominates, and `mixed` is ambiguous.");
  lines.push("- LA/MV filling diagnostics are report-only regime markers for testing whether MV A-flow, mid-diastolic flow, LA A-loop collapse, MV event counts, or E/mid/A morphology alternation co-localizes with low-preload or hypervolume alternans onset.");
  lines.push("- Waveform gates compare normal and HR100 settled waveforms against the tau=0 baseline; they are report-only in this PR.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function matrixReportToCsv(report: MatrixReport): string {
  const columns = [
    "scenarioClassification",
    "scenarioBranchEnvelopeClass",
    "scenarioBranchLocalizationClass",
    "scenarioReasons",
    "worstDeltaCleanSlopeCovered",
    "uncoveredWorstDeltaReason",
    "cleanSlopeCoverageClass",
    "cleanSlopeCoveredDeltasMl",
    "cleanSlopeMissingDeltasMl",
    "returnMapEvidenceLevel",
    "requiresFullJacobianConfirmation",
    "heartModel",
    "lambdaActScope",
    "lambdaActTerms",
    "lambdaActTauSec",
    "lowStretchLimiterMode",
    "lowStretchLimiterScope",
    "activeReservePreset",
    "dt",
    "tbvCorrectionMode",
    "aorticFlowClampMode",
    "AoV_B",
    "AoV_Amax",
    "AoV_Aref",
    "deltaVolumeMl",
    "periodBeats",
    "CO_L",
    "LAPMean",
    "branchAmplitudeFractionCO_L",
    "branchAmplitudeFractionEDV_L",
    "branchAmplitudeFractionESV_L",
    "branchAmplitudeFractionQAoMax",
    "branchAmplitudeFractionAoPMax",
    "scenarioMaxQAoCapRatio",
    "scenarioMaxQAoNearCap95Fraction",
    "scenarioMaxQAoAtCapFraction",
    "scenarioMaxQAoLocalCapActiveFraction",
    "normalAoVMeanGradient",
    "normalAoVPeakGradient",
    "normalAoVFlowWeightedTotalGradient",
    "normalAoVFlowWeightedOrificeGradient",
    "normalAoVFlowWeightedResistiveGradient",
    "normalAoVFlowWeightedBernoulliGradient",
    "normalAoVFlowWeightedInertialGradient",
    "normalAoVFlowWeightedResidualGradient",
    "normalAoVPeakOrificeGradient",
    "normalAoVPeakInertialGradient",
    "normalAoVPeakResidualGradient",
    "normalQAoPeakMeanRatio",
    "normalEjectionDurationMs",
    "perDeltaBranchEnvelopeClass",
    "perDeltaBranchLocalizationClass",
    "MV_E_forward_mL",
    "MV_A_forward_mL",
    "MV_A_fraction",
    "MV_E_peak",
    "MV_A_peak",
    "MV_mid_forward_mL",
    "MV_mid_peak",
    "MV_forward_peak_count",
    "MV_mid_forward_peak_count",
    "QMV_near_zero_return_count",
    "MV_open_close_reopen_count",
    "MV_interwave_xi_min",
    "MV_interwave_open01_min",
    "LAP_LVP_zero_crossing_count",
    "fillingMorphologyClass",
    "fillingBranch_MV_A_forward_abs",
    "fillingBranch_MV_A_forward_fraction",
    "fillingBranch_MV_mid_forward_abs",
    "fillingBranch_MV_mid_forward_fraction",
    "fillingBranch_LA_A_loop_area_abs",
    "fillingBranch_LA_A_loop_area_fraction",
    "fillingBranch_atrialSystoleMVOpenFraction_abs",
    "fillingBranch_nearZeroReturnCountA",
    "fillingBranch_nearZeroReturnCountB",
    "fillingBranch_nearZeroReturnAlternates",
    "fillingBranch_reopenCountA",
    "fillingBranch_reopenCountB",
    "fillingBranch_reopenCountAlternates",
    "fillingBranch_pressureCrossingCountA",
    "fillingBranch_pressureCrossingCountB",
    "fillingBranch_pressureCrossingAlternates",
    "fillingBranch_interwaveXiMinAbs",
    "fillingBranch_interwaveOpen01MinAbs",
    "fillingBranch_forwardPeakCountA",
    "fillingBranch_forwardPeakCountB",
    "fillingBranch_peakCountAlternates",
    "fillingBranch_morphologyClassA",
    "fillingBranch_morphologyClassB",
    "fillingBranch_morphologyAlternates",
    "LA_A_loop_area",
    "LA_A_loop_fraction",
    "atrialSystoleTransmitralGradientMean",
    "atrialSystoleTransmitralGradientMax",
    "atrialSystoleMVOpenFraction",
    "cleanForReturnMapSlope",
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
    "oneBeatESVSlope",
    "twoBeatESVSlope",
    "maxAbsOneBeatVolumeFeatureSlope",
    "maxAbsTwoBeatVolumeFeatureSlope",
  ];
  const rows = [columns.join(",")];
  for (const scenario of report.scenarios) {
    const selected = new Set(scenario.selectedDeltasMl.map(String));
    const perDeltaByDelta = new Map(scenario.perDeltaEvaluation.map((entry) => [String(entry.deltaVolumeMl), entry]));
    for (const point of scenario.points) {
      const perDelta = perDeltaByDelta.get(String(point.deltaVolumeMl));
      rows.push([
        scenario.evaluation.classification,
        scenario.evaluation.branchEnvelopeClass,
        scenario.evaluation.branchLocalizationClass,
        scenario.evaluation.reasons.join("; "),
        scenario.evaluation.worstDeltaCleanSlopeCovered ? "yes" : "no",
        scenario.evaluation.uncoveredWorstDeltaReason ?? "",
        scenario.evaluation.cleanSlopeCoverageClass,
        scenario.evaluation.cleanSlopeCoveredDeltasMl.join(";"),
        scenario.evaluation.cleanSlopeMissingDeltasMl.join(";"),
        scenario.evaluation.returnMapEvidenceLevel,
        scenario.evaluation.requiresFullJacobianConfirmation ? "yes" : "no",
        scenario.heartModel,
        scenario.lambdaActScope,
        scenario.lambdaActTerms,
        scenario.lambdaActTauSec,
        scenario.lowStretchLimiterMode,
        scenario.lowStretchLimiterScope,
        scenario.activeReservePreset,
        scenario.dt,
        scenario.tbvCorrectionMode,
        scenario.aorticFlowClampMode,
        scenario.aovB,
        scenario.aovAmax,
        scenario.aovAref,
        point.deltaVolumeMl,
        point.settle.periodBeats ?? 1,
        point.periodMetrics.CO_L,
        point.periodMetrics.LAPMean,
        point.returnMap.branchAmplitudeFraction.CO_L ?? "",
        point.returnMap.branchAmplitudeFraction.EDV_L ?? "",
        point.returnMap.branchAmplitudeFraction.ESV_L ?? "",
        point.returnMap.branchAmplitudeFraction.QAoMax ?? "",
        point.returnMap.branchAmplitudeFraction.AoPMax ?? "",
        scenario.returnMapSummary.maxQAoCapRatioMax,
        scenario.returnMapSummary.maxQAoNearCap95Fraction,
        scenario.returnMapSummary.maxQAoAtCapFraction,
        scenario.returnMapSummary.maxQAoLocalCapActiveFraction,
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVMeanGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVPeakGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedTotalGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedOrificeGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedResistiveGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedBernoulliGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedInertialGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedResidualGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVPeakOrificeGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVPeakInertialGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVPeakResidualGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.QAoPeakMeanRatio ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.ejectionDurationMs ?? "",
        perDelta?.branchEnvelopeClass ?? "",
        perDelta?.branchLocalizationClass ?? "",
        perDelta?.MV_E_forward_mL ?? "",
        perDelta?.MV_A_forward_mL ?? "",
        perDelta?.MV_A_fraction ?? "",
        perDelta?.MV_E_peak ?? "",
        perDelta?.MV_A_peak ?? "",
        perDelta?.MV_mid_forward_mL ?? "",
        perDelta?.MV_mid_peak ?? "",
        perDelta?.MV_forward_peak_count ?? "",
        perDelta?.MV_mid_forward_peak_count ?? "",
        perDelta?.QMV_near_zero_return_count ?? "",
        perDelta?.MV_open_close_reopen_count ?? "",
        perDelta?.MV_interwave_xi_min ?? "",
        perDelta?.MV_interwave_open01_min ?? "",
        perDelta?.LAP_LVP_zero_crossing_count ?? "",
        perDelta?.fillingMorphologyClass ?? "",
        perDelta?.fillingBranch?.MV_A_forward_abs ?? "",
        perDelta?.fillingBranch?.MV_A_forward_fraction ?? "",
        perDelta?.fillingBranch?.MV_mid_forward_abs ?? "",
        perDelta?.fillingBranch?.MV_mid_forward_fraction ?? "",
        perDelta?.fillingBranch?.LA_A_loop_area_abs ?? "",
        perDelta?.fillingBranch?.LA_A_loop_area_fraction ?? "",
        perDelta?.fillingBranch?.atrialSystoleMVOpenFraction_abs ?? "",
        perDelta?.fillingBranch?.nearZeroReturnCountA ?? "",
        perDelta?.fillingBranch?.nearZeroReturnCountB ?? "",
        perDelta?.fillingBranch?.nearZeroReturnAlternates ? "yes" : "no",
        perDelta?.fillingBranch?.reopenCountA ?? "",
        perDelta?.fillingBranch?.reopenCountB ?? "",
        perDelta?.fillingBranch?.reopenCountAlternates ? "yes" : "no",
        perDelta?.fillingBranch?.pressureCrossingCountA ?? "",
        perDelta?.fillingBranch?.pressureCrossingCountB ?? "",
        perDelta?.fillingBranch?.pressureCrossingAlternates ? "yes" : "no",
        perDelta?.fillingBranch?.interwaveXiMinAbs ?? "",
        perDelta?.fillingBranch?.interwaveOpen01MinAbs ?? "",
        perDelta?.fillingBranch?.forwardPeakCountA ?? "",
        perDelta?.fillingBranch?.forwardPeakCountB ?? "",
        perDelta?.fillingBranch?.peakCountAlternates ? "yes" : "no",
        perDelta?.fillingBranch?.morphologyClassA ?? "",
        perDelta?.fillingBranch?.morphologyClassB ?? "",
        perDelta?.fillingBranch?.morphologyAlternates ? "yes" : "no",
        perDelta?.LA_A_loop_area ?? "",
        perDelta?.LA_A_loop_fraction ?? "",
        perDelta?.atrialSystoleTransmitralGradientMean ?? "",
        perDelta?.atrialSystoleTransmitralGradientMax ?? "",
        perDelta?.atrialSystoleMVOpenFraction ?? "",
        perDelta?.cleanForReturnMapSlope ? "yes" : "no",
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
        point.returnMap.features.ESV_L?.centralSlope ?? "",
        point.returnMap.twoBeatSamePhase?.features.ESV_L?.centralSlope ?? "",
        perDelta?.maxAbsOneBeatVolumeFeatureSlope ?? "",
        perDelta?.maxAbsTwoBeatVolumeFeatureSlope ?? "",
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
    heartModels: DEFAULT_HEART_MODELS,
    deltasMl: DEFAULT_DELTAS,
    dtValues: DEFAULT_DT_VALUES,
    lambdaActTauSecValues: DEFAULT_TAU_VALUES,
    lambdaActScopes: DEFAULT_SCOPES,
    lambdaActTermsValues: DEFAULT_TERMS,
    lowStretchLimiterModes: DEFAULT_LOW_STRETCH_LIMITERS,
    lowStretchLimiterScopes: DEFAULT_LOW_STRETCH_LIMITER_SCOPES,
    activeReservePresets: DEFAULT_ACTIVE_RESERVE_PRESETS,
    tbvCorrectionModes: DEFAULT_TBV_CORRECTION_MODES,
    aorticFlowClampModes: DEFAULT_AORTIC_FLOW_CLAMP_MODES,
    aovBValues: DEFAULT_AOV_B_VALUES,
    asAovAmaxValues: DEFAULT_AS_AOV_AMAX_VALUES,
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
    else if (key === "--heart-model" && value) opts.heartModels = parseHeartModels(value);
    else if (key === "--deltas" && value) opts.deltasMl = parseNumberList(value);
    else if (key === "--dt" && value) opts.dtValues = parseNumberList(value);
    else if (key === "--lambda-act-tau" && value) opts.lambdaActTauSecValues = parseNumberList(value);
    else if (key === "--lambda-act-scope" && value) opts.lambdaActScopes = parseScopes(value);
    else if (key === "--lambda-act-terms" && value) opts.lambdaActTermsValues = parseTerms(value);
    else if (key === "--low-stretch-limiter" && value) opts.lowStretchLimiterModes = parseLowStretchLimiterModes(value);
    else if (key === "--low-stretch-limiter-scope" && value) opts.lowStretchLimiterScopes = parseScopes(value);
    else if (key === "--active-reserve-preset" && value) opts.activeReservePresets = parseActiveReservePresets(value);
    else if (key === "--tbv-correction" && value) opts.tbvCorrectionModes = parseTBVCorrectionModes(value);
    else if (key === "--aortic-flow-clamp" && value) opts.aorticFlowClampModes = parseAorticFlowClampModes(value);
    else if (key === "--aov-b" && value) opts.aovBValues = normalizeAovValues(parseNumberList(value), DEFAULT_AOV_B);
    else if (key === "--as-aov-amax" && value) opts.asAovAmaxValues = normalizeAovValues(parseNumberList(value), DEFAULT_AOV_AMAX);
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

function parseAorticFlowClampModes(value: string): AorticFlowClampMode[] {
  const modes = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const mode of modes) {
    if (!isAorticFlowClampMode(mode)) throw new Error(`Invalid AoV flow clamp mode: ${mode}`);
  }
  const unique = Array.from(new Set(modes)) as AorticFlowClampMode[];
  return unique.sort((a, b) => (a === "hard" ? -1 : b === "hard" ? 1 : a.localeCompare(b)));
}

function isAorticFlowClampMode(value: string): value is AorticFlowClampMode {
  return value === "hard"
    || value === "soft-tanh"
    || value === "soft-rational"
    || value === "local-c1-0.90"
    || value === "local-c1-0.95"
    || value === "local-c1-0.98"
    || value === "local-c2-0.95"
    || value === "local-c2-0.98";
}

function parseHeartModels(value: string): HeartModelMode[] {
  const modes = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const mode of modes) {
    if (mode !== "activeStress" && mode !== "elastance") throw new Error(`Invalid heart model: ${mode}`);
  }
  return modes as HeartModelMode[];
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

function normalizeAovValues(values: number[], defaultValue: number): number[] {
  const positive = values.filter((value) => Number.isFinite(value) && value > 0);
  const all = [defaultValue, ...positive];
  return Array.from(new Set(all.map((value) => String(value)))).map(Number)
    .sort((a, b) => (a === defaultValue ? -1 : b === defaultValue ? 1 : a - b));
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

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

function finiteMaxOrNull(values: number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : null;
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
    "       [--heart-model=activeStress,elastance]",
    "       [--deltas=0,-900,-1250] [--dt=0.001,0.0005] [--lambda-act-tau=0,0.15]",
    "       [--lambda-act-scope=lv,ventricles] [--lambda-act-terms=kd,fiso,kd+fiso]",
    "       [--low-stretch-limiter=none,aInfCap,activeReserveCap] [--low-stretch-limiter-scope=lv,ventricles]",
    "       [--active-reserve-preset=directMild,directMedium,thresholdMild,thresholdMedium]",
    "       [--tbv-correction=on,off,low]",
    "       [--aortic-flow-clamp=hard,soft-tanh,soft-rational,local-c1-0.95,local-c2-0.98]",
    "       [--aov-b=0.000001,0.00001,0.00003] [--as-aov-amax=3.5,2,1.5,1]",
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
