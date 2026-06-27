import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  IDENTITY_FIBER_NOMINAL_V1_ID,
  IDENTITY_FIBER_NOMINAL_V1_PARAMS,
} from "@/engine/myocardium/homogenization";
import {
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
  runLandActiveStressReplacementReadinessReport,
  type LandActiveStressReplacementReadinessReport,
} from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import {
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE,
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY,
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_IDENTIFIABILITY_RANK_STATUS,
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE,
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID,
  runTissueHomogenizationReadinessReport,
  type TissueHomogenizationReadinessReport,
} from "@/engine/myocardium/protocols/tissueHomogenizationReadiness";

export const LAND_TISSUE_HOMOGENIZATION_DESCRIPTOR_PATH =
  "data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json";
export const PHASE3B_IDENTITY_FORCE_DESCRIPTOR_PATH =
  "data/myocardium/protocols/identity-force-phase3b-protocols.json";
export const PHASE3C_MINIMAL_LOADED_DESCRIPTOR_PATH =
  "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
export const PHASE4BA_ACTIVE_STRESS_REPLACEMENT_DESCRIPTOR_PATH =
  "data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json";

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

export type TissueHomogenizationReadinessValidationInput = {
  readonly descriptor: unknown;
  readonly phase3BDescriptor: unknown;
  readonly phase3CDescriptor: unknown;
  readonly phase4BADescriptor: unknown;
  readonly phase4BAReport: LandActiveStressReplacementReadinessReport;
  readonly report: TissueHomogenizationReadinessReport;
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly docs: readonly TextFileInput[];
};

export type TissueHomogenizationReadinessValidationReport = {
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
  PHASE3B_IDENTITY_FORCE_DESCRIPTOR_PATH,
  PHASE3C_MINIMAL_LOADED_DESCRIPTOR_PATH,
  PHASE4BA_ACTIVE_STRESS_REPLACEMENT_DESCRIPTOR_PATH,
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
] as const;

const REQUIRED_VERIFICATION_SCRIPTS = [
  "verify:myocardium-tissue-homogenization-readiness",
  "verify:myocardium-generalized-forces",
  "verify:myocardium-minimal-loaded-chamber",
  "verify:myocardium-land-active-stress-replacement",
  "verify:myocardium-mechanics-selection",
  "verify:myocardium-mechanics-decision",
] as const;

const REQUIRED_NON_COVERAGE = [
  { id: "rv-pressure-overload", pattern: /RV pressure overload/i },
  { id: "septal-bowing", pattern: /septal bowing/i },
  { id: "ventricular-interdependence", pattern: /ventricular interdependence/i },
  { id: "right-heart-failure", pattern: /right[- ]heart failure/i },
] as const;

const PHASE4BB_RUNTIME_REFERENCE_TOKENS = [
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID,
  LAND_TISSUE_HOMOGENIZATION_DESCRIPTOR_PATH,
  "land-tissue-homogenization-phase4b",
  "tissueHomogenizationReadiness",
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE,
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY,
] as const;

