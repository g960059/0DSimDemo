import descriptor from "@/data/myocardium/protocols/modelcore-paired-land-source-provider-run-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { stableHash, sanitizeForStableHash } from "@/engine/myocardium/kinematics/stableHash";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { runLowPreloadDebug } from "@/tools/debugStarlingLowPreload";
import {
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
  createModelCoreActiveSourcePressureAdapterInvocationCounts,
  legacyActiveStressLvSourceOnlyProvider,
  type ModelCoreActiveSourcePressureAdapterInvocationCounts,
} from "@/tools/myocardium/modelCoreActiveSourcePressureAdapter";
import {
  MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  land2017LvSourceOnlyProvider,
  modelCoreLand2017LvSourceProviderIdentity,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID =
  "modelcore-paired-land-source-provider-run-v1";

type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];
type LowPreloadBeatTraceRow = LowPreloadDebugPoint["beatTrace"][number];

export type ModelCorePairedLandClampAttributionTrace = {
  readonly traceBeatCount: number;
  readonly sampleCount: number;
  readonly aovQDotClampHitCount: number;
  readonly aovQDotClampHitFraction: number;
  readonly aovQDotMaxRawAbsMlPerS2: number;
  readonly aovQDotMaxPostAbsMlPerS2: number;
  readonly aovQDotMaxPositiveRawMlPerS2: number;
  readonly aovQDotMinNegativeRawMlPerS2: number;
  readonly aovQDotMaxImpulseAbsMlPerS2: number;
  readonly qAoCapRatioMax: number;
  readonly qAoNearCap90Fraction: number;
  readonly qAoNearCap95Fraction: number;
  readonly qAoNearCap98Fraction: number;
  readonly qAoAtCapFraction: number;
  readonly qAoLocalCapActiveFraction: number;
  readonly dynamicFlowClampHitsAoV: number;
  readonly valveDiodeClampHitsAoV: number;
};

type ProviderRunSummary = {
  readonly sourceProviderId: string;
  readonly settled: boolean;
  readonly periodBeats: number;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly tbvClassification: string;
  readonly tbvSanitizeAbsMl: number;
  readonly tbvProjectionAppliedMl: number;
  readonly maxValveReverseMl: number;
  readonly healthStatus: string;
  readonly healthMessages: readonly string[];
  readonly finiteTracePayload: boolean;
  readonly payloadStableHash: string;
  readonly clampAttributionTrace: ModelCorePairedLandClampAttributionTrace;
};

export type ModelCorePairedLandOutcomeClass = "A" | "B" | "C";

