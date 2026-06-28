import phase5PArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-source-forcing-bracket-result-v1.json";
import outputMatchArtifact from "@/data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreActiveSourceProviderStateCommitCall,
  ModelCoreExperimentalActiveSourceProvider,
  ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
import type { ActiveStressChamberModel, ActiveStressDebugTerms, ChamberCtx, ChamberInternal } from "@/engine/chambers";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { stableHash, sanitizeForStableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  land2017CaT50,
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
  type ModelCoreLand2017LvSignalAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MODELCORE_LAND_CALCIUM_UNIT_INTERFACE_AUDIT_EVIDENCE_ID =
  "modelcore-land-calcium-unit-interface-audit-result-v1";

const PINNED_DELTA_ML = LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl;
const BEST_LAND_DELTA_ML = outputMatchArtifact.outputMatchAnalysis.bestLandCandidate.deltaVolumeMl;
const DIAGNOSTIC_DELTAS_ML = Array.from(new Set([PINNED_DELTA_ML, BEST_LAND_DELTA_ML])).sort((a, b) => a - b);
const PHASE2B_ABSOLUTE_PEAK_CA_UM = 1.02;
const LAND_CAT50_REF_UM = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.CaT50Ref;
const PHASE5P_SCALE10_REFERENCE = 10;
const PHASE5P_MATCHED_SCALE = 30;
const OUTPUT_MATCH_MEAN_SCORE_MAX = 0.25;
const OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX = 0.35;

type MappingAxis = "direct" | "fixed-unit-scale" | "activation-equivalent" | "positive-control-scale";
type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];
type BeatTraceRow = LowPreloadDebugPoint["beatTrace"][number];

type RangeAudit = {
  min: number | null;
  max: number | null;
};

type CalciumMappingScenario = {
  readonly scenarioId: string;
  readonly axis: MappingAxis;
  readonly mappingMode:
    | "direct-internal-c"
    | "fixed-scale-from-pinned-legacy-c-peak"
    | "legacy-aInfRaw-equivalent-land-ca-trpn"
    | "legacy-aInf-equivalent-land-ca-trpn";
  readonly fixedScale: number | null;
  readonly targetPeakFreeCalciumUM: number | null;
  readonly targetReference: string;
  readonly runtimeCandidate: false;
};

type CalciumMappingAudit = {
  sourceCallCount: number;
  debugCallCount: number;
  commitCallCount: number;
  rawSourceInternalC: RangeAudit;
  mappedSourceFreeCalciumUM: RangeAudit;
  rawDebugInternalC: RangeAudit;
  mappedDebugFreeCalciumUM: RangeAudit;
  rawCommitBeforeInternalC: RangeAudit;
  mappedCommitBeforeFreeCalciumUM: RangeAudit;
  rawCommitAfterInternalC: RangeAudit;
  mappedCommitAfterFreeCalciumUM: RangeAudit;
  inverseTargetRaw: RangeAudit;
  inverseTargetClamped: RangeAudit;
  inverseCaT50UM: RangeAudit;
  inverseTargetClampCount: number;
};

type ActiveTraceAudit = {
  readonly beatTraceCount: number;
  readonly overlaySampleCount: number;
  readonly cMean: RangeAudit;
  readonly aMean: RangeAudit;
  readonly aInfMean: RangeAudit;
  readonly aInfRawMean: RangeAudit;
  readonly lambdaRawMean: RangeAudit;
  readonly sigmaActTargetMax: RangeAudit;
  readonly overlayLV_c: RangeAudit;
  readonly overlayLV_a: RangeAudit;
  readonly overlayLV_lambdaRaw: RangeAudit;
  readonly overlayLV_sigmaActTarget: RangeAudit;
};

type ProviderPointInstrumentation = {
  readonly sourceActiveStressCallCount: number;
  readonly commitProviderStateAfterStepCount: number;
  readonly landSolveFailureCount: number;
  readonly landSolveOkCount: number;
  readonly debugActiveStressTermsCallCount?: number;
  readonly maxSourceDebugStressDifferencePa?: number;
  readonly sourcePathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly commitPathAudit?: ModelCoreLand2017LvSignalAudit;
  readonly calciumMappingAudit?: CalciumMappingAudit;
};

