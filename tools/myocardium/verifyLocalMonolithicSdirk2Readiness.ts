import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
} from "@/engine/myocardium/coupling/localMonolithicBeV1";
import {
  LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
} from "@/engine/myocardium/coupling/localMonolithicSdirk2V1";
import {
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
  computeThickSphereV2SelectedCandidateStableHash,
  computeThickSphereV2SelectedParameterSetStableHash,
} from "@/engine/myocardium/kinematics";
import { LAND2017_SDIRK2_GAMMA } from "@/engine/myocardium/myofilament/land2017";
import {
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION,
  runLocalMonolithicSdirk2ReadinessReport,
  type LocalMonolithicSdirk2ReadinessReport,
} from "@/engine/myocardium/protocols/localMonolithicSdirk2Readiness";

export const LOCAL_MONOLITHIC_SDIRK2_PHASE5B_DESCRIPTOR_PATH =
  "data/myocardium/protocols/local-monolithic-coupling-phase5b-sdirk2-protocols.json";
export const LOCAL_MONOLITHIC_SDIRK2_V1_SOURCE_PATH =
  "engine/myocardium/coupling/localMonolithicSdirk2V1.ts";
export const LAND2017_SDIRK2_ENTRYPOINT_SOURCE_PATH =
  "engine/myocardium/myofilament/land2017/sdirk2.ts";
export const LAND2017_SHARED_TYPES_SOURCE_PATH =
  "engine/myocardium/myofilament/land2017/types.ts";
export const LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REPORT_SOURCE_PATH =
  "engine/myocardium/protocols/localMonolithicSdirk2Readiness.ts";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  readonly severity: ValidationSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type TextFileInput = {
  readonly path: string;
  readonly text: string;
};

export type LocalMonolithicSdirk2ReadinessValidationInput = {
  readonly descriptor: unknown;
  readonly report: LocalMonolithicSdirk2ReadinessReport;
  readonly sourceFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly docs: readonly TextFileInput[];
};

