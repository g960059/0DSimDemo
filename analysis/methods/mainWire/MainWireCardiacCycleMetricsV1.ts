export const MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID =
  "main-wire-regular-sinus-flow-event-timing-windowed-pressure-rate-v1" as const;

/** Versioned compatibility requirement; the exact manifest remains owner. */
export const MAIN_WIRE_CARDIAC_CYCLE_PRESENTATION_INTERVAL_SEC_V1 =
  0.002 as const;

export function requireMainWireCardiacCyclePresentationIntervalSecV1(
  exactRuntime: unknown,
): typeof MAIN_WIRE_CARDIAC_CYCLE_PRESENTATION_INTERVAL_SEC_V1 {
  if (
    typeof exactRuntime !== "object"
    || exactRuntime === null
    || !("presentationDtSec" in exactRuntime)
    || exactRuntime.presentationDtSec
      !== MAIN_WIRE_CARDIAC_CYCLE_PRESENTATION_INTERVAL_SEC_V1
  ) {
    throw new Error(
      "Cardiac-cycle method requires the exact 2-ms presentation interval",
    );
  }
  return MAIN_WIRE_CARDIAC_CYCLE_PRESENTATION_INTERVAL_SEC_V1;
}

export const MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1 = Object.freeze({
  leftVentricularIsovolumicContractionTimeMs:
    "hemodynamics.duration.isovolumic-contraction.flow-event.LV",
  leftVentricularIsovolumicRelaxationTimeMs:
    "hemodynamics.duration.isovolumic-relaxation.flow-event.LV",
  leftVentricularMyocardialPerformanceIndex:
    "hemodynamics.index.myocardial-performance.flow-event.LV",
  leftVentricularMaximumPressureRate10Ms:
    "hemodynamics.pressure-rate.maximum-windowed-10ms.absolute.LV",
  leftVentricularMinimumPressureRate10Ms:
    "hemodynamics.pressure-rate.minimum-windowed-10ms.absolute.LV",
  rightVentricularMaximumPressureRate10Ms:
    "hemodynamics.pressure-rate.maximum-windowed-10ms.absolute.RV",
  rightVentricularMinimumPressureRate10Ms:
    "hemodynamics.pressure-rate.minimum-windowed-10ms.absolute.RV",
} as const);

export type MainWireCardiacCycleOutputIdV1 =
  (typeof MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1)[
    keyof typeof MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
  ];

export const MAIN_WIRE_CARDIAC_CYCLE_ANALYSIS_OUTPUT_IDS_V1 = Object.freeze(
  Object.values(MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1),
) as readonly MainWireCardiacCycleOutputIdV1[];

export const MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1 =
  Object.freeze([
    "rhythm.phase.regular-sinus",
    "hemodynamics.flow.valve.MV",
    "hemodynamics.flow.valve.AoV",
    "hemodynamics.pressure.absolute.LV",
    "hemodynamics.pressure.absolute.RV",
  ] as const);

type RequiredExactOutputIdV1 =
  (typeof MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1)[number];

const PHASE_OUTPUT_ID_V1 = "rhythm.phase.regular-sinus" as const;
const MITRAL_FLOW_OUTPUT_ID_V1 = "hemodynamics.flow.valve.MV" as const;
const AORTIC_FLOW_OUTPUT_ID_V1 = "hemodynamics.flow.valve.AoV" as const;
const LV_PRESSURE_OUTPUT_ID_V1 =
  "hemodynamics.pressure.absolute.LV" as const;
const RV_PRESSURE_OUTPUT_ID_V1 =
  "hemodynamics.pressure.absolute.RV" as const;
const PRESSURE_RATE_WINDOWS_SEC_V1 = Object.freeze([0.01]);
const MAXIMUM_OUTSIDE_SELECTED_FORWARD_VOLUME_FRACTION_V1 = 0.01;
const TIME_TOLERANCE_SEC_V1 = 1e-12;

export type MainWireCardiacCycleAcceptedSampleV1 = Readonly<{
  inputEpoch: number;
  acceptedRevision: number;
  acceptedTimeSec: number;
  values: Readonly<Record<string, number | null>>;
}>;

