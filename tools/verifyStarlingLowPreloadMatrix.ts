import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore, type AorticFlowClampMode, type AorticValveQUpdateMode } from "@/engine/ModelCore";
import type { LambdaActTerms, LowStretchLimiterMode } from "@/engine/chambers";
import { DYNAMIC_FLOW_CLAMP_ML_PER_S } from "@/engine/core/topology";
import { clamp } from "@/engine/math";
import type { CoreRuntimeParams, HeartModelMode, SimSample } from "@/engine/protocol";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import {
  paramsWithLambdaActTau,
  paramsWithAorticValveComparator,
  paramsWithLowStretchLimiter,
  paramsWithTensionComparator,
  DEFAULT_AOV_AMAX,
  DEFAULT_AOV_AREF,
  DEFAULT_AOV_B,
  DEFAULT_AOV_Q_DOT_CLAMP,
  DEFAULT_AOV_L,
  DEFAULT_AOV_TAU_CLOSE,
  DEFAULT_AOV_TAU_OPEN,
  DEFAULT_ARTERIAL_STIFFNESS,
  DEFAULT_SYSTEMIC_RESISTANCE,
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
  aovLValues: number[];
  aovTauOpenValues: number[];
  aovTauCloseValues: number[];
  systemicResistanceValues: number[];
  arterialStiffnessValues: number[];
  tensionRiseSecValues: number[];
  tensionFallSecValues: number[];
  aovQDotClampValues: number[];
  aovQDotClampPairs: AovQDotClampConfig[];
  aovQUpdateModes: AorticValveQUpdateMode[];
  maxReturnMapPoints: number;
  traceBeats: number;
  sampleHz: number;
  includeAllScope: boolean;
  progress?: boolean;
  partialWrite?: (report: MatrixReport) => void;
};

type AovQDotClampConfig = {
  positive: number;
  negative: number;
};

type WaveformGateLabel = "normal" | "HR100" | "HR100-rearm";

type AoVOpen01BinKey =
  | "open-lt-0.2"
  | "open-0.2-0.8"
  | "open-0.8-0.95"
  | "open-gte-0.95";

type AoVQDotEventDirectionKey =
  | "low-open-opening-accel"
  | "low-open-pressure-reversal-decel"
  | "low-open-forward-coast-adverse"
  | "low-open-true-opening-rest";

type AoVQDotTargetBinStats = {
  sampleCount: number;
  rawToClampRatioMax: number;
  rawToClampRatioPositiveMax: number;
  rawToClampRatioNegativeMax: number;
  requiredReductionFractionMax: number;
  pressureExcessOverClampMaxMmHg: number;
  equivalentExtraBAtMaxExcess: number;
  qAoAtMaxExcess: number;
  dPAtMaxExcess: number;
  qCurrentAtMaxExcess: number;
  qNextPreDiodeAtMaxExcess: number;
  qNextPreFlowClampAtMaxExcess: number;
  qDotPreClampAtMaxExcess: number;
  qDotRawAtMaxExcess: number;
  qDotRawPositiveMax: number;
  qDotRawNegativeMin: number;
  open01AtMaxExcess: number;
  open01DeltaAtMaxExcess: number;
};

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
  AoVFlowWeightedFullOpenOrificeGradient: number;
  AoVFlowWeightedAreaLossExtraGradient: number;
  AoVFlowWeightedOpen01: number;
  AoVPeakOrificeGradient: number;
  AoVPeakInertialGradient: number;
  AoVPeakResidualGradient: number;
  AoVPeakAreaLossExtraGradient: number;
  AoVOpen01AtQAoMax: number;
  AoVMeanOpen01DuringEjection: number;
  AoVTimeToNearFullOpenMs: number;
  AoVClosureResidualMean: number;
  AoVFlowWeightedClosureResidual: number;
  AoVClosureResidualAtQAoMax: number;
  AoVClosureResidualSV5To95Mean: number;
  AoVFlowWeightedClosureResidualSV5To95: number;
  AoVSolverClosureResidualMean: number;
  AoVFlowWeightedSolverClosureResidual: number;
  AoVDiscreteClosureResidualMean: number;
  AoVFlowWeightedDiscreteClosureResidual: number;
  AoVCleanClosureResidualMean: number;
  AoVFlowWeightedCleanClosureResidual: number;
  AoVCleanCandidateSampleCount: number;
  AoVCleanClosureSampleCount: number;
  AoVDiodeImpulseGradientMean: number;
  AoVFlowWeightedDiodeImpulseGradient: number;
  AoVFlowClampImpulseGradientMean: number;
  AoVFlowWeightedFlowClampImpulseGradient: number;
  AoVQDotClampImpulseGradientMean: number;
  AoVFlowWeightedQDotClampImpulseGradient: number;
  AoVQDotRawMaxAbs: number;
  AoVQDotPostMaxAbs: number;
  AoVQDotClampImpulseMaxAbs: number;
  AoVQDotClampHitFraction: number;
  AoVQDotClampHitFractionPositive: number;
  AoVQDotClampHitFractionSV5To95: number;
  AoVQDotClampHitFractionFivePercentPeak: number;
  AoVQDotClampHitFractionNearFullOpen: number;
  AoVQDotClampHitFractionCleanCandidate: number;
  AoVQDotTargetClampMlPerS2: number;
  AoVQDotTargetPositiveClampMlPerS2: number;
  AoVQDotTargetNegativeClampMlPerS2: number;
  AoVQDotRawToClampRatioMax: number;
  AoVQDotRawToClampRatioSV5To95Max: number;
  AoVQDotRawToClampRatioCleanCandidateMax: number;
  AoVQDotRequiredReductionFractionMax: number;
  AoVQDotRequiredReductionFractionSV5To95Max: number;
  AoVQDotRequiredReductionFractionCleanCandidateMax: number;
  AoVQDotPressureExcessOverClampMaxMmHg: number;
  AoVQDotPressureExcessOverClampSV5To95MaxMmHg: number;
  AoVQDotPressureExcessOverClampCleanCandidateMaxMmHg: number;
  AoVQDotEquivalentExtraBAtMaxExcess: number;
  AoVQDotEquivalentExtraBAtSV5To95MaxExcess: number;
  AoVQDotEquivalentExtraBAtCleanCandidateMaxExcess: number;
  AoVQDotMaxExcessSampleQAo: number;
  AoVQDotMaxExcessSampleOpen01: number;
  AoVQDotOpen01Bins: Record<AoVOpen01BinKey, AoVQDotTargetBinStats>;
  AoVQDotEventDirectionBins: Record<AoVQDotEventDirectionKey, AoVQDotTargetBinStats>;
  QAoPeakMeanRatio: number;
  QAoMeanPositive: number;
  QAoTimeToPeakMs: number;
  maxDQAoDt: number;
  ejectionDurationMs: number;
  ejectionPositiveDurationMs: number;
  ejectionFivePercentPeakDurationMs: number;
  ejectionSV5To95DurationMs: number;
  ejectionHighFlowDurationMs: number;
  maxDpdtLVP: number;
  minDpdtLVP: number;
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
    | "AoVFlowWeightedAreaLossExtraGradient"
    | "AoVFlowWeightedClosureResidual"
    | "AoVClosureResidualSV5To95Mean"
    | "AoVFlowWeightedCleanClosureResidual"
    | "AoVQDotClampHitFraction"
    | "AoVQDotRawMaxAbs"
    | "QAoPeakMeanRatio"
    | "QAoMeanPositive"
    | "QAoTimeToPeakMs"
    | "maxDQAoDt"
    | "ejectionDurationMs"
    | "ejectionPositiveDurationMs"
    | "ejectionFivePercentPeakDurationMs"
    | "ejectionSV5To95DurationMs"
    | "maxDpdtLVP"
    | "minDpdtLVP"
    | "clampHitCount"
    | "valveReverseVolumeMl"
  >;
  maxDeltaMetric: keyof WaveformGateComparison["delta"];
  maxDeltaFraction: number;
};

type NegativeQDotSummary = {
  pressureReversalSampleCountMax: number;
  pressureReversalNegativeRatioMax: number;
  pressureReversalPressureExcessMaxMmHg: number;
  forwardCoastSampleCountMax: number;
  forwardCoastNegativeRatioMax: number;
  forwardCoastPressureExcessMaxMmHg: number;
  cleanQDotHitFractionMax: number;
  cleanClosureResidualAbsMax: number;
  sv5To95QDotHitFractionMax: number;
  qDotClampImpulseAbsMax: number;
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
  aovL: number;
  aovTauOpen: number;
  aovTauClose: number;
  systemicResistance: number;
  arterialStiffness: number;
  tensionRiseSec: number;
  tensionFallSec: number;
  aovQDotClamp: number;
  aovQDotClampNegative: number;
  aovQUpdateMode: AorticValveQUpdateMode;
  selectedDeltasMl: number[];
  evaluation: ScenarioEvaluation;
  shapeSummary: ShapeSummary;
  branchSummary: DebugReport["summary"];
  returnMapSummary: DebugReport["summary"];
  negativeQDotSummary: NegativeQDotSummary;
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
  schemaVersion: 25;
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
  aovLValues: number[];
  aovTauOpenValues: number[];
  aovTauCloseValues: number[];
  systemicResistanceValues: number[];
  arterialStiffnessValues: number[];
  tensionRiseSecValues: number[];
  tensionFallSecValues: number[];
  aovQDotClampValues: number[];
  aovQDotClampPairs: AovQDotClampConfig[];
  aovQUpdateModes: AorticValveQUpdateMode[];
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
    maxAoVFlowWeightedAreaLossExtraGradient: number;
    maxAoVFlowWeightedResidualGradient: number;
    maxAoVFlowWeightedClosureResidual: number;
    maxAoVFlowWeightedSolverClosureResidual: number;
    maxAoVClosureResidualSV5To95Mean: number;
    maxAoVFlowWeightedClosureResidualSV5To95: number;
    maxAoVFlowWeightedCleanClosureResidual: number;
    maxAoVFlowWeightedQDotClampImpulseGradient: number;
    maxAoVQDotRawMaxAbs: number;
    maxAoVQDotClampHitFraction: number;
    maxAoVQDotClampHitFractionSV5To95: number;
    maxAoVQDotClampHitFractionCleanCandidate: number;
    maxAoVQDotRawToClampRatioMax: number;
    maxAoVQDotRequiredReductionFractionMax: number;
    maxAoVQDotPressureExcessOverClampMaxMmHg: number;
    maxAoVQDotEquivalentExtraBAtMaxExcess: number;
    maxLowOpenPressureReversalNegativeRatio: number;
    maxLowOpenPressureReversalPressureExcessMmHg: number;
    maxLowOpenForwardCoastNegativeRatio: number;
    maxLowOpenForwardCoastPressureExcessMmHg: number;
    maxCleanQDotHitFraction: number;
    maxCleanClosureResidualAbs: number;
    maxSV5To95QDotHitFraction: number;
    maxQDotClampImpulseAbs: number;
    maxQAoPeakMeanRatio: number;
    maxQAoMeanPositive: number;
    minQAoTimeToPeakMs: number;
    maxDQAoDt: number;
    minEjectionDurationMs: number;
    minEjectionPositiveDurationMs: number;
    minEjectionFivePercentPeakDurationMs: number;
    minEjectionSV5To95DurationMs: number;
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
const DEFAULT_AOV_L_VALUES = [DEFAULT_AOV_L];
const DEFAULT_AOV_TAU_OPEN_VALUES = [DEFAULT_AOV_TAU_OPEN];
const DEFAULT_AOV_TAU_CLOSE_VALUES = [DEFAULT_AOV_TAU_CLOSE];
const DEFAULT_SYSTEMIC_RESISTANCE_VALUES = [DEFAULT_SYSTEMIC_RESISTANCE];
const DEFAULT_ARTERIAL_STIFFNESS_VALUES = [DEFAULT_ARTERIAL_STIFFNESS];
const DEFAULT_TENSION_RISE_SEC_VALUES = [0];
const DEFAULT_TENSION_FALL_SEC_VALUES = [0];
const DEFAULT_AOV_Q_DOT_CLAMP_VALUES = [DEFAULT_AOV_Q_DOT_CLAMP];
const DEFAULT_AOV_Q_DOT_CLAMP_PAIRS: AovQDotClampConfig[] = [];
const DEFAULT_AOV_Q_UPDATE_MODES: AorticValveQUpdateMode[] = ["current-loss"];
const WAVEFORM_RUN_OPTIONS = { collectSamples: false, recordHistory: true, historyLimit: 720 };
const WAVEFORM_SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 };

function effectiveAovQDotClampConfigs(opts: Pick<MatrixOptions, "aovQDotClampValues" | "aovQDotClampPairs">): AovQDotClampConfig[] {
  if (opts.aovQDotClampPairs.length > 0) {
    return opts.aovQDotClampPairs.map((pair) => ({
      positive: positiveOrDefault(pair.positive, DEFAULT_AOV_Q_DOT_CLAMP),
      negative: positiveOrDefault(pair.negative, positiveOrDefault(pair.positive, DEFAULT_AOV_Q_DOT_CLAMP)),
    }));
  }
  return opts.aovQDotClampValues.map((value) => {
    const clampValue = positiveOrDefault(value, DEFAULT_AOV_Q_DOT_CLAMP);
    return { positive: clampValue, negative: clampValue };
  });
}

