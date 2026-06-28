import outputMatchArtifact from "@/data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json";
import activationInterfaceArtifact from "@/data/myocardium/protocols/modelcore-land-activation-interface-audit-result-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreActiveSourceProviderStateCommitCall,
  ModelCoreExperimentalActiveSourceProvider,
  ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
import type { ActiveStressDebugTerms } from "@/engine/chambers";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { stableHash, sanitizeForStableHash } from "@/engine/myocardium/kinematics/stableHash";
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
  type ModelCoreLand2017LvSignalAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MODELCORE_LAND_CALCIUM_SOURCE_FORCING_BRACKET_EVIDENCE_ID =
  "modelcore-land-calcium-source-forcing-bracket-result-v1";

const PINNED_DELTA_ML = LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl;
const BEST_LAND_DELTA_ML = outputMatchArtifact.outputMatchAnalysis.bestLandCandidate.deltaVolumeMl;
const DIAGNOSTIC_DELTAS_ML = Array.from(new Set([PINNED_DELTA_ML, BEST_LAND_DELTA_ML])).sort((a, b) => a - b);
const OUTPUT_MATCH_MEAN_SCORE_MAX = 0.25;
const OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX = 0.35;

const FORCING_SCENARIOS = [
  { scenarioId: "raw-land", axis: "baseline", calciumInputScale: 1, sourceStressScale: 1 },
  { scenarioId: "calcium-scale-3", axis: "calcium-input-scale", calciumInputScale: 3, sourceStressScale: 1 },
  { scenarioId: "calcium-scale-10", axis: "calcium-input-scale", calciumInputScale: 10, sourceStressScale: 1 },
  { scenarioId: "calcium-scale-30", axis: "calcium-input-scale", calciumInputScale: 30, sourceStressScale: 1 },
  { scenarioId: "calcium-scale-100", axis: "calcium-input-scale", calciumInputScale: 100, sourceStressScale: 1 },
  { scenarioId: "source-stress-scale-10", axis: "source-stress-scale", calciumInputScale: 1, sourceStressScale: 10 },
  { scenarioId: "source-stress-scale-100", axis: "source-stress-scale", calciumInputScale: 1, sourceStressScale: 100 },
  { scenarioId: "source-stress-scale-300", axis: "source-stress-scale", calciumInputScale: 1, sourceStressScale: 300 },
  { scenarioId: "source-stress-scale-1000", axis: "source-stress-scale", calciumInputScale: 1, sourceStressScale: 1000 },
] as const satisfies readonly ForcingScenario[];

type ForcingAxis = "baseline" | "calcium-input-scale" | "source-stress-scale";

type ForcingScenario = {
  readonly scenarioId: string;
  readonly axis: ForcingAxis;
  readonly calciumInputScale: number;
  readonly sourceStressScale: number;
};

type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];
type BeatTraceRow = LowPreloadDebugPoint["beatTrace"][number];

type ProviderPointInstrumentation = {
  readonly sourceActiveStressCallCount: number;
  readonly commitProviderStateAfterStepCount: number;
  readonly landSolveFailureCount: number;
  readonly landSolveOkCount: number;
  readonly sourcePathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly commitPathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly forcingAudit?: SourceForcingAudit;
};

type RangeAudit = {
  min: number | null;
  max: number | null;
};

type SourceForcingAudit = {
  sourceCallCount: number;
  rawSourceStressPa: RangeAudit;
  scaledSourceStressPa: RangeAudit;
  deliveredSourceStressPa: RangeAudit;
  nonnegativeDeliveryClampCount: number;
};

export type ModelCoreLandCalciumSourceForcingRunPoint = {
  readonly sourceProviderId: string;
  readonly scenarioId: string;
  readonly axis: ForcingAxis | "legacy-target";
  readonly calciumInputScale: number;
  readonly sourceStressScale: number;
  readonly deltaVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly closureStableHash: string;
  readonly independentlyInitializedPoint: true;
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
  readonly qAoCapRatioMax: number;
  readonly aovQDotClampHitFraction: number;
  readonly providerInstrumentation: ProviderPointInstrumentation;
};

