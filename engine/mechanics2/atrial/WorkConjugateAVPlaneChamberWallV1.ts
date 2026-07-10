export type WorkConjugateAVPlaneChamberIdV1 = "LA" | "LV";

export type WorkConjugateAVPlaneAxisIdV1 = "circumferential" | "longitudinal";

export type WorkConjugateAVPlaneAxisPairV1<T> = {
  readonly circumferential: T;
  readonly longitudinal: T;
};

export type WorkConjugateAVPlaneAxisParamsV1 = {
  readonly passiveStressScaleKPa: number;
  readonly passiveExponent: number;
  readonly passiveSlackStrain?: number;
  readonly activeStressMaxKPa: number;
  readonly activeStrainPeak: number;
  readonly activeStrainWidth: number;
  readonly viscosityKPaSec: number;
};

export type WorkConjugateAVPlaneChamberWallParamsV1 = {
  readonly chamberId: WorkConjugateAVPlaneChamberIdV1;
  readonly wallVolumeMl: number;
  readonly referenceBloodVolumeMl: number;
  readonly referenceLengthCm: number;
  /**
   * Shared AV-plane coordinate in cm. +z is apexward. LA uses zSign=+1, so
   * apexward motion lengthens the LA cylinder; LV uses zSign=-1, so the same
   * shared +z motion shortens the LV cylinder.
   */
  readonly referenceAVPlanePositionCm?: number;
  /**
   * Axis params are intentionally structured per axis. The default builder ties
   * passive slack and Gaussian length-tension location/width across both axes,
   * while allowing stress scales and viscosity to differ. A single input
   * activation scalar drives active stress in both axes.
   */
  readonly axes: WorkConjugateAVPlaneAxisPairV1<WorkConjugateAVPlaneAxisParamsV1>;
};

export type WorkConjugateAVPlaneChamberWallInputV1 = {
  readonly bloodVolumeMl: number;
  readonly bloodVolumeDotMlPerSec: number;
  /**
   * Shared AV-plane coordinate in cm. +z is apexward. The chamber zSign maps
   * this coordinate into the chamber cylinder length.
   */
  readonly avPlanePositionCm: number;
  /**
   * Shared AV-plane velocity in cm/s. Positive values are apexward.
   */
  readonly avPlaneVelocityCmPerSec: number;
  readonly activation01: number;
  readonly pericardialPressureKPa: number;
};

export type WorkConjugateAVPlaneComponentBreakdownV1 = {
  readonly passive: number;
  readonly active: number;
  readonly viscous: number;
  readonly total: number;
};

export type WorkConjugateAVPlaneGeometryV1 = {
  readonly bloodVolumeMl: number;
  readonly wallVolumeMl: number;
  readonly midwallVolumeMl: number;
  readonly referenceBloodVolumeMl: number;
  readonly referenceMidwallVolumeMl: number;
  readonly lengthCm: number;
  readonly referenceLengthCm: number;
  readonly midwallAreaCm2: number;
  readonly referenceMidwallAreaCm2: number;
  readonly avPlanePositionCm: number;
  readonly referenceAVPlanePositionCm: number;
  /**
   * LA: +1, LV: -1. This maps the shared +z apexward coordinate into chamber
   * length ell = ell0 + zSign * (z - z0).
   */
  readonly zSign: 1 | -1;
};

export type WorkConjugateAVPlaneKinematicsV1 = {
  readonly bloodVolumeDotMlPerSec: number;
  readonly avPlaneVelocityCmPerSec: number;
  readonly lengthDotCmPerSec: number;
};

export type WorkConjugateAVPlanePowerV1 = {
  readonly pressurePowerW: number;
  readonly zForcePowerW: number;
  readonly wallPowerW: number;
  readonly stressPowerW: number;
  readonly passiveWallPowerW: number;
  readonly activeWallPowerW: number;
  readonly viscousWallPowerW: number;
  readonly viscousDissipationW: number;
  readonly rawPowerResidualW: number;
};

