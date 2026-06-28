import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const PHASE5C_F_TRIAGE_AUDIT_PATH =
  "data/myocardium/gates/phase5c-positive-control-triage-audit-v1.json";
export const PHASE5C_E_ENTRY_GATE_PATH =
  "data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json";
export const PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH =
  "data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-fidelity-audit-v1.json";
export const PHASE5C_F_TRIAGE_AUDIT_PLAN_PATH =
  "docs/myocardium/roadmap/phase5c-positive-control-triage-audit.md";
const PHASE5C_F_TRIAGE_AUDIT_VERIFIER_PATH =
  "tools/myocardium/verifyPhase5CPositiveControlTriageAudit.ts";
const PHASE5C_F_TRIAGE_AUDIT_TEST_PATH =
  "__tests__/myocardiumPhase5CPositiveControlTriageAudit.test.ts";
const PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH =
  "data/myocardium/gates/phase5c-same-closure-source-provider-audit-v1.json";
const PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH =
  "docs/myocardium/roadmap/phase5c-same-closure-source-provider-audit.md";
const PHASE5C_G_SOURCE_PROVIDER_AUDIT_VERIFIER_PATH =
  "tools/myocardium/verifyPhase5CSameClosureSourceProviderAudit.ts";
const PHASE5C_G_SOURCE_PROVIDER_AUDIT_TEST_PATH =
  "__tests__/myocardiumPhase5CSameClosureSourceProviderAudit.test.ts";

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

export type Phase5CPositiveControlTriageAuditValidationInput = {
  readonly triageGate: unknown;
  readonly entryGate: unknown;
  readonly fidelityAuditEvidence: unknown;
  readonly sourceFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly changedFilePaths: readonly string[];
};

