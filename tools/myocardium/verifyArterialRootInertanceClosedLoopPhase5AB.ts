import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5XArtifact from "@/data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
import resultArtifact from "@/data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json";
import {
  ARTERIAL_ROOT_INERTANCE_CLOSED_LOOP_PHASE5AB_ID,
  buildArterialRootInertanceClosedLoopPhase5ABEvidence,
  hashStable,
  type ArterialRootInertanceClosedLoopPhase5ABEvidence,
  type ArterialRootInertanceClosedLoopPhase5ABPoint,
  type ArterialRootInertanceClosedLoopPhase5ABRun,
} from "@/tools/myocardium/buildArterialRootInertanceClosedLoopPhase5AB";

export type ArterialRootInertanceClosedLoopPhase5ABValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ArterialRootInertanceClosedLoopPhase5ABValidationReport = {
  readonly pass: boolean;
  readonly evidence: ArterialRootInertanceClosedLoopPhase5ABEvidence;
  readonly errors: readonly ArterialRootInertanceClosedLoopPhase5ABValidationIssue[];
  readonly warnings: readonly ArterialRootInertanceClosedLoopPhase5ABValidationIssue[];
};

export type ArterialRootInertanceClosedLoopPhase5ABValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildArterialRootInertanceClosedLoopPhase5AB.ts";
const VERIFIER_PATH = "tools/myocardium/verifyArterialRootInertanceClosedLoopPhase5AB.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const CURRENT_LANES_PATH = "docs/status/current-lanes.md";
const PACKAGE_PATH = "package.json";

const EXPECTED_MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const EXPECTED_CANDIDATE_IDS = [
  "current-aov-l",
  "effective-root-l-plus-1x-aov-l",
  "effective-root-l-plus-2x-aov-l",
  "effective-root-l-plus-3x-aov-l",
] as const;
const EXPECTED_DOES_NOT_UNLOCK = [
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
  "ZcReflectionAvailability",
  "valveTimingAcceptance",
  "rootCauseAcceptance",
  "fixAcceptance",
  "officialMorphologyAcceptance",
  "finalNoAlternansAcceptance",
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

export function validateArterialRootInertanceClosedLoopPhase5AB(
  rootDir = process.cwd(),
  options: ArterialRootInertanceClosedLoopPhase5ABValidationOptions = {},
): ArterialRootInertanceClosedLoopPhase5ABValidationReport {
  const errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[] = [];
  const warnings: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[] = [];
  const evidence = resultArtifact as unknown as ArterialRootInertanceClosedLoopPhase5ABEvidence;

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
      code: "phase5ab_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5AB rebuild is opt-in because it reruns the full Phase 5X stock/Land closed-loop candidate matrix plus a low-preload edge.",
    });
  }
  warnings.push({
    severity: "warning",
    code: "phase5ab_runtime_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AB is a diagnostic sweep only; runtime default flip, qDot clamp removal, and fix acceptance remain blocked.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: ArterialRootInertanceClosedLoopPhase5ABEvidence,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  const fresh = buildArterialRootInertanceClosedLoopPhase5ABEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5ab_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AB artifact must match a fresh measured builder run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: ArterialRootInertanceClosedLoopPhase5ABEvidence,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ARTERIAL_ROOT_INERTANCE_CLOSED_LOOP_PHASE5AB_ID
    || evidence.phase !== "Phase 5AB"
    || evidence.claimBoundary !== "closed-loop-effective-aov-root-inertance-diagnostic-only"
    || evidence.upstreamPhase5AAArtifactId !== "arterial-root-inertance-bench-phase5aa-result-v1"
    || evidence.verifierScript !== "verify:myocardium-arterial-root-inertance-closed-loop"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
    || evidence.normalizedSha256 !== hashStable(artifactWithoutHash(evidence))
  ) {
    addIssue(errors, "phase5ab_identity", RESULT_ARTIFACT_PATH, "Phase 5AB identity, upstream link, verifier script, or normalized hash is invalid.");
  }
}

