import phase4ADossier from "@/data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json";
import ownerSelection from "@/data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json";
import protocolDescriptor from "@/data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json";
import { IDENTITY_FIBER_NOMINAL_V1_PARAMS, IdentityFiberNominalV1 } from "@/engine/myocardium/homogenization";
import {
  KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
  KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_V1_ID,
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_PARAMETER_SETS,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
  ThickSphereV2SelectedBackend,
  computeThickSphereV2SelectedCandidateStableHash,
  computeThickSphereV2SelectedParameterSetStableHash,
  evaluateThickSphereV2SelectedBackend,
  type ThickSphereV2SelectedParameterSet,
} from "@/engine/myocardium/kinematics";
import type { MyocardialKinematicsOutput } from "@/engine/myocardium/kinematics";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID,
  PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
  VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
  evaluatePassiveExponentialEnergyV1,
  evaluateVirtualPowerGeneralizedForceV1,
} from "@/engine/myocardium/mechanics";
import type { GeneralizedForceOutput, PassiveMaterialOutput } from "@/engine/myocardium/mechanics";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import type { LandSourceOutput } from "@/engine/myocardium/myofilament/land2017/types";
import {
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID,
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
  runLandActiveStressReplacementReadinessReport,
} from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import {
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID,
  runTissueHomogenizationReadinessReport,
} from "@/engine/myocardium/protocols/tissueHomogenizationReadiness";
import {
  PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID,
  runPassiveEnergyReadinessReport,
} from "@/engine/myocardium/protocols/passiveEnergyReadiness";
import {
  GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID,
  runGeneralizedForceMapperReadinessReport,
} from "@/engine/myocardium/protocols/generalizedForceMapperReadiness";

export const SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID =
  "selected-mechanics-calibration-phase4d-protocols-v1";
export const SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE = "Phase 4D";
export const SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY =
  "selected-mechanics-calibration-readiness-only";
export const SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM =
  "selected-thick-sphere-v2-calibration-candidate-executable";

export type SelectedMechanicsCalibrationReadinessStatus =
  | "calibration-readiness-ready"
  | "calibration-readiness-review";

export type SelectedMechanicsCalibrationSectionStatus =
  | "readiness-pass"
  | "readiness-fail";

export type SelectedMechanicsCalibrationReadinessSection = {
  readonly id: string;
  readonly status: SelectedMechanicsCalibrationSectionStatus;
  readonly metrics: Record<string, unknown>;
};

export type SelectedMechanicsGeometrySample = {
  readonly ventricle: "LV" | "RV";
  readonly coordinateId: string;
  readonly parameterSetId: string;
  readonly cavityVolumeM3: number;
  readonly sarcomereLengthM: number;
  readonly fiberEngineeringStrain: number;
  readonly dStrainDVolume: number;
  readonly finite: boolean;
  readonly inCalibrationDomain: boolean;
};

export type SelectedMechanicsFiniteDifferenceSample = {
  readonly ventricle: "LV" | "RV";
  readonly cavityVolumeM3: number;
  readonly finiteDifferenceScheme:
    | "central-in-domain"
    | "forward-in-domain"
    | "backward-in-domain";
  readonly analyticDStrainDVolume: number;
  readonly finiteDifferenceDStrainDVolume: number;
  readonly residualAbs: number;
};

export type SelectedMechanicsGeometryClosure = {
  readonly backendId: typeof THICK_SPHERE_V2_SELECTED_BACKEND_ID;
  readonly selectedCandidateId: typeof THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID;
  readonly lvParameterSetId:
    typeof KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID;
  readonly rvParameterSetId:
    typeof KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID;
  readonly lvParameterSetStableHash: string;
  readonly rvParameterSetStableHash: string;
  readonly candidateStableHash: string;
  readonly phase3SpikeParameterSetId: typeof THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID;
  readonly phase3SpikeParameterSetStableHash: string;
  readonly idsDistinctFromPhase3Spike: boolean;
  readonly hashesDistinctFromPhase3Spike: boolean;
  readonly candidateStableHashRecomputes: boolean;
  readonly parameterHashesRecompute: boolean;
  readonly samples: readonly SelectedMechanicsGeometrySample[];
  readonly finiteDifferenceSamples: readonly SelectedMechanicsFiniteDifferenceSample[];
  readonly maxFiniteDifferenceResidual: number;
  readonly finiteDifferenceTolerance: number;
  readonly finiteStrain: boolean;
  readonly allSamplesInCalibrationDomain: boolean;
  readonly analyticDerivativeMatchesFiniteDifference: boolean;
  readonly pass: boolean;
};

export type SelectedMechanicsCompositionSmokeSample = {
  readonly ventricle: "LV" | "RV";
  readonly coordinateId: string;
  readonly coordinateUnit: "m3";
  readonly cavityVolumeM3: number;
  readonly coordinateRateM3PerSec: number;
  readonly fiberEngineeringStrain: number;
  readonly fiberEngineeringStrainRatePerSec: number;
  readonly landSourceParameterSetId: typeof LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID;
  readonly fixedLandTrefPa: number;
  readonly sourceActiveFiberStressPa: number;
  readonly wallActiveNominalStressPa: number;
  readonly passiveModelId: typeof PASSIVE_EXPONENTIAL_ENERGY_V1_ID;
  readonly passiveParameterSetId:
    typeof PASSIVE_EXPONENTIAL_ENERGY_PHASE4C_A_CANDIDATE_PARAMETER_SET_ID;
  readonly passiveNominalStressPa: number;
  readonly viscousNominalStressPa: number;
  readonly mapperModelId: typeof VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID;
  readonly conjugateForceSI: number;
  readonly pressureMapPa: number;
  readonly pressureMapFinite: boolean;
  readonly virtualPowerResidualW: number;
  readonly finite: boolean;
};

export type SelectedMechanicsCompositionSmoke = {
  readonly samples: readonly SelectedMechanicsCompositionSmokeSample[];
  readonly maxVirtualPowerResidualAbsW: number;
  readonly virtualPowerResidualToleranceW: number;
  readonly allPressureMapsFinite: boolean;
  readonly allSamplesFinite: boolean;
  readonly pass: boolean;
};

