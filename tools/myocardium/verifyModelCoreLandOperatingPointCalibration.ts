import { readFileSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-operating-point-calibration-result-v1.json";
import {
  MODELCORE_LAND_OPERATING_POINT_CALIBRATION_EVIDENCE_ID,
  buildModelCoreLandOperatingPointCalibrationEvidence,
  type ModelCoreLandOperatingPointCalibrationEvidence,
  type ModelCoreLandOperatingPointCalibrationPair,
} from "@/tools/myocardium/buildModelCoreLandOperatingPointCalibrationEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCoreLandOperatingPointCalibrationValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCoreLandOperatingPointCalibrationEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH = "data/myocardium/protocols/modelcore-land-operating-point-calibration-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildModelCoreLandOperatingPointCalibrationEvidence.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const CURRENT_LANES_PATH = "docs/status/current-lanes.md";
const EXPECTED_DELTAS = [-1250, 0, 1000] as const;
const MAIN_DOMAIN_DELTAS = [0, 1000] as const;

export function validateModelCoreLandOperatingPointCalibration(rootDir = process.cwd()):
ModelCoreLandOperatingPointCalibrationValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCoreLandOperatingPointCalibrationEvidence();
  const artifact = resultArtifact as ModelCoreLandOperatingPointCalibrationEvidence;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: ModelCoreLandOperatingPointCalibrationEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MODELCORE_LAND_OPERATING_POINT_CALIBRATION_EVIDENCE_ID
    || evidence.phase !== "Phase 5S"
    || evidence.claimBoundary !== "operating-point-calibration-diagnostic-only"
    || evidence.verifierScript !== "verify:myocardium-modelcore-land-operating-point-calibration"
  ) {
    addIssue(errors, "phase5s_identity", "live-evidence", "Phase 5S evidence must identify the operating-point diagnostic boundary.");
  }
  if (
    evidence.upstreamLevel3SourceStressTransferGateId !== "level3-source-stress-transfer-gate-v1"
    || typeof evidence.upstreamPhase2BArtifactId !== "string"
    || typeof evidence.upstreamPhase5QArtifactId !== "string"
    || typeof evidence.upstreamPhase5RArtifactId !== "string"
  ) {
    addIssue(errors, "phase5s_upstream", "live-evidence", "Phase 5S must pin Phase 2B, Level 3, Phase 4D, Phase 5Q, and Phase 5R context.");
  }
  validateProtocol(evidence, errors);
  validateBoundary(evidence, errors);
  validateRunHealth(evidence, errors);
  validatePairs(evidence.pairs, errors);
  validateLevelEvidence(evidence, errors, warnings);
  validateEducationDoD(evidence, errors);
  validateAnalysis(evidence, errors);
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
      addIssue(errors, "phase5s_does_not_unlock", "live-evidence.doesNotUnlock", `Phase 5S must keep ${token} blocked.`);
    }
  }
}

function validateProtocol(
  evidence: ModelCoreLandOperatingPointCalibrationEvidence,
  errors: ValidationIssue[],
): void {
  if (
    !arrayEquals(evidence.diagnosticProtocol.diagnosticDeltasMl, EXPECTED_DELTAS)
    || !arrayEquals(evidence.diagnosticProtocol.mainDomainDeltasMl, MAIN_DOMAIN_DELTAS)
    || evidence.diagnosticProtocol.phase5QCalciumMappingScenario !== "phase2b-absolute-peak-ca"
    || evidence.diagnosticProtocol.phase5QCalciumScale <= 1
    || evidence.diagnosticProtocol.providerCommitScheme !== "BE"
    || evidence.diagnosticProtocol.preloadAxisMode !== "fixed-diagnostic-operating-points-not-tuning"
    || evidence.diagnosticProtocol.educationDoDScope !== "report-only-checkpoint-not-acceptance"
  ) {
    addIssue(errors, "phase5s_protocol", "live-evidence.diagnosticProtocol", "Phase 5S must keep the fixed operating-point BE mapped-Land diagnostic protocol.");
  }
}

