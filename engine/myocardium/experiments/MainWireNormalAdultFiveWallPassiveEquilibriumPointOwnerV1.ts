import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  evaluateEnergyConjugateTriSegV1,
  evaluateTriSegGeometryV1,
  evaluateTriSegWallSecondDerivativeV1,
  type TriSegCoordinatesV1,
  type TriSegWallIdV1,
  type TriSegWallRecordV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import { evaluateEquilibriumOneFiberPassiveV1 } from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import { evaluateMoyer2015AtrialEquibiaxialPassiveV1 } from "@/engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1";
import {
  evaluateNormalAdultAtrialPassivePressureReplayV1,
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
  type NormalAdultAtrialIdV1,
  type NormalAdultFiveWallIdV1,
  type NormalAdultFiveWallRecordV1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
  createMainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VOLUME_BOUNDS_M3_V1,
  PASSIVE_MULTICHAMBER_EQUILIBRIUM_ENERGY_SURFACE_MYOCARDIUM_V1_ID,
  type MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
  type MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointProvenanceV1";

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_FAILURE_V1 =
  "main-wire-normal-adult-passive-equilibrium-point-failure-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_V1 =
  "main-wire-normal-adult-passive-equilibrium-branch-audit-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_CHAMBER_ORDER_V1 =
  Object.freeze(["LA", "LV", "RA", "RV"] as const);

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_WALL_ORDER_V1 =
  Object.freeze(["LA", "LVFW", "SEP", "RVFW", "RA"] as const);

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COUPLED_ORDER_V1 =
  Object.freeze([
    "left-ventricular-cavity-volume-m3",
    "right-ventricular-cavity-volume-m3",
    "septal-midwall-cap-volume-m3",
    "junction-radius-m",
  ] as const);

const VENTRICULAR_WALL_ORDER = ["LVFW", "SEP", "RVFW"] as const;
export type MainWireNormalAdultPassiveChamberVolumesM3V1 = Readonly<{
  LA: number;
  LV: number;
  RA: number;
  RV: number;
}>;

export type MainWireNormalAdultPassiveWallPointV1 = Readonly<{
  wallId: NormalAdultFiveWallIdV1;
  wallMaterialVolumeM3: number;
  fiberLogStrain: number;
  equilibriumKirchhoffStressPa: number;
  dStressDFiberLogStrainPa: number;
  storedEnergyJ: number;
  constitutiveParameterSetId: string;
  constitutiveParameterIdentityHash: string;
}>;

export type MainWirePassiveMatrix2V1 = readonly [
  readonly [number, number],
  readonly [number, number],
];

export type MainWirePassiveMatrix4V1 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
];

export type MainWireNormalAdultPassiveEquilibriumCandidateV1 = Readonly<{
  status: "candidate-evaluated";
  ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID;
  surfaceOwnerId: typeof PASSIVE_MULTICHAMBER_EQUILIBRIUM_ENERGY_SURFACE_MYOCARDIUM_V1_ID;
  chamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1;
  internalCoordinates: TriSegCoordinatesV1;
  wallEquilibriumPassiveByWall: NormalAdultFiveWallRecordV1<MainWireNormalAdultPassiveWallPointV1>;
  componentRawStoredEnergyJ: Readonly<{
    LA: number;
    ventricles: number;
    RA: number;
  }>;
  rawStoredEnergyJ: Readonly<{
    canonicalFactorizedTotal: number;
    canonicalOwner: "LA-plus-ventricles-plus-RA";
    directFiveWallTotal: number;
    directFiveWallTotalRole: "diagnostic-algebraic-binding-only";
    directMinusCanonicalFactorized: number;
  }>;
  intrinsicMyocardialTransmuralPressuresPa: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
  rawCoupledGradient: Readonly<{
    order: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COUPLED_ORDER_V1;
    values: readonly [number, number, number, number];
  }>;
  rawCoupledHessian: Readonly<{
    order: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COUPLED_ORDER_V1;
    values: MainWirePassiveMatrix4V1;
  }>;
  internalEquilibriumEvidence: Readonly<{
    scaledGradient: readonly [number, number];
    scaledForceInfinityNorm: number;
    scaledInternalHessian: MainWirePassiveMatrix2V1;
    scaledInternalHessianEigenvaluesAscending: readonly [number, number];
    strictLocalStabilityPassed: boolean;
    junctionRadiusPassed: boolean;
  }>;
  claim: Readonly<{
    equilibriumPassiveOnly: true;
    dynamicProviderUsed: false;
    landActiveStressUsed: false;
    parallelSlsUsed: false;
    frozenMaterialStateMembranePotentialUsed: false;
    pericardiumUsed: false;
  }>;
}>;

export type MainWireNormalAdultPassiveEquilibriumStageEvidenceV1 = Readonly<{
  stageIndex: number;
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  initialCoordinates: TriSegCoordinatesV1;
  terminalCoordinates: TriSegCoordinatesV1;
  newtonIterations: number;
  lineSearchBacktracks: number;
  terminalRawVentricularStoredEnergyJ: number;
  terminalScaledForceInfinityNorm: number;
  terminalScaledInternalHessianEigenvaluesAscending: readonly [number, number];
  strictLocalStabilityPassed: true;
}>;

export type MainWireNormalAdultPassiveEquilibriumPointFailureReasonV1 =
  | "input-outside-declared-domain"
  | "reference-root-binding-invalid"
  | "candidate-evaluation-failed"
  | "junction-radius-below-minimum"
  | "scaled-internal-hessian-not-positive-definite"
  | "scaled-internal-hessian-singular"
  | "newton-direction-not-descent"
  | "line-search-failed"
  | "scaled-update-stagnated"
  | "newton-iteration-limit"
  | "qualified-terminal-schur-failed";

export type MainWireNormalAdultPassiveEquilibriumPointFailureV1 = Readonly<{
  status: "not-equilibrated";
  ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID;
  failureVersion: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_FAILURE_V1;
  failureReason: MainWireNormalAdultPassiveEquilibriumPointFailureReasonV1;
  failurePhase:
    | "input-validation"
    | "reference-root-binding"
    | "stage-solve"
    | "terminal-projection"
    | "terminal-schur";
  failureDetail: string;
  targetChamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1;
  failedStageIndex: number | null;
  completedStages: readonly MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[];
  lastCandidateEvidence: Readonly<{
    internalCoordinates: TriSegCoordinatesV1;
    rawVentricularStoredEnergyJ: number;
    scaledForceInfinityNorm: number;
    scaledInternalHessianEigenvaluesAscending: readonly [number, number];
  }> | null;
  failedStageEvidence: Readonly<{
    stageIndex: number;
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
    initialCoordinates: TriSegCoordinatesV1;
    lastCoordinates: TriSegCoordinatesV1 | null;
    completedNewtonUpdates: number;
    lineSearchBacktracks: number;
    rejectionCause: MainWireNormalAdultPassiveEquilibriumPointFailureReasonV1;
    lastAcceptedStepDiagnostics: Readonly<{
      acceptedBacktracks: number;
      scaledUpdateInfinityNorm: number;
      currentScaledForceInfinityNorm: number;
      acceptedScaledForceInfinityNorm: number;
      currentEnergyJ: number;
      acceptedEnergyJ: number;
      directionalDerivative: number;
    }> | null;
  }> | null;
  stageZeroRootSha256: string | null;
  provenanceHashes: MainWireNormalAdultPassiveProvenanceHashesV1;
}>;

export type MainWireNormalAdultPassiveProvenanceHashesV1 = Readonly<{
  passiveMaterialGeometryBindingSha256: string;
  pointSolverBranchProtocolSha256: string;
  surfaceVerificationProtocolSha256: string;
}>;

type MainWireNormalAdultPassiveEquilibratedPointCommonV1 = Readonly<{
  status: "equilibrated";
  ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID;
  candidate: MainWireNormalAdultPassiveEquilibriumCandidateV1;
  referenceRelativeStoredEnergyJ: number;
  reducedFourChamberPressureVolumeTangentPaPerM3: Readonly<{
    chamberOrder: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_CHAMBER_ORDER_V1;
    values: MainWirePassiveMatrix4V1;
    internalCoordinateElimination: "H_zz-H_zq*inverse(H_qq)*H_qz";
  }>;
  solverEvidence: Readonly<{
    lineageKind: "stage-zero-reference-root" | "primary-32-stage-diagonal";
    stages: readonly MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[];
    totalNewtonIterations: number;
    totalLineSearchBacktracks: number;
  }>;
  qualificationScope: Readonly<{
    pointLocalStableRootEstablished: true;
    primary32StageDiagonalLineageEstablished: boolean;
    alternatePathAndNineSeedBranchAuditEstablished: false;
    continuousBranchEstablished: false;
    globalMinimumOrUniquenessEstablished: false;
  }>;
  provenanceHashes: MainWireNormalAdultPassiveProvenanceHashesV1;
}>;

export type MainWireNormalAdultPassiveEquilibratedPointV1 =
  MainWireNormalAdultPassiveEquilibratedPointCommonV1 &
    Readonly<{
      stageZeroRootSha256: string;
    }>;

export type MainWireNormalAdultPassiveEquilibratedReferencePointV1 =
  MainWireNormalAdultPassiveEquilibratedPointCommonV1 &
    Readonly<{
      stageZeroRootSha256: null;
    }>;

export type MainWireNormalAdultPassiveEquilibriumPointResultV1 =
  | MainWireNormalAdultPassiveEquilibratedPointV1
  | MainWireNormalAdultPassiveEquilibriumPointFailureV1;

export type MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1 =
  Readonly<{
    status: "sealed-reference-root";
    rootPoint: MainWireNormalAdultPassiveEquilibratedReferencePointV1;
    stageZeroRootPayload: Readonly<{
      ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID;
      referenceVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1;
      candidate: MainWireNormalAdultPassiveEquilibriumCandidateV1;
      reducedFourChamberPressureVolumeTangentPaPerM3: MainWireNormalAdultPassiveEquilibratedReferencePointV1["reducedFourChamberPressureVolumeTangentPaPerM3"];
      solverEvidence: MainWireNormalAdultPassiveEquilibratedReferencePointV1["solverEvidence"];
      qualificationScope: MainWireNormalAdultPassiveEquilibratedReferencePointV1["qualificationScope"];
      passiveMaterialGeometryBindingSha256: string;
      pointSolverBranchProtocolSha256: string;
    }>;
    stageZeroRootSha256: string;
    provenanceHashes: MainWireNormalAdultPassiveProvenanceHashesV1;
  }>;

export type MainWireNormalAdultPassiveEquilibriumReferenceRootResultV1 =
  | MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1
  | MainWireNormalAdultPassiveEquilibriumPointFailureV1;

