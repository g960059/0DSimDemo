import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import localizationArtifact from "@/data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json";
import {
  ATRIAL_BRIDGE_LOCALIZATION_EVIDENCE_ID,
  buildAtrialBridgeBlockerLocalizationEvidence,
  type AtrialBridgeBlockerLocalizationEvidence,
} from "@/tools/myocardium/buildAtrialBridgeBlockerLocalization";
import type { AtrialBridgeCandidateId } from "@/tools/myocardium/buildAtrialBridgeShootout";

export type AtrialBridgeLocalizationValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type AtrialBridgeLocalizationValidationReport = {
  readonly pass: boolean;
  readonly evidence: AtrialBridgeBlockerLocalizationEvidence;
  readonly errors: readonly AtrialBridgeLocalizationValidationIssue[];
  readonly warnings: readonly AtrialBridgeLocalizationValidationIssue[];
};

export type AtrialBridgeLocalizationValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json";
const SOURCE_SHOOTOUT_PATH =
  "data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildAtrialBridgeBlockerLocalization.ts";
const SHOOTOUT_BUILDER_PATH = "tools/myocardium/buildAtrialBridgeShootout.ts";
const PACKAGE_PATH = "package.json";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/atrial-bridge-shootout-roadmap.md";
const DECISION_PATH = "data/myocardium/decisions/atrial-bridge-decision21-phase6-selection-v1.json";

const EXPECTED_CANDIDATES: readonly AtrialBridgeCandidateId[] = [
  "atrial-elastance-negative-control-v0",
  "legacy-atrial-active-bridge-v0",
  "atrial-reservoir-booster-bridge-v1",
] as const;
const EXPECTED_SWEEP_POINTS = ["normal-hr75-reference", "normal-hr90", "normal-hr105"] as const;
const EXPECTED_VARIANTS = ["a1-reservoir-off", "a1-recoil-slower", "a1-valve-threshold-higher"] as const;
const EXPECTED_SAMPLING_RATES = [120, 240, 480, 960] as const;
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

export function validateAtrialBridgeBlockerLocalization(
  rootDir = process.cwd(),
  options: AtrialBridgeLocalizationValidationOptions = {},
): AtrialBridgeLocalizationValidationReport {
  const errors: AtrialBridgeLocalizationValidationIssue[] = [];
  const warnings: AtrialBridgeLocalizationValidationIssue[] = [];
  const evidence = localizationArtifact as unknown as AtrialBridgeBlockerLocalizationEvidence;

  if (options.rebuildEvidence) validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validateHighHrSweep(evidence, errors);
  validateValveDiagnostics(evidence, errors);
  validateRepeatability(evidence, errors);
  validateSampling(evidence, errors);
  validateDiagnosticVariants(evidence, errors);
  validateRecommendationBoundary(evidence, errors, warnings);
  validateSourceText(rootDir, errors);
  validateDocs(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5p5b_diagnostic_only",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5.5B localizes atrial bridge blockers only; Phase 6 bridge selection remains owner/oracle gated.",
  });
  if (!options.rebuildEvidence) {
    warnings.push({
      severity: "warning",
      code: "phase5p5b_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "The measured localization artifact is heavy to rebuild; use --rebuild when intentionally refreshing the 4-minute experiment.",
    });
  }

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  const fresh = buildAtrialBridgeBlockerLocalizationEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5p5b_stale_artifact", RESULT_ARTIFACT_PATH, "Localization artifact must match a fresh buildAtrialBridgeBlockerLocalizationEvidence() run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ATRIAL_BRIDGE_LOCALIZATION_EVIDENCE_ID
    || evidence.phase !== "Phase 5.5B"
    || evidence.claimBoundary !== "diagnostic-localization-only-no-bridge-selection"
    || evidence.sourceShootout !== SOURCE_SHOOTOUT_PATH
    || evidence.verifierScript !== "verify:myocardium-atrial-bridge-localization"
  ) {
    addIssue(errors, "phase5p5b_identity", RESULT_ARTIFACT_PATH, "Localization evidence identity or source links are invalid.");
  }
}

function validateProtocol(
  evidence: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  if (
    !arrayEquals(evidence.protocol.candidateIds, EXPECTED_CANDIDATES)
    || !arrayEquals(evidence.protocol.highHrSweepPoints.map((point) => point.id), EXPECTED_SWEEP_POINTS)
    || !arrayEquals(evidence.protocol.diagnosticVariantIds, EXPECTED_VARIANTS)
    || !arrayEquals(evidence.protocol.isolatedSamplingRatesHz, EXPECTED_SAMPLING_RATES)
    || evidence.protocol.dtSec !== 0.001
    || evidence.protocol.sampleHz !== 480
    || evidence.protocol.tailWindowBeats < 4
    || evidence.protocol.measureBeats < 3
    || evidence.protocol.settlePolicy.capSeconds < 120
    || evidence.protocol.sameBoundaryForAllCandidates !== true
    || evidence.protocol.variantsNeverSelectable !== true
  ) {
    addIssue(errors, "phase5p5b_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5.5B must localize blockers with shared candidates, HR sweep, tail windows, normalized denominators, and non-selectable variants.");
  }
}

