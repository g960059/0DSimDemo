import { readFileSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-sdirk2-reference-result-v1.json";
import {
  MODELCORE_LAND_SDIRK2_REFERENCE_EVIDENCE_ID,
  buildModelCoreLandSdirk2ReferenceEvidence,
  type ModelCoreLandSdirk2ReferenceEvidence,
  type ModelCoreLandSdirk2ReferencePair,
  type ModelCoreLandSdirk2ReferenceRunPoint,
} from "@/tools/myocardium/buildModelCoreLandSdirk2ReferenceEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCoreLandSdirk2ReferenceValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCoreLandSdirk2ReferenceEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH = "data/myocardium/protocols/modelcore-land-sdirk2-reference-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildModelCoreLandSdirk2ReferenceEvidence.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const ROUTE_DOC_PATH = "docs/myocardium/roadmap/phase5c-modelcore-equivalent-route-gate.md";
const CURRENT_LANES_PATH = "docs/status/current-lanes.md";
const EXPECTED_DELTAS = [-1250, 1000] as const;
const EXPECTED_SCENARIOS = [
  "raw-land-be",
  "raw-land-sdirk2",
  "phase2b-calcium-mapped-be",
  "phase2b-calcium-mapped-sdirk2",
] as const;

export function validateModelCoreLandSdirk2Reference(rootDir = process.cwd()):
ModelCoreLandSdirk2ReferenceValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCoreLandSdirk2ReferenceEvidence();
  const artifact = resultArtifact as ModelCoreLandSdirk2ReferenceEvidence;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: ModelCoreLandSdirk2ReferenceEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MODELCORE_LAND_SDIRK2_REFERENCE_EVIDENCE_ID
    || evidence.phase !== "Phase 5C-R"
    || evidence.claimBoundary !== "land-source-provider-commit-solver-robustness-only"
    || evidence.verifierScript !== "verify:myocardium-modelcore-land-sdirk2-reference"
  ) {
    addIssue(errors, "phase5r_identity", "live-evidence", "Phase 5C-R evidence must identify the Land source-provider commit solver robustness check.");
  }
  if (
    typeof evidence.upstreamPhase5BArtifactId !== "string"
    || !evidence.upstreamPhase5BArtifactId.includes("sdirk2")
    || typeof evidence.upstreamPhase5NArtifactId !== "string"
    || typeof evidence.upstreamPhase5QArtifactId !== "string"
  ) {
    addIssue(errors, "phase5r_upstream", "live-evidence", "Phase 5C-R must pin Phase 5B SDIRK2, Phase 5C-N, and Phase 5C-Q upstream artifacts.");
  }
  validateProtocol(evidence, errors);
  validateBoundary(evidence, errors);
  validateRunHealth(evidence, errors);
  validatePairs(evidence.pairs, errors);
  validateAnalysis(evidence.analysis, errors, warnings);
  for (const token of [
    "runtimeReplacement",
    "officialMorphologyAcceptance",
    "finalNoAlternans",
    "structuralAlternansRemoval",
    "ModelCoreGlobalSecondOrderIntegration",
    "qDotTuning",
    "valveThresholdTuning",
    "arterialLoadTuning",
    "preloadTuning",
    "landParameterTuning",
    "sourceStressScaling",
    "TriSegAdoption",
    "StudioScientificValidityClaim",
  ] as const) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5r_does_not_unlock", "live-evidence.doesNotUnlock", `Phase 5C-R must keep ${token} blocked.`);
    }
  }
}

