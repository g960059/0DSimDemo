import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import morphologyProtocol from "@/data/myocardium/protocols/pv-loop-morphology-quality-v1.json";
import morphologyTargets from "@/data/myocardium/targets/pv-loop-morphology-quality-v1.json";
import { caseDocumentToSimInstances } from "@/caseDoc";
import type { CaseDocument } from "@/caseDoc";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";
import { measureConverged } from "@/engine/measure";
import type { MeasureOptions, SteadyMeasurement } from "@/engine/measure";
import type { SimSample } from "@/engine/protocol";
import { OFFICIAL_CASES } from "@/officialCases";
import type { SimInstance } from "@/types";

export type PvLoopPhase =
  | "filling"
  | "atrial-kick"
  | "isovolumic-contraction"
  | "ejection"
  | "isovolumic-relaxation"
  | "transition"
  | "uncertain";

type Chamber = "LV" | "RV";
type MetricChamber = Chamber | "LV/RV";
type SamplingMode = "raw" | "uniformBeatGrid" | "eventAlignedCore" | "coarseSensitivity";
type TransitionPolicy = "transition-inclusive" | "transition-excluded-core";
type ValveName = "MV" | "AoV" | "TV" | "PV";

type CliOptions = {
  outDir: string;
  caseIds: string[];
};

export type AnalysisSample = {
  sourceIndex: number;
  tSec: number;
  theta: number;
  beatIndex: number;
  LVP: number;
  RVP: number;
  LAP: number;
  RAP: number;
  AoP: number;
  PAP: number;
  VLV: number;
  VRV: number;
  QMV: number;
  QAo: number;
  QTV: number;
  QPV: number;
  xiMV: number;
  xiAoV: number;
  xiTV: number;
  xiPV: number;
  aLA: number;
  aRA: number;
  ELV_active: number;
  ERV_active: number;
  LVPressureFloorHit01: number;
  RVPressureFloorHit01: number;
  MV_qDotRaw: number;
  MV_qDotPost: number;
  MV_qDotClampHit01: number;
  MV_qDotClampImpulse: number;
  MV_diodeImpulse: number;
  MV_flowClampImpulse: number;
  AoV_qDotRaw: number;
  AoV_qDotPost: number;
  AoV_qDotClampHit01: number;
  AoV_qDotClampImpulse: number;
  AoV_diodeImpulse: number;
  AoV_flowClampImpulse: number;
  TV_qDotRaw: number;
  TV_qDotPost: number;
  TV_qDotClampHit01: number;
  TV_qDotClampImpulse: number;
  TV_diodeImpulse: number;
  TV_flowClampImpulse: number;
  PV_qDotRaw: number;
  PV_qDotPost: number;
  PV_qDotClampHit01: number;
  PV_qDotClampImpulse: number;
  PV_diodeImpulse: number;
  PV_flowClampImpulse: number;
  perSampleValveDiodeClampHits: number;
  perSampleDynamicFlowClampHits: number;
  dLVPdt: number;
  dRVPdt: number;
  dVLVdt: number;
  dVRVdt: number;
};

type ClassifiedSample = AnalysisSample & {
  chamber: Chamber;
  samplingMode: SamplingMode;
  phase: PvLoopPhase;
  transitionReason: string;
};

type ValveEvent = {
  valve: ValveName;
  eventType: "open" | "close";
  timeSec: number;
  theta: number;
  beatIndex: number;
};

export type MetricRow = {
  caseId: string;
  branchId: string;
  branchName: string;
  beatIndex: number;
  chamber: MetricChamber;
  metricId: string;
  samplingMode: SamplingMode;
  transitionPolicy: TransitionPolicy;
  value: number | null;
  unit: string;
  samplingInvarianceDelta: number | null;
  classificationLabels: string[];
};

type PhaseSampleRow = {
  caseId: string;
  branchId: string;
  branchName: string;
  beatIndex: number;
  chamber: Chamber;
  samplingMode: SamplingMode;
  sampleIndex: number;
  timeSec: number;
  theta: number;
  pressurePa: number;
  volumeM3: number;
  dPressurePaPerSec: number;
  dVolumeM3PerSec: number;
  inletValveOpen01: number;
  outletValveOpen01: number;
  inletFlowM3PerSec: number;
  outletFlowM3PerSec: number;
  phaseLabel: PvLoopPhase;
  transitionReason: string;
  sourceSignalMask: string;
};

type ValveEventRow = {
  caseId: string;
  branchId: string;
  branchName: string;
  beatIndex: number;
  valve: ValveName;
  eventType: string;
  timeSec: number | null;
  theta: number | null;
  samplingMode: SamplingMode;
};

export type ClampEventRow = {
  caseId: string;
  branchId: string;
  branchName: string;
  beatIndex: number;
  chamber: Chamber | "both";
  signalId: string;
  eventType: string;
  timeSec: number | null;
  theta: number | null;
  value: number | null;
  granularity: "per-sample" | "per-beat-availability";
  availability: "available" | "unavailable";
  note: string;
};

type BranchSummary = {
  caseId: string;
  caseTitle: string;
  branchId: string;
  branchName: string;
  settle: {
    settled: boolean;
    reason: string;
    beats: number;
    actualSeconds: number;
  };
  metricCount: number;
  sampleCount: number;
  traceFile: string;
};

type DiagnosticRunResult = {
  summary: RunnerSummary;
  metricRows: MetricRow[];
  phaseRows: PhaseSampleRow[];
};

type RunnerSummary = {
  schemaVersion: 1;
  targetPackId: string;
  protocolId: string;
  claimBoundary: string;
  runnerVersion: string;
  generatedAt: string;
  command: string;
  measurementProfile: Record<string, unknown>;
  derivativeProfile: Record<string, unknown>;
  classificationProfile: typeof PV_LOOP_CLASSIFICATION_PROFILE;
  caseIds: string[];
  samplingModes: SamplingMode[];
  transitionPolicies: TransitionPolicy[];
  inputArtifactHashes: Record<string, string>;
  signalAvailability: Record<string, boolean>;
  guardrailResults: Array<{ id: string; status: "pass" | "warning"; note: string }>;
  morphologyEvidence: MorphologyEvidenceSummary;
  samplingInvarianceDelta: {
    max: number | null;
    rowCount: number;
    metricIds: string[];
  };
  branches: BranchSummary[];
  warnings: string[];
  errors: string[];
};

type EvidenceLane = "filling-limb" | "ejection-limb" | "sampling" | "signal-coverage";
type EvidenceStatus = "supported-correlation" | "insufficient-evidence";
type EvidenceConfidence = "low" | "medium";

export type MorphologyObservation = {
  id: string;
  lane: EvidenceLane;
  description: string;
  score: number;
  supportCount: number;
  metricIds: string[];
  supportingSignals: string[];
  missingSignals: string[];
  classificationLabels: string[];
};

export type RootCauseHypothesis = {
  id: string;
  lane: EvidenceLane;
  hypothesis: string;
  evidenceStatus: EvidenceStatus;
  confidence: EvidenceConfidence;
  score: number;
  observations: string[];
  supportingSignals: string[];
  missingSignals: string[];
  nextEvidence: string[];
};

type EvidenceGap = {
  id: string;
  lane: EvidenceLane;
  missingSignals: string[];
  note: string;
};

export type MorphologyEvidenceSummary = {
  scoringProfile: {
    fillingRoughnessMin: number;
    eventCorrelationMin: number;
    qDotClampHitFractionMin: number;
    valveChatterCountMin: number;
    pressureFloorHitFractionMin: number;
    ejectionSquarenessMin: number;
    ejectionPlateauFractionMin: number;
    incisuraPresenceScoreMax: number;
    samplingSensitiveDeltaMin: number;
    maxConfidence: EvidenceConfidence;
  };
  observations: MorphologyObservation[];
  rootCauseHypotheses: RootCauseHypothesis[];
  evidenceGaps: EvidenceGap[];
};

const RUNNER_VERSION = "pv-loop-morphology-quality-runner-v1";
const CLAIM_BOUNDARY = "diagnostic-only-no-model-change";
const TARGET_PACK_ID = "pv-loop-morphology-quality-v1";
const CASE_IDS = [
  "normal-sinus",
  "acute-anterior-mi",
  "systolic-heart-failure",
  "lv-failure-dobutamine",
];
const SAMPLING_MODES: SamplingMode[] = ["raw", "uniformBeatGrid", "eventAlignedCore", "coarseSensitivity"];
const TRANSITION_POLICIES: TransitionPolicy[] = ["transition-inclusive", "transition-excluded-core"];
const MMHG_TO_PA = 133.322387415;
const ML_TO_M3 = 1e-6;
const ML_PER_SEC_TO_M3_PER_SEC = 1e-6;
const ML_PER_SEC2_TO_M3_PER_SEC2 = 1e-6;
const TRANSITION_GUARD_SEC = 0.012;
const OPEN_THRESHOLD = 0.5;
const PARTIAL_OPEN_EPS = 0.05;
const PRESSURE_DERIVATIVE_EPS_PA_PER_SEC = 80;
const VOLUME_DERIVATIVE_EPS_M3_PER_SEC = 0.2e-6;
const MEASURE_DT_SEC = 0.001;
const MEASURE_DT_FLOOR_SEC = 1e-6;
const REQUESTED_SAMPLE_HZ = 240;
const RESOLVED_RAW_SAMPLE_HZ = resolvedRawSampleHz(MEASURE_DT_SEC, REQUESTED_SAMPLE_HZ);

export const PV_LOOP_CLASSIFICATION_PROFILE = {
  transitionGuardSec: TRANSITION_GUARD_SEC,
  valveOpenThreshold: OPEN_THRESHOLD,
  partialOpenEps: PARTIAL_OPEN_EPS,
  pressureDerivativeEpsPaPerSec: PRESSURE_DERIVATIVE_EPS_PA_PER_SEC,
  volumeDerivativeEpsM3PerSec: VOLUME_DERIVATIVE_EPS_M3_PER_SEC,
  atrialKickActivationOpen01: 0.15,
  atrialKickThetaLateMin: 0.78,
  atrialKickThetaEarlyMax: 0.08,
  roughnessArtifactMin: 2.5,
  kinkArtifactMinCount: 1,
  eventSensitiveHitFractionMin: 0.5,
  samplingSensitiveDeltaMin: 0.15,
  lvRvAsymmetryMin: 0.25,
  madOutlierMultiplier: 6,
  madOutlierMinAbs: 1e-9,
  slopeZeroAbsMax: 0.02,
  monotonicityViolationDVolumeMlPerSecMax: -0.5,
  ejectionSquarenessMin: 0.55,
  ejectionPlateauFractionMin: 0.45,
  ejectionCornerSharpnessMin: 1.5,
  incisuraPresenceScoreMax: 0.1,
  plateauSlopeScaleFraction: 0.12,
  topPressurePercentile: 0.75,
  cornerSharpnessNormalization: 6,
  medianPercentile: 0.5,
  qDotRawPostDivergenceMin: 1e-6,
  clampImpulseAbsMin: 1e-9,
  derivativeDtEpsSec: 1e-9,
  interpolationThetaSpanEps: 1e-9,
  measureDtFloorSec: MEASURE_DT_FLOOR_SEC,
  eOverAProxyDenominatorEps: 1e-9,
  lvRvAsymmetryDenominatorEps: 1e-9,
  normalizedDeltaDenominatorEps: 1e-9,
  limbSegmentLengthEps: 1e-9,
  pvLoopSlopeVolumeEpsMl: 1e-6,
  pressureSpanEpsMmHg: 1e-6,
  ejectionShapeScoreWeights: {
    plateauFraction: 0.55,
    cornerSharpness: 0.25,
    topCurvature: 0.2,
  },
} as const;

const ROOT_CAUSE_SCORING_PROFILE = {
  fillingRoughnessMin: PV_LOOP_CLASSIFICATION_PROFILE.roughnessArtifactMin,
  eventCorrelationMin: PV_LOOP_CLASSIFICATION_PROFILE.eventSensitiveHitFractionMin,
  qDotClampHitFractionMin: PV_LOOP_CLASSIFICATION_PROFILE.eventSensitiveHitFractionMin,
  valveChatterCountMin: 1,
  pressureFloorHitFractionMin: 0.01,
  ejectionSquarenessMin: PV_LOOP_CLASSIFICATION_PROFILE.ejectionSquarenessMin,
  ejectionPlateauFractionMin: PV_LOOP_CLASSIFICATION_PROFILE.ejectionPlateauFractionMin,
  incisuraPresenceScoreMax: PV_LOOP_CLASSIFICATION_PROFILE.incisuraPresenceScoreMax,
  samplingSensitiveDeltaMin: PV_LOOP_CLASSIFICATION_PROFILE.samplingSensitiveDeltaMin,
  maxConfidence: "medium" as const,
};

const DEFAULT_OUT_DIR = path.join(
  "artifacts",
  "myocardium",
  "pv-loop-morphology",
  new Date().toISOString().replace(/[:.]/g, "-"),
);

type ValveDiagnosticSpec = {
  valve: ValveName;
  chamber: Chamber;
  signalPrefix: "mv" | "aov" | "tv" | "pv";
  rawKey: keyof AnalysisSample;
  postKey: keyof AnalysisSample;
  clampHitKey: keyof AnalysisSample;
  clampImpulseKey: keyof AnalysisSample;
  diodeImpulseKey: keyof AnalysisSample;
  flowClampImpulseKey: keyof AnalysisSample;
};

const VALVE_DIAGNOSTIC_SPECS: ValveDiagnosticSpec[] = [
  {
    valve: "MV",
    chamber: "LV",
    signalPrefix: "mv",
    rawKey: "MV_qDotRaw",
    postKey: "MV_qDotPost",
    clampHitKey: "MV_qDotClampHit01",
    clampImpulseKey: "MV_qDotClampImpulse",
    diodeImpulseKey: "MV_diodeImpulse",
    flowClampImpulseKey: "MV_flowClampImpulse",
  },
  {
    valve: "AoV",
    chamber: "LV",
    signalPrefix: "aov",
    rawKey: "AoV_qDotRaw",
    postKey: "AoV_qDotPost",
    clampHitKey: "AoV_qDotClampHit01",
    clampImpulseKey: "AoV_qDotClampImpulse",
    diodeImpulseKey: "AoV_diodeImpulse",
    flowClampImpulseKey: "AoV_flowClampImpulse",
  },
  {
    valve: "TV",
    chamber: "RV",
    signalPrefix: "tv",
    rawKey: "TV_qDotRaw",
    postKey: "TV_qDotPost",
    clampHitKey: "TV_qDotClampHit01",
    clampImpulseKey: "TV_qDotClampImpulse",
    diodeImpulseKey: "TV_diodeImpulse",
    flowClampImpulseKey: "TV_flowClampImpulse",
  },
  {
    valve: "PV",
    chamber: "RV",
    signalPrefix: "pv",
    rawKey: "PV_qDotRaw",
    postKey: "PV_qDotPost",
    clampHitKey: "PV_qDotClampHit01",
    clampImpulseKey: "PV_qDotClampImpulse",
    diodeImpulseKey: "PV_diodeImpulse",
    flowClampImpulseKey: "PV_flowClampImpulse",
  },
];

