import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json";
import {
  ARTERIAL_ROOT_ZC_IMPEDANCE_BENCH_PHASE5AC_ID,
  buildArterialRootZcImpedanceBenchPhase5ACEvidence,
  type ArterialRootZcImpedanceBenchPhase5ACEvidence,
  type ArterialRootZcImpedanceBenchPhase5ACRun,
} from "@/tools/myocardium/buildArterialRootZcImpedanceBenchPhase5AC";

export type ArterialRootZcImpedanceBenchPhase5ACValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ArterialRootZcImpedanceBenchPhase5ACValidationReport = {
  readonly pass: boolean;
  readonly evidence: ArterialRootZcImpedanceBenchPhase5ACEvidence;
  readonly errors: readonly ArterialRootZcImpedanceBenchPhase5ACValidationIssue[];
  readonly warnings: readonly ArterialRootZcImpedanceBenchPhase5ACValidationIssue[];
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildArterialRootZcImpedanceBenchPhase5AC.ts";
const VERIFIER_PATH = "tools/myocardium/verifyArterialRootZcImpedanceBenchPhase5AC.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const HISTORICAL_LANES_PATH = "docs/status/archive/current-lanes-through-2026-07-10.md";
const PACKAGE_PATH = "package.json";

const EXPECTED_RUN_IDS = [
  "current-aov-l",
  "phase5ab-pareto-total-2x-aov-l",
  "phase5ab-pareto-total-3x-aov-l",
  "phase5ab-pareto-total-4x-aov-l",
] as const;
const EXPECTED_FREQUENCIES_HZ = [0.5, 1, 2, 3, 5, 8, 12, 16, 20] as const;
const EXPECTED_DOES_NOT_UNLOCK = [
  "ModelCoreEquationChange",
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

export function validateArterialRootZcImpedanceBenchPhase5AC(
  rootDir = process.cwd(),
): ArterialRootZcImpedanceBenchPhase5ACValidationReport {
  const errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[] = [];
  const warnings: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[] = [];
  const evidence = resultArtifact as unknown as ArterialRootZcImpedanceBenchPhase5ACEvidence;

  validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validateRuns(evidence, errors);
  validateSummary(evidence, errors);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5ac_runtime_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AC is a direct isolated impedance bench only; it does not change ModelCore equations, default runtime, qDot clamps, or Ao_SA/Zc values.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: ArterialRootZcImpedanceBenchPhase5ACEvidence,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  const fresh = buildArterialRootZcImpedanceBenchPhase5ACEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5ac_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AC artifact must match a fresh direct impedance bench builder run.");
  }
}

function validateIdentity(
  evidence: ArterialRootZcImpedanceBenchPhase5ACEvidence,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ARTERIAL_ROOT_ZC_IMPEDANCE_BENCH_PHASE5AC_ID
    || evidence.phase !== "Phase 5AC"
    || evidence.claimBoundary !== "isolated-arterial-root-zc-impedance-bench-diagnostic-only"
    || evidence.upstreamPhase5ABArtifactId !== "arterial-root-inertance-closed-loop-phase5ab-result-v1"
    || evidence.verifierScript !== "verify:myocardium-arterial-root-zc-impedance-bench"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
  ) {
    addIssue(errors, "phase5ac_identity", RESULT_ARTIFACT_PATH, "Phase 5AC identity, upstream link, verifier script, or hash is invalid.");
  }
}

function validateProtocol(
  evidence: ArterialRootZcImpedanceBenchPhase5ACEvidence,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  const protocol = evidence.protocol;
  if (
    protocol.benchMode !== "linearized-current-systemic-arterial-load-with-prescribed-input-flow"
    || !arrayEquals(protocol.inputFrequenciesHz, EXPECTED_FREQUENCIES_HZ)
    || protocol.timeResponse.dtSec !== 0.0005
    || protocol.timeResponse.durationSec !== 1.2
    || protocol.timeResponse.ejectionDurationSec !== 0.25
    || protocol.timeResponse.strokeVolumeMl !== 70
    || !arrayEquals(protocol.candidateSet.map((candidate) => candidate.id), EXPECTED_RUN_IDS)
    || evidence.linearizedLoad.source !== "ModelCore-default-topology-linearized-systemic-arterial-load"
  ) {
    addIssue(errors, "phase5ac_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5AC protocol constants must remain fixed for the direct arterial root/Zc impedance bench.");
  }
}

