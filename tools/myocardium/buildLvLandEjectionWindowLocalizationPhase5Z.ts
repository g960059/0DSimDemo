import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import phase5YArtifact from "@/data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, caseDocumentToSimInstances, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";
import { measureConverged } from "@/engine/measure";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import type { SimSample, SimulationHealth } from "@/engine/protocol";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const LV_LAND_EJECTION_WINDOW_LOCALIZATION_PHASE5Z_ID =
  "lv-land-ejection-window-localization-phase5z-result-v1";

export const LV_LAND_EJECTION_WINDOW_LOCALIZATION_PHASE5Z_RESULT_PATH =
  "data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json";

const MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const SAMPLE_HZ = 240 as const;
const DT_SEC = 0.001 as const;
const MEASURE_BEATS = 3 as const;
const AOV_OPEN_THRESHOLD = 0.5 as const;
const QAO_FORWARD_EPS_ML_PER_SEC = 1e-9 as const;
const HIGH_FLOW_CORE_50_FRACTION = 0.5 as const;
const HIGH_FLOW_CORE_75_FRACTION = 0.75 as const;
const QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2 = 1e-6 as const;
const QDOT_IMPULSE_ABS_MIN_ML_PER_S2 = 1e-9 as const;
const PHASE5X_QDOT_HIGH_FRACTION_MIN = 0.75 as const;
const PHASE5X_TO_AOV_OPEN_DURATION_RATIO_MAX = 0.1 as const;
const HIGH_CORE_QDOT_DOMINANT_FRACTION_MIN = 0.75 as const;

type ModelPathId = typeof MODEL_PATH_IDS[number];
type SweepPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
};

type WindowId =
  | "aov-open"
  | "aov-open-forward"
  | "qao-high-core-50"
  | "qao-high-core-75"
  | "qdot-hit-in-aov-open";

export type LvLandEjectionWindowLocalizationPhase5ZHealth = Pick<
  SimulationHealth,
  | "status"
  | "periodBeats"
  | "tbvDriftMl"
  | "leftRightFlowMismatchLMin"
  | "cycleMetricDelta"
  | "clampHitCount"
  | "numericalStability"
  | "massConservation"
  | "flowBalance"
  | "physiologicalRange"
  | "messages"
>;

export type LvLandEjectionWindowLocalizationPhase5ZWindow = {
  readonly id: WindowId;
  readonly sampleCount: number;
  readonly durationSec: number | null;
  readonly forwardVolumeMl: number | null;
  readonly qAoMeanMlPerSec: number | null;
  readonly qAoPeakMlPerSec: number | null;
  readonly qAoPeakRatioMin: number | null;
  readonly explicitClampHit01Fraction: number | null;
  readonly rawPostDivergenceHitFraction: number | null;
  readonly impulseHitFraction: number | null;
  readonly rawPostDiffAbsMaxMlPerS2: number | null;
  readonly clampImpulseAbsSumMlPerS2: number | null;
};

export type LvLandEjectionWindowLocalizationPhase5ZReference = {
  readonly phase5XQDotClampHitFraction: number | null;
  readonly phase5XEjectionDurationSec: number | null;
  readonly phase5XSemilunarForwardVolumeMl: number | null;
  readonly phase5XIncisuraPresenceScore: number | null;
  readonly phase5XAbsoluteFailures: readonly string[];
  readonly phase5YLocalizationClass: string | null;
  readonly phase5YDirectOpenFraction: number | null;
  readonly phase5YClassifierWindowAmplification: boolean;
};

export type LvLandEjectionWindowLocalizationPhase5ZComparison = {
  readonly phase5XToAovOpenDurationRatio: number | null;
  readonly phase5XToHighCore50DurationRatio: number | null;
  readonly highCore50ToAovOpenDurationRatio: number | null;
  readonly highCore75ToAovOpenDurationRatio: number | null;
  readonly phase5XToAovOpenForwardVolumeRatio: number | null;
  readonly phase5XToHighCore50ForwardVolumeRatio: number | null;
  readonly highCore50RawPostFractionMinusAovOpenRawPostFraction: number | null;
  readonly highCore75RawPostFractionMinusAovOpenRawPostFraction: number | null;
};

