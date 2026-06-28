import phase5BArtifact from "@/data/myocardium/protocols/local-monolithic-coupling-phase5b-sdirk2-protocols.json";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import outputMatchArtifact from "@/data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreActiveSourceProviderStateCommitCall,
  ModelCoreExperimentalActiveSourceProvider,
  ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { stableHash, sanitizeForStableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  LAND2017_SDIRK2_GAMMA,
  LAND2017_SDIRK2_TABLEAU,
} from "@/engine/myocardium/myofilament/land2017";
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
  type ModelCoreLand2017LvCommitScheme,
  type ModelCoreLand2017LvSignalAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MODELCORE_LAND_SDIRK2_REFERENCE_EVIDENCE_ID =
  "modelcore-land-sdirk2-reference-result-v1";

const PINNED_DELTA_ML = LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl;
const BEST_LAND_DELTA_ML = outputMatchArtifact.outputMatchAnalysis.bestLandCandidate.deltaVolumeMl;
const DIAGNOSTIC_DELTAS_ML = Array.from(new Set([PINNED_DELTA_ML, BEST_LAND_DELTA_ML])).sort((a, b) => a - b);
const PHASE5Q_CALCIUM_SCALE = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
const OUTPUT_MATCH_MEAN_SCORE_MAX = 0.25;
const OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX = 0.35;

type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];
type BeatTraceRow = LowPreloadDebugPoint["beatTrace"][number];
type LandScenarioId =
  | "raw-land-be"
  | "raw-land-sdirk2"
  | "phase2b-calcium-mapped-be"
  | "phase2b-calcium-mapped-sdirk2";

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
  readonly commitScheme: ModelCoreLand2017LvCommitScheme | "legacy";
  readonly sourceActiveStressCallCount: number;
  readonly commitProviderStateAfterStepCount: number;
  readonly landSolveFailureCount: number;
  readonly landSolveOkCount: number;
  readonly maxSolverResidualNorm: number;
  readonly sdirk2Stage0SolveCount: number;
  readonly sdirk2Stage1SolveCount: number;
  readonly sdirk2Stage0FailureCount: number;
  readonly sdirk2Stage1FailureCount: number;
  readonly maxSdirk2Stage0ResidualNorm: number;
  readonly maxSdirk2Stage1ResidualNorm: number;
  readonly maxSdirk2Stage0Iterations: number;
  readonly maxSdirk2Stage1Iterations: number;
  readonly maxSdirk2Stage0LineSearchSteps: number;
  readonly maxSdirk2Stage1LineSearchSteps: number;
  readonly maxPreviousFreeCalciumMismatchUM: number;
  readonly debugActiveStressTermsCallCount?: number;
  readonly sourcePathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly commitPathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly calciumScaleAudit?: CalciumScaleAudit;
};

export type ModelCoreLandSdirk2ReferenceRunPoint = {
  readonly sourceProviderId: string;
  readonly scenarioId: LandScenarioId | "legacy-target";
  readonly commitScheme: ModelCoreLand2017LvCommitScheme | "legacy";
  readonly calciumScale: number | null;
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
  readonly activeTraceAudit: ActiveTraceAudit;
  readonly providerInstrumentation: ProviderPointInstrumentation;
};

export type ModelCoreLandSdirk2ReferencePair = {
  readonly deltaVolumeMl: number;
  readonly scenarioId: LandScenarioId;
  readonly legacy: ModelCoreLandSdirk2ReferenceRunPoint;
  readonly land: ModelCoreLandSdirk2ReferenceRunPoint;
  readonly sameClosureStableHash: boolean;
  readonly sourceProviderSolverOnlyWithinPoint: boolean;
  readonly comparison: {
    readonly landVsLegacyCOLRatio: number;
    readonly landVsLegacySVRatio: number;
    readonly landVsLegacyQAoPeakRatio: number;
    readonly landVsLegacyPeakSigmaActRatio: number;
    readonly landVsLegacyAoVQDotClampHitFractionRatio: number;
    readonly meanOutputMatchScore: number;
    readonly eachMetricWithinThreshold: boolean;
    readonly matchedLegacyOutputRegime: boolean;
    readonly clampRegimeRecovered: boolean;
  };
};