function validateBoundary(
  evidence: ModelCoreLandOperatingPointCalibrationEvidence,
  errors: ValidationIssue[],
): void {
  if (
    evidence.boundary.noModelCoreGlobalIntegratorChange !== true
    || evidence.boundary.noSdirk2RobustnessClaim !== true
    || evidence.boundary.noQDotTuning !== true
    || evidence.boundary.noValveTuning !== true
    || evidence.boundary.noAfterloadTuning !== true
    || evidence.boundary.noPreloadTuning !== true
    || evidence.boundary.noLandParameterTuning !== true
    || evidence.boundary.noSourceStressScaling !== true
    || evidence.boundary.noRuntimeReplacement !== true
    || evidence.boundary.noOfficialMorphologyAcceptance !== true
  ) {
    addIssue(errors, "phase5s_boundary", "live-evidence.boundary", "Phase 5S must remain diagnostic-only with no runtime, tuning, SDIRK2, or acceptance claim.");
  }
}

function validateRunHealth(
  evidence: ModelCoreLandOperatingPointCalibrationEvidence,
  errors: ValidationIssue[],
): void {
  if (
    evidence.runHealth.legacyPointCount !== 3
    || evidence.runHealth.landPointCount !== 3
    || evidence.runHealth.legacyPointsSettledByConvergence !== 3
    || evidence.runHealth.landPointsSettledByConvergence !== 3
    || evidence.runHealth.landPointsCapOrNonOk !== 0
    || evidence.runHealth.landSolveFailureCount !== 0
    || evidence.runHealth.sourceAuditSamplesPresent !== true
    || evidence.runHealth.commitAuditSamplesPresent !== true
    || evidence.runHealth.calciumScaleAuditSamplesPresent !== true
  ) {
    addIssue(errors, "phase5s_run_health", "live-evidence.runHealth", "Phase 5S fixed operating points must converge cleanly with zero BE Land solve failures and audit samples present.");
  }
}

function validatePairs(
  pairs: readonly ModelCoreLandOperatingPointCalibrationPair[],
  errors: ValidationIssue[],
): void {
  if (pairs.length !== EXPECTED_DELTAS.length) {
    addIssue(errors, "phase5s_pair_count", "live-evidence.pairs", "Phase 5S must report the three fixed diagnostic operating points.");
  }
  const byDelta = new Map(pairs.map((pair) => [pair.deltaVolumeMl, pair]));
  for (const delta of EXPECTED_DELTAS) {
    if (!byDelta.has(delta)) {
      addIssue(errors, "phase5s_missing_pair", "live-evidence.pairs", `Missing Phase 5S pair at delta ${delta}.`);
    }
  }
  for (const pair of pairs) {
    if (
      pair.sameClosureStableHash !== true
      || pair.sourceProviderDifferenceOnlyWithinPoint !== true
      || pair.legacy.deltaVolumeMl !== pair.land.deltaVolumeMl
      || pair.legacy.effectiveTotalBloodVolumeMl !== pair.land.effectiveTotalBloodVolumeMl
      || pair.land.providerInstrumentation.landSolveFailureCount !== 0
      || pair.land.providerInstrumentation.landSolveOkCount <= 0
      || pair.land.providerInstrumentation.commitProviderStateAfterStepCount <= 0
      || (pair.land.providerInstrumentation.sourcePathAudit?.sampleCount ?? 0) <= 0
      || (pair.land.providerInstrumentation.commitPathAudit?.sampleCount ?? 0) <= 0
      || (pair.land.providerInstrumentation.calciumScaleAudit?.commitCallCount ?? 0) <= 0
    ) {
      addIssue(errors, "phase5s_pairing", `live-evidence.pairs.${pair.deltaVolumeMl}`, "Every Phase 5S pair must preserve same-delta source-provider-only comparison and clean BE Land commits.");
    }
    if (
      pair.land.healthStatus !== "ok"
      || pair.land.tbvClassification !== "clean"
      || pair.land.maxValveReverseMl > 0.05
      || !finitePositive(pair.land.CO_L)
      || !finitePositive(pair.land.SV_L)
      || !finitePositive(pair.land.QAoPeakMlPerSec)
      || !finitePositive(pair.land.peakSigmaActPa)
      || !finitePositive(pair.land.LVPMax)
      || !finitePositive(pair.land.AoPMax)
    ) {
      addIssue(errors, "phase5s_land_point_health", `live-evidence.pairs.${pair.deltaVolumeMl}.land`, "Every Land point must be finite, clean, and physiologically nonzero.");
    }
  }
}

