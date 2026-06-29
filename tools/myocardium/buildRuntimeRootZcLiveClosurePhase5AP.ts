import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, caseDocumentToSimInstances, type CaseDocument } from "@/caseDoc";
import phase5AFArtifact from "@/data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json";
import phase5AOArtifact from "@/data/myocardium/protocols/lv-rv-land-default-flip-phase5ao-result-v1.json";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import { KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import { defaultParams } from "@/engine/ModelCore";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
} from "@/engine/myocardium/runtimeRootZc";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";

export const RUNTIME_ROOT_ZC_LIVE_CLOSURE_PHASE5AP_ID =
  "runtime-root-zc-live-closure-phase5ap-result-v1";

export const RUNTIME_ROOT_ZC_LIVE_CLOSURE_PHASE5AP_RESULT_PATH =
  "data/myocardium/protocols/runtime-root-zc-live-closure-phase5ap-result-v1.json";

const SAMPLE_HZ = 1000 as const;
const DT_SEC = 0.001 as const;
const MEASURE_BEATS = 3 as const;
const AOV_OPEN_THRESHOLD = 0.5 as const;
const QAO_FORWARD_EPS_ML_PER_SEC = 1e-9 as const;
const QDOT_REDUCTION_MIN = 0.25 as const;
const OUTPUT_RATIO_MIN = 0.75 as const;
const OUTPUT_RATIO_MAX = 1.25 as const;
const TIMING_RATIO_MIN = 0.75 as const;
const TIMING_RATIO_MAX = 1.35 as const;
const UPSTROKE_RATIO_SIGNAL_MIN = 1.05 as const;
const PEAK_FLOW_RATIO_SIGNAL_MAX = 0.98 as const;
const FORWARD_DURATION_RATIO_SIGNAL_MIN = 1.05 as const;
const ACCEPTANCE_OUTPUT_PRESERVED_MIN = 0.95 as const;
const ACCEPTANCE_TIMING_SIGNAL_MIN = 0.6 as const;

const LOW_PRELOAD_ALTERNANS_EDGE = {
  id: "low-preload-alternans-edge",
  label: "low preload alternans edge",
  role: "frozen-low-preload-edge",
  targetTBVMl: 4350,
  knobs: {},
} as const;

const CANDIDATES = [
  {
    id: "current-root-zc",
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
    mechanismId: null,
  },
  {
    id: "sourced-total-2x-boundary-root-zc",
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE,
    mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
  },
] as const;

type CandidateId = typeof CANDIDATES[number]["id"];

export type RuntimeRootZcLiveClosurePhase5APDiagnosticPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
};

export type RuntimeRootZcLiveClosurePhase5APHealth = Pick<
  SimulationHealth,
  | "status"
  | "periodBeats"
  | "tbvDriftMl"
  | "leftRightFlowMismatchLMin"
  | "cycleMetricDelta"
  | "clampHitCount"
  | "numericalStability"
  | "massConservation"
  | "flowBalance"
  | "physiologicalRange"
  | "messages"
>;

export type RuntimeRootZcLiveClosurePhase5APMetrics = {
  readonly sampleCount: number;
  readonly resolvedSampleHz: typeof SAMPLE_HZ;
  readonly sampleDtSec: number | null;
  readonly measureSeconds: number | null;
  readonly CO_L: number | null;
  readonly CO_R: number | null;
  readonly AoPMean: number | null;
  readonly PAPMean: number | null;
  readonly LVEDPApprox: number | null;
  readonly RVEDPApprox: number | null;
  readonly EF_LApprox: number | null;
  readonly EF_RApprox: number | null;
  readonly SV_L: number | null;
  readonly SV_R: number | null;
  readonly aovOpenSampleCount: number;
  readonly aovOpenDurationSecPerBeat: number | null;
  readonly forwardDurationSecPerBeat: number | null;
  readonly forwardVolumeMlPerBeat: number | null;
  readonly reverseVolumeMlPerBeat: number | null;
  readonly qAoPeakMlPerSec: number | null;
  readonly qAoUpstrokeTimeToPeakSecPerBeat: number | null;
  readonly qAoUpstrokeFractionOfForwardDuration: number | null;
  readonly qDotRawAbsMaxMlPerS2: number | null;
  readonly qDotClampHitFractionAll: number | null;
  readonly qDotClampHitFractionAovOpen: number | null;
  readonly qDotClampImpulseAbsSumMlPerS2: number | null;
  readonly incisuraCandidateScore: number | null;
};

export type RuntimeRootZcLiveClosurePhase5APComparison = {
  readonly qDotClampReductionVsCurrentAovOpen: number | null;
  readonly forwardVolumeRatioVsCurrent: number | null;
  readonly forwardDurationRatioVsCurrent: number | null;
  readonly coRatioVsCurrent: number | null;
  readonly qAoPeakRatioVsCurrent: number | null;
  readonly qAoUpstrokeRatioVsCurrent: number | null;
  readonly incisuraScoreDeltaVsCurrent: number | null;
  readonly outputPreserved: boolean;
  readonly valveLoadTimingPreserved: boolean;
  readonly valveLoadTimingSignal: boolean;
  readonly qDotEngagementSignal: boolean;
  readonly classification:
    | "current-root-zc-reference"
    | "candidate-qdot-timing-output-preserved"
    | "candidate-qdot-only-output-preserved"
    | "candidate-timing-only-output-preserved"
    | "candidate-output-or-timing-cost"
    | "candidate-no-live-signal-output-preserved"
    | "uninterpretable-health-or-settle";
};

