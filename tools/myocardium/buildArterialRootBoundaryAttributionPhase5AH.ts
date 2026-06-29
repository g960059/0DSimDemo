import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5AGArtifact from "@/data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json";
import type {
  ArterialRootBoundaryTimingPhase5AGEvidence,
  ArterialRootBoundaryTimingPhase5AGRun,
} from "@/tools/myocardium/buildArterialRootBoundaryTimingPhase5AG";

export const ARTERIAL_ROOT_BOUNDARY_ATTRIBUTION_PHASE5AH_ID =
  "arterial-root-boundary-attribution-phase5ah-result-v1";

export const ARTERIAL_ROOT_BOUNDARY_ATTRIBUTION_PHASE5AH_RESULT_PATH =
  "data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";

const UPSTREAM_PHASE5AG_ID = "arterial-root-boundary-timing-phase5ag-result-v1" as const;
const VERIFIER_SCRIPT = "verify:myocardium-arterial-root-boundary-attribution" as const;
const MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const CANDIDATE_ID = "boundary-root-l-plus-1x-aov-l-mechanism" as const;
const CURRENT_ID = "current-closure" as const;
const QDOT_REDUCTION_MIN = 0.25 as const;

type ModelPathId = typeof MODEL_PATH_IDS[number];
type HealthStatus = "ok" | "warning" | "failed" | "missing";
type ComparisonHealth = "health-ok" | "candidate-non-health-ok" | "current-non-health-ok" | "paired-non-health-ok";
type QDotResponseAttribution =
  | "qdot-and-timing-response-output-preserved"
  | "qdot-only-output-preserved"
  | "timing-only-qdot-reduction-below-threshold-output-preserved"
  | "no-clamp-improvement-output-preserved"
  | "output-or-timing-cost-health-ok"
  | "output-or-timing-cost-non-health-ok"
  | "qdot-timing-signal-non-health-ok-excluded";

type CandidatePair = {
  readonly pointId: string;
  readonly label: string;
  readonly role: string;
  readonly modelPathId: ModelPathId;
  readonly current: ArterialRootBoundaryTimingPhase5AGRun;
  readonly candidate: ArterialRootBoundaryTimingPhase5AGRun;
};

export type ArterialRootBoundaryAttributionPhase5AHPointAttribution = {
  readonly pointId: string;
  readonly label: string;
  readonly role: string;
  readonly modelPathId: ModelPathId;
  readonly comparisonHealth: ComparisonHealth;
  readonly currentHealthStatus: HealthStatus;
  readonly candidateHealthStatus: HealthStatus;
  readonly classification: ArterialRootBoundaryTimingPhase5AGRun["comparisonVsCurrent"]["classification"];
  readonly qDotResponseAttribution: QDotResponseAttribution;
  readonly outputPreserved: boolean;
  readonly qDotEngagementSignal: boolean;
  readonly valveLoadTimingSignal: boolean;
  readonly currentClampFractionAovOpen: number | null;
  readonly candidateClampFractionAovOpen: number | null;
  readonly qDotClampReductionVsCurrentAovOpen: number | null;
  readonly forwardDurationRatioVsCurrent: number | null;
  readonly qAoUpstrokeRatioVsCurrent: number | null;
  readonly qAoPeakRatioVsCurrent: number | null;
  readonly coRatioVsCurrent: number | null;
  readonly forwardVolumeRatioVsCurrent: number | null;
  readonly currentCoLMin: number | null;
  readonly candidateCoLMin: number | null;
  readonly currentLVEDPApprox: number | null;
  readonly candidateLVEDPApprox: number | null;
  readonly healthMessages: readonly string[];
};

