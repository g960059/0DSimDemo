export const MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID =
  "main-wire-left-ventricular-flow-event-timing-v1" as const;

export const MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_PEAK_FRACTION_V1 =
  0.01 as const;

/**
 * A derived model-flow timing method. None of its events or intervals is
 * claimed to be a clinical Doppler, tissue-Doppler, M-mode, or invasive
 * measurement.
 */
export const MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_CLAIM_V1 =
  Object.freeze({
    source: "capture-to-capture-all-accepted-endpoints" as const,
    exactModelMutation: false as const,
    exactFrameOutputReserved: false as const,
    addsDynamicState: false as const,
    fixedTimeStepAssumed: false as const,
    smoothingApplied: false as const,
    valveEventSignal: "modeled-valve-flow" as const,
    valveOpenPredicate:
      "Q-strictly-greater-than-one-percent-of-same-beat-positive-Qpeak" as const,
    absoluteFlowFloorApplied: false as const,
    aorticEpisodeSelection:
      "linear-threshold-active-episode-containing-every-global-positive-AoV-flow-peak" as const,
    eventInterpolation:
      "linear-in-actual-time-between-bracketing-accepted-endpoints" as const,
    mitralClosureSelection:
      "last-downward-threshold-crossing-after-start-atrial-capture-and-before-AVO" as const,
    mitralOpeningSelection:
      "first-upward-threshold-crossing-after-AVC-and-before-end-atrial-capture" as const,
    absentOrAmbiguousEventHandling:
      "explicit-partial-not-measurable-without-substitute-timing" as const,
    teiLikeDefinition:
      "(model-flow-event-ICT-plus-model-flow-event-IVRT)-divided-by-model-flow-event-aortic-ejection-duration" as const,
    clinicalLeftVentricularEjectionTimeClaimed: false as const,
    clinicalIsovolumicIntervalClaimed: false as const,
    clinicalTeiIndexClaimed: false as const,
  });

export type MainWireLeftVentricularFlowEventTimingAcceptedEndpointV1 =
  Readonly<{
    timeSec: number;
    mitralValveFlowMlPerSec: number;
    aorticValveFlowMlPerSec: number;
  }>;

export type MainWireLeftVentricularFlowEventTimingCaptureBoundaryV1 = Readonly<{
  capturedActivationId: string;
  timeSec: number;
}>;

export type MainWireLeftVentricularFlowEventTimingInputV1 = Readonly<{
  startAtrialCapture: MainWireLeftVentricularFlowEventTimingCaptureBoundaryV1;
  endAtrialCapture: MainWireLeftVentricularFlowEventTimingCaptureBoundaryV1;
  /** Includes both exact capture-boundary endpoints in chronological order. */
  acceptedEndpoints: readonly MainWireLeftVentricularFlowEventTimingAcceptedEndpointV1[];
}>;

export type MainWireLeftVentricularFlowEventTimingUnavailabilityReasonV1 =
  | "no-positive-aortic-flow-peak"
  | "no-positive-mitral-flow-peak"
  | "aortic-global-peak-spans-multiple-threshold-episodes"
  | "aortic-opening-bracket-not-observed"
  | "aortic-closure-bracket-not-observed"
  | "aortic-opening-threshold-plateau-ambiguous"
  | "aortic-closure-threshold-plateau-ambiguous"
  | "mitral-closure-before-aortic-opening-not-observed"
  | "mitral-opening-after-aortic-closure-not-observed"
  | "mitral-closure-threshold-plateau-ambiguous"
  | "mitral-opening-threshold-plateau-ambiguous"
  | "mitral-closure-not-before-aortic-opening"
  | "aortic-opening-not-before-aortic-closure"
  | "aortic-closure-not-before-mitral-opening";

export type MainWireLeftVentricularFlowEventTimingAvailabilityV1<T> =
  | Readonly<{
      status: "available";
      value: T;
    }>
  | Readonly<{
      status: "not-measurable";
      value: null;
      reason: MainWireLeftVentricularFlowEventTimingUnavailabilityReasonV1;
    }>;