function validateProtocol(
  evidence: ModelCoreLandSdirk2ReferenceEvidence,
  errors: ValidationIssue[],
): void {
  if (
    !arrayEquals(evidence.diagnosticProtocol.diagnosticDeltasMl, EXPECTED_DELTAS)
    || evidence.diagnosticProtocol.phase5QCalciumMappingScenario !== "phase2b-absolute-peak-ca"
    || evidence.diagnosticProtocol.phase5QCalciumScale <= 1
    || evidence.diagnosticProtocol.modelCoreGlobalIntegrator !== "unchanged-current-ModelCore-stepper"
    || evidence.diagnosticProtocol.referenceScope !== "Land source-provider state commit BE-vs-SDIRK2 only"
    || evidence.diagnosticProtocol.sdirk2Tableau.scheme !== "SDIRK2"
    || evidence.diagnosticProtocol.sdirk2Tableau.finalStateSource !== "Y1"
    || evidence.diagnosticProtocol.sdirk2ProviderLocalStagePolicy.notClaimed
      !== "not a global ModelCore SDIRK2 stage state"
  ) {
    addIssue(errors, "phase5r_protocol", "live-evidence.diagnosticProtocol", "Phase 5C-R must keep provider-local SDIRK2 stage semantics explicit and leave ModelCore global stepping unchanged.");
  }
  if (evidence.runMatrix.length !== 10) {
    addIssue(errors, "phase5r_run_matrix_count", "live-evidence.runMatrix", "Phase 5C-R must report two deltas times legacy plus four Land solver/mapping cells.");
  }
  const matrixKeys = new Set(evidence.runMatrix.map((cell) =>
    `${cell.deltaVolumeMl}:${cell.providerKind}:${cell.solverMode}:${cell.calciumScenarioId}`
  ));
  for (const delta of EXPECTED_DELTAS) {
    for (const key of [
      `${delta}:legacy-activeStress-source-only:none:legacy-activeStress`,
      `${delta}:land2017-source-only:BE:raw-direct-internal-c`,
      `${delta}:land2017-source-only:SDIRK2:raw-direct-internal-c`,
      `${delta}:land2017-source-only:BE:phase2b-absolute-peak-ca`,
      `${delta}:land2017-source-only:SDIRK2:phase2b-absolute-peak-ca`,
    ]) {
      if (!matrixKeys.has(key)) {
        addIssue(errors, "phase5r_run_matrix_cell", "live-evidence.runMatrix", `Missing run matrix cell ${key}.`);
      }
    }
  }
}

function validateBoundary(
  evidence: ModelCoreLandSdirk2ReferenceEvidence,
  errors: ValidationIssue[],
): void {
  if (
    evidence.boundary.landProviderCommitSchemeOnly !== true
    || evidence.boundary.noModelCoreGlobalIntegratorChange !== true
    || evidence.boundary.noQDotTuning !== true
    || evidence.boundary.noValveTuning !== true
    || evidence.boundary.noAfterloadTuning !== true
    || evidence.boundary.noPreloadTuning !== true
    || evidence.boundary.noLandParameterTuning !== true
    || evidence.boundary.noSourceStressScaling !== true
    || evidence.boundary.noRuntimeReplacement !== true
    || evidence.boundary.globalModelCoreSdirk2 !== "not-claimed"
  ) {
    addIssue(errors, "phase5r_boundary", "live-evidence.boundary", "Phase 5C-R must remain provider commit-solver evidence only.");
  }
}

function validateRunHealth(
  evidence: ModelCoreLandSdirk2ReferenceEvidence,
  errors: ValidationIssue[],
): void {
  if (
    evidence.runHealth.legacyTargetsSettledByConvergence !== true
    || evidence.runHealth.landPointCount !== 8
    || evidence.runHealth.landPointsSettledByConvergence !== 8
    || evidence.runHealth.landPointsCapOrNonOk !== 0
    || evidence.runHealth.sdirk2PointCount !== 4
    || evidence.runHealth.sourceAuditSamplesPresent !== true
    || evidence.runHealth.commitAuditSamplesPresent !== true
    || evidence.runHealth.calciumScaleAuditSamplesPresent !== true
  ) {
    addIssue(errors, "phase5r_run_health", "live-evidence.runHealth", "Every Phase 5C-R point must settle with clean health and source/commit/calcium audits.");
  }
  if (evidence.runHealth.sdirk2SolveFailureCount <= 0 || evidence.runHealth.landSolveFailureCount <= 0) {
    addIssue(errors, "phase5r_expected_sdirk2_failure_boundary", "live-evidence.runHealth", "Current Phase 5C-R evidence is expected to remain inconclusive because provider-local SDIRK2 commits report solve failures.");
  }
}

