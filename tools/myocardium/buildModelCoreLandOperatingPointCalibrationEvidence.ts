import path from "node:path";
import { pathToFileURL } from "node:url";
import phase2BArtifact from "@/data/myocardium/protocols/calcium-land-phase2b-isometric-protocols.json";
import phase2BMechanisticFields from "@/data/myocardium/protocols/phase2b-mechanistic-report-fields-v1.json";
import phase4DArtifact from "@/data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json";
import level3SourceStressTransferGate from "@/data/myocardium/protocols/level3-source-stress-transfer-gate-v1.json";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import phase5RArtifact from "@/data/myocardium/protocols/modelcore-land-sdirk2-reference-result-v1.json";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreActiveSourceProviderStateCommitCall,
  ModelCoreExperimentalActiveSourceProvider,
  ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
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
  type ModelCoreLand2017LvSignalAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MODELCORE_LAND_OPERATING_POINT_CALIBRATION_EVIDENCE_ID =
  "modelcore-land-operating-point-calibration-result-v1";

const PINNED_LOW_DELTA_ML = LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl;
const BASELINE_DELTA_ML = 0;
const HIGH_DIAGNOSTIC_DELTA_ML = phase5RArtifact.diagnosticProtocol.bestLandOutputMatchDeltaMl;
const DIAGNOSTIC_DELTAS_ML = [PINNED_LOW_DELTA_ML, BASELINE_DELTA_ML, HIGH_DIAGNOSTIC_DELTA_ML] as const;
const MAIN_DOMAIN_DELTAS_ML = [BASELINE_DELTA_ML, HIGH_DIAGNOSTIC_DELTA_ML] as const;
const PHASE5Q_CALCIUM_SCALE = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
const PHASE2B_ABSOLUTE_PEAK_CA_UM = phase5QArtifact.diagnosticProtocol.phase2bAbsolutePeakCaUM;
const OUTPUT_MATCH_MEAN_SCORE_MAX = 0.35;
const MAIN_DOMAIN_QAO_RATIO_MIN = 0.55;
const MAIN_DOMAIN_STRESS_RATIO_MIN = 0.5;
const MAIN_DOMAIN_STRESS_RATIO_MAX = 2.0;

type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];
type BeatTraceRow = LowPreloadDebugPoint["beatTrace"][number];

type RangeAudit = {
  min: number | null;
  max: number | null;
};

type CalciumScaleAudit = {
  sourceCallCount: number;
  debugCallCount: number;
  commitCallCount: number;
  scale: number;
  rawSourceInternalC: RangeAudit;
  mappedSourceFreeCalciumUM: RangeAudit;
  rawDebugInternalC: RangeAudit;
  mappedDebugFreeCalciumUM: RangeAudit;
  rawCommitBeforeInternalC: RangeAudit;
  mappedCommitBeforeFreeCalciumUM: RangeAudit;
  rawCommitAfterInternalC: RangeAudit;
  mappedCommitAfterFreeCalciumUM: RangeAudit;
};

type ActiveTraceAudit = {
  readonly beatTraceCount: number;
  readonly overlaySampleCount: number;
  readonly overlayLV_c: RangeAudit;
  readonly overlayLV_sigmaActTarget: RangeAudit;
};

type ProviderPointInstrumentation = {
  readonly sourceActiveStressCallCount: number;
  readonly commitProviderStateAfterStepCount: number;
  readonly landSolveFailureCount: number;
  readonly landSolveOkCount: number;
  readonly maxSolverResidualNorm: number;
  readonly debugActiveStressTermsCallCount?: number;
  readonly maxSourceDebugStressDifferencePa?: number;
  readonly sourcePathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly commitPathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly calciumScaleAudit?: CalciumScaleAudit;
};

export type ModelCoreLandOperatingPointCalibrationRunPoint = {
  readonly sourceProviderId: string;
  readonly providerKind: "legacy-activeStress-source-only" | "land2017-phase2b-calcium-mapped-source-only";
  readonly deltaVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly closureStableHash: string;
  readonly independentlyInitializedPoint: true;
  readonly commitScheme: "legacy" | "BE";
  readonly calciumScale: number | null;
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
  readonly activeTraceAudit: ActiveTraceAudit;
  readonly providerInstrumentation: ProviderPointInstrumentation;
};

export type ModelCoreLandOperatingPointCalibrationPair = {
  readonly deltaVolumeMl: number;
  readonly pointRole: "pinned-low-preload-edge" | "baseline-operating-point" | "high-volume-diagnostic-point";
  readonly legacy: ModelCoreLandOperatingPointCalibrationRunPoint;
  readonly land: ModelCoreLandOperatingPointCalibrationRunPoint;
  readonly sameClosureStableHash: boolean;
  readonly sourceProviderDifferenceOnlyWithinPoint: boolean;
  readonly comparison: {
    readonly landVsLegacyCOLRatio: number;
    readonly landVsLegacySVRatio: number;
    readonly landVsLegacyQAoPeakRatio: number;
    readonly landVsLegacyPeakSigmaActRatio: number;
    readonly landVsLegacyLVPMaxRatio: number;
    readonly landVsLegacyAoPMaxRatio: number;
    readonly meanOutputMatchScore: number;
    readonly mainDomainOutputRegimeReasonable: boolean;
    readonly landPeriod1: boolean;
    readonly legacyPeriod2: boolean;
    readonly landClampEngaged: boolean;
  };
};

