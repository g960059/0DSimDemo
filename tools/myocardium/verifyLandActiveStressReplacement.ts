import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID,
  runLandActiveStressReplacementReadinessReport,
  type LandActiveStressReplacementReadinessReport,
} from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";

export const LAND_ACTIVE_STRESS_REPLACEMENT_DESCRIPTOR_PATH =
  "data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json";
export const DECISION19_OWNER_SELECTION_PATH =
  "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json";
export const PHASE4A_DOSSIER_PATH =
  "data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  readonly severity: ValidationSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type TextFileInput = {
  readonly path: string;
  readonly text: string;
};

export type LandActiveStressReplacementValidationInput = {
  readonly descriptor: unknown;
  readonly ownerSelection: unknown;
  readonly phase4ADossier: unknown;
  readonly report: LandActiveStressReplacementReadinessReport;
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly docs: readonly TextFileInput[];
  readonly phase3CProtocolText: TextFileInput;
};

export type LandActiveStressReplacementValidationReport = {
  readonly pass: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly readinessSectionCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly docCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  DECISION19_OWNER_SELECTION_PATH,
  PHASE4A_DOSSIER_PATH,
  "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json",
  "data/myocardium/protocols/calcium-land-phase2c-prescribed-shortening-protocols.json",
  "data/myocardium/protocols/land2017-phase1c-source-protocols.json",
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
] as const;

const REQUIRED_NON_COVERAGE = [
  { id: "rv-pressure-overload", pattern: /RV pressure overload/i },
  { id: "septal-bowing", pattern: /septal bowing/i },
  { id: "ventricular-interdependence", pattern: /ventricular interdependence/i },
  { id: "right-heart-failure", pattern: /right[- ]heart failure/i },
] as const;

const FORBIDDEN_CLAIM_PATTERNS = [
  /\bmorphologyPass\b/i,
  /\bofficialMorphologyPass\b/i,
  /\bproductionMechanicsPass\b/i,
  /\bproductionValidationPass\b/i,
  /\bvalidationPass\b/i,
  /\bofficialCaseWired\b/i,
  /\bmodelCoreWired\b/i,
  /\bchamberWired\b/i,
  /\bschemaMigrationWired\b/i,
  /\bownerGOPass\b/i,
  /\bproductionHomogenizationCompleted\b/i,
  /\bphase4BHomogenizationCompleted\b/i,
] as const;