export type ModelCoreLandCalciumSourceForcingPair = {
  readonly deltaVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly legacy: ModelCoreLandCalciumSourceForcingRunPoint;
  readonly forcedLand: ModelCoreLandCalciumSourceForcingRunPoint;
  readonly sameClosureStableHash: boolean;
  readonly sourceProviderForcingOnlyWithinPoint: boolean;
  readonly comparison: {
    readonly forcedVsLegacyCOLRatio: number;
    readonly forcedVsLegacySVRatio: number;
    readonly forcedVsLegacyQAoPeakRatio: number;
    readonly forcedVsLegacyPeakSigmaActRatio: number;
    readonly forcedVsLegacyAoVQDotClampHitFractionRatio: number;
    readonly meanOutputMatchScore: number;
    readonly eachMetricWithinThreshold: boolean;
    readonly matchedLegacyOutputRegime: boolean;
    readonly clampRegimeRecovered: boolean;
  };
};

export type ModelCoreLandCalciumSourceForcingBracketEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MODELCORE_LAND_CALCIUM_SOURCE_FORCING_BRACKET_EVIDENCE_ID;
  readonly phase: "Phase 5C-P";
  readonly claimBoundary: "calcium-source-scale-forcing-bracket-only";
  readonly upstreamActivationInterfaceArtifactId: typeof activationInterfaceArtifact.id;
  readonly upstreamOutputMatchArtifactId: typeof outputMatchArtifact.id;
  readonly verifierScript: "verify:myocardium-modelcore-land-calcium-source-forcing-bracket";
  readonly diagnosticProtocol: {
    readonly pinnedDeltaMl: typeof PINNED_DELTA_ML;
    readonly bestLandOutputMatchDeltaMl: number;
    readonly diagnosticDeltasMl: readonly number[];
    readonly forcingScenarios: readonly ForcingScenario[];
    readonly pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start";
    readonly closureInvariant: "ModelCore closure, qDot, valves, afterload, preload, sampling, and beat selection unchanged within each delta";
  };
  readonly boundary: {
    readonly sourceProviderForcingOnly: true;
    readonly crossScaleInterpretationIsSourceProviderOnly: false;
    readonly explicitForcingNotTuning: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noRuntimeReplacement: true;
    readonly deliveredStressNonnegativeClampIsProviderForcingBoundary: true;
  };
  readonly runHealth: {
    readonly legacyTargetsSettledByConvergence: boolean;
    readonly forcedPointCount: number;
    readonly forcedPointsSettledByConvergence: number;
    readonly forcedPointsCapOrNonOk: number;
    readonly landSolveFailureCount: number;
    readonly sourceAuditSamplesPresent: boolean;
    readonly commitAuditSamplesPresent: boolean;
  };
  readonly pairs: readonly ModelCoreLandCalciumSourceForcingPair[];
  readonly analysis: {
    readonly bestOverallCandidate: ModelCoreLandCalciumSourceForcingPair;
    readonly bestCalciumScaleCandidate: ModelCoreLandCalciumSourceForcingPair;
    readonly bestSourceStressScaleCandidate: ModelCoreLandCalciumSourceForcingPair;
    readonly classification:
      | "source-output-forcing-reaches-legacy-regime-clamp-risk-testable"
      | "calcium-input-scaling-reaches-legacy-regime"
      | "forcing-bracket-did-not-reach-legacy-output-regime"
      | "forcing-bracket-inconclusive";
    readonly structuralAlternansRemovalClaim: "not-established";
    readonly finalNoAlternansClaim: "not-claimed";
    readonly officialMorphologyAcceptance: "not-claimed";
    readonly summary: string;
    readonly requiredNextChecks: readonly string[];
  };
  readonly doesNotUnlock: readonly string[];
};

