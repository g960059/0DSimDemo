import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH =
  "data/myocardium/gates/phase5c-same-closure-source-provider-audit-v1.json";
export const PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH =
  "docs/myocardium/roadmap/phase5c-same-closure-source-provider-audit.md";
export const PHASE5C_F_TRIAGE_AUDIT_PATH =
  "data/myocardium/gates/phase5c-positive-control-triage-audit-v1.json";
export const PHASE5C_E_ENTRY_GATE_PATH =
  "data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json";
export const PHASE5C_E_PATCH_PLAN_PATH =
  "data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.patch-plan.json";
export const MODELCORE_EQUIVALENT_CLOSURE_PATH =
  "data/myocardium/protocols/modelcore-equivalent-positive-control-closure-v1.json";
export const PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH =
  "data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-fidelity-audit-v1.json";

const PHASE5C_G_VERIFIER_PATH =
  "tools/myocardium/verifyPhase5CSameClosureSourceProviderAudit.ts";
const PHASE5C_G_TEST_PATH =
  "__tests__/myocardiumPhase5CSameClosureSourceProviderAudit.test.ts";
const PHASE5C_E_ENTRY_GATE_PLAN_PATH =
  "docs/myocardium/roadmap/phase5c-post-fidelity-entry-gate.md";
const PHASE5C_H_MODELCORE_EQUIVALENT_ROUTE_PLAN_PATH =
  "docs/myocardium/roadmap/phase5c-modelcore-equivalent-route-gate.md";
const PHASE5C_E_ENTRY_GATE_VERIFIER_PATH =
  "tools/myocardium/verifyPhase5CPostFidelityEntryGate.ts";
const PHASE5C_E_ENTRY_GATE_TEST_PATH =
  "__tests__/myocardiumPhase5CPostFidelityEntryGate.test.ts";

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

export type Phase5CSameClosureSourceProviderAuditValidationInput = {
  readonly audit: unknown;
  readonly triageGate: unknown;
  readonly entryGate: unknown;
  readonly patchPlan: unknown;
  readonly modelCoreEquivalentClosure: unknown;
  readonly liveReport: unknown;
  readonly sourceFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly changedFilePaths: readonly string[];
};

