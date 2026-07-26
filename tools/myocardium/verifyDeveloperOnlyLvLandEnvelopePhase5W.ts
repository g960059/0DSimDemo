import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-envelope-phase5w-result-v1.json";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_ENVELOPE_PHASE5W_ID,
  buildDeveloperOnlyLvLandEnvelopePhase5WEvidence,
  type DeveloperOnlyLvLandEnvelopePhase5WEvidence,
} from "@/tools/myocardium/buildDeveloperOnlyLvLandEnvelopePhase5W";

export type DeveloperOnlyLvLandEnvelopePhase5WValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type DeveloperOnlyLvLandEnvelopePhase5WValidationReport = {
  readonly pass: boolean;
  readonly evidence: DeveloperOnlyLvLandEnvelopePhase5WEvidence;
  readonly errors: readonly DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[];
  readonly warnings: readonly DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[];
};

export type DeveloperOnlyLvLandEnvelopePhase5WValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/myocardium-developer-only-lv-land-envelope-phase5w-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildDeveloperOnlyLvLandEnvelopePhase5W.ts";
const VERIFIER_PATH = "tools/myocardium/verifyDeveloperOnlyLvLandEnvelopePhase5W.ts";
const HELPER_PATH = "tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const PACKAGE_PATH = "package.json";
const EXPECTED_POINT_IDS = [
  "hr75-tbv4350-low-edge",
  "hr75-tbv5600-main",
  "hr75-tbv6600-main-high",
  "hr90-tbv4350-low-edge",
  "hr90-tbv5600-main",
  "hr90-tbv6600-main-high",
] as const;
const EXPECTED_MODEL_PATH_IDS = [
  "stock-active-no-provider-v0",
  "developer-only-lv-land-v0",
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

export function validateDeveloperOnlyLvLandEnvelopePhase5W(
  rootDir = process.cwd(),
  options: DeveloperOnlyLvLandEnvelopePhase5WValidationOptions = {},
): DeveloperOnlyLvLandEnvelopePhase5WValidationReport {
  const errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[] = [];
  const warnings: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[] = [];
  const evidence = resultArtifact as DeveloperOnlyLvLandEnvelopePhase5WEvidence;

  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validateRuns(evidence, errors);
  validateComparisons(evidence, errors);
  validateRunHealth(evidence, errors, warnings);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  if (options.rebuildEvidence === true) validateFreshEvidence(evidence, errors);
  else {
    warnings.push({
      severity: "warning",
      code: "phase5w_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5W rebuild is intentionally opt-in because it runs a 12-run measured envelope.",
    });
  }
  warnings.push({
    severity: "warning",
    code: "phase5w_developer_only_not_runtime_acceptance",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5W is developer-only envelope evidence; production replacement, official cases, Workbench, and state schema remain blocked.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: DeveloperOnlyLvLandEnvelopePhase5WEvidence,
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): void {
  const fresh = buildDeveloperOnlyLvLandEnvelopePhase5WEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5w_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5W result artifact must match a fresh measured builder run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: DeveloperOnlyLvLandEnvelopePhase5WEvidence,
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_ENVELOPE_PHASE5W_ID
    || evidence.phase !== "Phase 5W"
    || evidence.claimBoundary !== "developer-only-lv-land-envelope-expansion-diagnostic-only"
    || evidence.upstreamPhase5VArtifactId !== "myocardium-developer-only-lv-land-runtime-flag-suite-result-v1"
    || evidence.verifierScript !== "verify:myocardium-developer-only-lv-land-envelope"
    || evidence.oracleDirectionSession !== "direction-after-pr218-light"
  ) {
    addIssue(errors, "phase5w_identity", RESULT_ARTIFACT_PATH, "Phase 5W evidence identity or upstream links are invalid.");
  }
}

function validateProtocol(
  evidence: DeveloperOnlyLvLandEnvelopePhase5WEvidence,
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): void {
  if (
    evidence.protocol.matrixMode !== "hr-preload-main-domain-envelope-v1"
    || !arrayEquals(evidence.protocol.modelPathIds, EXPECTED_MODEL_PATH_IDS)
    || !arrayEquals(evidence.protocol.points.map((point) => point.id), EXPECTED_POINT_IDS)
    || evidence.protocol.dtSec !== 0.001
    || evidence.protocol.settleSampleHz !== 240
    || evidence.protocol.requestedMeasurementSampleHz !== 240
    || evidence.protocol.measurementSampleHz !== 1000
    || evidence.protocol.capTailMeasurementSampleHz !== 1000
    || evidence.protocol.minimumMeasureBeats !== 3
    || evidence.protocol.period2MeasureBeats !== 4
    || evidence.protocol.settlePolicy.capSeconds !== 90
    || evidence.protocol.settlePolicy.minBeats !== 8
    || evidence.protocol.settlePolicy.consecutiveBeats !== 3
    || evidence.protocol.pointInitialization !== "independent-from-target-tbv-no-cross-point-warm-start"
    || evidence.protocol.sourceProviderScope !== "LV-only"
    || evidence.protocol.calciumMappingScenario !== "phase2b-absolute-peak-ca"
    || evidence.protocol.commitScheme !== "BE"
  ) {
    addIssue(errors, "phase5w_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5W must record the HR75/90 x TBV 4350/5600/6600 developer-only envelope protocol.");
  }
}

function validateRuns(
  evidence: DeveloperOnlyLvLandEnvelopePhase5WEvidence,
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): void {
  if (evidence.runs.length !== EXPECTED_POINT_IDS.length * EXPECTED_MODEL_PATH_IDS.length) {
    addIssue(errors, "phase5w_run_count", `${RESULT_ARTIFACT_PATH}.runs`, "Phase 5W must record stock and developer-only Land runs for every envelope point.");
  }
  for (const pointId of EXPECTED_POINT_IDS) {
    for (const modelPathId of EXPECTED_MODEL_PATH_IDS) {
      const run = evidence.runs.find((candidate) =>
        candidate.pointId === pointId && candidate.modelPathId === modelPathId
      );
      if (!run) {
        addIssue(errors, "phase5w_missing_run", `${RESULT_ARTIFACT_PATH}.runs`, `Missing Phase 5W run ${pointId}/${modelPathId}.`);
        continue;
      }
      if (run.settleActualSeconds == null || run.settleActualSeconds > 95 || run.settleBeats < 1) {
        addIssue(errors, "phase5w_settle_status", `${RESULT_ARTIFACT_PATH}.runs.${pointId}.${modelPathId}`, "Each run must record finite settle time and completed beats.");
      }
      if (run.domainRole === "main-domain" && run.modelPathId === "developer-only-lv-land-v0" && run.healthStatus !== "ok") {
        addIssue(errors, "phase5w_main_domain_land_health", `${RESULT_ARTIFACT_PATH}.runs.${pointId}.${modelPathId}`, "Main-domain developer-only Land runs must have health ok before any production-shadow follow-up.");
      }
      if (run.domainRole === "main-domain" && run.modelPathId === "developer-only-lv-land-v0" && run.settled !== true) {
        addIssue(errors, "phase5w_main_domain_land_settled", `${RESULT_ARTIFACT_PATH}.runs.${pointId}.${modelPathId}`, "Main-domain developer-only Land runs must settle before any production-shadow follow-up.");
      }
      const expectedMeasureBeats = run.periodBeats === 2 ? 4 : run.periodBeats === 1 ? 3 : null;
      const expectedMetricWindowBeats = run.periodBeats === 2 ? 2 : run.periodBeats === 1 ? 1 : null;
      if (
        run.window.sampleCount < 100
        || expectedMeasureBeats == null
        || expectedMetricWindowBeats == null
        || run.window.measureBeats !== expectedMeasureBeats
        || run.window.metricWindowBeats !== expectedMetricWindowBeats
        || run.window.QAoPeakMlPerSec == null
        || run.window.valves.AoV == null
      ) {
        addIssue(errors, "phase5w_window", `${RESULT_ARTIFACT_PATH}.runs.${pointId}.${modelPathId}.window`, "Each run must record a usable measurement or cap-tail window with period-aware measure/metric beats.");
      }
      if (modelPathId === "stock-active-no-provider-v0") {
        if (run.experimentalActiveSourceProvider !== false || run.sourceProviderId !== null || run.providerInstrumentation !== null) {
          addIssue(errors, "phase5w_stock_path", `${RESULT_ARTIFACT_PATH}.runs.${pointId}.${modelPathId}`, "Stock active path must not use experimental provider instrumentation.");
        }
      } else {
        if (
          run.experimentalActiveSourceProvider !== true
          || !run.sourceProviderId?.includes("phase5u-developer-only-be-phase5q-calcium")
          || run.providerInstrumentation == null
          || run.providerInstrumentation.sourceActiveStressCallCount <= 0
          || run.providerInstrumentation.commitProviderStateAfterStepCount <= 0
          || run.providerInstrumentation.landSolveFailureCount !== 0
          || run.providerInstrumentation.landSolveOkCount <= 0
        ) {
          addIssue(errors, "phase5w_land_provider", `${RESULT_ARTIFACT_PATH}.runs.${pointId}.${modelPathId}`, "Developer-only Land run must exercise source/commit paths with zero Land solve failures.");
        }
      }
    }
  }
}

function validateComparisons(
  evidence: DeveloperOnlyLvLandEnvelopePhase5WEvidence,
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): void {
  if (evidence.comparisons.length !== EXPECTED_POINT_IDS.length) {
    addIssue(errors, "phase5w_comparison_count", `${RESULT_ARTIFACT_PATH}.comparisons`, "Phase 5W must compare stock and Land at every envelope point.");
  }
  for (const comparison of evidence.comparisons) {
    if (
      !EXPECTED_POINT_IDS.includes(comparison.pointId as typeof EXPECTED_POINT_IDS[number])
      || comparison.sameClosureInvariant !== true
      || comparison.landSolveFailureCount !== 0
      || comparison.landSourceAndCommitPresent !== true
    ) {
      addIssue(errors, "phase5w_comparison_health", `${RESULT_ARTIFACT_PATH}.comparisons.${comparison.pointId}`, "Each stock/Land comparison must preserve closure invariants and Land source/commit health.");
    }
    if (comparison.domainRole === "main-domain" && comparison.bothHealthOk !== true) {
      addIssue(errors, "phase5w_main_domain_comparison_health", `${RESULT_ARTIFACT_PATH}.comparisons.${comparison.pointId}`, "Main-domain stock/Land comparisons must both have health ok.");
    }
  }
}

function validateRunHealth(
  evidence: DeveloperOnlyLvLandEnvelopePhase5WEvidence,
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
  warnings: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): void {
  const health = evidence.runHealth;
  if (
    health.runCount !== 12
    || health.healthOkRunCount < 10
    || health.mainDomainLandRunCount !== 4
    || health.mainDomainLandSettledCount !== 4
    || health.mainDomainLandHealthOkCount !== 4
    || health.landSolveFailureCount !== 0
    || health.landSourceCallsPresentEveryRun !== true
    || health.landCommitCallsPresentEveryRun !== true
  ) {
    addIssue(errors, "phase5w_run_health", `${RESULT_ARTIFACT_PATH}.runHealth`, "Phase 5W run health must cover all 12 runs and clean Land source/commit paths.");
  }
  if (health.mainDomainLandAllPeriod1 !== true) {
    warnings.push({
      severity: "warning",
      code: "phase5w_main_domain_period2_present",
      path: `${RESULT_ARTIFACT_PATH}.runHealth.mainDomainLandAllPeriod1`,
      message: "At least one main-domain developer-only Land point settled as period-2; this is bounded evidence and does not unlock production replacement.",
    });
  }
}

function validateBoundary(
  evidence: DeveloperOnlyLvLandEnvelopePhase5WEvidence,
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5w_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "Phase 5W must keep all claim boundary flags blocked.");
    }
  }
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
  ] as const) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5w_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5W must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(rootDir: string, errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[]): void {
  const builderText = readRequiredText(rootDir, BUILDER_PATH, errors);
  const verifierText = readRequiredText(rootDir, VERIFIER_PATH, errors);
  const helperText = readRequiredText(rootDir, HELPER_PATH, errors);
  const packageText = readRequiredText(rootDir, PACKAGE_PATH, errors);
  const readmeText = readRequiredText(rootDir, README_PATH, errors);
  const roadmapText = readRequiredText(rootDir, ROADMAP_PATH, errors);

  if (
    builderText
    && (!builderText.includes("hr-preload-main-domain-envelope-v1")
      || !builderText.includes("DEFAULT_SETTLE_POLICY")
      || !builderText.includes("createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions")
      || !builderText.includes("stock-active-no-provider-v0")
      || !builderText.includes("developer-only-lv-land-v0")
      || !builderText.includes("metricWindowBeatsForPeriod")
      || !builderText.includes("sameClosureInvariant")
      || !builderText.includes("noRuntimeReplacement: true"))
  ) {
    addIssue(errors, "phase5w_builder_contract", BUILDER_PATH, "Builder must implement the measured developer-only stock/Land envelope and claim boundaries.");
  }
  if (verifierText && !verifierText.includes("validateNoProductionWiring")) {
    addIssue(errors, "phase5w_verifier_contract", VERIFIER_PATH, "Verifier must scan production targets for Phase 5W diagnostic token leaks.");
  }
  if (helperText && !helperText.includes("phase5u-developer-only-be-phase5q-calcium")) {
    addIssue(errors, "phase5w_helper_contract", HELPER_PATH, "Phase 5W must reuse the Phase 5U developer-only Land helper.");
  }
  if (packageText && !packageText.includes("verify:myocardium-developer-only-lv-land-envelope")) {
    addIssue(errors, "phase5w_package_script", PACKAGE_PATH, "package.json must expose the Phase 5W verifier script.");
  }
  if (readmeText && (!readmeText.includes("Phase 5W") || !readmeText.includes("developer-only LV Land envelope"))) {
    addIssue(errors, "phase5w_readme", README_PATH, "README must summarize Phase 5W developer-only envelope evidence.");
  }
  if (roadmapText && (!roadmapText.includes("Phase 5W") || !roadmapText.includes("developer-only LV Land envelope"))) {
    addIssue(errors, "phase5w_roadmap", ROADMAP_PATH, "Roadmap must record Phase 5W and keep production replacement blocked.");
  }
}