export type WorkConjugateAVPlaneZForceAxisDecompositionV1 = {
  /**
   * Circumferential force contribution computed as
   * zSign * 0.1 * transmuralPressureKPa * midwallAreaCm2. Units are N, and a
   * positive value acts along the shared +z apexward coordinate.
   */
  readonly circumferentialPressureAreaForceN: WorkConjugateAVPlaneComponentBreakdownV1;
  /**
   * Same circumferential contribution computed directly from stress:
   * zSign * 0.1 * VwallMl / lengthCm * 0.5 * sigmaCircumferentialKPa.
   */
  readonly circumferentialStressForceN: WorkConjugateAVPlaneComponentBreakdownV1;
  /**
   * Longitudinal contribution computed directly from stress:
   * zSign * 0.1 * VwallMl / lengthCm * -sigmaLongitudinalKPa.
   */
  readonly longitudinalStressForceN: WorkConjugateAVPlaneComponentBreakdownV1;
  readonly reconstructedTotalForceN: WorkConjugateAVPlaneComponentBreakdownV1;
  readonly circumferentialPressureAreaResidualN: WorkConjugateAVPlaneComponentBreakdownV1;
  readonly maxAbsCircumferentialPressureAreaResidualN: number;
  readonly rawTotalForceResidualN: number;
};

export type WorkConjugateAVPlaneChamberWallOutputV1 = {
  readonly valid: boolean;
  readonly finite: boolean;
  readonly invalidReason: string | null;
  readonly chamberId: WorkConjugateAVPlaneChamberIdV1;
  readonly activation01: number;
  readonly pericardialPressureKPa: number;
  readonly geometry: WorkConjugateAVPlaneGeometryV1;
  readonly kinematics: WorkConjugateAVPlaneKinematicsV1;
  readonly strains: WorkConjugateAVPlaneAxisPairV1<number>;
  readonly strainRatesPerSec: WorkConjugateAVPlaneAxisPairV1<number>;
  readonly stressesKPa: WorkConjugateAVPlaneAxisPairV1<WorkConjugateAVPlaneComponentBreakdownV1>;
  readonly transmuralPressureKPa: WorkConjugateAVPlaneComponentBreakdownV1;
  readonly transmuralPressureMmHg: WorkConjugateAVPlaneComponentBreakdownV1;
  readonly cavityPressureKPa: number;
  readonly cavityPressureMmHg: number;
  readonly zForceN: WorkConjugateAVPlaneComponentBreakdownV1;
  readonly zForceAxisDecompositionN: WorkConjugateAVPlaneZForceAxisDecompositionV1;
  readonly power: WorkConjugateAVPlanePowerV1;
};

export const WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1 = 7.500616827041697;

const KPA_ML_PER_SEC_TO_W = 1e-3;
const CM_PER_SEC_TO_M_PER_SEC = 0.01;
const KPA_CM2_TO_N = 0.1;
const MIN_POSITIVE_GEOMETRY_V1 = 1e-9;

const DEFAULT_PASSIVE_EXPONENT_V1 = 9;
const DEFAULT_PASSIVE_SLACK_STRAIN_V1 = 0;
const DEFAULT_ACTIVE_STRAIN_PEAK_V1 = 0.04;
const DEFAULT_ACTIVE_STRAIN_WIDTH_V1 = 0.22;
const LONGITUDINAL_PASSIVE_STRESS_RATIO_V1 = 0.85;
const LONGITUDINAL_ACTIVE_STRESS_RATIO_V1 = 0.75;
const LONGITUDINAL_VISCOSITY_RATIO_V1 = 1.4;

type WorkConjugateChamberSeedV1 = {
  readonly wallVolumeMl: number;
  readonly referenceBloodVolumeMl: number;
  readonly referenceLengthCm: number;
  readonly circumferentialPassiveStressScaleKPa: number;
  readonly circumferentialActiveStressMaxKPa: number;
  readonly circumferentialViscosityKPaSec: number;
};

const DEFAULT_CHAMBER_SEEDS_V1: Record<
  WorkConjugateAVPlaneChamberIdV1,
  WorkConjugateChamberSeedV1
> = {
  LA: {
    wallVolumeMl: 20,
    referenceBloodVolumeMl: 45,
    referenceLengthCm: 5.5,
    circumferentialPassiveStressScaleKPa: 2.2,
    circumferentialActiveStressMaxKPa: 4.2,
    circumferentialViscosityKPaSec: 0.035,
  },
  LV: {
    wallVolumeMl: 120,
    referenceBloodVolumeMl: 120,
    referenceLengthCm: 8.5,
    circumferentialPassiveStressScaleKPa: 16,
    circumferentialActiveStressMaxKPa: 85,
    circumferentialViscosityKPaSec: 0.09,
  },
};

