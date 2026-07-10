import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import {
  LV_LAND_DEFAULT_CANDIDATE_PREFLIGHT_PHASE5X_ID,
  buildLvLandDefaultCandidatePreflightPhase5XEvidence,
  type LvLandDefaultCandidatePreflightPhase5XEvidence,
} from "@/tools/myocardium/buildLvLandDefaultCandidatePreflightPhase5X";

export type LvLandDefaultCandidatePreflightPhase5XValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type LvLandDefaultCandidatePreflightPhase5XValidationReport = {
  readonly pass: boolean;
  readonly evidence: LvLandDefaultCandidatePreflightPhase5XEvidence;
  readonly errors: readonly LvLandDefaultCandidatePreflightPhase5XValidationIssue[];
  readonly warnings: readonly LvLandDefaultCandidatePreflightPhase5XValidationIssue[];
};

export type LvLandDefaultCandidatePreflightPhase5XValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildLvLandDefaultCandidatePreflightPhase5X.ts";
const VERIFIER_PATH = "tools/myocardium/verifyLvLandDefaultCandidatePreflightPhase5X.ts";
const MORPHOLOGY_RUNNER_PATH = "tools/myocardium/verifyPvLoopMorphologyQuality.ts";
const MEASURE_PATH = "engine/measure.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";
const PACKAGE_PATH = "package.json";
const EXPECTED_MODEL_PATH_IDS = [
  "stock-active-no-provider-v0",
  "developer-only-lv-land-v0",
] as const;
const EXPECTED_SWEEP_POINT_IDS = [
  "normal-floor",
  "preload-low",
  "preload-high",
  "hr60",
  "hr90",
  "hr120",
  "contractility-low",
  "contractility-high",
  "afterload-low",
  "afterload-high",
  "arterial-stiffness-low",
  "arterial-stiffness-high",
  "venous-tone-low",
  "venous-tone-high",
] as const;
const EXPECTED_ROLES = [
  "normal-floor",
  "user-preload",
  "user-preload",
  "user-hr",
  "user-hr",
  "user-hr",
  "user-contractility",
  "user-contractility",
  "user-afterload",
  "user-afterload",
  "user-arterial-stiffness",
  "user-arterial-stiffness",
  "user-venous-tone",
  "user-venous-tone",
] as const;
const EXPECTED_SELECTED_METRICS = [
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
const EXPECTED_NORMAL_FLOOR_THRESHOLDS = {
  CO_L: { min: 3.5, max: 7.0, unit: "L/min" },
  AoPMean: { min: 65, max: 110, unit: "mmHg" },
  EF_LApprox: { min: 0.45, max: 0.75, unit: "fraction" },
  EDV_L: { min: 70, max: 180, unit: "mL" },
  ESV_L: { min: 20, max: 110, unit: "mL" },
  LVEDPApprox: { min: 0, max: 16, unit: "mmHg" },
} as const;
const EXPECTED_DOES_NOT_UNLOCK = [
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
] as const;
const PRODUCTION_TARGET_PATHS = [
  "caseCloud.ts",
  "caseDoc.ts",
  "casePersist.ts",
  "caseValidation.ts",
  "components/Cases.tsx",
  "constants.ts",
  "controllerCatalog.ts",
  "controllerItems.ts",
  "engine/ModelCore.ts",
  "engine/caseBaselines.ts",
  "engine/caseResolve.ts",
  "engine/core/params.ts",
  "engine/core/stateLayout.ts",
  "engine/guytonStarlingChainProtocol.ts",
  "engine/guytonStarlingChainWorker.ts",
  "engine/guytonStarlingChainWorkerCore.ts",
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/harness.ts",
  "engine/presets.ts",
  "engine/previewController.ts",
  "engine/previewWorker.ts",
  "engine/previewWorkerProtocol.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "engine/steadyJob.ts",
  "engine/transitionSteadyProtocol.ts",
  "engine/transitionSteadyWorker.ts",
  "features/workbench",
  "officialCases.ts",
] as const;

export function validateLvLandDefaultCandidatePreflightPhase5X(
  rootDir = process.cwd(),
  options: LvLandDefaultCandidatePreflightPhase5XValidationOptions = {},
): LvLandDefaultCandidatePreflightPhase5XValidationReport {
  const errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[] = [];
  const warnings: LvLandDefaultCandidatePreflightPhase5XValidationIssue[] = [];
  const evidence = resultArtifact as LvLandDefaultCandidatePreflightPhase5XEvidence;

  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validateNormalFloor(evidence, errors, warnings);
  validateRunner(evidence, errors);
  validateLandInstrumentation(evidence, errors);
  validatePoints(evidence, errors, warnings);
  validatePreflightBoundary(evidence, errors, warnings);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  if (options.rebuildEvidence === true) validateFreshEvidence(evidence, errors);
  else {
    warnings.push({
      severity: "warning",
      code: "phase5x_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5X rebuild is opt-in because it runs 28 measured morphology branches plus a normal-floor measurement.",
    });
  }
  warnings.push({
    severity: "warning",
    code: "phase5x_default_flip_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5X is a default-candidate preflight only; any runtime default flip must be a separate PR and legacy active-stress must remain frozen.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: LvLandDefaultCandidatePreflightPhase5XEvidence,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  const fresh = buildLvLandDefaultCandidatePreflightPhase5XEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5x_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5X result artifact must match a fresh measured builder run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== LV_LAND_DEFAULT_CANDIDATE_PREFLIGHT_PHASE5X_ID
    || evidence.phase !== "Phase 5X"
    || evidence.claimBoundary !== "early-default-candidate-user-knob-morphology-preflight-diagnostic-only"
    || evidence.upstreamPhase5WArtifactId !== "myocardium-developer-only-lv-land-envelope-phase5w-result-v1"
    || evidence.upstreamPhaseM1ArtifactId !== "morphology-blocker-bundle-phase-m1-result-v1"
    || evidence.verifierScript !== "verify:myocardium-lv-land-default-candidate-preflight"
  ) {
    addIssue(errors, "phase5x_identity", RESULT_ARTIFACT_PATH, "Phase 5X identity, upstream links, or verifier script are invalid.");
  }
  if (
    evidence.migrationPolicy.landRuntimeDefault !== "early-default-candidate-after-preflight-not-in-this-artifact"
    || evidence.migrationPolicy.legacyActiveStress !== "freeze-positive-control-reference-do-not-delete"
    || evidence.migrationPolicy.alternansSdirk2 !== "parallel-science-closure-not-product-migration-gate"
    || evidence.migrationPolicy.officialCases !== "not-individually-tuned-until-model-stabilizes"
  ) {
    addIssue(errors, "phase5x_migration_policy", `${RESULT_ARTIFACT_PATH}.migrationPolicy`, "Phase 5X must separate default-candidate evidence, frozen legacy reference, SDIRK2 science closure, and official-case tuning.");
  }
}

function validateProtocol(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  const protocol = evidence.protocol;
  if (
    protocol.matrixMode !== "normal-floor-plus-one-axis-user-knob-sweep-v1"
    || !arrayEquals(protocol.modelPathIds, EXPECTED_MODEL_PATH_IDS)
    || protocol.sweepPointCount !== EXPECTED_SWEEP_POINT_IDS.length
    || !arrayEquals(protocol.sweepPoints.map((point) => point.id), EXPECTED_SWEEP_POINT_IDS)
    || !arrayEquals(protocol.sweepPoints.map((point) => point.role), EXPECTED_ROLES)
    || protocol.runnerVersion !== "pv-loop-morphology-quality-runner-v1"
    || protocol.sourceProviderScope !== "LV-only"
    || protocol.calciumMappingScenario !== "phase2b-absolute-peak-ca"
    || protocol.commitScheme !== "BE"
    || !arrayEquals(protocol.selectedMetricIds, EXPECTED_SELECTED_METRICS)
    || protocol.morphologyAbsoluteThresholds.qDotClampHitFractionMax !== 0.25
    || protocol.morphologyAbsoluteThresholds.ejectionSquarenessMax !== 0.98
    || protocol.morphologyAbsoluteThresholds.lowerLimbKinkCountMax !== 16
    || protocol.morphologyAbsoluteThresholds.openLowerLimbRoughnessMax !== 80
    || protocol.morphologyAbsoluteThresholds.uncertainSampleFractionMax !== 0.25
  ) {
    addIssue(errors, "phase5x_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5X must record the normal-floor plus one-axis user-knob stock/Land morphology preflight protocol.");
  }
}

function validateNormalFloor(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
  warnings: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  const floor = evidence.normalOperatingPointFloor;
  const expectedFailures = normalFloorFailures(evidence);
  for (const [key, threshold] of Object.entries(floor.thresholds)) {
    const expectedThreshold = EXPECTED_NORMAL_FLOOR_THRESHOLDS[key as keyof typeof EXPECTED_NORMAL_FLOOR_THRESHOLDS];
    if (
      expectedThreshold == null
      || threshold.min !== expectedThreshold.min
      || threshold.max !== expectedThreshold.max
      || threshold.unit !== expectedThreshold.unit
    ) {
      addIssue(errors, "phase5x_normal_floor_threshold", `${RESULT_ARTIFACT_PATH}.normalOperatingPointFloor.thresholds.${key}`, "Normal operating floor thresholds must be explicit physiological bounds.");
    }
    const value = floor.observed[key as keyof typeof floor.observed];
    if (value != null && (value < threshold.min || value > threshold.max) && !floor.failures.includes(key)) {
      addIssue(errors, "phase5x_normal_floor_failure_missing", `${RESULT_ARTIFACT_PATH}.normalOperatingPointFloor.${key}`, "Out-of-range normal floor values must be recorded as failures.");
    }
  }
  if (!arrayEquals(Object.keys(floor.thresholds).sort(), Object.keys(EXPECTED_NORMAL_FLOOR_THRESHOLDS).sort())) {
    addIssue(errors, "phase5x_normal_floor_threshold_keys", `${RESULT_ARTIFACT_PATH}.normalOperatingPointFloor.thresholds`, "Normal operating floor threshold keys must match the fixed Phase 5X physiological floor.");
  }
  if (!arrayEquals([...floor.failures].sort(), expectedFailures)) {
    addIssue(errors, "phase5x_normal_floor_failures", `${RESULT_ARTIFACT_PATH}.normalOperatingPointFloor.failures`, "Normal floor failures must be recomputable from observed values and fixed thresholds, including null observations.");
  }
  if (floor.pass !== (floor.failures.length === 0)) {
    addIssue(errors, "phase5x_normal_floor_pass_consistency", `${RESULT_ARTIFACT_PATH}.normalOperatingPointFloor.pass`, "Normal floor pass flag must match recorded failures.");
  }
  if (!floor.pass) {
    warnings.push({
      severity: "warning",
      code: "phase5x_normal_floor_blocked",
      path: `${RESULT_ARTIFACT_PATH}.normalOperatingPointFloor.failures`,
      message: `Normal operating floor did not pass: ${floor.failures.join(", ")}`,
    });
  }
}

function validateRunner(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  for (const runner of [evidence.runner.stock, evidence.runner.land]) {
    if (
      !EXPECTED_MODEL_PATH_IDS.includes(runner.modelPathId)
      || runner.branchCount !== EXPECTED_SWEEP_POINT_IDS.length
      || runner.metricRowCount <= 0
      || runner.phaseRowCount <= 0
      || runner.warningCount !== EXPECTED_SWEEP_POINT_IDS.length
      || runner.errorCount !== 0
      || runner.errors.length !== 0
      || !/^[a-f0-9]{64}$/.test(runner.normalizedSummarySha256)
      || !/^[a-f0-9]{64}$/.test(runner.normalizedMetricSha256)
    ) {
      addIssue(errors, "phase5x_runner", `${RESULT_ARTIFACT_PATH}.runner.${runner.modelPathId}`, "Each Phase 5X runner must record all synthetic branches with deterministic normalized hashes and no runner errors.");
    }
  }
}

function validateLandInstrumentation(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  const instrumentation = evidence.landProviderInstrumentation;
  if (
    !instrumentation.sourceProviderId.includes("phase5u-developer-only-be-phase5q-calcium")
    || instrumentation.sourceActiveStressCallCount <= 0
    || instrumentation.commitProviderStateAfterStepCount <= 0
    || instrumentation.landSolveFailureCount !== 0
    || instrumentation.landSolveOkCount <= 0
    || instrumentation.sourcePathAuditSampleCount <= 0
    || instrumentation.commitPathAuditSampleCount <= 0
  ) {
    addIssue(errors, "phase5x_land_instrumentation", `${RESULT_ARTIFACT_PATH}.landProviderInstrumentation`, "Developer-only Land path must exercise source and commit paths with zero Land solve failures.");
  }
}

function validatePoints(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
  warnings: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  if (evidence.points.length !== EXPECTED_SWEEP_POINT_IDS.length) {
    addIssue(errors, "phase5x_point_count", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5X must record one point per normal/user-knob sweep point.");
  }
  for (const pointId of EXPECTED_SWEEP_POINT_IDS) {
    const point = evidence.points.find((candidate) => candidate.id === pointId);
    if (!point) {
      addIssue(errors, "phase5x_missing_point", `${RESULT_ARTIFACT_PATH}.points`, `Missing Phase 5X point ${pointId}.`);
      continue;
    }
    if (
      point.stock == null
      || point.land == null
      || point.bothBranchesPresent !== true
      || point.metricDeltas.length === 0
      || !point.metricDeltas.some((delta) => delta.chamber === "LV" && delta.metricId === "CO")
      || !point.metricDeltas.some((delta) => delta.chamber === "LV" && delta.metricId === "qDotClampHitFraction")
    ) {
      addIssue(errors, "phase5x_point_evidence", `${RESULT_ARTIFACT_PATH}.points.${pointId}`, "Each point must include paired stock/Land branches and LV metric deltas.");
    }
    if (point.landHealthOk !== (point.land?.health.status === "ok")) {
      addIssue(errors, "phase5x_land_health_consistency", `${RESULT_ARTIFACT_PATH}.points.${pointId}.landHealthOk`, "Point landHealthOk must match compact branch health.");
    }
    if (point.bothSettled !== (point.stock?.settled === true && point.land?.settled === true)) {
      addIssue(errors, "phase5x_settle_consistency", `${RESULT_ARTIFACT_PATH}.points.${pointId}.bothSettled`, "Point bothSettled must match compact branch settle flags.");
    }
    const expectedMorphologyFailures = absoluteMorphologyFailuresForPoint(evidence, point);
    if (!arrayEquals([...point.absoluteMorphologyFailures].sort(), expectedMorphologyFailures)) {
      addIssue(errors, "phase5x_point_morphology_failure_consistency", `${RESULT_ARTIFACT_PATH}.points.${pointId}.absoluteMorphologyFailures`, "Point morphology blockers must be recomputable from Land metric deltas and absolute thresholds.");
    }
    const expectedClassification = classifyPoint(evidence, point, expectedMorphologyFailures);
    if (point.classification !== expectedClassification) {
      addIssue(errors, "phase5x_point_classification_consistency", `${RESULT_ARTIFACT_PATH}.points.${pointId}.classification`, "Point classification must be recomputable from normal floor, branch health/settle, and morphology blockers.");
    }
    if (point.absoluteMorphologyFailures.length > 0) {
      warnings.push({
        severity: "warning",
        code: "phase5x_point_morphology_blocked",
        path: `${RESULT_ARTIFACT_PATH}.points.${pointId}.absoluteMorphologyFailures`,
        message: `${pointId} recorded absolute morphology blockers: ${point.absoluteMorphologyFailures.join(", ")}`,
      });
    }
  }
}

function validatePreflightBoundary(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
  warnings: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  const preflight = evidence.preflight;
  const expectedAbsoluteMorphologyFailureCount =
    evidence.points.reduce((sum, point) => sum + absoluteMorphologyFailuresForPoint(evidence, point).length, 0);
  const expectedCandidatePassPointCount =
    evidence.points.filter((point) =>
      classifyPoint(evidence, point, absoluteMorphologyFailuresForPoint(evidence, point))
      === "candidate-pass-diagnostic-only"
    ).length;
  const expectedReadiness = expectedPreflightReadiness(evidence);
  if (
    preflight.expectedPointCount !== EXPECTED_SWEEP_POINT_IDS.length
    || preflight.completePointCount !== evidence.points.filter((point) => point.bothBranchesPresent).length
    || preflight.candidatePassPointCount !== expectedCandidatePassPointCount
    || preflight.landSolveFailureCount !== evidence.landProviderInstrumentation.landSolveFailureCount
    || preflight.stockRunnerErrorCount !== evidence.runner.stock.errorCount
    || preflight.landRunnerErrorCount !== evidence.runner.land.errorCount
    || preflight.absoluteMorphologyFailureCount !== expectedAbsoluteMorphologyFailureCount
    || preflight.readiness !== expectedReadiness
    || preflight.defaultFlipInThisArtifact !== false
    || preflight.legacyDeletionReadiness !== "blocked-freeze-reference"
  ) {
    addIssue(errors, "phase5x_preflight_consistency", `${RESULT_ARTIFACT_PATH}.preflight`, "Preflight summary must match point, runner, and instrumentation evidence and keep default flip/legacy deletion blocked.");
  }
  if (
    preflight.readiness === "ready-for-separate-default-flip-pr-with-legacy-frozen"
    && (!evidence.normalOperatingPointFloor.pass
      || preflight.absoluteMorphologyFailureCount !== 0
      || evidence.points.some((point) => !point.landHealthOk || !point.land?.settled))
  ) {
    addIssue(errors, "phase5x_readiness_inconsistent", `${RESULT_ARTIFACT_PATH}.preflight.readiness`, "Ready status requires normal-floor pass, zero absolute morphology failures, and settled health-ok Land points.");
  }
  if (preflight.readiness === "blocked-before-default-flip") {
    warnings.push({
      severity: "warning",
      code: "phase5x_preflight_blocked",
      path: `${RESULT_ARTIFACT_PATH}.preflight.readiness`,
      message: "Phase 5X evidence blocks runtime default flip until recorded blockers are resolved or explicitly accepted.",
    });
  }
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5x_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "Phase 5X must keep all claim boundary flags blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5x_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5X must keep ${token} blocked.`);
    }
  }
}

function normalFloorFailures(evidence: LvLandDefaultCandidatePreflightPhase5XEvidence): string[] {
  const observed = evidence.normalOperatingPointFloor.observed;
  return Object.entries(EXPECTED_NORMAL_FLOOR_THRESHOLDS)
    .filter(([key, threshold]) => {
      const value = observed[key as keyof typeof observed];
      return value == null || value < threshold.min || value > threshold.max;
    })
    .map(([key]) => key)
    .sort();
}

function normalFloorPass(evidence: LvLandDefaultCandidatePreflightPhase5XEvidence): boolean {
  return normalFloorFailures(evidence).length === 0;
}

function absoluteMorphologyFailuresForPoint(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  point: LvLandDefaultCandidatePreflightPhase5XEvidence["points"][number],
): string[] {
  const thresholds = evidence.protocol.morphologyAbsoluteThresholds;
  const failures: string[] = [];
  for (const metric of point.metricDeltas) {
    if (metric.landMean == null) {
      failures.push(`missing-land-metric:${metric.chamber}:${metric.metricId}`);
      continue;
    }
    if (metric.metricId === "qDotClampHitFraction" && metric.landMean > thresholds.qDotClampHitFractionMax) {
      failures.push(`qdot-clamp-high:${metric.chamber}:${metric.landMean}`);
    }
    if (
      (metric.metricId === "aovOpenEjectionSquareness" || metric.metricId === "pvOpenEjectionSquareness")
      && metric.landMean > thresholds.ejectionSquarenessMax
    ) {
      failures.push(`ejection-squareness-high:${metric.chamber}:${metric.landMean}`);
    }
    if (metric.metricId === "lowerLimbKinkCount" && metric.landMean > thresholds.lowerLimbKinkCountMax) {
      failures.push(`lower-limb-kinks-high:${metric.chamber}:${metric.landMean}`);
    }
    if (
      (metric.metricId === "mvOpenLowerLimbRoughness" || metric.metricId === "tvOpenLowerLimbRoughness")
      && metric.landMean > thresholds.openLowerLimbRoughnessMax
    ) {
      failures.push(`open-limb-roughness-high:${metric.chamber}:${metric.landMean}`);
    }
    if (metric.metricId === "uncertainSampleFraction" && metric.landMean > thresholds.uncertainSampleFractionMax) {
      failures.push(`uncertain-sample-fraction-high:${metric.chamber}:${metric.landMean}`);
    }
  }
  return [...new Set(failures)].sort();
}

function classifyPoint(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
  point: LvLandDefaultCandidatePreflightPhase5XEvidence["points"][number],
  morphologyFailures: readonly string[],
): LvLandDefaultCandidatePreflightPhase5XEvidence["points"][number]["classification"] {
  if (point.stock == null || point.land == null) return "missing-branch-blocker";
  if (point.id === "normal-floor" && !normalFloorPass(evidence)) return "blocked-by-normal-floor";
  if (!point.land.settled || point.land.health.status !== "ok") return "blocked-by-land-health-or-settle";
  if (morphologyFailures.length > 0) return "blocked-by-morphology-absolute-gate";
  return "candidate-pass-diagnostic-only";
}

function expectedPreflightReadiness(
  evidence: LvLandDefaultCandidatePreflightPhase5XEvidence,
): LvLandDefaultCandidatePreflightPhase5XEvidence["preflight"]["readiness"] {
  const absoluteMorphologyFailureCount =
    evidence.points.reduce((sum, point) => sum + absoluteMorphologyFailuresForPoint(evidence, point).length, 0);
  return normalFloorPass(evidence)
    && evidence.runner.stock.errorCount === 0
    && evidence.runner.land.errorCount === 0
    && evidence.landProviderInstrumentation.landSolveFailureCount === 0
    && evidence.points.every((point) => point.bothBranchesPresent)
    && absoluteMorphologyFailureCount === 0
    && evidence.points.every((point) => point.landHealthOk && point.land?.settled)
    ? "ready-for-separate-default-flip-pr-with-legacy-frozen"
    : "blocked-before-default-flip";
}

function validateSourceText(
  rootDir: string,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_RUNNER_PATH, errors),
    readRequiredText(rootDir, MEASURE_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, ROADMAP_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_README_PATH, errors),
    readRequiredText(rootDir, HISTORICAL_LANES_PATH, errors),
    readRequiredText(rootDir, PACKAGE_PATH, errors),
  ];
  for (const file of files) {
    if (file) validateNoLocalAbsolutePaths(file.path, file.text, errors);
  }
  const builderText = textFor(files, BUILDER_PATH);
  const runnerText = textFor(files, MORPHOLOGY_RUNNER_PATH);
  const measureText = textFor(files, MEASURE_PATH);
  const packageText = textFor(files, PACKAGE_PATH);
  const readmeText = textFor(files, README_PATH);
  const roadmapText = textFor(files, ROADMAP_PATH);
  const morphologyReadmeText = textFor(files, MORPHOLOGY_README_PATH);
  const lanesText = textFor(files, HISTORICAL_LANES_PATH);

  if (
    !builderText.includes("normal-floor-plus-one-axis-user-knob-sweep-v1")
    || !builderText.includes("createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions")
    || !builderText.includes("freeze-positive-control-reference-do-not-delete")
    || !builderText.includes("not-individually-tuned-until-model-stabilizes")
    || !builderText.includes("noTrefFudge: true")
  ) {
    addIssue(errors, "phase5x_builder_contract", BUILDER_PATH, "Builder must implement the user-knob stock/Land preflight and migration boundaries.");
  }
  if (!runnerText.includes("caseDocuments?: readonly CaseDocument[]") || !runnerText.includes("experimentalOptions?: ModelCoreExperimentalOptions")) {
    addIssue(errors, "phase5x_runner_contract", MORPHOLOGY_RUNNER_PATH, "PV-loop morphology runner must support synthetic case documents and experimental ModelCore options.");
  }
  if (!measureText.includes("experimentalOptions?: ModelCoreExperimentalOptions") || !measureText.includes("new ModelCore(params, opt.experimentalOptions)")) {
    addIssue(errors, "phase5x_measure_contract", MEASURE_PATH, "measureConverged path must pass experimental ModelCore options through to ModelCore.");
  }
  if (!packageText.includes("verify:myocardium-lv-land-default-candidate-preflight")) {
    addIssue(errors, "phase5x_package_script", PACKAGE_PATH, "package.json must expose the Phase 5X verifier script.");
  }
  if (
    !readmeText.includes("Phase 5X")
    || !roadmapText.includes("Phase 5X")
    || !morphologyReadmeText.includes("Phase 5X")
    || !lanesText.includes("lv-land-default-candidate-preflight-phase5x-result-v1")
    || !lanesText.includes("developer-only LV Land envelope")
  ) {
    addIssue(errors, "phase5x_docs", "docs", "Docs must record Phase 5X preflight evidence and retain the Phase 5W developer-only LV Land envelope wording.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  const forbidden = [
    "lv-land-default-candidate-preflight-phase5x-result-v1",
    "verify:myocardium-lv-land-default-candidate-preflight",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5x_no_production_wiring", relative, `Production-facing file must not wire Phase 5X diagnostic token ${token}.`);
        }
      }
    }
  }
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5x_local_path", pathLabel, "Committed Phase 5X evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5x_missing_file", relativePath, "Required Phase 5X file is missing.");
    return null;
  }
}