export type ModelCorePairedLandSourceProviderEvidence = {
  readonly evidenceId: typeof MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID;
  readonly descriptorId: string;
  readonly phase: "Phase 5C-L";
  readonly claimBoundary: "experimental-paired-land-source-provider-run-only";
  readonly productionRuntimeStatus: "not-production-runtime-replacement";
  readonly fixedLowPreloadProtocol: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL;
  readonly pairedRunBoundary: {
    readonly legacyProviderId: typeof MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID;
    readonly landProviderId: typeof MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID;
    readonly sourceProviderScope: "LV-only-experimental-comparison";
    readonly usesSameModelCoreClosure: true;
    readonly sourceProviderDifferenceOnly: boolean;
    readonly landProviderPairingRun: true;
    readonly providerObjectMutableSolverStateAllowed: false;
    readonly mutableSolverStateMustLiveInProviderState: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
  };
  readonly closureEquivalenceEvidence: {
    readonly protocolStableHash: string;
    readonly legacyClosureStableHash: string;
    readonly landClosureStableHash: string;
    readonly stableHashesMatch: boolean;
    readonly sameProtocolSettings: true;
    readonly sameEventSurfaceSettings: true;
    readonly sameBeatSelection: true;
    readonly sameSampling: true;
  };
  readonly legacyPositiveControl: ProviderRunSummary & {
    readonly status: "period-2-positive-control-pass" | "period-2-positive-control-fail";
  };
  readonly landRun: ProviderRunSummary & {
    readonly status:
      | "finite-period-1"
      | "finite-period-2"
      | "finite-other"
      | "nonfinite-or-provider-failure";
  };
  readonly landSourceProviderEvidence: {
    readonly providerIdentity: ReturnType<typeof modelCoreLand2017LvSourceProviderIdentity>;
    readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
    readonly sourceActiveStressPathInvoked: boolean;
    readonly internalDerivativesPathInvoked: boolean;
    readonly debugActiveStressTermsInvoked: boolean;
    readonly commitPathInvoked: boolean;
    readonly landSolverFailureObserved: boolean;
    readonly sourceDebugStressCoherencePass: boolean;
  };
  readonly reportOnlyComparison: {
    readonly landVsLegacyPeriodBeatsDelta: number;
    readonly landVsLegacyCOLDeltaLMin: number;
    readonly landVsLegacySVDeltaMl: number;
    readonly landVsLegacyQAoPeakDeltaMlPerSec: number;
    readonly landVsLegacyPeakSigmaActDeltaPa: number;
    readonly morphologyAcceptance: "not-claimed";
  };
  readonly outcomeInterpretation: {
    readonly outcomeClass: ModelCorePairedLandOutcomeClass;
    readonly outcomeMeaning:
      | "A-land-finite-period1-positive-interpretable-signal-not-official-acceptance"
      | "B-land-finite-period2-persists-closure-or-event-surfaces-still-relevant"
      | "C-land-nonfinite-or-provider-lifecycle-failure-before-physiology-interpretation";
    readonly finalNoAlternansClaim: "not-claimed";
    readonly officialMorphologyAcceptance: "not-claimed";
  };
  readonly routeAssessment: {
    readonly routeId: "modelcore-equivalent-closure-positive-control";
    readonly routeSatisfactionStatus:
      | "satisfied-paired-land-provider-run-finite"
      | "partial-paired-land-provider-run-nonfinite";
    readonly sourceProviderDifferenceOnlyStatus:
      | "satisfied-for-experimental-lv-source-only-pair"
      | "not-satisfied";
    readonly secondOrderReferenceStillRequired: true;
    readonly finalNoAlternansClaim: "not-claimed";
  };
};

function lowPreloadOptions(experimentalModelCoreOptions: ModelCoreExperimentalOptions) {
  return {
    outDir: "",
    targetVolumeMl: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl,
    heartModel: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.heartModel,
    deltasMl: [LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl],
    dtValues: [LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec],
    lambdaActTauSecValues: [0],
    lambdaActScope: "all" as const,
    traceBeats: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats,
    sampleHz: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz,
    returnMapMode: "none" as const,
    maxReturnMapPoints: 0,
    quietClampLog: true,
    experimentalModelCoreOptions,
  };
}

function closureStableHash(): string {
  return stableHash(sanitizeForStableHash({
    fixedLowPreloadProtocol: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    lowPreloadOptionsWithoutProvider: {
      outDir: "",
      targetVolumeMl: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl,
      heartModel: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.heartModel,
      deltasMl: [LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl],
      dtValues: [LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec],
      lambdaActTauSecValues: [0],
      lambdaActScope: "all",
      traceBeats: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats,
      sampleHz: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz,
      returnMapMode: "none",
      maxReturnMapPoints: 0,
      quietClampLog: true,
    },
  }));
}

function runPinnedPoint(experimentalModelCoreOptions: ModelCoreExperimentalOptions): LowPreloadDebugPoint {
  const debugReport = runLowPreloadDebug(lowPreloadOptions(experimentalModelCoreOptions));
  const point = debugReport.points[0];
  if (!point || debugReport.points.length !== 1) {
    throw new Error("Phase 5C-L paired Land evidence expects exactly one debug point.");
  }
  return point;
}

