import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, caseDocumentToSimInstances, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import { defaultParams } from "@/engine/ModelCore";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
  resolveModelCoreRuntimeActiveSource,
  type ModelCoreRuntimeActiveSourceMode,
} from "@/engine/myocardium/runtimeActiveSource";
import { MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE } from "@/engine/myocardium/runtimeRootZc";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";

export const ATRIAL_LAND_DEFAULT_CANDIDATE_PHASE5AQ_ID =
  "atrial-land-default-candidate-phase5aq-result-v1";

export const ATRIAL_LAND_DEFAULT_CANDIDATE_PHASE5AQ_RESULT_PATH =
  "data/myocardium/protocols/atrial-land-default-candidate-phase5aq-result-v1.json";

const DT_SEC = 0.001 as const;
const SAMPLE_HZ = 1000 as const;
const MEASURE_BEATS = 3 as const;

type AtrialLandCandidateId = "current-lv-rv-land-default" | "all-chamber-land-candidate";
type AtrialChamber = "LA" | "RA";

const POINTS = [
  { id: "normal-hr75", label: "normal HR75", HR: 75, targetTBVMl: 5600, preloadClass: "normal", knobs: {} },
  { id: "low-preload-hr75", label: "low preload HR75", HR: 75, targetTBVMl: 4800, preloadClass: "low-preload", knobs: {} },
  { id: "high-preload-hr75", label: "high preload HR75", HR: 75, targetTBVMl: 6200, preloadClass: "high-preload", knobs: {} },
  { id: "normal-hr90", label: "normal HR90", HR: 90, targetTBVMl: 5600, preloadClass: "normal", knobs: {} },
  { id: "low-preload-hr90", label: "low preload HR90", HR: 90, targetTBVMl: 4800, preloadClass: "low-preload", knobs: {} },
  { id: "high-preload-hr90", label: "high preload HR90", HR: 90, targetTBVMl: 6200, preloadClass: "high-preload", knobs: {} },
] as const satisfies readonly AtrialLandPhase5AQPointSpec[];

const CANDIDATES = [
  {
    id: "current-lv-rv-land-default",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    atrialLandCandidate: false,
  },
  {
    id: "all-chamber-land-candidate",
    runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
    atrialLandCandidate: true,
  },
] as const;

export type AtrialLandPhase5AQPointSpec = {
  readonly id: string;
  readonly label: string;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly preloadClass: "normal" | "low-preload" | "high-preload";
  readonly knobs: Partial<ClinicalKnobs>;
};

export type AtrialLandPhase5AQInstrumentationCompact = {
  readonly sourceActiveStressPa: number;
  readonly commitProviderStateAfterStep: number;
  readonly landSolveOkCount: number;
  readonly landSolveFailureCount: number;
  readonly maxSolverResidualNorm: number;
  readonly maxPreviousFreeCalciumMismatchUM: number;
  readonly sourcePathFiniteHealthAllSamples: boolean;
  readonly commitPathFiniteHealthAllSamples: boolean;
  readonly lastFailureReason: string | null;
};

export type AtrialLandPhase5AQLoopMetrics = {
  readonly pressureRangeMmHg: number | null;
  readonly volumeRangeMl: number | null;
  readonly pressureMeanMmHg: number | null;
  readonly volumeMeanMl: number | null;
  readonly signedAreaMmHgMl: number | null;
  readonly areaAbsMmHgMl: number | null;
  readonly roughness01: number | null;
  readonly basicReadableSignal: boolean;
};

export type AtrialLandPhase5AQRun = {
  readonly pointId: string;
  readonly candidateId: AtrialLandCandidateId;
  readonly runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode;
  readonly rootZcMode: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE;
  readonly targetTBVMl: number;
  readonly HR: 75 | 90;
  readonly settled: boolean;
  readonly status: "measured" | "settle-failed" | "measurement-error";
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly settleActualSeconds: number | null;
  readonly health: Pick<
    SimulationHealth,
    "status" | "periodBeats" | "cycleMetricDelta" | "tbvDriftMl" | "leftRightFlowMismatchLMin" | "messages"
  > | null;
  readonly metrics: Pick<
    SimMetrics,
    "CO_L" | "CO_R" | "AoPMean" | "PAPMean" | "LAPMean" | "RAPMean" | "LVEDPApprox" | "RVEDPApprox"
  > | null;
  readonly providerIds: Partial<Record<"LV" | "RV" | "LA" | "RA", string>>;
  readonly providerInstrumentation: Partial<Record<"LV" | "RV" | "LA" | "RA", AtrialLandPhase5AQInstrumentationCompact>>;
  readonly atrialLoops: Record<AtrialChamber, AtrialLandPhase5AQLoopMetrics | null>;
  readonly comparisonVsCurrent: AtrialLandPhase5AQComparison | null;
  readonly errorMessage: string | null;
};

