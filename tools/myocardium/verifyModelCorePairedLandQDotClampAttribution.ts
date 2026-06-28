import { readFileSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json";
import {
  MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID,
  buildModelCorePairedLandQDotClampAttributionEvidence,
  type ModelCorePairedLandQDotClampAttributionEvidence,
} from "@/tools/myocardium/buildModelCorePairedLandQDotClampAttributionEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCorePairedLandQDotClampAttributionValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCorePairedLandQDotClampAttributionEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json";
const UPSTREAM_RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json";
const BUILDER_PATH =
  "tools/myocardium/buildModelCorePairedLandQDotClampAttributionEvidence.ts";
const PAIRED_BUILDER_PATH =
  "tools/myocardium/buildModelCorePairedLandSourceProviderEvidence.ts";
const DEBUG_RUNNER_PATH = "tools/debugStarlingLowPreload.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const CURRENT_LANES_PATH = "docs/status/current-lanes.md";

export function validateModelCorePairedLandQDotClampAttribution(rootDir = process.cwd()):
ModelCorePairedLandQDotClampAttributionValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCorePairedLandQDotClampAttributionEvidence();
  const artifact = resultArtifact as ModelCorePairedLandQDotClampAttributionEvidence;

  validateEvidence(evidence, errors, warnings);
  validateResultArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: ModelCorePairedLandQDotClampAttributionEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MODELCORE_PAIRED_LAND_QDOT_CLAMP_ATTRIBUTION_EVIDENCE_ID
    || evidence.phase !== "Phase 5C-M"
    || evidence.claimBoundary !== "same-closure-qdot-clamp-threshold-attribution-only"
    || evidence.upstreamPairedRunResultArtifactPath !== UPSTREAM_RESULT_ARTIFACT_PATH
    || evidence.verifierScript !== "verify:myocardium-modelcore-paired-land-qdot-clamp-attribution"
  ) {
    addIssue(errors, "phase5m_identity", "live-evidence", "Live evidence must identify the Phase 5C-M qDot clamp attribution result.");
  }
  if (
    evidence.sameClosureBoundary.stableHashesMatch !== true
    || evidence.sameClosureBoundary.sourceProviderDifferenceOnly !== true
    || evidence.sameClosureBoundary.noQDotTuning !== true
    || evidence.sameClosureBoundary.noValveTuning !== true
    || evidence.sameClosureBoundary.noAfterloadTuning !== true
    || evidence.sameClosureBoundary.noPreloadTuning !== true
    || evidence.sameClosureBoundary.noLandParameterTuning !== true
  ) {
    addIssue(errors, "phase5m_same_closure_boundary", "live-evidence.sameClosureBoundary", "Phase 5C-M must preserve the same source-provider-only closure and forbid tuning.");
  }
  if (
    evidence.pairedRunStatus.legacyStatus !== "period-2-positive-control-pass"
    || evidence.pairedRunStatus.landStatus !== "finite-period-1"
    || evidence.pairedRunStatus.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(errors, "phase5m_upstream_paired_run_status", "live-evidence.pairedRunStatus", "Phase 5C-M must attribute the recorded Phase 5C-L period-2/period-1 paired result without changing it.");
  }
  validateClampTrace(evidence.clampAttribution.legacy.clampAttributionTrace, "live-evidence.clampAttribution.legacy", errors);
  validateClampTrace(evidence.clampAttribution.land.clampAttributionTrace, "live-evidence.clampAttribution.land", errors);
  if (
    evidence.clampAttribution.legacy.clampAttributionTrace.aovQDotClampHitCount <= 0
    || evidence.clampAttribution.legacy.clampAttributionTrace.aovQDotMaxImpulseAbsMlPerS2 <= 0
  ) {
    addIssue(errors, "phase5m_legacy_qdot_positive_control", "live-evidence.clampAttribution.legacy", "Legacy positive control must expose AoV qDot clamp engagement in the trace window.");
  }
  if (
    evidence.attributionInterpretation.structuralAlternansRemovalClaim !== "not-established"
    || evidence.attributionInterpretation.finalNoAlternansClaim !== "not-claimed"
    || evidence.attributionInterpretation.officialMorphologyAcceptance !== "not-claimed"
  ) {
    addIssue(errors, "phase5m_forbidden_acceptance_claim", "live-evidence.attributionInterpretation", "Phase 5C-M must not claim structural alternans removal, final no-alternans, or official morphology acceptance.");
  }
  if (evidence.attributionInterpretation.classification === "clamp-threshold-avoidance-risk-supported") {
    warnings.push({
      severity: "warning",
      code: "phase5m_clamp_avoidance_risk_supported",
      path: "live-evidence.attributionInterpretation",
      message: "Land period-1 remains positive, but clamp-threshold avoidance is a supported attribution risk until output-matched and SDIRK2 checks run.",
    });
  }
}