export type MainWireLeftVentricularModelFlowEventV1 = Readonly<{
  event: "model-flow-threshold-crossing";
  valveId: "MV" | "AoV";
  transition: "opening" | "closure";
  timeSec: number;
  thresholdMlPerSec: number;
  leftAcceptedEndpointIndex: number;
  rightAcceptedEndpointIndex: number;
  interpolationFractionFromLeftToRight01: number;
}>;

export type MainWireLeftVentricularValveFlowThresholdEvidenceV1 = Readonly<{
  valveId: "MV" | "AoV";
  peakFraction01: typeof MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_PEAK_FRACTION_V1;
  positivePeakFlowMlPerSec: number | null;
  thresholdMlPerSec: number | null;
  globalPositivePeakAcceptedEndpointIndices: readonly number[];
  thresholdActiveAcceptedEndpointCount: number;
  thresholdEpisodeCount: number;
  openingTransitionCount: number;
  closingTransitionCount: number;
  ambiguousOpeningTransitionCount: number;
  ambiguousClosingTransitionCount: number;
  thresholdPlateauIntervalCount: number;
}>;

export type MainWireLeftVentricularAorticFlowEventEvidenceV1 = Readonly<{
  threshold: MainWireLeftVentricularValveFlowThresholdEvidenceV1;
  primaryEpisode: Readonly<{
    firstActiveAcceptedEndpointIndex: number;
    lastActiveAcceptedEndpointIndex: number;
    activeAcceptedEndpointCount: number;
    containsEveryGlobalPositivePeak: true;
  }> | null;
  extraActiveAcceptedEndpointCountOutsidePrimaryEpisode: number | null;
}>;

export type MainWireLeftVentricularMitralFlowEventEvidenceV1 = Readonly<{
  threshold: MainWireLeftVentricularValveFlowThresholdEvidenceV1;
  closureCandidateCountAfterCaptureBeforeAorticOpening: number | null;
  openingCandidateCountAfterAorticClosureBeforeNextCapture: number | null;
}>;

export type MainWireLeftVentricularFlowEventTimingV1 = Readonly<{
  methodId: typeof MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID;
  source: Readonly<{
    sampling: "all-accepted-endpoints";
    startAtrialCaptureId: string;
    endAtrialCaptureId: string;
    startTimeSec: number;
    endTimeSec: number;
    acceptedEndpointCount: number;
  }>;
  events: Readonly<{
    mitralValveClosure: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>;
    aorticValveOpening: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>;
    aorticValveClosure: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>;
    mitralValveOpening: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>;
  }>;
  metrics: Readonly<{
    modelFlowEventAorticEjectionDurationSec: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>;
    modelFlowEventIsovolumicContractionDurationSec: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>;
    modelFlowEventIsovolumicRelaxationDurationSec: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>;
    modelFlowEventMitralClosureToOpeningDurationSec: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>;
    modelFlowEventTeiLike: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>;
    intervalIdentityResidualSec: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>;
  }>;
  evidence: Readonly<{
    aortic: MainWireLeftVentricularAorticFlowEventEvidenceV1;
    mitral: MainWireLeftVentricularMitralFlowEventEvidenceV1;
  }>;
  interpretation: Readonly<{
    allFourModelFlowEventsAvailable: boolean;
    strictMvcAvoAvcMvoOrderSatisfied: boolean;
    exactlyOneAorticThresholdEpisode: boolean;
    noAorticThresholdActiveEndpointsOutsidePrimaryEpisode: boolean;
    eligibleForModelFlowEventTimingInterpretation: boolean;
    clinicalMeasurementClaimed: false;
  }>;
  claim: typeof MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_CLAIM_V1;
}>;

