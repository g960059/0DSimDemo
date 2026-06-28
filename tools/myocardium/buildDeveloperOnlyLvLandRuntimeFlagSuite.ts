import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5SArtifact from "@/data/myocardium/protocols/modelcore-land-operating-point-calibration-result-v1.json";
import phase5UArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { runLowPreloadDebug } from "@/tools/debugStarlingLowPreload";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import { createModelCoreLand2017LvSourceProviderInstrumentation } from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_SUITE_ID =
  "myocardium-developer-only-lv-land-runtime-flag-suite-result-v1";

type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];
type BeatTraceRow = LowPreloadDebugPoint["beatTrace"][number];

type Phase5SLandPoint = {
  readonly deltaVolumeMl: number;
  readonly sourceProviderId: string;
  readonly settled: boolean;
  readonly healthStatus: string;
  readonly settleReason: string;
  readonly periodBeats: number;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly tbvClassification: string;
  readonly maxValveReverseMl: number;
  readonly CO_L: number;
  readonly SV_L: number;
  readonly EDV_L: number;
  readonly ESV_L: number;
  readonly LVPMax: number;
  readonly AoPMean: number;
  readonly AoPMax: number;
  readonly QAoPeakMlPerSec: number;
  readonly peakSigmaActPa: number;
  readonly qAoCapRatioMax: number;
  readonly aovQDotClampHitFraction: number;
  readonly mvAForwardMl: number;
  readonly mvAFraction: number | null;
  readonly fillingMorphologyClass: string;
};

export type DeveloperOnlyLvLandRuntimeFlagSuitePoint = {
  readonly deltaVolumeMl: number;
  readonly pointRole: "pinned-low-preload-edge" | "baseline-operating-point" | "high-volume-diagnostic-point";
  readonly sourceProviderId: string;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly periodBeats: number;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly healthStatus: string;
  readonly healthMessages: readonly string[];
  readonly tbvClassification: string;
  readonly maxValveReverseMl: number;
  readonly CO_L: number;
  readonly SV_L: number;
  readonly QAoPeakMlPerSec: number;
  readonly peakSigmaActPa: number;
  readonly aovQDotClampHitFraction: number;
  readonly providerInstrumentation: {
    readonly sourceActiveStressCallCount: number;
    readonly debugActiveStressTermsCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
    readonly landSolveOkCount: number;
    readonly maxSolverResidualNorm: number;
    readonly sourcePathAuditSampleCount: number;
    readonly commitPathAuditSampleCount: number;
  };
  readonly phase5SComparison: {
    readonly phase5SSourceProviderId: string;
    readonly sameSettled: boolean;
    readonly sameHealthStatus: boolean;
    readonly sameSettleReason: boolean;
    readonly samePeriodBeats: boolean;
    readonly sameTbvClassification: boolean;
    readonly sameFillingMorphologyClass: boolean;
    readonly metricsNearPhase5S: boolean;
    readonly maxRelativeMetricError: number;
    readonly comparedMetricIds: readonly string[];
  };
};

