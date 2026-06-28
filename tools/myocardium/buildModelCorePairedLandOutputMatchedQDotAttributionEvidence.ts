import qDotAttributionArtifact from "@/data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { PREVIEW_SETTLE_POLICY } from "@/engine/settling";
import { stableHash, sanitizeForStableHash } from "@/engine/myocardium/kinematics/stableHash";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { runLowPreloadDebug } from "@/tools/debugStarlingLowPreload";
import {
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
  createModelCoreActiveSourcePressureAdapterInvocationCounts,
  legacyActiveStressLvSourceOnlyProvider,
} from "@/tools/myocardium/modelCoreActiveSourcePressureAdapter";
import {
  MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  land2017LvSourceOnlyProvider,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";
import {
  MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID,
} from "@/tools/myocardium/buildModelCorePairedLandQDotClampAttributionEvidence";
import type {
  ModelCorePairedLandClampAttributionTrace,
} from "@/tools/myocardium/buildModelCorePairedLandSourceProviderEvidence";

export const MODELCORE_PAIRED_LAND_OUTPUT_MATCHED_QDOT_ATTRIBUTION_EVIDENCE_ID =
  "modelcore-paired-land-output-matched-qdot-attribution-result-v1";

const PHASE5C_N_PREDECLARED_DELTAS_ML = [-1250, -1000, -750, -500, 0, 500, 1000] as const;
const PINNED_DELTA_ML = LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl;
const SETTLE_POLICY = { ...PREVIEW_SETTLE_POLICY, capSeconds: 45 } as const;
const OUTPUT_MATCH_MEAN_SCORE_MAX = 0.15;
const OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX = 0.2;

type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];
type LowPreloadBeatTraceRow = LowPreloadDebugPoint["beatTrace"][number];

export type ModelCorePairedLandOutputMatchStatus = "matched" | "not-overlapped" | "inconclusive";

export type ModelCorePairedLandOutputMatchedQDotRunPoint = {
  readonly sourceProviderId: string;
  readonly deltaVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly closureStableHash: string;
  readonly independentlyInitializedPoint: true;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleActualSeconds: number | null;
  readonly settleBeats: number;
  readonly periodBeats: number;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly worstSignal: string | null;
  readonly worstDelta: number;
  readonly healthStatus: string;
  readonly healthMessages: readonly string[];
  readonly tbvClassification: string;
  readonly tbvSanitizeAbsMl: number;
  readonly tbvProjectionAppliedMl: number;
  readonly maxValveReverseMl: number;
  readonly CO_L: number;
  readonly SV_L: number;
  readonly QAoPeakMlPerSec: number;
  readonly peakSigmaActPa: number;
  readonly qAoCapRatioMax: number;
  readonly finiteTracePayload: boolean;
  readonly providerInstrumentation: {
    readonly sourceActiveStressCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
  };
  readonly clampAttributionTrace: ModelCorePairedLandClampAttributionTrace;
};

export type ModelCorePairedLandOutputMatchedQDotPair = {
  readonly deltaVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly sameClosureStableHash: boolean;
  readonly sourceProviderDifferenceOnlyWithinPoint: boolean;
  readonly legacy: ModelCorePairedLandOutputMatchedQDotRunPoint;
  readonly land: ModelCorePairedLandOutputMatchedQDotRunPoint;
  readonly comparison: {
    readonly landVsLegacyPeriodBeatsDelta: number;
    readonly landVsLegacyCOLDeltaLMin: number;
    readonly landVsLegacySVDeltaMl: number;
    readonly landVsLegacyQAoPeakDeltaMlPerSec: number;
    readonly landVsLegacyPeakSigmaActDeltaPa: number;
    readonly landVsLegacyAoVQDotClampHitFractionDelta: number;
    readonly landVsLegacyAoVQDotMaxRawAbsMlPerS2Delta: number;
    readonly landVsLegacyQAoCapRatioMaxDelta: number;
  };
};

export type ModelCorePairedLandOutputMatchCandidate = {
  readonly deltaVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly periodBeats: number;
  readonly aovQDotClampHitFraction: number;
  readonly meanNormalizedScore: number;
  readonly relativeErrors: {
    readonly CO_L: number;
    readonly SV_L: number;
    readonly QAoPeakMlPerSec: number;
  };
  readonly candidateOutputs: {
    readonly CO_L: number;
    readonly SV_L: number;
    readonly QAoPeakMlPerSec: number;
  };
};

