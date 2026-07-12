import {
  WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1,
  defaultWorkConjugateAVPlaneChamberWallParamsV1,
  evaluateWorkConjugateAVPlaneChamberWallV1,
  type WorkConjugateAVPlaneChamberWallOutputV1,
  type WorkConjugateAVPlaneChamberWallParamsV1,
} from "@/engine/mechanics2/atrial/WorkConjugateAVPlaneChamberWallV1";
import {
  evaluateSmoothInertialValveStateV2,
  initialSmoothInertialValveStateV2,
  type SmoothInertialValveOutputV2,
  type SmoothInertialValveParamsV2,
  type SmoothInertialValveStateV2,
} from "@/engine/mechanics2/valve/SmoothInertialValveV2";

export type WorkConjugateAVPlaneOrderV1 = "quasistatic" | "overdamped" | "inertial";

export type WorkConjugateAVPlaneLeftHeartActivationParamsV1 = {
  readonly laRiseTauSec: number;
  readonly laFallTauSec: number;
  readonly lvRiseTauSec: number;
  readonly lvFallTauSec: number;
};

export type WorkConjugateAVPlaneLeftHeartCoordinateParamsV1 = {
  readonly order: WorkConjugateAVPlaneOrderV1;
  readonly externalDampingNSecPerCm: number;
  readonly inertiaNSec2PerCm: number;
};

export const WORK_CONJUGATE_AV_PLANE_PHYSICAL_MASS_KG_TO_INERTIA_N_SEC2_PER_CM_V1 = 0.01;
export const WORK_CONJUGATE_AV_PLANE_PHYSICAL_DAMPING_KG_PER_SEC_TO_DAMPING_N_SEC_PER_CM_V1 = 0.01;

/** M_coordinate [N*s^2/cm] = 0.01 * physical mass [kg]. */
export function workConjugateAVPlaneCoordinateInertiaNSec2PerCmFromPhysicalMassKgV1(
  physicalMassKg: number,
): number {
  return WORK_CONJUGATE_AV_PLANE_PHYSICAL_MASS_KG_TO_INERTIA_N_SEC2_PER_CM_V1 * physicalMassKg;
}

/** D_coordinate [N*s/cm] = 0.01 * physical damping [kg/s]. */
export function workConjugateAVPlaneCoordinateDampingNSecPerCmFromPhysicalDampingKgPerSecV1(
  physicalDampingKgPerSec: number,
): number {
  return WORK_CONJUGATE_AV_PLANE_PHYSICAL_DAMPING_KG_PER_SEC_TO_DAMPING_N_SEC_PER_CM_V1 *
    physicalDampingKgPerSec;
}

// Maksuti-style 30 g engineering seed for initialization, not a physiological claim.
export const WORK_CONJUGATE_AV_PLANE_DEFAULT_PHYSICAL_MASS_KG_V1 = 0.030;
export const WORK_CONJUGATE_AV_PLANE_DEFAULT_INERTIA_N_SEC2_PER_CM_V1 =
  workConjugateAVPlaneCoordinateInertiaNSec2PerCmFromPhysicalMassKgV1(
    WORK_CONJUGATE_AV_PLANE_DEFAULT_PHYSICAL_MASS_KG_V1,
  );
export const WORK_CONJUGATE_AV_PLANE_DEFAULT_EXTERNAL_DAMPING_N_SEC_PER_CM_V1 = 0;

export type WorkConjugateAVPlaneLeftHeartParamsV1 = {
  readonly laWall: WorkConjugateAVPlaneChamberWallParamsV1;
  readonly lvWall: WorkConjugateAVPlaneChamberWallParamsV1;
  readonly activation: WorkConjugateAVPlaneLeftHeartActivationParamsV1;
  readonly avPlane: WorkConjugateAVPlaneLeftHeartCoordinateParamsV1;
  readonly mitralValve: SmoothInertialValveParamsV2;
  readonly aorticValve: SmoothInertialValveParamsV2;
  readonly pulmonaryVenousComplianceMlPerMmHg: number;
  readonly pulmonaryVenousResistanceMmHgSecPerMl: number;
  readonly pulmonaryVenousInertanceMmHgSec2PerMl: number;
  readonly pulmonarySourceResistanceMmHgSecPerMl: number;
  readonly returnReservoirComplianceMlPerMmHg: number;
  readonly initialReturnReservoirPressureMmHg: number;
  readonly aorticComplianceMlPerMmHg: number;
  readonly systemicResistanceMmHgSecPerMl: number;
  readonly nonlinearSolverIterations: number;
  readonly nonlinearResidualTolerance: number;
  readonly nonlinearLineSearchSteps: number;
};

export type WorkConjugateAVPlaneLeftHeartStateV1 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly avPlanePositionCm: number;
  readonly avPlaneVelocityCmPerSec: number;
  readonly mitralValve: SmoothInertialValveStateV2;
  readonly aorticValve: SmoothInertialValveStateV2;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly pulmonaryVenousFlowMlPerSec: number;
  readonly aorticPressureMmHg: number;
  readonly returnReservoirPressureMmHg: number;
  readonly laActivation01: number;
  readonly lvActivation01: number;
};

export type WorkConjugateAVPlaneLeftHeartActivationSourceV1 =
  | "legacy-first-order-filter"
  | "prescribed-contractile-state";

type WorkConjugateAVPlaneLeftHeartSharedInputV1 = {
  readonly dtSec: number;
  readonly pericardialPressureMmHg?: number;
};

type WorkConjugateAVPlaneLeftHeartLaActivationInputV1 =
    | {
        readonly laActivationSource?: "legacy-first-order-filter";
        readonly laElectricalActivation01: number;
        readonly laPrescribedContractileActivation01?: never;
      }
    | {
        /**
         * Upstream owns the bounded endpoint state. This bypasses only the
         * legacy LA first-order filter; mechanics and blood ownership remain.
         */
        readonly laActivationSource: "prescribed-contractile-state";
        /** Protocol marker retained for attribution; it is not the state driver. */
        readonly laElectricalActivation01: number;
        readonly laPrescribedContractileActivation01: number;
      };

type WorkConjugateAVPlaneLeftHeartLvActivationInputV1 =
    | {
        readonly lvActivationSource?: "legacy-first-order-filter";
        readonly lvElectricalActivation01: number;
        readonly lvPrescribedContractileActivation01?: never;
      }
    | {
        /**
         * Upstream owns the bounded endpoint state. This bypasses only the
         * legacy LV first-order filter; mechanics and blood ownership remain.
         */
        readonly lvActivationSource: "prescribed-contractile-state";
        /** Protocol marker retained for attribution; it is not the state driver. */
        readonly lvElectricalActivation01: number;
        readonly lvPrescribedContractileActivation01: number;
      };