export type LvLandEjectionWindowLocalizationPhase5ZRun = {
  readonly pointId: string;
  readonly modelPathId: ModelPathId;
  readonly sourceProviderId: string | null;
  readonly experimentalActiveSourceProvider: boolean;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly settleBeats: number;
  readonly health: LvLandEjectionWindowLocalizationPhase5ZHealth;
  readonly metrics: {
    readonly CO_L: number | null;
    readonly AoPMean: number | null;
    readonly LVEDPApprox: number | null;
    readonly EF_LApprox: number | null;
    readonly SV_L: number | null;
  };
  readonly qAoPeakMlPerSec: number | null;
  readonly windows: readonly LvLandEjectionWindowLocalizationPhase5ZWindow[];
  readonly reference: LvLandEjectionWindowLocalizationPhase5ZReference;
  readonly comparison: LvLandEjectionWindowLocalizationPhase5ZComparison;
  readonly providerInstrumentation: {
    readonly sourceActiveStressCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
    readonly landSolveOkCount: number;
  } | null;
};

export type LvLandEjectionWindowLocalizationPhase5ZClass =
  | "physical-high-flow-core-qdot-dominant"
  | "classifier-window-denominator-amplification-dominant"
  | "no-phase5x-window-amplification"
  | "uninterpretable";

export type LvLandEjectionWindowLocalizationPhase5ZPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly stock: LvLandEjectionWindowLocalizationPhase5ZRun;
  readonly land: LvLandEjectionWindowLocalizationPhase5ZRun;
  readonly classification: LvLandEjectionWindowLocalizationPhase5ZClass;
  readonly signals: readonly string[];
};

