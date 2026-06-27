import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS,
  PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
} from "@/engine/myocardium/mechanics";
import {
  PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS,
  PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY,
  PASSIVE_ENERGY_PHASE4C_PHASE,
  PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID,
  runPassiveEnergyReadinessReport,
  type PassiveEnergyReadinessReport,
} from "@/engine/myocardium/protocols/passiveEnergyReadiness";

export const PASSIVE_ENERGY_PHASE4C_DESCRIPTOR_PATH =
  "data/myocardium/protocols/passive-energy-phase4c-protocols.json";
export const PASSIVE_ENERGY_PHASE4C_CANDIDATE_SOURCE_PATH =
  "engine/myocardium/mechanics/passiveExponentialEnergyV1.ts";
export const PASSIVE_ENERGY_PHASE4C_REPORT_SOURCE_PATH =
  "engine/myocardium/protocols/passiveEnergyReadiness.ts";

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

export type PassiveEnergyReadinessValidationInput = {
  readonly descriptor: unknown;
  readonly report: PassiveEnergyReadinessReport;
  readonly candidateFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly docs: readonly TextFileInput[];
};

export type PassiveEnergyReadinessValidationReport = {
  readonly pass: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly readinessSectionCount: number;
    readonly candidateFileCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly docCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  "docs/myocardium/adr/ADR-MYO-001.md",
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  "data/myocardium/protocols/identity-force-phase3b-protocols.json",
  "data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json",
  "data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json",
] as const;

const REQUIRED_VERIFICATION_SCRIPTS = [
  "verify:myocardium-passive-energy-readiness",
  "verify:myocardium-generalized-forces",
  "verify:myocardium-tissue-homogenization-readiness",
  "verify:myocardium-land-active-stress-replacement",
  "verify:myocardium-mechanics-selection",
  "verify:myocardium-mechanics-decision",
] as const;

const REQUIRED_PROTOCOL_IDS = [
  "source-decision-boundary-v1",
  "passive-derivative-tangent-fd-smoke-v1",
  "convexity-sweep-v1",
  "c1-hinge-continuity-v1",
  "slack-compression-behavior-v1",
  "viscous-dissipation-sign-v1",
  "legacy-pressure-floor-exclusion-v1",
  "prior-gate-read-only-evidence-v1",
  "deterministic-replay-v1",
] as const;

const REQUIRED_NON_COVERAGE = [
  { id: "rv-pressure-overload", field: "RVPressureOverloadCoverage", pattern: /RV pressure overload/i },
  { id: "septal-bowing", field: "septalBowingCoverage", pattern: /septal bowing/i },
  { id: "ventricular-interdependence", field: "ventricularInterdependenceCoverage", pattern: /ventricular interdependence/i },
  { id: "right-heart-failure", field: "rightHeartFailureCoverage", pattern: /right[- ]heart failure/i },
] as const;

