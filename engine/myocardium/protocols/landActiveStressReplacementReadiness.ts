import phase4ADossier from "@/data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json";
import ownerSelection from "@/data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json";
import protocolDescriptor from "@/data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS,
  MINIMAL_LOADED_AFTERLOAD_FAMILY,
  MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS,
  TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
  runMinimalLoadedAfterloadFamily,
  runMinimalLoadedAfterloadFamilyPhase3CReport,
  type MinimalLoadedAfterloadMemberDefinition,
  type MinimalLoadedAfterloadMemberId,
  type MinimalLoadedAfterloadMemberResult,
  type MinimalLoadedAfterloadProtocolReport,
} from "@/engine/myocardium/protocols/minimalLoadedAfterloadFamily";

export const LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID =
  "land-active-stress-replacement-phase4b-protocols-v1";
export const LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY =
  "shadow-replacement-readiness-only";
export const LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND = "thick-sphere-v2";
export const LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID =
  "thick-sphere-v2-explicit-external-septal-coupling";
export const LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID =
  "thick-sphere-spike-v1";
const BEAT_STABILITY_PRECONDITIONING_CYCLES = 6;
const BEAT_STABILITY_WARMUP_CYCLES = 1;
const BEAT_STABILITY_EVALUATED_CYCLES = 3;
const BEAT_STABILITY_DRIFT_RELATIVE_TOLERANCE = 0.05;
const BEAT_STABILITY_ALTERNANS_RELATIVE_TOLERANCE = 0.01;

export type LandActiveStressReplacementReadinessStatus =
  | "shadow-readiness-ready"
  | "shadow-readiness-review";

export type LandActiveStressReplacementSectionStatus =
  | "readiness-pass"
  | "readiness-fail";

export type LandActiveStressReplacementMetricValue =
  | number
  | string
  | boolean
  | readonly number[]
  | readonly string[]
  | readonly boolean[];

export type LandActiveStressReplacementReadinessSection = {
  readonly id: string;
  readonly status: LandActiveStressReplacementSectionStatus;
  readonly metrics: Record<string, LandActiveStressReplacementMetricValue>;
};

export type LandActiveStressReplacementMorphologyProxyOutcome =
  | "proxy-ready"
  | "proxy-review";

export type LandActiveStressReplacementMorphologyProxySummary = {
  readonly morphologyProxyOutcome: LandActiveStressReplacementMorphologyProxyOutcome;
  readonly memberIds: readonly MinimalLoadedAfterloadMemberId[];
  readonly peakInternalPressurePa: readonly number[];
  readonly meanInternalPressurePa: readonly number[];
  readonly peakAfterloadPressurePa: readonly number[];
  readonly strokeVolumeM3: readonly number[];
  readonly ejectionLikeWorkJ: readonly number[];
  readonly afterloadPressureOrdered: boolean;
  readonly internalPressureFinite: boolean;
  readonly strokeProxyNonDegenerate: boolean;
  readonly workProxyNonDegenerate: boolean;
  readonly officialMorphologyTargetStatus: "not-evaluated";
};

export type LandActiveStressReplacementBeatCycleMetric = {
  readonly cycleIndex: number;
  readonly role: "warmup" | "evaluated";
  readonly ok: boolean;
  readonly peakSourceActiveFiberStressPa: number;
  readonly peakWallActiveNominalStressPa: number;
  readonly peakInternalPressurePa: number;
  readonly strokeProxyM3: number;
  readonly ejectionLikeWorkJ: number;
  readonly finalCavityVolumeM3: number;
  readonly finalAfterloadPressurePa: number;
  readonly samples: number;
};

