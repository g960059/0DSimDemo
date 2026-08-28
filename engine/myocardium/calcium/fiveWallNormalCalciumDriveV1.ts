export const FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID =
  "five-wall-normal-prescribed-calcium-drive-v1" as const;

export type FiveWallCalciumValuesV1 = Readonly<{
  LA: number;
  RA: number;
  LVFW: number;
  SEP: number;
  RVFW: number;
}>;

export type PeriodicBiexponentialCalciumClassV1 = Readonly<{
  diastolicCalciumUM: number;
  peakAmplitudeUM: number;
  riseTimeConstantSec: number;
  decayTimeConstantSec: number;
  electricalToCalciumDelaySec: number;
}>;

export type PeriodicBiexponentialDelayedMixtureV1 = Readonly<{
  shape: "delayed-convex-mixture-v1";
  delayedWeight01: number;
  delaySec: number;
  /** Exact profile-owned divisor that restores a unit waveform peak. */
  unnormalizedMixturePeak01: number;
}>;

export type FiveWallNormalCalciumDriveParamsV1 = Readonly<{
  parameterSetId: string;
  cycleLengthSec: number;
  atrioventricularDelaySec: number;
  atrial: PeriodicBiexponentialCalciumClassV1;
  ventricular: PeriodicBiexponentialCalciumClassV1;
  /** Optional fixed low-order redistribution; it adds no calcium state. */
  ventricularDelayedMixture?: PeriodicBiexponentialDelayedMixtureV1;
  /** Optional mechanistic activation perturbation for research case construction. */
  peakAmplitudeScaleByWall?: Readonly<
    Partial<Record<keyof FiveWallCalciumValuesV1, number>>
  >;
  /** Prescribed calcium-decay perturbation; not a generic lusitropy scalar. */
  decayTimeScaleByWall?: Readonly<
    Partial<Record<keyof FiveWallCalciumValuesV1, number>>
  >;
}>;

export const FIVE_WALL_NORMAL_CALCIUM_DRIVE_CLAIM_V1 = Object.freeze({
  waveform: "periodic-analytically-normalized-biexponential" as const,
  tissueClasses: Object.freeze([
    "atrial-shared",
    "ventricular-shared",
  ] as const),
  sharedBaseWaveforms: Object.freeze([
    "atrial-shared",
    "ventricular-shared",
  ] as const),
  optionalWallSpecificDecayTimeScale: true as const,
  optionalVentricularDelayedConvexMixture: true as const,
  delayedMixtureAddsState: false as const,
  genericLusitropyClaimed: false as const,
  volumeInput: false as const,
  pressureInput: false as const,
  flowInput: false as const,
  strainInput: false as const,
  pvLoopPhaseInput: false as const,
  conservedCalciumCyclingClaimed: false as const,
  measuredCalciumTraceClaimed: false as const,
  exactZeroPulseAmplitudeAllowed: true as const,
  pvLoopMorphologyFitAllowed: false as const,
});

/**
 * Low-order normal construction from the published Land twitch contexts.
 * These values reconstruct component timing; they are not digitized calcium
 * traces and do not claim SR/RyR/SERCA state ownership.
 */
export const FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1: FiveWallNormalCalciumDriveParamsV1 =
  deepFreeze({
    parameterSetId: "five-wall-normal-calcium-component-timing-prior-v1",
    cycleLengthSec: 1,
    atrioventricularDelaySec: 0.16,
    atrial: {
      diastolicCalciumUM: 0.1,
      peakAmplitudeUM: 0.5,
      riseTimeConstantSec: 0.0125,
      decayTimeConstantSec: 0.3,
      electricalToCalciumDelaySec: 0.012,
    },
    ventricular: {
      diastolicCalciumUM: 0.11,
      peakAmplitudeUM: 0.89,
      riseTimeConstantSec: 0.07,
      decayTimeConstantSec: 0.11,
      electricalToCalciumDelaySec: 0.012,
    },
  });