function validateProtocol(
  evidence: ArterialRootInertanceClosedLoopPhase5ABEvidence,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  const protocol = evidence.protocol;
  if (
    protocol.pointSource !== "phase5x-full-plus-frozen-low-preload-edge"
    || !arrayEquals(protocol.modelPathIds, EXPECTED_MODEL_PATH_IDS)
    || protocol.pointCount !== expectedPointIds().length
    || protocol.sampleHz !== 1000
    || protocol.resolvedSampleHz !== 1000
    || protocol.dtSec !== 0.001
    || protocol.measureBeats !== 3
    || protocol.aovOpenThreshold !== 0.5
    || protocol.qDotClampMlPerS2 !== 40000
    || protocol.closedLoopCarrier !== "existing-AoV_L-effective-aov-root-boundary-inertance"
    || protocol.successSignalThresholds.clampReductionMin !== 0.25
    || protocol.successSignalThresholds.forwardVolumeRatioMin !== 0.8
    || protocol.successSignalThresholds.forwardVolumeRatioMax !== 1.25
    || protocol.successSignalThresholds.coRatioMin !== 0.75
    || protocol.successSignalThresholds.coRatioMax !== 1.25
    || protocol.successSignalThresholds.durationRatioMin !== 0.75
    || !arrayEquals(protocol.candidateSet.map((candidate) => candidate.id), EXPECTED_CANDIDATE_IDS)
  ) {
    addIssue(errors, "phase5ab_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5AB protocol constants must remain fixed for the closed-loop effective AoV/root inertance diagnostic.");
  }
  if (!arrayEquals(evidence.points.map((point) => point.id), expectedPointIds())) {
    addIssue(errors, "phase5ab_point_ids", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5AB must cover all Phase 5X points plus the low-preload edge in order.");
  }
}

function validatePoints(
  evidence: ArterialRootInertanceClosedLoopPhase5ABEvidence,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  if (evidence.points.length !== expectedPointIds().length) {
    addIssue(errors, "phase5ab_point_count", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5AB point count must match the full Phase 5X matrix plus low-preload edge.");
  }
  for (const point of evidence.points) {
    validateRunSet(point, point.stock, "stock", errors);
    validateRunSet(point, point.land, "land", errors);
  }
}

function validateRunSet(
  point: ArterialRootInertanceClosedLoopPhase5ABPoint,
  runs: readonly ArterialRootInertanceClosedLoopPhase5ABRun[],
  side: "stock" | "land",
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.points.${point.id}.${side}`;
  if (!arrayEquals(runs.map((run) => run.candidateId), EXPECTED_CANDIDATE_IDS)) {
    addIssue(errors, "phase5ab_candidate_ids", pathPrefix, "Each stock/Land run set must record current plus the 2x/3x/4x effective inertance candidates.");
  }
  const current = runs[0];
  if (
    current?.candidateId !== "current-aov-l"
    || current.comparisonVsCurrent?.classification !== "current-closure-reference"
    || current.comparisonVsCurrent.qDotClampReductionVsCurrentAovOpen !== 0
  ) {
    addIssue(errors, "phase5ab_current_reference", pathPrefix, "Current closure must be first and carry a self-reference comparison.");
  }
  for (const run of runs) validateRun(point, run, side, errors);
}

function validateRun(
  point: ArterialRootInertanceClosedLoopPhase5ABPoint,
  run: ArterialRootInertanceClosedLoopPhase5ABRun,
  side: "stock" | "land",
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.points.${point.id}.${side}.${run.candidateId}`;
  if (
    run.pointId !== point.id
    || run.targetTBVMl !== point.targetTBVMl
    || run.baseAoVInertanceMmHgSec2PerMl <= 0
    || run.effectiveAoVInertanceMmHgSec2PerMl <= 0
    || run.effectiveAoVInertanceMultiple < 1
    || run.comparisonVsCurrent == null
  ) {
    addIssue(errors, "phase5ab_run_shape", pathPrefix, "Each run must record point identity, inertance values, and comparison metadata.");
  }
  if (run.status === "measured") {
    if (
      !run.settled
      || run.health == null
      || run.metrics == null
      || run.metrics.sampleCount <= 0
      || run.metrics.resolvedSampleHz !== 1000
      || run.metrics.aovOpenSampleCount <= 0
      || run.metrics.qDotClampHitFractionAll == null
      || run.metrics.qDotClampHitFractionAovOpen == null
      || run.metrics.forwardVolumeMlPerBeat == null
    ) {
      addIssue(errors, "phase5ab_measured_run_shape", pathPrefix, "Measured runs must settle and record finite AoV qDot/output/morphology readouts.");
    }
  } else if (run.metrics != null) {
    addIssue(errors, "phase5ab_unmeasured_metrics", pathPrefix, "Unmeasured or settle-failed runs must not carry measured metrics.");
  }
  if (side === "stock") {
    if (run.modelPathId !== "stock-active-no-provider-v0" || run.experimentalActiveSourceProvider || run.sourceProviderId != null || run.providerInstrumentation != null) {
      addIssue(errors, "phase5ab_stock_path", pathPrefix, "Stock path must not use an experimental active source provider.");
    }
  } else if (
    run.modelPathId !== "developer-only-lv-land-v0"
    || !run.experimentalActiveSourceProvider
    || !run.sourceProviderId?.includes("phase5u-developer-only-be-phase5q-calcium")
    || run.providerInstrumentation == null
    || (run.status === "measured" && run.providerInstrumentation.sourceActiveStressCallCount <= 0)
  ) {
    addIssue(errors, "phase5ab_land_path", pathPrefix, "Land path must exercise the developer-only LV source provider and record instrumentation.");
  }
}

function validateSummary(
  evidence: ArterialRootInertanceClosedLoopPhase5ABEvidence,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
  warnings: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  const runs = evidence.points.flatMap((point) => [...point.stock, ...point.land]);
  const measuredRuns = runs.filter((run) => run.status === "measured");
  const healthOkRuns = measuredRuns.filter((run) => run.health?.status === "ok");
  const landRuns = runs.filter((run) => run.modelPathId === "developer-only-lv-land-v0");
  const candidateRuns = runs.filter((run) => run.candidateId !== "current-aov-l");
  const healthOkCandidateRuns = candidateRuns.filter((run) => run.status === "measured" && run.health?.status === "ok");
  const paretoRuns = candidateRuns.filter((run) => run.comparisonVsCurrent?.lowerClampOutputPreserved);
  const healthOkParetoRuns = paretoRuns.filter((run) => run.health?.status === "ok");
  const landParetoRuns = paretoRuns.filter((run) => run.modelPathId === "developer-only-lv-land-v0");
  const healthOkLandParetoRuns = landParetoRuns.filter((run) => run.health?.status === "ok");
  const positiveMorphologyRuns = candidateRuns.filter((run) => run.comparisonVsCurrent?.positiveMorphologySignal);
  const healthOkPositiveMorphologyRuns = positiveMorphologyRuns.filter((run) => run.health?.status === "ok");
  const nonOkOrUnmeasuredRunIds = runs
    .filter((run) => run.status !== "measured" || run.health?.status !== "ok")
    .map(nonOkOrUnmeasuredRunId);
  const artifactNonOkRunIds = evidence.summary.nonOkOrUnmeasuredRuns.map((run) =>
    `${run.modelPathId}:${run.pointId}:${run.candidateId}:${run.status}:${run.healthStatus ?? "null"}`
  );
  if (
    evidence.summary.pointCount !== evidence.points.length
    || evidence.summary.runCount !== runs.length
    || evidence.summary.measuredRunCount !== measuredRuns.length
    || evidence.summary.healthOkRunCount !== healthOkRuns.length
    || evidence.summary.landSolveFailureCount !== landRuns.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0)
    || evidence.summary.candidateComparisonCount !== candidateRuns.length
    || evidence.summary.healthOkCandidateComparisonCount !== healthOkCandidateRuns.length
    || evidence.summary.paretoSignalOutputPreservedCount !== paretoRuns.length
    || evidence.summary.healthOkParetoSignalOutputPreservedCount !== healthOkParetoRuns.length
    || evidence.summary.landParetoSignalOutputPreservedCount !== landParetoRuns.length
    || evidence.summary.healthOkLandParetoSignalOutputPreservedCount !== healthOkLandParetoRuns.length
    || evidence.summary.positiveMorphologySignalCount !== positiveMorphologyRuns.length
    || evidence.summary.healthOkPositiveMorphologySignalCount !== healthOkPositiveMorphologyRuns.length
    || !arrayEquals(artifactNonOkRunIds, nonOkOrUnmeasuredRunIds)
  ) {
    addIssue(errors, "phase5ab_summary_consistency", `${RESULT_ARTIFACT_PATH}.summary`, "Summary counts must be recomputable from run evidence.");
  }
  const edge = evidence.points.find((point) => point.id === "low-preload-alternans-edge");
  if (
    evidence.summary.lowPreloadAlternansEdge.stockCurrentPeriodBeats !== (edge?.stock[0]?.health?.periodBeats ?? null)
    || evidence.summary.lowPreloadAlternansEdge.landCurrentPeriodBeats !== (edge?.land[0]?.health?.periodBeats ?? null)
    || !evidence.summary.lowPreloadAlternansEdge.interpretation.includes("does not unlock final no-alternans")
  ) {
    addIssue(errors, "phase5ab_low_preload_edge", `${RESULT_ARTIFACT_PATH}.summary.lowPreloadAlternansEdge`, "Low-preload edge summary must be bounded and recomputable from current runs.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("Phase 5AB closed-loop diagnostic")
    || !evidence.summary.currentInterpretation.includes("not runtime adoption")
    || !evidence.summary.currentInterpretation.includes(`${healthOkParetoRuns.length}/${healthOkCandidateRuns.length} health-ok candidate comparisons`)
    || !evidence.summary.currentInterpretation.includes(`${healthOkPositiveMorphologyRuns.length} health-ok candidate comparisons`)
    || (nonOkOrUnmeasuredRunIds.length > 0 && !evidence.summary.currentInterpretation.includes("excluded from the health-ok headline"))
    || !evidence.summary.recommendedNext.some((next) => next.includes("qDot clamp, valve thresholds"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("existing AoV_L inertance carrier"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not a final structural alternans"))
  ) {
    addIssue(errors, "phase5ab_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Interpretation and limitations must keep Phase 5AB diagnostic-only and non-acceptance.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5ab_candidate_signal_count",
    path: `${RESULT_ARTIFACT_PATH}.summary`,
    message: `Phase 5AB pareto candidates=${paretoRuns.length}/${candidateRuns.length}; healthOkPareto=${healthOkParetoRuns.length}/${healthOkCandidateRuns.length}; LandPareto=${landParetoRuns.length}; positiveMorphology=${healthOkPositiveMorphologyRuns.length} health-ok/${positiveMorphologyRuns.length} raw.`,
  });
}

function nonOkOrUnmeasuredRunId(run: ArterialRootInertanceClosedLoopPhase5ABRun): string {
  return `${run.modelPathId}:${run.pointId}:${run.candidateId}:${run.status}:${run.health?.status ?? "null"}`;
}

function validateBoundary(
  evidence: ArterialRootInertanceClosedLoopPhase5ABEvidence,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5ab_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AB boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5ab_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AB must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, ROADMAP_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_README_PATH, errors),
    readRequiredText(rootDir, CURRENT_LANES_PATH, errors),
    readRequiredText(rootDir, PACKAGE_PATH, errors),
  ];
  for (const file of files) {
    if (file) validateNoLocalAbsolutePaths(file.path, file.text, errors);
  }
  const builderText = textFor(files, BUILDER_PATH);
  const packageText = textFor(files, PACKAGE_PATH);
  const docsText = files.map((file) => file?.text ?? "").join("\n");
  if (
    !builderText.includes("existing-AoV_L-effective-aov-root-boundary-inertance")
    || !builderText.includes("noQDotClampRemoval: true")
    || !builderText.includes("noValveThresholdTuning: true")
    || !builderText.includes("noDirectAoSAAdoption: true")
  ) {
    addIssue(errors, "phase5ab_builder_contract", BUILDER_PATH, "Builder must record closed-loop AoV_L carrier and no-acceptance/no-tuning boundaries.");
  }
  if (!packageText.includes("verify:myocardium-arterial-root-inertance-closed-loop")) {
    addIssue(errors, "phase5ab_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AB verifier script.");
  }
  if (
    !docsText.includes("Phase 5AB")
    || !docsText.includes("arterial-root-inertance-closed-loop-phase5ab-result-v1")
    || !docsText.includes("closed-loop")
    || !docsText.includes("AoV_L")
  ) {
    addIssue(errors, "phase5ab_docs", "docs", "Docs must record Phase 5AB closed-loop evidence and AoV_L diagnostic boundary.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  const forbidden = [
    "arterial-root-inertance-closed-loop-phase5ab-result-v1",
    "verify:myocardium-arterial-root-inertance-closed-loop",
    "buildArterialRootInertanceClosedLoopPhase5AB",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5ab_no_production_wiring", relative, `Production-facing file must not wire Phase 5AB diagnostic token ${token}.`);
        }
      }
    }
  }
}

function artifactWithoutHash(
  evidence: ArterialRootInertanceClosedLoopPhase5ABEvidence,
): Omit<ArterialRootInertanceClosedLoopPhase5ABEvidence, "normalizedSha256"> {
  const { normalizedSha256: _normalizedSha256, ...withoutHash } = evidence;
  return withoutHash;
}

function expectedPointIds(): readonly string[] {
  return [
    ...phase5XArtifact.protocol.sweepPoints.map((point) => point.id),
    "low-preload-alternans-edge",
  ];
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5ab_local_path", pathLabel, "Committed Phase 5AB evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5ab_missing_file", relativePath, "Required Phase 5AB file is missing.");
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
  issues: ArterialRootInertanceClosedLoopPhase5ABValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateArterialRootInertanceClosedLoopPhase5AB(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
  });
  console.log(
    `Arterial root inertance closed-loop Phase 5AB ${report.pass ? "PASS" : "FAIL"} `
    + `points=${report.evidence.summary.pointCount} `
    + `runs=${report.evidence.summary.runCount} `
    + `healthOkPareto=${report.evidence.summary.healthOkParetoSignalOutputPreservedCount} `
    + `landPareto=${report.evidence.summary.landParetoSignalOutputPreservedCount} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyArterialRootInertanceClosedLoopPhase5AB.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