export type ModelCorePairedLandOutputMatchedQDotAttributionEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MODELCORE_PAIRED_LAND_OUTPUT_MATCHED_QDOT_ATTRIBUTION_EVIDENCE_ID;
  readonly phase: "Phase 5C-N";
  readonly claimBoundary: "predeclared-tbv-axis-output-match-diagnostic-only";
  readonly upstreamQDotAttributionEvidenceId: typeof MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID;
  readonly upstreamQDotAttributionResultArtifactId: string;
  readonly upstreamQDotAttributionResultArtifactPath:
    "data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json";
  readonly verifierScript: "verify:myocardium-modelcore-paired-land-output-matched-qdot-attribution";
  readonly diagnosticProtocol: {
    readonly baselineTotalBloodVolumeMl: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl;
    readonly pinnedDeltaTotalBloodVolumeMl: typeof PINNED_DELTA_ML;
    readonly pinnedEffectiveTotalBloodVolumeMl: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.effectiveTotalBloodVolumeMl;
    readonly predeclaredDeltasMl: readonly number[];
    readonly integrationDtSec: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec;
    readonly sampleHz: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz;
    readonly traceBeats: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats;
    readonly settlePolicy: {
      readonly tolPrimary: number;
      readonly tolShape: number;
      readonly consecutiveBeats: number;
      readonly minBeats: number;
      readonly capSeconds: 45;
      readonly postSettleBeats: number;
    };
    readonly pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start";
  };
  readonly boundary: {
    readonly sourceProviderDifferenceOnlyScope: "within-each-same-effective-tbv-pair-only";
    readonly crossTbvOutputMatchIsSourceProviderOnly: false;
    readonly preloadAxisMode: "predeclared-diagnostic-grid-not-accepted-tuning";
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly preloadTuning: false;
    readonly allPointsReported: true;
  };
  readonly runHealth: {
    readonly allPointsSettledWithoutCap: boolean;
    readonly capReachedPointCount: number;
    readonly nonOkHealthPointCount: number;
    readonly contaminatedTbvPointCount: number;
    readonly finiteTracePayloadAllPoints: boolean;
  };
  readonly matrix: readonly ModelCorePairedLandOutputMatchedQDotPair[];
  readonly pinnedPointReproduction: {
    readonly deltaVolumeMl: typeof PINNED_DELTA_ML;
    readonly legacyPeriodBeats: 2;
    readonly landPeriodBeats: 1;
    readonly legacyAoVQDotClampHitFraction: number;
    readonly landAoVQDotClampHitFraction: number;
    readonly landVsLegacyQAoPeakDeltaMlPerSec: number;
  };
  readonly outputMatchAnalysis: {
    readonly target: "legacy-pinned-period2-positive-control";
    readonly targetDeltaVolumeMl: typeof PINNED_DELTA_ML;
    readonly targetEffectiveTotalBloodVolumeMl: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.effectiveTotalBloodVolumeMl;
    readonly targetOutputs: {
      readonly CO_L: number;
      readonly SV_L: number;
      readonly QAoPeakMlPerSec: number;
    };
    readonly status: ModelCorePairedLandOutputMatchStatus;
    readonly threshold: {
      readonly meanNormalizedScoreMax: typeof OUTPUT_MATCH_MEAN_SCORE_MAX;
      readonly eachMetricRelativeErrorMax: typeof OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX;
    };
    readonly bestLandCandidate: ModelCorePairedLandOutputMatchCandidate;
    readonly landOutputRange: {
      readonly CO_L: { readonly min: number; readonly max: number };
      readonly SV_L: { readonly min: number; readonly max: number };
      readonly QAoPeakMlPerSec: { readonly min: number; readonly max: number };
    };
    readonly bestLandToPinnedLegacyRatios: {
      readonly CO_L: number;
      readonly SV_L: number;
      readonly QAoPeakMlPerSec: number;
    };
  };
  readonly attributionInterpretation: {
    readonly classification:
      | "preload-axis-output-match-not-achieved-clamp-avoidance-risk-remains"
      | "output-matched-land-period1-clamp-risk-reduced-not-final"
      | "output-match-diagnostic-inconclusive";
    readonly structuralAlternansRemovalClaim: "not-established";
    readonly finalNoAlternansClaim: "not-claimed";
    readonly officialMorphologyAcceptance: "not-claimed";
    readonly summary: string;
    readonly requiredNextChecks: readonly string[];
  };
  readonly doesNotUnlock: readonly string[];
};

