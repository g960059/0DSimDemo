import {
  PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
  PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
  effectiveCalciumRateTargetAtCycleLength,
  stepPrescribedCalciumTransientV1,
  type PrescribedCalciumParams,
} from "@/engine/myocardium/calcium";

export const PERIODIC_PRESCRIBED_CALCIUM_DRIVER_ID_V1 =
  "periodic-prescribed-calcium-driver-v1" as const;

export const PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_BOUNDARY_V1 = Object.freeze({
  scheduler: "periodic-event-timing-only",
  calcium: PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
  evidence: PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
  dimensionalFreeCalcium: true,
  acceptsStretchPressureOrVolume: false,
  conservedCalciumCycling: false,
  sercaRyrSrLoadOrCalciumAlternansClaimed: false,
} as const);

export type PeriodicPrescribedCalciumDriverStateV1 = {
  readonly riseState01: number;
  readonly decayState01: number;
};

export type PeriodicPrescribedCalciumDriverParamsV1 = {
  readonly targetId: string;
  readonly cycleLengthSec: number;
  /** Activation-event arrival inside the cycle; this is not a force waveform. */
  readonly eventOnsetSec: number;
  readonly eventStrength01: number;
  readonly calcium: PrescribedCalciumParams;
  /** Prevents a narrow release pulse from being silently skipped by a coarse step. */
  readonly minimumReleaseSamples: number;
};

export type PeriodicPrescribedCalciumDriverTrialV1 = {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly previousState: PeriodicPrescribedCalciumDriverStateV1;
  readonly nextState: PeriodicPrescribedCalciumDriverStateV1;
  readonly event: {
    readonly activationEventId: number;
    readonly rhythmCycleIndex: number;
    readonly timeSinceActivationSec: number;
    readonly eventStrength01: number;
  };
  readonly freeCalciumUM: number;
  readonly riseState01: number;
  readonly decayState01: number;
  readonly releaseDriveUMPerSec: number;
  readonly clearanceDriveUMPerSec: number;
};

export const VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1:
PrescribedCalciumParams = deepFreeze({
  parameterSetId: "ventricular-prescribed-calcium-report-only-seed-v1",
  temperatureModelId: "fixed-310.15K-v1",
  interpolation: "piecewise-linear",
  activationDelaySec: 0.012,
  claimBoundary: PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
  evidenceStatus: PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
  rateTargets: [
    {
      cycleLengthSec: 0.6,
      diastolicCalciumUM: 0.10,
      peakAmplitudeUM: 0.65,
      riseTimeSec: 0.070,
      decayHalfTimeSec: 0.115,
      releaseWidthSec: 0.024,
    },
    {
      cycleLengthSec: 0.8,
      diastolicCalciumUM: 0.10,
      peakAmplitudeUM: 0.70,
      riseTimeSec: 0.082,
      decayHalfTimeSec: 0.135,
      releaseWidthSec: 0.027,
    },
    {
      cycleLengthSec: 1,
      diastolicCalciumUM: 0.10,
      peakAmplitudeUM: 0.75,
      riseTimeSec: 0.094,
      decayHalfTimeSec: 0.155,
      releaseWidthSec: 0.030,
    },
  ],
});

export const ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1:
PrescribedCalciumParams = deepFreeze({
  parameterSetId: "atrial-prescribed-calcium-report-only-seed-v1",
  temperatureModelId: "fixed-310.15K-v1",
  interpolation: "piecewise-linear",
  activationDelaySec: 0.008,
  claimBoundary: PRESCRIBED_CALCIUM_PHASE2A_CLAIM_BOUNDARY,
  evidenceStatus: PRESCRIBED_CALCIUM_PHASE2A_EVIDENCE_STATUS,
  rateTargets: [
    {
      cycleLengthSec: 0.6,
      diastolicCalciumUM: 0.10,
      peakAmplitudeUM: 0.65,
      riseTimeSec: 0.050,
      decayHalfTimeSec: 0.075,
      releaseWidthSec: 0.018,
    },
    {
      cycleLengthSec: 0.8,
      diastolicCalciumUM: 0.10,
      peakAmplitudeUM: 0.70,
      riseTimeSec: 0.057,
      decayHalfTimeSec: 0.090,
      releaseWidthSec: 0.020,
    },
    {
      cycleLengthSec: 1,
      diastolicCalciumUM: 0.10,
      peakAmplitudeUM: 0.75,
      riseTimeSec: 0.065,
      decayHalfTimeSec: 0.105,
      releaseWidthSec: 0.022,
    },
  ],
});

export function initialPeriodicPrescribedCalciumDriverStateV1():
PeriodicPrescribedCalciumDriverStateV1 {
  return Object.freeze({ riseState01: 0, decayState01: 0 });
}

/**
 * Pure transactional calcium trial. The prescribed waveform owns no blood,
 * mechanics, SR inventory, or beat-to-beat calcium-cycling memory beyond its
 * two linear filter states.
 */
