import outputMatchArtifact from "@/data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
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
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MODELCORE_LAND_ACTIVATION_INTERFACE_AUDIT_EVIDENCE_ID =
  "modelcore-land-activation-interface-audit-result-v1";

const PINNED_DELTA_ML = LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl;
const BEST_LAND_DELTA_ML = outputMatchArtifact.outputMatchAnalysis.bestLandCandidate.deltaVolumeMl;
const DIAGNOSTIC_DELTAS_ML = Array.from(new Set([PINNED_DELTA_ML, BEST_LAND_DELTA_ML])).sort((a, b) => a - b);
const STEADY_TRACE_STRESS_RATIO_SEVERE_GAP_MAX = 0.01;

type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];
type BeatTraceRow = LowPreloadDebugPoint["beatTrace"][number];

type RangeAudit = {
  readonly min: number | null;
  readonly max: number | null;
};

type ActiveTraceAudit = {
  readonly c: RangeAudit;
  readonly lambdaRaw: RangeAudit;
  readonly fiberEngineeringStrain: RangeAudit;
  readonly sigmaActPa: RangeAudit;
  readonly sigmaActTargetPa: RangeAudit;
  readonly boundFractionLikeA: RangeAudit;
};

type ProviderPointInstrumentation = {
  readonly sourceActiveStressCallCount: number;
  readonly commitProviderStateAfterStepCount: number;
  readonly landSolveFailureCount: number;
  readonly landSolveOkCount: number;
  readonly sourcePathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly commitPathAudit?: ModelCoreLand2017LvSignalAudit;
};

export type ModelCoreLandActivationInterfaceRunPoint = {
  readonly sourceProviderId: string;
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
  readonly CO_L: number;
  readonly SV_L: number;
  readonly QAoPeakMlPerSec: number;
  readonly peakSigmaActPa: number;
  readonly activeTrace: ActiveTraceAudit;
  readonly providerInstrumentation: ProviderPointInstrumentation;
};

export type ModelCoreLandActivationInterfacePair = {
  readonly deltaVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly sameClosureStableHash: boolean;
  readonly sourceProviderDifferenceOnlyWithinPoint: boolean;
  readonly legacy: ModelCoreLandActivationInterfaceRunPoint;
  readonly land: ModelCoreLandActivationInterfaceRunPoint;
  readonly stressGap: {
    readonly landPeakSigmaActToLegacyRatio: number;
    readonly landSourcePathStressMaxToLegacyPeakSigmaRatio: number;
    readonly landCommitPathStressMaxToLegacyPeakSigmaRatio: number;
    readonly legacyPeakSigmaActPa: number;
    readonly landPeakSigmaActPa: number;
    readonly landSourcePathStressMaxPa: number | null;
    readonly landCommitPathStressMaxPa: number | null;
  };
};

export type ModelCoreLandActivationInterfaceAuditEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MODELCORE_LAND_ACTIVATION_INTERFACE_AUDIT_EVIDENCE_ID;
  readonly phase: "Phase 5C-O";
  readonly claimBoundary: "activation-source-interface-audit-only";
  readonly upstreamOutputMatchArtifactId: typeof outputMatchArtifact.id;
  readonly upstreamOutputMatchStatus: typeof outputMatchArtifact.outputMatchAnalysis.status;
  readonly verifierScript: "verify:myocardium-modelcore-land-activation-interface-audit";
  readonly diagnosticProtocol: {
    readonly baselineTotalBloodVolumeMl: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl;
    readonly diagnosticDeltasMl: readonly number[];
    readonly pinnedDeltaMl: typeof PINNED_DELTA_ML;
    readonly bestLandOutputMatchDeltaMl: number;
    readonly integrationDtSec: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec;
    readonly sampleHz: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz;
    readonly traceBeats: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats;
    readonly pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start";
  };
  readonly boundary: {
    readonly sourceProviderDifferenceOnlyScope: "within-each-same-effective-tbv-pair-only";
    readonly crossTbvInterpretationIsSourceProviderOnly: false;
    readonly auditOnlyNoTuning: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noRuntimeReplacement: true;
  };
  readonly runHealth: {
    readonly allPointsSettledByConvergence: boolean;
    readonly nonOkHealthPointCount: number;
    readonly landSolveFailureCount: number;
    readonly landSourceAuditSamplesPresent: boolean;
    readonly landCommitAuditSamplesPresent: boolean;
  };
  readonly pairs: readonly ModelCoreLandActivationInterfacePair[];
  readonly auditInterpretation: {
    readonly classification:
      | "land-source-interface-underactivation-gap-observed"
      | "activation-interface-audit-inconclusive";
    readonly structuralAlternansRemovalClaim: "not-established";
    readonly finalNoAlternansClaim: "not-claimed";
    readonly officialMorphologyAcceptance: "not-claimed";
    readonly summary: string;
    readonly recommendedNextChecks: readonly string[];
  };
  readonly doesNotUnlock: readonly string[];
};

