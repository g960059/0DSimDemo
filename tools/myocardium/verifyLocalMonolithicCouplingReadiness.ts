import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
} from "@/engine/myocardium/coupling/localMonolithicBeV1";
import {
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  computeThickSphereV2SelectedCandidateStableHash,
  computeThickSphereV2SelectedParameterSetStableHash,
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
} from "@/engine/myocardium/kinematics";
import {
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS,
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE,
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID,
  runLocalMonolithicCouplingReadinessReport,
  type LocalMonolithicCouplingReadinessReport,
} from "@/engine/myocardium/protocols/localMonolithicCouplingReadiness";

export const LOCAL_MONOLITHIC_COUPLING_PHASE5A_DESCRIPTOR_PATH =
  "data/myocardium/protocols/local-monolithic-coupling-phase5a-protocols.json";
export const LOCAL_MONOLITHIC_BE_V1_SOURCE_PATH =
  "engine/myocardium/coupling/localMonolithicBeV1.ts";
export const LOCAL_MONOLITHIC_COUPLING_PHASE5A_REPORT_SOURCE_PATH =
  "engine/myocardium/protocols/localMonolithicCouplingReadiness.ts";

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

export type LocalMonolithicCouplingReadinessValidationInput = {
  readonly descriptor: unknown;
  readonly report: LocalMonolithicCouplingReadinessReport;
  readonly sourceFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly docs: readonly TextFileInput[];
};

export type LocalMonolithicCouplingReadinessValidationReport = {
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

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  "docs/myocardium/README.md",
  "data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json",
  LOCAL_MONOLITHIC_BE_V1_SOURCE_PATH,
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_REPORT_SOURCE_PATH,
] as const;

const REQUIRED_VERIFICATION_SCRIPTS = [
  "verify:myocardium-local-monolithic-coupling-readiness",
  "verify:myocardium-selected-mechanics-calibration-readiness",
  "verify:myocardium-land-protocols",
  "verify:myocardium-generalized-force-mapper-readiness",
  "verify:myocardium-passive-energy-readiness",
  "verify:myocardium-tissue-homogenization-readiness",
  "verify:myocardium-land-active-stress-replacement",
] as const;

const REQUIRED_PROTOCOL_IDS = [
  "phase5a-boundary-v1",
  "phase4d-read-only-pin-v1",
  "local-monolithic-be-reference-identity-v1",
  "land-be-convergence-v1",
  "local-force-balance-residual-v1",
  "newton-line-search-evidence-v1",
  "finite-state-health-v1",
  "derived-land-strain-rate-consistency-v1",
  "runtime-isolation-v1",
  "noncoverage-sdirk2-triseg-boundary-v1",
  "deterministic-replay-v1",
] as const;