function validateClampTrace(
  trace: ModelCorePairedLandQDotClampAttributionEvidence["clampAttribution"]["legacy"]["clampAttributionTrace"],
  label: string,
  errors: ValidationIssue[],
): void {
  if (
    trace.traceBeatCount <= 0
    || trace.sampleCount <= 0
    || trace.aovQDotClampHitCount < 0
    || trace.aovQDotClampHitFraction < 0
    || trace.aovQDotClampHitFraction > 1
    || !Number.isFinite(trace.aovQDotMaxRawAbsMlPerS2)
    || !Number.isFinite(trace.aovQDotMaxPostAbsMlPerS2)
    || !Number.isFinite(trace.aovQDotMaxImpulseAbsMlPerS2)
    || !Number.isFinite(trace.qAoCapRatioMax)
    || trace.dynamicFlowClampHitsAoV < 0
    || trace.valveDiodeClampHitsAoV < 0
  ) {
    addIssue(errors, "phase5m_clamp_trace", label, "Clamp attribution trace metrics must be finite fractions/counts with trace samples.");
  }
}

function validateResultArtifact(
  artifact: ModelCorePairedLandQDotClampAttributionEvidence,
  evidence: ModelCorePairedLandQDotClampAttributionEvidence,
  errors: ValidationIssue[],
): void {
  if (
    artifact.schemaVersion !== evidence.schemaVersion
    || artifact.id !== evidence.id
    || artifact.phase !== evidence.phase
    || artifact.claimBoundary !== evidence.claimBoundary
    || artifact.upstreamPairedRunEvidenceId !== evidence.upstreamPairedRunEvidenceId
    || artifact.upstreamPairedRunResultArtifactId !== evidence.upstreamPairedRunResultArtifactId
    || artifact.upstreamPairedRunResultArtifactPath !== evidence.upstreamPairedRunResultArtifactPath
    || artifact.verifierScript !== evidence.verifierScript
  ) {
    addIssue(errors, "phase5m_result_identity", RESULT_ARTIFACT_PATH, "Result artifact must identify the Phase 5C-M qDot clamp attribution run.");
  }
  if (
    artifact.sameClosureBoundary.stableHashesMatch !== evidence.sameClosureBoundary.stableHashesMatch
    || artifact.sameClosureBoundary.sourceProviderDifferenceOnly !== evidence.sameClosureBoundary.sourceProviderDifferenceOnly
    || artifact.sameClosureBoundary.noQDotTuning !== true
    || artifact.sameClosureBoundary.noValveTuning !== true
    || artifact.sameClosureBoundary.noAfterloadTuning !== true
    || artifact.sameClosureBoundary.noPreloadTuning !== true
    || artifact.sameClosureBoundary.noLandParameterTuning !== true
  ) {
    addIssue(errors, "phase5m_result_boundary", RESULT_ARTIFACT_PATH, "Result artifact must preserve same-closure/no-tuning boundaries.");
  }
  compareRunAttribution(artifact.clampAttribution.legacy, evidence.clampAttribution.legacy, "legacy", errors);
  compareRunAttribution(artifact.clampAttribution.land, evidence.clampAttribution.land, "land", errors);
  compareDeltas(artifact, evidence, errors);
  if (
    artifact.attributionInterpretation.classification !== evidence.attributionInterpretation.classification
    || artifact.attributionInterpretation.structuralAlternansRemovalClaim !== "not-established"
    || artifact.attributionInterpretation.finalNoAlternansClaim !== "not-claimed"
    || artifact.attributionInterpretation.officialMorphologyAcceptance !== "not-claimed"
    || !artifact.attributionInterpretation.requiredNextChecks.includes("output-matched-paired-run-before-structural-attribution")
    || !artifact.attributionInterpretation.requiredNextChecks.includes("SDIRK2-reference-before-final-no-alternans")
    || !artifact.attributionInterpretation.requiredNextChecks.includes("preload-domain-sweep-before-domain-claim")
  ) {
    addIssue(errors, "phase5m_result_interpretation", RESULT_ARTIFACT_PATH, "Result artifact must match live attribution classification and keep required next checks.");
  }
  for (const token of [
    "runtimeReplacement",
    "officialMorphologyAcceptance",
    "finalNoAlternans",
    "qDotTuning",
    "valveThresholdTuning",
    "arterialLoadTuning",
    "preloadTuning",
    "landParameterTuning",
    "TriSegAdoption",
    "StudioScientificValidityClaim",
  ] as const) {
    if (!artifact.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5m_does_not_unlock", RESULT_ARTIFACT_PATH, `Result artifact must keep ${token} blocked.`);
    }
  }
}