function parseArgs(args: string[]): CliOptions {
  const outArg = args.find((arg) => arg.startsWith("--out="));
  const casesArg = args.find((arg) => arg.startsWith("--cases="));
  if (args.includes("--help")) {
    printHelp();
    process.exit(0);
  }
  const unknown = args.filter((arg) => (
    arg !== "--help" && !arg.startsWith("--out=") && !arg.startsWith("--cases=")
  ));
  if (unknown.length > 0) throw new Error(`Unknown arguments: ${unknown.join(", ")}`);
  return {
    outDir: outArg ? outArg.slice("--out=".length) : DEFAULT_OUT_DIR,
    caseIds: casesArg ? casesArg.slice("--cases=".length).split(",").filter(Boolean) : CASE_IDS,
  };
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npx vite-node tools/myocardium/verifyPvLoopMorphologyQuality.ts [--out=DIR] [--cases=id,id]",
    "",
    "Diagnostic-only PV-loop morphology runner. It writes artifacts under",
    "artifacts/myocardium/pv-loop-morphology/<timestamp>/ by default and does",
    "not change model equations, solver behavior, official cases, package scripts, or UI wiring.",
  ].join("\n"));
}

function resolvedRawSampleHz(dt: number, requestedSampleHz: number): number {
  return Math.max(requestedSampleHz, Math.ceil(1 / Math.max(dt, MEASURE_DT_FLOOR_SEC)));
}

function officialMeasureOptions(caseId: string, targetTBV: number): MeasureOptions {
  return {
    targetTBV,
    dt: MEASURE_DT_SEC,
    sampleHz: REQUESTED_SAMPLE_HZ,
    measureBeats: 3,
    settlePolicy: {
      ...DEFAULT_SETTLE_POLICY,
      tolShape: 0.25,
      ...(caseId === "lv-failure-dobutamine" ? { tolPrimary: 0.01 } : {}),
    },
    requireProjectorQuiet: false,
  };
}

export function buildInitialSummary(caseIds = CASE_IDS): RunnerSummary {
  const availability = signalAvailability();
  return {
    schemaVersion: 1,
    targetPackId: TARGET_PACK_ID,
    protocolId: morphologyProtocol.id,
    claimBoundary: CLAIM_BOUNDARY,
    runnerVersion: RUNNER_VERSION,
    generatedAt: new Date().toISOString(),
    command: process.argv.join(" "),
    measurementProfile: {
      dt: MEASURE_DT_SEC,
      requestedSampleHz: REQUESTED_SAMPLE_HZ,
      resolvedRawSampleHz: RESOLVED_RAW_SAMPLE_HZ,
      rawSampleIntervalSec: 1 / RESOLVED_RAW_SAMPLE_HZ,
      measureBeats: 3,
      settlePolicy: {
        base: "DEFAULT_SETTLE_POLICY",
        tolShape: 0.25,
        lvFailureDobutamineTolPrimary: 0.01,
      },
      requireProjectorQuiet: false,
    },
    derivativeProfile: {
      pressureDerivative: {
        stencil: "centered-neighbor-difference; endpoints use nearest available neighbor",
        inputUnit: "mmHg",
        outputUnit: "Pa/s",
      },
      volumeDerivative: {
        stencil: "centered-neighbor-difference; endpoints use nearest available neighbor",
        inputUnit: "mL",
        outputUnit: "m3/s",
      },
      transitionGuardSec: PV_LOOP_CLASSIFICATION_PROFILE.transitionGuardSec,
      valveOpenThreshold: PV_LOOP_CLASSIFICATION_PROFILE.valveOpenThreshold,
      partialOpenEps: PV_LOOP_CLASSIFICATION_PROFILE.partialOpenEps,
      pressureDerivativeEpsPaPerSec: PV_LOOP_CLASSIFICATION_PROFILE.pressureDerivativeEpsPaPerSec,
      volumeDerivativeEpsM3PerSec: PV_LOOP_CLASSIFICATION_PROFILE.volumeDerivativeEpsM3PerSec,
      resampling: {
        uniformBeatGrid: "linear interpolation by normalized beat phase theta at 240 samples/beat",
        coarseSensitivity: "linear interpolation by normalized beat phase theta at 60 samples/beat",
        eventAlignedCore: "raw samples with transition samples excluded",
      },
    },
    classificationProfile: PV_LOOP_CLASSIFICATION_PROFILE,
    caseIds,
    samplingModes: SAMPLING_MODES,
    transitionPolicies: TRANSITION_POLICIES,
    inputArtifactHashes: inputArtifactHashes(),
    signalAvailability: availability,
    guardrailResults: [
      {
        id: "diagnostic-only-no-model-change",
        status: "pass",
        note: "Runner reads official cases and emitted samples only; the diagnostic signal export exposes existing flow/qDot readouts without changing equations, solver behavior, case parameters, package scripts, or UI surfaces.",
      },
      {
        id: "package-scripts-no-change",
        status: "pass",
        note: "Runner is invoked directly with npx vite-node; no package.json script is required or claimed.",
      },
      {
        id: "raw-first",
        status: "pass",
        note: "Raw emitted samples are measured and written before resampling sensitivity modes.",
      },
      {
        id: "transition-dual-report",
        status: "pass",
        note: "Metric rows are emitted for transition-inclusive and transition-excluded-core policies.",
      },
      {
        id: "no-single-metric-pass",
        status: "pass",
        note: "Morphology values are diagnostic readouts only; only runner/measurement failures set a non-zero exit code.",
      },
    ],
    morphologyEvidence: buildMorphologyEvidenceSummary([], [], availability),
    samplingInvarianceDelta: {
      max: null,
      rowCount: 0,
      metricIds: [],
    },
    branches: [],
    warnings: [],
    errors: [],
  };
}

function inputArtifactHashes(): Record<string, string> {
  const files = [
    "docs/myocardium/verification/pv-loop-morphology-quality.md",
    "docs/myocardium/verification/filling-limb-artifact-audit-v1.md",
    "docs/myocardium/verification/arterial-load-morphology-v1.md",
    "data/myocardium/protocols/pv-loop-morphology-quality-v1.json",
    "data/myocardium/protocols/filling-limb-artifact-audit-v1.json",
    "data/myocardium/protocols/arterial-load-morphology-v1.json",
    "data/myocardium/targets/pv-loop-morphology-quality-v1.json",
  ];
  return Object.fromEntries(files.map((file) => [file, sha256File(file)]));
}

function sha256File(file: string): string {
  const bytes = readFileSync(path.join(process.cwd(), file));
  return createHash("sha256").update(bytes).digest("hex");
}

function signalAvailability(): Record<string, boolean> {
  return {
    timeSec: true,
    beatIndex: true,
    lvPressurePa: true,
    rvPressurePa: true,
    lvVolumeM3: true,
    rvVolumeM3: true,
    leftAtrialPressurePa: true,
    rightAtrialPressurePa: true,
    aorticPressurePa: true,
    pulmonaryArteryPressurePa: true,
    mitralValveOpen01: true,
    aorticValveOpen01: true,
    tricuspidValveOpen01: true,
    pulmonaryValveOpen01: true,
    mitralFlowM3PerSec: true,
    aorticFlowM3PerSec: true,
    tricuspidFlowM3PerSec: true,
    pulmonaryFlowM3PerSec: true,
    lvPressureFloorHit01: true,
    rvPressureFloorHit01: true,
    aovQDotRawM3PerSec2: true,
    aovQDotPostM3PerSec2: true,
    aovQDotClampHit01: true,
    aovQDotClampImpulseM3PerSec2: true,
    aovValveDiodeImpulseM3PerSec: true,
    aovDynamicFlowClampImpulseM3PerSec: true,
    mvQDotRawM3PerSec2: true,
    mvQDotPostM3PerSec2: true,
    mvQDotClampHit01: true,
    mvQDotClampImpulseM3PerSec2: true,
    mvValveDiodeImpulseM3PerSec: true,
    mvDynamicFlowClampImpulseM3PerSec: true,
    tvQDotRawM3PerSec2: true,
    tvQDotPostM3PerSec2: true,
    tvQDotClampHit01: true,
    tvQDotClampImpulseM3PerSec2: true,
    tvValveDiodeImpulseM3PerSec: true,
    tvDynamicFlowClampImpulseM3PerSec: true,
    pvQDotRawM3PerSec2: true,
    pvQDotPostM3PerSec2: true,
    pvQDotClampHit01: true,
    pvQDotClampImpulseM3PerSec2: true,
    pvValveDiodeImpulseM3PerSec: true,
    pvDynamicFlowClampImpulseM3PerSec: true,
    perSampleValveDiodeClampHits: true,
    perSampleDynamicFlowClampHits: true,
    systemicArterialPressurePa: false,
    downstreamPulmonaryArterialPressurePa: false,
    characteristicImpedancePaSecPerM3: false,
    arterialReflectionCoefficient: false,
    aorticRootComplianceM3PerPa: false,
    pulmonaryRootComplianceM3PerPa: false,
  };
}

function runCase(doc: CaseDocument): {
  metricRows: MetricRow[];
  phaseRows: PhaseSampleRow[];
  valveRows: ValveEventRow[];
  clampRows: ClampEventRow[];
  summaries: BranchSummary[];
  traceFiles: Array<{ file: string; rows: Record<string, unknown>[] }>;
} {
  const instances = caseDocumentToSimInstances(doc);
  const metricRows: MetricRow[] = [];
  const phaseRows: PhaseSampleRow[] = [];
  const valveRows: ValveEventRow[] = [];
  const clampRows: ClampEventRow[] = [];
  const summaries: BranchSummary[] = [];
  const traceFiles: Array<{ file: string; rows: Record<string, unknown>[] }> = [];

  for (const instance of instances) {
    const measurement = measureConverged(
      instance.params,
      officialMeasureOptions(doc.meta.id, instance.targetVolume),
    );
    const branch = analyzeBranch(doc, instance, measurement);
    metricRows.push(...branch.metricRows);
    phaseRows.push(...branch.phaseRows);
    valveRows.push(...branch.valveRows);
    clampRows.push(...branch.clampRows);
    summaries.push(branch.summary);
    traceFiles.push(branch.traceFile);
  }

  return { metricRows, phaseRows, valveRows, clampRows, summaries, traceFiles };
}

function analyzeBranch(
  doc: CaseDocument,
  instance: SimInstance,
  measurement: SteadyMeasurement,
): {
  metricRows: MetricRow[];
  phaseRows: PhaseSampleRow[];
  valveRows: ValveEventRow[];
  clampRows: ClampEventRow[];
  summary: BranchSummary;
  traceFile: { file: string; rows: Record<string, unknown>[] };
} {
  const rawBeats = completeBeatWindows(measurement.samples);
  const metricRows: MetricRow[] = [];
  const phaseRows: PhaseSampleRow[] = [];
  const valveRows: ValveEventRow[] = [];
  const clampRows: ClampEventRow[] = [];
  const traceRows: Record<string, unknown>[] = [];
  const base = {
    caseId: doc.meta.id,
    branchId: instance.id,
    branchName: instance.name,
  };

  rawBeats.forEach((beatSamples, localBeatIndex) => {
    const beatIndex = localBeatIndex + 1;
    const raw = toAnalysisSamples(beatSamples, beatIndex);
    const valveEvents = detectValveEvents(raw, beatIndex);
    for (const event of valveEvents) {
      valveRows.push({ ...base, ...event, samplingMode: "raw" });
    }

    const samplingSets: Record<SamplingMode, AnalysisSample[]> = {
      raw,
      uniformBeatGrid: resampleBeat(raw, beatIndex, 240),
      eventAlignedCore: raw,
      coarseSensitivity: resampleBeat(raw, beatIndex, 60),
    };
    const beatMetricRows: MetricRow[] = [];
    for (const samplingMode of SAMPLING_MODES) {
      for (const chamber of ["LV", "RV"] as const) {
        const events = valveEvents.filter((event) => valveBelongsToChamber(event.valve, chamber));
        const classified = samplingSets[samplingMode]
          .map((sample) => classifySample(sample, chamber, samplingMode, events));
        const phaseSource = samplingMode === "eventAlignedCore"
          ? classified.filter((sample) => sample.phase !== "transition")
          : classified;
        phaseRows.push(...phaseSource.map((sample, sampleIndex) => phaseSampleRow(base, sample, sampleIndex)));
        beatMetricRows.push(...metricRowsForBeat(base, phaseSource, chamber, samplingMode, measurement.metrics.HR));
      }
    }
    applyLvRvAsymmetryRows(beatMetricRows);
    applySamplingInvarianceDeltas(beatMetricRows);
    metricRows.push(...beatMetricRows);
    clampRows.push(...clampEventRows(base, raw, beatIndex));
    traceRows.push(...traceRowsForBeat(base, raw, valveEvents, beatIndex));
  });

  const traceFile = `${safeFileSegment(doc.meta.id)}__${safeFileSegment(instance.id)}.csv`;
  return {
    metricRows,
    phaseRows,
    valveRows,
    clampRows,
    summary: {
      caseId: doc.meta.id,
      caseTitle: doc.meta.title,
      branchId: instance.id,
      branchName: instance.name,
      settle: {
        settled: measurement.settleStatus.settled,
        reason: measurement.settleStatus.reason,
        beats: measurement.settleStatus.beats,
        actualSeconds: measurement.settleStatus.actualSeconds,
      },
      metricCount: metricRows.length,
      sampleCount: measurement.samples.length,
      traceFile: path.join("traces", traceFile),
    },
    traceFile: { file: traceFile, rows: traceRows },
  };
}

function completeBeatWindows(samples: SimSample[]): SimSample[][] {
  const groups = new Map<number, SimSample[]>();
  for (const sample of samples) {
    const beat = Math.floor(sample.phi);
    const group = groups.get(beat) ?? [];
    group.push(sample);
    groups.set(beat, group);
  }
  const complete = [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, beatSamples]) => beatSamples)
    .filter((beatSamples) => {
      if (beatSamples.length < 20) return false;
      const phases = beatSamples.map((sample) => phaseOf(sample));
      return Math.min(...phases) <= 0.08 && Math.max(...phases) >= 0.88;
    });
  return complete.length > 0 ? complete : [...groups.values()].filter((beatSamples) => beatSamples.length >= 20);
}