export type DeveloperOnlyLvLandRuntimeFlagSuiteEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_SUITE_ID;
  readonly phase: "Phase 5V";
  readonly claimBoundary: "developer-only-runtime-flag-implementation-diagnostic-only";
  readonly upstreamPhase5SArtifactId: typeof phase5SArtifact.id;
  readonly upstreamPhase5UArtifactId: typeof phase5UArtifact.id;
  readonly verifierScript: "verify:myocardium-developer-only-lv-land-runtime-flag-suite";
  readonly ownerGoScope: {
    readonly status: "go-developer-only-implementation-only";
    readonly source: "oracle-direction-review-3-2";
    readonly productionRuntimeReplacement: "no-go";
    readonly officialCaseWiring: "no-go";
    readonly workbenchRuntimeWiring: "no-go";
    readonly stateSchemaMigration: "no-go";
  };
  readonly implementationStatus: {
    readonly developerOnlyFlagPathImplemented: true;
    readonly explicitAcknowledgementRequired: true;
    readonly productionRuntimeWiring: "absent";
    readonly officialCaseWiring: "absent";
    readonly workbenchRuntimeWiring: "absent";
    readonly stateSchemaMigration: "absent";
    readonly runtimeFlagUi: "absent";
    readonly productionRegistryIntegration: "absent";
  };
  readonly diagnosticProtocol: {
    readonly suiteMode: "phase5s-equivalent-operating-suite-via-developer-only-helper";
    readonly diagnosticDeltasMl: readonly number[];
    readonly mainDomainDeltasMl: readonly number[];
    readonly sourceProviderScope: "LV-only";
    readonly calciumMappingScenario: "phase2b-absolute-peak-ca";
    readonly commitScheme: "BE";
    readonly preloadAxisMode: "fixed-diagnostic-operating-points-not-tuning";
    readonly pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start";
  };
  readonly runHealth: {
    readonly pointCount: number;
    readonly pointsSettledByConvergence: number;
    readonly pointsCapOrNonOk: number;
    readonly landSolveFailureCount: number;
    readonly sourceCallsPresentEveryPoint: boolean;
    readonly commitCallsPresentEveryPoint: boolean;
    readonly sourceAuditSamplesPresentEveryPoint: boolean;
    readonly commitAuditSamplesPresentEveryPoint: boolean;
    readonly mainDomainAllPeriod1: boolean;
    readonly mainDomainOutputReproducesPhase5S: boolean;
    readonly allPointsReproducePhase5S: boolean;
  };
  readonly points: readonly DeveloperOnlyLvLandRuntimeFlagSuitePoint[];
  readonly boundary: {
    readonly noRuntimeReplacement: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noRuntimeFlagUi: true;
    readonly noProductionRegistryIntegration: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noSourceStressScaling: true;
    readonly noLevel3Acceptance: true;
    readonly noLevel4Acceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noStructuralAlternansRemovalClaim: true;
  };
  readonly nextAllowedWork: readonly string[];
  readonly doesNotUnlock: readonly string[];
};

const phase5S = phase5SArtifact as unknown as {
  readonly diagnosticProtocol: {
    readonly diagnosticDeltasMl: readonly number[];
    readonly mainDomainDeltasMl: readonly number[];
  };
  readonly pairs: readonly { readonly deltaVolumeMl: number; readonly land: Phase5SLandPoint }[];
};

const METRIC_TOLERANCE = 1e-9;
const COMPARED_PHASE5S_METRIC_IDS = [
  "adjacentDelta",
  "periodDelta",
  "maxValveReverseMl",
  "CO_L",
  "SV_L",
  "EDV_L",
  "ESV_L",
  "LVPMax",
  "AoPMean",
  "AoPMax",
  "QAoPeakMlPerSec",
  "peakSigmaActPa",
  "qAoCapRatioMax",
  "aovQDotClampHitFraction",
  "mvAForwardMl",
  "mvAFraction",
] as const;