type ProviderRunSet = {
  readonly sourceProviderId: string;
  readonly points: readonly ModelCorePairedLandOutputMatchedQDotRunPoint[];
};

type ProviderPointInstrumentation =
  ModelCorePairedLandOutputMatchedQDotRunPoint["providerInstrumentation"];

type ProviderPointRunContext = {
  readonly experimentalModelCoreOptions: ModelCoreExperimentalOptions;
  readonly instrumentation: () => ProviderPointInstrumentation;
};

export function buildModelCorePairedLandOutputMatchedQDotAttributionEvidence():
ModelCorePairedLandOutputMatchedQDotAttributionEvidence {
  const legacy = runProviderGrid(
    MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
    () => {
      const counts = createModelCoreActiveSourcePressureAdapterInvocationCounts();
      return {
        experimentalModelCoreOptions: {
          activeSourceProviders: { LV: legacyActiveStressLvSourceOnlyProvider(counts) },
        },
        instrumentation: () => ({
          sourceActiveStressCallCount: counts.sourceActiveStressPa,
          commitProviderStateAfterStepCount: 0,
          landSolveFailureCount: 0,
        }),
      };
    },
  );
  const land = runProviderGrid(
    MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
    () => {
      const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
      return {
        experimentalModelCoreOptions: {
          activeSourceProviders: { LV: land2017LvSourceOnlyProvider(instrumentation) },
        },
        instrumentation: () => ({
          sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
          commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
          landSolveFailureCount: instrumentation.landSolveFailureCount,
        }),
      };
    },
  );
  const matrix = buildMatrix(legacy, land);
  const pinnedPair = requirePinnedPair(matrix);
  const outputMatchAnalysis = analyzeOutputMatch(pinnedPair.legacy, land.points);
  const classification = classifyOutputMatch(pinnedPair, outputMatchAnalysis);

  return {
    schemaVersion: 1,
    id: MODELCORE_PAIRED_LAND_OUTPUT_MATCHED_QDOT_ATTRIBUTION_EVIDENCE_ID,
    phase: "Phase 5C-N",
    claimBoundary: "predeclared-tbv-axis-output-match-diagnostic-only",
    upstreamQDotAttributionEvidenceId: MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID,
    upstreamQDotAttributionResultArtifactId: qDotAttributionArtifact.id,
    upstreamQDotAttributionResultArtifactPath:
      "data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json",
    verifierScript: "verify:myocardium-modelcore-paired-land-output-matched-qdot-attribution",
    diagnosticProtocol: {
      baselineTotalBloodVolumeMl: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl,
      pinnedDeltaTotalBloodVolumeMl: PINNED_DELTA_ML,
      pinnedEffectiveTotalBloodVolumeMl: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.effectiveTotalBloodVolumeMl,
      predeclaredDeltasMl: [...PHASE5C_N_PREDECLARED_DELTAS_ML],
      integrationDtSec: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec,
      sampleHz: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz,
      traceBeats: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats,
      settlePolicy: {
        tolPrimary: SETTLE_POLICY.tolPrimary,
        tolShape: SETTLE_POLICY.tolShape,
        consecutiveBeats: SETTLE_POLICY.consecutiveBeats,
        minBeats: SETTLE_POLICY.minBeats,
        capSeconds: 45,
        postSettleBeats: SETTLE_POLICY.postSettleBeats,
      },
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
    },
    boundary: {
      sourceProviderDifferenceOnlyScope: "within-each-same-effective-tbv-pair-only",
      crossTbvOutputMatchIsSourceProviderOnly: false,
      preloadAxisMode: "predeclared-diagnostic-grid-not-accepted-tuning",
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noLandParameterTuning: true,
      preloadTuning: false,
      allPointsReported: true,
    },
    runHealth: runHealth(matrix),
    matrix,
    pinnedPointReproduction: {
      deltaVolumeMl: PINNED_DELTA_ML,
      legacyPeriodBeats: 2,
      landPeriodBeats: 1,
      legacyAoVQDotClampHitFraction:
        pinnedPair.legacy.clampAttributionTrace.aovQDotClampHitFraction,
      landAoVQDotClampHitFraction:
        pinnedPair.land.clampAttributionTrace.aovQDotClampHitFraction,
      landVsLegacyQAoPeakDeltaMlPerSec:
        pinnedPair.comparison.landVsLegacyQAoPeakDeltaMlPerSec,
    },
    outputMatchAnalysis,
    attributionInterpretation: {
      classification,
      structuralAlternansRemovalClaim: "not-established",
      finalNoAlternansClaim: "not-claimed",
      officialMorphologyAcceptance: "not-claimed",
      summary: interpretationSummary(classification),
      requiredNextChecks: [
        "SDIRK2-reference-before-final-no-alternans",
        "explicit-output-forcing-or-owner-approved-match-axis-before-structural-attribution",
        "preload-domain-sweep-before-domain-claim",
      ],
    },
    doesNotUnlock: [
      "runtimeReplacement",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
      "structuralAlternansRemoval",
      "qDotTuning",
      "valveThresholdTuning",
      "arterialLoadTuning",
      "preloadTuning",
      "landParameterTuning",
      "TriSegAdoption",
      "StudioScientificValidityClaim",
    ],
  };
}