function toAnalysisSamples(samples: SimSample[], beatIndex: number): AnalysisSample[] {
  const rows = samples.map((sample, sourceIndex) => ({
    sourceIndex,
    tSec: sample.t,
    theta: phaseOf(sample),
    beatIndex,
    LVP: sample.LVP,
    RVP: sample.RVP,
    LAP: sample.LAP,
    RAP: sample.RAP,
    AoP: sample.AoP,
    PAP: sample.PAP,
    VLV: sample.VLV,
    VRV: sample.VRV,
    QMV: sample.QMV,
    QAo: sample.QAo,
    QTV: sample.QTV,
    QPV: sample.QPV,
    xiMV: sample.xiMV,
    xiAoV: sample.xiAoV,
    xiTV: sample.xiTV,
    xiPV: sample.xiPV,
    aLA: sample.aLA,
    aRA: sample.aRA,
    ELV_active: sample.ELV_active,
    ERV_active: sample.ERV_active,
    LVPressureFloorHit01: sample.LVPressureFloorHit01,
    RVPressureFloorHit01: sample.RVPressureFloorHit01,
    MV_qDotRaw: sample.MV_qDotRaw ?? 0,
    MV_qDotPost: sample.MV_qDotPost ?? 0,
    MV_qDotClampHit01: sample.MV_qDotClampHit01 ?? 0,
    MV_qDotClampImpulse: sample.MV_qDotClampImpulse ?? 0,
    MV_diodeImpulse: sample.MV_diodeImpulse ?? 0,
    MV_flowClampImpulse: sample.MV_flowClampImpulse ?? 0,
    AoV_qDotRaw: sample.AoV_qDotRaw,
    AoV_qDotPost: sample.AoV_qDotPost,
    AoV_qDotClampHit01: sample.AoV_qDotClampHit01,
    AoV_qDotClampImpulse: sample.AoV_qDotClampImpulse,
    AoV_diodeImpulse: sample.AoV_diodeImpulse,
    AoV_flowClampImpulse: sample.AoV_flowClampImpulse,
    TV_qDotRaw: sample.TV_qDotRaw ?? 0,
    TV_qDotPost: sample.TV_qDotPost ?? 0,
    TV_qDotClampHit01: sample.TV_qDotClampHit01 ?? 0,
    TV_qDotClampImpulse: sample.TV_qDotClampImpulse ?? 0,
    TV_diodeImpulse: sample.TV_diodeImpulse ?? 0,
    TV_flowClampImpulse: sample.TV_flowClampImpulse ?? 0,
    PV_qDotRaw: sample.PV_qDotRaw ?? 0,
    PV_qDotPost: sample.PV_qDotPost ?? 0,
    PV_qDotClampHit01: sample.PV_qDotClampHit01 ?? 0,
    PV_qDotClampImpulse: sample.PV_qDotClampImpulse ?? 0,
    PV_diodeImpulse: sample.PV_diodeImpulse ?? 0,
    PV_flowClampImpulse: sample.PV_flowClampImpulse ?? 0,
    perSampleValveDiodeClampHits: [
      sample.MV_diodeImpulse ?? 0,
      sample.AoV_diodeImpulse,
      sample.TV_diodeImpulse ?? 0,
      sample.PV_diodeImpulse ?? 0,
    ].filter((value) => Math.abs(value) > PV_LOOP_CLASSIFICATION_PROFILE.clampImpulseAbsMin).length,
    perSampleDynamicFlowClampHits: [
      sample.MV_flowClampImpulse ?? 0,
      sample.AoV_flowClampImpulse,
      sample.TV_flowClampImpulse ?? 0,
      sample.PV_flowClampImpulse ?? 0,
    ].filter((value) => Math.abs(value) > PV_LOOP_CLASSIFICATION_PROFILE.clampImpulseAbsMin).length,
    dLVPdt: 0,
    dRVPdt: 0,
    dVLVdt: 0,
    dVRVdt: 0,
  }));
  return withDerivatives(rows);
}

function withDerivatives(samples: AnalysisSample[]): AnalysisSample[] {
  return samples.map((sample, index) => {
    const prev = samples[Math.max(0, index - 1)];
    const next = samples[Math.min(samples.length - 1, index + 1)];
    const dt = Math.max(next.tSec - prev.tSec, PV_LOOP_CLASSIFICATION_PROFILE.derivativeDtEpsSec);
    return {
      ...sample,
      dLVPdt: (next.LVP - prev.LVP) / dt,
      dRVPdt: (next.RVP - prev.RVP) / dt,
      dVLVdt: (next.VLV - prev.VLV) / dt,
      dVRVdt: (next.VRV - prev.VRV) / dt,
    };
  });
}

function resampleBeat(samples: AnalysisSample[], beatIndex: number, count: number): AnalysisSample[] {
  if (samples.length === 0) return [];
  const fields: (keyof Omit<AnalysisSample, "sourceIndex" | "beatIndex">)[] = [
    "tSec", "theta", "LVP", "RVP", "LAP", "RAP", "AoP", "PAP", "VLV", "VRV",
    "QMV", "QAo", "QTV", "QPV", "xiMV", "xiAoV", "xiTV", "xiPV", "aLA", "aRA",
    "ELV_active", "ERV_active", "LVPressureFloorHit01", "RVPressureFloorHit01",
    "MV_qDotRaw", "MV_qDotPost", "MV_qDotClampHit01", "MV_qDotClampImpulse",
    "MV_diodeImpulse", "MV_flowClampImpulse",
    "AoV_qDotRaw", "AoV_qDotPost", "AoV_qDotClampHit01", "AoV_qDotClampImpulse",
    "AoV_diodeImpulse", "AoV_flowClampImpulse",
    "TV_qDotRaw", "TV_qDotPost", "TV_qDotClampHit01", "TV_qDotClampImpulse",
    "TV_diodeImpulse", "TV_flowClampImpulse",
    "PV_qDotRaw", "PV_qDotPost", "PV_qDotClampHit01", "PV_qDotClampImpulse",
    "PV_diodeImpulse", "PV_flowClampImpulse",
    "perSampleValveDiodeClampHits", "perSampleDynamicFlowClampHits",
    "dLVPdt", "dRVPdt", "dVLVdt", "dVRVdt",
  ];
  const phaseSamples = [...samples].sort((a, b) => a.theta - b.theta);
  const out: AnalysisSample[] = [];
  for (let i = 0; i < count; i++) {
    const theta = i / count;
    const row: Partial<AnalysisSample> = { sourceIndex: i, beatIndex };
    for (const field of fields) {
      row[field] = interpolateField(phaseSamples, theta, field);
    }
    row.theta = theta;
    out.push(row as AnalysisSample);
  }
  return withDerivatives(out);
}

function interpolateField(
  samples: AnalysisSample[],
  theta: number,
  field: keyof Omit<AnalysisSample, "sourceIndex" | "beatIndex">,
): number {
  if (samples.length === 1) return Number(samples[0][field]);
  let right = samples.findIndex((sample) => sample.theta >= theta);
  if (right === 0) return Number(samples[0][field]);
  if (right === -1) right = samples.length - 1;
  const left = Math.max(0, right - 1);
  const a = samples[left];
  const b = samples[right];
  const span = Math.max(b.theta - a.theta, PV_LOOP_CLASSIFICATION_PROFILE.interpolationThetaSpanEps);
  const frac = Math.max(0, Math.min(1, (theta - a.theta) / span));
  return Number(a[field]) + frac * (Number(b[field]) - Number(a[field]));
}

function detectValveEvents(samples: AnalysisSample[], beatIndex: number): ValveEvent[] {
  const valves: Array<{ valve: ValveName; key: keyof AnalysisSample }> = [
    { valve: "MV", key: "xiMV" },
    { valve: "AoV", key: "xiAoV" },
    { valve: "TV", key: "xiTV" },
    { valve: "PV", key: "xiPV" },
  ];
  const events: ValveEvent[] = [];
  for (const { valve, key } of valves) {
    for (let i = 1; i < samples.length; i++) {
      const prev = Number(samples[i - 1][key]);
      const cur = Number(samples[i][key]);
      if (prev < PV_LOOP_CLASSIFICATION_PROFILE.valveOpenThreshold && cur >= PV_LOOP_CLASSIFICATION_PROFILE.valveOpenThreshold) {
        events.push({ valve, eventType: "open", timeSec: samples[i].tSec, theta: samples[i].theta, beatIndex });
      } else if (prev >= PV_LOOP_CLASSIFICATION_PROFILE.valveOpenThreshold && cur < PV_LOOP_CLASSIFICATION_PROFILE.valveOpenThreshold) {
        events.push({ valve, eventType: "close", timeSec: samples[i].tSec, theta: samples[i].theta, beatIndex });
      }
    }
  }
  return events;
}

function valveBelongsToChamber(valve: ValveName, chamber: Chamber): boolean {
  return chamber === "LV" ? valve === "MV" || valve === "AoV" : valve === "TV" || valve === "PV";
}

function classifySample(
  sample: AnalysisSample,
  chamber: Chamber,
  samplingMode: SamplingMode,
  valveEvents: ValveEvent[],
): ClassifiedSample {
  const inletOpen = chamber === "LV" ? sample.xiMV : sample.xiTV;
  const outletOpen = chamber === "LV" ? sample.xiAoV : sample.xiPV;
  const dVdtM3 = (chamber === "LV" ? sample.dVLVdt : sample.dVRVdt) * ML_TO_M3;
  const dPdtPa = (chamber === "LV" ? sample.dLVPdt : sample.dRVPdt) * MMHG_TO_PA;
  const atrialActivation = chamber === "LV" ? sample.aLA : sample.aRA;
  const profile = PV_LOOP_CLASSIFICATION_PROFILE;
  const nearEvent = valveEvents.find((event) => Math.abs(event.timeSec - sample.tSec) <= profile.transitionGuardSec);
  const partialOpen = isPartialOpen(inletOpen) || isPartialOpen(outletOpen);
  if (nearEvent || partialOpen) {
    return {
      ...sample,
      chamber,
      samplingMode,
      phase: "transition",
      transitionReason: nearEvent
        ? `${nearEvent.valve}-${nearEvent.eventType}-within-${profile.transitionGuardSec}s`
        : "partial-valve-open01",
    };
  }
  if (!finiteInputs([inletOpen, outletOpen, dVdtM3, dPdtPa])) {
    return { ...sample, chamber, samplingMode, phase: "uncertain", transitionReason: "non-finite-evidence" };
  }
  if (
    inletOpen >= profile.valveOpenThreshold
    && outletOpen < profile.valveOpenThreshold
    && dVdtM3 > profile.volumeDerivativeEpsM3PerSec
  ) {
    const theta = sample.theta;
    const isAtrialKick = atrialActivation > profile.atrialKickActivationOpen01
      || theta >= profile.atrialKickThetaLateMin
      || theta <= profile.atrialKickThetaEarlyMax;
    return { ...sample, chamber, samplingMode, phase: isAtrialKick ? "atrial-kick" : "filling", transitionReason: "" };
  }
  if (
    outletOpen >= profile.valveOpenThreshold
    && inletOpen < profile.valveOpenThreshold
    && dVdtM3 < -profile.volumeDerivativeEpsM3PerSec
  ) {
    return { ...sample, chamber, samplingMode, phase: "ejection", transitionReason: "" };
  }
  if (
    inletOpen < profile.valveOpenThreshold
    && outletOpen < profile.valveOpenThreshold
    && dPdtPa > profile.pressureDerivativeEpsPaPerSec
  ) {
    return { ...sample, chamber, samplingMode, phase: "isovolumic-contraction", transitionReason: "" };
  }
  if (
    inletOpen < profile.valveOpenThreshold
    && outletOpen < profile.valveOpenThreshold
    && dPdtPa < -profile.pressureDerivativeEpsPaPerSec
  ) {
    return { ...sample, chamber, samplingMode, phase: "isovolumic-relaxation", transitionReason: "" };
  }
  return { ...sample, chamber, samplingMode, phase: "uncertain", transitionReason: "mixed-evidence" };
}

function isPartialOpen(value: number): boolean {
  return value > PV_LOOP_CLASSIFICATION_PROFILE.partialOpenEps
    && value < 1 - PV_LOOP_CLASSIFICATION_PROFILE.partialOpenEps;
}

export function classifyPvLoopPhaseForTest(sample: AnalysisSample, chamber: Chamber): PvLoopPhase {
  return classifySample(sample, chamber, "raw", []).phase;
}

export function metricRowsForSamplesForTest(samples: AnalysisSample[], hr = 75): MetricRow[] {
  const base = { caseId: "test-case", branchId: "test-branch", branchName: "Test branch" };
  const rows: MetricRow[] = [];
  for (const chamber of ["LV", "RV"] as const) {
    const classified = samples.map((sample) => classifySample(sample, chamber, "raw", []));
    rows.push(...metricRowsForBeat(base, classified, chamber, "raw", hr));
  }
  applyLvRvAsymmetryRows(rows);
  applySamplingInvarianceDeltas(rows);
  return rows;
}

function finiteInputs(values: number[]): boolean {
  return values.every(Number.isFinite);
}

function phaseSampleRow(
  base: { caseId: string; branchId: string; branchName: string },
  sample: ClassifiedSample,
  sampleIndex: number,
): PhaseSampleRow {
  const pressureMmHg = pressureOf(sample);
  const volumeMl = volumeOf(sample);
  return {
    ...base,
    beatIndex: sample.beatIndex,
    chamber: sample.chamber,
    samplingMode: sample.samplingMode,
    sampleIndex,
    timeSec: sample.tSec,
    theta: sample.theta,
    pressurePa: pressureMmHg * MMHG_TO_PA,
    volumeM3: volumeMl * ML_TO_M3,
    dPressurePaPerSec: dPressureMmHgPerSec(sample) * MMHG_TO_PA,
    dVolumeM3PerSec: dVolumeMlPerSec(sample) * ML_TO_M3,
    inletValveOpen01: inletOpen01(sample),
    outletValveOpen01: outletOpen01(sample),
    inletFlowM3PerSec: inletFlowMlPerSec(sample) * ML_PER_SEC_TO_M3_PER_SEC,
    outletFlowM3PerSec: outletFlowMlPerSec(sample) * ML_PER_SEC_TO_M3_PER_SEC,
    phaseLabel: sample.phase,
    transitionReason: sample.transitionReason,
    sourceSignalMask: sourceSignalMask(sample.chamber),
  };
}

function sourceSignalMask(chamber: Chamber): string {
  return chamber === "LV"
    ? "LVP,VLV,LAP,AoP,xiMV,xiAoV,QMV,QAo,LVPressureFloorHit01,MV_qDot*,AoV_qDot*,perSampleValveDiodeClampHits,perSampleDynamicFlowClampHits"
    : "RVP,VRV,RAP,PAP,xiTV,xiPV,QTV,QPV,RVPressureFloorHit01,TV_qDot*,PV_qDot*,perSampleValveDiodeClampHits,perSampleDynamicFlowClampHits";
}

