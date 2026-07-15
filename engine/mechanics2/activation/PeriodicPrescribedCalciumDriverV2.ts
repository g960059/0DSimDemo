import {
  derivePrescribedCalciumOdeParameters,
  effectiveCalciumRateTargetAtCycleLength,
  evaluatePrescribedCalciumOutput,
  type PrescribedCalciumOdeParameters,
} from "@/engine/myocardium/calcium/PrescribedCalciumTransientV1";
import {
  ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  initialPeriodicPrescribedCalciumDriverStateV1,
  type PeriodicPrescribedCalciumDriverParamsV1,
  type PeriodicPrescribedCalciumDriverStateV1,
  type PeriodicPrescribedCalciumDriverTrialV1,
} from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV1";

export {
  ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
};

export const PERIODIC_PRESCRIBED_CALCIUM_DRIVER_ID_V2 =
  "periodic-prescribed-calcium-driver-v2" as const;

/**
 * This V2 is deliberately confined to the mechanics2 clean-room lane.  The
 * shared myocardium V1 residual and its backward-Euler contract are unchanged.
 * Tau and amplitude normalization are also held at the existing V1 calibration
 * during this ablation; only interval propagation changes.
 */
export const PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_V2 = Object.freeze({
  scheduler: "absolute-interval-periodic-event-timing" as const,
  stateTransition: "exact-homogeneous-linear-two-state-transition" as const,
  pulseForcing: "event-aligned-sixteen-point-gauss-legendre-convolution" as const,
  pulseShape: "finite-width-raised-cosine" as const,
  midpointReadback: true as const,
  calibrationPolicy: "fixed-zero-initial-single-pulse-be-v1-for-propagator-ablation" as const,
  sharedMyocardiumV1Modified: false as const,
  dimensionalFreeCalcium: true as const,
  conservedCalciumCycling: false as const,
} as const);

export type PeriodicPrescribedCalciumDriverStateV2 = PeriodicPrescribedCalciumDriverStateV1;
export type PeriodicPrescribedCalciumDriverParamsV2 = PeriodicPrescribedCalciumDriverParamsV1;

export type PeriodicPrescribedCalciumIntervalAuditV2 = {
  readonly policyId: typeof PERIODIC_PRESCRIBED_CALCIUM_DRIVER_ID_V2;
  readonly intervalStartTimeSec: number;
  readonly intervalEndTimeSec: number;
  readonly endpointSegmentCount: number;
  readonly midpointSegmentCount: number;
  readonly endpointInteriorBoundaryCount: number;
  readonly endpointReleaseBoundaryCount: number;
  readonly calibrationPolicy: typeof PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_V2.calibrationPolicy;
};

export type PeriodicPrescribedCalciumDriverTrialV2 = Omit<
PeriodicPrescribedCalciumDriverTrialV1,
"nextState"
> & {
  readonly nextState: PeriodicPrescribedCalciumDriverStateV2;
  readonly midpointState: PeriodicPrescribedCalciumDriverStateV2;
  readonly midpointFreeCalciumUM: number;
  readonly integrationAudit: PeriodicPrescribedCalciumIntervalAuditV2;
};

export type PeriodicPrescribedCalciumIntervalResultV2 = {
  readonly nextState: PeriodicPrescribedCalciumDriverStateV2;
  readonly segmentCount: number;
  readonly interiorBoundaryCount: number;
  readonly releaseBoundaryCount: number;
};

const GL16_NODES = Object.freeze([
  -0.9894009349916499,
  -0.9445750230732326,
  -0.8656312023878318,
  -0.755404408355003,
  -0.6178762444026438,
  -0.4580167776572274,
  -0.2816035507792589,
  -0.09501250983763744,
  0.09501250983763744,
  0.2816035507792589,
  0.4580167776572274,
  0.6178762444026438,
  0.755404408355003,
  0.8656312023878318,
  0.9445750230732326,
  0.9894009349916499,
] as const);

