import {
  evaluateSignedFlowMomentumV1,
  evaluateValveMomentumV1,
  type SignedFlowLossParametersV1,
  type SignedFlowMomentumOutputV1,
  type ValveLossParametersV1,
  type ValveMomentumOutputV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import {
  evaluateFourChamberVolumeRatesV1,
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
  type FourChamberVolumeRateEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  evaluateScaledFivePointAlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import {
  solveScaledDampedNewtonV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDampedNewtonFailureReasonV1,
  type ScaledDampedNewtonOptionsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  type BloodCompartmentId,
  type FourChamberFlowId,
  type InertialFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  evaluateLinearVascularComplianceV1,
  type LinearVascularComplianceOutputV1,
  type LinearVascularComplianceParametersV1,
} from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";

export const PHASE_B1_PRE_A_OPERATING_POINT_INITIALIZER_V2_ID =
  "phase-b1-pre-atrial-operating-point-initializer-v2" as const;

export const PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2 = Object.freeze({
  policyId: "phase-b1-pre-atrial-operating-point-policy-v2",
  phase:
    "atrial-activation-free-end-diastasis-construction-seed-not-immediate-pre-activation" as const,
  immediatelyBeforeEitherAtrialCalciumDriveClaimed: false as const,
  vascularVolumeRule:
    "V_i=V0_i+C_i*(p_fill+deltaP_i-P_external_i)" as const,
  totalBloodVolumeRule:
    "solve-one-common-filling-pressure-offset-with-fixed-v0" as const,
  mechanicsRule:
    "four-chamber-pressure-replay-plus-declared-runtime-triseg-equilibrium" as const,
  landRule:
    "callback-must-report-diastolic-steady-state-at-each-candidate-geometry" as const,
  slsRule:
    "callback-must-report-zero-overstress-at-each-candidate-geometry" as const,
  inertialFlowRule:
    "unique-monotone-quasi-steady-root-of-existing-signed-loss-law" as const,
  individualVolumeRateStationarityRequired: false as const,
  totalVolumeRateConservationRequired: true as const,
  oldMaterialHistoryAllowed: false as const,
  vascularV0RecomputedWhenTbvChanges: false as const,
  zeroFlowForcedAgainstNonzeroPressureGradient: false as const,
  projectionAllowed: false as const,
  clampAllowed: false as const,
  fallbackAllowed: false as const,
  algorithmicJacobianScaledStep: 2 ** -19,
  maximumAbsoluteLandRhsPerSec: 1e-10,
  maximumAbsoluteSlsOverstressPa: 1e-9,
  maximumQuasiSteadyMomentumAccelerationM3PerSec2: 1e-10,
  maximumTotalVolumeRateM3PerSec: 1e-15,
} as const);

const CHAMBER_IDS = Object.freeze(["LA", "LV", "RA", "RV"] as const);
const VASCULAR_IDS = Object.freeze(["SA", "SV", "PA", "PV"] as const);
const VALVE_FLOW_IDS = Object.freeze(["Q_MV", "Q_AoV", "Q_TV", "Q_PuV"] as const);
const INLET_FLOW_IDS = Object.freeze(["Q_VC", "Q_PV"] as const);

type ChamberId = typeof CHAMBER_IDS[number];
type VascularId = typeof VASCULAR_IDS[number];
type ValveFlowId = typeof VALVE_FLOW_IDS[number];
type InletFlowId = typeof INLET_FLOW_IDS[number];

export type PhaseB1PreAOperatingPointUnknownsV2 = Readonly<{
  chamberBloodVolumesM3: Readonly<Record<ChamberId, number>>;
  triSegCoordinates: Readonly<{
    V_m_S: number;
    y_m: number;
  }>;
  commonFillingPressureOffsetPa: number;
}>;

export type PhaseB1PreARelaxedMechanicsEvaluationV2 = Readonly<{
  status: "ok";
  chamberAbsolutePressurePa: Readonly<Record<ChamberId, number>>;
  triSegResidualNPerM: Readonly<{
    axial: number;
    radial: number;
  }>;
  materialConsistency: Readonly<{
    maximumAbsoluteLandRhsPerSec: number;
    maximumAbsoluteSlsOverstressPa: number;
    importedOldLandHistory: false;
    importedOldSlsHistory: false;
  }>;
  diagnostic?: unknown;
}>;

export type PhaseB1PreARelaxedMechanicsResultV2 =
  | PhaseB1PreARelaxedMechanicsEvaluationV2
  | Readonly<{
    status: "inadmissible";
    reason: string;
    diagnostic?: unknown;
  }>;

export type PhaseB1PreARelaxedMechanicsEvaluatorV2 = (
  unknowns: PhaseB1PreAOperatingPointUnknownsV2,
) => PhaseB1PreARelaxedMechanicsResultV2;

export type PhaseB1PreAOperatingPointNumericalPolicyV2 = Readonly<{
  triSegResidualScaleNPerM: number;
  chamberPressureResidualScalePa: number;
  algorithmicJacobianScaledStep?: number;
  junctionRadiusLowerBoundM?: number;
  pressureReplayTolerancePa?: number;
  triSegResidualToleranceNPerM?: number;
  totalBloodVolumeToleranceM3?: number;
  newtonOptions?: ScaledDampedNewtonOptionsV1;
}>;

export type PhaseB1PreAOperatingPointInputV2 = Readonly<{
  totalBloodVolumeM3: number;
  pressureShapePaRelativeToSvByCompartment: Readonly<
    Record<BloodCompartmentId, number>
  >;
  vascularComplianceParametersByCompartment: Readonly<
    Record<VascularId, LinearVascularComplianceParametersV1>
  >;
  peripheralResistancePaSecPerM3ByFlow: Readonly<
    Record<"Q_sys" | "Q_pul", number>
  >;
  valveLossParametersByFlow: Readonly<
    Record<ValveFlowId, ValveLossParametersV1>
  >;
  inletLossParametersByFlow: Readonly<
    Record<InletFlowId, SignedFlowLossParametersV1>
  >;
  initialGuess: PhaseB1PreAOperatingPointUnknownsV2;
  numericalPolicy: PhaseB1PreAOperatingPointNumericalPolicyV2;
  evaluateRelaxedMechanics: PhaseB1PreARelaxedMechanicsEvaluatorV2;
}>;

export type PhaseB1QuasiSteadyInertialFlowRootV2 = Readonly<{
  flowId: InertialFlowId;
  pressureGradientPa: number;
  flowM3PerSec: number;
  pressureResidualPa: number;
  flowAccelerationM3PerSec2: number;
  lossDerivativePaSecPerM3: number;
  bracketExpansionCount: number;
  bisectionIterationCount: number;
  uniqueMonotoneRoot: true;
  zeroFlowForced: false;
  momentumEvaluation: SignedFlowMomentumOutputV1 | ValveMomentumOutputV1;
}>;

export type PhaseB1PreAOperatingPointAuditV2 = Readonly<{
  commonFillingPressureOffsetPa: number;
  minimumVascularStressedVolumeM3: number;
  totalVascularStressedVolumeM3: number;
  totalVascularUnstressedVolumeM3: number;
  maximumAbsoluteChamberPressureReplayDifferencePa: number;
  maximumAbsoluteVascularPressureReplayDifferencePa: number;
  maximumAbsoluteTriSegResidualNPerM: number;
  totalBloodVolumeDifferenceM3: number;
  maximumAbsoluteInertialFlowAccelerationM3PerSec2: number;
  totalVolumeRateM3PerSec: number;
  maximumAbsoluteLandRhsPerSec: number;
  maximumAbsoluteSlsOverstressPa: number;
  preAtrialPressureOrderingPass: true;
  fixedVascularV0UsedExact: true;
  individualVolumeRateStationarityRequired: false;
  importedOldLandHistory: false;
  importedOldSlsHistory: false;
  zeroFlowForcedAgainstNonzeroPressureGradient: false;
  projectionApplied: false;
  clampApplied: false;
  fallbackApplied: false;
  pass: true;
}>;

export type PhaseB1PreAOperatingPointSuccessV2 = Readonly<{
  converged: true;
  initializerId: typeof PHASE_B1_PRE_A_OPERATING_POINT_INITIALIZER_V2_ID;
  unknowns: PhaseB1PreAOperatingPointUnknownsV2;
  targetAbsolutePressurePaByCompartment: Readonly<
    Record<BloodCompartmentId, number>
  >;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  vascularEvaluationByCompartment: Readonly<
    Record<VascularId, LinearVascularComplianceOutputV1>
  >;
  relaxedMechanics: PhaseB1PreARelaxedMechanicsEvaluationV2;
  inertialFlowRootByFlow: Readonly<
    Record<InertialFlowId, PhaseB1QuasiSteadyInertialFlowRootV2>
  >;
  inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
  algebraicFlowsM3PerSec: Readonly<Record<"Q_sys" | "Q_pul", number>>;
  allFlowsM3PerSec: Readonly<Record<FourChamberFlowId, number>>;
  volumeRates: FourChamberVolumeRateEvaluationV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  audit: PhaseB1PreAOperatingPointAuditV2;
  physiologicalValidationClaimed: false;
  periodOneClaimed: false;
}>;

export type PhaseB1PreAOperatingPointFailureV2 = Readonly<{
  converged: false;
  initializerId: typeof PHASE_B1_PRE_A_OPERATING_POINT_INITIALIZER_V2_ID;
  reason:
    | ScaledDampedNewtonFailureReasonV1
    | "final-mechanics-evaluation-failed"
    | "final-construction-audit-failed";
  message: string;
  rollbackUnknowns: PhaseB1PreAOperatingPointUnknownsV2;
  lastAcceptedUnknowns: PhaseB1PreAOperatingPointUnknownsV2;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  projectionApplied: false;
  clampApplied: false;
  fallbackApplied: false;
}>;

export type PhaseB1PreAOperatingPointResultV2 =
  | PhaseB1PreAOperatingPointSuccessV2
  | PhaseB1PreAOperatingPointFailureV2;

type ResidualEvaluation = Readonly<{
  residual: readonly number[];
  unknowns: PhaseB1PreAOperatingPointUnknownsV2;
  targetPressure: Readonly<Record<BloodCompartmentId, number>>;
  vascularVolumes: Readonly<Record<VascularId, number>>;
  mechanics: PhaseB1PreARelaxedMechanicsEvaluationV2;
}>;

class InadmissibleOperatingPointError extends Error {}
class FatalOperatingPointError extends Error {}

/**
 * Constructs a phase-consistent, relaxed pre-atrial seed without importing a
 * stopped-circulation common-pressure state.  The solve changes state only:
 * V0, compliance, pressure-shape, TBV, wall anatomy, and material parameters
 * are fixed inputs and are never modified or selected by this routine.
 */
export function solvePhaseB1PreAOperatingPointV2(
  input: PhaseB1PreAOperatingPointInputV2,
): PhaseB1PreAOperatingPointResultV2 {
  validateInput(input);
  const policy = resolveNumericalPolicy(input);
  const initialVector = encodeUnknowns(input.initialGuess);
  const unknownScales = buildUnknownScales(input.initialGuess);
  const residualScales = Object.freeze([
    policy.triSegResidualScaleNPerM,
    policy.triSegResidualScaleNPerM,
    policy.chamberPressureResidualScalePa,
    policy.chamberPressureResidualScalePa,
    policy.chamberPressureResidualScalePa,
    policy.chamberPressureResidualScalePa,
    input.totalBloodVolumeM3,
  ]);
  const fillingPressureLowerBoundPa = Math.max(
    ...VASCULAR_IDS.map((id) =>
      input.vascularComplianceParametersByCompartment[id].externalPressurePa
      - input.pressureShapePaRelativeToSvByCompartment[id]),
  );
  const strictLowerBounds = Object.freeze([
    0,
    0,
    0,
    0,
    null,
    policy.junctionRadiusLowerBoundM,
    fillingPressureLowerBoundPa,
  ] as const);

  const evaluateResidual = (vector: readonly number[]): ResidualEvaluation => {
    const unknowns = decodeUnknowns(vector);
    const targetPressure = targetPressureRecord(
      input.pressureShapePaRelativeToSvByCompartment,
      unknowns.commonFillingPressureOffsetPa,
    );
    const vascularVolumes = vascularRecord((id) => {
      const parameters = input.vascularComplianceParametersByCompartment[id];
      const stressedVolumeM3 = parameters.complianceM3PerPa
        * (targetPressure[id] - parameters.externalPressurePa);
      if (!(stressedVolumeM3 > 0) || !Number.isFinite(stressedVolumeM3)) {
        throw new InadmissibleOperatingPointError(
          `vascular stressed volume ${id} must be finite and positive`,
        );
      }
      return parameters.unstressedVolumeM3 + stressedVolumeM3;
    });
    let mechanicsResult: PhaseB1PreARelaxedMechanicsResultV2;
    try {
      mechanicsResult = input.evaluateRelaxedMechanics(unknowns);
    } catch (error) {
      throw new FatalOperatingPointError(
        `relaxed mechanics callback threw: ${errorMessage(error)}`,
      );
    }
    if (mechanicsResult.status === "inadmissible") {
      throw new InadmissibleOperatingPointError(mechanicsResult.reason);
    }
    validateMechanicsEvaluation(mechanicsResult);
    const chamberTotal = CHAMBER_IDS.reduce(
      (sum, id) => sum + unknowns.chamberBloodVolumesM3[id],
      0,
    );
    const vascularTotal = VASCULAR_IDS.reduce(
      (sum, id) => sum + vascularVolumes[id],
      0,
    );
    return Object.freeze({
      residual: Object.freeze([
        mechanicsResult.triSegResidualNPerM.axial,
        mechanicsResult.triSegResidualNPerM.radial,
        ...CHAMBER_IDS.map((id) =>
          mechanicsResult.chamberAbsolutePressurePa[id] - targetPressure[id]),
        chamberTotal + vascularTotal - input.totalBloodVolumeM3,
      ]),
      unknowns,
      targetPressure,
      vascularVolumes,
      mechanics: mechanicsResult,
    });
  };

  const newton = solveScaledDampedNewtonV1({
    initialUnknowns: initialVector,
    unknownScales,
    residualScales,
    strictLowerBounds,
    evaluate: (vector) => {
      try {
        const base = evaluateResidual(vector);
        const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
          (candidate) => evaluateResidual(candidate).residual,
          vector,
          {
            unknownScales,
            residualScales,
            lowerBounds: strictLowerBounds,
            scaledStep: policy.algorithmicJacobianScaledStep,
          },
        );
        return {
          status: "ok" as const,
          residual: base.residual,
          jacobianRowMajor: jacobian.rawJacobian.flat(),
          diagnostic: Object.freeze({
            targetPressure: base.targetPressure,
            mechanicsDiagnostic: base.mechanics.diagnostic,
            jacobianStencilByColumn: jacobian.stencilByColumn,
          }),
        };
      } catch (error) {
        if (error instanceof InadmissibleOperatingPointError) {
          return { status: "inadmissible" as const, reason: error.message };
        }
        return { status: "failed" as const, reason: errorMessage(error) };
      }
    },
    options: policy.newtonOptions,
  });
  if (newton.converged === false) {
    return Object.freeze({
      converged: false as const,
      initializerId: PHASE_B1_PRE_A_OPERATING_POINT_INITIALIZER_V2_ID,
      reason: newton.reason,
      message: newton.message,
      rollbackUnknowns: input.initialGuess,
      lastAcceptedUnknowns: decodeUnknowns(newton.lastAcceptedUnknowns),
      newtonDiagnostics: newton.diagnostics,
      projectionApplied: false as const,
      clampApplied: false as const,
      fallbackApplied: false as const,
    });
  }

  let final: ResidualEvaluation;
  try {
    final = evaluateResidual(newton.unknowns);
  } catch (error) {
    return failureAfterNewton(
      "final-mechanics-evaluation-failed",
      errorMessage(error),
      input.initialGuess,
      decodeUnknowns(newton.unknowns),
      newton.diagnostics,
    );
  }
  const vascularEvaluationByCompartment = vascularRecord((id) =>
    evaluateLinearVascularComplianceV1(
      input.vascularComplianceParametersByCompartment[id],
      final.vascularVolumes[id],
    ));
  const bloodVolumesM3 = bloodRecord((id) => CHAMBER_IDS.includes(id as ChamberId)
    ? final.unknowns.chamberBloodVolumesM3[id as ChamberId]
    : final.vascularVolumes[id as VascularId]);
  const inertialFlowRootByFlow = inertialRecord((flowId) => {
    const [upstream, downstream] = inertialPressureNodes(flowId);
    const pressureGradientPa = final.targetPressure[upstream]
      - final.targetPressure[downstream];
    return VALVE_FLOW_IDS.includes(flowId as ValveFlowId)
      ? solvePhaseB1QuasiSteadyInertialFlowRootV2({
        flowId: flowId as ValveFlowId,
        pressureGradientPa,
        valveLossParameters:
          input.valveLossParametersByFlow[flowId as ValveFlowId],
      })
      : solvePhaseB1QuasiSteadyInertialFlowRootV2({
        flowId: flowId as InletFlowId,
        pressureGradientPa,
        inletLossParameters:
          input.inletLossParametersByFlow[flowId as InletFlowId],
      });
  });
  const inertialFlowsM3PerSec = inertialRecord((id) =>
    inertialFlowRootByFlow[id].flowM3PerSec);
  const algebraicFlowsM3PerSec = Object.freeze({
    Q_sys: (final.targetPressure.SA - final.targetPressure.SV)
      / input.peripheralResistancePaSecPerM3ByFlow.Q_sys,
    Q_pul: (final.targetPressure.PA - final.targetPressure.PV)
      / input.peripheralResistancePaSecPerM3ByFlow.Q_pul,
  });
  const flowValues = Object.freeze({
    ...inertialFlowsM3PerSec,
    ...algebraicFlowsM3PerSec,
  });
  const allFlowsM3PerSec = Object.freeze(Object.fromEntries(
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((id) => [id, flowValues[id]]),
  )) as Readonly<Record<FourChamberFlowId, number>>;
  const volumeRates = evaluateFourChamberVolumeRatesV1(allFlowsM3PerSec);

  const maximumAbsoluteChamberPressureReplayDifferencePa = maximumAbsolute(
    CHAMBER_IDS.map((id) =>
      final.mechanics.chamberAbsolutePressurePa[id] - final.targetPressure[id]),
  );
  const maximumAbsoluteVascularPressureReplayDifferencePa = maximumAbsolute(
    VASCULAR_IDS.map((id) =>
      vascularEvaluationByCompartment[id].absolutePressurePa
      - final.targetPressure[id]),
  );
  const maximumAbsoluteTriSegResidualNPerM = maximumAbsolute([
    final.mechanics.triSegResidualNPerM.axial,
    final.mechanics.triSegResidualNPerM.radial,
  ]);
  const totalBloodVolumeDifferenceM3 = BLOOD_COMPARTMENT_IDS.reduce(
    (sum, id) => sum + bloodVolumesM3[id],
    0,
  ) - input.totalBloodVolumeM3;
  const maximumAbsoluteInertialFlowAccelerationM3PerSec2 = maximumAbsolute(
    INERTIAL_FLOW_IDS.map((id) =>
      inertialFlowRootByFlow[id].flowAccelerationM3PerSec2),
  );
  const stressedVolumes = VASCULAR_IDS.map((id) =>
    vascularEvaluationByCompartment[id].elasticVolumeM3);
  const minimumVascularStressedVolumeM3 = Math.min(...stressedVolumes);
  const totalVascularStressedVolumeM3 = stressedVolumes.reduce(
    (sum, volume) => sum + volume,
    0,
  );
  const totalVascularUnstressedVolumeM3 = VASCULAR_IDS.reduce(
    (sum, id) => sum
      + input.vascularComplianceParametersByCompartment[id].unstressedVolumeM3,
    0,
  );
  const auditPass = minimumVascularStressedVolumeM3 > 0
    && maximumAbsoluteChamberPressureReplayDifferencePa
      <= policy.pressureReplayTolerancePa
    && maximumAbsoluteVascularPressureReplayDifferencePa
      <= policy.pressureReplayTolerancePa
    && maximumAbsoluteTriSegResidualNPerM
      <= policy.triSegResidualToleranceNPerM
    && Math.abs(totalBloodVolumeDifferenceM3)
      <= policy.totalBloodVolumeToleranceM3
    && maximumAbsoluteInertialFlowAccelerationM3PerSec2
      <= PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2
        .maximumQuasiSteadyMomentumAccelerationM3PerSec2
    && Math.abs(volumeRates.totalVolumeRateM3PerSec)
      <= PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2
        .maximumTotalVolumeRateM3PerSec
    && final.mechanics.materialConsistency.maximumAbsoluteLandRhsPerSec
      <= PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2
        .maximumAbsoluteLandRhsPerSec
    && final.mechanics.materialConsistency.maximumAbsoluteSlsOverstressPa
      <= PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2
        .maximumAbsoluteSlsOverstressPa
    && preAtrialPressureOrderingPass(final.targetPressure);
  if (!auditPass) {
    return failureAfterNewton(
      "final-construction-audit-failed",
      "pre-atrial operating-point construction audit failed",
      input.initialGuess,
      final.unknowns,
      newton.diagnostics,
    );
  }

  const audit: PhaseB1PreAOperatingPointAuditV2 = Object.freeze({
    commonFillingPressureOffsetPa:
      final.unknowns.commonFillingPressureOffsetPa,
    minimumVascularStressedVolumeM3,
    totalVascularStressedVolumeM3,
    totalVascularUnstressedVolumeM3,
    maximumAbsoluteChamberPressureReplayDifferencePa,
    maximumAbsoluteVascularPressureReplayDifferencePa,
    maximumAbsoluteTriSegResidualNPerM,
    totalBloodVolumeDifferenceM3,
    maximumAbsoluteInertialFlowAccelerationM3PerSec2,
    totalVolumeRateM3PerSec: volumeRates.totalVolumeRateM3PerSec,
    maximumAbsoluteLandRhsPerSec:
      final.mechanics.materialConsistency.maximumAbsoluteLandRhsPerSec,
    maximumAbsoluteSlsOverstressPa:
      final.mechanics.materialConsistency.maximumAbsoluteSlsOverstressPa,
    preAtrialPressureOrderingPass: true as const,
    fixedVascularV0UsedExact: true as const,
    individualVolumeRateStationarityRequired: false as const,
    importedOldLandHistory: false as const,
    importedOldSlsHistory: false as const,
    zeroFlowForcedAgainstNonzeroPressureGradient: false as const,
    projectionApplied: false as const,
    clampApplied: false as const,
    fallbackApplied: false as const,
    pass: true as const,
  });
  return Object.freeze({
    converged: true as const,
    initializerId: PHASE_B1_PRE_A_OPERATING_POINT_INITIALIZER_V2_ID,
    unknowns: final.unknowns,
    targetAbsolutePressurePaByCompartment: final.targetPressure,
    bloodVolumesM3,
    vascularEvaluationByCompartment,
    relaxedMechanics: final.mechanics,
    inertialFlowRootByFlow,
    inertialFlowsM3PerSec,
    algebraicFlowsM3PerSec,
    allFlowsM3PerSec,
    volumeRates,
    newtonDiagnostics: newton.diagnostics,
    audit,
    physiologicalValidationClaimed: false as const,
    periodOneClaimed: false as const,
  });
}

export type PhaseB1QuasiSteadyFlowRootInputV2 =
  | Readonly<{
    flowId: ValveFlowId;
    pressureGradientPa: number;
    valveLossParameters: ValveLossParametersV1;
  }>
  | Readonly<{
    flowId: InletFlowId;
    pressureGradientPa: number;
    inletLossParameters: SignedFlowLossParametersV1;
  }>;

/**
 * Solves the strictly monotone signed loss equation at fixed pressure drop.
 * Bisection is a deterministic root solve, not a parameter sweep.  A zero
 * flow is returned only when the supplied pressure gradient is exactly zero.
 */
export function solvePhaseB1QuasiSteadyInertialFlowRootV2(
  input: PhaseB1QuasiSteadyFlowRootInputV2,
): PhaseB1QuasiSteadyInertialFlowRootV2 {
  requireFinite(input.pressureGradientPa, "pressureGradientPa");
  const evaluate = (flowM3PerSec: number) => "valveLossParameters" in input
    ? evaluateValveMomentumV1(
      input.valveLossParameters,
      input.pressureGradientPa,
      flowM3PerSec,
    )
    : evaluateSignedFlowMomentumV1(
      input.inletLossParameters,
      input.pressureGradientPa,
      flowM3PerSec,
    );
  if (input.pressureGradientPa === 0) {
    const momentumEvaluation = evaluate(0);
    return Object.freeze({
      flowId: input.flowId,
      pressureGradientPa: 0,
      flowM3PerSec: 0,
      pressureResidualPa: 0,
      flowAccelerationM3PerSec2: 0,
      lossDerivativePaSecPerM3: momentumEvaluation.lossDerivativePaSecPerM3,
      bracketExpansionCount: 0,
      bisectionIterationCount: 0,
      uniqueMonotoneRoot: true as const,
      zeroFlowForced: false as const,
      momentumEvaluation,
    });
  }
  const atZero = evaluate(0);
  const flowSmoothingM3PerSec = "valveLossParameters" in input
    ? input.valveLossParameters.flowSmoothingM3PerSec
    : input.inletLossParameters.flowSmoothingM3PerSec;
  let magnitude = Math.max(flowSmoothingM3PerSec, 1e-12);
  let lower = input.pressureGradientPa > 0 ? 0 : -magnitude;
  let upper = input.pressureGradientPa > 0 ? magnitude : 0;
  const rootResidual = (flow: number) =>
    evaluate(flow).signedLossPressurePa - input.pressureGradientPa;
  let lowerResidual = rootResidual(lower);
  let upperResidual = rootResidual(upper);
  let bracketExpansionCount = 0;
  while (!(lowerResidual <= 0 && upperResidual >= 0)) {
    bracketExpansionCount += 1;
    if (bracketExpansionCount > 80) {
      throw new Error(`quasi-steady flow root ${input.flowId} could not be bracketed`);
    }
    magnitude *= 2;
    requireFinite(magnitude, "quasi-steady flow bracket magnitude");
    lower = input.pressureGradientPa > 0 ? 0 : -magnitude;
    upper = input.pressureGradientPa > 0 ? magnitude : 0;
    lowerResidual = rootResidual(lower);
    upperResidual = rootResidual(upper);
  }
  const bisectionIterationCount = 100;
  for (let iteration = 0; iteration < bisectionIterationCount; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    const midpointResidual = rootResidual(midpoint);
    if (midpointResidual <= 0) {
      lower = midpoint;
      lowerResidual = midpointResidual;
    } else {
      upper = midpoint;
      upperResidual = midpointResidual;
    }
  }
  const flowM3PerSec = 0.5 * (lower + upper);
  const momentumEvaluation = evaluate(flowM3PerSec);
  const pressureResidualPa = momentumEvaluation.signedLossPressurePa
    - input.pressureGradientPa;
  if (
    !(momentumEvaluation.lossDerivativePaSecPerM3 > 0)
    || !Number.isFinite(momentumEvaluation.lossDerivativePaSecPerM3)
  ) {
    throw new Error(`quasi-steady flow root ${input.flowId} lost strict monotonicity`);
  }
  return Object.freeze({
    flowId: input.flowId,
    pressureGradientPa: input.pressureGradientPa,
    flowM3PerSec,
    pressureResidualPa,
    flowAccelerationM3PerSec2: momentumEvaluation.flowAccelerationM3PerSec2,
    lossDerivativePaSecPerM3: momentumEvaluation.lossDerivativePaSecPerM3,
    bracketExpansionCount,
    bisectionIterationCount,
    uniqueMonotoneRoot: true as const,
    zeroFlowForced: false as const,
    momentumEvaluation,
  });
}

function resolveNumericalPolicy(input: PhaseB1PreAOperatingPointInputV2) {
  const source = input.numericalPolicy;
  const triSegResidualScaleNPerM = requirePositiveFinite(
    source.triSegResidualScaleNPerM,
    "numericalPolicy.triSegResidualScaleNPerM",
  );
  const chamberPressureResidualScalePa = requirePositiveFinite(
    source.chamberPressureResidualScalePa,
    "numericalPolicy.chamberPressureResidualScalePa",
  );
  return Object.freeze({
    triSegResidualScaleNPerM,
    chamberPressureResidualScalePa,
    algorithmicJacobianScaledStep: source.algorithmicJacobianScaledStep
      ?? PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2
        .algorithmicJacobianScaledStep,
    junctionRadiusLowerBoundM: source.junctionRadiusLowerBoundM ?? 1e-5,
    pressureReplayTolerancePa: source.pressureReplayTolerancePa
      ?? Math.max(1e-5, 1e-8 * chamberPressureResidualScalePa),
    triSegResidualToleranceNPerM: source.triSegResidualToleranceNPerM
      ?? 1e-8 * triSegResidualScaleNPerM,
    totalBloodVolumeToleranceM3: source.totalBloodVolumeToleranceM3
      ?? 1e-10 * input.totalBloodVolumeM3,
    newtonOptions: source.newtonOptions,
  });
}

function validateInput(input: PhaseB1PreAOperatingPointInputV2): void {
  assertExactPlainRecordV1(input, [
    "totalBloodVolumeM3",
    "pressureShapePaRelativeToSvByCompartment",
    "vascularComplianceParametersByCompartment",
    "peripheralResistancePaSecPerM3ByFlow",
    "valveLossParametersByFlow",
    "inletLossParametersByFlow",
    "initialGuess",
    "numericalPolicy",
    "evaluateRelaxedMechanics",
  ], "pre-atrial operating-point input");
  requirePositiveFinite(input.totalBloodVolumeM3, "totalBloodVolumeM3");
  assertExactPlainRecordV1(
    input.pressureShapePaRelativeToSvByCompartment,
    BLOOD_COMPARTMENT_IDS,
    "pressureShapePaRelativeToSvByCompartment",
  );
  BLOOD_COMPARTMENT_IDS.forEach((id) => requireFinite(
    input.pressureShapePaRelativeToSvByCompartment[id],
    `pressureShapePaRelativeToSvByCompartment.${id}`,
  ));
  if (input.pressureShapePaRelativeToSvByCompartment.SV !== 0) {
    throw new Error("pressure shape must use SV as the exact zero reference");
  }
  if (!preAtrialPressureOrderingPass(
    input.pressureShapePaRelativeToSvByCompartment,
  )) {
    throw new Error("pressure shape violates the declared pre-atrial valve phase");
  }
  assertExactPlainRecordV1(
    input.vascularComplianceParametersByCompartment,
    VASCULAR_IDS,
    "vascularComplianceParametersByCompartment",
  );
  VASCULAR_IDS.forEach((id) => {
    const parameters = input.vascularComplianceParametersByCompartment[id];
    evaluateLinearVascularComplianceV1(
      parameters,
      parameters.unstressedVolumeM3,
    );
  });
  assertExactPlainRecordV1(
    input.peripheralResistancePaSecPerM3ByFlow,
    ["Q_sys", "Q_pul"],
    "peripheralResistancePaSecPerM3ByFlow",
  );
  requirePositiveFinite(
    input.peripheralResistancePaSecPerM3ByFlow.Q_sys,
    "peripheralResistancePaSecPerM3ByFlow.Q_sys",
  );
  requirePositiveFinite(
    input.peripheralResistancePaSecPerM3ByFlow.Q_pul,
    "peripheralResistancePaSecPerM3ByFlow.Q_pul",
  );
  assertExactPlainRecordV1(
    input.valveLossParametersByFlow,
    VALVE_FLOW_IDS,
    "valveLossParametersByFlow",
  );
  VALVE_FLOW_IDS.forEach((id) =>
    evaluateValveMomentumV1(input.valveLossParametersByFlow[id], 0, 0));
  assertExactPlainRecordV1(
    input.inletLossParametersByFlow,
    INLET_FLOW_IDS,
    "inletLossParametersByFlow",
  );
  INLET_FLOW_IDS.forEach((id) =>
    evaluateSignedFlowMomentumV1(input.inletLossParametersByFlow[id], 0, 0));
  validateUnknowns(input.initialGuess, "initialGuess");
  if (typeof input.evaluateRelaxedMechanics !== "function") {
    throw new Error("evaluateRelaxedMechanics must be a function");
  }
}

function validateMechanicsEvaluation(
  value: PhaseB1PreARelaxedMechanicsEvaluationV2,
): void {
  assertExactPlainRecordV1(value.chamberAbsolutePressurePa, CHAMBER_IDS,
    "relaxed mechanics chamber pressures");
  CHAMBER_IDS.forEach((id) => requireFinite(
    value.chamberAbsolutePressurePa[id],
    `relaxed mechanics chamber pressure ${id}`,
  ));
  assertExactPlainRecordV1(value.triSegResidualNPerM, ["axial", "radial"],
    "relaxed mechanics TriSeg residual");
  requireFinite(value.triSegResidualNPerM.axial, "TriSeg axial residual");
  requireFinite(value.triSegResidualNPerM.radial, "TriSeg radial residual");
  assertExactPlainRecordV1(value.materialConsistency, [
    "maximumAbsoluteLandRhsPerSec",
    "maximumAbsoluteSlsOverstressPa",
    "importedOldLandHistory",
    "importedOldSlsHistory",
  ], "relaxed mechanics material consistency");
  const landRhs = requireNonNegativeFinite(
    value.materialConsistency.maximumAbsoluteLandRhsPerSec,
    "maximumAbsoluteLandRhsPerSec",
  );
  const slsOverstress = requireNonNegativeFinite(
    value.materialConsistency.maximumAbsoluteSlsOverstressPa,
    "maximumAbsoluteSlsOverstressPa",
  );
  if (
    value.materialConsistency.importedOldLandHistory !== false
    || value.materialConsistency.importedOldSlsHistory !== false
    || landRhs > PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2
      .maximumAbsoluteLandRhsPerSec
    || slsOverstress > PHASE_B1_PRE_A_OPERATING_POINT_POLICY_V2
      .maximumAbsoluteSlsOverstressPa
  ) {
    throw new FatalOperatingPointError(
      "relaxed mechanics callback did not re-equilibrate Land and SLS",
    );
  }
}

function preAtrialPressureOrderingPass(
  pressure: Readonly<Record<BloodCompartmentId, number>>,
): boolean {
  return pressure.LA >= pressure.LV
    && pressure.RA >= pressure.RV
    && pressure.SA > pressure.LV
    && pressure.PA > pressure.RV
    && pressure.SV >= pressure.RA
    && pressure.PV >= pressure.LA
    && pressure.SA > pressure.SV
    && pressure.PA > pressure.PV;
}

function encodeUnknowns(
  value: PhaseB1PreAOperatingPointUnknownsV2,
): readonly number[] {
  validateUnknowns(value, "operating-point unknowns");
  return Object.freeze([
    value.chamberBloodVolumesM3.LA,
    value.chamberBloodVolumesM3.LV,
    value.chamberBloodVolumesM3.RA,
    value.chamberBloodVolumesM3.RV,
    value.triSegCoordinates.V_m_S,
    value.triSegCoordinates.y_m,
    value.commonFillingPressureOffsetPa,
  ]);
}

function decodeUnknowns(
  vector: ReadonlyArray<number>,
): PhaseB1PreAOperatingPointUnknownsV2 {
  if (vector.length !== 7) throw new Error("operating-point vector must have length seven");
  const value = Object.freeze({
    chamberBloodVolumesM3: Object.freeze({
      LA: vector[0],
      LV: vector[1],
      RA: vector[2],
      RV: vector[3],
    }),
    triSegCoordinates: Object.freeze({ V_m_S: vector[4], y_m: vector[5] }),
    commonFillingPressureOffsetPa: vector[6],
  });
  validateUnknowns(value, "decoded operating-point unknowns");
  return value;
}

function validateUnknowns(
  value: PhaseB1PreAOperatingPointUnknownsV2,
  label: string,
): void {
  assertExactPlainRecordV1(value, [
    "chamberBloodVolumesM3",
    "triSegCoordinates",
    "commonFillingPressureOffsetPa",
  ], label);
  assertExactPlainRecordV1(value.chamberBloodVolumesM3, CHAMBER_IDS,
    `${label}.chamberBloodVolumesM3`);
  CHAMBER_IDS.forEach((id) => requirePositiveFinite(
    value.chamberBloodVolumesM3[id],
    `${label}.chamberBloodVolumesM3.${id}`,
  ));
  assertExactPlainRecordV1(value.triSegCoordinates, ["V_m_S", "y_m"],
    `${label}.triSegCoordinates`);
  requireFinite(value.triSegCoordinates.V_m_S, `${label}.V_m_S`);
  requirePositiveFinite(value.triSegCoordinates.y_m, `${label}.y_m`);
  requireFinite(value.commonFillingPressureOffsetPa, `${label}.p_fill`);
}

function buildUnknownScales(
  initial: PhaseB1PreAOperatingPointUnknownsV2,
): readonly number[] {
  return Object.freeze([
    ...CHAMBER_IDS.map((id) => Math.max(
      initial.chamberBloodVolumesM3[id],
      20e-6,
    )),
    Math.max(Math.abs(initial.triSegCoordinates.V_m_S), 20e-6),
    Math.max(initial.triSegCoordinates.y_m, 0.02),
    Math.max(Math.abs(initial.commonFillingPressureOffsetPa), 133.322387415),
  ]);
}

function targetPressureRecord(
  shape: Readonly<Record<BloodCompartmentId, number>>,
  offsetPa: number,
): Readonly<Record<BloodCompartmentId, number>> {
  return bloodRecord((id) => shape[id] + offsetPa);
}

function inertialPressureNodes(
  id: InertialFlowId,
): readonly [BloodCompartmentId, BloodCompartmentId] {
  switch (id) {
    case "Q_MV": return ["LA", "LV"];
    case "Q_AoV": return ["LV", "SA"];
    case "Q_TV": return ["RA", "RV"];
    case "Q_PuV": return ["RV", "PA"];
    case "Q_VC": return ["SV", "RA"];
    case "Q_PV": return ["PV", "LA"];
  }
}

function failureAfterNewton(
  reason: "final-mechanics-evaluation-failed" | "final-construction-audit-failed",
  message: string,
  rollbackUnknowns: PhaseB1PreAOperatingPointUnknownsV2,
  lastAcceptedUnknowns: PhaseB1PreAOperatingPointUnknownsV2,
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1,
): PhaseB1PreAOperatingPointFailureV2 {
  return Object.freeze({
    converged: false as const,
    initializerId: PHASE_B1_PRE_A_OPERATING_POINT_INITIALIZER_V2_ID,
    reason,
    message,
    rollbackUnknowns,
    lastAcceptedUnknowns,
    newtonDiagnostics,
    projectionApplied: false as const,
    clampApplied: false as const,
    fallbackApplied: false as const,
  });
}

function bloodRecord<T>(
  build: (id: BloodCompartmentId) => T,
): Readonly<Record<BloodCompartmentId, T>> {
  return Object.freeze(Object.fromEntries(
    BLOOD_COMPARTMENT_IDS.map((id) => [id, build(id)]),
  )) as Readonly<Record<BloodCompartmentId, T>>;
}

function vascularRecord<T>(
  build: (id: VascularId) => T,
): Readonly<Record<VascularId, T>> {
  return Object.freeze(Object.fromEntries(
    VASCULAR_IDS.map((id) => [id, build(id)]),
  )) as Readonly<Record<VascularId, T>>;
}

function inertialRecord<T>(
  build: (id: InertialFlowId) => T,
): Readonly<Record<InertialFlowId, T>> {
  return Object.freeze(Object.fromEntries(
    INERTIAL_FLOW_IDS.map((id) => [id, build(id)]),
  )) as Readonly<Record<InertialFlowId, T>>;
}

function maximumAbsolute(values: readonly number[]): number {
  return Math.max(...values.map(Math.abs));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and positive`);
  }
  return value;
}

function requireNonNegativeFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and nonnegative`);
  }
  return value;
}
