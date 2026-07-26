import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json";
import {
  LAND_NORMAL_FLOOR_LVEDP_ATTRIBUTION_PHASE5AI_ID,
  buildLandNormalFloorLvedpAttributionPhase5AIEvidence,
  type LandNormalFloorLvedpAttributionPhase5AIEvidence,
} from "@/tools/myocardium/buildLandNormalFloorLvedpAttributionPhase5AI";

export type LandNormalFloorLvedpAttributionPhase5AIValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type LandNormalFloorLvedpAttributionPhase5AIValidationReport = {
  readonly pass: boolean;
  readonly evidence: LandNormalFloorLvedpAttributionPhase5AIEvidence;
  readonly errors: readonly LandNormalFloorLvedpAttributionPhase5AIValidationIssue[];
  readonly warnings: readonly LandNormalFloorLvedpAttributionPhase5AIValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json";
const UPSTREAM_PHASE5X_ARTIFACT_PATH =
  "data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json";
const UPSTREAM_PHASE5AH_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildLandNormalFloorLvedpAttributionPhase5AI.ts";
const VERIFIER_PATH = "tools/myocardium/verifyLandNormalFloorLvedpAttributionPhase5AI.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const PACKAGE_PATH = "package.json";

const EXPECTED_DOES_NOT_UNLOCK = [
  "runtimeDefaultFlip",
  "legacyActiveStressDeletion",
  "officialCaseWiring",
  "officialCaseReauthoring",
  "workbenchRuntimeWiring",
  "stateSchemaMigration",
  "productionRegistryIntegration",
  "perCaseTuning",
  "acceptedPreloadTuning",
  "acceptedVenousToneTuning",
  "acceptedPassiveTuning",
  "acceptedGeometryTuning",
  "acceptedSourceCalciumScaling",
  "TrefFudge",
  "LandParameterTuning",
  "qDotTuning",
  "valveTuning",
  "sourceStressScaling",
  "officialMorphologyAcceptance",
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

export function validateLandNormalFloorLvedpAttributionPhase5AI(
  rootDir = process.cwd(),
): LandNormalFloorLvedpAttributionPhase5AIValidationReport {
  const errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[] = [];
  const warnings: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[] = [];
  const evidence = resultArtifact as unknown as LandNormalFloorLvedpAttributionPhase5AIEvidence;

  validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateArtifactHash(evidence, errors);
  validateUpstreamArtifacts(rootDir, evidence, errors);
  validateSummary(evidence, errors);
  validateRuns(evidence, errors);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5ai_runtime_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AI bounds Land normal-floor LVEDP attribution only; it does not flip defaults, tune parameters, wire cases, or accept official morphology.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: LandNormalFloorLvedpAttributionPhase5AIEvidence,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  const fresh = buildLandNormalFloorLvedpAttributionPhase5AIEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5ai_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AI artifact must match a fresh builder run.");
  }
}

function validateIdentity(
  evidence: LandNormalFloorLvedpAttributionPhase5AIEvidence,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== LAND_NORMAL_FLOOR_LVEDP_ATTRIBUTION_PHASE5AI_ID
    || evidence.phase !== "Phase 5AI"
    || evidence.claimBoundary !== "land-normal-floor-lvedp-attribution-diagnostic-only"
    || evidence.upstreamPhase5XArtifactId !== "lv-land-default-candidate-preflight-phase5x-result-v1"
    || evidence.upstreamPhase5AHArtifactId !== "arterial-root-boundary-attribution-phase5ah-result-v1"
    || evidence.verifierScript !== "verify:myocardium-land-normal-floor-lvedp-attribution"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
    || !/^[a-f0-9]{64}$/.test(evidence.upstreamPhase5XArtifactHash)
    || !/^[a-f0-9]{64}$/.test(evidence.upstreamPhase5AHArtifactHash)
  ) {
    addIssue(errors, "phase5ai_identity", RESULT_ARTIFACT_PATH, "Phase 5AI identity, upstream links, verifier script, or hashes are invalid.");
  }
  if (
    evidence.protocol.measurementMode !== "independent-normal-floor-single-axis-probes-v1"
    || evidence.protocol.targetBaselineTBVMl !== 5600
    || evidence.protocol.measureOptions.dt !== 0.001
    || evidence.protocol.measureOptions.sampleHz !== 240
    || evidence.protocol.measureOptions.measureBeats !== 3
    || evidence.protocol.measureOptions.requireProjectorQuiet !== false
    || evidence.protocol.probeCount !== 16
    || evidence.protocol.sourceProviderScope !== "LV-only"
    || evidence.protocol.calciumMappingScenario !== "phase2b-absolute-peak-ca"
    || evidence.protocol.outputPreservedRatioRange[0] !== 0.85
    || evidence.protocol.outputPreservedRatioRange[1] !== 1.15
    || evidence.protocol.floorThresholds.LVEDPApprox.max !== 16
  ) {
    addIssue(errors, "phase5ai_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5AI protocol must remain the independent normal-floor LVEDP single-axis diagnostic.");
  }
}