export type RuntimeRootZcLiveClosurePhase5APRun = {
  readonly pointId: string;
  readonly candidateId: CandidateId;
  readonly rootZcMode: typeof CANDIDATES[number]["rootZcMode"];
  readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
  readonly providerIds: {
    readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
    readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
  };
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly baseAoVInertanceMmHgSec2PerMl: number;
  readonly boundaryRootAdditionalInertanceMmHgSec2PerMl: number;
  readonly effectiveAoVBoundaryRootInertanceMmHgSec2PerMl: number;
  readonly mechanismId: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID | null;
  readonly status: "measured" | "settle-failed" | "measurement-error";
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly settleActualSeconds: number | null;
  readonly projectorQuiet: boolean | null;
  readonly health: RuntimeRootZcLiveClosurePhase5APHealth | null;
  readonly metrics: RuntimeRootZcLiveClosurePhase5APMetrics | null;
  readonly comparisonVsCurrent: RuntimeRootZcLiveClosurePhase5APComparison | null;
  readonly errorMessage: string | null;
  readonly providerInstrumentation: {
    readonly LV: ProviderInstrumentationSnapshot;
    readonly RV: ProviderInstrumentationSnapshot;
  };
};

type ProviderInstrumentationSnapshot = {
  readonly sourceActiveStressCallCount: number;
  readonly commitProviderStateAfterStepCount: number;
  readonly landSolveFailureCount: number;
  readonly landSolveOkCount: number;
};

export type RuntimeRootZcLiveClosurePhase5APPoint = RuntimeRootZcLiveClosurePhase5APDiagnosticPoint & {
  readonly runs: readonly RuntimeRootZcLiveClosurePhase5APRun[];
};