export type ModelCoreLandCalciumUnitInterfaceRunPoint = {
  readonly sourceProviderId: string;
  readonly scenarioId: string;
  readonly axis: MappingAxis | "legacy-target";
  readonly mappingMode: CalciumMappingScenario["mappingMode"] | "legacy-activeStress";
  readonly fixedScale: number | null;
  readonly targetPeakFreeCalciumUM: number | null;
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

export type ModelCoreLandCalciumUnitInterfacePair = {
  readonly deltaVolumeMl: number;
  readonly effectiveTotalBloodVolumeMl: number;
  readonly legacy: ModelCoreLandCalciumUnitInterfaceRunPoint;
  readonly mappedLand: ModelCoreLandCalciumUnitInterfaceRunPoint;
  readonly sameClosureStableHash: boolean;
  readonly calciumMappingOnlyWithinPoint: boolean;
  readonly comparison: {
    readonly mappedVsLegacyCOLRatio: number;
    readonly mappedVsLegacySVRatio: number;
    readonly mappedVsLegacyQAoPeakRatio: number;
    readonly mappedVsLegacyPeakSigmaActRatio: number;
    readonly mappedVsLegacyAoVQDotClampHitFractionRatio: number;
    readonly meanOutputMatchScore: number;
    readonly eachMetricWithinThreshold: boolean;
    readonly matchedLegacyOutputRegime: boolean;
    readonly clampRegimeRecovered: boolean;
  };
};

export type ModelCoreLandCalciumUnitInterfaceAuditEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MODELCORE_LAND_CALCIUM_UNIT_INTERFACE_AUDIT_EVIDENCE_ID;
  readonly phase: "Phase 5C-Q";
  readonly claimBoundary: "calcium-unit-source-interface-audit-only";
  readonly upstreamPhase5PArtifactId: typeof phase5PArtifact.id;
  readonly upstreamOutputMatchArtifactId: typeof outputMatchArtifact.id;
  readonly verifierScript: "verify:myocardium-modelcore-land-calcium-unit-interface-audit";
  readonly diagnosticProtocol: {
    readonly pinnedDeltaMl: typeof PINNED_DELTA_ML;
    readonly bestLandOutputMatchDeltaMl: number;
    readonly diagnosticDeltasMl: readonly number[];
    readonly phase2bAbsolutePeakCaUM: typeof PHASE2B_ABSOLUTE_PEAK_CA_UM;
    readonly landCaT50RefUM: typeof LAND_CAT50_REF_UM;
    readonly phase5PScale10Reference: typeof PHASE5P_SCALE10_REFERENCE;
    readonly phase5PPositiveControlScale: typeof PHASE5P_MATCHED_SCALE;
    readonly pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start";
    readonly measurementOverlay: "beat-pair-overlay-enabled-for-LV-c-range";
    readonly closureInvariant: "ModelCore closure, qDot, valves, afterload, preload, sampling, and beat selection unchanged within each delta";
  };
  readonly calibration: {
    readonly pinnedLegacyDeltaMl: typeof PINNED_DELTA_ML;
    readonly pinnedLegacyCSource: "last-two-beat-overlay-LV_c-max";
    readonly pinnedLegacyCRange: RangeAudit;
    readonly pinnedLegacyCPeak: number;
    readonly phase2bAbsolutePeakScale: number;
    readonly landCaT50RefScale: number;
    readonly phase5PScale10Reference: typeof PHASE5P_SCALE10_REFERENCE;
    readonly phase5PPositiveControlScale: typeof PHASE5P_MATCHED_SCALE;
  };
  readonly boundary: {
    readonly calciumInputMappingOnly: true;
    readonly activationEquivalentMappingsAreDiagnosticOnly: true;
    readonly fixedScale30IsPhase5PPositiveControlOnly: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noSourceStressScaling: true;
    readonly noRuntimeReplacement: true;
  };
  readonly mappingScenarios: readonly CalciumMappingScenario[];
  readonly runHealth: {
    readonly legacyTargetsSettledByConvergence: boolean;
    readonly mappedPointCount: number;
    readonly mappedPointsSettledByConvergence: number;
    readonly mappedPointsCapOrNonOk: number;
    readonly landSolveFailureCount: number;
    readonly sourceAuditSamplesPresent: boolean;
    readonly commitAuditSamplesPresent: boolean;
    readonly calciumMappingAuditSamplesPresent: boolean;
  };
  readonly pairs: readonly ModelCoreLandCalciumUnitInterfacePair[];
  readonly analysis: {
    readonly bestOverallCandidate: ModelCoreLandCalciumUnitInterfacePair;
    readonly bestFixedUnitCandidate: ModelCoreLandCalciumUnitInterfacePair;
    readonly bestActivationEquivalentCandidate: ModelCoreLandCalciumUnitInterfacePair;
    readonly phase5PPositiveControlCandidate: ModelCoreLandCalciumUnitInterfacePair;
    readonly classification:
      | "simple-unit-mapping-sufficient"
      | "activation-equivalent-mapping-reaches-legacy-regime"
      | "only-phase5p-positive-control-scale-reaches-legacy-regime"
      | "calcium-unit-interface-mapping-inconclusive";
    readonly structuralAlternansRemovalClaim: "not-established";
    readonly finalNoAlternansClaim: "not-claimed";
    readonly officialMorphologyAcceptance: "not-claimed";
    readonly runtimeReplacement: "not-claimed";
    readonly summary: string;
    readonly requiredNextChecks: readonly string[];
  };
  readonly doesNotUnlock: readonly string[];
};