export type ModelCoreLandOperatingPointCalibrationEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MODELCORE_LAND_OPERATING_POINT_CALIBRATION_EVIDENCE_ID;
  readonly phase: "Phase 5S";
  readonly claimBoundary: "operating-point-calibration-diagnostic-only";
  readonly upstreamPhase2BArtifactId: typeof phase2BArtifact.protocolSetId;
  readonly upstreamPhase2BMechanisticFieldsId: typeof phase2BMechanisticFields.id;
  readonly upstreamLevel3SourceStressTransferGateId: typeof level3SourceStressTransferGate.id;
  readonly upstreamPhase4DArtifactId: typeof phase4DArtifact.protocolSetId;
  readonly upstreamPhase5QArtifactId: typeof phase5QArtifact.id;
  readonly upstreamPhase5RArtifactId: typeof phase5RArtifact.id;
  readonly verifierScript: "verify:myocardium-modelcore-land-operating-point-calibration";
  readonly diagnosticProtocol: {
    readonly diagnosticDeltasMl: readonly number[];
    readonly mainDomainDeltasMl: readonly number[];
    readonly phase5QCalciumMappingScenario: "phase2b-absolute-peak-ca";
    readonly phase5QCalciumScale: number;
    readonly providerCommitScheme: "BE";
    readonly preloadAxisMode: "fixed-diagnostic-operating-points-not-tuning";
    readonly pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start";
    readonly closureInvariant: "ModelCore closure, qDot, valves, afterload, preload, sampling, and beat selection unchanged within each delta";
    readonly educationDoDScope: "report-only-checkpoint-not-acceptance";
  };
  readonly boundary: {
    readonly noModelCoreGlobalIntegratorChange: true;
    readonly noSdirk2RobustnessClaim: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noSourceStressScaling: true;
    readonly noRuntimeReplacement: true;
    readonly noOfficialMorphologyAcceptance: true;
  };
  readonly runHealth: {
    readonly legacyPointCount: number;
    readonly landPointCount: number;
    readonly legacyPointsSettledByConvergence: number;
    readonly landPointsSettledByConvergence: number;
    readonly landPointsCapOrNonOk: number;
    readonly landSolveFailureCount: number;
    readonly sourceAuditSamplesPresent: boolean;
    readonly commitAuditSamplesPresent: boolean;
    readonly calciumScaleAuditSamplesPresent: boolean;
  };
  readonly levelEvidence: {
    readonly level1CalciumInterface: {
      readonly status: "phase5q-fixed-unit-mapping-reused";
      readonly pinnedLegacyCPeak: number;
      readonly phase2BAbsolutePeakCaUM: number;
      readonly phase5QCalciumScale: number;
      readonly mappedPinnedOverlayPeakCaUM: number | null;
      readonly pinnedPeakRelativeError: number | null;
      readonly pass: boolean;
    };
    readonly level2SourceStressTransfer: {
      readonly status: "closed-loop-source-stress-transfer-measured";
      readonly sourceTwitchFwhmMsApprox: number;
      readonly sourceStressPeakKPaApprox: number | null;
      readonly mainDomainPeakSigmaActRatios: readonly number[];
      readonly allLandSolvesOk: boolean;
      readonly stressRatiosInCoarseLegacyClass: boolean;
    };
    readonly level3_4ClosedLoopOperatingPoint: {
      readonly status:
        | "main-domain-calibration-signal"
        | "finite-closed-loop-calibration-gap-observed"
        | "calibration-blocked-by-nonfinite-or-solver-failure";
      readonly mainDomainOutputScoreMax: number;
      readonly mainDomainQAoPeakRatioMin: number;
      readonly mainDomainAllPeriod1: boolean;
      readonly lowPreloadEdgeStillReportOnly: boolean;
    };
  };
  readonly pairs: readonly ModelCoreLandOperatingPointCalibrationPair[];
  readonly educationDoDCheckpoint: {
    readonly status:
      | "draft-do-d-ready-for-owner-review"
      | "draft-do-d-blocked-by-operating-point-gap"
      | "draft-do-d-blocked-by-health-or-solver-failure";
    readonly scope: "education-tool-report-only-not-runtime-acceptance";
    readonly satisfiedNow: false;
    readonly criteria: {
      readonly mainDomainFinite: boolean;
      readonly mainDomainOutputRegimeReasonable: boolean;
      readonly mainDomainBeatStability: boolean;
      readonly landSolverClean: boolean;
      readonly morphologyStillDiagnosticOnly: true;
      readonly officialCasesNeedReauthoringBeforeRuntime: true;
    };
  };
  readonly analysis: {
    readonly operatingPointStatus:
      | "main-domain-calibration-signal-low-preload-edge-report-only"
      | "finite-closed-loop-calibration-gap-observed"
      | "calibration-blocked-by-nonfinite-or-solver-failure";
    readonly finalNoAlternansClaim: "not-claimed";
    readonly structuralAlternansRemovalClaim: "not-established";
    readonly level3Acceptance: "not-claimed";
    readonly level4Acceptance: "not-claimed";
    readonly officialMorphologyAcceptance: "not-claimed";
    readonly runtimeReplacement: "not-claimed";
    readonly summary: string;
    readonly requiredNextChecks: readonly string[];
  };
  readonly doesNotUnlock: readonly string[];
};