function validateNoProductionWiring(rootDir: string, errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[]): void {
  const forbidden = [
    "myocardium-developer-only-lv-land-envelope-phase5w-result-v1",
    "developer-only-lv-land-v0",
    "verify:myocardium-developer-only-lv-land-envelope",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!exists(absolutePath)) continue;
    if (statSync(absolutePath).isDirectory()) {
      for (const filePath of walkTextFiles(absolutePath)) scanProductionText(rootDir, filePath, forbidden, errors);
    } else {
      scanProductionText(rootDir, absolutePath, forbidden, errors);
    }
  }
}

function scanProductionText(
  rootDir: string,
  filePath: string,
  forbidden: readonly string[],
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): void {
  const relativePath = path.relative(rootDir, filePath);
  if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relativePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const token of forbidden) {
    if (text.includes(token)) {
      addIssue(errors, "phase5w_no_production_wiring", relativePath, `Production-facing file must not wire Phase 5W diagnostic token ${token}.`);
    }
  }
}

function walkTextFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const filePath = path.join(dir, entry);
    if (statSync(filePath).isDirectory()) return walkTextFiles(filePath);
    return [filePath];
  });
}

function readRequiredText(
  rootDir: string,
  filePath: string,
  errors: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
    addIssue(errors, "phase5w_missing_source", filePath, `${filePath} must be readable for Phase 5W validation.`);
    return null;
  }
}

function exists(filePath: string): boolean {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function arrayEquals<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function addIssue(
  issues: DeveloperOnlyLvLandEnvelopePhase5WValidationIssue[],
  code: string,
  issuePath: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: issuePath, message });
}

function printReport(report: DeveloperOnlyLvLandEnvelopePhase5WValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `Developer-only LV Land Phase 5W envelope ${status} `
    + `runs=${report.evidence.runHealth.runCount} `
    + `mainDomainLandSettled=${report.evidence.runHealth.mainDomainLandSettledCount}/`
    + `${report.evidence.runHealth.mainDomainLandRunCount} `
    + `errors=${report.errors.length} warnings=${report.warnings.length}`,
  );
  for (const error of report.errors) {
    console.error(`${error.severity.toUpperCase()} ${error.code} ${error.path}: ${error.message}`);
  }
  for (const warning of report.warnings) {
    console.warn(`${warning.severity.toUpperCase()} ${warning.code} ${warning.path}: ${warning.message}`);
  }
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const report = validateDeveloperOnlyLvLandEnvelopePhase5W(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
  });
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