type ValveAnalysisV1 = Readonly<{
  flows: readonly number[];
  positivePeakFlowMlPerSec: number | null;
  thresholdMlPerSec: number | null;
  globalPositivePeakAcceptedEndpointIndices: readonly number[];
  active: readonly boolean[];
  episodes: readonly LinearEpisodeV1[];
  openings: readonly ThresholdCrossingV1[];
  closures: readonly ThresholdCrossingV1[];
  thresholdEvidence: MainWireLeftVentricularValveFlowThresholdEvidenceV1;
}>;

type LinearEpisodeV1 = Readonly<{
  firstActiveAcceptedEndpointIndex: number;
  lastActiveAcceptedEndpointIndex: number;
  activeAcceptedEndpointCount: number;
}>;

type ThresholdCrossingV1 = Readonly<{
  event: MainWireLeftVentricularModelFlowEventV1;
  thresholdPlateauAmbiguous: boolean;
}>;

type AorticEventAnalysisV1 = Readonly<{
  opening: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>;
  closure: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>;
  evidence: MainWireLeftVentricularAorticFlowEventEvidenceV1;
}>;

type MitralEventAnalysisV1 = Readonly<{
  closure: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>;
  opening: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>;
  evidence: MainWireLeftVentricularMitralFlowEventEvidenceV1;
}>;

export function measureMainWireLeftVentricularFlowEventTimingV1(
  input: MainWireLeftVentricularFlowEventTimingInputV1,
): MainWireLeftVentricularFlowEventTimingV1 {
  validateInputV1(input);
  const endpoints = input.acceptedEndpoints;
  const aorticValve = analyzeValveV1(
    endpoints,
    "AoV",
    (endpoint) => endpoint.aorticValveFlowMlPerSec,
  );
  const mitralValve = analyzeValveV1(
    endpoints,
    "MV",
    (endpoint) => endpoint.mitralValveFlowMlPerSec,
  );
  const aortic = analyzeAorticEventsV1(aorticValve);
  const mitral = analyzeMitralEventsV1(
    mitralValve,
    aortic.opening,
    aortic.closure,
    input.startAtrialCapture.timeSec,
    input.endAtrialCapture.timeSec,
  );

  const ejection = durationBetweenEventsV1(
    aortic.opening,
    aortic.closure,
    "aortic-opening-not-before-aortic-closure",
  );
  const ict = durationBetweenEventsV1(
    mitral.closure,
    aortic.opening,
    "mitral-closure-not-before-aortic-opening",
  );
  const ivrt = durationBetweenEventsV1(
    aortic.closure,
    mitral.opening,
    "aortic-closure-not-before-mitral-opening",
  );
  const mitralClosureToOpening = durationBetweenEventsV1(
    mitral.closure,
    mitral.opening,
    "mitral-closure-not-before-aortic-opening",
  );
  const teiLike = deriveTeiLikeV1(ict, ivrt, ejection);
  const identityResidual = deriveIdentityResidualV1(
    ict,
    ejection,
    ivrt,
    mitralClosureToOpening,
  );
  const allFourModelFlowEventsAvailable = [
    mitral.closure,
    aortic.opening,
    aortic.closure,
    mitral.opening,
  ].every((measurement) => measurement.status === "available");
  const strictMvcAvoAvcMvoOrderSatisfied =
    ict.status === "available" &&
    ejection.status === "available" &&
    ivrt.status === "available";
  const exactlyOneAorticThresholdEpisode = aorticValve.episodes.length === 1;
  const noAorticThresholdActiveEndpointsOutsidePrimaryEpisode =
    aortic.evidence.extraActiveAcceptedEndpointCountOutsidePrimaryEpisode === 0;

  return Object.freeze({
    methodId: MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID,
    source: Object.freeze({
      sampling: "all-accepted-endpoints" as const,
      startAtrialCaptureId: input.startAtrialCapture.capturedActivationId,
      endAtrialCaptureId: input.endAtrialCapture.capturedActivationId,
      startTimeSec: input.startAtrialCapture.timeSec,
      endTimeSec: input.endAtrialCapture.timeSec,
      acceptedEndpointCount: endpoints.length,
    }),
    events: Object.freeze({
      mitralValveClosure: mitral.closure,
      aorticValveOpening: aortic.opening,
      aorticValveClosure: aortic.closure,
      mitralValveOpening: mitral.opening,
    }),
    metrics: Object.freeze({
      modelFlowEventAorticEjectionDurationSec: ejection,
      modelFlowEventIsovolumicContractionDurationSec: ict,
      modelFlowEventIsovolumicRelaxationDurationSec: ivrt,
      modelFlowEventMitralClosureToOpeningDurationSec: mitralClosureToOpening,
      modelFlowEventTeiLike: teiLike,
      intervalIdentityResidualSec: identityResidual,
    }),
    evidence: Object.freeze({
      aortic: aortic.evidence,
      mitral: mitral.evidence,
    }),
    interpretation: Object.freeze({
      allFourModelFlowEventsAvailable,
      strictMvcAvoAvcMvoOrderSatisfied,
      exactlyOneAorticThresholdEpisode,
      noAorticThresholdActiveEndpointsOutsidePrimaryEpisode,
      eligibleForModelFlowEventTimingInterpretation:
        allFourModelFlowEventsAvailable &&
        strictMvcAvoAvcMvoOrderSatisfied &&
        exactlyOneAorticThresholdEpisode &&
        noAorticThresholdActiveEndpointsOutsidePrimaryEpisode,
      clinicalMeasurementClaimed: false as const,
    }),
    claim: MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_CLAIM_V1,
  });
}

