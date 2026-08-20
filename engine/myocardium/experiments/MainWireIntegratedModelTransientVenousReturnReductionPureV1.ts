import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_COMPARISON_ENGINEERING_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_BEAT_PHASES_V1,
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1,
  type MainWireIntegratedModelTransientVenousReturnReductionBeatPhaseV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionDefinitionV1";

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_BEAT_PROJECTION_V1_ID =
  "main-wire-integrated-model-transient-pv-beat-projection-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_AUDITOR_V1_ID =
  "main-wire-integrated-model-transient-pv-relation-auditor-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RAW_PROJECTION_AUDITOR_V1_ID =
  "main-wire-integrated-model-transient-pv-raw-projection-auditor-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_VENTRICLE_IDS_V1 =
  Object.freeze(["LV", "RV"] as const);

export type MainWireIntegratedModelTransientPvVentricleIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_VENTRICLE_IDS_V1)[number];

export type MainWireIntegratedModelTransientPvDirectionIdV1 =
  "occlusion" | "release";

export type MainWireIntegratedModelTransientPvPointV1 = Readonly<{
  volumeMl: number;
  transmuralPressureMmHg: number;
}>;

export type MainWireIntegratedModelTransientPvAcceptedVentricleSampleV1 =
  MainWireIntegratedModelTransientPvPointV1 &
    Readonly<{
      absolutePressureMmHg: number;
      semilunarFlowMlPerSec: number;
    }>;

export type MainWireIntegratedModelTransientPvAcceptedSampleV1 = Readonly<{
  timeSec: number;
  LV: MainWireIntegratedModelTransientPvAcceptedVentricleSampleV1;
  RV: MainWireIntegratedModelTransientPvAcceptedVentricleSampleV1;
}>;

export type MainWireIntegratedModelTransientPvRawBeatV1 = Readonly<{
  beatOrdinal: number;
  startTimeSec: number;
  endTimeSec: number;
  samples: readonly MainWireIntegratedModelTransientPvAcceptedSampleV1[];
}>;

export type MainWireIntegratedModelTransientPvCompactLoopPointV1 =
  MainWireIntegratedModelTransientPvPointV1 &
    Readonly<{
      phase01: number;
    }>;

export type MainWireIntegratedModelTransientPvLandmarkV1 =
  MainWireIntegratedModelTransientPvPointV1 &
    Readonly<{
      timeSec: number;
      phase01: number;
      source:
        | "baseline-frozen-isochronal"
        | "semilunar-zero-flow-crossing"
        | "earliest-raw-minimum-volume";
    }>;

export type MainWireIntegratedModelTransientPvRawEndpointSummaryV1 = Readonly<{
  rawAcceptedSampleCount: number;
  rawAcceptedSamplesSha256: string;
  maximumPositiveSemilunarFlowMlPerSec: number;
  maximumPressureSampleIndex: number;
  minimumVolumeSampleIndex: number;
  closureBracketSampleIndices: readonly [number, number];
}>;

export type MainWireIntegratedModelTransientPvVentricleBeatProjectionV1 =
  Readonly<{
    ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1;
    rawEndpointSummary: MainWireIntegratedModelTransientPvRawEndpointSummaryV1;
    compactLoop: readonly MainWireIntegratedModelTransientPvCompactLoopPointV1[];
    compactLoopSha256: string;
    landmarks: Readonly<{
      baselineAnchoredIsochronal: MainWireIntegratedModelTransientPvLandmarkV1;
      semilunarClosure: MainWireIntegratedModelTransientPvLandmarkV1;
      minimumVolume: MainWireIntegratedModelTransientPvLandmarkV1;
    }>;
  }>;

export type MainWireIntegratedModelTransientPvBeatProjectionV1 = Readonly<{
  projectionId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_BEAT_PROJECTION_V1_ID;
  beatOrdinal: number;
  phase: MainWireIntegratedModelTransientVenousReturnReductionBeatPhaseV1;
  startTimeSec: number;
  endTimeSec: number;
  resistanceScale: Readonly<{
    start: number;
    midpoint: number;
    end: number;
  }>;
  LV: MainWireIntegratedModelTransientPvVentricleBeatProjectionV1;
  RV: MainWireIntegratedModelTransientPvVentricleBeatProjectionV1;
  payloadSha256: string;
}>;

export type MainWireIntegratedModelTransientPvLinearRelationV1 = Readonly<{
  methodId:
    "baseline-anchored-isochronal" | "semilunar-closure" | "minimum-volume";
  directionId: MainWireIntegratedModelTransientPvDirectionIdV1;
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1;
  pointCount: number;
  points: readonly (MainWireIntegratedModelTransientPvPointV1 &
    Readonly<{ beatOrdinal: number }>)[];
  measuredVolumeRangeMl: readonly [number, number];
  elastanceMmHgPerMl: number;
  interceptMmHg: number;
  extrapolatedVolumeAxisInterceptMl: number | null;
  residualSumOfSquaresMmHgSquared: number;
  rSquared: number | null;
  positiveSlope: boolean;
}>;

export type MainWireIntegratedModelTransientPvSupportContactV1 =
  MainWireIntegratedModelTransientPvPointV1 &
    Readonly<{
      beatOrdinal: number;
      phase01: number;
      loopSupportInterceptMmHg: number;
      supportGapFromCommonLineMmHg: number;
    }>;

export type MainWireIntegratedModelTransientPvSupportEnvelopeV1 = Readonly<{
  methodId: "sampled-common-support-envelope";
  directionId: MainWireIntegratedModelTransientPvDirectionIdV1;
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1;
  loopCount: number;
  sampledPointCount: number;
  measuredVolumeRangeMl: readonly [number, number];
  elastanceMmHgPerMl: number;
  interceptMmHg: number;
  extrapolatedVolumeAxisInterceptMl: number;
  maximumInterLoopSupportGapMmHg: number;
  maximumSampledLoopPenetrationMmHg: number;
  coarseGridBoundaryHit: boolean;
  contacts: readonly MainWireIntegratedModelTransientPvSupportContactV1[];
}>;

export type MainWireIntegratedModelTransientPvHysteresisPairV1 = Readonly<{
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1;
  methodId:
    | "baseline-anchored-isochronal"
    | "semilunar-closure"
    | "minimum-volume"
    | "sampled-common-support-envelope";
  occlusionBeatOrdinal: number;
  releaseBeatOrdinal: number;
  midpointResistanceScale: number;
  releaseMinusOcclusionVolumeMl: number;
  releaseMinusOcclusionTransmuralPressureMmHg: number;
}>;

