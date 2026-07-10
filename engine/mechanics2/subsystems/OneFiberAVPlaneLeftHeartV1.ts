import {
  evaluateOneFiberChamberWallV1,
  initialOneFiberChamberWallStateV1,
  stepOneFiberChamberWallV1,
  type OneFiberChamberWallOutputV1,
  type OneFiberChamberWallParamsV1,
  type OneFiberChamberWallStateV1,
} from "@/engine/mechanics2/atrial/OneFiberChamberWallV1";
import {
  evaluateSharedAVPlaneStateV1,
  initialSharedAVPlaneStateV1,
  type SharedAVPlaneOutputV1,
  type SharedAVPlaneParamsV1,
  type SharedAVPlaneStateV1,
} from "@/engine/mechanics2/core/SharedAVPlaneV1";
import {
  evaluateSmoothInertialValveStateV2,
  initialSmoothInertialValveStateV2,
  type SmoothInertialValveOutputV2,
  type SmoothInertialValveParamsV2,
  type SmoothInertialValveStateV2,
} from "@/engine/mechanics2/valve/SmoothInertialValveV2";

export type OneFiberAVPlaneLeftHeartParamsV1 = {
  readonly laWall: OneFiberChamberWallParamsV1;
  readonly lvWall: OneFiberChamberWallParamsV1;
  readonly avPlane: SharedAVPlaneParamsV1;
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

export type OneFiberAVPlaneLeftHeartStateV1 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly laWall: OneFiberChamberWallStateV1;
  readonly lvWall: OneFiberChamberWallStateV1;
  readonly avPlane: SharedAVPlaneStateV1;
  readonly mitralValve: SmoothInertialValveStateV2;
  readonly aorticValve: SmoothInertialValveStateV2;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly pulmonaryVenousFlowMlPerSec: number;
  readonly aorticPressureMmHg: number;
  readonly returnReservoirPressureMmHg: number;
};

export type OneFiberAVPlaneLeftHeartInputV1 = {
  readonly dtSec: number;
  readonly laElectricalActivation01: number;
  readonly lvElectricalActivation01: number;
  readonly pericardialPressureMmHg?: number;
};

export type OneFiberAVPlaneLeftHeartResidualV1 = {
  readonly laMassResidualMl: number;
  readonly lvMassResidualMl: number;
  readonly pulmonaryVenousComplianceResidualMmHg: number;
  readonly pulmonaryVenousMomentumResidualMmHg: number;
  readonly mitralMomentumResidualMmHg: number;
  readonly aorticMomentumResidualMmHg: number;
  readonly aorticComplianceResidualMmHg: number;
  readonly returnReservoirComplianceResidualMmHg: number;
  readonly closedCircuitVolumeResidualMl: number;
  readonly avPlaneKinematicResidualCm: number;
  readonly avPlaneForceResidualN: number;
  readonly maxNormalizedEquationResidual: number;
  readonly solverIterations: number;
  readonly solverConverged: boolean;
};

export type OneFiberAVPlaneLeftHeartOutputV1 = {
  readonly state: OneFiberAVPlaneLeftHeartStateV1;
  readonly la: OneFiberChamberWallOutputV1;
  readonly lv: OneFiberChamberWallOutputV1;
  readonly avPlane: SharedAVPlaneOutputV1;
  readonly mitralValve: SmoothInertialValveOutputV2;
  readonly aorticValve: SmoothInertialValveOutputV2;
  readonly pulmonaryVenousFlowMlPerSec: number;
  readonly pulmonarySourceFlowMlPerSec: number;
  readonly systemicOutflowMlPerSec: number;
  readonly residual: OneFiberAVPlaneLeftHeartResidualV1;
  readonly allFinite: boolean;
};