export type WorkConjugateAVPlaneLeftHeartInputV1 =
  WorkConjugateAVPlaneLeftHeartSharedInputV1 &
  WorkConjugateAVPlaneLeftHeartLaActivationInputV1 &
  WorkConjugateAVPlaneLeftHeartLvActivationInputV1;

export type WorkConjugateAVPlaneLeftHeartChamberActivationReadbackV1 = {
  readonly source: WorkConjugateAVPlaneLeftHeartActivationSourceV1;
  readonly stateOwner: "subsystem-first-order-filter" | "upstream-prescribed-contractile-state";
  readonly previousContractileActivation01: number;
  readonly currentContractileActivation01: number;
  /** Electrical drive for the legacy filter, or a non-driving protocol marker when prescribed. */
  readonly electricalProtocolMarker01: number;
  /** Null means the subsystem, rather than the upstream caller, advanced the state this step. */
  readonly prescribedContractileActivation01: number | null;
};

export type WorkConjugateAVPlaneLeftHeartActivationReadbackV1 = {
  readonly la: WorkConjugateAVPlaneLeftHeartChamberActivationReadbackV1;
  readonly lv: WorkConjugateAVPlaneLeftHeartChamberActivationReadbackV1;
};

export type WorkConjugateAVPlaneLeftHeartResidualV1 = {
  readonly laMassResidualMl: number;
  readonly lvMassResidualMl: number;
  readonly avPlaneKinematicResidualCm: number;
  readonly avPlaneForceResidualN: number;
  readonly mitralMomentumResidualMmHg: number;
  readonly aorticMomentumResidualMmHg: number;
  readonly pulmonaryVenousComplianceResidualMmHg: number;
  readonly pulmonaryVenousMomentumResidualMmHg: number;
  readonly aorticComplianceResidualMmHg: number;
  readonly returnReservoirComplianceResidualMmHg: number;
  readonly physicalResiduals: readonly number[];
  readonly normalizedResiduals: readonly number[];
  readonly closedCircuitVolumeResidualMl: number;
  readonly totalClosedCircuitVolumeDeltaMl: number;
  readonly hiddenBloodVolumeSourceMl: 0;
  readonly maxNormalizedEquationResidual: number;
  readonly solverIterations: number;
  readonly solverConverged: boolean;
};

export type WorkConjugateAVPlaneLeftHeartPressureAreaReadbackV1 = {
  readonly laPressureAreaIdentityResidualN: number;
  readonly lvPressureAreaIdentityResidualN: number;
};

export type WorkConjugateAVPlaneLeftHeartForceReadbackV1 = {
  readonly order: WorkConjugateAVPlaneOrderV1;
  readonly laWallForceN: number;
  readonly lvWallForceN: number;
  readonly wallForceSumN: number;
  readonly externalDampingForceN: number;
  readonly beInertialForceN: number;
  readonly forceResidualN: number;
  readonly forcePowerResidualW: number;
};

export type WorkConjugateAVPlaneLeftHeartPowerReadbackV1 = {
  readonly laWallRawPowerResidualW: number;
  readonly lvWallRawPowerResidualW: number;
  readonly externalDampingPowerW: number;
  readonly beInertialPowerW: number;
  readonly coupledRawPowerResidualW: number;
};

export type WorkConjugateAVPlaneLeftHeartOutputV1 = {
  readonly state: WorkConjugateAVPlaneLeftHeartStateV1;
  /** Per-step LA/LV ownership and realized contractile states; neither is a solver unknown. */
  readonly activation: WorkConjugateAVPlaneLeftHeartActivationReadbackV1;
  readonly la: WorkConjugateAVPlaneChamberWallOutputV1;
  readonly lv: WorkConjugateAVPlaneChamberWallOutputV1;
  readonly mitralValve: SmoothInertialValveOutputV2;
  readonly aorticValve: SmoothInertialValveOutputV2;
  readonly pulmonaryVenousFlowMlPerSec: number;
  readonly pulmonarySourceFlowMlPerSec: number;
  readonly systemicOutflowMlPerSec: number;
  readonly residual: WorkConjugateAVPlaneLeftHeartResidualV1;
  readonly pressureArea: WorkConjugateAVPlaneLeftHeartPressureAreaReadbackV1;
  readonly avForce: WorkConjugateAVPlaneLeftHeartForceReadbackV1;
  readonly power: WorkConjugateAVPlaneLeftHeartPowerReadbackV1;
  /** Numeric finiteness only; this does not imply wall validity or solver convergence. */
  readonly allFinite: boolean;
  /** True only when all numeric values are finite, both walls are valid, and the solve converged. */
  readonly acceptedStep: boolean;
};

type EvaluatedSystem = {
  readonly la: WorkConjugateAVPlaneChamberWallOutputV1;
  readonly lv: WorkConjugateAVPlaneChamberWallOutputV1;
  readonly mitralValve: SmoothInertialValveOutputV2;
  readonly aorticValve: SmoothInertialValveOutputV2;
  readonly pulmonarySourceFlowMlPerSec: number;
  readonly systemicOutflowMlPerSec: number;
  readonly physicalResiduals: readonly number[];
  readonly normalizedResiduals: readonly number[];
  readonly pressureArea: WorkConjugateAVPlaneLeftHeartPressureAreaReadbackV1;
  readonly avForce: WorkConjugateAVPlaneLeftHeartForceReadbackV1;
  readonly power: WorkConjugateAVPlaneLeftHeartPowerReadbackV1;
};

type SolverResult = {
  readonly vector: readonly number[];
  readonly iterations: number;
  readonly converged: boolean;
  readonly maxNormalizedResidual: number;
};

type StaticForceInput = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly avPlanePositionCm: number;
  readonly laActivation01: number;
  readonly lvActivation01: number;
  readonly pericardialPressureMmHg: number;
};

export const WORK_CONJUGATE_AV_PLANE_LEFT_HEART_TRIAL_VARIABLES_V1 = [
  "V_LA",
  "V_LV",
  "z",
  "u",
  "Q_MV",
  "Q_AoV",
  "P_PV",
  "Q_PV",
  "P_Ao",
  "P_return",
] as const;