export type Phase5CSameClosureSourceProviderAuditValidationReport = {
  readonly pass: boolean;
  readonly auditStatus: string;
  readonly providerIds: readonly string[];
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly sourceFileCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly changedFileCount: number;
    readonly providerCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const EXPECTED_AUDIT_ID = "phase5c-same-closure-source-provider-audit-v1";
const EXPECTED_TRIAGE_GATE_ID = "phase5c-positive-control-triage-audit-v1";
const EXPECTED_ENTRY_GATE_ID = "phase5c-post-fidelity-entry-gate-v1";
const EXPECTED_FIDELITY_AUDIT_ID = "land-new-myocardium-low-preload-phase5c-fidelity-audit-v1";
const EXPECTED_DESCRIPTOR_ID = "land-new-myocardium-low-preload-phase5c-protocols";
const EXPECTED_MODELCORE_EQUIVALENT_ROUTE_ID = "modelcore-equivalent-closure-positive-control";
const EXPECTED_VERIFIER_SCRIPT = "verify:myocardium-phase5c-same-closure-source-provider-audit";
const SOURCE_AUDIT_VERIFIER_SCRIPT = "verify:myocardium-land-new-myocardium-low-preload-check";
const ENTRY_GATE_VERIFIER_SCRIPT = "verify:myocardium-phase5c-post-fidelity-entry-gate";
const TRIAGE_AUDIT_VERIFIER_SCRIPT = "verify:myocardium-phase5c-positive-control-triage-audit";

const EXPECTED_PROVIDERS = [
  "legacy-activeStress-positive-control",
  "land2017-new-myocardium",
] as const;

const REQUIRED_SOURCE_TOKENS = [
  EXPECTED_AUDIT_ID,
  "same-closure-source-provider-audit",
  EXPECTED_MODELCORE_EQUIVALENT_ROUTE_ID,
  "proposed-next-route-not-implemented",
  "positive-control-failed",
  "settled-period-1",
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
  PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH,
  PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH,
  PHASE5C_G_VERIFIER_PATH,
  PHASE5C_G_TEST_PATH,
  PHASE5C_E_ENTRY_GATE_PATH,
  PHASE5C_E_ENTRY_GATE_PLAN_PATH,
  PHASE5C_H_MODELCORE_EQUIVALENT_ROUTE_PLAN_PATH,
  PHASE5C_E_ENTRY_GATE_VERIFIER_PATH,
  PHASE5C_E_ENTRY_GATE_TEST_PATH,
  "tools/myocardium/verifyPhase5CPositiveControlTriageAudit.ts",
  "docs/myocardium/README.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  "docs/status/current-lanes.md",
  "package.json",
] as const;

const PHASE5C_G_CHANGED_FILE_SCOPE_TRIGGER_PATHS = [
  ...ALLOWED_CHANGED_FILE_PATHS,
] as const;

const PHASE5C_I_MODELCORE_SOURCE_PROVIDER_ALLOWED_CHANGED_FILE_PATHS = [
  "__tests__/myocardiumPhase5CModelCoreEquivalentPositiveControlClosure.test.ts",
  "__tests__/myocardiumPhase5CPostFidelityEntryGate.test.ts",
  PHASE5C_G_TEST_PATH,
  PHASE5C_E_ENTRY_GATE_PATH,
  "data/myocardium/protocols/modelcore-equivalent-positive-control-closure-evidence-v1.json",
  MODELCORE_EQUIVALENT_CLOSURE_PATH,
  "docs/myocardium/README.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  PHASE5C_H_MODELCORE_EQUIVALENT_ROUTE_PLAN_PATH,
  PHASE5C_E_ENTRY_GATE_PLAN_PATH,
  "docs/status/current-lanes.md",
  "engine/ModelCore.ts",
  "package.json",
  "tools/debugStarlingLowPreload.ts",
  "tools/myocardium/buildModelCoreEquivalentPositiveControlClosureEvidence.ts",
  "tools/myocardium/verifyModelCoreEquivalentPositiveControlClosure.ts",
  PHASE5C_E_ENTRY_GATE_VERIFIER_PATH,
  PHASE5C_G_VERIFIER_PATH,
] as const;

const PHASE5C_J_MODELCORE_PROVIDER_STATE_LIFECYCLE_ALLOWED_CHANGED_FILE_PATHS = [
  "__tests__/myocardiumPhase5JModelCoreActiveProviderStateLifecycle.test.ts",
  PHASE5C_G_TEST_PATH,
  "data/myocardium/protocols/modelcore-active-provider-state-lifecycle-v1.json",
  "docs/myocardium/README.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  PHASE5C_H_MODELCORE_EQUIVALENT_ROUTE_PLAN_PATH,
  "engine/ModelCore.ts",
  "engine/__tests__/modelCoreExperimentalActiveProviderState.test.ts",
  "package.json",
  "tools/myocardium/buildModelCoreActiveProviderStateLifecycleEvidence.ts",
  "tools/myocardium/verifyModelCoreActiveProviderStateLifecycle.ts",
  PHASE5C_G_VERIFIER_PATH,
] as const;

const PHASE5C_K_MODELCORE_SOURCE_PRESSURE_ADAPTER_ALLOWED_CHANGED_FILE_PATHS = [
  "__tests__/myocardiumPhase5KModelCoreActiveSourcePressureAdapter.test.ts",
  PHASE5C_G_TEST_PATH,
  "data/myocardium/protocols/modelcore-active-source-pressure-adapter-v1.json",
  "docs/myocardium/README.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  PHASE5C_H_MODELCORE_EQUIVALENT_ROUTE_PLAN_PATH,
  "docs/status/current-lanes.md",
  "engine/ModelCore.ts",
  "engine/chambers.ts",
  "engine/__tests__/activeStressSourcePressureAdapter.test.ts",
  "package.json",
  "tools/myocardium/buildModelCoreActiveSourcePressureAdapterEvidence.ts",
  "tools/myocardium/modelCoreActiveSourcePressureAdapter.ts",
  "tools/myocardium/verifyModelCoreActiveSourcePressureAdapter.ts",
  PHASE5C_G_VERIFIER_PATH,
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
  EXPECTED_AUDIT_ID,
  EXPECTED_VERIFIER_SCRIPT,
  "Phase 5C-G",
  "phase5c-same-closure-source-provider",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useCaseRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|useOfficialMorphologyAcceptance|useRobustNoAlternansAcceptance|useCalciumCyclingAlternansValidation|implementSeptalCoordinate|implementBiventricularCoupling|validateSeptalCoupling|validateRVPressureOverload|validateVentricularInterdependence|validateRightHeartFailure|adoptTriSeg|phase5Completed|runtimeReplacement|officialMorphologyPass|robustNoAlternans|finalNoAlternans)["']?\s*[:=]\s*true/i;

const FORBIDDEN_PROSE_OBJECTS = [
  "runtime replacement",
  "ModelCore",
  "ModelCore-equivalent",
  "entry route",
  "positive control",
  "period-2",
  "official morphology",
  "morphology acceptance",
  "final no-alternans",
  "robust no-alternans",
  "qDot",
  "valve",
  "afterload",
  "Land parameter",
  "RV pressure-overload",
  "ventricular interdependence",
  "right-heart failure",
  "TriSeg",
] as const;

const AFFIRMATIVE_BOUNDARY_PATTERN =
  /\b(?:accepts?|accepted|adopts?|adopted|allows?|allowed|approves?|approved|authorizes?|authorized|claims?|claimed|completes?|completed|covers?|covered|enables?|enabled|implements?|implemented|permits?|permitted|proves?|proved|ready|replaces?|replaced|satisfies|satisfied|tunes?|tuned|validates?|validated|wires?|wired|can|may|must|should|will|in scope)\b/i;

export async function loadPhase5CSameClosureSourceProviderAuditValidationInput(
  rootDir = process.cwd(),
): Promise<Phase5CSameClosureSourceProviderAuditValidationInput> {
  return {
    audit: readJson(path.join(rootDir, PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH)),
    triageGate: readJson(path.join(rootDir, PHASE5C_F_TRIAGE_AUDIT_PATH)),
    entryGate: readJson(path.join(rootDir, PHASE5C_E_ENTRY_GATE_PATH)),
    patchPlan: readJson(path.join(rootDir, PHASE5C_E_PATCH_PLAN_PATH)),
    modelCoreEquivalentClosure: readJson(path.join(rootDir, MODELCORE_EQUIVALENT_CLOSURE_PATH)),
    liveReport: await loadLivePhase5CReport(rootDir),
    sourceFiles: [
      readTextFile(rootDir, PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH),
      readTextFile(rootDir, PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH),
      readTextFile(rootDir, PHASE5C_F_TRIAGE_AUDIT_PATH),
      readTextFile(rootDir, PHASE5C_E_ENTRY_GATE_PATH),
      readTextFile(rootDir, PHASE5C_E_PATCH_PLAN_PATH),
      readTextFile(rootDir, MODELCORE_EQUIVALENT_CLOSURE_PATH),
      readTextFile(rootDir, PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH),
      readTextFile(rootDir, "docs/myocardium/review-notes/phase5c-positive-control-no-go-analysis.md"),
      readTextFile(rootDir, "docs/status/current-lanes.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    changedFilePaths: loadChangedFilePaths(rootDir),
  };
}

export function validatePhase5CSameClosureSourceProviderAudit(
  input: Phase5CSameClosureSourceProviderAuditValidationInput,
): Phase5CSameClosureSourceProviderAuditValidationReport {
  const issues: ValidationIssue[] = [];

  validateAudit(input.audit, input.triageGate, input.entryGate, input.patchPlan, input.modelCoreEquivalentClosure, input.liveReport, issues);
  validateSourceFiles(input.sourceFiles, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  validateChangedFileScope(input.changedFilePaths, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const audit = isRecord(input.audit) ? input.audit : {};
  const providers = Array.isArray(audit.providerAudits) ? audit.providerAudits : [];

  return {
    pass: errors.length === 0,
    auditStatus: typeof audit.status === "string" ? audit.status : "unknown",
    providerIds: providers.flatMap((provider) =>
      isRecord(provider) && typeof provider.sourceProviderId === "string" ? [provider.sourceProviderId] : []
    ),
    errors,
    warnings,
    summary: {
      sourceFileCount: input.sourceFiles.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      changedFileCount: input.changedFilePaths.length,
      providerCount: providers.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateAudit(
  auditValue: unknown,
  triageGateValue: unknown,
  entryGateValue: unknown,
  patchPlanValue: unknown,
  modelCoreEquivalentClosureValue: unknown,
  liveReportValue: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(auditValue)) {
    addIssue(issues, "error", "phase5c_g_audit_shape", PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH, "Phase 5C-G audit must be a JSON object.");
    return;
  }
  if (auditValue.schemaVersion !== 1
    || auditValue.auditId !== EXPECTED_AUDIT_ID
    || auditValue.phase !== "Phase 5C-G"
    || auditValue.kind !== "same-closure-source-provider-audit"
    || auditValue.status !== "audit-snapshot-only-entry-still-blocked"
    || auditValue.claimBoundary !== "same-closure-source-provider-provenance-only") {
    addIssue(issues, "error", "phase5c_g_audit_identity", PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH, "Phase 5C-G audit identity/status/boundary fields must remain exact.");
  }

  validateSourceArtifacts(auditValue.sourceArtifacts, issues);
  validatePr193HandoffBoundary(auditValue.pr193HandoffBoundary, patchPlanValue, modelCoreEquivalentClosureValue, issues);
  validateInheritedNoGo(auditValue.inheritedNoGo, issues);
  validateLiveReportSnapshot(auditValue.liveReportSnapshot, liveReportValue, issues);
  validateProviderAudits(auditValue.providerAudits, liveReportValue, issues);
  validateBlockedClaims(auditValue.blockedClaims, issues);
  validateNonGoals(auditValue.nonGoals, issues);
  validateRequiredScripts(auditValue.requiredVerificationScripts, issues);
  validateSourceGatePins(triageGateValue, entryGateValue, issues);
}

function validateSourceArtifacts(sourceArtifacts: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(sourceArtifacts)
    || sourceArtifacts.sourceDescriptorPath !== "data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-protocols.json"
    || sourceArtifacts.sourceFidelityAuditEvidencePath !== PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH
    || sourceArtifacts.sourceEntryGatePath !== PHASE5C_E_ENTRY_GATE_PATH
    || sourceArtifacts.sourceTriageGatePath !== PHASE5C_F_TRIAGE_AUDIT_PATH
    || sourceArtifacts.sourceVerifierScript !== SOURCE_AUDIT_VERIFIER_SCRIPT
    || sourceArtifacts.sourceTriageVerifierScript !== TRIAGE_AUDIT_VERIFIER_SCRIPT) {
    addIssue(issues, "error", "phase5c_g_source_artifacts", "sourceArtifacts", "Phase 5C-G source artifact pins must remain exact.");
  }
}

function validatePr193HandoffBoundary(
  handoffBoundary: unknown,
  patchPlanValue: unknown,
  modelCoreEquivalentClosureValue: unknown,
  issues: ValidationIssue[],
): void {
  if (!isRecord(handoffBoundary)
    || handoffBoundary.modelCoreEquivalentRouteId !== EXPECTED_MODELCORE_EQUIVALENT_ROUTE_ID
    || handoffBoundary.modelCoreEquivalentRouteStatus !== "proposed-next-route-not-implemented"
    || handoffBoundary.doesNotMutatePhase5CEntryGate !== true
    || handoffBoundary.doesNotImplementModelCoreEquivalentClosure !== true
    || handoffBoundary.doesNotSatisfyRecommendedAdditionalRoute !== true) {
    addIssue(issues, "error", "phase5c_g_pr193_boundary", "pr193HandoffBoundary", "PR #193 route must remain proposed, not implemented, and not satisfied by Phase 5C-G.");
  }

  const patchPlan = isRecord(patchPlanValue) ? patchPlanValue : {};
  const recommendedRoute = isRecord(patchPlan.recommendedAdditionalRoute)
    ? patchPlan.recommendedAdditionalRoute
    : {};
  if (patchPlan.id !== "phase5c-post-fidelity-entry-gate-v1-patch-plan"
    || patchPlan.status !== "proposed-non-normative-patch-plan"
    || recommendedRoute.routeId !== EXPECTED_MODELCORE_EQUIVALENT_ROUTE_ID
    || recommendedRoute.status !== "proposed-next-route") {
    addIssue(issues, "error", "phase5c_g_patch_plan_pin", PHASE5C_E_PATCH_PLAN_PATH, "PR #193 patch plan must keep the modelcore-equivalent route proposed and non-normative.");
  }

  const modelCoreEquivalentClosure = isRecord(modelCoreEquivalentClosureValue) ? modelCoreEquivalentClosureValue : {};
  const requiredEvidence = isRecord(modelCoreEquivalentClosure.requiredEvidence)
    ? modelCoreEquivalentClosure.requiredEvidence
    : {};
  const descriptorStillProposed = modelCoreEquivalentClosure.status === "proposed";
  const descriptorHasForwardPartialEvidence =
    modelCoreEquivalentClosure.status === "experimental-source-provider-hook-implemented"
    && modelCoreEquivalentClosure.currentEvidenceStatus === "partial-legacy-positive-control-pass-land-pairing-not-run";
  if (modelCoreEquivalentClosure.id !== "modelcore-equivalent-positive-control-closure-v1"
    || (!descriptorStillProposed && !descriptorHasForwardPartialEvidence)
    || requiredEvidence.legacyPositiveControlStatus !== "period-2-positive-control-pass"
    || requiredEvidence.positiveControlObservedPeriodBeats !== 2
    || requiredEvidence.sourceProviderDifferenceOnly !== true) {
    addIssue(issues, "error", "phase5c_g_modelcore_equivalent_pin", MODELCORE_EQUIVALENT_CLOSURE_PATH, "ModelCore-equivalent positive-control route must remain either the PR #193 proposed route or a later partial hook-evidence route that is still unsatisfied.");
  }
}

function validateInheritedNoGo(inheritedNoGo: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(inheritedNoGo)
    || inheritedNoGo.gateStatus !== "entry-blocked-until-route-satisfied"
    || inheritedNoGo.legacyPositiveControlStatus !== "positive-control-failed"
    || inheritedNoGo.positiveControlBranchStatus !== "settled-period-1"
    || inheritedNoGo.positiveControlObservedPeriodBeats !== 1
    || inheritedNoGo.artifactGateExpectedPass !== false
    || inheritedNoGo.landRunInterpretation !== "not-interpretable-positive-control-failed"
    || inheritedNoGo.sameProtocolSecondOrderAdvancementStatus !== "blocked-until-positive-control-period2"
    || inheritedNoGo.finalNoAlternansClaim !== "not-claimed") {
    addIssue(issues, "error", "phase5c_g_inherited_no_go", "inheritedNoGo", "Phase 5C-G must preserve the inherited Phase 5C-E/F no-go state.");
  }
}

function validateLiveReportSnapshot(
  snapshotValue: unknown,
  liveReportValue: unknown,
  issues: ValidationIssue[],
): void {
  const snapshot = isRecord(snapshotValue) ? snapshotValue : {};
  const liveReport = isRecord(liveReportValue) ? liveReportValue : {};
  const sameClosureSnapshot = isRecord(snapshot.sameClosureEvidence) ? snapshot.sameClosureEvidence : {};
  const sameClosureLive = isRecord(liveReport.sameClosureEvidence) ? liveReport.sameClosureEvidence : {};

  if (!isStableHash(snapshot.reportStableSummaryHash)
    || snapshot.readinessPass !== false
    || liveReport.readinessPass !== false) {
    addIssue(issues, "error", "phase5c_g_live_report_snapshot", "liveReportSnapshot", "Phase 5C-G snapshot must record an 8-hex summary hash and keep readinessPass=false.");
  }

  for (const key of [
    "positiveControlSourceProviderId",
    "landSourceProviderId",
    "closureConfigStableHash",
    "positiveControlClosureConfigStableHash",
    "landClosureConfigStableHash",
    "initialStateStableHash",
    "positiveControlInitialStateStableHash",
    "landInitialStateStableHash",
    "branchMetricDefinitionsStableHash",
  ] as const) {
    if (sameClosureSnapshot[key] !== sameClosureLive[key]) {
      addIssue(issues, "error", "phase5c_g_same_closure_snapshot", `liveReportSnapshot.sameClosureEvidence.${key}`, `Same-closure snapshot drifted for ${key}.`);
    }
  }
  if (sameClosureSnapshot.sourceProviderDifferenceOnly !== true
    || sameClosureLive.sourceProviderDifferenceOnly !== true
    || sameClosureSnapshot.pass !== true
    || sameClosureLive.pass !== true
    || sameClosureSnapshot.closureEquivalenceToModelCore !== "not-claimed") {
    addIssue(issues, "error", "phase5c_g_same_closure_boundary", "liveReportSnapshot.sameClosureEvidence", "Same-closure audit must remain source-provider-difference-only and not claim ModelCore closure equivalence.");
  }
}

function validateProviderAudits(
  providerAudits: unknown,
  liveReportValue: unknown,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(providerAudits) || providerAudits.length !== EXPECTED_PROVIDERS.length) {
    addIssue(issues, "error", "phase5c_g_provider_audits", "providerAudits", "Phase 5C-G must include exactly the legacy activeStress and Land source provider audits.");
    return;
  }
  const liveReport = isRecord(liveReportValue) ? liveReportValue : {};
  const liveProviders = [
    liveReport.legacyPositiveControl,
    liveReport.landNewMyocardiumRun,
  ];
  for (const expectedProviderId of EXPECTED_PROVIDERS) {
    const snapshotProvider = providerAudits.find((provider) =>
      isRecord(provider) && provider.sourceProviderId === expectedProviderId
    );
    const liveProvider = liveProviders.find((provider) =>
      isRecord(provider) && provider.sourceProviderId === expectedProviderId
    );
    validateProviderAudit(expectedProviderId, snapshotProvider, liveProvider, issues);
  }
}

function validateProviderAudit(
  expectedProviderId: string,
  snapshotProviderValue: unknown,
  liveProviderValue: unknown,
  issues: ValidationIssue[],
): void {
  const snapshotProvider = isRecord(snapshotProviderValue) ? snapshotProviderValue : {};
  const liveProvider = isRecord(liveProviderValue) ? liveProviderValue : {};
  const issueBase = `providerAudits.${expectedProviderId}`;
  if (snapshotProvider.sourceProviderId !== expectedProviderId
    || snapshotProvider.sourceProviderRole !== liveProvider.sourceProviderRole
    || snapshotProvider.generatedTrajectoryStatus !== "generated-own-trajectory-finite"
    || snapshotProvider.generatedTrajectoryStatus !== liveProvider.generatedTrajectoryStatus
    || snapshotProvider.finiteStateHealth !== true
    || snapshotProvider.finiteStateHealth !== liveProvider.finiteStateHealth
    || snapshotProvider.selectedDomainCoverageFinite !== true
    || snapshotProvider.selectedDomainCoverageFinite !== liveProvider.selectedDomainCoverageFinite
    || snapshotProvider.sourceProviderStableHash !== liveProvider.sourceProviderStableHash
    || !isStableHash(snapshotProvider.trajectoryStableHash)
    || !isStableHash(liveProvider.trajectoryStableHash)) {
    addIssue(issues, "error", "phase5c_g_provider_snapshot", issueBase, `Provider snapshot drifted for ${expectedProviderId}.`);
  }

  validateProviderProvenance(expectedProviderId, snapshotProvider.sourceProviderProvenance, liveProvider.sourceProviderProvenance, issues);
  validateEventSurfaces(expectedProviderId, snapshotProvider.eventSurfaces, liveProvider.eventSurfaces, issues);
  validateBranchBehavior(expectedProviderId, snapshotProvider.branchBehavior, liveProvider.branchBehavior, issues);
}

function validateProviderProvenance(
  expectedProviderId: string,
  snapshotValue: unknown,
  liveValue: unknown,
  issues: ValidationIssue[],
): void {
  const snapshot = isRecord(snapshotValue) ? snapshotValue : {};
  const live = isRecord(liveValue) ? liveValue : {};
  for (const key of [
    "equationSource",
    "parameterSource",
    "stateSemantics",
    "kinematicsInput",
    "activationInput",
    "contextId",
  ] as const) {
    if (snapshot[key] !== live[key]) {
      addIssue(issues, "error", "phase5c_g_provider_provenance", `providerAudits.${expectedProviderId}.sourceProviderProvenance.${key}`, `Provider provenance drifted for ${expectedProviderId}.${key}.`);
    }
  }
  if (snapshot.artifactEquationImportOnly !== true
    || snapshot.usesModelCoreRuntimeWiring !== false
    || snapshot.usesChamberRuntimeWiring !== false
    || snapshot.hardCodedBeatParityForcing !== false
    || snapshot.consumesPrerecordedTraceReplay !== false
    || snapshot.artifactEquationImportOnly !== live.artifactEquationImportOnly
    || snapshot.usesModelCoreRuntimeWiring !== live.usesModelCoreRuntimeWiring
    || snapshot.usesChamberRuntimeWiring !== live.usesChamberRuntimeWiring
    || snapshot.hardCodedBeatParityForcing !== live.hardCodedBeatParityForcing
    || snapshot.consumesPrerecordedTraceReplay !== live.consumesPrerecordedTraceReplay) {
    addIssue(issues, "error", "phase5c_g_provider_runtime_boundary", `providerAudits.${expectedProviderId}.sourceProviderProvenance`, `Provider provenance must remain artifact-only with no runtime wiring for ${expectedProviderId}.`);
  }
}

function validateEventSurfaces(
  expectedProviderId: string,
  snapshotValue: unknown,
  liveValue: unknown,
  issues: ValidationIssue[],
): void {
  const snapshot = isRecord(snapshotValue) ? snapshotValue : {};
  const live = isRecord(liveValue) ? liveValue : {};
  for (const key of [
    "pressureFloorUse",
    "tbvProjectionUse",
    "tbvProjectionEquivalentMl",
    "outletReverseVolumeEquivalentMl",
    "inletReverseVolumeEquivalentMl",
    "maxReverseVolumeEquivalentMl",
    "qDotCapStatus",
    "qDotCapStatusIfIntroduced",
  ] as const) {
    if (snapshot[key] !== live[key]) {
      addIssue(issues, "error", "phase5c_g_event_surface_snapshot", `providerAudits.${expectedProviderId}.eventSurfaces.${key}`, `Event-surface snapshot drifted for ${expectedProviderId}.${key}.`);
    }
  }
  if (snapshot.pressureFloorUse !== false
    || snapshot.tbvProjectionUse !== false
    || snapshot.qDotCapStatus !== "not-used") {
    addIssue(issues, "error", "phase5c_g_event_surface_boundary", `providerAudits.${expectedProviderId}.eventSurfaces`, `Event surfaces must remain report-only and not tuned for ${expectedProviderId}.`);
  }
}

function validateBranchBehavior(
  expectedProviderId: string,
  snapshotValue: unknown,
  liveValue: unknown,
  issues: ValidationIssue[],
): void {
  const snapshot = isRecord(snapshotValue) ? snapshotValue : {};
  const live = isRecord(liveValue) ? liveValue : {};
  if (snapshot.settled !== true
    || snapshot.settlingStatus !== "settled-period-1"
    || snapshot.periodBeats !== 1
    || snapshot.returnMapEvidenceStatus !== "report-only-not-acceptance"
    || snapshot.settled !== live.settled
    || snapshot.settlingStatus !== live.settlingStatus
    || snapshot.periodBeats !== live.periodBeats
    || snapshot.returnMapEvidenceStatus !== live.returnMapEvidenceStatus) {
    addIssue(issues, "error", "phase5c_g_branch_status", `providerAudits.${expectedProviderId}.branchBehavior`, `Branch behavior must remain period-1 report-only for ${expectedProviderId}.`);
  }
  for (const key of [
    "adjacentDelta",
    "periodDelta",
    "adjacentDeltaThreshold",
    "periodDeltaThreshold",
  ] as const) {
    if (!numbersClose(snapshot[key], live[key])) {
      addIssue(issues, "error", "phase5c_g_branch_metric", `providerAudits.${expectedProviderId}.branchBehavior.${key}`, `Branch metric drifted for ${expectedProviderId}.${key}.`);
    }
  }
  if (snapshot.branchMetricDefinitionsId !== live.branchMetricDefinitionsId
    || snapshot.branchMetricDefinitionsStableHash !== live.branchMetricDefinitionsStableHash) {
    addIssue(issues, "error", "phase5c_g_branch_metric_defs", `providerAudits.${expectedProviderId}.branchBehavior`, `Branch metric definitions drifted for ${expectedProviderId}.`);
  }

  const liveBeatWindow = Array.isArray(live.beatWindow) ? live.beatWindow : [];
  const liveHashes = liveBeatWindow.flatMap((beat) =>
    isRecord(beat) && typeof beat.deterministicHash === "string" ? [beat.deterministicHash] : []
  );
  if (!Array.isArray(snapshot.beatWindowDeterministicHashes)
    || snapshot.beatWindowDeterministicHashes.length !== liveHashes.length
    || snapshot.beatWindowDeterministicHashes.some((value) => !isStableHash(value))
    || liveHashes.some((value) => !isStableHash(value))) {
    addIssue(issues, "error", "phase5c_g_beat_hashes", `providerAudits.${expectedProviderId}.branchBehavior.beatWindowDeterministicHashes`, `Beat window hash audit context is incomplete for ${expectedProviderId}.`);
  }

  const lastLiveBeat = isRecord(liveBeatWindow[liveBeatWindow.length - 1])
    ? liveBeatWindow[liveBeatWindow.length - 1]
    : {};
  validateLastBeatMetrics(expectedProviderId, snapshot.lastBeatMetrics, lastLiveBeat, issues);
}

function validateLastBeatMetrics(
  expectedProviderId: string,
  snapshotValue: unknown,
  liveValue: unknown,
  issues: ValidationIssue[],
): void {
  const snapshot = isRecord(snapshotValue) ? snapshotValue : {};
  const live = isRecord(liveValue) ? liveValue : {};
  for (const key of [
    "beat",
    "edvMl",
    "esvMl",
    "strokeVolumeMl",
    "qAoForwardVolumeMl",
    "qAoReverseVolumeMl",
    "strokeWorkJ",
  ] as const) {
    if (!numbersClose(snapshot[key], live[key])) {
      addIssue(issues, "error", "phase5c_g_last_beat_metric", `providerAudits.${expectedProviderId}.branchBehavior.lastBeatMetrics.${key}`, `Last beat metric drifted for ${expectedProviderId}.${key}.`);
    }
  }
  if (!positiveNumbersBroadlyClose(snapshot.peakSourceActiveFiberStressPa, live.peakSourceActiveFiberStressPa)) {
    addIssue(issues, "error", "phase5c_g_last_beat_metric", `providerAudits.${expectedProviderId}.branchBehavior.lastBeatMetrics.peakSourceActiveFiberStressPa`, `Last beat peak source stress audit context drifted outside the portable tolerance for ${expectedProviderId}.`);
  }
  if (!isStableHash(snapshot.deterministicHash) || !isStableHash(live.deterministicHash)) {
    addIssue(issues, "error", "phase5c_g_last_beat_hash", `providerAudits.${expectedProviderId}.branchBehavior.lastBeatMetrics.deterministicHash`, `Last beat deterministic hash audit context is incomplete for ${expectedProviderId}.`);
  }
}

function validateBlockedClaims(blockedClaims: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(blockedClaims)
    || blockedClaims.sameClosurePeriod2RouteSatisfied !== false
    || blockedClaims.ownerApprovedReplacementCriterionPresent !== false
    || blockedClaims.modelCoreEquivalentClosureRouteSatisfied !== false
    || blockedClaims.artifactGateExpectedPass !== false
    || blockedClaims.newMyocardiumCheckRequiredSatisfied !== false
    || blockedClaims.landRunInterpretation !== "not-interpretable-positive-control-failed"
    || blockedClaims.sameProtocolSecondOrderAdvancementStatus !== "blocked-until-positive-control-period2"
    || blockedClaims.finalNoAlternansClaim !== "not-claimed") {
    addIssue(issues, "error", "phase5c_g_blocked_claims", "blockedClaims", "Phase 5C-G blocked claims must not advance entry, interpretability, or final no-alternans.");
  }
}

function validateNonGoals(nonGoals: unknown, issues: ValidationIssue[]): void {
  const expectedFalseKeys = [
    "runtimeReplacement",
    "modelCoreEquivalentClosureImplementation",
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
  if (!isRecord(nonGoals)) {
    addIssue(issues, "error", "phase5c_g_non_goals", "nonGoals", "Phase 5C-G nonGoals must be an object.");
    return;
  }
  for (const key of expectedFalseKeys) {
    if (nonGoals[key] !== false) {
      addIssue(issues, "error", "phase5c_g_non_goals", `nonGoals.${key}`, `Phase 5C-G non-goal ${key} must remain false.`);
    }
  }
}

function validateRequiredScripts(requiredVerificationScripts: unknown, issues: ValidationIssue[]): void {
  const expectedScripts = [
    SOURCE_AUDIT_VERIFIER_SCRIPT,
    ENTRY_GATE_VERIFIER_SCRIPT,
    EXPECTED_VERIFIER_SCRIPT,
  ] as const;
  if (!arrayEquals(requiredVerificationScripts, expectedScripts)) {
    addIssue(issues, "error", "phase5c_g_required_scripts", "requiredVerificationScripts", `Phase 5C-G must require ${expectedScripts.join(", ")}.`);
  }
}

function validateSourceGatePins(
  triageGateValue: unknown,
  entryGateValue: unknown,
  issues: ValidationIssue[],
): void {
  const triageGate = isRecord(triageGateValue) ? triageGateValue : {};
  const entryGate = isRecord(entryGateValue) ? entryGateValue : {};
  if (triageGate.gateId !== EXPECTED_TRIAGE_GATE_ID
    || triageGate.triageStatus !== "triage-audit-only-entry-still-blocked") {
    addIssue(issues, "error", "phase5c_g_triage_gate_pin", PHASE5C_F_TRIAGE_AUDIT_PATH, "Phase 5C-G must pin the Phase 5C-F triage gate as still blocked.");
  }
  if (entryGate.gateId !== EXPECTED_ENTRY_GATE_ID
    || entryGate.gateStatus !== "entry-blocked-until-route-satisfied") {
    addIssue(issues, "error", "phase5c_g_entry_gate_pin", PHASE5C_E_ENTRY_GATE_PATH, "Phase 5C-G must keep the Phase 5C-E gate blocked.");
  }
}

function validateSourceFiles(sourceFiles: readonly TextFileInput[], issues: ValidationIssue[]): void {
  const requiredPaths = [
    PHASE5C_G_SOURCE_PROVIDER_AUDIT_PATH,
    PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH,
    PHASE5C_F_TRIAGE_AUDIT_PATH,
    PHASE5C_E_ENTRY_GATE_PATH,
    PHASE5C_E_PATCH_PLAN_PATH,
    MODELCORE_EQUIVALENT_CLOSURE_PATH,
    PHASE5C_D_FIDELITY_AUDIT_EVIDENCE_PATH,
    "docs/myocardium/review-notes/phase5c-positive-control-no-go-analysis.md",
    "docs/status/current-lanes.md",
    "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
    "docs/myocardium/README.md",
  ] as const;
  for (const requiredPath of requiredPaths) {
    if (!sourceFiles.some((file) => file.path === requiredPath)) {
      addIssue(issues, "error", "phase5c_g_source_scan", requiredPath, `${requiredPath} must be loaded for Phase 5C-G validation.`);
    }
  }

  const boundaryDocs = sourceFiles.filter((file) =>
    file.path === PHASE5C_G_SOURCE_PROVIDER_AUDIT_PLAN_PATH
    || file.path === "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"
    || file.path === "docs/myocardium/README.md"
  );
  for (const file of boundaryDocs) {
    const normalizedText = file.text.replace(/\s+/g, " ");
    for (const token of REQUIRED_SOURCE_TOKENS) {
      if (!normalizedText.includes(token)) {
        addIssue(issues, "error", "phase5c_g_source_scan", file.path, `${file.path} must include ${token}.`);
      }
    }
    for (const token of REQUIRED_DOCUMENT_BOUNDARY_TOKENS) {
      if (!normalizedText.includes(token)) {
        addIssue(issues, "error", "phase5c_g_source_scan", file.path, `${file.path} must include ${token}.`);
      }
    }
    validateNoProductionClaims(file.path, file.text, issues);
    validateNoAffirmativeBoundaryProse(file.path, normalizeWhitespace(getPhase5CGBoundaryText(file)), issues);
  }

  const currentLanes = sourceFiles.find((file) => file.path === "docs/status/current-lanes.md");
  const keepsOldModelCoreRouteVisible = currentLanes?.text.includes("ModelCore-equivalent positive-control closure route") === true;
  const keepsForwardPartialRouteVisible =
    currentLanes?.text.includes("experimental ModelCore source-provider hook") === true
    && currentLanes.text.includes("route remains partial") === true;
  if (currentLanes && !keepsOldModelCoreRouteVisible && !keepsForwardPartialRouteVisible) {
    addIssue(issues, "error", "phase5c_g_current_lanes_pin", currentLanes.path, "Current lanes must keep the ModelCore-equivalent route visible, either as the PR #193 proposed route or as later partial hook evidence.");
  }

  const noGoAnalysis = sourceFiles.find((file) =>
    file.path === "docs/myocardium/review-notes/phase5c-positive-control-no-go-analysis.md"
  );
  if (noGoAnalysis && !noGoAnalysis.text.includes("The current evidence says the Phase 5C-C assay is not yet faithful enough")) {
    addIssue(issues, "error", "phase5c_g_no_go_analysis_pin", noGoAnalysis.path, "PR #193 no-go analysis must keep the assay-fidelity interpretation visible.");
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "phase5c_g_runtime_leak", file.path, `Runtime/official-case/workbench file must not reference Phase 5C-G token ${token}.`);
      }
    }
    validateNoProductionClaims(file.path, file.text, issues);
  }
}

function validateChangedFileScope(changedFilePaths: readonly string[], issues: ValidationIssue[]): void {
  if (isPhase5IModelCoreSourceProviderDiff(changedFilePaths)) return;
  if (isPhase5JModelCoreProviderStateLifecycleDiff(changedFilePaths)) return;
  if (isPhase5KModelCoreSourcePressureAdapterDiff(changedFilePaths)) return;

  const triggerPaths = new Set<string>(PHASE5C_G_CHANGED_FILE_SCOPE_TRIGGER_PATHS);
  if (!changedFilePaths.some((filePath) => triggerPaths.has(filePath))) return;

  const allowedPaths = new Set<string>(ALLOWED_CHANGED_FILE_PATHS);
  for (const filePath of changedFilePaths) {
    if (allowedPaths.has(filePath)) continue;
    addIssue(
      issues,
      "error",
      "phase5c_g_changed_file_scope",
      filePath,
      "Phase 5C-G source-provider audit is docs/data/verifier/test-only; runtime, model, case, workbench, generated artifact, and unrelated file changes are not allowed.",
    );
  }
}

function isPhase5IModelCoreSourceProviderDiff(changedFilePaths: readonly string[]): boolean {
  const allowedPaths = new Set<string>(PHASE5C_I_MODELCORE_SOURCE_PROVIDER_ALLOWED_CHANGED_FILE_PATHS);
  const changedPaths = new Set(changedFilePaths);
  if (changedPaths.size !== allowedPaths.size) return false;
  for (const allowedPath of allowedPaths) {
    if (!changedPaths.has(allowedPath)) return false;
  }
  return true;
}

function isPhase5JModelCoreProviderStateLifecycleDiff(changedFilePaths: readonly string[]): boolean {
  const allowedPaths = new Set<string>(PHASE5C_J_MODELCORE_PROVIDER_STATE_LIFECYCLE_ALLOWED_CHANGED_FILE_PATHS);
  const changedPaths = new Set(changedFilePaths);
  if (changedPaths.size !== allowedPaths.size) return false;
  for (const allowedPath of allowedPaths) {
    if (!changedPaths.has(allowedPath)) return false;
  }
  return true;
}

function isPhase5KModelCoreSourcePressureAdapterDiff(changedFilePaths: readonly string[]): boolean {
  const allowedPaths = new Set<string>(PHASE5C_K_MODELCORE_SOURCE_PRESSURE_ADAPTER_ALLOWED_CHANGED_FILE_PATHS);
  const changedPaths = new Set(changedFilePaths);
  if (changedPaths.size !== allowedPaths.size) return false;
  for (const allowedPath of allowedPaths) {
    if (!changedPaths.has(allowedPath)) return false;
  }
  return true;
}

function validateNoProductionClaims(label: string, text: string, issues: ValidationIssue[]): void {
  if (PRODUCTION_ENABLING_PATTERN.test(text)) {
    addIssue(issues, "error", "phase5c_g_production_claim", label, "Phase 5C-G sources must not enable runtime, official morphology, no-alternans, RV/interdependence/RHF, or TriSeg flags.");
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
    const hasLocalNegation = /\b(?:no|not|does not|do not|cannot|must not|without|neither|nor)\b/i.test(normalizedClause);
    const hasNoGoState = /\b(?:failed|blocked|not-claimed|not-interpretable|entry-blocked|positive-control-failed|blocked-until-positive-control-period2)\b/i.test(normalizedClause);
    const hasAffirmativeClaim = AFFIRMATIVE_BOUNDARY_PATTERN.test(normalizedClause);
    if (mentionsBoundaryObject && !hasLocalNegation && !hasNoGoState && hasAffirmativeClaim) {
      addIssue(issues, "error", "phase5c_g_forbidden_claim", label, `Phase 5C-G sources must not add affirmative boundary prose: ${normalizedClause}.`);
    }
  }
}

function getPhase5CGBoundaryText(file: TextFileInput): string {
  if (file.path === "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md") {
    return extractMarkdownSection(file.text, "### Phase 5C-G");
  }
  if (file.path === "docs/myocardium/README.md") {
    return extractTextBetween(file.text, "Phase 5C-G records", "## Imported bundle checks");
  }
  return file.text;
}

async function loadLivePhase5CReport(rootDir: string): Promise<unknown> {
  const previousVitest = process.env.VITEST;
  process.env.VITEST = "true";
  try {
    const module = await import("./verifyLandNewMyocardiumLowPreloadCheck");
    const input = module.loadLandNewMyocardiumLowPreloadValidationInput(rootDir);
    return input.report;
  } finally {
    if (previousVitest === undefined) delete process.env.VITEST;
    else process.env.VITEST = previousVitest;
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

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readTextFile(rootDir: string, relativePath: string): TextFileInput {
  return {
    path: relativePath,
    text: readFileSync(path.join(rootDir, relativePath), "utf8"),
  };
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

function isTransientToolPath(filePath: string): boolean {
  return /^vite\.config\.ts\.timestamp-\d+-[a-f0-9]+\.mjs$/.test(filePath);
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

function arrayEquals(actual: unknown, expected: readonly string[]): boolean {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every((value, index) => actual[index] === value);
}

function numbersClose(actual: unknown, expected: unknown): boolean {
  return typeof actual === "number"
    && typeof expected === "number"
    && Math.abs(actual - expected) <= 1e-12;
}

function positiveNumbersBroadlyClose(actual: unknown, expected: unknown): boolean {
  if (typeof actual !== "number"
    || typeof expected !== "number"
    || !Number.isFinite(actual)
    || !Number.isFinite(expected)
    || actual <= 0
    || expected <= 0) {
    return false;
  }
  const scale = Math.max(Math.abs(actual), Math.abs(expected), 1);
  return Math.abs(actual - expected) / scale <= 0.25;
}

function isStableHash(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}$/.test(value);
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

function printReport(report: Phase5CSameClosureSourceProviderAuditValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 5C-G same-closure source-provider audit validation ${status} `
    + `auditStatus=${report.auditStatus} providers=${report.providerIds.join(",")} `
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
    "Usage: npm run verify:myocardium-phase5c-same-closure-source-provider-audit -- [--root=DIR]",
    "",
    "Validates the Phase 5C-G same-closure source-provider audit snapshot.",
    "This verifier compares the static audit against the live Phase 5C-C report and keeps the PR #193 ModelCore-equivalent route proposed, not implemented.",
  ].join("\n"));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const report = validatePhase5CSameClosureSourceProviderAudit(
    await loadPhase5CSameClosureSourceProviderAuditValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  void main().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  });
}