/**
 * Chamber-specific engineering seeds, not tuned physiology. LA and LV share the
 * same activation input and tied active peak/width; longitudinal stress scales
 * are fixed anisotropy ratios of the chamber's circumferential seed. LV active
 * stress seeds are intentionally materially higher than LA seeds.
 */
export function defaultWorkConjugateAVPlaneChamberWallParamsV1(
  chamberId: WorkConjugateAVPlaneChamberIdV1,
): WorkConjugateAVPlaneChamberWallParamsV1 {
  const seed = DEFAULT_CHAMBER_SEEDS_V1[chamberId];
  const circumferential = axisParamsFromSeedV1(
    seed.circumferentialPassiveStressScaleKPa,
    seed.circumferentialActiveStressMaxKPa,
    seed.circumferentialViscosityKPaSec,
  );
  return {
    chamberId,
    wallVolumeMl: seed.wallVolumeMl,
    referenceBloodVolumeMl: seed.referenceBloodVolumeMl,
    referenceLengthCm: seed.referenceLengthCm,
    referenceAVPlanePositionCm: 0,
    axes: {
      circumferential,
      longitudinal: {
        ...circumferential,
        passiveStressScaleKPa: circumferential.passiveStressScaleKPa *
          LONGITUDINAL_PASSIVE_STRESS_RATIO_V1,
        activeStressMaxKPa: circumferential.activeStressMaxKPa *
          LONGITUDINAL_ACTIVE_STRESS_RATIO_V1,
        viscosityKPaSec: circumferential.viscosityKPaSec *
          LONGITUDINAL_VISCOSITY_RATIO_V1,
      },
    },
  };
}

/**
 * Pure cylinder-like midwall chamber-wall evaluator. The shared coordinate z is
 * apexward-positive; zSign is +1 for LA and -1 for LV.
 */
