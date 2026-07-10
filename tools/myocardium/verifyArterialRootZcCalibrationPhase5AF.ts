import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json";
import {
  ARTERIAL_ROOT_ZC_CALIBRATION_PHASE5AF_ID,
  buildArterialRootZcCalibrationPhase5AFEvidence,
  type ArterialRootZcCalibrationPhase5AFCandidate,
  type ArterialRootZcCalibrationPhase5AFEvidence,
} from "@/tools/myocardium/buildArterialRootZcCalibrationPhase5AF";

export type ArterialRootZcCalibrationPhase5AFValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ArterialRootZcCalibrationPhase5AFValidationReport = {
  readonly pass: boolean;
  readonly evidence: ArterialRootZcCalibrationPhase5AFEvidence;
  readonly errors: readonly ArterialRootZcCalibrationPhase5AFValidationIssue[];
  readonly warnings: readonly ArterialRootZcCalibrationPhase5AFValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildArterialRootZcCalibrationPhase5AF.ts";
const VERIFIER_PATH = "tools/myocardium/verifyArterialRootZcCalibrationPhase5AF.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";
const PACKAGE_PATH = "package.json";

const EXPECTED_CANDIDATE_IDS = [
  "current-aov-l",
  "phase5ab-pareto-total-2x-aov-l",
  "phase5ab-pareto-total-3x-aov-l",
  "phase5ab-pareto-total-4x-aov-l",
] as const;
const EXPECTED_DOES_NOT_UNLOCK = [
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
  "reflectionCoefficientClaim",
  "rootCauseAcceptance",
  "fixAcceptance",
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

export function validateArterialRootZcCalibrationPhase5AF(
  rootDir = process.cwd(),
): ArterialRootZcCalibrationPhase5AFValidationReport {
  const errors: ArterialRootZcCalibrationPhase5AFValidationIssue[] = [];
  const warnings: ArterialRootZcCalibrationPhase5AFValidationIssue[] = [];
  const evidence = resultArtifact as unknown as ArterialRootZcCalibrationPhase5AFEvidence;

  validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateSources(evidence, errors);
  validateCandidates(evidence, errors);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5af_runtime_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AF is sourced calibration evidence only; it does not adopt a root/Zc mechanism, change ModelCore equations, or remove qDot clamps.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: ArterialRootZcCalibrationPhase5AFEvidence,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  const fresh = buildArterialRootZcCalibrationPhase5AFEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5af_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AF artifact must match a fresh sourced calibration builder run.");
  }
}

function validateIdentity(
  evidence: ArterialRootZcCalibrationPhase5AFEvidence,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ARTERIAL_ROOT_ZC_CALIBRATION_PHASE5AF_ID
    || evidence.phase !== "Phase 5AF"
    || evidence.claimBoundary !== "sourced-arterial-root-zc-calibration-diagnostic-only"
    || evidence.upstreamPhase5ACArtifactId !== "arterial-root-zc-impedance-bench-phase5ac-result-v1"
    || evidence.upstreamPhase5AEArtifactId !== "arterial-root-boundary-inertance-phase5ae-result-v1"
    || evidence.verifierScript !== "verify:myocardium-arterial-root-zc-calibration"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
  ) {
    addIssue(errors, "phase5af_identity", RESULT_ARTIFACT_PATH, "Phase 5AF identity, upstream links, verifier script, or hash is invalid.");
  }
  if (
    evidence.protocol.calibrationMode !== "source-range-comparison-against-phase5ac-direct-linear-bench"
    || evidence.protocol.sourceSelectionRule !== "single-explicit-literature-anchor-no-proxy-synthesis"
    || evidence.protocol.preferredRangeRule !== "source-mean-plus-minus-1sd"
    || evidence.protocol.broadRangeRule !== "source-mean-plus-minus-2sd"
    || evidence.protocol.benchReadoutSource !== "phase5ac-20hz-high-frequency-input-impedance"
    || evidence.protocol.phase5aeBoundaryRootEquivalentAovMultiple !== 2
  ) {
    addIssue(errors, "phase5af_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5AF protocol must stay a sourced range comparison against the fixed Phase 5AC 20Hz bench readout.");
  }
}

