import {
  PRESCRIBED_CALCIUM_TRANSIENT_V1_ID,
  type ModelInstancePath,
  type PrescribedCalciumInput,
  type PrescribedCalciumOutput,
  type PrescribedCalciumTransient,
  type StateBlockDescriptor,
} from "@/engine/myocardium/contracts";
import {
  requireFiniteNumber,
  requireNonNegativeFiniteSeconds,
  requirePositiveFiniteSeconds,
  requireUnitInterval01,
} from "@/engine/myocardium/units";

export {
  PRESCRIBED_CALCIUM_TRANSIENT_V1_ID,
  type PrescribedCalciumInput,
  type PrescribedCalciumOutput,
  type PrescribedCalciumTransient,
};

export const PRESCRIBED_CALCIUM_TRANSIENT_EQUATIONS_VERSION =
  "prescribed-calcium-transient-source-equations-v1";
export const PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID =
  "prescribed-calcium-synthetic-smoke-v1";
export const PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY =
  "prescribed-calcium-waveform-only";
export const PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS =
  "synthetic-smoke-only";

export const PRESCRIBED_CALCIUM_STATE_LABELS = ["riseState01", "decayState01"] as const;
export const PRESCRIBED_CALCIUM_STATE_SIZE = PRESCRIBED_CALCIUM_STATE_LABELS.length;
export const PRESCRIBED_CALCIUM_STATE_INDEX = Object.freeze({
  riseState01: 0,
  decayState01: 1,
} as const satisfies Record<(typeof PRESCRIBED_CALCIUM_STATE_LABELS)[number], number>);

export type CalciumRateTarget = {
  readonly cycleLengthSec: number;
  readonly diastolicCalciumUM: number;
  readonly peakAmplitudeUM: number;
  readonly riseTimeSec: number;
  readonly decayHalfTimeSec: number;
  readonly releaseWidthSec: number;
};

export type PrescribedCalciumInterpolation = "piecewise-linear" | "monotone-cubic";

export type PrescribedCalciumParams = {
  readonly rateTargets: readonly CalciumRateTarget[];
  readonly interpolation: PrescribedCalciumInterpolation;
  readonly activationDelaySec: number;
  readonly parameterSetId: string;
  readonly temperatureModelId: "fixed-310.15K-v1";
  readonly claimBoundary?: typeof PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY;
  readonly evidenceStatus?: typeof PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS;
};

export type EffectiveCalciumRateTarget = CalciumRateTarget & {
  readonly interpolationPolicy: "endpoint-clamp" | "piecewise-linear";
};

export type PrescribedCalciumOdeParameters = EffectiveCalciumRateTarget & {
  readonly tauRiseSec: number;
  readonly tauDecaySec: number;
  readonly normalization: number;
  readonly normalizationPolicy: "zero-initial-single-pulse-be-v1";
};

export type PrescribedCalciumStepResult = {
  readonly nextState: Float64Array;
  readonly output: PrescribedCalciumOutput;
  readonly effectiveTarget: EffectiveCalciumRateTarget;
  readonly odeParameters: PrescribedCalciumOdeParameters;
};

type NormalizedPrescribedCalciumParams = Omit<PrescribedCalciumParams, "rateTargets"> & {
  readonly rateTargets: readonly CalciumRateTarget[];
};

const FORBIDDEN_INPUT_KEYS = [
  "heartRateBpm",
  "phase",
  "phase01",
  "activationPhase",
  "timeSec",
  "absoluteTimeSec",
  "fiberEngineeringStrain",
  "stageFiberEngineeringStrain",
  "stretch",
  "lambda",
  "sarcomereLength",
] as const;

const FORBIDDEN_PARAM_KEYS = ["temperatureK", "serca", "ryr", "srLoad"] as const;
const NORMALIZED_PARAMS_CACHE = new WeakMap<PrescribedCalciumParams, NormalizedPrescribedCalciumParams>();
const ODE_PARAMETER_CACHE = new Map<string, PrescribedCalciumOdeParameters>();
const NORMALIZATION_CACHE = new Map<string, number>();

