import { readFileSync } from "node:fs";
import path from "node:path";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import {
  MODELCORE_LAND_CALCIUM_UNIT_INTERFACE_AUDIT_EVIDENCE_ID,
  buildModelCoreLandCalciumUnitInterfaceAuditEvidence,
  type ModelCoreLandCalciumUnitInterfaceAuditEvidence,
  type ModelCoreLandCalciumUnitInterfacePair,
  type ModelCoreLandCalciumUnitInterfaceRunPoint,
} from "@/tools/myocardium/buildModelCoreLandCalciumUnitInterfaceAuditEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCoreLandCalciumUnitInterfaceAuditValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCoreLandCalciumUnitInterfaceAuditEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildModelCoreLandCalciumUnitInterfaceAuditEvidence.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const ROUTE_DOC_PATH = "docs/myocardium/roadmap/phase5c-modelcore-equivalent-route-gate.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";

const EXPECTED_DELTAS = [-1250, 1000] as const;
const EXPECTED_SCENARIOS = [
  "raw-direct-internal-c",
  "phase2b-absolute-peak-ca",
  "land-cat50ref-peak-ca",
  "legacy-aInfRaw-equivalent-ca-trpn",
  "legacy-aInf-equivalent-ca-trpn",
  "phase5p-calcium-scale-10-reference",
  "phase5p-calcium-scale-30-control",
] as const;

export function validateModelCoreLandCalciumUnitInterfaceAudit(rootDir = process.cwd()):
ModelCoreLandCalciumUnitInterfaceAuditValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCoreLandCalciumUnitInterfaceAuditEvidence();
  const artifact = resultArtifact as ModelCoreLandCalciumUnitInterfaceAuditEvidence;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: ModelCoreLandCalciumUnitInterfaceAuditEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MODELCORE_LAND_CALCIUM_UNIT_INTERFACE_AUDIT_EVIDENCE_ID
    || evidence.phase !== "Phase 5C-Q"
    || evidence.claimBoundary !== "calcium-unit-source-interface-audit-only"
    || evidence.verifierScript !== "verify:myocardium-modelcore-land-calcium-unit-interface-audit"
  ) {
    addIssue(errors, "phase5q_identity", "live-evidence", "Phase 5C-Q evidence must identify the calcium unit/source-interface audit.");
  }

  if (
    !arrayEquals(evidence.diagnosticProtocol.diagnosticDeltasMl, EXPECTED_DELTAS)
    || evidence.diagnosticProtocol.phase2bAbsolutePeakCaUM !== 1.02
    || evidence.diagnosticProtocol.phase5PScale10Reference !== 10
    || evidence.diagnosticProtocol.phase5PPositiveControlScale !== 30
    || evidence.diagnosticProtocol.pointInitialization !== "independent-from-target-tbv-no-cross-point-warm-start"
    || evidence.diagnosticProtocol.measurementOverlay !== "beat-pair-overlay-enabled-for-LV-c-range"
    || !evidence.diagnosticProtocol.closureInvariant.includes("qDot")
  ) {
    addIssue(errors, "phase5q_protocol", "live-evidence.diagnosticProtocol", "Phase 5C-Q must rerun the pinned and best-Land points with unchanged non-provider closure and beat-pair overlay.");
  }

  validateCalibration(evidence, errors);
  validateBoundary(evidence, errors);
  validateMappingScenarios(evidence, errors);
  validateRunHealth(evidence, errors);
  validatePairs(evidence.pairs, errors);
  validateAnalysis(evidence.analysis, errors, warnings);

  for (const token of [
    "runtimeReplacement",
    "officialMorphologyAcceptance",
    "finalNoAlternans",
    "structuralAlternansRemoval",
    "qDotTuning",
    "valveThresholdTuning",
    "arterialLoadTuning",
    "preloadTuning",
    "landParameterTuning",
    "sourceStressScaling",
    "TriSegAdoption",
    "StudioScientificValidityClaim",
  ] as const) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5q_does_not_unlock", "live-evidence.doesNotUnlock", `Phase 5C-Q must keep ${token} blocked.`);
    }
  }
}

