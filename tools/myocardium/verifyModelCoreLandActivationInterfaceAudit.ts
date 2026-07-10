import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/modelcore-land-activation-interface-audit-result-v1.json";
import {
  MODELCORE_LAND_ACTIVATION_INTERFACE_AUDIT_EVIDENCE_ID,
  buildModelCoreLandActivationInterfaceAuditEvidence,
  type ModelCoreLandActivationInterfaceAuditEvidence,
} from "@/tools/myocardium/buildModelCoreLandActivationInterfaceAuditEvidence";

export type ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ModelCoreLandActivationInterfaceAuditValidationReport = {
  readonly pass: boolean;
  readonly evidence: ModelCoreLandActivationInterfaceAuditEvidence;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/modelcore-land-activation-interface-audit-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildModelCoreLandActivationInterfaceAuditEvidence.ts";
const PROVIDER_PATH = "tools/myocardium/modelCoreLand2017LvSourceProvider.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const ROUTE_DOC_PATH = "docs/myocardium/roadmap/phase5c-modelcore-equivalent-route-gate.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";

export function validateModelCoreLandActivationInterfaceAudit(rootDir = process.cwd()):
ModelCoreLandActivationInterfaceAuditValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const evidence = buildModelCoreLandActivationInterfaceAuditEvidence();
  const artifact = resultArtifact as ModelCoreLandActivationInterfaceAuditEvidence;

  validateEvidence(evidence, errors, warnings);
  validateArtifact(artifact, evidence, errors);
  validateSourceText(rootDir, errors);

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateEvidence(
  evidence: ModelCoreLandActivationInterfaceAuditEvidence,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MODELCORE_LAND_ACTIVATION_INTERFACE_AUDIT_EVIDENCE_ID
    || evidence.phase !== "Phase 5C-O"
    || evidence.claimBoundary !== "activation-source-interface-audit-only"
    || evidence.upstreamOutputMatchStatus !== "not-overlapped"
    || evidence.verifierScript !== "verify:myocardium-modelcore-land-activation-interface-audit"
  ) {
    addIssue(errors, "phase5o_identity", "live-evidence", "Phase 5C-O evidence must identify the activation/source-interface audit.");
  }
  if (
    evidence.boundary.sourceProviderDifferenceOnlyScope !== "within-each-same-effective-tbv-pair-only"
    || evidence.boundary.crossTbvInterpretationIsSourceProviderOnly !== false
    || evidence.boundary.auditOnlyNoTuning !== true
    || evidence.boundary.noQDotTuning !== true
    || evidence.boundary.noValveTuning !== true
    || evidence.boundary.noAfterloadTuning !== true
    || evidence.boundary.noPreloadTuning !== true
    || evidence.boundary.noLandParameterTuning !== true
    || evidence.boundary.noRuntimeReplacement !== true
  ) {
    addIssue(errors, "phase5o_boundary", "live-evidence.boundary", "Phase 5C-O must remain audit-only and must not tune closure, preload, or Land parameters.");
  }
  if (
    evidence.diagnosticProtocol.diagnosticDeltasMl.length !== 2
    || !evidence.diagnosticProtocol.diagnosticDeltasMl.includes(-1250)
    || !evidence.diagnosticProtocol.diagnosticDeltasMl.includes(1000)
    || evidence.diagnosticProtocol.pointInitialization !== "independent-from-target-tbv-no-cross-point-warm-start"
  ) {
    addIssue(errors, "phase5o_protocol", "live-evidence.diagnosticProtocol", "Phase 5C-O must audit the pinned and Phase 5C-N best-Land diagnostic points with independent initialization.");
  }
  if (
    evidence.runHealth.allPointsSettledByConvergence !== true
    || evidence.runHealth.nonOkHealthPointCount !== 0
    || evidence.runHealth.landSolveFailureCount !== 0
    || evidence.runHealth.landSourceAuditSamplesPresent !== true
    || evidence.runHealth.landCommitAuditSamplesPresent !== true
  ) {
    addIssue(errors, "phase5o_run_health", "live-evidence.runHealth", "Phase 5C-O runs must converge with finite Land source and commit audit samples.");
  }
  for (const pair of evidence.pairs) {
    if (
      pair.sameClosureStableHash !== true
      || pair.sourceProviderDifferenceOnlyWithinPoint !== true
      || pair.legacy.deltaVolumeMl !== pair.land.deltaVolumeMl
      || pair.legacy.effectiveTotalBloodVolumeMl !== pair.land.effectiveTotalBloodVolumeMl
    ) {
      addIssue(errors, "phase5o_same_point_pairing", `live-evidence.pairs.${pair.deltaVolumeMl}`, "Each Phase 5C-O point must preserve same-closure source-provider-only pairing within the point.");
    }
    if (
      pair.land.providerInstrumentation.sourcePathAudit?.sampleCount == null
      || pair.land.providerInstrumentation.sourcePathAudit.sampleCount <= 0
      || pair.land.providerInstrumentation.commitPathAudit?.sampleCount == null
      || pair.land.providerInstrumentation.commitPathAudit.sampleCount <= 0
      || pair.land.providerInstrumentation.landSolveFailureCount !== 0
    ) {
      addIssue(errors, "phase5o_land_audit_samples", `live-evidence.pairs.${pair.deltaVolumeMl}.land`, "Land points must include source/commit audit samples and zero solver failures.");
    }
    if (
      !Number.isFinite(pair.stressGap.landPeakSigmaActToLegacyRatio)
      || pair.stressGap.landPeakSigmaActToLegacyRatio >= 0.01
      || !Number.isFinite(pair.stressGap.landSourcePathStressMaxToLegacyPeakSigmaRatio)
      || pair.stressGap.landSourcePathStressMaxToLegacyPeakSigmaRatio <= pair.stressGap.landPeakSigmaActToLegacyRatio
    ) {
      addIssue(errors, "phase5o_stress_gap", `live-evidence.pairs.${pair.deltaVolumeMl}.stressGap`, "Phase 5C-O must record a severe settled-trace Land stress gap while preserving the all-run source-path transient context.");
    }
  }
  if (
    evidence.auditInterpretation.classification !== "land-source-interface-underactivation-gap-observed"
    || evidence.auditInterpretation.structuralAlternansRemovalClaim !== "not-established"
    || evidence.auditInterpretation.finalNoAlternansClaim !== "not-claimed"
    || evidence.auditInterpretation.officialMorphologyAcceptance !== "not-claimed"
    || !evidence.auditInterpretation.recommendedNextChecks.includes("explicit-source-output-forcing-bracket-before-structural-attribution")
  ) {
    addIssue(errors, "phase5o_interpretation", "live-evidence.auditInterpretation", "Phase 5C-O must localize the output gap without claiming structural alternans removal or final no-alternans.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5o_underactivation_gap_observed",
    path: "live-evidence.auditInterpretation",
    message: "Settled Land trace stress is orders below legacy; next work should audit calcium/source scaling and explicit matched-regime forcing before structural attribution.",
  });
}

