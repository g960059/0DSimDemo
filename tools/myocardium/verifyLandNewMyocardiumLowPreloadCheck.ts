import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import protocolDescriptor from "@/data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-protocols.json";
import {
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY,
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE,
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID,
  PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID,
  runLandNewMyocardiumLowPreloadCheckReport,
  type LandNewMyocardiumGeneratedRun,
  type LandNewMyocardiumLowPreloadCheckReport,
} from "@/engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck";
import { LAND_SHADOW_FIXED_LEGACY_PROTOCOL, type LandShadowLegacyProtocolEvidence, type LandShadowPolicyDescriptor } from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { runLowPreloadDebug } from "@/tools/debugStarlingLowPreload";

export const LAND_NEW_MYOCARDIUM_PHASE5C_C_PROTOCOL_DESCRIPTOR_PATH =
  "data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-protocols.json";
export const LAND_NEW_MYOCARDIUM_PHASE5C_C_ALTERNANS_POLICY_PATH =
  "data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json";
export const LAND_NEW_MYOCARDIUM_PHASE5C_C_REPORT_SOURCE_PATH =
  "engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck.ts";
export const LAND_NEW_MYOCARDIUM_PHASE5C_C_VERIFIER_SOURCE_PATH =
  "tools/myocardium/verifyLandNewMyocardiumLowPreloadCheck.ts";
export const LAND_NEW_MYOCARDIUM_PHASE5C_D_FIDELITY_AUDIT_PLAN_PATH =
  "docs/myocardium/roadmap/phase5c-positive-control-fidelity-audit-plan.md";

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

export type LandNewMyocardiumLowPreloadValidationInput = {
  readonly descriptor: unknown;
  readonly alternansPolicyDescriptor: unknown;
  readonly report: LandNewMyocardiumLowPreloadCheckReport;
  readonly sourceFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
};

export type LandNewMyocardiumLowPreloadValidationReport = {
  readonly pass: boolean;
  readonly artifactGatePass: boolean;
  readonly artifactGateStatus: LandNewMyocardiumLowPreloadCheckReport["readinessStatus"];
  readonly artifactGateFindings: readonly string[];
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly summary: {
    readonly readinessSectionCount: number;
    readonly sourceFileCount: number;
    readonly runtimeIntegrationFileCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
  };
};

type JsonRecord = Record<string, unknown>;

const REQUIRED_SECTION_IDS = [
  "phase5c-c-boundary-v1",
  "legacy-reproduction-read-only-pin-v1",
  "same-closure-source-provider-difference-v1",
  "legacy-activeStress-positive-control-v1",
  "land-generated-trajectory-v1",
  "report-only-morphology-v1",
  "policy-unsatisfied-boundary-v1",
  "phase5a-phase5b-read-only-pins-v1",
  "runtime-isolation-v1",
  "deterministic-report-v1",
] as const;

