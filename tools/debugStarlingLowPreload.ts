import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore, type AorticFlowClampMode, type AorticValveQUpdateMode, type DynamicQDotClampScope, type ModelCoreActiveStressDiagnostics, type ModelCoreClampDiagnostics } from "@/engine/ModelCore";
import { DYNAMIC_FLOW_CLAMP_ML_PER_S } from "@/engine/core/topology";
import { makeIndex } from "@/engine/core/stateLayout";
import type { StarlingSweepRequest } from "@/engine/guytonStarling";
import { PREVIEW_SETTLE_POLICY, type SettleStatus } from "@/engine/settling";
import type { CoreRuntimeParams, HeartModelMode, SimMetrics, SimObservables, SimSample, SimulationHealth } from "@/engine/protocol";
import type { ActiveChamberParams, Chamber, LambdaActTerms, LowStretchLimiterMode } from "@/engine/chambers";
import type { SerializedModelState } from "@/engine/stateContract";

type DebugOptions = {
  outDir: string;
  targetVolumeMl: number;
  heartModel?: HeartModelMode;
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  lambdaActScope: LambdaActScope;
  lambdaActTerms?: LambdaActTerms;
  lowStretchLimiterMode?: LowStretchLimiterMode;
  lowStretchLimiterScope?: LambdaActScope;
  tensionScope?: LambdaActScope;
  activeReservePreset?: ActiveReservePreset;
  traceBeats: number;
  sampleHz: number;
  returnMapMode: ReturnMapModeOption;
  maxReturnMapPoints?: number;
  returnMapDeltasMl?: number[];
  beatPairOverlay?: boolean;
  quietClampLog: boolean;
  tbvCorrectionMode?: TBVCorrectionMode;
  aorticFlowClampMode?: AorticFlowClampMode;
  aovB?: number;
  aovAmax?: number;
  aovL?: number;
  aovTauOpen?: number;
  aovTauClose?: number;
  systemicResistance?: number;
  arterialStiffness?: number;
  tensionRiseSec?: number;
  tensionFallSec?: number;
  aovQDotClamp?: number;
  aovQDotClampNegative?: number;
  qDotClampScope?: DynamicQDotClampScope;
  aovQUpdateMode?: AorticValveQUpdateMode;
};

type ActiveBeatSummary = {
  lambdaMean: number;
  lambdaMin: number;
  lambdaMax: number;
  lambdaRawMean: number;
  lambdaActMean: number;
  lambdaForKdMean: number;
  lambdaForFIsoMean: number;
  tauLambdaActSecMean: number;
  KdMean: number;
  aInfMean: number;
  tauAMean: number;
  cMean: number;
  aMean: number;
  sigmaActTargetMean: number;
  sigmaActMean: number;
  sigmaPasMean: number;
  fIsoMean: number;
  fIsoRawMean: number;
  fIsoLimiterMean: number;
  fIsoLimiterMin: number;
  fIsoLimiterHitFraction: number;
  fIsoLimiterDeltaMean: number;
  gOverMean: number;
  forceVelocityScaleMean: number;
  dLogAInf_dLambdaActMean: number;
  dLogFIso_dLambdaActMean: number;
  dLogGOver_dLambdaRawMean: number;
  dLogCompositeActive_dLambdaActMean: number;
  lambdaActMinusRawMean: number;
  dLogAInf_dLambdaMean: number;
  dLogFIso_dLambdaMean: number;
  dLogGOver_dLambdaMean: number;
  dLogCompositeActive_dLambdaMean: number;
  lowStretchLimiterGateMean: number;
  aInfRawMean: number;
  aInfCapMean: number;
  aInfLimiterDeltaMean: number;
  activeTargetLimiterMean: number;
  activeTargetLimiterMin: number;
  activeTargetLimiterHitFraction: number;
  sigmaActTargetRawMean: number;
  sigmaActTargetRawMax: number;
  sigmaActTargetMax: number;
  sigmaActTargetReductionFractionMean: number;
  pressureFloorHitFraction: number;
};

type BeatTraceRow = {
  beat: number;
  sampleCount: number;
  LAPMean: number;
  RAPMean: number;
  CO_L: number;
  CO_R: number;
  SV_L: number;
  SV_R: number;
  EDV_L: number;
  ESV_L: number;
  EDV_R: number;
  ESV_R: number;
  LVPMax: number;
  AoPMean: number;
  AoPMax: number;
  PAPMean: number;
  PAPMax: number;
  QAoMax: number;
  QMVMax: number;
  QTVMax: number;
  QPVMax: number;
  QAoCapRatioMax: number;
  QAoNearCap90Fraction: number;
  QAoNearCap95Fraction: number;
  QAoNearCap98Fraction: number;
  QAoAtCapFraction: number;
  QAoLocalCapActiveFraction: number;
  filling: FillingRegimeSummary;
  active: Partial<Record<Chamber, ActiveBeatSummary>>;
};

type ValveTraceSummary = {
  minQ: number;
  maxQ: number;
  forwardVolumeMl: number;
  reverseVolumeMl: number;
  negativeSampleCount: number;
};

type FillingRegimeSummary = {
  MV_E_forward_mL: number;
  MV_A_forward_mL: number;
  MV_A_fraction: number | null;
  MV_E_peak: number | null;
  MV_A_peak: number | null;
  MV_mid_forward_mL: number;
  MV_mid_peak: number | null;
  MV_forward_peak_count: number;
  MV_mid_forward_peak_count: number;
  QMV_near_zero_return_count: number;
  MV_open_close_reopen_count: number;
  MV_interwave_xi_min: number | null;
  MV_interwave_open01_min: number | null;
  LAP_LVP_zero_crossing_count: number;
  fillingMorphologyClass: FillingMorphologyClass;
  LA_loop_area: number;
  LA_A_loop_area: number;
  LA_A_loop_fraction: number | null;
  atrialSystoleTransmitralGradientMean: number;
  atrialSystoleTransmitralGradientMax: number;
  atrialSystoleMVOpenFraction: number;
};

type FillingMorphologyClass = "E-only" | "E+A" | "E+mid+A" | "weak-A" | "indeterminate";

type ReturnMapFeature = {
  plus: number;
  minus: number;
  centralSlope: number;
  absCentralSlope: number;
};

type ReturnMapFeatureKey = "EDV_L" | "ESV_L" | "CO_L" | "LAPMean" | "QAoMax" | "AoPMax" | "AoPMean" | "LVPMax" | "sigmaActTargetMax" | "sigmaActMean";
type ReturnMapModeKey = "volumeLambdaActFixed" | "volumeLambdaActReset";
export type ReturnMapModeOption = "none" | "fixed" | "reset" | "both";
export type LambdaActScope = "lv" | "ventricles" | "all";
export type TBVCorrectionMode = "on" | "off" | "low";
export type ActiveReservePreset = "none" | "directMild" | "directMedium" | "thresholdMild" | "thresholdMedium";

type ReturnMapPhaseDiagnostic = {
  measuredBeatPlus: number | null;
  measuredBeatMinus: number | null;
  features: Partial<Record<ReturnMapFeatureKey, ReturnMapFeature>>;
  clampCrossing: boolean;
  nonsmooth: boolean;
  plusClampHits: number;
  minusClampHits: number;
};

type ReturnMapDiagnostic = {
  status: "ok" | "failed" | "skipped";
  method: "edv-section-volume-preserving-lv-pvein-central-difference";
  sectionInterpolation: "sample-peak";
  perturbationMl: number;
  primaryMode: ReturnMapModeKey;
  sourcePhi: number;
  sectionBeat: number | null;
  sectionPhi: number | null;
  sectionVlvMl: number | null;
  measuredBeatPlus: number | null;
  measuredBeatMinus: number | null;
  features: Partial<Record<ReturnMapFeatureKey, ReturnMapFeature>>;
  oneBeat: ReturnMapPhaseDiagnostic | null;
  twoBeatSamePhase: ReturnMapPhaseDiagnostic | null;
  modes: Partial<Record<ReturnMapModeKey, {
    description: string;
    oneBeat: ReturnMapPhaseDiagnostic | null;
    twoBeatSamePhase: ReturnMapPhaseDiagnostic | null;
  }>>;
  branchAmplitude: Partial<Record<ReturnMapFeatureKey, number>>;
  branchAmplitudeFraction: Partial<Record<ReturnMapFeatureKey, number>>;
  clampCrossing: boolean;
  nonsmooth: boolean;
  failureReason?: string;
};

type DebugPoint = {
  deltaVolumeMl: number;
  targetVolumeMl: number;
  seededFromDeltaMl: number | null;
  wallMs: number;
  settle: Pick<SettleStatus, "settled" | "reason" | "periodBeats" | "periodDelta" | "adjacentDelta" | "worstSignal" | "worstDelta" | "beats"> & {
    actualSeconds: number | null;
  };
  health: {
    status: string;
    clampHitCount: number;
    leftRightFlowMismatchLMin: number;
    cycleMetricDelta: number;
    messages: string[];
  };
  periodMetrics: MetricSummary;
  lastBeatMetrics: Omit<MetricSummary, "SV_L" | "SV_R" | "LVEDPApprox" | "RVEDPApprox">;
  valveVolumesMl: {
    MVReverse: number;
    AoVReverse: number;
    TVReverse: number;
    PVReverse: number;
    MVForward: number;
    AoVForward: number;
    TVForward: number;
    PVForward: number;
  };
  valveTrace: Record<"MV" | "AoV" | "TV" | "PV", ValveTraceSummary>;
  clampDiagnostics: ModelCoreClampDiagnostics;
  tbvAudit: TBVAuditSummary;
  activeStressTerminal: ModelCoreActiveStressDiagnostics;
  beatTrace: BeatTraceRow[];
  beatPairOverlay?: BeatPairOverlay;
  returnMap: ReturnMapDiagnostic;
  observables: Pick<SimObservables, "P_PVein" | "Pperi" | "Ppc" | "VLVeff" | "VRVeff" | "PLVfw" | "PVI_LV" | "septumShiftMl">;
};

type BeatPairOverlay = {
  beats: [number, number] | [];
  rows: BeatPairOverlayRow[];
  summary?: BeatPairOverlaySummary;
  interpretation: {
    purpose: string;
    primaryQuestion: string;
    columns: string[];
  };
};

type BeatPairLabel = "high-output" | "low-output" | "tie";

type BeatPairBeatSummary = {
  beat: number;
  pairBeat: "previous" | "last";
  label: BeatPairLabel;
  CO_L: number;
  SV_L: number;
  EDV_L: number;
  ESV_L: number;
  QAoMax: number;
  sigmaActTargetMax: number | null;
  sigmaActMax: number | null;
};

type BeatPairSignalKey =
  | "LV_c"
  | "LV_a"
  | "LV_sigmaActTarget"
  | "LV_sigmaAct"
  | "QAo"
  | "AoV_open01"
  | "AoP"
  | "VLV"
  | "QMV"
  | "MV_open01"
  | "LAP_minus_LVP";

type BeatPairSignalDivergence = {
  signal: string;
  sourceColumn: BeatPairSignalKey;
  scale: number;
  maxAbsDiff: number;
  maxNormalizedDiff: number;
  meanAbsNormalizedDiff: number;
  firstDivergencePhase: number | null;
  firstDivergenceWindow: string | null;
  highMinusLowAtFirstDivergence: number | null;
};

type BeatPairWindowDifference = {
  window: string;
  phaseStart: number;
  phaseEnd: number;
  signal: string;
  sourceColumn: BeatPairSignalKey;
  meanDiff: number;
  meanAbsDiff: number;
  maxAbsDiff: number;
  meanNormalizedDiff: number;
  maxNormalizedDiff: number;
  signedArea: number;
};

type BeatPairOverlaySummary = {
  highOutputBeat: number | null;
  lowOutputBeat: number | null;
  coDifferenceLMin: number | null;
  svDifferenceMl: number | null;
  esvDifferenceMl: number | null;
  qAoMaxDifferenceMlPerSec: number | null;
  sigmaActTargetMaxDifferencePa: number | null;
  sigmaActMaxDifferencePa: number | null;
  divergenceThreshold: number;
  divergenceConsecutiveSamples: number;
  beatSummaries: BeatPairBeatSummary[];
  signals: BeatPairSignalDivergence[];
  windows: BeatPairWindowDifference[];
};

type BeatPairOverlayRow = {
  beat: number;
  pairBeat: "previous" | "last";
  phase: number;
  tFromBeatStartSec: number;
  tSec: number;
  QMV: number;
  xiMV: number;
  MV_open01: number;
  LAP_minus_LVP: number;
  VLV: number;
  ESV_marker01: number;
  EDV_marker01: number;
  LV_c: number | null;
  LV_a: number | null;
  LV_sigmaActTargetRaw: number | null;
  LV_sigmaActTarget: number | null;
  LV_sigmaAct: number | null;
  LV_lambdaRaw: number | null;
  LV_lambdaAct: number | null;
  QAo: number;
  xiAoV: number;
  AoV_open01: number;
  AoP: number;
  LVP: number;
  AoP_minus_LVP: number;
  dP_AoV: number;
  AoV_areaRatio: number;
};

type TBVAuditSummary = {
  correctionMode: TBVCorrectionMode;
  classification: "clean" | "contaminated";
  sanitizeSignedMl: number;
  sanitizeAbsMl: number;
  sanitizeByNodeSignedMl: Partial<Record<string, number>>;
  sanitizeByNodeAbsMl: Partial<Record<string, number>>;
  projectionRequestedMl: number;
  projectionAppliedMl: number;
  projectionAbsAppliedMl: number;
  projectionByNodeSignedMl: Partial<Record<string, number>>;
  projectionByNodeAbsMl: Partial<Record<string, number>>;
  tbvBeforeProjectionMl: number;
  tbvAfterProjectionMl: number;
  expectedTBVMl: number;
  tbvErrorBeforeProjectionMl: number;
  tbvErrorAfterProjectionMl: number;
};

type MetricSummary = {
  LAPMean: number;
  RAPMean: number;
  CO_L: number;
  CO_R: number;
  pulmonaryVenousReturnLMin: number;
  systemicVenousReturnLMin: number;
  SV_L: number;
  SV_R: number;
  LVEDPApprox: number;
  RVEDPApprox: number;
};

type DtScenarioReport = {
  dt: number;
  lambdaActTauSec: number;
  lambdaActScope: LambdaActScope;
  lambdaActTerms: LambdaActTerms;
  points: DebugPoint[];
  summary: DebugSummary;
};

type DebugSummary = {
  pointCount: number;
  period2Count: number;
  maxAdjacentDelta: number;
  maxPeriodDelta: number;
  maxValveReverseMl: number;
  maxClampHitCount: number;
  maxAbsReturnMapSlopeEDVL: number;
  maxAbsTwoBeatReturnMapSlopeEDVL: number;
  maxAbsReturnMapSlopeESVL: number;
  maxAbsTwoBeatReturnMapSlopeESVL: number;
  maxAbsReturnMapSlopeCOL: number;
  maxAbsTwoBeatReturnMapSlopeCOL: number;
  maxAbsReturnMapSlopeQAoMax: number;
  maxAbsTwoBeatReturnMapSlopeQAoMax: number;
  maxAbsReturnMapSlopeAoPMax: number;
  maxAbsTwoBeatReturnMapSlopeAoPMax: number;
  maxBranchAmplitudeCOL: number;
  maxBranchAmplitudeFractionCOL: number;
  maxBranchAmplitudeEDVL: number;
  maxBranchAmplitudeFractionEDVL: number;
  maxBranchAmplitudeESVL: number;
  maxBranchAmplitudeFractionESVL: number;
  maxBranchAmplitudeQAoMax: number;
  maxBranchAmplitudeFractionQAoMax: number;
  maxBranchAmplitudeAoPMax: number;
  maxBranchAmplitudeFractionAoPMax: number;
  maxQAoCapRatioMax: number;
  maxQAoNearCap90Fraction: number;
  maxQAoNearCap95Fraction: number;
  maxQAoNearCap98Fraction: number;
  maxQAoAtCapFraction: number;
  maxQAoLocalCapActiveFraction: number;
  minMVAForwardMl: number;
  minMVAFraction: number;
  minLAAloopArea: number;
  minLAAloopFraction: number;
  maxAtrialSystoleTransmitralGradientMean: number;
  maxAtrialSystoleTransmitralGradientMax: number;
  minAtrialSystoleMVOpenFraction: number;
  nodeClampHits: Record<string, number>;
  dynamicFlowClampHits: Record<string, number>;
  valveDiodeClampHits: Record<string, number>;
  maxSanitizeAbsMl: number;
  maxProjectionAppliedMl: number;
  contaminatedPointCount: number;
};

type DebugReport = {
  schemaVersion: 25;
  generatedAt: string;
  measurementMode: string;
  targetVolumeMl: number;
  heartModel: HeartModelMode;
  deltasMl: number[];
  dtValues: number[];
  lambdaActTauSecValues: number[];
  lambdaActScope: LambdaActScope;
  lambdaActTerms: LambdaActTerms;
  lowStretchLimiterMode: LowStretchLimiterMode;
  lowStretchLimiterScope: LambdaActScope;
  tensionScope: LambdaActScope;
  activeReservePreset: ActiveReservePreset;
  traceBeats: number;
  sampleHz: number;
  returnMapMode: ReturnMapModeOption;
  maxReturnMapPoints?: number;
  returnMapDeltasMl?: number[];
  quietClampLog: boolean;
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
  qDotClampScope: DynamicQDotClampScope;
  aovQUpdateMode: AorticValveQUpdateMode;
  beatPairOverlay: boolean;
  points: DebugPoint[];
  summary: DebugSummary;
  dtScenarios: DtScenarioReport[];
  interpretation: {
    dtSensitivity: string;
    activeStressFields: string[];
    clampFields: string[];
    beatPairOverlay: string;
  };
};

type TraceSample = {
  sample: SimSample;
  active: ModelCoreActiveStressDiagnostics;
};

type DebugRun = {
  core: ModelCore;
  settle: SettleStatus;
  metrics: SimMetrics;
  lastBeatMetrics: SimMetrics;
  health: SimulationHealth;
  observables: SimObservables;
  state: SerializedModelState;
  wallMs: number;
};