type AnalysisPointV1 = Readonly<{
  timeSec: number;
  values: Readonly<Record<RequiredExactOutputIdV1, number>>;
}>;

type PhaseBoundaryV1 = Readonly<{
  timeSec: number;
  leftIndex: number;
  rightIndex: number;
}>;

type ForwardEpisodeV1 = Readonly<{
  openingTimeSec: number;
  closureTimeSec: number;
  forwardVolumeMl: number;
  peakFlowMlPerSec: number;
}>;

export type MainWireCardiacCycleMetricsV1 =
  | Readonly<{
      methodId: typeof MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID;
      status: "unavailable";
      reason:
        | "insufficient-complete-regular-sinus-cycles"
        | "no-complete-aortic-forward-ejection"
        | "multiple-material-aortic-forward-ejections";
      values: Readonly<Record<MainWireCardiacCycleOutputIdV1, null>>;
    }>
  | Readonly<{
      methodId: typeof MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID;
      status: "available";
      source: Readonly<{
        inputEpoch: number;
        sourceAcceptedRevision: number;
        cycleStartTimeSec: number;
        cycleEndTimeSec: number;
        cycleDurationSec: number;
        acceptedSampleCount: number;
        analysisPointCount: number;
        cycleBoundary: "regular-sinus-phase-wrap-linear-interpolation";
        timebase: "every-exact-presentation-boundary-no-resampling";
      }>;
      aorticEjection: Readonly<{
        openingTimeSec: number;
        closureTimeSec: number;
        positiveFlowDurationSec: number;
        peakFlowMlPerSec: number;
        forwardVolumeMl: number;
        additionalForwardEpisodeCount: number;
        outsideSelectedForwardVolumeFraction: number;
      }>;
      flowEvents: Readonly<{
        mitralClosureBeforeAorticOpeningTimeSec: number | null;
        mitralOpeningAfterAorticClosureTimeSec: number | null;
        isovolumicContractionTimeSec: number | null;
        isovolumicRelaxationTimeSec: number | null;
      }>;
      values: Readonly<
        Record<MainWireCardiacCycleOutputIdV1, number | null>
      >;
      limitations: readonly [
        "model-flow-events-not-clinical-valve-clicks",
        "windowed-pressure-rate-is-not-MR-jet-dP-dt",
        "regular-sinus-phase-boundary-only",
        "internal-accepted-substeps-not-observed-between-presentation-boundaries",
        "not-clinical-validation",
      ];
    }>;

/**
 * Derives one completed regular-sinus cycle from every delivered exact
 * presentation-boundary sample. The method adds no model state: phase
 * boundaries and valve events are linearly interpolated between presentation
 * endpoints in this analysis layer. Internal accepted solver substeps are not
 * separately observed.
 */