export type LocalMonolithicSdirk2ReadinessValidationReport = {
  readonly pass: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly readinessSectionCount: number;
    readonly sourceFileCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly docCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const PINNED_PHASE4D = {
  canonicalStableSummaryHash: "62304684",
  acceptedStableSummaryHashes: ["62304684", "a39922fa"],
  selectedCandidateStableHash: "8faff83b",
  lvParameterSetStableHash: "6fa31380",
  rvParameterSetStableHash: "6ae46df8",
} as const;

const REQUIRED_VERIFICATION_SCRIPTS = [
  "verify:myocardium-local-monolithic-sdirk2-readiness",
  "verify:myocardium-local-monolithic-coupling-readiness",
  "verify:myocardium-selected-mechanics-calibration-readiness",
  "verify:myocardium-land-protocols",
  "verify:myocardium-generalized-force-mapper-readiness",
  "verify:myocardium-passive-energy-readiness",
  "verify:myocardium-tissue-homogenization-readiness",
  "verify:myocardium-land-active-stress-replacement",
] as const;

const REQUIRED_PROTOCOL_IDS = [
  "phase5b-boundary-v1",
  "phase4d-read-only-pin-v1",
  "sdirk2-tableau-v1",
  "land-sdirk2-entrypoint-v1",
  "stage-rate-derivation-v1",
  "stage-land-convergence-v1",
  "local-force-balance-residual-v1",
  "newton-fd-line-search-evidence-v1",
  "finite-state-health-v1",
  "be-vs-sdirk2-discrepancy-v1",
  "runtime-isolation-v1",
  "noncoverage-boundary-v1",
  "deterministic-replay-v1",
] as const;

const CLAIM_SCOPE_EXCLUSIONS = [
  "phase5Completion",
  "productionSolverComparison",
  "performanceAcceptance",
  "activeStiffnessProductionCoupling",
  "activeStiffnessPartitionedProductionCoupling",
  "productionMechanics",
  "productionHomogenization",
  "productionPassiveLaw",
  "productionValidation",
  "officialMorphologyOutcome",
  "morphologyPass",
  "robustNoAlternans",
  "calciumCyclingAlternansValidation",
  "liveRuntimeReplacement",
  "runtimeSchemaStateLayoutChange",
  "ModelCoreChamberWiring",
  "chamberWiring",
  "caseWiring",
  "officialCaseWiring",
  "workbenchWiring",
  "septalCoordinateImplementation",
  "septalCouplingImplementation",
  "RVPressureOverloadCoverage",
  "septalBowingCoverage",
  "ventricularInterdependenceCoverage",
  "rightHeartFailureCoverage",
  "TriSegAdoption",
] as const;

const FALSE_PROTOCOL_SETTINGS = [
  "useProductionSolverComparison",
  "usePerformanceAcceptance",
  "useActiveStiffnessProductionCoupling",
  "useRuntimeReplacement",
  "useModelCoreRuntimeWiring",
  "useChamberRuntimeWiring",
  "useCaseRuntimeWiring",
  "useStateSchemaWiring",
  "useOfficialCaseWiring",
  "useWorkbenchRuntimeWiring",
  "useOfficialMorphologyAcceptance",
  "useRobustNoAlternansAcceptance",
  "useCalciumCyclingAlternansValidation",
  "implementSeptalCoordinate",
  "implementBiventricularCoupling",
  "validateSeptalCoupling",
  "validateRVPressureOverload",
  "validateVentricularInterdependence",
  "validateRightHeartFailure",
  "adoptTriSeg",
] as const;

const RUNTIME_INTEGRATION_TARGETS = [
  "caseCloud.ts",
  "caseDoc.ts",
  "casePersist.ts",
  "caseValidation.ts",
  "components/Cases.tsx",
  "components/workbench",
  "engine/ModelCore.ts",
  "engine/caseBaselines.ts",
  "engine/caseResolve.ts",
  "engine/chambers.ts",
  "engine/guytonStarlingChainWorker.ts",
  "engine/guytonStarlingChainWorkerCore.ts",
  "engine/guytonStarlingChainProtocol.ts",
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/harness.ts",
  "engine/previewController.ts",
  "engine/previewWorker.ts",
  "engine/previewWorkerProtocol.ts",
  "engine/protocol.ts",
  "engine/stateContract.ts",
  "engine/steadyJob.ts",
  "engine/transitionSteadyProtocol.ts",
  "engine/transitionSteadyWorker.ts",
  "engine/core/stateLayout.ts",
  "features/workbench",
  "officialCases.ts",
  "tools/verifyCases.ts",
  "data/cases",
  "public/cases",
] as const;

const PHASE5B_RUNTIME_REFERENCE_TOKENS = [
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID,
  LOCAL_MONOLITHIC_SDIRK2_PHASE5B_DESCRIPTOR_PATH,
  "local-monolithic-coupling-phase5b-sdirk2",
  "localMonolithicSdirk2Readiness",
  "runLocalMonolithicSdirk2ReadinessReport",
  "localMonolithicSdirk2V1",
  "runLocalMonolithicSdirk2V1ReferenceSuite",
  "LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useProductionSolverComparison|usePerformanceAcceptance|useActiveStiffnessProductionCoupling|useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useCaseRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|useOfficialMorphologyAcceptance|useRobustNoAlternansAcceptance|useCalciumCyclingAlternansValidation|implementSeptalCoordinate|implementBiventricularCoupling|validateSeptalCoupling|validateRVPressureOverload|validateVentricularInterdependence|validateRightHeartFailure|adoptTriSeg|phase5Completed|productionSolverComparisonAccepted|performanceAccepted|runtimeReplacement)["']?\s*[:=]\s*true/i;

export function loadLocalMonolithicSdirk2ReadinessValidationInput(
  rootDir = process.cwd(),
): LocalMonolithicSdirk2ReadinessValidationInput {
  return {
    descriptor: readJson(path.join(rootDir, LOCAL_MONOLITHIC_SDIRK2_PHASE5B_DESCRIPTOR_PATH)),
    report: runLocalMonolithicSdirk2ReadinessReport(),
    sourceFiles: [
      readTextFile(rootDir, LAND2017_SDIRK2_ENTRYPOINT_SOURCE_PATH),
      readTextFile(rootDir, LAND2017_SHARED_TYPES_SOURCE_PATH),
      readTextFile(rootDir, LOCAL_MONOLITHIC_SDIRK2_V1_SOURCE_PATH),
      readTextFile(rootDir, LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REPORT_SOURCE_PATH),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    docs: [
      readTextFile(rootDir, "README.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
    ],
  };
}

export function validateLocalMonolithicSdirk2Readiness(
  input: LocalMonolithicSdirk2ReadinessValidationInput,
): LocalMonolithicSdirk2ReadinessValidationReport {
  const issues: ValidationIssue[] = [];

  validateReport(input.report, issues);
  validateDescriptor(input.descriptor, issues);
  validateSourceFiles(input.sourceFiles, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  validateClaimScope("descriptor", input.descriptor, issues);
  validateClaimScope("report", input.report, issues);
  for (const doc of input.docs) {
    validateDocs(doc, issues);
    validateNoProductionClaims(doc.path, doc.text, issues);
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    pass: errors.length === 0,
    errors,
    warnings,
    summary: {
      readinessSectionCount: input.report.sections.length,
      sourceFileCount: input.sourceFiles.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      docCount: input.docs.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateReport(
  report: LocalMonolithicSdirk2ReadinessReport,
  issues: ValidationIssue[],
): void {
  if (
    report.protocolSetId !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID
    || report.phase !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE
    || report.phaseCompletionStatus !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS
    || report.claimBoundary !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY
    || report.referenceModelId !== LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID
    || report.referenceModelClaimBoundary !== LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY
    || report.referenceModelStatus !== "pure-reference-not-runtime-wired"
    || report.sdirk2ReferenceCompletion !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION
  ) {
    addIssue(issues, "error", "phase5b_report_boundary", "report", "Report must remain Phase 5B local-monolithic-sdirk2-v1 reference-readiness only.");
  }
  if (!report.readinessPass || report.readinessStatus !== "local-monolithic-sdirk2-reference-ready") {
    addIssue(issues, "error", "phase5b_report_sections", "report.readinessPass", "Report must pass all Phase 5B sections.");
  }
  if (report.sections.length !== REQUIRED_PROTOCOL_IDS.length) {
    addIssue(issues, "error", "phase5b_report_sections", "report.sections", "Unexpected Phase 5B section count.");
  }
  for (const id of REQUIRED_PROTOCOL_IDS) {
    const section = report.sections.find((candidate) => candidate.id === id);
    if (!section || section.status !== "readiness-pass") {
      addIssue(issues, "error", "phase5b_report_sections", `report.sections.${id}`, `${id} did not pass.`);
    }
  }
  validatePhase4DPin(report.phase4DReadOnlyEvidence, "report.phase4DReadOnlyEvidence", issues);
  validateLocalReferenceSolve(report, issues);
  validateBeVsSdirk2Discrepancy(report.beVsSdirk2Discrepancy, issues);
  validateClaimScope("report.claimScope", report.claimScope, issues);
  validateRuntimeIsolation(report.runtimeIsolation, "report.runtimeIsolation", issues);
  validateFutureTriSegPath(report.futureTriSegPath, "report.futureTriSegPath", issues);
  validateRequiredScripts(report.requiredVerificationScripts, "report.requiredVerificationScripts", issues);
}

function validateLocalReferenceSolve(
  report: LocalMonolithicSdirk2ReadinessReport,
  issues: ValidationIssue[],
): void {
  const suite = report.localReferenceSolve;
  const acceptance = report.localReferenceAcceptance;
  if (
    suite.modelId !== LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID
    || suite.claimBoundary !== LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY
    || suite.tableau.gamma !== LAND2017_SDIRK2_GAMMA
    || suite.stageSolvePolicy !== "sequential-7-unknown-stage-solves"
    || suite.finalStateSource !== "Y1"
    || suite.sampleCount < 2
    || !suite.lvCovered
    || !suite.rvCovered
    || !suite.allSamplesPass
    || suite.maxLandResidualNorm > 1e-9
    || suite.maxLocalForceBalanceResidualAbsPa > 1e-7
    || !/^[0-9a-f]{8}$/.test(suite.stableSummaryHash)
  ) {
    addIssue(issues, "error", "phase5b_reference_solve", "report.localReferenceSolve", "Local monolithic SDIRK2 reference suite must cover LV/RV, pass both stages, and provide finite hash-backed evidence.");
  }
  for (const sample of suite.samples) {
    validateLocalReferenceSample(sample, issues);
  }
  if (
    !acceptance.tableauPass
    || !acceptance.stifflyAccurateFinalStatePass
    || !acceptance.stageSolvePolicyPass
    || !acceptance.landStageConvergencePass
    || !acceptance.localForceBalanceResidualPass
    || !acceptance.newtonFdLineSearchEvidencePass
    || !acceptance.finiteStateHealthPass
    || !acceptance.stageRateDerivationPass
    || !acceptance.calciumStageSemanticsPass
    || !acceptance.beVsSdirk2DiscrepancyPass
    || !acceptance.deterministicHashPass
    || !acceptance.pass
  ) {
    addIssue(issues, "error", "phase5b_reference_acceptance", "report.localReferenceAcceptance", "Acceptance must hinge on tableau, two-stage SDIRK2 convergence, force residual, Newton/FD/line-search evidence, finite health, stage rates, BE-vs-SDIRK2 discrepancy, and deterministic hash.");
  }
}

function validateLocalReferenceSample(
  sample: LocalMonolithicSdirk2ReadinessReport["localReferenceSolve"]["samples"][number],
  issues: ValidationIssue[],
): void {
  const samplePath = `report.localReferenceSolve.samples.${sample.id}`;
  if (
    sample.modelId !== LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID
    || sample.claimBoundary !== LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY
    || !sample.pass
    || sample.finalStageIndex !== 1
    || sample.finalStateSource !== "Y1"
    || !sample.allStageLandSolvesOk
    || !sample.finiteHealthPass
    || (sample.ventricle !== "LV" && sample.ventricle !== "RV")
    || (sample.coordinateId !== "lv-cavity-volume" && sample.coordinateId !== "rv-cavity-volume")
    || sample.stages.length !== 2
  ) {
    addIssue(issues, "error", "phase5b_reference_sample", samplePath, "Sample identity, LV/RV coordinate, two-stage Y1 final-state evidence, or pass flag is invalid.");
  }
  for (const stage of sample.stages) {
    const stagePath = `${samplePath}.stages.${stage.stageIndex}`;
    if (
      !stage.pass
      || !stage.calcium.finite
      || stage.calcium.dtSecSemantics !== "sequential-stage-increment"
      || stage.final.land.method !== "writeLand2017Sdirk2StageResidual"
      || stage.final.land.residualSource !== "Land 2017 SDIRK2 stage residual"
      || stage.final.land.stageScheme !== "SDIRK2"
      || stage.final.land.gamma !== LAND2017_SDIRK2_GAMMA
      || stage.final.land.residualNorm > 1e-9
      || stage.final.land.residualVector.length !== 6
      || stage.final.land.previousState.length !== 6
      || stage.final.land.stageState.length !== 6
      || !stage.final.land.outputFinite
      || !stage.final.land.stateFinite
    ) {
      addIssue(issues, "error", "phase5b_land_sdirk2_convergence", `${stagePath}.final.land`, "Every Phase 5B Land stage must use the dedicated SDIRK2 residual with finite stage output and finite state evidence.");
    }
    if (
      !stage.newton.ok
      || stage.newton.unknownVectorDimension !== 7
      || stage.newton.coupledUnknowns.length !== 7
      || stage.newton.iterationCount <= 0
      || stage.newton.finalResidualAbsPa > 1e-7
      || stage.newton.finalLandResidualNorm > 1e-9
      || stage.newton.lineSearchTrialCount < stage.newton.iterationCount
      || stage.newton.derivativeEvaluationCount <= 0
      || stage.newton.residualEvaluationCount <= 0
      || !Number.isFinite(stage.newton.finalJacobianDeterminant)
      || !Number.isFinite(stage.newton.finalVolumeDerivativePaPerM3)
      || stage.newton.residualHistoryPa.length < 2
      || stage.newton.residualNormHistory.length < 2
    ) {
      addIssue(issues, "error", "phase5b_newton_fd_line_search", `${stagePath}.newton`, "Each SDIRK2 stage must provide 7-unknown Newton, finite-difference Jacobian, residual, and line-search evidence.");
    }
    if (
      Math.abs(stage.final.localForceBalanceResidualPa) > 1e-7
      || !Number.isFinite(stage.final.pressureMapPa)
      || !Number.isFinite(stage.targetExternalPressurePa)
    ) {
      addIssue(issues, "error", "phase5b_force_balance", `${stagePath}.final`, "Local force-balance residual and pressure-map evidence must be finite and within tolerance.");
    }
    if (!stage.finiteHealth.pass || !stage.final.finite) {
      addIssue(issues, "error", "phase5b_finite_health", `${stagePath}.finiteHealth`, "Kinematics, Land, passive, generalized-force, pressure-map, residual, and state health must all be finite.");
    }
    if (
      !stage.final.rateDerivation.pass
      || stage.final.rateDerivation.strainRateResidualAbsPerSec > stage.final.rateDerivation.tolerance
      || stage.final.rateDerivation.coordinateRateResidualAbsSI > stage.final.rateDerivation.tolerance
    ) {
      addIssue(issues, "error", "phase5b_stage_rate_derivation", `${stagePath}.final.rateDerivation`, "Stage strain and cavity coordinate rates must be derived from SDIRK2 stage history.");
    }
  }
  if (!/^[0-9a-f]{8}$/.test(sample.deterministicHash)) {
    addIssue(issues, "error", "phase5b_deterministic_hash", `${samplePath}.deterministicHash`, "Sample deterministic hash must be stable 8-digit hex.");
  }
}

function validateBeVsSdirk2Discrepancy(
  discrepancy: LocalMonolithicSdirk2ReadinessReport["beVsSdirk2Discrepancy"],
  issues: ValidationIssue[],
): void {
  if (
    discrepancy.beReferenceModelId !== LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    || discrepancy.sdirk2ReferenceModelId !== LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID
    || !discrepancy.pass
    || !discrepancy.allFinite
    || !discrepancy.allNotIdentical
    || !discrepancy.allWithinBounds
    || discrepancy.samples.length < 2
    || discrepancy.maxCavityVolumeAbsDiffM3 > discrepancy.maxAllowedCavityVolumeAbsDiffM3
    || discrepancy.maxLandStateLinfDiff > discrepancy.maxAllowedLandStateLinfDiff
  ) {
    addIssue(issues, "error", "phase5b_be_sdirk2_discrepancy", "report.beVsSdirk2Discrepancy", "BE fallback and SDIRK2 reference outputs must be finite, not identical, and within bounded discrepancy thresholds.");
  }
}

function validateDescriptor(descriptor: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(descriptor)) {
    addIssue(issues, "error", "phase5b_descriptor_shape", "descriptor", "Descriptor must be an object.");
    return;
  }
  if (
    descriptor.protocolSetId !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID
    || descriptor.phase !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE
    || descriptor.phaseCompletionStatus !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS
    || descriptor.statusBoundary !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY
    || descriptor.claimBoundary !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY
    || descriptor.referenceModelId !== LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID
    || descriptor.referenceModelStatus !== "pure-reference-not-runtime-wired"
    || descriptor.sdirk2ReferenceCompletion !== LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION
  ) {
    addIssue(issues, "error", "phase5b_descriptor_boundary", "descriptor", "Descriptor must remain Phase 5B local-monolithic-sdirk2-v1 reference-readiness only.");
  }
  validateDescriptorModelIds(descriptor.modelIds, issues);
  validateDescriptorTableau(descriptor.sdirk2Tableau, issues);
  validateDescriptorStageSemantics(descriptor.stageSemantics, issues);
  validateDescriptorLocalReferenceAcceptance(descriptor.localReferenceAcceptance, issues);
  validateProtocolSettings(descriptor.protocolSettings, issues);
  validateClaimScope("descriptor.claimScope", descriptor.claimScope, issues);
  validatePhase4DPin(descriptor.phase4DReadOnlyEvidence, "descriptor.phase4DReadOnlyEvidence", issues);
  validateRuntimeIsolation(descriptor.runtimeIsolation, "descriptor.runtimeIsolation", issues);
  validateFutureTriSegPath(descriptor.futureTriSegPath, "descriptor.futureTriSegPath", issues);
  validateRequiredScripts(readonlyStrings(descriptor.requiredVerificationScripts), "descriptor.requiredVerificationScripts", issues);
  validateProtocolIds(descriptor.protocols, issues);
}

function validateDescriptorModelIds(value: unknown, issues: ValidationIssue[]): void {
  const modelIds = isRecord(value) ? value : {};
  if (
    modelIds.referenceModelId !== LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID
    || modelIds.beFallbackReferenceModelId !== LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    || modelIds.selectedBackendId !== THICK_SPHERE_V2_SELECTED_BACKEND_ID
    || modelIds.selectedCandidateId !== THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
    || modelIds.lvCoordinateId !== "lv-cavity-volume"
    || modelIds.rvCoordinateId !== "rv-cavity-volume"
    || modelIds.prescribedCalciumParameterSetId !== "prescribed-calcium-synthetic-smoke-v1"
    || modelIds.landSourceParameterSetId !== "land2017-intact-human-37c-source-v1"
    || modelIds.homogenizationModelId !== "identity-fiber-nominal-v1"
    || modelIds.passiveModelId !== "passive-exponential-energy-v1"
    || modelIds.generalizedForceMapperId !== "virtual-power-generalized-force-v1"
  ) {
    addIssue(issues, "error", "phase5b_descriptor_model_ids", "descriptor.modelIds", "Descriptor model ids must bind selected-v2, prescribed Ca, Land SDIRK2, identity homogenization, passive energy, generalized-force mapper, and BE fallback comparison.");
  }
}

function validateDescriptorTableau(value: unknown, issues: ValidationIssue[]): void {
  const tableau = isRecord(value) ? value : {};
  if (
    tableau.gammaExpression !== "1 - 1 / Math.sqrt(2)"
    || tableau.stageCount !== 2
    || tableau.a00 !== "gamma"
    || tableau.a10 !== "1-gamma"
    || tableau.a11 !== "gamma"
    || tableau.c0 !== "gamma"
    || tableau.c1 !== 1
    || tableau.finalStateSource !== "Y1"
    || tableau.stifflyAccurate !== true
  ) {
    addIssue(issues, "error", "phase5b_tableau", "descriptor.sdirk2Tableau", "Descriptor must fix the 2-stage stiffly accurate SDIRK2 tableau with gamma = 1 - 1 / sqrt(2) and final state Y1.");
  }
}

function validateDescriptorStageSemantics(value: unknown, issues: ValidationIssue[]): void {
  const semantics = isRecord(value) ? value : {};
  const rejectIndependentInputs = readonlyStrings(semantics.rejectIndependentInputs);
  const historyContract = readonlyStrings(semantics.stage1HistoryContract);
  const requiredRejects = [
    "fiberEngineeringStrainRatePerSec",
    "stageFiberEngineeringStrainRatePerSec",
    "coordinateRateSI",
    "stageCoordinateRateSI",
    "rhs0",
  ];
  if (
    semantics.stageSolvePolicy !== "sequential-7-unknown-stage-solves"
    || semantics.simultaneous14UnknownSolve !== false
    || semantics.stage0Residual !== "Y0 - Yn - dt*gamma*f(Y0,input0)"
    || semantics.stage1Residual !== "Y1 - Yn - dt*((1-gamma)*f(Y0,input0)+gamma*f(Y1,input1))"
    || semantics.stage0StrainRate !== "(E0 - En) / (gamma * dt)"
    || semantics.stage1StrainRate !== "(E1 - En - dt * (1 - gamma) * strainRate0) / (gamma * dt)"
    || semantics.stage0CoordinateRateSI !== "(q0 - qn) / (gamma * dt)"
    || semantics.stage1CoordinateRateSI !== "(q1 - qn - dt * (1 - gamma) * qdot0) / (gamma * dt)"
    || semantics.calciumDtSecSemantics !== "sequential-stage-increment"
    || !historyContract.includes("stage0State")
    || !historyContract.includes("stage0FreeCalciumUM")
    || requiredRejects.some((key) => !rejectIndependentInputs.includes(key))
  ) {
    addIssue(issues, "error", "phase5b_stage_semantics", "descriptor.stageSemantics", "Descriptor must fix SDIRK2 residual, strain-rate, coordinate-rate, calcium-stage, stage0-history, and injection-rejection semantics.");
  }
}

function validateDescriptorLocalReferenceAcceptance(value: unknown, issues: ValidationIssue[]): void {
  const acceptance = isRecord(value) ? value : {};
  const requiredVentricles = readonlyStrings(acceptance.requiredVentricles);
  const stage = isRecord(acceptance.landStage) ? acceptance.landStage : {};
  const methods = readonlyStrings(acceptance.landSolverMethods);
  const coupledUnknowns = readonlyStrings(acceptance.coupledUnknowns);
  if (
    !requiredVentricles.includes("LV")
    || !requiredVentricles.includes("RV")
    || stage.scheme !== "SDIRK2"
    || stage.stageCount !== 2
    || stage.finalStateSource !== "Y1"
    || !methods.includes("writeLand2017Sdirk2StageResidual")
    || !methods.includes("evaluateLand2017Sdirk2StageOutput")
    || acceptance.unknownVectorDimensionPerStage !== 7
    || acceptance.simultaneousUnknownVectorDimension !== "not-used"
    || !coupledUnknowns.includes("cavityVolumeM3")
    || !coupledUnknowns.includes("CaTRPN")
    || !coupledUnknowns.includes("B")
    || !coupledUnknowns.includes("W")
    || !coupledUnknowns.includes("S")
    || !coupledUnknowns.includes("zetaW")
    || !coupledUnknowns.includes("zetaS")
    || acceptance.maxLocalForceBalanceResidualAbsPa !== 1e-7
    || acceptance.maxLandResidualNorm !== 1e-9
    || acceptance.requireBeVsSdirk2NotIdentical !== true
    || acceptance.requireNewtonIterationCountGreaterThanZero !== true
    || acceptance.requireLineSearchEvidence !== true
    || acceptance.requireFiniteDifferenceJacobianEvidence !== true
    || acceptance.requireFiniteStateHealth !== true
    || acceptance.requireStageRateDerivationConsistency !== true
    || acceptance.requireDeterministicHash !== true
  ) {
    addIssue(issues, "error", "phase5b_reference_acceptance", "descriptor.localReferenceAcceptance", "Descriptor must require LV/RV two-stage 7-unknown SDIRK2 local solve convergence, force residual, Newton/FD/line-search evidence, finite health, stage-rate consistency, BE discrepancy, and deterministic hash.");
  }
}

function validateProtocolSettings(value: unknown, issues: ValidationIssue[]): void {
  const settings = isRecord(value) ? value : {};
  if (
    settings.runLocalMonolithicSdirk2Reference !== true
    || settings.useLocalMonolithicSdirk2ReferenceCompletion !== true
    || settings.useBackwardEulerFallbackComparison !== true
    || settings.phase4DReusePolicy !== "read-only"
  ) {
    addIssue(issues, "error", "phase5b_protocol_settings", "descriptor.protocolSettings", "Descriptor must explicitly run the SDIRK2 local reference, compare BE fallback, and reuse Phase 4D read-only.");
  }
  for (const field of FALSE_PROTOCOL_SETTINGS) {
    if (settings[field] !== false) {
      addIssue(issues, "error", "phase5b_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain false.`);
    }
  }
}

function validatePhase4DPin(
  value: unknown,
  issuePath: string,
  issues: ValidationIssue[],
): void {
  const evidence = isRecord(value) ? value : {};
  const computedCandidateHash = computeThickSphereV2SelectedCandidateStableHash();
  const computedLvHash =
    computeThickSphereV2SelectedParameterSetStableHash(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET);
  const computedRvHash =
    computeThickSphereV2SelectedParameterSetStableHash(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET);
  const acceptedStableSummaryHashes = readonlyStrings(evidence.acceptedStableSummaryHashes);
  const acceptedStableSummaryHashSet = new Set<string>(PINNED_PHASE4D.acceptedStableSummaryHashes);
  const stableSummaryHashAccepted =
    typeof evidence.stableSummaryHash === "string"
    && acceptedStableSummaryHashSet.has(evidence.stableSummaryHash);
  const acceptedStableSummaryHashesMatch =
    acceptedStableSummaryHashes.length === PINNED_PHASE4D.acceptedStableSummaryHashes.length
    && PINNED_PHASE4D.acceptedStableSummaryHashes.every((hash) =>
      acceptedStableSummaryHashes.includes(hash),
    );
  if (
    evidence.reusePolicy !== "read-only"
    || evidence.protocolSetId !== "selected-mechanics-calibration-phase4d-protocols-v1"
    || !stableSummaryHashAccepted
    || !acceptedStableSummaryHashesMatch
    || ("expectedStableSummaryHash" in evidence
      && evidence.expectedStableSummaryHash !== PINNED_PHASE4D.canonicalStableSummaryHash)
    || evidence.selectedCandidateStableHash !== PINNED_PHASE4D.selectedCandidateStableHash
    || evidence.lvParameterSetStableHash !== PINNED_PHASE4D.lvParameterSetStableHash
    || evidence.rvParameterSetStableHash !== PINNED_PHASE4D.rvParameterSetStableHash
    || computedCandidateHash !== PINNED_PHASE4D.selectedCandidateStableHash
    || computedLvHash !== PINNED_PHASE4D.lvParameterSetStableHash
    || computedRvHash !== PINNED_PHASE4D.rvParameterSetStableHash
    || evidence.selectedCandidateId !== THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
    || evidence.selectedBackendId !== THICK_SPHERE_V2_SELECTED_BACKEND_ID
    || evidence.driftPolicy !== "fail-if-current-recomputed-values-differ"
    || ("pass" in evidence && evidence.pass !== true)
    || ("stableSummaryHashMatchesPinned" in evidence && evidence.stableSummaryHashMatchesPinned !== true)
    || ("selectedCandidateStableHashMatchesPinned" in evidence && evidence.selectedCandidateStableHashMatchesPinned !== true)
    || ("lvParameterSetStableHashMatchesPinned" in evidence && evidence.lvParameterSetStableHashMatchesPinned !== true)
    || ("rvParameterSetStableHashMatchesPinned" in evidence && evidence.rvParameterSetStableHashMatchesPinned !== true)
  ) {
    addIssue(issues, "error", "phase5b_phase4d_pin_drift", issuePath, "Phase 4D read-only stable summary must be in the pinned runner hash set, and selected candidate plus LV/RV parameter hashes must match the pinned current values.");
  }
}

function validateClaimScope(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const scope = claimScopeRecord(value);
  if (scope.localMonolithicSdirk2ReferenceCompletion !== "claimed") {
    addIssue(issues, "error", "phase5b_claim_scope", `${label}.localMonolithicSdirk2ReferenceCompletion`, "Phase 5B may claim only local-monolithic-sdirk2-v1 synthetic reference completion.");
  }
  for (const field of CLAIM_SCOPE_EXCLUSIONS) {
    if (scope[field] !== "not-claimed") {
      addIssue(issues, "error", "phase5b_forbidden_claim", `${label}.${field}`, `${field} must remain not-claimed.`);
    }
  }
  validateNoProductionClaims(label, JSON.stringify(value), issues);
}

function claimScopeRecord(value: unknown): JsonRecord {
  if (isRecord(value) && isRecord(value.claimScope)) return value.claimScope;
  return isRecord(value) ? value : {};
}

function validateRuntimeIsolation(
  value: unknown,
  issuePath: string,
  issues: ValidationIssue[],
): void {
  const runtime = isRecord(value) ? value : {};
  if (
    runtime.status !== "no-runtime-wiring"
    || runtime.scanPolicy !== "mirror-phase4d-runtime-target-set"
    || ("runtimeWiringStatus" in runtime && runtime.runtimeWiringStatus !== "not-runtime-wired")
  ) {
    addIssue(issues, "error", "phase5b_runtime_isolation", issuePath, "Runtime isolation must remain no-runtime-wiring and mirror Phase 4D target scanning.");
  }
}

function validateFutureTriSegPath(
  value: unknown,
  issuePath: string,
  issues: ValidationIssue[],
): void {
  const future = isRecord(value) ? value : {};
  if (
    future.trisegLiteCandidateId !== "triseg-lite-compatible"
    || future.fullTrisegCompatibleCandidateId !== "full-triseg-compatible"
    || typeof future.fullTriSegPath !== "string"
    || !/full TriSeg/.test(future.fullTriSegPath)
    || future.adoptionStatus !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase5b_future_triseg_path", issuePath, "Future TriSeg path must be preserved while TriSeg adoption remains not-claimed.");
  }
}

function validateRequiredScripts(
  scripts: readonly string[],
  issuePath: string,
  issues: ValidationIssue[],
): void {
  for (const requiredScript of REQUIRED_VERIFICATION_SCRIPTS) {
    if (!scripts.includes(requiredScript)) {
      addIssue(issues, "error", "phase5b_required_scripts", issuePath, `Missing required verifier ${requiredScript}.`);
    }
  }
}

function validateProtocolIds(value: unknown, issues: ValidationIssue[]): void {
  const protocolIds = records(value).map((protocol) => stringField(protocol, "id"));
  for (const requiredId of REQUIRED_PROTOCOL_IDS) {
    if (!protocolIds.includes(requiredId)) {
      addIssue(issues, "error", "phase5b_readiness_sections", "descriptor.protocols", `Descriptor protocol list must include ${requiredId}.`);
    }
  }
}

function validateSourceFiles(
  sourceFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  const land = sourceFiles.find((file) => file.path === LAND2017_SDIRK2_ENTRYPOINT_SOURCE_PATH);
  const sharedTypes = sourceFiles.find((file) => file.path === LAND2017_SHARED_TYPES_SOURCE_PATH);
  const solver = sourceFiles.find((file) => file.path === LOCAL_MONOLITHIC_SDIRK2_V1_SOURCE_PATH);
  const report = sourceFiles.find((file) => file.path === LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REPORT_SOURCE_PATH);
  if (!land || !sharedTypes || !solver || !report) {
    addIssue(issues, "error", "phase5b_source_scan", "sourceFiles", "Phase 5B SDIRK2 source, shared Land types, local reference, and report source must be present.");
    return;
  }
  for (const token of [
    "LAND2017_SDIRK2_GAMMA = 1 - 1 / Math.sqrt(2)",
    "a00",
    "a10",
    "a11",
    "finalStateSource: \"Y1\"",
    "writeLand2017Sdirk2StageResidual",
    "evaluateLand2017Sdirk2StageOutput",
    "land2017Sdirk2Stage0ContinuousInput",
    "rhs0",
    "stage0Rhs",
    "stageCoordinateRateSI",
  ] as const) {
    if (!land.text.includes(token)) {
      addIssue(issues, "error", "phase5b_land_sdirk2_source", land.path, `Land SDIRK2 entrypoint must include ${token}.`);
    }
  }
  for (const token of [
    "Land 2017 SDIRK2 step input is unsupported",
    "fiberEngineeringStrainRatePerSec",
    "stageFiberEngineeringStrainRatePerSec",
  ] as const) {
    if (!sharedTypes.text.includes(token)) {
      addIssue(issues, "error", "phase5b_shared_be_boundary", sharedTypes.path, `Shared Land BE entrypoint must still reject SDIRK2 and independent rates via ${token}.`);
    }
  }
  for (const token of [
    LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
    "sequential-7-unknown-stage-solves",
    "stepPrescribedCalciumTransientV1",
    "evaluateThickSphereV2SelectedBackend",
    "writeLand2017Sdirk2StageResidual",
    "evaluateLand2017Sdirk2StageOutput",
    "deriveStageCoordinateRate",
    "coordinateRatesSI: [coordinateRateM3PerSec]",
    "evaluatePassiveExponentialEnergyV1",
    "evaluateVirtualPowerGeneralizedForceV1",
    "localForceBalanceResidualPa",
    "finiteDifferenceJacobian",
  ] as const) {
    if (!solver.text.includes(token)) {
      addIssue(issues, "error", "phase5b_source_scan", solver.path, `Local monolithic SDIRK2 source must include ${token}.`);
    }
  }
  if (solver.text.includes("runLocalMonolithicBeV1ReferenceSuite")) {
    addIssue(issues, "error", "phase5b_no_be_extension", solver.path, "SDIRK2 reference implementation must not directly extend the Phase 5A BE suite.");
  }
  if (!report.text.includes("beVsSdirk2DiscrepancyEvidence")) {
    addIssue(issues, "error", "phase5b_source_scan", report.path, "Phase 5B report must include bounded BE-vs-SDIRK2 discrepancy evidence.");
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of PHASE5B_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "phase5b_runtime_leak", file.path, `Runtime/official-case/workbench file must not reference Phase 5B token ${token}.`);
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(issues, "error", "phase5b_runtime_leak", file.path, "Runtime/official-case/workbench file must not enable production solver comparison, performance acceptance, active-stiffness production coupling, runtime replacement, morphology/no-alternans validation, septal/RV/interdependence/RHF validation, or TriSeg adoption.");
    }
  }
}

function validateDocs(file: TextFileInput, issues: ValidationIssue[]): void {
  if (!file.text.includes("verify:myocardium-local-monolithic-sdirk2-readiness")) {
    addIssue(issues, "error", "phase5b_docs_mention", file.path, "Docs must mention the Phase 5B local monolithic SDIRK2 verifier.");
  }
  if (!file.text.includes("verify:myocardium-local-monolithic-coupling-readiness")) {
    addIssue(issues, "error", "phase5a_docs_mention", file.path, "Shared docs must preserve the Phase 5A local monolithic coupling verifier mention.");
  }
  if (!file.text.includes("Phase 5A is not Phase 5 completion")) {
    addIssue(issues, "error", "phase5a_docs_boundary", file.path, "Shared docs must preserve the Phase 5A non-completion boundary.");
  }
  if (!/SDIRK2[^.]{0,160}Phase 5B|Phase 5B[^.]{0,160}SDIRK2/.test(file.text)) {
    addIssue(issues, "error", "phase5b_docs_sdirk2_boundary", file.path, "Docs must state that SDIRK2 reference completion is Phase 5B work.");
  }
  if (!file.text.includes("local-monolithic-sdirk2-v1")) {
    addIssue(issues, "error", "phase5b_docs_model_id", file.path, "Docs must mention local-monolithic-sdirk2-v1.");
  }
}

function validateNoProductionClaims(
  label: string,
  text: string,
  issues: ValidationIssue[],
): void {
  if (PRODUCTION_ENABLING_PATTERN.test(text)) {
    addIssue(issues, "error", "phase5b_forbidden_claim", label, "Production/performance/runtime/morphology/no-alternans/septal/RV/interdependence/RHF/TriSeg enabling flag detected.");
  }
}

function loadRuntimeIntegrationFiles(rootDir: string): TextFileInput[] {
  return RUNTIME_INTEGRATION_TARGETS.flatMap((target) => {
    const fullPath = path.join(rootDir, target);
    if (!existsSync(fullPath)) return [];
    return listFiles(fullPath).map((filePath) => ({
      path: path.relative(rootDir, filePath).split(path.sep).join("/"),
      text: readFileSync(filePath, "utf8"),
    }));
  });
}

function listFiles(target: string): string[] {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return /\.(ts|tsx|json)$/.test(target) ? [target] : [];

  const files: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|json)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function readonlyStrings(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: JsonRecord, field: string): string {
  const value = record[field];
  return typeof value === "string" ? value : "";
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readTextFile(rootDir: string, relativePath: string): TextFileInput {
  return {
    path: relativePath,
    text: readFileSync(path.join(rootDir, relativePath), "utf8"),
  };
}

function addIssue(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  code: string,
  issuePath: string,
  message: string,
): void {
  issues.push({ severity, code, path: issuePath, message });
}

function parseArgs(args: readonly string[]): { rootDir: string } {
  const options = { rootDir: process.cwd() };
  for (const arg of args) {
    const [key, value] = arg.split("=", 2);
    if (key === "--root" && value) options.rootDir = path.resolve(value);
    else if (key === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printReport(report: LocalMonolithicSdirk2ReadinessValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 5B local monolithic SDIRK2 readiness ${status} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `sections=${report.summary.readinessSectionCount} `
    + `sourceFiles=${report.summary.sourceFileCount} `
    + `integrationFiles=${report.summary.runtimeIntegrationFileCount} docs=${report.summary.docCount}`,
  );
  printIssues("errors", report.errors);
  printIssues("warnings", report.warnings);
}

function printIssues(label: string, issues: readonly ValidationIssue[]): void {
  if (issues.length === 0) return;
  // eslint-disable-next-line no-console
  console.log(`${label}:`);
  for (const issue of issues.slice(0, 40)) {
    // eslint-disable-next-line no-console
    console.log(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  }
  if (issues.length > 40) {
    // eslint-disable-next-line no-console
    console.log(`- ... ${issues.length - 40} more`);
  }
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log([
    "Usage: npm run verify:myocardium-local-monolithic-sdirk2-readiness -- [--root=DIR]",
    "",
    "Validates the Phase 5B local-monolithic-sdirk2-v1 reference-readiness gate.",
    "This verifier allows only the local synthetic SDIRK2 reference completion claim and rejects Phase 5 completion, production solver comparison, performance acceptance, active-stiffness production coupling, runtime/case/workbench leaks, morphology or robust no-alternans claims, calcium-cycling alternans validation, septal/RV/interdependence/RHF coverage claims, and TriSeg adoption.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateLocalMonolithicSdirk2Readiness(
    loadLocalMonolithicSdirk2ReadinessValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
