export type SharedAVPlaneParamsV1 = {
  readonly atrialAreaCm2: number;
  readonly ventricularAreaCm2: number;
  readonly atrialLongitudinalTissueAreaCm2: number;
  readonly ventricularLongitudinalTissueAreaCm2: number;
  readonly atrialFiberProjection01: number;
  readonly ventricularFiberProjection01: number;
  readonly referencePositionCm: number;
  readonly inertiaNSec2PerCm: number;
  readonly stiffnessNPerCm: number;
  readonly dampingNSecPerCm: number;
};

export type SharedAVPlaneStateV1 = {
  readonly positionCm: number;
  readonly velocityCmPerSec: number;
};

export type SharedAVPlaneInputV1 = {
  readonly dtSec: number;
  readonly atrialTransmuralPressureMmHg: number;
  readonly ventricularTransmuralPressureMmHg: number;
  readonly atrialActiveStressKPa: number;
  readonly ventricularActiveStressKPa: number;
};

export type SharedAVPlaneOutputV1 = {
  readonly state: SharedAVPlaneStateV1;
  readonly positionCm: number;
  readonly velocityCmPerSec: number;
  readonly atrialDisplacedVolumeMl: number;
  readonly ventricularDisplacedVolumeMl: number;
  readonly ventricularActiveForceN: number;
  readonly atrialActiveForceN: number;
  readonly hydraulicForceN: number;
  readonly springForceN: number;
  readonly dampingForceN: number;
  readonly inertialForceN: number;
  readonly forceBalanceResidualN: number;
  readonly kinematicResidualCm: number;
  readonly activePowerW: number;
  readonly hydraulicPowerW: number;
};

const KPA_CM2_TO_N = 0.1;
const MMHG_CM2_TO_N = 0.0133322;
const N_CM_PER_SEC_TO_W = 0.01;

export function initialSharedAVPlaneStateV1(
  positionCm = 0,
  velocityCmPerSec = 0,
): SharedAVPlaneStateV1 {
  return { positionCm, velocityCmPerSec };
}

export function stepSharedAVPlaneV1(
  previous: SharedAVPlaneStateV1,
  input: SharedAVPlaneInputV1,
  params: SharedAVPlaneParamsV1,
): SharedAVPlaneOutputV1 {
  const dtSec = Math.max(input.dtSec, 1e-9);
  const forces = drivingForces(input, params);
  const inertia = Math.max(params.inertiaNSec2PerCm, 1e-9);
  const damping = Math.max(params.dampingNSecPerCm, 0);
  const stiffness = Math.max(params.stiffnessNPerCm, 0);
  const appliedForceN = forces.ventricularActiveForceN -
    forces.atrialActiveForceN + forces.hydraulicForceN;
  const velocityCmPerSec = (
    inertia / dtSec * previous.velocityCmPerSec + appliedForceN -
    stiffness * (previous.positionCm - params.referencePositionCm)
  ) / Math.max(inertia / dtSec + damping + stiffness * dtSec, 1e-9);
  const positionCm = previous.positionCm + dtSec * velocityCmPerSec;
  return evaluateSharedAVPlaneStateV1(
    previous,
    { positionCm, velocityCmPerSec },
    input,
    params,
  );
}

export function evaluateSharedAVPlaneStateV1(
  previous: SharedAVPlaneStateV1,
  state: SharedAVPlaneStateV1,
  input: SharedAVPlaneInputV1,
  params: SharedAVPlaneParamsV1,
): SharedAVPlaneOutputV1 {
  const dtSec = Math.max(input.dtSec, 1e-9);
  const forces = drivingForces(input, params);
  const velocityCmPerSec = state.velocityCmPerSec;
  const accelerationCmPerSec2 = (
    state.velocityCmPerSec - previous.velocityCmPerSec
  ) / dtSec;
  const springForceN = -Math.max(params.stiffnessNPerCm, 0) *
    (state.positionCm - params.referencePositionCm);
  const dampingForceN = -Math.max(params.dampingNSecPerCm, 0) * velocityCmPerSec;
  const inertialForceN = -Math.max(params.inertiaNSec2PerCm, 0) * accelerationCmPerSec2;
  const netActiveForceN = forces.ventricularActiveForceN - forces.atrialActiveForceN;
  const forceBalanceResidualN = netActiveForceN + forces.hydraulicForceN +
    springForceN + dampingForceN + inertialForceN;
  const kinematicResidualCm = state.positionCm - previous.positionCm -
    dtSec * state.velocityCmPerSec;
  return {
    state: {
      positionCm: state.positionCm,
      velocityCmPerSec: state.velocityCmPerSec,
    },
    positionCm: state.positionCm,
    velocityCmPerSec,
    atrialDisplacedVolumeMl: params.atrialAreaCm2 *
      (state.positionCm - params.referencePositionCm),
    ventricularDisplacedVolumeMl: params.ventricularAreaCm2 *
      (state.positionCm - params.referencePositionCm),
    ventricularActiveForceN: forces.ventricularActiveForceN,
    atrialActiveForceN: forces.atrialActiveForceN,
    hydraulicForceN: forces.hydraulicForceN,
    springForceN,
    dampingForceN,
    inertialForceN,
    forceBalanceResidualN,
    kinematicResidualCm,
    activePowerW: netActiveForceN * velocityCmPerSec * N_CM_PER_SEC_TO_W,
    hydraulicPowerW: forces.hydraulicForceN * velocityCmPerSec * N_CM_PER_SEC_TO_W,
  };
}

function drivingForces(
  input: SharedAVPlaneInputV1,
  params: SharedAVPlaneParamsV1,
): {
  readonly ventricularActiveForceN: number;
  readonly atrialActiveForceN: number;
  readonly hydraulicForceN: number;
} {
  const ventricularActiveForceN = Math.max(input.ventricularActiveStressKPa, 0) *
    Math.max(params.ventricularLongitudinalTissueAreaCm2, 0) *
    clamp01(params.ventricularFiberProjection01) * KPA_CM2_TO_N;
  const atrialActiveForceN = Math.max(input.atrialActiveStressKPa, 0) *
    Math.max(params.atrialLongitudinalTissueAreaCm2, 0) *
    clamp01(params.atrialFiberProjection01) * KPA_CM2_TO_N;
  const hydraulicForceN = (
    Math.max(params.atrialAreaCm2, 0) * input.atrialTransmuralPressureMmHg -
    Math.max(params.ventricularAreaCm2, 0) * input.ventricularTransmuralPressureMmHg
  ) * MMHG_CM2_TO_N;
  return { ventricularActiveForceN, atrialActiveForceN, hydraulicForceN };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
