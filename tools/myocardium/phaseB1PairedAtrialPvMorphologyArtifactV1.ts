import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  type PhaseB1NormalSinusBeTerminalTimestepObservationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ANALYSIS_MANIFEST_V1_ID =
  "phase-b1-paired-atrial-pv-morphology-analysis-manifest-v1" as const;

export const PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ARTIFACT_V1_ID =
  "phase-b1-paired-atrial-pv-morphology-artifact-v1" as const;

export const PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1 =
  Object.freeze(["off", "on"] as const);

export const PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1 =
  Object.freeze(["LA", "RA"] as const);

export type PhaseB1PairedAtrialPvMorphologyModeV1 =
  (typeof PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1)[number];

export type PhaseB1PairedAtrialPvMorphologyAtriumV1 =
  (typeof PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1)[number];

export type PhaseB1AtrialPvMorphologyClassificationV1 =
  | "present"
  | "absent"
  | "indeterminate";

export type PhaseB1PairedAtrialPvMorphologyOutcomeV1 =
  | "present-in-both"
  | "present-only-on"
  | "present-only-off"
  | "absent-in-both"
  | "indeterminate";

export type PhaseB1AtrialPvMorphologyReasonV1 =
  | "insufficient-samples"
  | "no-self-intersection"
  | "non-transverse-or-overlapping-contact"
  | "phase-separation-below-minimum"
  | "crossing-angle-below-minimum"
  | "multiple-qualified-intersections"
  | "lobe-area-below-minimum"
  | "lobe-orientations-not-opposed";

export type PhaseB1AtrialPvMorphologySampleV1 = Readonly<{
  phase01: number;
  volumeM3: number;
  cavityPressurePa: number;
}>;

export type PhaseB1AtrialPvMorphologyTerminalProjectionSampleV1 = Readonly<{
  phaseSec: number;
  bloodVolumesM3: Readonly<Record<
    PhaseB1PairedAtrialPvMorphologyAtriumV1,
    number
  >>;
  compartmentAbsolutePressurePa: Readonly<Record<
    PhaseB1PairedAtrialPvMorphologyAtriumV1,
    number
  >>;
}>;

export type PhaseB1AtrialPvMorphologySeriesByAtriumV1 = Readonly<Record<
  PhaseB1PairedAtrialPvMorphologyAtriumV1,
  readonly PhaseB1AtrialPvMorphologySampleV1[]
>>;

export type PhaseB1AtrialPvMorphologyTerminalObservationProjectionV1 =
  Readonly<{
    sourceTerminalObservationContentSha256: string;
    sourceTerminalSampleTraceContentSha256: string;
    slsMode: PhaseB1PairedAtrialPvMorphologyModeV1;
    canonicalCycleLengthSec: number;
    sourceSampleCountIncludingCycleEnd: number;
    projectedPeriodicSampleCount: number;
    duplicatedCycleEndPointDropped: true;
    phaseProjection: "sample.phaseSec/canonicalCycleLengthSec";
    volumeCoordinateSource: "sample.bloodVolumesM3[atriumId]";
    cavityPressureCoordinateSource:
      "sample.compartmentAbsolutePressurePa[atriumId]";
    pressureReferenceInterpretation:
      "shared-absolute-reference-is-gauge-translation-equivalent-for-pv-topology";
    seriesByAtrium: PhaseB1AtrialPvMorphologySeriesByAtriumV1;
  }>;

export type PhaseB1AtrialPvMorphologyCoordinateScaleV1 = Readonly<{
  volumeM3: number;
  cavityPressurePa: number;
}>;

const ANALYSIS_POLICY = deepFreeze({
  phaseDomain: "unit-periodic-[0,1)" as const,
  periodicInterpolant: "closed-piecewise-linear" as const,
  intersectionEnumeration: "all-nonadjacent-segment-pairs" as const,
  minimumSampleCount: 8 as const,
  dimensionlessCoordinateTolerance: 1e-10 as const,
  segmentEndpointParameterTolerance: 1e-9 as const,
  minimumCircularPhaseSeparation01: 0.05 as const,
  minimumCrossingAngleDeg: 10 as const,
  minimumAbsoluteDimensionlessLobeArea: 1e-3 as const,
  requiredQualifiedPrimaryIntersectionCount: 1 as const,
  requiredOpposedSignedLobes: true as const,
  morphologyOutcomeUsedAsAcceptanceGate: false as const,
  morphologyReportCompletenessIsOnlyGate: true as const,
});

const CLAIM_BOUNDARY = deepFreeze({
  mandatoryPairedMorphologyReporting: true as const,
  fullRequiredSlsAblationReportComplete: false as const,
  reservoirConduitPumpPhaseOwnershipIncluded: false as const,
  matchedVolumePressureAttributionIncluded: false as const,
  waveformAmplitudeDeltasIncluded: false as const,
  antiOverfitEvidenceOnly: true as const,
  morphologyOutcomeUsedAsAcceptanceGate: false as const,
  morphologyReportCompletenessIsOnlyGate: true as const,
  slsCausalityEstablished: false as const,
  physiologicalValidationEstablished: false as const,
  phaseB1AcceptanceEstablished: false as const,
  modelCoreOrBrowserRuntimeAdopted: false as const,
  releaseRuntimeReachable: false as const,
  testOnly: true as const,
});

