export type MainWireNormalAdultPassiveEquilibriumCoordinatesV3 = Readonly<{
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
}>;

export type MainWireNormalAdultPassiveEquilibriumMatrix2V3 = readonly [
  readonly [number, number],
  readonly [number, number],
];

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3 =
  Object.freeze({
    septalMidwallCapVolumeM3: 42e-6,
    junctionRadiusM: 0.033,
  });

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V3 =
  Object.freeze({
    LV: 144.4e-6,
    RV: 155.8e-6,
  });

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_MINIMUM_VOLUMES_M3_V3 =
  Object.freeze({
    LV: 53.2e-6,
    RV: 66.5e-6,
  });

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_LOADED_COORDINATES_V3 =
  Object.freeze({
    septalMidwallCapVolumeM3: 42e-6,
    junctionRadiusM: 0.033,
  });