function validatePairs(
  pairs: readonly ModelCoreLandSdirk2ReferencePair[],
  errors: ValidationIssue[],
): void {
  if (pairs.length !== EXPECTED_DELTAS.length * EXPECTED_SCENARIOS.length) {
    addIssue(errors, "phase5r_pair_count", "live-evidence.pairs", "Phase 5C-R must report two deltas times four Land cells.");
  }
  const seen = new Set<string>();
  for (const pair of pairs) {
    seen.add(`${pair.deltaVolumeMl}:${pair.scenarioId}`);
    if (
      pair.sameClosureStableHash !== true
      || pair.sourceProviderSolverOnlyWithinPoint !== (pair.land.providerInstrumentation.landSolveFailureCount === 0)
      || pair.legacy.deltaVolumeMl !== pair.land.deltaVolumeMl
      || pair.legacy.effectiveTotalBloodVolumeMl !== pair.land.effectiveTotalBloodVolumeMl
    ) {
      addIssue(errors, "phase5r_pairing", `live-evidence.pairs.${pair.deltaVolumeMl}.${pair.scenarioId}`, "Each pair must preserve same-delta closure; solver-only satisfaction is false when SDIRK2 commits fail.");
    }
    validatePoint(pair.legacy, `live-evidence.pairs.${pair.deltaVolumeMl}.legacy`, errors);
    validatePoint(pair.land, `live-evidence.pairs.${pair.deltaVolumeMl}.${pair.scenarioId}`, errors);
    validateLandInstrumentation(pair.land, errors);
  }
  for (const delta of EXPECTED_DELTAS) {
    for (const scenarioId of EXPECTED_SCENARIOS) {
      if (!seen.has(`${delta}:${scenarioId}`)) {
        addIssue(errors, "phase5r_missing_pair", "live-evidence.pairs", `Missing Phase 5C-R pair ${delta}:${scenarioId}.`);
      }
    }
  }
}

function validatePoint(
  point: ModelCoreLandSdirk2ReferenceRunPoint,
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
    || point.activeTraceAudit.beatTraceCount <= 0
    || point.activeTraceAudit.overlaySampleCount <= 0
    || !Number.isFinite(point.CO_L)
    || !Number.isFinite(point.SV_L)
    || !Number.isFinite(point.QAoPeakMlPerSec)
    || !Number.isFinite(point.peakSigmaActPa)
    || !Number.isFinite(point.aovQDotClampHitFraction)
  ) {
    addIssue(errors, "phase5r_point_health", pathLabel, "Every Phase 5C-R point must be independently initialized, converged, clean, finite, and overlaid.");
  }
}

function validateLandInstrumentation(
  point: ModelCoreLandSdirk2ReferenceRunPoint,
  errors: ValidationIssue[],
): void {
  if (point.commitScheme === "legacy") return;
  const instrumentation = point.providerInstrumentation;
  if (
    instrumentation.sourceActiveStressCallCount <= 0
    || instrumentation.commitProviderStateAfterStepCount <= 0
    || instrumentation.landSolveOkCount <= 0
    || (instrumentation.sourcePathAudit?.sampleCount ?? 0) <= 0
    || (instrumentation.commitPathAudit?.sampleCount ?? 0) <= 0
    || (instrumentation.calciumScaleAudit?.sourceCallCount ?? 0) <= 0
    || (instrumentation.calciumScaleAudit?.commitCallCount ?? 0) <= 0
  ) {
    addIssue(errors, "phase5r_land_instrumentation", `live-evidence.${point.deltaVolumeMl}.${point.scenarioId}`, "Every Land cell must record source/commit/calcium audit samples and at least one successful commit solve.");
  }
  if (
    point.commitScheme === "SDIRK2"
    && (
      instrumentation.sdirk2Stage0SolveCount <= 0
      || instrumentation.sdirk2Stage1SolveCount <= 0
      || instrumentation.sdirk2Stage0FailureCount !== 0
      || instrumentation.sdirk2Stage1FailureCount <= 0
      || instrumentation.maxSdirk2Stage0ResidualNorm > 1e-7
      || instrumentation.maxSdirk2Stage1ResidualNorm <= 0
    )
  ) {
    addIssue(errors, "phase5r_sdirk2_stage_audit", `live-evidence.${point.deltaVolumeMl}.${point.scenarioId}`, "SDIRK2 cells must record clean stage0 solves and explicit stage1 failure/residual evidence.");
  }
}