const FORBIDDEN_CLAIM_FIELDS = [
  "phase5Completion",
  "sdirk2ReferenceCompletion",
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
  "useSDIRK2ReferenceCompletion",
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

const PHASE5A_RUNTIME_REFERENCE_TOKENS = [
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID,
  LOCAL_MONOLITHIC_COUPLING_PHASE5A_DESCRIPTOR_PATH,
  "local-monolithic-coupling-phase5a",
  "localMonolithicCouplingReadiness",
  "runLocalMonolithicCouplingReadinessReport",
  "localMonolithicBeV1",
  "runLocalMonolithicBeV1ReferenceSuite",
  "LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID",
  "LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useSDIRK2ReferenceCompletion|useProductionSolverComparison|usePerformanceAcceptance|useActiveStiffnessProductionCoupling|useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useCaseRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|useOfficialMorphologyAcceptance|useRobustNoAlternansAcceptance|useCalciumCyclingAlternansValidation|implementSeptalCoordinate|implementBiventricularCoupling|validateSeptalCoupling|validateRVPressureOverload|validateVentricularInterdependence|validateRightHeartFailure|adoptTriSeg|phase5Completed|sdirk2ReferenceCompleted|productionSolverComparisonAccepted|performanceAccepted|runtimeReplacement)["']?\s*[:=]\s*true/i;

const OVERCLAIM_PATTERN =
  /\b(?:(?:Phase 5 completion|SDIRK2 reference completion|robust no[-\s]?alternans|production solver comparison|performance acceptance|active[-\s]?stiffness(?: partitioned)? production coupling|runtime replacement|ModelCore wiring|chamber wiring|case wiring|official[-\s]?case wiring|workbench wiring|official morphology|morphology pass|septal coordinate|septal coupling|biventricular coupling|RV pressure overload|septal bowing|ventricular interdependence|right[-\s]?heart failure|TriSeg adoption)[^.!?\n]{0,160}\b(?:claimed|complete|completed|accepted|pass(?:ed)?|validated|implemented|wired|adopted|covered))\b/i;

const NON_CLAIM_WINDOW_PATTERN =
  /not[-\s]claimed|not\s+claimed|not[-\s]implemented|not\s+implemented|not\s+covered|not[-\s]runtime[-\s]wired|non[-\s]coverage|without|no[^.!?\n]{0,140}(?:claim|coverage|wiring|implementation|validation|acceptance)|must\s+not|does\s+not|deferred|Phase 5B|future|read-only|not Phase 5 completion|claim\s+しません|主張しません|主張しない|covered\s+ではなく|では\s+covered\s+ではなく/i;

export function loadLocalMonolithicCouplingReadinessValidationInput(
  rootDir = process.cwd(),
): LocalMonolithicCouplingReadinessValidationInput {
  return {
    descriptor: readJson(path.join(rootDir, LOCAL_MONOLITHIC_COUPLING_PHASE5A_DESCRIPTOR_PATH)),
    report: runLocalMonolithicCouplingReadinessReport(),
    sourceFiles: [
      readTextFile(rootDir, LOCAL_MONOLITHIC_BE_V1_SOURCE_PATH),
      readTextFile(rootDir, LOCAL_MONOLITHIC_COUPLING_PHASE5A_REPORT_SOURCE_PATH),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    docs: [
      readTextFile(rootDir, "README.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
    ],
  };
}

export function validateLocalMonolithicCouplingReadiness(
  input: LocalMonolithicCouplingReadinessValidationInput,
): LocalMonolithicCouplingReadinessValidationReport {
  const issues: ValidationIssue[] = [];

  validateReport(input.report, issues);
  validateDescriptor(input.descriptor, issues);
  validateSourceFiles(input.sourceFiles, issues);
  validateForbiddenClaims("descriptor", input.descriptor, issues);
  validateForbiddenClaims("report", input.report, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  validateNonCoverageAndFutureTriSeg("descriptor", input.descriptor, issues);
  validateNonCoverageAndFutureTriSeg("report", input.report, issues);
  for (const doc of input.docs) {
    validateDocs(doc, issues);
    validateForbiddenClaims(doc.path, doc.text, issues);
    validateNonCoverageAndFutureTriSeg(doc.path, doc.text, issues);
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
  report: LocalMonolithicCouplingReadinessReport,
  issues: ValidationIssue[],
): void {
  if (
    report.protocolSetId !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID
    || report.phase !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE
    || report.phaseCompletionStatus !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS
    || report.claimBoundary !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY
    || report.referenceModelId !== LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    || report.referenceModelClaimBoundary !== LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY
    || report.referenceModelStatus !== "pure-reference-not-runtime-wired"
    || report.sdirk2ReferenceCompletion !== "deferred-to-phase5b"
  ) {
    addIssue(issues, "error", "phase5a_report_boundary", "report", "Report must remain Phase 5A local-monolithic BE reference-readiness only with SDIRK2 deferred to Phase 5B.");
  }
  if (!report.readinessPass || report.readinessStatus !== "local-monolithic-be-reference-ready") {
    addIssue(issues, "error", "phase5a_report_sections", "report.readinessPass", "Report must pass all Phase 5A sections.");
  }
  if (report.sections.length !== REQUIRED_PROTOCOL_IDS.length) {
    addIssue(issues, "error", "phase5a_report_sections", "report.sections", "Unexpected Phase 5A section count.");
  }
  for (const id of REQUIRED_PROTOCOL_IDS) {
    const section = report.sections.find((candidate) => candidate.id === id);
    if (!section || section.status !== "readiness-pass") {
      addIssue(issues, "error", "phase5a_report_sections", `report.sections.${id}`, `${id} did not pass.`);
    }
  }
  validatePhase4DPin(report.phase4DReadOnlyEvidence, "report.phase4DReadOnlyEvidence", issues);
  validateLocalReferenceSolve(report, issues);
  validateClaimExclusions(report.claimExclusions, "report.claimExclusions", issues);
  validateRuntimeIsolation(report.runtimeIsolation, "report.runtimeIsolation", issues);
  validateFutureTriSegPath(report.futureTriSegPath, "report.futureTriSegPath", issues);
  validateRequiredScripts(report.requiredVerificationScripts, "report.requiredVerificationScripts", issues);
}

function validateLocalReferenceSolve(
  report: LocalMonolithicCouplingReadinessReport,
  issues: ValidationIssue[],
): void {
  const suite = report.localReferenceSolve;
  const acceptance = report.localReferenceAcceptance;
  if (
    suite.modelId !== LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    || suite.claimBoundary !== LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY
    || suite.sampleCount < 2
    || !suite.lvCovered
    || !suite.rvCovered
    || !suite.allSamplesPass
    || suite.maxLandResidualNorm > acceptance.maxLandResidualNorm
    || suite.maxLocalForceBalanceResidualAbsPa > acceptance.maxLocalForceBalanceResidualAbsPa
    || !/^[0-9a-f]{8}$/.test(suite.stableSummaryHash)
  ) {
    addIssue(issues, "error", "phase5a_reference_solve", "report.localReferenceSolve", "Local monolithic BE reference suite must cover LV/RV, pass all samples, and provide finite deterministic hash-backed evidence.");
  }
  for (const sample of suite.samples) {
    validateLocalReferenceSample(
      sample,
      acceptance.maxLandResidualNorm,
      acceptance.maxLocalForceBalanceResidualAbsPa,
      issues,
    );
  }
  if (
    acceptance.landStageScheme !== "BE"
    || acceptance.landStageIndex !== 0
    || !acceptance.landBeConvergencePass
    || !acceptance.localForceBalanceResidualPass
    || !acceptance.newtonEvidencePass
    || !acceptance.finiteStateHealthPass
    || !acceptance.derivedLandStrainRateConsistencyPass
    || !acceptance.deterministicHashPass
    || !acceptance.pass
  ) {
    addIssue(issues, "error", "phase5a_reference_acceptance", "report.localReferenceAcceptance", "Reference acceptance must hinge on Land BE convergence, force-balance residual, Newton evidence, finite health, derived strain-rate consistency, and deterministic hash.");
  }
}

function validateLocalReferenceSample(
  sample: LocalMonolithicCouplingReadinessReport["localReferenceSolve"]["samples"][number],
  maxLandResidualNorm: number,
  maxLocalForceBalanceResidualAbsPa: number,
  issues: ValidationIssue[],
): void {
  const samplePath = `report.localReferenceSolve.samples.${sample.id}`;
  if (
    sample.modelId !== LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    || sample.claimBoundary !== LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY
    || !sample.pass
    || (sample.ventricle !== "LV" && sample.ventricle !== "RV")
    || (sample.coordinateId !== "lv-cavity-volume" && sample.coordinateId !== "rv-cavity-volume")
    || !sample.calcium.finite
  ) {
    addIssue(issues, "error", "phase5a_reference_sample", samplePath, "Sample identity, LV/RV coordinate, calcium finite evidence, or pass flag is invalid.");
  }
  if (
    !sample.allLandSolvesOk
    || sample.maxLandResidualNorm > maxLandResidualNorm
    || !sample.final.land.ok
    || sample.final.land.method !== "writeLand2017BackwardEulerResidual"
    || sample.final.land.residualSource !== "Land 2017 backward-Euler residual"
    || sample.final.land.stageScheme !== "BE"
    || sample.final.land.stageIndex !== 0
    || sample.final.land.residualNorm > maxLandResidualNorm
    || sample.final.land.residualVector.length !== 6
    || sample.final.land.previousState.length !== 6
    || sample.final.land.nextState.length !== 6
    || !Number.isFinite(sample.final.land.stateUpdateLinf)
    || !sample.final.land.outputFinite
    || !sample.final.land.stateFinite
  ) {
    addIssue(issues, "error", "phase5a_land_be_convergence", `${samplePath}.final.land`, "Every Phase 5A Land state must be solved inside the monolithic BE residual with finite output and finite state evidence.");
  }
  if (
    !sample.newton.ok
    || sample.newton.unknownVectorDimension !== 7
    || sample.newton.coupledUnknowns.length !== 7
    || sample.newton.iterationCount <= 0
    || sample.newton.finalResidualAbsPa > maxLocalForceBalanceResidualAbsPa
    || sample.newton.finalLandResidualNorm > maxLandResidualNorm
    || sample.newton.lineSearchTrialCount < sample.newton.iterationCount
    || sample.newton.derivativeEvaluationCount <= 0
    || sample.newton.residualEvaluationCount <= 0
    || !Number.isFinite(sample.newton.finalJacobianDeterminant)
    || !Number.isFinite(sample.newton.finalVolumeDerivativePaPerM3)
    || sample.newton.residualHistoryPa.length < 2
    || sample.newton.residualNormHistory.length < 2
  ) {
    addIssue(issues, "error", "phase5a_newton_evidence", `${samplePath}.newton`, "Local monolithic solve must provide coupled 7-unknown Newton iteration, residual, finite-difference Jacobian, and line-search evidence.");
  }
  if (
    sample.maxLocalForceBalanceResidualAbsPa > maxLocalForceBalanceResidualAbsPa
    || Math.abs(sample.final.localForceBalanceResidualPa) > maxLocalForceBalanceResidualAbsPa
    || !Number.isFinite(sample.final.pressureMapPa)
    || !Number.isFinite(sample.targetExternalPressurePa)
  ) {
    addIssue(issues, "error", "phase5a_force_balance", `${samplePath}.final`, "Local force-balance residual and pressure-map evidence must be finite and within tolerance.");
  }
  if (!sample.finiteHealth.pass || !sample.final.finite) {
    addIssue(issues, "error", "phase5a_finite_health", `${samplePath}.finiteHealth`, "Kinematics, Land, passive, generalized-force, pressure-map, residual, and state health must all be finite.");
  }
  if (!sample.final.strainRate.pass || sample.final.strainRate.derivationResidualAbsPerSec > sample.final.strainRate.tolerancePerSec) {
    addIssue(issues, "error", "phase5a_strain_rate_derivation", `${samplePath}.final.strainRate`, "Land step strain rate must be derived from previous/stage strain history.");
  }
  if (!/^[0-9a-f]{8}$/.test(sample.deterministicHash)) {
    addIssue(issues, "error", "phase5a_deterministic_hash", `${samplePath}.deterministicHash`, "Sample deterministic hash must be stable 8-digit hex.");
  }
}

function validateDescriptor(descriptor: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(descriptor)) {
    addIssue(issues, "error", "phase5a_descriptor_shape", "descriptor", "Descriptor must be an object.");
    return;
  }
  if (
    descriptor.protocolSetId !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID
    || descriptor.phase !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE
    || descriptor.phaseCompletionStatus !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS
    || descriptor.statusBoundary !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY
    || descriptor.claimBoundary !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY
    || descriptor.referenceModelId !== LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    || descriptor.referenceModelStatus !== "pure-reference-not-runtime-wired"
    || descriptor.sdirk2ReferenceCompletion !== "deferred-to-phase5b"
  ) {
    addIssue(issues, "error", "phase5a_descriptor_boundary", "descriptor", "Descriptor must remain Phase 5A BE reference-readiness only and defer SDIRK2 to Phase 5B.");
  }
  if (
    typeof descriptor.sdirk2DeferralReason !== "string"
    || !/deriveLand2017StepKinematics\(\).*throws.*SDIRK2/i.test(descriptor.sdirk2DeferralReason)
  ) {
    addIssue(issues, "error", "phase5a_sdirk2_boundary", "descriptor.sdirk2DeferralReason", "Descriptor must state that deriveLand2017StepKinematics() throws for SDIRK2 and that SDIRK2 is Phase 5B work.");
  }
  validateDirectSourceDocuments(descriptor.sourceDocuments, issues);
  validateDescriptorModelIds(descriptor.modelIds, issues);
  validatePhase4DPin(descriptor.phase4DReadOnlyEvidence, "descriptor.phase4DReadOnlyEvidence", issues);
  validateDescriptorLocalReferenceAcceptance(descriptor.localReferenceAcceptance, issues);
  validateProtocolSettings(descriptor.protocolSettings, issues);
  validateClaimExclusions(descriptor.claimExclusions, "descriptor.claimExclusions", issues);
  validateRuntimeIsolation(descriptor.runtimeIsolation, "descriptor.runtimeIsolation", issues);
  validateFutureTriSegPath(descriptor.futureTriSegPath, "descriptor.futureTriSegPath", issues);
  validateRequiredScripts(readonlyStrings(descriptor.requiredVerificationScripts), "descriptor.requiredVerificationScripts", issues);
  validateProtocolIds(descriptor.protocols, issues);
}

function validateDescriptorModelIds(value: unknown, issues: ValidationIssue[]): void {
  const modelIds = isRecord(value) ? value : {};
  if (
    modelIds.referenceModelId !== LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
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
    addIssue(issues, "error", "phase5a_descriptor_model_ids", "descriptor.modelIds", "Descriptor model ids must bind selected-v2, prescribed Ca, Land BE, identity homogenization, passive energy, and generalized-force mapper.");
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
    || stage.scheme !== "BE"
    || stage.stageIndex !== 0
    || !methods.includes("writeLand2017BackwardEulerResidual")
    || !methods.includes("evaluateLand2017StepOutput")
    || acceptance.unknownVectorDimension !== 7
    || !coupledUnknowns.includes("cavityVolumeM3")
    || !coupledUnknowns.includes("CaTRPN")
    || !coupledUnknowns.includes("B")
    || !coupledUnknowns.includes("W")
    || !coupledUnknowns.includes("S")
    || !coupledUnknowns.includes("zetaW")
    || !coupledUnknowns.includes("zetaS")
    || acceptance.maxLocalForceBalanceResidualAbsPa !== 1e-7
    || acceptance.maxLandResidualNorm !== 1e-9
    || acceptance.requireNewtonIterationCountGreaterThanZero !== true
    || acceptance.requireLineSearchEvidence !== true
    || acceptance.requireFiniteStateHealth !== true
    || acceptance.requireDerivedLandStrainRateConsistency !== true
    || acceptance.requireDeterministicHash !== true
  ) {
    addIssue(issues, "error", "phase5a_reference_acceptance", "descriptor.localReferenceAcceptance", "Descriptor must require LV/RV coupled Land-state plus coordinate BE local solve convergence, force-balance residual, Newton/line-search evidence, finite health, derived strain-rate consistency, and deterministic hash.");
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
    addIssue(issues, "error", "phase5a_phase4d_pin_drift", issuePath, "Phase 4D read-only stable summary must be in the pinned runner hash set, and selected candidate plus LV/RV parameter hashes must match the pinned current values.");
  }
}

function validateProtocolSettings(value: unknown, issues: ValidationIssue[]): void {
  const settings = isRecord(value) ? value : {};
  if (
    settings.runLocalMonolithicBeReference !== true
    || settings.useBackwardEulerReference !== true
    || settings.phase4DReusePolicy !== "read-only"
  ) {
    addIssue(issues, "error", "phase5a_protocol_settings", "descriptor.protocolSettings", "Descriptor must explicitly run only the BE local reference and reuse Phase 4D read-only.");
  }
  for (const field of FALSE_PROTOCOL_SETTINGS) {
    if (settings[field] !== false) {
      addIssue(issues, "error", "phase5a_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain false.`);
    }
  }
}

function validateClaimExclusions(
  value: unknown,
  issuePath: string,
  issues: ValidationIssue[],
): void {
  const exclusions = isRecord(value) ? value : {};
  for (const field of FORBIDDEN_CLAIM_FIELDS) {
    if (exclusions[field] !== "not-claimed") {
      addIssue(issues, "error", "phase5a_forbidden_claim", `${issuePath}.${field}`, `${field} must remain not-claimed.`);
    }
  }
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
    addIssue(issues, "error", "phase5a_runtime_isolation", issuePath, "Runtime isolation must remain no-runtime-wiring and mirror Phase 4D target scanning.");
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
    addIssue(issues, "error", "phase5a_future_triseg_path", issuePath, "Future TriSeg path must be preserved while TriSeg adoption remains not-claimed.");
  }
}

function validateDirectSourceDocuments(value: unknown, issues: ValidationIssue[]): void {
  const sourcePaths = records(value).map((source) => stringField(source, "path")).filter(Boolean);
  for (const requiredPath of REQUIRED_DESCRIPTOR_SOURCE_PATHS) {
    if (!sourcePaths.includes(requiredPath)) {
      addIssue(issues, "error", "phase5a_direct_provenance", "descriptor.sourceDocuments", `Descriptor must directly reference ${requiredPath}.`);
    }
  }
}

function validateRequiredScripts(
  scripts: readonly string[],
  issuePath: string,
  issues: ValidationIssue[],
): void {
  for (const requiredScript of REQUIRED_VERIFICATION_SCRIPTS) {
    if (!scripts.includes(requiredScript)) {
      addIssue(issues, "error", "phase5a_required_scripts", issuePath, `Missing required verifier ${requiredScript}.`);
    }
  }
}

function validateProtocolIds(value: unknown, issues: ValidationIssue[]): void {
  const protocolIds = records(value).map((protocol) => stringField(protocol, "id"));
  for (const requiredId of REQUIRED_PROTOCOL_IDS) {
    if (!protocolIds.includes(requiredId)) {
      addIssue(issues, "error", "phase5a_readiness_sections", "descriptor.protocols", `Descriptor protocol list must include ${requiredId}.`);
    }
  }
}

function validateSourceFiles(
  sourceFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  const solver = sourceFiles.find((file) => file.path === LOCAL_MONOLITHIC_BE_V1_SOURCE_PATH);
  const report = sourceFiles.find((file) => file.path === LOCAL_MONOLITHIC_COUPLING_PHASE5A_REPORT_SOURCE_PATH);
  if (!solver) {
    addIssue(issues, "error", "phase5a_source_scan", LOCAL_MONOLITHIC_BE_V1_SOURCE_PATH, "Local monolithic BE source is missing from validation input.");
    return;
  }
  if (!report) {
    addIssue(issues, "error", "phase5a_source_scan", LOCAL_MONOLITHIC_COUPLING_PHASE5A_REPORT_SOURCE_PATH, "Phase 5A report source is missing from validation input.");
  }
  for (const token of [
    LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
    "stepPrescribedCalciumTransientV1",
    "evaluateThickSphereV2SelectedBackend",
    "writeLand2017BackwardEulerResidual",
    "evaluateLand2017StepOutput",
    "LOCAL_MONOLITHIC_BE_V1_UNKNOWN_VECTOR_DIMENSION",
    "stage: { scheme: \"BE\", stageIndex: 0 }",
    "IdentityFiberNominalV1",
    "evaluatePassiveExponentialEnergyV1",
    "evaluateVirtualPowerGeneralizedForceV1",
    "localForceBalanceResidualPa",
    "newton",
  ] as const) {
    if (!solver.text.includes(token)) {
      addIssue(issues, "error", "phase5a_source_scan", solver.path, `Local monolithic BE source must include ${token}.`);
    }
  }
  if (/stage\s*:\s*\{\s*scheme\s*:\s*["']SDIRK2["']|scheme\s*:\s*["']SDIRK2["']/.test(solver.text)) {
    addIssue(issues, "error", "phase5a_sdirk2_boundary", solver.path, "Local monolithic BE source must not construct SDIRK2 Land stages.");
  }
  if (report && !report.text.includes("phase4DReadOnlyEvidence")) {
    addIssue(issues, "error", "phase5a_source_scan", report.path, "Phase 5A report source must include Phase 4D read-only pin evidence.");
  }
}

function validateForbiddenClaims(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const window of regexWindows(text, OVERCLAIM_PATTERN, 180, 300)) {
    if (!NON_CLAIM_WINDOW_PATTERN.test(window)) {
      addIssue(issues, "error", "phase5a_overclaim", label, "Phase 5 completion, SDIRK2, production/performance/runtime/morphology/no-alternans/septal/RV/interdependence/RHF, or TriSeg overclaim detected.");
      break;
    }
  }
  scanForbiddenClaimFields(label, value, issues);
}

function scanForbiddenClaimFields(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
  pathPrefix = label,
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbiddenClaimFields(label, entry, issues, `${pathPrefix}.${index}`));
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    const issuePath = `${pathPrefix}.${key}`;
    if (key === "phaseCompletionStatus" && nestedValue !== LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS) {
      addIssue(issues, "error", "phase5a_forbidden_claim", issuePath, "Phase 5A must not claim Phase 5 completion.");
    }
    if (
      FORBIDDEN_CLAIM_FIELDS.includes(key as typeof FORBIDDEN_CLAIM_FIELDS[number])
      && nestedValue !== "not-claimed"
      && nestedValue !== "deferred-to-phase5b"
    ) {
      addIssue(issues, "error", "phase5a_forbidden_claim", issuePath, `${key} must remain not-claimed or explicitly deferred.`);
    }
    if (PRODUCTION_ENABLING_PATTERN.test(`${key}: ${String(nestedValue)}`)) {
      addIssue(issues, "error", "phase5a_forbidden_claim", issuePath, `${key} must not enable Phase 5A exclusions.`);
    }
    scanForbiddenClaimFields(label, nestedValue, issues, issuePath);
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of PHASE5A_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "phase5a_runtime_leak", file.path, `Runtime/official-case/workbench file must not reference Phase 5A token ${token}.`);
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(issues, "error", "phase5a_runtime_leak", file.path, "Runtime/official-case/workbench file must not enable SDIRK2 completion, production solver comparison, performance acceptance, active-stiffness production coupling, runtime replacement, morphology/no-alternans validation, septal/RV/interdependence/RHF validation, or TriSeg adoption.");
    }
  }
}

function validateNonCoverageAndFutureTriSeg(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const requirements = [
    { pattern: /Phase 5 completion/i, fields: ["phase5Completion"] },
    { pattern: /SDIRK2 reference completion/i, fields: ["sdirk2ReferenceCompletion"] },
    { pattern: /robust[^.!?\n]{0,80}no[-\s]?alternans/i, fields: ["robustNoAlternans"] },
    { pattern: /production solver comparison/i, fields: ["productionSolverComparison"] },
    { pattern: /performance acceptance/i, fields: ["performanceAcceptance"] },
    { pattern: /active[-\s]?stiffness[^.!?\n]{0,80}production coupling/i, fields: ["activeStiffnessProductionCoupling", "activeStiffnessPartitionedProductionCoupling"] },
    { pattern: /runtime replacement|ModelCore|chamber wiring|case wiring|official-case wiring|workbench wiring/i, fields: ["liveRuntimeReplacement", "ModelCoreChamberWiring", "chamberWiring", "caseWiring", "officialCaseWiring", "workbenchWiring"] },
    { pattern: /official morphology|morphology pass/i, fields: ["officialMorphologyOutcome", "morphologyPass"] },
    { pattern: /septal coordinate|septal coupling|biventricular coupling/i, fields: ["septalCoordinateImplementation", "septalCouplingImplementation"] },
    { pattern: /RV pressure overload/i, fields: ["RVPressureOverloadCoverage"] },
    { pattern: /septal bowing/i, fields: ["septalBowingCoverage"] },
    { pattern: /ventricular interdependence/i, fields: ["ventricularInterdependenceCoverage"] },
    { pattern: /right[-\s]?heart failure/i, fields: ["rightHeartFailureCoverage"] },
    { pattern: /TriSeg adoption/i, fields: ["TriSegAdoption"] },
  ] as const;
  for (const required of requirements) {
    const windows = regexWindows(text, required.pattern, 160, 300);
    const hasStructuredNonClaim = required.fields.some((field) =>
      claimFieldIsNotClaimed(value, field),
    );
    if (
      !hasStructuredNonClaim
      && (windows.length === 0 || windows.every((window) => !NON_CLAIM_WINDOW_PATTERN.test(window)))
    ) {
      addIssue(issues, "error", "phase5a_non_coverage", label, `Missing explicit non-coverage/not-claimed statement for ${required.pattern.source}.`);
    }
  }
  if (
    !/triseg-lite-compatible/i.test(text)
    || !/full-triseg-compatible/i.test(text)
    || !/full TriSeg/i.test(text)
  ) {
    addIssue(issues, "error", "phase5a_future_triseg_path", label, "Missing future TriSeg escalation path.");
  }
}

function claimFieldIsNotClaimed(value: unknown, field: string): boolean {
  if (!isRecord(value)) return false;
  if (isRecord(value.claimExclusions) && value.claimExclusions[field] === "not-claimed") {
    return true;
  }
  if (isRecord(value.futureTriSegPath) && field === "TriSegAdoption" && value.futureTriSegPath.adoptionStatus === "not-claimed") {
    return true;
  }
  if (field === "sdirk2ReferenceCompletion" && value.sdirk2ReferenceCompletion === "deferred-to-phase5b") {
    return true;
  }
  if (field === "phase5Completion" && value.phaseCompletionStatus === "not-phase5-completion") {
    return true;
  }
  return false;
}

function validateDocs(file: TextFileInput, issues: ValidationIssue[]): void {
  if (!file.text.includes("verify:myocardium-local-monolithic-coupling-readiness")) {
    addIssue(issues, "error", "phase5a_docs_mention", file.path, "Docs must mention the Phase 5A local monolithic coupling verifier.");
  }
  if (!file.text.includes("Phase 5A is not Phase 5 completion")) {
    addIssue(issues, "error", "phase5a_docs_boundary", file.path, "Docs must state that Phase 5A is not Phase 5 completion.");
  }
  if (!/SDIRK2[^.]{0,160}Phase 5B|Phase 5B[^.]{0,160}SDIRK2/.test(file.text)) {
    addIssue(issues, "error", "phase5a_docs_sdirk2_boundary", file.path, "Docs must state that SDIRK2 reference completion is Phase 5B work.");
  }
}

function regexWindows(text: string, pattern: RegExp, before: number, after: number): string[] {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  const windows: string[] = [];
  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0;
    windows.push(text.slice(Math.max(0, index - before), Math.min(text.length, index + after)));
  }
  return windows;
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

function printReport(report: LocalMonolithicCouplingReadinessValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 5A local monolithic coupling readiness ${status} `
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
    "Usage: npm run verify:myocardium-local-monolithic-coupling-readiness -- [--root=DIR]",
    "",
    "Validates the Phase 5A local monolithic BE reference-readiness gate.",
    "This verifier rejects SDIRK2 reference completion, Phase 5 completion, production solver comparison, performance acceptance, active-stiffness production coupling, runtime/case/workbench leaks, morphology or robust no-alternans claims, septal/RV/interdependence/RHF coverage claims, TriSeg adoption, and Phase 4D hash drift.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateLocalMonolithicCouplingReadiness(
    loadLocalMonolithicCouplingReadinessValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
