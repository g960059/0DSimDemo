import resultArtifact from "@/data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID,
  buildModelCorePairedLandSourceProviderEvidence,
  type ModelCorePairedLandClampAttributionTrace,
} from "@/tools/myocardium/buildModelCorePairedLandSourceProviderEvidence";

export const MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID =
  "modelcore-paired-land-qdot-clamp-attribution-result-v1";

type RunClampAttribution = {
  readonly sourceProviderId: string;
  readonly status: string;
  readonly periodBeats: number;
  readonly adjacentDelta: number;
  readonly periodDelta: number;
  readonly clampAttributionTrace: ModelCorePairedLandClampAttributionTrace;
};

export type ModelCorePairedLandQDotClampAttributionClass =
  | "clamp-threshold-avoidance-risk-supported"
  | "clamp-threshold-avoidance-risk-not-supported"
  | "clamp-threshold-attribution-inconclusive";

export type ModelCorePairedLandQDotClampAttributionEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID;
  readonly phase: "Phase 5C-M";
  readonly claimBoundary: "same-closure-qdot-clamp-threshold-attribution-only";
  readonly upstreamPairedRunEvidenceId: typeof MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID;
  readonly upstreamPairedRunResultArtifactId: string;
  readonly upstreamPairedRunResultArtifactPath: "data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json";
  readonly verifierScript: "verify:myocardium-modelcore-paired-land-qdot-clamp-attribution";
  readonly sameClosureBoundary: {
    readonly stableHashesMatch: boolean;
    readonly sourceProviderDifferenceOnly: boolean;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
  };
  readonly pairedRunStatus: {
    readonly legacyStatus: string;
    readonly landStatus: string;
    readonly outcomeClass: string;
    readonly routeSatisfactionStatus: string;
    readonly finalNoAlternansClaim: "not-claimed";
  };
  readonly clampAttribution: {
    readonly legacy: RunClampAttribution;
    readonly land: RunClampAttribution;
    readonly deltas: {
      readonly landVsLegacyAovQDotClampHitFractionDelta: number;
      readonly landVsLegacyAovQDotClampHitCountDelta: number;
      readonly landVsLegacyAovQDotMaxImpulseAbsMlPerS2Delta: number;
      readonly landVsLegacyAovQDotMaxRawAbsMlPerS2Delta: number;
      readonly landVsLegacyQAoCapRatioMaxDelta: number;
      readonly landVsLegacyQAoPeakDeltaMlPerSec: number;
      readonly landVsLegacySVDeltaMl: number;
      readonly landVsLegacyCOLDeltaLMin: number;
    };
  };
  readonly attributionInterpretation: {
    readonly classification: ModelCorePairedLandQDotClampAttributionClass;
    readonly structuralAlternansRemovalClaim: "not-established";
    readonly finalNoAlternansClaim: "not-claimed";
    readonly officialMorphologyAcceptance: "not-claimed";
    readonly summary: string;
    readonly requiredNextChecks: readonly string[];
  };
  readonly doesNotUnlock: readonly string[];
};