export function buildModelCoreLandOperatingPointCalibrationEvidence():
ModelCoreLandOperatingPointCalibrationEvidence {
  const legacyTargets = DIAGNOSTIC_DELTAS_ML.map(runLegacyTarget);
  const pairs = legacyTargets.map((legacy) => pairLandPoint(legacy, runLandPoint(legacy.deltaVolumeMl)));
  const runHealthSummary = runHealth(pairs);
  const levelEvidence = buildLevelEvidence(pairs, runHealthSummary);
  const educationDoDCheckpoint = buildEducationDoDCheckpoint(levelEvidence, runHealthSummary);
  const analysis = buildAnalysis(levelEvidence, educationDoDCheckpoint);
  return {
    schemaVersion: 1,
    id: MODELCORE_LAND_OPERATING_POINT_CALIBRATION_EVIDENCE_ID,
    phase: "Phase 5S",
    claimBoundary: "operating-point-calibration-diagnostic-only",
    upstreamPhase2BArtifactId: phase2BArtifact.protocolSetId,
    upstreamPhase2BMechanisticFieldsId: phase2BMechanisticFields.id,
    upstreamLevel3SourceStressTransferGateId: level3SourceStressTransferGate.id,
    upstreamPhase4DArtifactId: phase4DArtifact.protocolSetId,
    upstreamPhase5QArtifactId: phase5QArtifact.id,
    upstreamPhase5RArtifactId: phase5RArtifact.id,
    verifierScript: "verify:myocardium-modelcore-land-operating-point-calibration",
    diagnosticProtocol: {
      diagnosticDeltasMl: DIAGNOSTIC_DELTAS_ML,
      mainDomainDeltasMl: MAIN_DOMAIN_DELTAS_ML,
      phase5QCalciumMappingScenario: "phase2b-absolute-peak-ca",
      phase5QCalciumScale: PHASE5Q_CALCIUM_SCALE,
      providerCommitScheme: "BE",
      preloadAxisMode: "fixed-diagnostic-operating-points-not-tuning",
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
      closureInvariant:
        "ModelCore closure, qDot, valves, afterload, preload, sampling, and beat selection unchanged within each delta",
      educationDoDScope: "report-only-checkpoint-not-acceptance",
    },
    boundary: {
      noModelCoreGlobalIntegratorChange: true,
      noSdirk2RobustnessClaim: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noSourceStressScaling: true,
      noRuntimeReplacement: true,
      noOfficialMorphologyAcceptance: true,
    },
    runHealth: runHealthSummary,
    levelEvidence,
    pairs,
    educationDoDCheckpoint,
    analysis,
    doesNotUnlock: [
      "runtimeReplacement",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
      "structuralAlternansRemoval",
      "ModelCoreGlobalSecondOrderIntegration",
      "qDotTuning",
      "valveThresholdTuning",
      "arterialLoadTuning",
      "preloadTuning",
      "landParameterTuning",
      "sourceStressScaling",
      "TriSegAdoption",
      "StudioScientificValidityClaim",
    ],
  };
}

function runLegacyTarget(deltaVolumeMl: number): ModelCoreLandOperatingPointCalibrationRunPoint {
  const counts = createModelCoreActiveSourcePressureAdapterInvocationCounts();
  const point = runProviderPoint(deltaVolumeMl, {
    activeSourceProviders: { LV: legacyActiveStressLvSourceOnlyProvider(counts) },
  });
  return summarizeRunPoint(point, {
    sourceProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
    providerKind: "legacy-activeStress-source-only",
    commitScheme: "legacy",
    calciumScale: null,
    providerInstrumentation: {
      sourceActiveStressCallCount: counts.sourceActiveStressPa,
      commitProviderStateAfterStepCount: 0,
      landSolveFailureCount: 0,
      landSolveOkCount: 0,
      maxSolverResidualNorm: 0,
      debugActiveStressTermsCallCount: counts.debugActiveStressTerms,
    },
  });
}

