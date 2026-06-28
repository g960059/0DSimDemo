import { readFileSync } from "node:fs";
import path from "node:path";
import descriptor from "@/data/myocardium/protocols/modelcore-equivalent-positive-control-closure-evidence-v1.json";
import gate from "@/data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json";
import {
  MODELCORE_EQUIVALENT_POSITIVE_CONTROL_EVIDENCE_ID,
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
  buildModelCoreEquivalentPositiveControlClosureEvidence,
  type ModelCoreEquivalentPositiveControlClosureEvidence,
} from "@/tools/myocardium/buildModelCoreEquivalentPositiveControlClosureEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCoreEquivalentPositiveControlClosureValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCoreEquivalentPositiveControlClosureEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const GATE_PATH = "data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json";
const DESCRIPTOR_PATH = "data/myocardium/protocols/modelcore-equivalent-positive-control-closure-evidence-v1.json";
const MODELCORE_PATH = "engine/ModelCore.ts";

export function validateModelCoreEquivalentPositiveControlClosure(rootDir = process.cwd()): ModelCoreEquivalentPositiveControlClosureValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCoreEquivalentPositiveControlClosureEvidence();

  if (
    descriptor.id !== MODELCORE_EQUIVALENT_POSITIVE_CONTROL_EVIDENCE_ID
    || descriptor.phase !== "Phase 5C-I"
    || descriptor.claimBoundary !== "experimental-modelcore-source-provider-positive-control-only"
    || descriptor.ownerDecision.status !== "accepted"
    || descriptor.experimentalWiring.sourceProviderId !== MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID
    || descriptor.experimentalWiring.productionRuntimeReplacement !== false
    || descriptor.experimentalWiring.hookInvocationEvidenceRequired !== true
    || descriptor.routeAssessment.routeSatisfactionStatus !== "partial-legacy-positive-control-pass-land-pairing-not-run"
  ) {
    addIssue(errors, "modelcore_equivalent_descriptor", DESCRIPTOR_PATH, "Evidence descriptor must record the owner-approved experimental source-provider boundary without production runtime adoption.");
  }

  const route = gate.allowedEntryRoutes.find((candidate) => candidate.routeId === "modelcore-equivalent-closure-positive-control");
  if (
    !route
    || route.status !== "satisfied-experimental-paired-land-run"
    || route.requiredEvidence.closureImplementationStatus !== "experimental-source-provider-hook-implemented"
    || route.requiredEvidence.routeSatisfactionStatus !== "satisfied-paired-land-provider-run-finite"
    || route.requiredEvidence.doesNotSatisfyCurrentNoGo !== true
    || gate.gateStatus !== "entry-route-satisfied-interpretation-pending"
    || gate.blockedUntil.runtimeReplacement !== false
  ) {
    addIssue(errors, "modelcore_equivalent_gate_boundary", GATE_PATH, "Gate must record the experimental hook as the historical positive-control prerequisite and the later paired Land route as satisfied while keeping runtime replacement blocked.");
  }

  if (
    evidence.sourceProviderIds.LV !== MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID
    || evidence.productionRuntimeStatus !== "not-production-runtime-replacement"
    || evidence.legacyPositiveControl.status !== "period-2-positive-control-pass"
    || evidence.legacyPositiveControl.periodBeats !== 2
    || evidence.legacyPositiveControl.adjacentDelta <= 0.1
    || evidence.legacyPositiveControl.periodDelta >= 0.05
    || evidence.legacyPositiveControl.tbvClassification !== "clean"
    || evidence.legacyPositiveControl.tbvSanitizeAbsMl > 0.05
    || evidence.legacyPositiveControl.tbvProjectionAppliedMl > 0.05
    || evidence.legacyPositiveControl.maxValveReverseMl > 0.05
    || evidence.routeAssessment.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(errors, "modelcore_equivalent_positive_control", "live-evidence", "Experimental ModelCore source-provider positive control must reproduce the pinned period-2 branch with clean event-surface evidence and no final no-alternans claim.");
  }
  if (
    evidence.hookInvocationEvidence.sourceProviderId !== MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID
    || evidence.hookInvocationEvidence.totalInvocations <= 0
    || evidence.hookInvocationEvidence.initialStatePathInvoked !== true
    || evidence.hookInvocationEvidence.pressurePathInvoked !== true
    || evidence.hookInvocationEvidence.derivativePathInvoked !== true
    || evidence.hookInvocationEvidence.invocationCounts.initialInternal <= 0
    || evidence.hookInvocationEvidence.invocationCounts.pressure <= 0
    || evidence.hookInvocationEvidence.invocationCounts.internalDerivatives <= 0
  ) {
    addIssue(errors, "modelcore_equivalent_hook_invocation", "live-evidence.hookInvocationEvidence", "Experimental evidence must prove the ModelCore source-provider hook was invoked for initialization, pressure, and derivative paths.");
  }

  const modelCoreText = readFileSync(path.join(rootDir, MODELCORE_PATH), "utf8");
  if (!modelCoreText.includes("ModelCoreExperimentalActiveSourceProvider") || !modelCoreText.includes("debugExperimentalActiveSourceProviderIds")) {
    addIssue(errors, "modelcore_equivalent_hook", MODELCORE_PATH, "ModelCore must expose the experimental active source-provider hook and debug source-provider ids for artifact-only evidence.");
  }
  if (/runtimeReplacement\s*[:=]\s*true|officialMorphologyPass\s*[:=]\s*true|finalNoAlternans\s*[:=]\s*true/.test(modelCoreText)) {
    addIssue(errors, "modelcore_equivalent_forbidden_runtime_claim", MODELCORE_PATH, "ModelCore hook must not add production runtime, official morphology, or final no-alternans enabling flags.");
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
    "Usage: npm run verify:myocardium-modelcore-equivalent-positive-control-closure -- [--root=DIR]",
    "",
    "Validates the Phase 5C-I experimental ModelCore source-provider positive-control evidence.",
  ].join("\n"));
}

function printReport(report: ModelCoreEquivalentPositiveControlClosureValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  console.log(
    `ModelCore-equivalent positive-control closure ${status} `
    + `periodBeats=${report.evidence.legacyPositiveControl.periodBeats} `
    + `adjacentDelta=${report.evidence.legacyPositiveControl.adjacentDelta} `
    + `errors=${report.errors.length} warnings=${report.warnings.length}`,
  );
  for (const issue of report.errors) {
    console.error(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateModelCoreEquivalentPositiveControlClosure(options.rootDir);
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