export type ModelCoreLandSdirk2ReferenceSchemeComparison = {
  readonly deltaVolumeMl: number;
  readonly calciumMapping: "raw-direct" | "phase2b-absolute-peak";
  readonly beScenarioId: LandScenarioId;
  readonly sdirk2ScenarioId: LandScenarioId;
  readonly be: ModelCoreLandSdirk2ReferencePair;
  readonly sdirk2: ModelCoreLandSdirk2ReferencePair;
  readonly beAndSdirk2BothFinite: boolean;
  readonly periodBeatsMatch: boolean;
  readonly sdirk2PreservesMatchedLegacyOutputRegime: boolean;
  readonly sdirk2PreservesClampRegime: boolean;
  readonly outputScoreDeltaAbs: number;
  readonly qAoPeakRatioDeltaAbs: number;
};

export type ModelCoreLandSdirk2ReferenceEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MODELCORE_LAND_SDIRK2_REFERENCE_EVIDENCE_ID;
  readonly phase: "Phase 5C-R";
  readonly claimBoundary: "land-source-provider-commit-solver-robustness-only";
  readonly upstreamPhase5BArtifactId: typeof phase5BArtifact.protocolSetId;
  readonly upstreamPhase5NArtifactId: typeof outputMatchArtifact.id;
  readonly upstreamPhase5QArtifactId: typeof phase5QArtifact.id;
  readonly verifierScript: "verify:myocardium-modelcore-land-sdirk2-reference";
  readonly diagnosticProtocol: {
    readonly pinnedDeltaMl: typeof PINNED_DELTA_ML;
    readonly bestLandOutputMatchDeltaMl: number;
    readonly diagnosticDeltasMl: readonly number[];
    readonly phase5QCalciumMappingScenario: "phase2b-absolute-peak-ca";
    readonly phase5QCalciumScale: number;
    readonly pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start";
    readonly closureInvariant: "ModelCore closure, qDot, valves, afterload, preload, sampling, and beat selection unchanged within each delta";
    readonly referenceScope: "Land source-provider state commit BE-vs-SDIRK2 only";
    readonly modelCoreGlobalIntegrator: "unchanged-current-ModelCore-stepper";
    readonly sdirk2Tableau: typeof LAND2017_SDIRK2_TABLEAU;
    readonly sdirk2ProviderLocalStagePolicy: {
      readonly stageInputSource: "provider-local interpolation from ModelCore before/after commit snapshots";
      readonly stage0FreeCalcium: "linear interpolation from previous provider freeCa to afterStep freeCa at gamma";
      readonly stage0Strain: "linear interpolation from beforeStep lambdaRaw to afterStep lambdaRaw at gamma";
      readonly stage1FreeCalcium: "afterStep freeCa";
      readonly stage1Strain: "afterStep lambdaRaw";
      readonly finalStateSource: "Y1";
      readonly notClaimed: "not a global ModelCore SDIRK2 stage state";
    };
  };
  readonly runMatrix: readonly {
    readonly deltaVolumeMl: number;
    readonly pointRole: "pinned-low-preload" | "phase5n-best-land-output-match";
    readonly providerKind: "legacy-activeStress-source-only" | "land2017-source-only";
    readonly solverMode: "none" | "BE" | "SDIRK2";
    readonly calciumScenarioId: "legacy-activeStress" | "raw-direct-internal-c" | "phase2b-absolute-peak-ca";
    readonly fixedScale: number | null;
  }[];
  readonly boundary: {
    readonly landProviderCommitSchemeOnly: true;
    readonly noModelCoreGlobalIntegratorChange: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noSourceStressScaling: true;
    readonly noRuntimeReplacement: true;
    readonly globalModelCoreSdirk2: "not-claimed";
  };
  readonly runHealth: {
    readonly legacyTargetsSettledByConvergence: boolean;
    readonly landPointCount: number;
    readonly landPointsSettledByConvergence: number;
    readonly landPointsCapOrNonOk: number;
    readonly landSolveFailureCount: number;
    readonly sdirk2PointCount: number;
    readonly sdirk2SolveFailureCount: number;
    readonly sourceAuditSamplesPresent: boolean;
    readonly commitAuditSamplesPresent: boolean;
    readonly calciumScaleAuditSamplesPresent: boolean;
  };
  readonly pairs: readonly ModelCoreLandSdirk2ReferencePair[];
  readonly schemeComparisons: readonly ModelCoreLandSdirk2ReferenceSchemeComparison[];
  readonly analysis: {
    readonly pinnedPhase2bCalciumMappedComparison: ModelCoreLandSdirk2ReferenceSchemeComparison;
    readonly robustnessStatus:
      | "sdirk2-preserves-calcium-interface-signal"
      | "sdirk2-changes-calcium-interface-interpretation"
      | "sdirk2-reference-inconclusive";
    readonly structuralAlternansRemovalClaim: "not-established";
    readonly finalNoAlternansClaim: "not-claimed";
    readonly officialMorphologyAcceptance: "not-claimed";
    readonly runtimeReplacement: "not-claimed";
    readonly globalModelCoreSdirk2: "not-claimed";
    readonly summary: string;
    readonly requiredNextChecks: readonly string[];
  };
  readonly doesNotUnlock: readonly string[];
};