export const FIVE_WALL_NORMAL_CALCIUM_DRIVE_PROVENANCE_V1 = Object.freeze({
  atrialTimingSource: Object.freeze({
    doi: "10.1002/cnm.2931" as const,
    context: "adjusted-human-atrial-Land-output-timing" as const,
    reportedTimeToPeakMs: 82,
    reportedRelaxationTime50Ms: 75,
  }),
  ventricularTimingSource: Object.freeze({
    doi: "10.1016/j.yjmcc.2017.03.008" as const,
    context: "Land-Coppini-intact-human-twitch-output" as const,
    sourceCalciumInput: "Coppini-trace-shown-in-Figure-6" as const,
    sourceRestingExtensionRatio: 1,
    targetTimeToPeakRangeMs: Object.freeze([147, 172] as const),
    targetRelaxationTime50RangeMs: Object.freeze([109, 125] as const),
    targetRelaxationTime95RangeMs: Object.freeze([291, 377] as const),
    reportedFinalModelTimeToPeakMs: 175,
    reportedFinalModelRelaxationTime50Ms: 121,
    reportedFinalModelRelaxationTime95Ms: 281,
    reportedFinalModelPeakTensionKPa: 51,
    reportedFinalModelMinimumTensionKPa: 0.078,
  }),
  reconstruction:
    "two-exponential-component-metric-construction-not-measured-calcium-trace" as const,
  pvLoopMorphologyFitUsed: false as const,
});

export type PeriodicBiexponentialCalciumPulseShapeV1 = Readonly<{
  cycleLengthSec: number;
  riseTimeConstantSec: number;
  decayTimeConstantSec: number;
  timeToPeakSec: number;
  normalizedPulseCycleIntegralSec: number;
}>;

export type PeriodicBiexponentialDelayedMixtureShapeV1 = Readonly<{
  cycleLengthSec: number;
  riseTimeConstantSec: number;
  decayTimeConstantSec: number;
  delayedWeight01: number;
  delaySec: number;
  timeToPeakSec: number;
  unnormalizedMixturePeak01: number;
  normalizedMixtureCycleIntegralSec: number;
}>;

/**
 * Exact shape moments of the normalized periodic pulse owned by this model.
 * The integral is analytic; no sampled waveform or analysis approximation is
 * used. Amplitude and diastolic calcium are intentionally outside its scope.
 */
export function measurePeriodicBiexponentialCalciumPulseShapeV1(
  cycleLengthSec: number,
  riseTimeConstantSec: number,
  decayTimeConstantSec: number,
): PeriodicBiexponentialCalciumPulseShapeV1 {
  requirePositive(cycleLengthSec, "cycleLengthSec");
  requirePositive(riseTimeConstantSec, "riseTimeConstantSec");
  requirePositive(decayTimeConstantSec, "decayTimeConstantSec");
  if (!(decayTimeConstantSec > riseTimeConstantSec)) {
    throw new Error("decay time constant must exceed rise time constant");
  }
  const decayCarry =
    1 / (1 - Math.exp(-cycleLengthSec / decayTimeConstantSec));
  const riseCarry =
    1 / (1 - Math.exp(-cycleLengthSec / riseTimeConstantSec));
  const raw = (timeSec: number): number =>
    decayCarry * Math.exp(-timeSec / decayTimeConstantSec)
    - riseCarry * Math.exp(-timeSec / riseTimeConstantSec);
  const unboundedPeakTimeSec =
    Math.log(
      riseCarry / riseTimeConstantSec
      / (decayCarry / decayTimeConstantSec),
    )
    / (1 / riseTimeConstantSec - 1 / decayTimeConstantSec);
  const timeToPeakSec = Math.min(
    cycleLengthSec,
    Math.max(0, unboundedPeakTimeSec),
  );
  const minimum = raw(0);
  const normalizationAmplitude = raw(timeToPeakSec) - minimum;
  if (!(normalizationAmplitude > 0) || !Number.isFinite(normalizationAmplitude)) {
    throw new Error("periodic biexponential pulse has no positive amplitude");
  }
  const normalizedPulseCycleIntegralSec = (
    decayTimeConstantSec - riseTimeConstantSec
    - cycleLengthSec * minimum
  ) / normalizationAmplitude;
  if (
    !(normalizedPulseCycleIntegralSec > 0)
    || !Number.isFinite(normalizedPulseCycleIntegralSec)
  ) {
    throw new Error("periodic biexponential pulse has no positive cycle integral");
  }
  return Object.freeze({
    cycleLengthSec,
    riseTimeConstantSec,
    decayTimeConstantSec,
    timeToPeakSec,
    normalizedPulseCycleIntegralSec,
  });
}

