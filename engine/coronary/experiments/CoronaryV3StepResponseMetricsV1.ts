export const CORONARY_V3_STEP_RESPONSE_METRICS_V1_ID =
  "coronary-v3-fit-free-step-response-metrics-v1" as const;

const TIME_TOLERANCE_SEC = 1e-9;

export const CORONARY_V3_STEP_RESPONSE_METRICS_CLAIM_V1 = Object.freeze({
  constructionSources: Object.freeze([
    "Dankelman-et-al-J-Physiol-1989-408-295-312-doi-10.1113-jphysiol.1989.sp017460",
    "Dankelman-et-al-J-Physiol-1989-419-703-715-doi-10.1113-jphysiol.1989.sp017894",
  ] as const),
  observable:
    "beat-mean-upstream-minus-explicit-downstream-reference-pressure-divided-by-explicitly-stationed-observed-flow" as const,
  originalPaperManualTenSecondRegressionReproduced: false as const,
  estimator:
    "fit-free-first-threshold-crossing-with-three-beat-persistence" as const,
  baselineFinalHalfResponseTarget:
    "halfway-between-duration-weighted-baseline-and-final-window-means" as const,
  passiveExtremumWindowSec: 5 as const,
  venousPressureMayBeSilentlySubstitutedForWedgePressure: false as const,
  semUsedAsModelAcceptanceTolerance: false as const,
  parameterFittingApplied: false as const,
  physiologicalAcceptanceEstablished: false as const,
  independentValidationEstablished: false as const,
  clinicalValidationEstablished: false as const,
} as const);

export type CoronaryStepMeasurementStationV1 =
  | Readonly<{
    kind: "cannulated-left-main-zero-flow-wedge";
    upstreamPressureStation: "left-main-cannula-tip";
    flowStation: "left-main-perfusion-line";
    downstreamReferenceStation: "distal-zero-flow-wedge";
    zeroFlowOcclusionDurationSec: 10;
  }>
  | Readonly<{
    kind: "venous-boundary-pressure-flow-surrogate";
    upstreamPressureStation: string;
    flowStation: string;
    downstreamReferenceStation: string;
    reasonExactWedgeUnavailable: string;
  }>;

export type CoronaryStepResponseBeatV1 = Readonly<{
  beatIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  meanUpstreamPressureMmHg: number;
  meanDownstreamReferencePressureMmHg: number;
  meanObservedFlowMlPerSec: number;
  meanCoronaryBloodVolumeMl: number;
}>;

export type CoronaryStepResponseWindowV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
}>;

export type CoronaryStepResponseMetricsInputV1 = Readonly<{
  interventionTimeSec: number;
  baselineWindow: CoronaryStepResponseWindowV1;
  finalWindow: CoronaryStepResponseWindowV1;
  persistenceBeatCount: 3;
  measurementStation: CoronaryStepMeasurementStationV1;
  beats: readonly CoronaryStepResponseBeatV1[];
}>;

export type CoronaryStepResponseBeatObservableV1 =
  CoronaryStepResponseBeatV1 & Readonly<{
    pressureGradientMmHg: number;
    pressureFlowMmHgSecPerMl: number;
  }>;

export type CoronaryStepResponseWindowSummaryV1 = Readonly<{
  startTimeSec: number;
  endTimeSec: number;
  contributingBeatCount: number;
  contributingDurationSec: number;
  meanUpstreamPressureMmHg: number;
  meanDownstreamReferencePressureMmHg: number;
  meanPressureGradientMmHg: number;
  meanObservedFlowMlPerSec: number;
  meanPressureFlowMmHgSecPerMl: number;
  meanCoronaryBloodVolumeMl: number;
}>;

export type CoronaryStepResponseCrossingBracketV1 = Readonly<{
  lowerTimeSec: number;
  upperTimeSec: number;
  thresholdPressureFlowMmHgSecPerMl: number;
  direction: "increase" | "decrease";
  firstCrossingBeatIndex: number;
  persistenceBeatCount: 3;
  interpolated: false;
}>;