function metricRowsForBeat(
  base: { caseId: string; branchId: string; branchName: string },
  samples: ClassifiedSample[],
  chamber: Chamber,
  samplingMode: SamplingMode,
  hr: number,
): MetricRow[] {
  const rows: MetricRow[] = [];
  for (const transitionPolicy of TRANSITION_POLICIES) {
    const add = (metricId: string, value: number | null, unit: string, labels: string[] = []) => {
      rows.push({
        ...base,
        beatIndex: samples[0]?.beatIndex ?? 0,
        chamber,
        metricId,
        samplingMode,
        transitionPolicy,
        value: finiteOrNull(value),
        unit,
        samplingInvarianceDelta: samplingMode === "raw" ? 0 : null,
        classificationLabels: labels,
      });
    };
    const policySamples = applyTransitionPolicy(samples, transitionPolicy);
    const policyOutlierSamples = morphologyOutlierSamples(policySamples);
    const filling = policySamples.filter((sample) => sample.phase === "filling" || sample.phase === "atrial-kick");
    const ejection = policySamples.filter((sample) => sample.phase === "ejection");
    const all = samples;

    for (const phase of [
      "filling",
      "atrial-kick",
      "isovolumic-contraction",
      "ejection",
      "isovolumic-relaxation",
      "transition",
      "uncertain",
    ] as PvLoopPhase[]) {
      add(`phaseCoverageFraction.${phase}`, fraction(all, (sample) => sample.phase === phase), "dimensionless");
    }
    add("transitionSampleFraction", fraction(all, (sample) => sample.phase === "transition"), "dimensionless");
    add("uncertainSampleFraction", fraction(all, (sample) => sample.phase === "uncertain"), "dimensionless");
    add("pvLoopArea", pvLoopAreaJ(policySamples), "Pa*m3");

    const fillingShape = limbShapeMetrics(filling);
    const ejectionLimbShape = limbShapeMetrics(ejection);
    const phaseNormalizedRoughness = Math.max(fillingShape.roughness, ejectionLimbShape.roughness);
    const phaseKinkCount = fillingShape.kinkCount + ejectionLimbShape.kinkCount;
    const eventCorrelation = eventCorrelationWindowHitFraction(policyOutlierSamples);
    add(
      "phaseNormalizedRoughness",
      phaseNormalizedRoughness,
      "dimensionless",
      phaseNormalizedRoughness > PV_LOOP_CLASSIFICATION_PROFILE.roughnessArtifactMin
        ? ["morphology-roughness"]
        : ["unclassified"],
    );
    add(
      "phaseKinkCount",
      phaseKinkCount,
      "countPerBeat",
      phaseKinkCount >= PV_LOOP_CLASSIFICATION_PROFILE.kinkArtifactMinCount
        ? ["morphology-kink"]
        : ["unclassified"],
    );
    add(
      "eventCorrelationWindowHitFraction",
      eventCorrelation,
      "dimensionless",
      eventCorrelation == null
        ? ["event-window-correlation", "no-morphology-outlier-samples"]
        : eventCorrelation >= PV_LOOP_CLASSIFICATION_PROFILE.eventSensitiveHitFractionMin
          ? ["event-window-correlation", "event-sensitive"]
          : ["event-window-correlation"],
    );
    add("openAvLowerLimbRoughness", fillingShape.roughness, "dimensionless", fillingLabels(fillingShape, transitionPolicy));
    add(chamber === "LV" ? "mvOpenLowerLimbRoughness" : "tvOpenLowerLimbRoughness", fillingShape.roughness, "dimensionless");
    add("lowerLimbDPDVSignChangeCount", fillingShape.signChangeCount, "countPerBeat");
    add("lowerLimbD2PDV2Integral", fillingShape.curvature, "dimensionless");
    add("lowerLimbKinkCount", fillingShape.kinkCount, "countPerBeat");
    add("lowerLimbMonotonicityViolationFraction", monotonicityViolationFraction(filling), "dimensionless");
    add("flowChatterCount", chatterCount(filling.map(inletFlowMlPerSec)), "countPerBeat");
    add("valveOpenCloseChatterCount", chatterCount(filling.map(inletOpen01)), "countPerBeat");
    add("pressureFloorHitFraction", fraction(filling, pressureFloorHit), "dimensionless");
    add("inletForwardVolume", integrateClassifiedFlow(filling, inletFlowMlPerSec, (flow) => Math.max(0, flow)), "mL");
    add("inletReverseVolume", integrateClassifiedFlow(filling, inletFlowMlPerSec, (flow) => Math.max(0, -flow)), "mL");
    add("EDV", maxOf(policySamples, volumeOf), "mL");
    add("SV", strokeVolumeMl(policySamples), "mL");
    add("CO", strokeVolumeMl(policySamples) * hr / 1000, "L/min");
    add("meanAtrialPressure", meanOf(policySamples, atrialPressureOf), "mmHg");
    add("EAInflowProxy", eOverAProxy(policySamples), "dimensionless");

    const ejectionShape = ejectionShapeMetrics(ejection);
    add("semilunarOpenEjectionSquareness", ejectionShape.squareness, "dimensionless", ejectionLabels(ejectionShape, chamber));
    add(chamber === "LV" ? "aovOpenEjectionSquareness" : "pvOpenEjectionSquareness", ejectionShape.squareness, "dimensionless");
    add("ejectionPlateauFraction", ejectionShape.plateauFraction, "dimensionless");
    add("ejectionTopCurvature", ejectionShape.topCurvature, "dimensionless");
    add("cornerSharpnessAtOpen", ejectionShape.cornerOpen, "dimensionless");
    add("cornerSharpnessAtClose", ejectionShape.cornerClose, "dimensionless");
    add("arterialPressureIncisuraDepth", ejectionShape.incisuraDepthPa, "Pa");
    add("incisuraPresenceScore", ejectionShape.incisuraScore, "dimensionless", incisuraLabels(ejectionShape.incisuraScore, chamber));
    add(chamber === "LV" ? "aovOpenAoPIncisuraScore" : "pvOpenPAPIncisuraScore", ejectionShape.incisuraScore, "dimensionless");
    add("peakPressureTimingAsFractionOfEjection", ejectionShape.peakPressureTimingFraction, "dimensionless");
    const outletQDotSpec = valveDiagnosticSpec(chamber === "LV" ? "AoV" : "PV");
    add("qDotClampHitFraction", fraction(ejection, (sample) => valveQDotClampHit(sample, outletQDotSpec)), "dimensionless");
    add("semilunarForwardVolume", integrateClassifiedFlow(ejection, outletFlowMlPerSec, (flow) => Math.max(0, flow)), "mL");
    add("semilunarReverseVolume", integrateClassifiedFlow(ejection, outletFlowMlPerSec, (flow) => Math.max(0, -flow)), "mL");
    add("strokeWork", pvLoopAreaJ(policySamples), "J");
    add("peakPressure", maxOf(policySamples, pressureOf), "mmHg");
  }
  return rows;
}

function applyTransitionPolicy(samples: ClassifiedSample[], policy: TransitionPolicy): ClassifiedSample[] {
  if (policy === "transition-inclusive") return samples.filter((sample) => sample.phase !== "uncertain");
  return samples.filter((sample) => sample.phase !== "transition" && sample.phase !== "uncertain");
}

function morphologyOutlierSamples(samples: ClassifiedSample[]): ClassifiedSample[] {
  const candidates = samples.filter((sample) => sample.phase !== "uncertain");
  if (candidates.length < 4) return [];
  const pressures = candidates.map(pressureOf);
  const volumes = candidates.map(volumeOf);
  const slopes: number[] = [];
  const slopeChanges: number[] = [];
  for (let i = 1; i < candidates.length; i++) {
    const dP = pressures[i] - pressures[i - 1];
    const dV = volumes[i] - volumes[i - 1];
    const slope = Math.abs(dV) > PV_LOOP_CLASSIFICATION_PROFILE.pvLoopSlopeVolumeEpsMl ? dP / dV : 0;
    const previousSlope = slopes.at(-1) ?? slope;
    slopes.push(slope);
    slopeChanges.push(Math.abs(slope - previousSlope));
  }
  return [...new Set(outlierIndices(slopeChanges).map((index) => candidates[Math.min(candidates.length - 1, index + 1)]))];
}

function eventCorrelationWindowHitFraction(outlierSamples: ClassifiedSample[]): number | null {
  if (outlierSamples.length === 0) return null;
  return fraction(outlierSamples, isEventArtifactWindowSample);
}

function isEventArtifactWindowSample(sample: ClassifiedSample): boolean {
  return sample.phase === "transition"
    || sample.transitionReason.includes("-within-")
    || sample.transitionReason === "partial-valve-open01"
    || pressureFloorHit(sample)
    || VALVE_DIAGNOSTIC_SPECS.some((spec) => spec.chamber === sample.chamber && valveDiagnosticEventHit(sample, spec));
}

function valveDiagnosticSpec(valve: ValveName): ValveDiagnosticSpec {
  const spec = VALVE_DIAGNOSTIC_SPECS.find((candidate) => candidate.valve === valve);
  if (!spec) throw new Error(`Unknown valve diagnostic spec: ${valve}`);
  return spec;
}

function valveQDotClampHit(sample: AnalysisSample, spec: ValveDiagnosticSpec): boolean {
  return Number(sample[spec.clampHitKey]) > 0
    || Math.abs(Number(sample[spec.rawKey]) - Number(sample[spec.postKey])) > PV_LOOP_CLASSIFICATION_PROFILE.qDotRawPostDivergenceMin;
}

function valveDiagnosticEventHit(sample: AnalysisSample, spec: ValveDiagnosticSpec): boolean {
  return valveQDotClampHit(sample, spec)
    || Math.abs(Number(sample[spec.clampImpulseKey])) > PV_LOOP_CLASSIFICATION_PROFILE.qDotRawPostDivergenceMin
    || Math.abs(Number(sample[spec.diodeImpulseKey])) > PV_LOOP_CLASSIFICATION_PROFILE.clampImpulseAbsMin
    || Math.abs(Number(sample[spec.flowClampImpulseKey])) > PV_LOOP_CLASSIFICATION_PROFILE.clampImpulseAbsMin;
}

function valveDiodeClampHitCount(sample: AnalysisSample): number {
  return VALVE_DIAGNOSTIC_SPECS.filter((spec) => (
    Math.abs(Number(sample[spec.diodeImpulseKey])) > PV_LOOP_CLASSIFICATION_PROFILE.clampImpulseAbsMin
  )).length;
}

function dynamicFlowClampHitCount(sample: AnalysisSample): number {
  return VALVE_DIAGNOSTIC_SPECS.filter((spec) => (
    Math.abs(Number(sample[spec.flowClampImpulseKey])) > PV_LOOP_CLASSIFICATION_PROFILE.clampImpulseAbsMin
  )).length;
}

function qDotMlPerSec2ToM3PerSec2(value: number): number {
  return value * ML_PER_SEC2_TO_M3_PER_SEC2;
}

function flowMlPerSecToM3PerSec(value: number): number {
  return value * ML_PER_SEC_TO_M3_PER_SEC;
}

function fillingLabels(
  shape: ReturnType<typeof limbShapeMetrics>,
  policy: TransitionPolicy,
): string[] {
  const labels: string[] = [];
  const hasArtifact = shape.roughness > PV_LOOP_CLASSIFICATION_PROFILE.roughnessArtifactMin
    || shape.kinkCount >= PV_LOOP_CLASSIFICATION_PROFILE.kinkArtifactMinCount;
  if (hasArtifact) labels.push("filling-limb-artifact");
  if (policy === "transition-inclusive" && hasArtifact) labels.push("transition-sensitive-candidate");
  if (labels.length === 0) labels.push("unclassified");
  return labels;
}

function ejectionLabels(shape: ReturnType<typeof ejectionShapeMetrics>, chamber: Chamber): string[] {
  const labels: string[] = [chamber === "LV" ? "aov-open-ejection" : "pv-open-ejection"];
  if (shape.squareness > PV_LOOP_CLASSIFICATION_PROFILE.ejectionSquarenessMin) labels.push("excessive-squareness");
  if (shape.plateauFraction > PV_LOOP_CLASSIFICATION_PROFILE.ejectionPlateauFractionMin) {
    labels.push(chamber === "LV" ? "flat-aop-during-ejection" : "flat-pap-during-ejection");
  }
  if (
    shape.cornerOpen > PV_LOOP_CLASSIFICATION_PROFILE.ejectionCornerSharpnessMin
    || shape.cornerClose > PV_LOOP_CLASSIFICATION_PROFILE.ejectionCornerSharpnessMin
  ) {
    labels.push("sharp-corner");
  }
  if (shape.incisuraScore != null && shape.incisuraScore <= PV_LOOP_CLASSIFICATION_PROFILE.incisuraPresenceScoreMax) {
    labels.push(chamber === "LV" ? "aop-lacks-incisura" : "pap-lacks-incisura");
  }
  return labels;
}

function incisuraLabels(score: number | null, chamber: Chamber): string[] {
  if (score == null) return ["no-ejection-evidence"];
  return score <= PV_LOOP_CLASSIFICATION_PROFILE.incisuraPresenceScoreMax
    ? [chamber === "LV" ? "aop-lacks-incisura" : "pap-lacks-incisura"]
    : ["incisura-present"];
}

function limbShapeMetrics(samples: ClassifiedSample[]): {
  roughness: number;
  signChangeCount: number;
  curvature: number;
  kinkCount: number;
  outlierSamples: ClassifiedSample[];
} {
  if (samples.length < 4) {
    return { roughness: 0, signChangeCount: 0, curvature: 0, kinkCount: 0, outlierSamples: [] };
  }
  let pressureVariation = 0;
  let pathLength = 0;
  let curvature = 0;
  let signChangeCount = 0;
  const slopes: number[] = [];
  let previousSign = 0;
  for (let i = 1; i < samples.length; i++) {
    const dV = volumeOf(samples[i]) - volumeOf(samples[i - 1]);
    const dP = pressureOf(samples[i]) - pressureOf(samples[i - 1]);
    pressureVariation += Math.abs(dP);
    pathLength += Math.hypot(dV, dP);
    const slope = Math.abs(dV) > PV_LOOP_CLASSIFICATION_PROFILE.pvLoopSlopeVolumeEpsMl ? dP / dV : 0;
    slopes.push(slope);
    const sign = Math.abs(slope) < PV_LOOP_CLASSIFICATION_PROFILE.slopeZeroAbsMax ? 0 : Math.sign(slope);
    if (sign !== 0 && previousSign !== 0 && sign !== previousSign) signChangeCount++;
    if (sign !== 0) previousSign = sign;
  }
  for (let i = 1; i < samples.length - 1; i++) {
    const ax = volumeOf(samples[i]) - volumeOf(samples[i - 1]);
    const ay = pressureOf(samples[i]) - pressureOf(samples[i - 1]);
    const bx = volumeOf(samples[i + 1]) - volumeOf(samples[i]);
    const by = pressureOf(samples[i + 1]) - pressureOf(samples[i]);
    const aLen = Math.hypot(ax, ay);
    const bLen = Math.hypot(bx, by);
    if (
      aLen < PV_LOOP_CLASSIFICATION_PROFILE.limbSegmentLengthEps
      || bLen < PV_LOOP_CLASSIFICATION_PROFILE.limbSegmentLengthEps
    ) {
      continue;
    }
    curvature += Math.acos(clampUnit((ax * bx + ay * by) / (aLen * bLen)));
  }
  const pressureSpan = rangeOf(samples.map(pressureOf));
  const chord = Math.hypot(
    volumeOf(samples.at(-1)!) - volumeOf(samples[0]),
    pressureOf(samples.at(-1)!) - pressureOf(samples[0]),
  );
  const roughness = pressureVariation / Math.max(pressureSpan, PV_LOOP_CLASSIFICATION_PROFILE.pressureSpanEpsMmHg);
  const kinkSourceIndexes = outlierIndices(slopes.map((slope, index) => Math.abs(slope - (slopes[index - 1] ?? slope))));
  const outlierSamples = [...new Set(kinkSourceIndexes.map((index) => samples[Math.min(samples.length - 1, index + 1)]))];
  return {
    roughness: Math.max(roughness, pathLength / Math.max(chord, PV_LOOP_CLASSIFICATION_PROFILE.pressureSpanEpsMmHg)),
    signChangeCount,
    curvature,
    kinkCount: kinkSourceIndexes.length,
    outlierSamples,
  };
}