function validateRuns(
  evidence: ArterialRootZcImpedanceBenchPhase5ACEvidence,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  if (!arrayEquals(evidence.runs.map((run) => run.candidateId), EXPECTED_RUN_IDS)) {
    addIssue(errors, "phase5ac_run_ids", `${RESULT_ARTIFACT_PATH}.runs`, "Phase 5AC must preserve current plus Phase 5AB lower-output-preserving candidate order.");
  }
  for (const run of evidence.runs) validateRun(run, errors);
  const highValues = evidence.runs.map((run) => run.highFrequencyImpedanceEstimatePaSecPerM3);
  if (!isStrictlyIncreasing(highValues)) {
    addIssue(errors, "phase5ac_high_frequency_order", `${RESULT_ARTIFACT_PATH}.runs`, "High-frequency direct bench impedance must increase monotonically across the effective root inertance candidates.");
  }
  const seriesEnergyValues = evidence.runs.map((run) => run.timeResponse.seriesInertivePeakEnergyProxyMmHgMl);
  if (!isStrictlyIncreasing(seriesEnergyValues)) {
    addIssue(errors, "phase5ac_series_energy_order", `${RESULT_ARTIFACT_PATH}.runs`, "Series inertive peak energy must increase monotonically across the effective root inertance candidates.");
  }
  const dcValues = evidence.runs.map((run) => run.lowFrequencyResistanceEstimateMmHgSecPerMl);
  if (new Set(dcValues.map((value) => value.toFixed(6))).size !== 1 || dcValues.some((value) => value <= 0)) {
    addIssue(errors, "phase5ac_dc_resistance", `${RESULT_ARTIFACT_PATH}.runs`, "DC resistance estimates must stay positive and invariant across series inertance candidates.");
  }
  const downstreamRootPressures = evidence.runs.map((run) => run.timeResponse.peakRootPressureMmHg);
  const downstreamAoSaFlows = evidence.runs.map((run) => run.timeResponse.peakAoSaFlowMlPerSec);
  const downstreamStored = evidence.runs.map((run) => run.timeResponse.downstreamComplianceStoredEnergyProxyMmHgMl);
  const downstreamDissipated = evidence.runs.map((run) => run.timeResponse.downstreamAoSaDissipatedEnergyProxyMmHgMl);
  if (
    !allSameRounded(downstreamRootPressures)
    || !allSameRounded(downstreamAoSaFlows)
    || !allSameRounded(downstreamStored)
    || !allSameRounded(downstreamDissipated)
  ) {
    addIssue(errors, "phase5ac_downstream_control_invariance", `${RESULT_ARTIFACT_PATH}.runs`, "Prescribed-flow downstream controls must stay invariant across series inertance candidates; candidate sensitivity belongs to input pressure, impedance, and series inertive energy.");
  }
}