function validateAnalysis(
  analysis: ModelCoreLandSdirk2ReferenceEvidence["analysis"],
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const pinned = analysis.pinnedPhase2bCalciumMappedComparison;
  if (
    analysis.robustnessStatus !== "sdirk2-reference-inconclusive"
    || analysis.structuralAlternansRemovalClaim !== "not-established"
    || analysis.finalNoAlternansClaim !== "not-claimed"
    || analysis.officialMorphologyAcceptance !== "not-claimed"
    || analysis.runtimeReplacement !== "not-claimed"
    || analysis.globalModelCoreSdirk2 !== "not-claimed"
  ) {
    addIssue(errors, "phase5r_interpretation", "live-evidence.analysis", "Phase 5C-R must remain inconclusive because SDIRK2 provider-local commits report solve failures.");
  }
  if (
    pinned.deltaVolumeMl !== -1250
    || pinned.calciumMapping !== "phase2b-absolute-peak"
    || pinned.be.land.periodBeats !== 1
    || pinned.sdirk2.land.periodBeats !== 1
    || pinned.sdirk2.comparison.matchedLegacyOutputRegime !== true
    || pinned.sdirk2.comparison.clampRegimeRecovered !== true
    || pinned.outputScoreDeltaAbs > 0.01
    || pinned.sdirk2.land.providerInstrumentation.landSolveFailureCount <= 0
  ) {
    addIssue(errors, "phase5r_pinned_signal_boundary", "live-evidence.analysis.pinnedPhase2bCalciumMappedComparison", "Pinned mapped SDIRK2 must preserve the observed output/qDot signal but remain blocked by solver failures.");
  }
  if (
    !analysis.requiredNextChecks.includes("do-not-claim-final-no-alternans-from-provider-SDIRK2-alone")
    || !analysis.requiredNextChecks.includes("Level-1-4-operating-point-calibration-before-runtime-design")
  ) {
    addIssue(errors, "phase5r_next_checks", "live-evidence.analysis.requiredNextChecks", "Phase 5C-R must keep final no-alternans blocked and shift next work toward calibration.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5r_sdirk2_inconclusive",
    path: "live-evidence.analysis",
    message: "Provider-local SDIRK2 preserves the pinned mapped output/qDot signal but reports many stage1 solve failures, so robustness remains inconclusive.",
  });
}

function validateArtifact(
  artifact: ModelCoreLandSdirk2ReferenceEvidence,
  evidence: ModelCoreLandSdirk2ReferenceEvidence,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5r_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match live Phase 5C-R evidence.");
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const builderText = readFileSync(path.join(rootDir, BUILDER_PATH), "utf8");
  const readmeText = readOptionalText(rootDir, README_PATH);
  const roadmapText = readOptionalText(rootDir, ROADMAP_PATH);
  const routeDocText = readOptionalText(rootDir, ROUTE_DOC_PATH);
  const lanesText = readOptionalText(rootDir, CURRENT_LANES_PATH);
  const packageText = readOptionalText(rootDir, "package.json");
  if (
    !builderText.includes("land-source-provider-commit-solver-robustness-only")
    || !builderText.includes("not a global ModelCore SDIRK2 stage state")
    || !builderText.includes("sdirk2-reference-inconclusive")
    || /finalNoAlternansClaim\s*:\s*"claimed"/.test(builderText)
  ) {
    addIssue(errors, "phase5r_builder_boundary", BUILDER_PATH, "Builder must keep Phase 5C-R provider-local, inconclusive, and claim-bounded.");
  }
  if (readmeText && (!readmeText.includes("Phase 5C-R") || !readmeText.includes("provider-local SDIRK2"))) {
    addIssue(errors, "phase5r_readme", README_PATH, "README must record Phase 5C-R as provider-local SDIRK2 evidence.");
  }
  if (roadmapText && (!roadmapText.includes("Phase 5C-R") || !roadmapText.includes("sdirk2-reference-inconclusive"))) {
    addIssue(errors, "phase5r_roadmap", ROADMAP_PATH, "Roadmap must record the Phase 5C-R inconclusive SDIRK2 result.");
  }
  if (routeDocText && (!routeDocText.includes("Phase 5C-R") || !routeDocText.includes("not a global ModelCore SDIRK2"))) {
    addIssue(errors, "phase5r_route_doc", ROUTE_DOC_PATH, "Route gate doc must keep Phase 5C-R provider-local and non-global.");
  }
  if (lanesText && (!lanesText.includes("Phase 5C-R") || !lanesText.includes("sdirk2-reference-inconclusive"))) {
    addIssue(errors, "phase5r_current_lanes", CURRENT_LANES_PATH, "Current lanes must show the Phase 5C-R result and next calibration direction.");
  }
  if (packageText && !packageText.includes("verify:myocardium-modelcore-land-sdirk2-reference")) {
    addIssue(errors, "phase5r_package_script", "package.json", "package.json must expose the Phase 5C-R verifier script.");
  }
}

function readOptionalText(rootDir: string, filePath: string): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
    return null;
  }
}

function arrayEquals<T extends string | number>(actual: readonly T[], expected: readonly T[]): boolean {
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

function printReport(report: ModelCoreLandSdirk2ReferenceValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore Land provider-local SDIRK2 reference ${status} `
    + `robustness=${report.evidence.analysis.robustnessStatus} `
    + `sdirk2Failures=${report.evidence.runHealth.sdirk2SolveFailureCount} `
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
  const report = validateModelCoreLandSdirk2Reference();
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