function runProviderGrid(
  sourceProviderId: string,
  createContext: () => ProviderPointRunContext,
):
ProviderRunSet {
  return {
    sourceProviderId,
    points: PHASE5C_N_PREDECLARED_DELTAS_ML.map((delta) => {
      const context = createContext();
      return summarizeRunPoint(
        runSinglePoint(delta, context.experimentalModelCoreOptions),
        sourceProviderId,
        delta,
        context.instrumentation(),
      );
    }),
  };
}

function runSinglePoint(
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
    experimentalModelCoreOptions,
  });
  const point = debugReport.points[0];
  if (!point || debugReport.points.length !== 1) {
    throw new Error("Phase 5C-N output-match diagnostic expects exactly one independently initialized debug point.");
  }
  return point;
}

function summarizeRunPoint(
  point: LowPreloadDebugPoint,
  sourceProviderId: string,
  deltaVolumeMl: number,
  providerInstrumentation: ProviderPointInstrumentation,
): ModelCorePairedLandOutputMatchedQDotRunPoint {
  const payload = tracePayload(point);
  const periodBeatTrace = trailingPeriodBeatTrace(point);
  return {
    sourceProviderId,
    deltaVolumeMl,
    effectiveTotalBloodVolumeMl: point.targetVolumeMl,
    closureStableHash: closureStableHash(deltaVolumeMl),
    independentlyInitializedPoint: true,
    settled: point.settle.settled,
    settleReason: point.settle.reason,
    settleActualSeconds: point.settle.actualSeconds,
    settleBeats: point.settle.beats,
    periodBeats: point.settle.periodBeats,
    adjacentDelta: point.settle.adjacentDelta,
    periodDelta: point.settle.periodDelta,
    worstSignal: point.settle.worstSignal,
    worstDelta: point.settle.worstDelta,
    healthStatus: point.health.status,
    healthMessages: point.health.messages,
    tbvClassification: point.tbvAudit.classification,
    tbvSanitizeAbsMl: point.tbvAudit.sanitizeAbsMl,
    tbvProjectionAppliedMl: point.tbvAudit.projectionAbsAppliedMl,
    maxValveReverseMl: maxValveReverseMl(point),
    CO_L: point.periodMetrics.CO_L,
    SV_L: point.periodMetrics.SV_L,
    QAoPeakMlPerSec: periodAwareMax(point.beatTrace, point.settle.periodBeats, (beat) => beat.QAoMax),
    peakSigmaActPa: periodAwareMax(
      periodBeatTrace,
      periodBeatTrace.length,
      (beat) => beat.active.LV?.sigmaActTargetMax ?? Number.NaN,
    ),
    qAoCapRatioMax: maxBeat(point.beatTrace, (beat) => beat.QAoCapRatioMax),
    finiteTracePayload: allFiniteNumbers(payload),
    providerInstrumentation,
    clampAttributionTrace: clampAttributionTrace(point),
  };
}

function closureStableHash(deltaVolumeMl: number): string {
  return stableHash(sanitizeForStableHash({
    fixedLowPreloadProtocol: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    diagnosticPoint: {
      deltaVolumeMl,
      effectiveTotalBloodVolumeMl:
        LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl + deltaVolumeMl,
    },
    lowPreloadOptionsWithoutProvider: {
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
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
    },
  }));
}