export function buildDeveloperOnlyLvLandRuntimeFlagSuiteEvidence():
DeveloperOnlyLvLandRuntimeFlagSuiteEvidence {
  const points = phase5S.diagnosticProtocol.diagnosticDeltasMl.map(runDeveloperOnlyFlagPoint);
  const runHealth = buildRunHealth(points);
  return {
    schemaVersion: 1,
    id: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_SUITE_ID,
    phase: "Phase 5V",
    claimBoundary: "developer-only-runtime-flag-implementation-diagnostic-only",
    upstreamPhase5SArtifactId: phase5SArtifact.id,
    upstreamPhase5UArtifactId: phase5UArtifact.id,
    verifierScript: "verify:myocardium-developer-only-lv-land-runtime-flag-suite",
    ownerGoScope: {
      status: "go-developer-only-implementation-only",
      source: "oracle-direction-review-3-2",
      productionRuntimeReplacement: "no-go",
      officialCaseWiring: "no-go",
      workbenchRuntimeWiring: "no-go",
      stateSchemaMigration: "no-go",
    },
    implementationStatus: {
      developerOnlyFlagPathImplemented: true,
      explicitAcknowledgementRequired: true,
      productionRuntimeWiring: "absent",
      officialCaseWiring: "absent",
      workbenchRuntimeWiring: "absent",
      stateSchemaMigration: "absent",
      runtimeFlagUi: "absent",
      productionRegistryIntegration: "absent",
    },
    diagnosticProtocol: {
      suiteMode: "phase5s-equivalent-operating-suite-via-developer-only-helper",
      diagnosticDeltasMl: phase5S.diagnosticProtocol.diagnosticDeltasMl,
      mainDomainDeltasMl: phase5S.diagnosticProtocol.mainDomainDeltasMl,
      sourceProviderScope: "LV-only",
      calciumMappingScenario: "phase2b-absolute-peak-ca",
      commitScheme: "BE",
      preloadAxisMode: "fixed-diagnostic-operating-points-not-tuning",
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
    },
    runHealth,
    points,
    boundary: {
      noRuntimeReplacement: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noRuntimeFlagUi: true,
      noProductionRegistryIntegration: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noSourceStressScaling: true,
      noLevel3Acceptance: true,
      noLevel4Acceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noStructuralAlternansRemovalClaim: true,
    },
    nextAllowedWork: [
      "education Studio static/mock MVP with limitation, caveat, health, and branch-comparison surfaces",
      "developer-only LV Land runtime flag envelope expansion through non-production harnesses only",
      "atrial bridge E0/A0/A1 shootout runner",
      "morphology blocker experiment bundle separated from myocardium parameter tuning",
    ],
    doesNotUnlock: [
      "runtimeReplacement",
      "officialCaseWiring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "runtimeFlagUi",
      "productionRegistryIntegration",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
      "structuralAlternansRemoval",
      "Level3Acceptance",
      "Level4Acceptance",
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
}

function runDeveloperOnlyFlagPoint(deltaVolumeMl: number): DeveloperOnlyLvLandRuntimeFlagSuitePoint {
  const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const flag = createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
    acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
    instrumentation,
  });
  const point = runProviderPoint(deltaVolumeMl, flag.experimentalOptions);
  const phase5SPoint = requirePhase5SLandPoint(deltaVolumeMl);
  const lastBeat = point.beatTrace[point.beatTrace.length - 1];
  const qAoPeakMlPerSec = periodAwareMax(point.beatTrace, point.settle.periodBeats, (beat) => beat.QAoMax);
  const peakSigmaActPa = periodAwareMax(trailingPeriodBeatTrace(point), point.settle.periodBeats, (beat) =>
    beat.active.LV?.sigmaActTargetMax ?? Number.NaN);
  const aovQDotClampHitFraction = clampHitFraction(point);
  const maxRelativeMetricError = maxRelativeError([
    [point.settle.adjacentDelta, phase5SPoint.adjacentDelta],
    [point.settle.periodDelta, phase5SPoint.periodDelta],
    [maxValveReverseMl(point), phase5SPoint.maxValveReverseMl],
    [point.periodMetrics.CO_L, phase5SPoint.CO_L],
    [point.periodMetrics.SV_L, phase5SPoint.SV_L],
    [lastBeat?.EDV_L ?? Number.NaN, phase5SPoint.EDV_L],
    [lastBeat?.ESV_L ?? Number.NaN, phase5SPoint.ESV_L],
    [periodAwareMax(point.beatTrace, point.settle.periodBeats, (beat) => beat.LVPMax), phase5SPoint.LVPMax],
    [periodAwareMean(point.beatTrace, point.settle.periodBeats, (beat) => beat.AoPMean), phase5SPoint.AoPMean],
    [periodAwareMax(point.beatTrace, point.settle.periodBeats, (beat) => beat.AoPMax), phase5SPoint.AoPMax],
    [qAoPeakMlPerSec, phase5SPoint.QAoPeakMlPerSec],
    [peakSigmaActPa, phase5SPoint.peakSigmaActPa],
    [maxBeat(point.beatTrace, (beat) => beat.QAoCapRatioMax), phase5SPoint.qAoCapRatioMax],
    [aovQDotClampHitFraction, phase5SPoint.aovQDotClampHitFraction],
    [lastBeat?.filling.MV_A_forward_mL ?? Number.NaN, phase5SPoint.mvAForwardMl],
    [lastBeat?.filling.MV_A_fraction ?? Number.NaN, phase5SPoint.mvAFraction ?? Number.NaN],
  ]);
  return {
    deltaVolumeMl: point.deltaVolumeMl,
    pointRole: pointRoleForDelta(point.deltaVolumeMl),
    sourceProviderId: flag.sourceProviderId,
    effectiveTotalBloodVolumeMl: point.targetVolumeMl,
    settled: point.settle.settled,
    settleReason: point.settle.reason,
    settleActualSeconds: point.settle.actualSeconds,
    periodBeats: point.settle.periodBeats,
    adjacentDelta: point.settle.adjacentDelta,
    periodDelta: point.settle.periodDelta,
    healthStatus: point.health.status,
    healthMessages: point.health.messages,
    tbvClassification: point.tbvAudit.classification,
    maxValveReverseMl: maxValveReverseMl(point),
    CO_L: point.periodMetrics.CO_L,
    SV_L: point.periodMetrics.SV_L,
    QAoPeakMlPerSec: qAoPeakMlPerSec,
    peakSigmaActPa,
    aovQDotClampHitFraction,
    providerInstrumentation: {
      sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
      debugActiveStressTermsCallCount: instrumentation.debugActiveStressTerms,
      commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
      landSolveFailureCount: instrumentation.landSolveFailureCount,
      landSolveOkCount: instrumentation.landSolveOkCount,
      maxSolverResidualNorm: instrumentation.maxSolverResidualNorm,
      sourcePathAuditSampleCount: instrumentation.sourcePathAudit.sampleCount,
      commitPathAuditSampleCount: instrumentation.commitPathAudit.sampleCount,
    },
    phase5SComparison: {
      phase5SSourceProviderId: phase5SPoint.sourceProviderId,
      sameSettled: point.settle.settled === phase5SPoint.settled,
      sameHealthStatus: point.health.status === phase5SPoint.healthStatus,
      sameSettleReason: point.settle.reason === phase5SPoint.settleReason,
      samePeriodBeats: point.settle.periodBeats === phase5SPoint.periodBeats,
      sameTbvClassification: point.tbvAudit.classification === phase5SPoint.tbvClassification,
      sameFillingMorphologyClass:
        (lastBeat?.filling.fillingMorphologyClass ?? "indeterminate") === phase5SPoint.fillingMorphologyClass,
      metricsNearPhase5S: maxRelativeMetricError <= METRIC_TOLERANCE,
      maxRelativeMetricError,
      comparedMetricIds: COMPARED_PHASE5S_METRIC_IDS,
    },
  };
}