function validateRun(
  run: ArterialRootZcImpedanceBenchPhase5ACRun,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.runs.${run.candidateId}`;
  if (
    !Number.isFinite(run.effectiveAoVInertanceMmHgSec2PerMl)
    || run.effectiveAoVInertanceMmHgSec2PerMl <= 0
    || run.lowFrequencyResistanceEstimateMmHgSecPerMl <= 0
    || run.highFrequencyImpedanceEstimatePaSecPerM3 <= 0
    || run.candidateCharacteristicImpedanceStatus !== "available-direct-linear-bench"
    || run.candidateCharacteristicImpedancePaSecPerM3 !== run.highFrequencyImpedanceEstimatePaSecPerM3
    || run.candidateReflectionCoefficientStatus !== "unavailable-no-proxy"
    || run.candidateReflectionCoefficient !== null
    || run.pressureWaveTravelOrDelayProxyStatus !== "available-time-response-proxy"
  ) {
    addIssue(errors, "phase5ac_run_shape", pathPrefix, "Each run must record finite direct impedance, unavailable reflection coefficient, and time-response proxy fields.");
  }
  if (!arrayEquals(run.impedanceSpectrum.map((point) => point.frequencyHz), EXPECTED_FREQUENCIES_HZ)) {
    addIssue(errors, "phase5ac_spectrum_frequencies", `${pathPrefix}.impedanceSpectrum`, "Every candidate must record the fixed frequency grid.");
  }
  const high = run.impedanceSpectrum[run.impedanceSpectrum.length - 1];
  if (
    high.inputImpedanceMagnitudePaSecPerM3 !== run.highFrequencyImpedanceEstimatePaSecPerM3
    || high.inputImpedancePhaseRad !== run.highFrequencyPhaseRad
    || !run.impedanceSpectrum.every(spectrumPointIsFinite)
  ) {
    addIssue(errors, "phase5ac_spectrum_consistency", `${pathPrefix}.impedanceSpectrum`, "High-frequency summary fields must match the final spectrum point and all spectrum values must be finite.");
  }
  const response = run.timeResponse;
  if (
    response.protocol !== "half-sine-ejection-flow"
    || response.strokeVolumeMl !== 70
    || response.ejectionDurationSec !== 0.25
    || response.peakInputFlowMlPerSec <= 0
    || response.peakAoSaFlowMlPerSec <= 0
    || response.peakInputPressureMmHg <= 0
    || response.peakRootPressureMmHg <= 0
    || response.pressureFwhmSec == null
    || response.rootPressureFwhmSec == null
    || response.seriesInertivePeakEnergyProxyMmHgMl <= 0
    || response.downstreamComplianceStoredEnergyProxyMmHgMl <= 0
    || response.downstreamAoSaDissipatedEnergyProxyMmHgMl <= 0
  ) {
    addIssue(errors, "phase5ac_time_response", `${pathPrefix}.timeResponse`, "Time response must remain finite and physically non-empty for the prescribed ejection-flow bench.");
  }
}

function spectrumPointIsFinite(point: ArterialRootZcImpedanceBenchPhase5ACRun["impedanceSpectrum"][number]): boolean {
  return [
    point.frequencyHz,
    point.inputImpedanceMagnitudeMmHgSecPerMl,
    point.inputImpedanceMagnitudePaSecPerM3,
    point.inputImpedancePhaseRad,
    point.treeImpedanceMagnitudeMmHgSecPerMl,
    point.seriesInertanceMagnitudeMmHgSecPerMl,
  ].every(Number.isFinite);
}

function validateSummary(
  evidence: ArterialRootZcImpedanceBenchPhase5ACEvidence,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  const current = evidence.runs[0];
  const paretoHigh = evidence.runs.slice(1).map((run) => run.highFrequencyImpedanceEstimatePaSecPerM3);
  if (
    evidence.summary.runCount !== evidence.runs.length
    || evidence.summary.allRunsFinite !== evidence.runs.every(runIsFinite)
    || evidence.summary.currentLowFrequencyResistanceMmHgSecPerMl !== current.lowFrequencyResistanceEstimateMmHgSecPerMl
    || evidence.summary.currentHighFrequencyImpedancePaSecPerM3 !== current.highFrequencyImpedanceEstimatePaSecPerM3
    || evidence.summary.paretoHighFrequencyImpedanceRangePaSecPerM3.min !== round(Math.min(...paretoHigh))
    || evidence.summary.paretoHighFrequencyImpedanceRangePaSecPerM3.max !== round(Math.max(...paretoHigh))
    || evidence.summary.reflectionCoefficientAvailability !== "unavailable-no-proxy"
  ) {
    addIssue(errors, "phase5ac_summary_consistency", `${RESULT_ARTIFACT_PATH}.summary`, "Summary values must be recomputable from run evidence.");
  }
  if (
    !evidence.summary.currentInterpretation.includes("direct isolated-bench input impedance")
    || !evidence.summary.currentInterpretation.includes("unavailable/no-proxy")
    || !evidence.summary.currentInterpretation.includes("does not adopt Ao_SA/Zc")
    || !evidence.summary.recommendedNext.some((next) => next.includes("off by default"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not a closed-loop runtime change"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("Downstream root pressure"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not a clinical Zc validation claim"))
  ) {
    addIssue(errors, "phase5ac_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Interpretation and limitations must keep Phase 5AC diagnostic-only and non-runtime.");
  }
}

function validateBoundary(
  evidence: ArterialRootZcImpedanceBenchPhase5ACEvidence,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5ac_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AC boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5ac_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AC must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
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
    !builderText.includes("linearized-current-systemic-arterial-load-with-prescribed-input-flow")
    || !builderText.includes("candidateReflectionCoefficientStatus")
    || !builderText.includes("unavailable-no-proxy")
    || !builderText.includes("noQDotClampRemoval: true")
    || !builderText.includes("noDirectAoSAAdoption: true")
  ) {
    addIssue(errors, "phase5ac_builder_contract", BUILDER_PATH, "Builder must record direct impedance bench mode and diagnostic-only/no-adoption boundaries.");
  }
  if (!packageText.includes("verify:myocardium-arterial-root-zc-impedance-bench")) {
    addIssue(errors, "phase5ac_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AC verifier script.");
  }
  if (
    !docsText.includes("Phase 5AC")
    || !docsText.includes("arterial-root-zc-impedance-bench-phase5ac-result-v1")
    || !docsText.includes("direct isolated-bench input impedance")
    || !docsText.includes("unavailable-no-proxy")
  ) {
    addIssue(errors, "phase5ac_docs", "docs", "Docs must record Phase 5AC impedance evidence and no-proxy reflection boundary.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  const forbidden = [
    "arterial-root-zc-impedance-bench-phase5ac-result-v1",
    "verify:myocardium-arterial-root-zc-impedance-bench",
    "buildArterialRootZcImpedanceBenchPhase5AC",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5ac_no_production_wiring", relative, `Production-facing file must not wire Phase 5AC diagnostic token ${token}.`);
        }
      }
    }
  }
}

function runIsFinite(run: ArterialRootZcImpedanceBenchPhase5ACRun): boolean {
  return [
    run.effectiveAoVInertanceMmHgSec2PerMl,
    run.lowFrequencyResistanceEstimateMmHgSecPerMl,
    run.highFrequencyImpedanceEstimatePaSecPerM3,
    run.timeResponse.peakInputPressureMmHg,
    run.timeResponse.peakRootPressureMmHg,
  ].every(Number.isFinite);
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5ac_local_path", pathLabel, "Committed Phase 5AC evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5ac_missing_file", relativePath, "Required Phase 5AC file is missing.");
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

function isStrictlyIncreasing(values: readonly number[]): boolean {
  return values.every((value, index) => index === 0 || value > values[index - 1]);
}

function allSameRounded(values: readonly number[]): boolean {
  return new Set(values.map((value) => value.toFixed(6))).size === 1;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1e6) / 1e6;
}

function addIssue(
  issues: ArterialRootZcImpedanceBenchPhase5ACValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateArterialRootZcImpedanceBenchPhase5AC(process.cwd());
  console.log(
    `Arterial root/Zc impedance bench Phase 5AC ${report.pass ? "PASS" : "FAIL"} `
    + `runs=${report.evidence.summary.runCount} `
    + `currentDcR=${report.evidence.summary.currentLowFrequencyResistanceMmHgSecPerMl} `
    + `currentHighZPa=${report.evidence.summary.currentHighFrequencyImpedancePaSecPerM3} `
    + `paretoHighZPaMin=${report.evidence.summary.paretoHighFrequencyImpedanceRangePaSecPerM3.min} `
    + `paretoHighZPaMax=${report.evidence.summary.paretoHighFrequencyImpedanceRangePaSecPerM3.max} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyArterialRootZcImpedanceBenchPhase5AC.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