type MainWireNormalAdultPassiveEquilibriumBranchTerminalEvidenceV1 = Readonly<{
  internalCoordinates: TriSegCoordinatesV1;
  canonicalFactorizedStoredEnergyJ: number;
  intrinsicMyocardialTransmuralPressuresPa: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
}>;

export type MainWireNormalAdultPassiveEquilibriumBranchParticipantV1 =
  | Readonly<{
      status: "participant-equilibrated";
      participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1;
      lineageKind:
        | "primary-32-stage-diagonal"
        | "alternate-lv-first-64-stage"
        | "alternate-rv-first-64-stage"
        | "independent-seed-stage-zero-then-primary-32-stage";
      seedOffsetScaledCoordinates: readonly [number, number] | null;
      stageZeroEvidence: MainWireNormalAdultPassiveEquilibriumStageEvidenceV1;
      homotopyStages: readonly MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[];
      terminal: MainWireNormalAdultPassiveEquilibriumBranchTerminalEvidenceV1;
    }>
  | Readonly<{
      status: "participant-failed";
      participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1;
      lineageKind:
        | "primary-32-stage-diagonal"
        | "alternate-lv-first-64-stage"
        | "alternate-rv-first-64-stage"
        | "independent-seed-stage-zero-then-primary-32-stage";
      seedOffsetScaledCoordinates: readonly [number, number] | null;
      stageZeroEvidence: MainWireNormalAdultPassiveEquilibriumStageEvidenceV1 | null;
      homotopyStages: readonly MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[];
      failure: MainWireNormalAdultPassiveEquilibriumPointFailureV1;
    }>;

export type MainWireNormalAdultPassiveEquilibriumBranchPairComparisonV1 =
  Readonly<{
    pair: readonly [
      MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
      MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
    ];
    status: "compared" | "not-compared-required-participant-failed";
    maximumScaledCoordinateDifference: number | null;
    absoluteStoredEnergyDifferenceJ: number | null;
    maximumScaledPressureDifference: number | null;
    coordinateGatePassed: boolean;
    storedEnergyGatePassed: boolean;
    pressureGatePassed: boolean;
    pairPassed: boolean;
  }>;

type MainWireNormalAdultPassiveEquilibriumBranchAuditCommonV1 = Readonly<{
  ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID;
  auditVersion: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_V1;
  targetChamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1;
  auditLatticeIndices: Readonly<{ LV: 0 | 16 | 32; RV: 0 | 16 | 32 }> | null;
  stageZeroRootSha256: string | null;
  participants: readonly MainWireNormalAdultPassiveEquilibriumBranchParticipantV1[];
  pairwiseComparisons: readonly MainWireNormalAdultPassiveEquilibriumBranchPairComparisonV1[];
  provenanceHashes: MainWireNormalAdultPassiveProvenanceHashesV1;
  claim: Readonly<{
    sampledBranchAgreementOnly: true;
    globalUniquenessOrContinuousBranchEstablished: false;
  }>;
}>;

export type MainWireNormalAdultPassiveEquilibriumBranchAuditResultV1 =
  | (MainWireNormalAdultPassiveEquilibriumBranchAuditCommonV1 &
      Readonly<{
        status: "branch-agreement-established";
        branchAgreementEstablished: true;
        maximumScaledCoordinateDifference: number;
        maximumAbsoluteStoredEnergyDifferenceJ: number;
        maximumScaledPressureDifference: number;
        firstFailedParticipantId: null;
        firstMismatchPair: null;
      }>)
  | (MainWireNormalAdultPassiveEquilibriumBranchAuditCommonV1 &
      Readonly<{
        status: "branch-audit-failed";
        branchAgreementEstablished: false;
        failureReason:
          | "target-outside-branch-audit-lattice"
          | "reference-root-binding-invalid"
          | "required-participant-failed"
          | "branch-agreement-split-cluster";
        failureDetail: string;
        maximumScaledCoordinateDifference: number | null;
        maximumAbsoluteStoredEnergyDifferenceJ: number | null;
        maximumScaledPressureDifference: number | null;
        firstFailedParticipantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1 | null;
        firstMismatchPair:
          | readonly [
              MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
              MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
            ]
          | null;
      }>);

export type MainWireNormalAdultPassiveEquilibriumPointOwnerV1 = Readonly<{
  ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID;
  provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1;
  evaluateCandidate: (
    chamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1,
    internalCoordinates: TriSegCoordinatesV1,
  ) => MainWireNormalAdultPassiveEquilibriumCandidateV1;
  solveReferenceRoot: () => Promise<MainWireNormalAdultPassiveEquilibriumReferenceRootResultV1>;
  solvePoint: (
    chamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1,
    sealedReferenceRoot: MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
  ) => MainWireNormalAdultPassiveEquilibriumPointResultV1;
  auditBranchAtPoint: (
    chamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1,
    sealedReferenceRoot: MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
  ) => MainWireNormalAdultPassiveEquilibriumBranchAuditResultV1;
}>;

type VentricularCandidateV1 = Readonly<{
  chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
  internalCoordinates: TriSegCoordinatesV1;
  wallEquilibriumPassiveByWall: TriSegWallRecordV1<MainWireNormalAdultPassiveWallPointV1>;
  rawStoredEnergyJ: number;
  intrinsicPressuresPa: Readonly<{ LV: number; RV: number }>;
  rawCoupledGradient: readonly [number, number, number, number];
  rawCoupledHessian: MainWirePassiveMatrix4V1;
  internalEquilibriumEvidence: MainWireNormalAdultPassiveEquilibriumCandidateV1["internalEquilibriumEvidence"];
}>;

type StageSuccessV1 = Readonly<{
  status: "stage-equilibrated";
  candidate: VentricularCandidateV1;
  evidence: MainWireNormalAdultPassiveEquilibriumStageEvidenceV1;
}>;

type StageFailureV1 = Readonly<{
  status: "stage-failed";
  reason: MainWireNormalAdultPassiveEquilibriumPointFailureReasonV1;
  detail: string;
  lastCandidateEvidence: MainWireNormalAdultPassiveEquilibriumPointFailureV1["lastCandidateEvidence"];
  failedStageEvidence: NonNullable<
    MainWireNormalAdultPassiveEquilibriumPointFailureV1["failedStageEvidence"]
  >;
}>;

const sealedReferenceRootRegistryV1 = new WeakMap<object, string>();
const equilibratedPointRegistryV1 = new WeakSet<object>();
const pointFailureRegistryV1 = new WeakSet<object>();

export async function createMainWireNormalAdultPassiveEquilibriumPointOwnerV1(): Promise<MainWireNormalAdultPassiveEquilibriumPointOwnerV1> {
  const provenance =
    await createMainWireNormalAdultPassiveEquilibriumPointProvenanceV1();
  assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1(provenance);
  return Object.freeze({
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    provenance,
    evaluateCandidate: evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1,
    solveReferenceRoot: () => solveAndSealReferenceRootV1(provenance),
    solvePoint: (chamberVolumesM3, sealedReferenceRoot) =>
      solvePointFromSealedReferenceRootV1(
        chamberVolumesM3,
        sealedReferenceRoot,
        provenance,
      ),
    auditBranchAtPoint: (chamberVolumesM3, sealedReferenceRoot) =>
      auditBranchAtPointV1(chamberVolumesM3, sealedReferenceRoot, provenance),
  });
}

export function assertMainWireNormalAdultPassiveEquilibratedPointV1(
  point: MainWireNormalAdultPassiveEquilibratedPointV1,
): void {
  if (
    point === null ||
    typeof point !== "object" ||
    !equilibratedPointRegistryV1.has(point) ||
    !Object.isFrozen(point) ||
    !/^[0-9a-f]{64}$/.test(point.stageZeroRootSha256)
  ) {
    throw new Error(
      "equilibrated passive point must be the immutable result of the canonical point owner",
    );
  }
}

export function assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(
  failure: MainWireNormalAdultPassiveEquilibriumPointFailureV1,
): void {
  if (
    failure === null ||
    typeof failure !== "object" ||
    !pointFailureRegistryV1.has(failure) ||
    !Object.isFrozen(failure) ||
    failure.status !== "not-equilibrated"
  ) {
    throw new Error(
      "passive equilibrium point failure must be the immutable result of the canonical point owner",
    );
  }
}

/** Pure candidate evaluation. Stability is evidence, never an exception. */
export function evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1(
  chamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1,
  internalCoordinates: TriSegCoordinatesV1,
): MainWireNormalAdultPassiveEquilibriumCandidateV1 {
  assertChamberVolumesInsideDeclaredDomainV1(chamberVolumesM3);
  const ventricular = evaluateVentricularCandidateV1(
    chamberVolumesM3.LV,
    chamberVolumesM3.RV,
    internalCoordinates,
  );
  const leftAtrium = evaluateAtrialWallPointV1("LA", chamberVolumesM3.LA);
  const rightAtrium = evaluateAtrialWallPointV1("RA", chamberVolumesM3.RA);
  const wallEquilibriumPassiveByWall = Object.freeze({
    LA: leftAtrium.wallPoint,
    LVFW: ventricular.wallEquilibriumPassiveByWall.LVFW,
    SEP: ventricular.wallEquilibriumPassiveByWall.SEP,
    RVFW: ventricular.wallEquilibriumPassiveByWall.RVFW,
    RA: rightAtrium.wallPoint,
  });
  const canonicalFactorizedTotal =
    leftAtrium.wallPoint.storedEnergyJ +
    ventricular.rawStoredEnergyJ +
    rightAtrium.wallPoint.storedEnergyJ;
  const directFiveWallTotal =
    leftAtrium.wallPoint.storedEnergyJ +
    ventricular.wallEquilibriumPassiveByWall.LVFW.storedEnergyJ +
    ventricular.wallEquilibriumPassiveByWall.SEP.storedEnergyJ +
    ventricular.wallEquilibriumPassiveByWall.RVFW.storedEnergyJ +
    rightAtrium.wallPoint.storedEnergyJ;
  requireFinite(canonicalFactorizedTotal, "canonical factorized stored energy");
  requireFinite(directFiveWallTotal, "direct five-wall stored energy");
  return deepFreezePointValueV1({
    status: "candidate-evaluated" as const,
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    surfaceOwnerId:
      PASSIVE_MULTICHAMBER_EQUILIBRIUM_ENERGY_SURFACE_MYOCARDIUM_V1_ID,
    chamberVolumesM3: { ...chamberVolumesM3 },
    internalCoordinates: { ...internalCoordinates },
    wallEquilibriumPassiveByWall,
    componentRawStoredEnergyJ: {
      LA: leftAtrium.wallPoint.storedEnergyJ,
      ventricles: ventricular.rawStoredEnergyJ,
      RA: rightAtrium.wallPoint.storedEnergyJ,
    },
    rawStoredEnergyJ: {
      canonicalFactorizedTotal,
      canonicalOwner: "LA-plus-ventricles-plus-RA" as const,
      directFiveWallTotal,
      directFiveWallTotalRole: "diagnostic-algebraic-binding-only" as const,
      directMinusCanonicalFactorized:
        directFiveWallTotal - canonicalFactorizedTotal,
    },
    intrinsicMyocardialTransmuralPressuresPa: {
      LA: leftAtrium.pressurePa,
      LV: ventricular.intrinsicPressuresPa.LV,
      RA: rightAtrium.pressurePa,
      RV: ventricular.intrinsicPressuresPa.RV,
    },
    rawCoupledGradient: {
      order: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COUPLED_ORDER_V1,
      values: ventricular.rawCoupledGradient,
    },
    rawCoupledHessian: {
      order: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COUPLED_ORDER_V1,
      values: ventricular.rawCoupledHessian,
    },
    internalEquilibriumEvidence: ventricular.internalEquilibriumEvidence,
    claim: {
      equilibriumPassiveOnly: true as const,
      dynamicProviderUsed: false as const,
      landActiveStressUsed: false as const,
      parallelSlsUsed: false as const,
      frozenMaterialStateMembranePotentialUsed: false as const,
      pericardiumUsed: false as const,
    },
  });
}

