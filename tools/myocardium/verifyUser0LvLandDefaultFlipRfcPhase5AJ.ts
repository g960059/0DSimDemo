import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/user0-lv-land-default-flip-rfc-phase5aj-result-v1.json";
import {
  USER0_LV_LAND_DEFAULT_FLIP_RFC_PHASE5AJ_ID,
  buildUser0LvLandDefaultFlipRfcPhase5AJEvidence,
  type User0LvLandDefaultFlipRfcPhase5AJEvidence,
} from "@/tools/myocardium/buildUser0LvLandDefaultFlipRfcPhase5AJ";

export type User0LvLandDefaultFlipRfcPhase5AJValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type User0LvLandDefaultFlipRfcPhase5AJValidationReport = {
  readonly pass: boolean;
  readonly evidence: User0LvLandDefaultFlipRfcPhase5AJEvidence;
  readonly errors: readonly User0LvLandDefaultFlipRfcPhase5AJValidationIssue[];
  readonly warnings: readonly User0LvLandDefaultFlipRfcPhase5AJValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/user0-lv-land-default-flip-rfc-phase5aj-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildUser0LvLandDefaultFlipRfcPhase5AJ.ts";
const VERIFIER_PATH = "tools/myocardium/verifyUser0LvLandDefaultFlipRfcPhase5AJ.ts";
const RFC_DOC_PATH = "docs/myocardium/roadmap/phase5aj-user0-lv-land-default-flip-rfc.md";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const PACKAGE_PATH = "package.json";

const UPSTREAM_PATHS = [
  "data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json",
  "data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json",
  "data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json",
  "data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json",
  "data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json",
] as const;

const EXPECTED_DOES_NOT_UNLOCK = [
  "runtimeDefaultFlipImplementation",
  "legacyActiveStressDeletion",
  "rootZcAdoption",
  "atrialFigureEightGate",
  "officialCaseReauthoring",
  "workbenchRuntimeWiring",
  "stateSchemaMigration",
  "acceptedPreloadTuning",
  "acceptedVenousToneTuning",
  "acceptedPassiveTuning",
  "acceptedGeometryTuning",
  "acceptedSourceCalciumScaling",
  "TrefFudge",
  "LandParameterTuning",
  "qDotTuning",
  "valveTuning",
  "officialMorphologyAcceptance",
  "finalNoAlternansAcceptance",
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

export function validateUser0LvLandDefaultFlipRfcPhase5AJ(
  rootDir = process.cwd(),
): User0LvLandDefaultFlipRfcPhase5AJValidationReport {
  const errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[] = [];
  const warnings: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[] = [];
  const evidence = resultArtifact as unknown as User0LvLandDefaultFlipRfcPhase5AJEvidence;

  validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateArtifactHash(evidence, errors);
  validateUpstreamEvidence(rootDir, evidence, errors);
  validateOwnerDecision(evidence, errors);
  validateRfc(evidence, errors);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5aj_owner_decision_needed",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AJ is an RFC only. It is mergeable as a draft record, but the actual default flip still needs owner GO.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: User0LvLandDefaultFlipRfcPhase5AJEvidence,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  const fresh = buildUser0LvLandDefaultFlipRfcPhase5AJEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5aj_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AJ artifact must match a fresh builder run.");
  }
}

function validateIdentity(
  evidence: User0LvLandDefaultFlipRfcPhase5AJEvidence,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== USER0_LV_LAND_DEFAULT_FLIP_RFC_PHASE5AJ_ID
    || evidence.phase !== "Phase 5AJ"
    || evidence.claimBoundary !== "user0-lv-land-default-flip-rfc-owner-decision-needed"
    || evidence.verifierScript !== "verify:myocardium-user0-lv-land-default-flip-rfc"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
    || evidence.upstreamEvidence.length !== UPSTREAM_PATHS.length
  ) {
    addIssue(errors, "phase5aj_identity", RESULT_ARTIFACT_PATH, "Phase 5AJ identity, verifier, hash, or upstream list is invalid.");
  }
}

function validateArtifactHash(
  evidence: User0LvLandDefaultFlipRfcPhase5AJEvidence,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  const { normalizedSha256, ...withoutHash } = evidence;
  if (normalizedSha256 !== hashStable(withoutHash)) {
    addIssue(errors, "phase5aj_hash", RESULT_ARTIFACT_PATH, "Phase 5AJ normalizedSha256 must match the stable hash excluding the hash field.");
  }
}