export const PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET: PrescribedCalciumParams = deepFreeze({
  parameterSetId: PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
  temperatureModelId: "fixed-310.15K-v1",
  interpolation: "piecewise-linear",
  activationDelaySec: 0.012,
  claimBoundary: PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
  evidenceStatus: PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
  rateTargets: [
    {
      cycleLengthSec: 0.6,
      diastolicCalciumUM: 0.14,
      peakAmplitudeUM: 0.82,
      riseTimeSec: 0.07,
      decayHalfTimeSec: 0.095,
      releaseWidthSec: 0.022,
    },
    {
      cycleLengthSec: 0.8,
      diastolicCalciumUM: 0.12,
      peakAmplitudeUM: 0.9,
      riseTimeSec: 0.082,
      decayHalfTimeSec: 0.12,
      releaseWidthSec: 0.026,
    },
    {
      cycleLengthSec: 1,
      diastolicCalciumUM: 0.11,
      peakAmplitudeUM: 0.96,
      riseTimeSec: 0.094,
      decayHalfTimeSec: 0.145,
      releaseWidthSec: 0.03,
    },
  ],
});

export class PrescribedCalciumTransientV1 implements PrescribedCalciumTransient<PrescribedCalciumParams> {
  readonly id = PRESCRIBED_CALCIUM_TRANSIENT_V1_ID;
  readonly state: StateBlockDescriptor;

  constructor(instance: ModelInstancePath) {
    this.state = makePrescribedCalciumStateBlockDescriptor(instance);
  }

  initialState(_params: PrescribedCalciumParams, out: Float64Array): void {
    assertPrescribedCalciumStateVectorLength(out, "Prescribed calcium initial state output");
    out.fill(0);
  }

  residual(
    next: Float64Array,
    previous: Float64Array,
    input: PrescribedCalciumInput,
    params: PrescribedCalciumParams,
    outResidual: Float64Array,
  ): void {
    writePrescribedCalciumResidual(next, previous, input, params, outResidual);
  }

  evaluate(
    state: Float64Array,
    input: PrescribedCalciumInput,
    params: PrescribedCalciumParams,
  ): PrescribedCalciumOutput {
    return evaluatePrescribedCalciumOutput(state, input, params);
  }
}

export function createPrescribedCalciumTransientV1(
  instance: ModelInstancePath,
): PrescribedCalciumTransientV1 {
  return new PrescribedCalciumTransientV1(instance);
}

export function makePrescribedCalciumStateBlockDescriptor(
  instance: ModelInstancePath,
  blockId = `${instance.moduleId}.${instance.instanceId}.prescribedCalcium`,
): StateBlockDescriptor {
  return {
    blockId,
    owner: "calcium",
    instance,
    labels: PRESCRIBED_CALCIUM_STATE_LABELS,
    size: PRESCRIBED_CALCIUM_STATE_SIZE,
    equationsVersion: PRESCRIBED_CALCIUM_TRANSIENT_EQUATIONS_VERSION,
  };
}

export function assertPrescribedCalciumStateVectorLength(state: ArrayLike<number>, label: string): void {
  if (state.length !== PRESCRIBED_CALCIUM_STATE_SIZE) {
    throw new Error(`${label} must contain exactly ${PRESCRIBED_CALCIUM_STATE_SIZE} prescribed calcium states`);
  }
}