const GL16_WEIGHTS = Object.freeze([
  0.027152459411754095,
  0.06225352393864789,
  0.09515851168249278,
  0.12462897125553387,
  0.14959598881657673,
  0.16915651939500254,
  0.1826034150449236,
  0.1894506104550685,
  0.1894506104550685,
  0.1826034150449236,
  0.16915651939500254,
  0.14959598881657673,
  0.12462897125553387,
  0.09515851168249278,
  0.06225352393864789,
  0.027152459411754095,
] as const);

export function initialPeriodicPrescribedCalciumDriverStateV2():
PeriodicPrescribedCalciumDriverStateV2 {
  return initialPeriodicPrescribedCalciumDriverStateV1();
}

export function trialPeriodicPrescribedCalciumDriverV2(
  previous: PeriodicPrescribedCalciumDriverStateV2,
  nextTimeSec: number,
  dtSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV2,
): PeriodicPrescribedCalciumDriverTrialV2 {
  const event = periodicEventAt(nextTimeSec, params);
  const issues = validationIssues(previous, nextTimeSec, dtSec, params);
  if (issues.length > 0) return invalidTrial(previous, event, nextTimeSec, dtSec, issues);

  try {
    const intervalStartTimeSec = nextTimeSec - dtSec;
    const midpointTimeSec = intervalStartTimeSec + 0.5 * dtSec;
    const endpoint = propagatePeriodicPrescribedCalciumIntervalV2(
      previous,
      intervalStartTimeSec,
      nextTimeSec,
      params,
    );
    const midpoint = propagatePeriodicPrescribedCalciumIntervalV2(
      previous,
      intervalStartTimeSec,
      midpointTimeSec,
      params,
    );
    const endpointOutput = calciumOutputAt(endpoint.nextState, nextTimeSec, dtSec, params);
    const midpointOutput = calciumOutputAt(
      midpoint.nextState,
      midpointTimeSec,
      0.5 * dtSec,
      params,
    );
    const numeric = [
      endpoint.nextState.riseState01,
      endpoint.nextState.decayState01,
      midpoint.nextState.riseState01,
      midpoint.nextState.decayState01,
      endpointOutput.freeCalciumUM,
      midpointOutput.freeCalciumUM,
      endpointOutput.releaseDriveUMPerSec ?? Number.NaN,
      endpointOutput.clearanceDriveUMPerSec ?? Number.NaN,
    ];
    if (!numeric.every(Number.isFinite)
        || endpoint.nextState.riseState01 < 0
        || endpoint.nextState.decayState01 < 0
        || midpoint.nextState.riseState01 < 0
        || midpoint.nextState.decayState01 < 0) {
      return invalidTrial(previous, event, nextTimeSec, dtSec, [
        "non-finite or negative calcium interval state",
      ]);
    }
    return Object.freeze({
      valid: true,
      issues: Object.freeze([]),
      previousState: previous,
      nextState: endpoint.nextState,
      midpointState: midpoint.nextState,
      event,
      freeCalciumUM: endpointOutput.freeCalciumUM,
      midpointFreeCalciumUM: midpointOutput.freeCalciumUM,
      riseState01: endpoint.nextState.riseState01,
      decayState01: endpoint.nextState.decayState01,
      releaseDriveUMPerSec: endpointOutput.releaseDriveUMPerSec ?? 0,
      clearanceDriveUMPerSec: endpointOutput.clearanceDriveUMPerSec ?? 0,
      integrationAudit: Object.freeze({
        policyId: PERIODIC_PRESCRIBED_CALCIUM_DRIVER_ID_V2,
        intervalStartTimeSec,
        intervalEndTimeSec: nextTimeSec,
        endpointSegmentCount: endpoint.segmentCount,
        midpointSegmentCount: midpoint.segmentCount,
        endpointInteriorBoundaryCount: endpoint.interiorBoundaryCount,
        endpointReleaseBoundaryCount: endpoint.releaseBoundaryCount,
        calibrationPolicy: PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_V2.calibrationPolicy,
      }),
    });
  } catch (error) {
    return invalidTrial(previous, event, nextTimeSec, dtSec, [
      error instanceof Error ? error.message : "unknown exact-interval calcium error",
    ]);
  }
}