export function buildModelCoreLandCalciumUnitInterfaceAuditEvidence():
ModelCoreLandCalciumUnitInterfaceAuditEvidence {
  const legacyTargets = DIAGNOSTIC_DELTAS_ML.map(runLegacyTarget);
  const pinnedLegacy = requirePinnedLegacyTarget(legacyTargets);
  const calibration = buildCalibration(pinnedLegacy);
  const mappingScenarios = buildMappingScenarios(calibration);
  const pairs = legacyTargets.flatMap((legacy) =>
    mappingScenarios.map((scenario) => pairMappedPoint(legacy, runMappedLandPoint(legacy.deltaVolumeMl, scenario))));
  const analysis = analyzePairs(pairs);
  return {
    schemaVersion: 1,
    id: MODELCORE_LAND_CALCIUM_UNIT_INTERFACE_AUDIT_EVIDENCE_ID,
    phase: "Phase 5C-Q",
    claimBoundary: "calcium-unit-source-interface-audit-only",
    upstreamPhase5PArtifactId: phase5PArtifact.id,
    upstreamOutputMatchArtifactId: outputMatchArtifact.id,
    verifierScript: "verify:myocardium-modelcore-land-calcium-unit-interface-audit",
    diagnosticProtocol: {
      pinnedDeltaMl: PINNED_DELTA_ML,
      bestLandOutputMatchDeltaMl: BEST_LAND_DELTA_ML,
      diagnosticDeltasMl: DIAGNOSTIC_DELTAS_ML,
      phase2bAbsolutePeakCaUM: PHASE2B_ABSOLUTE_PEAK_CA_UM,
      landCaT50RefUM: LAND_CAT50_REF_UM,
      phase5PScale10Reference: PHASE5P_SCALE10_REFERENCE,
      phase5PPositiveControlScale: PHASE5P_MATCHED_SCALE,
      pointInitialization: "independent-from-target-tbv-no-cross-point-warm-start",
      measurementOverlay: "beat-pair-overlay-enabled-for-LV-c-range",
      closureInvariant:
        "ModelCore closure, qDot, valves, afterload, preload, sampling, and beat selection unchanged within each delta",
    },
    calibration,
    boundary: {
      calciumInputMappingOnly: true,
      activationEquivalentMappingsAreDiagnosticOnly: true,
      fixedScale30IsPhase5PPositiveControlOnly: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noSourceStressScaling: true,
      noRuntimeReplacement: true,
    },
    mappingScenarios,
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
      "sourceStressScaling",
      "TriSegAdoption",
      "StudioScientificValidityClaim",
    ],
  };
}

function buildCalibration(
  pinnedLegacy: ModelCoreLandCalciumUnitInterfaceRunPoint,
): ModelCoreLandCalciumUnitInterfaceAuditEvidence["calibration"] {
  const pinnedLegacyCPeak = requirePositiveFinite(
    pinnedLegacy.activeTraceAudit.overlayLV_c.max ?? pinnedLegacy.activeTraceAudit.cMean.max ?? Number.NaN,
    "pinned legacy LV_c peak",
  );
  return {
    pinnedLegacyDeltaMl: PINNED_DELTA_ML,
    pinnedLegacyCSource: "last-two-beat-overlay-LV_c-max",
    pinnedLegacyCRange: pinnedLegacy.activeTraceAudit.overlayLV_c,
    pinnedLegacyCPeak,
    phase2bAbsolutePeakScale: PHASE2B_ABSOLUTE_PEAK_CA_UM / pinnedLegacyCPeak,
    landCaT50RefScale: LAND_CAT50_REF_UM / pinnedLegacyCPeak,
    phase5PScale10Reference: PHASE5P_SCALE10_REFERENCE,
    phase5PPositiveControlScale: PHASE5P_MATCHED_SCALE,
  };
}