export const DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1:
WorkConjugateAVPlaneLeftHeartParamsV1 = {
  laWall: defaultWorkConjugateAVPlaneChamberWallParamsV1("LA"),
  lvWall: defaultWorkConjugateAVPlaneChamberWallParamsV1("LV"),
  activation: {
    laRiseTauSec: 0.025,
    laFallTauSec: 0.075,
    lvRiseTauSec: 0.030,
    lvFallTauSec: 0.040,
  },
  avPlane: {
    order: "inertial",
    // Core wall viscosity supplies dissipation; no extra external damping is seeded.
    externalDampingNSecPerCm:
      WORK_CONJUGATE_AV_PLANE_DEFAULT_EXTERNAL_DAMPING_N_SEC_PER_CM_V1,
    inertiaNSec2PerCm: WORK_CONJUGATE_AV_PLANE_DEFAULT_INERTIA_N_SEC2_PER_CM_V1,
  },
  mitralValve: {
    valveId: "MV",
    openAreaCm2: 4.5,
    leakAreaCm2: 0.03,
    openingMidpointMmHg: 0.12,
    openingWidthMmHg: 0.10,
    openResistanceMmHgSecPerMl: 0.004,
    openInertanceMmHgSec2PerMl: 0.00025,
    openBernoulliMmHgSec2PerMl2: 2e-5,
    flowSmoothingMlPerSec: 0.5,
    newtonIterations: 8,
  },
  aorticValve: {
    valveId: "AoV",
    openAreaCm2: 3.2,
    leakAreaCm2: 0.015,
    openingMidpointMmHg: 0.50,
    openingWidthMmHg: 0.20,
    openResistanceMmHgSecPerMl: 0.002,
    openInertanceMmHgSec2PerMl: 0.0002,
    openBernoulliMmHgSec2PerMl2: 4e-5,
    flowSmoothingMlPerSec: 0.5,
    newtonIterations: 8,
  },
  pulmonaryVenousComplianceMlPerMmHg: 18,
  pulmonaryVenousResistanceMmHgSecPerMl: 0.060,
  pulmonaryVenousInertanceMmHgSec2PerMl: 0.0020,
  pulmonarySourceResistanceMmHgSecPerMl: 0.080,
  returnReservoirComplianceMlPerMmHg: 35,
  initialReturnReservoirPressureMmHg: 17.5,
  aorticComplianceMlPerMmHg: 1.3,
  systemicResistanceMmHgSecPerMl: 1.12,
  nonlinearSolverIterations: 12,
  nonlinearResidualTolerance: 1e-8,
  nonlinearLineSearchSteps: 12,
};

const VARIABLE_SCALES = [60, 120, 1, 10, 300, 300, 10, 100, 100, 15] as const;
const LA_VOLUME = 0;
const LV_VOLUME = 1;
const AV_POSITION = 2;
const AV_VELOCITY = 3;
const MITRAL_FLOW = 4;
const AORTIC_FLOW = 5;
const PV_PRESSURE = 6;
const PV_FLOW = 7;
const AORTIC_PRESSURE = 8;
const RETURN_PRESSURE = 9;
const MMHG_TO_KPA = 1 / WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1;
const CM_PER_SEC_TO_M_PER_SEC = 0.01;

export function initialWorkConjugateAVPlaneLeftHeartStateV1(
  overrides: Partial<WorkConjugateAVPlaneLeftHeartStateV1> = {},
  params: WorkConjugateAVPlaneLeftHeartParamsV1 =
    DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
): WorkConjugateAVPlaneLeftHeartStateV1 {
  validateWallChamberOwnership(params);
  return {
    laVolumeMl: overrides.laVolumeMl ?? 65,
    lvVolumeMl: overrides.lvVolumeMl ?? 120,
    avPlanePositionCm: overrides.avPlanePositionCm ?? 0,
    avPlaneVelocityCmPerSec: overrides.avPlaneVelocityCmPerSec ?? 0,
    mitralValve: overrides.mitralValve ?? initialSmoothInertialValveStateV2(),
    aorticValve: overrides.aorticValve ?? initialSmoothInertialValveStateV2(),
    pulmonaryVenousPressureMmHg: overrides.pulmonaryVenousPressureMmHg ?? 9,
    pulmonaryVenousFlowMlPerSec: overrides.pulmonaryVenousFlowMlPerSec ?? 65,
    aorticPressureMmHg: overrides.aorticPressureMmHg ?? 90,
    returnReservoirPressureMmHg: overrides.returnReservoirPressureMmHg ??
      params.initialReturnReservoirPressureMmHg,
    laActivation01: overrides.laActivation01 ?? 0,
    lvActivation01: overrides.lvActivation01 ?? 0,
  };
}

export function stepWorkConjugateAVPlaneLeftHeartV1(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1 =
    DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
): WorkConjugateAVPlaneLeftHeartOutputV1 {
  validateParamsAndInput(params, input);
  const activation = nextActivationStates(previous, input, params);
  const initial = predictorVector(previous, input, params, activation);
  const solved = solveImplicitStep(previous, activation, initial, input, params);
  const candidateState = stateFromVector(solved.vector, activation);
  const evaluated = evaluateSystem(previous, candidateState, input, params);
  return outputFromEvaluation(previous, candidateState, evaluated, solved, input, params);
}

export function evaluateWorkConjugateAVPlaneLeftHeartStateV1(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1 =
    DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
): WorkConjugateAVPlaneLeftHeartOutputV1 {
  validateParamsAndInput(params, input);
  const evaluated = evaluateSystem(previous, state, input, params);
  const solved: SolverResult = {
    vector: vectorFromState(state),
    iterations: 0,
    converged: false,
    maxNormalizedResidual: maxAbs(evaluated.normalizedResiduals),
  };
  return outputFromEvaluation(previous, state, evaluated, solved, input, params);
}

export function estimateStaticNetForceDerivativeNPerCmV1(
  input: StaticForceInput,
  params: WorkConjugateAVPlaneLeftHeartParamsV1 =
    DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
  stepCm = 1e-4,
): number {
  validateWallChamberOwnership(params);
  const dz = Math.max(Math.abs(stepCm), 1e-8);
  const plus = staticWallForceSumN({ ...input, avPlanePositionCm: input.avPlanePositionCm + dz }, params);
  const minus = staticWallForceSumN({ ...input, avPlanePositionCm: input.avPlanePositionCm - dz }, params);
  return (plus - minus) / (2 * dz);
}

export function estimateStaticNetRestoringStiffnessNPerCmV1(
  input: StaticForceInput,
  params: WorkConjugateAVPlaneLeftHeartParamsV1 =
    DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
  stepCm = 1e-4,
): number {
  return -estimateStaticNetForceDerivativeNPerCmV1(input, params, stepCm);
}