export const DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1:
OneFiberAVPlaneLeftHeartParamsV1 = {
  laWall: {
    chamberId: "LA",
    wallVolumeMl: 22,
    referenceFreeWallVolumeMl: 39,
    passiveStiffnessKPa: 30,
    passiveExponent: 8,
    activeStressMaxKPa: 8,
    activeLengthPeakNorm: 1.08,
    activeLengthWidthNorm: 0.22,
    activationRiseTauSec: 0.025,
    activationFallTauSec: 0.075,
    wallViscosityKPaSec: 4,
    tensileStrainSmoothing: 1e-4,
  },
  lvWall: {
    chamberId: "LV",
    wallVolumeMl: 120,
    referenceFreeWallVolumeMl: 80,
    passiveStiffnessKPa: 12,
    passiveExponent: 24,
    activeStressMaxKPa: 72,
    activeLengthPeakNorm: 1.22,
    activeLengthWidthNorm: 0.18,
    activationRiseTauSec: 0.030,
    activationFallTauSec: 0.040,
    wallViscosityKPaSec: 0,
    tensileStrainSmoothing: 1e-4,
  },
  avPlane: {
    atrialAreaCm2: 25,
    ventricularAreaCm2: 37.5,
    atrialLongitudinalTissueAreaCm2: 4.5,
    ventricularLongitudinalTissueAreaCm2: 36,
    atrialFiberProjection01: 0.70,
    ventricularFiberProjection01: 0.95,
    referencePositionCm: 0,
    inertiaNSec2PerCm: 1.1,
    stiffnessNPerCm: 25,
    dampingNSecPerCm: 20,
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

export function initialOneFiberAVPlaneLeftHeartStateV1(
  overrides: Partial<OneFiberAVPlaneLeftHeartStateV1> = {},
  params: OneFiberAVPlaneLeftHeartParamsV1 = DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1,
): OneFiberAVPlaneLeftHeartStateV1 {
  return {
    laVolumeMl: overrides.laVolumeMl ?? 65,
    lvVolumeMl: overrides.lvVolumeMl ?? 120,
    laWall: overrides.laWall ?? initialOneFiberChamberWallStateV1(),
    lvWall: overrides.lvWall ?? initialOneFiberChamberWallStateV1(),
    avPlane: overrides.avPlane ?? initialSharedAVPlaneStateV1(),
    mitralValve: overrides.mitralValve ?? initialSmoothInertialValveStateV2(),
    aorticValve: overrides.aorticValve ?? initialSmoothInertialValveStateV2(),
    pulmonaryVenousPressureMmHg: overrides.pulmonaryVenousPressureMmHg ?? 9,
    pulmonaryVenousFlowMlPerSec: overrides.pulmonaryVenousFlowMlPerSec ?? 65,
    aorticPressureMmHg: overrides.aorticPressureMmHg ?? 90,
    returnReservoirPressureMmHg: overrides.returnReservoirPressureMmHg ??
      params.initialReturnReservoirPressureMmHg,
  };
}

export function stepOneFiberAVPlaneLeftHeartV1(
  previous: OneFiberAVPlaneLeftHeartStateV1,
  input: OneFiberAVPlaneLeftHeartInputV1,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): OneFiberAVPlaneLeftHeartOutputV1 {
  const wallStates = nextWallStates(previous, input, params);
  const initial = predictorVector(previous, input, params);
  const solved = solveImplicitStep(previous, wallStates, initial, input, params);
  const accepted = stateFromVector(solved.vector, wallStates);
  const evaluated = evaluateSystem(previous, accepted, input, params);
  const residual = residualReadback(evaluated, solved, params);
  const numericValues = [
    ...solved.vector,
    ...Object.values(residual).filter((value): value is number => typeof value === "number"),
    evaluated.la.cavityPressureMmHg,
    evaluated.lv.cavityPressureMmHg,
    evaluated.avPlane.velocityCmPerSec,
    evaluated.pulmonarySourceFlowMlPerSec,
    evaluated.systemicOutflowMlPerSec,
  ];
  return {
    state: accepted,
    la: evaluated.la,
    lv: evaluated.lv,
    avPlane: evaluated.avPlane,
    mitralValve: evaluated.mitralValve,
    aorticValve: evaluated.aorticValve,
    pulmonaryVenousFlowMlPerSec: accepted.pulmonaryVenousFlowMlPerSec,
    pulmonarySourceFlowMlPerSec: evaluated.pulmonarySourceFlowMlPerSec,
    systemicOutflowMlPerSec: evaluated.systemicOutflowMlPerSec,
    residual,
    allFinite: numericValues.every(Number.isFinite),
  };
}

type WallStates = {
  readonly la: OneFiberChamberWallStateV1;
  readonly lv: OneFiberChamberWallStateV1;
};

type EvaluatedSystem = {
  readonly la: OneFiberChamberWallOutputV1;
  readonly lv: OneFiberChamberWallOutputV1;
  readonly avPlane: SharedAVPlaneOutputV1;
  readonly mitralValve: SmoothInertialValveOutputV2;
  readonly aorticValve: SmoothInertialValveOutputV2;
  readonly pulmonarySourceFlowMlPerSec: number;
  readonly systemicOutflowMlPerSec: number;
  readonly physicalResiduals: readonly number[];
  readonly normalizedResiduals: readonly number[];
};

type SolverResult = {
  readonly vector: readonly number[];
  readonly iterations: number;
  readonly converged: boolean;
  readonly maxNormalizedResidual: number;
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

function nextWallStates(
  previous: OneFiberAVPlaneLeftHeartStateV1,
  input: OneFiberAVPlaneLeftHeartInputV1,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): WallStates {
  const geometry = freeWallVolumes(previous, params);
  const common = {
    dtSec: input.dtSec,
    previousFreeWallVolumeMl: geometry.laFreeWallVolumeMl,
    pericardialPressureMmHg: input.pericardialPressureMmHg ?? 0,
  };
  const la = stepOneFiberChamberWallV1(previous.laWall, {
    ...common,
    electricalActivation01: input.laElectricalActivation01,
    freeWallVolumeMl: geometry.laFreeWallVolumeMl,
  }, params.laWall).state;
  const lv = stepOneFiberChamberWallV1(previous.lvWall, {
    ...common,
    electricalActivation01: input.lvElectricalActivation01,
    freeWallVolumeMl: geometry.lvFreeWallVolumeMl,
    previousFreeWallVolumeMl: geometry.lvFreeWallVolumeMl,
  }, params.lvWall).state;
  return { la, lv };
}

function predictorVector(
  previous: OneFiberAVPlaneLeftHeartStateV1,
  input: OneFiberAVPlaneLeftHeartInputV1,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): readonly number[] {
  const dtSec = Math.max(input.dtSec, 1e-9);
  const pulmonarySourceFlow = (
    previous.returnReservoirPressureMmHg -
    previous.pulmonaryVenousPressureMmHg
  ) / Math.max(params.pulmonarySourceResistanceMmHgSecPerMl, 1e-9);
  const systemicOutflow = (
    previous.aorticPressureMmHg -
    previous.returnReservoirPressureMmHg
  ) / Math.max(params.systemicResistanceMmHgSecPerMl, 1e-9);
  return [
    previous.laVolumeMl + dtSec * (
      previous.pulmonaryVenousFlowMlPerSec - previous.mitralValve.qMlPerSec
    ),
    previous.lvVolumeMl + dtSec * (
      previous.mitralValve.qMlPerSec - previous.aorticValve.qMlPerSec
    ),
    previous.avPlane.positionCm + dtSec * previous.avPlane.velocityCmPerSec,
    previous.avPlane.velocityCmPerSec,
    previous.mitralValve.qMlPerSec,
    previous.aorticValve.qMlPerSec,
    previous.pulmonaryVenousPressureMmHg + dtSec * (
      pulmonarySourceFlow - previous.pulmonaryVenousFlowMlPerSec
    ) / Math.max(params.pulmonaryVenousComplianceMlPerMmHg, 1e-9),
    previous.pulmonaryVenousFlowMlPerSec,
    previous.aorticPressureMmHg + dtSec * (
      previous.aorticValve.qMlPerSec - systemicOutflow
    ) / Math.max(params.aorticComplianceMlPerMmHg, 1e-9),
    previous.returnReservoirPressureMmHg + dtSec * (
      systemicOutflow - pulmonarySourceFlow
    ) / Math.max(params.returnReservoirComplianceMlPerMmHg, 1e-9),
  ];
}

function solveImplicitStep(
  previous: OneFiberAVPlaneLeftHeartStateV1,
  wallStates: WallStates,
  initial: readonly number[],
  input: OneFiberAVPlaneLeftHeartInputV1,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): SolverResult {
  let vector = admissible(initial, params)
    ? [...initial]
    : vectorFromState(previous);
  let evaluated = evaluateVector(previous, wallStates, vector, input, params);
  let norm = maxAbs(evaluated.normalizedResiduals);
  let iterations = 0;
  for (; iterations < Math.max(1, params.nonlinearSolverIterations); iterations += 1) {
    if (norm <= params.nonlinearResidualTolerance) break;
    const jacobian = finiteDifferenceJacobian(
      previous,
      wallStates,
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
      if (admissible(trial, params)) {
        const trialEvaluation = evaluateVector(previous, wallStates, trial, input, params);
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
  previous: OneFiberAVPlaneLeftHeartStateV1,
  wallStates: WallStates,
  vector: readonly number[],
  baseResidual: readonly number[],
  input: OneFiberAVPlaneLeftHeartInputV1,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): number[][] {
  const jacobian = baseResidual.map(() => Array(vector.length).fill(0) as number[]);
  for (let column = 0; column < vector.length; column += 1) {
    const magnitude = Math.max(Math.abs(vector[column]!), VARIABLE_SCALES[column]!, 1);
    const forwardStep = 1e-6 * magnitude;
    let delta = forwardStep;
    let perturbed = vector.map((value, index) => index === column ? value + delta : value);
    if (!admissible(perturbed, params)) {
      delta = -forwardStep;
      perturbed = vector.map((value, index) => index === column ? value + delta : value);
    }
    const residual = evaluateVector(
      previous,
      wallStates,
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
  previous: OneFiberAVPlaneLeftHeartStateV1,
  wallStates: WallStates,
  vector: readonly number[],
  input: OneFiberAVPlaneLeftHeartInputV1,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): EvaluatedSystem {
  return evaluateSystem(previous, stateFromVector(vector, wallStates), input, params);
}

function evaluateSystem(
  previous: OneFiberAVPlaneLeftHeartStateV1,
  state: OneFiberAVPlaneLeftHeartStateV1,
  input: OneFiberAVPlaneLeftHeartInputV1,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): EvaluatedSystem {
  const dtSec = Math.max(input.dtSec, 1e-9);
  const previousGeometry = freeWallVolumes(previous, params);
  const geometry = freeWallVolumes(state, params);
  const pericardialPressureMmHg = input.pericardialPressureMmHg ?? 0;
  const la = evaluateOneFiberChamberWallV1(state.laWall, {
    dtSec,
    electricalActivation01: input.laElectricalActivation01,
    freeWallVolumeMl: geometry.laFreeWallVolumeMl,
    previousFreeWallVolumeMl: previousGeometry.laFreeWallVolumeMl,
    pericardialPressureMmHg,
  }, params.laWall);
  const lv = evaluateOneFiberChamberWallV1(state.lvWall, {
    dtSec,
    electricalActivation01: input.lvElectricalActivation01,
    freeWallVolumeMl: geometry.lvFreeWallVolumeMl,
    previousFreeWallVolumeMl: previousGeometry.lvFreeWallVolumeMl,
    pericardialPressureMmHg,
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
  const avPlane = evaluateSharedAVPlaneStateV1(previous.avPlane, state.avPlane, {
    dtSec,
    atrialTransmuralPressureMmHg: la.transmuralPressureMmHg,
    ventricularTransmuralPressureMmHg: lv.transmuralPressureMmHg,
    atrialActiveStressKPa: la.activeStressKPa,
    ventricularActiveStressKPa: lv.activeStressKPa,
  }, params.avPlane);
  const pulmonarySourceFlowMlPerSec = (
    state.returnReservoirPressureMmHg -
    state.pulmonaryVenousPressureMmHg
  ) / Math.max(params.pulmonarySourceResistanceMmHgSecPerMl, 1e-9);
  const systemicOutflowMlPerSec = (
    state.aorticPressureMmHg -
    state.returnReservoirPressureMmHg
  ) / Math.max(params.systemicResistanceMmHgSecPerMl, 1e-9);
  const physicalResiduals = [
    state.laVolumeMl - previous.laVolumeMl - dtSec * (
      state.pulmonaryVenousFlowMlPerSec - state.mitralValve.qMlPerSec
    ),
    state.lvVolumeMl - previous.lvVolumeMl - dtSec * (
      state.mitralValve.qMlPerSec - state.aorticValve.qMlPerSec
    ),
    avPlane.kinematicResidualCm,
    avPlane.forceBalanceResidualN,
    mitralValve.pressureFlowResidualMmHg,
    aorticValve.pressureFlowResidualMmHg,
    state.pulmonaryVenousPressureMmHg - previous.pulmonaryVenousPressureMmHg -
      dtSec * (pulmonarySourceFlowMlPerSec - state.pulmonaryVenousFlowMlPerSec) /
      Math.max(params.pulmonaryVenousComplianceMlPerMmHg, 1e-9),
    state.pulmonaryVenousPressureMmHg - la.cavityPressureMmHg -
      params.pulmonaryVenousResistanceMmHgSecPerMl * state.pulmonaryVenousFlowMlPerSec -
      params.pulmonaryVenousInertanceMmHgSec2PerMl * (
        state.pulmonaryVenousFlowMlPerSec - previous.pulmonaryVenousFlowMlPerSec
      ) / dtSec,
    state.aorticPressureMmHg - previous.aorticPressureMmHg -
      dtSec * (state.aorticValve.qMlPerSec - systemicOutflowMlPerSec) /
      Math.max(params.aorticComplianceMlPerMmHg, 1e-9),
    state.returnReservoirPressureMmHg - previous.returnReservoirPressureMmHg -
      dtSec * (systemicOutflowMlPerSec - pulmonarySourceFlowMlPerSec) /
      Math.max(params.returnReservoirComplianceMlPerMmHg, 1e-9),
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
    avPlane,
    mitralValve,
    aorticValve,
    pulmonarySourceFlowMlPerSec,
    systemicOutflowMlPerSec,
    physicalResiduals,
    normalizedResiduals,
  };
}

function residualReadback(
  evaluated: EvaluatedSystem,
  solved: SolverResult,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): OneFiberAVPlaneLeftHeartResidualV1 {
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
    closedCircuitVolumeResidualMl: evaluated.physicalResiduals[0]! +
      evaluated.physicalResiduals[1]! +
      params.pulmonaryVenousComplianceMlPerMmHg * evaluated.physicalResiduals[6]! +
      params.aorticComplianceMlPerMmHg * evaluated.physicalResiduals[8]! +
      params.returnReservoirComplianceMlPerMmHg * evaluated.physicalResiduals[9]!,
    maxNormalizedEquationResidual: maxAbs(evaluated.normalizedResiduals),
    solverIterations: solved.iterations,
    solverConverged: solved.converged,
  };
}

function stateFromVector(
  vector: readonly number[],
  wallStates: WallStates,
): OneFiberAVPlaneLeftHeartStateV1 {
  return {
    laVolumeMl: vector[LA_VOLUME]!,
    lvVolumeMl: vector[LV_VOLUME]!,
    laWall: wallStates.la,
    lvWall: wallStates.lv,
    avPlane: {
      positionCm: vector[AV_POSITION]!,
      velocityCmPerSec: vector[AV_VELOCITY]!,
    },
    mitralValve: { qMlPerSec: vector[MITRAL_FLOW]! },
    aorticValve: { qMlPerSec: vector[AORTIC_FLOW]! },
    pulmonaryVenousPressureMmHg: vector[PV_PRESSURE]!,
    pulmonaryVenousFlowMlPerSec: vector[PV_FLOW]!,
    aorticPressureMmHg: vector[AORTIC_PRESSURE]!,
    returnReservoirPressureMmHg: vector[RETURN_PRESSURE]!,
  };
}

function vectorFromState(state: OneFiberAVPlaneLeftHeartStateV1): readonly number[] {
  return [
    state.laVolumeMl,
    state.lvVolumeMl,
    state.avPlane.positionCm,
    state.avPlane.velocityCmPerSec,
    state.mitralValve.qMlPerSec,
    state.aorticValve.qMlPerSec,
    state.pulmonaryVenousPressureMmHg,
    state.pulmonaryVenousFlowMlPerSec,
    state.aorticPressureMmHg,
    state.returnReservoirPressureMmHg,
  ];
}

function freeWallVolumes(
  state: OneFiberAVPlaneLeftHeartStateV1,
  params: OneFiberAVPlaneLeftHeartParamsV1,
): { readonly laFreeWallVolumeMl: number; readonly lvFreeWallVolumeMl: number } {
  const displacementCm = state.avPlane.positionCm - params.avPlane.referencePositionCm;
  return {
    laFreeWallVolumeMl: state.laVolumeMl - params.avPlane.atrialAreaCm2 * displacementCm,
    lvFreeWallVolumeMl: state.lvVolumeMl + params.avPlane.ventricularAreaCm2 * displacementCm,
  };
}

function admissible(vector: readonly number[], params: OneFiberAVPlaneLeftHeartParamsV1): boolean {
  if (vector.length !== VARIABLE_SCALES.length || vector.some((value) => !Number.isFinite(value))) {
    return false;
  }
  const state = stateFromVector(vector, {
    la: initialOneFiberChamberWallStateV1(),
    lv: initialOneFiberChamberWallStateV1(),
  });
  const geometry = freeWallVolumes(state, params);
  return state.laVolumeMl > 0.1 && state.lvVolumeMl > 0.1 &&
    geometry.laFreeWallVolumeMl > 0.1 && geometry.lvFreeWallVolumeMl > 0.1 &&
    Math.abs(state.avPlane.positionCm - params.avPlane.referencePositionCm) < 5 &&
    Math.abs(state.avPlane.velocityCmPerSec) < 100 &&
    state.pulmonaryVenousPressureMmHg > 0.1 && state.aorticPressureMmHg > 0.1 &&
    state.returnReservoirPressureMmHg > 0.1;
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
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}