export type CoronaryStepResponsePassiveExtremumV1 = Readonly<{
  searchStartTimeSec: number;
  searchEndTimeSec: number;
  beatIndex: number;
  beatStartTimeSec: number;
  beatEndTimeSec: number;
  pressureFlowMmHgSecPerMl: number;
  signedOppositeAmplitudeFromBaselineMmHgSecPerMl: number;
  absoluteOppositeAmplitudeFromBaselineMmHgSecPerMl: number;
  oppositeDirectionObserved: boolean;
}>;

export type CoronaryStepResponseWindowDriftV1 = Readonly<{
  firstHalf: CoronaryStepResponseWindowSummaryV1;
  secondHalf: CoronaryStepResponseWindowSummaryV1;
  secondMinusFirstPressureFlowMmHgSecPerMl: number;
  secondMinusFirstObservedFlowMlPerSec: number;
  secondMinusFirstCoronaryBloodVolumeMl: number;
}>;

export type CoronaryStepResponseMetricsResultV1 = Readonly<{
  metricsId: typeof CORONARY_V3_STEP_RESPONSE_METRICS_V1_ID;
  claim: typeof CORONARY_V3_STEP_RESPONSE_METRICS_CLAIM_V1;
  measurementStation: CoronaryStepMeasurementStationV1;
  exactDankelmanMeasurementStationEstablished: boolean;
  eligibleForDirectOriginalPaperT50ReproductionClaim: false;
  baseline: CoronaryStepResponseWindowSummaryV1;
  final: CoronaryStepResponseWindowSummaryV1;
  responseDirection: "increase" | "decrease";
  halfwayTargetPressureFlowMmHgSecPerMl: number;
  fitFreeBaselineFinalHalfResponseBracket:
    CoronaryStepResponseCrossingBracketV1 | null;
  passiveExtremum: CoronaryStepResponsePassiveExtremumV1;
  fitFreeSlowPhaseT50Bracket:
    CoronaryStepResponseCrossingBracketV1 | null;
  finalWindowDrift: CoronaryStepResponseWindowDriftV1;
  beatObservables: readonly CoronaryStepResponseBeatObservableV1[];
  physiologicalAcceptanceEstablished: false;
  independentValidationEstablished: false;
}>;

/**
 * Describes a preregistered coronary step response without fitting a curve.
 * The returned crossing bracket is deliberately not the 10 s manually chosen
 * linear-regression estimator used in the two 1989 source papers.
 */