export function buildModelCoreLandCalciumSourceForcingBracketEvidence():
ModelCoreLandCalciumSourceForcingBracketEvidence {
  const pairs = DIAGNOSTIC_DELTAS_ML.flatMap((delta) => {
    const legacy = runLegacyTarget(delta);
    return FORCING_SCENARIOS.map((scenario) => pairForcedPoint(legacy, runForcedLandPoint(delta, scenario)));
  });
  const analysis = analyzePairs(pairs);
  return {
    schemaVersion: 1,
    id: MODELCORE_LAND_CALCIUM_SOURCE_FORCING_BRACKET_EVIDENCE_ID,
    phase: "Phase 5C-P",
    claimBoundary: "calcium-source-scale-forcing-bracket-only",
    upstreamActivationInterfaceArtifactId: activationInterfaceArtifact.id,
    upstreamOutputMatchArtifactId: outputMatchArtifact.id,
    verifierScript: "verify:myocardium-modelcore-land-calcium-source-forcing-bracket",
    diagnosticProtocol: {
      pinnedDeltaMl: PINNED_DELTA_ML,
      bestLandOutputMatchDeltaMl: BEST_LAND_DELTA_ML,
      diagnosticDeltasMl: DIAGNOSTIC_DELTAS_ML,
      forcingScenarios: FORCING_SCENARIOS,
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
      closureInvariant:
        "ModelCore closure, qDot, valves, afterload, preload, sampling, and beat selection unchanged within each delta",
    },
    boundary: {
      sourceProviderForcingOnly: true,
      crossScaleInterpretationIsSourceProviderOnly: false,
      explicitForcingNotTuning: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noRuntimeReplacement: true,
      deliveredStressNonnegativeClampIsProviderForcingBoundary: true,
    },
    runHealth: runHealth(pairs),
    pairs,
    analysis,
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

function runLegacyTarget(deltaVolumeMl: number): ModelCoreLandCalciumSourceForcingRunPoint {
  const counts = createModelCoreActiveSourcePressureAdapterInvocationCounts();
  const point = runProviderPoint(deltaVolumeMl, {
    activeSourceProviders: { LV: legacyActiveStressLvSourceOnlyProvider(counts) },
  });
  return summarizeRunPoint(point, {
    sourceProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
    scenarioId: "legacy-target",
    axis: "legacy-target",
    calciumInputScale: 1,
    sourceStressScale: 1,
    providerInstrumentation: {
      sourceActiveStressCallCount: counts.sourceActiveStressPa,
      commitProviderStateAfterStepCount: 0,
      landSolveFailureCount: 0,
      landSolveOkCount: 0,
    },
  });
}

function runForcedLandPoint(
  deltaVolumeMl: number,
  scenario: ForcingScenario,
): ModelCoreLandCalciumSourceForcingRunPoint {
  const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const forcingAudit = createSourceForcingAudit();
  const provider = forcedLand2017LvSourceOnlyProvider(instrumentation, scenario, forcingAudit);
  const point = runProviderPoint(deltaVolumeMl, {
    activeSourceProviders: { LV: provider },
  });
  return summarizeRunPoint(point, {
    sourceProviderId: provider.sourceProviderId,
    scenarioId: scenario.scenarioId,
    axis: scenario.axis,
    calciumInputScale: scenario.calciumInputScale,
    sourceStressScale: scenario.sourceStressScale,
    providerInstrumentation: {
      sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
      commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
      landSolveFailureCount: instrumentation.landSolveFailureCount,
      landSolveOkCount: instrumentation.landSolveOkCount,
      sourcePathAudit: instrumentation.sourcePathAudit,
      commitPathAudit: instrumentation.commitPathAudit,
      forcingAudit,
    },
  });
}

function forcedLand2017LvSourceOnlyProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
  scenario: ForcingScenario,
  forcingAudit: SourceForcingAudit,
): ModelCoreExperimentalActiveSourceProvider {
  const base = land2017LvSourceOnlyProvider(instrumentation);
  const sourceProviderId =
    `${MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID}:${scenario.scenarioId}`;
  return {
    ...base,
    sourceProviderId,
    sourceActiveStressPa: (call) => {
      const rawStress = base.sourceActiveStressPa?.(scaleCallCalcium(call, scenario.calciumInputScale)) ?? 0;
      return deliveredStress(rawStress, scenario.sourceStressScale, forcingAudit);
    },
    debugActiveStressTerms: (call) => {
      if (!base.debugActiveStressTerms) {
        throw new Error(`Forced Land provider ${sourceProviderId} must define source-specific debugActiveStressTerms.`);
      }
      return scaleDebugTerms(
        base.debugActiveStressTerms(scaleCallCalcium(call, scenario.calciumInputScale)),
        call,
        scenario.sourceStressScale,
      );
    },
    commitProviderStateAfterStep: (call) =>
      base.commitProviderStateAfterStep?.(scaleCommitCallCalcium(call, scenario.calciumInputScale)),
  };
}

function createSourceForcingAudit(): SourceForcingAudit {
  return {
    sourceCallCount: 0,
    rawSourceStressPa: emptyRangeAudit(),
    scaledSourceStressPa: emptyRangeAudit(),
    deliveredSourceStressPa: emptyRangeAudit(),
    nonnegativeDeliveryClampCount: 0,
  };
}

function deliveredStress(
  rawStressPa: number,
  sourceStressScale: number,
  audit: SourceForcingAudit,
): number {
  const scaledStressPa = rawStressPa * sourceStressScale;
  const deliveredStressPa = Math.max(0, scaledStressPa);
  audit.sourceCallCount += 1;
  updateRange(audit.rawSourceStressPa, rawStressPa);
  updateRange(audit.scaledSourceStressPa, scaledStressPa);
  updateRange(audit.deliveredSourceStressPa, deliveredStressPa);
  if (deliveredStressPa !== scaledStressPa) audit.nonnegativeDeliveryClampCount += 1;
  return deliveredStressPa;
}

function scaleCallCalcium(
  call: ModelCoreActiveSourceProviderCall,
  calciumInputScale: number,
): ModelCoreActiveSourceProviderCall {
  if (calciumInputScale === 1) return call;
  return {
    ...call,
    internal: {
      ...call.internal,
      c: call.internal.c * calciumInputScale,
    },
  };
}

function scaleCommitCallCalcium(
  call: ModelCoreActiveSourceProviderStateCommitCall,
  calciumInputScale: number,
): ModelCoreActiveSourceProviderStateCommitCall {
  if (calciumInputScale === 1) return call;
  return {
    ...call,
    beforeStep: {
      ...call.beforeStep,
      internal: {
        ...call.beforeStep.internal,
        c: call.beforeStep.internal.c * calciumInputScale,
      },
    },
    afterStep: {
      ...call.afterStep,
      internal: {
        ...call.afterStep.internal,
        c: call.afterStep.internal.c * calciumInputScale,
      },
    },
  };
}

function scaleDebugTerms(
  terms: ActiveStressDebugTerms,
  call: ModelCoreActiveSourceProviderCall,
  sourceStressScale: number,
): ActiveStressDebugTerms {
  const scaledStress = Math.max(0, terms.sigmaActTarget * sourceStressScale);
  const pressureTerms = call.activeModel.debugPressureTermsFromActiveFiberStress(
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    scaledStress,
  );
  return {
    ...terms,
    ...pressureTerms,
    sigmaActTargetRaw: scaledStress,
    sigmaActTarget: scaledStress,
    sigmaAct: scaledStress,
  };
}

function emptyRangeAudit(): RangeAudit {
  return { min: null, max: null };
}

function updateRange(range: RangeAudit, value: number): void {
  if (!Number.isFinite(value)) return;
  range.min = range.min == null ? value : Math.min(range.min, value);
  range.max = range.max == null ? value : Math.max(range.max, value);
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
    experimentalModelCoreOptions,
  });
  const point = debugReport.points[0];
  if (!point || debugReport.points.length !== 1) {
    throw new Error("Phase 5C-P forcing bracket expects exactly one independently initialized debug point.");
  }
  return point;
}