export type RuntimeRootZcLiveClosurePhase5APEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof RUNTIME_ROOT_ZC_LIVE_CLOSURE_PHASE5AP_ID;
  readonly phase: "Phase 5AP";
  readonly claimBoundary:
    | "runtime-root-zc-live-closure-supports-default-adoption"
    | "runtime-root-zc-live-closure-does-not-support-default-adoption";
  readonly upstreamPhase5AFArtifactId: typeof phase5AFArtifact.id;
  readonly upstreamPhase5AOArtifactId: typeof phase5AOArtifact.id;
  readonly protocol: {
    readonly pointSource: "phase5x-full-synthetic-matrix-plus-frozen-low-preload-edge";
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly candidates: typeof CANDIDATES;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly dtSec: typeof DT_SEC;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly comparisonThresholds: {
      readonly qDotReductionMin: typeof QDOT_REDUCTION_MIN;
      readonly outputRatioMin: typeof OUTPUT_RATIO_MIN;
      readonly outputRatioMax: typeof OUTPUT_RATIO_MAX;
      readonly timingRatioMin: typeof TIMING_RATIO_MIN;
      readonly timingRatioMax: typeof TIMING_RATIO_MAX;
      readonly upstrokeRatioSignalMin: typeof UPSTROKE_RATIO_SIGNAL_MIN;
      readonly peakFlowRatioSignalMax: typeof PEAK_FLOW_RATIO_SIGNAL_MAX;
      readonly forwardDurationRatioSignalMin: typeof FORWARD_DURATION_RATIO_SIGNAL_MIN;
    };
    readonly acceptanceThresholds: {
      readonly outputPreservedFractionMin: typeof ACCEPTANCE_OUTPUT_PRESERVED_MIN;
      readonly timingSignalFractionMin: typeof ACCEPTANCE_TIMING_SIGNAL_MIN;
    };
    readonly fixedInputs: {
      readonly qDotClamp: true;
      readonly valveThresholds: true;
      readonly valveLossTerms: true;
      readonly loadPreload: true;
      readonly Tref: true;
      readonly sourceStressScale: true;
      readonly LandParameters: true;
    };
  };
  readonly points: readonly RuntimeRootZcLiveClosurePhase5APPoint[];
  readonly summary: {
    readonly pointCount: number;
    readonly runCount: number;
    readonly measuredRunCount: number;
    readonly healthOkRunCount: number;
    readonly candidateComparisonCount: number;
    readonly healthOkCandidateComparisonCount: number;
    readonly candidateHealthOkCount: number;
    readonly outputPreservedHealthOkCount: number;
    readonly qDotTimingOutputPreservedCount: number;
    readonly qDotOnlyOutputPreservedCount: number;
    readonly timingOnlyOutputPreservedCount: number;
    readonly noLiveSignalOutputPreservedCount: number;
    readonly outputOrTimingCostCount: number;
    readonly qDotEngagementSignalCount: number;
    readonly valveLoadTimingSignalCount: number;
    readonly lvLandSolveFailureCount: number;
    readonly rvLandSolveFailureCount: number;
    readonly outputPreservedFraction: number;
    readonly timingSignalFraction: number;
    readonly qDotSignalFraction: number;
    readonly adoptionSupport: "supported" | "not-supported";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noTopologyChange: true;
    readonly noStateLayoutChange: true;
    readonly noDefaultParamChange: true;
    readonly noLegacyActiveStressDeletion: true;
    readonly noOfficialCaseWiring: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noQDotTuning: true;
    readonly noQDotClampRemoval: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noValveThresholdTuning: true;
    readonly noValveLossTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noTrefFudge: true;
    readonly noSourceStressScaling: true;
    readonly noDirectAoSAAdoption: true;
    readonly noReflectionCoefficientClaim: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildRuntimeRootZcLiveClosurePhase5APEvidence():
RuntimeRootZcLiveClosurePhase5APEvidence {
  const points = diagnosticPoints().map(buildPoint);
  const runs = points.flatMap((point) => point.runs);
  const candidateRuns = runs.filter((run) => run.candidateId === "sourced-total-2x-boundary-root-zc");
  const healthOkRuns = runs.filter(isMeasuredHealthOk);
  const healthOkCandidateRuns = candidateRuns.filter(isMeasuredHealthOk);
  const outputPreserved = healthOkCandidateRuns.filter((run) => run.comparisonVsCurrent?.outputPreserved);
  const qDotTiming = healthOkCandidateRuns.filter((run) =>
    run.comparisonVsCurrent?.classification === "candidate-qdot-timing-output-preserved"
  );
  const qDotOnly = healthOkCandidateRuns.filter((run) =>
    run.comparisonVsCurrent?.classification === "candidate-qdot-only-output-preserved"
  );
  const timingOnly = healthOkCandidateRuns.filter((run) =>
    run.comparisonVsCurrent?.classification === "candidate-timing-only-output-preserved"
  );
  const noLiveSignal = healthOkCandidateRuns.filter((run) =>
    run.comparisonVsCurrent?.classification === "candidate-no-live-signal-output-preserved"
  );
  const outputOrTimingCost = candidateRuns.filter((run) =>
    run.comparisonVsCurrent?.classification === "candidate-output-or-timing-cost"
  );
  const outputPreservedFraction = fraction(outputPreserved.length, healthOkCandidateRuns.length);
  const timingSignalFraction = fraction(qDotTiming.length + timingOnly.length, healthOkCandidateRuns.length);
  const qDotSignalFraction = fraction(qDotTiming.length + qDotOnly.length, healthOkCandidateRuns.length);
  const adoptionSupport =
    healthOkCandidateRuns.length === candidateRuns.length
    && outputPreservedFraction >= ACCEPTANCE_OUTPUT_PRESERVED_MIN
    && timingSignalFraction >= ACCEPTANCE_TIMING_SIGNAL_MIN
      ? "supported" as const
      : "not-supported" as const;
  const evidenceWithoutHash: Omit<RuntimeRootZcLiveClosurePhase5APEvidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: RUNTIME_ROOT_ZC_LIVE_CLOSURE_PHASE5AP_ID,
    phase: "Phase 5AP",
    claimBoundary: adoptionSupport === "supported"
      ? "runtime-root-zc-live-closure-supports-default-adoption"
      : "runtime-root-zc-live-closure-does-not-support-default-adoption",
    upstreamPhase5AFArtifactId: phase5AFArtifact.id,
    upstreamPhase5AOArtifactId: phase5AOArtifact.id,
    protocol: {
      pointSource: "phase5x-full-synthetic-matrix-plus-frozen-low-preload-edge",
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      candidates: CANDIDATES,
      sampleHz: SAMPLE_HZ,
      dtSec: DT_SEC,
      measureBeats: MEASURE_BEATS,
      comparisonThresholds: {
        qDotReductionMin: QDOT_REDUCTION_MIN,
        outputRatioMin: OUTPUT_RATIO_MIN,
        outputRatioMax: OUTPUT_RATIO_MAX,
        timingRatioMin: TIMING_RATIO_MIN,
        timingRatioMax: TIMING_RATIO_MAX,
        upstrokeRatioSignalMin: UPSTROKE_RATIO_SIGNAL_MIN,
        peakFlowRatioSignalMax: PEAK_FLOW_RATIO_SIGNAL_MAX,
        forwardDurationRatioSignalMin: FORWARD_DURATION_RATIO_SIGNAL_MIN,
      },
      acceptanceThresholds: {
        outputPreservedFractionMin: ACCEPTANCE_OUTPUT_PRESERVED_MIN,
        timingSignalFractionMin: ACCEPTANCE_TIMING_SIGNAL_MIN,
      },
      fixedInputs: {
        qDotClamp: true,
        valveThresholds: true,
        valveLossTerms: true,
        loadPreload: true,
        Tref: true,
        sourceStressScale: true,
        LandParameters: true,
      },
    },
    points,
    summary: {
      pointCount: points.length,
      runCount: runs.length,
      measuredRunCount: runs.filter((run) => run.status === "measured").length,
      healthOkRunCount: healthOkRuns.length,
      candidateComparisonCount: candidateRuns.length,
      healthOkCandidateComparisonCount: healthOkCandidateRuns.length,
      candidateHealthOkCount: healthOkCandidateRuns.length,
      outputPreservedHealthOkCount: outputPreserved.length,
      qDotTimingOutputPreservedCount: qDotTiming.length,
      qDotOnlyOutputPreservedCount: qDotOnly.length,
      timingOnlyOutputPreservedCount: timingOnly.length,
      noLiveSignalOutputPreservedCount: noLiveSignal.length,
      outputOrTimingCostCount: outputOrTimingCost.length,
      qDotEngagementSignalCount: healthOkCandidateRuns.filter((run) =>
        run.comparisonVsCurrent?.qDotEngagementSignal
      ).length,
      valveLoadTimingSignalCount: healthOkCandidateRuns.filter((run) =>
        run.comparisonVsCurrent?.valveLoadTimingSignal
      ).length,
      lvLandSolveFailureCount: sum(runs, (run) => run.providerInstrumentation.LV.landSolveFailureCount),
      rvLandSolveFailureCount: sum(runs, (run) => run.providerInstrumentation.RV.landSolveFailureCount),
      outputPreservedFraction,
      timingSignalFraction,
      qDotSignalFraction,
      adoptionSupport,
      currentInterpretation: interpretation({
        pointCount: points.length,
        healthOkCandidateComparisonCount: healthOkCandidateRuns.length,
        candidateComparisonCount: candidateRuns.length,
        outputPreservedFraction,
        timingSignalFraction,
        qDotSignalFraction,
        outputOrTimingCostCount: outputOrTimingCost.length,
        adoptionSupport,
      }),
      recommendedNext: recommendedNext(adoptionSupport),
      limitations: [
        "Phase 5AP is a live LV+RV Land default closure experiment over synthetic user-knob points plus one frozen low-preload edge, not official-case tuning.",
        "The sourced root/Zc mechanism is the existing off-by-default boundary/root hook; no topology, state layout, default parameter, qDot clamp, valve threshold, valve loss, load/preload, Tref, source-stress, or Land parameter is tuned.",
        "Timing signals are directional discharge-path morphology evidence, not official morphology acceptance or reflection-coefficient validation.",
        "qDot clamp removal remains unsupported even if the root/Zc default adoption signal is supported.",
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

function diagnosticPoints(): readonly RuntimeRootZcLiveClosurePhase5APDiagnosticPoint[] {
  const sweepPoints = phase5XArtifact.protocol.sweepPoints as readonly RuntimeRootZcLiveClosurePhase5APDiagnosticPoint[];
  return [...sweepPoints, LOW_PRELOAD_ALTERNANS_EDGE];
}

function buildPoint(point: RuntimeRootZcLiveClosurePhase5APDiagnosticPoint):
RuntimeRootZcLiveClosurePhase5APPoint {
  return {
    ...point,
    runs: runsWithComparisons(CANDIDATES.map((candidate) => runPoint(point, candidate))),
  };
}

function runPoint(
  point: RuntimeRootZcLiveClosurePhase5APDiagnosticPoint,
  candidate: typeof CANDIDATES[number],
): Omit<RuntimeRootZcLiveClosurePhase5APRun, "comparisonVsCurrent"> {
  const [instance] = caseDocumentToSimInstances(syntheticCaseDocument(point));
  if (!instance) throw new Error(`No synthetic instance for ${point.id}`);
  const baseAoVL = Math.max(instance.params.AoV_L ?? defaultParams().AoV_L, 1e-9);
  const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    instrumentation: lvInstrumentation,
    rvInstrumentation,
    rootZcMode: candidate.rootZcMode,
    ...(candidate.rootZcMode === MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE
      ? {
        rootZcBaseAoVInertanceMmHgSec2PerMl: baseAoVL,
      }
      : {}),
  });
  const boundaryRootAdditionalL = resolved.rootZc.additionalAorticRootInertanceMmHgSec2PerMl;
  const params = { ...instance.params } satisfies Partial<CoreRuntimeParams>;
  const options = {
    targetTBV: point.targetTBVMl,
    dt: DT_SEC,
    sampleHz: SAMPLE_HZ,
    measureBeats: MEASURE_BEATS,
    requireProjectorQuiet: false,
    experimentalOptions: resolved.experimentalOptions,
  };
  const common = {
    pointId: point.id,
    candidateId: candidate.id,
    rootZcMode: candidate.rootZcMode,
    runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    providerIds: {
      LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
      RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
    },
    targetTBVMl: point.targetTBVMl,
    knobs: point.knobs,
    baseAoVInertanceMmHgSec2PerMl: round(baseAoVL),
    boundaryRootAdditionalInertanceMmHgSec2PerMl: round(boundaryRootAdditionalL),
    effectiveAoVBoundaryRootInertanceMmHgSec2PerMl: round(baseAoVL + boundaryRootAdditionalL),
    mechanismId: candidate.mechanismId,
  } as const;
  try {
    const settled = settleToSteadyState(params, options);
    if (!settled.ok) {
      return {
        ...common,
        status: "settle-failed" as const,
        settled: false,
        settleReason: settled.settleStatus.reason,
        settleBeats: settled.settleStatus.beats,
        settleActualSeconds: null,
        projectorQuiet: null,
        health: compactHealth(settled.core.health()),
        metrics: null,
        errorMessage: null,
        providerInstrumentation: instrumentation(lvInstrumentation, rvInstrumentation),
      };
    }
    const measurement = measureSteady(settled.core, settled.settleStatus, options);
    return {
      ...common,
      status: "measured" as const,
      settled: true,
      settleReason: settled.settleStatus.reason,
      settleBeats: settled.settleStatus.beats,
      settleActualSeconds: round(settled.settleStatus.actualSeconds),
      projectorQuiet: measurement.projectorQuiet,
      health: compactHealth(measurement.health),
      metrics: closedLoopMetrics(measurement.samples, measurement.metrics, measurement.measureSeconds),
      errorMessage: null,
      providerInstrumentation: instrumentation(lvInstrumentation, rvInstrumentation),
    };
  } catch (error) {
    return {
      ...common,
      status: "measurement-error" as const,
      settled: false,
      settleReason: "error",
      settleBeats: 0,
      settleActualSeconds: null,
      projectorQuiet: null,
      health: null,
      metrics: null,
      errorMessage: error instanceof Error ? error.message : String(error),
      providerInstrumentation: instrumentation(lvInstrumentation, rvInstrumentation),
    };
  }
}

function syntheticCaseDocument(point: RuntimeRootZcLiveClosurePhase5APDiagnosticPoint): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: {
      id: `phase5ap-runtime-root-zc-${point.id}`,
      title: `Phase 5AP ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5AP ${point.label}`,
      description: "Synthetic live-closure root/Zc acceptance point; not an official case.",
      modelLimitations: [
        "Live-closure diagnostic only.",
        "No qDot clamp removal, valve-threshold tuning, load tuning, Land tuning, or official-case tuning.",
      ],
    },
    instances: [{
      id: point.id,
      name: point.label,
      color: "#38bdf8",
      isVisible: true,
      baseline: "active-normal",
      knobs: point.knobs,
      interventions: [],
      rawPatch: {},
      targetVolume: point.targetTBVMl,
    }],
    panels: [],
  };
}

