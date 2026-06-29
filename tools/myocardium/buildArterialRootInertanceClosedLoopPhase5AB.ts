import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5AAArtifact from "@/data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, caseDocumentToSimInstances, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import { defaultParams, type ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const ARTERIAL_ROOT_INERTANCE_CLOSED_LOOP_PHASE5AB_ID =
  "arterial-root-inertance-closed-loop-phase5ab-result-v1";

export const ARTERIAL_ROOT_INERTANCE_CLOSED_LOOP_PHASE5AB_RESULT_PATH =
  "data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json";

const MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const SAMPLE_HZ = 1000 as const;
const DT_SEC = 0.001 as const;
const MEASURE_BEATS = 3 as const;
const AOV_OPEN_THRESHOLD = 0.5 as const;
const QAO_FORWARD_EPS_ML_PER_SEC = 1e-9 as const;
const QDOT_CLAMP_ML_PER_S2 = 40000 as const;
const CLAMP_REDUCTION_MIN = 0.25 as const;
const FORWARD_VOLUME_RATIO_MIN = 0.8 as const;
const FORWARD_VOLUME_RATIO_MAX = 1.25 as const;
const CO_RATIO_MIN = 0.75 as const;
const CO_RATIO_MAX = 1.25 as const;
const DURATION_RATIO_MIN = 0.75 as const;

const LOW_PRELOAD_ALTERNANS_EDGE = {
  id: "low-preload-alternans-edge",
  label: "low preload alternans edge",
  role: "frozen-low-preload-edge",
  targetTBVMl: 4350,
  knobs: {},
} as const;

const INERTANCE_CANDIDATES = [
  { id: "current-aov-l", rootInertanceMultipleOfAovL: 0, totalAoVInertanceMultiple: 1, role: "current-closure" },
  { id: "effective-root-l-plus-1x-aov-l", rootInertanceMultipleOfAovL: 1, totalAoVInertanceMultiple: 2, role: "closed-loop-diagnostic-candidate" },
  { id: "effective-root-l-plus-2x-aov-l", rootInertanceMultipleOfAovL: 2, totalAoVInertanceMultiple: 3, role: "closed-loop-diagnostic-candidate" },
  { id: "effective-root-l-plus-3x-aov-l", rootInertanceMultipleOfAovL: 3, totalAoVInertanceMultiple: 4, role: "closed-loop-diagnostic-candidate" },
] as const;

type ModelPathId = typeof MODEL_PATH_IDS[number];
type DiagnosticPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
};
type Candidate = typeof INERTANCE_CANDIDATES[number];
type CandidateId = Candidate["id"];

export type ArterialRootInertanceClosedLoopPhase5ABHealth = Pick<
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

export type ArterialRootInertanceClosedLoopPhase5ABMetrics = {
  readonly sampleCount: number;
  readonly resolvedSampleHz: number;
  readonly sampleDtSec: number | null;
  readonly measureSeconds: number | null;
  readonly CO_L: number | null;
  readonly AoPMean: number | null;
  readonly LVEDPApprox: number | null;
  readonly EF_LApprox: number | null;
  readonly SV_L: number | null;
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

export type ArterialRootInertanceClosedLoopPhase5ABComparison = {
  readonly qDotClampReductionVsCurrentAovOpen: number | null;
  readonly forwardVolumeRatioVsCurrent: number | null;
  readonly forwardDurationRatioVsCurrent: number | null;
  readonly coRatioVsCurrent: number | null;
  readonly qAoPeakRatioVsCurrent: number | null;
  readonly qAoUpstrokeRatioVsCurrent: number | null;
  readonly incisuraScoreDeltaVsCurrent: number | null;
  readonly outputPreserved: boolean;
  readonly lowerClampOutputPreserved: boolean;
  readonly positiveMorphologySignal: boolean;
  readonly classification:
    | "current-closure-reference"
    | "pareto-signal-output-preserved"
    | "clamp-lower-output-cost"
    | "no-clamp-improvement"
    | "uninterpretable-health-or-settle";
};

export type ArterialRootInertanceClosedLoopPhase5ABRun = {
  readonly pointId: string;
  readonly modelPathId: ModelPathId;
  readonly candidateId: CandidateId;
  readonly candidateRole: Candidate["role"];
  readonly sourceProviderId: string | null;
  readonly experimentalActiveSourceProvider: boolean;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly baseAoVInertanceMmHgSec2PerMl: number;
  readonly effectiveAoVInertanceMmHgSec2PerMl: number;
  readonly effectiveAoVInertanceMultiple: number;
  readonly rootInertanceMultipleOfAovL: number;
  readonly status: "measured" | "settle-failed" | "measurement-error";
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly settleActualSeconds: number | null;
  readonly projectorQuiet: boolean | null;
  readonly health: ArterialRootInertanceClosedLoopPhase5ABHealth | null;
  readonly metrics: ArterialRootInertanceClosedLoopPhase5ABMetrics | null;
  readonly comparisonVsCurrent: ArterialRootInertanceClosedLoopPhase5ABComparison | null;
  readonly errorMessage: string | null;
  readonly providerInstrumentation: {
    readonly sourceActiveStressCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
    readonly landSolveOkCount: number;
  } | null;
};

export type ArterialRootInertanceClosedLoopPhase5ABPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly stock: readonly ArterialRootInertanceClosedLoopPhase5ABRun[];
  readonly land: readonly ArterialRootInertanceClosedLoopPhase5ABRun[];
};