export function propagatePeriodicPrescribedCalciumIntervalV2(
  previous: PeriodicPrescribedCalciumDriverStateV2,
  intervalStartTimeSec: number,
  intervalEndTimeSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV2,
): PeriodicPrescribedCalciumIntervalResultV2 {
  if (!Number.isFinite(intervalStartTimeSec)
      || !Number.isFinite(intervalEndTimeSec)
      || intervalStartTimeSec < 0
      || intervalEndTimeSec <= intervalStartTimeSec) {
    throw new Error("calcium interval must be finite, non-negative, and increasing");
  }
  if (!Number.isFinite(previous.riseState01) || previous.riseState01 < 0
      || !Number.isFinite(previous.decayState01) || previous.decayState01 < 0) {
    throw new Error("previous calcium interval state must be finite and non-negative");
  }
  const target = effectiveCalciumRateTargetAtCycleLength(params.calcium, params.cycleLengthSec);
  const ode = derivePrescribedCalciumOdeParameters(target);
  const partition = intervalPartition(intervalStartTimeSec, intervalEndTimeSec, params, ode);
  let state = previous;
  for (let index = 0; index < partition.points.length - 1; index += 1) {
    const start = partition.points[index]!;
    const end = partition.points[index + 1]!;
    state = propagateSegment(state, start, end, params, ode);
  }
  return Object.freeze({
    nextState: Object.freeze({ ...state }),
    segmentCount: partition.points.length - 1,
    interiorBoundaryCount: partition.points.length - 2,
    releaseBoundaryCount: partition.releaseBoundaryCount,
  });
}

function propagateSegment(
  previous: PeriodicPrescribedCalciumDriverStateV2,
  startTimeSec: number,
  endTimeSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV2,
  ode: PrescribedCalciumOdeParameters,
): PeriodicPrescribedCalciumDriverStateV2 {
  const h = endTimeSec - startTimeSec;
  if (!(h > 0)) return previous;
  const riseRate = 1 / ode.tauRiseSec;
  const decayRate = 1 / ode.tauDecaySec;
  const meanRate = 0.5 * (riseRate + decayRate);
  const halfRateDifference = 0.5 * (riseRate - decayRate);
  const riseHomogeneous = Math.exp(-riseRate * h) * previous.riseState01;
  const decayHomogeneous = Math.exp(-decayRate * h) * previous.decayState01
    + decayRate * previous.riseState01 * h * Math.exp(-meanRate * h)
      * sinhc(halfRateDifference * h);
  const releaseStart = containingReleaseStart(0.5 * (startTimeSec + endTimeSec), params, ode);
  if (releaseStart === null || params.eventStrength01 === 0) {
    return Object.freeze({
      riseState01: riseHomogeneous,
      decayState01: decayHomogeneous,
    });
  }

  const half = 0.5 * h;
  const centre = half;
  const omega = 2 * Math.PI / ode.releaseWidthSec;
  let forcedRise = 0;
  let forcedDecay = 0;
  for (let index = 0; index < GL16_NODES.length; index += 1) {
    const localStepTime = centre + half * GL16_NODES[index]!;
    const absoluteTime = startTimeSec + localStepTime;
    const releaseLocalTime = absoluteTime - releaseStart;
    const pulse = params.eventStrength01 * 0.5
      * (1 - Math.cos(omega * releaseLocalTime));
    const lag = h - localStepTime;
    const riseKernel = riseRate * Math.exp(-riseRate * lag);
    const decayKernel = riseRate * decayRate * lag * Math.exp(-meanRate * lag)
      * sinhc(halfRateDifference * lag);
    const weightedPulse = GL16_WEIGHTS[index]! * pulse;
    forcedRise += weightedPulse * riseKernel;
    forcedDecay += weightedPulse * decayKernel;
  }
  return Object.freeze({
    riseState01: riseHomogeneous + half * forcedRise,
    decayState01: decayHomogeneous + half * forcedDecay,
  });
}

