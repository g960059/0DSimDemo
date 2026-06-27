import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { runLandActiveStressReplacementReadinessReport } from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import { runLocalMonolithicSdirk2ReadinessReport } from "@/engine/myocardium/protocols/localMonolithicSdirk2Readiness";
import {
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_CLAIM_BOUNDARY,
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PHASE,
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID,
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_BACKEND_ID,
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_CANDIDATE_ID,
  LAND_SHADOW_FIXED_LEGACY_PROTOCOL,
  runLandShadowAlternansComparatorReadinessReport,
  type LandShadowAlternansComparatorReadinessReport,
  type LandShadowLegacyProtocolEvidence,
  type LandShadowLegacyTrajectorySample,
  type LandShadowPolicyDescriptor,
} from "@/engine/myocardium/protocols/landShadowAlternansComparatorReadiness";
import { runLowPreloadDebug, type VlvTraceRow } from "@/tools/debugStarlingLowPreload";

export const LAND_SHADOW_ALTERNANS_POLICY_PATH =
  "data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json";
export const LAND_SHADOW_PHASE5C_A_REPORT_SOURCE_PATH =
  "engine/myocardium/protocols/landShadowAlternansComparatorReadiness.ts";
export const LAND_SHADOW_PHASE5C_A_VERIFIER_SOURCE_PATH =
  "tools/myocardium/verifyLandShadowAlternansComparatorReadiness.ts";

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

export type LandShadowAlternansComparatorValidationInput = {
  readonly alternansPolicyDescriptor: unknown;
  readonly report: LandShadowAlternansComparatorReadinessReport;
  readonly phase4BAReport: ReturnType<typeof runLandActiveStressReplacementReadinessReport>;
  readonly phase5BReport: ReturnType<typeof runLocalMonolithicSdirk2ReadinessReport>;
  readonly sourceFiles: readonly TextFileInput[];
  readonly runtimeIntegrationFiles: readonly TextFileInput[];
  readonly docs: readonly TextFileInput[];
};

