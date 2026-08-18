import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1_ID,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1_ID,
  PASSIVE_MULTICHAMBER_EQUILIBRIUM_ENERGY_SURFACE_MYOCARDIUM_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointProvenanceV1";

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID =
  "main-wire-normal-adult-five-wall-passive-equilibrium-point-owner-v2" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID =
  "main-wire-normal-adult-passive-equilibrium-point-solver-policy-v2" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_EVIDENCE_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-evidence-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MANUFACTURED_STAGE_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-attempt-v1" as const;

const V2_DECLARATION_COMMIT =
  "5acaa6f0f0b96b5c3acd38090c8dc7ec766225b6" as const;
const V2_DECLARATION_DOCUMENT_SHA256 =
  "d065acaf3ba78bb0db384012a1dbadcb90cc43e124eee988d020c8179cf75f54" as const;
const V2_DECLARATION_DOCUMENT_GIT_BLOB =
  "dd09dab325f4d1ac87deed818c17471af71dad08" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2 =
  deepFreezeV2({
    policyId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
    declaration: {
      commitSha: V2_DECLARATION_COMMIT,
      documentPath:
        "docs/scientific-runtime/INTEGRATED-MODEL-0019-passive-equilibrium-point-solver-numerical-addendum.md",
      documentSha256: V2_DECLARATION_DOCUMENT_SHA256,
      documentGitBlobSha1: V2_DECLARATION_DOCUMENT_GIT_BLOB,
    },
    inheritedV1ScientificContract: {
      surfaceOwnerId:
        PASSIVE_MULTICHAMBER_EQUILIBRIUM_ENERGY_SURFACE_MYOCARDIUM_V1_ID,
      branchPolicyId:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1_ID,
      surfaceVerificationPolicyId:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1_ID,
      candidateOwnerId:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
      candidateAuthority:
        "evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1",
      candidateFormulaChanged: false,
      gradientOrHessianFormulaChanged: false,
      thresholdsOrPathsChanged: false,
    },
    coordinateOrder: ["septal-midwall-cap-volume-m3", "junction-radius-m"],
    coordinateScales: {
      septalMidwallCapVolumeM3:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1
          .coordinateScales.septalMidwallCapVolumeM3,
      junctionRadiusM:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1
          .coordinateScales.junctionRadiusM,
    },
    energyScaleJ:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.energyScaleJ,
    maximumNewtonAcceptedUpdatesPerStage:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.maximumNewtonIterationsPerStage,
    maximumLineSearchBacktrackExponentInclusive:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.maximumLineSearchBacktracks,
    lineSearchCandidateCount: 29,
    armijoCoefficient:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.armijoCoefficient,
    scaledForceInfinityTolerance:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.scaledForceInfinityTolerance,
    scaledUpdateStagnationLimit:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.scaledUpdateStagnationLimit,
    minimumScaledInternalHessianEigenvalueExclusive:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.minimumScaledInternalHessianEigenvalueExclusive,
    minimumJunctionRadiusMExclusive:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.minimumJunctionRadiusMExclusive,
    newtonDirection:
      "d=-inverse(unregularized-scaled-internal-hessian)*scaled-internal-gradient",
    gDotDOperationOrder: "fl(fl(g0*d0)+fl(g1*d1))",
    residualOperationOrder: [
      "r0=fl(fl(fl(H00*d0)+fl(H01*d1))+g0)",
      "r1=fl(fl(fl(H10*d0)+fl(H11*d1))+g1)",
    ],
    wallOrder: ["LVFW", "SEP", "RVFW"],
    twoDiffOperationOrder: [
      "x=fl(a-b)",
      "bVirtual=fl(a-x)",
      "aVirtual=fl(x+bVirtual)",
      "bRound=fl(bVirtual-b)",
      "aRound=fl(a-aVirtual)",
      "y=fl(aRound+bRound)",
    ],
    twoSumOperationOrder: [
      "s=fl(a+b)",
      "bPrime=fl(s-a)",
      "aPrime=fl(s-bPrime)",
      "bRound=fl(b-bPrime)",
      "aRound=fl(a-aPrime)",
      "e=fl(aRound+bRound)",
    ],
    sixTermOrder: [
      "hi-LVFW",
      "lo-LVFW",
      "hi-SEP",
      "lo-SEP",
      "hi-RVFW",
      "lo-RVFW",
    ],
    expansionGrowSemantics:
      "insert-in-declared-order;scan-existing-components-low-to-high;retain-every-zero-component",
    comparisonExpansionSemantics:
      "copy-E6;grow-insert-unary-negated-rhs-as-seventh-term;scan-R6-through-R0;all-zero-is-equality;accept-iff-sign-is-at-most-zero",
    trialOperationOrder: [
      "alpha=2**(-b)",
      "step_i=fl(fl(Dq_i*alpha)*d_i)",
      "qtrial_i=fl(q_i+step_i)",
      "rhs=fl(fl(fl(1e-4*alpha)*1)*gDotD)",
    ],
    candidateReasonPrecedence: [
      "rhs-non-finite-or-not-strictly-negative",
      "trial-coordinate-non-finite",
      "zero-coordinate-step",
      "junction-radius-below-minimum",
      "candidate-evaluation-exception",
      "candidate-field-non-finite",
      "wall-energy-non-finite",
      "two-diff-intermediate-non-finite",
      "two-sum-or-expansion-intermediate-non-finite",
      "exact-comparison-unavailable",
      "armijo-not-satisfied",
      "armijo-satisfied",
    ],
    decisionCoverage:
      "first-passing-b-owns-update;always-retain-all-b=0..28;later-records-are-decision-inert",
    acceptedCandidateDecisionOrder: [
      "scaled-internal-hessian-singularity",
      "strict-scaled-internal-hessian-positive-definiteness",
      "scaled-force-convergence",
      "scaled-update-stagnation",
      "continue-newton",
    ],
    unchangedSolverSemantics: {
      hessianShiftApplied: false,
      steepestDescentFallbackApplied: false,
      rescuePathApplied: false,
      iterationBoundary:
        "at-most-48-accepted-updates-followed-by-one-terminal-force-and-stability-evaluation",
      stagnation:
        "only-after-accepted-candidate-stability-and-force-above-tolerance-and-scaled-update-at-most-limit",
      successfulStage:
        "force-tolerance-and-strict-scaled-internal-hessian-stability-required-including-terminal",
    },
    binary64Guards: {
      rhs: "finite-and-rhs<+0;both-signed-zero-values-fail",
      zeroCoordinateStep:
        "both-trial-coordinate-float64-bit-patterns-equal-current-patterns",
      nonFiniteComparisonComponent: "candidate-ineligible",
      mayBroadenV1Acceptance: false,
    },
    evidence: {
      lineSearchNotEnteredCandidateCount: 0,
      lineSearchEnteredCandidateCount: 29,
      nonFiniteJsonValue: null,
      finiteBits: "lower-case-16-character-big-endian-ieee754-binary64-hex",
      decisionDiagnosticsDoNotOwnAcceptance: [
        "absolute-v1-residual",
        "naive-delta",
        "rounded-delta",
        "rounded-v2-residual",
      ],
    },
    negativeClaims: {
      surfaceEstablished: false,
      continuousBranchEstablished: false,
      globalMinimumOrUniquenessEstablished: false,
      liveOutputOrGraphEstablished: false,
      physiologyOrClinicalValidationEstablished: false,
    },
  } as const);

export type MainWirePassiveEquilibriumFloat64V2 = Readonly<{
  value: number | null;
  float64BitsHex: string;
  classification: "finite" | "positive-infinity" | "negative-infinity" | "nan";
}>;

export type MainWirePassiveEquilibriumInternalCoordinatesV2 = Readonly<{
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
}>;

export type MainWirePassiveEquilibriumWallEnergyRecordV2 = Readonly<{
  LVFW: number;
  SEP: number;
  RVFW: number;
}>;

export type MainWirePassiveEquilibriumMatrix2V2 = readonly [
  readonly [number, number],
  readonly [number, number],
];

export type MainWirePassiveEquilibriumStageCandidateProjectionV2 = Readonly<{
  internalCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
  wallStoredEnergyJ: MainWirePassiveEquilibriumWallEnergyRecordV2;
  rawVentricularStoredEnergyJ: number;
  scaledGradient: readonly [number, number];
  scaledForceInfinityNorm: number;
  scaledInternalHessian: MainWirePassiveEquilibriumMatrix2V2;
  scaledInternalHessianEigenvaluesAscending: readonly [number, number];
  strictLocalStabilityPassed: boolean;
  junctionRadiusPassed: boolean;
}>;