function summarizeRunPoint(
  point: LowPreloadDebugPoint,
  input: {
    readonly sourceProviderId: string;
    readonly scenarioId: string;
    readonly axis: ForcingAxis | "legacy-target";
    readonly calciumInputScale: number;
    readonly sourceStressScale: number;
    readonly providerInstrumentation: ProviderPointInstrumentation;
  },
): ModelCoreLandCalciumSourceForcingRunPoint {
  return {
    sourceProviderId: input.sourceProviderId,
    scenarioId: input.scenarioId,
    axis: input.axis,
    calciumInputScale: input.calciumInputScale,
    sourceStressScale: input.sourceStressScale,
    deltaVolumeMl: point.deltaVolumeMl,
    effectiveTotalBloodVolumeMl: point.targetVolumeMl,
    closureStableHash: closureStableHash(point.deltaVolumeMl),
    independentlyInitializedPoint: true,
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
    QAoPeakMlPerSec: periodAwareMax(point.beatTrace, point.settle.periodBeats, (beat) => beat.QAoMax),
    peakSigmaActPa: periodAwareMax(
      trailingPeriodBeatTrace(point),
      point.settle.periodBeats,
      (beat) => beat.active.LV?.sigmaActTargetMax ?? Number.NaN,
    ),
    qAoCapRatioMax: maxBeat(point.beatTrace, (beat) => beat.QAoCapRatioMax),
    aovQDotClampHitFraction: clampHitFraction(point),
    providerInstrumentation: input.providerInstrumentation,
  };
}