export function evaluateWorkConjugateAVPlaneChamberWallV1(
  input: WorkConjugateAVPlaneChamberWallInputV1,
  params: WorkConjugateAVPlaneChamberWallParamsV1,
): WorkConjugateAVPlaneChamberWallOutputV1 {
  const invalidReason = validateInputAndParams(input, params);
  if (invalidReason !== null) {
    return invalidWorkConjugateOutputV1(input, params, invalidReason);
  }

  const zSign = chamberZSign(params.chamberId);
  const referenceAVPlanePositionCm = params.referenceAVPlanePositionCm ?? 0;
  const wallVolumeMl = params.wallVolumeMl;
  const midwallVolumeMl = input.bloodVolumeMl + 0.5 * wallVolumeMl;
  const referenceMidwallVolumeMl = params.referenceBloodVolumeMl + 0.5 * wallVolumeMl;
  const lengthCm = params.referenceLengthCm + zSign *
    (input.avPlanePositionCm - referenceAVPlanePositionCm);
  const lengthDotCmPerSec = zSign * input.avPlaneVelocityCmPerSec;
  const midwallAreaCm2 = midwallVolumeMl / lengthCm;
  const referenceMidwallAreaCm2 = referenceMidwallVolumeMl / params.referenceLengthCm;
  const circumferentialStrain = 0.5 * Math.log(midwallAreaCm2 / referenceMidwallAreaCm2);
  const longitudinalStrain = Math.log(lengthCm / params.referenceLengthCm);
  const circumferentialStrainRatePerSec = 0.5 *
    (input.bloodVolumeDotMlPerSec / midwallVolumeMl - lengthDotCmPerSec / lengthCm);
  const longitudinalStrainRatePerSec = lengthDotCmPerSec / lengthCm;
  const activation01 = clamp01(input.activation01);
  const circumferentialStress = evaluateAxisStressV1(
    circumferentialStrain,
    circumferentialStrainRatePerSec,
    activation01,
    params.axes.circumferential,
  );
  const longitudinalStress = evaluateAxisStressV1(
    longitudinalStrain,
    longitudinalStrainRatePerSec,
    activation01,
    params.axes.longitudinal,
  );
  const transmuralPressureKPa = componentBreakdown(
    pressureFromCircumferentialStressKPa(circumferentialStress.passive, wallVolumeMl, midwallVolumeMl),
    pressureFromCircumferentialStressKPa(circumferentialStress.active, wallVolumeMl, midwallVolumeMl),
    pressureFromCircumferentialStressKPa(circumferentialStress.viscous, wallVolumeMl, midwallVolumeMl),
  );
  const zForceN = componentBreakdown(
    forceFromAxisStressesN(
      circumferentialStress.passive,
      longitudinalStress.passive,
      wallVolumeMl,
      lengthCm,
      zSign,
    ),
    forceFromAxisStressesN(
      circumferentialStress.active,
      longitudinalStress.active,
      wallVolumeMl,
      lengthCm,
      zSign,
    ),
    forceFromAxisStressesN(
      circumferentialStress.viscous,
      longitudinalStress.viscous,
      wallVolumeMl,
      lengthCm,
      zSign,
    ),
  );
  const zForceAxisDecompositionN = buildZForceAxisDecompositionN(
    transmuralPressureKPa,
    circumferentialStress,
    longitudinalStress,
    zForceN,
    wallVolumeMl,
    lengthCm,
    midwallAreaCm2,
    zSign,
  );
  const transmuralPressureMmHg = scaleBreakdown(
    transmuralPressureKPa,
    WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1,
  );
  const cavityPressureKPa = input.pericardialPressureKPa + transmuralPressureKPa.total;
  const pressurePowerW = transmuralPressureKPa.total *
    input.bloodVolumeDotMlPerSec * KPA_ML_PER_SEC_TO_W;
  const zForcePowerW = zForceN.total *
    input.avPlaneVelocityCmPerSec * CM_PER_SEC_TO_M_PER_SEC;
  const wallPowerW = pressurePowerW - zForcePowerW;
  const passiveWallPowerW = componentStressPowerW(
    circumferentialStress.passive,
    longitudinalStress.passive,
    circumferentialStrainRatePerSec,
    longitudinalStrainRatePerSec,
    wallVolumeMl,
  );
  const activeWallPowerW = componentStressPowerW(
    circumferentialStress.active,
    longitudinalStress.active,
    circumferentialStrainRatePerSec,
    longitudinalStrainRatePerSec,
    wallVolumeMl,
  );
  const viscousWallPowerW = componentStressPowerW(
    circumferentialStress.viscous,
    longitudinalStress.viscous,
    circumferentialStrainRatePerSec,
    longitudinalStrainRatePerSec,
    wallVolumeMl,
  );
  const stressPowerW = passiveWallPowerW + activeWallPowerW + viscousWallPowerW;
  const output: WorkConjugateAVPlaneChamberWallOutputV1 = {
    valid: true,
    finite: true,
    invalidReason: null,
    chamberId: params.chamberId,
    activation01,
    pericardialPressureKPa: input.pericardialPressureKPa,
    geometry: {
      bloodVolumeMl: input.bloodVolumeMl,
      wallVolumeMl,
      midwallVolumeMl,
      referenceBloodVolumeMl: params.referenceBloodVolumeMl,
      referenceMidwallVolumeMl,
      lengthCm,
      referenceLengthCm: params.referenceLengthCm,
      midwallAreaCm2,
      referenceMidwallAreaCm2,
      avPlanePositionCm: input.avPlanePositionCm,
      referenceAVPlanePositionCm,
      zSign,
    },
    kinematics: {
      bloodVolumeDotMlPerSec: input.bloodVolumeDotMlPerSec,
      avPlaneVelocityCmPerSec: input.avPlaneVelocityCmPerSec,
      lengthDotCmPerSec,
    },
    strains: {
      circumferential: circumferentialStrain,
      longitudinal: longitudinalStrain,
    },
    strainRatesPerSec: {
      circumferential: circumferentialStrainRatePerSec,
      longitudinal: longitudinalStrainRatePerSec,
    },
    stressesKPa: {
      circumferential: circumferentialStress,
      longitudinal: longitudinalStress,
    },
    transmuralPressureKPa,
    transmuralPressureMmHg,
    cavityPressureKPa,
    cavityPressureMmHg: cavityPressureKPa * WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1,
    zForceN,
    zForceAxisDecompositionN,
    power: {
      pressurePowerW,
      zForcePowerW,
      wallPowerW,
      stressPowerW,
      passiveWallPowerW,
      activeWallPowerW,
      viscousWallPowerW,
      viscousDissipationW: viscousWallPowerW,
      rawPowerResidualW: stressPowerW - wallPowerW,
    },
  };
  return {
    ...output,
    finite: outputFinite(output),
  };
}