function intervalPartition(
  startTimeSec: number,
  endTimeSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV2,
  ode: PrescribedCalciumOdeParameters,
): { readonly points: readonly number[]; readonly releaseBoundaryCount: number } {
  const tolerance = 1e-12 * Math.max(1, Math.abs(startTimeSec), Math.abs(endTimeSec));
  const candidates: Array<{ readonly time: number; readonly release: boolean }> = [
    { time: startTimeSec, release: false },
    { time: endTimeSec, release: false },
  ];
  const firstCycle = Math.floor(startTimeSec / params.cycleLengthSec) - 2;
  const finalCycle = Math.ceil(endTimeSec / params.cycleLengthSec) + 2;
  for (let cycleIndex = firstCycle; cycleIndex <= finalCycle; cycleIndex += 1) {
    const cycleStart = cycleIndex * params.cycleLengthSec;
    const eventStart = cycleStart + params.eventOnsetSec;
    const releaseStart = eventStart + params.calcium.activationDelaySec;
    const boundaries = [
      { time: cycleStart, release: false },
      { time: eventStart, release: false },
      { time: releaseStart, release: true },
      { time: releaseStart + ode.releaseWidthSec, release: true },
    ];
    for (const boundary of boundaries) {
      if (boundary.time > startTimeSec + tolerance && boundary.time < endTimeSec - tolerance) {
        candidates.push(boundary);
      }
    }
  }
  candidates.sort((left, right) => left.time - right.time);
  const points: number[] = [];
  let releaseBoundaryCount = 0;
  for (const candidate of candidates) {
    const last = points.at(-1);
    if (last === undefined || Math.abs(candidate.time - last) > tolerance) {
      points.push(candidate.time);
      if (candidate.release) releaseBoundaryCount += 1;
    } else if (candidate.release && candidate.time > startTimeSec && candidate.time < endTimeSec) {
      releaseBoundaryCount += 1;
    }
  }
  return Object.freeze({ points: Object.freeze(points), releaseBoundaryCount });
}

function containingReleaseStart(
  timeSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV2,
  ode: PrescribedCalciumOdeParameters,
): number | null {
  const base = params.eventOnsetSec + params.calcium.activationDelaySec;
  const cycleIndex = Math.floor((timeSec - base) / params.cycleLengthSec);
  const start = base + cycleIndex * params.cycleLengthSec;
  const local = timeSec - start;
  const tolerance = 1e-12 * Math.max(1, Math.abs(timeSec));
  return local >= -tolerance && local <= ode.releaseWidthSec + tolerance ? start : null;
}

function calciumOutputAt(
  state: PeriodicPrescribedCalciumDriverStateV2,
  timeSec: number,
  dtSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV2,
) {
  const event = periodicEventAt(timeSec, params);
  return evaluatePrescribedCalciumOutput(
    [state.riseState01, state.decayState01],
    {
      targetId: params.targetId,
      activationEventId: event.activationEventId,
      timeSinceActivationSec: event.timeSinceActivationSec,
      cycleLengthSec: params.cycleLengthSec,
      activationStrength01: params.eventStrength01,
      dtSec,
    },
    params.calcium,
  );
}

function periodicEventAt(
  timeSec: number,
  params: Pick<PeriodicPrescribedCalciumDriverParamsV2,
  "cycleLengthSec" | "eventOnsetSec" | "eventStrength01">,
): PeriodicPrescribedCalciumDriverTrialV1["event"] {
  const shifted = timeSec - params.eventOnsetSec;
  const rhythmCycleIndex = Math.floor(shifted / params.cycleLengthSec + 1e-12);
  let timeSinceActivationSec = shifted - rhythmCycleIndex * params.cycleLengthSec;
  if (timeSinceActivationSec < 0) timeSinceActivationSec += params.cycleLengthSec;
  if (timeSinceActivationSec >= params.cycleLengthSec - 1e-12) timeSinceActivationSec = 0;
  return Object.freeze({
    activationEventId: Math.max(0, rhythmCycleIndex + 1),
    rhythmCycleIndex,
    timeSinceActivationSec,
    eventStrength01: params.eventStrength01,
  });
}