function pairForcedPoint(
  legacy: ModelCoreLandCalciumSourceForcingRunPoint,
  forcedLand: ModelCoreLandCalciumSourceForcingRunPoint,
): ModelCoreLandCalciumSourceForcingPair {
  const meanOutputMatchScore = outputMatchScore(legacy, forcedLand);
  const eachMetricWithinThreshold =
    normalizedError(forcedLand.CO_L, legacy.CO_L, 1) <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX
    && normalizedError(forcedLand.SV_L, legacy.SV_L, 10) <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX
    && normalizedError(forcedLand.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec, 100)
      <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX;
  const sameClosureStableHash = legacy.closureStableHash === forcedLand.closureStableHash;
  const sourceProviderForcingOnlyWithinPoint =
    sameClosureStableHash
    && legacy.deltaVolumeMl === forcedLand.deltaVolumeMl
    && legacy.effectiveTotalBloodVolumeMl === forcedLand.effectiveTotalBloodVolumeMl
    && legacy.providerInstrumentation.sourceActiveStressCallCount > 0
    && forcedLand.providerInstrumentation.sourceActiveStressCallCount > 0
    && forcedLand.providerInstrumentation.commitProviderStateAfterStepCount > 0
    && forcedLand.providerInstrumentation.landSolveFailureCount === 0;
  return {
    deltaVolumeMl: legacy.deltaVolumeMl,
    effectiveTotalBloodVolumeMl: legacy.effectiveTotalBloodVolumeMl,
    legacy,
    forcedLand,
    sameClosureStableHash,
    sourceProviderForcingOnlyWithinPoint,
    comparison: {
      forcedVsLegacyCOLRatio: safeRatio(forcedLand.CO_L, legacy.CO_L),
      forcedVsLegacySVRatio: safeRatio(forcedLand.SV_L, legacy.SV_L),
      forcedVsLegacyQAoPeakRatio: safeRatio(forcedLand.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec),
      forcedVsLegacyPeakSigmaActRatio: safeRatio(forcedLand.peakSigmaActPa, legacy.peakSigmaActPa),
      forcedVsLegacyAoVQDotClampHitFractionRatio:
        safeRatio(forcedLand.aovQDotClampHitFraction, legacy.aovQDotClampHitFraction),
      meanOutputMatchScore,
      eachMetricWithinThreshold,
      matchedLegacyOutputRegime:
        meanOutputMatchScore <= OUTPUT_MATCH_MEAN_SCORE_MAX && eachMetricWithinThreshold,
      clampRegimeRecovered:
        legacy.aovQDotClampHitFraction > 0
        && forcedLand.aovQDotClampHitFraction >= legacy.aovQDotClampHitFraction * 0.75,
    },
  };
}

