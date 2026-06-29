import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
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

export const LV_LAND_QDOT_BLOCKER_LOCALIZATION_PHASE5Y_ID =
  "lv-land-qdot-blocker-localization-phase5y-result-v1";

export const LV_LAND_QDOT_BLOCKER_LOCALIZATION_PHASE5Y_RESULT_PATH =
  "data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json";

const MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const SAMPLE_HZ = 240 as const;
const DT_SEC = 0.001 as const;
const MEASURE_BEATS = 3 as const;
const AOV_OPEN_THRESHOLD = 0.5 as const;
const QAO_FORWARD_EPS_ML_PER_SEC = 1e-9;
const QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2 = 1e-6 as const;
const QDOT_IMPULSE_ABS_MIN_ML_PER_S2 = 1e-9 as const;
const QDOT_HIGH_FRACTION_MIN = 0.75 as const;
const DIRECT_QDOT_ENGAGEMENT_FRACTION_MIN = 0.25 as const;
const DIRECT_QDOT_RAW_POST_DIFF_ABS_MIN_ML_PER_S2 = 40000 as const;
const SHORT_EJECTION_DURATION_SEC_MAX = 0.02 as const;
const PHASE5X_EJECTION_TO_AOV_OPEN_DURATION_RATIO_MAX = 0.1 as const;
const QAO_FLOW_CAP_ML_PER_SEC = 40000;

type ModelPathId = typeof MODEL_PATH_IDS[number];
type SweepPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
};

export type LvLandQDotBlockerLocalizationPhase5YHealth = Pick<
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

export type LvLandQDotBlockerLocalizationPhase5YDirectWindow = {
  readonly sampleCount: number;
  readonly aovOpenSampleCount: number;
  readonly qAoForwardSampleCount: number;
  readonly aovOpenForwardSampleCount: number;
  readonly aovOpenDurationSec: number | null;
  readonly aovOpenForwardDurationSec: number | null;
  readonly qAoPeakMlPerSec: number | null;
  readonly qAoCapRatioMax: number | null;
  readonly aovQDotRawAbsMaxMlPerS2: number | null;
  readonly aovQDotPostAbsMaxMlPerS2: number | null;
  readonly aovQDotRawPostDiffAbsMaxMlPerS2: number | null;
  readonly aovQDotRawPostReductionFractionMax: number | null;
  readonly aovQDotClampImpulseAbsMaxMlPerS2: number | null;
  readonly aovQDotClampImpulseAbsSumMlPerS2: number | null;
  readonly explicitClampHit01FractionAll: number | null;
  readonly explicitClampHit01FractionAovOpen: number | null;
  readonly rawPostDivergenceHitFractionAll: number | null;
  readonly rawPostDivergenceHitFractionAovOpen: number | null;
  readonly rawPostDivergenceHitFractionAovOpenForward: number | null;
  readonly impulseHitFractionAll: number | null;
  readonly impulseHitFractionAovOpen: number | null;
};

export type LvLandQDotBlockerLocalizationPhase5YMorphologyReference = {
  readonly phase5XQDotClampHitFraction: number | null;
  readonly phase5XEjectionDurationSec: number | null;
  readonly phase5XSemilunarForwardVolumeMl: number | null;
  readonly phase5XIncisuraPresenceScore: number | null;
  readonly phase5XAbsoluteFailures: readonly string[];
};

export type LvLandQDotBlockerLocalizationPhase5YWindowComparison = {
  readonly phase5XEjectionToAovOpenDurationRatio: number | null;
  readonly phase5XQDotClampHitFractionMinusDirectAovOpenRawPostFraction: number | null;
  readonly phase5XQDotClampHitFractionMinusDirectAovOpenExplicitFraction: number | null;
};

export type LvLandQDotBlockerLocalizationPhase5YRun = {
  readonly pointId: string;
  readonly modelPathId: ModelPathId;
  readonly caseId: string;
  readonly sourceProviderId: string | null;
  readonly experimentalActiveSourceProvider: boolean;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly settleBeats: number;
  readonly health: LvLandQDotBlockerLocalizationPhase5YHealth;
  readonly metrics: {
    readonly CO_L: number | null;
    readonly AoPMean: number | null;
    readonly LVEDPApprox: number | null;
    readonly EF_LApprox: number | null;
    readonly SV_L: number | null;
  };
  readonly directWindow: LvLandQDotBlockerLocalizationPhase5YDirectWindow;
  readonly morphologyReference: LvLandQDotBlockerLocalizationPhase5YMorphologyReference;
  readonly windowComparison: LvLandQDotBlockerLocalizationPhase5YWindowComparison;
  readonly providerInstrumentation: {
    readonly sourceActiveStressCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
    readonly landSolveOkCount: number;
  } | null;
};