function analyzeValveV1(
  endpoints: readonly MainWireLeftVentricularFlowEventTimingAcceptedEndpointV1[],
  valveId: "MV" | "AoV",
  readFlow: (
    endpoint: MainWireLeftVentricularFlowEventTimingAcceptedEndpointV1,
  ) => number,
): ValveAnalysisV1 {
  const flows = Object.freeze(endpoints.map(readFlow));
  const maximumFlowMlPerSec = flows.reduce(
    (maximum, flow) => (flow > maximum ? flow : maximum),
    Number.NEGATIVE_INFINITY,
  );
  if (!(maximumFlowMlPerSec > 0)) {
    const thresholdEvidence = freezeThresholdEvidenceV1({
      valveId,
      positivePeakFlowMlPerSec: null,
      thresholdMlPerSec: null,
      globalPositivePeakAcceptedEndpointIndices: [],
      thresholdActiveAcceptedEndpointCount: 0,
      thresholdEpisodeCount: 0,
      openingTransitionCount: 0,
      closingTransitionCount: 0,
      ambiguousOpeningTransitionCount: 0,
      ambiguousClosingTransitionCount: 0,
      thresholdPlateauIntervalCount: 0,
    });
    return Object.freeze({
      flows,
      positivePeakFlowMlPerSec: null,
      thresholdMlPerSec: null,
      globalPositivePeakAcceptedEndpointIndices: Object.freeze([]),
      active: Object.freeze(flows.map(() => false)),
      episodes: Object.freeze([]),
      openings: Object.freeze([]),
      closures: Object.freeze([]),
      thresholdEvidence,
    });
  }

  const thresholdMlPerSec =
    MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_PEAK_FRACTION_V1 *
    maximumFlowMlPerSec;
  const globalPositivePeakAcceptedEndpointIndices = Object.freeze(
    flows.flatMap((flow, index) =>
      flow === maximumFlowMlPerSec ? [index] : [],
    ),
  );
  const active = Object.freeze(flows.map((flow) => flow > thresholdMlPerSec));
  const episodes = findLinearEpisodesV1(active);
  const openings: ThresholdCrossingV1[] = [];
  const closures: ThresholdCrossingV1[] = [];
  for (let rightIndex = 1; rightIndex < endpoints.length; rightIndex += 1) {
    const leftIndex = rightIndex - 1;
    if (!active[leftIndex] && active[rightIndex]) {
      openings.push(
        buildThresholdCrossingV1(
          endpoints,
          flows,
          thresholdMlPerSec,
          valveId,
          "opening",
          leftIndex,
          rightIndex,
        ),
      );
    } else if (active[leftIndex] && !active[rightIndex]) {
      closures.push(
        buildThresholdCrossingV1(
          endpoints,
          flows,
          thresholdMlPerSec,
          valveId,
          "closure",
          leftIndex,
          rightIndex,
        ),
      );
    }
  }
  const thresholdPlateauIntervalCount = flows.reduce(
    (count, flow, index) =>
      index > 0 &&
      flow === thresholdMlPerSec &&
      flows[index - 1] === thresholdMlPerSec
        ? count + 1
        : count,
    0,
  );
  const thresholdEvidence = freezeThresholdEvidenceV1({
    valveId,
    positivePeakFlowMlPerSec: maximumFlowMlPerSec,
    thresholdMlPerSec,
    globalPositivePeakAcceptedEndpointIndices,
    thresholdActiveAcceptedEndpointCount: active.filter(Boolean).length,
    thresholdEpisodeCount: episodes.length,
    openingTransitionCount: openings.length,
    closingTransitionCount: closures.length,
    ambiguousOpeningTransitionCount: openings.filter(
      (crossing) => crossing.thresholdPlateauAmbiguous,
    ).length,
    ambiguousClosingTransitionCount: closures.filter(
      (crossing) => crossing.thresholdPlateauAmbiguous,
    ).length,
    thresholdPlateauIntervalCount,
  });
  return Object.freeze({
    flows,
    positivePeakFlowMlPerSec: maximumFlowMlPerSec,
    thresholdMlPerSec,
    globalPositivePeakAcceptedEndpointIndices,
    active,
    episodes,
    openings: Object.freeze(openings),
    closures: Object.freeze(closures),
    thresholdEvidence,
  });
}