const REQUIRED_MORPHOLOGY_METRICS = [
  "fwhmMs",
  "timeToPeakMs",
  "relaxationTauMs",
  "caToStressPeakDelayMs",
  "peakStressPa",
  "strokeWorkJ",
  "lvpPeak",
  "lvpMin",
  "aopPeak",
  "aopMean",
  "lvpAopPeakGap",
  "lvpAopPeakLagMs",
  "ejectionDurationMs",
  "qAoForwardVolumeMl",
  "qAoReverseVolumeMl",
  "qAoPeak",
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

const PHASE5C_C_RUNTIME_REFERENCE_TOKENS = [
  LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID,
  PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID,
  "landNewMyocardiumLowPreloadCheck",
  "runLandNewMyocardiumLowPreloadCheckReport",
  "verify:myocardium-land-new-myocardium-low-preload-check",
  "Phase 5C-C",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useCaseRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|useOfficialMorphologyAcceptance|useRobustNoAlternansAcceptance|useCalciumCyclingAlternansValidation|implementSeptalCoordinate|implementBiventricularCoupling|validateSeptalCoupling|validateRVPressureOverload|validateVentricularInterdependence|validateRightHeartFailure|adoptTriSeg|phase5Completed|runtimeReplacement|officialMorphologyPass|robustNoAlternans|finalNoAlternans)["']?\s*[:=]\s*true/i;

const FIDELITY_AUDIT_PLAN_REQUIRED_BOUNDARY_TEXT = [
  PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID,
  "cannot be interpreted as evidence that alternans disappeared",
  "Phase 5C-D as a fidelity audit over the existing Phase 5C-C artifact",
  "not as a new standalone engine or duplicated verifier",
  "Do not duplicate Phase 5C-C branch metrics in a parallel verifier",
  "Same-protocol second-order advancement is blocked",
  "The Land generated run is not interpretable as no-alternans evidence while the positive control fails",
  "The descriptor and verifier should reject any strengthened advancement claim that attempts to treat Phase 5B read-only SDIRK2 pins, Phase 5C-C BE smoke, or report-only morphology as final no-alternans evidence",
  "Do not wire ModelCore, chambers, cases, official cases, Workbench, or runtime schema",
  "Do not tune qDot, valve thresholds, arterial compliance, characteristic impedance, reflections, Land parameters, or preload/afterload closure settings in this audit phase",
  "Do not claim official morphology acceptance, final robust no-alternans, calcium-cycling alternans validation, RV pressure-overload coverage, ventricular interdependence, right-heart failure coverage, or TriSeg adoption",
] as const;

const FIDELITY_AUDIT_PLAN_EXCLUSIVE_BOUNDARY_TOKENS = [
  "standalone engine",
  "duplicated verifier",
  "parallel verifier",
  "official morphology acceptance",
  "final robust no-alternans",
  "calcium-cycling alternans validation",
  "RV pressure-overload coverage",
  "ventricular interdependence",
  "right-heart failure coverage",
  "TriSeg adoption",
] as const;

const FIDELITY_AUDIT_PLAN_FORBIDDEN_PROSE_OBJECTS = [
  "standalone engine",
  "duplicated verifier",
  "parallel verifier",
  "ModelCore",
  "chambers",
  "cases",
  "official cases",
  "Workbench",
  "runtime schema",
  "qDot",
  "valve thresholds",
  "arterial compliance",
  "characteristic impedance",
  "reflections",
  "Land parameters",
  "preload/afterload closure",
  "same-protocol",
  "second-order advancement",
  "SDIRK2",
  "Phase 5B",
  "official morphology",
  "official morphology acceptance",
  "morphology acceptance",
  "morphology pass",
  "morphology gate",
  "alternans disappeared",
  "Land generated run",
  "Land generated trajectory",
  "no-alternans evidence",
  "no alternans evidence",
  "robust no-alternans",
  "final robust no-alternans",
  "calcium-cycling alternans",
  "calcium-cycling alternans validation",
  "RV pressure-overload",
  "RV pressure-overload coverage",
  "ventricular interdependence",
  "right-heart failure",
  "right-heart failure coverage",
  "TriSeg",
] as const;

const FIDELITY_AUDIT_PLAN_AFFIRMATIVE_PATTERN =
  /\b(?:accepts?|accepted|adopts?|adopted|allows?|allowed|approves?|approved|are|claims?|claimed|completes?|completed|covers?|covered|duplicates?|duplicated|enables?|enabled|implements?|implemented|interpretable|is|permits?|permitted|proves?|proved|ready|replaces?|replaced|tunes?|tuned|validates?|validated|wires?|wired|can|may|must|should|will|in scope)\b/i;

export function loadLandNewMyocardiumLowPreloadValidationInput(
  rootDir = process.cwd(),
): LandNewMyocardiumLowPreloadValidationInput {
  const descriptor = readJson(path.join(rootDir, LAND_NEW_MYOCARDIUM_PHASE5C_C_PROTOCOL_DESCRIPTOR_PATH));
  const alternansPolicyDescriptor =
    readJson(path.join(rootDir, LAND_NEW_MYOCARDIUM_PHASE5C_C_ALTERNANS_POLICY_PATH));
  const legacyProtocol = loadFixedLowPreloadLegacyEvidence();
  const report = runLandNewMyocardiumLowPreloadCheckReport({
    legacyProtocol,
    alternansPolicyDescriptor: alternansPolicyDescriptor as LandShadowPolicyDescriptor,
  });
  return {
    descriptor,
    alternansPolicyDescriptor,
    report,
    sourceFiles: [
      readTextFile(rootDir, LAND_NEW_MYOCARDIUM_PHASE5C_C_REPORT_SOURCE_PATH),
      readTextFile(rootDir, LAND_NEW_MYOCARDIUM_PHASE5C_C_VERIFIER_SOURCE_PATH),
      readTextFile(rootDir, LAND_NEW_MYOCARDIUM_PHASE5C_C_PROTOCOL_DESCRIPTOR_PATH),
      readTextFile(rootDir, "docs/myocardium/roadmap/phase5c-new-myocardium-check-plan.md"),
      readTextFile(rootDir, LAND_NEW_MYOCARDIUM_PHASE5C_D_FIDELITY_AUDIT_PLAN_PATH),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
  };
}

export function validateLandNewMyocardiumLowPreloadCheck(
  input: LandNewMyocardiumLowPreloadValidationInput,
): LandNewMyocardiumLowPreloadValidationReport {
  const issues: ValidationIssue[] = [];

  validateReport(input.report, issues);
  validateDescriptor(input.descriptor, input.report, issues);
  validateAlternansPolicy(input.alternansPolicyDescriptor, issues);
  validateSourceFiles(input.sourceFiles, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    pass: errors.length === 0,
    artifactGatePass: input.report.readinessPass,
    artifactGateStatus: input.report.readinessStatus,
    artifactGateFindings: artifactGateFindings(input.report),
    errors,
    warnings,
    summary: {
      readinessSectionCount: input.report.sections.length,
      sourceFileCount: input.sourceFiles.length,
      runtimeIntegrationFileCount: input.runtimeIntegrationFiles.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function artifactGateFindings(
  report: LandNewMyocardiumLowPreloadCheckReport,
): readonly string[] {
  if (report.readinessPass) return [];
  const findings: string[] = [];
  for (const section of report.sections.filter((section) => section.status === "readiness-fail")) {
    findings.push(`${section.id}: status=readiness-fail.`);
  }
  return findings;
}

function loadFixedLowPreloadLegacyEvidence(): LandShadowLegacyProtocolEvidence {
  const debugReport = runLowPreloadDebug({
    outDir: "",
    targetVolumeMl: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.baselineTotalBloodVolumeMl,
    heartModel: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.heartModel,
    deltasMl: [LAND_SHADOW_FIXED_LEGACY_PROTOCOL.deltaTotalBloodVolumeMl],
    dtValues: [LAND_SHADOW_FIXED_LEGACY_PROTOCOL.integrationDtSec],
    lambdaActTauSecValues: [0],
    lambdaActScope: "all",
    traceBeats: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.traceBeats,
    sampleHz: LAND_SHADOW_FIXED_LEGACY_PROTOCOL.sampleHz,
    returnMapMode: "none",
    maxReturnMapPoints: 0,
    quietClampLog: true,
  });
  const point = debugReport.points[0];
  if (!point || debugReport.points.length !== 1) {
    throw new Error("Phase 5C-C fixed low-preload verifier expects exactly one debug point.");
  }
  return {
    baselineTotalBloodVolumeMl: debugReport.targetVolumeMl,
    deltaTotalBloodVolumeMl: point.deltaVolumeMl,
    effectiveTotalBloodVolumeMl: point.targetVolumeMl,
    heartModel: debugReport.heartModel,
    integrationDtSec: debugReport.dtValues[0],
    sampleHz: debugReport.sampleHz,
    traceBeats: debugReport.traceBeats,
    returnMapAcceptance: "not-used",
    returnMapPointLimit: debugReport.maxReturnMapPoints ?? 0,
    settled: point.settle.settled,
    periodBeats: point.settle.periodBeats,
    adjacentDelta: point.settle.adjacentDelta,
    periodDelta: point.settle.periodDelta,
    tbvClassification: point.tbvAudit.classification,
    tbvSanitizeAbsMl: point.tbvAudit.sanitizeAbsMl,
    tbvProjectionAppliedMl: point.tbvAudit.projectionAbsAppliedMl,
    maxValveReverseMl: Math.max(
      point.valveVolumesMl.MVReverse,
      point.valveVolumesMl.AoVReverse,
      point.valveVolumesMl.TVReverse,
      point.valveVolumesMl.PVReverse,
    ),
  };
}

function validateReport(
  report: LandNewMyocardiumLowPreloadCheckReport,
  issues: ValidationIssue[],
): void {
  if (
    report.protocolSetId !== LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID
    || report.phase !== LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE
    || report.claimBoundary !== LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY
    || report.closureModelId !== PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID
    || report.closureEquivalenceToModelCore !== "not-claimed"
    || report.productionRuntimeStatus !== "not-live-runtime-replacement"
  ) {
    addIssue(issues, "error", "phase5c_c_report_boundary", "report", "Report must remain the Phase 5C-C standalone low-preload artifact and not claim ModelCore equivalence or runtime replacement.");
  }
  if (report.sections.length !== REQUIRED_SECTION_IDS.length) {
    addIssue(issues, "error", "phase5c_c_report_sections", "report.sections", "Unexpected Phase 5C-C section count.");
  }
  for (const id of REQUIRED_SECTION_IDS) {
    const candidate = report.sections.find((section) => section.id === id);
    if (!candidate) {
      addIssue(issues, "error", "phase5c_c_report_sections", `report.sections.${id}`, `${id} is missing.`);
    }
  }
  if (report.readinessPass !== report.sections.every((section) => section.status === "readiness-pass")) {
    addIssue(issues, "error", "phase5c_c_report_sections", "report.readinessPass", "Report readinessPass must reflect all section statuses.");
  }
  validateLegacyReproduction(report, issues);
  validateSameClosure(report, issues);
  validatePositiveControl(report.legacyPositiveControl, issues);
  validateLandRun(report.landNewMyocardiumRun, report.legacyPositiveControl, issues);
  validateMorphology(report.landNewMyocardiumRun.morphology, issues);
  validatePolicyBoundary(report, issues);
  validateAdvancementBlock(report, issues);
  validateReadOnlyPins(report, issues);
  validateNonClaims(report, issues);
  validateNoProductionClaims("report", JSON.stringify(report), issues);
}

function validateLegacyReproduction(
  report: LandNewMyocardiumLowPreloadCheckReport,
  issues: ValidationIssue[],
): void {
  const legacy = report.legacyReproduction;
  const observed = legacy.observed;
  if (
    legacy.status !== "read-only-present-pinned"
    || !legacy.fixedProtocolPass
    || !legacy.reproductionPass
    || !legacy.pass
    || observed.baselineTotalBloodVolumeMl !== 5600
    || observed.deltaTotalBloodVolumeMl !== -1250
    || observed.effectiveTotalBloodVolumeMl !== 4350
    || observed.heartModel !== "activeStress"
    || observed.integrationDtSec !== 0.001
    || observed.sampleHz !== 120
    || observed.traceBeats !== 4
    || observed.returnMapAcceptance !== "not-used"
    || observed.returnMapPointLimit !== 0
    || observed.settled !== true
    || observed.periodBeats !== 2
    || observed.adjacentDelta <= 0.1
    || observed.periodDelta >= 0.05
    || observed.tbvClassification !== "clean"
    || observed.tbvSanitizeAbsMl > 0.05
    || observed.tbvProjectionAppliedMl > 0.05
    || observed.maxValveReverseMl > 0.05
  ) {
    addIssue(issues, "error", "phase5c_c_legacy_reproduction", "report.legacyReproduction", "Read-only Phase 5C-A legacy activeStress reproduction must remain pinned to the fixed low-preload period-2 protocol.");
  }
}

function validateSameClosure(
  report: LandNewMyocardiumLowPreloadCheckReport,
  issues: ValidationIssue[],
): void {
  const evidence = report.sameClosureEvidence;
  if (
    !evidence.pass
    || !evidence.sourceProviderDifferenceOnly
    || evidence.positiveControlClosureConfigStableHash !== evidence.landClosureConfigStableHash
    || evidence.positiveControlInitialStateStableHash !== evidence.landInitialStateStableHash
    || evidence.closureConfigStableHash !== evidence.positiveControlClosureConfigStableHash
    || evidence.initialStateStableHash !== evidence.positiveControlInitialStateStableHash
    || evidence.branchMetricDefinitionsStableHash
      !== report.legacyPositiveControl.hashes.branchMetricDefinitionsStableHash
    || evidence.branchMetricDefinitionsStableHash
      !== report.landNewMyocardiumRun.hashes.branchMetricDefinitionsStableHash
  ) {
    addIssue(issues, "error", "phase5c_c_same_closure", "report.sameClosureEvidence", "Positive-control and Land generated runs must share closure config, initial state, branch metric definitions, dt/sample/preload/afterload/conductance/settling policy, and differ only by source provider.");
  }
}

function validatePositiveControl(
  run: LandNewMyocardiumGeneratedRun,
  issues: ValidationIssue[],
): void {
  const branch = run.branchBehavior;
  const events = run.eventSurfaces;
  if (
    run.sourceProviderId !== "legacy-activeStress-positive-control"
    || run.sourceProviderRole !== "positive-control"
    || run.generatedTrajectoryStatus !== "generated-own-trajectory-finite"
    || !run.finiteStateHealth
    || !run.selectedDomainCoverageFinite
    || events.tbvProjectionEquivalentMl > 0.05
    || events.maxReverseVolumeEquivalentMl > 0.05
    || events.pressureFloorUse !== false
    || !branch.beatWindow.every((beat) =>
      beat.finiteHealth
      && beat.selectedDomainCoverage
      && beat.sampleCount > 0
      && eightHex(beat.deterministicHash)
      && [
        beat.edvMl,
        beat.esvMl,
        beat.strokeVolumeMl,
        beat.qAoPeakMlPerSec,
        beat.aopPeakPa,
        beat.aopMeanPa,
        beat.lvpPeakPa,
        beat.lvpMinPa,
        beat.strokeWorkJ,
      ].every(Number.isFinite),
    )
  ) {
    addIssue(issues, "error", "phase5c_c_positive_control", "report.legacyPositiveControl", "Positive control must use the same closure with a finite state-dependent legacy activeStress provider, clean event surfaces, and finite selected-domain coverage.");
  }
  validatePositiveControlProvenance(run, issues);
  validateNoLegacyReplay(run, "report.legacyPositiveControl", issues);
}

function validatePositiveControlProvenance(
  run: LandNewMyocardiumGeneratedRun,
  issues: ValidationIssue[],
): void {
  const provenance = run.sourceProviderProvenance;
  if (
    provenance.sourceProviderId !== "legacy-activeStress-positive-control"
    || provenance.equationSource !== "engine/chambers.ts:ActiveStressChamberModel"
    || provenance.parameterSource !== "defaultActiveLV"
    || provenance.stateSemantics !== "legacy-ChamberInternal-c-a-r-tensionPa-lambdaAct"
    || provenance.kinematicsInput !== "surrogate-generated-selected-v2-LV-volume-and-fiber-kinematics"
    || provenance.activationInput !== "surrogate-generated-cycle-phase-activeStress-release"
    || provenance.artifactEquationImportOnly !== true
    || provenance.usesModelCoreRuntimeWiring !== false
    || provenance.usesChamberRuntimeWiring !== false
    || provenance.hardCodedBeatParityForcing !== false
    || provenance.consumesPrerecordedTraceReplay !== false
  ) {
    addIssue(issues, "error", "phase5c_c_positive_control_provenance", "report.legacyPositiveControl.sourceProviderProvenance", "Positive control must be a faithful ActiveStressChamberModel/defaultActiveLV adapter on surrogate-generated state, not a hard-coded beat-parity alternans source.");
  }
}

function validateLandRun(
  landRun: LandNewMyocardiumGeneratedRun,
  positiveControl: LandNewMyocardiumGeneratedRun,
  issues: ValidationIssue[],
): void {
  if (
    landRun.sourceProviderId !== "land2017-new-myocardium"
    || landRun.sourceProviderRole !== "new-myocardium-run"
    || landRun.generatedTrajectoryStatus !== "generated-own-trajectory-finite"
    || !landRun.finiteStateHealth
    || !landRun.selectedDomainCoverageFinite
    || landRun.hashes.closureConfigStableHash !== positiveControl.hashes.closureConfigStableHash
    || landRun.hashes.initialStateStableHash !== positiveControl.hashes.initialStateStableHash
    || landRun.hashes.branchMetricDefinitionsStableHash
      !== positiveControl.hashes.branchMetricDefinitionsStableHash
    || landRun.eventSurfaces.pressureFloorUse !== false
    || landRun.eventSurfaces.tbvProjectionUse !== false
  ) {
    addIssue(issues, "error", "phase5c_c_land_generated_trajectory", "report.landNewMyocardiumRun", "Land run must generate its own finite trajectory under the same closure and must not use pressure floors or TBV projection.");
  }
  const provenance = landRun.sourceProviderProvenance;
  if (
    provenance.sourceProviderId !== "land2017-new-myocardium"
    || provenance.equationSource !== "engine/myocardium/myofilament/land2017"
    || provenance.parameterSource !== "land2017-intact-human-37c-source-v1"
    || provenance.stateSemantics !== "Land2017-state-vector"
    || provenance.consumesPrerecordedTraceReplay !== false
  ) {
    addIssue(issues, "error", "phase5c_c_land_provider_provenance", "report.landNewMyocardiumRun.sourceProviderProvenance", "Land run must use the Land 2017 source provider on generated surrogate state.");
  }
  validateNoLegacyReplay(landRun, "report.landNewMyocardiumRun", issues);
}

function validateNoLegacyReplay(
  run: LandNewMyocardiumGeneratedRun,
  issuePath: string,
  issues: ValidationIssue[],
): void {
  const policy = run.trajectoryGenerationPolicy;
  if (
    policy.generatesOwnVlvTrajectory !== true
    || policy.consumesPhase5CALegacyVlvTrace !== false
    || policy.consumesLegacyActiveStressTimeSeries !== false
    || policy.consumesLegacyPressureTrace !== false
    || policy.consumesLegacyFlowTrace !== false
    || policy.consumesLegacyCoTrace !== false
    || policy.consumesLegacyBranchLabels !== false
    || policy.consumesRunLowPreloadDebugOutput !== false
    || policy.noPrerecordedStressOrTraceReplay !== true
  ) {
    addIssue(issues, "error", "phase5c_c_forbidden_replay", `${issuePath}.trajectoryGenerationPolicy`, "Generated runs must not prescribe or consume Phase 5C-A legacy VLV, stress, pressure, flow, CO, branch-label, or runLowPreloadDebug time series.");
  }
}

function validateMorphology(
  morphology: LandNewMyocardiumGeneratedRun["morphology"],
  issues: ValidationIssue[],
): void {
  if (
    morphology.morphologyEvidenceStatus !== "reported-not-official"
    || morphology.officialMorphologyGateStatus !== "not-wired"
    || morphology.officialMorphologyPass !== "not-claimed"
    || !morphology.finiteMetricSet
  ) {
    addIssue(issues, "error", "phase5c_c_morphology_boundary", "report.landNewMyocardiumRun.morphology", "Morphology must be reported-not-official, official gate not wired, official pass not claimed, and all named metrics finite.");
  }
  for (const metric of REQUIRED_MORPHOLOGY_METRICS) {
    if (!Number.isFinite(morphology.metrics[metric])) {
      addIssue(issues, "error", "phase5c_c_morphology_metrics", `report.landNewMyocardiumRun.morphology.metrics.${metric}`, `${metric} must be finite.`);
    }
  }
}

function validatePolicyBoundary(
  report: LandNewMyocardiumLowPreloadCheckReport,
  issues: ValidationIssue[],
): void {
  const policy = report.policyBoundary;
  if (
    policy.policyPath !== LAND_NEW_MYOCARDIUM_PHASE5C_C_ALTERNANS_POLICY_PATH
    || policy.policyId !== "layer-consistency-and-alternans-policy-v1"
    || !policy.legacyReproductionRequired
    || !policy.newMyocardiumCheckRequired
    || !policy.secondOrderReferenceRequired
    || policy.legacyReproductionStatus !== "read-only-present-pinned"
    || !(
      (
        policy.legacyPositiveControlStatus === "period-2-positive-control-pass"
        && ["performed-be-smoke-not-final", "attempted-not-satisfied"].includes(policy.newMyocardiumCheckStatus)
      )
      || (
        policy.legacyPositiveControlStatus === "positive-control-failed"
        && policy.newMyocardiumCheckStatus === "not-performed-positive-control-failed"
      )
    )
    || policy.newMyocardiumCheckRequiredSatisfied !== false
    || policy.secondOrderSameProtocolStatus !== "not-performed"
    || policy.finalNoAlternansClaim !== "not-claimed"
    || !policy.pass
    || report.newMyocardiumCheckRequiredSatisfied !== false
    || report.secondOrderSameProtocolStatus !== "not-performed"
    || report.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase5c_c_policy_boundary", "report.policyBoundary", "Policy boundary must keep newMyocardiumCheckRequiredSatisfied=false, secondOrderSameProtocolStatus=not-performed, and finalNoAlternansClaim=not-claimed.");
  }
}

function validateAdvancementBlock(
  report: LandNewMyocardiumLowPreloadCheckReport,
  issues: ValidationIssue[],
): void {
  if (report.policyBoundary.legacyPositiveControlStatus !== "positive-control-failed") return;
  if (
    report.readinessPass !== false
    || report.readinessStatus !== "land-new-myocardium-low-preload-check-review"
    || report.legacyPositiveControl.branchBehavior.settlingStatus !== "settled-period-1"
    || report.legacyPositiveControl.branchBehavior.periodBeats !== 1
    || report.legacyPositiveControl.branchBehavior.adjacentDelta > 0.1
    || report.policyBoundary.newMyocardiumCheckStatus !== "not-performed-positive-control-failed"
    || report.newMyocardiumCheckRequiredSatisfied !== false
    || report.secondOrderSameProtocolStatus !== "not-performed"
    || report.finalNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase5c_c_advancement_block", "report", "When the same-closure legacy positive control fails period-2, artifactGate must remain failed and Land/no-alternans/second-order advancement must remain blocked.");
  }
}

function validateReadOnlyPins(
  report: LandNewMyocardiumLowPreloadCheckReport,
  issues: ValidationIssue[],
): void {
  const pins = report.readOnlyPins;
  if (
    !pins.pass
    || pins.phase5A.reusePolicy !== "read-only"
    || pins.phase5A.protocolSetId !== "local-monolithic-coupling-phase5a-protocols-v1"
    || !pins.phase5A.readinessPass
    || !pins.phase5A.stableHashFormatPass
    || pins.phase5B.reusePolicy !== "read-only"
    || pins.phase5B.protocolSetId !== "local-monolithic-coupling-phase5b-sdirk2-protocols-v1"
    || !pins.phase5B.readinessPass
    || !pins.phase5B.stableHashFormatPass
    || pins.phase5B.phase5BReadOnlySdirk2Status
      !== "solver-reference-available-not-same-protocol"
    || pins.phase5B.sameProtocolAgreementClaim !== "not-claimed"
    || report.phase5BReadOnlySdirk2Status
      !== "solver-reference-available-not-same-protocol"
  ) {
    addIssue(issues, "error", "phase5c_c_read_only_pins", "report.readOnlyPins", "Phase 5A/5B pins must be present as read-only evidence, and Phase 5B SDIRK2 must not be treated as same-protocol low-preload agreement.");
  }
}

function validateNonClaims(
  report: LandNewMyocardiumLowPreloadCheckReport,
  issues: ValidationIssue[],
): void {
  if (
    report.morphologyEvidenceStatus !== "reported-not-official"
    || report.officialMorphologyGateStatus !== "not-wired"
    || report.futureScope.rvPressureOverloadCoverage !== "not-covered"
    || report.futureScope.septalBowingCoverage !== "not-covered"
    || report.futureScope.ventricularInterdependenceCoverage !== "not-covered"
    || report.futureScope.rightHeartFailureCoverage !== "not-covered"
    || report.futureScope.triSegAdoption !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase5c_c_forbidden_claim", "report.futureScope", "Report must not claim official morphology, RV/interdependence/RHF/TriSeg coverage, or final no-alternans.");
  }
}

function validateDescriptor(
  descriptor: unknown,
  report: LandNewMyocardiumLowPreloadCheckReport,
  issues: ValidationIssue[],
): void {
  if (!isRecord(descriptor)) {
    addIssue(issues, "error", "phase5c_c_descriptor_shape", "descriptor", "Descriptor must be an object.");
    return;
  }
  if (
    descriptor.protocolSetId !== LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PROTOCOL_SET_ID
    || descriptor.phase !== LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_PHASE
    || descriptor.claimBoundary !== LAND_NEW_MYOCARDIUM_LOW_PRELOAD_PHASE5C_CLAIM_BOUNDARY
    || descriptor.closureModelId !== PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID
    || descriptor.closureEquivalenceToModelCore !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase5c_c_descriptor_boundary", "descriptor", "Descriptor must pin the Phase 5C-C closure id, artifact boundary, and ModelCore non-equivalence.");
  }
  const settings = isRecord(descriptor.protocolSettings) ? descriptor.protocolSettings : {};
  for (const field of [
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
  ] as const) {
    if (settings[field] !== false) {
      addIssue(issues, "error", "phase5c_c_protocol_settings", `descriptor.protocolSettings.${field}`, `${field} must remain false.`);
    }
  }
  const status = isRecord(descriptor.policyStatuses) ? descriptor.policyStatuses : {};
  if (
    status.legacyReproductionStatus !== report.policyBoundary.legacyReproductionStatus
    || status.legacyPositiveControlStatus !== report.policyBoundary.legacyPositiveControlStatus
    || status.positiveControlBranchStatus !== report.legacyPositiveControl.branchBehavior.settlingStatus
    || status.positiveControlObservedPeriodBeats !== report.legacyPositiveControl.branchBehavior.periodBeats
    || status.artifactGateExpectedPass !== report.readinessPass
    || status.artifactGateFailureFinding !== "legacy-activeStress-positive-control-v1"
    || status.landRunInterpretation !== "not-interpretable-positive-control-failed"
    || status.newMyocardiumCheckRequiredSatisfied !== false
    || status.secondOrderSameProtocolStatus !== "not-performed"
    || status.sameProtocolSecondOrderAdvancementStatus !== "blocked-until-positive-control-period2"
    || status.phase5BReadOnlySdirk2Status
      !== "solver-reference-available-not-same-protocol"
    || status.finalNoAlternansClaim !== "not-claimed"
    || typeof status.advancementBlockReason !== "string"
    || !/positive control/i.test(status.advancementBlockReason)
    || !/period-1/i.test(status.advancementBlockReason)
    || !/period-2/i.test(status.advancementBlockReason)
  ) {
    addIssue(issues, "error", "phase5c_c_advancement_block", "descriptor.policyStatuses", "Descriptor must encode the current positive-control failure and block Land/no-alternans/second-order advancement while artifactGate is failed.");
  }
  const requiredScripts = Array.isArray(descriptor.requiredVerificationScripts)
    ? descriptor.requiredVerificationScripts
    : [];
  if (!requiredScripts.includes("verify:myocardium-land-new-myocardium-low-preload-check")) {
    addIssue(issues, "error", "phase5c_c_required_scripts", "descriptor.requiredVerificationScripts", "Descriptor must list the Phase 5C-C verifier script.");
  }
  const protocols = Array.isArray(descriptor.protocols) ? descriptor.protocols : [];
  for (const id of REQUIRED_SECTION_IDS) {
    if (!protocols.some((entry) => isRecord(entry) && entry.id === id)) {
      addIssue(issues, "error", "phase5c_c_descriptor_protocols", "descriptor.protocols", `Descriptor protocol list must include ${id}.`);
    }
  }
}

function validateAlternansPolicy(
  descriptor: unknown,
  issues: ValidationIssue[],
): void {
  const policy = isRecord(descriptor) ? descriptor : {};
  const alternansPolicy = isRecord(policy.alternansPolicy) ? policy.alternansPolicy : {};
  const legacyReproduction =
    isRecord(alternansPolicy.legacyReproduction) ? alternansPolicy.legacyReproduction : {};
  const newMyocardiumCheck =
    isRecord(alternansPolicy.newMyocardiumCheck) ? alternansPolicy.newMyocardiumCheck : {};
  const secondOrder =
    isRecord(alternansPolicy.secondOrderReferenceRequired)
      ? alternansPolicy.secondOrderReferenceRequired
      : {};
  if (
    policy.id !== "layer-consistency-and-alternans-policy-v1"
    || legacyReproduction.required !== true
    || newMyocardiumCheck.required !== true
    || secondOrder.required !== true
    || typeof alternansPolicy.beOnlyInterpretation !== "string"
    || !/smoke evidence only/i.test(alternansPolicy.beOnlyInterpretation)
  ) {
    addIssue(issues, "error", "phase5c_c_policy_descriptor", LAND_NEW_MYOCARDIUM_PHASE5C_C_ALTERNANS_POLICY_PATH, "Verifier must read the actual alternans policy required flags and BE-only interpretation.");
  }
}

function validateSourceFiles(
  sourceFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  const report = sourceFiles.find((file) => file.path === LAND_NEW_MYOCARDIUM_PHASE5C_C_REPORT_SOURCE_PATH);
  const verifier = sourceFiles.find((file) => file.path === LAND_NEW_MYOCARDIUM_PHASE5C_C_VERIFIER_SOURCE_PATH);
  const descriptor = sourceFiles.find((file) => file.path === LAND_NEW_MYOCARDIUM_PHASE5C_C_PROTOCOL_DESCRIPTOR_PATH);
  const plan = sourceFiles.find((file) => file.path === "docs/myocardium/roadmap/phase5c-new-myocardium-check-plan.md");
  const fidelityAuditPlan = sourceFiles.find((file) =>
    file.path === LAND_NEW_MYOCARDIUM_PHASE5C_D_FIDELITY_AUDIT_PLAN_PATH
  );
  if (!report || !verifier || !descriptor || !plan || !fidelityAuditPlan) {
    addIssue(issues, "error", "phase5c_c_source_scan", "sourceFiles", "Phase 5C-C report, verifier, descriptor, accepted plan, and Phase 5C-D fidelity audit plan must be present.");
    return;
  }
  for (const token of [
    PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID,
    "legacy-activeStress-positive-control",
    "land2017-new-myocardium",
    "ActiveStressChamberModel",
    "sourceProviderProvenance",
    "hardCodedBeatParityForcing",
    "sourceProviderDifferenceOnly",
    "morphologyEvidenceStatus",
    "officialMorphologyGateStatus",
    "newMyocardiumCheckRequiredSatisfied",
    "secondOrderSameProtocolStatus",
    "finalNoAlternansClaim",
  ] as const) {
    if (!report.text.includes(token)) {
      addIssue(issues, "error", "phase5c_c_source_scan", report.path, `Report source must include ${token}.`);
    }
  }
  if (/from\s+["']@\/engine\/(?:ModelCore|harness|runtime|protocol|stateContract|core\/stateLayout)/m.test(report.text)) {
    addIssue(issues, "error", "phase5c_c_engine_purity", report.path, "Pure Phase 5C-C report module must not import ModelCore, runtime, protocol, or state layout.");
  }
  if (
    /\balternansState\b|\blastActivationBeat\b/i.test(report.text)
    || /hardCodedBeatParityForcing\s*[:=]\s*true/i.test(report.text)
  ) {
    addIssue(issues, "error", "phase5c_c_forced_positive_control", report.path, "Positive control must not hard-code beat-parity alternans forcing.");
  }
  if (
    /from\s+["']@\/tools\/debugStarlingLowPreload["']/.test(report.text)
    || /\brunLowPreloadDebug\s*\(/.test(report.text)
    || /VlvTraceRow|legacyTrajectory/i.test(report.text)
  ) {
    addIssue(issues, "error", "phase5c_c_forbidden_replay", report.path, "Report module must not consume Phase 5C-A legacy VLV traces or runLowPreloadDebug output for generated runs.");
  }
  for (const token of [
    "runLowPreloadDebug",
    "validateNoLegacyReplay",
    "sourceProviderDifferenceOnly",
    "reported-not-official",
    "solver-reference-available-not-same-protocol",
  ] as const) {
    if (!verifier.text.includes(token)) {
      addIssue(issues, "error", "phase5c_c_source_scan", verifier.path, `Verifier source must include ${token}.`);
    }
  }
  if (!descriptor.text.includes(PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID)) {
    addIssue(issues, "error", "phase5c_c_descriptor_boundary", descriptor.path, "Descriptor must include the standalone closure id.");
  }
  if (!plan.text.includes(PHASE5C_C_STANDALONE_CLOSURE_MODEL_ID)) {
    addIssue(issues, "error", "phase5c_c_plan_boundary", plan.path, "Accepted plan must include the standalone closure id.");
  }
  validateFidelityAuditPlan(fidelityAuditPlan, issues);
}

function validateFidelityAuditPlan(
  plan: TextFileInput,
  issues: ValidationIssue[],
): void {
  const normalizedText = plan.text.replace(/\s+/g, " ");
  for (const token of FIDELITY_AUDIT_PLAN_REQUIRED_BOUNDARY_TEXT) {
    if (!normalizedText.includes(token)) {
      addIssue(issues, "error", "phase5c_c_fidelity_plan_boundary", plan.path, `Phase 5C-D fidelity audit plan must preserve boundary text: ${token}.`);
    }
  }
  for (const token of FIDELITY_AUDIT_PLAN_EXCLUSIVE_BOUNDARY_TOKENS) {
    if (countOccurrences(normalizedText, token) !== 1) {
      addIssue(issues, "error", "phase5c_c_fidelity_plan_boundary", plan.path, `Phase 5C-D fidelity audit plan must mention ${token} only in canonical no-go/non-goal boundary text.`);
    }
  }
  validateNoFidelityAuditPlanContradictions(
    plan.path,
    removeCanonicalFidelityAuditPlanBoundaryText(normalizedText),
    issues,
  );
  validateNoProductionClaims(plan.path, plan.text, issues);
}

function removeCanonicalFidelityAuditPlanBoundaryText(normalizedText: string): string {
  let residualText = normalizedText;
  for (const token of FIDELITY_AUDIT_PLAN_REQUIRED_BOUNDARY_TEXT) {
    residualText = residualText.split(token).join(" ");
  }
  return residualText;
}

function validateNoFidelityAuditPlanContradictions(
  label: string,
  normalizedResidualText: string,
  issues: ValidationIssue[],
): void {
  for (const clause of normalizedResidualText.split(/(?<=[.!?;])\s+|\b(?:and|but|however|nevertheless|yet)\b/i)) {
    const normalizedClause = clause.trim();
    if (normalizedClause === "") {
      continue;
    }
    const mentionsBoundaryObject = FIDELITY_AUDIT_PLAN_FORBIDDEN_PROSE_OBJECTS.some((token) =>
      normalizedClause.toLowerCase().includes(token.toLowerCase())
    );
    if (mentionsBoundaryObject && FIDELITY_AUDIT_PLAN_AFFIRMATIVE_PATTERN.test(normalizedClause)) {
      addIssue(issues, "error", "phase5c_c_fidelity_plan_boundary", label, `Phase 5C-D fidelity audit plan must not add affirmative boundary prose: ${normalizedClause}.`);
    }
  }
}

function countOccurrences(text: string, token: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedToken = token.toLowerCase();
  let count = 0;
  let searchIndex = 0;
  while (true) {
    const foundIndex = normalizedText.indexOf(normalizedToken, searchIndex);
    if (foundIndex === -1) return count;
    count += 1;
    searchIndex = foundIndex + normalizedToken.length;
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of PHASE5C_C_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "phase5c_c_runtime_leak", file.path, `Runtime/official-case/workbench file must not reference Phase 5C-C token ${token}.`);
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(issues, "error", "phase5c_c_runtime_leak", file.path, "Runtime/official-case/workbench file must not enable runtime replacement, morphology/no-alternans acceptance, septal/RV/interdependence/RHF validation, or TriSeg adoption.");
    }
  }
}

function validateNoProductionClaims(
  label: string,
  text: string,
  issues: ValidationIssue[],
): void {
  if (PRODUCTION_ENABLING_PATTERN.test(text)) {
    addIssue(issues, "error", "phase5c_c_forbidden_claim", label, "Production/runtime/morphology/no-alternans/septal/RV/interdependence/RHF/TriSeg enabling flag detected.");
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

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readTextFile(rootDir: string, relativePath: string): TextFileInput {
  return {
    path: relativePath,
    text: readFileSync(path.join(rootDir, relativePath), "utf8"),
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function eightHex(value: string): boolean {
  return /^[0-9a-f]{8}$/.test(value);
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

function printReport(report: LandNewMyocardiumLowPreloadValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  const artifactStatus = report.artifactGatePass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 5C-C Land new-myocardium low-preload check validation ${status} `
    + `artifactGate=${artifactStatus} artifactStatus=${report.artifactGateStatus} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `sections=${report.summary.readinessSectionCount} `
    + `sourceFiles=${report.summary.sourceFileCount} `
    + `integrationFiles=${report.summary.runtimeIntegrationFileCount}`,
  );
  if (!report.artifactGatePass && report.artifactGateFindings.length > 0) {
    // eslint-disable-next-line no-console
    console.log("artifactGate findings:");
    for (const finding of report.artifactGateFindings) {
      // eslint-disable-next-line no-console
      console.log(`- ${finding}`);
    }
  }
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
    "Usage: npm run verify:myocardium-land-new-myocardium-low-preload-check -- [--root=DIR]",
    "",
    "Validates the Phase 5C-C standalone low-preload new-myocardium artifact.",
    "The verifier checks the same-closure positive control, generated Land trajectory, report-only morphology, unsatisfied final policy boundary, read-only Phase 5A/5B pins, and runtime isolation.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateLandNewMyocardiumLowPreloadCheck(
    loadLandNewMyocardiumLowPreloadValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