export type MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2 = (
  coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
) => MainWirePassiveEquilibriumStageCandidateProjectionV2;

export type MainWirePassiveEquilibriumWrappedCoordinatesV2 = Readonly<{
  septalMidwallCapVolumeM3: MainWirePassiveEquilibriumFloat64V2;
  junctionRadiusM: MainWirePassiveEquilibriumFloat64V2;
}>;

export type MainWirePassiveEquilibriumWrappedWallEnergiesV2 = Readonly<{
  LVFW: MainWirePassiveEquilibriumFloat64V2;
  SEP: MainWirePassiveEquilibriumFloat64V2;
  RVFW: MainWirePassiveEquilibriumFloat64V2;
}>;

export type MainWirePassiveEquilibriumTwoDiffEvidenceV2 = Readonly<{
  a: MainWirePassiveEquilibriumFloat64V2;
  b: MainWirePassiveEquilibriumFloat64V2;
  x: MainWirePassiveEquilibriumFloat64V2;
  bVirtual: MainWirePassiveEquilibriumFloat64V2;
  aVirtual: MainWirePassiveEquilibriumFloat64V2;
  bRound: MainWirePassiveEquilibriumFloat64V2;
  aRound: MainWirePassiveEquilibriumFloat64V2;
  y: MainWirePassiveEquilibriumFloat64V2;
}>;

export type MainWirePassiveEquilibriumCandidateSnapshotV2 = Readonly<{
  internalCoordinates: MainWirePassiveEquilibriumWrappedCoordinatesV2;
  wallStoredEnergyJ: MainWirePassiveEquilibriumWrappedWallEnergiesV2;
  rawVentricularStoredEnergyJ: MainWirePassiveEquilibriumFloat64V2;
  scaledGradient: readonly [
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
  ];
  scaledForceInfinityNorm: MainWirePassiveEquilibriumFloat64V2;
  scaledInternalHessian: readonly [
    readonly [
      MainWirePassiveEquilibriumFloat64V2,
      MainWirePassiveEquilibriumFloat64V2,
    ],
    readonly [
      MainWirePassiveEquilibriumFloat64V2,
      MainWirePassiveEquilibriumFloat64V2,
    ],
  ];
  scaledInternalHessianEigenvaluesAscending: readonly [
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
  ];
  strictLocalStabilityPassed: boolean;
  junctionRadiusPassed: boolean;
}>;

type CurrentCoordinatesEvidenceV2 = Readonly<{
  stageIndex: number;
  iterationIndex: number;
  currentCoordinates: MainWirePassiveEquilibriumWrappedCoordinatesV2;
}>;

export type MainWirePassiveEquilibriumCurrentSolverEvidenceV2 =
  | (CurrentCoordinatesEvidenceV2 &
      Readonly<{
        availability: "coordinates-only";
      }>)
  | (CurrentCoordinatesEvidenceV2 &
      Readonly<{
        availability: "coordinates-with-exception";
        exception: Readonly<{ name: string; message: string }>;
      }>)
  | (CurrentCoordinatesEvidenceV2 &
      Readonly<{
        availability: "candidate-and-hessian";
        currentCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2;
        determinant: MainWirePassiveEquilibriumFloat64V2;
      }>)
  | (CurrentCoordinatesEvidenceV2 &
      Readonly<{
        availability: "direction-without-gdotd";
        currentCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2;
        determinant: MainWirePassiveEquilibriumFloat64V2;
        direction: readonly [
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
        ];
      }>)
  | (CurrentCoordinatesEvidenceV2 &
      Readonly<{
        availability: "direction-with-gdotd";
        currentCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2;
        determinant: MainWirePassiveEquilibriumFloat64V2;
        direction: readonly [
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
        ];
        gDotD: MainWirePassiveEquilibriumFloat64V2;
      }>)
  | (CurrentCoordinatesEvidenceV2 &
      Readonly<{
        availability: "complete-direction";
        currentCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2;
        determinant: MainWirePassiveEquilibriumFloat64V2;
        direction: readonly [
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
        ];
        gDotD: MainWirePassiveEquilibriumFloat64V2;
        hTimesDirectionPlusGradient: readonly [
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
        ];
        hTimesDirectionPlusGradientInfinityNorm: MainWirePassiveEquilibriumFloat64V2;
      }>);

export type MainWirePassiveEquilibriumCandidateDecisionRoleV2 =
  "decision-search" | "selected-update" | "diagnostic-only-after-selection";

type CandidateRecordCommonV2 = Readonly<{
  b: number;
  alpha: MainWirePassiveEquilibriumFloat64V2;
  step: readonly [
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
  ];
  trialCoordinates: MainWirePassiveEquilibriumWrappedCoordinatesV2;
  rhs: MainWirePassiveEquilibriumFloat64V2;
  decisionRole: MainWirePassiveEquilibriumCandidateDecisionRoleV2;
  selectedForUpdate: boolean;
}>;

export type MainWirePassiveEquilibriumCandidateNotEvaluatedReasonV2 =
  | "rhs-non-finite-or-not-strictly-negative"
  | "trial-coordinate-non-finite"
  | "zero-coordinate-step"
  | "junction-radius-below-minimum"
  | "candidate-evaluation-exception";

export type MainWirePassiveEquilibriumCandidateEvaluatedReasonV2 =
  | "candidate-field-non-finite"
  | "wall-energy-non-finite"
  | "two-diff-intermediate-non-finite"
  | "two-sum-or-expansion-intermediate-non-finite"
  | "exact-comparison-unavailable"
  | "armijo-not-satisfied"
  | "armijo-satisfied";

export type MainWirePassiveEquilibriumCandidateRecordV2 =
  | (CandidateRecordCommonV2 &
      Readonly<{
        status: "not-evaluated";
        reason: Exclude<
          MainWirePassiveEquilibriumCandidateNotEvaluatedReasonV2,
          "candidate-evaluation-exception"
        >;
        evaluationAttempted: false;
      }>)
  | (CandidateRecordCommonV2 &
      Readonly<{
        status: "not-evaluated";
        reason: "candidate-evaluation-exception";
        evaluationAttempted: true;
        exception: Readonly<{ name: string; message: string }>;
      }>)
  | (CandidateRecordCommonV2 &
      Readonly<{
        status: "evaluated";
        reason: MainWirePassiveEquilibriumCandidateEvaluatedReasonV2;
        evaluationAttempted: true;
        trialCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2;
        currentWallStoredEnergyJ: MainWirePassiveEquilibriumWrappedWallEnergiesV2;
        trialWallStoredEnergyJ: MainWirePassiveEquilibriumWrappedWallEnergiesV2;
        twoDiffByWall: Readonly<{
          LVFW: MainWirePassiveEquilibriumTwoDiffEvidenceV2;
          SEP: MainWirePassiveEquilibriumTwoDiffEvidenceV2;
          RVFW: MainWirePassiveEquilibriumTwoDiffEvidenceV2;
        }>;
        orderedDifferenceTerms: readonly [
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
        ];
        evaluatedDifferenceExpansion: readonly [
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
        ];
        comparisonExpansion: readonly [
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
          MainWirePassiveEquilibriumFloat64V2,
        ];
        naiveDeltaJ: MainWirePassiveEquilibriumFloat64V2;
        deltaUStableDiagnosticJ: MainWirePassiveEquilibriumFloat64V2;
        absoluteV1ResidualJ: MainWirePassiveEquilibriumFloat64V2;
        roundedV2ResidualJ: MainWirePassiveEquilibriumFloat64V2;
        exactExpansionSign: -1 | 0 | 1 | null;
        highestNonzeroComparisonExpansionIndex: number | null;
        armijoSatisfied: boolean;
        absoluteV1ArmijoSatisfiedDiagnostic: boolean;
        candidateFieldsFinite: boolean;
        wallEnergiesFinite: boolean;
        twoDiffIntermediatesFinite: boolean;
        twoSumAndExpansionIntermediatesFinite: boolean;
        exactComparisonAvailable: boolean;
        trialCoordinatesFinite: boolean;
        zeroCoordinateStep: boolean;
        geometryPassed: boolean;
        projectionCoordinatesMatch: boolean;
        rawVentricularEnergyBindingPassed: boolean;
        candidateAdmissibilityPassed: boolean;
        evaluatedAfterSelectionForDiagnosticCoverage: boolean;
      }>);

export type MainWirePassiveEquilibriumCandidateRecordTupleV2 = readonly [
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
  MainWirePassiveEquilibriumCandidateRecordV2,
];