export function buildModelCorePairedLandQDotClampAttributionEvidence():
ModelCorePairedLandQDotClampAttributionEvidence {
  const paired = buildModelCorePairedLandSourceProviderEvidence();
  const legacy = runClampAttribution(
    paired.legacyPositiveControl.sourceProviderId,
    paired.legacyPositiveControl.status,
    paired.legacyPositiveControl.periodBeats,
    paired.legacyPositiveControl.adjacentDelta,
    paired.legacyPositiveControl.periodDelta,
    paired.legacyPositiveControl.clampAttributionTrace,
  );
  const land = runClampAttribution(
    paired.landRun.sourceProviderId,
    paired.landRun.status,
    paired.landRun.periodBeats,
    paired.landRun.adjacentDelta,
    paired.landRun.periodDelta,
    paired.landRun.clampAttributionTrace,
  );
  const deltas = {
    landVsLegacyAovQDotClampHitFractionDelta:
      land.clampAttributionTrace.aovQDotClampHitFraction
      - legacy.clampAttributionTrace.aovQDotClampHitFraction,
    landVsLegacyAovQDotClampHitCountDelta:
      land.clampAttributionTrace.aovQDotClampHitCount
      - legacy.clampAttributionTrace.aovQDotClampHitCount,
    landVsLegacyAovQDotMaxImpulseAbsMlPerS2Delta:
      land.clampAttributionTrace.aovQDotMaxImpulseAbsMlPerS2
      - legacy.clampAttributionTrace.aovQDotMaxImpulseAbsMlPerS2,
    landVsLegacyAovQDotMaxRawAbsMlPerS2Delta:
      land.clampAttributionTrace.aovQDotMaxRawAbsMlPerS2
      - legacy.clampAttributionTrace.aovQDotMaxRawAbsMlPerS2,
    landVsLegacyQAoCapRatioMaxDelta:
      land.clampAttributionTrace.qAoCapRatioMax
      - legacy.clampAttributionTrace.qAoCapRatioMax,
    landVsLegacyQAoPeakDeltaMlPerSec:
      paired.reportOnlyComparison.landVsLegacyQAoPeakDeltaMlPerSec,
    landVsLegacySVDeltaMl:
      paired.reportOnlyComparison.landVsLegacySVDeltaMl,
    landVsLegacyCOLDeltaLMin:
      paired.reportOnlyComparison.landVsLegacyCOLDeltaLMin,
  };
  const classification = classifyClampAttribution(legacy, land, deltas);
  return {
    schemaVersion: 1,
    id: MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID,
    phase: "Phase 5C-M",
    claimBoundary: "same-closure-qdot-clamp-threshold-attribution-only",
    upstreamPairedRunEvidenceId: MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID,
    upstreamPairedRunResultArtifactId: resultArtifact.id,
    upstreamPairedRunResultArtifactPath: "data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json",
    verifierScript: "verify:myocardium-modelcore-paired-land-qdot-clamp-attribution",
    sameClosureBoundary: {
      stableHashesMatch: paired.closureEquivalenceEvidence.stableHashesMatch,
      sourceProviderDifferenceOnly: paired.pairedRunBoundary.sourceProviderDifferenceOnly,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
    },
    pairedRunStatus: {
      legacyStatus: paired.legacyPositiveControl.status,
      landStatus: paired.landRun.status,
      outcomeClass: paired.outcomeInterpretation.outcomeClass,
      routeSatisfactionStatus: paired.routeAssessment.routeSatisfactionStatus,
      finalNoAlternansClaim: "not-claimed",
    },
    clampAttribution: {
      legacy,
      land,
      deltas,
    },
    attributionInterpretation: {
      classification,
      structuralAlternansRemovalClaim: "not-established",
      finalNoAlternansClaim: "not-claimed",
      officialMorphologyAcceptance: "not-claimed",
      summary: attributionSummary(classification),
      requiredNextChecks: [
        "output-matched-paired-run-before-structural-attribution",
        "SDIRK2-reference-before-final-no-alternans",
        "preload-domain-sweep-before-domain-claim",
      ],
    },
    doesNotUnlock: [
      "runtimeReplacement",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
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

function runClampAttribution(
  sourceProviderId: string,
  status: string,
  periodBeats: number,
  adjacentDelta: number,
  periodDelta: number,
  clampAttributionTrace: ModelCorePairedLandClampAttributionTrace,
): RunClampAttribution {
  return {
    sourceProviderId,
    status,
    periodBeats,
    adjacentDelta,
    periodDelta,
    clampAttributionTrace,
  };
}

function classifyClampAttribution(
  legacy: RunClampAttribution,
  land: RunClampAttribution,
  deltas: ModelCorePairedLandQDotClampAttributionEvidence["clampAttribution"]["deltas"],
): ModelCorePairedLandQDotClampAttributionClass {
  const legacyHitFraction = legacy.clampAttributionTrace.aovQDotClampHitFraction;
  const landHitFraction = land.clampAttributionTrace.aovQDotClampHitFraction;
  const materiallyLowerOutput =
    deltas.landVsLegacyQAoPeakDeltaMlPerSec < -500
    || deltas.landVsLegacySVDeltaMl < -10
    || deltas.landVsLegacyCOLDeltaLMin < -0.75;
  if (
    legacyHitFraction > 0
    && landHitFraction <= legacyHitFraction * 0.25
    && materiallyLowerOutput
  ) {
    return "clamp-threshold-avoidance-risk-supported";
  }
  if (
    legacyHitFraction > 0
    && landHitFraction >= legacyHitFraction * 0.75
    && land.periodBeats === 1
  ) {
    return "clamp-threshold-avoidance-risk-not-supported";
  }
  return "clamp-threshold-attribution-inconclusive";
}

function attributionSummary(classification: ModelCorePairedLandQDotClampAttributionClass): string {
  if (classification === "clamp-threshold-avoidance-risk-supported") {
    return "Land period-1 remains a positive interpretable signal, but lower output and lower AoV qDot clamp engagement support clamp-threshold avoidance as an unresolved attribution risk.";
  }
  if (classification === "clamp-threshold-avoidance-risk-not-supported") {
    return "Land period-1 does not appear to be explained by avoiding AoV qDot clamp engagement at the measured output, but this still is not final no-alternans acceptance.";
  }
  return "The measured AoV qDot clamp and output deltas do not isolate whether Land period-1 is structural damping or clamp-threshold avoidance.";
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildModelCorePairedLandQDotClampAttributionEvidence.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildModelCorePairedLandQDotClampAttributionEvidence(), null, 2));
}