function validationIssues(
  previous: PeriodicPrescribedCalciumDriverStateV2,
  nextTimeSec: number,
  dtSec: number,
  params: PeriodicPrescribedCalciumDriverParamsV2,
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
  if (!Number.isFinite(dtSec) || dtSec <= 0 || nextTimeSec - dtSec < -1e-12) {
    issues.push("dtSec must define a positive interval starting at non-negative time");
  }
  if (typeof params.targetId !== "string" || params.targetId.trim().length === 0) {
    issues.push("targetId must be non-empty");
  }
  if (!Number.isFinite(params.cycleLengthSec) || params.cycleLengthSec <= 0) {
    issues.push("cycleLengthSec must be finite and positive");
  }
  if (!Number.isFinite(params.eventOnsetSec)
      || params.eventOnsetSec < 0
      || params.eventOnsetSec >= params.cycleLengthSec) {
    issues.push("eventOnsetSec must lie inside [0, cycleLengthSec)");
  }
  if (!Number.isFinite(params.eventStrength01)
      || params.eventStrength01 < 0
      || params.eventStrength01 > 1) {
    issues.push("eventStrength01 must lie inside [0,1]");
  }
  if (!Number.isInteger(params.minimumReleaseSamples) || params.minimumReleaseSamples < 2) {
    issues.push("minimumReleaseSamples must be an integer >= 2");
  }
  try {
    const width = effectiveCalciumRateTargetAtCycleLength(
      params.calcium,
      params.cycleLengthSec,
    ).releaseWidthSec;
    if (Number.isFinite(dtSec) && dtSec > width / params.minimumReleaseSamples + 1e-15) {
      issues.push("dtSec is too coarse for mechanics to resolve the prescribed-calcium release pulse");
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "invalid prescribed-calcium parameters");
  }
  return issues;
}

function invalidTrial(
  previous: PeriodicPrescribedCalciumDriverStateV2,
  event: PeriodicPrescribedCalciumDriverTrialV1["event"],
  nextTimeSec: number,
  dtSec: number,
  issues: readonly string[],
): PeriodicPrescribedCalciumDriverTrialV2 {
  return Object.freeze({
    valid: false,
    issues: Object.freeze([...issues]),
    previousState: previous,
    nextState: previous,
    midpointState: previous,
    event,
    freeCalciumUM: 0,
    midpointFreeCalciumUM: 0,
    riseState01: previous.riseState01,
    decayState01: previous.decayState01,
    releaseDriveUMPerSec: 0,
    clearanceDriveUMPerSec: 0,
    integrationAudit: Object.freeze({
      policyId: PERIODIC_PRESCRIBED_CALCIUM_DRIVER_ID_V2,
      intervalStartTimeSec: Number.isFinite(nextTimeSec - dtSec) ? nextTimeSec - dtSec : 0,
      intervalEndTimeSec: Number.isFinite(nextTimeSec) ? nextTimeSec : 0,
      endpointSegmentCount: 0,
      midpointSegmentCount: 0,
      endpointInteriorBoundaryCount: 0,
      endpointReleaseBoundaryCount: 0,
      calibrationPolicy: PERIODIC_PRESCRIBED_CALCIUM_DRIVER_CLAIM_V2.calibrationPolicy,
    }),
  });
}

function sinhc(value: number): number {
  const magnitude = Math.abs(value);
  if (magnitude < 1e-4) {
    const square = value * value;
    return 1 + square / 6 + square * square / 120;
  }
  return Math.sinh(value) / value;
}