export function describeCoronaryV3StepResponseMetricsV1(
  input: CoronaryStepResponseMetricsInputV1,
): CoronaryStepResponseMetricsResultV1 {
  validateInput(input);
  const beats = Object.freeze(input.beats.map(deriveBeatObservable));
  const baseline = summarizeWindow(beats, input.baselineWindow);
  const final = summarizeWindow(beats, input.finalWindow);
  const responseDelta = final.meanPressureFlowMmHgSecPerMl
    - baseline.meanPressureFlowMmHgSecPerMl;
  if (responseDelta === 0) {
    throw new Error("baseline and final pressure/flow means must differ");
  }
  const direction = responseDelta > 0 ? "increase" as const
    : "decrease" as const;
  const halfwayTarget = (
    baseline.meanPressureFlowMmHgSecPerMl
    + final.meanPressureFlowMmHgSecPerMl
  ) / 2;
  const baselineFinalHalfResponseBracket = findPersistentCrossingBracket(
    beats,
    input.interventionTimeSec,
    halfwayTarget,
    direction,
    input.persistenceBeatCount,
  );
  const passiveExtremum = findPassiveExtremum(
    beats,
    input.interventionTimeSec,
    baseline.meanPressureFlowMmHgSecPerMl,
    direction,
  );
  const slowDelta = final.meanPressureFlowMmHgSecPerMl
    - passiveExtremum.pressureFlowMmHgSecPerMl;
  const slowDirection = slowDelta >= 0 ? "increase" as const
    : "decrease" as const;
  const slowTarget = (
    passiveExtremum.pressureFlowMmHgSecPerMl
    + final.meanPressureFlowMmHgSecPerMl
  ) / 2;
  const slowBracket = slowDelta === 0
    ? null
    : findPersistentCrossingBracket(
      beats,
      passiveExtremum.beatEndTimeSec,
      slowTarget,
      slowDirection,
      input.persistenceBeatCount,
    );
  const finalWindowDrift = summarizeWindowDrift(
    beats,
    input.finalWindow,
  );
  return Object.freeze({
    metricsId: CORONARY_V3_STEP_RESPONSE_METRICS_V1_ID,
    claim: CORONARY_V3_STEP_RESPONSE_METRICS_CLAIM_V1,
    measurementStation: input.measurementStation,
    exactDankelmanMeasurementStationEstablished:
      input.measurementStation.kind
        === "cannulated-left-main-zero-flow-wedge",
    eligibleForDirectOriginalPaperT50ReproductionClaim: false as const,
    baseline,
    final,
    responseDirection: direction,
    halfwayTargetPressureFlowMmHgSecPerMl: halfwayTarget,
    fitFreeBaselineFinalHalfResponseBracket:
      baselineFinalHalfResponseBracket,
    passiveExtremum,
    fitFreeSlowPhaseT50Bracket: slowBracket,
    finalWindowDrift,
    beatObservables: beats,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
  });
}

function deriveBeatObservable(
  beat: CoronaryStepResponseBeatV1,
): CoronaryStepResponseBeatObservableV1 {
  const pressureGradient = beat.meanUpstreamPressureMmHg
    - beat.meanDownstreamReferencePressureMmHg;
  return Object.freeze({
    ...beat,
    pressureGradientMmHg: pressureGradient,
    pressureFlowMmHgSecPerMl:
      pressureGradient / beat.meanObservedFlowMlPerSec,
  });
}

function summarizeWindow(
  beats: readonly CoronaryStepResponseBeatObservableV1[],
  window: CoronaryStepResponseWindowV1,
): CoronaryStepResponseWindowSummaryV1 {
  let contributingBeatCount = 0;
  let contributingDurationSec = 0;
  let upstream = 0;
  let downstream = 0;
  let gradient = 0;
  let flow = 0;
  let pressureFlow = 0;
  let bloodVolume = 0;
  for (const beat of beats) {
    const overlap = Math.max(0, Math.min(beat.endTimeSec, window.endTimeSec)
      - Math.max(beat.startTimeSec, window.startTimeSec));
    if (overlap <= TIME_TOLERANCE_SEC) continue;
    contributingBeatCount += 1;
    contributingDurationSec += overlap;
    upstream += overlap * beat.meanUpstreamPressureMmHg;
    downstream += overlap * beat.meanDownstreamReferencePressureMmHg;
    gradient += overlap * beat.pressureGradientMmHg;
    flow += overlap * beat.meanObservedFlowMlPerSec;
    pressureFlow += overlap * beat.pressureFlowMmHgSecPerMl;
    bloodVolume += overlap * beat.meanCoronaryBloodVolumeMl;
  }
  const expectedDuration = window.endTimeSec - window.startTimeSec;
  if (Math.abs(contributingDurationSec - expectedDuration)
    > TIME_TOLERANCE_SEC) {
    throw new Error("beat observations do not cover a requested metric window");
  }
  return Object.freeze({
    startTimeSec: window.startTimeSec,
    endTimeSec: window.endTimeSec,
    contributingBeatCount,
    contributingDurationSec,
    meanUpstreamPressureMmHg: upstream / contributingDurationSec,
    meanDownstreamReferencePressureMmHg:
      downstream / contributingDurationSec,
    meanPressureGradientMmHg: gradient / contributingDurationSec,
    meanObservedFlowMlPerSec: flow / contributingDurationSec,
    meanPressureFlowMmHgSecPerMl: pressureFlow / contributingDurationSec,
    meanCoronaryBloodVolumeMl: bloodVolume / contributingDurationSec,
  });
}

