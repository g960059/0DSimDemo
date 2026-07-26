import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json";
import {
  ATRIAL_BRIDGE_SHOOTOUT_EVIDENCE_ID,
  buildAtrialBridgeShootoutEvidence,
  type AtrialBridgeCandidateId,
  type AtrialBridgeClosedLoopRun,
  type AtrialBridgeIsolatedRun,
  type AtrialBridgeShootoutEvidence,
} from "@/tools/myocardium/buildAtrialBridgeShootout";

export type AtrialBridgeShootoutValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type AtrialBridgeShootoutValidationReport = {
  readonly pass: boolean;
  readonly evidence: AtrialBridgeShootoutEvidence;
  readonly errors: readonly AtrialBridgeShootoutValidationIssue[];
  readonly warnings: readonly AtrialBridgeShootoutValidationIssue[];
};

export type AtrialBridgeShootoutValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildAtrialBridgeShootout.ts";
const VERIFIER_PATH = "tools/myocardium/verifyAtrialBridgeShootout.ts";
const PACKAGE_PATH = "package.json";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/atrial-bridge-shootout-roadmap.md";
const DECISION_PATH = "data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json";

const EXPECTED_CANDIDATES: readonly AtrialBridgeCandidateId[] = [
  "atrial-elastance-negative-control-v0",
  "legacy-atrial-active-bridge-v0",
  "atrial-reservoir-booster-bridge-v1",
] as const;
const EXPECTED_POINTS = ["normal", "low-preload", "high-preload", "high-hr"] as const;
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

export function validateAtrialBridgeShootout(
  rootDir = process.cwd(),
  options: AtrialBridgeShootoutValidationOptions = {},
):
AtrialBridgeShootoutValidationReport {
  const errors: AtrialBridgeShootoutValidationIssue[] = [];
  const warnings: AtrialBridgeShootoutValidationIssue[] = [];
  const evidence = resultArtifact as unknown as AtrialBridgeShootoutEvidence;

  if (options.rebuildEvidence) validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validateRunCoverage(evidence, errors);
  validateRecommendation(evidence, errors, warnings);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateDocs(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5p5_recommendation_only",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5.5 measures atrial bridge candidates and records a recommendation status only; owner selection remains pending.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: AtrialBridgeShootoutEvidence,
  errors: AtrialBridgeShootoutValidationIssue[],
): void {
  const fresh = buildAtrialBridgeShootoutEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(
      errors,
      "phase5p5_stale_artifact",
      RESULT_ARTIFACT_PATH,
      "Result artifact must match a fresh buildAtrialBridgeShootoutEvidence() run.",
    );
  }
}

function validateIdentity(
  evidence: AtrialBridgeShootoutEvidence,
  errors: AtrialBridgeShootoutValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ATRIAL_BRIDGE_SHOOTOUT_EVIDENCE_ID
    || evidence.phase !== "Phase 5.5"
    || evidence.claimBoundary !== "temporary-atrial-bridge-shootout-recommendation-only"
    || evidence.verifierScript !== "verify:myocardium-atrial-bridge-shootout"
    || evidence.relatedProtocol !== "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-protocols.json"
    || evidence.relatedTargets !== "data/myocardium/targets/atrial-bridge-targets-v1.json"
    || evidence.relatedDecision !== DECISION_PATH
  ) {
    addIssue(errors, "phase5p5_identity", RESULT_ARTIFACT_PATH, "Atrial bridge shootout evidence identity or related-artifact links are invalid.");
  }
  if (
    evidence.ownerDirection.atriaModeling !== "correct-refined-model-through-oracle-staged-introduction"
    || evidence.ownerDirection.studioWorkbenchMock !== "owner-led-not-in-this-lane"
    || evidence.ownerDirection.morphologyLane !== "allowed-later-when-timing-is-appropriate"
  ) {
    addIssue(errors, "phase5p5_owner_direction", `${RESULT_ARTIFACT_PATH}.ownerDirection`, "Owner direction must keep atrial modeling in the math-model lane and leave Studio/Workbench mock work owner-led.");
  }
}

