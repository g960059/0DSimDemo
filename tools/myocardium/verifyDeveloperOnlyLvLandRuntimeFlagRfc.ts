import { readFileSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_RFC_ID,
  buildDeveloperOnlyLvLandRuntimeFlagRfc,
  type MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
} from "@/tools/myocardium/buildDeveloperOnlyLvLandRuntimeFlagRfc";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type DeveloperOnlyLvLandRuntimeFlagRfcValidationReport = {
  readonly pass: boolean;
  readonly evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json";
const HELPER_PATH = "tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag.ts";
const BUILDER_PATH = "tools/myocardium/buildDeveloperOnlyLvLandRuntimeFlagRfc.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const PRODUCTION_TARGET_PATHS = [
  "caseCloud.ts",
  "caseDoc.ts",
  "casePersist.ts",
  "caseValidation.ts",
  "components/Cases.tsx",
  "constants.ts",
  "controllerCatalog.ts",
  "controllerItems.ts",
  "engine/ModelCore.ts",
  "engine/caseBaselines.ts",
  "engine/caseResolve.ts",
  "engine/core/params.ts",
  "engine/core/stateLayout.ts",
  "engine/guytonStarlingChainProtocol.ts",
  "engine/guytonStarlingChainWorker.ts",
  "engine/guytonStarlingChainWorkerCore.ts",
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/harness.ts",
  "engine/presets.ts",
  "engine/previewController.ts",
  "engine/previewWorker.ts",
  "engine/previewWorkerProtocol.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "engine/steadyJob.ts",
  "engine/transitionSteadyProtocol.ts",
  "engine/transitionSteadyWorker.ts",
  "features/workbench/WorkbenchRoute.tsx",
  "features/workbench/casePublish.ts",
  "features/workbench/controllerBinding.ts",
  "features/workbench/instanceRuntime.ts",
  "features/workbench/publish/PublishDialog.tsx",
  "features/workbench/publish/usePreviewRuntime.ts",
  "features/workbench/workbenchDefaults.ts",
  "WorkbenchPage.tsx",
  "officialCases.ts",
  "features/workbench/hooks/useWorkbenchScene.ts",
  "features/workbench/hooks/useWorkbenchSimulation.ts",
  "features/workbench/hooks/useWorkbenchPersistence.ts",
] as const;

export function validateDeveloperOnlyLvLandRuntimeFlagRfc(rootDir = process.cwd()):
DeveloperOnlyLvLandRuntimeFlagRfcValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildDeveloperOnlyLvLandRuntimeFlagRfc();
  const artifact = resultArtifact as MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);
  validateProductionTargets(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_RFC_ID
    || evidence.phase !== "Phase 5U"
    || evidence.claimBoundary !== "developer-only-runtime-flag-rfc-no-runtime-wiring"
    || evidence.upstreamPhase5TArtifactId !== "myocardium-education-tool-dod-checkpoint-v1"
    || evidence.verifierScript !== "verify:myocardium-developer-only-lv-land-runtime-flag-rfc"
  ) {
    addIssue(errors, "phase5u_identity", "live-evidence", "Phase 5U evidence must identify the developer-only runtime-flag RFC boundary.");
  }
  validateOwnerDecision(evidence, errors);
  validateRuntimeFlagContract(evidence, errors);
  validateImplementationStatus(evidence, errors);
  validateSmoke(evidence, errors);
  validateBoundary(evidence, errors);
  validateDoesNotUnlock(evidence, errors);
  warnings.push({
    severity: "warning",
    code: "phase5u_rfc_only_owner_decision_needed",
    path: "live-evidence.ownerDecision",
    message: "Phase 5U defines a developer-only flag helper/RFC, but implementation beyond tools remains blocked until owner decision.",
  });
}

function validateOwnerDecision(
  evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  errors: ValidationIssue[],
): void {
  if (
    evidence.ownerDecision.status !== "rfc-draft-owner-decision-needed"
    || evidence.ownerDecision.accepted !== false
    || !evidence.ownerDecision.decisionQuestion.includes("developer-only LV Land runtime flag")
  ) {
    addIssue(errors, "phase5u_owner_decision", "live-evidence.ownerDecision", "Phase 5U must stop at RFC draft with owner decision still required.");
  }
}

