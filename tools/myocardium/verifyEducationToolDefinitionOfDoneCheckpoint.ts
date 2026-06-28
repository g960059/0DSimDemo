import { readFileSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/myocardium-education-tool-dod-checkpoint-v1.json";
import {
  MYOCARDIUM_EDUCATION_TOOL_DOD_CHECKPOINT_ID,
  buildEducationToolDefinitionOfDoneCheckpoint,
  type MyocardiumEducationToolDoDCheckpoint,
} from "@/tools/myocardium/buildEducationToolDefinitionOfDoneCheckpoint";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type EducationToolDoDCheckpointValidationReport = {
  readonly pass: boolean;
  readonly evidence: MyocardiumEducationToolDoDCheckpoint;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/myocardium-education-tool-dod-checkpoint-v1.json";
const BUILDER_PATH = "tools/myocardium/buildEducationToolDefinitionOfDoneCheckpoint.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const CURRENT_LANES_PATH = "docs/status/current-lanes.md";
const STUDIO_ROADMAP_PATH = "docs/studio/roadmap/mvp-roadmap.md";

export function validateEducationToolDefinitionOfDoneCheckpoint(rootDir = process.cwd()):
EducationToolDoDCheckpointValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildEducationToolDefinitionOfDoneCheckpoint();
  const artifact = resultArtifact as MyocardiumEducationToolDoDCheckpoint;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: MyocardiumEducationToolDoDCheckpoint,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MYOCARDIUM_EDUCATION_TOOL_DOD_CHECKPOINT_ID
    || evidence.phase !== "Phase 5T"
    || evidence.claimBoundary !== "education-tool-dod-owner-review-checkpoint-not-acceptance"
    || evidence.verifierScript !== "verify:myocardium-education-tool-dod-checkpoint"
  ) {
    addIssue(errors, "phase5t_identity", "live-evidence", "Phase 5T evidence must identify the education-tool DoD checkpoint boundary.");
  }
  validateScope(evidence, errors);
  validateBoundary(evidence, errors);
  validatePhase5S(evidence, errors);
  validateCaseSurfaces(evidence, errors, warnings);
  validateCriteria(evidence, errors, warnings);
  validateClassification(evidence, errors);
  validateOwnerReview(evidence, errors);
  validateDoesNotUnlock(evidence, errors);
}

function validateScope(evidence: MyocardiumEducationToolDoDCheckpoint, errors: ValidationIssue[]): void {
  if (
    evidence.scope.purpose !== "define-education-tool-dod-from-existing-evidence"
    || evidence.scope.audience !== "resident-education-tool"
    || evidence.scope.notScientificAcceptance !== true
    || evidence.scope.notClinicalDecisionSupport !== true
  ) {
    addIssue(errors, "phase5t_scope", "live-evidence.scope", "Phase 5T must be an education-tool checkpoint, not scientific or clinical acceptance.");
  }
}

function validateBoundary(evidence: MyocardiumEducationToolDoDCheckpoint, errors: ValidationIssue[]): void {
  if (
    evidence.boundary.noRuntimeReplacement !== true
    || evidence.boundary.noOfficialCaseWiring !== true
    || evidence.boundary.noWorkbenchRuntimeWiring !== true
    || evidence.boundary.noLevel3Acceptance !== true
    || evidence.boundary.noLevel4Acceptance !== true
    || evidence.boundary.noOfficialMorphologyAcceptance !== true
    || evidence.boundary.noFinalNoAlternansAcceptance !== true
    || evidence.boundary.noStructuralAlternansRemovalClaim !== true
    || evidence.boundary.noQDotValveAfterloadPreloadTuning !== true
    || evidence.boundary.noLandParameterTuning !== true
  ) {
    addIssue(errors, "phase5t_boundary", "live-evidence.boundary", "Phase 5T must not unlock runtime, official case, workbench, acceptance, or tuning scope.");
  }
}

function validatePhase5S(evidence: MyocardiumEducationToolDoDCheckpoint, errors: ValidationIssue[]): void {
  const envelope = evidence.phase5SOperatingEnvelope;
  if (
    envelope.upstreamArtifactId !== "modelcore-land-operating-point-calibration-result-v1"
    || envelope.upstreamClaimBoundary !== "operating-point-calibration-diagnostic-only"
    || envelope.operatingPointStatus !== "main-domain-calibration-signal-low-preload-edge-report-only"
    || envelope.mainDomainStatus !== "main-domain-calibration-signal"
    || envelope.mainDomainOutputScoreMax > 0.35
    || envelope.mainDomainQAoPeakRatioMin < 0.55
    || envelope.mainDomainAllPeriod1 !== true
    || envelope.lowPreloadEdgeStillReportOnly !== true
    || envelope.landSolveFailureCount !== 0
    || envelope.level3Acceptance !== "not-claimed"
    || envelope.level4Acceptance !== "not-claimed"
    || envelope.runtimeReplacement !== "not-claimed"
    || envelope.finalNoAlternansClaim !== "not-claimed"
    || envelope.structuralAlternansRemovalClaim !== "not-established"
  ) {
    addIssue(errors, "phase5t_phase5s_envelope", "live-evidence.phase5SOperatingEnvelope", "Phase 5T must derive only from the diagnostic Phase 5S main-domain signal and blocked acceptance claims.");
  }
}

