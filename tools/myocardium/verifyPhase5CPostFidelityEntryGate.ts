import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const PHASE5C_POST_FIDELITY_ENTRY_GATE_PATH =
  "data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json";
export const PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH =
  "data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-fidelity-audit-v1.json";
export const PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH =
  "docs/myocardium/roadmap/phase5c-post-fidelity-entry-gate.md";
export const PHASE5C_MODELCORE_EQUIVALENT_ROUTE_GATE_PLAN_PATH =
  "docs/myocardium/roadmap/phase5c-modelcore-equivalent-route-gate.md";
export const MODELCORE_EQUIVALENT_CLOSURE_PROTOCOL_PATH =
  "data/myocardium/protocols/modelcore-equivalent-positive-control-closure-v1.json";

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

export type Phase5CPostFidelityEntryGateValidationInput = {
  readonly gate: unknown;
  readonly fidelityAuditEvidence: unknown;
  readonly sourceFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
};

export type Phase5CPostFidelityEntryGateValidationReport = {
  readonly pass: boolean;
  readonly gateStatus: string;
  readonly allowedEntryRouteIds: readonly string[];
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly sourceFileCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly entryRouteCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const EXPECTED_GATE_ID = "phase5c-post-fidelity-entry-gate-v1";
const EXPECTED_AUDIT_ID = "land-new-myocardium-low-preload-phase5c-fidelity-audit-v1";
const SAME_CLOSURE_ENTRY_ROUTE_ID = "same-closure-period2-positive-control";
const MODELCORE_EQUIVALENT_ENTRY_ROUTE_ID = "modelcore-equivalent-closure-positive-control";
const OWNER_REPLACEMENT_ENTRY_ROUTE_ID = "owner-approved-replacement-criterion";
const EXPECTED_CLOSURE_MODEL_ID = "phase5c-c-standalone-preload-afterload-surrogate-v1";
const EXPECTED_MODELCORE_CLOSURE_PROTOCOL_ID = "modelcore-equivalent-positive-control-closure-v1";
const EXPECTED_VERIFIER_SCRIPT = "verify:myocardium-phase5c-post-fidelity-entry-gate";
const SOURCE_AUDIT_VERIFIER_SCRIPT = "verify:myocardium-land-new-myocardium-low-preload-check";
const MODELCORE_EQUIVALENT_VERIFIER_SCRIPT = "verify:myocardium-modelcore-equivalent-positive-control-closure";
const MODELCORE_PAIRED_LAND_VERIFIER_SCRIPT = "verify:myocardium-modelcore-paired-land-source-provider";

const CURRENT_NO_GO_KEYS = [
  "legacyPositiveControlStatus",
  "positiveControlBranchStatus",
  "positiveControlObservedPeriodBeats",
  "artifactGateExpectedPass",
  "artifactGateStatus",
  "artifactGateFailureFinding",
  "landRunInterpretation",
  "newMyocardiumCheckRequiredSatisfied",
  "secondOrderSameProtocolStatus",
  "sameProtocolSecondOrderAdvancementStatus",
  "finalNoAlternansClaim",
  "replacementCriterionStatus",
] as const;

const SHARED_NO_GO_FIELDS = [
  "legacyPositiveControlStatus",
  "positiveControlBranchStatus",
  "positiveControlObservedPeriodBeats",
  "artifactGateExpectedPass",
  "artifactGateStatus",
  "artifactGateFailureFinding",
  "landRunInterpretation",
  "newMyocardiumCheckRequiredSatisfied",
  "secondOrderSameProtocolStatus",
  "sameProtocolSecondOrderAdvancementStatus",
  "finalNoAlternansClaim",
  "replacementCriterionStatus",
] as const;

const COMMON_DOES_NOT_UNLOCK = [
  "runtime replacement",
  "ModelCore, chamber, case, official-case, Workbench, or state-schema wiring",
  "official morphology acceptance",
  "final robust no-alternans",
  "calcium-cycling alternans acceptance",
  "RV pressure-overload coverage",
  "ventricular interdependence coverage",
  "right-heart failure coverage",
  "TriSeg adoption",
] as const;

const MAY_UNLOCK_BY_ROUTE = {
  [SAME_CLOSURE_ENTRY_ROUTE_ID]: [
    "Phase 5C-C BE smoke rerun under the same-protocol policy only",
  ],
  [MODELCORE_EQUIVALENT_ENTRY_ROUTE_ID]: [
    "Phase 5C-L paired-result interpretation and same-closure robustness checks only",
  ],
  [OWNER_REPLACEMENT_ENTRY_ROUTE_ID]: [
    "a later owner-approved criterion rewrite plan",
  ],
} as const;

const MODELCORE_EQUIVALENT_EVENT_SURFACES = [
  "valveOpenCloseTiming",
  "qDotRawPostBehavior",
  "qDotClampEvents",
  "dynamicFlowClampEvents",
  "arterialAfterloadLoop",
  "venousPreloadLoop",
  "tbvProjectionBehaviorWhenRelevant",
  "pressureFloorBehavior",
  "beatSelectionAndSamplingPolicy",
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

const REQUIRED_SOURCE_TOKENS = [
  EXPECTED_GATE_ID,
  EXPECTED_AUDIT_ID,
  SAME_CLOSURE_ENTRY_ROUTE_ID,
  MODELCORE_EQUIVALENT_ENTRY_ROUTE_ID,
  OWNER_REPLACEMENT_ENTRY_ROUTE_ID,
  "blocked-until-positive-control-period2",
] as const;

const REQUIRED_DOCUMENT_BOUNDARY_TOKENS = [
  "no runtime replacement",
  "no qDot/valve/afterload tuning",
  "no official morphology acceptance",
  "no final no-alternans",
  "no TriSeg adoption",
] as const;

const RUNTIME_INTEGRATION_TARGETS = [
  "caseCloud.ts",
  "caseDoc.ts",
  "casePersist.ts",
  "caseValidation.ts",
  "components/Cases.tsx",
  "components/workbench",
  "constants.ts",
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
  "features/workbench",
  "officialCases.ts",
  "tools/verifyCases.ts",
  "data/cases",
  "public/cases",
] as const;

const PHASE5C_E_RUNTIME_REFERENCE_TOKENS = [
  EXPECTED_GATE_ID,
  SAME_CLOSURE_ENTRY_ROUTE_ID,
  MODELCORE_EQUIVALENT_ENTRY_ROUTE_ID,
  OWNER_REPLACEMENT_ENTRY_ROUTE_ID,
  EXPECTED_VERIFIER_SCRIPT,
  "Phase 5C-E",
  "post-fidelity-entry-gate",
] as const;

const FORBIDDEN_PROSE_OBJECTS = [
  "runtime replacement",
  "ModelCore",
  "chamber",
  "case",
  "official-case",
  "Workbench",
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
  "owner-approved-replacement-criterion",
  "owner approval",
  "owner-approved",
  "replacement criterion",
] as const;

const AFFIRMATIVE_BOUNDARY_PATTERN =
  /\b(?:accepts?|accepted|adopts?|adopted|allows?|allowed|approves?|approved|authorizes?|authorized|claims?|claimed|completes?|completed|covers?|covered|enables?|enabled|implements?|implemented|permits?|permitted|proves?|proved|ready|replaces?|replaced|satisfies|satisfied|tunes?|tuned|validates?|validated|wires?|wired|can|may|must|should|will|in scope)\b/i;
const SELF_AUTHORIZATION_PATTERN =
  /\b(?:approved|accepted|authorized)\s+by\s+this\s+gate\b/i;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useCaseRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|useOfficialMorphologyAcceptance|useRobustNoAlternansAcceptance|useCalciumCyclingAlternansValidation|implementSeptalCoordinate|implementBiventricularCoupling|validateSeptalCoupling|validateRVPressureOverload|validateVentricularInterdependence|validateRightHeartFailure|adoptTriSeg|phase5Completed|runtimeReplacement|officialMorphologyPass|robustNoAlternans|finalNoAlternans)["']?\s*[:=]\s*true/i;

export function loadPhase5CPostFidelityEntryGateValidationInput(
  rootDir = process.cwd(),
): Phase5CPostFidelityEntryGateValidationInput {
  return {
    gate: readJson(path.join(rootDir, PHASE5C_POST_FIDELITY_ENTRY_GATE_PATH)),
    fidelityAuditEvidence: readJson(path.join(rootDir, PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH)),
    sourceFiles: [
      readTextFile(rootDir, PHASE5C_POST_FIDELITY_ENTRY_GATE_PATH),
      readTextFile(rootDir, PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH),
      readTextFile(rootDir, PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH),
      readTextFile(rootDir, PHASE5C_MODELCORE_EQUIVALENT_ROUTE_GATE_PLAN_PATH),
      readTextFile(rootDir, MODELCORE_EQUIVALENT_CLOSURE_PROTOCOL_PATH),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
  };
}

export function validatePhase5CPostFidelityEntryGate(
  input: Phase5CPostFidelityEntryGateValidationInput,
): Phase5CPostFidelityEntryGateValidationReport {
  const issues: ValidationIssue[] = [];

  validateGate(input.gate, input.fidelityAuditEvidence, issues);
  validateSourceFiles(input.sourceFiles, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const gate = isRecord(input.gate) ? input.gate : {};
  const routes = Array.isArray(gate.allowedEntryRoutes) ? gate.allowedEntryRoutes : [];
  return {
    pass: errors.length === 0,
    gateStatus: typeof gate.gateStatus === "string" ? gate.gateStatus : "unknown",
    allowedEntryRouteIds: routes.flatMap((route) =>
      isRecord(route) && typeof route.routeId === "string" ? [route.routeId] : []
    ),
    errors,
    warnings,
    summary: {
      sourceFileCount: input.sourceFiles.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      entryRouteCount: routes.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateGate(
  gate: unknown,
  fidelityAuditEvidence: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(gate)) {
    addIssue(issues, "error", "phase5c_e_entry_gate_shape", PHASE5C_POST_FIDELITY_ENTRY_GATE_PATH, "Phase 5C-E entry gate must be an object.");
    return;
  }
  if (!isRecord(fidelityAuditEvidence)) {
    addIssue(issues, "error", "phase5c_e_source_audit_shape", PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH, "Phase 5C-D fidelity audit evidence must be an object.");
    return;
  }

  validateExactKeys(
    gate,
    [
      "schemaVersion",
      "gateId",
      "phase",
      "kind",
      "sourceAuditEvidencePath",
      "sourceAuditEvidenceId",
      "gateStatus",
      "currentNoGo",
      "allowedEntryRoutes",
      "blockedUntil",
      "nonGoals",
      "requiredVerificationScripts",
    ],
    PHASE5C_POST_FIDELITY_ENTRY_GATE_PATH,
    issues,
  );

  if (
    gate.schemaVersion !== 1
    || gate.gateId !== EXPECTED_GATE_ID
    || gate.phase !== "Phase 5C-E"
    || gate.kind !== "post-fidelity-entry-gate"
    || gate.sourceAuditEvidencePath !== PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH
    || gate.sourceAuditEvidenceId !== EXPECTED_AUDIT_ID
    || gate.gateStatus !== "entry-route-satisfied-interpretation-pending"
  ) {
    addIssue(issues, "error", "phase5c_e_entry_gate_identity", PHASE5C_POST_FIDELITY_ENTRY_GATE_PATH, "Phase 5C-E entry gate identity, source audit pin, and route-satisfied interpretation-pending status must remain fixed.");
  }
  if (fidelityAuditEvidence.id !== EXPECTED_AUDIT_ID) {
    addIssue(issues, "error", "phase5c_e_source_audit_identity", PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH, "Phase 5C-E entry gate must reference the Phase 5C-D fidelity audit evidence.");
  }

  validateCurrentNoGo(gate.currentNoGo, fidelityAuditEvidence, issues);
  validateAllowedEntryRoutes(gate.allowedEntryRoutes, issues);
  validateBlockedUntil(gate.blockedUntil, issues);
  validateNonGoals(gate.nonGoals, issues);
  validateRequiredScripts(gate.requiredVerificationScripts, issues);
}

function validateCurrentNoGo(
  currentNoGo: unknown,
  fidelityAuditEvidence: JsonRecord,
  issues: ValidationIssue[],
): void {
  if (!isRecord(currentNoGo)) {
    addIssue(issues, "error", "phase5c_e_current_no_go", "gate.currentNoGo", "currentNoGo must be an object.");
    return;
  }
  validateExactKeys(currentNoGo, CURRENT_NO_GO_KEYS, "gate.currentNoGo", issues);
  const auditOutcome = isRecord(fidelityAuditEvidence.auditOutcome)
    ? fidelityAuditEvidence.auditOutcome
    : {};
  for (const field of SHARED_NO_GO_FIELDS) {
    if (currentNoGo[field] !== auditOutcome[field]) {
      addIssue(issues, "error", "phase5c_e_current_no_go", `gate.currentNoGo.${field}`, `${field} must match the Phase 5C-D audit outcome.`);
    }
  }
  if (
    currentNoGo.legacyPositiveControlStatus !== "positive-control-failed"
    || currentNoGo.positiveControlBranchStatus !== "settled-period-1"
    || currentNoGo.positiveControlObservedPeriodBeats !== 1
    || currentNoGo.artifactGateExpectedPass !== false
    || currentNoGo.artifactGateStatus !== "land-new-myocardium-low-preload-check-review"
    || currentNoGo.artifactGateFailureFinding !== "legacy-activeStress-positive-control-v1"
    || currentNoGo.landRunInterpretation !== "not-interpretable-positive-control-failed"
    || currentNoGo.newMyocardiumCheckRequiredSatisfied !== false
    || currentNoGo.secondOrderSameProtocolStatus !== "not-performed"
    || currentNoGo.sameProtocolSecondOrderAdvancementStatus !== "blocked-until-positive-control-period2"
    || currentNoGo.finalNoAlternansClaim !== "not-claimed"
    || currentNoGo.replacementCriterionStatus !== "owner-approved-replacement-required"
  ) {
    addIssue(issues, "error", "phase5c_e_current_no_go", "gate.currentNoGo", "Current state must preserve the Phase 5C-D no-go and advancement block.");
  }
}

function validateAllowedEntryRoutes(
  allowedEntryRoutes: unknown,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(allowedEntryRoutes) || allowedEntryRoutes.length !== 3) {
    addIssue(issues, "error", "phase5c_e_entry_routes", "gate.allowedEntryRoutes", "Exactly three entry routes are allowed: same-closure period-2 reproduction, ModelCore-equivalent positive-control closure, or owner-approved replacement criterion.");
    return;
  }
  const sameClosureRoute = findRoute(allowedEntryRoutes, SAME_CLOSURE_ENTRY_ROUTE_ID);
  const modelCoreEquivalentRoute = findRoute(allowedEntryRoutes, MODELCORE_EQUIVALENT_ENTRY_ROUTE_ID);
  const ownerRoute = findRoute(allowedEntryRoutes, OWNER_REPLACEMENT_ENTRY_ROUTE_ID);
  if (!sameClosureRoute || !modelCoreEquivalentRoute || !ownerRoute) {
    addIssue(issues, "error", "phase5c_e_entry_routes", "gate.allowedEntryRoutes", "Required entry routes are missing.");
    return;
  }
  validateRouteShell(sameClosureRoute, SAME_CLOSURE_ENTRY_ROUTE_ID, "not-satisfied", issues);
  validateSameClosureRoute(sameClosureRoute.requiredEvidence, issues);
  validateRouteShell(modelCoreEquivalentRoute, MODELCORE_EQUIVALENT_ENTRY_ROUTE_ID, "satisfied-experimental-paired-land-run", issues);
  validateModelCoreEquivalentRoute(modelCoreEquivalentRoute.requiredEvidence, issues);
  validateRouteShell(ownerRoute, OWNER_REPLACEMENT_ENTRY_ROUTE_ID, "owner-approval-required", issues);
  validateOwnerReplacementRoute(ownerRoute.requiredEvidence, issues);
}

function validateRouteShell(
  route: JsonRecord,
  routeId: keyof typeof MAY_UNLOCK_BY_ROUTE,
  expectedStatus: string,
  issues: ValidationIssue[],
): void {
  validateExactKeys(
    route,
    ["routeId", "status", "requiredEvidence", "mayUnlock", "doesNotUnlock"],
    `gate.allowedEntryRoutes.${routeId}`,
    issues,
  );
  if (route.routeId !== routeId || route.status !== expectedStatus) {
    addIssue(issues, "error", "phase5c_e_entry_routes", `gate.allowedEntryRoutes.${routeId}`, `${routeId} must keep status=${expectedStatus}.`);
  }
  if (!arrayEquals(route.mayUnlock, MAY_UNLOCK_BY_ROUTE[routeId])) {
    addIssue(issues, "error", "phase5c_e_entry_route_boundary", `gate.allowedEntryRoutes.${routeId}.mayUnlock`, `${routeId} must keep a narrow mayUnlock scope and must not authorize runtime, morphology, final no-alternans, tuning, RV/interdependence/RHF coverage, or TriSeg.`);
  }
  if (!arrayEquals(route.doesNotUnlock, COMMON_DOES_NOT_UNLOCK)) {
    addIssue(issues, "error", "phase5c_e_entry_route_boundary", `gate.allowedEntryRoutes.${routeId}.doesNotUnlock`, `${routeId} must not unlock runtime, morphology acceptance, final no-alternans, RV/interdependence/RHF coverage, or TriSeg.`);
  }
}

function validateSameClosureRoute(
  requiredEvidence: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(requiredEvidence)) {
    addIssue(issues, "error", "phase5c_e_same_closure_route", "gate.allowedEntryRoutes.same-closure-period2-positive-control.requiredEvidence", "same-closure route evidence must be an object.");
    return;
  }
  validateExactKeys(
    requiredEvidence,
    [
      "sourceProviderRole",
      "closureModelId",
      "closureEquivalenceToModelCore",
      "legacyPositiveControlStatus",
      "positiveControlBranchStatus",
      "positiveControlObservedPeriodBeats",
      "adjacentDeltaRelation",
      "adjacentDeltaThreshold",
      "periodDeltaRelation",
      "periodDeltaThreshold",
      "tbvProjectionEquivalentMaxMl",
      "maxReverseVolumeEquivalentMaxMl",
      "pressureFloorUse",
      "selectedDomainCoverageFinite",
      "usesSameClosureAsLandRun",
      "sourceProviderDifferenceOnly",
    ],
    "gate.allowedEntryRoutes.same-closure-period2-positive-control.requiredEvidence",
    issues,
  );
  if (
    requiredEvidence.sourceProviderRole !== "legacy-activeStress-positive-control"
    || requiredEvidence.closureModelId !== EXPECTED_CLOSURE_MODEL_ID
    || requiredEvidence.closureEquivalenceToModelCore !== "not-claimed"
    || requiredEvidence.legacyPositiveControlStatus !== "period-2-positive-control-pass"
    || requiredEvidence.positiveControlBranchStatus !== "settled-period-2"
    || requiredEvidence.positiveControlObservedPeriodBeats !== 2
    || requiredEvidence.adjacentDeltaRelation !== ">"
    || requiredEvidence.adjacentDeltaThreshold !== 0.1
    || requiredEvidence.periodDeltaRelation !== "<"
    || requiredEvidence.periodDeltaThreshold !== 0.05
    || requiredEvidence.tbvProjectionEquivalentMaxMl !== 0.05
    || requiredEvidence.maxReverseVolumeEquivalentMaxMl !== 0.05
    || requiredEvidence.pressureFloorUse !== false
    || requiredEvidence.selectedDomainCoverageFinite !== true
    || requiredEvidence.usesSameClosureAsLandRun !== true
    || requiredEvidence.sourceProviderDifferenceOnly !== true
  ) {
    addIssue(issues, "error", "phase5c_e_same_closure_route", "gate.allowedEntryRoutes.same-closure-period2-positive-control.requiredEvidence", "Same-closure entry route must require period-2 positive-control reproduction under pinned Phase 5C-C thresholds and clean event surfaces.");
  }
}

function validateModelCoreEquivalentRoute(
  requiredEvidence: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(requiredEvidence)) {
    addIssue(issues, "error", "phase5c_e_modelcore_equivalent_route", "gate.allowedEntryRoutes.modelcore-equivalent-closure-positive-control.requiredEvidence", "ModelCore-equivalent route evidence must be an object.");
    return;
  }
  validateExactKeys(
    requiredEvidence,
    [
      "closureProtocolId",
      "closureImplementationStatus",
      "routeSatisfactionStatus",
      "sourceProviderRole",
      "closureEquivalenceToModelCore",
      "legacyPositiveControlStatus",
      "positiveControlObservedPeriodBeats",
      "sameProtocolOrExplicitEquivalence",
      "eventSurfacePreservationRequired",
      "sourceProviderDifferenceOnly",
      "secondOrderReferenceStillRequired",
      "requiredEventSurfaces",
      "closureEquivalenceEvidence",
      "doesNotSatisfyCurrentNoGo",
    ],
    "gate.allowedEntryRoutes.modelcore-equivalent-closure-positive-control.requiredEvidence",
    issues,
  );
  if (
    requiredEvidence.closureProtocolId !== EXPECTED_MODELCORE_CLOSURE_PROTOCOL_ID
    || requiredEvidence.closureImplementationStatus !== "experimental-source-provider-hook-implemented"
    || requiredEvidence.routeSatisfactionStatus !== "satisfied-paired-land-provider-run-finite"
    || requiredEvidence.sourceProviderRole !== "legacy-source-only-positive-control-and-land2017-lv-source-only"
    || requiredEvidence.closureEquivalenceToModelCore !== "experimental-source-provider-closure-evidence-recorded"
    || requiredEvidence.legacyPositiveControlStatus !== "period-2-positive-control-pass"
    || requiredEvidence.positiveControlObservedPeriodBeats !== 2
    || requiredEvidence.sameProtocolOrExplicitEquivalence !== true
    || requiredEvidence.eventSurfacePreservationRequired !== true
    || requiredEvidence.sourceProviderDifferenceOnly !== true
    || requiredEvidence.secondOrderReferenceStillRequired !== true
    || !arrayEquals(requiredEvidence.requiredEventSurfaces, MODELCORE_EQUIVALENT_EVENT_SURFACES)
    || requiredEvidence.closureEquivalenceEvidence !== "qDot, valve, afterload, preload, TBV/projection, pressure-floor, beat-selection, and sampling behavior preserved or explicitly matched"
    || requiredEvidence.doesNotSatisfyCurrentNoGo !== true
  ) {
    addIssue(issues, "error", "phase5c_e_modelcore_equivalent_route", "gate.allowedEntryRoutes.modelcore-equivalent-closure-positive-control.requiredEvidence", "ModelCore-equivalent route must record the paired finite Land source-provider run while keeping runtime, official morphology, and final no-alternans blocked.");
  }
}

function validateOwnerReplacementRoute(
  requiredEvidence: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(requiredEvidence)) {
    addIssue(issues, "error", "phase5c_e_owner_replacement_route", "gate.allowedEntryRoutes.owner-approved-replacement-criterion.requiredEvidence", "owner replacement route evidence must be an object.");
    return;
  }
  validateExactKeys(
    requiredEvidence,
    [
      "replacementCriterionStatus",
      "ownerApprovalArtifactRequired",
      "ownerApprovalArtifactPath",
      "requiredOwnerProvenanceFields",
      "requiredCriterionFields",
      "requiredDecisionBoundary",
      "mustReferenceSupersededPositiveControlCriterion",
      "mustDescribeReplacementAcceptanceCriterion",
      "doesNotSelfAuthorizeRuntimeAdoption",
    ],
    "gate.allowedEntryRoutes.owner-approved-replacement-criterion.requiredEvidence",
    issues,
  );
  if (
    requiredEvidence.replacementCriterionStatus !== "owner-approved-replacement-required"
    || requiredEvidence.ownerApprovalArtifactRequired !== true
    || requiredEvidence.ownerApprovalArtifactPath !== "not-yet-present"
    || !arrayEquals(requiredEvidence.requiredOwnerProvenanceFields, [
      "acceptedBy",
      "acceptedAt",
      "acceptedSourceType",
      "acceptedSourceRef",
      "acceptedSourceText",
    ])
    || !arrayEquals(requiredEvidence.requiredCriterionFields, [
      "criterionId",
      "supersedesCriterionId",
      "replacementAcceptanceCriterion",
      "decisionBoundary",
    ])
    || !validateOwnerReplacementDecisionBoundary(requiredEvidence.requiredDecisionBoundary)
    || requiredEvidence.mustReferenceSupersededPositiveControlCriterion !== true
    || requiredEvidence.mustDescribeReplacementAcceptanceCriterion !== true
    || requiredEvidence.doesNotSelfAuthorizeRuntimeAdoption !== true
  ) {
    addIssue(issues, "error", "phase5c_e_owner_replacement_route", "gate.allowedEntryRoutes.owner-approved-replacement-criterion.requiredEvidence", "Owner replacement route must require a later owner approval artifact and cannot self-authorize runtime adoption.");
  }
}

function validateOwnerReplacementDecisionBoundary(boundary: unknown): boolean {
  if (!isRecord(boundary)) return false;
  const expectedKeys = [
    "doesNotAuthorizeRuntimeAdoption",
    "doesNotAuthorizeTuning",
    "doesNotAuthorizeOfficialMorphologyAcceptance",
    "doesNotAuthorizeFinalNoAlternans",
    "doesNotAuthorizeRVPressureOverloadCoverage",
    "doesNotAuthorizeVentricularInterdependenceCoverage",
    "doesNotAuthorizeRightHeartFailureCoverage",
    "doesNotAuthorizeTriSegAdoption",
  ] as const;
  const actualKeys = Object.keys(boundary).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  return actualKeys.length === sortedExpectedKeys.length
    && actualKeys.every((key, index) => key === sortedExpectedKeys[index])
    && expectedKeys.every((key) => boundary[key] === true);
}

function validateBlockedUntil(
  blockedUntil: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(blockedUntil)) {
    addIssue(issues, "error", "phase5c_e_blocked_until", "gate.blockedUntil", "blockedUntil must be an object.");
    return;
  }
  validateExactKeys(
    blockedUntil,
    [
      "artifactGateExpectedPass",
      "newMyocardiumCheckRequiredSatisfied",
      "landRunInterpretation",
      "sameProtocolSecondOrderAdvancementStatus",
      "finalNoAlternansClaim",
      "officialMorphologyAcceptance",
      "runtimeReplacement",
    ],
    "gate.blockedUntil",
    issues,
  );
  if (
    blockedUntil.artifactGateExpectedPass !== false
    || blockedUntil.newMyocardiumCheckRequiredSatisfied !== false
    || blockedUntil.landRunInterpretation !== "modelcore-paired-land-finite-period1-positive-signal"
    || blockedUntil.sameProtocolSecondOrderAdvancementStatus !== "second-order-reference-required"
    || blockedUntil.finalNoAlternansClaim !== "not-claimed"
    || blockedUntil.officialMorphologyAcceptance !== false
    || blockedUntil.runtimeReplacement !== false
  ) {
    addIssue(issues, "error", "phase5c_e_blocked_until", "gate.blockedUntil", "Blocked-until fields must record the paired Land signal while keeping second-order reference, final no-alternans, official morphology, and runtime adoption blocked.");
  }
}

function validateNonGoals(
  nonGoals: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(nonGoals)) {
    addIssue(issues, "error", "phase5c_e_non_goals", "gate.nonGoals", "nonGoals must be an object.");
    return;
  }
  validateExactKeys(nonGoals, NON_GOAL_KEYS, "gate.nonGoals", issues);
  for (const field of NON_GOAL_KEYS) {
    if (nonGoals[field] !== false) {
      addIssue(issues, "error", "phase5c_e_non_goals", `gate.nonGoals.${field}`, `${field} must remain false in the Phase 5C-E entry gate.`);
    }
  }
}