function findPersistentCrossingBracket(
  beats: readonly CoronaryStepResponseBeatObservableV1[],
  searchStartTimeSec: number,
  threshold: number,
  direction: "increase" | "decrease",
  persistenceBeatCount: 3,
): CoronaryStepResponseCrossingBracketV1 | null {
  const firstCandidate = beats.findIndex((beat) =>
    beat.startTimeSec >= searchStartTimeSec - TIME_TOLERANCE_SEC);
  if (firstCandidate < 0) return null;
  for (let index = firstCandidate;
    index + persistenceBeatCount <= beats.length;
    index += 1) {
    const persistent = beats.slice(index, index + persistenceBeatCount)
      .every((beat) => isOnFinalSide(
        beat.pressureFlowMmHgSecPerMl,
        threshold,
        direction,
      ));
    if (!persistent) continue;
    const current = beats[index]!;
    const previous = beats[index - 1];
    return Object.freeze({
      lowerTimeSec: Math.max(
        searchStartTimeSec,
        previous?.endTimeSec ?? current.startTimeSec,
      ),
      upperTimeSec: current.endTimeSec,
      thresholdPressureFlowMmHgSecPerMl: threshold,
      direction,
      firstCrossingBeatIndex: current.beatIndex,
      persistenceBeatCount,
      interpolated: false as const,
    });
  }
  return null;
}

function isOnFinalSide(
  value: number,
  threshold: number,
  direction: "increase" | "decrease",
): boolean {
  return direction === "increase" ? value >= threshold : value <= threshold;
}

function findPassiveExtremum(
  beats: readonly CoronaryStepResponseBeatObservableV1[],
  interventionTimeSec: number,
  baseline: number,
  finalDirection: "increase" | "decrease",
): CoronaryStepResponsePassiveExtremumV1 {
  const searchEndTimeSec = interventionTimeSec
    + CORONARY_V3_STEP_RESPONSE_METRICS_CLAIM_V1.passiveExtremumWindowSec;
  const candidates = beats.filter((beat) =>
    beat.endTimeSec > interventionTimeSec + TIME_TOLERANCE_SEC
    && beat.startTimeSec < searchEndTimeSec - TIME_TOLERANCE_SEC);
  if (candidates.length === 0) {
    throw new Error("no beat observations cover the passive-extremum window");
  }
  const finalSign = finalDirection === "increase" ? 1 : -1;
  let selected = candidates[0]!;
  let selectedOppositeSignedAmplitude = -finalSign
    * (selected.pressureFlowMmHgSecPerMl - baseline);
  for (const candidate of candidates.slice(1)) {
    const signedAmplitude = -finalSign
      * (candidate.pressureFlowMmHgSecPerMl - baseline);
    if (signedAmplitude > selectedOppositeSignedAmplitude) {
      selected = candidate;
      selectedOppositeSignedAmplitude = signedAmplitude;
    }
  }
  return Object.freeze({
    searchStartTimeSec: interventionTimeSec,
    searchEndTimeSec,
    beatIndex: selected.beatIndex,
    beatStartTimeSec: selected.startTimeSec,
    beatEndTimeSec: selected.endTimeSec,
    pressureFlowMmHgSecPerMl: selected.pressureFlowMmHgSecPerMl,
    signedOppositeAmplitudeFromBaselineMmHgSecPerMl:
      selectedOppositeSignedAmplitude,
    absoluteOppositeAmplitudeFromBaselineMmHgSecPerMl:
      Math.max(0, selectedOppositeSignedAmplitude),
    oppositeDirectionObserved: selectedOppositeSignedAmplitude > 0,
  });
}