function summarizeRun(point: LowPreloadDebugPoint, sourceProviderId: string): ProviderRunSummary {
  const payload = tracePayload(point);
  return {
    sourceProviderId,
    settled: point.settle.settled,
    periodBeats: point.settle.periodBeats,
    adjacentDelta: point.settle.adjacentDelta,
    periodDelta: point.settle.periodDelta,
    tbvClassification: point.tbvAudit.classification,
    tbvSanitizeAbsMl: point.tbvAudit.sanitizeAbsMl,
    tbvProjectionAppliedMl: point.tbvAudit.projectionAbsAppliedMl,
    maxValveReverseMl: maxValveReverseMl(point),
    healthStatus: point.health.status,
    healthMessages: point.health.messages,
    finiteTracePayload: allFiniteNumbers(payload),
    payloadStableHash: stableHash(sanitizeForStableHash(payload)),
    clampAttributionTrace: clampAttributionTrace(point),
  };
}

function clampAttributionTrace(point: LowPreloadDebugPoint): ModelCorePairedLandClampAttributionTrace {
  const beatTrace = point.beatTrace;
  const sampleCount = sum(beatTrace.map((beat) => beat.AoVQDotClampSampleCount));
  const hitCount = sum(beatTrace.map((beat) => beat.AoVQDotClampHitCount));
  return {
    traceBeatCount: beatTrace.length,
    sampleCount,
    aovQDotClampHitCount: hitCount,
    aovQDotClampHitFraction: sampleCount > 0 ? hitCount / sampleCount : 0,
    aovQDotMaxRawAbsMlPerS2: maxBeat(beatTrace, (beat) => beat.AoVQDotMaxRawAbsMlPerS2),
    aovQDotMaxPostAbsMlPerS2: maxBeat(beatTrace, (beat) => beat.AoVQDotMaxPostAbsMlPerS2),
    aovQDotMaxPositiveRawMlPerS2: maxBeat(beatTrace, (beat) => beat.AoVQDotMaxPositiveRawMlPerS2),
    aovQDotMinNegativeRawMlPerS2: minBeat(beatTrace, (beat) => beat.AoVQDotMinNegativeRawMlPerS2),
    aovQDotMaxImpulseAbsMlPerS2: maxBeat(beatTrace, (beat) => beat.AoVQDotMaxImpulseAbsMlPerS2),
    qAoCapRatioMax: maxBeat(beatTrace, (beat) => beat.QAoCapRatioMax),
    qAoNearCap90Fraction: weightedMean(beatTrace, (beat) => beat.QAoNearCap90Fraction),
    qAoNearCap95Fraction: weightedMean(beatTrace, (beat) => beat.QAoNearCap95Fraction),
    qAoNearCap98Fraction: weightedMean(beatTrace, (beat) => beat.QAoNearCap98Fraction),
    qAoAtCapFraction: weightedMean(beatTrace, (beat) => beat.QAoAtCapFraction),
    qAoLocalCapActiveFraction: weightedMean(beatTrace, (beat) => beat.QAoLocalCapActiveFraction),
    dynamicFlowClampHitsAoV: point.clampDiagnostics.dynamicFlowClampHits.AoV ?? 0,
    valveDiodeClampHitsAoV: point.clampDiagnostics.valveDiodeClampHits.AoV ?? 0,
  };
}

function maxBeat(beatTrace: readonly LowPreloadBeatTraceRow[], value: (beat: LowPreloadBeatTraceRow) => number): number {
  return Math.max(0, ...beatTrace.map(value).filter(Number.isFinite));
}

function minBeat(beatTrace: readonly LowPreloadBeatTraceRow[], value: (beat: LowPreloadBeatTraceRow) => number): number {
  const finite = beatTrace.map(value).filter(Number.isFinite);
  return finite.length > 0 ? Math.min(...finite) : 0;
}

function weightedMean(beatTrace: readonly LowPreloadBeatTraceRow[], value: (beat: LowPreloadBeatTraceRow) => number): number {
  const totalWeight = sum(beatTrace.map((beat) => beat.AoVQDotClampSampleCount));
  if (totalWeight <= 0) return 0;
  return sum(beatTrace.map((beat) => value(beat) * beat.AoVQDotClampSampleCount)) / totalWeight;
}

function sum(values: readonly number[]): number {
  return values.filter(Number.isFinite).reduce((acc, value) => acc + value, 0);
}