export type MainWireIntegratedModelTransientPvComparisonV1 = Readonly<{
  comparisonOwnerId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_COMPARISON_ENGINEERING_V1_ID;
  pressureBasis: "transmural";
  beatProjectionCount: 21;
  beatProjections: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[];
  linearRelations: readonly MainWireIntegratedModelTransientPvLinearRelationV1[];
  supportEnvelopes: readonly MainWireIntegratedModelTransientPvSupportEnvelopeV1[];
  hysteresisPairs: readonly MainWireIntegratedModelTransientPvHysteresisPairV1[];
  directionFitDifferences: readonly Readonly<{
    ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1;
    methodId:
      | "baseline-anchored-isochronal"
      | "semilunar-closure"
      | "minimum-volume"
      | "sampled-common-support-envelope";
    releaseMinusOcclusionElastanceMmHgPerMl: number;
    releaseMinusOcclusionInterceptMmHg: number;
  }>[];
  payloadSha256: string;
}>;

export type MainWireIntegratedModelTransientPvComparisonAuditV1 = Readonly<{
  auditorId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_AUDITOR_V1_ID;
  status: "comparison-audit-passed" | "comparison-audit-failed";
  firstMismatchPath: string | null;
}>;

export type MainWireIntegratedModelTransientPvRawBeatBindingV1 = Readonly<{
  beatOrdinal: number;
  startTimeSec: number;
  endTimeSec: number;
  rawAcceptedSampleCount: number;
  rawAcceptedSamplesSha256: string;
}>;

export type MainWireIntegratedModelTransientPvRawProjectionAuditV1 = Readonly<{
  auditorId: typeof MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RAW_PROJECTION_AUDITOR_V1_ID;
  status: "raw-projection-audit-passed" | "raw-projection-audit-failed";
  rawBeatBindings: readonly MainWireIntegratedModelTransientPvRawBeatBindingV1[];
  rawBeatFamilySha256: string;
  projectionFamilySha256: string;
  firstMismatchPath: string | null;
}>;

const COMPACT_LOOP_SAMPLE_COUNT_V1 =
  MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1
    .compactLoop.sampleCountPerBeatPerVentricle;

export function mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
  elapsedTimeSec: number,
): number {
  requireFiniteV1(elapsedTimeSec, "elapsedTimeSec");
  if (elapsedTimeSec < 0 || elapsedTimeSec > 21) {
    throw new RangeError(
      "transient venous-return elapsed time must be in [0,21]",
    );
  }
  if (elapsedTimeSec <= 1) return 1;
  if (elapsedTimeSec < 9) {
    return Math.exp(Math.log(8) * ((elapsedTimeSec - 1) / 8));
  }
  if (elapsedTimeSec <= 11) return 8;
  if (elapsedTimeSec < 19) {
    return Math.exp(Math.log(8) * ((19 - elapsedTimeSec) / 8));
  }
  return 1;
}

export function mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(
  beatOrdinal: number,
): MainWireIntegratedModelTransientVenousReturnReductionBeatPhaseV1 {
  if (!Number.isInteger(beatOrdinal) || beatOrdinal < 1 || beatOrdinal > 21) {
    throw new RangeError("transient venous-return beat ordinal must be 1..21");
  }
  return MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_BEAT_PHASES_V1[
    beatOrdinal - 1
  ]!;
}

export async function projectMainWireIntegratedModelTransientPvBeatFamilyV1(
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
): Promise<readonly MainWireIntegratedModelTransientPvBeatProjectionV1[]> {
  if (rawBeats.length !== 21) {
    throw new RangeError("transient PV family requires exactly 21 beats");
  }
  const owned = rawBeats.map(ownRawBeatV1);
  for (let index = 0; index < owned.length; index += 1) {
    const beat = owned[index]!;
    if (beat.beatOrdinal !== index + 1) {
      throw new Error("transient PV beats must retain exact ordinal order");
    }
    if (index > 0 && beat.startTimeSec !== owned[index - 1]!.endTimeSec) {
      throw new Error("transient PV beat boundaries must be contiguous");
    }
  }
  const sourceTimeSec = owned[0]!.startTimeSec;
  const baselinePhases = Object.freeze({
    LV: maximumPressurePhaseV1(owned[0]!, "LV"),
    RV: maximumPressurePhaseV1(owned[0]!, "RV"),
  });
  return Object.freeze(
    await Promise.all(
      owned.map((beat) => projectBeatV1(beat, sourceTimeSec, baselinePhases)),
    ),
  );
}

export async function compareMainWireIntegratedModelTransientPvRelationsV1(
  beatProjections: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
): Promise<MainWireIntegratedModelTransientPvComparisonV1> {
  const beats = await ownBeatProjectionsV1(beatProjections);
  const linearRelations: MainWireIntegratedModelTransientPvLinearRelationV1[] =
    [];
  const supportEnvelopes: MainWireIntegratedModelTransientPvSupportEnvelopeV1[] =
    [];
  for (const directionId of ["occlusion", "release"] as const) {
    const family = beatsForDirectionV1(beats, directionId);
    for (const ventricleId of MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_VENTRICLE_IDS_V1) {
      linearRelations.push(
        fitLandmarkRelationV1(
          family,
          directionId,
          ventricleId,
          "baseline-anchored-isochronal",
        ),
        fitLandmarkRelationV1(
          family,
          directionId,
          ventricleId,
          "semilunar-closure",
        ),
        fitLandmarkRelationV1(
          family,
          directionId,
          ventricleId,
          "minimum-volume",
        ),
      );
      supportEnvelopes.push(
        fitSupportEnvelopeV1(family, directionId, ventricleId),
      );
    }
  }
  const hysteresisPairs = buildHysteresisPairsV1(
    beats,
    linearRelations,
    supportEnvelopes,
  );
  const directionFitDifferences = buildDirectionFitDifferencesV1(
    linearRelations,
    supportEnvelopes,
  );
  const body = Object.freeze({
    comparisonOwnerId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_COMPARISON_ENGINEERING_V1_ID,
    pressureBasis: "transmural" as const,
    beatProjectionCount: 21 as const,
    beatProjections: beats,
    linearRelations: Object.freeze(linearRelations),
    supportEnvelopes: Object.freeze(supportEnvelopes),
    hysteresisPairs: Object.freeze(hysteresisPairs),
    directionFitDifferences: Object.freeze(directionFitDifferences),
  });
  requireAllNumericLeavesFiniteV1(body, "transient PV comparison");
  return Object.freeze({
    ...body,
    payloadSha256: await sha256CanonicalJsonHex(body),
  });
}

/**
 * Producer-time replay from the in-memory accepted PV endpoints. The compact
 * artifact retains this closed audit and the raw fingerprints, not the raw
 * endpoint arrays themselves (INTEGRATED-MODEL-0032).
 */