function validateLevelEvidence(
  evidence: ModelCoreLandOperatingPointCalibrationEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const level1 = evidence.levelEvidence.level1CalciumInterface;
  if (
    level1.status !== "phase5q-fixed-unit-mapping-reused"
    || level1.phase2BAbsolutePeakCaUM !== 1.02
    || level1.phase5QCalciumScale <= 1
    || level1.mappedPinnedOverlayPeakCaUM == null
    || level1.pinnedPeakRelativeError == null
    || level1.pinnedPeakRelativeError > 0.02
    || level1.pass !== true
  ) {
    addIssue(errors, "phase5s_level1", "live-evidence.levelEvidence.level1CalciumInterface", "Level 1 calcium interface must reuse Phase 5C-Q mapping and recover the Phase 2B absolute peak at the pinned point.");
  }
  const level2 = evidence.levelEvidence.level2SourceStressTransfer;
  if (
    level2.status !== "closed-loop-source-stress-transfer-measured"
    || level2.sourceTwitchFwhmMsApprox !== 234
    || level2.mainDomainPeakSigmaActRatios.length !== 2
    || level2.allLandSolvesOk !== true
    || level2.stressRatiosInCoarseLegacyClass !== true
  ) {
    addIssue(errors, "phase5s_level2", "live-evidence.levelEvidence.level2SourceStressTransfer", "Level 2/transfer evidence must remain measured and coarse-class only, with clean BE Land solves.");
  }
  const level34 = evidence.levelEvidence.level3_4ClosedLoopOperatingPoint;
  if (
    level34.status !== "main-domain-calibration-signal"
    || level34.mainDomainOutputScoreMax > 0.35
    || level34.mainDomainQAoPeakRatioMin < 0.55
    || level34.mainDomainAllPeriod1 !== true
    || level34.lowPreloadEdgeStillReportOnly !== true
  ) {
    addIssue(errors, "phase5s_level34", "live-evidence.levelEvidence.level3_4ClosedLoopOperatingPoint", "Level 3/4 operating-point evidence must record a main-domain signal while keeping low-preload report-only.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5s_diagnostic_only",
    path: "live-evidence.levelEvidence",
    message: "Phase 5S records a main-domain calibration signal, but Level 3/4 acceptance and runtime replacement remain not claimed.",
  });
}

function validateEducationDoD(
  evidence: ModelCoreLandOperatingPointCalibrationEvidence,
  errors: ValidationIssue[],
): void {
  const checkpoint = evidence.educationDoDCheckpoint;
  if (
    checkpoint.status !== "draft-do-d-ready-for-owner-review"
    || checkpoint.scope !== "education-tool-report-only-not-runtime-acceptance"
    || checkpoint.satisfiedNow !== false
    || checkpoint.criteria.mainDomainFinite !== true
    || checkpoint.criteria.mainDomainOutputRegimeReasonable !== true
    || checkpoint.criteria.mainDomainBeatStability !== true
    || checkpoint.criteria.landSolverClean !== true
    || checkpoint.criteria.morphologyStillDiagnosticOnly !== true
    || checkpoint.criteria.officialCasesNeedReauthoringBeforeRuntime !== true
  ) {
    addIssue(errors, "phase5s_education_dod", "live-evidence.educationDoDCheckpoint", "Education DoD must be ready for owner review but not satisfied or accepted by this artifact.");
  }
}