const PHASE4C_RUNTIME_REFERENCE_TOKENS = [
  PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID,
  PASSIVE_ENERGY_PHASE4C_DESCRIPTOR_PATH,
  "passive-energy-phase4c",
  "passiveEnergyReadiness",
  PASSIVE_ENERGY_PHASE4C_PHASE,
  PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY,
  PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
  "PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS",
  "PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID",
  "PASSIVE_EXPONENTIAL_ENERGY_V1_ID",
  "evaluatePassiveExponentialEnergyV1",
  "PassiveExponentialEnergyV1",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:usePassiveLawAcceptance|useProductionPassiveLaw|productionPassiveLaw(?:Enabled|Wired|Accepted|Validated)?|enablePassiveExponentialInRuntime|passiveEnergyRuntimeEnabled|liveRuntimeReplacement)["']?\s*[:=]\s*true/i;

const PASSIVE_DEFAULT_PATTERN =
  /(?:passive|candidate|energy|law)[^.!?\n]{0,120}\bdefault\b|\bdefault\b[^.!?\n]{0,120}(?:passive|candidate|energy|law)/i;

const LEGACY_PASSIVE_PARAM_PATTERN = /\b(?:sigmaPas0|bPas|lambdaPas0)\b/;

const PRESSURE_FLOOR_OR_CLAMP_PATTERN =
  /\b(?:pressureFloor|pressure_floor|stressClamp|stress_clamp|clampPassive|floorPressure)\b|pressure\s+floor|stress\s+clamp/i;

const NON_COVERAGE_TOKEN_PATTERN =
  /not[- ]claimed|not claimed|not covered|not cover|non[- ]coverage|non[- ]covered|without|no[^.!?\n。]{0,160}coverage|covered\s*では(?:ありません|なく|ない)|claim\s*しません|claimする前|before[^.!?\n。]{0,160}(?:claimed|covered)|preserve[^.!?\n。]{0,180}before/i;

const POSITIVE_COVERAGE_TOKEN_PATTERN =
  /\b(?:covered|coverage|claimed|validated|supported)\b|covered\s*です|claim\s*します/i;

const RUNTIME_INTEGRATION_TARGETS = [
  "caseCloud.ts",
  "caseDoc.ts",
  "casePersist.ts",
  "caseValidation.ts",
  "components/Cases.tsx",
  "engine/ModelCore.ts",
  "engine/caseBaselines.ts",
  "engine/caseResolve.ts",
  "engine/chambers.ts",
  "engine/guytonStarlingChainWorker.ts",
  "engine/guytonStarlingChainWorkerCore.ts",
  "engine/guytonStarlingChainProtocol.ts",
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/harness.ts",
  "engine/previewController.ts",
  "engine/previewWorker.ts",
  "engine/previewWorkerProtocol.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "engine/steadyJob.ts",
  "engine/transitionSteadyProtocol.ts",
  "engine/transitionSteadyWorker.ts",
  "engine/core/stateLayout.ts",
  "features/workbench/WorkbenchRoute.tsx",
  "features/workbench/casePublish.ts",
  "features/workbench/instanceRuntime.ts",
  "features/workbench/publish",
  "officialCases.ts",
  "tools/verifyCases.ts",
  "data/cases",
  "public/cases",
] as const;

export function loadPassiveEnergyReadinessValidationInput(
  rootDir = process.cwd(),
): PassiveEnergyReadinessValidationInput {
  return {
    descriptor: readJson(path.join(rootDir, PASSIVE_ENERGY_PHASE4C_DESCRIPTOR_PATH)),
    report: runPassiveEnergyReadinessReport(),
    candidateFiles: [
      readTextFile(rootDir, PASSIVE_ENERGY_PHASE4C_CANDIDATE_SOURCE_PATH),
      readTextFile(rootDir, PASSIVE_ENERGY_PHASE4C_REPORT_SOURCE_PATH),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    docs: [
      readTextFile(rootDir, "README.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
    ],
  };
}

export function validatePassiveEnergyReadiness(
  input: PassiveEnergyReadinessValidationInput,
): PassiveEnergyReadinessValidationReport {
  const issues: ValidationIssue[] = [];

  validateReadinessReport(input.report, issues);
  validateDescriptor(input.descriptor, issues);
  validateCandidateSourceFiles(input.candidateFiles, issues);
  validateForbiddenClaims("descriptor", input.descriptor, issues);
  validateForbiddenClaims("report", input.report, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  validateNonCoverageAndFutureTriSeg("descriptor", input.descriptor, issues);
  validateNonCoverageAndFutureTriSeg("report", input.report, issues);
  for (const doc of input.docs) {
    validateDocs(doc, issues);
    validateForbiddenClaims(doc.path, doc.text, issues);
    validateNonCoverageAndFutureTriSeg(doc.path, doc.text, issues);
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    pass: errors.length === 0,
    errors,
    warnings,
    summary: {
      readinessSectionCount: input.report.sections.length,
      candidateFileCount: input.candidateFiles.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      docCount: input.docs.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateReadinessReport(
  report: PassiveEnergyReadinessReport,
  issues: ValidationIssue[],
): void {
  if (report.protocolSetId !== PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID) {
    addIssue(issues, "error", "phase4c_report_identity", "report.protocolSetId", "Unexpected Phase 4C-A report id.");
  }
  if (
    report.phase !== PASSIVE_ENERGY_PHASE4C_PHASE
    || report.claimBoundary !== PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY
    || report.passiveCandidateStatus !== PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS
  ) {
    addIssue(issues, "error", "phase4c_report_boundary", "report.claimBoundary", "Report must remain a passive energy readiness candidate only.");
  }
  if (
    report.ownerAcceptanceStatus !== "not-owner-acceptance"
    || report.decision5Status !== "PENDING OWNER"
    || report.decision6Status !== "PENDING OWNER"
    || report.decision8Status !== "PENDING OWNER"
  ) {
    addIssue(issues, "error", "phase4c_decision_boundary", "report.decision6Status", "Decisions 5, 6, and 8 must remain PENDING OWNER with no owner acceptance.");
  }
  if (report.productionPassiveLaw !== "not-claimed") {
    addIssue(issues, "error", "phase4c_report_boundary", "report.productionPassiveLaw", "Report must not claim a production passive law.");
  }
  if (!report.readinessPass || report.readinessStatus !== "readiness-candidate-ready") {
    addIssue(issues, "error", "phase4c_readiness_sections", "report.readinessPass", "Readiness report must pass all sections.");
  }
  if (report.sections.length !== REQUIRED_PROTOCOL_IDS.length) {
    addIssue(issues, "error", "phase4c_readiness_sections", "report.sections", "Expected nine Phase 4C-A readiness sections.");
  }
  for (const id of REQUIRED_PROTOCOL_IDS) {
    const section = report.sections.find((candidate) => candidate.id === id);
    if (!section || section.status !== "readiness-pass") {
      addIssue(issues, "error", "phase4c_readiness_sections", `report.sections.${id}`, `${id} did not pass.`);
    }
  }
  if (
    report.passiveCandidate.modelId !== PASSIVE_EXPONENTIAL_ENERGY_V1_ID
    || report.passiveCandidate.parameterSetId !== PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID
    || report.passiveCandidate.claim !== "candidate-fixture-only"
    || !report.passiveCandidate.descriptorMatchesRuntimeParams
    || !passiveParamsEqual(report.passiveCandidate.params, PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS)
    || !passiveParamsEqual(report.passiveCandidate.descriptorParams, PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS)
  ) {
    addIssue(issues, "error", "phase4c_passive_candidate", "report.passiveCandidate", "Report passive candidate must match the Phase 4C-A fixture constants and remain candidate-only.");
  }
  if (
    !report.passivePhysics.derivativeTangent.pass
    || !report.passivePhysics.convexity.pass
    || !report.passivePhysics.hingeContinuity.pass
    || !report.passivePhysics.slackCompression.pass
    || !report.passivePhysics.viscousDissipation.pass
  ) {
    addIssue(issues, "error", "phase4c_passive_physics", "report.passivePhysics", "Passive derivative/tangent, convexity, hinge, compression, and dissipation checks must pass.");
  }
  if (
    !report.priorGateEvidence.phase3BClosurePass
    || !report.priorGateEvidence.phase4BAReadinessPass
    || !report.priorGateEvidence.phase4BBReadinessPass
    || !report.priorGateEvidence.phase3BStableSummaryHash
    || !report.priorGateEvidence.phase4BAStableSummaryHash
    || !report.priorGateEvidence.phase4BBStableSummaryHash
  ) {
    addIssue(issues, "error", "phase4c_prior_gate_evidence", "report.priorGateEvidence", "Phase 3B, Phase 4B-A, and Phase 4B-B evidence must remain passing and hash-backed.");
  }
  validateRequiredScripts(report.requiredVerificationScripts, "report.requiredVerificationScripts", issues);
}

function validateDescriptor(descriptor: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(descriptor)) {
    addIssue(issues, "error", "phase4c_descriptor_shape", "descriptor", "Descriptor must be an object.");
    return;
  }
  if (
    descriptor.protocolSetId !== PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID
    || descriptor.phase !== PASSIVE_ENERGY_PHASE4C_PHASE
    || descriptor.claimBoundary !== PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY
    || descriptor.statusBoundary !== PASSIVE_ENERGY_PHASE4C_CLAIM_BOUNDARY
    || descriptor.passiveCandidateStatus !== PASSIVE_ENERGY_PHASE4C_CANDIDATE_STATUS
  ) {
    addIssue(issues, "error", "phase4c_descriptor_boundary", "descriptor.claimBoundary", "Descriptor must remain the Phase 4C-A passive energy readiness candidate boundary.");
  }
  if (
    descriptor.ownerAcceptanceStatus !== "not-owner-acceptance"
    || descriptor.decision5Status !== "PENDING OWNER"
    || descriptor.decision6Status !== "PENDING OWNER"
    || descriptor.decision8Status !== "PENDING OWNER"
  ) {
    addIssue(issues, "error", "phase4c_decision_boundary", "descriptor.decision6Status", "Descriptor must leave Decisions 5, 6, and 8 PENDING OWNER.");
  }
  validatePendingOwnerDecisions(descriptor.pendingOwnerDecisions, issues);
  validateDirectSourceDocuments(descriptor.sourceDocuments, issues);
  validateDescriptorCandidate(descriptor.passiveCandidate, descriptor.modelIds, issues);
  validateProtocolSettings(descriptor.protocolSettings, issues);
  validateRequiredScripts(readonlyStrings(descriptor.requiredVerificationScripts), "descriptor.requiredVerificationScripts", issues);
  validateProtocolIds(descriptor.protocols, issues);
}

function validatePendingOwnerDecisions(value: unknown, issues: ValidationIssue[]): void {
  const decisions = records(value);
  for (const decisionId of [5, 6, 8] as const) {
    const decision = decisions.find((candidate) => candidate.decisionId === decisionId);
    if (decision?.status !== "PENDING OWNER") {
      addIssue(
        issues,
        "error",
        "phase4c_decision_boundary",
        `descriptor.pendingOwnerDecisions.${decisionId}`,
        `Decision ${decisionId} must remain PENDING OWNER.`,
      );
    }
  }
}

function validateDirectSourceDocuments(value: unknown, issues: ValidationIssue[]): void {
  const sourcePaths = records(value).map((source) => stringField(source, "path")).filter(Boolean);
  for (const requiredPath of REQUIRED_DESCRIPTOR_SOURCE_PATHS) {
    if (!sourcePaths.includes(requiredPath)) {
      addIssue(
        issues,
        "error",
        "phase4c_direct_provenance",
        "descriptor.sourceDocuments",
        `Descriptor must directly reference ${requiredPath}.`,
      );
    }
  }
}

function validateDescriptorCandidate(
  passiveCandidate: unknown,
  modelIds: unknown,
  issues: ValidationIssue[],
): void {
  const candidate = isRecord(passiveCandidate) ? passiveCandidate : {};
  const ids = isRecord(modelIds) ? modelIds : {};
  const params = isRecord(candidate.parameters) ? candidate.parameters : {};
  const candidateParams = {
    APa: numberField(params, "APa"),
    B: numberField(params, "B"),
    slackStrain: numberField(params, "slackStrain"),
    smoothWidthStrain: numberField(params, "smoothWidthStrain"),
    etaFPaSec: numberField(params, "etaFPaSec"),
  };
  if (
    ids.passiveMaterialModelId !== PASSIVE_EXPONENTIAL_ENERGY_V1_ID
    || ids.passiveParameterSetId !== PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID
    || candidate.modelId !== PASSIVE_EXPONENTIAL_ENERGY_V1_ID
    || candidate.parameterSetId !== PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID
    || candidate.claim !== "candidate-fixture-only"
    || !passiveParamsEqual(candidateParams, PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMS)
  ) {
    addIssue(issues, "error", "phase4c_passive_candidate", "descriptor.passiveCandidate", "Descriptor passive candidate must match the audited Phase 4C-A fixture constants.");
  }
}

function validateProtocolSettings(value: unknown, issues: ValidationIssue[]): void {
  const settings = isRecord(value) ? value : {};
  const falseFields = [
    "usePassiveLawAcceptance",
    "useProductionPassiveLaw",
    "useProductionMechanics",
    "useRuntimeReplacement",
    "useModelCoreRuntimeWiring",
    "useChamberRuntimeWiring",
    "useStateSchemaWiring",
    "useOfficialCaseWiring",
    "useWorkbenchRuntimeWiring",
    "useOfficialMorphologyAcceptance",
    "usePressureFloor",
    "useStressClamp",
    "enablePassiveExponentialInRuntime",
    "enableMultiCoordinateGeneralizedForceMapper",
  ] as const;
  for (const field of falseFields) {
    if (settings[field] !== false) {
      addIssue(issues, "error", "phase4c_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain false.`);
    }
  }
  for (const field of ["phase3BReusePolicy", "phase4BAReusePolicy", "phase4BBReusePolicy"] as const) {
    if (settings[field] !== "read-only") {
      addIssue(issues, "error", "phase4c_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain read-only.`);
    }
  }
}

function validateRequiredScripts(
  scripts: readonly string[],
  issuePath: string,
  issues: ValidationIssue[],
): void {
  for (const requiredScript of REQUIRED_VERIFICATION_SCRIPTS) {
    if (!scripts.includes(requiredScript)) {
      addIssue(issues, "error", "phase4c_required_scripts", issuePath, `Missing required verifier ${requiredScript}.`);
    }
  }
}

function validateProtocolIds(value: unknown, issues: ValidationIssue[]): void {
  const protocolIds = records(value).map((protocol) => stringField(protocol, "id"));
  for (const requiredId of REQUIRED_PROTOCOL_IDS) {
    if (!protocolIds.includes(requiredId)) {
      addIssue(issues, "error", "phase4c_readiness_sections", "descriptor.protocols", `Descriptor protocol list must include ${requiredId}.`);
    }
  }
}

function validateCandidateSourceFiles(
  candidateFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of candidateFiles) {
    if (
      file.path === PASSIVE_ENERGY_PHASE4C_CANDIDATE_SOURCE_PATH
      && LEGACY_PASSIVE_PARAM_PATTERN.test(file.text)
    ) {
      addIssue(
        issues,
        "error",
        "phase4c_candidate_legacy_params",
        file.path,
        "Phase 4C-A candidate artifacts must not use legacy passive parameter names.",
      );
    }
    if (
      file.path === PASSIVE_ENERGY_PHASE4C_CANDIDATE_SOURCE_PATH
      && PRESSURE_FLOOR_OR_CLAMP_PATTERN.test(file.text)
    ) {
      addIssue(
        issues,
        "error",
        "phase4c_candidate_pressure_floor",
        file.path,
        "Passive candidate implementation must not add pressure-floor or stress-clamp behavior.",
      );
    }
  }
}

function validateForbiddenClaims(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (PASSIVE_DEFAULT_PATTERN.test(text)) {
    addIssue(
      issues,
      "error",
      "phase4c_forbidden_claim",
      label,
      "Phase 4C-A may recommend a candidate pending Decision 6, but must not call the passive law a default.",
    );
  }
  scanForbiddenClaimFields(label, value, issues);
}

function scanForbiddenClaimFields(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
  pathPrefix = label,
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbiddenClaimFields(label, entry, issues, `${pathPrefix}.${index}`));
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    const issuePath = `${pathPrefix}.${key}`;
    if (
      key === "ownerAcceptanceStatus"
      && nestedValue !== "not-owner-acceptance"
      && nestedValue !== "accepted Phase 0 decision record"
    ) {
      addIssue(issues, "error", "phase4c_forbidden_claim", issuePath, "Owner acceptance must not be claimed in Phase 4C-A.");
    }
    if (
      (key === "decision5Status" || key === "decision6Status" || key === "decision8Status")
      && nestedValue !== "PENDING OWNER"
    ) {
      addIssue(issues, "error", "phase4c_forbidden_claim", issuePath, `${key} must remain PENDING OWNER.`);
    }
    if (
      [
        "ownerAcceptance",
        "decision5Acceptance",
        "decision6Acceptance",
        "decision8Acceptance",
        "productionPassiveLaw",
        "productionValidation",
        "officialMorphologyOutcome",
        "liveRuntimeReplacement",
        "runtimeSchemaStateLayoutChange",
        "ModelCoreChamberWiring",
        "officialCaseWiring",
        "multiCoordinateGeneralizedForceMapper",
        "pressureFloor",
        "RVPressureOverloadCoverage",
        "septalBowingCoverage",
        "ventricularInterdependenceCoverage",
        "rightHeartFailureCoverage",
      ].includes(key)
      && nestedValue !== "not-claimed"
    ) {
      addIssue(issues, "error", "phase4c_forbidden_claim", issuePath, `${key} must remain not-claimed.`);
    }
    scanForbiddenClaimFields(label, nestedValue, issues, issuePath);
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of PHASE4C_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(
          issues,
          "error",
          "phase4c_runtime_leak",
          file.path,
          `Runtime/official-case integration file must not reference Phase 4C-A passive candidate token ${token}.`,
        );
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(
        issues,
        "error",
        "phase4c_runtime_leak",
        file.path,
        "Runtime/official-case integration file must not enable production passive mechanics or live passive replacement.",
      );
    }
  }
}

function validateNonCoverageAndFutureTriSeg(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const required of REQUIRED_NON_COVERAGE) {
    const windows = mechanismWindows(text, required.pattern);
    const hasExplicitNonCoverage =
      coverageFieldIsNotClaimed(value, required.field)
      || windows.some((window) => NON_COVERAGE_TOKEN_PATTERN.test(window));
    if (!hasExplicitNonCoverage) {
      addIssue(
        issues,
        "error",
        "phase4c_non_coverage",
        label,
        `Missing non-coverage statement for ${required.id}.`,
      );
    }
    for (const window of windows) {
      if (
        POSITIVE_COVERAGE_TOKEN_PATTERN.test(window)
        && !NON_COVERAGE_TOKEN_PATTERN.test(window)
      ) {
        addIssue(
          issues,
          "error",
          "phase4c_coverage_overclaim",
          label,
          `Coverage overclaim detected for ${required.id}.`,
        );
      }
    }
  }
  if (
    !/triseg-lite-compatible/i.test(text)
    || !/full-triseg-compatible/i.test(text)
    || !/full TriSeg/i.test(text)
  ) {
    addIssue(
      issues,
      "error",
      "phase4c_future_triseg_path",
      label,
      "Missing future TriSeg escalation path.",
    );
  }
}

function coverageFieldIsNotClaimed(value: unknown, field: string): boolean {
  if (!isRecord(value) || !isRecord(value.claimExclusions)) return false;
  return value.claimExclusions[field] === "not-claimed";
}

function mechanismWindows(text: string, pattern: RegExp): string[] {
  const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  const windows: string[] = [];
  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0;
    windows.push(text.slice(Math.max(0, index - 140), Math.min(text.length, index + 260)));
  }
  return windows;
}

function validateDocs(file: TextFileInput, issues: ValidationIssue[]): void {
  if (
    (file.path === "docs/myocardium/README.md" || file.path === "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md")
    && !file.text.includes("verify:myocardium-passive-energy-readiness")
  ) {
    addIssue(
      issues,
      "error",
      "phase4c_docs_mention",
      file.path,
      "Docs must mention the Phase 4C-A passive energy readiness verifier.",
    );
  }
}

function loadRuntimeIntegrationFiles(rootDir: string): TextFileInput[] {
  return RUNTIME_INTEGRATION_TARGETS.flatMap((target) => {
    const fullPath = path.join(rootDir, target);
    if (!existsSync(fullPath)) return [];
    return listFiles(fullPath).map((filePath) => ({
      path: path.relative(rootDir, filePath).split(path.sep).join("/"),
      text: readFileSync(filePath, "utf8"),
    }));
  });
}

function listFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx|json)$/.test(target) ? [target] : [];

  const files: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|json)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function passiveParamsEqual(
  left: {
    readonly APa: number;
    readonly B: number;
    readonly slackStrain: number;
    readonly smoothWidthStrain: number;
    readonly etaFPaSec: number;
  },
  right: {
    readonly APa: number;
    readonly B: number;
    readonly slackStrain: number;
    readonly smoothWidthStrain: number;
    readonly etaFPaSec: number;
  },
): boolean {
  return left.APa === right.APa
    && left.B === right.B
    && left.slackStrain === right.slackStrain
    && left.smoothWidthStrain === right.smoothWidthStrain
    && left.etaFPaSec === right.etaFPaSec;
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function readonlyStrings(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: JsonRecord, field: string): string {
  const value = record[field];
  return typeof value === "string" ? value : "";
}

function numberField(record: JsonRecord, field: string): number {
  const value = record[field];
  return typeof value === "number" ? value : Number.NaN;
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readTextFile(rootDir: string, relativePath: string): TextFileInput {
  return {
    path: relativePath,
    text: readFileSync(path.join(rootDir, relativePath), "utf8"),
  };
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

function printReport(report: PassiveEnergyReadinessValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 4C-A passive energy readiness ${status} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `sections=${report.summary.readinessSectionCount} `
    + `candidateFiles=${report.summary.candidateFileCount} `
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
    "Usage: npm run verify:myocardium-passive-energy-readiness -- [--root=DIR]",
    "",
    "Validates the Phase 4C-A passive energy readiness candidate gate.",
    "This verifier rejects Decision 5/6/8 acceptance, production passive-law claims, official morphology pass claims, live runtime replacement, runtime/case wiring, legacy passive parameter names in candidate artifacts, pressure floors or stress clamps in the candidate implementation, missing prior-gate evidence, and missing TriSeg-boundary evidence.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validatePassiveEnergyReadiness(
    loadPassiveEnergyReadinessValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