function analyzeAorticEventsV1(valve: ValveAnalysisV1): AorticEventAnalysisV1 {
  if (
    valve.positivePeakFlowMlPerSec === null ||
    valve.thresholdMlPerSec === null
  ) {
    const reason = "no-positive-aortic-flow-peak" as const;
    return Object.freeze({
      opening: unavailableV1(reason),
      closure: unavailableV1(reason),
      evidence: aorticEvidenceV1(valve, null),
    });
  }

  const peakEpisodeIndices = new Set<number>();
  for (const peakIndex of valve.globalPositivePeakAcceptedEndpointIndices) {
    const episodeIndex = valve.episodes.findIndex(
      (episode) =>
        peakIndex >= episode.firstActiveAcceptedEndpointIndex &&
        peakIndex <= episode.lastActiveAcceptedEndpointIndex,
    );
    if (episodeIndex < 0) {
      throw new Error("positive AoV global peak is not threshold-active");
    }
    peakEpisodeIndices.add(episodeIndex);
  }
  if (peakEpisodeIndices.size !== 1) {
    const reason =
      "aortic-global-peak-spans-multiple-threshold-episodes" as const;
    return Object.freeze({
      opening: unavailableV1(reason),
      closure: unavailableV1(reason),
      evidence: aorticEvidenceV1(valve, null),
    });
  }
  const primaryEpisode = valve.episodes[[...peakEpisodeIndices][0]!]!;
  const opening = eventAtEpisodeBoundaryV1(valve, primaryEpisode, "opening");
  const closure = eventAtEpisodeBoundaryV1(valve, primaryEpisode, "closure");
  return Object.freeze({
    opening,
    closure,
    evidence: aorticEvidenceV1(valve, primaryEpisode),
  });
}