function buildMatrix(
  legacy: ProviderRunSet,
  land: ProviderRunSet,
): readonly ModelCorePairedLandOutputMatchedQDotPair[] {
  if (legacy.points.length !== land.points.length) {
    throw new Error("Phase 5C-N legacy/Land grids must have the same number of points.");
  }
  return legacy.points.map((legacyPoint, index) => {
    const landPoint = land.points[index];
    if (!landPoint || legacyPoint.deltaVolumeMl !== landPoint.deltaVolumeMl) {
      throw new Error("Phase 5C-N legacy/Land grids must use matching predeclared deltas.");
    }
    const sameClosureStableHash = legacyPoint.closureStableHash === landPoint.closureStableHash;
    const sourceProvidersInvokedWithinPoint =
      legacyPoint.providerInstrumentation.sourceActiveStressCallCount > 0
      && landPoint.providerInstrumentation.sourceActiveStressCallCount > 0
      && landPoint.providerInstrumentation.commitProviderStateAfterStepCount > 0
      && landPoint.providerInstrumentation.landSolveFailureCount === 0;
    return {
      deltaVolumeMl: legacyPoint.deltaVolumeMl,
      effectiveTotalBloodVolumeMl: legacyPoint.effectiveTotalBloodVolumeMl,
      sameClosureStableHash,
      sourceProviderDifferenceOnlyWithinPoint: sameClosureStableHash && sourceProvidersInvokedWithinPoint,
      legacy: legacyPoint,
      land: landPoint,
      comparison: {
        landVsLegacyPeriodBeatsDelta: landPoint.periodBeats - legacyPoint.periodBeats,
        landVsLegacyCOLDeltaLMin: landPoint.CO_L - legacyPoint.CO_L,
        landVsLegacySVDeltaMl: landPoint.SV_L - legacyPoint.SV_L,
        landVsLegacyQAoPeakDeltaMlPerSec: landPoint.QAoPeakMlPerSec - legacyPoint.QAoPeakMlPerSec,
        landVsLegacyPeakSigmaActDeltaPa: landPoint.peakSigmaActPa - legacyPoint.peakSigmaActPa,
        landVsLegacyAoVQDotClampHitFractionDelta:
          landPoint.clampAttributionTrace.aovQDotClampHitFraction
          - legacyPoint.clampAttributionTrace.aovQDotClampHitFraction,
        landVsLegacyAoVQDotMaxRawAbsMlPerS2Delta:
          landPoint.clampAttributionTrace.aovQDotMaxRawAbsMlPerS2
          - legacyPoint.clampAttributionTrace.aovQDotMaxRawAbsMlPerS2,
        landVsLegacyQAoCapRatioMaxDelta: landPoint.qAoCapRatioMax - legacyPoint.qAoCapRatioMax,
      },
    };
  });
}

function requirePinnedPair(matrix: readonly ModelCorePairedLandOutputMatchedQDotPair[]):
ModelCorePairedLandOutputMatchedQDotPair {
  const pinned = matrix.find((pair) => pair.deltaVolumeMl === PINNED_DELTA_ML);
  if (!pinned) throw new Error("Phase 5C-N matrix must include the Phase 5C-L/M pinned point.");
  return pinned;
}