function validateProtocol(
  evidence: AtrialBridgeShootoutEvidence,
  errors: AtrialBridgeShootoutValidationIssue[],
): void {
  if (
    !arrayEquals(evidence.protocol.candidateIds, EXPECTED_CANDIDATES)
    || !arrayEquals(evidence.protocol.isolatedChambers, ["LA", "RA"])
    || evidence.protocol.closedLoopSmokePoints.length !== EXPECTED_POINTS.length
    || !arrayEquals(evidence.protocol.closedLoopSmokePoints.map((point) => point.id), EXPECTED_POINTS)
    || evidence.protocol.dtSec !== 0.001
    || evidence.protocol.sampleHz !== 480
    || evidence.protocol.isolatedWarmupBeats < 8
    || evidence.protocol.isolatedMeasureBeats < 2
    || evidence.protocol.closedLoopMeasureBeats < 3
    || evidence.protocol.settlePolicy.capSeconds < 120
    || evidence.protocol.settlePolicy.postSettleBeats < 2
    || evidence.protocol.sameBoundaryForAllCandidates !== true
    || evidence.protocol.sameSamplingGridsForAllCandidates !== true
  ) {
    addIssue(errors, "phase5p5_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5.5 must measure E0/A0/A1 under shared isolated and closed-loop protocols with explicit steady-state policy.");
  }
}

function validateRunCoverage(
  evidence: AtrialBridgeShootoutEvidence,
  errors: AtrialBridgeShootoutValidationIssue[],
): void {
  const isolated = evidence.isolatedRuns;
  const closed = evidence.closedLoopRuns;
  if (
    evidence.runHealth.isolatedRunCount !== 6
    || evidence.runHealth.isolatedFiniteRunCount !== isolated.filter((run) => run.finite).length
    || evidence.runHealth.closedLoopRunCount !== 12
    || evidence.runHealth.closedLoopSettledCount !== closed.filter((run) => run.settled).length
    || evidence.runHealth.closedLoopHealthOkCount !== closed.filter((run) => run.healthStatus === "ok").length
    || evidence.runHealth.closedLoopProjectorQuietCount !== closed.filter((run) => run.projectorQuiet).length
    || evidence.runHealth.allCandidatesMeasuredUnderSameProtocol !== true
    || evidence.runHealth.allClosedLoopRunsRecordSettleStatus !== true
  ) {
    addIssue(errors, "phase5p5_run_health", `${RESULT_ARTIFACT_PATH}.runHealth`, "Run-health counts must match measured isolated and closed-loop runs.");
  }

  for (const candidateId of EXPECTED_CANDIDATES) {
    for (const chamber of ["LA", "RA"] as const) {
      const run = isolated.find((item) => item.candidateId === candidateId && item.chamber === chamber);
      validateIsolatedRun(candidateId, chamber, run, errors);
    }
    for (const pointId of EXPECTED_POINTS) {
      const run = closed.find((item) => item.candidateId === candidateId && item.pointId === pointId);
      validateClosedLoopRun(candidateId, pointId, run, errors);
    }
  }

  const highHrRuns = closed.filter((run) => run.pointId === "high-hr");
  if (!highHrRuns.every((run) => run.settled === false && run.settleReason === "cap")) {
    addIssue(errors, "phase5p5_high_hr_gap", `${RESULT_ARTIFACT_PATH}.closedLoopRuns`, "Current result must preserve the observed high-HR common non-settle gap instead of selecting around it.");
  }
}

