import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5WArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-envelope-phase5w-result-v1.json";
import phaseM1Artifact from "@/data/myocardium/protocols/morphology-blocker-bundle-phase-m1-result-v1.json";
import { CASE_SCHEMA_VERSION, DEFAULT_SOLVER, ENGINE_VERSION, type CaseDocument } from "@/caseDoc";
import { defaultParams } from "@/engine/ModelCore";
import { KNOB_MAPPING_VERSION, type ClinicalKnobs } from "@/engine/knobs";
import { measureConverged } from "@/engine/measure";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import type { SimulationHealth } from "@/engine/protocol";
import {
  runPvLoopMorphologyDiagnostic,
  type BranchSummary,
  type DiagnosticRunResult,
  type MetricRow,
  type RunnerSummary,
} from "@/tools/myocardium/verifyPvLoopMorphologyQuality";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const LV_LAND_DEFAULT_CANDIDATE_PREFLIGHT_PHASE5X_ID =
  "lv-land-default-candidate-preflight-phase5x-result-v1";

export const LV_LAND_DEFAULT_CANDIDATE_PREFLIGHT_PHASE5X_RESULT_PATH =
  "data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";

const MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;

const SWEEP_POINTS = [
  { id: "normal-floor", label: "normal baseline floor", role: "normal-floor", targetTBVMl: 5600, knobs: {} },
  { id: "preload-low", label: "preload low", role: "user-preload", targetTBVMl: 4800, knobs: {} },
  { id: "preload-high", label: "preload high", role: "user-preload", targetTBVMl: 6400, knobs: {} },
  { id: "hr60", label: "heart rate 60", role: "user-hr", targetTBVMl: 5600, knobs: { HR: 60 } },
  { id: "hr90", label: "heart rate 90", role: "user-hr", targetTBVMl: 5600, knobs: { HR: 90 } },
  { id: "hr120", label: "heart rate 120", role: "user-hr", targetTBVMl: 5600, knobs: { HR: 120 } },
  { id: "contractility-low", label: "contractility low", role: "user-contractility", targetTBVMl: 5600, knobs: { contractility: 0.65 } },
  { id: "contractility-high", label: "contractility high", role: "user-contractility", targetTBVMl: 5600, knobs: { contractility: 1.35 } },
  { id: "afterload-low", label: "afterload low", role: "user-afterload", targetTBVMl: 5600, knobs: { afterload: 0.75 } },
  { id: "afterload-high", label: "afterload high", role: "user-afterload", targetTBVMl: 5600, knobs: { afterload: 1.45 } },
  { id: "arterial-stiffness-low", label: "arterial stiffness low", role: "user-arterial-stiffness", targetTBVMl: 5600, knobs: { arterialStiffness: 0.7 } },
  { id: "arterial-stiffness-high", label: "arterial stiffness high", role: "user-arterial-stiffness", targetTBVMl: 5600, knobs: { arterialStiffness: 1.6 } },
  { id: "venous-tone-low", label: "venous tone low", role: "user-venous-tone", targetTBVMl: 5600, knobs: { venousTone: 0.08 } },
  { id: "venous-tone-high", label: "venous tone high", role: "user-venous-tone", targetTBVMl: 5600, knobs: { venousTone: 0.28 } },
] as const;

const SELECTED_METRIC_IDS = [
  "CO",
  "SV",
  "EDV",
  "EAInflowProxy",
  "uncertainSampleFraction",
  "lowerLimbKinkCount",
  "mvOpenLowerLimbRoughness",
  "tvOpenLowerLimbRoughness",
  "qDotClampHitFraction",
  "aovOpenEjectionSquareness",
  "pvOpenEjectionSquareness",
  "incisuraPresenceScore",
  "ejectionDuration",
  "semilunarForwardVolume",
  "semilunarReverseVolume",
] as const;