export function normalizePrescribedCalciumParams(
  params: PrescribedCalciumParams,
): NormalizedPrescribedCalciumParams {
  const cached = NORMALIZED_PARAMS_CACHE.get(params);
  if (cached !== undefined) return cached;

  rejectForbiddenRecordKeys(params, FORBIDDEN_PARAM_KEYS, "PrescribedCalciumParams");
  if (params.temperatureModelId !== "fixed-310.15K-v1") {
    throw new Error("PrescribedCalciumParams.temperatureModelId must be fixed-310.15K-v1");
  }
  if (params.interpolation !== "piecewise-linear") {
    if (params.interpolation === "monotone-cubic") {
      throw new Error("Prescribed calcium monotone-cubic interpolation is deferred until after Phase 2A");
    }
    throw new Error("PrescribedCalciumParams.interpolation must be piecewise-linear in Phase 2A");
  }
  if (typeof params.parameterSetId !== "string" || params.parameterSetId.trim().length === 0) {
    throw new Error("PrescribedCalciumParams.parameterSetId must be a non-empty string");
  }
  const activationDelaySec = requireNonNegativeFiniteSeconds(
    params.activationDelaySec,
    "PrescribedCalciumParams.activationDelaySec",
  );
  if (!Array.isArray(params.rateTargets) || params.rateTargets.length === 0) {
    throw new Error("PrescribedCalciumParams.rateTargets must contain at least one target");
  }

  const rateTargets = params.rateTargets.map(normalizeCalciumRateTarget).sort(
    (left, right) => left.cycleLengthSec - right.cycleLengthSec,
  );
  for (let index = 1; index < rateTargets.length; index += 1) {
    if (rateTargets[index].cycleLengthSec === rateTargets[index - 1].cycleLengthSec) {
      throw new Error(`Prescribed calcium duplicate cycleLengthSec: ${rateTargets[index].cycleLengthSec}`);
    }
  }
  const shortestCycleLengthSec = rateTargets[0].cycleLengthSec;
  if (activationDelaySec >= shortestCycleLengthSec) {
    throw new Error("PrescribedCalciumParams.activationDelaySec must be shorter than every target cycle length");
  }

  const normalized = {
    ...params,
    activationDelaySec,
    rateTargets,
  };
  NORMALIZED_PARAMS_CACHE.set(params, normalized);
  return normalized;
}

export function normalizeCalciumRateTarget(target: CalciumRateTarget): CalciumRateTarget {
  const cycleLengthSec = requirePositiveFiniteSeconds(target.cycleLengthSec, "CalciumRateTarget.cycleLengthSec");
  const diastolicCalciumUM = requireNonNegativeFiniteNumber(
    target.diastolicCalciumUM,
    "CalciumRateTarget.diastolicCalciumUM",
  );
  const peakAmplitudeUM = requirePositiveFiniteNumber(
    target.peakAmplitudeUM,
    "CalciumRateTarget.peakAmplitudeUM",
  );
  const riseTimeSec = requirePositiveFiniteSeconds(target.riseTimeSec, "CalciumRateTarget.riseTimeSec");
  const decayHalfTimeSec = requirePositiveFiniteSeconds(
    target.decayHalfTimeSec,
    "CalciumRateTarget.decayHalfTimeSec",
  );
  const releaseWidthSec = requirePositiveFiniteSeconds(
    target.releaseWidthSec,
    "CalciumRateTarget.releaseWidthSec",
  );
  if (releaseWidthSec >= cycleLengthSec) {
    throw new Error("CalciumRateTarget.releaseWidthSec must be shorter than cycleLengthSec");
  }
  if (riseTimeSec >= cycleLengthSec) {
    throw new Error("CalciumRateTarget.riseTimeSec must be shorter than cycleLengthSec");
  }
  if (decayHalfTimeSec >= cycleLengthSec) {
    throw new Error("CalciumRateTarget.decayHalfTimeSec must be shorter than cycleLengthSec");
  }

  const normalized = {
    cycleLengthSec,
    diastolicCalciumUM,
    peakAmplitudeUM,
    riseTimeSec,
    decayHalfTimeSec,
    releaseWidthSec,
  };
  derivePrescribedCalciumOdeParameters({
    ...normalized,
    interpolationPolicy: "piecewise-linear",
  });
  return normalized;
}

