import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json";
import {
  ARTERIAL_ROOT_BOUNDARY_TIMING_PHASE5AG_ID,
  buildArterialRootBoundaryTimingPhase5AGEvidence,
  type ArterialRootBoundaryTimingPhase5AGEvidence,
  type ArterialRootBoundaryTimingPhase5AGRun,
} from "@/tools/myocardium/buildArterialRootBoundaryTimingPhase5AG";

export type ArterialRootBoundaryTimingPhase5AGValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ArterialRootBoundaryTimingPhase5AGValidationReport = {
  readonly pass: boolean;
  readonly evidence: ArterialRootBoundaryTimingPhase5AGEvidence;
  readonly errors: readonly ArterialRootBoundaryTimingPhase5AGValidationIssue[];
  readonly warnings: readonly ArterialRootBoundaryTimingPhase5AGValidationIssue[];
};

export type ArterialRootBoundaryTimingPhase5AGValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildArterialRootBoundaryTimingPhase5AG.ts";
const VERIFIER_PATH = "tools/myocardium/verifyArterialRootBoundaryTimingPhase5AG.ts";
const REUSED_RUNNER_PATH = "tools/myocardium/buildArterialRootBoundaryInertancePhase5AE.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const PACKAGE_PATH = "package.json";

const EXPECTED_CANDIDATE_IDS = [
  "current-closure",
  "boundary-root-l-plus-1x-aov-l-mechanism",
] as const;
const EXPECTED_DOES_NOT_UNLOCK = [
  "ModelCoreEquationChange",
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
  "valveLoadTimingAcceptance",
  "reflectionCoefficientClaim",
  "rootCauseAcceptance",
  "fixAcceptance",
  "officialMorphologyAcceptance",
  "finalNoAlternansAcceptance",
  "clinicalScientificValidationClaim",
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
  "low-preload-alternans-edge",
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

export function validateArterialRootBoundaryTimingPhase5AG(
  rootDir = process.cwd(),
  options: ArterialRootBoundaryTimingPhase5AGValidationOptions = {},
): ArterialRootBoundaryTimingPhase5AGValidationReport {
  const errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[] = [];
  const warnings: ArterialRootBoundaryTimingPhase5AGValidationIssue[] = [];
  const evidence = resultArtifact as unknown as ArterialRootBoundaryTimingPhase5AGEvidence;
  const rebuildEvidence = options.rebuildEvidence !== false;

  if (rebuildEvidence) {
    validateFreshEvidence(evidence, errors);
  } else {
    warnings.push({
      severity: "warning",
      code: "phase5ag_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5AG fresh rebuild was skipped for this validation call because it reruns the full closed-loop matrix.",
    });
  }
  validateIdentity(evidence, errors);
  validateArtifactHash(evidence, errors);
  validateRuns(evidence, errors);
  validateSummary(evidence, errors);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5ag_runtime_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AG is a closed-loop timing diagnostic only; it does not adopt root/Zc, remove qDot clamps, or accept valve/load timing.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: ArterialRootBoundaryTimingPhase5AGEvidence,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  const fresh = buildArterialRootBoundaryTimingPhase5AGEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5ag_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AG artifact must match a fresh closed-loop timing builder run.");
  }
}

function validateIdentity(
  evidence: ArterialRootBoundaryTimingPhase5AGEvidence,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ARTERIAL_ROOT_BOUNDARY_TIMING_PHASE5AG_ID
    || evidence.phase !== "Phase 5AG"
    || evidence.claimBoundary !== "closed-loop-sourced-boundary-root-timing-diagnostic-only"
    || evidence.upstreamPhase5AFArtifactId !== "arterial-root-zc-calibration-phase5af-result-v1"
    || evidence.verifierScript !== "verify:myocardium-arterial-root-boundary-timing"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
  ) {
    addIssue(errors, "phase5ag_identity", RESULT_ARTIFACT_PATH, "Phase 5AG identity, upstream link, verifier script, or hash is invalid.");
  }
  if (
    evidence.protocol.pointSource !== "phase5x-full-synthetic-matrix-plus-frozen-low-preload-edge"
    || !arrayEquals(evidence.protocol.modelPathIds, ["stock-active-no-provider-v0", "developer-only-lv-land-v0"])
    || !arrayEquals(evidence.protocol.candidateSet.map((candidate) => candidate.id), EXPECTED_CANDIDATE_IDS)
    || evidence.protocol.sourcedCalibrationCandidateId !== "boundary-root-l-plus-1x-aov-l-mechanism"
    || evidence.protocol.sourcedCalibrationStatus !== "preferred-physiological-calibration-candidate"
    || evidence.protocol.pointCount !== EXPECTED_POINT_IDS.length
  ) {
    addIssue(errors, "phase5ag_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5AG must cover the full Phase 5X matrix plus frozen low-preload edge with only current and sourced-calibrated boundary/root candidates.");
  }
}