function axisParamsFromSeedV1(
  passiveStressScaleKPa: number,
  activeStressMaxKPa: number,
  viscosityKPaSec: number,
): WorkConjugateAVPlaneAxisParamsV1 {
  return {
    passiveStressScaleKPa,
    passiveExponent: DEFAULT_PASSIVE_EXPONENT_V1,
    passiveSlackStrain: DEFAULT_PASSIVE_SLACK_STRAIN_V1,
    activeStressMaxKPa,
    activeStrainPeak: DEFAULT_ACTIVE_STRAIN_PEAK_V1,
    activeStrainWidth: DEFAULT_ACTIVE_STRAIN_WIDTH_V1,
    viscosityKPaSec,
  };
}

function evaluateAxisStressV1(
  strain: number,
  strainRatePerSec: number,
  activation01: number,
  params: WorkConjugateAVPlaneAxisParamsV1,
): WorkConjugateAVPlaneComponentBreakdownV1 {
  const passiveSlackStrain = params.passiveSlackStrain ?? 0;
  const tensileStrain = Math.max(0, strain - passiveSlackStrain);
  const passive = params.passiveExponent === 0
    ? params.passiveStressScaleKPa * tensileStrain
    : params.passiveStressScaleKPa / params.passiveExponent *
      Math.expm1(params.passiveExponent * tensileStrain);
  const activeLengthOffset = (strain - params.activeStrainPeak) / params.activeStrainWidth;
  const active = params.activeStressMaxKPa * activation01 *
    Math.exp(-0.5 * activeLengthOffset * activeLengthOffset);
  const viscous = params.viscosityKPaSec * strainRatePerSec;
  return componentBreakdown(passive, active, viscous);
}

function buildZForceAxisDecompositionN(
  transmuralPressureKPa: WorkConjugateAVPlaneComponentBreakdownV1,
  circumferentialStressKPa: WorkConjugateAVPlaneComponentBreakdownV1,
  longitudinalStressKPa: WorkConjugateAVPlaneComponentBreakdownV1,
  totalForceN: WorkConjugateAVPlaneComponentBreakdownV1,
  wallVolumeMl: number,
  lengthCm: number,
  midwallAreaCm2: number,
  zSign: 1 | -1,
): WorkConjugateAVPlaneZForceAxisDecompositionV1 {
  const circumferentialPressureAreaForceN = scaleBreakdown(
    transmuralPressureKPa,
    zSign * KPA_CM2_TO_N * midwallAreaCm2,
  );
  const circumferentialStressForceN = scaleBreakdown(
    circumferentialStressKPa,
    zSign * KPA_CM2_TO_N * wallVolumeMl / lengthCm * 0.5,
  );
  const longitudinalStressForceN = scaleBreakdown(
    longitudinalStressKPa,
    -zSign * KPA_CM2_TO_N * wallVolumeMl / lengthCm,
  );
  const reconstructedTotalForceN = addBreakdowns(
    circumferentialStressForceN,
    longitudinalStressForceN,
  );
  const circumferentialPressureAreaResidualN = subtractBreakdowns(
    circumferentialPressureAreaForceN,
    circumferentialStressForceN,
  );
  return {
    circumferentialPressureAreaForceN,
    circumferentialStressForceN,
    longitudinalStressForceN,
    reconstructedTotalForceN,
    circumferentialPressureAreaResidualN,
    maxAbsCircumferentialPressureAreaResidualN: maxAbsBreakdown(circumferentialPressureAreaResidualN),
    rawTotalForceResidualN: reconstructedTotalForceN.total - totalForceN.total,
  };
}