export type ArterialRootInertanceClosedLoopPhase5ABEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ARTERIAL_ROOT_INERTANCE_CLOSED_LOOP_PHASE5AB_ID;
  readonly phase: "Phase 5AB";
  readonly claimBoundary: "closed-loop-effective-aov-root-inertance-diagnostic-only";
  readonly upstreamPhase5AAArtifactId: typeof phase5AAArtifact.id;
  readonly verifierScript: "verify:myocardium-arterial-root-inertance-closed-loop";
  readonly protocol: {
    readonly pointSource: "phase5x-full-plus-frozen-low-preload-edge";
    readonly modelPathIds: readonly ModelPathId[];
    readonly pointCount: number;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly resolvedSampleHz: typeof SAMPLE_HZ;
    readonly dtSec: typeof DT_SEC;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly aovOpenThreshold: typeof AOV_OPEN_THRESHOLD;
    readonly qDotClampMlPerS2: typeof QDOT_CLAMP_ML_PER_S2;
    readonly closedLoopCarrier: "existing-AoV_L-effective-aov-root-boundary-inertance";
    readonly candidateSet: typeof INERTANCE_CANDIDATES;
    readonly successSignalThresholds: {
      readonly clampReductionMin: typeof CLAMP_REDUCTION_MIN;
      readonly forwardVolumeRatioMin: typeof FORWARD_VOLUME_RATIO_MIN;
      readonly forwardVolumeRatioMax: typeof FORWARD_VOLUME_RATIO_MAX;
      readonly coRatioMin: typeof CO_RATIO_MIN;
      readonly coRatioMax: typeof CO_RATIO_MAX;
      readonly durationRatioMin: typeof DURATION_RATIO_MIN;
    };
  };
  readonly points: readonly ArterialRootInertanceClosedLoopPhase5ABPoint[];
  readonly summary: {
    readonly pointCount: number;
    readonly runCount: number;
    readonly measuredRunCount: number;
    readonly healthOkRunCount: number;
    readonly landSolveFailureCount: number;
    readonly candidateComparisonCount: number;
    readonly healthOkCandidateComparisonCount: number;
    readonly paretoSignalOutputPreservedCount: number;
    readonly healthOkParetoSignalOutputPreservedCount: number;
    readonly landParetoSignalOutputPreservedCount: number;
    readonly healthOkLandParetoSignalOutputPreservedCount: number;
    readonly positiveMorphologySignalCount: number;
    readonly healthOkPositiveMorphologySignalCount: number;
    readonly nonOkOrUnmeasuredRuns: readonly {
      readonly pointId: string;
      readonly modelPathId: ModelPathId;
      readonly candidateId: CandidateId;
      readonly status: ArterialRootInertanceClosedLoopPhase5ABRun["status"];
      readonly healthStatus: SimulationHealth["status"] | null;
      readonly messages: readonly string[];
    }[];
    readonly medianParetoClampReductionFraction: number | null;
    readonly medianParetoForwardVolumeRatio: number | null;
    readonly lowPreloadAlternansEdge: {
      readonly stockCurrentPeriodBeats: number | null;
      readonly landCurrentPeriodBeats: number | null;
      readonly stockCandidatePeriodClasses: readonly string[];
      readonly landCandidatePeriodClasses: readonly string[];
      readonly interpretation: string;
    };
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
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
    readonly noZcReflectionAvailabilityClaim: true;
    readonly noValveTimingAcceptance: true;
    readonly noRootCauseAcceptance: true;
    readonly noFixAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildArterialRootInertanceClosedLoopPhase5ABEvidence():
ArterialRootInertanceClosedLoopPhase5ABEvidence {
  const diagnosticPoints = phase5ABDiagnosticPoints();
  const points = diagnosticPoints.map(buildPoint);
  const runs = points.flatMap((point) => [...point.stock, ...point.land]);
  const measuredRuns = runs.filter((run) => run.status === "measured");
  const healthOkRuns = measuredRuns.filter((run) => run.health?.status === "ok");
  const landRuns = runs.filter((run) => run.modelPathId === "developer-only-lv-land-v0");
  const candidateRuns = runs.filter((run) => run.candidateId !== "current-aov-l");
  const healthOkCandidateRuns = candidateRuns.filter((run) => run.status === "measured" && run.health?.status === "ok");
  const paretoRuns = candidateRuns.filter((run) => run.comparisonVsCurrent?.lowerClampOutputPreserved);
  const healthOkParetoRuns = paretoRuns.filter((run) => run.health?.status === "ok");
  const landParetoRuns = paretoRuns.filter((run) => run.modelPathId === "developer-only-lv-land-v0");
  const healthOkLandParetoRuns = landParetoRuns.filter((run) => run.health?.status === "ok");
  const positiveMorphologyRuns = candidateRuns.filter((run) => run.comparisonVsCurrent?.positiveMorphologySignal);
  const healthOkPositiveMorphologyRuns = positiveMorphologyRuns.filter((run) => run.health?.status === "ok");
  const nonOkOrUnmeasuredRuns = runs.filter((run) =>
    run.status !== "measured" || run.health?.status !== "ok"
  ).map((run) => ({
    pointId: run.pointId,
    modelPathId: run.modelPathId,
    candidateId: run.candidateId,
    status: run.status,
    healthStatus: run.health?.status ?? null,
    messages: run.health?.messages ?? (run.errorMessage ? [run.errorMessage] : []),
  }));
  const lowPreloadEdge = lowPreloadAlternansEdge(points);
  const evidenceWithoutHash: Omit<ArterialRootInertanceClosedLoopPhase5ABEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: ARTERIAL_ROOT_INERTANCE_CLOSED_LOOP_PHASE5AB_ID,
    phase: "Phase 5AB" as const,
    claimBoundary: "closed-loop-effective-aov-root-inertance-diagnostic-only" as const,
    upstreamPhase5AAArtifactId: phase5AAArtifact.id,
    verifierScript: "verify:myocardium-arterial-root-inertance-closed-loop" as const,
    protocol: {
      pointSource: "phase5x-full-plus-frozen-low-preload-edge" as const,
      modelPathIds: MODEL_PATH_IDS,
      pointCount: diagnosticPoints.length,
      sampleHz: SAMPLE_HZ,
      resolvedSampleHz: SAMPLE_HZ,
      dtSec: DT_SEC,
      measureBeats: MEASURE_BEATS,
      aovOpenThreshold: AOV_OPEN_THRESHOLD,
      qDotClampMlPerS2: QDOT_CLAMP_ML_PER_S2,
      closedLoopCarrier: "existing-AoV_L-effective-aov-root-boundary-inertance" as const,
      candidateSet: INERTANCE_CANDIDATES,
      successSignalThresholds: {
        clampReductionMin: CLAMP_REDUCTION_MIN,
        forwardVolumeRatioMin: FORWARD_VOLUME_RATIO_MIN,
        forwardVolumeRatioMax: FORWARD_VOLUME_RATIO_MAX,
        coRatioMin: CO_RATIO_MIN,
        coRatioMax: CO_RATIO_MAX,
        durationRatioMin: DURATION_RATIO_MIN,
      },
    },
    points,
    summary: {
      pointCount: points.length,
      runCount: runs.length,
      measuredRunCount: measuredRuns.length,
      healthOkRunCount: healthOkRuns.length,
      landSolveFailureCount: landRuns.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0),
      candidateComparisonCount: candidateRuns.length,
      healthOkCandidateComparisonCount: healthOkCandidateRuns.length,
      paretoSignalOutputPreservedCount: paretoRuns.length,
      healthOkParetoSignalOutputPreservedCount: healthOkParetoRuns.length,
      landParetoSignalOutputPreservedCount: landParetoRuns.length,
      healthOkLandParetoSignalOutputPreservedCount: healthOkLandParetoRuns.length,
      positiveMorphologySignalCount: positiveMorphologyRuns.length,
      healthOkPositiveMorphologySignalCount: healthOkPositiveMorphologyRuns.length,
      nonOkOrUnmeasuredRuns,
      medianParetoClampReductionFraction: medianOrNull(paretoRuns.map((run) =>
        run.comparisonVsCurrent?.qDotClampReductionVsCurrentAovOpen ?? null
      )),
      medianParetoForwardVolumeRatio: medianOrNull(paretoRuns.map((run) =>
        run.comparisonVsCurrent?.forwardVolumeRatioVsCurrent ?? null
      )),
      lowPreloadAlternansEdge: lowPreloadEdge,
      currentInterpretation: interpretation({
        paretoCount: paretoRuns.length,
        healthOkParetoCount: healthOkParetoRuns.length,
        landParetoCount: landParetoRuns.length,
        healthOkLandParetoCount: healthOkLandParetoRuns.length,
        positiveMorphologyCount: positiveMorphologyRuns.length,
        healthOkPositiveMorphologyCount: healthOkPositiveMorphologyRuns.length,
        candidateComparisonCount: candidateRuns.length,
        healthOkCandidateComparisonCount: healthOkCandidateRuns.length,
        nonOkOrUnmeasuredCount: nonOkOrUnmeasuredRuns.length,
      }),
      recommendedNext: [
        "if the closed-loop signal is preserved, carry only the lowest-output-preserving effective inertance region into a separate off-by-default prototype or impedance bench",
        "keep qDot clamp, valve thresholds, valve loss terms, load, preload, Tref, source-stress scale, and Land parameters fixed while interpreting this diagnostic",
        "use the low-preload edge only as bounded evidence about period sensitivity; do not convert it into final no-alternans acceptance",
        "separately attribute the Land normal-floor LVEDP blocker before any default-flip PR",
        "keep PVein_LA inertance and atrial figure-eight work in a separate filling/atrial lane",
      ],
      limitations: [
        "This is a closed-loop diagnostic sweep through the existing AoV_L inertance carrier; it is not production adoption or direct calibration of the Ao_SA edge.",
        "Changing effective AoV/root inertance can change valve timing, so Phase 5AB records valve-timing sensitivity but does not accept a valve/load candidate.",
        "The candidate set is inherited from Phase 5AA lower-inertance Pareto regions and is not a direct physical Zc estimate.",
        "No qDot clamp, valve opening threshold, valve loss, afterload, preload, Tref, source-stress, or Land parameter is tuned.",
        "The low-preload point is edge evidence against the current closure, not a final structural alternans or no-alternans claim.",
        "Incisura score is a compact positive morphology readout for this diagnostic, not an official morphology gate.",
      ],
    },
    boundary: {
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
      noZcReflectionAvailabilityClaim: true,
      noValveTimingAcceptance: true,
      noRootCauseAcceptance: true,
      noFixAcceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noClinicalScientificValidationClaim: true,
    },
    doesNotUnlock: [
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
      "ZcReflectionAvailability",
      "valveTimingAcceptance",
      "rootCauseAcceptance",
      "fixAcceptance",
      "officialMorphologyAcceptance",
      "finalNoAlternansAcceptance",
      "clinicalScientificValidationClaim",
    ],
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function phase5ABDiagnosticPoints(): readonly DiagnosticPoint[] {
  const phase5XPoints = phase5XArtifact.protocol.sweepPoints as readonly DiagnosticPoint[];
  return [...phase5XPoints, LOW_PRELOAD_ALTERNANS_EDGE];
}

function buildPoint(point: DiagnosticPoint): ArterialRootInertanceClosedLoopPhase5ABPoint {
  return {
    id: point.id,
    label: point.label,
    role: point.role,
    targetTBVMl: point.targetTBVMl,
    knobs: point.knobs,
    stock: runsWithComparisons(INERTANCE_CANDIDATES.map((candidate) =>
      runPoint(point, "stock-active-no-provider-v0", candidate)
    )),
    land: runsWithComparisons(INERTANCE_CANDIDATES.map((candidate) =>
      runPoint(point, "developer-only-lv-land-v0", candidate)
    )),
  };
}

function runPoint(
  point: DiagnosticPoint,
  modelPathId: ModelPathId,
  candidate: Candidate,
): Omit<ArterialRootInertanceClosedLoopPhase5ABRun, "comparisonVsCurrent"> {
  const instrumentation = modelPathId === "developer-only-lv-land-v0"
    ? createModelCoreLand2017LvSourceProviderInstrumentation()
    : null;
  const flag = instrumentation
    ? createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
      acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
      instrumentation,
    })
    : null;
  const doc = syntheticCaseDocument(point);
  const [instance] = caseDocumentToSimInstances(doc);
  if (!instance) throw new Error(`No synthetic instance for ${point.id}`);
  const baseAoVL = Math.max(instance.params.AoV_L ?? defaultParams().AoV_L, 1e-9);
  const effectiveAoVL = baseAoVL * candidate.totalAoVInertanceMultiple;
  const params = { ...instance.params, AoV_L: effectiveAoVL } satisfies Partial<CoreRuntimeParams>;
  const options = {
    targetTBV: point.targetTBVMl,
    dt: DT_SEC,
    sampleHz: SAMPLE_HZ,
    measureBeats: MEASURE_BEATS,
    requireProjectorQuiet: false,
    ...(flag ? { experimentalOptions: flag.experimentalOptions as ModelCoreExperimentalOptions } : {}),
  };
  const common = {
    pointId: point.id,
    modelPathId,
    candidateId: candidate.id,
    candidateRole: candidate.role,
    sourceProviderId: flag?.sourceProviderId ?? null,
    experimentalActiveSourceProvider: flag != null,
    targetTBVMl: point.targetTBVMl,
    knobs: point.knobs,
    baseAoVInertanceMmHgSec2PerMl: round(baseAoVL),
    effectiveAoVInertanceMmHgSec2PerMl: round(effectiveAoVL),
    effectiveAoVInertanceMultiple: candidate.totalAoVInertanceMultiple,
    rootInertanceMultipleOfAovL: candidate.rootInertanceMultipleOfAovL,
  };
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
        providerInstrumentation: instrumentation ? compactInstrumentation(instrumentation) : null,
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
      providerInstrumentation: instrumentation ? compactInstrumentation(instrumentation) : null,
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
      providerInstrumentation: instrumentation ? compactInstrumentation(instrumentation) : null,
    };
  }
}

