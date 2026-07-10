import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json";
import {
  LV_LAND_EJECTION_WINDOW_LOCALIZATION_PHASE5Z_ID,
  buildLvLandEjectionWindowLocalizationPhase5ZEvidence,
  type LvLandEjectionWindowLocalizationPhase5ZEvidence,
  type LvLandEjectionWindowLocalizationPhase5ZPoint,
  type LvLandEjectionWindowLocalizationPhase5ZRun,
} from "@/tools/myocardium/buildLvLandEjectionWindowLocalizationPhase5Z";

export type LvLandEjectionWindowLocalizationPhase5ZValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type LvLandEjectionWindowLocalizationPhase5ZValidationReport = {
  readonly pass: boolean;
  readonly evidence: LvLandEjectionWindowLocalizationPhase5ZEvidence;
  readonly errors: readonly LvLandEjectionWindowLocalizationPhase5ZValidationIssue[];
  readonly warnings: readonly LvLandEjectionWindowLocalizationPhase5ZValidationIssue[];
};

export type LvLandEjectionWindowLocalizationPhase5ZValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildLvLandEjectionWindowLocalizationPhase5Z.ts";
const VERIFIER_PATH = "tools/myocardium/verifyLvLandEjectionWindowLocalizationPhase5Z.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";
const PACKAGE_PATH = "package.json";
const EXPECTED_MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const EXPECTED_POINT_IDS = [
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
const EXPECTED_WINDOW_IDS = [
  "aov-open",
  "aov-open-forward",
  "qao-high-core-50",
  "qao-high-core-75",
  "qdot-hit-in-aov-open",
] as const;
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

export function validateLvLandEjectionWindowLocalizationPhase5Z(
  rootDir = process.cwd(),
  options: LvLandEjectionWindowLocalizationPhase5ZValidationOptions = {},
): LvLandEjectionWindowLocalizationPhase5ZValidationReport {
  const errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[] = [];
  const warnings: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[] = [];
  const evidence = resultArtifact as LvLandEjectionWindowLocalizationPhase5ZEvidence;

  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validatePoints(evidence, errors, warnings);
  validateSummary(evidence, errors, warnings);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  if (options.rebuildEvidence === true) validateFreshEvidence(evidence, errors);
  else {
    warnings.push({
      severity: "warning",
      code: "phase5z_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5Z rebuild is opt-in because it reruns 28 stock/Land measured branches.",
    });
  }
  warnings.push({
    severity: "warning",
    code: "phase5z_default_flip_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5Z tests the ejection-window denominator hypothesis only; runtime default flip and qDot/valve tuning remain blocked.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: LvLandEjectionWindowLocalizationPhase5ZEvidence,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  const fresh = buildLvLandEjectionWindowLocalizationPhase5ZEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5z_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5Z artifact must match a fresh measured builder run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: LvLandEjectionWindowLocalizationPhase5ZEvidence,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== LV_LAND_EJECTION_WINDOW_LOCALIZATION_PHASE5Z_ID
    || evidence.phase !== "Phase 5Z"
    || evidence.claimBoundary !== "ejection-window-localization-diagnostic-only-no-tuning"
    || evidence.upstreamPhase5XArtifactId !== "lv-land-default-candidate-preflight-phase5x-result-v1"
    || evidence.upstreamPhase5YArtifactId !== "lv-land-qdot-blocker-localization-phase5y-result-v1"
    || evidence.verifierScript !== "verify:myocardium-lv-land-ejection-window-localization"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
  ) {
    addIssue(errors, "phase5z_identity", RESULT_ARTIFACT_PATH, "Phase 5Z identity, upstream links, verifier script, or hash is invalid.");
  }
}

function validateProtocol(
  evidence: LvLandEjectionWindowLocalizationPhase5ZEvidence,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  const protocol = evidence.protocol;
  if (
    protocol.pointSource !== "phase5x-synthetic-user-knob-sweep"
    || !arrayEquals(protocol.modelPathIds, EXPECTED_MODEL_PATH_IDS)
    || protocol.pointCount !== EXPECTED_POINT_IDS.length
    || protocol.sampleHz !== 240
    || protocol.dtSec !== 0.001
    || protocol.measureBeats !== 3
    || protocol.windowDurationAndVolumeAggregation !== "per-beat-average-over-measure-beats"
    || protocol.aovOpenThreshold !== 0.5
    || protocol.highFlowCore50Fraction !== 0.5
    || protocol.highFlowCore75Fraction !== 0.75
    || protocol.qDotRawPostDivergenceMinMlPerS2 !== 1e-6
    || protocol.qDotImpulseAbsMinMlPerS2 !== 1e-9
    || protocol.phase5XQDotHighFractionMin !== 0.75
    || protocol.phase5XToAovOpenDurationRatioMax !== 0.1
    || protocol.highCoreQDotDominantFractionMin !== 0.75
  ) {
    addIssue(errors, "phase5z_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5Z protocol constants must remain fixed for ejection-window localization.");
  }
  if (!arrayEquals(evidence.points.map((point) => point.id), EXPECTED_POINT_IDS)) {
    addIssue(errors, "phase5z_point_ids", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5Z must reuse the Phase 5X synthetic user-knob point order.");
  }
}

function validatePoints(
  evidence: LvLandEjectionWindowLocalizationPhase5ZEvidence,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
  warnings: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  if (evidence.points.length !== EXPECTED_POINT_IDS.length) {
    addIssue(errors, "phase5z_point_count", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5Z must record every Phase 5X sweep point.");
  }
  for (const point of evidence.points) {
    validateRun(point, point.stock, "stock", errors);
    validateRun(point, point.land, "land", errors);
    const expectedClass = classifyRun(point.land);
    if (point.classification !== expectedClass) {
      addIssue(errors, "phase5z_classification", `${RESULT_ARTIFACT_PATH}.points.${point.id}.classification`, "Point classification must be recomputable from Land ejection-window evidence.");
    }
    if (!point.signals.includes(point.classification)) {
      addIssue(errors, "phase5z_signals", `${RESULT_ARTIFACT_PATH}.points.${point.id}.signals`, "Signals must include the recomputed classification.");
    }
    if (point.classification === "classifier-window-denominator-amplification-dominant") {
      const high50 = mustWindow(point.land.windows, "qao-high-core-50");
      if ((high50.rawPostDivergenceHitFraction ?? 0) >= evidence.protocol.highCoreQDotDominantFractionMin) {
        addIssue(errors, "phase5z_classifier_class", `${RESULT_ARTIFACT_PATH}.points.${point.id}.land.windows`, "Classifier-window class requires high-flow core qDot fraction below the dominant threshold.");
      }
    }
    warnings.push({
      severity: "warning",
      code: "phase5z_window_localized",
      path: `${RESULT_ARTIFACT_PATH}.points.${point.id}.classification`,
      message: `${point.id} classification=${point.classification} highCore50QDot=${mustWindow(point.land.windows, "qao-high-core-50").rawPostDivergenceHitFraction}`,
    });
  }
}

function validateRun(
  point: LvLandEjectionWindowLocalizationPhase5ZPoint,
  run: LvLandEjectionWindowLocalizationPhase5ZRun,
  side: "stock" | "land",
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.points.${point.id}.${side}`;
  if (
    run.pointId !== point.id
    || run.targetTBVMl !== point.targetTBVMl
    || run.settled !== true
    || run.health.clampHitCount !== 0
    || run.qAoPeakMlPerSec == null
    || !arrayEquals(run.windows.map((window) => window.id), EXPECTED_WINDOW_IDS)
    || run.reference.phase5XQDotClampHitFraction == null
    || run.reference.phase5XEjectionDurationSec == null
    || run.reference.phase5XSemilunarForwardVolumeMl == null
  ) {
    addIssue(errors, "phase5z_run_shape", pathPrefix, "Each run must settle and record qAo peak, all ejection windows, and Phase 5X references.");
  }
  for (const window of run.windows) {
    if (window.sampleCount < 0 || (window.sampleCount > 0 && (window.durationSec == null || window.forwardVolumeMl == null))) {
      addIssue(errors, "phase5z_window_shape", `${pathPrefix}.windows.${window.id}`, "Nonempty windows must record duration and forward volume.");
    }
  }
  if (side === "stock") {
    if (run.modelPathId !== "stock-active-no-provider-v0" || run.experimentalActiveSourceProvider || run.sourceProviderId != null || run.providerInstrumentation != null) {
      addIssue(errors, "phase5z_stock_path", pathPrefix, "Stock path must not use an experimental active source provider.");
    }
  } else if (
    run.modelPathId !== "developer-only-lv-land-v0"
    || !run.experimentalActiveSourceProvider
    || run.health.status !== "ok"
    || !run.sourceProviderId?.includes("phase5u-developer-only-be-phase5q-calcium")
    || run.providerInstrumentation == null
    || run.providerInstrumentation.landSolveFailureCount !== 0
    || run.providerInstrumentation.landSolveOkCount <= 0
    || run.providerInstrumentation.sourceActiveStressCallCount <= 0
    || run.providerInstrumentation.commitProviderStateAfterStepCount <= 0
  ) {
    addIssue(errors, "phase5z_land_path", pathPrefix, "Land path must exercise the developer-only LV source provider with health ok and zero Land solve failures.");
  }
}

function validateSummary(
  evidence: LvLandEjectionWindowLocalizationPhase5ZEvidence,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
  warnings: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  const landRuns = evidence.points.map((point) => point.land);
  const physicalCount = evidence.points.filter((point) => point.classification === "physical-high-flow-core-qdot-dominant").length;
  const classifierCount = evidence.points.filter((point) =>
    point.classification === "classifier-window-denominator-amplification-dominant"
  ).length;
  const noAmplificationCount = evidence.points.filter((point) => point.classification === "no-phase5x-window-amplification").length;
  const uninterpretableCount = evidence.points.filter((point) => point.classification === "uninterpretable").length;
  if (
    evidence.summary.pointCount !== evidence.points.length
    || evidence.summary.landHealthOkCount !== landRuns.filter((run) => run.health.status === "ok").length
    || evidence.summary.landSettledCount !== landRuns.filter((run) => run.settled).length
    || evidence.summary.landSolveFailureCount !== landRuns.reduce((sum, run) =>
      sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0)
    || evidence.summary.physicalHighFlowCoreQDotDominantPointCount !== physicalCount
    || evidence.summary.classifierWindowDenominatorAmplificationDominantPointCount !== classifierCount
    || evidence.summary.noPhase5XWindowAmplificationPointCount !== noAmplificationCount
    || evidence.summary.uninterpretablePointCount !== uninterpretableCount
  ) {
    addIssue(errors, "phase5z_summary_consistency", `${RESULT_ARTIFACT_PATH}.summary`, "Summary counts must be recomputable from point evidence.");
  }
  if (
    !evidence.summary.limitations.some((limitation) => limitation.includes("not Phase 5Z root-cause acceptance"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not independent Land contractility-sensitivity evidence"))
  ) {
    addIssue(errors, "phase5z_limitations", `${RESULT_ARTIFACT_PATH}.summary.limitations`, "Summary must keep root/Zc/inertance and contractility-axis limitations explicit.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("Phase 5Z")
    || !evidence.summary.currentInterpretation.includes("qDot")
    || !evidence.summary.recommendedNext.some((next) =>
      next.includes("qDot") && (next.includes("valve") || next.includes("root"))
    )
  ) {
    addIssue(errors, "phase5z_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Interpretation must state the window-localization result and keep qDot/valve/load tuning blocked.");
  }
  if (classifierCount > noAmplificationCount && classifierCount > physicalCount) {
    warnings.push({
      severity: "warning",
      code: "phase5z_classifier_window_dominant",
      path: `${RESULT_ARTIFACT_PATH}.summary`,
      message: "Phase 5Z supports morphology classifier/window work before qDot, valve, load, or runtime-default changes.",
    });
  } else if (classifierCount > 0) {
    warnings.push({
      severity: "warning",
      code: "phase5z_classifier_window_non_dominant",
      path: `${RESULT_ARTIFACT_PATH}.summary`,
      message: "Phase 5Z records a non-dominant classifier-window point; per-beat normalization keeps arterial root/Zc/inertance diagnostics next.",
    });
  }
  if (noAmplificationCount > classifierCount && noAmplificationCount > physicalCount) {
    warnings.push({
      severity: "warning",
      code: "phase5z_no_window_amplification_dominant",
      path: `${RESULT_ARTIFACT_PATH}.summary`,
      message: "Phase 5Z per-beat normalization does not support short-window denominator amplification as the dominant explanation; prioritize root/Zc/inertance diagnostics.",
    });
  }
}

function validateBoundary(
  evidence: LvLandEjectionWindowLocalizationPhase5ZEvidence,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5z_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5Z boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5z_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5Z must keep ${token} blocked.`);
    }
  }
}

function classifyRun(run: LvLandEjectionWindowLocalizationPhase5ZRun): LvLandEjectionWindowLocalizationPhase5ZEvidence["points"][number]["classification"] {
  if (!run.settled || run.health.status !== "ok") return "uninterpretable";
  const aovOpen = mustWindow(run.windows, "aov-open");
  const high50 = mustWindow(run.windows, "qao-high-core-50");
  const high75 = mustWindow(run.windows, "qao-high-core-75");
  const phase5XAmplified =
    (run.reference.phase5XQDotClampHitFraction ?? 0) >= 0.75
    && (run.comparison.phase5XToAovOpenDurationRatio ?? Number.POSITIVE_INFINITY) <= 0.1;
  if (!phase5XAmplified) return "no-phase5x-window-amplification";
  const highCoreQDotDominant =
    (high50.rawPostDivergenceHitFraction ?? 0) >= 0.75
    || (high75.rawPostDivergenceHitFraction ?? 0) >= 0.75;
  const aovOpenModerate = (aovOpen.rawPostDivergenceHitFraction ?? 0) < 0.75;
  return highCoreQDotDominant && aovOpenModerate
    ? "physical-high-flow-core-qdot-dominant"
    : "classifier-window-denominator-amplification-dominant";
}

function mustWindow(
  windows: readonly LvLandEjectionWindowLocalizationPhase5ZEvidence["points"][number]["land"]["windows"][number][],
  id: string,
): LvLandEjectionWindowLocalizationPhase5ZEvidence["points"][number]["land"]["windows"][number] {
  const window = windows.find((candidate) => candidate.id === id);
  if (!window) throw new Error(`Missing window ${id}`);
  return window;
}

function validateSourceText(
  rootDir: string,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
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
  const packageText = textFor(files, PACKAGE_PATH);
  const readmeText = textFor(files, README_PATH);
  const roadmapText = textFor(files, ROADMAP_PATH);
  const morphologyText = textFor(files, MORPHOLOGY_README_PATH);
  const lanesText = textFor(files, HISTORICAL_LANES_PATH);
  if (
    !builderText.includes("qao-high-core-50")
    || !builderText.includes("classifier-window-denominator-amplification-dominant")
    || !builderText.includes("noQDotTuning: true")
    || !builderText.includes("noValveTuning: true")
  ) {
    addIssue(errors, "phase5z_builder_contract", BUILDER_PATH, "Builder must record physical windows, classifier-window classification, and no-tuning boundaries.");
  }
  if (!packageText.includes("verify:myocardium-lv-land-ejection-window-localization")) {
    addIssue(errors, "phase5z_package_script", PACKAGE_PATH, "package.json must expose the Phase 5Z verifier script.");
  }
  if (
    !readmeText.includes("Phase 5Z")
    || !roadmapText.includes("Phase 5Z")
    || !morphologyText.includes("Phase 5Z")
    || !lanesText.includes("lv-land-ejection-window-localization-phase5z-result-v1")
  ) {
    addIssue(errors, "phase5z_docs", "docs", "Docs must record Phase 5Z ejection-window localization evidence and boundaries.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  const forbidden = [
    "lv-land-ejection-window-localization-phase5z-result-v1",
    "verify:myocardium-lv-land-ejection-window-localization",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5z_no_production_wiring", relative, `Production-facing file must not wire Phase 5Z diagnostic token ${token}.`);
        }
      }
    }
  }
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5z_local_path", pathLabel, "Committed Phase 5Z evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5z_missing_file", relativePath, "Required Phase 5Z file is missing.");
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
  issues: LvLandEjectionWindowLocalizationPhase5ZValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateLvLandEjectionWindowLocalizationPhase5Z(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
  });
  console.log(
    `LV Land ejection-window localization Phase 5Z ${report.pass ? "PASS" : "FAIL"} `
    + `points=${report.evidence.summary.pointCount} `
    + `classifier=${report.evidence.summary.classifierWindowDenominatorAmplificationDominantPointCount} `
    + `physical=${report.evidence.summary.physicalHighFlowCoreQDotDominantPointCount} `
    + `landSolveFailures=${report.evidence.summary.landSolveFailureCount} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyLvLandEjectionWindowLocalizationPhase5Z.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