export function validatePrescribedCalciumInput(input: PrescribedCalciumInput): PrescribedCalciumInput {
  rejectForbiddenRecordKeys(input, FORBIDDEN_INPUT_KEYS, "PrescribedCalciumInput");
  if (typeof input.targetId !== "string" || input.targetId.trim().length === 0) {
    throw new Error("PrescribedCalciumInput.targetId must be a non-empty string");
  }
  if (!Number.isInteger(input.activationEventId)) {
    throw new Error("PrescribedCalciumInput.activationEventId must be an integer");
  }
  if (input.activationEventId < 0) {
    throw new Error("PrescribedCalciumInput.activationEventId must be non-negative");
  }
  const timeSinceActivationSec = requireNonNegativeFiniteSeconds(
    input.timeSinceActivationSec,
    "PrescribedCalciumInput.timeSinceActivationSec",
  );
  const cycleLengthSec = requirePositiveFiniteSeconds(
    input.cycleLengthSec,
    "PrescribedCalciumInput.cycleLengthSec",
  );
  if (timeSinceActivationSec > cycleLengthSec + 1e-12) {
    throw new Error("PrescribedCalciumInput.timeSinceActivationSec must not exceed cycleLengthSec");
  }
  const activationStrength01 = requireUnitInterval01(
    input.activationStrength01,
    "PrescribedCalciumInput.activationStrength01",
  );
  const dtSec = requirePositiveFiniteSeconds(input.dtSec, "PrescribedCalciumInput.dtSec");

  return {
    targetId: input.targetId,
    activationEventId: input.activationEventId,
    timeSinceActivationSec,
    cycleLengthSec,
    activationStrength01,
    dtSec,
  };
}

export function effectiveCalciumRateTargetAtCycleLength(
  params: PrescribedCalciumParams,
  cycleLengthSec: number,
): EffectiveCalciumRateTarget {
  const normalized = normalizePrescribedCalciumParams(params);
  const cycle = requirePositiveFiniteSeconds(cycleLengthSec, "cycleLengthSec");
  const targets = normalized.rateTargets;
  if (cycle <= targets[0].cycleLengthSec) {
    return { ...targets[0], interpolationPolicy: "endpoint-clamp" };
  }
  if (cycle >= targets[targets.length - 1].cycleLengthSec) {
    return { ...targets[targets.length - 1], interpolationPolicy: "endpoint-clamp" };
  }

  for (let index = 1; index < targets.length; index += 1) {
    const right = targets[index];
    const left = targets[index - 1];
    if (cycle <= right.cycleLengthSec) {
      const fraction = (cycle - left.cycleLengthSec) / (right.cycleLengthSec - left.cycleLengthSec);
      return {
        cycleLengthSec: cycle,
        diastolicCalciumUM: interpolate(left.diastolicCalciumUM, right.diastolicCalciumUM, fraction),
        peakAmplitudeUM: interpolate(left.peakAmplitudeUM, right.peakAmplitudeUM, fraction),
        riseTimeSec: interpolate(left.riseTimeSec, right.riseTimeSec, fraction),
        decayHalfTimeSec: interpolate(left.decayHalfTimeSec, right.decayHalfTimeSec, fraction),
        releaseWidthSec: interpolate(left.releaseWidthSec, right.releaseWidthSec, fraction),
        interpolationPolicy: "piecewise-linear",
      };
    }
  }

  return { ...targets[targets.length - 1], interpolationPolicy: "endpoint-clamp" };
}

export function derivePrescribedCalciumOdeParameters(
  target: EffectiveCalciumRateTarget,
): PrescribedCalciumOdeParameters {
  const cacheKey = odeParameterCacheKey(target);
  const cached = ODE_PARAMETER_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;

  const tauDecaySec = target.decayHalfTimeSec / Math.LN2;
  const tauRiseSec = solveTauRiseForPeakTime(target, tauDecaySec);
  if (tauRiseSec >= tauDecaySec) {
    throw new Error("Prescribed calcium synthetic mapping requires tauRiseSec < tauDecaySec");
  }
  const normalization = computePrescribedCalciumNormalization(target, tauRiseSec, tauDecaySec);
  const derived: PrescribedCalciumOdeParameters = {
    ...target,
    tauRiseSec,
    tauDecaySec,
    normalization,
    normalizationPolicy: "zero-initial-single-pulse-be-v1",
  };
  ODE_PARAMETER_CACHE.set(cacheKey, derived);
  return derived;
}