export type ArterialRootBoundaryAttributionPhase5AHModelSummary = {
  readonly modelPathId: ModelPathId;
  readonly candidateComparisonCount: number;
  readonly healthOkComparisonCount: number;
  readonly qDotTimingOutputPreservedCount: number;
  readonly timingOnlyOutputPreservedCount: number;
  readonly noClampImprovementOutputPreservedCount: number;
  readonly outputOrTimingCostHealthOkCount: number;
  readonly nonHealthOkComparisonCount: number;
  readonly outputPreservedHealthOkCount: number;
  readonly qDotEngagementSignalHealthOkCount: number;
  readonly valveLoadTimingSignalHealthOkCount: number;
  readonly landSolveFailureCount: number;
  readonly medianCurrentClampFractionAovOpen: number | null;
  readonly medianCandidateClampFractionAovOpen: number | null;
  readonly medianQDotClampReductionVsCurrentAovOpen: number | null;
  readonly medianForwardDurationRatioVsCurrent: number | null;
  readonly medianQAoUpstrokeRatioVsCurrent: number | null;
  readonly medianQAoPeakRatioVsCurrent: number | null;
  readonly medianCoRatioVsCurrent: number | null;
  readonly medianForwardVolumeRatioVsCurrent: number | null;
  readonly medianLVEDPChangeMmHg: number | null;
  readonly healthOkPointIds: readonly string[];
  readonly timingOnlyPointIds: readonly string[];
  readonly qDotTimingPointIds: readonly string[];
  readonly nonHealthOkPointIds: readonly string[];
};