async function solveAndSealReferenceRootV1(
  provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
): Promise<MainWireNormalAdultPassiveEquilibriumReferenceRootResultV1> {
  const referenceVolumes =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  const stage = solveVentricularStageV1({
    stageIndex: 0,
    leftVentricularCavityVolumeM3: referenceVolumes.LV,
    rightVentricularCavityVolumeM3: referenceVolumes.RV,
    initialCoordinates:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates,
  });
  if (stage.status === "stage-failed") {
    return pointFailureV1({
      provenance,
      failurePhase: "stage-solve",
      failureReason: stage.reason,
      failureDetail: stage.detail,
      targetChamberVolumesM3: referenceVolumes,
      failedStageIndex: 0,
      completedStages: [],
      lastCandidateEvidence: stage.lastCandidateEvidence,
      failedStageEvidence: stage.failedStageEvidence,
      stageZeroRootSha256: null,
    });
  }
  let candidate: MainWireNormalAdultPassiveEquilibriumCandidateV1;
  try {
    candidate = evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1(
      referenceVolumes,
      stage.candidate.internalCoordinates,
    );
  } catch (error) {
    return pointFailureV1({
      provenance,
      failurePhase: "terminal-projection",
      failureReason: "candidate-evaluation-failed",
      failureDetail: errorMessageV1(error),
      targetChamberVolumesM3: referenceVolumes,
      failedStageIndex: null,
      completedStages: [stage.evidence],
      lastCandidateEvidence: compactCandidateEvidenceV1(stage.candidate),
      failedStageEvidence: null,
      stageZeroRootSha256: null,
    });
  }
  const reducedTangent = reducedFourChamberTangentV1(candidate);
  if (reducedTangent === null) {
    return pointFailureV1({
      provenance,
      failurePhase: "terminal-schur",
      failureReason: "qualified-terminal-schur-failed",
      failureDetail: "reference root internal Hessian could not be eliminated",
      targetChamberVolumesM3: referenceVolumes,
      failedStageIndex: null,
      completedStages: [stage.evidence],
      lastCandidateEvidence: compactCandidateEvidenceV1(stage.candidate),
      failedStageEvidence: null,
      stageZeroRootSha256: null,
    });
  }
  const solverEvidence = solverEvidenceV1("stage-zero-reference-root", [
    stage.evidence,
  ]);
  const provenanceHashes = provenanceHashesV1(provenance);
  const rootPoint = deepFreezePointValueV1({
    status: "equilibrated" as const,
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    candidate,
    referenceRelativeStoredEnergyJ: 0,
    reducedFourChamberPressureVolumeTangentPaPerM3: reducedTangent,
    solverEvidence,
    qualificationScope: pointQualificationScopeV1(false),
    stageZeroRootSha256: null,
    provenanceHashes,
  });
  const stageZeroRootPayload = deepFreezePointValueV1({
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    referenceVolumesM3: { ...referenceVolumes },
    candidate,
    reducedFourChamberPressureVolumeTangentPaPerM3: reducedTangent,
    solverEvidence,
    qualificationScope: rootPoint.qualificationScope,
    passiveMaterialGeometryBindingSha256:
      provenance.passiveMaterialGeometryBindingSha256,
    pointSolverBranchProtocolSha256: provenance.pointSolverBranchProtocolSha256,
  });
  const stageZeroRootSha256 =
    await sha256CanonicalJsonHex(stageZeroRootPayload);
  const sealed = deepFreezePointValueV1({
    status: "sealed-reference-root" as const,
    rootPoint,
    stageZeroRootPayload,
    stageZeroRootSha256,
    provenanceHashes,
  });
  sealedReferenceRootRegistryV1.set(sealed, stageZeroRootSha256);
  return sealed;
}

function solvePointFromSealedReferenceRootV1(
  chamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1,
  sealedReferenceRoot: MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
  provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
): MainWireNormalAdultPassiveEquilibriumPointResultV1 {
  if (!validSealedReferenceRootV1(sealedReferenceRoot, provenance)) {
    return pointFailureV1({
      provenance,
      failurePhase: "reference-root-binding",
      failureReason: "reference-root-binding-invalid",
      failureDetail:
        "stage-0 root must be the immutable value sealed by this canonical owner",
      targetChamberVolumesM3: freezeVolumesV1(chamberVolumesM3),
      failedStageIndex: null,
      completedStages: [],
      lastCandidateEvidence: null,
      failedStageEvidence: null,
      stageZeroRootSha256: null,
    });
  }
  try {
    assertChamberVolumesInsideDeclaredDomainV1(chamberVolumesM3);
  } catch (error) {
    return pointFailureV1({
      provenance,
      failurePhase: "input-validation",
      failureReason: "input-outside-declared-domain",
      failureDetail: errorMessageV1(error),
      targetChamberVolumesM3: freezeVolumesV1(chamberVolumesM3),
      failedStageIndex: null,
      completedStages: [],
      lastCandidateEvidence: null,
      failedStageEvidence: null,
      stageZeroRootSha256: sealedReferenceRoot.stageZeroRootSha256,
    });
  }

  const completedStages: MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[] =
    [];
  let coordinates = sealedReferenceRoot.rootPoint.candidate.internalCoordinates;
  let terminalVentricularCandidate: VentricularCandidateV1 | null = null;
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  const stageCount =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1
      .primaryDiagonalHomotopy.stageCount;
  for (let stageIndex = 1; stageIndex <= stageCount; stageIndex += 1) {
    const fraction = stageIndex / stageCount;
    const leftVentricularCavityVolumeM3 =
      reference.LV + fraction * (chamberVolumesM3.LV - reference.LV);
    const rightVentricularCavityVolumeM3 =
      reference.RV + fraction * (chamberVolumesM3.RV - reference.RV);
    const stage = solveVentricularStageV1({
      stageIndex,
      leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3,
      initialCoordinates: coordinates,
    });
    if (stage.status === "stage-failed") {
      return pointFailureV1({
        provenance,
        failurePhase: "stage-solve",
        failureReason: stage.reason,
        failureDetail: stage.detail,
        targetChamberVolumesM3: chamberVolumesM3,
        failedStageIndex: stageIndex,
        completedStages,
        lastCandidateEvidence: stage.lastCandidateEvidence,
        failedStageEvidence: stage.failedStageEvidence,
        stageZeroRootSha256: sealedReferenceRoot.stageZeroRootSha256,
      });
    }
    completedStages.push(stage.evidence);
    coordinates = stage.candidate.internalCoordinates;
    terminalVentricularCandidate = stage.candidate;
  }

  let candidate: MainWireNormalAdultPassiveEquilibriumCandidateV1;
  try {
    candidate = evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1(
      chamberVolumesM3,
      coordinates,
    );
  } catch (error) {
    return pointFailureV1({
      provenance,
      failurePhase: "terminal-projection",
      failureReason: "candidate-evaluation-failed",
      failureDetail: errorMessageV1(error),
      targetChamberVolumesM3: chamberVolumesM3,
      failedStageIndex: null,
      completedStages,
      lastCandidateEvidence:
        terminalVentricularCandidate === null
          ? null
          : compactCandidateEvidenceV1(terminalVentricularCandidate),
      failedStageEvidence: null,
      stageZeroRootSha256: sealedReferenceRoot.stageZeroRootSha256,
    });
  }
  const reducedTangent = reducedFourChamberTangentV1(candidate);
  if (reducedTangent === null) {
    return pointFailureV1({
      provenance,
      failurePhase: "terminal-schur",
      failureReason: "qualified-terminal-schur-failed",
      failureDetail: "terminal root internal Hessian could not be eliminated",
      targetChamberVolumesM3: chamberVolumesM3,
      failedStageIndex: null,
      completedStages,
      lastCandidateEvidence:
        terminalVentricularCandidate === null
          ? null
          : compactCandidateEvidenceV1(terminalVentricularCandidate),
      failedStageEvidence: null,
      stageZeroRootSha256: sealedReferenceRoot.stageZeroRootSha256,
    });
  }
  const point = deepFreezePointValueV1({
    status: "equilibrated" as const,
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    candidate,
    referenceRelativeStoredEnergyJ:
      candidate.rawStoredEnergyJ.canonicalFactorizedTotal -
      sealedReferenceRoot.rootPoint.candidate.rawStoredEnergyJ
        .canonicalFactorizedTotal,
    reducedFourChamberPressureVolumeTangentPaPerM3: reducedTangent,
    solverEvidence: solverEvidenceV1(
      "primary-32-stage-diagonal",
      completedStages,
    ),
    qualificationScope: pointQualificationScopeV1(true),
    stageZeroRootSha256: sealedReferenceRoot.stageZeroRootSha256,
    provenanceHashes: provenanceHashesV1(provenance),
  });
  equilibratedPointRegistryV1.add(point);
  return point;
}