export type LvLandEjectionWindowLocalizationPhase5ZEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof LV_LAND_EJECTION_WINDOW_LOCALIZATION_PHASE5Z_ID;
  readonly phase: "Phase 5Z";
  readonly claimBoundary: "ejection-window-localization-diagnostic-only-no-tuning";
  readonly upstreamPhase5XArtifactId: typeof phase5XArtifact.id;
  readonly upstreamPhase5YArtifactId: typeof phase5YArtifact.id;
  readonly verifierScript: "verify:myocardium-lv-land-ejection-window-localization";
  readonly protocol: {
    readonly pointSource: "phase5x-synthetic-user-knob-sweep";
    readonly modelPathIds: readonly ModelPathId[];
    readonly pointCount: number;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly dtSec: typeof DT_SEC;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly windowDurationAndVolumeAggregation: "per-beat-average-over-measure-beats";
    readonly aovOpenThreshold: typeof AOV_OPEN_THRESHOLD;
    readonly highFlowCore50Fraction: typeof HIGH_FLOW_CORE_50_FRACTION;
    readonly highFlowCore75Fraction: typeof HIGH_FLOW_CORE_75_FRACTION;
    readonly qDotRawPostDivergenceMinMlPerS2: typeof QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2;
    readonly qDotImpulseAbsMinMlPerS2: typeof QDOT_IMPULSE_ABS_MIN_ML_PER_S2;
    readonly phase5XQDotHighFractionMin: typeof PHASE5X_QDOT_HIGH_FRACTION_MIN;
    readonly phase5XToAovOpenDurationRatioMax: typeof PHASE5X_TO_AOV_OPEN_DURATION_RATIO_MAX;
    readonly highCoreQDotDominantFractionMin: typeof HIGH_CORE_QDOT_DOMINANT_FRACTION_MIN;
  };
  readonly points: readonly LvLandEjectionWindowLocalizationPhase5ZPoint[];
  readonly summary: {
    readonly pointCount: number;
    readonly landHealthOkCount: number;
    readonly landSettledCount: number;
    readonly landSolveFailureCount: number;
    readonly physicalHighFlowCoreQDotDominantPointCount: number;
    readonly classifierWindowDenominatorAmplificationDominantPointCount: number;
    readonly noPhase5XWindowAmplificationPointCount: number;
    readonly uninterpretablePointCount: number;
    readonly medianPhase5XToAovOpenDurationRatio: number | null;
    readonly medianHighCore50ToAovOpenDurationRatio: number | null;
    readonly medianHighCore50QDotFraction: number | null;
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noRuntimeDefaultFlip: true;
    readonly noLegacyActiveStressDeletion: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noRuntimeFlagUi: true;
    readonly noProductionRegistryIntegration: true;
    readonly noTrefFudge: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noSourceStressScaling: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildLvLandEjectionWindowLocalizationPhase5ZEvidence():
LvLandEjectionWindowLocalizationPhase5ZEvidence {
  const sweepPoints = phase5XArtifact.protocol.sweepPoints as readonly SweepPoint[];
  const points = sweepPoints.map(buildPoint);
  const landRuns = points.map((point) => point.land);
  const physicalCount = points.filter((point) => point.classification === "physical-high-flow-core-qdot-dominant").length;
  const classifierCount = points.filter((point) =>
    point.classification === "classifier-window-denominator-amplification-dominant"
  ).length;
  const noAmplificationCount = points.filter((point) => point.classification === "no-phase5x-window-amplification").length;
  const uninterpretableCount = points.filter((point) => point.classification === "uninterpretable").length;
  const evidenceWithoutHash: Omit<LvLandEjectionWindowLocalizationPhase5ZEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: LV_LAND_EJECTION_WINDOW_LOCALIZATION_PHASE5Z_ID,
    phase: "Phase 5Z" as const,
    claimBoundary: "ejection-window-localization-diagnostic-only-no-tuning" as const,
    upstreamPhase5XArtifactId: phase5XArtifact.id,
    upstreamPhase5YArtifactId: phase5YArtifact.id,
    verifierScript: "verify:myocardium-lv-land-ejection-window-localization" as const,
    protocol: {
      pointSource: "phase5x-synthetic-user-knob-sweep" as const,
      modelPathIds: MODEL_PATH_IDS,
      pointCount: sweepPoints.length,
      sampleHz: SAMPLE_HZ,
      dtSec: DT_SEC,
      measureBeats: MEASURE_BEATS,
      windowDurationAndVolumeAggregation: "per-beat-average-over-measure-beats" as const,
      aovOpenThreshold: AOV_OPEN_THRESHOLD,
      highFlowCore50Fraction: HIGH_FLOW_CORE_50_FRACTION,
      highFlowCore75Fraction: HIGH_FLOW_CORE_75_FRACTION,
      qDotRawPostDivergenceMinMlPerS2: QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2,
      qDotImpulseAbsMinMlPerS2: QDOT_IMPULSE_ABS_MIN_ML_PER_S2,
      phase5XQDotHighFractionMin: PHASE5X_QDOT_HIGH_FRACTION_MIN,
      phase5XToAovOpenDurationRatioMax: PHASE5X_TO_AOV_OPEN_DURATION_RATIO_MAX,
      highCoreQDotDominantFractionMin: HIGH_CORE_QDOT_DOMINANT_FRACTION_MIN,
    },
    points,
    summary: {
      pointCount: points.length,
      landHealthOkCount: landRuns.filter((run) => run.health.status === "ok").length,
      landSettledCount: landRuns.filter((run) => run.settled).length,
      landSolveFailureCount:
        landRuns.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0),
      physicalHighFlowCoreQDotDominantPointCount: physicalCount,
      classifierWindowDenominatorAmplificationDominantPointCount: classifierCount,
      noPhase5XWindowAmplificationPointCount: noAmplificationCount,
      uninterpretablePointCount: uninterpretableCount,
      medianPhase5XToAovOpenDurationRatio:
        medianOrNull(landRuns.map((run) => run.comparison.phase5XToAovOpenDurationRatio)),
      medianHighCore50ToAovOpenDurationRatio:
        medianOrNull(landRuns.map((run) => run.comparison.highCore50ToAovOpenDurationRatio)),
      medianHighCore50QDotFraction:
        medianOrNull(landRuns.map((run) => windowById(run, "qao-high-core-50")?.rawPostDivergenceHitFraction ?? null)),
      currentInterpretation: interpretation(physicalCount, classifierCount, noAmplificationCount, uninterpretableCount),
      recommendedNext: recommendedNext(physicalCount, classifierCount, noAmplificationCount),
      limitations: [
        "Arterial root/Zc/inertance and valve/load are next diagnostic hypotheses, not Phase 5Z root-cause acceptance.",
        "Contractility-low/high Land branches match the normal-floor Land readout in this artifact; treat the sweep as point coverage, not independent Land contractility-sensitivity evidence.",
      ],
    },
    boundary: {
      noRuntimeDefaultFlip: true,
      noLegacyActiveStressDeletion: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noRuntimeFlagUi: true,
      noProductionRegistryIntegration: true,
      noTrefFudge: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noSourceStressScaling: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noClinicalScientificValidationClaim: true,
    },
    doesNotUnlock: [
      "runtimeDefaultFlip",
      "legacyActiveStressDeletion",
      "officialCaseWiring",
      "officialCaseReauthoring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "runtimeFlagUi",
      "productionRegistryIntegration",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
      "TrefFudge",
      "qDotTuning",
      "valveThresholdTuning",
      "arterialLoadTuning",
      "preloadTuning",
      "landParameterTuning",
      "sourceStressScaling",
      "clinicalDecisionSupport",
      "scientificValidationClaim",
    ],
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function buildPoint(point: SweepPoint): LvLandEjectionWindowLocalizationPhase5ZPoint {
  const stock = runPoint(point, "stock-active-no-provider-v0");
  const land = runPoint(point, "developer-only-lv-land-v0");
  const classification = classifyRun(land);
  return {
    id: point.id,
    label: point.label,
    role: point.role,
    targetTBVMl: point.targetTBVMl,
    stock,
    land,
    classification,
    signals: pointSignals(land, classification),
  };
}

function runPoint(point: SweepPoint, modelPathId: ModelPathId): LvLandEjectionWindowLocalizationPhase5ZRun {
  const instrumentation = modelPathId === "developer-only-lv-land-v0"
    ? createModelCoreLand2017LvSourceProviderInstrumentation()
    : null;
  const flag = instrumentation
    ? createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
      acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
      instrumentation,
    })
    : null;
  const doc = syntheticCaseDocument(point);
  const [instance] = caseDocumentToSimInstances(doc);
  if (!instance) throw new Error(`No synthetic instance for ${point.id}`);
  const measurement = measureConverged(instance.params, {
    targetTBV: point.targetTBVMl,
    dt: DT_SEC,
    sampleHz: SAMPLE_HZ,
    measureBeats: MEASURE_BEATS,
    requireProjectorQuiet: false,
    ...(flag ? { experimentalOptions: flag.experimentalOptions as ModelCoreExperimentalOptions } : {}),
  });
  const metrics = measurement.metrics;
  const qAoPeak = maxOrNull(measurement.samples.map((sample) => sample.QAo));
  const windows = windowSet(measurement.samples, qAoPeak);
  const reference = referenceFor(point.id, modelPathId);
  return {
    pointId: point.id,
    modelPathId,
    sourceProviderId: flag?.sourceProviderId ?? null,
    experimentalActiveSourceProvider: flag != null,
    targetTBVMl: point.targetTBVMl,
    knobs: point.knobs,
    settled: measurement.settleStatus.settled,
    settleReason: measurement.settleStatus.reason,
    settleActualSeconds: finiteOrNull(measurement.settleStatus.actualSeconds),
    settleBeats: measurement.settleStatus.beats,
    health: compactHealth(measurement.health),
    metrics: {
      CO_L: finiteOrNull(metrics.CO_L),
      AoPMean: finiteOrNull(metrics.AoPMean),
      LVEDPApprox: finiteOrNull(metrics.LVEDPApprox),
      EF_LApprox: finiteOrNull(metrics.EF_LApprox),
      SV_L: finiteOrNull(metrics.SV_L),
    },
    qAoPeakMlPerSec: qAoPeak,
    windows,
    reference,
    comparison: compareWindows(reference, windows),
    providerInstrumentation: instrumentation ? compactInstrumentation(instrumentation) : null,
  };
}

