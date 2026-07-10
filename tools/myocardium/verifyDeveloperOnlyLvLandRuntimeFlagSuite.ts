import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_SUITE_ID,
  buildDeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  type DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
} from "@/tools/myocardium/buildDeveloperOnlyLvLandRuntimeFlagSuite";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type DeveloperOnlyLvLandRuntimeFlagSuiteValidationReport = {
  readonly pass: boolean;
  readonly evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildDeveloperOnlyLvLandRuntimeFlagSuite.ts";
const HELPER_PATH = "tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag.ts";
const VERIFIER_PATH = "tools/myocardium/verifyDeveloperOnlyLvLandRuntimeFlagSuite.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";
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
  "features/workbench/WorkbenchRoute.tsx",
  "features/workbench/casePublish.ts",
  "features/workbench/controllerBinding.ts",
  "features/workbench/instanceRuntime.ts",
  "features/workbench/publish/PublishDialog.tsx",
  "features/workbench/publish/usePreviewRuntime.ts",
  "features/workbench/workbenchDefaults.ts",
  "WorkbenchPage.tsx",
  "officialCases.ts",
  "features/workbench/hooks/useWorkbenchScene.ts",
  "features/workbench/hooks/useWorkbenchSimulation.ts",
  "features/workbench/hooks/useWorkbenchPersistence.ts",
] as const;
const PRODUCTION_TARGET_DIRECTORIES = [
  "components/workbench",
  "engine/myocardium",
  "features/workbench",
] as const;

export function validateDeveloperOnlyLvLandRuntimeFlagSuite(rootDir = process.cwd()):
DeveloperOnlyLvLandRuntimeFlagSuiteValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildDeveloperOnlyLvLandRuntimeFlagSuiteEvidence();
  const artifact = resultArtifact as DeveloperOnlyLvLandRuntimeFlagSuiteEvidence;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);
  validateProductionTargets(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_SUITE_ID
    || evidence.phase !== "Phase 5V"
    || evidence.claimBoundary !== "developer-only-runtime-flag-implementation-diagnostic-only"
    || evidence.upstreamPhase5SArtifactId !== "modelcore-land-operating-point-calibration-result-v1"
    || evidence.upstreamPhase5UArtifactId !== "myocardium-developer-only-lv-land-runtime-flag-rfc-v1"
    || evidence.verifierScript !== "verify:myocardium-developer-only-lv-land-runtime-flag-suite"
  ) {
    addIssue(errors, "phase5v_identity", "live-evidence", "Phase 5V evidence must identify the developer-only runtime flag implementation diagnostic.");
  }
  validateOwnerScope(evidence, errors);
  validateImplementationStatus(evidence, errors);
  validateProtocol(evidence, errors);
  validateRunHealth(evidence, errors);
  validatePoints(evidence, errors);
  validateBoundary(evidence, errors);
  validateDoesNotUnlock(evidence, errors);
  warnings.push({
    severity: "warning",
    code: "phase5v_developer_only_not_runtime_acceptance",
    path: "live-evidence.claimBoundary",
    message: "Phase 5V implements and measures only a developer-only flag harness; production runtime, cases, Workbench, and schema remain blocked.",
  });
}

function validateOwnerScope(
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
): void {
  const scope = evidence.ownerGoScope;
  if (
    scope.status !== "go-developer-only-implementation-only"
    || scope.source !== "oracle-direction-review-3-2"
    || scope.productionRuntimeReplacement !== "no-go"
    || scope.officialCaseWiring !== "no-go"
    || scope.workbenchRuntimeWiring !== "no-go"
    || scope.stateSchemaMigration !== "no-go"
  ) {
    addIssue(errors, "phase5v_owner_scope", "live-evidence.ownerGoScope", "Phase 5V GO scope must remain developer-only with production/runtime/case/workbench/schema no-go.");
  }
}

function validateImplementationStatus(
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
): void {
  const status = evidence.implementationStatus;
  if (
    status.developerOnlyFlagPathImplemented !== true
    || status.explicitAcknowledgementRequired !== true
    || status.productionRuntimeWiring !== "absent"
    || status.officialCaseWiring !== "absent"
    || status.workbenchRuntimeWiring !== "absent"
    || status.stateSchemaMigration !== "absent"
    || status.runtimeFlagUi !== "absent"
    || status.productionRegistryIntegration !== "absent"
  ) {
    addIssue(errors, "phase5v_implementation_status", "live-evidence.implementationStatus", "Phase 5V may implement only the developer-only flag harness; production surfaces must remain absent.");
  }
}

