/**
 * Generic timebase primitives for diagnostics over accepted variable steps.
 *
 * Every interval owns its accepted endpoint and the events in (start, end].
 * The module is readback-only: it adds no dynamic state, interpolation,
 * resampling, smoothing, or physiology-specific parameter.
 */

export const ACCEPTED_INTERVAL_TIMEBASE_V1_ID =
  "accepted-interval-timebase-v1" as const;

export const ACCEPTED_INTERVAL_TIMEBASE_V1_CLAIM = Object.freeze({
  acceptedReadbackOnly: true as const,
  addsDynamicState: false as const,
  intervalOwnership: "open-start-closed-end" as const,
  quadrature: "backward-Euler-endpoint" as const,
  interpolationOrResampling: false as const,
  physiologySpecificParameter: false as const,
  regressionAbscissa: "accepted-endpoint-time" as const,
  regressionWeight: "accepted-interval-duration" as const,
});

/** An accepted sample stored at its physical timestamp. */
export type AcceptedIntervalEndpointSampleV1<TSample> = Readonly<{
  timeSec: number;
  sample: TSample;
}>;

/**
 * An event with stable ownership identity. Coincident events are allowed when
 * their eventId values differ.
 */
export type AcceptedIntervalOpenClosedEventV1<TEvent> = Readonly<{
  eventId: string;
  timeSec: number;
  event: TEvent;
}>;

/** One accepted transition; events belong to (startTimeSec, endTimeSec]. */
export type AcceptedIntervalV1<TSample, TEvent = never> = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  endpointSample: AcceptedIntervalEndpointSampleV1<TSample>;
  eventsOpenClosed: readonly AcceptedIntervalOpenClosedEventV1<TEvent>[];
}>;

/**
 * A retained accepted trace and the accepted sample immediately preceding its
 * interval endpoints. The preceding sample timestamp is the window start.
 */
export type RetainedAcceptedIntervalWindowV1<TSample, TEvent = never> =
  Readonly<{
    timebaseId: typeof ACCEPTED_INTERVAL_TIMEBASE_V1_ID;
    startTimeSec: number;
    endTimeSec: number;
    durationSec: number;
    precedingSample: AcceptedIntervalEndpointSampleV1<TSample>;
    intervals: readonly AcceptedIntervalV1<TSample, TEvent>[];
  }>;

export type AcceptedIntervalValidationOptionsV1 = Readonly<{
  /** Numerical time comparison only; never a physiological tolerance. */
  absoluteTimeToleranceSec?: number;
  relativeTimeTolerance?: number;
}>;

export type AcceptedIntervalBackwardEulerIntegralV1 = Readonly<{
  /** Integral of the signed endpoint signal. */
  signed: number;
  /** Integral of max(signal, 0). */
  positive: number;
  /** Integral of min(signal, 0), hence non-positive. */
  negative: number;
  /** Integral of max(-signal, 0), equal to -negative. */
  negativeMagnitude: number;
  durationSec: number;
}>;

export type AcceptedIntervalDurationWeightedLinearRegressionV1 = Readonly<{
  sampleCount: number;
  totalWeightSec: number;
  weightedMeanTimeSec: number;
  weightedMeanValue: number;
  slopePerSec: number;
  intercept: number;
  weightedResidualSumSquares: number;
  weightedTotalSumSquares: number;
  rSquared: number | null;
}>;

const DEFAULT_ABSOLUTE_TIME_TOLERANCE_SEC = 1e-12;
const DEFAULT_RELATIVE_TIME_TOLERANCE = 64 * Number.EPSILON;

/**
 * Validates the ownership and physical-time invariants of a retained window.
 * Throws rather than silently repairing malformed diagnostic provenance.
 */