function validateIsolatedRun(
  candidateId: AtrialBridgeCandidateId,
  chamber: "LA" | "RA",
  run: AtrialBridgeIsolatedRun | undefined,
  errors: AtrialBridgeShootoutValidationIssue[],
): void {
  if (!run) {
    addIssue(errors, "phase5p5_missing_isolated_run", `${RESULT_ARTIFACT_PATH}.isolatedRuns`, `Missing isolated run for ${candidateId} ${chamber}.`);
    return;
  }
  if (!run.finite || !Number.isFinite(run.metrics.pvLoopRoughness240) || !Number.isFinite(run.metrics.pvLoopRoughness480)) {
    addIssue(errors, "phase5p5_isolated_finite", `${RESULT_ARTIFACT_PATH}.isolatedRuns`, `Isolated run for ${candidateId} ${chamber} must be finite with roughness on two grids.`);
  }
  if (candidateId === "atrial-elastance-negative-control-v0" && run.metrics.boosterPressureFraction !== 0) {
    addIssue(errors, "phase5p5_e0_no_booster", `${RESULT_ARTIFACT_PATH}.isolatedRuns`, "E0 is a negative control and must not report booster contribution.");
  }
}

function validateClosedLoopRun(
  candidateId: AtrialBridgeCandidateId,
  pointId: typeof EXPECTED_POINTS[number],
  run: AtrialBridgeClosedLoopRun | undefined,
  errors: AtrialBridgeShootoutValidationIssue[],
): void {
  if (!run) {
    addIssue(errors, "phase5p5_missing_closed_loop_run", `${RESULT_ARTIFACT_PATH}.closedLoopRuns`, `Missing closed-loop run for ${candidateId} ${pointId}.`);
    return;
  }
  if (!run.settleReason || !Number.isFinite(run.settleBeats) || !Number.isFinite(run.periodBeats)) {
    addIssue(errors, "phase5p5_settle_record", `${RESULT_ARTIFACT_PATH}.closedLoopRuns`, `Closed-loop run for ${candidateId} ${pointId} must record settle status.`);
  }
  if (pointId !== "high-hr" && (run.settled !== true || run.healthStatus !== "ok" || run.projectorQuiet !== true || !run.LA || !run.RA)) {
    addIssue(errors, "phase5p5_main_points_settled", `${RESULT_ARTIFACT_PATH}.closedLoopRuns`, `Closed-loop ${pointId} run for ${candidateId} must settle with health ok and quiet projector.`);
  }
  if (pointId !== "high-hr" && run.LA && run.RA) {
    if (!("beatRepeatabilityDelta" in run.LA) || !("beatRepeatabilityDelta" in run.RA)) {
      addIssue(errors, "phase5p5_repeatability_record", `${RESULT_ARTIFACT_PATH}.closedLoopRuns`, `Closed-loop ${pointId} run for ${candidateId} must record atrial loop repeatability, even when the value is a blocker.`);
    }
  }
}