const NORMAL_FLOOR_THRESHOLDS = {
  CO_L: { min: 3.5, max: 7.0, unit: "L/min" },
  AoPMean: { min: 65, max: 110, unit: "mmHg" },
  EF_LApprox: { min: 0.45, max: 0.75, unit: "fraction" },
  EDV_L: { min: 70, max: 180, unit: "mL" },
  ESV_L: { min: 20, max: 110, unit: "mL" },
  LVEDPApprox: { min: 0, max: 16, unit: "mmHg" },
} as const;

const MORPHOLOGY_ABSOLUTE_THRESHOLDS = {
  qDotClampHitFractionMax: 0.25,
  ejectionSquarenessMax: 0.98,
  lowerLimbKinkCountMax: 16,
  openLowerLimbRoughnessMax: 80,
  uncertainSampleFractionMax: 0.25,
} as const;

type ModelPathId = typeof MODEL_PATH_IDS[number];
type SweepPoint = typeof SWEEP_POINTS[number];
type ChamberId = "LV" | "RV" | "LV/RV";

export type LvLandDefaultCandidatePreflightPhase5XRunnerSummary = {
  readonly modelPathId: ModelPathId;
  readonly branchCount: number;
  readonly metricRowCount: number;
  readonly phaseRowCount: number;
  readonly warningCount: number;
  readonly errorCount: number;
  readonly normalizedSummarySha256: string;
  readonly normalizedMetricSha256: string;
  readonly errors: readonly string[];
};

export type LvLandDefaultCandidatePreflightPhase5XHealth = Pick<
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

export type LvLandDefaultCandidatePreflightPhase5XNormalFloor = {
  readonly observed: {
    readonly CO_L: number | null;
    readonly AoPMean: number | null;
    readonly EF_LApprox: number | null;
    readonly EDV_L: number | null;
    readonly ESV_L: number | null;
    readonly LVEDPApprox: number | null;
  };
  readonly thresholds: typeof NORMAL_FLOOR_THRESHOLDS;
  readonly pass: boolean;
  readonly failures: readonly string[];
};

export type LvLandDefaultCandidatePreflightPhase5XBranch = {
  readonly caseId: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly settleActualSeconds: number | null;
  readonly health: LvLandDefaultCandidatePreflightPhase5XHealth;
  readonly metricCount: number;
  readonly sampleCount: number;
};

export type LvLandDefaultCandidatePreflightPhase5XMetricDelta = {
  readonly chamber: ChamberId;
  readonly metricId: string;
  readonly stockMean: number | null;
  readonly landMean: number | null;
  readonly delta: number | null;
  readonly relativeDelta: number | null;
  readonly stockCount: number;
  readonly landCount: number;
};

export type LvLandDefaultCandidatePreflightPhase5XPoint = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetTBVMl: number;
  readonly knobs: Partial<ClinicalKnobs>;
  readonly stock: LvLandDefaultCandidatePreflightPhase5XBranch | null;
  readonly land: LvLandDefaultCandidatePreflightPhase5XBranch | null;
  readonly bothBranchesPresent: boolean;
  readonly bothSettled: boolean;
  readonly landHealthOk: boolean;
  readonly metricDeltas: readonly LvLandDefaultCandidatePreflightPhase5XMetricDelta[];
  readonly absoluteMorphologyFailures: readonly string[];
  readonly classification:
    | "candidate-pass-diagnostic-only"
    | "blocked-by-normal-floor"
    | "blocked-by-land-health-or-settle"
    | "blocked-by-morphology-absolute-gate"
    | "missing-branch-blocker";
};

