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
}>;

export const FIVE_WALL_NORMAL_CALCIUM_DRIVE_CLAIM_V1 = Object.freeze({
  waveform: "periodic-analytically-normalized-biexponential" as const,
  tissueClasses: Object.freeze(["atrial-shared", "ventricular-shared"] as const),
  atriaShareOneWaveform: true as const,
  ventricularWallsShareOneWaveform: true as const,
  volumeInput: false as const,
  pressureInput: false as const,
  flowInput: false as const,
  strainInput: false as const,
  pvLoopPhaseInput: false as const,
  conservedCalciumCyclingClaimed: false as const,
  measuredCalciumTraceClaimed: false as const,
  pvLoopMorphologyFitAllowed: false as const,
});

/**
 * Low-order normal construction from the published Land twitch contexts.
 * These values reconstruct component timing; they are not digitized calcium
 * traces and do not claim SR/RyR/SERCA state ownership.
 */
export const FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1:
  FiveWallNormalCalciumDriveParamsV1 = deepFreeze({
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
  params: FiveWallNormalCalciumDriveParamsV1 =
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
): FiveWallNormalCalciumEvaluationV1 {
  validateParams(params);
  requireFinite(timeSec, "timeSec");
  const cycle = params.cycleLengthSec;
  const ventricularOnsetPhaseSec = positiveModulo(
    params.ventricular.electricalToCalciumDelaySec,
    cycle,
  );
  const atrialOnsetPhaseSec = positiveModulo(
    cycle - params.atrioventricularDelaySec +
      params.atrial.electricalToCalciumDelaySec,
    cycle,
  );
  const ventricularTime = positiveModulo(timeSec - ventricularOnsetPhaseSec, cycle);
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
  const atrialCalcium = params.atrial.diastolicCalciumUM +
    params.atrial.peakAmplitudeUM * atrialPulse;
  const ventricularCalcium = params.ventricular.diastolicCalciumUM +
    params.ventricular.peakAmplitudeUM * ventricularPulse;
  const freeCalciumUMByWall = Object.freeze({
    LA: atrialCalcium,
    RA: atrialCalcium,
    LVFW: ventricularCalcium,
    SEP: ventricularCalcium,
    RVFW: ventricularCalcium,
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
  const peakTimeSec = Math.log(
    (riseCarry / riseTimeConstantSec) /
      (decayCarry / decayTimeConstantSec),
  ) / (1 / riseTimeConstantSec - 1 / decayTimeConstantSec);
  const boundedPeakTimeSec = Math.min(
    cycleLengthSec,
    Math.max(0, peakTimeSec),
  );
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

function validateParams(params: FiveWallNormalCalciumDriveParamsV1): void {
  if (typeof params.parameterSetId !== "string" || params.parameterSetId.trim() === "") {
    throw new Error("parameterSetId must be non-empty");
  }
  requirePositive(params.cycleLengthSec, "cycleLengthSec");
  requirePositive(params.atrioventricularDelaySec, "atrioventricularDelaySec");
  if (!(params.atrioventricularDelaySec < params.cycleLengthSec)) {
    throw new Error("atrioventricularDelaySec must be shorter than cycleLengthSec");
  }
  validateClass(params.atrial, "atrial", params.cycleLengthSec);
  validateClass(params.ventricular, "ventricular", params.cycleLengthSec);
}

function validateClass(
  value: PeriodicBiexponentialCalciumClassV1,
  label: string,
  cycleLengthSec: number,
): void {
  requireNonnegative(value.diastolicCalciumUM, `${label}.diastolicCalciumUM`);
  requirePositive(value.peakAmplitudeUM, `${label}.peakAmplitudeUM`);
  requirePositive(value.riseTimeConstantSec, `${label}.riseTimeConstantSec`);
  requirePositive(value.decayTimeConstantSec, `${label}.decayTimeConstantSec`);
  requireNonnegative(
    value.electricalToCalciumDelaySec,
    `${label}.electricalToCalciumDelaySec`,
  );
  if (!(value.decayTimeConstantSec > value.riseTimeConstantSec)) {
    throw new Error(`${label}.decayTimeConstantSec must exceed riseTimeConstantSec`);
  }
  if (!(value.electricalToCalciumDelaySec < cycleLengthSec)) {
    throw new Error(`${label}.electricalToCalciumDelaySec must be shorter than cycle`);
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
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
