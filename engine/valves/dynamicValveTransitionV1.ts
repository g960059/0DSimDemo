export const DYNAMIC_VALVE_TRANSITION_V1_ID = "dynamic-valve-transition-v1" as const;

export type DynamicValveUpdateMode = "current-loss" | "consistent-loss";
export type DynamicValveOpenMode = "source-ode" | "hysteretic-ode" | "prescribed-open";
export type DynamicValveReverseMode = "hard-diode" | "soft-open-scaled-reverse" | "free-reverse";

export type DynamicValveTransitionV1Parameters = {
  readonly mechanismId: string;
  readonly updateMode: DynamicValveUpdateMode;
  readonly openMode: DynamicValveOpenMode;
  readonly reverseMode: DynamicValveReverseMode;
  readonly resistanceMmHgSecPerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly openGainPerMmHg: number;
  readonly sourceDeadbandMmHg: number;
  readonly openThresholdMmHg: number;
  readonly closeThresholdMmHg: number;
  readonly tauOpenSec: number;
  readonly tauCloseSec: number;
  readonly minEffectiveOpen01: number;
  readonly lossScalesWithOpenArea: boolean;
  readonly reverseFlowLimitMlPerSec: number;
  readonly reverseSmoothingEpsilonMlPerSec: number;
  readonly qDotLimitMlPerSec2: number | null;
};

export type DynamicValveTransitionV1State = {
  readonly flowMlPerSec: number;
  readonly open01: number;
  readonly previousOpenDirection: -1 | 0 | 1;
  readonly openDirectionChangeCount: number;
};

export type DynamicValveTransitionV1Input = {
  readonly dtSec: number;
  readonly upstreamPressureMmHg: number;
  readonly downstreamPressureMmHg: number;
  readonly prescribedOpen01?: number;
};

export type DynamicValveTransitionV1StepResult = {
  readonly mechanismId: string;
  readonly flowMlPerSec: number;
  readonly open01: number;
  readonly dPMmHg: number;
  readonly qNextPreDiodeMlPerSec: number;
  readonly qNextPostDiodeMlPerSec: number;
  readonly qDotRawMlPerSec2: number;
  readonly qDotPostMlPerSec2: number;
  readonly diodeImpulseMlPerSec: number;
  readonly qDotClampImpulseMlPerSec2: number;
  readonly adversePressureGradientFlow: boolean;
  readonly nextState: DynamicValveTransitionV1State;
};

export function initialDynamicValveTransitionV1State(
  flowMlPerSec = 0,
  open01 = 0,
): DynamicValveTransitionV1State {
  return {
    flowMlPerSec,
    open01: clamp01(open01),
    previousOpenDirection: 0,
    openDirectionChangeCount: 0,
  };
}

export function stepDynamicValveTransitionV1(
  previous: DynamicValveTransitionV1State,
  input: DynamicValveTransitionV1Input,
  params: DynamicValveTransitionV1Parameters,
): DynamicValveTransitionV1StepResult {
  const dtSec = Math.max(input.dtSec, 1e-6);
  const dPMmHg = input.upstreamPressureMmHg - input.downstreamPressureMmHg;
  const open01 = nextOpen01(previous.open01, dPMmHg, input.prescribedOpen01, dtSec, params);
  const effectiveOpen01 = Math.max(params.minEffectiveOpen01, open01);
  const openLossScale = params.lossScalesWithOpenArea
    ? 1 / Math.max(effectiveOpen01 * effectiveOpen01, 1e-6)
    : 1;
  const resistance = Math.max(params.resistanceMmHgSecPerMl * openLossScale, 1e-9);
  const bernoulli = Math.max(params.bernoulliMmHgSec2PerMl2 * openLossScale, 0);
  const inertance = Math.max(params.inertanceMmHgSec2PerMl, 1e-9);
  const qNextPreDiode = params.updateMode === "consistent-loss"
    ? qNextConsistentLoss(previous.flowMlPerSec, dPMmHg, resistance, bernoulli, inertance, dtSec)
    : qNextCurrentLoss(previous.flowMlPerSec, dPMmHg, resistance, bernoulli, inertance, dtSec);
  const qNextPostDiode = applyReverseMode(qNextPreDiode, open01, params);
  const qDotRaw = (qNextPostDiode - previous.flowMlPerSec) / dtSec;
  const qDotPost = params.qDotLimitMlPerSec2 == null
    ? qDotRaw
    : clamp(qDotRaw, -params.qDotLimitMlPerSec2, params.qDotLimitMlPerSec2);
  const flowMlPerSec = previous.flowMlPerSec + qDotPost * dtSec;
  const openDirection = direction(open01 - previous.open01, 1e-5);
  const directionChanged =
    openDirection !== 0
    && previous.previousOpenDirection !== 0
    && openDirection !== previous.previousOpenDirection;
  const adversePressureGradientFlow =
    (dPMmHg < -0.75 && flowMlPerSec > 10)
    || (dPMmHg > 0.75 && flowMlPerSec < -10);
  const nextState = {
    flowMlPerSec,
    open01,
    previousOpenDirection: openDirection === 0 ? previous.previousOpenDirection : openDirection,
    openDirectionChangeCount: previous.openDirectionChangeCount + (directionChanged ? 1 : 0),
  } satisfies DynamicValveTransitionV1State;
  return {
    mechanismId: params.mechanismId,
    flowMlPerSec,
    open01,
    dPMmHg,
    qNextPreDiodeMlPerSec: qNextPreDiode,
    qNextPostDiodeMlPerSec: qNextPostDiode,
    qDotRawMlPerSec2: qDotRaw,
    qDotPostMlPerSec2: qDotPost,
    diodeImpulseMlPerSec: qNextPostDiode - qNextPreDiode,
    qDotClampImpulseMlPerSec2: qDotPost - qDotRaw,
    adversePressureGradientFlow,
    nextState,
  };
}

