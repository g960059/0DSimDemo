import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { ENERGY_CONJUGATE_TRISEG_V1_ID } from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  assertCompiledEquilibriumOneFiberPassiveV1,
  EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
} from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import {
  assertCompiledMoyer2015AtrialEquibiaxialPassiveV1,
  MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID,
} from "@/engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1";
import {
  assertNormalAdultFiveWallPriorV1,
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const PASSIVE_MULTICHAMBER_EQUILIBRIUM_ENERGY_SURFACE_MYOCARDIUM_V1_ID =
  "passive-multichamber-equilibrium-energy-surface-myocardium-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID =
  "main-wire-normal-adult-five-wall-passive-equilibrium-point-owner-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1_ID =
  "main-wire-normal-adult-passive-equilibrium-point-solver-policy-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1_ID =
  "main-wire-normal-adult-passive-equilibrium-branch-policy-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1 =
  Object.freeze([
    "primary-zero-offset-canonical-root",
    "alternate-lv-first",
    "alternate-rv-first",
    "seed-minus-0.25-minus-0.25",
    "seed-minus-0.25-zero",
    "seed-minus-0.25-plus-0.25",
    "seed-zero-minus-0.25",
    "seed-zero-zero",
    "seed-zero-plus-0.25",
    "seed-plus-0.25-minus-0.25",
    "seed-plus-0.25-zero",
    "seed-plus-0.25-plus-0.25",
  ] as const);

export type MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1 =
  (typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1)[number];

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1 =
  Object.freeze(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1.flatMap(
      (leftParticipantId, leftIndex, participants) =>
        participants
          .slice(leftIndex + 1)
          .map((rightParticipantId) =>
            Object.freeze([leftParticipantId, rightParticipantId] as const),
          ),
    ),
  );

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1_ID =
  "main-wire-normal-adult-passive-equilibrium-surface-verification-policy-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_PREREGISTRATION_V1 =
  deepFreezePayloadV1({
    commitSha: "d332b2a6e7d4f61a3785bfce3a5f630b7e83cfd6",
    documentPath:
      "docs/scientific-runtime/INTEGRATED-MODEL-0018-passive-multichamber-equilibrium-energy-surface-preregistration.md",
    documentContentSha256:
      "6cff4db541106fd2774e4316fae0167eed1e8e413e549ad534927dac0db8937c",
    gitBlobSha1: "3fae899b3bb7cb0515797b0338ba1951592b589c",
    declarationStatus:
      "declared-before-first-normal-adult-surface-construction-or-verification-result",
  });

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1 =
  deepFreezePayloadV1({
    LA: 35.72e-6,
    LV: 144.4e-6,
    RA: 47.31e-6,
    RV: 155.8e-6,
  });

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VOLUME_BOUNDS_M3_V1 =
  deepFreezePayloadV1({
    LA: { minimum: 35.72e-6, maximum: 80.18e-6 },
    LV: { minimum: 53.2e-6, maximum: 144.4e-6 },
    RA: { minimum: 47.31e-6, maximum: 98.04e-6 },
    RV: { minimum: 66.5e-6, maximum: 155.8e-6 },
  });

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1 =
  deepFreezePayloadV1({
    policyId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1_ID,
    coordinateOrder: ["septal-midwall-cap-volume-m3", "junction-radius-m"],
    coordinateScales: {
      septalMidwallCapVolumeM3: 42e-6,
      junctionRadiusM: 0.033,
    },
    energyScaleJ: 1,
    maximumNewtonIterationsPerStage: 48,
    maximumLineSearchBacktracks: 28,
    lineSearchInitialStep: 1,
    lineSearchContraction: 0.5,
    armijoCoefficient: 1e-4,
    scaledForceInfinityTolerance: 1e-10,
    scaledUpdateStagnationLimit: 1e-11,
    minimumScaledInternalHessianEigenvalueExclusive: 1e-10,
    minimumJunctionRadiusMExclusive: 1e-5,
    newtonDirection:
      "d=-inverse(scaled-internal-hessian)*scaled-internal-gradient",
    newtonHessianIsUnregularized: true,
    descentRequirement: "dot(scaled-gradient,d)<0",
    lineSearch: {
      candidateExponentRangeInclusive: [0, 28],
      candidateAlphaFormula: "alpha=2^(-b)",
      candidateCoordinatesFormula: "q_next=q+Dq*(alpha*d)",
      armijoFormula: "U(q_next)<=U(q)+1e-4*alpha*1J*dot(scaled-gradient,d)",
      inadmissibleOrNonfiniteCandidateAction: "continue-backtracking",
    },
    stagnationSemantics:
      "fail-only-when-force-tolerance-not-reached-and-accepted-scaled-update-infinity-norm-is-at-most-limit",
    successfulStageSemantics:
      "force-tolerance-and-strict-scaled-internal-hessian-stability-required-at-every-stage-including-terminal",
    iterationBoundarySemantics:
      "at-most-48-accepted-updates-followed-by-one-terminal-force-and-stability-evaluation",
    acceptedTrialDecisionOrder:
      "accepted-force-and-stability-are-evaluated-before-stagnation;stagnation-requires-force-above-tolerance",
    hessianShiftApplied: false,
    steepestDescentFallbackApplied: false,
    rescuePathApplied: false,
  });

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1 =
  deepFreezePayloadV1({
    policyId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1_ID,
    referenceVolumesM3:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
    inputBoundsM3:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VOLUME_BOUNDS_M3_V1,
    stageZero: {
      seedOwner: "normal-adult-prior-loaded-triseg-coordinates",
      rootRequirement: "strict-local-stable-equilibrium",
      commonSealedRootRequired: true,
    },
    primaryDiagonalHomotopy: {
      stageCount: 32,
      endpointFormula:
        "LV_k=LV_ref+(k/32)*(LV_target-LV_ref);RV_k=RV_ref+(k/32)*(RV_target-RV_ref);k=1,...,32",
      independentFromNeighbouringPoints: true,
    },
    auditLatticeAxisIndices: [0, 16, 32],
    auditLatticeEligibility: {
      leftVentricularAxis:
        "LV_i=53.2e-6+(i/32)*(144.4e-6-53.2e-6);i-in-{0,16,32}",
      rightVentricularAxis:
        "RV_i=66.5e-6+(i/32)*(155.8e-6-66.5e-6);i-in-{0,16,32}",
      matchingSemantics:
        "target-LV-and-target-RV-must-equal-the-values-produced-by-the-declared-endpoint-formulas",
      nonLatticeTargetAction: "fail-closed-without-running-participants",
    },
    alternatePaths: {
      lvFirst: {
        first:
          "stages-1-through-32:LV_k=LV_ref+(k/32)*(LV_target-LV_ref);RV_k=RV_ref;k=1,...,32",
        second:
          "stages-33-through-64:LV_k=LV_target;RV_k=RV_ref+((k-32)/32)*(RV_target-RV_ref);k=33,...,64",
      },
      rvFirst: {
        first:
          "stages-1-through-32:LV_k=LV_ref;RV_k=RV_ref+(k/32)*(RV_target-RV_ref);k=1,...,32",
        second:
          "stages-33-through-64:LV_k=LV_ref+((k-32)/32)*(LV_target-LV_ref);RV_k=RV_target;k=33,...,64",
      },
      stageCountPerPath: 64,
      stageCountPerLeg: 32,
      endpointFormula:
        "each varied coordinate uses V_k=V_ref+(k/32)*(V_target-V_ref);k=1,...,32",
    },
    referenceSeedOffsetsInScaledCoordinates: [
      [-0.25, -0.25],
      [-0.25, 0],
      [-0.25, 0.25],
      [0, -0.25],
      [0, 0],
      [0, 0.25],
      [0.25, -0.25],
      [0.25, 0],
      [0.25, 0.25],
    ],
    referenceSeedFormula: "q_seed=q_loaded+Dq*delta",
    referenceSeedQualification:
      "all-nine-seeds-must-solve-reference-and-traverse-primary-diagonal-homotopy",
    agreementParticipants:
      "primary-LV-first-RV-first-and-all-nine-seed-primary-terminal-roots",
    agreementParticipantOrder:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1,
    agreementPairOrder:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1,
    agreementPairEnumeration:
      "all-unordered-participant-pairs-in-agreementParticipantOrder-with-left-index-less-than-right-index",
    branchAgreement: {
      maximumScaledCoordinateDifference: 1e-7,
      maximumAbsoluteStoredEnergyDifferenceJ: 1e-10,
      maximumScaledPressureDifference: 1e-7,
      pressureFloorPa: 1,
      oneStableRootClusterRequired: true,
      coordinateFormula:
        "max(abs(qA.septalMidwallCapVolumeM3-qB.septalMidwallCapVolumeM3)/42e-6,abs(qA.junctionRadiusM-qB.junctionRadiusM)/0.033)",
      storedEnergyFormula:
        "abs(UA.canonicalFactorizedTotal-UB.canonicalFactorizedTotal)",
      pressureFormula:
        "max_c-in-[LA,LV,RA,RV](abs(PA_c-PB_c)/max(abs(PA_c),abs(PB_c),1Pa))",
      everyDeclaredPairMustPassAllThreeGates: true,
    },
    branchAuditResultPolicy: {
      version: "main-wire-normal-adult-passive-equilibrium-branch-audit-v1",
      successStatus: "branch-agreement-established",
      failureStatus: "branch-audit-failed",
      failureReasons: [
        "target-outside-branch-audit-lattice",
        "reference-root-binding-invalid",
        "required-participant-failed",
        "branch-agreement-split-cluster",
      ],
      allTwelveParticipantsAttemptedAfterAnyParticipantFailure: true,
      allSixtySixPairRecordsRetained: true,
      failedParticipantPairStatus: "not-compared-required-participant-failed",
      participantFailureOwnsCanonicalPointFailure: true,
      branchAgreementEstablishedOnlyWhenAllParticipantsAndPairsPass: true,
      sampledAgreementIsNotGlobalUniquenessOrContinuousBranchProof: true,
    },
    collectionOrders: {
      forward: [
        "LA-slice:LA-axis-index-0-through-32",
        "ventricles:LV-axis-index-0-through-32-outer;RV-axis-index-0-through-32-inner",
        "RA-slice:RA-axis-index-0-through-32",
      ],
      reverse: [
        "RA-slice:RA-axis-index-32-through-0",
        "ventricles:LV-axis-index-32-through-0-outer;RV-axis-index-32-through-0-inner",
        "LA-slice:LA-axis-index-32-through-0",
      ],
      serpentine: [
        "LA-slice:LA-axis-index-0-through-32",
        "ventricles:LV-axis-index-0-through-32-outer;RV-axis-index-0-through-32-when-LV-index-even-and-32-through-0-when-odd",
        "RA-slice:RA-axis-index-0-through-32",
      ],
    },
    collectionSortedPayloadKey: {
      componentOrder: ["LA-slice", "ventricles", "RA-slice"],
      LA: ["component-order", "leftAtrialAxisIndex-ascending-numeric"],
      ventricles: [
        "component-order",
        "leftVentricularAxisIndex-ascending-numeric",
        "rightVentricularAxisIndex-ascending-numeric",
      ],
      RA: ["component-order", "rightAtrialAxisIndex-ascending-numeric"],
    },
    collectionSortedPayloadComparison: "canonical-json-exact",
    collectionOrderIsScientificIdentity: false,
    collectionSemantics:
      "each-point-is-independently-rerun-through-primary-homotopy-and-sorted-result-payloads-compare-canonical-exact",
    precedingCompletedStagesRetainedOnFailure: true,
    stageZeroDigestSchema: {
      owns: [
        "reference-volumes",
        "complete-root-and-solver-evidence",
        "passiveMaterialGeometryBindingSha256",
        "pointSolverBranchProtocolSha256",
      ],
      surfaceVerificationProtocolSha256Included: false,
    },
    failureVersion:
      "main-wire-normal-adult-passive-equilibrium-point-failure-v1",
    failureSemantics: [
      "input-outside-declared-domain",
      "reference-root-binding-invalid",
      "candidate-evaluation-failed",
      "junction-radius-below-minimum",
      "scaled-internal-hessian-not-positive-definite",
      "scaled-internal-hessian-singular",
      "newton-direction-not-descent",
      "line-search-failed",
      "scaled-update-stagnated",
      "newton-iteration-limit",
      "qualified-terminal-schur-failed",
    ],
    solverFailureClassificationOrder: [
      "candidate-admissibility-and-finiteness",
      "scaled-internal-hessian-singularity",
      "strict-scaled-internal-hessian-stability",
      "scaled-force-convergence",
      "accepted-update-limit",
      "unregularized-newton-descent",
      "armijo-line-search",
      "accepted-candidate-singularity",
      "accepted-candidate-stability",
      "accepted-candidate-force-convergence",
      "accepted-update-stagnation",
    ],
    failureRecordSchema: {
      owns: [
        "owner-and-provenance-hashes",
        "failure-version-reason-phase-and-detail",
        "target-volumes-and-stage-zero-digest-if-available",
        "all-preceding-completed-stage-evidence",
        "failed-stage-volumes-seed-iterations-backtracks-and-last-candidate",
        "last-accepted-step-energy-force-direction-and-update-diagnostics",
      ],
      terminalProjectionFailureDoesNotRelabelCompletedStageAsFailed: true,
      failedResultContainsQualifiedPointOrSchurTangent: false,
    },
  });

/**
 * Complete preregistered surface-verification snapshot. The point owner binds
 * and hashes this policy but does not construct or verify a surface.
 */
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1 =
  deepFreezePayloadV1({
    policyId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1_ID,
    componentAxes: {
      LV: { count: 33, minimumM3: 53.2e-6, maximumM3: 144.4e-6 },
      RV: { count: 33, minimumM3: 66.5e-6, maximumM3: 155.8e-6 },
      LA: {
        count: 33,
        minimumM3: 35.72e-6,
        middleM3: 57.95e-6,
        maximumM3: 80.18e-6,
        intervalsPerSide: 16,
      },
      RA: {
        count: 33,
        minimumM3: 47.31e-6,
        middleM3: 72.58e-6,
        maximumM3: 98.04e-6,
        intervalsPerSide: 16,
      },
      repeatedFloatingPointAdditionAllowed: false,
      ventricularEndpointFormula: "V_i=V_min+(i/32)*(V_max-V_min);i=0,...,32",
      atrialEndpointFormula:
        "i<=16?V_min+(i/16)*(V_preA-V_min):V_preA+((i-16)/16)*(V_max-V_preA)",
    },
    frozenSampleCount: 1_155,
    biventricularGridShape: [33, 33],
    atrialSlicePointCountByAtrium: 33,
    chamberOrder: ["LA", "LV", "RA", "RV"],
    wallBindingOrder: ["LA", "LVFW", "SEP", "RVFW", "RA"],
    ventricularWallReductionOrder: ["LVFW", "SEP", "RVFW"],
    factorizedAssemblyOrder: ["LA", "ventricles", "RA"],
    anchorAssemblyAudit: {
      axisIndices: [0, 16, 32],
      pointCount: 81,
      canonicalValueIdentityRequired: true,
      atrialCrossBlocksExactZeroRequired: true,
      septumContributionCount: 1,
      namedChamberIndexMappingRequired: true,
      indexWallOrBlockMappingTamperMustFail: true,
    },
    finiteDifferenceAudit: {
      interiorAxisIndices: [8, 16, 24],
      pointCount: 81,
      coarseStepM3: 0.01e-6,
      fineStepM3: 0.005e-6,
      pressureFineScaledTolerance: 1e-5,
      pressureTrendFloor: 1e-8,
      pressureFloorPa: 1,
      trendAppliedPerConditionPointAndPressureComponent: true,
      globalMaximumOwnsSummaryOnly: true,
    },
    maxwellAudit: {
      analyticVsPressureFdTolerance: 1e-5,
      analyticVsEnergyFdTolerance: 1e-4,
      pressureFdVsEnergyFdTolerance: 1e-4,
      matrixAntisymmetryTolerance: 1e-6,
      analyticVsPressureTrendFloor: 1e-8,
      analyticVsEnergyTrendFloor: 1e-7,
      pressureVsEnergyTrendFloor: 1e-7,
      tangentFloorPaPerM3: 1e6,
      trendAppliedPerConditionPointAndDeclaredMatrixPair: true,
      energyFiniteDifferenceAssembly:
        "smallest-component-owners-LA-slice-biventricular-surface-RA-slice-and-pericardium-then-frozen-factor-order",
      myocardiumAtrialCrossTerms:
        "analytic-structural-exact-zero-and-pressure-fd-zero-without-large-total-energy-cancellation",
      pericardiumEngagement:
        "point-local-pressureDerivativePaPerM3>0;otherwise-canonical-structural-zero",
    },
    coupledHessianAudit: {
      order: ["LV", "RV", "septal-midwall-cap-volume", "junction-radius"],
      scales: [1e-6, 1e-6, 42e-6, 0.033],
      energyScaleJ: 1,
      scaledAntisymmetryTolerance: 1e-12,
      scaledAntisymmetryFormula:
        "max(abs(H4tilde-transpose(H4tilde)))/max(max(abs((H4tilde+transpose(H4tilde))/2)),1)",
      schurOrder: {
        external: ["LV", "RV"],
        internal: ["septal-midwall-cap-volume", "junction-radius"],
      },
    },
    pathAudit: {
      chamberPairCount: 6,
      chamberPairs: [
        ["LA", "LV"],
        ["LA", "RA"],
        ["LA", "RV"],
        ["LV", "RA"],
        ["LV", "RV"],
        ["RA", "RV"],
      ],
      variedAxisIndices: [8, 24],
      fixedAxisIndex: 16,
      trapezoidalSubdivisionsPerLeg: [8, 16, 32],
      finalOpenScaledTolerance: 1e-4,
      finalClosedScaledTolerance: 1e-4,
      workFloorJ: 1e-3,
      openDenominator: "max(leg-absolute-work-variation,abs(delta-Phi),1e-3J)",
      closedDenominator: "max(path-absolute-work-variation,1e-3J)",
      strictMonotonicityRequired: false,
      forwardReverseAndRotatedStartsRequired: true,
      externalConditionInvariantAlongPath: true,
    },
    pericardiumConditionCases: [
      "healthy-slack",
      "global-capacity-vh0-430ml-positive-control",
      "effusion-300ml-positive-control",
    ],
    pericardiumExactOffIsInclusiveInstance: false,
    additiveIdentityScaledTolerance: 1e-10,
    scalarFloors: {
      energyJ: 1e-12,
      pressurePa: 1,
      pressureVolumeTangentPaPerM3: 1e6,
    },
    requiredNegativeControls: [
      "chamber-pressure-sign-or-index-tamper",
      "Pa-mmHg-or-m3-mL-conversion-omission",
      "frozen-internal-coordinate-volume-derivative",
      "internal-coordinate-schur-omission",
      "off-diagonal-hessian-tamper",
      "pericardial-pressure-energy-inconsistency",
      "wall-or-fluid-double-count",
      "nonzero-exact-off-pericardium",
      "active-or-sls-stress-in-passive-surface",
      "moyer-outside-supported-strain",
      "condition-identity-change-along-path",
      "double-well-global-minimum-mislabel",
    ],
    gateAggregation: {
      thresholdsApplied:
        "per-condition-per-audit-point-per-scalar-component-or-declared-matrix-pair",
      maximaAndFirstOwnerIdsAreSummariesOnly: true,
      completeFrozenSampleAndDeclaredAuditPathCoverageRequired: true,
      failedRequiredPointMayBeDeleted: false,
      myocardiumAndInclusiveConditionStatusesRemainSeparate: true,
    },
    negativeClaims: {
      liveOutputOrGraphAdmission: false,
      edpvrOrPassiveFillingPathOwnership: false,
      pePvaMvo2AtpUse: false,
      mechanicalOrMetabolicEfficiency: false,
      dynamicHysteresisOrSlsDissipationOwnership: false,
      globalMinimumOrGlobalConvexityProof: false,
      continuousBoxBranchExistenceUniquenessDifferentiability: false,
      physiologicalOrClinicalValidation: false,
      patientSpecificity: false,
      effusionOrConstrictivePericarditisDiseaseValidation: false,
      septalEnergyAllocationToLeftOrRightVentricle: false,
    },
    preregistrationOwner:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_PREREGISTRATION_V1,
  });

type PassiveMaterialGeometryBindingPayloadV1 = ReturnType<
  typeof createPassiveMaterialGeometryBindingPayloadV1
>;

type PointSolverBranchProtocolPayloadV1 = Readonly<{
  pointSolverPolicy: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1;
  branchPolicy: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1;
}>;

export type MainWireNormalAdultPassiveEquilibriumPointProvenanceV1 = Readonly<{
  sourceProvenance: Readonly<{
    priorId: string;
    parameterIdentityHash: string;
  }>;
  passiveMaterialGeometryBindingPayload: PassiveMaterialGeometryBindingPayloadV1;
  passiveMaterialGeometryBindingSha256: string;
  pointSolverBranchProtocolPayload: PointSolverBranchProtocolPayloadV1;
  pointSolverBranchProtocolSha256: string;
  surfaceVerificationProtocolPayload: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1;
  surfaceVerificationProtocolSha256: string;
}>;

const provenanceRegistryV1 = new WeakSet<object>();

export async function createMainWireNormalAdultPassiveEquilibriumPointProvenanceV1(): Promise<MainWireNormalAdultPassiveEquilibriumPointProvenanceV1> {
  const passiveMaterialGeometryBindingPayload =
    createPassiveMaterialGeometryBindingPayloadV1();
  const pointSolverBranchProtocolPayload: PointSolverBranchProtocolPayloadV1 =
    deepFreezePayloadV1({
      pointSolverPolicy:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1,
      branchPolicy: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
    });
  const surfaceVerificationProtocolPayload =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1;
  const [
    passiveMaterialGeometryBindingSha256,
    pointSolverBranchProtocolSha256,
    surfaceVerificationProtocolSha256,
  ] = await Promise.all([
    sha256CanonicalJsonHex(passiveMaterialGeometryBindingPayload),
    sha256CanonicalJsonHex(pointSolverBranchProtocolPayload),
    sha256CanonicalJsonHex(surfaceVerificationProtocolPayload),
  ]);
  const provenance = deepFreezePayloadV1({
    sourceProvenance: {
      priorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.priorId,
      parameterIdentityHash:
        NORMAL_ADULT_FIVE_WALL_PRIOR_V1.parameterIdentityHash,
    },
    passiveMaterialGeometryBindingPayload,
    passiveMaterialGeometryBindingSha256,
    pointSolverBranchProtocolPayload,
    pointSolverBranchProtocolSha256,
    surfaceVerificationProtocolPayload,
    surfaceVerificationProtocolSha256,
  });
  provenanceRegistryV1.add(provenance);
  return provenance;
}

export function assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1(
  provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
): void {
  if (
    provenance === null ||
    typeof provenance !== "object" ||
    !provenanceRegistryV1.has(provenance) ||
    !Object.isFrozen(provenance)
  ) {
    throw new Error(
      "passive equilibrium point provenance must be freshly created by its canonical owner",
    );
  }
}

function createPassiveMaterialGeometryBindingPayloadV1() {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  assertNormalAdultFiveWallPriorV1(prior);
  assertCompiledMoyer2015AtrialEquibiaxialPassiveV1(
    prior.passive.atrial.compiled,
  );
  assertCompiledEquilibriumOneFiberPassiveV1(
    prior.passive.ventricular.compiled,
  );
  const wallGeometry = prior.anatomy.triSeg.wallGeometryParameters;
  return deepFreezePayloadV1({
    ownerId: PASSIVE_MULTICHAMBER_EQUILIBRIUM_ENERGY_SURFACE_MYOCARDIUM_V1_ID,
    pointOwnerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    constitutiveOwners: {
      atrial: MOYER_2015_ATRIAL_EQUIBIAXIAL_PASSIVE_V1_ID,
      ventricular: EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
      geometry: ENERGY_CONJUGATE_TRISEG_V1_ID,
    },
    mathematicalDefinition: {
      chamberOrder: ["LA", "LV", "RA", "RV"],
      internalCoordinateOrder: [
        "septal-midwall-cap-volume-m3",
        "junction-radius-m",
      ],
      wallBindingOrder: ["LA", "LVFW", "SEP", "RVFW", "RA"],
      ventricularWallReductionOrder: ["LVFW", "SEP", "RVFW"],
      totalEnergy: "U_myo=sum_wall(V_wall*psi_eq_wall(e_wall(V,q)))",
      canonicalTotalAssembly: "(LA+ventricles)+RA",
      directFiveWallTotalRole: "diagnostic-algebraic-binding-only",
      workSign: "dPhi=sum_chamber(P_chamber*dV_chamber)",
      coupledCoordinateOrder: ["LV", "RV", "VS", "y"],
      capVolumeJacobians: {
        LVFW: [-1, 0, 1, 0],
        SEP: [0, 0, 1, 0],
        RVFW: [0, 1, 1, 0],
      },
      wallHessian:
        "H_wall=V_wall*(C_eq*gradient(e)*transpose(gradient(e))+sigma_eq*Hessian(e))",
      reducedVentricularTangent:
        "H_zz-H_zq*inverse(H_qq)*H_qz;z=(LV,RV);q=(VS,y)",
      atrialPressureVolumeTangent:
        "Vwall/(3*(Vcavity+Vwall/2)^2)*(C_eq/3-sigma_eq)",
      canonicalUnits: {
        volume: "m3",
        energy: "J",
        pressure: "Pa",
        pressureVolumeTangent: "Pa/m3",
      },
    },
    consumedPassiveMaterials: {
      atrial: prior.passive.atrial.compiled,
      ventricular: prior.passive.ventricular.compiled,
      wallToMaterialBinding: {
        LA: materialBinding("atrial", prior.passive.atrial.compiled),
        LVFW: materialBinding(
          "ventricular",
          prior.passive.ventricular.compiled,
        ),
        SEP: materialBinding("ventricular", prior.passive.ventricular.compiled),
        RVFW: materialBinding(
          "ventricular",
          prior.passive.ventricular.compiled,
        ),
        RA: materialBinding("atrial", prior.passive.atrial.compiled),
      },
    },
    namedWallTuple: ["LA", "LVFW", "SEP", "RVFW", "RA"],
    namedWallMaterialVolumesM3: [
      {
        wallId: "LA",
        valueM3: prior.anatomy.atria.LA.wallMaterialVolumeMl * 1e-6,
      },
      { wallId: "LVFW", valueM3: wallGeometry.LVFW.wallMaterialVolumeM3 },
      { wallId: "SEP", valueM3: wallGeometry.SEP.wallMaterialVolumeM3 },
      { wallId: "RVFW", valueM3: wallGeometry.RVFW.wallMaterialVolumeM3 },
      {
        wallId: "RA",
        valueM3: prior.anatomy.atria.RA.wallMaterialVolumeMl * 1e-6,
      },
    ],
    atrialInverseUnloadedReferenceCavityVolumesM3: {
      LA: prior.anatomy.atria.LA.inverseUnloadedReferenceCavityVolumeMl * 1e-6,
      RA: prior.anatomy.atria.RA.inverseUnloadedReferenceCavityVolumeMl * 1e-6,
    },
    triSegReferenceMidwallAreasM2: {
      LVFW: wallGeometry.LVFW.referenceMidwallAreaM2,
      SEP: wallGeometry.SEP.referenceMidwallAreaM2,
      RVFW: wallGeometry.RVFW.referenceMidwallAreaM2,
    },
    triSegGeometryConventionId:
      prior.anatomy.triSeg.loadedReferenceGeometry.conventionId,
    loadedInternalCoordinateSeed: prior.anatomy.triSeg.loadedCoordinates,
    equilibriumPassiveOnly: true,
    landActiveIncluded: false,
    parallelSlsIncluded: false,
    frozenMaterialStateMembranePotentialIncluded: false,
    dynamicProviderIncluded: false,
  });
}

function materialBinding(
  materialKey: "atrial" | "ventricular",
  compiled: Readonly<{
    modelId: string;
    parameterSetId: string;
    parameterIdentityHash: string;
  }>,
) {
  return {
    materialKey,
    modelId: compiled.modelId,
    parameterSetId: compiled.parameterSetId,
    parameterIdentityHash: compiled.parameterIdentityHash,
  } as const;
}

function deepFreezePayloadV1<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezePayloadV1(child);
    }
    Object.freeze(value);
  }
  return value;
}