export type MainWirePassiveEquilibriumStageFailureReasonV2 =
  | "junction-radius-below-minimum"
  | "candidate-evaluation-failed"
  | "scaled-internal-hessian-singular"
  | "scaled-internal-hessian-not-positive-definite"
  | "newton-direction-not-descent"
  | "line-search-failed"
  | "scaled-update-stagnated"
  | "newton-iteration-limit";

export type MainWirePassiveEquilibriumLineSearchDecisionV2 =
  | Readonly<{
      outcome: "line-search-failed";
      selectedBacktrackExponent: null;
      stageFailureReason: "line-search-failed";
    }>
  | Readonly<{
      outcome: "accepted-candidate-failed";
      selectedBacktrackExponent: number;
      stageFailureReason:
        | "scaled-internal-hessian-singular"
        | "scaled-internal-hessian-not-positive-definite";
    }>
  | Readonly<{
      outcome: "force-converged";
      selectedBacktrackExponent: number;
      stageFailureReason: null;
    }>
  | Readonly<{
      outcome: "scaled-update-stagnated";
      selectedBacktrackExponent: number;
      stageFailureReason: "scaled-update-stagnated";
    }>
  | Readonly<{
      outcome: "continue-newton";
      selectedBacktrackExponent: number;
      stageFailureReason: null;
    }>;

type JunctionPretrialFailureV2 = Readonly<{
  status: "line-search-not-entered";
  outcome: "pretrial-failure";
  reason: "junction-radius-below-minimum";
  currentSolverEvidence: Extract<
    MainWirePassiveEquilibriumCurrentSolverEvidenceV2,
    { availability: "coordinates-only" }
  >;
  candidateRecords: readonly [];
}>;

type CandidateEvaluationPretrialFailureV2 = Readonly<{
  status: "line-search-not-entered";
  outcome: "pretrial-failure";
  reason: "candidate-evaluation-failed";
  currentSolverEvidence: Extract<
    MainWirePassiveEquilibriumCurrentSolverEvidenceV2,
    { availability: "coordinates-with-exception" }
  >;
  candidateRecords: readonly [];
}>;

type CandidateHessianPretrialDecisionV2 =
  | Readonly<{
      status: "line-search-not-entered";
      outcome: "pretrial-failure";
      reason:
        | "scaled-internal-hessian-singular"
        | "scaled-internal-hessian-not-positive-definite"
        | "newton-iteration-limit";
      currentSolverEvidence: Extract<
        MainWirePassiveEquilibriumCurrentSolverEvidenceV2,
        { availability: "candidate-and-hessian" }
      >;
      candidateRecords: readonly [];
    }>
  | Readonly<{
      status: "line-search-not-entered";
      outcome: "converged";
      reason: "scaled-force-tolerance-reached";
      currentSolverEvidence: Extract<
        MainWirePassiveEquilibriumCurrentSolverEvidenceV2,
        { availability: "candidate-and-hessian" }
      >;
      candidateRecords: readonly [];
    }>;

type DirectionPretrialFailureV2 =
  | Readonly<{
      status: "line-search-not-entered";
      outcome: "pretrial-failure";
      reason: "newton-direction-not-descent";
      directionFailureKind: "direction-non-finite";
      currentSolverEvidence: Extract<
        MainWirePassiveEquilibriumCurrentSolverEvidenceV2,
        { availability: "direction-without-gdotd" }
      >;
      candidateRecords: readonly [];
    }>
  | Readonly<{
      status: "line-search-not-entered";
      outcome: "pretrial-failure";
      reason: "newton-direction-not-descent";
      directionFailureKind: "gdotd-non-finite" | "gdotd-non-negative";
      currentSolverEvidence: Extract<
        MainWirePassiveEquilibriumCurrentSolverEvidenceV2,
        { availability: "direction-with-gdotd" }
      >;
      candidateRecords: readonly [];
    }>;

export type MainWirePassiveEquilibriumIterationEvidenceV2 =
  | JunctionPretrialFailureV2
  | CandidateEvaluationPretrialFailureV2
  | CandidateHessianPretrialDecisionV2
  | DirectionPretrialFailureV2
  | Readonly<{
      status: "line-search-entered";
      decision: MainWirePassiveEquilibriumLineSearchDecisionV2;
      currentSolverEvidence: Extract<
        MainWirePassiveEquilibriumCurrentSolverEvidenceV2,
        { availability: "complete-direction" }
      >;
      candidateRecords: MainWirePassiveEquilibriumCandidateRecordTupleV2;
    }>;

export type MainWirePassiveEquilibriumAcceptedStepDiagnosticsV2 = Readonly<{
  selectedBacktrackExponent: number;
  scaledUpdateInfinityNorm: MainWirePassiveEquilibriumFloat64V2;
  currentScaledForceInfinityNorm: MainWirePassiveEquilibriumFloat64V2;
  acceptedScaledForceInfinityNorm: MainWirePassiveEquilibriumFloat64V2;
  currentEnergyJ: MainWirePassiveEquilibriumFloat64V2;
  acceptedEnergyJ: MainWirePassiveEquilibriumFloat64V2;
  gDotD: MainWirePassiveEquilibriumFloat64V2;
}>;

type StageKernelCommonV2 = Readonly<{
  stageIndex: number;
  initialCoordinates: MainWirePassiveEquilibriumWrappedCoordinatesV2;
  iterations: readonly MainWirePassiveEquilibriumIterationEvidenceV2[];
  completedNewtonUpdates: number;
  selectedLineSearchBacktracks: number;
  lastAcceptedStepDiagnostics: MainWirePassiveEquilibriumAcceptedStepDiagnosticsV2 | null;
}>;

export type MainWirePassiveEquilibriumStageKernelResultV2 =
  | (StageKernelCommonV2 &
      Readonly<{
        status: "converged";
        terminalCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2;
      }>)
  | (StageKernelCommonV2 &
      Readonly<{
        status: "failed";
        failureReason: MainWirePassiveEquilibriumStageFailureReasonV2;
        terminalCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2 | null;
      }>);

type ManufacturedStageIdentityV2 = Readonly<{
  qualification: "manufactured-non-qualified";
  schemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MANUFACTURED_STAGE_V2;
  solverPolicyId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID;
}>;

export type MainWirePassiveEquilibriumManufacturedStageResultV2 =
  MainWirePassiveEquilibriumStageKernelResultV2 & ManufacturedStageIdentityV2;

export type MainWirePassiveEquilibriumManufacturedStageEnvelopeV2 = Readonly<{
  qualification: "manufactured-non-qualified";
  evidenceSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_EVIDENCE_V2;
  solverPolicySha256: string;
  iterationEvidenceSha256: readonly string[];
  stageResult: MainWirePassiveEquilibriumManufacturedStageResultV2;
  stageResultSha256: string;
}>;

export type MainWirePassiveEquilibriumManufacturedStageInputV2 = Readonly<{
  stageIndex: number;
  initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
  evaluateCandidate: MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2;
  manufacturedRhsOverride?: (
    input: Readonly<{
      b: number;
      computedRhs: number;
    }>,
  ) => number;
}>;

export type MainWirePassiveEquilibriumStageKernelInputV2 = Readonly<{
  stageIndex: number;
  initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
  evaluateCandidate: MainWirePassiveEquilibriumManufacturedCandidateEvaluatorV2;
}>;

type MutableCandidateRecordV2 = MainWirePassiveEquilibriumCandidateRecordV2;

export function wrapMainWirePassiveEquilibriumFloat64V2(
  input: number,
): MainWirePassiveEquilibriumFloat64V2 {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, input, false);
  const bits = view.getBigUint64(0, false).toString(16).padStart(16, "0");
  const classification = Number.isNaN(input)
    ? "nan"
    : input === Number.POSITIVE_INFINITY
      ? "positive-infinity"
      : input === Number.NEGATIVE_INFINITY
        ? "negative-infinity"
        : "finite";
  return Object.freeze({
    value: classification === "finite" ? (input === 0 ? 0 : input) : null,
    float64BitsHex: bits,
    classification,
  });
}

export function evaluateMainWirePassiveEquilibriumTwoDiffV2(
  a: number,
  b: number,
): MainWirePassiveEquilibriumTwoDiffEvidenceV2 {
  return twoDiffRawV2(a, b).evidence;
}

