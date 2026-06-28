import { readFileSync } from "node:fs";
import path from "node:path";
import descriptor from "@/data/myocardium/protocols/modelcore-active-source-pressure-adapter-v1.json";
import {
  MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_EVIDENCE_ID,
  buildModelCoreActiveSourcePressureAdapterEvidence,
  type ModelCoreActiveSourcePressureAdapterEvidence,
} from "@/tools/myocardium/buildModelCoreActiveSourcePressureAdapterEvidence";
import {
  MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_ID,
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
} from "@/tools/myocardium/modelCoreActiveSourcePressureAdapter";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCoreActiveSourcePressureAdapterValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCoreActiveSourcePressureAdapterEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const DESCRIPTOR_PATH = "data/myocardium/protocols/modelcore-active-source-pressure-adapter-v1.json";
const MODELCORE_PATH = "engine/ModelCore.ts";
const CHAMBERS_PATH = "engine/chambers.ts";
const ADAPTER_PATH = "tools/myocardium/modelCoreActiveSourcePressureAdapter.ts";

export function validateModelCoreActiveSourcePressureAdapter(rootDir = process.cwd()):
ModelCoreActiveSourcePressureAdapterValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCoreActiveSourcePressureAdapterEvidence();

  if (
    descriptor.id !== MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_EVIDENCE_ID
    || descriptor.phase !== "Phase 5C-K"
    || descriptor.claimBoundary !== "experimental-source-only-pressure-adapter-readiness"
    || descriptor.ownerDecision.status !== "accepted-experimental-branch-only"
    || descriptor.sourceOnlyPressureAdapterContract.sourceProviderScope !== "LV-only-legacy-positive-control"
    || descriptor.sourceOnlyPressureAdapterContract.providerSuppliesSourceActiveFiberStressPa !== true
    || descriptor.sourceOnlyPressureAdapterContract.providerDoesNotSupplyPressureMethod !== true
    || descriptor.sourceOnlyPressureAdapterContract.providerDoesNotSupplyPassivePressureMethod !== true
    || descriptor.sourceOnlyPressureAdapterContract.providerDoesNotSupplyDebugPressureTermsMethod !== true
    || descriptor.sourceOnlyPressureAdapterContract.providerSuppliesSourceSpecificDebugActiveStressTerms !== true
    || descriptor.sourceOnlyPressureAdapterContract.modelCoreUsesExistingActiveStressPressureAssembly !== true
    || descriptor.sourceOnlyPressureAdapterContract.legacyFullPressureProviderComparatorRequired !== true
    || descriptor.sourceOnlyPressureAdapterContract.legacySourceOnlyAdapterPeriod2Required !== true
    || descriptor.sourceOnlyPressureAdapterContract.legacyFullPressureEquivalenceRequired !== true
    || descriptor.sourceOnlyPressureAdapterContract.providerObjectMutableSolverStateAllowed !== false
    || descriptor.sourceOnlyPressureAdapterContract.mutableSolverStateMustLiveInProviderState !== true
    || descriptor.sourceOnlyPressureAdapterContract.instrumentationCountersMayLiveOutsideProviderState !== true
    || descriptor.sourceOnlyPressureAdapterContract.landProviderPairingRun !== false
    || descriptor.sourceOnlyPressureAdapterContract.productionRuntimeReplacement !== false
    || descriptor.sourceOnlyPressureAdapterContract.caseWorkbenchOfficialRuntimeWiring !== false
    || descriptor.routeAssessment.routeSatisfactionStatus !== "partial-legacy-positive-control-pass-land-pairing-not-run"
    || descriptor.routeAssessment.sourceProviderDifferenceOnlyStatus !== "adapter-ready-land-not-yet-evaluated"
    || descriptor.routeAssessment.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(errors, "modelcore_source_pressure_adapter_descriptor", DESCRIPTOR_PATH, "Descriptor must record a source-only pressure adapter precondition without Land pairing, runtime replacement, or final no-alternans claims.");
  }

  if (
    evidence.evidenceId !== MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_EVIDENCE_ID
    || evidence.descriptorId !== descriptor.id
    || evidence.phase !== "Phase 5C-K"
    || evidence.productionRuntimeStatus !== "not-production-runtime-replacement"
    || evidence.adapterBoundary.adapterId !== MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_ID
    || evidence.adapterBoundary.sourceOnlyProviderId !== MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID
    || evidence.adapterBoundary.sourceProviderScope !== "LV-only-legacy-positive-control"
    || evidence.adapterBoundary.sourceOnlyProviderHasPressureMethod !== false
    || evidence.adapterBoundary.sourceOnlyProviderHasPassivePressureMethod !== false
    || evidence.adapterBoundary.sourceOnlyProviderHasDebugPressureTermsMethod !== false
    || evidence.adapterBoundary.sourceOnlyProviderHasSourceSpecificDebugActiveStressTerms !== true
    || evidence.adapterBoundary.sourceActiveStressPathInvoked !== true
    || evidence.adapterBoundary.modelCorePressureAssemblyPathRequired !== true
    || evidence.adapterBoundary.providerObjectMutableSolverStateAllowed !== false
    || evidence.adapterBoundary.mutableSolverStateMustLiveInProviderState !== true
    || evidence.adapterBoundary.instrumentationCountersMayLiveOutsideProviderState !== true
    || evidence.fullPressureProviderPositiveControl.status !== "period-2-positive-control-pass"
    || evidence.sourceOnlyAdapterPositiveControl.status !== "period-2-positive-control-pass"
    || evidence.sourceOnlyAdapterPositiveControl.periodBeats !== 2
    || evidence.sourceOnlyAdapterPositiveControl.adjacentDelta <= 0.1
    || evidence.sourceOnlyAdapterPositiveControl.periodDelta >= 0.05
    || evidence.sourceOnlyAdapterPositiveControl.tbvClassification !== "clean"
    || evidence.sourceOnlyAdapterPositiveControl.tbvSanitizeAbsMl > 0.05
    || evidence.sourceOnlyAdapterPositiveControl.tbvProjectionAppliedMl > 0.05
    || evidence.sourceOnlyAdapterPositiveControl.maxValveReverseMl > 0.05
    || evidence.equivalenceEvidence.stableHashesMatch !== true
    || evidence.equivalenceEvidence.maxAbsNumericDifference > evidence.equivalenceEvidence.tolerance
    || evidence.equivalenceEvidence.legacySourceOnlyPressureEquivalent !== true
    || evidence.hookInvocationEvidence.fullPressureInvocationCounts.pressure <= 0
    || evidence.hookInvocationEvidence.sourceOnlyInvocationCounts.sourceActiveStressPa <= 0
    || evidence.hookInvocationEvidence.sourceOnlyInvocationCounts.internalDerivatives <= 0
    || evidence.routeAssessment.adapterStatus !== "source-only-pressure-adapter-implemented"
    || evidence.routeAssessment.routeSatisfactionStatus !== "partial-legacy-positive-control-pass-land-pairing-not-run"
    || evidence.routeAssessment.sourceProviderDifferenceOnlyStatus !== "adapter-ready-land-not-yet-evaluated"
    || evidence.routeAssessment.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(errors, "modelcore_source_pressure_adapter_evidence", "live-evidence", "Live evidence must prove source-only adapter period-2 reproduction, full-pressure equivalence, hook invocation, and an unsatisfied Land route.");
  }

  const modelCoreText = readFileSync(path.join(rootDir, MODELCORE_PATH), "utf8");
  const chambersText = readFileSync(path.join(rootDir, CHAMBERS_PATH), "utf8");
  const adapterText = readFileSync(path.join(rootDir, ADAPTER_PATH), "utf8");
  const combinedText = `${modelCoreText}\n${chambersText}\n${adapterText}`;
  for (const symbol of descriptor.requiredCodeSymbols) {
    if (!combinedText.includes(symbol)) {
      addIssue(errors, "modelcore_source_pressure_adapter_symbol", `${MODELCORE_PATH}/${CHAMBERS_PATH}/${ADAPTER_PATH}`, `Source pressure adapter must include symbol ${symbol}.`);
    }
  }
  if (!modelCoreText.includes("provider.sourceActiveStressPa") || !chambersText.includes("bodyPressureTerms")) {
    addIssue(errors, "modelcore_source_pressure_adapter_wiring", MODELCORE_PATH, "ModelCore must route sourceActiveStressPa through the existing ActiveStressChamberModel pressure assembly.");
  }
  if (!modelCoreText.includes("validateExperimentalActiveSourceProviders") || !modelCoreText.includes("must not define")) {
    addIssue(errors, "modelcore_source_pressure_adapter_contract_enforcement", MODELCORE_PATH, "ModelCore must enforce source-only provider mutual exclusivity before paired Land evidence can rely on the contract.");
  }
  if (/finalNoAlternans\s*[:=]\s*true|officialMorphologyPass\s*[:=]\s*true|runtimeReplacement\s*[:=]\s*true/.test(combinedText)) {
    addIssue(errors, "modelcore_source_pressure_adapter_forbidden_claim", "source-pressure-adapter-files", "Source pressure adapter plumbing must not add runtime replacement, official morphology, or final no-alternans enabling flags.");
  }

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path, message });
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
    "Usage: npm run verify:myocardium-modelcore-active-source-pressure-adapter -- [--root=DIR]",
    "",
    "Validates the Phase 5C-K experimental ModelCore source-only pressure adapter evidence.",
  ].join("\n"));
}

function printReport(report: ModelCoreActiveSourcePressureAdapterValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore active-source pressure adapter ${status} `
    + `periodBeats=${report.evidence.sourceOnlyAdapterPositiveControl.periodBeats} `
    + `maxDiff=${report.evidence.equivalenceEvidence.maxAbsNumericDifference} `
    + `sourceCalls=${report.evidence.hookInvocationEvidence.sourceOnlyInvocationCounts.sourceActiveStressPa} `
    + `errors=${report.errors.length} warnings=${report.warnings.length}`,
  );
  for (const issue of report.errors) {
    console.error(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateModelCoreActiveSourcePressureAdapter(options.rootDir);
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