function buildMappingScenarios(
  calibration: ModelCoreLandCalciumUnitInterfaceAuditEvidence["calibration"],
): readonly CalciumMappingScenario[] {
  return [
    {
      scenarioId: "raw-direct-internal-c",
      axis: "direct",
      mappingMode: "direct-internal-c",
      fixedScale: 1,
      targetPeakFreeCalciumUM: calibration.pinnedLegacyCPeak,
      targetReference: "current ModelCore Land bridge: freeCaUM = legacy internal.c",
      runtimeCandidate: false,
    },
    {
      scenarioId: "phase2b-absolute-peak-ca",
      axis: "fixed-unit-scale",
      mappingMode: "fixed-scale-from-pinned-legacy-c-peak",
      fixedScale: calibration.phase2bAbsolutePeakScale,
      targetPeakFreeCalciumUM: PHASE2B_ABSOLUTE_PEAK_CA_UM,
      targetReference: "Phase 2B absolute peak Ca target, 0.12 uM diastolic plus 0.9 uM amplitude",
      runtimeCandidate: false,
    },
    {
      scenarioId: "land-cat50ref-peak-ca",
      axis: "fixed-unit-scale",
      mappingMode: "fixed-scale-from-pinned-legacy-c-peak",
      fixedScale: calibration.landCaT50RefScale,
      targetPeakFreeCalciumUM: LAND_CAT50_REF_UM,
      targetReference: "Land 2017 intact-human CaT50Ref used as pinned legacy peak mapping target",
      runtimeCandidate: false,
    },
    {
      scenarioId: "legacy-aInfRaw-equivalent-ca-trpn",
      axis: "activation-equivalent",
      mappingMode: "legacy-aInfRaw-equivalent-land-ca-trpn",
      fixedScale: null,
      targetPeakFreeCalciumUM: null,
      targetReference: "diagnostic inverse Land Eq 47 freeCa for legacy active-stress aInfRaw at current lambda",
      runtimeCandidate: false,
    },
    {
      scenarioId: "legacy-aInf-equivalent-ca-trpn",
      axis: "activation-equivalent",
      mappingMode: "legacy-aInf-equivalent-land-ca-trpn",
      fixedScale: null,
      targetPeakFreeCalciumUM: null,
      targetReference: "diagnostic inverse Land Eq 47 freeCa for legacy effective aInf at current lambda",
      runtimeCandidate: false,
    },
    {
      scenarioId: "phase5p-calcium-scale-10-reference",
      axis: "positive-control-scale",
      mappingMode: "fixed-scale-from-pinned-legacy-c-peak",
      fixedScale: PHASE5P_SCALE10_REFERENCE,
      targetPeakFreeCalciumUM: calibration.pinnedLegacyCPeak * PHASE5P_SCALE10_REFERENCE,
      targetReference: "Phase 5C-P calcium scale 10 reference; coarse gate reference only, not runtime acceptance",
      runtimeCandidate: false,
    },
    {
      scenarioId: "phase5p-calcium-scale-30-control",
      axis: "positive-control-scale",
      mappingMode: "fixed-scale-from-pinned-legacy-c-peak",
      fixedScale: PHASE5P_MATCHED_SCALE,
      targetPeakFreeCalciumUM: calibration.pinnedLegacyCPeak * PHASE5P_MATCHED_SCALE,
      targetReference: "Phase 5C-P matched-output calcium scale; positive control only, not runtime acceptance",
      runtimeCandidate: false,
    },
  ] as const;
}

function runLegacyTarget(deltaVolumeMl: number): ModelCoreLandCalciumUnitInterfaceRunPoint {
  const counts = createModelCoreActiveSourcePressureAdapterInvocationCounts();
  const point = runProviderPoint(deltaVolumeMl, {
    activeSourceProviders: { LV: legacyActiveStressLvSourceOnlyProvider(counts) },
  });
  return summarizeRunPoint(point, {
    sourceProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
    scenarioId: "legacy-target",
    axis: "legacy-target",
    mappingMode: "legacy-activeStress",
    fixedScale: null,
    targetPeakFreeCalciumUM: null,
    providerInstrumentation: {
      sourceActiveStressCallCount: counts.sourceActiveStressPa,
      commitProviderStateAfterStepCount: 0,
      landSolveFailureCount: 0,
      landSolveOkCount: 0,
      debugActiveStressTermsCallCount: counts.debugActiveStressTerms,
    },
  });
}

function runMappedLandPoint(
  deltaVolumeMl: number,
  scenario: CalciumMappingScenario,
): ModelCoreLandCalciumUnitInterfaceRunPoint {
  const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const calciumMappingAudit = createCalciumMappingAudit();
  const provider = mappedLand2017LvSourceOnlyProvider(instrumentation, scenario, calciumMappingAudit);
  const point = runProviderPoint(deltaVolumeMl, {
    activeSourceProviders: { LV: provider },
  });
  return summarizeRunPoint(point, {
    sourceProviderId: provider.sourceProviderId,
    scenarioId: scenario.scenarioId,
    axis: scenario.axis,
    mappingMode: scenario.mappingMode,
    fixedScale: scenario.fixedScale,
    targetPeakFreeCalciumUM: scenario.targetPeakFreeCalciumUM,
    providerInstrumentation: {
      sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
      commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
      landSolveFailureCount: instrumentation.landSolveFailureCount,
      landSolveOkCount: instrumentation.landSolveOkCount,
      debugActiveStressTermsCallCount: instrumentation.debugActiveStressTerms,
      maxSourceDebugStressDifferencePa: instrumentation.maxSourceDebugStressDifferencePa,
      sourcePathAudit: instrumentation.sourcePathAudit,
      commitPathAudit: instrumentation.commitPathAudit,
      calciumMappingAudit,
    },
  });
}