function analyzeOutputMatch(
  targetLegacy: ModelCorePairedLandOutputMatchedQDotRunPoint,
  landPoints: readonly ModelCorePairedLandOutputMatchedQDotRunPoint[],
): ModelCorePairedLandOutputMatchedQDotAttributionEvidence["outputMatchAnalysis"] {
  const candidates = landPoints
    .filter((point) => point.settled && point.settleReason === "converged" && point.healthStatus === "ok")
    .map((point) => outputMatchCandidate(targetLegacy, point))
    .sort((a, b) => a.meanNormalizedScore - b.meanNormalizedScore);
  const bestLandCandidate = candidates[0] ?? outputMatchCandidate(targetLegacy, landPoints[0]);
  if (!bestLandCandidate) {
    throw new Error("Phase 5C-N requires at least one Land output-match candidate.");
  }
  const eachMetricWithinThreshold =
    bestLandCandidate.relativeErrors.CO_L <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX
    && bestLandCandidate.relativeErrors.SV_L <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX
    && bestLandCandidate.relativeErrors.QAoPeakMlPerSec <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX;
  const status = bestLandCandidate.meanNormalizedScore <= OUTPUT_MATCH_MEAN_SCORE_MAX && eachMetricWithinThreshold
    ? "matched"
    : candidates.length > 0
      ? "not-overlapped"
      : "inconclusive";
  const landOutputRange = {
    CO_L: minMax(landPoints.map((point) => point.CO_L)),
    SV_L: minMax(landPoints.map((point) => point.SV_L)),
    QAoPeakMlPerSec: minMax(landPoints.map((point) => point.QAoPeakMlPerSec)),
  };
  return {
    target: "legacy-pinned-period2-positive-control",
    targetDeltaVolumeMl: PINNED_DELTA_ML,
    targetEffectiveTotalBloodVolumeMl: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.effectiveTotalBloodVolumeMl,
    targetOutputs: {
      CO_L: targetLegacy.CO_L,
      SV_L: targetLegacy.SV_L,
      QAoPeakMlPerSec: targetLegacy.QAoPeakMlPerSec,
    },
    status,
    threshold: {
      meanNormalizedScoreMax: OUTPUT_MATCH_MEAN_SCORE_MAX,
      eachMetricRelativeErrorMax: OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX,
    },
    bestLandCandidate,
    landOutputRange,
    bestLandToPinnedLegacyRatios: {
      CO_L: safeRatio(bestLandCandidate.candidateOutputs.CO_L, targetLegacy.CO_L),
      SV_L: safeRatio(bestLandCandidate.candidateOutputs.SV_L, targetLegacy.SV_L),
      QAoPeakMlPerSec: safeRatio(bestLandCandidate.candidateOutputs.QAoPeakMlPerSec, targetLegacy.QAoPeakMlPerSec),
    },
  };
}

function outputMatchCandidate(
  target: ModelCorePairedLandOutputMatchedQDotRunPoint,
  candidate: ModelCorePairedLandOutputMatchedQDotRunPoint | undefined,
): ModelCorePairedLandOutputMatchCandidate {
  if (!candidate) throw new Error("Phase 5C-N output-match candidate is missing.");
  const relativeErrors = {
    CO_L: normalizedError(candidate.CO_L, target.CO_L, 1),
    SV_L: normalizedError(candidate.SV_L, target.SV_L, 10),
    QAoPeakMlPerSec: normalizedError(candidate.QAoPeakMlPerSec, target.QAoPeakMlPerSec, 100),
  };
  return {
    deltaVolumeMl: candidate.deltaVolumeMl,
    effectiveTotalBloodVolumeMl: candidate.effectiveTotalBloodVolumeMl,
    periodBeats: candidate.periodBeats,
    aovQDotClampHitFraction: candidate.clampAttributionTrace.aovQDotClampHitFraction,
    meanNormalizedScore:
      (relativeErrors.CO_L + relativeErrors.SV_L + relativeErrors.QAoPeakMlPerSec) / 3,
    relativeErrors,
    candidateOutputs: {
      CO_L: candidate.CO_L,
      SV_L: candidate.SV_L,
      QAoPeakMlPerSec: candidate.QAoPeakMlPerSec,
    },
  };
}

function normalizedError(actual: number, target: number, floor: number): number {
  return Math.abs(actual - target) / Math.max(Math.abs(target), floor);
}

function safeRatio(actual: number, target: number): number {
  if (!Number.isFinite(actual) || !Number.isFinite(target) || Math.abs(target) <= 0) return Number.NaN;
  return actual / target;
}

function minMax(values: readonly number[]): { readonly min: number; readonly max: number } {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { min: Number.NaN, max: Number.NaN };
  return { min: Math.min(...finite), max: Math.max(...finite) };
}

