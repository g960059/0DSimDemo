import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json";
import {
  ARTERIAL_ROOT_INERTANCE_BENCH_PHASE5AA_ID,
  buildArterialRootInertanceBenchPhase5AAEvidence,
  type ArterialRootInertanceBenchPhase5AAEvidence,
  type ArterialRootInertanceBenchPhase5AAPoint,
  type ArterialRootInertanceBenchPhase5AARun,
} from "@/tools/myocardium/buildArterialRootInertanceBenchPhase5AA";

export type ArterialRootInertanceBenchPhase5AAValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ArterialRootInertanceBenchPhase5AAValidationReport = {
  readonly pass: boolean;
  readonly evidence: ArterialRootInertanceBenchPhase5AAEvidence;
  readonly errors: readonly ArterialRootInertanceBenchPhase5AAValidationIssue[];
  readonly warnings: readonly ArterialRootInertanceBenchPhase5AAValidationIssue[];
};

export type ArterialRootInertanceBenchPhase5AAValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildArterialRootInertanceBenchPhase5AA.ts";
const VERIFIER_PATH = "tools/myocardium/verifyArterialRootInertanceBenchPhase5AA.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const PACKAGE_PATH = "package.json";

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
const EXPECTED_MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const EXPECTED_CANDIDATE_IDS = [
  "current-aov-l",
  "root-l-plus-1x-aov-l",
  "root-l-plus-3x-aov-l",
  "root-l-plus-10x-aov-l",
  "root-l-plus-30x-aov-l",
] as const;
const EXPECTED_DOES_NOT_UNLOCK = [
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
  "engine/core/topology.ts",
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

export function validateArterialRootInertanceBenchPhase5AA(
  rootDir = process.cwd(),
  options: ArterialRootInertanceBenchPhase5AAValidationOptions = {},
): ArterialRootInertanceBenchPhase5AAValidationReport {
  const errors: ArterialRootInertanceBenchPhase5AAValidationIssue[] = [];
  const warnings: ArterialRootInertanceBenchPhase5AAValidationIssue[] = [];
  const evidence = resultArtifact as unknown as ArterialRootInertanceBenchPhase5AAEvidence;

  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validatePoints(evidence, errors);
  validateSummary(evidence, errors, warnings);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  if (options.rebuildEvidence === true) validateFreshEvidence(evidence, errors);
  else {
    warnings.push({
      severity: "warning",
      code: "phase5aa_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5AA rebuild is opt-in because it reruns 28 stock/Land measured branches.",
    });
  }
  warnings.push({
    severity: "warning",
    code: "phase5aa_runtime_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AA is an offline prescribed-pressure bench only; ModelCore equation changes and runtime default flip remain blocked.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: ArterialRootInertanceBenchPhase5AAEvidence,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  const fresh = buildArterialRootInertanceBenchPhase5AAEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5aa_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AA artifact must match a fresh measured builder run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: ArterialRootInertanceBenchPhase5AAEvidence,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ARTERIAL_ROOT_INERTANCE_BENCH_PHASE5AA_ID
    || evidence.phase !== "Phase 5AA"
    || evidence.claimBoundary !== "isolated-arterial-root-inertance-bench-diagnostic-only"
    || evidence.upstreamPhase5ZArtifactId !== "lv-land-ejection-window-localization-phase5z-result-v1"
    || evidence.verifierScript !== "verify:myocardium-arterial-root-inertance-bench"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
  ) {
    addIssue(errors, "phase5aa_identity", RESULT_ARTIFACT_PATH, "Phase 5AA identity, upstream link, verifier script, or hash is invalid.");
  }
}

function validateProtocol(
  evidence: ArterialRootInertanceBenchPhase5AAEvidence,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
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
    || protocol.qDotClampMlPerS2 !== 40000
    || protocol.replayEquation !== "ModelCore-current-loss-AoV-replay-with-root-inertance-addition"
    || protocol.pressureDriver !== "measured-LVP-minus-AoP-prescribed-from-current-closure"
    || protocol.successSignalThresholds.volumePreservationMin !== 0.5
    || protocol.successSignalThresholds.durationPreservationMin !== 0.8
    || protocol.successSignalThresholds.clampReductionMin !== 0.25
    || !arrayEquals(protocol.candidateSet.map((candidate) => candidate.id), EXPECTED_CANDIDATE_IDS)
  ) {
    addIssue(errors, "phase5aa_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5AA protocol constants must remain fixed for the isolated arterial root inertance bench.");
  }
  if (!arrayEquals(evidence.points.map((point) => point.id), EXPECTED_POINT_IDS)) {
    addIssue(errors, "phase5aa_point_ids", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5AA must reuse the Phase 5X synthetic user-knob point order.");
  }
}

function validatePoints(
  evidence: ArterialRootInertanceBenchPhase5AAEvidence,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  if (evidence.points.length !== EXPECTED_POINT_IDS.length) {
    addIssue(errors, "phase5aa_point_count", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5AA must record every Phase 5X sweep point.");
  }
  for (const point of evidence.points) {
    validateRun(point, point.stock, "stock", errors);
    validateRun(point, point.land, "land", errors);
  }
}

function validateRun(
  point: ArterialRootInertanceBenchPhase5AAPoint,
  run: ArterialRootInertanceBenchPhase5AARun,
  side: "stock" | "land",
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.points.${point.id}.${side}`;
  if (
    run.pointId !== point.id
    || run.targetTBVMl !== point.targetTBVMl
    || run.settled !== true
    || !arrayEquals(run.replayCandidates.map((candidate) => candidate.id), EXPECTED_CANDIDATE_IDS)
    || run.phase5ZReference.aovOpenQDotFraction == null
    || run.phase5ZReference.aovOpenDurationSecPerBeat == null
    || run.phase5ZReference.aovOpenForwardVolumeMlPerBeat == null
  ) {
    addIssue(errors, "phase5aa_run_shape", pathPrefix, "Each run must settle, link Phase 5Z references, and record every inertance candidate.");
  }
  for (const candidate of run.replayCandidates) {
    if (
      candidate.sampleCount <= 0
      || candidate.aovOpenSampleCount <= 0
      || candidate.aovOpenDurationSecPerBeat == null
      || candidate.measuredForwardVolumeMlPerBeat == null
      || candidate.qDotClampHitFractionAll == null
      || candidate.qDotClampHitFractionAovOpen == null
      || candidate.qDotRawAbsMaxMlPerS2 == null
      || candidate.totalInertanceMultipleOfAovL < 1
    ) {
      addIssue(errors, "phase5aa_candidate_shape", `${pathPrefix}.replayCandidates.${candidate.id}`, "Each candidate must record finite replay window, qDot, and inertance metrics.");
    }
  }
  const current = run.replayCandidates[0];
  if (current.id !== "current-aov-l" || current.qDotClampReductionVsCurrentAovOpen !== 0) {
    addIssue(errors, "phase5aa_current_replay", `${pathPrefix}.replayCandidates.current-aov-l`, "Current replay candidate must be first and have zero reduction versus itself.");
  }
  if (side === "stock") {
    if (run.modelPathId !== "stock-active-no-provider-v0" || run.experimentalActiveSourceProvider || run.sourceProviderId != null || run.providerInstrumentation != null) {
      addIssue(errors, "phase5aa_stock_path", pathPrefix, "Stock path must not use an experimental active source provider.");
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
    addIssue(errors, "phase5aa_land_path", pathPrefix, "Land path must exercise the developer-only LV source provider with health ok and zero Land solve failures.");
  }
}

function validateSummary(
  evidence: ArterialRootInertanceBenchPhase5AAEvidence,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
  warnings: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  const runs = evidence.points.flatMap((point) => [point.stock, point.land]);
  const landRuns = evidence.points.map((point) => point.land);
  const healthOkRuns = runs.filter((run) => run.health.status === "ok");
  const healthOkLandRuns = landRuns.filter((run) => run.health.status === "ok");
  const runsWithSignal = runs.filter(runHasLowerClampSignal).length;
  const landRunsWithSignal = landRuns.filter(runHasLowerClampSignal).length;
  const healthOkRunsWithSignal = healthOkRuns.filter(runHasLowerClampSignal).length;
  const healthOkLandRunsWithSignal = healthOkLandRuns.filter(runHasLowerClampSignal).length;
  const failedHealthRunsWithSignal = runs.filter((run) =>
    run.health.status !== "ok" && runHasLowerClampSignal(run)
  );
  const failedHealthSignalIds = failedHealthRunsWithSignal.map(failedHealthSignalId);
  const artifactFailedHealthSignalIds =
    evidence.summary.failedHealthRunsWithCandidateLowerClampWithoutSevereVolumeLoss.map((run) =>
      `${run.modelPathId}:${run.pointId}:${run.healthStatus}`
    );
  if (
    evidence.summary.pointCount !== evidence.points.length
    || evidence.summary.runCount !== runs.length
    || evidence.summary.settledRunCount !== runs.filter((run) => run.settled).length
    || evidence.summary.healthOkRunCount !== healthOkRuns.length
    || evidence.summary.landSolveFailureCount !== landRuns.reduce((sum, run) =>
      sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0)
    || evidence.summary.runsWithCandidateLowerClampWithoutSevereVolumeLoss !== runsWithSignal
    || evidence.summary.landRunsWithCandidateLowerClampWithoutSevereVolumeLoss !== landRunsWithSignal
    || evidence.summary.healthOkRunsWithCandidateLowerClampWithoutSevereVolumeLoss !== healthOkRunsWithSignal
    || evidence.summary.healthOkLandRunsWithCandidateLowerClampWithoutSevereVolumeLoss !== healthOkLandRunsWithSignal
    || !arrayEquals(artifactFailedHealthSignalIds, failedHealthSignalIds)
  ) {
    addIssue(errors, "phase5aa_summary_consistency", `${RESULT_ARTIFACT_PATH}.summary`, "Summary counts must be recomputable from run evidence.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("offline replay")
    || !evidence.summary.currentInterpretation.includes("health-ok")
    || !evidence.summary.currentInterpretation.includes("not runtime adoption")
    || !evidence.summary.recommendedNext.some((next) => next.includes("qDot and valve thresholds fixed"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("does not include closed-loop pressure feedback"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not Zc/reflection availability"))
  ) {
    addIssue(errors, "phase5aa_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Interpretation and limitations must keep the bench diagnostic-only and non-runtime.");
  }
  if (
    failedHealthSignalIds.length > 0
    && (
      !evidence.summary.currentInterpretation.includes("failed-health")
      || evidence.summary.currentInterpretation.includes(`${runsWithSignal}/${runs.length} stock/Land runs`)
    )
  ) {
    addIssue(errors, "phase5aa_health_overclaim", `${RESULT_ARTIFACT_PATH}.summary.currentInterpretation`, "Headline signal must exclude failed-health runs and track them separately.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5aa_candidate_signal_count",
    path: `${RESULT_ARTIFACT_PATH}.summary`,
    message: `Phase 5AA candidate signal healthOkRuns=${healthOkRunsWithSignal}/${healthOkRuns.length}; rawRuns=${runsWithSignal}/${runs.length}; Land=${landRunsWithSignal}/${landRuns.length}; failedHealthSignalRuns=${failedHealthSignalIds.join(",") || "none"}.`,
  });
}

function runHasLowerClampSignal(run: ArterialRootInertanceBenchPhase5AARun): boolean {
  return run.replayCandidates.some((candidate) => candidate.lowerClampWithoutSevereVolumeLoss);
}

function failedHealthSignalId(run: ArterialRootInertanceBenchPhase5AARun): string {
  return `${run.modelPathId}:${run.pointId}:${run.health.status}`;
}

function validateBoundary(
  evidence: ArterialRootInertanceBenchPhase5AAEvidence,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5aa_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AA boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5aa_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AA must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, ROADMAP_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_README_PATH, errors),
    readRequiredText(rootDir, PACKAGE_PATH, errors),
  ];
  for (const file of files) {
    if (file) validateNoLocalAbsolutePaths(file.path, file.text, errors);
  }
  const builderText = textFor(files, BUILDER_PATH);
  const packageText = textFor(files, PACKAGE_PATH);
  const docsText = files.map((file) => file?.text ?? "").join("\n");
  if (
    !builderText.includes("ModelCore-current-loss-AoV-replay-with-root-inertance-addition")
    || !builderText.includes("noModelCoreEquationChange: true")
    || !builderText.includes("noQDotTuning: true")
    || !builderText.includes("noValveThresholdTuning: true")
  ) {
    addIssue(errors, "phase5aa_builder_contract", BUILDER_PATH, "Builder must record isolated replay equation and no-runtime/no-tuning boundaries.");
  }
  if (!packageText.includes("verify:myocardium-arterial-root-inertance-bench")) {
    addIssue(errors, "phase5aa_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AA verifier script.");
  }
  if (
    !docsText.includes("Phase 5AA")
    || !docsText.includes("arterial-root-inertance-bench-phase5aa-result-v1")
    || !docsText.includes("offline prescribed-pressure")
    || !docsText.includes("health-ok")
  ) {
    addIssue(errors, "phase5aa_docs", "docs", "Docs must record Phase 5AA bench evidence and prescribed-pressure boundary.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  const forbidden = [
    "arterial-root-inertance-bench-phase5aa-result-v1",
    "verify:myocardium-arterial-root-inertance-bench",
    "buildArterialRootInertanceBenchPhase5AA",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5aa_no_production_wiring", relative, `Production-facing file must not wire Phase 5AA diagnostic token ${token}.`);
        }
      }
    }
  }
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5aa_local_path", pathLabel, "Committed Phase 5AA evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: ArterialRootInertanceBenchPhase5AAValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5aa_missing_file", relativePath, "Required Phase 5AA file is missing.");
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
  issues: ArterialRootInertanceBenchPhase5AAValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateArterialRootInertanceBenchPhase5AA(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
  });
  console.log(
    `Arterial root inertance bench Phase 5AA ${report.pass ? "PASS" : "FAIL"} `
    + `points=${report.evidence.summary.pointCount} `
    + `runs=${report.evidence.summary.runCount} `
    + `healthOkSignalRuns=${report.evidence.summary.healthOkRunsWithCandidateLowerClampWithoutSevereVolumeLoss} `
    + `rawSignalRuns=${report.evidence.summary.runsWithCandidateLowerClampWithoutSevereVolumeLoss} `
    + `landSignalRuns=${report.evidence.summary.landRunsWithCandidateLowerClampWithoutSevereVolumeLoss} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyArterialRootInertanceBenchPhase5AA.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
