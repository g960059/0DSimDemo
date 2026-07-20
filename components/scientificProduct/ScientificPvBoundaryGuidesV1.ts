import type {
  MainWireScientificObservableFrameV1,
  MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";

export type ScientificPvBoundaryGuidePointV1 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

/**
 * Familiar single-beat PV boundaries used as an orientation aid. These are
 * deliberately kept separate from the fixed-TBV multi-beat load-series
 * protocol: a guide must be immediate, stable during transitions, and must
 * never be presented as a measured ESPVR/EDPVR fit.
 */
export type ScientificPvBoundaryGuideV1 = Readonly<{
  key: string;
  scenarioId: string;
  color: string;
  pressureBasis: "intracavitary" | "transmural";
  espvr: readonly ScientificPvBoundaryGuidePointV1[];
  edpvr: readonly ScientificPvBoundaryGuidePointV1[];
  endSystolicContact: ScientificPvBoundaryGuidePointV1;
  endDiastolicContact: ScientificPvBoundaryGuidePointV1;
  semantics:
    | "single-beat-orientation-guide-not-load-series-fit"
    | "progressive-model-derived-orientation-guide-not-formal-fit";
  /**
   * Optional presentation metadata for progressively refined guides. The
   * fixed-TBV V3 lanes remain scientifically separate; these fields never
   * upgrade a guide into a formal pooled ESPVR/EDPVR fit.
   */
  generationId?: string;
  generationSequence?: number;
  generationAge?: number;
  status?: "fallback" | "running" | "complete" | "stale";
  sourceRole?: "visible-current" | "target-preview" | "history";
  opacityMultiplier?: number;
  replacementPending?: boolean;
  completedPointCount?: number;
  maximumPointCount?: 7;
  progressiveEvidence?: Readonly<{
    selectedBeatIds: readonly string[];
    lowerPointCount: number;
    higherPointCount: number;
    espvrPointCount: number;
    edpvrPointCount: number;
    espvrRefined: boolean;
    edpvrRefined: boolean;
    pooledFormalRelationClaimed: false;
    extrapolationPolicy: "bounded-educational-orientation-only";
  }>;
}>;

export type ScientificPvBoundaryGuideSeriesInputV1 = Readonly<{
  key: string;
  color: string;
  volumeObservableId: MainWireScientificObservableIdV1;
  pressureObservableId: MainWireScientificObservableIdV1;
  scenario: Readonly<{
    id: string;
    frames: readonly MainWireScientificObservableFrameV1[];
    guideCycleFrames?: readonly MainWireScientificObservableFrameV1[] | null;
    periodicCycleFrames: readonly MainWireScientificObservableFrameV1[] | null;
    cycleDurationSec: number | null;
  }>;
}>;

type CompleteLvSample = Readonly<{
  volumeMl: number;
  displayedPressureMmHg: number;
  transmuralPressureMmHg: number;
  externalPressureMmHg: number;
  mitralFlowMlPerSec: number | null;
  aorticFlowMlPerSec: number | null;
}>;

const LV_VOLUME_ID = "hemodynamics.volume.LV" as const;
const LV_ABSOLUTE_PRESSURE_ID = "hemodynamics.pressure.absolute.LV" as const;
const LV_TRANSMURAL_PRESSURE_ID = "hemodynamics.pressure.transmural.LV" as const;
const MITRAL_FLOW_ID = "valve.MV.flow" as const;
const AORTIC_FLOW_ID = "valve.AoV.flow" as const;
const KLOTZ_NORMALIZED_PRESSURE_MMHG = 28.2;
const KLOTZ_NORMALIZED_EXPONENT = 2.79;
const GUIDE_SAMPLE_COUNT = 64;

export function buildScientificPvBoundaryGuidesV1(
  series: readonly ScientificPvBoundaryGuideSeriesInputV1[],
): readonly ScientificPvBoundaryGuideV1[] {
  return Object.freeze(series.flatMap((item) => {
    const guide = buildScientificPvBoundaryGuideV1(item);
    return guide === null ? [] : [guide];
  }));
}

export function buildScientificPvBoundaryGuideV1(
  series: ScientificPvBoundaryGuideSeriesInputV1,
): ScientificPvBoundaryGuideV1 | null {
  if (
    series.volumeObservableId !== LV_VOLUME_ID
    || (
      series.pressureObservableId !== LV_ABSOLUTE_PRESSURE_ID
      && series.pressureObservableId !== LV_TRANSMURAL_PRESSURE_ID
    )
  ) return null;
  const frames = guideSourceFrames(series);
  const samples = frames.flatMap((frame) => {
    const sample = completeLvSample(frame, series.pressureObservableId);
    return sample === null ? [] : [sample];
  });
  if (samples.length < 3) return null;

  const maximumTransmuralPressure = Math.max(
    ...samples.map(({ transmuralPressureMmHg }) => transmuralPressureMmHg),
  );
  const maximumVolume = Math.max(...samples.map(({ volumeMl }) => volumeMl));
  const systolicCandidates = samples.filter((sample) =>
    sample.volumeMl > 1e-6
    && sample.transmuralPressureMmHg > 0
    && sample.transmuralPressureMmHg >= 0.5 * maximumTransmuralPressure
    && sample.volumeMl <= 0.98 * maximumVolume);
  const endSystolic = maximumBy(
    systolicCandidates.length >= 1 ? systolicCandidates : samples,
    (sample) => sample.transmuralPressureMmHg / Math.max(1e-6, sample.volumeMl),
  );
  const endDiastolic = selectEndDiastolicSample(samples);
  if (
    endSystolic === null
    || endDiastolic === null
    || endSystolic.transmuralPressureMmHg <= 0
    || endSystolic.volumeMl <= 0
  ) return null;
  const endSystolicContact = Object.freeze({
    volumeMl: endSystolic.volumeMl,
    pressureMmHg: endSystolic.displayedPressureMmHg,
  });
  const endDiastolicContact = Object.freeze({
    volumeMl: endDiastolic.volumeMl,
    pressureMmHg: endDiastolic.displayedPressureMmHg,
  });

  // V0=0 is an explicit textbook-display convention, not a fitted V0. With
  // this convention, max(Ptm/V) selects the max-elastance support line and
  // makes the guide touch the upper-left systolic boundary of the current loop.
  const systolicV0Ml = 0;
  const endSystolicElastance =
    endSystolic.transmuralPressureMmHg
    / (endSystolic.volumeMl - systolicV0Ml);
  const systolicExternalPressure = displayedExternalOffset(
    series.pressureObservableId,
    endSystolic,
  );
  const displayedLoopMaximum = Math.max(
    ...samples.map(({ displayedPressureMmHg }) => displayedPressureMmHg),
  );
  const systolicTargetPressure = Math.max(
    endSystolic.displayedPressureMmHg * 1.25,
    displayedLoopMaximum * 1.25,
  );
  const systolicEndVolume = Math.max(
    endSystolic.volumeMl * 1.12,
    (systolicTargetPressure - systolicExternalPressure)
      / endSystolicElastance + systolicV0Ml,
  );
  const systolicPressureAtVolume = (volumeMl: number) =>
    systolicExternalPressure
      + endSystolicElastance * (volumeMl - systolicV0Ml);
  const espvr = withExactCurveContact(
    joinCurveSegments(
      sampleCurve(
        systolicV0Ml,
        endSystolic.volumeMl,
        systolicPressureAtVolume,
        36,
      ),
      sampleCurve(
        endSystolic.volumeMl,
        systolicEndVolume,
        systolicPressureAtVolume,
        20,
      ),
    ),
    endSystolicContact,
  );

  const edpvr = buildKlotzInformedFillingGuide(
    endDiastolic,
    series.pressureObservableId,
  );

  return Object.freeze({
    key: `${series.key}:textbook-boundaries`,
    scenarioId: series.scenario.id,
    color: series.color,
    pressureBasis: series.pressureObservableId.includes(".transmural.")
      ? "transmural"
      : "intracavitary",
    espvr,
    edpvr,
    endSystolicContact,
    endDiastolicContact,
    semantics: "single-beat-orientation-guide-not-load-series-fit",
  });
}

function buildKlotzInformedFillingGuide(
  endDiastolic: CompleteLvSample,
  displayedPressureId: MainWireScientificObservableIdV1,
): readonly ScientificPvBoundaryGuidePointV1[] {
  // The published single-beat normalization is not defined at non-positive
  // filling pressure and is not intended for Pm >= 30 mmHg. Fail closed for
  // those cases instead of manufacturing a familiar-looking curve.
  const diastolicPressure = endDiastolic.transmuralPressureMmHg;
  if (!(diastolicPressure > 0 && diastolicPressure < 30)) {
    return Object.freeze([]);
  }
  // Klotz-informed single-beat normalized EDPVR. V0 follows the published
  // estimate, V30 uses the 28.2/2.79 normalized relation, and the curve is
  // anchored exactly at the current end-diastolic operating point.
  const unboundedDiastolicV0 = endDiastolic.volumeMl
    * (0.6 - 0.006 * diastolicPressure);
  const diastolicV0Ml = clamp(
    unboundedDiastolicV0,
    0,
    Math.max(0, endDiastolic.volumeMl - 1e-6),
  );
  const diastolicSpanMl = Math.max(1e-6, endDiastolic.volumeMl - diastolicV0Ml);
  const diastolicV30Ml = diastolicV0Ml + diastolicSpanMl
    / Math.pow(
      diastolicPressure / KLOTZ_NORMALIZED_PRESSURE_MMHG,
      1 / KLOTZ_NORMALIZED_EXPONENT,
    );
  const diastolicV30SpanMl = Math.max(1e-6, diastolicV30Ml - diastolicV0Ml);
  const diastolicExternalPressure = displayedExternalOffset(
    displayedPressureId,
    endDiastolic,
  );
  const diastolicTargetPressure = Math.max(30, diastolicPressure * 2.4);
  const diastolicEndVolume = Math.max(
    endDiastolic.volumeMl * 1.12,
    Math.min(
      endDiastolic.volumeMl * 1.28,
      diastolicV0Ml + diastolicSpanMl
        * Math.pow(
          diastolicTargetPressure / diastolicPressure,
          1 / KLOTZ_NORMALIZED_EXPONENT,
        ),
    ),
  );
  const preCurve = sampleCurve(
    0,
    diastolicV0Ml,
    () => diastolicExternalPressure,
    12,
  );
  const diastolicPressureAtVolume = (volumeMl: number) =>
    diastolicExternalPressure + KLOTZ_NORMALIZED_PRESSURE_MMHG
      * Math.pow(
        Math.max(0, (volumeMl - diastolicV0Ml) / diastolicV30SpanMl),
        KLOTZ_NORMALIZED_EXPONENT,
      );
  return withExactCurveContact(
    joinCurveSegments(
      preCurve,
      sampleCurve(
        diastolicV0Ml,
        endDiastolic.volumeMl,
        diastolicPressureAtVolume,
        36,
      ),
      sampleCurve(
        endDiastolic.volumeMl,
        diastolicEndVolume,
        diastolicPressureAtVolume,
        20,
      ),
    ),
    Object.freeze({
      volumeMl: endDiastolic.volumeMl,
      pressureMmHg: endDiastolic.displayedPressureMmHg,
    }),
  );
}

function guideSourceFrames(
  series: ScientificPvBoundaryGuideSeriesInputV1,
): readonly MainWireScientificObservableFrameV1[] {
  const completeBeat = series.scenario.guideCycleFrames;
  if (isCompleteGuideCycle(completeBeat, series.scenario.cycleDurationSec)) {
    return completeBeat;
  }
  const periodic = series.scenario.periodicCycleFrames;
  if (isCompleteGuideCycle(periodic, series.scenario.cycleDurationSec)) {
    return periodic;
  }
  const frames = series.scenario.frames;
  const duration = series.scenario.cycleDurationSec;
  if (frames.length < 3 || duration === null || !(duration > 0)) {
    return Object.freeze([]);
  }
  const end = frames.at(-1)!.acceptedTimeSec;
  const recent = frames.filter(({ acceptedTimeSec }) =>
    acceptedTimeSec >= end - duration - 1e-9);
  return isCompleteGuideCycle(recent, duration)
    ? recent
    : Object.freeze([]);
}

function isCompleteGuideCycle(
  frames: readonly MainWireScientificObservableFrameV1[] | null | undefined,
  cycleDurationSec: number | null,
): frames is readonly MainWireScientificObservableFrameV1[] {
  if (
    frames === null
    || frames === undefined
    || frames.length < 3
    || cycleDurationSec === null
    || !(cycleDurationSec > 0)
  ) return false;
  const first = frames[0]!.acceptedTimeSec;
  const last = frames.at(-1)!.acceptedTimeSec;
  if (!Number.isFinite(first) || !Number.isFinite(last)) return false;
  if (last - first < 0.9 * cycleDurationSec) return false;
  return frames.slice(1).every((frame, index) =>
    frame.acceptedTimeSec > frames[index]!.acceptedTimeSec);
}

function completeLvSample(
  frame: MainWireScientificObservableFrameV1,
  displayedPressureId: MainWireScientificObservableIdV1,
): CompleteLvSample | null {
  const volumeMl = availableValue(frame, LV_VOLUME_ID);
  const displayedPressureMmHg = availableValue(frame, displayedPressureId);
  const absolutePressureMmHg = availableValue(frame, LV_ABSOLUTE_PRESSURE_ID);
  const transmuralPressureMmHg = availableValue(frame, LV_TRANSMURAL_PRESSURE_ID);
  if (
    volumeMl === null
    || displayedPressureMmHg === null
    || absolutePressureMmHg === null
    || transmuralPressureMmHg === null
  ) return null;
  return Object.freeze({
    volumeMl,
    displayedPressureMmHg,
    transmuralPressureMmHg,
    externalPressureMmHg: absolutePressureMmHg - transmuralPressureMmHg,
    mitralFlowMlPerSec: optionalAvailableValue(frame, MITRAL_FLOW_ID),
    aorticFlowMlPerSec: optionalAvailableValue(frame, AORTIC_FLOW_ID),
  });
}

function selectEndDiastolicSample(
  samples: readonly CompleteLvSample[],
): CompleteLvSample | null {
  for (let index = 1; index < samples.length - 1; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    const next = samples[index + 1]!;
    if (
      previous.mitralFlowMlPerSec !== null
      && current.mitralFlowMlPerSec !== null
      && next.mitralFlowMlPerSec !== null
      && current.aorticFlowMlPerSec !== null
      && previous.mitralFlowMlPerSec > 1
      && current.mitralFlowMlPerSec <= 1
      && next.mitralFlowMlPerSec <= 1
      && current.aorticFlowMlPerSec <= 1
    ) return current;
  }
  const maximumVolume = Math.max(...samples.map(({ volumeMl }) => volumeMl));
  // Prefer the maximum-volume point for which both left-sided valves have
  // ceased forward flow. This approximates mitral closure/ED without coupling
  // the instant visual guide to the much heavier research-protocol module.
  const eventCandidates = samples.filter((sample) =>
    sample.volumeMl >= maximumVolume - 0.05
    && sample.mitralFlowMlPerSec !== null
    && sample.aorticFlowMlPerSec !== null
    && sample.mitralFlowMlPerSec <= 1
    && sample.aorticFlowMlPerSec <= 1);
  return maximumBy(
    eventCandidates.length > 0 ? eventCandidates : samples,
    (sample) => sample.volumeMl,
  );
}

function displayedExternalOffset(
  displayedPressureId: MainWireScientificObservableIdV1,
  sample: CompleteLvSample,
): number {
  return displayedPressureId.includes(".transmural.")
    ? 0
    : sample.externalPressureMmHg;
}

function availableValue(
  frame: MainWireScientificObservableFrameV1,
  observableId: MainWireScientificObservableIdV1,
): number | null {
  const candidate = frame.values[observableId];
  return candidate.availability === "available"
    && candidate.value !== null
    && Number.isFinite(candidate.value)
    ? candidate.value
    : null;
}

function optionalAvailableValue(
  frame: MainWireScientificObservableFrameV1,
  observableId: MainWireScientificObservableIdV1,
): number | null {
  const candidate = frame.values[observableId];
  return candidate !== undefined
    && candidate.availability === "available"
    && candidate.value !== null
    && Number.isFinite(candidate.value)
    ? candidate.value
    : null;
}

function sampleCurve(
  startVolumeMl: number,
  endVolumeMl: number,
  pressureAtVolume: (volumeMl: number) => number,
  count = GUIDE_SAMPLE_COUNT,
): readonly ScientificPvBoundaryGuidePointV1[] {
  const normalizedCount = Math.max(2, Math.round(count));
  return Object.freeze(Array.from({ length: normalizedCount }, (_, index) => {
    const fraction = index / (normalizedCount - 1);
    const volumeMl = startVolumeMl + fraction * (endVolumeMl - startVolumeMl);
    return Object.freeze({
      volumeMl,
      pressureMmHg: pressureAtVolume(volumeMl),
    });
  }));
}

function joinCurveSegments(
  ...segments: readonly (readonly ScientificPvBoundaryGuidePointV1[])[]
): readonly ScientificPvBoundaryGuidePointV1[] {
  const joined: ScientificPvBoundaryGuidePointV1[] = [];
  for (const segment of segments) {
    if (segment.length === 0) continue;
    const startIndex = joined.length > 0 ? 1 : 0;
    joined.push(...segment.slice(startIndex));
  }
  return Object.freeze(joined);
}

function withExactCurveContact(
  points: readonly ScientificPvBoundaryGuidePointV1[],
  contact: ScientificPvBoundaryGuidePointV1,
): readonly ScientificPvBoundaryGuidePointV1[] {
  if (points.length === 0) return points;
  let selectedIndex = 0;
  let selectedDistance = Number.POSITIVE_INFINITY;
  points.forEach(({ volumeMl }, index) => {
    const distance = Math.abs(volumeMl - contact.volumeMl);
    if (distance >= selectedDistance) return;
    selectedIndex = index;
    selectedDistance = distance;
  });
  return Object.freeze(points.map((point, index) =>
    index === selectedIndex ? contact : point));
}

function maximumBy<T>(
  values: readonly T[],
  score: (value: T) => number,
): T | null {
  let selected: T | null = null;
  let selectedScore = -Infinity;
  for (const value of values) {
    const candidateScore = score(value);
    if (!Number.isFinite(candidateScore) || candidateScore <= selectedScore) {
      continue;
    }
    selected = value;
    selectedScore = candidateScore;
  }
  return selected;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