function nextActivationStates(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): Pick<WorkConjugateAVPlaneLeftHeartStateV1, "laActivation01" | "lvActivation01"> {
  return {
    laActivation01: input.laActivationSource === "prescribed-contractile-state"
      ? input.laPrescribedContractileActivation01
      : firstOrderActivation(
        previous.laActivation01,
        input.laElectricalActivation01,
        input.dtSec,
        params.activation.laRiseTauSec,
        params.activation.laFallTauSec,
      ),
    lvActivation01: input.lvActivationSource === "prescribed-contractile-state"
      ? input.lvPrescribedContractileActivation01
      : firstOrderActivation(
        previous.lvActivation01,
        input.lvElectricalActivation01,
        input.dtSec,
        params.activation.lvRiseTauSec,
        params.activation.lvFallTauSec,
      ),
  };
}

function predictorVector(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
  activation: Pick<WorkConjugateAVPlaneLeftHeartStateV1, "laActivation01" | "lvActivation01">,
): readonly number[] {
  const dtSec = input.dtSec;
  const pulmonarySourceFlow = (
    previous.returnReservoirPressureMmHg -
    previous.pulmonaryVenousPressureMmHg
  ) / params.pulmonarySourceResistanceMmHgSecPerMl;
  const systemicOutflow = (
    previous.aorticPressureMmHg -
    previous.returnReservoirPressureMmHg
  ) / params.systemicResistanceMmHgSecPerMl;
  const forceLimitedVelocity = predictorVelocity(previous, input, params, activation);
  return [
    previous.laVolumeMl + dtSec * (
      previous.pulmonaryVenousFlowMlPerSec - previous.mitralValve.qMlPerSec
    ),
    previous.lvVolumeMl + dtSec * (
      previous.mitralValve.qMlPerSec - previous.aorticValve.qMlPerSec
    ),
    previous.avPlanePositionCm + dtSec * forceLimitedVelocity,
    forceLimitedVelocity,
    previous.mitralValve.qMlPerSec,
    previous.aorticValve.qMlPerSec,
    previous.pulmonaryVenousPressureMmHg + dtSec * (
      pulmonarySourceFlow - previous.pulmonaryVenousFlowMlPerSec
    ) / params.pulmonaryVenousComplianceMlPerMmHg,
    previous.pulmonaryVenousFlowMlPerSec,
    previous.aorticPressureMmHg + dtSec * (
      previous.aorticValve.qMlPerSec - systemicOutflow
    ) / params.aorticComplianceMlPerMmHg,
    previous.returnReservoirPressureMmHg + dtSec * (
      systemicOutflow - pulmonarySourceFlow
    ) / params.returnReservoirComplianceMlPerMmHg,
  ];
}

function predictorVelocity(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
  activation: Pick<WorkConjugateAVPlaneLeftHeartStateV1, "laActivation01" | "lvActivation01">,
): number {
  if (params.avPlane.order === "quasistatic") {
    return previous.avPlaneVelocityCmPerSec;
  }
  const pericardialPressureKPa = (input.pericardialPressureMmHg ?? 0) * MMHG_TO_KPA;
  const dtSec = input.dtSec;
  const la = evaluateWorkConjugateAVPlaneChamberWallV1({
    bloodVolumeMl: previous.laVolumeMl,
    bloodVolumeDotMlPerSec: 0,
    avPlanePositionCm: previous.avPlanePositionCm,
    avPlaneVelocityCmPerSec: previous.avPlaneVelocityCmPerSec,
    activation01: activation.laActivation01,
    pericardialPressureKPa,
  }, params.laWall);
  const lv = evaluateWorkConjugateAVPlaneChamberWallV1({
    bloodVolumeMl: previous.lvVolumeMl,
    bloodVolumeDotMlPerSec: 0,
    avPlanePositionCm: previous.avPlanePositionCm,
    avPlaneVelocityCmPerSec: previous.avPlaneVelocityCmPerSec,
    activation01: activation.lvActivation01,
    pericardialPressureKPa,
  }, params.lvWall);
  const forceSumN = la.zForceN.total + lv.zForceN.total;
  const denominator = params.avPlane.externalDampingNSecPerCm +
    (params.avPlane.order === "inertial" ? params.avPlane.inertiaNSec2PerCm / dtSec : 0);
  if (denominator <= 0 || !Number.isFinite(forceSumN)) {
    return previous.avPlaneVelocityCmPerSec;
  }
  const inertialPrevious = params.avPlane.order === "inertial"
    ? params.avPlane.inertiaNSec2PerCm * previous.avPlaneVelocityCmPerSec / dtSec
    : 0;
  return (forceSumN + inertialPrevious) / denominator;
}

function solveImplicitStep(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  activation: Pick<WorkConjugateAVPlaneLeftHeartStateV1, "laActivation01" | "lvActivation01">,
  initial: readonly number[],
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): SolverResult {
  let vector = [...initial];
  if (!admissible(vector, previous, activation, input, params)) {
    return {
      vector,
      iterations: 0,
      converged: false,
      maxNormalizedResidual: Number.POSITIVE_INFINITY,
    };
  }
  let evaluated = evaluateVector(previous, activation, vector, input, params);
  let norm = maxAbs(evaluated.normalizedResiduals);
  let iterations = 0;
  for (; iterations < Math.max(1, params.nonlinearSolverIterations); iterations += 1) {
    if (norm <= params.nonlinearResidualTolerance) break;
    const jacobian = finiteDifferenceJacobian(
      previous,
      activation,
      vector,
      evaluated.normalizedResiduals,
      input,
      params,
    );
    const step = solveLinearSystem(
      jacobian,
      evaluated.normalizedResiduals.map((value) => -value),
    );
    if (!step || step.some((value) => !Number.isFinite(value))) break;
    let accepted = false;
    let alpha = 1;
    for (let line = 0; line < Math.max(1, params.nonlinearLineSearchSteps); line += 1) {
      const trial = vector.map((value, index) => value + alpha * step[index]!);
      if (admissible(trial, previous, activation, input, params)) {
        const trialEvaluation = evaluateVector(previous, activation, trial, input, params);
        const trialNorm = maxAbs(trialEvaluation.normalizedResiduals);
        if (trialNorm < norm) {
          vector = trial;
          evaluated = trialEvaluation;
          norm = trialNorm;
          accepted = true;
          break;
        }
      }
      alpha *= 0.5;
    }
    if (!accepted) break;
  }
  return {
    vector,
    iterations,
    converged: norm <= params.nonlinearResidualTolerance,
    maxNormalizedResidual: norm,
  };
}