export async function auditMainWireIntegratedModelTransientPvRawProjectionV1(
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  actual: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
): Promise<MainWireIntegratedModelTransientPvRawProjectionAuditV1> {
  const rawBeatBindings = Object.freeze(
    await Promise.all(
      rawBeats.map(async (beat) =>
        Object.freeze({
          beatOrdinal: beat.beatOrdinal,
          startTimeSec: beat.startTimeSec,
          endTimeSec: beat.endTimeSec,
          rawAcceptedSampleCount: beat.samples.length,
          rawAcceptedSamplesSha256: await sha256CanonicalJsonHex(beat.samples),
        }),
      ),
    ),
  );
  const rawBeatFamilySha256 = await sha256CanonicalJsonHex(rawBeatBindings);
  const projectionFamilySha256 = await sha256CanonicalJsonHex(actual);
  let firstMismatchPath: string | null = null;
  try {
    const expected =
      await projectMainWireIntegratedModelTransientPvBeatFamilyV1(rawBeats);
    if (expected.length !== actual.length) {
      firstMismatchPath = "beatProjections.length";
    } else {
      for (let index = 0; index < expected.length; index += 1) {
        if (
          canonicalJsonStringify(expected[index]) !==
          canonicalJsonStringify(actual[index])
        ) {
          firstMismatchPath = `beatProjections[${index}]`;
          break;
        }
      }
    }
  } catch (error) {
    firstMismatchPath =
      error instanceof Error
        ? `rawProjection:${error.name}:${error.message}`
        : "rawProjection:unknown-audit-error";
  }
  return Object.freeze({
    auditorId:
      MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RAW_PROJECTION_AUDITOR_V1_ID,
    status:
      firstMismatchPath === null
        ? ("raw-projection-audit-passed" as const)
        : ("raw-projection-audit-failed" as const),
    rawBeatBindings,
    rawBeatFamilySha256,
    projectionFamilySha256,
    firstMismatchPath,
  });
}

export async function auditMainWireIntegratedModelTransientPvComparisonV1(
  comparison: MainWireIntegratedModelTransientPvComparisonV1,
): Promise<MainWireIntegratedModelTransientPvComparisonAuditV1> {
  try {
    const expected = await compareMainWireIntegratedModelTransientPvRelationsV1(
      comparison.beatProjections,
    );
    const mismatch = firstComparisonMismatchV1(expected, comparison);
    return Object.freeze({
      auditorId: MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_AUDITOR_V1_ID,
      status:
        mismatch === null
          ? ("comparison-audit-passed" as const)
          : ("comparison-audit-failed" as const),
      firstMismatchPath: mismatch,
    });
  } catch (error) {
    return Object.freeze({
      auditorId: MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_RELATION_AUDITOR_V1_ID,
      status: "comparison-audit-failed" as const,
      firstMismatchPath:
        error instanceof Error
          ? `comparison:${error.message}`
          : "comparison:unknown-audit-error",
    });
  }
}

async function projectBeatV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  sourceTimeSec: number,
  baselinePhases: Readonly<{ LV: number; RV: number }>,
): Promise<MainWireIntegratedModelTransientPvBeatProjectionV1> {
  const elapsedStartSec = beat.startTimeSec - sourceTimeSec;
  const elapsedEndSec = beat.endTimeSec - sourceTimeSec;
  const body = Object.freeze({
    projectionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_BEAT_PROJECTION_V1_ID,
    beatOrdinal: beat.beatOrdinal,
    phase: mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(
      beat.beatOrdinal,
    ),
    startTimeSec: beat.startTimeSec,
    endTimeSec: beat.endTimeSec,
    resistanceScale: Object.freeze({
      start:
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
          elapsedStartSec,
        ),
      midpoint: mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        (elapsedStartSec + elapsedEndSec) / 2,
      ),
      end: mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        elapsedEndSec,
      ),
    }),
    LV: await projectVentricleBeatV1(beat, "LV", baselinePhases.LV),
    RV: await projectVentricleBeatV1(beat, "RV", baselinePhases.RV),
  });
  requireAllNumericLeavesFiniteV1(body, "transient PV beat projection");
  return Object.freeze({
    ...body,
    payloadSha256: await sha256CanonicalJsonHex(body),
  });
}

async function projectVentricleBeatV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
  baselinePhase01: number,
): Promise<MainWireIntegratedModelTransientPvVentricleBeatProjectionV1> {
  const maximumPressureSampleIndex = earliestExtremumIndexV1(
    beat.samples,
    (sample) => sample[ventricleId].transmuralPressureMmHg,
    "maximum",
  );
  const minimumVolumeSampleIndex = earliestExtremumIndexV1(
    beat.samples,
    (sample) => sample[ventricleId].volumeMl,
    "minimum",
  );
  const closure = semilunarClosureV1(beat, ventricleId);
  const compactLoop = compactLoopV1(beat, ventricleId);
  return Object.freeze({
    ventricleId,
    rawEndpointSummary: Object.freeze({
      rawAcceptedSampleCount: beat.samples.length,
      rawAcceptedSamplesSha256: await sha256CanonicalJsonHex(beat.samples),
      maximumPositiveSemilunarFlowMlPerSec:
        closure.maximumPositiveSemilunarFlowMlPerSec,
      maximumPressureSampleIndex,
      minimumVolumeSampleIndex,
      closureBracketSampleIndices: closure.bracketSampleIndices,
    }),
    compactLoop,
    compactLoopSha256: await sha256CanonicalJsonHex(compactLoop),
    landmarks: Object.freeze({
      baselineAnchoredIsochronal: landmarkAtPhaseV1(
        beat,
        ventricleId,
        baselinePhase01,
        "baseline-frozen-isochronal",
      ),
      semilunarClosure: closure.landmark,
      minimumVolume: rawLandmarkV1(
        beat,
        ventricleId,
        minimumVolumeSampleIndex,
        "earliest-raw-minimum-volume",
      ),
    }),
  });
}

function compactLoopV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
): readonly MainWireIntegratedModelTransientPvCompactLoopPointV1[] {
  return Object.freeze(
    Array.from({ length: COMPACT_LOOP_SAMPLE_COUNT_V1 }, (_, index) => {
      const phase01 = index / COMPACT_LOOP_SAMPLE_COUNT_V1;
      const point = interpolatePointAtTimeV1(
        beat,
        ventricleId,
        beat.startTimeSec + phase01 * (beat.endTimeSec - beat.startTimeSec),
      );
      return Object.freeze({ phase01, ...point });
    }),
  );
}