function validateSources(
  evidence: ArterialRootZcCalibrationPhase5AFEvidence,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  const source = evidence.sources[0];
  if (
    evidence.sources.length !== 1
    || source?.id !== "bikia-2021-virtual-aortic-impedance"
    || source.meanMmHgSecPerMl !== 0.056
    || source.sdMmHgSecPerMl !== 0.012
    || !source.url.includes("10.3389/fbioe.2021.649866")
  ) {
    addIssue(errors, "phase5af_source_anchor", `${RESULT_ARTIFACT_PATH}.sources`, "Phase 5AF must record the explicit sourced physiological Zc anchor.");
  }
  const preferred = evidence.sourceRanges.preferred;
  const broad = evidence.sourceRanges.broad;
  if (
    preferred.minMmHgSecPerMl !== 0.044
    || preferred.maxMmHgSecPerMl !== 0.068
    || broad.minMmHgSecPerMl !== 0.032
    || broad.maxMmHgSecPerMl !== 0.08
    || preferred.sdMultiple !== 1
    || broad.sdMultiple !== 2
  ) {
    addIssue(errors, "phase5af_source_ranges", `${RESULT_ARTIFACT_PATH}.sourceRanges`, "Preferred and broad source ranges must remain mean +/- 1SD and mean +/- 2SD from the source anchor.");
  }
}