type LandScenario = {
  readonly scenarioId: LandScenarioId;
  readonly commitScheme: ModelCoreLand2017LvCommitScheme;
  readonly calciumScale: number;
};

export function buildModelCoreLandSdirk2ReferenceEvidence():
ModelCoreLandSdirk2ReferenceEvidence {
  const legacyTargets = DIAGNOSTIC_DELTAS_ML.map(runLegacyTarget);
  const scenarios = buildLandScenarios();
  const pairs = legacyTargets.flatMap((legacy) =>
    scenarios.map((scenario) => pairLandPoint(legacy, runLandPoint(legacy.deltaVolumeMl, scenario))));
  const schemeComparisons = buildSchemeComparisons(pairs);
  const analysis = analyzeSchemeComparisons(schemeComparisons);
  return {
    schemaVersion: 1,
    id: MODELCORE_LAND_SDIRK2_REFERENCE_EVIDENCE_ID,
    phase: "Phase 5C-R",
    claimBoundary: "land-source-provider-commit-solver-robustness-only",
    upstreamPhase5BArtifactId: phase5BArtifact.protocolSetId,
    upstreamPhase5NArtifactId: outputMatchArtifact.id,
    upstreamPhase5QArtifactId: phase5QArtifact.id,
    verifierScript: "verify:myocardium-modelcore-land-sdirk2-reference",
    diagnosticProtocol: {
      pinnedDeltaMl: PINNED_DELTA_ML,
      bestLandOutputMatchDeltaMl: BEST_LAND_DELTA_ML,
      diagnosticDeltasMl: DIAGNOSTIC_DELTAS_ML,
      phase5QCalciumMappingScenario: "phase2b-absolute-peak-ca",
      phase5QCalciumScale: PHASE5Q_CALCIUM_SCALE,
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
      closureInvariant:
        "ModelCore closure, qDot, valves, afterload, preload, sampling, and beat selection unchanged within each delta",
      referenceScope: "Land source-provider state commit BE-vs-SDIRK2 only",
      modelCoreGlobalIntegrator: "unchanged-current-ModelCore-stepper",
      sdirk2Tableau: LAND2017_SDIRK2_TABLEAU,
      sdirk2ProviderLocalStagePolicy: {
        stageInputSource: "provider-local interpolation from ModelCore before/after commit snapshots",
        stage0FreeCalcium: "linear interpolation from previous provider freeCa to afterStep freeCa at gamma",
        stage0Strain: "linear interpolation from beforeStep lambdaRaw to afterStep lambdaRaw at gamma",
        stage1FreeCalcium: "afterStep freeCa",
        stage1Strain: "afterStep lambdaRaw",
        finalStateSource: "Y1",
        notClaimed: "not a global ModelCore SDIRK2 stage state",
      },
    },
    runMatrix: buildRunMatrix(),
    boundary: {
      landProviderCommitSchemeOnly: true,
      noModelCoreGlobalIntegratorChange: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noSourceStressScaling: true,
      noRuntimeReplacement: true,
      globalModelCoreSdirk2: "not-claimed",
    },
    runHealth: runHealth(pairs),
    pairs,
    schemeComparisons,
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

function buildLandScenarios(): readonly LandScenario[] {
  return [
    { scenarioId: "raw-land-be", commitScheme: "BE", calciumScale: 1 },
    { scenarioId: "raw-land-sdirk2", commitScheme: "SDIRK2", calciumScale: 1 },
    { scenarioId: "phase2b-calcium-mapped-be", commitScheme: "BE", calciumScale: PHASE5Q_CALCIUM_SCALE },
    { scenarioId: "phase2b-calcium-mapped-sdirk2", commitScheme: "SDIRK2", calciumScale: PHASE5Q_CALCIUM_SCALE },
  ] as const;
}

function buildRunMatrix(): ModelCoreLandSdirk2ReferenceEvidence["runMatrix"] {
  return DIAGNOSTIC_DELTAS_ML.flatMap((deltaVolumeMl) => {
    const pointRole =
      deltaVolumeMl === PINNED_DELTA_ML
        ? "pinned-low-preload"
        : "phase5n-best-land-output-match";
    return [
      {
        deltaVolumeMl,
        pointRole,
        providerKind: "legacy-activeStress-source-only",
        solverMode: "none",
        calciumScenarioId: "legacy-activeStress",
        fixedScale: null,
      },
      {
        deltaVolumeMl,
        pointRole,
        providerKind: "land2017-source-only",
        solverMode: "BE",
        calciumScenarioId: "raw-direct-internal-c",
        fixedScale: 1,
      },
      {
        deltaVolumeMl,
        pointRole,
        providerKind: "land2017-source-only",
        solverMode: "SDIRK2",
        calciumScenarioId: "raw-direct-internal-c",
        fixedScale: 1,
      },
      {
        deltaVolumeMl,
        pointRole,
        providerKind: "land2017-source-only",
        solverMode: "BE",
        calciumScenarioId: "phase2b-absolute-peak-ca",
        fixedScale: PHASE5Q_CALCIUM_SCALE,
      },
      {
        deltaVolumeMl,
        pointRole,
        providerKind: "land2017-source-only",
        solverMode: "SDIRK2",
        calciumScenarioId: "phase2b-absolute-peak-ca",
        fixedScale: PHASE5Q_CALCIUM_SCALE,
      },
    ] as const;
  });
}

function runLegacyTarget(deltaVolumeMl: number): ModelCoreLandSdirk2ReferenceRunPoint {
  const counts = createModelCoreActiveSourcePressureAdapterInvocationCounts();
  const point = runProviderPoint(deltaVolumeMl, {
    activeSourceProviders: { LV: legacyActiveStressLvSourceOnlyProvider(counts) },
  });
  return summarizeRunPoint(point, {
    sourceProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
    scenarioId: "legacy-target",
    commitScheme: "legacy",
    calciumScale: null,
    providerInstrumentation: {
      commitScheme: "legacy",
      sourceActiveStressCallCount: counts.sourceActiveStressPa,
      commitProviderStateAfterStepCount: 0,
      landSolveFailureCount: 0,
      landSolveOkCount: 0,
      maxSolverResidualNorm: 0,
      sdirk2Stage0SolveCount: 0,
      sdirk2Stage1SolveCount: 0,
      sdirk2Stage0FailureCount: 0,
      sdirk2Stage1FailureCount: 0,
      maxSdirk2Stage0ResidualNorm: 0,
      maxSdirk2Stage1ResidualNorm: 0,
      maxSdirk2Stage0Iterations: 0,
      maxSdirk2Stage1Iterations: 0,
      maxSdirk2Stage0LineSearchSteps: 0,
      maxSdirk2Stage1LineSearchSteps: 0,
      maxPreviousFreeCalciumMismatchUM: 0,
      debugActiveStressTermsCallCount: counts.debugActiveStressTerms,
    },
  });
}

function runLandPoint(
  deltaVolumeMl: number,
  scenario: LandScenario,
): ModelCoreLandSdirk2ReferenceRunPoint {
  const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const calciumScaleAudit = createCalciumScaleAudit(scenario.calciumScale);
  const provider = scaledLandProvider(instrumentation, scenario, calciumScaleAudit);
  const point = runProviderPoint(deltaVolumeMl, {
    activeSourceProviders: { LV: provider },
  });
  return summarizeRunPoint(point, {
    sourceProviderId: provider.sourceProviderId,
    scenarioId: scenario.scenarioId,
    commitScheme: scenario.commitScheme,
    calciumScale: scenario.calciumScale,
    providerInstrumentation: {
      commitScheme: scenario.commitScheme,
      sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
      commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
      landSolveFailureCount: instrumentation.landSolveFailureCount,
      landSolveOkCount: instrumentation.landSolveOkCount,
      maxSolverResidualNorm: instrumentation.maxSolverResidualNorm,
      sdirk2Stage0SolveCount: instrumentation.sdirk2Stage0SolveCount,
      sdirk2Stage1SolveCount: instrumentation.sdirk2Stage1SolveCount,
      sdirk2Stage0FailureCount: instrumentation.sdirk2Stage0FailureCount,
      sdirk2Stage1FailureCount: instrumentation.sdirk2Stage1FailureCount,
      maxSdirk2Stage0ResidualNorm: instrumentation.maxSdirk2Stage0ResidualNorm,
      maxSdirk2Stage1ResidualNorm: instrumentation.maxSdirk2Stage1ResidualNorm,
      maxSdirk2Stage0Iterations: instrumentation.maxSdirk2Stage0Iterations,
      maxSdirk2Stage1Iterations: instrumentation.maxSdirk2Stage1Iterations,
      maxSdirk2Stage0LineSearchSteps: instrumentation.maxSdirk2Stage0LineSearchSteps,
      maxSdirk2Stage1LineSearchSteps: instrumentation.maxSdirk2Stage1LineSearchSteps,
      maxPreviousFreeCalciumMismatchUM: instrumentation.maxPreviousFreeCalciumMismatchUM,
      debugActiveStressTermsCallCount: instrumentation.debugActiveStressTerms,
      sourcePathAudit: instrumentation.sourcePathAudit,
      commitPathAudit: instrumentation.commitPathAudit,
      calciumScaleAudit,
    },
  });
}

function scaledLandProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
  scenario: LandScenario,
  calciumScaleAudit: CalciumScaleAudit,
): ModelCoreExperimentalActiveSourceProvider {
  const sourceProviderId = `${MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID}:${scenario.scenarioId}`;
  const base = land2017LvSourceOnlyProvider(instrumentation, {
    commitScheme: scenario.commitScheme,
    sourceProviderId,
  });
  return {
    ...base,
    sourceActiveStressPa: (call) =>
      base.sourceActiveStressPa?.(mapActiveCallCalcium(call, scenario.calciumScale, calciumScaleAudit, "source")) ?? 0,
    debugActiveStressTerms: (call) => {
      if (!base.debugActiveStressTerms) throw new Error(`${sourceProviderId} must define debugActiveStressTerms.`);
      return base.debugActiveStressTerms(mapActiveCallCalcium(call, scenario.calciumScale, calciumScaleAudit, "debug"));
    },
    commitProviderStateAfterStep: (call) =>
      base.commitProviderStateAfterStep?.(mapCommitCallCalcium(call, scenario.calciumScale, calciumScaleAudit)),
  };
}

function mapActiveCallCalcium(
  call: ModelCoreActiveSourceProviderCall,
  scale: number,
  audit: CalciumScaleAudit,
  pathLabel: "source" | "debug",
): ModelCoreActiveSourceProviderCall {
  const mappedC = mapCalcium(call.internal.c, scale);
  recordActiveMapping(audit, pathLabel, call.internal.c, mappedC);
  return { ...call, internal: { ...call.internal, c: mappedC } };
}

function mapCommitCallCalcium(
  call: ModelCoreActiveSourceProviderStateCommitCall,
  scale: number,
  audit: CalciumScaleAudit,
): ModelCoreActiveSourceProviderStateCommitCall {
  const mappedBefore = mapCalcium(call.beforeStep.internal.c, scale);
  const mappedAfter = mapCalcium(call.afterStep.internal.c, scale);
  recordCommitMapping(audit, call.beforeStep.internal.c, mappedBefore, call.afterStep.internal.c, mappedAfter);
  return {
    ...call,
    beforeStep: {
      ...call.beforeStep,
      internal: { ...call.beforeStep.internal, c: mappedBefore },
    },
    afterStep: {
      ...call.afterStep,
      internal: { ...call.afterStep.internal, c: mappedAfter },
    },
  };
}

function mapCalcium(value: number, scale: number): number {
  if (!Number.isFinite(value)) throw new Error("Phase 5C-R calcium input must be finite.");
  return Math.max(0, value) * scale;
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
    throw new Error("Phase 5C-R SDIRK2 reference expects exactly one independently initialized debug point.");
  }
  return point;
}