export type LvLandDefaultCandidatePreflightPhase5XEvidence = {
  readonly schemaVersion: 1;
  readonly id: typeof LV_LAND_DEFAULT_CANDIDATE_PREFLIGHT_PHASE5X_ID;
  readonly phase: "Phase 5X";
  readonly claimBoundary: "early-default-candidate-user-knob-morphology-preflight-diagnostic-only";
  readonly upstreamPhase5WArtifactId: typeof phase5WArtifact.id;
  readonly upstreamPhaseM1ArtifactId: typeof phaseM1Artifact.id;
  readonly verifierScript: "verify:myocardium-lv-land-default-candidate-preflight";
  readonly migrationPolicy: {
    readonly landRuntimeDefault: "early-default-candidate-after-preflight-not-in-this-artifact";
    readonly legacyActiveStress: "freeze-positive-control-reference-do-not-delete";
    readonly alternansSdirk2: "parallel-science-closure-not-product-migration-gate";
    readonly officialCases: "not-individually-tuned-until-model-stabilizes";
  };
  readonly protocol: {
    readonly matrixMode: "normal-floor-plus-one-axis-user-knob-sweep-v1";
    readonly modelPathIds: readonly ModelPathId[];
    readonly sweepPointCount: number;
    readonly sweepPoints: readonly Pick<SweepPoint, "id" | "label" | "role" | "targetTBVMl" | "knobs">[];
    readonly runnerVersion: "pv-loop-morphology-quality-runner-v1";
    readonly sourceProviderScope: "LV-only";
    readonly calciumMappingScenario: "phase2b-absolute-peak-ca";
    readonly commitScheme: "BE";
    readonly selectedMetricIds: readonly string[];
    readonly morphologyAbsoluteThresholds: typeof MORPHOLOGY_ABSOLUTE_THRESHOLDS;
  };
  readonly normalOperatingPointFloor: LvLandDefaultCandidatePreflightPhase5XNormalFloor;
  readonly runner: {
    readonly stock: LvLandDefaultCandidatePreflightPhase5XRunnerSummary;
    readonly land: LvLandDefaultCandidatePreflightPhase5XRunnerSummary;
  };
  readonly landProviderInstrumentation: {
    readonly sourceProviderId: string;
    readonly sourceActiveStressCallCount: number;
    readonly debugActiveStressTermsCallCount: number;
    readonly commitProviderStateAfterStepCount: number;
    readonly landSolveFailureCount: number;
    readonly landSolveOkCount: number;
    readonly maxSolverResidualNorm: number;
    readonly sourcePathAuditSampleCount: number;
    readonly commitPathAuditSampleCount: number;
  };
  readonly points: readonly LvLandDefaultCandidatePreflightPhase5XPoint[];
  readonly preflight: {
    readonly expectedPointCount: number;
    readonly completePointCount: number;
    readonly candidatePassPointCount: number;
    readonly landSolveFailureCount: number;
    readonly stockRunnerErrorCount: number;
    readonly landRunnerErrorCount: number;
    readonly absoluteMorphologyFailureCount: number;
    readonly readiness:
      | "ready-for-separate-default-flip-pr-with-legacy-frozen"
      | "blocked-before-default-flip";
    readonly defaultFlipInThisArtifact: false;
    readonly legacyDeletionReadiness: "blocked-freeze-reference";
  };
  readonly summary: {
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
  };
  readonly boundary: {
    readonly noRuntimeDefaultFlipInThisArtifact: true;
    readonly noLegacyActiveStressDeletion: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noRuntimeFlagUi: true;
    readonly noProductionRegistryIntegration: true;
    readonly noPerCaseTuning: true;
    readonly noTrefFudge: true;
    readonly noQDotTuning: true;
    readonly noValveTuning: true;
    readonly noAfterloadTuning: true;
    readonly noPreloadTuning: true;
    readonly noLandParameterTuning: true;
    readonly noSourceStressScaling: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noClinicalScientificValidationClaim: true;
  };
  readonly doesNotUnlock: readonly string[];
};