export function buildMainWireCardiacCycleMetricsV1(
  samples: readonly MainWireCardiacCycleAcceptedSampleV1[],
): MainWireCardiacCycleMetricsV1 {
  const owned = validateAcceptedSamplesV1(samples);
  const boundaries = phaseBoundariesV1(owned);
  if (boundaries.length < 2) {
    return unavailableV1("insufficient-complete-regular-sinus-cycles");
  }
  const start = boundaries.at(-2)!;
  const end = boundaries.at(-1)!;
  const cycle = analysisPointsBetweenV1(owned, start, end);
  const episodes = forwardEpisodesV1(cycle, AORTIC_FLOW_OUTPUT_ID_V1);
  if (episodes.length === 0) {
    return unavailableV1("no-complete-aortic-forward-ejection");
  }
  const selected = [...episodes].sort(
    (left, right) => right.forwardVolumeMl - left.forwardVolumeMl,
  )[0]!;
  const totalForwardVolumeMl = episodes.reduce(
    (sum, episode) => sum + episode.forwardVolumeMl,
    0,
  );
  const outsideSelectedForwardVolumeFraction = totalForwardVolumeMl > 0
    ? (totalForwardVolumeMl - selected.forwardVolumeMl) / totalForwardVolumeMl
    : 0;
  if (
    outsideSelectedForwardVolumeFraction
      > MAXIMUM_OUTSIDE_SELECTED_FORWARD_VOLUME_FRACTION_V1
  ) {
    return unavailableV1("multiple-material-aortic-forward-ejections");
  }

  const positiveFlowDurationSec =
    selected.closureTimeSec - selected.openingTimeSec;
  const mitralClosureTimeSec = lastClosureBeforeV1(
    cycle,
    MITRAL_FLOW_OUTPUT_ID_V1,
    selected.openingTimeSec,
  );
  const mitralOpeningTimeSec = firstOpeningAfterV1(
    cycle,
    MITRAL_FLOW_OUTPUT_ID_V1,
    selected.closureTimeSec,
  );
  const ictSec = mitralClosureTimeSec === null
    ? null
    : nonnegativeIntervalV1(
        mitralClosureTimeSec,
        selected.openingTimeSec,
      );
  const ivrtSec = mitralOpeningTimeSec === null
    ? null
    : nonnegativeIntervalV1(
        selected.closureTimeSec,
        mitralOpeningTimeSec,
      );
  const tei = ictSec === null || ivrtSec === null
    ? null
    : (ictSec + ivrtSec) / positiveFlowDurationSec;

  const lvRates = pressureRateExtremaV1(cycle, LV_PRESSURE_OUTPUT_ID_V1);
  const rvRates = pressureRateExtremaV1(cycle, RV_PRESSURE_OUTPUT_ID_V1);
  const outputIds = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1;
  const values: Record<MainWireCardiacCycleOutputIdV1, number | null> = {
    [outputIds.leftVentricularIsovolumicContractionTimeMs]:
      ictSec === null ? null : ictSec * 1_000,
    [outputIds.leftVentricularIsovolumicRelaxationTimeMs]:
      ivrtSec === null ? null : ivrtSec * 1_000,
    [outputIds.leftVentricularMyocardialPerformanceIndex]: tei,
    [outputIds.leftVentricularMaximumPressureRate10Ms]: lvRates[0]!.maximum,
    [outputIds.leftVentricularMinimumPressureRate10Ms]: lvRates[0]!.minimum,
    [outputIds.rightVentricularMaximumPressureRate10Ms]: rvRates[0]!.maximum,
    [outputIds.rightVentricularMinimumPressureRate10Ms]: rvRates[0]!.minimum,
  };
  for (const [outputId, value] of Object.entries(values)) {
    if (value !== null && !Number.isFinite(value)) {
      throw new Error(`Cardiac-cycle output ${outputId} is not finite`);
    }
  }

  return Object.freeze({
    methodId: MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
    status: "available" as const,
    source: Object.freeze({
      inputEpoch: owned.at(-1)!.inputEpoch,
      sourceAcceptedRevision: owned[end.rightIndex]!.acceptedRevision,
      cycleStartTimeSec: start.timeSec,
      cycleEndTimeSec: end.timeSec,
      cycleDurationSec: end.timeSec - start.timeSec,
      acceptedSampleCount: end.rightIndex - start.leftIndex + 1,
      analysisPointCount: cycle.length,
      cycleBoundary:
        "regular-sinus-phase-wrap-linear-interpolation" as const,
      timebase: "every-exact-presentation-boundary-no-resampling" as const,
    }),
    aorticEjection: Object.freeze({
      openingTimeSec: selected.openingTimeSec,
      closureTimeSec: selected.closureTimeSec,
      positiveFlowDurationSec,
      peakFlowMlPerSec: selected.peakFlowMlPerSec,
      forwardVolumeMl: selected.forwardVolumeMl,
      additionalForwardEpisodeCount: episodes.length - 1,
      outsideSelectedForwardVolumeFraction,
    }),
    flowEvents: Object.freeze({
      mitralClosureBeforeAorticOpeningTimeSec: mitralClosureTimeSec,
      mitralOpeningAfterAorticClosureTimeSec: mitralOpeningTimeSec,
      isovolumicContractionTimeSec: ictSec,
      isovolumicRelaxationTimeSec: ivrtSec,
    }),
    values: Object.freeze(values),
    limitations: Object.freeze([
      "model-flow-events-not-clinical-valve-clicks",
      "windowed-pressure-rate-is-not-MR-jet-dP-dt",
      "regular-sinus-phase-boundary-only",
      "internal-accepted-substeps-not-observed-between-presentation-boundaries",
      "not-clinical-validation",
    ] as const),
  });
}

