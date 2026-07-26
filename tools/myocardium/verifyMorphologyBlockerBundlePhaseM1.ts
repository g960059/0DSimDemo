import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/morphology-blocker-bundle-phase-m1-result-v1.json";
import {
  MORPHOLOGY_BLOCKER_BUNDLE_PHASE_M1_ID,
  buildMorphologyBlockerBundlePhaseM1Evidence,
  type MorphologyBlockerBundlePhaseM1Evidence,
} from "@/tools/myocardium/buildMorphologyBlockerBundlePhaseM1";

export type MorphologyBlockerBundlePhaseM1ValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type MorphologyBlockerBundlePhaseM1ValidationReport = {
  readonly pass: boolean;
  readonly evidence: MorphologyBlockerBundlePhaseM1Evidence;
  readonly errors: readonly MorphologyBlockerBundlePhaseM1ValidationIssue[];
  readonly warnings: readonly MorphologyBlockerBundlePhaseM1ValidationIssue[];
};

export type MorphologyBlockerBundlePhaseM1ValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/morphology-blocker-bundle-phase-m1-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildMorphologyBlockerBundlePhaseM1.ts";
const VERIFIER_PATH = "tools/myocardium/verifyMorphologyBlockerBundlePhaseM1.ts";
const MORPHOLOGY_RUNNER_PATH = "tools/myocardium/verifyPvLoopMorphologyQuality.ts";
const README_PATH = "docs/myocardium/README.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const PACKAGE_PATH = "package.json";
const BASE_COMMIT = "503d6555f4ff46cf677abcc620dd939580efa238";
const EXPECTED_CASE_IDS = [
  "normal-sinus",
  "acute-anterior-mi",
  "systolic-heart-failure",
  "lv-failure-dobutamine",
] as const;
const EXPECTED_RUNNER_NORMALIZED_SHA =
  "5376599878a5dd1ecdb15062da1dc10748e4b183b184427dc92bc595862c0d59";
const EXPECTED_FILLING_NORMALIZED_SHA =
  "5c2bf7ee0a5e437e551b5d7a5a43d02203b5caa2cac0ebdf8f530cd86408bf58";
const EXPECTED_ARTERIAL_NORMALIZED_SHA =
  "71e92aa23c2f3d10332ba2cc333030dd94782cad5c1adf5b7511ed6918dbfe0a";