export type Phase5CPositiveControlTriageAuditValidationReport = {
  readonly pass: boolean;
  readonly triageStatus: string;
  readonly diagnosticLaneIds: readonly string[];
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly sourceFileCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly changedFileCount: number;
    readonly diagnosticLaneCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const EXPECTED_TRIAGE_GATE_ID = "phase5c-positive-control-triage-audit-v1";
const EXPECTED_ENTRY_GATE_ID = "phase5c-post-fidelity-entry-gate-v1";
const EXPECTED_AUDIT_ID = "land-new-myocardium-low-preload-phase5c-fidelity-audit-v1";
const EXPECTED_VERIFIER_SCRIPT = "verify:myocardium-phase5c-positive-control-triage-audit";
const ENTRY_GATE_VERIFIER_SCRIPT = "verify:myocardium-phase5c-post-fidelity-entry-gate";
const SOURCE_AUDIT_VERIFIER_SCRIPT = "verify:myocardium-land-new-myocardium-low-preload-check";

const INHERITED_NO_GO_KEYS = [
  "gateStatus",
  "legacyPositiveControlStatus",
  "positiveControlBranchStatus",
  "positiveControlObservedPeriodBeats",
  "artifactGateExpectedPass",
  "landRunInterpretation",
  "sameProtocolSecondOrderAdvancementStatus",
  "finalNoAlternansClaim",
  "replacementCriterionStatus",
] as const;

const BLOCKED_CLAIM_KEYS = [
  "sameClosurePeriod2RouteSatisfied",
  "ownerApprovedReplacementCriterionPresent",
  "artifactGateExpectedPass",
  "newMyocardiumCheckRequiredSatisfied",
  "landRunInterpretation",
  "sameProtocolSecondOrderAdvancementStatus",
  "finalNoAlternansClaim",
] as const;

const NON_GOAL_KEYS = [
  "runtimeReplacement",
  "modelCoreRuntimeWiring",
  "chamberRuntimeWiring",
  "caseRuntimeWiring",
  "stateSchemaWiring",
  "officialCaseWiring",
  "workbenchRuntimeWiring",
  "qDotTuning",
  "valveThresholdTuning",
  "arterialLoadTuning",
  "preloadAfterloadClosureTuning",
  "landParameterTuning",
  "officialMorphologyAcceptance",
  "robustNoAlternansAcceptance",
  "calciumCyclingAlternansValidation",
  "rvPressureOverloadCoverage",
  "ventricularInterdependenceCoverage",
  "rightHeartFailureCoverage",
  "triSegAdoption",
] as const;

const REQUIRED_OWNER_PROVENANCE_FIELDS = [
  "acceptedBy",
  "acceptedAt",
  "acceptedSourceType",
  "acceptedSourceRef",
  "acceptedSourceText",
] as const;

const REQUIRED_CRITERION_FIELDS = [
  "criterionId",
  "supersedesCriterionId",
  "replacementAcceptanceCriterion",
  "decisionBoundary",
] as const;

const REQUIRED_SOURCE_TOKENS = [
  EXPECTED_TRIAGE_GATE_ID,
  EXPECTED_ENTRY_GATE_ID,
  EXPECTED_AUDIT_ID,
  "same-closure-source-provider-audit",
  "closure-event-surface-diagnostic",
  "owner-replacement-criterion-prep",
  "blocked-until-positive-control-period2",
] as const;

const REQUIRED_DOCUMENT_BOUNDARY_TOKENS = [
  "no runtime replacement",
  "no qDot/valve/afterload tuning",
  "no official morphology acceptance",
  "no final no-alternans",
  "no RV pressure-overload coverage",
  "no ventricular interdependence coverage",
  "no right-heart failure coverage",
  "no TriSeg adoption",
] as const;

const ALLOWED_CHANGED_FILE_PATHS = [
  PHASE5C_F_TRIAGE_AUDIT_PATH,
  PHASE5C_F_TRIAGE_AUDIT_PLAN_PATH,
  PHASE5C_F_TRIAGE_AUDIT_VERIFIER_PATH,
  PHASE5C_F_TRIAGE_AUDIT_TEST_PATH,
  PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH,
  PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH,
  PHASE5C_G_SOURCE_PROVIDER_AUDIT_VERIFIER_PATH,
  PHASE5C_G_SOURCE_PROVIDER_AUDIT_TEST_PATH,
  "docs/myocardium/README.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  "package.json",
] as const;

const PHASE5C_F_CHANGED_FILE_SCOPE_TRIGGER_PATHS = [
  PHASE5C_F_TRIAGE_AUDIT_PATH,
  PHASE5C_F_TRIAGE_AUDIT_PLAN_PATH,
  PHASE5C_F_TRIAGE_AUDIT_VERIFIER_PATH,
  PHASE5C_F_TRIAGE_AUDIT_TEST_PATH,
] as const;

const RUNTIME_INTEGRATION_TARGETS = [
  "WorkbenchPage.tsx",
  "caseCloud.ts",
  "caseDoc.ts",
  "casePersist.ts",
  "caseValidation.ts",
  "components/Cases.tsx",
  "components/workbench",
  "constants.ts",
  "controllerCatalog.ts",
  "controllerItems.ts",
  "engine/ModelCore.ts",
  "engine/caseBaselines.ts",
  "engine/caseResolve.ts",
  "engine/chambers.ts",
  "engine/core/params.ts",
  "engine/guytonStarlingChainWorker.ts",
  "engine/guytonStarlingChainWorkerCore.ts",
  "engine/guytonStarlingChainProtocol.ts",
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/harness.ts",
  "engine/previewController.ts",
  "engine/previewWorker.ts",
  "engine/previewWorkerProtocol.ts",
  "engine/presets.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "engine/steadyJob.ts",
  "engine/transitionSteadyProtocol.ts",
  "engine/transitionSteadyWorker.ts",
  "engine/core/stateLayout.ts",
  "engine/myocardium",
  "features/workbench",
  "officialCases.ts",
  "tools/verifyCases.ts",
  "workbenchLoad.ts",
  "data/cases",
  "public/cases",
] as const;

const RUNTIME_REFERENCE_TOKENS = [
  EXPECTED_TRIAGE_GATE_ID,
  EXPECTED_VERIFIER_SCRIPT,
  "Phase 5C-F",
  "positive-control-triage-audit",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useCaseRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|useOfficialMorphologyAcceptance|useRobustNoAlternansAcceptance|useCalciumCyclingAlternansValidation|implementSeptalCoordinate|implementBiventricularCoupling|validateSeptalCoupling|validateRVPressureOverload|validateVentricularInterdependence|validateRightHeartFailure|adoptTriSeg|phase5Completed|runtimeReplacement|officialMorphologyPass|robustNoAlternans|finalNoAlternans)["']?\s*[:=]\s*true/i;

const FORBIDDEN_PROSE_OBJECTS = [
  "runtime replacement",
  "ModelCore",
  "chamber",
  "case",
  "workbench",
  "state-schema",
  "qDot",
  "valve",
  "afterload",
  "tuning",
  "official morphology",
  "morphology acceptance",
  "final no-alternans",
  "robust no-alternans",
  "calcium-cycling alternans",
  "RV pressure-overload",
  "ventricular interdependence",
  "right-heart failure",
  "TriSeg",
  "same-closure-period2-positive-control",
  "owner-approved-replacement-criterion",
  "owner approval",
  "owner-approved",
  "replacement criterion",
] as const;

const AFFIRMATIVE_BOUNDARY_PATTERN =
  /\b(?:accepts?|accepted|adopts?|adopted|allows?|allowed|approves?|approved|authorizes?|authorized|claims?|claimed|completes?|completed|covers?|covered|enables?|enabled|implements?|implemented|permits?|permitted|proves?|proved|ready|replaces?|replaced|satisfies|satisfied|tunes?|tuned|validates?|validated|wires?|wired|can|may|must|should|will|in scope)\b/i;
const SELF_AUTHORIZATION_PATTERN =
  /\b(?:approved|accepted|authorized)\s+by\s+this\s+gate\b/i;

export function loadPhase5CPositiveControlTriageAuditValidationInput(
  rootDir = process.cwd(),
): Phase5CPositiveControlTriageAuditValidationInput {
  return {
    triageGate: readJson(path.join(rootDir, PHASE5C_F_TRIAGE_AUDIT_PATH)),
    entryGate: readJson(path.join(rootDir, PHASE5C_E_ENTRY_GATE_PATH)),
    fidelityAuditEvidence: readJson(path.join(rootDir, PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH)),
    sourceFiles: [
      readTextFile(rootDir, PHASE5C_F_TRIAGE_AUDIT_PATH),
      readTextFile(rootDir, PHASE5C_E_ENTRY_GATE_PATH),
      readTextFile(rootDir, PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH),
      readTextFile(rootDir, PHASE5C_F_TRIAGE_AUDIT_PLAN_PATH),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    changedFilePaths: loadChangedFilePaths(rootDir),
  };
}

export function validatePhase5CPositiveControlTriageAudit(
  input: Phase5CPositiveControlTriageAuditValidationInput,
): Phase5CPositiveControlTriageAuditValidationReport {
  const issues: ValidationIssue[] = [];

  validateTriageGate(input.triageGate, input.entryGate, input.fidelityAuditEvidence, issues);
  validateSourceFiles(input.sourceFiles, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  validateChangedFileScope(input.changedFilePaths, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const triageGate = isRecord(input.triageGate) ? input.triageGate : {};
  const lanes = Array.isArray(triageGate.diagnosticLanes) ? triageGate.diagnosticLanes : [];
  return {
    pass: errors.length === 0,
    triageStatus: typeof triageGate.triageStatus === "string" ? triageGate.triageStatus : "unknown",
    diagnosticLaneIds: lanes.flatMap((lane) =>
      isRecord(lane) && typeof lane.laneId === "string" ? [lane.laneId] : []
    ),
    errors,
    warnings,
    summary: {
      sourceFileCount: input.sourceFiles.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      changedFileCount: input.changedFilePaths.length,
      diagnosticLaneCount: lanes.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateTriageGate(
  triageGate: unknown,
  entryGate: unknown,
  fidelityAuditEvidence: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(triageGate)) {
    addIssue(issues, "error", "phase5c_f_triage_shape", PHASE5C_F_TRIAGE_AUDIT_PATH, "Phase 5C-F triage audit gate must be an object.");
    return;
  }
  if (!isRecord(entryGate) || !isRecord(fidelityAuditEvidence)) {
    addIssue(issues, "error", "phase5c_f_source_shape", "sourceArtifacts", "Phase 5C-F triage audit must read the Phase 5C-E entry gate and Phase 5C-D fidelity audit evidence.");
    return;
  }
  validateExactKeys(
    triageGate,
    [
      "schemaVersion",
      "gateId",
      "phase",
      "kind",
      "sourceEntryGatePath",
      "sourceEntryGateId",
      "sourceAuditEvidencePath",
      "sourceAuditEvidenceId",
      "triageStatus",
      "inheritedNoGo",
      "diagnosticLanes",
      "blockedClaims",
      "nonGoals",
      "requiredVerificationScripts",
    ],
    PHASE5C_F_TRIAGE_AUDIT_PATH,
    issues,
  );
  if (
    triageGate.schemaVersion !== 1
    || triageGate.gateId !== EXPECTED_TRIAGE_GATE_ID
    || triageGate.phase !== "Phase 5C-F"
    || triageGate.kind !== "positive-control-triage-audit"
    || triageGate.sourceEntryGatePath !== PHASE5C_E_ENTRY_GATE_PATH
    || triageGate.sourceEntryGateId !== EXPECTED_ENTRY_GATE_ID
    || triageGate.sourceAuditEvidencePath !== PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH
    || triageGate.sourceAuditEvidenceId !== EXPECTED_AUDIT_ID
    || triageGate.triageStatus !== "triage-audit-only-entry-still-blocked"
    || entryGate.gateId !== EXPECTED_ENTRY_GATE_ID
    || fidelityAuditEvidence.id !== EXPECTED_AUDIT_ID
  ) {
    addIssue(issues, "error", "phase5c_f_triage_identity", PHASE5C_F_TRIAGE_AUDIT_PATH, "Phase 5C-F triage identity and source artifact pins must remain fixed.");
  }
  validateInheritedNoGo(triageGate.inheritedNoGo, entryGate, fidelityAuditEvidence, issues);
  validateDiagnosticLanes(triageGate.diagnosticLanes, issues);
  validateBlockedClaims(triageGate.blockedClaims, issues);
  validateNonGoals(triageGate.nonGoals, issues);
  validateRequiredScripts(triageGate.requiredVerificationScripts, issues);
}

function validateInheritedNoGo(
  inheritedNoGo: unknown,
  entryGate: JsonRecord,
  fidelityAuditEvidence: JsonRecord,
  issues: ValidationIssue[],
): void {
  if (!isRecord(inheritedNoGo)) {
    addIssue(issues, "error", "phase5c_f_inherited_no_go", "triageGate.inheritedNoGo", "inheritedNoGo must be an object.");
    return;
  }
  validateExactKeys(inheritedNoGo, INHERITED_NO_GO_KEYS, "triageGate.inheritedNoGo", issues);
  const entryNoGo = isRecord(entryGate.currentNoGo) ? entryGate.currentNoGo : {};
  const auditOutcome = isRecord(fidelityAuditEvidence.auditOutcome) ? fidelityAuditEvidence.auditOutcome : {};
  if (
    inheritedNoGo.gateStatus !== entryGate.gateStatus
    || inheritedNoGo.gateStatus !== "entry-blocked-until-route-satisfied"
    || inheritedNoGo.legacyPositiveControlStatus !== entryNoGo.legacyPositiveControlStatus
    || inheritedNoGo.legacyPositiveControlStatus !== auditOutcome.legacyPositiveControlStatus
    || inheritedNoGo.positiveControlBranchStatus !== "settled-period-1"
    || inheritedNoGo.positiveControlBranchStatus !== entryNoGo.positiveControlBranchStatus
    || inheritedNoGo.positiveControlObservedPeriodBeats !== 1
    || inheritedNoGo.positiveControlObservedPeriodBeats !== entryNoGo.positiveControlObservedPeriodBeats
    || inheritedNoGo.artifactGateExpectedPass !== false
    || inheritedNoGo.artifactGateExpectedPass !== entryNoGo.artifactGateExpectedPass
    || inheritedNoGo.landRunInterpretation !== "not-interpretable-positive-control-failed"
    || inheritedNoGo.landRunInterpretation !== entryNoGo.landRunInterpretation
    || inheritedNoGo.sameProtocolSecondOrderAdvancementStatus !== "blocked-until-positive-control-period2"
    || inheritedNoGo.sameProtocolSecondOrderAdvancementStatus !== entryNoGo.sameProtocolSecondOrderAdvancementStatus
    || inheritedNoGo.finalNoAlternansClaim !== "not-claimed"
    || inheritedNoGo.finalNoAlternansClaim !== entryNoGo.finalNoAlternansClaim
    || inheritedNoGo.replacementCriterionStatus !== "owner-approved-replacement-required"
    || inheritedNoGo.replacementCriterionStatus !== entryNoGo.replacementCriterionStatus
  ) {
    addIssue(issues, "error", "phase5c_f_inherited_no_go", "triageGate.inheritedNoGo", "Phase 5C-F must inherit the Phase 5C-D/E no-go and blocked entry state without strengthening claims.");
  }
}

function validateDiagnosticLanes(
  diagnosticLanes: unknown,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(diagnosticLanes) || diagnosticLanes.length !== 3) {
    addIssue(issues, "error", "phase5c_f_diagnostic_lanes", "triageGate.diagnosticLanes", "Exactly three diagnostic lanes are allowed.");
    return;
  }
  const sourceProviderLane = findLane(diagnosticLanes, "same-closure-source-provider-audit");
  const eventSurfaceLane = findLane(diagnosticLanes, "closure-event-surface-diagnostic");
  const ownerPrepLane = findLane(diagnosticLanes, "owner-replacement-criterion-prep");
  if (!sourceProviderLane || !eventSurfaceLane || !ownerPrepLane) {
    addIssue(issues, "error", "phase5c_f_diagnostic_lanes", "triageGate.diagnosticLanes", "Required diagnostic lanes are missing.");
    return;
  }
  validateSourceProviderLane(sourceProviderLane, issues);
  validateEventSurfaceLane(eventSurfaceLane, issues);
  validateOwnerPrepLane(ownerPrepLane, issues);
}

function validateSourceProviderLane(lane: JsonRecord, issues: ValidationIssue[]): void {
  validateExactKeys(
    lane,
    ["laneId", "status", "purpose", "allowedActions", "mustPreserve", "doesNotSatisfyEntryRoute"],
    "diagnosticLanes.same-closure-source-provider-audit",
    issues,
  );
  const mustPreserve = isRecord(lane.mustPreserve) ? lane.mustPreserve : {};
  validateExactKeys(
    mustPreserve,
    [
      "usesSameClosureAsLandRun",
      "sourceProviderDifferenceOnly",
      "closureEquivalenceToModelCore",
      "artifactGateExpectedPass",
      "sameProtocolSecondOrderAdvancementStatus",
    ],
    "diagnosticLanes.same-closure-source-provider-audit.mustPreserve",
    issues,
  );
  if (
    lane.status !== "planned-report-only"
    || !arrayEquals(lane.allowedActions, [
      "compare source-provider provenance",
      "compare generated trajectory health",
      "compare branch-window metrics",
      "compare same-closure hashes",
      "compare event-surface summaries",
    ])
    || mustPreserve.usesSameClosureAsLandRun !== true
    || mustPreserve.sourceProviderDifferenceOnly !== true
    || mustPreserve.closureEquivalenceToModelCore !== "not-claimed"
    || mustPreserve.artifactGateExpectedPass !== false
    || mustPreserve.sameProtocolSecondOrderAdvancementStatus !== "blocked-until-positive-control-period2"
    || lane.doesNotSatisfyEntryRoute !== true
  ) {
    addIssue(issues, "error", "phase5c_f_source_provider_lane", "diagnosticLanes.same-closure-source-provider-audit", "Same-closure source-provider lane must remain report-only and must not satisfy the entry route.");
  }
}

function validateEventSurfaceLane(lane: JsonRecord, issues: ValidationIssue[]): void {
  validateExactKeys(
    lane,
    ["laneId", "status", "purpose", "diagnosticAxes", "forbiddenActions", "allowedOutput", "doesNotSatisfyEntryRoute"],
    "diagnosticLanes.closure-event-surface-diagnostic",
    issues,
  );
  if (
    lane.status !== "diagnostic-only-not-tuning"
    || !arrayEquals(lane.diagnosticAxes, ["qDot", "valveThresholds", "arterialLoad", "preloadAfterloadClosure", "LandParameters"])
    || !arrayEquals(lane.forbiddenActions, [
      "qDot tuning",
      "valve threshold tuning",
      "arterial-load tuning",
      "preload/afterload closure tuning",
      "Land parameter tuning",
    ])
    || lane.allowedOutput !== "hypothesis-report-only"
    || lane.doesNotSatisfyEntryRoute !== true
  ) {
    addIssue(issues, "error", "phase5c_f_event_surface_lane", "diagnosticLanes.closure-event-surface-diagnostic", "Event-surface lane must keep qDot/valve/afterload/Land parameters as diagnostic axes only and forbid tuning.");
  }
}

function validateOwnerPrepLane(lane: JsonRecord, issues: ValidationIssue[]): void {
  validateExactKeys(
    lane,
    [
      "laneId",
      "status",
      "purpose",
      "requiredOwnerProvenanceFields",
      "requiredCriterionFields",
      "doesNotSelfAuthorizeReplacementCriterion",
      "doesNotSatisfyEntryRoute",
    ],
    "diagnosticLanes.owner-replacement-criterion-prep",
    issues,
  );
  if (
    lane.status !== "owner-approval-required"
    || !arrayEquals(lane.requiredOwnerProvenanceFields, REQUIRED_OWNER_PROVENANCE_FIELDS)
    || !arrayEquals(lane.requiredCriterionFields, REQUIRED_CRITERION_FIELDS)
    || lane.doesNotSelfAuthorizeReplacementCriterion !== true
    || lane.doesNotSatisfyEntryRoute !== true
  ) {
    addIssue(issues, "error", "phase5c_f_owner_prep_lane", "diagnosticLanes.owner-replacement-criterion-prep", "Owner replacement prep lane must require later owner provenance and cannot self-authorize the replacement criterion.");
  }
}

function validateBlockedClaims(blockedClaims: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(blockedClaims)) {
    addIssue(issues, "error", "phase5c_f_blocked_claims", "triageGate.blockedClaims", "blockedClaims must be an object.");
    return;
  }
  validateExactKeys(blockedClaims, BLOCKED_CLAIM_KEYS, "triageGate.blockedClaims", issues);
  if (
    blockedClaims.sameClosurePeriod2RouteSatisfied !== false
    || blockedClaims.ownerApprovedReplacementCriterionPresent !== false
    || blockedClaims.artifactGateExpectedPass !== false
    || blockedClaims.newMyocardiumCheckRequiredSatisfied !== false
    || blockedClaims.landRunInterpretation !== "not-interpretable-positive-control-failed"
    || blockedClaims.sameProtocolSecondOrderAdvancementStatus !== "blocked-until-positive-control-period2"
    || blockedClaims.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase5c_f_blocked_claims", "triageGate.blockedClaims", "Phase 5C-F must keep both entry routes unsatisfied and all Land/no-alternans advancement claims blocked.");
  }
}

function validateNonGoals(nonGoals: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(nonGoals)) {
    addIssue(issues, "error", "phase5c_f_non_goals", "triageGate.nonGoals", "nonGoals must be an object.");
    return;
  }
  validateExactKeys(nonGoals, NON_GOAL_KEYS, "triageGate.nonGoals", issues);
  for (const field of NON_GOAL_KEYS) {
    if (nonGoals[field] !== false) {
      addIssue(issues, "error", "phase5c_f_non_goals", `triageGate.nonGoals.${field}`, `${field} must remain false in Phase 5C-F triage audit.`);
    }
  }
}

function validateRequiredScripts(requiredVerificationScripts: unknown, issues: ValidationIssue[]): void {
  if (
    !Array.isArray(requiredVerificationScripts)
    || requiredVerificationScripts.length !== 3
    || !requiredVerificationScripts.includes(SOURCE_AUDIT_VERIFIER_SCRIPT)
    || !requiredVerificationScripts.includes(ENTRY_GATE_VERIFIER_SCRIPT)
    || !requiredVerificationScripts.includes(EXPECTED_VERIFIER_SCRIPT)
  ) {
    addIssue(issues, "error", "phase5c_f_required_scripts", "triageGate.requiredVerificationScripts", "Phase 5C-F triage audit must require the source audit verifier, entry gate verifier, and triage verifier.");
  }
}

function validateSourceFiles(sourceFiles: readonly TextFileInput[], issues: ValidationIssue[]): void {
  const triageGate = sourceFiles.find((file) => file.path === PHASE5C_F_TRIAGE_AUDIT_PATH);
  const entryGate = sourceFiles.find((file) => file.path === PHASE5C_E_ENTRY_GATE_PATH);
  const auditEvidence = sourceFiles.find((file) => file.path === PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH);
  const plan = sourceFiles.find((file) => file.path === PHASE5C_F_TRIAGE_AUDIT_PLAN_PATH);
  const roadmap = sourceFiles.find((file) => file.path === "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md");
  const readme = sourceFiles.find((file) => file.path === "docs/myocardium/README.md");
  if (!triageGate || !entryGate || !auditEvidence || !plan || !roadmap || !readme) {
    addIssue(issues, "error", "phase5c_f_source_scan", "sourceFiles", "Phase 5C-F triage gate, source gates, plan, roadmap, and README must be present.");
    return;
  }
  for (const file of [triageGate, plan, roadmap, readme]) {
    const normalizedText = file.text.replace(/\s+/g, " ");
    for (const token of REQUIRED_SOURCE_TOKENS) {
      if (!normalizedText.includes(token)) {
        addIssue(issues, "error", "phase5c_f_source_scan", file.path, `${file.path} must include ${token}.`);
      }
    }
    validateNoProductionClaims(file.path, file.text, issues);
    validateNoAffirmativeBoundaryProse(file.path, normalizeWhitespace(getPhase5CFTriageBoundaryText(file)), issues);
  }
  for (const file of [plan, roadmap, readme]) {
    const normalizedText = file.text.replace(/\s+/g, " ");
    for (const token of REQUIRED_DOCUMENT_BOUNDARY_TOKENS) {
      if (!normalizedText.includes(token)) {
        addIssue(issues, "error", "phase5c_f_source_scan", file.path, `${file.path} must include ${token}.`);
      }
    }
  }
  for (const token of [
    EXPECTED_ENTRY_GATE_ID,
    "entry-blocked-until-route-satisfied",
    "same-closure-period2-positive-control",
    "owner-approved-replacement-criterion",
  ] as const) {
    if (!entryGate.text.includes(token)) {
      addIssue(issues, "error", "phase5c_f_entry_gate_scan", entryGate.path, `Phase 5C-E entry gate must include ${token}.`);
    }
  }
  for (const token of [
    EXPECTED_AUDIT_ID,
    "positive-control-failed",
    "settled-period-1",
    "blocked-until-positive-control-period2",
  ] as const) {
    if (!auditEvidence.text.includes(token)) {
      addIssue(issues, "error", "phase5c_f_source_audit_scan", auditEvidence.path, `Phase 5C-D audit evidence must include ${token}.`);
    }
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "phase5c_f_runtime_leak", file.path, `Runtime/official-case/workbench file must not reference Phase 5C-F token ${token}.`);
      }
    }
    validateNoProductionClaims(file.path, file.text, issues);
  }
}

function validateChangedFileScope(changedFilePaths: readonly string[], issues: ValidationIssue[]): void {
  const triggerPaths = new Set<string>(PHASE5C_F_CHANGED_FILE_SCOPE_TRIGGER_PATHS);
  if (!changedFilePaths.some((filePath) => triggerPaths.has(filePath))) return;

  const allowedPaths = new Set<string>(ALLOWED_CHANGED_FILE_PATHS);
  for (const filePath of changedFilePaths) {
    if (allowedPaths.has(filePath)) continue;
    addIssue(
      issues,
      "error",
      "phase5c_f_changed_file_scope",
      filePath,
      "Phase 5C-F triage audit is docs/data/verifier/test-only; runtime, model, case, workbench, generated artifact, and unrelated file changes are not allowed.",
    );
  }
}

function validateNoAffirmativeBoundaryProse(
  label: string,
  normalizedText: string,
  issues: ValidationIssue[],
): void {
  for (const clause of normalizedText.split(/(?<=[.!?;])\s+|\b(?:and|but|however|nevertheless|yet)\b/i)) {
    const normalizedClause = clause.trim();
    if (normalizedClause === "") continue;
    const mentionsBoundaryObject = FORBIDDEN_PROSE_OBJECTS.some((token) =>
      normalizedClause.toLowerCase().includes(token.toLowerCase())
    );
    const hasLocalNegation = /\b(?:no|not|does not|do not|cannot|must not|without)\b/i.test(normalizedClause);
    const affirmativeProbe = normalizedClause
      .replace(/\bowner-approved(?:-[a-z0-9]+)*\b/gi, "")
      .replace(/\bowner approval\b/gi, "")
      .replace(/\breplacement criterion\b/gi, "");
    const hasAffirmativeClaim = AFFIRMATIVE_BOUNDARY_PATTERN.test(affirmativeProbe)
      || SELF_AUTHORIZATION_PATTERN.test(normalizedClause);
    if (mentionsBoundaryObject && !hasLocalNegation && hasAffirmativeClaim) {
      addIssue(issues, "error", "phase5c_f_forbidden_claim", label, `Phase 5C-F sources must not add affirmative boundary prose: ${normalizedClause}.`);
    }
  }
}

function getPhase5CFTriageBoundaryText(file: TextFileInput): string {
  if (file.path === "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md") {
    return extractMarkdownSection(file.text, "### Phase 5C-F");
  }
  if (file.path === "docs/myocardium/README.md") {
    return extractTextBetween(file.text, "Phase 5C-F records", "## Imported bundle checks");
  }
  return file.text;
}

function extractMarkdownSection(text: string, heading: string): string {
  const start = text.indexOf(heading);
  if (start < 0) return text;
  const afterHeading = text.slice(start + heading.length);
  const nextHeadingMatch = /\n###\s/.exec(afterHeading);
  if (!nextHeadingMatch) return text.slice(start);
  return text.slice(start, start + heading.length + nextHeadingMatch.index);
}

function extractTextBetween(text: string, startMarker: string, endMarker: string): string {
  const start = text.indexOf(startMarker);
  if (start < 0) return text;
  const end = text.indexOf(endMarker, start + startMarker.length);
  return end < 0 ? text.slice(start) : text.slice(start, end);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ");
}

function findLane(lanes: readonly unknown[], laneId: string): JsonRecord | undefined {
  return lanes.find((lane): lane is JsonRecord => isRecord(lane) && lane.laneId === laneId);
}

function arrayEquals(actual: unknown, expected: readonly string[]): boolean {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every((value, index) => actual[index] === value);
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

export function loadChangedFilePaths(rootDir: string): string[] {
  const changedPaths = new Set<string>();
  const addGitPaths = (args: readonly string[]): void => {
    try {
      const output = execFileSync("git", [...args], {
        cwd: rootDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      for (const line of output.split(/\r?\n/)) {
        const normalizedPath = line.trim().split(path.sep).join("/");
        if (normalizedPath !== "" && !isTransientToolPath(normalizedPath)) changedPaths.add(normalizedPath);
      }
    } catch {
      // The verifier can still run from source bundles without git metadata.
    }
  };

  for (const baseRef of [process.env.MYOCARDIUM_VERIFY_BASE_REF, "origin/main", "main"].filter(Boolean)) {
    const mergeBase = readGitOutput(rootDir, ["merge-base", "HEAD", baseRef as string]);
    if (mergeBase) {
      addGitPaths(["diff", "--name-only", "--diff-filter=ACDMRTUXB", `${mergeBase}...HEAD`]);
      break;
    }
  }
  addGitPaths(["diff", "--name-only", "--diff-filter=ACDMRTUXB", "HEAD"]);
  addGitPaths(["diff", "--name-only", "--cached", "--diff-filter=ACDMRTUXB", "HEAD"]);
  addGitPaths(["ls-files", "--others", "--exclude-standard"]);

  return [...changedPaths].sort();
}

function isTransientToolPath(filePath: string): boolean {
  return /^vite\.config\.ts\.timestamp-\d+-[a-f0-9]+\.mjs$/.test(filePath);
}

function readGitOutput(rootDir: string, args: readonly string[]): string | undefined {
  try {
    const output = execFileSync("git", [...args], {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return output === "" ? undefined : output;
  } catch {
    return undefined;
  }
}

function listFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx|json)$/.test(target) ? [target] : [];

  const files: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(fullPath));
    else if (entry.isFile() && /\.(ts|tsx|json)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function validateExactKeys(
  record: JsonRecord,
  expectedKeys: readonly string[],
  issuePath: string,
  issues: ValidationIssue[],
): void {
  const actualKeys = Object.keys(record).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (actualKeys.length !== sortedExpectedKeys.length || actualKeys.some((key, index) => key !== sortedExpectedKeys[index])) {
    addIssue(issues, "error", "phase5c_f_closed_schema", issuePath, `Phase 5C-F triage audit must use the closed key set: ${sortedExpectedKeys.join(", ")}.`);
  }
}

function validateNoProductionClaims(label: string, text: string, issues: ValidationIssue[]): void {
  if (PRODUCTION_ENABLING_PATTERN.test(text)) {
    addIssue(issues, "error", "phase5c_f_forbidden_claim", label, "Production/runtime/morphology/no-alternans/septal/RV/interdependence/RHF/TriSeg enabling flag detected.");
  }
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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function printReport(report: Phase5CPositiveControlTriageAuditValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 5C-F positive-control triage audit validation ${status} `
    + `triageStatus=${report.triageStatus} lanes=${report.diagnosticLaneIds.join(",")} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `sourceFiles=${report.summary.sourceFileCount} `
    + `integrationFiles=${report.summary.runtimeIntegrationFileCount} `
    + `changedFiles=${report.summary.changedFileCount}`,
  );
  printIssues("errors", report.errors);
  printIssues("warnings", report.warnings);
}

function printIssues(label: string, issues: readonly ValidationIssue[]): void {
  if (issues.length === 0) return;
  // eslint-disable-next-line no-console
  console.log(`${label}:`);
  for (const issue of issues.slice(0, 40)) {
    // eslint-disable-next-line no-console
    console.log(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  }
  if (issues.length > 40) {
    // eslint-disable-next-line no-console
    console.log(`- ... ${issues.length - 40} more`);
  }
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run verify:myocardium-phase5c-positive-control-triage-audit -- [--root=DIR]",
    "",
    "Validates the Phase 5C-F positive-control triage audit plan.",
    "This verifier keeps Phase 5C-E entry blocked and forbids runtime adoption, tuning, official morphology, final no-alternans, RV/interdependence/RHF coverage, and TriSeg.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validatePhase5CPositiveControlTriageAudit(
    loadPhase5CPositiveControlTriageAuditValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
