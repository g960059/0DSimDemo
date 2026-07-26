import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json";
import {
  ARTERIAL_ROOT_BOUNDARY_INERTANCE_PHASE5AE_ID,
  buildArterialRootBoundaryInertancePhase5AEEvidence,
  hashStable,
  type ArterialRootBoundaryInertancePhase5AEEvidence,
  type ArterialRootBoundaryInertancePhase5AERun,
} from "@/tools/myocardium/buildArterialRootBoundaryInertancePhase5AE";

export type ArterialRootBoundaryInertancePhase5AEValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ArterialRootBoundaryInertancePhase5AEValidationReport = {
  readonly pass: boolean;
  readonly evidence: ArterialRootBoundaryInertancePhase5AEEvidence;
  readonly errors: readonly ArterialRootBoundaryInertancePhase5AEValidationIssue[];
  readonly warnings: readonly ArterialRootBoundaryInertancePhase5AEValidationIssue[];
};

export type ArterialRootBoundaryInertancePhase5AEValidationOptions = {
  readonly rebuildEvidence?: boolean;
};

const RESULT_ARTIFACT_PATH =
  "data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json";
const BUILDER_PATH = "tools/myocardium/buildArterialRootBoundaryInertancePhase5AE.ts";
const VERIFIER_PATH = "tools/myocardium/verifyArterialRootBoundaryInertancePhase5AE.ts";
const README_PATH = "docs/myocardium/README.md";
const ROADMAP_PATH = "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md";
const MORPHOLOGY_README_PATH = "docs/myocardium/morphology/README.md";
const PACKAGE_PATH = "package.json";

const EXPECTED_POINT_IDS = [
  "normal-floor",
  "hr90",
  "arterial-stiffness-high",
  "low-preload-alternans-edge",
] as const;
const EXPECTED_MODEL_PATH_IDS = ["stock-active-no-provider-v0", "developer-only-lv-land-v0"] as const;
const EXPECTED_CANDIDATE_IDS = [
  "current-closure",
  "aov-boundary-l-2x-reference",
  "aosa-l-1p5x-prototype",
  "aosa-l-2x-prototype",
  "combined-aov2-aosa1p5-prototype",
  "boundary-root-l-plus-1x-aov-l-mechanism",
] as const;
const EXPECTED_DOES_NOT_UNLOCK = [
  "productionModelCoreEquationChange",
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
  "physicalZcCalibrationClaim",
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

export function validateArterialRootBoundaryInertancePhase5AE(
  rootDir = process.cwd(),
  options: ArterialRootBoundaryInertancePhase5AEValidationOptions = {},
): ArterialRootBoundaryInertancePhase5AEValidationReport {
  const errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[] = [];
  const warnings: ArterialRootBoundaryInertancePhase5AEValidationIssue[] = [];
  const evidence = resultArtifact as unknown as ArterialRootBoundaryInertancePhase5AEEvidence;

  validateIdentity(evidence, errors);
  validateProtocol(evidence, errors);
  validateRuns(evidence, errors);
  validateSummary(evidence, errors, warnings);
  validateBoundary(evidence, errors);
  validateSourceText(rootDir, errors);
  validateNoProductionWiring(rootDir, errors);

  if (options.rebuildEvidence === true) validateFreshEvidence(evidence, errors);
  else {
    warnings.push({
      severity: "warning",
      code: "phase5ae_rebuild_not_run_by_default",
      path: RESULT_ARTIFACT_PATH,
      message: "Phase 5AE rebuild is opt-in because it reruns selected stock/Land boundary/root inertance smoke branches.",
    });
  }
  warnings.push({
    severity: "warning",
    code: "phase5ae_runtime_not_unlocked",
    path: RESULT_ARTIFACT_PATH,
    message: "Phase 5AE is a smoke diagnostic only; root/Zc adoption, qDot clamp removal, runtime default flip, and fix acceptance remain blocked.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: ArterialRootBoundaryInertancePhase5AEEvidence,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  const fresh = buildArterialRootBoundaryInertancePhase5AEEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5ae_stale_artifact", RESULT_ARTIFACT_PATH, "Phase 5AE artifact must match a fresh measured builder run when --rebuild is requested.");
  }
}

function validateIdentity(
  evidence: ArterialRootBoundaryInertancePhase5AEEvidence,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== ARTERIAL_ROOT_BOUNDARY_INERTANCE_PHASE5AE_ID
    || evidence.phase !== "Phase 5AE"
    || evidence.claimBoundary !== "experimental-boundary-root-inertance-diagnostic-only"
    || evidence.upstreamPhase5ADArtifactId !== "arterial-root-zc-prototype-smoke-phase5ad-result-v1"
    || evidence.verifierScript !== "verify:myocardium-arterial-root-boundary-inertance"
    || !/^[a-f0-9]{64}$/.test(evidence.normalizedSha256)
    || evidence.normalizedSha256 !== hashStable(withoutHash(evidence))
  ) {
    addIssue(errors, "phase5ae_identity", RESULT_ARTIFACT_PATH, "Phase 5AE identity, upstream link, verifier script, or hash is invalid.");
  }
}