function validateCalibration(
  evidence: ModelCoreLandCalciumUnitInterfaceAuditEvidence,
  errors: ValidationIssue[],
): void {
  const cPeak = evidence.calibration.pinnedLegacyCPeak;
  if (
    evidence.calibration.pinnedLegacyDeltaMl !== -1250
    || evidence.calibration.pinnedLegacyCSource !== "last-two-beat-overlay-LV_c-max"
    || !isPositiveFinite(cPeak)
    || evidence.calibration.pinnedLegacyCRange.max !== cPeak
    || !near(evidence.calibration.phase2bAbsolutePeakScale, 1.02 / cPeak, 1e-12)
    || !near(evidence.calibration.landCaT50RefScale, evidence.diagnosticProtocol.landCaT50RefUM / cPeak, 1e-12)
    || evidence.calibration.phase5PScale10Reference !== 10
    || evidence.calibration.phase5PPositiveControlScale !== 30
  ) {
    addIssue(errors, "phase5q_calibration", "live-evidence.calibration", "Phase 5C-Q must derive fixed calcium mappings once from the pinned legacy LV_c peak.");
  }
}

function validateBoundary(
  evidence: ModelCoreLandCalciumUnitInterfaceAuditEvidence,
  errors: ValidationIssue[],
): void {
  if (
    evidence.boundary.calciumInputMappingOnly !== true
    || evidence.boundary.activationEquivalentMappingsAreDiagnosticOnly !== true
    || evidence.boundary.fixedScale30IsPhase5PPositiveControlOnly !== true
    || evidence.boundary.noQDotTuning !== true
    || evidence.boundary.noValveTuning !== true
    || evidence.boundary.noAfterloadTuning !== true
    || evidence.boundary.noPreloadTuning !== true
    || evidence.boundary.noLandParameterTuning !== true
    || evidence.boundary.noSourceStressScaling !== true
    || evidence.boundary.noRuntimeReplacement !== true
  ) {
    addIssue(errors, "phase5q_boundary", "live-evidence.boundary", "Phase 5C-Q must remain a calcium input mapping audit with no closure, source-stress, or runtime tuning.");
  }
}

function validateMappingScenarios(
  evidence: ModelCoreLandCalciumUnitInterfaceAuditEvidence,
  errors: ValidationIssue[],
): void {
  const scenarioIds = evidence.mappingScenarios.map((scenario) => scenario.scenarioId);
  if (!arrayEquals(scenarioIds, EXPECTED_SCENARIOS)) {
    addIssue(errors, "phase5q_scenario_ids", "live-evidence.mappingScenarios", "Phase 5C-Q must keep the predeclared direct, fixed-unit, activation-equivalent, and Phase 5C-P reference mappings.");
    return;
  }
  for (const scenario of evidence.mappingScenarios) {
    if (scenario.runtimeCandidate !== false) {
      addIssue(errors, "phase5q_no_runtime_candidate", `live-evidence.mappingScenarios.${scenario.scenarioId}`, "No Phase 5C-Q mapping scenario is a runtime candidate.");
    }
  }
  const byId = new Map(evidence.mappingScenarios.map((scenario) => [scenario.scenarioId, scenario]));
  if (byId.get("raw-direct-internal-c")?.axis !== "direct" || byId.get("raw-direct-internal-c")?.fixedScale !== 1) {
    addIssue(errors, "phase5q_direct_mapping", "live-evidence.mappingScenarios.raw-direct-internal-c", "Raw direct mapping must keep freeCaUM equal to legacy internal.c.");
  }
  if (
    byId.get("phase2b-absolute-peak-ca")?.axis !== "fixed-unit-scale"
    || !near(byId.get("phase2b-absolute-peak-ca")?.fixedScale ?? Number.NaN, evidence.calibration.phase2bAbsolutePeakScale, 1e-12)
  ) {
    addIssue(errors, "phase5q_phase2b_mapping", "live-evidence.mappingScenarios.phase2b-absolute-peak-ca", "Phase 2B absolute peak mapping must be a fixed unit-style scale derived from the pinned legacy c peak.");
  }
  if (
    byId.get("land-cat50ref-peak-ca")?.axis !== "fixed-unit-scale"
    || !near(byId.get("land-cat50ref-peak-ca")?.fixedScale ?? Number.NaN, evidence.calibration.landCaT50RefScale, 1e-12)
  ) {
    addIssue(errors, "phase5q_cat50_mapping", "live-evidence.mappingScenarios.land-cat50ref-peak-ca", "Land CaT50Ref mapping must be a fixed unit-style scale derived from the pinned legacy c peak.");
  }
  for (const id of ["legacy-aInfRaw-equivalent-ca-trpn", "legacy-aInf-equivalent-ca-trpn"] as const) {
    if (byId.get(id)?.axis !== "activation-equivalent" || byId.get(id)?.fixedScale !== null) {
      addIssue(errors, "phase5q_activation_equivalent_mapping", `live-evidence.mappingScenarios.${id}`, "aInf-equivalent mappings must remain diagnostic inverse mappings, not unit conversions.");
    }
  }
  if (
    byId.get("phase5p-calcium-scale-10-reference")?.axis !== "positive-control-scale"
    || byId.get("phase5p-calcium-scale-10-reference")?.fixedScale !== 10
    || byId.get("phase5p-calcium-scale-30-control")?.axis !== "positive-control-scale"
    || byId.get("phase5p-calcium-scale-30-control")?.fixedScale !== 30
  ) {
    addIssue(errors, "phase5q_phase5p_references", "live-evidence.mappingScenarios", "Phase 5C-P scale 10 and scale 30 mappings must remain positive-control references only.");
  }
}