type ProviderRunContext = {
  readonly experimentalModelCoreOptions: ModelCoreExperimentalOptions;
  readonly instrumentation: () => ProviderPointInstrumentation;
};

export function buildModelCoreLandActivationInterfaceAuditEvidence():
ModelCoreLandActivationInterfaceAuditEvidence {
  const pairs = DIAGNOSTIC_DELTAS_ML.map((delta) => {
    const legacy = runProviderPoint(
      MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
      delta,
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
            landSolveOkCount: 0,
          }),
        };
      },
    );
    const land = runProviderPoint(
      MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
      delta,
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
            landSolveOkCount: instrumentation.landSolveOkCount,
            sourcePathAudit: instrumentation.sourcePathAudit,
            commitPathAudit: instrumentation.commitPathAudit,
          }),
        };
      },
    );
    return pairPoints(legacy, land);
  });
  const classification = classifyAudit(pairs);
  return {
    schemaVersion: 1,
    id: MODELCORE_LAND_ACTIVATION_INTERFACE_AUDIT_EVIDENCE_ID,
    phase: "Phase 5C-O",
    claimBoundary: "activation-source-interface-audit-only",
    upstreamOutputMatchArtifactId: outputMatchArtifact.id,
    upstreamOutputMatchStatus: outputMatchArtifact.outputMatchAnalysis.status,
    verifierScript: "verify:myocardium-modelcore-land-activation-interface-audit",
    diagnosticProtocol: {
      baselineTotalBloodVolumeMl: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl,
      diagnosticDeltasMl: DIAGNOSTIC_DELTAS_ML,
      pinnedDeltaMl: PINNED_DELTA_ML,
      bestLandOutputMatchDeltaMl: BEST_LAND_DELTA_ML,
      integrationDtSec: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec,
      sampleHz: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz,
      traceBeats: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats,
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
    },
    boundary: {
      sourceProviderDifferenceOnlyScope: "within-each-same-effective-tbv-pair-only",
      crossTbvInterpretationIsSourceProviderOnly: false,
      auditOnlyNoTuning: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noRuntimeReplacement: true,
    },
    runHealth: runHealth(pairs),
    pairs,
    auditInterpretation: {
      classification,
      structuralAlternansRemovalClaim: "not-established",
      finalNoAlternansClaim: "not-claimed",
      officialMorphologyAcceptance: "not-claimed",
      summary: interpretationSummary(classification),
      recommendedNextChecks: [
        "calcium-input-scale-and-units-audit-before-output-match-claim",
        "explicit-source-output-forcing-bracket-before-structural-attribution",
        "SDIRK2-reference-before-final-no-alternans",
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

function runProviderPoint(
  sourceProviderId: string,
  deltaVolumeMl: number,
  createContext: () => ProviderRunContext,
): ModelCoreLandActivationInterfaceRunPoint {
  const context = createContext();
  const report = runLowPreloadDebug({
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
    experimentalModelCoreOptions: context.experimentalModelCoreOptions,
  });
  const point = report.points[0];
  if (!point || report.points.length !== 1) {
    throw new Error("Phase 5C-O activation-interface audit expects one independently initialized point.");
  }
  return summarizePoint(point, sourceProviderId, deltaVolumeMl, context.instrumentation());
}

function summarizePoint(
  point: LowPreloadDebugPoint,
  sourceProviderId: string,
  deltaVolumeMl: number,
  providerInstrumentation: ProviderPointInstrumentation,
): ModelCoreLandActivationInterfaceRunPoint {
  return {
    sourceProviderId,
    deltaVolumeMl,
    effectiveTotalBloodVolumeMl: point.targetVolumeMl,
    closureStableHash: closureStableHash(deltaVolumeMl),
    independentlyInitializedPoint: true,
    settled: point.settle.settled,
    settleReason: point.settle.reason,
    settleActualSeconds: point.settle.actualSeconds,
    periodBeats: point.settle.periodBeats,
    adjacentDelta: point.settle.adjacentDelta,
    periodDelta: point.settle.periodDelta,
    healthStatus: point.health.status,
    healthMessages: point.health.messages,
    CO_L: point.periodMetrics.CO_L,
    SV_L: point.periodMetrics.SV_L,
    QAoPeakMlPerSec: maxTrace(point.beatTrace, (beat) => beat.QAoMax),
    peakSigmaActPa: maxTrace(point.beatTrace, (beat) => beat.active.LV?.sigmaActTargetMax ?? Number.NaN),
    activeTrace: activeTraceAudit(point.beatTrace),
    providerInstrumentation,
  };
}

function pairPoints(
  legacy: ModelCoreLandActivationInterfaceRunPoint,
  land: ModelCoreLandActivationInterfaceRunPoint,
): ModelCoreLandActivationInterfacePair {
  const sameClosureStableHash = legacy.closureStableHash === land.closureStableHash;
  const sourceProviderDifferenceOnlyWithinPoint =
    sameClosureStableHash
    && legacy.deltaVolumeMl === land.deltaVolumeMl
    && legacy.providerInstrumentation.sourceActiveStressCallCount > 0
    && land.providerInstrumentation.sourceActiveStressCallCount > 0
    && land.providerInstrumentation.commitProviderStateAfterStepCount > 0
    && land.providerInstrumentation.landSolveFailureCount === 0;
  const landSourcePathStressMaxPa = land.providerInstrumentation.sourcePathAudit?.sourceActiveFiberStressPa.max ?? null;
  const landCommitPathStressMaxPa = land.providerInstrumentation.commitPathAudit?.sourceActiveFiberStressPa.max ?? null;
  return {
    deltaVolumeMl: legacy.deltaVolumeMl,
    effectiveTotalBloodVolumeMl: legacy.effectiveTotalBloodVolumeMl,
    sameClosureStableHash,
    sourceProviderDifferenceOnlyWithinPoint,
    legacy,
    land,
    stressGap: {
      landPeakSigmaActToLegacyRatio: safeRatio(land.peakSigmaActPa, legacy.peakSigmaActPa),
      landSourcePathStressMaxToLegacyPeakSigmaRatio: safeRatio(landSourcePathStressMaxPa, legacy.peakSigmaActPa),
      landCommitPathStressMaxToLegacyPeakSigmaRatio: safeRatio(landCommitPathStressMaxPa, legacy.peakSigmaActPa),
      legacyPeakSigmaActPa: legacy.peakSigmaActPa,
      landPeakSigmaActPa: land.peakSigmaActPa,
      landSourcePathStressMaxPa,
      landCommitPathStressMaxPa,
    },
  };
}

function runHealth(pairs: readonly ModelCoreLandActivationInterfacePair[]):
ModelCoreLandActivationInterfaceAuditEvidence["runHealth"] {
  const points = pairs.flatMap((pair) => [pair.legacy, pair.land]);
  const landPoints = pairs.map((pair) => pair.land);
  return {
    allPointsSettledByConvergence:
      points.every((point) => point.settled && point.settleReason === "converged"),
    nonOkHealthPointCount: points.filter((point) => point.healthStatus !== "ok").length,
    landSolveFailureCount:
      landPoints.reduce((sum, point) => sum + point.providerInstrumentation.landSolveFailureCount, 0),
    landSourceAuditSamplesPresent:
      landPoints.every((point) => (point.providerInstrumentation.sourcePathAudit?.sampleCount ?? 0) > 0),
    landCommitAuditSamplesPresent:
      landPoints.every((point) => (point.providerInstrumentation.commitPathAudit?.sampleCount ?? 0) > 0),
  };
}

function classifyAudit(
  pairs: readonly ModelCoreLandActivationInterfacePair[],
): ModelCoreLandActivationInterfaceAuditEvidence["auditInterpretation"]["classification"] {
  const pinned = pairs.find((pair) => pair.deltaVolumeMl === PINNED_DELTA_ML);
  if (
    pinned
    && pinned.stressGap.landPeakSigmaActToLegacyRatio < STEADY_TRACE_STRESS_RATIO_SEVERE_GAP_MAX
    && pinned.land.providerInstrumentation.sourcePathAudit?.finiteHealthAllSamples === true
    && pinned.land.providerInstrumentation.commitPathAudit?.finiteHealthAllSamples === true
  ) {
    return "land-source-interface-underactivation-gap-observed";
  }
  return "activation-interface-audit-inconclusive";
}

function interpretationSummary(
  classification: ModelCoreLandActivationInterfaceAuditEvidence["auditInterpretation"]["classification"],
): string {
  if (classification === "land-source-interface-underactivation-gap-observed") {
    return "Land remains finite and same-closure source-only, but its settled-trace active stress target is orders of magnitude below the pinned legacy active-stress positive control; output non-overlap is therefore localized to the activation/source interface before any structural alternans claim.";
  }
  return "The activation/source-interface audit did not localize the Land output gap strongly enough for a next-step decision.";
}

function activeTraceAudit(beatTrace: readonly BeatTraceRow[]): ActiveTraceAudit {
  return {
    c: rangeFrom(beatTrace.map((beat) => beat.active.LV?.cMean ?? Number.NaN)),
    lambdaRaw: rangeFrom(beatTrace.map((beat) => beat.active.LV?.lambdaRawMean ?? Number.NaN)),
    fiberEngineeringStrain: rangeFrom(beatTrace.map((beat) =>
      (beat.active.LV?.lambdaRawMean ?? Number.NaN) - 1
    )),
    sigmaActPa: rangeFrom(beatTrace.map((beat) => beat.active.LV?.sigmaActMean ?? Number.NaN)),
    sigmaActTargetPa: rangeFrom(beatTrace.map((beat) => beat.active.LV?.sigmaActTargetMax ?? Number.NaN)),
    boundFractionLikeA: rangeFrom(beatTrace.map((beat) => beat.active.LV?.aMean ?? Number.NaN)),
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
    sourceProviderDifferenceOnlyInputs: {
      heartModel: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.heartModel,
      integrationDtSec: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec,
      sampleHz: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz,
      traceBeats: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats,
      returnMapMode: "none",
      qDotValveAfterloadPreloadTuning: "none",
    },
  }));
}

function rangeFrom(values: readonly number[]): RangeAudit {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { min: null, max: null };
  return { min: Math.min(...finite), max: Math.max(...finite) };
}

function maxTrace(beatTrace: readonly BeatTraceRow[], value: (beat: BeatTraceRow) => number): number {
  const finite = beatTrace.map(value).filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : Number.NaN;
}

function safeRatio(actual: number | null, target: number): number {
  if (actual == null || !Number.isFinite(actual) || !Number.isFinite(target) || Math.abs(target) <= 0) {
    return Number.NaN;
  }
  return actual / target;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildModelCoreLandActivationInterfaceAuditEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCoreLandActivationInterfaceAuditEvidence(), null, 2));
}