function twoDiffRawV2(
  a: number,
  b: number,
): Readonly<{
  x: number;
  y: number;
  allIntermediates: readonly number[];
  evidence: MainWirePassiveEquilibriumTwoDiffEvidenceV2;
}> {
  const x = a - b;
  const bVirtual = a - x;
  const aVirtual = x + bVirtual;
  const bRound = bVirtual - b;
  const aRound = a - aVirtual;
  const y = aRound + bRound;
  return deepFreezeV2({
    x,
    y,
    allIntermediates: [x, bVirtual, aVirtual, bRound, aRound, y],
    evidence: {
      a: wrapMainWirePassiveEquilibriumFloat64V2(a),
      b: wrapMainWirePassiveEquilibriumFloat64V2(b),
      x: wrapMainWirePassiveEquilibriumFloat64V2(x),
      bVirtual: wrapMainWirePassiveEquilibriumFloat64V2(bVirtual),
      aVirtual: wrapMainWirePassiveEquilibriumFloat64V2(aVirtual),
      bRound: wrapMainWirePassiveEquilibriumFloat64V2(bRound),
      aRound: wrapMainWirePassiveEquilibriumFloat64V2(aRound),
      y: wrapMainWirePassiveEquilibriumFloat64V2(y),
    },
  });
}

export function evaluateMainWirePassiveEquilibriumArmijoExpansionV2(input: {
  currentWallStoredEnergyJ: MainWirePassiveEquilibriumWallEnergyRecordV2;
  trialWallStoredEnergyJ: MainWirePassiveEquilibriumWallEnergyRecordV2;
  rhs: number;
}): Readonly<{
  twoDiffByWall: Readonly<{
    LVFW: MainWirePassiveEquilibriumTwoDiffEvidenceV2;
    SEP: MainWirePassiveEquilibriumTwoDiffEvidenceV2;
    RVFW: MainWirePassiveEquilibriumTwoDiffEvidenceV2;
  }>;
  orderedDifferenceTerms: readonly [
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
  ];
  evaluatedDifferenceExpansion: readonly [
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
  ];
  comparisonExpansion: readonly [
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
    MainWirePassiveEquilibriumFloat64V2,
  ];
  deltaUStableDiagnosticJ: MainWirePassiveEquilibriumFloat64V2;
  exactExpansionSign: -1 | 0 | 1 | null;
  highestNonzeroComparisonExpansionIndex: number | null;
  twoDiffIntermediatesFinite: boolean;
  twoSumAndExpansionIntermediatesFinite: boolean;
  exactComparisonAvailable: boolean;
}> {
  const lvfwRaw = twoDiffRawV2(
    input.trialWallStoredEnergyJ.LVFW,
    input.currentWallStoredEnergyJ.LVFW,
  );
  const sepRaw = twoDiffRawV2(
    input.trialWallStoredEnergyJ.SEP,
    input.currentWallStoredEnergyJ.SEP,
  );
  const rvfwRaw = twoDiffRawV2(
    input.trialWallStoredEnergyJ.RVFW,
    input.currentWallStoredEnergyJ.RVFW,
  );
  const rawTerms = [
    lvfwRaw.x,
    lvfwRaw.y,
    sepRaw.x,
    sepRaw.y,
    rvfwRaw.x,
    rvfwRaw.y,
  ] as const;
  const evaluatedExpansion = growExpansionV2([], rawTerms);
  const comparisonExpansion = growExpansionV2(evaluatedExpansion.values, [
    -input.rhs,
  ]);
  let delta = 0;
  for (const component of evaluatedExpansion.values) delta += component;
  const allRFinite = comparisonExpansion.values.every(Number.isFinite);
  let exactExpansionSign: -1 | 0 | 1 | null = allRFinite ? 0 : null;
  let highestNonzeroComparisonExpansionIndex: number | null = null;
  if (allRFinite) {
    for (
      let index = comparisonExpansion.values.length - 1;
      index >= 0;
      index -= 1
    ) {
      const value = comparisonExpansion.values[index];
      if (value !== 0) {
        exactExpansionSign = value < 0 ? -1 : 1;
        highestNonzeroComparisonExpansionIndex = index;
        break;
      }
    }
  }
  const twoDiffByWall = {
    LVFW: lvfwRaw.evidence,
    SEP: sepRaw.evidence,
    RVFW: rvfwRaw.evidence,
  } as const;
  const twoDiffIntermediatesFinite = [lvfwRaw, sepRaw, rvfwRaw].every((entry) =>
    entry.allIntermediates.every(Number.isFinite),
  );
  const twoSumAndExpansionIntermediatesFinite =
    evaluatedExpansion.intermediatesFinite &&
    comparisonExpansion.intermediatesFinite;
  const exactComparisonAvailable =
    twoDiffIntermediatesFinite &&
    twoSumAndExpansionIntermediatesFinite &&
    exactExpansionSign !== null;
  return deepFreezeV2({
    twoDiffByWall,
    orderedDifferenceTerms: wrappedTuple6V2(rawTerms),
    evaluatedDifferenceExpansion: wrappedTuple6V2(evaluatedExpansion.values),
    comparisonExpansion: wrappedTuple7V2(comparisonExpansion.values),
    deltaUStableDiagnosticJ: wrapMainWirePassiveEquilibriumFloat64V2(delta),
    exactExpansionSign,
    highestNonzeroComparisonExpansionIndex,
    twoDiffIntermediatesFinite,
    twoSumAndExpansionIntermediatesFinite,
    exactComparisonAvailable,
  });
}

export function solveMainWirePassiveEquilibriumManufacturedStageV2(
  input: MainWirePassiveEquilibriumManufacturedStageInputV2,
): MainWirePassiveEquilibriumManufacturedStageResultV2 {
  return qualifyManufacturedStageResultV2(
    solveMainWirePassiveEquilibriumStageKernelInternalV2(input),
  );
}

/**
 * Neutral numerical kernel shared by manufactured tests and the fixed
 * canonical runner. It carries no qualification, root, seal, or admission.
 */
export function solveMainWirePassiveEquilibriumStageKernelV2(
  input: MainWirePassiveEquilibriumStageKernelInputV2,
): MainWirePassiveEquilibriumStageKernelResultV2 {
  return solveMainWirePassiveEquilibriumStageKernelInternalV2({
    stageIndex: input.stageIndex,
    initialCoordinates: input.initialCoordinates,
    evaluateCandidate: input.evaluateCandidate,
  });
}

