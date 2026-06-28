import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import baselineArtifact from "@/data/myocardium/protocols/atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1.json";
import {
  ATRIAL_BRIDGE_RUNTIME_BASELINE_EVIDENCE_ID,
  buildAtrialBridgeHighHrRuntimeBaselineEvidence,
  type AtrialBridgeHighHrRuntimeBaselineEvidence,
  type AtrialBridgeRuntimeBaselineId,
} from "@/tools/myocardium/buildAtrialBridgeHighHrRuntimeBaseline";

export type AtrialBridgeRuntimeBaselineValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type AtrialBridgeRuntimeBaselineValidationReport = {
  readonly pass: boolean;
  readonly evidence: AtrialBridgeHighHrRuntimeBaselineEvidence;
  readonly errors: readonly AtrialBridgeRuntimeBaselineValidationIssue[];
  readonly warnings: readonly AtrialBridgeRuntimeBaselineValidationIssue[];
};

export type AtrialBridgeRuntimeBaselineValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1.json";
const SOURCE_LOCALIZATION_PATH =
  "data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildAtrialBridgeHighHrRuntimeBaseline.ts";
const PACKAGE_PATH = "package.json";
const CURRENT_LANES_PATH = "docs/status/current-lanes.md";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/atrial-bridge-shootout-roadmap.md";
const DECISION_PATH = "data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json";

const EXPECTED_BASELINES: readonly AtrialBridgeRuntimeBaselineId[] = [
  "stock-active-no-provider-v0",
  "global-elastance-mode-v0",
] as const;
const EXPECTED_POINTS = ["normal-hr75-reference", "normal-hr90", "normal-hr105"] as const;
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
  "engine/harness.ts",
  "engine/presets.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "features/workbench",
  "officialCases.ts",
] as const;

export function validateAtrialBridgeHighHrRuntimeBaseline(
  rootDir = process.cwd(),
  options: AtrialBridgeRuntimeBaselineValidationOptions = {},
): AtrialBridgeRuntimeBaselineValidationReport {
  const errors: AtrialBridgeRuntimeBaselineValidationIssue[] = [];
  const warnings: AtrialBridgeRuntimeBaselineValidationIssue[] = [];
  const evidence = baselineArtifact as unknown as AtrialBridgeHighHrRuntimeBaselineEvidence;
  const shouldRebuild = options.rebuildEvidence ?? true;

  if (shouldRebuild) validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validateRuns(evidence, errors);
  validateComparison(evidence, errors, warnings);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateDocs(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5p5c_diagnostic_only",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5.5C is diagnostic runtime-boundary evidence only; Phase 6 bridge selection remains owner/oracle gated.",
  });
  if (!shouldRebuild) {
    warnings.push({
      severity: "warning",
      code: "phase5p5c_rebuild_not_run",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5.5C artifact freshness was not checked in this validation call.",
    });
  }

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: AtrialBridgeHighHrRuntimeBaselineEvidence,
  errors: AtrialBridgeRuntimeBaselineValidationIssue[],
): void {
  const fresh = buildAtrialBridgeHighHrRuntimeBaselineEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5p5c_stale_artifact", RESULT_ARTIFACT_PATH, "Runtime baseline artifact must match a fresh buildAtrialBridgeHighHrRuntimeBaselineEvidence() run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: AtrialBridgeHighHrRuntimeBaselineEvidence,
  errors: AtrialBridgeRuntimeBaselineValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ATRIAL_BRIDGE_RUNTIME_BASELINE_EVIDENCE_ID
    || evidence.phase !== "Phase 5.5C"
    || evidence.claimBoundary !== "diagnostic-runtime-boundary-baseline-only"
    || evidence.sourceLocalization !== SOURCE_LOCALIZATION_PATH
    || evidence.verifierScript !== "verify:myocardium-atrial-bridge-runtime-baseline"
  ) {
    addIssue(errors, "phase5p5c_identity", RESULT_ARTIFACT_PATH, "Runtime baseline identity or source links are invalid.");
  }
}