function textFor(
  files: readonly ({ readonly path: string; readonly text: string } | null)[],
  pathLabel: string,
): string {
  return files.find((file) => file?.path === pathLabel)?.text ?? "";
}

function listFilesIfPresent(absolutePath: string): string[] {
  try {
    const stat = statSync(absolutePath);
    if (stat.isFile()) return [absolutePath];
    if (!stat.isDirectory()) return [];
    return readdirSync(absolutePath).flatMap((entry) => listFilesIfPresent(path.join(absolutePath, entry)));
  } catch {
    return [];
  }
}

function arrayEquals(left: readonly unknown[], right: readonly unknown[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function addIssue(
  issues: LvLandDefaultCandidatePreflightPhase5XValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateLvLandDefaultCandidatePreflightPhase5X(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
  });
  console.log(
    `LV Land default-candidate preflight Phase 5X ${report.pass ? "PASS" : "FAIL"} `
    + `points=${report.evidence.preflight.completePointCount}/${report.evidence.preflight.expectedPointCount} `
    + `readiness=${report.evidence.preflight.readiness} `
    + `morphologyFailures=${report.evidence.preflight.absoluteMorphologyFailureCount} `
    + `errors=${report.errors.length} warnings=${report.warnings.length}`,
  );
  for (const issue of [...report.errors, ...report.warnings]) {
    console.log(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
  if (!report.pass) process.exitCode = 1;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyLvLandDefaultCandidatePreflightPhase5X.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