export type PhaseB1PairedAtrialPvMorphologyAnalysisManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ANALYSIS_MANIFEST_V1_ID;
    modeOrder:
      typeof PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1;
    atriumOrder:
      typeof PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1;
    coordinateScaleByAtrium: Readonly<Record<
      PhaseB1PairedAtrialPvMorphologyAtriumV1,
      PhaseB1AtrialPvMorphologyCoordinateScaleV1
    >>;
    analysisPolicy: typeof ANALYSIS_POLICY;
    claimBoundary: typeof CLAIM_BOUNDARY;
    hashAlgorithm: "sha256-canonical-json-v1";
    testOnly: true;
  }>;

export type PhaseB1PairedAtrialPvMorphologyAnalysisManifestV1 =
  PhaseB1PairedAtrialPvMorphologyAnalysisManifestPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

export type PhaseB1AtrialPvMorphologyCrossingV1 = Readonly<{
  firstSegmentIndex: number;
  secondSegmentIndex: number;
  firstPhase01: number;
  secondPhase01: number;
  circularPhaseSeparation01: number;
  dimensionlessVolume: number;
  dimensionlessPressure: number;
  crossingAngleDeg: number;
}>;

export type PhaseB1AtrialPvMorphologyResultV1 = Readonly<{
  atriumId: PhaseB1PairedAtrialPvMorphologyAtriumV1;
  classification: PhaseB1AtrialPvMorphologyClassificationV1;
  sampleCount: number;
  nonAdjacentSegmentPairCount: number;
  rawPointIntersectionCount: number;
  qualifiedIntersectionCount: number;
  ambiguousContactCount: number;
  primaryCrossing: PhaseB1AtrialPvMorphologyCrossingV1 | null;
  signedDimensionlessLobeAreas: readonly [number, number] | null;
  opposedSignedLobes: boolean | null;
  reasons: readonly PhaseB1AtrialPvMorphologyReasonV1[];
  morphologyOutcomeUsedAsAcceptanceGate: false;
  analysisCompleted: true;
}>;

export type PhaseB1PairedAtrialPvMorphologySeriesByModeV1 = Readonly<Record<
  PhaseB1PairedAtrialPvMorphologyModeV1,
  Readonly<Record<
    PhaseB1PairedAtrialPvMorphologyAtriumV1,
    readonly PhaseB1AtrialPvMorphologySampleV1[]
  >>
>>;

export type PhaseB1PairedAtrialPvMorphologyArtifactPayloadV1 = Readonly<{
  artifactId: typeof PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ARTIFACT_V1_ID;
  status: "paired-morphology-report-complete-anti-overfit-evidence-only";
  analysisManifestContentSha256: string;
  modeOrder: typeof PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1;
  atriumOrder: typeof PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1;
  morphologyByMode: Readonly<Record<
    PhaseB1PairedAtrialPvMorphologyModeV1,
    Readonly<Record<
      PhaseB1PairedAtrialPvMorphologyAtriumV1,
      PhaseB1AtrialPvMorphologyResultV1
    >>
  >>;
  pairedOutcomeByAtrium: Readonly<Record<
    PhaseB1PairedAtrialPvMorphologyAtriumV1,
    PhaseB1PairedAtrialPvMorphologyOutcomeV1
  >>;
  reportCompleteness: Readonly<{
    scope: "pv-morphology-only";
    bothModesReported: true;
    bothAtriaReportedInEachMode: true;
    allFourAnalysesCompleted: true;
    analysisManifestAuthenticated: true;
    morphologyOutcomeUsedAsAcceptanceGate: false;
    reservoirConduitPumpPhaseOwnershipIncluded: false;
    matchedVolumePressureAttributionIncluded: false;
    waveformAmplitudeDeltasIncluded: false;
    fullRequiredSlsAblationReportComplete: false;
  }>;
  morphologyReportCompletenessGatePass: true;
  slsCausalityEstablished: false;
  physiologicalValidationPass: false;
  phaseB1AcceptancePass: false;
  claimBoundary: typeof CLAIM_BOUNDARY;
  hashAlgorithm: "sha256-canonical-json-v1";
  testOnly: true;
}>;

export type PhaseB1PairedAtrialPvMorphologyArtifactV1 =
  PhaseB1PairedAtrialPvMorphologyArtifactPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

/**
 * Projects one closed terminal-cycle sample trace to the half-open periodic
 * series consumed by the generic morphology classifier. The observation trace
 * contains both phase zero and the cycle-end endpoint. The generic classifier
 * closes its polyline itself, so the final endpoint is removed exactly once.
 *
 * Pressure is the chamber's closed-loop absolute-pressure coordinate. All
 * paired modes share the same pressure reference, so a gauge conversion would
 * only translate the PV trace and cannot change its intersection topology.
 */