function validateCaseSurfaces(
  evidence: MyocardiumEducationToolDoDCheckpoint,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const summary = evidence.officialCaseSurfaceSummary;
  if (
    summary.officialCaseCount < 3
    || summary.displayableCaseCount !== summary.officialCaseCount
    || summary.expectedFindingsCaseCount !== summary.officialCaseCount
    || summary.pvLoopPanelCaseCount !== summary.officialCaseCount
    || summary.waveformPanelCaseCount !== summary.officialCaseCount
    || summary.metricsPanelCaseCount !== summary.officialCaseCount
    || summary.controlsPanelCaseCount !== summary.officialCaseCount
    || summary.allCasesDisplayable !== true
    || summary.allCasesHaveExpectedFindings !== true
    || summary.allCasesHaveCorePanels !== true
    || summary.modelLimitationsRequiredBySchema !== true
  ) {
    addIssue(errors, "phase5t_official_case_surface", "live-evidence.officialCaseSurfaceSummary", "Official cases must expose teaching metadata and core Workbench panels before DoD owner review.");
  }
  if (
    summary.clinicalCaveatsNativeFieldStatus !== "studio-roadmap-required-not-in-case-schema-yet"
    || summary.notMedicalAdviceNativeFieldStatus !== "studio-roadmap-required-not-in-case-schema-yet"
  ) {
    addIssue(errors, "phase5t_case_schema_gap", "live-evidence.officialCaseSurfaceSummary", "Phase 5T must keep clinicalCaveats/notMedicalAdvice as known schema gaps.");
  }
  if (summary.structuredLimitationsCaseCount < summary.officialCaseCount) {
    warnings.push({
      severity: "warning",
      code: "phase5t_structured_limitations_partial",
      path: "live-evidence.officialCaseSurfaceSummary",
      message: "Some official cases still rely on legacy modelLimitations instead of structuredLimitations.",
    });
  }
}

function validateCriteria(
  evidence: MyocardiumEducationToolDoDCheckpoint,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const criteria = new Map(evidence.criteria.map((criterion) => [criterion.id, criterion]));
  for (const id of [
    "phase5s-main-domain-operating-envelope",
    "low-preload-edge-is-report-only",
    "no-scientific-or-runtime-acceptance",
    "official-cases-have-teaching-metadata",
  ]) {
    if (criteria.get(id)?.status !== "pass") {
      addIssue(errors, "phase5t_required_criterion", `live-evidence.criteria.${id}`, `${id} must pass for owner-review readiness.`);
    }
  }
  for (const id of [
    "studio-safety-fields-are-known-gap",
    "static-mock-workbench-before-runtime-wiring",
  ]) {
    if (criteria.get(id)?.status !== "report-only") {
      addIssue(errors, "phase5t_report_only_criterion", `live-evidence.criteria.${id}`, `${id} must remain report-only, not acceptance.`);
    }
  }
  if (evidence.requiredStudioSurfaces.length < 10) {
    addIssue(errors, "phase5t_studio_surfaces", "live-evidence.requiredStudioSurfaces", "Phase 5T must enumerate the Studio surfaces required before runtime wiring.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5t_owner_review_not_acceptance",
    path: "live-evidence.criteria",
    message: "Phase 5T is ready for owner review, but the DoD is not accepted by this artifact.",
  });
}

function validateClassification(evidence: MyocardiumEducationToolDoDCheckpoint, errors: ValidationIssue[]): void {
  if (
    evidence.classification.ownerReviewStatus !== "ready"
    || evidence.classification.accepted !== false
    || evidence.classification.evidenceMode !== "education-tool-report-only"
    || evidence.classification.officialCaseReauthoring !== "required-before-runtime"
    || evidence.classification.runtimeWiring !== "absent"
    || evidence.classification.caseWiring !== "absent"
    || evidence.classification.workbenchWiring !== "absent"
  ) {
    addIssue(errors, "phase5t_classification", "live-evidence.classification", "Phase 5T must classify the DoD as owner-review-ready, not accepted, and with runtime/case/workbench wiring absent.");
  }
}

function validateOwnerReview(evidence: MyocardiumEducationToolDoDCheckpoint, errors: ValidationIssue[]): void {
  if (
    evidence.ownerReview.status !== "owner-review-ready-not-accepted"
    || evidence.ownerReview.satisfiedNow !== false
    || evidence.ownerReview.acceptanceRequiresOwnerDecision !== true
    || evidence.nextImplementationBoundary.recommendedNext
      !== "developer-only-lv-land-runtime-flag-design-rfc-before-any-case-or-workbench-wiring"
    || !evidence.nextImplementationBoundary.disallowedNextScope.includes("production runtime replacement")
    || !evidence.nextImplementationBoundary.disallowedNextScope.includes("Workbench runtime wiring")
  ) {
    addIssue(errors, "phase5t_owner_review", "live-evidence.ownerReview", "Phase 5T must stop at owner-review-ready and keep next runtime work RFC-only.");
  }
}