function syntheticCaseDocument(point: SweepPoint): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: {
      id: `phase5z-window-${point.id}`,
      title: `Phase 5Z ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5Z ${point.label}`,
      description: "Synthetic ejection-window localization point; not an official case.",
      modelLimitations: [
        "Synthetic diagnostic point only.",
        "No qDot, valve, load, Land, or official-case tuning.",
      ],
    },
    instances: [{
      id: point.id,
      name: point.label,
      color: "#38bdf8",
      isVisible: true,
      baseline: "active-normal",
      knobs: point.knobs,
      interventions: [],
      rawPatch: {},
      targetVolume: point.targetTBVMl,
    }],
    panels: [],
  };
}

function windowSet(
  samples: readonly SimSample[],
  qAoPeakMlPerSec: number | null,
): LvLandEjectionWindowLocalizationPhase5ZWindow[] {
  const qAoPeak = qAoPeakMlPerSec ?? 0;
  return [
    makeWindow("aov-open", samples, (sample) => sample.xiAoV > AOV_OPEN_THRESHOLD, null),
    makeWindow("aov-open-forward", samples, (sample) =>
      sample.xiAoV > AOV_OPEN_THRESHOLD && sample.QAo > QAO_FORWARD_EPS_ML_PER_SEC, null),
    makeWindow("qao-high-core-50", samples, (sample) =>
      sample.xiAoV > AOV_OPEN_THRESHOLD && qAoPeak > 0 && sample.QAo >= HIGH_FLOW_CORE_50_FRACTION * qAoPeak,
    HIGH_FLOW_CORE_50_FRACTION),
    makeWindow("qao-high-core-75", samples, (sample) =>
      sample.xiAoV > AOV_OPEN_THRESHOLD && qAoPeak > 0 && sample.QAo >= HIGH_FLOW_CORE_75_FRACTION * qAoPeak,
    HIGH_FLOW_CORE_75_FRACTION),
    makeWindow("qdot-hit-in-aov-open", samples, (sample) =>
      sample.xiAoV > AOV_OPEN_THRESHOLD && rawPostDivergenceHit(sample), null),
  ];
}