function validateHighHrSweep(
  evidence: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  if (evidence.highHrSweepRuns.length !== EXPECTED_CANDIDATES.length * EXPECTED_SWEEP_POINTS.length) {
    addIssue(errors, "phase5p5b_high_hr_run_count", `${RESULT_ARTIFACT_PATH}.highHrSweepRuns`, "High-HR threshold matrix must cover all candidates and expected sweep points.");
  }
  for (const candidateId of EXPECTED_CANDIDATES) {
    for (const pointId of EXPECTED_SWEEP_POINTS) {
      const run = evidence.highHrSweepRuns.find((item) =>
        item.candidateId === candidateId && item.sweepPointId === pointId
      );
      if (!run) {
        addIssue(errors, "phase5p5b_missing_high_hr_run", `${RESULT_ARTIFACT_PATH}.highHrSweepRuns`, `Missing high-HR localization run for ${candidateId}/${pointId}.`);
        continue;
      }
      if (!run.tailWindow || run.tailWindow.sampleCount < 100 || !run.tailWindow.LA || !run.tailWindow.RA) {
        addIssue(errors, "phase5p5b_tail_window_required", `${RESULT_ARTIFACT_PATH}.highHrSweepRuns`, `Run ${candidateId}/${pointId} must record LA/RA tail-window metrics even when not settled.`);
      }
      if (!run.settled && run.tailWindow.windowKind !== "cap-tail-window") {
        addIssue(errors, "phase5p5b_cap_tail_window", `${RESULT_ARTIFACT_PATH}.highHrSweepRuns`, `Cap run ${candidateId}/${pointId} must use a cap-tail-window.`);
      }
      for (const valve of ["MV", "TV"] as const) {
        const attribution = run.tailWindow.valveAttribution[valve];
        if (
          attribution.phaseHistogram8.length !== 8
          || !Number.isFinite(attribution.hitsPerBeat)
          || !Number.isFinite(attribution.hitsPerSecond)
          || !Number.isFinite(attribution.diodeImpulseSum)
        ) {
          addIssue(errors, "phase5p5b_valve_window_attribution", `${RESULT_ARTIFACT_PATH}.highHrSweepRuns`, `Run ${candidateId}/${pointId}/${valve} must record normalized valve attribution and phase histogram.`);
        }
      }
    }
  }
  if (
    evidence.summary.highHrGapStatus !== "hr105-common-nonsettle-persists"
    || !evidence.summary.commonNonSettledSweepPointIds.includes("normal-hr105")
    || evidence.summary.highestAllCandidateSettledHr !== 75
  ) {
    addIssue(errors, "phase5p5b_high_hr_summary", `${RESULT_ARTIFACT_PATH}.summary`, "Summary must preserve the measured HR105 common non-settle boundary and HR75 all-candidate settled reference.");
  }
  const hr90E0 = evidence.highHrSweepRuns.find((run) =>
    run.candidateId === "atrial-elastance-negative-control-v0" && run.sweepPointId === "normal-hr90"
  );
  const hr90A0 = evidence.highHrSweepRuns.find((run) =>
    run.candidateId === "legacy-atrial-active-bridge-v0" && run.sweepPointId === "normal-hr90"
  );
  const hr90A1 = evidence.highHrSweepRuns.find((run) =>
    run.candidateId === "atrial-reservoir-booster-bridge-v1" && run.sweepPointId === "normal-hr90"
  );
  if (hr90E0?.settled !== false || hr90A0?.settled !== true || hr90A1?.settled !== false) {
    addIssue(errors, "phase5p5b_hr90_separation", `${RESULT_ARTIFACT_PATH}.highHrSweepRuns`, "The documented HR90 separation must be guarded: A0 settles while E0 and A1 cap.");
  }
}