function maximumPressurePhaseV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
): number {
  const index = earliestExtremumIndexV1(
    beat.samples,
    (sample) => sample[ventricleId].transmuralPressureMmHg,
    "maximum",
  );
  return phaseAtTimeV1(beat, beat.samples[index]!.timeSec);
}

function semilunarClosureV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
): Readonly<{
  maximumPositiveSemilunarFlowMlPerSec: number;
  bracketSampleIndices: readonly [number, number];
  landmark: MainWireIntegratedModelTransientPvLandmarkV1;
}> {
  const flows = beat.samples.map(
    (sample) => sample[ventricleId].semilunarFlowMlPerSec,
  );
  const maximumIndex = earliestExtremumIndexV1(
    beat.samples,
    (_, index) => flows[index]!,
    "maximum",
  );
  const maximumPositiveSemilunarFlowMlPerSec = flows[maximumIndex]!;
  if (!(maximumPositiveSemilunarFlowMlPerSec > 0)) {
    throw new Error(
      `${ventricleId} beat ${beat.beatOrdinal} lacks positive semilunar flow`,
    );
  }
  for (let right = maximumIndex + 1; right < flows.length; right += 1) {
    const left = right - 1;
    const leftFlow = flows[left]!;
    const rightFlow = flows[right]!;
    if (leftFlow > 0 && rightFlow <= 0) {
      const flowSpan = leftFlow - rightFlow;
      if (!Number.isFinite(flowSpan) || !(flowSpan > 0)) {
        throw new Error(
          `${ventricleId} beat ${beat.beatOrdinal} closure interpolation overflowed`,
        );
      }
      const fraction = leftFlow / flowSpan;
      const leftSample = beat.samples[left]!;
      const rightSample = beat.samples[right]!;
      const timeSec = lerpV1(leftSample.timeSec, rightSample.timeSec, fraction);
      const ventricularLeft = leftSample[ventricleId];
      const ventricularRight = rightSample[ventricleId];
      return Object.freeze({
        maximumPositiveSemilunarFlowMlPerSec,
        bracketSampleIndices: Object.freeze([left, right] as const),
        landmark: Object.freeze({
          timeSec,
          phase01: phaseAtTimeV1(beat, timeSec),
          volumeMl: lerpV1(
            ventricularLeft.volumeMl,
            ventricularRight.volumeMl,
            fraction,
          ),
          transmuralPressureMmHg: lerpV1(
            ventricularLeft.transmuralPressureMmHg,
            ventricularRight.transmuralPressureMmHg,
            fraction,
          ),
          source: "semilunar-zero-flow-crossing" as const,
        }),
      });
    }
  }
  throw new Error(
    `${ventricleId} beat ${beat.beatOrdinal} lacks semilunar closure`,
  );
}

function fitLandmarkRelationV1(
  beats: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
  directionId: MainWireIntegratedModelTransientPvDirectionIdV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
  methodId:
    "baseline-anchored-isochronal" | "semilunar-closure" | "minimum-volume",
): MainWireIntegratedModelTransientPvLinearRelationV1 {
  const key =
    methodId === "baseline-anchored-isochronal"
      ? "baselineAnchoredIsochronal"
      : methodId === "semilunar-closure"
        ? "semilunarClosure"
        : "minimumVolume";
  const points = Object.freeze(
    beats.map((beat) => {
      const landmark = beat[ventricleId].landmarks[key];
      return Object.freeze({
        beatOrdinal: beat.beatOrdinal,
        volumeMl: landmark.volumeMl,
        transmuralPressureMmHg: landmark.transmuralPressureMmHg,
      });
    }),
  );
  const fit = linearFitV1(points);
  return Object.freeze({
    methodId,
    directionId,
    ventricleId,
    pointCount: points.length,
    points,
    ...fit,
  });
}

function linearFitV1(
  points: readonly MainWireIntegratedModelTransientPvPointV1[],
): Omit<
  MainWireIntegratedModelTransientPvLinearRelationV1,
  "methodId" | "directionId" | "ventricleId" | "pointCount" | "points"
> {
  if (points.length < 2) {
    throw new Error("transient PV linear fit requires at least two points");
  }
  const meanVolume =
    sumV1(points.map(({ volumeMl }) => volumeMl)) / points.length;
  const meanPressure =
    sumV1(points.map(({ transmuralPressureMmHg }) => transmuralPressureMmHg)) /
    points.length;
  let volumeVariance = 0;
  let covariance = 0;
  let pressureVariance = 0;
  for (const point of points) {
    const dv = point.volumeMl - meanVolume;
    const dp = point.transmuralPressureMmHg - meanPressure;
    volumeVariance += dv * dv;
    covariance += dv * dp;
    pressureVariance += dp * dp;
  }
  if (!(volumeVariance > 0) || !Number.isFinite(volumeVariance)) {
    throw new Error("transient PV linear fit has zero volume range");
  }
  const elastanceMmHgPerMl = covariance / volumeVariance;
  const interceptMmHg = meanPressure - elastanceMmHgPerMl * meanVolume;
  let residualSumOfSquaresMmHgSquared = 0;
  for (const point of points) {
    const residual =
      point.transmuralPressureMmHg -
      (elastanceMmHgPerMl * point.volumeMl + interceptMmHg);
    residualSumOfSquaresMmHgSquared += residual * residual;
  }
  const volumes = points.map(({ volumeMl }) => volumeMl);
  const values = [
    elastanceMmHgPerMl,
    interceptMmHg,
    residualSumOfSquaresMmHgSquared,
  ];
  if (!values.every(Number.isFinite)) {
    throw new Error("transient PV linear fit is non-finite");
  }
  return Object.freeze({
    measuredVolumeRangeMl: Object.freeze([
      Math.min(...volumes),
      Math.max(...volumes),
    ] as const),
    elastanceMmHgPerMl,
    interceptMmHg,
    extrapolatedVolumeAxisInterceptMl:
      elastanceMmHgPerMl > 0 ? -interceptMmHg / elastanceMmHgPerMl : null,
    residualSumOfSquaresMmHgSquared,
    rSquared:
      pressureVariance === 0
        ? residualSumOfSquaresMmHgSquared === 0
          ? 1
          : null
        : 1 - residualSumOfSquaresMmHgSquared / pressureVariance,
    positiveSlope: elastanceMmHgPerMl > 0,
  });
}