function solveMainWirePassiveEquilibriumStageKernelInternalV2(
  input: MainWirePassiveEquilibriumManufacturedStageInputV2,
): MainWirePassiveEquilibriumStageKernelResultV2 {
  const policy =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2;
  let coordinates = Object.freeze({ ...input.initialCoordinates });
  const iterations: MainWirePassiveEquilibriumIterationEvidenceV2[] = [];
  let completedNewtonUpdates = 0;
  let selectedLineSearchBacktracks = 0;
  let lastAcceptedStepDiagnostics: MainWirePassiveEquilibriumAcceptedStepDiagnosticsV2 | null =
    null;
  let lastAcceptedCandidateSnapshot: MainWirePassiveEquilibriumCandidateSnapshotV2 | null =
    null;

  for (
    let iterationIndex = 0;
    iterationIndex <= policy.maximumNewtonAcceptedUpdatesPerStage;
    iterationIndex += 1
  ) {
    const coordinateEvidence = currentCoordinateEvidenceV2(
      input.stageIndex,
      iterationIndex,
      coordinates,
    );
    if (
      !(coordinates.junctionRadiusM > policy.minimumJunctionRadiusMExclusive)
    ) {
      const iteration = deepFreezeV2({
        status: "line-search-not-entered" as const,
        outcome: "pretrial-failure" as const,
        reason: "junction-radius-below-minimum" as const,
        currentSolverEvidence: coordinateEvidence,
        candidateRecords: [] as const,
      });
      iterations.push(iteration);
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "junction-radius-below-minimum",
        lastAcceptedCandidateSnapshot,
      );
    }

    let candidate: MainWirePassiveEquilibriumStageCandidateProjectionV2;
    try {
      candidate = cloneStageCandidateProjectionV2(
        input.evaluateCandidate(coordinates),
      );
    } catch (error) {
      const iteration = deepFreezeV2({
        status: "line-search-not-entered" as const,
        outcome: "pretrial-failure" as const,
        reason: "candidate-evaluation-failed" as const,
        currentSolverEvidence: {
          stageIndex: input.stageIndex,
          iterationIndex,
          availability: "coordinates-with-exception" as const,
          currentCoordinates: wrapCoordinatesV2(coordinates),
          exception: sanitizedExceptionV2(error),
        },
        candidateRecords: [] as const,
      });
      iterations.push(iteration);
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "candidate-evaluation-failed",
        lastAcceptedCandidateSnapshot,
      );
    }

    const snapshot = candidateSnapshotV2(candidate);
    if (!candidateProjectionFiniteV2(candidate)) {
      const iteration = deepFreezeV2({
        status: "line-search-not-entered" as const,
        outcome: "pretrial-failure" as const,
        reason: "candidate-evaluation-failed" as const,
        currentSolverEvidence: {
          stageIndex: input.stageIndex,
          iterationIndex,
          availability: "coordinates-with-exception" as const,
          currentCoordinates: wrapCoordinatesV2(coordinates),
          exception: {
            name: "NonFiniteCandidateProjection",
            message:
              "candidate evaluator returned a non-finite current projection",
          },
        },
        candidateRecords: [] as const,
      });
      iterations.push(iteration);
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "candidate-evaluation-failed",
        lastAcceptedCandidateSnapshot,
      );
    }

    const [[h00, h01], [h10, h11]] = candidate.scaledInternalHessian;
    const determinant = h00 * h11 - h01 * h01;
    const candidateHessianEvidence = deepFreezeV2({
      stageIndex: input.stageIndex,
      iterationIndex,
      currentCoordinates: wrapCoordinatesV2(coordinates),
      availability: "candidate-and-hessian" as const,
      currentCandidate: snapshot,
      determinant: wrapMainWirePassiveEquilibriumFloat64V2(determinant),
    });
    if (!Number.isFinite(determinant) || determinant === 0) {
      iterations.push(
        deepFreezeV2({
          status: "line-search-not-entered" as const,
          outcome: "pretrial-failure" as const,
          reason: "scaled-internal-hessian-singular" as const,
          currentSolverEvidence: candidateHessianEvidence,
          candidateRecords: [] as const,
        }),
      );
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "scaled-internal-hessian-singular",
        snapshot,
      );
    }
    if (!candidate.strictLocalStabilityPassed) {
      iterations.push(
        deepFreezeV2({
          status: "line-search-not-entered" as const,
          outcome: "pretrial-failure" as const,
          reason: "scaled-internal-hessian-not-positive-definite" as const,
          currentSolverEvidence: candidateHessianEvidence,
          candidateRecords: [] as const,
        }),
      );
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "scaled-internal-hessian-not-positive-definite",
        snapshot,
      );
    }
    if (
      candidate.scaledForceInfinityNorm <= policy.scaledForceInfinityTolerance
    ) {
      iterations.push(
        deepFreezeV2({
          status: "line-search-not-entered" as const,
          outcome: "converged" as const,
          reason: "scaled-force-tolerance-reached" as const,
          currentSolverEvidence: candidateHessianEvidence,
          candidateRecords: [] as const,
        }),
      );
      return convergedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        snapshot,
      );
    }
    if (iterationIndex === policy.maximumNewtonAcceptedUpdatesPerStage) {
      iterations.push(
        deepFreezeV2({
          status: "line-search-not-entered" as const,
          outcome: "pretrial-failure" as const,
          reason: "newton-iteration-limit" as const,
          currentSolverEvidence: candidateHessianEvidence,
          candidateRecords: [] as const,
        }),
      );
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "newton-iteration-limit",
        snapshot,
      );
    }

    const [g0, g1] = candidate.scaledGradient;
    const direction0 = -(h11 * g0 - h01 * g1) / determinant;
    const direction1 = -(-h01 * g0 + h00 * g1) / determinant;
    const direction = [direction0, direction1] as const;
    if (!direction.every(Number.isFinite)) {
      iterations.push(
        deepFreezeV2({
          status: "line-search-not-entered" as const,
          outcome: "pretrial-failure" as const,
          reason: "newton-direction-not-descent" as const,
          directionFailureKind: "direction-non-finite" as const,
          currentSolverEvidence: {
            stageIndex: input.stageIndex,
            iterationIndex,
            currentCoordinates: wrapCoordinatesV2(coordinates),
            availability: "direction-without-gdotd" as const,
            currentCandidate: snapshot,
            determinant: wrapMainWirePassiveEquilibriumFloat64V2(determinant),
            direction: wrappedPairV2(direction),
          },
          candidateRecords: [] as const,
        }),
      );
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "newton-direction-not-descent",
        snapshot,
      );
    }
    const gDotD = g0 * direction0 + g1 * direction1;
    if (!Number.isFinite(gDotD) || !(gDotD < 0)) {
      iterations.push(
        deepFreezeV2({
          status: "line-search-not-entered" as const,
          outcome: "pretrial-failure" as const,
          reason: "newton-direction-not-descent" as const,
          directionFailureKind: !Number.isFinite(gDotD)
            ? ("gdotd-non-finite" as const)
            : ("gdotd-non-negative" as const),
          currentSolverEvidence: {
            stageIndex: input.stageIndex,
            iterationIndex,
            currentCoordinates: wrapCoordinatesV2(coordinates),
            availability: "direction-with-gdotd" as const,
            currentCandidate: snapshot,
            determinant: wrapMainWirePassiveEquilibriumFloat64V2(determinant),
            direction: wrappedPairV2(direction),
            gDotD: wrapMainWirePassiveEquilibriumFloat64V2(gDotD),
          },
          candidateRecords: [] as const,
        }),
      );
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "newton-direction-not-descent",
        snapshot,
      );
    }
    const residual0 = h00 * direction0 + h01 * direction1 + g0;
    const residual1 = h10 * direction0 + h11 * direction1 + g1;
    const completeDirectionEvidence = deepFreezeV2({
      stageIndex: input.stageIndex,
      iterationIndex,
      currentCoordinates: wrapCoordinatesV2(coordinates),
      availability: "complete-direction" as const,
      currentCandidate: snapshot,
      determinant: wrapMainWirePassiveEquilibriumFloat64V2(determinant),
      direction: wrappedPairV2(direction),
      gDotD: wrapMainWirePassiveEquilibriumFloat64V2(gDotD),
      hTimesDirectionPlusGradient: [
        wrapMainWirePassiveEquilibriumFloat64V2(residual0),
        wrapMainWirePassiveEquilibriumFloat64V2(residual1),
      ] as const,
      hTimesDirectionPlusGradientInfinityNorm:
        wrapMainWirePassiveEquilibriumFloat64V2(
          Math.max(Math.abs(residual0), Math.abs(residual1)),
        ),
    });

    const generatedRecords: MutableCandidateRecordV2[] = [];
    const candidateByB = new Map<
      number,
      MainWirePassiveEquilibriumStageCandidateProjectionV2
    >();
    let selectedBacktrackExponent: number | null = null;
    for (
      let b = 0;
      b <= policy.maximumLineSearchBacktrackExponentInclusive;
      b += 1
    ) {
      const alpha = 2 ** -b;
      const step0 =
        policy.coordinateScales.septalMidwallCapVolumeM3 * alpha * direction0;
      const step1 =
        policy.coordinateScales.junctionRadiusM * alpha * direction1;
      const trialCoordinates = {
        septalMidwallCapVolumeM3: coordinates.septalMidwallCapVolumeM3 + step0,
        junctionRadiusM: coordinates.junctionRadiusM + step1,
      } as const;
      const computedRhs =
        policy.armijoCoefficient * alpha * policy.energyScaleJ * gDotD;
      const rhs = input.manufacturedRhsOverride
        ? input.manufacturedRhsOverride({ b, computedRhs })
        : computedRhs;
      const common = {
        b,
        alpha: wrapMainWirePassiveEquilibriumFloat64V2(alpha),
        step: [
          wrapMainWirePassiveEquilibriumFloat64V2(step0),
          wrapMainWirePassiveEquilibriumFloat64V2(step1),
        ] as const,
        trialCoordinates: wrapCoordinatesV2(trialCoordinates),
        rhs: wrapMainWirePassiveEquilibriumFloat64V2(rhs),
        decisionRole: "decision-search" as const,
        selectedForUpdate: false,
      };
      if (!Number.isFinite(rhs) || !(rhs < 0)) {
        generatedRecords.push(
          deepFreezeV2({
            ...common,
            status: "not-evaluated" as const,
            reason: "rhs-non-finite-or-not-strictly-negative" as const,
            evaluationAttempted: false as const,
          }),
        );
        continue;
      }
      if (!coordinatesFiniteV2(trialCoordinates)) {
        generatedRecords.push(
          deepFreezeV2({
            ...common,
            status: "not-evaluated" as const,
            reason: "trial-coordinate-non-finite" as const,
            evaluationAttempted: false as const,
          }),
        );
        continue;
      }
      if (coordinateBitsEqualV2(coordinates, trialCoordinates)) {
        generatedRecords.push(
          deepFreezeV2({
            ...common,
            status: "not-evaluated" as const,
            reason: "zero-coordinate-step" as const,
            evaluationAttempted: false as const,
          }),
        );
        continue;
      }
      if (
        !(
          trialCoordinates.junctionRadiusM >
          policy.minimumJunctionRadiusMExclusive
        )
      ) {
        generatedRecords.push(
          deepFreezeV2({
            ...common,
            status: "not-evaluated" as const,
            reason: "junction-radius-below-minimum" as const,
            evaluationAttempted: false as const,
          }),
        );
        continue;
      }
      let trial: MainWirePassiveEquilibriumStageCandidateProjectionV2;
      try {
        trial = cloneStageCandidateProjectionV2(
          input.evaluateCandidate(trialCoordinates),
        );
      } catch (error) {
        generatedRecords.push(
          deepFreezeV2({
            ...common,
            status: "not-evaluated" as const,
            reason: "candidate-evaluation-exception" as const,
            evaluationAttempted: true as const,
            exception: sanitizedExceptionV2(error),
          }),
        );
        continue;
      }
      candidateByB.set(b, trial);
      const record = evaluatedCandidateRecordV2(
        common,
        candidate,
        trial,
        rhs,
        selectedBacktrackExponent !== null,
      );
      generatedRecords.push(record);
      if (
        selectedBacktrackExponent === null &&
        record.reason === "armijo-satisfied"
      ) {
        selectedBacktrackExponent = b;
      }
    }

    const candidateRecords = candidateRecordTupleV2(
      generatedRecords.map((record) =>
        withCandidateDecisionRoleV2(record, selectedBacktrackExponent),
      ),
    );
    if (selectedBacktrackExponent === null) {
      iterations.push(
        deepFreezeV2({
          status: "line-search-entered" as const,
          decision: {
            outcome: "line-search-failed" as const,
            selectedBacktrackExponent: null,
            stageFailureReason: "line-search-failed" as const,
          },
          currentSolverEvidence: completeDirectionEvidence,
          candidateRecords,
        }),
      );
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        "line-search-failed",
        snapshot,
      );
    }

    const accepted = candidateByB.get(selectedBacktrackExponent);
    if (accepted === undefined)
      throw new Error("selected V2 candidate was not retained");
    const acceptedSnapshot = candidateSnapshotV2(accepted);
    lastAcceptedCandidateSnapshot = acceptedSnapshot;
    const acceptedAlpha = 2 ** -selectedBacktrackExponent;
    const scaledUpdateInfinityNorm =
      acceptedAlpha * Math.max(Math.abs(direction0), Math.abs(direction1));
    const acceptedDiagnostics = deepFreezeV2({
      selectedBacktrackExponent,
      scaledUpdateInfinityNorm: wrapMainWirePassiveEquilibriumFloat64V2(
        scaledUpdateInfinityNorm,
      ),
      currentScaledForceInfinityNorm: wrapMainWirePassiveEquilibriumFloat64V2(
        candidate.scaledForceInfinityNorm,
      ),
      acceptedScaledForceInfinityNorm: wrapMainWirePassiveEquilibriumFloat64V2(
        accepted.scaledForceInfinityNorm,
      ),
      currentEnergyJ: wrapMainWirePassiveEquilibriumFloat64V2(
        candidate.rawVentricularStoredEnergyJ,
      ),
      acceptedEnergyJ: wrapMainWirePassiveEquilibriumFloat64V2(
        accepted.rawVentricularStoredEnergyJ,
      ),
      gDotD: wrapMainWirePassiveEquilibriumFloat64V2(gDotD),
    });
    lastAcceptedStepDiagnostics = acceptedDiagnostics;
    selectedLineSearchBacktracks += selectedBacktrackExponent;
    completedNewtonUpdates += 1;

    const [[acceptedH00, acceptedH01], [, acceptedH11]] =
      accepted.scaledInternalHessian;
    const acceptedDeterminant =
      acceptedH00 * acceptedH11 - acceptedH01 * acceptedH01;
    let decision: MainWirePassiveEquilibriumLineSearchDecisionV2;
    let failureReason: MainWirePassiveEquilibriumStageFailureReasonV2 | null =
      null;
    if (!Number.isFinite(acceptedDeterminant) || acceptedDeterminant === 0) {
      decision = {
        outcome: "accepted-candidate-failed",
        selectedBacktrackExponent,
        stageFailureReason: "scaled-internal-hessian-singular",
      };
      failureReason = "scaled-internal-hessian-singular";
    } else if (!accepted.strictLocalStabilityPassed) {
      decision = {
        outcome: "accepted-candidate-failed",
        selectedBacktrackExponent,
        stageFailureReason: "scaled-internal-hessian-not-positive-definite",
      };
      failureReason = "scaled-internal-hessian-not-positive-definite";
    } else if (
      accepted.scaledForceInfinityNorm <= policy.scaledForceInfinityTolerance
    ) {
      decision = {
        outcome: "force-converged",
        selectedBacktrackExponent,
        stageFailureReason: null,
      };
    } else if (scaledUpdateInfinityNorm <= policy.scaledUpdateStagnationLimit) {
      decision = {
        outcome: "scaled-update-stagnated",
        selectedBacktrackExponent,
        stageFailureReason: "scaled-update-stagnated",
      };
      failureReason = "scaled-update-stagnated";
    } else {
      decision = {
        outcome: "continue-newton",
        selectedBacktrackExponent,
        stageFailureReason: null,
      };
    }
    iterations.push(
      deepFreezeV2({
        status: "line-search-entered" as const,
        decision,
        currentSolverEvidence: completeDirectionEvidence,
        candidateRecords,
      }),
    );
    if (failureReason !== null) {
      return failedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        failureReason,
        acceptedSnapshot,
      );
    }
    if (decision.outcome === "force-converged") {
      return convergedStageV2(
        input,
        iterations,
        completedNewtonUpdates,
        selectedLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
        acceptedSnapshot,
      );
    }
    coordinates = Object.freeze({ ...accepted.internalCoordinates });
  }
  throw new Error("unreachable V2 Newton state");
}