function pressureFromCircumferentialStressKPa(
  circumferentialStressKPa: number,
  wallVolumeMl: number,
  midwallVolumeMl: number,
): number {
  return wallVolumeMl / (2 * midwallVolumeMl) * circumferentialStressKPa;
}

function forceFromAxisStressesN(
  circumferentialStressKPa: number,
  longitudinalStressKPa: number,
  wallVolumeMl: number,
  lengthCm: number,
  zSign: 1 | -1,
): number {
  return zSign * KPA_CM2_TO_N * wallVolumeMl / lengthCm *
    (0.5 * circumferentialStressKPa - longitudinalStressKPa);
}

function componentStressPowerW(
  circumferentialStressKPa: number,
  longitudinalStressKPa: number,
  circumferentialStrainRatePerSec: number,
  longitudinalStrainRatePerSec: number,
  wallVolumeMl: number,
): number {
  return wallVolumeMl *
    (
      circumferentialStressKPa * circumferentialStrainRatePerSec +
      longitudinalStressKPa * longitudinalStrainRatePerSec
    ) * KPA_ML_PER_SEC_TO_W;
}

function componentBreakdown(
  passive: number,
  active: number,
  viscous: number,
): WorkConjugateAVPlaneComponentBreakdownV1 {
  return {
    passive,
    active,
    viscous,
    total: passive + active + viscous,
  };
}

function scaleBreakdown(
  breakdown: WorkConjugateAVPlaneComponentBreakdownV1,
  scale: number,
): WorkConjugateAVPlaneComponentBreakdownV1 {
  return componentBreakdown(
    breakdown.passive * scale,
    breakdown.active * scale,
    breakdown.viscous * scale,
  );
}

function addBreakdowns(
  a: WorkConjugateAVPlaneComponentBreakdownV1,
  b: WorkConjugateAVPlaneComponentBreakdownV1,
): WorkConjugateAVPlaneComponentBreakdownV1 {
  return componentBreakdown(
    a.passive + b.passive,
    a.active + b.active,
    a.viscous + b.viscous,
  );
}

function subtractBreakdowns(
  a: WorkConjugateAVPlaneComponentBreakdownV1,
  b: WorkConjugateAVPlaneComponentBreakdownV1,
): WorkConjugateAVPlaneComponentBreakdownV1 {
  return componentBreakdown(
    a.passive - b.passive,
    a.active - b.active,
    a.viscous - b.viscous,
  );
}

function maxAbsBreakdown(
  breakdown: WorkConjugateAVPlaneComponentBreakdownV1,
): number {
  return Math.max(...breakdownValues(breakdown).map((value) => Math.abs(value)));
}

function validateInputAndParams(
  input: WorkConjugateAVPlaneChamberWallInputV1,
  params: WorkConjugateAVPlaneChamberWallParamsV1,
): string | null {
  const zSign = chamberZSign(params.chamberId);
  const referenceAVPlanePositionCm = params.referenceAVPlanePositionCm ?? 0;
  const lengthCm = params.referenceLengthCm + zSign *
    (input.avPlanePositionCm - referenceAVPlanePositionCm);
  const midwallVolumeMl = input.bloodVolumeMl + 0.5 * params.wallVolumeMl;
  const referenceMidwallVolumeMl = params.referenceBloodVolumeMl + 0.5 * params.wallVolumeMl;
  const finiteValues = [
    input.bloodVolumeMl,
    input.bloodVolumeDotMlPerSec,
    input.avPlanePositionCm,
    input.avPlaneVelocityCmPerSec,
    input.activation01,
    input.pericardialPressureKPa,
    params.wallVolumeMl,
    params.referenceBloodVolumeMl,
    params.referenceLengthCm,
    referenceAVPlanePositionCm,
    ...axisParamValues(params.axes.circumferential),
    ...axisParamValues(params.axes.longitudinal),
  ];
  if (finiteValues.some((value) => !Number.isFinite(value))) {
    return "non-finite input or parameter";
  }
  if (params.wallVolumeMl <= MIN_POSITIVE_GEOMETRY_V1) {
    return `wallVolumeMl must be greater than ${MIN_POSITIVE_GEOMETRY_V1}`;
  }
  if (input.bloodVolumeMl <= MIN_POSITIVE_GEOMETRY_V1) {
    return `bloodVolumeMl must be greater than ${MIN_POSITIVE_GEOMETRY_V1}`;
  }
  if (params.referenceBloodVolumeMl <= MIN_POSITIVE_GEOMETRY_V1) {
    return `referenceBloodVolumeMl must be greater than ${MIN_POSITIVE_GEOMETRY_V1}`;
  }
  if (midwallVolumeMl <= MIN_POSITIVE_GEOMETRY_V1) {
    return `midwallVolumeMl must be greater than ${MIN_POSITIVE_GEOMETRY_V1}`;
  }
  if (referenceMidwallVolumeMl <= MIN_POSITIVE_GEOMETRY_V1) {
    return `referenceMidwallVolumeMl must be greater than ${MIN_POSITIVE_GEOMETRY_V1}`;
  }
  if (params.referenceLengthCm <= MIN_POSITIVE_GEOMETRY_V1) {
    return `referenceLengthCm must be greater than ${MIN_POSITIVE_GEOMETRY_V1}`;
  }
  if (lengthCm <= MIN_POSITIVE_GEOMETRY_V1) {
    return `lengthCm must be greater than ${MIN_POSITIVE_GEOMETRY_V1}`;
  }
  return validateAxisParams("circumferential", params.axes.circumferential) ??
    validateAxisParams("longitudinal", params.axes.longitudinal);
}

