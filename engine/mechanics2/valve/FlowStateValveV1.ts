function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export type FlowStateValveParamsV1 = {
  readonly valveId: "MV" | "AoV" | "TV" | "PV";
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly openGainPerMmHg: number;
  readonly openThresholdMmHg: number;
  readonly closeThresholdMmHg: number;
  readonly tauOpenSec: number;
  readonly tauCloseSec: number;
  readonly minEffectiveOpen01: number;
  readonly reverseFlowLimitMlPerSec: number;
  readonly reverseSmoothingEpsilonMlPerSec: number;
  readonly maxOpenStepPerStep: number;
};

export type FlowStateValveStateV1 = {
  readonly qMlPerSec: number;
  readonly open01: number;
};

export type FlowStateValveInputV1 = {
  readonly dtSec: number;
  readonly upstreamPressureMmHg: number;
  readonly downstreamPressureMmHg: number;
  readonly closureDrive01?: number;
};

export type FlowStateValveOutputV1 = {
  readonly state: FlowStateValveStateV1;
  readonly valveId: FlowStateValveParamsV1["valveId"];
  readonly pressureGradientMmHg: number;
  readonly closureDrive01: number;
  readonly qMlPerSec: number;
  readonly qDotMlPerSec2: number;
  readonly open01: number;
  readonly effectiveOpen01: number;
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly resistiveLossMmHg: number;
  readonly inertancePressureMmHg: number;
  readonly bernoulliLossMmHg: number;
  readonly pressureFlowResidualMmHg: number;
  readonly reverseProjectionMlPerSec: number;
  readonly energyRateProxyMmHgMlPerSec: number;
};

export const DEFAULT_FLOW_STATE_VALVE_PARAMS_V1: Record<FlowStateValveParamsV1["valveId"], FlowStateValveParamsV1> = {
  MV: {
    valveId: "MV",
    resistanceMmHgSecPerMl: 0.0027,
    inertanceMmHgSec2PerMl: 0.0005,
    bernoulliMmHgSec2PerMl2: 8e-6,
    openGainPerMmHg: 2.6,
    openThresholdMmHg: 0.25,
    closeThresholdMmHg: -0.15,
    tauOpenSec: 0.024,
    tauCloseSec: 0.018,
    minEffectiveOpen01: 0.015,
    reverseFlowLimitMlPerSec: 8,
    reverseSmoothingEpsilonMlPerSec: 0.6,
    maxOpenStepPerStep: 0.18,
  },
  AoV: {
    valveId: "AoV",
    resistanceMmHgSecPerMl: 0.0015,
    inertanceMmHgSec2PerMl: 0.00025,
    bernoulliMmHgSec2PerMl2: 1e-6,
    openGainPerMmHg: 3.4,
    openThresholdMmHg: 0.45,
    closeThresholdMmHg: -0.20,
    tauOpenSec: 0.008,
    tauCloseSec: 0.010,
    minEffectiveOpen01: 0.01,
    reverseFlowLimitMlPerSec: 5,
    reverseSmoothingEpsilonMlPerSec: 0.4,
    maxOpenStepPerStep: 0.25,
  },
  TV: {
    valveId: "TV",
    resistanceMmHgSecPerMl: 0.0035,
    inertanceMmHgSec2PerMl: 0.0014,
    bernoulliMmHgSec2PerMl2: 1e-5,
    openGainPerMmHg: 2.4,
    openThresholdMmHg: 0.18,
    closeThresholdMmHg: -0.10,
    tauOpenSec: 0.020,
    tauCloseSec: 0.022,
    minEffectiveOpen01: 0.015,
    reverseFlowLimitMlPerSec: 7,
    reverseSmoothingEpsilonMlPerSec: 0.6,
    maxOpenStepPerStep: 0.14,
  },
  PV: {
    valveId: "PV",
    resistanceMmHgSecPerMl: 0.005,
    inertanceMmHgSec2PerMl: 0.001,
    bernoulliMmHgSec2PerMl2: 2e-6,
    openGainPerMmHg: 2.8,
    openThresholdMmHg: 0.25,
    closeThresholdMmHg: -0.12,
    tauOpenSec: 0.012,
    tauCloseSec: 0.008,
    minEffectiveOpen01: 0.01,
    reverseFlowLimitMlPerSec: 5,
    reverseSmoothingEpsilonMlPerSec: 0.4,
    maxOpenStepPerStep: 0.22,
  },
};

export function initialFlowStateValveStateV1(qMlPerSec = 0, open01 = 0): FlowStateValveStateV1 {
  return { qMlPerSec, open01: clamp01(open01) };
}

export function stepFlowStateValveV1(
  previous: FlowStateValveStateV1,
  input: FlowStateValveInputV1,
  params: FlowStateValveParamsV1,
): FlowStateValveOutputV1 {
  const dtSec = Math.max(input.dtSec, 1e-6);
  const pressureGradientMmHg = input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const closureDrive01 = clamp01(input.closureDrive01 ?? 0);
  const open01 = nextOpen01(previous.open01, pressureGradientMmHg, closureDrive01, dtSec, params);
  const effectiveOpen01 = Math.max(params.minEffectiveOpen01, open01);
  const lossScale = 1 / Math.max(effectiveOpen01 * effectiveOpen01, 1e-6);
  const resistance = params.resistanceMmHgSecPerMl * lossScale;
  const bernoulli = params.bernoulliMmHgSec2PerMl2 * lossScale;
  const inertance = params.inertanceMmHgSec2PerMl;
  const qPreProjection = qNextConsistentLoss(
    previous.qMlPerSec,
    pressureGradientMmHg,
    resistance,
    bernoulli,
    inertance,
    dtSec,
  );
  const qMlPerSec = softReverseLimit(qPreProjection, open01, params);
  return evaluateFlowStateValveStateV1(previous, input, params, { qMlPerSec, open01 });
}

