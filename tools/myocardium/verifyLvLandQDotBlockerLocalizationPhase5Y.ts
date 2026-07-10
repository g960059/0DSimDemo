import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json";
import {
  LV_LAND_QDOT_BLOCKER_LOCALIZATION_PHASE5Y_ID,
  buildLvLandQDotBlockerLocalizationPhase5YEvidence,
  type LvLandQDotBlockerLocalizationPhase5YEvidence,
  type LvLandQDotBlockerLocalizationPhase5YPoint,
  type LvLandQDotBlockerLocalizationPhase5YRun,
} from "@/tools/myocardium/buildLvLandQDotBlockerLocalizationPhase5Y";

export type LvLandQDotBlockerLocalizationPhase5YValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type LvLandQDotBlockerLocalizationPhase5YValidationReport = {
  readonly pass: boolean;
  readonly evidence: LvLandQDotBlockerLocalizationPhase5YEvidence;
  readonly errors: readonly LvLandQDotBlockerLocalizationPhase5YValidationIssue[];
  readonly warnings: readonly LvLandQDotBlockerLocalizationPhase5YValidationIssue[];
};

export type LvLandQDotBlockerLocalizationPhase5YValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildLvLandQDotBlockerLocalizationPhase5Y.ts";
const VERIFIER_PATH = "tools/myocardium/verifyLvLandQDotBlockerLocalizationPhase5Y.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";
const PACKAGE_PATH = "package.json";
const MODELCORE_PATH = "engine/ModelCore.ts";
const MORPHOLOGY_RUNNER_PATH = "tools/myocardium/verifyPvLoopMorphologyQuality.ts";
const EXPECTED_MODEL_PATH_IDS = [
  "stock-active-no-provider-v0",
  "developer-only-lv-land-v0",
] as const;
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

export function validateLvLandQDotBlockerLocalizationPhase5Y(
  rootDir = process.cwd(),
  options: LvLandQDotBlockerLocalizationPhase5YValidationOptions = {},
): LvLandQDotBlockerLocalizationPhase5YValidationReport {
  const errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[] = [];
  const warnings: LvLandQDotBlockerLocalizationPhase5YValidationIssue[] = [];
  const evidence = resultArtifact as LvLandQDotBlockerLocalizationPhase5YEvidence;

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
      code: "phase5y_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5Y rebuild is opt-in because it reruns 28 stock/Land measured branches.",
    });
  }
  warnings.push({
    severity: "warning",
    code: "phase5y_default_flip_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5Y localizes a Phase 5X qDot morphology blocker only; default flip and qDot/valve tuning remain blocked.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: LvLandQDotBlockerLocalizationPhase5YEvidence,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  const fresh = buildLvLandQDotBlockerLocalizationPhase5YEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5y_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5Y artifact must match a fresh measured builder run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: LvLandQDotBlockerLocalizationPhase5YEvidence,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== LV_LAND_QDOT_BLOCKER_LOCALIZATION_PHASE5Y_ID
    || evidence.phase !== "Phase 5Y"
    || evidence.claimBoundary !== "qdot-blocker-localization-diagnostic-only-no-tuning"
    || evidence.upstreamPhase5XArtifactId !== "lv-land-default-candidate-preflight-phase5x-result-v1"
    || evidence.verifierScript !== "verify:myocardium-lv-land-qdot-blocker-localization"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
  ) {
    addIssue(errors, "phase5y_identity", RESULT_ARTIFACT_PATH, "Phase 5Y identity, upstream link, verifier script, or artifact hash is invalid.");
  }
}