/**
 * Exact extrema and cycle integral for a convex sum of one periodic pulse and
 * one delayed copy. Each smooth delay interval remains a two-exponential
 * function, so its sole stationary point and both interval boundaries exhaust
 * the peak candidates; no time grid or haemodynamic outcome enters the shape.
 */
export function measurePeriodicBiexponentialDelayedMixtureShapeV1(
  cycleLengthSec: number,
  riseTimeConstantSec: number,
  decayTimeConstantSec: number,
  delayedWeight01: number,
  delaySec: number,
): PeriodicBiexponentialDelayedMixtureShapeV1 {
  const base = measurePeriodicBiexponentialCalciumPulseShapeV1(
    cycleLengthSec,
    riseTimeConstantSec,
    decayTimeConstantSec,
  );
  if (
    !(delayedWeight01 > 0 && delayedWeight01 < 1)
    || !Number.isFinite(delayedWeight01)
  ) {
    throw new Error("delayed mixture weight must be finite and in (0, 1)");
  }
  if (
    !(delaySec > 0 && delaySec < cycleLengthSec)
    || !Number.isFinite(delaySec)
  ) {
    throw new Error("delayed mixture delay must be finite and within the cycle");
  }
  const decayCarry =
    1 / (1 - Math.exp(-cycleLengthSec / decayTimeConstantSec));
  const riseCarry =
    1 / (1 - Math.exp(-cycleLengthSec / riseTimeConstantSec));
  const stationaryPoint = (shiftSec: number): number => {
    const decayCoefficient = decayCarry * (
      1 - delayedWeight01
      + delayedWeight01 * Math.exp(-shiftSec / decayTimeConstantSec)
    );
    const riseCoefficient = riseCarry * (
      1 - delayedWeight01
      + delayedWeight01 * Math.exp(-shiftSec / riseTimeConstantSec)
    );
    return Math.log(
      (riseCoefficient / riseTimeConstantSec)
      / (decayCoefficient / decayTimeConstantSec),
    ) / (1 / riseTimeConstantSec - 1 / decayTimeConstantSec);
  };
  const firstStationary = stationaryPoint(cycleLengthSec - delaySec);
  const secondStationary = stationaryPoint(-delaySec);
  const candidateTimes = [0, delaySec];
  if (firstStationary > 0 && firstStationary < delaySec) {
    candidateTimes.push(firstStationary);
  }
  if (secondStationary > delaySec && secondStationary < cycleLengthSec) {
    candidateTimes.push(secondStationary);
  }
  const mixtureAt = (timeSec: number): number =>
    (1 - delayedWeight01) * normalizedPeriodicBiexponential(
      positiveModulo(timeSec, cycleLengthSec),
      cycleLengthSec,
      riseTimeConstantSec,
      decayTimeConstantSec,
    )
    + delayedWeight01 * normalizedPeriodicBiexponential(
      positiveModulo(timeSec - delaySec, cycleLengthSec),
      cycleLengthSec,
      riseTimeConstantSec,
      decayTimeConstantSec,
    );
  let timeToPeakSec = candidateTimes[0]!;
  let unnormalizedMixturePeak01 = mixtureAt(timeToPeakSec);
  for (const candidateTime of candidateTimes.slice(1)) {
    const candidate = mixtureAt(candidateTime);
    if (candidate > unnormalizedMixturePeak01) {
      timeToPeakSec = candidateTime;
      unnormalizedMixturePeak01 = candidate;
    }
  }
  if (
    !(unnormalizedMixturePeak01 > 0 && unnormalizedMixturePeak01 <= 1 + 1e-12)
    || !Number.isFinite(unnormalizedMixturePeak01)
  ) {
    throw new Error("delayed mixture has no finite positive peak in (0, 1]");
  }
  unnormalizedMixturePeak01 = Math.min(1, unnormalizedMixturePeak01);
  return Object.freeze({
    cycleLengthSec,
    riseTimeConstantSec,
    decayTimeConstantSec,
    delayedWeight01,
    delaySec,
    timeToPeakSec,
    unnormalizedMixturePeak01,
    normalizedMixtureCycleIntegralSec:
      base.normalizedPulseCycleIntegralSec / unnormalizedMixturePeak01,
  });
}

