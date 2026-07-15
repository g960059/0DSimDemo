import {
  diagnoseScaledJacobian2x2V1,
  solveScaledDensePartialPivotLuV1,
  solveScaledDampedNewtonV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDampedNewtonFailureReasonV1,
  type ScaledJacobian2x2DiagnosticsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import { deriveOdeResidualScalePerSec } from
  "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  type AtrialOneFiberGeometryEvaluationV1,
  type AtrialOneFiberPressureEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import {
  type SignedFlowMomentumOutputV1,
  type ValveMomentumOutputV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import { evaluateFourChamberClosedLoopSameTimeLevelV1 } from
  "@/engine/myocardium/fourChamberV1/hydromechanics/closedLoopSameTimeLevelV1";
import {
  evaluateEquilibriumPassiveEnergyV1,
  type EquilibriumPassiveEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  stepOneStateAlphaVSlsBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";
import {
  type CommonPericardiumOutputV1,
} from "@/engine/myocardium/fourChamberV1/pericardium/commonPericardiumV1";
import {
  evaluatePhaseB0BackwardEulerVolumeResidualV1,
  evaluatePhaseB0VolumeRatesV1,
  type PhaseB0BackwardEulerVolumeResidualV1,
  type PhaseB0VolumeRateEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/incidenceLedgerV1";
import { evaluatePhaseB0SmoothActiveStressDoubleV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/smoothActiveStressDoubleV1";
import type { PhaseB0SyntheticHydromechanicsCaseV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import { PHASE_B0_MONOLITHIC_BE_NUMERICAL_POLICY_V1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/numericalPolicyV1";
import {
  auditPhaseB0AlgorithmicJacobianDirectionV1,
  evaluatePhaseB0AlgorithmicJacobianV1,
  type PhaseB0AlgorithmicJacobianV1,
  type PhaseB0JacobianDirectionalAuditV1,
} from
  "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import {
  PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1,
  PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1,
  evaluateWholeHeartBackwardEulerStepEnergyAuditV1,
  evaluateWholeHeartEndpointStoredEnergyV1,
  evaluateWholeHeartStagePowerV1,
  evaluatePublishedTaylorTriSegStagePowerAuditV1,
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
  type WholeHeartBackwardEulerStepEnergyAuditV1,
  type WholeHeartEndpointStoredEnergyBreakdownV1,
  type WholeHeartStagePowerBreakdownV1,
  type PublishedTaylorTriSegStagePowerAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/wholeHeartEnergyLedgerV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type AlgebraicFlowId,
  type BloodCompartmentId,
  type FourChamberFlowId,
  type FourChamberWallId,
  type InertialFlowId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  type PublishedTriSegGeometryV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  type PublishedTriSegTaylorOracle2009V1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import {
  evaluatePeripheralResistanceV1,
  type LinearVascularComplianceOutputV1,
} from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B0_MONOLITHIC_HYDROMECHANICS_BE_V1_ID =
  "phase-b0-four-chamber-monolithic-hydromechanics-backward-euler-v1" as const;
export const PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID =
  "phase-b0-hydromechanics-same-time-level-evaluation-v1" as const;

export { PHASE_B0_MONOLITHIC_BE_NUMERICAL_POLICY_V1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/numericalPolicyV1";

export type PhaseB0SlsModeV1 = "on" | "off";

type PhaseB0HydromechanicsStateBaseV1 = Readonly<{
  timeSec: number;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
  triSegCoordinates: Readonly<{
    V_m_S: number;
    y_m: number;
  }>;
}>;

export type PhaseB0HydromechanicsStateSlsOnV1 = PhaseB0HydromechanicsStateBaseV1 & Readonly<{
  slsMode: "on";
  slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>>;
}>;

export type PhaseB0HydromechanicsStateSlsOffV1 = PhaseB0HydromechanicsStateBaseV1 & Readonly<{
  slsMode: "off";
}>;

export type PhaseB0HydromechanicsStateV1 =
  | PhaseB0HydromechanicsStateSlsOnV1
  | PhaseB0HydromechanicsStateSlsOffV1;

export type PhaseB0WallMechanicsEvaluationV1 = Readonly<{
  wallId: FourChamberWallId;
  fiberLogStrain: number;
  wallReferenceMaterialVolumeM3: number;
  equilibriumPassive: EquilibriumPassiveEvaluationV1;
  activeKirchhoffStressPa: number;
  slsOverstressPa: number;
  slsStoredEnergyJ: number;
  slsPhysicalDissipationW: number;
  totalKirchhoffStressPa: number;
  totalTangentAtFixedAlphaPa: number;
}>;

export type PhaseB0AtrialMechanicsEvaluationV1 = Readonly<{
  geometry: AtrialOneFiberGeometryEvaluationV1;
  pressure: AtrialOneFiberPressureEvaluationV1;
  wall: PhaseB0WallMechanicsEvaluationV1;
}>;

export type PhaseB0HydromechanicsEvaluationV1 = Readonly<{
  evaluationId: typeof PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID;
  state: PhaseB0HydromechanicsStateV1;
  activeStressTimeDerivativePaPerSecByWall: Readonly<Record<FourChamberWallId, number>>;
  wallMechanics: Readonly<Record<FourChamberWallId, PhaseB0WallMechanicsEvaluationV1>>;
  atria: Readonly<Record<"LA" | "RA", PhaseB0AtrialMechanicsEvaluationV1>>;
  triSegGeometry: PublishedTriSegGeometryV1;
  triSegOracle: PublishedTriSegTaylorOracle2009V1;
  pericardium: CommonPericardiumOutputV1;
  chamberTransmuralPressurePa: Readonly<Record<"LA" | "LV" | "RA" | "RV", number>>;
  chamberAbsolutePressurePa: Readonly<Record<"LA" | "LV" | "RA" | "RV", number>>;
  vascular: Readonly<Record<"SA" | "SV" | "PA" | "PV", LinearVascularComplianceOutputV1>>;
  compartmentAbsolutePressurePa: Readonly<Record<BloodCompartmentId, number>>;
  algebraicFlowsM3PerSec: Readonly<Record<AlgebraicFlowId, number>>;
  allFlowsM3PerSec: Readonly<Record<FourChamberFlowId, number>>;
  volumeRates: PhaseB0VolumeRateEvaluationV1;
  inertialMomentum: Readonly<Record<
    InertialFlowId,
    SignedFlowMomentumOutputV1 | ValveMomentumOutputV1
  >>;
  endpointStoredEnergy: WholeHeartEndpointStoredEnergyBreakdownV1;
  projectionApplied: false;
  flowClampApplied: false;
  fallbackApplied: false;
}>;

export type PhaseB0MonolithicResidualEvaluationV1 = Readonly<{
  residual: readonly number[];
  volumeResidual: PhaseB0BackwardEulerVolumeResidualV1;
  momentumResidualPaByFlow: Readonly<Record<InertialFlowId, number>>;
  slsStateResidualPerSecByWall: Readonly<Record<FourChamberWallId, number>> | null;
  triSegResidualNPerM: Readonly<{ axial: number; radial: number }>;
  nextState: PhaseB0HydromechanicsStateV1;
  nextEvaluation: PhaseB0HydromechanicsEvaluationV1;
}>;

export type PhaseB0DifferentiatedStageKinematicsV1 = Readonly<{
  method: "differentiate-TriSeg-constraint-at-same-time-level";
  directionalDerivativeStepSec: number;
  volumeRateM3PerSecByCompartment: Readonly<Record<BloodCompartmentId, number>>;
  slsAlphaRatePerSecByWall: Readonly<Record<FourChamberWallId, number>> | null;
  triSegCoordinateRate: Readonly<{
    septalMidwallCapVolumeM3PerSec: number;
    junctionRadiusMPerSec: number;
  }>;
  fiberLogStrainRatePerSecByWall: Readonly<Record<FourChamberWallId, number>>;
  scaledTriSegJacobianDiagnostics: ScaledJacobian2x2DiagnosticsV1;
  differentiatedConstraintResidualNPerMSec: Readonly<{
    axial: number;
    radial: number;
    infinityNorm: number;
  }>;
  laggedFiniteDifferenceUsed: false;
}>;

export type PhaseB0MonolithicResidualJacobianAuditV1 = Readonly<{
  auditId: "phase-b0-monolithic-residual-jacobian-directional-audit-v1";
  slsMode: PhaseB0SlsModeV1;
  unknownCount: 21 | 16;
  jacobian: PhaseB0AlgorithmicJacobianV1;
  directionalAudit: PhaseB0JacobianDirectionalAuditV1;
  relativeTolerance: number;
  accepted: boolean;
  hiddenJacobianFallbackUsed: false;
}>;

export type PhaseB0MonolithicResidualJacobianDirectionIdV1 =
  | "mixed"
  | "blood-volumes"
  | "inertial-flows"
  | "sls-states"
  | "triseg-coordinates";

export type PhaseB0MonolithicResidualJacobianAuditSuiteV1 = Readonly<{
  auditId: "phase-b0-monolithic-residual-jacobian-multidirection-suite-v1";
  slsMode: PhaseB0SlsModeV1;
  unknownCount: 21 | 16;
  constructionScaledStep: number;
  independentScaledStep: number;
  jacobian: PhaseB0AlgorithmicJacobianV1;
  directions: readonly Readonly<{
    directionId: PhaseB0MonolithicResidualJacobianDirectionIdV1;
    audit: PhaseB0JacobianDirectionalAuditV1;
  }>[];
  maximumRelativeTwoNormDifference: number;
  maximumAbsoluteScaledDifference: number;
  maximumAbsoluteScaledDifferenceUse:
    "diagnostic-only-because-a-universal-absolute-cutoff-is-not-scale-invariant";
  relativeTolerance: number;
  accepted: boolean;
  hiddenJacobianFallbackUsed: false;
}>;

export type PhaseB0DifferentiatedKinematicsHalvingAuditV1 = Readonly<{
  auditId: "phase-b0-differentiated-kinematics-step-halving-audit-v1";
  coarse: PhaseB0DifferentiatedStageKinematicsV1;
  fine: PhaseB0DifferentiatedStageKinematicsV1;
  stepHalvingFactor: 2;
  maximumNormalizedRateDifference: number;
  normalizationRateScalesPerSec: Readonly<{
    septalMidwallCapVolumeM3: number;
    junctionRadiusM: number;
    fiberLogStrain: number;
  }>;
  relativeTolerance: number;
  accepted: boolean;
}>;

export type PhaseB0SlsBackwardEulerAuditV1 = Readonly<{
  mode: PhaseB0SlsModeV1;
  alphaMismatchByWall: Readonly<Record<FourChamberWallId, number>> | null;
  maximumAbsoluteAlphaMismatch: number;
  maximumAbsoluteDiscretePassivityIdentityResidualJ: number;
  maximumAbsoluteComponentOraclePassivityIdentityResidualJ: number;
  signedAllWallDiscretePassivityIdentityResidualJ: number;
  allWallDiscretePassivityNormalizationDenominatorJ: number;
  allWallDiscretePassivityIdentityRho: number;
}>;

export type PhaseB0MonolithicBackwardEulerStepSuccessV1 = Readonly<{
  converged: true;
  solverId: typeof PHASE_B0_MONOLITHIC_HYDROMECHANICS_BE_V1_ID;
  unknownCount: 21 | 16;
  previousState: PhaseB0HydromechanicsStateV1;
  nextState: PhaseB0HydromechanicsStateV1;
  previousEvaluation: PhaseB0HydromechanicsEvaluationV1;
  nextEvaluation: PhaseB0HydromechanicsEvaluationV1;
  residualEvaluation: PhaseB0MonolithicResidualEvaluationV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  totalBloodVolumeReferenceM3: number;
  totalBloodVolumeResidualM3: number;
  slsAudit: PhaseB0SlsBackwardEulerAuditV1;
  differentiatedStageKinematics: PhaseB0DifferentiatedStageKinematicsV1;
  differentiatedKinematicsHalvingAudit: PhaseB0DifferentiatedKinematicsHalvingAuditV1;
  triSegStagePowerAudit: PublishedTaylorTriSegStagePowerAuditV1;
  stagePower: WholeHeartStagePowerBreakdownV1;
  energyAudit: WholeHeartBackwardEulerStepEnergyAuditV1;
  postStepBloodVolumeProjectionApplied: false;
  flowClampApplied: false;
  fallbackApplied: false;
  previousTriSegRootUse: "initial-guess-only";
  testOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB0MonolithicBackwardEulerStepFailureV1 = Readonly<{
  converged: false;
  solverId: typeof PHASE_B0_MONOLITHIC_HYDROMECHANICS_BE_V1_ID;
  unknownCount: 21 | 16;
  reason: ScaledDampedNewtonFailureReasonV1 | "final-evaluation-failed";
  message: string;
  rollbackState: PhaseB0HydromechanicsStateV1;
  lastAcceptedDiagnosticState: PhaseB0HydromechanicsStateV1 | null;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  postStepBloodVolumeProjectionApplied: false;
  flowClampApplied: false;
  fallbackApplied: false;
  testOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB0MonolithicBackwardEulerStepResultV1 =
  | PhaseB0MonolithicBackwardEulerStepSuccessV1
  | PhaseB0MonolithicBackwardEulerStepFailureV1;

export type PhaseB0HydromechanicsStepFunctionV1 = (
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  dtSec: number,
) => PhaseB0MonolithicBackwardEulerStepResultV1;

export type PhaseB0DeterministicSubstepAdvanceResultV1 =
  | Readonly<{
    advanced: true;
    requestedDtSec: number;
    acceptedSubstepFactor: 1 | 2 | 4 | 8;
    acceptedSubstepDtSec: number;
    steps: readonly PhaseB0MonolithicBackwardEulerStepSuccessV1[];
    nextState: PhaseB0HydromechanicsStateV1;
    rejectedAttempts: readonly Readonly<{
      substepFactor: 1 | 2 | 4 | 8;
      failedSubstepIndex: number;
      failure: PhaseB0MonolithicBackwardEulerStepFailureV1;
    }>[];
    rollbackBetweenAttempts: true;
    projectionApplied: false;
    flowClampApplied: false;
    fallbackApplied: false;
  }>
  | Readonly<{
    advanced: false;
    requestedDtSec: number;
    rollbackState: PhaseB0HydromechanicsStateV1;
    rejectedAttempts: readonly Readonly<{
      substepFactor: 1 | 2 | 4 | 8;
      failedSubstepIndex: number;
      failure: PhaseB0MonolithicBackwardEulerStepFailureV1;
    }>[];
    reason: "all-deterministic-substep-attempts-failed";
    rollbackBetweenAttempts: true;
    projectionApplied: false;
    flowClampApplied: false;
    fallbackApplied: false;
  }>;

export function createPhaseB0HydromechanicsInitialStateV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  slsMode: PhaseB0SlsModeV1,
): PhaseB0HydromechanicsStateV1 {
  const base = {
    timeSec: fixture.initialState.timeSec,
    bloodVolumesM3: freezeRecord(fixture.initialState.bloodVolumesM3, BLOOD_COMPARTMENT_IDS),
    inertialFlowsM3PerSec: freezeRecord(
      fixture.initialState.inertialFlowsM3PerSec,
      INERTIAL_FLOW_IDS,
    ),
    triSegCoordinates: Object.freeze({ ...fixture.initialState.triSegCoordinates }),
  };
  return slsMode === "on"
    ? Object.freeze({
      ...base,
      slsMode: "on" as const,
      slsAlphaVByWall: freezeRecord(fixture.initialState.slsAlphaVByWall, WALL_IDS),
    })
    : Object.freeze({ ...base, slsMode: "off" as const });
}

export function evaluatePhaseB0HydromechanicsStateV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  state: PhaseB0HydromechanicsStateV1,
): PhaseB0HydromechanicsEvaluationV1 {
  validateFixtureBoundary(fixture);
  validateState(state);
  const active = evaluatePhaseB0SmoothActiveStressDoubleV1(
    state.timeSec,
    fixture.activeStressParameters,
  );
  const shared = evaluateFourChamberClosedLoopSameTimeLevelV1({
    state,
    atrialGeometryPriorByChamber: fixture.atrialGeometryPriorByChamber,
    triSegWalls: fixture.triSegReference.walls,
    vascularComplianceParametersByCompartment:
      fixture.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      fixture.peripheralResistancePaSecPerM3ByFlow,
    valveLossParametersByFlow: fixture.valveLossParametersByFlow,
    inletLossParametersByFlow: fixture.inletLossParametersByFlow,
    pericardiumParameters: fixture.pericardiumParameters,
    intrathoracicPressurePa: fixture.intrathoracicPressurePa,
    evaluateWall: ({
      wallId,
      fiberLogStrain,
      wallReferenceMaterialVolumeM3,
    }) => {
      const material = fixture.passiveSlsMaterialByWall[wallId];
      const equilibriumPassive = evaluateEquilibriumPassiveEnergyV1(
        fiberLogStrain,
        material.compiledPassive,
      );
      const alphaV = state.slsMode === "on"
        ? state.slsAlphaVByWall[wallId]
        : null;
      const slsOverstressPa = alphaV === null
        ? 0
        : material.compiledSls.EVPa * (fiberLogStrain - alphaV);
      const slsStoredEnergyJ = alphaV === null
        ? 0
        : wallReferenceMaterialVolumeM3 * slsOverstressPa * slsOverstressPa
          / (2 * material.compiledSls.EVPa);
      const slsPhysicalDissipationW = alphaV === null
        ? 0
        : wallReferenceMaterialVolumeM3 * slsOverstressPa * slsOverstressPa
          / (material.compiledSls.EVPa * material.compiledSls.tauSec);
      const activeKirchhoffStressPa =
        active.walls[wallId].scalarKirchhoffFiberStressPa;
      const totalKirchhoffStressPa = equilibriumPassive.equilibriumKirchhoffStressPa
        + slsOverstressPa
        + activeKirchhoffStressPa;
      const totalTangentAtFixedAlphaPa =
        equilibriumPassive.dStressDFiberLogStrainPa
        + (alphaV === null ? 0 : material.compiledSls.EVPa);
      return Object.freeze({
        equilibriumPassive,
        activeKirchhoffStressPa,
        activeStressTimeDerivativePaPerSec:
          active.walls[wallId]
            .scalarKirchhoffFiberStressTimeDerivativePaPerSec,
        slsOverstressPa,
        slsStoredEnergyJ,
        slsPhysicalDissipationW,
        totalKirchhoffStressPa: requireFinite(
          totalKirchhoffStressPa,
          `${wallId}.totalStress`,
        ),
        totalTangentAtFixedInternalStatePa: requirePositiveFinite(
          totalTangentAtFixedAlphaPa,
          `${wallId}.totalTangent`,
        ),
      });
    },
  });
  const wallMechanics = wallRecord((wallId) => {
    const wall = shared.wallMechanics[wallId];
    return Object.freeze({
      wallId,
      fiberLogStrain: wall.fiberLogStrain,
      wallReferenceMaterialVolumeM3: wall.wallReferenceMaterialVolumeM3,
      equilibriumPassive: wall.equilibriumPassive,
      activeKirchhoffStressPa: wall.activeKirchhoffStressPa,
      slsOverstressPa: wall.slsOverstressPa,
      slsStoredEnergyJ: wall.slsStoredEnergyJ,
      slsPhysicalDissipationW: wall.slsPhysicalDissipationW,
      totalKirchhoffStressPa: wall.totalKirchhoffStressPa,
      totalTangentAtFixedAlphaPa:
        wall.totalTangentAtFixedInternalStatePa,
    });
  });
  const atria = Object.freeze({
    LA: Object.freeze({
      geometry: shared.atria.LA.geometry,
      pressure: shared.atria.LA.pressure,
      wall: wallMechanics.LA,
    }),
    RA: Object.freeze({
      geometry: shared.atria.RA.geometry,
      pressure: shared.atria.RA.pressure,
      wall: wallMechanics.RA,
    }),
  });
  const volumeRates = evaluatePhaseB0VolumeRatesV1(shared.allFlowsM3PerSec);
  const endpointStoredEnergy = evaluateWholeHeartEndpointStoredEnergyV1({
    vascularByCompartmentJ: {
      SA: shared.vascular.SA.elasticEnergyJ,
      SV: shared.vascular.SV.elasticEnergyJ,
      PA: shared.vascular.PA.elasticEnergyJ,
      PV: shared.vascular.PV.elasticEnergyJ,
    },
    pericardialJ: shared.pericardium.storedEnergyJ,
    equilibriumPassiveByWallJ: wallRecord((wallId) =>
      wallMechanics[wallId].wallReferenceMaterialVolumeM3
        * wallMechanics[wallId]
          .equilibriumPassive.storedEnergyDensityJPerM3),
    sls: state.slsMode === "on"
      ? {
        mode: "on",
        slsByWallJ: wallRecord((wallId) =>
          wallMechanics[wallId].slsStoredEnergyJ),
      }
      : { mode: "off", slsByWallJ: {} },
    inertialByEdgeJ: inertialRecord((flowId) =>
      shared.inertialMomentum[flowId].kineticEnergyJ),
  });

  return Object.freeze({
    evaluationId: PHASE_B0_HYDROMECHANICS_SAME_TIME_LEVEL_EVALUATION_V1_ID,
    state,
    activeStressTimeDerivativePaPerSecByWall:
      shared.activeStressTimeDerivativePaPerSecByWall,
    wallMechanics,
    atria,
    triSegGeometry: shared.triSegGeometry,
    triSegOracle: shared.triSegOracle,
    pericardium: shared.pericardium,
    chamberTransmuralPressurePa: shared.chamberTransmuralPressurePa,
    chamberAbsolutePressurePa: shared.chamberAbsolutePressurePa,
    vascular: shared.vascular,
    compartmentAbsolutePressurePa: shared.compartmentAbsolutePressurePa,
    algebraicFlowsM3PerSec: shared.algebraicFlowsM3PerSec,
    allFlowsM3PerSec: shared.allFlowsM3PerSec,
    volumeRates,
    inertialMomentum: shared.inertialMomentum,
    endpointStoredEnergy,
    projectionApplied: false,
    flowClampApplied: false,
    fallbackApplied: false,
  });
}

/**
 * Reconstructs algebraic-coordinate and fiber-strain rates from the
 * differentiated TriSeg constraints at the accepted same-time-level state.
 * This is the Section 14.5 stage-power path; it does not use a lagged
 * endpoint strain difference.
 */
export function reconstructPhaseB0DifferentiatedStageKinematicsV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  state: PhaseB0HydromechanicsStateV1,
  evaluation: PhaseB0HydromechanicsEvaluationV1,
  directionalDerivativeStepSec: number =
    fixture.numericalPolicy.differentiatedConstraintDirectionalStepSec,
): PhaseB0DifferentiatedStageKinematicsV1 {
  if (evaluation.state !== state) {
    throw new Error("Differentiated stage kinematics requires the evaluation of the same state");
  }
  requirePositiveFinite(directionalDerivativeStepSec, "directionalDerivativeStepSec");
  if (state.timeSec <= directionalDerivativeStepSec) {
    throw new Error("Differentiated stage audit requires timeSec greater than its symmetric step");
  }
  const registry = fixture.newtonScaleRegistry;
  const coordinateScales = [
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  ] as const;
  const residualScales = [
    registry.residualScales.publishedTriSegEquilibriumNPerM,
    registry.residualScales.publishedTriSegEquilibriumNPerM,
  ] as const;
  const lowerBounds = [
    null,
    fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
  ] as const;
  const coordinates = [state.triSegCoordinates.V_m_S, state.triSegCoordinates.y_m] as const;
  const equilibriumResidualAtCoordinates = (values: readonly number[]) => {
    const trial = replaceStateKinematics(state, {
      timeSec: state.timeSec,
      volumes: state.bloodVolumesM3,
      alphaV: state.slsMode === "on" ? state.slsAlphaVByWall : null,
      V_m_S: values[0],
      y_m: values[1],
    });
    const trialEvaluation = evaluatePhaseB0HydromechanicsStateV1(fixture, trial);
    return [
      trialEvaluation.triSegOracle.equilibriumResidual.axialNPerM,
      trialEvaluation.triSegOracle.equilibriumResidual.radialNPerM,
    ];
  };
  const coordinateJacobian = evaluatePhaseB0AlgorithmicJacobianV1(
    equilibriumResidualAtCoordinates,
    coordinates,
    {
      unknownScales: coordinateScales,
      residualScales,
      lowerBounds,
      scaledStep: fixture.numericalPolicy.algorithmicJacobianScaledStep,
    },
  );
  const scaledJacobianFlat = coordinateJacobian.scaledJacobian.flat();
  const scaledTriSegJacobianDiagnostics = diagnoseScaledJacobian2x2V1(scaledJacobianFlat);
  if (scaledTriSegJacobianDiagnostics.numericallySingular) {
    throw new Error("Differentiated TriSeg constraint Jacobian is numerically singular");
  }

  const volumeRateM3PerSecByCompartment = evaluation.volumeRates.volumeRatesM3PerSec;
  const slsAlphaRatePerSecByWall = state.slsMode === "on"
    ? wallRecord((wallId) => (
      evaluation.wallMechanics[wallId].fiberLogStrain - state.slsAlphaVByWall[wallId]
    ) / fixture.passiveSlsMaterialByWall[wallId].compiledSls.tauSec)
    : null;
  const differentialTrial = (sign: -1 | 1, includeCoordinateRate?: readonly [number, number]) => {
    const h = sign * directionalDerivativeStepSec;
    const volumes = Object.freeze(Object.fromEntries(BLOOD_COMPARTMENT_IDS.map((id) => [
      id,
      state.bloodVolumesM3[id] + h * volumeRateM3PerSecByCompartment[id],
    ]))) as Readonly<Record<BloodCompartmentId, number>>;
    const alphaV = state.slsMode === "on" && slsAlphaRatePerSecByWall !== null
      ? wallRecord((wallId) => state.slsAlphaVByWall[wallId] + h * slsAlphaRatePerSecByWall[wallId])
      : null;
    return replaceStateKinematics(state, {
      timeSec: state.timeSec + h,
      volumes,
      alphaV,
      V_m_S: state.triSegCoordinates.V_m_S
        + h * (includeCoordinateRate?.[0] ?? 0),
      y_m: state.triSegCoordinates.y_m
        + h * (includeCoordinateRate?.[1] ?? 0),
    });
  };
  const fixedCoordinateMinus = evaluatePhaseB0HydromechanicsStateV1(
    fixture,
    differentialTrial(-1),
  );
  const fixedCoordinatePlus = evaluatePhaseB0HydromechanicsStateV1(
    fixture,
    differentialTrial(1),
  );
  const residualDirectionalDerivative = [
    (
      fixedCoordinatePlus.triSegOracle.equilibriumResidual.axialNPerM
      - fixedCoordinateMinus.triSegOracle.equilibriumResidual.axialNPerM
    ) / (2 * directionalDerivativeStepSec),
    (
      fixedCoordinatePlus.triSegOracle.equilibriumResidual.radialNPerM
      - fixedCoordinateMinus.triSegOracle.equilibriumResidual.radialNPerM
    ) / (2 * directionalDerivativeStepSec),
  ];
  const scaledRightHandSide = residualDirectionalDerivative.map((value, row) =>
    -value / residualScales[row]);
  const coordinateRateSolve = solveScaledDensePartialPivotLuV1(
    scaledJacobianFlat,
    scaledRightHandSide,
    fixture.numericalPolicy.relativePivotTolerance,
  );
  if (coordinateRateSolve.success === false) {
    throw new Error(`Differentiated TriSeg coordinate-rate solve failed: ${coordinateRateSolve.message}`);
  }
  const coordinateRate = [
    coordinateRateSolve.solution[0] * coordinateScales[0],
    coordinateRateSolve.solution[1] * coordinateScales[1],
  ] as const;
  const fullMinus = evaluatePhaseB0HydromechanicsStateV1(
    fixture,
    differentialTrial(-1, coordinateRate),
  );
  const fullPlus = evaluatePhaseB0HydromechanicsStateV1(
    fixture,
    differentialTrial(1, coordinateRate),
  );
  const fiberLogStrainRatePerSecByWall = wallRecord((wallId) => (
    fullPlus.wallMechanics[wallId].fiberLogStrain
    - fullMinus.wallMechanics[wallId].fiberLogStrain
  ) / (2 * directionalDerivativeStepSec));
  const differentiatedConstraintResidual = [
    coordinateJacobian.rawJacobian[0][0] * coordinateRate[0]
      + coordinateJacobian.rawJacobian[0][1] * coordinateRate[1]
      + residualDirectionalDerivative[0],
    coordinateJacobian.rawJacobian[1][0] * coordinateRate[0]
      + coordinateJacobian.rawJacobian[1][1] * coordinateRate[1]
      + residualDirectionalDerivative[1],
  ] as const;
  return Object.freeze({
    method: "differentiate-TriSeg-constraint-at-same-time-level",
    directionalDerivativeStepSec,
    volumeRateM3PerSecByCompartment,
    slsAlphaRatePerSecByWall,
    triSegCoordinateRate: Object.freeze({
      septalMidwallCapVolumeM3PerSec: coordinateRate[0],
      junctionRadiusMPerSec: coordinateRate[1],
    }),
    fiberLogStrainRatePerSecByWall,
    scaledTriSegJacobianDiagnostics,
    differentiatedConstraintResidualNPerMSec: Object.freeze({
      axial: differentiatedConstraintResidual[0],
      radial: differentiatedConstraintResidual[1],
      infinityNorm: Math.max(
        Math.abs(differentiatedConstraintResidual[0]),
        Math.abs(differentiatedConstraintResidual[1]),
      ),
    }),
    laggedFiniteDifferenceUsed: false,
  });
}

export function auditPhaseB0DifferentiatedKinematicsStepHalvingV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  state: PhaseB0HydromechanicsStateV1,
  evaluation: PhaseB0HydromechanicsEvaluationV1,
  coarse = reconstructPhaseB0DifferentiatedStageKinematicsV1(
    fixture,
    state,
    evaluation,
  ),
): PhaseB0DifferentiatedKinematicsHalvingAuditV1 {
  const factor = fixture.numericalPolicy.differentiatedConstraintStepHalvingFactor;
  const fine = reconstructPhaseB0DifferentiatedStageKinematicsV1(
    fixture,
    state,
    evaluation,
    coarse.directionalDerivativeStepSec / factor,
  );
  const rateScales = Object.freeze({
    septalMidwallCapVolumeM3:
      fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3
      / fixture.activeStressParameters.periodSec,
    junctionRadiusM: fixture.newtonScaleRegistry.unknownScales.junctionRadiusM
      / fixture.activeStressParameters.periodSec,
    fiberLogStrain: fixture.newtonScaleRegistry.unknownScales.fiberLogStrain
      / fixture.activeStressParameters.periodSec,
  });
  const pairedRates: readonly (readonly [number, number, number])[] = [
    [
      coarse.triSegCoordinateRate.septalMidwallCapVolumeM3PerSec,
      fine.triSegCoordinateRate.septalMidwallCapVolumeM3PerSec,
      rateScales.septalMidwallCapVolumeM3,
    ],
    [
      coarse.triSegCoordinateRate.junctionRadiusMPerSec,
      fine.triSegCoordinateRate.junctionRadiusMPerSec,
      rateScales.junctionRadiusM,
    ],
    ...WALL_IDS.map((wallId) => [
      coarse.fiberLogStrainRatePerSecByWall[wallId],
      fine.fiberLogStrainRatePerSecByWall[wallId],
      rateScales.fiberLogStrain,
    ] as const),
  ];
  const maximumNormalizedRateDifference = Math.max(...pairedRates.map(
    ([left, right, scale]) => Math.abs(left - right)
      / (scale + Math.max(Math.abs(left), Math.abs(right))),
  ));
  const relativeTolerance =
    fixture.numericalPolicy.differentiatedKinematicsHalvingRelativeTolerance;
  return Object.freeze({
    auditId: "phase-b0-differentiated-kinematics-step-halving-audit-v1",
    coarse,
    fine,
    stepHalvingFactor: factor,
    maximumNormalizedRateDifference,
    normalizationRateScalesPerSec: rateScales,
    relativeTolerance,
    accepted: maximumNormalizedRateDifference < relativeTolerance,
  });
}

export function auditPhaseB0MonolithicResidualJacobianV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  nextState: PhaseB0HydromechanicsStateV1,
  dtSec: number,
  scaledDirection?: readonly number[],
): PhaseB0MonolithicResidualJacobianAuditV1 {
  validateFixtureBoundary(fixture);
  validateState(previousState);
  validateState(nextState);
  requirePositiveFinite(dtSec, "dtSec");
  if (previousState.slsMode !== nextState.slsMode) {
    throw new Error("Jacobian audit requires an unchanged SLS topology");
  }
  const expectedNextTimeSec = previousState.timeSec + dtSec;
  if (Math.abs(nextState.timeSec - expectedNextTimeSec) > 64 * Number.EPSILON
    * Math.max(1, Math.abs(expectedNextTimeSec))) {
    throw new Error("Jacobian audit next-state time does not match the BE step");
  }
  const layout = buildUnknownLayout(fixture, nextState.slsMode);
  const unknowns = encodeState(nextState);
  const residualOnly = (trialUnknowns: readonly number[]) => evaluateMonolithicResidual(
    fixture,
    previousState,
    decodeState(trialUnknowns, nextState.timeSec, nextState.slsMode),
    dtSec,
  ).residual;
  const options = {
    unknownScales: layout.unknownScales,
    residualScales: layout.residualScales,
    lowerBounds: layout.lowerBounds,
    scaledStep: fixture.numericalPolicy.algorithmicJacobianScaledStep,
  } as const;
  const jacobian = evaluatePhaseB0AlgorithmicJacobianV1(
    residualOnly,
    unknowns,
    options,
  );
  const mixedCoefficients = fixture.numericalPolicy
    .algorithmicJacobianAuditDirectionCoefficients.mixedIndexModulo7;
  const direction = scaledDirection ?? unknowns.map((_, index) =>
    mixedCoefficients[index % mixedCoefficients.length]);
  const directionalAudit = auditPhaseB0AlgorithmicJacobianDirectionV1(
    residualOnly,
    unknowns,
    direction,
    jacobian,
    options,
    fixture.numericalPolicy.algorithmicJacobianScaledStep
      * fixture.numericalPolicy.independentDirectionalAuditStepRatioToConstruction,
  );
  const relativeTolerance =
    fixture.numericalPolicy.monolithicJacobianDirectionalRelativeTolerance;
  return Object.freeze({
    auditId: "phase-b0-monolithic-residual-jacobian-directional-audit-v1",
    slsMode: nextState.slsMode,
    unknownCount: layout.unknownCount,
    jacobian,
    directionalAudit,
    relativeTolerance,
    accepted: directionalAudit.relativeTwoNormDifference < relativeTolerance,
    hiddenJacobianFallbackUsed: false,
  });
}

export function auditPhaseB0MonolithicResidualJacobianSuiteV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  nextState: PhaseB0HydromechanicsStateV1,
  dtSec: number,
  constructionScaledStep = fixture.numericalPolicy.algorithmicJacobianScaledStep,
  independentScaledStep = constructionScaledStep
    * fixture.numericalPolicy.independentDirectionalAuditStepRatioToConstruction,
): PhaseB0MonolithicResidualJacobianAuditSuiteV1 {
  validateFixtureBoundary(fixture);
  validateState(previousState);
  validateState(nextState);
  requirePositiveFinite(dtSec, "dtSec");
  requirePositiveFinite(constructionScaledStep, "constructionScaledStep");
  requirePositiveFinite(independentScaledStep, "independentScaledStep");
  if (constructionScaledStep === independentScaledStep) {
    throw new Error("Jacobian construction and independent audit steps must differ");
  }
  if (previousState.slsMode !== nextState.slsMode) {
    throw new Error("Jacobian audit requires an unchanged SLS topology");
  }
  const expectedNextTimeSec = previousState.timeSec + dtSec;
  if (Math.abs(nextState.timeSec - expectedNextTimeSec) > 64 * Number.EPSILON
    * Math.max(1, Math.abs(expectedNextTimeSec))) {
    throw new Error("Jacobian audit next-state time does not match the BE step");
  }
  const layout = buildUnknownLayout(fixture, nextState.slsMode);
  const unknowns = encodeState(nextState);
  const residualOnly = (trialUnknowns: readonly number[]) => evaluateMonolithicResidual(
    fixture,
    previousState,
    decodeState(trialUnknowns, nextState.timeSec, nextState.slsMode),
    dtSec,
  ).residual;
  const options = {
    unknownScales: layout.unknownScales,
    residualScales: layout.residualScales,
    lowerBounds: layout.lowerBounds,
    scaledStep: constructionScaledStep,
  } as const;
  const jacobian = evaluatePhaseB0AlgorithmicJacobianV1(
    residualOnly,
    unknowns,
    options,
  );
  const blockDirection = (
    directionId: PhaseB0MonolithicResidualJacobianDirectionIdV1,
  ): readonly number[] => Object.freeze(unknowns.map((_, index) => {
    const volumeEnd = BLOOD_COMPARTMENT_IDS.length;
    const flowEnd = volumeEnd + INERTIAL_FLOW_IDS.length;
    const slsEnd = flowEnd + (nextState.slsMode === "on" ? WALL_IDS.length : 0);
    const coefficients = fixture.numericalPolicy
      .algorithmicJacobianAuditDirectionCoefficients;
    if (directionId === "mixed") {
      return coefficients.mixedIndexModulo7[
        index % coefficients.mixedIndexModulo7.length
      ];
    }
    if (directionId === "blood-volumes" && index < volumeEnd) {
      return coefficients.bloodVolumesEvenOdd[index % 2];
    }
    if (directionId === "inertial-flows" && index >= volumeEnd && index < flowEnd) {
      return coefficients.inertialFlowsEvenOdd[(index - volumeEnd) % 2];
    }
    if (directionId === "sls-states" && index >= flowEnd && index < slsEnd) {
      return coefficients.slsStatesEvenOdd[(index - flowEnd) % 2];
    }
    if (directionId === "triseg-coordinates" && index >= slsEnd) {
      return coefficients.triSegCoordinates[index - slsEnd];
    }
    return 0;
  }));
  const directionIds: readonly PhaseB0MonolithicResidualJacobianDirectionIdV1[] =
    fixture.numericalPolicy.algorithmicJacobianAuditDirectionIds.filter((directionId) =>
      nextState.slsMode === "on" || directionId !== "sls-states");
  const directions = Object.freeze(directionIds.map((directionId) => Object.freeze({
    directionId,
    audit: auditPhaseB0AlgorithmicJacobianDirectionV1(
      residualOnly,
      unknowns,
      blockDirection(directionId),
      jacobian,
      options,
      independentScaledStep,
    ),
  })));
  const maximumRelativeTwoNormDifference = Math.max(...directions.map(
    (direction) => direction.audit.relativeTwoNormDifference,
  ));
  const maximumAbsoluteScaledDifference = Math.max(...directions.map(
    (direction) => direction.audit.maximumAbsoluteDifference,
  ));
  const relativeTolerance =
    fixture.numericalPolicy.monolithicJacobianDirectionalRelativeTolerance;
  return Object.freeze({
    auditId: "phase-b0-monolithic-residual-jacobian-multidirection-suite-v1",
    slsMode: nextState.slsMode,
    unknownCount: layout.unknownCount,
    constructionScaledStep,
    independentScaledStep,
    jacobian,
    directions,
    maximumRelativeTwoNormDifference,
    maximumAbsoluteScaledDifference,
    maximumAbsoluteScaledDifferenceUse:
      fixture.numericalPolicy.algorithmicJacobianMaximumAbsoluteRowDifferenceUse,
    relativeTolerance,
    accepted: maximumRelativeTwoNormDifference < relativeTolerance,
    hiddenJacobianFallbackUsed: false,
  });
}

export function stepPhaseB0MonolithicHydromechanicsBackwardEulerV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  dtSec: number,
): PhaseB0MonolithicBackwardEulerStepResultV1 {
  validateFixtureBoundary(fixture);
  validateState(previousState);
  requirePositiveFinite(dtSec, "dtSec");
  const mode = previousState.slsMode;
  const layout = buildUnknownLayout(fixture, mode);
  const nextTimeSec = previousState.timeSec + dtSec;
  const initialUnknowns = encodeState(previousState);
  const previousEvaluation = evaluatePhaseB0HydromechanicsStateV1(fixture, previousState);
  const evaluateResidual = (unknowns: readonly number[]) => {
    const nextState = decodeState(unknowns, nextTimeSec, mode);
    return evaluateMonolithicResidual(fixture, previousState, nextState, dtSec);
  };
  const residualOnly = (unknowns: readonly number[]) => evaluateResidual(unknowns).residual;
  const newton = solveScaledDampedNewtonV1({
    initialUnknowns,
    unknownScales: layout.unknownScales,
    residualScales: layout.residualScales,
    strictLowerBounds: layout.lowerBounds,
    options: {
      maxIterations: fixture.numericalPolicy.maxNewtonIterations,
      residualInfinityTolerance:
        fixture.newtonScaleRegistry.tolerances.globalResidualInfinityNorm,
      updateInfinityTolerance:
        fixture.newtonScaleRegistry.tolerances.globalUpdateInfinityNorm,
      armijoCoefficient: fixture.numericalPolicy.armijoCoefficient,
      lineSearchContraction: fixture.numericalPolicy.lineSearchContraction,
      maxLineSearchBacktracks: fixture.numericalPolicy.maxLineSearchBacktracks,
      minimumStepLength: fixture.numericalPolicy.minimumStepLength,
      fractionToBoundarySafety: fixture.numericalPolicy.fractionToBoundarySafety,
      relativePivotTolerance: fixture.numericalPolicy.relativePivotTolerance,
    },
    evaluate: (unknowns) => {
      try {
        const residualEvaluation = evaluateResidual(unknowns);
        const jacobian = evaluatePhaseB0AlgorithmicJacobianV1(
          residualOnly,
          unknowns,
          {
            unknownScales: layout.unknownScales,
            residualScales: layout.residualScales,
            lowerBounds: layout.lowerBounds,
            scaledStep:
              fixture.numericalPolicy.algorithmicJacobianScaledStep,
          },
        );
        return {
          status: "ok" as const,
          residual: residualEvaluation.residual,
          jacobianRowMajor: jacobian.rawJacobian.flat(),
          diagnostic: Object.freeze({
            triSegDomain: residualEvaluation.nextEvaluation.triSegOracle.domainClassification,
            triSegResidualNPerM:
              residualEvaluation.nextEvaluation.triSegOracle.equilibriumResidual.euclideanNPerM,
          }),
        };
      } catch (error) {
        return {
          status: "inadmissible" as const,
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  if (newton.converged === false) {
    let lastAcceptedDiagnosticState: PhaseB0HydromechanicsStateV1 | null = null;
    try {
      lastAcceptedDiagnosticState = decodeState(newton.lastAcceptedUnknowns, nextTimeSec, mode);
    } catch {
      lastAcceptedDiagnosticState = null;
    }
    return Object.freeze({
      converged: false,
      solverId: PHASE_B0_MONOLITHIC_HYDROMECHANICS_BE_V1_ID,
      unknownCount: layout.unknownCount,
      reason: newton.reason,
      message: newton.message,
      rollbackState: previousState,
      lastAcceptedDiagnosticState,
      newtonDiagnostics: newton.diagnostics,
      postStepBloodVolumeProjectionApplied: false,
      flowClampApplied: false,
      fallbackApplied: false,
      testOnly: true,
      releaseRuntimeReachable: false,
    });
  }

  try {
    const nextState = decodeState(newton.unknowns, nextTimeSec, mode);
    const residualEvaluation = evaluateMonolithicResidual(
      fixture,
      previousState,
      nextState,
      dtSec,
    );
    const nextEvaluation = residualEvaluation.nextEvaluation;
    const slsAudit = evaluateSlsBackwardEulerAudit(
      fixture,
      previousState,
      nextState,
      previousEvaluation,
      nextEvaluation,
      dtSec,
    );
    const differentiatedStageKinematics = reconstructPhaseB0DifferentiatedStageKinematicsV1(
      fixture,
      nextState,
      nextEvaluation,
    );
    const differentiatedKinematicsHalvingAudit =
      auditPhaseB0DifferentiatedKinematicsStepHalvingV1(
        fixture,
        nextState,
        nextEvaluation,
        differentiatedStageKinematics,
      );
    const powerAudits = evaluateStepStagePower(
      fixture,
      previousState,
      nextState,
      nextEvaluation,
      dtSec,
      differentiatedStageKinematics,
    );
    const stagePower = powerAudits.wholeHeart;
    const energyAudit = evaluateWholeHeartBackwardEulerStepEnergyAuditV1({
      previousEndpoint: previousEvaluation.endpointStoredEnergy,
      nextEndpoint: nextEvaluation.endpointStoredEnergy,
      endpointStage: stagePower,
      dtSec,
    });
    const totalBloodVolumeReferenceM3 = sumBloodVolumes(
      fixture.initialState.bloodVolumesM3,
    );
    const totalBloodVolumeResidualM3 = sumBloodVolumes(nextState.bloodVolumesM3)
      - totalBloodVolumeReferenceM3;
    return Object.freeze({
      converged: true,
      solverId: PHASE_B0_MONOLITHIC_HYDROMECHANICS_BE_V1_ID,
      unknownCount: layout.unknownCount,
      previousState,
      nextState,
      previousEvaluation,
      nextEvaluation,
      residualEvaluation,
      newtonDiagnostics: newton.diagnostics,
      totalBloodVolumeReferenceM3,
      totalBloodVolumeResidualM3,
      slsAudit,
      differentiatedStageKinematics,
      differentiatedKinematicsHalvingAudit,
      triSegStagePowerAudit: powerAudits.triSeg,
      stagePower,
      energyAudit,
      postStepBloodVolumeProjectionApplied: false,
      flowClampApplied: false,
      fallbackApplied: false,
      previousTriSegRootUse: "initial-guess-only",
      testOnly: true,
      releaseRuntimeReachable: false,
    });
  } catch (error) {
    return Object.freeze({
      converged: false,
      solverId: PHASE_B0_MONOLITHIC_HYDROMECHANICS_BE_V1_ID,
      unknownCount: layout.unknownCount,
      reason: "final-evaluation-failed",
      message: error instanceof Error ? error.message : String(error),
      rollbackState: previousState,
      lastAcceptedDiagnosticState: null,
      newtonDiagnostics: newton.diagnostics,
      postStepBloodVolumeProjectionApplied: false,
      flowClampApplied: false,
      fallbackApplied: false,
      testOnly: true,
      releaseRuntimeReachable: false,
    });
  }
}

/**
 * Deterministic step rejection/subdivision. Every finer attempt restarts from
 * the original state; no partial state from a failed attempt is committed.
 */
export function advancePhaseB0HydromechanicsWithDeterministicSubstepsV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  requestedDtSec: number,
): PhaseB0DeterministicSubstepAdvanceResultV1 {
  return advancePhaseB0HydromechanicsWithDeterministicSubstepsUsingStepperV1(
    fixture,
    previousState,
    requestedDtSec,
    stepPhaseB0MonolithicHydromechanicsBackwardEulerV1,
  );
}

/** Test-only injection seam used to prove rollback between rejected attempts. */
export function advancePhaseB0HydromechanicsWithDeterministicSubstepsForTestV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  requestedDtSec: number,
  stepper: PhaseB0HydromechanicsStepFunctionV1,
): PhaseB0DeterministicSubstepAdvanceResultV1 {
  if (typeof stepper !== "function") throw new Error("stepper must be a function");
  return advancePhaseB0HydromechanicsWithDeterministicSubstepsUsingStepperV1(
    fixture,
    previousState,
    requestedDtSec,
    stepper,
  );
}

function advancePhaseB0HydromechanicsWithDeterministicSubstepsUsingStepperV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  requestedDtSec: number,
  stepper: PhaseB0HydromechanicsStepFunctionV1,
): PhaseB0DeterministicSubstepAdvanceResultV1 {
  requirePositiveFinite(requestedDtSec, "requestedDtSec");
  const rejectedAttempts: Array<Readonly<{
    substepFactor: 1 | 2 | 4 | 8;
    failedSubstepIndex: number;
    failure: PhaseB0MonolithicBackwardEulerStepFailureV1;
  }>> = [];
  for (const substepFactor of fixture.numericalPolicy
    .deterministicSubstepFactors) {
    const substepDtSec = requestedDtSec / substepFactor;
    let state = previousState;
    const steps: PhaseB0MonolithicBackwardEulerStepSuccessV1[] = [];
    let failure: PhaseB0MonolithicBackwardEulerStepFailureV1 | null = null;
    let failedSubstepIndex = -1;
    for (let index = 0; index < substepFactor; index += 1) {
      const step = stepper(
        fixture,
        state,
        substepDtSec,
      );
      if (step.converged === false) {
        failure = step;
        failedSubstepIndex = index;
        break;
      }
      steps.push(step);
      state = step.nextState;
    }
    if (failure === null) {
      return Object.freeze({
        advanced: true,
        requestedDtSec,
        acceptedSubstepFactor: substepFactor,
        acceptedSubstepDtSec: substepDtSec,
        steps: Object.freeze(steps),
        nextState: state,
        rejectedAttempts: Object.freeze(rejectedAttempts),
        rollbackBetweenAttempts: true,
        projectionApplied: false,
        flowClampApplied: false,
        fallbackApplied: false,
      });
    }
    rejectedAttempts.push(Object.freeze({
      substepFactor,
      failedSubstepIndex,
      failure,
    }));
  }
  return Object.freeze({
    advanced: false,
    requestedDtSec,
    rollbackState: previousState,
    rejectedAttempts: Object.freeze(rejectedAttempts),
    reason: "all-deterministic-substep-attempts-failed",
    rollbackBetweenAttempts: true,
    projectionApplied: false,
    flowClampApplied: false,
    fallbackApplied: false,
  });
}

function evaluateMonolithicResidual(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  nextState: PhaseB0HydromechanicsStateV1,
  dtSec: number,
): PhaseB0MonolithicResidualEvaluationV1 {
  if (previousState.slsMode !== nextState.slsMode) {
    throw new Error("SLS topology cannot change within a BE step");
  }
  const nextEvaluation = evaluatePhaseB0HydromechanicsStateV1(fixture, nextState);
  const volumeResidual = evaluatePhaseB0BackwardEulerVolumeResidualV1({
    previousVolumesM3: previousState.bloodVolumesM3,
    nextVolumesM3: nextState.bloodVolumesM3,
    nextFlowsM3PerSec: nextEvaluation.allFlowsM3PerSec,
    dtSec,
  });
  const momentumResidualPaByFlow = inertialRecord((flowId) => {
    const momentum = nextEvaluation.inertialMomentum[flowId];
    const inertancePaSec2PerM3 = flowId === "Q_VC" || flowId === "Q_PV"
      ? fixture.inletLossParametersByFlow[flowId].inertancePaSec2PerM3
      : (momentum as ValveMomentumOutputV1).inertancePaSec2PerM3;
    return inertancePaSec2PerM3
      * (
        nextState.inertialFlowsM3PerSec[flowId]
        - previousState.inertialFlowsM3PerSec[flowId]
      ) / dtSec
      - momentum.pressureGradientPa
      + momentum.signedLossPressurePa;
  });
  const slsStateResidualPerSecByWall = nextState.slsMode === "on"
    ? wallRecord((wallId) => {
      if (previousState.slsMode !== "on") throw new Error("SLS mode mismatch");
      const material = fixture.passiveSlsMaterialByWall[wallId].compiledSls;
      const alphaNext = nextState.slsAlphaVByWall[wallId];
      return (alphaNext - previousState.slsAlphaVByWall[wallId]) / dtSec
        - (nextEvaluation.wallMechanics[wallId].fiberLogStrain - alphaNext)
          / material.tauSec;
    })
    : null;
  const triSegResidualNPerM = Object.freeze({
    axial: nextEvaluation.triSegOracle.equilibriumResidual.axialNPerM,
    radial: nextEvaluation.triSegOracle.equilibriumResidual.radialNPerM,
  });
  const residual = [
    ...BLOOD_COMPARTMENT_IDS.map((id) => volumeResidual.residualsM3PerSec[id]),
    ...INERTIAL_FLOW_IDS.map((id) => momentumResidualPaByFlow[id]),
    ...(slsStateResidualPerSecByWall === null
      ? []
      : WALL_IDS.map((id) => slsStateResidualPerSecByWall[id])),
    triSegResidualNPerM.axial,
    triSegResidualNPerM.radial,
  ];
  residual.forEach((value, index) => requireFinite(value, `residual[${index}]`));
  return Object.freeze({
    residual: Object.freeze(residual),
    volumeResidual,
    momentumResidualPaByFlow,
    slsStateResidualPerSecByWall,
    triSegResidualNPerM,
    nextState,
    nextEvaluation,
  });
}

function evaluateSlsBackwardEulerAudit(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  nextState: PhaseB0HydromechanicsStateV1,
  previousEvaluation: PhaseB0HydromechanicsEvaluationV1,
  nextEvaluation: PhaseB0HydromechanicsEvaluationV1,
  dtSec: number,
): PhaseB0SlsBackwardEulerAuditV1 {
  if (nextState.slsMode === "off") {
    return Object.freeze({
      mode: "off",
      alphaMismatchByWall: null,
      maximumAbsoluteAlphaMismatch: 0,
      maximumAbsoluteDiscretePassivityIdentityResidualJ: 0,
      maximumAbsoluteComponentOraclePassivityIdentityResidualJ: 0,
      signedAllWallDiscretePassivityIdentityResidualJ: 0,
      allWallDiscretePassivityNormalizationDenominatorJ:
        WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * dtSec,
      allWallDiscretePassivityIdentityRho: 0,
    });
  }
  if (previousState.slsMode !== "on") throw new Error("SLS topology mismatch");
  const identityResidualJ: number[] = [];
  const componentOracleIdentityResidualJ: number[] = [];
  let absoluteIdentityTermSumJ = 0;
  const alphaMismatchByWall = wallRecord((wallId) => {
    const step = stepOneStateAlphaVSlsBackwardEulerV1({
      previousFiberLogStrain: previousEvaluation.wallMechanics[wallId].fiberLogStrain,
      previousAlphaV: previousState.slsAlphaVByWall[wallId],
      nextFiberLogStrain: nextEvaluation.wallMechanics[wallId].fiberLogStrain,
      dtSec,
    }, fixture.passiveSlsMaterialByWall[wallId].compiledSls);
    const wallVolumeM3 = nextEvaluation.wallMechanics[wallId]
      .wallReferenceMaterialVolumeM3;
    componentOracleIdentityResidualJ.push(
      step.discretePassivityIdentityResidualJPerM3 * wallVolumeM3,
    );
    const material = fixture.passiveSlsMaterialByWall[wallId].compiledSls;
    const previousFiberLogStrain = previousEvaluation.wallMechanics[wallId].fiberLogStrain;
    const nextFiberLogStrain = nextEvaluation.wallMechanics[wallId].fiberLogStrain;
    const previousOverstressPa = material.EVPa
      * (previousFiberLogStrain - previousState.slsAlphaVByWall[wallId]);
    const acceptedNextOverstressPa = material.EVPa
      * (nextFiberLogStrain - nextState.slsAlphaVByWall[wallId]);
    const previousStoredEnergyDensityJPerM3 = previousOverstressPa * previousOverstressPa
      / (2 * material.EVPa);
    const nextStoredEnergyDensityJPerM3 = acceptedNextOverstressPa
      * acceptedNextOverstressPa / (2 * material.EVPa);
    const stressWorkIncrementDensityJPerM3 = acceptedNextOverstressPa
      * (nextFiberLogStrain - previousFiberLogStrain);
    const numericalDissipationIncrementDensityJPerM3 = (
      acceptedNextOverstressPa - previousOverstressPa
    ) ** 2 / (2 * material.EVPa);
    const physicalDissipationIncrementDensityJPerM3 = dtSec
      * acceptedNextOverstressPa * acceptedNextOverstressPa
      / (material.EVPa * material.tauSec);
    const acceptedIdentityResidualDensityJPerM3 = stressWorkIncrementDensityJPerM3
      - (nextStoredEnergyDensityJPerM3 - previousStoredEnergyDensityJPerM3)
      - numericalDissipationIncrementDensityJPerM3
      - physicalDissipationIncrementDensityJPerM3;
    identityResidualJ.push(acceptedIdentityResidualDensityJPerM3 * wallVolumeM3);
    absoluteIdentityTermSumJ += wallVolumeM3 * (
      Math.abs(stressWorkIncrementDensityJPerM3)
      + Math.abs(nextStoredEnergyDensityJPerM3 - previousStoredEnergyDensityJPerM3)
      + numericalDissipationIncrementDensityJPerM3
      + physicalDissipationIncrementDensityJPerM3
    );
    return nextState.slsAlphaVByWall[wallId] - step.nextAlphaV;
  });
  const signedAllWallDiscretePassivityIdentityResidualJ = identityResidualJ.reduce(
    (sum, value) => sum + value,
    0,
  );
  const allWallDiscretePassivityNormalizationDenominatorJ =
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * dtSec + absoluteIdentityTermSumJ;
  return Object.freeze({
    mode: "on",
    alphaMismatchByWall,
    maximumAbsoluteAlphaMismatch: Math.max(...Object.values(alphaMismatchByWall).map(Math.abs)),
    maximumAbsoluteDiscretePassivityIdentityResidualJ: Math.max(
      ...identityResidualJ.map((value) => Math.abs(value)),
    ),
    maximumAbsoluteComponentOraclePassivityIdentityResidualJ: Math.max(
      ...componentOracleIdentityResidualJ.map((value) => Math.abs(value)),
    ),
    signedAllWallDiscretePassivityIdentityResidualJ,
    allWallDiscretePassivityNormalizationDenominatorJ,
    allWallDiscretePassivityIdentityRho:
      Math.abs(signedAllWallDiscretePassivityIdentityResidualJ)
      / allWallDiscretePassivityNormalizationDenominatorJ,
  });
}

function evaluateStepStagePower(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  previousState: PhaseB0HydromechanicsStateV1,
  nextState: PhaseB0HydromechanicsStateV1,
  nextEvaluation: PhaseB0HydromechanicsEvaluationV1,
  dtSec: number,
  stageKinematics: PhaseB0DifferentiatedStageKinematicsV1,
): Readonly<{
  wholeHeart: WholeHeartStagePowerBreakdownV1;
  triSeg: PublishedTaylorTriSegStagePowerAuditV1;
}> {
  const strainRateByWall = stageKinematics.fiberLogStrainRatePerSecByWall;
  const activeMechanicalOutputPowerByWallW = wallRecord((wallId) =>
    -nextEvaluation.wallMechanics[wallId].wallReferenceMaterialVolumeM3
      * nextEvaluation.wallMechanics[wallId].activeKirchhoffStressPa
      * strainRateByWall[wallId]);
  const ventricularWallMechanicalPowerByWallW = Object.freeze({
    LVFW: nextEvaluation.wallMechanics.LVFW.wallReferenceMaterialVolumeM3
      * nextEvaluation.wallMechanics.LVFW.totalKirchhoffStressPa
      * strainRateByWall.LVFW,
    SEP: nextEvaluation.wallMechanics.SEP.wallReferenceMaterialVolumeM3
      * nextEvaluation.wallMechanics.SEP.totalKirchhoffStressPa
      * strainRateByWall.SEP,
    RVFW: nextEvaluation.wallMechanics.RVFW.wallReferenceMaterialVolumeM3
      * nextEvaluation.wallMechanics.RVFW.totalKirchhoffStressPa
      * strainRateByWall.RVFW,
  });
  const triSegStagePowerAudit = evaluatePublishedTaylorTriSegStagePowerAuditV1({
    wallMechanicalPowerByWallW: ventricularWallMechanicalPowerByWallW,
    hydraulicPowerW: {
      LV: nextEvaluation.chamberTransmuralPressurePa.LV
        * nextEvaluation.volumeRates.volumeRatesM3PerSec.LV,
      RV: nextEvaluation.chamberTransmuralPressurePa.RV
        * nextEvaluation.volumeRates.volumeRatesM3PerSec.RV,
    },
  });
  const rawGeometryPowerResidualW = triSegStagePowerAudit.rawGeometryPowerResidualW;
  const prescribedExternalEnvironmentPowerW = -BLOOD_COMPARTMENT_IDS.reduce(
    (sum, compartmentId) => {
      const prescribedExternalPressurePa = compartmentId === "LA"
        || compartmentId === "LV"
        || compartmentId === "RA"
        || compartmentId === "RV"
        ? fixture.intrathoracicPressurePa
        : fixture.vascularComplianceParametersByCompartment[compartmentId].externalPressurePa;
      return sum + prescribedExternalPressurePa
        * nextEvaluation.volumeRates.volumeRatesM3PerSec[compartmentId];
    },
    0,
  );
  const vascularStoredEnergyRateW = (["SA", "SV", "PA", "PV"] as const).reduce(
    (sum, compartmentId) => sum
      + nextEvaluation.vascular[compartmentId].elasticPressurePa
        * nextEvaluation.volumeRates.volumeRatesM3PerSec[compartmentId],
    0,
  );
  const pericardialStoredEnergyRateW = nextEvaluation.pericardium.excessPressurePa
    * (["LA", "LV", "RA", "RV"] as const).reduce(
      (sum, compartmentId) => sum
        + nextEvaluation.volumeRates.volumeRatesM3PerSec[compartmentId],
      0,
    );
  const passiveStoredEnergyRateW = WALL_IDS.reduce(
    (sum, wallId) => sum
      + nextEvaluation.wallMechanics[wallId].wallReferenceMaterialVolumeM3
        * nextEvaluation.wallMechanics[wallId].equilibriumPassive.equilibriumKirchhoffStressPa
        * strainRateByWall[wallId],
    0,
  );
  const slsStoredEnergyRateW = nextState.slsMode === "on"
    && stageKinematics.slsAlphaRatePerSecByWall !== null
    ? WALL_IDS.reduce(
      (sum, wallId) => sum
        + nextEvaluation.wallMechanics[wallId].wallReferenceMaterialVolumeM3
          * nextEvaluation.wallMechanics[wallId].slsOverstressPa
          * (
            strainRateByWall[wallId]
            - stageKinematics.slsAlphaRatePerSecByWall![wallId]
          ),
      0,
    )
    : 0;
  const inertialStoredEnergyRateW = INERTIAL_FLOW_IDS.reduce((sum, flowId) => {
    const inertance = flowId === "Q_VC" || flowId === "Q_PV"
      ? fixture.inletLossParametersByFlow[flowId].inertancePaSec2PerM3
      : (nextEvaluation.inertialMomentum[flowId] as ValveMomentumOutputV1)
        .inertancePaSec2PerM3;
    const flowRateM3PerSec2 = (
      nextState.inertialFlowsM3PerSec[flowId]
      - previousState.inertialFlowsM3PerSec[flowId]
    ) / dtSec;
    return sum + inertance * nextState.inertialFlowsM3PerSec[flowId] * flowRateM3PerSec2;
  }, 0);
  const storedEnergyRateW = vascularStoredEnergyRateW
    + pericardialStoredEnergyRateW
    + passiveStoredEnergyRateW
    + slsStoredEnergyRateW
    + inertialStoredEnergyRateW;
  const wholeHeart = evaluateWholeHeartStagePowerV1({
    storedEnergyRateW,
    peripheralDissipationW: {
      systemic: evaluatePeripheralResistanceV1(
        fixture.peripheralResistancePaSecPerM3ByFlow.Q_sys,
        nextEvaluation.algebraicFlowsM3PerSec.Q_sys,
      ).dissipationW,
      pulmonary: evaluatePeripheralResistanceV1(
        fixture.peripheralResistancePaSecPerM3ByFlow.Q_pul,
        nextEvaluation.algebraicFlowsM3PerSec.Q_pul,
      ).dissipationW,
    },
    signedEdgeDissipationByEdgeW: inertialRecord((flowId) =>
      nextEvaluation.inertialMomentum[flowId].dissipationW),
    sls: nextState.slsMode === "on"
      ? {
        mode: "on",
        slsByWallW: wallRecord((wallId) =>
          nextEvaluation.wallMechanics[wallId].slsPhysicalDissipationW),
      }
      : { mode: "off", slsByWallW: {} },
    activeMechanicalOutputPowerByWallW,
    prescribedExternalEnvironmentPowerExcludingPericardium: {
      powerW: prescribedExternalEnvironmentPowerW,
      convention: PRESCRIBED_EXTERNAL_ENVIRONMENT_POWER_CONVENTION_V1,
      pericardialPressureWorkIncluded: false,
    },
    rawPublishedTaylorGeometryPowerResidual: {
      powerResidualW: rawGeometryPowerResidualW,
      assembly: "published-Taylor-2009",
      definition: PUBLISHED_TAYLOR_GEOMETRY_POWER_RESIDUAL_DEFINITION_V1,
      workConjugacyProven: false,
    },
  });
  return Object.freeze({ wholeHeart, triSeg: triSegStagePowerAudit });
}

function buildUnknownLayout(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  mode: PhaseB0SlsModeV1,
): Readonly<{
  unknownCount: 21 | 16;
  unknownScales: readonly number[];
  residualScales: readonly number[];
  lowerBounds: readonly (number | null)[];
}> {
  const registry = fixture.newtonScaleRegistry;
  const unknownScales = [
    ...BLOOD_COMPARTMENT_IDS.map((id) => registry.unknownScales.bloodVolumeM3[id]),
    ...INERTIAL_FLOW_IDS.map(() => registry.unknownScales.inertialFlowM3PerSec),
    ...(mode === "on" ? WALL_IDS.map(() => registry.unknownScales.slsViscousStrain) : []),
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  ];
  const residualScales = [
    ...BLOOD_COMPARTMENT_IDS.map((id) =>
      deriveOdeResidualScalePerSec(registry.unknownScales.bloodVolumeM3[id])),
    ...INERTIAL_FLOW_IDS.map(() => registry.residualScales.flowMomentumPa),
    ...(mode === "on"
      ? WALL_IDS.map(() => deriveOdeResidualScalePerSec(registry.unknownScales.slsViscousStrain))
      : []),
    registry.residualScales.publishedTriSegEquilibriumNPerM,
    registry.residualScales.publishedTriSegEquilibriumNPerM,
  ];
  const lowerBounds = [
    ...BLOOD_COMPARTMENT_IDS.map(() =>
      fixture.numericalPolicy.strictBloodVolumeLowerBoundM3),
    ...INERTIAL_FLOW_IDS.map(() => null),
    ...(mode === "on" ? WALL_IDS.map(() => null) : []),
    null,
    fixture.numericalPolicy.strictJunctionRadiusLowerBoundM,
  ];
  const unknownCount = (mode === "on" ? 21 : 16) as 21 | 16;
  if (
    unknownScales.length !== unknownCount
    || residualScales.length !== unknownCount
    || lowerBounds.length !== unknownCount
  ) {
    throw new Error("Phase B0 monolithic layout dimension drifted");
  }
  return Object.freeze({
    unknownCount,
    unknownScales: Object.freeze(unknownScales),
    residualScales: Object.freeze(residualScales),
    lowerBounds: Object.freeze(lowerBounds),
  });
}

function encodeState(state: PhaseB0HydromechanicsStateV1): readonly number[] {
  return Object.freeze([
    ...BLOOD_COMPARTMENT_IDS.map((id) => state.bloodVolumesM3[id]),
    ...INERTIAL_FLOW_IDS.map((id) => state.inertialFlowsM3PerSec[id]),
    ...(state.slsMode === "on" ? WALL_IDS.map((id) => state.slsAlphaVByWall[id]) : []),
    state.triSegCoordinates.V_m_S,
    state.triSegCoordinates.y_m,
  ]);
}

function decodeState(
  unknowns: ArrayLike<number>,
  timeSec: number,
  mode: PhaseB0SlsModeV1,
): PhaseB0HydromechanicsStateV1 {
  const expected = mode === "on" ? 21 : 16;
  if (unknowns.length !== expected) throw new Error(`Expected ${expected} monolithic unknowns`);
  let offset = 0;
  const bloodVolumesM3 = Object.freeze(Object.fromEntries(BLOOD_COMPARTMENT_IDS.map((id) => [
    id,
    requirePositiveFinite(unknowns[offset++], `bloodVolumesM3.${id}`),
  ]))) as Readonly<Record<BloodCompartmentId, number>>;
  const inertialFlowsM3PerSec = Object.freeze(Object.fromEntries(INERTIAL_FLOW_IDS.map((id) => [
    id,
    requireFinite(unknowns[offset++], `inertialFlowsM3PerSec.${id}`),
  ]))) as Readonly<Record<InertialFlowId, number>>;
  const slsAlphaVByWall = mode === "on"
    ? Object.freeze(Object.fromEntries(WALL_IDS.map((id) => [
      id,
      requireFinite(unknowns[offset++], `slsAlphaVByWall.${id}`),
    ]))) as Readonly<Record<FourChamberWallId, number>>
    : null;
  const triSegCoordinates = Object.freeze({
    V_m_S: requireFinite(unknowns[offset++], "triSegCoordinates.V_m_S"),
    y_m: requirePositiveFinite(unknowns[offset++], "triSegCoordinates.y_m"),
  });
  const base = Object.freeze({
    timeSec: requireNonNegativeFinite(timeSec, "timeSec"),
    bloodVolumesM3,
    inertialFlowsM3PerSec,
    triSegCoordinates,
  });
  return mode === "on"
    ? Object.freeze({ ...base, slsMode: "on" as const, slsAlphaVByWall: slsAlphaVByWall! })
    : Object.freeze({ ...base, slsMode: "off" as const });
}

function replaceStateKinematics(
  source: PhaseB0HydromechanicsStateV1,
  input: Readonly<{
    timeSec: number;
    volumes: Readonly<Record<BloodCompartmentId, number>>;
    alphaV: Readonly<Record<FourChamberWallId, number>> | null;
    V_m_S: number;
    y_m: number;
  }>,
): PhaseB0HydromechanicsStateV1 {
  const base = Object.freeze({
    timeSec: input.timeSec,
    bloodVolumesM3: freezeRecord(input.volumes, BLOOD_COMPARTMENT_IDS),
    inertialFlowsM3PerSec: freezeRecord(
      source.inertialFlowsM3PerSec,
      INERTIAL_FLOW_IDS,
    ),
    triSegCoordinates: Object.freeze({
      V_m_S: input.V_m_S,
      y_m: input.y_m,
    }),
  });
  const result: PhaseB0HydromechanicsStateV1 = source.slsMode === "on"
    ? (() => {
      if (input.alphaV === null) {
        throw new Error("SLS-on differentiated kinematics requires alphaV");
      }
      return Object.freeze({
        ...base,
        slsMode: "on" as const,
        slsAlphaVByWall: freezeRecord(input.alphaV, WALL_IDS),
      });
    })()
    : (() => {
      if (input.alphaV !== null) {
        throw new Error("SLS-off differentiated kinematics must not carry alphaV");
      }
      return Object.freeze({ ...base, slsMode: "off" as const });
    })();
  validateState(result);
  return result;
}

function validateFixtureBoundary(fixture: PhaseB0SyntheticHydromechanicsCaseV1): void {
  if (
    fixture.testOnly !== true
    || fixture.physiologicalValidation !== false
    || fixture.releaseRuntimeReachable !== false
  ) {
    throw new Error("Phase B0 monolithic solver accepts only the test-only synthetic fixture");
  }
}

function validateState(state: PhaseB0HydromechanicsStateV1): void {
  if (state === null || typeof state !== "object") {
    throw new Error("state must be a plain object");
  }
  if (state.slsMode !== "on" && state.slsMode !== "off") {
    throw new Error("state.slsMode must be on or off");
  }
  assertExactPlainRecordV1(
    state,
    state.slsMode === "on"
      ? [
        "timeSec",
        "bloodVolumesM3",
        "inertialFlowsM3PerSec",
        "triSegCoordinates",
        "slsMode",
        "slsAlphaVByWall",
      ]
      : [
        "timeSec",
        "bloodVolumesM3",
        "inertialFlowsM3PerSec",
        "triSegCoordinates",
        "slsMode",
      ],
    "phaseB0HydromechanicsState",
  );
  assertExactPlainRecordV1(
    state.bloodVolumesM3,
    BLOOD_COMPARTMENT_IDS,
    "phaseB0HydromechanicsState.bloodVolumesM3",
  );
  assertExactPlainRecordV1(
    state.inertialFlowsM3PerSec,
    INERTIAL_FLOW_IDS,
    "phaseB0HydromechanicsState.inertialFlowsM3PerSec",
  );
  assertExactPlainRecordV1(
    state.triSegCoordinates,
    ["V_m_S", "y_m"],
    "phaseB0HydromechanicsState.triSegCoordinates",
  );
  requireNonNegativeFinite(state.timeSec, "state.timeSec");
  for (const id of BLOOD_COMPARTMENT_IDS) {
    requirePositiveFinite(state.bloodVolumesM3[id], `state.bloodVolumesM3.${id}`);
  }
  for (const id of INERTIAL_FLOW_IDS) {
    requireFinite(state.inertialFlowsM3PerSec[id], `state.inertialFlowsM3PerSec.${id}`);
  }
  if (state.slsMode === "on") {
    assertExactPlainRecordV1(
      state.slsAlphaVByWall,
      WALL_IDS,
      "phaseB0HydromechanicsState.slsAlphaVByWall",
    );
    for (const id of WALL_IDS) {
      requireFinite(state.slsAlphaVByWall[id], `state.slsAlphaVByWall.${id}`);
    }
  }
  requireFinite(state.triSegCoordinates.V_m_S, "state.triSegCoordinates.V_m_S");
  requirePositiveFinite(state.triSegCoordinates.y_m, "state.triSegCoordinates.y_m");
}

function sumBloodVolumes(volumes: Readonly<Record<BloodCompartmentId, number>>): number {
  return BLOOD_COMPARTMENT_IDS.reduce((sum, id) => sum + volumes[id], 0);
}

function wallRecord<T>(
  value: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((id) => [id, value(id)]))) as
    Readonly<Record<FourChamberWallId, T>>;
}

function inertialRecord<T>(
  value: (flowId: InertialFlowId) => T,
): Readonly<Record<InertialFlowId, T>> {
  return Object.freeze(Object.fromEntries(INERTIAL_FLOW_IDS.map((id) => [id, value(id)]))) as
    Readonly<Record<InertialFlowId, T>>;
}

function freezeRecord<Id extends string, T>(
  source: Readonly<Record<Id, T>>,
  ids: readonly Id[],
): Readonly<Record<Id, T>> {
  return Object.freeze(Object.fromEntries(ids.map((id) => [id, source[id]]))) as
    Readonly<Record<Id, T>>;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be positive and finite`);
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be nonnegative and finite`);
  return value;
}
