import type {
  MainWireScientificPvRelationBeatV3,
  MainWireScientificPvRelationsProgressV3,
  MainWireScientificPvRelationsProtocolResultV3,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";

import type {
  ScientificPvBoundaryGuidePointV1,
  ScientificPvBoundaryGuideV1,
} from "./ScientificPvBoundaryGuidesV1";

export const SCIENTIFIC_PV_PROGRESSIVE_GUIDE_MAXIMUM_POINT_COUNT_V1 = 7;

export type ScientificPvProgressiveGuideSourceRoleV1 =
  | "visible-current"
  | "target-preview"
  | "history";

export type ScientificPvProgressiveBoundaryGuideInputV1 = Readonly<{
  fallbackGuide: ScientificPvBoundaryGuideV1;
  generationId: string;
  generationSequence?: number;
  generationAge?: number;
  generationStatus: "running" | "complete";
  sourceRole: ScientificPvProgressiveGuideSourceRoleV1;
  /** True while a newer generation has not produced renderable evidence yet. */
  replacementPending?: boolean;
  progress: MainWireScientificPvRelationsProgressV3 | null;
  result: MainWireScientificPvRelationsProtocolResultV3 | null;
}>;

type SelectedBeatSetV1 = Readonly<{
  baseline: MainWireScientificPvRelationBeatV3;
  lower: readonly MainWireScientificPvRelationBeatV3[];
  higher: readonly MainWireScientificPvRelationBeatV3[];
  all: readonly MainWireScientificPvRelationBeatV3[];
}>;

type EndpointKindV1 = "endSystolic" | "endDiastolic";

type RelationEvidencePointV1 = Readonly<{
  beatId: string;
  volumeMl: number;
  transmuralPressureMmHg: number;
  absolutePressureMmHg: number;
  externalPressureMmHg: number;
}>;

const GUIDE_SAMPLE_COUNT = 64;
const MINIMUM_VOLUME_SPAN_ML = 0.5;
const MINIMUM_ESPVR_SLOPE_MMHG_PER_ML = 0.05;
const MAXIMUM_ESPVR_SLOPE_MMHG_PER_ML = 20;
const MINIMUM_EDPVR_EXPONENT = 1.2;
const MAXIMUM_EDPVR_EXPONENT = 6;

/**
 * Refines the immediate textbook guide with a deliberately non-formal view of
 * progressively acquired V3 endpoints. V3's lower- and higher-loading lanes
 * are not pooled by the research protocol; this function is presentation-only
 * and advertises that limitation in its returned semantics and evidence.
 *
 * The point budget is deterministic: baseline plus up to three EDV-spanning
 * points from each lane. ESPVR appears after two usable endpoints. EDPVR
 * requires baseline plus evidence on both sides of baseline EDV. No curve is
 * exposed before its own evidence threshold: in particular, the internal
 * single-beat V0=0 orientation fallback must never flash on screen while the
 * progressive acquisition is still underdetermined.
 */
export function buildScientificPvProgressiveBoundaryGuideV1(
  input: ScientificPvProgressiveBoundaryGuideInputV1,
): ScientificPvBoundaryGuideV1 {
  const generationAge = Math.max(0, Math.round(input.generationAge ?? 0));
  const beats = input.result?.beats ?? input.progress?.beats ?? [];
  const selected = selectProgressiveGuideBeatsV1(beats);
  if (selected === null) {
    return withProgressiveMetadataV1({
      input,
      generationAge,
      espvr: Object.freeze([]),
      edpvr: Object.freeze([]),
      endSystolicContact: input.fallbackGuide.endSystolicContact,
      endDiastolicContact: input.fallbackGuide.endDiastolicContact,
      selectedBeatIds: Object.freeze([]),
      lowerPointCount: 0,
      higherPointCount: 0,
      espvrPointCount: 0,
      edpvrPointCount: 0,
      espvrRefined: false,
      edpvrRefined: false,
    });
  }

  const systolicEvidence = relationEvidencePointsV1(
    selected.all,
    "endSystolic",
  );
  const diastolicEvidence = relationEvidencePointsV1(
    selected.all,
    "endDiastolic",
  );
  const refinedEspvr = buildProgressiveEspvrV1({
    points: systolicEvidence,
    displayContact: input.fallbackGuide.endSystolicContact,
    displayInterceptPressureMmHg:
      input.fallbackGuide.espvr[0]?.pressureMmHg ?? 0,
    displayEndVolumeMl:
      input.fallbackGuide.espvr.at(-1)?.volumeMl
        ?? input.fallbackGuide.endSystolicContact.volumeMl,
  });
  const refinedEdpvr = buildProgressiveEdpvrV1({
    baselineBeatId: selected.baseline.beatId,
    lowerBeatIds: new Set(selected.lower.map(({ beatId }) => beatId)),
    higherBeatIds: new Set(selected.higher.map(({ beatId }) => beatId)),
    points: diastolicEvidence,
    pressureBasis: input.fallbackGuide.pressureBasis,
    displayContact: input.fallbackGuide.endDiastolicContact,
    displayExternalPressureMmHg:
      input.fallbackGuide.edpvr[0]?.pressureMmHg ?? 0,
    displayEndVolumeMl:
      input.fallbackGuide.edpvr.at(-1)?.volumeMl
        ?? input.fallbackGuide.endDiastolicContact.volumeMl,
  });

  return withProgressiveMetadataV1({
    input,
    generationAge,
    espvr: refinedEspvr ?? Object.freeze([]),
    edpvr: refinedEdpvr ?? Object.freeze([]),
    endSystolicContact: input.fallbackGuide.endSystolicContact,
    endDiastolicContact: input.fallbackGuide.endDiastolicContact,
    selectedBeatIds: Object.freeze(selected.all.map(({ beatId }) => beatId)),
    lowerPointCount: selected.lower.length,
    higherPointCount: selected.higher.length,
    espvrPointCount: systolicEvidence.length,
    edpvrPointCount: refinedEdpvr === null ? 0 : diastolicEvidence.length,
    espvrRefined: refinedEspvr !== null,
    edpvrRefined: refinedEdpvr !== null,
  });
}

export function buildScientificPvProgressiveBoundaryGuidesV1(
  inputs: readonly ScientificPvProgressiveBoundaryGuideInputV1[],
): readonly ScientificPvBoundaryGuideV1[] {
  return Object.freeze(inputs.map(buildScientificPvProgressiveBoundaryGuideV1));
}

/** Exposed for deterministic selection tests and presentation diagnostics. */
export function selectScientificPvProgressiveGuideBeatIdsV1(
  beats: readonly MainWireScientificPvRelationBeatV3[],
): readonly string[] {
  const selected = selectProgressiveGuideBeatsV1(beats);
  return selected === null
    ? Object.freeze([])
    : Object.freeze(selected.all.map(({ beatId }) => beatId));
}

function selectProgressiveGuideBeatsV1(
  beats: readonly MainWireScientificPvRelationBeatV3[],
): SelectedBeatSetV1 | null {
  const usable = beats.filter(isUsableProgressiveBeatV1);
  const baseline = usable.find(({ role }) => role === "baseline") ?? null;
  const baselineEdv = baseline?.endDiastolic?.volumeMl;
  if (baseline === null || baselineEdv === undefined) return null;

  const lower = selectEdvEnvelopeV1(usable.filter((beat) =>
    beat.beatId !== baseline.beatId
    && beat.role === "lower-loading"
    && beat.endDiastolic!.volumeMl < baselineEdv - MINIMUM_VOLUME_SPAN_ML));
  const higher = selectEdvEnvelopeV1(usable.filter((beat) =>
    beat.beatId !== baseline.beatId
    && beat.role === "higher-loading"
    && beat.endDiastolic!.volumeMl > baselineEdv + MINIMUM_VOLUME_SPAN_ML));
  return Object.freeze({
    baseline,
    lower,
    higher,
    all: Object.freeze([baseline, ...lower, ...higher]),
  });
}

function isUsableProgressiveBeatV1(
  beat: MainWireScientificPvRelationBeatV3,
): boolean {
  return beat.valid
    && beat.endDiastolic !== null
    && beat.endSystolic !== null
    && finiteEndpointV1(beat, "endDiastolic")
    && finiteEndpointV1(beat, "endSystolic")
    && beat.classification !== "rejected"
    && beat.classification !== "alternans-suspect-high"
    && beat.classification !== "alternans-suspect-low"
    && beat.classification !== "wrong-direction-loading-point";
}

function finiteEndpointV1(
  beat: MainWireScientificPvRelationBeatV3,
  endpoint: EndpointKindV1,
): boolean {
  const point = beat[endpoint];
  return point !== null
    && point.volumeMl > 0
    && Number.isFinite(point.volumeMl)
    && Number.isFinite(point.transmuralPressureMmHg)
    && Number.isFinite(point.absolutePressureMmHg)
    && Number.isFinite(point.externalPressureMmHg);
}

function selectEdvEnvelopeV1(
  beats: readonly MainWireScientificPvRelationBeatV3[],
): readonly MainWireScientificPvRelationBeatV3[] {
  const sorted = [...beats].sort((left, right) => {
    const byVolume = left.endDiastolic!.volumeMl
      - right.endDiastolic!.volumeMl;
    return Math.abs(byVolume) > 1e-9
      ? byVolume
      : left.beatId.localeCompare(right.beatId);
  });
  if (sorted.length <= 3) return Object.freeze(sorted);
  const middleIndex = Math.round((sorted.length - 1) / 2);
  return Object.freeze([
    sorted[0]!,
    sorted[middleIndex]!,
    sorted.at(-1)!,
  ]);
}

function relationEvidencePointsV1(
  beats: readonly MainWireScientificPvRelationBeatV3[],
  endpoint: EndpointKindV1,
): readonly RelationEvidencePointV1[] {
  return Object.freeze(beats.flatMap((beat) => {
    const point = beat[endpoint];
    if (point === null) return [];
    return [Object.freeze({
      beatId: beat.beatId,
      volumeMl: point.volumeMl,
      transmuralPressureMmHg: point.transmuralPressureMmHg,
      absolutePressureMmHg: point.absolutePressureMmHg,
      externalPressureMmHg: point.externalPressureMmHg,
    })];
  }));
}

function buildProgressiveEspvrV1(input: Readonly<{
  points: readonly RelationEvidencePointV1[];
  displayContact: ScientificPvBoundaryGuidePointV1;
  displayInterceptPressureMmHg: number;
  displayEndVolumeMl: number;
}>): readonly ScientificPvBoundaryGuidePointV1[] | null {
  const points = input.points.filter(({ transmuralPressureMmHg }) =>
    transmuralPressureMmHg > 0);
  if (points.length < 2) return null;
  const volumes = points.map(({ volumeMl }) => volumeMl);
  const span = Math.max(...volumes) - Math.min(...volumes);
  if (span < MINIMUM_VOLUME_SPAN_ML) return null;

  const pairwiseSlopes = points.flatMap((left, leftIndex) =>
    points.slice(leftIndex + 1).flatMap((right) => {
      const deltaVolume = right.volumeMl - left.volumeMl;
      if (Math.abs(deltaVolume) < MINIMUM_VOLUME_SPAN_ML) return [];
      const slope = (right.transmuralPressureMmHg
        - left.transmuralPressureMmHg) / deltaVolume;
      return Number.isFinite(slope) && slope > 0 ? [slope] : [];
    }));
  const rawSlope = medianV1(pairwiseSlopes);
  if (rawSlope === null) return null;
  const initialSlope = clampV1(
    rawSlope,
    MINIMUM_ESPVR_SLOPE_MMHG_PER_ML,
    MAXIMUM_ESPVR_SLOPE_MMHG_PER_ML,
  );
  const intercept = medianV1(points.map((point) =>
    point.transmuralPressureMmHg - initialSlope * point.volumeMl));
  if (intercept === null) return null;
  const minimumVolume = Math.min(...volumes);
  const rawV0 = -intercept / initialSlope;
  const evidenceV0Ml = clampV1(rawV0, 0, 0.9 * minimumVolume);
  const contact = input.displayContact;
  if (!(contact.volumeMl - evidenceV0Ml > 1e-9)) return null;
  // Endpoint evidence updates V0, but the beginner-facing support line is
  // anchored to the visible loop's upper-left contact. The formal event-based
  // relation remains available only in the opt-in research overlay.
  const slope = clampV1(
    (contact.pressureMmHg - input.displayInterceptPressureMmHg)
      / (contact.volumeMl - evidenceV0Ml),
    MINIMUM_ESPVR_SLOPE_MMHG_PER_ML,
    MAXIMUM_ESPVR_SLOPE_MMHG_PER_ML,
  );
  if (!Number.isFinite(slope)) return null;
  const displayV0Ml = Math.max(
    0,
    contact.volumeMl
      - (contact.pressureMmHg - input.displayInterceptPressureMmHg) / slope,
  );
  if (!(contact.volumeMl - displayV0Ml > 1e-9)) return null;

  // The conventional V0 intercept is retained for orientation, while the
  // upper extrapolation is bounded tightly to the observed systolic envelope.
  const boundedExtensionMl = clampV1(
    0.15 * span,
    1,
    Math.max(1, 0.12 * contact.volumeMl),
  );
  const endVolumeMl = Math.max(
    contact.volumeMl + boundedExtensionMl,
    input.displayEndVolumeMl,
  );
  // Anchor the rendered line at the visible contact, not at a hidden-worker
  // endpoint. This preserves exact contact even when numeric slope guards
  // activate in an extreme loading state.
  const pressureAtVolume = (volumeMl: number) =>
    contact.pressureMmHg + slope * (volumeMl - contact.volumeMl);
  return withExactCurveContactV1(
    joinCurveSegmentsV1(
      sampleCurveV1(displayV0Ml, contact.volumeMl, pressureAtVolume, 44),
      sampleCurveV1(contact.volumeMl, endVolumeMl, pressureAtVolume, 20),
    ),
    contact,
  );
}

function buildProgressiveEdpvrV1(input: Readonly<{
  baselineBeatId: string;
  lowerBeatIds: ReadonlySet<string>;
  higherBeatIds: ReadonlySet<string>;
  points: readonly RelationEvidencePointV1[];
  pressureBasis: ScientificPvBoundaryGuideV1["pressureBasis"];
  displayContact: ScientificPvBoundaryGuidePointV1;
  displayExternalPressureMmHg: number;
  displayEndVolumeMl: number;
}>): readonly ScientificPvBoundaryGuidePointV1[] | null {
  const baseline = input.points.find(({ beatId }) =>
    beatId === input.baselineBeatId) ?? null;
  const lower = input.points.filter(({ beatId }) =>
    input.lowerBeatIds.has(beatId));
  const higher = input.points.filter(({ beatId }) =>
    input.higherBeatIds.has(beatId));
  if (
    baseline === null
    || lower.length < 1
    || higher.length < 1
    || input.points.length < 3
    || !(baseline.transmuralPressureMmHg > 0)
    || !(baseline.transmuralPressureMmHg < 30)
  ) return null;

  const positivePoints = input.points.filter(({ transmuralPressureMmHg }) =>
    transmuralPressureMmHg > 0);
  if (positivePoints.length < 3) return null;
  const minimumVolume = Math.min(...positivePoints.map(({ volumeMl }) =>
    volumeMl));
  const rawV0Ml = baseline.volumeMl
    * (0.6 - 0.006 * baseline.transmuralPressureMmHg);
  const v0Ml = clampV1(rawV0Ml, 0, 0.9 * minimumVolume);
  const fitBaselineSpan = baseline.volumeMl - v0Ml;
  const displaySpan = input.displayContact.volumeMl - v0Ml;
  if (
    !(fitBaselineSpan > MINIMUM_VOLUME_SPAN_ML)
    || !(displaySpan > MINIMUM_VOLUME_SPAN_ML)
  ) return null;

  const exponentCandidates = positivePoints.flatMap((point) => {
    if (point.beatId === baseline.beatId) return [];
    const normalizedVolume = (point.volumeMl - v0Ml) / fitBaselineSpan;
    const normalizedPressure = point.transmuralPressureMmHg
      / baseline.transmuralPressureMmHg;
    if (!(normalizedVolume > 0) || !(normalizedPressure > 0)) return [];
    const denominator = Math.log(normalizedVolume);
    if (Math.abs(denominator) < 1e-4) return [];
    const exponent = Math.log(normalizedPressure) / denominator;
    return Number.isFinite(exponent) && exponent > 0
      ? [Object.freeze({ beatId: point.beatId, exponent })]
      : [];
  });
  const hasLowerExponent = exponentCandidates.some(({ beatId }) =>
    input.lowerBeatIds.has(beatId));
  const hasHigherExponent = exponentCandidates.some(({ beatId }) =>
    input.higherBeatIds.has(beatId));
  if (!hasLowerExponent || !hasHigherExponent) return null;
  const rawExponent = medianV1(exponentCandidates.map(({ exponent }) =>
    exponent));
  if (rawExponent === null) return null;
  const exponent = clampV1(
    rawExponent,
    MINIMUM_EDPVR_EXPONENT,
    MAXIMUM_EDPVR_EXPONENT,
  );
  const maximumVolume = Math.max(
    input.displayContact.volumeMl,
    ...positivePoints.map(({ volumeMl }) => volumeMl),
  );
  const observedSpan = maximumVolume - minimumVolume;
  const boundedExtensionMl = clampV1(
    0.1 * Math.max(observedSpan, 1),
    1,
    Math.max(1, 0.08 * maximumVolume),
  );
  const endVolumeMl = Math.max(
    maximumVolume + boundedExtensionMl,
    input.displayEndVolumeMl,
  );
  const displayExternalPressureMmHg = input.pressureBasis === "transmural"
    ? 0
    : input.displayExternalPressureMmHg;
  const displayContactTransmuralPressure = input.pressureBasis === "transmural"
    ? input.displayContact.pressureMmHg
    : input.displayContact.pressureMmHg - displayExternalPressureMmHg;
  if (!(displayContactTransmuralPressure > 0)) return null;
  const transmuralPressureAtVolume = (volumeMl: number) =>
    displayContactTransmuralPressure * Math.pow(
      Math.max(0, (volumeMl - v0Ml) / displaySpan),
      exponent,
    );
  const displayedPressureAtVolume = (volumeMl: number) =>
    displayExternalPressureMmHg + transmuralPressureAtVolume(volumeMl);
  return withExactCurveContactV1(
    joinCurveSegmentsV1(
      sampleCurveV1(0, v0Ml, () => displayExternalPressureMmHg, 12),
      sampleCurveV1(
        v0Ml,
        input.displayContact.volumeMl,
        displayedPressureAtVolume,
        36,
      ),
      sampleCurveV1(
        input.displayContact.volumeMl,
        endVolumeMl,
        displayedPressureAtVolume,
        20,
      ),
    ),
    input.displayContact,
  );
}

function withProgressiveMetadataV1(input: Readonly<{
  input: ScientificPvProgressiveBoundaryGuideInputV1;
  generationAge: number;
  espvr: readonly ScientificPvBoundaryGuidePointV1[];
  edpvr: readonly ScientificPvBoundaryGuidePointV1[];
  endSystolicContact: ScientificPvBoundaryGuidePointV1;
  endDiastolicContact: ScientificPvBoundaryGuidePointV1;
  selectedBeatIds: readonly string[];
  lowerPointCount: number;
  higherPointCount: number;
  espvrPointCount: number;
  edpvrPointCount: number;
  espvrRefined: boolean;
  edpvrRefined: boolean;
}>): ScientificPvBoundaryGuideV1 {
  const hasRefinement = input.espvrRefined || input.edpvrRefined;
  const status = input.generationAge > 0
    ? "stale" as const
    : input.input.generationStatus;
  return Object.freeze({
    ...input.input.fallbackGuide,
    key: `${input.input.fallbackGuide.key}:progressive:${input.input.generationId}`,
    espvr: input.espvr,
    edpvr: input.edpvr,
    endSystolicContact: input.endSystolicContact,
    endDiastolicContact: input.endDiastolicContact,
    semantics: hasRefinement
      ? "progressive-model-derived-orientation-guide-not-formal-fit" as const
      : input.input.fallbackGuide.semantics,
    generationId: input.input.generationId,
    generationSequence: input.input.generationSequence ?? 0,
    generationAge: input.generationAge,
    status,
    sourceRole: input.input.sourceRole,
    opacityMultiplier: input.input.replacementPending
      ? 0.55
      : defaultOpacityMultiplierV1(input.generationAge, input.input.sourceRole),
    replacementPending: input.input.replacementPending === true,
    completedPointCount: input.selectedBeatIds.length,
    maximumPointCount:
      SCIENTIFIC_PV_PROGRESSIVE_GUIDE_MAXIMUM_POINT_COUNT_V1,
    progressiveEvidence: Object.freeze({
      selectedBeatIds: input.selectedBeatIds,
      lowerPointCount: input.lowerPointCount,
      higherPointCount: input.higherPointCount,
      espvrPointCount: input.espvrPointCount,
      edpvrPointCount: input.edpvrPointCount,
      espvrRefined: input.espvrRefined,
      edpvrRefined: input.edpvrRefined,
      pooledFormalRelationClaimed: false as const,
      extrapolationPolicy: "bounded-educational-orientation-only" as const,
    }),
  });
}

function defaultOpacityMultiplierV1(
  generationAge: number,
  sourceRole: ScientificPvProgressiveGuideSourceRoleV1,
): number {
  if (generationAge === 0) return sourceRole === "target-preview" ? 0.82 : 1;
  if (generationAge === 1) return 0.3;
  if (generationAge === 2) return 0.14;
  return Math.max(0.04, 0.1 / generationAge);
}

function sampleCurveV1(
  startVolumeMl: number,
  endVolumeMl: number,
  pressureAtVolume: (volumeMl: number) => number,
  count = GUIDE_SAMPLE_COUNT,
): readonly ScientificPvBoundaryGuidePointV1[] {
  const normalizedCount = Math.max(2, Math.round(count));
  return Object.freeze(Array.from({ length: normalizedCount }, (_, index) => {
    const fraction = index / (normalizedCount - 1);
    const volumeMl = startVolumeMl
      + fraction * (endVolumeMl - startVolumeMl);
    return Object.freeze({
      volumeMl,
      pressureMmHg: pressureAtVolume(volumeMl),
    });
  }).filter(({ volumeMl, pressureMmHg }) =>
    Number.isFinite(volumeMl) && Number.isFinite(pressureMmHg)));
}

function joinCurveSegmentsV1(
  ...segments: readonly (readonly ScientificPvBoundaryGuidePointV1[])[]
): readonly ScientificPvBoundaryGuidePointV1[] {
  const joined: ScientificPvBoundaryGuidePointV1[] = [];
  for (const segment of segments) {
    if (segment.length === 0) continue;
    joined.push(...segment.slice(joined.length === 0 ? 0 : 1));
  }
  return Object.freeze(joined);
}

function withExactCurveContactV1(
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

function medianV1(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite).sort((left, right) =>
    left - right);
  if (finite.length === 0) return null;
  const middle = Math.floor(finite.length / 2);
  return finite.length % 2 === 0
    ? (finite[middle - 1]! + finite[middle]!) / 2
    : finite[middle]!;
}

function clampV1(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