function runHealth(matrix: readonly ModelCorePairedLandOutputMatchedQDotPair[]):
ModelCorePairedLandOutputMatchedQDotAttributionEvidence["runHealth"] {
  const points = matrix.flatMap((pair) => [pair.legacy, pair.land]);
  return {
    allPointsSettledWithoutCap:
      points.every((point) =>
        point.settled
        && point.settleReason === "converged"
        && point.settleActualSeconds != null
        && point.settleActualSeconds < SETTLE_POLICY.capSeconds
      ),
    capReachedPointCount: points.filter((point) =>
      point.settleReason === "cap"
      || point.settleActualSeconds == null
      || point.settleActualSeconds >= SETTLE_POLICY.capSeconds
    ).length,
    nonOkHealthPointCount: points.filter((point) => point.healthStatus !== "ok").length,
    contaminatedTbvPointCount: points.filter((point) => point.tbvClassification !== "clean").length,
    finiteTracePayloadAllPoints: points.every((point) => point.finiteTracePayload),
  };
}

function classifyOutputMatch(
  pinnedPair: ModelCorePairedLandOutputMatchedQDotPair,
  outputMatchAnalysis: ModelCorePairedLandOutputMatchedQDotAttributionEvidence["outputMatchAnalysis"],
): ModelCorePairedLandOutputMatchedQDotAttributionEvidence["attributionInterpretation"]["classification"] {
  return classifyOutputMatchStatus(
    outputMatchAnalysis.status,
    outputMatchAnalysis.bestLandCandidate.periodBeats,
    outputMatchAnalysis.bestLandCandidate.aovQDotClampHitFraction,
    pinnedPair.legacy.clampAttributionTrace.aovQDotClampHitFraction,
  );
}

export function classifyOutputMatchStatus(
  status: ModelCorePairedLandOutputMatchStatus,
  bestLandPeriodBeats: number,
  bestLandAoVQDotClampHitFraction: number,
  legacyAoVQDotClampHitFraction: number,
): ModelCorePairedLandOutputMatchedQDotAttributionEvidence["attributionInterpretation"]["classification"] {
  if (status === "not-overlapped") return "preload-axis-output-match-not-achieved-clamp-avoidance-risk-remains";
  if (
    status === "matched"
    && bestLandPeriodBeats === 1
    && bestLandAoVQDotClampHitFraction >= legacyAoVQDotClampHitFraction * 0.75
  ) {
    return "output-matched-land-period1-clamp-risk-reduced-not-final";
  }
  return "output-match-diagnostic-inconclusive";
}

function interpretationSummary(
  classification: ModelCorePairedLandOutputMatchedQDotAttributionEvidence["attributionInterpretation"]["classification"],
): string {
  if (classification === "preload-axis-output-match-not-achieved-clamp-avoidance-risk-remains") {
    return "The predeclared TBV-axis diagnostic did not find a Land operating point that output-matches the pinned legacy period-2 positive control; Land remains below the AoV qDot clamp-engaged regime, so clamp-threshold avoidance remains unresolved.";
  }
  if (classification === "output-matched-land-period1-clamp-risk-reduced-not-final") {
    return "A predeclared diagnostic point output-matches the pinned legacy period-2 positive control while Land remains period-1 with comparable AoV qDot clamp engagement; this reduces but does not eliminate the attribution risk.";
  }
  return "The predeclared output-match diagnostic does not determine whether Land period-1 reflects structural damping or operating-point avoidance.";
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

export function periodAwareMax<T>(rows: readonly T[], periodBeats: number, value: (row: T) => number): number {
  const periodRows = rows.slice(-boundedPeriodBeatCount(rows.length, periodBeats));
  return Math.max(0, ...periodRows.map(value).filter(Number.isFinite));
}

function trailingPeriodBeatTrace(point: LowPreloadDebugPoint): readonly LowPreloadBeatTraceRow[] {
  return point.beatTrace.slice(-boundedPeriodBeatCount(point.beatTrace.length, point.settle.periodBeats));
}

function boundedPeriodBeatCount(rowCount: number, periodBeats: number): number {
  if (rowCount <= 0) return 0;
  if (!Number.isFinite(periodBeats) || periodBeats < 1) return 1;
  return Math.max(1, Math.min(rowCount, Math.trunc(periodBeats)));
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

function maxValveReverseMl(point: LowPreloadDebugPoint): number {
  return Math.max(
    point.valveVolumesMl.MVReverse,
    point.valveVolumesMl.AoVReverse,
    point.valveVolumesMl.TVReverse,
    point.valveVolumesMl.PVReverse,
  );
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
  const normalizedScriptPath = path.normalize("tools/myocardium/buildModelCorePairedLandOutputMatchedQDotAttributionEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCorePairedLandOutputMatchedQDotAttributionEvidence(), null, 2));
}