function validateProtocol(
  evidence: LvLandQDotBlockerLocalizationPhase5YEvidence,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  const protocol = evidence.protocol;
  if (
    protocol.pointSource !== "phase5x-synthetic-user-knob-sweep"
    || !arrayEquals(protocol.modelPathIds, EXPECTED_MODEL_PATH_IDS)
    || protocol.pointCount !== EXPECTED_POINT_IDS.length
    || protocol.sampleHz !== 240
    || protocol.dtSec !== 0.001
    || protocol.measureBeats !== 3
    || protocol.aovOpenThreshold !== 0.5
    || protocol.qDotRawPostDivergenceMinMlPerS2 !== 1e-6
    || protocol.qDotImpulseAbsMinMlPerS2 !== 1e-9
    || protocol.highFractionMin !== 0.75
    || protocol.directEngagementFractionMin !== 0.25
    || protocol.directRawPostDiffAbsMinMlPerS2 !== 40000
    || protocol.shortEjectionDurationSecMax !== 0.02
    || protocol.phase5XEjectionToAovOpenDurationRatioMax !== 0.1
  ) {
    addIssue(errors, "phase5y_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5Y protocol constants must remain fixed for qDot blocker localization.");
  }
  if (!arrayEquals(evidence.points.map((point) => point.id), EXPECTED_POINT_IDS)) {
    addIssue(errors, "phase5y_point_ids", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5Y must reuse the Phase 5X synthetic user-knob point order.");
  }
}

function validatePoints(
  evidence: LvLandQDotBlockerLocalizationPhase5YEvidence,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
  warnings: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  if (evidence.points.length !== EXPECTED_POINT_IDS.length) {
    addIssue(errors, "phase5y_point_count", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5Y must record every Phase 5X sweep point.");
  }
  for (const point of evidence.points) {
    validateRun(point, point.stock, "stock", errors);
    validateRun(point, point.land, "land", errors);
    const expectedClass = classifyPoint(evidence, point.land);
    if (point.localizationClass !== expectedClass) {
      addIssue(errors, "phase5y_classification", `${RESULT_ARTIFACT_PATH}.points.${point.id}.localizationClass`, "Localization class must be recomputable from direct qDot and Phase 5X classifier-window evidence.");
    }
    if (!point.blockerSignals.includes(point.localizationClass)) {
      addIssue(errors, "phase5y_blocker_signals", `${RESULT_ARTIFACT_PATH}.points.${point.id}.blockerSignals`, "Blocker signals must include the recomputed localization class.");
    }
    if (point.localizationClass.startsWith("direct-aov-qdot-engagement")) {
      if (
        !point.blockerSignals.includes("direct-aov-open-raw-post-divergence-engaged")
        || !point.blockerSignals.includes("direct-aov-open-explicit-clamp-flag-engaged")
        || !point.blockerSignals.includes("direct-aov-open-impulse-hit-engaged")
      ) {
        addIssue(errors, "phase5y_direct_signals", `${RESULT_ARTIFACT_PATH}.points.${point.id}.blockerSignals`, "Direct qDot engagement classifications must carry raw/post, explicit clamp, and impulse signals.");
      }
    }
    if (point.localizationClass === "direct-aov-qdot-engagement-classifier-window-amplification") {
      if (
        !point.blockerSignals.includes("classifier-window-amplifies-qdot-fraction")
        || !point.blockerSignals.includes("short-phase5x-morphology-ejection-core")
      ) {
        addIssue(errors, "phase5y_window_signals", `${RESULT_ARTIFACT_PATH}.points.${point.id}.blockerSignals`, "Classifier-window amplification must record the short Phase 5X ejection core.");
      }
    }
    warnings.push({
      severity: "warning",
      code: "phase5y_qdot_blocker_localized",
      path: `${RESULT_ARTIFACT_PATH}.points.${point.id}.localizationClass`,
      message: `${point.id} localization=${point.localizationClass} directOpenFraction=${directOpenFraction(point.land)}`,
    });
  }
}

function validateRun(
  point: LvLandQDotBlockerLocalizationPhase5YPoint,
  run: LvLandQDotBlockerLocalizationPhase5YRun,
  side: "stock" | "land",
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.points.${point.id}.${side}`;
  if (
    run.pointId !== point.id
    || run.targetTBVMl !== point.targetTBVMl
    || !Number.isFinite(run.settleBeats)
    || run.settled !== true
    || run.health.clampHitCount !== 0
    || run.directWindow.sampleCount <= 0
    || run.directWindow.aovOpenSampleCount <= 0
    || run.directWindow.aovOpenDurationSec == null
    || run.directWindow.qAoPeakMlPerSec == null
    || run.directWindow.qAoCapRatioMax == null
    || run.morphologyReference.phase5XQDotClampHitFraction == null
    || run.morphologyReference.phase5XEjectionDurationSec == null
  ) {
    addIssue(errors, "phase5y_run_shape", pathPrefix, "Each run must settle with health ok and record direct AoV and Phase 5X morphology reference windows.");
  }
  if (side === "stock") {
    if (run.modelPathId !== "stock-active-no-provider-v0" || run.experimentalActiveSourceProvider || run.sourceProviderId != null || run.providerInstrumentation != null) {
      addIssue(errors, "phase5y_stock_path", pathPrefix, "Stock path must not use an experimental active source provider.");
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
    addIssue(errors, "phase5y_land_path", pathPrefix, "Land path must exercise the developer-only LV source provider with zero Land solve failures.");
  }
  if (side === "land") validateLandLocalizationRun(run, pathPrefix, errors);
}

function validateLandLocalizationRun(
  run: LvLandQDotBlockerLocalizationPhase5YRun,
  pathPrefix: string,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  if (!hasDirectAovQDotEngagement(run)) {
    addIssue(errors, "phase5y_direct_qdot_engagement", `${pathPrefix}.directWindow`, "Land run must localize Phase 5X qDot blocker to direct AoV qDot raw/post clamp engagement.");
  }
  if (!hasClassifierWindowAmplification(run)) {
    addIssue(errors, "phase5y_classifier_window_amplification", `${pathPrefix}.windowComparison`, "Land run must record Phase 5X classifier-window amplification rather than equating morphology fraction 1.0 with all AoV-open samples.");
  }
  const comparison = run.windowComparison;
  if (
    comparison.phase5XEjectionToAovOpenDurationRatio == null
    || comparison.phase5XQDotClampHitFractionMinusDirectAovOpenRawPostFraction == null
    || comparison.phase5XQDotClampHitFractionMinusDirectAovOpenExplicitFraction == null
  ) {
    addIssue(errors, "phase5y_window_comparison", `${pathPrefix}.windowComparison`, "Window comparison must record duration ratio and qDot-fraction denominator deltas.");
  }
}

function validateSummary(
  evidence: LvLandQDotBlockerLocalizationPhase5YEvidence,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
  warnings: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  const landRuns = evidence.points.map((point) => point.land);
  const directCount = evidence.points.filter((point) =>
    point.localizationClass.startsWith("direct-aov-qdot-engagement")
  ).length;
  const amplifiedCount = evidence.points.filter((point) =>
    point.localizationClass === "direct-aov-qdot-engagement-classifier-window-amplification"
  ).length;
  const denominatorRiskCount = evidence.points.filter((point) =>
    point.localizationClass === "morphology-fraction-denominator-risk"
  ).length;
  const normalFloorLVEDPApprox =
    evidence.points.find((point) => point.id === "normal-floor")?.land.metrics.LVEDPApprox ?? null;
  if (
    evidence.summary.pointCount !== evidence.points.length
    || evidence.summary.landHealthOkCount !== landRuns.filter((run) => run.health.status === "ok").length
    || evidence.summary.landSettledCount !== landRuns.filter((run) => run.settled).length
    || evidence.summary.landSolveFailureCount !== landRuns.reduce((sum, run) =>
      sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0)
    || evidence.summary.directAovQDotEngagementPointCount !== directCount
    || evidence.summary.classifierWindowAmplificationPointCount !== amplifiedCount
    || evidence.summary.morphologyFractionDenominatorRiskPointCount !== denominatorRiskCount
    || evidence.summary.normalFloorLVEDPApprox !== normalFloorLVEDPApprox
  ) {
    addIssue(errors, "phase5y_summary_consistency", `${RESULT_ARTIFACT_PATH}.summary`, "Summary counts must be recomputable from point evidence.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("broader AoV-open window")
    || !evidence.summary.currentInterpretation.includes("without tuning qDot or valve")
    || !evidence.summary.recommendedNext.some((next) => next.includes("without tuning qDot or valve"))
  ) {
    addIssue(errors, "phase5y_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Interpretation must state direct qDot engagement, classifier-window amplification, and no qDot/valve tuning.");
  }
  if ((evidence.summary.normalFloorLVEDPApprox ?? 0) > 16) {
    warnings.push({
      severity: "warning",
      code: "phase5y_normal_floor_lvedp_still_high",
      path: `${RESULT_ARTIFACT_PATH}.summary.normalFloorLVEDPApprox`,
      message: "Phase 5Y records the Phase 5X normal-floor LVEDP blocker but does not tune it.",
    });
  }
}

function validateBoundary(
  evidence: LvLandQDotBlockerLocalizationPhase5YEvidence,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5y_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5Y boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5y_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5Y must keep ${token} blocked.`);
    }
  }
}