function validateProtocol(
  evidence: AtrialBridgeHighHrRuntimeBaselineEvidence,
  errors: AtrialBridgeRuntimeBaselineValidationIssue[],
): void {
  if (
    !arrayEquals(evidence.protocol.baselineIds, EXPECTED_BASELINES)
    || !arrayEquals(evidence.protocol.highHrSweepPoints.map((point) => point.id), EXPECTED_POINTS)
    || evidence.protocol.dtSec !== 0.001
    || evidence.protocol.sampleHz !== 480
    || evidence.protocol.tailWindowBeats < 4
    || evidence.protocol.measureBeats < 3
    || evidence.protocol.settlePolicy.capSeconds < 120
    || evidence.protocol.noExperimentalAtrialProviderForStockActive !== true
    || evidence.protocol.globalElastanceChangesWholeHeart !== true
  ) {
    addIssue(errors, "phase5p5c_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5.5C must compare stock active no-provider and global elastance under the shared HR75/90/105 baseline protocol.");
  }
}

function validateRuns(
  evidence: AtrialBridgeHighHrRuntimeBaselineEvidence,
  errors: AtrialBridgeRuntimeBaselineValidationIssue[],
): void {
  if (evidence.baselineRuns.length !== EXPECTED_BASELINES.length * EXPECTED_POINTS.length) {
    addIssue(errors, "phase5p5c_run_count", `${RESULT_ARTIFACT_PATH}.baselineRuns`, "Runtime baseline must cover every baseline and HR sweep point.");
  }
  for (const baselineId of EXPECTED_BASELINES) {
    for (const pointId of EXPECTED_POINTS) {
      const run = evidence.baselineRuns.find((item) =>
        item.baselineId === baselineId && item.sweepPointId === pointId
      );
      if (!run) {
        addIssue(errors, "phase5p5c_missing_run", `${RESULT_ARTIFACT_PATH}.baselineRuns`, `Missing runtime baseline run for ${baselineId}/${pointId}.`);
        continue;
      }
      if (run.experimentalAtrialProvider !== false) {
        addIssue(errors, "phase5p5c_no_provider", `${RESULT_ARTIFACT_PATH}.baselineRuns`, `Run ${baselineId}/${pointId} must not use experimental atrial providers.`);
      }
      if (run.window.sampleCount < 100 || !run.window.LA || !run.window.RA) {
        addIssue(errors, "phase5p5c_window_metrics", `${RESULT_ARTIFACT_PATH}.baselineRuns`, `Run ${baselineId}/${pointId} must record LA/RA window metrics.`);
      }
      if (!run.settled && run.window.windowKind !== "cap-tail-window") {
        addIssue(errors, "phase5p5c_cap_tail", `${RESULT_ARTIFACT_PATH}.baselineRuns`, `Cap run ${baselineId}/${pointId} must record a cap-tail-window.`);
      }
    }
  }
}