function validateValveDiagnostics(
  evidence: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  if (evidence.valveRateDiagnostics.length !== 12 || evidence.a1ValveComparisons.length !== 4) {
    addIssue(errors, "phase5p5b_valve_diagnostic_count", `${RESULT_ARTIFACT_PATH}.valveRateDiagnostics`, "Valve diagnostics must cover source shootout points and A1-vs-A0 comparisons.");
  }
  if (!evidence.valveRateDiagnostics.every((item) =>
    item.denominatorStatus === "normalized-by-simulated-time-and-beats"
    && item.simulatedSeconds > 0
    && item.simulatedBeats > 0
    && Number.isFinite(item.hitsPerBeat)
    && Number.isFinite(item.hitsPerSecond)
  )) {
    addIssue(errors, "phase5p5b_valve_denominator", `${RESULT_ARTIFACT_PATH}.valveRateDiagnostics`, "Valve diode contamination must use beat/time-normalized denominators, not raw hit counts only.");
  }
  if (
    evidence.summary.a1ValveBlockerAfterNormalization !== "supported"
    || evidence.a1ValveComparisons.some((comparison) => !comparison.a1WorseAfterNormalization)
  ) {
    addIssue(errors, "phase5p5b_a1_valve_blocker", `${RESULT_ARTIFACT_PATH}.a1ValveComparisons`, "A1 valve blocker should remain supported after beat/second normalization in this measured artifact.");
  }
}

function validateRepeatability(
  evidence: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  if (evidence.repeatabilityDiagnostics.length !== EXPECTED_CANDIDATES.length * 3) {
    addIssue(errors, "phase5p5b_repeatability_count", `${RESULT_ARTIFACT_PATH}.repeatabilityDiagnostics`, "Repeatability diagnostics must cover all candidates at normal/low/high preload.");
  }
  if (!evidence.repeatabilityDiagnostics.every((item) =>
    ["pass", "true-loop-drift", "data-quality-missing"].includes(item.status)
    && item.sampleCountsByBeat.length > 0
    && "LA" in item.chamberValues
    && "RA" in item.chamberValues
  )) {
    addIssue(errors, "phase5p5b_repeatability_metadata", `${RESULT_ARTIFACT_PATH}.repeatabilityDiagnostics`, "Repeatability diagnostics must record status, sample counts, and chamber-specific values.");
  }
  const a1 = evidence.repeatabilityDiagnostics.filter((item) =>
    item.candidateId === "atrial-reservoir-booster-bridge-v1"
  );
  if (
    evidence.summary.a1RepeatabilityBlockerLocalized !== "not-supported"
    || a1.some((item) => item.status !== "pass")
  ) {
    addIssue(errors, "phase5p5b_a1_repeatability_artifact", `${RESULT_ARTIFACT_PATH}.repeatabilityDiagnostics`, "Full-beat phase-resampled repeatability should remove the previous A1 repeatability blocker in this artifact.");
  }
}

function validateSampling(
  evidence: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  if (evidence.isolatedSamplingDiagnostics.length !== EXPECTED_CANDIDATES.length * 2) {
    addIssue(errors, "phase5p5b_sampling_count", `${RESULT_ARTIFACT_PATH}.isolatedSamplingDiagnostics`, "Sampling diagnostics must cover LA/RA isolated roughness for every candidate.");
  }
  for (const diagnostic of evidence.isolatedSamplingDiagnostics) {
    if (
      !arrayEquals(diagnostic.samplingRatesHz, EXPECTED_SAMPLING_RATES)
      || Object.keys(diagnostic.roughnessByHz).length < EXPECTED_SAMPLING_RATES.length
      || Object.keys(diagnostic.rankingVsA0ByHz).length < EXPECTED_SAMPLING_RATES.length
    ) {
      addIssue(errors, "phase5p5b_sampling_modes", `${RESULT_ARTIFACT_PATH}.isolatedSamplingDiagnostics`, "Sampling diagnostics must include phase-normalized 120/240/480/960 roughness and A0 ranking modes.");
    }
  }
  if (
    evidence.summary.a1SamplingInvariantBlockerLocalized !== "supported"
    || evidence.summary.a1SamplingFailureSites.length !== 2
  ) {
    addIssue(errors, "phase5p5b_a1_sampling_blocker", `${RESULT_ARTIFACT_PATH}.summary`, "A1 sampling-invariance blocker should remain localized to isolated LA/RA in this measured artifact.");
  }
}

function validateDiagnosticVariants(
  evidence: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  if (
    evidence.diagnosticVariantRuns.length !== EXPECTED_VARIANTS.length
    || evidence.diagnosticVariantRuns.some((run) => run.selectable !== false || run.candidateId !== "atrial-reservoir-booster-bridge-v1")
    || evidence.summary.diagnosticVariantsRemainNonSelectable !== true
  ) {
    addIssue(errors, "phase5p5b_variants_nonselectable", `${RESULT_ARTIFACT_PATH}.diagnosticVariantRuns`, "A1 diagnostic variants must be measured but never selectable in Phase 5.5B.");
  }
}