function summarizeRunPoint(
  point: LowPreloadDebugPoint,
  input: {
    readonly sourceProviderId: string;
    readonly scenarioId: LandScenarioId | "legacy-target";
    readonly commitScheme: ModelCoreLand2017LvCommitScheme | "legacy";
    readonly calciumScale: number | null;
    readonly providerInstrumentation: ProviderPointInstrumentation;
  },
): ModelCoreLandSdirk2ReferenceRunPoint {
  return {
    sourceProviderId: input.sourceProviderId,
    scenarioId: input.scenarioId,
    commitScheme: input.commitScheme,
    calciumScale: input.calciumScale,
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
    activeTraceAudit: activeTraceAudit(point),
    providerInstrumentation: input.providerInstrumentation,
  };
}

function pairLandPoint(
  legacy: ModelCoreLandSdirk2ReferenceRunPoint,
  land: ModelCoreLandSdirk2ReferenceRunPoint,
): ModelCoreLandSdirk2ReferencePair {
  const meanOutputMatchScore = outputMatchScore(legacy, land);
  const eachMetricWithinThreshold =
    normalizedError(land.CO_L, legacy.CO_L, 1) <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX
    && normalizedError(land.SV_L, legacy.SV_L, 10) <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX
    && normalizedError(land.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec, 100)
      <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX;
  const sameClosureStableHash = legacy.closureStableHash === land.closureStableHash;
  return {
    deltaVolumeMl: legacy.deltaVolumeMl,
    scenarioId: land.scenarioId as LandScenarioId,
    legacy,
    land,
    sameClosureStableHash,
    sourceProviderSolverOnlyWithinPoint:
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
      landVsLegacyAoVQDotClampHitFractionRatio:
        safeRatio(land.aovQDotClampHitFraction, legacy.aovQDotClampHitFraction),
      meanOutputMatchScore,
      eachMetricWithinThreshold,
      matchedLegacyOutputRegime:
        meanOutputMatchScore <= OUTPUT_MATCH_MEAN_SCORE_MAX && eachMetricWithinThreshold,
      clampRegimeRecovered:
        legacy.aovQDotClampHitFraction > 0
        && land.aovQDotClampHitFraction >= legacy.aovQDotClampHitFraction * 0.75,
    },
  };
}