function unavailableV1(
  reason: Extract<MainWireCardiacCycleMetricsV1, { status: "unavailable" }>["reason"],
): MainWireCardiacCycleMetricsV1 {
  return Object.freeze({
    methodId: MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
    status: "unavailable" as const,
    reason,
    values: Object.freeze(Object.fromEntries(
      MAIN_WIRE_CARDIAC_CYCLE_ANALYSIS_OUTPUT_IDS_V1.map(
        (outputId) => [outputId, null],
      ),
    )) as Readonly<Record<MainWireCardiacCycleOutputIdV1, null>>,
  });
}

function validateAcceptedSamplesV1(
  samples: readonly MainWireCardiacCycleAcceptedSampleV1[],
): readonly MainWireCardiacCycleAcceptedSampleV1[] {
  if (!Array.isArray(samples)) {
    throw new Error("Cardiac-cycle samples must be an array");
  }
  let previousRevision = -1;
  let previousTimeSec = Number.NEGATIVE_INFINITY;
  let inputEpoch: number | null = null;
  samples.forEach((sample, index) => {
    if (
      !Number.isSafeInteger(sample.inputEpoch)
      || sample.inputEpoch < 0
      || !Number.isSafeInteger(sample.acceptedRevision)
      || sample.acceptedRevision < 0
      || !Number.isFinite(sample.acceptedTimeSec)
      || sample.acceptedTimeSec < 0
    ) {
      throw new Error(`Cardiac-cycle sample ${index} has an invalid clock`);
    }
    if (inputEpoch === null) inputEpoch = sample.inputEpoch;
    if (sample.inputEpoch !== inputEpoch) {
      throw new Error("Cardiac-cycle samples cross input epochs");
    }
    if (
      sample.acceptedRevision <= previousRevision
      || sample.acceptedTimeSec <= previousTimeSec
      || (Number.isFinite(previousTimeSec) && Math.abs(
        sample.acceptedTimeSec - previousTimeSec
          - MAIN_WIRE_CARDIAC_CYCLE_PRESENTATION_INTERVAL_SEC_V1,
      ) > 2e-12)
    ) {
      throw new Error("Cardiac-cycle samples require increasing revisions on the exact 2-ms grid");
    }
    for (const outputId of MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1) {
      const value = sample.values[outputId];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Cardiac-cycle sample ${index} lacks finite ${outputId}`);
      }
    }
    const phase = requiredValueV1(sample, PHASE_OUTPUT_ID_V1);
    if (phase < 0 || phase >= 1 + 1e-12) {
      throw new Error(`Cardiac-cycle sample ${index} phase is outside [0, 1)`);
    }
    previousRevision = sample.acceptedRevision;
    previousTimeSec = sample.acceptedTimeSec;
  });
  // The synchronous derivation publishes only scalar results, never input
  // references. Validation need not clone the entire retained window.
  return samples;
}

function phaseBoundariesV1(
  samples: readonly MainWireCardiacCycleAcceptedSampleV1[],
): readonly PhaseBoundaryV1[] {
  const boundaries: PhaseBoundaryV1[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const next = samples[index]!;
    const previousPhase = requiredValueV1(previous, PHASE_OUTPUT_ID_V1);
    const nextPhase = requiredValueV1(next, PHASE_OUTPUT_ID_V1);
    if (!(previousPhase - nextPhase > 0.5)) continue;
    const unwrappedNext = nextPhase + 1;
    const fraction = (1 - previousPhase) / (unwrappedNext - previousPhase);
    if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
      throw new Error("Cardiac-cycle phase wrap interpolation is invalid");
    }
    boundaries.push(Object.freeze({
      timeSec: previous.acceptedTimeSec
        + fraction * (next.acceptedTimeSec - previous.acceptedTimeSec),
      leftIndex: index - 1,
      rightIndex: index,
    }));
  }
  return Object.freeze(boundaries);
}

function analysisPointsBetweenV1(
  samples: readonly MainWireCardiacCycleAcceptedSampleV1[],
  start: PhaseBoundaryV1,
  end: PhaseBoundaryV1,
): readonly AnalysisPointV1[] {
  const times = [
    start.timeSec,
    ...samples.flatMap((sample) =>
      sample.acceptedTimeSec > start.timeSec + TIME_TOLERANCE_SEC_V1
      && sample.acceptedTimeSec < end.timeSec - TIME_TOLERANCE_SEC_V1
        ? [sample.acceptedTimeSec]
        : []),
    end.timeSec,
  ];
  return Object.freeze(times.map((timeSec) => Object.freeze({
    timeSec,
    values: Object.freeze(Object.fromEntries(
      MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1.map(
        (outputId) => [outputId, sampleValueAtTimeV1(
          samples,
          outputId,
          timeSec,
        )],
      ),
    )) as Readonly<Record<RequiredExactOutputIdV1, number>>,
  })));
}

function sampleValueAtTimeV1(
  samples: readonly MainWireCardiacCycleAcceptedSampleV1[],
  outputId: RequiredExactOutputIdV1,
  timeSec: number,
): number {
  let lower = 0;
  let upper = samples.length;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (samples[middle]!.acceptedTimeSec < timeSec) lower = middle + 1;
    else upper = middle;
  }
  const next = samples[lower];
  if (next === undefined) {
    return requiredValueV1(samples.at(-1)!, outputId);
  }
  if (Math.abs(next.acceptedTimeSec - timeSec) <= TIME_TOLERANCE_SEC_V1) {
    return requiredValueV1(next, outputId);
  }
  const previous = samples[lower - 1];
  if (previous === undefined) return requiredValueV1(next, outputId);
  const fraction = (timeSec - previous.acceptedTimeSec)
    / (next.acceptedTimeSec - previous.acceptedTimeSec);
  return linearV1(
    requiredValueV1(previous, outputId),
    requiredValueV1(next, outputId),
    fraction,
  );
}

function requiredValueV1(
  sample: MainWireCardiacCycleAcceptedSampleV1,
  outputId: RequiredExactOutputIdV1,
): number {
  return sample.values[outputId] as number;
}

function pointValueV1(
  point: AnalysisPointV1,
  outputId: RequiredExactOutputIdV1,
): number {
  return point.values[outputId];
}

function forwardEpisodesV1(
  points: readonly AnalysisPointV1[],
  flowOutputId: RequiredExactOutputIdV1,
): readonly ForwardEpisodeV1[] {
  const episodes: ForwardEpisodeV1[] = [];
  let openingTimeSec: number | null = null;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const next = points[index]!;
    const previousFlow = pointValueV1(previous, flowOutputId);
    const nextFlow = pointValueV1(next, flowOutputId);
    if (openingTimeSec === null && previousFlow <= 0 && nextFlow > 0) {
      openingTimeSec = openingCrossingTimeV1(
        previous.timeSec,
        next.timeSec,
        previousFlow,
        nextFlow,
      );
    }
    if (openingTimeSec !== null && previousFlow > 0 && nextFlow <= 0) {
      const closureTimeSec = closureCrossingTimeV1(
        previous.timeSec,
        next.timeSec,
        previousFlow,
        nextFlow,
      );
      const forwardVolumeMl = integratePositiveLinearV1(
        points,
        flowOutputId,
        openingTimeSec,
        closureTimeSec,
      );
      const peakFlowMlPerSec = maximumValueV1(
        points,
        flowOutputId,
        openingTimeSec,
        closureTimeSec,
      );
      if (
        closureTimeSec > openingTimeSec
        && forwardVolumeMl > 0
        && peakFlowMlPerSec > 0
      ) {
        episodes.push(Object.freeze({
          openingTimeSec,
          closureTimeSec,
          forwardVolumeMl,
          peakFlowMlPerSec,
        }));
      }
      openingTimeSec = null;
    }
  }
  return Object.freeze(episodes);
}

function lastClosureBeforeV1(
  points: readonly AnalysisPointV1[],
  flowOutputId: RequiredExactOutputIdV1,
  beforeTimeSec: number,
): number | null {
  let result: number | null = null;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const next = points[index]!;
    if (previous.timeSec > beforeTimeSec + TIME_TOLERANCE_SEC_V1) break;
    const q0 = pointValueV1(previous, flowOutputId);
    const q1 = pointValueV1(next, flowOutputId);
    if (q0 > 0 && q1 <= 0) {
      const crossing = closureCrossingTimeV1(
        previous.timeSec,
        next.timeSec,
        q0,
        q1,
      );
      if (crossing <= beforeTimeSec + TIME_TOLERANCE_SEC_V1) {
        result = crossing;
      }
    }
  }
  return result;
}

function firstOpeningAfterV1(
  points: readonly AnalysisPointV1[],
  flowOutputId: RequiredExactOutputIdV1,
  afterTimeSec: number,
): number | null {
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const next = points[index]!;
    if (next.timeSec < afterTimeSec - TIME_TOLERANCE_SEC_V1) continue;
    const q0 = pointValueV1(previous, flowOutputId);
    const q1 = pointValueV1(next, flowOutputId);
    if (q0 <= 0 && q1 > 0) {
      const crossing = openingCrossingTimeV1(
        previous.timeSec,
        next.timeSec,
        q0,
        q1,
      );
      if (crossing >= afterTimeSec - TIME_TOLERANCE_SEC_V1) return crossing;
    }
  }
  return null;
}

function pressureRateExtremaV1(
  points: readonly AnalysisPointV1[],
  pressureOutputId: RequiredExactOutputIdV1,
): readonly Readonly<{ windowSec: number; maximum: number; minimum: number }>[] {
  const startTimeSec = points[0]!.timeSec;
  const endTimeSec = points.at(-1)!.timeSec;
  return Object.freeze(PRESSURE_RATE_WINDOWS_SEC_V1.map((windowSec) => {
    const latestStartTimeSec = endTimeSec - windowSec;
    const candidates = uniqueSortedTimesV1([
      startTimeSec,
      latestStartTimeSec,
      ...points.flatMap(({ timeSec }) => [timeSec, timeSec - windowSec]),
    ].filter((timeSec) =>
      timeSec >= startTimeSec - TIME_TOLERANCE_SEC_V1
      && timeSec <= latestStartTimeSec + TIME_TOLERANCE_SEC_V1));
    let maximum = Number.NEGATIVE_INFINITY;
    let minimum = Number.POSITIVE_INFINITY;
    for (const timeSec of candidates) {
      const rate = (
        pointValueAtTimeV1(points, pressureOutputId, timeSec + windowSec)
        - pointValueAtTimeV1(points, pressureOutputId, timeSec)
      ) / windowSec;
      maximum = Math.max(maximum, rate);
      minimum = Math.min(minimum, rate);
    }
    if (!Number.isFinite(maximum) || !Number.isFinite(minimum)) {
      throw new Error("Cardiac-cycle pressure-rate window is unavailable");
    }
    return Object.freeze({ windowSec, maximum, minimum });
  }));
}

function integratePositiveLinearV1(
  points: readonly AnalysisPointV1[],
  outputId: RequiredExactOutputIdV1,
  startTimeSec: number,
  endTimeSec: number,
): number {
  const times = intervalTimesV1(points, startTimeSec, endTimeSec);
  let integral = 0;
  for (let index = 1; index < times.length; index += 1) {
    const t0 = times[index - 1]!;
    const t1 = times[index]!;
    const y0 = pointValueAtTimeV1(points, outputId, t0);
    const y1 = pointValueAtTimeV1(points, outputId, t1);
    if (y0 >= 0 && y1 >= 0) {
      integral += 0.5 * (y0 + y1) * (t1 - t0);
    } else if (y0 > 0 || y1 > 0) {
      const crossingTimeSec = levelCrossingTimeV1(t0, t1, y0, y1, 0);
      integral += y0 > 0
        ? 0.5 * y0 * (crossingTimeSec - t0)
        : 0.5 * y1 * (t1 - crossingTimeSec);
    }
  }
  return integral;
}

function maximumValueV1(
  points: readonly AnalysisPointV1[],
  outputId: RequiredExactOutputIdV1,
  startTimeSec: number,
  endTimeSec: number,
): number {
  return Math.max(...intervalTimesV1(points, startTimeSec, endTimeSec).map(
    (timeSec) => pointValueAtTimeV1(points, outputId, timeSec),
  ));
}

function intervalTimesV1(
  points: readonly AnalysisPointV1[],
  startTimeSec: number,
  endTimeSec: number,
): readonly number[] {
  if (!(endTimeSec > startTimeSec)) {
    throw new Error("Cardiac-cycle analysis interval is not positive");
  }
  return uniqueSortedTimesV1([
    startTimeSec,
    ...points.flatMap(({ timeSec }) =>
      timeSec > startTimeSec + TIME_TOLERANCE_SEC_V1
      && timeSec < endTimeSec - TIME_TOLERANCE_SEC_V1
        ? [timeSec]
        : []),
    endTimeSec,
  ]);
}

function pointValueAtTimeV1(
  points: readonly AnalysisPointV1[],
  outputId: RequiredExactOutputIdV1,
  timeSec: number,
): number {
  let lower = 0;
  let upper = points.length;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (points[middle]!.timeSec < timeSec) lower = middle + 1;
    else upper = middle;
  }
  const next = points[lower];
  if (next === undefined) return pointValueV1(points.at(-1)!, outputId);
  if (Math.abs(next.timeSec - timeSec) <= TIME_TOLERANCE_SEC_V1) {
    return pointValueV1(next, outputId);
  }
  const previous = points[lower - 1];
  if (previous === undefined) return pointValueV1(next, outputId);
  return linearV1(
    pointValueV1(previous, outputId),
    pointValueV1(next, outputId),
    (timeSec - previous.timeSec) / (next.timeSec - previous.timeSec),
  );
}

function openingCrossingTimeV1(
  t0: number,
  t1: number,
  q0: number,
  q1: number,
): number {
  return q0 === 0 ? t0 : levelCrossingTimeV1(t0, t1, q0, q1, 0);
}

function closureCrossingTimeV1(
  t0: number,
  t1: number,
  q0: number,
  q1: number,
): number {
  return q1 === 0 ? t1 : levelCrossingTimeV1(t0, t1, q0, q1, 0);
}

function levelCrossingTimeV1(
  t0: number,
  t1: number,
  y0: number,
  y1: number,
  level: number,
): number {
  if (y1 === y0) throw new Error("Cardiac-cycle level crossing is flat");
  const fraction = (level - y0) / (y1 - y0);
  if (fraction < -TIME_TOLERANCE_SEC_V1 || fraction > 1 + TIME_TOLERANCE_SEC_V1) {
    throw new Error("Cardiac-cycle level crossing lies outside its segment");
  }
  return t0 + Math.min(1, Math.max(0, fraction)) * (t1 - t0);
}

function nonnegativeIntervalV1(
  startTimeSec: number,
  endTimeSec: number,
): number | null {
  const durationSec = endTimeSec - startTimeSec;
  return durationSec >= -TIME_TOLERANCE_SEC_V1
    ? Math.max(0, durationSec)
    : null;
}

function uniqueSortedTimesV1(times: readonly number[]): readonly number[] {
  const sorted = [...times].sort((left, right) => left - right);
  const unique: number[] = [];
  for (const timeSec of sorted) {
    if (
      unique.length === 0
      || Math.abs(timeSec - unique.at(-1)!) > TIME_TOLERANCE_SEC_V1
    ) unique.push(timeSec);
  }
  return Object.freeze(unique);
}

function linearV1(left: number, right: number, fraction: number): number {
  return left + fraction * (right - left);
}