function validateRunHealth(
  evidence: ModelCoreLandCalciumUnitInterfaceAuditEvidence,
  errors: ValidationIssue[],
): void {
  const expectedMappedPointCount = EXPECTED_DELTAS.length * EXPECTED_SCENARIOS.length;
  if (
    evidence.runHealth.legacyTargetsSettledByConvergence !== true
    || evidence.runHealth.mappedPointCount !== expectedMappedPointCount
    || evidence.runHealth.mappedPointsSettledByConvergence !== expectedMappedPointCount
    || evidence.runHealth.mappedPointsCapOrNonOk !== 0
    || evidence.runHealth.landSolveFailureCount !== 0
    || evidence.runHealth.sourceAuditSamplesPresent !== true
    || evidence.runHealth.commitAuditSamplesPresent !== true
    || evidence.runHealth.calciumMappingAuditSamplesPresent !== true
  ) {
    addIssue(errors, "phase5q_run_health", "live-evidence.runHealth", "Every Phase 5C-Q mapped Land point must converge with clean health and source/commit/calcium mapping audits.");
  }
}

function validatePairs(
  pairs: readonly ModelCoreLandCalciumUnitInterfacePair[],
  errors: ValidationIssue[],
): void {
  if (pairs.length !== EXPECTED_DELTAS.length * EXPECTED_SCENARIOS.length) {
    addIssue(errors, "phase5q_pair_count", "live-evidence.pairs", "Phase 5C-Q must report two deltas times seven calcium mapping scenarios.");
  }
  const seen = new Set<string>();
  for (const pair of pairs) {
    seen.add(`${pair.deltaVolumeMl}:${pair.mappedLand.scenarioId}`);
    if (
      pair.sameClosureStableHash !== true
      || pair.calciumMappingOnlyWithinPoint !== true
      || pair.legacy.deltaVolumeMl !== pair.mappedLand.deltaVolumeMl
      || pair.legacy.effectiveTotalBloodVolumeMl !== pair.mappedLand.effectiveTotalBloodVolumeMl
    ) {
      addIssue(errors, "phase5q_same_point_pairing", `live-evidence.pairs.${pair.deltaVolumeMl}.${pair.mappedLand.scenarioId}`, "Each mapped Land point must differ from legacy only by the calcium-mapped source provider at the same effective TBV.");
    }
    validatePoint(pair.legacy, `live-evidence.pairs.${pair.deltaVolumeMl}.legacy`, errors);
    validatePoint(pair.mappedLand, `live-evidence.pairs.${pair.deltaVolumeMl}.${pair.mappedLand.scenarioId}`, errors);
    validateMappedLandInstrumentation(pair.mappedLand, errors);
    if (
      !Number.isFinite(pair.comparison.meanOutputMatchScore)
      || !Number.isFinite(pair.comparison.mappedVsLegacyCOLRatio)
      || !Number.isFinite(pair.comparison.mappedVsLegacySVRatio)
      || !Number.isFinite(pair.comparison.mappedVsLegacyQAoPeakRatio)
      || !Number.isFinite(pair.comparison.mappedVsLegacyPeakSigmaActRatio)
      || !Number.isFinite(pair.comparison.mappedVsLegacyAoVQDotClampHitFractionRatio)
    ) {
      addIssue(errors, "phase5q_pair_metrics", `live-evidence.pairs.${pair.deltaVolumeMl}.${pair.mappedLand.scenarioId}`, "Every Phase 5C-Q pair must include finite output, stress, and qDot comparison metrics.");
    }
  }
  for (const delta of EXPECTED_DELTAS) {
    for (const scenarioId of EXPECTED_SCENARIOS) {
      if (!seen.has(`${delta}:${scenarioId}`)) {
        addIssue(errors, "phase5q_missing_pair", "live-evidence.pairs", `Missing Phase 5C-Q pair ${delta}:${scenarioId}.`);
      }
    }
  }
}