function validateRuntimeFlagContract(
  evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  errors: ValidationIssue[],
): void {
  const contract = evidence.runtimeFlagContract;
  if (
    contract.flagId !== MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID
    || contract.helperModule !== HELPER_PATH
    || contract.acknowledgementRequired !== MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT
    || contract.sourceProviderScope !== "LV-only"
    || !contract.sourceProviderId.includes("phase5u-developer-only-be-phase5q-calcium")
    || contract.commitScheme !== "BE"
    || contract.calciumMappingSource.artifactId !== "modelcore-land-calcium-unit-interface-audit-result-v1"
    || contract.calciumMappingSource.scenarioId !== "phase2b-absolute-peak-ca"
    || contract.calciumMappingSource.calciumScale <= 1
    || contract.calciumMappingSource.fixedFromPhase5Q !== true
    || contract.calciumMappingSource.noTuningInHelper !== true
    || contract.modelCoreInterface.usesExperimentalActiveSourceProviders !== true
    || contract.modelCoreInterface.noModelCoreConstructorSignatureChange !== true
    || contract.modelCoreInterface.noProductionRegistryIntegration !== true
  ) {
    addIssue(errors, "phase5u_runtime_flag_contract", "live-evidence.runtimeFlagContract", "Phase 5U helper must remain LV-only, BE, Phase5Q-mapped, explicit-acknowledgement, and non-production.");
  }
}

function validateImplementationStatus(
  evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  errors: ValidationIssue[],
): void {
  const status = evidence.implementationStatus;
  if (
    status.helperDefined !== true
    || status.productionRuntimeWiring !== "absent"
    || status.officialCaseWiring !== "absent"
    || status.workbenchRuntimeWiring !== "absent"
    || status.stateSchemaMigration !== "absent"
    || status.runtimeFlagUi !== "absent"
  ) {
    addIssue(errors, "phase5u_implementation_status", "live-evidence.implementationStatus", "Phase 5U may define a tools helper only; all runtime/case/workbench/schema/UI wiring must remain absent.");
  }
}

function validateSmoke(
  evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  errors: ValidationIssue[],
): void {
  if (
    evidence.smoke.modelCoreConstructsWithFlag !== true
    || evidence.smoke.debugProviderIdMatches !== true
    || evidence.smoke.debugProviderIds.LV !== evidence.runtimeFlagContract.sourceProviderId
    || evidence.smoke.providerStateDiagnosticsAvailable !== true
  ) {
    addIssue(errors, "phase5u_smoke", "live-evidence.smoke", "Phase 5U helper must construct a ModelCore with an LV debug-visible experimental provider.");
  }
}

function validateBoundary(
  evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  errors: ValidationIssue[],
): void {
  if (
    evidence.boundary.noRuntimeReplacement !== true
    || evidence.boundary.noOfficialCaseReauthoring !== true
    || evidence.boundary.noWorkbenchRuntimeWiring !== true
    || evidence.boundary.noStateSchemaMigration !== true
    || evidence.boundary.noModelCoreGlobalIntegratorChange !== true
    || evidence.boundary.noLevel3Acceptance !== true
    || evidence.boundary.noLevel4Acceptance !== true
    || evidence.boundary.noOfficialMorphologyAcceptance !== true
    || evidence.boundary.noFinalNoAlternansAcceptance !== true
    || evidence.boundary.noStructuralAlternansRemovalClaim !== true
  ) {
    addIssue(errors, "phase5u_boundary", "live-evidence.boundary", "Phase 5U must not unlock runtime, schema, acceptance, morphology, or no-alternans claims.");
  }
  for (const blocked of [
    "production runtime replacement",
    "official case reauthoring against Land",
    "Workbench runtime wiring",
    "runtime flag UI",
    "state schema migration",
  ] as const) {
    if (!evidence.blockedUntilOwnerDecision.includes(blocked)) {
      addIssue(errors, "phase5u_blocked_until_owner", "live-evidence.blockedUntilOwnerDecision", `${blocked} must remain blocked until owner decision.`);
    }
  }
}