function eventAtEpisodeBoundaryV1(
  valve: ValveAnalysisV1,
  episode: LinearEpisodeV1,
  transition: "opening" | "closure",
): MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1> {
  const crossing =
    transition === "opening"
      ? valve.openings.find(
          (candidate) =>
            candidate.event.rightAcceptedEndpointIndex ===
            episode.firstActiveAcceptedEndpointIndex,
        )
      : valve.closures.find(
          (candidate) =>
            candidate.event.leftAcceptedEndpointIndex ===
            episode.lastActiveAcceptedEndpointIndex,
        );
  if (crossing === undefined) {
    return unavailableV1(
      transition === "opening"
        ? "aortic-opening-bracket-not-observed"
        : "aortic-closure-bracket-not-observed",
    );
  }
  if (crossing.thresholdPlateauAmbiguous) {
    return unavailableV1(
      transition === "opening"
        ? "aortic-opening-threshold-plateau-ambiguous"
        : "aortic-closure-threshold-plateau-ambiguous",
    );
  }
  return availableV1(crossing.event);
}

function analyzeMitralEventsV1(
  valve: ValveAnalysisV1,
  aorticOpening: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>,
  aorticClosure: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>,
  startTimeSec: number,
  endTimeSec: number,
): MitralEventAnalysisV1 {
  if (
    valve.positivePeakFlowMlPerSec === null ||
    valve.thresholdMlPerSec === null
  ) {
    const reason = "no-positive-mitral-flow-peak" as const;
    return Object.freeze({
      closure: unavailableV1(reason),
      opening: unavailableV1(reason),
      evidence: Object.freeze({
        threshold: valve.thresholdEvidence,
        closureCandidateCountAfterCaptureBeforeAorticOpening: null,
        openingCandidateCountAfterAorticClosureBeforeNextCapture: null,
      }),
    });
  }

  const closureCandidates =
    aorticOpening.status === "available"
      ? valve.closures.filter(
          (candidate) =>
            candidate.event.timeSec > startTimeSec &&
            candidate.event.timeSec < aorticOpening.value.timeSec,
        )
      : null;
  const openingCandidates =
    aorticClosure.status === "available"
      ? valve.openings.filter(
          (candidate) =>
            candidate.event.timeSec > aorticClosure.value.timeSec &&
            candidate.event.timeSec < endTimeSec,
        )
      : null;
  const selectedClosure = closureCandidates?.at(-1) ?? null;
  const selectedOpening = openingCandidates?.[0] ?? null;
  const closure =
    aorticOpening.status === "not-measurable"
      ? unavailableV1(aorticOpening.reason)
      : selectedClosure === null
        ? unavailableV1("mitral-closure-before-aortic-opening-not-observed")
        : selectedClosure.thresholdPlateauAmbiguous
          ? unavailableV1("mitral-closure-threshold-plateau-ambiguous")
          : availableV1(selectedClosure.event);
  const opening =
    aorticClosure.status === "not-measurable"
      ? unavailableV1(aorticClosure.reason)
      : selectedOpening === null
        ? unavailableV1("mitral-opening-after-aortic-closure-not-observed")
        : selectedOpening.thresholdPlateauAmbiguous
          ? unavailableV1("mitral-opening-threshold-plateau-ambiguous")
          : availableV1(selectedOpening.event);
  return Object.freeze({
    closure,
    opening,
    evidence: Object.freeze({
      threshold: valve.thresholdEvidence,
      closureCandidateCountAfterCaptureBeforeAorticOpening:
        closureCandidates?.length ?? null,
      openingCandidateCountAfterAorticClosureBeforeNextCapture:
        openingCandidates?.length ?? null,
    }),
  });
}

function durationBetweenEventsV1(
  start: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>,
  end: MainWireLeftVentricularFlowEventTimingAvailabilityV1<MainWireLeftVentricularModelFlowEventV1>,
  nonorderedReason: MainWireLeftVentricularFlowEventTimingUnavailabilityReasonV1,
): MainWireLeftVentricularFlowEventTimingAvailabilityV1<number> {
  if (start.status === "not-measurable") {
    return unavailableV1(start.reason);
  }
  if (end.status === "not-measurable") {
    return unavailableV1(end.reason);
  }
  if (!(start.value.timeSec < end.value.timeSec)) {
    return unavailableV1(nonorderedReason);
  }
  return availableV1(end.value.timeSec - start.value.timeSec);
}

