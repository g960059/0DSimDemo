import { readFileSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json";
import {
  MODELCORE_PAIRED_LAND_OUTPUT_MATCHED_QDOT_ATTRIBUTION_EVIDENCE_ID,
  buildModelCorePairedLandOutputMatchedQDotAttributionEvidence,
  type ModelCorePairedLandOutputMatchedQDotAttributionEvidence,
  type ModelCorePairedLandOutputMatchedQDotPair,
  type ModelCorePairedLandOutputMatchedQDotRunPoint,
} from "@/tools/myocardium/buildModelCorePairedLandOutputMatchedQDotAttributionEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCorePairedLandOutputMatchedQDotAttributionValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCorePairedLandOutputMatchedQDotAttributionEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json";
const UPSTREAM_RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json";
const BUILDER_PATH =
  "tools/myocardium/buildModelCorePairedLandOutputMatchedQDotAttributionEvidence.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const ROUTE_DOC_PATH = "docs/myocardium/roadmap/phase5c-modelcore-equivalent-route-gate.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";

export function validateModelCorePairedLandOutputMatchedQDotAttribution(rootDir = process.cwd()):
ModelCorePairedLandOutputMatchedQDotAttributionValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCorePairedLandOutputMatchedQDotAttributionEvidence();
  const artifact = resultArtifact as ModelCorePairedLandOutputMatchedQDotAttributionEvidence;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: ModelCorePairedLandOutputMatchedQDotAttributionEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MODELCORE_PAIRED_LAND_OUTPUT_MATCHED_QDOT_ATTRIBUTION_EVIDENCE_ID
    || evidence.phase !== "Phase 5C-N"
    || evidence.claimBoundary !== "predeclared-tbv-axis-output-match-diagnostic-only"
    || evidence.upstreamQDotAttributionResultArtifactPath !== UPSTREAM_RESULT_ARTIFACT_PATH
    || evidence.verifierScript !== "verify:myocardium-modelcore-paired-land-output-matched-qdot-attribution"
  ) {
    addIssue(errors, "phase5n_identity", "live-evidence", "Live evidence must identify the Phase 5C-N predeclared TBV-axis output-match diagnostic.");
  }
  if (
    evidence.boundary.sourceProviderDifferenceOnlyScope !== "within-each-same-effective-tbv-pair-only"
    || evidence.boundary.crossTbvOutputMatchIsSourceProviderOnly !== false
    || evidence.boundary.preloadAxisMode !== "predeclared-diagnostic-grid-not-accepted-tuning"
    || evidence.boundary.noQDotTuning !== true
    || evidence.boundary.noValveTuning !== true
    || evidence.boundary.noAfterloadTuning !== true
    || evidence.boundary.noLandParameterTuning !== true
    || evidence.boundary.preloadTuning !== false
    || evidence.boundary.allPointsReported !== true
  ) {
    addIssue(errors, "phase5n_boundary", "live-evidence.boundary", "Phase 5C-N must keep the TBV axis diagnostic-only and forbid qDot, valve, afterload, preload, and Land-parameter tuning.");
  }
  if (
    !arrayEquals(evidence.diagnosticProtocol.predeclaredDeltasMl, [-1250, -1000, -750, -500, 0, 500, 1000])
    || evidence.diagnosticProtocol.pinnedDeltaTotalBloodVolumeMl !== -1250
    || evidence.diagnosticProtocol.pinnedEffectiveTotalBloodVolumeMl !== 4350
    || evidence.diagnosticProtocol.pointInitialization !== "independent-from-target-tbv-no-cross-point-warm-start"
    || evidence.diagnosticProtocol.settlePolicy.capSeconds !== 45
  ) {
    addIssue(errors, "phase5n_protocol", "live-evidence.diagnosticProtocol", "Phase 5C-N must use the predeclared independent-point TBV grid with the pinned Phase 5C-L/M point.");
  }
  validateMatrix(evidence.matrix, errors);
  if (
    evidence.runHealth.allPointsSettledWithoutCap !== true
    || evidence.runHealth.capReachedPointCount !== 0
    || evidence.runHealth.nonOkHealthPointCount !== 0
    || evidence.runHealth.contaminatedTbvPointCount !== 0
    || evidence.runHealth.finiteTracePayloadAllPoints !== true
  ) {
    addIssue(errors, "phase5n_run_health", "live-evidence.runHealth", "Every Phase 5C-N matrix point must settle by convergence before the 45s cap with clean finite health.");
  }
  if (
    evidence.pinnedPointReproduction.deltaVolumeMl !== -1250
    || evidence.pinnedPointReproduction.legacyPeriodBeats !== 2
    || evidence.pinnedPointReproduction.landPeriodBeats !== 1
    || evidence.pinnedPointReproduction.legacyAoVQDotClampHitFraction <= 0
    || evidence.pinnedPointReproduction.landAoVQDotClampHitFraction !== 0
  ) {
    addIssue(errors, "phase5n_pinned_reproduction", "live-evidence.pinnedPointReproduction", "Phase 5C-N must reproduce the Phase 5C-M pinned legacy period-2 / Land period-1 qDot attribution point.");
  }
  if (
    evidence.outputMatchAnalysis.status !== "not-overlapped"
    || evidence.outputMatchAnalysis.bestLandCandidate.meanNormalizedScore
      <= evidence.outputMatchAnalysis.threshold.meanNormalizedScoreMax
    || evidence.outputMatchAnalysis.bestLandToPinnedLegacyRatios.CO_L >= 0.5
    || evidence.outputMatchAnalysis.bestLandToPinnedLegacyRatios.SV_L >= 0.5
    || evidence.outputMatchAnalysis.bestLandToPinnedLegacyRatios.QAoPeakMlPerSec >= 0.2
  ) {
    addIssue(errors, "phase5n_output_match_status", "live-evidence.outputMatchAnalysis", "The predeclared TBV-axis diagnostic should record no Land output overlap with the pinned legacy period-2 positive control.");
  }
  if (
    evidence.attributionInterpretation.classification
      !== "preload-axis-output-match-not-achieved-clamp-avoidance-risk-remains"
    || evidence.attributionInterpretation.structuralAlternansRemovalClaim !== "not-established"
    || evidence.attributionInterpretation.finalNoAlternansClaim !== "not-claimed"
    || evidence.attributionInterpretation.officialMorphologyAcceptance !== "not-claimed"
    || !evidence.attributionInterpretation.requiredNextChecks.includes("SDIRK2-reference-before-final-no-alternans")
    || !evidence.attributionInterpretation.requiredNextChecks.includes("explicit-output-forcing-or-owner-approved-match-axis-before-structural-attribution")
  ) {
    addIssue(errors, "phase5n_interpretation", "live-evidence.attributionInterpretation", "Phase 5C-N must leave structural alternans removal unestablished and require further robustness checks.");
  }
  for (const token of [
    "runtimeReplacement",
    "officialMorphologyAcceptance",
    "finalNoAlternans",
    "structuralAlternansRemoval",
    "qDotTuning",
    "valveThresholdTuning",
    "arterialLoadTuning",
    "preloadTuning",
    "landParameterTuning",
    "TriSegAdoption",
    "StudioScientificValidityClaim",
  ] as const) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5n_does_not_unlock", "live-evidence.doesNotUnlock", `Phase 5C-N must keep ${token} blocked.`);
    }
  }
  warnings.push({
    severity: "warning",
    code: "phase5n_output_match_not_achieved",
    path: "live-evidence.outputMatchAnalysis",
    message: "Predeclared TBV-axis output matching did not reach the pinned legacy period-2 qDot clamp regime; clamp-threshold avoidance remains unresolved.",
  });
}