function classifyPoint(
  evidence: LvLandQDotBlockerLocalizationPhase5YEvidence,
  run: LvLandQDotBlockerLocalizationPhase5YRun,
): LvLandQDotBlockerLocalizationPhase5YEvidence["points"][number]["localizationClass"] {
  if (directOpenFraction(run) >= evidence.protocol.highFractionMin) {
    return "direct-aov-qdot-engagement-broad-window";
  }
  if (hasDirectAovQDotEngagement(run) && hasClassifierWindowAmplification(run)) {
    return "direct-aov-qdot-engagement-classifier-window-amplification";
  }
  if (
    (run.morphologyReference.phase5XQDotClampHitFraction ?? 0) >= evidence.protocol.highFractionMin
    && (run.morphologyReference.phase5XEjectionDurationSec ?? Number.POSITIVE_INFINITY)
      <= evidence.protocol.shortEjectionDurationSecMax
  ) {
    return "morphology-fraction-denominator-risk";
  }
  return "morphology-qdot-blocker-not-localized";
}

function directOpenFraction(run: LvLandQDotBlockerLocalizationPhase5YRun): number {
  return Math.max(
    run.directWindow.rawPostDivergenceHitFractionAovOpen ?? 0,
    run.directWindow.explicitClampHit01FractionAovOpen ?? 0,
    run.directWindow.impulseHitFractionAovOpen ?? 0,
  );
}