function validatePoint(
  point: ModelCoreLandCalciumUnitInterfaceRunPoint,
  pathLabel: string,
  errors: ValidationIssue[],
): void {
  if (
    point.independentlyInitializedPoint !== true
    || point.settled !== true
    || point.settleReason !== "converged"
    || point.healthStatus !== "ok"
    || point.tbvClassification !== "clean"
    || point.maxValveReverseMl > 0.05
    || point.providerInstrumentation.sourceActiveStressCallCount <= 0
    || point.activeTraceAudit.beatTraceCount <= 0
    || point.activeTraceAudit.overlaySampleCount <= 0
    || !Number.isFinite(point.CO_L)
    || !Number.isFinite(point.SV_L)
    || !Number.isFinite(point.QAoPeakMlPerSec)
    || !Number.isFinite(point.peakSigmaActPa)
    || !Number.isFinite(point.qAoCapRatioMax)
    || !Number.isFinite(point.aovQDotClampHitFraction)
  ) {
    addIssue(errors, "phase5q_point_health", pathLabel, "Every Phase 5C-Q point must be independently initialized, converged, clean, finite, overlaid, and non-reversing.");
  }
}

function validateMappedLandInstrumentation(
  point: ModelCoreLandCalciumUnitInterfaceRunPoint,
  errors: ValidationIssue[],
): void {
  const audit = point.providerInstrumentation.calciumMappingAudit;
  if (
    point.sourceProviderId.includes("land2017") !== true
    || point.providerInstrumentation.commitProviderStateAfterStepCount <= 0
    || point.providerInstrumentation.landSolveFailureCount !== 0
    || (point.providerInstrumentation.sourcePathAudit?.sampleCount ?? 0) <= 0
    || (point.providerInstrumentation.commitPathAudit?.sampleCount ?? 0) <= 0
    || !audit
    || audit.sourceCallCount <= 0
    || audit.debugCallCount <= 0
    || audit.commitCallCount <= 0
    || !isFiniteRange(audit.rawSourceInternalC)
    || !isFiniteRange(audit.mappedSourceFreeCalciumUM)
    || !isFiniteRange(audit.rawDebugInternalC)
    || !isFiniteRange(audit.mappedDebugFreeCalciumUM)
    || !isFiniteRange(audit.rawCommitBeforeInternalC)
    || !isFiniteRange(audit.mappedCommitBeforeFreeCalciumUM)
    || !isFiniteRange(audit.rawCommitAfterInternalC)
    || !isFiniteRange(audit.mappedCommitAfterFreeCalciumUM)
  ) {
    addIssue(errors, "phase5q_land_instrumentation", `live-evidence.${point.deltaVolumeMl}.${point.scenarioId}`, "Every mapped Land point must record source/commit/calcium mapping audits with zero solver failures.");
    return;
  }
  if (
    point.axis === "activation-equivalent"
    && (
      !isFiniteRange(audit.inverseTargetRaw)
      || !isFiniteRange(audit.inverseTargetClamped)
      || !isFiniteRange(audit.inverseCaT50UM)
      || audit.inverseTargetClampCount <= 0
    )
  ) {
    addIssue(errors, "phase5q_activation_inverse_audit", `live-evidence.${point.deltaVolumeMl}.${point.scenarioId}`, "Activation-equivalent mappings must record inverse target, clamp, and CaT50 ranges.");
  }
  if (
    point.axis !== "activation-equivalent"
    && (
      audit.inverseTargetRaw.min !== null
      || audit.inverseTargetClamped.min !== null
      || audit.inverseCaT50UM.min !== null
      || audit.inverseTargetClampCount !== 0
    )
  ) {
    addIssue(errors, "phase5q_non_activation_inverse_audit", `live-evidence.${point.deltaVolumeMl}.${point.scenarioId}`, "Non-activation mappings must not populate inverse aInf diagnostic ranges.");
  }
}