function compareRunAttribution(
  artifactRun: ModelCorePairedLandQDotClampAttributionEvidence["clampAttribution"]["legacy"],
  evidenceRun: ModelCorePairedLandQDotClampAttributionEvidence["clampAttribution"]["legacy"],
  label: string,
  errors: ValidationIssue[],
): void {
  if (
    artifactRun.sourceProviderId !== evidenceRun.sourceProviderId
    || artifactRun.status !== evidenceRun.status
    || artifactRun.periodBeats !== evidenceRun.periodBeats
    || !approximatelyEqual(artifactRun.adjacentDelta, evidenceRun.adjacentDelta)
    || !approximatelyEqual(artifactRun.periodDelta, evidenceRun.periodDelta)
  ) {
    addIssue(errors, "phase5m_result_run_status", `${RESULT_ARTIFACT_PATH}.${label}`, `Artifact ${label} run status must match live evidence.`);
  }
  compareTrace(artifactRun.clampAttributionTrace, evidenceRun.clampAttributionTrace, `${RESULT_ARTIFACT_PATH}.${label}.clampAttributionTrace`, errors);
}

function compareTrace(
  artifactTrace: ModelCorePairedLandQDotClampAttributionEvidence["clampAttribution"]["legacy"]["clampAttributionTrace"],
  evidenceTrace: ModelCorePairedLandQDotClampAttributionEvidence["clampAttribution"]["legacy"]["clampAttributionTrace"],
  label: string,
  errors: ValidationIssue[],
): void {
  if (
    artifactTrace.traceBeatCount !== evidenceTrace.traceBeatCount
    || artifactTrace.sampleCount !== evidenceTrace.sampleCount
    || !approximatelyEqual(artifactTrace.aovQDotClampHitCount, evidenceTrace.aovQDotClampHitCount)
    || !approximatelyEqual(artifactTrace.aovQDotClampHitFraction, evidenceTrace.aovQDotClampHitFraction)
    || !approximatelyEqual(artifactTrace.aovQDotMaxRawAbsMlPerS2, evidenceTrace.aovQDotMaxRawAbsMlPerS2)
    || !approximatelyEqual(artifactTrace.aovQDotMaxPostAbsMlPerS2, evidenceTrace.aovQDotMaxPostAbsMlPerS2)
    || !approximatelyEqual(artifactTrace.aovQDotMaxPositiveRawMlPerS2, evidenceTrace.aovQDotMaxPositiveRawMlPerS2)
    || !approximatelyEqual(artifactTrace.aovQDotMinNegativeRawMlPerS2, evidenceTrace.aovQDotMinNegativeRawMlPerS2)
    || !approximatelyEqual(artifactTrace.aovQDotMaxImpulseAbsMlPerS2, evidenceTrace.aovQDotMaxImpulseAbsMlPerS2)
    || !approximatelyEqual(artifactTrace.qAoCapRatioMax, evidenceTrace.qAoCapRatioMax)
    || !approximatelyEqual(artifactTrace.qAoNearCap90Fraction, evidenceTrace.qAoNearCap90Fraction)
    || !approximatelyEqual(artifactTrace.qAoNearCap95Fraction, evidenceTrace.qAoNearCap95Fraction)
    || !approximatelyEqual(artifactTrace.qAoNearCap98Fraction, evidenceTrace.qAoNearCap98Fraction)
    || !approximatelyEqual(artifactTrace.qAoAtCapFraction, evidenceTrace.qAoAtCapFraction)
    || !approximatelyEqual(artifactTrace.qAoLocalCapActiveFraction, evidenceTrace.qAoLocalCapActiveFraction)
    || !approximatelyEqual(artifactTrace.dynamicFlowClampHitsAoV, evidenceTrace.dynamicFlowClampHitsAoV)
    || !approximatelyEqual(artifactTrace.valveDiodeClampHitsAoV, evidenceTrace.valveDiodeClampHitsAoV)
  ) {
    addIssue(errors, "phase5m_result_trace", label, "Artifact clamp attribution trace must match the live trace-derived metrics.");
  }
}