function makeWindow(
  id: WindowId,
  samples: readonly SimSample[],
  predicate: (sample: SimSample) => boolean,
  qAoPeakRatioMin: number | null,
): LvLandEjectionWindowLocalizationPhase5ZWindow {
  const selected = samples.filter(predicate);
  const dt = medianSampleDt(samples);
  const selectedDurationSec = selected.length * dt;
  const selectedForwardVolumeMl = selected.reduce((sum, sample) => sum + Math.max(0, sample.QAo) * dt, 0);
  const rawPostDiffAbs = selected.map((sample) => Math.abs(sample.AoV_qDotRaw - sample.AoV_qDotPost));
  const impulses = selected.map((sample) => Math.abs(sample.AoV_qDotClampImpulse));
  return {
    id,
    sampleCount: selected.length,
    durationSec: selected.length > 0 ? round(selectedDurationSec / MEASURE_BEATS) : null,
    forwardVolumeMl: selected.length > 0
      ? round(selectedForwardVolumeMl / MEASURE_BEATS)
      : null,
    qAoMeanMlPerSec: meanOrNull(selected.map((sample) => sample.QAo)),
    qAoPeakMlPerSec: maxOrNull(selected.map((sample) => sample.QAo)),
    qAoPeakRatioMin,
    explicitClampHit01Fraction: fractionOrNull(selected, (sample) => sample.AoV_qDotClampHit01 > 0),
    rawPostDivergenceHitFraction: fractionOrNull(selected, rawPostDivergenceHit),
    impulseHitFraction: fractionOrNull(selected, (sample) =>
      Math.abs(sample.AoV_qDotClampImpulse) > QDOT_IMPULSE_ABS_MIN_ML_PER_S2
    ),
    rawPostDiffAbsMaxMlPerS2: maxOrNull(rawPostDiffAbs),
    clampImpulseAbsSumMlPerS2: selected.length > 0
      ? round(impulses.reduce((sum, value) => sum + value, 0))
      : null,
  };
}