export type FiveWallNormalCalciumEvaluationV1 = Readonly<{
  driveId: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID;
  parameterSetId: string;
  timeSec: number;
  cyclePhase01: number;
  atrialTimeSinceCalciumOnsetSec: number;
  ventricularTimeSinceCalciumOnsetSec: number;
  atrialNormalizedPulse01: number;
  ventricularNormalizedPulse01: number;
  freeCalciumUMByWall: FiveWallCalciumValuesV1;
  finite: true;
  claim: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_CLAIM_V1;
}>;

export function evaluateFiveWallNormalCalciumDriveV1(
  timeSec: number,
  params: FiveWallNormalCalciumDriveParamsV1 = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
): FiveWallNormalCalciumEvaluationV1 {
  validateParams(params);
  requireFinite(timeSec, "timeSec");
  const cycle = params.cycleLengthSec;
  const ventricularOnsetPhaseSec = positiveModulo(
    params.ventricular.electricalToCalciumDelaySec,
    cycle,
  );
  const atrialOnsetPhaseSec = positiveModulo(
    cycle -
      params.atrioventricularDelaySec +
      params.atrial.electricalToCalciumDelaySec,
    cycle,
  );
  const ventricularTime = positiveModulo(
    timeSec - ventricularOnsetPhaseSec,
    cycle,
  );
  const atrialTime = positiveModulo(timeSec - atrialOnsetPhaseSec, cycle);
  const ventricularPulse = normalizedVentricularPulse(
    ventricularTime,
    params,
  );
  const atrialPulse = normalizedPeriodicBiexponential(
    atrialTime,
    cycle,
    params.atrial.riseTimeConstantSec,
    params.atrial.decayTimeConstantSec,
  );
  const pulseByWall = Object.freeze({
    LA: normalizedPeriodicBiexponential(
      atrialTime,
      cycle,
      params.atrial.riseTimeConstantSec,
      params.atrial.decayTimeConstantSec * decayTimeScale(params, "LA"),
    ),
    RA: normalizedPeriodicBiexponential(
      atrialTime,
      cycle,
      params.atrial.riseTimeConstantSec,
      params.atrial.decayTimeConstantSec * decayTimeScale(params, "RA"),
    ),
    LVFW: params.ventricularDelayedMixture === undefined
      ? normalizedPeriodicBiexponential(
        ventricularTime,
        cycle,
        params.ventricular.riseTimeConstantSec,
        params.ventricular.decayTimeConstantSec
          * decayTimeScale(params, "LVFW"),
      )
      : ventricularPulse,
    SEP: params.ventricularDelayedMixture === undefined
      ? normalizedPeriodicBiexponential(
        ventricularTime,
        cycle,
        params.ventricular.riseTimeConstantSec,
        params.ventricular.decayTimeConstantSec * decayTimeScale(params, "SEP"),
      )
      : ventricularPulse,
    RVFW: params.ventricularDelayedMixture === undefined
      ? normalizedPeriodicBiexponential(
        ventricularTime,
        cycle,
        params.ventricular.riseTimeConstantSec,
        params.ventricular.decayTimeConstantSec
          * decayTimeScale(params, "RVFW"),
      )
      : ventricularPulse,
  });
  const freeCalciumUMByWall = Object.freeze({
    LA:
      params.atrial.diastolicCalciumUM +
      params.atrial.peakAmplitudeUM *
        pulseByWall.LA *
        amplitudeScale(params, "LA"),
    RA:
      params.atrial.diastolicCalciumUM +
      params.atrial.peakAmplitudeUM *
        pulseByWall.RA *
        amplitudeScale(params, "RA"),
    LVFW:
      params.ventricular.diastolicCalciumUM +
      params.ventricular.peakAmplitudeUM *
        pulseByWall.LVFW *
        amplitudeScale(params, "LVFW"),
    SEP:
      params.ventricular.diastolicCalciumUM +
      params.ventricular.peakAmplitudeUM *
        pulseByWall.SEP *
        amplitudeScale(params, "SEP"),
    RVFW:
      params.ventricular.diastolicCalciumUM +
      params.ventricular.peakAmplitudeUM *
        pulseByWall.RVFW *
        amplitudeScale(params, "RVFW"),
  });
  if (!Object.values(freeCalciumUMByWall).every(Number.isFinite)) {
    throw new Error("five-wall calcium drive produced a non-finite value");
  }
  return Object.freeze({
    driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
    parameterSetId: params.parameterSetId,
    timeSec,
    cyclePhase01: positiveModulo(timeSec, cycle) / cycle,
    atrialTimeSinceCalciumOnsetSec: atrialTime,
    ventricularTimeSinceCalciumOnsetSec: ventricularTime,
    atrialNormalizedPulse01: atrialPulse,
    ventricularNormalizedPulse01: ventricularPulse,
    freeCalciumUMByWall,
    finite: true as const,
    claim: FIVE_WALL_NORMAL_CALCIUM_DRIVE_CLAIM_V1,
  });
}