export async function sealMainWirePassiveEquilibriumManufacturedStageV2(
  stageResult: MainWirePassiveEquilibriumManufacturedStageResultV2,
): Promise<MainWirePassiveEquilibriumManufacturedStageEnvelopeV2> {
  if (stageResult.qualification !== "manufactured-non-qualified")
    throw new Error("V2 manufactured sealer rejects qualified input");
  return deepFreezeV2({
    qualification: "manufactured-non-qualified" as const,
    evidenceSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_EVIDENCE_V2,
    solverPolicySha256: await sha256CanonicalJsonHex(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
    ),
    iterationEvidenceSha256: await Promise.all(
      stageResult.iterations.map((iteration) =>
        sha256CanonicalJsonHex(iteration),
      ),
    ),
    stageResult,
    stageResultSha256: await sha256CanonicalJsonHex(stageResult),
  });
}

function evaluatedCandidateRecordV2(
  common: CandidateRecordCommonV2,
  current: MainWirePassiveEquilibriumStageCandidateProjectionV2,
  trial: MainWirePassiveEquilibriumStageCandidateProjectionV2,
  rhs: number,
  evaluatedAfterSelectionForDiagnosticCoverage: boolean,
): Extract<
  MainWirePassiveEquilibriumCandidateRecordV2,
  { status: "evaluated" }