function mappedLand2017LvSourceOnlyProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
  scenario: CalciumMappingScenario,
  calciumMappingAudit: CalciumMappingAudit,
): ModelCoreExperimentalActiveSourceProvider {
  const base = land2017LvSourceOnlyProvider(instrumentation);
  const sourceProviderId =
    `${MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID}:${scenario.scenarioId}`;
  return {
    ...base,
    sourceProviderId,
    sourceActiveStressPa: (call) =>
      base.sourceActiveStressPa?.(mapActiveCallCalcium(call, scenario, calciumMappingAudit, "source")) ?? 0,
    debugActiveStressTerms: (call) => {
      if (!base.debugActiveStressTerms) {
        throw new Error(`Mapped Land provider ${sourceProviderId} must define source-specific debugActiveStressTerms.`);
      }
      return base.debugActiveStressTerms(mapActiveCallCalcium(call, scenario, calciumMappingAudit, "debug"));
    },
    commitProviderStateAfterStep: (call) =>
      base.commitProviderStateAfterStep?.(mapCommitCallCalcium(call, scenario, calciumMappingAudit)),
  };
}

function mapActiveCallCalcium(
  call: ModelCoreActiveSourceProviderCall,
  scenario: CalciumMappingScenario,
  audit: CalciumMappingAudit,
  pathLabel: "source" | "debug",
): ModelCoreActiveSourceProviderCall {
  const mappedC = mappedFreeCalciumUM({
    activeModel: call.activeModel,
    volumeMl: call.volumeMl,
    internal: call.internal,
    chamberCtx: call.chamberCtx,
  }, scenario, audit);
  recordActiveMapping(audit, pathLabel, call.internal.c, mappedC);
  return {
    ...call,
    internal: {
      ...call.internal,
      c: mappedC,
    },
  };
}

function mapCommitCallCalcium(
  call: ModelCoreActiveSourceProviderStateCommitCall,
  scenario: CalciumMappingScenario,
  audit: CalciumMappingAudit,
): ModelCoreActiveSourceProviderStateCommitCall {
  const mappedBefore = mappedFreeCalciumUM({
    activeModel: call.activeModel,
    volumeMl: call.beforeStep.effectiveVolumeMl,
    internal: call.beforeStep.internal,
    chamberCtx: call.beforeStep.chamberCtx,
  }, scenario, audit);
  const mappedAfter = mappedFreeCalciumUM({
    activeModel: call.activeModel,
    volumeMl: call.afterStep.effectiveVolumeMl,
    internal: call.afterStep.internal,
    chamberCtx: call.afterStep.chamberCtx,
  }, scenario, audit);
  recordCommitMapping(audit, call.beforeStep.internal.c, mappedBefore, call.afterStep.internal.c, mappedAfter);
  return {
    ...call,
    beforeStep: {
      ...call.beforeStep,
      internal: {
        ...call.beforeStep.internal,
        c: mappedBefore,
      },
    },
    afterStep: {
      ...call.afterStep,
      internal: {
        ...call.afterStep.internal,
        c: mappedAfter,
      },
    },
  };
}

function mappedFreeCalciumUM(
  input: {
    readonly activeModel: ActiveStressChamberModel;
    readonly volumeMl: number;
    readonly internal: ChamberInternal;
    readonly chamberCtx: ChamberCtx;
  },
  scenario: CalciumMappingScenario,
  audit: CalciumMappingAudit,
): number {
  const rawC = Math.max(input.internal.c, 0);
  if (scenario.mappingMode === "direct-internal-c") return rawC;
  if (scenario.mappingMode === "fixed-scale-from-pinned-legacy-c-peak") {
    return rawC * requirePositiveFinite(scenario.fixedScale ?? Number.NaN, `${scenario.scenarioId}.fixedScale`);
  }
  const legacyTerms = input.activeModel.debugActiveStressTerms(input.volumeMl, input.internal, input.chamberCtx);
  const rawTarget = scenario.mappingMode === "legacy-aInfRaw-equivalent-land-ca-trpn"
    ? legacyTerms.aInfRaw
    : legacyTerms.aInf;
  const clampedTarget = clampOpen01(rawTarget);
  const caT50UM = land2017CaT50(legacyTerms.lambdaRaw, LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values);
  updateRange(audit.inverseTargetRaw, rawTarget);
  updateRange(audit.inverseTargetClamped, clampedTarget);
  updateRange(audit.inverseCaT50UM, caT50UM);
  if (clampedTarget !== rawTarget) audit.inverseTargetClampCount += 1;
  return invertLandCaTrpnSteadyState(clampedTarget, caT50UM);
}