const EXPECTED_INPUT_ARTIFACT_HASHES: Record<string, string> = {
  "docs/myocardium/verification/pv-loop-morphology-quality.md":
    "a4eeeccd6f71745e3c0dc1debeb115b80dbf19ba1ebfc19cddfef4db56bd2261",
  "docs/myocardium/verification/filling-limb-artifact-audit-v1.md":
    "b5a0fdbd42120e607b828dcfc9df28e8d6f317f362d6370b2620902845300974",
  "docs/myocardium/verification/arterial-load-morphology-v1.md":
    "f1e4beddfe59d25d8f6853d985b3e52805cf3a34b35f2fdd4eaa05df50dc7f6f",
  "data/myocardium/protocols/pv-loop-morphology-quality-v1.json":
    "c3e7a436668b6078ce127e750467a0fb83d50937fa7502379b0e02714920013d",
  "data/myocardium/protocols/filling-limb-artifact-audit-v1.json":
    "85a5b9c173c37741d419e7e5c6b800d1aada24481eae74cd8ccfad03456dd098",
  "data/myocardium/protocols/arterial-load-morphology-v1.json":
    "aed088e9934064ba9542a4cd2d5e4b213cf84bd8b0883cefbe0b6ddf709b3833",
  "data/myocardium/targets/pv-loop-morphology-quality-v1.json":
    "4bf1619aa7562f7d5a9aca4de38bc32ff56c8974e331efabec8230d82b35f3b0",
};
const EXPECTED_NO_PROXY_SIGNALS = [
  "arterialReflectionCoefficient",
  "arterialReflectionDelaySec",
  "characteristicImpedancePaSecPerM3",
] as const;
const EXPECTED_DOES_NOT_UNLOCK = [
  "runtimeReplacement",
  "officialCaseWiring",
  "workbenchRuntimeWiring",
  "productionRegistryIntegration",
  "stateSchemaMigration",
  "rootCauseAcceptance",
  "fixAcceptance",
  "officialMorphologyAcceptance",
  "finalNoAlternans",
  "qDotTuning",
  "valveTuning",
  "arterialLoadTuning",
  "preloadTuning",
  "landParameterTuning",
  "sourceStressScaling",
  "pairedLvLandVsStockMorphologyAcceptance",
  "isolatedArterialBenchAcceptance",
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

const FORBIDDEN_POSITIVE_CLAIMS = [
  "root cause accepted",
  "root-cause accepted",
  "root cause acceptance",
  "fix accepted",
  "fix acceptance",
  "official morphology pass",
  "official morphology acceptance",
  "runtime replacement",
  "production ready",
  "final no-alternans",
  "qDot tuning",
  "valve tuning",
  "arterial load tuning",
  "Land parameter tuning",
  "Zc/reflection fix acceptance",
] as const;

export function validateMorphologyBlockerBundlePhaseM1(
  rootDir = process.cwd(),
  options: MorphologyBlockerBundlePhaseM1ValidationOptions = {},
): MorphologyBlockerBundlePhaseM1ValidationReport {
  const errors: MorphologyBlockerBundlePhaseM1ValidationIssue[] = [];
  const warnings: MorphologyBlockerBundlePhaseM1ValidationIssue[] = [];
  const evidence = resultArtifact as MorphologyBlockerBundlePhaseM1Evidence;

  validateIdentity(evidence, errors);
  validateRunner(evidence, errors);
  validateMorphologyEvidence(evidence, errors);
  validateFilling(evidence, errors);
  validateArterial(evidence, errors);
  validateBlockerClassifications(evidence, errors);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  if (options.rebuildEvidence === true) validateFreshEvidence(evidence, errors);
  else {
    warnings.push({
      severity: "warning",
      code: "phase_m1_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase M1 rebuild is opt-in because it runs the PV-loop morphology runner plus comparators.",
    });
  }
  warnings.push({
    severity: "warning",
    code: "phase_m1_diagnostic_not_morphology_acceptance",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase M1 classifies current residual morphology blockers only; it is not root-cause, fix, or official morphology acceptance.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: MorphologyBlockerBundlePhaseM1Evidence,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  const fresh = buildMorphologyBlockerBundlePhaseM1Evidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase_m1_stale_artifact", RESULT_ARTIFACT_PATH, "Phase M1 result artifact must match a fresh compact rebuild when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: MorphologyBlockerBundlePhaseM1Evidence,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== MORPHOLOGY_BLOCKER_BUNDLE_PHASE_M1_ID
    || evidence.phase !== "Phase M1"
    || evidence.claimBoundary !== "diagnostic-only-current-main-morphology-blocker-classification-no-acceptance"
    || evidence.baseCommit !== BASE_COMMIT
    || evidence.upstreamPhase5WArtifactId !== "myocardium-developer-only-lv-land-envelope-phase5w-result-v1"
    || evidence.verifierScript !== "verify:myocardium-morphology-blocker-bundle"
  ) {
    addIssue(errors, "phase_m1_identity", RESULT_ARTIFACT_PATH, "Phase M1 identity, base commit, upstream Phase 5W link, or verifier script is invalid.");
  }
  if (
    evidence.scope.name !== "post-pr219-current-main-morphology-blocker-classification"
    || evidence.scope.doesNotResolveFullMorphologyBlockerSet !== true
    || evidence.scope.doesNotRunPairedLvLandVsStockMorphologyMatrix !== true
    || evidence.scope.doesNotRunIsolatedArterialBench !== true
  ) {
    addIssue(errors, "phase_m1_scope", `${RESULT_ARTIFACT_PATH}.scope`, "Phase M1 must be scoped as post-PR #219 current-main classification, not blocker resolution.");
  }
}

function validateRunner(
  evidence: MorphologyBlockerBundlePhaseM1Evidence,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  const runner = evidence.runner;
  if (
    runner.runnerVersion !== "pv-loop-morphology-quality-runner-v1"
    || runner.targetPackId !== "pv-loop-morphology-quality-v1"
    || runner.protocolId !== "pv-loop-morphology-quality-v1"
    || runner.claimBoundary !== "diagnostic-only-no-model-change"
    || runner.referenceArtifactRoot !== "artifacts/myocardium/pv-loop-morphology/morphology-blocker-bundle-phase-m1"
    || runner.artifactRetention !== "large-runner-artifacts-generated-in-temp-and-not-committed"
    || !arrayEquals(runner.caseIds, EXPECTED_CASE_IDS)
    || runner.branchCount !== 7
    || runner.metricRowCount !== 17304
    || runner.sampleRowCount !== 60572
    || runner.warningCount !== 0
    || runner.errorCount !== 0
    || runner.normalizedSummarySha256 !== EXPECTED_RUNNER_NORMALIZED_SHA
    || JSON.stringify(runner.inputArtifactHashes) !== JSON.stringify(EXPECTED_INPUT_ARTIFACT_HASHES)
  ) {
    addIssue(errors, "phase_m1_runner", `${RESULT_ARTIFACT_PATH}.runner`, "Phase M1 runner provenance, counts, or normalized hash are invalid.");
  }
}

function validateMorphologyEvidence(
  evidence: MorphologyBlockerBundlePhaseM1Evidence,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  const snapshot = evidence.morphologyEvidenceSnapshot;
  if (
    snapshot.observations.length < 4
    || !snapshot.observations.some((observation) => observation.id === "filling-limb-roughness")
    || !snapshot.observations.some((observation) => observation.id === "aov-qdot-clamp-activity")
    || !snapshot.hypotheses.some((hypothesis) => hypothesis.id === "aov-qdot-clamp-correlation")
    || !snapshot.evidenceGaps.some((gap) => gap.id === "ejection-limb-arterial-load-signal-gap")
  ) {
    addIssue(errors, "phase_m1_morphology_evidence", `${RESULT_ARTIFACT_PATH}.morphologyEvidenceSnapshot`, "Phase M1 must preserve current morphology observations, correlations, and arterial signal gap context.");
  }
  if (snapshot.hypotheses.some((hypothesis) => /accepted/i.test(hypothesis.evidenceStatus))) {
    addIssue(errors, "phase_m1_hypothesis_acceptance", `${RESULT_ARTIFACT_PATH}.morphologyEvidenceSnapshot.hypotheses`, "Phase M1 hypotheses must remain diagnostic correlations, not accepted root causes.");
  }
}

function validateFilling(
  evidence: MorphologyBlockerBundlePhaseM1Evidence,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  const filling = evidence.filling;
  if (
    filling.comparatorId !== "filling-limb-diagnostic-comparator-v1"
    || filling.claimBoundary !== "off-by-default-diagnostic-comparison-only"
    || filling.normalizedSummarySha256 !== EXPECTED_FILLING_NORMALIZED_SHA
    || filling.groupCount !== 42
    || filling.interpretableGroupCount !== 39
    || filling.uninterpretableGroupCount !== 3
    || filling.residualClassification !== "ea-like-proxy-specific-missingness"
    || filling.allOtherAntiGamingReadoutsAvailableForResidualGroups !== true
    || filling.residualGroups.length !== 3
  ) {
    addIssue(errors, "phase_m1_filling", `${RESULT_ARTIFACT_PATH}.filling`, "Phase M1 filling comparator counts and residual classification are invalid.");
  }
  const beats = filling.residualGroups.map((group) => group.beatIndex).sort((left, right) => left - right);
  if (!arrayEquals(beats, [1, 2, 3])) {
    addIssue(errors, "phase_m1_filling_residual_beats", `${RESULT_ARTIFACT_PATH}.filling.residualGroups`, "Residual filling groups must be exactly beats 1-3.");
  }
  for (const group of filling.residualGroups) {
    if (
      group.caseId !== "lv-failure-dobutamine"
      || group.branchId !== "1"
      || group.branchName !== "LV failure"
      || group.chamber !== "RV"
      || !arrayEquals(group.missingReadouts, ["eaLikeInflowProxy"])
      || group.missingOnlyEaLikeInflowProxy !== true
      || group.availableAntiGamingReadouts.length !== 12
    ) {
      addIssue(errors, "phase_m1_filling_residual_identity", `${RESULT_ARTIFACT_PATH}.filling.residualGroups`, "Residual filling groups must be lv-failure-dobutamine branch 1 RV beats with only eaLikeInflowProxy missing.");
    }
  }
}

function validateArterial(
  evidence: MorphologyBlockerBundlePhaseM1Evidence,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  const arterial = evidence.arterial;
  const signalNames = arterial.missingNoProxySignals.map((signal) => signal.name).sort();
  if (
    arterial.comparatorId !== "arterial-load-zc-reflection-diagnostic-comparator-v1"
    || arterial.claimBoundary !== "off-by-default-diagnostic-comparison-only"
    || arterial.normalizedSummarySha256 !== EXPECTED_ARTERIAL_NORMALIZED_SHA
    || arterial.groupCount !== 42
    || arterial.interpretableGroupCount !== 42
    || !arrayEquals(signalNames, EXPECTED_NO_PROXY_SIGNALS)
    || arterial.noProxySignalsAllForbidden !== true
    || arterial.hypothesisPromotion !== "not-promoted-no-proxy"
    || arterial.directZcReflectionEvidenceStatus !== "missing-no-proxy"
  ) {
    addIssue(errors, "phase_m1_arterial", `${RESULT_ARTIFACT_PATH}.arterial`, "Phase M1 arterial comparator must keep Zc/reflection as explicit missing-no-proxy signals.");
  }
  for (const signal of arterial.missingNoProxySignals) {
    if (
      signal.status !== "missing-no-proxy"
      || signal.proxyPolicy !== "forbidden"
      || signal.promotesHypothesis !== false
    ) {
      addIssue(errors, "phase_m1_arterial_no_proxy", `${RESULT_ARTIFACT_PATH}.arterial.missingNoProxySignals`, "Zc/reflection signals must remain missing-no-proxy with proxy use forbidden.");
    }
  }
}

function validateBlockerClassifications(
  evidence: MorphologyBlockerBundlePhaseM1Evidence,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  const ids = evidence.blockerClassifications.map((classification) => classification.id).sort();
  if (!arrayEquals(ids, [
    "arterial-zc-reflection-no-proxy-gap",
    "rv-dobutamine-filling-ea-proxy-gap",
    "sampling-sensitive-morphology-metrics",
  ])) {
    addIssue(errors, "phase_m1_blocker_classifications", `${RESULT_ARTIFACT_PATH}.blockerClassifications`, "Phase M1 must classify filling, arterial no-proxy, and sampling-sensitive residuals.");
  }
}

function validateBoundary(
  evidence: MorphologyBlockerBundlePhaseM1Evidence,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase_m1_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "Phase M1 must keep all boundary flags blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase_m1_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase M1 must keep ${token} blocked.`);
    }
  }
  if (
    !evidence.nextRecommendedExperiments.some((item) => item.includes("paired stock-active versus developer-only LV Land morphology matrix"))
    || !evidence.nextRecommendedExperiments.some((item) => item.includes("isolated arterial bench"))
  ) {
    addIssue(errors, "phase_m1_next_experiments", `${RESULT_ARTIFACT_PATH}.nextRecommendedExperiments`, "Phase M1 must point to paired LV Land-vs-stock morphology and isolated arterial bench follow-ups.");
  }
}