function deriveTeiLikeV1(
  ict: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>,
  ivrt: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>,
  ejection: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>,
): MainWireLeftVentricularFlowEventTimingAvailabilityV1<number> {
  for (const measurement of [ict, ivrt, ejection]) {
    if (measurement.status === "not-measurable") {
      return unavailableV1(measurement.reason);
    }
  }
  if (
    ict.status !== "available" ||
    ivrt.status !== "available" ||
    ejection.status !== "available"
  ) {
    throw new Error("unreachable flow-event Tei-like availability state");
  }
  return availableV1((ict.value + ivrt.value) / ejection.value);
}

function deriveIdentityResidualV1(
  ict: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>,
  ejection: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>,
  ivrt: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>,
  mitralClosureToOpening: MainWireLeftVentricularFlowEventTimingAvailabilityV1<number>,
): MainWireLeftVentricularFlowEventTimingAvailabilityV1<number> {
  for (const measurement of [ict, ejection, ivrt, mitralClosureToOpening]) {
    if (measurement.status === "not-measurable") {
      return unavailableV1(measurement.reason);
    }
  }
  if (
    ict.status !== "available" ||
    ejection.status !== "available" ||
    ivrt.status !== "available" ||
    mitralClosureToOpening.status !== "available"
  ) {
    throw new Error("unreachable flow-event interval identity state");
  }
  return availableV1(
    mitralClosureToOpening.value - ict.value - ejection.value - ivrt.value,
  );
}

function aorticEvidenceV1(
  valve: ValveAnalysisV1,
  primaryEpisode: LinearEpisodeV1 | null,
): MainWireLeftVentricularAorticFlowEventEvidenceV1 {
  return Object.freeze({
    threshold: valve.thresholdEvidence,
    primaryEpisode:
      primaryEpisode === null
        ? null
        : Object.freeze({
            firstActiveAcceptedEndpointIndex:
              primaryEpisode.firstActiveAcceptedEndpointIndex,
            lastActiveAcceptedEndpointIndex:
              primaryEpisode.lastActiveAcceptedEndpointIndex,
            activeAcceptedEndpointCount:
              primaryEpisode.activeAcceptedEndpointCount,
            containsEveryGlobalPositivePeak: true as const,
          }),
    extraActiveAcceptedEndpointCountOutsidePrimaryEpisode:
      primaryEpisode === null
        ? null
        : valve.active.filter(Boolean).length -
          primaryEpisode.activeAcceptedEndpointCount,
  });
}

function buildThresholdCrossingV1(
  endpoints: readonly MainWireLeftVentricularFlowEventTimingAcceptedEndpointV1[],
  flows: readonly number[],
  thresholdMlPerSec: number,
  valveId: "MV" | "AoV",
  transition: "opening" | "closure",
  leftIndex: number,
  rightIndex: number,
): ThresholdCrossingV1 {
  const leftFlow = flows[leftIndex]!;
  const rightFlow = flows[rightIndex]!;
  const denominator = rightFlow - leftFlow;
  if (denominator === 0) {
    throw new Error("flow threshold crossing requires distinct endpoint flows");
  }
  const interpolationFraction = (thresholdMlPerSec - leftFlow) / denominator;
  if (
    !Number.isFinite(interpolationFraction) ||
    interpolationFraction < 0 ||
    interpolationFraction > 1
  ) {
    throw new Error("flow threshold crossing interpolation is invalid");
  }
  const leftTimeSec = endpoints[leftIndex]!.timeSec;
  const rightTimeSec = endpoints[rightIndex]!.timeSec;
  const thresholdPlateauAmbiguous =
    transition === "opening"
      ? leftFlow === thresholdMlPerSec &&
        leftIndex > 0 &&
        flows[leftIndex - 1] === thresholdMlPerSec
      : rightFlow === thresholdMlPerSec &&
        rightIndex + 1 < flows.length &&
        flows[rightIndex + 1] === thresholdMlPerSec;
  return Object.freeze({
    event: Object.freeze({
      event: "model-flow-threshold-crossing" as const,
      valveId,
      transition,
      timeSec:
        leftTimeSec + interpolationFraction * (rightTimeSec - leftTimeSec),
      thresholdMlPerSec,
      leftAcceptedEndpointIndex: leftIndex,
      rightAcceptedEndpointIndex: rightIndex,
      interpolationFractionFromLeftToRight01: interpolationFraction,
    }),
    thresholdPlateauAmbiguous,
  });
}