function runLandPoint(deltaVolumeMl: number): ModelCoreLandOperatingPointCalibrationRunPoint {
  const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const calciumScaleAudit = createCalciumScaleAudit(PHASE5Q_CALCIUM_SCALE);
  const provider = scaledLandProvider(instrumentation, calciumScaleAudit);
  const point = runProviderPoint(deltaVolumeMl, {
    activeSourceProviders: { LV: provider },
  });
  return summarizeRunPoint(point, {
    sourceProviderId: provider.sourceProviderId,
    providerKind: "land2017-phase2b-calcium-mapped-source-only",
    commitScheme: "BE",
    calciumScale: PHASE5Q_CALCIUM_SCALE,
    providerInstrumentation: {
      sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
      commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
      landSolveFailureCount: instrumentation.landSolveFailureCount,
      landSolveOkCount: instrumentation.landSolveOkCount,
      maxSolverResidualNorm: instrumentation.maxSolverResidualNorm,
      debugActiveStressTermsCallCount: instrumentation.debugActiveStressTerms,
      maxSourceDebugStressDifferencePa: instrumentation.maxSourceDebugStressDifferencePa,
      sourcePathAudit: instrumentation.sourcePathAudit,
      commitPathAudit: instrumentation.commitPathAudit,
      calciumScaleAudit,
    },
  });
}

function scaledLandProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
  calciumScaleAudit: CalciumScaleAudit,
): ModelCoreExperimentalActiveSourceProvider {
  const sourceProviderId =
    `${MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID}:phase5s-phase2b-calcium-mapped-be`;
  const base = land2017LvSourceOnlyProvider(instrumentation, { sourceProviderId });
  return {
    ...base,
    sourceActiveStressPa: (call) =>
      base.sourceActiveStressPa?.(mapActiveCallCalcium(call, calciumScaleAudit, "source")) ?? 0,
    debugActiveStressTerms: (call) => {
      if (!base.debugActiveStressTerms) throw new Error(`${sourceProviderId} must define debugActiveStressTerms.`);
      return base.debugActiveStressTerms(mapActiveCallCalcium(call, calciumScaleAudit, "debug"));
    },
    commitProviderStateAfterStep: (call) =>
      base.commitProviderStateAfterStep?.(mapCommitCallCalcium(call, calciumScaleAudit)),
  };
}

function mapActiveCallCalcium(
  call: ModelCoreActiveSourceProviderCall,
  audit: CalciumScaleAudit,
  pathLabel: "source" | "debug",
): ModelCoreActiveSourceProviderCall {
  const mappedC = mapCalcium(call.internal.c);
  recordActiveMapping(audit, pathLabel, call.internal.c, mappedC);
  return { ...call, internal: { ...call.internal, c: mappedC } };
}

function mapCommitCallCalcium(
  call: ModelCoreActiveSourceProviderStateCommitCall,
  audit: CalciumScaleAudit,
): ModelCoreActiveSourceProviderStateCommitCall {
  const mappedBefore = mapCalcium(call.beforeStep.internal.c);
  const mappedAfter = mapCalcium(call.afterStep.internal.c);
  recordCommitMapping(audit, call.beforeStep.internal.c, mappedBefore, call.afterStep.internal.c, mappedAfter);
  return {
    ...call,
    beforeStep: { ...call.beforeStep, internal: { ...call.beforeStep.internal, c: mappedBefore } },
    afterStep: { ...call.afterStep, internal: { ...call.afterStep.internal, c: mappedAfter } },
  };
}

function mapCalcium(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Phase 5S calcium input must be finite.");
  return Math.max(0, value) * PHASE5Q_CALCIUM_SCALE;
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
    throw new Error("Phase 5S operating-point calibration expects one independently initialized debug point.");
  }
  return point;
}

function summarizeRunPoint(
  point: LowPreloadDebugPoint,
  input: {
    readonly sourceProviderId: string;
    readonly providerKind: ModelCoreLandOperatingPointCalibrationRunPoint["providerKind"];
    readonly commitScheme: "legacy" | "BE";
    readonly calciumScale: number | null;
    readonly providerInstrumentation: ProviderPointInstrumentation;
  },
): ModelCoreLandOperatingPointCalibrationRunPoint {
  const lastBeat = point.beatTrace[point.beatTrace.length - 1];
  return {
    sourceProviderId: input.sourceProviderId,
    providerKind: input.providerKind,
    deltaVolumeMl: point.deltaVolumeMl,
    effectiveTotalBloodVolumeMl: point.targetVolumeMl,
    closureStableHash: closureStableHash(point.deltaVolumeMl),
    independentlyInitializedPoint: true,
    commitScheme: input.commitScheme,
    calciumScale: input.calciumScale,
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
    EDV_L: lastBeat?.EDV_L ?? Number.NaN,
    ESV_L: lastBeat?.ESV_L ?? Number.NaN,
    LVPMax: periodAwareMax(point.beatTrace, point.settle.periodBeats, (beat) => beat.LVPMax),
    AoPMean: periodAwareMean(point.beatTrace, point.settle.periodBeats, (beat) => beat.AoPMean),
    AoPMax: periodAwareMax(point.beatTrace, point.settle.periodBeats, (beat) => beat.AoPMax),
    QAoPeakMlPerSec: periodAwareMax(point.beatTrace, point.settle.periodBeats, (beat) => beat.QAoMax),
    peakSigmaActPa: periodAwareMax(
      trailingPeriodBeatTrace(point),
      point.settle.periodBeats,
      (beat) => beat.active.LV?.sigmaActTargetMax ?? Number.NaN,
    ),
    qAoCapRatioMax: maxBeat(point.beatTrace, (beat) => beat.QAoCapRatioMax),
    aovQDotClampHitFraction: clampHitFraction(point),
    mvAForwardMl: lastBeat?.filling.MV_A_forward_mL ?? Number.NaN,
    mvAFraction: lastBeat?.filling.MV_A_fraction ?? null,
    fillingMorphologyClass: lastBeat?.filling.fillingMorphologyClass ?? "indeterminate",
    activeTraceAudit: activeTraceAudit(point),
    providerInstrumentation: input.providerInstrumentation,
  };
}