function validateComparison(
  evidence: AtrialBridgeHighHrRuntimeBaselineEvidence,
  errors: AtrialBridgeRuntimeBaselineValidationIssue[],
  warnings: AtrialBridgeRuntimeBaselineValidationIssue[],
): void {
  const stock75 = runFor(evidence, "stock-active-no-provider-v0", "normal-hr75-reference");
  const stock90 = runFor(evidence, "stock-active-no-provider-v0", "normal-hr90");
  const stock105 = runFor(evidence, "stock-active-no-provider-v0", "normal-hr105");
  if (stock75?.settled !== true || stock90?.settled !== true || stock105?.settled !== false) {
    addIssue(errors, "phase5p5c_stock_active_boundary", `${RESULT_ARTIFACT_PATH}.baselineRuns`, "Measured stock active no-provider boundary must settle at HR75/90 and cap at HR105.");
  }
  if (
    evidence.comparisonToPhase5p5b.a0ExperimentalHr90Settled !== true
    || evidence.comparisonToPhase5p5b.a0ExperimentalHr90SettleReason !== "converged"
    || evidence.comparisonToPhase5p5b.a0ExperimentalHr105Settled !== false
    || evidence.comparisonToPhase5p5b.a0ExperimentalHr105SettleReason !== "cap"
    || evidence.comparisonToPhase5p5b.stockActiveHr90Settled !== true
    || evidence.comparisonToPhase5p5b.stockActiveHr105Settled !== false
    || evidence.comparisonToPhase5p5b.hr105BoundaryInterpretation !== "shared-stock-active-runtime-boundary-supported"
    || evidence.summary.highHrBoundaryAttribution !== "runtime-boundary-likely"
  ) {
    addIssue(errors, "phase5p5c_runtime_boundary_interpretation", `${RESULT_ARTIFACT_PATH}.comparisonToPhase5p5b`, "Phase 5.5C should classify HR105 as shared stock-active runtime boundary evidence, not provider-specific bridge failure.");
  }
  if (
    evidence.comparisonToPhase5p5b.sourceLocalizationEvidenceId !== "atrial-bridge-blocker-localization-phase5p5b-result-v1"
    || evidence.comparisonToPhase5p5b.sourceLocalizationPhase !== "Phase 5.5B"
  ) {
    addIssue(errors, "phase5p5c_source_localization_identity", `${RESULT_ARTIFACT_PATH}.comparisonToPhase5p5b`, "Phase 5.5C must explicitly record the Phase 5.5B localization source identity before comparing A0 HR105.");
  }
  if (evidence.summary.selectedCandidateId !== null || evidence.summary.recommendedCandidateId !== null) {
    addIssue(errors, "phase5p5c_no_selection", `${RESULT_ARTIFACT_PATH}.summary`, "Runtime baseline may not select or recommend a Phase 6 atrial bridge.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5p5c_global_elastance_reference_only",
    path: `${RESULT_ARTIFACT_PATH}.baselineRuns`,
    message: "Global elastance mode changes the whole-heart model and is reference-only, not bridge-selection evidence.",
  });
}

function validateBoundary(
  evidence: AtrialBridgeHighHrRuntimeBaselineEvidence,
  errors: AtrialBridgeRuntimeBaselineValidationIssue[],
): void {
  if (
    evidence.boundary.noProductionRuntimeWiring !== true
    || evidence.boundary.noOfficialCaseReauthoring !== true
    || evidence.boundary.noWorkbenchRuntimeWiring !== true
    || evidence.boundary.noStateSchemaMigration !== true
    || evidence.boundary.noAtrialLandRdqClaim !== true
    || evidence.boundary.noAfValidationClaim !== true
    || evidence.boundary.noFinalAtrialPhysiologyClaim !== true
    || evidence.boundary.noMorphologyAcceptance !== true
  ) {
    addIssue(errors, "phase5p5c_claim_boundary", `${RESULT_ARTIFACT_PATH}.boundary`, "Runtime baseline must keep production, final atrial physiology, AF, state schema, Workbench, and morphology claims blocked.");
  }
}

function validateSourceText(rootDir: string, errors: AtrialBridgeRuntimeBaselineValidationIssue[]): void {
  const packageText = readOptional(rootDir, PACKAGE_PATH);
  if (!packageText.includes("\"verify:myocardium-atrial-bridge-runtime-baseline\"")) {
    addIssue(errors, "phase5p5c_package_script", PACKAGE_PATH, "package.json must expose verify:myocardium-atrial-bridge-runtime-baseline.");
  }
  const builderText = readOptional(rootDir, BUILDER_PATH);
  for (const token of [
    "stock-active-no-provider-v0",
    "global-elastance-mode-v0",
    "experimentalAtrialProvider: false",
    "noExperimentalAtrialProviderForStockActive: true",
    "globalElastanceChangesWholeHeart: true",
  ]) {
    if (!builderText.includes(token)) {
      addIssue(errors, "phase5p5c_builder_boundary", BUILDER_PATH, `Runtime baseline builder must include boundary token ${token}.`);
    }
  }
}