export function projectPhaseB1AtrialPvMorphologySeriesFromTerminalSamplesV1(
  input: Readonly<{
    samples: readonly PhaseB1AtrialPvMorphologyTerminalProjectionSampleV1[];
    canonicalCycleLengthSec: number;
  }>,
): PhaseB1AtrialPvMorphologySeriesByAtriumV1 {
  assertExactPlainRecordV1(input, [
    "samples",
    "canonicalCycleLengthSec",
  ], "atrial PV terminal-sample projection input");
  assertDensePlainArrayV1(
    input.samples,
    undefined,
    "atrial PV terminal-sample projection samples",
  );
  const cycleLengthSec = requirePositiveFinite(
    input.canonicalCycleLengthSec,
    "atrial PV terminal-sample projection canonicalCycleLengthSec",
  );
  if (input.samples.length < 2) {
    throw new Error(
      "atrial PV terminal-sample projection requires cycle-start and cycle-end samples",
    );
  }
  input.samples.forEach((sample, index) => {
    const phaseSec = requireFinite(
      sample.phaseSec,
      `atrial PV terminal-sample projection samples[${index}].phaseSec`,
    );
    if (index === 0 && !Object.is(phaseSec, 0)) {
      throw new Error(
        "atrial PV terminal-sample projection must start at phase zero",
      );
    }
    if (
      index > 0
      && !(phaseSec > input.samples[index - 1].phaseSec)
    ) {
      throw new Error(
        "atrial PV terminal-sample projection phases must strictly increase",
      );
    }
    if (index < input.samples.length - 1 && !(phaseSec < cycleLengthSec)) {
      throw new Error(
        "atrial PV terminal-sample projection interior phases must precede cycle end",
      );
    }
  });
  if (!Object.is(
    input.samples[input.samples.length - 1].phaseSec,
    cycleLengthSec,
  )) {
    throw new Error(
      "atrial PV terminal-sample projection final sample must be the exact cycle-end endpoint",
    );
  }
  const halfOpenSamples = input.samples.slice(0, -1);
  return mapAtriumRecord((atriumId) => Object.freeze(
    halfOpenSamples.map((sample, index) => deepFreeze({
      phase01: requireFinite(
        sample.phaseSec / cycleLengthSec,
        `atrial PV terminal-sample projection samples[${index}].phase01`,
      ),
      volumeM3: requireFinite(
        sample.bloodVolumesM3[atriumId],
        `atrial PV terminal-sample projection samples[${index}].bloodVolumesM3.${atriumId}`,
      ),
      cavityPressurePa: requireFinite(
        sample.compartmentAbsolutePressurePa[atriumId],
        `atrial PV terminal-sample projection samples[${index}].compartmentAbsolutePressurePa.${atriumId}`,
      ),
    })),
  ));
}

/**
 * Authenticates the builder-issued in-process terminal observation before
 * exposing its compact morphology projection. Serialized observations cannot
 * be used to manufacture this projection because builder authentication is a
 * process-local WeakSet/WeakMap boundary.
 */
export function buildPhaseB1AtrialPvMorphologyProjectionFromTerminalObservationV1(
  input: Readonly<{
    terminalObservation: PhaseB1NormalSinusBeTerminalTimestepObservationV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1AtrialPvMorphologyTerminalObservationProjectionV1 {
  assertExactPlainRecordV1(input, [
    "terminalObservation",
    "sha256Hex",
  ], "atrial PV terminal-observation projection input");
  requireSha256Provider(input.sha256Hex);
  const observation =
    assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
      input.terminalObservation,
      input.sha256Hex,
    );
  const trace = observation.sampleTrace;
  if (
    observation.sampleSetAudit.cycleStartAndEndSamplePresent !== true
    || !Object.is(
      trace.canonicalCycleLengthSec,
      observation.canonicalCycleLengthSec,
    )
    || trace.samples.length
      !== observation.sampleSetAudit.selectedExtremaSampleCount
  ) {
    throw new Error(
      "atrial PV terminal-observation projection requires its authenticated complete terminal sample trace",
    );
  }
  const seriesByAtrium =
    projectPhaseB1AtrialPvMorphologySeriesFromTerminalSamplesV1({
      samples: trace.samples,
      canonicalCycleLengthSec: observation.canonicalCycleLengthSec,
    });
  return deepFreeze({
    sourceTerminalObservationContentSha256: observation.contentSha256,
    sourceTerminalSampleTraceContentSha256: trace.contentSha256,
    slsMode: observation.slsMode,
    canonicalCycleLengthSec: observation.canonicalCycleLengthSec,
    sourceSampleCountIncludingCycleEnd: trace.samples.length,
    projectedPeriodicSampleCount: trace.samples.length - 1,
    duplicatedCycleEndPointDropped: true as const,
    phaseProjection:
      "sample.phaseSec/canonicalCycleLengthSec" as const,
    volumeCoordinateSource: "sample.bloodVolumesM3[atriumId]" as const,
    cavityPressureCoordinateSource:
      "sample.compartmentAbsolutePressurePa[atriumId]" as const,
    pressureReferenceInterpretation:
      "shared-absolute-reference-is-gauge-translation-equivalent-for-pv-topology" as const,
    seriesByAtrium,
  });
}

type Point = Readonly<{ x: number; y: number }>;

type SegmentPointIntersection = Readonly<{
  kind: "point";
  firstParameter: number;
  secondParameter: number;
  point: Point;
  crossingAngleDeg: number;
}>;

type SegmentIntersection =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "ambiguous" }>
  | SegmentPointIntersection;