function validateUpstreamEvidence(
  rootDir: string,
  evidence: User0LvLandDefaultFlipRfcPhase5AJEvidence,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  const byPath = new Map(evidence.upstreamEvidence.map((item) => [item.path, item]));
  for (const relativePath of UPSTREAM_PATHS) {
    const recorded = byPath.get(relativePath);
    const upstream = readJsonObject(rootDir, relativePath, errors);
    if (!recorded || !upstream) continue;
    const upstreamHash = artifactHash(upstream);
    if (
      recorded.id !== upstream.id
      || recorded.phase !== upstream.phase
      || recorded.stableHash !== upstreamHash
      || recorded.keyFacts.length < 2
    ) {
      addIssue(errors, "phase5aj_upstream", relativePath, "Phase 5AJ must pin each upstream artifact id, phase, stable hash, and key facts.");
    }
  }
  const phase5AI = readJsonObject(rootDir, UPSTREAM_PATHS[4], errors);
  const summary = phase5AI?.summary as Record<string, unknown> | undefined;
  if (
    summary?.defaultFlipBlockerStatus !== "bounded-small-lvedp-excess-diagnostic-only"
    || summary?.landBaselineLVEDPApprox !== 17.276729
    || summary?.landBaselineLVEDPExcessMmHg !== 1.276729
  ) {
    addIssue(errors, "phase5aj_phase5ai_source", UPSTREAM_PATHS[4], "Phase 5AJ must depend on the bounded Phase 5AI LVEDP attribution.");
  }
}

function validateOwnerDecision(
  evidence: User0LvLandDefaultFlipRfcPhase5AJEvidence,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  if (
    evidence.ownerDecision.status !== "rfc-draft-owner-decision-needed"
    || evidence.ownerDecision.accepted !== false
    || evidence.ownerDecision.recommendedPath !== "owner-go-user0-staged-default-flip-next-pr"
    || evidence.ownerDecision.options.length !== 3
    || !evidence.ownerDecision.decisionQuestion.includes("legacy active-stress")
  ) {
    addIssue(errors, "phase5aj_owner_decision", `${RESULT_ARTIFACT_PATH}.ownerDecision`, "Phase 5AJ must stop at an owner-decision-needed RFC with GO/DEFER/NO-GO options.");
  }
}

function validateRfc(
  evidence: User0LvLandDefaultFlipRfcPhase5AJEvidence,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  const summary = evidence.evidenceSummary;
  if (
    evidence.rfc.releasePosture !== "users0-internal-staged-replacement"
    || evidence.rfc.legacyActiveStressRole !== "frozen-reference-rollback-debug"
    || evidence.rfc.defaultFlipScope !== "next-pr-if-owner-go"
    || !evidence.rfc.rollbackConditions.some((condition) => condition.includes("legacy active-stress rollback"))
    || !evidence.rfc.goCriteria.some((criterion) => criterion.includes("Phase 5AI LVEDP"))
    || summary.developerFlagRfcAccepted !== false
    || summary.runtimeFlagSuiteStatus.includes("pointsCapOrNonOk=0") !== true
    || summary.phase5XReadinessBeforeAttribution !== "blocked-before-default-flip"
    || summary.landSolveFailureCountPhase5X !== 0
    || summary.phase5AINormalFloorStatus !== "bounded-small-lvedp-excess-diagnostic-only"
    || summary.defaultFlipRecommendation !== "rfc-ready-owner-decision-needed"
  ) {
    addIssue(errors, "phase5aj_rfc_summary", `${RESULT_ARTIFACT_PATH}.rfc`, "Phase 5AJ RFC must summarize users0 posture, frozen rollback, Phase 5AI bounded LVEDP, and owner-decision readiness.");
  }
  if (
    evidence.separatedLanes.rootZcAdoption !== "separate-blocked"
    || evidence.separatedLanes.atrialFigureEight !== "separate-not-lv-default-gate"
    || evidence.separatedLanes.officialCaseTuning !== "smoke-only-until-closures-stabilize"
    || !evidence.nextImplementationPrIfOwnerGo.exclude.includes("root/Zc or boundary/root inertance production adoption")
    || !evidence.nextImplementationPrIfOwnerGo.exclude.includes("official case reauthoring or per-case tuning")
  ) {
    addIssue(errors, "phase5aj_lane_separation", `${RESULT_ARTIFACT_PATH}.separatedLanes`, "Phase 5AJ must keep root/Zc, atria, official cases, and accepted tuning out of the default-flip RFC.");
  }
}