export function writePrescribedCalciumResidual(
  next: ArrayLike<number>,
  previous: ArrayLike<number>,
  input: PrescribedCalciumInput,
  params: PrescribedCalciumParams,
  outResidual: Float64Array,
): void {
  assertPrescribedCalciumStateVectorLength(next, "Prescribed calcium residual next state");
  assertPrescribedCalciumStateVectorLength(previous, "Prescribed calcium residual previous state");
  assertPrescribedCalciumStateVectorLength(outResidual, "Prescribed calcium residual output");
  const normalizedInput = validatePrescribedCalciumInput(input);
  const normalizedParams = normalizePrescribedCalciumParams(params);
  const target = effectiveCalciumRateTargetAtCycleLength(normalizedParams, normalizedInput.cycleLengthSec);
  const ode = derivePrescribedCalciumOdeParameters(target);
  validateStateFinite(next, "Prescribed calcium residual next state");
  validateStateFinite(previous, "Prescribed calcium residual previous state");

  const pulse = prescribedCalciumActivationPulse01(
    normalizedInput.timeSinceActivationSec,
    normalizedParams.activationDelaySec,
    ode.releaseWidthSec,
    normalizedInput.activationStrength01,
  );
  const rise = next[PRESCRIBED_CALCIUM_STATE_INDEX.riseState01];
  const decay = next[PRESCRIBED_CALCIUM_STATE_INDEX.decayState01];
  outResidual[PRESCRIBED_CALCIUM_STATE_INDEX.riseState01] =
    rise
    - previous[PRESCRIBED_CALCIUM_STATE_INDEX.riseState01]
    - normalizedInput.dtSec * ((pulse - rise) / ode.tauRiseSec);
  outResidual[PRESCRIBED_CALCIUM_STATE_INDEX.decayState01] =
    decay
    - previous[PRESCRIBED_CALCIUM_STATE_INDEX.decayState01]
    - normalizedInput.dtSec * ((rise - decay) / ode.tauDecaySec);
}

export function stepPrescribedCalciumTransientV1(
  previous: ArrayLike<number>,
  input: PrescribedCalciumInput,
  params: PrescribedCalciumParams = PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
): PrescribedCalciumStepResult {
  assertPrescribedCalciumStateVectorLength(previous, "Prescribed calcium step previous state");
  validateStateFinite(previous, "Prescribed calcium step previous state");
  const normalizedInput = validatePrescribedCalciumInput(input);
  const normalizedParams = normalizePrescribedCalciumParams(params);
  const effectiveTarget = effectiveCalciumRateTargetAtCycleLength(
    normalizedParams,
    normalizedInput.cycleLengthSec,
  );
  const odeParameters = derivePrescribedCalciumOdeParameters(effectiveTarget);
  const pulse = prescribedCalciumActivationPulse01(
    normalizedInput.timeSinceActivationSec,
    normalizedParams.activationDelaySec,
    odeParameters.releaseWidthSec,
    normalizedInput.activationStrength01,
  );
  const dtOverRise = normalizedInput.dtSec / odeParameters.tauRiseSec;
  const rise =
    (previous[PRESCRIBED_CALCIUM_STATE_INDEX.riseState01] + dtOverRise * pulse)
    / (1 + dtOverRise);
  const dtOverDecay = normalizedInput.dtSec / odeParameters.tauDecaySec;
  const decay =
    (previous[PRESCRIBED_CALCIUM_STATE_INDEX.decayState01] + dtOverDecay * rise)
    / (1 + dtOverDecay);
  const nextState = Float64Array.from([rise, decay]);
  return {
    nextState,
    output: evaluatePrescribedCalciumOutput(nextState, normalizedInput, normalizedParams),
    effectiveTarget,
    odeParameters,
  };
}

