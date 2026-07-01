import { clamp } from "@/engine/math";

export type HillSeriesFiberStateV1 = {
  readonly lSi: number;
  readonly a: number;
};

export type HillSeriesFiberParamsV1 = {
  readonly lSRef: number;
  readonly activationRiseTauSec: number;
  readonly activationFallTauSec: number;
  readonly activationDurationFraction: number;
  readonly lSiFollowTauSec: number;
  readonly activeShorteningVelocityNormPerSec: number;
  readonly maxLSiVelocityNormPerSec: number;
  readonly activeLengthExternalBlend01: number;
  readonly seriesElasticStiffnessPa: number;
  readonly seriesElasticCubicStiffnessPa: number;
  readonly trefPa: number;
  readonly passiveStiffnessPa: number;
  readonly passiveSlackNorm: number;
};

export type HillSeriesFiberInputV1 = {
  readonly tSec: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly activationTimeSec: number;
  readonly lS: number;
  readonly lSDot: number;
};

export type HillSeriesFiberOutputV1 = {
  readonly state: HillSeriesFiberStateV1;
  readonly lS: number;
  readonly lSi: number;
  readonly lSe: number;
  readonly lSiDot: number;
  readonly activationTarget: number;
  readonly sigmaActivePa: number;
  readonly sigmaPassivePa: number;
  readonly sigmaSeriesPa: number;
  readonly sigmaTotalPa: number;
  readonly seriesElasticEnergyJPerM3: number;
};

export const DEFAULT_HILL_SERIES_FIBER_PARAMS_V1: HillSeriesFiberParamsV1 = {
  lSRef: 1,
  activationRiseTauSec: 0.035,
  activationFallTauSec: 0.095,
  activationDurationFraction: 0.26,
  lSiFollowTauSec: 0.055,
  activeShorteningVelocityNormPerSec: 0.02,
  maxLSiVelocityNormPerSec: 2.4,
  activeLengthExternalBlend01: 0,
  seriesElasticStiffnessPa: 42_000,
  seriesElasticCubicStiffnessPa: 420_000,
  trefPa: 72_000,
  passiveStiffnessPa: 18_000,
  passiveSlackNorm: 0.96,
};

export function initialHillSeriesFiberStateV1(lS: number): HillSeriesFiberStateV1 {
  return { lSi: lS, a: 0 };
}

export function stepHillSeriesFiberV1(
  state: HillSeriesFiberStateV1,
  input: HillSeriesFiberInputV1,
  params: HillSeriesFiberParamsV1 = DEFAULT_HILL_SERIES_FIBER_PARAMS_V1,
): HillSeriesFiberOutputV1 {
  const dt = Math.max(input.dtSec, 1e-6);
  const activationTarget = mechanicalActivationTarget(input.tSec, input.cycleLengthSec, input.activationTimeSec, params);
  const tauA = activationTarget >= state.a ? params.activationRiseTauSec : params.activationFallTauSec;
  const a = clamp(state.a + dt * (activationTarget - state.a) / Math.max(tauA, 1e-6), 0, 1);

  const followDot = (input.lS - state.lSi) / Math.max(params.lSiFollowTauSec, 1e-6);
  const activeShorteningDot = params.activeShorteningVelocityNormPerSec * a;
  const lSiDot = clamp(
    followDot - activeShorteningDot,
    -params.maxLSiVelocityNormPerSec,
    params.maxLSiVelocityNormPerSec,
  );
  const lSi = clamp(state.lSi + dt * lSiDot, 0.55 * params.lSRef, 1.45 * params.lSRef);
  const lSe = input.lS - lSi;
  const lSePositive = Math.max(lSe, 0);
  const activeLength = (1 - clamp(params.activeLengthExternalBlend01, 0, 1)) * lSi
    + clamp(params.activeLengthExternalBlend01, 0, 1) * input.lS;
  const lengthFactor = clamp(1 + 3.5 * (activeLength / Math.max(params.lSRef, 1e-9) - 1), 0.15, 1.85);
  const sigmaActivePa = params.trefPa * a * lengthFactor;
  const sigmaPassivePa = params.passiveStiffnessPa * Math.max(0, lSi - params.passiveSlackNorm) ** 2;
  const sigmaSeriesPa = params.seriesElasticStiffnessPa * lSePositive
    + params.seriesElasticCubicStiffnessPa * lSePositive ** 3;
  const sigmaTotalPa = Math.max(0, sigmaActivePa + sigmaPassivePa + sigmaSeriesPa);
  const seriesElasticEnergyJPerM3 = 0.5 * params.seriesElasticStiffnessPa * lSePositive ** 2
    + 0.25 * params.seriesElasticCubicStiffnessPa * lSePositive ** 4;

  return {
    state: { lSi, a },
    lS: input.lS,
    lSi,
    lSe,
    lSiDot,
    activationTarget,
    sigmaActivePa,
    sigmaPassivePa,
    sigmaSeriesPa,
    sigmaTotalPa,
    seriesElasticEnergyJPerM3,
  };
}

export function mechanicalActivationTarget(
  tSec: number,
  cycleLengthSec: number,
  activationTimeSec: number,
  params: Pick<HillSeriesFiberParamsV1, "activationDurationFraction"> = DEFAULT_HILL_SERIES_FIBER_PARAMS_V1,
): number {
  const cycle = Math.max(cycleLengthSec, 1e-6);
  const phase = positiveModulo(tSec - activationTimeSec, cycle) / cycle;
  const duration = clamp(params.activationDurationFraction, 0.05, 0.75);
  if (phase > duration) return 0;
  const x = phase / duration;
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}