function runsWithComparisons(
  rawRuns: readonly Omit<RuntimeRootZcLiveClosurePhase5APRun, "comparisonVsCurrent">[],
): readonly RuntimeRootZcLiveClosurePhase5APRun[] {
  const current = rawRuns.find((run) => run.candidateId === "current-root-zc");
  return rawRuns.map((run) => ({
    ...run,
    comparisonVsCurrent: comparisonFor(run, current),
  }));
}

function comparisonFor(
  run: Omit<RuntimeRootZcLiveClosurePhase5APRun, "comparisonVsCurrent">,
  current: Omit<RuntimeRootZcLiveClosurePhase5APRun, "comparisonVsCurrent"> | undefined,
): RuntimeRootZcLiveClosurePhase5APComparison {
  if (run.candidateId === "current-root-zc") {
    return {
      qDotClampReductionVsCurrentAovOpen: 0,
      forwardVolumeRatioVsCurrent: 1,
      forwardDurationRatioVsCurrent: 1,
      coRatioVsCurrent: 1,
      qAoPeakRatioVsCurrent: 1,
      qAoUpstrokeRatioVsCurrent: 1,
      incisuraScoreDeltaVsCurrent: 0,
      outputPreserved: run.status === "measured" && run.health?.status === "ok",
      valveLoadTimingPreserved: true,
      valveLoadTimingSignal: false,
      qDotEngagementSignal: false,
      classification: "current-root-zc-reference",
    };
  }
  if (!current?.metrics || !run.metrics || run.status !== "measured" || current.status !== "measured") {
    return uninterpretableComparison();
  }
  const qDotReduction = reduction(current.metrics.qDotClampHitFractionAovOpen, run.metrics.qDotClampHitFractionAovOpen);
  const forwardVolumeRatio = ratio(run.metrics.forwardVolumeMlPerBeat, current.metrics.forwardVolumeMlPerBeat);
  const forwardDurationRatio = ratio(run.metrics.forwardDurationSecPerBeat, current.metrics.forwardDurationSecPerBeat);
  const coRatio = ratio(run.metrics.CO_L, current.metrics.CO_L);
  const qAoPeakRatio = ratio(run.metrics.qAoPeakMlPerSec, current.metrics.qAoPeakMlPerSec);
  const qAoUpstrokeRatio = ratio(run.metrics.qAoUpstrokeTimeToPeakSecPerBeat, current.metrics.qAoUpstrokeTimeToPeakSecPerBeat);
  const incisuraDelta = delta(run.metrics.incisuraCandidateScore, current.metrics.incisuraCandidateScore);
  const outputPreserved =
    isMeasuredHealthOk(run)
    && isMeasuredHealthOk(current)
    && (forwardVolumeRatio ?? 0) >= OUTPUT_RATIO_MIN
    && (forwardVolumeRatio ?? Infinity) <= OUTPUT_RATIO_MAX
    && (coRatio ?? 0) >= OUTPUT_RATIO_MIN
    && (coRatio ?? Infinity) <= OUTPUT_RATIO_MAX;
  const valveLoadTimingPreserved =
    outputPreserved
    && (forwardDurationRatio ?? 1) >= TIMING_RATIO_MIN
    && (forwardDurationRatio ?? 1) <= TIMING_RATIO_MAX
    && (qAoUpstrokeRatio ?? 1) >= TIMING_RATIO_MIN
    && (qAoUpstrokeRatio ?? 1) <= TIMING_RATIO_MAX;
  const qDotEngagementSignal = (qDotReduction ?? 0) >= QDOT_REDUCTION_MIN;
  const valveLoadTimingSignal =
    valveLoadTimingPreserved
    && (
      (qAoUpstrokeRatio ?? 0) >= UPSTROKE_RATIO_SIGNAL_MIN
      || (qAoPeakRatio ?? Infinity) <= PEAK_FLOW_RATIO_SIGNAL_MAX
      || (forwardDurationRatio ?? 0) >= FORWARD_DURATION_RATIO_SIGNAL_MIN
    );
  return {
    qDotClampReductionVsCurrentAovOpen: qDotReduction,
    forwardVolumeRatioVsCurrent: forwardVolumeRatio,
    forwardDurationRatioVsCurrent: forwardDurationRatio,
    coRatioVsCurrent: coRatio,
    qAoPeakRatioVsCurrent: qAoPeakRatio,
    qAoUpstrokeRatioVsCurrent: qAoUpstrokeRatio,
    incisuraScoreDeltaVsCurrent: incisuraDelta,
    outputPreserved,
    valveLoadTimingPreserved,
    valveLoadTimingSignal,
    qDotEngagementSignal,
    classification: classificationFor({
      outputPreserved,
      valveLoadTimingPreserved,
      qDotEngagementSignal,
      valveLoadTimingSignal,
    }),
  };
}