export function trialPeriodicPrescribedCalciumDriverV1(
  previous: PeriodicPrescribedCalciumDriverStateV1,
  nextTimeSec: number,
  dtSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV1,
): PeriodicPrescribedCalciumDriverTrialV1 {
  const issues = validateInput(previous, nextTimeSec, dtSec, params);
  const safeEvent = periodicEventAt(nextTimeSec, params);
  if (issues.length > 0) {
    return invalidTrial(previous, safeEvent, issues);
  }

  try {
    const step = stepPrescribedCalciumTransientV1(
      [previous.riseState01, previous.decayState01],
      {
        targetId: params.targetId,
        activationEventId: safeEvent.activationEventId,
        timeSinceActivationSec: safeEvent.timeSinceActivationSec,
        cycleLengthSec: params.cycleLengthSec,
        activationStrength01: params.eventStrength01,
        dtSec,
      },
      params.calcium,
    );
    const nextState = Object.freeze({
      riseState01: step.output.riseState01,
      decayState01: step.output.decayState01,
    });
    const numeric = [
      nextState.riseState01,
      nextState.decayState01,
      step.output.freeCalciumUM,
      step.output.releaseDriveUMPerSec ?? Number.NaN,
      step.output.clearanceDriveUMPerSec ?? Number.NaN,
    ];
    if (!numeric.every(Number.isFinite) || nextState.riseState01 < 0 || nextState.decayState01 < 0) {
      return invalidTrial(previous, safeEvent, ["non-finite or negative calcium state"]);
    }
    return Object.freeze({
      valid: true,
      issues: Object.freeze([]),
      previousState: previous,
      nextState,
      event: safeEvent,
      freeCalciumUM: step.output.freeCalciumUM,
      riseState01: nextState.riseState01,
      decayState01: nextState.decayState01,
      releaseDriveUMPerSec: step.output.releaseDriveUMPerSec ?? 0,
      clearanceDriveUMPerSec: step.output.clearanceDriveUMPerSec ?? 0,
    });
  } catch (error) {
    return invalidTrial(previous, safeEvent, [
      error instanceof Error ? error.message : "unknown prescribed-calcium error",
    ]);
  }
}

function periodicEventAt(
  timeSec: number,
  params: Pick<PeriodicPrescribedCalciumDriverParamsV1, "cycleLengthSec" | "eventOnsetSec" | "eventStrength01">,
): PeriodicPrescribedCalciumDriverTrialV1["event"] {
  const cycle = positiveFiniteOr(params.cycleLengthSec, 1);
  const onset = finiteOr(params.eventOnsetSec, 0);
  const time = finiteOr(timeSec, 0);
  const shifted = time - onset;
  const rhythmCycleIndex = Math.floor(shifted / cycle + 1e-12);
  let timeSinceActivationSec = shifted - rhythmCycleIndex * cycle;
  if (timeSinceActivationSec < 0) timeSinceActivationSec += cycle;
  if (timeSinceActivationSec >= cycle - 1e-12) timeSinceActivationSec = 0;
  return Object.freeze({
    activationEventId: Math.max(0, rhythmCycleIndex + 1),
    rhythmCycleIndex,
    timeSinceActivationSec,
    eventStrength01: finiteOr(params.eventStrength01, 0),
  });
}

function validateInput(
  previous: PeriodicPrescribedCalciumDriverStateV1,
  nextTimeSec: number,
  dtSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV1,
): string[] {
  const issues: string[] = [];
  if (!Number.isFinite(previous.riseState01) || previous.riseState01 < 0) {
    issues.push("previous.riseState01 must be finite and non-negative");
  }
  if (!Number.isFinite(previous.decayState01) || previous.decayState01 < 0) {
    issues.push("previous.decayState01 must be finite and non-negative");
  }
  if (!Number.isFinite(nextTimeSec) || nextTimeSec < 0) {
    issues.push("nextTimeSec must be finite and non-negative");
  }
  if (!Number.isFinite(dtSec) || dtSec <= 0) issues.push("dtSec must be finite and positive");
  if (typeof params.targetId !== "string" || params.targetId.trim().length === 0) {
    issues.push("targetId must be non-empty");
  }
  if (!Number.isFinite(params.cycleLengthSec) || params.cycleLengthSec <= 0) {
    issues.push("cycleLengthSec must be finite and positive");
  }
  if (
    !Number.isFinite(params.eventOnsetSec)
    || params.eventOnsetSec < 0
    || params.eventOnsetSec >= params.cycleLengthSec
  ) {
    issues.push("eventOnsetSec must lie inside [0, cycleLengthSec)");
  }
  if (
    !Number.isFinite(params.eventStrength01)
    || params.eventStrength01 < 0
    || params.eventStrength01 > 1
  ) {
    issues.push("eventStrength01 must lie inside [0,1]");
  }
  if (!Number.isInteger(params.minimumReleaseSamples) || params.minimumReleaseSamples < 2) {
    issues.push("minimumReleaseSamples must be an integer >= 2");
  }
  let activeReleaseWidthSec = Number.NaN;
  try {
    activeReleaseWidthSec = effectiveCalciumRateTargetAtCycleLength(
      params.calcium,
      params.cycleLengthSec,
    ).releaseWidthSec;
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "invalid prescribed-calcium parameters");
  }
  if (
    Number.isFinite(dtSec)
    && Number.isFinite(activeReleaseWidthSec)
    && dtSec > activeReleaseWidthSec / params.minimumReleaseSamples + 1e-15
  ) {
    issues.push("dtSec is too coarse for the configured prescribed-calcium release pulse");
  }
  return issues;
}

function invalidTrial(
  previous: PeriodicPrescribedCalciumDriverStateV1,
  event: PeriodicPrescribedCalciumDriverTrialV1["event"],
  issues: readonly string[],
): PeriodicPrescribedCalciumDriverTrialV1 {
  return Object.freeze({
    valid: false,
    issues: Object.freeze([...issues]),
    previousState: previous,
    nextState: previous,
    event,
    freeCalciumUM: 0,
    riseState01: previous.riseState01,
    decayState01: previous.decayState01,
    releaseDriveUMPerSec: 0,
    clearanceDriveUMPerSec: 0,
  });
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function positiveFiniteOr(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}