function fitSupportEnvelopeV1(
  beats: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
  directionId: MainWireIntegratedModelTransientPvDirectionIdV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
): MainWireIntegratedModelTransientPvSupportEnvelopeV1 {
  const coarse = logarithmicGridV1(0.05, 12, 513);
  const coarseScores = coarse.map((slope) =>
    supportScoreV1(beats, ventricleId, slope),
  );
  const coarseBestIndex = bestSupportIndexV1(coarseScores);
  const refinementNeighborIndex =
    coarseBestIndex === 0
      ? 1
      : coarseBestIndex === coarse.length - 1
        ? coarse.length - 2
        : coarseScores[coarseBestIndex - 1]!.score <=
            coarseScores[coarseBestIndex + 1]!.score
          ? coarseBestIndex - 1
          : coarseBestIndex + 1;
  const lower = coarse[Math.min(coarseBestIndex, refinementNeighborIndex)]!;
  const upper = coarse[Math.max(coarseBestIndex, refinementNeighborIndex)]!;
  const refined = logarithmicGridV1(lower, upper, 257);
  const refinedScores = refined.map((slope) =>
    supportScoreV1(beats, ventricleId, slope),
  );
  const selected = refinedScores[bestSupportIndexV1(refinedScores)]!;
  const commonIntercept = Math.max(
    ...selected.contacts.map(({ intercept }) => intercept),
  );
  const contacts = Object.freeze(
    selected.contacts.map(({ beat, point, intercept }) =>
      Object.freeze({
        beatOrdinal: beat.beatOrdinal,
        phase01: point.phase01,
        volumeMl: point.volumeMl,
        transmuralPressureMmHg: point.transmuralPressureMmHg,
        loopSupportInterceptMmHg: intercept,
        supportGapFromCommonLineMmHg: commonIntercept - intercept,
      }),
    ),
  );
  let maximumPenetration = 0;
  const volumes: number[] = [];
  for (const beat of beats) {
    for (const point of beat[ventricleId].compactLoop) {
      volumes.push(point.volumeMl);
      maximumPenetration = Math.max(
        maximumPenetration,
        point.transmuralPressureMmHg -
          (selected.slope * point.volumeMl + commonIntercept),
      );
    }
  }
  if (
    maximumPenetration >
    32 * Number.EPSILON * Math.max(1, Math.abs(commonIntercept))
  ) {
    throw new Error("transient PV support line penetrates a retained loop");
  }
  return Object.freeze({
    methodId: "sampled-common-support-envelope" as const,
    directionId,
    ventricleId,
    loopCount: beats.length,
    sampledPointCount: beats.length * COMPACT_LOOP_SAMPLE_COUNT_V1,
    measuredVolumeRangeMl: Object.freeze([
      Math.min(...volumes),
      Math.max(...volumes),
    ] as const),
    elastanceMmHgPerMl: selected.slope,
    interceptMmHg: commonIntercept,
    extrapolatedVolumeAxisInterceptMl: -commonIntercept / selected.slope,
    maximumInterLoopSupportGapMmHg: selected.score,
    maximumSampledLoopPenetrationMmHg: Math.max(0, maximumPenetration),
    coarseGridBoundaryHit:
      coarseBestIndex === 0 || coarseBestIndex === coarse.length - 1,
    contacts,
  });
}

type SupportScoreV1 = Readonly<{
  slope: number;
  score: number;
  contacts: readonly Readonly<{
    beat: MainWireIntegratedModelTransientPvBeatProjectionV1;
    point: MainWireIntegratedModelTransientPvCompactLoopPointV1;
    intercept: number;
  }>[];
}>;

function supportScoreV1(
  beats: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
  slope: number,
): SupportScoreV1 {
  const contacts = Object.freeze(
    beats.map((beat) => {
      const loop = beat[ventricleId].compactLoop;
      let point = loop[0]!;
      let intercept = point.transmuralPressureMmHg - slope * point.volumeMl;
      for (let index = 1; index < loop.length; index += 1) {
        const candidate = loop[index]!;
        const candidateIntercept =
          candidate.transmuralPressureMmHg - slope * candidate.volumeMl;
        if (candidateIntercept > intercept) {
          point = candidate;
          intercept = candidateIntercept;
        }
      }
      return Object.freeze({ beat, point, intercept });
    }),
  );
  const intercepts = contacts.map(({ intercept }) => intercept);
  return Object.freeze({
    slope,
    score: Math.max(...intercepts) - Math.min(...intercepts),
    contacts,
  });
}

function bestSupportIndexV1(scores: readonly SupportScoreV1[]): number {
  let best = 0;
  for (let index = 1; index < scores.length; index += 1) {
    const candidate = scores[index]!;
    const selected = scores[best]!;
    if (
      candidate.score < selected.score ||
      (candidate.score === selected.score && candidate.slope < selected.slope)
    ) {
      best = index;
    }
  }
  return best;
}

function buildHysteresisPairsV1(
  beats: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
  linearRelations: readonly MainWireIntegratedModelTransientPvLinearRelationV1[],
  supportEnvelopes: readonly MainWireIntegratedModelTransientPvSupportEnvelopeV1[],
): MainWireIntegratedModelTransientPvHysteresisPairV1[] {
  const pairs: MainWireIntegratedModelTransientPvHysteresisPairV1[] = [];
  for (const [
    occlusionBeatOrdinal,
    releaseBeatOrdinal,
  ] of MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_VENOUS_RETURN_REDUCTION_PROTOCOL_PAYLOAD_V1
    .intervention.matchedRampBeatPairs) {
    const occlusion = beats[occlusionBeatOrdinal - 1]!;
    const release = beats[releaseBeatOrdinal - 1]!;
    if (
      occlusion.resistanceScale.midpoint !== release.resistanceScale.midpoint
    ) {
      throw new Error("transient PV hysteresis pair scale mismatch");
    }
    for (const ventricleId of MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_VENTRICLE_IDS_V1) {
      for (const methodId of [
        "baseline-anchored-isochronal",
        "semilunar-closure",
        "minimum-volume",
        "sampled-common-support-envelope",
      ] as const) {
        const occlusionPoint = methodPointForBeatV1(
          occlusion,
          ventricleId,
          methodId,
          linearRelations,
          supportEnvelopes,
        );
        const releasePoint = methodPointForBeatV1(
          release,
          ventricleId,
          methodId,
          linearRelations,
          supportEnvelopes,
        );
        pairs.push(
          Object.freeze({
            ventricleId,
            methodId,
            occlusionBeatOrdinal,
            releaseBeatOrdinal,
            midpointResistanceScale: occlusion.resistanceScale.midpoint,
            releaseMinusOcclusionVolumeMl:
              releasePoint.volumeMl - occlusionPoint.volumeMl,
            releaseMinusOcclusionTransmuralPressureMmHg:
              releasePoint.transmuralPressureMmHg -
              occlusionPoint.transmuralPressureMmHg,
          }),
        );
      }
    }
  }
  return pairs;
}