function invertLandCaTrpnSteadyState(targetCaTrpn: number, caT50UM: number): number {
  const p = LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values;
  return caT50UM * Math.pow(targetCaTrpn / (1 - targetCaTrpn), 1 / p.nTRPN);
}

function createCalciumMappingAudit(): CalciumMappingAudit {
  return {
    sourceCallCount: 0,
    debugCallCount: 0,
    commitCallCount: 0,
    rawSourceInternalC: emptyRangeAudit(),
    mappedSourceFreeCalciumUM: emptyRangeAudit(),
    rawDebugInternalC: emptyRangeAudit(),
    mappedDebugFreeCalciumUM: emptyRangeAudit(),
    rawCommitBeforeInternalC: emptyRangeAudit(),
    mappedCommitBeforeFreeCalciumUM: emptyRangeAudit(),
    rawCommitAfterInternalC: emptyRangeAudit(),
    mappedCommitAfterFreeCalciumUM: emptyRangeAudit(),
    inverseTargetRaw: emptyRangeAudit(),
    inverseTargetClamped: emptyRangeAudit(),
    inverseCaT50UM: emptyRangeAudit(),
    inverseTargetClampCount: 0,
  };
}

function recordActiveMapping(
  audit: CalciumMappingAudit,
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
  audit: CalciumMappingAudit,
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
    throw new Error("Phase 5C-Q calcium unit/interface audit expects exactly one independently initialized debug point.");
  }
  return point;
}