function findLinearEpisodesV1(
  active: readonly boolean[],
): readonly LinearEpisodeV1[] {
  const episodes: LinearEpisodeV1[] = [];
  let index = 0;
  while (index < active.length) {
    if (!active[index]) {
      index += 1;
      continue;
    }
    const firstActiveAcceptedEndpointIndex = index;
    while (index + 1 < active.length && active[index + 1]) index += 1;
    const lastActiveAcceptedEndpointIndex = index;
    episodes.push(
      Object.freeze({
        firstActiveAcceptedEndpointIndex,
        lastActiveAcceptedEndpointIndex,
        activeAcceptedEndpointCount:
          lastActiveAcceptedEndpointIndex -
          firstActiveAcceptedEndpointIndex +
          1,
      }),
    );
    index += 1;
  }
  return Object.freeze(episodes);
}

function freezeThresholdEvidenceV1(
  input: Omit<
    MainWireLeftVentricularValveFlowThresholdEvidenceV1,
    "peakFraction01"
  >,
): MainWireLeftVentricularValveFlowThresholdEvidenceV1 {
  return Object.freeze({
    ...input,
    peakFraction01:
      MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_PEAK_FRACTION_V1,
    globalPositivePeakAcceptedEndpointIndices: Object.freeze([
      ...input.globalPositivePeakAcceptedEndpointIndices,
    ]),
  });
}

function availableV1<T>(
  value: T,
): MainWireLeftVentricularFlowEventTimingAvailabilityV1<T> {
  return Object.freeze({ status: "available" as const, value });
}

function unavailableV1<T = never>(
  reason: MainWireLeftVentricularFlowEventTimingUnavailabilityReasonV1,
): MainWireLeftVentricularFlowEventTimingAvailabilityV1<T> {
  return Object.freeze({
    status: "not-measurable" as const,
    value: null,
    reason,
  });
}

function validateInputV1(
  input: MainWireLeftVentricularFlowEventTimingInputV1,
): void {
  const start = input.startAtrialCapture;
  const end = input.endAtrialCapture;
  if (
    start.capturedActivationId.length === 0 ||
    end.capturedActivationId.length === 0 ||
    start.capturedActivationId === end.capturedActivationId
  ) {
    throw new Error("distinct nonempty atrial capture IDs are required");
  }
  if (
    !Number.isFinite(start.timeSec) ||
    !Number.isFinite(end.timeSec) ||
    !(end.timeSec > start.timeSec)
  ) {
    throw new Error("atrial capture times must define a finite positive beat");
  }
  if (input.acceptedEndpoints.length < 2) {
    throw new Error("at least two accepted endpoints are required");
  }
  if (
    input.acceptedEndpoints[0]!.timeSec !== start.timeSec ||
    input.acceptedEndpoints.at(-1)!.timeSec !== end.timeSec
  ) {
    throw new Error(
      "accepted endpoints must include both exact atrial capture boundaries",
    );
  }
  for (let index = 0; index < input.acceptedEndpoints.length; index += 1) {
    const endpoint = input.acceptedEndpoints[index]!;
    for (const [name, value] of Object.entries(endpoint)) {
      if (!Number.isFinite(value)) {
        throw new Error(`accepted endpoint ${index} ${name} must be finite`);
      }
    }
    if (
      index > 0 &&
      !(endpoint.timeSec > input.acceptedEndpoints[index - 1]!.timeSec)
    ) {
      throw new Error("accepted endpoint times must increase strictly");
    }
  }
}