function validateArtifactHash(
  evidence: LandNormalFloorLvedpAttributionPhase5AIEvidence,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  const { normalizedSha256, ...withoutHash } = evidence;
  if (normalizedSha256 !== hashStable(withoutHash)) {
    addIssue(errors, "phase5ai_hash", RESULT_ARTIFACT_PATH, "Phase 5AI normalizedSha256 must match the stable hash of the artifact excluding the hash field.");
  }
}

function validateUpstreamArtifacts(
  rootDir: string,
  evidence: LandNormalFloorLvedpAttributionPhase5AIEvidence,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  const phase5X = readJsonObject(rootDir, UPSTREAM_PHASE5X_ARTIFACT_PATH, errors);
  if (phase5X) {
    const phase5XHash = artifactHash(phase5X);
    const normalFloor = phase5X.normalOperatingPointFloor as Record<string, unknown> | undefined;
    const observed = normalFloor?.observed as Record<string, unknown> | undefined;
    const failures = normalFloor?.failures;
    if (
      phase5X.id !== "lv-land-default-candidate-preflight-phase5x-result-v1"
      || phase5X.phase !== "Phase 5X"
      || phase5X.claimBoundary !== "early-default-candidate-user-knob-morphology-preflight-diagnostic-only"
      || evidence.upstreamPhase5XArtifactHash !== phase5XHash
      || observed?.LVEDPApprox !== 17.276729
      || !Array.isArray(failures)
      || !failures.includes("LVEDPApprox")
    ) {
      addIssue(errors, "phase5ai_upstream_phase5x", UPSTREAM_PHASE5X_ARTIFACT_PATH, "Phase 5AI must verify the Phase 5X normal-floor LVEDP blocker source and stable hash.");
    }
  }

  const phase5AH = readJsonObject(rootDir, UPSTREAM_PHASE5AH_ARTIFACT_PATH, errors);
  if (phase5AH) {
    const phase5AHHash = artifactHash(phase5AH);
    const summary = phase5AH.summary as Record<string, unknown> | undefined;
    if (
      phase5AH.id !== "arterial-root-boundary-attribution-phase5ah-result-v1"
      || phase5AH.phase !== "Phase 5AH"
      || phase5AH.claimBoundary !== "phase5ag-boundary-root-response-attribution-diagnostic-only"
      || evidence.upstreamPhase5AHArtifactHash !== phase5AHHash
      || summary?.landOutputPreservedHealthOkCount !== 15
      || summary?.landSolveFailureCount !== 0
    ) {
      addIssue(errors, "phase5ai_upstream_phase5ah", UPSTREAM_PHASE5AH_ARTIFACT_PATH, "Phase 5AI must verify the Phase 5AH Land solve/output context and stable hash.");
    }
  }
}

