import { readFileSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-source-forcing-bracket-result-v1.json";
import {
  MODELCORE_LAND_CALCIUM_SOURCE_FORCING_BRACKET_EVIDENCE_ID,
  buildModelCoreLandCalciumSourceForcingBracketEvidence,
  type ModelCoreLandCalciumSourceForcingBracketEvidence,
  type ModelCoreLandCalciumSourceForcingPair,
  type ModelCoreLandCalciumSourceForcingRunPoint,
} from "@/tools/myocardium/buildModelCoreLandCalciumSourceForcingBracketEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCoreLandCalciumSourceForcingBracketValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCoreLandCalciumSourceForcingBracketEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/modelcore-land-calcium-source-forcing-bracket-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildModelCoreLandCalciumSourceForcingBracketEvidence.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const ROUTE_DOC_PATH = "docs/myocardium/roadmap/phase5c-modelcore-equivalent-route-gate.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";

export function validateModelCoreLandCalciumSourceForcingBracket(rootDir = process.cwd()):
ModelCoreLandCalciumSourceForcingBracketValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCoreLandCalciumSourceForcingBracketEvidence();
  const artifact = resultArtifact as ModelCoreLandCalciumSourceForcingBracketEvidence;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: ModelCoreLandCalciumSourceForcingBracketEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MODELCORE_LAND_CALCIUM_SOURCE_FORCING_BRACKET_EVIDENCE_ID
    || evidence.phase !== "Phase 5C-P"
    || evidence.claimBoundary !== "calcium-source-scale-forcing-bracket-only"
    || evidence.verifierScript !== "verify:myocardium-modelcore-land-calcium-source-forcing-bracket"
  ) {
    addIssue(errors, "phase5p_identity", "live-evidence", "Phase 5C-P evidence must identify the calcium/source forcing bracket.");
  }
  if (
    evidence.boundary.sourceProviderForcingOnly !== true
    || evidence.boundary.crossScaleInterpretationIsSourceProviderOnly !== false
    || evidence.boundary.explicitForcingNotTuning !== true
    || evidence.boundary.noQDotTuning !== true
    || evidence.boundary.noValveTuning !== true
    || evidence.boundary.noAfterloadTuning !== true
    || evidence.boundary.noPreloadTuning !== true
    || evidence.boundary.noLandParameterTuning !== true
    || evidence.boundary.noRuntimeReplacement !== true
    || evidence.boundary.deliveredStressNonnegativeClampIsProviderForcingBoundary !== true
  ) {
    addIssue(errors, "phase5p_boundary", "live-evidence.boundary", "Phase 5C-P must remain explicit source-provider forcing, not closure tuning or runtime replacement.");
  }
  if (
    !arrayEquals(evidence.diagnosticProtocol.diagnosticDeltasMl, [-1250, 1000])
    || evidence.diagnosticProtocol.forcingScenarios.length !== 9
    || evidence.diagnosticProtocol.pointInitialization !== "independent-from-target-tbv-no-cross-point-warm-start"
    || !evidence.diagnosticProtocol.closureInvariant.includes("qDot")
  ) {
    addIssue(errors, "phase5p_protocol", "live-evidence.diagnosticProtocol", "Phase 5C-P must run the pinned and best-Land points with the predeclared forcing scenarios and unchanged non-provider closure.");
  }
  if (
    evidence.runHealth.legacyTargetsSettledByConvergence !== true
    || evidence.runHealth.forcedPointCount !== 18
    || evidence.runHealth.forcedPointsSettledByConvergence !== 18
    || evidence.runHealth.forcedPointsCapOrNonOk !== 0
    || evidence.runHealth.landSolveFailureCount !== 0
    || evidence.runHealth.sourceAuditSamplesPresent !== true
    || evidence.runHealth.commitAuditSamplesPresent !== true
  ) {
    addIssue(errors, "phase5p_run_health", "live-evidence.runHealth", "Every Phase 5C-P forced point must converge with clean health and Land source/commit samples.");
  }
  validatePairs(evidence.pairs, errors);
  validateAnalysis(evidence.analysis, errors, warnings);
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
      addIssue(errors, "phase5p_does_not_unlock", "live-evidence.doesNotUnlock", `Phase 5C-P must keep ${token} blocked.`);
    }
  }
}