function validateDoesNotUnlock(evidence: MyocardiumEducationToolDoDCheckpoint, errors: ValidationIssue[]): void {
  for (const token of [
    "runtimeReplacement",
    "officialCaseWiring",
    "workbenchRuntimeWiring",
    "officialMorphologyAcceptance",
    "finalNoAlternans",
    "structuralAlternansRemoval",
    "Level3Acceptance",
    "Level4Acceptance",
    "clinicalDecisionSupport",
    "scientificValidationClaim",
  ] as const) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5t_does_not_unlock", "live-evidence.doesNotUnlock", `Phase 5T must keep ${token} blocked.`);
    }
  }
}

function validateArtifact(
  artifact: MyocardiumEducationToolDoDCheckpoint,
  evidence: MyocardiumEducationToolDoDCheckpoint,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5t_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match live Phase 5T evidence.");
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const builderText = readRequiredText(rootDir, BUILDER_PATH, errors);
  const readmeText = readRequiredText(rootDir, README_PATH, errors);
  const roadmapText = readRequiredText(rootDir, ROADMAP_PATH, errors);
  const lanesText = readRequiredText(rootDir, CURRENT_LANES_PATH, errors);
  const studioRoadmapText = readRequiredText(rootDir, STUDIO_ROADMAP_PATH, errors);
  const packageText = readRequiredText(rootDir, "package.json", errors);

  if (
    builderText
    && (!builderText.includes("education-tool-dod-owner-review-checkpoint-not-acceptance")
      || !builderText.includes("developer-only-lv-land-runtime-flag-design-rfc-before-any-case-or-workbench-wiring")
      || /runtimeReplacement\\s*:\\s*\"claimed\"/.test(builderText))
  ) {
    addIssue(errors, "phase5t_builder_boundary", BUILDER_PATH, "Builder must keep Phase 5T owner-review-only and runtime-blocked.");
  }
  const normalizedReadmeText = readmeText?.replace(/\s+/g, " ");
  if (
    normalizedReadmeText
    && (!normalizedReadmeText.includes("Phase 5T")
      || !normalizedReadmeText.includes("education-tool Definition of Done checkpoint")
      || !normalizedReadmeText.includes("owner-review-ready-not-accepted"))
  ) {
    addIssue(errors, "phase5t_readme", README_PATH, "README must record the Phase 5T education DoD checkpoint and owner-review boundary.");
  }
  if (
    roadmapText
    && (!roadmapText.includes("Phase 5T")
      || !roadmapText.includes("developer-only LV Land runtime-flag design RFC")
      || !roadmapText.includes("no runtime replacement"))
  ) {
    addIssue(errors, "phase5t_roadmap", ROADMAP_PATH, "Roadmap must record Phase 5T and keep runtime replacement blocked.");
  }
  if (
    lanesText
    && (!lanesText.includes("Phase 5T")
      || !lanesText.includes("owner-review-ready-not-accepted")
      || !lanesText.includes("developer-only LV Land runtime-flag design RFC"))
  ) {
    addIssue(errors, "phase5t_current_lanes", CURRENT_LANES_PATH, "Current lanes must point from Phase 5T to the developer-only runtime-flag RFC decision.");
  }
  if (
    studioRoadmapText
    && (!studioRoadmapText.includes("Select an official case, compare branches, inspect PV loop/waveform/output metrics, and read a synchronized explanatory note")
      || !studioRoadmapText.includes("must not convert a model diagnostic or morphology correlation into scientific acceptance")
      || !studioRoadmapText.includes("clinicalCaveats")
      || !studioRoadmapText.includes("notMedicalAdvice"))
  ) {
    addIssue(errors, "phase5t_studio_policy", STUDIO_ROADMAP_PATH, "Studio roadmap must keep static/mock Workbench and caveat fields visible.");
  }
  if (packageText && !packageText.includes("verify:myocardium-education-tool-dod-checkpoint")) {
    addIssue(errors, "phase5t_package_script", "package.json", "package.json must expose the Phase 5T verifier script.");
  }
}

function readRequiredText(rootDir: string, filePath: string, errors: ValidationIssue[]): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
    addIssue(errors, "phase5t_missing_source", filePath, `${filePath} must be readable for Phase 5T validation.`);
    return null;
  }
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function printReport(report: EducationToolDoDCheckpointValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `Myocardium education-tool DoD checkpoint ${status} `
    + `ownerReview=${report.evidence.ownerReview.status} `
    + `criteria=${report.evidence.criteria.length} `
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
  const report = validateEducationToolDefinitionOfDoneCheckpoint();
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
