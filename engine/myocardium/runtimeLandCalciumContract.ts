/**
 * Calcium-input mapping owned by the current ModelCore runtime.
 *
 * This value is part of the executable model contract. Historical calibration
 * reports may explain how it was selected, but runtime loading must not depend
 * on a generated research artifact.
 */
export const MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1 = Object.freeze({
  contractId: "modelcore-runtime-land-calcium-contract-v1",
  targetPeakFreeCalciumUM: 1.02,
  calciumScale: 6.695183401029768,
  runtimeUserControlMultiplier: "tmax-contractility-user-control",
} as const);