const LIVE_IDENTITY_ADAPTER_RUNTIME_TOKENS = [
  "IdentityFiberNominalV1",
  "evaluateIdentityFiberNominalV1",
  "identity-fiber-nominal-v1",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useProduction(?:Homogenization|Mechanics)|production(?:Homogenization|Mechanics)(?:Enabled|Wired|Completed)?|activeStressReplacement(?:Enabled|Wired)|liveRuntimeReplacement)["']?\s*[:=]\s*true/i;

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
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/harness.ts",
  "engine/previewWorker.ts",
  "engine/previewWorkerProtocol.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
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

export function loadTissueHomogenizationReadinessValidationInput(
  rootDir = process.cwd(),
): TissueHomogenizationReadinessValidationInput {
  return {
    descriptor: readJson(path.join(rootDir, LAND_TISSUE_HOMOGENIZATION_DESCRIPTOR_PATH)),
    phase3BDescriptor: readJson(path.join(rootDir, PHASE3B_IDENTITY_FORCE_DESCRIPTOR_PATH)),
    phase3CDescriptor: readJson(path.join(rootDir, PHASE3C_MINIMAL_LOADED_DESCRIPTOR_PATH)),
    phase4BADescriptor: readJson(path.join(rootDir, PHASE4BA_ACTIVE_STRESS_REPLACEMENT_DESCRIPTOR_PATH)),
    phase4BAReport: runLandActiveStressReplacementReadinessReport(),
    report: runTissueHomogenizationReadinessReport(),
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    docs: [
      readTextFile(rootDir, "README.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
    ],
  };
}

export function validateTissueHomogenizationReadiness(
  input: TissueHomogenizationReadinessValidationInput,
): TissueHomogenizationReadinessValidationReport {
  const issues: ValidationIssue[] = [];

  validateReadinessReport(input.report, input.phase4BAReport, issues);
  validateDescriptor(input.descriptor, issues);
  validateDirectSourceDescriptors(input.phase3BDescriptor, input.phase3CDescriptor, input.phase4BADescriptor, issues);
  validateForbiddenClaims("descriptor", input.descriptor, issues);
  validateForbiddenClaims("report", input.report, issues);
  validateIdentityLimitationText("descriptor", input.descriptor, issues);
  validateIdentityLimitationText("report", input.report, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  validateNonCoverageAndFutureTriSeg("descriptor", input.descriptor, issues);
  for (const doc of input.docs) {
    validateNonCoverageAndFutureTriSeg(doc.path, doc.text, issues);
    validateIdentityLimitationText(doc.path, doc.text, issues);
  }

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
  report: TissueHomogenizationReadinessReport,
  phase4BAReport: LandActiveStressReplacementReadinessReport,
  issues: ValidationIssue[],
): void {
  if (report.protocolSetId !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID) {
    addIssue(issues, "error", "phase4bb_report_identity", "report.protocolSetId", "Unexpected Phase 4B-B report id.");
  }
  if (
    report.phase !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE
    || report.claimBoundary !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY
    || report.adapterAuditScope !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE
  ) {
    addIssue(issues, "error", "phase4bb_report_boundary", "report.claimBoundary", "Report must remain a locked shadow adapter candidate audit.");
  }
  if (
    report.ownerAcceptanceStatus !== "not-owner-acceptance"
    || report.decision4Status !== "PENDING OWNER"
  ) {
    addIssue(issues, "error", "phase4bb_decision4_boundary", "report.decision4Status", "Decision 4 must remain PENDING OWNER with no owner acceptance.");
  }
  if (
    report.productionHomogenization !== "not-claimed"
    || report.identifiabilityRankStatus !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_IDENTIFIABILITY_RANK_STATUS
  ) {
    addIssue(issues, "error", "phase4bb_scope_boundary", "report.productionHomogenization", "Report must not claim production homogenization or an identifiability rank run.");
  }
  if (!report.readinessPass || report.readinessStatus !== "readiness-audit-ready") {
    addIssue(issues, "error", "phase4bb_readiness_sections", "report.readinessPass", "Readiness audit report must pass all sections.");
  }
  if (report.sections.length !== 7) {
    addIssue(issues, "error", "phase4bb_readiness_sections", "report.sections", "Expected seven Phase 4B-B readiness sections.");
  }
  for (const section of report.sections) {
    if (section.status !== "readiness-pass") {
      addIssue(issues, "error", "phase4bb_readiness_sections", `report.sections.${section.id}`, `${section.id} did not pass.`);
    }
  }
  if (
    report.phase4BAReuse.status !== "read-only"
    || report.phase4BAReuse.reportProtocolSetId !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID
    || report.phase4BAReuse.stableSummaryHash !== phase4BAReport.stableSummaryHash
    || report.phase4BAReuse.readinessPass !== phase4BAReport.readinessPass
  ) {
    addIssue(issues, "error", "phase4bb_phase4ba_reuse", "report.phase4BAReuse", "Phase 4B-A reuse must be read-only and match the current Phase 4B-A report output.");
  }
  if (
    !report.provenance.directAdapterProvenanceComplete
    || !report.provenance.phase3BClosurePass
    || !report.provenance.phase3CClosurePass
    || !report.provenance.phase4BAReadinessPass
  ) {
    addIssue(issues, "error", "phase4bb_direct_provenance", "report.provenance", "Report must include direct Phase 3B/3C provenance and passing prior readiness reports.");
  }
  validateReportIdentityParams(report, issues);
  validateIdentityMappingSmoke(report, issues);
  for (const script of REQUIRED_VERIFICATION_SCRIPTS) {
    if (!report.requiredVerificationScripts.includes(script)) {
      addIssue(issues, "error", "phase4bb_verification_list", "report.requiredVerificationScripts", `Missing required verification script ${script}.`);
    }
  }
}

function validateReportIdentityParams(
  report: TissueHomogenizationReadinessReport,
  issues: ValidationIssue[],
): void {
  const params = report.identityAdapterCandidate.params;
  const descriptorParams = report.identityAdapterCandidate.descriptorParams;
  const ok =
    report.auditedAdapterCandidateId === IDENTITY_FIBER_NOMINAL_V1_ID
    && report.identityAdapterCandidate.homogenizationModelId === IDENTITY_FIBER_NOMINAL_V1_ID
    && report.identityAdapterCandidate.claim === "locked-shadow-adapter-candidate-only"
    && params.activeTissueFraction === IDENTITY_FIBER_NOMINAL_V1_PARAMS.activeTissueFraction
    && params.orientationRuleId === IDENTITY_FIBER_NOMINAL_V1_PARAMS.orientationRuleId
    && params.allowFreeGain === IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain
    && params.fitToPVLoop === IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop
    && descriptorParams.activeTissueFraction === IDENTITY_FIBER_NOMINAL_V1_PARAMS.activeTissueFraction
    && descriptorParams.orientationRuleId === IDENTITY_FIBER_NOMINAL_V1_PARAMS.orientationRuleId
    && descriptorParams.allowFreeGain === IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain
    && descriptorParams.fitToPVLoop === IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop
    && report.identityAdapterCandidate.descriptorMatchesRuntimeParams === true;
  if (!ok) {
    addIssue(issues, "error", "phase4bb_identity_params", "report.identityAdapterCandidate", "Report identity adapter candidate must match IDENTITY_FIBER_NOMINAL_V1_PARAMS exactly.");
  }
}

function validateIdentityMappingSmoke(
  report: TissueHomogenizationReadinessReport,
  issues: ValidationIssue[],
): void {
  const smoke = report.identityMappingSmoke;
  const ok =
    smoke.stressPassThrough
    && smoke.stabilizationPassThrough
    && smoke.algorithmicTangentPassThrough
    && smoke.stabilizationAndAlgorithmicTangentDistinct
    && smoke.wallActiveNominalStressPa === smoke.sourceActiveFiberStressPa
    && smoke.wallStabilizationStiffnessPa === smoke.sourceStabilizationStiffnessPa
    && smoke.wallAlgorithmicTangentPa === smoke.sourceAlgorithmicTangentPa
    && smoke.wallStabilizationStiffnessPa !== smoke.wallAlgorithmicTangentPa
    && smoke.allowFreeGain === false
    && smoke.fitToPVLoop === false;
  if (!ok) {
    addIssue(
      issues,
      "error",
      "phase4bb_tangent_separation",
      "report.identityMappingSmoke",
      "Identity mapping smoke must keep stabilizationStiffnessPa and optional algorithmic tangent distinct while passing both fields through.",
    );
  }
}

function validateDescriptor(descriptor: unknown, issues: ValidationIssue[]): void {
  const descriptorRecord = isRecord(descriptor) ? descriptor : {};
  if (descriptorRecord.protocolSetId !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID) {
    addIssue(issues, "error", "phase4bb_descriptor_identity", "descriptor.protocolSetId", "Unexpected descriptor id.");
  }
  if (
    descriptorRecord.phase !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE
    || descriptorRecord.statusBoundary !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY
    || descriptorRecord.claimBoundary !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY
    || descriptorRecord.adapterAuditScope !== LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE
  ) {
    addIssue(issues, "error", "phase4bb_descriptor_boundary", "descriptor.claimBoundary", "Descriptor must remain a Phase 4B-B locked shadow adapter candidate audit.");
  }
  if (
    descriptorRecord.ownerAcceptanceStatus !== "not-owner-acceptance"
    || descriptorRecord.decision4Status !== "PENDING OWNER"
  ) {
    addIssue(issues, "error", "phase4bb_decision4_boundary", "descriptor.decision4Status", "Descriptor must keep Decision 4 PENDING OWNER and owner acceptance unclaimed.");
  }
  if (
    descriptorRecord.productionHomogenization !== "not-claimed"
    || descriptorRecord.identifiabilityRankStatus !== "not-run"
  ) {
    addIssue(issues, "error", "phase4bb_scope_boundary", "descriptor.productionHomogenization", "Descriptor must not claim production homogenization or an identifiability rank run.");
  }
  const sourcePaths = sourceDocumentPaths(descriptorRecord.sourceDocuments);
  for (const requiredPath of REQUIRED_DESCRIPTOR_SOURCE_PATHS) {
    if (!sourcePaths.includes(requiredPath)) {
      addIssue(issues, "error", "phase4bb_direct_provenance", "descriptor.sourceDocuments", `Missing direct source reference ${requiredPath}.`);
    }
  }
  validateDescriptorDecision4(descriptorRecord, issues);
  validateDescriptorIdentityParams(descriptorRecord, issues);
  validateDescriptorSettings(descriptorRecord, issues);
  validateDescriptorVerificationList(descriptorRecord, issues);
  validateDescriptorChecks(descriptorRecord, issues);
}

function validateDescriptorDecision4(
  descriptorRecord: JsonRecord,
  issues: ValidationIssue[],
): void {
  const decisions = Array.isArray(descriptorRecord.pendingOwnerDecisions)
    ? descriptorRecord.pendingOwnerDecisions
    : [];
  const decision4 = decisions.find(
    (candidate) => isRecord(candidate) && candidate.decisionId === 4,
  );
  if (!isRecord(decision4) || decision4.status !== "PENDING OWNER") {
    addIssue(issues, "error", "phase4bb_decision4_boundary", "descriptor.pendingOwnerDecisions", "Decision 4 must remain PENDING OWNER.");
  }
}

function validateDescriptorIdentityParams(
  descriptorRecord: JsonRecord,
  issues: ValidationIssue[],
): void {
  const identityAdapter = isRecord(descriptorRecord.identityAdapterCandidate)
    ? descriptorRecord.identityAdapterCandidate
    : {};
  const params = isRecord(identityAdapter.parameters) ? identityAdapter.parameters : {};
  const ok =
    identityAdapter.homogenizationModelId === IDENTITY_FIBER_NOMINAL_V1_ID
    && identityAdapter.claim === "locked-shadow-adapter-candidate-only"
    && params.activeTissueFraction === IDENTITY_FIBER_NOMINAL_V1_PARAMS.activeTissueFraction
    && params.orientationRuleId === IDENTITY_FIBER_NOMINAL_V1_PARAMS.orientationRuleId
    && params.allowFreeGain === IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain
    && params.fitToPVLoop === IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop;
  if (!ok) {
    addIssue(issues, "error", "phase4bb_identity_params", "descriptor.identityAdapterCandidate.parameters", "Descriptor identity adapter parameters must match IDENTITY_FIBER_NOMINAL_V1_PARAMS exactly.");
  }
}

function validateDescriptorSettings(
  descriptorRecord: JsonRecord,
  issues: ValidationIssue[],
): void {
  const settings = isRecord(descriptorRecord.protocolSettings)
    ? descriptorRecord.protocolSettings
    : {};
  for (const settingName of [
    "allowFreeHomogenizationGain",
    "fitToPVLoop",
    "useProductionHomogenization",
    "useProductionMechanics",
    "useRuntimeReplacement",
    "useModelCoreRuntimeWiring",
    "useOfficialCaseWiring",
    "useOfficialMorphologyAcceptance",
    "useCalciumCyclingAlternansValidation",
    "runIndependentIdentifiabilityRank",
  ]) {
    if (settings[settingName] !== false) {
      addIssue(issues, "error", "phase4bb_descriptor_boundary", `descriptor.protocolSettings.${settingName}`, `${settingName} must be false.`);
    }
  }
  if (settings.phase4BAReusePolicy !== "read-only") {
    addIssue(issues, "error", "phase4bb_phase4ba_reuse", "descriptor.protocolSettings.phase4BAReusePolicy", "Phase 4B-A reuse must stay read-only.");
  }
}

function validateDescriptorVerificationList(
  descriptorRecord: JsonRecord,
  issues: ValidationIssue[],
): void {
  const scripts = strings(descriptorRecord.requiredVerificationScripts);
  for (const script of REQUIRED_VERIFICATION_SCRIPTS) {
    if (!scripts.includes(script)) {
      addIssue(issues, "error", "phase4bb_verification_list", "descriptor.requiredVerificationScripts", `Missing required verification script ${script}.`);
    }
  }
}

function validateDescriptorChecks(
  descriptorRecord: JsonRecord,
  issues: ValidationIssue[],
): void {
  const checks = strings(descriptorRecord.currentChecks).join(" ");
  if (!/audits the locked shadow adapter candidate/i.test(checks)) {
    addIssue(issues, "error", "phase4bb_descriptor_current_checks", "descriptor.currentChecks", "Descriptor must use locked shadow adapter candidate audit wording.");
  }
  if (!/Decision 4 remains PENDING OWNER/i.test(checks)) {
    addIssue(issues, "error", "phase4bb_decision4_boundary", "descriptor.currentChecks", "Descriptor must state Decision 4 remains PENDING OWNER.");
  }
  if (!/stabilizationStiffnessPa/i.test(checks) || !/algorithmic tangent/i.test(checks)) {
    addIssue(issues, "error", "phase4bb_tangent_separation", "descriptor.currentChecks", "Descriptor must require stabilization/tangent field separation.");
  }
}

function validateDirectSourceDescriptors(
  phase3BDescriptor: unknown,
  phase3CDescriptor: unknown,
  phase4BADescriptor: unknown,
  issues: ValidationIssue[],
): void {
  const phase3B = isRecord(phase3BDescriptor) ? phase3BDescriptor : {};
  const phase3C = isRecord(phase3CDescriptor) ? phase3CDescriptor : {};
  const phase4BA = isRecord(phase4BADescriptor) ? phase4BADescriptor : {};
  if (
    phase3B.protocolSetId !== "identity-force-phase3b-protocols-v1"
    || !isModelId(phase3B, IDENTITY_FIBER_NOMINAL_V1_ID)
    || phase3B.ownerAcceptanceStatus !== "not-owner-acceptance"
  ) {
    addIssue(issues, "error", "phase4bb_direct_provenance", PHASE3B_IDENTITY_FORCE_DESCRIPTOR_PATH, "Phase 3B identity-force descriptor must be a direct identity adapter source with no owner acceptance.");
  }
  if (
    phase3C.protocolSetId !== "minimal-loaded-phase3c-afterload-protocols-v1"
    || !isModelId(phase3C, IDENTITY_FIBER_NOMINAL_V1_ID)
    || phase3C.ownerAcceptanceStatus !== "not-owner-acceptance"
  ) {
    addIssue(issues, "error", "phase4bb_direct_provenance", PHASE3C_MINIMAL_LOADED_DESCRIPTOR_PATH, "Phase 3C minimal-loaded descriptor must be a direct identity adapter source with no owner acceptance.");
  }
  if (
    phase4BA.protocolSetId !== LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID
    || phase4BA.claimBoundary !== "shadow-replacement-readiness-only"
  ) {
    addIssue(issues, "error", "phase4bb_phase4ba_reuse", PHASE4BA_ACTIVE_STRESS_REPLACEMENT_DESCRIPTOR_PATH, "Phase 4B-A descriptor must remain read-only shadow readiness context.");
  }
}

function validateForbiddenClaims(
  pathLabel: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  for (const violation of collectForbiddenClaimFieldViolations(value)) {
    addIssue(
      issues,
      "error",
      "phase4bb_forbidden_claim",
      `${pathLabel}.${violation.path}`,
      `${violation.path} must not claim ${violation.value}.`,
    );
  }
  const text = deepText(value).replace(/\s+/g, " ");
  for (const pattern of [
    /production(?:\s+|-)?homogenization[^.]{0,80}\b(?:complete|completed|accepted|validated|ready)\b/gi,
    /official(?:\s+|-)?morphology[^.]{0,80}\b(?:pass|accepted|validated)\b/gi,
    /live(?:\s+|-)?runtime(?:\s+|-)?replacement[^.]{0,80}\b(?:enabled|wired|complete|completed|accepted)\b/gi,
    /calcium(?:\s+|-)?cycling(?:\s+|-)?alternans[^.]{0,80}\b(?:validated|accepted)\b/gi,
    /Decision 4[^.]{0,80}\b(?:ACCEPTED|accepted|final)\b/gi,
  ]) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const before = text.slice(Math.max(0, match.index - 80), match.index);
      if (/\b(?:no|not|does not|do not|must not|without|unclaimed|not-claimed)\b/i.test(before)) {
        continue;
      }
      addIssue(issues, "error", "phase4bb_forbidden_claim", pathLabel, `Forbidden positive claim matched ${pattern}.`);
      break;
    }
  }
}

function validateIdentityLimitationText(
  pathLabel: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const text = deepText(value).replace(/\s+/g, " ");
  const required = [
    { id: "activeTissueFraction=1", pattern: /activeTissueFraction=1|activeTissueFraction\s+1/i },
    { id: "identity orientation", pattern: /identity orientation/i },
    { id: "no fiber orientation", pattern: /no fiber orientation/i },
    { id: "no dispersion", pattern: /no dispersion/i },
    { id: "no transmural variation", pattern: /no transmural variation/i },
    { id: "no fraction<1", pattern: /no active tissue fraction<1|no fraction<1/i },
    { id: "no independent data", pattern: /no independent data/i },
    { id: "no identifiability rank run", pattern: /no independent identifiability rank run|no identifiability rank run|identifiabilityRankStatus\s+not-run/i },
  ];
  for (const item of required) {
    if (!item.pattern.test(text)) {
      addIssue(issues, "error", "phase4bb_identity_limitations", pathLabel, `Missing identity adapter limitation text: ${item.id}.`);
    }
  }
}

function validateRuntimeIntegrationScan(
  files: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of files) {
    for (const token of PHASE4BB_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(
          issues,
          "error",
          "phase4bb_runtime_leak",
          file.path,
          `Runtime/official-case integration target must not reference ${token}.`,
        );
      }
    }
    for (const token of LIVE_IDENTITY_ADAPTER_RUNTIME_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(
          issues,
          "error",
          "phase4bb_runtime_leak",
          file.path,
          `Runtime/official-case integration target must not import or evaluate live identity adapter token ${token}.`,
        );
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(
        issues,
        "error",
        "phase4bb_runtime_leak",
        file.path,
        "Runtime/official-case integration target must not enable production homogenization, production mechanics, or live runtime replacement.",
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
        "phase4bb_non_coverage",
        pathLabel,
        `${required.id} non-coverage wording is missing.`,
      );
    }
  }
  if (hasPositiveCoverageClaim(text)) {
    addIssue(
      issues,
      "error",
      "phase4bb_non_coverage",
      pathLabel,
      "RV/interdependence text must not imply coverage by this readiness audit.",
    );
  }
  if (
    !/future[^.]{0,180}TriSeg|TriSeg[^.]{0,180}future/i.test(text)
    || !/triseg-lite-compatible/i.test(text)
    || !/full-triseg-compatible/i.test(text)
    || !/full TriSeg/i.test(text)
    || !/before[^.]{0,180}claim/i.test(text)
  ) {
    addIssue(
      issues,
      "error",
      "phase4bb_future_triseg_path",
      pathLabel,
      "Future TriSeg path must preserve triseg-lite-compatible, full-triseg-compatible, and full TriSeg escalation before those mechanisms are claimed.",
    );
  }
}

