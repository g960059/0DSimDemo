import {
  DEFAULT_HILL_SERIES_FIBER_PARAMS_V1,
  initialHillSeriesFiberStateV1,
  stepHillSeriesFiberV1,
  type HillSeriesFiberOutputV1,
  type HillSeriesFiberParamsV1,
  type HillSeriesFiberStateV1,
} from "@/engine/mechanics2/fiber/HillSeriesFiberV1";

export type AtrialFiberChamberIdV1 = "LA" | "RA";

export type AtrialFiberChamberParamsV1 = {
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly wallVolumeMl: number;
  readonly referenceCavityVolumeMl: number;
  readonly pressureScale: number;
  readonly lSRef: number;
  readonly fiber: HillSeriesFiberParamsV1;
};

export type AtrialFiberChamberStateV1 = {
  readonly fiber: HillSeriesFiberStateV1;
};

export type AtrialFiberChamberInputV1 = {
  readonly tSec: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly activationTimeSec: number;
  readonly cavityVolumeMl: number;
  readonly previousCavityVolumeMl: number;
};

export type AtrialFiberChamberOutputV1 = {
  readonly state: AtrialFiberChamberStateV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly cavityVolumeMl: number;
  readonly vMidMl: number;
  readonly aMidM2: number;
  readonly rMidM: number;
  readonly wallThicknessM: number;
  readonly lS: number;
  readonly lSDot: number;
  readonly fiber: HillSeriesFiberOutputV1;
  readonly sigmaActivePa: number;
  readonly sigmaPassivePa: number;
  readonly sigmaSeriesPa: number;
  readonly sigmaTotalPa: number;
  readonly activePressureMmHg: number;
  readonly passivePressureMmHg: number;
  readonly seriesPressureMmHg: number;
  readonly pressureRawMmHg: number;
  readonly dVdtMlPerSec: number;
};

const ATRIAL_BASE_FIBER_PARAMS_V1: HillSeriesFiberParamsV1 = {
  ...DEFAULT_HILL_SERIES_FIBER_PARAMS_V1,
  activationRiseTauSec: 0.03,
  activationFallTauSec: 0.07,
  activationDurationFraction: 0.18,
  lSiFollowTauSec: 0.045,
  activeShorteningVelocityNormPerSec: 0.008,
  maxLSiVelocityNormPerSec: 1.6,
  seriesElasticStiffnessPa: 12_000,
  seriesElasticCubicStiffnessPa: 80_000,
  trefPa: 9_000,
  passiveStiffnessPa: 3_500,
  passiveSlackNorm: 0.97,
};

export const DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1:
Record<AtrialFiberChamberIdV1, AtrialFiberChamberParamsV1> = {
  LA: {
    chamberId: "LA",
    wallVolumeMl: 22,
    referenceCavityVolumeMl: 44,
    pressureScale: 0.72,
    lSRef: 1,
    fiber: ATRIAL_BASE_FIBER_PARAMS_V1,
  },
  RA: {
    chamberId: "RA",
    wallVolumeMl: 18,
    referenceCavityVolumeMl: 54,
    pressureScale: 0.36,
    lSRef: 1,
    fiber: {
      ...ATRIAL_BASE_FIBER_PARAMS_V1,
      trefPa: 7_500,
      passiveStiffnessPa: 2_800,
    },
  },
};

export function initialAtrialFiberChamberStateV1(
  initialCavityVolumeMl: number,
  params: AtrialFiberChamberParamsV1,
): AtrialFiberChamberStateV1 {
  return { fiber: initialHillSeriesFiberStateV1(lengthFromVolume(initialCavityVolumeMl, params)) };
}

