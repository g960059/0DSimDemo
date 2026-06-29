import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";
import {
  ARTERIAL_ROOT_BOUNDARY_ATTRIBUTION_PHASE5AH_ID,
  buildArterialRootBoundaryAttributionPhase5AHEvidence,
  type ArterialRootBoundaryAttributionPhase5AHEvidence,
} from "@/tools/myocardium/buildArterialRootBoundaryAttributionPhase5AH";

export type ArterialRootBoundaryAttributionPhase5AHValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ArterialRootBoundaryAttributionPhase5AHValidationReport = {
  readonly pass: boolean;
  readonly evidence: ArterialRootBoundaryAttributionPhase5AHEvidence;
  readonly errors: readonly ArterialRootBoundaryAttributionPhase5AHValidationIssue[];
  readonly warnings: readonly ArterialRootBoundaryAttributionPhase5AHValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";
const UPSTREAM_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildArterialRootBoundaryAttributionPhase5AH.ts";
const VERIFIER_PATH = "tools/myocardium/verifyArterialRootBoundaryAttributionPhase5AH.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const CURRENT_LANES_PATH = "docs/status/current-lanes.md";
const PACKAGE_PATH = "package.json";

const EXPECTED_DOES_NOT_UNLOCK = [
  "freshModelRerun",
  "ModelCoreEquationChange",
  "topologyChange",
  "stateLayoutChange",
  "defaultParamChange",
  "runtimeDefaultFlip",
  "productionRegistryIntegration",
  "officialCaseWiring",
  "officialCaseReauthoring",
  "workbenchRuntimeWiring",
  "stateSchemaMigration",
  "qDotTuning",
  "qDotClampRemoval",
  "valveThresholdTuning",
  "valveLossTuning",
  "afterloadTuning",
  "preloadTuning",
  "LandParameterTuning",
  "TrefFudge",
  "sourceStressScaling",
  "directAoSAAdoption",
  "AoVBoundaryCarrierAdoption",
  "boundaryRootProductionAdoption",
  "valveLoadTimingAcceptance",
  "reflectionCoefficientClaim",
  "rootCauseAcceptance",
  "fixAcceptance",
  "officialMorphologyAcceptance",
  "finalNoAlternansAcceptance",
  "LandDefaultFlipUnlock",
  "clinicalScientificValidationClaim",
] as const;
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
  "engine/core/topology.ts",
  "engine/guytonStarlingChainProtocol.ts",
  "engine/guytonStarlingChainWorker.ts",
  "engine/guytonStarlingChainWorkerCore.ts",
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/harness.ts",
  "engine/presets.ts",
  "engine/previewController.ts",
  "engine/previewWorker.ts",
  "engine/previewWorkerProtocol.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "engine/steadyJob.ts",
  "engine/transitionSteadyProtocol.ts",
  "engine/transitionSteadyWorker.ts",
  "features/workbench",
  "officialCases.ts",
] as const;

export function validateArterialRootBoundaryAttributionPhase5AH(
  rootDir = process.cwd(),
): ArterialRootBoundaryAttributionPhase5AHValidationReport {
  const errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[] = [];
  const warnings: ArterialRootBoundaryAttributionPhase5AHValidationIssue[] = [];
  const evidence = resultArtifact as unknown as ArterialRootBoundaryAttributionPhase5AHEvidence;

  validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateArtifactHash(evidence, errors);
  validateUpstreamArtifact(rootDir, evidence, errors);
  validateSummary(evidence, errors);
  validatePointAttributions(evidence, errors);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5ah_runtime_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AH is an attribution diagnostic only; it does not adopt boundary/root inertance, remove qDot clamps, accept valve/load timing, or unlock Land default flip.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: ArterialRootBoundaryAttributionPhase5AHEvidence,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  const fresh = buildArterialRootBoundaryAttributionPhase5AHEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5ah_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AH artifact must match a fresh attribution builder run.");
  }
}