function methodPointForBeatV1(
  beat: MainWireIntegratedModelTransientPvBeatProjectionV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
  methodId:
    | "baseline-anchored-isochronal"
    | "semilunar-closure"
    | "minimum-volume"
    | "sampled-common-support-envelope",
  _linearRelations: readonly MainWireIntegratedModelTransientPvLinearRelationV1[],
  supportEnvelopes: readonly MainWireIntegratedModelTransientPvSupportEnvelopeV1[],
): MainWireIntegratedModelTransientPvPointV1 {
  if (methodId !== "sampled-common-support-envelope") {
    const key =
      methodId === "baseline-anchored-isochronal"
        ? "baselineAnchoredIsochronal"
        : methodId === "semilunar-closure"
          ? "semilunarClosure"
          : "minimumVolume";
    return beat[ventricleId].landmarks[key];
  }
  const directionId: MainWireIntegratedModelTransientPvDirectionIdV1 =
    beat.beatOrdinal <= 11 ? "occlusion" : "release";
  const envelope = supportEnvelopes.find(
    (candidate) =>
      candidate.directionId === directionId &&
      candidate.ventricleId === ventricleId,
  );
  const contact = envelope?.contacts.find(
    (candidate) => candidate.beatOrdinal === beat.beatOrdinal,
  );
  if (contact === undefined) {
    throw new Error("transient PV support contact is unavailable");
  }
  return contact;
}

function buildDirectionFitDifferencesV1(
  linearRelations: readonly MainWireIntegratedModelTransientPvLinearRelationV1[],
  supportEnvelopes: readonly MainWireIntegratedModelTransientPvSupportEnvelopeV1[],
): MainWireIntegratedModelTransientPvComparisonV1["directionFitDifferences"] {
  const rows: MainWireIntegratedModelTransientPvComparisonV1["directionFitDifferences"][number][] =
    [];
  for (const ventricleId of MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_VENTRICLE_IDS_V1) {
    for (const methodId of [
      "baseline-anchored-isochronal",
      "semilunar-closure",
      "minimum-volume",
      "sampled-common-support-envelope",
    ] as const) {
      const pool =
        methodId === "sampled-common-support-envelope"
          ? supportEnvelopes
          : linearRelations;
      const occlusion = pool.find(
        (relation) =>
          relation.methodId === methodId &&
          relation.directionId === "occlusion" &&
          relation.ventricleId === ventricleId,
      );
      const release = pool.find(
        (relation) =>
          relation.methodId === methodId &&
          relation.directionId === "release" &&
          relation.ventricleId === ventricleId,
      );
      if (occlusion === undefined || release === undefined) {
        throw new Error("transient PV direction relation is unavailable");
      }
      rows.push(
        Object.freeze({
          ventricleId,
          methodId,
          releaseMinusOcclusionElastanceMmHgPerMl:
            release.elastanceMmHgPerMl - occlusion.elastanceMmHgPerMl,
          releaseMinusOcclusionInterceptMmHg:
            release.interceptMmHg - occlusion.interceptMmHg,
        }),
      );
    }
  }
  return Object.freeze(rows);
}

function beatsForDirectionV1(
  beats: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
  directionId: MainWireIntegratedModelTransientPvDirectionIdV1,
): readonly MainWireIntegratedModelTransientPvBeatProjectionV1[] {
  return directionId === "occlusion" ? beats.slice(0, 11) : beats.slice(10, 21);
}

function ownRawBeatV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
): MainWireIntegratedModelTransientPvRawBeatV1 {
  if (!Number.isInteger(beat.beatOrdinal)) {
    throw new TypeError("transient PV beat ordinal must be an integer");
  }
  requireFiniteV1(beat.startTimeSec, "beat.startTimeSec");
  requireFiniteV1(beat.endTimeSec, "beat.endTimeSec");
  if (!(beat.endTimeSec > beat.startTimeSec) || beat.samples.length < 2) {
    throw new Error(
      "transient PV raw beat requires positive duration and samples",
    );
  }
  const samples = Object.freeze(
    beat.samples.map((sample, index) => {
      requireFiniteV1(sample.timeSec, `beat.samples[${index}].timeSec`);
      for (const ventricleId of MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_VENTRICLE_IDS_V1) {
        for (const [name, value] of Object.entries(sample[ventricleId])) {
          requireFiniteV1(
            value,
            `beat.samples[${index}].${ventricleId}.${name}`,
          );
        }
      }
      if (index > 0 && !(sample.timeSec > beat.samples[index - 1]!.timeSec)) {
        throw new Error("transient PV raw sample times must increase strictly");
      }
      return Object.freeze({
        timeSec: sample.timeSec,
        LV: Object.freeze({ ...sample.LV }),
        RV: Object.freeze({ ...sample.RV }),
      });
    }),
  );
  if (
    samples[0]!.timeSec !== beat.startTimeSec ||
    samples[samples.length - 1]!.timeSec !== beat.endTimeSec
  ) {
    throw new Error(
      "transient PV raw samples must include exact beat boundaries",
    );
  }
  return Object.freeze({
    beatOrdinal: beat.beatOrdinal,
    startTimeSec: beat.startTimeSec,
    endTimeSec: beat.endTimeSec,
    samples,
  });
}