function auditBranchAtPointV1(
  chamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1,
  sealedReferenceRoot: MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
  provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
): MainWireNormalAdultPassiveEquilibriumBranchAuditResultV1 {
  const targetChamberVolumesM3 = freezeVolumesV1(chamberVolumesM3);
  const commonPreflight = {
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    auditVersion: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_V1,
    targetChamberVolumesM3,
    participants: [] as const,
    pairwiseComparisons: [] as const,
    provenanceHashes: provenanceHashesV1(provenance),
    claim: {
      sampledBranchAgreementOnly: true as const,
      globalUniquenessOrContinuousBranchEstablished: false as const,
    },
  };
  let auditLatticeIndices: Readonly<{ LV: 0 | 16 | 32; RV: 0 | 16 | 32 }>;
  try {
    assertChamberVolumesInsideDeclaredDomainV1(chamberVolumesM3);
    const leftIndex = branchAuditLatticeIndexV1("LV", chamberVolumesM3.LV);
    const rightIndex = branchAuditLatticeIndexV1("RV", chamberVolumesM3.RV);
    if (leftIndex === null || rightIndex === null) {
      throw new RangeError(
        "LV and RV must both be exact declared branch-audit lattice values",
      );
    }
    auditLatticeIndices = Object.freeze({ LV: leftIndex, RV: rightIndex });
  } catch (error) {
    return deepFreezePointValueV1({
      ...commonPreflight,
      status: "branch-audit-failed" as const,
      branchAgreementEstablished: false as const,
      failureReason: "target-outside-branch-audit-lattice" as const,
      failureDetail: errorMessageV1(error),
      auditLatticeIndices: null,
      stageZeroRootSha256: null,
      maximumScaledCoordinateDifference: null,
      maximumAbsoluteStoredEnergyDifferenceJ: null,
      maximumScaledPressureDifference: null,
      firstFailedParticipantId: null,
      firstMismatchPair: null,
    });
  }
  if (!validSealedReferenceRootV1(sealedReferenceRoot, provenance)) {
    return deepFreezePointValueV1({
      ...commonPreflight,
      status: "branch-audit-failed" as const,
      branchAgreementEstablished: false as const,
      failureReason: "reference-root-binding-invalid" as const,
      failureDetail:
        "branch audit requires the immutable stage-0 root sealed by this canonical owner",
      auditLatticeIndices,
      stageZeroRootSha256: null,
      maximumScaledCoordinateDifference: null,
      maximumAbsoluteStoredEnergyDifferenceJ: null,
      maximumScaledPressureDifference: null,
      firstFailedParticipantId: null,
      firstMismatchPair: null,
    });
  }

  const rootStage = sealedReferenceRoot.rootPoint.solverEvidence.stages[0]!;
  const participants: MainWireNormalAdultPassiveEquilibriumBranchParticipantV1[] =
    [];
  const primary = solvePointFromSealedReferenceRootV1(
    chamberVolumesM3,
    sealedReferenceRoot,
    provenance,
  );
  participants.push(
    primary.status === "equilibrated"
      ? branchParticipantSuccessV1({
          participantId: "primary-zero-offset-canonical-root",
          lineageKind: "primary-32-stage-diagonal",
          seedOffsetScaledCoordinates: null,
          stageZeroEvidence: rootStage,
          homotopyStages: primary.solverEvidence.stages,
          candidate: primary.candidate,
        })
      : branchParticipantFailureV1({
          participantId: "primary-zero-offset-canonical-root",
          lineageKind: "primary-32-stage-diagonal",
          seedOffsetScaledCoordinates: null,
          stageZeroEvidence: rootStage,
          homotopyStages: primary.completedStages,
          failure: primary,
        }),
  );

  participants.push(
    solveFixedBranchParticipantV1({
      participantId: "alternate-lv-first",
      lineageKind: "alternate-lv-first-64-stage",
      seedOffsetScaledCoordinates: null,
      stageZeroEvidence: rootStage,
      initialCoordinates:
        sealedReferenceRoot.rootPoint.candidate.internalCoordinates,
      schedule: alternateBranchScheduleV1("lv-first", chamberVolumesM3),
      targetChamberVolumesM3: chamberVolumesM3,
      provenance,
      stageZeroRootSha256: sealedReferenceRoot.stageZeroRootSha256,
      includeStageZeroInFailureCompletedStages: false,
    }),
  );
  participants.push(
    solveFixedBranchParticipantV1({
      participantId: "alternate-rv-first",
      lineageKind: "alternate-rv-first-64-stage",
      seedOffsetScaledCoordinates: null,
      stageZeroEvidence: rootStage,
      initialCoordinates:
        sealedReferenceRoot.rootPoint.candidate.internalCoordinates,
      schedule: alternateBranchScheduleV1("rv-first", chamberVolumesM3),
      targetChamberVolumesM3: chamberVolumesM3,
      provenance,
      stageZeroRootSha256: sealedReferenceRoot.stageZeroRootSha256,
      includeStageZeroInFailureCompletedStages: false,
    }),
  );

  const seedOffsets =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1.referenceSeedOffsetsInScaledCoordinates;
  const seedParticipantIds =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1.slice(
      3,
    );
  for (let seedIndex = 0; seedIndex < seedOffsets.length; seedIndex += 1) {
    const seedOffset = Object.freeze([
      seedOffsets[seedIndex]![0]!,
      seedOffsets[seedIndex]![1]!,
    ] as const);
    const participantId = seedParticipantIds[seedIndex]!;
    participants.push(
      solveIndependentSeedBranchParticipantV1({
        participantId,
        seedOffsetScaledCoordinates: seedOffset,
        targetChamberVolumesM3: chamberVolumesM3,
        provenance,
      }),
    );
  }

  const pairwiseComparisons = branchPairwiseComparisonsV1(participants);
  const compared = pairwiseComparisons.filter(
    (comparison) => comparison.status === "compared",
  );
  const maximumScaledCoordinateDifference = nullableMaximumV1(
    compared.map((comparison) => comparison.maximumScaledCoordinateDifference),
  );
  const maximumAbsoluteStoredEnergyDifferenceJ = nullableMaximumV1(
    compared.map((comparison) => comparison.absoluteStoredEnergyDifferenceJ),
  );
  const maximumScaledPressureDifference = nullableMaximumV1(
    compared.map((comparison) => comparison.maximumScaledPressureDifference),
  );
  const firstFailedParticipant = participants.find(
    (participant) => participant.status === "participant-failed",
  );
  const firstComparedMismatch = pairwiseComparisons.find(
    (comparison) =>
      comparison.status === "compared" && !comparison.pairPassed,
  );
  const common = {
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    auditVersion: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_V1,
    targetChamberVolumesM3,
    auditLatticeIndices,
    stageZeroRootSha256: sealedReferenceRoot.stageZeroRootSha256,
    participants,
    pairwiseComparisons,
    provenanceHashes: provenanceHashesV1(provenance),
    claim: commonPreflight.claim,
  };
  if (firstFailedParticipant !== undefined) {
    return deepFreezePointValueV1({
      ...common,
      status: "branch-audit-failed" as const,
      branchAgreementEstablished: false as const,
      failureReason: "required-participant-failed" as const,
      failureDetail: `required participant failed: ${firstFailedParticipant.participantId}`,
      maximumScaledCoordinateDifference,
      maximumAbsoluteStoredEnergyDifferenceJ,
      maximumScaledPressureDifference,
      firstFailedParticipantId: firstFailedParticipant.participantId,
      firstMismatchPair: firstComparedMismatch?.pair ?? null,
    });
  }
  if (
    participants.length !==
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1.length ||
    pairwiseComparisons.length !==
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1.length ||
    firstComparedMismatch !== undefined ||
    maximumScaledCoordinateDifference === null ||
    maximumAbsoluteStoredEnergyDifferenceJ === null ||
    maximumScaledPressureDifference === null
  ) {
    return deepFreezePointValueV1({
      ...common,
      status: "branch-audit-failed" as const,
      branchAgreementEstablished: false as const,
      failureReason: "branch-agreement-split-cluster" as const,
      failureDetail:
        "one or more required participant pairs failed the preregistered branch-agreement gates",
      maximumScaledCoordinateDifference,
      maximumAbsoluteStoredEnergyDifferenceJ,
      maximumScaledPressureDifference,
      firstFailedParticipantId: null,
      firstMismatchPair: firstComparedMismatch?.pair ?? null,
    });
  }
  return deepFreezePointValueV1({
    ...common,
    status: "branch-agreement-established" as const,
    branchAgreementEstablished: true as const,
    maximumScaledCoordinateDifference,
    maximumAbsoluteStoredEnergyDifferenceJ,
    maximumScaledPressureDifference,
    firstFailedParticipantId: null,
    firstMismatchPair: null,
  });
}

function solveIndependentSeedBranchParticipantV1(
  input: Readonly<{
    participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1;
    seedOffsetScaledCoordinates: readonly [number, number];
    targetChamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1;
    provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1;
  }>,
): MainWireNormalAdultPassiveEquilibriumBranchParticipantV1 {
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  const loaded =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates;
  const scales =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.coordinateScales;
  const seedCoordinates = Object.freeze({
    septalMidwallCapVolumeM3:
      loaded.septalMidwallCapVolumeM3 +
      scales.septalMidwallCapVolumeM3 * input.seedOffsetScaledCoordinates[0],
    junctionRadiusM:
      loaded.junctionRadiusM +
      scales.junctionRadiusM * input.seedOffsetScaledCoordinates[1],
  });
  const stageZero = solveVentricularStageV1({
    stageIndex: 0,
    leftVentricularCavityVolumeM3: reference.LV,
    rightVentricularCavityVolumeM3: reference.RV,
    initialCoordinates: seedCoordinates,
  });
  if (stageZero.status === "stage-failed") {
    const failure = pointFailureV1({
      provenance: input.provenance,
      failurePhase: "stage-solve",
      failureReason: stageZero.reason,
      failureDetail: stageZero.detail,
      targetChamberVolumesM3: reference,
      failedStageIndex: 0,
      completedStages: [],
      lastCandidateEvidence: stageZero.lastCandidateEvidence,
      failedStageEvidence: stageZero.failedStageEvidence,
      stageZeroRootSha256: null,
    });
    return branchParticipantFailureV1({
      participantId: input.participantId,
      lineageKind: "independent-seed-stage-zero-then-primary-32-stage",
      seedOffsetScaledCoordinates: input.seedOffsetScaledCoordinates,
      stageZeroEvidence: null,
      homotopyStages: [],
      failure,
    });
  }
  return solveFixedBranchParticipantV1({
    participantId: input.participantId,
    lineageKind: "independent-seed-stage-zero-then-primary-32-stage",
    seedOffsetScaledCoordinates: input.seedOffsetScaledCoordinates,
    stageZeroEvidence: stageZero.evidence,
    initialCoordinates: stageZero.candidate.internalCoordinates,
    schedule: primaryBranchScheduleV1(input.targetChamberVolumesM3),
    targetChamberVolumesM3: input.targetChamberVolumesM3,
    provenance: input.provenance,
    stageZeroRootSha256: null,
    includeStageZeroInFailureCompletedStages: true,
  });
}

