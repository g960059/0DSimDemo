/**
 * Section 14.5 normalization constants shared by the B0 and B1 reference
 * ledgers. They are numerical reporting scales, not model parameters.
 */
export const WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1 =
  (100 * 133.322387415) * (100e-6) / 1;

export const WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 =
  1e-8 * WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1;