export type LandActiveStressReplacementBeatStabilitySummary = {
  readonly checkId: "prescribed-ca-beat-stability-no-alternans-smoke-v1";
  readonly claimBoundary: "prescribed-Ca beat stability smoke only";
  readonly cycleLengthSec: number;
  readonly stateCarryPolicy: "state-carry-chained-cycle-runs";
  readonly preconditioningCycles: typeof BEAT_STABILITY_PRECONDITIONING_CYCLES;
  readonly warmupCycles: typeof BEAT_STABILITY_WARMUP_CYCLES;
  readonly evaluatedCyclesRequired: typeof BEAT_STABILITY_EVALUATED_CYCLES;
  readonly evaluatedCycles: readonly LandActiveStressReplacementBeatCycleMetric[];
  readonly warmupCycle: LandActiveStressReplacementBeatCycleMetric;
  readonly cycleToCyclePeakStressRelativeDeltas: readonly number[];
  readonly cycleToCyclePeakPressureRelativeDeltas: readonly number[];
  readonly cycleToCycleStrokeProxyRelativeDeltas: readonly number[];
  readonly maxCycleToCycleRelativeDelta: number;
  readonly driftRelativeTolerance: typeof BEAT_STABILITY_DRIFT_RELATIVE_TOLERANCE;
  readonly alternansRelativeTolerance: typeof BEAT_STABILITY_ALTERNANS_RELATIVE_TOLERANCE;
  readonly alternansPatternDetected: boolean;
  readonly notCalciumCyclingValidation: true;
  readonly smokeReady: boolean;
};

export type LandActiveStressReplacementReadinessReport = {
  readonly protocolSetId: typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID;
  readonly phase: "Phase 4B-A";
  readonly claimBoundary: typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY;
  readonly readinessStatus: LandActiveStressReplacementReadinessStatus;
  readonly ownerAcceptanceStatus: "decision19-owner-selection-accepted-only";
  readonly selectedBackend: typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND;
  readonly selectedCandidateId: typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID;
  readonly productionRuntimeStatus: "not-live-runtime-replacement";
  readonly phase4BTissueHomogenizationStatus: "not-completed";
  readonly executableCoordinatePath: {
    readonly currentExecutablePath: "Phase 3 coordinate-family shadow readiness";
    readonly currentExecutableKinematicsModelId:
      typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID;
    readonly selectedBackendCompletionStatus: "selected-thick-sphere-v2-not-completed";
  };
  readonly sourceBoundary: {
    readonly decision19Accepted: boolean;
    readonly phase4ADossierFrozen: boolean;
    readonly descriptorStatusBoundary: string;
    readonly descriptorClaimBoundary: string;
    readonly descriptorSourceRefsComplete: boolean;
  };
  readonly landPipelineReadiness: {
    readonly phase3CClosurePass: boolean;
    readonly sourceKinematicsVirtualPowerHealthReady: boolean;
    readonly allMembersOk: boolean;
    readonly phase3CStableSummaryHash: string;
  };
  readonly morphologyProxy: LandActiveStressReplacementMorphologyProxySummary;
  readonly prescribedCaBeatStability: LandActiveStressReplacementBeatStabilitySummary;
  readonly legacyComparatorContext: {
    readonly status: "not-run-reference-only";
    readonly reason: "No legacy agreement pass/fail is used for this shadow readiness gate.";
  };
  readonly sections: readonly LandActiveStressReplacementReadinessSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

type MorphologyProxyBuild = {
  readonly summary: LandActiveStressReplacementMorphologyProxySummary;
  readonly section: LandActiveStressReplacementReadinessSection;
};

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json",
  "data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json",
  "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json",
  "data/myocardium/protocols/calcium-land-phase2c-prescribed-shortening-protocols.json",
  "data/myocardium/protocols/land2017-phase1c-source-protocols.json",
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
] as const;