export function evaluateFlowStateValveStateV1(
  previous: FlowStateValveStateV1,
  input: FlowStateValveInputV1,
  params: FlowStateValveParamsV1,
  state: FlowStateValveStateV1,
): FlowStateValveOutputV1 {
  const dtSec = Math.max(input.dtSec, 1e-6);
  const pressureGradientMmHg = input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const closureDrive01 = clamp01(input.closureDrive01 ?? 0);
  const open01 = clamp01(state.open01);
  const effectiveOpen01 = Math.max(params.minEffectiveOpen01, open01);
  const lossScale = 1 / Math.max(effectiveOpen01 * effectiveOpen01, 1e-6);
  const resistance = params.resistanceMmHgSecPerMl * lossScale;
  const bernoulli = params.bernoulliMmHgSec2PerMl2 * lossScale;
  const inertance = params.inertanceMmHgSec2PerMl;
  const qMlPerSec = state.qMlPerSec;
  const qPreProjection = qNextConsistentLoss(
    previous.qMlPerSec,
    pressureGradientMmHg,
    resistance,
    bernoulli,
    inertance,
    dtSec,
  );
  const qDotMlPerSec2 = (qMlPerSec - previous.qMlPerSec) / dtSec;
  const resistiveLossMmHg = resistance * qMlPerSec;
  const inertancePressureMmHg = inertance * qDotMlPerSec2;
  const bernoulliLossMmHg = bernoulli * qMlPerSec * Math.abs(qMlPerSec);
  const pressureFlowResidualMmHg =
    pressureGradientMmHg - resistiveLossMmHg - inertancePressureMmHg - bernoulliLossMmHg;
  return {
    state: { qMlPerSec, open01 },
    valveId: params.valveId,
    pressureGradientMmHg,
    closureDrive01,
    qMlPerSec,
    qDotMlPerSec2,
    open01,
    effectiveOpen01,
    resistanceMmHgSecPerMl: resistance,
    inertanceMmHgSec2PerMl: inertance,
    bernoulliMmHgSec2PerMl2: bernoulli,
    resistiveLossMmHg,
    inertancePressureMmHg,
    bernoulliLossMmHg,
    pressureFlowResidualMmHg,
    reverseProjectionMlPerSec: qMlPerSec - qPreProjection,
    energyRateProxyMmHgMlPerSec: pressureGradientMmHg * qMlPerSec,
  };
}

function nextOpen01(
  previousOpen01: number,
  pressureGradientMmHg: number,
  closureDrive01: number,
  dtSec: number,
  params: FlowStateValveParamsV1,
): number {
  const target = pressureGradientMmHg >= params.openThresholdMmHg
    ? (1 - closureDrive01) * sigmoid(params.openGainPerMmHg * (pressureGradientMmHg - params.openThresholdMmHg))
    : pressureGradientMmHg <= params.closeThresholdMmHg
      ? 0
      : (1 - closureDrive01) * previousOpen01;
  const tau = target > previousOpen01
    ? params.tauOpenSec
    : params.tauCloseSec / (1 + 3 * closureDrive01);
  const rawStep = (target - previousOpen01) * dtSec / Math.max(tau, 1e-6);
  const boundedStep = clamp(rawStep, -params.maxOpenStepPerStep, params.maxOpenStepPerStep);
  return clamp01(previousOpen01 + boundedStep);
}

function qNextConsistentLoss(
  qPrevious: number,
  pressureGradientMmHg: number,
  resistance: number,
  bernoulli: number,
  inertance: number,
  dtSec: number,
): number {
  const momentum = Math.max(inertance, 1e-9) / dtSec;
  const signedDrive = momentum * qPrevious + pressureGradientMmHg;
  const sign = signedDrive >= 0 ? 1 : -1;
  const a = Math.max(bernoulli, 0);
  const b = Math.max(resistance + momentum, 1e-9);
  const c = -Math.abs(signedDrive);
  if (a < 1e-12) return sign * (-c / b);
  const disc = Math.max(0, b * b - 4 * a * c);
  return sign * ((-b + Math.sqrt(disc)) / (2 * a));
}

function softReverseLimit(
  qMlPerSec: number,
  open01: number,
  params: FlowStateValveParamsV1,
): number {
  if (qMlPerSec >= 0) return qMlPerSec;
  const reverseFloor = -params.reverseFlowLimitMlPerSec * smoothstep01(open01);
  return smoothMax(qMlPerSec, reverseFloor, params.reverseSmoothingEpsilonMlPerSec);
}

function smoothMax(a: number, b: number, eps: number): number {
  const x = (a - b) / Math.max(eps, 1e-9);
  if (x > 40) return a;
  if (x < -40) return b;
  return b + eps * Math.log1p(Math.exp(x));
}

function sigmoid(x: number): number {
  if (x >= 40) return 1;
  if (x <= -40) return 0;
  return 1 / (1 + Math.exp(-x));
}

function smoothstep01(x: number): number {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}