function summarizeWindowDrift(
  beats: readonly CoronaryStepResponseBeatObservableV1[],
  window: CoronaryStepResponseWindowV1,
): CoronaryStepResponseWindowDriftV1 {
  const midpoint = (window.startTimeSec + window.endTimeSec) / 2;
  const firstHalf = summarizeWindow(beats, Object.freeze({
    startTimeSec: window.startTimeSec,
    endTimeSec: midpoint,
  }));
  const secondHalf = summarizeWindow(beats, Object.freeze({
    startTimeSec: midpoint,
    endTimeSec: window.endTimeSec,
  }));
  return Object.freeze({
    firstHalf,
    secondHalf,
    secondMinusFirstPressureFlowMmHgSecPerMl:
      secondHalf.meanPressureFlowMmHgSecPerMl
      - firstHalf.meanPressureFlowMmHgSecPerMl,
    secondMinusFirstObservedFlowMlPerSec:
      secondHalf.meanObservedFlowMlPerSec
      - firstHalf.meanObservedFlowMlPerSec,
    secondMinusFirstCoronaryBloodVolumeMl:
      secondHalf.meanCoronaryBloodVolumeMl
      - firstHalf.meanCoronaryBloodVolumeMl,
  });
}

function validateInput(input: CoronaryStepResponseMetricsInputV1): void {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("coronary step-response input must be an object");
  }
  const allowedInputKeys = new Set([
    "interventionTimeSec",
    "baselineWindow",
    "finalWindow",
    "persistenceBeatCount",
    "measurementStation",
    "beats",
  ]);
  if (Object.keys(input).some((key) => !allowedInputKeys.has(key))) {
    throw new Error("coronary step-response input has unexpected fields");
  }
  finite(input.interventionTimeSec, "interventionTimeSec");
  validateWindow(input.baselineWindow, "baselineWindow");
  validateWindow(input.finalWindow, "finalWindow");
  if (input.baselineWindow.endTimeSec
      > input.interventionTimeSec + TIME_TOLERANCE_SEC) {
    throw new Error("baselineWindow must end no later than intervention");
  }
  if (input.finalWindow.startTimeSec
      < input.interventionTimeSec - TIME_TOLERANCE_SEC) {
    throw new Error("finalWindow must start no earlier than intervention");
  }
  if (input.persistenceBeatCount !== 3) {
    throw new Error("step-response metric requires exactly three persistent beats");
  }
  validateMeasurementStation(input.measurementStation);
  if (!Array.isArray(input.beats) || input.beats.length < 4) {
    throw new Error("step-response metric requires at least four beats");
  }
  let previous: CoronaryStepResponseBeatV1 | null = null;
  let hasInterventionBoundary = false;
  for (const beat of input.beats) {
    validateBeat(beat);
    if (previous !== null) {
      if (beat.beatIndex <= previous.beatIndex) {
        throw new Error("beatIndex values must increase strictly");
      }
      if (Math.abs(beat.startTimeSec - previous.endTimeSec)
        > TIME_TOLERANCE_SEC) {
        throw new Error("beat observations must form a contiguous timebase");
      }
    }
    if (Math.abs(beat.startTimeSec - input.interventionTimeSec)
      <= TIME_TOLERANCE_SEC) {
      hasInterventionBoundary = true;
    }
    previous = beat;
  }
  if (!hasInterventionBoundary) {
    throw new Error("intervention must coincide with an observed beat boundary");
  }
}

function validateWindow(
  window: CoronaryStepResponseWindowV1,
  label: string,
): void {
  if (window === null || typeof window !== "object"
    || Array.isArray(window)) {
    throw new TypeError(`${label} must be an object`);
  }
  const keys = Object.keys(window).sort();
  if (keys.length !== 2 || keys[0] !== "endTimeSec"
    || keys[1] !== "startTimeSec") {
    throw new Error(`${label} has unexpected fields`);
  }
  finite(window.startTimeSec, `${label}.startTimeSec`);
  finite(window.endTimeSec, `${label}.endTimeSec`);
  if (window.endTimeSec <= window.startTimeSec) {
    throw new Error(`${label} must have positive duration`);
  }
}