function normalizedPeriodicBiexponential(
  timeSinceOnsetSec: number,
  cycleLengthSec: number,
  riseTimeConstantSec: number,
  decayTimeConstantSec: number,
): number {
  if (!(decayTimeConstantSec > riseTimeConstantSec)) {
    throw new Error("decay time constant must exceed rise time constant");
  }
  const decayCarry = 1 / (1 - Math.exp(-cycleLengthSec / decayTimeConstantSec));
  const riseCarry = 1 / (1 - Math.exp(-cycleLengthSec / riseTimeConstantSec));
  const raw = (time: number): number =>
    decayCarry * Math.exp(-time / decayTimeConstantSec) -
    riseCarry * Math.exp(-time / riseTimeConstantSec);
  const peakTimeSec =
    Math.log(
      riseCarry / riseTimeConstantSec / (decayCarry / decayTimeConstantSec),
    ) /
    (1 / riseTimeConstantSec - 1 / decayTimeConstantSec);
  const boundedPeakTimeSec = Math.min(cycleLengthSec, Math.max(0, peakTimeSec));
  const minimum = raw(0);
  const amplitude = raw(boundedPeakTimeSec) - minimum;
  if (!(amplitude > 0) || !Number.isFinite(amplitude)) {
    throw new Error("periodic biexponential pulse has no positive amplitude");
  }
  const normalized = (raw(timeSinceOnsetSec) - minimum) / amplitude;
  const tolerance = 1e-12;
  if (normalized < -tolerance || normalized > 1 + tolerance) {
    throw new Error("normalized periodic biexponential pulse left [0,1]");
  }
  return Math.min(1, Math.max(0, normalized));
}

function normalizedVentricularPulse(
  ventricularTimeSec: number,
  params: FiveWallNormalCalciumDriveParamsV1,
): number {
  const tissue = params.ventricular;
  const mixture = params.ventricularDelayedMixture;
  const base = normalizedPeriodicBiexponential(
    ventricularTimeSec,
    params.cycleLengthSec,
    tissue.riseTimeConstantSec,
    tissue.decayTimeConstantSec,
  );
  if (mixture === undefined) return base;
  const delayed = normalizedPeriodicBiexponential(
    positiveModulo(
      ventricularTimeSec - mixture.delaySec,
      params.cycleLengthSec,
    ),
    params.cycleLengthSec,
    tissue.riseTimeConstantSec,
    tissue.decayTimeConstantSec,
  );
  const normalized = (
    (1 - mixture.delayedWeight01) * base
    + mixture.delayedWeight01 * delayed
  ) / mixture.unnormalizedMixturePeak01;
  const tolerance = 1e-12;
  if (normalized < -tolerance || normalized > 1 + tolerance) {
    throw new Error("normalized delayed ventricular mixture left [0,1]");
  }
  return Math.min(1, Math.max(0, normalized));
}