function validateRequiredScripts(
  requiredVerificationScripts: unknown,
  issues: ValidationIssue[],
): void {
  if (
    !Array.isArray(requiredVerificationScripts)
    || requiredVerificationScripts.length !== 4
    || !requiredVerificationScripts.includes(SOURCE_AUDIT_VERIFIER_SCRIPT)
    || !requiredVerificationScripts.includes(MODELCORE_EQUIVALENT_VERIFIER_SCRIPT)
    || !requiredVerificationScripts.includes(MODELCORE_PAIRED_LAND_VERIFIER_SCRIPT)
    || !requiredVerificationScripts.includes(EXPECTED_VERIFIER_SCRIPT)
  ) {
    addIssue(issues, "error", "phase5c_e_required_scripts", "gate.requiredVerificationScripts", "Phase 5C-E entry gate must require the source audit verifier, ModelCore-equivalent positive-control verifier, paired Land verifier, and this gate verifier.");
  }
}

function validateSourceFiles(
  sourceFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  const gate = sourceFiles.find((file) => file.path === PHASE5C_POST_FIDELITY_ENTRY_GATE_PATH);
  const auditEvidence = sourceFiles.find((file) => file.path === PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH);
  const plan = sourceFiles.find((file) => file.path === PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH);
  const modelCorePlan = sourceFiles.find((file) => file.path === PHASE5C_MODELCORE_EQUIVALENT_ROUTE_GATE_PLAN_PATH);
  const modelCoreProtocol = sourceFiles.find((file) => file.path === MODELCORE_EQUIVALENT_CLOSURE_PROTOCOL_PATH);
  const roadmap = sourceFiles.find((file) => file.path === "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md");
  const readme = sourceFiles.find((file) => file.path === "docs/myocardium/README.md");
  if (!gate || !auditEvidence || !plan || !modelCorePlan || !modelCoreProtocol || !roadmap || !readme) {
    addIssue(issues, "error", "phase5c_e_source_scan", "sourceFiles", "Phase 5C-E gate, Phase 5C-D audit evidence, plans, ModelCore-equivalent protocol, roadmap, and README must be present.");
    return;
  }
  for (const file of [gate, plan, modelCorePlan, roadmap, readme]) {
    const normalizedText = file.text.replace(/\s+/g, " ");
    for (const token of REQUIRED_SOURCE_TOKENS) {
      if (!normalizedText.includes(token)) {
        addIssue(issues, "error", "phase5c_e_source_scan", file.path, `${file.path} must include ${token}.`);
      }
    }
    if (file.path !== gate.path) {
      validateNoProductionClaims(file.path, file.text, issues);
    }
  }
  for (const file of [plan, modelCorePlan, roadmap, readme]) {
    const normalizedText = file.text.replace(/\s+/g, " ");
    validateNoAffirmativeBoundaryProse(
      file.path,
      stripMarkdownFencedBlocks(phase5CEntryGateBoundaryText(file, issues)).replace(/\s+/g, " "),
      issues,
    );
    for (const token of REQUIRED_DOCUMENT_BOUNDARY_TOKENS) {
      if (!normalizedText.includes(token)) {
        addIssue(issues, "error", "phase5c_e_source_scan", file.path, `${file.path} must include ${token}.`);
      }
    }
  }
  for (const token of [
    EXPECTED_MODELCORE_CLOSURE_PROTOCOL_ID,
    "period-2-positive-control-pass",
    "sourceProviderDifferenceOnly",
  ] as const) {
    if (!modelCoreProtocol.text.includes(token)) {
      addIssue(issues, "error", "phase5c_e_modelcore_protocol_scan", modelCoreProtocol.path, `ModelCore-equivalent protocol must include ${token}.`);
    }
  }
  for (const token of [
    '"qDotTuning": false',
    '"valveThresholdTuning": false',
    '"arterialLoadTuning": false',
    '"officialMorphologyAcceptance": false',
    '"robustNoAlternansAcceptance": false',
    '"triSegAdoption": false',
  ] as const) {
    if (!gate.text.includes(token)) {
      addIssue(issues, "error", "phase5c_e_source_scan", gate.path, `${gate.path} must include ${token}.`);
    }
  }
  for (const token of [
    EXPECTED_AUDIT_ID,
    "positive-control-failed",
    "settled-period-1",
    "blocked-until-positive-control-period2",
    "owner-approved-replacement-required",
  ] as const) {
    if (!auditEvidence.text.includes(token)) {
      addIssue(issues, "error", "phase5c_e_source_audit_scan", auditEvidence.path, `Phase 5C-D audit evidence must include ${token}.`);
    }
  }
}