export function runLandActiveStressReplacementReadinessReport():
  LandActiveStressReplacementReadinessReport {
  const phase3CReport = runMinimalLoadedAfterloadFamilyPhase3CReport();
  const descriptorSourceBoundarySection = runDescriptorSourceBoundarySection();
  const landPipelineReadinessSection = runLandPipelineReadinessSection(phase3CReport);
  const morphologyProxy = buildMorphologyProxy(phase3CReport);
  const beatStability = runPrescribedCaBeatStabilitySmoke();
  const beatStabilitySection = section(
    "prescribed-ca-beat-stability-smoke-v1",
    beatStability.smokeReady,
    {
      claimBoundary: beatStability.claimBoundary,
      cycleLengthSec: beatStability.cycleLengthSec,
      stateCarryPolicy: beatStability.stateCarryPolicy,
      preconditioningCycles: beatStability.preconditioningCycles,
      warmupCycles: beatStability.warmupCycles,
      evaluatedCycleCount: beatStability.evaluatedCycles.length,
      evaluatedCyclesRequired: beatStability.evaluatedCyclesRequired,
      peakSourceActiveFiberStressPa: beatStability.evaluatedCycles.map(
        (cycle) => cycle.peakSourceActiveFiberStressPa,
      ),
      peakInternalPressurePa: beatStability.evaluatedCycles.map(
        (cycle) => cycle.peakInternalPressurePa,
      ),
      strokeProxyM3: beatStability.evaluatedCycles.map((cycle) => cycle.strokeProxyM3),
      cycleToCyclePeakStressRelativeDeltas: beatStability.cycleToCyclePeakStressRelativeDeltas,
      cycleToCyclePeakPressureRelativeDeltas: beatStability.cycleToCyclePeakPressureRelativeDeltas,
      cycleToCycleStrokeProxyRelativeDeltas: beatStability.cycleToCycleStrokeProxyRelativeDeltas,
      maxCycleToCycleRelativeDelta: beatStability.maxCycleToCycleRelativeDelta,
      driftRelativeTolerance: beatStability.driftRelativeTolerance,
      alternansRelativeTolerance: beatStability.alternansRelativeTolerance,
      alternansPatternDetected: beatStability.alternansPatternDetected,
      notCalciumCyclingValidation: beatStability.notCalciumCyclingValidation,
    },
  );
  const deterministicReplaySection = runDeterministicReplaySection();
  const sections = [
    descriptorSourceBoundarySection,
    landPipelineReadinessSection,
    morphologyProxy.section,
    beatStabilitySection,
    deterministicReplaySection,
  ] as const;
  const readinessPass = sections.every((candidate) => candidate.status === "readiness-pass");
  const landPipelineSourceSection = phase3CReport.sections.find(
    (candidate) => candidate.id === "source-kinematics-virtual-power-health-v1",
  );
  const reportWithoutHash = {
    protocolSetId: LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
    phase: "Phase 4B-A",
    claimBoundary: LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY,
    readinessStatus: readinessPass ? "shadow-readiness-ready" : "shadow-readiness-review",
    selectedBackend: LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND,
    selectedCandidateId: LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID,
    sourceBoundary: descriptorSourceBoundarySection.metrics,
    landPipelineReadiness: {
      phase3CClosurePass: phase3CReport.closurePass,
      sourceKinematicsVirtualPowerHealthReady:
        landPipelineSourceSection?.status === "closure-pass",
      allMembersOk: phase3CReport.memberResults.every((member) => member.ok),
      phase3CStableSummaryHash: phase3CReport.stableSummaryHash,
    },
    morphologyProxy: morphologyProxy.summary,
    prescribedCaBeatStability: compactBeatStabilityForHash(beatStability),
    sections: sections.map((candidate) => ({
      id: candidate.id,
      status: candidate.status,
      metrics: candidate.metrics,
    })),
    readinessPass,
  };

  return {
    protocolSetId: LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
    phase: "Phase 4B-A",
    claimBoundary: LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY,
    readinessStatus: readinessPass ? "shadow-readiness-ready" : "shadow-readiness-review",
    ownerAcceptanceStatus: "decision19-owner-selection-accepted-only",
    selectedBackend: LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND,
    selectedCandidateId: LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID,
    productionRuntimeStatus: "not-live-runtime-replacement",
    phase4BTissueHomogenizationStatus: "not-completed",
    executableCoordinatePath: {
      currentExecutablePath: "Phase 3 coordinate-family shadow readiness",
      currentExecutableKinematicsModelId:
        LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID,
      selectedBackendCompletionStatus: "selected-thick-sphere-v2-not-completed",
    },
    sourceBoundary: {
      decision19Accepted:
        descriptorSourceBoundarySection.metrics.decision19Accepted === true,
      phase4ADossierFrozen:
        descriptorSourceBoundarySection.metrics.phase4ADossierFrozen === true,
      descriptorStatusBoundary: protocolDescriptor.statusBoundary,
      descriptorClaimBoundary: protocolDescriptor.claimBoundary,
      descriptorSourceRefsComplete:
        descriptorSourceBoundarySection.metrics.descriptorSourceRefsComplete === true,
    },
    landPipelineReadiness: {
      phase3CClosurePass: phase3CReport.closurePass,
      sourceKinematicsVirtualPowerHealthReady:
        landPipelineSourceSection?.status === "closure-pass",
      allMembersOk: phase3CReport.memberResults.every((member) => member.ok),
      phase3CStableSummaryHash: phase3CReport.stableSummaryHash,
    },
    morphologyProxy: morphologyProxy.summary,
    prescribedCaBeatStability: beatStability,
    legacyComparatorContext: {
      status: "not-run-reference-only",
      reason: "No legacy agreement pass/fail is used for this shadow readiness gate.",
    },
    sections,
    readinessPass,
    stableSummaryHash: stableHash(sanitizeForStableHash(reportWithoutHash)),
  };
}