function monotonicityViolationFraction(samples: ClassifiedSample[]): number {
  return fraction(
    samples,
    (sample) => dVolumeMlPerSec(sample) < PV_LOOP_CLASSIFICATION_PROFILE.monotonicityViolationDVolumeMlPerSecMax,
  );
}

function ejectionShapeMetrics(samples: ClassifiedSample[]): {
  squareness: number;
  plateauFraction: number;
  topCurvature: number;
  cornerOpen: number;
  cornerClose: number;
  incisuraDepthPa: number;
  incisuraScore: number | null;
  peakPressureTimingFraction: number | null;
} {
  if (samples.length < 4) {
    return {
      squareness: 0,
      plateauFraction: 0,
      topCurvature: 0,
      cornerOpen: 0,
      cornerClose: 0,
      incisuraDepthPa: 0,
      incisuraScore: null,
      peakPressureTimingFraction: null,
    };
  }
  const arterialPressures = samples.map(arterialPressureOf);
  const ventricularPressures = samples.map(pressureOf);
  const volumes = samples.map(volumeOf);
  const dPdV = samples.slice(1).map((sample, index) => {
    const dP = pressureOf(sample) - pressureOf(samples[index]);
    const dV = volumeOf(sample) - volumeOf(samples[index]);
    return Math.abs(dV) > PV_LOOP_CLASSIFICATION_PROFILE.pvLoopSlopeVolumeEpsMl ? dP / dV : 0;
  });
  const slopeScale = percentile(dPdV.map(Math.abs), PV_LOOP_CLASSIFICATION_PROFILE.topPressurePercentile) || 1;
  const plateauFraction = dPdV.filter((slope) => (
    Math.abs(slope) < PV_LOOP_CLASSIFICATION_PROFILE.plateauSlopeScaleFraction * slopeScale
  )).length / Math.max(dPdV.length, 1);
  const topThreshold = percentile(ventricularPressures, PV_LOOP_CLASSIFICATION_PROFILE.topPressurePercentile);
  const topSamples = samples.filter((sample) => pressureOf(sample) >= topThreshold);
  const topCurvature = limbShapeMetrics(topSamples.length >= 4 ? topSamples : samples).curvature;
  const cornerOpen = cornerSharpness(samples, 1);
  const cornerClose = cornerSharpness(samples, samples.length - 2);
  const peakIndex = indexOfMax(ventricularPressures);
  const peakPressureTimingFraction = samples.length > 1 ? peakIndex / (samples.length - 1) : null;
  const closeWindow = arterialPressures.slice(Math.max(0, samples.length - 8));
  const shoulder = closeWindow.length > 0 ? Math.max(...closeWindow) : arterialPressures.at(-1) ?? 0;
  const trough = closeWindow.length > 0 ? Math.min(...closeWindow) : shoulder;
  const incisuraDepthMmHg = Math.max(0, shoulder - trough);
  const incisuraScore = clampUnitPositive(
    incisuraDepthMmHg / Math.max(rangeOf(arterialPressures), PV_LOOP_CLASSIFICATION_PROFILE.pressureSpanEpsMmHg),
  );
  const normalizedCurvature = topCurvature / Math.max(samples.length, 1);
  const weights = PV_LOOP_CLASSIFICATION_PROFILE.ejectionShapeScoreWeights;
  const squareness = clampUnitPositive(
    weights.plateauFraction * plateauFraction
    + weights.cornerSharpness * clampUnitPositive(
      (cornerOpen + cornerClose) / PV_LOOP_CLASSIFICATION_PROFILE.cornerSharpnessNormalization,
    )
    + weights.topCurvature * (1 - clampUnitPositive(normalizedCurvature)),
  );
  void volumes;
  return {
    squareness,
    plateauFraction,
    topCurvature,
    cornerOpen,
    cornerClose,
    incisuraDepthPa: incisuraDepthMmHg * MMHG_TO_PA,
    incisuraScore,
    peakPressureTimingFraction,
  };
}

function cornerSharpness(samples: ClassifiedSample[], index: number): number {
  if (samples.length < 3) return 0;
  const i = Math.max(1, Math.min(samples.length - 2, index));
  const ax = volumeOf(samples[i]) - volumeOf(samples[i - 1]);
  const ay = pressureOf(samples[i]) - pressureOf(samples[i - 1]);
  const bx = volumeOf(samples[i + 1]) - volumeOf(samples[i]);
  const by = pressureOf(samples[i + 1]) - pressureOf(samples[i]);
  const aLen = Math.hypot(ax, ay);
  const bLen = Math.hypot(bx, by);
  if (
    aLen < PV_LOOP_CLASSIFICATION_PROFILE.limbSegmentLengthEps
    || bLen < PV_LOOP_CLASSIFICATION_PROFILE.limbSegmentLengthEps
  ) {
    return 0;
  }
  return Math.acos(clampUnit((ax * bx + ay * by) / (aLen * bLen)));
}

function applyLvRvAsymmetryRows(rows: MetricRow[]): void {
  const sourceMetric = "phaseNormalizedRoughness";
  const lvRows = rows.filter((row) => row.chamber === "LV" && row.metricId === sourceMetric);
  for (const lv of lvRows) {
    const rv = rows.find((row) => (
      row.chamber === "RV"
      && row.metricId === sourceMetric
      && row.caseId === lv.caseId
      && row.branchId === lv.branchId
      && row.beatIndex === lv.beatIndex
      && row.samplingMode === lv.samplingMode
      && row.transitionPolicy === lv.transitionPolicy
    ));
    if (!rv) continue;
    const value = lvRvAsymmetryIndex(lv.value, rv.value);
    rows.push({
      caseId: lv.caseId,
      branchId: lv.branchId,
      branchName: lv.branchName,
      beatIndex: lv.beatIndex,
      chamber: "LV/RV",
      metricId: "lvRvAsymmetryIndex",
      samplingMode: lv.samplingMode,
      transitionPolicy: lv.transitionPolicy,
      value,
      unit: "dimensionless",
      samplingInvarianceDelta: lv.samplingMode === "raw" ? 0 : null,
      classificationLabels: value != null && value > PV_LOOP_CLASSIFICATION_PROFILE.lvRvAsymmetryMin
        ? ["paired-chamber-summary", "lv-rv-asymmetric", `sourceMetric:${sourceMetric}`]
        : ["paired-chamber-summary", `sourceMetric:${sourceMetric}`],
    });
  }
}

function lvRvAsymmetryIndex(lv: number | null, rv: number | null): number | null {
  if (lv == null || rv == null || !Number.isFinite(lv) || !Number.isFinite(rv)) return null;
  return Math.abs(lv - rv) / Math.max(
    0.5 * (Math.abs(lv) + Math.abs(rv)),
    PV_LOOP_CLASSIFICATION_PROFILE.lvRvAsymmetryDenominatorEps,
  );
}

function applySamplingInvarianceDeltas(rows: MetricRow[]): void {
  const rawByKey = new Map<string, number | null>();
  for (const row of rows) {
    if (row.samplingMode !== "raw") continue;
    rawByKey.set(samplingComparisonKey(row), row.value);
  }
  for (const row of rows) {
    if (row.samplingMode === "raw") {
      row.samplingInvarianceDelta = 0;
      continue;
    }
    const raw = rawByKey.get(samplingComparisonKey(row));
    row.samplingInvarianceDelta = normalizedDelta(row.value, raw);
    if (
      row.samplingInvarianceDelta != null
      && row.samplingInvarianceDelta > PV_LOOP_CLASSIFICATION_PROFILE.samplingSensitiveDeltaMin
    ) {
      row.classificationLabels = [...new Set([...row.classificationLabels, "sampling-sensitive"])];
    }
  }
}

function samplingComparisonKey(row: MetricRow): string {
  return `${row.caseId}/${row.branchId}/${row.beatIndex}/${row.chamber}/${row.transitionPolicy}/${row.metricId}`;
}

function normalizedDelta(value: number | null, baseline: number | null | undefined): number | null {
  if (value == null || baseline == null || !Number.isFinite(value) || !Number.isFinite(baseline)) return null;
  return Math.abs(value - baseline) / Math.max(
    Math.abs(baseline),
    Math.abs(value),
    PV_LOOP_CLASSIFICATION_PROFILE.normalizedDeltaDenominatorEps,
  );
}

function clampEventRows(
  base: { caseId: string; branchId: string; branchName: string },
  samples: AnalysisSample[],
  beatIndex: number,
): ClampEventRow[] {
  const rows: ClampEventRow[] = [];
  for (const sample of samples) {
    for (const spec of VALVE_DIAGNOSTIC_SPECS) {
      const raw = Number(sample[spec.rawKey]);
      const post = Number(sample[spec.postKey]);
      const rawPostDivergence = raw - post;
      const clampImpulse = Number(sample[spec.clampImpulseKey]);
      const diodeImpulse = Number(sample[spec.diodeImpulseKey]);
      const flowClampImpulse = Number(sample[spec.flowClampImpulseKey]);
      if (Number(sample[spec.clampHitKey]) > 0) {
        rows.push(clampRow(
          base,
          beatIndex,
          spec.chamber,
          `${spec.signalPrefix}QDotClampHit01`,
          "hit",
          sample,
          Number(sample[spec.clampHitKey]),
        ));
      }
      if (Math.abs(rawPostDivergence) > PV_LOOP_CLASSIFICATION_PROFILE.qDotRawPostDivergenceMin) {
        rows.push(clampRow(
          base,
          beatIndex,
          spec.chamber,
          `${spec.signalPrefix}QDotRawPostDivergenceM3PerSec2`,
          "raw-post-divergence",
          sample,
          qDotMlPerSec2ToM3PerSec2(rawPostDivergence),
        ));
      }
      if (Math.abs(clampImpulse) > PV_LOOP_CLASSIFICATION_PROFILE.qDotRawPostDivergenceMin) {
        rows.push(clampRow(
          base,
          beatIndex,
          spec.chamber,
          `${spec.signalPrefix}QDotClampImpulseM3PerSec2`,
          "qdot-impulse",
          sample,
          qDotMlPerSec2ToM3PerSec2(clampImpulse),
        ));
      }
      if (Math.abs(diodeImpulse) > PV_LOOP_CLASSIFICATION_PROFILE.clampImpulseAbsMin) {
        rows.push(clampRow(
          base,
          beatIndex,
          spec.chamber,
          `${spec.signalPrefix}ValveDiodeImpulseM3PerSec`,
          "valve-diode-impulse",
          sample,
          flowMlPerSecToM3PerSec(diodeImpulse),
        ));
      }
      if (Math.abs(flowClampImpulse) > PV_LOOP_CLASSIFICATION_PROFILE.clampImpulseAbsMin) {
        rows.push(clampRow(
          base,
          beatIndex,
          spec.chamber,
          `${spec.signalPrefix}DynamicFlowClampImpulseM3PerSec`,
          "dynamic-flow-impulse",
          sample,
          flowMlPerSecToM3PerSec(flowClampImpulse),
        ));
      }
    }
    const valveDiodeHits = valveDiodeClampHitCount(sample);
    if (valveDiodeHits > 0) {
      rows.push(clampAvailabilityRow(base, beatIndex, "perSampleValveDiodeClampHits", sample, valveDiodeHits));
    }
    const dynamicFlowHits = dynamicFlowClampHitCount(sample);
    if (dynamicFlowHits > 0) {
      rows.push(clampAvailabilityRow(base, beatIndex, "perSampleDynamicFlowClampHits", sample, dynamicFlowHits));
    }
    if (sample.LVPressureFloorHit01 > 0) {
      rows.push(clampRow(base, beatIndex, "LV", "LVPressureFloorHit01", "hit", sample, sample.LVPressureFloorHit01));
    }
    if (sample.RVPressureFloorHit01 > 0) {
      rows.push(clampRow(base, beatIndex, "RV", "RVPressureFloorHit01", "hit", sample, sample.RVPressureFloorHit01));
    }
  }
  return rows;
}

function clampRow(
  base: { caseId: string; branchId: string; branchName: string },
  beatIndex: number,
  chamber: Chamber,
  signalId: string,
  eventType: string,
  sample: AnalysisSample,
  value: number,
): ClampEventRow {
  return {
    ...base,
    beatIndex,
    chamber,
    signalId,
    eventType,
    timeSec: sample.tSec,
    theta: sample.theta,
    value,
    granularity: "per-sample",
    availability: "available",
    note: "",
  };
}

function clampAvailabilityRow(
  base: { caseId: string; branchId: string; branchName: string },
  beatIndex: number,
  signalId: "perSampleValveDiodeClampHits" | "perSampleDynamicFlowClampHits",
  sample: AnalysisSample,
  value: number,
): ClampEventRow {
  return {
    ...base,
    beatIndex,
    chamber: "both",
    signalId,
    eventType: "hit-count",
    timeSec: sample.tSec,
    theta: sample.theta,
    value,
    granularity: "per-sample",
    availability: "available",
    note: "",
  };
}