function phase5CEntryGateBoundaryText(
  file: TextFileInput,
  issues: ValidationIssue[],
): string {
  if (file.path === PHASE5C_POST_FIDELITY_ENTRY_GATE_PLAN_PATH) return file.text;
  if (file.path === PHASE5C_MODELCORE_EQUIVALENT_ROUTE_GATE_PLAN_PATH) return file.text;
  if (file.path === "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md") {
    return extractRequiredSlice(
      file,
      "### Phase 5C-E",
      "\n### Phase 5C+",
      issues,
    );
  }
  if (file.path === "docs/myocardium/README.md") {
    return extractRequiredSlice(
      file,
      "Phase 5C-E records that post-fidelity entry gate",
      "\n## Imported bundle checks",
      issues,
    );
  }
  return file.text;
}

function extractRequiredSlice(
  file: TextFileInput,
  startToken: string,
  endToken: string,
  issues: ValidationIssue[],
): string {
  const start = file.text.indexOf(startToken);
  const end = start >= 0 ? file.text.indexOf(endToken, start + startToken.length) : -1;
  if (start < 0 || end < 0) {
    addIssue(issues, "error", "phase5c_e_source_scan", file.path, `${file.path} must keep the Phase 5C-E boundary section.`);
    return "";
  }
  return file.text.slice(start, end);
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of PHASE5C_E_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "phase5c_e_runtime_leak", file.path, `Runtime/official-case/workbench file must not reference Phase 5C-E token ${token}.`);
      }
    }
    validateNoProductionClaims(file.path, file.text, issues);
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
      addIssue(issues, "error", "phase5c_e_forbidden_claim", label, `Phase 5C-E sources must not add affirmative boundary prose: ${normalizedClause}.`);
    }
  }
}

function stripMarkdownFencedBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "");
}

function findRoute(routes: readonly unknown[], routeId: string): JsonRecord | undefined {
  return routes.find((route): route is JsonRecord =>
    isRecord(route) && route.routeId === routeId
  );
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

function validateExactKeys(
  record: JsonRecord,
  expectedKeys: readonly string[],
  issuePath: string,
  issues: ValidationIssue[],
): void {
  const actualKeys = Object.keys(record).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (
    actualKeys.length !== sortedExpectedKeys.length
    || actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    addIssue(issues, "error", "phase5c_e_closed_schema", issuePath, `Phase 5C-E entry gate must use the closed key set: ${sortedExpectedKeys.join(", ")}.`);
  }
}

function validateNoProductionClaims(
  label: string,
  text: string,
  issues: ValidationIssue[],
): void {
  if (PRODUCTION_ENABLING_PATTERN.test(text)) {
    addIssue(issues, "error", "phase5c_e_forbidden_claim", label, "Production/runtime/morphology/no-alternans/septal/RV/interdependence/RHF/TriSeg enabling flag detected.");
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

function printReport(report: Phase5CPostFidelityEntryGateValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 5C-E post-fidelity entry gate validation ${status} `
    + `gateStatus=${report.gateStatus} routes=${report.allowedEntryRouteIds.join(",")} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `sourceFiles=${report.summary.sourceFileCount} `
    + `integrationFiles=${report.summary.runtimeIntegrationFileCount}`,
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
    "Usage: npm run verify:myocardium-phase5c-post-fidelity-entry-gate -- [--root=DIR]",
    "",
    "Validates the Phase 5C-E post-fidelity entry gate after the Phase 5C-D no-go audit.",
    "The gate only records allowed next-entry routes and preserves runtime, morphology, final no-alternans, tuning, RV/interdependence/RHF, and TriSeg non-goals.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validatePhase5CPostFidelityEntryGate(
    loadPhase5CPostFidelityEntryGateValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