function runDescriptorSourceBoundarySection(): LandActiveStressReplacementReadinessSection {
  const descriptorSourcePaths = protocolDescriptor.sourceDocuments.map((source) => source.path);
  const descriptorSourceRefsComplete = REQUIRED_DESCRIPTOR_SOURCE_PATHS.every((sourcePath) =>
    descriptorSourcePaths.includes(sourcePath),
  );
  const decision19Accepted =
    ownerSelection.status === "ACCEPTED"
    && ownerSelection.decisionId === 19
    && ownerSelection.selectedBackend === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND
    && ownerSelection.selectedCandidateId === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID;
  const phase4ADossierFrozen =
    phase4ADossier.dossierId === "production-mechanics-phase4a-dossier-v1"
    && phase4ADossier.decision19Status === "PENDING OWNER"
    && phase4ADossier.ownerAcceptanceStatus === "not-owner-acceptance"
    && phase4ADossier.selectedCandidateId === null
    && phase4ADossier.recommendedCandidateId === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID;
  const descriptorBoundaryOk =
    protocolDescriptor.protocolSetId === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID
    && protocolDescriptor.phase === "Phase 4B-A"
    && protocolDescriptor.statusBoundary === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY
    && protocolDescriptor.claimBoundary === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_CLAIM_BOUNDARY
    && protocolDescriptor.selectedBackend === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_BACKEND
    && protocolDescriptor.selectedCandidateId === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_SELECTED_CANDIDATE_ID
    && protocolDescriptor.executableCoordinatePath.currentExecutableKinematicsModelId
      === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID
    && /not completion of thick-sphere-v2/i.test(
      protocolDescriptor.executableCoordinatePath.namingGapDisclosure,
    )
    && protocolDescriptor.protocolSettings.useProductionMechanics === false
    && protocolDescriptor.protocolSettings.useModelCoreRuntimeWiring === false
    && protocolDescriptor.protocolSettings.useOfficialCaseWiring === false;
  return section(
    "descriptor-source-boundary-v1",
    decision19Accepted && phase4ADossierFrozen && descriptorSourceRefsComplete && descriptorBoundaryOk,
    {
      protocolSetId: protocolDescriptor.protocolSetId,
      phase: protocolDescriptor.phase,
      claimBoundary: protocolDescriptor.claimBoundary,
      statusBoundary: protocolDescriptor.statusBoundary,
      selectedBackend: protocolDescriptor.selectedBackend,
      selectedCandidateId: protocolDescriptor.selectedCandidateId,
      decision19Accepted,
      phase4ADossierFrozen,
      descriptorSourceRefsComplete,
      requiredSourcePaths: [...REQUIRED_DESCRIPTOR_SOURCE_PATHS],
      executableCurrentKinematicsModelId:
        protocolDescriptor.executableCoordinatePath.currentExecutableKinematicsModelId,
      selectedBackendCompletionStatus:
        protocolDescriptor.executableCoordinatePath.selectedBackendCompletionStatus,
      productionMechanicsEnabled: protocolDescriptor.protocolSettings.useProductionMechanics,
      modelCoreRuntimeWiringEnabled: protocolDescriptor.protocolSettings.useModelCoreRuntimeWiring,
      officialCaseWiringEnabled: protocolDescriptor.protocolSettings.useOfficialCaseWiring,
    },
  );
}