function validateRecommendationBoundary(
  evidence: AtrialBridgeBlockerLocalizationEvidence,
  errors: AtrialBridgeLocalizationValidationIssue[],
  warnings: AtrialBridgeLocalizationValidationIssue[],
): void {
  if (evidence.summary.selectedCandidateId !== null || evidence.summary.recommendedCandidateId !== null) {
    addIssue(errors, "phase5p5b_no_selection", `${RESULT_ARTIFACT_PATH}.summary`, "Phase 5.5B may not select or recommend a Phase 6 atrial bridge.");
  }
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
    addIssue(errors, "phase5p5b_claim_boundary", `${RESULT_ARTIFACT_PATH}.boundary`, "Localization must keep production, final atrial physiology, AF, state schema, Workbench, and morphology claims blocked.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5p5b_selection_blocked",
    path: `${RESULT_ARTIFACT_PATH}.summary`,
    message: "A1 repeatability is no longer supported as a blocker, but high-HR, normalized valve, and sampling-invariance blockers still block selection.",
  });
}

function validateSourceText(rootDir: string, errors: AtrialBridgeLocalizationValidationIssue[]): void {
  const packageText = readOptional(rootDir, PACKAGE_PATH);
  if (!packageText.includes("\"verify:myocardium-atrial-bridge-localization\"")) {
    addIssue(errors, "phase5p5b_package_script", PACKAGE_PATH, "package.json must expose verify:myocardium-atrial-bridge-localization.");
  }
  const builderText = readOptional(rootDir, BUILDER_PATH);
  for (const token of [
    "cap-tail-window",
    "phaseHistogram8",
    "normalized-by-simulated-time-and-beats",
    "phase-resampled-repeatability-v1",
    "isolated-phase-resampled-roughness-v1",
    "selectable: false",
  ]) {
    if (!builderText.includes(token)) {
      addIssue(errors, "phase5p5b_builder_instrumentation", BUILDER_PATH, `Builder must include localization instrumentation token ${token}.`);
    }
  }
  const shootoutBuilderText = readOptional(rootDir, SHOOTOUT_BUILDER_PATH);
  if (!shootoutBuilderText.includes("AtrialBridgeDiagnosticVariantId")) {
    addIssue(errors, "phase5p5b_variant_hook", SHOOTOUT_BUILDER_PATH, "Shootout builder must expose diagnostic-only variant hooks for localization without production wiring.");
  }
}

function validateDocs(rootDir: string, errors: AtrialBridgeLocalizationValidationIssue[]): void {
  const currentLanes = readOptional(rootDir, HISTORICAL_LANES_PATH);
  if (
    !currentLanes.includes("Phase 5.5B")
    || !currentLanes.includes("HR105")
    || !currentLanes.includes("repeatability")
    || !currentLanes.includes("not-supported")
  ) {
    addIssue(errors, "phase5p5b_current_lanes", HISTORICAL_LANES_PATH, "Current lanes must record Phase 5.5B blocker localization and updated blocker status.");
  }
  const readme = readOptional(rootDir, README_PATH);
  if (!readme.includes("Phase 5.5B") || !readme.includes("blocker localization")) {
    addIssue(errors, "phase5p5b_readme", README_PATH, "Myocardium README must summarize Phase 5.5B blocker localization.");
  }
  const roadmap = readOptional(rootDir, ROADMAP_PATH);
  if (!roadmap.includes("atrial-bridge-blocker-localization-phase5p5b-result-v1")) {
    addIssue(errors, "phase5p5b_roadmap", ROADMAP_PATH, "Atrial bridge roadmap must point to the Phase 5.5B localization result.");
  }
  const decision = JSON.parse(readOptional(rootDir, DECISION_PATH)) as { selection?: { selectedCandidateId?: unknown }; status?: unknown };
  if (decision.status !== "PENDING_OWNER" || decision.selection?.selectedCandidateId !== null) {
    addIssue(errors, "phase5p5b_decision_pending", DECISION_PATH, "Decision 21 must remain PENDING_OWNER with selectedCandidateId null.");
  }
}

function validateNoProductionWiring(rootDir: string, errors: AtrialBridgeLocalizationValidationIssue[]): void {
  const forbidden = [
    "atrial-bridge-blocker-localization-phase5p5b-result-v1",
    "a1-reservoir-off",
    "a1-recoil-slower",
    "a1-valve-threshold-higher",
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
  errors: AtrialBridgeLocalizationValidationIssue[],
): void {
  const relativePath = path.relative(rootDir, filePath);
  if (!/\.(ts|tsx|json)$/.test(relativePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const token of forbidden) {
    if (text.includes(token)) {
      addIssue(errors, "phase5p5b_no_production_wiring", relativePath, `Production-facing file must not wire Phase 5.5B diagnostic token ${token}.`);
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
  issues: AtrialBridgeLocalizationValidationIssue[],
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
    path.normalize("tools/myocardium/verifyAtrialBridgeBlockerLocalization.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  const report = validateAtrialBridgeBlockerLocalization(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
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
    console.log("Atrial bridge Phase 5.5B blocker localization verification passed.");
  }
}