function validateRecommendation(
  evidence: AtrialBridgeShootoutEvidence,
  errors: AtrialBridgeShootoutValidationIssue[],
  warnings: AtrialBridgeShootoutValidationIssue[],
): void {
  if (
    evidence.recommendation.selectedCandidateId !== null
    || evidence.recommendation.status !== "recommendation-only-owner-selection-still-required"
  ) {
    addIssue(errors, "phase5p5_owner_selection_not_allowed", `${RESULT_ARTIFACT_PATH}.recommendation`, "Verifier may not select a Phase 6 atrial bridge; Decision 21 remains owner-owned.");
  }
  if (evidence.recommendation.recommendedCandidateId !== null) {
    addIssue(errors, "phase5p5_recommendation_blocked", `${RESULT_ARTIFACT_PATH}.recommendation`, "Current result must not recommend a candidate while all candidates share the high-HR non-settle gap.");
  }
  if (!evidence.recommendation.rationale.some((line) => line.includes("high-hr"))) {
    addIssue(errors, "phase5p5_high_hr_rationale", `${RESULT_ARTIFACT_PATH}.recommendation.rationale`, "Recommendation rationale must explicitly record the high-HR common non-settle blocker.");
  }
  const a1 = evidence.candidateSummaries.find((summary) => summary.candidateId === "atrial-reservoir-booster-bridge-v1");
  if (!a1?.boosterPreserved || a1.qDotContaminationNoWorseThanA0 !== true) {
    addIssue(errors, "phase5p5_a1_positive_checks", `${RESULT_ARTIFACT_PATH}.candidateSummaries`, "A1 must preserve booster/A-loop structure and avoid worse qDot contamination relative to A0 before it can proceed.");
  }
  if (
    a1?.valveDiodeContaminationNoWorseThanA0 !== false
    || a1.contaminationNoWorseThanA0 !== false
    || a1.repeatabilityAllSettledMainPointsOk !== false
    || a1.roughnessSamplingInvariantVsA0 !== false
    || a1.selectableByScript !== false
  ) {
    addIssue(errors, "phase5p5_a1_blockers", `${RESULT_ARTIFACT_PATH}.candidateSummaries`, "A1 must explicitly record current valve-event contamination, repeatability, and roughness sampling-invariance blockers.");
  }
  for (const token of ["valve diode", "repeatability", "sampling-invariant"]) {
    if (!evidence.recommendation.rationale.some((line) => line.includes(token))) {
      addIssue(errors, "phase5p5_a1_blocker_rationale", `${RESULT_ARTIFACT_PATH}.recommendation.rationale`, `Recommendation rationale must mention A1 ${token} blocker.`);
    }
  }
  warnings.push({
    severity: "warning",
    code: "phase5p5_a1_partial_signal_not_selected",
    path: `${RESULT_ARTIFACT_PATH}.candidateSummaries`,
    message: "A1 has partial positive signals, but high-HR settling, valve-event contamination, repeatability, and roughness sampling-invariance block selection.",
  });
}

function validateBoundary(
  evidence: AtrialBridgeShootoutEvidence,
  errors: AtrialBridgeShootoutValidationIssue[],
): void {
  const status = evidence.implementationStatus;
  if (
    status.experimentalAtrialProvidersImplemented !== true
    || status.candidateScope !== "LA-RA-only"
    || status.productionRuntimeWiring !== "absent"
    || status.officialCaseWiring !== "absent"
    || status.workbenchRuntimeWiring !== "absent"
    || status.stateSchemaMigration !== "absent"
    || status.atrialLandRdqImplementation !== "absent"
  ) {
    addIssue(errors, "phase5p5_implementation_boundary", `${RESULT_ARTIFACT_PATH}.implementationStatus`, "Phase 5.5 may implement only experimental LA/RA providers and measured evidence.");
  }
  if (
    evidence.boundary.noProductionRuntimeWiring !== true
    || evidence.boundary.noOfficialCaseReauthoring !== true
    || evidence.boundary.noWorkbenchRuntimeWiring !== true
    || evidence.boundary.noStateSchemaMigration !== true
    || evidence.boundary.noAtrialLandRdqClaim !== true
    || evidence.boundary.noAfValidationClaim !== true
    || evidence.boundary.noFinalAtrialPhysiologyClaim !== true
    || evidence.boundary.noLvRvLandAcceptance !== true
    || evidence.boundary.noMorphologyAcceptance !== true
  ) {
    addIssue(errors, "phase5p5_claim_boundary", `${RESULT_ARTIFACT_PATH}.boundary`, "Atrial bridge shootout must keep production, final atrial physiology, LV/RV Land, AF, and morphology claims blocked.");
  }
}