function runProviderPoint(
  deltaVolumeMl: number,
  experimentalModelCoreOptions: ModelCoreExperimentalOptions,
): LowPreloadDebugPoint {
  const debugReport = runLowPreloadDebug({
    outDir: "",
    targetVolumeMl: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl,
    heartModel: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.heartModel,
    deltasMl: [deltaVolumeMl],
    dtValues: [LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec],
    lambdaActTauSecValues: [0],
    lambdaActScope: "all",
    traceBeats: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats,
    sampleHz: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz,
    returnMapMode: "none",
    maxReturnMapPoints: 0,
    quietClampLog: true,
    beatPairOverlay: true,
    experimentalModelCoreOptions,
  });
  const point = debugReport.points[0];
  if (!point || debugReport.points.length !== 1) {
    throw new Error("Phase 5V developer-only runtime flag suite expects one independently initialized debug point.");
  }
  return point;
}

function buildRunHealth(
  points: readonly DeveloperOnlyLvLandRuntimeFlagSuitePoint[],
): DeveloperOnlyLvLandRuntimeFlagSuiteEvidence["runHealth"] {
  const mainDomain = points.filter((point) =>
    phase5S.diagnosticProtocol.mainDomainDeltasMl.includes(point.deltaVolumeMl));
  return {
    pointCount: points.length,
    pointsSettledByConvergence: points.filter((point) => point.settled && point.settleReason === "converged").length,
    pointsCapOrNonOk: points.filter((point) => point.settleReason === "cap" || point.healthStatus !== "ok").length,
    landSolveFailureCount:
      points.reduce((sum, point) => sum + point.providerInstrumentation.landSolveFailureCount, 0),
    sourceCallsPresentEveryPoint:
      points.every((point) => point.providerInstrumentation.sourceActiveStressCallCount > 0),
    commitCallsPresentEveryPoint:
      points.every((point) => point.providerInstrumentation.commitProviderStateAfterStepCount > 0),
    sourceAuditSamplesPresentEveryPoint:
      points.every((point) => point.providerInstrumentation.sourcePathAuditSampleCount > 0),
    commitAuditSamplesPresentEveryPoint:
      points.every((point) => point.providerInstrumentation.commitPathAuditSampleCount > 0),
    mainDomainAllPeriod1: mainDomain.every((point) => point.periodBeats === 1),
    mainDomainOutputReproducesPhase5S:
      mainDomain.every((point) => point.phase5SComparison.metricsNearPhase5S),
    allPointsReproducePhase5S:
      points.every((point) =>
        point.phase5SComparison.sameSettled
        && point.phase5SComparison.sameHealthStatus
        && point.phase5SComparison.samePeriodBeats
        && point.phase5SComparison.metricsNearPhase5S),
  };
}

