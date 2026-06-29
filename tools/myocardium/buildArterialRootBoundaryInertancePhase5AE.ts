import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5ADArtifact from "@/data/myocardium/protocols/arterial-root-zc-prototype-smoke-phase5ad-result-v1.json";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, caseDocumentToSimInstances, type CaseDocument } from "@/caseDoc";
import { KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import { buildEdges } from "@/engine/core/topology";
import {
  defaultParams,
  type ModelCoreExperimentalBoundaryRootInertanceDiagnostics,
  type ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const ARTERIAL_ROOT_BOUNDARY_INERTANCE_PHASE5AE_ID =
  "arterial-root-boundary-inertance-phase5ae-result-v1";

export const ARTERIAL_ROOT_BOUNDARY_INERTANCE_PHASE5AE_RESULT_PATH =
  "data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json";

const MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const SAMPLE_HZ = 1000 as const;
const DT_SEC = 0.001 as const;
const MEASURE_BEATS = 3 as const;
const AOV_OPEN_THRESHOLD = 0.5 as const;
const QAO_FORWARD_EPS_ML_PER_SEC = 1e-9 as const;
const QDOT_CLAMP_ML_PER_S2 = 40000 as const;
const CLAMP_REDUCTION_MIN = 0.25 as const;
const FORWARD_VOLUME_RATIO_MIN = 0.75 as const;
const FORWARD_VOLUME_RATIO_MAX = 1.25 as const;
const CO_RATIO_MIN = 0.75 as const;
const CO_RATIO_MAX = 1.25 as const;
const DURATION_RATIO_MIN = 0.75 as const;
const SELECTED_POINT_IDS = ["normal-floor", "hr90", "arterial-stiffness-high"] as const;
const BOUNDARY_ROOT_MECHANISM_ID =
  "phase5ae-experimental-aortic-boundary-root-inertance-v1" as const;

const LOW_PRELOAD_ALTERNANS_EDGE = {
  id: "low-preload-alternans-edge",
  label: "low preload alternans edge",
  role: "frozen-low-preload-edge",
  targetTBVMl: 4350,
  knobs: {},
} as const;

const PROTOTYPE_CANDIDATES = [
  {
    id: "current-closure",
    role: "current-closure",
    aovBoundaryInertanceMultiple: 1,
    aoSaInertanceMultiple: 1,
    boundaryRootAdditionalMultipleOfAoVL: 0,
  },
  {
    id: "aov-boundary-l-2x-reference",
    role: "phase5ad-aov-boundary-carrier-reference",
    aovBoundaryInertanceMultiple: 2,
    aoSaInertanceMultiple: 1,
    boundaryRootAdditionalMultipleOfAoVL: 0,
  },
  {
    id: "aosa-l-1p5x-prototype",
    role: "off-by-default-direct-aosa-prototype",
    aovBoundaryInertanceMultiple: 1,
    aoSaInertanceMultiple: 1.5,
    boundaryRootAdditionalMultipleOfAoVL: 0,
  },
  {
    id: "aosa-l-2x-prototype",
    role: "off-by-default-direct-aosa-prototype",
    aovBoundaryInertanceMultiple: 1,
    aoSaInertanceMultiple: 2,
    boundaryRootAdditionalMultipleOfAoVL: 0,
  },
  {
    id: "combined-aov2-aosa1p5-prototype",
    role: "off-by-default-combined-boundary-aosa-prototype",
    aovBoundaryInertanceMultiple: 2,
    aoSaInertanceMultiple: 1.5,
    boundaryRootAdditionalMultipleOfAoVL: 0,
  },
  {
    id: "boundary-root-l-plus-1x-aov-l-mechanism",
    role: "experimental-boundary-root-inertance-mechanism",
    aovBoundaryInertanceMultiple: 1,
    aoSaInertanceMultiple: 1,
    boundaryRootAdditionalMultipleOfAoVL: 1,
  },
] as const;

export type ArterialRootBoundaryInertancePhase5AEModelPathId = typeof MODEL_PATH_IDS[number];
export type ArterialRootBoundaryInertancePhase5AECandidate = typeof PROTOTYPE_CANDIDATES[number];
type ModelPathId = ArterialRootBoundaryInertancePhase5AEModelPathId;
type Candidate = ArterialRootBoundaryInertancePhase5AECandidate;
type CandidateId = Candidate["id"];
type CandidateRole = Candidate["role"];
export type ArterialRootBoundaryInertancePhase5AEDiagnosticPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
};
type DiagnosticPoint = ArterialRootBoundaryInertancePhase5AEDiagnosticPoint;

export type ArterialRootBoundaryInertancePhase5AEHealth = Pick<
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

export type ArterialRootBoundaryInertancePhase5AEMetrics = {
  readonly sampleCount: number;
  readonly resolvedSampleHz: typeof SAMPLE_HZ;
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

export type ArterialRootBoundaryInertancePhase5AEComparison = {
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
    | "candidate-signal-output-preserved"
    | "candidate-lower-clamp-output-cost"
    | "no-clamp-improvement"
    | "uninterpretable-health-or-settle";
};

export type ArterialRootBoundaryInertancePhase5AERun = {
  readonly pointId: string;
  readonly modelPathId: ModelPathId;
  readonly candidateId: CandidateId;
  readonly candidateRole: CandidateRole;
  readonly sourceProviderId: string | null;
  readonly experimentalActiveSourceProvider: boolean;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly baseAoVInertanceMmHgSec2PerMl: number;
  readonly effectiveAoVInertanceMmHgSec2PerMl: number;
  readonly aovBoundaryInertanceMultiple: number;
  readonly boundaryRootAdditionalInertanceMmHgSec2PerMl: number;
  readonly boundaryRootAdditionalMultipleOfAoVL: number;
  readonly experimentalBoundaryRootInertance: ModelCoreExperimentalBoundaryRootInertanceDiagnostics | null;
  readonly baseAoSAInertanceMmHgSec2PerMl: number;
  readonly effectiveAoSAInertanceMmHgSec2PerMl: number;
  readonly aoSaInertanceMultiple: number;
  readonly parameterization:
    | "current-closure"
    | "aov-boundary-carrier-reference"
    | "direct-aosa-edge-override-only"
    | "combined-aov-boundary-and-aosa-edge-override"
    | "experimental-boundary-root-inertance-mechanism";
  readonly edgeOverrides: Record<string, Record<string, number>> | null;
  readonly status: "measured" | "settle-failed" | "measurement-error";
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly settleActualSeconds: number | null;
  readonly projectorQuiet: boolean | null;
  readonly health: ArterialRootBoundaryInertancePhase5AEHealth | null;
  readonly metrics: ArterialRootBoundaryInertancePhase5AEMetrics | null;
  readonly comparisonVsCurrent: ArterialRootBoundaryInertancePhase5AEComparison | null;
  readonly errorMessage: string | null;
  readonly providerInstrumentation: {
    readonly sourceActiveStressCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
    readonly landSolveOkCount: number;
  } | null;
};

export type ArterialRootBoundaryInertancePhase5AEPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly stock: readonly ArterialRootBoundaryInertancePhase5AERun[];
  readonly land: readonly ArterialRootBoundaryInertancePhase5AERun[];
};

export type ArterialRootBoundaryInertancePhase5AEEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ARTERIAL_ROOT_BOUNDARY_INERTANCE_PHASE5AE_ID;
  readonly phase: "Phase 5AE";
  readonly claimBoundary: "experimental-boundary-root-inertance-diagnostic-only";
  readonly upstreamPhase5ADArtifactId: typeof phase5ADArtifact.id;
  readonly verifierScript: "verify:myocardium-arterial-root-boundary-inertance";
  readonly protocol: {
    readonly pointSource: "phase5x-selected-plus-frozen-low-preload-edge";
    readonly modelPathIds: typeof MODEL_PATH_IDS;
    readonly selectedPointIds: typeof SELECTED_POINT_IDS;
    readonly pointCount: number;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly dtSec: typeof DT_SEC;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly aovOpenThreshold: typeof AOV_OPEN_THRESHOLD;
    readonly qDotClampMlPerS2: typeof QDOT_CLAMP_ML_PER_S2;
    readonly candidateSet: typeof PROTOTYPE_CANDIDATES;
    readonly successSignalThresholds: {
      readonly clampReductionMin: typeof CLAMP_REDUCTION_MIN;
      readonly forwardVolumeRatioMin: typeof FORWARD_VOLUME_RATIO_MIN;
      readonly forwardVolumeRatioMax: typeof FORWARD_VOLUME_RATIO_MAX;
      readonly coRatioMin: typeof CO_RATIO_MIN;
      readonly coRatioMax: typeof CO_RATIO_MAX;
      readonly durationRatioMin: typeof DURATION_RATIO_MIN;
    };
  };
  readonly points: readonly ArterialRootBoundaryInertancePhase5AEPoint[];
  readonly summary: {
    readonly pointCount: number;
    readonly runCount: number;
    readonly measuredRunCount: number;
    readonly healthOkRunCount: number;
    readonly landSolveFailureCount: number;
    readonly candidateComparisonCount: number;
    readonly healthOkCandidateComparisonCount: number;
    readonly aovBoundaryReferenceSignalCount: number;
    readonly healthOkAovBoundaryReferenceSignalCount: number;
    readonly directAoSaOnlySignalCount: number;
    readonly healthOkDirectAoSaOnlySignalCount: number;
    readonly combinedSignalCount: number;
    readonly healthOkCombinedSignalCount: number;
    readonly boundaryRootMechanismSignalCount: number;
    readonly healthOkBoundaryRootMechanismSignalCount: number;
    readonly carrierMechanismMatchCount: number;
    readonly healthOkCarrierMechanismMatchCount: number;
    readonly nonOkOrUnmeasuredRuns: readonly {
      readonly pointId: string;
      readonly modelPathId: ModelPathId;
      readonly candidateId: CandidateId;
      readonly status: ArterialRootBoundaryInertancePhase5AERun["status"];
      readonly healthStatus: SimulationHealth["status"] | null;
      readonly messages: readonly string[];
    }[];
    readonly prototypeAssessment: {
      readonly directAoSaOnly: "not-supported-by-phase5ae-smoke" | "supported-diagnostic-only";
      readonly aovBoundaryCarrierReference: "signal-present-diagnostic-only" | "no-signal";
      readonly combinedPrototype: "not-robust" | "signal-present-diagnostic-only";
      readonly boundaryRootMechanism: "matches-carrier-diagnostic-only" | "diverged-from-carrier" | "no-signal";
    };
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly boundary: {
    readonly noProductionModelCoreEquationChange: true;
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
    readonly noPhysicalZcCalibrationClaim: true;
    readonly noReflectionCoefficientClaim: true;
    readonly noRootCauseAcceptance: true;
    readonly noFixAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

export function buildArterialRootBoundaryInertancePhase5AEEvidence():
ArterialRootBoundaryInertancePhase5AEEvidence {
  const points = diagnosticPoints().map(buildPoint);
  const runs = points.flatMap((point) => [...point.stock, ...point.land]);
  const candidateRuns = runs.filter((run) => run.candidateId !== "current-closure");
  const healthOkRuns = runs.filter(isMeasuredHealthOk);
  const healthOkCandidateRuns = candidateRuns.filter(isMeasuredHealthOk);
  const aovBoundaryRuns = candidateRuns.filter((run) => run.candidateRole === "phase5ad-aov-boundary-carrier-reference");
  const directAoSaRuns = candidateRuns.filter((run) => run.candidateRole === "off-by-default-direct-aosa-prototype");
  const combinedRuns = candidateRuns.filter((run) => run.candidateRole === "off-by-default-combined-boundary-aosa-prototype");
  const boundaryRootRuns = candidateRuns.filter((run) => run.candidateRole === "experimental-boundary-root-inertance-mechanism");
  const aovBoundarySignal = signalCount(aovBoundaryRuns);
  const healthOkAovBoundarySignal = signalCount(aovBoundaryRuns.filter(isMeasuredHealthOk));
  const directAoSaSignal = signalCount(directAoSaRuns);
  const healthOkDirectAoSaSignal = signalCount(directAoSaRuns.filter(isMeasuredHealthOk));
  const combinedSignal = signalCount(combinedRuns);
  const healthOkCombinedSignal = signalCount(combinedRuns.filter(isMeasuredHealthOk));
  const boundaryRootSignal = signalCount(boundaryRootRuns);
  const healthOkBoundaryRootSignal = signalCount(boundaryRootRuns.filter(isMeasuredHealthOk));
  const carrierMechanismMatchCount = carrierMechanismMatchCountFor(points, false);
  const healthOkCarrierMechanismMatchCount = carrierMechanismMatchCountFor(points, true);
  const nonOkOrUnmeasuredRuns = runs
    .filter((run) => run.status !== "measured" || run.health?.status !== "ok")
    .map((run) => ({
      pointId: run.pointId,
      modelPathId: run.modelPathId,
      candidateId: run.candidateId,
      status: run.status,
      healthStatus: run.health?.status ?? null,
      messages: run.health?.messages ?? (run.errorMessage ? [run.errorMessage] : []),
    }));
  const prototypeAssessment = {
    directAoSaOnly: healthOkDirectAoSaSignal > 0
      ? "supported-diagnostic-only" as const
      : "not-supported-by-phase5ae-smoke" as const,
    aovBoundaryCarrierReference: healthOkAovBoundarySignal > 0
      ? "signal-present-diagnostic-only" as const
      : "no-signal" as const,
    combinedPrototype: healthOkCombinedSignal > 0 && combinedRuns.every((run) => run.status === "measured")
      ? "signal-present-diagnostic-only" as const
      : "not-robust" as const,
    boundaryRootMechanism: healthOkBoundaryRootSignal === 0
      ? "no-signal" as const
      : healthOkBoundaryRootSignal === healthOkAovBoundarySignal
        && healthOkCarrierMechanismMatchCount >= healthOkBoundaryRootSignal
        ? "matches-carrier-diagnostic-only" as const
        : "diverged-from-carrier" as const,
  };
  const evidenceWithoutHash: Omit<ArterialRootBoundaryInertancePhase5AEEvidence, "normalizedSha256"> = {
    schemaVersion: 1 as const,
    id: ARTERIAL_ROOT_BOUNDARY_INERTANCE_PHASE5AE_ID,
    phase: "Phase 5AE" as const,
    claimBoundary: "experimental-boundary-root-inertance-diagnostic-only" as const,
    upstreamPhase5ADArtifactId: phase5ADArtifact.id,
    verifierScript: "verify:myocardium-arterial-root-boundary-inertance" as const,
    protocol: {
      pointSource: "phase5x-selected-plus-frozen-low-preload-edge" as const,
      modelPathIds: MODEL_PATH_IDS,
      selectedPointIds: SELECTED_POINT_IDS,
      pointCount: points.length,
      sampleHz: SAMPLE_HZ,
      dtSec: DT_SEC,
      measureBeats: MEASURE_BEATS,
      aovOpenThreshold: AOV_OPEN_THRESHOLD,
      qDotClampMlPerS2: QDOT_CLAMP_ML_PER_S2,
      candidateSet: PROTOTYPE_CANDIDATES,
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
      measuredRunCount: runs.filter((run) => run.status === "measured").length,
      healthOkRunCount: healthOkRuns.length,
      landSolveFailureCount: runs.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0),
      candidateComparisonCount: candidateRuns.length,
      healthOkCandidateComparisonCount: healthOkCandidateRuns.length,
      aovBoundaryReferenceSignalCount: aovBoundarySignal,
      healthOkAovBoundaryReferenceSignalCount: healthOkAovBoundarySignal,
      directAoSaOnlySignalCount: directAoSaSignal,
      healthOkDirectAoSaOnlySignalCount: healthOkDirectAoSaSignal,
      combinedSignalCount: combinedSignal,
      healthOkCombinedSignalCount: healthOkCombinedSignal,
      boundaryRootMechanismSignalCount: boundaryRootSignal,
      healthOkBoundaryRootMechanismSignalCount: healthOkBoundaryRootSignal,
      carrierMechanismMatchCount,
      healthOkCarrierMechanismMatchCount,
      nonOkOrUnmeasuredRuns,
      prototypeAssessment,
      currentInterpretation: interpretation({
        aovBoundarySignal: healthOkAovBoundarySignal,
        boundaryRootSignal: healthOkBoundaryRootSignal,
        carrierMechanismMatchCount: healthOkCarrierMechanismMatchCount,
        directAoSaSignal: healthOkDirectAoSaSignal,
        combinedSignal: healthOkCombinedSignal,
        nonOkOrUnmeasuredCount: nonOkOrUnmeasuredRuns.length,
      }),
      recommendedNext: [
        "do not adopt direct Ao_SA.L as the root/Zc fix from Phase 5AE smoke evidence",
        "carry the experimental boundary/root inertance mechanism only as off-by-default diagnostic evidence until sourced Zc calibration exists",
        "run sourced physiological Zc calibration before any production/default root/Zc adoption",
        "keep PVein_LA/filling inertance and atrial figure-eight work separate",
      ],
      limitations: [
        "This is a selected-point smoke diagnostic, not the full Phase 5X matrix.",
        "Candidates are off-by-default diagnostic paths only; no production registry, Workbench, or runtime UI path is wired.",
        "The AoV-boundary candidate remains the Phase 5AB carrier reference and is not physical adoption.",
        "The boundary/root inertance mechanism uses the existing AoV flow state as an experimental series-inertance hook, not a new topology edge or state-layout change.",
        "Direct Ao_SA.L edge overrides are tested as prototype smoke only and are not direct Ao_SA adoption.",
        "qDot clamps, valve thresholds, valve loss terms, load/preload, Tref, source-stress scale, and Land parameters are fixed.",
      ],
    },
    boundary: {
      noProductionModelCoreEquationChange: true,
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
      noPhysicalZcCalibrationClaim: true,
      noReflectionCoefficientClaim: true,
      noRootCauseAcceptance: true,
      noFixAcceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noClinicalScientificValidationClaim: true,
    },
    doesNotUnlock: [
      "productionModelCoreEquationChange",
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
      "physicalZcCalibrationClaim",
      "reflectionCoefficientClaim",
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

function diagnosticPoints(): readonly DiagnosticPoint[] {
  const sweepPoints = phase5XArtifact.protocol.sweepPoints as readonly DiagnosticPoint[];
  const selected = sweepPoints.filter((point) => (SELECTED_POINT_IDS as readonly string[]).includes(point.id));
  return [...selected, LOW_PRELOAD_ALTERNANS_EDGE];
}

function buildPoint(point: DiagnosticPoint): ArterialRootBoundaryInertancePhase5AEPoint {
  return {
    id: point.id,
    label: point.label,
    role: point.role,
    targetTBVMl: point.targetTBVMl,
    knobs: point.knobs,
    stock: runsWithComparisons(PROTOTYPE_CANDIDATES.map((candidate) =>
      runArterialRootBoundaryInertancePoint(point, "stock-active-no-provider-v0", candidate)
    )),
    land: runsWithComparisons(PROTOTYPE_CANDIDATES.map((candidate) =>
      runArterialRootBoundaryInertancePoint(point, "developer-only-lv-land-v0", candidate)
    )),
  };
}

export function runArterialRootBoundaryInertancePoint(
  point: DiagnosticPoint,
  modelPathId: ModelPathId,
  candidate: Candidate,
): Omit<ArterialRootBoundaryInertancePhase5AERun, "comparisonVsCurrent"> {
  const instrumentation = modelPathId === "developer-only-lv-land-v0"
    ? createModelCoreLand2017LvSourceProviderInstrumentation()
    : null;
  const flag = instrumentation
    ? createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
      acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
      instrumentation,
    })
    : null;
  const [instance] = caseDocumentToSimInstances(syntheticCaseDocument(point));
  if (!instance) throw new Error(`No synthetic instance for ${point.id}`);
  const baseAoVL = Math.max(instance.params.AoV_L ?? defaultParams().AoV_L, 1e-9);
  const baseAoSaL = baseAoSAInertance();
  const parameterAoVL = baseAoVL * candidate.aovBoundaryInertanceMultiple;
  const boundaryRootAdditionalL = baseAoVL * candidate.boundaryRootAdditionalMultipleOfAoVL;
  const effectiveAoVL = parameterAoVL + boundaryRootAdditionalL;
  const effectiveAoSaL = baseAoSaL * candidate.aoSaInertanceMultiple;
  const edgeOverrides = candidate.aoSaInertanceMultiple === 1
    ? null
    : { ...(instance.params.edgeOverrides ?? {}), Ao_SA: { L: effectiveAoSaL } };
  const params = {
    ...instance.params,
    AoV_L: parameterAoVL,
    ...(edgeOverrides ? { edgeOverrides } : {}),
  } satisfies Partial<CoreRuntimeParams>;
  const experimentalOptions = {
    ...(flag?.experimentalOptions ?? {}),
    ...(boundaryRootAdditionalL > 0
      ? {
        boundaryRootInertance: {
          mechanismId: BOUNDARY_ROOT_MECHANISM_ID,
          additionalAorticRootInertanceMmHgSec2PerMl: boundaryRootAdditionalL,
        },
      }
      : {}),
  } satisfies ModelCoreExperimentalOptions;
  const options = {
    targetTBV: point.targetTBVMl,
    dt: DT_SEC,
    sampleHz: SAMPLE_HZ,
    measureBeats: MEASURE_BEATS,
    requireProjectorQuiet: false,
    ...((flag || boundaryRootAdditionalL > 0) ? { experimentalOptions } : {}),
  };
  const experimentalBoundaryRootInertance = boundaryRootAdditionalL > 0
    ? {
      mechanismId: BOUNDARY_ROOT_MECHANISM_ID,
      targetValve: "AoV" as const,
      baseAoVInertanceMmHgSec2PerMl: round(baseAoVL),
      additionalAorticRootInertanceMmHgSec2PerMl: round(boundaryRootAdditionalL),
      effectiveAoVBoundaryRootInertanceMmHgSec2PerMl: round(effectiveAoVL),
    } satisfies ModelCoreExperimentalBoundaryRootInertanceDiagnostics
    : null;
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
    aovBoundaryInertanceMultiple: candidate.aovBoundaryInertanceMultiple,
    boundaryRootAdditionalInertanceMmHgSec2PerMl: round(boundaryRootAdditionalL),
    boundaryRootAdditionalMultipleOfAoVL: candidate.boundaryRootAdditionalMultipleOfAoVL,
    experimentalBoundaryRootInertance,
    baseAoSAInertanceMmHgSec2PerMl: round(baseAoSaL),
    effectiveAoSAInertanceMmHgSec2PerMl: round(effectiveAoSaL),
    aoSaInertanceMultiple: candidate.aoSaInertanceMultiple,
    parameterization: parameterization(candidate),
    edgeOverrides,
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
      id: `phase5ae-root-zc-prototype-${point.id}`,
      title: `Phase 5AE ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5AE ${point.label}`,
      description: "Synthetic experimental boundary/root inertance smoke point; not an official case.",
      modelLimitations: [
        "Smoke diagnostic only.",
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

export function runsWithComparisons(
  rawRuns: readonly Omit<ArterialRootBoundaryInertancePhase5AERun, "comparisonVsCurrent">[],
): readonly ArterialRootBoundaryInertancePhase5AERun[] {
  const current = rawRuns.find((run) => run.candidateId === "current-closure");
  return rawRuns.map((run) => ({
    ...run,
    comparisonVsCurrent: comparisonFor(run, current),
  }));
}

function comparisonFor(
  run: Omit<ArterialRootBoundaryInertancePhase5AERun, "comparisonVsCurrent">,
  current: Omit<ArterialRootBoundaryInertancePhase5AERun, "comparisonVsCurrent"> | undefined,
): ArterialRootBoundaryInertancePhase5AEComparison {
  if (run.candidateId === "current-closure") {
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
    isMeasuredHealthOk(run)
    && isMeasuredHealthOk(current)
    && (qDotReduction ?? 0) >= CLAMP_REDUCTION_MIN
    && outputPreserved;
  const positiveMorphologySignal =
    isMeasuredHealthOk(run)
    && isMeasuredHealthOk(current)
    && outputPreserved
    && (
      (forwardDurationRatio ?? 0) >= 1.1
      || (qAoPeakRatio != null && qAoPeakRatio <= 0.9)
      || (qAoUpstrokeRatio ?? 0) >= 1.1
      || (incisuraDelta ?? 0) >= 0.05
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
    lowerClampOutputPreserved,
    positiveMorphologySignal,
    classification: lowerClampOutputPreserved
      ? "candidate-signal-output-preserved"
      : (qDotReduction ?? 0) >= CLAMP_REDUCTION_MIN
        ? "candidate-lower-clamp-output-cost"
        : "no-clamp-improvement",
  };
}

function uninterpretableComparison(): ArterialRootBoundaryInertancePhase5AEComparison {
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
): ArterialRootBoundaryInertancePhase5AEMetrics {
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

function compactHealth(health: SimulationHealth): ArterialRootBoundaryInertancePhase5AEHealth {
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
): NonNullable<ArterialRootBoundaryInertancePhase5AERun["providerInstrumentation"]> {
  return {
    sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    landSolveOkCount: instrumentation.landSolveOkCount,
  };
}

function signalCount(runs: readonly ArterialRootBoundaryInertancePhase5AERun[]): number {
  return runs.filter((run) => run.comparisonVsCurrent?.lowerClampOutputPreserved).length;
}

function carrierMechanismMatchCountFor(
  points: readonly ArterialRootBoundaryInertancePhase5AEPoint[],
  healthOkOnly: boolean,
): number {
  let count = 0;
  for (const point of points) {
    for (const side of ["stock", "land"] as const) {
      const carrier = point[side].find((run) => run.candidateId === "aov-boundary-l-2x-reference");
      const mechanism = point[side].find((run) => run.candidateId === "boundary-root-l-plus-1x-aov-l-mechanism");
      if (!carrier || !mechanism) continue;
      if (healthOkOnly && (!isMeasuredHealthOk(carrier) || !isMeasuredHealthOk(mechanism))) continue;
      if (runsMatch(carrier, mechanism)) count++;
    }
  }
  return count;
}

function runsMatch(
  left: ArterialRootBoundaryInertancePhase5AERun,
  right: ArterialRootBoundaryInertancePhase5AERun,
): boolean {
  if (left.status !== right.status || left.health?.status !== right.health?.status) return false;
  if (left.metrics == null || right.metrics == null) return left.metrics === right.metrics;
  const metricKeys = [
    "CO_L",
    "AoPMean",
    "LVEDPApprox",
    "EF_LApprox",
    "SV_L",
    "aovOpenDurationSecPerBeat",
    "forwardDurationSecPerBeat",
    "forwardVolumeMlPerBeat",
    "qAoPeakMlPerSec",
    "qAoUpstrokeTimeToPeakSecPerBeat",
    "qDotClampHitFractionAovOpen",
    "incisuraCandidateScore",
  ] as const;
  return metricKeys.every((key) => nearlyEqual(left.metrics?.[key] ?? null, right.metrics?.[key] ?? null))
    && left.comparisonVsCurrent?.classification === right.comparisonVsCurrent?.classification
    && left.comparisonVsCurrent?.lowerClampOutputPreserved === right.comparisonVsCurrent?.lowerClampOutputPreserved
    && left.comparisonVsCurrent?.positiveMorphologySignal === right.comparisonVsCurrent?.positiveMorphologySignal;
}

function nearlyEqual(left: number | null, right: number | null): boolean {
  if (left == null || right == null) return left === right;
  return Math.abs(left - right) <= 1e-9;
}

function isMeasuredHealthOk(
  run: Pick<ArterialRootBoundaryInertancePhase5AERun, "status" | "health"> | undefined,
): boolean {
  return run?.status === "measured" && run.health?.status === "ok";
}

function interpretation(args: {
  readonly aovBoundarySignal: number;
  readonly boundaryRootSignal: number;
  readonly carrierMechanismMatchCount: number;
  readonly directAoSaSignal: number;
  readonly combinedSignal: number;
  readonly nonOkOrUnmeasuredCount: number;
}): string {
  const nonOkClause = args.nonOkOrUnmeasuredCount > 0
    ? ` ${args.nonOkOrUnmeasuredCount} non-ok or unmeasured runs are boundary-tracked.`
    : "";
  if (args.boundaryRootSignal > 0 && args.boundaryRootSignal === args.aovBoundarySignal) {
    return `Phase 5AE physicalizes the Phase 5AD AoV-boundary carrier signal behind an experimental boundary/root inertance hook: the mechanism carries ${args.boundaryRootSignal} measured-health-ok signal comparisons and matches ${args.carrierMechanismMatchCount} measured-health-ok carrier comparisons. Direct Ao_SA-only remains unsupported with ${args.directAoSaSignal} measured-health-ok signal comparisons.${nonOkClause} Treat this as diagnostic-only mechanism routing, not production adoption or fix acceptance.`;
  }
  return `Phase 5AE smoke records candidate routing evidence: AoV-boundary signal=${args.aovBoundarySignal}, boundaryRoot=${args.boundaryRootSignal}, directAoSA=${args.directAoSaSignal}, combined=${args.combinedSignal}.${nonOkClause} This remains diagnostic-only and does not unlock root/Zc adoption.`;
}

function parameterization(candidate: Candidate): ArterialRootBoundaryInertancePhase5AERun["parameterization"] {
  if (candidate.boundaryRootAdditionalMultipleOfAoVL > 0) return "experimental-boundary-root-inertance-mechanism";
  if (candidate.aovBoundaryInertanceMultiple === 1 && candidate.aoSaInertanceMultiple === 1) return "current-closure";
  if (candidate.aovBoundaryInertanceMultiple > 1 && candidate.aoSaInertanceMultiple === 1) return "aov-boundary-carrier-reference";
  if (candidate.aovBoundaryInertanceMultiple === 1 && candidate.aoSaInertanceMultiple > 1) return "direct-aosa-edge-override-only";
  return "combined-aov-boundary-and-aosa-edge-override";
}

function baseAoSAInertance(): number {
  const edge = buildEdges().find((candidate) => candidate.name === "Ao_SA");
  if (!edge?.L) throw new Error("Missing Ao_SA inertance");
  return edge.L;
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
  const normalizedScriptPath = path.normalize("tools/myocardium/buildArterialRootBoundaryInertancePhase5AE.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildArterialRootBoundaryInertancePhase5AEEvidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), ARTERIAL_ROOT_BOUNDARY_INERTANCE_PHASE5AE_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