function buildSchemeComparisons(
  pairs: readonly ModelCoreLandSdirk2ReferencePair[],
): readonly ModelCoreLandSdirk2ReferenceSchemeComparison[] {
  return DIAGNOSTIC_DELTAS_ML.flatMap((delta) => [
    compareSchemes(delta, "raw-direct", "raw-land-be", "raw-land-sdirk2", pairs),
    compareSchemes(delta, "phase2b-absolute-peak", "phase2b-calcium-mapped-be", "phase2b-calcium-mapped-sdirk2", pairs),
  ]);
}

function compareSchemes(
  deltaVolumeMl: number,
  calciumMapping: ModelCoreLandSdirk2ReferenceSchemeComparison["calciumMapping"],
  beScenarioId: LandScenarioId,
  sdirk2ScenarioId: LandScenarioId,
  pairs: readonly ModelCoreLandSdirk2ReferencePair[],
): ModelCoreLandSdirk2ReferenceSchemeComparison {
  const be = requirePair(pairs, deltaVolumeMl, beScenarioId);
  const sdirk2 = requirePair(pairs, deltaVolumeMl, sdirk2ScenarioId);
  return {
    deltaVolumeMl,
    calciumMapping,
    beScenarioId,
    sdirk2ScenarioId,
    be,
    sdirk2,
    beAndSdirk2BothFinite:
      be.land.healthStatus === "ok"
      && sdirk2.land.healthStatus === "ok"
      && be.land.providerInstrumentation.landSolveFailureCount === 0
      && sdirk2.land.providerInstrumentation.landSolveFailureCount === 0,
    periodBeatsMatch: be.land.periodBeats === sdirk2.land.periodBeats,
    sdirk2PreservesMatchedLegacyOutputRegime: sdirk2.comparison.matchedLegacyOutputRegime,
    sdirk2PreservesClampRegime: sdirk2.comparison.clampRegimeRecovered,
    outputScoreDeltaAbs:
      Math.abs(sdirk2.comparison.meanOutputMatchScore - be.comparison.meanOutputMatchScore),
    qAoPeakRatioDeltaAbs:
      Math.abs(sdirk2.comparison.landVsLegacyQAoPeakRatio - be.comparison.landVsLegacyQAoPeakRatio),
  };
}

