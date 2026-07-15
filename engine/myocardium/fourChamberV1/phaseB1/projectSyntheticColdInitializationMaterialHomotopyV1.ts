import {
  evaluateLandLengthStateV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landLengthReferenceV1";
import {
  evaluateAtrialOneFiberGeometryV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import {
  evaluateExactEventCalciumV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  evaluateFourChamberClosedLoopSameTimeLevelV1,
  type FourChamberClosedLoopSameTimeLevelEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/closedLoopSameTimeLevelV1";
import {
  initializeLand2017IsometricSteadyStateV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import {
  sourceLand2017StateToRateFreeV1,
  writeRateFreeLand2017RhsV1,
  type RateFreeLand2017StateV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import type {
  CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  scaleDenseJacobianRowMajorV1,
  scaleResidualVectorV1,
  solveScaledDampedNewtonV1,
  solveScaledDensePartialPivotLuV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDampedNewtonFailureReasonV1,
  type ScaledDenseLuDiagnosticsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  assertCanonicalFourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  evaluateScaledFivePointAlgorithmicJacobianV1,
  type ScaledFivePointAlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import type {
  StrictAffineConstraintV1,
} from "@/engine/myocardium/fourChamberV1/numerics/strictAffineDomainV1";
import {
  createPhaseB1EndpointStateV1,
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1EndpointStateV1,
  type PhaseB1EndpointTopologyVectorsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
  evaluatePhaseB1WallBackwardEulerV1,
  evaluatePhaseB1WallMaterialStateV1,
  type PhaseB1WallBackwardEulerEvaluationV1,
  type PhaseB1WallMaterialStateEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import type {
  PhaseB1SlsModeV1,
  PhaseB1StoredDifferentialStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
  phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  solvePublishedTriSegRootV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegRootV1";
import {
  BLOOD_COMPARTMENT_IDS,
  TRISEG_WALL_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
  type InertialFlowId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID =
  "phase-b1-project-synthetic-coupled-cold-initialization-v1" as const;
export const PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID =
  "phase-b1-project-synthetic-active-material-homotopy-v1" as const;
export const PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID =
  "phase-b1-project-synthetic-cold-eta-zero-from-triseg-seed-v1" as const;
export const PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID =
  "phase-b1-cold-eta-one-fixed-volume-solver-v1" as const;
export const PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_V1_ID =
  "phase-b1-cold-eta-one-reference-configured-solver-v1" as const;
export const PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1 =
  Object.freeze({
    policyId: "phase-b1-cold-eta-one-fixed-volume-solver-policy-v1" as const,
    eta: 1 as const,
    timeSec: 0 as const,
    totalBloodVolumeRelativeTolerance: 4096 * Number.EPSILON,
    callerMayChangeInertialFlows: false as const,
    callerMayChangePrescribedCalcium: false as const,
    restoringBranchSolveOnly: true as const,
    publicNonRestoringSolveExposed: false as const,
  });
export const PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_POLICY_V1 =
  Object.freeze({
    policyId:
      "phase-b1-cold-eta-one-reference-configured-solver-policy-v1" as const,
    eta: 1 as const,
    timeSec: 0 as const,
    bloodVolumesRemainAtCanonicalAnchor: true as const,
    inertialFlowsRemainAtCanonicalAnchor: true as const,
    prescribedCalciumRemainsAtCanonicalAnchor: true as const,
    anchorNewtonScaleRegistryRemainsFixed: true as const,
    restoringBranchSolveOnly: true as const,
    physiologicalReferenceAcceptanceClaimed: false as const,
    supportedReferenceEnvelopeClaimed: false as const,
  });

export const PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1 =
  Object.freeze({
    policyId: "phase-b1-project-synthetic-cold-initialization-policy-v1",
    homotopyDefinition:
      "tau_total=tau_passive+q_sls+(1-eta)*tau_anchor_active+eta*tau_Land_active",
    homotopyUse: "numerical-constitutive-continuation-not-biological-loading-path",
    subdivisionCounts: Object.freeze([1, 2, 4, 8] as const),
    canonicalSubdivisionCount: 8,
    enumerationFractions: Object.freeze([0, 1] as const),
    enumerationSeeds: Object.freeze([
      Object.freeze({ V_m_S: -2e-6, y_m: 0.028 }),
      Object.freeze({ V_m_S: 2e-6, y_m: 0.032 }),
      Object.freeze({ V_m_S: 0, y_m: 0.03 }),
    ]),
    rootClusteringScaledInfinityTolerance: 1e-8,
    endpointAgreementScaledInfinityTolerance: 1e-6,
    reverseClosureScaledInfinityTolerance: 1e-6,
    maximumPathEntryCorrectionScaledInfinityNorm: 1e-8,
    maximumAcceptedNodeStepScaledInfinityNorm: 0.25,
    maximumPredictorCorrectionScaledInfinityNorm: 0.25,
    maximumLocalMaterialResidualInfinityNorm: 1e-10,
    maximumScaledColdResidualInfinityNorm: 1e-8,
    maximumScaledColdUpdateInfinityNorm: 1e-8,
    minimumEffectiveTriSegSigma: 1e-3,
    maximumEffectiveTriSegConditionNumber2: 1e3,
    minimumStaticRestoringMargin: 1e-3,
    derivativeDisagreementMultiplier: 10,
    relativeStaticTangentUncertaintyFloor: 1e-6,
    maximumSchurToReequilibratedTangentDifferenceTwoNorm: 1e-5,
    coarseReequilibratedTangentScaledStep: 2 ** -17,
    fineReequilibratedTangentScaledStep: 2 ** -19,
    algorithmicJacobianScaledStep: 2 ** -19,
    strictJunctionRadiusLowerBoundM: 1e-6,
    maxNewtonIterations: 24,
    armijoCoefficient: 1e-4,
    lineSearchContraction: 0.5,
    maxLineSearchBacktracks: 24,
    minimumStepLength: 1e-12,
    fractionToBoundarySafety: 0.995,
    relativePivotTolerance: 64 * Number.EPSILON,
    hiddenHomotopySubdivisionAllowed: false,
    pseudoArclengthRescueAllowed: false,
    projectionAllowed: false,
    clippingAllowed: false,
    nearestRootSelectionAllowed: false,
    minimumResidualRootSelectionAllowed: false,
    maximumJunctionRadiusRootSelectionAllowed: false,
  } as const);

export type PhaseB1ColdUnknownLayoutV1 = Readonly<{
  slsMode: PhaseB1SlsModeV1;
  unknownCount: 37 | 32;
  materialUnknownCount: 35 | 30;
  unknownLabels: readonly string[];
  residualLabels: readonly string[];
  unknownScales: readonly number[];
  residualScales: readonly number[];
  strictLowerBounds: readonly (number | null)[];
  strictAffineConstraints: readonly StrictAffineConstraintV1[];
}>;

export type PhaseB1ColdResidualEvaluationV1 = Readonly<{
  eta: number;
  residual: readonly number[];
  endpoint: PhaseB1EndpointStateV1;
  closedLoop: FourChamberClosedLoopSameTimeLevelEvaluationV1;
  wallMaterialByWall: Readonly<
    Record<FourChamberWallId, PhaseB1WallMaterialStateEvaluationV1>
  >;
  wallBackwardEulerAtEqualStatesByWall: Readonly<
    Record<FourChamberWallId, PhaseB1WallBackwardEulerEvaluationV1>
  >;
  freeCalciumUMByWall: Readonly<Record<FourChamberWallId, number>>;
  maximumAbsolutePopulationRhsPerSec: number;
  maximumAbsoluteDistortionConstraint: number;
  maximumAbsoluteSlsConstraint: number;
  triSegResidualNPerM: Readonly<{ axial: number; radial: number }>;
  projectionApplied: false;
  clippingApplied: false;
}>;

export type PhaseB1ColdEffectiveTriSegAuditV1 = Readonly<{
  auditId: "phase-b1-cold-equilibrium-material-schur-triseg-audit-v1";
  scaledSchurGeneralizedForceTangent: readonly [number, number, number, number];
  scaledReequilibratedCoarseTangent: readonly [number, number, number, number];
  scaledReequilibratedFineTangent: readonly [number, number, number, number];
  symmetricFineTangent: readonly [number, number, number, number];
  eigenvaluesAscending: readonly [number, number];
  derivativeDisagreementTwoNorm: number;
  uncertaintyBound: number;
  robustSignedMargin: number;
  classification:
    | "robust-restoring"
    | "robust-saddle"
    | "robust-antirestoring-maximum"
    | "indeterminate";
  sigmaMinimum: number;
  conditionNumber2: number;
  schurToReequilibratedDifferenceTwoNorm: number;
  withinPublishedTaylorTwoPercentTensionErrorDomain: boolean;
  accepted: boolean;
  energeticStabilityClaimed: false;
  globalUniquenessClaimed: false;
}>;

export type PhaseB1ColdNodeSuccessV1 = Readonly<{
  converged: true;
  eta: number;
  endpoint: PhaseB1EndpointStateV1;
  unknowns: readonly number[];
  residualEvaluation: PhaseB1ColdResidualEvaluationV1;
  algorithmicJacobian: ScaledFivePointAlgorithmicJacobianV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  minimumLandSimplexMargin: number;
  maximumLocalMaterialResidualInfinityNorm: number;
  effectiveTriSegAudit: PhaseB1ColdEffectiveTriSegAuditV1;
  scaledResidualInfinityNorm: number;
  scaledUpdateInfinityNorm: number;
  projectionApplied: false;
  clippingApplied: false;
  fallbackApplied: false;
}>;

export type PhaseB1ColdNodeFailureV1 = Readonly<{
  converged: false;
  eta: number;
  reason:
    | ScaledDampedNewtonFailureReasonV1
    | "final-evaluation-failed"
    | "final-audit-failed";
  message: string;
  rollbackUnknowns: readonly number[];
  lastAcceptedUnknowns: readonly number[] | null;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1 | null;
  projectionApplied: false;
  clippingApplied: false;
  fallbackApplied: false;
}>;

export type PhaseB1ColdNodeResultV1 =
  | PhaseB1ColdNodeSuccessV1
  | PhaseB1ColdNodeFailureV1;

export type PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1 =
  PhaseB1ColdNodeSuccessV1 & Readonly<{ eta: 1 }>;

export type PhaseB1ColdEtaOneFixedVolumeNodeFailureV1 =
  PhaseB1ColdNodeFailureV1 & Readonly<{ eta: 1 }>;

export type PhaseB1ColdEtaOneFixedVolumeNodeResultV1 =
  | PhaseB1ColdEtaOneFixedVolumeNodeSuccessV1
  | PhaseB1ColdEtaOneFixedVolumeNodeFailureV1;

export type PhaseB1ColdEtaOneFixedVolumeAnchorInputsV1 = Readonly<{
  timeSec: 0;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
  calciumByWall: Readonly<
    Record<FourChamberWallId, Readonly<{ r: 0; d: 0 }>>
  >;
  totalBloodVolumeM3: number;
}>;

export type PhaseB1ColdEtaOneFixedVolumeSolveInputV1 = Readonly<{
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  initialUnknowns: readonly number[];
}>;

export type PhaseB1ColdEtaOneFixedVolumeAnalyticSeedInputV1 = Readonly<{
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>;
}>;

export type PhaseB1ColdEtaOneFixedVolumeResidualVectorInputV1 = Readonly<{
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  unknowns: readonly number[];
}>;

export type PhaseB1ColdEtaOneFixedVolumeRootCensusInputV1 = Readonly<{
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  seedOrder: "declared" | "reverse";
}>;

export type PhaseB1ColdEtaOneFixedVolumeRootCensusV1 = Readonly<{
  eta: 1;
  seedOrder: "declared" | "reverse";
  seeds: readonly Readonly<{ V_m_S: number; y_m: number }>[];
  results: readonly PhaseB1ColdEtaOneFixedVolumeNodeResultV1[];
  convergedRootCount: number;
  clusters: readonly Readonly<{
    representativeResultIndex: number;
    memberResultIndices: readonly number[];
    classification: PhaseB1ColdEffectiveTriSegAuditV1["classification"];
    coordinates: Readonly<{ V_m_S: number; y_m: number }>;
    maximumMemberScaledInfinityDistance: number;
    memberFullVectorDistancePass: boolean;
    memberClassificationMatches: boolean;
  }>[];
  enumerationCompleted: boolean;
  allSeedsAttempted: boolean;
  allSeedsConverged: boolean;
  convergedResultsPartitionedExactlyOnce: boolean;
  allClusterMembersWithinFullVectorTolerance: boolean;
  allClusterMemberClassificationsMatch: boolean;
  allDiscoveredRootsReported: true;
  globalExhaustivenessClaimed: false;
  selectionInputToAcceptedPath: false;
}>;

export type PhaseB1ColdEtaOneFixedVolumeSolverSessionV1 = Readonly<{
  solverId: typeof PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  layout: PhaseB1ColdUnknownLayoutV1;
  anchorFixedInputs: PhaseB1ColdEtaOneFixedVolumeAnchorInputsV1;
  solveRestoringNodeAtVolumes: (
    input: PhaseB1ColdEtaOneFixedVolumeSolveInputV1,
  ) => PhaseB1ColdEtaOneFixedVolumeNodeResultV1;
  buildAnalyticSeedAtVolumes: (
    input: PhaseB1ColdEtaOneFixedVolumeAnalyticSeedInputV1,
  ) => readonly number[];
  evaluateResidualVectorAtVolumes: (
    input: PhaseB1ColdEtaOneFixedVolumeResidualVectorInputV1,
  ) => readonly number[];
  runDeclaredRootCensusAtVolumes: (
    input: PhaseB1ColdEtaOneFixedVolumeRootCensusInputV1,
  ) => PhaseB1ColdEtaOneFixedVolumeRootCensusV1;
}>;

export type PhaseB1ColdEtaOneReferenceConfigurationV1 = Readonly<{
  atrialReferenceCavityVolumeM3ByChamber: Readonly<
    Record<"LA" | "RA", number>
  >;
  triSegReferenceMidwallAreaM2ByWall: Readonly<
    Record<TriSegWallId, number>
  >;
}>;

export type PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1 =
  PhaseB1ColdResidualEvaluationV1 & Readonly<{ eta: 1 }>;

export type PhaseB1ColdEtaOneReferenceConfiguredEvaluateInputV1 = Readonly<{
  referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1;
  unknowns: readonly number[];
}>;

export type PhaseB1ColdEtaOneReferenceConfiguredSolveInputV1 = Readonly<{
  referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1;
  initialUnknowns: readonly number[];
}>;

export type PhaseB1ColdEtaOneReferenceConfiguredAnalyticSeedInputV1 = Readonly<{
  referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1;
  triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>;
}>;

export type PhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1 = Readonly<{
  solverId:
    typeof PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  layout: PhaseB1ColdUnknownLayoutV1;
  anchorFixedInputs: PhaseB1ColdEtaOneFixedVolumeAnchorInputsV1;
  anchorReferenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1;
  anchorNewtonScaleRegistryContentSha256: string;
  anchorProvenance: Readonly<{
    syntheticClosedLoopScaffoldConfigurationSha256: string;
    phaseA1TissueManifestBundleSha256: string;
    phaseB1WallMaterialBindingSha256: string;
    anchorNewtonScaleRegistryContentSha256: string;
  }>;
  claimBoundary: Readonly<{
    physiologicalReferenceAcceptance: false;
    supportedReferenceEnvelope: false;
    releaseRuntimeReachability: false;
  }>;
  evaluateColdResidualAtReferenceConfiguration: (
    input: PhaseB1ColdEtaOneReferenceConfiguredEvaluateInputV1,
  ) => PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1;
  solveRestoringNodeAtReferenceConfiguration: (
    input: PhaseB1ColdEtaOneReferenceConfiguredSolveInputV1,
  ) => PhaseB1ColdEtaOneFixedVolumeNodeResultV1;
  buildAnalyticSeedAtReferenceConfiguration: (
    input: PhaseB1ColdEtaOneReferenceConfiguredAnalyticSeedInputV1,
  ) => readonly number[];
}>;

export type PhaseB1ColdEtaZeroTriSegSeedV1 = Readonly<{
  V_m_S: number;
  y_m: number;
}>;

export type PhaseB1ColdEtaZeroWallEquilibriumAuditV1 = Readonly<{
  wallId: FourChamberWallId;
  materialKernelId: typeof PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID;
  calciumState: Readonly<{ r: number; d: number }>;
  freeCalciumUM: number;
  calciumResidualPresent: false;
  calciumIsKnownEndpointForcing: true;
  landPopulationResidualInfinityNormPerSec: number;
  landDistortionResidualInfinityNorm: number;
  equalStateBackwardEulerLandResidualInfinityNorm: number;
  minimumLandPopulationSimplexMargin: number;
  sourceLandStateFinite: boolean;
  sourceLandProjectionUsed: boolean;
  slsMode: PhaseB1SlsModeV1;
  slsStatePhysicallyPresent: boolean;
  slsAlphaV: number | null;
  fiberLogStrain: number;
  slsAlphaVMinusFiberLogStrain: number | null;
  slsOverstressPa: number;
  equalStateBackwardEulerSlsResidual: number | null;
  stabilizationStiffnessIncludedInStressOrTangent: false;
  productionStateResidualUsesStrainRate: false;
  materialEquilibriumPass: boolean;
  slsEquilibriumPass: boolean;
  calciumEquilibriumPass: boolean;
  wallPass: boolean;
}>;

export type PhaseB1ColdEtaZeroEquilibriumAuditV1 = Readonly<{
  auditId: "phase-b1-cold-eta-zero-external-triseg-seed-equilibrium-audit-v1";
  upstreamSeedCoordinatesEncodedExactly: true;
  etaIsExactlyZero: true;
  endpointTopologyVectors: PhaseB1EndpointTopologyVectorsV1;
  coldUnknownCount: number;
  coldMaterialUnknownCount: number;
  coldResidualCount: number;
  residualVector: readonly number[];
  fixedTimeSec: 0;
  fixedBloodVolumesPreserved: boolean;
  fixedInertialFlowsPreserved: boolean;
  fixedCalciumStatesPreserved: boolean;
  seedToSolvedScaledInfinityNorm: number;
  solvedTriSegCoordinates: PhaseB1ColdEtaZeroTriSegSeedV1;
  wallByWall: Readonly<
    Record<FourChamberWallId, PhaseB1ColdEtaZeroWallEquilibriumAuditV1>
  >;
  maximumLandPopulationResidualInfinityNormPerSec: number;
  maximumLandDistortionResidualInfinityNorm: number;
  maximumEqualStateBackwardEulerLandResidualInfinityNorm: number;
  maximumAbsoluteSlsEquilibriumConstraint: number;
  maximumAbsoluteEqualStateBackwardEulerSlsResidual: number;
  triSegResidualNPerM: Readonly<{ axial: number; radial: number }>;
  scaledResidualInfinityNorm: number;
  scaledUpdateInfinityNorm: number;
  minimumLandSimplexMargin: number;
  topologyPass: boolean;
  materialEquilibriumPass: boolean;
  slsEquilibriumPass: boolean;
  calciumEquilibriumPass: boolean;
  triSegEquilibriumPass: boolean;
  prohibitedNumericalOperationsAbsent: boolean;
  coupledColdNodeEquilibriumPass: boolean;
  closedLoopStationarityClaimed: false;
  physiologicalInitializationClaimed: false;
  supportedEnvelopeClaimed: false;
}>;

type PhaseB1ColdEtaZeroFromTriSegSeedCommonV1 = Readonly<{
  adapterId:
    typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID;
  protocolId: typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID;
  homotopyId: typeof PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  eta: 0;
  upstreamEvidenceSha256: string;
  upstreamTriSegSeed: PhaseB1ColdEtaZeroTriSegSeedV1;
  analyticallyReequilibratedSeedUnknowns: readonly number[];
  analyticallyReequilibratedSeedEndpoint: PhaseB1EndpointStateV1;
  layout: PhaseB1ColdUnknownLayoutV1;
  provenance: Readonly<{
    symmetricClosedLoopScaffoldConfigurationSha256: string;
    phaseA1TissueManifestBundleSha256: string;
    phaseB1WallMaterialBindingSha256: string;
    newtonScaleRegistryContentSha256: string;
  }>;
  warmStartImportedOrConsumed: false;
  bloodVolumeAdjustmentApplied: false;
  flowAdjustmentApplied: false;
  calciumWasNewtonUnknown: false;
}>;

export type PhaseB1ColdEtaZeroFromTriSegSeedSuccessV1 =
  PhaseB1ColdEtaZeroFromTriSegSeedCommonV1 & Readonly<{
    converged: true;
    node: PhaseB1ColdNodeSuccessV1;
    equilibriumAudit: PhaseB1ColdEtaZeroEquilibriumAuditV1;
  }>;

export type PhaseB1ColdEtaZeroFromTriSegSeedFailureV1 =
  PhaseB1ColdEtaZeroFromTriSegSeedCommonV1 & Readonly<{
    converged: false;
    node: PhaseB1ColdNodeFailureV1;
    equilibriumAudit: null;
  }>;

export type PhaseB1ColdEtaZeroFromTriSegSeedResultV1 =
  | PhaseB1ColdEtaZeroFromTriSegSeedSuccessV1
  | PhaseB1ColdEtaZeroFromTriSegSeedFailureV1;

export type PhaseB1ColdHomotopyPathSuccessV1 = Readonly<{
  completed: true;
  direction: "forward" | "reverse";
  requestedSubdivisionCount: number;
  requestedEtaValues: readonly number[];
  attemptedEtaValues: readonly number[];
  nodes: readonly PhaseB1ColdNodeSuccessV1[];
  edgeAudits: readonly Readonly<{
    fromEta: number;
    toEta: number;
    predictorUnknowns: readonly number[];
    acceptedUnknowns: readonly number[];
    acceptedNodeStepScaledInfinityNorm: number;
    predictorCorrectionScaledInfinityNorm: number;
  }>[];
  endpoint: PhaseB1ColdNodeSuccessV1;
  maximumAcceptedNodeStepScaledInfinityNorm: number;
  maximumPredictorCorrectionScaledInfinityNorm: number;
  pathEntryCorrectionScaledInfinityNorm: number;
  branchIdentityEstablished: true;
  branchIdentity:
    "numerically-tracked-from-declared-symmetric-anchor-by-corrected-active-material-homotopy";
  previousNodeUsedAs: "tangent-predictor-base-only";
  hiddenSubdivisionApplied: false;
  pseudoArclengthApplied: false;
  projectionApplied: false;
  clippingApplied: false;
  nearestRootSelectionApplied: false;
  minimumResidualRootSelectionApplied: false;
  maximumJunctionRadiusRootSelectionApplied: false;
}>;

export type PhaseB1ColdHomotopyPathFailureV1 = Readonly<{
  completed: false;
  direction: "forward" | "reverse";
  requestedSubdivisionCount: number;
  requestedEtaValues: readonly number[];
  attemptedEtaValues: readonly number[];
  acceptedNodes: readonly PhaseB1ColdNodeSuccessV1[];
  failedNode: PhaseB1ColdNodeFailureV1;
  branchIdentityEstablished: false;
  branchIdentity: "not-established";
  rollbackEndpoint: PhaseB1EndpointStateV1;
  hiddenSubdivisionApplied: false;
  pseudoArclengthApplied: false;
  projectionApplied: false;
  clippingApplied: false;
  nearestRootSelectionApplied: false;
  minimumResidualRootSelectionApplied: false;
  maximumJunctionRadiusRootSelectionApplied: false;
}>;

export type PhaseB1ColdHomotopyPathResultV1 =
  | PhaseB1ColdHomotopyPathSuccessV1
  | PhaseB1ColdHomotopyPathFailureV1;

export type PhaseB1ColdStructuredFailureProbeV1 = Readonly<{
  probeId: "phase-b1-cold-structured-failure-rollback-probe-v1";
  slsMode: PhaseB1SlsModeV1;
  direction: "forward" | "reverse";
  injectedAttemptIndex: 0 | 1;
  pathEntryUnknowns: readonly number[];
  pathEntryEndpoint: PhaseB1EndpointStateV1;
  path: PhaseB1ColdHomotopyPathFailureV1;
}>;

export type PhaseB1ColdRootCensusV1 = Readonly<{
  eta: 0 | 1;
  seeds: typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.enumerationSeeds;
  results: readonly PhaseB1ColdNodeResultV1[];
  convergedRootCount: number;
  clusters: readonly Readonly<{
    representativeResultIndex: number;
    memberResultIndices: readonly number[];
    classification: PhaseB1ColdEffectiveTriSegAuditV1["classification"];
    coordinates: Readonly<{ V_m_S: number; y_m: number }>;
  }>[];
  enumerationCompleted: boolean;
  allSeedsAttempted: boolean;
  allSeedsConverged: boolean;
  allDiscoveredRootsReported: true;
  globalExhaustivenessClaimed: false;
  selectionInputToAcceptedPath: false;
}>;

export type PhaseB1ProjectSyntheticColdInitializationResultV1 = Readonly<{
  protocolId: typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID;
  homotopyId: typeof PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  layout: PhaseB1ColdUnknownLayoutV1;
  anchorEndpoint: PhaseB1EndpointStateV1;
  forwardPaths: readonly PhaseB1ColdHomotopyPathResultV1[];
  canonicalForwardPath: PhaseB1ColdHomotopyPathSuccessV1 | null;
  canonicalReversePath: PhaseB1ColdHomotopyPathResultV1 | null;
  rootCensus: readonly PhaseB1ColdRootCensusV1[];
  maximumEndpointAgreementScaledInfinityNorm: number | null;
  reverseClosureScaledInfinityNorm: number | null;
  maximumCanonicalParityRelativeDifference: number | null;
  projectSyntheticColdInitializationImplementationPass: boolean;
  acceptedPhysiologicalColdInitializationPass: false;
  acceptedPhaseB1ReferenceBranchPass: false;
  supportedEnvelopePass: false;
  physiologicalValidationPass: false;
  releaseRuntimePass: false;
  fixedBloodVolumesChanged: false;
  fixedFlowsChanged: false;
  calciumWasNewtonUnknown: false;
  warmStartImportedOrConsumed: false;
  closedLoopStationarityClaimed: false;
  continuousIntervalRegularityClaimed: false;
  globalRootUniquenessClaimed: false;
  energeticStabilityClaimed: false;
  modelCoreIntegration: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1 =
  Readonly<{
    protocolId: typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID;
    homotopyId: typeof PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID;
    evidenceClass:
      "project-synthetic-coupled-cold-initialization-and-sampled-active-material-homotopy-regression";
    fixedInputs: Readonly<{
      timeSec: 0;
      bloodVolumesM3: Readonly<Record<string, number>>;
      inertialFlowsM3PerSec: Readonly<Record<string, number>>;
      calciumStateByWall: Readonly<
        Record<FourChamberWallId, Readonly<{ r: 0; d: 0 }>>
      >;
      anchorTargetTransmuralPressurePa: number;
      activeAnchorFiberStressPaByWall: Readonly<
        Record<FourChamberWallId, number>
      >;
      totalBloodVolumeM3: number;
      bloodVolumeAdjustmentAllowed: false;
      flowAdjustmentAllowed: false;
      calciumIsNewtonUnknown: false;
    }>;
    topologyBySlsMode: Readonly<{
      on: Readonly<{
        unknownCount: 37;
        materialUnknownCount: 35;
        unknownLabels: readonly string[];
        residualLabels: readonly string[];
        unknownScales: readonly number[];
        residualScales: readonly number[];
        strictLowerBounds: readonly (number | null)[];
        strictAffineConstraints: readonly StrictAffineConstraintV1[];
      }>;
      off: Readonly<{
        unknownCount: 32;
        materialUnknownCount: 30;
        unknownLabels: readonly string[];
        residualLabels: readonly string[];
        unknownScales: readonly number[];
        residualScales: readonly number[];
        strictLowerBounds: readonly (number | null)[];
        strictAffineConstraints: readonly StrictAffineConstraintV1[];
      }>;
    }>;
    policy: typeof PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
    bindings: Readonly<{
      symmetricClosedLoopScaffoldConfigurationSha256: string;
      phaseA1TissueManifestBundleSha256: string;
      phaseB1WallMaterialBindingSha256: string;
      newtonScaleRegistryContentSha256: string;
    }>;
    prohibitedOperations: Readonly<{
      warmStartImportOrConsumption: false;
      hiddenHomotopySubdivision: false;
      pseudoArclengthAcceptanceRescue: false;
      projection: false;
      clipping: false;
      nearestRootSelection: false;
      minimumResidualRootSelection: false;
      maximumJunctionRadiusRootSelection: false;
    }>;
    claimBoundary: Readonly<{
      physiologicalColdInitialization: false;
      acceptedPhaseB1ReferenceBranch: false;
      supportedEnvelope: false;
      continuousIntervalRegularity: false;
      globalRootUniqueness: false;
      energeticStability: false;
      closedLoopStationarity: false;
      releaseRuntimeReachability: false;
    }>;
  }>;

type ColdContext = Readonly<{
  slsMode: PhaseB1SlsModeV1;
  scaffold: ReturnType<typeof buildPhaseB1SyntheticClosedLoopScaffoldV1>;
  atrialGeometryPriorByChamber: ReturnType<
    typeof buildPhaseB1SyntheticClosedLoopScaffoldV1
  >["atrialGeometryPriorByChamber"];
  triSegWalls: ReturnType<
    typeof buildPhaseB1SyntheticClosedLoopScaffoldV1
  >["triSegReference"]["walls"];
  scaleRegistry: ReturnType<
    typeof buildPhaseB1SyntheticClosedLoopScaffoldV1
  >["newtonScaleRegistry"];
  binding: PhaseB1WallMaterialBindingV1;
  layout: PhaseB1ColdUnknownLayoutV1;
  fixedBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  fixedCalciumByWall: Readonly<
    Record<FourChamberWallId, Readonly<{ r: 0; d: 0 }>>
  >;
  freeCalciumUMByWall: Readonly<Record<FourChamberWallId, number>>;
}>;

type DecodedColdUnknowns = Readonly<{
  landByWall: Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
  slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>> | null;
  triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>;
}>;

export function buildPhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1 {
  const on = buildColdContext("on", sha256Hex);
  const off = buildColdContext("off", sha256Hex);
  const scaffold = on.scaffold;
  if (
    on.binding.contentSha256 !== off.binding.contentSha256
    || on.scaleRegistry.registryContentSha256
      !== off.scaleRegistry.registryContentSha256
  ) throw new Error("cold protocol SLS topology bindings drifted");
  const topology = <M extends PhaseB1SlsModeV1>(
    context: ColdContext & Readonly<{ slsMode: M }>,
  ) => Object.freeze({
    unknownCount: context.layout.unknownCount,
    materialUnknownCount: context.layout.materialUnknownCount,
    unknownLabels: context.layout.unknownLabels,
    residualLabels: context.layout.residualLabels,
    unknownScales: context.layout.unknownScales,
    residualScales: context.layout.residualScales,
    strictLowerBounds: context.layout.strictLowerBounds,
    strictAffineConstraints: context.layout.strictAffineConstraints,
  });
  const totalBloodVolumeM3 = Object.values(
    scaffold.initialState.bloodVolumesM3,
  ).reduce((sum, value) => sum + value, 0);
  return Object.freeze({
    protocolId: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
    homotopyId: PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
    evidenceClass:
      "project-synthetic-coupled-cold-initialization-and-sampled-active-material-homotopy-regression",
    fixedInputs: Object.freeze({
      timeSec: 0 as const,
      bloodVolumesM3: Object.freeze({ ...scaffold.initialState.bloodVolumesM3 }),
      inertialFlowsM3PerSec: Object.freeze({
        ...scaffold.initialState.inertialFlowsM3PerSec,
      }),
      calciumStateByWall: on.fixedCalciumByWall,
      anchorTargetTransmuralPressurePa: scaffold.targetTransmuralPressurePa,
      activeAnchorFiberStressPaByWall: Object.freeze({
        ...scaffold.targetFiberStressPaByWall,
      }),
      totalBloodVolumeM3,
      bloodVolumeAdjustmentAllowed: false as const,
      flowAdjustmentAllowed: false as const,
      calciumIsNewtonUnknown: false as const,
    }),
    topologyBySlsMode: Object.freeze({
      on: topology(on as ColdContext & Readonly<{ slsMode: "on" }>),
      off: topology(off as ColdContext & Readonly<{ slsMode: "off" }>),
    }) as PhaseB1ProjectSyntheticColdInitializationProtocolDefinitionV1[
      "topologyBySlsMode"
    ],
    policy: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1,
    bindings: Object.freeze({
      symmetricClosedLoopScaffoldConfigurationSha256:
        phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256Hex),
      phaseA1TissueManifestBundleSha256:
        scaffold.phaseA1TissueManifestBundle.contentSha256,
      phaseB1WallMaterialBindingSha256: on.binding.contentSha256,
      newtonScaleRegistryContentSha256:
        scaffold.newtonScaleRegistry.registryContentSha256,
    }),
    prohibitedOperations: Object.freeze({
      warmStartImportOrConsumption: false as const,
      hiddenHomotopySubdivision: false as const,
      pseudoArclengthAcceptanceRescue: false as const,
      projection: false as const,
      clipping: false as const,
      nearestRootSelection: false as const,
      minimumResidualRootSelection: false as const,
      maximumJunctionRadiusRootSelection: false as const,
    }),
    claimBoundary: Object.freeze({
      physiologicalColdInitialization: false as const,
      acceptedPhaseB1ReferenceBranch: false as const,
      supportedEnvelope: false as const,
      continuousIntervalRegularity: false as const,
      globalRootUniqueness: false as const,
      energeticStability: false as const,
      closedLoopStationarity: false as const,
      releaseRuntimeReachability: false as const,
    }),
  });
}

export function runPhaseB1ProjectSyntheticColdInitializationV1(
  slsMode: PhaseB1SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ProjectSyntheticColdInitializationResultV1 {
  const context = buildColdContext(slsMode, sha256Hex);
  const anchorUnknowns = buildAnalyticallyReequilibratedUnknowns(
    context,
    context.scaffold.initialState.triSegCoordinates,
  );
  const anchorEndpoint = endpointFromUnknowns(context, anchorUnknowns);
  const forwardPaths = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
    .subdivisionCounts.map((count) => runPath(
      context,
      anchorUnknowns,
      buildEtaGrid(count, "forward"),
      "forward",
    ));
  const canonicalForwardCandidate = forwardPaths.find((path) =>
    path.requestedSubdivisionCount
      === PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .canonicalSubdivisionCount);
  const canonicalForwardPath = canonicalForwardCandidate?.completed === true
    ? canonicalForwardCandidate
    : null;
  const canonicalReversePath = canonicalForwardPath === null
    ? null
    : runPath(
      context,
      canonicalForwardPath.endpoint.unknowns,
      buildEtaGrid(
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .canonicalSubdivisionCount,
        "reverse",
      ),
      "reverse",
    );
  const successfulForward = forwardPaths.filter(
    (path): path is PhaseB1ColdHomotopyPathSuccessV1 => path.completed,
  );
  const maximumEndpointAgreementScaledInfinityNorm =
    successfulForward.length === forwardPaths.length
      ? maximumPairwiseDistance(
        successfulForward.map((path) => path.endpoint.unknowns),
        context.layout.unknownScales,
      )
      : null;
  const reverseClosureScaledInfinityNorm =
    canonicalReversePath?.completed === true
      ? scaledInfinityDistance(
        canonicalReversePath.endpoint.unknowns,
        anchorUnknowns,
        context.layout.unknownScales,
      )
      : null;
  const rootCensus = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
    .enumerationFractions.map((eta) => runRootCensus(context, eta));
  const maximumCanonicalParityRelativeDifference = canonicalForwardPath === null
    ? null
    : auditCanonicalEndpointParity(context, canonicalForwardPath.endpoint);
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const projectSyntheticColdInitializationImplementationPass =
    successfulForward.length === forwardPaths.length
    && canonicalForwardPath !== null
    && canonicalReversePath?.completed === true
    && maximumEndpointAgreementScaledInfinityNorm !== null
    && maximumEndpointAgreementScaledInfinityNorm
      <= policy.endpointAgreementScaledInfinityTolerance
    && reverseClosureScaledInfinityNorm !== null
    && reverseClosureScaledInfinityNorm
      <= policy.reverseClosureScaledInfinityTolerance
    && rootCensus.every((census) => census.enumerationCompleted)
    && rootCensus.every((census) =>
      census.allSeedsAttempted
      && census.allSeedsConverged
      && census.clusters.length > 0)
    && maximumCanonicalParityRelativeDifference !== null
    && maximumCanonicalParityRelativeDifference <= 1e-12;
  return Object.freeze({
    protocolId: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
    homotopyId: PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
    slsMode,
    layout: context.layout,
    anchorEndpoint,
    forwardPaths: Object.freeze(forwardPaths),
    canonicalForwardPath,
    canonicalReversePath,
    rootCensus: Object.freeze(rootCensus),
    maximumEndpointAgreementScaledInfinityNorm,
    reverseClosureScaledInfinityNorm,
    maximumCanonicalParityRelativeDifference,
    projectSyntheticColdInitializationImplementationPass,
    acceptedPhysiologicalColdInitializationPass: false,
    acceptedPhaseB1ReferenceBranchPass: false,
    supportedEnvelopePass: false,
    physiologicalValidationPass: false,
    releaseRuntimePass: false,
    fixedBloodVolumesChanged: false,
    fixedFlowsChanged: false,
    calciumWasNewtonUnknown: false,
    warmStartImportedOrConsumed: false,
    closedLoopStationarityClaimed: false,
    continuousIntervalRegularityClaimed: false,
    globalRootUniquenessClaimed: false,
    energeticStabilityClaimed: false,
    modelCoreIntegration: false,
    browserRuntimeAdopted: false,
    releaseRuntimeReachable: false,
  });
}

/**
 * Builds an additive eta=1-only solve session for finite fixed-volume probes.
 * Time, inertial flows, and prescribed calcium remain the canonical cold inputs;
 * callers can replace only the complete, closed blood-volume record.
 */
export function createPhaseB1ColdEtaOneFixedVolumeSolverSessionV1(
  slsMode: PhaseB1SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ColdEtaOneFixedVolumeSolverSessionV1 {
  const anchorContext = buildColdContext(slsMode, sha256Hex);
  const anchorTotalBloodVolumeM3 = totalBloodVolumeM3(
    anchorContext.fixedBloodVolumesM3,
  );
  const anchorFixedInputs = Object.freeze({
    timeSec: PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1.timeSec,
    bloodVolumesM3: anchorContext.fixedBloodVolumesM3,
    inertialFlowsM3PerSec: Object.freeze({
      ...anchorContext.scaffold.initialState.inertialFlowsM3PerSec,
    }),
    calciumByWall: anchorContext.fixedCalciumByWall,
    totalBloodVolumeM3: anchorTotalBloodVolumeM3,
  });
  const contextAtVolumes = (
    bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
  ) => withFixedBloodVolumes(anchorContext, bloodVolumesM3);
  return Object.freeze({
    solverId: PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_V1_ID,
    slsMode,
    layout: anchorContext.layout,
    anchorFixedInputs,
    solveRestoringNodeAtVolumes: (
      input: PhaseB1ColdEtaOneFixedVolumeSolveInputV1,
    ) => {
      assertExactPlainRecordV1(
        input,
        ["bloodVolumesM3", "initialUnknowns"],
        "eta-one fixed-volume solve input",
      );
      const context = contextAtVolumes(input.bloodVolumesM3);
      const initialUnknowns = validateAndFreezeColdUnknownVector(
        input.initialUnknowns,
        context.layout.unknownCount,
        "eta-one fixed-volume initialUnknowns",
      );
      return narrowEtaOneNodeResult(solveColdNode(
        context,
        PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1.eta,
        initialUnknowns,
      ));
    },
    buildAnalyticSeedAtVolumes: (
      input: PhaseB1ColdEtaOneFixedVolumeAnalyticSeedInputV1,
    ) => {
      assertExactPlainRecordV1(
        input,
        ["bloodVolumesM3", "triSegCoordinates"],
        "eta-one fixed-volume analytic-seed input",
      );
      assertExactPlainRecordV1(
        input.triSegCoordinates,
        ["V_m_S", "y_m"],
        "eta-one fixed-volume triSegCoordinates",
      );
      const triSegCoordinates = Object.freeze({
        V_m_S: requireFinite(
          input.triSegCoordinates.V_m_S,
          "eta-one fixed-volume triSegCoordinates.V_m_S",
        ),
        y_m: requirePositiveFinite(
          input.triSegCoordinates.y_m,
          "eta-one fixed-volume triSegCoordinates.y_m",
        ),
      });
      return buildAnalyticallyReequilibratedUnknowns(
        contextAtVolumes(input.bloodVolumesM3),
        triSegCoordinates,
      );
    },
    evaluateResidualVectorAtVolumes: (
      input: PhaseB1ColdEtaOneFixedVolumeResidualVectorInputV1,
    ) => {
      assertExactPlainRecordV1(
        input,
        ["bloodVolumesM3", "unknowns"],
        "eta-one fixed-volume residual-vector input",
      );
      const context = contextAtVolumes(input.bloodVolumesM3);
      const unknowns = validateAndFreezeColdUnknownVector(
        input.unknowns,
        context.layout.unknownCount,
        "eta-one fixed-volume residual unknowns",
      );
      return Object.freeze([
        ...evaluateColdResidual(
          context,
          unknowns,
          PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1.eta,
        ).residual,
      ]);
    },
    runDeclaredRootCensusAtVolumes: (
      input: PhaseB1ColdEtaOneFixedVolumeRootCensusInputV1,
    ) => {
      assertExactPlainRecordV1(
        input,
        ["bloodVolumesM3", "seedOrder"],
        "eta-one fixed-volume root-census input",
      );
      if (input.seedOrder !== "declared" && input.seedOrder !== "reverse") {
        throw new Error(
          "eta-one fixed-volume root-census seedOrder must be declared or reverse",
        );
      }
      return runDeclaredEtaOneFixedVolumeRootCensus(
        contextAtVolumes(input.bloodVolumesM3),
        input.seedOrder,
      );
    },
  });
}

/**
 * Builds an exploratory eta=1 solve session whose only configurable inputs are
 * the five declared chamber/wall geometry references. Blood volumes, time,
 * inertial flows, prescribed calcium, material bindings, and Newton scales all
 * remain at the canonical cold anchor. This is an implementation probe, not a
 * physiological reference calibration or an accepted reference envelope.
 */
export function createPhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1(
  slsMode: PhaseB1SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ColdEtaOneReferenceConfiguredSolverSessionV1 {
  const anchorContext = buildColdContext(slsMode, sha256Hex);
  const anchorFixedInputs = Object.freeze({
    timeSec:
      PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_POLICY_V1.timeSec,
    bloodVolumesM3: anchorContext.fixedBloodVolumesM3,
    inertialFlowsM3PerSec: Object.freeze({
      ...anchorContext.scaffold.initialState.inertialFlowsM3PerSec,
    }),
    calciumByWall: anchorContext.fixedCalciumByWall,
    totalBloodVolumeM3: totalBloodVolumeM3(anchorContext.fixedBloodVolumesM3),
  });
  const anchorReferenceConfiguration = referenceConfigurationFromContext(
    anchorContext,
  );
  const contextAtReferenceConfiguration = (
    referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1,
  ) => withReferenceConfiguration(anchorContext, referenceConfiguration);
  const anchorNewtonScaleRegistryContentSha256 =
    anchorContext.scaleRegistry.registryContentSha256;
  return Object.freeze({
    solverId: PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_V1_ID,
    slsMode,
    layout: anchorContext.layout,
    anchorFixedInputs,
    anchorReferenceConfiguration,
    anchorNewtonScaleRegistryContentSha256,
    anchorProvenance: Object.freeze({
      syntheticClosedLoopScaffoldConfigurationSha256:
        phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256Hex),
      phaseA1TissueManifestBundleSha256:
        anchorContext.scaffold.phaseA1TissueManifestBundle.contentSha256,
      phaseB1WallMaterialBindingSha256: anchorContext.binding.contentSha256,
      anchorNewtonScaleRegistryContentSha256,
    }),
    claimBoundary: Object.freeze({
      physiologicalReferenceAcceptance: false as const,
      supportedReferenceEnvelope: false as const,
      releaseRuntimeReachability: false as const,
    }),
    evaluateColdResidualAtReferenceConfiguration: (
      input: PhaseB1ColdEtaOneReferenceConfiguredEvaluateInputV1,
    ) => {
      assertExactPlainRecordV1(
        input,
        ["referenceConfiguration", "unknowns"],
        "eta-one reference-configured evaluation input",
      );
      const context = contextAtReferenceConfiguration(
        input.referenceConfiguration,
      );
      const unknowns = validateAndFreezeColdUnknownVector(
        input.unknowns,
        context.layout.unknownCount,
        "eta-one reference-configured evaluation unknowns",
      );
      return deepFreezeReferenceConfiguredResult(
        narrowEtaOneResidualEvaluation(evaluateColdResidual(
          context,
          unknowns,
          PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_POLICY_V1.eta,
        )),
      );
    },
    solveRestoringNodeAtReferenceConfiguration: (
      input: PhaseB1ColdEtaOneReferenceConfiguredSolveInputV1,
    ) => {
      assertExactPlainRecordV1(
        input,
        ["referenceConfiguration", "initialUnknowns"],
        "eta-one reference-configured solve input",
      );
      const context = contextAtReferenceConfiguration(
        input.referenceConfiguration,
      );
      const initialUnknowns = validateAndFreezeColdUnknownVector(
        input.initialUnknowns,
        context.layout.unknownCount,
        "eta-one reference-configured initialUnknowns",
      );
      return deepFreezeReferenceConfiguredResult(narrowEtaOneNodeResult(
        solveColdNode(
          context,
          PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_POLICY_V1.eta,
          initialUnknowns,
        ),
      ));
    },
    buildAnalyticSeedAtReferenceConfiguration: (
      input: PhaseB1ColdEtaOneReferenceConfiguredAnalyticSeedInputV1,
    ) => {
      assertExactPlainRecordV1(
        input,
        ["referenceConfiguration", "triSegCoordinates"],
        "eta-one reference-configured analytic-seed input",
      );
      assertExactPlainRecordV1(
        input.triSegCoordinates,
        ["V_m_S", "y_m"],
        "eta-one reference-configured triSegCoordinates",
      );
      const triSegCoordinates = Object.freeze({
        V_m_S: requireFinite(
          input.triSegCoordinates.V_m_S,
          "eta-one reference-configured triSegCoordinates.V_m_S",
        ),
        y_m: requirePositiveFinite(
          input.triSegCoordinates.y_m,
          "eta-one reference-configured triSegCoordinates.y_m",
        ),
      });
      return deepFreezeReferenceConfiguredResult(
        buildAnalyticallyReequilibratedUnknowns(
          contextAtReferenceConfiguration(input.referenceConfiguration),
          triSegCoordinates,
        ),
      );
    },
  });
}

/**
 * Reconstructs the Phase B1 material coordinates at an externally supplied
 * TriSeg seed and corrects that complete coupled state with the existing cold
 * solver at eta=0. The upstream digest is provenance only: it cannot change
 * the equations, seed, Newton policy, or accepted node.
 */
export function solvePhaseB1ProjectSyntheticColdEtaZeroFromTriSegSeedV1(
  slsMode: PhaseB1SlsModeV1,
  triSegSeed: PhaseB1ColdEtaZeroTriSegSeedV1,
  upstreamEvidenceSha256: string,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ColdEtaZeroFromTriSegSeedResultV1 {
  if (!/^[0-9a-f]{64}$/.test(upstreamEvidenceSha256)) {
    throw new Error(
      "upstreamEvidenceSha256 must be a lowercase 64-hex SHA-256 digest",
    );
  }
  const upstreamTriSegSeed = Object.freeze({
    V_m_S: requireFinite(triSegSeed.V_m_S, "triSegSeed.V_m_S"),
    y_m: requirePositiveFinite(triSegSeed.y_m, "triSegSeed.y_m"),
  });
  const context = buildColdContext(slsMode, sha256Hex);
  const analyticallyReequilibratedSeedUnknowns =
    buildAnalyticallyReequilibratedUnknowns(context, upstreamTriSegSeed);
  const analyticallyReequilibratedSeedEndpoint = endpointFromUnknowns(
    context,
    analyticallyReequilibratedSeedUnknowns,
  );
  if (
    analyticallyReequilibratedSeedEndpoint.triSegCoordinates.V_m_S
      !== upstreamTriSegSeed.V_m_S
    || analyticallyReequilibratedSeedEndpoint.triSegCoordinates.y_m
      !== upstreamTriSegSeed.y_m
  ) throw new Error("analytic cold reequilibration did not preserve its TriSeg seed");
  const provenance = Object.freeze({
    symmetricClosedLoopScaffoldConfigurationSha256:
      phaseB1SyntheticClosedLoopScaffoldConfigurationSha256V1(sha256Hex),
    phaseA1TissueManifestBundleSha256:
      context.scaffold.phaseA1TissueManifestBundle.contentSha256,
    phaseB1WallMaterialBindingSha256: context.binding.contentSha256,
    newtonScaleRegistryContentSha256:
      context.scaleRegistry.registryContentSha256,
  });
  const common: PhaseB1ColdEtaZeroFromTriSegSeedCommonV1 = Object.freeze({
    adapterId:
      PHASE_B1_PROJECT_SYNTHETIC_COLD_ETA_ZERO_FROM_TRISEG_SEED_V1_ID,
    protocolId: PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_V1_ID,
    homotopyId: PHASE_B1_PROJECT_SYNTHETIC_MATERIAL_HOMOTOPY_V1_ID,
    slsMode,
    eta: 0 as const,
    upstreamEvidenceSha256,
    upstreamTriSegSeed,
    analyticallyReequilibratedSeedUnknowns,
    analyticallyReequilibratedSeedEndpoint,
    layout: context.layout,
    provenance,
    warmStartImportedOrConsumed: false as const,
    bloodVolumeAdjustmentApplied: false as const,
    flowAdjustmentApplied: false as const,
    calciumWasNewtonUnknown: false as const,
  });
  const node = solveColdNode(
    context,
    0,
    analyticallyReequilibratedSeedUnknowns,
  );
  if (node.converged === false) return Object.freeze({
    ...common,
    converged: false,
    node,
    equilibriumAudit: null,
  });
  return Object.freeze({
    ...common,
    converged: true,
    node,
    equilibriumAudit: buildEtaZeroExternalSeedEquilibriumAudit(
      context,
      upstreamTriSegSeed,
      analyticallyReequilibratedSeedUnknowns,
      analyticallyReequilibratedSeedEndpoint,
      node,
    ),
  });
}

function buildEtaZeroExternalSeedEquilibriumAudit(
  context: ColdContext,
  upstreamTriSegSeed: PhaseB1ColdEtaZeroTriSegSeedV1,
  analyticallyReequilibratedSeedUnknowns: readonly number[],
  analyticallyReequilibratedSeedEndpoint: PhaseB1EndpointStateV1,
  node: PhaseB1ColdNodeSuccessV1,
): PhaseB1ColdEtaZeroEquilibriumAuditV1 {
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const endpointTopologyVectors = encodePhaseB1EndpointTopologyVectorsV1(
    node.endpoint,
  );
  const wallByWall = wallRecord((wallId) => {
    const wallIndex = WALL_IDS.indexOf(wallId);
    const residualOffset = 6 * wallIndex;
    const material = node.residualEvaluation.wallMaterialByWall[wallId];
    const backwardEuler =
      node.residualEvaluation.wallBackwardEulerAtEqualStatesByWall[wallId];
    const calciumState = node.endpoint.differentialState.calciumByWall[wallId];
    const landState = node.endpoint.differentialState.landByWall[wallId];
    const landPopulationResidualInfinityNormPerSec = maximumAbsolute(
      node.residualEvaluation.residual.slice(
        residualOffset,
        residualOffset + 4,
      ),
    );
    const landDistortionResidualInfinityNorm = maximumAbsolute(
      node.residualEvaluation.residual.slice(
        residualOffset + 4,
        residualOffset + 6,
      ),
    );
    const equalStateBackwardEulerLandResidualInfinityNorm = maximumAbsolute(
      backwardEuler.landResidual,
    );
    const minimumLandPopulationSimplexMargin = landPopulationSimplexMargin(
      landState,
    );
    const slsAlphaV = material.sls.alphaV;
    const slsAlphaVMinusFiberLogStrain = slsAlphaV === null
      ? null
      : slsAlphaV - material.fiberLogStrain;
    const materialEquilibriumPass =
      material.kernelId === PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID
      && backwardEuler.kernelId === PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID
      && landPopulationResidualInfinityNormPerSec
        <= policy.maximumLocalMaterialResidualInfinityNorm
      && landDistortionResidualInfinityNorm
        <= policy.maximumLocalMaterialResidualInfinityNorm
      && equalStateBackwardEulerLandResidualInfinityNorm
        <= policy.maximumLocalMaterialResidualInfinityNorm
      && minimumLandPopulationSimplexMargin > 0
      && material.sourceLandOutput.health.finite
      && !material.sourceLandOutput.health.projectionUsed
      && !material.stabilizationStiffnessIncludedInStressOrTangent
      && !material.productionStateResidualUsesStrainRate
      && !backwardEuler.productionStateResidualUsesStrainRate;
    const slsEquilibriumPass = context.slsMode === "on"
      ? material.sls.mode === "on"
        && material.sls.statePhysicallyPresent
        && slsAlphaV !== null
        && slsAlphaVMinusFiberLogStrain !== null
        && Math.abs(slsAlphaVMinusFiberLogStrain)
          <= policy.maximumLocalMaterialResidualInfinityNorm
        && backwardEuler.slsResidual !== null
        && Math.abs(backwardEuler.slsResidual)
          <= policy.maximumLocalMaterialResidualInfinityNorm
        && backwardEuler.slsResidualPartialByNextAlphaV !== null
      : material.sls.mode === "off"
        && !material.sls.statePhysicallyPresent
        && slsAlphaV === null
        && slsAlphaVMinusFiberLogStrain === null
        && material.sls.overstressPa === 0
        && backwardEuler.slsResidual === null
        && backwardEuler.slsResidualPartialByNextAlphaV === null;
    const calciumEquilibriumPass = calciumState.r === 0
      && calciumState.d === 0
      && backwardEuler.calciumResidualPresent === false
      && backwardEuler.calciumIsKnownEndpointForcing === true
      && node.residualEvaluation.freeCalciumUMByWall[wallId] >= 0
      && Number.isFinite(node.residualEvaluation.freeCalciumUMByWall[wallId]);
    return Object.freeze({
      wallId,
      materialKernelId: material.kernelId,
      calciumState: Object.freeze({ ...calciumState }),
      freeCalciumUM: node.residualEvaluation.freeCalciumUMByWall[wallId],
      calciumResidualPresent: backwardEuler.calciumResidualPresent,
      calciumIsKnownEndpointForcing: backwardEuler.calciumIsKnownEndpointForcing,
      landPopulationResidualInfinityNormPerSec,
      landDistortionResidualInfinityNorm,
      equalStateBackwardEulerLandResidualInfinityNorm,
      minimumLandPopulationSimplexMargin,
      sourceLandStateFinite: material.sourceLandOutput.health.finite,
      sourceLandProjectionUsed: material.sourceLandOutput.health.projectionUsed,
      slsMode: material.sls.mode,
      slsStatePhysicallyPresent: material.sls.statePhysicallyPresent,
      slsAlphaV,
      fiberLogStrain: material.fiberLogStrain,
      slsAlphaVMinusFiberLogStrain,
      slsOverstressPa: material.sls.overstressPa,
      equalStateBackwardEulerSlsResidual: backwardEuler.slsResidual,
      stabilizationStiffnessIncludedInStressOrTangent:
        material.stabilizationStiffnessIncludedInStressOrTangent,
      productionStateResidualUsesStrainRate:
        material.productionStateResidualUsesStrainRate,
      materialEquilibriumPass,
      slsEquilibriumPass,
      calciumEquilibriumPass,
      wallPass:
        materialEquilibriumPass && slsEquilibriumPass && calciumEquilibriumPass,
    });
  });
  const maximumLandPopulationResidualInfinityNormPerSec = Math.max(
    ...WALL_IDS.map((wallId) =>
      wallByWall[wallId].landPopulationResidualInfinityNormPerSec),
  );
  const maximumLandDistortionResidualInfinityNorm = Math.max(
    ...WALL_IDS.map((wallId) =>
      wallByWall[wallId].landDistortionResidualInfinityNorm),
  );
  const maximumEqualStateBackwardEulerLandResidualInfinityNorm = Math.max(
    ...WALL_IDS.map((wallId) =>
      wallByWall[wallId].equalStateBackwardEulerLandResidualInfinityNorm),
  );
  const maximumAbsoluteSlsEquilibriumConstraint = Math.max(
    ...WALL_IDS.map((wallId) => Math.abs(
      wallByWall[wallId].slsAlphaVMinusFiberLogStrain ?? 0,
    )),
  );
  const maximumAbsoluteEqualStateBackwardEulerSlsResidual = Math.max(
    ...WALL_IDS.map((wallId) => Math.abs(
      wallByWall[wallId].equalStateBackwardEulerSlsResidual ?? 0,
    )),
  );
  const fixedBloodVolumesPreserved = numericRecordsEqual(
    node.endpoint.differentialState.bloodVolumesM3,
    analyticallyReequilibratedSeedEndpoint.differentialState.bloodVolumesM3,
  );
  const fixedInertialFlowsPreserved = numericRecordsEqual(
    node.endpoint.differentialState.inertialFlowsM3PerSec,
    analyticallyReequilibratedSeedEndpoint.differentialState.inertialFlowsM3PerSec,
  );
  const fixedCalciumStatesPreserved = WALL_IDS.every((wallId) => {
    const actual = node.endpoint.differentialState.calciumByWall[wallId];
    const expected = analyticallyReequilibratedSeedEndpoint
      .differentialState.calciumByWall[wallId];
    return actual.r === expected.r && actual.d === expected.d;
  });
  const expectedNonCalciumDifferentialStateCount = context.slsMode === "on"
    ? 49
    : 44;
  const topologyPass = node.endpoint.differentialState.slsMode === context.slsMode
    && node.endpoint.timeSec === 0
    && context.layout.unknownCount === (context.slsMode === "on" ? 37 : 32)
    && context.layout.materialUnknownCount === (context.slsMode === "on" ? 35 : 30)
    && node.unknowns.length === context.layout.unknownCount
    && node.residualEvaluation.residual.length === context.layout.unknownCount
    && endpointTopologyVectors.slsMode === context.slsMode
    && endpointTopologyVectors.nonCalciumDifferentialState.length
      === expectedNonCalciumDifferentialStateCount
    && endpointTopologyVectors.algebraicState.length === 2
    && endpointTopologyVectors.algebraicState[0]
      === node.endpoint.triSegCoordinates.V_m_S
    && endpointTopologyVectors.algebraicState[1]
      === node.endpoint.triSegCoordinates.y_m
    && analyticallyReequilibratedSeedUnknowns.length
      === context.layout.unknownCount
    && analyticallyReequilibratedSeedEndpoint.triSegCoordinates.V_m_S
      === upstreamTriSegSeed.V_m_S
    && analyticallyReequilibratedSeedEndpoint.triSegCoordinates.y_m
      === upstreamTriSegSeed.y_m
    && fixedBloodVolumesPreserved
    && fixedInertialFlowsPreserved
    && fixedCalciumStatesPreserved;
  const materialEquilibriumPass = WALL_IDS.every(
    (wallId) => wallByWall[wallId].materialEquilibriumPass,
  );
  const slsEquilibriumPass = WALL_IDS.every(
    (wallId) => wallByWall[wallId].slsEquilibriumPass,
  ) && node.residualEvaluation.maximumAbsoluteSlsConstraint
    <= policy.maximumLocalMaterialResidualInfinityNorm;
  const calciumEquilibriumPass = WALL_IDS.every(
    (wallId) => wallByWall[wallId].calciumEquilibriumPass,
  );
  const triSegEquilibriumPass = node.scaledResidualInfinityNorm
      <= policy.maximumScaledColdResidualInfinityNorm
    && node.effectiveTriSegAudit.accepted
    && node.residualEvaluation.eta === 0;
  const prohibitedNumericalOperationsAbsent = !node.projectionApplied
    && !node.clippingApplied
    && !node.fallbackApplied
    && !node.residualEvaluation.projectionApplied
    && !node.residualEvaluation.clippingApplied;
  const coupledColdNodeEquilibriumPass = topologyPass
    && materialEquilibriumPass
    && slsEquilibriumPass
    && calciumEquilibriumPass
    && triSegEquilibriumPass
    && prohibitedNumericalOperationsAbsent
    && node.minimumLandSimplexMargin > 0
    && node.maximumLocalMaterialResidualInfinityNorm
      <= policy.maximumLocalMaterialResidualInfinityNorm
    && node.scaledUpdateInfinityNorm
      <= policy.maximumScaledColdUpdateInfinityNorm;
  return Object.freeze({
    auditId: "phase-b1-cold-eta-zero-external-triseg-seed-equilibrium-audit-v1",
    upstreamSeedCoordinatesEncodedExactly: true,
    etaIsExactlyZero: true,
    endpointTopologyVectors,
    coldUnknownCount: context.layout.unknownCount,
    coldMaterialUnknownCount: context.layout.materialUnknownCount,
    coldResidualCount: node.residualEvaluation.residual.length,
    residualVector: Object.freeze([...node.residualEvaluation.residual]),
    fixedTimeSec: 0,
    fixedBloodVolumesPreserved,
    fixedInertialFlowsPreserved,
    fixedCalciumStatesPreserved,
    seedToSolvedScaledInfinityNorm: scaledInfinityDistance(
      analyticallyReequilibratedSeedUnknowns,
      node.unknowns,
      context.layout.unknownScales,
    ),
    solvedTriSegCoordinates: Object.freeze({
      ...node.endpoint.triSegCoordinates,
    }),
    wallByWall,
    maximumLandPopulationResidualInfinityNormPerSec,
    maximumLandDistortionResidualInfinityNorm,
    maximumEqualStateBackwardEulerLandResidualInfinityNorm,
    maximumAbsoluteSlsEquilibriumConstraint,
    maximumAbsoluteEqualStateBackwardEulerSlsResidual,
    triSegResidualNPerM: Object.freeze({
      ...node.residualEvaluation.triSegResidualNPerM,
    }),
    scaledResidualInfinityNorm: node.scaledResidualInfinityNorm,
    scaledUpdateInfinityNorm: node.scaledUpdateInfinityNorm,
    minimumLandSimplexMargin: node.minimumLandSimplexMargin,
    topologyPass,
    materialEquilibriumPass,
    slsEquilibriumPass,
    calciumEquilibriumPass,
    triSegEquilibriumPass,
    prohibitedNumericalOperationsAbsent,
    coupledColdNodeEquilibriumPass,
    closedLoopStationarityClaimed: false,
    physiologicalInitializationClaimed: false,
    supportedEnvelopeClaimed: false,
  });
}

export function runPhaseB1ProjectSyntheticColdStructuredFailureProbeV1(
  slsMode: PhaseB1SlsModeV1,
  direction: "forward" | "reverse",
  sha256Hex: CanonicalSha256HexProvider,
  injectedAttemptIndex: 0 | 1 = 1,
): PhaseB1ColdStructuredFailureProbeV1 {
  const context = buildColdContext(slsMode, sha256Hex);
  const anchorUnknowns = buildAnalyticallyReequilibratedUnknowns(
    context,
    context.scaffold.initialState.triSegCoordinates,
  );
  let startingUnknowns = anchorUnknowns;
  if (direction === "reverse") {
    const canonicalForward = runPath(
      context,
      anchorUnknowns,
      buildEtaGrid(
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .canonicalSubdivisionCount,
        "forward",
      ),
      "forward",
    );
    if (canonicalForward.completed === false) {
      throw new Error(
        `cold reverse failure probe could not establish its entry: ${canonicalForward.failedNode.message}`,
      );
    }
    startingUnknowns = canonicalForward.endpoint.unknowns;
  }
  const path = runPath(
    context,
    startingUnknowns,
    buildEtaGrid(
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .canonicalSubdivisionCount,
      direction,
    ),
    direction,
    Object.freeze({ attemptIndex: injectedAttemptIndex }),
  );
  if (path.completed === true) {
    throw new Error("cold structured failure probe unexpectedly completed");
  }
  return Object.freeze({
    probeId: "phase-b1-cold-structured-failure-rollback-probe-v1",
    slsMode,
    direction,
    injectedAttemptIndex,
    pathEntryUnknowns: Object.freeze([...startingUnknowns]),
    pathEntryEndpoint: endpointFromUnknowns(context, startingUnknowns),
    path,
  });
}

function buildColdContext(
  slsMode: PhaseB1SlsModeV1,
  sha256Hex: CanonicalSha256HexProvider,
): ColdContext {
  if (slsMode !== "on" && slsMode !== "off") {
    throw new Error("cold initialization slsMode must be on or off");
  }
  const scaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(sha256Hex);
  assertCanonicalFourChamberNewtonScaleRegistryV1(scaffold.newtonScaleRegistry);
  const binding = buildPhaseB1WallMaterialBindingV1(
    scaffold.phaseA1TissueManifestBundle,
    sha256Hex,
  );
  const fixedCalciumByWall = wallRecord(() => Object.freeze({ r: 0 as const, d: 0 as const }));
  const freeCalciumUMByWall = wallRecord((wallId) => {
    const state = fixedCalciumByWall[wallId];
    return evaluateExactEventCalciumV1(
      [state.r, state.d],
      binding.runtimeByWall[wallId].prescribedCalciumParameters,
    ).freeCalciumUM;
  });
  return Object.freeze({
    slsMode,
    scaffold,
    atrialGeometryPriorByChamber: scaffold.atrialGeometryPriorByChamber,
    triSegWalls: scaffold.triSegReference.walls,
    scaleRegistry: scaffold.newtonScaleRegistry,
    binding,
    layout: buildLayout(slsMode, scaffold.newtonScaleRegistry),
    fixedBloodVolumesM3: validateAndFreezeFixedBloodVolumes(
      scaffold.initialState.bloodVolumesM3,
      scaffold.initialState.bloodVolumesM3,
    ),
    fixedCalciumByWall,
    freeCalciumUMByWall,
  });
}

function withFixedBloodVolumes(
  context: ColdContext,
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
): ColdContext {
  return Object.freeze({
    ...context,
    fixedBloodVolumesM3: validateAndFreezeFixedBloodVolumes(
      bloodVolumesM3,
      context.scaffold.initialState.bloodVolumesM3,
    ),
  });
}

function referenceConfigurationFromContext(
  context: ColdContext,
): PhaseB1ColdEtaOneReferenceConfigurationV1 {
  return validateAndFreezeReferenceConfiguration(Object.freeze({
    atrialReferenceCavityVolumeM3ByChamber: Object.freeze({
      LA: context.atrialGeometryPriorByChamber.LA.referenceCavityVolumeM3,
      RA: context.atrialGeometryPriorByChamber.RA.referenceCavityVolumeM3,
    }),
    triSegReferenceMidwallAreaM2ByWall: Object.freeze({
      LVFW: context.triSegWalls.LVFW.referenceMidwallAreaM2,
      SEP: context.triSegWalls.SEP.referenceMidwallAreaM2,
      RVFW: context.triSegWalls.RVFW.referenceMidwallAreaM2,
    }),
  }));
}

function withReferenceConfiguration(
  context: ColdContext,
  referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1,
): ColdContext {
  const configuration = validateAndFreezeReferenceConfiguration(
    referenceConfiguration,
  );
  const current = referenceConfigurationFromContext(context);
  if (
    configuration.atrialReferenceCavityVolumeM3ByChamber.LA
      === current.atrialReferenceCavityVolumeM3ByChamber.LA
    && configuration.atrialReferenceCavityVolumeM3ByChamber.RA
      === current.atrialReferenceCavityVolumeM3ByChamber.RA
    && TRISEG_WALL_IDS.every((wallId) =>
      configuration.triSegReferenceMidwallAreaM2ByWall[wallId]
        === current.triSegReferenceMidwallAreaM2ByWall[wallId])
  ) return context;
  const atrialGeometryPriorByChamber = Object.freeze({
    LA: Object.freeze({
      ...context.atrialGeometryPriorByChamber.LA,
      referenceCavityVolumeM3:
        configuration.atrialReferenceCavityVolumeM3ByChamber.LA,
    }),
    RA: Object.freeze({
      ...context.atrialGeometryPriorByChamber.RA,
      referenceCavityVolumeM3:
        configuration.atrialReferenceCavityVolumeM3ByChamber.RA,
    }),
  });
  const triSegWalls = Object.freeze(Object.fromEntries(
    TRISEG_WALL_IDS.map((wallId) => [
      wallId,
      Object.freeze({
        ...context.triSegWalls[wallId],
        referenceMidwallAreaM2:
          configuration.triSegReferenceMidwallAreaM2ByWall[wallId],
      }),
    ]),
  )) as ColdContext["triSegWalls"];
  return Object.freeze({
    ...context,
    atrialGeometryPriorByChamber,
    triSegWalls,
    scaleRegistry: context.scaleRegistry,
    layout: context.layout,
  });
}

function validateAndFreezeReferenceConfiguration(
  referenceConfiguration: PhaseB1ColdEtaOneReferenceConfigurationV1,
): PhaseB1ColdEtaOneReferenceConfigurationV1 {
  assertExactPlainRecordV1(
    referenceConfiguration,
    [
      "atrialReferenceCavityVolumeM3ByChamber",
      "triSegReferenceMidwallAreaM2ByWall",
    ],
    "eta-one reference configuration",
  );
  assertExactPlainRecordV1(
    referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber,
    ["LA", "RA"],
    "eta-one reference configuration atrialReferenceCavityVolumeM3ByChamber",
  );
  assertExactPlainRecordV1(
    referenceConfiguration.triSegReferenceMidwallAreaM2ByWall,
    TRISEG_WALL_IDS,
    "eta-one reference configuration triSegReferenceMidwallAreaM2ByWall",
  );
  return Object.freeze({
    atrialReferenceCavityVolumeM3ByChamber: Object.freeze({
      LA: requirePositiveFinite(
        referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber.LA,
        "eta-one reference configuration atrialReferenceCavityVolumeM3ByChamber.LA",
      ),
      RA: requirePositiveFinite(
        referenceConfiguration.atrialReferenceCavityVolumeM3ByChamber.RA,
        "eta-one reference configuration atrialReferenceCavityVolumeM3ByChamber.RA",
      ),
    }),
    triSegReferenceMidwallAreaM2ByWall: Object.freeze(Object.fromEntries(
      TRISEG_WALL_IDS.map((wallId) => [
        wallId,
        requirePositiveFinite(
          referenceConfiguration.triSegReferenceMidwallAreaM2ByWall[wallId],
          `eta-one reference configuration triSegReferenceMidwallAreaM2ByWall.${wallId}`,
        ),
      ]),
    )) as Readonly<Record<TriSegWallId, number>>,
  });
}

function validateAndFreezeFixedBloodVolumes(
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
  anchorBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
): Readonly<Record<BloodCompartmentId, number>> {
  assertExactPlainRecordV1(
    bloodVolumesM3,
    BLOOD_COMPARTMENT_IDS,
    "eta-one fixed blood volumes",
  );
  const frozen = Object.freeze(Object.fromEntries(
    BLOOD_COMPARTMENT_IDS.map((compartmentId) => [
      compartmentId,
      requirePositiveFinite(
        bloodVolumesM3[compartmentId],
        `eta-one fixed blood volumes.${compartmentId}`,
      ),
    ]),
  )) as Readonly<Record<BloodCompartmentId, number>>;
  const anchorTotalBloodVolumeM3 = totalBloodVolumeM3(anchorBloodVolumesM3);
  const fixedTotalBloodVolumeM3 = totalBloodVolumeM3(frozen);
  const relativeDifference = Math.abs(
    fixedTotalBloodVolumeM3 - anchorTotalBloodVolumeM3,
  ) / anchorTotalBloodVolumeM3;
  if (
    relativeDifference
      > PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1
        .totalBloodVolumeRelativeTolerance
  ) {
    throw new Error(
      "eta-one fixed blood volumes must preserve anchor total blood volume; "
      + `relative difference=${relativeDifference}`,
    );
  }
  return frozen;
}

function validateAndFreezeColdUnknownVector(
  unknowns: readonly number[],
  expectedLength: number,
  field: string,
): readonly number[] {
  assertDensePlainArrayV1(unknowns, expectedLength, field);
  return Object.freeze(unknowns.map((value, index) =>
    requireFinite(value as number, `${field}[${index}]`)));
}

function narrowEtaOneNodeResult(
  result: PhaseB1ColdNodeResultV1,
): PhaseB1ColdEtaOneFixedVolumeNodeResultV1 {
  if (result.eta !== PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1.eta) {
    throw new Error("eta-one fixed-volume solver returned a non-eta-one node");
  }
  return result as PhaseB1ColdEtaOneFixedVolumeNodeResultV1;
}

function narrowEtaOneResidualEvaluation(
  evaluation: PhaseB1ColdResidualEvaluationV1,
): PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1 {
  if (
    evaluation.eta
      !== PHASE_B1_COLD_ETA_ONE_REFERENCE_CONFIGURED_SOLVER_POLICY_V1.eta
  ) {
    throw new Error(
      "eta-one reference-configured solver returned a non-eta-one evaluation",
    );
  }
  return evaluation as PhaseB1ColdEtaOneReferenceConfiguredEvaluationV1;
}

function totalBloodVolumeM3(
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>,
): number {
  return BLOOD_COMPARTMENT_IDS.reduce(
    (total, compartmentId) => total + bloodVolumesM3[compartmentId],
    0,
  );
}

function buildLayout(
  slsMode: PhaseB1SlsModeV1,
  registry: ColdContext["scaleRegistry"],
): PhaseB1ColdUnknownLayoutV1 {
  const unknownLabels = [
    ...WALL_IDS.flatMap((wallId) => [
      `tissue.${wallId}.patch-0.land.CaTRPN`,
      `tissue.${wallId}.patch-0.land.B`,
      `tissue.${wallId}.patch-0.land.W`,
      `tissue.${wallId}.patch-0.land.S`,
      `tissue.${wallId}.patch-0.land.xiW`,
      `tissue.${wallId}.patch-0.land.xiS`,
    ]),
    ...(slsMode === "on"
      ? WALL_IDS.map((wallId) => `tissue.${wallId}.patch-0.sls.alphaV`)
      : []),
    "algebraic.triseg.V_m_S",
    "algebraic.triseg.y_m",
  ];
  const residualLabels = [
    ...WALL_IDS.flatMap((wallId) => [
      `cold.${wallId}.population.CaTRPN`,
      `cold.${wallId}.population.B`,
      `cold.${wallId}.population.W`,
      `cold.${wallId}.population.S`,
      `cold.${wallId}.distortion.xiW`,
      `cold.${wallId}.distortion.xiS`,
    ]),
    ...(slsMode === "on"
      ? WALL_IDS.map((wallId) => `cold.${wallId}.sls.alphaVMinusFiberLogStrain`)
      : []),
    "cold.triseg.equilibrium.axial",
    "cold.triseg.equilibrium.radial",
  ];
  const unknownScales = [
    ...WALL_IDS.flatMap((wallId) => [
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.landDistortionByWall[wallId],
      registry.unknownScales.landDistortionByWall[wallId],
    ]),
    ...(slsMode === "on"
      ? WALL_IDS.map(() => registry.unknownScales.slsViscousStrain)
      : []),
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  ];
  const residualScales = [
    ...WALL_IDS.flatMap((wallId) => [
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.landDistortionByWall[wallId],
      registry.unknownScales.landDistortionByWall[wallId],
    ]),
    ...(slsMode === "on"
      ? WALL_IDS.map(() => registry.unknownScales.slsViscousStrain)
      : []),
    registry.residualScales.publishedTriSegEquilibriumNPerM,
    registry.residualScales.publishedTriSegEquilibriumNPerM,
  ];
  const strictLowerBounds: (number | null)[] = Array(unknownLabels.length).fill(null);
  const strictAffineConstraints: StrictAffineConstraintV1[] = [];
  for (let wallIndex = 0; wallIndex < WALL_IDS.length; wallIndex += 1) {
    const offset = 6 * wallIndex;
    strictLowerBounds[offset] = 0;
    strictLowerBounds[offset + 1] = 0;
    strictLowerBounds[offset + 2] = 0;
    strictLowerBounds[offset + 3] = 0;
    const calciumUpper = Array<number>(unknownLabels.length).fill(0);
    calciumUpper[offset] = -1;
    strictAffineConstraints.push(Object.freeze({
      constraintId: `cold.${WALL_IDS[wallIndex]}.CaTRPN<1`,
      coefficients: Object.freeze(calciumUpper),
      lowerBound: -1,
    }));
    const populationSumUpper = Array<number>(unknownLabels.length).fill(0);
    populationSumUpper[offset + 1] = -1;
    populationSumUpper[offset + 2] = -1;
    populationSumUpper[offset + 3] = -1;
    strictAffineConstraints.push(Object.freeze({
      constraintId: `cold.${WALL_IDS[wallIndex]}.B+W+S<1`,
      coefficients: Object.freeze(populationSumUpper),
      lowerBound: -1,
    }));
  }
  strictLowerBounds[strictLowerBounds.length - 1] =
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
      .strictJunctionRadiusLowerBoundM;
  const unknownCount = unknownLabels.length as 37 | 32;
  const materialUnknownCount = (unknownCount - 2) as 35 | 30;
  if (
    unknownCount !== (slsMode === "on" ? 37 : 32)
    || residualLabels.length !== unknownCount
    || unknownScales.length !== unknownCount
    || residualScales.length !== unknownCount
  ) throw new Error("cold initialization layout dimension drifted");
  return Object.freeze({
    slsMode,
    unknownCount,
    materialUnknownCount,
    unknownLabels: Object.freeze(unknownLabels),
    residualLabels: Object.freeze(residualLabels),
    unknownScales: Object.freeze(unknownScales),
    residualScales: Object.freeze(residualScales),
    strictLowerBounds: Object.freeze(strictLowerBounds),
    strictAffineConstraints: Object.freeze(strictAffineConstraints),
  });
}

function runPath(
  context: ColdContext,
  startingUnknowns: readonly number[],
  etaValues: readonly number[],
  direction: "forward" | "reverse",
  failureProbe: Readonly<{ attemptIndex: 0 | 1 }> | null = null,
): PhaseB1ColdHomotopyPathResultV1 {
  const acceptedNodes: PhaseB1ColdNodeSuccessV1[] = [];
  const edgeAudits: Array<PhaseB1ColdHomotopyPathSuccessV1["edgeAudits"][number]> = [];
  const attemptedEtaValues: number[] = [];
  let seed = Object.freeze([...startingUnknowns]);
  let previousNode: PhaseB1ColdNodeSuccessV1 | null = null;
  let maximumAcceptedNodeStepScaledInfinityNorm = 0;
  let maximumPredictorCorrectionScaledInfinityNorm = 0;
  let pathEntryCorrectionScaledInfinityNorm = Number.POSITIVE_INFINITY;
  for (const [attemptIndex, eta] of etaValues.entries()) {
    attemptedEtaValues.push(eta);
    let predictor = seed;
    if (previousNode !== null) {
      const deltaEta = eta - previousNode.eta;
      try {
        predictor = buildTangentPredictor(context, previousNode, deltaEta);
      } catch (error) {
        const failedNode = coldFailure(
          eta,
          "final-audit-failed",
          `tangent predictor failed: ${errorMessage(error)}`,
          seed,
          seed,
          previousNode.newtonDiagnostics,
        );
        return pathFailure(
          context,
          direction,
          etaValues,
          attemptedEtaValues,
          acceptedNodes,
          failedNode,
          startingUnknowns,
        );
      }
    }
    if (failureProbe?.attemptIndex === attemptIndex) {
      const rollbackUnknowns = previousNode?.unknowns ?? startingUnknowns;
      const failedNode = coldFailure(
        eta,
        "final-audit-failed",
        "deterministic structured-failure rollback probe",
        rollbackUnknowns,
        previousNode?.unknowns ?? null,
        previousNode?.newtonDiagnostics ?? null,
      );
      return pathFailure(
        context,
        direction,
        etaValues,
        attemptedEtaValues,
        acceptedNodes,
        failedNode,
        startingUnknowns,
      );
    }
    const node = solveColdNode(context, eta, predictor);
    if (node.converged === false) {
      return pathFailure(
        context,
        direction,
        etaValues,
        attemptedEtaValues,
        acceptedNodes,
        node,
        startingUnknowns,
      );
    }
    if (previousNode === null) {
      pathEntryCorrectionScaledInfinityNorm = scaledInfinityDistance(
        startingUnknowns,
        node.unknowns,
        context.layout.unknownScales,
      );
    }
    if (previousNode !== null) {
      const acceptedNodeStepScaledInfinityNorm = scaledInfinityDistance(
        previousNode.unknowns,
        node.unknowns,
        context.layout.unknownScales,
      );
      const predictorCorrectionScaledInfinityNorm = scaledInfinityDistance(
        predictor,
        node.unknowns,
        context.layout.unknownScales,
      );
      maximumAcceptedNodeStepScaledInfinityNorm = Math.max(
        maximumAcceptedNodeStepScaledInfinityNorm,
        acceptedNodeStepScaledInfinityNorm,
      );
      maximumPredictorCorrectionScaledInfinityNorm = Math.max(
        maximumPredictorCorrectionScaledInfinityNorm,
        predictorCorrectionScaledInfinityNorm,
      );
      edgeAudits.push(Object.freeze({
        fromEta: previousNode.eta,
        toEta: eta,
        predictorUnknowns: Object.freeze([...predictor]),
        acceptedUnknowns: node.unknowns,
        acceptedNodeStepScaledInfinityNorm,
        predictorCorrectionScaledInfinityNorm,
      }));
    }
    acceptedNodes.push(node);
    previousNode = node;
    seed = node.unknowns;
  }
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  if (
    pathEntryCorrectionScaledInfinityNorm
      > policy.maximumPathEntryCorrectionScaledInfinityNorm
    || maximumAcceptedNodeStepScaledInfinityNorm
      > policy.maximumAcceptedNodeStepScaledInfinityNorm
    || maximumPredictorCorrectionScaledInfinityNorm
      > policy.maximumPredictorCorrectionScaledInfinityNorm
  ) {
    const endpoint = acceptedNodes[acceptedNodes.length - 1];
    const failedNode = coldFailure(
      endpoint.eta,
      "final-audit-failed",
      "cold material-homotopy path exceeded its predeclared step/correction gate",
      endpoint.unknowns,
      endpoint.unknowns,
      endpoint.newtonDiagnostics,
    );
    return pathFailure(
      context,
      direction,
      etaValues,
      attemptedEtaValues,
      acceptedNodes,
      failedNode,
      startingUnknowns,
    );
  }
  const endpoint = acceptedNodes[acceptedNodes.length - 1];
  return Object.freeze({
    completed: true,
    direction,
    requestedSubdivisionCount: etaValues.length - 1,
    requestedEtaValues: Object.freeze([...etaValues]),
    attemptedEtaValues: Object.freeze(attemptedEtaValues),
    nodes: Object.freeze(acceptedNodes),
    edgeAudits: Object.freeze(edgeAudits),
    endpoint,
    maximumAcceptedNodeStepScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm,
    pathEntryCorrectionScaledInfinityNorm,
    branchIdentityEstablished: true,
    branchIdentity:
      "numerically-tracked-from-declared-symmetric-anchor-by-corrected-active-material-homotopy",
    previousNodeUsedAs: "tangent-predictor-base-only",
    hiddenSubdivisionApplied: false,
    pseudoArclengthApplied: false,
    projectionApplied: false,
    clippingApplied: false,
    nearestRootSelectionApplied: false,
    minimumResidualRootSelectionApplied: false,
    maximumJunctionRadiusRootSelectionApplied: false,
  });
}

function pathFailure(
  context: ColdContext,
  direction: "forward" | "reverse",
  etaValues: readonly number[],
  attemptedEtaValues: readonly number[],
  acceptedNodes: readonly PhaseB1ColdNodeSuccessV1[],
  failedNode: PhaseB1ColdNodeFailureV1,
  pathEntryUnknowns: readonly number[],
): PhaseB1ColdHomotopyPathFailureV1 {
  return Object.freeze({
    completed: false,
    direction,
    requestedSubdivisionCount: etaValues.length - 1,
    requestedEtaValues: Object.freeze([...etaValues]),
    attemptedEtaValues: Object.freeze([...attemptedEtaValues]),
    acceptedNodes: Object.freeze([...acceptedNodes]),
    failedNode,
    branchIdentityEstablished: false,
    branchIdentity: "not-established",
    rollbackEndpoint: endpointFromUnknowns(context, pathEntryUnknowns),
    hiddenSubdivisionApplied: false,
    pseudoArclengthApplied: false,
    projectionApplied: false,
    clippingApplied: false,
    nearestRootSelectionApplied: false,
    minimumResidualRootSelectionApplied: false,
    maximumJunctionRadiusRootSelectionApplied: false,
  });
}

function solveColdNode(
  context: ColdContext,
  eta: number,
  initialUnknowns: readonly number[],
  requireAcceptedRestoringBranch = true,
): PhaseB1ColdNodeResultV1 {
  requireHomotopyFraction(eta);
  const initial = Object.freeze([...initialUnknowns]);
  const layout = context.layout;
  if (initial.length !== layout.unknownCount) {
    throw new Error("cold node initial unknown dimension mismatch");
  }
  const newton = solveScaledDampedNewtonV1({
    initialUnknowns: initial,
    unknownScales: layout.unknownScales,
    residualScales: layout.residualScales,
    strictLowerBounds: layout.strictLowerBounds,
    strictAffineConstraints: layout.strictAffineConstraints,
    options: {
      maxIterations:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.maxNewtonIterations,
      residualInfinityTolerance:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .maximumLocalMaterialResidualInfinityNorm,
      updateInfinityTolerance:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
          .maximumScaledColdUpdateInfinityNorm,
      armijoCoefficient:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.armijoCoefficient,
      lineSearchContraction:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.lineSearchContraction,
      maxLineSearchBacktracks:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.maxLineSearchBacktracks,
      minimumStepLength:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.minimumStepLength,
      fractionToBoundarySafety:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.fractionToBoundarySafety,
      relativePivotTolerance:
        PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.relativePivotTolerance,
    },
    evaluate: (unknowns) => {
      try {
        const base = evaluateColdResidual(context, unknowns, eta);
        const semismooth = (trial: readonly number[]) =>
          evaluateColdSemismoothResidual(context, base, trial, eta);
        assertResidualsRoundoffEqual(semismooth(unknowns), base.residual);
        const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
          semismooth,
          unknowns,
          {
            unknownScales: layout.unknownScales,
            residualScales: layout.residualScales,
            lowerBounds: layout.strictLowerBounds,
            strictAffineConstraints: layout.strictAffineConstraints,
            scaledStep:
              PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
                .algorithmicJacobianScaledStep,
          },
        );
        return {
          status: "ok" as const,
          residual: base.residual,
          jacobianRowMajor: jacobian.rawJacobian.flat(),
          diagnostic: Object.freeze({
            eta,
            minimumLandSimplexMargin: minimumLandSimplexMargin(unknowns),
          }),
        };
      } catch (error) {
        return {
          status: "inadmissible" as const,
          reason: errorMessage(error),
        };
      }
    },
  });
  if (newton.converged === false) {
    return coldFailure(
      eta,
      newton.reason,
      newton.message,
      initial,
      newton.lastAcceptedUnknowns,
      newton.diagnostics,
    );
  }
  try {
    const unknowns = Object.freeze([...newton.unknowns]);
    const residualEvaluation = evaluateColdResidual(context, unknowns, eta);
    const semismooth = (trial: readonly number[]) =>
      evaluateColdSemismoothResidual(context, residualEvaluation, trial, eta);
    const algorithmicJacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
      semismooth,
      unknowns,
      {
        unknownScales: layout.unknownScales,
        residualScales: layout.residualScales,
        lowerBounds: layout.strictLowerBounds,
        strictAffineConstraints: layout.strictAffineConstraints,
        scaledStep:
          PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
            .algorithmicJacobianScaledStep,
      },
    );
    const scaledResidualInfinityNorm = maximumAbsolute(
      scaleResidualVectorV1(residualEvaluation.residual, layout.residualScales),
    );
    const scaledUpdateInfinityNorm = newton.diagnostics.finalUpdateInfinityNorm;
    const minimumSimplex = minimumLandSimplexMargin(unknowns);
    const maximumLocalMaterialResidualInfinityNorm = Math.max(
      residualEvaluation.maximumAbsolutePopulationRhsPerSec,
      residualEvaluation.maximumAbsoluteDistortionConstraint,
      residualEvaluation.maximumAbsoluteSlsConstraint,
    );
    const effectiveTriSegAudit = auditEffectiveTriSeg(
      context,
      eta,
      unknowns,
      residualEvaluation,
      algorithmicJacobian,
    );
    const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
    if (
      !(minimumSimplex > 0)
      || maximumLocalMaterialResidualInfinityNorm
        > policy.maximumLocalMaterialResidualInfinityNorm
      || scaledResidualInfinityNorm > policy.maximumScaledColdResidualInfinityNorm
      || scaledUpdateInfinityNorm > policy.maximumScaledColdUpdateInfinityNorm
      || (requireAcceptedRestoringBranch && !effectiveTriSegAudit.accepted)
    ) {
      throw new Error(`accepted cold node failed its independent final audit: ${JSON.stringify({
        eta,
        minimumSimplex,
        maximumLocalMaterialResidualInfinityNorm,
        scaledResidualInfinityNorm,
        scaledUpdateInfinityNorm,
        triSeg: {
          accepted: effectiveTriSegAudit.accepted,
          classification: effectiveTriSegAudit.classification,
          margin: effectiveTriSegAudit.robustSignedMargin,
          sigma: effectiveTriSegAudit.sigmaMinimum,
          condition: effectiveTriSegAudit.conditionNumber2,
          schurDifference:
            effectiveTriSegAudit.schurToReequilibratedDifferenceTwoNorm,
          taylorDomain:
            effectiveTriSegAudit.withinPublishedTaylorTwoPercentTensionErrorDomain,
        },
      })}`);
    }
    return Object.freeze({
      converged: true,
      eta,
      endpoint: residualEvaluation.endpoint,
      unknowns,
      residualEvaluation,
      algorithmicJacobian,
      newtonDiagnostics: newton.diagnostics,
      minimumLandSimplexMargin: minimumSimplex,
      maximumLocalMaterialResidualInfinityNorm,
      effectiveTriSegAudit,
      scaledResidualInfinityNorm,
      scaledUpdateInfinityNorm,
      projectionApplied: false,
      clippingApplied: false,
      fallbackApplied: false,
    });
  } catch (error) {
    return coldFailure(
      eta,
      "final-audit-failed",
      errorMessage(error),
      initial,
      newton.unknowns,
      newton.diagnostics,
    );
  }
}

function coldFailure(
  eta: number,
  reason: PhaseB1ColdNodeFailureV1["reason"],
  message: string,
  rollbackUnknowns: readonly number[],
  lastAcceptedUnknowns: readonly number[] | null,
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1 | null,
): PhaseB1ColdNodeFailureV1 {
  return Object.freeze({
    converged: false,
    eta,
    reason,
    message,
    rollbackUnknowns: Object.freeze([...rollbackUnknowns]),
    lastAcceptedUnknowns: lastAcceptedUnknowns === null
      ? null
      : Object.freeze([...lastAcceptedUnknowns]),
    newtonDiagnostics,
    projectionApplied: false,
    clippingApplied: false,
    fallbackApplied: false,
  });
}

function evaluateColdResidual(
  context: ColdContext,
  unknowns: readonly number[],
  eta: number,
): PhaseB1ColdResidualEvaluationV1 {
  requireHomotopyFraction(eta);
  const decoded = decodeUnknowns(context, unknowns);
  const endpoint = endpointFromDecoded(context, decoded);
  const wallMaterialMutable: Partial<Record<
    FourChamberWallId,
    PhaseB1WallMaterialStateEvaluationV1
  >> = {};
  const closedLoop = evaluateFourChamberClosedLoopSameTimeLevelV1({
    atrialGeometryPriorByChamber: context.atrialGeometryPriorByChamber,
    triSegWalls: context.triSegWalls,
    vascularComplianceParametersByCompartment:
      context.scaffold.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      context.scaffold.peripheralResistancePaSecPerM3ByFlow,
    valveLossParametersByFlow: context.scaffold.valveLossParametersByFlow,
    inletLossParametersByFlow: context.scaffold.inletLossParametersByFlow,
    pericardiumParameters: context.scaffold.pericardiumParameters,
    intrathoracicPressurePa: context.scaffold.intrathoracicPressurePa,
    state: Object.freeze({
      timeSec: endpoint.timeSec,
      bloodVolumesM3: endpoint.differentialState.bloodVolumesM3,
      inertialFlowsM3PerSec: endpoint.differentialState.inertialFlowsM3PerSec,
      triSegCoordinates: endpoint.triSegCoordinates,
    }),
    evaluateWall: ({ wallId, fiberLogStrain, wallReferenceMaterialVolumeM3 }) => {
      const material = context.binding.runtimeByWall[wallId];
      const alphaV = context.slsMode === "on"
        ? requireRecord(decoded.slsAlphaVByWall, "slsAlphaVByWall")[wallId]
        : null;
      const evaluation = evaluatePhaseB1WallMaterialStateV1({
        wallMaterial: material,
        fiberLogStrain,
        freeCalciumUM: context.freeCalciumUMByWall[wallId],
        landState: decoded.landByWall[wallId],
        slsMode: context.slsMode,
        alphaV,
      });
      wallMaterialMutable[wallId] = evaluation;
      return closedLoopWallOutput(
        context,
        wallId,
        evaluation,
        wallReferenceMaterialVolumeM3,
        eta,
      );
    },
  });
  const wallMaterialByWall = wallRecord((wallId) => {
    const value = wallMaterialMutable[wallId];
    if (value === undefined) throw new Error(`cold assembly did not evaluate wall ${wallId}`);
    return value;
  });
  const wallBackwardEulerAtEqualStatesByWall = wallRecord((wallId) => {
    const state = wallMaterialByWall[wallId];
    const alphaV = context.slsMode === "on"
      ? requireRecord(decoded.slsAlphaVByWall, "slsAlphaVByWall")[wallId]
      : null;
    return evaluatePhaseB1WallBackwardEulerV1({
      wallMaterial: context.binding.runtimeByWall[wallId],
      previousFiberLogStrain: state.fiberLogStrain,
      nextFiberLogStrain: state.fiberLogStrain,
      endpointFreeCalciumUM: context.freeCalciumUMByWall[wallId],
      previousLandState: decoded.landByWall[wallId],
      nextLandState: decoded.landByWall[wallId],
      slsMode: context.slsMode,
      previousAlphaV: alphaV,
      nextAlphaV: alphaV,
      dtSec: 1,
    });
  });
  const wallResiduals = wallRecord((wallId) => {
    const state = wallMaterialByWall[wallId];
    const material = context.binding.runtimeByWall[wallId];
    const land = decoded.landByWall[wallId];
    const rhs = writeRateFreeLand2017RhsV1(
      land,
      {
        freeCalciumUM: context.freeCalciumUMByWall[wallId],
        landStretch: state.length.landStretch,
      },
      material.landEquationParameters,
    );
    return Object.freeze([
      rhs[0],
      rhs[1],
      rhs[2],
      rhs[3],
      land[4]
        + material.landEquationParameters.derived.Aw * state.length.landStretch,
      land[5]
        + material.landEquationParameters.derived.As * state.length.landStretch,
    ]);
  });
  const slsResidualByWall = context.slsMode === "on"
    ? wallRecord((wallId) =>
      requireRecord(decoded.slsAlphaVByWall, "slsAlphaVByWall")[wallId]
      - wallMaterialByWall[wallId].fiberLogStrain)
    : null;
  const triSegResidualNPerM = Object.freeze({
    axial: closedLoop.triSegOracle.equilibriumResidual.axialNPerM,
    radial: closedLoop.triSegOracle.equilibriumResidual.radialNPerM,
  });
  const residual = Object.freeze([
    ...WALL_IDS.flatMap((wallId) => wallResiduals[wallId]),
    ...(slsResidualByWall === null
      ? []
      : WALL_IDS.map((wallId) => slsResidualByWall[wallId])),
    triSegResidualNPerM.axial,
    triSegResidualNPerM.radial,
  ]);
  if (residual.length !== context.layout.unknownCount) {
    throw new Error("cold residual dimension drifted");
  }
  residual.forEach((value, index) => requireFinite(value, `coldResidual[${index}]`));
  return Object.freeze({
    eta,
    residual,
    endpoint,
    closedLoop,
    wallMaterialByWall,
    wallBackwardEulerAtEqualStatesByWall,
    freeCalciumUMByWall: context.freeCalciumUMByWall,
    maximumAbsolutePopulationRhsPerSec: Math.max(
      ...WALL_IDS.flatMap((wallId) => wallResiduals[wallId].slice(0, 4).map(Math.abs)),
    ),
    maximumAbsoluteDistortionConstraint: Math.max(
      ...WALL_IDS.flatMap((wallId) => wallResiduals[wallId].slice(4).map(Math.abs)),
    ),
    maximumAbsoluteSlsConstraint: slsResidualByWall === null
      ? 0
      : Math.max(...WALL_IDS.map((wallId) => Math.abs(slsResidualByWall[wallId]))),
    triSegResidualNPerM,
    projectionApplied: false,
    clippingApplied: false,
  });
}

function evaluateColdSemismoothResidual(
  context: ColdContext,
  base: PhaseB1ColdResidualEvaluationV1,
  trialUnknowns: readonly number[],
  eta: number,
): readonly number[] {
  const baseDecoded = decodeUnknowns(context, encodeUnknownsFromEndpoint(context, base.endpoint));
  const trialDecoded = decodeUnknowns(context, trialUnknowns);
  const trialEndpoint = endpointFromDecoded(context, trialDecoded);
  const trialClosedLoop = evaluateFourChamberClosedLoopSameTimeLevelV1({
    atrialGeometryPriorByChamber: context.atrialGeometryPriorByChamber,
    triSegWalls: context.triSegWalls,
    vascularComplianceParametersByCompartment:
      context.scaffold.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      context.scaffold.peripheralResistancePaSecPerM3ByFlow,
    valveLossParametersByFlow: context.scaffold.valveLossParametersByFlow,
    inletLossParametersByFlow: context.scaffold.inletLossParametersByFlow,
    pericardiumParameters: context.scaffold.pericardiumParameters,
    intrathoracicPressurePa: context.scaffold.intrathoracicPressurePa,
    state: Object.freeze({
      timeSec: trialEndpoint.timeSec,
      bloodVolumesM3: trialEndpoint.differentialState.bloodVolumesM3,
      inertialFlowsM3PerSec: trialEndpoint.differentialState.inertialFlowsM3PerSec,
      triSegCoordinates: trialEndpoint.triSegCoordinates,
    }),
    evaluateWall: ({ wallId, fiberLogStrain, wallReferenceMaterialVolumeM3 }) => {
      const trialAlpha = context.slsMode === "on"
        ? requireRecord(trialDecoded.slsAlphaVByWall, "trial.slsAlphaVByWall")[wallId]
        : null;
      const trialMaterial = evaluatePhaseB1WallMaterialStateV1({
        wallMaterial: context.binding.runtimeByWall[wallId],
        fiberLogStrain,
        freeCalciumUM: context.freeCalciumUMByWall[wallId],
        landState: trialDecoded.landByWall[wallId],
        slsMode: context.slsMode,
        alphaV: trialAlpha,
      });
      const baseMaterial = base.wallMaterialByWall[wallId];
      const baseLand = baseDecoded.landByWall[wallId];
      const trialLand = trialDecoded.landByWall[wallId];
      const strainIncrement = fiberLogStrain - baseMaterial.fiberLogStrain;
      const landIncrementActiveStressPa = baseMaterial
        .wallActiveStressPartialsPaByLandState.reduce(
          (sum, partial, index) =>
            sum + partial * (trialLand[index] - baseLand[index]),
          0,
        );
      const alphaIncrementSlsStressPa = context.slsMode === "on"
        ? requireFinite(
          baseMaterial.totalStressPartialPaPerAlphaV,
          `${wallId}.baseStressPartialByAlphaV`,
        ) * (
          requireRecord(trialDecoded.slsAlphaVByWall, "trial.slsAlphaVByWall")[wallId]
          - requireRecord(baseDecoded.slsAlphaVByWall, "base.slsAlphaVByWall")[wallId]
        )
        : 0;
      const totalStressPa = homotopyTotalStressPa(context, wallId, baseMaterial, eta)
        + (
          baseMaterial.passive.dStressDFiberLogStrainPa
          + baseMaterial.sls.stressPartialPaPerFiberLogStrainAtFixedAlpha
          + eta * baseMaterial.wallActiveStressPartialPaPerFiberLogStrainAtFixedLandState
        ) * strainIncrement
        + eta * landIncrementActiveStressPa
        + alphaIncrementSlsStressPa;
      return closedLoopWallOutputFromStress(
        context,
        trialMaterial,
        wallReferenceMaterialVolumeM3,
        totalStressPa,
        baseMaterial.passive.dStressDFiberLogStrainPa
          + baseMaterial.sls.stressPartialPaPerFiberLogStrainAtFixedAlpha
          + eta * baseMaterial.wallActiveStressPartialPaPerFiberLogStrainAtFixedLandState,
      );
    },
  });
  const trialWallStrain = wallRecord((wallId) =>
    trialClosedLoop.wallMechanics[wallId].fiberLogStrain);
  const residualByWall = wallRecord((wallId) => {
    const baseWall = base.wallBackwardEulerAtEqualStatesByWall[wallId];
    const baseLand = baseDecoded.landByWall[wallId];
    const trialLand = trialDecoded.landByWall[wallId];
    const strainIncrement = trialWallStrain[wallId]
      - base.wallMaterialByWall[wallId].fiberLogStrain;
    const rows: number[] = [];
    for (let row = 0; row < 4; row += 1) {
      let value = base.residual[6 * WALL_IDS.indexOf(wallId) + row]
        - baseWall.landResidualPartialByNextFiberLogStrain[row] * strainIncrement;
      for (let column = 0; column < 6; column += 1) {
        const beJacobian = baseWall.landStateJacobianRowMajor[row * 6 + column];
        const rhsJacobian = (row === column ? 1 : 0) - beJacobian;
        value += rhsJacobian * (trialLand[column] - baseLand[column]);
      }
      rows.push(requireFinite(value, `${wallId}.semismoothPopulation[${row}]`));
    }
    const material = context.binding.runtimeByWall[wallId];
    const length = evaluateLandLengthStateV1(
      material.landWallAdapterContext,
      { fiberLogStrain: trialWallStrain[wallId] },
    );
    rows.push(
      trialLand[4] + material.landEquationParameters.derived.Aw * length.landStretch,
      trialLand[5] + material.landEquationParameters.derived.As * length.landStretch,
    );
    return Object.freeze(rows);
  });
  const slsResidual = context.slsMode === "on"
    ? WALL_IDS.map((wallId) =>
      requireRecord(trialDecoded.slsAlphaVByWall, "trial.slsAlphaVByWall")[wallId]
      - trialWallStrain[wallId])
    : [];
  return Object.freeze([
    ...WALL_IDS.flatMap((wallId) => residualByWall[wallId]),
    ...slsResidual,
    trialClosedLoop.triSegOracle.equilibriumResidual.axialNPerM,
    trialClosedLoop.triSegOracle.equilibriumResidual.radialNPerM,
  ]);
}

function closedLoopWallOutput(
  context: ColdContext,
  wallId: FourChamberWallId,
  evaluation: PhaseB1WallMaterialStateEvaluationV1,
  wallReferenceMaterialVolumeM3: number,
  eta: number,
) {
  const totalStressPa = homotopyTotalStressPa(context, wallId, evaluation, eta);
  const totalTangentPa = evaluation.passive.dStressDFiberLogStrainPa
    + evaluation.sls.stressPartialPaPerFiberLogStrainAtFixedAlpha
    + eta * evaluation.wallActiveStressPartialPaPerFiberLogStrainAtFixedLandState;
  return closedLoopWallOutputFromStress(
    context,
    evaluation,
    wallReferenceMaterialVolumeM3,
    totalStressPa,
    totalTangentPa,
  );
}

function closedLoopWallOutputFromStress(
  context: ColdContext,
  evaluation: PhaseB1WallMaterialStateEvaluationV1,
  wallReferenceMaterialVolumeM3: number,
  totalStressPa: number,
  totalTangentPa: number,
) {
  const material = context.binding.runtimeByWall[evaluation.wallId];
  const slsStoredEnergyJ = wallReferenceMaterialVolumeM3
    * evaluation.sls.storedEnergyDensityJPerM3;
  const slsPhysicalDissipationW = evaluation.sls.mode === "on"
    ? wallReferenceMaterialVolumeM3
      * evaluation.sls.overstressPa * evaluation.sls.overstressPa
      / (
        material.passiveSls.compiledSls.EVPa
        * material.passiveSls.compiledSls.tauSec
      )
    : 0;
  return Object.freeze({
    equilibriumPassive: evaluation.passive,
    activeKirchhoffStressPa: evaluation.wallActiveKirchhoffStressPa,
    activeStressTimeDerivativePaPerSec: 0,
    slsOverstressPa: evaluation.sls.overstressPa,
    slsStoredEnergyJ,
    slsPhysicalDissipationW,
    totalKirchhoffStressPa: requireFinite(totalStressPa, "cold total stress"),
    totalTangentAtFixedInternalStatePa:
      requireFinite(totalTangentPa, "cold total tangent"),
  });
}

function homotopyTotalStressPa(
  context: ColdContext,
  wallId: FourChamberWallId,
  material: PhaseB1WallMaterialStateEvaluationV1,
  eta: number,
): number {
  return material.passive.equilibriumKirchhoffStressPa
    + material.sls.overstressPa
    + (1 - eta) * context.scaffold.targetFiberStressPaByWall[wallId]
    + eta * material.wallActiveKirchhoffStressPa;
}

function buildTangentPredictor(
  context: ColdContext,
  node: PhaseB1ColdNodeSuccessV1,
  deltaEta: number,
): readonly number[] {
  const atZero = evaluateColdResidual(context, node.unknowns, 0).residual;
  const atOne = evaluateColdResidual(context, node.unknowns, 1).residual;
  const derivativeByEta = atOne.map((value, index) => value - atZero[index]);
  const scaledJacobian = scaleDenseJacobianRowMajorV1(
    node.algorithmicJacobian.rawJacobian.flat(),
    context.layout.unknownScales,
    context.layout.residualScales,
  );
  const scaledDerivative = scaleResidualVectorV1(
    derivativeByEta,
    context.layout.residualScales,
  );
  const linear = solveScaledDensePartialPivotLuV1(
    scaledJacobian,
    Array.from(scaledDerivative, (value) => -value),
    PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.relativePivotTolerance,
  );
  if (linear.success === false) {
    throw new Error(`tangent linear solve failed: ${linear.message}`);
  }
  return Object.freeze(node.unknowns.map((value, index) =>
    value + deltaEta * linear.solution[index] * context.layout.unknownScales[index]));
}

function auditEffectiveTriSeg(
  context: ColdContext,
  eta: number,
  unknowns: readonly number[],
  residual: PhaseB1ColdResidualEvaluationV1,
  jacobian: ScaledFivePointAlgorithmicJacobianV1,
): PhaseB1ColdEffectiveTriSegAuditV1 {
  const materialCount = context.layout.materialUnknownCount;
  const qScales = context.layout.unknownScales.slice(materialCount);
  const materialUnknownScales = context.layout.unknownScales.slice(0, materialCount);
  const materialResidualScales = context.layout.residualScales.slice(0, materialCount);
  const triResidualScale = context.layout.residualScales[materialCount];
  const raw = jacobian.rawJacobian;
  const scaledA = new Array<number>(materialCount * materialCount);
  for (let row = 0; row < materialCount; row += 1) {
    for (let column = 0; column < materialCount; column += 1) {
      scaledA[row * materialCount + column] = raw[row][column]
        * materialUnknownScales[column] / materialResidualScales[row];
    }
  }
  const solvedMaterialByQ: number[][] = [];
  let materialLuDiagnostics: ScaledDenseLuDiagnosticsV1 | null = null;
  for (let qColumn = 0; qColumn < 2; qColumn += 1) {
    const scaledB = Array.from({ length: materialCount }, (_, row) =>
      raw[row][materialCount + qColumn]
      * qScales[qColumn] / materialResidualScales[row]);
    const solved = solveScaledDensePartialPivotLuV1(
      scaledA,
      scaledB,
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1.relativePivotTolerance,
    );
    if (solved.success === false) {
      throw new Error(`cold material Schur solve failed: ${solved.message}`);
    }
    materialLuDiagnostics = solved.diagnostics;
    solvedMaterialByQ.push([...solved.solution]);
  }
  if (materialLuDiagnostics === null) throw new Error("cold material Schur diagnostics missing");
  const schurGScaled: number[] = [];
  for (let gRow = 0; gRow < 2; gRow += 1) {
    for (let qColumn = 0; qColumn < 2; qColumn += 1) {
      let entry = raw[materialCount + gRow][materialCount + qColumn]
        * qScales[qColumn] / triResidualScale;
      for (let materialColumn = 0; materialColumn < materialCount; materialColumn += 1) {
        const scaledC = raw[materialCount + gRow][materialColumn]
          * materialUnknownScales[materialColumn] / triResidualScale;
        entry -= scaledC * solvedMaterialByQ[qColumn][materialColumn];
      }
      schurGScaled.push(entry);
    }
  }
  const yM = residual.endpoint.triSegCoordinates.y_m;
  const gAxial = residual.triSegResidualNPerM.axial;
  const gRadial = residual.triSegResidualNPerM.radial;
  const registry = context.scaleRegistry;
  const generalizedScales = [
    registry.residualScales.virtualWorkSeptalVolumePa,
    registry.residualScales.virtualWorkJunctionRadiusN,
  ] as const;
  const schurRaw = schurGScaled.map((value, index) =>
    value * triResidualScale / qScales[index % 2]);
  const scaledSchurGeneralizedForceTangent = Object.freeze([
    (2 / yM) * schurRaw[0] * qScales[0] / generalizedScales[0],
    ((2 / yM) * schurRaw[1] - 2 * gAxial / (yM * yM))
      * qScales[1] / generalizedScales[0],
    (2 * Math.PI * yM) * schurRaw[2] * qScales[0] / generalizedScales[1],
    (2 * Math.PI * yM * schurRaw[3] + 2 * Math.PI * gRadial)
      * qScales[1] / generalizedScales[1],
  ] as const);
  const q = residual.endpoint.triSegCoordinates;
  const generalizedForceAtReequilibratedQ = (values: readonly number[]) => {
    const reequilibrated = buildAnalyticallyReequilibratedUnknowns(context, {
      V_m_S: values[0],
      y_m: values[1],
    });
    const at = evaluateColdResidual(context, reequilibrated, eta);
    return [
      2 * at.triSegResidualNPerM.axial / values[1],
      2 * Math.PI * values[1] * at.triSegResidualNPerM.radial,
    ];
  };
  const derivativeOptions = (scaledStep: number) => ({
    unknownScales: qScales,
    residualScales: generalizedScales,
    lowerBounds: [null, PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
      .strictJunctionRadiusLowerBoundM],
    scaledStep,
  } as const);
  const coarse = evaluateScaledFivePointAlgorithmicJacobianV1(
    generalizedForceAtReequilibratedQ,
    [q.V_m_S, q.y_m],
    derivativeOptions(
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .coarseReequilibratedTangentScaledStep,
    ),
  );
  const fine = evaluateScaledFivePointAlgorithmicJacobianV1(
    generalizedForceAtReequilibratedQ,
    [q.V_m_S, q.y_m],
    derivativeOptions(
      PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1
        .fineReequilibratedTangentScaledStep,
    ),
  );
  const coarseTuple = matrixTuple(coarse.scaledJacobian);
  const fineTuple = matrixTuple(fine.scaledJacobian);
  const symmetricFineTangent = symmetricPart(fineTuple);
  const eigenvaluesAscending = symmetricEigenvalues(symmetricFineTangent);
  const derivativeDisagreementTwoNorm = matrixTwoNorm(
    subtractMatrix(coarseTuple, fineTuple),
  );
  const symmetricNorm = Math.max(
    Math.abs(eigenvaluesAscending[0]),
    Math.abs(eigenvaluesAscending[1]),
  );
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const uncertaintyBound = Math.max(
    policy.derivativeDisagreementMultiplier * derivativeDisagreementTwoNorm,
    policy.relativeStaticTangentUncertaintyFloor * Math.max(1, symmetricNorm),
  );
  const classification = classifyStaticTangent(eigenvaluesAscending, uncertaintyBound);
  const robustSignedMargin = restoringMargin(
    classification,
    eigenvaluesAscending,
    uncertaintyBound,
  );
  const diagnostics = diagnoseTwoByTwo(fineTuple);
  const schurToReequilibratedDifferenceTwoNorm = matrixTwoNorm(
    subtractMatrix(scaledSchurGeneralizedForceTangent, fineTuple),
  );
  const withinPublishedTaylorTwoPercentTensionErrorDomain =
    residual.closedLoop.triSegOracle.domainClassification
      === "within_2pct_tension_error_domain";
  const accepted = classification === "robust-restoring"
    && robustSignedMargin >= policy.minimumStaticRestoringMargin
    && diagnostics.sigmaMinimum >= policy.minimumEffectiveTriSegSigma
    && diagnostics.conditionNumber2 <= policy.maximumEffectiveTriSegConditionNumber2
    && schurToReequilibratedDifferenceTwoNorm
      <= policy.maximumSchurToReequilibratedTangentDifferenceTwoNorm
    && withinPublishedTaylorTwoPercentTensionErrorDomain
    && materialLuDiagnostics.relativeMinimumPivot > policy.relativePivotTolerance;
  return Object.freeze({
    auditId: "phase-b1-cold-equilibrium-material-schur-triseg-audit-v1",
    scaledSchurGeneralizedForceTangent,
    scaledReequilibratedCoarseTangent: coarseTuple,
    scaledReequilibratedFineTangent: fineTuple,
    symmetricFineTangent,
    eigenvaluesAscending,
    derivativeDisagreementTwoNorm,
    uncertaintyBound,
    robustSignedMargin,
    classification,
    sigmaMinimum: diagnostics.sigmaMinimum,
    conditionNumber2: diagnostics.conditionNumber2,
    schurToReequilibratedDifferenceTwoNorm,
    withinPublishedTaylorTwoPercentTensionErrorDomain,
    accepted,
    energeticStabilityClaimed: false,
    globalUniquenessClaimed: false,
  });
}

function diagnoseTwoByTwo(matrix: readonly [number, number, number, number]) {
  const a = matrix[0];
  const b = matrix[1];
  const c = matrix[2];
  const d = matrix[3];
  const trace = a * a + b * b + c * c + d * d;
  const determinant = a * d - b * c;
  const discriminant = Math.sqrt(Math.max(0, trace * trace - 4 * determinant * determinant));
  const sigmaMax = Math.sqrt(Math.max(0, 0.5 * (trace + discriminant)));
  const sigmaMinimum = Math.sqrt(Math.max(0, 0.5 * (trace - discriminant)));
  return Object.freeze({
    sigmaMinimum,
    conditionNumber2: sigmaMinimum > 0 ? sigmaMax / sigmaMinimum : Number.POSITIVE_INFINITY,
  });
}

function runRootCensus(context: ColdContext, eta: 0 | 1): PhaseB1ColdRootCensusV1 {
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const results = runRootCensusNodeResults(
    context,
    eta,
    policy.enumerationSeeds,
  );
  const clusters: Array<{
    representativeResultIndex: number;
    memberResultIndices: number[];
    classification: PhaseB1ColdEffectiveTriSegAuditV1["classification"];
    coordinates: Readonly<{ V_m_S: number; y_m: number }>;
  }> = [];
  results.forEach((result, resultIndex) => {
    if (!result.converged) return;
    const existing = clusters.find((cluster) => {
      const representative = results[cluster.representativeResultIndex];
      return representative.converged
        && scaledInfinityDistance(
          representative.unknowns,
          result.unknowns,
          context.layout.unknownScales,
        ) <= policy.rootClusteringScaledInfinityTolerance;
    });
    if (existing !== undefined) {
      existing.memberResultIndices.push(resultIndex);
    } else {
      clusters.push({
        representativeResultIndex: resultIndex,
        memberResultIndices: [resultIndex],
        classification: result.effectiveTriSegAudit.classification,
        coordinates: Object.freeze({ ...result.endpoint.triSegCoordinates }),
      });
    }
  });
  return Object.freeze({
    eta,
    seeds: policy.enumerationSeeds,
    results: Object.freeze(results),
    convergedRootCount: results.filter((result) => result.converged).length,
    clusters: Object.freeze(clusters.map((cluster) => Object.freeze({
      ...cluster,
      memberResultIndices: Object.freeze(cluster.memberResultIndices),
    }))),
    enumerationCompleted: results.length === policy.enumerationSeeds.length,
    allSeedsAttempted: results.length === policy.enumerationSeeds.length,
    allSeedsConverged: results.every((result) => result.converged),
    allDiscoveredRootsReported: true,
    globalExhaustivenessClaimed: false,
    selectionInputToAcceptedPath: false,
  });
}

function runRootCensusNodeResults(
  context: ColdContext,
  eta: 0 | 1,
  seeds: readonly Readonly<{ V_m_S: number; y_m: number }>[],
): PhaseB1ColdNodeResultV1[] {
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  return seeds.map((seed) => {
    const root = solvePublishedTriSegRootV1({
      leftVentricularCavityVolumeM3:
        context.fixedBloodVolumesM3.LV,
      rightVentricularCavityVolumeM3:
        context.fixedBloodVolumesM3.RV,
      walls: context.triSegWalls,
      initialCoordinates: Object.freeze({
        septalMidwallCapVolumeM3: seed.V_m_S,
        junctionRadiusM: seed.y_m,
      }),
      evaluateWallStress: (geometry) => Object.freeze({
        fiberKirchhoffStressPa: triSegWallRecord((wallId) =>
          reequilibratedTriSegWallStressPa(context, wallId, geometry, eta)),
      }),
      unknownScales: Object.freeze({
        septalMidwallCapVolumeM3:
          context.scaleRegistry.unknownScales.septalMidwallVolumeM3,
        junctionRadiusM:
          context.scaleRegistry.unknownScales.junctionRadiusM,
      }),
      equilibriumResidualScaleNPerM:
        context.scaleRegistry.residualScales
          .publishedTriSegEquilibriumNPerM,
      junctionRadiusLowerBoundM: policy.strictJunctionRadiusLowerBoundM,
      algorithmicJacobianScaledStep: policy.algorithmicJacobianScaledStep,
    });
    if (root.converged === false) {
      return coldFailure(
        eta,
        root.reason,
        root.message,
        buildAnalyticallyReequilibratedUnknowns(context, seed),
        buildAnalyticallyReequilibratedUnknowns(context, {
          V_m_S: root.lastAcceptedCoordinates.septalMidwallCapVolumeM3,
          y_m: root.lastAcceptedCoordinates.junctionRadiusM,
        }),
        root.newtonDiagnostics,
      );
    }
    return solveColdNode(
      context,
      eta,
      buildAnalyticallyReequilibratedUnknowns(context, {
        V_m_S: root.coordinates.septalMidwallCapVolumeM3,
        y_m: root.coordinates.junctionRadiusM,
      }),
      false,
    );
  });
}

function runDeclaredEtaOneFixedVolumeRootCensus(
  context: ColdContext,
  seedOrder: "declared" | "reverse",
): PhaseB1ColdEtaOneFixedVolumeRootCensusV1 {
  const policy = PHASE_B1_PROJECT_SYNTHETIC_COLD_INITIALIZATION_POLICY_V1;
  const seeds = seedOrder === "declared"
    ? policy.enumerationSeeds
    : Object.freeze([...policy.enumerationSeeds].reverse());
  const results = Object.freeze(runRootCensusNodeResults(
    context,
    PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1.eta,
    seeds,
  ).map(narrowEtaOneNodeResult));
  const clusters: Array<{
    representativeResultIndex: number;
    memberResultIndices: number[];
    classification: PhaseB1ColdEffectiveTriSegAuditV1["classification"];
    coordinates: Readonly<{ V_m_S: number; y_m: number }>;
  }> = [];
  results.forEach((result, resultIndex) => {
    if (!result.converged) return;
    const existing = clusters.find((cluster) => {
      const representative = results[cluster.representativeResultIndex];
      return representative.converged
        && scaledInfinityDistance(
          representative.unknowns,
          result.unknowns,
          context.layout.unknownScales,
        ) <= policy.rootClusteringScaledInfinityTolerance;
    });
    if (existing !== undefined) {
      existing.memberResultIndices.push(resultIndex);
    } else {
      clusters.push({
        representativeResultIndex: resultIndex,
        memberResultIndices: [resultIndex],
        classification: result.effectiveTriSegAudit.classification,
        coordinates: Object.freeze({ ...result.endpoint.triSegCoordinates }),
      });
    }
  });
  const frozenClusters = Object.freeze(clusters.map((cluster) => {
    const representative = results[cluster.representativeResultIndex];
    if (representative.converged === false) {
      throw new Error("eta-one fixed-volume census representative did not converge");
    }
    const memberResults = cluster.memberResultIndices.map((resultIndex) => {
      const member = results[resultIndex];
      if (member?.converged !== true) {
        throw new Error("eta-one fixed-volume census cluster contains a failed result");
      }
      return member;
    });
    const maximumMemberScaledInfinityDistance = Math.max(
      ...memberResults.map((member) => scaledInfinityDistance(
        representative.unknowns,
        member.unknowns,
        context.layout.unknownScales,
      )),
    );
    return Object.freeze({
      representativeResultIndex: cluster.representativeResultIndex,
      memberResultIndices: Object.freeze([...cluster.memberResultIndices]),
      classification: cluster.classification,
      coordinates: cluster.coordinates,
      maximumMemberScaledInfinityDistance,
      memberFullVectorDistancePass:
        maximumMemberScaledInfinityDistance
          <= policy.rootClusteringScaledInfinityTolerance,
      memberClassificationMatches: memberResults.every((member) =>
        member.effectiveTriSegAudit.classification === cluster.classification),
    });
  }));
  const convergedResultIndices = results.flatMap((result, resultIndex) =>
    result.converged ? [resultIndex] : []);
  const clusteredResultIndices = frozenClusters.flatMap((cluster) =>
    cluster.memberResultIndices).sort((left, right) => left - right);
  const convergedResultsPartitionedExactlyOnce =
    convergedResultIndices.length === clusteredResultIndices.length
    && new Set(clusteredResultIndices).size === clusteredResultIndices.length
    && convergedResultIndices.every(
      (resultIndex, index) => resultIndex === clusteredResultIndices[index],
    );
  return Object.freeze({
    eta: PHASE_B1_COLD_ETA_ONE_FIXED_VOLUME_SOLVER_POLICY_V1.eta,
    seedOrder,
    seeds,
    results,
    convergedRootCount: results.filter((result) => result.converged).length,
    clusters: frozenClusters,
    enumerationCompleted: results.length === seeds.length,
    allSeedsAttempted: results.length === seeds.length,
    allSeedsConverged: results.every((result) => result.converged),
    convergedResultsPartitionedExactlyOnce,
    allClusterMembersWithinFullVectorTolerance: frozenClusters.every(
      (cluster) => cluster.memberFullVectorDistancePass,
    ),
    allClusterMemberClassificationsMatch: frozenClusters.every(
      (cluster) => cluster.memberClassificationMatches,
    ),
    allDiscoveredRootsReported: true,
    globalExhaustivenessClaimed: false,
    selectionInputToAcceptedPath: false,
  });
}

function reequilibratedTriSegWallStressPa(
  context: ColdContext,
  wallId: TriSegWallId,
  geometry: PublishedTriSegGeometryV1,
  eta: number,
): number {
  const material = context.binding.runtimeByWall[wallId];
  const fiberLogStrain = geometry.walls[wallId].fiberLogStrain;
  const length = evaluateLandLengthStateV1(
    material.landWallAdapterContext,
    { fiberLogStrain },
  );
  const source = initializeLand2017IsometricSteadyStateV1(
    length.landStretch,
    context.freeCalciumUMByWall[wallId],
    material.landEquationParameters,
  );
  const landState = sourceLand2017StateToRateFreeV1(
    source,
    length.landStretch,
    material.landEquationParameters,
  );
  const evaluation = evaluatePhaseB1WallMaterialStateV1({
    wallMaterial: material,
    fiberLogStrain,
    freeCalciumUM: context.freeCalciumUMByWall[wallId],
    landState,
    slsMode: context.slsMode,
    alphaV: context.slsMode === "on" ? fiberLogStrain : null,
  });
  return homotopyTotalStressPa(context, wallId, evaluation, eta);
}

function auditCanonicalEndpointParity(
  context: ColdContext,
  node: PhaseB1ColdNodeSuccessV1,
): number {
  const decoded = decodeUnknowns(context, node.unknowns);
  const endpoint = endpointFromDecoded(context, decoded);
  const canonical = evaluateFourChamberClosedLoopSameTimeLevelV1({
    atrialGeometryPriorByChamber: context.atrialGeometryPriorByChamber,
    triSegWalls: context.triSegWalls,
    vascularComplianceParametersByCompartment:
      context.scaffold.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      context.scaffold.peripheralResistancePaSecPerM3ByFlow,
    valveLossParametersByFlow: context.scaffold.valveLossParametersByFlow,
    inletLossParametersByFlow: context.scaffold.inletLossParametersByFlow,
    pericardiumParameters: context.scaffold.pericardiumParameters,
    intrathoracicPressurePa: context.scaffold.intrathoracicPressurePa,
    state: Object.freeze({
      timeSec: endpoint.timeSec,
      bloodVolumesM3: endpoint.differentialState.bloodVolumesM3,
      inertialFlowsM3PerSec: endpoint.differentialState.inertialFlowsM3PerSec,
      triSegCoordinates: endpoint.triSegCoordinates,
    }),
    evaluateWall: ({ wallId, fiberLogStrain, wallReferenceMaterialVolumeM3 }) => {
      const material = evaluatePhaseB1WallMaterialStateV1({
        wallMaterial: context.binding.runtimeByWall[wallId],
        fiberLogStrain,
        freeCalciumUM: context.freeCalciumUMByWall[wallId],
        landState: decoded.landByWall[wallId],
        slsMode: context.slsMode,
        alphaV: context.slsMode === "on"
          ? requireRecord(decoded.slsAlphaVByWall, "slsAlphaVByWall")[wallId]
          : null,
      });
      return closedLoopWallOutputFromStress(
        context,
        material,
        wallReferenceMaterialVolumeM3,
        material.totalWallKirchhoffStressPa,
        material.totalStressPartialPaPerFiberLogStrainAtFixedInternalState,
      );
    },
  });
  const compared = [
    ...WALL_IDS.flatMap((wallId) => [
      node.residualEvaluation.closedLoop.wallMechanics[wallId].totalKirchhoffStressPa,
      canonical.wallMechanics[wallId].totalKirchhoffStressPa,
    ]),
    node.residualEvaluation.closedLoop.triSegOracle.equilibriumResidual.axialNPerM,
    canonical.triSegOracle.equilibriumResidual.axialNPerM,
    node.residualEvaluation.closedLoop.triSegOracle.equilibriumResidual.radialNPerM,
    canonical.triSegOracle.equilibriumResidual.radialNPerM,
  ];
  let maximum = 0;
  for (let index = 0; index < compared.length; index += 2) {
    maximum = Math.max(
      maximum,
      Math.abs(compared[index] - compared[index + 1])
        / Math.max(1, Math.abs(compared[index]), Math.abs(compared[index + 1])),
    );
  }
  return maximum;
}

function buildAnalyticallyReequilibratedUnknowns(
  context: ColdContext,
  coordinates: Readonly<{ V_m_S: number; y_m: number }>,
): readonly number[] {
  const fiberLogStrainByWall = fiberLogStrainByWallAtCoordinates(context, coordinates);
  const landByWall = wallRecord((wallId) => {
    const material = context.binding.runtimeByWall[wallId];
    const length = evaluateLandLengthStateV1(
      material.landWallAdapterContext,
      { fiberLogStrain: fiberLogStrainByWall[wallId] },
    );
    const source = initializeLand2017IsometricSteadyStateV1(
      length.landStretch,
      context.freeCalciumUMByWall[wallId],
      material.landEquationParameters,
    );
    return sourceLand2017StateToRateFreeV1(
      source,
      length.landStretch,
      material.landEquationParameters,
    );
  });
  return encodeDecoded(context, Object.freeze({
    landByWall,
    slsAlphaVByWall: context.slsMode === "on"
      ? wallRecord((wallId) => fiberLogStrainByWall[wallId])
      : null,
    triSegCoordinates: Object.freeze({ ...coordinates }),
  }));
}

function fiberLogStrainByWallAtCoordinates(
  context: ColdContext,
  coordinates: Readonly<{ V_m_S: number; y_m: number }>,
): Readonly<Record<FourChamberWallId, number>> {
  const geometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3: context.fixedBloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: context.fixedBloodVolumesM3.RV,
    septalMidwallCapVolumeM3: coordinates.V_m_S,
    junctionRadiusM: coordinates.y_m,
    walls: context.triSegWalls,
  });
  return Object.freeze({
    LA: evaluateAtrialOneFiberGeometryV1(
      context.fixedBloodVolumesM3.LA,
      context.atrialGeometryPriorByChamber.LA,
    ).fiberLogStrain,
    RA: evaluateAtrialOneFiberGeometryV1(
      context.fixedBloodVolumesM3.RA,
      context.atrialGeometryPriorByChamber.RA,
    ).fiberLogStrain,
    LVFW: geometry.walls.LVFW.fiberLogStrain,
    SEP: geometry.walls.SEP.fiberLogStrain,
    RVFW: geometry.walls.RVFW.fiberLogStrain,
  });
}

function endpointFromUnknowns(
  context: ColdContext,
  unknowns: readonly number[],
): PhaseB1EndpointStateV1 {
  return endpointFromDecoded(context, decodeUnknowns(context, unknowns));
}

function endpointFromDecoded(
  context: ColdContext,
  decoded: DecodedColdUnknowns,
): PhaseB1EndpointStateV1 {
  const common = Object.freeze({
    bloodVolumesM3: Object.freeze({ ...context.fixedBloodVolumesM3 }),
    inertialFlowsM3PerSec: Object.freeze({
      ...context.scaffold.initialState.inertialFlowsM3PerSec,
    }),
    calciumByWall: context.fixedCalciumByWall,
    landByWall: decoded.landByWall,
  });
  const differentialState: PhaseB1StoredDifferentialStateV1 =
    context.slsMode === "on"
      ? Object.freeze({
        ...common,
        slsMode: "on" as const,
        slsAlphaVByWall: requireRecord(decoded.slsAlphaVByWall, "slsAlphaVByWall"),
      })
      : Object.freeze({ ...common, slsMode: "off" as const });
  return createPhaseB1EndpointStateV1({
    timeSec: 0,
    differentialState,
    triSegCoordinates: decoded.triSegCoordinates,
  });
}

function decodeUnknowns(
  context: ColdContext,
  unknowns: readonly number[],
): DecodedColdUnknowns {
  if (unknowns.length !== context.layout.unknownCount) {
    throw new Error("cold unknown vector dimension mismatch");
  }
  let offset = 0;
  const landByWall = wallRecord(() => Object.freeze([
    requireFinite(unknowns[offset++], "cold.CaTRPN"),
    requireFinite(unknowns[offset++], "cold.B"),
    requireFinite(unknowns[offset++], "cold.W"),
    requireFinite(unknowns[offset++], "cold.S"),
    requireFinite(unknowns[offset++], "cold.xiW"),
    requireFinite(unknowns[offset++], "cold.xiS"),
  ] as RateFreeLand2017StateV1));
  const slsAlphaVByWall = context.slsMode === "on"
    ? wallRecord(() => requireFinite(unknowns[offset++], "cold.alphaV"))
    : null;
  const triSegCoordinates = Object.freeze({
    V_m_S: requireFinite(unknowns[offset++], "cold.V_m_S"),
    y_m: requirePositiveFinite(unknowns[offset++], "cold.y_m"),
  });
  if (offset !== context.layout.unknownCount) {
    throw new Error("cold unknown decoder offset drifted");
  }
  return Object.freeze({ landByWall, slsAlphaVByWall, triSegCoordinates });
}

function encodeDecoded(
  context: ColdContext,
  decoded: DecodedColdUnknowns,
): readonly number[] {
  const encoded = [
    ...WALL_IDS.flatMap((wallId) => decoded.landByWall[wallId]),
    ...(context.slsMode === "on"
      ? WALL_IDS.map((wallId) =>
        requireRecord(decoded.slsAlphaVByWall, "slsAlphaVByWall")[wallId])
      : []),
    decoded.triSegCoordinates.V_m_S,
    decoded.triSegCoordinates.y_m,
  ];
  if (encoded.length !== context.layout.unknownCount) {
    throw new Error("cold unknown encoder dimension drifted");
  }
  return Object.freeze(encoded);
}

function encodeUnknownsFromEndpoint(
  context: ColdContext,
  endpoint: PhaseB1EndpointStateV1,
): readonly number[] {
  return encodeDecoded(context, Object.freeze({
    landByWall: endpoint.differentialState.landByWall,
    slsAlphaVByWall: endpoint.differentialState.slsMode === "on"
      ? endpoint.differentialState.slsAlphaVByWall
      : null,
    triSegCoordinates: endpoint.triSegCoordinates,
  }));
}

function buildEtaGrid(
  subdivisionCount: number,
  direction: "forward" | "reverse",
): readonly number[] {
  if (!Number.isInteger(subdivisionCount) || subdivisionCount < 1) {
    throw new Error("homotopy subdivision count must be a positive integer");
  }
  const forward = Array.from(
    { length: subdivisionCount + 1 },
    (_, index) => index / subdivisionCount,
  );
  return Object.freeze(direction === "forward" ? forward : forward.reverse());
}

function minimumLandSimplexMargin(unknowns: readonly number[]): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let wallIndex = 0; wallIndex < WALL_IDS.length; wallIndex += 1) {
    const offset = 6 * wallIndex;
    const ca = unknowns[offset];
    const b = unknowns[offset + 1];
    const w = unknowns[offset + 2];
    const s = unknowns[offset + 3];
    minimum = Math.min(minimum, ca, 1 - ca, b, w, s, 1 - b - w - s);
  }
  return minimum;
}

function landPopulationSimplexMargin(
  landState: RateFreeLand2017StateV1,
): number {
  const [ca, b, w, s] = landState;
  return Math.min(ca, 1 - ca, b, w, s, 1 - b - w - s);
}

function numericRecordsEqual(left: object, right: object): boolean {
  const leftRecord = left as Readonly<Record<string, number>>;
  const rightRecord = right as Readonly<Record<string, number>>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.hasOwn(rightRecord, key)
      && leftRecord[key] === rightRecord[key]);
}

function maximumPairwiseDistance(
  vectors: readonly (readonly number[])[],
  scales: readonly number[],
): number {
  let maximum = 0;
  for (let left = 0; left < vectors.length; left += 1) {
    for (let right = left + 1; right < vectors.length; right += 1) {
      maximum = Math.max(
        maximum,
        scaledInfinityDistance(vectors[left], vectors[right], scales),
      );
    }
  }
  return maximum;
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("scaled cold distance dimension mismatch");
  }
  return Math.max(...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function classifyStaticTangent(
  eigenvalues: readonly [number, number],
  uncertainty: number,
): PhaseB1ColdEffectiveTriSegAuditV1["classification"] {
  const positive = eigenvalues.filter((value) => value > uncertainty).length;
  const negative = eigenvalues.filter((value) => value < -uncertainty).length;
  if (positive === 2) return "robust-restoring";
  if (positive === 1 && negative === 1) return "robust-saddle";
  if (negative === 2) return "robust-antirestoring-maximum";
  return "indeterminate";
}

function restoringMargin(
  classification: PhaseB1ColdEffectiveTriSegAuditV1["classification"],
  eigenvalues: readonly [number, number],
  uncertainty: number,
): number {
  if (classification === "robust-restoring") return eigenvalues[0] - uncertainty;
  if (classification === "robust-saddle") {
    return Math.min(-eigenvalues[0] - uncertainty, eigenvalues[1] - uncertainty);
  }
  if (classification === "robust-antirestoring-maximum") {
    return -eigenvalues[1] - uncertainty;
  }
  return Math.min(Math.abs(eigenvalues[0]), Math.abs(eigenvalues[1])) - uncertainty;
}

function symmetricEigenvalues(
  matrix: readonly [number, number, number, number],
): readonly [number, number] {
  const traceHalf = 0.5 * (matrix[0] + matrix[3]);
  const radius = Math.hypot(0.5 * (matrix[0] - matrix[3]), matrix[1]);
  return Object.freeze([traceHalf - radius, traceHalf + radius]);
}

function symmetricPart(
  matrix: readonly [number, number, number, number],
): readonly [number, number, number, number] {
  const off = 0.5 * (matrix[1] + matrix[2]);
  return Object.freeze([matrix[0], off, off, matrix[3]]);
}

function subtractMatrix(
  left: readonly [number, number, number, number],
  right: readonly [number, number, number, number],
): readonly [number, number, number, number] {
  return Object.freeze([
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2],
    left[3] - right[3],
  ]);
}

function matrixTwoNorm(matrix: readonly [number, number, number, number]): number {
  const a = matrix[0];
  const b = matrix[1];
  const c = matrix[2];
  const d = matrix[3];
  const trace = a * a + b * b + c * c + d * d;
  const determinant = a * d - b * c;
  return Math.sqrt(Math.max(0, 0.5 * (
    trace + Math.sqrt(Math.max(0, trace * trace - 4 * determinant * determinant))
  )));
}

function matrixTuple(
  matrix: readonly (readonly number[])[],
): readonly [number, number, number, number] {
  if (matrix.length !== 2 || matrix[0].length !== 2 || matrix[1].length !== 2) {
    throw new Error("expected a 2x2 matrix");
  }
  return Object.freeze([matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]]);
}

function assertResidualsRoundoffEqual(
  actual: readonly number[],
  expected: readonly number[],
): void {
  if (actual.length !== expected.length) throw new Error("cold residual length mismatch");
  for (let index = 0; index < actual.length; index += 1) {
    const tolerance = 4096 * Number.EPSILON * Math.max(
      1,
      Math.abs(actual[index]),
      Math.abs(expected[index]),
    );
    if (Math.abs(actual[index] - expected[index]) > tolerance) {
      throw new Error(`cold semismooth base mismatch at residual ${index}`);
    }
  }
}

function wallRecord<T>(
  evaluate: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(
    WALL_IDS.map((wallId) => [wallId, evaluate(wallId)]),
  )) as Readonly<Record<FourChamberWallId, T>>;
}

function triSegWallRecord<T>(
  evaluate: (wallId: TriSegWallId) => T,
): Readonly<Record<TriSegWallId, T>> {
  return Object.freeze(Object.fromEntries(
    TRISEG_WALL_IDS.map((wallId) => [wallId, evaluate(wallId)]),
  )) as Readonly<Record<TriSegWallId, T>>;
}

function requireRecord<T>(value: T | null, field: string): T {
  if (value === null) throw new Error(`${field} is required in SLS-on mode`);
  return value;
}

function requireHomotopyFraction(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("material homotopy eta must lie in [0,1]");
  }
  return value;
}

function requireFinite(value: number | null | undefined, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be positive and finite`);
  return value;
}

function maximumAbsolute(values: ArrayLike<number>): number {
  let maximum = 0;
  for (let index = 0; index < values.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(values[index]));
  }
  return maximum;
}

function deepFreezeReferenceConfiguredResult<Value>(
  value: Value,
  seen: WeakSet<object> = new WeakSet<object>(),
): Value {
  if (value === null || typeof value !== "object") return value;
  const objectValue = value as object;
  if (seen.has(objectValue)) return value;
  seen.add(objectValue);
  for (const key of Reflect.ownKeys(objectValue)) {
    const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
    if (descriptor !== undefined && "value" in descriptor) {
      deepFreezeReferenceConfiguredResult(descriptor.value, seen);
    }
  }
  return Object.freeze(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
