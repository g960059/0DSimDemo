import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
  KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_V1_ID,
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
} from "@/engine/myocardium/kinematics";
import {
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM,
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY,
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE,
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID,
  runSelectedMechanicsCalibrationReadinessReport,
  type SelectedMechanicsCalibrationReadinessReport,
} from "@/engine/myocardium/protocols/selectedMechanicsCalibrationReadiness";

export const SELECTED_MECHANICS_CALIBRATION_PHASE4D_DESCRIPTOR_PATH =
  "data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json";
export const SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_SOURCE_PATH =
  "engine/myocardium/kinematics/thickSphereV2SelectedBackend.ts";
export const SELECTED_MECHANICS_CALIBRATION_PHASE4D_REPORT_SOURCE_PATH =
  "engine/myocardium/protocols/selectedMechanicsCalibrationReadiness.ts";

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

export type SelectedMechanicsCalibrationReadinessValidationInput = {
  readonly descriptor: unknown;
  readonly report: SelectedMechanicsCalibrationReadinessReport;
  readonly candidateFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly docs: readonly TextFileInput[];
};

export type SelectedMechanicsCalibrationReadinessValidationReport = {
  readonly pass: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly readinessSectionCount: number;
    readonly candidateFileCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly docCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const REQUIRED_OWNER_DECISION_IDS = [4, 5, 6, 8] as const;

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  "docs/myocardium/adr/ADR-MYO-001.md",
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json",
  "data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json",
  "data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json",
  "data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json",
  "data/myocardium/protocols/passive-energy-phase4c-protocols.json",
  "data/myocardium/protocols/generalized-force-mapper-phase4c-protocols.json",
] as const;

const REQUIRED_VERIFICATION_SCRIPTS = [
  "verify:myocardium-selected-mechanics-calibration-readiness",
  "verify:myocardium-generalized-force-mapper-readiness",
  "verify:myocardium-passive-energy-readiness",
  "verify:myocardium-tissue-homogenization-readiness",
  "verify:myocardium-land-active-stress-replacement",
  "verify:myocardium-mechanics-selection",
  "verify:myocardium-mechanics-decision",
] as const;

const REQUIRED_PROTOCOL_IDS = [
  "source-decision-boundary-v1",
  "selected-thick-sphere-v2-candidate-identity-v1",
  "lv-rv-geometry-closure-v1",
  "calibration-freedom-matrix-v1",
  "mechanics-composition-smoke-v1",
  "prior-gate-read-only-evidence-v1",
  "morphology-no-alternans-boundary-v1",
  "noncoverage-triseg-boundary-v1",
  "deterministic-replay-v1",
] as const;

const FORBIDDEN_NOT_CLAIMED_FIELDS = [
  "ownerAcceptance",
  "decision4Acceptance",
  "decision5Acceptance",
  "decision6Acceptance",
  "decision8Acceptance",
  "selectedBackendProductionCompletion",
  "productionRuntimeAcceptance",
  "productionMechanics",
  "productionHomogenization",
  "productionPassiveLaw",
  "productionValidation",
  "officialMorphologyOutcome",
  "robustNoAlternans",
  "calciumCyclingAlternansValidation",
  "liveRuntimeReplacement",
  "runtimeSchemaStateLayoutChange",
  "ModelCoreChamberWiring",
  "officialCaseWiring",
  "workbenchWiring",
  "septalCoordinateImplementation",
  "septalCouplingImplementation",
  "RVPressureOverloadCoverage",
  "septalBowingCoverage",
  "ventricularInterdependenceCoverage",
  "rightHeartFailureCoverage",
] as const;