function pairLandPoint(
  legacy: ModelCoreLandOperatingPointCalibrationRunPoint,
  land: ModelCoreLandOperatingPointCalibrationRunPoint,
): ModelCoreLandOperatingPointCalibrationPair {
  const meanOutputMatchScore = outputMatchScore(legacy, land);
  const pointRole = pointRoleForDelta(legacy.deltaVolumeMl);
  const mainDomainOutputRegimeReasonable =
    pointRole !== "pinned-low-preload-edge"
    && meanOutputMatchScore <= OUTPUT_MATCH_MEAN_SCORE_MAX
    && safeRatio(land.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec) >= MAIN_DOMAIN_QAO_RATIO_MIN
    && inRange(
      safeRatio(land.peakSigmaActPa, legacy.peakSigmaActPa),
      MAIN_DOMAIN_STRESS_RATIO_MIN,
      MAIN_DOMAIN_STRESS_RATIO_MAX,
    );
  const sameClosureStableHash = legacy.closureStableHash === land.closureStableHash;
  return {
    deltaVolumeMl: legacy.deltaVolumeMl,
    pointRole,
    legacy,
    land,
    sameClosureStableHash,
    sourceProviderDifferenceOnlyWithinPoint:
      sameClosureStableHash
      && legacy.deltaVolumeMl === land.deltaVolumeMl
      && legacy.effectiveTotalBloodVolumeMl === land.effectiveTotalBloodVolumeMl
      && legacy.providerInstrumentation.sourceActiveStressCallCount > 0
      && land.providerInstrumentation.sourceActiveStressCallCount > 0
      && land.providerInstrumentation.commitProviderStateAfterStepCount > 0
      && land.providerInstrumentation.landSolveFailureCount === 0
      && (land.providerInstrumentation.sourcePathAudit?.sampleCount ?? 0) > 0
      && (land.providerInstrumentation.commitPathAudit?.sampleCount ?? 0) > 0
      && (land.providerInstrumentation.calciumScaleAudit?.sourceCallCount ?? 0) > 0,
    comparison: {
      landVsLegacyCOLRatio: safeRatio(land.CO_L, legacy.CO_L),
      landVsLegacySVRatio: safeRatio(land.SV_L, legacy.SV_L),
      landVsLegacyQAoPeakRatio: safeRatio(land.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec),
      landVsLegacyPeakSigmaActRatio: safeRatio(land.peakSigmaActPa, legacy.peakSigmaActPa),
      landVsLegacyLVPMaxRatio: safeRatio(land.LVPMax, legacy.LVPMax),
      landVsLegacyAoPMaxRatio: safeRatio(land.AoPMax, legacy.AoPMax),
      meanOutputMatchScore,
      mainDomainOutputRegimeReasonable,
      landPeriod1: land.periodBeats === 1,
      legacyPeriod2: legacy.periodBeats === 2,
      landClampEngaged: land.aovQDotClampHitFraction > 0,
    },
  };
}

