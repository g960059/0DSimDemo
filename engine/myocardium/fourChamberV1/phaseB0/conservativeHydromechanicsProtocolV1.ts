import {
  advancePhaseB0HydromechanicsWithDeterministicSubstepsV1,
  createPhaseB0HydromechanicsInitialStateV1,
  type PhaseB0DeterministicSubstepAdvanceResultV1,
  type PhaseB0HydromechanicsStateV1,
  type PhaseB0MonolithicBackwardEulerStepFailureV1,
  type PhaseB0MonolithicBackwardEulerStepSuccessV1,
  type PhaseB0SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/monolithicHydromechanicsBackwardEulerV1";
import type { PhaseB0SyntheticHydromechanicsCaseV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/syntheticHydromechanicsCaseV1";
import { WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 } from
  "@/engine/myocardium/fourChamberV1/phaseB0/wholeHeartEnergyLedgerV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B0_SHORT_HORIZON_PROTOCOL_V1_ID =
  "phase-b0-short-horizon-conservative-hydromechanics-protocol-v1" as const;

export type PhaseB0ShortHorizonProtocolSuccessV1 = Readonly<{
  completed: true;
  protocolId: typeof PHASE_B0_SHORT_HORIZON_PROTOCOL_V1_ID;
  slsMode: PhaseB0SlsModeV1;
  dtSec: number;
  durationSec: number;
  stepCount: number;
  acceptedSubstepCount: number;
  maximumAcceptedSubstepFactor: 1 | 2 | 4 | 8;
  subdivisionUsed: boolean;
  advances: readonly Extract<
    PhaseB0DeterministicSubstepAdvanceResultV1,
    { advanced: true }
  >[];
  finalState: PhaseB0HydromechanicsStateV1;
  steps: readonly PhaseB0MonolithicBackwardEulerStepSuccessV1[];
  diagnostics: Readonly<{
    totalBloodVolumeReferenceM3: number;
    maximumAbsoluteTotalBloodVolumeResidualM3: number;
    maximumRelativeTotalBloodVolumeResidual: number;
    maximumScaledResidualInfinityNorm: number;
    maximumScaledUpdateInfinityNorm: number;
    maximumTriSegEquilibriumResidualNPerM: number;
    minimumFlowDissipationW: number;
    minimumSlsDissipationW: number;
    maximumSlsAlphaMismatch: number;
    maximumSlsPassivityIdentityResidualJ: number;
    maximumSlsPassivityIdentityRho: number;
    maximumDifferentiatedConstraintResidualNPerMSec: number;
    maximumDifferentiatedKinematicsHalvingNormalizedDifference: number;
    minimumScaledTriSegJacobianSigmaMinimum: number;
    maximumScaledTriSegJacobianConditionNumber2: number;
    minimumSignedScaledTriSegJacobianDeterminantMargin: number;
    referenceBranchJacobianOrientationPreserved: boolean;
    maximumTriSegScaledCoordinateStepDistance: number;
    triSegScaledCoordinateStepNorm: "scaled-infinity-norm";
    maximumStageEnergyRho: number;
    maximumTriSegGeometryPowerRhoStage: number;
    triSegGeometryPowerWorkNumeratorJ: number;
    triSegGeometryPowerWorkDenominatorJ: number;
    triSegGeometryPowerRhoWork: number;
    cumulativeEnergyEndpointDeltaJ: number;
    cumulativeSignedEnergyResidualJ: number;
    cumulativeEnergyDenominatorJ: number;
    cumulativeEnergyRho: number;
  }>;
  shortHorizonNumericalAcceptance: boolean;
  fullBeatAcceptanceClaimed: false;
  periodicAttractorClaimed: false;
  physiologicalValidationClaimed: false;
}>;

export type PhaseB0ShortHorizonProtocolFailureV1 = Readonly<{
  completed: false;
  protocolId: typeof PHASE_B0_SHORT_HORIZON_PROTOCOL_V1_ID;
  slsMode: PhaseB0SlsModeV1;
  dtSec: number;
  durationSec: number;
  failedStepIndex: number;
  failure: PhaseB0MonolithicBackwardEulerStepFailureV1;
  failedAdvance: Extract<
    PhaseB0DeterministicSubstepAdvanceResultV1,
    { advanced: false }
  >;
  rollbackInitialState: PhaseB0HydromechanicsStateV1;
  rollbackStateAtFailedRequestedStep: PhaseB0HydromechanicsStateV1;
  completedStepsBeforeFailure: readonly PhaseB0MonolithicBackwardEulerStepSuccessV1[];
  fullBeatAcceptanceClaimed: false;
  periodicAttractorClaimed: false;
  physiologicalValidationClaimed: false;
}>;

export type PhaseB0ShortHorizonProtocolResultV1 =
  | PhaseB0ShortHorizonProtocolSuccessV1
  | PhaseB0ShortHorizonProtocolFailureV1;

export type PhaseB0BackwardEulerTimeStepConvergenceV1 = Readonly<{
  protocolId: "phase-b0-backward-euler-step-convergence-v1";
  slsMode: PhaseB0SlsModeV1;
  durationSec: number;
  timeStepsSec: readonly [number, number, number];
  runs: readonly [
    PhaseB0ShortHorizonProtocolResultV1,
    PhaseB0ShortHorizonProtocolResultV1,
    PhaseB0ShortHorizonProtocolResultV1,
  ];
  allCompleted: boolean;
  nominalGridPreservedWithoutSubdivision: boolean;
  coarseToMediumScaledEndpointDifference: number | null;
  mediumToFineScaledEndpointDifference: number | null;
  observedOrder: number | null;
  stateOrderAccepted: boolean;
  energyLedgerRhoByTimeStep: readonly [number, number, number] | null;
  energyLedgerObservedOrderCoarseToMedium: number | null;
  energyLedgerObservedOrderMediumToFine: number | null;
  energyLedgerObservedOrder: number | null;
  energyLedgerOrderAccepted: boolean;
  energyLedgerAbsoluteToleranceForOrderWaiver: number;
  backwardEulerOrderThreshold: 0.8;
  orderAccepted: boolean;
  fullBeatAcceptanceClaimed: false;
  physiologicalValidationClaimed: false;
}>;

export function runPhaseB0ShortHorizonProtocolV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  slsMode: PhaseB0SlsModeV1,
  dtSec: number,
  durationSec: number,
): PhaseB0ShortHorizonProtocolResultV1 {
  requirePositiveFinite(dtSec, "dtSec");
  requirePositiveFinite(durationSec, "durationSec");
  const rawStepCount = durationSec / dtSec;
  const stepCount = Math.round(rawStepCount);
  if (stepCount <= 0 || Math.abs(rawStepCount - stepCount) > 1e-12 * Math.max(1, rawStepCount)) {
    throw new Error("durationSec must be a positive integer multiple of dtSec");
  }
  const initialState = createPhaseB0HydromechanicsInitialStateV1(fixture, slsMode);
  let state = initialState;
  const steps: PhaseB0MonolithicBackwardEulerStepSuccessV1[] = [];
  const advances: Extract<
    PhaseB0DeterministicSubstepAdvanceResultV1,
    { advanced: true }
  >[] = [];
  for (let index = 0; index < stepCount; index += 1) {
    const requestedStepStart = state;
    const advance = advancePhaseB0HydromechanicsWithDeterministicSubstepsV1(
      fixture,
      requestedStepStart,
      dtSec,
    );
    if (advance.advanced === false) {
      const finalRejectedAttempt = advance.rejectedAttempts[
        advance.rejectedAttempts.length - 1
      ];
      if (finalRejectedAttempt === undefined) {
        throw new Error("Failed deterministic advance must retain a rejected attempt");
      }
      return Object.freeze({
        completed: false,
        protocolId: PHASE_B0_SHORT_HORIZON_PROTOCOL_V1_ID,
        slsMode,
        dtSec,
        durationSec,
        failedStepIndex: index,
        failure: finalRejectedAttempt.failure,
        failedAdvance: advance,
        rollbackInitialState: initialState,
        rollbackStateAtFailedRequestedStep: requestedStepStart,
        completedStepsBeforeFailure: Object.freeze(steps),
        fullBeatAcceptanceClaimed: false,
        periodicAttractorClaimed: false,
        physiologicalValidationClaimed: false,
      });
    }
    advances.push(advance);
    steps.push(...advance.steps);
    state = advance.nextState;
  }
  const totalBloodVolumeReferenceM3 = steps[0]?.totalBloodVolumeReferenceM3
    ?? sumBloodVolumes(fixture.initialState.bloodVolumesM3);
  const maximumAbsoluteTotalBloodVolumeResidualM3 = maximum(steps, (step) =>
    Math.abs(step.totalBloodVolumeResidualM3));
  const maximumRelativeTotalBloodVolumeResidual = maximumAbsoluteTotalBloodVolumeResidualM3
    / totalBloodVolumeReferenceM3;
  const maximumScaledResidualInfinityNorm = maximum(steps, (step) =>
    step.newtonDiagnostics.finalResidualInfinityNorm ?? Number.POSITIVE_INFINITY);
  const maximumScaledUpdateInfinityNorm = maximum(steps, (step) =>
    step.newtonDiagnostics.finalUpdateInfinityNorm);
  const maximumTriSegEquilibriumResidualNPerM = maximum(steps, (step) =>
    step.nextEvaluation.triSegOracle.equilibriumResidual.euclideanNPerM);
  const minimumFlowDissipationW = minimum(steps, (step) =>
    step.stagePower.totals.flowDissipationW);
  const minimumSlsDissipationW = minimum(steps, (step) =>
    step.stagePower.totals.slsDissipationW);
  const maximumSlsAlphaMismatch = maximum(steps, (step) =>
    step.slsAudit.maximumAbsoluteAlphaMismatch);
  const maximumSlsPassivityIdentityResidualJ = maximum(steps, (step) =>
    step.slsAudit.maximumAbsoluteDiscretePassivityIdentityResidualJ);
  const maximumSlsPassivityIdentityRho = maximum(steps, (step) =>
    step.slsAudit.allWallDiscretePassivityIdentityRho);
  const maximumDifferentiatedConstraintResidualNPerMSec = maximum(
    steps,
    (step) => step.differentiatedStageKinematics
      .differentiatedConstraintResidualNPerMSec.infinityNorm,
  );
  const maximumDifferentiatedKinematicsHalvingNormalizedDifference = maximum(
    steps,
    (step) => step.differentiatedKinematicsHalvingAudit.maximumNormalizedRateDifference,
  );
  const minimumScaledTriSegJacobianSigmaMinimum = minimum(
    steps,
    (step) => step.differentiatedStageKinematics
      .scaledTriSegJacobianDiagnostics.sigmaMinimum,
  );
  const maximumScaledTriSegJacobianConditionNumber2 = maximum(
    steps,
    (step) => step.differentiatedStageKinematics
      .scaledTriSegJacobianDiagnostics.conditionNumber2,
  );
  const referenceJacobianDeterminantSign = fixture.numericalPolicy
    .shortHorizonTriSegReferenceJacobianDeterminantSign;
  const minimumSignedScaledTriSegJacobianDeterminantMargin = minimum(
    steps,
    (step) => referenceJacobianDeterminantSign * step.differentiatedStageKinematics
      .scaledTriSegJacobianDiagnostics.determinant,
  );
  const referenceBranchJacobianOrientationPreserved =
    minimumSignedScaledTriSegJacobianDeterminantMargin > 0;
  const maximumTriSegScaledCoordinateStepDistance = maximum(steps, (step) => Math.max(
    Math.abs(
      step.nextState.triSegCoordinates.V_m_S - step.previousState.triSegCoordinates.V_m_S,
    ) / fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
    Math.abs(
      step.nextState.triSegCoordinates.y_m - step.previousState.triSegCoordinates.y_m,
    ) / fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
  ));
  const maximumStageEnergyRho = maximum(steps, (step) => step.stagePower.normalization.rho);
  const maximumTriSegGeometryPowerRhoStage = maximum(
    steps,
    (step) => step.triSegStagePowerAudit.normalization.rhoStage,
  );
  const triSegGeometryPowerWorkNumeratorJ = steps.reduce(
    (sum, step) => sum + step.energyAudit.dtSec
      * Math.abs(step.triSegStagePowerAudit.rawGeometryPowerResidualW),
    0,
  );
  const triSegGeometryPowerWorkDenominatorJ = WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1
    * durationSec + steps.reduce(
    (sum, step) => sum + step.energyAudit.dtSec * (
      step.triSegStagePowerAudit.normalization.denominatorW
      - step.triSegStagePowerAudit.normalization.powerFloorW
    ),
    0,
  );
  const triSegGeometryPowerRhoWork = triSegGeometryPowerWorkNumeratorJ
    / triSegGeometryPowerWorkDenominatorJ;
  const cumulativeEnergyEndpointDeltaJ = steps[steps.length - 1].energyAudit.nextStoredEnergyJ
    - steps[0].energyAudit.previousStoredEnergyJ;
  const cumulativeFlowDissipationJ = steps.reduce(
    (sum, step) => sum + step.energyAudit.increments.flowDissipationJ,
    0,
  );
  const cumulativeSlsDissipationJ = steps.reduce(
    (sum, step) => sum + step.energyAudit.increments.slsDissipationJ,
    0,
  );
  const cumulativeActiveMechanicalOutputJ = steps.reduce(
    (sum, step) => sum + step.energyAudit.increments.activeMechanicalOutputJ,
    0,
  );
  const cumulativePrescribedExternalEnvironmentJ = steps.reduce(
    (sum, step) => sum + step.energyAudit.increments.prescribedExternalEnvironmentJ,
    0,
  );
  const cumulativeRawTaylorGeometryResidualJ = steps.reduce(
    (sum, step) => sum + step.energyAudit.increments
      .rawPublishedTaylorGeometryPowerResidualJ,
    0,
  );
  const cumulativeSignedEnergyResidualJ = cumulativeEnergyEndpointDeltaJ
    + cumulativeFlowDissipationJ
    + cumulativeSlsDissipationJ
    - cumulativeActiveMechanicalOutputJ
    - cumulativePrescribedExternalEnvironmentJ
    - cumulativeRawTaylorGeometryResidualJ;
  const cumulativeEnergyDenominatorJ = WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * durationSec
    + Math.abs(cumulativeEnergyEndpointDeltaJ)
    + cumulativeFlowDissipationJ
    + cumulativeSlsDissipationJ
    + steps.reduce(
      (sum, step) => sum + Math.abs(step.energyAudit.increments.activeMechanicalOutputJ),
      0,
    )
    + steps.reduce(
      (sum, step) => sum
        + Math.abs(step.energyAudit.increments.prescribedExternalEnvironmentJ),
      0,
    )
    + steps.reduce(
      (sum, step) => sum
        + Math.abs(step.energyAudit.increments.rawPublishedTaylorGeometryPowerResidualJ),
      0,
    );
  const cumulativeEnergyRho = Math.abs(cumulativeSignedEnergyResidualJ)
    / cumulativeEnergyDenominatorJ;
  const shortHorizonNumericalAcceptance = maximumRelativeTotalBloodVolumeResidual
      < fixture.numericalPolicy.shortHorizonRelativeTotalBloodVolumeTolerance
    && maximumScaledResidualInfinityNorm
      < fixture.newtonScaleRegistry.tolerances.globalResidualInfinityNorm
    && maximumScaledUpdateInfinityNorm
      < fixture.newtonScaleRegistry.tolerances.globalUpdateInfinityNorm
    && maximumTriSegEquilibriumResidualNPerM
      < fixture.numericalPolicy.shortHorizonTriSegResidualToleranceNPerM
    && minimumFlowDissipationW >= 0
    && minimumSlsDissipationW >= 0
    && maximumSlsAlphaMismatch
      < fixture.numericalPolicy.shortHorizonSlsAlphaMismatchTolerance
    && maximumSlsPassivityIdentityRho
      < fixture.numericalPolicy.shortHorizonSlsPassivityIdentityRhoTolerance
    && maximumDifferentiatedConstraintResidualNPerMSec
      < fixture.numericalPolicy.shortHorizonDifferentiatedConstraintResidualToleranceNPerMSec
    && maximumDifferentiatedKinematicsHalvingNormalizedDifference
      < fixture.numericalPolicy.differentiatedKinematicsHalvingRelativeTolerance
    && referenceBranchJacobianOrientationPreserved
    && maximumTriSegScaledCoordinateStepDistance
      < fixture.numericalPolicy.shortHorizonTriSegScaledCoordinateStepTolerance
    && maximumStageEnergyRho
      < fixture.numericalPolicy.shortHorizonStageEnergyRhoTolerance;
  return Object.freeze({
    completed: true,
    protocolId: PHASE_B0_SHORT_HORIZON_PROTOCOL_V1_ID,
    slsMode,
    dtSec,
    durationSec,
    stepCount,
    acceptedSubstepCount: steps.length,
    maximumAcceptedSubstepFactor: Math.max(
      ...advances.map((advance) => advance.acceptedSubstepFactor),
    ) as 1 | 2 | 4 | 8,
    subdivisionUsed: advances.some((advance) => advance.acceptedSubstepFactor > 1),
    advances: Object.freeze(advances),
    finalState: state,
    steps: Object.freeze(steps),
    diagnostics: Object.freeze({
      totalBloodVolumeReferenceM3,
      maximumAbsoluteTotalBloodVolumeResidualM3,
      maximumRelativeTotalBloodVolumeResidual,
      maximumScaledResidualInfinityNorm,
      maximumScaledUpdateInfinityNorm,
      maximumTriSegEquilibriumResidualNPerM,
      minimumFlowDissipationW,
      minimumSlsDissipationW,
      maximumSlsAlphaMismatch,
      maximumSlsPassivityIdentityResidualJ,
      maximumSlsPassivityIdentityRho,
      maximumDifferentiatedConstraintResidualNPerMSec,
      maximumDifferentiatedKinematicsHalvingNormalizedDifference,
      minimumScaledTriSegJacobianSigmaMinimum,
      maximumScaledTriSegJacobianConditionNumber2,
      minimumSignedScaledTriSegJacobianDeterminantMargin,
      referenceBranchJacobianOrientationPreserved,
      maximumTriSegScaledCoordinateStepDistance,
      triSegScaledCoordinateStepNorm:
        fixture.numericalPolicy.shortHorizonTriSegScaledCoordinateStepNorm,
      maximumStageEnergyRho,
      maximumTriSegGeometryPowerRhoStage,
      triSegGeometryPowerWorkNumeratorJ,
      triSegGeometryPowerWorkDenominatorJ,
      triSegGeometryPowerRhoWork,
      cumulativeEnergyEndpointDeltaJ,
      cumulativeSignedEnergyResidualJ,
      cumulativeEnergyDenominatorJ,
      cumulativeEnergyRho,
    }),
    shortHorizonNumericalAcceptance,
    fullBeatAcceptanceClaimed: false,
    periodicAttractorClaimed: false,
    physiologicalValidationClaimed: false,
  });
}

export function evaluatePhaseB0BackwardEulerTimeStepConvergenceV1(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  slsMode: PhaseB0SlsModeV1,
  coarseDtSec: number,
  durationSec: number,
): PhaseB0BackwardEulerTimeStepConvergenceV1 {
  requirePositiveFinite(coarseDtSec, "coarseDtSec");
  const timeStepsSec = Object.freeze([
    coarseDtSec,
    coarseDtSec / 2,
    coarseDtSec / 4,
  ]) as readonly [number, number, number];
  const runs = Object.freeze(timeStepsSec.map((dtSec) =>
    runPhaseB0ShortHorizonProtocolV1(fixture, slsMode, dtSec, durationSec))) as unknown as
    readonly [
      PhaseB0ShortHorizonProtocolResultV1,
      PhaseB0ShortHorizonProtocolResultV1,
      PhaseB0ShortHorizonProtocolResultV1,
    ];
  const allCompleted = runs.every((run) => run.completed);
  let coarseToMediumScaledEndpointDifference: number | null = null;
  let mediumToFineScaledEndpointDifference: number | null = null;
  let observedOrder: number | null = null;
  let energyLedgerRhoByTimeStep: readonly [number, number, number] | null = null;
  let energyLedgerObservedOrderCoarseToMedium: number | null = null;
  let energyLedgerObservedOrderMediumToFine: number | null = null;
  let energyLedgerObservedOrder: number | null = null;
  let nominalGridPreservedWithoutSubdivision = false;
  if (allCompleted) {
    const successful = runs as readonly [
      PhaseB0ShortHorizonProtocolSuccessV1,
      PhaseB0ShortHorizonProtocolSuccessV1,
      PhaseB0ShortHorizonProtocolSuccessV1,
    ];
    nominalGridPreservedWithoutSubdivision = successful.every((run) =>
      !run.subdivisionUsed && run.maximumAcceptedSubstepFactor === 1);
    if (nominalGridPreservedWithoutSubdivision) {
      coarseToMediumScaledEndpointDifference = scaledStateDistance(
        fixture,
        successful[0].finalState,
        successful[1].finalState,
      );
      mediumToFineScaledEndpointDifference = scaledStateDistance(
        fixture,
        successful[1].finalState,
        successful[2].finalState,
      );
      if (
        coarseToMediumScaledEndpointDifference > 0
        && mediumToFineScaledEndpointDifference > 0
      ) {
        observedOrder = Math.log2(
          coarseToMediumScaledEndpointDifference / mediumToFineScaledEndpointDifference,
        );
      }
      energyLedgerRhoByTimeStep = Object.freeze(successful.map((run) =>
        run.diagnostics.cumulativeEnergyRho)) as unknown as readonly [number, number, number];
      energyLedgerObservedOrderCoarseToMedium = observedHalvingOrder(
        energyLedgerRhoByTimeStep[0],
        energyLedgerRhoByTimeStep[1],
      );
      energyLedgerObservedOrderMediumToFine = observedHalvingOrder(
        energyLedgerRhoByTimeStep[1],
        energyLedgerRhoByTimeStep[2],
      );
      if (
        energyLedgerObservedOrderCoarseToMedium !== null
        && energyLedgerObservedOrderMediumToFine !== null
      ) {
        energyLedgerObservedOrder = Math.min(
          energyLedgerObservedOrderCoarseToMedium,
          energyLedgerObservedOrderMediumToFine,
        );
      }
    }
  }
  const stateOrderAccepted = observedOrder !== null
    && observedOrder >= fixture.numericalPolicy.backwardEulerObservedOrderThreshold;
  const energyLedgerOrderAccepted = energyLedgerRhoByTimeStep !== null
    && (
      energyLedgerRhoByTimeStep[2] < fixture.numericalPolicy.energyLedgerOrderWaiverRho
      || (
        energyLedgerObservedOrder !== null
        && energyLedgerObservedOrder
          >= fixture.numericalPolicy.backwardEulerObservedOrderThreshold
      )
    );
  return Object.freeze({
    protocolId: "phase-b0-backward-euler-step-convergence-v1",
    slsMode,
    durationSec,
    timeStepsSec,
    runs,
    allCompleted,
    nominalGridPreservedWithoutSubdivision,
    coarseToMediumScaledEndpointDifference,
    mediumToFineScaledEndpointDifference,
    observedOrder,
    stateOrderAccepted,
    energyLedgerRhoByTimeStep,
    energyLedgerObservedOrderCoarseToMedium,
    energyLedgerObservedOrderMediumToFine,
    energyLedgerObservedOrder,
    energyLedgerOrderAccepted,
    energyLedgerAbsoluteToleranceForOrderWaiver:
      fixture.numericalPolicy.energyLedgerOrderWaiverRho,
    backwardEulerOrderThreshold:
      fixture.numericalPolicy.backwardEulerObservedOrderThreshold,
    orderAccepted: stateOrderAccepted && energyLedgerOrderAccepted,
    fullBeatAcceptanceClaimed: false,
    physiologicalValidationClaimed: false,
  });
}

function scaledStateDistance(
  fixture: PhaseB0SyntheticHydromechanicsCaseV1,
  left: PhaseB0HydromechanicsStateV1,
  right: PhaseB0HydromechanicsStateV1,
): number {
  if (left.slsMode !== right.slsMode) throw new Error("Cannot compare unlike SLS topologies");
  const values: number[] = [];
  for (const id of BLOOD_COMPARTMENT_IDS) {
    values.push(Math.abs(left.bloodVolumesM3[id] - right.bloodVolumesM3[id])
      / fixture.newtonScaleRegistry.unknownScales.bloodVolumeM3[id]);
  }
  for (const id of INERTIAL_FLOW_IDS) {
    values.push(Math.abs(left.inertialFlowsM3PerSec[id] - right.inertialFlowsM3PerSec[id])
      / fixture.newtonScaleRegistry.unknownScales.inertialFlowM3PerSec);
  }
  if (left.slsMode === "on" && right.slsMode === "on") {
    for (const id of WALL_IDS) {
      values.push(Math.abs(left.slsAlphaVByWall[id] - right.slsAlphaVByWall[id])
        / fixture.newtonScaleRegistry.unknownScales.slsViscousStrain);
    }
  }
  values.push(
    Math.abs(left.triSegCoordinates.V_m_S - right.triSegCoordinates.V_m_S)
      / fixture.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
    Math.abs(left.triSegCoordinates.y_m - right.triSegCoordinates.y_m)
      / fixture.newtonScaleRegistry.unknownScales.junctionRadiusM,
  );
  return Math.max(...values);
}

function sumBloodVolumes(volumes: Readonly<Record<string, number>>): number {
  return BLOOD_COMPARTMENT_IDS.reduce((sum, id) => sum + volumes[id], 0);
}

function maximum<T>(values: readonly T[], select: (value: T) => number): number {
  return Math.max(...values.map(select));
}

function minimum<T>(values: readonly T[], select: (value: T) => number): number {
  return Math.min(...values.map(select));
}

function observedHalvingOrder(coarse: number, fine: number): number | null {
  if (!(coarse > 0) || !(fine > 0)) return null;
  const order = Math.log2(coarse / fine);
  return Number.isFinite(order) ? order : null;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be positive and finite`);
  return value;
}
