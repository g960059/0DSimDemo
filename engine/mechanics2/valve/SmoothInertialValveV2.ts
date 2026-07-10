export type SmoothInertialValveIdV2 = "MV" | "AoV" | "TV" | "PV";

export type SmoothInertialValveParamsV2 = {
  readonly valveId: SmoothInertialValveIdV2;
  readonly openAreaCm2: number;
  readonly leakAreaCm2: number;
  readonly openingMidpointMmHg: number;
  readonly openingWidthMmHg: number;
  readonly openResistanceMmHgSecPerMl: number;
  readonly openInertanceMmHgSec2PerMl: number;
  readonly openBernoulliMmHgSec2PerMl2: number;
  readonly flowSmoothingMlPerSec: number;
  readonly newtonIterations: number;
};

export type SmoothInertialValveStateV2 = {
  readonly qMlPerSec: number;
};

export type SmoothInertialValveInputV2 = {
  readonly dtSec: number;
  readonly upstreamPressureMmHg: number;
  readonly downstreamPressureMmHg: number;
};

export type SmoothInertialValveOutputV2 = {
  readonly state: SmoothInertialValveStateV2;
  readonly valveId: SmoothInertialValveIdV2;
  readonly pressureGradientMmHg: number;
  readonly openFraction01: number;
  readonly effectiveAreaCm2: number;
  readonly qMlPerSec: number;
  readonly qDotMlPerSec2: number;
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly pressureFlowResidualMmHg: number;
  readonly dissipatedPowerMmHgMlPerSec: number;
};

export function initialSmoothInertialValveStateV2(
  qMlPerSec = 0,
): SmoothInertialValveStateV2 {
  return { qMlPerSec };
}

export function stepSmoothInertialValveV2(
  previous: SmoothInertialValveStateV2,
  input: SmoothInertialValveInputV2,
  params: SmoothInertialValveParamsV2,
): SmoothInertialValveOutputV2 {
  const coefficients = valveCoefficients(input, params);
  const dtSec = Math.max(input.dtSec, 1e-9);
  const momentum = coefficients.inertanceMmHgSec2PerMl / dtSec;
  let qMlPerSec = previous.qMlPerSec;
  for (let i = 0; i < Math.max(2, params.newtonIterations); i += 1) {
    const smoothAbs = Math.sqrt(
      qMlPerSec * qMlPerSec + params.flowSmoothingMlPerSec ** 2,
    );
    const residual = momentum * (qMlPerSec - previous.qMlPerSec) +
      coefficients.resistanceMmHgSecPerMl * qMlPerSec +
      coefficients.bernoulliMmHgSec2PerMl2 * qMlPerSec * smoothAbs -
      coefficients.pressureGradientMmHg;
    const derivative = momentum + coefficients.resistanceMmHgSecPerMl +
      coefficients.bernoulliMmHgSec2PerMl2 *
      (2 * qMlPerSec * qMlPerSec + params.flowSmoothingMlPerSec ** 2) /
      Math.max(smoothAbs, 1e-9);
    qMlPerSec -= residual / Math.max(derivative, 1e-9);
  }
  return evaluateSmoothInertialValveStateV2(
    previous,
    { qMlPerSec },
    input,
    params,
  );
}

export function evaluateSmoothInertialValveStateV2(
  previous: SmoothInertialValveStateV2,
  state: SmoothInertialValveStateV2,
  input: SmoothInertialValveInputV2,
  params: SmoothInertialValveParamsV2,
): SmoothInertialValveOutputV2 {
  const coefficients = valveCoefficients(input, params);
  const dtSec = Math.max(input.dtSec, 1e-9);
  const qMlPerSec = state.qMlPerSec;
  const qDotMlPerSec2 = (qMlPerSec - previous.qMlPerSec) / dtSec;
  const smoothAbs = Math.sqrt(
    qMlPerSec * qMlPerSec + params.flowSmoothingMlPerSec ** 2,
  );
  const resistiveLoss = coefficients.resistanceMmHgSecPerMl * qMlPerSec;
  const inertialLoss = coefficients.inertanceMmHgSec2PerMl * qDotMlPerSec2;
  const bernoulliLoss = coefficients.bernoulliMmHgSec2PerMl2 * qMlPerSec * smoothAbs;
  return {
    state: { qMlPerSec },
    valveId: params.valveId,
    pressureGradientMmHg: coefficients.pressureGradientMmHg,
    openFraction01: coefficients.openFraction01,
    effectiveAreaCm2: coefficients.effectiveAreaCm2,
    qMlPerSec,
    qDotMlPerSec2,
    resistanceMmHgSecPerMl: coefficients.resistanceMmHgSecPerMl,
    inertanceMmHgSec2PerMl: coefficients.inertanceMmHgSec2PerMl,
    bernoulliMmHgSec2PerMl2: coefficients.bernoulliMmHgSec2PerMl2,
    pressureFlowResidualMmHg:
      coefficients.pressureGradientMmHg - resistiveLoss - inertialLoss - bernoulliLoss,
    dissipatedPowerMmHgMlPerSec: resistiveLoss * qMlPerSec + bernoulliLoss * qMlPerSec,
  };
}

function valveCoefficients(
  input: SmoothInertialValveInputV2,
  params: SmoothInertialValveParamsV2,
): {
  readonly pressureGradientMmHg: number;
  readonly openFraction01: number;
  readonly effectiveAreaCm2: number;
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
} {
  const pressureGradientMmHg = input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const openFraction01 = sigmoid(
    (pressureGradientMmHg - params.openingMidpointMmHg) /
      Math.max(params.openingWidthMmHg, 1e-9),
  );
  const openAreaCm2 = Math.max(params.openAreaCm2, 1e-6);
  const leakAreaCm2 = Math.max(Math.min(params.leakAreaCm2, openAreaCm2), 1e-6);
  const effectiveAreaCm2 = leakAreaCm2 + (openAreaCm2 - leakAreaCm2) * openFraction01;
  const areaRatio = openAreaCm2 / Math.max(effectiveAreaCm2, 1e-6);
  return {
    pressureGradientMmHg,
    openFraction01,
    effectiveAreaCm2,
    resistanceMmHgSecPerMl: Math.max(params.openResistanceMmHgSecPerMl, 0) * areaRatio ** 2,
    inertanceMmHgSec2PerMl: Math.max(params.openInertanceMmHgSec2PerMl, 1e-9) * areaRatio,
    bernoulliMmHgSec2PerMl2: Math.max(params.openBernoulliMmHgSec2PerMl2, 0) * areaRatio ** 2,
  };
}

function sigmoid(value: number): number {
  if (value >= 40) return 1;
  if (value <= -40) return 0;
  return 1 / (1 + Math.exp(-value));
}