> {
  const expansion = evaluateMainWirePassiveEquilibriumArmijoExpansionV2({
    currentWallStoredEnergyJ: current.wallStoredEnergyJ,
    trialWallStoredEnergyJ: trial.wallStoredEnergyJ,
    rhs,
  });
  const currentTotal =
    current.wallStoredEnergyJ.LVFW +
    current.wallStoredEnergyJ.SEP +
    current.wallStoredEnergyJ.RVFW;
  const trialTotal =
    trial.wallStoredEnergyJ.LVFW +
    trial.wallStoredEnergyJ.SEP +
    trial.wallStoredEnergyJ.RVFW;
  const naiveDelta = trialTotal - currentTotal;
  const absoluteV1Residual = trialTotal - (currentTotal + rhs);
  const stableDelta = numberFromFloat64EvidenceV2(
    expansion.deltaUStableDiagnosticJ,
  );
  const roundedV2Residual = stableDelta - rhs;
  const requestedTrialCoordinates = {
    septalMidwallCapVolumeM3: numberFromFloat64EvidenceV2(
      common.trialCoordinates.septalMidwallCapVolumeM3,
    ),
    junctionRadiusM: numberFromFloat64EvidenceV2(
      common.trialCoordinates.junctionRadiusM,
    ),
  } as const;
  const candidateFieldsFinite = candidateNonEnergyFieldsFiniteV2(trial);
  const wallEnergiesFinite = Object.values(trial.wallStoredEnergyJ).every(
    Number.isFinite,
  );
  const trialCoordinatesFinite = coordinatesFiniteV2(trial.internalCoordinates);
  const zeroCoordinateStep = coordinateBitsEqualV2(
    current.internalCoordinates,
    trial.internalCoordinates,
  );
  const geometryPassed =
    trial.junctionRadiusPassed &&
    trial.internalCoordinates.junctionRadiusM >
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.minimumJunctionRadiusMExclusive;
  const projectionCoordinatesMatch = coordinateBitsEqualV2(
    requestedTrialCoordinates,
    trial.internalCoordinates,
  );
  const rawVentricularEnergyBindingPassed = Object.is(
    trial.rawVentricularStoredEnergyJ,
    trial.wallStoredEnergyJ.LVFW +
      trial.wallStoredEnergyJ.SEP +
      trial.wallStoredEnergyJ.RVFW,
  );
  const exactComparisonAvailable = expansion.exactComparisonAvailable;
  const reason: MainWirePassiveEquilibriumCandidateEvaluatedReasonV2 =
    !candidateFieldsFinite
      ? "candidate-field-non-finite"
      : !wallEnergiesFinite
        ? "wall-energy-non-finite"
        : !expansion.twoDiffIntermediatesFinite
          ? "two-diff-intermediate-non-finite"
          : !expansion.twoSumAndExpansionIntermediatesFinite
            ? "two-sum-or-expansion-intermediate-non-finite"
            : !exactComparisonAvailable || expansion.exactExpansionSign === null
              ? "exact-comparison-unavailable"
              : expansion.exactExpansionSign <= 0
                ? "armijo-satisfied"
                : "armijo-not-satisfied";
  return deepFreezeV2({
    ...common,
    status: "evaluated" as const,
    reason,
    evaluationAttempted: true as const,
    trialCandidate: candidateSnapshotV2(trial),
    currentWallStoredEnergyJ: wrapWallEnergiesV2(current.wallStoredEnergyJ),
    trialWallStoredEnergyJ: wrapWallEnergiesV2(trial.wallStoredEnergyJ),
    twoDiffByWall: expansion.twoDiffByWall,
    orderedDifferenceTerms: expansion.orderedDifferenceTerms,
    evaluatedDifferenceExpansion: expansion.evaluatedDifferenceExpansion,
    comparisonExpansion: expansion.comparisonExpansion,
    naiveDeltaJ: wrapMainWirePassiveEquilibriumFloat64V2(naiveDelta),
    deltaUStableDiagnosticJ: expansion.deltaUStableDiagnosticJ,
    absoluteV1ResidualJ:
      wrapMainWirePassiveEquilibriumFloat64V2(absoluteV1Residual),
    roundedV2ResidualJ:
      wrapMainWirePassiveEquilibriumFloat64V2(roundedV2Residual),
    exactExpansionSign: expansion.exactExpansionSign,
    highestNonzeroComparisonExpansionIndex:
      expansion.highestNonzeroComparisonExpansionIndex,
    armijoSatisfied: reason === "armijo-satisfied",
    absoluteV1ArmijoSatisfiedDiagnostic: trialTotal <= currentTotal + rhs,
    candidateFieldsFinite,
    wallEnergiesFinite,
    twoDiffIntermediatesFinite: expansion.twoDiffIntermediatesFinite,
    twoSumAndExpansionIntermediatesFinite:
      expansion.twoSumAndExpansionIntermediatesFinite,
    exactComparisonAvailable,
    trialCoordinatesFinite,
    zeroCoordinateStep,
    geometryPassed,
    projectionCoordinatesMatch,
    rawVentricularEnergyBindingPassed,
    candidateAdmissibilityPassed:
      candidateFieldsFinite &&
      wallEnergiesFinite &&
      expansion.twoDiffIntermediatesFinite &&
      expansion.twoSumAndExpansionIntermediatesFinite &&
      exactComparisonAvailable,
    evaluatedAfterSelectionForDiagnosticCoverage,
  });
}

function withCandidateDecisionRoleV2(
  record: MainWirePassiveEquilibriumCandidateRecordV2,
  selectedBacktrackExponent: number | null,
): MainWirePassiveEquilibriumCandidateRecordV2 {
  const decisionRole =
    selectedBacktrackExponent === null || record.b < selectedBacktrackExponent
      ? "decision-search"
      : record.b === selectedBacktrackExponent
        ? "selected-update"
        : "diagnostic-only-after-selection";
  return deepFreezeV2({
    ...record,
    decisionRole,
    selectedForUpdate: decisionRole === "selected-update",
    ...(record.status === "evaluated"
      ? {
          evaluatedAfterSelectionForDiagnosticCoverage:
            decisionRole === "diagnostic-only-after-selection",
        }
      : {}),
  }) as MainWirePassiveEquilibriumCandidateRecordV2;
}

function candidateRecordTupleV2(
  records: readonly MainWirePassiveEquilibriumCandidateRecordV2[],
): MainWirePassiveEquilibriumCandidateRecordTupleV2 {
  if (records.length !== 29)
    throw new Error(`V2 evidence requires 29 records, got ${records.length}`);
  for (let index = 0; index < records.length; index += 1) {
    if (records[index].b !== index)
      throw new Error(`V2 record index mismatch at ${index}`);
  }
  return Object.freeze([
    ...records,
  ]) as unknown as MainWirePassiveEquilibriumCandidateRecordTupleV2;
}

function currentCoordinateEvidenceV2(
  stageIndex: number,
  iterationIndex: number,
  coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): Extract<
  MainWirePassiveEquilibriumCurrentSolverEvidenceV2,
  { availability: "coordinates-only" }
> {
  return deepFreezeV2({
    stageIndex,
    iterationIndex,
    availability: "coordinates-only" as const,
    currentCoordinates: wrapCoordinatesV2(coordinates),
  });
}

function candidateSnapshotV2(
  candidate: MainWirePassiveEquilibriumStageCandidateProjectionV2,
): MainWirePassiveEquilibriumCandidateSnapshotV2 {
  return deepFreezeV2({
    internalCoordinates: wrapCoordinatesV2(candidate.internalCoordinates),
    wallStoredEnergyJ: wrapWallEnergiesV2(candidate.wallStoredEnergyJ),
    rawVentricularStoredEnergyJ: wrapMainWirePassiveEquilibriumFloat64V2(
      candidate.rawVentricularStoredEnergyJ,
    ),
    scaledGradient: wrappedPairV2(candidate.scaledGradient),
    scaledForceInfinityNorm: wrapMainWirePassiveEquilibriumFloat64V2(
      candidate.scaledForceInfinityNorm,
    ),
    scaledInternalHessian: [
      wrappedPairV2(candidate.scaledInternalHessian[0]),
      wrappedPairV2(candidate.scaledInternalHessian[1]),
    ] as const,
    scaledInternalHessianEigenvaluesAscending: wrappedPairV2(
      candidate.scaledInternalHessianEigenvaluesAscending,
    ),
    strictLocalStabilityPassed: candidate.strictLocalStabilityPassed,
    junctionRadiusPassed: candidate.junctionRadiusPassed,
  });
}

function cloneStageCandidateProjectionV2(
  candidate: MainWirePassiveEquilibriumStageCandidateProjectionV2,
): MainWirePassiveEquilibriumStageCandidateProjectionV2 {
  return deepFreezeV2({
    internalCoordinates: {
      septalMidwallCapVolumeM3:
        candidate.internalCoordinates.septalMidwallCapVolumeM3,
      junctionRadiusM: candidate.internalCoordinates.junctionRadiusM,
    },
    wallStoredEnergyJ: {
      LVFW: candidate.wallStoredEnergyJ.LVFW,
      SEP: candidate.wallStoredEnergyJ.SEP,
      RVFW: candidate.wallStoredEnergyJ.RVFW,
    },
    rawVentricularStoredEnergyJ: candidate.rawVentricularStoredEnergyJ,
    scaledGradient: [
      candidate.scaledGradient[0],
      candidate.scaledGradient[1],
    ] as const,
    scaledForceInfinityNorm: candidate.scaledForceInfinityNorm,
    scaledInternalHessian: [
      [
        candidate.scaledInternalHessian[0][0],
        candidate.scaledInternalHessian[0][1],
      ],
      [
        candidate.scaledInternalHessian[1][0],
        candidate.scaledInternalHessian[1][1],
      ],
    ] as const,
    scaledInternalHessianEigenvaluesAscending: [
      candidate.scaledInternalHessianEigenvaluesAscending[0],
      candidate.scaledInternalHessianEigenvaluesAscending[1],
    ] as const,
    strictLocalStabilityPassed: candidate.strictLocalStabilityPassed,
    junctionRadiusPassed: candidate.junctionRadiusPassed,
  });
}