function classificationFor(args: {
  readonly outputPreserved: boolean;
  readonly valveLoadTimingPreserved: boolean;
  readonly qDotEngagementSignal: boolean;
  readonly valveLoadTimingSignal: boolean;
}): RuntimeRootZcLiveClosurePhase5APComparison["classification"] {
  if (!args.outputPreserved || !args.valveLoadTimingPreserved) return "candidate-output-or-timing-cost";
  if (args.qDotEngagementSignal && args.valveLoadTimingSignal) return "candidate-qdot-timing-output-preserved";
  if (args.qDotEngagementSignal) return "candidate-qdot-only-output-preserved";
  if (args.valveLoadTimingSignal) return "candidate-timing-only-output-preserved";
  return "candidate-no-live-signal-output-preserved";
}

function uninterpretableComparison(): RuntimeRootZcLiveClosurePhase5APComparison {
  return {
    qDotClampReductionVsCurrentAovOpen: null,
    forwardVolumeRatioVsCurrent: null,
    forwardDurationRatioVsCurrent: null,
    coRatioVsCurrent: null,
    qAoPeakRatioVsCurrent: null,
    qAoUpstrokeRatioVsCurrent: null,
    incisuraScoreDeltaVsCurrent: null,
    outputPreserved: false,
    valveLoadTimingPreserved: false,
    valveLoadTimingSignal: false,
    qDotEngagementSignal: false,
    classification: "uninterpretable-health-or-settle",
  };
}