function analyzePairs(
  pairs: readonly ModelCoreLandCalciumSourceForcingPair[],
): ModelCoreLandCalciumSourceForcingBracketEvidence["analysis"] {
  const candidates = pairs
    .filter((pair) => pair.forcedLand.settled && pair.forcedLand.settleReason === "converged")
    .sort((a, b) => a.comparison.meanOutputMatchScore - b.comparison.meanOutputMatchScore);
  const calciumCandidates = candidates.filter((pair) => pair.forcedLand.axis === "calcium-input-scale");
  const sourceStressCandidates = candidates.filter((pair) => pair.forcedLand.axis === "source-stress-scale");
  const bestOverallCandidate = candidates[0] ?? pairs[0];
  const bestCalciumScaleCandidate = calciumCandidates[0] ?? bestOverallCandidate;
  const bestSourceStressScaleCandidate = sourceStressCandidates[0] ?? bestOverallCandidate;
  const classification = classifyAnalysis(bestCalciumScaleCandidate, bestSourceStressScaleCandidate);
  return {
    bestOverallCandidate,
    bestCalciumScaleCandidate,
    bestSourceStressScaleCandidate,
    classification,
    structuralAlternansRemovalClaim: "not-established",
    finalNoAlternansClaim: "not-claimed",
    officialMorphologyAcceptance: "not-claimed",
    summary: interpretationSummary(classification),
    requiredNextChecks: [
      "SDIRK2-reference-before-final-no-alternans",
      "if-forcing-recovers-clamp-regime-interpret-as-gain-attribution-not-structural-acceptance",
      "if-calcium-scale-recovers-output-audit-legacy-c-units-before-runtime-design",
    ],
  };
}

function classifyAnalysis(
  bestCalciumScaleCandidate: ModelCoreLandCalciumSourceForcingPair,
  bestSourceStressScaleCandidate: ModelCoreLandCalciumSourceForcingPair,
): ModelCoreLandCalciumSourceForcingBracketEvidence["analysis"]["classification"] {
  if (bestCalciumScaleCandidate.comparison.matchedLegacyOutputRegime) {
    return "calcium-input-scaling-reaches-legacy-regime";
  }
  if (bestSourceStressScaleCandidate.comparison.matchedLegacyOutputRegime) {
    return "source-output-forcing-reaches-legacy-regime-clamp-risk-testable";
  }
  if (
    Number.isFinite(bestCalciumScaleCandidate.comparison.meanOutputMatchScore)
    || Number.isFinite(bestSourceStressScaleCandidate.comparison.meanOutputMatchScore)
  ) {
    return "forcing-bracket-did-not-reach-legacy-output-regime";
  }
  return "forcing-bracket-inconclusive";
}

function interpretationSummary(
  classification: ModelCoreLandCalciumSourceForcingBracketEvidence["analysis"]["classification"],
): string {
  if (classification === "calcium-input-scaling-reaches-legacy-regime") {
    return "Experimental calcium input scaling moved Land into the legacy output regime; this supports auditing the legacy internal.c-to-free-calcium unit mapping before any runtime design.";
  }
  if (classification === "source-output-forcing-reaches-legacy-regime-clamp-risk-testable") {
    return "Explicit source-output forcing moved Land into the legacy output regime; this makes clamp-regime and period behavior testable as gain attribution, not structural alternans acceptance.";
  }
  if (classification === "forcing-bracket-did-not-reach-legacy-output-regime") {
    return "The predeclared calcium/source forcing bracket did not reach the pinned legacy output regime; source-interface underactivation remains localized but not yet resolved.";
  }
  return "The calcium/source forcing bracket did not produce interpretable finite output-match evidence.";
}