function summarizeRunPoint(
  point: LowPreloadDebugPoint,
  input: {
    readonly sourceProviderId: string;
    readonly scenarioId: string;
    readonly axis: MappingAxis | "legacy-target";
    readonly mappingMode: CalciumMappingScenario["mappingMode"] | "legacy-activeStress";
    readonly fixedScale: number | null;
    readonly targetPeakFreeCalciumUM: number | null;
    readonly providerInstrumentation: ProviderPointInstrumentation;
  },
): ModelCoreLandCalciumUnitInterfaceRunPoint {
  return {
    sourceProviderId: input.sourceProviderId,
    scenarioId: input.scenarioId,
    axis: input.axis,
    mappingMode: input.mappingMode,
    fixedScale: input.fixedScale,
    targetPeakFreeCalciumUM: input.targetPeakFreeCalciumUM,
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

function pairMappedPoint(
  legacy: ModelCoreLandCalciumUnitInterfaceRunPoint,
  mappedLand: ModelCoreLandCalciumUnitInterfaceRunPoint,
): ModelCoreLandCalciumUnitInterfacePair {
  const meanOutputMatchScore = outputMatchScore(legacy, mappedLand);
  const eachMetricWithinThreshold =
    normalizedError(mappedLand.CO_L, legacy.CO_L, 1) <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX
    && normalizedError(mappedLand.SV_L, legacy.SV_L, 10) <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX
    && normalizedError(mappedLand.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec, 100)
      <= OUTPUT_MATCH_EACH_METRIC_RELATIVE_ERROR_MAX;
  const sameClosureStableHash = legacy.closureStableHash === mappedLand.closureStableHash;
  const calciumMappingOnlyWithinPoint =
    sameClosureStableHash
    && legacy.deltaVolumeMl === mappedLand.deltaVolumeMl
    && legacy.effectiveTotalBloodVolumeMl === mappedLand.effectiveTotalBloodVolumeMl
    && legacy.providerInstrumentation.sourceActiveStressCallCount > 0
    && mappedLand.providerInstrumentation.sourceActiveStressCallCount > 0
    && mappedLand.providerInstrumentation.commitProviderStateAfterStepCount > 0
    && mappedLand.providerInstrumentation.landSolveFailureCount === 0
    && (mappedLand.providerInstrumentation.calciumMappingAudit?.sourceCallCount ?? 0) > 0
    && (mappedLand.providerInstrumentation.calciumMappingAudit?.commitCallCount ?? 0) > 0;
  return {
    deltaVolumeMl: legacy.deltaVolumeMl,
    effectiveTotalBloodVolumeMl: legacy.effectiveTotalBloodVolumeMl,
    legacy,
    mappedLand,
    sameClosureStableHash,
    calciumMappingOnlyWithinPoint,
    comparison: {
      mappedVsLegacyCOLRatio: safeRatio(mappedLand.CO_L, legacy.CO_L),
      mappedVsLegacySVRatio: safeRatio(mappedLand.SV_L, legacy.SV_L),
      mappedVsLegacyQAoPeakRatio: safeRatio(mappedLand.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec),
      mappedVsLegacyPeakSigmaActRatio: safeRatio(mappedLand.peakSigmaActPa, legacy.peakSigmaActPa),
      mappedVsLegacyAoVQDotClampHitFractionRatio:
        safeRatio(mappedLand.aovQDotClampHitFraction, legacy.aovQDotClampHitFraction),
      meanOutputMatchScore,
      eachMetricWithinThreshold,
      matchedLegacyOutputRegime:
        meanOutputMatchScore <= OUTPUT_MATCH_MEAN_SCORE_MAX && eachMetricWithinThreshold,
      clampRegimeRecovered:
        legacy.aovQDotClampHitFraction > 0
        && mappedLand.aovQDotClampHitFraction >= legacy.aovQDotClampHitFraction * 0.75,
    },
  };
}

function analyzePairs(
  pairs: readonly ModelCoreLandCalciumUnitInterfacePair[],
): ModelCoreLandCalciumUnitInterfaceAuditEvidence["analysis"] {
  const candidates = pairs
    .filter((pair) => pair.mappedLand.settled && pair.mappedLand.settleReason === "converged")
    .sort((a, b) => a.comparison.meanOutputMatchScore - b.comparison.meanOutputMatchScore);
  const fixedUnitCandidates = candidates.filter((pair) => pair.mappedLand.axis === "fixed-unit-scale");
  const activationEquivalentCandidates = candidates.filter((pair) => pair.mappedLand.axis === "activation-equivalent");
  const phase5PPositiveCandidates = candidates.filter((pair) => pair.mappedLand.axis === "positive-control-scale");
  const bestOverallCandidate = candidates[0] ?? pairs[0];
  const bestFixedUnitCandidate = fixedUnitCandidates[0] ?? bestOverallCandidate;
  const bestActivationEquivalentCandidate = activationEquivalentCandidates[0] ?? bestOverallCandidate;
  const phase5PPositiveControlCandidate = phase5PPositiveCandidates[0] ?? bestOverallCandidate;
  const classification = classifyAnalysis(
    bestFixedUnitCandidate,
    bestActivationEquivalentCandidate,
    phase5PPositiveControlCandidate,
  );
  return {
    bestOverallCandidate,
    bestFixedUnitCandidate,
    bestActivationEquivalentCandidate,
    phase5PPositiveControlCandidate,
    classification,
    structuralAlternansRemovalClaim: "not-established",
    finalNoAlternansClaim: "not-claimed",
    officialMorphologyAcceptance: "not-claimed",
    runtimeReplacement: "not-claimed",
    summary: interpretationSummary(classification),
    requiredNextChecks: [
      "SDIRK2-reference-before-final-no-alternans",
      "exit-alternans-mechanism-subphase-after-calcium-interface-and-SDIRK2",
      "Level-1-4-operating-point-calibration-before-runtime-design",
    ],
  };
}

function classifyAnalysis(
  bestFixedUnitCandidate: ModelCoreLandCalciumUnitInterfacePair,
  bestActivationEquivalentCandidate: ModelCoreLandCalciumUnitInterfacePair,
  phase5PPositiveControlCandidate: ModelCoreLandCalciumUnitInterfacePair,
): ModelCoreLandCalciumUnitInterfaceAuditEvidence["analysis"]["classification"] {
  if (bestFixedUnitCandidate.comparison.matchedLegacyOutputRegime) return "simple-unit-mapping-sufficient";
  if (bestActivationEquivalentCandidate.comparison.matchedLegacyOutputRegime) {
    return "activation-equivalent-mapping-reaches-legacy-regime";
  }
  if (phase5PPositiveControlCandidate.comparison.matchedLegacyOutputRegime) {
    return "only-phase5p-positive-control-scale-reaches-legacy-regime";
  }
  return "calcium-unit-interface-mapping-inconclusive";
}

function interpretationSummary(
  classification: ModelCoreLandCalciumUnitInterfaceAuditEvidence["analysis"]["classification"],
): string {
  if (classification === "simple-unit-mapping-sufficient") {
    return "A fixed unit-style calcium mapping reached the coarse legacy output/qDot regime; next work should test the mapped candidate with SDIRK2 before runtime design.";
  }
  if (classification === "activation-equivalent-mapping-reaches-legacy-regime") {
    return "Only a legacy-activation-equivalent diagnostic mapping reached the coarse legacy output/qDot regime; this points to source-interface semantics, not a simple unit conversion.";
  }
  if (classification === "only-phase5p-positive-control-scale-reaches-legacy-regime") {
    return "The Phase 5C-P high calcium scale remains the only mapped Land point reaching the coarse legacy output/qDot regime; simple unit-style mappings did not explain the interface gap.";
  }
  return "The calcium unit/source-interface audit did not identify an interpretable mapped Land point in the coarse legacy output/qDot regime.";
}

function runHealth(
  pairs: readonly ModelCoreLandCalciumUnitInterfacePair[],
): ModelCoreLandCalciumUnitInterfaceAuditEvidence["runHealth"] {
  const legacyTargetsByDelta = new Map<number, ModelCoreLandCalciumUnitInterfaceRunPoint>();
  for (const pair of pairs) legacyTargetsByDelta.set(pair.deltaVolumeMl, pair.legacy);
  const legacyTargets = Array.from(legacyTargetsByDelta.values());
  const mappedPoints = pairs.map((pair) => pair.mappedLand);
  return {
    legacyTargetsSettledByConvergence:
      legacyTargets.every((point) => point.settled && point.settleReason === "converged"),
    mappedPointCount: mappedPoints.length,
    mappedPointsSettledByConvergence:
      mappedPoints.filter((point) => point.settled && point.settleReason === "converged").length,
    mappedPointsCapOrNonOk:
      mappedPoints.filter((point) => point.settleReason === "cap" || point.healthStatus !== "ok").length,
    landSolveFailureCount:
      mappedPoints.reduce((sum, point) => sum + point.providerInstrumentation.landSolveFailureCount, 0),
    sourceAuditSamplesPresent:
      mappedPoints.every((point) => (point.providerInstrumentation.sourcePathAudit?.sampleCount ?? 0) > 0),
    commitAuditSamplesPresent:
      mappedPoints.every((point) => (point.providerInstrumentation.commitPathAudit?.sampleCount ?? 0) > 0),
    calciumMappingAuditSamplesPresent:
      mappedPoints.every((point) =>
        (point.providerInstrumentation.calciumMappingAudit?.sourceCallCount ?? 0) > 0
        && (point.providerInstrumentation.calciumMappingAudit?.commitCallCount ?? 0) > 0),
  };
}

function activeTraceAudit(point: LowPreloadDebugPoint): ActiveTraceAudit {
  const lvBeatTerms = point.beatTrace.map((beat) => beat.active.LV).filter((terms): terms is ActiveStressDebugTermsSummary => !!terms);
  const overlayRows = point.beatPairOverlay?.rows ?? [];
  return {
    beatTraceCount: point.beatTrace.length,
    overlaySampleCount: overlayRows.length,
    cMean: rangeFrom(lvBeatTerms.map((terms) => terms.cMean)),
    aMean: rangeFrom(lvBeatTerms.map((terms) => terms.aMean)),
    aInfMean: rangeFrom(lvBeatTerms.map((terms) => terms.aInfMean)),
    aInfRawMean: rangeFrom(lvBeatTerms.map((terms) => terms.aInfRawMean)),
    lambdaRawMean: rangeFrom(lvBeatTerms.map((terms) => terms.lambdaRawMean)),
    sigmaActTargetMax: rangeFrom(lvBeatTerms.map((terms) => terms.sigmaActTargetMax)),
    overlayLV_c: rangeFrom(overlayRows.map((row) => row.LV_c)),
    overlayLV_a: rangeFrom(overlayRows.map((row) => row.LV_a)),
    overlayLV_lambdaRaw: rangeFrom(overlayRows.map((row) => row.LV_lambdaRaw)),
    overlayLV_sigmaActTarget: rangeFrom(overlayRows.map((row) => row.LV_sigmaActTarget)),
  };
}

type ActiveStressDebugTermsSummary = NonNullable<BeatTraceRow["active"]["LV"]>;

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
  legacy: ModelCoreLandCalciumUnitInterfaceRunPoint,
  mapped: ModelCoreLandCalciumUnitInterfaceRunPoint,
): number {
  return (
    normalizedError(mapped.CO_L, legacy.CO_L, 1)
    + normalizedError(mapped.SV_L, legacy.SV_L, 10)
    + normalizedError(mapped.QAoPeakMlPerSec, legacy.QAoPeakMlPerSec, 100)
  ) / 3;
}

function requirePinnedLegacyTarget(
  legacyTargets: readonly ModelCoreLandCalciumUnitInterfaceRunPoint[],
): ModelCoreLandCalciumUnitInterfaceRunPoint {
  const pinned = legacyTargets.find((point) => point.deltaVolumeMl === PINNED_DELTA_ML);
  if (!pinned) throw new Error("Phase 5C-Q requires the pinned Phase 5C-L/M low-preload legacy target.");
  return pinned;
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

function clampOpen01(value: number): number {
  if (!Number.isFinite(value)) return 1e-6;
  return Math.min(1 - 1e-6, Math.max(1e-6, value));
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive and finite.`);
  return value;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildModelCoreLandCalciumUnitInterfaceAuditEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCoreLandCalciumUnitInterfaceAuditEvidence(), null, 2));
}