function finiteDifferenceJacobian(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  activation: Pick<WorkConjugateAVPlaneLeftHeartStateV1, "laActivation01" | "lvActivation01">,
  vector: readonly number[],
  baseResidual: readonly number[],
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): number[][] {
  const jacobian = baseResidual.map(() => Array(vector.length).fill(0) as number[]);
  for (let column = 0; column < vector.length; column += 1) {
    const magnitude = Math.max(Math.abs(vector[column]!), VARIABLE_SCALES[column]!, 1);
    const forwardStep = 1e-6 * magnitude;
    let delta = forwardStep;
    let perturbed = vector.map((value, index) => index === column ? value + delta : value);
    if (!admissible(perturbed, previous, activation, input, params)) {
      delta = -forwardStep;
      perturbed = vector.map((value, index) => index === column ? value + delta : value);
    }
    if (!admissible(perturbed, previous, activation, input, params)) {
      continue;
    }
    const residual = evaluateVector(
      previous,
      activation,
      perturbed,
      input,
      params,
    ).normalizedResiduals;
    for (let row = 0; row < baseResidual.length; row += 1) {
      jacobian[row]![column] = (residual[row]! - baseResidual[row]!) / delta;
    }
  }
  return jacobian;
}

function evaluateVector(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  activation: Pick<WorkConjugateAVPlaneLeftHeartStateV1, "laActivation01" | "lvActivation01">,
  vector: readonly number[],
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): EvaluatedSystem {
  return evaluateSystem(previous, stateFromVector(vector, activation), input, params);
}

function evaluateSystem(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): EvaluatedSystem {
  const dtSec = input.dtSec;
  const pericardialPressureKPa = (input.pericardialPressureMmHg ?? 0) * MMHG_TO_KPA;
  const laVolumeDotMlPerSec = (state.laVolumeMl - previous.laVolumeMl) / dtSec;
  const lvVolumeDotMlPerSec = (state.lvVolumeMl - previous.lvVolumeMl) / dtSec;
  const la = evaluateWorkConjugateAVPlaneChamberWallV1({
    bloodVolumeMl: state.laVolumeMl,
    bloodVolumeDotMlPerSec: laVolumeDotMlPerSec,
    avPlanePositionCm: state.avPlanePositionCm,
    avPlaneVelocityCmPerSec: state.avPlaneVelocityCmPerSec,
    activation01: state.laActivation01,
    pericardialPressureKPa,
  }, params.laWall);
  const lv = evaluateWorkConjugateAVPlaneChamberWallV1({
    bloodVolumeMl: state.lvVolumeMl,
    bloodVolumeDotMlPerSec: lvVolumeDotMlPerSec,
    avPlanePositionCm: state.avPlanePositionCm,
    avPlaneVelocityCmPerSec: state.avPlaneVelocityCmPerSec,
    activation01: state.lvActivation01,
    pericardialPressureKPa,
  }, params.lvWall);
  const mitralValve = evaluateSmoothInertialValveStateV2(
    previous.mitralValve,
    state.mitralValve,
    {
      dtSec,
      upstreamPressureMmHg: la.cavityPressureMmHg,
      downstreamPressureMmHg: lv.cavityPressureMmHg,
    },
    params.mitralValve,
  );
  const aorticValve = evaluateSmoothInertialValveStateV2(
    previous.aorticValve,
    state.aorticValve,
    {
      dtSec,
      upstreamPressureMmHg: lv.cavityPressureMmHg,
      downstreamPressureMmHg: state.aorticPressureMmHg,
    },
    params.aorticValve,
  );
  const pulmonarySourceFlowMlPerSec = (
    state.returnReservoirPressureMmHg -
    state.pulmonaryVenousPressureMmHg
  ) / params.pulmonarySourceResistanceMmHgSecPerMl;
  const systemicOutflowMlPerSec = (
    state.aorticPressureMmHg -
    state.returnReservoirPressureMmHg
  ) / params.systemicResistanceMmHgSecPerMl;
  const avForce = avForceReadback(la, lv, previous, state, input, params);
  const pressureArea = pressureAreaReadback(la, lv);
  const power = powerReadback(la, lv, avForce, state, previous, input, params);
  const physicalResiduals = [
    state.laVolumeMl - previous.laVolumeMl - dtSec * (
      state.pulmonaryVenousFlowMlPerSec - state.mitralValve.qMlPerSec
    ),
    state.lvVolumeMl - previous.lvVolumeMl - dtSec * (
      state.mitralValve.qMlPerSec - state.aorticValve.qMlPerSec
    ),
    state.avPlanePositionCm - previous.avPlanePositionCm -
      dtSec * state.avPlaneVelocityCmPerSec,
    avForce.forceResidualN,
    mitralValve.pressureFlowResidualMmHg,
    aorticValve.pressureFlowResidualMmHg,
    state.pulmonaryVenousPressureMmHg - previous.pulmonaryVenousPressureMmHg -
      dtSec * (pulmonarySourceFlowMlPerSec - state.pulmonaryVenousFlowMlPerSec) /
      params.pulmonaryVenousComplianceMlPerMmHg,
    state.pulmonaryVenousPressureMmHg - la.cavityPressureMmHg -
      params.pulmonaryVenousResistanceMmHgSecPerMl * state.pulmonaryVenousFlowMlPerSec -
      params.pulmonaryVenousInertanceMmHgSec2PerMl * (
        state.pulmonaryVenousFlowMlPerSec - previous.pulmonaryVenousFlowMlPerSec
      ) / dtSec,
    state.aorticPressureMmHg - previous.aorticPressureMmHg -
      dtSec * (state.aorticValve.qMlPerSec - systemicOutflowMlPerSec) /
      params.aorticComplianceMlPerMmHg,
    state.returnReservoirPressureMmHg - previous.returnReservoirPressureMmHg -
      dtSec * (systemicOutflowMlPerSec - pulmonarySourceFlowMlPerSec) /
      params.returnReservoirComplianceMlPerMmHg,
  ];
  const normalizedResiduals = [
    physicalResiduals[0]!,
    physicalResiduals[1]!,
    physicalResiduals[2]!,
    physicalResiduals[3]! / 10,
    physicalResiduals[4]! / 10,
    physicalResiduals[5]! / 10,
    physicalResiduals[6]!,
    physicalResiduals[7]! / 10,
    physicalResiduals[8]!,
    physicalResiduals[9]!,
  ];
  return {
    la,
    lv,
    mitralValve,
    aorticValve,
    pulmonarySourceFlowMlPerSec,
    systemicOutflowMlPerSec,
    physicalResiduals,
    normalizedResiduals,
    pressureArea,
    avForce,
    power,
  };
}