const DEFAULT_DELTAS = [0, -900, -1000, -1100, -1200, -1300, -1400, -1500, -1600];
const DEFAULT_DT_VALUES = [0.001, 0.0005, 0.002];
const DEFAULT_HEART_MODEL: HeartModelMode = "activeStress";
const DEFAULT_LAMBDA_ACT_TAU_SEC_VALUES = [0];
const DEFAULT_LAMBDA_ACT_SCOPE: LambdaActScope = "all";
const DEFAULT_LAMBDA_ACT_TERMS: LambdaActTerms = "kd+fiso";
const DEFAULT_LOW_STRETCH_LIMITER_MODE: LowStretchLimiterMode = "none";
const DEFAULT_LOW_STRETCH_LIMITER_SCOPE: LambdaActScope = "lv";
const DEFAULT_TENSION_SCOPE: LambdaActScope = "all";
const DEFAULT_ACTIVE_RESERVE_PRESET: ActiveReservePreset = "directMedium";
const DEFAULT_SAMPLE_HZ = 120;
const DEFAULT_RETURN_MAP_MODE: ReturnMapModeOption = "both";
const DEFAULT_TBV_CORRECTION_MODE: TBVCorrectionMode = "on";
const DEFAULT_AORTIC_FLOW_CLAMP_MODE: AorticFlowClampMode = "hard";
export const DEFAULT_AOV_B = DEFAULT_PARAMS.AoV_B;
export const DEFAULT_AOV_AREF = DEFAULT_PARAMS.AoV_Aref;
export const DEFAULT_AOV_AMAX = DEFAULT_PARAMS.AoV_Amax;
export const DEFAULT_AOV_L = DEFAULT_PARAMS.AoV_L;
export const DEFAULT_AOV_TAU_OPEN = DEFAULT_PARAMS.AoV_tauOpen;
export const DEFAULT_AOV_TAU_CLOSE = DEFAULT_PARAMS.AoV_tauClose;
export const DEFAULT_SYSTEMIC_RESISTANCE = DEFAULT_PARAMS.systemicResistance;
export const DEFAULT_ARTERIAL_STIFFNESS = DEFAULT_PARAMS.arterialStiffness;
export const DEFAULT_AOV_Q_DOT_CLAMP = 40000;
const DEFAULT_Q_DOT_CLAMP_SCOPE: DynamicQDotClampScope = "aov";
const TBV_AUDIT_CONTAMINATION_THRESHOLD_ML = 0.05;
const LOW_TBV_CORRECTION_OPTIONS = {
  gain: 0.035,
  maxTotalCorrectionMl: 0.025,
  maxNodeVolumeMl: 0.01,
};
const RETURN_MAP_PERTURBATION_ML = 0.5;
const BEAT_PAIR_DIVERGENCE_THRESHOLD = 0.08;
const BEAT_PAIR_DIVERGENCE_CONSECUTIVE_SAMPLES = 2;
const BEAT_PAIR_SIGNAL_SPECS: Array<{ signal: string; key: BeatPairSignalKey; scaleFloor: number }> = [
  { signal: "LV.c", key: "LV_c", scaleFloor: 0.02 },
  { signal: "LV.a", key: "LV_a", scaleFloor: 0.02 },
  { signal: "sigmaActTarget", key: "LV_sigmaActTarget", scaleFloor: 100 },
  { signal: "sigmaAct", key: "LV_sigmaAct", scaleFloor: 100 },
  { signal: "QAo", key: "QAo", scaleFloor: 50 },
  { signal: "AoV open", key: "AoV_open01", scaleFloor: 1 },
  { signal: "AoP", key: "AoP", scaleFloor: 5 },
  { signal: "VLV", key: "VLV", scaleFloor: 5 },
  { signal: "QMV", key: "QMV", scaleFloor: 50 },
  { signal: "MV open", key: "MV_open01", scaleFloor: 1 },
  { signal: "LAP-LVP", key: "LAP_minus_LVP", scaleFloor: 5 },
];
const BEAT_PAIR_PHASE_WINDOWS = [
  { name: "early filling", phaseStart: 0.30, phaseEnd: 0.58 },
  { name: "diastasis / mid-diastole", phaseStart: 0.58, phaseEnd: 0.85 },
  { name: "atrial systole", phaseStart: 0.85, phaseEnd: 0.08 },
  { name: "isovolumic contraction", phaseStart: 0.08, phaseEnd: 0.18 },
  { name: "ejection", phaseStart: 0.18, phaseEnd: 0.42 },
  { name: "relaxation", phaseStart: 0.42, phaseEnd: 0.58 },
];
const SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 };
const RUN_OPTIONS = {
  collectSamples: false,
  recordHistory: true,
  historyLimit: 720,
};
const CSV_COLUMNS = [
  "dt",
  "lambdaActTauSec",
  "lambdaActScope",
  "lambdaActTerms",
  "lowStretchLimiter",
  "lowStretchLimiterScope",
  "tensionScope",
  "activeReservePreset",
  "tbvCorrectionMode",
  "aorticFlowClampMode",
  "qDotClampScope",
  "AoV_B",
  "AoV_Amax",
  "AoV_Aref",
  "deltaVolumeMl",
  "targetVolumeMl",
  "beat",
  "LAPMean",
  "CO_L",
  "CO_R",
  "EDV_L",
  "ESV_L",
  "LVPMax",
  "AoPMean",
  "AoPMax",
  "QAoMax",
  "QAoCapRatioMax",
  "QAoNearCap90Fraction",
  "QAoNearCap95Fraction",
  "QAoNearCap98Fraction",
  "QAoAtCapFraction",
  "QAoLocalCapActiveFraction",
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
  "LA_A_loop_area",
  "LA_A_loop_fraction",
  "atrialSystoleTransmitralGradientMean",
  "atrialSystoleTransmitralGradientMax",
  "atrialSystoleMVOpenFraction",
  "LV_lambdaMean",
  "LV_lambdaActMean",
  "LV_lambdaForKdMean",
  "LV_lambdaForFIsoMean",
  "LV_lambdaActMinusRawMean",
  "LV_KdMean",
  "LV_aInfMean",
  "LV_aInfRawMean",
  "LV_aInfCapMean",
  "LV_aInfLimiterDeltaMean",
  "LV_activeTargetLimiterMean",
  "LV_activeTargetLimiterMin",
  "LV_activeTargetLimiterHitFraction",
  "LV_sigmaActTargetRawMean",
  "LV_sigmaActTargetRawMax",
  "LV_sigmaActTargetMax",
  "LV_sigmaActTargetReductionFractionMean",
  "LV_lowStretchLimiterGateMean",
  "LV_sigmaActMean",
  "LV_fIsoMean",
  "LV_fIsoRawMean",
  "LV_fIsoLimiterMean",
  "LV_fIsoLimiterMin",
  "LV_fIsoLimiterHitFraction",
  "LV_fIsoLimiterDeltaMean",
  "LV_forceVelocityScaleMean",
  "branchAmplitudeCO_L",
  "branchAmplitudeFractionCO_L",
  "branchAmplitudeEDV_L",
  "branchAmplitudeFractionEDV_L",
  "branchAmplitudeESV_L",
  "branchAmplitudeFractionESV_L",
  "branchAmplitudeQAoMax",
  "branchAmplitudeFractionQAoMax",
  "branchAmplitudeAoPMax",
  "branchAmplitudeFractionAoPMax",
  "summaryMaxQAoCapRatio",
  "summaryMaxQAoNearCap95Fraction",
  "summaryMaxQAoAtCapFraction",
  "summaryMaxQAoLocalCapActiveFraction",
  "tbvAuditClass",
  "sanitizeAbsMl",
  "projectionAppliedMl",
  "tbvErrorBeforeProjectionMl",
  "tbvErrorAfterProjectionMl",
  "returnMapStatus",
  "returnMapEDVSlope",
  "returnMapTwoBeatEDVSlope",
  "returnMapESVSlope",
  "returnMapTwoBeatESVSlope",
  "returnMapResetLambdaActTwoBeatEDVSlope",
  "returnMapCOSlope",
  "returnMapTwoBeatCOSlope",
  "returnMapQAoMaxSlope",
  "returnMapTwoBeatQAoMaxSlope",
  "returnMapAoPMaxSlope",
  "returnMapTwoBeatAoPMaxSlope",
];
const BEAT_PAIR_OVERLAY_CSV_COLUMNS = [
  "dt",
  "lambdaActTauSec",
  "lambdaActScope",
  "lambdaActTerms",
  "lowStretchLimiter",
  "lowStretchLimiterScope",
  "activeReservePreset",
  "tbvCorrectionMode",
  "deltaVolumeMl",
  "targetVolumeMl",
  "pairBeats",
  "beat",
  "pairBeat",
  "phase",
  "tFromBeatStartSec",
  "tSec",
  "QMV",
  "xiMV",
  "MV_open01",
  "LAP_minus_LVP",
  "VLV",
  "ESV_marker01",
  "EDV_marker01",
  "LV_c",
  "LV_a",
  "LV_sigmaActTargetRaw",
  "LV_sigmaActTarget",
  "LV_sigmaAct",
  "LV_lambdaRaw",
  "LV_lambdaAct",
  "QAo",
  "xiAoV",
  "AoV_open01",
  "AoP",
  "LVP",
  "AoP_minus_LVP",
  "dP_AoV",
  "AoV_areaRatio",
];
const BEAT_PAIR_OVERLAY_SUMMARY_CSV_COLUMNS = [
  "recordType",
  "dt",
  "lambdaActTauSec",
  "lambdaActScope",
  "lambdaActTerms",
  "lowStretchLimiter",
  "lowStretchLimiterScope",
  "activeReservePreset",
  "tbvCorrectionMode",
  "deltaVolumeMl",
  "targetVolumeMl",
  "pairBeats",
  "highOutputBeat",
  "lowOutputBeat",
  "coDifferenceLMin",
  "svDifferenceMl",
  "esvDifferenceMl",
  "qAoMaxDifferenceMlPerSec",
  "sigmaActTargetMaxDifferencePa",
  "sigmaActMaxDifferencePa",
  "beat",
  "pairBeat",
  "label",
  "CO_L",
  "SV_L",
  "EDV_L",
  "ESV_L",
  "QAoMax",
  "sigmaActTargetMax",
  "sigmaActMax",
  "signal",
  "sourceColumn",
  "scale",
  "maxAbsDiff",
  "maxNormalizedDiff",
  "meanAbsNormalizedDiff",
  "firstDivergencePhase",
  "firstDivergenceWindow",
  "highMinusLowAtFirstDivergence",
  "window",
  "phaseStart",
  "phaseEnd",
  "meanDiff",
  "meanAbsDiff",
  "meanNormalizedDiff",
  "signedArea",
];

export function runLowPreloadDebug(opts: DebugOptions): DebugReport {
  const build = (): DebugReport => runLowPreloadDebugImpl(opts);
  return opts.quietClampLog ? withQuietClampLogs(build) : build();
}