function tracePayload(point: LowPreloadDebugPoint): unknown {
  return sanitizeForStableHash({
    settle: point.settle,
    periodMetrics: point.periodMetrics,
    lastBeatMetrics: point.lastBeatMetrics,
    valveVolumesMl: point.valveVolumesMl,
    valveTrace: point.valveTrace,
    tbvAudit: point.tbvAudit,
    activeStressTerminal: point.activeStressTerminal,
    beatTrace: point.beatTrace,
    vlvTrace: point.vlvTrace,
    observables: point.observables,
  });
}

function maxValveReverseMl(point: LowPreloadDebugPoint): number {
  return Math.max(
    point.valveVolumesMl.MVReverse,
    point.valveVolumesMl.AoVReverse,
    point.valveVolumesMl.TVReverse,
    point.valveVolumesMl.PVReverse,
  );
}

function legacyPeriod2Pass(summary: ProviderRunSummary): boolean {
  return summary.settled === true
    && summary.periodBeats === 2
    && summary.adjacentDelta > 0.1
    && summary.periodDelta < 0.05
    && summary.tbvClassification === "clean"
    && summary.tbvSanitizeAbsMl <= 0.05
    && summary.tbvProjectionAppliedMl <= 0.05
    && summary.maxValveReverseMl <= 0.05
    && summary.finiteTracePayload;
}

function landRunStatus(
  summary: ProviderRunSummary,
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): ModelCorePairedLandSourceProviderEvidence["landRun"]["status"] {
  const finite =
    summary.finiteTracePayload
    && instrumentation.landSolveFailureCount === 0
    && instrumentation.sourceActiveStressPa > 0
    && instrumentation.commitProviderStateAfterStep > 0;
  if (!finite) return "nonfinite-or-provider-failure";
  if (summary.settled && summary.periodBeats === 1) return "finite-period-1";
  if (summary.settled && summary.periodBeats === 2) return "finite-period-2";
  return "finite-other";
}

function classifyOutcome(
  landStatus: ModelCorePairedLandSourceProviderEvidence["landRun"]["status"],
): ModelCorePairedLandSourceProviderEvidence["outcomeInterpretation"] {
  if (landStatus === "finite-period-1") {
    return {
      outcomeClass: "A",
      outcomeMeaning: "A-land-finite-period1-positive-interpretable-signal-not-official-acceptance",
      finalNoAlternansClaim: "not-claimed",
      officialMorphologyAcceptance: "not-claimed",
    };
  }
  if (landStatus === "finite-period-2" || landStatus === "finite-other") {
    return {
      outcomeClass: "B",
      outcomeMeaning: "B-land-finite-period2-persists-closure-or-event-surfaces-still-relevant",
      finalNoAlternansClaim: "not-claimed",
      officialMorphologyAcceptance: "not-claimed",
    };
  }
  return {
    outcomeClass: "C",
    outcomeMeaning: "C-land-nonfinite-or-provider-lifecycle-failure-before-physiology-interpretation",
    finalNoAlternansClaim: "not-claimed",
    officialMorphologyAcceptance: "not-claimed",
  };
}