function validateAnalysis(
  evidence: ModelCoreLandOperatingPointCalibrationEvidence,
  errors: ValidationIssue[],
): void {
  const analysis = evidence.analysis;
  if (
    analysis.operatingPointStatus !== "main-domain-calibration-signal-low-preload-edge-report-only"
    || analysis.finalNoAlternansClaim !== "not-claimed"
    || analysis.structuralAlternansRemovalClaim !== "not-established"
    || analysis.level3Acceptance !== "not-claimed"
    || analysis.level4Acceptance !== "not-claimed"
    || analysis.officialMorphologyAcceptance !== "not-claimed"
    || analysis.runtimeReplacement !== "not-claimed"
    || !analysis.requiredNextChecks.includes("owner-review-education-tool-definition-of-done")
    || !analysis.requiredNextChecks.includes("do-not-extend-alternans-subphases-without-explicit-final-no-alternans-scope")
  ) {
    addIssue(errors, "phase5s_analysis", "live-evidence.analysis", "Phase 5S must report the main-domain signal while keeping all acceptance/runtime/no-alternans claims blocked.");
  }
}

function validateArtifact(
  artifact: ModelCoreLandOperatingPointCalibrationEvidence,
  evidence: ModelCoreLandOperatingPointCalibrationEvidence,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5s_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match live Phase 5S evidence.");
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const builderText = readFileSync(path.join(rootDir, BUILDER_PATH), "utf8");
  const readmeText = readOptionalText(rootDir, README_PATH);
  const roadmapText = readOptionalText(rootDir, ROADMAP_PATH);
  const lanesText = readOptionalText(rootDir, CURRENT_LANES_PATH);
  const packageText = readOptionalText(rootDir, "package.json");
  if (
    !builderText.includes("operating-point-calibration-diagnostic-only")
    || !builderText.includes("fixed-diagnostic-operating-points-not-tuning")
    || !builderText.includes("level3Acceptance")
    || /runtimeReplacement\s*:\s*"claimed"/.test(builderText)
  ) {
    addIssue(errors, "phase5s_builder_boundary", BUILDER_PATH, "Builder must keep Phase 5S diagnostic-only and claim-bounded.");
  }
  if (readmeText && (!readmeText.includes("Phase 5S") || !readmeText.includes("operating-point calibration"))) {
    addIssue(errors, "phase5s_readme", README_PATH, "README must record Phase 5S operating-point calibration evidence.");
  }
  if (roadmapText && (!roadmapText.includes("Phase 5S") || !roadmapText.includes("draft-do-d-ready-for-owner-review"))) {
    addIssue(errors, "phase5s_roadmap", ROADMAP_PATH, "Roadmap must record the Phase 5S education DoD checkpoint.");
  }
  if (lanesText && (!lanesText.includes("Phase 5S") || !lanesText.includes("operating-point"))) {
    addIssue(errors, "phase5s_current_lanes", CURRENT_LANES_PATH, "Current lanes must show the Phase 5S operating-point result and next owner-review direction.");
  }
  if (packageText && !packageText.includes("verify:myocardium-modelcore-land-operating-point-calibration")) {
    addIssue(errors, "phase5s_package_script", "package.json", "package.json must expose the Phase 5S verifier script.");
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

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function printReport(report: ModelCoreLandOperatingPointCalibrationValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore Land operating-point calibration ${status} `
    + `status=${report.evidence.analysis.operatingPointStatus} `
    + `landFailures=${report.evidence.runHealth.landSolveFailureCount} `
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
  const report = validateModelCoreLandOperatingPointCalibration();
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