type QualifiedIntersection = Readonly<{
  firstSegmentIndex: number;
  secondSegmentIndex: number;
  firstParameter: number;
  secondParameter: number;
  firstPhase01: number;
  secondPhase01: number;
  circularPhaseSeparation01: number;
  point: Point;
  crossingAngleDeg: number;
}>;

export function buildPhaseB1PairedAtrialPvMorphologyAnalysisManifestV1(
  input: Readonly<{
    coordinateScaleByAtrium: Readonly<Record<
      PhaseB1PairedAtrialPvMorphologyAtriumV1,
      PhaseB1AtrialPvMorphologyCoordinateScaleV1
    >>;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1PairedAtrialPvMorphologyAnalysisManifestV1 {
  assertExactPlainRecordV1(input, [
    "coordinateScaleByAtrium",
    "sha256Hex",
  ], "paired atrial PV morphology manifest input");
  requireSha256Provider(input.sha256Hex);
  const coordinateScaleByAtrium = validateAndCopyScaleRecord(
    input.coordinateScaleByAtrium,
  );
  const payload = deepFreeze<
    PhaseB1PairedAtrialPvMorphologyAnalysisManifestPayloadV1
  >({
    manifestId:
      PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ANALYSIS_MANIFEST_V1_ID,
    modeOrder: PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1,
    atriumOrder: PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1,
    coordinateScaleByAtrium,
    analysisPolicy: ANALYSIS_POLICY,
    claimBoundary: CLAIM_BOUNDARY,
    hashAlgorithm: "sha256-canonical-json-v1",
    testOnly: true,
  });
  return deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
}

export function validatePhaseB1PairedAtrialPvMorphologyAnalysisManifestV1(
  value: PhaseB1PairedAtrialPvMorphologyAnalysisManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1PairedAtrialPvMorphologyAnalysisManifestV1 {
  requireSha256Provider(sha256Hex);
  if (
    value === null
    || typeof value !== "object"
    || value.manifestId
      !== PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ANALYSIS_MANIFEST_V1_ID
    || value.modeOrder.join(",") !== "off,on"
    || value.atriumOrder.join(",") !== "LA,RA"
    || value.analysisPolicy.morphologyOutcomeUsedAsAcceptanceGate !== false
    || value.analysisPolicy.morphologyReportCompletenessIsOnlyGate !== true
  ) throw new Error("paired atrial PV morphology manifest identity or policy drifted");
  validateAndCopyScaleRecord(value.coordinateScaleByAtrium);
  const { contentSha256, ...payload } = value;
  assertCanonicalSha256(payload, contentSha256, sha256Hex);
  return value;
}

export function classifyPhaseB1AtrialPvMorphologyV1(
  input: Readonly<{
    atriumId: PhaseB1PairedAtrialPvMorphologyAtriumV1;
    samples: readonly PhaseB1AtrialPvMorphologySampleV1[];
    analysisManifest: PhaseB1PairedAtrialPvMorphologyAnalysisManifestV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1AtrialPvMorphologyResultV1 {
  assertExactPlainRecordV1(input, [
    "atriumId",
    "samples",
    "analysisManifest",
    "sha256Hex",
  ], "atrial PV morphology classification input");
  const manifest = validatePhaseB1PairedAtrialPvMorphologyAnalysisManifestV1(
    input.analysisManifest,
    input.sha256Hex,
  );
  const atriumId = requireAtriumId(input.atriumId);
  const samples = validateAndCopySamples(input.samples);
  const policy = manifest.analysisPolicy;
  if (samples.length < policy.minimumSampleCount) {
    return deepFreeze({
      atriumId,
      classification: "indeterminate" as const,
      sampleCount: samples.length,
      nonAdjacentSegmentPairCount: 0,
      rawPointIntersectionCount: 0,
      qualifiedIntersectionCount: 0,
      ambiguousContactCount: 0,
      primaryCrossing: null,
      signedDimensionlessLobeAreas: null,
      opposedSignedLobes: null,
      reasons: ["insufficient-samples" as const],
      morphologyOutcomeUsedAsAcceptanceGate: false as const,
      analysisCompleted: true as const,
    });
  }

  const scale = manifest.coordinateScaleByAtrium[atriumId];
  const points = samples.map((sample) => deepFreeze({
    x: sample.volumeM3 / scale.volumeM3,
    y: sample.cavityPressurePa / scale.cavityPressurePa,
  }));
  const qualified: QualifiedIntersection[] = [];
  const reasons = new Set<PhaseB1AtrialPvMorphologyReasonV1>();
  let nonAdjacentSegmentPairCount = 0;
  let rawPointIntersectionCount = 0;
  let ambiguousContactCount = 0;

  for (let first = 0; first < points.length; first += 1) {
    for (let second = first + 1; second < points.length; second += 1) {
      if (segmentsAreAdjacent(first, second, points.length)) continue;
      nonAdjacentSegmentPairCount += 1;
      const intersection = intersectSegments(
        points[first],
        points[(first + 1) % points.length],
        points[second],
        points[(second + 1) % points.length],
        policy.dimensionlessCoordinateTolerance,
        policy.segmentEndpointParameterTolerance,
      );
      if (intersection.kind === "none") continue;
      if (intersection.kind === "ambiguous") {
        ambiguousContactCount += 1;
        reasons.add("non-transverse-or-overlapping-contact");
        continue;
      }
      rawPointIntersectionCount += 1;
      const firstPhase01 = phaseAtSegment(
        samples,
        first,
        intersection.firstParameter,
      );
      const secondPhase01 = phaseAtSegment(
        samples,
        second,
        intersection.secondParameter,
      );
      const phaseSeparation = circularDistance01(firstPhase01, secondPhase01);
      if (phaseSeparation < policy.minimumCircularPhaseSeparation01) {
        reasons.add("phase-separation-below-minimum");
        continue;
      }
      if (intersection.crossingAngleDeg < policy.minimumCrossingAngleDeg) {
        reasons.add("crossing-angle-below-minimum");
        continue;
      }
      qualified.push(deepFreeze({
        firstSegmentIndex: first,
        secondSegmentIndex: second,
        firstParameter: intersection.firstParameter,
        secondParameter: intersection.secondParameter,
        firstPhase01,
        secondPhase01,
        circularPhaseSeparation01: phaseSeparation,
        point: intersection.point,
        crossingAngleDeg: intersection.crossingAngleDeg,
      }));
    }
  }

  if (qualified.length === 0) {
    if (rawPointIntersectionCount === 0 && ambiguousContactCount === 0) {
      reasons.add("no-self-intersection");
      return morphologyResult({
        atriumId,
        classification: "absent",
        sampleCount: samples.length,
        nonAdjacentSegmentPairCount,
        rawPointIntersectionCount,
        qualifiedIntersectionCount: 0,
        ambiguousContactCount,
        primaryCrossing: null,
        signedDimensionlessLobeAreas: null,
        opposedSignedLobes: null,
        reasons,
      });
    }
    return morphologyResult({
      atriumId,
      classification: "indeterminate",
      sampleCount: samples.length,
      nonAdjacentSegmentPairCount,
      rawPointIntersectionCount,
      qualifiedIntersectionCount: 0,
      ambiguousContactCount,
      primaryCrossing: null,
      signedDimensionlessLobeAreas: null,
      opposedSignedLobes: null,
      reasons,
    });
  }

  if (
    qualified.length
      !== policy.requiredQualifiedPrimaryIntersectionCount
    || ambiguousContactCount !== 0
  ) {
    if (qualified.length > 1) reasons.add("multiple-qualified-intersections");
    return morphologyResult({
      atriumId,
      classification: "indeterminate",
      sampleCount: samples.length,
      nonAdjacentSegmentPairCount,
      rawPointIntersectionCount,
      qualifiedIntersectionCount: qualified.length,
      ambiguousContactCount,
      primaryCrossing: qualified.length === 1
        ? crossingForReport(qualified[0])
        : null,
      signedDimensionlessLobeAreas: null,
      opposedSignedLobes: null,
      reasons,
    });
  }

  const primary = qualified[0];
  const lobeAreas = signedLobeAreas(points, primary);
  const opposedSignedLobes = lobeAreas[0] * lobeAreas[1] < 0;
  const bothAreasLargeEnough = lobeAreas.every((area) =>
    Math.abs(area) >= policy.minimumAbsoluteDimensionlessLobeArea);
  if (!bothAreasLargeEnough) reasons.add("lobe-area-below-minimum");
  if (!opposedSignedLobes) reasons.add("lobe-orientations-not-opposed");
  return morphologyResult({
    atriumId,
    classification: bothAreasLargeEnough && opposedSignedLobes
      ? "present"
      : "indeterminate",
    sampleCount: samples.length,
    nonAdjacentSegmentPairCount,
    rawPointIntersectionCount,
    qualifiedIntersectionCount: qualified.length,
    ambiguousContactCount,
    primaryCrossing: crossingForReport(primary),
    signedDimensionlessLobeAreas: lobeAreas,
    opposedSignedLobes,
    reasons,
  });
}

export function classifyPhaseB1PairedAtrialPvMorphologyOutcomeV1(
  off: PhaseB1AtrialPvMorphologyClassificationV1,
  on: PhaseB1AtrialPvMorphologyClassificationV1,
): PhaseB1PairedAtrialPvMorphologyOutcomeV1 {
  if (off === "indeterminate" || on === "indeterminate") {
    return "indeterminate";
  }
  if (off === "present" && on === "present") return "present-in-both";
  if (off === "absent" && on === "present") return "present-only-on";
  if (off === "present" && on === "absent") return "present-only-off";
  return "absent-in-both";
}

export function buildPhaseB1PairedAtrialPvMorphologyArtifactV1(
  input: Readonly<{
    analysisManifest: PhaseB1PairedAtrialPvMorphologyAnalysisManifestV1;
    seriesByMode: PhaseB1PairedAtrialPvMorphologySeriesByModeV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1PairedAtrialPvMorphologyArtifactV1 {
  assertExactPlainRecordV1(input, [
    "analysisManifest",
    "seriesByMode",
    "sha256Hex",
  ], "paired atrial PV morphology artifact input");
  const manifest = validatePhaseB1PairedAtrialPvMorphologyAnalysisManifestV1(
    input.analysisManifest,
    input.sha256Hex,
  );
  validateSeriesRecord(input.seriesByMode);
  const morphologyByMode = mapModeRecord((mode) => mapAtriumRecord((atriumId) =>
    classifyPhaseB1AtrialPvMorphologyV1({
      atriumId,
      samples: input.seriesByMode[mode][atriumId],
      analysisManifest: manifest,
      sha256Hex: input.sha256Hex,
    })));
  const pairedOutcomeByAtrium = mapAtriumRecord((atriumId) =>
    classifyPhaseB1PairedAtrialPvMorphologyOutcomeV1(
      morphologyByMode.off[atriumId].classification,
      morphologyByMode.on[atriumId].classification,
    ));
  const payload = deepFreeze<PhaseB1PairedAtrialPvMorphologyArtifactPayloadV1>({
    artifactId: PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ARTIFACT_V1_ID,
    status: "paired-morphology-report-complete-anti-overfit-evidence-only",
    analysisManifestContentSha256: manifest.contentSha256,
    modeOrder: PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1,
    atriumOrder: PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1,
    morphologyByMode,
    pairedOutcomeByAtrium,
    reportCompleteness: {
      scope: "pv-morphology-only",
      bothModesReported: true,
      bothAtriaReportedInEachMode: true,
      allFourAnalysesCompleted: true,
      analysisManifestAuthenticated: true,
      morphologyOutcomeUsedAsAcceptanceGate: false,
      reservoirConduitPumpPhaseOwnershipIncluded: false,
      matchedVolumePressureAttributionIncluded: false,
      waveformAmplitudeDeltasIncluded: false,
      fullRequiredSlsAblationReportComplete: false,
    },
    morphologyReportCompletenessGatePass: true,
    slsCausalityEstablished: false,
    physiologicalValidationPass: false,
    phaseB1AcceptancePass: false,
    claimBoundary: CLAIM_BOUNDARY,
    hashAlgorithm: "sha256-canonical-json-v1",
    testOnly: true,
  });
  return deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
}

export function phaseB1PairedAtrialPvMorphologyArtifactHashPayloadV1(
  artifact: PhaseB1PairedAtrialPvMorphologyArtifactV1,
): PhaseB1PairedAtrialPvMorphologyArtifactPayloadV1 {
  const { contentSha256: _contentSha256, ...payload } = artifact;
  return payload;
}

export function serializePhaseB1PairedAtrialPvMorphologyArtifactV1(
  artifact: PhaseB1PairedAtrialPvMorphologyArtifactV1,
  sha256Hex: CanonicalSha256HexProvider,
): string {
  if (artifact.artifactId !== PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ARTIFACT_V1_ID) {
    throw new Error("paired atrial PV morphology artifact identity drifted");
  }
  assertCanonicalSha256(
    phaseB1PairedAtrialPvMorphologyArtifactHashPayloadV1(artifact),
    artifact.contentSha256,
    sha256Hex,
  );
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

function morphologyResult(input: Readonly<{
  atriumId: PhaseB1PairedAtrialPvMorphologyAtriumV1;
  classification: PhaseB1AtrialPvMorphologyClassificationV1;
  sampleCount: number;
  nonAdjacentSegmentPairCount: number;
  rawPointIntersectionCount: number;
  qualifiedIntersectionCount: number;
  ambiguousContactCount: number;
  primaryCrossing: PhaseB1AtrialPvMorphologyCrossingV1 | null;
  signedDimensionlessLobeAreas: readonly [number, number] | null;
  opposedSignedLobes: boolean | null;
  reasons: ReadonlySet<PhaseB1AtrialPvMorphologyReasonV1>;
}>): PhaseB1AtrialPvMorphologyResultV1 {
  return deepFreeze({
    atriumId: input.atriumId,
    classification: input.classification,
    sampleCount: input.sampleCount,
    nonAdjacentSegmentPairCount: input.nonAdjacentSegmentPairCount,
    rawPointIntersectionCount: input.rawPointIntersectionCount,
    qualifiedIntersectionCount: input.qualifiedIntersectionCount,
    ambiguousContactCount: input.ambiguousContactCount,
    primaryCrossing: input.primaryCrossing,
    signedDimensionlessLobeAreas: input.signedDimensionlessLobeAreas,
    opposedSignedLobes: input.opposedSignedLobes,
    reasons: [...input.reasons].sort(),
    morphologyOutcomeUsedAsAcceptanceGate: false as const,
    analysisCompleted: true as const,
  });
}

function crossingForReport(
  value: QualifiedIntersection,
): PhaseB1AtrialPvMorphologyCrossingV1 {
  return deepFreeze({
    firstSegmentIndex: value.firstSegmentIndex,
    secondSegmentIndex: value.secondSegmentIndex,
    firstPhase01: value.firstPhase01,
    secondPhase01: value.secondPhase01,
    circularPhaseSeparation01: value.circularPhaseSeparation01,
    dimensionlessVolume: value.point.x,
    dimensionlessPressure: value.point.y,
    crossingAngleDeg: value.crossingAngleDeg,
  });
}

function validateAndCopyScaleRecord(
  value: unknown,
): Readonly<Record<
  PhaseB1PairedAtrialPvMorphologyAtriumV1,
  PhaseB1AtrialPvMorphologyCoordinateScaleV1
>> {
  assertExactPlainRecordV1(
    value,
    PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1,
    "coordinateScaleByAtrium",
  );
  return mapAtriumRecord((atriumId) => {
    const scale = value[atriumId];
    assertExactPlainRecordV1(
      scale,
      ["volumeM3", "cavityPressurePa"],
      `coordinateScaleByAtrium.${atriumId}`,
    );
    return deepFreeze({
      volumeM3: requirePositiveFinite(
        scale.volumeM3,
        `coordinateScaleByAtrium.${atriumId}.volumeM3`,
      ),
      cavityPressurePa: requirePositiveFinite(
        scale.cavityPressurePa,
        `coordinateScaleByAtrium.${atriumId}.cavityPressurePa`,
      ),
    });
  });
}

function validateSeriesRecord(value: unknown): asserts value is
  PhaseB1PairedAtrialPvMorphologySeriesByModeV1 {
  assertExactPlainRecordV1(
    value,
    PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1,
    "seriesByMode",
  );
  for (const mode of PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1) {
    assertExactPlainRecordV1(
      value[mode],
      PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1,
      `seriesByMode.${mode}`,
    );
    for (const atriumId of PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1) {
      validateAndCopySamples(value[mode][atriumId]);
    }
  }
}

function validateAndCopySamples(
  value: unknown,
): readonly PhaseB1AtrialPvMorphologySampleV1[] {
  assertDensePlainArrayV1(value, undefined, "atrial PV morphology samples");
  let previousPhase = -1;
  return Object.freeze(value.map((entry, index) => {
    assertExactPlainRecordV1(
      entry,
      ["phase01", "volumeM3", "cavityPressurePa"],
      `atrial PV morphology samples[${index}]`,
    );
    const phase01 = requireFinite(
      entry.phase01,
      `atrial PV morphology samples[${index}].phase01`,
    );
    if (phase01 < 0 || phase01 >= 1 || phase01 <= previousPhase) {
      throw new Error(
        "atrial PV morphology sample phases must be strictly increasing in [0,1)",
      );
    }
    previousPhase = phase01;
    return deepFreeze({
      phase01,
      volumeM3: requireFinite(
        entry.volumeM3,
        `atrial PV morphology samples[${index}].volumeM3`,
      ),
      cavityPressurePa: requireFinite(
        entry.cavityPressurePa,
        `atrial PV morphology samples[${index}].cavityPressurePa`,
      ),
    });
  }));
}

function segmentsAreAdjacent(first: number, second: number, count: number): boolean {
  return second === first + 1 || (first === 0 && second === count - 1);
}

function intersectSegments(
  firstStart: Point,
  firstEnd: Point,
  secondStart: Point,
  secondEnd: Point,
  coordinateTolerance: number,
  endpointTolerance: number,
): SegmentIntersection {
  const firstDirection = subtract(firstEnd, firstStart);
  const secondDirection = subtract(secondEnd, secondStart);
  const firstLength = norm(firstDirection);
  const secondLength = norm(secondDirection);
  if (firstLength <= coordinateTolerance || secondLength <= coordinateTolerance) {
    return boundingBoxesOverlap(
      firstStart,
      firstEnd,
      secondStart,
      secondEnd,
      coordinateTolerance,
    ) ? { kind: "ambiguous" } : { kind: "none" };
  }
  const denominator = cross(firstDirection, secondDirection);
  const denominatorScale = firstLength * secondLength;
  const startDifference = subtract(secondStart, firstStart);
  if (Math.abs(denominator) <= coordinateTolerance * denominatorScale) {
    const collinear = Math.abs(cross(startDifference, firstDirection))
      <= coordinateTolerance * firstLength;
    return collinear && boundingBoxesOverlap(
      firstStart,
      firstEnd,
      secondStart,
      secondEnd,
      coordinateTolerance,
    ) ? { kind: "ambiguous" } : { kind: "none" };
  }
  const firstParameter = cross(startDifference, secondDirection) / denominator;
  const secondParameter = cross(startDifference, firstDirection) / denominator;
  if (
    firstParameter < -endpointTolerance
    || firstParameter > 1 + endpointTolerance
    || secondParameter < -endpointTolerance
    || secondParameter > 1 + endpointTolerance
  ) return { kind: "none" };
  if (
    firstParameter <= endpointTolerance
    || firstParameter >= 1 - endpointTolerance
    || secondParameter <= endpointTolerance
    || secondParameter >= 1 - endpointTolerance
  ) return { kind: "ambiguous" };
  const sine = Math.min(1, Math.abs(denominator) / denominatorScale);
  return deepFreeze({
    kind: "point" as const,
    firstParameter,
    secondParameter,
    point: {
      x: firstStart.x + firstParameter * firstDirection.x,
      y: firstStart.y + firstParameter * firstDirection.y,
    },
    crossingAngleDeg: Math.asin(sine) * 180 / Math.PI,
  });
}

function signedLobeAreas(
  points: readonly Point[],
  crossing: QualifiedIntersection,
): readonly [number, number] {
  const firstPath: Point[] = [crossing.point];
  for (
    let index = crossing.firstSegmentIndex + 1;
    index <= crossing.secondSegmentIndex;
    index += 1
  ) firstPath.push(points[index]);
  firstPath.push(crossing.point);

  const secondPath: Point[] = [crossing.point];
  for (
    let index = crossing.secondSegmentIndex + 1;
    index < points.length;
    index += 1
  ) secondPath.push(points[index]);
  for (
    let index = 0;
    index <= crossing.firstSegmentIndex;
    index += 1
  ) secondPath.push(points[index]);
  secondPath.push(crossing.point);
  return Object.freeze([
    signedPolygonArea(firstPath),
    signedPolygonArea(secondPath),
  ] as const);
}

function signedPolygonArea(points: readonly Point[]): number {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    twiceArea += points[index].x * next.y - next.x * points[index].y;
  }
  return 0.5 * twiceArea;
}

function phaseAtSegment(
  samples: readonly PhaseB1AtrialPvMorphologySampleV1[],
  segmentIndex: number,
  parameter: number,
): number {
  const start = samples[segmentIndex].phase01;
  const end = segmentIndex === samples.length - 1
    ? samples[0].phase01 + 1
    : samples[segmentIndex + 1].phase01;
  return moduloOne(start + parameter * (end - start));
}

function circularDistance01(first: number, second: number): number {
  const distance = Math.abs(first - second);
  return Math.min(distance, 1 - distance);
}

function moduloOne(value: number): number {
  const result = value % 1;
  return result < 0 ? result + 1 : result;
}

function boundingBoxesOverlap(
  firstStart: Point,
  firstEnd: Point,
  secondStart: Point,
  secondEnd: Point,
  tolerance: number,
): boolean {
  return Math.max(Math.min(firstStart.x, firstEnd.x),
    Math.min(secondStart.x, secondEnd.x))
      <= Math.min(Math.max(firstStart.x, firstEnd.x),
        Math.max(secondStart.x, secondEnd.x)) + tolerance
    && Math.max(Math.min(firstStart.y, firstEnd.y),
      Math.min(secondStart.y, secondEnd.y))
      <= Math.min(Math.max(firstStart.y, firstEnd.y),
        Math.max(secondStart.y, secondEnd.y)) + tolerance;
}

function subtract(left: Point, right: Point): Point {
  return { x: left.x - right.x, y: left.y - right.y };
}

function cross(left: Point, right: Point): number {
  return left.x * right.y - left.y * right.x;
}

function norm(value: Point): number {
  return Math.hypot(value.x, value.y);
}

function mapModeRecord<Value>(
  build: (mode: PhaseB1PairedAtrialPvMorphologyModeV1) => Value,
): Readonly<Record<PhaseB1PairedAtrialPvMorphologyModeV1, Value>> {
  return deepFreeze(Object.fromEntries(
    PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_MODE_ORDER_V1.map((mode) => [
      mode,
      build(mode),
    ]),
  ) as Record<PhaseB1PairedAtrialPvMorphologyModeV1, Value>);
}

function mapAtriumRecord<Value>(
  build: (atriumId: PhaseB1PairedAtrialPvMorphologyAtriumV1) => Value,
): Readonly<Record<PhaseB1PairedAtrialPvMorphologyAtriumV1, Value>> {
  return deepFreeze(Object.fromEntries(
    PHASE_B1_PAIRED_ATRIAL_PV_MORPHOLOGY_ATRIUM_ORDER_V1.map((atriumId) => [
      atriumId,
      build(atriumId),
    ]),
  ) as Record<PhaseB1PairedAtrialPvMorphologyAtriumV1, Value>);
}

function requireAtriumId(
  value: unknown,
): PhaseB1PairedAtrialPvMorphologyAtriumV1 {
  if (value !== "LA" && value !== "RA") {
    throw new Error("atrial PV morphology atriumId must be exactly LA or RA");
  }
  return value;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const number = requireFinite(value, field);
  if (!(number > 0)) throw new Error(`${field} must be positive`);
  return number;
}

function requireSha256Provider(
  value: unknown,
): asserts value is CanonicalSha256HexProvider {
  if (typeof value !== "function") {
    throw new Error("paired atrial PV morphology requires a SHA-256 provider");
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
