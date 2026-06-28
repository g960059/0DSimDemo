import descriptor from "@/data/myocardium/protocols/modelcore-equivalent-positive-control-closure-evidence-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  type ModelCoreExperimentalActiveSourceProvider,
  type ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
import { stableHash, sanitizeForStableHash } from "@/engine/myocardium/kinematics/stableHash";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { runLowPreloadDebug } from "@/tools/debugStarlingLowPreload";

export const MODELCORE_EQUIVALENT_POSITIVE_CONTROL_EVIDENCE_ID =
  "modelcore-equivalent-positive-control-closure-evidence-v1";
export const MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID =
  "modelcore-experimental-legacy-active-stress-lv-source-provider-v1";

export type ModelCoreActiveSourceProviderInvocationCounts = {
  initialInternal: number;
  pressure: number;
  passivePressure: number;
  internalDerivatives: number;
  debugPressureTerms: number;
  debugActiveStressTerms: number;
};

export type ModelCoreEquivalentPositiveControlClosureEvidence = {
  readonly evidenceId: typeof MODELCORE_EQUIVALENT_POSITIVE_CONTROL_EVIDENCE_ID;
  readonly descriptorId: string;
  readonly phase: "Phase 5C-I";
  readonly claimBoundary: "experimental-modelcore-source-provider-positive-control-only";
  readonly ownerDecisionStatus: "accepted";
  readonly productionRuntimeStatus: "not-production-runtime-replacement";
  readonly sourceProviderIds: Partial<Record<string, string>>;
  readonly fixedLowPreloadProtocol: typeof LAND_SHADOW_FIXED_LEGACY_PROTOCOL;
  readonly legacyPositiveControl: {
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
  readonly hookInvocationEvidence: {
    readonly sourceProviderId: typeof MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID;
    readonly invocationCounts: ModelCoreActiveSourceProviderInvocationCounts;
    readonly totalInvocations: number;
    readonly initialStatePathInvoked: boolean;
    readonly pressurePathInvoked: boolean;
    readonly derivativePathInvoked: boolean;
  };
  readonly routeAssessment: {
    readonly routeId: "modelcore-equivalent-closure-positive-control";
    readonly closureImplementationStatus: "experimental-source-provider-hook-implemented";
    readonly routeSatisfactionStatus: "partial-legacy-positive-control-pass-land-pairing-not-run";
    readonly sourceProviderDifferenceOnlyStatus: "not-yet-evaluated";
    readonly finalNoAlternansClaim: "not-claimed";
  };
};

export function createModelCoreActiveSourceProviderInvocationCounts(): ModelCoreActiveSourceProviderInvocationCounts {
  return {
    initialInternal: 0,
    pressure: 0,
    passivePressure: 0,
    internalDerivatives: 0,
    debugPressureTerms: 0,
    debugActiveStressTerms: 0,
  };
}

export function legacyActiveStressLvSourceProvider(
  invocationCounts: ModelCoreActiveSourceProviderInvocationCounts = createModelCoreActiveSourceProviderInvocationCounts(),
): ModelCoreExperimentalActiveSourceProvider {
  return {
    sourceProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
    initialInternal: ({ activeModel }) => {
      invocationCounts.initialInternal += 1;
      return activeModel.initialInternal();
    },
    pressure: ({ activeModel, volumeMl, internal, chamberCtx }) => {
      invocationCounts.pressure += 1;
      return activeModel.pressure(volumeMl, internal, chamberCtx);
    },
    passivePressure: ({ activeModel, volumeMl, chamberCtx }) => {
      invocationCounts.passivePressure += 1;
      return activeModel.passivePressure(volumeMl, chamberCtx);
    },
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }) => {
      invocationCounts.internalDerivatives += 1;
      return activeModel.internalDerivatives(volumeMl, internal, chamberCtx);
    },
    debugPressureTerms: ({ activeModel, volumeMl, internal, chamberCtx }) => {
      invocationCounts.debugPressureTerms += 1;
      return activeModel.debugPressureTerms(volumeMl, internal, chamberCtx);
    },
    debugActiveStressTerms: ({ activeModel, volumeMl, internal, chamberCtx }) => {
      invocationCounts.debugActiveStressTerms += 1;
      return activeModel.debugActiveStressTerms(volumeMl, internal, chamberCtx);
    },
  };
}