export function buildLvLandDefaultCandidatePreflightPhase5XEvidence():
LvLandDefaultCandidatePreflightPhase5XEvidence {
  const stock = runSyntheticMorphologyPath("stock-active-no-provider-v0");
  const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const flag = createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
    acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
    instrumentation,
  });
  const land = runSyntheticMorphologyPath("developer-only-lv-land-v0", flag.experimentalOptions);
  const normalOperatingPointFloor = measureNormalFloor(flag.experimentalOptions);
  const points = buildPoints(stock.result, land.result, normalOperatingPointFloor);
  const completePointCount = points.filter((point) => point.bothBranchesPresent).length;
  const candidatePassPointCount = points.filter((point) => point.classification === "candidate-pass-diagnostic-only").length;
  const absoluteMorphologyFailureCount =
    points.reduce((sum, point) => sum + point.absoluteMorphologyFailures.length, 0);
  const readiness =
    normalOperatingPointFloor.pass
    && stock.result.summary.errors.length === 0
    && land.result.summary.errors.length === 0
    && instrumentation.landSolveFailureCount === 0
    && completePointCount === SWEEP_POINTS.length
    && absoluteMorphologyFailureCount === 0
    && points.every((point) => point.landHealthOk && point.land?.settled)
      ? "ready-for-separate-default-flip-pr-with-legacy-frozen"
      : "blocked-before-default-flip";

  return {
    schemaVersion: 1,
    id: LV_LAND_DEFAULT_CANDIDATE_PREFLIGHT_PHASE5X_ID,
    phase: "Phase 5X",
    claimBoundary: "early-default-candidate-user-knob-morphology-preflight-diagnostic-only",
    upstreamPhase5WArtifactId: phase5WArtifact.id,
    upstreamPhaseM1ArtifactId: phaseM1Artifact.id,
    verifierScript: "verify:myocardium-lv-land-default-candidate-preflight",
    migrationPolicy: {
      landRuntimeDefault: "early-default-candidate-after-preflight-not-in-this-artifact",
      legacyActiveStress: "freeze-positive-control-reference-do-not-delete",
      alternansSdirk2: "parallel-science-closure-not-product-migration-gate",
      officialCases: "not-individually-tuned-until-model-stabilizes",
    },
    protocol: {
      matrixMode: "normal-floor-plus-one-axis-user-knob-sweep-v1",
      modelPathIds: MODEL_PATH_IDS,
      sweepPointCount: SWEEP_POINTS.length,
      sweepPoints: SWEEP_POINTS.map(({ id, label, role, targetTBVMl, knobs }) => ({
        id,
        label,
        role,
        targetTBVMl,
        knobs,
      })),
      runnerVersion: "pv-loop-morphology-quality-runner-v1",
      sourceProviderScope: "LV-only",
      calciumMappingScenario: "phase2b-absolute-peak-ca",
      commitScheme: "BE",
      selectedMetricIds: SELECTED_METRIC_IDS,
      morphologyAbsoluteThresholds: MORPHOLOGY_ABSOLUTE_THRESHOLDS,
    },
    normalOperatingPointFloor,
    runner: {
      stock: compactRunner("stock-active-no-provider-v0", stock.result),
      land: compactRunner("developer-only-lv-land-v0", land.result),
    },
    landProviderInstrumentation: {
      sourceProviderId: flag.sourceProviderId,
      sourceActiveStressCallCount: instrumentation.sourceActiveStressPa,
      debugActiveStressTermsCallCount: instrumentation.debugActiveStressTerms,
      commitProviderStateAfterStepCount: instrumentation.commitProviderStateAfterStep,
      landSolveFailureCount: instrumentation.landSolveFailureCount,
      landSolveOkCount: instrumentation.landSolveOkCount,
      maxSolverResidualNorm: round(instrumentation.maxSolverResidualNorm),
      sourcePathAuditSampleCount: instrumentation.sourcePathAudit.sampleCount,
      commitPathAuditSampleCount: instrumentation.commitPathAudit.sampleCount,
    },
    points,
    preflight: {
      expectedPointCount: SWEEP_POINTS.length,
      completePointCount,
      candidatePassPointCount,
      landSolveFailureCount: instrumentation.landSolveFailureCount,
      stockRunnerErrorCount: stock.result.summary.errors.length,
      landRunnerErrorCount: land.result.summary.errors.length,
      absoluteMorphologyFailureCount,
      readiness,
      defaultFlipInThisArtifact: false,
      legacyDeletionReadiness: "blocked-freeze-reference",
    },
    summary: {
      currentInterpretation:
        readiness === "ready-for-separate-default-flip-pr-with-legacy-frozen"
          ? "Developer-only LV Land passed the normal operating floor and user-knob morphology preflight. A separate default-flip PR may proceed while freezing legacy active-stress as the positive-control reference."
          : "Developer-only LV Land did not yet clear the normal operating floor and user-knob morphology preflight. Do not flip runtime default until blockers are resolved or explicitly accepted.",
      recommendedNext: [
        "if preflight is ready, make a separate default-flip PR that keeps legacy active-stress frozen and selectable for reference",
        "run SDIRK2 alternans closure against the frozen reference closure in parallel, not as a migration gate",
        "continue atrial figure-eight and arterial Zc/root morphology work as separate subsystems; do not tune Land to hide those blockers",
      ],
    },
    boundary: {
      noRuntimeDefaultFlipInThisArtifact: true,
      noLegacyActiveStressDeletion: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noRuntimeFlagUi: true,
      noProductionRegistryIntegration: true,
      noPerCaseTuning: true,
      noTrefFudge: true,
      noQDotTuning: true,
      noValveTuning: true,
      noAfterloadTuning: true,
      noPreloadTuning: true,
      noLandParameterTuning: true,
      noSourceStressScaling: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noClinicalScientificValidationClaim: true,
    },
    doesNotUnlock: [
      "runtimeDefaultFlip",
      "legacyActiveStressDeletion",
      "officialCaseWiring",
      "officialCaseReauthoring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "runtimeFlagUi",
      "productionRegistryIntegration",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
      "perCaseTuning",
      "TrefFudge",
      "qDotTuning",
      "valveThresholdTuning",
      "arterialLoadTuning",
      "preloadTuning",
      "landParameterTuning",
      "sourceStressScaling",
      "clinicalDecisionSupport",
      "scientificValidationClaim",
    ],
  };
}