export type LvLandQDotBlockerLocalizationPhase5YClass =
  | "direct-aov-qdot-engagement-classifier-window-amplification"
  | "direct-aov-qdot-engagement-broad-window"
  | "morphology-fraction-denominator-risk"
  | "morphology-qdot-blocker-not-localized";

export type LvLandQDotBlockerLocalizationPhase5YPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly stock: LvLandQDotBlockerLocalizationPhase5YRun;
  readonly land: LvLandQDotBlockerLocalizationPhase5YRun;
  readonly landVsStock: {
    readonly qDotClampHitFractionDelta: number | null;
    readonly rawPostDivergenceOpenFractionDelta: number | null;
    readonly explicitClampOpenFractionDelta: number | null;
    readonly qAoPeakDeltaMlPerSec: number | null;
    readonly ejectionDurationDeltaSec: number | null;
    readonly LVEDPApproxDelta: number | null;
  };
  readonly localizationClass: LvLandQDotBlockerLocalizationPhase5YClass;
  readonly blockerSignals: readonly string[];
};

export type LvLandQDotBlockerLocalizationPhase5YEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof LV_LAND_QDOT_BLOCKER_LOCALIZATION_PHASE5Y_ID;
  readonly phase: "Phase 5Y";
  readonly claimBoundary: "qdot-blocker-localization-diagnostic-only-no-tuning";
  readonly upstreamPhase5XArtifactId: typeof phase5XArtifact.id;
  readonly verifierScript: "verify:myocardium-lv-land-qdot-blocker-localization";
  readonly protocol: {
    readonly pointSource: "phase5x-synthetic-user-knob-sweep";
    readonly modelPathIds: readonly ModelPathId[];
    readonly pointCount: number;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly dtSec: typeof DT_SEC;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly aovOpenThreshold: typeof AOV_OPEN_THRESHOLD;
    readonly qDotRawPostDivergenceMinMlPerS2: typeof QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2;
    readonly qDotImpulseAbsMinMlPerS2: typeof QDOT_IMPULSE_ABS_MIN_ML_PER_S2;
    readonly highFractionMin: typeof QDOT_HIGH_FRACTION_MIN;
    readonly directEngagementFractionMin: typeof DIRECT_QDOT_ENGAGEMENT_FRACTION_MIN;
    readonly directRawPostDiffAbsMinMlPerS2: typeof DIRECT_QDOT_RAW_POST_DIFF_ABS_MIN_ML_PER_S2;
    readonly shortEjectionDurationSecMax: typeof SHORT_EJECTION_DURATION_SEC_MAX;
    readonly phase5XEjectionToAovOpenDurationRatioMax: typeof PHASE5X_EJECTION_TO_AOV_OPEN_DURATION_RATIO_MAX;
  };
  readonly points: readonly LvLandQDotBlockerLocalizationPhase5YPoint[];
  readonly summary: {
    readonly pointCount: number;
    readonly landHealthOkCount: number;
    readonly landSettledCount: number;
    readonly landSolveFailureCount: number;
    readonly directAovQDotEngagementPointCount: number;
    readonly classifierWindowAmplificationPointCount: number;
    readonly morphologyFractionDenominatorRiskPointCount: number;
    readonly normalFloorLVEDPApprox: number | null;
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
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

export function buildLvLandQDotBlockerLocalizationPhase5YEvidence():
LvLandQDotBlockerLocalizationPhase5YEvidence {
  const sweepPoints = phase5XArtifact.protocol.sweepPoints as readonly SweepPoint[];
  const points = sweepPoints.map(buildPoint);
  const landRuns = points.map((point) => point.land);
  const directAovQDotEngagementPointCount =
    points.filter((point) => point.localizationClass.startsWith("direct-aov-qdot-engagement")).length;
  const classifierWindowAmplificationPointCount =
    points.filter((point) =>
      point.localizationClass === "direct-aov-qdot-engagement-classifier-window-amplification"
    ).length;
  const morphologyFractionDenominatorRiskPointCount =
    points.filter((point) => point.localizationClass === "morphology-fraction-denominator-risk").length;
  const normalFloorLVEDPApprox = points.find((point) => point.id === "normal-floor")?.land.metrics.LVEDPApprox ?? null;
  const evidenceWithoutHash: Omit<LvLandQDotBlockerLocalizationPhase5YEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: LV_LAND_QDOT_BLOCKER_LOCALIZATION_PHASE5Y_ID as typeof LV_LAND_QDOT_BLOCKER_LOCALIZATION_PHASE5Y_ID,
    phase: "Phase 5Y" as const,
    claimBoundary: "qdot-blocker-localization-diagnostic-only-no-tuning" as const,
    upstreamPhase5XArtifactId: phase5XArtifact.id,
    verifierScript: "verify:myocardium-lv-land-qdot-blocker-localization" as const,
    protocol: {
      pointSource: "phase5x-synthetic-user-knob-sweep" as const,
      modelPathIds: MODEL_PATH_IDS,
      pointCount: sweepPoints.length,
      sampleHz: SAMPLE_HZ,
      dtSec: DT_SEC,
      measureBeats: MEASURE_BEATS,
      aovOpenThreshold: AOV_OPEN_THRESHOLD,
      qDotRawPostDivergenceMinMlPerS2: QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2,
      qDotImpulseAbsMinMlPerS2: QDOT_IMPULSE_ABS_MIN_ML_PER_S2,
      highFractionMin: QDOT_HIGH_FRACTION_MIN,
      directEngagementFractionMin: DIRECT_QDOT_ENGAGEMENT_FRACTION_MIN,
      directRawPostDiffAbsMinMlPerS2: DIRECT_QDOT_RAW_POST_DIFF_ABS_MIN_ML_PER_S2,
      shortEjectionDurationSecMax: SHORT_EJECTION_DURATION_SEC_MAX,
      phase5XEjectionToAovOpenDurationRatioMax: PHASE5X_EJECTION_TO_AOV_OPEN_DURATION_RATIO_MAX,
    },
    points,
    summary: {
      pointCount: points.length,
      landHealthOkCount: landRuns.filter((run) => run.health.status === "ok").length,
      landSettledCount: landRuns.filter((run) => run.settled).length,
      landSolveFailureCount:
        landRuns.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0),
      directAovQDotEngagementPointCount,
      classifierWindowAmplificationPointCount,
      morphologyFractionDenominatorRiskPointCount,
      normalFloorLVEDPApprox,
      currentInterpretation: interpretation(points),
      recommendedNext: [
        "treat Phase 5X qDot morphology blockers as direct AoV qDot engagement plus classifier-window amplification evidence, without tuning qDot or valve thresholds in this PR",
        "localize whether the short morphology-classified LV ejection core comes from Land operating point, arterial root/Zc/load morphology, or activation timing before a default-flip PR",
        "keep legacy active-stress frozen as the positive-control reference and keep SDIRK2 alternans closure parallel to product migration",
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

function buildPoint(point: SweepPoint): LvLandQDotBlockerLocalizationPhase5YPoint {
  const stock = runPoint(point, "stock-active-no-provider-v0");
  const land = runPoint(point, "developer-only-lv-land-v0");
  const localizationClass = classifyPoint(land);
  return {
    id: point.id,
    label: point.label,
    role: point.role,
    targetTBVMl: point.targetTBVMl,
    stock,
    land,
    landVsStock: {
      qDotClampHitFractionDelta:
        delta(land.morphologyReference.phase5XQDotClampHitFraction, stock.morphologyReference.phase5XQDotClampHitFraction),
      rawPostDivergenceOpenFractionDelta:
        delta(land.directWindow.rawPostDivergenceHitFractionAovOpen, stock.directWindow.rawPostDivergenceHitFractionAovOpen),
      explicitClampOpenFractionDelta:
        delta(land.directWindow.explicitClampHit01FractionAovOpen, stock.directWindow.explicitClampHit01FractionAovOpen),
      qAoPeakDeltaMlPerSec:
        delta(land.directWindow.qAoPeakMlPerSec, stock.directWindow.qAoPeakMlPerSec),
      ejectionDurationDeltaSec:
        delta(land.morphologyReference.phase5XEjectionDurationSec, stock.morphologyReference.phase5XEjectionDurationSec),
      LVEDPApproxDelta:
        delta(land.metrics.LVEDPApprox, stock.metrics.LVEDPApprox),
    },
    localizationClass,
    blockerSignals: blockerSignals(land, localizationClass),
  };
}

function runPoint(
  point: SweepPoint,
  modelPathId: ModelPathId,
): LvLandQDotBlockerLocalizationPhase5YRun {
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
  const direct = directWindow(measurement.samples);
  const morphology = morphologyReference(point.id, modelPathId);
  return {
    pointId: point.id,
    modelPathId,
    caseId: doc.meta.id,
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
    directWindow: direct,
    morphologyReference: morphology,
    windowComparison: windowComparison(direct, morphology),
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
      id: `phase5y-qdot-${point.id}`,
      title: `Phase 5Y ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5Y ${point.label}`,
      description: "Synthetic qDot blocker localization point; not an official case.",
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

function directWindow(samples: readonly SimSample[]): LvLandQDotBlockerLocalizationPhase5YDirectWindow {
  const aovOpen = samples.filter((sample) => sample.xiAoV > AOV_OPEN_THRESHOLD);
  const qAoForward = samples.filter((sample) => sample.QAo > QAO_FORWARD_EPS_ML_PER_SEC);
  const aovOpenForward = samples.filter((sample) =>
    sample.xiAoV > AOV_OPEN_THRESHOLD && sample.QAo > QAO_FORWARD_EPS_ML_PER_SEC
  );
  const rawAbs = samples.map((sample) => Math.abs(sample.AoV_qDotRaw));
  const postAbs = samples.map((sample) => Math.abs(sample.AoV_qDotPost));
  const rawPostDiffAbs = samples.map((sample) => Math.abs(sample.AoV_qDotRaw - sample.AoV_qDotPost));
  const reductionFractions = samples.map((sample) => {
    const denom = Math.max(Math.abs(sample.AoV_qDotRaw), QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2);
    return Math.abs(sample.AoV_qDotRaw - sample.AoV_qDotPost) / denom;
  });
  const impulses = samples.map((sample) => Math.abs(sample.AoV_qDotClampImpulse));
  return {
    sampleCount: samples.length,
    aovOpenSampleCount: aovOpen.length,
    qAoForwardSampleCount: qAoForward.length,
    aovOpenForwardSampleCount: aovOpenForward.length,
    aovOpenDurationSec: durationSec(aovOpen),
    aovOpenForwardDurationSec: durationSec(aovOpenForward),
    qAoPeakMlPerSec: maxOrNull(samples.map((sample) => sample.QAo)),
    qAoCapRatioMax: maxOrNull(samples.map((sample) => Math.abs(sample.QAo) / QAO_FLOW_CAP_ML_PER_SEC)),
    aovQDotRawAbsMaxMlPerS2: maxOrNull(rawAbs),
    aovQDotPostAbsMaxMlPerS2: maxOrNull(postAbs),
    aovQDotRawPostDiffAbsMaxMlPerS2: maxOrNull(rawPostDiffAbs),
    aovQDotRawPostReductionFractionMax: maxOrNull(reductionFractions),
    aovQDotClampImpulseAbsMaxMlPerS2: maxOrNull(impulses),
    aovQDotClampImpulseAbsSumMlPerS2: finiteOrNull(impulses.reduce((sum, value) => sum + value, 0)),
    explicitClampHit01FractionAll: fraction(samples, (sample) => sample.AoV_qDotClampHit01 > 0),
    explicitClampHit01FractionAovOpen: fraction(aovOpen, (sample) => sample.AoV_qDotClampHit01 > 0),
    rawPostDivergenceHitFractionAll: fraction(samples, rawPostDivergenceHit),
    rawPostDivergenceHitFractionAovOpen: fraction(aovOpen, rawPostDivergenceHit),
    rawPostDivergenceHitFractionAovOpenForward: fraction(aovOpenForward, rawPostDivergenceHit),
    impulseHitFractionAll: fraction(samples, (sample) =>
      Math.abs(sample.AoV_qDotClampImpulse) > QDOT_IMPULSE_ABS_MIN_ML_PER_S2
    ),
    impulseHitFractionAovOpen: fraction(aovOpen, (sample) =>
      Math.abs(sample.AoV_qDotClampImpulse) > QDOT_IMPULSE_ABS_MIN_ML_PER_S2
    ),
  };
}

function morphologyReference(
  pointId: string,
  modelPathId: ModelPathId,
): LvLandQDotBlockerLocalizationPhase5YMorphologyReference {
  const point = phase5XArtifact.points.find((candidate) => candidate.id === pointId);
  if (!point) throw new Error(`Missing Phase 5X point ${pointId}`);
  const prefix = modelPathId === "developer-only-lv-land-v0" ? "land" : "stock";
  return {
    phase5XQDotClampHitFraction: metricMean(point.metricDeltas, "LV", "qDotClampHitFraction", prefix),
    phase5XEjectionDurationSec: metricMean(point.metricDeltas, "LV", "ejectionDuration", prefix),
    phase5XSemilunarForwardVolumeMl: metricMean(point.metricDeltas, "LV", "semilunarForwardVolume", prefix),
    phase5XIncisuraPresenceScore: metricMean(point.metricDeltas, "LV", "incisuraPresenceScore", prefix),
    phase5XAbsoluteFailures: point.absoluteMorphologyFailures,
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

function classifyPoint(run: LvLandQDotBlockerLocalizationPhase5YRun): LvLandQDotBlockerLocalizationPhase5YClass {
  if (directOpenFraction(run) >= QDOT_HIGH_FRACTION_MIN) {
    return "direct-aov-qdot-engagement-broad-window";
  }
  if (hasDirectAovQDotEngagement(run) && hasClassifierWindowAmplification(run)) {
    return "direct-aov-qdot-engagement-classifier-window-amplification";
  }
  if (hasPhase5XHighQDotFraction(run) && hasPhase5XShortEjectionCore(run)) {
    return "morphology-fraction-denominator-risk";
  }
  return "morphology-qdot-blocker-not-localized";
}

function blockerSignals(
  run: LvLandQDotBlockerLocalizationPhase5YRun,
  localizationClass: LvLandQDotBlockerLocalizationPhase5YClass,
): string[] {
  const signals: string[] = [];
  if ((run.morphologyReference.phase5XQDotClampHitFraction ?? 0) >= QDOT_HIGH_FRACTION_MIN) {
    signals.push("phase5x-lv-qdot-clamp-hit-fraction-high");
  }
  if ((run.directWindow.rawPostDivergenceHitFractionAovOpen ?? 0) >= DIRECT_QDOT_ENGAGEMENT_FRACTION_MIN) {
    signals.push("direct-aov-open-raw-post-divergence-engaged");
  }
  if ((run.directWindow.rawPostDivergenceHitFractionAovOpen ?? 0) >= QDOT_HIGH_FRACTION_MIN) {
    signals.push("direct-aov-open-raw-post-divergence-high");
  }
  if ((run.directWindow.explicitClampHit01FractionAovOpen ?? 0) >= DIRECT_QDOT_ENGAGEMENT_FRACTION_MIN) {
    signals.push("direct-aov-open-explicit-clamp-flag-engaged");
  }
  if ((run.directWindow.explicitClampHit01FractionAovOpen ?? 0) >= QDOT_HIGH_FRACTION_MIN) {
    signals.push("direct-aov-open-explicit-clamp-flag-high");
  }
  if ((run.directWindow.impulseHitFractionAovOpen ?? 0) >= DIRECT_QDOT_ENGAGEMENT_FRACTION_MIN) {
    signals.push("direct-aov-open-impulse-hit-engaged");
  }
  if ((run.directWindow.impulseHitFractionAovOpen ?? 0) >= QDOT_HIGH_FRACTION_MIN) {
    signals.push("direct-aov-open-impulse-hit-high");
  }
  if (hasPhase5XShortEjectionCore(run)) signals.push("short-phase5x-morphology-ejection-core");
  if (hasClassifierWindowAmplification(run)) signals.push("classifier-window-amplifies-qdot-fraction");
  signals.push(localizationClass);
  return [...new Set(signals)].sort();
}

function windowComparison(
  direct: LvLandQDotBlockerLocalizationPhase5YDirectWindow,
  morphology: LvLandQDotBlockerLocalizationPhase5YMorphologyReference,
): LvLandQDotBlockerLocalizationPhase5YWindowComparison {
  return {
    phase5XEjectionToAovOpenDurationRatio:
      ratio(morphology.phase5XEjectionDurationSec, direct.aovOpenDurationSec),
    phase5XQDotClampHitFractionMinusDirectAovOpenRawPostFraction:
      delta(morphology.phase5XQDotClampHitFraction, direct.rawPostDivergenceHitFractionAovOpen),
    phase5XQDotClampHitFractionMinusDirectAovOpenExplicitFraction:
      delta(morphology.phase5XQDotClampHitFraction, direct.explicitClampHit01FractionAovOpen),
  };
}

function directOpenFraction(run: LvLandQDotBlockerLocalizationPhase5YRun): number {
  return Math.max(
    run.directWindow.rawPostDivergenceHitFractionAovOpen ?? 0,
    run.directWindow.explicitClampHit01FractionAovOpen ?? 0,
    run.directWindow.impulseHitFractionAovOpen ?? 0,
  );
}

function hasDirectAovQDotEngagement(run: LvLandQDotBlockerLocalizationPhase5YRun): boolean {
  return directOpenFraction(run) >= DIRECT_QDOT_ENGAGEMENT_FRACTION_MIN
    && (run.directWindow.aovQDotRawPostDiffAbsMaxMlPerS2 ?? 0) >= DIRECT_QDOT_RAW_POST_DIFF_ABS_MIN_ML_PER_S2;
}

function hasPhase5XHighQDotFraction(run: LvLandQDotBlockerLocalizationPhase5YRun): boolean {
  return (run.morphologyReference.phase5XQDotClampHitFraction ?? 0) >= QDOT_HIGH_FRACTION_MIN;
}

function hasPhase5XShortEjectionCore(run: LvLandQDotBlockerLocalizationPhase5YRun): boolean {
  return (run.morphologyReference.phase5XEjectionDurationSec ?? Number.POSITIVE_INFINITY)
    <= SHORT_EJECTION_DURATION_SEC_MAX;
}

function hasClassifierWindowAmplification(run: LvLandQDotBlockerLocalizationPhase5YRun): boolean {
  return hasPhase5XHighQDotFraction(run)
    && hasPhase5XShortEjectionCore(run)
    && (run.windowComparison.phase5XEjectionToAovOpenDurationRatio ?? Number.POSITIVE_INFINITY)
      <= PHASE5X_EJECTION_TO_AOV_OPEN_DURATION_RATIO_MAX;
}

function interpretation(points: readonly LvLandQDotBlockerLocalizationPhase5YPoint[]): string {
  const direct = points.filter((point) => point.localizationClass.startsWith("direct-aov-qdot-engagement")).length;
  const amplified = points.filter((point) =>
    point.localizationClass === "direct-aov-qdot-engagement-classifier-window-amplification"
  ).length;
  if (direct > 0 && amplified > 0) {
    return "Phase 5X LV qDot morphology blockers localize to real direct AoV qDot raw/post clamp engagement, while the morphology fraction is amplified by a short morphology-classified ejection core relative to the broader AoV-open window. This supports measuring classifier/window, arterial root/Zc/load, and operating-point causes before any default flip, without tuning qDot or valve thresholds.";
  }
  if (direct > 0) {
    return "Phase 5X LV qDot morphology blockers localize to direct AoV qDot engagement, but not through the Phase 5X classifier-window amplification pattern.";
  }
  return "Phase 5X LV qDot morphology blockers did not localize to direct AoV qDot engagement in this diagnostic.";
}

function rawPostDivergenceHit(sample: SimSample): boolean {
  return Math.abs(sample.AoV_qDotRaw - sample.AoV_qDotPost) > QDOT_RAW_POST_DIVERGENCE_MIN_ML_PER_S2;
}

function durationSec(samples: readonly SimSample[]): number | null {
  if (samples.length === 0) return null;
  const dt = medianSampleDt(samples);
  return finiteOrNull(samples.length * dt);
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

function compactHealth(health: SimulationHealth): LvLandQDotBlockerLocalizationPhase5YHealth {
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
): NonNullable<LvLandQDotBlockerLocalizationPhase5YRun["providerInstrumentation"]> {
  return {
    sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    landSolveOkCount: instrumentation.landSolveOkCount,
  };
}

function fraction<T>(values: readonly T[], predicate: (value: T) => boolean): number | null {
  if (values.length === 0) return null;
  return round(values.filter(predicate).length / values.length);
}

function maxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
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
  const normalizedScriptPath = path.normalize("tools/myocardium/buildLvLandQDotBlockerLocalizationPhase5Y.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildLvLandQDotBlockerLocalizationPhase5YEvidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), LV_LAND_QDOT_BLOCKER_LOCALIZATION_PHASE5Y_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
