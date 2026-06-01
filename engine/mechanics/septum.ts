import { clamp } from "@/engine/math";

export type SeptumParams = {
  enabled: boolean;
  stiffnessScale: number;
  k1MmHgPerMl: number;
  k3MmHgPerMl3: number;
  dampingMmHgSecPerMl: number;
  maxShiftMl: number;
  lvPressureWeight: number;
};

export type SeptumBoundsInput = {
  VLV: number;
  VRV: number;
  V0LV: number;
  V0RV: number;
};

export type SeptumForceInput = {
  VLV: number;
  VRV: number;
  shiftMl: number;
  PLVfw: number;
  PRVfw: number;
};

export function septalShiftBounds(input: SeptumBoundsInput, params: SeptumParams): { lo: number; hi: number } {
  const maxAbs = Math.max(params.maxShiftMl, 0);
  // Keep effective ventricular volumes away from their chamber floors. The cap
  // is intentionally conservative; hard state clamps are a last-resort guard.
  const lvReserve = 0.55 * Math.max(input.VLV - input.V0LV - 3, 0);
  const rvReserve = 0.55 * Math.max(input.VRV - input.V0RV - 3, 0);
  return {
    lo: -Math.min(maxAbs, lvReserve),
    hi: Math.min(maxAbs, rvReserve),
  };
}

export function clampSeptalShift(
  shiftMl: number,
  input: SeptumBoundsInput,
  params: SeptumParams,
): number {
  const { lo, hi } = septalShiftBounds(input, params);
  return clamp(shiftMl, lo, hi);
}

export function septalRestoringPressure(shiftMl: number, params: SeptumParams): number {
  const scale = Math.max(params.stiffnessScale, 0);
  return scale * (
    params.k1MmHgPerMl * shiftMl +
    params.k3MmHgPerMl3 * shiftMl * shiftMl * shiftMl
  );
}

export function septalForce(input: SeptumForceInput, params: SeptumParams): number {
  if (!params.enabled) return -input.shiftMl;
  return input.PRVfw - params.lvPressureWeight * input.PLVfw - septalRestoringPressure(input.shiftMl, params);
}

export function septalShiftDerivative(input: SeptumForceInput, params: SeptumParams): number {
  if (!params.enabled) return -input.shiftMl / 0.08;
  return septalForce(input, params) / Math.max(params.dampingMmHgSecPerMl, 1e-6);
}