function referenceFor(pointId: string, modelPathId: ModelPathId): LvLandEjectionWindowLocalizationPhase5ZReference {
  const phase5XPoint = phase5XArtifact.points.find((candidate) => candidate.id === pointId);
  if (!phase5XPoint) throw new Error(`Missing Phase 5X point ${pointId}`);
  const phase5YPoint = phase5YArtifact.points.find((candidate) => candidate.id === pointId);
  if (!phase5YPoint) throw new Error(`Missing Phase 5Y point ${pointId}`);
  const prefix = modelPathId === "developer-only-lv-land-v0" ? "land" : "stock";
  const phase5YRun = phase5YPoint[prefix];
  return {
    phase5XQDotClampHitFraction: metricMean(phase5XPoint.metricDeltas, "LV", "qDotClampHitFraction", prefix),
    phase5XEjectionDurationSec: metricMean(phase5XPoint.metricDeltas, "LV", "ejectionDuration", prefix),
    phase5XSemilunarForwardVolumeMl: metricMean(phase5XPoint.metricDeltas, "LV", "semilunarForwardVolume", prefix),
    phase5XIncisuraPresenceScore: metricMean(phase5XPoint.metricDeltas, "LV", "incisuraPresenceScore", prefix),
    phase5XAbsoluteFailures: phase5XPoint.absoluteMorphologyFailures,
    phase5YLocalizationClass: prefix === "land" ? phase5YPoint.localizationClass : null,
    phase5YDirectOpenFraction: Math.max(
      phase5YRun.directWindow.rawPostDivergenceHitFractionAovOpen ?? 0,
      phase5YRun.directWindow.explicitClampHit01FractionAovOpen ?? 0,
      phase5YRun.directWindow.impulseHitFractionAovOpen ?? 0,
    ),
    phase5YClassifierWindowAmplification:
      prefix === "land"
      && phase5YPoint.localizationClass === "direct-aov-qdot-engagement-classifier-window-amplification",
  };
}

function metricMean(
  rows: readonly typeof phase5XArtifact.points[number]["metricDeltas"][number][],
  chamber: string,
  metricId: string,
  prefix: "stock" | "land",
): number | null {
  const row = rows.find((candidate) => candidate.chamber === chamber && candidate.metricId === metricId);
  if (!row) return null;
  return finiteOrNull(prefix === "stock" ? row.stockMean : row.landMean);
}

function compareWindows(
  reference: LvLandEjectionWindowLocalizationPhase5ZReference,
  windows: readonly LvLandEjectionWindowLocalizationPhase5ZWindow[],
): LvLandEjectionWindowLocalizationPhase5ZComparison {
  const aovOpen = mustWindow(windows, "aov-open");
  const high50 = mustWindow(windows, "qao-high-core-50");
  const high75 = mustWindow(windows, "qao-high-core-75");
  return {
    phase5XToAovOpenDurationRatio: ratio(reference.phase5XEjectionDurationSec, aovOpen.durationSec),
    phase5XToHighCore50DurationRatio: ratio(reference.phase5XEjectionDurationSec, high50.durationSec),
    highCore50ToAovOpenDurationRatio: ratio(high50.durationSec, aovOpen.durationSec),
    highCore75ToAovOpenDurationRatio: ratio(high75.durationSec, aovOpen.durationSec),
    phase5XToAovOpenForwardVolumeRatio: ratio(reference.phase5XSemilunarForwardVolumeMl, aovOpen.forwardVolumeMl),
    phase5XToHighCore50ForwardVolumeRatio: ratio(reference.phase5XSemilunarForwardVolumeMl, high50.forwardVolumeMl),
    highCore50RawPostFractionMinusAovOpenRawPostFraction:
      delta(high50.rawPostDivergenceHitFraction, aovOpen.rawPostDivergenceHitFraction),
    highCore75RawPostFractionMinusAovOpenRawPostFraction:
      delta(high75.rawPostDivergenceHitFraction, aovOpen.rawPostDivergenceHitFraction),
  };
}