function validateSourceText(rootDir: string, errors: MorphologyBlockerBundlePhaseM1ValidationIssue[]): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_RUNNER_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_README_PATH, errors),
    readRequiredText(rootDir, PACKAGE_PATH, errors),
  ];
  for (const file of files) {
    if (!file) continue;
    validateNoLocalAbsolutePaths(file.path, file.text, errors);
    if (
      file.path === RESULT_ARTIFACT_PATH
      || file.path === README_PATH
      || file.path === MORPHOLOGY_README_PATH
    ) {
      validateNoForbiddenPositiveClaims(
        file.path,
        file.path === RESULT_ARTIFACT_PATH ? file.text : phaseM1RelevantText(file.text),
        errors,
      );
    }
  }
  const packageText = files.find((file) => file?.path === PACKAGE_PATH)?.text ?? "";
  if (!packageText.includes("verify:myocardium-morphology-blocker-bundle")) {
    addIssue(errors, "phase_m1_package_script", PACKAGE_PATH, "package.json must expose the Phase M1 verifier script.");
  }
  const builderText = files.find((file) => file?.path === BUILDER_PATH)?.text ?? "";
  if (
    !builderText.includes("runPvLoopMorphologyDiagnostic")
    || !builderText.includes("buildFillingLimbDiagnosticComparison")
    || !builderText.includes("buildArterialLoadZcReflectionDiagnosticComparison")
    || !builderText.includes("large-runner-artifacts-generated-in-temp-and-not-committed")
  ) {
    addIssue(errors, "phase_m1_builder_contract", BUILDER_PATH, "Builder must run the PV-loop morphology runner and both comparators while committing only compact evidence.");
  }
  const runnerText = files.find((file) => file?.path === MORPHOLOGY_RUNNER_PATH)?.text ?? "";
  if (!runnerText.includes("export function runPvLoopMorphologyDiagnostic")) {
    addIssue(errors, "phase_m1_runner_export", MORPHOLOGY_RUNNER_PATH, "PV-loop morphology runner must expose a non-test runner API for Phase M1.");
  }
  const readmeText = files.find((file) => file?.path === README_PATH)?.text ?? "";
  const morphologyReadmeText = files.find((file) => file?.path === MORPHOLOGY_README_PATH)?.text ?? "";
  if (
    !readmeText.includes("Phase M1")
    || !morphologyReadmeText.includes("Phase M1")
  ) {
    addIssue(errors, "phase_m1_docs", "docs", "Docs must record Phase M1 residual blocker classification without acceptance claims.");
  }
}

