import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import phase5ZArtifact from "@/data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, caseDocumentToSimInstances, type CaseDocument } from "@/caseDoc";
import { DYNAMIC_FLOW_CLAMP_ML_PER_S } from "@/engine/core/topology";
import { KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";
import { measureConverged } from "@/engine/measure";
import { clamp } from "@/engine/math";
import { defaultParams, type ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import type { CoreRuntimeParams, SimSample, SimulationHealth } from "@/engine/protocol";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const ARTERIAL_ROOT_INERTANCE_BENCH_PHASE5AA_ID =
  "arterial-root-inertance-bench-phase5aa-result-v1";

export const ARTERIAL_ROOT_INERTANCE_BENCH_PHASE5AA_RESULT_PATH =
  "data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json";

const MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const SAMPLE_HZ = 240 as const;
const DT_SEC = 0.001 as const;
const MEASURE_BEATS = 3 as const;
const AOV_OPEN_THRESHOLD = 0.5 as const;
const QAO_FORWARD_EPS_ML_PER_SEC = 1e-9 as const;
const QDOT_CLAMP_ML_PER_S2 = 40000 as const;
const QDOT_HIT_EPS_ML_PER_S2 = 1e-9 as const;
const VOLUME_PRESERVATION_MIN = 0.5 as const;
const DURATION_PRESERVATION_MIN = 0.8 as const;
const CLAMP_REDUCTION_MIN = 0.25 as const;

const INERTANCE_CANDIDATES = [
  { id: "current-aov-l", rootInertanceMultipleOfAovL: 0, role: "current-replay" },
  { id: "root-l-plus-1x-aov-l", rootInertanceMultipleOfAovL: 1, role: "candidate" },
  { id: "root-l-plus-3x-aov-l", rootInertanceMultipleOfAovL: 3, role: "candidate" },
  { id: "root-l-plus-10x-aov-l", rootInertanceMultipleOfAovL: 10, role: "candidate" },
  { id: "root-l-plus-30x-aov-l", rootInertanceMultipleOfAovL: 30, role: "candidate" },
] as const;

type ModelPathId = typeof MODEL_PATH_IDS[number];
type CandidateId = typeof INERTANCE_CANDIDATES[number]["id"];

type SweepPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
};

export type ArterialRootInertanceBenchPhase5AAHealth = Pick<
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

export type ArterialRootInertanceBenchPhase5AACandidate = {
  readonly id: CandidateId;
  readonly role: "current-replay" | "candidate";
  readonly rootInertanceMultipleOfAovL: number;
  readonly totalInertanceMultipleOfAovL: number;
  readonly totalInertanceMmHgSec2PerMl: number;
  readonly sampleCount: number;
  readonly aovOpenSampleCount: number;
  readonly aovOpenDurationSecPerBeat: number | null;
  readonly forwardDurationSecPerBeat: number | null;
  readonly forwardVolumeMlPerBeat: number | null;
  readonly measuredForwardVolumeMlPerBeat: number | null;
  readonly forwardVolumeRatioVsMeasured: number | null;
  readonly forwardDurationRatioVsMeasured: number | null;
  readonly qAoPeakMlPerSec: number | null;
  readonly measuredQAoPeakMlPerSec: number | null;
  readonly qAoPeakRatioVsMeasured: number | null;
  readonly qDotRawAbsMaxMlPerS2: number | null;
  readonly qDotClampHitFractionAll: number | null;
  readonly qDotClampHitFractionAovOpen: number | null;
  readonly qDotClampImpulseAbsSumMlPerS2: number | null;
  readonly qDotClampReductionVsCurrentAovOpen: number | null;
  readonly lowerClampWithoutSevereVolumeLoss: boolean;
};

export type ArterialRootInertanceBenchPhase5AARun = {
  readonly pointId: string;
  readonly modelPathId: ModelPathId;
  readonly sourceProviderId: string | null;
  readonly experimentalActiveSourceProvider: boolean;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly settled: boolean;
  readonly health: ArterialRootInertanceBenchPhase5AAHealth;
  readonly metrics: {
    readonly CO_L: number | null;
    readonly AoPMean: number | null;
    readonly LVEDPApprox: number | null;
    readonly EF_LApprox: number | null;
    readonly SV_L: number | null;
  };
  readonly phase5ZReference: {
    readonly aovOpenQDotFraction: number | null;
    readonly aovOpenDurationSecPerBeat: number | null;
    readonly aovOpenForwardVolumeMlPerBeat: number | null;
    readonly classification: string | null;
  };
  readonly replayCandidates: readonly ArterialRootInertanceBenchPhase5AACandidate[];
  readonly bestCandidateId: CandidateId | null;
  readonly bestCandidateClampReductionFraction: number | null;
  readonly providerInstrumentation: {
    readonly sourceActiveStressCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
    readonly landSolveOkCount: number;
  } | null;
};

export type ArterialRootInertanceBenchPhase5AAPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly stock: ArterialRootInertanceBenchPhase5AARun;
  readonly land: ArterialRootInertanceBenchPhase5AARun;
};