export type ArterialRootBoundaryAttributionPhase5AHEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ARTERIAL_ROOT_BOUNDARY_ATTRIBUTION_PHASE5AH_ID;
  readonly phase: "Phase 5AH";
  readonly claimBoundary: "phase5ag-boundary-root-response-attribution-diagnostic-only";
  readonly upstreamPhase5AGArtifactId: typeof UPSTREAM_PHASE5AG_ID;
  readonly verifierScript: typeof VERIFIER_SCRIPT;
  readonly protocol: {
    readonly sourceArtifactId: typeof UPSTREAM_PHASE5AG_ID;
    readonly sourceArtifactHash: string;
    readonly analysisScope: "phase5ag-measured-full-matrix-candidate-attribution";
    readonly modelPathIds: typeof MODEL_PATH_IDS;
    readonly candidateId: typeof CANDIDATE_ID;
    readonly currentId: typeof CURRENT_ID;
    readonly qDotReductionMin: typeof QDOT_REDUCTION_MIN;
    readonly healthFilter: "measured-current-and-candidate-health-ok";
    readonly noFreshModelRerun: true;
  };
  readonly modelSummaries: readonly ArterialRootBoundaryAttributionPhase5AHModelSummary[];
  readonly pointAttributions: readonly ArterialRootBoundaryAttributionPhase5AHPointAttribution[];
  readonly edgeAttributions: {
    readonly hr120Stock: {
      readonly pointId: "hr120";
      readonly modelPathId: "stock-active-no-provider-v0";
      readonly attribution: "pre-existing-stock-health-failure-non-health-ok-edge";
      readonly currentHealthStatus: HealthStatus;
      readonly candidateHealthStatus: HealthStatus;
      readonly currentCoLMin: number | null;
      readonly candidateCoLMin: number | null;
      readonly coRatioVsCurrent: number | null;
      readonly candidateClassification: ArterialRootBoundaryTimingPhase5AGRun["comparisonVsCurrent"]["classification"];
      readonly interpretation: string;
    };
    readonly lowPreloadStock: {
      readonly pointId: "low-preload-alternans-edge";
      readonly modelPathId: "stock-active-no-provider-v0";
      readonly attribution: "frozen-low-preload-stock-non-health-ok-edge-excluded";
      readonly currentHealthStatus: HealthStatus;
      readonly candidateHealthStatus: HealthStatus;
      readonly candidateClassification: ArterialRootBoundaryTimingPhase5AGRun["comparisonVsCurrent"]["classification"];
      readonly interpretation: string;
    };
  };
  readonly summary: {
    readonly upstreamPointCount: number;
    readonly candidateComparisonCount: number;
    readonly healthOkCandidateComparisonCount: number;
    readonly stockHealthOkCandidateComparisonCount: number;
    readonly landHealthOkCandidateComparisonCount: number;
    readonly stockQDotTimingOutputPreservedCount: number;
    readonly landQDotTimingOutputPreservedCount: number;
    readonly landTimingOnlyOutputPreservedCount: number;
    readonly landOutputPreservedHealthOkCount: number;
    readonly landSolveFailureCount: number;
    readonly weakerLandResponseAttribution: string;
    readonly hr120StockCostAttribution: string;
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noFreshModelRerun: true;
    readonly noModelCoreEquationChange: true;
    readonly noTopologyChange: true;
    readonly noStateLayoutChange: true;
    readonly noDefaultParamChange: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionRegistryIntegration: true;
    readonly noOfficialCaseWiring: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noQDotTuning: true;
    readonly noQDotClampRemoval: true;
    readonly noValveThresholdTuning: true;
    readonly noValveLossTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noTrefFudge: true;
    readonly noSourceStressScaling: true;
    readonly noDirectAoSAAdoption: true;
    readonly noAoVBoundaryCarrierAdoption: true;
    readonly noBoundaryRootProductionAdoption: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noReflectionCoefficientClaim: true;
    readonly noRootCauseAcceptance: true;
    readonly noFixAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noLandDefaultFlipUnlock: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

const phase5AG = phase5AGArtifact as unknown as ArterialRootBoundaryTimingPhase5AGEvidence;

export function buildArterialRootBoundaryAttributionPhase5AHEvidence():
ArterialRootBoundaryAttributionPhase5AHEvidence {
  const pairs = candidatePairs();
  const pointAttributions = pairs.map(pointAttribution);
  const modelSummaries = MODEL_PATH_IDS.map((modelPathId) => modelSummary(modelPathId, pointAttributions));
  const stockSummary = modelSummaries.find((summary) => summary.modelPathId === "stock-active-no-provider-v0")!;
  const landSummary = modelSummaries.find((summary) => summary.modelPathId === "developer-only-lv-land-v0")!;
  const hr120Stock = edgeAttributionFor(pointAttributions, "hr120", "stock-active-no-provider-v0");
  const lowPreloadStock = edgeAttributionFor(pointAttributions, "low-preload-alternans-edge", "stock-active-no-provider-v0");
  const healthOkCandidateComparisonCount = modelSummaries
    .reduce((sum, summary) => sum + summary.healthOkComparisonCount, 0);
  const evidenceWithoutHash: Omit<ArterialRootBoundaryAttributionPhase5AHEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: ARTERIAL_ROOT_BOUNDARY_ATTRIBUTION_PHASE5AH_ID,
    phase: "Phase 5AH" as const,
    claimBoundary: "phase5ag-boundary-root-response-attribution-diagnostic-only" as const,
    upstreamPhase5AGArtifactId: UPSTREAM_PHASE5AG_ID,
    verifierScript: VERIFIER_SCRIPT,
    protocol: {
      sourceArtifactId: UPSTREAM_PHASE5AG_ID,
      sourceArtifactHash: artifactHash(phase5AG),
      analysisScope: "phase5ag-measured-full-matrix-candidate-attribution" as const,
      modelPathIds: MODEL_PATH_IDS,
      candidateId: CANDIDATE_ID,
      currentId: CURRENT_ID,
      qDotReductionMin: QDOT_REDUCTION_MIN,
      healthFilter: "measured-current-and-candidate-health-ok" as const,
      noFreshModelRerun: true as const,
    },
    modelSummaries,
    pointAttributions,
    edgeAttributions: {
      hr120Stock: {
        pointId: "hr120" as const,
        modelPathId: "stock-active-no-provider-v0" as const,
        attribution: "pre-existing-stock-health-failure-non-health-ok-edge" as const,
        currentHealthStatus: hr120Stock.currentHealthStatus,
        candidateHealthStatus: hr120Stock.candidateHealthStatus,
        currentCoLMin: hr120Stock.currentCoLMin,
        candidateCoLMin: hr120Stock.candidateCoLMin,
        coRatioVsCurrent: hr120Stock.coRatioVsCurrent,
        candidateClassification: hr120Stock.classification,
        interpretation: "HR120 stock is non-health-ok before the boundary/root candidate and remains non-health-ok with the candidate; exclude it from adoption signal and do not promote it into an LV Land default blocker.",
      },
      lowPreloadStock: {
        pointId: "low-preload-alternans-edge" as const,
        modelPathId: "stock-active-no-provider-v0" as const,
        attribution: "frozen-low-preload-stock-non-health-ok-edge-excluded" as const,
        currentHealthStatus: lowPreloadStock.currentHealthStatus,
        candidateHealthStatus: lowPreloadStock.candidateHealthStatus,
        candidateClassification: lowPreloadStock.classification,
        interpretation: "The frozen low-preload stock edge has non-ok health and is kept out of the measured-health-ok qDot/timing headline.",
      },
    },
    summary: {
      upstreamPointCount: phase5AG.summary.pointCount,
      candidateComparisonCount: pointAttributions.length,
      healthOkCandidateComparisonCount,
      stockHealthOkCandidateComparisonCount: stockSummary.healthOkComparisonCount,
      landHealthOkCandidateComparisonCount: landSummary.healthOkComparisonCount,
      stockQDotTimingOutputPreservedCount: stockSummary.qDotTimingOutputPreservedCount,
      landQDotTimingOutputPreservedCount: landSummary.qDotTimingOutputPreservedCount,
      landTimingOnlyOutputPreservedCount: landSummary.timingOnlyOutputPreservedCount,
      landOutputPreservedHealthOkCount: landSummary.outputPreservedHealthOkCount,
      landSolveFailureCount: landSummary.landSolveFailureCount,
      weakerLandResponseAttribution: weakerLandResponseAttribution(stockSummary, landSummary),
      hr120StockCostAttribution: "HR120 stock is a pre-existing non-health-ok edge: current and candidate both fail flow-balance health, so the candidate output/timing cost is not interpretable as a production/default boundary-root blocker by itself.",
      currentInterpretation: interpretation(stockSummary, landSummary),
      recommendedNext: [
        "move the immediate LV migration path to Land normal-floor LVEDP attribution before any default flip",
        "keep the boundary/root mechanism off by default; Phase 5AH does not support qDot clamp removal or valve/load timing acceptance",
        "if boundary/root adoption is revisited, require live closure acceptance evidence with stock and Land health-ok output preservation rather than the weaker Land qDot headline alone",
        "keep HR120 stock and frozen low-preload stock as bounded non-health-ok edge evidence, not as LV Land default gates",
      ],
      limitations: [
        "Phase 5AH reanalyzes the Phase 5AG measured artifact; it intentionally does not rerun or modify the model.",
        "The attribution is over the Phase 5X synthetic user-knob matrix plus one frozen low-preload edge, not official-case tuning.",
        "Health-ok headlines require both current and candidate runs to be measured and health ok.",
        "The analysis does not identify reflection coefficients, retire qDot clamps, accept valve/load timing, or adopt the boundary/root mechanism.",
      ],
    },
    boundary: boundary(),
    doesNotUnlock: doesNotUnlock(),
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function candidatePairs(): readonly CandidatePair[] {
  return phase5AG.points.flatMap((point) =>
    ([
      ["stock-active-no-provider-v0", point.stock],
      ["developer-only-lv-land-v0", point.land],
    ] as const).map(([modelPathId, runs]) => {
      const current = runs.find((run) => run.candidateId === CURRENT_ID);
      const candidate = runs.find((run) => run.candidateId === CANDIDATE_ID);
      if (!current || !candidate) {
        throw new Error(`Missing current/candidate pair for ${point.id} ${modelPathId}`);
      }
      return {
        pointId: point.id,
        label: point.label,
        role: point.role,
        modelPathId,
        current,
        candidate,
      };
    }),
  );
}

function pointAttribution(pair: CandidatePair): ArterialRootBoundaryAttributionPhase5AHPointAttribution {
  const comparison = pair.candidate.comparisonVsCurrent;
  const comparisonHealth = healthFor(pair);
  return {
    pointId: pair.pointId,
    label: pair.label,
    role: pair.role,
    modelPathId: pair.modelPathId,
    comparisonHealth,
    currentHealthStatus: healthStatus(pair.current),
    candidateHealthStatus: healthStatus(pair.candidate),
    classification: comparison.classification,
    qDotResponseAttribution: qDotResponseAttribution(pair, comparisonHealth),
    outputPreserved: comparison.outputPreserved,
    qDotEngagementSignal: comparison.qDotEngagementSignal,
    valveLoadTimingSignal: comparison.valveLoadTimingSignal,
    currentClampFractionAovOpen: finiteOrNull(pair.current.metrics?.qDotClampHitFractionAovOpen),
    candidateClampFractionAovOpen: finiteOrNull(pair.candidate.metrics?.qDotClampHitFractionAovOpen),
    qDotClampReductionVsCurrentAovOpen: finiteOrNull(comparison.qDotClampReductionVsCurrentAovOpen),
    forwardDurationRatioVsCurrent: finiteOrNull(comparison.forwardDurationRatioVsCurrent),
    qAoUpstrokeRatioVsCurrent: finiteOrNull(comparison.qAoUpstrokeRatioVsCurrent),
    qAoPeakRatioVsCurrent: finiteOrNull(comparison.qAoPeakRatioVsCurrent),
    coRatioVsCurrent: finiteOrNull(comparison.coRatioVsCurrent),
    forwardVolumeRatioVsCurrent: finiteOrNull(comparison.forwardVolumeRatioVsCurrent),
    currentCoLMin: finiteOrNull(pair.current.metrics?.CO_L),
    candidateCoLMin: finiteOrNull(pair.candidate.metrics?.CO_L),
    currentLVEDPApprox: finiteOrNull(pair.current.metrics?.LVEDPApprox),
    candidateLVEDPApprox: finiteOrNull(pair.candidate.metrics?.LVEDPApprox),
    healthMessages: [
      ...(pair.current.health?.messages ?? []),
      ...(pair.candidate.health?.messages ?? []),
    ],
  };
}

function modelSummary(
  modelPathId: ModelPathId,
  attributions: readonly ArterialRootBoundaryAttributionPhase5AHPointAttribution[],
): ArterialRootBoundaryAttributionPhase5AHModelSummary {
  const rows = attributions.filter((row) => row.modelPathId === modelPathId);
  const healthOk = rows.filter((row) => row.comparisonHealth === "health-ok");
  const timingOnly = healthOk.filter((row) =>
    row.qDotResponseAttribution === "timing-only-qdot-reduction-below-threshold-output-preserved"
  );
  const qDotTiming = healthOk.filter((row) =>
    row.qDotResponseAttribution === "qdot-and-timing-response-output-preserved"
  );
  const nonHealthOk = rows.filter((row) => row.comparisonHealth !== "health-ok");
  return {
    modelPathId,
    candidateComparisonCount: rows.length,
    healthOkComparisonCount: healthOk.length,
    qDotTimingOutputPreservedCount: qDotTiming.length,
    timingOnlyOutputPreservedCount: timingOnly.length,
    noClampImprovementOutputPreservedCount: healthOk.filter((row) =>
      row.qDotResponseAttribution === "no-clamp-improvement-output-preserved"
    ).length,
    outputOrTimingCostHealthOkCount: healthOk.filter((row) =>
      row.qDotResponseAttribution === "output-or-timing-cost-health-ok"
    ).length,
    nonHealthOkComparisonCount: nonHealthOk.length,
    outputPreservedHealthOkCount: healthOk.filter((row) => row.outputPreserved).length,
    qDotEngagementSignalHealthOkCount: healthOk.filter((row) => row.qDotEngagementSignal).length,
    valveLoadTimingSignalHealthOkCount: healthOk.filter((row) => row.valveLoadTimingSignal).length,
    landSolveFailureCount: rowsForModel(modelPathId)
      .reduce((sum, pair) => sum + (pair.current.providerInstrumentation?.landSolveFailureCount ?? 0)
        + (pair.candidate.providerInstrumentation?.landSolveFailureCount ?? 0), 0),
    medianCurrentClampFractionAovOpen: median(healthOk.map((row) => row.currentClampFractionAovOpen)),
    medianCandidateClampFractionAovOpen: median(healthOk.map((row) => row.candidateClampFractionAovOpen)),
    medianQDotClampReductionVsCurrentAovOpen: median(healthOk.map((row) => row.qDotClampReductionVsCurrentAovOpen)),
    medianForwardDurationRatioVsCurrent: median(healthOk.map((row) => row.forwardDurationRatioVsCurrent)),
    medianQAoUpstrokeRatioVsCurrent: median(healthOk.map((row) => row.qAoUpstrokeRatioVsCurrent)),
    medianQAoPeakRatioVsCurrent: median(healthOk.map((row) => row.qAoPeakRatioVsCurrent)),
    medianCoRatioVsCurrent: median(healthOk.map((row) => row.coRatioVsCurrent)),
    medianForwardVolumeRatioVsCurrent: median(healthOk.map((row) => row.forwardVolumeRatioVsCurrent)),
    medianLVEDPChangeMmHg: median(healthOk.map((row) =>
      row.currentLVEDPApprox == null || row.candidateLVEDPApprox == null
        ? null
        : row.candidateLVEDPApprox - row.currentLVEDPApprox
    )),
    healthOkPointIds: healthOk.map((row) => row.pointId),
    timingOnlyPointIds: timingOnly.map((row) => row.pointId),
    qDotTimingPointIds: qDotTiming.map((row) => row.pointId),
    nonHealthOkPointIds: nonHealthOk.map((row) => row.pointId),
  };
}

function rowsForModel(modelPathId: ModelPathId): readonly CandidatePair[] {
  return candidatePairs().filter((pair) => pair.modelPathId === modelPathId);
}

function edgeAttributionFor(
  attributions: readonly ArterialRootBoundaryAttributionPhase5AHPointAttribution[],
  pointId: string,
  modelPathId: ModelPathId,
): ArterialRootBoundaryAttributionPhase5AHPointAttribution {
  const row = attributions.find((candidate) => candidate.pointId === pointId && candidate.modelPathId === modelPathId);
  if (!row) throw new Error(`Missing edge attribution for ${pointId} ${modelPathId}`);
  return row;
}

function healthFor(pair: CandidatePair): ComparisonHealth {
  const currentOk = isMeasuredHealthOk(pair.current);
  const candidateOk = isMeasuredHealthOk(pair.candidate);
  if (currentOk && candidateOk) return "health-ok";
  if (!currentOk && !candidateOk) return "paired-non-health-ok";
  if (!candidateOk) return "candidate-non-health-ok";
  return "current-non-health-ok";
}

function qDotResponseAttribution(
  pair: CandidatePair,
  comparisonHealth: ComparisonHealth,
): QDotResponseAttribution {
  const comparison = pair.candidate.comparisonVsCurrent;
  if (comparisonHealth !== "health-ok") {
    if (comparison.classification === "candidate-qdot-timing-output-preserved") {
      return "qdot-timing-signal-non-health-ok-excluded";
    }
    return "output-or-timing-cost-non-health-ok";
  }
  if (comparison.classification === "candidate-output-or-timing-cost") {
    return "output-or-timing-cost-health-ok";
  }
  if (comparison.classification === "candidate-qdot-timing-output-preserved") {
    return "qdot-and-timing-response-output-preserved";
  }
  if (comparison.classification === "candidate-qdot-only-output-preserved") {
    return "qdot-only-output-preserved";
  }
  if (
    comparison.classification === "candidate-timing-only-output-preserved"
    && comparison.outputPreserved
    && (comparison.qDotClampReductionVsCurrentAovOpen ?? 0) < QDOT_REDUCTION_MIN
  ) {
    return "timing-only-qdot-reduction-below-threshold-output-preserved";
  }
  return "no-clamp-improvement-output-preserved";
}

function healthStatus(run: ArterialRootBoundaryTimingPhase5AGRun): HealthStatus {
  return run.health?.status ?? "missing";
}

function isMeasuredHealthOk(run: ArterialRootBoundaryTimingPhase5AGRun): boolean {
  return run.status === "measured" && run.health?.status === "ok";
}

function weakerLandResponseAttribution(
  stock: ArterialRootBoundaryAttributionPhase5AHModelSummary,
  land: ArterialRootBoundaryAttributionPhase5AHModelSummary,
): string {
  return `Land preserves output in ${land.outputPreservedHealthOkCount}/${land.healthOkComparisonCount} health-ok comparisons with zero Land solve failures, but only ${land.qDotTimingOutputPreservedCount}/${land.healthOkComparisonCount} reach the qDot+timing threshold; the other ${land.timingOnlyOutputPreservedCount} are timing-only below-threshold qDot reductions because median qDot clamp reduction is ${formatNumber(land.medianQDotClampReductionVsCurrentAovOpen)} versus ${formatNumber(stock.medianQDotClampReductionVsCurrentAovOpen)} for stock.`;
}

function interpretation(
  stock: ArterialRootBoundaryAttributionPhase5AHModelSummary,
  land: ArterialRootBoundaryAttributionPhase5AHModelSummary,
): string {
  return `Phase 5AH attributes the Phase 5AG split without changing the model: stock has ${stock.qDotTimingOutputPreservedCount}/${stock.healthOkComparisonCount} health-ok qDot+timing comparisons, while Land has ${land.qDotTimingOutputPreservedCount}/${land.healthOkComparisonCount} qDot+timing and ${land.timingOnlyOutputPreservedCount}/${land.healthOkComparisonCount} timing-only output-preserved comparisons. The weaker Land qDot headline is a below-threshold reduction pattern, not a Land solve/output failure. HR120 stock is non-health-ok in both current and candidate runs, so it is excluded from adoption evidence. This does not support qDot clamp removal, valve/load timing acceptance, or boundary/root production adoption.`;
}

function boundary(): ArterialRootBoundaryAttributionPhase5AHEvidence["boundary"] {
  return {
    noFreshModelRerun: true,
    noModelCoreEquationChange: true,
    noTopologyChange: true,
    noStateLayoutChange: true,
    noDefaultParamChange: true,
    noRuntimeDefaultFlip: true,
    noProductionRegistryIntegration: true,
    noOfficialCaseWiring: true,
    noOfficialCaseReauthoring: true,
    noWorkbenchRuntimeWiring: true,
    noStateSchemaMigration: true,
    noQDotTuning: true,
    noQDotClampRemoval: true,
    noValveThresholdTuning: true,
    noValveLossTuning: true,
    noAfterloadTuning: true,
    noPreloadTuning: true,
    noLandParameterTuning: true,
    noTrefFudge: true,
    noSourceStressScaling: true,
    noDirectAoSAAdoption: true,
    noAoVBoundaryCarrierAdoption: true,
    noBoundaryRootProductionAdoption: true,
    noValveLoadTimingAcceptance: true,
    noReflectionCoefficientClaim: true,
    noRootCauseAcceptance: true,
    noFixAcceptance: true,
    noOfficialMorphologyAcceptance: true,
    noFinalNoAlternansAcceptance: true,
    noLandDefaultFlipUnlock: true,
    noClinicalScientificValidationClaim: true,
  };
}

function doesNotUnlock(): readonly string[] {
  return [
    "freshModelRerun",
    "ModelCoreEquationChange",
    "topologyChange",
    "stateLayoutChange",
    "defaultParamChange",
    "runtimeDefaultFlip",
    "productionRegistryIntegration",
    "officialCaseWiring",
    "officialCaseReauthoring",
    "workbenchRuntimeWiring",
    "stateSchemaMigration",
    "qDotTuning",
    "qDotClampRemoval",
    "valveThresholdTuning",
    "valveLossTuning",
    "afterloadTuning",
    "preloadTuning",
    "LandParameterTuning",
    "TrefFudge",
    "sourceStressScaling",
    "directAoSAAdoption",
    "AoVBoundaryCarrierAdoption",
    "boundaryRootProductionAdoption",
    "valveLoadTimingAcceptance",
    "reflectionCoefficientClaim",
    "rootCauseAcceptance",
    "fixAcceptance",
    "officialMorphologyAcceptance",
    "finalNoAlternansAcceptance",
    "LandDefaultFlipUnlock",
    "clinicalScientificValidationClaim",
  ];
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function median(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const midpoint = Math.floor(finite.length / 2);
  const value = finite.length % 2 === 1
    ? finite[midpoint]
    : (finite[midpoint - 1] + finite[midpoint]) / 2;
  return round(value);
}

function formatNumber(value: number | null): string {
  return value == null ? "missing" : value.toFixed(6);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function artifactHash(value: { readonly normalizedSha256?: string }): string {
  const { normalizedSha256: _normalizedSha256, ...withoutHash } = value;
  return hashStable(withoutHash);
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}

function main(): void {
  const evidence = buildArterialRootBoundaryAttributionPhase5AHEvidence();
  const outPath = path.resolve(process.cwd(), ARTERIAL_ROOT_BOUNDARY_ATTRIBUTION_PHASE5AH_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `Wrote ${ARTERIAL_ROOT_BOUNDARY_ATTRIBUTION_PHASE5AH_RESULT_PATH} `
    + `healthOk=${evidence.summary.healthOkCandidateComparisonCount} `
    + `stockQDotTiming=${evidence.summary.stockQDotTimingOutputPreservedCount} `
    + `landQDotTiming=${evidence.summary.landQDotTimingOutputPreservedCount} `
    + `landTimingOnly=${evidence.summary.landTimingOnlyOutputPreservedCount}`,
  );
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildArterialRootBoundaryAttributionPhase5AH.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