function requirePhase5SLandPoint(deltaVolumeMl: number): Phase5SLandPoint {
  const pair = phase5S.pairs.find((candidate) => candidate.deltaVolumeMl === deltaVolumeMl);
  if (!pair) throw new Error(`Phase 5S artifact is missing delta ${deltaVolumeMl}.`);
  return pair.land;
}

function pointRoleForDelta(deltaVolumeMl: number): DeveloperOnlyLvLandRuntimeFlagSuitePoint["pointRole"] {
  if (deltaVolumeMl === LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl) {
    return "pinned-low-preload-edge";
  }
  if (deltaVolumeMl === 0) return "baseline-operating-point";
  return "high-volume-diagnostic-point";
}

function maxValveReverseMl(point: LowPreloadDebugPoint): number {
  return Math.max(
    Math.abs(point.valveVolumesMl.MVReverse),
    Math.abs(point.valveVolumesMl.AoVReverse),
    Math.abs(point.valveVolumesMl.TVReverse),
    Math.abs(point.valveVolumesMl.PVReverse),
  );
}

function clampHitFraction(point: LowPreloadDebugPoint): number {
  const trailing = trailingPeriodBeatTrace(point);
  const samples = trailing.reduce((sum, beat) => sum + beat.AoVQDotClampSampleCount, 0);
  if (samples <= 0) return 0;
  return trailing.reduce((sum, beat) => sum + beat.AoVQDotClampHitCount, 0) / samples;
}

function trailingPeriodBeatTrace(point: LowPreloadDebugPoint): readonly BeatTraceRow[] {
  const count = Math.max(1, point.settle.periodBeats);
  return point.beatTrace.slice(-count);
}

function periodAwareMax(
  beats: readonly BeatTraceRow[],
  periodBeats: number,
  selector: (beat: BeatTraceRow) => number,
): number {
  const selected = beats.slice(-Math.max(1, periodBeats)).map(selector).filter(Number.isFinite);
  return selected.length ? Math.max(...selected) : Number.NaN;
}

function periodAwareMean(
  beats: readonly BeatTraceRow[],
  periodBeats: number,
  selector: (beat: BeatTraceRow) => number,
): number {
  const selected = beats.slice(-Math.max(1, periodBeats)).map(selector).filter(Number.isFinite);
  return selected.length ? selected.reduce((sum, value) => sum + value, 0) / selected.length : Number.NaN;
}

function maxBeat(beats: readonly BeatTraceRow[], selector: (beat: BeatTraceRow) => number): number {
  const values = beats.map(selector).filter(Number.isFinite);
  return values.length ? Math.max(...values) : Number.NaN;
}

function maxRelativeError(pairs: readonly (readonly [number, number])[]): number {
  return Math.max(...pairs.map(([actual, expected]) => relativeError(actual, expected)));
}

function relativeError(actual: number, expected: number): number {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return Number.POSITIVE_INFINITY;
  return Math.abs(actual - expected) / Math.max(1, Math.abs(expected));
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildDeveloperOnlyLvLandRuntimeFlagSuite.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildDeveloperOnlyLvLandRuntimeFlagSuiteEvidence(), null, 2));
}