function validateMeasurementStation(
  station: CoronaryStepMeasurementStationV1,
): void {
  if (station === null || typeof station !== "object"
    || Array.isArray(station)) {
    throw new TypeError("measurementStation must be an object");
  }
  if (station.kind === "cannulated-left-main-zero-flow-wedge") {
    const keys = Object.keys(station).sort();
    const expected = [
      "downstreamReferenceStation",
      "flowStation",
      "kind",
      "upstreamPressureStation",
      "zeroFlowOcclusionDurationSec",
    ];
    if (JSON.stringify(keys) !== JSON.stringify(expected)
      || station.upstreamPressureStation !== "left-main-cannula-tip"
      || station.flowStation !== "left-main-perfusion-line"
      || station.downstreamReferenceStation !== "distal-zero-flow-wedge"
      || station.zeroFlowOcclusionDurationSec !== 10) {
      throw new Error("invalid exact cannulated left-main measurement station");
    }
    return;
  }
  if (station.kind !== "venous-boundary-pressure-flow-surrogate") {
    throw new Error("unsupported coronary step-response measurement station");
  }
  const keys = Object.keys(station).sort();
  const expected = [
    "downstreamReferenceStation",
    "flowStation",
    "kind",
    "reasonExactWedgeUnavailable",
    "upstreamPressureStation",
  ];
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error("surrogate measurement station has unexpected fields");
  }
  for (const [name, value] of Object.entries({
    upstreamPressureStation: station.upstreamPressureStation,
    flowStation: station.flowStation,
    downstreamReferenceStation: station.downstreamReferenceStation,
    reasonExactWedgeUnavailable: station.reasonExactWedgeUnavailable,
  })) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${name} must be an explicit nonempty string`);
    }
  }
}

function validateBeat(beat: CoronaryStepResponseBeatV1): void {
  if (beat === null || typeof beat !== "object" || Array.isArray(beat)) {
    throw new TypeError("coronary step-response beat must be an object");
  }
  const keys = Object.keys(beat).sort();
  const expected = [
    "beatIndex",
    "endTimeSec",
    "meanCoronaryBloodVolumeMl",
    "meanDownstreamReferencePressureMmHg",
    "meanObservedFlowMlPerSec",
    "meanUpstreamPressureMmHg",
    "startTimeSec",
  ];
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error("coronary step-response beat has unexpected fields");
  }
  if (!Number.isSafeInteger(beat.beatIndex) || beat.beatIndex < 0) {
    throw new Error("beatIndex must be a nonnegative safe integer");
  }
  for (const [name, value] of Object.entries({
    startTimeSec: beat.startTimeSec,
    endTimeSec: beat.endTimeSec,
    meanUpstreamPressureMmHg: beat.meanUpstreamPressureMmHg,
    meanDownstreamReferencePressureMmHg:
      beat.meanDownstreamReferencePressureMmHg,
    meanObservedFlowMlPerSec: beat.meanObservedFlowMlPerSec,
    meanCoronaryBloodVolumeMl: beat.meanCoronaryBloodVolumeMl,
  })) finite(value, name);
  if (beat.endTimeSec <= beat.startTimeSec) {
    throw new Error("coronary step-response beat duration must be positive");
  }
  if (beat.meanObservedFlowMlPerSec <= 0) {
    throw new Error("observed flow must be strictly positive for P/Q");
  }
  if (beat.meanUpstreamPressureMmHg
      <= beat.meanDownstreamReferencePressureMmHg) {
    throw new Error("upstream pressure must exceed downstream reference pressure");
  }
  if (beat.meanCoronaryBloodVolumeMl < 0) {
    throw new Error("coronary blood volume must be nonnegative");
  }
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