function runLandPipelineReadinessSection(
  phase3CReport: MinimalLoadedAfterloadProtocolReport,
): LandActiveStressReplacementReadinessSection {
  const sourceHealth = phase3CReport.sections.find(
    (candidate) => candidate.id === "source-kinematics-virtual-power-health-v1",
  );
  const allMembersOk = phase3CReport.memberResults.every((member) => member.ok);
  const allFinite = phase3CReport.memberResults.every((member) =>
    member.samples.every((sample) =>
      [
        sample.internalPressurePa,
        sample.afterloadPressurePa,
        sample.nextAfterloadPressurePa,
        sample.sourceActiveFiberStressPa,
        sample.wallActiveNominalStressPa,
        sample.sourceActivePowerDensityWPerM3,
      ].every(Number.isFinite)
      && sample.landHealthFinite
      && sample.kinematicsFinite
      && sample.inCalibrationDomain,
    ),
  );
  return section(
    "land-pipeline-health-readiness-v1",
    phase3CReport.closurePass
      && allMembersOk
      && allFinite
      && sourceHealth?.status === "closure-pass",
    {
      phase3CProtocolSetId: phase3CReport.protocolSetId,
      phase3CClaimBoundary: phase3CReport.claimBoundary,
      phase3CEvidenceStatus: phase3CReport.evidenceStatus,
      phase3CClosurePass: phase3CReport.closurePass,
      sourceKinematicsVirtualPowerHealthStatus: sourceHealth?.status ?? "missing",
      allMembersOk,
      allFinite,
      memberIds: phase3CReport.memberResults.map((member) => member.id),
      peakSourceActiveFiberStressPa: phase3CReport.memberResults.map(
        (member) => member.metrics.peakSourceActiveFiberStressPa,
      ),
      peakWallActiveNominalStressPa: phase3CReport.memberResults.map(
        (member) => member.metrics.peakWallActiveNominalStressPa,
      ),
      maxVirtualPowerResidualW: phase3CReport.memberResults.map(
        (member) => member.metrics.maxVirtualPowerResidualW,
      ),
      phase3CStableSummaryHash: phase3CReport.stableSummaryHash,
    },
  );
}

function buildMorphologyProxy(
  phase3CReport: MinimalLoadedAfterloadProtocolReport,
): MorphologyProxyBuild {
  const ordered = MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS.map((id) =>
    requireMember(phase3CReport.memberResults, id),
  );
  const peakInternalPressurePa = ordered.map((member) => member.metrics.peakInternalPressurePa);
  const meanInternalPressurePa = ordered.map((member) => member.metrics.meanInternalPressurePa);
  const peakAfterloadPressurePa = ordered.map((member) => member.metrics.peakAfterloadPressurePa);
  const strokeVolumeM3 = ordered.map((member) => member.metrics.strokeVolumeM3);
  const ejectionLikeWorkJ = ordered.map((member) => member.metrics.ejectionLikeWorkJ);
  const afterloadPressureOrdered = strictlyIncreasing(peakAfterloadPressurePa);
  const internalPressureFinite = [...peakInternalPressurePa, ...meanInternalPressurePa].every(Number.isFinite);
  const strokeProxyNonDegenerate =
    strokeVolumeM3.every((value) => Number.isFinite(value) && value >= 0)
    && !allClose(strokeVolumeM3, 1e-12);
  const workProxyNonDegenerate =
    ejectionLikeWorkJ.every((value) => Number.isFinite(value) && value >= 0)
    && !allClose(ejectionLikeWorkJ, 1e-9);
  const morphologyProxyOutcome:
    LandActiveStressReplacementMorphologyProxyOutcome =
      afterloadPressureOrdered
      && internalPressureFinite
      && strokeProxyNonDegenerate
      && workProxyNonDegenerate
        ? "proxy-ready"
        : "proxy-review";
  const summary: LandActiveStressReplacementMorphologyProxySummary = {
    morphologyProxyOutcome,
    memberIds: ordered.map((member) => member.id),
    peakInternalPressurePa,
    meanInternalPressurePa,
    peakAfterloadPressurePa,
    strokeVolumeM3,
    ejectionLikeWorkJ,
    afterloadPressureOrdered,
    internalPressureFinite,
    strokeProxyNonDegenerate,
    workProxyNonDegenerate,
    officialMorphologyTargetStatus: "not-evaluated",
  };
  return {
    summary,
    section: section(
      "morphology-proxy-readiness-v1",
      morphologyProxyOutcome === "proxy-ready",
      {
        morphologyProxyOutcome,
        memberIds: summary.memberIds,
        peakInternalPressurePa,
        meanInternalPressurePa,
        peakAfterloadPressurePa,
        strokeVolumeM3,
        ejectionLikeWorkJ,
        afterloadPressureOrdered,
        internalPressureFinite,
        strokeProxyNonDegenerate,
        workProxyNonDegenerate,
        officialMorphologyTargetStatus: summary.officialMorphologyTargetStatus,
      },
    ),
  };
}