export function evaluatePrescribedCalciumOutput(
  state: ArrayLike<number>,
  input: PrescribedCalciumInput,
  params: PrescribedCalciumParams = PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
): PrescribedCalciumOutput {
  assertPrescribedCalciumStateVectorLength(state, "Prescribed calcium output state");
  validateStateFinite(state, "Prescribed calcium output state");
  const normalizedInput = validatePrescribedCalciumInput(input);
  const normalizedParams = normalizePrescribedCalciumParams(params);
  const target = effectiveCalciumRateTargetAtCycleLength(normalizedParams, normalizedInput.cycleLengthSec);
  const ode = derivePrescribedCalciumOdeParameters(target);
  const rise = state[PRESCRIBED_CALCIUM_STATE_INDEX.riseState01];
  const decay = state[PRESCRIBED_CALCIUM_STATE_INDEX.decayState01];
  const normalizedDecay = decay / ode.normalization;
  const freeCalciumUM = target.diastolicCalciumUM + target.peakAmplitudeUM * normalizedDecay;
  const releaseDriveUMPerSec = (target.peakAmplitudeUM / ode.normalization) * (rise / ode.tauDecaySec);
  const clearanceDriveUMPerSec = (target.peakAmplitudeUM / ode.normalization) * (decay / ode.tauDecaySec);

  return {
    freeCalciumUM,
    riseState01: rise,
    decayState01: decay,
    releaseDriveUMPerSec,
    clearanceDriveUMPerSec,
  };
}

export function prescribedCalciumActivationPulse01(
  timeSinceActivationSec: number,
  activationDelaySec: number,
  releaseWidthSec: number,
  activationStrength01 = 1,
): number {
  const time = requireNonNegativeFiniteSeconds(timeSinceActivationSec, "timeSinceActivationSec");
  const delay = requireNonNegativeFiniteSeconds(activationDelaySec, "activationDelaySec");
  const width = requirePositiveFiniteSeconds(releaseWidthSec, "releaseWidthSec");
  const strength = requireUnitInterval01(activationStrength01, "activationStrength01");
  const localTime = time - delay;
  if (localTime < 0 || localTime > width) return 0;
  return strength * 0.5 * (1 - Math.cos((2 * Math.PI * localTime) / width));
}