function compareDeltas(
  artifact: ModelCorePairedLandQDotClampAttributionEvidence,
  evidence: ModelCorePairedLandQDotClampAttributionEvidence,
  errors: ValidationIssue[],
): void {
  const artifactDeltas = artifact.clampAttribution.deltas;
  const evidenceDeltas = evidence.clampAttribution.deltas;
  for (const key of Object.keys(evidenceDeltas) as Array<keyof typeof evidenceDeltas>) {
    if (!approximatelyEqual(artifactDeltas[key], evidenceDeltas[key])) {
      addIssue(errors, "phase5m_result_deltas", `${RESULT_ARTIFACT_PATH}.clampAttribution.deltas.${key}`, `${key} must match live evidence.`);
    }
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const builderText = readFileSync(path.join(rootDir, BUILDER_PATH), "utf8");
  const pairedBuilderText = readFileSync(path.join(rootDir, PAIRED_BUILDER_PATH), "utf8");
  const debugRunnerText = readFileSync(path.join(rootDir, DEBUG_RUNNER_PATH), "utf8");
  const readmeText = readOptionalText(rootDir, README_PATH);
  const roadmapText = readOptionalText(rootDir, ROADMAP_PATH);
  const lanesText = readOptionalText(rootDir, CURRENT_LANES_PATH);
  if (
    !builderText.includes("buildModelCorePairedLandSourceProviderEvidence")
    || !builderText.includes("clamp-threshold-avoidance-risk")
    || !builderText.includes("structuralAlternansRemovalClaim: \"not-established\"")
  ) {
    addIssue(errors, "phase5m_builder_contract", BUILDER_PATH, "Builder must reuse the paired run and keep structural alternans attribution unestablished.");
  }
  if (
    !pairedBuilderText.includes("clampAttributionTrace")
    || !debugRunnerText.includes("AoVQDotClampHitFraction")
    || !debugRunnerText.includes("AoV_qDotClampHit01")
  ) {
    addIssue(errors, "phase5m_trace_metrics", `${PAIRED_BUILDER_PATH}/${DEBUG_RUNNER_PATH}`, "Paired evidence must expose trace-derived AoV qDot clamp metrics.");
  }
  if (/finalNoAlternans\s*[:=]\s*true|officialMorphologyPass\s*[:=]\s*true|runtimeReplacement\s*[:=]\s*true/.test(`${builderText}\n${pairedBuilderText}`)) {
    addIssue(errors, "phase5m_forbidden_flags", `${BUILDER_PATH}/${PAIRED_BUILDER_PATH}`, "Phase 5C-M sources must not enable runtime replacement, official morphology, or final no-alternans flags.");
  }
  if (readmeText && !readmeText.includes("Phase 5C-M")) {
    addIssue(errors, "phase5m_readme", README_PATH, "README must record the Phase 5C-M qDot clamp attribution boundary.");
  }
  if (roadmapText && !roadmapText.includes("Phase 5C-M")) {
    addIssue(errors, "phase5m_roadmap", ROADMAP_PATH, "Roadmap must record the Phase 5C-M qDot clamp attribution result.");
  }
  if (lanesText && !lanesText.includes("qDot clamp-threshold attribution")) {
    addIssue(errors, "phase5m_current_lanes", CURRENT_LANES_PATH, "Current lanes must keep the qDot clamp-threshold attribution blocker visible.");
  }
}

function readOptionalText(rootDir: string, filePath: string): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
    return null;
  }
}

function approximatelyEqual(actual: number, expected: number): boolean {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  return Math.abs(actual - expected) <= scale * 1e-6;
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function parseArgs(argv: readonly string[]): { rootDir: string } {
  let rootDir = process.cwd();
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg.startsWith("--root=")) rootDir = arg.slice("--root=".length);
  }
  return { rootDir };
}

function printHelp(): void {
  console.log([
    "Usage: npm run verify:myocardium-modelcore-paired-land-qdot-clamp-attribution -- [--root=DIR]",
    "",
    "Runs and validates the Phase 5C-M same-closure qDot clamp attribution diagnostic.",
  ].join("\n"));
}

function printReport(report: ModelCorePairedLandQDotClampAttributionValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore paired Land qDot clamp attribution ${status} `
    + `classification=${report.evidence.attributionInterpretation.classification} `
    + `legacyHitFraction=${report.evidence.clampAttribution.legacy.clampAttributionTrace.aovQDotClampHitFraction} `
    + `landHitFraction=${report.evidence.clampAttribution.land.clampAttributionTrace.aovQDotClampHitFraction} `
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
  const options = parseArgs(process.argv.slice(2));
  const report = validateModelCorePairedLandQDotClampAttribution(options.rootDir);
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