function nextOpen01(
  previousOpen01: number,
  dPMmHg: number,
  prescribedOpen01: number | undefined,
  dtSec: number,
  params: DynamicValveTransitionV1Parameters,
): number {
  if (params.openMode === "prescribed-open") return clamp01(prescribedOpen01 ?? previousOpen01);
  const xiEq = params.openMode === "hysteretic-ode"
    ? hystereticOpenTarget(previousOpen01, dPMmHg, params)
    : sourceOpenTarget(previousOpen01, dPMmHg, params);
  const tau = xiEq > previousOpen01 ? params.tauOpenSec : params.tauCloseSec;
  const delta = (xiEq - previousOpen01) * dtSec / Math.max(tau, 1e-5);
  return clamp01(previousOpen01 + clamp(delta, -0.35, 0.35));
}

function sourceOpenTarget(
  previousOpen01: number,
  dPMmHg: number,
  params: DynamicValveTransitionV1Parameters,
): number {
  if (dPMmHg > params.sourceDeadbandMmHg) {
    return sigmoid(params.openGainPerMmHg * (dPMmHg - params.sourceDeadbandMmHg));
  }
  if (dPMmHg < -params.sourceDeadbandMmHg) return 0;
  return previousOpen01;
}

function hystereticOpenTarget(
  previousOpen01: number,
  dPMmHg: number,
  params: DynamicValveTransitionV1Parameters,
): number {
  if (dPMmHg >= params.openThresholdMmHg) {
    return sigmoid(params.openGainPerMmHg * (dPMmHg - params.openThresholdMmHg));
  }
  if (dPMmHg <= params.closeThresholdMmHg) return 0;
  return previousOpen01;
}

function qNextCurrentLoss(
  qMlPerSec: number,
  dPMmHg: number,
  resistanceMmHgSecPerMl: number,
  bernoulliMmHgSec2PerMl2: number,
  inertanceMmHgSec2PerMl: number,
  dtSec: number,
): number {
  const reff = resistanceMmHgSecPerMl + bernoulliMmHgSec2PerMl2 * Math.abs(qMlPerSec);
  return (qMlPerSec + (dtSec / inertanceMmHgSec2PerMl) * dPMmHg)
    / (1 + (dtSec * reff) / inertanceMmHgSec2PerMl);
}

function qNextConsistentLoss(
  qMlPerSec: number,
  dPMmHg: number,
  resistanceMmHgSecPerMl: number,
  bernoulliMmHgSec2PerMl2: number,
  inertanceMmHgSec2PerMl: number,
  dtSec: number,
): number {
  const a = Math.max(bernoulliMmHgSec2PerMl2, 0);
  const b = Math.max(resistanceMmHgSecPerMl + inertanceMmHgSec2PerMl / dtSec, 1e-9);
  const c = -((inertanceMmHgSec2PerMl / dtSec) * qMlPerSec + dPMmHg);
  if (a < 1e-12) return -c / b;
  const disc = Math.max(0, b * b - 4 * a * c);
  return (-b + Math.sqrt(disc)) / (2 * a);
}

function applyReverseMode(
  qNextMlPerSec: number,
  open01: number,
  params: DynamicValveTransitionV1Parameters,
): number {
  if (params.reverseMode === "free-reverse" || qNextMlPerSec >= 0) return qNextMlPerSec;
  if (params.reverseMode === "hard-diode") return 0;
  const floor = -Math.max(params.reverseFlowLimitMlPerSec, 1e-9) * smoothstep01(open01);
  return smoothMax(qNextMlPerSec, floor, Math.max(params.reverseSmoothingEpsilonMlPerSec, 1e-9));
}

function smoothMax(a: number, b: number, eps: number): number {
  const x = (a - b) / eps;
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

function direction(delta: number, epsilon: number): -1 | 0 | 1 {
  if (delta > epsilon) return 1;
  if (delta < -epsilon) return -1;
  return 0;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