function phaseM1RelevantText(text: string): string {
  const lines = text.split(/\r?\n/);
  return lines
    .filter((line) =>
      /Phase M1|morphology-blocker-bundle|post-PR #219/i.test(line)
    )
    .join("\n");
}

function validateNoProductionWiring(
  rootDir: string,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const text = readFileSync(filePath, "utf8");
      if (
        text.includes("morphology-blocker-bundle-phase-m1")
        || text.includes("verify:myocardium-morphology-blocker-bundle")
      ) {
        addIssue(errors, "phase_m1_production_wiring", path.relative(rootDir, filePath), "Phase M1 diagnostic evidence must not be wired into production/runtime/official-case/Workbench paths.");
      }
    }
  }
}

function validateNoForbiddenPositiveClaims(
  pathLabel: string,
  text: string,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  const lower = text.toLowerCase();
  for (const claim of FORBIDDEN_POSITIVE_CLAIMS) {
    let index = lower.indexOf(claim.toLowerCase());
    while (index >= 0) {
      if (!isNegatedOrBlockedContext(lower, index, index + claim.length)) {
        addIssue(errors, "phase_m1_forbidden_claim", pathLabel, `Forbidden positive morphology/runtime claim detected: ${claim}.`);
      }
      index = lower.indexOf(claim.toLowerCase(), index + claim.length);
    }
  }
}