function closedLoopMetrics(
  samples: readonly SimSample[],
  metrics: SimMetrics,
  measureSeconds: number,
): RuntimeRootZcLiveClosurePhase5APMetrics {
  const sampleDt = medianSampleDt(samples);
  let forwardVolume = 0;
  let reverseVolume = 0;
  let aovOpenSampleCount = 0;
  let forwardSampleCount = 0;
  let qDotHitAllCount = 0;
  let qDotHitOpenCount = 0;
  let qDotOpenDenominator = 0;
  let qDotImpulseAbsSum = 0;
  const qDotRawAbs: number[] = [];
  const qAoValues: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1];
    const sample = samples[i];
    const dt = Math.max(sample.t - previous.t, 0);
    forwardVolume += trap(dt, Math.max(0, previous.QAo), Math.max(0, sample.QAo));
    reverseVolume += trap(dt, Math.max(0, -previous.QAo), Math.max(0, -sample.QAo));
  }
  for (const sample of samples) {
    const open = sample.xiAoV > AOV_OPEN_THRESHOLD;
    const forward = open && sample.QAo > QAO_FORWARD_EPS_ML_PER_SEC;
    if (open) aovOpenSampleCount++;
    if (forward) forwardSampleCount++;
    qAoValues.push(sample.QAo);
    qDotRawAbs.push(Math.abs(sample.AoV_qDotRaw));
    const hit = sample.AoV_qDotClampHit01 > 0.5;
    if (hit) qDotHitAllCount++;
    if (open) {
      qDotOpenDenominator++;
      if (hit) qDotHitOpenCount++;
    }
    qDotImpulseAbsSum += Math.abs(sample.AoV_qDotClampImpulse);
  }
  const forwardDuration = forwardSampleCount > 0 && sampleDt != null
    ? round(forwardSampleCount * sampleDt / MEASURE_BEATS)
    : null;
  const qAoUpstroke = qAoUpstrokeTimeToPeak(samples);
  return {
    sampleCount: samples.length,
    resolvedSampleHz: SAMPLE_HZ,
    sampleDtSec: sampleDt,
    measureSeconds: round(measureSeconds),
    CO_L: finiteOrNull(metrics.CO_L),
    CO_R: finiteOrNull(metrics.CO_R),
    AoPMean: finiteOrNull(metrics.AoPMean),
    PAPMean: finiteOrNull(metrics.PAPMean),
    LVEDPApprox: finiteOrNull(metrics.LVEDPApprox),
    RVEDPApprox: finiteOrNull(metrics.RVEDPApprox),
    EF_LApprox: finiteOrNull(metrics.EF_LApprox),
    EF_RApprox: finiteOrNull(metrics.EF_RApprox),
    SV_L: finiteOrNull(metrics.SV_L),
    SV_R: finiteOrNull(metrics.SV_R),
    aovOpenSampleCount,
    aovOpenDurationSecPerBeat: aovOpenSampleCount > 0 && sampleDt != null
      ? round(aovOpenSampleCount * sampleDt / MEASURE_BEATS)
      : null,
    forwardDurationSecPerBeat: forwardDuration,
    forwardVolumeMlPerBeat: round(forwardVolume / MEASURE_BEATS),
    reverseVolumeMlPerBeat: round(reverseVolume / MEASURE_BEATS),
    qAoPeakMlPerSec: maxOrNull(qAoValues),
    qAoUpstrokeTimeToPeakSecPerBeat: qAoUpstroke,
    qAoUpstrokeFractionOfForwardDuration: ratio(qAoUpstroke, forwardDuration),
    qDotRawAbsMaxMlPerS2: maxOrNull(qDotRawAbs),
    qDotClampHitFractionAll: samples.length > 0 ? round(qDotHitAllCount / samples.length) : null,
    qDotClampHitFractionAovOpen: qDotOpenDenominator > 0 ? round(qDotHitOpenCount / qDotOpenDenominator) : null,
    qDotClampImpulseAbsSumMlPerS2: round(qDotImpulseAbsSum),
    incisuraCandidateScore: incisuraCandidateScore(samples),
  };
}