function validateSummary(
  evidence: LandNormalFloorLvedpAttributionPhase5AIEvidence,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  const runs = evidence.runs;
  const resolvedOutputPreserved = runs.filter((run) =>
    run.classification === "lvedp-resolved-output-preserved-diagnostic-only"
  );
  if (
    evidence.summary.measuredRunCount !== 16
    || evidence.runs.length !== 16
    || resolvedOutputPreserved.length !== 3
    || evidence.summary.landBaselineLVEDPApprox !== 17.276729
    || evidence.summary.landBaselineLVEDPExcessMmHg !== 1.276729
    || evidence.summary.defaultFlipBlockerStatus !== "bounded-small-lvedp-excess-diagnostic-only"
    || !arrayEquals(evidence.summary.lvedpResolvedOutputPreservedRunIds, [
      "land-lv-bpas-0p90",
      "land-lv-bpas-0p85",
      "land-ca-release-1p10",
    ])
    || !arrayEquals(evidence.summary.passiveProxyResolvedRunIds, [
      "land-lv-bpas-0p90",
      "land-lv-bpas-0p85",
    ])
    || !arrayEquals(evidence.summary.sourceCalciumResolvedRunIds, ["land-ca-release-1p10"])
    || evidence.summary.smallestPreloadReductionResolvedRunId !== null
  ) {
    addIssue(errors, "phase5ai_summary", `${RESULT_ARTIFACT_PATH}.summary`, "Phase 5AI summary counts or blocker classification changed; re-check the interpretation boundary.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("bounded attribution only")
    || !evidence.summary.recommendedNext.some((next) => next.includes("default-flip RFC"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not accepted parameter changes"))
    || evidence.summary.landBaselineOtherFloorFailures.length !== 0
  ) {
    addIssue(errors, "phase5ai_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Phase 5AI interpretation must stay bounded and must not accept tuning or default flip.");
  }
}

function validateRuns(
  evidence: LandNormalFloorLvedpAttributionPhase5AIEvidence,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  const runsById = new Map(evidence.runs.map((run) => [run.id, run]));
  const stock = runsById.get("stock-current-normal");
  const land = runsById.get("land-current-normal");
  if (
    !stock
    || !land
    || stock.health?.status !== "ok"
    || land.health?.status !== "ok"
    || stock.floorFailures.length !== 0
    || !arrayEquals(land.floorFailures, ["LVEDPApprox"])
    || land.classification !== "reference-land-blocked-by-lvedp"
  ) {
    addIssue(errors, "phase5ai_reference_runs", `${RESULT_ARTIFACT_PATH}.runs`, "Stock and Land reference runs must reproduce the Phase 5X normal-floor LVEDP blocker.");
  }
  for (const id of ["land-tbv-5550", "land-tbv-5500", "land-tbv-5450", "land-venous-tone-0p10", "land-venous-tone-0p12", "land-venous-tone-0p18"]) {
    if (runsById.get(id)?.classification !== "lvedp-unresolved-diagnostic-only") {
      addIssue(errors, "phase5ai_preload_venous_unresolved", `${RESULT_ARTIFACT_PATH}.runs.${id}`, "Preload/TBV and venous-tone probes must not be promoted as resolving this blocker.");
    }
  }
  for (const id of ["land-lv-bpas-0p90", "land-lv-bpas-0p85", "land-ca-release-1p10"]) {
    const run = runsById.get(id);
    if (
      !run
      || run.health?.status !== "ok"
      || run.classification !== "lvedp-resolved-output-preserved-diagnostic-only"
      || run.outputPreservedVsLandBaseline !== true
      || run.floorFailures.length !== 0
    ) {
      addIssue(errors, "phase5ai_resolved_runs", `${RESULT_ARTIFACT_PATH}.runs.${id}`, "Only the expected passive-proxy/source-calcium diagnostic probes should resolve LVEDP with output preserved.");
    }
  }
  const landRuns = evidence.runs.filter((run) => run.modelPathId === "developer-only-lv-land-v0");
  if (landRuns.some((run) => run.providerInstrumentation?.landSolveFailureCount !== 0)) {
    addIssue(errors, "phase5ai_land_solve_failure", `${RESULT_ARTIFACT_PATH}.runs`, "Land diagnostic probes must not hide LVEDP attribution behind Land solve failures.");
  }
}

function validateBoundary(
  evidence: LandNormalFloorLvedpAttributionPhase5AIEvidence,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5ai_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AI boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5ai_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AI must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, UPSTREAM_PHASE5X_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, UPSTREAM_PHASE5AH_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, ROADMAP_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_README_PATH, errors),
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

  if (
    !builderText.includes("land-normal-floor-lvedp-attribution-diagnostic-only")
    || !builderText.includes("upstreamPhase5XArtifactHash")
    || !builderText.includes("noTrefFudge: true")
    || !builderText.includes("noRuntimeDefaultFlip: true")
  ) {
    addIssue(errors, "phase5ai_builder_contract", BUILDER_PATH, "Builder must record diagnostic-only scope, upstream hashes, and no-default/no-tuning boundaries.");
  }
  if (!packageText.includes("verify:myocardium-land-normal-floor-lvedp-attribution")) {
    addIssue(errors, "phase5ai_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AI verifier script.");
  }
  validateDocText(README_PATH, readmeText, errors, [
    "Phase 5AI",
    "land-normal-floor-lvedp-attribution-phase5ai-result-v1",
    "17.276729",
    "bounded-small-lvedp-excess-diagnostic-only",
    "no runtime default flip",
  ]);
  validateDocText(ROADMAP_PATH, roadmapText, errors, [
    "Phase 5AI",
    "Land normal-floor LVEDP attribution",
    "land-lv-bpas-0p90",
    "land-ca-release-1p10",
    "no Tref fudge",
  ]);
  validateDocText(MORPHOLOGY_README_PATH, morphologyText, errors, [
    "Phase 5AI",
    "normal-floor LVEDP",
    "passive-proxy",
    "not morphology acceptance",
  ]);
}

function validateNoProductionWiring(
  rootDir: string,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  const forbidden = [
    "land-normal-floor-lvedp-attribution-phase5ai-result-v1",
    "verify:myocardium-land-normal-floor-lvedp-attribution",
    "buildLandNormalFloorLvedpAttributionPhase5AI",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5ai_no_production_wiring", relative, `Production-facing file must not wire Phase 5AI diagnostic token ${token}.`);
        }
      }
    }
  }
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5ai_local_path", pathLabel, "Committed Phase 5AI evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5ai_missing_file", relativePath, "Required Phase 5AI file is missing.");
    return null;
  }
}

