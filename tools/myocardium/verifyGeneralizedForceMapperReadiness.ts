import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
} from "@/engine/myocardium/mechanics";
import {
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID,
  runGeneralizedForceMapperReadinessReport,
  type GeneralizedForceMapperReadinessReport,
} from "@/engine/myocardium/protocols/generalizedForceMapperReadiness";

export const GENERALIZED_FORCE_MAPPER_PHASE4C_B_DESCRIPTOR_PATH =
  "data/myocardium/protocols/generalized-force-mapper-phase4c-protocols.json";
export const PASSIVE_ENERGY_PHASE4C_A_DESCRIPTOR_PATH =
  "data/myocardium/protocols/passive-energy-phase4c-protocols.json";
export const GENERALIZED_FORCE_MAPPER_PHASE4C_B_MAPPER_SOURCE_PATH =
  "engine/myocardium/mechanics/virtualPowerGeneralizedForceV1.ts";
export const GENERALIZED_FORCE_MAPPER_PHASE4C_B_REPORT_SOURCE_PATH =
  "engine/myocardium/protocols/generalizedForceMapperReadiness.ts";

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

export type GeneralizedForceMapperReadinessValidationInput = {
  readonly descriptor: unknown;
  readonly phase4CADescriptor: unknown;
  readonly report: GeneralizedForceMapperReadinessReport;
  readonly candidateFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly docs: readonly TextFileInput[];
};

export type GeneralizedForceMapperReadinessValidationReport = {
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

const REQUIRED_OWNER_DECISION_IDS = [4, 5, 6, 8] as const;

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  "docs/myocardium/adr/ADR-MYO-001.md",
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json",
  "data/myocardium/protocols/identity-force-phase3b-protocols.json",
  "data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json",
  "data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json",
  "data/myocardium/protocols/passive-energy-phase4c-protocols.json",
] as const;

const REQUIRED_VERIFICATION_SCRIPTS = [
  "verify:myocardium-generalized-force-mapper-readiness",
  "verify:myocardium-passive-energy-readiness",
  "verify:myocardium-generalized-forces",
  "verify:myocardium-tissue-homogenization-readiness",
  "verify:myocardium-land-active-stress-replacement",
  "verify:myocardium-mechanics-selection",
  "verify:myocardium-mechanics-decision",
] as const;

const REQUIRED_PROTOCOL_IDS = [
  "source-decision-boundary-v1",
  "contribution-decomposition-v1",
  "multi-coordinate-virtual-power-closure-v1",
  "unit-pressure-map-boundary-v1",
  "prior-gate-read-only-evidence-v1",
  "noncoverage-triseg-boundary-v1",
  "deterministic-replay-v1",
] as const;

const REQUIRED_NON_COVERAGE = [
  { id: "official-morphology", field: "officialMorphologyOutcome", pattern: /official morphology/i },
  { id: "atrial-bridge-selection", field: "atrialBridgeSelection", pattern: /atrial bridge selection/i },
  { id: "rv-pressure-overload", field: "RVPressureOverloadCoverage", pattern: /RV pressure overload/i },
  { id: "septal-bowing", field: "septalBowingCoverage", pattern: /septal bowing/i },
  { id: "ventricular-interdependence", field: "ventricularInterdependenceCoverage", pattern: /ventricular interdependence/i },
  { id: "right-heart-failure", field: "rightHeartFailureCoverage", pattern: /right[- ]heart failure/i },
] as const;