export function validateRetainedAcceptedIntervalWindowV1<TSample, TEvent>(
  window: RetainedAcceptedIntervalWindowV1<TSample, TEvent>,
  options: AcceptedIntervalValidationOptionsV1 = {},
): void {
  const tolerance = validationTolerance(options);
  assertFiniteTime("window.startTimeSec", window.startTimeSec);
  assertFiniteTime("window.endTimeSec", window.endTimeSec);
  assertFiniteDuration("window.durationSec", window.durationSec);
  if (window.timebaseId !== ACCEPTED_INTERVAL_TIMEBASE_V1_ID) {
    throw new Error(
      `timebaseId must be ${ACCEPTED_INTERVAL_TIMEBASE_V1_ID}`,
    );
  }
  if (!(window.endTimeSec > window.startTimeSec)) {
    throw new Error("window endTimeSec must be greater than startTimeSec");
  }
  assertTimeEqual(
    "window duration does not match end minus start",
    window.durationSec,
    window.endTimeSec - window.startTimeSec,
    tolerance,
  );
  if (window.intervals.length === 0) {
    throw new Error("retained window must contain at least one interval");
  }
  assertFiniteTime(
    "precedingSample.timeSec",
    window.precedingSample.timeSec,
  );
  assertTimeEqual(
    "preceding sample must be at window start",
    window.precedingSample.timeSec,
    window.startTimeSec,
    tolerance,
  );

  const ownedEventIds = new Set<string>();
  let expectedStart = window.startTimeSec;
  let durationSum = 0;
  let previousEventTime = Number.NEGATIVE_INFINITY;

  window.intervals.forEach((interval, intervalIndex) => {
    const prefix = `interval[${intervalIndex}]`;
    assertFiniteTime(`${prefix}.startTimeSec`, interval.startTimeSec);
    assertFiniteTime(`${prefix}.endTimeSec`, interval.endTimeSec);
    assertFiniteDuration(`${prefix}.durationSec`, interval.durationSec);
    if (!(interval.endTimeSec > interval.startTimeSec)) {
      throw new Error(`${prefix} endTimeSec must be greater than startTimeSec`);
    }
    assertTimeEqual(
      `${prefix} is not contiguous with the preceding accepted endpoint`,
      interval.startTimeSec,
      expectedStart,
      tolerance,
    );
    assertTimeEqual(
      `${prefix} duration does not match end minus start`,
      interval.durationSec,
      interval.endTimeSec - interval.startTimeSec,
      tolerance,
    );
    assertFiniteTime(
      `${prefix}.endpointSample.timeSec`,
      interval.endpointSample.timeSec,
    );
    assertTimeEqual(
      `${prefix} endpoint sample does not match interval end`,
      interval.endpointSample.timeSec,
      interval.endTimeSec,
      tolerance,
    );

    let previousLocalEventTime = Number.NEGATIVE_INFINITY;
    interval.eventsOpenClosed.forEach((event, eventIndex) => {
      const eventPrefix = `${prefix}.eventsOpenClosed[${eventIndex}]`;
      if (event.eventId.length === 0) {
        throw new Error(`${eventPrefix}.eventId must not be empty`);
      }
      if (ownedEventIds.has(event.eventId)) {
        throw new Error(`eventId ${event.eventId} is owned more than once`);
      }
      assertFiniteTime(`${eventPrefix}.timeSec`, event.timeSec);
      if (
        event.timeSec < previousLocalEventTime
        && !timesEqual(event.timeSec, previousLocalEventTime, tolerance)
      ) {
        throw new Error(`${prefix} events must be monotone non-decreasing`);
      }
      if (
        event.timeSec < previousEventTime
        && !timesEqual(event.timeSec, previousEventTime, tolerance)
      ) {
        throw new Error("events must be globally monotone non-decreasing");
      }
      if (
        event.timeSec < interval.startTimeSec
        || timesEqual(event.timeSec, interval.startTimeSec, tolerance)
      ) {
        throw new Error(`${eventPrefix} is not inside the open interval start`);
      }
      if (
        event.timeSec > interval.endTimeSec
        && !timesEqual(event.timeSec, interval.endTimeSec, tolerance)
      ) {
        throw new Error(`${eventPrefix} is after the closed interval end`);
      }
      ownedEventIds.add(event.eventId);
      previousLocalEventTime = event.timeSec;
      previousEventTime = event.timeSec;
    });

    durationSum += interval.durationSec;
    expectedStart = interval.endTimeSec;
  });

  assertTimeEqual(
    "last accepted endpoint does not match window end",
    expectedStart,
    window.endTimeSec,
    tolerance,
  );
  assertTimeEqual(
    "sum of accepted interval durations does not match window duration",
    durationSum,
    window.durationSec,
    tolerance,
  );
}

/** Backward-Euler endpoint quadrature over accepted physical intervals. */
export function backwardEulerEndpointIntegralV1<TSample, TEvent>(
  window: RetainedAcceptedIntervalWindowV1<TSample, TEvent>,
  endpointSignal: (sample: TSample) => number,
  options: AcceptedIntervalValidationOptionsV1 = {},
): AcceptedIntervalBackwardEulerIntegralV1 {
  validateRetainedAcceptedIntervalWindowV1(window, options);
  let signed = 0;
  let positive = 0;
  let negative = 0;
  for (const [index, interval] of window.intervals.entries()) {
    const value = endpointSignal(interval.endpointSample.sample);
    assertFiniteSignal(`endpoint signal at interval[${index}]`, value);
    const increment = value * interval.durationSec;
    signed += increment;
    positive += Math.max(value, 0) * interval.durationSec;
    negative += Math.min(value, 0) * interval.durationSec;
  }
  return Object.freeze({
    signed,
    positive,
    negative,
    negativeMagnitude: -negative,
    durationSec: window.durationSec,
  });
}

/** Duration-weighted mean using the same accepted-endpoint convention. */
export function acceptedIntervalTimeWeightedMeanV1<TSample, TEvent>(
  window: RetainedAcceptedIntervalWindowV1<TSample, TEvent>,
  endpointSignal: (sample: TSample) => number,
  options: AcceptedIntervalValidationOptionsV1 = {},
): number {
  const integral = backwardEulerEndpointIntegralV1(
    window,
    endpointSignal,
    options,
  );
  return integral.signed / integral.durationSec;
}