function readJsonObject(
  rootDir: string,
  relativePath: string,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path.join(rootDir, relativePath), "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      addIssue(errors, "phase5ai_json_object", relativePath, "Expected a JSON object.");
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    addIssue(errors, "phase5ai_json_parse", relativePath, "Required JSON artifact is missing or invalid.");
    return null;
  }
}

function validateDocText(
  pathLabel: string,
  text: string,
  errors: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
  requiredTokens: readonly string[],
): void {
  const missing = requiredTokens.filter((token) => !text.includes(token));
  if (missing.length > 0) {
    addIssue(errors, "phase5ai_docs", pathLabel, `Docs must record Phase 5AI LVEDP attribution evidence and diagnostic boundary; missing ${missing.join(", ")}.`);
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

function artifactHash(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return hashStable(value);
  const { normalizedSha256: _normalizedSha256, ...withoutHash } = value as Record<string, unknown>;
  return hashStable(withoutHash);
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
  issues: LandNormalFloorLvedpAttributionPhase5AIValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateLandNormalFloorLvedpAttributionPhase5AI(process.cwd());
  console.log(
    `Land normal-floor LVEDP attribution Phase 5AI ${report.pass ? "PASS" : "FAIL"} `
    + `landLVEDP=${report.evidence.summary.landBaselineLVEDPApprox} `
    + `resolved=${report.evidence.summary.lvedpResolvedOutputPreservedRunIds.length} `
    + `status=${report.evidence.summary.defaultFlipBlockerStatus} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyLandNormalFloorLvedpAttributionPhase5AI.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