export function stepAtrialFiberChamberV1(
  previous: AtrialFiberChamberStateV1,
  input: AtrialFiberChamberInputV1,
  params: AtrialFiberChamberParamsV1,
): AtrialFiberChamberOutputV1 {
  const dtSec = Math.max(input.dtSec, 1e-6);
  const lS = lengthFromVolume(input.cavityVolumeMl, params);
  const lSPrev = lengthFromVolume(input.previousCavityVolumeMl, params);
  const fiber = stepHillSeriesFiberV1(previous.fiber, {
    tSec: input.tSec,
    dtSec,
    cycleLengthSec: input.cycleLengthSec,
    activationTimeSec: input.activationTimeSec,
    lS,
    lSDot: (lS - lSPrev) / dtSec,
  }, params.fiber);
  const geometry = geometryFromVolume(input.cavityVolumeMl, params);
  const activePressureMmHg = stressToPressureMmHg(fiber.sigmaActivePa, geometry, params);
  const passivePressureMmHg = stressToPressureMmHg(fiber.sigmaPassivePa, geometry, params);
  const seriesPressureMmHg = stressToPressureMmHg(fiber.sigmaSeriesPa, geometry, params);
  const pressureRawMmHg = Math.max(0, activePressureMmHg + passivePressureMmHg + seriesPressureMmHg);
  return {
    state: { fiber: fiber.state },
    chamberId: params.chamberId,
    cavityVolumeMl: input.cavityVolumeMl,
    vMidMl: geometry.vMidMl,
    aMidM2: geometry.aMidM2,
    rMidM: geometry.rMidM,
    wallThicknessM: geometry.wallThicknessM,
    lS,
    lSDot: (lS - lSPrev) / dtSec,
    fiber,
    sigmaActivePa: fiber.sigmaActivePa,
    sigmaPassivePa: fiber.sigmaPassivePa,
    sigmaSeriesPa: fiber.sigmaSeriesPa,
    sigmaTotalPa: fiber.sigmaTotalPa,
    activePressureMmHg,
    passivePressureMmHg,
    seriesPressureMmHg,
    pressureRawMmHg,
    dVdtMlPerSec: (input.cavityVolumeMl - input.previousCavityVolumeMl) / dtSec,
  };
}

function lengthFromVolume(cavityVolumeMl: number, params: AtrialFiberChamberParamsV1): number {
  const amid = midwallAreaM2(cavityVolumeMl, params.wallVolumeMl);
  const amidRef = midwallAreaM2(params.referenceCavityVolumeMl, params.wallVolumeMl);
  return params.lSRef * Math.sqrt(amid / Math.max(amidRef, 1e-12));
}

function geometryFromVolume(cavityVolumeMl: number, params: AtrialFiberChamberParamsV1): {
  readonly vMidMl: number;
  readonly aMidM2: number;
  readonly rMidM: number;
  readonly wallThicknessM: number;
} {
  const vMidMl = cavityVolumeMl + 0.5 * params.wallVolumeMl;
  const aMidM2 = midwallAreaM2(cavityVolumeMl, params.wallVolumeMl);
  const rMidM = Math.sqrt(aMidM2 / (4 * Math.PI));
  const wallVolumeM3 = params.wallVolumeMl * 1e-6;
  return {
    vMidMl,
    aMidM2,
    rMidM,
    wallThicknessM: wallVolumeM3 / Math.max(aMidM2, 1e-12),
  };
}

function midwallAreaM2(cavityVolumeMl: number, wallVolumeMl: number): number {
  const vMidM3 = Math.max(cavityVolumeMl + 0.5 * wallVolumeMl, 1e-9) * 1e-6;
  return (6 * Math.sqrt(Math.PI) * vMidM3) ** (2 / 3);
}

function stressToPressureMmHg(
  stressPa: number,
  geometry: { readonly wallThicknessM: number; readonly rMidM: number },
  params: AtrialFiberChamberParamsV1,
): number {
  const pressurePa = params.pressureScale * 2 * stressPa * geometry.wallThicknessM / Math.max(geometry.rMidM, 1e-9);
  return pressurePa / 133.322;
}