function validateIdentity(
  evidence: ArterialRootBoundaryAttributionPhase5AHEvidence,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ARTERIAL_ROOT_BOUNDARY_ATTRIBUTION_PHASE5AH_ID
    || evidence.phase !== "Phase 5AH"
    || evidence.claimBoundary !== "phase5ag-boundary-root-response-attribution-diagnostic-only"
    || evidence.upstreamPhase5AGArtifactId !== "arterial-root-boundary-timing-phase5ag-result-v1"
    || evidence.verifierScript !== "verify:myocardium-arterial-root-boundary-attribution"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
  ) {
    addIssue(errors, "phase5ah_identity", RESULT_ARTIFACT_PATH, "Phase 5AH identity, upstream link, verifier script, or hash is invalid.");
  }
  if (
    evidence.protocol.sourceArtifactId !== "arterial-root-boundary-timing-phase5ag-result-v1"
    || evidence.protocol.analysisScope !== "phase5ag-measured-full-matrix-candidate-attribution"
    || !arrayEquals(evidence.protocol.modelPathIds, ["stock-active-no-provider-v0", "developer-only-lv-land-v0"])
    || evidence.protocol.candidateId !== "boundary-root-l-plus-1x-aov-l-mechanism"
    || evidence.protocol.currentId !== "current-closure"
    || evidence.protocol.qDotReductionMin !== 0.25
    || evidence.protocol.healthFilter !== "measured-current-and-candidate-health-ok"
    || evidence.protocol.noFreshModelRerun !== true
  ) {
    addIssue(errors, "phase5ah_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5AH protocol must be a measured Phase 5AG attribution with no fresh model rerun.");
  }
}

function validateArtifactHash(
  evidence: ArterialRootBoundaryAttributionPhase5AHEvidence,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  const { normalizedSha256, ...withoutHash } = evidence;
  if (normalizedSha256 !== hashStable(withoutHash)) {
    addIssue(errors, "phase5ah_hash", RESULT_ARTIFACT_PATH, "Phase 5AH normalizedSha256 must match the stable hash of the artifact excluding the hash field.");
  }
}

function validateUpstreamArtifact(
  rootDir: string,
  evidence: ArterialRootBoundaryAttributionPhase5AHEvidence,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  const upstream = readJsonObject(rootDir, UPSTREAM_ARTIFACT_PATH, errors);
  if (!upstream) return;
  const normalizedSha256 = upstream.normalizedSha256;
  const { normalizedSha256: _normalizedSha256, ...withoutHash } = upstream;
  const actualHash = hashStable(withoutHash);
  if (
    upstream.id !== "arterial-root-boundary-timing-phase5ag-result-v1"
    || upstream.phase !== "Phase 5AG"
    || upstream.claimBoundary !== "closed-loop-sourced-boundary-root-timing-diagnostic-only"
    || normalizedSha256 !== actualHash
    || evidence.protocol.sourceArtifactHash !== actualHash
    || evidence.upstreamPhase5AGArtifactId !== upstream.id
  ) {
    addIssue(errors, "phase5ah_upstream_artifact", UPSTREAM_ARTIFACT_PATH, "Phase 5AH must independently verify the upstream Phase 5AG artifact identity and stable hash.");
  }
  const summary = upstream.summary as Record<string, unknown> | undefined;
  if (
    summary?.pointCount !== 15
    || summary?.healthOkCandidateComparisonCount !== 28
    || summary?.qDotAndTimingOutputPreservedCount !== 18
    || summary?.stockQDotAndTimingOutputPreservedCount !== 12
    || summary?.landQDotAndTimingOutputPreservedCount !== 6
  ) {
    addIssue(errors, "phase5ah_upstream_summary", `${UPSTREAM_ARTIFACT_PATH}.summary`, "Phase 5AH upstream Phase 5AG summary must match the measured attribution source.");
  }
}