function positiveOrDefault(value: number, defaultValue: number): number {
  return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

function aovQDotClampLabel(positive: number, negative: number): string {
  return positive === negative ? String(positive) : `+${positive}/-${negative}`;
}

export function runLowPreloadMatrix(opts: MatrixOptions): MatrixReport {
  const scopes = opts.includeAllScope
    ? Array.from(new Set([...opts.lambdaActScopes, "all" as LambdaActScope]))
    : opts.lambdaActScopes;
  const scenarios: MatrixScenario[] = [];
  const waveformBaselineCache = new Map<string, WaveformGateMetrics>();
  const branchBaselineCache = new Map<string, DebugPoint[]>();
  const specs = matrixScenarioSpecs(opts, scopes);
  specs.forEach((spec, index) => {
    const {
      heartModel,
      lambdaActScope,
      lambdaActTauSec,
      lambdaActTerms,
      lowStretchLimiterMode,
      lowStretchLimiterScope,
      activeReservePreset,
      tbvCorrectionMode,
      aorticFlowClampMode,
      aovB,
      aovAmax,
      aovL,
      aovTauOpen,
      aovTauClose,
      systemicResistance,
      arterialStiffness,
      tensionRiseSec,
      tensionFallSec,
      aovQDotClamp,
      aovQDotClampNegative,
      aovQUpdateMode,
      dt,
    } = spec;
    if (opts.progress) {
      // eslint-disable-next-line no-console
      console.log(
        `[matrix] ${index + 1}/${specs.length} heart=${heartModel} dt=${dt} tau=${lambdaActTauSec} scope=${lambdaActScope} terms=${lambdaActTerms} limiter=${lowStretchLimiterMode}/${lowStretchLimiterScope} preset=${activeReservePreset} tbv=${tbvCorrectionMode} aovClamp=${aorticFlowClampMode} AoV_B=${aovB} AoV_L=${aovL} AoV_tau=${aovTauOpen}/${aovTauClose} AoV_Amax=${aovAmax} SVR=${systemicResistance} artStiff=${arterialStiffness} tensionRise=${tensionRiseSec} tensionFall=${tensionFallSec} qDotClamp=${aovQDotClampLabel(aovQDotClamp, aovQDotClampNegative)} qUpdate=${aovQUpdateMode}`,
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
      aovL,
      aovTauOpen,
      aovTauClose,
      systemicResistance,
      arterialStiffness,
      tensionRiseSec,
      tensionFallSec,
      aovQDotClamp,
      aovQDotClampNegative,
      aovQUpdateMode,
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
        aovL,
        aovTauOpen,
        aovTauClose,
        systemicResistance,
        arterialStiffness,
        tensionRiseSec,
        tensionFallSec,
        aovQDotClamp,
        aovQDotClampNegative,
        aovQUpdateMode,
        traceBeats: opts.traceBeats,
        sampleHz: opts.sampleHz,
        returnMapMode: "both",
        returnMapDeltasMl: selectedDeltasMl,
        quietClampLog: true,
      });
    const baselineKey = branchBaselineKey(heartModel, dt, tbvCorrectionMode);
    if (isDefaultAorticValveComparator(aovB, aovAmax, aovL, aovTauOpen, aovTauClose, systemicResistance, arterialStiffness)
      && lambdaActTauSec === 0
      && lowStretchLimiterMode === "none"
      && aorticFlowClampMode === "hard"
      && tensionRiseSec <= 0
      && tensionFallSec <= 0
      && aovQDotClamp === DEFAULT_AOV_Q_DOT_CLAMP
      && aovQDotClampNegative === DEFAULT_AOV_Q_DOT_CLAMP
      && aovQUpdateMode === "current-loss") {
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
      aovL,
      aovTauOpen,
      aovTauClose,
      systemicResistance,
      arterialStiffness,
      tensionRiseSec,
      tensionFallSec,
      aovQDotClamp,
      aovQDotClampNegative,
      aovQUpdateMode,
      waveformBaselineCache,
    );
    const shapeSummary = buildShapeSummary(branchReport.points, baselinePoints);
    const negativeQDotSummary = buildNegativeQDotSummary(waveformGates);
    const evaluation = buildScenarioEvaluation({
      lowStretchLimiterMode,
      lambdaActTauSec,
      aorticFlowClampMode,
      aovB,
      aovAmax,
      aovL,
      aovTauOpen,
      aovTauClose,
      systemicResistance,
      arterialStiffness,
      tensionRiseSec,
      tensionFallSec,
      aovQDotClamp,
      aovQDotClampNegative,
      aovQUpdateMode,
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
      aovL,
      aovTauOpen,
      aovTauClose,
      systemicResistance,
      arterialStiffness,
      tensionRiseSec,
      tensionFallSec,
      aovQDotClamp,
      aovQDotClampNegative,
      aovQUpdateMode,
      selectedDeltasMl,
      evaluation,
      shapeSummary,
      branchSummary: branchReport.summary,
      returnMapSummary: returnMapReport.summary,
      negativeQDotSummary,
      waveformGates,
      perDeltaEvaluation,
      points: returnMapReport.points,
    });
    opts.partialWrite?.(buildMatrixReport(opts, scopes, scenarios));
  });
  return buildMatrixReport(opts, scopes, scenarios);
}

function buildNegativeQDotSummary(waveformGates: WaveformGateComparison[]): NegativeQDotSummary {
  const pressureReversalBins = waveformGates.map((gate) => gate.candidate.AoVQDotEventDirectionBins["low-open-pressure-reversal-decel"]);
  const forwardCoastBins = waveformGates.map((gate) => gate.candidate.AoVQDotEventDirectionBins["low-open-forward-coast-adverse"]);
  return {
    pressureReversalSampleCountMax: Math.max(0, ...pressureReversalBins.map((bin) => finiteOrZero(bin.sampleCount))),
    pressureReversalNegativeRatioMax: Math.max(0, ...pressureReversalBins.map((bin) => finiteOrZero(bin.rawToClampRatioNegativeMax))),
    pressureReversalPressureExcessMaxMmHg: Math.max(0, ...pressureReversalBins.map((bin) => finiteOrZero(bin.pressureExcessOverClampMaxMmHg))),
    forwardCoastSampleCountMax: Math.max(0, ...forwardCoastBins.map((bin) => finiteOrZero(bin.sampleCount))),
    forwardCoastNegativeRatioMax: Math.max(0, ...forwardCoastBins.map((bin) => finiteOrZero(bin.rawToClampRatioNegativeMax))),
    forwardCoastPressureExcessMaxMmHg: Math.max(0, ...forwardCoastBins.map((bin) => finiteOrZero(bin.pressureExcessOverClampMaxMmHg))),
    cleanQDotHitFractionMax: Math.max(0, ...waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotClampHitFractionCleanCandidate))),
    cleanClosureResidualAbsMax: Math.max(0, ...waveformGates.map((gate) => Math.abs(finiteOrZero(gate.candidate.AoVFlowWeightedCleanClosureResidual)))),
    sv5To95QDotHitFractionMax: Math.max(0, ...waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotClampHitFractionSV5To95))),
    qDotClampImpulseAbsMax: Math.max(0, ...waveformGates.map((gate) => Math.abs(finiteOrZero(gate.candidate.AoVFlowWeightedQDotClampImpulseGradient)))),
  };
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
    schemaVersion: 25,
    generatedAt: new Date().toISOString(),
    measurementMode: "branch-only broad low-preload matrix followed by selected EDV-section return-map diagnostics with EDV/ESV/CO/afterload/ejection features; QAo cap proximity, localized AoV soft-cap comparator axes, off-by-default AoV_B/AoV_Amax/AoV_L/AoV_tau/systemicResistance/arterialStiffness ejection-dynamics comparator axes, off-by-default tension-rise/fall comparators, asymmetric AoV qDot positive/negative clamp, and AoV q-state update comparator axes, and fIsoSlopeRelax low-stretch active-force comparator; AoV gradient is decomposed into full-open orifice, area-loss extra, inertial, residual, direct ODE closure residual, solver qDot clamp audit, clean-window closure residual terms, report-only sign-aware qDot target-estimator terms, open01-bin qDot target-estimator terms, low-open event-direction qDot target-estimator terms, and negative qDot closure-deceleration primary readouts for sweep range selection; ejection duration is reported as QAo>0, QAo>5% peak, SV 5-95%, and historical high-flow windows; optional TBV correction on/off/low contamination axis; activeStress/elastance heart-model comparison axis",
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
    aovLValues: opts.aovLValues,
    aovTauOpenValues: opts.aovTauOpenValues,
    aovTauCloseValues: opts.aovTauCloseValues,
    systemicResistanceValues: opts.systemicResistanceValues,
    arterialStiffnessValues: opts.arterialStiffnessValues,
    tensionRiseSecValues: opts.tensionRiseSecValues,
    tensionFallSecValues: opts.tensionFallSecValues,
    aovQDotClampValues: opts.aovQDotClampValues,
    aovQDotClampPairs: effectiveAovQDotClampConfigs(opts),
    aovQUpdateModes: opts.aovQUpdateModes,
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
        maxAoVFlowWeightedAreaLossExtraGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVFlowWeightedAreaLossExtraGradient)))),
        maxAoVFlowWeightedResidualGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVFlowWeightedResidualGradient)))),
        maxAoVFlowWeightedClosureResidual: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => Math.abs(finiteOrZero(gate.candidate.AoVFlowWeightedClosureResidual))))),
        maxAoVFlowWeightedSolverClosureResidual: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => Math.abs(finiteOrZero(gate.candidate.AoVFlowWeightedSolverClosureResidual))))),
        maxAoVClosureResidualSV5To95Mean: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => Math.abs(finiteOrZero(gate.candidate.AoVClosureResidualSV5To95Mean))))),
        maxAoVFlowWeightedClosureResidualSV5To95: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => Math.abs(finiteOrZero(gate.candidate.AoVFlowWeightedClosureResidualSV5To95))))),
        maxAoVFlowWeightedCleanClosureResidual: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => Math.abs(finiteOrZero(gate.candidate.AoVFlowWeightedCleanClosureResidual))))),
        maxAoVFlowWeightedQDotClampImpulseGradient: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => Math.abs(finiteOrZero(gate.candidate.AoVFlowWeightedQDotClampImpulseGradient))))),
        maxAoVQDotRawMaxAbs: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotRawMaxAbs)))),
        maxAoVQDotClampHitFraction: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotClampHitFraction)))),
        maxAoVQDotClampHitFractionSV5To95: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotClampHitFractionSV5To95)))),
        maxAoVQDotClampHitFractionCleanCandidate: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotClampHitFractionCleanCandidate)))),
        maxAoVQDotRawToClampRatioMax: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotRawToClampRatioMax)))),
        maxAoVQDotRequiredReductionFractionMax: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotRequiredReductionFractionMax)))),
        maxAoVQDotPressureExcessOverClampMaxMmHg: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotPressureExcessOverClampMaxMmHg)))),
        maxAoVQDotEquivalentExtraBAtMaxExcess: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.AoVQDotEquivalentExtraBAtMaxExcess)))),
        maxLowOpenPressureReversalNegativeRatio: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.negativeQDotSummary.pressureReversalNegativeRatioMax))),
        maxLowOpenPressureReversalPressureExcessMmHg: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.negativeQDotSummary.pressureReversalPressureExcessMaxMmHg))),
        maxLowOpenForwardCoastNegativeRatio: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.negativeQDotSummary.forwardCoastNegativeRatioMax))),
        maxLowOpenForwardCoastPressureExcessMmHg: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.negativeQDotSummary.forwardCoastPressureExcessMaxMmHg))),
        maxCleanQDotHitFraction: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.negativeQDotSummary.cleanQDotHitFractionMax))),
        maxCleanClosureResidualAbs: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.negativeQDotSummary.cleanClosureResidualAbsMax))),
        maxSV5To95QDotHitFraction: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.negativeQDotSummary.sv5To95QDotHitFractionMax))),
        maxQDotClampImpulseAbs: Math.max(0, ...scenarios.map((s) => finiteOrZero(s.negativeQDotSummary.qDotClampImpulseAbsMax))),
        maxQAoPeakMeanRatio: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.QAoPeakMeanRatio)))),
        maxQAoMeanPositive: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.QAoMeanPositive)))),
        minQAoTimeToPeakMs: finiteMin(scenarios.flatMap((s) => s.waveformGates.map((gate) => gate.candidate.QAoTimeToPeakMs))),
        maxDQAoDt: Math.max(0, ...scenarios.flatMap((s) => s.waveformGates.map((gate) => finiteOrZero(gate.candidate.maxDQAoDt)))),
        minEjectionDurationMs: finiteMin(scenarios.flatMap((s) => s.waveformGates.map((gate) => gate.candidate.ejectionDurationMs))),
        minEjectionPositiveDurationMs: finiteMin(scenarios.flatMap((s) => s.waveformGates.map((gate) => gate.candidate.ejectionPositiveDurationMs))),
        minEjectionFivePercentPeakDurationMs: finiteMin(scenarios.flatMap((s) => s.waveformGates.map((gate) => gate.candidate.ejectionFivePercentPeakDurationMs))),
        minEjectionSV5To95DurationMs: finiteMin(scenarios.flatMap((s) => s.waveformGates.map((gate) => gate.candidate.ejectionSV5To95DurationMs))),
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
  aovL: number;
  aovTauOpen: number;
  aovTauClose: number;
  systemicResistance: number;
  arterialStiffness: number;
  tensionRiseSec: number;
  tensionFallSec: number;
  aovQDotClamp: number;
  aovQDotClampNegative: number;
  aovQUpdateMode: AorticValveQUpdateMode;
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
    aovL: number;
    aovTauOpen: number;
    aovTauClose: number;
    systemicResistance: number;
    arterialStiffness: number;
    tensionRiseSec: number;
    tensionFallSec: number;
    aovQDotClamp: number;
    aovQDotClampNegative: number;
    aovQUpdateMode: AorticValveQUpdateMode;
  }> = [];
  const aovQDotClampConfigs = effectiveAovQDotClampConfigs(opts);
  for (const heartModel of opts.heartModels) {
    for (const dt of opts.dtValues) {
      for (const tbvCorrectionMode of opts.tbvCorrectionModes) {
        for (const aorticFlowClampMode of opts.aorticFlowClampModes) {
          for (const aovB of opts.aovBValues) {
            for (const aovAmax of opts.asAovAmaxValues) {
              for (const aovL of opts.aovLValues) {
                for (const aovTauOpen of opts.aovTauOpenValues) {
                  for (const aovTauClose of opts.aovTauCloseValues) {
                    for (const systemicResistance of opts.systemicResistanceValues) {
                      for (const arterialStiffness of opts.arterialStiffnessValues) {
                        for (const tensionRiseSec of opts.tensionRiseSecValues) {
                          for (const tensionFallSec of opts.tensionFallSecValues) {
                          for (const { positive: aovQDotClamp, negative: aovQDotClampNegative } of aovQDotClampConfigs) {
                            for (const aovQUpdateMode of opts.aovQUpdateModes) {
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
                                aovL,
                                aovTauOpen,
                                aovTauClose,
                                systemicResistance,
                                arterialStiffness,
                                tensionRiseSec,
                                tensionFallSec,
                                aovQDotClamp,
                                aovQDotClampNegative,
                                aovQUpdateMode,
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
                                      aovL,
                                      aovTauOpen,
                                      aovTauClose,
                                     systemicResistance,
                                     arterialStiffness,
                                     tensionRiseSec,
                                      tensionFallSec,
                                     aovQDotClamp,
                                      aovQDotClampNegative,
                                      aovQUpdateMode,
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
                                      aovL,
                                      aovTauOpen,
                                      aovTauClose,
                                      systemicResistance,
                                      arterialStiffness,
                                      tensionRiseSec,
                                      tensionFallSec,
                                      aovQDotClamp,
                                      aovQDotClampNegative,
                                      aovQUpdateMode,
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
  aovL: number;
  aovTauOpen: number;
  aovTauClose: number;
  systemicResistance: number;
  arterialStiffness: number;
  tensionRiseSec: number;
  tensionFallSec: number;
  aovQDotClamp: number;
  aovQDotClampNegative: number;
  aovQUpdateMode: AorticValveQUpdateMode;
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
    && input.tensionRiseSec <= 0
    && input.tensionFallSec <= 0
    && input.aovQDotClamp === DEFAULT_AOV_Q_DOT_CLAMP
    && input.aovQDotClampNegative === DEFAULT_AOV_Q_DOT_CLAMP
    && input.aovQUpdateMode === "current-loss"
    && isDefaultAorticValveComparator(
      input.aovB,
      input.aovAmax,
      input.aovL,
      input.aovTauOpen,
      input.aovTauClose,
      input.systemicResistance,
      input.arterialStiffness,
    );

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
  const fIsoHitFractions = summaries.map((summary) => finiteOrZero(summary.fIsoLimiterHitFraction));
  const fIsoScales = summaries.map((summary) => Number.isFinite(summary.fIsoLimiterMin) ? summary.fIsoLimiterMin : 1);
  const fIsoReductionFractions = summaries.map((summary) => {
    if (!Number.isFinite(summary.fIsoLimiterMin)) return 0;
    return clamp(1 - summary.fIsoLimiterMin, 0, 1);
  });
  return {
    maxHitFraction: Math.max(0, ...summaries.map((summary) => finiteOrZero(summary.activeTargetLimiterHitFraction)), ...fIsoHitFractions),
    minScale: finiteMin([...summaries.map((summary) => summary.activeTargetLimiterMin), ...fIsoScales]),
    maxReductionFraction: Math.max(0, ...summaries.map((summary) => finiteOrZero(summary.sigmaActTargetReductionFractionMean)), ...fIsoReductionFractions),
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
  aovL: number,
  aovTauOpen: number,
  aovTauClose: number,
  systemicResistance: number,
  arterialStiffness: number,
  tensionRiseSec: number,
  tensionFallSec: number,
  aovQDotClamp: number,
  aovQDotClampNegative: number,
  aovQUpdateMode: AorticValveQUpdateMode,
  baselineCache: Map<string, WaveformGateMetrics>,
): WaveformGateComparison[] {
  return [
    waveformGateComparison("normal", DEFAULT_PARAMS.HR, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax, aovL, aovTauOpen, aovTauClose, systemicResistance, arterialStiffness, tensionRiseSec, tensionFallSec, aovQDotClamp, aovQDotClampNegative, aovQUpdateMode, baselineCache),
    waveformGateComparison("HR100", 100, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax, aovL, aovTauOpen, aovTauClose, systemicResistance, arterialStiffness, tensionRiseSec, tensionFallSec, aovQDotClamp, aovQDotClampNegative, aovQUpdateMode, baselineCache),
    waveformGateComparison("HR100-rearm", 100, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax, aovL, aovTauOpen, aovTauClose, systemicResistance, arterialStiffness, tensionRiseSec, tensionFallSec, aovQDotClamp, aovQDotClampNegative, aovQUpdateMode, baselineCache),
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
  aovL: number,
  aovTauOpen: number,
  aovTauClose: number,
  systemicResistance: number,
  arterialStiffness: number,
  tensionRiseSec: number,
  tensionFallSec: number,
  aovQDotClamp: number,
  aovQDotClampNegative: number,
  aovQUpdateMode: AorticValveQUpdateMode,
  baselineCache: Map<string, WaveformGateMetrics>,
): WaveformGateComparison {
  const baselineKey = `${heartModel}|${label}|${HR}|${targetVolumeMl}|${dt}|${sampleHz}`;
  let baseline = baselineCache.get(baselineKey);
  if (!baseline) {
    baseline = measureWaveformGate(label, HR, targetVolumeMl, heartModel, dt, sampleHz, "all", 0, "kd+fiso", "none", "lv", "none", "hard", DEFAULT_AOV_B, DEFAULT_AOV_AMAX, DEFAULT_AOV_L, DEFAULT_AOV_TAU_OPEN, DEFAULT_AOV_TAU_CLOSE, DEFAULT_SYSTEMIC_RESISTANCE, DEFAULT_ARTERIAL_STIFFNESS, 0, 0, DEFAULT_AOV_Q_DOT_CLAMP, DEFAULT_AOV_Q_DOT_CLAMP);
    baselineCache.set(baselineKey, baseline);
  }
  const candidate = tauSec <= 0 && lowStretchLimiterMode === "none" && aorticFlowClampMode === "hard" && tensionRiseSec <= 0 && tensionFallSec <= 0 && aovQDotClamp === DEFAULT_AOV_Q_DOT_CLAMP && aovQDotClampNegative === DEFAULT_AOV_Q_DOT_CLAMP && aovQUpdateMode === "current-loss" && isDefaultAorticValveComparator(aovB, aovAmax, aovL, aovTauOpen, aovTauClose, systemicResistance, arterialStiffness)
    ? baseline
    : measureWaveformGate(label, HR, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax, aovL, aovTauOpen, aovTauClose, systemicResistance, arterialStiffness, tensionRiseSec, tensionFallSec, aovQDotClamp, aovQDotClampNegative, aovQUpdateMode);
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
      AoVFlowWeightedAreaLossExtraGradient: candidate.AoVFlowWeightedAreaLossExtraGradient - baseline.AoVFlowWeightedAreaLossExtraGradient,
      AoVFlowWeightedClosureResidual: candidate.AoVFlowWeightedClosureResidual - baseline.AoVFlowWeightedClosureResidual,
      AoVClosureResidualSV5To95Mean: candidate.AoVClosureResidualSV5To95Mean - baseline.AoVClosureResidualSV5To95Mean,
      AoVFlowWeightedCleanClosureResidual: candidate.AoVFlowWeightedCleanClosureResidual - baseline.AoVFlowWeightedCleanClosureResidual,
      AoVQDotClampHitFraction: candidate.AoVQDotClampHitFraction - baseline.AoVQDotClampHitFraction,
      AoVQDotRawMaxAbs: candidate.AoVQDotRawMaxAbs - baseline.AoVQDotRawMaxAbs,
      QAoPeakMeanRatio: candidate.QAoPeakMeanRatio - baseline.QAoPeakMeanRatio,
      QAoMeanPositive: candidate.QAoMeanPositive - baseline.QAoMeanPositive,
      QAoTimeToPeakMs: candidate.QAoTimeToPeakMs - baseline.QAoTimeToPeakMs,
      maxDQAoDt: candidate.maxDQAoDt - baseline.maxDQAoDt,
      ejectionDurationMs: candidate.ejectionDurationMs - baseline.ejectionDurationMs,
      ejectionPositiveDurationMs: candidate.ejectionPositiveDurationMs - baseline.ejectionPositiveDurationMs,
      ejectionFivePercentPeakDurationMs: candidate.ejectionFivePercentPeakDurationMs - baseline.ejectionFivePercentPeakDurationMs,
      ejectionSV5To95DurationMs: candidate.ejectionSV5To95DurationMs - baseline.ejectionSV5To95DurationMs,
      maxDpdtLVP: candidate.maxDpdtLVP - baseline.maxDpdtLVP,
      minDpdtLVP: candidate.minDpdtLVP - baseline.minDpdtLVP,
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
  aovL: number = DEFAULT_AOV_L,
  aovTauOpen: number = DEFAULT_AOV_TAU_OPEN,
  aovTauClose: number = DEFAULT_AOV_TAU_CLOSE,
  systemicResistance: number = DEFAULT_SYSTEMIC_RESISTANCE,
  arterialStiffness: number = DEFAULT_ARTERIAL_STIFFNESS,
  tensionRiseSec: number = 0,
  tensionFallSec: number = 0,
  aovQDotClamp: number = DEFAULT_AOV_Q_DOT_CLAMP,
  aovQDotClampNegative: number = aovQDotClamp,
  aovQUpdateMode: AorticValveQUpdateMode = "current-loss",
): WaveformGateMetrics {
  return withQuietClampLogs(() => measureWaveformGateImpl(label, HR, targetVolumeMl, heartModel, dt, sampleHz, scope, tauSec, terms, lowStretchLimiterMode, lowStretchLimiterScope, activeReservePreset, aorticFlowClampMode, aovB, aovAmax, aovL, aovTauOpen, aovTauClose, systemicResistance, arterialStiffness, tensionRiseSec, tensionFallSec, aovQDotClamp, aovQDotClampNegative, aovQUpdateMode));
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
  aovL: number = DEFAULT_AOV_L,
  aovTauOpen: number = DEFAULT_AOV_TAU_OPEN,
  aovTauClose: number = DEFAULT_AOV_TAU_CLOSE,
  systemicResistance: number = DEFAULT_SYSTEMIC_RESISTANCE,
  arterialStiffness: number = DEFAULT_ARTERIAL_STIFFNESS,
  tensionRiseSec: number = 0,
  tensionFallSec: number = 0,
  aovQDotClamp: number = DEFAULT_AOV_Q_DOT_CLAMP,
  aovQDotClampNegative: number = aovQDotClamp,
  aovQUpdateMode: AorticValveQUpdateMode = "current-loss",
): WaveformGateMetrics {
  const params = paramsWithTensionComparator(
    paramsWithLowStretchLimiter(
      paramsWithLambdaActTau(
        paramsWithAorticValveComparator(
          label === "HR100-rearm" ? { ...DEFAULT_PARAMS, heartModel } : { ...DEFAULT_PARAMS, heartModel, HR },
          aovB,
          aovAmax,
          aovL,
          aovTauOpen,
          aovTauClose,
          systemicResistance,
          arterialStiffness,
        ),
        tauSec,
        scope,
        terms,
      ),
      lowStretchLimiterMode,
      lowStretchLimiterScope,
      activeReservePreset,
    ),
    tensionRiseSec,
    tensionFallSec,
    scope,
  );
  const core = new ModelCore(params);
  core.setAorticFlowClampMode(aorticFlowClampMode);
  core.setAorticFlowDerivativeClampLimits(aovQDotClamp, aovQDotClampNegative);
  core.setAorticValveQUpdateMode(aovQUpdateMode);
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
    const qAoPositive = qao.filter((value) => value > 0);
    const aovEjection = samples.filter((sample) => sample.QAo > 50 && sample.xiAoV > 0.8);
    const qAoMeanDuringEjection = meanNumbers(aovEjection.map((sample) => sample.QAo));
    const qAoProximity = qAoCapProximity(qao, aorticFlowClampMode);
    const aovGradient = aovGradientDecomposition(samples, params);
    const aovClosure = aovClosureAudit(samples, params, aovQDotClamp, aovQDotClampNegative);
    const qAoShape = aorticFlowShapeSummary(samples, measuredBeatCount);
    const ejectionDurations = aorticEjectionDurations(samples, measuredBeatCount);
    const opening = aorticOpeningSummary(samples, measuredBeatCount);
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
      ...aovClosure,
      ...opening,
      QAoPeakMeanRatio: Number.isFinite(qAoMeanDuringEjection) && qAoMeanDuringEjection > 1e-9
        ? Math.max(...qao) / qAoMeanDuringEjection
        : Number.NaN,
      QAoMeanPositive: meanNumbers(qAoPositive),
      ...qAoShape,
      ejectionDurationMs: ejectionDurations.positiveMs,
      ejectionPositiveDurationMs: ejectionDurations.positiveMs,
      ejectionFivePercentPeakDurationMs: ejectionDurations.fivePercentPeakMs,
      ejectionSV5To95DurationMs: ejectionDurations.sv5To95Ms,
      ejectionHighFlowDurationMs: (aovEjection.length / Math.max(sampleHz, 1) / measuredBeatCount) * 1000,
      maxDpdtLVP: maxDerivative(samples, "LVP"),
      minDpdtLVP: minDerivative(samples, "LVP"),
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
    | "AoVFlowWeightedFullOpenOrificeGradient"
    | "AoVFlowWeightedAreaLossExtraGradient"
    | "AoVFlowWeightedOpen01"
    | "AoVPeakOrificeGradient"
    | "AoVPeakInertialGradient"
    | "AoVPeakResidualGradient"
    | "AoVPeakAreaLossExtraGradient"
  > {
  const ejection = samples
    .map((sample) => ({ sample }))
    .filter(({ sample }) => Number.isFinite(sample.QAo) && sample.QAo > 50 && sample.xiAoV > 0.8);
  if (ejection.length === 0) {
    return {
      AoVFlowWeightedTotalGradient: Number.NaN,
      AoVFlowWeightedOrificeGradient: Number.NaN,
      AoVFlowWeightedResistiveGradient: Number.NaN,
        AoVFlowWeightedBernoulliGradient: Number.NaN,
        AoVFlowWeightedInertialGradient: Number.NaN,
        AoVFlowWeightedResidualGradient: Number.NaN,
        AoVFlowWeightedFullOpenOrificeGradient: Number.NaN,
        AoVFlowWeightedAreaLossExtraGradient: Number.NaN,
        AoVFlowWeightedOpen01: Number.NaN,
        AoVPeakOrificeGradient: Number.NaN,
        AoVPeakInertialGradient: Number.NaN,
        AoVPeakResidualGradient: Number.NaN,
        AoVPeakAreaLossExtraGradient: Number.NaN,
      };
    }
    let qWeight = 0;
    let totalWeighted = 0;
    let orificeWeighted = 0;
    let resistiveWeighted = 0;
    let bernoulliWeighted = 0;
    let inertialWeighted = 0;
    let residualWeighted = 0;
    let fullOpenOrificeWeighted = 0;
    let areaLossExtraWeighted = 0;
    let open01Weighted = 0;
    let peakOrifice = Number.NEGATIVE_INFINITY;
    let peakInertial = Number.NEGATIVE_INFINITY;
    let peakResidual = Number.NEGATIVE_INFINITY;
    let peakAreaLossExtra = Number.NEGATIVE_INFINITY;
    const fullOpenAreaRatio = Math.max((params.AoV_Amax ?? DEFAULT_AOV_AMAX) / Math.max(params.AoV_Aref ?? DEFAULT_AOV_AREF, 1e-6), 1e-4);
    const fullOpenAreaLoss = Math.pow(fullOpenAreaRatio, -2);
    for (const { sample } of ejection) {
      const q = Math.max(0, sample.QAo);
      const total = sample.LVP - sample.AoP;
    // Use the engine-sampled effective valve losses. They already include
    // Aref/Amax/xi area scaling, so AS comparator reports match runtime physics.
    const resistive = sample.AoV_loss_R;
    const bernoulli = sample.AoV_loss_B;
      const inertial = params.AoV_L * sample.AoV_qDotPost;
      const orifice = resistive + bernoulli;
      const fullOpenOrifice = (params.AoV_R * fullOpenAreaLoss * q) + ((params.AoV_B ?? 0) * fullOpenAreaLoss * q * q);
      const areaLossExtra = Math.max(0, orifice - fullOpenOrifice);
      const residual = total - orifice - inertial;
      qWeight += q;
      totalWeighted += total * q;
      orificeWeighted += orifice * q;
      resistiveWeighted += resistive * q;
      bernoulliWeighted += bernoulli * q;
      inertialWeighted += inertial * q;
      residualWeighted += residual * q;
      fullOpenOrificeWeighted += fullOpenOrifice * q;
      areaLossExtraWeighted += areaLossExtra * q;
      open01Weighted += sample.xiAoV * q;
      peakOrifice = Math.max(peakOrifice, orifice);
      peakInertial = Math.max(peakInertial, inertial);
      peakResidual = Math.max(peakResidual, residual);
      peakAreaLossExtra = Math.max(peakAreaLossExtra, areaLossExtra);
    }
  const denom = Math.max(qWeight, 1e-9);
  return {
    AoVFlowWeightedTotalGradient: totalWeighted / denom,
    AoVFlowWeightedOrificeGradient: orificeWeighted / denom,
    AoVFlowWeightedResistiveGradient: resistiveWeighted / denom,
      AoVFlowWeightedBernoulliGradient: bernoulliWeighted / denom,
      AoVFlowWeightedInertialGradient: inertialWeighted / denom,
      AoVFlowWeightedResidualGradient: residualWeighted / denom,
      AoVFlowWeightedFullOpenOrificeGradient: fullOpenOrificeWeighted / denom,
      AoVFlowWeightedAreaLossExtraGradient: areaLossExtraWeighted / denom,
      AoVFlowWeightedOpen01: open01Weighted / denom,
      AoVPeakOrificeGradient: Number.isFinite(peakOrifice) ? peakOrifice : Number.NaN,
      AoVPeakInertialGradient: Number.isFinite(peakInertial) ? peakInertial : Number.NaN,
      AoVPeakResidualGradient: Number.isFinite(peakResidual) ? peakResidual : Number.NaN,
      AoVPeakAreaLossExtraGradient: Number.isFinite(peakAreaLossExtra) ? peakAreaLossExtra : Number.NaN,
    };
  }

function aovClosureAudit(samples: SimSample[], params: CoreRuntimeParams, aovQDotClamp: number, aovQDotClampNegative: number): Pick<WaveformGateMetrics,
  "AoVClosureResidualMean"
  | "AoVFlowWeightedClosureResidual"
  | "AoVClosureResidualAtQAoMax"
  | "AoVClosureResidualSV5To95Mean"
  | "AoVFlowWeightedClosureResidualSV5To95"
  | "AoVSolverClosureResidualMean"
  | "AoVFlowWeightedSolverClosureResidual"
  | "AoVDiscreteClosureResidualMean"
  | "AoVFlowWeightedDiscreteClosureResidual"
  | "AoVCleanClosureResidualMean"
  | "AoVFlowWeightedCleanClosureResidual"
  | "AoVCleanCandidateSampleCount"
  | "AoVCleanClosureSampleCount"
  | "AoVDiodeImpulseGradientMean"
  | "AoVFlowWeightedDiodeImpulseGradient"
  | "AoVFlowClampImpulseGradientMean"
  | "AoVFlowWeightedFlowClampImpulseGradient"
  | "AoVQDotClampImpulseGradientMean"
  | "AoVFlowWeightedQDotClampImpulseGradient"
  | "AoVQDotRawMaxAbs"
  | "AoVQDotPostMaxAbs"
  | "AoVQDotClampImpulseMaxAbs"
  | "AoVQDotClampHitFraction"
  | "AoVQDotClampHitFractionPositive"
  | "AoVQDotClampHitFractionSV5To95"
  | "AoVQDotClampHitFractionFivePercentPeak"
  | "AoVQDotClampHitFractionNearFullOpen"
  | "AoVQDotClampHitFractionCleanCandidate"
  | "AoVQDotTargetClampMlPerS2"
  | "AoVQDotTargetPositiveClampMlPerS2"
  | "AoVQDotTargetNegativeClampMlPerS2"
  | "AoVQDotRawToClampRatioMax"
  | "AoVQDotRawToClampRatioSV5To95Max"
  | "AoVQDotRawToClampRatioCleanCandidateMax"
  | "AoVQDotRequiredReductionFractionMax"
  | "AoVQDotRequiredReductionFractionSV5To95Max"
  | "AoVQDotRequiredReductionFractionCleanCandidateMax"
  | "AoVQDotPressureExcessOverClampMaxMmHg"
  | "AoVQDotPressureExcessOverClampSV5To95MaxMmHg"
  | "AoVQDotPressureExcessOverClampCleanCandidateMaxMmHg"
  | "AoVQDotEquivalentExtraBAtMaxExcess"
  | "AoVQDotEquivalentExtraBAtSV5To95MaxExcess"
  | "AoVQDotEquivalentExtraBAtCleanCandidateMaxExcess"
  | "AoVQDotMaxExcessSampleQAo"
  | "AoVQDotMaxExcessSampleOpen01"
  | "AoVQDotOpen01Bins"
  | "AoVQDotEventDirectionBins"
> {
  const positive = samples
    .map((sample, index) => ({ sample, index }))
    .filter(({ sample }) => Number.isFinite(sample.QAo) && sample.QAo > 0);
  if (positive.length === 0) {
    return {
      AoVClosureResidualMean: Number.NaN,
      AoVFlowWeightedClosureResidual: Number.NaN,
      AoVClosureResidualAtQAoMax: Number.NaN,
      AoVClosureResidualSV5To95Mean: Number.NaN,
      AoVFlowWeightedClosureResidualSV5To95: Number.NaN,
      AoVSolverClosureResidualMean: Number.NaN,
      AoVFlowWeightedSolverClosureResidual: Number.NaN,
      AoVDiscreteClosureResidualMean: Number.NaN,
      AoVFlowWeightedDiscreteClosureResidual: Number.NaN,
      AoVCleanClosureResidualMean: Number.NaN,
      AoVFlowWeightedCleanClosureResidual: Number.NaN,
      AoVCleanCandidateSampleCount: 0,
      AoVCleanClosureSampleCount: 0,
      AoVDiodeImpulseGradientMean: Number.NaN,
      AoVFlowWeightedDiodeImpulseGradient: Number.NaN,
      AoVFlowClampImpulseGradientMean: Number.NaN,
      AoVFlowWeightedFlowClampImpulseGradient: Number.NaN,
      AoVQDotClampImpulseGradientMean: Number.NaN,
      AoVFlowWeightedQDotClampImpulseGradient: Number.NaN,
      AoVQDotRawMaxAbs: Number.NaN,
      AoVQDotPostMaxAbs: Number.NaN,
      AoVQDotClampImpulseMaxAbs: Number.NaN,
      AoVQDotClampHitFraction: Number.NaN,
      AoVQDotClampHitFractionPositive: Number.NaN,
      AoVQDotClampHitFractionSV5To95: Number.NaN,
      AoVQDotClampHitFractionFivePercentPeak: Number.NaN,
      AoVQDotClampHitFractionNearFullOpen: Number.NaN,
      AoVQDotClampHitFractionCleanCandidate: Number.NaN,
      AoVQDotTargetClampMlPerS2: Math.max(1, aovQDotClamp),
      AoVQDotTargetPositiveClampMlPerS2: Math.max(1, aovQDotClamp),
      AoVQDotTargetNegativeClampMlPerS2: Math.max(1, aovQDotClampNegative),
      AoVQDotRawToClampRatioMax: Number.NaN,
      AoVQDotRawToClampRatioSV5To95Max: Number.NaN,
      AoVQDotRawToClampRatioCleanCandidateMax: Number.NaN,
      AoVQDotRequiredReductionFractionMax: Number.NaN,
      AoVQDotRequiredReductionFractionSV5To95Max: Number.NaN,
      AoVQDotRequiredReductionFractionCleanCandidateMax: Number.NaN,
      AoVQDotPressureExcessOverClampMaxMmHg: Number.NaN,
      AoVQDotPressureExcessOverClampSV5To95MaxMmHg: Number.NaN,
      AoVQDotPressureExcessOverClampCleanCandidateMaxMmHg: Number.NaN,
      AoVQDotEquivalentExtraBAtMaxExcess: Number.NaN,
      AoVQDotEquivalentExtraBAtSV5To95MaxExcess: Number.NaN,
      AoVQDotEquivalentExtraBAtCleanCandidateMaxExcess: Number.NaN,
      AoVQDotMaxExcessSampleQAo: Number.NaN,
      AoVQDotMaxExcessSampleOpen01: Number.NaN,
      AoVQDotOpen01Bins: emptyAoVOpen01Bins(),
      AoVQDotEventDirectionBins: emptyAoVQDotEventDirectionBins(),
    };
  }
  const maxQ = Math.max(0, ...samples.map((sample) => Number.isFinite(sample.QAo) ? sample.QAo : 0));
  const svWindows = sv5To95Windows(samples);
  const inSvWindow = (sample: SimSample) => svWindows.some((window) => sample.t >= window.t5 && sample.t <= window.t95);
  let peakQ = Number.NEGATIVE_INFINITY;
  let residualAtPeak = Number.NaN;
  let rawMax = 0;
  let postMax = 0;
  let impulseMax = 0;
  for (const { sample, index } of positive) {
    const q = Math.max(0, sample.QAo);
    const residual = aovClosureResidual(samples, index, params, "post");
    rawMax = Math.max(rawMax, Math.abs(sample.AoV_qDotRaw));
    postMax = Math.max(postMax, Math.abs(sample.AoV_qDotPost));
    impulseMax = Math.max(impulseMax, Math.abs(sample.AoV_qDotClampImpulse));
    if (q > peakQ) {
      peakQ = q;
      residualAtPeak = residual;
    }
  }
  const svSamples = positive.filter(({ sample }) => inSvWindow(sample));
  const fivePercentPeakSamples = positive.filter(({ sample }) => sample.QAo > maxQ * 0.05);
  const nearFullSamples = positive.filter(({ sample }) => sample.xiAoV > 0.95 && sample.QAo > maxQ * 0.05);
  const cleanCandidateSamples = positive.filter(({ sample }) =>
    sample.xiAoV > 0.95
    && sample.QAo > maxQ * 0.05
    && inSvWindow(sample)
    && Math.abs(sample.AoV_diodeImpulse) < 1e-9
    && Math.abs(sample.AoV_flowClampImpulse) < 1e-9
  );
  const cleanSamples = cleanCandidateSamples.filter(({ sample }) => sample.AoV_qDotClampHit01 === 0);
  const residualStats = (entries: Array<{ sample: SimSample; index: number }>, mode: "post" | "raw-discrete" | "solver-pre-events") => {
    if (entries.length === 0) return { mean: Number.NaN, flowWeighted: Number.NaN };
    let sum = 0;
    let weighted = 0;
    let weight = 0;
    for (const { sample, index } of entries) {
      const q = Math.max(0, sample.QAo);
      const residual = aovClosureResidual(samples, index, params, mode);
      sum += residual;
      weighted += residual * q;
      weight += q;
    }
    return {
      mean: sum / entries.length,
      flowWeighted: weight > 0 ? weighted / weight : Number.NaN,
    };
  };
  const impulseStats = (entries: Array<{ sample: SimSample }>, value: (sample: SimSample) => number) => {
    if (entries.length === 0) return { mean: Number.NaN, flowWeighted: Number.NaN };
    let sum = 0;
    let weighted = 0;
    let weight = 0;
    for (const { sample } of entries) {
      const q = Math.max(0, sample.QAo);
      const impulse = value(sample);
      sum += impulse;
      weighted += impulse * q;
      weight += q;
    }
    return {
      mean: sum / entries.length,
      flowWeighted: weight > 0 ? weighted / weight : Number.NaN,
    };
  };
  const post = residualStats(positive, "post");
  const solver = residualStats(positive, "solver-pre-events");
  const discrete = residualStats(positive, "raw-discrete");
  const svPost = residualStats(svSamples, "post");
  const cleanPost = residualStats(cleanSamples, "post");
  const diodeImpulse = impulseStats(positive, (sample) => params.AoV_L * (sample.AoV_qDotPostDiode - sample.AoV_qDotPreDiode));
  const flowImpulse = impulseStats(positive, (sample) => params.AoV_L * (sample.AoV_qDotRaw - sample.AoV_qDotPreFlowClamp));
  const qDotImpulse = impulseStats(positive, (sample) => params.AoV_L * sample.AoV_qDotClampImpulse);
  const hitFraction = (entries: Array<{ sample: SimSample }>) =>
    entries.length > 0
      ? entries.filter(({ sample }) => sample.AoV_qDotClampHit01 > 0).length / entries.length
      : Number.NaN;
  const qDotTargetPositive = Math.max(1, aovQDotClamp);
  const qDotTargetNegative = Math.max(1, aovQDotClampNegative);
  const qDotTargetForRaw = (raw: number) => raw < 0 ? qDotTargetNegative : qDotTargetPositive;
  const qDotTargetStats = (entries: Array<{ sample: SimSample; index?: number }>) => {
    if (entries.length === 0) {
      return {
        sampleCount: 0,
        ratioMax: Number.NaN,
        positiveRatioMax: Number.NaN,
        negativeRatioMax: Number.NaN,
        reductionFractionMax: Number.NaN,
        pressureExcessMax: Number.NaN,
        equivalentExtraBAtMaxExcess: Number.NaN,
        excessSampleQAo: Number.NaN,
        excessSampleOpen01: Number.NaN,
        excessSampleOpen01Delta: Number.NaN,
        dPAtMaxExcess: Number.NaN,
        qCurrentAtMaxExcess: Number.NaN,
        qNextPreDiodeAtMaxExcess: Number.NaN,
        qNextPreFlowClampAtMaxExcess: Number.NaN,
        qDotPreClampAtMaxExcess: Number.NaN,
        qDotRawAtMaxExcess: Number.NaN,
        qDotRawPositiveMax: Number.NaN,
        qDotRawNegativeMin: Number.NaN,
      };
    }
    let ratioMax = 0;
    let positiveRatioMax = 0;
    let negativeRatioMax = 0;
    let reductionFractionMax = 0;
    let pressureExcessMax = 0;
    let equivalentExtraBAtMaxExcess = Number.NaN;
    let excessSampleQAo = Number.NaN;
    let excessSampleOpen01 = Number.NaN;
    let excessSampleOpen01Delta = Number.NaN;
    let dPAtMaxExcess = Number.NaN;
    let qCurrentAtMaxExcess = Number.NaN;
    let qNextPreDiodeAtMaxExcess = Number.NaN;
    let qNextPreFlowClampAtMaxExcess = Number.NaN;
    let qDotPreClampAtMaxExcess = Number.NaN;
    let qDotRawAtMaxExcess = Number.NaN;
    let qDotRawPositiveMax = Number.NEGATIVE_INFINITY;
    let qDotRawNegativeMin = Number.POSITIVE_INFINITY;
    for (const { sample, index } of entries) {
      const rawAbs = Math.abs(sample.AoV_qDotRaw);
      if (!Number.isFinite(rawAbs)) continue;
      const qDotTarget = qDotTargetForRaw(sample.AoV_qDotRaw);
      const ratio = rawAbs / qDotTarget;
      ratioMax = Math.max(ratioMax, ratio);
      if (sample.AoV_qDotRaw > 0) {
        qDotRawPositiveMax = Math.max(qDotRawPositiveMax, sample.AoV_qDotRaw);
        positiveRatioMax = Math.max(positiveRatioMax, sample.AoV_qDotRaw / qDotTarget);
      }
      if (sample.AoV_qDotRaw < 0) {
        qDotRawNegativeMin = Math.min(qDotRawNegativeMin, sample.AoV_qDotRaw);
        negativeRatioMax = Math.max(negativeRatioMax, -sample.AoV_qDotRaw / qDotTarget);
      }
      const excess = Math.max(0, rawAbs - qDotTarget);
      const reductionFraction = rawAbs > 0 ? excess / rawAbs : 0;
      reductionFractionMax = Math.max(reductionFractionMax, reductionFraction);
      const pressureExcess = params.AoV_L * excess;
      if (pressureExcess >= pressureExcessMax) {
        const q = Math.max(0, sample.QAo);
        pressureExcessMax = pressureExcess;
        equivalentExtraBAtMaxExcess = q > 1e-9 ? pressureExcess / (q * q) : Number.NaN;
        excessSampleQAo = q;
        excessSampleOpen01 = sample.xiAoV;
        excessSampleOpen01Delta = typeof index === "number" && index > 0
          ? sample.xiAoV - samples[index - 1].xiAoV
          : Number.NaN;
        dPAtMaxExcess = sample.LVP - sample.AoP;
        qCurrentAtMaxExcess = sample.QAo;
        qNextPreDiodeAtMaxExcess = sample.AoV_qNextPreDiode;
        qNextPreFlowClampAtMaxExcess = sample.AoV_qNextPreFlowClamp;
        qDotPreClampAtMaxExcess = sample.AoV_qDotRaw;
        qDotRawAtMaxExcess = sample.AoV_qDotRaw;
      }
    }
    return {
      sampleCount: entries.length,
      ratioMax,
      positiveRatioMax: positiveRatioMax > 0 ? positiveRatioMax : Number.NaN,
      negativeRatioMax: negativeRatioMax > 0 ? negativeRatioMax : Number.NaN,
      reductionFractionMax,
      pressureExcessMax,
      equivalentExtraBAtMaxExcess,
      excessSampleQAo,
      excessSampleOpen01,
      excessSampleOpen01Delta,
      dPAtMaxExcess,
      qCurrentAtMaxExcess,
      qNextPreDiodeAtMaxExcess,
      qNextPreFlowClampAtMaxExcess,
      qDotPreClampAtMaxExcess,
      qDotRawAtMaxExcess,
      qDotRawPositiveMax: Number.isFinite(qDotRawPositiveMax) ? qDotRawPositiveMax : Number.NaN,
      qDotRawNegativeMin: Number.isFinite(qDotRawNegativeMin) ? qDotRawNegativeMin : Number.NaN,
    };
  };
  const toBinStats = (stats: ReturnType<typeof qDotTargetStats>): AoVQDotTargetBinStats => ({
    sampleCount: stats.sampleCount,
    rawToClampRatioMax: stats.ratioMax,
    rawToClampRatioPositiveMax: stats.positiveRatioMax,
    rawToClampRatioNegativeMax: stats.negativeRatioMax,
    requiredReductionFractionMax: stats.reductionFractionMax,
    pressureExcessOverClampMaxMmHg: stats.pressureExcessMax,
    equivalentExtraBAtMaxExcess: stats.equivalentExtraBAtMaxExcess,
    qAoAtMaxExcess: stats.excessSampleQAo,
    dPAtMaxExcess: stats.dPAtMaxExcess,
    qCurrentAtMaxExcess: stats.qCurrentAtMaxExcess,
    qNextPreDiodeAtMaxExcess: stats.qNextPreDiodeAtMaxExcess,
    qNextPreFlowClampAtMaxExcess: stats.qNextPreFlowClampAtMaxExcess,
    qDotPreClampAtMaxExcess: stats.qDotPreClampAtMaxExcess,
    qDotRawAtMaxExcess: stats.qDotRawAtMaxExcess,
    qDotRawPositiveMax: stats.qDotRawPositiveMax,
    qDotRawNegativeMin: stats.qDotRawNegativeMin,
    open01AtMaxExcess: stats.excessSampleOpen01,
    open01DeltaAtMaxExcess: stats.excessSampleOpen01Delta,
  });
  const qDotTargetAll = qDotTargetStats(positive);
  const qDotTargetSv = qDotTargetStats(svSamples);
  const qDotTargetCleanCandidate = qDotTargetStats(cleanCandidateSamples);
  const qDotOpen01Bins: Record<AoVOpen01BinKey, AoVQDotTargetBinStats> = {
    "open-lt-0.2": toBinStats(qDotTargetStats(positive.filter(({ sample }) => sample.xiAoV < 0.2))),
    "open-0.2-0.8": toBinStats(qDotTargetStats(positive.filter(({ sample }) => sample.xiAoV >= 0.2 && sample.xiAoV < 0.8))),
    "open-0.8-0.95": toBinStats(qDotTargetStats(positive.filter(({ sample }) => sample.xiAoV >= 0.8 && sample.xiAoV < 0.95))),
    "open-gte-0.95": toBinStats(qDotTargetStats(positive.filter(({ sample }) => sample.xiAoV >= 0.95))),
  };
  const lowOpen = positive.filter(({ sample }) => sample.xiAoV < 0.2);
  const restFlowThreshold = Math.max(1, maxQ * 0.01);
  const qDotEventDirectionBins: Record<AoVQDotEventDirectionKey, AoVQDotTargetBinStats> = {
    "low-open-opening-accel": toBinStats(qDotTargetStats(lowOpen.filter(({ sample }) => (sample.LVP - sample.AoP) > 0 && sample.AoV_qDotRaw > 0))),
    "low-open-pressure-reversal-decel": toBinStats(qDotTargetStats(lowOpen.filter(({ sample }) => (sample.LVP - sample.AoP) < 0 && sample.AoV_qDotRaw < 0))),
    "low-open-forward-coast-adverse": toBinStats(qDotTargetStats(lowOpen.filter(({ sample }) => sample.QAo > restFlowThreshold && (sample.LVP - sample.AoP) < 0))),
    "low-open-true-opening-rest": toBinStats(qDotTargetStats(lowOpen.filter(({ sample }) => sample.QAo <= restFlowThreshold && (sample.LVP - sample.AoP) > 0))),
  };
  return {
    AoVClosureResidualMean: post.mean,
    AoVFlowWeightedClosureResidual: post.flowWeighted,
    AoVClosureResidualAtQAoMax: residualAtPeak,
    AoVClosureResidualSV5To95Mean: svPost.mean,
    AoVFlowWeightedClosureResidualSV5To95: svPost.flowWeighted,
    AoVSolverClosureResidualMean: solver.mean,
    AoVFlowWeightedSolverClosureResidual: solver.flowWeighted,
    AoVDiscreteClosureResidualMean: discrete.mean,
    AoVFlowWeightedDiscreteClosureResidual: discrete.flowWeighted,
    AoVCleanClosureResidualMean: cleanPost.mean,
    AoVFlowWeightedCleanClosureResidual: cleanPost.flowWeighted,
    AoVCleanCandidateSampleCount: cleanCandidateSamples.length,
    AoVCleanClosureSampleCount: cleanSamples.length,
    AoVDiodeImpulseGradientMean: diodeImpulse.mean,
    AoVFlowWeightedDiodeImpulseGradient: diodeImpulse.flowWeighted,
    AoVFlowClampImpulseGradientMean: flowImpulse.mean,
    AoVFlowWeightedFlowClampImpulseGradient: flowImpulse.flowWeighted,
    AoVQDotClampImpulseGradientMean: qDotImpulse.mean,
    AoVFlowWeightedQDotClampImpulseGradient: qDotImpulse.flowWeighted,
    AoVQDotRawMaxAbs: rawMax,
    AoVQDotPostMaxAbs: postMax,
    AoVQDotClampImpulseMaxAbs: impulseMax,
    AoVQDotClampHitFraction: hitFraction(samples.map((sample) => ({ sample }))),
    AoVQDotClampHitFractionPositive: hitFraction(positive),
    AoVQDotClampHitFractionSV5To95: hitFraction(svSamples),
    AoVQDotClampHitFractionFivePercentPeak: hitFraction(fivePercentPeakSamples),
    AoVQDotClampHitFractionNearFullOpen: hitFraction(nearFullSamples),
    AoVQDotClampHitFractionCleanCandidate: hitFraction(cleanCandidateSamples),
    AoVQDotTargetClampMlPerS2: qDotTargetPositive,
    AoVQDotTargetPositiveClampMlPerS2: qDotTargetPositive,
    AoVQDotTargetNegativeClampMlPerS2: qDotTargetNegative,
    AoVQDotRawToClampRatioMax: qDotTargetAll.ratioMax,
    AoVQDotRawToClampRatioSV5To95Max: qDotTargetSv.ratioMax,
    AoVQDotRawToClampRatioCleanCandidateMax: qDotTargetCleanCandidate.ratioMax,
    AoVQDotRequiredReductionFractionMax: qDotTargetAll.reductionFractionMax,
    AoVQDotRequiredReductionFractionSV5To95Max: qDotTargetSv.reductionFractionMax,
    AoVQDotRequiredReductionFractionCleanCandidateMax: qDotTargetCleanCandidate.reductionFractionMax,
    AoVQDotPressureExcessOverClampMaxMmHg: qDotTargetAll.pressureExcessMax,
    AoVQDotPressureExcessOverClampSV5To95MaxMmHg: qDotTargetSv.pressureExcessMax,
    AoVQDotPressureExcessOverClampCleanCandidateMaxMmHg: qDotTargetCleanCandidate.pressureExcessMax,
    AoVQDotEquivalentExtraBAtMaxExcess: qDotTargetAll.equivalentExtraBAtMaxExcess,
    AoVQDotEquivalentExtraBAtSV5To95MaxExcess: qDotTargetSv.equivalentExtraBAtMaxExcess,
    AoVQDotEquivalentExtraBAtCleanCandidateMaxExcess: qDotTargetCleanCandidate.equivalentExtraBAtMaxExcess,
    AoVQDotMaxExcessSampleQAo: qDotTargetAll.excessSampleQAo,
    AoVQDotMaxExcessSampleOpen01: qDotTargetAll.excessSampleOpen01,
    AoVQDotOpen01Bins: qDotOpen01Bins,
    AoVQDotEventDirectionBins: qDotEventDirectionBins,
  };
}

function emptyAoVOpen01Bins(): Record<AoVOpen01BinKey, AoVQDotTargetBinStats> {
  const empty = (): AoVQDotTargetBinStats => ({
    sampleCount: 0,
    rawToClampRatioMax: Number.NaN,
    rawToClampRatioPositiveMax: Number.NaN,
    rawToClampRatioNegativeMax: Number.NaN,
    requiredReductionFractionMax: Number.NaN,
    pressureExcessOverClampMaxMmHg: Number.NaN,
    equivalentExtraBAtMaxExcess: Number.NaN,
    qAoAtMaxExcess: Number.NaN,
    dPAtMaxExcess: Number.NaN,
    qCurrentAtMaxExcess: Number.NaN,
    qNextPreDiodeAtMaxExcess: Number.NaN,
    qNextPreFlowClampAtMaxExcess: Number.NaN,
    qDotPreClampAtMaxExcess: Number.NaN,
    qDotRawAtMaxExcess: Number.NaN,
    qDotRawPositiveMax: Number.NaN,
    qDotRawNegativeMin: Number.NaN,
    open01AtMaxExcess: Number.NaN,
    open01DeltaAtMaxExcess: Number.NaN,
  });
  return {
    "open-lt-0.2": empty(),
    "open-0.2-0.8": empty(),
    "open-0.8-0.95": empty(),
    "open-gte-0.95": empty(),
  };
}

function emptyAoVQDotEventDirectionBins(): Record<AoVQDotEventDirectionKey, AoVQDotTargetBinStats> {
  const empty = emptyAoVOpen01Bins()["open-lt-0.2"];
  return {
    "low-open-opening-accel": { ...empty },
    "low-open-pressure-reversal-decel": { ...empty },
    "low-open-forward-coast-adverse": { ...empty },
    "low-open-true-opening-rest": { ...empty },
  };
}

function aovClosureResidual(samples: SimSample[], index: number, params: CoreRuntimeParams, mode: "post" | "raw-discrete" | "solver-pre-events"): number {
  const sample = samples[index];
  const total = sample.LVP - sample.AoP;
  if (mode === "post") {
    const orifice = sample.AoV_loss_R + sample.AoV_loss_B;
    const inertial = params.AoV_L * sample.AoV_qDotPost;
    return total - orifice - inertial;
  }
  const q = sample.QAo;
  const effectiveLossPerFlow = Math.abs(q) > 1e-9
    ? (sample.AoV_loss_R + sample.AoV_loss_B) / Math.max(Math.abs(q), 1e-9)
    : params.AoV_R;
  if (mode === "solver-pre-events") {
    const solverOrifice = effectiveLossPerFlow * sample.AoV_qNextPreDiode;
    const solverInertial = params.AoV_L * sample.AoV_qDotPreDiode;
    return total - solverOrifice - solverInertial;
  }
  const qNext = sample.AoV_qNextPostFlowClamp;
  const discreteOrifice = effectiveLossPerFlow * qNext;
  const discreteInertial = params.AoV_L * sample.AoV_qDotRaw;
  return total - discreteOrifice - discreteInertial;
}

function aorticFlowShapeSummary(
  samples: SimSample[],
  measuredBeatCount: number,
): Pick<WaveformGateMetrics,
  "QAoTimeToPeakMs"
  | "maxDQAoDt"
> {
  const byBeat = Array.from(groupSamplesByBeat(samples).values());
  const timeToPeakMs: number[] = [];
  for (const beatSamples of byBeat) {
    const positive = beatSamples.filter((sample) => sample.QAo > 0);
    if (positive.length === 0) continue;
    const start = positive[0];
    const peak = positive.reduce((best, sample) => sample.QAo > best.QAo ? sample : best, positive[0]);
    timeToPeakMs.push((peak.t - start.t) * 1000);
  }
  return {
    QAoTimeToPeakMs: timeToPeakMs.length > 0 ? meanNumbers(timeToPeakMs.slice(-measuredBeatCount)) : Number.NaN,
    maxDQAoDt: Math.max(0, ...samples.map((sample) => Math.abs(sample.AoV_qDotPost)).filter(Number.isFinite)),
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

function aorticOpeningSummary(
  samples: SimSample[],
  measuredBeatCount: number,
): Pick<WaveformGateMetrics,
  "AoVOpen01AtQAoMax"
  | "AoVMeanOpen01DuringEjection"
  | "AoVTimeToNearFullOpenMs"
> {
  const positive = samples.filter((sample) => Number.isFinite(sample.QAo) && sample.QAo > 0);
  if (positive.length === 0) {
    return {
      AoVOpen01AtQAoMax: Number.NaN,
      AoVMeanOpen01DuringEjection: Number.NaN,
      AoVTimeToNearFullOpenMs: Number.NaN,
    };
  }
  const peak = positive.reduce((best, sample) => sample.QAo > best.QAo ? sample : best, positive[0]);
  const ejection = samples.filter((sample) => sample.QAo > 50);
  const nearFullTimes: number[] = [];
  const byBeat = groupSamplesByBeat(samples);
  for (const beatSamples of byBeat.values()) {
    const start = beatSamples.find((sample) => sample.QAo > 0);
    if (!start) continue;
    const nearFull = beatSamples.find((sample) => sample.t >= start.t && sample.xiAoV >= 0.95);
    if (!nearFull) continue;
    nearFullTimes.push((nearFull.t - start.t) * 1000);
  }
  return {
    AoVOpen01AtQAoMax: peak.xiAoV,
    AoVMeanOpen01DuringEjection: meanNumbers(ejection.map((sample) => sample.xiAoV)),
    AoVTimeToNearFullOpenMs: nearFullTimes.length > 0 ? meanNumbers(nearFullTimes) : Number.NaN,
  };
}

function aorticEjectionDurations(
  samples: SimSample[],
  measuredBeatCount: number,
): {
  positiveMs: number;
  fivePercentPeakMs: number;
  sv5To95Ms: number;
} {
  const positive = samples.filter((sample) => Number.isFinite(sample.QAo) && sample.QAo > 0);
  const peak = positive.length > 0 ? Math.max(...positive.map((sample) => sample.QAo)) : Number.NaN;
  const denom = Math.max(measuredBeatCount, 1);
  const positiveMs = positive.length / Math.max(samplesPerSecond(samples), 1) / denom * 1000;
  const fivePercentPeakMs = Number.isFinite(peak) && peak > 0
    ? samples.filter((sample) => sample.QAo > peak * 0.05).length / Math.max(samplesPerSecond(samples), 1) / denom * 1000
    : Number.NaN;
  const svDurations: number[] = [];
  for (const beatSamples of groupSamplesByBeat(samples).values()) {
    const duration = sv5To95DurationForBeat(beatSamples);
    if (Number.isFinite(duration)) svDurations.push(duration);
  }
  return {
    positiveMs,
    fivePercentPeakMs,
    sv5To95Ms: svDurations.length > 0 ? meanNumbers(svDurations) : Number.NaN,
  };
}

function samplesPerSecond(samples: SimSample[]): number {
  if (samples.length < 2) return Number.NaN;
  const duration = samples.at(-1)!.t - samples[0].t;
  return duration > 0 ? (samples.length - 1) / duration : Number.NaN;
}

function groupSamplesByBeat(samples: SimSample[]): Map<number, SimSample[]> {
  const out = new Map<number, SimSample[]>();
  for (const sample of samples) {
    const beat = Math.floor(sample.phi);
    const rows = out.get(beat) ?? [];
    rows.push(sample);
    out.set(beat, rows);
  }
  return out;
}

function sv5To95DurationForBeat(samples: SimSample[]): number {
  const window = sv5To95WindowForBeat(samples);
  return window ? (window.t95 - window.t5) * 1000 : Number.NaN;
}

function sv5To95Windows(samples: SimSample[]): Array<{ t5: number; t95: number }> {
  return Array.from(groupSamplesByBeat(samples).values())
    .map(sv5To95WindowForBeat)
    .filter((window): window is { t5: number; t95: number } => !!window);
}

function sv5To95WindowForBeat(samples: SimSample[]): { t5: number; t95: number } | undefined {
  if (samples.length < 2) return undefined;
  const increments: Array<{ t: number; cumulative: number }> = [{ t: samples[0].t, cumulative: 0 }];
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    if (dt <= 0) continue;
    const flow = 0.5 * (Math.max(0, samples[i - 1].QAo) + Math.max(0, samples[i].QAo));
    total += flow * dt;
    increments.push({ t: samples[i].t, cumulative: total });
  }
  if (total <= 1e-6) return undefined;
  const t5 = crossingTime(increments, total * 0.05);
  const t95 = crossingTime(increments, total * 0.95);
  return Number.isFinite(t5) && Number.isFinite(t95) ? { t5, t95 } : undefined;
}

function crossingTime(points: Array<{ t: number; cumulative: number }>, target: number): number {
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const next = points[i];
    if (next.cumulative < target) continue;
    const frac01 = (target - prev.cumulative) / Math.max(next.cumulative - prev.cumulative, 1e-9);
    return prev.t + clamp(frac01, 0, 1) * (next.t - prev.t);
  }
  return Number.NaN;
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

function minDerivative(samples: SimSample[], key: keyof SimSample): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    if (dt <= 0) continue;
    const derivative = (Number(samples[i][key]) - Number(samples[i - 1][key])) / dt;
    if (Number.isFinite(derivative)) min = Math.min(min, derivative);
  }
  return Number.isFinite(min) ? min : Number.NaN;
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
    "QAoMeanPositive",
    "QAoTimeToPeakMs",
    "maxDQAoDt",
    "AoVFlowWeightedClosureResidual",
    "AoVClosureResidualSV5To95Mean",
    "ejectionDurationMs",
    "ejectionPositiveDurationMs",
    "ejectionFivePercentPeakDurationMs",
    "ejectionSV5To95DurationMs",
    "maxDpdtLVP",
    "minDpdtLVP",
  ];
  return keys.reduce<{ metric: keyof WaveformGateComparison["delta"]; fraction: number }>((best, key) => {
    const baselineValue = Number(baseline[key as keyof WaveformGateMetrics]);
    const deltaValue = Number(delta[key]);
    const fraction = Number.isFinite(deltaValue) ? Math.abs(deltaValue) / Math.max(Math.abs(baselineValue), 1e-6) : 0;
    return fraction > best.fraction ? { metric: key, fraction } : best;
  }, { metric: "CO_L", fraction: 0 });
}

function isDefaultAorticValveComparator(
  aovB: number,
  aovAmax: number,
  aovL: number = DEFAULT_AOV_L,
  aovTauOpen: number = DEFAULT_AOV_TAU_OPEN,
  aovTauClose: number = DEFAULT_AOV_TAU_CLOSE,
  systemicResistance: number = DEFAULT_SYSTEMIC_RESISTANCE,
  arterialStiffness: number = DEFAULT_ARTERIAL_STIFFNESS,
): boolean {
  return Math.abs(aovB - DEFAULT_AOV_B) <= Math.max(DEFAULT_AOV_B, 1) * 1e-9
    && Math.abs(aovAmax - DEFAULT_AOV_AMAX) <= Math.max(DEFAULT_AOV_AMAX, 1) * 1e-9
    && Math.abs(aovL - DEFAULT_AOV_L) <= Math.max(DEFAULT_AOV_L, 1) * 1e-9
    && Math.abs(aovTauOpen - DEFAULT_AOV_TAU_OPEN) <= Math.max(DEFAULT_AOV_TAU_OPEN, 1) * 1e-9
    && Math.abs(aovTauClose - DEFAULT_AOV_TAU_CLOSE) <= Math.max(DEFAULT_AOV_TAU_CLOSE, 1) * 1e-9
    && Math.abs(systemicResistance - DEFAULT_SYSTEMIC_RESISTANCE) <= Math.max(DEFAULT_SYSTEMIC_RESISTANCE, 1) * 1e-9
    && Math.abs(arterialStiffness - DEFAULT_ARTERIAL_STIFFNESS) <= Math.max(DEFAULT_ARTERIAL_STIFFNESS, 1) * 1e-9;
}

function markdownSeparator(headerLine: string): string {
  const columnCount = Math.max(1, headerLine.split("|").length - 2);
  return `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`;
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
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
  lines.push(markdownSeparator(lines[lines.length - 1]));
  lines.push([
    report.summary.branchLocalizationCounts["edv-dominant"],
    report.summary.branchLocalizationCounts["esv/ejection-dominant"],
    report.summary.branchLocalizationCounts.mixed,
  ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  lines.push("");
  lines.push("## Filling morphology alternation counts");
  lines.push("");
  lines.push("| morphology alternation | peak-count alternation | max MV A branch frac | max MV mid branch frac | max LA A-loop branch frac |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
  lines.push("| class | branch class | localization | reasons | heart model | scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | AoV clamp | AoV B | AoV Amax | AoV L | tau open | tau close | SVR | art stiff | tension rise | tension fall | qDot clamp | selected deltas | period-2 | worst delta | worst covered | coverage | evidence | needs Jacobian | max CO branch frac | max EDV branch frac | max ESV branch frac | max QAo branch frac | max AoP branch frac | max QAo/cap | near cap >95% | at cap | local cap active | clean slopes | clean one-beat EDV slope | clean two-beat EDV slope | clean one-beat ESV slope | clean two-beat ESV slope | clean one-beat volume max slope | clean two-beat volume max slope | min MV A mL | min MV A frac | min LA A-loop frac | mean CO err | mean SV err | monotonicity breaks | dip/re-rise | slope ratio | active hit frac | min active scale | target reduction | max clamp hits | max sanitize abs mL | max projection applied mL | contaminated | max waveform gate frac | worst waveform metric |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
      scenario.aovL,
      scenario.aovTauOpen,
      scenario.aovTauClose,
      scenario.systemicResistance,
      scenario.arterialStiffness,
      scenario.tensionRiseSec,
      scenario.tensionFallSec,
      aovQDotClampLabel(scenario.aovQDotClamp, scenario.aovQDotClampNegative),
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
  lines.push("## Negative qDot closure-deceleration primary readouts");
  lines.push("");
  lines.push("These scenario-level maxima promote the low-open negative-qDot readouts that localized the low-preload branch to pressure-reversal / forward-coast deceleration. `qDotClamp=80000` or asymmetric negative-clamp relaxation remains a positive control, not a default model fix.");
  lines.push("");
  lines.push("| class | heart model | dt | TBV correction | AoV B | AoV L | tau open | tau close | tension rise | tension fall | qDot clamp | q update | pressure-reversal n | pressure-reversal -qDot/clamp | pressure-reversal pressure excess | forward-coast n | forward-coast -qDot/clamp | forward-coast pressure excess | clean qDot hit frac | clean closure abs | SV5-95 qDot hit frac | qDot impulse abs | max CO branch frac | max ESV branch frac | waveform worst frac |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
  for (const scenario of report.scenarios) {
    lines.push([
      scenario.evaluation.classification,
      scenario.heartModel,
      round(scenario.dt, 5),
      scenario.tbvCorrectionMode,
      scenario.aovB,
      scenario.aovL,
      scenario.aovTauOpen,
      scenario.aovTauClose,
      scenario.tensionRiseSec,
      scenario.tensionFallSec,
      aovQDotClampLabel(scenario.aovQDotClamp, scenario.aovQDotClampNegative),
      scenario.aovQUpdateMode,
      scenario.negativeQDotSummary.pressureReversalSampleCountMax,
      round(scenario.negativeQDotSummary.pressureReversalNegativeRatioMax, 4),
      round(scenario.negativeQDotSummary.pressureReversalPressureExcessMaxMmHg, 4),
      scenario.negativeQDotSummary.forwardCoastSampleCountMax,
      round(scenario.negativeQDotSummary.forwardCoastNegativeRatioMax, 4),
      round(scenario.negativeQDotSummary.forwardCoastPressureExcessMaxMmHg, 4),
      round(scenario.negativeQDotSummary.cleanQDotHitFractionMax, 4),
      round(scenario.negativeQDotSummary.cleanClosureResidualAbsMax, 4),
      round(scenario.negativeQDotSummary.sv5To95QDotHitFractionMax, 4),
      round(scenario.negativeQDotSummary.qDotClampImpulseAbsMax, 4),
      round(scenario.evaluation.maxPerDeltaBranchFractionCOL, 4),
      round(scenario.evaluation.maxPerDeltaBranchFractionESVL, 4),
      round(maxWaveformGateFractionForScenario(scenario), 4),
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
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | AoV B | AoV Amax | AoV L | tau open | tau close | SVR | art stiff | max CO branch frac | max sanitize abs mL | max projection applied mL | contaminated points |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
      scenario.aovL,
      scenario.aovTauOpen,
      scenario.aovTauClose,
      scenario.systemicResistance,
      scenario.arterialStiffness,
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
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
  lines.push("| scope | terms | tau s | limiter | limiter scope | preset | dt | TBV correction | AoV B | AoV Amax | AoV L | tau open | tau close | SVR | art stiff | tension rise | tension fall | qDot clamp | q update | case | dCO_L | dESV_L | dEF_L | dLVPmax | dQAoMax | candidate QAo/cap | near cap >95% | local cap active | AoV total mean | AoV peak total | orifice mean | full-open orifice | area-loss extra | Bq2 mean | inertial mean | residual mean | closure mean | closure fw | solver closure fw | closure at QAoMax | closure SV5-95 | closure SV5-95 fw | discrete closure fw | diode imp fw | flow imp fw | qDot imp fw | clean closure fw | clean cand n | clean n | qDot raw max | qDot post max | qDot hit frac | qDot hit SV5-95 | qDot hit >5%peak | qDot hit open01 | qDot hit clean cand | QAo mean+ | QAo t-peak ms | max dQAo/dt | AoV open01 mean | open01 at QAoMax | near-full-open ms | QAo peak/mean | eject QAo>0 ms | eject >5%peak ms | eject SV5-95 ms | high-flow ms | baseline QAo/cap | dMax dP/dt | candidate min dP/dt | dMin dP/dt | dClamp hits | worst metric | worst frac |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
        scenario.aovL,
        scenario.aovTauOpen,
        scenario.aovTauClose,
        scenario.systemicResistance,
        scenario.arterialStiffness,
        scenario.tensionRiseSec,
        scenario.tensionFallSec,
        aovQDotClampLabel(scenario.aovQDotClamp, scenario.aovQDotClampNegative),
        scenario.aovQUpdateMode,
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
        round(gate.candidate.AoVFlowWeightedFullOpenOrificeGradient, 4),
        round(gate.candidate.AoVFlowWeightedAreaLossExtraGradient, 4),
        round(gate.candidate.AoVFlowWeightedBernoulliGradient, 4),
        round(gate.candidate.AoVFlowWeightedInertialGradient, 4),
        round(gate.candidate.AoVFlowWeightedResidualGradient, 4),
        round(gate.candidate.AoVClosureResidualMean, 4),
        round(gate.candidate.AoVFlowWeightedClosureResidual, 4),
        round(gate.candidate.AoVFlowWeightedSolverClosureResidual, 4),
        round(gate.candidate.AoVClosureResidualAtQAoMax, 4),
        round(gate.candidate.AoVClosureResidualSV5To95Mean, 4),
        round(gate.candidate.AoVFlowWeightedClosureResidualSV5To95, 4),
        round(gate.candidate.AoVFlowWeightedDiscreteClosureResidual, 4),
        round(gate.candidate.AoVFlowWeightedDiodeImpulseGradient, 4),
        round(gate.candidate.AoVFlowWeightedFlowClampImpulseGradient, 4),
        round(gate.candidate.AoVFlowWeightedQDotClampImpulseGradient, 4),
        round(gate.candidate.AoVFlowWeightedCleanClosureResidual, 4),
        gate.candidate.AoVCleanCandidateSampleCount,
        gate.candidate.AoVCleanClosureSampleCount,
        round(gate.candidate.AoVQDotRawMaxAbs, 4),
        round(gate.candidate.AoVQDotPostMaxAbs, 4),
        round(gate.candidate.AoVQDotClampHitFraction, 4),
        round(gate.candidate.AoVQDotClampHitFractionSV5To95, 4),
        round(gate.candidate.AoVQDotClampHitFractionFivePercentPeak, 4),
        round(gate.candidate.AoVQDotClampHitFractionNearFullOpen, 4),
        round(gate.candidate.AoVQDotClampHitFractionCleanCandidate, 4),
        round(gate.candidate.QAoMeanPositive, 4),
        round(gate.candidate.QAoTimeToPeakMs, 2),
        round(gate.candidate.maxDQAoDt, 4),
        round(gate.candidate.AoVFlowWeightedOpen01, 4),
        round(gate.candidate.AoVOpen01AtQAoMax, 4),
        round(gate.candidate.AoVTimeToNearFullOpenMs, 2),
        round(gate.candidate.QAoPeakMeanRatio, 4),
        round(gate.candidate.ejectionPositiveDurationMs, 2),
        round(gate.candidate.ejectionFivePercentPeakDurationMs, 2),
        round(gate.candidate.ejectionSV5To95DurationMs, 2),
        round(gate.candidate.ejectionHighFlowDurationMs, 2),
        round(gate.baseline.QAoCapRatioMax, 4),
        round(gate.delta.maxDpdtLVP, 4),
        round(gate.candidate.minDpdtLVP, 4),
        round(gate.delta.minDpdtLVP, 4),
        round(gate.delta.clampHitCount, 0),
        gate.maxDeltaMetric,
        round(gate.maxDeltaFraction, 4),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## AoV gradient decomposition");
  lines.push("");
  lines.push("These values split the normal/HR waveform AoV pressure loss into total transient gradient, quasi-steady orifice loss (`Rq + Bq|q|` using the sampled effective valve loss), full-open orifice loss, area-loss extra while the valve is not fully open, inertial loss, clamp/event impulses, and residual. Use the full-open/orifice columns for AS-like sanity; the total gradient also contains inertial/transient effects and residual model/coupling terms. `solver closure` is evaluated before diode/flow/qDot clamps; `clean closure` is evaluated only in near-full-open, SV 5-95%, no-event samples.");
  lines.push("");
  lines.push("| heart model | dt | TBV correction | AoV clamp | limiter | preset | AoV B | AoV Amax | AoV L | tau open | tau close | SVR | art stiff | tension rise | qDot clamp | q update | case | total mean | sampled orifice mean | full-open orifice mean | area-loss extra mean | Rq mean | Bq2 mean | inertial mean | residual mean | closure fw | solver closure fw | diode imp fw | flow imp fw | qDot imp fw | clean closure fw | clean cand n | clean n | qDot raw max | qDot hit SV5-95 | qDot hit clean cand | open01 mean | open01 at QAoMax | near-full-open ms | peak orifice | peak area-loss extra | peak inertial | peak residual |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
        scenario.aovL,
        scenario.aovTauOpen,
        scenario.aovTauClose,
        scenario.systemicResistance,
        scenario.arterialStiffness,
        scenario.tensionRiseSec,
        aovQDotClampLabel(scenario.aovQDotClamp, scenario.aovQDotClampNegative),
        scenario.aovQUpdateMode,
        gate.label,
        round(gate.candidate.AoVFlowWeightedTotalGradient, 4),
        round(gate.candidate.AoVFlowWeightedOrificeGradient, 4),
        round(gate.candidate.AoVFlowWeightedFullOpenOrificeGradient, 4),
        round(gate.candidate.AoVFlowWeightedAreaLossExtraGradient, 4),
        round(gate.candidate.AoVFlowWeightedResistiveGradient, 4),
        round(gate.candidate.AoVFlowWeightedBernoulliGradient, 4),
        round(gate.candidate.AoVFlowWeightedInertialGradient, 4),
        round(gate.candidate.AoVFlowWeightedResidualGradient, 4),
        round(gate.candidate.AoVFlowWeightedClosureResidual, 4),
        round(gate.candidate.AoVFlowWeightedSolverClosureResidual, 4),
        round(gate.candidate.AoVFlowWeightedDiodeImpulseGradient, 4),
        round(gate.candidate.AoVFlowWeightedFlowClampImpulseGradient, 4),
        round(gate.candidate.AoVFlowWeightedQDotClampImpulseGradient, 4),
        round(gate.candidate.AoVFlowWeightedCleanClosureResidual, 4),
        gate.candidate.AoVCleanCandidateSampleCount,
        gate.candidate.AoVCleanClosureSampleCount,
        round(gate.candidate.AoVQDotRawMaxAbs, 4),
        round(gate.candidate.AoVQDotClampHitFractionSV5To95, 4),
        round(gate.candidate.AoVQDotClampHitFractionCleanCandidate, 4),
        round(gate.candidate.AoVFlowWeightedOpen01, 4),
        round(gate.candidate.AoVOpen01AtQAoMax, 4),
        round(gate.candidate.AoVTimeToNearFullOpenMs, 2),
        round(gate.candidate.AoVPeakOrificeGradient, 4),
        round(gate.candidate.AoVPeakAreaLossExtraGradient, 4),
        round(gate.candidate.AoVPeakInertialGradient, 4),
        round(gate.candidate.AoVPeakResidualGradient, 4),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## AoV qDot target estimator");
  lines.push("");
  lines.push("Report-only estimate of how far the sampled raw AoV flow acceleration is above the configured qDot clamp. `req reduction` is the fractional raw-qDot reduction needed to fit under the current clamp. `pressure excess` is `AoV_L * max(raw|qDot|-clamp, 0)`. `equiv extra B` is the additional Bernoulli coefficient that would create the same pressure excess at the sample's QAo; it is a range-finding aid, not a recommended parameter change. `q update` is an off-by-default comparator for the AoV q-state update ordering/integration.");
  lines.push("");
  lines.push("| heart model | dt | TBV correction | limiter | preset | AoV B | AoV L | tension rise | qDot clamp | q update | case | raw/clamp max | req reduction max | pressure excess max | equiv extra B | QAo at max | open01 at max | SV5-95 raw/clamp | SV5-95 req reduction | SV5-95 pressure excess | SV5-95 equiv extra B | clean raw/clamp | clean req reduction | clean pressure excess | clean equiv extra B |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
  for (const scenario of report.scenarios) {
    for (const gate of scenario.waveformGates) {
      lines.push([
        scenario.heartModel,
        round(scenario.dt, 5),
        scenario.tbvCorrectionMode,
        scenario.lowStretchLimiterMode,
        scenario.activeReservePreset,
        scenario.aovB,
        scenario.aovL,
        scenario.tensionRiseSec,
        aovQDotClampLabel(scenario.aovQDotClamp, scenario.aovQDotClampNegative),
        scenario.aovQUpdateMode,
        gate.label,
        round(gate.candidate.AoVQDotRawToClampRatioMax, 4),
        round(gate.candidate.AoVQDotRequiredReductionFractionMax, 4),
        round(gate.candidate.AoVQDotPressureExcessOverClampMaxMmHg, 4),
        round(gate.candidate.AoVQDotEquivalentExtraBAtMaxExcess, 8),
        round(gate.candidate.AoVQDotMaxExcessSampleQAo, 4),
        round(gate.candidate.AoVQDotMaxExcessSampleOpen01, 4),
        round(gate.candidate.AoVQDotRawToClampRatioSV5To95Max, 4),
        round(gate.candidate.AoVQDotRequiredReductionFractionSV5To95Max, 4),
        round(gate.candidate.AoVQDotPressureExcessOverClampSV5To95MaxMmHg, 4),
        round(gate.candidate.AoVQDotEquivalentExtraBAtSV5To95MaxExcess, 8),
        round(gate.candidate.AoVQDotRawToClampRatioCleanCandidateMax, 4),
        round(gate.candidate.AoVQDotRequiredReductionFractionCleanCandidateMax, 4),
        round(gate.candidate.AoVQDotPressureExcessOverClampCleanCandidateMaxMmHg, 4),
        round(gate.candidate.AoVQDotEquivalentExtraBAtCleanCandidateMaxExcess, 8),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
  lines.push("## AoV qDot open01-bin target estimator");
  lines.push("");
  lines.push("The max qDot target estimate is split by AoV opening fraction so low-open events do not get conflated with near-full-open ejection. `open<0.2` is not necessarily opening acceleration; inspect dP/qDot signs and the event-direction table below before choosing a tauOpen/tauClose/q-update lever. Use `open>=0.95` for near-full-open ejection-body behavior.");
  lines.push("");
  lines.push("| heart model | dt | TBV correction | limiter | preset | AoV B | AoV L | tau open | tension rise | qDot clamp | q update | case | open bin | n | raw/clamp max | +qDot/clamp max | -qDot/clamp max | req reduction | pressure excess | equiv extra B | QAo at max | dP at max | q current | qNext pre diode | qNext pre flow clamp | qDot pre clamp | qDot raw | +qDot max | -qDot min | open01 at max | d open01 at max |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
  for (const scenario of report.scenarios) {
    for (const gate of scenario.waveformGates) {
      for (const [bin, stats] of Object.entries(gate.candidate.AoVQDotOpen01Bins) as Array<[AoVOpen01BinKey, AoVQDotTargetBinStats]>) {
        lines.push([
          scenario.heartModel,
          round(scenario.dt, 5),
          scenario.tbvCorrectionMode,
          scenario.lowStretchLimiterMode,
          scenario.activeReservePreset,
          scenario.aovB,
          scenario.aovL,
          scenario.aovTauOpen,
          scenario.tensionRiseSec,
          aovQDotClampLabel(scenario.aovQDotClamp, scenario.aovQDotClampNegative),
          scenario.aovQUpdateMode,
          gate.label,
          bin,
          stats.sampleCount,
          round(stats.rawToClampRatioMax, 4),
          round(stats.rawToClampRatioPositiveMax, 4),
          round(stats.rawToClampRatioNegativeMax, 4),
          round(stats.requiredReductionFractionMax, 4),
          round(stats.pressureExcessOverClampMaxMmHg, 4),
          round(stats.equivalentExtraBAtMaxExcess, 8),
          round(stats.qAoAtMaxExcess, 4),
          round(stats.dPAtMaxExcess, 4),
          round(stats.qCurrentAtMaxExcess, 4),
          round(stats.qNextPreDiodeAtMaxExcess, 4),
          round(stats.qNextPreFlowClampAtMaxExcess, 4),
          round(stats.qDotPreClampAtMaxExcess, 4),
          round(stats.qDotRawAtMaxExcess, 4),
          round(stats.qDotRawPositiveMax, 4),
          round(stats.qDotRawNegativeMin, 4),
          round(stats.open01AtMaxExcess, 4),
          round(stats.open01DeltaAtMaxExcess, 5),
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
      }
    }
  }
  lines.push("");
  lines.push("## AoV low-open event-direction qDot estimator");
  lines.push("");
  lines.push("Low-open samples are split by sign/phase proxies. Bins may overlap; they are attribution readouts, not mutually exclusive classes.");
  lines.push("");
  lines.push("| heart model | dt | TBV correction | limiter | preset | AoV B | AoV L | tau open | tau close | tension rise | qDot clamp | q update | case | event bin | n | raw/clamp max | +qDot/clamp max | -qDot/clamp max | pressure excess | QAo at max | dP at max | q current | qNext pre diode | qDot raw | +qDot max | -qDot min | open01 at max | d open01 at max |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
  for (const scenario of report.scenarios) {
    for (const gate of scenario.waveformGates) {
      for (const [bin, stats] of Object.entries(gate.candidate.AoVQDotEventDirectionBins) as Array<[AoVQDotEventDirectionKey, AoVQDotTargetBinStats]>) {
        lines.push([
          scenario.heartModel,
          round(scenario.dt, 5),
          scenario.tbvCorrectionMode,
          scenario.lowStretchLimiterMode,
          scenario.activeReservePreset,
          scenario.aovB,
          scenario.aovL,
          scenario.aovTauOpen,
          scenario.aovTauClose,
          scenario.tensionRiseSec,
          aovQDotClampLabel(scenario.aovQDotClamp, scenario.aovQDotClampNegative),
          scenario.aovQUpdateMode,
          gate.label,
          bin,
          stats.sampleCount,
          round(stats.rawToClampRatioMax, 4),
          round(stats.rawToClampRatioPositiveMax, 4),
          round(stats.rawToClampRatioNegativeMax, 4),
          round(stats.pressureExcessOverClampMaxMmHg, 4),
          round(stats.qAoAtMaxExcess, 4),
          round(stats.dPAtMaxExcess, 4),
          round(stats.qCurrentAtMaxExcess, 4),
          round(stats.qNextPreDiodeAtMaxExcess, 4),
          round(stats.qDotRawAtMaxExcess, 4),
          round(stats.qDotRawPositiveMax, 4),
          round(stats.qDotRawNegativeMin, 4),
          round(stats.open01AtMaxExcess, 4),
          round(stats.open01DeltaAtMaxExcess, 5),
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
      }
    }
  }
  lines.push("");
  lines.push("## AoV_B / AS sanity");
  lines.push("");
  lines.push("| heart model | dt | TBV correction | AoV clamp | AoV B | AoV Aref | AoV Amax | AoV L | tau open | tau close | SVR | art stiff | q update | case | total mean grad | sampled orifice mean | full-open orifice mean | area-loss extra | inertial mean | residual mean | closure fw | open01 mean | eject QAo>0 ms | eject SV5-95 ms | QAo peak/mean | QAo t-peak ms | QAo/cap | branch CO frac | branch ESV frac | waveform worst frac |");
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
        scenario.aovL,
        scenario.aovTauOpen,
        scenario.aovTauClose,
        scenario.systemicResistance,
        scenario.arterialStiffness,
        scenario.aovQUpdateMode,
        gate.label,
        round(gate.candidate.AoVMeanGradient, 4),
        round(gate.candidate.AoVFlowWeightedOrificeGradient, 4),
        round(gate.candidate.AoVFlowWeightedFullOpenOrificeGradient, 4),
        round(gate.candidate.AoVFlowWeightedAreaLossExtraGradient, 4),
        round(gate.candidate.AoVFlowWeightedInertialGradient, 4),
        round(gate.candidate.AoVFlowWeightedResidualGradient, 4),
        round(gate.candidate.AoVFlowWeightedClosureResidual, 4),
        round(gate.candidate.AoVFlowWeightedOpen01, 4),
        round(gate.candidate.ejectionPositiveDurationMs, 2),
        round(gate.candidate.ejectionSV5To95DurationMs, 2),
        round(gate.candidate.QAoPeakMeanRatio, 4),
        round(gate.candidate.QAoTimeToPeakMs, 2),
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
  lines.push(markdownSeparator(lines[lines.length - 1]));
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
  lines.push("- `low-stretch limiter` remains off by default. `aInfCap`, `activeReserveCap`, and `fIsoSlopeRelax` are comparator arms that can only reduce low-stretch activation/target force; `fIsoSlopeRelax` specifically tests whether relaxing the low-stretch force-length ramp lowers ESV/ejection return-map gain without normal/HR waveform damage.");
  lines.push("- Active reserve preset expands only the `activeReserveCap` comparator: direct presets broadly scale low-stretch active target, threshold presets act only at high activation/reserve.");
  lines.push("- Shape gates compare each candidate to the tau=0/no-limiter baseline at matching deltas. They report mean CO/SV preservation, low-preload monotonicity, dip/re-rise, low-side slope preservation, and limiter hit/reduction statistics.");
  lines.push("- Branch localization is report-only: `edv-dominant` means preload/EDV branch motion dominates, `esv/ejection-dominant` means CO/ESV branch motion dominates, and `mixed` is ambiguous.");
  lines.push("- LA/MV filling diagnostics are report-only regime markers for testing whether MV A-flow, mid-diastolic flow, LA A-loop collapse, MV event counts, or E/mid/A morphology alternation co-localizes with low-preload or hypervolume alternans onset.");
  lines.push("- Waveform gates compare normal and HR100 settled waveforms against the tau=0 baseline; they are report-only in this PR.");
  lines.push("- Ejection duration is reported with multiple definitions: QAo>0, QAo>5% of peak, SV 5-95%, and the historical high-flow/open-window. Use the first three for physiology; keep high-flow only for continuity with older reports.");
  lines.push("- AoV residual is now separated from full-open orifice loss and extra area-loss while the valve is not fully open. Large residuals should be investigated before treating total LVP-AoP gradient as AS-like obstruction.");
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
    "AoV_L",
    "AoV_tauOpen",
    "AoV_tauClose",
    "systemicResistance",
    "arterialStiffness",
    "tensionRiseSec",
    "tensionFallSec",
    "aovQDotClamp",
    "aovQDotClampNegative",
    "aovQUpdateMode",
    "scenarioPressureReversalSampleCountMax",
    "scenarioPressureReversalNegativeRatioMax",
    "scenarioPressureReversalPressureExcessMaxMmHg",
    "scenarioForwardCoastSampleCountMax",
    "scenarioForwardCoastNegativeRatioMax",
    "scenarioForwardCoastPressureExcessMaxMmHg",
    "scenarioCleanQDotHitFractionMax",
    "scenarioCleanClosureResidualAbsMax",
    "scenarioSV5To95QDotHitFractionMax",
    "scenarioQDotClampImpulseAbsMax",
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
    "normalAoVClosureResidualMean",
    "normalAoVFlowWeightedClosureResidual",
    "normalAoVClosureResidualAtQAoMax",
    "normalAoVClosureResidualSV5To95Mean",
    "normalAoVFlowWeightedClosureResidualSV5To95",
    "normalAoVFlowWeightedCleanClosureResidual",
    "normalAoVCleanClosureSampleCount",
    "normalAoVQDotRawMaxAbs",
    "normalAoVQDotPostMaxAbs",
    "normalAoVQDotClampHitFraction",
    "normalAoVQDotClampHitFractionSV5To95",
    "normalAoVQDotRawToClampRatioMax",
    "normalAoVQDotRequiredReductionFractionMax",
    "normalAoVQDotPressureExcessOverClampMaxMmHg",
    "normalAoVQDotEquivalentExtraBAtMaxExcess",
    "normalAoVQDotRawToClampRatioSV5To95Max",
    "normalAoVQDotRequiredReductionFractionSV5To95Max",
    "normalAoVQDotEquivalentExtraBAtSV5To95MaxExcess",
    "normalAoVOpenLt02SampleCount",
    "normalAoVOpenLt02RawToClampRatioMax",
    "normalAoVOpenLt02PressureExcessOverClampMaxMmHg",
    "normalAoVOpenLt02QAoAtMaxExcess",
    "normalAoVOpenLt02DPatMaxExcess",
    "normalAoVOpenLt02QCurrentAtMaxExcess",
    "normalAoVOpenLt02QNextPreDiodeAtMaxExcess",
    "normalAoVOpenLt02QDotPreClampAtMaxExcess",
    "normalAoVOpenLt02Open01AtMaxExcess",
    "normalAoVOpenGte095SampleCount",
    "normalAoVOpenGte095RawToClampRatioMax",
    "normalAoVOpenGte095PressureExcessOverClampMaxMmHg",
    "normalAoVOpenGte095QAoAtMaxExcess",
    "normalAoVOpenGte095DPatMaxExcess",
    "normalAoVOpenGte095QCurrentAtMaxExcess",
    "normalAoVOpenGte095QNextPreDiodeAtMaxExcess",
    "normalAoVOpenGte095QDotPreClampAtMaxExcess",
    "normalAoVOpenGte095Open01AtMaxExcess",
    "normalAoVLowOpenOpeningAccelSampleCount",
    "normalAoVLowOpenOpeningAccelRawToClampRatioMax",
    "normalAoVLowOpenOpeningAccelPositiveRatioMax",
    "normalAoVLowOpenOpeningAccelNegativeRatioMax",
    "normalAoVLowOpenOpeningAccelDPatMaxExcess",
    "normalAoVLowOpenOpeningAccelQDotRawAtMaxExcess",
    "normalAoVLowOpenOpeningAccelOpen01DeltaAtMaxExcess",
    "normalAoVLowOpenPressureReversalSampleCount",
    "normalAoVLowOpenPressureReversalRawToClampRatioMax",
    "normalAoVLowOpenPressureReversalPositiveRatioMax",
    "normalAoVLowOpenPressureReversalNegativeRatioMax",
    "normalAoVLowOpenPressureReversalDPatMaxExcess",
    "normalAoVLowOpenPressureReversalQDotRawAtMaxExcess",
    "normalAoVLowOpenPressureReversalOpen01DeltaAtMaxExcess",
    "normalAoVFlowWeightedFullOpenOrificeGradient",
    "normalAoVFlowWeightedAreaLossExtraGradient",
    "normalAoVFlowWeightedOpen01",
    "normalAoVPeakOrificeGradient",
    "normalAoVPeakInertialGradient",
    "normalAoVPeakResidualGradient",
    "normalAoVPeakAreaLossExtraGradient",
    "normalAoVOpen01AtQAoMax",
    "normalAoVMeanOpen01DuringEjection",
    "normalAoVTimeToNearFullOpenMs",
    "normalQAoMeanPositive",
    "normalQAoTimeToPeakMs",
    "normalMaxDQAoDt",
    "normalMinDpdtLVP",
    "normalQAoPeakMeanRatio",
    "normalEjectionDurationMs",
    "normalEjectionPositiveDurationMs",
    "normalEjectionFivePercentPeakDurationMs",
    "normalEjectionSV5To95DurationMs",
    "normalEjectionHighFlowDurationMs",
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
      const normalCandidate = scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate;
      const normalOpenLt02 = normalCandidate?.AoVQDotOpen01Bins["open-lt-0.2"];
      const normalOpenGte095 = normalCandidate?.AoVQDotOpen01Bins["open-gte-0.95"];
      const normalOpeningAccel = normalCandidate?.AoVQDotEventDirectionBins["low-open-opening-accel"];
      const normalPressureReversal = normalCandidate?.AoVQDotEventDirectionBins["low-open-pressure-reversal-decel"];
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
        scenario.aovL,
        scenario.aovTauOpen,
        scenario.aovTauClose,
        scenario.systemicResistance,
        scenario.arterialStiffness,
        scenario.tensionRiseSec,
        scenario.tensionFallSec,
        scenario.aovQDotClamp,
        scenario.aovQDotClampNegative,
        scenario.aovQUpdateMode,
        scenario.negativeQDotSummary.pressureReversalSampleCountMax,
        scenario.negativeQDotSummary.pressureReversalNegativeRatioMax,
        scenario.negativeQDotSummary.pressureReversalPressureExcessMaxMmHg,
        scenario.negativeQDotSummary.forwardCoastSampleCountMax,
        scenario.negativeQDotSummary.forwardCoastNegativeRatioMax,
        scenario.negativeQDotSummary.forwardCoastPressureExcessMaxMmHg,
        scenario.negativeQDotSummary.cleanQDotHitFractionMax,
        scenario.negativeQDotSummary.cleanClosureResidualAbsMax,
        scenario.negativeQDotSummary.sv5To95QDotHitFractionMax,
        scenario.negativeQDotSummary.qDotClampImpulseAbsMax,
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
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVClosureResidualMean ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedClosureResidual ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVClosureResidualAtQAoMax ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVClosureResidualSV5To95Mean ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedClosureResidualSV5To95 ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedCleanClosureResidual ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVCleanClosureSampleCount ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotRawMaxAbs ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotPostMaxAbs ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotClampHitFraction ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotClampHitFractionSV5To95 ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotRawToClampRatioMax ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotRequiredReductionFractionMax ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotPressureExcessOverClampMaxMmHg ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotEquivalentExtraBAtMaxExcess ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotRawToClampRatioSV5To95Max ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotRequiredReductionFractionSV5To95Max ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVQDotEquivalentExtraBAtSV5To95MaxExcess ?? "",
        normalOpenLt02?.sampleCount ?? "",
        normalOpenLt02?.rawToClampRatioMax ?? "",
        normalOpenLt02?.pressureExcessOverClampMaxMmHg ?? "",
        normalOpenLt02?.qAoAtMaxExcess ?? "",
        normalOpenLt02?.dPAtMaxExcess ?? "",
        normalOpenLt02?.qCurrentAtMaxExcess ?? "",
        normalOpenLt02?.qNextPreDiodeAtMaxExcess ?? "",
        normalOpenLt02?.qDotPreClampAtMaxExcess ?? "",
        normalOpenLt02?.open01AtMaxExcess ?? "",
        normalOpenGte095?.sampleCount ?? "",
        normalOpenGte095?.rawToClampRatioMax ?? "",
        normalOpenGte095?.pressureExcessOverClampMaxMmHg ?? "",
        normalOpenGte095?.qAoAtMaxExcess ?? "",
        normalOpenGte095?.dPAtMaxExcess ?? "",
        normalOpenGte095?.qCurrentAtMaxExcess ?? "",
        normalOpenGte095?.qNextPreDiodeAtMaxExcess ?? "",
        normalOpenGte095?.qDotPreClampAtMaxExcess ?? "",
        normalOpenGte095?.open01AtMaxExcess ?? "",
        normalOpeningAccel?.sampleCount ?? "",
        normalOpeningAccel?.rawToClampRatioMax ?? "",
        normalOpeningAccel?.rawToClampRatioPositiveMax ?? "",
        normalOpeningAccel?.rawToClampRatioNegativeMax ?? "",
        normalOpeningAccel?.dPAtMaxExcess ?? "",
        normalOpeningAccel?.qDotRawAtMaxExcess ?? "",
        normalOpeningAccel?.open01DeltaAtMaxExcess ?? "",
        normalPressureReversal?.sampleCount ?? "",
        normalPressureReversal?.rawToClampRatioMax ?? "",
        normalPressureReversal?.rawToClampRatioPositiveMax ?? "",
        normalPressureReversal?.rawToClampRatioNegativeMax ?? "",
        normalPressureReversal?.dPAtMaxExcess ?? "",
        normalPressureReversal?.qDotRawAtMaxExcess ?? "",
        normalPressureReversal?.open01DeltaAtMaxExcess ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedFullOpenOrificeGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedAreaLossExtraGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVFlowWeightedOpen01 ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVPeakOrificeGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVPeakInertialGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVPeakResidualGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVPeakAreaLossExtraGradient ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVOpen01AtQAoMax ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVMeanOpen01DuringEjection ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.AoVTimeToNearFullOpenMs ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.QAoMeanPositive ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.QAoTimeToPeakMs ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.maxDQAoDt ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.minDpdtLVP ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.QAoPeakMeanRatio ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.ejectionDurationMs ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.ejectionPositiveDurationMs ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.ejectionFivePercentPeakDurationMs ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.ejectionSV5To95DurationMs ?? "",
        scenario.waveformGates.find((gate) => gate.label === "normal")?.candidate.ejectionHighFlowDurationMs ?? "",
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
    aovLValues: DEFAULT_AOV_L_VALUES,
    aovTauOpenValues: DEFAULT_AOV_TAU_OPEN_VALUES,
    aovTauCloseValues: DEFAULT_AOV_TAU_CLOSE_VALUES,
    systemicResistanceValues: DEFAULT_SYSTEMIC_RESISTANCE_VALUES,
    arterialStiffnessValues: DEFAULT_ARTERIAL_STIFFNESS_VALUES,
    tensionRiseSecValues: DEFAULT_TENSION_RISE_SEC_VALUES,
    tensionFallSecValues: DEFAULT_TENSION_FALL_SEC_VALUES,
    aovQDotClampValues: DEFAULT_AOV_Q_DOT_CLAMP_VALUES,
    aovQDotClampPairs: DEFAULT_AOV_Q_DOT_CLAMP_PAIRS,
    aovQUpdateModes: DEFAULT_AOV_Q_UPDATE_MODES,
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
    else if (key === "--aov-l" && value) opts.aovLValues = normalizeAovValues(parseNumberList(value), DEFAULT_AOV_L);
    else if (key === "--aov-tau-open" && value) opts.aovTauOpenValues = normalizeAovValues(parseNumberList(value), DEFAULT_AOV_TAU_OPEN);
    else if (key === "--aov-tau-close" && value) opts.aovTauCloseValues = normalizeAovValues(parseNumberList(value), DEFAULT_AOV_TAU_CLOSE);
    else if (key === "--systemic-resistance" && value) opts.systemicResistanceValues = normalizeAovValues(parseNumberList(value), DEFAULT_SYSTEMIC_RESISTANCE);
    else if (key === "--arterial-stiffness" && value) opts.arterialStiffnessValues = normalizeAovValues(parseNumberList(value), DEFAULT_ARTERIAL_STIFFNESS);
    else if (key === "--tension-rise" && value) opts.tensionRiseSecValues = normalizeAxisValues(parseNumberList(value), 0);
    else if (key === "--tension-fall" && value) opts.tensionFallSecValues = normalizeAxisValues(parseNumberList(value), 0);
    else if (key === "--aov-qdot-clamp" && value) opts.aovQDotClampValues = normalizeAovValues(parseNumberList(value), DEFAULT_AOV_Q_DOT_CLAMP);
    else if (key === "--aov-qdot-clamp-pair" && value) opts.aovQDotClampPairs = parseAovQDotClampPairs(value);
    else if (key === "--aov-q-update" && value) opts.aovQUpdateModes = parseAorticValveQUpdateModes(value);
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

function parseAorticValveQUpdateModes(value: string): AorticValveQUpdateMode[] {
  const modes = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const mode of modes) {
    if (!isAorticValveQUpdateMode(mode)) throw new Error(`Invalid AoV q-update mode: ${mode}`);
  }
  const unique = Array.from(new Set(modes)) as AorticValveQUpdateMode[];
  return unique.sort((a, b) => (a === "current-loss" ? -1 : b === "current-loss" ? 1 : a.localeCompare(b)));
}

function isAorticValveQUpdateMode(value: string): value is AorticValveQUpdateMode {
  return value === "current-loss"
    || value === "qnext-loss"
    || value === "substep-2"
    || value === "substep-4";
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
    if (mode !== "none" && mode !== "aInfCap" && mode !== "activeReserveCap" && mode !== "fIsoSlopeRelax") {
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

function parseAovQDotClampPairs(value: string): AovQDotClampConfig[] {
  const pairs = value.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(parseAovQDotClampPair);
  const unique = new Map<string, AovQDotClampConfig>();
  for (const pair of pairs) {
    unique.set(`${pair.positive}/${pair.negative}`, pair);
  }
  return Array.from(unique.values()).sort((a, b) => {
    const aDefault = a.positive === DEFAULT_AOV_Q_DOT_CLAMP && a.negative === DEFAULT_AOV_Q_DOT_CLAMP;
    const bDefault = b.positive === DEFAULT_AOV_Q_DOT_CLAMP && b.negative === DEFAULT_AOV_Q_DOT_CLAMP;
    if (aDefault !== bDefault) return aDefault ? -1 : 1;
    if (a.positive !== b.positive) return a.positive - b.positive;
    return a.negative - b.negative;
  });
}

function parseAovQDotClampPair(value: string): AovQDotClampConfig {
  const cleaned = value.replace(/\s/g, "");
  const separator = cleaned.includes("/") ? "/" : cleaned.includes(":") ? ":" : "";
  if (!separator) throw new Error(`Invalid AoV qDot clamp pair: ${value}`);
  const [positiveRaw, negativeRaw, ...rest] = cleaned.split(separator);
  if (!positiveRaw || !negativeRaw || rest.length > 0) throw new Error(`Invalid AoV qDot clamp pair: ${value}`);
  const positive = Number(positiveRaw.replace(/^\+/, ""));
  const negative = Number(negativeRaw.replace(/^[-+]/, ""));
  if (!Number.isFinite(positive) || positive <= 0 || !Number.isFinite(negative) || negative <= 0) {
    throw new Error(`Invalid AoV qDot clamp pair: ${value}`);
  }
  return { positive, negative };
}

function normalizeAovValues(values: number[], defaultValue: number): number[] {
  const positive = values.filter((value) => Number.isFinite(value) && value > 0);
  const all = [defaultValue, ...positive];
  return Array.from(new Set(all.map((value) => String(value)))).map(Number)
    .sort((a, b) => (a === defaultValue ? -1 : b === defaultValue ? 1 : a - b));
}

function normalizeAxisValues(values: number[], defaultValue: number): number[] {
  const finite = values.filter((value) => Number.isFinite(value) && value >= 0);
  const all = [defaultValue, ...finite];
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
    "       [--low-stretch-limiter=none,aInfCap,activeReserveCap,fIsoSlopeRelax] [--low-stretch-limiter-scope=lv,ventricles]",
    "       [--active-reserve-preset=directMild,directMedium,thresholdMild,thresholdMedium]",
    "       [--tbv-correction=on,off,low]",
    "       [--aortic-flow-clamp=hard,soft-tanh,soft-rational,local-c1-0.95,local-c2-0.98]",
    "       [--aov-b=0.000001,0.00001,0.00003] [--as-aov-amax=3.5,2,1.5,1]",
    "       [--aov-l=0.00025,0.0005] [--aov-tau-open=0.006,0.012] [--aov-tau-close=0.008,0.016]",
    "       [--systemic-resistance=1,1.2] [--arterial-stiffness=0.75,1.0]",
    "       [--tension-rise=0,0.02,0.04] [--tension-fall=0,0.04,0.08] [--aov-qdot-clamp=40000,80000]",
    "       [--aov-qdot-clamp-pair=+40000/-80000,+80000/-40000] [--aov-q-update=current-loss,qnext-loss,substep-2,substep-4]",
    "       [--include-all-scope] [--branch-only] [--max-return-map-points=6]",
    "       [--quiet-progress]",
    "",
    "Example:",
    "  npm run verify:starling-low-preload-matrix -- --deltas=0,-1250,-1400 --dt=0.001 --lambda-act-tau=0 --aov-b=0.000001,0.000002 --aov-l=0.00025,0.0005 --aov-tau-open=0.006,0.012 --tbv-correction=on --max-return-map-points=2",
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