function runPrescribedCaBeatStabilitySmoke():
  LandActiveStressReplacementBeatStabilitySummary {
  const carriedResults = runStateCarryNormalAfterloadCycles(
    BEAT_STABILITY_PRECONDITIONING_CYCLES
      + BEAT_STABILITY_WARMUP_CYCLES
      + BEAT_STABILITY_EVALUATED_CYCLES,
  );
  const warmupCycleIndex = BEAT_STABILITY_PRECONDITIONING_CYCLES;
  const warmupCycle = buildStateCarryCycleMetric(
    warmupCycleIndex,
    carriedResults[warmupCycleIndex],
    "warmup",
  );
  const evaluatedCycles = Array.from(
    { length: BEAT_STABILITY_EVALUATED_CYCLES },
    (_, index) => {
      const cycleIndex =
        BEAT_STABILITY_PRECONDITIONING_CYCLES
        + BEAT_STABILITY_WARMUP_CYCLES
        + index;
      return buildStateCarryCycleMetric(cycleIndex, carriedResults[cycleIndex], "evaluated");
    },
  );
  const reportedCycles = [warmupCycle, ...evaluatedCycles];
  const stress = evaluatedCycles.map((cycle) => cycle.peakSourceActiveFiberStressPa);
  const pressure = evaluatedCycles.map((cycle) => cycle.peakInternalPressurePa);
  const stroke = evaluatedCycles.map((cycle) => cycle.strokeProxyM3);
  const cycleToCyclePeakStressRelativeDeltas = relativeDeltas(stress);
  const cycleToCyclePeakPressureRelativeDeltas = relativeDeltas(pressure);
  const cycleToCycleStrokeProxyRelativeDeltas = relativeDeltas(stroke);
  const finiteCycles = reportedCycles.every((cycle) =>
    cycle.ok
    && cycle.samples > 0
    && [
      cycle.peakSourceActiveFiberStressPa,
      cycle.peakWallActiveNominalStressPa,
      cycle.peakInternalPressurePa,
      cycle.strokeProxyM3,
      cycle.ejectionLikeWorkJ,
      cycle.finalCavityVolumeM3,
      cycle.finalAfterloadPressurePa,
    ].every(Number.isFinite),
  );
  const finiteDeltas = [
    ...cycleToCyclePeakStressRelativeDeltas,
    ...cycleToCyclePeakPressureRelativeDeltas,
    ...cycleToCycleStrokeProxyRelativeDeltas,
  ].every(Number.isFinite);
  const alternansPatternDetected =
    detectsAlternans(stress, BEAT_STABILITY_ALTERNANS_RELATIVE_TOLERANCE)
    || detectsAlternans(pressure, BEAT_STABILITY_ALTERNANS_RELATIVE_TOLERANCE)
    || detectsAlternans(stroke, BEAT_STABILITY_ALTERNANS_RELATIVE_TOLERANCE);
  const maxRelativeDelta = Math.max(
    0,
    ...cycleToCyclePeakStressRelativeDeltas,
    ...cycleToCyclePeakPressureRelativeDeltas,
    ...cycleToCycleStrokeProxyRelativeDeltas,
  );
  const smokeReady =
    warmupCycle.role === "warmup"
    && evaluatedCycles.length === 3
    && evaluatedCycles.every((cycle) => cycle.role === "evaluated")
    && finiteCycles
    && finiteDeltas
    && maxRelativeDelta <= BEAT_STABILITY_DRIFT_RELATIVE_TOLERANCE
    && !alternansPatternDetected;

  return {
    checkId: "prescribed-ca-beat-stability-no-alternans-smoke-v1",
    claimBoundary: "prescribed-Ca beat stability smoke only",
    cycleLengthSec: MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS.cycleLengthSec,
    stateCarryPolicy: "state-carry-chained-cycle-runs",
    preconditioningCycles: BEAT_STABILITY_PRECONDITIONING_CYCLES,
    warmupCycles: BEAT_STABILITY_WARMUP_CYCLES,
    evaluatedCyclesRequired: BEAT_STABILITY_EVALUATED_CYCLES,
    warmupCycle,
    evaluatedCycles,
    cycleToCyclePeakStressRelativeDeltas,
    cycleToCyclePeakPressureRelativeDeltas,
    cycleToCycleStrokeProxyRelativeDeltas,
    maxCycleToCycleRelativeDelta: maxRelativeDelta,
    driftRelativeTolerance: BEAT_STABILITY_DRIFT_RELATIVE_TOLERANCE,
    alternansRelativeTolerance: BEAT_STABILITY_ALTERNANS_RELATIVE_TOLERANCE,
    alternansPatternDetected,
    notCalciumCyclingValidation: true,
    smokeReady,
  };
}

