import { clamp, frac } from "@/engine/math";

export type AtrialReservoirConduitCouplingInput = {
  readonly phi: number;
  readonly selfVolumeRateMlPerSec: number;
  readonly inletValveOpen01: number;
  readonly activePressureMmHg: number;
  readonly avPlanePressureDeltaMmHg: number;
  readonly viscousConduitGainMmHgPerMlPerSec: number;
  readonly activeBoosterGain: number;
  readonly avPlaneDeltaGain: number;
  readonly maxAbsAddedPressureMmHg: number;
};

export type AtrialReservoirConduitCouplingTerms = {
  readonly boosterGate01: number;
  readonly viscousConduitPressureMmHg: number;
  readonly tensionBoosterPressureMmHg: number;
  readonly avPlaneExtraPressureMmHg: number;
  readonly totalAddedPressureMmHg: number;
};

export function computeAtrialReservoirConduitCoupling(
  input: AtrialReservoirConduitCouplingInput,
): AtrialReservoirConduitCouplingTerms {
  const inletOpen = clamp(finiteOrZero(input.inletValveOpen01), 0, 1);
  const selfDvDt = finiteOrZero(input.selfVolumeRateMlPerSec);
  const boosterGate01 = atrialReservoirConduitBoosterGate(input.phi);
  const viscousConduitPressureMmHg = clamp(
    -input.viscousConduitGainMmHgPerMlPerSec * selfDvDt * (0.35 + 0.65 * inletOpen),
    -input.maxAbsAddedPressureMmHg,
    input.maxAbsAddedPressureMmHg,
  );
  const tensionBoosterPressureMmHg =
    input.activeBoosterGain * Math.max(finiteOrZero(input.activePressureMmHg), 0) * boosterGate01;
  const avPlaneExtraPressureMmHg = input.avPlaneDeltaGain * finiteOrZero(input.avPlanePressureDeltaMmHg);
  const totalAddedPressureMmHg = clamp(
    viscousConduitPressureMmHg + tensionBoosterPressureMmHg + avPlaneExtraPressureMmHg,
    -input.maxAbsAddedPressureMmHg,
    input.maxAbsAddedPressureMmHg,
  );
  return {
    boosterGate01,
    viscousConduitPressureMmHg,
    tensionBoosterPressureMmHg,
    avPlaneExtraPressureMmHg,
    totalAddedPressureMmHg,
  };
}

export function atrialReservoirConduitBoosterGate(phi: number): number {
  const theta = frac(phi);
  return Math.max(
    raisedCosineWindow(theta, 0.88, 0.12),
    raisedCosineWindow(theta, 0.04, 0.10),
  );
}

function raisedCosineWindow(theta: number, center: number, halfWidth: number): number {
  const distance = Math.min(Math.abs(theta - center), 1 - Math.abs(theta - center));
  if (distance >= halfWidth) return 0;
  return 0.5 * (1 + Math.cos(Math.PI * distance / halfWidth));
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