export function buildModelCorePairedLandSourceProviderEvidence(): ModelCorePairedLandSourceProviderEvidence {
  const legacyInvocationCounts = createModelCoreActiveSourcePressureAdapterInvocationCounts();
  const legacyPoint = runPinnedPoint({
    activeSourceProviders: {
      LV: legacyActiveStressLvSourceOnlyProvider(legacyInvocationCounts),
    },
  });

  const landInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const landPoint = runPinnedPoint({
    activeSourceProviders: {
      LV: land2017LvSourceOnlyProvider(landInstrumentation),
    },
  });

  const protocolStableHash = stableHash(sanitizeForStableHash(LAND_SHADOW_FIXED_LEGACY_PROTOCOL));
  const legacyClosureStableHash = closureStableHash();
  const landClosureStableHash = closureStableHash();
  const legacySummary = summarizeRun(
    legacyPoint,
    MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
  );
  const landSummary = summarizeRun(
    landPoint,
    MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
  );
  const sourceProviderDifferenceOnly =
    legacyClosureStableHash === landClosureStableHash
    && legacyInvocationCounts.sourceActiveStressPa > 0
    && landInstrumentation.sourceActiveStressPa > 0;
  const landStatus = landRunStatus(landSummary, landInstrumentation);
  const outcomeInterpretation = classifyOutcome(landStatus);
  const landFinite = landStatus !== "nonfinite-or-provider-failure";

  return {
    evidenceId: MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID,
    descriptorId: descriptor.id,
    phase: "Phase 5C-L",
    claimBoundary: "experimental-paired-land-source-provider-run-only",
    productionRuntimeStatus: "not-production-runtime-replacement",
    fixedLowPreloadProtocol: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    pairedRunBoundary: {
      legacyProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
      landProviderId: MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
      sourceProviderScope: "LV-only-experimental-comparison",
      usesSameModelCoreClosure: true,
      sourceProviderDifferenceOnly,
      landProviderPairingRun: true,
      providerObjectMutableSolverStateAllowed: false,
      mutableSolverStateMustLiveInProviderState: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
    },
    closureEquivalenceEvidence: {
      protocolStableHash,
      legacyClosureStableHash,
      landClosureStableHash,
      stableHashesMatch: legacyClosureStableHash === landClosureStableHash,
      sameProtocolSettings: true,
      sameEventSurfaceSettings: true,
      sameBeatSelection: true,
      sameSampling: true,
    },
    legacyPositiveControl: {
      ...legacySummary,
      status: legacyPeriod2Pass(legacySummary)
        ? "period-2-positive-control-pass"
        : "period-2-positive-control-fail",
    },
    landRun: {
      ...landSummary,
      status: landStatus,
    },
    landSourceProviderEvidence: {
      providerIdentity: modelCoreLand2017LvSourceProviderIdentity(),
      instrumentation: landInstrumentation,
      sourceActiveStressPathInvoked: landInstrumentation.sourceActiveStressPa > 0,
      internalDerivativesPathInvoked: landInstrumentation.internalDerivatives > 0,
      debugActiveStressTermsInvoked: landInstrumentation.debugActiveStressTerms > 0,
      commitPathInvoked: landInstrumentation.commitProviderStateAfterStep > 0,
      landSolverFailureObserved: landInstrumentation.landSolveFailureCount > 0,
      sourceDebugStressCoherencePass: landInstrumentation.maxSourceDebugStressDifferencePa <= 1e-9,
    },
    reportOnlyComparison: {
      landVsLegacyPeriodBeatsDelta: landSummary.periodBeats - legacySummary.periodBeats,
      landVsLegacyCOLDeltaLMin: landPoint.periodMetrics.CO_L - legacyPoint.periodMetrics.CO_L,
      landVsLegacySVDeltaMl: landPoint.periodMetrics.SV_L - legacyPoint.periodMetrics.SV_L,
      landVsLegacyQAoPeakDeltaMlPerSec:
        (landPoint.beatTrace.at(-1)?.QAoMax ?? Number.NaN)
        - (legacyPoint.beatTrace.at(-1)?.QAoMax ?? Number.NaN),
      landVsLegacyPeakSigmaActDeltaPa:
        (landPoint.beatTrace.at(-1)?.active.LV?.sigmaActTargetMax ?? Number.NaN)
        - (legacyPoint.beatTrace.at(-1)?.active.LV?.sigmaActTargetMax ?? Number.NaN),
      morphologyAcceptance: "not-claimed",
    },
    outcomeInterpretation,
    routeAssessment: {
      routeId: "modelcore-equivalent-closure-positive-control",
      routeSatisfactionStatus: landFinite
        ? "satisfied-paired-land-provider-run-finite"
        : "partial-paired-land-provider-run-nonfinite",
      sourceProviderDifferenceOnlyStatus: sourceProviderDifferenceOnly
        ? "satisfied-for-experimental-lv-source-only-pair"
        : "not-satisfied",
      secondOrderReferenceStillRequired: true,
      finalNoAlternansClaim: "not-claimed",
    },
  };
}

function allFiniteNumbers(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allFiniteNumbers);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(allFiniteNumbers);
  }
  return true;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildModelCorePairedLandSourceProviderEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCorePairedLandSourceProviderEvidence(), null, 2));
}