function validateBoundary(
  evidence: User0LvLandDefaultFlipRfcPhase5AJEvidence,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5aj_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AJ boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5aj_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AJ must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, RFC_DOC_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, ROADMAP_PATH, errors),
    readRequiredText(rootDir, PACKAGE_PATH, errors),
    ...UPSTREAM_PATHS.map((relativePath) => readRequiredText(rootDir, relativePath, errors)),
  ];
  for (const file of files) {
    if (file) validateNoLocalAbsolutePaths(file.path, file.text, errors);
  }
  const builderText = textFor(files, BUILDER_PATH);
  const packageText = textFor(files, PACKAGE_PATH);
  const rfcText = textFor(files, RFC_DOC_PATH);
  const readmeText = textFor(files, README_PATH);
  const roadmapText = textFor(files, ROADMAP_PATH);

  if (
    !builderText.includes("rfc-draft-owner-decision-needed")
    || !builderText.includes("noRuntimeDefaultFlipInThisPhase: true")
    || !builderText.includes("legacyActiveStressRole: \"frozen-reference-rollback-debug\"")
  ) {
    addIssue(errors, "phase5aj_builder_contract", BUILDER_PATH, "Builder must encode owner-pending RFC-only frozen-rollback boundaries.");
  }
  if (!packageText.includes("verify:myocardium-user0-lv-land-default-flip-rfc")) {
    addIssue(errors, "phase5aj_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AJ verifier script.");
  }
  validateDocText(RFC_DOC_PATH, rfcText, errors, [
    "Phase 5AJ User-0 LV Land Default-Flip RFC",
    "owner decision needed",
    "GO",
    "DEFER",
    "NO-GO",
    "no runtime default flip in this phase",
  ]);
  validateDocText(README_PATH, readmeText, errors, [
    "Phase 5AJ",
    "user0-lv-land-default-flip-rfc-phase5aj-result-v1",
    "owner decision needed",
    "no runtime default flip",
  ]);
  validateDocText(ROADMAP_PATH, roadmapText, errors, [
    "Phase 5AJ",
    "User-0 LV Land default-flip RFC",
    "rfc-ready-owner-decision-needed",
    "no root/Zc or atrial gating",
  ]);
}

function validateNoProductionWiring(
  rootDir: string,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  const forbidden = [
    "user0-lv-land-default-flip-rfc-phase5aj-result-v1",
    "verify:myocardium-user0-lv-land-default-flip-rfc",
    "buildUser0LvLandDefaultFlipRfcPhase5AJ",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5aj_no_production_wiring", relative, `Production-facing file must not wire Phase 5AJ RFC token ${token}.`);
        }
      }
    }
  }
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5aj_local_path", pathLabel, "Committed Phase 5AJ evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5aj_missing_file", relativePath, "Required Phase 5AJ file is missing.");
    return null;
  }
}

function readJsonObject(
  rootDir: string,
  relativePath: string,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path.join(rootDir, relativePath), "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      addIssue(errors, "phase5aj_json_object", relativePath, "Expected a JSON object.");
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    addIssue(errors, "phase5aj_json_parse", relativePath, "Required JSON artifact is missing or invalid.");
    return null;
  }
}

function validateDocText(
  pathLabel: string,
  text: string,
  errors: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
  requiredTokens: readonly string[],
): void {
  const missing = requiredTokens.filter((token) => !text.includes(token));
  if (missing.length > 0) {
    addIssue(errors, "phase5aj_docs", pathLabel, `Docs must record Phase 5AJ owner-pending RFC boundary; missing ${missing.join(", ")}.`);
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
  issues: User0LvLandDefaultFlipRfcPhase5AJValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateUser0LvLandDefaultFlipRfcPhase5AJ(process.cwd());
  console.log(
    `User0 LV Land default-flip RFC Phase 5AJ ${report.pass ? "PASS" : "FAIL"} `
    + `decision=${report.evidence.ownerDecision.status} `
    + `recommendation=${report.evidence.evidenceSummary.defaultFlipRecommendation} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyUser0LvLandDefaultFlipRfcPhase5AJ.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