function buildLevelEvidence(
  pairs: readonly ModelCoreLandOperatingPointCalibrationPair[],
  runHealthSummary: ModelCoreLandOperatingPointCalibrationEvidence["runHealth"],
): ModelCoreLandOperatingPointCalibrationEvidence["levelEvidence"] {
  const pinned = requirePair(pairs, PINNED_LOW_DELTA_ML);
  const mainDomainPairs = pairs.filter((pair) => MAIN_DOMAIN_DELTAS_ML.includes(pair.deltaVolumeMl as 0 | 1000));
  const mappedPinnedOverlayPeakCaUM = pinned.land.activeTraceAudit.overlayLV_c.max;
  const pinnedPeakRelativeError =
    mappedPinnedOverlayPeakCaUM == null
      ? null
      : normalizedError(mappedPinnedOverlayPeakCaUM, PHASE2B_ABSOLUTE_PEAK_CA_UM, 0.1);
  const mainDomainPeakSigmaActRatios = mainDomainPairs.map((pair) =>
    pair.comparison.landVsLegacyPeakSigmaActRatio);
  const landSolvesOk = runHealthSummary.landSolveFailureCount === 0;
  const stressRatiosInCoarseLegacyClass = mainDomainPeakSigmaActRatios.every((ratio) =>
    inRange(ratio, MAIN_DOMAIN_STRESS_RATIO_MIN, MAIN_DOMAIN_STRESS_RATIO_MAX));
  const mainDomainOutputScores = mainDomainPairs.map((pair) => pair.comparison.meanOutputMatchScore);
  const mainDomainOutputScoreMax = Math.max(...mainDomainOutputScores);
  const mainDomainQAoPeakRatioMin = Math.min(...mainDomainPairs.map((pair) =>
    pair.comparison.landVsLegacyQAoPeakRatio));
  const mainDomainAllPeriod1 = mainDomainPairs.every((pair) => pair.land.periodBeats === 1);
  const mainDomainOutputReasonable = mainDomainPairs.every((pair) =>
    pair.comparison.mainDomainOutputRegimeReasonable);
  const level34Status =
    runHealthSummary.landPointsCapOrNonOk > 0 || !landSolvesOk
      ? "calibration-blocked-by-nonfinite-or-solver-failure"
      : mainDomainOutputReasonable
        ? "main-domain-calibration-signal"
        : "finite-closed-loop-calibration-gap-observed";
  return {
    level1CalciumInterface: {
      status: "phase5q-fixed-unit-mapping-reused",
      pinnedLegacyCPeak: phase5QArtifact.calibration.pinnedLegacyCPeak,
      phase2BAbsolutePeakCaUM: PHASE2B_ABSOLUTE_PEAK_CA_UM,
      phase5QCalciumScale: PHASE5Q_CALCIUM_SCALE,
      mappedPinnedOverlayPeakCaUM,
      pinnedPeakRelativeError,
      pass: pinnedPeakRelativeError != null && pinnedPeakRelativeError <= 0.02,
    },
    level2SourceStressTransfer: {
      status: "closed-loop-source-stress-transfer-measured",
      sourceTwitchFwhmMsApprox: phase2BMechanisticFields.exampleReviewedValues.sourceTwitchFwhmMsApprox,
      sourceStressPeakKPaApprox: phase2SourceStressPeakKPaApprox(),
      mainDomainPeakSigmaActRatios,
      allLandSolvesOk: landSolvesOk,
      stressRatiosInCoarseLegacyClass,
    },
    level3_4ClosedLoopOperatingPoint: {
      status: level34Status,
      mainDomainOutputScoreMax,
      mainDomainQAoPeakRatioMin,
      mainDomainAllPeriod1,
      lowPreloadEdgeStillReportOnly:
        pinned.legacy.periodBeats === 2 || pinned.land.periodBeats !== pinned.legacy.periodBeats,
    },
  };
}

function buildEducationDoDCheckpoint(
  levelEvidence: ModelCoreLandOperatingPointCalibrationEvidence["levelEvidence"],
  runHealthSummary: ModelCoreLandOperatingPointCalibrationEvidence["runHealth"],
): ModelCoreLandOperatingPointCalibrationEvidence["educationDoDCheckpoint"] {
  const mainDomainFinite =
    runHealthSummary.landPointsCapOrNonOk === 0
    && runHealthSummary.landPointsSettledByConvergence === runHealthSummary.landPointCount;
  const mainDomainOutputRegimeReasonable =
    levelEvidence.level3_4ClosedLoopOperatingPoint.status === "main-domain-calibration-signal";
  const mainDomainBeatStability = levelEvidence.level3_4ClosedLoopOperatingPoint.mainDomainAllPeriod1;
  const landSolverClean = runHealthSummary.landSolveFailureCount === 0;
  const status =
    !mainDomainFinite || !landSolverClean
      ? "draft-do-d-blocked-by-health-or-solver-failure"
      : mainDomainOutputRegimeReasonable && mainDomainBeatStability
        ? "draft-do-d-ready-for-owner-review"
        : "draft-do-d-blocked-by-operating-point-gap";
  return {
    status,
    scope: "education-tool-report-only-not-runtime-acceptance",
    satisfiedNow: false,
    criteria: {
      mainDomainFinite,
      mainDomainOutputRegimeReasonable,
      mainDomainBeatStability,
      landSolverClean,
      morphologyStillDiagnosticOnly: true,
      officialCasesNeedReauthoringBeforeRuntime: true,
    },
  };
}