function validateAxisParams(
  axisId: WorkConjugateAVPlaneAxisIdV1,
  params: WorkConjugateAVPlaneAxisParamsV1,
): string | null {
  if (params.passiveStressScaleKPa < 0) {
    return `${axisId}.passiveStressScaleKPa must be nonnegative`;
  }
  if (params.passiveExponent < 0) {
    return `${axisId}.passiveExponent must be nonnegative`;
  }
  if (params.activeStressMaxKPa < 0) {
    return `${axisId}.activeStressMaxKPa must be nonnegative`;
  }
  if (params.activeStrainWidth <= 0) {
    return `${axisId}.activeStrainWidth must be positive`;
  }
  if (params.viscosityKPaSec < 0) {
    return `${axisId}.viscosityKPaSec must be nonnegative`;
  }
  return null;
}

function axisParamValues(params: WorkConjugateAVPlaneAxisParamsV1): readonly number[] {
  return [
    params.passiveStressScaleKPa,
    params.passiveExponent,
    params.passiveSlackStrain ?? 0,
    params.activeStressMaxKPa,
    params.activeStrainPeak,
    params.activeStrainWidth,
    params.viscosityKPaSec,
  ];
}

function invalidWorkConjugateOutputV1(
  input: WorkConjugateAVPlaneChamberWallInputV1,
  params: WorkConjugateAVPlaneChamberWallParamsV1,
  invalidReason: string,
): WorkConjugateAVPlaneChamberWallOutputV1 {
  const zSign = chamberZSign(params.chamberId);
  const referenceAVPlanePositionCm = params.referenceAVPlanePositionCm ?? 0;
  const nanBreakdown = componentBreakdown(Number.NaN, Number.NaN, Number.NaN);
  return {
    valid: false,
    finite: false,
    invalidReason,
    chamberId: params.chamberId,
    activation01: Number.NaN,
    pericardialPressureKPa: input.pericardialPressureKPa,
    geometry: {
      bloodVolumeMl: input.bloodVolumeMl,
      wallVolumeMl: params.wallVolumeMl,
      midwallVolumeMl: Number.NaN,
      referenceBloodVolumeMl: params.referenceBloodVolumeMl,
      referenceMidwallVolumeMl: Number.NaN,
      lengthCm: Number.NaN,
      referenceLengthCm: params.referenceLengthCm,
      midwallAreaCm2: Number.NaN,
      referenceMidwallAreaCm2: Number.NaN,
      avPlanePositionCm: input.avPlanePositionCm,
      referenceAVPlanePositionCm,
      zSign,
    },
    kinematics: {
      bloodVolumeDotMlPerSec: input.bloodVolumeDotMlPerSec,
      avPlaneVelocityCmPerSec: input.avPlaneVelocityCmPerSec,
      lengthDotCmPerSec: Number.NaN,
    },
    strains: {
      circumferential: Number.NaN,
      longitudinal: Number.NaN,
    },
    strainRatesPerSec: {
      circumferential: Number.NaN,
      longitudinal: Number.NaN,
    },
    stressesKPa: {
      circumferential: nanBreakdown,
      longitudinal: nanBreakdown,
    },
    transmuralPressureKPa: nanBreakdown,
    transmuralPressureMmHg: nanBreakdown,
    cavityPressureKPa: Number.NaN,
    cavityPressureMmHg: Number.NaN,
    zForceN: nanBreakdown,
    zForceAxisDecompositionN: {
      circumferentialPressureAreaForceN: nanBreakdown,
      circumferentialStressForceN: nanBreakdown,
      longitudinalStressForceN: nanBreakdown,
      reconstructedTotalForceN: nanBreakdown,
      circumferentialPressureAreaResidualN: nanBreakdown,
      maxAbsCircumferentialPressureAreaResidualN: Number.NaN,
      rawTotalForceResidualN: Number.NaN,
    },
    power: {
      pressurePowerW: Number.NaN,
      zForcePowerW: Number.NaN,
      wallPowerW: Number.NaN,
      stressPowerW: Number.NaN,
      passiveWallPowerW: Number.NaN,
      activeWallPowerW: Number.NaN,
      viscousWallPowerW: Number.NaN,
      viscousDissipationW: Number.NaN,
      rawPowerResidualW: Number.NaN,
    },
  };
}

