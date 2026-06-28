import descriptor from "@/data/myocardium/protocols/modelcore-active-source-pressure-adapter-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { stableHash, sanitizeForStableHash } from "@/engine/myocardium/kinematics/stableHash";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { runLowPreloadDebug } from "@/tools/debugStarlingLowPreload";
import {
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
  createModelCoreActiveSourceProviderInvocationCounts,
  legacyActiveStressLvSourceProvider,
  type ModelCoreActiveSourceProviderInvocationCounts,
} from "@/tools/myocardium/buildModelCoreEquivalentPositiveControlClosureEvidence";
import {
  MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_ID,
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
  createModelCoreActiveSourcePressureAdapterInvocationCounts,
  legacyActiveStressLvSourceOnlyProvider,
  type ModelCoreActiveSourcePressureAdapterInvocationCounts,
} from "@/tools/myocardium/modelCoreActiveSourcePressureAdapter";

export const MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_EVIDENCE_ID =
  "modelcore-active-source-pressure-adapter-v1";

type LowPreloadDebugPoint = ReturnType<typeof runLowPreloadDebug>["points"][number];

type PositiveControlSummary = {
  readonly sourceProviderId: string;
  readonly status: "period-2-positive-control-pass" | "period-2-positive-control-fail";
  readonly settled: boolean;
  readonly periodBeats: number;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly tbvClassification: string;
  readonly tbvSanitizeAbsMl: number;
  readonly tbvProjectionAppliedMl: number;
  readonly maxValveReverseMl: number;
  readonly stableHash: string;
};