function collectForbiddenClaimFieldViolations(
  value: unknown,
  prefix = "",
): readonly { path: string; value: unknown }[] {
  if (!isRecord(value) && !Array.isArray(value)) return [];
  const violations: { path: string; value: unknown }[] = [];
  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry] as const)
    : Object.entries(value);
  for (const [key, entry] of entries) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (isForbiddenClaimField(key, entry)) {
      violations.push({ path: nextPath, value: entry });
    }
    violations.push(...collectForbiddenClaimFieldViolations(entry, nextPath));
  }
  return violations;
}

function isForbiddenClaimField(key: string, value: unknown): boolean {
  if (
    ![
      "ownerAcceptance",
      "ownerAcceptanceStatus",
      "decision4Acceptance",
      "decision4Status",
      "productionHomogenization",
      "productionHomogenizationCompleted",
      "productionValidation",
      "officialMorphologyOutcome",
      "officialMorphologyPass",
      "morphologyPass",
      "liveRuntimeReplacement",
      "runtimeReplacement",
      "calciumCyclingAlternansValidation",
      "RVPressureOverloadCoverage",
      "septalBowingCoverage",
      "ventricularInterdependenceCoverage",
      "rightHeartFailureCoverage",
      "independentDataFit",
      "identifiabilityRankOutcome",
      "identifiabilityRankStatus",
    ].includes(key)
  ) {
    return false;
  }
  if (value === true) return true;
  if (typeof value !== "string") return false;
  if (
    key === "decision4Status" && value === "PENDING OWNER"
    || key === "ownerAcceptanceStatus" && value === "not-owner-acceptance"
    || key === "identifiabilityRankStatus" && (value === "not-run" || value === "not-claimed")
  ) {
    return false;
  }
  return !["not-claimed", "not-run", "not-owner-acceptance", "PENDING OWNER"].includes(value);
}

function isModelId(descriptor: JsonRecord, modelId: string): boolean {
  const modelIds = isRecord(descriptor.modelIds) ? descriptor.modelIds : {};
  return modelIds.homogenizationModelId === modelId;
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

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
      const before = normalized.slice(Math.max(0, match.index - 80), match.index);
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

function printReport(report: TissueHomogenizationReadinessValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 4B-B tissue homogenization readiness ${status} `
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
    "Usage: npm run verify:myocardium-tissue-homogenization-readiness -- [--root=DIR]",
    "",
    "Validates the Phase 4B-B tissue homogenization readiness audit gate.",
    "This verifier rejects Decision 4 acceptance, production homogenization claims, official morphology pass claims, live runtime replacement, identity adapter runtime/case wiring, missing Phase 3B/3C provenance, and missing TriSeg-boundary evidence.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateTissueHomogenizationReadiness(
    loadTissueHomogenizationReadinessValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