function solveTauRiseForPeakTime(target: EffectiveCalciumRateTarget, tauDecaySec: number): number {
  const lower = 1e-4;
  const upper = tauDecaySec * 0.95;
  const lowerPeak = singlePulsePeakTimeSec(target, lower, tauDecaySec);
  const upperPeak = singlePulsePeakTimeSec(target, upper, tauDecaySec);
  if (target.riseTimeSec < lowerPeak - 1e-3 || target.riseTimeSec > upperPeak + 1e-3) {
    throw new Error(
      `CalciumRateTarget.riseTimeSec=${target.riseTimeSec} is outside the synthetic mapping range `
      + `[${lowerPeak}, ${upperPeak}] for this release width and decay half-time`,
    );
  }

  let lo = lower;
  let hi = upper;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const mid = (lo + hi) / 2;
    const peakTime = singlePulsePeakTimeSec(target, mid, tauDecaySec);
    if (peakTime < target.riseTimeSec) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

function computePrescribedCalciumNormalization(
  target: EffectiveCalciumRateTarget,
  tauRiseSec: number,
  tauDecaySec: number,
): number {
  const cacheKey = JSON.stringify({
    cycleLengthSec: roundForCache(target.cycleLengthSec),
    riseTimeSec: roundForCache(target.riseTimeSec),
    decayHalfTimeSec: roundForCache(target.decayHalfTimeSec),
    releaseWidthSec: roundForCache(target.releaseWidthSec),
    tauRiseSec: roundForCache(tauRiseSec),
    tauDecaySec: roundForCache(tauDecaySec),
  });
  const cached = NORMALIZATION_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;
  const peak = singlePulsePeakDecayState(target, tauRiseSec, tauDecaySec);
  if (!Number.isFinite(peak) || peak <= 0) {
    throw new Error("Prescribed calcium normalization must be positive and finite");
  }
  NORMALIZATION_CACHE.set(cacheKey, peak);
  return peak;
}

function singlePulsePeakTimeSec(
  target: Pick<EffectiveCalciumRateTarget, "cycleLengthSec" | "releaseWidthSec">,
  tauRiseSec: number,
  tauDecaySec: number,
): number {
  return simulateSinglePulse(target, tauRiseSec, tauDecaySec).peakTimeSec;
}

function singlePulsePeakDecayState(
  target: Pick<EffectiveCalciumRateTarget, "cycleLengthSec" | "releaseWidthSec">,
  tauRiseSec: number,
  tauDecaySec: number,
): number {
  return simulateSinglePulse(target, tauRiseSec, tauDecaySec).peakDecayState;
}

function simulateSinglePulse(
  target: Pick<EffectiveCalciumRateTarget, "cycleLengthSec" | "releaseWidthSec">,
  tauRiseSec: number,
  tauDecaySec: number,
): { peakDecayState: number; peakTimeSec: number } {
  const dtSec = Math.max(
    1e-5,
    Math.min(target.releaseWidthSec / 120, tauRiseSec / 80, tauDecaySec / 160, target.cycleLengthSec / 4000),
  );
  const durationSec = Math.min(
    target.cycleLengthSec,
    Math.max(target.releaseWidthSec + 6 * tauDecaySec, target.releaseWidthSec + tauRiseSec),
  );
  const steps = Math.max(1, Math.ceil(durationSec / dtSec));
  let rise = 0;
  let decay = 0;
  let peakDecayState = 0;
  let peakTimeSec = 0;
  for (let step = 1; step <= steps; step += 1) {
    const timeSec = step * dtSec;
    const pulse = prescribedCalciumActivationPulse01(timeSec, 0, target.releaseWidthSec, 1);
    rise = (rise + (dtSec / tauRiseSec) * pulse) / (1 + dtSec / tauRiseSec);
    decay = (decay + (dtSec / tauDecaySec) * rise) / (1 + dtSec / tauDecaySec);
    if (decay > peakDecayState) {
      peakDecayState = decay;
      peakTimeSec = timeSec;
    }
  }
  return { peakDecayState, peakTimeSec };
}

function normalizeNumber(value: number, label: string): number {
  return requireFiniteNumber(value, label);
}

function requireNonNegativeFiniteNumber(value: unknown, label: string): number {
  const number = normalizeNumber(value as number, label);
  if (number < 0) throw new Error(`${label} must be non-negative`);
  return number;
}

function requirePositiveFiniteNumber(value: unknown, label: string): number {
  const number = normalizeNumber(value as number, label);
  if (number <= 0) throw new Error(`${label} must be greater than 0`);
  return number;
}

function validateStateFinite(state: ArrayLike<number>, label: string): void {
  for (let index = 0; index < state.length; index += 1) {
    requireFiniteNumber(state[index], `${label}[${index}]`);
  }
}

function rejectForbiddenRecordKeys(
  value: object,
  forbiddenKeys: readonly string[],
  label: string,
): void {
  const record = value as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      throw new Error(`${label} must not contain ${key}`);
    }
  }
}

function interpolate(start: number, end: number, fraction: number): number {
  return start + (end - start) * fraction;
}

function roundForCache(value: number): number {
  return Math.round(value * 1e12) / 1e12;
}

function odeParameterCacheKey(target: EffectiveCalciumRateTarget): string {
  return JSON.stringify({
    cycleLengthSec: roundForCache(target.cycleLengthSec),
    diastolicCalciumUM: roundForCache(target.diastolicCalciumUM),
    peakAmplitudeUM: roundForCache(target.peakAmplitudeUM),
    riseTimeSec: roundForCache(target.riseTimeSec),
    decayHalfTimeSec: roundForCache(target.decayHalfTimeSec),
    releaseWidthSec: roundForCache(target.releaseWidthSec),
    interpolationPolicy: target.interpolationPolicy,
  });
}

function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const entry of value) deepFreeze(entry);
  } else if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return Object.freeze(value);
}