function classifyRun(run: LvLandEjectionWindowLocalizationPhase5ZRun): LvLandEjectionWindowLocalizationPhase5ZClass {
  if (!run.settled || run.health.status !== "ok") return "uninterpretable";
  const aovOpen = mustWindow(run.windows, "aov-open");
  const high50 = mustWindow(run.windows, "qao-high-core-50");
  const high75 = mustWindow(run.windows, "qao-high-core-75");
  const phase5XAmplified =
    (run.reference.phase5XQDotClampHitFraction ?? 0) >= PHASE5X_QDOT_HIGH_FRACTION_MIN
    && (run.comparison.phase5XToAovOpenDurationRatio ?? Number.POSITIVE_INFINITY)
      <= PHASE5X_TO_AOV_OPEN_DURATION_RATIO_MAX;
  if (!phase5XAmplified) return "no-phase5x-window-amplification";
  const highCoreQDotDominant =
    (high50.rawPostDivergenceHitFraction ?? 0) >= HIGH_CORE_QDOT_DOMINANT_FRACTION_MIN
    || (high75.rawPostDivergenceHitFraction ?? 0) >= HIGH_CORE_QDOT_DOMINANT_FRACTION_MIN;
  const aovOpenModerate =
    (aovOpen.rawPostDivergenceHitFraction ?? 0) < HIGH_CORE_QDOT_DOMINANT_FRACTION_MIN;
  return highCoreQDotDominant && aovOpenModerate
    ? "physical-high-flow-core-qdot-dominant"
    : "classifier-window-denominator-amplification-dominant";
}

function pointSignals(
  run: LvLandEjectionWindowLocalizationPhase5ZRun,
  classification: LvLandEjectionWindowLocalizationPhase5ZClass,
): string[] {
  const signals: string[] = [classification];
  if ((run.reference.phase5XQDotClampHitFraction ?? 0) >= PHASE5X_QDOT_HIGH_FRACTION_MIN) {
    signals.push("phase5x-qdot-fraction-high");
  }
  if ((run.comparison.phase5XToAovOpenDurationRatio ?? Number.POSITIVE_INFINITY)
    <= PHASE5X_TO_AOV_OPEN_DURATION_RATIO_MAX) {
    signals.push("phase5x-ejection-core-short-versus-aov-open");
  }
  if ((mustWindow(run.windows, "qao-high-core-50").rawPostDivergenceHitFraction ?? 0)
    >= HIGH_CORE_QDOT_DOMINANT_FRACTION_MIN) {
    signals.push("high-flow-core-50-qdot-dominant");
  }
  if ((mustWindow(run.windows, "qao-high-core-75").rawPostDivergenceHitFraction ?? 0)
    >= HIGH_CORE_QDOT_DOMINANT_FRACTION_MIN) {
    signals.push("high-flow-core-75-qdot-dominant");
  }
  if (run.reference.phase5YClassifierWindowAmplification) {
    signals.push("phase5y-classifier-window-amplification");
  }
  return [...new Set(signals)].sort();
}

function interpretation(
  physicalCount: number,
  classifierCount: number,
  noAmplificationCount: number,
  uninterpretableCount: number,
): string {
  if (physicalCount > classifierCount) {
    return "Phase 5Z supports a physical high-flow-core qDot concentration pattern: Phase 5X remains a short-window amplification, but the high-flow core itself is qDot-dominant. Prioritize arterial root/Zc/load and operating-point morphology before changing qDot, valve thresholds, or runtime default.";
  }
  if (classifierCount > physicalCount && classifierCount > noAmplificationCount) {
    return "Phase 5Z supports classifier-window denominator amplification as the dominant readout pattern. Prioritize morphology classifier/window definitions before any qDot, valve, load, or runtime-default change.";
  }
  if (noAmplificationCount > 0) {
    return "Phase 5Z does not support a dominant short ejection-window denominator explanation after per-beat normalization. Treat the qDot signal as real AoV/root discharge evidence and prioritize arterial root/Zc/inertance and valve/load diagnostics before qDot, valve-threshold, load, or runtime-default changes.";
  }
  return `Phase 5Z did not identify an interpretable ejection-window localization pattern; uninterpretable=${uninterpretableCount}.`;
}