function qAoUpstrokeTimeToPeak(samples: readonly SimSample[]): number | null {
  const durations: number[] = [];
  for (const segment of beatSegments(samples)) {
    const forward = segment.filter((sample) =>
      sample.xiAoV > AOV_OPEN_THRESHOLD && sample.QAo > QAO_FORWARD_EPS_ML_PER_SEC
    );
    if (forward.length < 3) continue;
    const peak = forward.reduce((best, sample) => sample.QAo > best.QAo ? sample : best, forward[0]);
    durations.push(Math.max(peak.t - forward[0].t, 0));
  }
  return medianOrNull(durations);
}

function incisuraCandidateScore(samples: readonly SimSample[]): number | null {
  const scores: number[] = [];
  for (const segment of beatSegments(samples)) {
    const openIndexes = segment
      .map((sample, index) => ({ sample, index }))
      .filter((entry) => entry.sample.xiAoV > AOV_OPEN_THRESHOLD)
      .map((entry) => entry.index);
    if (openIndexes.length < 3) continue;
    const closeIndex = Math.min(openIndexes[openIndexes.length - 1] + 1, segment.length - 1);
    const preClose = segment.slice(Math.max(0, closeIndex - 80), closeIndex + 1);
    const postClose = segment.slice(closeIndex, Math.min(segment.length, closeIndex + 160));
    if (preClose.length < 3 || postClose.length < 12) continue;
    const preCloseMax = Math.max(...preClose.map((sample) => sample.AoP));
    let minIndex = 0;
    for (let i = 1; i < postClose.length; i++) {
      if (postClose[i].AoP < postClose[minIndex].AoP) minIndex = i;
    }
    const postMin = postClose[minIndex].AoP;
    const reboundWindow = postClose.slice(minIndex + 1);
    const reboundMax = reboundWindow.length > 0 ? Math.max(...reboundWindow.map((sample) => sample.AoP)) : postMin;
    const notchDepth = Math.max(0, preCloseMax - postMin);
    const rebound = Math.max(0, reboundMax - postMin);
    scores.push(round(Math.max(0, Math.min(1, Math.min(notchDepth / 4, rebound / 1.5)))));
  }
  return medianOrNull(scores);
}

function beatSegments(samples: readonly SimSample[]): SimSample[][] {
  const segments = new Map<number, SimSample[]>();
  for (const sample of samples) {
    const beat = Math.floor(sample.phi);
    const segment = segments.get(beat) ?? [];
    segment.push(sample);
    segments.set(beat, segment);
  }
  return [...segments.values()].filter((segment) => segment.length > 2);
}

function compactHealth(health: SimulationHealth): RuntimeRootZcLiveClosurePhase5APHealth {
  return {
    status: health.status,
    ...(health.periodBeats != null ? { periodBeats: health.periodBeats } : {}),
    tbvDriftMl: round(health.tbvDriftMl),
    leftRightFlowMismatchLMin: round(health.leftRightFlowMismatchLMin),
    cycleMetricDelta: round(health.cycleMetricDelta),
    clampHitCount: health.clampHitCount,
    numericalStability: health.numericalStability,
    massConservation: health.massConservation,
    flowBalance: health.flowBalance,
    physiologicalRange: health.physiologicalRange,
    messages: health.messages,
  };
}

function instrumentation(
  LV: ModelCoreLand2017LvSourceProviderInstrumentation,
  RV: ModelCoreLand2017LvSourceProviderInstrumentation,
): RuntimeRootZcLiveClosurePhase5APRun["providerInstrumentation"] {
  return {
    LV: compactInstrumentation(LV),
    RV: compactInstrumentation(RV),
  };
}

function compactInstrumentation(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): ProviderInstrumentationSnapshot {
  return {
    sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    landSolveOkCount: instrumentation.landSolveOkCount,
  };
}

function isMeasuredHealthOk(
  run: Pick<RuntimeRootZcLiveClosurePhase5APRun, "status" | "health"> | undefined,
): boolean {
  return run?.status === "measured" && run.health?.status === "ok";
}