function isNegatedOrBlockedContext(lowerText: string, start: number, end: number): boolean {
  const prefix = lowerText.slice(Math.max(0, start - 120), start);
  const suffix = lowerText.slice(end, Math.min(lowerText.length, end + 120));
  return /\b(no|not|without|forbid|forbidden|blocked|blocks|does not|do not|must not|non-acceptance|diagnostic-only|doesnotunlock)\b/.test(prefix)
    || /\b(false|not|blocked|blocks|forbidden|remain blocked|remains blocked|does not unlock|not-promoted|missing-no-proxy)\b/.test(suffix);
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase_m1_local_path", pathLabel, "Committed Phase M1 evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: MorphologyBlockerBundlePhaseM1ValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase_m1_missing_file", relativePath, "Required Phase M1 file is missing.");
    return null;
  }
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

function addIssue(
  issues: MorphologyBlockerBundlePhaseM1ValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateMorphologyBlockerBundlePhaseM1(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
  });
  console.log(
    `Morphology blocker bundle Phase M1 ${report.pass ? "PASS" : "FAIL"} `
    + `runnerBranches=${report.evidence.runner.branchCount} `
    + `filling=${report.evidence.filling.interpretableGroupCount}/${report.evidence.filling.groupCount} `
    + `arterial=${report.evidence.arterial.interpretableGroupCount}/${report.evidence.arterial.groupCount} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyMorphologyBlockerBundlePhaseM1.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