function validateSummary(
  evidence: ArterialRootBoundaryAttributionPhase5AHEvidence,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  const rows = evidence.pointAttributions;
  const healthOkRows = rows.filter((row) => row.comparisonHealth === "health-ok");
  const stock = evidence.modelSummaries.find((summary) => summary.modelPathId === "stock-active-no-provider-v0");
  const land = evidence.modelSummaries.find((summary) => summary.modelPathId === "developer-only-lv-land-v0");
  if (!stock || !land) {
    addIssue(errors, "phase5ah_model_summaries", `${RESULT_ARTIFACT_PATH}.modelSummaries`, "Phase 5AH must include stock and Land model summaries.");
    return;
  }
  if (
    evidence.summary.upstreamPointCount !== 15
    || evidence.summary.candidateComparisonCount !== rows.length
    || evidence.summary.healthOkCandidateComparisonCount !== healthOkRows.length
    || evidence.summary.stockHealthOkCandidateComparisonCount !== stock.healthOkComparisonCount
    || evidence.summary.landHealthOkCandidateComparisonCount !== land.healthOkComparisonCount
    || evidence.summary.stockQDotTimingOutputPreservedCount !== stock.qDotTimingOutputPreservedCount
    || evidence.summary.landQDotTimingOutputPreservedCount !== land.qDotTimingOutputPreservedCount
    || evidence.summary.landTimingOnlyOutputPreservedCount !== land.timingOnlyOutputPreservedCount
    || evidence.summary.landOutputPreservedHealthOkCount !== land.outputPreservedHealthOkCount
    || evidence.summary.landSolveFailureCount !== land.landSolveFailureCount
  ) {
    addIssue(errors, "phase5ah_summary_consistency", `${RESULT_ARTIFACT_PATH}.summary`, "Phase 5AH summary counts must be recomputable from point attributions and model summaries.");
  }
  if (
    stock.healthOkComparisonCount !== 13
    || stock.qDotTimingOutputPreservedCount !== 12
    || stock.noClampImprovementOutputPreservedCount !== 1
    || land.healthOkComparisonCount !== 15
    || land.qDotTimingOutputPreservedCount !== 6
    || land.timingOnlyOutputPreservedCount !== 9
    || land.outputPreservedHealthOkCount !== 15
    || land.landSolveFailureCount !== 0
  ) {
    addIssue(errors, "phase5ah_expected_attribution_counts", `${RESULT_ARTIFACT_PATH}.modelSummaries`, "Phase 5AH expected attribution counts changed; re-check the interpretation boundary.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("does not support qDot clamp removal")
    || !evidence.summary.weakerLandResponseAttribution.includes("below-threshold")
    || !evidence.summary.hr120StockCostAttribution.includes("pre-existing non-health-ok edge")
    || !evidence.summary.recommendedNext.some((next) => next.includes("Land normal-floor LVEDP attribution"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("does not rerun or modify the model"))
  ) {
    addIssue(errors, "phase5ah_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Phase 5AH interpretation must stay attribution-only and point to LVEDP attribution next.");
  }
}

function validatePointAttributions(
  evidence: ArterialRootBoundaryAttributionPhase5AHEvidence,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  if (evidence.pointAttributions.length !== 30) {
    addIssue(errors, "phase5ah_point_count", `${RESULT_ARTIFACT_PATH}.pointAttributions`, "Phase 5AH must record one candidate attribution per point and model path.");
  }
  const normalLand = evidence.pointAttributions.find((row) =>
    row.pointId === "normal-floor" && row.modelPathId === "developer-only-lv-land-v0"
  );
  if (
    !normalLand
    || normalLand.comparisonHealth !== "health-ok"
    || normalLand.qDotResponseAttribution !== "timing-only-qdot-reduction-below-threshold-output-preserved"
    || normalLand.outputPreserved !== true
  ) {
    addIssue(errors, "phase5ah_normal_land", `${RESULT_ARTIFACT_PATH}.pointAttributions.normal-floor.land`, "Normal-floor Land must be attributed as health-ok timing-only with below-threshold qDot reduction.");
  }
  const hr120Stock = evidence.edgeAttributions.hr120Stock;
  if (
    hr120Stock.currentHealthStatus !== "failed"
    || hr120Stock.candidateHealthStatus !== "failed"
    || hr120Stock.attribution !== "pre-existing-stock-health-failure-non-health-ok-edge"
    || hr120Stock.candidateClassification !== "candidate-output-or-timing-cost"
  ) {
    addIssue(errors, "phase5ah_hr120_stock", `${RESULT_ARTIFACT_PATH}.edgeAttributions.hr120Stock`, "HR120 stock must remain a pre-existing non-health-ok edge attribution.");
  }
  const lowPreloadStock = evidence.edgeAttributions.lowPreloadStock;
  if (
    lowPreloadStock.currentHealthStatus !== "warning"
    || lowPreloadStock.candidateHealthStatus !== "failed"
    || lowPreloadStock.attribution !== "frozen-low-preload-stock-non-health-ok-edge-excluded"
  ) {
    addIssue(errors, "phase5ah_low_preload_stock", `${RESULT_ARTIFACT_PATH}.edgeAttributions.lowPreloadStock`, "Frozen low-preload stock must remain excluded from health-ok qDot/timing evidence.");
  }
}

function validateBoundary(
  evidence: ArterialRootBoundaryAttributionPhase5AHEvidence,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5ah_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AH boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5ah_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AH must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, UPSTREAM_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, ROADMAP_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_README_PATH, errors),
    readRequiredText(rootDir, CURRENT_LANES_PATH, errors),
    readRequiredText(rootDir, PACKAGE_PATH, errors),
  ];
  for (const file of files) {
    if (file) validateNoLocalAbsolutePaths(file.path, file.text, errors);
  }
  const builderText = textFor(files, BUILDER_PATH);
  const packageText = textFor(files, PACKAGE_PATH);
  const readmeText = textFor(files, README_PATH);
  const roadmapText = textFor(files, ROADMAP_PATH);
  const morphologyText = textFor(files, MORPHOLOGY_README_PATH);
  const currentLanesText = textFor(files, CURRENT_LANES_PATH);
  if (
    !builderText.includes("phase5ag-measured-full-matrix-candidate-attribution")
    || !builderText.includes("noQDotClampRemoval: true")
    || !builderText.includes("noBoundaryRootProductionAdoption: true")
    || !builderText.includes("noFreshModelRerun: true")
  ) {
    addIssue(errors, "phase5ah_builder_contract", BUILDER_PATH, "Builder must record attribution-only scope and no-adoption boundaries.");
  }
  if (!packageText.includes("verify:myocardium-arterial-root-boundary-attribution")) {
    addIssue(errors, "phase5ah_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AH verifier script.");
  }
  validateDocText(README_PATH, readmeText, errors, [
    "Phase 5AH",
    "arterial-root-boundary-attribution-phase5ah-result-v1",
    "attribution diagnostic",
    "no boundary/root production adoption",
    "Land default flip",
  ]);
  validateDocText(ROADMAP_PATH, roadmapText, errors, [
    "Phase 5AH",
    "boundary/root response attribution diagnostic",
    "15/15 health-ok output-preserved",
    "no fresh model rerun",
    "no qDot tuning or qDot clamp removal",
  ]);
  validateDocText(MORPHOLOGY_README_PATH, morphologyText, errors, [
    "Phase 5AH",
    "attribution diagnostic",
    "timing-only below-threshold qDot reductions",
    "not boundary/root fix acceptance",
  ]);
  validateDocText(CURRENT_LANES_PATH, currentLanesText, errors, [
    "Phase 5AH",
    "arterial-root-boundary-attribution-phase5ah-result-v1",
    "15/15 health-ok output-preserved",
    "qDot clamp removal remains unsupported",
    "Land normal-floor LVEDP",
  ]);
}