export type LandShadowAlternansComparatorValidationReport = {
  readonly pass: boolean;
  readonly artifactGatePass: boolean;
  readonly artifactGateStatus: LandShadowAlternansComparatorReadinessReport["readinessStatus"];
  readonly artifactGateFindings: readonly string[];
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

const PINNED_PHASE4BA = {
  readinessPass: true,
  stableSummaryHashes: ["d3316c11", "4becc8e3"] as readonly string[],
} as const;

const PINNED_PHASE5B = {
  readinessPass: true,
  stableSummaryHashes: ["4ee994da", "e65e299b"] as readonly string[],
  localReferenceStableSummaryHashes: ["cd70fd47", "49c5be0d"] as readonly string[],
  beFallbackStableSummaryHashes: ["93a70fc0", "d896d783"] as readonly string[],
} as const;

const REQUIRED_SECTION_IDS = [
  "phase5c-a-boundary-v1",
  "alternans-policy-boundary-v1",
  "fixed-legacy-protocol-v1",
  "legacy-period2-reproduction-v1",
  "land-feedforward-shadow-replay-v1",
  "land-branch-delta-interpretation-v1",
  "deterministic-replay-v1",
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

const PHASE5C_A_RUNTIME_REFERENCE_TOKENS = [
  LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID,
  "land-shadow-alternans-comparator-readiness",
  "landShadowAlternansComparatorReadiness",
  "runLandShadowAlternansComparatorReadinessReport",
  "LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A",
  "Phase 5C-A",
] as const;

const PRODUCTION_ENABLING_PATTERN =
  /["']?(?:useRuntimeReplacement|useModelCoreRuntimeWiring|useChamberRuntimeWiring|useCaseRuntimeWiring|useStateSchemaWiring|useOfficialCaseWiring|useWorkbenchRuntimeWiring|useOfficialMorphologyAcceptance|useRobustNoAlternansAcceptance|useCalciumCyclingAlternansValidation|implementSeptalCoordinate|implementBiventricularCoupling|validateSeptalCoupling|validateRVPressureOverload|validateVentricularInterdependence|validateRightHeartFailure|adoptTriSeg|phase5Completed|runtimeReplacement|officialMorphologyPass|robustNoAlternans)["']?\s*[:=]\s*true/i;

export function loadLandShadowAlternansComparatorValidationInput(
  rootDir = process.cwd(),
): LandShadowAlternansComparatorValidationInput {
  const alternansPolicyDescriptor =
    readJson(path.join(rootDir, LAND_SHADOW_ALTERNANS_POLICY_PATH));
  const legacy = loadFixedLowPreloadLegacyEvidence();
  const report = runLandShadowAlternansComparatorReadinessReport({
    legacyProtocol: legacy.protocol,
    legacyTrajectory: legacy.trajectory,
    alternansPolicyDescriptor: alternansPolicyDescriptor as LandShadowPolicyDescriptor,
  });
  return {
    alternansPolicyDescriptor,
    report,
    phase4BAReport: runLandActiveStressReplacementReadinessReport(),
    phase5BReport: runLocalMonolithicSdirk2ReadinessReport(),
    sourceFiles: [
      readTextFile(rootDir, LAND_SHADOW_PHASE5C_A_REPORT_SOURCE_PATH),
      readTextFile(rootDir, LAND_SHADOW_PHASE5C_A_VERIFIER_SOURCE_PATH),
      readTextFile(rootDir, "tools/debugStarlingLowPreload.ts"),
    ],
    runtimeIntegrationFiles: loadRuntimeIntegrationFiles(rootDir),
    docs: [
      readTextFile(rootDir, "README.md"),
      readTextFile(rootDir, "docs/myocardium/README.md"),
      readTextFile(rootDir, "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md"),
    ],
  };
}

export function validateLandShadowAlternansComparatorReadiness(
  input: LandShadowAlternansComparatorValidationInput,
): LandShadowAlternansComparatorValidationReport {
  const issues: ValidationIssue[] = [];

  validateReport(input.report, issues);
  validatePolicyDescriptor(input.alternansPolicyDescriptor, issues);
  validatePriorGatePins(input.phase4BAReport, input.phase5BReport, issues);
  validateSourceFiles(input.sourceFiles, issues);
  validateRuntimeIntegrationScan(input.runtimeIntegrationFiles, issues);
  for (const doc of input.docs) {
    validateDocs(doc, issues);
    validateNoProductionClaims(doc.path, doc.text, issues);
  }

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
      docCount: input.docs.length,
      errorCount: errors.length,
      warningCount: warnings.length,
    },
  };
}

function artifactGateFindings(
  report: LandShadowAlternansComparatorReadinessReport,
): readonly string[] {
  if (report.readinessPass) return [];
  const findings: string[] = [];
  const replay = report.landFeedforwardReplay;
  if (!replay.allSamplesInCalibrationDomain) {
    const minObservedM3 = minFinite(
      replay.beats.map((beat) => beat.minPrescribedLegacyVlvM3),
    );
    findings.push(
      "land-feedforward-shadow-replay-v1: selected-v2 LV calibration-domain coverage failed; "
      + `min prescribed legacy VLV=${formatFinite(minObservedM3)} m3 `
      + `(${formatFinite(minObservedM3 * 1e6)} mL) < `
      + `domain min=${formatFinite(replay.selectedLvCalibrationDomainM3.min)} m3 `
      + `(${formatFinite(replay.selectedLvCalibrationDomainM3.min * 1e6)} mL).`,
    );
  }
  if (!replay.allFiniteHealth) {
    findings.push("land-feedforward-shadow-replay-v1: finite Land/kinematics/calcium health failed.");
  }
  if (replay.projectionUsedAny) {
    findings.push("land-feedforward-shadow-replay-v1: projectionUsedAny=true, but the shadow replay requires no projection.");
  }
  for (const section of report.sections.filter((candidate) => candidate.status === "readiness-fail")) {
    if (
      section.id === "land-feedforward-shadow-replay-v1"
      && findings.some((finding) => finding.startsWith(section.id))
    ) {
      continue;
    }
    findings.push(`${section.id}: status=readiness-fail.`);
  }
  return findings;
}

function loadFixedLowPreloadLegacyEvidence(): {
  readonly protocol: LandShadowLegacyProtocolEvidence;
  readonly trajectory: readonly LandShadowLegacyTrajectorySample[];
} {
  const debugReport = runFixedLowPreloadDebug();
  const point = requireSingleDebugPoint(debugReport);
  return {
    protocol: legacyProtocolFromDebug(debugReport, point),
    trajectory: point.vlvTrace.map((row: VlvTraceRow) => ({
      beat: row.beat,
      sampleIndex: row.sampleIndex,
      timeSec: row.tSec,
      phase01: row.phase,
      vlvMl: row.VLV,
    })),
  };
}

function runFixedLowPreloadDebug() {
  return runLowPreloadDebug({
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
}

function legacyProtocolFromDebug(
  debugReport: ReturnType<typeof runFixedLowPreloadDebug>,
  point: ReturnType<typeof requireSingleDebugPoint>,
): LandShadowLegacyProtocolEvidence {
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

function requireSingleDebugPoint(debugReport: ReturnType<typeof runLowPreloadDebug>) {
  const point = debugReport.points[0];
  if (!point || debugReport.points.length !== 1) {
    throw new Error("Phase 5C-A fixed low-preload verifier expects exactly one debug point.");
  }
  return point;
}

function validateReport(
  report: LandShadowAlternansComparatorReadinessReport,
  issues: ValidationIssue[],
): void {
  if (
    report.protocolSetId !== LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PROTOCOL_SET_ID
    || report.phase !== LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_PHASE
    || report.claimBoundary !== LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_CLAIM_BOUNDARY
    || report.productionRuntimeStatus !== "not-live-runtime-replacement"
    || report.selectedBackendId !== LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_BACKEND_ID
    || report.selectedCandidateId !== LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_CANDIDATE_ID
  ) {
    addIssue(issues, "error", "phase5c_report_boundary", "report", "Report must remain Phase 5C-A feedforward Land shadow replay readiness only.");
  }
  if (report.sections.length !== REQUIRED_SECTION_IDS.length) {
    addIssue(issues, "error", "phase5c_report_sections", "report.sections", "Unexpected Phase 5C-A section count.");
  }
  for (const id of REQUIRED_SECTION_IDS) {
    const candidate = report.sections.find((section) => section.id === id);
    if (!candidate) {
      addIssue(issues, "error", "phase5c_report_sections", `report.sections.${id}`, `${id} is missing.`);
    }
  }
  if (
    report.officialMorphologyPass !== "not-claimed"
    || report.finalNoAlternansClaim !== "not-claimed"
    || report.futureScope.rvPressureOverloadCoverage !== "not-covered"
    || report.futureScope.ventricularInterdependenceCoverage !== "not-covered"
    || report.futureScope.rightHeartFailureCoverage !== "not-covered"
  ) {
    addIssue(issues, "error", "phase5c_forbidden_claim", "report", "Report must not claim official morphology, final no-alternans, RV overload, interdependence, or RHF coverage.");
  }
  if (report.readinessPass !== report.sections.every((section) => section.status === "readiness-pass")) {
    addIssue(issues, "error", "phase5c_report_sections", "report.readinessPass", "Report readinessPass must reflect section status.");
  }
  validatePolicyBoundary(report, issues);
  validateLegacyProtocol(report, issues);
  validateLandReplay(report, issues);
  validateNoProductionClaims("report", JSON.stringify(report), issues);
}

function validatePolicyBoundary(
  report: LandShadowAlternansComparatorReadinessReport,
  issues: ValidationIssue[],
): void {
  const policy = report.policyBoundary;
  if (
    policy.policyPath !== LAND_SHADOW_ALTERNANS_POLICY_PATH
    || policy.policyId !== "layer-consistency-and-alternans-policy-v1"
    || !policy.legacyReproductionRequired
    || !policy.newMyocardiumCheckRequired
    || !policy.secondOrderReferenceRequired
    || policy.newMyocardiumCheckStatus !== "not-performed-not-satisfied"
    || policy.feedforwardShadowReplayEvidenceStatus
      !== "performed-distinct-from-new-myocardium-check"
    || policy.finalNoAlternansClaim !== "not-claimed"
    || !policy.pass
  ) {
    addIssue(issues, "error", "phase5c_policy_boundary", "report.policyBoundary", "Policy evidence must read the actual alternans policy, keep newMyocardiumCheck unsatisfied, and forbid final no-alternans claims.");
  }
}

function validateLegacyProtocol(
  report: LandShadowAlternansComparatorReadinessReport,
  issues: ValidationIssue[],
): void {
  const legacy = report.legacyReproduction;
  const observed = legacy.observed;
  if (
    !legacy.fixedProtocolPass
    || observed.baselineTotalBloodVolumeMl !== 5600
    || observed.deltaTotalBloodVolumeMl !== -1250
    || observed.effectiveTotalBloodVolumeMl !== 4350
    || observed.heartModel !== "activeStress"
    || observed.integrationDtSec !== 0.001
    || observed.sampleHz !== 120
    || observed.traceBeats !== 4
    || observed.returnMapAcceptance !== "not-used"
    || observed.returnMapPointLimit !== 0
  ) {
    addIssue(issues, "error", "phase5c_fixed_legacy_protocol", "report.legacyReproduction.observed", "Fixed legacy protocol must remain baseline 5600 mL, delta -1250 mL, activeStress, dt 0.001, sampleHz 120, traceBeats 4, and no return-map acceptance.");
  }
  if (
    !legacy.reproductionPass
    || observed.settled !== true
    || observed.periodBeats !== 2
    || observed.adjacentDelta <= 0.1
    || observed.periodDelta >= 0.05
    || observed.tbvClassification !== "clean"
    || observed.tbvSanitizeAbsMl > 0.05
    || observed.tbvProjectionAppliedMl > 0.05
    || observed.maxValveReverseMl > 0.05
  ) {
    addIssue(issues, "error", "phase5c_legacy_reproduction", "report.legacyReproduction", "Legacy activeStress reproduction must settle as period-2 with adjacentDelta > 0.1, periodDelta < 0.05, clean TBV sanitize/projection, and non-problematic valve reverse volume.");
  }
}

function validateLandReplay(
  report: LandShadowAlternansComparatorReadinessReport,
  issues: ValidationIssue[],
): void {
  const replay = report.landFeedforwardReplay;
  if (
    replay.volumeReplayPolicy.sourceVolume !== "legacy-activeStress-VLV-mL"
    || replay.volumeReplayPolicy.conversion !== "mL-to-m3"
    || replay.volumeReplayPolicy.clipping !== false
    || replay.volumeReplayPolicy.rescale !== false
    || replay.volumeReplayPolicy.freeGain !== false
    || replay.modelIds.selectedBackendId !== LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_BACKEND_ID
    || replay.modelIds.selectedCandidateId !== LAND_SHADOW_ALTERNANS_COMPARATOR_PHASE5C_A_SELECTED_CANDIDATE_ID
    || replay.calciumSource.source !== "prescribed-calcium-transient-v1"
    || replay.calciumSource.phaseAlignment
      !== "legacy-sample-phase-to-prescribed-calcium-time-since-activation"
    || replay.calciumSource.calciumCyclingAlternans !== "not-modeled-not-claimed"
  ) {
    addIssue(issues, "error", "phase5c_land_replay_boundary", "report.landFeedforwardReplay", "Land replay must use mL-to-m3 legacy VLV, selected thick-sphere-v2 LV parameters, prescribed calcium phase alignment, and no clipping/rescale/free gain.");
  }
  if (
    replay.replayBeatCount !== 4
    || replay.trajectorySampleCount <= 0
    || !Number.isFinite(replay.maxLandSolverResidualNorm)
    || !Number.isFinite(replay.relativeBranchDelta)
    || replay.branchDeltaInterpretation
      !== "inherited-from-prescribed-alternating-legacy-volume-not-generated-by-Land"
    || replay.officialMorphologyPassStatus !== "not-evaluated"
    || replay.robustNoAlternansClaim !== "not-claimed"
  ) {
    addIssue(issues, "error", "phase5c_land_replay_metrics", "report.landFeedforwardReplay", "Land replay must report finite per-beat metrics, branch delta interpretation, and no official morphology or robust no-alternans claim.");
  }
  const domainTolerance =
    Math.max(
      Math.abs(replay.selectedLvCalibrationDomainM3.min),
      Math.abs(replay.selectedLvCalibrationDomainM3.max),
      1,
    ) * 1e-12;
  const isBeatInsideSelectedLvDomain = (
    beat: LandShadowAlternansComparatorReadinessReport["landFeedforwardReplay"]["beats"][number],
  ) =>
    beat.finiteHealth.inCalibrationDomain
    && beat.minPrescribedLegacyVlvM3
      >= replay.selectedLvCalibrationDomainM3.min - domainTolerance
    && beat.maxPrescribedLegacyVlvM3
      <= replay.selectedLvCalibrationDomainM3.max + domainTolerance;
  for (const beat of replay.beats) {
    const beatInsideSelectedLvDomain =
      isBeatInsideSelectedLvDomain(beat);
    if (
      !Number.isFinite(beat.peakSourceActiveFiberStressPa)
      || !Number.isFinite(beat.minPrescribedLegacyVlvM3)
      || !Number.isFinite(beat.maxPrescribedLegacyVlvM3)
      || !beatInsideSelectedLvDomain
      || beat.sampleCount <= 0
      || beat.projectionUsed !== false
      || !/^[0-9a-f]{8}$/.test(beat.deterministicHash)
      || !beat.finiteHealth.kinematicsFinite
      || !beat.finiteHealth.calciumFinite
      || !beat.finiteHealth.landSolverOk
      || !beat.finiteHealth.landHealthFinite
      || !beat.finiteHealth.sourceStressFinite
    ) {
      addIssue(issues, "error", "phase5c_land_beat_metrics", `report.landFeedforwardReplay.beats.${beat.beat}`, "Every replay beat must include finite Land source stress metrics, projectionUsed=false, finite health, and an 8-hex deterministic hash.");
    }
  }
  const replaySection = report.sections.find((section) => section.id === "land-feedforward-shadow-replay-v1");
  const fixedLegacyVlvEnvelopeInsideSelectedLvDomain =
    replay.beats.length > 0
    && replay.beats.every((beat) => isBeatInsideSelectedLvDomain(beat));
  if (
    replay.replayPass
    !== (
      replay.allFiniteHealth
      && replay.allSamplesInCalibrationDomain
      && fixedLegacyVlvEnvelopeInsideSelectedLvDomain
      && !replay.projectionUsedAny
      && replay.beats.length === 4
    )
    || replaySection?.status !== (replay.replayPass ? "readiness-pass" : "readiness-fail")
  ) {
    addIssue(issues, "error", "phase5c_land_replay_consistency", "report.landFeedforwardReplay.replayPass", "Replay pass must require finite health, calibration-domain coverage, no projection, four beats, and match section status.");
  }
}

function validatePolicyDescriptor(
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
    addIssue(issues, "error", "phase5c_policy_descriptor", LAND_SHADOW_ALTERNANS_POLICY_PATH, "Verifier must read the actual alternans policy required flags and BE-only interpretation.");
  }
}

function validatePriorGatePins(
  phase4BAReport: LandShadowAlternansComparatorValidationInput["phase4BAReport"],
  phase5BReport: LandShadowAlternansComparatorValidationInput["phase5BReport"],
  issues: ValidationIssue[],
): void {
  if (
    phase4BAReport.readinessPass !== PINNED_PHASE4BA.readinessPass
    || !PINNED_PHASE4BA.stableSummaryHashes.includes(phase4BAReport.stableSummaryHash)
  ) {
    addIssue(
      issues,
      "error",
      "phase5c_phase4ba_pin_drift",
      "phase4BAReport",
      "Recomputed Phase 4B-A report pass/hash drifted from the pinned Node 22/26 baselines "
      + `(observed=${phase4BAReport.stableSummaryHash}; `
      + `allowed=${PINNED_PHASE4BA.stableSummaryHashes.join(",")}).`,
    );
  }
  if (
    phase5BReport.readinessPass !== PINNED_PHASE5B.readinessPass
    || !PINNED_PHASE5B.stableSummaryHashes.includes(phase5BReport.stableSummaryHash)
    || !PINNED_PHASE5B.localReferenceStableSummaryHashes.includes(
      phase5BReport.localReferenceSolve.stableSummaryHash,
    )
    || !PINNED_PHASE5B.beFallbackStableSummaryHashes.includes(
      phase5BReport.beFallbackReference.stableSummaryHash,
    )
  ) {
    addIssue(
      issues,
      "error",
      "phase5c_phase5b_pin_drift",
      "phase5BReport",
      "Recomputed Phase 5B report pass/hash drifted from the pinned Node 22/26 baselines "
      + `(observed=${phase5BReport.stableSummaryHash}/`
      + `${phase5BReport.localReferenceSolve.stableSummaryHash}/`
      + `${phase5BReport.beFallbackReference.stableSummaryHash}; `
      + `allowed=${PINNED_PHASE5B.stableSummaryHashes.join(",")}/`
      + `${PINNED_PHASE5B.localReferenceStableSummaryHashes.join(",")}/`
      + `${PINNED_PHASE5B.beFallbackStableSummaryHashes.join(",")}).`,
    );
  }
}

function validateSourceFiles(
  sourceFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  const report = sourceFiles.find((file) => file.path === LAND_SHADOW_PHASE5C_A_REPORT_SOURCE_PATH);
  const verifier = sourceFiles.find((file) => file.path === LAND_SHADOW_PHASE5C_A_VERIFIER_SOURCE_PATH);
  const debug = sourceFiles.find((file) => file.path === "tools/debugStarlingLowPreload.ts");
  if (!report || !verifier || !debug) {
    addIssue(issues, "error", "phase5c_source_scan", "sourceFiles", "Phase 5C-A report, verifier, and low-preload debug source must be present.");
    return;
  }
  for (const token of [
    "LandShadowLegacyTrajectorySample",
    "evaluateThickSphereV2SelectedBackend",
    "solveLand2017BackwardEulerSubsteps",
    "branchDeltaInterpretation",
    "not-performed-not-satisfied",
  ] as const) {
    if (!report.text.includes(token)) {
      addIssue(issues, "error", "phase5c_source_scan", report.path, `Report source must include ${token}.`);
    }
  }
  if (/from\s+["']@\/engine\/(?:ModelCore|chambers|harness|runtime|protocol|stateContract|core\/stateLayout)/m.test(report.text)) {
    addIssue(issues, "error", "phase5c_engine_purity", report.path, "Pure Phase 5C-A report module must not import ModelCore, chambers, runtime, protocol, or state layout.");
  }
  for (const token of [
    "runLowPreloadDebug",
    "LAND_SHADOW_FIXED_LEGACY_PROTOCOL",
    "PINNED_PHASE4BA",
    "PINNED_PHASE5B",
    "loadRuntimeIntegrationFiles",
  ] as const) {
    if (!verifier.text.includes(token)) {
      addIssue(issues, "error", "phase5c_source_scan", verifier.path, `Verifier source must include ${token}.`);
    }
  }
  if (!debug.text.includes("vlvTrace") || !debug.text.includes("VlvTraceRow")) {
    addIssue(issues, "error", "phase5c_legacy_trace_source", debug.path, "Low-preload debug report must expose the bounded VLV trace rows consumed by the verifier.");
  }
}

function validateRuntimeIntegrationScan(
  runtimeIntegrationFiles: readonly TextFileInput[],
  issues: ValidationIssue[],
): void {
  for (const file of runtimeIntegrationFiles) {
    for (const token of PHASE5C_A_RUNTIME_REFERENCE_TOKENS) {
      if (file.text.includes(token)) {
        addIssue(issues, "error", "phase5c_runtime_leak", file.path, `Runtime/official-case/workbench file must not reference Phase 5C-A token ${token}.`);
      }
    }
    if (PRODUCTION_ENABLING_PATTERN.test(file.text)) {
      addIssue(issues, "error", "phase5c_runtime_leak", file.path, "Runtime/official-case/workbench file must not enable runtime replacement, morphology/no-alternans acceptance, septal/RV/interdependence/RHF validation, or TriSeg adoption.");
    }
  }
}

function validateDocs(file: TextFileInput, issues: ValidationIssue[]): void {
  if (!file.text.includes("verify:myocardium-land-shadow-alternans-comparator-readiness")) {
    addIssue(issues, "error", "phase5c_docs_mention", file.path, "Docs must mention the Phase 5C-A Land shadow alternans comparator verifier.");
  }
  for (const required of [
    /Phase 5C-A/i,
    /feedforward shadow replay/i,
    /legacy fixed low-preload period-2 VLV trajectory/i,
    /Phase 4B-A synthetic prescribed protocol/i,
    /no runtime replacement|not live runtime replacement/i,
    /no official morphology pass|official morphology pass[^.]{0,80}not claimed/i,
    /no robust no-alternans|robust no-alternans[^.]{0,80}not claimed/i,
    /RV pressure overload[^.]{0,120}not covered|RV overload[^.]{0,120}not covered/i,
    /ventricular interdependence[^.]{0,120}not covered/i,
    /right-heart failure[^.]{0,120}not covered|RHF[^.]{0,120}not covered/i,
    /TriSeg[^.]{0,120}not covered|TriSeg[^.]{0,120}future/i,
  ] as const) {
    if (!required.test(file.text)) {
      addIssue(issues, "error", "phase5c_docs_boundary", file.path, `Docs must include Phase 5C-A boundary wording matching ${required}.`);
    }
  }
}

function validateNoProductionClaims(
  label: string,
  text: string,
  issues: ValidationIssue[],
): void {
  if (PRODUCTION_ENABLING_PATTERN.test(text)) {
    addIssue(issues, "error", "phase5c_forbidden_claim", label, "Production/runtime/morphology/no-alternans/septal/RV/interdependence/RHF/TriSeg enabling flag detected.");
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

function minFinite(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.min(...finite) : Number.NaN;
}

function formatFinite(value: number): string {
  return Number.isFinite(value) ? value.toPrecision(6) : "NaN";
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

function printReport(report: LandShadowAlternansComparatorValidationReport): void {
  const status = report.pass ? "PASS" : "FAIL";
  const artifactStatus = report.artifactGatePass ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 5C-A Land shadow alternans comparator validation ${status} `
    + `artifactGate=${artifactStatus} artifactStatus=${report.artifactGateStatus} `
    + `errors=${report.summary.errorCount} warnings=${report.summary.warningCount} `
    + `sections=${report.summary.readinessSectionCount} `
    + `sourceFiles=${report.summary.sourceFileCount} `
    + `integrationFiles=${report.summary.runtimeIntegrationFileCount} docs=${report.summary.docCount}`,
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
    "Usage: npm run verify:myocardium-land-shadow-alternans-comparator-readiness -- [--root=DIR]",
    "",
    "Validates the Phase 5C-A feedforward Land shadow replay artifact.",
    "This verifier reproduces the fixed legacy activeStress low-preload period-2 protocol, replays its VLV trace through a pure Land/thick-sphere-v2 report, keeps newMyocardiumCheck unsatisfied, pins Phase 4B-A and Phase 5B hashes, and rejects runtime/case/workbench leaks or final morphology/no-alternans claims.",
  ].join("\n"));
}

const runningUnderVitest = process.env.VITEST === "true" || process.env.VITEST_WORKER_ID !== undefined;
if (!runningUnderVitest) {
  const options = parseArgs(process.argv.slice(2));
  const report = validateLandShadowAlternansComparatorReadiness(
    loadLandShadowAlternansComparatorValidationInput(options.rootDir),
  );
  printReport(report);
  if (!report.pass) process.exitCode = 1;
}