export type ModelCoreActiveSourcePressureAdapterEvidence = {
  readonly evidenceId: typeof MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_EVIDENCE_ID;
  readonly descriptorId: string;
  readonly phase: "Phase 5C-K";
  readonly claimBoundary: "experimental-source-only-pressure-adapter-readiness";
  readonly ownerDecisionStatus: "accepted-experimental-branch-only";
  readonly productionRuntimeStatus: "not-production-runtime-replacement";
  readonly fixedLowPreloadProtocol: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL;
  readonly adapterBoundary: {
    readonly adapterId: typeof MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_ID;
    readonly sourceOnlyProviderId: typeof MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID;
    readonly sourceProviderScope: "LV-only-legacy-positive-control";
    readonly sourceOnlyProviderHasPressureMethod: boolean;
    readonly sourceOnlyProviderHasPassivePressureMethod: boolean;
    readonly sourceOnlyProviderHasDebugPressureTermsMethod: boolean;
    readonly sourceOnlyProviderHasSourceSpecificDebugActiveStressTerms: boolean;
    readonly sourceActiveStressPathInvoked: boolean;
    readonly modelCorePressureAssemblyPathRequired: boolean;
    readonly providerObjectMutableSolverStateAllowed: false;
    readonly mutableSolverStateMustLiveInProviderState: true;
    readonly instrumentationCountersMayLiveOutsideProviderState: true;
  };
  readonly fullPressureProviderPositiveControl: PositiveControlSummary;
  readonly sourceOnlyAdapterPositiveControl: PositiveControlSummary;
  readonly equivalenceEvidence: {
    readonly comparatorProviderId: typeof MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID;
    readonly sourceOnlyProviderId: typeof MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID;
    readonly payloadStableHashFullPressure: string;
    readonly payloadStableHashSourceOnly: string;
    readonly stableHashesMatch: boolean;
    readonly maxAbsNumericDifference: number;
    readonly tolerance: number;
    readonly legacySourceOnlyPressureEquivalent: boolean;
  };
  readonly hookInvocationEvidence: {
    readonly fullPressureInvocationCounts: ModelCoreActiveSourceProviderInvocationCounts;
    readonly sourceOnlyInvocationCounts: ModelCoreActiveSourcePressureAdapterInvocationCounts;
  };
  readonly routeAssessment: {
    readonly routeId: "modelcore-equivalent-closure-positive-control";
    readonly adapterStatus: "source-only-pressure-adapter-implemented";
    readonly routeSatisfactionStatus: "partial-legacy-positive-control-pass-land-pairing-not-run";
    readonly sourceProviderDifferenceOnlyStatus: "adapter-ready-land-not-yet-evaluated";
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

function runPinnedPoint(experimentalModelCoreOptions: ModelCoreExperimentalOptions): LowPreloadDebugPoint {
  const debugReport = runLowPreloadDebug(lowPreloadOptions(experimentalModelCoreOptions));
  const point = debugReport.points[0];
  if (!point || debugReport.points.length !== 1) {
    throw new Error("Phase 5C-K source pressure adapter evidence expects exactly one debug point.");
  }
  return point;
}

function summarizePositiveControl(
  point: LowPreloadDebugPoint,
  sourceProviderId: string,
  payloadHash: string,
): PositiveControlSummary {
  const maxValveReverseMl = Math.max(
    point.valveVolumesMl.MVReverse,
    point.valveVolumesMl.AoVReverse,
    point.valveVolumesMl.TVReverse,
    point.valveVolumesMl.PVReverse,
  );
  const pass =
    point.settle.settled === true
    && point.settle.periodBeats === 2
    && point.settle.adjacentDelta > 0.1
    && point.settle.periodDelta < 0.05
    && point.tbvAudit.classification === "clean"
    && point.tbvAudit.sanitizeAbsMl <= 0.05
    && point.tbvAudit.projectionAbsAppliedMl <= 0.05
    && maxValveReverseMl <= 0.05;
  return {
    sourceProviderId,
    status: pass ? "period-2-positive-control-pass" : "period-2-positive-control-fail",
    settled: point.settle.settled,
    periodBeats: point.settle.periodBeats,
    adjacentDelta: point.settle.adjacentDelta,
    periodDelta: point.settle.periodDelta,
    tbvClassification: point.tbvAudit.classification,
    tbvSanitizeAbsMl: point.tbvAudit.sanitizeAbsMl,
    tbvProjectionAppliedMl: point.tbvAudit.projectionAbsAppliedMl,
    maxValveReverseMl,
    stableHash: payloadHash,
  };
}

function equivalencePayload(point: LowPreloadDebugPoint): unknown {
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

function maxAbsNumericDifference(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b);
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return Number.POSITIVE_INFINITY;
    return a.reduce((maxDiff, value, index) => Math.max(maxDiff, maxAbsNumericDifference(value, b[index])), 0);
  }
  if (isRecord(a) && isRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let maxDiff = 0;
    for (const key of keys) {
      if (!(key in a) || !(key in b)) return Number.POSITIVE_INFINITY;
      maxDiff = Math.max(maxDiff, maxAbsNumericDifference(a[key], b[key]));
    }
    return maxDiff;
  }
  return Object.is(a, b) ? 0 : Number.POSITIVE_INFINITY;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildModelCoreActiveSourcePressureAdapterEvidence(): ModelCoreActiveSourcePressureAdapterEvidence {
  const fullPressureInvocationCounts = createModelCoreActiveSourceProviderInvocationCounts();
  const fullPressureProvider = legacyActiveStressLvSourceProvider(fullPressureInvocationCounts);
  const fullPressurePoint = runPinnedPoint({
    activeSourceProviders: { LV: fullPressureProvider },
  });

  const sourceOnlyInvocationCounts = createModelCoreActiveSourcePressureAdapterInvocationCounts();
  const sourceOnlyProvider = legacyActiveStressLvSourceOnlyProvider(sourceOnlyInvocationCounts);
  const sourceOnlyPoint = runPinnedPoint({
    activeSourceProviders: { LV: sourceOnlyProvider },
  });

  const fullPressurePayload = equivalencePayload(fullPressurePoint);
  const sourceOnlyPayload = equivalencePayload(sourceOnlyPoint);
  const payloadStableHashFullPressure = stableHash(fullPressurePayload);
  const payloadStableHashSourceOnly = stableHash(sourceOnlyPayload);
  const maxDifference = maxAbsNumericDifference(fullPressurePayload, sourceOnlyPayload);
  const tolerance = 1e-9;

  return {
    evidenceId: MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_EVIDENCE_ID,
    descriptorId: descriptor.id,
    phase: "Phase 5C-K",
    claimBoundary: "experimental-source-only-pressure-adapter-readiness",
    ownerDecisionStatus: "accepted-experimental-branch-only",
    productionRuntimeStatus: "not-production-runtime-replacement",
    fixedLowPreloadProtocol: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    adapterBoundary: {
      adapterId: MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_ID,
      sourceOnlyProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
      sourceProviderScope: "LV-only-legacy-positive-control",
      sourceOnlyProviderHasPressureMethod: typeof sourceOnlyProvider.pressure === "function",
      sourceOnlyProviderHasPassivePressureMethod: typeof sourceOnlyProvider.passivePressure === "function",
      sourceOnlyProviderHasDebugPressureTermsMethod: typeof sourceOnlyProvider.debugPressureTerms === "function",
      sourceOnlyProviderHasSourceSpecificDebugActiveStressTerms:
        typeof sourceOnlyProvider.debugActiveStressTerms === "function",
      sourceActiveStressPathInvoked: sourceOnlyInvocationCounts.sourceActiveStressPa > 0,
      modelCorePressureAssemblyPathRequired: true,
      providerObjectMutableSolverStateAllowed: false,
      mutableSolverStateMustLiveInProviderState: true,
      instrumentationCountersMayLiveOutsideProviderState: true,
    },
    fullPressureProviderPositiveControl: summarizePositiveControl(
      fullPressurePoint,
      MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
      payloadStableHashFullPressure,
    ),
    sourceOnlyAdapterPositiveControl: summarizePositiveControl(
      sourceOnlyPoint,
      MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
      payloadStableHashSourceOnly,
    ),
    equivalenceEvidence: {
      comparatorProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
      sourceOnlyProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
      payloadStableHashFullPressure,
      payloadStableHashSourceOnly,
      stableHashesMatch: payloadStableHashFullPressure === payloadStableHashSourceOnly,
      maxAbsNumericDifference: maxDifference,
      tolerance,
      legacySourceOnlyPressureEquivalent:
        payloadStableHashFullPressure === payloadStableHashSourceOnly
        && maxDifference <= tolerance,
    },
    hookInvocationEvidence: {
      fullPressureInvocationCounts,
      sourceOnlyInvocationCounts,
    },
    routeAssessment: {
      routeId: "modelcore-equivalent-closure-positive-control",
      adapterStatus: "source-only-pressure-adapter-implemented",
      routeSatisfactionStatus: "partial-legacy-positive-control-pass-land-pairing-not-run",
      sourceProviderDifferenceOnlyStatus: "adapter-ready-land-not-yet-evaluated",
      finalNoAlternansClaim: "not-claimed",
    },
  };
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildModelCoreActiveSourcePressureAdapterEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCoreActiveSourcePressureAdapterEvidence(), null, 2));
}