/** Physical-time delay between two timestamped readbacks. */
export function acceptedTimestampDelaySecV1(
  earlier: Readonly<{ timeSec: number }>,
  later: Readonly<{ timeSec: number }>,
  options: AcceptedIntervalValidationOptionsV1 = {},
): number {
  assertFiniteTime("earlier.timeSec", earlier.timeSec);
  assertFiniteTime("later.timeSec", later.timeSec);
  const tolerance = validationTolerance(options);
  const delay = later.timeSec - earlier.timeSec;
  if (delay < 0 && !timesEqual(earlier.timeSec, later.timeSec, tolerance)) {
    throw new Error("later timestamp must not precede earlier timestamp");
  }
  return timesEqual(earlier.timeSec, later.timeSec, tolerance) ? 0 : delay;
}

/**
 * Weighted least squares y = intercept + slope * physicalTime.
 *
 * Each accepted endpoint receives the duration of the interval it closes as
 * its weight. A caller may pass a transformed signal (for example log of a
 * positive decaying excess) without this generic kernel owning that model.
 */
export function durationWeightedEndpointLinearRegressionV1<TSample, TEvent>(
  window: RetainedAcceptedIntervalWindowV1<TSample, TEvent>,
  endpointValue: (sample: TSample) => number,
  options: AcceptedIntervalValidationOptionsV1 = {},
): AcceptedIntervalDurationWeightedLinearRegressionV1 {
  validateRetainedAcceptedIntervalWindowV1(window, options);
  if (window.intervals.length < 2) {
    throw new Error("linear regression requires at least two intervals");
  }

  let weightedTime = 0;
  let weightedValue = 0;
  const values = window.intervals.map((interval, index) => {
    const value = endpointValue(interval.endpointSample.sample);
    assertFiniteSignal(`regression value at interval[${index}]`, value);
    const weight = interval.durationSec;
    weightedTime += weight * interval.endpointSample.timeSec;
    weightedValue += weight * value;
    return value;
  });
  const totalWeightSec = window.durationSec;
  const meanTime = weightedTime / totalWeightSec;
  const meanValue = weightedValue / totalWeightSec;

  let covariance = 0;
  let timeVariance = 0;
  let valueVariance = 0;
  window.intervals.forEach((interval, index) => {
    const centeredTime = interval.endpointSample.timeSec - meanTime;
    const centeredValue = values[index]! - meanValue;
    covariance += interval.durationSec * centeredTime * centeredValue;
    timeVariance += interval.durationSec * centeredTime * centeredTime;
    valueVariance += interval.durationSec * centeredValue * centeredValue;
  });
  if (!(timeVariance > 0) || !Number.isFinite(timeVariance)) {
    throw new Error("accepted endpoint times have zero weighted variance");
  }
  const slopePerSec = covariance / timeVariance;
  const intercept = meanValue - slopePerSec * meanTime;
  let residual = 0;
  window.intervals.forEach((interval, index) => {
    const fitted = intercept
      + slopePerSec * interval.endpointSample.timeSec;
    const error = values[index]! - fitted;
    residual += interval.durationSec * error * error;
  });
  const rSquared = valueVariance > 0
    ? clampUnitInterval(1 - residual / valueVariance)
    : null;

  return Object.freeze({
    sampleCount: window.intervals.length,
    totalWeightSec,
    weightedMeanTimeSec: meanTime,
    weightedMeanValue: meanValue,
    slopePerSec,
    intercept,
    weightedResidualSumSquares: residual,
    weightedTotalSumSquares: valueVariance,
    rSquared,
  });
}

function validationTolerance(
  options: AcceptedIntervalValidationOptionsV1,
): Readonly<{ absolute: number; relative: number }> {
  const absolute = options.absoluteTimeToleranceSec
    ?? DEFAULT_ABSOLUTE_TIME_TOLERANCE_SEC;
  const relative = options.relativeTimeTolerance
    ?? DEFAULT_RELATIVE_TIME_TOLERANCE;
  if (!Number.isFinite(absolute) || absolute < 0) {
    throw new Error("absoluteTimeToleranceSec must be finite and non-negative");
  }
  if (!Number.isFinite(relative) || relative < 0) {
    throw new Error("relativeTimeTolerance must be finite and non-negative");
  }
  return { absolute, relative };
}

function timesEqual(
  left: number,
  right: number,
  tolerance: Readonly<{ absolute: number; relative: number }>,
): boolean {
  return Math.abs(left - right) <= Math.max(
    tolerance.absolute,
    tolerance.relative * Math.max(1, Math.abs(left), Math.abs(right)),
  );
}

function assertTimeEqual(
  message: string,
  actual: number,
  expected: number,
  tolerance: Readonly<{ absolute: number; relative: number }>,
): void {
  if (!timesEqual(actual, expected, tolerance)) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

function assertFiniteTime(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

function assertFiniteDuration(label: string, value: number): void {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and greater than zero`);
  }
}

function assertFiniteSignal(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

function clampUnitInterval(value: number): number {
  if (value < 0 && value > -1e-12) return 0;
  if (value > 1 && value < 1 + 1e-12) return 1;
  return value;
}