function analyzeSchemeComparisons(
  comparisons: readonly ModelCoreLandSdirk2ReferenceSchemeComparison[],
): ModelCoreLandSdirk2ReferenceEvidence["analysis"] {
  const pinnedPhase2bCalciumMappedComparison = requireComparison(
    comparisons,
    PINNED_DELTA_ML,
    "phase2b-absolute-peak",
  );
  const robustnessStatus = classifyRobustness(pinnedPhase2bCalciumMappedComparison);
  return {
    pinnedPhase2bCalciumMappedComparison,
    robustnessStatus,
    structuralAlternansRemovalClaim: "not-established",
    finalNoAlternansClaim: "not-claimed",
    officialMorphologyAcceptance: "not-claimed",
    runtimeReplacement: "not-claimed",
    globalModelCoreSdirk2: "not-claimed",
    summary: interpretationSummary(robustnessStatus),
    requiredNextChecks: [
      "do-not-claim-final-no-alternans-from-provider-SDIRK2-alone",
      "Level-1-4-operating-point-calibration-before-runtime-design",
      "education-tool-definition-of-done-checkpoint",
    ],
  };
}

function classifyRobustness(
  comparison: ModelCoreLandSdirk2ReferenceSchemeComparison,
): ModelCoreLandSdirk2ReferenceEvidence["analysis"]["robustnessStatus"] {
  if (!comparison.beAndSdirk2BothFinite) return "sdirk2-reference-inconclusive";
  if (
    comparison.periodBeatsMatch
    && comparison.sdirk2.land.periodBeats === 1
    && comparison.sdirk2PreservesMatchedLegacyOutputRegime
    && comparison.sdirk2PreservesClampRegime
  ) {
    return "sdirk2-preserves-calcium-interface-signal";
  }
  return "sdirk2-changes-calcium-interface-interpretation";
}