export type AtrialLandPhase5AQComparison = {
  readonly coRatioVsCurrent: number | null;
  readonly lapDeltaVsCurrentMmHg: number | null;
  readonly rapDeltaVsCurrentMmHg: number | null;
  readonly laReadableSignalDelta: number;
  readonly raReadableSignalDelta: number;
  readonly outputPreserved: boolean;
  readonly atrialProviderReached: boolean;
  readonly atrialLandFailureFree: boolean;
  readonly classification:
    | "current-reference"
    | "candidate-provider-feasible-output-preserved"
    | "candidate-provider-reached-output-cost"
    | "candidate-provider-or-solver-blocked"
    | "uninterpretable";
};

export type AtrialLandPhase5AQEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_LAND_DEFAULT_CANDIDATE_PHASE5AQ_ID;
  readonly phase: "Phase 5AQ";
  readonly claimBoundary: "atrial-land-default-candidate-evidence-no-runtime-flip";
  readonly protocol: {
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidates: typeof CANDIDATES;
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly noRuntimeDefaultFlip: true;
    readonly rootZcMode: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly points: typeof POINTS;
  readonly runs: readonly AtrialLandPhase5AQRun[];
  readonly summary: {
    readonly pointCount: number;
    readonly candidateComparisonCount: number;
    readonly currentMeasuredHealthOkCount: number;
    readonly candidateMeasuredHealthOkCount: number;
    readonly candidateProviderReachedCount: number;
    readonly candidateAtrialFailureFreeCount: number;
    readonly candidateOutputPreservedCount: number;
    readonly candidateReadableLaPointCount: number;
    readonly candidateReadableRaPointCount: number;
    readonly candidateMeasurementErrorPointIds: readonly string[];
    readonly candidateOutputNotPreservedPointIds: readonly string[];
    readonly candidateErrorMessages: readonly string[];
    readonly candidateSupport: "provider-feasible" | "not-supported";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noRuntimeDefaultFlip: true;
    readonly noLegacyDeletion: true;
    readonly noOfficialCaseTuning: true;
    readonly noAtrialFigureEightFinality: true;
    readonly noAtrialLandPhysiologyAcceptance: true;
    readonly noQDotClampRemoval: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildAtrialLandDefaultCandidatePhase5AQEvidence(): AtrialLandPhase5AQEvidence {
  const rawRuns = POINTS.flatMap((point) => CANDIDATES.map((candidate) => runPoint(point, candidate)));
  const runs = withComparisons(rawRuns);
  const currentRuns = runs.filter((run) => run.candidateId === "current-lv-rv-land-default");
  const candidateRuns = runs.filter((run) => run.candidateId === "all-chamber-land-candidate");
  const candidateComparisons = candidateRuns.map((run) => run.comparisonVsCurrent).filter(Boolean);
  const candidateProviderReached = candidateRuns.filter((run) => run.comparisonVsCurrent?.atrialProviderReached);
  const candidateAtrialFailureFree = candidateRuns.filter((run) => run.comparisonVsCurrent?.atrialLandFailureFree);
  const candidateOutputPreserved = candidateRuns.filter((run) => run.comparisonVsCurrent?.outputPreserved);
  const candidateReadableLa = candidateRuns.filter((run) => run.atrialLoops.LA?.basicReadableSignal);
  const candidateReadableRa = candidateRuns.filter((run) => run.atrialLoops.RA?.basicReadableSignal);
  const candidateMeasurementErrorPointIds = candidateRuns
    .filter((run) => run.status === "measurement-error")
    .map((run) => run.pointId);
  const candidateOutputNotPreservedPointIds = candidateRuns
    .filter((run) => run.comparisonVsCurrent?.outputPreserved !== true)
    .map((run) => run.pointId);
  const candidateErrorMessages = Array.from(new Set(candidateRuns
    .map((run) => run.errorMessage)
    .filter((message): message is string => Boolean(message))));
  const candidateSupport =
    candidateRuns.length === POINTS.length
    && candidateProviderReached.length === POINTS.length
    && candidateAtrialFailureFree.length === POINTS.length
    && candidateOutputPreserved.length === POINTS.length
      ? "provider-feasible" as const
      : "not-supported" as const;
  const evidenceWithoutHash: Omit<AtrialLandPhase5AQEvidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_LAND_DEFAULT_CANDIDATE_PHASE5AQ_ID,
    phase: "Phase 5AQ",
    claimBoundary: "atrial-land-default-candidate-evidence-no-runtime-flip",
    protocol: {
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidates: CANDIDATES,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      noRuntimeDefaultFlip: true,
      rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    points: POINTS,
    runs,
    summary: {
      pointCount: POINTS.length,
      candidateComparisonCount: candidateComparisons.length,
      currentMeasuredHealthOkCount: currentRuns.filter(isMeasuredHealthOk).length,
      candidateMeasuredHealthOkCount: candidateRuns.filter(isMeasuredHealthOk).length,
      candidateProviderReachedCount: candidateProviderReached.length,
      candidateAtrialFailureFreeCount: candidateAtrialFailureFree.length,
      candidateOutputPreservedCount: candidateOutputPreserved.length,
      candidateReadableLaPointCount: candidateReadableLa.length,
      candidateReadableRaPointCount: candidateReadableRa.length,
      candidateMeasurementErrorPointIds,
      candidateOutputNotPreservedPointIds,
      candidateErrorMessages,
      candidateSupport,
      currentInterpretation: interpretation({
        pointCount: POINTS.length,
        providerReached: candidateProviderReached.length,
        failureFree: candidateAtrialFailureFree.length,
        outputPreserved: candidateOutputPreserved.length,
        readableLa: candidateReadableLa.length,
        readableRa: candidateReadableRa.length,
        candidateSupport,
      }),
      recommendedNext: candidateSupport === "provider-feasible"
        ? [
          "keep all-chamber Land off by default and next attribute atrial loop readability before any runtime flip",
          "use the same HR75/90 normal/preload envelope for atrial figure-eight refinement",
          "do not delete legacy active-stress until RA/LA morphology and rollback evidence are stronger",
        ]
        : [
          "keep RA/LA on legacy active-stress and inspect failed or output-cost points before further chamber replacement",
          "do not tune Land/Tref/source-stress/qDot/valves to force atrial candidate support",
        ],
      blockers: candidateSupport === "provider-feasible"
        ? [
          "atrial figure-eight readability remains unaccepted",
          "all-chamber runtime default flip remains blocked",
          "legacy active-stress deletion remains blocked",
        ]
        : [
          "all-chamber Land provider feasibility is not supported by this artifact",
          ...candidateMeasurementErrorPointIds.map((id) => `candidate measurement error at ${id}`),
          ...candidateErrorMessages.map((message) => `candidate error: ${message}`),
          "atrial figure-eight readability remains unaccepted",
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

function runPoint(
  point: typeof POINTS[number],
  candidate: typeof CANDIDATES[number],
): Omit<AtrialLandPhase5AQRun, "comparisonVsCurrent"> {
  const [instance] = caseDocumentToSimInstances(syntheticCaseDocument(point));
  if (!instance) throw new Error(`No synthetic instance for ${point.id}`);
  const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const laInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const raInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: candidate.runtimeActiveSourceMode,
    instrumentation: lvInstrumentation,
    rvInstrumentation,
    laInstrumentation,
    raInstrumentation,
    runtimeParams: instance.params,
  });
  const common = {
    pointId: point.id,
    candidateId: candidate.id,
    runtimeActiveSourceMode: candidate.runtimeActiveSourceMode,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    targetTBVMl: point.targetTBVMl,
    HR: point.HR,
    providerIds: resolved.sourceProviderIds,
  } as const;
  try {
    const settled = settleToSteadyState(instance.params, {
      targetTBV: point.targetTBVMl,
      dt: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
      experimentalOptions: resolved.experimentalOptions,
    });
    if (!settled.ok) {
      return {
        ...common,
        settled: false,
        status: "settle-failed",
        settleReason: settled.settleStatus.reason,
        settleBeats: settled.settleStatus.beats,
        settleActualSeconds: null,
        health: compactHealth(settled.core.health()),
        metrics: null,
        providerInstrumentation: compactInstrumentation(resolved.instrumentationByChamber),
        atrialLoops: { LA: null, RA: null },
        errorMessage: null,
      };
    }
    const measurement = measureSteady(settled.core, settled.settleStatus, {
      targetTBV: point.targetTBVMl,
      dt: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
      experimentalOptions: resolved.experimentalOptions,
    });
    return {
      ...common,
      settled: true,
      status: "measured",
      settleReason: settled.settleStatus.reason,
      settleBeats: settled.settleStatus.beats,
      settleActualSeconds: round(settled.settleStatus.actualSeconds),
      health: compactHealth(measurement.health),
      metrics: compactMetrics(measurement.metrics),
      providerInstrumentation: compactInstrumentation(resolved.instrumentationByChamber),
      atrialLoops: {
        LA: loopMetrics(measurement.samples, "LA"),
        RA: loopMetrics(measurement.samples, "RA"),
      },
      errorMessage: null,
    };
  } catch (error) {
    return {
      ...common,
      settled: false,
      status: "measurement-error",
      settleReason: "error",
      settleBeats: 0,
      settleActualSeconds: null,
      health: null,
      metrics: null,
      providerInstrumentation: compactInstrumentation(resolved.instrumentationByChamber),
      atrialLoops: { LA: null, RA: null },
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function withComparisons(
  rawRuns: readonly Omit<AtrialLandPhase5AQRun, "comparisonVsCurrent">[],
): readonly AtrialLandPhase5AQRun[] {
  return rawRuns.map((run) => {
    const current = rawRuns.find((candidate) =>
      candidate.pointId === run.pointId && candidate.candidateId === "current-lv-rv-land-default"
    );
    return { ...run, comparisonVsCurrent: compare(run, current) };
  });
}

function compare(
  run: Omit<AtrialLandPhase5AQRun, "comparisonVsCurrent">,
  current: Omit<AtrialLandPhase5AQRun, "comparisonVsCurrent"> | undefined,
): AtrialLandPhase5AQComparison {
  if (run.candidateId === "current-lv-rv-land-default") {
    return {
      coRatioVsCurrent: 1,
      lapDeltaVsCurrentMmHg: 0,
      rapDeltaVsCurrentMmHg: 0,
      laReadableSignalDelta: 0,
      raReadableSignalDelta: 0,
      outputPreserved: isMeasuredHealthOk(run),
      atrialProviderReached: false,
      atrialLandFailureFree: true,
      classification: "current-reference",
    };
  }
  if (!current?.metrics || !run.metrics || !isMeasuredHealthOk(current) || !isMeasuredHealthOk(run)) {
    return {
      coRatioVsCurrent: null,
      lapDeltaVsCurrentMmHg: null,
      rapDeltaVsCurrentMmHg: null,
      laReadableSignalDelta: 0,
      raReadableSignalDelta: 0,
      outputPreserved: false,
      atrialProviderReached: atrialProviderReached(run),
      atrialLandFailureFree: atrialFailureFree(run),
      classification: "uninterpretable",
    };
  }
  const coRatio = ratio(run.metrics.CO_L, current.metrics.CO_L);
  const outputPreserved = coRatio != null && coRatio >= 0.75 && coRatio <= 1.25;
  const atrialProviderReachedValue = atrialProviderReached(run);
  const atrialLandFailureFreeValue = atrialFailureFree(run);
  const laReadableSignalDelta = readable01(run.atrialLoops.LA) - readable01(current.atrialLoops.LA);
  const raReadableSignalDelta = readable01(run.atrialLoops.RA) - readable01(current.atrialLoops.RA);
  return {
    coRatioVsCurrent: coRatio,
    lapDeltaVsCurrentMmHg: delta(run.metrics.LAPMean, current.metrics.LAPMean),
    rapDeltaVsCurrentMmHg: delta(run.metrics.RAPMean, current.metrics.RAPMean),
    laReadableSignalDelta,
    raReadableSignalDelta,
    outputPreserved,
    atrialProviderReached: atrialProviderReachedValue,
    atrialLandFailureFree: atrialLandFailureFreeValue,
    classification: !atrialProviderReachedValue || !atrialLandFailureFreeValue
      ? "candidate-provider-or-solver-blocked"
      : outputPreserved
        ? "candidate-provider-feasible-output-preserved"
        : "candidate-provider-reached-output-cost",
  };
}

function syntheticCaseDocument(point: typeof POINTS[number]): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: {
      id: `phase5aq-atrial-land-${point.id}`,
      title: `Phase 5AQ ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5AQ ${point.label}`,
      description: "Synthetic atrial Land default-candidate point; not an official case.",
      modelLimitations: [
        "Explicit candidate diagnostic only.",
        "No atrial figure-eight finality, official-case tuning, legacy deletion, or runtime default flip.",
      ],
    },
    instances: [{
      id: point.id,
      name: point.label,
      color: "#38bdf8",
      isVisible: true,
      baseline: "active-normal",
      knobs: { ...point.knobs, HR: point.HR },
      interventions: [],
      rawPatch: {},
      targetVolume: point.targetTBVMl,
    }],
    panels: [],
  };
}

function compactInstrumentation(
  input: Partial<Record<"LV" | "RV" | "LA" | "RA", ModelCoreLand2017LvSourceProviderInstrumentation>>,
): Partial<Record<"LV" | "RV" | "LA" | "RA", AtrialLandPhase5AQInstrumentationCompact>> {
  return Object.fromEntries(
    Object.entries(input).map(([chamber, instrumentation]) => [chamber, {
      sourceActiveStressPa: instrumentation.sourceActiveStressPa,
      commitProviderStateAfterStep: instrumentation.commitProviderStateAfterStep,
      landSolveOkCount: instrumentation.landSolveOkCount,
      landSolveFailureCount: instrumentation.landSolveFailureCount,
      maxSolverResidualNorm: round(instrumentation.maxSolverResidualNorm),
      maxPreviousFreeCalciumMismatchUM: round(instrumentation.maxPreviousFreeCalciumMismatchUM),
      sourcePathFiniteHealthAllSamples: instrumentation.sourcePathAudit.finiteHealthAllSamples,
      commitPathFiniteHealthAllSamples: instrumentation.commitPathAudit.finiteHealthAllSamples,
      lastFailureReason: instrumentation.lastFailureReason,
    } satisfies AtrialLandPhase5AQInstrumentationCompact])
  ) as Partial<Record<"LV" | "RV" | "LA" | "RA", AtrialLandPhase5AQInstrumentationCompact>>;
}

function compactHealth(health: SimulationHealth): AtrialLandPhase5AQRun["health"] {
  return {
    status: health.status,
    periodBeats: health.periodBeats,
    cycleMetricDelta: round(health.cycleMetricDelta),
    tbvDriftMl: round(health.tbvDriftMl),
    leftRightFlowMismatchLMin: round(health.leftRightFlowMismatchLMin),
    messages: health.messages,
  };
}

function compactMetrics(metrics: SimMetrics): AtrialLandPhase5AQRun["metrics"] {
  return {
    CO_L: finiteOrNull(metrics.CO_L),
    CO_R: finiteOrNull(metrics.CO_R),
    AoPMean: finiteOrNull(metrics.AoPMean),
    PAPMean: finiteOrNull(metrics.PAPMean),
    LAPMean: finiteOrNull(metrics.LAPMean),
    RAPMean: finiteOrNull(metrics.RAPMean),
    LVEDPApprox: finiteOrNull(metrics.LVEDPApprox),
    RVEDPApprox: finiteOrNull(metrics.RVEDPApprox),
  };
}

function loopMetrics(samples: readonly SimSample[], chamber: AtrialChamber): AtrialLandPhase5AQLoopMetrics | null {
  if (samples.length < 4) return null;
  const volumeKey = chamber === "LA" ? "VLA" : "VRA";
  const pressureKey = chamber === "LA" ? "LAP" : "RAP";
  const volumes = samples.map((sample) => sample[volumeKey]);
  const pressures = samples.map((sample) => sample[pressureKey]);
  const pressureRange = range(pressures);
  const volumeRange = range(volumes);
  const signedArea = signedPvArea(volumes, pressures);
  const roughness = roughness01(pressures);
  return {
    pressureRangeMmHg: round(pressureRange),
    volumeRangeMl: round(volumeRange),
    pressureMeanMmHg: round(mean(pressures)),
    volumeMeanMl: round(mean(volumes)),
    signedAreaMmHgMl: round(signedArea),
    areaAbsMmHgMl: round(Math.abs(signedArea)),
    roughness01: round(roughness),
    basicReadableSignal: pressureRange >= 1.5 && volumeRange >= 8 && Math.abs(signedArea) >= 3 && roughness <= 1.2,
  };
}

function atrialProviderReached(run: Omit<AtrialLandPhase5AQRun, "comparisonVsCurrent">): boolean {
  return (run.providerInstrumentation.LA?.sourceActiveStressPa ?? 0) > 0
    && (run.providerInstrumentation.RA?.sourceActiveStressPa ?? 0) > 0
    && (run.providerInstrumentation.LA?.commitProviderStateAfterStep ?? 0) > 0
    && (run.providerInstrumentation.RA?.commitProviderStateAfterStep ?? 0) > 0;
}

function atrialFailureFree(run: Omit<AtrialLandPhase5AQRun, "comparisonVsCurrent">): boolean {
  return (run.providerInstrumentation.LA?.landSolveFailureCount ?? 0) === 0
    && (run.providerInstrumentation.RA?.landSolveFailureCount ?? 0) === 0
    && run.providerInstrumentation.LA?.sourcePathFiniteHealthAllSamples !== false
    && run.providerInstrumentation.RA?.sourcePathFiniteHealthAllSamples !== false
    && run.providerInstrumentation.LA?.commitPathFiniteHealthAllSamples !== false
    && run.providerInstrumentation.RA?.commitPathFiniteHealthAllSamples !== false;
}

function isMeasuredHealthOk(run: Pick<AtrialLandPhase5AQRun, "status" | "health">): boolean {
  return run.status === "measured" && run.health?.status === "ok";
}

function interpretation(args: {
  readonly pointCount: number;
  readonly providerReached: number;
  readonly failureFree: number;
  readonly outputPreserved: number;
  readonly readableLa: number;
  readonly readableRa: number;
  readonly candidateSupport: "provider-feasible" | "not-supported";
}): string {
  return `Phase 5AQ tests explicit all-chamber Land candidate reachability over ${args.pointCount} HR75/90 preload points while keeping the user-0 default at LV+RV Land plus sourced root/Zc. The all-chamber candidate reached LA/RA providers in ${args.providerReached}/${args.pointCount}, was atrial-Land failure-free in ${args.failureFree}/${args.pointCount}, preserved output in ${args.outputPreserved}/${args.pointCount}, and produced basic readable loop signals in LA ${args.readableLa}/${args.pointCount} and RA ${args.readableRa}/${args.pointCount}. Candidate support is ${args.candidateSupport}; this does not claim atrial figure-eight finality or all-chamber runtime default.`;
}

function boundary(): AtrialLandPhase5AQEvidence["boundary"] {
  return {
    noRuntimeDefaultFlip: true,
    noLegacyDeletion: true,
    noOfficialCaseTuning: true,
    noAtrialFigureEightFinality: true,
    noAtrialLandPhysiologyAcceptance: true,
    noQDotClampRemoval: true,
    noValveLoadTimingAcceptance: true,
    noClinicalScientificValidationClaim: true,
  };
}

function doesNotUnlock(): readonly string[] {
  return [
    "runtimeDefaultFlip",
    "legacyActiveStressDeletion",
    "officialCaseTuning",
    "atrialFigureEightFinality",
    "atrialLandPhysiologyAcceptance",
    "qDotClampRemoval",
    "valveLoadTimingAcceptance",
    "clinicalScientificValidationClaim",
  ];
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || Math.abs(denominator) < 1e-9) return null;
  return round(numerator / denominator);
}

function delta(value: number | null, reference: number | null): number | null {
  return value == null || reference == null ? null : round(value - reference);
}

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? round(value) : null;
}

function readable01(loop: AtrialLandPhase5AQLoopMetrics | null): number {
  return loop?.basicReadableSignal ? 1 : 0;
}

function range(values: readonly number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function signedPvArea(volumes: readonly number[], pressures: readonly number[]): number {
  let area = 0;
  for (let i = 0; i < volumes.length; i++) {
    const j = (i + 1) % volumes.length;
    area += volumes[i] * pressures[j] - volumes[j] * pressures[i];
  }
  return 0.5 * area;
}

function roughness01(values: readonly number[]): number {
  if (values.length < 3) return 0;
  let secondDiff = 0;
  for (let i = 1; i < values.length - 1; i++) {
    secondDiff += Math.abs(values[i + 1] - 2 * values[i] + values[i - 1]);
  }
  return secondDiff / Math.max(range(values), 1e-9);
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sortJson(item)]),
  );
}

function main(): void {
  const evidence = buildAtrialLandDefaultCandidatePhase5AQEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_LAND_DEFAULT_CANDIDATE_PHASE5AQ_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `wrote ${ATRIAL_LAND_DEFAULT_CANDIDATE_PHASE5AQ_RESULT_PATH} `
    + `support=${evidence.summary.candidateSupport} `
    + `provider=${evidence.summary.candidateProviderReachedCount}/${evidence.summary.pointCount} `
    + `failureFree=${evidence.summary.candidateAtrialFailureFreeCount}/${evidence.summary.pointCount} `
    + `output=${evidence.summary.candidateOutputPreservedCount}/${evidence.summary.pointCount}`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