function wrappedPairV2(
  values: readonly [number, number],
): readonly [
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
] {
  return Object.freeze([
    wrapMainWirePassiveEquilibriumFloat64V2(values[0]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[1]),
  ]);
}

function wrappedTuple6V2(
  values: readonly number[],
): readonly [
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
] {
  if (values.length !== 6)
    throw new Error(`V2 expansion requires 6 components, got ${values.length}`);
  return Object.freeze([
    wrapMainWirePassiveEquilibriumFloat64V2(values[0]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[1]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[2]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[3]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[4]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[5]),
  ]);
}

function wrappedTuple7V2(
  values: readonly number[],
): readonly [
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
  MainWirePassiveEquilibriumFloat64V2,
] {
  if (values.length !== 7)
    throw new Error(
      `V2 comparison requires 7 components, got ${values.length}`,
    );
  return Object.freeze([
    wrapMainWirePassiveEquilibriumFloat64V2(values[0]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[1]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[2]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[3]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[4]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[5]),
    wrapMainWirePassiveEquilibriumFloat64V2(values[6]),
  ]);
}

function wrapCoordinatesV2(
  coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): MainWirePassiveEquilibriumWrappedCoordinatesV2 {
  return deepFreezeV2({
    septalMidwallCapVolumeM3: wrapMainWirePassiveEquilibriumFloat64V2(
      coordinates.septalMidwallCapVolumeM3,
    ),
    junctionRadiusM: wrapMainWirePassiveEquilibriumFloat64V2(
      coordinates.junctionRadiusM,
    ),
  });
}

function wrapWallEnergiesV2(
  energies: MainWirePassiveEquilibriumWallEnergyRecordV2,
): MainWirePassiveEquilibriumWrappedWallEnergiesV2 {
  return deepFreezeV2({
    LVFW: wrapMainWirePassiveEquilibriumFloat64V2(energies.LVFW),
    SEP: wrapMainWirePassiveEquilibriumFloat64V2(energies.SEP),
    RVFW: wrapMainWirePassiveEquilibriumFloat64V2(energies.RVFW),
  });
}

function candidateProjectionFiniteV2(
  candidate: MainWirePassiveEquilibriumStageCandidateProjectionV2,
): boolean {
  return (
    candidateNonEnergyFieldsFiniteV2(candidate) &&
    Object.values(candidate.wallStoredEnergyJ).every(Number.isFinite) &&
    Number.isFinite(candidate.rawVentricularStoredEnergyJ)
  );
}

function candidateNonEnergyFieldsFiniteV2(
  candidate: MainWirePassiveEquilibriumStageCandidateProjectionV2,
): boolean {
  return (
    coordinatesFiniteV2(candidate.internalCoordinates) &&
    candidate.scaledGradient.every(Number.isFinite) &&
    Number.isFinite(candidate.scaledForceInfinityNorm) &&
    candidate.scaledInternalHessian.every((row) =>
      row.every(Number.isFinite),
    ) &&
    candidate.scaledInternalHessianEigenvaluesAscending.every(Number.isFinite)
  );
}

function coordinatesFiniteV2(
  coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): boolean {
  return (
    Number.isFinite(coordinates.septalMidwallCapVolumeM3) &&
    Number.isFinite(coordinates.junctionRadiusM)
  );
}

function coordinateBitsEqualV2(
  left: MainWirePassiveEquilibriumInternalCoordinatesV2,
  right: MainWirePassiveEquilibriumInternalCoordinatesV2,
): boolean {
  return (
    wrapMainWirePassiveEquilibriumFloat64V2(left.septalMidwallCapVolumeM3)
      .float64BitsHex ===
      wrapMainWirePassiveEquilibriumFloat64V2(right.septalMidwallCapVolumeM3)
        .float64BitsHex &&
    wrapMainWirePassiveEquilibriumFloat64V2(left.junctionRadiusM)
      .float64BitsHex ===
      wrapMainWirePassiveEquilibriumFloat64V2(right.junctionRadiusM)
        .float64BitsHex
  );
}

function growExpansionV2(
  initial: readonly number[],
  insertions: readonly number[],
): Readonly<{ values: readonly number[]; intermediatesFinite: boolean }> {
  let expansion = [...initial];
  let intermediatesFinite = expansion.every(Number.isFinite);
  for (const insertion of insertions) {
    let q = insertion;
    const next: number[] = [];
    for (const component of expansion) {
      const result = twoSumRawV2(q, component);
      intermediatesFinite =
        intermediatesFinite && result.intermediates.every(Number.isFinite);
      next.push(result.e);
      q = result.s;
    }
    next.push(q);
    expansion = next;
  }
  return Object.freeze({
    values: Object.freeze(expansion),
    intermediatesFinite:
      intermediatesFinite && expansion.every(Number.isFinite),
  });
}

function twoSumRawV2(
  a: number,
  b: number,
): Readonly<{ s: number; e: number; intermediates: readonly number[] }> {
  const s = a + b;
  const bPrime = s - a;
  const aPrime = s - bPrime;
  const bRound = b - bPrime;
  const aRound = a - aPrime;
  const e = aRound + bRound;
  return Object.freeze({
    s,
    e,
    intermediates: Object.freeze([s, bPrime, aPrime, bRound, aRound, e]),
  });
}

function numberFromFloat64EvidenceV2(
  wrapped: MainWirePassiveEquilibriumFloat64V2,
): number {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(`0x${wrapped.float64BitsHex}`), false);
  return view.getFloat64(0, false);
}

function convergedStageV2(
  input: MainWirePassiveEquilibriumStageKernelInputV2,
  iterations: readonly MainWirePassiveEquilibriumIterationEvidenceV2[],
  completedNewtonUpdates: number,
  selectedLineSearchBacktracks: number,
  lastAcceptedStepDiagnostics: MainWirePassiveEquilibriumAcceptedStepDiagnosticsV2 | null,
  terminalCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2,
): MainWirePassiveEquilibriumStageKernelResultV2 {
  return deepFreezeV2({
    status: "converged" as const,
    stageIndex: input.stageIndex,
    initialCoordinates: wrapCoordinatesV2(input.initialCoordinates),
    iterations,
    completedNewtonUpdates,
    selectedLineSearchBacktracks,
    lastAcceptedStepDiagnostics,
    terminalCandidate,
  });
}

function failedStageV2(
  input: MainWirePassiveEquilibriumStageKernelInputV2,
  iterations: readonly MainWirePassiveEquilibriumIterationEvidenceV2[],
  completedNewtonUpdates: number,
  selectedLineSearchBacktracks: number,
  lastAcceptedStepDiagnostics: MainWirePassiveEquilibriumAcceptedStepDiagnosticsV2 | null,
  failureReason: MainWirePassiveEquilibriumStageFailureReasonV2,
  terminalCandidate: MainWirePassiveEquilibriumCandidateSnapshotV2 | null,
): MainWirePassiveEquilibriumStageKernelResultV2 {
  return deepFreezeV2({
    status: "failed" as const,
    failureReason,
    stageIndex: input.stageIndex,
    initialCoordinates: wrapCoordinatesV2(input.initialCoordinates),
    iterations,
    completedNewtonUpdates,
    selectedLineSearchBacktracks,
    lastAcceptedStepDiagnostics,
    terminalCandidate,
  });
}

function qualifyManufacturedStageResultV2(
  result: MainWirePassiveEquilibriumStageKernelResultV2,
): MainWirePassiveEquilibriumManufacturedStageResultV2 {
  return deepFreezeV2({
    qualification: "manufactured-non-qualified" as const,
    schemaId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MANUFACTURED_STAGE_V2,
    solverPolicyId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
    ...result,
  });
}

function sanitizedExceptionV2(
  error: unknown,
): Readonly<{ name: string; message: string }> {
  if (error instanceof Error)
    return Object.freeze({ name: error.name, message: error.message });
  return Object.freeze({ name: "Error", message: String(error) });
}

function deepFreezeV2<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeV2(child);
    Object.freeze(value);
  }
  return value;
}