function runStateCarryNormalAfterloadCycles(
  totalCycles: number,
): readonly MinimalLoadedAfterloadMemberResult[] {
  const normalAfterload = requireFamilyDefinition("afterload-normal");
  const cycleLengthSec = MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS.cycleLengthSec;
  const results: MinimalLoadedAfterloadMemberResult[] = [];
  let initialCavityVolumeM3 =
    MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS.initialCavityVolumeM3;
  let initialAfterloadPressurePa = normalAfterload.parameters.initialAfterloadPressurePa;
  let initialLandState: ArrayLike<number> | undefined;
  let initialCalciumState: ArrayLike<number> | undefined;

  for (let cycleIndex = 0; cycleIndex < totalCycles; cycleIndex += 1) {
    const fixedProtocolSettings = {
      ...MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS,
      durationSec: cycleLengthSec,
      initialCavityVolumeM3,
    };
    const family: readonly MinimalLoadedAfterloadMemberDefinition[] = [
      {
        id: normalAfterload.id,
        afterloadModelId: TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
        parameters: {
          ...normalAfterload.parameters,
          initialAfterloadPressurePa,
        },
        fixedProtocolSettings,
      },
    ];
    const [result] = runMinimalLoadedAfterloadFamily({
      fixedProtocolSettings,
      family,
      initialLandState,
      initialCalciumState,
    });
    results.push(result);
    if (!result.ok) break;
    initialCavityVolumeM3 = result.finalCavityVolumeM3;
    initialAfterloadPressurePa = result.finalAfterloadPressurePa;
    initialLandState = result.finalLandState;
    initialCalciumState = result.finalCalciumState;
  }

  return results;
}

function buildStateCarryCycleMetric(
  cycleIndex: number,
  result: MinimalLoadedAfterloadMemberResult | undefined,
  role: "warmup" | "evaluated",
): LandActiveStressReplacementBeatCycleMetric {
  if (result === undefined) {
    return {
      cycleIndex,
      role,
      ok: false,
      peakSourceActiveFiberStressPa: Number.NaN,
      peakWallActiveNominalStressPa: Number.NaN,
      peakInternalPressurePa: Number.NaN,
      strokeProxyM3: Number.NaN,
      ejectionLikeWorkJ: Number.NaN,
      finalCavityVolumeM3: Number.NaN,
      finalAfterloadPressurePa: Number.NaN,
      samples: 0,
    };
  }
  return {
    cycleIndex,
    role,
    ok: result.ok,
    peakSourceActiveFiberStressPa: result.metrics.peakSourceActiveFiberStressPa,
    peakWallActiveNominalStressPa: result.metrics.peakWallActiveNominalStressPa,
    peakInternalPressurePa: result.metrics.peakInternalPressurePa,
    strokeProxyM3: result.metrics.strokeVolumeM3,
    ejectionLikeWorkJ: result.metrics.ejectionLikeWorkJ,
    finalCavityVolumeM3: result.finalCavityVolumeM3,
    finalAfterloadPressurePa: result.finalAfterloadPressurePa,
    samples: result.metrics.samples,
  };
}