function validateProtocol(
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
): void {
  const protocol = evidence.diagnosticProtocol;
  if (
    protocol.suiteMode !== "phase5s-equivalent-operating-suite-via-developer-only-helper"
    || !arrayEquals(protocol.diagnosticDeltasMl, [-1250, 0, 1000])
    || !arrayEquals(protocol.mainDomainDeltasMl, [0, 1000])
    || protocol.sourceProviderScope !== "LV-only"
    || protocol.calciumMappingScenario !== "phase2b-absolute-peak-ca"
    || protocol.commitScheme !== "BE"
    || protocol.preloadAxisMode !== "fixed-diagnostic-operating-points-not-tuning"
    || protocol.pointInitialization !== "independent-from-target-tbv-no-cross-point-warm-start"
  ) {
    addIssue(errors, "phase5v_protocol", "live-evidence.diagnosticProtocol", "Phase 5V must rerun the fixed Phase 5S operating suite through the developer-only helper with no tuning.");
  }
}

function validateRunHealth(
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
): void {
  const health = evidence.runHealth;
  if (
    health.pointCount !== 3
    || health.pointsSettledByConvergence !== 3
    || health.pointsCapOrNonOk !== 0
    || health.landSolveFailureCount !== 0
    || health.sourceCallsPresentEveryPoint !== true
    || health.commitCallsPresentEveryPoint !== true
    || health.sourceAuditSamplesPresentEveryPoint !== true
    || health.commitAuditSamplesPresentEveryPoint !== true
    || health.mainDomainAllPeriod1 !== true
    || health.mainDomainOutputReproducesPhase5S !== true
    || health.allPointsReproducePhase5S !== true
  ) {
    addIssue(errors, "phase5v_run_health", "live-evidence.runHealth", "Developer-only flag suite must reproduce Phase 5S with clean source/commit/solve health.");
  }
}

function validatePoints(
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
): void {
  if (evidence.points.length !== 3) {
    addIssue(errors, "phase5v_point_count", "live-evidence.points", "Phase 5V must record the three Phase 5S diagnostic points.");
    return;
  }
  for (const point of evidence.points) {
    if (
      !point.sourceProviderId.includes("phase5u-developer-only-be-phase5q-calcium")
      || point.settled !== true
      || point.settleReason !== "converged"
      || point.healthStatus !== "ok"
      || point.tbvClassification !== "clean"
      || point.providerInstrumentation.sourceActiveStressCallCount <= 0
      || point.providerInstrumentation.commitProviderStateAfterStepCount <= 0
      || point.providerInstrumentation.landSolveFailureCount !== 0
      || point.providerInstrumentation.landSolveOkCount <= 0
      || point.providerInstrumentation.sourcePathAuditSampleCount <= 0
      || point.providerInstrumentation.commitPathAuditSampleCount <= 0
      || point.phase5SComparison.sameSettled !== true
      || point.phase5SComparison.sameHealthStatus !== true
      || point.phase5SComparison.sameSettleReason !== true
      || point.phase5SComparison.samePeriodBeats !== true
      || point.phase5SComparison.sameTbvClassification !== true
      || point.phase5SComparison.sameFillingMorphologyClass !== true
      || point.phase5SComparison.metricsNearPhase5S !== true
      || point.phase5SComparison.maxRelativeMetricError > 1e-9
      || point.phase5SComparison.comparedMetricIds.length < 16
    ) {
      addIssue(errors, "phase5v_point_health", `live-evidence.points.${point.deltaVolumeMl}`, "Each Phase 5V point must be clean, source/commit exercised, and numerically reproduce Phase 5S Land output.");
    }
  }
}

function validateBoundary(
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5v_boundary", `live-evidence.boundary.${key}`, "All Phase 5V boundary flags must remain true.");
    }
  }
}

function validateDoesNotUnlock(
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
): void {
  for (const token of [
    "runtimeReplacement",
    "officialCaseWiring",
    "workbenchRuntimeWiring",
    "stateSchemaMigration",
    "runtimeFlagUi",
    "productionRegistryIntegration",
    "officialMorphologyAcceptance",
    "finalNoAlternans",
    "structuralAlternansRemoval",
    "Level3Acceptance",
    "Level4Acceptance",
    "qDotTuning",
    "valveThresholdTuning",
    "arterialLoadTuning",
    "preloadTuning",
    "landParameterTuning",
    "sourceStressScaling",
    "clinicalDecisionSupport",
    "scientificValidationClaim",
  ] as const) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5v_does_not_unlock", "live-evidence.doesNotUnlock", `Phase 5V must keep ${token} blocked.`);
    }
  }
}