function validateNoProductionWiring(
  rootDir: string,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  const forbidden = [
    "arterial-root-boundary-attribution-phase5ah-result-v1",
    "verify:myocardium-arterial-root-boundary-attribution",
    "buildArterialRootBoundaryAttributionPhase5AH",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5ah_no_production_wiring", relative, `Production-facing file must not wire Phase 5AH diagnostic token ${token}.`);
        }
      }
    }
  }
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5ah_local_path", pathLabel, "Committed Phase 5AH evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5ah_missing_file", relativePath, "Required Phase 5AH file is missing.");
    return null;
  }
}

function readJsonObject(
  rootDir: string,
  relativePath: string,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path.join(rootDir, relativePath), "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      addIssue(errors, "phase5ah_json_object", relativePath, "Expected a JSON object.");
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    addIssue(errors, "phase5ah_json_parse", relativePath, "Required JSON artifact is missing or invalid.");
    return null;
  }
}

function validateDocText(
  pathLabel: string,
  text: string,
  errors: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
  requiredTokens: readonly string[],
): void {
  const missing = requiredTokens.filter((token) => !text.includes(token));
  if (missing.length > 0) {
    addIssue(errors, "phase5ah_docs", pathLabel, `Docs must record Phase 5AH attribution evidence and diagnostic boundary; missing ${missing.join(", ")}.`);
  }
}

function textFor(
  files: readonly ({ readonly path: string; readonly text: string } | null)[],
  pathLabel: string,
): string {
  return files.find((file) => file?.path === pathLabel)?.text ?? "";
}

function listFilesIfPresent(absolutePath: string): string[] {
  try {
    const stat = statSync(absolutePath);
    if (stat.isFile()) return [absolutePath];
    if (!stat.isDirectory()) return [];
    return readdirSync(absolutePath).flatMap((entry) => listFilesIfPresent(path.join(absolutePath, entry)));
  } catch {
    return [];
  }
}

function arrayEquals(left: readonly unknown[], right: readonly unknown[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, stable(object[key])]));
}

function addIssue(
  issues: ArterialRootBoundaryAttributionPhase5AHValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateArterialRootBoundaryAttributionPhase5AH(process.cwd());
  console.log(
    `Arterial boundary/root attribution Phase 5AH ${report.pass ? "PASS" : "FAIL"} `
    + `healthOk=${report.evidence.summary.healthOkCandidateComparisonCount} `
    + `stockQDotTiming=${report.evidence.summary.stockQDotTimingOutputPreservedCount} `
    + `landQDotTiming=${report.evidence.summary.landQDotTimingOutputPreservedCount} `
    + `landTimingOnly=${report.evidence.summary.landTimingOnlyOutputPreservedCount} `
    + `errors=${report.errors.length} warnings=${report.warnings.length}`,
  );
  for (const issue of [...report.errors, ...report.warnings]) {
    console.log(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
  if (!report.pass) process.exitCode = 1;
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyArterialRootBoundaryAttributionPhase5AH.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
