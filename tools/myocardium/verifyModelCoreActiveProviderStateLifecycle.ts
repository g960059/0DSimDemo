import { readFileSync } from "node:fs";
import path from "node:path";
import descriptor from "@/data/myocardium/protocols/modelcore-active-provider-state-lifecycle-v1.json";
import {
  MODELCORE_ACTIVE_PROVIDER_STATE_LIFECYCLE_EVIDENCE_ID,
  MODELCORE_TEST_STATEFUL_ACTIVE_PROVIDER_ID,
  buildModelCoreActiveProviderStateLifecycleEvidence,
  type ModelCoreActiveProviderStateLifecycleEvidence,
} from "@/tools/myocardium/buildModelCoreActiveProviderStateLifecycleEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCoreActiveProviderStateLifecycleValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCoreActiveProviderStateLifecycleEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const DESCRIPTOR_PATH = "data/myocardium/protocols/modelcore-active-provider-state-lifecycle-v1.json";
const MODELCORE_PATH = "engine/ModelCore.ts";

export function validateModelCoreActiveProviderStateLifecycle(rootDir = process.cwd()): ModelCoreActiveProviderStateLifecycleValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCoreActiveProviderStateLifecycleEvidence();

  if (
    descriptor.id !== MODELCORE_ACTIVE_PROVIDER_STATE_LIFECYCLE_EVIDENCE_ID
    || descriptor.phase !== "Phase 5C-J"
    || descriptor.claimBoundary !== "experimental-provider-state-lifecycle-only"
    || descriptor.ownerDecision.status !== "accepted-experimental-branch-only"
    || descriptor.stateLifecycleContract.modelCoreOwnsProviderState !== true
    || descriptor.stateLifecycleContract.providerCallsReceiveClonedStateSnapshots !== true
    || descriptor.stateLifecycleContract.rhsAndPressureCallsAreNotCommitPoints !== true
    || descriptor.stateLifecycleContract.commitProviderStateAfterStepRunsOncePerStep !== true
    || descriptor.stateLifecycleContract.readOnlyMeasurementCloneRestoresIndependentProviderState !== true
    || descriptor.stateLifecycleContract.providerStateIsExcludedFromProductionStateSchema !== true
    || descriptor.stateLifecycleContract.publicUnpackStateResetsProviderState !== true
    || descriptor.stateLifecycleContract.productionRuntimeReplacement !== false
    || descriptor.stateLifecycleContract.caseWorkbenchOfficialRuntimeWiring !== false
    || descriptor.routeAssessment.routeSatisfactionStatus !== "partial-legacy-positive-control-pass-land-pairing-not-run"
    || descriptor.routeAssessment.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(errors, "modelcore_state_lifecycle_descriptor", DESCRIPTOR_PATH, "Descriptor must record an experimental lifecycle precondition without runtime replacement or final no-alternans claims.");
  }

  if (
    evidence.evidenceId !== MODELCORE_ACTIVE_PROVIDER_STATE_LIFECYCLE_EVIDENCE_ID
    || evidence.descriptorId !== descriptor.id
    || evidence.phase !== "Phase 5C-J"
    || evidence.productionRuntimeStatus !== "not-production-runtime-replacement"
    || evidence.statefulProviderId !== MODELCORE_TEST_STATEFUL_ACTIVE_PROVIDER_ID
    || evidence.lifecycleEvidence.initialStateVersion !== 0
    || evidence.lifecycleEvidence.afterOneStepStateVersion !== 1
    || evidence.lifecycleEvidence.afterOneStepCommitCount !== 1
    || evidence.lifecycleEvidence.afterOneStepPressureMutationCount !== 0
    || evidence.lifecycleEvidence.oneCommitPerStepObserved !== true
    || evidence.lifecycleEvidence.providerStateCloneOnCallObserved !== true
    || evidence.lifecycleEvidence.readOnlyCloneParentStateVersionAfter !== evidence.lifecycleEvidence.readOnlyCloneParentStateVersionBefore
    || evidence.lifecycleEvidence.readOnlyCloneLeakObserved !== false
    || evidence.lifecycleEvidence.publicUnpackAfterResetStateVersion !== 0
    || evidence.lifecycleEvidence.publicUnpackAfterResetCommitCount !== 0
    || evidence.lifecycleEvidence.publicUnpackProviderStateResetObserved !== true
    || evidence.lifecycleEvidence.sampleCount <= 0
    || !/^[0-9a-f]{8}$/.test(evidence.lifecycleEvidence.stableHash)
    || evidence.routeAssessment.lifecycleStatus !== "modelcore-owned-provider-state-lifecycle-implemented"
    || evidence.routeAssessment.routeSatisfactionStatus !== "partial-legacy-positive-control-pass-land-pairing-not-run"
    || evidence.routeAssessment.sourceProviderDifferenceOnlyStatus !== "not-yet-evaluated"
    || evidence.routeAssessment.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(errors, "modelcore_state_lifecycle_evidence", "live-evidence", "Live evidence must prove ModelCore-owned state, one commit per step, clone-on-call isolation, and read-only clone isolation without satisfying the Land route.");
  }

  const modelCoreText = readFileSync(path.join(rootDir, MODELCORE_PATH), "utf8");
  for (const symbol of descriptor.requiredCodeSymbols) {
    if (!modelCoreText.includes(symbol)) {
      addIssue(errors, "modelcore_state_lifecycle_symbol", MODELCORE_PATH, `ModelCore must include lifecycle symbol ${symbol}.`);
    }
  }
  if (/finalNoAlternans\s*[:=]\s*true|officialMorphologyPass\s*[:=]\s*true|runtimeReplacement\s*[:=]\s*true/.test(modelCoreText)) {
    addIssue(errors, "modelcore_state_lifecycle_forbidden_claim", MODELCORE_PATH, "Lifecycle plumbing must not add runtime replacement, official morphology, or final no-alternans enabling flags.");
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
    "Usage: npm run verify:myocardium-modelcore-active-provider-state-lifecycle -- [--root=DIR]",
    "",
    "Validates the Phase 5C-J experimental ModelCore active-provider state lifecycle evidence.",
  ].join("\n"));
}

function printReport(report: ModelCoreActiveProviderStateLifecycleValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore active-provider state lifecycle ${status} `
    + `commitCount=${report.evidence.lifecycleEvidence.afterOneStepCommitCount} `
    + `stateVersion=${report.evidence.lifecycleEvidence.afterOneStepStateVersion} `
    + `readOnlyLeak=${String(report.evidence.lifecycleEvidence.readOnlyCloneLeakObserved)} `
    + `errors=${report.errors.length} warnings=${report.warnings.length}`,
  );
  for (const issue of report.errors) {
    console.error(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateModelCoreActiveProviderStateLifecycle(options.rootDir);
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