async function ownBeatProjectionsV1(
  beatProjections: readonly MainWireIntegratedModelTransientPvBeatProjectionV1[],
): Promise<readonly MainWireIntegratedModelTransientPvBeatProjectionV1[]> {
  if (beatProjections.length !== 21) {
    throw new RangeError("transient PV comparison requires exactly 21 beats");
  }
  const baselinePhases = Object.freeze({
    LV: beatProjections[0]!.LV.landmarks.baselineAnchoredIsochronal.phase01,
    RV: beatProjections[0]!.RV.landmarks.baselineAnchoredIsochronal.phase01,
  });
  for (let index = 0; index < beatProjections.length; index += 1) {
    const beat = beatProjections[index]!;
    requireExactRecordKeysV1(
      beat,
      [
        "projectionId",
        "beatOrdinal",
        "phase",
        "startTimeSec",
        "endTimeSec",
        "resistanceScale",
        "LV",
        "RV",
        "payloadSha256",
      ],
      `beatProjections[${index}]`,
    );
    requireExactRecordKeysV1(
      beat.resistanceScale,
      ["start", "midpoint", "end"],
      `beatProjections[${index}].resistanceScale`,
    );
    requireAllNumericLeavesFiniteV1(beat, `beatProjections[${index}]`);
    if (
      beat.projectionId !==
        MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_BEAT_PROJECTION_V1_ID ||
      beat.beatOrdinal !== index + 1 ||
      beat.phase !==
        mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(index + 1) ||
      !(beat.endTimeSec > beat.startTimeSec) ||
      (index > 0 &&
        beat.startTimeSec !== beatProjections[index - 1]!.endTimeSec) ||
      beat.resistanceScale.start !==
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(index) ||
      beat.resistanceScale.midpoint !==
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
          index + 0.5,
        ) ||
      beat.resistanceScale.end !==
        mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
          index + 1,
        ) ||
      beat.payloadSha256 !==
        (await sha256CanonicalJsonHex(withoutPayloadShaV1(beat)))
    ) {
      throw new Error("transient PV beat projection binding mismatch");
    }
    for (const ventricleId of MAIN_WIRE_INTEGRATED_MODEL_TRANSIENT_PV_VENTRICLE_IDS_V1) {
      const projection = beat[ventricleId];
      requireExactRecordKeysV1(
        projection,
        [
          "ventricleId",
          "rawEndpointSummary",
          "compactLoop",
          "compactLoopSha256",
          "landmarks",
        ],
        `beatProjections[${index}].${ventricleId}`,
      );
      assertRawEndpointSummaryV1(
        projection.rawEndpointSummary,
        `beatProjections[${index}].${ventricleId}.rawEndpointSummary`,
      );
      assertCompactLoopV1(
        projection.compactLoop,
        `beatProjections[${index}].${ventricleId}.compactLoop`,
      );
      assertLandmarksV1(
        projection.landmarks,
        beat.startTimeSec,
        beat.endTimeSec,
        baselinePhases[ventricleId],
        `beatProjections[${index}].${ventricleId}.landmarks`,
      );
      if (
        projection.ventricleId !== ventricleId ||
        projection.compactLoop.length !== COMPACT_LOOP_SAMPLE_COUNT_V1 ||
        projection.compactLoopSha256 !==
          (await sha256CanonicalJsonHex(projection.compactLoop))
      ) {
        throw new Error("transient PV compact loop binding mismatch");
      }
    }
  }
  return Object.freeze([...beatProjections]);
}

function assertRawEndpointSummaryV1(
  summary: MainWireIntegratedModelTransientPvRawEndpointSummaryV1,
  path: string,
): void {
  requireExactRecordKeysV1(
    summary,
    [
      "rawAcceptedSampleCount",
      "rawAcceptedSamplesSha256",
      "maximumPositiveSemilunarFlowMlPerSec",
      "maximumPressureSampleIndex",
      "minimumVolumeSampleIndex",
      "closureBracketSampleIndices",
    ],
    path,
  );
  const [closureLeft, closureRight] = summary.closureBracketSampleIndices;
  if (
    !Number.isSafeInteger(summary.rawAcceptedSampleCount) ||
    summary.rawAcceptedSampleCount < 2 ||
    !/^[0-9a-f]{64}$/.test(summary.rawAcceptedSamplesSha256) ||
    !Number.isFinite(summary.maximumPositiveSemilunarFlowMlPerSec) ||
    !(summary.maximumPositiveSemilunarFlowMlPerSec > 0) ||
    !isRetainedSampleIndexV1(
      summary.maximumPressureSampleIndex,
      summary.rawAcceptedSampleCount,
    ) ||
    !isRetainedSampleIndexV1(
      summary.minimumVolumeSampleIndex,
      summary.rawAcceptedSampleCount,
    ) ||
    summary.closureBracketSampleIndices.length !== 2 ||
    !isRetainedSampleIndexV1(closureLeft, summary.rawAcceptedSampleCount) ||
    !isRetainedSampleIndexV1(closureRight, summary.rawAcceptedSampleCount) ||
    closureRight !== closureLeft + 1
  ) {
    throw new Error(`${path} is invalid`);
  }
}

function assertCompactLoopV1(
  compactLoop: readonly MainWireIntegratedModelTransientPvCompactLoopPointV1[],
  path: string,
): void {
  if (compactLoop.length !== COMPACT_LOOP_SAMPLE_COUNT_V1) {
    throw new Error(`${path} must retain the fixed 64-point loop`);
  }
  for (let index = 0; index < compactLoop.length; index += 1) {
    const point = compactLoop[index]!;
    requireExactRecordKeysV1(
      point,
      ["phase01", "volumeMl", "transmuralPressureMmHg"],
      `${path}[${index}]`,
    );
    if (
      point.phase01 !== index / COMPACT_LOOP_SAMPLE_COUNT_V1 ||
      !Number.isFinite(point.volumeMl) ||
      !Number.isFinite(point.transmuralPressureMmHg)
    ) {
      throw new Error(`${path}[${index}] is invalid`);
    }
  }
}

function assertLandmarksV1(
  landmarks: MainWireIntegratedModelTransientPvVentricleBeatProjectionV1["landmarks"],
  startTimeSec: number,
  endTimeSec: number,
  baselinePhase01: number,
  path: string,
): void {
  requireExactRecordKeysV1(
    landmarks,
    ["baselineAnchoredIsochronal", "semilunarClosure", "minimumVolume"],
    path,
  );
  const entries = [
    [
      "baselineAnchoredIsochronal",
      landmarks.baselineAnchoredIsochronal,
      "baseline-frozen-isochronal",
    ],
    [
      "semilunarClosure",
      landmarks.semilunarClosure,
      "semilunar-zero-flow-crossing",
    ],
    ["minimumVolume", landmarks.minimumVolume, "earliest-raw-minimum-volume"],
  ] as const;
  for (const [name, landmark, expectedSource] of entries) {
    const landmarkPath = `${path}.${name}`;
    requireExactRecordKeysV1(
      landmark,
      ["timeSec", "phase01", "volumeMl", "transmuralPressureMmHg", "source"],
      landmarkPath,
    );
    if (
      landmark.source !== expectedSource ||
      !Number.isFinite(landmark.timeSec) ||
      !Number.isFinite(landmark.phase01) ||
      !Number.isFinite(landmark.volumeMl) ||
      !Number.isFinite(landmark.transmuralPressureMmHg) ||
      landmark.phase01 < 0 ||
      landmark.phase01 > 1 ||
      landmark.timeSec < startTimeSec ||
      landmark.timeSec > endTimeSec
    ) {
      throw new Error(`${landmarkPath} is invalid`);
    }
    const expectedPhase =
      name === "baselineAnchoredIsochronal"
        ? baselinePhase01
        : phaseAtTimeV1({ startTimeSec, endTimeSec }, landmark.timeSec);
    const expectedTimeSec =
      startTimeSec + expectedPhase * (endTimeSec - startTimeSec);
    if (
      landmark.phase01 !== expectedPhase ||
      landmark.timeSec !== expectedTimeSec
    ) {
      throw new Error(`${landmarkPath} phase/time binding mismatch`);
    }
  }
}