function validatePairs(
  pairs: readonly ModelCoreLandCalciumSourceForcingPair[],
  errors: ValidationIssue[],
): void {
  if (pairs.length !== 18) {
    addIssue(errors, "phase5p_pair_count", "live-evidence.pairs", "Phase 5C-P must report two deltas times nine forcing scenarios.");
  }
  for (const pair of pairs) {
    if (
      pair.sameClosureStableHash !== true
      || pair.sourceProviderForcingOnlyWithinPoint !== true
      || pair.legacy.deltaVolumeMl !== pair.forcedLand.deltaVolumeMl
      || pair.legacy.effectiveTotalBloodVolumeMl !== pair.forcedLand.effectiveTotalBloodVolumeMl
    ) {
      addIssue(errors, "phase5p_same_point_pairing", `live-evidence.pairs.${pair.deltaVolumeMl}.${pair.forcedLand.scenarioId}`, "Each Phase 5C-P pair must preserve non-provider closure identity within the same effective-TBV point.");
    }
    validatePoint(pair.legacy, `live-evidence.pairs.${pair.deltaVolumeMl}.legacy`, errors);
    validatePoint(pair.forcedLand, `live-evidence.pairs.${pair.deltaVolumeMl}.${pair.forcedLand.scenarioId}`, errors);
    if (
      !Number.isFinite(pair.comparison.meanOutputMatchScore)
      || !Number.isFinite(pair.comparison.forcedVsLegacyCOLRatio)
      || !Number.isFinite(pair.comparison.forcedVsLegacyQAoPeakRatio)
      || !Number.isFinite(pair.comparison.forcedVsLegacyPeakSigmaActRatio)
    ) {
      addIssue(errors, "phase5p_pair_metrics", `live-evidence.pairs.${pair.deltaVolumeMl}.${pair.forcedLand.scenarioId}`, "Every Phase 5C-P pair must include finite output, stress, and qDot comparison metrics.");
    }
  }
}

function validatePoint(
  point: ModelCoreLandCalciumSourceForcingRunPoint,
  pathLabel: string,
  errors: ValidationIssue[],
): void {
  if (
    point.independentlyInitializedPoint !== true
    || point.settled !== true
    || point.settleReason !== "converged"
    || point.healthStatus !== "ok"
    || point.tbvClassification !== "clean"
    || point.maxValveReverseMl > 0.05
    || point.providerInstrumentation.sourceActiveStressCallCount <= 0
    || !Number.isFinite(point.CO_L)
    || !Number.isFinite(point.SV_L)
    || !Number.isFinite(point.QAoPeakMlPerSec)
    || !Number.isFinite(point.peakSigmaActPa)
    || !Number.isFinite(point.aovQDotClampHitFraction)
  ) {
    addIssue(errors, "phase5p_point_health", pathLabel, "Every Phase 5C-P point must be independently initialized, converged, clean, finite, and non-reversing.");
  }
  if (
    point.sourceProviderId.includes("land2017")
    && (
      point.providerInstrumentation.commitProviderStateAfterStepCount <= 0
      || point.providerInstrumentation.landSolveFailureCount !== 0
      || (point.providerInstrumentation.sourcePathAudit?.sampleCount ?? 0) <= 0
      || (point.providerInstrumentation.commitPathAudit?.sampleCount ?? 0) <= 0
      || (point.providerInstrumentation.forcingAudit?.sourceCallCount ?? 0) <= 0
    )
  ) {
    addIssue(errors, "phase5p_land_instrumentation", pathLabel, "Every forced Land point must record source/commit/forcing audits with zero solver failures.");
  }
}