function validateDocs(rootDir: string, errors: AtrialBridgeRuntimeBaselineValidationIssue[]): void {
  const currentLanes = readOptional(rootDir, CURRENT_LANES_PATH);
  if (
    !currentLanes.includes("Phase 5.5C")
    || !currentLanes.includes("runtime-boundary-likely")
    || !currentLanes.includes("stock active no-provider")
  ) {
    addIssue(errors, "phase5p5c_current_lanes", CURRENT_LANES_PATH, "Current lanes must record Phase 5.5C runtime-boundary baseline evidence.");
  }
  const readme = readOptional(rootDir, README_PATH);
  if (!readme.includes("Phase 5.5C") || !readme.includes("runtime-boundary")) {
    addIssue(errors, "phase5p5c_readme", README_PATH, "Myocardium README must summarize Phase 5.5C runtime baseline evidence.");
  }
  const roadmap = readOptional(rootDir, ROADMAP_PATH);
  if (!roadmap.includes("atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1")) {
    addIssue(errors, "phase5p5c_roadmap", ROADMAP_PATH, "Atrial bridge roadmap must point to the Phase 5.5C runtime baseline result.");
  }
  const decision = JSON.parse(readOptional(rootDir, DECISION_PATH)) as { selection?: { selectedCandidateId?: unknown }; status?: unknown };
  if (decision.status !== "PENDING_OWNER" || decision.selection?.selectedCandidateId !== null) {
    addIssue(errors, "phase5p5c_decision_pending", DECISION_PATH, "Decision 21 must remain PENDING_OWNER with selectedCandidateId null.");
  }
}

function validateNoProductionWiring(rootDir: string, errors: AtrialBridgeRuntimeBaselineValidationIssue[]): void {
  const forbidden = [
    "atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1",
    "stock-active-no-provider-v0",
    "global-elastance-mode-v0",
  ];
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!exists(absolutePath)) continue;
    if (statSync(absolutePath).isDirectory()) {
      for (const filePath of walkFiles(absolutePath)) scanProductionText(rootDir, filePath, forbidden, errors);
    } else {
      scanProductionText(rootDir, absolutePath, forbidden, errors);
    }
  }
}

function scanProductionText(
  rootDir: string,
  filePath: string,
  forbidden: readonly string[],
  errors: AtrialBridgeRuntimeBaselineValidationIssue[],
): void {
  const relativePath = path.relative(rootDir, filePath);
  if (!/\.(ts|tsx|json)$/.test(relativePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const token of forbidden) {
    if (text.includes(token)) {
      addIssue(errors, "phase5p5c_no_production_wiring", relativePath, `Production-facing file must not wire Phase 5.5C diagnostic token ${token}.`);
    }
  }
}

function runFor(
  evidence: AtrialBridgeHighHrRuntimeBaselineEvidence,
  baselineId: AtrialBridgeRuntimeBaselineId,
  pointId: typeof EXPECTED_POINTS[number],
) {
  return evidence.baselineRuns.find((run) =>
    run.baselineId === baselineId && run.sweepPointId === pointId
  );
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const filePath = path.join(dir, entry);
    return statSync(filePath).isDirectory() ? walkFiles(filePath) : [filePath];
  });
}

function readOptional(rootDir: string, relativePath: string): string {
  return readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(filePath: string): boolean {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function arrayEquals<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function addIssue(
  issues: AtrialBridgeRuntimeBaselineValidationIssue[],
  code: string,
  issuePath: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: issuePath, message });
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/verifyAtrialBridgeHighHrRuntimeBaseline.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const report = validateAtrialBridgeHighHrRuntimeBaseline(process.cwd(), {
    rebuildEvidence: !process.argv.includes("--no-rebuild"),
  });
  for (const warning of report.warnings) {
    console.warn(`[${warning.code}] ${warning.path}: ${warning.message}`);
  }
  if (!report.pass) {
    for (const error of report.errors) {
      console.error(`[${error.code}] ${error.path}: ${error.message}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Atrial bridge Phase 5.5C high-HR runtime baseline verification passed.");
  }
}