function traceRowsForBeat(
  base: { caseId: string; branchId: string; branchName: string },
  raw: AnalysisSample[],
  valveEvents: ValveEvent[],
  beatIndex: number,
): Record<string, unknown>[] {
  return raw.map((sample, sampleIndex) => {
    const lv = classifySample(sample, "LV", "raw", valveEvents.filter((event) => valveBelongsToChamber(event.valve, "LV")));
    const rv = classifySample(sample, "RV", "raw", valveEvents.filter((event) => valveBelongsToChamber(event.valve, "RV")));
    return {
      ...base,
      beatIndex,
      sampleIndex,
      tSec: sample.tSec,
      theta: sample.theta,
      LVP: sample.LVP,
      RVP: sample.RVP,
      LAP: sample.LAP,
      RAP: sample.RAP,
      AoP: sample.AoP,
      PAP: sample.PAP,
      VLV: sample.VLV,
      VRV: sample.VRV,
      QMV: sample.QMV,
      QAo: sample.QAo,
      QTV: sample.QTV,
      QPV: sample.QPV,
      xiMV: sample.xiMV,
      xiAoV: sample.xiAoV,
      xiTV: sample.xiTV,
      xiPV: sample.xiPV,
      LVPhase: lv.phase,
      RVPhase: rv.phase,
      LVPressureFloorHit01: sample.LVPressureFloorHit01,
      RVPressureFloorHit01: sample.RVPressureFloorHit01,
      AoV_qDotRaw: sample.AoV_qDotRaw,
      AoV_qDotPost: sample.AoV_qDotPost,
      AoV_qDotClampHit01: sample.AoV_qDotClampHit01,
      mvQDotRawM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.MV_qDotRaw),
      mvQDotPostM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.MV_qDotPost),
      mvQDotClampHit01: sample.MV_qDotClampHit01,
      mvQDotClampImpulseM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.MV_qDotClampImpulse),
      mvValveDiodeImpulseM3PerSec: flowMlPerSecToM3PerSec(sample.MV_diodeImpulse),
      mvDynamicFlowClampImpulseM3PerSec: flowMlPerSecToM3PerSec(sample.MV_flowClampImpulse),
      aovQDotRawM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.AoV_qDotRaw),
      aovQDotPostM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.AoV_qDotPost),
      aovQDotClampHit01: sample.AoV_qDotClampHit01,
      aovQDotClampImpulseM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.AoV_qDotClampImpulse),
      aovValveDiodeImpulseM3PerSec: flowMlPerSecToM3PerSec(sample.AoV_diodeImpulse),
      aovDynamicFlowClampImpulseM3PerSec: flowMlPerSecToM3PerSec(sample.AoV_flowClampImpulse),
      tvQDotRawM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.TV_qDotRaw),
      tvQDotPostM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.TV_qDotPost),
      tvQDotClampHit01: sample.TV_qDotClampHit01,
      tvQDotClampImpulseM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.TV_qDotClampImpulse),
      tvValveDiodeImpulseM3PerSec: flowMlPerSecToM3PerSec(sample.TV_diodeImpulse),
      tvDynamicFlowClampImpulseM3PerSec: flowMlPerSecToM3PerSec(sample.TV_flowClampImpulse),
      pvQDotRawM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.PV_qDotRaw),
      pvQDotPostM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.PV_qDotPost),
      pvQDotClampHit01: sample.PV_qDotClampHit01,
      pvQDotClampImpulseM3PerSec2: qDotMlPerSec2ToM3PerSec2(sample.PV_qDotClampImpulse),
      pvValveDiodeImpulseM3PerSec: flowMlPerSecToM3PerSec(sample.PV_diodeImpulse),
      pvDynamicFlowClampImpulseM3PerSec: flowMlPerSecToM3PerSec(sample.PV_flowClampImpulse),
      perSampleValveDiodeClampHits: valveDiodeClampHitCount(sample),
      perSampleDynamicFlowClampHits: dynamicFlowClampHitCount(sample),
    };
  });
}

export function clampEventRowsForTest(samples: AnalysisSample[], beatIndex = 1): ClampEventRow[] {
  return clampEventRows({ caseId: "test-case", branchId: "test-branch", branchName: "Test branch" }, samples, beatIndex);
}

export function traceRowsForBeatForTest(samples: AnalysisSample[], beatIndex = 1): Record<string, unknown>[] {
  return traceRowsForBeat({ caseId: "test-case", branchId: "test-branch", branchName: "Test branch" }, samples, [], beatIndex);
}

function pressureOf(sample: Pick<ClassifiedSample, "chamber" | "LVP" | "RVP">): number {
  return sample.chamber === "LV" ? sample.LVP : sample.RVP;
}

function arterialPressureOf(sample: ClassifiedSample): number {
  return sample.chamber === "LV" ? sample.AoP : sample.PAP;
}

function volumeOf(sample: Pick<ClassifiedSample, "chamber" | "VLV" | "VRV">): number {
  return sample.chamber === "LV" ? sample.VLV : sample.VRV;
}

function atrialPressureOf(sample: ClassifiedSample): number {
  return sample.chamber === "LV" ? sample.LAP : sample.RAP;
}

function inletOpen01(sample: ClassifiedSample): number {
  return sample.chamber === "LV" ? sample.xiMV : sample.xiTV;
}

function outletOpen01(sample: ClassifiedSample): number {
  return sample.chamber === "LV" ? sample.xiAoV : sample.xiPV;
}

function inletFlowMlPerSec(sample: ClassifiedSample): number {
  return sample.chamber === "LV" ? sample.QMV : sample.QTV;
}

function outletFlowMlPerSec(sample: ClassifiedSample): number {
  return sample.chamber === "LV" ? sample.QAo : sample.QPV;
}

function dPressureMmHgPerSec(sample: ClassifiedSample): number {
  return sample.chamber === "LV" ? sample.dLVPdt : sample.dRVPdt;
}

function dVolumeMlPerSec(sample: ClassifiedSample): number {
  return sample.chamber === "LV" ? sample.dVLVdt : sample.dVRVdt;
}

function pressureFloorHit(sample: ClassifiedSample): boolean {
  return sample.chamber === "LV" ? sample.LVPressureFloorHit01 > 0 : sample.RVPressureFloorHit01 > 0;
}

function phaseOf(sample: SimSample): number {
  return sample.phi - Math.floor(sample.phi);
}

function fraction<T>(items: T[], predicate: (item: T) => boolean): number {
  if (items.length === 0) return 0;
  return items.filter(predicate).length / items.length;
}

function meanOf<T>(items: T[], project: (item: T) => number): number | null {
  const values = items.map(project).filter(Number.isFinite);
  if (values.length === 0) return null;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function maxOf<T>(items: T[], project: (item: T) => number): number | null {
  const values = items.map(project).filter(Number.isFinite);
  return values.length > 0 ? Math.max(...values) : null;
}

function strokeVolumeMl(samples: ClassifiedSample[]): number {
  if (samples.length === 0) return 0;
  const volumes = samples.map(volumeOf);
  return Math.max(...volumes) - Math.min(...volumes);
}

function integrateClassifiedFlow(
  samples: ClassifiedSample[],
  flow: (sample: ClassifiedSample) => number,
  transform: (flowMlPerSec: number) => number,
): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].tSec - samples[i - 1].tSec;
    area += 0.5 * dt * (transform(flow(samples[i - 1])) + transform(flow(samples[i])));
  }
  return area;
}

function pvLoopAreaJ(samples: ClassifiedSample[]): number {
  if (samples.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = samples[i];
    const b = samples[(i + 1) % samples.length];
    area += (volumeOf(a) * ML_TO_M3) * (pressureOf(b) * MMHG_TO_PA)
      - (volumeOf(b) * ML_TO_M3) * (pressureOf(a) * MMHG_TO_PA);
  }
  return 0.5 * area;
}

function eOverAProxy(samples: ClassifiedSample[]): number | null {
  const early = samples.filter((sample) => sample.phase === "filling");
  const atrial = samples.filter((sample) => sample.phase === "atrial-kick");
  const e = maxOf(early, inletFlowMlPerSec);
  const a = maxOf(atrial, inletFlowMlPerSec);
  return e != null && a != null && Math.abs(a) > PV_LOOP_CLASSIFICATION_PROFILE.eOverAProxyDenominatorEps
    ? e / a
    : null;
}

function chatterCount(values: number[]): number {
  if (values.length < 4) return 0;
  const deltas = values.slice(1).map((value, index) => value - values[index]);
  return countOutliers(deltas);
}

function countOutliers(values: number[]): number {
  return outlierIndices(values).length;
}

function outlierIndices(values: number[]): number[] {
  if (values.length < 4) return [];
  const abs = values.map(Math.abs);
  const med = percentile(abs, PV_LOOP_CLASSIFICATION_PROFILE.medianPercentile);
  const mad = percentile(abs.map((value) => Math.abs(value - med)), PV_LOOP_CLASSIFICATION_PROFILE.medianPercentile);
  const threshold = med + PV_LOOP_CLASSIFICATION_PROFILE.madOutlierMultiplier
    * Math.max(mad, PV_LOOP_CLASSIFICATION_PROFILE.madOutlierMinAbs);
  return abs.flatMap((value, index) => (
    value > threshold && value > PV_LOOP_CLASSIFICATION_PROFILE.madOutlierMinAbs ? [index] : []
  ));
}

function percentile(values: number[], p: number): number {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (finite.length === 0) return 0;
  const index = Math.max(0, Math.min(finite.length - 1, Math.floor(p * (finite.length - 1))));
  return finite[index];
}

function indexOfMax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}

function rangeOf(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return Math.max(...finite) - Math.min(...finite);
}

function finiteOrNull(value: number | null): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function clampUnitPositive(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function safeFileSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "-");
}

function rowsToCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const header = columns ?? [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    header.join(","),
    ...rows.map((row) => header.map((column) => csvCell(row[column])).join(",")),
  ].join("\n") + "\n";
}