function validateArtifactHash(
  evidence: ArterialRootBoundaryTimingPhase5AGEvidence,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  const { normalizedSha256, ...withoutHash } = evidence;
  if (normalizedSha256 !== hashStable(withoutHash)) {
    addIssue(errors, "phase5ag_hash", RESULT_ARTIFACT_PATH, "Phase 5AG normalizedSha256 must match the stable hash of the artifact excluding the hash field.");
  }
}

function validateRuns(
  evidence: ArterialRootBoundaryTimingPhase5AGEvidence,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  if (!arrayEquals(evidence.points.map((point) => point.id), EXPECTED_POINT_IDS)) {
    addIssue(errors, "phase5ag_point_ids", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5AG point order must be Phase 5X sweep points plus the frozen low-preload edge.");
  }
  for (const point of evidence.points) {
    for (const side of ["stock", "land"] as const) {
      const runs = point[side];
      if (!arrayEquals(runs.map((run) => run.candidateId), EXPECTED_CANDIDATE_IDS)) {
        addIssue(errors, "phase5ag_candidate_ids", `${RESULT_ARTIFACT_PATH}.points.${point.id}.${side}`, "Each point/model path must record current then boundary/root candidate.");
      }
      for (const run of runs) validateRun(run, errors);
    }
  }
}

function validateRun(
  run: ArterialRootBoundaryTimingPhase5AGRun,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.points.${run.pointId}.${run.modelPathId}.${run.candidateId}`;
  if (
    run.candidateId === "current-closure"
    && (
      run.comparisonVsCurrent.classification !== "current-closure-reference"
      || run.comparisonVsCurrent.qDotEngagementSignal
      || run.comparisonVsCurrent.valveLoadTimingSignal
    )
  ) {
    addIssue(errors, "phase5ag_current_reference", pathPrefix, "Current closure runs must stay reference comparisons with no candidate signals.");
  }
  if (run.candidateId === "boundary-root-l-plus-1x-aov-l-mechanism") {
    if (
      run.parameterization !== "experimental-boundary-root-inertance-mechanism"
      || run.boundaryRootAdditionalMultipleOfAoVL !== 1
      || run.experimentalBoundaryRootInertance?.mechanismId !== "phase5ae-experimental-aortic-boundary-root-inertance-v1"
      || run.edgeOverrides !== null
    ) {
      addIssue(errors, "phase5ag_boundary_root_candidate", pathPrefix, "Boundary/root candidate must use the experimental mechanism with no direct Ao_SA edge override.");
    }
  }
  if (run.status === "measured" && run.metrics == null) {
    addIssue(errors, "phase5ag_measured_metrics", pathPrefix, "Measured runs must include closed-loop metrics.");
  }
  if (run.metrics && [
    run.metrics.CO_L,
    run.metrics.forwardDurationSecPerBeat,
    run.metrics.forwardVolumeMlPerBeat,
    run.metrics.qDotClampHitFractionAovOpen,
  ].some((value) => value == null || !Number.isFinite(value))) {
    addIssue(errors, "phase5ag_metric_finite", pathPrefix, "Measured timing/qDot metrics must be finite.");
  }
}

function validateSummary(
  evidence: ArterialRootBoundaryTimingPhase5AGEvidence,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  const runs = evidence.points.flatMap((point) => [...point.stock, ...point.land]);
  const candidateRuns = runs.filter((run) => run.candidateId === "boundary-root-l-plus-1x-aov-l-mechanism");
  const qDotTiming = candidateRuns.filter((run) =>
    isMeasuredHealthOk(run)
    && run.comparisonVsCurrent.classification === "candidate-qdot-timing-output-preserved"
  );
  const rawQDotTiming = candidateRuns.filter((run) =>
    run.comparisonVsCurrent.classification === "candidate-qdot-timing-output-preserved"
  );
  if (
    evidence.summary.pointCount !== evidence.points.length
    || evidence.summary.runCount !== runs.length
    || evidence.summary.measuredRunCount !== runs.filter((run) => run.status === "measured").length
    || evidence.summary.healthOkRunCount !== runs.filter(isMeasuredHealthOk).length
    || evidence.summary.candidateComparisonCount !== candidateRuns.length
    || evidence.summary.healthOkCandidateComparisonCount !== candidateRuns.filter(isMeasuredHealthOk).length
    || evidence.summary.qDotAndTimingOutputPreservedCount !== qDotTiming.length
    || evidence.summary.stockQDotAndTimingOutputPreservedCount !== qDotTiming.filter((run) => run.modelPathId === "stock-active-no-provider-v0").length
    || evidence.summary.landQDotAndTimingOutputPreservedCount !== qDotTiming.filter((run) => run.modelPathId === "developer-only-lv-land-v0").length
    || evidence.summary.qDotAndTimingOutputPreservedCount > rawQDotTiming.length
  ) {
    addIssue(errors, "phase5ag_summary_consistency", `${RESULT_ARTIFACT_PATH}.summary`, "Summary counts must be recomputable from run evidence.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("diagnostic timing evidence only")
    || !evidence.summary.recommendedNext.some((next) => next.includes("Land normal-floor"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not official-case tuning"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("Only current closure"))
  ) {
    addIssue(errors, "phase5ag_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Interpretation and limitations must keep Phase 5AG diagnostic-only and bounded.");
  }
}

function validateBoundary(
  evidence: ArterialRootBoundaryTimingPhase5AGEvidence,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5ag_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AG boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5ag_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AG must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, REUSED_RUNNER_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, ROADMAP_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_README_PATH, errors),
    readRequiredText(rootDir, PACKAGE_PATH, errors),
  ];
  for (const file of files) {
    if (file) validateNoLocalAbsolutePaths(file.path, file.text, errors);
  }
  const builderText = textFor(files, BUILDER_PATH);
  const reusedText = textFor(files, REUSED_RUNNER_PATH);
  const packageText = textFor(files, PACKAGE_PATH);
  const docsText = files.map((file) => file?.text ?? "").join("\n");
  if (
    !builderText.includes("phase5x-full-synthetic-matrix-plus-frozen-low-preload-edge")
    || !builderText.includes("noQDotClampRemoval: true")
    || !builderText.includes("noValveLoadTimingAcceptance: true")
    || !reusedText.includes("export function runArterialRootBoundaryInertancePoint")
  ) {
    addIssue(errors, "phase5ag_builder_contract", BUILDER_PATH, "Builder must record the full-matrix timing diagnostic and diagnostic-only/no-adoption boundaries.");
  }
  if (!packageText.includes("verify:myocardium-arterial-root-boundary-timing")) {
    addIssue(errors, "phase5ag_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AG verifier script.");
  }
  if (
    !docsText.includes("Phase 5AG")
    || !docsText.includes("arterial-root-boundary-timing-phase5ag-result-v1")
    || !docsText.includes("closed-loop valve/load timing")
  ) {
    addIssue(errors, "phase5ag_docs", "docs", "Docs must record Phase 5AG timing evidence and diagnostic boundary.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  const forbidden = [
    "arterial-root-boundary-timing-phase5ag-result-v1",
    "verify:myocardium-arterial-root-boundary-timing",
    "buildArterialRootBoundaryTimingPhase5AG",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5ag_no_production_wiring", relative, `Production-facing file must not wire Phase 5AG diagnostic token ${token}.`);
        }
      }
    }
  }
}

function isMeasuredHealthOk(
  run: Pick<ArterialRootBoundaryTimingPhase5AGRun, "status" | "health"> | undefined,
): boolean {
  return run?.status === "measured" && run.health?.status === "ok";
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5ag_local_path", pathLabel, "Committed Phase 5AG evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5ag_missing_file", relativePath, "Required Phase 5AG file is missing.");
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

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}

function addIssue(
  issues: ArterialRootBoundaryTimingPhase5AGValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateArterialRootBoundaryTimingPhase5AG(process.cwd(), {
    rebuildEvidence: !process.argv.includes("--no-rebuild"),
  });
  console.log(
    `Arterial boundary/root timing Phase 5AG ${report.pass ? "PASS" : "FAIL"} `
    + `points=${report.evidence.summary.pointCount} `
    + `qDotTiming=${report.evidence.summary.qDotAndTimingOutputPreservedCount} `
    + `cost=${report.evidence.summary.outputOrTimingCostCount} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyArterialRootBoundaryTimingPhase5AG.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