function validateSourceText(rootDir: string, errors: AtrialBridgeShootoutValidationIssue[]): void {
  const packageText = readOptional(rootDir, PACKAGE_PATH);
  if (!packageText.includes("\"verify:myocardium-atrial-bridge-shootout\"")) {
    addIssue(errors, "phase5p5_package_script", PACKAGE_PATH, "package.json must expose verify:myocardium-atrial-bridge-shootout.");
  }
  const builderText = readOptional(rootDir, BUILDER_PATH);
  for (const candidateId of EXPECTED_CANDIDATES) {
    if (!builderText.includes(candidateId)) {
      addIssue(errors, "phase5p5_builder_candidates", BUILDER_PATH, `Builder must implement candidate ${candidateId}.`);
    }
  }
  if (
    !builderText.includes("createAtrialBridgeProviders")
    || !builderText.includes("productionRuntimeWiring: \"absent\"")
    || !builderText.includes("owner selection remains explicit")
  ) {
    addIssue(errors, "phase5p5_builder_boundary", BUILDER_PATH, "Builder must expose experimental providers and keep production/owner-selection boundaries explicit.");
  }
}

function validateDocs(rootDir: string, errors: AtrialBridgeShootoutValidationIssue[]): void {
  const readme = readOptional(rootDir, README_PATH);
  if (!readme.includes("Phase 5.5") || !readme.includes("A1") || !readme.includes("high-HR")) {
    addIssue(errors, "phase5p5_readme", README_PATH, "Myocardium README must summarize the Phase 5.5 measured shootout and blocker.");
  }
  const roadmap = readOptional(rootDir, ROADMAP_PATH);
  if (!roadmap.includes("atrial-bridge-shootout-phase5p5-result-v1") || !roadmap.includes("recommendation-only")) {
    addIssue(errors, "phase5p5_roadmap", ROADMAP_PATH, "Atrial bridge roadmap must point to the measured result and recommendation-only boundary.");
  }
  const decision = JSON.parse(readOptional(rootDir, DECISION_PATH)) as { selection?: { selectedCandidateId?: unknown }; status?: unknown };
  if (decision.status !== "PENDING_OWNER" || decision.selection?.selectedCandidateId !== null) {
    addIssue(errors, "phase5p5_decision_pending", DECISION_PATH, "Decision 21 must remain PENDING_OWNER with selectedCandidateId null.");
  }
}

function validateNoProductionWiring(rootDir: string, errors: AtrialBridgeShootoutValidationIssue[]): void {
  const forbidden = [
    "atrial-reservoir-booster-bridge-v1",
    "createAtrialBridgeProviders",
    "atrial-bridge-shootout-phase5p5-result-v1",
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
  errors: AtrialBridgeShootoutValidationIssue[],
): void {
  const relativePath = path.relative(rootDir, filePath);
  if (!/\.(ts|tsx|json)$/.test(relativePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const token of forbidden) {
    if (text.includes(token)) {
      addIssue(errors, "phase5p5_no_production_wiring", relativePath, `Production-facing file must not wire Phase 5.5 atrial bridge token ${token}.`);
    }
  }
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const filePath = path.join(dir, entry);
    return statSync(filePath).isDirectory() ? walkFiles(filePath) : [filePath];
  });
}

function readOptional(rootDir: string, relativePath: string): string {
  // Actually optional, as the name says. It used to be a bare readFileSync, so a
  // moved doc crashed the verifier instead of reporting the doc-drift error the
  // caller checks for. An empty string fails those `includes` checks properly.
  try {
    return readFileSync(path.join(rootDir, relativePath), "utf8");
  } catch {
    return "";
  }
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
  issues: AtrialBridgeShootoutValidationIssue[],
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
    path.normalize("tools/myocardium/verifyAtrialBridgeShootout.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const report = validateAtrialBridgeShootout(process.cwd(), { rebuildEvidence: true });
  for (const warning of report.warnings) {
    console.warn(`[${warning.code}] ${warning.path}: ${warning.message}`);
  }
  if (!report.pass) {
    for (const error of report.errors) {
      console.error(`[${error.code}] ${error.path}: ${error.message}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Atrial bridge Phase 5.5 shootout verification passed.");
  }
}