function isRetainedSampleIndexV1(value: number, sampleCount: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value < sampleCount;
}

function requireExactRecordKeysV1(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): asserts value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${path} must be a record`);
  }
  const actualKeys = Object.keys(value);
  if (
    actualKeys.length !== expectedKeys.length ||
    expectedKeys.some(
      (key) => !Object.prototype.hasOwnProperty.call(value, key),
    )
  ) {
    throw new Error(`${path} has an invalid closed shape`);
  }
}

function firstComparisonMismatchV1(
  expected: MainWireIntegratedModelTransientPvComparisonV1,
  actual: MainWireIntegratedModelTransientPvComparisonV1,
): string | null {
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  if (
    canonicalJsonStringify(expectedKeys) !== canonicalJsonStringify(actualKeys)
  ) {
    return "$keys";
  }
  for (const key of expectedKeys) {
    const typedKey =
      key as keyof MainWireIntegratedModelTransientPvComparisonV1;
    if (
      canonicalJsonStringify(expected[typedKey]) !==
      canonicalJsonStringify(actual[typedKey])
    ) {
      return key;
    }
  }
  return null;
}

function withoutPayloadShaV1(
  beat: MainWireIntegratedModelTransientPvBeatProjectionV1,
): Omit<MainWireIntegratedModelTransientPvBeatProjectionV1, "payloadSha256"> {
  const { payloadSha256: _payloadSha256, ...body } = beat;
  return body;
}

function rawLandmarkV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
  sampleIndex: number,
  source: MainWireIntegratedModelTransientPvLandmarkV1["source"],
): MainWireIntegratedModelTransientPvLandmarkV1 {
  const sample = beat.samples[sampleIndex]!;
  return Object.freeze({
    timeSec: sample.timeSec,
    phase01: phaseAtTimeV1(beat, sample.timeSec),
    volumeMl: sample[ventricleId].volumeMl,
    transmuralPressureMmHg: sample[ventricleId].transmuralPressureMmHg,
    source,
  });
}

function landmarkAtPhaseV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
  phase01: number,
  source: MainWireIntegratedModelTransientPvLandmarkV1["source"],
): MainWireIntegratedModelTransientPvLandmarkV1 {
  const timeSec =
    beat.startTimeSec + phase01 * (beat.endTimeSec - beat.startTimeSec);
  return Object.freeze({
    timeSec,
    phase01,
    ...interpolatePointAtTimeV1(beat, ventricleId, timeSec),
    source,
  });
}

function interpolatePointAtTimeV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
  timeSec: number,
): MainWireIntegratedModelTransientPvPointV1 {
  if (timeSec < beat.startTimeSec || timeSec > beat.endTimeSec) {
    throw new RangeError("transient PV interpolation time is outside beat");
  }
  if (timeSec === beat.startTimeSec) {
    return pointFromSampleV1(beat.samples[0]!, ventricleId);
  }
  for (let right = 1; right < beat.samples.length; right += 1) {
    const rightSample = beat.samples[right]!;
    if (timeSec <= rightSample.timeSec) {
      if (timeSec === rightSample.timeSec) {
        return pointFromSampleV1(rightSample, ventricleId);
      }
      const leftSample = beat.samples[right - 1]!;
      const fraction =
        (timeSec - leftSample.timeSec) /
        (rightSample.timeSec - leftSample.timeSec);
      return Object.freeze({
        volumeMl: lerpV1(
          leftSample[ventricleId].volumeMl,
          rightSample[ventricleId].volumeMl,
          fraction,
        ),
        transmuralPressureMmHg: lerpV1(
          leftSample[ventricleId].transmuralPressureMmHg,
          rightSample[ventricleId].transmuralPressureMmHg,
          fraction,
        ),
      });
    }
  }
  return pointFromSampleV1(beat.samples[beat.samples.length - 1]!, ventricleId);
}

function pointFromSampleV1(
  sample: MainWireIntegratedModelTransientPvAcceptedSampleV1,
  ventricleId: MainWireIntegratedModelTransientPvVentricleIdV1,
): MainWireIntegratedModelTransientPvPointV1 {
  return Object.freeze({
    volumeMl: sample[ventricleId].volumeMl,
    transmuralPressureMmHg: sample[ventricleId].transmuralPressureMmHg,
  });
}

function earliestExtremumIndexV1<T>(
  values: readonly T[],
  project: (value: T, index: number) => number,
  kind: "minimum" | "maximum",
): number {
  let selected = 0;
  let selectedValue = project(values[0]!, 0);
  for (let index = 1; index < values.length; index += 1) {
    const value = project(values[index]!, index);
    if (
      (kind === "minimum" && value < selectedValue) ||
      (kind === "maximum" && value > selectedValue)
    ) {
      selected = index;
      selectedValue = value;
    }
  }
  return selected;
}

function phaseAtTimeV1(
  beat: Pick<
    MainWireIntegratedModelTransientPvRawBeatV1,
    "startTimeSec" | "endTimeSec"
  >,
  timeSec: number,
): number {
  return (timeSec - beat.startTimeSec) / (beat.endTimeSec - beat.startTimeSec);
}

function logarithmicGridV1(
  minimum: number,
  maximum: number,
  count: number,
): readonly number[] {
  if (!(minimum > 0) || !(maximum >= minimum) || count < 2) {
    throw new RangeError("transient PV logarithmic grid is invalid");
  }
  const logMinimum = Math.log(minimum);
  const logSpan = Math.log(maximum) - logMinimum;
  return Object.freeze(
    Array.from({ length: count }, (_, index) =>
      Math.exp(logMinimum + logSpan * (index / (count - 1))),
    ),
  );
}

function sumV1(values: readonly number[]): number {
  let sum = 0;
  for (const value of values) sum += value;
  return sum;
}

function lerpV1(left: number, right: number, fraction: number): number {
  if (fraction === 0) return left;
  if (fraction === 1) return right;
  const delta = right - left;
  const value = left + fraction * delta;
  if (!Number.isFinite(delta) || !Number.isFinite(value)) {
    throw new Error("transient PV interpolation overflowed");
  }
  return value;
}

function requireFiniteV1(value: number, name: string): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be finite`);
  }
  return value;
}

function requireAllNumericLeavesFiniteV1(value: unknown, name: string): void {
  if (typeof value === "number") {
    requireFiniteV1(value, name);
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    requireAllNumericLeavesFiniteV1(child, `${name}.${key}`);
  }
}