export function modelCoreEquivalentPositiveControlExperimentalOptions(
  invocationCounts?: ModelCoreActiveSourceProviderInvocationCounts,
): ModelCoreExperimentalOptions {
  return {
    activeSourceProviders: {
      LV: legacyActiveStressLvSourceProvider(invocationCounts),
    },
  };
}

export function buildModelCoreEquivalentPositiveControlClosureEvidence(): ModelCoreEquivalentPositiveControlClosureEvidence {
  const invocationCounts = createModelCoreActiveSourceProviderInvocationCounts();
  const experimentalOptions = modelCoreEquivalentPositiveControlExperimentalOptions(invocationCounts);
  const debugReport = runLowPreloadDebug({
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
    experimentalModelCoreOptions: experimentalOptions,
  });
  const point = debugReport.points[0];
  if (!point || debugReport.points.length !== 1) {
    throw new Error("Phase 5C-I ModelCore-equivalent positive control expects exactly one debug point.");
  }
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
  const legacyPositiveControl = {
    status: pass ? "period-2-positive-control-pass" as const : "period-2-positive-control-fail" as const,
    settled: point.settle.settled,
    periodBeats: point.settle.periodBeats,
    adjacentDelta: point.settle.adjacentDelta,
    periodDelta: point.settle.periodDelta,
    tbvClassification: point.tbvAudit.classification,
    tbvSanitizeAbsMl: point.tbvAudit.sanitizeAbsMl,
    tbvProjectionAppliedMl: point.tbvAudit.projectionAbsAppliedMl,
    maxValveReverseMl,
    stableHash: stableHash(sanitizeForStableHash({
      periodBeats: point.settle.periodBeats,
      adjacentDelta: point.settle.adjacentDelta,
      periodDelta: point.settle.periodDelta,
      tbvAudit: point.tbvAudit,
      valveVolumesMl: point.valveVolumesMl,
      vlvTrace: point.vlvTrace,
    })),
  };
  const totalInvocations = Object.values(invocationCounts).reduce((sum, count) => sum + count, 0);
  return {
    evidenceId: MODELCORE_EQUIVALENT_POSITIVE_CONTROL_EVIDENCE_ID,
    descriptorId: descriptor.id,
    phase: "Phase 5C-I",
    claimBoundary: "experimental-modelcore-source-provider-positive-control-only",
    ownerDecisionStatus: "accepted",
    productionRuntimeStatus: "not-production-runtime-replacement",
    sourceProviderIds: {
      LV: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
    },
    fixedLowPreloadProtocol: LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
    legacyPositiveControl,
    hookInvocationEvidence: {
      sourceProviderId: MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
      invocationCounts,
      totalInvocations,
      initialStatePathInvoked: invocationCounts.initialInternal > 0,
      pressurePathInvoked: invocationCounts.pressure > 0,
      derivativePathInvoked: invocationCounts.internalDerivatives > 0,
    },
    routeAssessment: {
      routeId: "modelcore-equivalent-closure-positive-control",
      closureImplementationStatus: "experimental-source-provider-hook-implemented",
      routeSatisfactionStatus: "partial-legacy-positive-control-pass-land-pairing-not-run",
      sourceProviderDifferenceOnlyStatus: "not-yet-evaluated",
      finalNoAlternansClaim: "not-claimed",
    },
  };
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildModelCoreEquivalentPositiveControlClosureEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCoreEquivalentPositiveControlClosureEvidence(), null, 2));
}
