import {
  DEFAULT_HILL_SERIES_FIBER_PARAMS_V1,
  initialHillSeriesFiberStateV1,
  stepHillSeriesFiberV1,
  type HillSeriesFiberOutputV1,
  type HillSeriesFiberParamsV1,
  type HillSeriesFiberStateV1,
} from "@/engine/mechanics2/fiber/HillSeriesFiberV1";

export type OneFiberChamberParamsV1 = {
  readonly chamberId: "LV" | "RV";
  readonly wallVolumeMl: number;
  readonly referenceCavityVolumeMl: number;
  readonly lSRef: number;
  readonly pressureScale: number;
  readonly fiber: HillSeriesFiberParamsV1;
};

export type OneFiberChamberStateV1 = {
  readonly fiber: HillSeriesFiberStateV1;
};

export type OneFiberChamberInputV1 = {
  readonly tSec: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly activationTimeSec: number;
  readonly cavityVolumeMl: number;
  readonly previousCavityVolumeMl: number;
  readonly referenceCavityVolumeShiftMl?: number;
  readonly previousReferenceCavityVolumeShiftMl?: number;
};

export type OneFiberChamberOutputV1 = {
  readonly state: OneFiberChamberStateV1;
  readonly chamberId: OneFiberChamberParamsV1["chamberId"];
  readonly cavityVolumeMl: number;
  readonly referenceCavityVolumeShiftMl: number;
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
  readonly wallTensionNPerM: number;
  readonly pressureRawMmHg: number;
  readonly activePressureMmHg: number;
  readonly passivePressureMmHg: number;
  readonly seriesPressureMmHg: number;
  readonly dVdtMlPerSec: number;
  readonly energyProxy: number;
};

export const DEFAULT_ONE_FIBER_CHAMBER_PARAMS_V1: Record<"LV" | "RV", OneFiberChamberParamsV1> = {
  LV: {
    chamberId: "LV",
    wallVolumeMl: 120,
    referenceCavityVolumeMl: 120,
    lSRef: 1,
    pressureScale: 0.62,
    fiber: DEFAULT_HILL_SERIES_FIBER_PARAMS_V1,
  },
  RV: {
    chamberId: "RV",
    wallVolumeMl: 70,
    referenceCavityVolumeMl: 150,
    lSRef: 1,
    pressureScale: 0.42,
    fiber: { ...DEFAULT_HILL_SERIES_FIBER_PARAMS_V1, trefPa: 48_000, passiveStiffnessPa: 12_000 },
  },
};

export function initialOneFiberChamberStateV1(
  initialCavityVolumeMl: number,
  params: OneFiberChamberParamsV1,
): OneFiberChamberStateV1 {
  return { fiber: initialHillSeriesFiberStateV1(lengthFromVolume(initialCavityVolumeMl, params)) };
}

export function stepOneFiberChamberV1(
  previous: OneFiberChamberStateV1,
  input: OneFiberChamberInputV1,
  params: OneFiberChamberParamsV1,
): OneFiberChamberOutputV1 {
  const dtSec = Math.max(input.dtSec, 1e-6);
  const referenceCavityVolumeShiftMl = Math.max(0, input.referenceCavityVolumeShiftMl ?? 0);
  const previousReferenceCavityVolumeShiftMl = Math.max(
    0,
    input.previousReferenceCavityVolumeShiftMl ?? referenceCavityVolumeShiftMl,
  );
  const lS = lengthFromVolumeWithReferenceShift(input.cavityVolumeMl, referenceCavityVolumeShiftMl, params);
  const lSPrev = lengthFromVolumeWithReferenceShift(
    input.previousCavityVolumeMl,
    previousReferenceCavityVolumeShiftMl,
    params,
  );
  const fiber = stepHillSeriesFiberV1(previous.fiber, {
    tSec: input.tSec,
    dtSec,
    cycleLengthSec: input.cycleLengthSec,
    activationTimeSec: input.activationTimeSec,
    lS,
    lSDot: (lS - lSPrev) / dtSec,
  }, params.fiber);
  const geometry = geometryFromVolume(input.cavityVolumeMl, params);
  const pressureActiveMmHg = stressToPressureMmHg(fiber.sigmaActivePa, geometry, params);
  const pressurePassiveMmHg = stressToPressureMmHg(fiber.sigmaPassivePa, geometry, params);
  const pressureSeriesMmHg = stressToPressureMmHg(fiber.sigmaSeriesPa, geometry, params);
  const pressureRawMmHg = Math.max(0, pressureActiveMmHg + pressurePassiveMmHg + pressureSeriesMmHg);
  return {
    state: { fiber: fiber.state },
    chamberId: params.chamberId,
    cavityVolumeMl: input.cavityVolumeMl,
    referenceCavityVolumeShiftMl,
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
    wallTensionNPerM: fiber.sigmaTotalPa * geometry.wallThicknessM,
    pressureRawMmHg,
    activePressureMmHg: pressureActiveMmHg,
    passivePressureMmHg: pressurePassiveMmHg,
    seriesPressureMmHg: pressureSeriesMmHg,
    dVdtMlPerSec: (input.cavityVolumeMl - input.previousCavityVolumeMl) / dtSec,
    energyProxy: fiber.seriesElasticEnergyJPerM3 * geometry.wallVolumeM3,
  };
}

function lengthFromVolume(cavityVolumeMl: number, params: OneFiberChamberParamsV1): number {
  return lengthFromVolumeWithReferenceShift(cavityVolumeMl, 0, params);
}

function lengthFromVolumeWithReferenceShift(
  cavityVolumeMl: number,
  referenceCavityVolumeShiftMl: number,
  params: OneFiberChamberParamsV1,
): number {
  const amid = midwallAreaM2(cavityVolumeMl, params.wallVolumeMl);
  const amidRef = midwallAreaM2(
    params.referenceCavityVolumeMl + Math.max(0, referenceCavityVolumeShiftMl),
    params.wallVolumeMl,
  );
  return params.lSRef * Math.sqrt(amid / Math.max(amidRef, 1e-12));
}

function geometryFromVolume(cavityVolumeMl: number, params: OneFiberChamberParamsV1): {
  readonly vMidMl: number;
  readonly wallVolumeM3: number;
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
    wallVolumeM3,
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
  params: OneFiberChamberParamsV1,
): number {
  const pressurePa = params.pressureScale * 2 * stressPa * geometry.wallThicknessM / Math.max(geometry.rMidM, 1e-9);
  return pressurePa / 133.322;
}