function solveFixedBranchParticipantV1(
  input: Readonly<{
    participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1;
    lineageKind:
      | "alternate-lv-first-64-stage"
      | "alternate-rv-first-64-stage"
      | "independent-seed-stage-zero-then-primary-32-stage";
    seedOffsetScaledCoordinates: readonly [number, number] | null;
    stageZeroEvidence: MainWireNormalAdultPassiveEquilibriumStageEvidenceV1;
    initialCoordinates: TriSegCoordinatesV1;
    schedule: readonly Readonly<{
      stageIndex: number;
      leftVentricularCavityVolumeM3: number;
      rightVentricularCavityVolumeM3: number;
    }>[];
    targetChamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1;
    provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1;
    stageZeroRootSha256: string | null;
    includeStageZeroInFailureCompletedStages: boolean;
  }>,
): MainWireNormalAdultPassiveEquilibriumBranchParticipantV1 {
  const completedStages: MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[] =
    [];
  let coordinates = input.initialCoordinates;
  let terminalCandidate: VentricularCandidateV1 | null = null;
  for (const scheduledStage of input.schedule) {
    const stage = solveVentricularStageV1({
      ...scheduledStage,
      initialCoordinates: coordinates,
    });
    if (stage.status === "stage-failed") {
      const precedingStages = input.includeStageZeroInFailureCompletedStages
        ? [input.stageZeroEvidence, ...completedStages]
        : completedStages;
      const failure = pointFailureV1({
        provenance: input.provenance,
        failurePhase: "stage-solve",
        failureReason: stage.reason,
        failureDetail: stage.detail,
        targetChamberVolumesM3: input.targetChamberVolumesM3,
        failedStageIndex: scheduledStage.stageIndex,
        completedStages: precedingStages,
        lastCandidateEvidence: stage.lastCandidateEvidence,
        failedStageEvidence: stage.failedStageEvidence,
        stageZeroRootSha256: input.stageZeroRootSha256,
      });
      return branchParticipantFailureV1({
        participantId: input.participantId,
        lineageKind: input.lineageKind,
        seedOffsetScaledCoordinates: input.seedOffsetScaledCoordinates,
        stageZeroEvidence: input.stageZeroEvidence,
        homotopyStages: completedStages,
        failure,
      });
    }
    completedStages.push(stage.evidence);
    coordinates = stage.candidate.internalCoordinates;
    terminalCandidate = stage.candidate;
  }
  let candidate: MainWireNormalAdultPassiveEquilibriumCandidateV1;
  try {
    candidate = evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1(
      input.targetChamberVolumesM3,
      coordinates,
    );
  } catch (error) {
    const precedingStages = input.includeStageZeroInFailureCompletedStages
      ? [input.stageZeroEvidence, ...completedStages]
      : completedStages;
    const failure = pointFailureV1({
      provenance: input.provenance,
      failurePhase: "terminal-projection",
      failureReason: "candidate-evaluation-failed",
      failureDetail: errorMessageV1(error),
      targetChamberVolumesM3: input.targetChamberVolumesM3,
      failedStageIndex: null,
      completedStages: precedingStages,
      lastCandidateEvidence:
        terminalCandidate === null
          ? null
          : compactCandidateEvidenceV1(terminalCandidate),
      failedStageEvidence: null,
      stageZeroRootSha256: input.stageZeroRootSha256,
    });
    return branchParticipantFailureV1({
      participantId: input.participantId,
      lineageKind: input.lineageKind,
      seedOffsetScaledCoordinates: input.seedOffsetScaledCoordinates,
      stageZeroEvidence: input.stageZeroEvidence,
      homotopyStages: completedStages,
      failure,
    });
  }
  return branchParticipantSuccessV1({
    participantId: input.participantId,
    lineageKind: input.lineageKind,
    seedOffsetScaledCoordinates: input.seedOffsetScaledCoordinates,
    stageZeroEvidence: input.stageZeroEvidence,
    homotopyStages: completedStages,
    candidate,
  });
}

function primaryBranchScheduleV1(
  target: MainWireNormalAdultPassiveChamberVolumesM3V1,
) {
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  const stageCount =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1
      .primaryDiagonalHomotopy.stageCount;
  return Object.freeze(
    Array.from({ length: stageCount }, (_, offset) => {
      const stageIndex = offset + 1;
      const fraction = stageIndex / stageCount;
      return Object.freeze({
        stageIndex,
        leftVentricularCavityVolumeM3:
          reference.LV + fraction * (target.LV - reference.LV),
        rightVentricularCavityVolumeM3:
          reference.RV + fraction * (target.RV - reference.RV),
      });
    }),
  );
}

function alternateBranchScheduleV1(
  path: "lv-first" | "rv-first",
  target: MainWireNormalAdultPassiveChamberVolumesM3V1,
) {
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  const stageCountPerLeg =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1.alternatePaths
      .stageCountPerLeg;
  const stageCount =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1.alternatePaths
      .stageCountPerPath;
  return Object.freeze(
    Array.from({ length: stageCount }, (_, offset) => {
      const stageIndex = offset + 1;
      const firstLeg = stageIndex <= stageCountPerLeg;
      const legIndex = firstLeg ? stageIndex : stageIndex - stageCountPerLeg;
      const fraction = legIndex / stageCountPerLeg;
      const leftVentricularCavityVolumeM3 =
        path === "lv-first"
          ? firstLeg
            ? reference.LV + fraction * (target.LV - reference.LV)
            : target.LV
          : firstLeg
            ? reference.LV
            : reference.LV + fraction * (target.LV - reference.LV);
      const rightVentricularCavityVolumeM3 =
        path === "rv-first"
          ? firstLeg
            ? reference.RV + fraction * (target.RV - reference.RV)
            : target.RV
          : firstLeg
            ? reference.RV
            : reference.RV + fraction * (target.RV - reference.RV);
      return Object.freeze({
        stageIndex,
        leftVentricularCavityVolumeM3,
        rightVentricularCavityVolumeM3,
      });
    }),
  );
}

function branchParticipantSuccessV1(
  input: Readonly<{
    participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1;
    lineageKind:
      | "primary-32-stage-diagonal"
      | "alternate-lv-first-64-stage"
      | "alternate-rv-first-64-stage"
      | "independent-seed-stage-zero-then-primary-32-stage";
    seedOffsetScaledCoordinates: readonly [number, number] | null;
    stageZeroEvidence: MainWireNormalAdultPassiveEquilibriumStageEvidenceV1;
    homotopyStages: readonly MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[];
    candidate: MainWireNormalAdultPassiveEquilibriumCandidateV1;
  }>,
): MainWireNormalAdultPassiveEquilibriumBranchParticipantV1 {
  return deepFreezePointValueV1({
    status: "participant-equilibrated" as const,
    participantId: input.participantId,
    lineageKind: input.lineageKind,
    seedOffsetScaledCoordinates: input.seedOffsetScaledCoordinates,
    stageZeroEvidence: input.stageZeroEvidence,
    homotopyStages: [...input.homotopyStages],
    terminal: {
      internalCoordinates: { ...input.candidate.internalCoordinates },
      canonicalFactorizedStoredEnergyJ:
        input.candidate.rawStoredEnergyJ.canonicalFactorizedTotal,
      intrinsicMyocardialTransmuralPressuresPa: {
        ...input.candidate.intrinsicMyocardialTransmuralPressuresPa,
      },
    },
  });
}

function branchParticipantFailureV1(
  input: Readonly<{
    participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1;
    lineageKind:
      | "primary-32-stage-diagonal"
      | "alternate-lv-first-64-stage"
      | "alternate-rv-first-64-stage"
      | "independent-seed-stage-zero-then-primary-32-stage";
    seedOffsetScaledCoordinates: readonly [number, number] | null;
    stageZeroEvidence: MainWireNormalAdultPassiveEquilibriumStageEvidenceV1 | null;
    homotopyStages: readonly MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[];
    failure: MainWireNormalAdultPassiveEquilibriumPointFailureV1;
  }>,
): MainWireNormalAdultPassiveEquilibriumBranchParticipantV1 {
  assertMainWireNormalAdultPassiveEquilibriumPointFailureV1(input.failure);
  return deepFreezePointValueV1({
    status: "participant-failed" as const,
    participantId: input.participantId,
    lineageKind: input.lineageKind,
    seedOffsetScaledCoordinates: input.seedOffsetScaledCoordinates,
    stageZeroEvidence: input.stageZeroEvidence,
    homotopyStages: [...input.homotopyStages],
    failure: input.failure,
  });
}

function branchPairwiseComparisonsV1(
  participants: readonly MainWireNormalAdultPassiveEquilibriumBranchParticipantV1[],
): readonly MainWireNormalAdultPassiveEquilibriumBranchPairComparisonV1[] {
  const byId = new Map(
    participants.map((participant) => [participant.participantId, participant]),
  );
  const policy =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1.branchAgreement;
  const scales =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.coordinateScales;
  return deepFreezePointValueV1(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1.map(
      (pair) => {
        const left = byId.get(pair[0]);
        const right = byId.get(pair[1]);
        if (
          left?.status !== "participant-equilibrated" ||
          right?.status !== "participant-equilibrated"
        ) {
          return {
            pair: [...pair] as const,
            status: "not-compared-required-participant-failed" as const,
            maximumScaledCoordinateDifference: null,
            absoluteStoredEnergyDifferenceJ: null,
            maximumScaledPressureDifference: null,
            coordinateGatePassed: false,
            storedEnergyGatePassed: false,
            pressureGatePassed: false,
            pairPassed: false,
          };
        }
        const coordinateDifference = Math.max(
          Math.abs(
            left.terminal.internalCoordinates.septalMidwallCapVolumeM3 -
              right.terminal.internalCoordinates.septalMidwallCapVolumeM3,
          ) / scales.septalMidwallCapVolumeM3,
          Math.abs(
            left.terminal.internalCoordinates.junctionRadiusM -
              right.terminal.internalCoordinates.junctionRadiusM,
          ) / scales.junctionRadiusM,
        );
        const storedEnergyDifferenceJ = Math.abs(
          left.terminal.canonicalFactorizedStoredEnergyJ -
            right.terminal.canonicalFactorizedStoredEnergyJ,
        );
        let pressureDifference = 0;
        for (const chamber of MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_CHAMBER_ORDER_V1) {
          const leftPressure =
            left.terminal.intrinsicMyocardialTransmuralPressuresPa[chamber];
          const rightPressure =
            right.terminal.intrinsicMyocardialTransmuralPressuresPa[chamber];
          pressureDifference = Math.max(
            pressureDifference,
            Math.abs(leftPressure - rightPressure) /
              Math.max(
                Math.abs(leftPressure),
                Math.abs(rightPressure),
                policy.pressureFloorPa,
              ),
          );
        }
        const coordinateGatePassed =
          coordinateDifference <= policy.maximumScaledCoordinateDifference;
        const storedEnergyGatePassed =
          storedEnergyDifferenceJ <=
          policy.maximumAbsoluteStoredEnergyDifferenceJ;
        const pressureGatePassed =
          pressureDifference <= policy.maximumScaledPressureDifference;
        return {
          pair: [...pair] as const,
          status: "compared" as const,
          maximumScaledCoordinateDifference: coordinateDifference,
          absoluteStoredEnergyDifferenceJ: storedEnergyDifferenceJ,
          maximumScaledPressureDifference: pressureDifference,
          coordinateGatePassed,
          storedEnergyGatePassed,
          pressureGatePassed,
          pairPassed:
            coordinateGatePassed &&
            storedEnergyGatePassed &&
            pressureGatePassed,
        };
      },
    ),
  );
}