const PHASE4CB_RUNTIME_REFERENCE_TOKENS = [
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_DESCRIPTOR_PATH,
  "generalized-force-mapper-phase4c",
  "generalizedForceMapperReadiness",
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY,
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS,
  VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
  "VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID",
  "VirtualPowerGeneralizedForceV1",
  "evaluateVirtualPowerGeneralizedForceV1",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useProductionMechanics|useProductionHomogenization|useProductionPassiveLaw|useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|enableMultiCoordinateGeneralizedForceMapper|generalizedForceMapperRuntimeEnabled|liveRuntimeReplacement)["']?\s*[:=]\s*true/i;

const POSITIVE_PASS_CLAIM_PATTERN =
  /\b(?:experimentalPass|tier[A-Z0-9]*Pass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass|production(?:Homogenization|Mechanics|PassiveLaw)?Pass|loaded(?:Afterload|Pressure)?Pass|chamber(?:Runtime|Integration)?Pass|valvePass|qDotPass|tbvProjectionPass|morphologyPass)\b/i;

const NON_COVERAGE_TOKEN_PATTERN =
  /not[-\s]claimed|not\s+claimed|not\s+covered|not\s+cover|not\s+selected|non[-\s]coverage|non[-\s]covered|without|no[^.!?。]{0,180}(?:coverage|selection|wiring|claim)|remains[^.!?。]{0,180}(?:future|pending)|before[^.!?。]{0,180}(?:claimed|covered|selected)|covered\s*では(?:ありません|なく|ない)|claim\s*しません/i;

const POSITIVE_COVERAGE_TOKEN_PATTERN =
  /\b(?:covered|coverage|claimed|validated|supported|selected|accepted|wired)\b|claim\s*します|covered\s*です/i;

const FORBIDDEN_NOT_CLAIMED_FIELDS = [
  "ownerAcceptance",
  "decision4Acceptance",
  "decision5Acceptance",
  "decision6Acceptance",
  "decision8Acceptance",
  "productionRuntimeAcceptance",
  "productionMechanics",
  "productionHomogenization",
  "productionPassiveLaw",
  "productionValidation",
  "officialMorphologyOutcome",
  "liveRuntimeReplacement",
  "runtimeSchemaStateLayoutChange",
  "ModelCoreChamberWiring",
  "officialCaseWiring",
  "workbenchWiring",
  "atrialBridgeSelection",
  "RVPressureOverloadCoverage",
  "septalBowingCoverage",
  "ventricularInterdependenceCoverage",
  "rightHeartFailureCoverage",
] as const;

const RUNTIME_INTEGRATION_TARGETS = [
  "caseCloud.ts",
  "caseDoc.ts",
  "casePersist.ts",
  "caseValidation.ts",
  "components/Cases.tsx",
  "components/workbench",
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
  "features/workbench",
  "officialCases.ts",
  "tools/verifyCases.ts",
  "data/cases",
  "public/cases",
] as const;

export function loadGeneralizedForceMapperReadinessValidationInput(
  rootDir = process.cwd(),
): GeneralizedForceMapperReadinessValidationInput {
  return {
    descriptor: readJson(path.join(rootDir, GENERALIZED_FORCE_MAPPER_PHASE4C_B_DESCRIPTOR_PATH)),
    phase4CADescriptor: readJson(path.join(rootDir, PASSIVE_ENERGY_PHASE4C_A_DESCRIPTOR_PATH)),
    report: runGeneralizedForceMapperReadinessReport(),
    candidateFiles: [
      readTextFile(rootDir, GENERALIZED_FORCE_MAPPER_PHASE4C_B_MAPPER_SOURCE_PATH),
      readTextFile(rootDir, GENERALIZED_FORCE_MAPPER_PHASE4C_B_REPORT_SOURCE_PATH),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    docs: [
      readTextFile(rootDir, "README.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
    ],
  };
}

export function validateGeneralizedForceMapperReadiness(
  input: GeneralizedForceMapperReadinessValidationInput,
): GeneralizedForceMapperReadinessValidationReport {
  const issues: ValidationIssue[] = [];

  validateReadinessReport(input.report, issues);
  validateDescriptor(input.descriptor, issues);
  validatePhase4CADescriptor(input.phase4CADescriptor, issues);
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
  report: GeneralizedForceMapperReadinessReport,
  issues: ValidationIssue[],
): void {
  if (report.protocolSetId !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID) {
    addIssue(issues, "error", "phase4cb_report_identity", "report.protocolSetId", "Unexpected Phase 4C-B report id.");
  }
  if (
    report.phase !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE
    || report.claimBoundary !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY
    || report.evidenceStatus !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS
  ) {
    addIssue(issues, "error", "phase4cb_report_boundary", "report.claimBoundary", "Report must remain a synthetic multi-coordinate virtual-power closure artifact only.");
  }
  if (
    report.ownerAcceptanceStatus !== "not-owner-acceptance"
    || report.decision4Status !== "PENDING OWNER"
    || report.decision5Status !== "PENDING OWNER"
    || report.decision6Status !== "PENDING OWNER"
    || report.decision8Status !== "PENDING OWNER"
    || report.decision19Status !== "ACCEPTED"
    || report.decision19ReuseStatus !== "accepted-owner-selection-read-only"
  ) {
    addIssue(issues, "error", "phase4cb_decision_boundary", "report.decision19Status", "Decisions 4, 5, 6, and 8 must remain PENDING OWNER; accepted Decision 19 owner selection must be reused read-only.");
  }
  if (report.productionMechanics !== "not-claimed") {
    addIssue(issues, "error", "phase4cb_report_boundary", "report.productionMechanics", "Report must not claim production mechanics.");
  }
  if (!report.readinessPass || report.readinessStatus !== "readiness-artifact-ready") {
    addIssue(issues, "error", "phase4cb_readiness_sections", "report.readinessPass", "Readiness report must pass all sections.");
  }
  if (report.sections.length !== REQUIRED_PROTOCOL_IDS.length) {
    addIssue(issues, "error", "phase4cb_readiness_sections", "report.sections", "Expected seven Phase 4C-B readiness sections.");
  }
  for (const id of REQUIRED_PROTOCOL_IDS) {
    const section = report.sections.find((candidate) => candidate.id === id);
    if (!section || section.status !== "readiness-pass") {
      addIssue(issues, "error", "phase4cb_readiness_sections", `report.sections.${id}`, `${id} did not pass.`);
    }
  }
  if (
    report.mapperEvidence.modelId !== VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID
    || report.mapperEvidence.maxVirtualPowerResidualAbsW > report.mapperEvidence.virtualPowerResidualToleranceW
    || !report.mapperEvidence.directionalClosure.pass
    || !report.mapperEvidence.contributionDecompositionPass
    || !report.mapperEvidence.zeroDerivativeExactZero
    || !report.mapperEvidence.pressureMapVolumeOnly
    || !report.mapperEvidence.multiCoordinateExplicitRatesCovered
    || !report.mapperEvidence.singleCoordinateDerivedRateCovered
  ) {
    addIssue(issues, "error", "phase4cb_mapper_evidence", "report.mapperEvidence", "Mapper evidence must cover contribution sums, explicit multi-coordinate rates, single-coordinate derived rate, zero derivative exact zero, pressure units, and virtual-power closure.");
  }
  if (
    !report.priorGateEvidence.phase3BClosurePass
    || !report.priorGateEvidence.phase4BAReadinessPass
    || !report.priorGateEvidence.phase4BBReadinessPass
    || !report.priorGateEvidence.phase4CAReadinessPass
    || !report.priorGateEvidence.phase3BStableSummaryHash
    || !report.priorGateEvidence.phase4BAStableSummaryHash
    || !report.priorGateEvidence.phase4BBStableSummaryHash
    || !report.priorGateEvidence.phase4CAStableSummaryHash
    || report.priorGateEvidence.phase4CAEnableMultiCoordinateGeneralizedForceMapper !== false
    || report.priorGateEvidence.decision19OwnerSelectionAccepted !== true
    || report.priorGateEvidence.decision19SelectedCandidateId !== "thick-sphere-v2-explicit-external-septal-coupling"
    || report.priorGateEvidence.decision19SelectedBackend !== "thick-sphere-v2"
  ) {
    addIssue(issues, "error", "phase4cb_prior_gate_evidence", "report.priorGateEvidence", "Phase 3B, Phase 4B-A, Phase 4B-B, and Phase 4C-A evidence must remain passing and hash-backed; 4C-A multi-coordinate mapper enabling must remain false; accepted Decision 19 owner selection must be reused read-only.");
  }
  validateRequiredScripts(report.requiredVerificationScripts, "report.requiredVerificationScripts", issues);
}

function validateDescriptor(descriptor: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(descriptor)) {
    addIssue(issues, "error", "phase4cb_descriptor_shape", "descriptor", "Descriptor must be an object.");
    return;
  }
  if (
    descriptor.protocolSetId !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID
    || descriptor.phase !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE
    || descriptor.claimBoundary !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY
    || descriptor.statusBoundary !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY
    || descriptor.evidenceStatus !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS
  ) {
    addIssue(issues, "error", "phase4cb_descriptor_boundary", "descriptor.claimBoundary", "Descriptor must remain the Phase 4C-B mapper readiness artifact boundary.");
  }
  if (
    descriptor.ownerAcceptanceStatus !== "not-owner-acceptance"
    || descriptor.decision4Status !== "PENDING OWNER"
    || descriptor.decision5Status !== "PENDING OWNER"
    || descriptor.decision6Status !== "PENDING OWNER"
    || descriptor.decision8Status !== "PENDING OWNER"
    || descriptor.decision19Status !== "ACCEPTED"
    || descriptor.decision19ReuseStatus !== "accepted-owner-selection-read-only"
  ) {
    addIssue(issues, "error", "phase4cb_decision_boundary", "descriptor.decision19Status", "Descriptor must leave Decisions 4, 5, 6, and 8 PENDING OWNER and reuse accepted Decision 19 read-only.");
  }
  validatePendingOwnerDecisions(descriptor.pendingOwnerDecisions, issues);
  validateAcceptedOwnerDecisionEvidence(descriptor.acceptedOwnerDecisionEvidence, issues);
  validateDirectSourceDocuments(descriptor.sourceDocuments, issues);
  validateDescriptorMapperCandidate(descriptor.mapperCandidate, descriptor.modelIds, issues);
  validateProtocolSettings(descriptor.protocolSettings, issues);
  validateRequiredScripts(readonlyStrings(descriptor.requiredVerificationScripts), "descriptor.requiredVerificationScripts", issues);
  validateProtocolIds(descriptor.protocols, issues);
}

function validatePhase4CADescriptor(
  descriptor: unknown,
  issues: ValidationIssue[],
): void {
  const settings = isRecord(descriptor) && isRecord(descriptor.protocolSettings)
    ? descriptor.protocolSettings
    : {};
  const claimExclusions = isRecord(descriptor) && isRecord(descriptor.claimExclusions)
    ? descriptor.claimExclusions
    : {};
  if (
    !isRecord(descriptor)
    || descriptor.protocolSetId !== "passive-energy-phase4c-protocols-v1"
    || settings.enableMultiCoordinateGeneralizedForceMapper !== false
    || claimExclusions.multiCoordinateGeneralizedForceMapper !== "not-claimed"
  ) {
    addIssue(
      issues,
      "error",
      "phase4ca_descriptor_boundary",
      "phase4CADescriptor.protocolSettings.enableMultiCoordinateGeneralizedForceMapper",
      "Phase 4C-A descriptor must remain unchanged with enableMultiCoordinateGeneralizedForceMapper=false and no mapper claim.",
    );
  }
}

function validatePendingOwnerDecisions(value: unknown, issues: ValidationIssue[]): void {
  const decisions = records(value);
  for (const decisionId of REQUIRED_OWNER_DECISION_IDS) {
    const decision = decisions.find((candidate) => candidate.decisionId === decisionId);
    if (decision?.status !== "PENDING OWNER") {
      addIssue(
        issues,
        "error",
        "phase4cb_decision_boundary",
        `descriptor.pendingOwnerDecisions.${decisionId}`,
        `Decision ${decisionId} must remain PENDING OWNER.`,
      );
    }
  }
}

function validateAcceptedOwnerDecisionEvidence(value: unknown, issues: ValidationIssue[]): void {
  const decisions = records(value);
  const decision19 = decisions.find((candidate) => candidate.decisionId === 19);
  if (
    decision19?.status !== "ACCEPTED"
    || decision19?.selectedCandidateId !== "thick-sphere-v2-explicit-external-septal-coupling"
    || decision19?.selectedBackend !== "thick-sphere-v2"
    || decision19?.reusePolicy !== "read-only"
    || decision19?.sourcePath !== "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json"
  ) {
    addIssue(
      issues,
      "error",
      "phase4cb_decision19_reuse",
      "descriptor.acceptedOwnerDecisionEvidence.19",
      "Descriptor must reuse the accepted Decision 19 owner-selection artifact read-only.",
    );
  }
}

function validateDirectSourceDocuments(value: unknown, issues: ValidationIssue[]): void {
  const sourcePaths = records(value).map((source) => stringField(source, "path")).filter(Boolean);
  for (const requiredPath of REQUIRED_DESCRIPTOR_SOURCE_PATHS) {
    if (!sourcePaths.includes(requiredPath)) {
      addIssue(
        issues,
        "error",
        "phase4cb_direct_provenance",
        "descriptor.sourceDocuments",
        `Descriptor must directly reference ${requiredPath}.`,
      );
    }
  }
}

function validateDescriptorMapperCandidate(
  mapperCandidate: unknown,
  modelIds: unknown,
  issues: ValidationIssue[],
): void {
  const candidate = isRecord(mapperCandidate) ? mapperCandidate : {};
  const ids = isRecord(modelIds) ? modelIds : {};
  const inputExtension = isRecord(candidate.inputExtension) ? candidate.inputExtension : {};
  if (
    ids.generalizedForceModelId !== VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID
    || candidate.modelId !== VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID
    || candidate.claim !== GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS
    || typeof inputExtension.coordinateRatesSI !== "string"
    || typeof inputExtension.coordinateUnitsById !== "string"
  ) {
    addIssue(issues, "error", "phase4cb_mapper_candidate", "descriptor.mapperCandidate", "Descriptor mapper candidate must identify virtual-power-generalized-force-v1 and the local input extension.");
  }
}

function validateProtocolSettings(value: unknown, issues: ValidationIssue[]): void {
  const settings = isRecord(value) ? value : {};
  const falseFields = [
    "useProductionMechanics",
    "useProductionHomogenization",
    "usePassiveLawAcceptance",
    "useProductionPassiveLaw",
    "useRuntimeReplacement",
    "useModelCoreRuntimeWiring",
    "useChamberRuntimeWiring",
    "useStateSchemaWiring",
    "useOfficialCaseWiring",
    "useWorkbenchRuntimeWiring",
    "useOfficialMorphologyAcceptance",
    "useAtrialBridgeSelection",
    "enableMultiCoordinateGeneralizedForceMapper",
  ] as const;
  for (const field of falseFields) {
    if (settings[field] !== false) {
      addIssue(issues, "error", "phase4cb_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain false.`);
    }
  }
  if (settings.evaluateSyntheticMapperReadiness !== true) {
    addIssue(issues, "error", "phase4cb_protocol_settings", "descriptor.protocolSettings.evaluateSyntheticMapperReadiness", "Synthetic mapper readiness evaluation must be explicitly true.");
  }
  for (const field of ["phase3BReusePolicy", "phase4BAReusePolicy", "phase4BBReusePolicy", "phase4CAReusePolicy"] as const) {
    if (settings[field] !== "read-only") {
      addIssue(issues, "error", "phase4cb_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain read-only.`);
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
      addIssue(issues, "error", "phase4cb_required_scripts", issuePath, `Missing required verifier ${requiredScript}.`);
    }
  }
}

function validateProtocolIds(value: unknown, issues: ValidationIssue[]): void {
  const protocolIds = records(value).map((protocol) => stringField(protocol, "id"));
  for (const requiredId of REQUIRED_PROTOCOL_IDS) {
    if (!protocolIds.includes(requiredId)) {
      addIssue(issues, "error", "phase4cb_readiness_sections", "descriptor.protocols", `Descriptor protocol list must include ${requiredId}.`);
    }
  }
}

function validateCandidateSourceFiles(
  candidateFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  const mapper = candidateFiles.find(
    (file) => file.path === GENERALIZED_FORCE_MAPPER_PHASE4C_B_MAPPER_SOURCE_PATH,
  );
  if (!mapper) {
    addIssue(issues, "error", "phase4cb_mapper_source", GENERALIZED_FORCE_MAPPER_PHASE4C_B_MAPPER_SOURCE_PATH, "Mapper source file is missing from validation input.");
    return;
  }
  if (/myofilament\/land2017/.test(mapper.text)) {
    addIssue(issues, "error", "phase4cb_mapper_isolation", mapper.path, "Generalized-force mapper must not import Land implementation files.");
  }
  if (
    /kinematics\/(?!contracts\b)/.test(mapper.text)
    || /(?:ThickSphere|thickSphere|TriSeg|triseg|KinematicsModel)/.test(mapper.text)
  ) {
    addIssue(issues, "error", "phase4cb_mapper_isolation", mapper.path, "Generalized-force mapper must not import concrete kinematics engines.");
  }
  if (!mapper.text.includes("coordinateRatesSI") || !mapper.text.includes("coordinateUnitsById")) {
    addIssue(issues, "error", "phase4cb_mapper_source", mapper.path, "Mapper source must define the Phase 4C-B local input extension.");
  }
}

function validateForbiddenClaims(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (POSITIVE_PASS_CLAIM_PATTERN.test(text)) {
    addIssue(
      issues,
      "error",
      "phase4cb_positive_pass_claim",
      label,
      "Phase 4C-B must not add target, acceptance, validation, fit, morphology, production, chamber, valve, qDot, or TBV pass claims.",
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
    if (key === "ownerAcceptanceStatus" && nestedValue !== "not-owner-acceptance") {
      addIssue(issues, "error", "phase4cb_forbidden_claim", issuePath, "Owner acceptance must not be claimed in Phase 4C-B.");
    }
    if (
      (key === "decision4Status"
        || key === "decision5Status"
        || key === "decision6Status"
        || key === "decision8Status")
      && nestedValue !== "PENDING OWNER"
    ) {
      addIssue(issues, "error", "phase4cb_forbidden_claim", issuePath, `${key} must remain PENDING OWNER.`);
    }
    if (key === "decision19Status" && nestedValue !== "ACCEPTED") {
      addIssue(issues, "error", "phase4cb_forbidden_claim", issuePath, "decision19Status must remain ACCEPTED from the owner-selection artifact.");
    }
    if (
      FORBIDDEN_NOT_CLAIMED_FIELDS.includes(key as typeof FORBIDDEN_NOT_CLAIMED_FIELDS[number])
      && nestedValue !== "not-claimed"
    ) {
      addIssue(issues, "error", "phase4cb_forbidden_claim", issuePath, `${key} must remain not-claimed.`);
    }
    scanForbiddenClaimFields(label, nestedValue, issues, issuePath);
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of PHASE4CB_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(
          issues,
          "error",
          "phase4cb_runtime_leak",
          file.path,
          `Runtime/official-case integration file must not reference Phase 4C-B mapper token ${token}.`,
        );
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(
        issues,
        "error",
        "phase4cb_runtime_leak",
        file.path,
        "Runtime/official-case integration file must not enable production mechanics, passive law, live runtime replacement, or generalized-force mapper wiring.",
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
        "phase4cb_non_coverage",
        label,
        `Missing non-coverage statement for ${required.id}.`,
      );
    }
    for (const window of windows) {
      if (
        POSITIVE_COVERAGE_TOKEN_PATTERN.test(window)
        && !NON_COVERAGE_TOKEN_PATTERN.test(window)
        && phase4CBWindowContext(window)
      ) {
        addIssue(
          issues,
          "error",
          "phase4cb_coverage_overclaim",
          label,
          `Coverage/selection overclaim detected for ${required.id}.`,
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
      "phase4cb_future_triseg_path",
      label,
      "Missing future TriSeg escalation path.",
    );
  }
}

function phase4CBWindowContext(window: string): boolean {
  return /Phase 4C-B|4C-B|this gate|this Phase 4C-B|generalized-force mapper readiness/i.test(window);
}

function validateDocs(file: TextFileInput, issues: ValidationIssue[]): void {
  if (
    !file.text.includes("verify:myocardium-generalized-force-mapper-readiness")
  ) {
    addIssue(
      issues,
      "error",
      "phase4cb_docs_mention",
      file.path,
      "Docs must mention the Phase 4C-B generalized-force mapper readiness verifier.",
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
    windows.push(text.slice(Math.max(0, index - 160), Math.min(text.length, index + 300)));
  }
  return windows;
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

function printReport(report: GeneralizedForceMapperReadinessValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 4C-B generalized-force mapper readiness ${status} `
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
    "Usage: npm run verify:myocardium-generalized-force-mapper-readiness -- [--root=DIR]",
    "",
    "Validates the Phase 4C-B generalized-force mapper readiness artifact gate.",
    "This verifier rejects Decision 4/5/6/8 acceptance, missing read-only accepted Decision 19 owner-selection reuse, production mechanics/passive-law/runtime claims, official morphology or atrial bridge selection claims, missing prior pass/hash evidence, missing 4C-A mapper-disabled evidence, missing non-coverage/TriSeg boundaries, runtime/case/workbench leaks, and concrete kinematics or Land implementation imports from the mapper.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateGeneralizedForceMapperReadiness(
    loadGeneralizedForceMapperReadinessValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