function csvCell(value: unknown): string {
  if (value == null) return "";
  const raw = Array.isArray(value) ? value.join("|") : String(value);
  if (/["\n,]/.test(raw)) return `"${raw.replace(/"/g, "\"\"")}"`;
  return raw;
}

export function metricRowsToCsv(rows: MetricRow[]): string {
  return rowsToCsv(rows.map((row) => ({ ...row, classificationLabels: row.classificationLabels.join("|") })), [
    "caseId",
    "branchId",
    "branchName",
    "beatIndex",
    "chamber",
    "metricId",
    "samplingMode",
    "transitionPolicy",
    "value",
    "unit",
    "samplingInvarianceDelta",
    "classificationLabels",
  ]);
}

function summaryToMarkdown(summary: RunnerSummary): string {
  const lines = [
    "# PV-loop morphology quality diagnostic summary",
    "",
    `Generated: ${summary.generatedAt}`,
    `Claim boundary: \`${summary.claimBoundary}\``,
    `Runner: \`${summary.runnerVersion}\``,
    "",
    "This artifact is diagnostic-only. It is not an official morphology pass/fail gate.",
    "",
    "## Branches",
    "",
    "| case | branch | settled | metrics | trace |",
    "| --- | --- | --- | ---: | --- |",
    ...summary.branches.map((branch) => (
      `| ${branch.caseId} | ${branch.branchId} ${branch.branchName} | ${branch.settle.settled} (${branch.settle.reason}) | ${branch.metricCount} | ${branch.traceFile} |`
    )),
    "",
    "## Sampling Invariance",
    "",
    `- max samplingInvarianceDelta: ${summary.samplingInvarianceDelta.max ?? "n/a"}`,
    `- rows with delta: ${summary.samplingInvarianceDelta.rowCount}`,
    "",
    "## Morphology Evidence",
    "",
    "These entries are diagnostic observations and hypotheses, not accepted root causes.",
    "",
    "### Observations",
    "",
    summary.morphologyEvidence.observations.length > 0
      ? "| id | lane | score | support | metricIds | missingSignals |\n| --- | --- | ---: | ---: | --- | --- |"
      : "_No morphology observations crossed the diagnostic thresholds._",
    ...summary.morphologyEvidence.observations.map((observation) => (
      `| ${observation.id} | ${observation.lane} | ${formatEvidenceNumber(observation.score)} | ${observation.supportCount} | ${observation.metricIds.join("; ")} | ${observation.missingSignals.join("; ")} |`
    )),
    "",
    "### Root-Cause Hypotheses",
    "",
    summary.morphologyEvidence.rootCauseHypotheses.length > 0
      ? "| id | lane | evidenceStatus | confidence | score | observations | missingSignals |\n| --- | --- | --- | --- | ---: | --- | --- |"
      : "_No root-cause hypothesis is currently supported by the diagnostic thresholds._",
    ...summary.morphologyEvidence.rootCauseHypotheses.map((hypothesis) => (
      `| ${hypothesis.id} | ${hypothesis.lane} | ${hypothesis.evidenceStatus} | ${hypothesis.confidence} | ${formatEvidenceNumber(hypothesis.score)} | ${hypothesis.observations.join("; ")} | ${hypothesis.missingSignals.join("; ")} |`
    )),
    "",
    "### Evidence Gaps",
    "",
    summary.morphologyEvidence.evidenceGaps.length > 0
      ? "| id | lane | missingSignals | note |\n| --- | --- | --- | --- |"
      : "_No signal coverage gaps were recorded._",
    ...summary.morphologyEvidence.evidenceGaps.map((gap) => (
      `| ${gap.id} | ${gap.lane} | ${gap.missingSignals.join("; ")} | ${gap.note} |`
    )),
    "",
    "## Signal Availability",
    "",
    ...Object.entries(summary.signalAvailability).map(([signal, available]) => `- ${signal}: ${available ? "available" : "unavailable"}`),
  ];
  if (summary.warnings.length > 0) {
    lines.push("", "## Warnings", "", ...summary.warnings.map((warning) => `- ${warning}`));
  }
  if (summary.errors.length > 0) {
    lines.push("", "## Errors", "", ...summary.errors.map((error) => `- ${error}`));
  }
  return lines.join("\n") + "\n";
}

function formatEvidenceNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "n/a";
}

export function summaryToMarkdownForTest(summary: RunnerSummary): string {
  return summaryToMarkdown(summary);
}

function writeArtifacts(
  outDir: string,
  summary: RunnerSummary,
  metricRows: MetricRow[],
  phaseRows: PhaseSampleRow[],
  valveRows: ValveEventRow[],
  clampRows: ClampEventRow[],
  traceFiles: Array<{ file: string; rows: Record<string, unknown>[] }>,
): void {
  mkdirSync(path.join(outDir, "traces"), { recursive: true });
  writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(path.join(outDir, "summary.md"), summaryToMarkdown(summary));
  writeFileSync(path.join(outDir, "per-case-metrics.csv"), metricRowsToCsv(metricRows));
  writeFileSync(path.join(outDir, "per-beat-phase-samples.csv"), rowsToCsv(phaseRows as unknown as Record<string, unknown>[]));
  writeFileSync(path.join(outDir, "valve-event-markers.csv"), rowsToCsv(valveRows as unknown as Record<string, unknown>[]));
  writeFileSync(path.join(outDir, "clamp-event-markers.csv"), rowsToCsv(clampRows as unknown as Record<string, unknown>[]));
  writeFileSync(path.join(outDir, "command.txt"), `${process.argv.join(" ")}\n`);
  for (const trace of traceFiles) {
    writeFileSync(path.join(outDir, "traces", trace.file), rowsToCsv(trace.rows));
  }
}

function updateSamplingInvarianceSummary(summary: RunnerSummary, metricRows: MetricRow[]): void {
  const deltas = metricRows
    .filter((row) => row.samplingMode !== "raw")
    .map((row) => row.samplingInvarianceDelta)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const metricIds = new Set(
    metricRows
      .filter((row) => row.samplingInvarianceDelta != null && row.samplingMode !== "raw")
      .map((row) => row.metricId),
  );
  summary.samplingInvarianceDelta = {
    max: deltas.length > 0 ? Math.max(...deltas) : null,
    rowCount: deltas.length,
    metricIds: [...metricIds].sort(),
  };
}

const FILLING_EVIDENCE_SIGNALS = [
  "mitralValveOpen01",
  "tricuspidValveOpen01",
  "mitralFlowM3PerSec",
  "tricuspidFlowM3PerSec",
  "leftAtrialPressurePa",
  "rightAtrialPressurePa",
  "lvPressureFloorHit01",
  "rvPressureFloorHit01",
  "mvQDotRawM3PerSec2",
  "tvQDotRawM3PerSec2",
  "perSampleValveDiodeClampHits",
  "perSampleDynamicFlowClampHits",
];

const FILLING_MISSING_ROOT_CAUSE_SIGNALS = [
  "mvQDotRawM3PerSec2",
  "tvQDotRawM3PerSec2",
  "perSampleValveDiodeClampHits",
  "perSampleDynamicFlowClampHits",
];

const EJECTION_EVIDENCE_SIGNALS = [
  "aorticValveOpen01",
  "pulmonaryValveOpen01",
  "aorticFlowM3PerSec",
  "pulmonaryFlowM3PerSec",
  "aorticPressurePa",
  "pulmonaryArteryPressurePa",
  "aovQDotRawM3PerSec2",
  "aovQDotPostM3PerSec2",
  "aovQDotClampHit01",
  "aovQDotClampImpulseM3PerSec2",
  "aovValveDiodeImpulseM3PerSec",
  "aovDynamicFlowClampImpulseM3PerSec",
  "pvQDotRawM3PerSec2",
  "pvQDotPostM3PerSec2",
  "pvQDotClampHit01",
  "pvQDotClampImpulseM3PerSec2",
  "pvValveDiodeImpulseM3PerSec",
  "pvDynamicFlowClampImpulseM3PerSec",
];

const EJECTION_MISSING_ROOT_CAUSE_SIGNALS = [
  "pvQDotRawM3PerSec2",
  "systemicArterialPressurePa",
  "downstreamPulmonaryArterialPressurePa",
  "characteristicImpedancePaSecPerM3",
  "arterialReflectionCoefficient",
  "aorticRootComplianceM3PerPa",
  "pulmonaryRootComplianceM3PerPa",
];

function updateMorphologyEvidenceSummary(
  summary: RunnerSummary,
  metricRows: MetricRow[],
  clampRows: ClampEventRow[],
): void {
  summary.morphologyEvidence = buildMorphologyEvidenceSummary(metricRows, clampRows, summary.signalAvailability);
}

function buildMorphologyEvidenceSummary(
  metricRows: MetricRow[],
  clampRows: ClampEventRow[],
  availability: Record<string, boolean>,
): MorphologyEvidenceSummary {
  const observations = [
    fillingLimbObservation(metricRows, availability),
    eventWindowObservation(metricRows),
    aovQDotClampObservation(metricRows, clampRows),
    pressureFloorObservation(metricRows, clampRows, availability),
    ejectionShapeObservation(metricRows, availability),
    samplingSensitivityObservation(metricRows),
  ].filter((observation): observation is MorphologyObservation => Boolean(observation));

  const byId = new Map(observations.map((observation) => [observation.id, observation]));
  const fillingMissing = missingSignals(availability, FILLING_MISSING_ROOT_CAUSE_SIGNALS);
  const ejectionMissing = missingSignals(availability, EJECTION_MISSING_ROOT_CAUSE_SIGNALS);
  const rootCauseHypotheses: RootCauseHypothesis[] = [];

  if (byId.has("sampling-sensitive-metrics")) {
    const observation = byId.get("sampling-sensitive-metrics")!;
    rootCauseHypotheses.push({
      id: "sampling-or-display-sensitivity",
      lane: "sampling",
      hypothesis: "Some morphology readouts change under resampling; use raw traces as the authority before proposing model fixes.",
      evidenceStatus: "supported-correlation",
      confidence: "medium",
      score: observation.score,
      observations: [observation.id],
      supportingSignals: observation.supportingSignals,
      missingSignals: [],
      nextEvidence: [
        "Compare raw trace, display trace, and standardized beat-grid trace at the same beat/sample indices.",
        "Do not use display smoothing as morphology pass/fail evidence.",
      ],
    });
  }

  if (byId.has("filling-limb-roughness") && byId.has("event-window-correlation")) {
    const roughness = byId.get("filling-limb-roughness")!;
    const event = byId.get("event-window-correlation")!;
    const coLocatedEvidence = fillingEventWindowCoLocatedEvidence(metricRows);
    if (coLocatedEvidence) {
      rootCauseHypotheses.push({
        id: "filling-event-window-correlation",
        lane: "filling-limb",
        hypothesis: "Filling-limb roughness is temporally correlated with valve, clamp, pressure-floor, or transition windows in the same raw metric group.",
        evidenceStatus: fillingMissing.length > 0 ? "insufficient-evidence" : "supported-correlation",
        confidence: fillingMissing.length > 0 ? "low" : "medium",
        score: coLocatedEvidence.score,
        observations: [roughness.id, event.id],
        supportingSignals: uniqueSorted([...roughness.supportingSignals, ...event.supportingSignals]),
        missingSignals: fillingMissing,
        nextEvidence: fillingMissing.length > 0
          ? [
              "Expose or capture MV/TV qDot and per-sample clamp signals before assigning this to a valve/qDot policy.",
              "Inspect debug overlay marker timing against raw filling-limb kinks in the same case, branch, beat, chamber, sampling mode, and transition policy.",
            ]
          : [
              "Run an off-by-default valve/qDot diagnostic comparator with unchanged official defaults.",
            ],
      });
    }
  }

  if (byId.has("aov-qdot-clamp-activity") && hasAovQDotRawCoreEvidence(metricRows)) {
    const observation = byId.get("aov-qdot-clamp-activity")!;
    rootCauseHypotheses.push({
      id: "aov-qdot-clamp-correlation",
      lane: "ejection-limb",
      hypothesis: "LV ejection morphology has AoV qDot/clamp activity correlated with ejection samples.",
      evidenceStatus: "supported-correlation",
      confidence: "medium",
      score: observation.score,
      observations: [observation.id],
      supportingSignals: observation.supportingSignals,
      missingSignals: [],
      nextEvidence: [
        "Compare AoV qDot raw/post divergence and clamp impulses against ejection-limb corners in the debug overlay.",
        "Keep this as a diagnostic correlation until an off-by-default comparator shows improved morphology without output suppression.",
      ],
    });
  }

  const coLocatedRvEvidence = rvFillingValveChatterCoLocatedEvidence(metricRows);
  if (
    byId.has("filling-limb-roughness")
    && coLocatedRvEvidence
  ) {
    const observation = byId.get("filling-limb-roughness")!;
    rootCauseHypotheses.push({
      id: "rv-filling-valve-chatter-correlation",
      lane: "filling-limb",
      hypothesis: "RV filling roughness is correlated with inlet valve open01 chatter in the same raw transition-excluded metric group.",
      evidenceStatus: fillingMissing.length > 0 ? "insufficient-evidence" : "supported-correlation",
      confidence: fillingMissing.length > 0 ? "low" : "medium",
      score: coLocatedRvEvidence.score,
      observations: [observation.id],
      supportingSignals: uniqueSorted([...observation.supportingSignals, "tricuspidValveOpen01"]),
      missingSignals: fillingMissing,
      nextEvidence: [
        "Check TV marker density in the debug overlay for the same case, branch, beat, chamber, sampling mode, and transition policy.",
        "Add per-sample dynamic clamp evidence before changing valve dynamics.",
      ],
    });
  }

  if (byId.has("ejection-shape-alert")) {
    const observation = byId.get("ejection-shape-alert")!;
    rootCauseHypotheses.push({
      id: "arterial-load-structure-hypothesis",
      lane: "ejection-limb",
      hypothesis: "Ejection-limb shape readouts suggest a proximal arterial/load morphology question, but structural arterial signals are not yet emitted.",
      evidenceStatus: ejectionMissing.length > 0 ? "insufficient-evidence" : "supported-correlation",
      confidence: ejectionMissing.length > 0 ? "low" : "medium",
      score: observation.score,
      observations: [observation.id],
      supportingSignals: observation.supportingSignals,
      missingSignals: ejectionMissing,
      nextEvidence: ejectionMissing.length > 0
        ? [
            "Emit or derive proximal arterial/root/Zc/reflection diagnostics before proposing an arterial-load model change.",
          ]
        : [
            "Run an off-by-default arterial-load comparator with anti-gaming guard metrics.",
          ],
    });
  }

  if (byId.has("pressure-floor-activity") && hasPressureFloorRawCoreEvidence(metricRows)) {
    const observation = byId.get("pressure-floor-activity")!;
    rootCauseHypotheses.push({
      id: "pressure-floor-correlation",
      lane: "filling-limb",
      hypothesis: "Pressure-floor activity overlaps morphology windows.",
      evidenceStatus: "supported-correlation",
      confidence: "medium",
      score: observation.score,
      observations: [observation.id],
      supportingSignals: observation.supportingSignals,
      missingSignals: [],
      nextEvidence: [
        "Confirm pressure-floor markers align with the visible kink before changing floor policy.",
      ],
    });
  }

  return {
    scoringProfile: ROOT_CAUSE_SCORING_PROFILE,
    observations,
    rootCauseHypotheses: rootCauseHypotheses.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)),
    evidenceGaps: evidenceGaps(availability),
  };
}

function fillingLimbObservation(
  metricRows: MetricRow[],
  availability: Record<string, boolean>,
): MorphologyObservation | null {
  const roughnessRows = rawCoreRows(metricRows, ["mvOpenLowerLimbRoughness", "tvOpenLowerLimbRoughness"])
    .filter((row) => (row.value ?? 0) > ROOT_CAUSE_SCORING_PROFILE.fillingRoughnessMin);
  const kinkRows = rawCoreRows(metricRows, ["lowerLimbKinkCount"])
    .filter((row) => (row.value ?? 0) >= PV_LOOP_CLASSIFICATION_PROFILE.kinkArtifactMinCount);
  const chatterRows = rawCoreRows(metricRows, ["valveOpenCloseChatterCount"])
    .filter((row) => (row.value ?? 0) >= ROOT_CAUSE_SCORING_PROFILE.valveChatterCountMin);
  const rows = [...roughnessRows, ...kinkRows, ...chatterRows];
  if (rows.length === 0) return null;
  const roughnessScore = maxValue(roughnessRows) / ROOT_CAUSE_SCORING_PROFILE.fillingRoughnessMin;
  const kinkScore = Math.min(1, maxValue(kinkRows) / 10);
  const chatterScore = Math.min(1, maxValue(chatterRows) / 10);
  return {
    id: "filling-limb-roughness",
    lane: "filling-limb",
    description: "Raw transition-excluded filling-limb metrics show roughness, kinks, or inlet valve chatter.",
    score: clampUnitPositive(Math.max(roughnessScore, kinkScore, chatterScore)),
    supportCount: rows.length,
    metricIds: metricIds(rows),
    supportingSignals: availableSignals(availability, FILLING_EVIDENCE_SIGNALS),
    missingSignals: missingSignals(availability, FILLING_MISSING_ROOT_CAUSE_SIGNALS),
    classificationLabels: classificationLabels(rows),
  };
}

function eventWindowObservation(metricRows: MetricRow[]): MorphologyObservation | null {
  const rows = rawCoreRows(metricRows, ["eventCorrelationWindowHitFraction"])
    .filter((row) => (row.value ?? 0) >= ROOT_CAUSE_SCORING_PROFILE.eventCorrelationMin);
  if (rows.length === 0) return null;
  return {
    id: "event-window-correlation",
    lane: "filling-limb",
    description: "Morphology outlier samples fall inside transition, qDot/clamp, or pressure-floor event windows.",
    score: clampUnitPositive(maxValue(rows)),
    supportCount: rows.length,
    metricIds: metricIds(rows),
    supportingSignals: [
      "valveOpen01",
      "transitionReason",
      "qDotRawM3PerSec2",
      "qDotClampHit01",
      "perSampleValveDiodeClampHits",
      "perSampleDynamicFlowClampHits",
      "pressureFloorHit01",
    ],
    missingSignals: [],
    classificationLabels: classificationLabels(rows),
  };
}

function aovQDotClampObservation(metricRows: MetricRow[], clampRows: ClampEventRow[]): MorphologyObservation | null {
  const qDotRows = rawCoreRows(metricRows, ["qDotClampHitFraction"])
    .filter((row) => row.chamber === "LV" && (row.value ?? 0) >= ROOT_CAUSE_SCORING_PROFILE.qDotClampHitFractionMin);
  const clampCount = clampRows.filter((row) => (
    row.availability === "available"
    && row.chamber === "LV"
    && (
      row.signalId === "AoV_qDotClampHit01"
      || row.signalId === "AoV_qDotRawPostDivergence"
      || row.signalId === "AoV_diodeImpulse"
      || row.signalId === "AoV_flowClampImpulse"
      || row.signalId === "aovQDotClampHit01"
      || row.signalId === "aovQDotRawPostDivergenceM3PerSec2"
      || row.signalId === "aovQDotClampImpulseM3PerSec2"
      || row.signalId === "aovValveDiodeImpulseM3PerSec"
      || row.signalId === "aovDynamicFlowClampImpulseM3PerSec"
    )
  )).length;
  if (qDotRows.length === 0 && clampCount === 0) return null;
  return {
    id: "aov-qdot-clamp-activity",
    lane: "ejection-limb",
    description: "AoV qDot/clamp markers are present in LV ejection diagnostics.",
    score: clampUnitPositive(Math.max(maxValue(qDotRows), Math.min(1, clampCount / 100))),
    supportCount: qDotRows.length + clampCount,
    metricIds: metricIds(qDotRows),
    supportingSignals: [
      "aovQDotRawM3PerSec2",
      "aovQDotPostM3PerSec2",
      "aovQDotClampHit01",
      "aovQDotClampImpulseM3PerSec2",
      "aovValveDiodeImpulseM3PerSec",
      "aovDynamicFlowClampImpulseM3PerSec",
    ],
    missingSignals: [],
    classificationLabels: classificationLabels(qDotRows),
  };
}