function runSyntheticMorphologyPath(
  modelPathId: ModelPathId,
  experimentalOptions?: ModelCoreExperimentalOptions,
): { readonly result: DiagnosticRunResult } {
  const outDir = mkdtempSync(path.join(tmpdir(), `phase5x-${modelPathId}-`));
  try {
    return {
      result: runPvLoopMorphologyDiagnostic({
        outDir,
        caseIds: [],
        caseDocuments: SWEEP_POINTS.map(syntheticCaseDocument),
        ...(experimentalOptions ? { experimentalOptions } : {}),
      }),
    };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

function syntheticCaseDocument(point: SweepPoint): CaseDocument {
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: {
      id: `phase5x-user-knob-${point.id}`,
      title: `Phase 5X ${point.label}`,
      author: "CircleHeart",
      createdAt: 0,
      updatedAt: 0,
    },
    kind: "case",
    status: "draft",
    visibility: "private",
    spec: {
      title: `Phase 5X ${point.label}`,
      description: "Synthetic one-axis user-knob morphology preflight point; not an official case.",
      modelLimitations: [
        "Synthetic diagnostic point only.",
        "No official case tuning or acceptance.",
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

function measureNormalFloor(
  experimentalOptions: ModelCoreExperimentalOptions,
): LvLandDefaultCandidatePreflightPhase5XNormalFloor {
  try {
    const measurement = measureConverged(defaultParams(), {
      targetTBV: 5600,
      dt: 0.001,
      sampleHz: 240,
      measureBeats: 3,
      requireProjectorQuiet: false,
      experimentalOptions,
    });
    const volumes = measurement.samples.map((sample) => sample.VLV).filter(Number.isFinite);
    const EDV_L = volumes.length > 0 ? Math.max(...volumes) : null;
    const ESV_L = volumes.length > 0 ? Math.min(...volumes) : null;
    const observed = {
      CO_L: finiteOrNull(measurement.metrics.CO_L),
      AoPMean: finiteOrNull(measurement.metrics.AoPMean),
      EF_LApprox: finiteOrNull(measurement.metrics.EF_LApprox),
      EDV_L: finiteOrNull(EDV_L),
      ESV_L: finiteOrNull(ESV_L),
      LVEDPApprox: finiteOrNull(measurement.metrics.LVEDPApprox),
    };
    const failures = Object.entries(NORMAL_FLOOR_THRESHOLDS)
      .filter(([key, threshold]) => {
        const value = observed[key as keyof typeof observed];
        return value == null || value < threshold.min || value > threshold.max;
      })
      .map(([key]) => key);
    return { observed, thresholds: NORMAL_FLOOR_THRESHOLDS, pass: failures.length === 0, failures };
  } catch (error) {
    return {
      observed: {
        CO_L: null,
        AoPMean: null,
        EF_LApprox: null,
        EDV_L: null,
        ESV_L: null,
        LVEDPApprox: null,
      },
      thresholds: NORMAL_FLOOR_THRESHOLDS,
      pass: false,
      failures: [`normal-floor-measurement-error:${(error as Error).message}`],
    };
  }
}

function buildPoints(
  stock: DiagnosticRunResult,
  land: DiagnosticRunResult,
  normalFloor: LvLandDefaultCandidatePreflightPhase5XNormalFloor,
): LvLandDefaultCandidatePreflightPhase5XPoint[] {
  return SWEEP_POINTS.map((point) => {
    const caseId = `phase5x-user-knob-${point.id}`;
    const stockBranch = stock.summary.branches.find((branch) =>
      branch.caseId === caseId && branch.branchId === point.id
    ) ?? null;
    const landBranch = land.summary.branches.find((branch) =>
      branch.caseId === caseId && branch.branchId === point.id
    ) ?? null;
    const stockSummary = stockBranch ? compactBranch(stockBranch) : null;
    const landSummary = landBranch ? compactBranch(landBranch) : null;
    const metricDeltas = buildMetricDeltas(caseId, point.id, stock.metricRows, land.metricRows);
    const absoluteMorphologyFailures = absoluteMorphologyFailuresForPoint(metricDeltas);
    const classification = classifyPoint(point, normalFloor, stockSummary, landSummary, absoluteMorphologyFailures);
    return {
      id: point.id,
      label: point.label,
      role: point.role,
      targetTBVMl: point.targetTBVMl,
      knobs: point.knobs,
      stock: stockSummary,
      land: landSummary,
      bothBranchesPresent: stockSummary != null && landSummary != null,
      bothSettled: stockSummary?.settled === true && landSummary?.settled === true,
      landHealthOk: landSummary?.health.status === "ok",
      metricDeltas,
      absoluteMorphologyFailures,
      classification,
    };
  });
}

function compactRunner(
  modelPathId: ModelPathId,
  result: DiagnosticRunResult,
): LvLandDefaultCandidatePreflightPhase5XRunnerSummary {
  return {
    modelPathId,
    branchCount: result.summary.branches.length,
    metricRowCount: result.metricRows.length,
    phaseRowCount: result.phaseRows.length,
    warningCount: result.summary.warnings.length,
    errorCount: result.summary.errors.length,
    normalizedSummarySha256: hashStable(normalizedSummary(result.summary)),
    normalizedMetricSha256: hashStable(normalizedMetricRows(result.metricRows)),
    errors: result.summary.errors,
  };
}

function compactBranch(branch: BranchSummary): LvLandDefaultCandidatePreflightPhase5XBranch {
  return {
    caseId: branch.caseId,
    branchId: branch.branchId,
    branchName: branch.branchName,
    settled: branch.settle.settled,
    settleReason: branch.settle.reason,
    settleBeats: branch.settle.beats,
    settleActualSeconds: finiteOrNull(branch.settle.actualSeconds),
    health: {
      status: branch.health.status,
      ...(branch.health.periodBeats != null ? { periodBeats: branch.health.periodBeats } : {}),
      tbvDriftMl: round(branch.health.tbvDriftMl),
      leftRightFlowMismatchLMin: round(branch.health.leftRightFlowMismatchLMin),
      cycleMetricDelta: round(branch.health.cycleMetricDelta),
      clampHitCount: branch.health.clampHitCount,
      numericalStability: branch.health.numericalStability,
      massConservation: branch.health.massConservation,
      flowBalance: branch.health.flowBalance,
      physiologicalRange: branch.health.physiologicalRange,
      messages: branch.health.messages,
    },
    metricCount: branch.metricCount,
    sampleCount: branch.sampleCount,
  };
}

function buildMetricDeltas(
  caseId: string,
  branchId: string,
  stockRows: readonly MetricRow[],
  landRows: readonly MetricRow[],
): LvLandDefaultCandidatePreflightPhase5XMetricDelta[] {
  const deltas: LvLandDefaultCandidatePreflightPhase5XMetricDelta[] = [];
  for (const chamber of ["LV", "RV", "LV/RV"] as const) {
    for (const metricId of SELECTED_METRIC_IDS) {
      const stockValues = selectedValues(stockRows, caseId, branchId, chamber, metricId);
      const landValues = selectedValues(landRows, caseId, branchId, chamber, metricId);
      if (stockValues.length === 0 && landValues.length === 0) continue;
      const stockMean = meanOrNull(stockValues);
      const landMean = meanOrNull(landValues);
      deltas.push({
        chamber,
        metricId,
        stockMean,
        landMean,
        delta: deltaOrNull(landMean, stockMean),
        relativeDelta: relativeDeltaOrNull(landMean, stockMean),
        stockCount: stockValues.length,
        landCount: landValues.length,
      });
    }
  }
  return deltas;
}

function selectedValues(
  rows: readonly MetricRow[],
  caseId: string,
  branchId: string,
  chamber: ChamberId,
  metricId: string,
): number[] {
  return rows
    .filter((row) =>
      row.caseId === caseId
      && row.branchId === branchId
      && row.chamber === chamber
      && row.metricId === metricId
      && row.samplingMode === "raw"
      && row.transitionPolicy === "transition-excluded-core"
      && typeof row.value === "number"
      && Number.isFinite(row.value)
    )
    .map((row) => row.value as number);
}

function absoluteMorphologyFailuresForPoint(
  metrics: readonly LvLandDefaultCandidatePreflightPhase5XMetricDelta[],
): string[] {
  const failures: string[] = [];
  for (const metric of metrics) {
    if (metric.landMean == null) {
      failures.push(`missing-land-metric:${metric.chamber}:${metric.metricId}`);
      continue;
    }
    if (metric.metricId === "qDotClampHitFraction" && metric.landMean > MORPHOLOGY_ABSOLUTE_THRESHOLDS.qDotClampHitFractionMax) {
      failures.push(`qdot-clamp-high:${metric.chamber}:${metric.landMean}`);
    }
    if (
      (metric.metricId === "aovOpenEjectionSquareness" || metric.metricId === "pvOpenEjectionSquareness")
      && metric.landMean > MORPHOLOGY_ABSOLUTE_THRESHOLDS.ejectionSquarenessMax
    ) {
      failures.push(`ejection-squareness-high:${metric.chamber}:${metric.landMean}`);
    }
    if (metric.metricId === "lowerLimbKinkCount" && metric.landMean > MORPHOLOGY_ABSOLUTE_THRESHOLDS.lowerLimbKinkCountMax) {
      failures.push(`lower-limb-kinks-high:${metric.chamber}:${metric.landMean}`);
    }
    if (
      (metric.metricId === "mvOpenLowerLimbRoughness" || metric.metricId === "tvOpenLowerLimbRoughness")
      && metric.landMean > MORPHOLOGY_ABSOLUTE_THRESHOLDS.openLowerLimbRoughnessMax
    ) {
      failures.push(`open-limb-roughness-high:${metric.chamber}:${metric.landMean}`);
    }
    if (metric.metricId === "uncertainSampleFraction" && metric.landMean > MORPHOLOGY_ABSOLUTE_THRESHOLDS.uncertainSampleFractionMax) {
      failures.push(`uncertain-sample-fraction-high:${metric.chamber}:${metric.landMean}`);
    }
  }
  return uniqueSorted(failures);
}

function classifyPoint(
  point: SweepPoint,
  normalFloor: LvLandDefaultCandidatePreflightPhase5XNormalFloor,
  stock: LvLandDefaultCandidatePreflightPhase5XBranch | null,
  land: LvLandDefaultCandidatePreflightPhase5XBranch | null,
  absoluteMorphologyFailures: readonly string[],
): LvLandDefaultCandidatePreflightPhase5XPoint["classification"] {
  if (stock == null || land == null) return "missing-branch-blocker";
  if (point.id === "normal-floor" && !normalFloor.pass) return "blocked-by-normal-floor";
  if (!land.settled || land.health.status !== "ok") return "blocked-by-land-health-or-settle";
  if (absoluteMorphologyFailures.length > 0) return "blocked-by-morphology-absolute-gate";
  return "candidate-pass-diagnostic-only";
}

function normalizedSummary(summary: RunnerSummary): unknown {
  return {
    schemaVersion: summary.schemaVersion,
    targetPackId: summary.targetPackId,
    protocolId: summary.protocolId,
    claimBoundary: summary.claimBoundary,
    runnerVersion: summary.runnerVersion,
    measurementProfile: summary.measurementProfile,
    derivativeProfile: summary.derivativeProfile,
    classificationProfile: summary.classificationProfile,
    caseIds: summary.caseIds,
    samplingModes: summary.samplingModes,
    transitionPolicies: summary.transitionPolicies,
    inputArtifactHashes: summary.inputArtifactHashes,
    signalAvailability: summary.signalAvailability,
    guardrailResults: summary.guardrailResults,
    samplingInvarianceDelta: summary.samplingInvarianceDelta,
    branches: summary.branches.map((branch) => ({
      caseId: branch.caseId,
      branchId: branch.branchId,
      branchName: branch.branchName,
      settle: branch.settle,
      health: compactBranch(branch).health,
      metricCount: branch.metricCount,
      sampleCount: branch.sampleCount,
    })),
    errors: summary.errors,
  };
}

function normalizedMetricRows(rows: readonly MetricRow[]): unknown {
  return rows.map((row) => ({
    caseId: row.caseId,
    branchId: row.branchId,
    chamber: row.chamber,
    beatIndex: row.beatIndex,
    metricId: row.metricId,
    samplingMode: row.samplingMode,
    transitionPolicy: row.transitionPolicy,
    value: finiteOrNull(row.value),
    unit: row.unit,
    samplingInvarianceDelta: finiteOrNull(row.samplingInvarianceDelta),
    classificationLabels: [...row.classificationLabels].sort(),
  }));
}

function meanOrNull(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function deltaOrNull(left: number | null, right: number | null): number | null {
  return left == null || right == null ? null : round(left - right);
}

function relativeDeltaOrNull(left: number | null, right: number | null): number | null {
  if (left == null || right == null) return null;
  const denom = Math.max(Math.abs(right), 1e-9);
  return round((left - right) / denom);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
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
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildLvLandDefaultCandidatePreflightPhase5X.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const evidence = buildLvLandDefaultCandidatePreflightPhase5XEvidence();
  if (process.argv.includes("--write")) {
    const outPath = path.join(process.cwd(), LV_LAND_DEFAULT_CANDIDATE_PREFLIGHT_PHASE5X_RESULT_PATH);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