function validateAnalysis(
  analysis: ModelCoreLandCalciumUnitInterfaceAuditEvidence["analysis"],
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const bestFixed = analysis.bestFixedUnitCandidate;
  const bestActivation = analysis.bestActivationEquivalentCandidate;
  const phase5PReference = analysis.phase5PPositiveControlCandidate;
  if (
    analysis.classification !== "simple-unit-mapping-sufficient"
    || analysis.structuralAlternansRemovalClaim !== "not-established"
    || analysis.finalNoAlternansClaim !== "not-claimed"
    || analysis.officialMorphologyAcceptance !== "not-claimed"
    || analysis.runtimeReplacement !== "not-claimed"
  ) {
    addIssue(errors, "phase5q_interpretation", "live-evidence.analysis", "Phase 5C-Q must classify the unit-style calcium mapping signal without accepting structural alternans removal or runtime replacement.");
  }
  if (
    bestFixed.mappedLand.scenarioId !== "phase2b-absolute-peak-ca"
    || bestFixed.deltaVolumeMl !== -1250
    || bestFixed.mappedLand.axis !== "fixed-unit-scale"
    || bestFixed.comparison.matchedLegacyOutputRegime !== true
    || bestFixed.comparison.clampRegimeRecovered !== true
    || bestFixed.mappedLand.periodBeats !== 1
    || bestFixed.comparison.meanOutputMatchScore >= 0.15
    || bestFixed.comparison.mappedVsLegacyPeakSigmaActRatio < 0.8
    || bestFixed.comparison.mappedVsLegacyPeakSigmaActRatio > 1.25
  ) {
    addIssue(errors, "phase5q_best_fixed_candidate", "live-evidence.analysis.bestFixedUnitCandidate", "Best fixed unit-style mapping must enter the coarse legacy output/qDot regime while Land remains period-1.");
  }
  if (
    bestActivation.mappedLand.axis !== "activation-equivalent"
    || bestActivation.comparison.matchedLegacyOutputRegime !== true
  ) {
    addIssue(errors, "phase5q_best_activation_candidate", "live-evidence.analysis.bestActivationEquivalentCandidate", "Activation-equivalent mappings must stay diagnostic and recorded separately from the fixed-unit classification.");
  }
  if (
    phase5PReference.mappedLand.axis !== "positive-control-scale"
    || phase5PReference.comparison.matchedLegacyOutputRegime !== true
  ) {
    addIssue(errors, "phase5q_phase5p_reference_candidate", "live-evidence.analysis.phase5PPositiveControlCandidate", "Phase 5C-P positive-control scales must stay as reference candidates, not the basis for simple unit mapping classification.");
  }
  if (
    !analysis.requiredNextChecks.includes("SDIRK2-reference-before-final-no-alternans")
    || !analysis.requiredNextChecks.includes("Level-1-4-operating-point-calibration-before-runtime-design")
  ) {
    addIssue(errors, "phase5q_next_checks", "live-evidence.analysis.requiredNextChecks", "Phase 5C-Q must keep SDIRK2 reference and Level 1-4 operating-point calibration as required next checks.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5q_calcium_unit_signal",
    path: "live-evidence.analysis",
    message: "A fixed unit-style calcium mapping reaches the coarse legacy output/qDot regime while Land remains period-1; this is a source-interface signal, not runtime acceptance.",
  });
}