function syntheticCaseDocument(point: DiagnosticPoint): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: {
      id: `phase5ab-arterial-root-${point.id}`,
      title: `Phase 5AB ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5AB ${point.label}`,
      description: "Synthetic closed-loop effective AoV/root inertance diagnostic point; not an official case.",
      modelLimitations: [
        "Closed-loop diagnostic only.",
        "No runtime default flip, qDot clamp removal, valve-threshold tuning, load tuning, Land tuning, or official-case tuning.",
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
  rawRuns: readonly Omit<ArterialRootInertanceClosedLoopPhase5ABRun, "comparisonVsCurrent">[],
): readonly ArterialRootInertanceClosedLoopPhase5ABRun[] {
  const current = rawRuns.find((run) => run.candidateId === "current-aov-l");
  return rawRuns.map((run) => ({
    ...run,
    comparisonVsCurrent: comparisonFor(run, current),
  }));
}

function comparisonFor(
  run: Omit<ArterialRootInertanceClosedLoopPhase5ABRun, "comparisonVsCurrent">,
  current: Omit<ArterialRootInertanceClosedLoopPhase5ABRun, "comparisonVsCurrent"> | undefined,
): ArterialRootInertanceClosedLoopPhase5ABComparison {
  if (run.candidateId === "current-aov-l") {
    return {
      qDotClampReductionVsCurrentAovOpen: 0,
      forwardVolumeRatioVsCurrent: 1,
      forwardDurationRatioVsCurrent: 1,
      coRatioVsCurrent: 1,
      qAoPeakRatioVsCurrent: 1,
      qAoUpstrokeRatioVsCurrent: 1,
      incisuraScoreDeltaVsCurrent: 0,
      outputPreserved: run.status === "measured" && run.health?.status === "ok",
      lowerClampOutputPreserved: false,
      positiveMorphologySignal: false,
      classification: "current-closure-reference",
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
    (forwardVolumeRatio ?? 0) >= FORWARD_VOLUME_RATIO_MIN
    && (forwardVolumeRatio ?? Infinity) <= FORWARD_VOLUME_RATIO_MAX
    && (coRatio ?? 0) >= CO_RATIO_MIN
    && (coRatio ?? Infinity) <= CO_RATIO_MAX
    && (forwardDurationRatio ?? 0) >= DURATION_RATIO_MIN;
  const lowerClampOutputPreserved =
    run.health?.status === "ok"
    && current.health?.status === "ok"
    && (qDotReduction ?? 0) >= CLAMP_REDUCTION_MIN
    && outputPreserved;
  const positiveMorphologySignal =
    outputPreserved
    && (
      (forwardDurationRatio ?? 0) >= 1.1
      || (qAoPeakRatio != null && qAoPeakRatio <= 0.9)
      || (qAoUpstrokeRatio ?? 0) >= 1.1
      || (incisuraDelta ?? 0) >= 0.05
    );
  const classification = lowerClampOutputPreserved
    ? "pareto-signal-output-preserved"
    : (qDotReduction ?? 0) >= CLAMP_REDUCTION_MIN
      ? "clamp-lower-output-cost"
      : "no-clamp-improvement";
  return {
    qDotClampReductionVsCurrentAovOpen: qDotReduction,
    forwardVolumeRatioVsCurrent: forwardVolumeRatio,
    forwardDurationRatioVsCurrent: forwardDurationRatio,
    coRatioVsCurrent: coRatio,
    qAoPeakRatioVsCurrent: qAoPeakRatio,
    qAoUpstrokeRatioVsCurrent: qAoUpstrokeRatio,
    incisuraScoreDeltaVsCurrent: incisuraDelta,
    outputPreserved,
    lowerClampOutputPreserved,
    positiveMorphologySignal,
    classification,
  };
}

function uninterpretableComparison(): ArterialRootInertanceClosedLoopPhase5ABComparison {
  return {
    qDotClampReductionVsCurrentAovOpen: null,
    forwardVolumeRatioVsCurrent: null,
    forwardDurationRatioVsCurrent: null,
    coRatioVsCurrent: null,
    qAoPeakRatioVsCurrent: null,
    qAoUpstrokeRatioVsCurrent: null,
    incisuraScoreDeltaVsCurrent: null,
    outputPreserved: false,
    lowerClampOutputPreserved: false,
    positiveMorphologySignal: false,
    classification: "uninterpretable-health-or-settle",
  };
}

function closedLoopMetrics(
  samples: readonly SimSample[],
  metrics: SimMetrics,
  measureSeconds: number,
): ArterialRootInertanceClosedLoopPhase5ABMetrics {
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
    AoPMean: finiteOrNull(metrics.AoPMean),
    LVEDPApprox: finiteOrNull(metrics.LVEDPApprox),
    EF_LApprox: finiteOrNull(metrics.EF_LApprox),
    SV_L: finiteOrNull(metrics.SV_L),
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

function lowPreloadAlternansEdge(
  points: readonly ArterialRootInertanceClosedLoopPhase5ABPoint[],
): ArterialRootInertanceClosedLoopPhase5ABEvidence["summary"]["lowPreloadAlternansEdge"] {
  const edge = points.find((point) => point.id === "low-preload-alternans-edge");
  const stockCurrent = edge?.stock.find((run) => run.candidateId === "current-aov-l");
  const landCurrent = edge?.land.find((run) => run.candidateId === "current-aov-l");
  const stockCandidateClasses = edge?.stock
    .filter((run) => run.candidateId !== "current-aov-l")
    .map(periodClass)
    ?? [];
  const landCandidateClasses = edge?.land
    .filter((run) => run.candidateId !== "current-aov-l")
    .map(periodClass)
    ?? [];
  return {
    stockCurrentPeriodBeats: stockCurrent?.health?.periodBeats ?? null,
    landCurrentPeriodBeats: landCurrent?.health?.periodBeats ?? null,
    stockCandidatePeriodClasses: stockCandidateClasses,
    landCandidatePeriodClasses: landCandidateClasses,
    interpretation: "low-preload edge is measured under the same closed-loop effective inertance sweep, but remains bounded edge evidence and does not unlock final no-alternans acceptance",
  };
}

function periodClass(run: ArterialRootInertanceClosedLoopPhase5ABRun): string {
  if (run.status !== "measured" || !run.health) return `${run.candidateId}:uninterpretable`;
  return `${run.candidateId}:period-${run.health.periodBeats ?? "unknown"}:${run.health.status}`;
}

function compactHealth(health: SimulationHealth): ArterialRootInertanceClosedLoopPhase5ABHealth {
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

function compactInstrumentation(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): NonNullable<ArterialRootInertanceClosedLoopPhase5ABRun["providerInstrumentation"]> {
  return {
    sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    landSolveOkCount: instrumentation.landSolveOkCount,
  };
}

function interpretation(args: {
  readonly paretoCount: number;
  readonly healthOkParetoCount: number;
  readonly landParetoCount: number;
  readonly healthOkLandParetoCount: number;
  readonly positiveMorphologyCount: number;
  readonly healthOkPositiveMorphologyCount: number;
  readonly candidateComparisonCount: number;
  readonly healthOkCandidateComparisonCount: number;
  readonly nonOkOrUnmeasuredCount: number;
}): string {
  if (args.healthOkParetoCount > 0) {
    const boundaryClause = args.nonOkOrUnmeasuredCount > 0
      ? ` ${args.nonOkOrUnmeasuredCount} non-ok or unmeasured runs are boundary-tracked and excluded from the health-ok headline.`
      : "";
    return `Phase 5AB closed-loop diagnostic finds ${args.healthOkParetoCount}/${args.healthOkCandidateComparisonCount} health-ok candidate comparisons with lower AoV qDot clamp engagement and preserved output, out of ${args.candidateComparisonCount} total candidate comparisons, including ${args.healthOkLandParetoCount} health-ok Land candidate comparisons. ${args.healthOkPositiveMorphologyCount} health-ok candidate comparisons show at least one positive morphology proxy (${args.positiveMorphologyCount} raw).${boundaryClause} This supports carrying a narrow effective AoV/root inertance Pareto region forward, not runtime adoption or fix acceptance.`;
  }
  if (args.paretoCount > 0) {
    return `Phase 5AB closed-loop diagnostic finds raw candidate clamp reductions, but none are health-ok output-preserved evidence. Treat the Phase 5AA offline signal as not yet closed-loop preserved.`;
  }
  return "Phase 5AB closed-loop diagnostic does not find an output-preserved effective AoV/root inertance candidate under the selected matrix.";
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

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

export function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function stableStringify(value: unknown): string {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${stableStringify(record[key])}`
  ).join(",")}}`;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/buildArterialRootInertanceClosedLoopPhase5AB.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildArterialRootInertanceClosedLoopPhase5ABEvidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), ARTERIAL_ROOT_INERTANCE_CLOSED_LOOP_PHASE5AB_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