function runHealth(
  pairs: readonly ModelCoreLandCalciumSourceForcingPair[],
): ModelCoreLandCalciumSourceForcingBracketEvidence["runHealth"] {
  const legacyTargetsByDelta = new Map<number, ModelCoreLandCalciumSourceForcingRunPoint>();
  for (const pair of pairs) legacyTargetsByDelta.set(pair.deltaVolumeMl, pair.legacy);
  const legacyTargets = Array.from(legacyTargetsByDelta.values());
  const forcedPoints = pairs.map((pair) => pair.forcedLand);
  return {
    legacyTargetsSettledByConvergence:
      legacyTargets.every((point) => point.settled && point.settleReason === "converged"),
    forcedPointCount: forcedPoints.length,
    forcedPointsSettledByConvergence:
      forcedPoints.filter((point) => point.settled && point.settleReason === "converged").length,
    forcedPointsCapOrNonOk:
      forcedPoints.filter((point) => point.settleReason === "cap" || point.healthStatus !== "ok").length,
    landSolveFailureCount:
      forcedPoints.reduce((sum, point) => sum + point.providerInstrumentation.landSolveFailureCount, 0),
    sourceAuditSamplesPresent:
      forcedPoints.every((point) => (point.providerInstrumentation.sourcePathAudit?.sampleCount ?? 0) > 0),
    commitAuditSamplesPresent:
      forcedPoints.every((point) => (point.providerInstrumentation.commitPathAudit?.sampleCount ?? 0) > 0),
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

function outputMatchScore(
  legacy: ModelCoreLandCalciumSourceForcingRunPoint,
  forced: ModelCoreLandCalciumSourceForcingRunPoint,
): number {
  return (
    normalizedError(forced.CO_L, legacy.CO_L, 1)
    + normalizedError(forced.SV_L, legacy.SV_L, 10)
    + normalizedError(forced.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec, 100)
  ) / 3;
}

function normalizedError(actual: number, target: number, floor: number): number {
  return Math.abs(actual - target) / Math.max(Math.abs(target), floor);
}

function safeRatio(actual: number, target: number): number {
  if (!Number.isFinite(actual) || !Number.isFinite(target) || Math.abs(target) <= 0) return Number.NaN;
  return actual / target;
}

function maxValveReverseMl(point: LowPreloadDebugPoint): number {
  return Math.max(
    point.valveVolumesMl.MVReverse,
    point.valveVolumesMl.AoVReverse,
    point.valveVolumesMl.TVReverse,
    point.valveVolumesMl.PVReverse,
  );
}

function clampHitFraction(point: LowPreloadDebugPoint): number {
  const sampleCount = sum(point.beatTrace.map((beat) => beat.AoVQDotClampSampleCount));
  const hitCount = sum(point.beatTrace.map((beat) => beat.AoVQDotClampHitCount));
  return sampleCount > 0 ? hitCount / sampleCount : 0;
}

function periodAwareMax<T>(rows: readonly T[], periodBeats: number, value: (row: T) => number): number {
  const periodRows = rows.slice(-boundedPeriodBeatCount(rows.length, periodBeats));
  return Math.max(0, ...periodRows.map(value).filter(Number.isFinite));
}

function trailingPeriodBeatTrace(point: LowPreloadDebugPoint): readonly BeatTraceRow[] {
  return point.beatTrace.slice(-boundedPeriodBeatCount(point.beatTrace.length, point.settle.periodBeats));
}

function boundedPeriodBeatCount(rowCount: number, periodBeats: number): number {
  if (rowCount <= 0) return 0;
  if (!Number.isFinite(periodBeats) || periodBeats < 1) return 1;
  return Math.max(1, Math.min(rowCount, Math.trunc(periodBeats)));
}

function maxBeat(beatTrace: readonly BeatTraceRow[], value: (beat: BeatTraceRow) => number): number {
  return Math.max(0, ...beatTrace.map(value).filter(Number.isFinite));
}

function sum(values: readonly number[]): number {
  return values.filter(Number.isFinite).reduce((acc, value) => acc + value, 0);
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildModelCoreLandCalciumSourceForcingBracketEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCoreLandCalciumSourceForcingBracketEvidence(), null, 2));
}