function validateArtifact(
  artifact: ModelCoreLandActivationInterfaceAuditEvidence,
  evidence: ModelCoreLandActivationInterfaceAuditEvidence,
  errors: ValidationIssue[],
): void {
  if (JSON.stringify(artifact) !== JSON.stringify(evidence)) {
    addIssue(errors, "phase5o_result_artifact", RESULT_ARTIFACT_PATH, "Result artifact must match live Phase 5C-O activation/source-interface audit evidence.");
  }
}

function validateSourceText(rootDir: string, errors: ValidationIssue[]): void {
  const builderText = readFileSync(path.join(rootDir, BUILDER_PATH), "utf8");
  const providerText = readFileSync(path.join(rootDir, PROVIDER_PATH), "utf8");
  const readmeText = readOptionalText(rootDir, README_PATH);
  const roadmapText = readOptionalText(rootDir, ROADMAP_PATH);
  const routeDocText = readOptionalText(rootDir, ROUTE_DOC_PATH);
  const lanesText = readOptionalText(rootDir, HISTORICAL_LANES_PATH);
  const packageText = readOptionalText(rootDir, "package.json");
  if (
    !builderText.includes("activation-source-interface-audit-only")
    || !builderText.includes("crossTbvInterpretationIsSourceProviderOnly: false")
    || !builderText.includes("structuralAlternansRemovalClaim: \"not-established\"")
    || /finalNoAlternansClaim\s*:\s*\"claimed\"/.test(builderText)
  ) {
    addIssue(errors, "phase5o_builder_boundary", BUILDER_PATH, "Builder must keep Phase 5C-O diagnostic-only and claim-bounded.");
  }
  if (
    !providerText.includes("sourcePathAudit")
    || !providerText.includes("commitPathAudit")
    || !providerText.includes("recordLandSignalAuditSample")
  ) {
    addIssue(errors, "phase5o_provider_audit", PROVIDER_PATH, "Land provider instrumentation must expose source and commit path signal audits.");
  }
  if (readmeText && !readmeText.includes("Phase 5C-O")) {
    addIssue(errors, "phase5o_readme", README_PATH, "README must record the Phase 5C-O activation/source-interface audit result.");
  }
  if (roadmapText && !roadmapText.includes("Phase 5C-O")) {
    addIssue(errors, "phase5o_roadmap", ROADMAP_PATH, "Roadmap must record the Phase 5C-O activation/source-interface audit result.");
  }
  if (routeDocText && !routeDocText.includes("Phase 5C-O")) {
    addIssue(errors, "phase5o_route_doc", ROUTE_DOC_PATH, "Route gate doc must keep the Phase 5C-O boundary visible.");
  }
  if (lanesText && !lanesText.includes("Phase 5C-O")) {
    addIssue(errors, "phase5o_current_lanes", HISTORICAL_LANES_PATH, "Current lanes must show the Phase 5C-O result and next diagnostic.");
  }
  if (packageText && !packageText.includes("verify:myocardium-modelcore-land-activation-interface-audit")) {
    addIssue(errors, "phase5o_package_script", "package.json", "package.json must expose the Phase 5C-O verifier script.");
  }
}

function readOptionalText(rootDir: string, filePath: string): string | null {
  try {
    return readFileSync(path.join(rootDir, filePath), "utf8");
  } catch {
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

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  const normalizedScriptPath =
    path.normalize("tools/myocardium/verifyModelCoreLandActivationInterfaceAudit.ts");
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const isViteNodeEntrypoint = Boolean(entrypoint) && path.basename(entrypoint) === "vite-node";
  const isThisModule = path.normalize(new URL(import.meta.url).pathname).endsWith(normalizedScriptPath);
  return isViteNodeEntrypoint && isThisModule;
}

if (isDirectExecution()) {
  const report = validateModelCoreLandActivationInterfaceAudit();
  for (const error of report.errors) {
    console.error(`ERROR ${error.code} ${error.path}: ${error.message}`);
  }
  for (const warning of report.warnings) {
    console.warn(`WARNING ${warning.code} ${warning.path}: ${warning.message}`);
  }
  console.log(
    `ModelCore Land activation/interface audit ${report.pass ? "PASS" : "FAIL"} `
    + `classification=${report.evidence.auditInterpretation.classification} `
    + `errors=${report.errors.length} warnings=${report.warnings.length}`,
  );
  if (!report.pass) process.exitCode = 1;
}
