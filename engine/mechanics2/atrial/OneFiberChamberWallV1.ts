export type OneFiberChamberIdV1 = "LA" | "RA" | "LV" | "RV";

export type OneFiberChamberWallParamsV1 = {
  readonly chamberId: OneFiberChamberIdV1;
  readonly wallVolumeMl: number;
  readonly referenceFreeWallVolumeMl: number;
  readonly passiveStiffnessKPa: number;
  readonly passiveExponent: number;
  readonly activeStressMaxKPa: number;
  readonly activeLengthPeakNorm: number;
  readonly activeLengthWidthNorm: number;
  readonly activationRiseTauSec: number;
  readonly activationFallTauSec: number;
  readonly wallViscosityKPaSec: number;
  readonly tensileStrainSmoothing: number;
};

export type OneFiberChamberWallStateV1 = {
  readonly activation01: number;
};

export type OneFiberChamberWallInputV1 = {
  readonly dtSec: number;
  readonly electricalActivation01: number;
  readonly freeWallVolumeMl: number;
  readonly previousFreeWallVolumeMl: number;
  readonly pericardialPressureMmHg: number;
};

export type OneFiberChamberWallOutputV1 = {
  readonly state: OneFiberChamberWallStateV1;
  readonly chamberId: OneFiberChamberIdV1;
  readonly freeWallVolumeMl: number;
  readonly lambda: number;
  readonly lambdaReference: number;
  readonly stretchNorm: number;
  readonly fiberStrain: number;
  readonly fiberStrainRatePerSec: number;
  readonly activation01: number;
  readonly passiveStressKPa: number;
  readonly activeStressKPa: number;
  readonly viscousStressKPa: number;
  readonly totalStressKPa: number;
  readonly transmuralPressureMmHg: number;
  readonly cavityPressureMmHg: number;
  readonly viscousDissipationW: number;
  readonly virtualWorkPressureResidualMmHg: number;
};

const KPA_TO_MMHG = 7.500616827;

export function initialOneFiberChamberWallStateV1(
  activation01 = 0,
): OneFiberChamberWallStateV1 {
  return { activation01: clamp01(activation01) };
}

export function stepOneFiberChamberWallV1(
  previous: OneFiberChamberWallStateV1,
  input: OneFiberChamberWallInputV1,
  params: OneFiberChamberWallParamsV1,
): OneFiberChamberWallOutputV1 {
  const dtSec = Math.max(input.dtSec, 1e-9);
  const target = clamp01(input.electricalActivation01);
  const tauSec = target >= previous.activation01
    ? params.activationRiseTauSec
    : params.activationFallTauSec;
  const activation01 = target +
    (previous.activation01 - target) * Math.exp(-dtSec / Math.max(tauSec, 1e-9));
  return evaluateOneFiberChamberWallV1(
    { activation01 },
    input,
    params,
  );
}

export function evaluateOneFiberChamberWallV1(
  state: OneFiberChamberWallStateV1,
  input: OneFiberChamberWallInputV1,
  params: OneFiberChamberWallParamsV1,
): OneFiberChamberWallOutputV1 {
  const dtSec = Math.max(input.dtSec, 1e-9);
  const wallVolumeMl = Math.max(params.wallVolumeMl, 1e-6);
  const lambda = fiberExtension(input.freeWallVolumeMl, wallVolumeMl);
  const lambdaPrevious = fiberExtension(input.previousFreeWallVolumeMl, wallVolumeMl);
  const lambdaReference = fiberExtension(params.referenceFreeWallVolumeMl, wallVolumeMl);
  const stretchNorm = lambda / Math.max(lambdaReference, 1e-9);
  const previousStretchNorm = lambdaPrevious / Math.max(lambdaReference, 1e-9);
  const fiberStrain = Math.log(Math.max(stretchNorm, 1e-9));
  const previousFiberStrain = Math.log(Math.max(previousStretchNorm, 1e-9));
  const fiberStrainRatePerSec = (fiberStrain - previousFiberStrain) / dtSec;
  const tensileStrain = smoothPositive(
    fiberStrain,
    Math.max(params.tensileStrainSmoothing, 1e-9),
  );
  const passiveStressKPa = Math.max(params.passiveStiffnessKPa, 0) /
    Math.max(params.passiveExponent, 1e-9) *
    Math.expm1(Math.max(params.passiveExponent, 0) * tensileStrain);
  const normalizedLengthOffset =
    (stretchNorm - params.activeLengthPeakNorm) /
    Math.max(params.activeLengthWidthNorm, 1e-6);
  const activeLengthFactor = Math.exp(-0.5 * normalizedLengthOffset * normalizedLengthOffset);
  const activeStressKPa = Math.max(params.activeStressMaxKPa, 0) *
    clamp01(state.activation01) * activeLengthFactor;
  const viscousStressKPa = Math.max(params.wallViscosityKPaSec, 0) * fiberStrainRatePerSec;
  const totalStressKPa = passiveStressKPa + activeStressKPa + viscousStressKPa;
  const transmuralPressureKPa = totalStressKPa / Math.max(lambda ** 3, 1e-9);
  const transmuralPressureMmHg = transmuralPressureKPa * KPA_TO_MMHG;
  const virtualWorkPressureMmHg = wallVolumeMl * totalStressKPa *
    fiberStrainVolumeDerivativePerMl(lambda, wallVolumeMl) * KPA_TO_MMHG;
  return {
    state: { activation01: clamp01(state.activation01) },
    chamberId: params.chamberId,
    freeWallVolumeMl: input.freeWallVolumeMl,
    lambda,
    lambdaReference,
    stretchNorm,
    fiberStrain,
    fiberStrainRatePerSec,
    activation01: clamp01(state.activation01),
    passiveStressKPa,
    activeStressKPa,
    viscousStressKPa,
    totalStressKPa,
    transmuralPressureMmHg,
    cavityPressureMmHg: input.pericardialPressureMmHg + transmuralPressureMmHg,
    viscousDissipationW: Math.max(params.wallViscosityKPaSec, 0) *
      fiberStrainRatePerSec ** 2 * wallVolumeMl * 1e-3,
    virtualWorkPressureResidualMmHg: virtualWorkPressureMmHg - transmuralPressureMmHg,
  };
}

function fiberExtension(freeWallVolumeMl: number, wallVolumeMl: number): number {
  return Math.cbrt(Math.max(1 + 3 * freeWallVolumeMl / wallVolumeMl, 1e-9));
}

function fiberStrainVolumeDerivativePerMl(lambda: number, wallVolumeMl: number): number {
  return 1 / Math.max(wallVolumeMl * lambda ** 3, 1e-9);
}

function smoothPositive(value: number, epsilon: number): number {
  return 0.5 * (value + Math.sqrt(value * value + epsilon * epsilon));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