function outputFromEvaluation(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  evaluated: EvaluatedSystem,
  solved: SolverResult,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): WorkConjugateAVPlaneLeftHeartOutputV1 {
  const residual = residualReadback(previous, state, evaluated, solved, params);
  const numericValues = [
    ...vectorFromState(state),
    ...residual.physicalResiduals,
    ...residual.normalizedResiduals,
    residual.closedCircuitVolumeResidualMl,
    residual.totalClosedCircuitVolumeDeltaMl,
    residual.maxNormalizedEquationResidual,
    evaluated.la.cavityPressureKPa,
    evaluated.lv.cavityPressureKPa,
    evaluated.mitralValve.qMlPerSec,
    evaluated.aorticValve.qMlPerSec,
    evaluated.pulmonarySourceFlowMlPerSec,
    evaluated.systemicOutflowMlPerSec,
    evaluated.pressureArea.laPressureAreaIdentityResidualN,
    evaluated.pressureArea.lvPressureAreaIdentityResidualN,
    evaluated.avForce.laWallForceN,
    evaluated.avForce.lvWallForceN,
    evaluated.avForce.wallForceSumN,
    evaluated.avForce.externalDampingForceN,
    evaluated.avForce.beInertialForceN,
    evaluated.avForce.forceResidualN,
    evaluated.avForce.forcePowerResidualW,
    evaluated.power.laWallRawPowerResidualW,
    evaluated.power.lvWallRawPowerResidualW,
    evaluated.power.externalDampingPowerW,
    evaluated.power.beInertialPowerW,
    evaluated.power.coupledRawPowerResidualW,
  ];
  const allFinite = evaluated.la.finite && evaluated.lv.finite &&
    numericValues.every((value) => Number.isFinite(value));
  return {
    state,
    activation: activationReadback(previous, state, input),
    la: evaluated.la,
    lv: evaluated.lv,
    mitralValve: evaluated.mitralValve,
    aorticValve: evaluated.aorticValve,
    pulmonaryVenousFlowMlPerSec: state.pulmonaryVenousFlowMlPerSec,
    pulmonarySourceFlowMlPerSec: evaluated.pulmonarySourceFlowMlPerSec,
    systemicOutflowMlPerSec: evaluated.systemicOutflowMlPerSec,
    residual,
    pressureArea: evaluated.pressureArea,
    avForce: evaluated.avForce,
    power: evaluated.power,
    allFinite,
    acceptedStep: allFinite && evaluated.la.valid && evaluated.lv.valid && solved.converged,
  };
}

function activationReadback(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
): WorkConjugateAVPlaneLeftHeartActivationReadbackV1 {
  const laPrescribed = input.laActivationSource === "prescribed-contractile-state";
  const lvPrescribed = input.lvActivationSource === "prescribed-contractile-state";
  return {
    la: {
      source: laPrescribed ? "prescribed-contractile-state" : "legacy-first-order-filter",
      stateOwner: laPrescribed
        ? "upstream-prescribed-contractile-state"
        : "subsystem-first-order-filter",
      previousContractileActivation01: previous.laActivation01,
      currentContractileActivation01: state.laActivation01,
      electricalProtocolMarker01: input.laElectricalActivation01,
      prescribedContractileActivation01: laPrescribed
        ? input.laPrescribedContractileActivation01
        : null,
    },
    lv: {
      source: lvPrescribed ? "prescribed-contractile-state" : "legacy-first-order-filter",
      stateOwner: lvPrescribed
        ? "upstream-prescribed-contractile-state"
        : "subsystem-first-order-filter",
      previousContractileActivation01: previous.lvActivation01,
      currentContractileActivation01: state.lvActivation01,
      electricalProtocolMarker01: input.lvElectricalActivation01,
      prescribedContractileActivation01: lvPrescribed
        ? input.lvPrescribedContractileActivation01
        : null,
    },
  };
}

function residualReadback(
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  evaluated: EvaluatedSystem,
  solved: SolverResult,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): WorkConjugateAVPlaneLeftHeartResidualV1 {
  return {
    laMassResidualMl: evaluated.physicalResiduals[0]!,
    lvMassResidualMl: evaluated.physicalResiduals[1]!,
    avPlaneKinematicResidualCm: evaluated.physicalResiduals[2]!,
    avPlaneForceResidualN: evaluated.physicalResiduals[3]!,
    mitralMomentumResidualMmHg: evaluated.physicalResiduals[4]!,
    aorticMomentumResidualMmHg: evaluated.physicalResiduals[5]!,
    pulmonaryVenousComplianceResidualMmHg: evaluated.physicalResiduals[6]!,
    pulmonaryVenousMomentumResidualMmHg: evaluated.physicalResiduals[7]!,
    aorticComplianceResidualMmHg: evaluated.physicalResiduals[8]!,
    returnReservoirComplianceResidualMmHg: evaluated.physicalResiduals[9]!,
    physicalResiduals: evaluated.physicalResiduals,
    normalizedResiduals: evaluated.normalizedResiduals,
    closedCircuitVolumeResidualMl: evaluated.physicalResiduals[0]! +
      evaluated.physicalResiduals[1]! +
      params.pulmonaryVenousComplianceMlPerMmHg * evaluated.physicalResiduals[6]! +
      params.aorticComplianceMlPerMmHg * evaluated.physicalResiduals[8]! +
      params.returnReservoirComplianceMlPerMmHg * evaluated.physicalResiduals[9]!,
    totalClosedCircuitVolumeDeltaMl: totalClosedCircuitVolumeMl(state, params) -
      totalClosedCircuitVolumeMl(previous, params),
    hiddenBloodVolumeSourceMl: 0,
    maxNormalizedEquationResidual: solved.maxNormalizedResidual,
    solverIterations: solved.iterations,
    solverConverged: solved.converged,
  };
}

function totalClosedCircuitVolumeMl(
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): number {
  return state.laVolumeMl + state.lvVolumeMl +
    params.pulmonaryVenousComplianceMlPerMmHg * state.pulmonaryVenousPressureMmHg +
    params.aorticComplianceMlPerMmHg * state.aorticPressureMmHg +
    params.returnReservoirComplianceMlPerMmHg * state.returnReservoirPressureMmHg;
}