function interpretation(args: {
  readonly pointCount: number;
  readonly healthOkCandidateComparisonCount: number;
  readonly candidateComparisonCount: number;
  readonly outputPreservedFraction: number;
  readonly timingSignalFraction: number;
  readonly qDotSignalFraction: number;
  readonly outputOrTimingCostCount: number;
  readonly adoptionSupport: "supported" | "not-supported";
}): string {
  return `Phase 5AP runs the sourced total 2x root/Zc candidate inside the current LV+RV Land default closure over ${args.pointCount} user-knob points. The candidate has ${args.healthOkCandidateComparisonCount}/${args.candidateComparisonCount} health-ok comparisons, output-preserved fraction ${args.outputPreservedFraction}, timing-signal fraction ${args.timingSignalFraction}, qDot-signal fraction ${args.qDotSignalFraction}, and output/timing cost count ${args.outputOrTimingCostCount}. Default-adoption support is ${args.adoptionSupport}; this does not claim qDot clamp removal, official morphology, reflection coefficients, or clinical/scientific validation.`;
}

function recommendedNext(adoptionSupport: "supported" | "not-supported"): readonly string[] {
  if (adoptionSupport === "supported") {
    return [
      "promote the sourced root/Zc candidate to the runtime default in a separate small implementation step or this phase after review, while preserving rollback and no qDot-clamp-removal claim",
      "keep valve/load timing acceptance and official morphology as separate morphology gates",
      "move atrial figure-eight refinement independently; do not bundle it with root/Zc adoption",
    ];
  }
  return [
    "keep root/Zc off by default and inspect health/output/timing-cost points before adoption",
    "do not tune qDot clamps, valve thresholds, valve loss terms, load/preload, Tref, source-stress scale, or Land parameters to force acceptance",
    "continue morphology work through valve/load timing attribution or atrial/filling lanes rather than default root/Zc adoption",
  ];
}

function boundary(): RuntimeRootZcLiveClosurePhase5APEvidence["boundary"] {
  return {
    noTopologyChange: true,
    noStateLayoutChange: true,
    noDefaultParamChange: true,
    noLegacyActiveStressDeletion: true,
    noOfficialCaseWiring: true,
    noOfficialCaseReauthoring: true,
    noWorkbenchRuntimeWiring: true,
    noStateSchemaMigration: true,
    noQDotTuning: true,
    noQDotClampRemoval: true,
    noValveLoadTimingAcceptance: true,
    noValveThresholdTuning: true,
    noValveLossTuning: true,
    noAfterloadTuning: true,
    noPreloadTuning: true,
    noLandParameterTuning: true,
    noTrefFudge: true,
    noSourceStressScaling: true,
    noDirectAoSAAdoption: true,
    noReflectionCoefficientClaim: true,
    noOfficialMorphologyAcceptance: true,
    noFinalNoAlternansAcceptance: true,
    noClinicalScientificValidationClaim: true,
  };
}

function doesNotUnlock(): readonly string[] {
  return [
    "topologyChange",
    "stateLayoutChange",
    "defaultParamChange",
    "legacyActiveStressDeletion",
    "officialCaseWiring",
    "officialCaseReauthoring",
    "workbenchRuntimeWiring",
    "stateSchemaMigration",
    "qDotTuning",
    "qDotClampRemoval",
    "valveLoadTimingAcceptance",
    "valveThresholdTuning",
    "valveLossTuning",
    "afterloadTuning",
    "preloadTuning",
    "LandParameterTuning",
    "TrefFudge",
    "sourceStressScaling",
    "directAoSAAdoption",
    "reflectionCoefficientClaim",
    "officialMorphologyAcceptance",
    "finalNoAlternansAcceptance",
    "clinicalScientificValidationClaim",
  ];
}

function fraction(numerator: number, denominator: number): number {
  return denominator > 0 ? round(numerator / denominator) : 0;
}

function sum<T>(items: readonly T[], selector: (item: T) => number): number {
  return items.reduce((acc, item) => acc + selector(item), 0);
}

function medianSampleDt(samples: readonly SimSample[]): number | null {
  if (samples.length < 2) return null;
  const deltas = samples.slice(1)
    .map((sample, index) => sample.t - samples[index].t)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (deltas.length === 0) return null;
  return round(deltas[Math.floor(deltas.length / 2)]);
}

function reduction(current: number | null, candidate: number | null): number | null {
  if (current == null || candidate == null || current <= 0) return null;
  return round((current - candidate) / current);
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator <= 0) return null;
  return round(numerator / denominator);
}

function delta(value: number | null, baseline: number | null): number | null {
  if (value == null || baseline == null) return null;
  return round(value - baseline);
}

function maxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function medianOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const mid = Math.floor(finite.length / 2);
  return round(finite.length % 2 === 0 ? (finite[mid - 1] + finite[mid]) / 2 : finite[mid]);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function trap(dt: number, a: number, b: number): number {
  return 0.5 * dt * (a + b);
}

function round(value: number | null | undefined): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}

function writeMain(): void {
  const evidence = buildRuntimeRootZcLiveClosurePhase5APEvidence();
  const outPath = path.resolve(process.cwd(), RUNTIME_ROOT_ZC_LIVE_CLOSURE_PHASE5AP_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `wrote ${RUNTIME_ROOT_ZC_LIVE_CLOSURE_PHASE5AP_RESULT_PATH} `
    + `support=${evidence.summary.adoptionSupport} `
    + `output=${evidence.summary.outputPreservedFraction} `
    + `timing=${evidence.summary.timingSignalFraction} `
    + `qdot=${evidence.summary.qDotSignalFraction}`,
  );
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) writeMain();