export type SelectedMechanicsCalibrationReadinessReport = {
  readonly protocolSetId: typeof SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID;
  readonly phase: typeof SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE;
  readonly claimBoundary: typeof SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY;
  readonly readinessStatus: SelectedMechanicsCalibrationReadinessStatus;
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly decision4Status: "PENDING OWNER";
  readonly decision5Status: "PENDING OWNER";
  readonly decision6Status: "PENDING OWNER";
  readonly decision8Status: "PENDING OWNER";
  readonly decision19Status: "ACCEPTED";
  readonly decision19ReuseStatus: "accepted-owner-selection-read-only";
  readonly phase4AFrozenStatus: "frozen-read-only";
  readonly selectedThickSphereV2CalibrationCandidateExecutableStatus:
    typeof SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM;
  readonly selectedThickSphereV2CalibrationCandidate: {
    readonly backendId: typeof THICK_SPHERE_V2_SELECTED_BACKEND_ID;
    readonly candidateId: typeof THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID;
    readonly executableClaim:
      typeof SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM;
    readonly productionCompletionStatus: "not-claimed";
    readonly runtimeWiringStatus: "not-runtime-wired";
    readonly phase3SpikeAliasStatus: "not-an-alias";
    readonly candidateStableHash: string;
    readonly lvParameterSetStableHash: string;
    readonly rvParameterSetStableHash: string;
  };
  readonly sourceDecisionBoundary: {
    readonly decision19AcceptedReadOnly: boolean;
    readonly phase4ADossierFrozenReadOnly: boolean;
    readonly pendingOwnerDecisionIds: readonly number[];
    readonly sourceRefsComplete: boolean;
  };
  readonly frozenPhase4BAExecutableEvidence: {
    readonly reusePolicy: "read-only";
    readonly executableKinematicsModelId: typeof THICK_SPHERE_SPIKE_V1_ID;
    readonly selectedThickSphereV2CandidateCurrentExecutableStatus:
      typeof SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM;
  };
  readonly calibrationFreedomMatrix: {
    readonly landSourceParameterSetId:
      typeof LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID;
    readonly fixedLandTrefPa: number;
    readonly landSourceParameterSetStableHash: string;
    readonly fixedLandSourceTref: true;
    readonly allowFreeHomogenizationGain: false;
    readonly allowFreePressureGain: false;
    readonly allowFreeGeometryGain: false;
    readonly targetPacksRole: "measurement-hooks-only";
    readonly targetPackAcceptanceStatus: "not-claimed";
    readonly pass: boolean;
  };
  readonly geometryClosure: SelectedMechanicsGeometryClosure;
  readonly mechanicsCompositionSmoke: SelectedMechanicsCompositionSmoke;
  readonly priorGateEvidence: {
    readonly phase4BAReadinessPass: boolean;
    readonly phase4BAProtocolSetId: typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID;
    readonly phase4BAStableSummaryHash: string;
    readonly phase4BAExecutableKinematicsModelId: typeof THICK_SPHERE_SPIKE_V1_ID;
    readonly phase4BBReadinessPass: boolean;
    readonly phase4BBProtocolSetId: typeof LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID;
    readonly phase4BBStableSummaryHash: string;
    readonly phase4CAReadinessPass: boolean;
    readonly phase4CAProtocolSetId: typeof PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID;
    readonly phase4CAStableSummaryHash: string;
    readonly phase4CBReadinessPass: boolean;
    readonly phase4CBProtocolSetId: typeof GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID;
    readonly phase4CBStableSummaryHash: string;
  };
  readonly morphologyNoAlternansBoundary: {
    readonly measurementHooksStatus: "present-hooks-only";
    readonly measurementHooks: readonly string[];
    readonly phase4BABeatStabilityReusePolicy: "read-only";
    readonly phase4BABeatStabilitySmokeReady: boolean;
    readonly phase4BABeatStabilityCheckId: "prescribed-ca-beat-stability-no-alternans-smoke-v1";
    readonly phase4BANotCalciumCyclingValidation: true;
    readonly officialMorphologyOutcome: "not-claimed";
    readonly robustNoAlternans: "not-claimed";
    readonly calciumCyclingAlternansValidation: "not-claimed";
  };
  readonly externalSeptalCouplingBoundary: {
    readonly interfaceStatus: "interface-and-provenance-only";
    readonly implementationStatus: "not-implemented";
    readonly validationStatus: "not-claimed";
    readonly septalCoordinateStatus: "not-implemented";
    readonly biventricularCouplingStatus: "not-implemented";
    readonly rvPressureOverloadStatus: "not-claimed";
    readonly septalBowingStatus: "not-claimed";
    readonly ventricularInterdependenceStatus: "not-claimed";
    readonly rightHeartFailureStatus: "not-claimed";
  };
  readonly claimExclusions: {
    readonly productionMechanics: "not-claimed";
    readonly productionHomogenization: "not-claimed";
    readonly productionPassiveLaw: "not-claimed";
    readonly productionValidation: "not-claimed";
    readonly officialMorphologyOutcome: "not-claimed";
    readonly robustNoAlternans: "not-claimed";
    readonly calciumCyclingAlternansValidation: "not-claimed";
    readonly liveRuntimeReplacement: "not-claimed";
    readonly ModelCoreChamberWiring: "not-claimed";
    readonly officialCaseWiring: "not-claimed";
    readonly workbenchWiring: "not-claimed";
    readonly septalCoordinateImplementation: "not-claimed";
    readonly septalCouplingImplementation: "not-claimed";
    readonly RVPressureOverloadCoverage: "not-claimed";
    readonly septalBowingCoverage: "not-claimed";
    readonly ventricularInterdependenceCoverage: "not-claimed";
    readonly rightHeartFailureCoverage: "not-claimed";
  };
  readonly futureTriSegPath: {
    readonly trisegLiteCandidateId: "triseg-lite-compatible";
    readonly fullTrisegCompatibleCandidateId: "full-triseg-compatible";
    readonly fullTriSegPath: string;
  };
  readonly requiredVerificationScripts: readonly string[];
  readonly sections: readonly SelectedMechanicsCalibrationReadinessSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

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

const GEOMETRY_FD_TOLERANCE = 5e-5;
const VIRTUAL_POWER_RESIDUAL_TOLERANCE_W = 1e-12;

export function runSelectedMechanicsCalibrationReadinessReport():
  SelectedMechanicsCalibrationReadinessReport {
  const phase4BAReport = runLandActiveStressReplacementReadinessReport();
  const phase4BBReport = runTissueHomogenizationReadinessReport();
  const phase4CAReport = runPassiveEnergyReadinessReport();
  const phase4CBReport = runGeneralizedForceMapperReadinessReport();
  const sourceDecisionBoundary = sourceDecisionBoundarySummary();
  const geometryClosure = geometryClosureSummary();
  const calibrationFreedomMatrix = calibrationFreedomMatrixSummary();
  const mechanicsCompositionSmoke = mechanicsCompositionSmokeSummary();
  const priorGateEvidence = {
    phase4BAReadinessPass: phase4BAReport.readinessPass,
    phase4BAProtocolSetId: phase4BAReport.protocolSetId,
    phase4BAStableSummaryHash: phase4BAReport.stableSummaryHash,
    phase4BAExecutableKinematicsModelId:
      phase4BAReport.executableCoordinatePath.currentExecutableKinematicsModelId,
    phase4BBReadinessPass: phase4BBReport.readinessPass,
    phase4BBProtocolSetId: phase4BBReport.protocolSetId,
    phase4BBStableSummaryHash: phase4BBReport.stableSummaryHash,
    phase4CAReadinessPass: phase4CAReport.readinessPass,
    phase4CAProtocolSetId: phase4CAReport.protocolSetId,
    phase4CAStableSummaryHash: phase4CAReport.stableSummaryHash,
    phase4CBReadinessPass: phase4CBReport.readinessPass,
    phase4CBProtocolSetId: phase4CBReport.protocolSetId,
    phase4CBStableSummaryHash: phase4CBReport.stableSummaryHash,
  } as const;
  const morphologyNoAlternansBoundary =
    morphologyNoAlternansBoundarySummary(phase4BAReport.prescribedCaBeatStability);

  const sections = [
    sourceDecisionBoundarySection(sourceDecisionBoundary),
    selectedCandidateIdentitySection(geometryClosure),
    geometryClosureSection(geometryClosure),
    calibrationFreedomMatrixSection(calibrationFreedomMatrix),
    mechanicsCompositionSmokeSection(mechanicsCompositionSmoke),
    priorGateReadOnlySection(priorGateEvidence),
    morphologyNoAlternansBoundarySection(morphologyNoAlternansBoundary),
    nonCoverageTriSegBoundarySection(),
    deterministicReplaySection(),
  ] as const;
  const readinessPass = sections.every((section) => section.status === "readiness-pass");
  const reportWithoutHash = {
    protocolSetId: SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID,
    phase: SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE,
    claimBoundary: SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY,
    readinessStatus: readinessPass ? "calibration-readiness-ready" : "calibration-readiness-review",
    ownerAcceptanceStatus: "not-owner-acceptance",
    decision4Status: "PENDING OWNER",
    decision5Status: "PENDING OWNER",
    decision6Status: "PENDING OWNER",
    decision8Status: "PENDING OWNER",
    decision19Status: "ACCEPTED",
    decision19ReuseStatus: "accepted-owner-selection-read-only",
    phase4AFrozenStatus: "frozen-read-only",
    selectedThickSphereV2CalibrationCandidateExecutableStatus:
      SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM,
    selectedThickSphereV2CalibrationCandidate: {
      backendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
      candidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
      executableClaim: SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM,
      productionCompletionStatus: "not-claimed",
      runtimeWiringStatus: "not-runtime-wired",
      phase3SpikeAliasStatus: "not-an-alias",
      candidateStableHash: geometryClosure.candidateStableHash,
      lvParameterSetStableHash: geometryClosure.lvParameterSetStableHash,
      rvParameterSetStableHash: geometryClosure.rvParameterSetStableHash,
    },
    sourceDecisionBoundary,
    frozenPhase4BAExecutableEvidence: {
      reusePolicy: "read-only",
      executableKinematicsModelId:
        LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_EXECUTABLE_KINEMATICS_MODEL_ID,
      selectedThickSphereV2CandidateCurrentExecutableStatus:
        SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM,
    },
    calibrationFreedomMatrix,
    geometryClosure,
    mechanicsCompositionSmoke,
    priorGateEvidence,
    morphologyNoAlternansBoundary,
    externalSeptalCouplingBoundary: reportExternalSeptalCouplingBoundary(),
    claimExclusions: reportClaimExclusions(),
    futureTriSegPath: reportFutureTriSegPath(),
    requiredVerificationScripts: [...protocolDescriptor.requiredVerificationScripts],
    sections: sections.map((section) => ({
      id: section.id,
      status: section.status,
      metrics: section.metrics,
    })),
    readinessPass,
  };

  return {
    ...reportWithoutHash,
    stableSummaryHash: stableHash(sanitizeForStableHash(reportWithoutHash)),
  } as SelectedMechanicsCalibrationReadinessReport;
}

function sourceDecisionBoundarySummary():
  SelectedMechanicsCalibrationReadinessReport["sourceDecisionBoundary"] {
  const sourcePaths = protocolDescriptor.sourceDocuments.map((source) => source.path);
  const sourceRefsComplete = REQUIRED_DESCRIPTOR_SOURCE_PATHS.every((sourcePath) =>
    sourcePaths.includes(sourcePath),
  );
  const pendingOwnerDecisionIds = protocolDescriptor.pendingOwnerDecisions
    .filter((decision) => decision.status === "PENDING OWNER")
    .map((decision) => decision.decisionId);
  const acceptedDecision19 = protocolDescriptor.acceptedOwnerDecisionEvidence.find(
    (decision) => decision.decisionId === 19,
  );
  return {
    decision19AcceptedReadOnly:
      protocolDescriptor.decision19Status === "ACCEPTED"
      && protocolDescriptor.decision19ReuseStatus === "accepted-owner-selection-read-only"
      && acceptedDecision19?.status === "ACCEPTED"
      && acceptedDecision19?.reusePolicy === "read-only"
      && acceptedDecision19?.selectedCandidateId === THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
      && acceptedDecision19?.selectedBackend === THICK_SPHERE_V2_SELECTED_BACKEND_ID
      && ownerSelection.status === "ACCEPTED"
      && ownerSelection.selectedCandidateId === THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
      && ownerSelection.selectedBackend === THICK_SPHERE_V2_SELECTED_BACKEND_ID,
    phase4ADossierFrozenReadOnly:
      protocolDescriptor.phase4AFrozenStatus === "frozen-read-only"
      && phase4ADossier.dossierId === "production-mechanics-phase4a-dossier-v1"
      && phase4ADossier.recommendationStatus === "conditional-recommendation-only"
      && phase4ADossier.ownerAcceptanceStatus === "not-owner-acceptance"
      && phase4ADossier.recommendedCandidateId === THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    pendingOwnerDecisionIds,
    sourceRefsComplete,
  };
}

function sourceDecisionBoundarySection(
  summary: SelectedMechanicsCalibrationReadinessReport["sourceDecisionBoundary"],
): SelectedMechanicsCalibrationReadinessSection {
  const descriptorOk =
    protocolDescriptor.protocolSetId === SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID
    && protocolDescriptor.phase === SELECTED_MECHANICS_CALIBRATION_PHASE4D_PHASE
    && protocolDescriptor.claimBoundary === SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY
    && protocolDescriptor.statusBoundary === SELECTED_MECHANICS_CALIBRATION_PHASE4D_CLAIM_BOUNDARY
    && protocolDescriptor.selectedThickSphereV2CalibrationCandidateExecutableStatus
      === SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance"
    && protocolDescriptor.decision4Status === "PENDING OWNER"
    && protocolDescriptor.decision5Status === "PENDING OWNER"
    && protocolDescriptor.decision6Status === "PENDING OWNER"
    && protocolDescriptor.decision8Status === "PENDING OWNER"
    && [4, 5, 6, 8].every((decisionId) => summary.pendingOwnerDecisionIds.includes(decisionId));
  return section("source-decision-boundary-v1", descriptorOk
    && summary.decision19AcceptedReadOnly
    && summary.phase4ADossierFrozenReadOnly
    && summary.sourceRefsComplete, {
    phase: protocolDescriptor.phase,
    claimBoundary: protocolDescriptor.claimBoundary,
    candidateExecutableStatus:
      protocolDescriptor.selectedThickSphereV2CalibrationCandidateExecutableStatus,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    pendingOwnerDecisionIds: summary.pendingOwnerDecisionIds,
    decision19AcceptedReadOnly: summary.decision19AcceptedReadOnly,
    phase4ADossierFrozenReadOnly: summary.phase4ADossierFrozenReadOnly,
    sourceRefsComplete: summary.sourceRefsComplete,
  });
}

function geometryClosureSummary(): SelectedMechanicsGeometryClosure {
  const samples = THICK_SPHERE_V2_SELECTED_PARAMETER_SETS.flatMap((parameterSet) =>
    geometrySampleVolumes(parameterSet).map((volume) => geometrySample(parameterSet, volume, 0))
  );
  const finiteDifferenceSamples = THICK_SPHERE_V2_SELECTED_PARAMETER_SETS.flatMap((parameterSet) =>
    finiteDifferenceVolumes(parameterSet).map((volume) =>
      finiteDifferenceSample(parameterSet, volume)
    )
  );
  const maxFiniteDifferenceResidual = Math.max(
    ...finiteDifferenceSamples.map((sample) => sample.residualAbs),
  );
  const finiteStrain = samples.every((sample) =>
    sample.finite
    && Number.isFinite(sample.fiberEngineeringStrain)
    && sample.fiberEngineeringStrain > -1,
  );
  const allSamplesInCalibrationDomain = samples.every((sample) => sample.inCalibrationDomain);
  const sampleCoverageComplete = samples.length >= 6 && finiteDifferenceSamples.length >= 4;
  const analyticDerivativeMatchesFiniteDifference =
    sampleCoverageComplete && maxFiniteDifferenceResidual <= GEOMETRY_FD_TOLERANCE;
  const parameterHashesRecompute =
    computeThickSphereV2SelectedParameterSetStableHash(
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
    ) === THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetStableHash
    && computeThickSphereV2SelectedParameterSetStableHash(
      THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
    ) === THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetStableHash;
  const candidateStableHashRecomputes =
    computeThickSphereV2SelectedCandidateStableHash()
    === THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.candidateStableHash;
  const idsDistinctFromPhase3Spike =
    ThickSphereV2SelectedBackend.id !== THICK_SPHERE_SPIKE_V1_ID
    && THICK_SPHERE_V2_SELECTED_PARAMETER_SETS.every(
      (parameterSet) =>
        String(parameterSet.parameterSetId) !== THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
    );
  const hashesDistinctFromPhase3Spike = THICK_SPHERE_V2_SELECTED_PARAMETER_SETS.every(
    (parameterSet) =>
      parameterSet.parameterSetStableHash
      !== THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash,
  );

  return {
    backendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
    selectedCandidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    lvParameterSetId: KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    rvParameterSetId: KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    lvParameterSetStableHash: THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetStableHash,
    rvParameterSetStableHash: THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetStableHash,
    candidateStableHash: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.candidateStableHash,
    phase3SpikeParameterSetId: THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
    phase3SpikeParameterSetStableHash:
      THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.parameterSetStableHash,
    idsDistinctFromPhase3Spike,
    hashesDistinctFromPhase3Spike,
    candidateStableHashRecomputes,
    parameterHashesRecompute,
    samples,
    finiteDifferenceSamples,
    maxFiniteDifferenceResidual,
    finiteDifferenceTolerance: GEOMETRY_FD_TOLERANCE,
    finiteStrain,
    allSamplesInCalibrationDomain,
    analyticDerivativeMatchesFiniteDifference,
    pass:
      idsDistinctFromPhase3Spike
      && hashesDistinctFromPhase3Spike
      && candidateStableHashRecomputes
      && parameterHashesRecompute
      && sampleCoverageComplete
      && finiteStrain
      && allSamplesInCalibrationDomain
      && analyticDerivativeMatchesFiniteDifference,
  };
}

function selectedCandidateIdentitySection(
  geometryClosure: SelectedMechanicsGeometryClosure,
): SelectedMechanicsCalibrationReadinessSection {
  const descriptorCandidate = protocolDescriptor.selectedThickSphereV2CalibrationCandidate;
  const ok =
    descriptorCandidate.backendId === THICK_SPHERE_V2_SELECTED_BACKEND_ID
    && descriptorCandidate.candidateId === THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
    && descriptorCandidate.executableClaim
      === SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM
    && descriptorCandidate.parameterSetIds.includes(
      KINEMATICS_LV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    )
    && descriptorCandidate.parameterSetIds.includes(
      KINEMATICS_RV_THICK_SPHERE_V2_CALIBRATION_CANDIDATE_PARAMETER_SET_ID,
    )
    && descriptorCandidate.phase3SpikeAliasPolicy === "forbidden"
    && descriptorCandidate.productionCompletionStatus === "not-claimed"
    && descriptorCandidate.runtimeWiringStatus === "not-runtime-wired"
    && THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.executableStatus
      === SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM
    && THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.phase3SpikeAliasStatus === "not-an-alias"
    && geometryClosure.idsDistinctFromPhase3Spike
    && geometryClosure.hashesDistinctFromPhase3Spike
    && geometryClosure.candidateStableHashRecomputes
    && geometryClosure.parameterHashesRecompute;
  return section("selected-thick-sphere-v2-candidate-identity-v1", ok, {
    backendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
    candidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    executableClaim: SELECTED_MECHANICS_CALIBRATION_PHASE4D_CANDIDATE_EXECUTABLE_CLAIM,
    lvParameterSetId: geometryClosure.lvParameterSetId,
    rvParameterSetId: geometryClosure.rvParameterSetId,
    lvParameterSetStableHash: geometryClosure.lvParameterSetStableHash,
    rvParameterSetStableHash: geometryClosure.rvParameterSetStableHash,
    candidateStableHash: geometryClosure.candidateStableHash,
    phase3SpikeParameterSetId: geometryClosure.phase3SpikeParameterSetId,
    phase3SpikeParameterSetStableHash: geometryClosure.phase3SpikeParameterSetStableHash,
    idsDistinctFromPhase3Spike: geometryClosure.idsDistinctFromPhase3Spike,
    hashesDistinctFromPhase3Spike: geometryClosure.hashesDistinctFromPhase3Spike,
  });
}

function geometryClosureSection(
  geometryClosure: SelectedMechanicsGeometryClosure,
): SelectedMechanicsCalibrationReadinessSection {
  return section("lv-rv-geometry-closure-v1", geometryClosure.pass, {
    finiteStrain: geometryClosure.finiteStrain,
    allSamplesInCalibrationDomain: geometryClosure.allSamplesInCalibrationDomain,
    analyticDerivativeMatchesFiniteDifference:
      geometryClosure.analyticDerivativeMatchesFiniteDifference,
    maxFiniteDifferenceResidual: geometryClosure.maxFiniteDifferenceResidual,
    finiteDifferenceTolerance: geometryClosure.finiteDifferenceTolerance,
    sampleCount: geometryClosure.samples.length,
    finiteDifferenceSampleCount: geometryClosure.finiteDifferenceSamples.length,
  });
}

function calibrationFreedomMatrixSummary():
  SelectedMechanicsCalibrationReadinessReport["calibrationFreedomMatrix"] {
  const settings = protocolDescriptor.protocolSettings;
  const descriptorMatrix = protocolDescriptor.calibrationFreedomMatrix;
  const pass =
    descriptorMatrix.landSourceTref.parameterSetId
      === LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID
    && descriptorMatrix.landSourceTref.sourceParameter === "Tref"
    && descriptorMatrix.landSourceTref.freedom === "fixed-source-parameter"
    && descriptorMatrix.homogenizationGain.allowFreeGain === false
    && descriptorMatrix.pressureGeometryGain.allowFreePressureGain === false
    && descriptorMatrix.pressureGeometryGain.allowFreeGeometryGain === false
    && descriptorMatrix.targetPacks.role === "measurement-hooks-only"
    && descriptorMatrix.targetPacks.acceptanceStatus === "not-claimed"
    && settings.allowFreeHomogenizationGain === false
    && settings.allowFreePressureGain === false
    && settings.allowFreeGeometryGain === false
    && settings.useTargetPackAcceptance === false
    && settings.exposeMeasurementHooksOnly === true
    && IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain === false
    && IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop === false;

  return {
    landSourceParameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    fixedLandTrefPa: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref,
    landSourceParameterSetStableHash:
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.parameterSetStableHash,
    fixedLandSourceTref: true,
    allowFreeHomogenizationGain: false,
    allowFreePressureGain: false,
    allowFreeGeometryGain: false,
    targetPacksRole: "measurement-hooks-only",
    targetPackAcceptanceStatus: "not-claimed",
    pass,
  };
}

function calibrationFreedomMatrixSection(
  matrix: SelectedMechanicsCalibrationReadinessReport["calibrationFreedomMatrix"],
): SelectedMechanicsCalibrationReadinessSection {
  return section("calibration-freedom-matrix-v1", matrix.pass, matrix);
}

function mechanicsCompositionSmokeSummary(): SelectedMechanicsCompositionSmoke {
  const samples = [
    compositionSmokeSample(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET, 0.55, -1.0e-7),
    compositionSmokeSample(
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
      0.35,
      -8.0e-8,
      THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.sweepCavityVolumeMinM3,
    ),
    compositionSmokeSample(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET, 0.42, 8.0e-8),
  ] as const;
  const maxVirtualPowerResidualAbsW = Math.max(
    ...samples.map((sample) => Math.abs(sample.virtualPowerResidualW)),
  );
  const allPressureMapsFinite = samples.every((sample) => sample.pressureMapFinite);
  const allSamplesFinite = samples.every((sample) => sample.finite);
  return {
    samples,
    maxVirtualPowerResidualAbsW,
    virtualPowerResidualToleranceW: VIRTUAL_POWER_RESIDUAL_TOLERANCE_W,
    allPressureMapsFinite,
    allSamplesFinite,
    pass:
      allSamplesFinite
      && allPressureMapsFinite
      && maxVirtualPowerResidualAbsW <= VIRTUAL_POWER_RESIDUAL_TOLERANCE_W,
  };
}

function compositionSmokeSample(
  parameterSet: ThickSphereV2SelectedParameterSet,
  activeFractionOfTref: number,
  coordinateRateM3PerSec: number,
  cavityVolumeM3 = parameterSet.anchorCavityVolumeM3,
): SelectedMechanicsCompositionSmokeSample {
  const kinematics = evaluateThickSphereV2SelectedBackend(
    inputAtVolume(parameterSet, cavityVolumeM3, coordinateRateM3PerSec),
    parameterSet,
  );
  const source = syntheticLandSource(kinematics, activeFractionOfTref);
  const active = IdentityFiberNominalV1.evaluate({
    source,
    instance: { moduleId: "homogenization", instanceId: `phase4d-${parameterSet.ventricle}` },
    wallReferenceVolumeM3: kinematics.wallReferenceVolumeM3,
  }, IDENTITY_FIBER_NOMINAL_V1_PARAMS);
  const passive = evaluatePassiveExponentialEnergyV1({
    fiberEngineeringStrain: kinematics.fiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: kinematics.fiberEngineeringStrainRatePerSec,
  });
  const output = evaluateVirtualPowerGeneralizedForceV1({
    kinematics,
    active,
    passive,
    coordinateRatesSI: [coordinateRateM3PerSec],
    coordinateUnitsById: { [parameterSet.coordinateId]: "m3" },
  });
  const pressureMapPa = output.volumeCoordinatePressurePa?.[parameterSet.coordinateId] ?? Number.NaN;
  return {
    ventricle: parameterSet.ventricle,
    coordinateId: parameterSet.coordinateId,
    coordinateUnit: "m3",
    cavityVolumeM3,
    coordinateRateM3PerSec,
    fiberEngineeringStrain: kinematics.fiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: kinematics.fiberEngineeringStrainRatePerSec,
    landSourceParameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    fixedLandTrefPa: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref,
    sourceActiveFiberStressPa: source.sourceActiveFiberStressPa,
    wallActiveNominalStressPa: active.wallActiveNominalStressPa,
    passiveModelId: passive.modelId,
    passiveParameterSetId: passive.parameterSetId,
    passiveNominalStressPa: passive.passiveNominalStressPa,
    viscousNominalStressPa: passive.viscousNominalStressPa,
    mapperModelId: VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
    conjugateForceSI: output.conjugateForcesSI[0],
    pressureMapPa,
    pressureMapFinite: Number.isFinite(pressureMapPa),
    virtualPowerResidualW: output.virtualPowerResidualW,
    finite:
      kinematics.geometryHealth.finite
      && kinematics.geometryHealth.inCalibrationDomain
      && finitePassive(passive)
      && finiteGeneralizedForce(output)
      && Number.isFinite(active.wallActiveNominalStressPa),
  };
}

function mechanicsCompositionSmokeSection(
  smoke: SelectedMechanicsCompositionSmoke,
): SelectedMechanicsCalibrationReadinessSection {
  return section("mechanics-composition-smoke-v1", smoke.pass, {
    sampleCount: smoke.samples.length,
    maxVirtualPowerResidualAbsW: smoke.maxVirtualPowerResidualAbsW,
    virtualPowerResidualToleranceW: smoke.virtualPowerResidualToleranceW,
    allPressureMapsFinite: smoke.allPressureMapsFinite,
    allSamplesFinite: smoke.allSamplesFinite,
    modelIds: [
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
      PASSIVE_EXPONENTIAL_ENERGY_V1_ID,
      VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
    ],
  });
}

function priorGateReadOnlySection(
  priorGateEvidence: SelectedMechanicsCalibrationReadinessReport["priorGateEvidence"],
): SelectedMechanicsCalibrationReadinessSection {
  const settings = protocolDescriptor.protocolSettings;
  const descriptorPriorOk =
    settings.phase4BAReusePolicy === "read-only"
    && settings.phase4BBReusePolicy === "read-only"
    && settings.phase4CAReusePolicy === "read-only"
    && settings.phase4CBReusePolicy === "read-only"
    && protocolDescriptor.frozenPhase4BAEvidence.reusePolicy === "read-only"
    && protocolDescriptor.frozenPhase4BAEvidence.phase4BAExecutableKinematicsModelId
      === THICK_SPHERE_SPIKE_V1_ID;
  const ok =
    descriptorPriorOk
    && priorGateEvidence.phase4BAReadinessPass
    && priorGateEvidence.phase4BBReadinessPass
    && priorGateEvidence.phase4CAReadinessPass
    && priorGateEvidence.phase4CBReadinessPass
    && Boolean(priorGateEvidence.phase4BAStableSummaryHash)
    && Boolean(priorGateEvidence.phase4BBStableSummaryHash)
    && Boolean(priorGateEvidence.phase4CAStableSummaryHash)
    && Boolean(priorGateEvidence.phase4CBStableSummaryHash)
    && priorGateEvidence.phase4BAExecutableKinematicsModelId === THICK_SPHERE_SPIKE_V1_ID;
  return section("prior-gate-read-only-evidence-v1", ok, priorGateEvidence);
}

function morphologyNoAlternansBoundarySummary(
  beatStability: ReturnType<
    typeof runLandActiveStressReplacementReadinessReport
  >["prescribedCaBeatStability"],
): SelectedMechanicsCalibrationReadinessReport["morphologyNoAlternansBoundary"] {
  return {
    measurementHooksStatus: "present-hooks-only",
    measurementHooks: [...protocolDescriptor.calibrationFreedomMatrix.measurementHooks],
    phase4BABeatStabilityReusePolicy: "read-only",
    phase4BABeatStabilitySmokeReady: beatStability.smokeReady,
    phase4BABeatStabilityCheckId: beatStability.checkId,
    phase4BANotCalciumCyclingValidation: beatStability.notCalciumCyclingValidation,
    officialMorphologyOutcome: "not-claimed",
    robustNoAlternans: "not-claimed",
    calciumCyclingAlternansValidation: "not-claimed",
  };
}

function morphologyNoAlternansBoundarySection(
  boundary: SelectedMechanicsCalibrationReadinessReport["morphologyNoAlternansBoundary"],
): SelectedMechanicsCalibrationReadinessSection {
  const descriptorBoundary = protocolDescriptor.morphologyNoAlternansBoundary;
  const settings = protocolDescriptor.protocolSettings;
  const ok =
    boundary.measurementHooksStatus === "present-hooks-only"
    && boundary.measurementHooks.length >= 5
    && boundary.phase4BABeatStabilityReusePolicy === "read-only"
    && boundary.phase4BABeatStabilitySmokeReady
    && boundary.phase4BANotCalciumCyclingValidation === true
    && boundary.officialMorphologyOutcome === "not-claimed"
    && boundary.robustNoAlternans === "not-claimed"
    && boundary.calciumCyclingAlternansValidation === "not-claimed"
    && descriptorBoundary.measurementHooksStatus === "present-hooks-only"
    && descriptorBoundary.phase4BABeatStabilityReusePolicy === "read-only"
    && descriptorBoundary.officialMorphologyOutcome === "not-claimed"
    && descriptorBoundary.robustNoAlternans === "not-claimed"
    && descriptorBoundary.calciumCyclingAlternansValidation === "not-claimed"
    && settings.useOfficialMorphologyAcceptance === false
    && settings.useRobustNoAlternansAcceptance === false
    && settings.useCalciumCyclingAlternansValidation === false;
  return section("morphology-no-alternans-boundary-v1", ok, boundary);
}

function nonCoverageTriSegBoundarySection(): SelectedMechanicsCalibrationReadinessSection {
  const boundary = reportExternalSeptalCouplingBoundary();
  const claimExclusions = reportClaimExclusions();
  const descriptorBoundary = protocolDescriptor.externalSeptalCouplingBoundary;
  const descriptorExclusions = protocolDescriptor.claimExclusions;
  const ok =
    Object.values(claimExclusions).every((value) => value === "not-claimed")
    && Object.values(descriptorExclusions).every((value) => value === "not-claimed")
    && boundary.interfaceStatus === "interface-and-provenance-only"
    && boundary.implementationStatus === "not-implemented"
    && boundary.validationStatus === "not-claimed"
    && boundary.septalCoordinateStatus === "not-implemented"
    && boundary.biventricularCouplingStatus === "not-implemented"
    && boundary.rvPressureOverloadStatus === "not-claimed"
    && boundary.septalBowingStatus === "not-claimed"
    && boundary.ventricularInterdependenceStatus === "not-claimed"
    && boundary.rightHeartFailureStatus === "not-claimed"
    && descriptorBoundary.interfaceStatus === "interface-and-provenance-only"
    && descriptorBoundary.implementationStatus === "not-implemented"
    && descriptorBoundary.validationStatus === "not-claimed"
    && descriptorBoundary.septalCoordinateStatus === "not-implemented"
    && descriptorBoundary.biventricularCouplingStatus === "not-implemented"
    && descriptorBoundary.rvPressureOverloadStatus === "not-claimed"
    && descriptorBoundary.septalBowingStatus === "not-claimed"
    && descriptorBoundary.ventricularInterdependenceStatus === "not-claimed"
    && descriptorBoundary.rightHeartFailureStatus === "not-claimed"
    && protocolDescriptor.protocolSettings.implementSeptalCoordinate === false
    && protocolDescriptor.protocolSettings.implementBiventricularCoupling === false
    && protocolDescriptor.protocolSettings.validateSeptalCoupling === false
    && protocolDescriptor.protocolSettings.validateRVPressureOverload === false
    && protocolDescriptor.protocolSettings.validateVentricularInterdependence === false
    && protocolDescriptor.protocolSettings.validateRightHeartFailure === false
    && protocolDescriptor.futureTriSegPath.trisegLiteCandidateId === "triseg-lite-compatible"
    && protocolDescriptor.futureTriSegPath.fullTrisegCompatibleCandidateId === "full-triseg-compatible"
    && /full TriSeg/.test(protocolDescriptor.futureTriSegPath.fullTriSegPath);
  return section("noncoverage-triseg-boundary-v1", ok, {
    externalSeptalCouplingBoundary: boundary,
    claimExclusions,
    futureTriSegPath: reportFutureTriSegPath(),
  });
}

function deterministicReplaySection(): SelectedMechanicsCalibrationReadinessSection {
  const firstHash = stableHash(sanitizeForStableHash(buildReplayPayload()));
  const secondHash = stableHash(sanitizeForStableHash(buildReplayPayload()));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function buildReplayPayload(): unknown {
  return {
    sourceDecisionBoundary: sourceDecisionBoundarySummary(),
    geometryClosure: geometryClosureSummary(),
    calibrationFreedomMatrix: calibrationFreedomMatrixSummary(),
    mechanicsCompositionSmoke: mechanicsCompositionSmokeSummary(),
    externalSeptalCouplingBoundary: reportExternalSeptalCouplingBoundary(),
    claimExclusions: reportClaimExclusions(),
    futureTriSegPath: reportFutureTriSegPath(),
  };
}

function geometrySampleVolumes(
  parameterSet: ThickSphereV2SelectedParameterSet,
): readonly number[] {
  return [
    parameterSet.sweepCavityVolumeMinM3,
    parameterSet.anchorCavityVolumeM3,
    parameterSet.sweepCavityVolumeMaxM3,
  ];
}

function finiteDifferenceVolumes(
  parameterSet: ThickSphereV2SelectedParameterSet,
): readonly number[] {
  return [
    parameterSet.sweepCavityVolumeMinM3,
    parameterSet.anchorCavityVolumeM3,
    (parameterSet.sweepCavityVolumeMinM3 + parameterSet.sweepCavityVolumeMaxM3) / 2,
  ];
}

function geometrySample(
  parameterSet: ThickSphereV2SelectedParameterSet,
  cavityVolumeM3: number,
  coordinateRateM3PerSec: number,
): SelectedMechanicsGeometrySample {
  const output = evaluateThickSphereV2SelectedBackend(
    inputAtVolume(parameterSet, cavityVolumeM3, coordinateRateM3PerSec),
    parameterSet,
  );
  return {
    ventricle: parameterSet.ventricle,
    coordinateId: parameterSet.coordinateId,
    parameterSetId: parameterSet.parameterSetId,
    cavityVolumeM3,
    sarcomereLengthM: output.sarcomereLengthM,
    fiberEngineeringStrain: output.fiberEngineeringStrain,
    dStrainDVolume: output.dStrainDCoordinate[0],
    finite: output.geometryHealth.finite,
    inCalibrationDomain: output.geometryHealth.inCalibrationDomain,
  };
}

function finiteDifferenceSample(
  parameterSet: ThickSphereV2SelectedParameterSet,
  cavityVolumeM3: number,
): SelectedMechanicsFiniteDifferenceSample {
  const h = Math.min(cavityVolumeM3 * 1e-5, (parameterSet.sweepCavityVolumeMaxM3 - parameterSet.sweepCavityVolumeMinM3) * 1e-4);
  const center = evaluateThickSphereV2SelectedBackend(
    inputAtVolume(parameterSet, cavityVolumeM3, 0),
    parameterSet,
  );
  const canCentral =
    cavityVolumeM3 - h >= parameterSet.sweepCavityVolumeMinM3
    && cavityVolumeM3 + h <= parameterSet.sweepCavityVolumeMaxM3;
  const canForward = cavityVolumeM3 + 2 * h <= parameterSet.sweepCavityVolumeMaxM3;
  const finiteDifferenceScheme =
    canCentral
      ? "central-in-domain"
      : canForward
        ? "forward-in-domain"
        : "backward-in-domain";
  const finiteDifferenceDStrainDVolume =
    finiteDifferenceScheme === "central-in-domain"
      ? (
        strainAtVolume(parameterSet, cavityVolumeM3 + h)
        - strainAtVolume(parameterSet, cavityVolumeM3 - h)
      ) / (2 * h)
      : finiteDifferenceScheme === "forward-in-domain"
        ? (
          -3 * center.fiberEngineeringStrain
          + 4 * strainAtVolume(parameterSet, cavityVolumeM3 + h)
          - strainAtVolume(parameterSet, cavityVolumeM3 + 2 * h)
        ) / (2 * h)
        : (
          3 * center.fiberEngineeringStrain
          - 4 * strainAtVolume(parameterSet, cavityVolumeM3 - h)
          + strainAtVolume(parameterSet, cavityVolumeM3 - 2 * h)
        ) / (2 * h);
  const analyticDStrainDVolume = center.dStrainDCoordinate[0];
  return {
    ventricle: parameterSet.ventricle,
    cavityVolumeM3,
    finiteDifferenceScheme,
    analyticDStrainDVolume,
    finiteDifferenceDStrainDVolume,
    residualAbs: Math.abs(analyticDStrainDVolume - finiteDifferenceDStrainDVolume),
  };
}

function strainAtVolume(
  parameterSet: ThickSphereV2SelectedParameterSet,
  cavityVolumeM3: number,
): number {
  return evaluateThickSphereV2SelectedBackend(
    inputAtVolume(parameterSet, cavityVolumeM3, 0),
    parameterSet,
  ).fiberEngineeringStrain;
}

function inputAtVolume(
  parameterSet: ThickSphereV2SelectedParameterSet,
  valueSI: number,
  rateSI: number,
) {
  return {
    coordinates: [
      {
        id: parameterSet.coordinateId,
        valueSI,
        previousValueSI: valueSI,
        rateSI,
        unit: "m3" as const,
      },
    ],
    instance: { moduleId: "kinematics", instanceId: `phase4d-${parameterSet.ventricle}` },
  };
}

function syntheticLandSource(
  kinematics: MyocardialKinematicsOutput,
  activeFractionOfTref: number,
): LandSourceOutput {
  const sourceActiveFiberStressPa =
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref * activeFractionOfTref;
  return {
    sourceActiveFiberStressPa,
    sourceStressConvention: "land2017-Ta",
    stabilizationStiffnessPa:
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref * 0.8,
    algorithmicTangentPa:
      LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.Tref * 1.1,
    sourceActivePowerDensityWPerM3:
      sourceActiveFiberStressPa * kinematics.fiberEngineeringStrainRatePerSec,
    health: {
      finite: true,
      stateConservationResidual: 0,
      minimumPopulation: 0.1,
      projectionUsed: false,
    },
  };
}

function finitePassive(passive: PassiveMaterialOutput): boolean {
  return Number.isFinite(passive.passiveNominalStressPa)
    && Number.isFinite(passive.viscousNominalStressPa)
    && Number.isFinite(passive.dPassiveStressDStrainPa)
    && Number.isFinite(passive.storedEnergyDensityJPerM3)
    && Number.isFinite(passive.dissipationDensityWPerM3);
}

function finiteGeneralizedForce(output: GeneralizedForceOutput): boolean {
  return Number.isFinite(output.virtualPowerResidualW)
    && Array.from(output.conjugateForcesSI).every(Number.isFinite)
    && Array.from(output.activeContributionsSI).every(Number.isFinite)
    && Array.from(output.passiveContributionsSI).every(Number.isFinite)
    && Array.from(output.viscousContributionsSI).every(Number.isFinite);
}

function reportExternalSeptalCouplingBoundary():
  SelectedMechanicsCalibrationReadinessReport["externalSeptalCouplingBoundary"] {
  return {
    interfaceStatus: "interface-and-provenance-only",
    implementationStatus: "not-implemented",
    validationStatus: "not-claimed",
    septalCoordinateStatus: "not-implemented",
    biventricularCouplingStatus: "not-implemented",
    rvPressureOverloadStatus: "not-claimed",
    septalBowingStatus: "not-claimed",
    ventricularInterdependenceStatus: "not-claimed",
    rightHeartFailureStatus: "not-claimed",
  };
}

function reportClaimExclusions():
  SelectedMechanicsCalibrationReadinessReport["claimExclusions"] {
  return {
    productionMechanics: "not-claimed",
    productionHomogenization: "not-claimed",
    productionPassiveLaw: "not-claimed",
    productionValidation: "not-claimed",
    officialMorphologyOutcome: "not-claimed",
    robustNoAlternans: "not-claimed",
    calciumCyclingAlternansValidation: "not-claimed",
    liveRuntimeReplacement: "not-claimed",
    ModelCoreChamberWiring: "not-claimed",
    officialCaseWiring: "not-claimed",
    workbenchWiring: "not-claimed",
    septalCoordinateImplementation: "not-claimed",
    septalCouplingImplementation: "not-claimed",
    RVPressureOverloadCoverage: "not-claimed",
    septalBowingCoverage: "not-claimed",
    ventricularInterdependenceCoverage: "not-claimed",
    rightHeartFailureCoverage: "not-claimed",
  };
}

function reportFutureTriSegPath():
  SelectedMechanicsCalibrationReadinessReport["futureTriSegPath"] {
  return {
    trisegLiteCandidateId: "triseg-lite-compatible",
    fullTrisegCompatibleCandidateId: "full-triseg-compatible",
    fullTriSegPath:
      "A full TriSeg escalation path remains preserved before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed as covered primary mechanisms.",
  };
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, unknown>,
): SelectedMechanicsCalibrationReadinessSection {
  return {
    id,
    status: ok ? "readiness-pass" : "readiness-fail",
    metrics,
  };
}