function avForceReadback(
  la: WorkConjugateAVPlaneChamberWallOutputV1,
  lv: WorkConjugateAVPlaneChamberWallOutputV1,
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): WorkConjugateAVPlaneLeftHeartForceReadbackV1 {
  const wallForceSumN = la.zForceN.total + lv.zForceN.total;
  const externalDampingForceN = params.avPlane.order === "overdamped" ||
    params.avPlane.order === "inertial"
    ? params.avPlane.externalDampingNSecPerCm * state.avPlaneVelocityCmPerSec
    : 0;
  const beInertialForceN = params.avPlane.order === "inertial"
    ? params.avPlane.inertiaNSec2PerCm *
      (state.avPlaneVelocityCmPerSec - previous.avPlaneVelocityCmPerSec) / input.dtSec
    : 0;
  const forceResidualN = wallForceSumN - externalDampingForceN - beInertialForceN;
  return {
    order: params.avPlane.order,
    laWallForceN: la.zForceN.total,
    lvWallForceN: lv.zForceN.total,
    wallForceSumN,
    externalDampingForceN,
    beInertialForceN,
    forceResidualN,
    forcePowerResidualW: forceResidualN *
      state.avPlaneVelocityCmPerSec * CM_PER_SEC_TO_M_PER_SEC,
  };
}

function powerReadback(
  la: WorkConjugateAVPlaneChamberWallOutputV1,
  lv: WorkConjugateAVPlaneChamberWallOutputV1,
  avForce: WorkConjugateAVPlaneLeftHeartForceReadbackV1,
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): WorkConjugateAVPlaneLeftHeartPowerReadbackV1 {
  const externalDampingPowerW = params.avPlane.order === "overdamped" ||
    params.avPlane.order === "inertial"
    ? params.avPlane.externalDampingNSecPerCm *
      state.avPlaneVelocityCmPerSec * state.avPlaneVelocityCmPerSec *
      CM_PER_SEC_TO_M_PER_SEC
    : 0;
  const beInertialPowerW = params.avPlane.order === "inertial"
    ? params.avPlane.inertiaNSec2PerCm *
      (state.avPlaneVelocityCmPerSec - previous.avPlaneVelocityCmPerSec) / input.dtSec *
      state.avPlaneVelocityCmPerSec * CM_PER_SEC_TO_M_PER_SEC
    : 0;
  return {
    laWallRawPowerResidualW: la.power.rawPowerResidualW,
    lvWallRawPowerResidualW: lv.power.rawPowerResidualW,
    externalDampingPowerW,
    beInertialPowerW,
    coupledRawPowerResidualW: la.power.stressPowerW + lv.power.stressPowerW -
      la.power.pressurePowerW - lv.power.pressurePowerW +
      externalDampingPowerW + beInertialPowerW,
  };
}

function pressureAreaReadback(
  la: WorkConjugateAVPlaneChamberWallOutputV1,
  lv: WorkConjugateAVPlaneChamberWallOutputV1,
): WorkConjugateAVPlaneLeftHeartPressureAreaReadbackV1 {
  return {
    laPressureAreaIdentityResidualN:
      la.zForceAxisDecompositionN.circumferentialPressureAreaResidualN.total,
    lvPressureAreaIdentityResidualN:
      lv.zForceAxisDecompositionN.circumferentialPressureAreaResidualN.total,
  };
}

function stateFromVector(
  vector: readonly number[],
  activation: Pick<WorkConjugateAVPlaneLeftHeartStateV1, "laActivation01" | "lvActivation01">,
): WorkConjugateAVPlaneLeftHeartStateV1 {
  return {
    laVolumeMl: vector[LA_VOLUME]!,
    lvVolumeMl: vector[LV_VOLUME]!,
    avPlanePositionCm: vector[AV_POSITION]!,
    avPlaneVelocityCmPerSec: vector[AV_VELOCITY]!,
    mitralValve: { qMlPerSec: vector[MITRAL_FLOW]! },
    aorticValve: { qMlPerSec: vector[AORTIC_FLOW]! },
    pulmonaryVenousPressureMmHg: vector[PV_PRESSURE]!,
    pulmonaryVenousFlowMlPerSec: vector[PV_FLOW]!,
    aorticPressureMmHg: vector[AORTIC_PRESSURE]!,
    returnReservoirPressureMmHg: vector[RETURN_PRESSURE]!,
    laActivation01: activation.laActivation01,
    lvActivation01: activation.lvActivation01,
  };
}

function vectorFromState(state: WorkConjugateAVPlaneLeftHeartStateV1): readonly number[] {
  return [
    state.laVolumeMl,
    state.lvVolumeMl,
    state.avPlanePositionCm,
    state.avPlaneVelocityCmPerSec,
    state.mitralValve.qMlPerSec,
    state.aorticValve.qMlPerSec,
    state.pulmonaryVenousPressureMmHg,
    state.pulmonaryVenousFlowMlPerSec,
    state.aorticPressureMmHg,
    state.returnReservoirPressureMmHg,
  ];
}

function admissible(
  vector: readonly number[],
  previous: WorkConjugateAVPlaneLeftHeartStateV1,
  activation: Pick<WorkConjugateAVPlaneLeftHeartStateV1, "laActivation01" | "lvActivation01">,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): boolean {
  if (vector.length !== VARIABLE_SCALES.length || vector.some((value) => !Number.isFinite(value))) {
    return false;
  }
  const state = stateFromVector(vector, activation);
  if (
    state.laVolumeMl <= 0.1 ||
    state.lvVolumeMl <= 0.1 ||
    state.laVolumeMl > 500 ||
    state.lvVolumeMl > 600 ||
    Math.abs(state.avPlanePositionCm) > 4 ||
    Math.abs(state.avPlaneVelocityCmPerSec) > 250 ||
    Math.abs(state.mitralValve.qMlPerSec) > 10000 ||
    Math.abs(state.aorticValve.qMlPerSec) > 10000 ||
    Math.abs(state.pulmonaryVenousFlowMlPerSec) > 10000 ||
    state.pulmonaryVenousPressureMmHg < -25 ||
    state.pulmonaryVenousPressureMmHg > 250 ||
    state.aorticPressureMmHg < -25 ||
    state.aorticPressureMmHg > 300 ||
    state.returnReservoirPressureMmHg < -25 ||
    state.returnReservoirPressureMmHg > 250
  ) {
    return false;
  }
  const evaluated = evaluateSystem(previous, state, input, params);
  return evaluated.la.valid && evaluated.lv.valid &&
    evaluated.la.finite && evaluated.lv.finite &&
    evaluated.normalizedResiduals.every((value) => Number.isFinite(value));
}

function staticWallForceSumN(
  input: StaticForceInput,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): number {
  const pericardialPressureKPa = input.pericardialPressureMmHg * MMHG_TO_KPA;
  const la = evaluateWorkConjugateAVPlaneChamberWallV1({
    bloodVolumeMl: input.laVolumeMl,
    bloodVolumeDotMlPerSec: 0,
    avPlanePositionCm: input.avPlanePositionCm,
    avPlaneVelocityCmPerSec: 0,
    activation01: input.laActivation01,
    pericardialPressureKPa,
  }, params.laWall);
  const lv = evaluateWorkConjugateAVPlaneChamberWallV1({
    bloodVolumeMl: input.lvVolumeMl,
    bloodVolumeDotMlPerSec: 0,
    avPlanePositionCm: input.avPlanePositionCm,
    avPlaneVelocityCmPerSec: 0,
    activation01: input.lvActivation01,
    pericardialPressureKPa,
  }, params.lvWall);
  return la.zForceN.total + lv.zForceN.total;
}