function validateParams(params: FiveWallNormalCalciumDriveParamsV1): void {
  if (
    typeof params.parameterSetId !== "string" ||
    params.parameterSetId.trim() === ""
  ) {
    throw new Error("parameterSetId must be non-empty");
  }
  requirePositive(params.cycleLengthSec, "cycleLengthSec");
  requirePositive(params.atrioventricularDelaySec, "atrioventricularDelaySec");
  if (!(params.atrioventricularDelaySec < params.cycleLengthSec)) {
    throw new Error(
      "atrioventricularDelaySec must be shorter than cycleLengthSec",
    );
  }
  validateClass(params.atrial, "atrial", params.cycleLengthSec);
  validateClass(params.ventricular, "ventricular", params.cycleLengthSec);
  if (params.ventricularDelayedMixture !== undefined) {
    const mixture = params.ventricularDelayedMixture;
    if (mixture.shape !== "delayed-convex-mixture-v1") {
      throw new Error("ventricular delayed mixture shape must be supported");
    }
    if (
      !(mixture.delayedWeight01 > 0 && mixture.delayedWeight01 < 1)
      || !Number.isFinite(mixture.delayedWeight01)
    ) {
      throw new Error("ventricular delayed mixture weight must be in (0, 1)");
    }
    if (
      !(mixture.delaySec > 0 && mixture.delaySec < params.cycleLengthSec)
      || !Number.isFinite(mixture.delaySec)
    ) {
      throw new Error("ventricular delayed mixture delay must be within cycle");
    }
    if (
      !(mixture.unnormalizedMixturePeak01 > 0
        && mixture.unnormalizedMixturePeak01 <= 1)
      || !Number.isFinite(mixture.unnormalizedMixturePeak01)
    ) {
      throw new Error("ventricular delayed mixture peak must be in (0, 1]");
    }
    for (const wall of ["LVFW", "SEP", "RVFW"] as const) {
      if ((params.decayTimeScaleByWall?.[wall] ?? 1) !== 1) {
        throw new Error(
          "ventricular delayed mixture cannot combine with wall-specific ventricular decay scaling",
        );
      }
    }
  }
  if (params.peakAmplitudeScaleByWall !== undefined) {
    for (const wall of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      const scale = params.peakAmplitudeScaleByWall[wall];
      if (scale !== undefined)
        requireNonnegative(scale, `${wall} amplitude scale`);
    }
  }
  if (params.decayTimeScaleByWall !== undefined) {
    for (const wall of ["LA", "RA", "LVFW", "SEP", "RVFW"] as const) {
      const scale = params.decayTimeScaleByWall[wall];
      if (scale === undefined) continue;
      requirePositive(scale, `${wall} decay-time scale`);
      const tissue =
        wall === "LA" || wall === "RA" ? params.atrial : params.ventricular;
      if (!(tissue.decayTimeConstantSec * scale > tissue.riseTimeConstantSec)) {
        throw new Error(`${wall} scaled decay time must exceed rise time`);
      }
    }
  }
}

function amplitudeScale(
  params: FiveWallNormalCalciumDriveParamsV1,
  wall: keyof FiveWallCalciumValuesV1,
): number {
  return params.peakAmplitudeScaleByWall?.[wall] ?? 1;
}

function decayTimeScale(
  params: FiveWallNormalCalciumDriveParamsV1,
  wall: keyof FiveWallCalciumValuesV1,
): number {
  return params.decayTimeScaleByWall?.[wall] ?? 1;
}

function validateClass(
  value: PeriodicBiexponentialCalciumClassV1,
  label: string,
  cycleLengthSec: number,
): void {
  requireNonnegative(value.diastolicCalciumUM, `${label}.diastolicCalciumUM`);
  requireNonnegative(value.peakAmplitudeUM, `${label}.peakAmplitudeUM`);
  requirePositive(value.riseTimeConstantSec, `${label}.riseTimeConstantSec`);
  requirePositive(value.decayTimeConstantSec, `${label}.decayTimeConstantSec`);
  requireNonnegative(
    value.electricalToCalciumDelaySec,
    `${label}.electricalToCalciumDelaySec`,
  );
  if (!(value.decayTimeConstantSec > value.riseTimeConstantSec)) {
    throw new Error(
      `${label}.decayTimeConstantSec must exceed riseTimeConstantSec`,
    );
  }
  if (!(value.electricalToCalciumDelaySec < cycleLengthSec)) {
    throw new Error(
      `${label}.electricalToCalciumDelaySec must be shorter than cycle`,
    );
  }
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositive(value: number, label: string): number {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}

function requireNonnegative(value: number, label: string): number {
  if (value < 0 || !Number.isFinite(value)) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreeze(child);
  }
  return value;
}