function validateArtifact(
  artifact: ModelCoreLandCalciumUnitInterfaceAuditEvidence,
  evidence: ModelCoreLandCalciumUnitInterfaceAuditEvidence,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5q_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match live Phase 5C-Q calcium unit/source-interface audit evidence.");
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const builderText = readFileSync(path.join(rootDir, BUILDER_PATH), "utf8");
  const readmeText = readOptionalText(rootDir, README_PATH);
  const roadmapText = readOptionalText(rootDir, ROADMAP_PATH);
  const routeDocText = readOptionalText(rootDir, ROUTE_DOC_PATH);
  const lanesText = readOptionalText(rootDir, HISTORICAL_LANES_PATH);
  const packageText = readOptionalText(rootDir, "package.json");
  if (
    !builderText.includes("calcium-unit-source-interface-audit-only")
    || !builderText.includes("activationEquivalentMappingsAreDiagnosticOnly: true")
    || !builderText.includes("fixedScale30IsPhase5PPositiveControlOnly: true")
    || !builderText.includes("PHASE5P_SCALE10_REFERENCE")
    || !builderText.includes("legacy-aInfRaw-equivalent-land-ca-trpn")
    || !builderText.includes("legacy-aInf-equivalent-land-ca-trpn")
    || !builderText.includes("mapCommitCallCalcium")
    || /finalNoAlternansClaim\s*:\s*"claimed"/.test(builderText)
  ) {
    addIssue(errors, "phase5q_builder_boundary", BUILDER_PATH, "Builder must keep Phase 5C-Q calcium-interface-only and claim-bounded.");
  }
  if (readmeText && (!readmeText.includes("Phase 5C-Q") || !readmeText.includes("simple unit-style calcium mapping"))) {
    addIssue(errors, "phase5q_readme", README_PATH, "README must record the Phase 5C-Q calcium unit/source-interface result.");
  }
  if (roadmapText && (!roadmapText.includes("Phase 5C-Q") || !roadmapText.includes("calcium unit/source-interface"))) {
    addIssue(errors, "phase5q_roadmap", ROADMAP_PATH, "Roadmap must record the Phase 5C-Q calcium unit/source-interface result.");
  }
  if (routeDocText && (!routeDocText.includes("Phase 5C-Q") || !routeDocText.includes("SDIRK2"))) {
    addIssue(errors, "phase5q_route_doc", ROUTE_DOC_PATH, "Route gate doc must keep Phase 5C-Q and SDIRK2 next-check boundary visible.");
  }
  if (lanesText && (!lanesText.includes("Phase 5C-Q") || !lanesText.includes("3-5 PR"))) {
    addIssue(errors, "phase5q_current_lanes", HISTORICAL_LANES_PATH, "Current lanes must show the Phase 5C-Q result and broad oracle cadence policy.");
  }
  if (packageText && !packageText.includes("verify:myocardium-modelcore-land-calcium-unit-interface-audit")) {
    addIssue(errors, "phase5q_package_script", "package.json", "package.json must expose the Phase 5C-Q verifier script.");
  }
}

function readOptionalText(rootDir: string, filePath: string): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
    return null;
  }
}

function arrayEquals<T extends string | number>(
  actual: readonly T[],
  expected: readonly T[],
): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isFiniteRange(range: { readonly min: number | null; readonly max: number | null } | undefined): boolean {
  return !!range && Number.isFinite(range.min) && Number.isFinite(range.max) && (range.min ?? 0) <= (range.max ?? 0);
}

function near(actual: number, expected: number, tolerance: number): boolean {
  return Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance;
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function printReport(report: ModelCoreLandCalciumUnitInterfaceAuditValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore Land calcium unit/source-interface audit ${status} `
    + `classification=${report.evidence.analysis.classification} `
    + `bestFixed=${report.evidence.analysis.bestFixedUnitCandidate.mappedLand.scenarioId} `
    + `score=${report.evidence.analysis.bestFixedUnitCandidate.comparison.meanOutputMatchScore} `
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
  const report = validateModelCoreLandCalciumUnitInterfaceAudit();
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