function recommendedNext(physicalCount: number, classifierCount: number, noAmplificationCount: number): string[] {
  if (physicalCount > classifierCount) {
    return [
      "run an isolated arterial root/Zc/load morphology bench before any qDot or valve tuning",
      "measure whether Land operating point and AoV high-flow-core timing drive the qDot-dominant core",
      "keep runtime default flip separate and blocked until normal-floor and morphology blockers are explicitly resolved or bounded",
    ];
  }
  if (noAmplificationCount >= classifierCount && noAmplificationCount > physicalCount) {
    return [
      "run an isolated arterial root/Zc/inertance bench before any qDot or valve-threshold tuning",
      "keep qDot and valve thresholds fixed while measuring whether root/load physics eliminates clamp engagement",
      "keep runtime default flip separate and blocked until normal-floor and morphology blockers are explicitly resolved or bounded",
    ];
  }
  return [
    "tighten or replace the morphology ejection-window classifier before treating qDot fraction as a model blocker",
    "do not tune qDot or valve thresholds to hide a denominator-driven morphology signal",
    "keep runtime default flip separate and blocked until normal-floor and morphology blockers are explicitly resolved or bounded",
  ];
}

function windowById(
  run: LvLandEjectionWindowLocalizationPhase5ZRun,
  id: WindowId,
): LvLandEjectionWindowLocalizationPhase5ZWindow | null {
  return run.windows.find((window) => window.id === id) ?? null;
}

function mustWindow(
  windows: readonly LvLandEjectionWindowLocalizationPhase5ZWindow[],
  id: WindowId,
): LvLandEjectionWindowLocalizationPhase5ZWindow {
  const window = windows.find((candidate) => candidate.id === id);
  if (!window) throw new Error(`Missing window ${id}`);
  return window;
}

function rawPostDivergenceHit(sample: SimSample): boolean {
  return Math.abs(sample.AoV_qDotRaw - sample.AoV_qDotPost) > QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2;
}

function compactHealth(health: SimulationHealth): LvLandEjectionWindowLocalizationPhase5ZHealth {
  return {
    status: health.status,
    ...(health.periodBeats != null ? { periodBeats: health.periodBeats } : {}),
    tbvDriftMl: round(health.tbvDriftMl),
    leftRightFlowMismatchLMin: round(health.leftRightFlowMismatchLMin),
    cycleMetricDelta: round(health.cycleMetricDelta),
    clampHitCount: health.clampHitCount,
    numericalStability: health.numericalStability,
    massConservation: health.massConservation,
    flowBalance: health.flowBalance,
    physiologicalRange: health.physiologicalRange,
    messages: health.messages,
  };
}

function compactInstrumentation(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): NonNullable<LvLandEjectionWindowLocalizationPhase5ZRun["providerInstrumentation"]> {
  return {
    sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    landSolveOkCount: instrumentation.landSolveOkCount,
  };
}

function medianSampleDt(samples: readonly SimSample[]): number {
  if (samples.length < 2) return DT_SEC;
  const deltas = samples.slice(1)
    .map((sample, index) => sample.t - samples[index].t)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (deltas.length === 0) return DT_SEC;
  return deltas[Math.floor(deltas.length / 2)];
}

function fractionOrNull<T>(values: readonly T[], predicate: (value: T) => boolean): number | null {
  if (values.length === 0) return null;
  return round(values.filter(predicate).length / values.length);
}

function maxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function meanOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(finite.reduce((sum, value) => sum + value, 0) / finite.length) : null;
}

function medianOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const mid = Math.floor(finite.length / 2);
  return round(finite.length % 2 === 0 ? (finite[mid - 1] + finite[mid]) / 2 : finite[mid]);
}

function delta(left: number | null, right: number | null): number | null {
  return left == null || right == null ? null : round(left - right);
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator <= 0) return null;
  return round(numerator / denominator);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${stableStringify(record[key])}`
  ).join(",")}}`;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildLvLandEjectionWindowLocalizationPhase5Z.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildLvLandEjectionWindowLocalizationPhase5ZEvidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), LV_LAND_EJECTION_WINDOW_LOCALIZATION_PHASE5Z_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