function validateCandidates(
  evidence: ArterialRootZcCalibrationPhase5AFEvidence,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  if (!arrayEquals(evidence.candidates.map((candidate) => candidate.candidateId), EXPECTED_CANDIDATE_IDS)) {
    addIssue(errors, "phase5af_candidate_ids", `${RESULT_ARTIFACT_PATH}.candidates`, "Phase 5AF candidate order must match Phase 5AC current plus 2x/3x/4x effective AoV/root candidates.");
  }
  for (const candidate of evidence.candidates) validateCandidate(candidate, errors);
  const byId = new Map(evidence.candidates.map((candidate) => [candidate.candidateId, candidate]));
  if (
    byId.get("current-aov-l")?.candidateCalibrationStatus !== "below-physiological-calibration-range"
    || byId.get("phase5ab-pareto-total-2x-aov-l")?.candidateCalibrationStatus !== "preferred-physiological-calibration-candidate"
    || byId.get("phase5ab-pareto-total-3x-aov-l")?.candidateCalibrationStatus !== "above-physiological-calibration-range"
    || byId.get("phase5ab-pareto-total-4x-aov-l")?.candidateCalibrationStatus !== "above-physiological-calibration-range"
  ) {
    addIssue(errors, "phase5af_candidate_calibration_status", `${RESULT_ARTIFACT_PATH}.candidates`, "Current, 2x, 3x, and 4x candidates must classify below/preferred/above/above against the sourced range.");
  }
  if (
    !arrayEquals(evidence.summary.preferredCandidateIds, ["phase5ab-pareto-total-2x-aov-l"])
    || !arrayEquals(evidence.summary.broadCandidateIds, ["phase5ab-pareto-total-2x-aov-l"])
    || evidence.summary.currentStatus !== "below-physiological-calibration-range"
    || evidence.summary.phase5aeBoundaryRootCalibrationStatus !== "preferred-physiological-calibration-candidate"
    || evidence.phase5aeBoundaryRootMechanismCalibration.equivalentPhase5ACCandidateId !== "phase5ab-pareto-total-2x-aov-l"
    || evidence.phase5aeBoundaryRootMechanismCalibration.phase5aeMechanismAssessment !== "matches-carrier-diagnostic-only"
  ) {
    addIssue(errors, "phase5af_summary_calibration", `${RESULT_ARTIFACT_PATH}.summary`, "Summary must identify only the total 2x candidate as the preferred sourced-Zc diagnostic candidate and map Phase 5AE to that candidate.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("current closure is below")
    || !evidence.summary.currentInterpretation.includes("total 2x AoV/root candidate")
    || !evidence.summary.recommendedNext.some((next) => next.includes("closed-loop valve/load timing"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("one explicit literature anchor"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not a closed-loop runtime measurement"))
  ) {
    addIssue(errors, "phase5af_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Interpretation and limitations must keep Phase 5AF diagnostic-only and bounded to source calibration.");
  }
}

function validateCandidate(
  candidate: ArterialRootZcCalibrationPhase5AFCandidate,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.candidates.${candidate.candidateId}`;
  if (
    candidate.highFrequencyBenchReadoutMmHgSecPerMl <= 0
    || candidate.highFrequencyBenchReadoutPaSecPerM3 <= 0
    || candidate.effectiveAoVInertanceMultiple <= 0
    || candidate.effectiveAoVInertanceMmHgSec2PerMl <= 0
    || !Number.isFinite(candidate.ratioToSourceMean)
    || !Number.isFinite(candidate.deltaVsSourceMeanMmHgSecPerMl)
  ) {
    addIssue(errors, "phase5af_candidate_finite", pathPrefix, "Candidate calibration fields must be finite and positive where applicable.");
  }
}

function validateBoundary(
  evidence: ArterialRootZcCalibrationPhase5AFEvidence,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5af_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AF boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5af_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AF must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
    readRequiredText(rootDir, BUILDER_PATH, errors),
    readRequiredText(rootDir, VERIFIER_PATH, errors),
    readRequiredText(rootDir, README_PATH, errors),
    readRequiredText(rootDir, ROADMAP_PATH, errors),
    readRequiredText(rootDir, MORPHOLOGY_README_PATH, errors),
    readRequiredText(rootDir, HISTORICAL_LANES_PATH, errors),
    readRequiredText(rootDir, PACKAGE_PATH, errors),
  ];
  for (const file of files) {
    if (file) validateNoLocalAbsolutePaths(file.path, file.text, errors);
  }
  const builderText = textFor(files, BUILDER_PATH);
  const packageText = textFor(files, PACKAGE_PATH);
  const docsText = files.map((file) => file?.text ?? "").join("\n");
  if (
    !builderText.includes("bikia-2021-virtual-aortic-impedance")
    || !builderText.includes("source-mean-plus-minus-1sd")
    || !builderText.includes("noQDotClampRemoval: true")
    || !builderText.includes("noBoundaryRootProductionAdoption: true")
  ) {
    addIssue(errors, "phase5af_builder_contract", BUILDER_PATH, "Builder must record sourced calibration and diagnostic-only/no-adoption boundaries.");
  }
  if (!packageText.includes("verify:myocardium-arterial-root-zc-calibration")) {
    addIssue(errors, "phase5af_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AF verifier script.");
  }
  if (
    !docsText.includes("Phase 5AF")
    || !docsText.includes("arterial-root-zc-calibration-phase5af-result-v1")
    || !docsText.includes("sourced Zc")
    || !docsText.includes("0.044")
    || !docsText.includes("0.068")
  ) {
    addIssue(errors, "phase5af_docs", "docs", "Docs must record Phase 5AF sourced Zc calibration evidence and range boundaries.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  const forbidden = [
    "arterial-root-zc-calibration-phase5af-result-v1",
    "verify:myocardium-arterial-root-zc-calibration",
    "buildArterialRootZcCalibrationPhase5AF",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5af_no_production_wiring", relative, `Production-facing file must not wire Phase 5AF diagnostic token ${token}.`);
        }
      }
    }
  }
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5af_local_path", pathLabel, "Committed Phase 5AF evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: ArterialRootZcCalibrationPhase5AFValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5af_missing_file", relativePath, "Required Phase 5AF file is missing.");
    return null;
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

function addIssue(
  issues: ArterialRootZcCalibrationPhase5AFValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateArterialRootZcCalibrationPhase5AF(process.cwd());
  console.log(
    `Arterial root/Zc calibration Phase 5AF ${report.pass ? "PASS" : "FAIL"} `
    + `sourceMean=${report.evidence.summary.sourceMeanMmHgSecPerMl} `
    + `preferred=${report.evidence.summary.preferredCandidateIds.join(",") || "none"} `
    + `boundaryRootStatus=${report.evidence.summary.phase5aeBoundaryRootCalibrationStatus} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyArterialRootZcCalibrationPhase5AF.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