function validateAnalysis(
  analysis: ModelCoreLandCalciumSourceForcingBracketEvidence["analysis"],
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const bestCalcium = analysis.bestCalciumScaleCandidate;
  const bestSource = analysis.bestSourceStressScaleCandidate;
  if (
    analysis.classification !== "calcium-input-scaling-reaches-legacy-regime"
    || analysis.structuralAlternansRemovalClaim !== "not-established"
    || analysis.finalNoAlternansClaim !== "not-claimed"
    || analysis.officialMorphologyAcceptance !== "not-claimed"
  ) {
    addIssue(errors, "phase5p_interpretation", "live-evidence.analysis", "Phase 5C-P must classify the calcium-input forcing signal without accepting structural alternans removal.");
  }
  if (
    bestCalcium.forcedLand.axis !== "calcium-input-scale"
    || bestCalcium.comparison.matchedLegacyOutputRegime !== true
    || bestCalcium.comparison.clampRegimeRecovered !== true
    || bestCalcium.forcedLand.periodBeats !== 1
    || bestCalcium.comparison.meanOutputMatchScore >= 0.15
    || bestCalcium.comparison.forcedVsLegacyPeakSigmaActRatio < 0.8
    || bestCalcium.comparison.forcedVsLegacyPeakSigmaActRatio > 1.2
  ) {
    addIssue(errors, "phase5p_best_calcium_candidate", "live-evidence.analysis.bestCalciumScaleCandidate", "Best calcium-scale candidate must enter the legacy output/qDot regime while remaining period-1.");
  }
  if (
    bestSource.forcedLand.axis !== "source-stress-scale"
    || bestSource.comparison.matchedLegacyOutputRegime !== false
    || bestSource.forcedLand.periodBeats !== 1
  ) {
    addIssue(errors, "phase5p_best_source_candidate", "live-evidence.analysis.bestSourceStressScaleCandidate", "Source-stress forcing remains a secondary non-matched bracket and must not be treated as acceptance.");
  }
  if (
    !analysis.requiredNextChecks.includes("SDIRK2-reference-before-final-no-alternans")
    || !analysis.requiredNextChecks.includes("if-calcium-scale-recovers-output-audit-legacy-c-units-before-runtime-design")
  ) {
    addIssue(errors, "phase5p_next_checks", "live-evidence.analysis.requiredNextChecks", "Phase 5C-P must keep SDIRK2 and calcium-unit audit as required next checks.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5p_calcium_forcing_signal",
    path: "live-evidence.analysis",
    message: "Calcium input scaling reaches the legacy output/qDot regime while Land remains period-1; this is a forcing attribution signal, not runtime acceptance.",
  });
}

function validateArtifact(
  artifact: ModelCoreLandCalciumSourceForcingBracketEvidence,
  evidence: ModelCoreLandCalciumSourceForcingBracketEvidence,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5p_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match live Phase 5C-P calcium/source forcing bracket evidence.");
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
    !builderText.includes("calcium-source-scale-forcing-bracket-only")
    || !builderText.includes("sourceProviderForcingOnly: true")
    || !builderText.includes("deliveredStressNonnegativeClampIsProviderForcingBoundary")
    || !builderText.includes("must define source-specific debugActiveStressTerms")
    || builderText.includes("?? call.activeModel.debugActiveStressTerms")
    || /finalNoAlternansClaim\s*:\s*"claimed"/.test(builderText)
  ) {
    addIssue(errors, "phase5p_builder_boundary", BUILDER_PATH, "Builder must keep Phase 5C-P explicit-forcing-only and claim-bounded.");
  }
  if (readmeText && !readmeText.includes("Phase 5C-P")) {
    addIssue(errors, "phase5p_readme", README_PATH, "README must record the Phase 5C-P forcing bracket result.");
  }
  if (roadmapText && !roadmapText.includes("Phase 5C-P")) {
    addIssue(errors, "phase5p_roadmap", ROADMAP_PATH, "Roadmap must record the Phase 5C-P forcing bracket result.");
  }
  if (routeDocText && !routeDocText.includes("Phase 5C-P")) {
    addIssue(errors, "phase5p_route_doc", ROUTE_DOC_PATH, "Route gate doc must keep the Phase 5C-P boundary visible.");
  }
  if (lanesText && !lanesText.includes("Phase 5C-P")) {
    addIssue(errors, "phase5p_current_lanes", HISTORICAL_LANES_PATH, "Current lanes must show the Phase 5C-P result and next diagnostic.");
  }
  if (packageText && !packageText.includes("verify:myocardium-modelcore-land-calcium-source-forcing-bracket")) {
    addIssue(errors, "phase5p_package_script", "package.json", "package.json must expose the Phase 5C-P verifier script.");
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

function printReport(report: ModelCoreLandCalciumSourceForcingBracketValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore Land calcium/source forcing bracket ${status} `
    + `classification=${report.evidence.analysis.classification} `
    + `best=${report.evidence.analysis.bestOverallCandidate.forcedLand.scenarioId} `
    + `score=${report.evidence.analysis.bestOverallCandidate.comparison.meanOutputMatchScore} `
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
  const report = validateModelCoreLandCalciumSourceForcingBracket();
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