const PHASE4D_RUNTIME_REFERENCE_TOKENS = [
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID,
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_DESCRIPTOR_PATH,
  "selected-mechanics-calibration-phase4d",
  "selectedMechanicsCalibrationReadiness",
  "thickSphereV2SelectedBackend",
  "ThickSphereV2SelectedBackend",
  "evaluateThickSphereV2SelectedBackend",
  "THICK_SPHERE_V2_SELECTED_BACKEND_ID",
  "THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID",
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
  KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useProductionMechanics|useProductionHomogenization|usePassiveLawAcceptance|useProductionPassiveLaw|useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|useOfficialMorphologyAcceptance|useProductionValidation|useRobustNoAlternansAcceptance|useCalciumCyclingAlternansValidation|implementSeptalCoordinate|implementBiventricularCoupling|validateSeptalCoupling|validateRVPressureOverload|validateVentricularInterdependence|validateRightHeartFailure|selectedBackendCompleted|productionExecutable|runtimeReplacement)["']?\s*[:=]\s*true/i;

const FORBIDDEN_EXACT_TOKEN_PATTERN =
  /\b(?:selectedBackendCompleted|productionExecutable|productionMechanicsPass|productionValidationPass|officialMorphologyPass|robustNoAlternansPass|calciumCyclingAlternansValidationPass|runtimeReplacement)\b/i;

const OVERCLAIM_PATTERN =
  /\b(?:(?:selected\s+(?:v2|thick-sphere-v2|backend|mechanics)[^.!?\n]{0,100}(?:completed|complete|production[-\s]?wired|runtime[-\s]?wired|production executable|production ready))|(?:(?:production mechanics|production validation|official morphology|robust no[-\s]?alternans|calcium[-\s]?cycling alternans|septal coordinate|septal coupling|biventricular coupling|RV pressure overload|septal bowing|ventricular interdependence|right[-\s]?heart failure)[^.!?\n]{0,120}\b(?:pass(?:ed)?|accepted|validated|implemented|covered|claimed|wired|complete|production)))\b/i;

const NON_CLAIM_WINDOW_PATTERN =
  /not[-\s]claimed|not\s+claimed|not[-\s]implemented|not\s+implemented|not\s+covered|non[-\s]coverage|without|no[^.!?\n]{0,120}(?:claim|coverage|wiring|implementation|validation)|must\s+not|does\s+not|read-only|future|before[^.!?\n]{0,120}(?:claimed|covered)/i;

const CURRENT_SPIKE_EXECUTABLE_PATTERN =
  /current\s+selected[^.!?\n]{0,120}(?:executable|backend|candidate)[^.!?\n]{0,120}thick-sphere-spike-v1|thick-sphere-spike-v1[^.!?\n]{0,120}current\s+selected[^.!?\n]{0,120}(?:executable|backend|candidate)/i;

const SPIKE_ALIAS_SOURCE_PATTERN =
  /\b(?:ThickSphereSpikeV1|evaluateThickSphereSpikeV1|THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET(?:_ID)?|computeThickSphereSpikeParameterSetStableHash)\b|export\s+\{[^}]*\}\s+from\s+["'][^"']*thickSphereSpikeV1|=\s*THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET/i;

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

export function loadSelectedMechanicsCalibrationReadinessValidationInput(
  rootDir = process.cwd(),
): SelectedMechanicsCalibrationReadinessValidationInput {
  return {
    descriptor: readJson(path.join(rootDir, SELECTED_MECHANICS_CALIBRATION_PHASE4D_DESCRIPTOR_PATH)),
    report: runSelectedMechanicsCalibrationReadinessReport(),
    candidateFiles: [
      readTextFile(rootDir, SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_SOURCE_PATH),
      readTextFile(rootDir, SELECTED_MECHANICS_CALIBRATION_PHASE4D_REPORT_SOURCE_PATH),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    docs: [
      readTextFile(rootDir, "README.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
    ],
  };
}

export function validateSelectedMechanicsCalibrationReadiness(
  input: SelectedMechanicsCalibrationReadinessValidationInput,
): SelectedMechanicsCalibrationReadinessValidationReport {
  const issues: ValidationIssue[] = [];

  validateReadinessReport(input.report, issues);
  validateDescriptor(input.descriptor, issues);
  validateCandidateSourceFiles(input.candidateFiles, issues);
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
      candidateFileCount: input.candidateFiles.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      docCount: input.docs.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function validateReadinessReport(
  report: SelectedMechanicsCalibrationReadinessReport,
  issues: ValidationIssue[],
): void {
  if (report.protocolSetId !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID) {
    addIssue(issues, "error", "phase4d_report_identity", "report.protocolSetId", "Unexpected Phase 4D report id.");
  }
  if (
    report.phase !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE
    || report.claimBoundary !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY
    || report.selectedThickSphereV2CalibrationCandidateExecutableStatus
      !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM
  ) {
    addIssue(issues, "error", "phase4d_report_boundary", "report.claimBoundary", "Report must remain a Phase 4D selected-mechanics calibration-readiness candidate gate.");
  }
  if (
    report.ownerAcceptanceStatus !== "not-owner-acceptance"
    || report.decision4Status !== "PENDING OWNER"
    || report.decision5Status !== "PENDING OWNER"
    || report.decision6Status !== "PENDING OWNER"
    || report.decision8Status !== "PENDING OWNER"
    || report.decision19Status !== "ACCEPTED"
    || report.decision19ReuseStatus !== "accepted-owner-selection-read-only"
    || report.phase4AFrozenStatus !== "frozen-read-only"
  ) {
    addIssue(issues, "error", "phase4d_decision_boundary", "report.decision19Status", "Decisions 4, 5, 6, and 8 must remain PENDING OWNER; Decision 19 and Phase 4A must be read-only evidence.");
  }
  if (!report.readinessPass || report.readinessStatus !== "calibration-readiness-ready") {
    addIssue(issues, "error", "phase4d_readiness_sections", "report.readinessPass", "Readiness report must pass all sections.");
  }
  if (report.sections.length !== REQUIRED_PROTOCOL_IDS.length) {
    addIssue(issues, "error", "phase4d_readiness_sections", "report.sections", "Expected nine Phase 4D readiness sections.");
  }
  for (const id of REQUIRED_PROTOCOL_IDS) {
    const section = report.sections.find((candidate) => candidate.id === id);
    if (!section || section.status !== "readiness-pass") {
      addIssue(issues, "error", "phase4d_readiness_sections", `report.sections.${id}`, `${id} did not pass.`);
    }
  }
  if (
    report.selectedThickSphereV2CalibrationCandidate.backendId !== THICK_SPHERE_V2_SELECTED_BACKEND_ID
    || report.selectedThickSphereV2CalibrationCandidate.candidateId
      !== THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
    || report.selectedThickSphereV2CalibrationCandidate.productionCompletionStatus !== "not-claimed"
    || report.selectedThickSphereV2CalibrationCandidate.runtimeWiringStatus !== "not-runtime-wired"
    || report.selectedThickSphereV2CalibrationCandidate.phase3SpikeAliasStatus !== "not-an-alias"
  ) {
    addIssue(issues, "error", "phase4d_candidate_identity", "report.selectedThickSphereV2CalibrationCandidate", "Selected thick-sphere-v2 candidate identity or boundary is invalid.");
  }
  validateGeometryClosure(report, issues);
  validateCalibrationFreedomMatrix(report, issues);
  validateMechanicsCompositionSmoke(report, issues);
  validatePriorGateEvidence(report, issues);
  validateMorphologyNoAlternansBoundary(report, issues);
  validateExternalSeptalBoundary(report.externalSeptalCouplingBoundary, "report.externalSeptalCouplingBoundary", issues);
  validateRequiredScripts(report.requiredVerificationScripts, "report.requiredVerificationScripts", issues);
}

function validateGeometryClosure(
  report: SelectedMechanicsCalibrationReadinessReport,
  issues: ValidationIssue[],
): void {
  const geometry = report.geometryClosure;
  if (
    geometry.backendId !== THICK_SPHERE_V2_SELECTED_BACKEND_ID
    || geometry.selectedCandidateId !== THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
    || geometry.lvParameterSetId !== KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID
    || geometry.rvParameterSetId !== KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID
    || geometry.phase3SpikeParameterSetId !== THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID
    || geometry.lvParameterSetStableHash === THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash
    || geometry.rvParameterSetStableHash === THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash
    || geometry.candidateStableHash !== THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.candidateStableHash
    || !geometry.idsDistinctFromPhase3Spike
    || !geometry.hashesDistinctFromPhase3Spike
    || !geometry.candidateStableHashRecomputes
    || !geometry.parameterHashesRecompute
    || geometry.samples.length < 6
    || geometry.finiteDifferenceSamples.length < 4
    || !geometry.finiteStrain
    || !geometry.allSamplesInCalibrationDomain
    || !geometry.analyticDerivativeMatchesFiniteDifference
    || !geometry.pass
  ) {
    addIssue(issues, "error", "phase4d_geometry_closure", "report.geometryClosure", "LV/RV v2 geometry closure must use v2-owned ids/hashes, finite in-domain strain, and finite-difference derivative agreement.");
  }
}

function validateCalibrationFreedomMatrix(
  report: SelectedMechanicsCalibrationReadinessReport,
  issues: ValidationIssue[],
): void {
  const matrix = report.calibrationFreedomMatrix;
  if (
    matrix.fixedLandSourceTref !== true
    || matrix.allowFreeHomogenizationGain !== false
    || matrix.allowFreePressureGain !== false
    || matrix.allowFreeGeometryGain !== false
    || matrix.targetPacksRole !== "measurement-hooks-only"
    || matrix.targetPackAcceptanceStatus !== "not-claimed"
    || !matrix.landSourceParameterSetStableHash
    || !matrix.pass
  ) {
    addIssue(issues, "error", "phase4d_calibration_freedom", "report.calibrationFreedomMatrix", "Calibration freedom matrix must fix Land Tref and forbid free homogenization, pressure, or geometry gain.");
  }
}

function validateMechanicsCompositionSmoke(
  report: SelectedMechanicsCalibrationReadinessReport,
  issues: ValidationIssue[],
): void {
  const smoke = report.mechanicsCompositionSmoke;
  if (
    !smoke.pass
    || !smoke.allSamplesFinite
    || !smoke.allPressureMapsFinite
    || smoke.maxVirtualPowerResidualAbsW > smoke.virtualPowerResidualToleranceW
    || smoke.samples.length < 2
    || !smoke.samples.every((sample) =>
      sample.mapperModelId === "virtual-power-generalized-force-v1"
      && sample.passiveModelId === "passive-exponential-energy-v1"
      && sample.coordinateUnit === "m3"
      && sample.pressureMapFinite
      && Number.isFinite(sample.pressureMapPa)
      && Number.isFinite(sample.virtualPowerResidualW)
    )
  ) {
    addIssue(issues, "error", "phase4d_mechanics_smoke", "report.mechanicsCompositionSmoke", "Mechanics composition smoke must combine Land-style active stress, Phase 4C-A passive output, and Phase 4C-B mapper with finite m3 pressure maps and virtual-power closure.");
  }
}

function validatePriorGateEvidence(
  report: SelectedMechanicsCalibrationReadinessReport,
  issues: ValidationIssue[],
): void {
  const prior = report.priorGateEvidence;
  if (
    !prior.phase4BAReadinessPass
    || !prior.phase4BBReadinessPass
    || !prior.phase4CAReadinessPass
    || !prior.phase4CBReadinessPass
    || !prior.phase4BAStableSummaryHash
    || !prior.phase4BBStableSummaryHash
    || !prior.phase4CAStableSummaryHash
    || !prior.phase4CBStableSummaryHash
    || prior.phase4BAExecutableKinematicsModelId !== THICK_SPHERE_SPIKE_V1_ID
    || report.frozenPhase4BAExecutableEvidence.reusePolicy !== "read-only"
    || report.frozenPhase4BAExecutableEvidence.executableKinematicsModelId !== THICK_SPHERE_SPIKE_V1_ID
    || report.frozenPhase4BAExecutableEvidence.selectedThickSphereV2CandidateCurrentExecutableStatus
      !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM
  ) {
    addIssue(issues, "error", "phase4d_prior_gate_evidence", "report.priorGateEvidence", "Phase 4B-A, 4B-B, 4C-A, and 4C-B must remain passing and hash-backed; Phase 4B-A thick-sphere-spike-v1 must be frozen prior evidence only.");
  }
}

function validateMorphologyNoAlternansBoundary(
  report: SelectedMechanicsCalibrationReadinessReport,
  issues: ValidationIssue[],
): void {
  const boundary = report.morphologyNoAlternansBoundary;
  if (
    boundary.measurementHooksStatus !== "present-hooks-only"
    || boundary.measurementHooks.length === 0
    || boundary.phase4BABeatStabilityReusePolicy !== "read-only"
    || boundary.phase4BABeatStabilitySmokeReady !== true
    || boundary.phase4BANotCalciumCyclingValidation !== true
    || boundary.officialMorphologyOutcome !== "not-claimed"
    || boundary.robustNoAlternans !== "not-claimed"
    || boundary.calciumCyclingAlternansValidation !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase4d_morphology_boundary", "report.morphologyNoAlternansBoundary", "Morphology/no-alternans boundary must expose hooks only and reuse Phase 4B-A beat-stability smoke read-only.");
  }
}

function validateDescriptor(descriptor: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(descriptor)) {
    addIssue(issues, "error", "phase4d_descriptor_shape", "descriptor", "Descriptor must be an object.");
    return;
  }
  if (
    descriptor.protocolSetId !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID
    || descriptor.phase !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE
    || descriptor.statusBoundary !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY
    || descriptor.claimBoundary !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY
    || descriptor.selectedThickSphereV2CalibrationCandidateExecutableStatus
      !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM
  ) {
    addIssue(issues, "error", "phase4d_descriptor_boundary", "descriptor.claimBoundary", "Descriptor must remain selected-mechanics calibration-readiness only.");
  }
  if (
    descriptor.ownerAcceptanceStatus !== "not-owner-acceptance"
    || descriptor.decision4Status !== "PENDING OWNER"
    || descriptor.decision5Status !== "PENDING OWNER"
    || descriptor.decision6Status !== "PENDING OWNER"
    || descriptor.decision8Status !== "PENDING OWNER"
    || descriptor.decision19Status !== "ACCEPTED"
    || descriptor.decision19ReuseStatus !== "accepted-owner-selection-read-only"
    || descriptor.phase4AFrozenStatus !== "frozen-read-only"
  ) {
    addIssue(issues, "error", "phase4d_decision_boundary", "descriptor.decision19Status", "Descriptor must leave Decisions 4, 5, 6, and 8 PENDING OWNER and reuse Decision 19/Phase 4A read-only.");
  }
  validatePendingOwnerDecisions(descriptor.pendingOwnerDecisions, issues);
  validateAcceptedOwnerDecisionEvidence(descriptor.acceptedOwnerDecisionEvidence, issues);
  validateDirectSourceDocuments(descriptor.sourceDocuments, issues);
  validateDescriptorCandidate(descriptor.selectedThickSphereV2CalibrationCandidate, issues);
  validateDescriptorFrozenPhase4BAEvidence(descriptor.frozenPhase4BAEvidence, issues);
  validateDescriptorCalibrationFreedom(descriptor.calibrationFreedomMatrix, descriptor.protocolSettings, issues);
  validateProtocolSettings(descriptor.protocolSettings, issues);
  validateExternalSeptalBoundary(descriptor.externalSeptalCouplingBoundary, "descriptor.externalSeptalCouplingBoundary", issues);
  validateDescriptorMorphologyBoundary(descriptor.morphologyNoAlternansBoundary, issues);
  validateRequiredScripts(readonlyStrings(descriptor.requiredVerificationScripts), "descriptor.requiredVerificationScripts", issues);
  validateProtocolIds(descriptor.protocols, issues);
}

function validatePendingOwnerDecisions(value: unknown, issues: ValidationIssue[]): void {
  const decisions = records(value);
  for (const decisionId of REQUIRED_OWNER_DECISION_IDS) {
    const decision = decisions.find((candidate) => candidate.decisionId === decisionId);
    if (decision?.status !== "PENDING OWNER") {
      addIssue(issues, "error", "phase4d_decision_boundary", `descriptor.pendingOwnerDecisions.${decisionId}`, `Decision ${decisionId} must remain PENDING OWNER.`);
    }
  }
}

function validateAcceptedOwnerDecisionEvidence(value: unknown, issues: ValidationIssue[]): void {
  const decisions = records(value);
  const decision19 = decisions.find((candidate) => candidate.decisionId === 19);
  if (
    decision19?.status !== "ACCEPTED"
    || decision19?.selectedCandidateId !== THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
    || decision19?.selectedBackend !== THICK_SPHERE_V2_SELECTED_BACKEND_ID
    || decision19?.reusePolicy !== "read-only"
    || decision19?.sourcePath !== "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json"
  ) {
    addIssue(issues, "error", "phase4d_decision19_reuse", "descriptor.acceptedOwnerDecisionEvidence.19", "Descriptor must reuse accepted Decision 19 read-only.");
  }
}

function validateDirectSourceDocuments(value: unknown, issues: ValidationIssue[]): void {
  const sourcePaths = records(value).map((source) => stringField(source, "path")).filter(Boolean);
  for (const requiredPath of REQUIRED_DESCRIPTOR_SOURCE_PATHS) {
    if (!sourcePaths.includes(requiredPath)) {
      addIssue(issues, "error", "phase4d_direct_provenance", "descriptor.sourceDocuments", `Descriptor must directly reference ${requiredPath}.`);
    }
  }
}

function validateDescriptorCandidate(value: unknown, issues: ValidationIssue[]): void {
  const candidate = isRecord(value) ? value : {};
  const parameterSetIds = readonlyStrings(candidate.parameterSetIds);
  if (
    candidate.backendId !== THICK_SPHERE_V2_SELECTED_BACKEND_ID
    || candidate.candidateId !== THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
    || candidate.executableClaim !== SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM
    || !parameterSetIds.includes(KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID)
    || !parameterSetIds.includes(KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID)
    || parameterSetIds.includes(THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID)
    || candidate.phase3SpikeAliasPolicy !== "forbidden"
    || candidate.productionCompletionStatus !== "not-claimed"
    || candidate.runtimeWiringStatus !== "not-runtime-wired"
  ) {
    addIssue(issues, "error", "phase4d_candidate_identity", "descriptor.selectedThickSphereV2CalibrationCandidate", "Descriptor candidate must identify v2-owned LV/RV parameter sets and forbid Phase 3 spike aliasing.");
  }
}

function validateDescriptorFrozenPhase4BAEvidence(value: unknown, issues: ValidationIssue[]): void {
  const evidence = isRecord(value) ? value : {};
  if (
    evidence.reusePolicy !== "read-only"
    || evidence.phase4BAExecutablePathStatus !== "frozen-prior-evidence-only"
    || evidence.phase4BAExecutableKinematicsModelId !== THICK_SPHERE_SPIKE_V1_ID
  ) {
    addIssue(issues, "error", "phase4d_frozen_phase4ba_evidence", "descriptor.frozenPhase4BAEvidence", "Descriptor must preserve Phase 4B-A thick-sphere-spike-v1 as frozen prior evidence only.");
  }
}

function validateDescriptorCalibrationFreedom(
  matrixValue: unknown,
  settingsValue: unknown,
  issues: ValidationIssue[],
): void {
  const matrix = isRecord(matrixValue) ? matrixValue : {};
  const tref = isRecord(matrix.landSourceTref) ? matrix.landSourceTref : {};
  const homogenization = isRecord(matrix.homogenizationGain) ? matrix.homogenizationGain : {};
  const pressureGeometry = isRecord(matrix.pressureGeometryGain) ? matrix.pressureGeometryGain : {};
  const targetPacks = isRecord(matrix.targetPacks) ? matrix.targetPacks : {};
  const settings = isRecord(settingsValue) ? settingsValue : {};
  if (
    tref.parameterSetId !== "land2017-intact-human-37c-source-v1"
    || tref.sourceParameter !== "Tref"
    || tref.freedom !== "fixed-source-parameter"
    || homogenization.allowFreeGain !== false
    || pressureGeometry.allowFreePressureGain !== false
    || pressureGeometry.allowFreeGeometryGain !== false
    || targetPacks.role !== "measurement-hooks-only"
    || targetPacks.acceptanceStatus !== "not-claimed"
    || settings.allowFreeHomogenizationGain !== false
    || settings.allowFreePressureGain !== false
    || settings.allowFreeGeometryGain !== false
    || settings.useTargetPackAcceptance !== false
    || settings.exposeMeasurementHooksOnly !== true
  ) {
    addIssue(issues, "error", "phase4d_calibration_freedom", "descriptor.calibrationFreedomMatrix", "Descriptor must fix Land Tref and forbid free gains with target packs as hooks only.");
  }
}

function validateProtocolSettings(value: unknown, issues: ValidationIssue[]): void {
  const settings = isRecord(value) ? value : {};
  const falseFields = [
    "useProductionMechanics",
    "useProductionHomogenization",
    "usePassiveLawAcceptance",
    "useProductionPassiveLaw",
    "useRuntimeReplacement",
    "useModelCoreRuntimeWiring",
    "useChamberRuntimeWiring",
    "useStateSchemaWiring",
    "useOfficialCaseWiring",
    "useWorkbenchRuntimeWiring",
    "useOfficialMorphologyAcceptance",
    "useProductionValidation",
    "useRobustNoAlternansAcceptance",
    "useCalciumCyclingAlternansValidation",
    "allowFreeHomogenizationGain",
    "allowFreePressureGain",
    "allowFreeGeometryGain",
    "useTargetPackAcceptance",
    "implementSeptalCoordinate",
    "implementBiventricularCoupling",
    "validateSeptalCoupling",
    "validateRVPressureOverload",
    "validateVentricularInterdependence",
    "validateRightHeartFailure",
  ] as const;
  for (const field of falseFields) {
    if (settings[field] !== false) {
      addIssue(issues, "error", "phase4d_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain false.`);
    }
  }
  if (
    settings.evaluateSelectedThickSphereV2CalibrationCandidate !== true
    || settings.exposeMeasurementHooksOnly !== true
  ) {
    addIssue(issues, "error", "phase4d_protocol_settings", "descriptor.protocolSettings.evaluateSelectedThickSphereV2CalibrationCandidate", "Candidate evaluation and measurement-hook-only settings must be explicit.");
  }
  for (const field of ["phase4AReusePolicy", "phase4BAReusePolicy", "phase4BBReusePolicy", "phase4CAReusePolicy", "phase4CBReusePolicy"] as const) {
    if (settings[field] !== "read-only") {
      addIssue(issues, "error", "phase4d_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain read-only.`);
    }
  }
}

function validateDescriptorMorphologyBoundary(value: unknown, issues: ValidationIssue[]): void {
  const boundary = isRecord(value) ? value : {};
  if (
    boundary.measurementHooksStatus !== "present-hooks-only"
    || boundary.phase4BABeatStabilityReusePolicy !== "read-only"
    || boundary.officialMorphologyOutcome !== "not-claimed"
    || boundary.robustNoAlternans !== "not-claimed"
    || boundary.calciumCyclingAlternansValidation !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase4d_morphology_boundary", "descriptor.morphologyNoAlternansBoundary", "Descriptor morphology/no-alternans boundary must remain hooks-only and not-claimed.");
  }
}

function validateExternalSeptalBoundary(
  value: unknown,
  issuePath: string,
  issues: ValidationIssue[],
): void {
  const boundary = isRecord(value) ? value : {};
  if (
    boundary.interfaceStatus !== "interface-and-provenance-only"
    || boundary.implementationStatus !== "not-implemented"
    || boundary.validationStatus !== "not-claimed"
    || boundary.septalCoordinateStatus !== "not-implemented"
    || boundary.biventricularCouplingStatus !== "not-implemented"
    || boundary.rvPressureOverloadStatus !== "not-claimed"
    || boundary.septalBowingStatus !== "not-claimed"
    || boundary.ventricularInterdependenceStatus !== "not-claimed"
    || boundary.rightHeartFailureStatus !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase4d_external_septal_boundary", issuePath, "External septal coupling must remain interface/provenance only with no implementation or validation claim.");
  }
}

function validateRequiredScripts(
  scripts: readonly string[],
  issuePath: string,
  issues: ValidationIssue[],
): void {
  for (const requiredScript of REQUIRED_VERIFICATION_SCRIPTS) {
    if (!scripts.includes(requiredScript)) {
      addIssue(issues, "error", "phase4d_required_scripts", issuePath, `Missing required verifier ${requiredScript}.`);
    }
  }
}

function validateProtocolIds(value: unknown, issues: ValidationIssue[]): void {
  const protocolIds = records(value).map((protocol) => stringField(protocol, "id"));
  for (const requiredId of REQUIRED_PROTOCOL_IDS) {
    if (!protocolIds.includes(requiredId)) {
      addIssue(issues, "error", "phase4d_readiness_sections", "descriptor.protocols", `Descriptor protocol list must include ${requiredId}.`);
    }
  }
}

function validateCandidateSourceFiles(
  candidateFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  const backend = candidateFiles.find(
    (file) => file.path === SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_SOURCE_PATH,
  );
  const reportSource = candidateFiles.find(
    (file) => file.path === SELECTED_MECHANICS_CALIBRATION_PHASE4D_REPORT_SOURCE_PATH,
  );
  if (!backend) {
    addIssue(issues, "error", "phase4d_candidate_source", SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_SOURCE_PATH, "Selected thick-sphere-v2 candidate source is missing from validation input.");
    return;
  }
  if (!reportSource) {
    addIssue(issues, "error", "phase4d_candidate_source", SELECTED_MECHANICS_CALIBRATION_PHASE4D_REPORT_SOURCE_PATH, "Phase 4D selected-mechanics readiness report source is missing from validation input.");
  }
  if (SPIKE_ALIAS_SOURCE_PATTERN.test(stripStringLiteralsForAliasScan(backend.text))) {
    addIssue(issues, "error", "phase4d_spike_alias", backend.path, "Selected v2 candidate source must not alias, re-export, or identify itself with ThickSphereSpikeV1 or the Phase 3 parameter set.");
  }
  for (const token of [
    THICK_SPHERE_V2_SELECTED_BACKEND_ID,
    THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    "parameterSetStableHash",
    "candidateStableHash",
    "interface-and-provenance-only",
    "not-implemented",
  ] as const) {
    if (!backend.text.includes(token)) {
      addIssue(issues, "error", "phase4d_candidate_source", backend.path, `Candidate source must include ${token}.`);
    }
  }
}

function stripStringLiteralsForAliasScan(text: string): string {
  return text
    .replace(/"([^"\\]|\\.)*"/g, "\"\"")
    .replace(/'([^'\\]|\\.)*'/g, "''")
    .replace(/`([^`\\]|\\.)*`/g, "``");
}

function validateForbiddenClaims(
  label: string,
  value: unknown,
  issues: ValidationIssue[],
): void {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (FORBIDDEN_EXACT_TOKEN_PATTERN.test(text)) {
    addIssue(issues, "error", "phase4d_forbidden_claim", label, "Forbidden selected-backend-completed, production executable/pass, runtime replacement, morphology pass, or no-alternans pass token detected.");
  }
  for (const window of regexWindows(text, OVERCLAIM_PATTERN, 180, 260)) {
    if (!NON_CLAIM_WINDOW_PATTERN.test(window)) {
      addIssue(issues, "error", "phase4d_overclaim", label, "Production/runtime/morphology/no-alternans/septal/RV/interdependence coverage overclaim detected.");
      break;
    }
  }
  for (const window of regexWindows(text, CURRENT_SPIKE_EXECUTABLE_PATTERN, 180, 260)) {
    if (!NON_CLAIM_WINDOW_PATTERN.test(window)) {
      addIssue(issues, "error", "phase4d_current_spike_executable", label, "thick-sphere-spike-v1 must not be claimed as the current selected thick-sphere-v2 candidate executable.");
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
    if (key === "ownerAcceptanceStatus" && nestedValue !== "not-owner-acceptance") {
      addIssue(issues, "error", "phase4d_forbidden_claim", issuePath, "Owner acceptance must not be claimed in Phase 4D.");
    }
    if (
      (key === "decision4Status"
        || key === "decision5Status"
        || key === "decision6Status"
        || key === "decision8Status")
      && nestedValue !== "PENDING OWNER"
    ) {
      addIssue(issues, "error", "phase4d_decision_boundary", issuePath, `${key} must remain PENDING OWNER.`);
    }
    if (
      FORBIDDEN_NOT_CLAIMED_FIELDS.includes(key as typeof FORBIDDEN_NOT_CLAIMED_FIELDS[number])
      && nestedValue !== "not-claimed"
    ) {
      addIssue(issues, "error", "phase4d_forbidden_claim", issuePath, `${key} must remain not-claimed.`);
    }
    if (
      /(?:implement|implementation|validated|validation|coverage|wiring|acceptance|production|completion|robustNoAlternans|calciumCyclingAlternans)/i.test(key)
      && typeof nestedValue === "boolean"
      && nestedValue === true
      && !allowedTrueField(key)
    ) {
      addIssue(issues, "error", "phase4d_forbidden_claim", issuePath, `${key} must not be true in Phase 4D.`);
    }
    scanForbiddenClaimFields(label, nestedValue, issues, issuePath);
  }
}

function allowedTrueField(key: string): boolean {
  return [
    "readinessPass",
    "pass",
    "finiteStrain",
    "allSamplesInCalibrationDomain",
    "analyticDerivativeMatchesFiniteDifference",
    "idsDistinctFromPhase3Spike",
    "hashesDistinctFromPhase3Spike",
    "candidateStableHashRecomputes",
    "parameterHashesRecompute",
    "fixedLandSourceTref",
    "allPressureMapsFinite",
    "allSamplesFinite",
    "phase4BAReadinessPass",
    "phase4BBReadinessPass",
    "phase4CAReadinessPass",
    "phase4CBReadinessPass",
    "phase4BABeatStabilitySmokeReady",
    "phase4BANotCalciumCyclingValidation",
    "decision19AcceptedReadOnly",
    "phase4ADossierFrozenReadOnly",
    "sourceRefsComplete",
  ].includes(key);
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of PHASE4D_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "phase4d_runtime_leak", file.path, `Runtime/official-case/workbench file must not reference Phase 4D token ${token}.`);
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(issues, "error", "phase4d_runtime_leak", file.path, "Runtime/official-case/workbench file must not enable production mechanics, runtime replacement, morphology/no-alternans validation, or septal/RV/interdependence validation.");
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
    {
      pattern: /production selected-backend completion|production mechanics|production validation/i,
      fields: ["selectedBackendProductionCompletion", "productionMechanics", "productionValidation"],
    },
    {
      pattern: /runtime replacement|ModelCore|chamber wiring|official-case wiring|workbench wiring/i,
      fields: ["liveRuntimeReplacement", "ModelCoreChamberWiring", "officialCaseWiring", "workbenchWiring"],
    },
    { pattern: /official morphology/i, fields: ["officialMorphologyOutcome"] },
    {
      pattern: /robust[^.!?\n]{0,60}no[-\s]?alternans|calcium[-\s]?cycling alternans/i,
      fields: ["robustNoAlternans", "calciumCyclingAlternansValidation"],
    },
    {
      pattern: /septal coordinate|septal coupling|biventricular coupling/i,
      fields: ["septalCoordinateImplementation", "septalCouplingImplementation"],
    },
    { pattern: /RV pressure overload/i, fields: ["RVPressureOverloadCoverage"] },
    { pattern: /septal bowing/i, fields: ["septalBowingCoverage"] },
    { pattern: /ventricular interdependence/i, fields: ["ventricularInterdependenceCoverage"] },
    { pattern: /right[-\s]?heart failure/i, fields: ["rightHeartFailureCoverage"] },
  ] as const;
  for (const required of requirements) {
    const windows = regexWindows(text, required.pattern, 160, 280);
    const hasStructuredNonClaim = required.fields.some((field) =>
      claimFieldIsNotClaimed(value, field),
    );
    if (
      !hasStructuredNonClaim
      && (windows.length === 0 || windows.every((window) => !NON_CLAIM_WINDOW_PATTERN.test(window)))
    ) {
      addIssue(issues, "error", "phase4d_non_coverage", label, `Missing explicit non-coverage/not-claimed statement for ${required.pattern.source}.`);
    }
  }
  if (
    !/triseg-lite-compatible/i.test(text)
    || !/full-triseg-compatible/i.test(text)
    || !/full TriSeg/i.test(text)
  ) {
    addIssue(issues, "error", "phase4d_future_triseg_path", label, "Missing future TriSeg escalation path.");
  }
}

function claimFieldIsNotClaimed(value: unknown, field: string): boolean {
  if (!isRecord(value)) return false;
  if (isRecord(value.claimExclusions) && value.claimExclusions[field] === "not-claimed") {
    return true;
  }
  if (
    isRecord(value.morphologyNoAlternansBoundary)
    && value.morphologyNoAlternansBoundary[field] === "not-claimed"
  ) {
    return true;
  }
  if (
    isRecord(value.externalSeptalCouplingBoundary)
    && (
      value.externalSeptalCouplingBoundary[field] === "not-claimed"
      || value.externalSeptalCouplingBoundary[field] === "not-implemented"
    )
  ) {
    return true;
  }
  return false;
}

function validateDocs(file: TextFileInput, issues: ValidationIssue[]): void {
  if (!file.text.includes("verify:myocardium-selected-mechanics-calibration-readiness")) {
    addIssue(issues, "error", "phase4d_docs_mention", file.path, "Docs must mention the Phase 4D selected-mechanics calibration-readiness verifier.");
  }
  if (!file.text.includes("selected-mechanics-calibration-readiness-only")) {
    addIssue(issues, "error", "phase4d_docs_boundary", file.path, "Docs must mention the Phase 4D selected-mechanics-calibration-readiness-only boundary.");
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

function printReport(report: SelectedMechanicsCalibrationReadinessValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 4D selected-mechanics calibration readiness ${status} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `sections=${report.summary.readinessSectionCount} `
    + `candidateFiles=${report.summary.candidateFileCount} `
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
    "Usage: npm run verify:myocardium-selected-mechanics-calibration-readiness -- [--root=DIR]",
    "",
    "Validates the Phase 4D selected-mechanics calibration-readiness gate.",
    "This verifier rejects Phase 3 spike aliasing as v2 identity, thick-sphere-spike-v1 as a current selected candidate executable, production/runtime wiring or pass claims, owner acceptance for Decisions 4/5/6/8, production passive/homogenization acceptance, official morphology or robust no-alternans claims, septal/RV/interdependence/RHF coverage claims, missing prior hashes, missing future TriSeg path, and runtime/case/workbench leaks.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateSelectedMechanicsCalibrationReadiness(
    loadSelectedMechanicsCalibrationReadinessValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
