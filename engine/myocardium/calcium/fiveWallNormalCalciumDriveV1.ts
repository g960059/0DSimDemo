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

export type FiveWallNormalCalciumDriveParamsV1 = Readonly<{
  parameterSetId: string;
  cycleLengthSec: number;
  atrioventricularDelaySec: number;
  atrial: PeriodicBiexponentialCalciumClassV1;
  ventricular: PeriodicBiexponentialCalciumClassV1;
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
    reportedTimeToPeakMs: 171,
    reportedRelaxationTime50Ms: 122,
    reportedRelaxationTime90Ms: 281,
  }),
  reconstruction:
    "two-exponential-component-metric-construction-not-measured-calcium-trace" as const,
  pvLoopMorphologyFitUsed: false as const,
});

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
  const ventricularPulse = normalizedPeriodicBiexponential(
    ventricularTime,
    cycle,
    params.ventricular.riseTimeConstantSec,
    params.ventricular.decayTimeConstantSec,
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
    LVFW: normalizedPeriodicBiexponential(
      ventricularTime,
      cycle,
      params.ventricular.riseTimeConstantSec,
      params.ventricular.decayTimeConstantSec * decayTimeScale(params, "LVFW"),
    ),
    SEP: normalizedPeriodicBiexponential(
      ventricularTime,
      cycle,
      params.ventricular.riseTimeConstantSec,
      params.ventricular.decayTimeConstantSec * decayTimeScale(params, "SEP"),
    ),
    RVFW: normalizedPeriodicBiexponential(
      ventricularTime,
      cycle,
      params.ventricular.riseTimeConstantSec,
      params.ventricular.decayTimeConstantSec * decayTimeScale(params, "RVFW"),
    ),
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
  if (decayTimeConstantSec === riseTimeConstantSec) {
    return normalizedPeriodicAlphaLimit(
      timeSinceOnsetSec,
      cycleLengthSec,
      riseTimeConstantSec,
    );
  }
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

/**
 * Exact equal-time-constant limit of the normalized periodic biexponential.
 * The unequal-time-constant path above remains the Standard-65 arithmetic.
 */
function normalizedPeriodicAlphaLimit(
  timeSinceOnsetSec: number,
  cycleLengthSec: number,
  timeConstantSec: number,
): number {
  const carry = Math.exp(-cycleLengthSec / timeConstantSec);
  const periodicAgeOffsetSec = cycleLengthSec * carry / (1 - carry);
  const raw = (timeSec: number): number =>
    (timeSec + periodicAgeOffsetSec) * Math.exp(-timeSec / timeConstantSec);
  const peakTimeSec = Math.min(
    cycleLengthSec,
    Math.max(0, timeConstantSec - periodicAgeOffsetSec),
  );
  const minimum = raw(0);
  const amplitude = raw(peakTimeSec) - minimum;
  if (!(amplitude > 0) || !Number.isFinite(amplitude)) {
    throw new Error("periodic alpha-limit pulse has no positive amplitude");
  }
  const normalized = (raw(timeSinceOnsetSec) - minimum) / amplitude;
  const tolerance = 1e-12;
  if (normalized < -tolerance || normalized > 1 + tolerance) {
    throw new Error("normalized periodic alpha-limit pulse left [0,1]");
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
      if (!(tissue.decayTimeConstantSec * scale >= tissue.riseTimeConstantSec)) {
        throw new Error(
          `${wall} scaled decay time must not be shorter than rise time`,
        );
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
  if (!(value.decayTimeConstantSec >= value.riseTimeConstantSec)) {
    throw new Error(
      `${label}.decayTimeConstantSec must not be shorter than riseTimeConstantSec`,
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