function buildAnalysis(
  levelEvidence: ModelCoreLandOperatingPointCalibrationEvidence["levelEvidence"],
  educationDoDCheckpoint: ModelCoreLandOperatingPointCalibrationEvidence["educationDoDCheckpoint"],
): ModelCoreLandOperatingPointCalibrationEvidence["analysis"] {
  const operatingPointStatus = classifyOperatingPoint(levelEvidence);
  return {
    operatingPointStatus,
    finalNoAlternansClaim: "not-claimed",
    structuralAlternansRemovalClaim: "not-established",
    level3Acceptance: "not-claimed",
    level4Acceptance: "not-claimed",
    officialMorphologyAcceptance: "not-claimed",
    runtimeReplacement: "not-claimed",
    summary: interpretationSummary(operatingPointStatus, educationDoDCheckpoint.status),
    requiredNextChecks: [
      "owner-review-education-tool-definition-of-done",
      "developer-only-runtime-flag-design-before-case-wiring",
      "official-case-reauthoring-before-runtime-replacement",
      "morphology-zc-and-filling-lanes-remain-separate",
      "do-not-extend-alternans-subphases-without-explicit-final-no-alternans-scope",
    ],
  };
}

function classifyOperatingPoint(
  levelEvidence: ModelCoreLandOperatingPointCalibrationEvidence["levelEvidence"],
): ModelCoreLandOperatingPointCalibrationEvidence["analysis"]["operatingPointStatus"] {
  if (levelEvidence.level3_4ClosedLoopOperatingPoint.status === "main-domain-calibration-signal") {
    return "main-domain-calibration-signal-low-preload-edge-report-only";
  }
  if (levelEvidence.level3_4ClosedLoopOperatingPoint.status === "finite-closed-loop-calibration-gap-observed") {
    return "finite-closed-loop-calibration-gap-observed";
  }
  return "calibration-blocked-by-nonfinite-or-solver-failure";
}

function interpretationSummary(
  status: ModelCoreLandOperatingPointCalibrationEvidence["analysis"]["operatingPointStatus"],
  dodStatus: ModelCoreLandOperatingPointCalibrationEvidence["educationDoDCheckpoint"]["status"],
): string {
  if (status === "main-domain-calibration-signal-low-preload-edge-report-only") {
    return `The Phase 5C-Q calcium-mapped Land provider runs cleanly at the fixed closed-loop operating points and the main-domain points sit in a coarse legacy output/stress regime. Treat this as an operating-point calibration signal and ${dodStatus}, not runtime acceptance.`;
  }
  if (status === "finite-closed-loop-calibration-gap-observed") {
    return "The Phase 5C-Q calcium-mapped Land provider runs cleanly, but the main-domain output/stress regime is not yet close enough to legacy for an education-tool Definition of Done checkpoint. Runtime design remains blocked by operating-point calibration.";
  }
  return "The operating-point calibration matrix is blocked by health or Land solver failures. Fix those before any runtime design discussion.";
}

function runHealth(
  pairs: readonly ModelCoreLandOperatingPointCalibrationPair[],
): ModelCoreLandOperatingPointCalibrationEvidence["runHealth"] {
  const legacyPoints = pairs.map((pair) => pair.legacy);
  const landPoints = pairs.map((pair) => pair.land);
  return {
    legacyPointCount: legacyPoints.length,
    landPointCount: landPoints.length,
    legacyPointsSettledByConvergence:
      legacyPoints.filter((point) => point.settled && point.settleReason === "converged").length,
    landPointsSettledByConvergence:
      landPoints.filter((point) => point.settled && point.settleReason === "converged").length,
    landPointsCapOrNonOk:
      landPoints.filter((point) => point.settleReason === "cap" || point.healthStatus !== "ok").length,
    landSolveFailureCount:
      landPoints.reduce((sumValue, point) => sumValue + point.providerInstrumentation.landSolveFailureCount, 0),
    sourceAuditSamplesPresent:
      landPoints.every((point) => (point.providerInstrumentation.sourcePathAudit?.sampleCount ?? 0) > 0),
    commitAuditSamplesPresent:
      landPoints.every((point) => (point.providerInstrumentation.commitPathAudit?.sampleCount ?? 0) > 0),
    calciumScaleAuditSamplesPresent:
      landPoints.every((point) =>
        (point.providerInstrumentation.calciumScaleAudit?.sourceCallCount ?? 0) > 0
        && (point.providerInstrumentation.calciumScaleAudit?.commitCallCount ?? 0) > 0),
  };
}

function activeTraceAudit(point: LowPreloadDebugPoint): ActiveTraceAudit {
  const overlayRows = point.beatPairOverlay?.rows ?? [];
  return {
    beatTraceCount: point.beatTrace.length,
    overlaySampleCount: overlayRows.length,
    overlayLV_c: rangeFrom(overlayRows.map((row) => row.LV_c)),
    overlayLV_sigmaActTarget: rangeFrom(overlayRows.map((row) => row.LV_sigmaActTarget)),
  };
}