function runDeterministicReplaySection(): LandActiveStressReplacementReadinessSection {
  const firstHash = stableHash(sanitizeForStableHash(buildReplayPayload()));
  const secondHash = stableHash(sanitizeForStableHash(buildReplayPayload()));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
    stableHashUtility: "engine/myocardium/kinematics/stableHash",
  });
}

function buildReplayPayload(): unknown {
  const phase3CReport = runMinimalLoadedAfterloadFamilyPhase3CReport();
  const morphologyProxy = buildMorphologyProxy(phase3CReport);
  const beatStability = runPrescribedCaBeatStabilitySmoke();
  return {
    phase3CStableSummaryHash: phase3CReport.stableSummaryHash,
    morphologyProxy: morphologyProxy.summary,
    prescribedCaBeatStability: compactBeatStabilityForHash(beatStability),
  };
}

function compactBeatStabilityForHash(
  summary: LandActiveStressReplacementBeatStabilitySummary,
): unknown {
  return {
    checkId: summary.checkId,
    cycleLengthSec: summary.cycleLengthSec,
    stateCarryPolicy: summary.stateCarryPolicy,
    evaluatedCycles: summary.evaluatedCycles,
    cycleToCyclePeakStressRelativeDeltas: summary.cycleToCyclePeakStressRelativeDeltas,
    cycleToCyclePeakPressureRelativeDeltas: summary.cycleToCyclePeakPressureRelativeDeltas,
    cycleToCycleStrokeProxyRelativeDeltas: summary.cycleToCycleStrokeProxyRelativeDeltas,
    maxCycleToCycleRelativeDelta: summary.maxCycleToCycleRelativeDelta,
    driftRelativeTolerance: summary.driftRelativeTolerance,
    alternansRelativeTolerance: summary.alternansRelativeTolerance,
    alternansPatternDetected: summary.alternansPatternDetected,
    smokeReady: summary.smokeReady,
  };
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, LandActiveStressReplacementMetricValue>,
): LandActiveStressReplacementReadinessSection {
  return {
    id,
    status: ok ? "readiness-pass" : "readiness-fail",
    metrics,
  };
}

function requireMember(
  members: readonly MinimalLoadedAfterloadMemberResult[],
  id: MinimalLoadedAfterloadMemberId,
): MinimalLoadedAfterloadMemberResult {
  const member = members.find((candidate) => candidate.id === id);
  if (member === undefined) {
    throw new Error(`Missing minimal loaded afterload member ${id}`);
  }
  return member;
}

function requireFamilyDefinition(
  id: MinimalLoadedAfterloadMemberId,
): MinimalLoadedAfterloadMemberDefinition {
  const definition = MINIMAL_LOADED_AFTERLOAD_FAMILY.find((candidate) => candidate.id === id);
  if (definition === undefined) {
    throw new Error(`Missing minimal loaded afterload family definition ${id}`);
  }
  return definition;
}

function relativeDeltas(values: readonly number[]): readonly number[] {
  const out: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    const scale = Math.max(1e-12, Math.abs(previous));
    out.push(Math.abs(current - previous) / scale);
  }
  return out;
}

function detectsAlternans(values: readonly number[], relativeTolerance: number): boolean {
  if (values.length < 3) return false;
  const firstDelta = values[1] - values[0];
  const secondDelta = values[2] - values[1];
  if (firstDelta === 0 || secondDelta === 0) return false;
  const firstRelative = Math.abs(firstDelta) / Math.max(1e-12, Math.abs(values[0]));
  const secondRelative = Math.abs(secondDelta) / Math.max(1e-12, Math.abs(values[1]));
  return Math.sign(firstDelta) !== Math.sign(secondDelta)
    && firstRelative > relativeTolerance
    && secondRelative > relativeTolerance;
}

function strictlyIncreasing(values: readonly number[]): boolean {
  return values.length > 0
    && values.every((value) => Number.isFinite(value))
    && values.every((value, index) => index === 0 || value > values[index - 1]);
}

function allClose(values: readonly number[], tolerance: number): boolean {
  if (values.length <= 1) return true;
  const first = values[0];
  return values.every((value) => Math.abs(value - first) <= tolerance);
}