function validateMatrix(
  matrix: readonly ModelCorePairedLandOutputMatchedQDotPair[],
  errors: ValidationIssue[],
): void {
  if (matrix.length !== 7) {
    addIssue(errors, "phase5n_matrix_size", "live-evidence.matrix", "Phase 5C-N matrix must report every predeclared TBV point.");
  }
  for (const pair of matrix) {
    if (
      pair.sameClosureStableHash !== true
      || pair.sourceProviderDifferenceOnlyWithinPoint !== true
      || pair.legacy.deltaVolumeMl !== pair.land.deltaVolumeMl
      || pair.legacy.effectiveTotalBloodVolumeMl !== pair.land.effectiveTotalBloodVolumeMl
    ) {
      addIssue(errors, "phase5n_same_point_pairing", `live-evidence.matrix.${pair.deltaVolumeMl}`, "Each TBV point must preserve same-closure source-provider-only pairing within that point.");
    }
    validatePoint(pair.legacy, `live-evidence.matrix.${pair.deltaVolumeMl}.legacy`, errors);
    validatePoint(pair.land, `live-evidence.matrix.${pair.deltaVolumeMl}.land`, errors);
    if (
      pair.legacy.clampAttributionTrace.sampleCount <= 0
      || pair.land.clampAttributionTrace.sampleCount <= 0
      || !Number.isFinite(pair.comparison.landVsLegacyCOLDeltaLMin)
      || !Number.isFinite(pair.comparison.landVsLegacyQAoPeakDeltaMlPerSec)
    ) {
      addIssue(errors, "phase5n_pair_metrics", `live-evidence.matrix.${pair.deltaVolumeMl}`, "Each pair must include finite output and qDot attribution metrics.");
    }
  }
}