function pressureFloorObservation(
  metricRows: MetricRow[],
  clampRows: ClampEventRow[],
  availability: Record<string, boolean>,
): MorphologyObservation | null {
  const floorRows = rawCoreRows(metricRows, ["pressureFloorHitFraction"])
    .filter((row) => (row.value ?? 0) >= ROOT_CAUSE_SCORING_PROFILE.pressureFloorHitFractionMin);
  const clampCount = clampRows.filter((row) => (
    row.availability === "available" && (
      row.signalId === "LVPressureFloorHit01" || row.signalId === "RVPressureFloorHit01"
    )
  )).length;
  if (floorRows.length === 0 && clampCount === 0) return null;
  return {
    id: "pressure-floor-activity",
    lane: "filling-limb",
    description: "Pressure-floor markers are present in morphology diagnostic windows.",
    score: clampUnitPositive(Math.max(maxValue(floorRows), Math.min(1, clampCount / 20))),
    supportCount: floorRows.length + clampCount,
    metricIds: metricIds(floorRows),
    supportingSignals: availableSignals(availability, ["lvPressureFloorHit01", "rvPressureFloorHit01"]),
    missingSignals: [],
    classificationLabels: classificationLabels(floorRows),
  };
}

function ejectionShapeObservation(
  metricRows: MetricRow[],
  availability: Record<string, boolean>,
): MorphologyObservation | null {
  const squarenessRows = rawCoreRows(metricRows, ["semilunarOpenEjectionSquareness", "aovOpenEjectionSquareness", "pvOpenEjectionSquareness"])
    .filter((row) => (row.value ?? 0) > ROOT_CAUSE_SCORING_PROFILE.ejectionSquarenessMin);
  const plateauRows = rawCoreRows(metricRows, ["ejectionPlateauFraction"])
    .filter((row) => (row.value ?? 0) > ROOT_CAUSE_SCORING_PROFILE.ejectionPlateauFractionMin);
  const incisuraRows = rawCoreRows(metricRows, ["incisuraPresenceScore", "aovOpenAoPIncisuraScore", "pvOpenPAPIncisuraScore"])
    .filter((row) => row.value != null && row.value <= ROOT_CAUSE_SCORING_PROFILE.incisuraPresenceScoreMax);
  const rows = [...squarenessRows, ...plateauRows, ...incisuraRows];
  if (rows.length === 0) return null;
  const squarenessScore = maxValue(squarenessRows) / ROOT_CAUSE_SCORING_PROFILE.ejectionSquarenessMin;
  const plateauScore = maxValue(plateauRows) / ROOT_CAUSE_SCORING_PROFILE.ejectionPlateauFractionMin;
  const incisuraScore = incisuraRows.length > 0 ? 1 : 0;
  return {
    id: "ejection-shape-alert",
    lane: "ejection-limb",
    description: "Raw transition-excluded ejection metrics show squareness, plateau, or missing-incisura alerts.",
    score: clampUnitPositive(Math.max(squarenessScore, plateauScore, incisuraScore)),
    supportCount: rows.length,
    metricIds: metricIds(rows),
    supportingSignals: availableSignals(availability, EJECTION_EVIDENCE_SIGNALS),
    missingSignals: missingSignals(availability, EJECTION_MISSING_ROOT_CAUSE_SIGNALS),
    classificationLabels: classificationLabels(rows),
  };
}

function samplingSensitivityObservation(metricRows: MetricRow[]): MorphologyObservation | null {
  const rows = metricRows.filter((row) => (
    row.samplingMode !== "raw"
    && row.samplingInvarianceDelta != null
    && row.samplingInvarianceDelta > ROOT_CAUSE_SCORING_PROFILE.samplingSensitiveDeltaMin
  ));
  if (rows.length === 0) return null;
  return {
    id: "sampling-sensitive-metrics",
    lane: "sampling",
    description: "Some metric values are sensitive to standardized resampling versus raw samples.",
    score: clampUnitPositive(Math.max(...rows.map((row) => row.samplingInvarianceDelta ?? 0))),
    supportCount: rows.length,
    metricIds: metricIds(rows).slice(0, 24),
    supportingSignals: ["raw", "uniformBeatGrid", "coarseSensitivity", "samplingInvarianceDelta"],
    missingSignals: [],
    classificationLabels: classificationLabels(rows),
  };
}

function rawCoreRows(metricRows: MetricRow[], metricIdsToSelect: string[]): MetricRow[] {
  const selected = new Set(metricIdsToSelect);
  return metricRows.filter((row) => (
    selected.has(row.metricId)
    && row.samplingMode === "raw"
    && row.transitionPolicy === "transition-excluded-core"
    && row.value != null
    && Number.isFinite(row.value)
  ));
}

type CoLocatedEvidence = {
  score: number;
  rows: MetricRow[];
};

function fillingEventWindowCoLocatedEvidence(metricRows: MetricRow[]): CoLocatedEvidence | null {
  const rows = rawCoreRows(metricRows, [
    "mvOpenLowerLimbRoughness",
    "tvOpenLowerLimbRoughness",
    "lowerLimbKinkCount",
    "valveOpenCloseChatterCount",
    "eventCorrelationWindowHitFraction",
  ]);
  const evidence = [...metricRowGroups(rows).values()]
    .map((groupRows) => {
      const roughnessScore = maxMetricScore(
        groupRows,
        ["mvOpenLowerLimbRoughness", "tvOpenLowerLimbRoughness"],
        ROOT_CAUSE_SCORING_PROFILE.fillingRoughnessMin,
        (value) => value > ROOT_CAUSE_SCORING_PROFILE.fillingRoughnessMin,
      );
      const kinkScore = maxMetricScore(
        groupRows,
        ["lowerLimbKinkCount"],
        10,
        (value) => value >= PV_LOOP_CLASSIFICATION_PROFILE.kinkArtifactMinCount,
      );
      const chatterScore = maxMetricScore(
        groupRows,
        ["valveOpenCloseChatterCount"],
        10,
        (value) => value >= ROOT_CAUSE_SCORING_PROFILE.valveChatterCountMin,
      );
      const eventScore = maxMetricScore(
        groupRows,
        ["eventCorrelationWindowHitFraction"],
        1,
        (value) => value >= ROOT_CAUSE_SCORING_PROFILE.eventCorrelationMin,
      );
      const fillingScore = Math.max(roughnessScore, kinkScore, chatterScore);
      if (fillingScore <= 0 || eventScore <= 0) return null;
      return {
        score: Math.min(1, 0.5 * fillingScore + 0.5 * eventScore),
        rows: groupRows,
      };
    })
    .filter((candidate): candidate is CoLocatedEvidence => Boolean(candidate))
    .sort((a, b) => b.score - a.score || metricGroupKey(a.rows[0]).localeCompare(metricGroupKey(b.rows[0])));
  return evidence[0] ?? null;
}

function rvFillingValveChatterCoLocatedEvidence(metricRows: MetricRow[]): CoLocatedEvidence | null {
  const rows = rawCoreRows(metricRows, [
    "tvOpenLowerLimbRoughness",
    "lowerLimbKinkCount",
    "valveOpenCloseChatterCount",
  ]).filter((row) => row.chamber === "RV");
  const evidence = [...metricRowGroups(rows).values()]
    .map((groupRows) => {
      const roughnessScore = maxMetricScore(
        groupRows,
        ["tvOpenLowerLimbRoughness"],
        ROOT_CAUSE_SCORING_PROFILE.fillingRoughnessMin,
        (value) => value > ROOT_CAUSE_SCORING_PROFILE.fillingRoughnessMin,
      );
      const kinkScore = maxMetricScore(
        groupRows,
        ["lowerLimbKinkCount"],
        10,
        (value) => value >= PV_LOOP_CLASSIFICATION_PROFILE.kinkArtifactMinCount,
      );
      const chatterScore = maxMetricScore(
        groupRows,
        ["valveOpenCloseChatterCount"],
        10,
        (value) => value >= ROOT_CAUSE_SCORING_PROFILE.valveChatterCountMin,
      );
      const fillingScore = Math.max(roughnessScore, kinkScore);
      if (fillingScore <= 0 || chatterScore <= 0) return null;
      return {
        score: Math.min(1, 0.5 * fillingScore + 0.5 * chatterScore),
        rows: groupRows,
      };
    })
    .filter((candidate): candidate is CoLocatedEvidence => Boolean(candidate))
    .sort((a, b) => b.score - a.score || metricGroupKey(a.rows[0]).localeCompare(metricGroupKey(b.rows[0])));
  return evidence[0] ?? null;
}

function hasAovQDotRawCoreEvidence(metricRows: MetricRow[]): boolean {
  return rawCoreRows(metricRows, ["qDotClampHitFraction"])
    .some((row) => (
      row.chamber === "LV"
      && (row.value ?? 0) >= ROOT_CAUSE_SCORING_PROFILE.qDotClampHitFractionMin
    ));
}

function hasPressureFloorRawCoreEvidence(metricRows: MetricRow[]): boolean {
  return rawCoreRows(metricRows, ["pressureFloorHitFraction"])
    .some((row) => (row.value ?? 0) >= ROOT_CAUSE_SCORING_PROFILE.pressureFloorHitFractionMin);
}

function metricRowGroups(rows: MetricRow[]): Map<string, MetricRow[]> {
  const groups = new Map<string, MetricRow[]>();
  for (const row of rows) {
    const key = metricGroupKey(row);
    const groupRows = groups.get(key);
    if (groupRows) {
      groupRows.push(row);
    } else {
      groups.set(key, [row]);
    }
  }
  return groups;
}

function metricGroupKey(row: MetricRow): string {
  return [
    row.caseId,
    row.branchId,
    row.beatIndex,
    row.chamber,
    row.samplingMode,
    row.transitionPolicy,
  ].join("\t");
}

function maxMetricScore(
  rows: MetricRow[],
  metricIdsToSelect: string[],
  scoreDivisor: number,
  qualifies: (value: number) => boolean,
): number {
  const selected = new Set(metricIdsToSelect);
  return clampUnitPositive(
    Math.max(
      0,
      ...rows
        .filter((row) => selected.has(row.metricId) && row.value != null && qualifies(row.value))
        .map((row) => scoreDivisor > 0 ? (row.value ?? 0) / scoreDivisor : 0),
    ),
  );
}

function maxValue(rows: MetricRow[]): number {
  return rows.reduce((max, row) => Math.max(max, row.value ?? 0), 0);
}

function metricIds(rows: MetricRow[]): string[] {
  return uniqueSorted(rows.map((row) => row.metricId));
}

function classificationLabels(rows: MetricRow[]): string[] {
  return uniqueSorted(rows.flatMap((row) => row.classificationLabels));
}

function availableSignals(availability: Record<string, boolean>, signals: readonly string[]): string[] {
  return signals.filter((signal) => availability[signal] === true);
}

function missingSignals(availability: Record<string, boolean>, signals: readonly string[]): string[] {
  return signals.filter((signal) => availability[signal] !== true);
}

function evidenceGaps(availability: Record<string, boolean>): EvidenceGap[] {
  const fillingMissing = missingSignals(availability, FILLING_MISSING_ROOT_CAUSE_SIGNALS);
  const ejectionMissing = missingSignals(availability, EJECTION_MISSING_ROOT_CAUSE_SIGNALS);
  const gaps: EvidenceGap[] = [];
  if (fillingMissing.length > 0) {
    gaps.push({
      id: "filling-limb-root-cause-signal-gap",
      lane: "filling-limb",
      missingSignals: fillingMissing,
      note: "Filling-limb correlations cannot distinguish valve diode, dynamic flow clamp, and MV/TV qDot mechanisms until these signals are emitted per sample.",
    });
  }
  if (ejectionMissing.length > 0) {
    gaps.push({
      id: "ejection-limb-arterial-load-signal-gap",
      lane: "ejection-limb",
      missingSignals: ejectionMissing,
      note: ejectionMissing.includes("pvQDotRawM3PerSec2")
        ? "Arterial/load hypotheses remain insufficient without proximal arterial, root compliance, Zc, reflection, and PV qDot evidence."
        : "Arterial/load hypotheses remain insufficient without proximal arterial, root compliance, Zc, and reflection evidence.",
    });
  }
  return gaps;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

export function buildMorphologyEvidenceSummaryForTest(
  metricRows: MetricRow[],
  clampRows: ClampEventRow[] = [],
  availability: Record<string, boolean> = signalAvailability(),
): MorphologyEvidenceSummary {
  return buildMorphologyEvidenceSummary(metricRows, clampRows, availability);
}

function runDiagnostic(options: CliOptions): DiagnosticRunResult {
  const summary = buildInitialSummary(options.caseIds);
  const metricRows: MetricRow[] = [];
  const phaseRows: PhaseSampleRow[] = [];
  const valveRows: ValveEventRow[] = [];
  const clampRows: ClampEventRow[] = [];
  const traceFiles: Array<{ file: string; rows: Record<string, unknown>[] }> = [];

  if (morphologyTargets.id !== TARGET_PACK_ID) {
    summary.errors.push(`Unexpected target pack id ${morphologyTargets.id}`);
  }
  if (morphologyProtocol.claimBoundary !== CLAIM_BOUNDARY || morphologyTargets.claimBoundary !== CLAIM_BOUNDARY) {
    summary.errors.push("Protocol/target claimBoundary mismatch.");
  }

  for (const caseId of options.caseIds) {
    const doc = OFFICIAL_CASES.find((candidate) => candidate.meta.id === caseId);
    if (!doc) {
      summary.errors.push(`Official case not found: ${caseId}`);
      continue;
    }
    try {
      const result = runCase(doc);
      metricRows.push(...result.metricRows);
      phaseRows.push(...result.phaseRows);
      valveRows.push(...result.valveRows);
      clampRows.push(...result.clampRows);
      summary.branches.push(...result.summaries);
      traceFiles.push(...result.traceFiles);
    } catch (err) {
      summary.errors.push(`${caseId}: ${(err as Error).message}`);
    }
  }

  const expectedCases = new Set(CASE_IDS);
  for (const caseId of options.caseIds) {
    if (!expectedCases.has(caseId)) {
      summary.warnings.push(`Non-canonical case requested via --cases: ${caseId}`);
    }
  }
  if (metricRows.length === 0) {
    summary.errors.push("No metric rows were produced.");
  }
  updateSamplingInvarianceSummary(summary, metricRows);
  updateMorphologyEvidenceSummary(summary, metricRows, clampRows);
  writeArtifacts(options.outDir, summary, metricRows, phaseRows, valveRows, clampRows, traceFiles);
  return { summary, metricRows, phaseRows };
}

export function runPvLoopMorphologyDiagnosticForTest(outDir: string, caseIds = ["normal-sinus"]): RunnerSummary {
  return runDiagnostic({ outDir, caseIds }).summary;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const result = runDiagnostic(options);
  const { summary } = result;
  // eslint-disable-next-line no-console
  console.log(
    `PV-loop morphology diagnostic wrote branches=${summary.branches.length} metrics=${result.metricRows.length} `
    + `samples=${result.phaseRows.length} out=${options.outDir}`,
  );
  if (summary.errors.length > 0) {
    for (const error of summary.errors) {
      // eslint-disable-next-line no-console
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  }
}

const runningUnderVitest =
  process.env.VITEST === "true" || process.argv.some((arg) => /vitest(?:\.mjs)?$/.test(arg));
if (!runningUnderVitest) {
  main();
}