function outputFinite(output: WorkConjugateAVPlaneChamberWallOutputV1): boolean {
  const values = [
    output.activation01,
    output.pericardialPressureKPa,
    output.geometry.bloodVolumeMl,
    output.geometry.wallVolumeMl,
    output.geometry.midwallVolumeMl,
    output.geometry.referenceBloodVolumeMl,
    output.geometry.referenceMidwallVolumeMl,
    output.geometry.lengthCm,
    output.geometry.referenceLengthCm,
    output.geometry.midwallAreaCm2,
    output.geometry.referenceMidwallAreaCm2,
    output.geometry.avPlanePositionCm,
    output.geometry.referenceAVPlanePositionCm,
    output.kinematics.bloodVolumeDotMlPerSec,
    output.kinematics.avPlaneVelocityCmPerSec,
    output.kinematics.lengthDotCmPerSec,
    output.strains.circumferential,
    output.strains.longitudinal,
    output.strainRatesPerSec.circumferential,
    output.strainRatesPerSec.longitudinal,
    ...breakdownValues(output.stressesKPa.circumferential),
    ...breakdownValues(output.stressesKPa.longitudinal),
    ...breakdownValues(output.transmuralPressureKPa),
    ...breakdownValues(output.transmuralPressureMmHg),
    output.cavityPressureKPa,
    output.cavityPressureMmHg,
    ...breakdownValues(output.zForceN),
    ...breakdownValues(output.zForceAxisDecompositionN.circumferentialPressureAreaForceN),
    ...breakdownValues(output.zForceAxisDecompositionN.circumferentialStressForceN),
    ...breakdownValues(output.zForceAxisDecompositionN.longitudinalStressForceN),
    ...breakdownValues(output.zForceAxisDecompositionN.reconstructedTotalForceN),
    ...breakdownValues(output.zForceAxisDecompositionN.circumferentialPressureAreaResidualN),
    output.zForceAxisDecompositionN.maxAbsCircumferentialPressureAreaResidualN,
    output.zForceAxisDecompositionN.rawTotalForceResidualN,
    output.power.pressurePowerW,
    output.power.zForcePowerW,
    output.power.wallPowerW,
    output.power.stressPowerW,
    output.power.passiveWallPowerW,
    output.power.activeWallPowerW,
    output.power.viscousWallPowerW,
    output.power.viscousDissipationW,
    output.power.rawPowerResidualW,
  ];
  return values.every((value) => Number.isFinite(value));
}

function breakdownValues(
  breakdown: WorkConjugateAVPlaneComponentBreakdownV1,
): readonly number[] {
  return [
    breakdown.passive,
    breakdown.active,
    breakdown.viscous,
    breakdown.total,
  ];
}

function chamberZSign(chamberId: WorkConjugateAVPlaneChamberIdV1): 1 | -1 {
  return chamberId === "LA" ? 1 : -1;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