function validatePoint(
  point: ModelCorePairedLandOutputMatchedQDotRunPoint,
  pathLabel: string,
  errors: ValidationIssue[],
): void {
  if (
    point.independentlyInitializedPoint !== true
    || point.settled !== true
    || point.settleReason !== "converged"
    || point.settleActualSeconds == null
    || point.settleActualSeconds >= 45
    || point.settleBeats < 6
    || point.healthStatus !== "ok"
    || point.tbvClassification !== "clean"
    || point.tbvSanitizeAbsMl > 0.05
    || point.tbvProjectionAppliedMl > 0.05
    || point.maxValveReverseMl > 0.05
    || point.finiteTracePayload !== true
    || point.providerInstrumentation.sourceActiveStressCallCount <= 0
    || !Number.isFinite(point.CO_L)
    || !Number.isFinite(point.SV_L)
    || !Number.isFinite(point.QAoPeakMlPerSec)
    || !Number.isFinite(point.peakSigmaActPa)
    || point.clampAttributionTrace.sampleCount <= 0
  ) {
    addIssue(errors, "phase5n_point_health", pathLabel, "Every Phase 5C-N point must be independently initialized, converged before cap, clean, finite, and non-reversing.");
  }
  if (
    point.sourceProviderId === "modelcore-experimental-land2017-lv-source-only-provider-v1"
    && (
      point.providerInstrumentation.commitProviderStateAfterStepCount <= 0
      || point.providerInstrumentation.landSolveFailureCount !== 0
    )
  ) {
    addIssue(errors, "phase5n_land_point_instrumentation", pathLabel, "Every Land point must record per-point provider commits with zero Land solver failures.");
  }
}

function validateArtifact(
  artifact: ModelCorePairedLandOutputMatchedQDotAttributionEvidence,
  evidence: ModelCorePairedLandOutputMatchedQDotAttributionEvidence,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5n_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match the live Phase 5C-N output-match diagnostic evidence.");
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const builderText = readFileSync(path.join(rootDir, BUILDER_PATH), "utf8");
  const readmeText = readOptionalText(rootDir, README_PATH);
  const roadmapText = readOptionalText(rootDir, ROADMAP_PATH);
  const routeDocText = readOptionalText(rootDir, ROUTE_DOC_PATH);
  const lanesText = readOptionalText(rootDir, HISTORICAL_LANES_PATH);
  const packageText = readOptionalText(rootDir, "package.json");
  if (
    !builderText.includes("predeclared-diagnostic-grid-not-accepted-tuning")
    || !builderText.includes("crossTbvOutputMatchIsSourceProviderOnly: false")
    || !builderText.includes("independent-from-target-tbv-no-cross-point-warm-start")
    || !builderText.includes("providerInstrumentation")
    || /structuralAlternansRemovalClaim\s*:\s*\"(?:claimed|established)\"/.test(builderText)
  ) {
    addIssue(errors, "phase5n_builder_boundary", BUILDER_PATH, "Builder must keep output matching diagnostic-only and avoid structural/final acceptance claims.");
  }
  if (readmeText && !readmeText.includes("Phase 5C-N")) {
    addIssue(errors, "phase5n_readme", README_PATH, "README must record the Phase 5C-N output-match diagnostic result.");
  }
  if (roadmapText && !roadmapText.includes("Phase 5C-N")) {
    addIssue(errors, "phase5n_roadmap", ROADMAP_PATH, "Roadmap must record the Phase 5C-N output-match diagnostic result.");
  }
  if (routeDocText && !routeDocText.includes("Phase 5C-N")) {
    addIssue(errors, "phase5n_route_doc", ROUTE_DOC_PATH, "Route gate doc must keep the Phase 5C-N boundary visible.");
  }
  if (lanesText && !lanesText.includes("output-match not-overlapped")) {
    addIssue(errors, "phase5n_current_lanes", HISTORICAL_LANES_PATH, "Current lanes must show the Phase 5C-N output-match result as still unresolved for structural attribution.");
  }
  if (packageText && !packageText.includes("verify:myocardium-modelcore-paired-land-output-matched-qdot-attribution")) {
    addIssue(errors, "phase5n_package_script", "package.json", "package.json must expose the Phase 5C-N verifier script.");
  }
}

function readOptionalText(rootDir: string, filePath: string): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
    return null;
  }
}

function arrayEquals(actual: readonly number[], expected: readonly number[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function parseArgs(argv: readonly string[]): { rootDir: string } {
  let rootDir = process.cwd();
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg.startsWith("--root=")) rootDir = arg.slice("--root=".length);
  }
  return { rootDir };
}

function printHelp(): void {
  console.log([
    "Usage: npm run verify:myocardium-modelcore-paired-land-output-matched-qdot-attribution -- [--root=DIR]",
    "",
    "Runs and validates the Phase 5C-N predeclared TBV-axis output-match diagnostic.",
  ].join("\n"));
}

function printReport(report: ModelCorePairedLandOutputMatchedQDotAttributionValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore paired Land output-matched qDot attribution ${status} `
    + `outputMatch=${report.evidence.outputMatchAnalysis.status} `
    + `bestDelta=${report.evidence.outputMatchAnalysis.bestLandCandidate.deltaVolumeMl} `
    + `bestScore=${report.evidence.outputMatchAnalysis.bestLandCandidate.meanNormalizedScore} `
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
  const options = parseArgs(process.argv.slice(2));
  const report = validateModelCorePairedLandOutputMatchedQDotAttribution(options.rootDir);
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