function branchAuditLatticeIndexV1(
  chamber: "LV" | "RV",
  valueM3: number,
): 0 | 16 | 32 | null {
  const bounds =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VOLUME_BOUNDS_M3_V1[chamber];
  const denominator =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1
      .primaryDiagonalHomotopy.stageCount;
  for (const index of MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1.auditLatticeAxisIndices) {
    const expected =
      bounds.minimum +
      (index / denominator) * (bounds.maximum - bounds.minimum);
    if (valueM3 === expected && (index === 0 || index === 16 || index === 32))
      return index;
  }
  return null;
}

function nullableMaximumV1(values: readonly (number | null)[]): number | null {
  const finiteValues = values.filter(
    (value): value is number => value !== null,
  );
  return finiteValues.length === 0 ? null : Math.max(...finiteValues);
}

function solveVentricularStageV1(
  input: Readonly<{
    stageIndex: number;
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
    initialCoordinates: TriSegCoordinatesV1;
  }>,
): StageSuccessV1 | StageFailureV1 {
  const solver =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1;
  let coordinates = Object.freeze({ ...input.initialCoordinates });
  let totalBacktracks = 0;
  let lastCandidate: VentricularCandidateV1 | null = null;
  let lastAcceptedStepDiagnostics: NonNullable<
    MainWireNormalAdultPassiveEquilibriumPointFailureV1["failedStageEvidence"]
  >["lastAcceptedStepDiagnostics"] = null;
  for (
    let iteration = 0;
    iteration <= solver.maximumNewtonIterationsPerStage;
    iteration += 1
  ) {
    if (
      !(coordinates.junctionRadiusM > solver.minimumJunctionRadiusMExclusive)
    ) {
      return stageFailureV1(
        "junction-radius-below-minimum",
        "junction radius did not remain above the preregistered minimum",
        lastCandidate,
        input,
        iteration,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    let candidate: VentricularCandidateV1;
    try {
      candidate = evaluateVentricularCandidateV1(
        input.leftVentricularCavityVolumeM3,
        input.rightVentricularCavityVolumeM3,
        coordinates,
      );
    } catch (error) {
      return stageFailureV1(
        "candidate-evaluation-failed",
        errorMessageV1(error),
        lastCandidate,
        input,
        iteration,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    lastCandidate = candidate;
    const internal = candidate.internalEquilibriumEvidence;
    const [[h00, h01], [, h11]] = internal.scaledInternalHessian;
    const determinant = h00 * h11 - h01 * h01;
    if (!Number.isFinite(determinant) || determinant === 0) {
      return stageFailureV1(
        "scaled-internal-hessian-singular",
        "scaled internal Hessian determinant was zero or non-finite",
        candidate,
        input,
        iteration,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    if (!internal.strictLocalStabilityPassed) {
      return stageFailureV1(
        "scaled-internal-hessian-not-positive-definite",
        "scaled internal Hessian did not pass the strict eigenvalue floor",
        candidate,
        input,
        iteration,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    if (
      internal.scaledForceInfinityNorm <= solver.scaledForceInfinityTolerance
    ) {
      return stageSuccessV1(input, candidate, iteration, totalBacktracks);
    }
    if (iteration === solver.maximumNewtonIterationsPerStage) {
      return stageFailureV1(
        "newton-iteration-limit",
        "stage reached the preregistered Newton iteration limit",
        candidate,
        input,
        iteration,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    const [g0, g1] = internal.scaledGradient;
    const direction0 = -(h11 * g0 - h01 * g1) / determinant;
    const direction1 = -(-h01 * g0 + h00 * g1) / determinant;
    const directionalDerivative = g0 * direction0 + g1 * direction1;
    if (
      !Number.isFinite(direction0) ||
      !Number.isFinite(direction1) ||
      !Number.isFinite(directionalDerivative) ||
      directionalDerivative >= 0
    ) {
      return stageFailureV1(
        "newton-direction-not-descent",
        "unregularized scaled Newton direction was not finite descent",
        candidate,
        input,
        iteration,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }

    let accepted: VentricularCandidateV1 | null = null;
    let acceptedBacktracks = -1;
    for (
      let backtracks = 0;
      backtracks <= solver.maximumLineSearchBacktracks;
      backtracks += 1
    ) {
      const alpha =
        solver.lineSearchInitialStep *
        solver.lineSearchContraction ** backtracks;
      const trialCoordinates = {
        septalMidwallCapVolumeM3:
          coordinates.septalMidwallCapVolumeM3 +
          solver.coordinateScales.septalMidwallCapVolumeM3 * alpha * direction0,
        junctionRadiusM:
          coordinates.junctionRadiusM +
          solver.coordinateScales.junctionRadiusM * alpha * direction1,
      };
      if (
        !(
          trialCoordinates.junctionRadiusM >
          solver.minimumJunctionRadiusMExclusive
        )
      )
        continue;
      let trial: VentricularCandidateV1;
      try {
        trial = evaluateVentricularCandidateV1(
          input.leftVentricularCavityVolumeM3,
          input.rightVentricularCavityVolumeM3,
          trialCoordinates,
        );
      } catch {
        continue;
      }
      const armijoUpperBound =
        candidate.rawStoredEnergyJ +
        solver.armijoCoefficient *
          alpha *
          solver.energyScaleJ *
          directionalDerivative;
      if (trial.rawStoredEnergyJ <= armijoUpperBound) {
        accepted = trial;
        acceptedBacktracks = backtracks;
        break;
      }
    }
    if (accepted === null || acceptedBacktracks < 0) {
      return stageFailureV1(
        "line-search-failed",
        "no admissible preregistered Armijo candidate was accepted",
        candidate,
        input,
        iteration,
        totalBacktracks + solver.maximumLineSearchBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    totalBacktracks += acceptedBacktracks;
    const acceptedAlpha =
      solver.lineSearchInitialStep *
      solver.lineSearchContraction ** acceptedBacktracks;
    const scaledUpdateInfinityNorm =
      acceptedAlpha * Math.max(Math.abs(direction0), Math.abs(direction1));
    const acceptedStepDiagnostics = {
      acceptedBacktracks,
      scaledUpdateInfinityNorm,
      currentScaledForceInfinityNorm: internal.scaledForceInfinityNorm,
      acceptedScaledForceInfinityNorm:
        accepted.internalEquilibriumEvidence.scaledForceInfinityNorm,
      currentEnergyJ: candidate.rawStoredEnergyJ,
      acceptedEnergyJ: accepted.rawStoredEnergyJ,
      directionalDerivative,
    } as const;
    lastAcceptedStepDiagnostics = acceptedStepDiagnostics;
    const acceptedInternal = accepted.internalEquilibriumEvidence;
    const [[acceptedH00, acceptedH01], [, acceptedH11]] =
      acceptedInternal.scaledInternalHessian;
    const acceptedDeterminant =
      acceptedH00 * acceptedH11 - acceptedH01 * acceptedH01;
    if (!Number.isFinite(acceptedDeterminant) || acceptedDeterminant === 0) {
      return stageFailureV1(
        "scaled-internal-hessian-singular",
        "accepted candidate scaled internal Hessian was singular",
        accepted,
        input,
        iteration + 1,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    if (!acceptedInternal.strictLocalStabilityPassed) {
      return stageFailureV1(
        "scaled-internal-hessian-not-positive-definite",
        "accepted candidate did not pass the strict eigenvalue floor",
        accepted,
        input,
        iteration + 1,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    if (
      acceptedInternal.scaledForceInfinityNorm <=
      solver.scaledForceInfinityTolerance
    ) {
      return stageSuccessV1(input, accepted, iteration + 1, totalBacktracks);
    }
    if (scaledUpdateInfinityNorm <= solver.scaledUpdateStagnationLimit) {
      return stageFailureV1(
        "scaled-update-stagnated",
        `accepted scaled update stagnated before force convergence: ${JSON.stringify(
          acceptedStepDiagnostics,
        )}`,
        accepted,
        input,
        iteration + 1,
        totalBacktracks,
        lastAcceptedStepDiagnostics,
      );
    }
    coordinates = accepted.internalCoordinates;
    lastCandidate = accepted;
  }
  throw new Error("unreachable passive equilibrium Newton state");
}

function evaluateVentricularCandidateV1(
  leftVentricularCavityVolumeM3: number,
  rightVentricularCavityVolumeM3: number,
  internalCoordinates: TriSegCoordinatesV1,
): VentricularCandidateV1 {
  requireFinite(leftVentricularCavityVolumeM3, "LV cavity volume");
  requireFinite(rightVentricularCavityVolumeM3, "RV cavity volume");
  requireFinite(
    internalCoordinates.septalMidwallCapVolumeM3,
    "septal midwall cap volume",
  );
  requireFinite(internalCoordinates.junctionRadiusM, "junction radius");
  const geometry = evaluateTriSegGeometryV1({
    leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3,
    coordinates: internalCoordinates,
    walls:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.wallGeometryParameters,
  });
  const materialByWall = wallRecordV1((wallId) => {
    const material = evaluateEquilibriumOneFiberPassiveV1(
      geometry.walls[wallId].fiberLogStrain,
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled,
    );
    return Object.freeze({
      wallId,
      wallMaterialVolumeM3:
        geometry.walls[wallId].parameters.wallMaterialVolumeM3,
      fiberLogStrain: geometry.walls[wallId].fiberLogStrain,
      equilibriumKirchhoffStressPa: material.equilibriumKirchhoffStressPa,
      dStressDFiberLogStrainPa: material.dStressDFiberLogStrainPa,
      storedEnergyJ:
        material.storedEnergyDensityJPerM3 *
        geometry.walls[wallId].parameters.wallMaterialVolumeM3,
      constitutiveParameterSetId: material.parameterSetId,
      constitutiveParameterIdentityHash: material.parameterIdentityHash,
    });
  });
  const stressByWall = wallRecordV1(
    (wallId) => materialByWall[wallId].equilibriumKirchhoffStressPa,
  );
  const virtualWork = evaluateEnergyConjugateTriSegV1({
    geometry,
    fiberKirchhoffStressPaByWall: stressByWall,
  });
  const rawCoupledGradient = Object.freeze([
    virtualWork.membraneGeneralizedForce.leftVentricularPressurePa,
    virtualWork.membraneGeneralizedForce.rightVentricularPressurePa,
    virtualWork.membraneGeneralizedForce.septalMidwallCapVolumePa,
    virtualWork.membraneGeneralizedForce.junctionRadiusN,
  ] as const);
  const rawCoupledHessian = analyticCoupledHessianV1(
    geometry,
    virtualWork.wallDerivativeByWall,
    materialByWall,
  );
  const solver =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1;
  const internalVolumeScaleM3 =
    solver.coordinateScales.septalMidwallCapVolumeM3;
  const internalRadiusScaleM = solver.coordinateScales.junctionRadiusM;
  const scaledGradient = Object.freeze([
    (rawCoupledGradient[2] * internalVolumeScaleM3) / solver.energyScaleJ,
    (rawCoupledGradient[3] * internalRadiusScaleM) / solver.energyScaleJ,
  ] as const);
  const scaledInternalHessian = freezeMatrix2V1(
    (rawCoupledHessian[2][2] * internalVolumeScaleM3 * internalVolumeScaleM3) /
      solver.energyScaleJ,
    (rawCoupledHessian[2][3] * internalVolumeScaleM3 * internalRadiusScaleM) /
      solver.energyScaleJ,
    (rawCoupledHessian[3][3] * internalRadiusScaleM * internalRadiusScaleM) /
      solver.energyScaleJ,
  );
  const eigenvalues = symmetricMatrix2EigenvaluesV1(scaledInternalHessian);
  const rawStoredEnergyJ =
    materialByWall.LVFW.storedEnergyJ +
    materialByWall.SEP.storedEnergyJ +
    materialByWall.RVFW.storedEnergyJ;
  for (const [label, value] of Object.entries({
    rawStoredEnergyJ,
    leftVentricularPressurePa: rawCoupledGradient[0],
    rightVentricularPressurePa: rawCoupledGradient[1],
    scaledGradient0: scaledGradient[0],
    scaledGradient1: scaledGradient[1],
    minimumScaledInternalHessianEigenvalue: eigenvalues[0],
    maximumScaledInternalHessianEigenvalue: eigenvalues[1],
  }))
    requireFinite(value, label);
  return deepFreezePointValueV1({
    chamberVolumesM3: {
      LV: leftVentricularCavityVolumeM3,
      RV: rightVentricularCavityVolumeM3,
    },
    internalCoordinates: { ...internalCoordinates },
    wallEquilibriumPassiveByWall: materialByWall,
    rawStoredEnergyJ,
    intrinsicPressuresPa: {
      LV: rawCoupledGradient[0],
      RV: rawCoupledGradient[1],
    },
    rawCoupledGradient,
    rawCoupledHessian,
    internalEquilibriumEvidence: {
      scaledGradient,
      scaledForceInfinityNorm: Math.max(
        Math.abs(scaledGradient[0]),
        Math.abs(scaledGradient[1]),
      ),
      scaledInternalHessian,
      scaledInternalHessianEigenvaluesAscending: eigenvalues,
      strictLocalStabilityPassed:
        eigenvalues[0] >
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.minimumScaledInternalHessianEigenvalueExclusive,
      junctionRadiusPassed:
        internalCoordinates.junctionRadiusM >
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.minimumJunctionRadiusMExclusive,
    },
  });
}

function analyticCoupledHessianV1(
  geometry: ReturnType<typeof evaluateTriSegGeometryV1>,
  wallDerivativeByWall: ReturnType<
    typeof evaluateEnergyConjugateTriSegV1
  >["wallDerivativeByWall"],
  materialByWall: TriSegWallRecordV1<MainWireNormalAdultPassiveWallPointV1>,
): MainWirePassiveMatrix4V1 {
  const values = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  const capGradientByWall = {
    LVFW: [-1, 0, 1] as const,
    SEP: [0, 0, 1] as const,
    RVFW: [0, 1, 1] as const,
  };
  for (const wallId of VENTRICULAR_WALL_ORDER) {
    const first = wallDerivativeByWall[wallId];
    const second = evaluateTriSegWallSecondDerivativeV1(geometry.walls[wallId]);
    const capGradient = capGradientByWall[wallId];
    const strainGradient = [
      capGradient[0] * first.dFiberLogStrainDCapVolumePerM3,
      capGradient[1] * first.dFiberLogStrainDCapVolumePerM3,
      capGradient[2] * first.dFiberLogStrainDCapVolumePerM3,
      first.dFiberLogStrainDJunctionRadiusPerM,
    ] as const;
    const wall = materialByWall[wallId];
    for (let row = 0; row < 4; row += 1) {
      for (let column = row; column < 4; column += 1) {
        let strainSecondDerivative: number;
        if (row === 3 && column === 3) {
          strainSecondDerivative = second.d2FiberLogStrainDJunctionRadius2PerM2;
        } else if (column === 3) {
          strainSecondDerivative =
            capGradient[row]! *
            second.d2FiberLogStrainDCapVolumeDJunctionRadiusPerM4;
        } else {
          strainSecondDerivative =
            capGradient[row]! *
            capGradient[column]! *
            second.d2FiberLogStrainDCapVolume2PerM6;
        }
        const contribution =
          wall.wallMaterialVolumeM3 *
          (wall.dStressDFiberLogStrainPa *
            strainGradient[row]! *
            strainGradient[column]! +
            wall.equilibriumKirchhoffStressPa * strainSecondDerivative);
        values[row]![column] += contribution;
        if (row !== column) values[column]![row] += contribution;
      }
    }
  }
  for (const row of values) {
    for (const value of row) requireFinite(value, "raw coupled Hessian entry");
  }
  return freezeMatrix4V1(values);
}

function evaluateAtrialWallPointV1(
  atriumId: NormalAdultAtrialIdV1,
  cavityVolumeM3: number,
): Readonly<{
  wallPoint: MainWireNormalAdultPassiveWallPointV1;
  pressurePa: number;
  pressureVolumeTangentPaPerM3: number;
}> {
  const replay = evaluateNormalAdultAtrialPassivePressureReplayV1(
    atriumId,
    cavityVolumeM3 / 1e-6,
  );
  const material = evaluateMoyer2015AtrialEquibiaxialPassiveV1(
    replay.fiberLogStrain,
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.atrial.compiled,
  );
  const wallMaterialVolumeM3 = replay.wallMaterialVolumeMl * 1e-6;
  const midwallVolumeM3 = cavityVolumeM3 + 0.5 * wallMaterialVolumeM3;
  const pressureVolumeTangentPaPerM3 =
    (wallMaterialVolumeM3 / (3 * midwallVolumeM3 * midwallVolumeM3)) *
    (material.dStressDFiberLogStrainPa / 3 -
      material.equilibriumKirchhoffStressPa);
  requireFinite(
    pressureVolumeTangentPaPerM3,
    `${atriumId} pressure-volume tangent`,
  );
  return deepFreezePointValueV1({
    wallPoint: {
      wallId: atriumId,
      wallMaterialVolumeM3,
      fiberLogStrain: replay.fiberLogStrain,
      equilibriumKirchhoffStressPa: replay.equilibriumKirchhoffStressPa,
      dStressDFiberLogStrainPa: material.dStressDFiberLogStrainPa,
      storedEnergyJ: replay.storedEnergyJ,
      constitutiveParameterSetId: material.parameterSetId,
      constitutiveParameterIdentityHash: material.parameterIdentityHash,
    },
    pressurePa: replay.transmuralPressurePa,
    pressureVolumeTangentPaPerM3,
  });
}

function reducedFourChamberTangentV1(
  candidate: MainWireNormalAdultPassiveEquilibriumCandidateV1,
):
  | MainWireNormalAdultPassiveEquilibratedPointV1["reducedFourChamberPressureVolumeTangentPaPerM3"]
  | null {
  if (!candidate.internalEquilibriumEvidence.strictLocalStabilityPassed) {
    return null;
  }
  if (
    candidate.internalEquilibriumEvidence.scaledForceInfinityNorm >
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V1.scaledForceInfinityTolerance
  ) {
    return null;
  }
  const h = candidate.rawCoupledHessian.values;
  const h00 = h[2][2];
  const h01 = h[2][3];
  const h11 = h[3][3];
  const determinant = h00 * h11 - h01 * h01;
  if (!Number.isFinite(determinant) || determinant === 0) return null;
  const inverse00 = h11 / determinant;
  const inverse01 = -h01 / determinant;
  const inverse11 = h00 / determinant;
  const reduced00 =
    h[0][0] -
    (h[0][2] * (inverse00 * h[2][0] + inverse01 * h[3][0]) +
      h[0][3] * (inverse01 * h[2][0] + inverse11 * h[3][0]));
  const reduced01 =
    h[0][1] -
    (h[0][2] * (inverse00 * h[2][1] + inverse01 * h[3][1]) +
      h[0][3] * (inverse01 * h[2][1] + inverse11 * h[3][1]));
  const reduced11 =
    h[1][1] -
    (h[1][2] * (inverse00 * h[2][1] + inverse01 * h[3][1]) +
      h[1][3] * (inverse01 * h[2][1] + inverse11 * h[3][1]));
  const leftAtrial = evaluateAtrialWallPointV1(
    "LA",
    candidate.chamberVolumesM3.LA,
  );
  const rightAtrial = evaluateAtrialWallPointV1(
    "RA",
    candidate.chamberVolumesM3.RA,
  );
  const values = freezeMatrix4V1([
    [leftAtrial.pressureVolumeTangentPaPerM3, 0, 0, 0],
    [0, reduced00, 0, reduced01],
    [0, 0, rightAtrial.pressureVolumeTangentPaPerM3, 0],
    [0, reduced01, 0, reduced11],
  ]);
  for (const row of values) {
    for (const value of row) {
      if (!Number.isFinite(value)) return null;
    }
  }
  return deepFreezePointValueV1({
    chamberOrder: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_CHAMBER_ORDER_V1,
    values,
    internalCoordinateElimination: "H_zz-H_zq*inverse(H_qq)*H_qz" as const,
  });
}

function validSealedReferenceRootV1(
  root: MainWireNormalAdultPassiveEquilibriumSealedReferenceRootV1,
  provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
): boolean {
  if (
    root === null ||
    typeof root !== "object" ||
    !Object.isFrozen(root) ||
    sealedReferenceRootRegistryV1.get(root) !== root.stageZeroRootSha256 ||
    root.status !== "sealed-reference-root" ||
    root.provenanceHashes.passiveMaterialGeometryBindingSha256 !==
      provenance.passiveMaterialGeometryBindingSha256 ||
    root.provenanceHashes.pointSolverBranchProtocolSha256 !==
      provenance.pointSolverBranchProtocolSha256 ||
    root.provenanceHashes.surfaceVerificationProtocolSha256 !==
      provenance.surfaceVerificationProtocolSha256 ||
    root.stageZeroRootPayload.passiveMaterialGeometryBindingSha256 !==
      provenance.passiveMaterialGeometryBindingSha256 ||
    root.stageZeroRootPayload.pointSolverBranchProtocolSha256 !==
      provenance.pointSolverBranchProtocolSha256
  )
    return false;
  const volumes = root.stageZeroRootPayload.referenceVolumesM3;
  const expected =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  return (
    volumes.LA === expected.LA &&
    volumes.LV === expected.LV &&
    volumes.RA === expected.RA &&
    volumes.RV === expected.RV
  );
}

function stageSuccessV1(
  input: Readonly<{
    stageIndex: number;
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
    initialCoordinates: TriSegCoordinatesV1;
  }>,
  candidate: VentricularCandidateV1,
  newtonIterations: number,
  lineSearchBacktracks: number,
): StageSuccessV1 {
  return deepFreezePointValueV1({
    status: "stage-equilibrated" as const,
    candidate,
    evidence: {
      stageIndex: input.stageIndex,
      leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
      initialCoordinates: { ...input.initialCoordinates },
      terminalCoordinates: { ...candidate.internalCoordinates },
      newtonIterations,
      lineSearchBacktracks,
      terminalRawVentricularStoredEnergyJ: candidate.rawStoredEnergyJ,
      terminalScaledForceInfinityNorm:
        candidate.internalEquilibriumEvidence.scaledForceInfinityNorm,
      terminalScaledInternalHessianEigenvaluesAscending:
        candidate.internalEquilibriumEvidence
          .scaledInternalHessianEigenvaluesAscending,
      strictLocalStabilityPassed: true as const,
    },
  });
}

function pointFailureV1(
  input: Readonly<{
    provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1;
    failurePhase: MainWireNormalAdultPassiveEquilibriumPointFailureV1["failurePhase"];
    failureReason: MainWireNormalAdultPassiveEquilibriumPointFailureReasonV1;
    failureDetail: string;
    targetChamberVolumesM3: MainWireNormalAdultPassiveChamberVolumesM3V1;
    failedStageIndex: number | null;
    completedStages: readonly MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[];
    lastCandidateEvidence: MainWireNormalAdultPassiveEquilibriumPointFailureV1["lastCandidateEvidence"];
    failedStageEvidence: MainWireNormalAdultPassiveEquilibriumPointFailureV1["failedStageEvidence"];
    stageZeroRootSha256: string | null;
  }>,
): MainWireNormalAdultPassiveEquilibriumPointFailureV1 {
  const failure = deepFreezePointValueV1({
    status: "not-equilibrated" as const,
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    failureVersion: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_FAILURE_V1,
    failureReason: input.failureReason,
    failurePhase: input.failurePhase,
    failureDetail: input.failureDetail,
    targetChamberVolumesM3: { ...input.targetChamberVolumesM3 },
    failedStageIndex: input.failedStageIndex,
    completedStages: [...input.completedStages],
    lastCandidateEvidence: input.lastCandidateEvidence,
    failedStageEvidence: input.failedStageEvidence,
    stageZeroRootSha256: input.stageZeroRootSha256,
    provenanceHashes: provenanceHashesV1(input.provenance),
  });
  pointFailureRegistryV1.add(failure);
  return failure;
}

function stageFailureV1(
  reason: MainWireNormalAdultPassiveEquilibriumPointFailureReasonV1,
  detail: string,
  candidate: VentricularCandidateV1 | null,
  input: Readonly<{
    stageIndex: number;
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
    initialCoordinates: TriSegCoordinatesV1;
  }>,
  completedNewtonUpdates: number,
  lineSearchBacktracks: number,
  lastAcceptedStepDiagnostics: NonNullable<
    MainWireNormalAdultPassiveEquilibriumPointFailureV1["failedStageEvidence"]
  >["lastAcceptedStepDiagnostics"] = null,
): StageFailureV1 {
  return deepFreezePointValueV1({
    status: "stage-failed" as const,
    reason,
    detail,
    lastCandidateEvidence:
      candidate === null ? null : compactCandidateEvidenceV1(candidate),
    failedStageEvidence: {
      stageIndex: input.stageIndex,
      leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
      initialCoordinates: { ...input.initialCoordinates },
      lastCoordinates:
        candidate === null ? null : { ...candidate.internalCoordinates },
      completedNewtonUpdates,
      lineSearchBacktracks,
      rejectionCause: reason,
      lastAcceptedStepDiagnostics,
    },
  });
}

function compactCandidateEvidenceV1(
  candidate: VentricularCandidateV1,
): NonNullable<
  MainWireNormalAdultPassiveEquilibriumPointFailureV1["lastCandidateEvidence"]
> {
  return deepFreezePointValueV1({
    internalCoordinates: { ...candidate.internalCoordinates },
    rawVentricularStoredEnergyJ: candidate.rawStoredEnergyJ,
    scaledForceInfinityNorm:
      candidate.internalEquilibriumEvidence.scaledForceInfinityNorm,
    scaledInternalHessianEigenvaluesAscending:
      candidate.internalEquilibriumEvidence
        .scaledInternalHessianEigenvaluesAscending,
  });
}

function solverEvidenceV1(
  lineageKind: "stage-zero-reference-root" | "primary-32-stage-diagonal",
  stages: readonly MainWireNormalAdultPassiveEquilibriumStageEvidenceV1[],
): MainWireNormalAdultPassiveEquilibratedPointV1["solverEvidence"] {
  return deepFreezePointValueV1({
    lineageKind,
    stages: [...stages],
    totalNewtonIterations: stages.reduce(
      (sum, stage) => sum + stage.newtonIterations,
      0,
    ),
    totalLineSearchBacktracks: stages.reduce(
      (sum, stage) => sum + stage.lineSearchBacktracks,
      0,
    ),
  });
}

function pointQualificationScopeV1(
  primary32StageDiagonalLineageEstablished: boolean,
): MainWireNormalAdultPassiveEquilibratedPointCommonV1["qualificationScope"] {
  return Object.freeze({
    pointLocalStableRootEstablished: true as const,
    primary32StageDiagonalLineageEstablished,
    alternatePathAndNineSeedBranchAuditEstablished: false as const,
    continuousBranchEstablished: false as const,
    globalMinimumOrUniquenessEstablished: false as const,
  });
}

function provenanceHashesV1(
  provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
): MainWireNormalAdultPassiveProvenanceHashesV1 {
  return Object.freeze({
    passiveMaterialGeometryBindingSha256:
      provenance.passiveMaterialGeometryBindingSha256,
    pointSolverBranchProtocolSha256: provenance.pointSolverBranchProtocolSha256,
    surfaceVerificationProtocolSha256:
      provenance.surfaceVerificationProtocolSha256,
  });
}

function assertChamberVolumesInsideDeclaredDomainV1(
  volumes: MainWireNormalAdultPassiveChamberVolumesM3V1,
): void {
  for (const chamber of MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_CHAMBER_ORDER_V1) {
    const value = volumes[chamber];
    const bounds =
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VOLUME_BOUNDS_M3_V1[chamber];
    if (
      !Number.isFinite(value) ||
      value < bounds.minimum ||
      value > bounds.maximum
    ) {
      throw new RangeError(
        `${chamber} volume must be finite and within [${bounds.minimum}, ${bounds.maximum}] m3`,
      );
    }
  }
}

function symmetricMatrix2EigenvaluesV1(
  matrix: MainWirePassiveMatrix2V1,
): readonly [number, number] {
  const a = matrix[0][0];
  const b = matrix[0][1];
  const c = matrix[1][1];
  const halfTrace = 0.5 * (a + c);
  const halfSpread = 0.5 * Math.hypot(a - c, 2 * b);
  const determinant = a * c - b * b;
  let lower: number;
  let upper: number;
  if (halfTrace >= 0) {
    upper = halfTrace + halfSpread;
    lower = upper === 0 ? halfTrace - halfSpread : determinant / upper;
  } else {
    lower = halfTrace - halfSpread;
    upper = lower === 0 ? halfTrace + halfSpread : determinant / lower;
  }
  return lower <= upper
    ? Object.freeze([lower, upper])
    : Object.freeze([upper, lower]);
}

function freezeMatrix2V1(
  value00: number,
  value01: number,
  value11: number,
): MainWirePassiveMatrix2V1 {
  return Object.freeze([
    Object.freeze([value00, value01] as const),
    Object.freeze([value01, value11] as const),
  ] as const);
}

function freezeMatrix4V1(
  values: readonly (readonly number[])[],
): MainWirePassiveMatrix4V1 {
  if (values.length !== 4 || values.some((row) => row.length !== 4)) {
    throw new RangeError(
      "four-by-four matrix requires exactly sixteen entries",
    );
  }
  return Object.freeze(
    values.map((row) => Object.freeze([row[0]!, row[1]!, row[2]!, row[3]!])),
  ) as MainWirePassiveMatrix4V1;
}

function wallRecordV1<T>(
  build: (wallId: TriSegWallIdV1) => T,
): TriSegWallRecordV1<T> {
  return Object.freeze({
    LVFW: build("LVFW"),
    SEP: build("SEP"),
    RVFW: build("RVFW"),
  });
}

function freezeVolumesV1(
  volumes: MainWireNormalAdultPassiveChamberVolumesM3V1,
): MainWireNormalAdultPassiveChamberVolumesM3V1 {
  return Object.freeze({
    LA: volumes.LA,
    LV: volumes.LV,
    RA: volumes.RA,
    RV: volumes.RV,
  });
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function deepFreezePointValueV1<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezePointValueV1(child);
    }
    Object.freeze(value);
  }
  return value;
}