function validateProtocol(
  evidence: ArterialRootBoundaryInertancePhase5AEEvidence,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  const protocol = evidence.protocol;
  if (
    protocol.pointSource !== "phase5x-selected-plus-frozen-low-preload-edge"
    || !arrayEquals(protocol.modelPathIds, EXPECTED_MODEL_PATH_IDS)
    || !arrayEquals(protocol.selectedPointIds, EXPECTED_POINT_IDS.slice(0, 3))
    || protocol.pointCount !== EXPECTED_POINT_IDS.length
    || protocol.sampleHz !== 1000
    || protocol.dtSec !== 0.001
    || protocol.measureBeats !== 3
    || protocol.aovOpenThreshold !== 0.5
    || protocol.qDotClampMlPerS2 !== 40000
    || protocol.successSignalThresholds.clampReductionMin !== 0.25
    || !arrayEquals(protocol.candidateSet.map((candidate) => candidate.id), EXPECTED_CANDIDATE_IDS)
  ) {
    addIssue(errors, "phase5ae_protocol", `${RESULT_ARTIFACT_PATH}.protocol`, "Phase 5AE protocol constants must remain fixed for boundary/root inertance smoke.");
  }
  if (!arrayEquals(evidence.points.map((point) => point.id), EXPECTED_POINT_IDS)) {
    addIssue(errors, "phase5ae_point_ids", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5AE must preserve selected point order plus low-preload edge.");
  }
}

function validateRuns(
  evidence: ArterialRootBoundaryInertancePhase5AEEvidence,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  if (evidence.points.length !== EXPECTED_POINT_IDS.length) {
    addIssue(errors, "phase5ae_point_count", `${RESULT_ARTIFACT_PATH}.points`, "Phase 5AE point count is invalid.");
  }
  for (const point of evidence.points) {
    validateSide(point.stock, point.id, "stock", errors);
    validateSide(point.land, point.id, "land", errors);
  }
}

function validateSide(
  runs: readonly ArterialRootBoundaryInertancePhase5AERun[],
  pointId: string,
  side: "stock" | "land",
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  const pathPrefix = `${RESULT_ARTIFACT_PATH}.points.${pointId}.${side}`;
  if (!arrayEquals(runs.map((run) => run.candidateId), EXPECTED_CANDIDATE_IDS)) {
    addIssue(errors, "phase5ae_candidate_order", pathPrefix, "Each point/model side must record every candidate in fixed order.");
  }
  for (const run of runs) validateRun(run, pathPrefix, errors);
  const current = runs[0];
  if (
    current.candidateId !== "current-closure"
    || current.parameterization !== "current-closure"
    || current.edgeOverrides !== null
    || current.comparisonVsCurrent?.classification !== "current-closure-reference"
  ) {
    addIssue(errors, "phase5ae_current_run", `${pathPrefix}.current-closure`, "Current closure run must be first and unmodified.");
  }
  if (side === "stock" && runs.some((run) => run.experimentalActiveSourceProvider || run.sourceProviderId != null || run.providerInstrumentation != null)) {
    addIssue(errors, "phase5ae_stock_path", pathPrefix, "Stock runs must not use an experimental source provider.");
  }
  if (side === "land" && runs.some((run) =>
    !run.experimentalActiveSourceProvider
    || !run.sourceProviderId?.includes("phase5u-developer-only-be-phase5q-calcium")
    || run.providerInstrumentation == null
    || run.providerInstrumentation.landSolveFailureCount !== 0
  )) {
    addIssue(errors, "phase5ae_land_path", pathPrefix, "Land runs must use the developer-only LV Land source provider with zero solve failures.");
  }
}

function validateRun(
  run: ArterialRootBoundaryInertancePhase5AERun,
  pathPrefix: string,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  if (
    run.pointId.length === 0
    || run.targetTBVMl <= 0
    || run.baseAoVInertanceMmHgSec2PerMl <= 0
    || run.effectiveAoVInertanceMmHgSec2PerMl <= 0
    || run.baseAoSAInertanceMmHgSec2PerMl !== 0.002
    || run.effectiveAoSAInertanceMmHgSec2PerMl <= 0
    || run.aovBoundaryInertanceMultiple < 1
    || run.aoSaInertanceMultiple < 1
    || run.boundaryRootAdditionalMultipleOfAoVL < 0
    || run.boundaryRootAdditionalInertanceMmHgSec2PerMl < 0
    || run.comparisonVsCurrent == null
  ) {
    addIssue(errors, "phase5ae_run_shape", `${pathPrefix}.${run.candidateId}`, "Run identity and inertance fields must be finite and comparable.");
  }
  if (run.parameterization.includes("aosa") && run.edgeOverrides?.Ao_SA?.L !== run.effectiveAoSAInertanceMmHgSec2PerMl) {
    addIssue(errors, "phase5ae_aosa_override", `${pathPrefix}.${run.candidateId}.edgeOverrides`, "Ao_SA prototype candidates must record the exact edge override L.");
  }
  if (run.parameterization === "experimental-boundary-root-inertance-mechanism") {
    if (
      run.edgeOverrides !== null
      || run.aovBoundaryInertanceMultiple !== 1
      || run.aoSaInertanceMultiple !== 1
      || run.boundaryRootAdditionalMultipleOfAoVL !== 1
      || run.experimentalBoundaryRootInertance?.mechanismId !== "phase5ae-experimental-aortic-boundary-root-inertance-v1"
      || run.experimentalBoundaryRootInertance.effectiveAoVBoundaryRootInertanceMmHgSec2PerMl !== run.effectiveAoVInertanceMmHgSec2PerMl
    ) {
      addIssue(errors, "phase5ae_boundary_root_mechanism", `${pathPrefix}.${run.candidateId}`, "Boundary/root mechanism must be an experimental AoV series-inertance hook with no Ao_SA override.");
    }
  } else if (run.boundaryRootAdditionalInertanceMmHgSec2PerMl !== 0 || run.experimentalBoundaryRootInertance !== null) {
    addIssue(errors, "phase5ae_boundary_root_absent", `${pathPrefix}.${run.candidateId}`, "Only the boundary/root mechanism candidate may carry experimental boundary/root inertance.");
  }
  if (run.status === "measured" && run.metrics == null) {
    addIssue(errors, "phase5ae_measured_metrics", `${pathPrefix}.${run.candidateId}.metrics`, "Measured runs must include metrics.");
  }
}

function validateSummary(
  evidence: ArterialRootBoundaryInertancePhase5AEEvidence,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
  warnings: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  const runs = evidence.points.flatMap((point) => [...point.stock, ...point.land]);
  const candidateRuns = runs.filter((run) => run.candidateId !== "current-closure");
  const healthOkRuns = runs.filter(isMeasuredHealthOk);
  const healthOkCandidateRuns = candidateRuns.filter(isMeasuredHealthOk);
  const aovBoundaryRuns = candidateRuns.filter((run) => run.candidateRole === "phase5ad-aov-boundary-carrier-reference");
  const directAoSaRuns = candidateRuns.filter((run) => run.candidateRole === "off-by-default-direct-aosa-prototype");
  const combinedRuns = candidateRuns.filter((run) => run.candidateRole === "off-by-default-combined-boundary-aosa-prototype");
  const boundaryRootRuns = candidateRuns.filter((run) => run.candidateRole === "experimental-boundary-root-inertance-mechanism");
  const nonOk = runs.filter((run) => run.status !== "measured" || run.health?.status !== "ok");
  if (
    evidence.summary.pointCount !== evidence.points.length
    || evidence.summary.runCount !== runs.length
    || evidence.summary.measuredRunCount !== runs.filter((run) => run.status === "measured").length
    || evidence.summary.healthOkRunCount !== healthOkRuns.length
    || evidence.summary.landSolveFailureCount !== runs.reduce((sum, run) => sum + (run.providerInstrumentation?.landSolveFailureCount ?? 0), 0)
    || evidence.summary.candidateComparisonCount !== candidateRuns.length
    || evidence.summary.healthOkCandidateComparisonCount !== healthOkCandidateRuns.length
    || evidence.summary.aovBoundaryReferenceSignalCount !== signalCount(aovBoundaryRuns)
    || evidence.summary.healthOkAovBoundaryReferenceSignalCount !== signalCount(aovBoundaryRuns.filter(isMeasuredHealthOk))
    || evidence.summary.directAoSaOnlySignalCount !== signalCount(directAoSaRuns)
    || evidence.summary.healthOkDirectAoSaOnlySignalCount !== signalCount(directAoSaRuns.filter(isMeasuredHealthOk))
    || evidence.summary.combinedSignalCount !== signalCount(combinedRuns)
    || evidence.summary.healthOkCombinedSignalCount !== signalCount(combinedRuns.filter(isMeasuredHealthOk))
    || evidence.summary.boundaryRootMechanismSignalCount !== signalCount(boundaryRootRuns)
    || evidence.summary.healthOkBoundaryRootMechanismSignalCount !== signalCount(boundaryRootRuns.filter(isMeasuredHealthOk))
    || evidence.summary.carrierMechanismMatchCount !== carrierMechanismMatchCountFor(evidence, false)
    || evidence.summary.healthOkCarrierMechanismMatchCount !== carrierMechanismMatchCountFor(evidence, true)
    || evidence.summary.nonOkOrUnmeasuredRuns.length !== nonOk.length
  ) {
    addIssue(errors, "phase5ae_summary_consistency", `${RESULT_ARTIFACT_PATH}.summary`, "Summary counts must be recomputable from run evidence.");
  }
  if (
    evidence.summary.prototypeAssessment.directAoSaOnly !== "not-supported-by-phase5ae-smoke"
    || evidence.summary.prototypeAssessment.aovBoundaryCarrierReference !== "signal-present-diagnostic-only"
    || evidence.summary.prototypeAssessment.combinedPrototype !== "not-robust"
    || evidence.summary.prototypeAssessment.boundaryRootMechanism !== "matches-carrier-diagnostic-only"
    || !evidence.summary.currentInterpretation.includes("physicalizes")
    || !evidence.summary.currentInterpretation.includes("diagnostic-only mechanism routing")
    || !evidence.summary.recommendedNext.some((next) => next.includes("do not adopt direct Ao_SA.L"))
    || !evidence.summary.recommendedNext.some((next) => next.includes("experimental boundary/root inertance mechanism"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("selected-point smoke diagnostic"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("not direct Ao_SA adoption"))
    || !evidence.summary.limitations.some((limitation) => limitation.includes("existing AoV flow state"))
  ) {
    addIssue(errors, "phase5ae_interpretation_boundary", `${RESULT_ARTIFACT_PATH}.summary`, "Summary must keep direct Ao_SA adoption blocked and record the boundary/root mechanism diagnostic boundary.");
  }
  warnings.push({
    severity: "warning",
    code: "phase5ae_candidate_signal_count",
    path: `${RESULT_ARTIFACT_PATH}.summary`,
    message: `Phase 5AE signals: aovBoundary=${evidence.summary.healthOkAovBoundaryReferenceSignalCount}; boundaryRoot=${evidence.summary.healthOkBoundaryRootMechanismSignalCount}; directAoSA=${evidence.summary.healthOkDirectAoSaOnlySignalCount}; combined=${evidence.summary.healthOkCombinedSignalCount}; nonOk=${evidence.summary.nonOkOrUnmeasuredRuns.length}.`,
  });
}

function validateBoundary(
  evidence: ArterialRootBoundaryInertancePhase5AEEvidence,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  for (const [key, value] of Object.entries(evidence.boundary)) {
    if (value !== true) {
      addIssue(errors, "phase5ae_boundary", `${RESULT_ARTIFACT_PATH}.boundary.${key}`, "All Phase 5AE boundary flags must remain blocked.");
    }
  }
  for (const token of EXPECTED_DOES_NOT_UNLOCK) {
    if (!evidence.doesNotUnlock.includes(token)) {
      addIssue(errors, "phase5ae_does_not_unlock", `${RESULT_ARTIFACT_PATH}.doesNotUnlock`, `Phase 5AE must keep ${token} blocked.`);
    }
  }
}

function validateSourceText(
  rootDir: string,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  const files = [
    readRequiredText(rootDir, RESULT_ARTIFACT_PATH, errors),
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
  const docsText = files.map((file) => file?.text ?? "").join("\n");
  if (
    !builderText.includes("experimental-boundary-root-inertance-diagnostic-only")
    || !builderText.includes("BOUNDARY_ROOT_MECHANISM_ID")
    || !builderText.includes("boundaryRootInertance")
    || !builderText.includes("noDirectAoSAAdoption: true")
    || !builderText.includes("noAoVBoundaryCarrierAdoption: true")
    || !builderText.includes("noBoundaryRootProductionAdoption: true")
    || !builderText.includes("noQDotClampRemoval: true")
  ) {
    addIssue(errors, "phase5ae_builder_contract", BUILDER_PATH, "Builder must record experimental boundary/root inertance and no-adoption/no-tuning boundaries.");
  }
  if (!packageText.includes("verify:myocardium-arterial-root-boundary-inertance")) {
    addIssue(errors, "phase5ae_package_script", PACKAGE_PATH, "package.json must expose the Phase 5AE verifier script.");
  }
  if (
    !docsText.includes("Phase 5AE")
    || !docsText.includes("arterial-root-boundary-inertance-phase5ae-result-v1")
    || !docsText.includes("boundary/root")
    || !docsText.includes("direct Ao_SA")
    || !docsText.includes("diagnostic")
  ) {
    addIssue(errors, "phase5ae_docs", "docs", "Docs must record Phase 5AE smoke evidence and routing boundary.");
  }
}

function validateNoProductionWiring(
  rootDir: string,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  const forbidden = [
    "arterial-root-boundary-inertance-phase5ae-result-v1",
    "verify:myocardium-arterial-root-boundary-inertance",
    "buildArterialRootBoundaryInertancePhase5AE",
  ] as const;
  for (const relativePath of PRODUCTION_TARGET_PATHS) {
    const absolutePath = path.join(rootDir, relativePath);
    for (const filePath of listFilesIfPresent(absolutePath)) {
      const relative = path.relative(rootDir, filePath);
      if (!/\.(?:cjs|cts|js|jsx|json|mjs|mts|ts|tsx)$/.test(relative)) continue;
      const text = readFileSync(filePath, "utf8");
      for (const token of forbidden) {
        if (text.includes(token)) {
          addIssue(errors, "phase5ae_no_production_wiring", relative, `Production-facing file must not wire Phase 5AE diagnostic token ${token}.`);
        }
      }
    }
  }
}

function signalCount(runs: readonly ArterialRootBoundaryInertancePhase5AERun[]): number {
  return runs.filter((run) => run.comparisonVsCurrent?.lowerClampOutputPreserved).length;
}

function carrierMechanismMatchCountFor(
  evidence: ArterialRootBoundaryInertancePhase5AEEvidence,
  healthOkOnly: boolean,
): number {
  let count = 0;
  for (const point of evidence.points) {
    for (const side of ["stock", "land"] as const) {
      const carrier = point[side].find((run) => run.candidateId === "aov-boundary-l-2x-reference");
      const mechanism = point[side].find((run) => run.candidateId === "boundary-root-l-plus-1x-aov-l-mechanism");
      if (!carrier || !mechanism) continue;
      if (healthOkOnly && (!isMeasuredHealthOk(carrier) || !isMeasuredHealthOk(mechanism))) continue;
      if (runsMatch(carrier, mechanism)) count++;
    }
  }
  return count;
}

function runsMatch(
  left: ArterialRootBoundaryInertancePhase5AERun,
  right: ArterialRootBoundaryInertancePhase5AERun,
): boolean {
  if (left.status !== right.status || left.health?.status !== right.health?.status) return false;
  if (left.metrics == null || right.metrics == null) return left.metrics === right.metrics;
  const metricKeys = [
    "CO_L",
    "AoPMean",
    "LVEDPApprox",
    "EF_LApprox",
    "SV_L",
    "aovOpenDurationSecPerBeat",
    "forwardDurationSecPerBeat",
    "forwardVolumeMlPerBeat",
    "qAoPeakMlPerSec",
    "qAoUpstrokeTimeToPeakSecPerBeat",
    "qDotClampHitFractionAovOpen",
    "incisuraCandidateScore",
  ] as const;
  return metricKeys.every((key) => nearlyEqual(left.metrics?.[key] ?? null, right.metrics?.[key] ?? null))
    && left.comparisonVsCurrent?.classification === right.comparisonVsCurrent?.classification
    && left.comparisonVsCurrent?.lowerClampOutputPreserved === right.comparisonVsCurrent?.lowerClampOutputPreserved
    && left.comparisonVsCurrent?.positiveMorphologySignal === right.comparisonVsCurrent?.positiveMorphologySignal;
}

function nearlyEqual(left: number | null, right: number | null): boolean {
  if (left == null || right == null) return left === right;
  return Math.abs(left - right) <= 1e-9;
}

function isMeasuredHealthOk(
  run: Pick<ArterialRootBoundaryInertancePhase5AERun, "status" | "health"> | undefined,
): boolean {
  return run?.status === "measured" && run.health?.status === "ok";
}

function withoutHash(
  evidence: ArterialRootBoundaryInertancePhase5AEEvidence,
): Omit<ArterialRootBoundaryInertancePhase5AEEvidence, "normalizedSha256"> {
  const { normalizedSha256: _normalizedSha256, ...rest } = evidence;
  return rest;
}

function validateNoLocalAbsolutePaths(
  pathLabel: string,
  text: string,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): void {
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) {
    addIssue(errors, "phase5ae_local_path", pathLabel, "Committed Phase 5AE evidence/docs must not contain local absolute /Users paths.");
  }
}

function readRequiredText(
  rootDir: string,
  relativePath: string,
  errors: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
): { readonly path: string; readonly text: string } | null {
  try {
    return { path: relativePath, text: readFileSync(path.join(rootDir, relativePath), "utf8") };
  } catch {
    addIssue(errors, "phase5ae_missing_file", relativePath, "Required Phase 5AE file is missing.");
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
  issues: ArterialRootBoundaryInertancePhase5AEValidationIssue[],
  code: string,
  pathLabel: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: pathLabel, message });
}

function main(): void {
  const report = validateArterialRootBoundaryInertancePhase5AE(process.cwd(), {
    rebuildEvidence: process.argv.includes("--rebuild"),
  });
  console.log(
    `Arterial boundary/root inertance Phase 5AE ${report.pass ? "PASS" : "FAIL"} `
    + `points=${report.evidence.summary.pointCount} `
    + `runs=${report.evidence.summary.runCount} `
    + `aovBoundarySignals=${report.evidence.summary.healthOkAovBoundaryReferenceSignalCount} `
    + `boundaryRootSignals=${report.evidence.summary.healthOkBoundaryRootMechanismSignalCount} `
    + `carrierMatches=${report.evidence.summary.healthOkCarrierMechanismMatchCount} `
    + `directAoSaSignals=${report.evidence.summary.healthOkDirectAoSaOnlySignalCount} `
    + `combinedSignals=${report.evidence.summary.healthOkCombinedSignalCount} `
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
  const normalizedScriptPath = path.normalize("tools/myocardium/verifyArterialRootBoundaryInertancePhase5AE.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  main();
}