function runLowPreloadDebugImpl(opts: DebugOptions): DebugReport {
  const tbvCorrectionMode = opts.tbvCorrectionMode ?? DEFAULT_TBV_CORRECTION_MODE;
  const aorticFlowClampMode = opts.aorticFlowClampMode ?? DEFAULT_AORTIC_FLOW_CLAMP_MODE;
  const aovB = finitePositiveOrDefault(opts.aovB, DEFAULT_AOV_B);
  const aovAmax = finitePositiveOrDefault(opts.aovAmax, DEFAULT_AOV_AMAX);
  const aovL = finitePositiveOrDefault(opts.aovL, DEFAULT_AOV_L);
  const aovTauOpen = finitePositiveOrDefault(opts.aovTauOpen, DEFAULT_AOV_TAU_OPEN);
  const aovTauClose = finitePositiveOrDefault(opts.aovTauClose, DEFAULT_AOV_TAU_CLOSE);
  const systemicResistance = finitePositiveOrDefault(opts.systemicResistance, DEFAULT_SYSTEMIC_RESISTANCE);
  const arterialStiffness = finitePositiveOrDefault(opts.arterialStiffness, DEFAULT_ARTERIAL_STIFFNESS);
  const tensionRiseSec = Math.max(Number.isFinite(opts.tensionRiseSec) ? Number(opts.tensionRiseSec) : 0, 0);
  const tensionFallSec = Math.max(Number.isFinite(opts.tensionFallSec) ? Number(opts.tensionFallSec) : 0, 0);
  const aovQDotClamp = finitePositiveOrDefault(opts.aovQDotClamp, DEFAULT_AOV_Q_DOT_CLAMP);
  const aovQDotClampNegative = finitePositiveOrDefault(opts.aovQDotClampNegative, aovQDotClamp);
  const aovQUpdateMode = opts.aovQUpdateMode ?? "current-loss";
  const dtValues = opts.dtValues.length > 0 ? opts.dtValues : DEFAULT_DT_VALUES;
  const lambdaActTauSecValues = opts.lambdaActTauSecValues.length > 0
    ? opts.lambdaActTauSecValues
    : DEFAULT_LAMBDA_ACT_TAU_SEC_VALUES;
  const lambdaActTerms = opts.lambdaActTerms ?? DEFAULT_LAMBDA_ACT_TERMS;
  const lowStretchLimiterMode = opts.lowStretchLimiterMode ?? DEFAULT_LOW_STRETCH_LIMITER_MODE;
  const lowStretchLimiterScope = opts.lowStretchLimiterScope ?? DEFAULT_LOW_STRETCH_LIMITER_SCOPE;
  const tensionScope = opts.tensionScope ?? opts.lambdaActScope ?? DEFAULT_TENSION_SCOPE;
  const qDotClampScope = opts.qDotClampScope ?? DEFAULT_Q_DOT_CLAMP_SCOPE;
  const activeReservePreset = effectiveActiveReservePreset(lowStretchLimiterMode, opts.activeReservePreset);
  const dtScenarios = lambdaActTauSecValues.flatMap((tau) => dtValues.map((dt) => runDtScenario(opts, dt, tau)));
  const primary = dtScenarios[0] ?? runDtScenario(opts, 0.001, 0);
  return {
    schemaVersion: 25,
    generatedAt: new Date().toISOString(),
    measurementMode: "continuous low-preload march; period-aware metrics; active-stress/clamp/valve/TBV-projection diagnostics; branch-amplitude primary gate; EDV-section volume-preserving LV/PVein one-beat/two-beat return-map slopes with EDV/ESV/CO/afterload/ejection features; QAo cap proximity, localized AoV soft-cap sensitivity, off-by-default AoV_B/AoV_Amax physical-loss comparators, off-by-default tension-rise/fall comparators with explicit chamber scope, asymmetric dynamic qDot positive/negative clamp sensitivity with explicit edge scope, and AoV q-state update comparator; LA/MV filling-regime and MV event-count morphology diagnostics; optional phase-aligned last-two-beat active/ejection/MV overlay diagnostics with high-low divergence summary; dt, off-by-default lambdaAct, and off-by-default AoV flow-clamp sensitivity",
    targetVolumeMl: opts.targetVolumeMl,
    heartModel: opts.heartModel ?? DEFAULT_HEART_MODEL,
    deltasMl: opts.deltasMl,
    dtValues,
    lambdaActTauSecValues,
    lambdaActScope: opts.lambdaActScope,
    lambdaActTerms,
    lowStretchLimiterMode,
    lowStretchLimiterScope,
    tensionScope,
    activeReservePreset,
    traceBeats: opts.traceBeats,
    sampleHz: opts.sampleHz,
    returnMapMode: opts.returnMapMode,
    maxReturnMapPoints: opts.maxReturnMapPoints,
    returnMapDeltasMl: opts.returnMapDeltasMl,
    quietClampLog: opts.quietClampLog,
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
    qDotClampScope,
    aovQUpdateMode,
    beatPairOverlay: opts.beatPairOverlay === true,
    points: primary.points,
    summary: primary.summary,
    dtScenarios,
    interpretation: {
      dtSensitivity: "If period-2 disappears or strongly changes at smaller dt, numerical coupling is implicated; if it persists, active-stress model dynamics are implicated.",
      activeStressFields: ["lambdaRaw", "lambdaAct", "lambdaForKd", "lambdaForFIso", "lambdaActTerms", "tauLambdaActSec", "lambdaActMinusRaw", "Kd", "aInf", "aInfRaw", "aInfCap", "aInfLimiterDelta", "activeTargetLimiter", "sigmaActTargetRaw", "tauA", "c", "a", "sigmaActTarget", "sigmaAct", "sigmaPas", "fIso", "fIsoRaw", "fIsoLimiter", "fIsoLimiterDelta", "gOver", "forceVelocityScale", "lowStretchLimiter", "lowStretchLimiterGate", "lowStretchLimiterStrength", "dLogAInf_dLambdaAct", "dLogFIso_dLambdaAct", "dLogGOver_dLambdaRaw", "dLogCompositeActive_dLambdaAct"],
      clampFields: ["nodeClampHits", "dynamicFlowClampHits", "valveDiodeClampHits", "sanitizeSignedMl", "sanitizeAbsMl", "projectionRequestedMl", "projectionAppliedMl", "tbvErrorBeforeProjectionMl", "tbvErrorAfterProjectionMl", "aorticQDotLastStep", "aorticQDotCurrentBeat", "aorticQDotLastBeat", "dynamicQDotLastStep", "dynamicQDotCurrentBeat", "dynamicQDotLastBeat"],
      beatPairOverlay: "When enabled, phase-aligned last-two-beat rows expose QMV/MV xi/LAP-LVP/VLV, LV c/a/sigmaActTarget/sigmaAct, and QAo/AoV/AoP signals to test whether MV event switching precedes ejection alternans or follows prior-beat active/ejection state.",
    },
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

export function reportToMarkdown(report: DebugReport): string {
  const lines: string[] = [];
  lines.push("# Starling low-preload root-cause diagnostics");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Measurement: ${report.measurementMode}`);
  lines.push(`lambdaAct scope: ${report.lambdaActScope}`);
  lines.push(`lambdaAct terms: ${report.lambdaActTerms}`);
  lines.push(`low-stretch limiter: ${report.lowStretchLimiterMode}`);
  lines.push(`low-stretch limiter scope: ${report.lowStretchLimiterScope}`);
  lines.push(`tension scope: ${report.tensionScope}`);
  lines.push(`active reserve preset: ${report.activeReservePreset}`);
  lines.push(`return-map mode: ${report.returnMapMode}`);
  lines.push(`TBV correction mode: ${report.tbvCorrectionMode}`);
  lines.push(`AoV flow clamp mode: ${report.aorticFlowClampMode}`);
  lines.push(`AoV_B: ${report.aovB}; AoV_L: ${report.aovL}; AoV_tauOpen: ${report.aovTauOpen}; AoV_tauClose: ${report.aovTauClose}; AoV_Amax: ${report.aovAmax}; AoV_Aref: ${report.aovAref}`);
  lines.push(`systemicResistance: ${report.systemicResistance}; arterialStiffness: ${report.arterialStiffness}`);
  lines.push(`tensionRiseSec: ${report.tensionRiseSec}; tensionFallSec: ${report.tensionFallSec}; qDot clamp: +${report.aovQDotClamp}/-${report.aovQDotClampNegative} mL/s^2; qDot clamp scope: ${report.qDotClampScope}`);
  lines.push(`beat-pair overlay: ${report.beatPairOverlay ? "enabled" : "disabled"}`);
  if (report.maxReturnMapPoints != null) lines.push(`max return-map points: ${report.maxReturnMapPoints}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| tau lambdaAct s | scope | terms | dt | points | period-2 | max adjacent delta | max period delta | max CO branch frac | max EDV branch frac | max ESV branch frac | max QAo branch frac | max AoP branch frac | min MV A mL | min MV A frac | min LA A-loop area | min LA A-loop frac | max valve reverse mL | max clamp hits | max sanitize abs mL | max projection applied mL | contaminated points | max one-beat EDV slope | max two-beat EDV slope | max one-beat ESV slope | max two-beat ESV slope | max one-beat QAo slope | max two-beat QAo slope |");
  lines.push("| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.dtScenarios) {
    lines.push([
      round(scenario.lambdaActTauSec, 4),
      scenario.lambdaActScope,
      scenario.lambdaActTerms,
      round(scenario.dt, 5),
      scenario.summary.pointCount,
      scenario.summary.period2Count,
      round(scenario.summary.maxAdjacentDelta, 4),
      round(scenario.summary.maxPeriodDelta, 4),
      round(scenario.summary.maxBranchAmplitudeFractionCOL, 4),
      round(scenario.summary.maxBranchAmplitudeFractionEDVL, 4),
      round(scenario.summary.maxBranchAmplitudeFractionESVL, 4),
      round(scenario.summary.maxBranchAmplitudeFractionQAoMax, 4),
      round(scenario.summary.maxBranchAmplitudeFractionAoPMax, 4),
      round(scenario.summary.minMVAForwardMl, 4),
      round(scenario.summary.minMVAFraction, 4),
      round(scenario.summary.minLAAloopArea, 4),
      round(scenario.summary.minLAAloopFraction, 4),
      round(scenario.summary.maxValveReverseMl, 6),
      scenario.summary.maxClampHitCount,
      round(scenario.summary.maxSanitizeAbsMl, 6),
      round(scenario.summary.maxProjectionAppliedMl, 6),
      scenario.summary.contaminatedPointCount,
      round(scenario.summary.maxAbsReturnMapSlopeEDVL, 4),
      round(scenario.summary.maxAbsTwoBeatReturnMapSlopeEDVL, 4),
      round(scenario.summary.maxAbsReturnMapSlopeESVL, 4),
      round(scenario.summary.maxAbsTwoBeatReturnMapSlopeESVL, 4),
      round(scenario.summary.maxAbsReturnMapSlopeQAoMax, 4),
      round(scenario.summary.maxAbsTwoBeatReturnMapSlopeQAoMax, 4),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## QAo cap proximity");
  lines.push("");
  lines.push("| tau s | scope | dt | AoV clamp | max QAo/cap | near cap >90% | near cap >95% | near cap >98% | at cap | local cap active |");
  lines.push("| ---: | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const scenario of report.dtScenarios) {
    lines.push([
      round(scenario.lambdaActTauSec, 4),
      scenario.lambdaActScope,
      round(scenario.dt, 5),
      report.aorticFlowClampMode,
      round(scenario.summary.maxQAoCapRatioMax, 4),
      round(scenario.summary.maxQAoNearCap90Fraction, 4),
      round(scenario.summary.maxQAoNearCap95Fraction, 4),
      round(scenario.summary.maxQAoNearCap98Fraction, 4),
      round(scenario.summary.maxQAoAtCapFraction, 4),
      round(scenario.summary.maxQAoLocalCapActiveFraction, 4),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Primary dt points");
  lines.push("");
  lines.push("| delta | target TBV | seed | period | reason | actual s | worst signal | worst delta | adj delta | period delta | LAP | CO_L period | CO_L last beat | CO_R period | PV return | clamp hits | valve reverse max | MV A mL | MV A frac | MV A peak | MV E peak | MV mid mL | MV mid peak | MV peaks | mid peaks | QMV zero returns | MV reopen count | xi min E-A | open01 min E-A | LAP-LVP zc | morphology | LA A-loop area | LA A-loop frac | A mean LAP-LVP | A max LAP-LVP | A MV open frac | LV lambda raw | LV lambda act | LV lambda Kd | LV lambda fIso | LV lambdaAct-raw | LV Kd mean | LV fIso mean | branch CO amp | branch CO frac | branch EDV amp | branch EDV frac | branch ESV amp | branch ESV frac | return-map | one-beat EDV slope | two-beat EDV slope | one-beat ESV slope | two-beat ESV slope | reset-lambdaAct two-beat EDV slope | nonsmooth |");
  lines.push("| ---: | ---: | ---: | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const p of report.points) {
    const lastBeat = p.beatTrace.at(-1);
    const lv = lastBeat?.active.LV;
    const filling = lastBeat?.filling;
    lines.push([
      p.deltaVolumeMl,
      p.targetVolumeMl,
      p.seededFromDeltaMl ?? "",
      `period-${p.settle.periodBeats ?? 1}`,
      p.settle.reason,
      round(p.settle.actualSeconds ?? NaN, 3),
      p.settle.worstSignal ?? "",
      round(p.settle.worstDelta, 4),
      round(p.settle.adjacentDelta, 4),
      round(p.settle.periodDelta, 4),
      round(p.periodMetrics.LAPMean, 3),
      round(p.periodMetrics.CO_L, 3),
      round(p.lastBeatMetrics.CO_L, 3),
      round(p.periodMetrics.CO_R, 3),
      round(p.periodMetrics.pulmonaryVenousReturnLMin, 3),
      p.health.clampHitCount,
      round(maxValveReverse(p), 6),
      round(filling?.MV_A_forward_mL ?? NaN, 4),
      round(filling?.MV_A_fraction ?? NaN, 4),
      round(filling?.MV_A_peak ?? NaN, 4),
      round(filling?.MV_E_peak ?? NaN, 4),
      round(filling?.MV_mid_forward_mL ?? NaN, 4),
      round(filling?.MV_mid_peak ?? NaN, 4),
      filling?.MV_forward_peak_count ?? "",
      filling?.MV_mid_forward_peak_count ?? "",
      filling?.QMV_near_zero_return_count ?? "",
      filling?.MV_open_close_reopen_count ?? "",
      round(filling?.MV_interwave_xi_min ?? NaN, 4),
      round(filling?.MV_interwave_open01_min ?? NaN, 4),
      filling?.LAP_LVP_zero_crossing_count ?? "",
      filling?.fillingMorphologyClass ?? "",
      round(filling?.LA_A_loop_area ?? NaN, 4),
      round(filling?.LA_A_loop_fraction ?? NaN, 4),
      round(filling?.atrialSystoleTransmitralGradientMean ?? NaN, 4),
      round(filling?.atrialSystoleTransmitralGradientMax ?? NaN, 4),
      round(filling?.atrialSystoleMVOpenFraction ?? NaN, 4),
      round(lv?.lambdaRawMean ?? lv?.lambdaMean ?? NaN, 4),
      round(lv?.lambdaActMean ?? NaN, 4),
      round(lv?.lambdaForKdMean ?? NaN, 4),
      round(lv?.lambdaForFIsoMean ?? NaN, 4),
      round(lv?.lambdaActMinusRawMean ?? NaN, 4),
      round(lv?.KdMean ?? NaN, 4),
      round(lv?.fIsoMean ?? NaN, 4),
      round(p.returnMap.branchAmplitude.CO_L ?? NaN, 4),
      round(p.returnMap.branchAmplitudeFraction.CO_L ?? NaN, 4),
      round(p.returnMap.branchAmplitude.EDV_L ?? NaN, 4),
      round(p.returnMap.branchAmplitudeFraction.EDV_L ?? NaN, 4),
      round(p.returnMap.branchAmplitude.ESV_L ?? NaN, 4),
      round(p.returnMap.branchAmplitudeFraction.ESV_L ?? NaN, 4),
      p.returnMap.status,
      round(returnMapSlope(p, "EDV_L"), 4),
      round(twoBeatReturnMapSlope(p, "EDV_L"), 4),
      round(returnMapSlope(p, "ESV_L"), 4),
      round(twoBeatReturnMapSlope(p, "ESV_L"), 4),
      round(modeTwoBeatSlope(p, "volumeLambdaActReset", "EDV_L"), 4),
      p.returnMap.nonsmooth ? "yes" : "no",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  appendBeatPairOverlaySummaryMarkdown(lines, report);
  lines.push("## TBV / Clamp Audit, primary dt");
  lines.push("");
  lines.push("| delta | target TBV | correction | class | sanitize signed mL | sanitize abs mL | projection requested mL | projection applied mL | TBV err before | TBV err after | top sanitize nodes | top projection nodes |");
  lines.push("| ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |");
  for (const p of report.points) {
    lines.push([
      p.deltaVolumeMl,
      p.targetVolumeMl,
      p.tbvAudit.correctionMode,
      p.tbvAudit.classification,
      round(p.tbvAudit.sanitizeSignedMl, 6),
      round(p.tbvAudit.sanitizeAbsMl, 6),
      round(p.tbvAudit.projectionRequestedMl, 6),
      round(p.tbvAudit.projectionAppliedMl, 6),
      round(p.tbvAudit.tbvErrorBeforeProjectionMl, 6),
      round(p.tbvAudit.tbvErrorAfterProjectionMl, 6),
      topRecord(p.tbvAudit.sanitizeByNodeAbsMl),
      topRecord(p.tbvAudit.projectionByNodeAbsMl),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("## Clamp attribution, primary dt");
  lines.push("");
  lines.push("### Node clamps");
  appendRecordTable(lines, report.summary.nodeClampHits);
  lines.push("### Dynamic-flow clamps");
  appendRecordTable(lines, report.summary.dynamicFlowClampHits);
  lines.push("### Valve diode clamps");
  appendRecordTable(lines, report.summary.valveDiodeClampHits);
  lines.push("");
  lines.push("## Notes for model review");
  lines.push("");
  lines.push("- `CO_L last beat` is intentionally shown next to period-aware `CO_L period`; large separation is expected in period-2 alternans.");
  lines.push("- Nominal valve reverse volumes should remain near zero. Diode clamp hits show how often no-leak valve reverse predictions were clipped before becoming state flow.");
  lines.push("- Node-specific clamp attribution separates low-volume pressure/volume bounds from aggregate health warnings.");
  lines.push("- TBV / Clamp Audit quantifies how much hard state sanitation and the TBV projector move volume. `contaminated` means sanitize or projection moved more than 0.05 mL in the representative beat.");
  lines.push("- Return-map slopes are central differences from a volume-preserving LV/PVein perturbation at the next LV EDV section. `one-beat` measures the next beat; `two-beat` measures the same phase two beats later. EDV/ESV slopes are one-coordinate section slopes; CO/LAP slopes are response slopes. None of them change model dynamics.");
  lines.push("- MV/LA filling diagnostics split transmitral flow into E, mid-diastolic, and A windows; event-count fields report QMV peak count, near-zero returns, MV open-close-reopen count, LAP-LVP zero crossings, and an E/mid/A morphology class. These are observational regime markers, not model changes.");
  lines.push("- Optional beat-pair overlay rows phase-align the final two complete beats for QMV/MV xi/LAP-LVP/VLV, LV c/a/sigmaActTarget/sigmaAct, and QAo/AoV/AoP signals. Use these rows to test whether MV event switching leads same-beat ejection changes or follows prior-beat active/ejection state.");
  lines.push("- Branch amplitude and branch amplitude fraction are classifier-independent high/low beat measurements from the trace; treat them as the primary stabilization signal before interpreting period labels or local slopes.");
  lines.push("- `volumeLambdaActFixed` keeps the active-stretch memory fixed after a volume perturbation; `volumeLambdaActReset` resets LV `lambdaAct` to the post-perturbation raw LV stretch before measuring the return map. The latter is a quasi-static consistency check for lambdaAct experiments, not a model change.");
  lines.push("- `tau lambdaAct s` is an off-by-default experiment. `tau=0` is the shipped model. Positive tau values lag only selected active-stress length inputs (`kd`, `fiso`, or `kd+fiso`), not passive pressure, geometry, gOver, force-velocity, or valves.");
  lines.push("- `low-stretch limiter` is an off-by-default comparator. `aInfCap` caps activation only downward at low raw lambda; `activeReserveCap` multiplies active target by a factor <= 1 at low raw lambda, or only above `lowStretchLimiterActivationThreshold` when that optional threshold is configured; `fIsoSlopeRelax` multiplies the low-stretch force-length ramp by a C1 gate <= 1 below the join point. The `activeReservePreset` label records the debug-only strength/threshold preset used by activeReserveCap runs. None of these comparators changes passive geometry, valves, or default dynamics unless explicitly enabled.");
  lines.push("- Smaller-dt persistence supports a model-dynamics interpretation; strong dt sensitivity supports an explicit-coupling/numerical interpretation.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function appendBeatPairOverlaySummaryMarkdown(lines: string[], report: DebugReport): void {
  if (!report.beatPairOverlay) return;
  const points = report.points.filter((point) => point.beatPairOverlay?.summary);
  lines.push("## Beat-pair overlay divergence summary");
  lines.push("");
  if (points.length === 0) {
    lines.push("Beat-pair overlay was requested, but no complete two-beat overlay summary was available.");
    lines.push("");
    return;
  }
  lines.push("High/low labels are based on `CO_L`; all signal differences are high-output minus low-output at matched phase.");
  lines.push("");
  lines.push("| delta | pair beats | high beat | low beat | CO diff | SV diff | ESV diff | first LV.a | first sigma target | first sigmaAct | first QAo | first AoP | first QMV | first MV open |");
  lines.push("| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |");
  for (const p of points) {
    const summary = p.beatPairOverlay?.summary;
    if (!summary) continue;
    const pairBeats = p.beatPairOverlay?.beats.join("/") ?? "";
    lines.push([
      p.deltaVolumeMl,
      pairBeats,
      summary.highOutputBeat ?? "",
      summary.lowOutputBeat ?? "",
      round(summary.coDifferenceLMin ?? NaN, 4),
      round(summary.svDifferenceMl ?? NaN, 4),
      round(summary.esvDifferenceMl ?? NaN, 4),
      divergenceCell(summary, "LV.a"),
      divergenceCell(summary, "sigmaActTarget"),
      divergenceCell(summary, "sigmaAct"),
      divergenceCell(summary, "QAo"),
      divergenceCell(summary, "AoP"),
      divergenceCell(summary, "QMV"),
      divergenceCell(summary, "MV open"),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  lines.push("| delta | window | signal | mean normalized diff | max normalized diff | signed area |");
  lines.push("| ---: | --- | --- | ---: | ---: | ---: |");
  for (const p of points) {
    const windows = p.beatPairOverlay?.summary?.windows ?? [];
    for (const row of windows.filter((window) => ["ejection", "early filling", "atrial systole"].includes(window.window) && ["LV.a", "sigmaActTarget", "sigmaAct", "QAo", "QMV", "MV open"].includes(window.signal))) {
      lines.push([
        p.deltaVolumeMl,
        row.window,
        row.signal,
        round(row.meanNormalizedDiff, 4),
        round(row.maxNormalizedDiff, 4),
        round(row.signedArea, 4),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
  }
  lines.push("");
}

function divergenceCell(summary: BeatPairOverlaySummary, signal: string): string {
  const row = summary.signals.find((candidate) => candidate.signal === signal);
  if (!row || row.firstDivergencePhase == null) return "";
  return `${round(row.firstDivergencePhase, 3)} (${row.firstDivergenceWindow ?? "unknown"})`;
}

export function reportToCsv(report: DebugReport): string {
  const rows = [CSV_COLUMNS.join(",")];
  for (const scenario of report.dtScenarios) {
    for (const point of scenario.points) {
      for (const beat of point.beatTrace) {
        const lv = beat.active.LV;
        const filling = beat.filling;
        rows.push([
          scenario.dt,
          scenario.lambdaActTauSec,
          scenario.lambdaActScope,
          scenario.lambdaActTerms,
          report.lowStretchLimiterMode,
          report.lowStretchLimiterScope,
          report.tensionScope,
          report.activeReservePreset,
          point.tbvAudit.correctionMode,
          report.aorticFlowClampMode,
          report.qDotClampScope,
          report.aovB,
          report.aovAmax,
          report.aovAref,
          point.deltaVolumeMl,
          point.targetVolumeMl,
          beat.beat,
          beat.LAPMean,
          beat.CO_L,
          beat.CO_R,
          beat.EDV_L,
          beat.ESV_L,
          beat.LVPMax,
          beat.AoPMean,
          beat.AoPMax,
          beat.QAoMax,
          beat.QAoCapRatioMax,
          beat.QAoNearCap90Fraction,
          beat.QAoNearCap95Fraction,
          beat.QAoNearCap98Fraction,
          beat.QAoAtCapFraction,
          beat.QAoLocalCapActiveFraction,
          filling.MV_E_forward_mL,
          filling.MV_A_forward_mL,
          filling.MV_A_fraction ?? "",
          filling.MV_E_peak ?? "",
          filling.MV_A_peak ?? "",
          filling.MV_mid_forward_mL,
          filling.MV_mid_peak ?? "",
          filling.MV_forward_peak_count,
          filling.MV_mid_forward_peak_count,
          filling.QMV_near_zero_return_count,
          filling.MV_open_close_reopen_count,
          filling.MV_interwave_xi_min ?? "",
          filling.MV_interwave_open01_min ?? "",
          filling.LAP_LVP_zero_crossing_count,
          filling.fillingMorphologyClass,
          filling.LA_A_loop_area,
          filling.LA_A_loop_fraction ?? "",
          filling.atrialSystoleTransmitralGradientMean,
          filling.atrialSystoleTransmitralGradientMax,
          filling.atrialSystoleMVOpenFraction,
          lv?.lambdaMean ?? "",
          lv?.lambdaActMean ?? "",
          lv?.lambdaForKdMean ?? "",
          lv?.lambdaForFIsoMean ?? "",
          lv?.lambdaActMinusRawMean ?? "",
          lv?.KdMean ?? "",
          lv?.aInfMean ?? "",
          lv?.aInfRawMean ?? "",
          lv?.aInfCapMean ?? "",
          lv?.aInfLimiterDeltaMean ?? "",
          lv?.activeTargetLimiterMean ?? "",
          lv?.activeTargetLimiterMin ?? "",
          lv?.activeTargetLimiterHitFraction ?? "",
          lv?.sigmaActTargetRawMean ?? "",
          lv?.sigmaActTargetRawMax ?? "",
          lv?.sigmaActTargetMax ?? "",
          lv?.sigmaActTargetReductionFractionMean ?? "",
          lv?.lowStretchLimiterGateMean ?? "",
          lv?.sigmaActMean ?? "",
          lv?.fIsoMean ?? "",
          lv?.fIsoRawMean ?? "",
          lv?.fIsoLimiterMean ?? "",
          lv?.fIsoLimiterMin ?? "",
          lv?.fIsoLimiterHitFraction ?? "",
          lv?.fIsoLimiterDeltaMean ?? "",
          lv?.forceVelocityScaleMean ?? "",
          point.returnMap.branchAmplitude.CO_L ?? "",
          point.returnMap.branchAmplitudeFraction.CO_L ?? "",
          point.returnMap.branchAmplitude.EDV_L ?? "",
          point.returnMap.branchAmplitudeFraction.EDV_L ?? "",
          point.returnMap.branchAmplitude.ESV_L ?? "",
          point.returnMap.branchAmplitudeFraction.ESV_L ?? "",
          point.returnMap.branchAmplitude.QAoMax ?? "",
          point.returnMap.branchAmplitudeFraction.QAoMax ?? "",
          point.returnMap.branchAmplitude.AoPMax ?? "",
          point.returnMap.branchAmplitudeFraction.AoPMax ?? "",
          scenario.summary.maxQAoCapRatioMax,
          scenario.summary.maxQAoNearCap95Fraction,
          scenario.summary.maxQAoAtCapFraction,
          scenario.summary.maxQAoLocalCapActiveFraction,
          point.tbvAudit.classification,
          point.tbvAudit.sanitizeAbsMl,
          point.tbvAudit.projectionAppliedMl,
          point.tbvAudit.tbvErrorBeforeProjectionMl,
          point.tbvAudit.tbvErrorAfterProjectionMl,
          point.returnMap.status,
          point.returnMap.features.EDV_L?.centralSlope ?? "",
          point.returnMap.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? "",
          point.returnMap.features.ESV_L?.centralSlope ?? "",
          point.returnMap.twoBeatSamePhase?.features.ESV_L?.centralSlope ?? "",
          point.returnMap.modes.volumeLambdaActReset?.twoBeatSamePhase?.features.EDV_L?.centralSlope ?? "",
          point.returnMap.features.CO_L?.centralSlope ?? "",
          point.returnMap.twoBeatSamePhase?.features.CO_L?.centralSlope ?? "",
          point.returnMap.features.QAoMax?.centralSlope ?? "",
          point.returnMap.twoBeatSamePhase?.features.QAoMax?.centralSlope ?? "",
          point.returnMap.features.AoPMax?.centralSlope ?? "",
          point.returnMap.twoBeatSamePhase?.features.AoPMax?.centralSlope ?? "",
        ].map(csvCell).join(","));
      }
    }
  }
  return `${rows.join("\n")}\n`;
}

export function reportToBeatPairOverlayCsv(report: DebugReport): string {
  const rows = [BEAT_PAIR_OVERLAY_CSV_COLUMNS.join(",")];
  for (const scenario of report.dtScenarios) {
    for (const point of scenario.points) {
      const overlay = point.beatPairOverlay;
      if (!overlay || overlay.rows.length === 0) continue;
      const pairBeats = overlay.beats.join("/");
      for (const row of overlay.rows) {
        rows.push([
          scenario.dt,
          scenario.lambdaActTauSec,
          scenario.lambdaActScope,
          scenario.lambdaActTerms,
          report.lowStretchLimiterMode,
          report.lowStretchLimiterScope,
          report.activeReservePreset,
          point.tbvAudit.correctionMode,
          point.deltaVolumeMl,
          point.targetVolumeMl,
          pairBeats,
          row.beat,
          row.pairBeat,
          row.phase,
          row.tFromBeatStartSec,
          row.tSec,
          row.QMV,
          row.xiMV,
          row.MV_open01,
          row.LAP_minus_LVP,
          row.VLV,
          row.ESV_marker01,
          row.EDV_marker01,
          row.LV_c ?? "",
          row.LV_a ?? "",
          row.LV_sigmaActTargetRaw ?? "",
          row.LV_sigmaActTarget ?? "",
          row.LV_sigmaAct ?? "",
          row.LV_lambdaRaw ?? "",
          row.LV_lambdaAct ?? "",
          row.QAo,
          row.xiAoV,
          row.AoV_open01,
          row.AoP,
          row.LVP,
          row.AoP_minus_LVP,
          row.dP_AoV,
          row.AoV_areaRatio,
        ].map(csvCell).join(","));
      }
    }
  }
  return `${rows.join("\n")}\n`;
}

export function reportToBeatPairOverlaySummaryCsv(report: DebugReport): string {
  const rows = [BEAT_PAIR_OVERLAY_SUMMARY_CSV_COLUMNS.join(",")];
  for (const scenario of report.dtScenarios) {
    for (const point of scenario.points) {
      const overlay = point.beatPairOverlay;
      const summary = overlay?.summary;
      if (!overlay || !summary) continue;
      const common = [
        scenario.dt,
        scenario.lambdaActTauSec,
        scenario.lambdaActScope,
        scenario.lambdaActTerms,
        report.lowStretchLimiterMode,
        report.lowStretchLimiterScope,
        report.activeReservePreset,
        point.tbvAudit.correctionMode,
        point.deltaVolumeMl,
        point.targetVolumeMl,
        overlay.beats.join("/"),
        summary.highOutputBeat ?? "",
        summary.lowOutputBeat ?? "",
        summary.coDifferenceLMin ?? "",
        summary.svDifferenceMl ?? "",
        summary.esvDifferenceMl ?? "",
        summary.qAoMaxDifferenceMlPerSec ?? "",
        summary.sigmaActTargetMaxDifferencePa ?? "",
        summary.sigmaActMaxDifferencePa ?? "",
      ];
      for (const beat of summary.beatSummaries) {
        rows.push([
          "beat",
          ...common,
          beat.beat,
          beat.pairBeat,
          beat.label,
          beat.CO_L,
          beat.SV_L,
          beat.EDV_L,
          beat.ESV_L,
          beat.QAoMax,
          beat.sigmaActTargetMax ?? "",
          beat.sigmaActMax ?? "",
          "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        ].map(csvCell).join(","));
      }
      for (const signal of summary.signals) {
        rows.push([
          "signal",
          ...common,
          "", "", "", "", "", "", "", "", "", "", "",
          signal.signal,
          signal.sourceColumn,
          signal.scale,
          signal.maxAbsDiff,
          signal.maxNormalizedDiff,
          signal.meanAbsNormalizedDiff,
          signal.firstDivergencePhase ?? "",
          signal.firstDivergenceWindow ?? "",
          signal.highMinusLowAtFirstDivergence ?? "",
          "", "", "", "", "", "",
        ].map(csvCell).join(","));
      }
      for (const window of summary.windows) {
        rows.push([
          "window",
          ...common,
          "", "", "", "", "", "", "", "", "", "",
          window.signal,
          window.sourceColumn,
          "", "", window.maxNormalizedDiff, "", "", "", "",
          window.window,
          window.phaseStart,
          window.phaseEnd,
          window.meanDiff,
          window.meanAbsDiff,
          window.meanNormalizedDiff,
          window.signedArea,
        ].map(csvCell).join(","));
      }
    }
  }
  return `${rows.join("\n")}\n`;
}

function runDtScenario(opts: DebugOptions, dt: number, lambdaActTauSec: number): DtScenarioReport {
  const lambdaActTerms = opts.lambdaActTerms ?? DEFAULT_LAMBDA_ACT_TERMS;
  const tbvCorrectionMode = opts.tbvCorrectionMode ?? DEFAULT_TBV_CORRECTION_MODE;
  const aorticFlowClampMode = opts.aorticFlowClampMode ?? DEFAULT_AORTIC_FLOW_CLAMP_MODE;
  const aovQUpdateMode = opts.aovQUpdateMode ?? "current-loss";
  const qDotClampScope = opts.qDotClampScope ?? DEFAULT_Q_DOT_CLAMP_SCOPE;
  const lowStretchLimiterMode = opts.lowStretchLimiterMode ?? DEFAULT_LOW_STRETCH_LIMITER_MODE;
  const lowStretchLimiterScope = opts.lowStretchLimiterScope ?? DEFAULT_LOW_STRETCH_LIMITER_SCOPE;
  const tensionScope = opts.tensionScope ?? opts.lambdaActScope ?? DEFAULT_TENSION_SCOPE;
  const activeReservePreset = effectiveActiveReservePreset(lowStretchLimiterMode, opts.activeReservePreset);
  const params = paramsWithTensionComparator(
    paramsWithLowStretchLimiter(
      paramsWithLambdaActTau(
        paramsWithAorticValveComparator(
          defaultParamsForHeartModel(opts.heartModel),
          opts.aovB,
          opts.aovAmax,
          opts.aovL,
          opts.aovTauOpen,
          opts.aovTauClose,
          opts.systemicResistance,
          opts.arterialStiffness,
        ),
        lambdaActTauSec,
        opts.lambdaActScope,
        lambdaActTerms,
      ),
      lowStretchLimiterMode,
      lowStretchLimiterScope,
      activeReservePreset,
    ),
    opts.tensionRiseSec,
    opts.tensionFallSec,
    tensionScope,
  );
  const req: StarlingSweepRequest = {
    requestId: "debug-starling-low-preload",
    signature: "debug-starling-low-preload",
    instanceId: "debug",
    params,
    targetVolumeMl: opts.targetVolumeMl,
    deltasMl: opts.deltasMl,
    sweepMode: "adaptive",
  };
  const points: DebugPoint[] = [];
  const returnMapStates: SerializedModelState[] = [];
  let seedState: SerializedModelState | undefined;
  let seededFromDeltaMl = 0;
  for (const delta of opts.deltasMl) {
    const run = settleDebugCore(req.params, opts.targetVolumeMl + delta, dt, opts.sampleHz, tbvCorrectionMode, aorticFlowClampMode, opts.aovQDotClamp, aovQUpdateMode, seedState, opts.aovQDotClampNegative, qDotClampScope);
    const traceCore = new ModelCore(req.params);
    traceCore.unpackState(run.state);
    configureDebugCore(traceCore, tbvCorrectionMode, aorticFlowClampMode, opts.aovQDotClamp, aovQUpdateMode, opts.aovQDotClampNegative, qDotClampScope);
    const traceSamples = collectTraceSamples(traceCore, opts.traceBeats, dt, opts.sampleHz);
    const beatTrace = summarizeBeatTrace(traceSamples, req.params.HR, opts.traceBeats, aorticFlowClampMode);
    const beatPairOverlay = opts.beatPairOverlay === true ? buildBeatPairOverlay(traceSamples, req.params.HR, aorticFlowClampMode) : undefined;
    const branchAmplitude = branchAmplitudeFromTrace(traceSamples, req.params.HR, aorticFlowClampMode);
    const branchAmplitudeFraction = branchAmplitudeFractionFromTrace(traceSamples, req.params.HR, aorticFlowClampMode);
    const clampDiagnostics = run.core.debugClampDiagnostics();
    const tbvAudit = tbvAuditFromClampDiagnostics(clampDiagnostics, tbvCorrectionMode);
    const returnMap = skippedReturnMapDiagnostic(
      run.state,
      branchAmplitude,
      branchAmplitudeFraction,
      opts.returnMapMode === "none" ? "return-map disabled" : "return-map not selected",
    );
    points.push({
      deltaVolumeMl: delta,
      targetVolumeMl: opts.targetVolumeMl + delta,
      seededFromDeltaMl: delta === opts.deltasMl[0] ? null : seededFromDeltaMl,
      wallMs: run.wallMs,
      settle: {
        settled: run.settle.settled,
        reason: run.settle.reason,
        periodBeats: run.settle.periodBeats ?? 1,
        periodDelta: run.settle.periodDelta,
        adjacentDelta: run.settle.adjacentDelta,
        worstSignal: run.settle.worstSignal,
        worstDelta: run.settle.worstDelta,
        beats: run.settle.beats,
        actualSeconds: run.settle.actualSeconds ?? null,
      },
      health: {
        status: run.health.status,
        clampHitCount: run.health.clampHitCount,
        leftRightFlowMismatchLMin: run.health.leftRightFlowMismatchLMin,
        cycleMetricDelta: run.health.cycleMetricDelta,
        messages: run.health.messages,
      },
      periodMetrics: metricSummary(run.metrics),
      lastBeatMetrics: {
        LAPMean: run.lastBeatMetrics.LAPMean,
        RAPMean: run.lastBeatMetrics.RAPMean,
        CO_L: run.lastBeatMetrics.CO_L,
        CO_R: run.lastBeatMetrics.CO_R,
        pulmonaryVenousReturnLMin: run.lastBeatMetrics.pulmonaryVenousReturnLMin,
        systemicVenousReturnLMin: run.lastBeatMetrics.systemicVenousReturnLMin,
      },
      valveVolumesMl: {
        MVReverse: run.metrics.MVReverseVolumeMl,
        AoVReverse: run.metrics.AoVReverseVolumeMl,
        TVReverse: run.metrics.TVReverseVolumeMl,
        PVReverse: run.metrics.PVReverseVolumeMl,
        MVForward: run.metrics.MVForwardVolumeMl,
        AoVForward: run.metrics.AoVForwardVolumeMl,
        TVForward: run.metrics.TVForwardVolumeMl,
        PVForward: run.metrics.PVForwardVolumeMl,
      },
      valveTrace: summarizeValves(traceSamples.map((entry) => entry.sample)),
      clampDiagnostics,
      tbvAudit,
      activeStressTerminal: run.core.debugActiveStressDiagnostics(),
      beatTrace,
      beatPairOverlay,
      returnMap,
      observables: {
        P_PVein: run.observables.P_PVein,
        Pperi: run.observables.Pperi,
        Ppc: run.observables.Ppc,
        VLVeff: run.observables.VLVeff,
        VRVeff: run.observables.VRVeff,
        PLVfw: run.observables.PLVfw,
        PVI_LV: run.observables.PVI_LV,
        septumShiftMl: run.observables.septumShiftMl,
      },
    });
    returnMapStates.push(run.state);
    seedState = run.state;
    seededFromDeltaMl = delta;
  }
  const selectedReturnMapIndices = selectedReturnMapPointIndices(points, opts);
  for (const index of selectedReturnMapIndices) {
    const point = points[index];
    if (!point) continue;
    point.returnMap = estimateReturnMapDiagnostic(
      returnMapStates[index],
      req.params,
      dt,
      opts.sampleHz,
      opts.returnMapMode,
      tbvCorrectionMode,
      aorticFlowClampMode,
      opts.aovQDotClamp,
      aovQUpdateMode,
      opts.aovQDotClampNegative,
      qDotClampScope,
      point.returnMap.branchAmplitude,
      point.returnMap.branchAmplitudeFraction,
    );
  }
  return { dt, lambdaActTauSec, lambdaActScope: opts.lambdaActScope, lambdaActTerms, points, summary: summarizePoints(points) };
}

function defaultParamsForHeartModel(heartModel: HeartModelMode = DEFAULT_HEART_MODEL): CoreRuntimeParams {
  return { ...DEFAULT_PARAMS, heartModel };
}

export function paramsWithAorticValveComparator(
  params: CoreRuntimeParams,
  aovB?: number,
  aovAmax?: number,
  aovL?: number,
  aovTauOpen?: number,
  aovTauClose?: number,
  systemicResistance?: number,
  arterialStiffness?: number,
): CoreRuntimeParams {
  const next = { ...params };
  if (aovB != null && Number.isFinite(aovB) && aovB > 0) next.AoV_B = aovB;
  if (aovAmax != null && Number.isFinite(aovAmax) && aovAmax > 0) {
    next.AoV_Aref = DEFAULT_AOV_AREF;
    next.AoV_Amax = aovAmax;
  }
  if (aovL != null && Number.isFinite(aovL) && aovL > 0) next.AoV_L = aovL;
  if (aovTauOpen != null && Number.isFinite(aovTauOpen) && aovTauOpen > 0) next.AoV_tauOpen = aovTauOpen;
  if (aovTauClose != null && Number.isFinite(aovTauClose) && aovTauClose > 0) next.AoV_tauClose = aovTauClose;
  if (systemicResistance != null && Number.isFinite(systemicResistance) && systemicResistance > 0) next.systemicResistance = systemicResistance;
  if (arterialStiffness != null && Number.isFinite(arterialStiffness) && arterialStiffness > 0) next.arterialStiffness = arterialStiffness;
  return next;
}

function selectedReturnMapPointIndices(points: DebugPoint[], opts: DebugOptions): number[] {
  if (opts.returnMapMode === "none") return [];
  if (opts.returnMapDeltasMl && opts.returnMapDeltasMl.length > 0) {
    const wanted = new Set(opts.returnMapDeltasMl.map((delta) => String(delta)));
    return points
      .map((point, index) => [point, index] as const)
      .filter(([point]) => wanted.has(String(point.deltaVolumeMl)))
      .map(([, index]) => index);
  }
  if (opts.maxReturnMapPoints != null && Number.isFinite(opts.maxReturnMapPoints) && opts.maxReturnMapPoints < points.length) {
    return selectSuspiciousPointIndices(points, Math.max(0, Math.floor(opts.maxReturnMapPoints)));
  }
  return points.map((_, index) => index);
}

export function selectSuspiciousPointIndices(points: DebugPoint[], limit: number): number[] {
  if (limit <= 0 || points.length === 0) return [];
  const selected = new Set<number>();
  const addIndex = (index: number | undefined) => {
    if (index != null && index >= 0 && index < points.length && selected.size < limit) selected.add(index);
  };
  const byScore = (score: (point: DebugPoint) => number) => points
    .map((point, index) => ({ index, score: score(point) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score);
  const baselineIndex = points.findIndex((point) => point.deltaVolumeMl === -1250);
  addIndex(baselineIndex >= 0 ? baselineIndex : undefined);
  for (const entry of byScore((point) => Math.max(
    point.returnMap.branchAmplitudeFraction.CO_L ?? 0,
    point.returnMap.branchAmplitudeFraction.EDV_L ?? 0,
    point.returnMap.branchAmplitudeFraction.ESV_L ?? 0,
  )).slice(0, 2)) addIndex(entry.index);
  addIndex(byScore((point) => point.health.clampHitCount + point.clampDiagnostics.totalClampHits)[0]?.index);
  const finiteByDelta = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => Number.isFinite(point.periodMetrics.CO_L) && Number.isFinite(point.periodMetrics.LAPMean))
    .sort((a, b) => a.point.deltaVolumeMl - b.point.deltaVolumeMl);
  addIndex(finiteByDelta[0]?.index);
  for (const entry of byScore((point) => Math.max(
    point.returnMap.branchAmplitudeFraction.CO_L ?? 0,
    point.returnMap.branchAmplitudeFraction.EDV_L ?? 0,
  ))) addIndex(entry.index);
  return Array.from(selected).slice(0, limit).sort((a, b) => a - b);
}

export function paramsWithLambdaActTau(
  params: CoreRuntimeParams,
  tauSec: number,
  scope: LambdaActScope,
  terms: LambdaActTerms = DEFAULT_LAMBDA_ACT_TERMS,
): CoreRuntimeParams {
  const tau = Math.max(Number.isFinite(tauSec) ? tauSec : 0, 0);
  if (tau <= 0) return params;
  const activeOverride = { tauLambdaActSec: tau, lambdaActTerms: terms };
  const apply = (chamber: "LV" | "RV" | "LA" | "RA") => {
    if (scope === "lv") return chamber === "LV";
    if (scope === "ventricles") return chamber === "LV" || chamber === "RV";
    return true;
  };
  const nodeOverrides = { ...(params.nodeOverrides ?? {}) };
  for (const chamber of ["LV", "RV", "LA", "RA"] as const) {
    if (!apply(chamber)) continue;
    nodeOverrides[chamber] = {
      ...(nodeOverrides[chamber] ?? {}),
      active: { ...((nodeOverrides[chamber]?.active as Partial<ActiveChamberParams> | undefined) ?? {}), ...activeOverride },
    };
  }
  return {
    ...params,
    nodeOverrides,
  };
}

export function paramsWithLowStretchLimiter(
  params: CoreRuntimeParams,
  mode: LowStretchLimiterMode,
  scope: LambdaActScope,
  activeReservePreset: ActiveReservePreset = DEFAULT_ACTIVE_RESERVE_PRESET,
): CoreRuntimeParams {
  const limiter = mode === "aInfCap" || mode === "activeReserveCap" || mode === "fIsoSlopeRelax" ? mode : "none";
  if (limiter === "none") return params;
  const apply = (chamber: "LV" | "RV" | "LA" | "RA") => {
    if (scope === "lv") return chamber === "LV";
    if (scope === "ventricles") return chamber === "LV" || chamber === "RV";
    return true;
  };
  const nodeOverrides = { ...(params.nodeOverrides ?? {}) };
  for (const chamber of ["LV", "RV", "LA", "RA"] as const) {
    if (!apply(chamber)) continue;
    nodeOverrides[chamber] = {
      ...(nodeOverrides[chamber] ?? {}),
      active: {
        ...((nodeOverrides[chamber]?.active as Partial<ActiveChamberParams> | undefined) ?? {}),
        lowStretchLimiter: limiter,
        ...activeReservePresetOverrides(limiter, activeReservePreset),
      },
    };
  }
  return {
    ...params,
    nodeOverrides,
  };
}

export function paramsWithTensionRiseComparator(
  params: CoreRuntimeParams,
  tauRiseSec: number | undefined,
  scope: LambdaActScope,
): CoreRuntimeParams {
  return paramsWithTensionComparator(params, tauRiseSec, 0, scope);
}

export function paramsWithTensionComparator(
  params: CoreRuntimeParams,
  tauRiseSec: number | undefined,
  tauFallSec: number | undefined,
  scope: LambdaActScope,
): CoreRuntimeParams {
  const tauRise = Number.isFinite(tauRiseSec) ? Math.max(Number(tauRiseSec), 0) : 0;
  const tauFall = Number.isFinite(tauFallSec) ? Math.max(Number(tauFallSec), 0) : 0;
  if (tauRise <= 0 && tauFall <= 0) return params;
  const effectiveTauRise = tauRise > 0 ? tauRise : 1e-4;
  const effectiveTauFall = tauFall > 0 ? tauFall : 1e-4;
  const apply = (chamber: "LV" | "RV" | "LA" | "RA") => {
    if (scope === "lv") return chamber === "LV";
    if (scope === "ventricles") return chamber === "LV" || chamber === "RV";
    return true;
  };
  const nodeOverrides = { ...(params.nodeOverrides ?? {}) };
  for (const chamber of ["LV", "RV", "LA", "RA"] as const) {
    if (!apply(chamber)) continue;
    nodeOverrides[chamber] = {
      ...(nodeOverrides[chamber] ?? {}),
      active: {
        ...((nodeOverrides[chamber]?.active as Partial<ActiveChamberParams> | undefined) ?? {}),
        tauTensionRiseSec: effectiveTauRise,
        tauTensionFallSec: effectiveTauFall,
        tensionInstantMix: 0,
      },
    };
  }
  return {
    ...params,
    nodeOverrides,
  };
}

function activeReservePresetOverrides(
  limiter: LowStretchLimiterMode,
  preset: ActiveReservePreset,
): Partial<ActiveChamberParams> {
  if (limiter !== "activeReserveCap") return {};
  if (preset === "directMild") {
    return { lowStretchLimiterStrength: 0.12, lowStretchLimiterActivationThreshold: undefined };
  }
  if (preset === "none") {
    return { lowStretchLimiterStrength: 0, lowStretchLimiterActivationThreshold: undefined };
  }
  if (preset === "directMedium") {
    return { lowStretchLimiterStrength: 0.22, lowStretchLimiterActivationThreshold: undefined };
  }
  if (preset === "thresholdMild") {
    return { lowStretchLimiterStrength: 0.22, lowStretchLimiterActivationThreshold: 0.65 };
  }
  return { lowStretchLimiterStrength: 0.35, lowStretchLimiterActivationThreshold: 0.55 };
}

function effectiveActiveReservePreset(
  limiter: LowStretchLimiterMode,
  preset: ActiveReservePreset | undefined,
): ActiveReservePreset {
  return limiter === "activeReserveCap" ? preset ?? DEFAULT_ACTIVE_RESERVE_PRESET : "none";
}

function applyTBVCorrectionMode(core: ModelCore, mode: TBVCorrectionMode): void {
  core.setTBVCorrectionEnabled(mode !== "off");
  core.setTBVCorrectionAuditOptions(mode === "low" ? LOW_TBV_CORRECTION_OPTIONS : null);
}

function configureDebugCore(
  core: ModelCore,
  tbvCorrectionMode: TBVCorrectionMode,
  aorticFlowClampMode: AorticFlowClampMode,
  aovQDotClamp?: number,
  aovQUpdateMode: AorticValveQUpdateMode = "current-loss",
  aovQDotClampNegative?: number,
  qDotClampScope: DynamicQDotClampScope = DEFAULT_Q_DOT_CLAMP_SCOPE,
): void {
  applyTBVCorrectionMode(core, tbvCorrectionMode);
  core.setAorticFlowClampMode(aorticFlowClampMode);
  const positiveClamp = finitePositiveOrDefault(aovQDotClamp, DEFAULT_AOV_Q_DOT_CLAMP);
  const negativeClamp = finitePositiveOrDefault(aovQDotClampNegative, positiveClamp);
  core.setDynamicFlowDerivativeClampLimits(positiveClamp, negativeClamp, qDotClampScope);
  core.setAorticValveQUpdateMode(aovQUpdateMode);
}

function tbvAuditFromClampDiagnostics(
  diagnostics: ModelCoreClampDiagnostics,
  correctionMode: TBVCorrectionMode,
): TBVAuditSummary {
  const sanitize = diagnostics.sanitizeLastBeat.absMl > 0 || diagnostics.sanitizeLastBeat.signedMl !== 0
    ? diagnostics.sanitizeLastBeat
    : diagnostics.sanitizeCurrentBeat;
  const projection = diagnostics.tbvProjectionLastBeat.absAppliedMl > 0 || diagnostics.tbvProjectionLastBeat.requestedMl !== 0
    ? diagnostics.tbvProjectionLastBeat
    : diagnostics.tbvProjectionCurrentBeat;
  const sanitizeAbsMl = finiteOrZero(sanitize.absMl);
  const projectionAbsAppliedMl = finiteOrZero(projection.absAppliedMl);
  const classification = sanitizeAbsMl > TBV_AUDIT_CONTAMINATION_THRESHOLD_ML
    || projectionAbsAppliedMl > TBV_AUDIT_CONTAMINATION_THRESHOLD_ML
    ? "contaminated"
    : "clean";
  return {
    correctionMode,
    classification,
    sanitizeSignedMl: finiteOrZero(sanitize.signedMl),
    sanitizeAbsMl,
    sanitizeByNodeSignedMl: { ...sanitize.byNodeSignedMl },
    sanitizeByNodeAbsMl: { ...sanitize.byNodeAbsMl },
    projectionRequestedMl: finiteOrZero(projection.requestedMl),
    projectionAppliedMl: finiteOrZero(projection.appliedMl),
    projectionAbsAppliedMl,
    projectionByNodeSignedMl: { ...projection.byNodeSignedMl },
    projectionByNodeAbsMl: { ...projection.byNodeAbsMl },
    tbvBeforeProjectionMl: projection.lastBeforeTBVMl,
    tbvAfterProjectionMl: projection.lastAfterTBVMl,
    expectedTBVMl: projection.lastExpectedTBVMl,
    tbvErrorBeforeProjectionMl: projection.lastErrorBeforeMl,
    tbvErrorAfterProjectionMl: projection.lastErrorAfterMl,
  };
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function settleDebugCore(
  params: CoreRuntimeParams,
  targetVolumeMl: number,
  dt: number,
  sampleHz: number,
  tbvCorrectionMode: TBVCorrectionMode,
  aorticFlowClampMode: AorticFlowClampMode,
  aovQDotClamp?: number,
  aovQUpdateMode: AorticValveQUpdateMode = "current-loss",
  seedState?: SerializedModelState,
  aovQDotClampNegative?: number,
  qDotClampScope: DynamicQDotClampScope = DEFAULT_Q_DOT_CLAMP_SCOPE,
): DebugRun {
  const started = performance.now();
  const core = new ModelCore(params);
  if (seedState) {
    core.unpackState(seedState);
    const retarget = core.retargetTBVFromCurrentState(targetVolumeMl);
    if (!retarget.ok) core.initializeVenousPressuresForTargetTBV(targetVolumeMl);
  } else {
    core.initializeVenousPressuresForTargetTBV(targetVolumeMl);
  }
  configureDebugCore(core, tbvCorrectionMode, aorticFlowClampMode, aovQDotClamp, aovQUpdateMode, aovQDotClampNegative, qDotClampScope);
  core.resetDebugDiagnostics();
  const settle = core.settleToSteady(SETTLE_POLICY, dt, sampleHz, RUN_OPTIONS);
  const periodBeats = settle.periodBeats ?? 1;
  const metrics = core.metrics({ windowBeats: periodBeats });
  const lastBeatMetrics = core.metrics({ windowBeats: 1 });
  const health = core.health({ periodBeats });
  const observables = core.debugObservables();
  return {
    core,
    settle,
    metrics,
    lastBeatMetrics,
    health,
    observables,
    state: core.packState(),
    wallMs: performance.now() - started,
  };
}

function collectTraceSamples(core: ModelCore, beats: number, dt: number, sampleHz: number): TraceSample[] {
  const samples: TraceSample[] = [];
  const seconds = (60 / Math.max(core.p.HR, 1)) * (beats + 2);
  const interval = 1 / sampleHz;
  let sampleAt = Math.floor((core.t + 1e-9) / interval) * interval + interval;
  const tEnd = core.t + seconds - 1e-9;
  while (core.t < tEnd) {
    core.step(dt);
    if (core.t >= sampleAt) {
      const sample = core.sample();
      samples.push({ sample, active: core.debugActiveStressDiagnostics() });
      sampleAt += interval;
    }
  }
  return samples;
}

function estimateReturnMapDiagnostic(
  state: SerializedModelState,
  params: CoreRuntimeParams,
  dt: number,
  sampleHz: number,
  returnMapMode: ReturnMapModeOption,
  tbvCorrectionMode: TBVCorrectionMode,
  aorticFlowClampMode: AorticFlowClampMode,
  aovQDotClamp: number | undefined,
  aovQUpdateMode: AorticValveQUpdateMode,
  aovQDotClampNegative: number | undefined,
  qDotClampScope: DynamicQDotClampScope,
  branchAmplitude: Partial<Record<ReturnMapFeatureKey, number>>,
  branchAmplitudeFraction: Partial<Record<ReturnMapFeatureKey, number>>,
): ReturnMapDiagnostic {
  if (returnMapMode === "none") {
    return skippedReturnMapDiagnostic(state, branchAmplitude, branchAmplitudeFraction, "return-map disabled");
  }
  try {
    const section = findNextLvEdvSection(state, params, dt, tbvCorrectionMode, aorticFlowClampMode, aovQDotClamp, aovQUpdateMode, aovQDotClampNegative, qDotClampScope);
    const includeFixed = returnMapMode === "fixed" || returnMapMode === "both";
    const includeReset = returnMapMode === "reset" || returnMapMode === "both";
    const fixedMode = includeFixed ? returnMapModeDiagnostic(section.state, params, dt, sampleHz, "volumeLambdaActFixed", tbvCorrectionMode, aorticFlowClampMode, aovQDotClamp, aovQUpdateMode, aovQDotClampNegative, qDotClampScope) : undefined;
    const resetMode = includeReset ? returnMapModeDiagnostic(section.state, params, dt, sampleHz, "volumeLambdaActReset", tbvCorrectionMode, aorticFlowClampMode, aovQDotClamp, aovQUpdateMode, aovQDotClampNegative, qDotClampScope) : undefined;
    const primaryMode: ReturnMapModeKey = includeFixed ? "volumeLambdaActFixed" : "volumeLambdaActReset";
    const primary = includeFixed ? fixedMode : resetMode;
    if (!primary) throw new Error(`unsupported return-map mode: ${returnMapMode}`);
    const oneBeat = primary.oneBeat;
    const twoBeatSamePhase = primary.twoBeatSamePhase;
    const nonsmooth = oneBeat.nonsmooth || twoBeatSamePhase.nonsmooth;
    const modes: ReturnMapDiagnostic["modes"] = {};
    if (fixedMode) {
      modes.volumeLambdaActFixed = {
        description: "volume-preserving LV/PVein perturbation; active-stretch memory remains unchanged",
        oneBeat: fixedMode.oneBeat,
        twoBeatSamePhase: fixedMode.twoBeatSamePhase,
      };
    }
    if (resetMode) {
      modes.volumeLambdaActReset = {
        description: "same perturbation, with LV lambdaAct reset to post-perturbation raw LV stretch before marching",
        oneBeat: resetMode.oneBeat,
        twoBeatSamePhase: resetMode.twoBeatSamePhase,
      };
    }
    return {
      status: "ok",
      method: "edv-section-volume-preserving-lv-pvein-central-difference",
      sectionInterpolation: "sample-peak",
      perturbationMl: RETURN_MAP_PERTURBATION_ML,
      primaryMode,
      sourcePhi: section.state.phi,
      sectionBeat: section.beat,
      sectionPhi: section.state.phi,
      sectionVlvMl: section.vlvMl,
      measuredBeatPlus: oneBeat.measuredBeatPlus,
      measuredBeatMinus: oneBeat.measuredBeatMinus,
      features: oneBeat.features,
      oneBeat,
      twoBeatSamePhase,
      modes,
      branchAmplitude,
      branchAmplitudeFraction,
      clampCrossing: oneBeat.clampCrossing || twoBeatSamePhase.clampCrossing,
      nonsmooth,
    };
  } catch (error) {
    return {
      status: "failed",
      method: "edv-section-volume-preserving-lv-pvein-central-difference",
      sectionInterpolation: "sample-peak",
      perturbationMl: RETURN_MAP_PERTURBATION_ML,
      primaryMode: "volumeLambdaActFixed",
      sourcePhi: state.phi,
      sectionBeat: null,
      sectionPhi: null,
      sectionVlvMl: null,
      measuredBeatPlus: null,
      measuredBeatMinus: null,
      features: {},
      oneBeat: null,
      twoBeatSamePhase: null,
      modes: {},
      branchAmplitude,
      branchAmplitudeFraction,
      clampCrossing: false,
      nonsmooth: false,
      failureReason: error instanceof Error ? error.message : String(error),
    };
  }
}

function skippedReturnMapDiagnostic(
  state: SerializedModelState,
  branchAmplitude: Partial<Record<ReturnMapFeatureKey, number>>,
  branchAmplitudeFraction: Partial<Record<ReturnMapFeatureKey, number>>,
  reason: string,
): ReturnMapDiagnostic {
  return {
    status: "skipped",
    method: "edv-section-volume-preserving-lv-pvein-central-difference",
    sectionInterpolation: "sample-peak",
    perturbationMl: RETURN_MAP_PERTURBATION_ML,
    primaryMode: "volumeLambdaActFixed",
    sourcePhi: state.phi,
    sectionBeat: null,
    sectionPhi: null,
    sectionVlvMl: null,
    measuredBeatPlus: null,
    measuredBeatMinus: null,
    features: {},
    oneBeat: null,
    twoBeatSamePhase: null,
    modes: {},
    branchAmplitude,
    branchAmplitudeFraction,
    clampCrossing: false,
    nonsmooth: false,
    failureReason: reason,
  };
}

function returnMapModeDiagnostic(
  sectionState: SerializedModelState,
  params: CoreRuntimeParams,
  dt: number,
  sampleHz: number,
  mode: ReturnMapModeKey,
  tbvCorrectionMode: TBVCorrectionMode,
  aorticFlowClampMode: AorticFlowClampMode,
  aovQDotClamp: number | undefined,
  aovQUpdateMode: AorticValveQUpdateMode,
  aovQDotClampNegative: number | undefined,
  qDotClampScope: DynamicQDotClampScope,
): { oneBeat: ReturnMapPhaseDiagnostic; twoBeatSamePhase: ReturnMapPhaseDiagnostic } {
  let plusState = perturbLvAgainstPVein(sectionState, RETURN_MAP_PERTURBATION_ML);
  let minusState = perturbLvAgainstPVein(sectionState, -RETURN_MAP_PERTURBATION_ML);
  if (mode === "volumeLambdaActReset") {
    plusState = resetLvLambdaActToRaw(plusState, params);
    minusState = resetLvLambdaActToRaw(minusState, params);
  }
  const plus = postPerturbationBeats(plusState, params, dt, sampleHz, tbvCorrectionMode, aorticFlowClampMode, aovQDotClamp, aovQUpdateMode, aovQDotClampNegative, qDotClampScope);
  const minus = postPerturbationBeats(minusState, params, dt, sampleHz, tbvCorrectionMode, aorticFlowClampMode, aovQDotClamp, aovQUpdateMode, aovQDotClampNegative, qDotClampScope);
  return {
    oneBeat: phaseDiagnostic(plus.oneBeat, minus.oneBeat, plus.clampHits, minus.clampHits),
    twoBeatSamePhase: phaseDiagnostic(plus.twoBeat, minus.twoBeat, plus.clampHits, minus.clampHits),
  };
}

function findNextLvEdvSection(
  state: SerializedModelState,
  params: CoreRuntimeParams,
  dt: number,
  tbvCorrectionMode: TBVCorrectionMode,
  aorticFlowClampMode: AorticFlowClampMode,
  aovQDotClamp?: number,
  aovQUpdateMode: AorticValveQUpdateMode = "current-loss",
  aovQDotClampNegative?: number,
  qDotClampScope: DynamicQDotClampScope = DEFAULT_Q_DOT_CLAMP_SCOPE,
): { state: SerializedModelState; beat: number; vlvMl: number } {
  const core = new ModelCore(params);
  core.unpackState(state);
  configureDebugCore(core, tbvCorrectionMode, aorticFlowClampMode, aovQDotClamp, aovQUpdateMode, aovQDotClampNegative, qDotClampScope);
  const targetBeat = Math.floor(core.sample().phi) + 1;
  const maxSeconds = (60 / Math.max(core.p.HR, 1)) * 3.5;
  const tEnd = core.t + maxSeconds;
  let bestState: SerializedModelState | undefined;
  let bestVlv = -Infinity;
  while (core.t < tEnd - 1e-9) {
    core.step(dt);
    const sample = core.sample();
    const beat = Math.floor(sample.phi);
    if (beat === targetBeat && sample.VLV > bestVlv) {
      bestVlv = sample.VLV;
      bestState = core.packState();
    }
    if (beat > targetBeat && bestState) break;
  }
  if (!bestState || !Number.isFinite(bestVlv)) {
    throw new Error("could not find next LV EDV section for return-map diagnostic");
  }
  return { state: bestState, beat: targetBeat, vlvMl: bestVlv };
}

function perturbLvAgainstPVein(state: SerializedModelState, lvDeltaMl: number): SerializedModelState {
  const idx = makeIndex();
  const x = [...state.x];
  const lvIndex = idx.node.LV;
  const pVeinIndex = idx.node.PVein;
  const nextLv = x[lvIndex] + lvDeltaMl;
  const nextPVein = x[pVeinIndex] - lvDeltaMl;
  if (!Number.isFinite(nextLv) || !Number.isFinite(nextPVein) || nextLv <= 1 || nextPVein <= 1) {
    throw new Error("perturbation would create non-finite or non-positive LV/PVein volume");
  }
  x[lvIndex] = nextLv;
  x[pVeinIndex] = nextPVein;
  return { ...state, x };
}

function resetLvLambdaActToRaw(state: SerializedModelState, params: CoreRuntimeParams): SerializedModelState {
  const core = new ModelCore(params);
  core.unpackState(state);
  const lambdaRaw = core.debugActiveStressDiagnostics().LV?.lambdaRaw;
  if (!Number.isFinite(lambdaRaw)) return state;
  const idx = makeIndex();
  const lambdaActIndex = idx.activeInternal.LV?.lambdaAct;
  if (lambdaActIndex == null) return state;
  const x = [...state.x];
  x[lambdaActIndex] = Number(lambdaRaw);
  return { ...state, x };
}

function newCoreFromState(state: SerializedModelState, params: CoreRuntimeParams): ModelCore {
  const core = new ModelCore(params);
  core.unpackState(state);
  return core;
}

function postPerturbationBeats(
  state: SerializedModelState,
  params: CoreRuntimeParams,
  dt: number,
  sampleHz: number,
  tbvCorrectionMode: TBVCorrectionMode,
  aorticFlowClampMode: AorticFlowClampMode,
  aovQDotClamp?: number,
  aovQUpdateMode: AorticValveQUpdateMode = "current-loss",
  aovQDotClampNegative?: number,
  qDotClampScope: DynamicQDotClampScope = DEFAULT_Q_DOT_CLAMP_SCOPE,
): { oneBeat: BeatTraceRow; twoBeat: BeatTraceRow; clampHits: number } {
  const core = newCoreFromState(state, params);
  configureDebugCore(core, tbvCorrectionMode, aorticFlowClampMode, aovQDotClamp, aovQUpdateMode, aovQDotClampNegative, qDotClampScope);
  core.resetDebugDiagnostics();
  void sampleHz;
  const firstTargetBeat = Math.floor(core.sample().phi) + 1;
  const secondTargetBeat = firstTargetBeat + 1;
  const beatSeconds = 60 / Math.max(core.p.HR, 1);
  const entries: TraceSample[] = [];
  const tEnd = core.t + beatSeconds * 3.5;
  while (core.t < tEnd - 1e-9) {
    core.step(dt);
    const sample = core.sample();
    const beat = Math.floor(sample.phi);
    if (beat === firstTargetBeat || beat === secondTargetBeat) entries.push({ sample, active: core.debugActiveStressDiagnostics() });
    if (beat > secondTargetBeat && entries.length >= 10) break;
  }
  const groups = groupTraceSamplesByBeat(entries);
  const oneEntries = groups.get(firstTargetBeat) ?? [];
  const twoEntries = groups.get(secondTargetBeat) ?? [];
  if (oneEntries.length < 5 || twoEntries.length < 5) {
    throw new Error("could not collect complete one-beat and two-beat post-perturbation responses");
  }
  return {
    oneBeat: summarizeBeat(firstTargetBeat, oneEntries, params.HR, aorticFlowClampMode),
    twoBeat: summarizeBeat(secondTargetBeat, twoEntries, params.HR, aorticFlowClampMode),
    clampHits: core.debugClampDiagnostics().totalClampHits,
  };
}

function phaseDiagnostic(
  plusBeat: BeatTraceRow,
  minusBeat: BeatTraceRow,
  plusClampHits: number,
  minusClampHits: number,
): ReturnMapPhaseDiagnostic {
  const clampCrossing = plusClampHits > 0 || minusClampHits > 0 || plusClampHits !== minusClampHits;
  return {
    measuredBeatPlus: plusBeat.beat,
    measuredBeatMinus: minusBeat.beat,
    features: {
      EDV_L: centralFeature(plusBeat.EDV_L, minusBeat.EDV_L),
      ESV_L: centralFeature(plusBeat.ESV_L, minusBeat.ESV_L),
      CO_L: centralFeature(plusBeat.CO_L, minusBeat.CO_L),
      LAPMean: centralFeature(plusBeat.LAPMean, minusBeat.LAPMean),
      QAoMax: centralFeature(plusBeat.QAoMax, minusBeat.QAoMax),
      AoPMax: centralFeature(plusBeat.AoPMax, minusBeat.AoPMax),
      AoPMean: centralFeature(plusBeat.AoPMean, minusBeat.AoPMean),
      LVPMax: centralFeature(plusBeat.LVPMax, minusBeat.LVPMax),
      sigmaActTargetMax: centralFeature(activeFeature(plusBeat, "sigmaActTargetMax"), activeFeature(minusBeat, "sigmaActTargetMax")),
      sigmaActMean: centralFeature(activeFeature(plusBeat, "sigmaActMean"), activeFeature(minusBeat, "sigmaActMean")),
    },
    clampCrossing,
    nonsmooth: clampCrossing,
    plusClampHits,
    minusClampHits,
  };
}

function branchAmplitudeFromTrace(traceSamples: TraceSample[], HR: number, aorticFlowClampMode: AorticFlowClampMode): Partial<Record<ReturnMapFeatureKey, number>> {
  const trace = summarizeBeatTrace(traceSamples, HR, 4, aorticFlowClampMode);
  if (trace.length < 2) return {};
  const a = trace[trace.length - 1];
  const b = trace[trace.length - 2];
  return {
    EDV_L: Math.abs(a.EDV_L - b.EDV_L),
    ESV_L: Math.abs(a.ESV_L - b.ESV_L),
    CO_L: Math.abs(a.CO_L - b.CO_L),
    LAPMean: Math.abs(a.LAPMean - b.LAPMean),
    QAoMax: Math.abs(a.QAoMax - b.QAoMax),
    AoPMax: Math.abs(a.AoPMax - b.AoPMax),
    AoPMean: Math.abs(a.AoPMean - b.AoPMean),
    LVPMax: Math.abs(a.LVPMax - b.LVPMax),
    sigmaActTargetMax: Math.abs(activeFeature(a, "sigmaActTargetMax") - activeFeature(b, "sigmaActTargetMax")),
    sigmaActMean: Math.abs(activeFeature(a, "sigmaActMean") - activeFeature(b, "sigmaActMean")),
  };
}

function branchAmplitudeFractionFromTrace(traceSamples: TraceSample[], HR: number, aorticFlowClampMode: AorticFlowClampMode): Partial<Record<ReturnMapFeatureKey, number>> {
  const trace = summarizeBeatTrace(traceSamples, HR, 4, aorticFlowClampMode);
  if (trace.length < 2) return {};
  const a = trace[trace.length - 1];
  const b = trace[trace.length - 2];
  return {
    EDV_L: fractionalDifference(a.EDV_L, b.EDV_L, 1),
    ESV_L: fractionalDifference(a.ESV_L, b.ESV_L, 1),
    CO_L: fractionalDifference(a.CO_L, b.CO_L, 0.05),
    LAPMean: fractionalDifference(a.LAPMean, b.LAPMean, 0.1),
    QAoMax: fractionalDifference(a.QAoMax, b.QAoMax, 1),
    AoPMax: fractionalDifference(a.AoPMax, b.AoPMax, 1),
    AoPMean: fractionalDifference(a.AoPMean, b.AoPMean, 1),
    LVPMax: fractionalDifference(a.LVPMax, b.LVPMax, 1),
    sigmaActTargetMax: fractionalDifference(activeFeature(a, "sigmaActTargetMax"), activeFeature(b, "sigmaActTargetMax"), 1),
    sigmaActMean: fractionalDifference(activeFeature(a, "sigmaActMean"), activeFeature(b, "sigmaActMean"), 1),
  };
}

function activeFeature(beat: BeatTraceRow, key: keyof Pick<ActiveBeatSummary, "sigmaActTargetMax" | "sigmaActMean">): number {
  return Number(beat.active.LV?.[key] ?? Number.NaN);
}

function groupTraceSamplesByBeat(traceSamples: TraceSample[]): Map<number, TraceSample[]> {
  const groups = new Map<number, TraceSample[]>();
  for (const entry of traceSamples) {
    const beat = Math.floor(entry.sample.phi);
    const arr = groups.get(beat) ?? [];
    arr.push(entry);
    groups.set(beat, arr);
  }
  return groups;
}

function centralFeature(plus: number, minus: number): ReturnMapFeature {
  const centralSlope = (plus - minus) / (2 * RETURN_MAP_PERTURBATION_ML);
  return {
    plus,
    minus,
    centralSlope,
    absCentralSlope: Math.abs(centralSlope),
  };
}

function fractionalDifference(a: number, b: number, floor: number): number {
  const denom = Math.max(Math.abs(a), Math.abs(b), floor);
  return Math.abs(a - b) / denom;
}

function summarizeBeatTrace(traceSamples: TraceSample[], HR: number, traceBeats: number, aorticFlowClampMode: AorticFlowClampMode): BeatTraceRow[] {
  const groups = groupTraceSamplesByBeat(traceSamples);
  const beatIds = Array.from(groups.keys()).sort((a, b) => a - b);
  const completeIds = beatIds.slice(1, -1).filter((beat) => (groups.get(beat)?.length ?? 0) >= 5);
  return completeIds.slice(-traceBeats).map((beat) => summarizeBeat(beat, groups.get(beat) ?? [], HR, aorticFlowClampMode));
}

function buildBeatPairOverlay(traceSamples: TraceSample[], HR: number, aorticFlowClampMode: AorticFlowClampMode): BeatPairOverlay {
  const groups = groupTraceSamplesByBeat(traceSamples);
  const beatIds = Array.from(groups.keys()).sort((a, b) => a - b);
  const completeIds = beatIds.slice(1, -1).filter((beat) => (groups.get(beat)?.length ?? 0) >= 5);
  const pair = completeIds.slice(-2);
  if (pair.length < 2) {
    return {
      beats: [],
      rows: [],
      interpretation: beatPairOverlayInterpretation(),
    };
  }
  const beatSeconds = 60 / Math.max(HR, 1);
  const rows: BeatPairOverlayRow[] = [];
  const beatSummaries: BeatPairBeatSummary[] = [];
  for (const [pairIndex, beat] of pair.entries()) {
    const entries = groups.get(beat) ?? [];
    const summary = summarizeBeat(beat, entries, HR, aorticFlowClampMode);
    beatSummaries.push({
      beat,
      pairBeat: pairIndex === 0 ? "previous" : "last",
      label: "tie",
      CO_L: summary.CO_L,
      SV_L: summary.SV_L,
      EDV_L: summary.EDV_L,
      ESV_L: summary.ESV_L,
      QAoMax: finiteMaxOrNull(entries.map((entry) => entry.sample.QAo)) ?? Number.NaN,
      sigmaActTargetMax: finiteMaxOrNull(entries.map((entry) => entry.active.LV?.sigmaActTarget ?? Number.NaN)),
      sigmaActMax: finiteMaxOrNull(entries.map((entry) => entry.active.LV?.sigmaAct ?? Number.NaN)),
    });
    const samples = entries.map((entry) => entry.sample);
    const minVlv = finiteMin(samples.map((sample) => sample.VLV));
    const maxVlv = finiteMaxOrNull(samples.map((sample) => sample.VLV)) ?? Number.NaN;
    for (const entry of entries) {
      const sample = entry.sample;
      const lv = entry.active.LV;
      const phase = sample.phi - Math.floor(sample.phi);
      rows.push({
        beat,
        pairBeat: pairIndex === 0 ? "previous" : "last",
        phase,
        tFromBeatStartSec: phase * beatSeconds,
        tSec: sample.t,
        QMV: sample.QMV,
        xiMV: sample.xiMV,
        MV_open01: sample.xiMV > 0.05 || sample.QMV > 1 ? 1 : 0,
        LAP_minus_LVP: sample.LAP - sample.LVP,
        VLV: sample.VLV,
        ESV_marker01: Math.abs(sample.VLV - minVlv) <= 1e-6 ? 1 : 0,
        EDV_marker01: Math.abs(sample.VLV - maxVlv) <= 1e-6 ? 1 : 0,
        LV_c: lv?.c ?? null,
        LV_a: lv?.a ?? null,
        LV_sigmaActTargetRaw: lv?.sigmaActTargetRaw ?? null,
        LV_sigmaActTarget: lv?.sigmaActTarget ?? null,
        LV_sigmaAct: lv?.sigmaAct ?? null,
        LV_lambdaRaw: lv?.lambdaRaw ?? null,
        LV_lambdaAct: lv?.lambdaAct ?? null,
        QAo: sample.QAo,
        xiAoV: sample.xiAoV,
        AoV_open01: sample.xiAoV > 0.05 || sample.QAo > 1 ? 1 : 0,
        AoP: sample.AoP,
        LVP: sample.LVP,
        AoP_minus_LVP: sample.AoP - sample.LVP,
        dP_AoV: sample.dP_AoV,
        AoV_areaRatio: sample.AoV_areaRatio,
      });
    }
  }
  const summary = buildBeatPairOverlaySummary(rows, beatSummaries);
  return {
    beats: [pair[0], pair[1]],
    rows,
    summary,
    interpretation: beatPairOverlayInterpretation(),
  };
}

function buildBeatPairOverlaySummary(rows: BeatPairOverlayRow[], beatSummaries: BeatPairBeatSummary[]): BeatPairOverlaySummary | undefined {
  if (beatSummaries.length !== 2 || rows.length === 0) return undefined;
  const labeledBeats = labelBeatPair(beatSummaries);
  const highBeat = labeledBeats.find((beat) => beat.label === "high-output") ?? null;
  const lowBeat = labeledBeats.find((beat) => beat.label === "low-output") ?? null;
  const highRows = highBeat ? rows.filter((row) => row.beat === highBeat.beat).sort((a, b) => a.phase - b.phase) : [];
  const lowRows = lowBeat ? rows.filter((row) => row.beat === lowBeat.beat).sort((a, b) => a.phase - b.phase) : [];
  const signals = highRows.length > 0 && lowRows.length > 0
    ? BEAT_PAIR_SIGNAL_SPECS.map((spec) => summarizeBeatPairSignal(spec, highRows, lowRows))
    : [];
  const windows = highRows.length > 0 && lowRows.length > 0
    ? BEAT_PAIR_PHASE_WINDOWS.flatMap((window) => BEAT_PAIR_SIGNAL_SPECS.map((spec) => summarizeBeatPairWindow(spec, window, highRows, lowRows)))
    : [];
  return {
    highOutputBeat: highBeat?.beat ?? null,
    lowOutputBeat: lowBeat?.beat ?? null,
    coDifferenceLMin: diffOrNull(highBeat?.CO_L, lowBeat?.CO_L),
    svDifferenceMl: diffOrNull(highBeat?.SV_L, lowBeat?.SV_L),
    esvDifferenceMl: diffOrNull(highBeat?.ESV_L, lowBeat?.ESV_L),
    qAoMaxDifferenceMlPerSec: diffOrNull(highBeat?.QAoMax, lowBeat?.QAoMax),
    sigmaActTargetMaxDifferencePa: diffOrNull(highBeat?.sigmaActTargetMax, lowBeat?.sigmaActTargetMax),
    sigmaActMaxDifferencePa: diffOrNull(highBeat?.sigmaActMax, lowBeat?.sigmaActMax),
    divergenceThreshold: BEAT_PAIR_DIVERGENCE_THRESHOLD,
    divergenceConsecutiveSamples: BEAT_PAIR_DIVERGENCE_CONSECUTIVE_SAMPLES,
    beatSummaries: labeledBeats,
    signals,
    windows,
  };
}

function labelBeatPair(beatSummaries: BeatPairBeatSummary[]): BeatPairBeatSummary[] {
  const [a, b] = beatSummaries;
  if (!a || !b) return beatSummaries;
  if (Math.abs(a.CO_L - b.CO_L) < 1e-6) {
    return beatSummaries.map((beat) => ({ ...beat, label: "tie" }));
  }
  const highBeat = a.CO_L > b.CO_L ? a.beat : b.beat;
  return beatSummaries.map((beat) => ({
    ...beat,
    label: beat.beat === highBeat ? "high-output" : "low-output",
  }));
}

function summarizeBeatPairSignal(
  spec: { signal: string; key: BeatPairSignalKey; scaleFloor: number },
  highRows: BeatPairOverlayRow[],
  lowRows: BeatPairOverlayRow[],
): BeatPairSignalDivergence {
  const pairs = pairedBeatRows(highRows, lowRows)
    .map(({ high, low }) => beatPairDiff(spec, high, low))
    .filter((value): value is NonNullable<typeof value> => value != null)
    .sort((a, b) => a.phase - b.phase);
  const first = firstDivergence(pairs);
  return {
    signal: spec.signal,
    sourceColumn: spec.key,
    scale: finiteMaxOrNull(pairs.map((pair) => pair.scale)) ?? spec.scaleFloor,
    maxAbsDiff: finiteMaxOrNull(pairs.map((pair) => Math.abs(pair.diff))) ?? Number.NaN,
    maxNormalizedDiff: finiteMaxOrNull(pairs.map((pair) => Math.abs(pair.normalizedDiff))) ?? Number.NaN,
    meanAbsNormalizedDiff: meanNumbers(pairs.map((pair) => Math.abs(pair.normalizedDiff))),
    firstDivergencePhase: first?.phase ?? null,
    firstDivergenceWindow: first ? phaseWindowName(first.phase) : null,
    highMinusLowAtFirstDivergence: first?.diff ?? null,
  };
}

function summarizeBeatPairWindow(
  spec: { signal: string; key: BeatPairSignalKey; scaleFloor: number },
  window: { name: string; phaseStart: number; phaseEnd: number },
  highRows: BeatPairOverlayRow[],
  lowRows: BeatPairOverlayRow[],
): BeatPairWindowDifference {
  const pairs = pairedBeatRows(highRows, lowRows)
    .filter(({ high }) => phaseValueInWindow(high.phase, window.phaseStart, window.phaseEnd))
    .map(({ high, low }) => beatPairDiff(spec, high, low))
    .filter((value): value is NonNullable<typeof value> => value != null);
  const meanDiff = meanNumbers(pairs.map((pair) => pair.diff));
  return {
    window: window.name,
    phaseStart: window.phaseStart,
    phaseEnd: window.phaseEnd,
    signal: spec.signal,
    sourceColumn: spec.key,
    meanDiff,
    meanAbsDiff: meanNumbers(pairs.map((pair) => Math.abs(pair.diff))),
    maxAbsDiff: finiteMaxOrNull(pairs.map((pair) => Math.abs(pair.diff))) ?? Number.NaN,
    meanNormalizedDiff: meanNumbers(pairs.map((pair) => pair.normalizedDiff)),
    maxNormalizedDiff: finiteMaxOrNull(pairs.map((pair) => Math.abs(pair.normalizedDiff))) ?? Number.NaN,
    signedArea: meanDiff * phaseWindowWidth(window.phaseStart, window.phaseEnd),
  };
}

function pairedBeatRows(highRows: BeatPairOverlayRow[], lowRows: BeatPairOverlayRow[]): Array<{ high: BeatPairOverlayRow; low: BeatPairOverlayRow }> {
  return highRows
    .map((high) => ({ high, low: nearestPhaseRow(lowRows, high.phase) }))
    .filter((pair): pair is { high: BeatPairOverlayRow; low: BeatPairOverlayRow } => pair.low != null);
}

function beatPairDiff(
  spec: { signal: string; key: BeatPairSignalKey; scaleFloor: number },
  high: BeatPairOverlayRow,
  low: BeatPairOverlayRow,
): { phase: number; diff: number; normalizedDiff: number; scale: number } | null {
  const highValue = beatPairValue(high, spec.key);
  const lowValue = beatPairValue(low, spec.key);
  if (highValue == null || lowValue == null) return null;
  const diff = highValue - lowValue;
  const scale = Math.max(Math.abs(highValue), Math.abs(lowValue), spec.scaleFloor);
  return {
    phase: high.phase,
    diff,
    normalizedDiff: diff / scale,
    scale,
  };
}

function firstDivergence(pairs: Array<{ phase: number; diff: number; normalizedDiff: number }>): { phase: number; diff: number } | null {
  let runStart: { phase: number; diff: number } | null = null;
  let runLength = 0;
  for (const pair of pairs) {
    if (Math.abs(pair.normalizedDiff) >= BEAT_PAIR_DIVERGENCE_THRESHOLD) {
      runStart ??= { phase: pair.phase, diff: pair.diff };
      runLength += 1;
      if (runLength >= BEAT_PAIR_DIVERGENCE_CONSECUTIVE_SAMPLES) return runStart;
    } else {
      runStart = null;
      runLength = 0;
    }
  }
  return null;
}

function beatPairValue(row: BeatPairOverlayRow, key: BeatPairSignalKey): number | null {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nearestPhaseRow(rows: BeatPairOverlayRow[], phase: number): BeatPairOverlayRow | null {
  let best: BeatPairOverlayRow | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const row of rows) {
    const distance = circularPhaseDistance(row.phase, phase);
    if (distance < bestDistance) {
      best = row;
      bestDistance = distance;
    }
  }
  return best;
}

function circularPhaseDistance(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 1 - raw);
}

function phaseValueInWindow(phase: number, lo: number, hi: number): boolean {
  return lo <= hi ? phase >= lo && phase < hi : phase >= lo || phase < hi;
}

function phaseWindowName(phase: number): string | null {
  return BEAT_PAIR_PHASE_WINDOWS.find((window) => phaseValueInWindow(phase, window.phaseStart, window.phaseEnd))?.name ?? null;
}

function phaseWindowWidth(lo: number, hi: number): number {
  return lo <= hi ? hi - lo : 1 - lo + hi;
}

function diffOrNull(a: number | null | undefined, b: number | null | undefined): number | null {
  return typeof a === "number" && Number.isFinite(a) && typeof b === "number" && Number.isFinite(b) ? a - b : null;
}

function beatPairOverlayInterpretation(): BeatPairOverlay["interpretation"] {
  return {
    purpose: "Phase-align the last two complete beats so active/ejection state can be compared against MV/filling event timing without changing model dynamics.",
    primaryQuestion: "Does MV near-zero/filling morphology switch precede same-beat ejection/ESV/CO changes, or does prior-beat active/ejection state explain next-beat filling morphology?",
    columns: [
      "QMV",
      "xiMV",
      "MV_open01",
      "LAP_minus_LVP",
      "VLV with ESV/EDV markers",
      "LV_c",
      "LV_a",
      "LV_sigmaActTargetRaw",
      "LV_sigmaActTarget",
      "LV_sigmaAct",
      "QAo",
      "xiAoV",
      "AoV_open01",
      "AoP_minus_LVP",
    ],
  };
}

function summarizeBeat(beat: number, entries: TraceSample[], HR: number, aorticFlowClampMode: AorticFlowClampMode): BeatTraceRow {
  const samples = entries.map((entry) => entry.sample);
  const mean = (key: keyof SimSample) => meanNumbers(samples.map((sample) => Number(sample[key])));
  const max = (key: keyof SimSample) => Math.max(...samples.map((sample) => Number(sample[key])));
  const min = (key: keyof SimSample) => Math.min(...samples.map((sample) => Number(sample[key])));
  const svL = integratePositive(samples, "QAo");
  const svR = integratePositive(samples, "QPA");
  const qAoValues = samples.map((sample) => Number(sample.QAo)).filter(Number.isFinite);
  const qAoProximity = qAoCapProximity(qAoValues, aorticFlowClampMode);
  return {
    beat,
    sampleCount: samples.length,
    LAPMean: mean("LAP"),
    RAPMean: mean("RAP"),
    CO_L: (svL * HR) / 1000,
    CO_R: (svR * HR) / 1000,
    SV_L: svL,
    SV_R: svR,
    EDV_L: max("VLV"),
    ESV_L: min("VLV"),
    EDV_R: max("VRV"),
    ESV_R: min("VRV"),
    LVPMax: max("LVP"),
    AoPMean: mean("AoP"),
    AoPMax: max("AoP"),
    PAPMean: mean("PAP"),
    PAPMax: max("PAP"),
    QAoMax: max("QAo"),
    QMVMax: max("QMV"),
    QTVMax: max("QTV"),
    QPVMax: max("QPV"),
    ...qAoProximity,
    filling: fillingRegimeSummary(samples),
    active: summarizeActive(entries),
  };
}

function qAoCapProximity(values: number[], aorticFlowClampMode: AorticFlowClampMode): Pick<BeatTraceRow,
  "QAoCapRatioMax"
  | "QAoNearCap90Fraction"
  | "QAoNearCap95Fraction"
  | "QAoNearCap98Fraction"
  | "QAoAtCapFraction"
  | "QAoLocalCapActiveFraction"
> {
  const positive = values.filter((value) => Number.isFinite(value) && value > 0);
  const denom = Math.max(positive.length, 1);
  const cap = DYNAMIC_FLOW_CLAMP_ML_PER_S;
  const localIdentityFraction = aorticFlowClampIdentityFraction(aorticFlowClampMode);
  const localThreshold = localIdentityFraction == null ? undefined : cap * localIdentityFraction;
  const maxValue = positive.length > 0 ? Math.max(...positive) : 0;
  return {
    QAoCapRatioMax: maxValue / cap,
    QAoNearCap90Fraction: positive.filter((value) => value >= cap * 0.90).length / denom,
    QAoNearCap95Fraction: positive.filter((value) => value >= cap * 0.95).length / denom,
    QAoNearCap98Fraction: positive.filter((value) => value >= cap * 0.98).length / denom,
    QAoAtCapFraction: positive.filter((value) => value >= cap * 0.999).length / denom,
    QAoLocalCapActiveFraction: localThreshold == null ? 0 : positive.filter((value) => value > localThreshold).length / denom,
  };
}

function aorticFlowClampIdentityFraction(mode: AorticFlowClampMode): number | undefined {
  if (mode === "local-c1-0.90") return 0.90;
  if (mode === "local-c1-0.95" || mode === "local-c2-0.95") return 0.95;
  if (mode === "local-c1-0.98" || mode === "local-c2-0.98") return 0.98;
  return undefined;
}

function fillingRegimeSummary(samples: SimSample[]): FillingRegimeSummary {
  const eSamples = samples.filter((sample) => phaseInWindow(sample, 0.30, 0.75));
  const midSamples = samples.filter((sample) => phaseInWindow(sample, 0.58, 0.85));
  const aSamples = samples.filter((sample) => phaseInWindow(sample, 0.85, 0.08));
  const diastolicSamples = samples.filter((sample) => phaseInWindow(sample, 0.30, 0.08));
  const eForward = integratePositive(eSamples, "QMV");
  const midForward = integratePositive(midSamples, "QMV");
  const aForward = integratePositive(aSamples, "QMV");
  const totalForward = eForward + aForward;
  const totalDiastolicForward = integratePositive(diastolicSamples, "QMV");
  const ePeak = finiteMaxOrNull(eSamples.map((sample) => Math.max(0, sample.QMV)));
  const midPeak = finiteMaxOrNull(midSamples.map((sample) => Math.max(0, sample.QMV)));
  const aPeak = finiteMaxOrNull(aSamples.map((sample) => Math.max(0, sample.QMV)));
  const maxForwardPeak = finiteMaxOrNull(samples.map((sample) => Math.max(0, sample.QMV))) ?? 0;
  const forwardThreshold = Math.max(1, maxForwardPeak * 0.08);
  const nearZeroThreshold = Math.max(0.5, maxForwardPeak * 0.02);
  const forwardRuns = countBooleanRuns(diastolicSamples.map((sample) => sample.QMV > forwardThreshold));
  const openRuns = countBooleanRuns(diastolicSamples.map((sample) => sample.xiMV > 0.05 || sample.QMV > 1));
  const interwaveXi = midSamples.map((sample) => sample.xiMV).filter(Number.isFinite);
  const interwaveOpen01 = midSamples.map((sample) => sample.xiMV > 0.05 || sample.QMV > 1 ? 1 : 0);
  const laLoopArea = Math.abs(loopArea(samples.map((sample) => ({ x: sample.VLA, y: sample.LAP }))));
  const laALoopArea = Math.abs(loopArea(aSamples.map((sample) => ({ x: sample.VLA, y: sample.LAP }))));
  const aGradients = aSamples.map((sample) => Math.max(0, sample.LAP - sample.LVP)).filter(Number.isFinite);
  return {
    MV_E_forward_mL: eForward,
    MV_A_forward_mL: aForward,
    MV_A_fraction: totalForward > 1e-9 ? aForward / totalForward : null,
    MV_E_peak: ePeak,
    MV_A_peak: aPeak,
    MV_mid_forward_mL: midForward,
    MV_mid_peak: midPeak,
    MV_forward_peak_count: countForwardPeaks(diastolicSamples, forwardThreshold),
    MV_mid_forward_peak_count: countForwardPeaks(midSamples, forwardThreshold),
    QMV_near_zero_return_count: countNearZeroReturns(diastolicSamples, forwardThreshold, nearZeroThreshold),
    MV_open_close_reopen_count: Math.max(0, openRuns - 1),
    MV_interwave_xi_min: interwaveXi.length > 0 ? Math.min(...interwaveXi) : null,
    MV_interwave_open01_min: interwaveOpen01.length > 0 ? Math.min(...interwaveOpen01) : null,
    LAP_LVP_zero_crossing_count: countZeroCrossings(diastolicSamples.map((sample) => sample.LAP - sample.LVP)),
    fillingMorphologyClass: fillingMorphologyClass({
      eForward,
      aForward,
      midForward,
      totalForward: totalDiastolicForward,
      ePeak,
      aPeak,
      midPeak,
      peakCount: countForwardPeaks(diastolicSamples, forwardThreshold),
    }),
    LA_loop_area: laLoopArea,
    LA_A_loop_area: laALoopArea,
    LA_A_loop_fraction: laLoopArea > 1e-9 ? laALoopArea / laLoopArea : null,
    atrialSystoleTransmitralGradientMean: finiteOrZero(meanNumbers(aGradients)),
    atrialSystoleTransmitralGradientMax: finiteMaxOrNull(aGradients) ?? 0,
    atrialSystoleMVOpenFraction: aSamples.length > 0
      ? meanNumbers(aSamples.map((sample) => sample.xiMV > 0.05 || sample.QMV > 1 ? 1 : 0))
      : 0,
  };
}

function countForwardPeaks(samples: SimSample[], threshold: number): number {
  const q = samples.map((sample) => Math.max(0, sample.QMV));
  if (q.length < 3) return q.some((value) => value > threshold) ? 1 : 0;
  let count = 0;
  let inRun = false;
  let runMax = 0;
  for (const value of q) {
    if (value > threshold) {
      inRun = true;
      runMax = Math.max(runMax, value);
    } else if (inRun) {
      if (runMax > threshold) count++;
      inRun = false;
      runMax = 0;
    }
  }
  if (inRun && runMax > threshold) count++;
  return count;
}

function countNearZeroReturns(samples: SimSample[], forwardThreshold: number, nearZeroThreshold: number): number {
  let count = 0;
  let sawForwardBeforeZero = false;
  let inNearZeroAfterForward = false;
  for (const sample of samples) {
    const q = Math.max(0, sample.QMV);
    if (q > forwardThreshold) {
      if (inNearZeroAfterForward) count++;
      sawForwardBeforeZero = true;
      inNearZeroAfterForward = false;
    } else if (sawForwardBeforeZero && q <= nearZeroThreshold) {
      inNearZeroAfterForward = true;
    }
  }
  return count;
}

function countBooleanRuns(values: boolean[]): number {
  let count = 0;
  let inRun = false;
  for (const value of values) {
    if (value && !inRun) count++;
    inRun = value;
  }
  return count;
}

function countZeroCrossings(values: number[]): number {
  let count = 0;
  let prev = 0;
  for (const value of values) {
    if (!Number.isFinite(value) || Math.abs(value) < 1e-6) continue;
    const sign = Math.sign(value);
    if (prev !== 0 && sign !== prev) count++;
    prev = sign;
  }
  return count;
}

function fillingMorphologyClass(input: {
  eForward: number;
  aForward: number;
  midForward: number;
  totalForward: number;
  ePeak: number | null;
  aPeak: number | null;
  midPeak: number | null;
  peakCount: number;
}): FillingMorphologyClass {
  const total = input.totalForward;
  if (!Number.isFinite(total) || total < 1) return "indeterminate";
  const eStrong = input.eForward / total >= 0.15 || (input.ePeak ?? 0) >= 5;
  const aFraction = input.aForward / total;
  const aStrong = aFraction >= 0.12 || (input.aPeak ?? 0) >= Math.max(5, (input.ePeak ?? 0) * 0.12);
  const midStrong = input.midForward / total >= 0.12 || (input.midPeak ?? 0) >= Math.max(5, (input.ePeak ?? 0) * 0.10);
  if (eStrong && aStrong && midStrong && input.peakCount >= 3) return "E+mid+A";
  if (eStrong && aStrong) return "E+A";
  if (eStrong && !aStrong && (aFraction > 0.02 || (input.aPeak ?? 0) > 1)) return "weak-A";
  if (eStrong) return "E-only";
  return "indeterminate";
}

function phaseInWindow(sample: SimSample, lo: number, hi: number): boolean {
  const theta = sample.phi - Math.floor(sample.phi);
  return lo <= hi ? theta >= lo && theta < hi : theta >= lo || theta < hi;
}

function loopArea(points: Array<{ x: number; y: number }>): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return 0.5 * area;
}

function finiteMaxOrNull(values: number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : null;
}

function summarizeActive(entries: TraceSample[]): Partial<Record<Chamber, ActiveBeatSummary>> {
  const chambers: Chamber[] = ["LV", "RV", "LA", "RA"];
  const out: Partial<Record<Chamber, ActiveBeatSummary>> = {};
  for (const chamber of chambers) {
    const terms = entries.map((entry) => entry.active[chamber]).filter((term): term is NonNullable<typeof term> => !!term);
    if (terms.length === 0) continue;
    out[chamber] = {
      lambdaMean: meanNumbers(terms.map((term) => term.lambda)),
      lambdaMin: Math.min(...terms.map((term) => term.lambda)),
      lambdaMax: Math.max(...terms.map((term) => term.lambda)),
      lambdaRawMean: meanNumbers(terms.map((term) => term.lambdaRaw)),
      lambdaActMean: meanNumbers(terms.map((term) => term.lambdaAct)),
      lambdaForKdMean: meanNumbers(terms.map((term) => term.lambdaForKd)),
      lambdaForFIsoMean: meanNumbers(terms.map((term) => term.lambdaForFIso)),
      tauLambdaActSecMean: meanNumbers(terms.map((term) => term.tauLambdaActSec)),
      KdMean: meanNumbers(terms.map((term) => term.Kd)),
      aInfMean: meanNumbers(terms.map((term) => term.aInf)),
      tauAMean: meanNumbers(terms.map((term) => term.tauA)),
      cMean: meanNumbers(terms.map((term) => term.c)),
      aMean: meanNumbers(terms.map((term) => term.a)),
      sigmaActTargetMean: meanNumbers(terms.map((term) => term.sigmaActTarget)),
      sigmaActMean: meanNumbers(terms.map((term) => term.sigmaAct)),
      sigmaPasMean: meanNumbers(terms.map((term) => term.sigmaPas)),
      fIsoMean: meanNumbers(terms.map((term) => term.fIso)),
      fIsoRawMean: meanNumbers(terms.map((term) => term.fIsoRaw)),
      fIsoLimiterMean: meanNumbers(terms.map((term) => term.fIsoLimiter)),
      fIsoLimiterMin: Math.min(...terms.map((term) => term.fIsoLimiter).filter(Number.isFinite)),
      fIsoLimiterHitFraction: meanNumbers(terms.map((term) => term.fIsoLimiter < 0.999 ? 1 : 0)),
      fIsoLimiterDeltaMean: meanNumbers(terms.map((term) => term.fIsoLimiterDelta)),
      gOverMean: meanNumbers(terms.map((term) => term.gOver)),
      forceVelocityScaleMean: meanNumbers(terms.map((term) => term.forceVelocityScale)),
      dLogAInf_dLambdaActMean: meanNumbers(terms.map((term) => term.dLogAInf_dLambdaAct)),
      dLogFIso_dLambdaActMean: meanNumbers(terms.map((term) => term.dLogFIso_dLambdaAct)),
      dLogGOver_dLambdaRawMean: meanNumbers(terms.map((term) => term.dLogGOver_dLambdaRaw)),
      dLogCompositeActive_dLambdaActMean: meanNumbers(terms.map((term) => term.dLogCompositeActive_dLambdaAct)),
      lambdaActMinusRawMean: meanNumbers(terms.map((term) => term.lambdaActMinusRaw)),
      dLogAInf_dLambdaMean: meanNumbers(terms.map((term) => term.dLogAInf_dLambda)),
      dLogFIso_dLambdaMean: meanNumbers(terms.map((term) => term.dLogFIso_dLambda)),
      dLogGOver_dLambdaMean: meanNumbers(terms.map((term) => term.dLogGOver_dLambda)),
      dLogCompositeActive_dLambdaMean: meanNumbers(terms.map((term) => term.dLogCompositeActive_dLambda)),
      lowStretchLimiterGateMean: meanNumbers(terms.map((term) => term.lowStretchLimiterGate)),
      aInfRawMean: meanNumbers(terms.map((term) => term.aInfRaw)),
      aInfCapMean: meanNumbers(terms.map((term) => term.aInfCap)),
      aInfLimiterDeltaMean: meanNumbers(terms.map((term) => term.aInfLimiterDelta)),
      activeTargetLimiterMean: meanNumbers(terms.map((term) => term.activeTargetLimiter)),
      activeTargetLimiterMin: Math.min(...terms.map((term) => term.activeTargetLimiter).filter(Number.isFinite)),
      activeTargetLimiterHitFraction: meanNumbers(terms.map((term) => term.activeTargetLimiter < 0.999 ? 1 : 0)),
      sigmaActTargetRawMean: meanNumbers(terms.map((term) => term.sigmaActTargetRaw)),
      sigmaActTargetRawMax: Math.max(...terms.map((term) => term.sigmaActTargetRaw).filter(Number.isFinite)),
      sigmaActTargetMax: Math.max(...terms.map((term) => term.sigmaActTarget).filter(Number.isFinite)),
      sigmaActTargetReductionFractionMean: meanNumbers(terms.map((term) => {
        const raw = Math.max(term.sigmaActTargetRaw, 1e-9);
        return Math.max(0, term.sigmaActTargetRaw - term.sigmaActTarget) / raw;
      })),
      pressureFloorHitFraction: meanNumbers(terms.map((term) => term.pressureFloorHit01)),
    };
  }
  return out;
}

function summarizeValves(samples: SimSample[]): Record<"MV" | "AoV" | "TV" | "PV", ValveTraceSummary> {
  return {
    MV: valveSummary(samples, "QMV"),
    AoV: valveSummary(samples, "QAo"),
    TV: valveSummary(samples, "QTV"),
    PV: valveSummary(samples, "QPV"),
  };
}

function valveSummary(samples: SimSample[], key: keyof SimSample): ValveTraceSummary {
  const values = samples.map((sample) => Number(sample[key]));
  return {
    minQ: Math.min(...values),
    maxQ: Math.max(...values),
    forwardVolumeMl: integratePositive(samples, key),
    reverseVolumeMl: integrateNegativeMagnitude(samples, key),
    negativeSampleCount: values.filter((value) => value < -1e-9).length,
  };
}

function summarizePoints(points: DebugPoint[]): DebugSummary {
  const maxValveReverseMl = Math.max(0, ...points.flatMap((p) => [
    p.valveVolumesMl.MVReverse,
    p.valveVolumesMl.AoVReverse,
    p.valveVolumesMl.TVReverse,
    p.valveVolumesMl.PVReverse,
    p.valveTrace.MV.reverseVolumeMl,
    p.valveTrace.AoV.reverseVolumeMl,
    p.valveTrace.TV.reverseVolumeMl,
    p.valveTrace.PV.reverseVolumeMl,
  ]));
  return {
    pointCount: points.length,
    period2Count: points.filter((p) => p.settle.periodBeats === 2).length,
    maxAdjacentDelta: Math.max(0, ...points.map((p) => p.settle.adjacentDelta)),
    maxPeriodDelta: Math.max(0, ...points.map((p) => p.settle.periodDelta)),
    maxValveReverseMl,
    maxClampHitCount: Math.max(0, ...points.map((p) => p.health.clampHitCount)),
    maxAbsReturnMapSlopeEDVL: Math.max(0, ...points.map((p) => p.returnMap.features.EDV_L?.absCentralSlope ?? 0)),
    maxAbsTwoBeatReturnMapSlopeEDVL: Math.max(0, ...points.map((p) => p.returnMap.twoBeatSamePhase?.features.EDV_L?.absCentralSlope ?? 0)),
    maxAbsReturnMapSlopeESVL: Math.max(0, ...points.map((p) => p.returnMap.features.ESV_L?.absCentralSlope ?? 0)),
    maxAbsTwoBeatReturnMapSlopeESVL: Math.max(0, ...points.map((p) => p.returnMap.twoBeatSamePhase?.features.ESV_L?.absCentralSlope ?? 0)),
    maxAbsReturnMapSlopeCOL: Math.max(0, ...points.map((p) => p.returnMap.features.CO_L?.absCentralSlope ?? 0)),
    maxAbsTwoBeatReturnMapSlopeCOL: Math.max(0, ...points.map((p) => p.returnMap.twoBeatSamePhase?.features.CO_L?.absCentralSlope ?? 0)),
    maxAbsReturnMapSlopeQAoMax: Math.max(0, ...points.map((p) => p.returnMap.features.QAoMax?.absCentralSlope ?? 0)),
    maxAbsTwoBeatReturnMapSlopeQAoMax: Math.max(0, ...points.map((p) => p.returnMap.twoBeatSamePhase?.features.QAoMax?.absCentralSlope ?? 0)),
    maxAbsReturnMapSlopeAoPMax: Math.max(0, ...points.map((p) => p.returnMap.features.AoPMax?.absCentralSlope ?? 0)),
    maxAbsTwoBeatReturnMapSlopeAoPMax: Math.max(0, ...points.map((p) => p.returnMap.twoBeatSamePhase?.features.AoPMax?.absCentralSlope ?? 0)),
    maxBranchAmplitudeCOL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitude.CO_L ?? 0)),
    maxBranchAmplitudeFractionCOL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitudeFraction.CO_L ?? 0)),
    maxBranchAmplitudeEDVL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitude.EDV_L ?? 0)),
    maxBranchAmplitudeFractionEDVL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitudeFraction.EDV_L ?? 0)),
    maxBranchAmplitudeESVL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitude.ESV_L ?? 0)),
    maxBranchAmplitudeFractionESVL: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitudeFraction.ESV_L ?? 0)),
    maxBranchAmplitudeQAoMax: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitude.QAoMax ?? 0)),
    maxBranchAmplitudeFractionQAoMax: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitudeFraction.QAoMax ?? 0)),
    maxBranchAmplitudeAoPMax: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitude.AoPMax ?? 0)),
    maxBranchAmplitudeFractionAoPMax: Math.max(0, ...points.map((p) => p.returnMap.branchAmplitudeFraction.AoPMax ?? 0)),
    maxQAoCapRatioMax: Math.max(0, ...points.flatMap((p) => p.beatTrace.map((beat) => beat.QAoCapRatioMax))),
    maxQAoNearCap90Fraction: Math.max(0, ...points.flatMap((p) => p.beatTrace.map((beat) => beat.QAoNearCap90Fraction))),
    maxQAoNearCap95Fraction: Math.max(0, ...points.flatMap((p) => p.beatTrace.map((beat) => beat.QAoNearCap95Fraction))),
    maxQAoNearCap98Fraction: Math.max(0, ...points.flatMap((p) => p.beatTrace.map((beat) => beat.QAoNearCap98Fraction))),
    maxQAoAtCapFraction: Math.max(0, ...points.flatMap((p) => p.beatTrace.map((beat) => beat.QAoAtCapFraction))),
    maxQAoLocalCapActiveFraction: Math.max(0, ...points.flatMap((p) => p.beatTrace.map((beat) => beat.QAoLocalCapActiveFraction))),
    minMVAForwardMl: finiteMin(points.map((p) => representativeFilling(p)?.MV_A_forward_mL ?? Number.NaN)),
    minMVAFraction: finiteMin(points.map((p) => representativeFilling(p)?.MV_A_fraction ?? Number.NaN)),
    minLAAloopArea: finiteMin(points.map((p) => representativeFilling(p)?.LA_A_loop_area ?? Number.NaN)),
    minLAAloopFraction: finiteMin(points.map((p) => representativeFilling(p)?.LA_A_loop_fraction ?? Number.NaN)),
    maxAtrialSystoleTransmitralGradientMean: Math.max(0, ...points.map((p) => representativeFilling(p)?.atrialSystoleTransmitralGradientMean ?? 0)),
    maxAtrialSystoleTransmitralGradientMax: Math.max(0, ...points.map((p) => representativeFilling(p)?.atrialSystoleTransmitralGradientMax ?? 0)),
    minAtrialSystoleMVOpenFraction: finiteMin(points.map((p) => representativeFilling(p)?.atrialSystoleMVOpenFraction ?? Number.NaN)),
    nodeClampHits: mergeCountRecords(points.map((p) => p.clampDiagnostics.nodeClampHits)),
    dynamicFlowClampHits: mergeCountRecords(points.map((p) => p.clampDiagnostics.dynamicFlowClampHits)),
    valveDiodeClampHits: mergeCountRecords(points.map((p) => p.clampDiagnostics.valveDiodeClampHits)),
    maxSanitizeAbsMl: Math.max(0, ...points.map((p) => p.tbvAudit.sanitizeAbsMl)),
    maxProjectionAppliedMl: Math.max(0, ...points.map((p) => p.tbvAudit.projectionAbsAppliedMl)),
    contaminatedPointCount: points.filter((p) => p.tbvAudit.classification === "contaminated").length,
  };
}

function metricSummary(m: SimMetrics): MetricSummary {
  return {
    LAPMean: m.LAPMean,
    RAPMean: m.RAPMean,
    CO_L: m.CO_L,
    CO_R: m.CO_R,
    pulmonaryVenousReturnLMin: m.pulmonaryVenousReturnLMin,
    systemicVenousReturnLMin: m.systemicVenousReturnLMin,
    SV_L: m.SV_L,
    SV_R: m.SV_R,
    LVEDPApprox: m.LVEDPApprox,
    RVEDPApprox: m.RVEDPApprox,
  };
}

function integratePositive(samples: SimSample[], key: keyof SimSample): number {
  return integrateFlow(samples, key, (value) => Math.max(0, value));
}

function integrateNegativeMagnitude(samples: SimSample[], key: keyof SimSample): number {
  return integrateFlow(samples, key, (value) => Math.max(0, -value));
}

function integrateFlow(samples: SimSample[], key: keyof SimSample, project: (value: number) => number): number {
  if (samples.length < 2) return 0;
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    area += 0.5 * dt * (project(Number(samples[i][key])) + project(Number(samples[i - 1][key])));
  }
  return area;
}

function mergeCountRecords(records: Partial<Record<string, number>>[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) out[key] = (out[key] ?? 0) + (value ?? 0);
  }
  return out;
}

function appendRecordTable(lines: string[], record: Record<string, number>): void {
  const entries = Object.entries(record).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    lines.push("");
    lines.push("_none_");
    lines.push("");
    return;
  }
  lines.push("");
  lines.push("| name | count |");
  lines.push("| --- | ---: |");
  for (const [key, value] of entries) lines.push(`| ${key} | ${value} |`);
  lines.push("");
}

function topRecord(record: Partial<Record<string, number>>, limit = 3): string {
  const entries = Object.entries(record)
    .filter(([, value]) => Number.isFinite(value) && Math.abs(value ?? 0) > 0)
    .sort((a, b) => Math.abs(b[1] ?? 0) - Math.abs(a[1] ?? 0))
    .slice(0, limit);
  if (entries.length === 0) return "";
  return entries.map(([key, value]) => `${key}:${round(value ?? 0, 4)}`).join(", ");
}

function maxValveReverse(p: DebugPoint): number {
  return Math.max(
    p.valveVolumesMl.MVReverse,
    p.valveVolumesMl.AoVReverse,
    p.valveVolumesMl.TVReverse,
    p.valveVolumesMl.PVReverse,
    p.valveTrace.MV.reverseVolumeMl,
    p.valveTrace.AoV.reverseVolumeMl,
    p.valveTrace.TV.reverseVolumeMl,
    p.valveTrace.PV.reverseVolumeMl,
  );
}

function representativeFilling(p: DebugPoint): FillingRegimeSummary | undefined {
  return p.beatTrace.at(-1)?.filling;
}

function returnMapSlope(p: DebugPoint, key: keyof ReturnMapDiagnostic["features"]): number {
  return p.returnMap.features[key]?.centralSlope ?? Number.NaN;
}

function twoBeatReturnMapSlope(p: DebugPoint, key: keyof ReturnMapDiagnostic["features"]): number {
  return p.returnMap.twoBeatSamePhase?.features[key]?.centralSlope ?? Number.NaN;
}

function modeTwoBeatSlope(p: DebugPoint, mode: ReturnMapModeKey, key: ReturnMapFeatureKey): number {
  return p.returnMap.modes[mode]?.twoBeatSamePhase?.features[key]?.centralSlope ?? Number.NaN;
}

function meanNumbers(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((acc, value) => acc + value, 0) / finite.length;
}

function finiteMin(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.min(...finite) : Number.NaN;
}

export function parseLowPreloadDebugArgs(args: string[]): DebugOptions {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const opts: DebugOptions = {
    outDir: path.join("artifacts", "starling-low-preload-debug", timestamp),
    targetVolumeMl: 5600,
    heartModel: DEFAULT_HEART_MODEL,
    deltasMl: DEFAULT_DELTAS,
    dtValues: DEFAULT_DT_VALUES,
    lambdaActTauSecValues: DEFAULT_LAMBDA_ACT_TAU_SEC_VALUES,
    lambdaActScope: DEFAULT_LAMBDA_ACT_SCOPE,
    lambdaActTerms: DEFAULT_LAMBDA_ACT_TERMS,
    lowStretchLimiterMode: DEFAULT_LOW_STRETCH_LIMITER_MODE,
    lowStretchLimiterScope: DEFAULT_LOW_STRETCH_LIMITER_SCOPE,
    tensionScope: DEFAULT_TENSION_SCOPE,
    activeReservePreset: DEFAULT_ACTIVE_RESERVE_PRESET,
    traceBeats: 10,
    sampleHz: DEFAULT_SAMPLE_HZ,
    returnMapMode: DEFAULT_RETURN_MAP_MODE,
    beatPairOverlay: false,
    quietClampLog: false,
    tbvCorrectionMode: DEFAULT_TBV_CORRECTION_MODE,
    aorticFlowClampMode: DEFAULT_AORTIC_FLOW_CLAMP_MODE,
    tensionRiseSec: 0,
    tensionFallSec: 0,
    aovQDotClamp: DEFAULT_AOV_Q_DOT_CLAMP,
    aovQDotClampNegative: DEFAULT_AOV_Q_DOT_CLAMP,
    qDotClampScope: DEFAULT_Q_DOT_CLAMP_SCOPE,
    aovQUpdateMode: "current-loss",
  };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--out" && value) opts.outDir = value;
    else if (key === "--target-volume" && value) opts.targetVolumeMl = Number(value);
    else if (key === "--heart-model" && value) opts.heartModel = parseHeartModel(value);
    else if (key === "--deltas" && value) opts.deltasMl = parseNumberList(value);
    else if (key === "--dt" && value) opts.dtValues = parseNumberList(value);
    else if (key === "--lambda-act-tau" && value) opts.lambdaActTauSecValues = parseNumberList(value);
    else if (key === "--lambda-act-scope" && value) opts.lambdaActScope = parseLambdaActScope(value);
    else if (key === "--lambda-act-terms" && value) opts.lambdaActTerms = parseLambdaActTerms(value);
    else if (key === "--low-stretch-limiter" && value) opts.lowStretchLimiterMode = parseLowStretchLimiterMode(value);
    else if (key === "--low-stretch-limiter-scope" && value) opts.lowStretchLimiterScope = parseLambdaActScope(value);
    else if (key === "--tension-scope" && value) opts.tensionScope = parseLambdaActScope(value);
    else if (key === "--active-reserve-preset" && value) opts.activeReservePreset = parseActiveReservePreset(value);
    else if (key === "--return-map-mode" && value) opts.returnMapMode = parseReturnMapMode(value);
    else if (key === "--branch-only") opts.returnMapMode = "none";
    else if (key === "--beat-pair-overlay") opts.beatPairOverlay = true;
    else if (key === "--max-return-map-points" && value) opts.maxReturnMapPoints = Math.max(0, Math.floor(Number(value)));
    else if (key === "--return-map-deltas" && value) opts.returnMapDeltasMl = parseNumberList(value);
    else if (key === "--tbv-correction" && value) opts.tbvCorrectionMode = parseTBVCorrectionMode(value);
    else if (key === "--aortic-flow-clamp" && value) opts.aorticFlowClampMode = parseAorticFlowClampMode(value);
    else if (key === "--aov-b" && value) opts.aovB = finitePositiveOrDefault(Number(value), DEFAULT_AOV_B);
    else if (key === "--as-aov-amax" && value) opts.aovAmax = finitePositiveOrDefault(Number(value), DEFAULT_AOV_AMAX);
    else if (key === "--aov-l" && value) opts.aovL = finitePositiveOrDefault(Number(value), DEFAULT_AOV_L);
    else if (key === "--aov-tau-open" && value) opts.aovTauOpen = finitePositiveOrDefault(Number(value), DEFAULT_AOV_TAU_OPEN);
    else if (key === "--aov-tau-close" && value) opts.aovTauClose = finitePositiveOrDefault(Number(value), DEFAULT_AOV_TAU_CLOSE);
    else if (key === "--systemic-resistance" && value) opts.systemicResistance = finitePositiveOrDefault(Number(value), DEFAULT_SYSTEMIC_RESISTANCE);
    else if (key === "--arterial-stiffness" && value) opts.arterialStiffness = finitePositiveOrDefault(Number(value), DEFAULT_ARTERIAL_STIFFNESS);
    else if (key === "--tension-rise" && value) opts.tensionRiseSec = Math.max(0, Number(value));
    else if (key === "--tension-fall" && value) opts.tensionFallSec = Math.max(0, Number(value));
    else if (key === "--aov-qdot-clamp" && value) opts.aovQDotClamp = finitePositiveOrDefault(Number(value), DEFAULT_AOV_Q_DOT_CLAMP);
    else if (key === "--aov-qdot-clamp-negative" && value) opts.aovQDotClampNegative = finitePositiveOrDefault(Number(value), opts.aovQDotClamp ?? DEFAULT_AOV_Q_DOT_CLAMP);
    else if (key === "--qdot-clamp-scope" && value) opts.qDotClampScope = parseDynamicQDotClampScope(value);
    else if (key === "--aov-q-update" && value) opts.aovQUpdateMode = parseAorticValveQUpdateMode(value);
    else if (key === "--quiet-clamp-log") opts.quietClampLog = true;
    else if (key === "--trace-beats" && value) opts.traceBeats = Math.max(2, Math.floor(Number(value)));
    else if (key === "--sample-hz" && value) opts.sampleHz = Math.max(20, Math.floor(Number(value)));
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function parseAorticFlowClampMode(value: string): AorticFlowClampMode {
  if (isAorticFlowClampMode(value)) return value;
  throw new Error(`Invalid AoV flow clamp mode: ${value}`);
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

function parseTBVCorrectionMode(value: string): TBVCorrectionMode {
  if (value === "on" || value === "off" || value === "low") return value;
  throw new Error(`Invalid TBV correction mode: ${value}`);
}

function parseHeartModel(value: string): HeartModelMode {
  if (value === "activeStress" || value === "elastance") return value;
  throw new Error(`Invalid heart model: ${value}`);
}

function parseReturnMapMode(value: string): ReturnMapModeOption {
  if (value === "none" || value === "fixed" || value === "reset" || value === "both") return value;
  throw new Error(`Invalid return-map mode: ${value}`);
}

function parseLambdaActScope(value: string): LambdaActScope {
  if (value === "lv" || value === "ventricles" || value === "all") return value;
  throw new Error(`Invalid lambdaAct scope: ${value}`);
}

function parseDynamicQDotClampScope(value: string): DynamicQDotClampScope {
  if (value === "aov" || value === "pv" || value === "semilunar" || value === "all-valves" || value === "all-dynamic") return value;
  throw new Error(`Invalid qDot clamp scope: ${value}`);
}

function parseLambdaActTerms(value: string): LambdaActTerms {
  if (value === "kd" || value === "fiso" || value === "kd+fiso") return value;
  throw new Error(`Invalid lambdaAct terms: ${value}`);
}

function parseLowStretchLimiterMode(value: string): LowStretchLimiterMode {
  if (value === "none" || value === "aInfCap" || value === "activeReserveCap" || value === "fIsoSlopeRelax") return value;
  throw new Error(`Invalid low-stretch limiter mode: ${value}`);
}

function parseActiveReservePreset(value: string): ActiveReservePreset {
  if (
    value === "none"
    || value === "directMild"
    || value === "directMedium"
    || value === "thresholdMild"
    || value === "thresholdMedium"
  ) {
    return value;
  }
  throw new Error(`Invalid active reserve preset: ${value}`);
}

function parseNumberList(value: string): number[] {
  return value.split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
}

function finitePositiveOrDefault(value: number | undefined, fallback: number): number {
  return value != null && Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseAorticValveQUpdateMode(value: string): AorticValveQUpdateMode {
  if (value === "current-loss" || value === "qnext-loss" || value === "substep-2" || value === "substep-4") return value;
  throw new Error(`Invalid AoV q-update mode: ${value}`);
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run debug:starling-low-preload -- [--out=DIR] [--target-volume=5600]",
    "       [--heart-model=activeStress|elastance]",
    "       [--deltas=0,-900,-1000,-1100] [--dt=0.001,0.0005,0.002] [--lambda-act-tau=0,0.15,0.25,0.4]",
    "       [--lambda-act-scope=lv|ventricles|all] [--lambda-act-terms=kd|fiso|kd+fiso] [--tension-scope=lv|ventricles|all]",
    "       [--low-stretch-limiter=none|aInfCap|activeReserveCap|fIsoSlopeRelax] [--low-stretch-limiter-scope=lv|ventricles|all]",
    "       [--active-reserve-preset=directMild|directMedium|thresholdMild|thresholdMedium]",
    "       [--return-map-mode=none|fixed|reset|both] [--branch-only]",
    "       [--beat-pair-overlay]",
    "       [--tbv-correction=on|off|low]",
    "       [--aortic-flow-clamp=hard|soft-tanh|soft-rational|local-c1-0.95|local-c2-0.98]",
    "       [--aov-b=0.000001] [--as-aov-amax=1.5] [--aov-l=0.00025]",
    "       [--aov-tau-open=0.006] [--aov-tau-close=0.008] [--systemic-resistance=1] [--arterial-stiffness=0.75]",
    "       [--tension-rise=0.02] [--tension-fall=0.08] [--aov-qdot-clamp=40000] [--aov-qdot-clamp-negative=80000] [--qdot-clamp-scope=aov|pv|semilunar|all-valves|all-dynamic] [--aov-q-update=current-loss|qnext-loss|substep-2|substep-4]",
    "       [--max-return-map-points=4] [--quiet-clamp-log] [--trace-beats=10] [--sample-hz=120]",
    "",
    "Examples:",
    "  npm run debug:starling-low-preload",
    "  npm run debug:starling-low-preload -- --out=artifacts/starling-low-preload-debug/manual",
    "  npm run debug:starling-low-preload -- --dt=0.001 --deltas=0,-1250 --trace-beats=4",
    "  npm run debug:starling-low-preload -- --deltas=0,-1200,-1250 --dt=0.001,0.0005 --lambda-act-tau=0,0.15,0.25,0.4",
    "  npm run debug:starling-low-preload -- --branch-only --quiet-clamp-log --deltas=0,-1250,-1400",
  ].join("\n"));
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

function main(): void {
  const options = parseLowPreloadDebugArgs(process.argv.slice(2));
  mkdirSync(options.outDir, { recursive: true });
  const report = runLowPreloadDebug(options);
  writeFileSync(path.join(options.outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(path.join(options.outDir, "report.md"), reportToMarkdown(report));
  writeFileSync(path.join(options.outDir, "beat-trace.csv"), reportToCsv(report));
  if (report.beatPairOverlay) {
    writeFileSync(path.join(options.outDir, "beat-pair-overlay.csv"), reportToBeatPairOverlayCsv(report));
    writeFileSync(path.join(options.outDir, "beat-pair-overlay-summary.csv"), reportToBeatPairOverlaySummaryCsv(report));
  }

  // eslint-disable-next-line no-console
  console.log(`Wrote Starling low-preload debug report to ${options.outDir}`);
  // eslint-disable-next-line no-console
  console.log(
    `points=${report.summary.pointCount} period2=${report.summary.period2Count} ` +
    `maxAdjacentDelta=${round(report.summary.maxAdjacentDelta, 4)} maxReverseMl=${round(report.summary.maxValveReverseMl, 6)}`,
  );
}

if (process.env.STARLING_LOW_PRELOAD_DEBUG_MAIN === "1") main();