function validateArtifact(
  artifact: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  evidence: DeveloperOnlyLvLandRuntimeFlagSuiteEvidence,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5v_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match live Phase 5V evidence.");
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const helperText = readRequiredText(rootDir, HELPER_PATH, errors);
  const builderText = readRequiredText(rootDir, BUILDER_PATH, errors);
  const verifierText = readRequiredText(rootDir, VERIFIER_PATH, errors);
  const readmeText = readRequiredText(rootDir, README_PATH, errors);
  const roadmapText = readRequiredText(rootDir, ROADMAP_PATH, errors);
  const lanesText = readRequiredText(rootDir, HISTORICAL_LANES_PATH, errors);
  const packageText = readRequiredText(rootDir, "package.json", errors);

  if (
    helperText
    && (!helperText.includes(MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT)
      || !helperText.includes("phase5u-developer-only-be-phase5q-calcium"))
  ) {
    addIssue(errors, "phase5v_helper_contract", HELPER_PATH, "Phase 5V must use the Phase 5U helper with explicit acknowledgement and fixed provider id suffix.");
  }
  if (
    builderText
    && (!builderText.includes("phase5s-equivalent-operating-suite-via-developer-only-helper")
      || !builderText.includes("oracle-direction-review-3-2")
      || !builderText.includes("runLowPreloadDebug")
      || !builderText.includes("productionRuntimeReplacement: \"no-go\"")
      || !builderText.includes("COMPARED_PHASE5S_METRIC_IDS"))
  ) {
    addIssue(errors, "phase5v_builder_contract", BUILDER_PATH, "Builder must implement the developer-only measured suite and keep production runtime no-go.");
  }
  if (verifierText && !verifierText.includes("validateProductionTargets")) {
    addIssue(errors, "phase5v_verifier_contract", VERIFIER_PATH, "Verifier must scan production targets for developer-only flag leaks.");
  }
  const normalizedReadmeText = readmeText?.replace(/\s+/g, " ");
  if (
    normalizedReadmeText
    && (!normalizedReadmeText.includes("Phase 5V")
      || !normalizedReadmeText.includes("developer-only LV Land runtime flag")
      || !normalizedReadmeText.includes("production runtime replacement remains blocked"))
  ) {
    addIssue(errors, "phase5v_readme", README_PATH, "README must record Phase 5V as developer-only measured evidence with runtime replacement blocked.");
  }
  if (
    roadmapText
    && (!roadmapText.includes("Phase 5V")
      || !roadmapText.includes("developer-only LV Land runtime flag")
      || !roadmapText.includes("no runtime replacement"))
  ) {
    addIssue(errors, "phase5v_roadmap", ROADMAP_PATH, "Roadmap must record Phase 5V and keep runtime replacement blocked.");
  }
  if (
    lanesText
    && (!lanesText.includes("Phase 5V")
      || !lanesText.includes("developer-only measured operating suite")
      || !lanesText.includes("static/mock"))
  ) {
    addIssue(errors, "phase5v_current_lanes", HISTORICAL_LANES_PATH, "Current lanes must advance from Phase 5V measurement toward static/mock education UX or further developer-only envelopes.");
  }
  if (packageText && !packageText.includes("verify:myocardium-developer-only-lv-land-runtime-flag-suite")) {
    addIssue(errors, "phase5v_package_script", "package.json", "package.json must expose the Phase 5V verifier script.");
  }
}

function validateProductionTargets(rootDir: string, errors: ValidationIssue[]): void {
  const filePaths = new Set<string>(PRODUCTION_TARGET_PATHS);
  for (const dirPath of PRODUCTION_TARGET_DIRECTORIES) {
    for (const filePath of listTextFiles(rootDir, dirPath, errors)) {
      filePaths.add(filePath);
    }
  }
  for (const filePath of filePaths) {
    const text = readRequiredText(rootDir, filePath, errors);
    if (!text) continue;
    if (
      text.includes("modelCoreDeveloperOnlyLandRuntimeFlag")
      || text.includes(MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID)
      || text.includes(MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_SUITE_ID)
      || text.includes("phase5u-developer-only-be-phase5q-calcium")
    ) {
      addIssue(errors, "phase5v_runtime_leak", filePath, "Developer-only Phase 5V flag must not be imported or referenced by production runtime, case, or Workbench files.");
    }
  }
}

function listTextFiles(rootDir: string, dirPath: string, errors: ValidationIssue[]): string[] {
  const absoluteDir = path.join(rootDir, dirPath);
  try {
    const stat = statSync(absoluteDir);
    if (!stat.isDirectory()) return [];
  } catch {
    addIssue(errors, "phase5v_missing_source", dirPath, `${dirPath} must be readable for Phase 5V production leak validation.`);
    return [];
  }
  const result: string[] = [];
  const visit = (relativeDir: string): void => {
    for (const entry of readdirSync(path.join(rootDir, relativeDir), { withFileTypes: true })) {
      const relativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        visit(relativePath);
      } else if (entry.isFile() && /\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(entry.name)) {
        result.push(relativePath);
      }
    }
  };
  visit(dirPath);
  return result;
}

function readRequiredText(rootDir: string, filePath: string, errors: ValidationIssue[]): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
    addIssue(errors, "phase5v_missing_source", filePath, `${filePath} must be readable for Phase 5V validation.`);
    return null;
  }
}

function arrayEquals<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function printReport(report: DeveloperOnlyLvLandRuntimeFlagSuiteValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `Developer-only LV Land runtime flag suite ${status} `
    + `points=${report.evidence.runHealth.pointCount} `
    + `phase5SReproduced=${report.evidence.runHealth.allPointsReproducePhase5S} `
    + `errors=${report.errors.length} warnings=${report.warnings.length}`,
  );
  for (const issue of report.errors) {
    console.error(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
  for (const issue of report.warnings) {
    console.warn(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const report = validateDeveloperOnlyLvLandRuntimeFlagSuite();
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