function interpretationSummary(
  status: ModelCoreLandSdirk2ReferenceEvidence["analysis"]["robustnessStatus"],
): string {
  if (status === "sdirk2-preserves-calcium-interface-signal") {
    return "The Land source-provider SDIRK2 commit preserves the Phase 5C-Q calcium-interface signal at the pinned point while Land remains period-1; this reduces BE-only damping concern for the provider state update but is not a global ModelCore second-order claim.";
  }
  if (status === "sdirk2-changes-calcium-interface-interpretation") {
    return "The Land source-provider SDIRK2 commit changes the Phase 5C-Q calcium-interface interpretation; final no-alternans remains blocked pending diagnosis.";
  }
  return "The Land source-provider SDIRK2 reference is inconclusive because one or more required provider-local SDIRK2 commits reported solve failures; the preserved output/qDot signal is recorded but not accepted as final robustness evidence.";
}

function runHealth(
  pairs: readonly ModelCoreLandSdirk2ReferencePair[],
): ModelCoreLandSdirk2ReferenceEvidence["runHealth"] {
  const legacyTargetsByDelta = new Map<number, ModelCoreLandSdirk2ReferenceRunPoint>();
  for (const pair of pairs) legacyTargetsByDelta.set(pair.deltaVolumeMl, pair.legacy);
  const legacyTargets = Array.from(legacyTargetsByDelta.values());
  const landPoints = pairs.map((pair) => pair.land);
  const sdirk2Points = landPoints.filter((point) => point.commitScheme === "SDIRK2");
  return {
    legacyTargetsSettledByConvergence:
      legacyTargets.every((point) => point.settled && point.settleReason === "converged"),
    landPointCount: landPoints.length,
    landPointsSettledByConvergence:
      landPoints.filter((point) => point.settled && point.settleReason === "converged").length,
    landPointsCapOrNonOk:
      landPoints.filter((point) => point.settleReason === "cap" || point.healthStatus !== "ok").length,
    landSolveFailureCount:
      landPoints.reduce((sum, point) => sum + point.providerInstrumentation.landSolveFailureCount, 0),
    sdirk2PointCount: sdirk2Points.length,
    sdirk2SolveFailureCount:
      sdirk2Points.reduce((sum, point) => sum + point.providerInstrumentation.landSolveFailureCount, 0),
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
  legacy: ModelCoreLandSdirk2ReferenceRunPoint,
  land: ModelCoreLandSdirk2ReferenceRunPoint,
): number {
  return (
    normalizedError(land.CO_L, legacy.CO_L, 1)
    + normalizedError(land.SV_L, legacy.SV_L, 10)
    + normalizedError(land.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec, 100)
  ) / 3;
}

function requirePair(
  pairs: readonly ModelCoreLandSdirk2ReferencePair[],
  deltaVolumeMl: number,
  scenarioId: LandScenarioId,
): ModelCoreLandSdirk2ReferencePair {
  const pair = pairs.find((candidate) =>
    candidate.deltaVolumeMl === deltaVolumeMl && candidate.scenarioId === scenarioId
  );
  if (!pair) throw new Error(`Missing Phase 5C-R pair ${deltaVolumeMl}:${scenarioId}`);
  return pair;
}

function requireComparison(
  comparisons: readonly ModelCoreLandSdirk2ReferenceSchemeComparison[],
  deltaVolumeMl: number,
  calciumMapping: ModelCoreLandSdirk2ReferenceSchemeComparison["calciumMapping"],
): ModelCoreLandSdirk2ReferenceSchemeComparison {
  const comparison = comparisons.find((candidate) =>
    candidate.deltaVolumeMl === deltaVolumeMl && candidate.calciumMapping === calciumMapping
  );
  if (!comparison) throw new Error(`Missing Phase 5C-R comparison ${deltaVolumeMl}:${calciumMapping}`);
  return comparison;
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
    path.normalize("tools/myocardium/buildModelCoreLandSdirk2ReferenceEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCoreLandSdirk2ReferenceEvidence(), null, 2));
}