function hasDirectAovQDotEngagement(run: LvLandQDotBlockerLocalizationPhase5YRun): boolean {
  return directOpenFraction(run) >= 0.25
    && (run.directWindow.aovQDotRawPostDiffAbsMaxMlPerS2 ?? 0) >= 40000;
}

function hasClassifierWindowAmplification(run: LvLandQDotBlockerLocalizationPhase5YRun): boolean {
  return (run.morphologyReference.phase5XQDotClampHitFraction ?? 0) >= 0.75
    && (run.morphologyReference.phase5XEjectionDurationSec ?? Number.POSITIVE_INFINITY) <= 0.02
    && (run.windowComparison.phase5XEjectionToAovOpenDurationRatio ?? Number.POSITIVE_INFINITY) <= 0.1;
}

function validateSourceText(
  rootDir: string,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
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
    readRequiredText(rootDir, MODELCORE_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_RUNNER_PATH, errors),
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
  const modelCoreText = textFor(files, MODELCORE_PATH);
  const morphologyRunnerText = textFor(files, MORPHOLOGY_RUNNER_PATH);
  if (
    !builderText.includes("DIRECT_QDOT_ENGAGEMENT_FRACTION_MIN")
    || !builderText.includes("PHASE5X_EJECTION_TO_AOV_OPEN_DURATION_RATIO_MAX")
    || !builderText.includes("noQDotTuning: true")
    || !builderText.includes("noValveTuning: true")
  ) {
    addIssue(errors, "phase5y_builder_contract", BUILDER_PATH, "Builder must separate direct qDot engagement, classifier-window amplification, and no-tuning boundaries.");
  }
  if (!packageText.includes("verify:myocardium-lv-land-qdot-blocker-localization")) {
    addIssue(errors, "phase5y_package_script", PACKAGE_PATH, "package.json must expose the Phase 5Y verifier script.");
  }
  if (
    !readmeText.includes("Phase 5Y")
    || !roadmapText.includes("Phase 5Y")
    || !morphologyText.includes("Phase 5Y")
    || !lanesText.includes("lv-land-qdot-blocker-localization-phase5y-result-v1")
  ) {
    addIssue(errors, "phase5y_docs", "docs", "Docs must record Phase 5Y qDot blocker localization evidence and boundaries.");
  }
  if (
    !modelCoreText.includes("qDotRaw")
    || !modelCoreText.includes("qDotPost")
    || !modelCoreText.includes("qDotClampImpulse")
    || !morphologyRunnerText.includes("qDotClampHitFraction")
  ) {
    addIssue(errors, "phase5y_signal_contract", "engine/tools", "Phase 5Y depends on direct qDot raw/post/impulse readouts and morphology qDotClampHitFraction.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  const forbidden = [
    "lv-land-qdot-blocker-localization-phase5y-result-v1",
    "verify:myocardium-lv-land-qdot-blocker-localization",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5y_no_production_wiring", relative, `Production-facing file must not wire Phase 5Y diagnostic token ${token}.`);
        }
      }
    }
  }
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5y_local_path", pathLabel, "Committed Phase 5Y evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5y_missing_file", relativePath, "Required Phase 5Y file is missing.");
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
  issues: LvLandQDotBlockerLocalizationPhase5YValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateLvLandQDotBlockerLocalizationPhase5Y(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
  });
  console.log(
    `LV Land qDot blocker localization Phase 5Y ${report.pass ? "PASS" : "FAIL"} `
    + `points=${report.evidence.summary.pointCount} `
    + `direct=${report.evidence.summary.directAovQDotEngagementPointCount} `
    + `classifierWindowAmplification=${report.evidence.summary.classifierWindowAmplificationPointCount} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyLvLandQDotBlockerLocalizationPhase5Y.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