function firstOrderActivation(
  previous: number,
  electricalInput01: number,
  dtSec: number,
  riseTauSec: number,
  fallTauSec: number,
): number {
  const target = clamp01(electricalInput01);
  const tau = target >= previous ? riseTauSec : fallTauSec;
  return target + (clamp01(previous) - target) * Math.exp(-dtSec / tau);
}

function validateParamsAndInput(
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
  input: WorkConjugateAVPlaneLeftHeartInputV1,
): void {
  validateWallChamberOwnership(params);
  if (!Number.isFinite(input.dtSec) || input.dtSec <= 0) {
    throw new RangeError("dtSec must be positive finite");
  }
  if (!Number.isFinite(input.laElectricalActivation01) || !Number.isFinite(input.lvElectricalActivation01)) {
    throw new RangeError("electrical activation inputs must be finite");
  }
  if (
    input.laActivationSource === "prescribed-contractile-state" &&
    (!Number.isFinite(input.laPrescribedContractileActivation01) ||
      input.laPrescribedContractileActivation01 < 0 ||
      input.laPrescribedContractileActivation01 > 1)
  ) {
    throw new RangeError(
      "laPrescribedContractileActivation01 must be finite and within [0, 1]",
    );
  }
  if (
    input.lvActivationSource === "prescribed-contractile-state" &&
    (!Number.isFinite(input.lvPrescribedContractileActivation01) ||
      input.lvPrescribedContractileActivation01 < 0 ||
      input.lvPrescribedContractileActivation01 > 1)
  ) {
    throw new RangeError(
      "lvPrescribedContractileActivation01 must be finite and within [0, 1]",
    );
  }
  const positiveValues: readonly [string, number][] = [
    ["activation.laRiseTauSec", params.activation.laRiseTauSec],
    ["activation.laFallTauSec", params.activation.laFallTauSec],
    ["activation.lvRiseTauSec", params.activation.lvRiseTauSec],
    ["activation.lvFallTauSec", params.activation.lvFallTauSec],
    ["pulmonaryVenousComplianceMlPerMmHg", params.pulmonaryVenousComplianceMlPerMmHg],
    ["pulmonaryVenousResistanceMmHgSecPerMl", params.pulmonaryVenousResistanceMmHgSecPerMl],
    ["pulmonaryVenousInertanceMmHgSec2PerMl", params.pulmonaryVenousInertanceMmHgSec2PerMl],
    ["pulmonarySourceResistanceMmHgSecPerMl", params.pulmonarySourceResistanceMmHgSecPerMl],
    ["returnReservoirComplianceMlPerMmHg", params.returnReservoirComplianceMlPerMmHg],
    ["aorticComplianceMlPerMmHg", params.aorticComplianceMlPerMmHg],
    ["systemicResistanceMmHgSecPerMl", params.systemicResistanceMmHgSecPerMl],
    ["nonlinearResidualTolerance", params.nonlinearResidualTolerance],
  ];
  for (const [name, value] of positiveValues) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive finite`);
    }
  }
  if (!Number.isFinite(params.initialReturnReservoirPressureMmHg)) {
    throw new RangeError("initialReturnReservoirPressureMmHg must be finite");
  }
  if (!Number.isFinite(params.avPlane.externalDampingNSecPerCm) ||
    params.avPlane.externalDampingNSecPerCm < 0) {
    throw new RangeError("avPlane.externalDampingNSecPerCm must be nonnegative finite");
  }
  if (!Number.isFinite(params.avPlane.inertiaNSec2PerCm) ||
    params.avPlane.inertiaNSec2PerCm < 0) {
    throw new RangeError("avPlane.inertiaNSec2PerCm must be nonnegative finite");
  }
  if (params.avPlane.order === "overdamped" && params.avPlane.externalDampingNSecPerCm <= 0) {
    throw new RangeError("avPlane.externalDampingNSecPerCm must be positive for overdamped order");
  }
  if (params.avPlane.order === "inertial" && params.avPlane.inertiaNSec2PerCm <= 0) {
    throw new RangeError("avPlane.inertiaNSec2PerCm must be positive for inertial order");
  }
  if (!Number.isFinite(params.nonlinearSolverIterations) || params.nonlinearSolverIterations < 0) {
    throw new RangeError("nonlinearSolverIterations must be nonnegative finite");
  }
  if (!Number.isFinite(params.nonlinearLineSearchSteps) || params.nonlinearLineSearchSteps <= 0) {
    throw new RangeError("nonlinearLineSearchSteps must be positive finite");
  }
}

function validateWallChamberOwnership(
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): void {
  if (params.laWall.chamberId !== "LA") {
    throw new RangeError(
      `params.laWall.chamberId must be "LA"; received ${JSON.stringify(params.laWall.chamberId)}`,
    );
  }
  if (params.lvWall.chamberId !== "LV") {
    throw new RangeError(
      `params.lvWall.chamberId must be "LV"; received ${JSON.stringify(params.lvWall.chamberId)}`,
    );
  }
}

function solveLinearSystem(matrix: readonly (readonly number[])[], rhs: readonly number[]): number[] | null {
  const n = rhs.length;
  const augmented = matrix.map((row, index) => [...row, rhs[index]!]);
  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(augmented[row]![column]!) > Math.abs(augmented[pivot]![column]!)) pivot = row;
    }
    if (Math.abs(augmented[pivot]![column]!) < 1e-12) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot]!, augmented[column]!];
    for (let row = column + 1; row < n; row += 1) {
      const factor = augmented[row]![column]! / augmented[column]![column]!;
      for (let entry = column; entry <= n; entry += 1) {
        augmented[row]![entry] = augmented[row]![entry]! - factor * augmented[column]![entry]!;
      }
    }
  }
  const solution = Array(n).fill(0) as number[];
  for (let row = n - 1; row >= 0; row -= 1) {
    let value = augmented[row]![n]!;
    for (let column = row + 1; column < n; column += 1) {
      value -= augmented[row]![column]! * solution[column]!;
    }
    solution[row] = value / augmented[row]![row]!;
  }
  return solution;
}

function maxAbs(values: readonly number[]): number {
  if (values.some((value) => !Number.isFinite(value))) {
    return Number.POSITIVE_INFINITY;
  }
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