export type ArterialRootInertanceBenchPhase5AAEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ARTERIAL_ROOT_INERTANCE_BENCH_PHASE5AA_ID;
  readonly phase: "Phase 5AA";
  readonly claimBoundary: "isolated-arterial-root-inertance-bench-diagnostic-only";
  readonly upstreamPhase5ZArtifactId: typeof phase5ZArtifact.id;
  readonly verifierScript: "verify:myocardium-arterial-root-inertance-bench";
  readonly protocol: {
    readonly pointSource: "phase5x-synthetic-user-knob-sweep";
    readonly modelPathIds: readonly ModelPathId[];
    readonly pointCount: number;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly dtSec: typeof DT_SEC;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly aovOpenThreshold: typeof AOV_OPEN_THRESHOLD;
    readonly qDotClampMlPerS2: typeof QDOT_CLAMP_ML_PER_S2;
    readonly replayEquation: "ModelCore-current-loss-AoV-replay-with-root-inertance-addition";
    readonly pressureDriver: "measured-LVP-minus-AoP-prescribed-from-current-closure";
    readonly candidateSet: typeof INERTANCE_CANDIDATES;
    readonly successSignalThresholds: {
      readonly volumePreservationMin: typeof VOLUME_PRESERVATION_MIN;
      readonly durationPreservationMin: typeof DURATION_PRESERVATION_MIN;
      readonly clampReductionMin: typeof CLAMP_REDUCTION_MIN;
    };
  };
  readonly points: readonly ArterialRootInertanceBenchPhase5AAPoint[];
  readonly summary: {
    readonly pointCount: number;
    readonly runCount: number;
    readonly settledRunCount: number;
    readonly healthOkRunCount: number;
    readonly landSolveFailureCount: number;
    readonly runsWithCandidateLowerClampWithoutSevereVolumeLoss: number;
    readonly landRunsWithCandidateLowerClampWithoutSevereVolumeLoss: number;
    readonly healthOkRunsWithCandidateLowerClampWithoutSevereVolumeLoss: number;
    readonly healthOkLandRunsWithCandidateLowerClampWithoutSevereVolumeLoss: number;
    readonly failedHealthRunsWithCandidateLowerClampWithoutSevereVolumeLoss: readonly {
      readonly pointId: string;
      readonly modelPathId: ModelPathId;
      readonly healthStatus: SimulationHealth["status"];
      readonly messages: readonly string[];
    }[];
    readonly medianCurrentReplayAovOpenClampFraction: number | null;
    readonly medianBestCandidateClampReductionFraction: number | null;
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noModelCoreEquationChange: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionRegistryIntegration: true;
    readonly noOfficialCaseWiring: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noQDotTuning: true;
    readonly noValveThresholdTuning: true;
    readonly noValveParameterTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noTrefFudge: true;
    readonly noSourceStressScaling: true;
    readonly noZcReflectionAvailabilityClaim: true;
    readonly noRootCauseAcceptance: true;
    readonly noFixAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildArterialRootInertanceBenchPhase5AAEvidence():
ArterialRootInertanceBenchPhase5AAEvidence {
  const sweepPoints = phase5XArtifact.protocol.sweepPoints as readonly SweepPoint[];
  const points = sweepPoints.map(buildPoint);
  const runs = points.flatMap((point) => [point.stock, point.land]);
  const landRuns = points.map((point) => point.land);
  const healthOkRuns = runs.filter((run) => run.health.status === "ok");
  const healthOkLandRuns = landRuns.filter((run) => run.health.status === "ok");
  const currentFractions = runs.map((run) => candidateById(run, "current-aov-l").qDotClampHitFractionAovOpen);
  const bestReductions = runs.map((run) => run.bestCandidateClampReductionFraction);
  const runsWithSignal = runs.filter(runHasLowerClampSignal).length;
  const landRunsWithSignal = landRuns.filter(runHasLowerClampSignal).length;
  const healthOkRunsWithSignal = healthOkRuns.filter(runHasLowerClampSignal).length;
  const healthOkLandRunsWithSignal = healthOkLandRuns.filter(runHasLowerClampSignal).length;
  const failedHealthRunsWithSignal = runs.filter((run) =>
    run.health.status !== "ok" && runHasLowerClampSignal(run)
  ).map((run) => ({
    pointId: run.pointId,
    modelPathId: run.modelPathId,
    healthStatus: run.health.status,
    messages: run.health.messages,
  }));
  const evidenceWithoutHash: Omit<ArterialRootInertanceBenchPhase5AAEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: ARTERIAL_ROOT_INERTANCE_BENCH_PHASE5AA_ID,
    phase: "Phase 5AA" as const,
    claimBoundary: "isolated-arterial-root-inertance-bench-diagnostic-only" as const,
    upstreamPhase5ZArtifactId: phase5ZArtifact.id,
    verifierScript: "verify:myocardium-arterial-root-inertance-bench" as const,
    protocol: {
      pointSource: "phase5x-synthetic-user-knob-sweep" as const,
      modelPathIds: MODEL_PATH_IDS,
      pointCount: sweepPoints.length,
      sampleHz: SAMPLE_HZ,
      dtSec: DT_SEC,
      measureBeats: MEASURE_BEATS,
      aovOpenThreshold: AOV_OPEN_THRESHOLD,
      qDotClampMlPerS2: QDOT_CLAMP_ML_PER_S2,
      replayEquation: "ModelCore-current-loss-AoV-replay-with-root-inertance-addition" as const,
      pressureDriver: "measured-LVP-minus-AoP-prescribed-from-current-closure" as const,
      candidateSet: INERTANCE_CANDIDATES,
      successSignalThresholds: {
        volumePreservationMin: VOLUME_PRESERVATION_MIN,
        durationPreservationMin: DURATION_PRESERVATION_MIN,
        clampReductionMin: CLAMP_REDUCTION_MIN,
      },
    },
    points,
    summary: {
      pointCount: points.length,
      runCount: runs.length,
      settledRunCount: runs.filter((run) => run.settled).length,
      healthOkRunCount: healthOkRuns.length,
      landSolveFailureCount:
        landRuns.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0),
      runsWithCandidateLowerClampWithoutSevereVolumeLoss: runsWithSignal,
      landRunsWithCandidateLowerClampWithoutSevereVolumeLoss: landRunsWithSignal,
      healthOkRunsWithCandidateLowerClampWithoutSevereVolumeLoss: healthOkRunsWithSignal,
      healthOkLandRunsWithCandidateLowerClampWithoutSevereVolumeLoss: healthOkLandRunsWithSignal,
      failedHealthRunsWithCandidateLowerClampWithoutSevereVolumeLoss: failedHealthRunsWithSignal,
      medianCurrentReplayAovOpenClampFraction: medianOrNull(currentFractions),
      medianBestCandidateClampReductionFraction: medianOrNull(bestReductions),
      currentInterpretation: interpretation({
        runsWithSignal,
        landRunsWithSignal,
        runCount: runs.length,
        landRunCount: landRuns.length,
        healthOkRunsWithSignal,
        healthOkLandRunsWithSignal,
        healthOkRunCount: healthOkRuns.length,
        healthOkLandRunCount: healthOkLandRuns.length,
        failedHealthRunsWithSignal,
      }),
      recommendedNext: [
        "use the bench result to choose a narrower arterial root/Zc/inertance candidate before any runtime equation change",
        "keep qDot and valve thresholds fixed while testing whether physical discharge-path inertance reduces clamp engagement",
        "separately attribute the Land normal-floor LVEDP blocker before any default flip",
      ],
      limitations: [
        "This is an offline prescribed-pressure replay; it does not include closed-loop pressure feedback from the candidate inertance.",
        "The replay adds effective proximal discharge inertance to the AoV/root boundary equation; it is not direct adoption or calibration of the existing Ao_SA inertance edge.",
        "Valve-open duration uses the measured AoV-open gate from the source trace; Phase 5AA does not model candidate valve timing.",
        "Candidate root inertance is a diagnostic hypothesis only, not Zc/reflection availability, root-cause acceptance, or fix acceptance.",
        "bestCandidateId is a clamp-reduction-prioritized diagnostic ranking, not a direct physical adoption choice; the next candidate should treat lower inertance values as a Pareto region against output preservation.",
        "Forward volume preservation is an anti-gaming readout, not a physiological calibration target.",
      ],
    },
    boundary: {
      noModelCoreEquationChange: true,
      noRuntimeDefaultFlip: true,
      noProductionRegistryIntegration: true,
      noOfficialCaseWiring: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noQDotTuning: true,
      noValveThresholdTuning: true,
      noValveParameterTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noTrefFudge: true,
      noSourceStressScaling: true,
      noZcReflectionAvailabilityClaim: true,
      noRootCauseAcceptance: true,
      noFixAcceptance: true,
      noOfficialMorphologyAcceptance: true,
      noClinicalScientificValidationClaim: true,
    },
    doesNotUnlock: [
      "ModelCoreEquationChange",
      "runtimeDefaultFlip",
      "productionRegistryIntegration",
      "officialCaseWiring",
      "officialCaseReauthoring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "qDotTuning",
      "valveThresholdTuning",
      "valveParameterTuning",
      "afterloadTuning",
      "preloadTuning",
      "LandParameterTuning",
      "TrefFudge",
      "sourceStressScaling",
      "ZcReflectionAvailability",
      "rootCauseAcceptance",
      "fixAcceptance",
      "officialMorphologyAcceptance",
      "clinicalScientificValidationClaim",
    ],
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function buildPoint(point: SweepPoint): ArterialRootInertanceBenchPhase5AAPoint {
  return {
    id: point.id,
    label: point.label,
    role: point.role,
    targetTBVMl: point.targetTBVMl,
    stock: runPoint(point, "stock-active-no-provider-v0"),
    land: runPoint(point, "developer-only-lv-land-v0"),
  };
}

function runPoint(point: SweepPoint, modelPathId: ModelPathId): ArterialRootInertanceBenchPhase5AARun {
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
  const measurement = measureConverged(instance.params, {
    targetTBV: point.targetTBVMl,
    dt: DT_SEC,
    sampleHz: SAMPLE_HZ,
    measureBeats: MEASURE_BEATS,
    requireProjectorQuiet: false,
    ...(flag ? { experimentalOptions: flag.experimentalOptions as ModelCoreExperimentalOptions } : {}),
  });
  const replayCandidates = replayCandidatesFor(measurement.samples, instance.params);
  const bestCandidate = bestCandidateFor(replayCandidates);
  const metrics = measurement.metrics;
  return {
    pointId: point.id,
    modelPathId,
    sourceProviderId: flag?.sourceProviderId ?? null,
    experimentalActiveSourceProvider: flag != null,
    targetTBVMl: point.targetTBVMl,
    knobs: point.knobs,
    settled: measurement.settleStatus.settled,
    health: compactHealth(measurement.health),
    metrics: {
      CO_L: finiteOrNull(metrics.CO_L),
      AoPMean: finiteOrNull(metrics.AoPMean),
      LVEDPApprox: finiteOrNull(metrics.LVEDPApprox),
      EF_LApprox: finiteOrNull(metrics.EF_LApprox),
      SV_L: finiteOrNull(metrics.SV_L),
    },
    phase5ZReference: phase5ZReferenceFor(point.id, modelPathId),
    replayCandidates,
    bestCandidateId: bestCandidate?.id ?? null,
    bestCandidateClampReductionFraction: bestCandidate?.qDotClampReductionVsCurrentAovOpen ?? null,
    providerInstrumentation: instrumentation ? compactInstrumentation(instrumentation) : null,
  };
}

function syntheticCaseDocument(point: SweepPoint): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: {
      id: `phase5aa-arterial-root-${point.id}`,
      title: `Phase 5AA ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5AA ${point.label}`,
      description: "Synthetic isolated arterial root inertance bench point; not an official case.",
      modelLimitations: [
        "Offline prescribed-pressure replay only.",
        "No ModelCore equation, qDot, valve, load, Land, or official-case tuning.",
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

function replayCandidatesFor(
  samples: readonly SimSample[],
  params: Partial<CoreRuntimeParams>,
): ArterialRootInertanceBenchPhase5AACandidate[] {
  const sanitized = { ...defaultParams(), ...params };
  const candidates = INERTANCE_CANDIDATES.map((candidate) => replayCandidate(samples, sanitized, candidate));
  const current = candidates[0];
  return candidates.map((candidate) => ({
    ...candidate,
    qDotClampReductionVsCurrentAovOpen: reduction(current.qDotClampHitFractionAovOpen, candidate.qDotClampHitFractionAovOpen),
    lowerClampWithoutSevereVolumeLoss: candidate.id !== "current-aov-l"
      && (reduction(current.qDotClampHitFractionAovOpen, candidate.qDotClampHitFractionAovOpen) ?? 0) >= CLAMP_REDUCTION_MIN
      && (candidate.forwardVolumeRatioVsMeasured ?? 0) >= VOLUME_PRESERVATION_MIN
      && (candidate.forwardDurationRatioVsMeasured ?? 0) >= DURATION_PRESERVATION_MIN,
  }));
}

function replayCandidate(
  samples: readonly SimSample[],
  params: CoreRuntimeParams,
  candidate: typeof INERTANCE_CANDIDATES[number],
): Omit<ArterialRootInertanceBenchPhase5AACandidate, "qDotClampReductionVsCurrentAovOpen" | "lowerClampWithoutSevereVolumeLoss"> {
  const dt = medianSampleDt(samples);
  const aovL = Math.max(params.AoV_L, 1e-6);
  const totalL = aovL * (1 + candidate.rootInertanceMultipleOfAovL);
  let q = finiteOrNull(samples[0]?.QAo) ?? 0;
  const qValues: number[] = [];
  const measuredQValues: number[] = [];
  const qDotRawValues: number[] = [];
  const qDotClampHitsAll: boolean[] = [];
  const qDotClampHitsAovOpen: boolean[] = [];
  const impulses: number[] = [];
  let aovOpenSamples = 0;
  let forwardSamples = 0;
  let measuredForwardSamples = 0;
  let forwardVolume = 0;
  let measuredForwardVolume = 0;

  for (const sample of samples) {
    const xi = clamp(sample.xiAoV, 0, 1);
    const aovOpen = xi > AOV_OPEN_THRESHOLD;
    const { R, B } = aovLosses(params, xi);
    let qNext = currentLossQNext(q, sample.dP_AoV, R, B, totalL, dt);
    if (params.AoV_Aleak <= 1e-9 && qNext < 0) qNext = 0;
    qNext = applyAorticFlowClamp(qNext);
    const qDotRaw = (qNext - q) / dt;
    const qDotPost = clamp(qDotRaw, -QDOT_CLAMP_ML_PER_S2, QDOT_CLAMP_ML_PER_S2);
    const impulse = qDotPost - qDotRaw;
    q = q + qDotPost * dt;

    qValues.push(q);
    measuredQValues.push(sample.QAo);
    qDotRawValues.push(qDotRaw);
    qDotClampHitsAll.push(Math.abs(impulse) > QDOT_HIT_EPS_ML_PER_S2);
    impulses.push(Math.abs(impulse));
    if (aovOpen) {
      aovOpenSamples++;
      qDotClampHitsAovOpen.push(Math.abs(impulse) > QDOT_HIT_EPS_ML_PER_S2);
      if (q > QAO_FORWARD_EPS_ML_PER_SEC) forwardSamples++;
      if (sample.QAo > QAO_FORWARD_EPS_ML_PER_SEC) measuredForwardSamples++;
      forwardVolume += Math.max(0, q) * dt;
      measuredForwardVolume += Math.max(0, sample.QAo) * dt;
    }
  }

  const forwardDuration = forwardSamples > 0 ? round(forwardSamples * dt / MEASURE_BEATS) : null;
  const measuredForwardDuration = measuredForwardSamples > 0 ? round(measuredForwardSamples * dt / MEASURE_BEATS) : null;
  const forwardVolumePerBeat = aovOpenSamples > 0 ? round(forwardVolume / MEASURE_BEATS) : null;
  const measuredVolumePerBeat = aovOpenSamples > 0 ? round(measuredForwardVolume / MEASURE_BEATS) : null;
  return {
    id: candidate.id,
    role: candidate.role,
    rootInertanceMultipleOfAovL: candidate.rootInertanceMultipleOfAovL,
    totalInertanceMultipleOfAovL: 1 + candidate.rootInertanceMultipleOfAovL,
    totalInertanceMmHgSec2PerMl: round(totalL),
    sampleCount: samples.length,
    aovOpenSampleCount: aovOpenSamples,
    aovOpenDurationSecPerBeat: aovOpenSamples > 0 ? round(aovOpenSamples * dt / MEASURE_BEATS) : null,
    forwardDurationSecPerBeat: forwardDuration,
    forwardVolumeMlPerBeat: forwardVolumePerBeat,
    measuredForwardVolumeMlPerBeat: measuredVolumePerBeat,
    forwardVolumeRatioVsMeasured: ratio(forwardVolumePerBeat, measuredVolumePerBeat),
    forwardDurationRatioVsMeasured: ratio(forwardDuration, measuredForwardDuration),
    qAoPeakMlPerSec: maxOrNull(qValues),
    measuredQAoPeakMlPerSec: maxOrNull(measuredQValues),
    qAoPeakRatioVsMeasured: ratio(maxOrNull(qValues), maxOrNull(measuredQValues)),
    qDotRawAbsMaxMlPerS2: maxOrNull(qDotRawValues.map((value) => Math.abs(value))),
    qDotClampHitFractionAll: fractionOrNull(qDotClampHitsAll, (hit) => hit),
    qDotClampHitFractionAovOpen: fractionOrNull(qDotClampHitsAovOpen, (hit) => hit),
    qDotClampImpulseAbsSumMlPerS2: impulses.length > 0
      ? round(impulses.reduce((sum, value) => sum + value, 0))
      : null,
  };
}

function aovLosses(params: CoreRuntimeParams, xi: number): { readonly R: number; readonly B: number } {
  const valveArea = Math.max(params.AoV_Aleak + xi * (params.AoV_Amax - params.AoV_Aleak), 1e-4);
  const areaRatio = valveArea / Math.max(params.AoV_Aref, 1e-6);
  const areaLoss = Math.pow(Math.max(areaRatio, 1e-4), -2);
  return {
    R: Math.max(params.AoV_R * areaLoss, 1e-8),
    B: Math.max(params.AoV_B * areaLoss, 0),
  };
}

function currentLossQNext(q: number, dP: number, R: number, B: number, L: number, h: number): number {
  const reff = R + B * Math.abs(q);
  return (q + (h / L) * dP) / (1 + (h * reff) / L);
}

function applyAorticFlowClamp(value: number): number {
  return clamp(value, -DYNAMIC_FLOW_CLAMP_ML_PER_S, DYNAMIC_FLOW_CLAMP_ML_PER_S);
}

function bestCandidateFor(
  candidates: readonly ArterialRootInertanceBenchPhase5AACandidate[],
): ArterialRootInertanceBenchPhase5AACandidate | null {
  const viable = candidates
    .filter((candidate) => candidate.lowerClampWithoutSevereVolumeLoss)
    .sort((a, b) =>
      (b.qDotClampReductionVsCurrentAovOpen ?? -Infinity) - (a.qDotClampReductionVsCurrentAovOpen ?? -Infinity)
    );
  return viable[0] ?? null;
}

function runHasLowerClampSignal(run: ArterialRootInertanceBenchPhase5AARun): boolean {
  return run.replayCandidates.some((candidate) => candidate.lowerClampWithoutSevereVolumeLoss);
}

function candidateById(
  run: ArterialRootInertanceBenchPhase5AARun,
  id: CandidateId,
): ArterialRootInertanceBenchPhase5AACandidate {
  const candidate = run.replayCandidates.find((entry) => entry.id === id);
  if (!candidate) throw new Error(`Missing candidate ${id}`);
  return candidate;
}

function phase5ZReferenceFor(
  pointId: string,
  modelPathId: ModelPathId,
): ArterialRootInertanceBenchPhase5AARun["phase5ZReference"] {
  const point = phase5ZArtifact.points.find((candidate) => candidate.id === pointId);
  if (!point) throw new Error(`Missing Phase 5Z point ${pointId}`);
  const run = modelPathId === "developer-only-lv-land-v0" ? point.land : point.stock;
  const aovOpen = run.windows.find((window) => window.id === "aov-open");
  return {
    aovOpenQDotFraction: aovOpen?.rawPostDivergenceHitFraction ?? null,
    aovOpenDurationSecPerBeat: aovOpen?.durationSec ?? null,
    aovOpenForwardVolumeMlPerBeat: aovOpen?.forwardVolumeMl ?? null,
    classification: modelPathId === "developer-only-lv-land-v0" ? point.classification : null,
  };
}

function compactHealth(health: SimulationHealth): ArterialRootInertanceBenchPhase5AAHealth {
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
): NonNullable<ArterialRootInertanceBenchPhase5AARun["providerInstrumentation"]> {
  return {
    sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    landSolveOkCount: instrumentation.landSolveOkCount,
  };
}

function interpretation(args: {
  readonly runsWithSignal: number;
  readonly landRunsWithSignal: number;
  readonly runCount: number;
  readonly landRunCount: number;
  readonly healthOkRunsWithSignal: number;
  readonly healthOkLandRunsWithSignal: number;
  readonly healthOkRunCount: number;
  readonly healthOkLandRunCount: number;
  readonly failedHealthRunsWithSignal: readonly {
    readonly pointId: string;
    readonly modelPathId: ModelPathId;
    readonly healthStatus: SimulationHealth["status"];
  }[];
}): string {
  if (args.healthOkRunsWithSignal > 0) {
    const failedHealthClause = args.failedHealthRunsWithSignal.length > 0
      ? ` Raw replay signal is ${args.runsWithSignal}/${args.runCount}, but failed-health runs are tracked separately (${args.failedHealthRunsWithSignal.map((run) => `${run.modelPathId}:${run.pointId}:${run.healthStatus}`).join(", ")}).`
      : "";
    return `Phase 5AA offline replay identifies ${args.healthOkRunsWithSignal}/${args.healthOkRunCount} health-ok stock/Land runs, including ${args.healthOkLandRunsWithSignal}/${args.healthOkLandRunCount} health-ok Land runs, where an added root inertance candidate lowers AoV qDot clamp engagement without severe forward-volume or duration loss.${failedHealthClause} This supports a narrower arterial root/Zc/inertance candidate bench next, not runtime adoption.`;
  }
  return "Phase 5AA offline replay did not find an added root inertance candidate that lowers AoV qDot clamp engagement without severe forward-volume or duration loss under the prescribed-pressure protocol.";
}

function medianSampleDt(samples: readonly SimSample[]): number {
  if (samples.length < 2) return DT_SEC;
  const deltas = samples.slice(1)
    .map((sample, index) => sample.t - samples[index].t)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (deltas.length === 0) return DT_SEC;
  return deltas[Math.floor(deltas.length / 2)];
}

function reduction(current: number | null, candidate: number | null): number | null {
  if (current == null || candidate == null || current <= 0) return null;
  return round((current - candidate) / current);
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator <= 0) return null;
  return round(numerator / denominator);
}

function fractionOrNull<T>(values: readonly T[], predicate: (value: T) => boolean): number | null {
  if (values.length === 0) return null;
  return round(values.filter(predicate).length / values.length);
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

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
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
  const normalizedScriptPath = path.normalize("tools/myocardium/buildArterialRootInertanceBenchPhase5AA.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildArterialRootInertanceBenchPhase5AAEvidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), ARTERIAL_ROOT_INERTANCE_BENCH_PHASE5AA_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