function validateDoesNotUnlock(
  evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  errors: ValidationIssue[],
): void {
  for (const token of [
    "runtimeReplacement",
    "officialCaseWiring",
    "workbenchRuntimeWiring",
    "stateSchemaMigration",
    "officialMorphologyAcceptance",
    "finalNoAlternans",
    "structuralAlternansRemoval",
    "Level3Acceptance",
    "Level4Acceptance",
    "clinicalDecisionSupport",
    "scientificValidationClaim",
  ] as const) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5u_does_not_unlock", "live-evidence.doesNotUnlock", `Phase 5U must keep ${token} blocked.`);
    }
  }
}

function validateArtifact(
  artifact: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  evidence: MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5u_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match live Phase 5U evidence.");
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const helperText = readRequiredText(rootDir, HELPER_PATH, errors);
  const builderText = readRequiredText(rootDir, BUILDER_PATH, errors);
  const readmeText = readRequiredText(rootDir, README_PATH, errors);
  const roadmapText = readRequiredText(rootDir, ROADMAP_PATH, errors);
  const packageText = readRequiredText(rootDir, "package.json", errors);

  if (
    helperText
    && (!helperText.includes(MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT)
      || !helperText.includes("phase5u-developer-only-be-phase5q-calcium")
      || !helperText.includes("activeSourceProviders: { LV: provider }"))
  ) {
    addIssue(errors, "phase5u_helper_contract", HELPER_PATH, "Helper must require acknowledgement and return only an LV experimental source provider.");
  }
  if (
    builderText
    && (!builderText.includes("developer-only-runtime-flag-rfc-no-runtime-wiring")
      || !builderText.includes("rfc-draft-owner-decision-needed")
      || /accepted\s*:\s*true/.test(builderText))
  ) {
    addIssue(errors, "phase5u_builder_boundary", BUILDER_PATH, "Builder must keep Phase 5U RFC-only and owner-decision-pending.");
  }
  const normalizedReadmeText = readmeText?.replace(/\s+/g, " ");
  if (
    normalizedReadmeText
    && (!normalizedReadmeText.includes("Phase 5U")
      || !normalizedReadmeText.includes("developer-only LV Land runtime-flag RFC")
      || !normalizedReadmeText.includes("owner decision is still required"))
  ) {
    addIssue(errors, "phase5u_readme", README_PATH, "README must record Phase 5U as an RFC requiring owner decision.");
  }
  if (
    roadmapText
    && (!roadmapText.includes("Phase 5U")
      || !roadmapText.includes("developer-only LV Land runtime-flag RFC")
      || !roadmapText.includes("no runtime replacement"))
  ) {
    addIssue(errors, "phase5u_roadmap", ROADMAP_PATH, "Roadmap must record Phase 5U and keep runtime replacement blocked.");
  }
  if (packageText && !packageText.includes("verify:myocardium-developer-only-lv-land-runtime-flag-rfc")) {
    addIssue(errors, "phase5u_package_script", "package.json", "package.json must expose the Phase 5U verifier script.");
  }
}

function validateProductionTargets(rootDir: string, errors: ValidationIssue[]): void {
  for (const filePath of PRODUCTION_TARGET_PATHS) {
    const text = readRequiredText(rootDir, filePath, errors);
    if (!text) continue;
    if (
      text.includes("modelCoreDeveloperOnlyLandRuntimeFlag")
      || text.includes(MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID)
      || text.includes("phase5u-developer-only-be-phase5q-calcium")
    ) {
      addIssue(errors, "phase5u_runtime_leak", filePath, "Developer-only Phase 5U helper must not be imported or referenced by production runtime, case, or Workbench files.");
    }
  }
}

function readRequiredText(rootDir: string, filePath: string, errors: ValidationIssue[]): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
    addIssue(errors, "phase5u_missing_source", filePath, `${filePath} must be readable for Phase 5U validation.`);
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

function printReport(report: DeveloperOnlyLvLandRuntimeFlagRfcValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `Developer-only LV Land runtime flag RFC ${status} `
    + `ownerDecision=${report.evidence.ownerDecision.status} `
    + `sourceProvider=${report.evidence.runtimeFlagContract.sourceProviderId} `
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
  const report = validateDeveloperOnlyLvLandRuntimeFlagRfc();
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
