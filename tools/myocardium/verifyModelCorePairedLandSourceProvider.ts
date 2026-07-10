import { readFileSync } from "node:fs";
import path from "node:path";
import descriptor from "@/data/myocardium/protocols/modelcore-paired-land-source-provider-run-v1.json";
import resultArtifact from "@/data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json";
import {
  MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID,
  buildModelCorePairedLandSourceProviderEvidence,
  type ModelCorePairedLandSourceProviderEvidence,
} from "@/tools/myocardium/buildModelCorePairedLandSourceProviderEvidence";
import {
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
} from "@/tools/myocardium/modelCoreActiveSourcePressureAdapter";
import {
  MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCorePairedLandSourceProviderValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCorePairedLandSourceProviderEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const DESCRIPTOR_PATH = "data/myocardium/protocols/modelcore-paired-land-source-provider-run-v1.json";
const RESULT_ARTIFACT_PATH = "data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json";
const PROVIDER_PATH = "tools/myocardium/modelCoreLand2017LvSourceProvider.ts";
const ENGINE_PROVIDER_PATH = "engine/myocardium/modelCoreLand2017LvSourceProvider.ts";
const BUILDER_PATH = "tools/myocardium/buildModelCorePairedLandSourceProviderEvidence.ts";
const ROUTE_DOC_PATH = "docs/myocardium/roadmap/phase5c-modelcore-equivalent-route-gate.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";

export function validateModelCorePairedLandSourceProvider(rootDir = process.cwd()):
ModelCorePairedLandSourceProviderValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCorePairedLandSourceProviderEvidence();

  validateDescriptor(errors);
  validateEvidence(evidence, errors, warnings);
  validateResultArtifact(evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateDescriptor(errors: ValidationIssue[]): void {
  if (
    descriptor.id !== MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID
    || descriptor.phase !== "Phase 5C-L"
    || descriptor.claimBoundary !== "experimental-paired-land-source-provider-run-only"
    || descriptor.ownerDecision.status !== "accepted-experimental-branch-only"
    || descriptor.pairedRunContract.legacyProviderId !== MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID
    || descriptor.pairedRunContract.landProviderId !== MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID
    || descriptor.pairedRunContract.sourceProviderScope !== "LV-only-experimental-comparison"
    || descriptor.pairedRunContract.usesSameModelCoreClosure !== true
    || descriptor.pairedRunContract.sourceProviderDifferenceOnlyRequired !== true
    || descriptor.pairedRunContract.landProviderPairingRun !== true
    || descriptor.pairedRunContract.legacyPositiveControlPeriod2Required !== true
    || descriptor.pairedRunContract.providerObjectMutableSolverStateAllowed !== false
    || descriptor.pairedRunContract.mutableSolverStateMustLiveInProviderState !== true
    || descriptor.pairedRunContract.noQDotTuning !== true
    || descriptor.pairedRunContract.noValveTuning !== true
    || descriptor.pairedRunContract.noAfterloadTuning !== true
    || descriptor.pairedRunContract.noPreloadTuning !== true
    || descriptor.pairedRunContract.noLandParameterTuning !== true
    || descriptor.pairedRunContract.productionRuntimeReplacement !== false
    || descriptor.pairedRunContract.caseWorkbenchOfficialRuntimeWiring !== false
    || descriptor.resultArtifact.path !== RESULT_ARTIFACT_PATH
    || descriptor.resultArtifact.id !== resultArtifact.id
    || descriptor.resultArtifact.status !== "recorded-live-verifier-cross-checked"
    || descriptor.routeAssessment.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(errors, "phase5l_descriptor_boundary", DESCRIPTOR_PATH, "Descriptor must define a real paired Land source-provider run while forbidding tuning, runtime replacement, and final no-alternans claims.");
  }
  for (const key of ["A", "B", "C"] as const) {
    if (typeof descriptor.allowedOutcomeClasses[key] !== "string") {
      addIssue(errors, "phase5l_outcome_class", DESCRIPTOR_PATH, `Descriptor must preregister outcome class ${key}.`);
    }
  }
}

function validateResultArtifact(
  evidence: ModelCorePairedLandSourceProviderEvidence,
  errors: ValidationIssue[],
): void {
  const legacyArtifact = resultArtifact.legacyPositiveControl;
  const legacyLive = evidence.legacyPositiveControl;
  const landArtifact = resultArtifact.landRun;
  const landLive = evidence.landRun;
  const instrumentationArtifact = resultArtifact.landSourceProviderInstrumentation;
  const instrumentationLive = evidence.landSourceProviderEvidence.instrumentation;
  const comparisonArtifact = resultArtifact.reportOnlyComparison;
  const comparisonLive = evidence.reportOnlyComparison;
  if (
    resultArtifact.schemaVersion !== 1
    || resultArtifact.id !== "modelcore-paired-land-source-provider-run-result-v1"
    || resultArtifact.phase !== "Phase 5C-L"
    || resultArtifact.claimBoundary !== "experimental-paired-land-source-provider-run-result-only"
    || resultArtifact.descriptorPath !== DESCRIPTOR_PATH
    || resultArtifact.descriptorId !== descriptor.id
    || resultArtifact.verifierScript !== "verify:myocardium-modelcore-paired-land-source-provider"
  ) {
    addIssue(errors, "phase5l_result_artifact_identity", RESULT_ARTIFACT_PATH, "Result artifact must identify the Phase 5C-L paired run and verifier script.");
  }
  if (
    resultArtifact.fixedLowPreloadProtocol.baselineTotalBloodVolumeMl !== evidence.fixedLowPreloadProtocol.baselineTotalBloodVolumeMl
    || resultArtifact.fixedLowPreloadProtocol.deltaTotalBloodVolumeMl !== evidence.fixedLowPreloadProtocol.deltaTotalBloodVolumeMl
    || resultArtifact.fixedLowPreloadProtocol.effectiveTotalBloodVolumeMl !== evidence.fixedLowPreloadProtocol.effectiveTotalBloodVolumeMl
    || resultArtifact.fixedLowPreloadProtocol.heartModel !== evidence.fixedLowPreloadProtocol.heartModel
    || resultArtifact.fixedLowPreloadProtocol.integrationDtSec !== evidence.fixedLowPreloadProtocol.integrationDtSec
    || resultArtifact.fixedLowPreloadProtocol.sampleHz !== evidence.fixedLowPreloadProtocol.sampleHz
    || resultArtifact.fixedLowPreloadProtocol.traceBeats !== evidence.fixedLowPreloadProtocol.traceBeats
    || resultArtifact.fixedLowPreloadProtocol.returnMapAcceptance !== evidence.fixedLowPreloadProtocol.returnMapAcceptance
    || resultArtifact.closureEquivalenceEvidence.protocolStableHash !== evidence.closureEquivalenceEvidence.protocolStableHash
    || resultArtifact.closureEquivalenceEvidence.legacyClosureStableHash !== evidence.closureEquivalenceEvidence.legacyClosureStableHash
    || resultArtifact.closureEquivalenceEvidence.landClosureStableHash !== evidence.closureEquivalenceEvidence.landClosureStableHash
    || resultArtifact.closureEquivalenceEvidence.stableHashesMatch !== evidence.closureEquivalenceEvidence.stableHashesMatch
    || resultArtifact.closureEquivalenceEvidence.sameProtocolSettings !== evidence.closureEquivalenceEvidence.sameProtocolSettings
    || resultArtifact.closureEquivalenceEvidence.sameEventSurfaceSettings !== evidence.closureEquivalenceEvidence.sameEventSurfaceSettings
    || resultArtifact.closureEquivalenceEvidence.sameBeatSelection !== evidence.closureEquivalenceEvidence.sameBeatSelection
    || resultArtifact.closureEquivalenceEvidence.sameSampling !== evidence.closureEquivalenceEvidence.sameSampling
  ) {
    addIssue(errors, "phase5l_result_artifact_protocol", RESULT_ARTIFACT_PATH, "Result artifact must match the live fixed protocol and closure-equivalence evidence.");
  }
  if (
    legacyArtifact.sourceProviderId !== legacyLive.sourceProviderId
    || legacyArtifact.status !== legacyLive.status
    || legacyArtifact.settled !== legacyLive.settled
    || legacyArtifact.periodBeats !== legacyLive.periodBeats
    || !approximatelyEqual(legacyArtifact.adjacentDelta, legacyLive.adjacentDelta)
    || !approximatelyEqual(legacyArtifact.periodDelta, legacyLive.periodDelta)
    || legacyArtifact.tbvClassification !== legacyLive.tbvClassification
    || !approximatelyEqual(legacyArtifact.tbvSanitizeAbsMl, legacyLive.tbvSanitizeAbsMl)
    || !approximatelyEqual(legacyArtifact.tbvProjectionAppliedMl, legacyLive.tbvProjectionAppliedMl)
    || !approximatelyEqual(legacyArtifact.maxValveReverseMl, legacyLive.maxValveReverseMl)
    || legacyArtifact.healthStatus !== legacyLive.healthStatus
    || legacyArtifact.finiteTracePayload !== legacyLive.finiteTracePayload
    || !isRecordedStableHash(legacyArtifact.payloadStableHash)
    || landArtifact.sourceProviderId !== landLive.sourceProviderId
    || landArtifact.status !== landLive.status
    || landArtifact.settled !== landLive.settled
    || landArtifact.periodBeats !== landLive.periodBeats
    || !approximatelyEqual(landArtifact.adjacentDelta, landLive.adjacentDelta)
    || !approximatelyEqual(landArtifact.periodDelta, landLive.periodDelta)
    || landArtifact.tbvClassification !== landLive.tbvClassification
    || !approximatelyEqual(landArtifact.tbvSanitizeAbsMl, landLive.tbvSanitizeAbsMl)
    || !approximatelyEqual(landArtifact.tbvProjectionAppliedMl, landLive.tbvProjectionAppliedMl)
    || !approximatelyEqual(landArtifact.maxValveReverseMl, landLive.maxValveReverseMl)
    || landArtifact.healthStatus !== landLive.healthStatus
    || landArtifact.finiteTracePayload !== landLive.finiteTracePayload
    || !isRecordedStableHash(landArtifact.payloadStableHash)
  ) {
    addIssue(errors, "phase5l_result_artifact_run_summary", RESULT_ARTIFACT_PATH, "Result artifact must match live legacy and Land run summaries while retaining recorded payload hashes.");
  }
  if (
    instrumentationArtifact.sourceActiveStressPa !== instrumentationLive.sourceActiveStressPa
    || instrumentationArtifact.internalDerivatives !== instrumentationLive.internalDerivatives
    || instrumentationArtifact.debugActiveStressTerms !== instrumentationLive.debugActiveStressTerms
    || instrumentationArtifact.commitProviderStateAfterStep !== instrumentationLive.commitProviderStateAfterStep
    || instrumentationArtifact.landSolveOkCount !== instrumentationLive.landSolveOkCount
    || instrumentationArtifact.landSolveFailureCount !== instrumentationLive.landSolveFailureCount
    || !approximatelyEqual(instrumentationArtifact.maxSourceDebugStressDifferencePa, instrumentationLive.maxSourceDebugStressDifferencePa)
  ) {
    addIssue(errors, "phase5l_result_artifact_instrumentation", RESULT_ARTIFACT_PATH, "Result artifact must match live Land provider invocation and solver instrumentation.");
  }
  if (
    comparisonArtifact.landVsLegacyPeriodBeatsDelta !== comparisonLive.landVsLegacyPeriodBeatsDelta
    || !approximatelyEqual(comparisonArtifact.landVsLegacyCOLDeltaLMin, comparisonLive.landVsLegacyCOLDeltaLMin)
    || !approximatelyEqual(comparisonArtifact.landVsLegacySVDeltaMl, comparisonLive.landVsLegacySVDeltaMl)
    || !approximatelyEqual(comparisonArtifact.landVsLegacyQAoPeakDeltaMlPerSec, comparisonLive.landVsLegacyQAoPeakDeltaMlPerSec)
    || !approximatelyEqual(comparisonArtifact.landVsLegacyPeakSigmaActDeltaPa, comparisonLive.landVsLegacyPeakSigmaActDeltaPa)
    || comparisonArtifact.morphologyAcceptance !== comparisonLive.morphologyAcceptance
    || resultArtifact.routeAssessment.routeId !== evidence.routeAssessment.routeId
    || resultArtifact.routeAssessment.routeSatisfactionStatus !== evidence.routeAssessment.routeSatisfactionStatus
    || resultArtifact.routeAssessment.sourceProviderDifferenceOnlyStatus !== evidence.routeAssessment.sourceProviderDifferenceOnlyStatus
    || resultArtifact.routeAssessment.secondOrderReferenceStillRequired !== evidence.routeAssessment.secondOrderReferenceStillRequired
    || resultArtifact.routeAssessment.finalNoAlternansClaim !== evidence.routeAssessment.finalNoAlternansClaim
    || resultArtifact.outcomeInterpretation.outcomeClass !== evidence.outcomeInterpretation.outcomeClass
    || resultArtifact.outcomeInterpretation.outcomeMeaning !== evidence.outcomeInterpretation.outcomeMeaning
    || resultArtifact.outcomeInterpretation.finalNoAlternansClaim !== evidence.outcomeInterpretation.finalNoAlternansClaim
    || resultArtifact.outcomeInterpretation.officialMorphologyAcceptance !== evidence.outcomeInterpretation.officialMorphologyAcceptance
  ) {
    addIssue(errors, "phase5l_result_artifact_interpretation", RESULT_ARTIFACT_PATH, "Result artifact must match live report-only comparison, route assessment, and outcome interpretation.");
  }
  if (
    resultArtifact.outcomeInterpretation.finalNoAlternansClaim !== "not-claimed"
    || resultArtifact.outcomeInterpretation.officialMorphologyAcceptance !== "not-claimed"
    || resultArtifact.reportOnlyComparison.morphologyAcceptance !== "not-claimed"
    || resultArtifact.routeAssessment.finalNoAlternansClaim !== "not-claimed"
    || !resultArtifact.doesNotUnlock.includes("runtimeReplacement")
    || !resultArtifact.doesNotUnlock.includes("finalNoAlternans")
    || !resultArtifact.doesNotUnlock.includes("officialMorphologyAcceptance")
    || !resultArtifact.doesNotUnlock.includes("qDotTuning")
    || !resultArtifact.doesNotUnlock.includes("valveThresholdTuning")
    || !resultArtifact.doesNotUnlock.includes("arterialLoadTuning")
    || !resultArtifact.doesNotUnlock.includes("preloadTuning")
    || !resultArtifact.doesNotUnlock.includes("landParameterTuning")
    || !resultArtifact.doesNotUnlock.includes("TriSegAdoption")
    || !resultArtifact.doesNotUnlock.includes("StudioScientificValidityClaim")
  ) {
    addIssue(errors, "phase5l_result_artifact_boundary", RESULT_ARTIFACT_PATH, "Result artifact must keep acceptance, runtime, and tuning claims blocked.");
  }
}

function validateEvidence(
  evidence: ModelCorePairedLandSourceProviderEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.evidenceId !== MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID
    || evidence.descriptorId !== descriptor.id
    || evidence.phase !== "Phase 5C-L"
    || evidence.claimBoundary !== "experimental-paired-land-source-provider-run-only"
    || evidence.productionRuntimeStatus !== "not-production-runtime-replacement"
    || evidence.pairedRunBoundary.legacyProviderId !== MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID
    || evidence.pairedRunBoundary.landProviderId !== MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID
    || evidence.pairedRunBoundary.sourceProviderScope !== "LV-only-experimental-comparison"
    || evidence.pairedRunBoundary.usesSameModelCoreClosure !== true
    || evidence.pairedRunBoundary.landProviderPairingRun !== true
    || evidence.pairedRunBoundary.providerObjectMutableSolverStateAllowed !== false
    || evidence.pairedRunBoundary.mutableSolverStateMustLiveInProviderState !== true
    || evidence.pairedRunBoundary.noQDotTuning !== true
    || evidence.pairedRunBoundary.noValveTuning !== true
    || evidence.pairedRunBoundary.noAfterloadTuning !== true
    || evidence.pairedRunBoundary.noPreloadTuning !== true
    || evidence.pairedRunBoundary.noLandParameterTuning !== true
  ) {
    addIssue(errors, "phase5l_evidence_boundary", "live-evidence", "Live evidence must remain an LV-only paired source-provider experiment with no tuning or runtime replacement.");
  }
  if (
    evidence.legacyPositiveControl.status !== "period-2-positive-control-pass"
    || evidence.legacyPositiveControl.periodBeats !== 2
    || evidence.legacyPositiveControl.adjacentDelta <= 0.1
    || evidence.legacyPositiveControl.periodDelta >= 0.05
    || evidence.legacyPositiveControl.tbvClassification !== "clean"
    || evidence.legacyPositiveControl.tbvSanitizeAbsMl > 0.05
    || evidence.legacyPositiveControl.tbvProjectionAppliedMl > 0.05
    || evidence.legacyPositiveControl.maxValveReverseMl > 0.05
  ) {
    addIssue(errors, "phase5l_legacy_positive_control", "live-evidence.legacyPositiveControl", "Legacy source-only positive control must reproduce the pinned period-2 branch under the same ModelCore closure.");
  }
  if (
    evidence.closureEquivalenceEvidence.stableHashesMatch !== true
    || evidence.pairedRunBoundary.sourceProviderDifferenceOnly !== true
    || evidence.routeAssessment.sourceProviderDifferenceOnlyStatus !== "satisfied-for-experimental-lv-source-only-pair"
  ) {
    addIssue(errors, "phase5l_source_provider_difference_only", "live-evidence.closureEquivalenceEvidence", "Paired run must preserve closure/protocol/event-surface settings and differ only by LV source provider.");
  }
  if (
    evidence.landSourceProviderEvidence.sourceActiveStressPathInvoked !== true
    || evidence.landSourceProviderEvidence.internalDerivativesPathInvoked !== true
    || evidence.landSourceProviderEvidence.debugActiveStressTermsInvoked !== true
    || evidence.landSourceProviderEvidence.commitPathInvoked !== true
    || evidence.landSourceProviderEvidence.sourceDebugStressCoherencePass !== true
  ) {
    addIssue(errors, "phase5l_land_provider_invocation", "live-evidence.landSourceProviderEvidence", "Land provider must invoke source stress, derivative, debug, and commit paths with coherent source/debug stress.");
  }
  if (!["A", "B", "C"].includes(evidence.outcomeInterpretation.outcomeClass)) {
    addIssue(errors, "phase5l_outcome_classification", "live-evidence.outcomeInterpretation", "Land paired result must be classified into preregistered A/B/C outcomes.");
  }
  if (
    evidence.outcomeInterpretation.finalNoAlternansClaim !== "not-claimed"
    || evidence.outcomeInterpretation.officialMorphologyAcceptance !== "not-claimed"
    || evidence.routeAssessment.finalNoAlternansClaim !== "not-claimed"
    || evidence.reportOnlyComparison.morphologyAcceptance !== "not-claimed"
  ) {
    addIssue(errors, "phase5l_forbidden_acceptance_claim", "live-evidence.outcomeInterpretation", "Phase 5C-L must not claim final no-alternans or official morphology acceptance.");
  }
  if (evidence.landRun.status === "nonfinite-or-provider-failure") {
    addIssue(
      warnings,
      "phase5l_land_nonfinite_outcome",
      "live-evidence.landRun",
      "Land paired run reached outcome C; this is an experiment result to interpret, not a verifier failure.",
      "warning",
    );
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const engineProviderText = readOptionalText(rootDir, ENGINE_PROVIDER_PATH);
  const providerIssuePath = engineProviderText ? ENGINE_PROVIDER_PATH : PROVIDER_PATH;
  const providerText = engineProviderText ?? readFileSync(path.join(rootDir, PROVIDER_PATH), "utf8");
  const builderText = readFileSync(path.join(rootDir, BUILDER_PATH), "utf8");
  const routeDocText = readOptionalText(rootDir, ROUTE_DOC_PATH);
  const currentLanesText = readOptionalText(rootDir, HISTORICAL_LANES_PATH);
  if (
    !providerText.includes("initialProviderState")
    || !providerText.includes("cloneProviderState")
    || !providerText.includes("commitProviderStateAfterStep")
    || !providerText.includes("sourceActiveStressPa")
    || providerText.includes("pressure: (")
    || providerText.includes("passivePressure: (")
    || providerText.includes("debugPressureTerms: (")
  ) {
    addIssue(errors, "phase5l_land_provider_contract", providerIssuePath, "Land provider must be source-only, stateful through providerState, and must not define pressure/passive/debugPressureTerms.");
  }
  if (
    !builderText.includes("runLowPreloadDebug")
    || !builderText.includes("legacyActiveStressLvSourceOnlyProvider")
    || !builderText.includes("land2017LvSourceOnlyProvider")
    || !builderText.includes("classifyOutcome")
  ) {
    addIssue(errors, "phase5l_live_experiment_builder", BUILDER_PATH, "Builder must run paired legacy/Land providers through runLowPreloadDebug and classify the result.");
  }
  if (/finalNoAlternans\s*[:=]\s*true|officialMorphologyPass\s*[:=]\s*true|runtimeReplacement\s*[:=]\s*true/.test(`${providerText}\n${builderText}`)) {
    addIssue(errors, "phase5l_forbidden_flags", `${providerIssuePath}/${BUILDER_PATH}`, "Phase 5C-L sources must not enable runtime replacement, official morphology, or final no-alternans flags.");
  }
  if (routeDocText && !routeDocText.includes("Phase 5C-L")) {
    addIssue(errors, "phase5l_route_doc", ROUTE_DOC_PATH, "Route doc must record the paired Land source-provider run result boundary.");
  }
  if (currentLanesText && !currentLanesText.includes("paired Land source-provider")) {
    addIssue(errors, "phase5l_current_lanes", HISTORICAL_LANES_PATH, "Current lanes must keep the paired Land source-provider run visible.");
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
  return Number.isFinite(actual)
    && Number.isFinite(expected)
    && Math.abs(actual - expected) <= 1e-6;
}

function isRecordedStableHash(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{8}$/.test(value);
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  path: string,
  message: string,
  severity: ValidationIssue["severity"] = "error",
): void {
  issues.push({ severity, code, path, message });
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
    "Usage: npm run verify:myocardium-modelcore-paired-land-source-provider -- [--root=DIR]",
    "",
    "Runs and validates the Phase 5C-L paired Land source-provider experiment.",
  ].join("\n"));
}

function printReport(report: ModelCorePairedLandSourceProviderValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore paired Land source-provider ${status} `
    + `outcome=${report.evidence.outcomeInterpretation.outcomeClass} `
    + `landStatus=${report.evidence.landRun.status} `
    + `legacyPeriod=${report.evidence.legacyPositiveControl.periodBeats} `
    + `landPeriod=${report.evidence.landRun.periodBeats} `
    + `landSourceCalls=${report.evidence.landSourceProviderEvidence.instrumentation.sourceActiveStressPa} `
    + `landFailures=${report.evidence.landSourceProviderEvidence.instrumentation.landSolveFailureCount} `
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
  const report = validateModelCorePairedLandSourceProvider(options.rootDir);
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