const PHASE4B_RUNTIME_REFERENCE_TOKENS = [
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
  LAND_ACTIVE_STRESS_REPLACEMENT_DESCRIPTOR_PATH,
  "land-active-stress-replacement-phase4b",
  "landActiveStressReplacementReadiness",
  "Phase 4B-A",
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND,
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /useProductionMechanics\s*[:=]\s*true|productionMechanics(?:Enabled|Wired)?\s*[:=]\s*true|activeStressReplacement(?:Enabled|Wired)\s*[:=]\s*true/i;

const RUNTIME_INTEGRATION_TARGETS = [
  "engine/ModelCore.ts",
  "engine/chambers.ts",
  "engine/harness.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "engine/core/stateLayout.ts",
  "officialCases.ts",
  "data/cases",
  "public/cases",
] as const;

export function loadLandActiveStressReplacementValidationInput(
  rootDir = process.cwd(),
): LandActiveStressReplacementValidationInput {
  return {
    descriptor: readJson(path.join(rootDir, LAND_ACTIVE_STRESS_REPLACEMENT_DESCRIPTOR_PATH)),
    ownerSelection: readJson(path.join(rootDir, DECISION19_OWNER_SELECTION_PATH)),
    phase4ADossier: readJson(path.join(rootDir, PHASE4A_DOSSIER_PATH)),
    report: runLandActiveStressReplacementReadinessReport(),
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    docs: [
      readTextFile(rootDir, "docs/myocardium/README.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
    ],
    phase3CProtocolText: readTextFile(
      rootDir,
      "engine/myocardium/protocols/minimalLoadedAfterloadFamily.ts",
    ),
  };
}

export function validateLandActiveStressReplacementReadiness(
  input: LandActiveStressReplacementValidationInput,
): LandActiveStressReplacementValidationReport {
  const issues: ValidationIssue[] = [];

  validateReadinessReport(input.report, issues);
  validateDescriptor(input.descriptor, issues);
  validateDecision19OwnerSelection(input.ownerSelection, input.descriptor, input.report, issues);
  validatePhase4ADossier(input.phase4ADossier, issues);
  validateNamingGapDisclosure(input.descriptor, input.report, issues);
  validateForbiddenClaims(input.descriptor, input.report, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  validateNonCoverageAndFutureTriSeg("descriptor", input.descriptor, issues);
  for (const doc of input.docs) {
    validateNonCoverageAndFutureTriSeg(doc.path, doc.text, issues);
  }
  validatePhase3CNoLegacyActiveStress(input.phase3CProtocolText, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    pass: errors.length === 0,
    errors,
    warnings,
    summary: {
      readinessSectionCount: input.report.sections.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      docCount: input.docs.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateReadinessReport(
  report: LandActiveStressReplacementReadinessReport,
  issues: ValidationIssue[],
): void {
  if (report.protocolSetId !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID) {
    addIssue(issues, "error", "phase4b_report_identity", "report.protocolSetId", "Unexpected Phase 4B-A report id.");
  }
  if (report.claimBoundary !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY) {
    addIssue(issues, "error", "phase4b_report_boundary", "report.claimBoundary", "Report claim boundary must remain shadow readiness only.");
  }
  if (report.ownerAcceptanceStatus !== "decision19-owner-selection-accepted-only") {
    addIssue(issues, "error", "phase4b_report_boundary", "report.ownerAcceptanceStatus", "Report must claim only Decision 19 selection acceptance.");
  }
  if (report.productionRuntimeStatus !== "not-live-runtime-replacement") {
    addIssue(issues, "error", "phase4b_report_boundary", "report.productionRuntimeStatus", "Report must not claim live runtime replacement.");
  }
  if (report.phase4BTissueHomogenizationStatus !== "not-completed") {
    addIssue(issues, "error", "phase4b_report_boundary", "report.phase4BTissueHomogenizationStatus", "Report must not claim completed Phase 4B tissue homogenization.");
  }
  if (!report.readinessPass || report.readinessStatus !== "shadow-readiness-ready") {
    addIssue(issues, "error", "phase4b_readiness_sections", "report.readinessPass", "Readiness report must pass all readiness sections.");
  }
  if (report.sections.length !== 5) {
    addIssue(issues, "error", "phase4b_readiness_sections", "report.sections", "Expected five Phase 4B-A readiness sections.");
  }
  for (const section of report.sections) {
    if (section.status !== "readiness-pass") {
      addIssue(issues, "error", "phase4b_readiness_sections", `report.sections.${section.id}`, `${section.id} did not pass.`);
    }
  }
  if (!report.sourceBoundary.decision19Accepted || !report.sourceBoundary.phase4ADossierFrozen) {
    addIssue(issues, "error", "phase4b_source_boundary", "report.sourceBoundary", "Report source boundary must include accepted Decision 19 and frozen Phase 4A dossier.");
  }
  if (
    !report.landPipelineReadiness.phase3CClosurePass
    || !report.landPipelineReadiness.sourceKinematicsVirtualPowerHealthReady
    || !report.landPipelineReadiness.allMembersOk
  ) {
    addIssue(issues, "error", "phase4b_land_pipeline_readiness", "report.landPipelineReadiness", "Phase 3C Land pipeline readiness metrics must pass.");
  }
  if (report.morphologyProxy.morphologyProxyOutcome !== "proxy-ready") {
    addIssue(issues, "error", "phase4b_morphology_proxy", "report.morphologyProxy", "Morphology proxy outcome must be proxy-ready.");
  }
  validateBeatStability(report, issues);
}

function validateBeatStability(
  report: LandActiveStressReplacementReadinessReport,
  issues: ValidationIssue[],
): void {
  const beat = report.prescribedCaBeatStability;
  const evaluatedCycles = beat.evaluatedCycles ?? [];
  const finiteCycleMetrics = evaluatedCycles.every((cycle) =>
    [
      cycle.peakSourceActiveFiberStressPa,
      cycle.peakWallActiveNominalStressPa,
      cycle.peakInternalPressurePa,
      cycle.strokeProxyM3,
      cycle.ejectionLikeWorkJ,
    ].every(Number.isFinite)
    && cycle.samples > 0
    && cycle.ok,
  );
  const finiteDeltas = [
    ...(beat.cycleToCyclePeakStressRelativeDeltas ?? []),
    ...(beat.cycleToCyclePeakPressureRelativeDeltas ?? []),
    ...(beat.cycleToCycleStrokeProxyRelativeDeltas ?? []),
  ].every(Number.isFinite);
  const driftToleranceOk =
    beat.driftRelativeTolerance === 0.05
    && beat.alternansRelativeTolerance === 0.01
    && beat.alternansRelativeTolerance < beat.driftRelativeTolerance
    && beat.maxCycleToCycleRelativeDelta <= beat.driftRelativeTolerance;
  if (
    beat.preconditioningCycles !== 6
    || beat.warmupCycles !== 1
    || beat.evaluatedCyclesRequired !== 3
    || beat.stateCarryPolicy !== "state-carry-chained-cycle-runs"
    || evaluatedCycles.length !== 3
    || beat.cycleToCyclePeakStressRelativeDeltas.length !== 2
    || beat.cycleToCyclePeakPressureRelativeDeltas.length !== 2
    || beat.cycleToCycleStrokeProxyRelativeDeltas.length !== 2
    || !finiteCycleMetrics
    || !finiteDeltas
    || !driftToleranceOk
  ) {
    addIssue(
      issues,
      "error",
      "phase4b_beat_stability_hollow",
      "report.prescribedCaBeatStability",
      "Prescribed-Ca beat-stability smoke metrics must include six preconditioning cycles, one state-carry chained warm-up, three finite evaluated cycles, 5% drift tolerance, and 1% alternans tolerance.",
    );
  }
  if (beat.alternansPatternDetected !== false || beat.smokeReady !== true) {
    addIssue(
      issues,
      "error",
      "phase4b_beat_stability_hollow",
      "report.prescribedCaBeatStability",
      "Prescribed-Ca beat-stability smoke must report no alternans pattern for this shadow gate.",
    );
  }
  if (beat.notCalciumCyclingValidation !== true) {
    addIssue(
      issues,
      "error",
      "phase4b_beat_stability_scope",
      "report.prescribedCaBeatStability.notCalciumCyclingValidation",
      "Beat-stability smoke must not be framed as calcium-cycling alternans validation.",
    );
  }
}

function validateDescriptor(descriptor: unknown, issues: ValidationIssue[]): void {
  const descriptorRecord = isRecord(descriptor) ? descriptor : {};
  if (descriptorRecord.protocolSetId !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID) {
    addIssue(issues, "error", "phase4b_descriptor_identity", "descriptor.protocolSetId", "Unexpected descriptor id.");
  }
  if (
    descriptorRecord.statusBoundary !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY
    || descriptorRecord.claimBoundary !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY
  ) {
    addIssue(issues, "error", "phase4b_descriptor_boundary", "descriptor.claimBoundary", "Descriptor must remain shadow readiness only.");
  }
  if (
    descriptorRecord.selectedBackend !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND
    || descriptorRecord.selectedCandidateId !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID
  ) {
    addIssue(issues, "error", "phase4b_decision19_owner_selection", "descriptor.selectedCandidateId", "Descriptor must carry the accepted Decision 19 backend and candidate.");
  }

  const sourcePaths = sourceDocumentPaths(descriptorRecord.sourceDocuments);
  for (const requiredPath of REQUIRED_DESCRIPTOR_SOURCE_PATHS) {
    if (!sourcePaths.includes(requiredPath)) {
      addIssue(issues, "error", "phase4b_descriptor_source_ref", "descriptor.sourceDocuments", `Missing source reference ${requiredPath}.`);
    }
  }

  const checks = strings(descriptorRecord.currentChecks).join(" ");
  if (!/Land active[- ]stress replacement readiness/i.test(checks)) {
    addIssue(issues, "error", "phase4b_descriptor_current_checks", "descriptor.currentChecks", "Descriptor must include Land active-stress replacement readiness.");
  }
  if (!/morphology proxy/i.test(checks) || !/pass\/fail|pass[- ]fail|pass fail/i.test(checks)) {
    addIssue(issues, "error", "phase4b_descriptor_current_checks", "descriptor.currentChecks", "Descriptor must include a morphology proxy pass/fail report boundary.");
  }
  if (!/prescribed[- ]Ca/i.test(checks) || !/beat[- ]stability/i.test(checks) || !/no[- ]alternans/i.test(checks)) {
    addIssue(issues, "error", "phase4b_descriptor_current_checks", "descriptor.currentChecks", "Descriptor must include prescribed-Ca beat-stability/no-alternans smoke.");
  }

  const settings = isRecord(descriptorRecord.protocolSettings) ? descriptorRecord.protocolSettings : {};
  for (const settingName of [
    "useProductionMechanics",
    "usePassiveLawAcceptance",
    "useSeptalPericardialCoupling",
    "useClosedLoopSteadyState",
    "useModelCoreRuntimeWiring",
    "useOfficialCaseWiring",
    "phase4BTissueHomogenizationCompleted",
  ]) {
    if (settings[settingName] !== false) {
      addIssue(issues, "error", "phase4b_descriptor_boundary", `descriptor.protocolSettings.${settingName}`, `${settingName} must be false.`);
    }
  }
  if (
    settings.beatStabilityPreconditioningCycles !== 6
    || settings.beatStabilityWarmupCycles !== 1
    || settings.beatStabilityEvaluatedCycles !== 3
    || settings.beatStabilityStateCarryPolicy !== "state-carry-chained-cycle-runs"
    || settings.beatStabilityDriftRelativeTolerance !== 0.05
    || settings.beatStabilityAlternansRelativeTolerance !== 0.01
  ) {
    addIssue(
      issues,
      "error",
      "phase4b_beat_stability_hollow",
      "descriptor.protocolSettings.beatStability*",
      "Beat-stability smoke must use six preconditioning cycles, one warm-up cycle, three evaluated cycles, state carry between cycle runs, 5% drift tolerance, and 1% alternans tolerance.",
    );
  }
}

function validateDecision19OwnerSelection(
  ownerSelection: unknown,
  descriptor: unknown,
  report: LandActiveStressReplacementReadinessReport,
  issues: ValidationIssue[],
): void {
  const ownerRecord = isRecord(ownerSelection) ? ownerSelection : {};
  const descriptorRecord = isRecord(descriptor) ? descriptor : {};
  const descriptorDecision = isRecord(descriptorRecord.decision19OwnerSelection)
    ? descriptorRecord.decision19OwnerSelection
    : {};
  const accepted =
    ownerRecord.selectionId === "production-mechanics-decision19-owner-selection-v1"
    && ownerRecord.decisionId === 19
    && ownerRecord.status === "ACCEPTED"
    && ownerRecord.selectedBackend === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND
    && ownerRecord.selectedCandidateId === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID
    && descriptorDecision.status === "ACCEPTED"
    && descriptorDecision.selectedBackend === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND
    && descriptorDecision.selectedCandidateId === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID
    && report.selectedBackend === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND
    && report.selectedCandidateId === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID
    && report.sourceBoundary.decision19Accepted === true;
  if (!accepted) {
    addIssue(
      issues,
      "error",
      "phase4b_decision19_owner_selection",
      "ownerSelection",
      "Decision 19 owner selection must be ACCEPTED for thick-sphere-v2-explicit-external-septal-coupling.",
    );
  }
}

function validatePhase4ADossier(phase4ADossier: unknown, issues: ValidationIssue[]): void {
  const dossier = isRecord(phase4ADossier) ? phase4ADossier : {};
  if (
    dossier.dossierId !== "production-mechanics-phase4a-dossier-v1"
    || dossier.decision19Status !== "PENDING OWNER"
    || dossier.ownerAcceptanceStatus !== "not-owner-acceptance"
    || dossier.selectedCandidateId !== null
    || dossier.recommendedCandidateId !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID
  ) {
    addIssue(
      issues,
      "error",
      "phase4b_phase4a_dossier_boundary",
      "phase4ADossier",
      "Phase 4A dossier must remain frozen as recommendation-only evidence.",
    );
  }
}

function validateNamingGapDisclosure(
  descriptor: unknown,
  report: LandActiveStressReplacementReadinessReport,
  issues: ValidationIssue[],
): void {
  const descriptorRecord = isRecord(descriptor) ? descriptor : {};
  const coordinatePath = isRecord(descriptorRecord.executableCoordinatePath)
    ? descriptorRecord.executableCoordinatePath
    : {};
  const descriptorText = deepText(coordinatePath);
  const ok =
    descriptorRecord.selectedBackend === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND
    && coordinatePath.currentExecutableKinematicsModelId
      === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID
    && /Phase 3 coordinate-family shadow readiness/i.test(descriptorText)
    && /thick-sphere-spike-v1/i.test(descriptorText)
    && /not completion of thick-sphere-v2|not completed by this executable path/i.test(descriptorText)
    && report.executableCoordinatePath.currentExecutableKinematicsModelId
      === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID
    && report.executableCoordinatePath.selectedBackendCompletionStatus
      === "selected-thick-sphere-v2-not-completed";
  if (!ok) {
    addIssue(
      issues,
      "error",
      "phase4b_naming_gap_disclosure",
      "descriptor.executableCoordinatePath",
      "Descriptor/report must disclose that current execution is Phase 3 thick-sphere-spike-v1 shadow readiness, not completed thick-sphere-v2.",
    );
  }
}

function validateForbiddenClaims(
  descriptor: unknown,
  report: LandActiveStressReplacementReadinessReport,
  issues: ValidationIssue[],
): void {
  const targetTexts = [
    { path: "descriptor", text: JSON.stringify(descriptor) },
    { path: "report", text: JSON.stringify(report) },
  ];
  for (const target of targetTexts) {
    for (const pattern of FORBIDDEN_CLAIM_PATTERNS) {
      if (pattern.test(target.text)) {
        addIssue(
          issues,
          "error",
          "phase4b_forbidden_claim",
          target.path,
          `Forbidden positive claim token matched ${pattern}.`,
        );
      }
    }
  }
}

function validateRuntimeIntegrationScan(
  files: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of files) {
    for (const token of PHASE4B_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(
          issues,
          "error",
          "phase4b_runtime_leak",
          file.path,
          `Runtime/official-case integration target must not reference ${token}.`,
        );
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(
        issues,
        "error",
        "phase4b_runtime_leak",
        file.path,
        "Runtime/official-case integration target must not enable production mechanics replacement.",
      );
    }
  }
}

function validateNonCoverageAndFutureTriSeg(
  pathLabel: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const text = deepText(value).replace(/\s+/g, " ");
  for (const required of REQUIRED_NON_COVERAGE) {
    if (!required.pattern.test(text)) {
      addIssue(
        issues,
        "error",
        "phase4b_non_coverage",
        pathLabel,
        `${required.id} non-coverage wording is missing.`,
      );
    }
  }
  if (hasPositiveCoverageClaim(text)) {
    addIssue(
      issues,
      "error",
      "phase4b_non_coverage",
      pathLabel,
      "RV/interdependence text must not imply coverage by this initial backend or readiness gate.",
    );
  }
  if (
    !/future[^.]{0,160}TriSeg|TriSeg[^.]{0,160}future/i.test(text)
    || !/triseg-lite-compatible/i.test(text)
    || !/full-triseg-compatible/i.test(text)
    || !/full TriSeg/i.test(text)
    || !/before[^.]{0,160}claim/i.test(text)
  ) {
    addIssue(
      issues,
      "error",
      "phase4b_future_triseg_path",
      pathLabel,
      "Future TriSeg path must preserve triseg-lite-compatible, full-triseg-compatible, and full TriSeg escalation before those mechanisms are claimed.",
    );
  }
}

function validatePhase3CNoLegacyActiveStress(
  phase3CProtocolText: TextFileInput,
  issues: ValidationIssue[],
): void {
  if (
    /\bfrom\s+["']@\/engine\/(?:ModelCore|chambers|harness|runtime|protocol|stateContract|core\/stateLayout)/m
      .test(phase3CProtocolText.text)
  ) {
    addIssue(
      issues,
      "error",
      "phase3c_legacy_boundary",
      phase3CProtocolText.path,
      "Phase 3C protocol must not import ModelCore, chamber, runtime, schema, or protocol integration code.",
    );
  }
  if (/ActiveStressChamberModel|legacyActiveStress|oldActiveStress/.test(phase3CProtocolText.text)) {
    addIssue(
      issues,
      "error",
      "phase3c_legacy_boundary",
      phase3CProtocolText.path,
      "Phase 3C protocol must keep legacy active-stress code out.",
    );
  }
}

function loadRuntimeIntegrationFiles(rootDir: string): readonly TextFileInput[] {
  const out: TextFileInput[] = [];
  for (const target of RUNTIME_INTEGRATION_TARGETS) {
    const fullPath = path.join(rootDir, target);
    if (!existsSync(fullPath)) continue;
    for (const file of listFiles(fullPath)) {
      out.push({
        path: path.relative(rootDir, file),
        text: readFileSync(file, "utf8"),
      });
    }
  }
  return out;
}

function listFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx|json)$/.test(target) ? [target] : [];
  const out: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|json)$/.test(entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}

function sourceDocumentPaths(sourceDocuments: unknown): readonly string[] {
  if (!Array.isArray(sourceDocuments)) return [];
  return sourceDocuments
    .map((source) => isRecord(source) && typeof source.path === "string" ? source.path : undefined)
    .filter((sourcePath): sourcePath is string => sourcePath !== undefined);
}

function readTextFile(rootDir: string, relativePath: string): TextFileInput {
  return {
    path: relativePath,
    text: readFileSync(path.join(rootDir, relativePath), "utf8"),
  };
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function deepText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((entry) => deepText(entry)).join(" ");
  if (isRecord(value)) return Object.values(value).map((entry) => deepText(entry)).join(" ");
  return "";
}

function hasPositiveCoverageClaim(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ");
  const patterns = [
    /\b(?:cover(?:s|ed)?|support(?:s|ed)?|include(?:s|d)?)\s+(?:RV pressure overload|septal bowing|ventricular interdependence|right[- ]heart failure)/gi,
    /(?:RV pressure overload|septal bowing|ventricular interdependence|right[- ]heart failure)\s+(?:is|are|as)?\s*(?:now\s+)?(?:covered|supported|included)\b/gi,
  ];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      const before = normalized.slice(Math.max(0, match.index - 60), match.index);
      if (/\b(?:does not|do not|must not|is not|are not|not|without|cannot|can not)\b/i.test(before)) {
        continue;
      }
      return true;
    }
  }
  return false;
}

function addIssue(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  code: string,
  issuePath: string,
  message: string,
): void {
  issues.push({ severity, code, path: issuePath, message });
}

function parseArgs(args: readonly string[]): { rootDir: string } {
  const options = { rootDir: process.cwd() };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--root" && value) options.rootDir = path.resolve(value);
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printReport(report: LandActiveStressReplacementValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 4B-A Land active-stress replacement ${status} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `sections=${report.summary.readinessSectionCount} `
    + `integrationFiles=${report.summary.runtimeIntegrationFileCount} docs=${report.summary.docCount}`,
  );
  printIssues("errors", report.errors);
  printIssues("warnings", report.warnings);
}

function printIssues(label: string, issues: readonly ValidationIssue[]): void {
  if (issues.length === 0) return;
  // eslint-disable-next-line no-console
  console.log(`${label}:`);
  for (const issue of issues.slice(0, 30)) {
    // eslint-disable-next-line no-console
    console.log(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  }
  if (issues.length > 30) {
    // eslint-disable-next-line no-console
    console.log(`- ... ${issues.length - 30} more`);
  }
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run verify:myocardium-land-active-stress-replacement -- [--root=DIR]",
    "",
    "Validates the first Phase 4B-A shadow readiness gate for Land active-stress replacement.",
    "This verifier rejects runtime/case wiring, production validation claims, official morphology pass claims, and missing Decision 19 or TriSeg-boundary evidence.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateLandActiveStressReplacementReadiness(
    loadLandActiveStressReplacementValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