function createCalciumScaleAudit(scale: number): CalciumScaleAudit {
  return {
    sourceCallCount: 0,
    debugCallCount: 0,
    commitCallCount: 0,
    scale,
    rawSourceInternalC: emptyRangeAudit(),
    mappedSourceFreeCalciumUM: emptyRangeAudit(),
    rawDebugInternalC: emptyRangeAudit(),
    mappedDebugFreeCalciumUM: emptyRangeAudit(),
    rawCommitBeforeInternalC: emptyRangeAudit(),
    mappedCommitBeforeFreeCalciumUM: emptyRangeAudit(),
    rawCommitAfterInternalC: emptyRangeAudit(),
    mappedCommitAfterFreeCalciumUM: emptyRangeAudit(),
  };
}

function recordActiveMapping(
  audit: CalciumScaleAudit,
  pathLabel: "source" | "debug",
  rawC: number,
  mappedC: number,
): void {
  if (pathLabel === "source") {
    audit.sourceCallCount += 1;
    updateRange(audit.rawSourceInternalC, rawC);
    updateRange(audit.mappedSourceFreeCalciumUM, mappedC);
  } else {
    audit.debugCallCount += 1;
    updateRange(audit.rawDebugInternalC, rawC);
    updateRange(audit.mappedDebugFreeCalciumUM, mappedC);
  }
}

function recordCommitMapping(
  audit: CalciumScaleAudit,
  rawBeforeC: number,
  mappedBeforeC: number,
  rawAfterC: number,
  mappedAfterC: number,
): void {
  audit.commitCallCount += 1;
  updateRange(audit.rawCommitBeforeInternalC, rawBeforeC);
  updateRange(audit.mappedCommitBeforeFreeCalciumUM, mappedBeforeC);
  updateRange(audit.rawCommitAfterInternalC, rawAfterC);
  updateRange(audit.mappedCommitAfterFreeCalciumUM, mappedAfterC);
}

function pointRoleForDelta(deltaVolumeMl: number): ModelCoreLandOperatingPointCalibrationPair["pointRole"] {
  if (deltaVolumeMl === PINNED_LOW_DELTA_ML) return "pinned-low-preload-edge";
  if (deltaVolumeMl === BASELINE_DELTA_ML) return "baseline-operating-point";
  return "high-volume-diagnostic-point";
}

function requirePair(
  pairs: readonly ModelCoreLandOperatingPointCalibrationPair[],
  deltaVolumeMl: number,
): ModelCoreLandOperatingPointCalibrationPair {
  const pair = pairs.find((candidate) => candidate.deltaVolumeMl === deltaVolumeMl);
  if (!pair) throw new Error(`Missing Phase 5S operating-point pair at delta ${deltaVolumeMl}`);
  return pair;
}

function phase2SourceStressPeakKPaApprox(): number | null {
  const reviewed = phase2BMechanisticFields.exampleReviewedValues as Record<string, unknown>;
  const direct = reviewed.sourceStressPeakKPaApprox;
  if (typeof direct === "number") return direct;
  return null;
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
      beatPairOverlay: true,
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
    },
  }));
}

function outputMatchScore(
  legacy: ModelCoreLandOperatingPointCalibrationRunPoint,
  land: ModelCoreLandOperatingPointCalibrationRunPoint,
): number {
  return (
    normalizedError(land.CO_L, legacy.CO_L, 1)
    + normalizedError(land.SV_L, legacy.SV_L, 10)
    + normalizedError(land.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec, 100)
    + normalizedError(land.LVPMax, legacy.LVPMax, 20)
    + normalizedError(land.AoPMax, legacy.AoPMax, 20)
  ) / 5;
}

function emptyRangeAudit(): RangeAudit {
  return { min: null, max: null };
}

function updateRange(range: RangeAudit, value: number | null | undefined): void {
  if (value == null || !Number.isFinite(value)) return;
  range.min = range.min == null ? value : Math.min(range.min, value);
  range.max = range.max == null ? value : Math.max(range.max, value);
}

function rangeFrom(values: readonly (number | null | undefined)[]): RangeAudit {
  const range = emptyRangeAudit();
  for (const value of values) updateRange(range, value);
  return range;
}

function normalizedError(actual: number, target: number, floor: number): number {
  return Math.abs(actual - target) / Math.max(Math.abs(target), floor);
}

function safeRatio(actual: number, target: number): number {
  if (!Number.isFinite(actual) || !Number.isFinite(target) || Math.abs(target) <= 0) return Number.NaN;
  return actual / target;
}

function inRange(value: number, minValue: number, maxValue: number): boolean {
  return Number.isFinite(value) && value >= minValue && value <= maxValue;
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

function periodAwareMean<T>(rows: readonly T[], periodBeats: number, value: (row: T) => number): number {
  const values = rows
    .slice(-boundedPeriodBeatCount(rows.length, periodBeats))
    .map(value)
    .filter(Number.isFinite);
  return values.length > 0 ? sum(values) / values.length : Number.NaN;
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
    path.normalize("tools/myocardium/buildModelCoreLandOperatingPointCalibrationEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCoreLandOperatingPointCalibrationEvidence(), null, 2));
}
