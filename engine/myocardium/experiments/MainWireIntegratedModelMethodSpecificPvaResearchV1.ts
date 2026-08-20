import {
  mainWireIntegratedModelTransientVenousReturnBeatPhaseV1,
  mainWireIntegratedModelTransientVenousReturnResistanceScaleV1,
  type MainWireIntegratedModelTransientPvRawBeatV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionPureV1";

export const MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_RESEARCH_V1_ID =
  "main-wire-integrated-model-method-specific-pva-research-v1" as const;

export const MMHG_ML_TO_JOULE_V1 = 1.33322e-4;

const VENTRICLES_V1 = Object.freeze(["LV", "RV"] as const);
const SYSTOLIC_METHODS_V1 = Object.freeze([
  "baseline-anchored-isochronal",
  "semilunar-closure",
  "minimum-volume",
  "sampled-common-support-envelope",
] as const);
const COMPACT_LOOP_SAMPLE_COUNT_V1 = 64;

export type MainWireIntegratedModelPvaVentricleV1 =
  (typeof VENTRICLES_V1)[number];
export type MainWireIntegratedModelPvaDirectionV1 = "occlusion" | "release";
export type MainWireIntegratedModelPvaSystolicMethodV1 =
  (typeof SYSTOLIC_METHODS_V1)[number];

export type MainWireIntegratedModelPvaPointV1 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

type LandmarkV1 = MainWireIntegratedModelPvaPointV1 &
  Readonly<{
    timeSec: number;
    phase01: number;
  }>;

type FlowClosureV1 =
  | Readonly<{
      status: "available";
      landmark: LandmarkV1;
      bracketSampleIndices: readonly [number, number];
    }>
  | Readonly<{
      status: "unavailable";
      reason:
        | "maximum-flow-not-positive"
        | "no-sample-after-maximum"
        | "flow-remained-positive";
    }>;

type CompactPointV1 = MainWireIntegratedModelPvaPointV1 &
  Readonly<{ phase01: number }>;

type ProjectedVentricleBeatV1 = Readonly<{
  endpointClosure: Readonly<{
    deltaVolumeMl: number;
    deltaPressureMmHg: number;
  }>;
  externalWork: Readonly<{
    acceptedOpenPathMmHgMl: number;
    straightClosureSegmentMmHgMl: number;
    closedLoopMmHgMl: number;
  }>;
  compactLoop: readonly CompactPointV1[];
  landmarks: Readonly<{
    baselineAnchoredIsochronal: LandmarkV1;
    semilunarClosure: FlowClosureV1;
    minimumVolume: LandmarkV1;
    maximumVolume: LandmarkV1;
  }>;
}>;

type ProjectedBeatV1 = Readonly<{
  beatOrdinal: number;
  phase: string;
  resistanceScaleMidpoint: number;
  LV: ProjectedVentricleBeatV1;
  RV: ProjectedVentricleBeatV1;
}>;

export type MainWireIntegratedModelPvaLinearRelationV1 = Readonly<{
  slopeMmHgPerMl: number;
  interceptMmHg: number;
  volumeAxisInterceptMl: number;
  measuredVolumeRangeMl: readonly [number, number];
  residualSumOfSquaresMmHgSquared: number | null;
  rSquared: number | null;
}>;

export type MainWireIntegratedModelPvaDiastolicReferenceV1 = Readonly<{
  method: "dynamic-maximum-volume-positive-pressure-offset-power";
  pointCount: number;
  alphaMmHgPerMlPower: number;
  beta: number;
  volumeOffsetMl: number;
  measuredVolumeRangeMl: readonly [number, number];
  rSquared: number;
}>;

type SystolicRelationOutcomeV1 =
  | Readonly<{
      status: "available";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      directionId: MainWireIntegratedModelPvaDirectionV1;
      methodId: MainWireIntegratedModelPvaSystolicMethodV1;
      pointCount: number;
      unavailablePointCount: number;
      relation: MainWireIntegratedModelPvaLinearRelationV1;
      points: readonly (MainWireIntegratedModelPvaPointV1 &
        Readonly<{ beatOrdinal: number }>)[];
    }>
  | Readonly<{
      status: "unavailable";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      directionId: MainWireIntegratedModelPvaDirectionV1;
      methodId: MainWireIntegratedModelPvaSystolicMethodV1;
      pointCount: number;
      unavailablePointCount: number;
      reason: string;
    }>;

type DiastolicRelationOutcomeV1 =
  | Readonly<{
      status: "available";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      directionId: MainWireIntegratedModelPvaDirectionV1;
      reference: MainWireIntegratedModelPvaDiastolicReferenceV1;
      points: readonly (MainWireIntegratedModelPvaPointV1 &
        Readonly<{ beatOrdinal: number }>)[];
    }>
  | Readonly<{
      status: "unavailable";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      directionId: MainWireIntegratedModelPvaDirectionV1;
      reason: string;
    }>;

export type MainWireIntegratedModelMethodSpecificPvaRowV1 =
  | Readonly<{
      status: "available";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: number;
      directionId: MainWireIntegratedModelPvaDirectionV1;
      systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
      systolicEndpoint: MainWireIntegratedModelPvaPointV1;
      systolicDiastolicIntersectionVolumeMl: number;
      externalWorkMmHgMl: number;
      potentialEnergyMmHgMl: number;
      pressureVolumeAreaMmHgMl: number;
      pressureVolumeAreaJ: number;
      endpointClosureDeltaVolumeMl: number;
      endpointClosureDeltaPressureMmHg: number;
      straightClosureSegmentWorkMmHgMl: number;
    }>
  | Readonly<{
      status: "unavailable";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: number;
      directionId: MainWireIntegratedModelPvaDirectionV1;
      systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
      reason: string;
    }>;

export type MainWireIntegratedModelMethodSpecificPvaResearchV1 = Readonly<{
  studyId: typeof MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_RESEARCH_V1_ID;
  status: "completed";
  scope: "research-only-method-specific-pva";
  pressureBasis: "ventricular-transmural";
  externalWorkRule: "accepted-trapezoidal-path-plus-straight-endpoint-closure";
  potentialEnergyRule: "integral-of-systolic-line-minus-dynamic-maximum-volume-reference";
  trajectory: Readonly<{
    beatCount: 21;
    fittingFamilies: Readonly<{
      occlusionBeatOrdinals: readonly number[];
      releaseBeatOrdinals: readonly number[];
    }>;
  }>;
  beatSummary: readonly Readonly<{
    beatOrdinal: number;
    phase: string;
    resistanceScaleMidpoint: number;
    LV: Omit<ProjectedVentricleBeatV1, "compactLoop">;
    RV: Omit<ProjectedVentricleBeatV1, "compactLoop">;
  }>[];
  systolicRelations: readonly SystolicRelationOutcomeV1[];
  diastolicReferences: readonly DiastolicRelationOutcomeV1[];
  pvaRows: readonly MainWireIntegratedModelMethodSpecificPvaRowV1[];
  summary: Readonly<{
    attemptedRowCount: number;
    availableRowCount: number;
    unavailableRowCount: number;
    selectedBeatOrdinals: readonly [1, 10, 21];
    selectedMethodSpread: readonly Readonly<{
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: 1 | 10 | 21;
      availableMethodCount: number;
      minimumPvaJ: number | null;
      maximumPvaJ: number | null;
      spreadJ: number | null;
    }>[];
  }>;
  interpretation: Readonly<{
    genericPvaEstablished: false;
    espvrEstablished: false;
    edpvrEstablished: false;
    periodicOrbitPerTransientBeatEstablished: false;
    oxygenConsumptionEstablished: false;
  }>;
}>;

export function analyzeMainWireIntegratedModelMethodSpecificPvaResearchV1(
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
): MainWireIntegratedModelMethodSpecificPvaResearchV1 {
  const beats = ownRawBeatsV1(rawBeats);
  const baselinePhases = Object.freeze({
    LV: maximumPressurePhaseV1(beats[0]!, "LV"),
    RV: maximumPressurePhaseV1(beats[0]!, "RV"),
  });
  const projected = Object.freeze(
    beats.map((beat) =>
      projectBeatV1(beat, beats[0]!.startTimeSec, baselinePhases),
    ),
  );
  const systolicRelations: SystolicRelationOutcomeV1[] = [];
  const diastolicReferences: DiastolicRelationOutcomeV1[] = [];
  const internalRelations = new Map<string, SystolicInternalV1>();
  const internalDiastolic = new Map<
    string,
    MainWireIntegratedModelPvaDiastolicReferenceV1
  >();

  for (const directionId of ["occlusion", "release"] as const) {
    const family = beatsForDirectionV1(projected, directionId);
    for (const ventricleId of VENTRICLES_V1) {
      const diastolic = fitDiastolicReferenceV1(
        family,
        directionId,
        ventricleId,
      );
      diastolicReferences.push(diastolic.outcome);
      if (diastolic.reference !== null) {
        internalDiastolic.set(
          keyV1(ventricleId, directionId),
          diastolic.reference,
        );
      }
      for (const methodId of SYSTOLIC_METHODS_V1) {
        const fitted = fitSystolicRelationV1(
          family,
          directionId,
          ventricleId,
          methodId,
        );
        systolicRelations.push(fitted.outcome);
        if (fitted.internal !== null) {
          internalRelations.set(
            keyV1(ventricleId, directionId, methodId),
            fitted.internal,
          );
        }
      }
    }
  }

  const pvaRows = Object.freeze(
    projected.flatMap((beat) => {
      const directionId: MainWireIntegratedModelPvaDirectionV1 =
        beat.beatOrdinal <= 11 ? "occlusion" : "release";
      return VENTRICLES_V1.flatMap((ventricleId) =>
        SYSTOLIC_METHODS_V1.map((methodId) =>
          pvaRowV1(
            beat,
            ventricleId,
            directionId,
            methodId,
            internalRelations.get(keyV1(ventricleId, directionId, methodId)),
            internalDiastolic.get(keyV1(ventricleId, directionId)),
          ),
        ),
      );
    }),
  );
  const availableRowCount = pvaRows.filter(
    ({ status }) => status === "available",
  ).length;
  const selectedBeatOrdinals = Object.freeze([1, 10, 21] as const);
  const selectedMethodSpread = Object.freeze(
    VENTRICLES_V1.flatMap((ventricleId) =>
      selectedBeatOrdinals.map((beatOrdinal) => {
        const values = pvaRows.flatMap((row) =>
          row.status === "available" &&
          row.ventricleId === ventricleId &&
          row.beatOrdinal === beatOrdinal
            ? [row.pressureVolumeAreaJ]
            : [],
        );
        return Object.freeze({
          ventricleId,
          beatOrdinal,
          availableMethodCount: values.length,
          minimumPvaJ: values.length > 0 ? Math.min(...values) : null,
          maximumPvaJ: values.length > 0 ? Math.max(...values) : null,
          spreadJ:
            values.length > 0
              ? Math.max(...values) - Math.min(...values)
              : null,
        });
      }),
    ),
  );

  const result = Object.freeze({
    studyId: MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_RESEARCH_V1_ID,
    status: "completed" as const,
    scope: "research-only-method-specific-pva" as const,
    pressureBasis: "ventricular-transmural" as const,
    externalWorkRule:
      "accepted-trapezoidal-path-plus-straight-endpoint-closure" as const,
    potentialEnergyRule:
      "integral-of-systolic-line-minus-dynamic-maximum-volume-reference" as const,
    trajectory: Object.freeze({
      beatCount: 21 as const,
      fittingFamilies: Object.freeze({
        occlusionBeatOrdinals: Object.freeze(
          projected.slice(0, 11).map(({ beatOrdinal }) => beatOrdinal),
        ),
        releaseBeatOrdinals: Object.freeze(
          projected.slice(10, 21).map(({ beatOrdinal }) => beatOrdinal),
        ),
      }),
    }),
    beatSummary: Object.freeze(
      projected.map((beat) => {
        const { compactLoop: _lvLoop, ...LV } = beat.LV;
        const { compactLoop: _rvLoop, ...RV } = beat.RV;
        return Object.freeze({ ...beat, LV, RV });
      }),
    ),
    systolicRelations: Object.freeze(systolicRelations),
    diastolicReferences: Object.freeze(diastolicReferences),
    pvaRows,
    summary: Object.freeze({
      attemptedRowCount: pvaRows.length,
      availableRowCount,
      unavailableRowCount: pvaRows.length - availableRowCount,
      selectedBeatOrdinals,
      selectedMethodSpread,
    }),
    interpretation: Object.freeze({
      genericPvaEstablished: false as const,
      espvrEstablished: false as const,
      edpvrEstablished: false as const,
      periodicOrbitPerTransientBeatEstablished: false as const,
      oxygenConsumptionEstablished: false as const,
    }),
  });
  requireFiniteNumericLeavesV1(result, "method-specific PVA result");
  return result;
}

export function integrateMainWireIntegratedModelPotentialEnergyV1(
  systolic: MainWireIntegratedModelPvaLinearRelationV1,
  diastolic: MainWireIntegratedModelPvaDiastolicReferenceV1,
  systolicEndpointVolumeMl: number,
):
  | Readonly<{
      status: "available";
      intersectionVolumeMl: number;
      potentialEnergyMmHgMl: number;
    }>
  | Readonly<{ status: "unavailable"; reason: string }> {
  if (!(systolic.slopeMmHgPerMl > 0)) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "systolic relation does not have positive slope",
    });
  }
  requireFiniteV1(systolicEndpointVolumeMl, "systolicEndpointVolumeMl");
  const difference = (volumeMl: number): number =>
    systolicPressureV1(systolic, volumeMl) -
    diastolicPressureV1(diastolic, volumeMl);
  const lower = Math.min(
    systolic.volumeAxisInterceptMl,
    diastolic.volumeOffsetMl,
  );
  if (
    !(systolicEndpointVolumeMl > lower) ||
    !(difference(systolicEndpointVolumeMl) > 0)
  ) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "systolic endpoint does not lie above the diastolic reference",
    });
  }
  const intersection = firstUpwardIntersectionV1(
    difference,
    lower,
    systolicEndpointVolumeMl,
  );
  if (intersection === null || !(systolicEndpointVolumeMl > intersection)) {
    return Object.freeze({
      status: "unavailable" as const,
      reason:
        "systolic and diastolic references do not close before the endpoint",
    });
  }
  for (let index = 1; index <= 128; index += 1) {
    const volumeMl =
      intersection + (index / 128) * (systolicEndpointVolumeMl - intersection);
    if (difference(volumeMl) < -1e-10) {
      return Object.freeze({
        status: "unavailable" as const,
        reason: "reference curves cross again before the systolic endpoint",
      });
    }
  }
  const systolicIntegral =
    0.5 *
    systolic.slopeMmHgPerMl *
    ((systolicEndpointVolumeMl - systolic.volumeAxisInterceptMl) ** 2 -
      (intersection - systolic.volumeAxisInterceptMl) ** 2);
  const passivePower = (volumeMl: number): number =>
    Math.max(0, volumeMl - diastolic.volumeOffsetMl) ** (diastolic.beta + 1);
  const diastolicIntegral =
    (diastolic.alphaMmHgPerMlPower / (diastolic.beta + 1)) *
    (passivePower(systolicEndpointVolumeMl) - passivePower(intersection));
  const potentialEnergyMmHgMl = systolicIntegral - diastolicIntegral;
  if (
    !Number.isFinite(potentialEnergyMmHgMl) ||
    !(potentialEnergyMmHgMl >= 0)
  ) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "potential-energy integral is non-finite or negative",
    });
  }
  return Object.freeze({
    status: "available" as const,
    intersectionVolumeMl: intersection,
    potentialEnergyMmHgMl,
  });
}

export function integrateMainWireIntegratedModelClosedPvPathWorkV1(
  points: readonly MainWireIntegratedModelPvaPointV1[],
): Readonly<{
  acceptedOpenPathMmHgMl: number;
  straightClosureSegmentMmHgMl: number;
  closedLoopMmHgMl: number;
}> {
  if (points.length < 2) {
    throw new RangeError("PV path requires at least two points");
  }
  let acceptedOpenPathMmHgMl = 0;
  for (let index = 1; index < points.length; index += 1) {
    acceptedOpenPathMmHgMl += segmentWorkV1(points[index - 1]!, points[index]!);
  }
  const straightClosureSegmentMmHgMl = segmentWorkV1(
    points[points.length - 1]!,
    points[0]!,
  );
  const closedLoopMmHgMl =
    acceptedOpenPathMmHgMl + straightClosureSegmentMmHgMl;
  for (const value of [
    acceptedOpenPathMmHgMl,
    straightClosureSegmentMmHgMl,
    closedLoopMmHgMl,
  ]) {
    requireFiniteV1(value, "PV path work");
  }
  return Object.freeze({
    acceptedOpenPathMmHgMl,
    straightClosureSegmentMmHgMl,
    closedLoopMmHgMl,
  });
}

type SystolicInternalV1 = Readonly<{
  relation: MainWireIntegratedModelPvaLinearRelationV1;
  points: readonly (MainWireIntegratedModelPvaPointV1 &
    Readonly<{ beatOrdinal: number }>)[];
}>;

function projectBeatV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  sourceTimeSec: number,
  baselinePhases: Readonly<{ LV: number; RV: number }>,
): ProjectedBeatV1 {
  const elapsedMidpointSec =
    (beat.startTimeSec + beat.endTimeSec) / 2 - sourceTimeSec;
  return Object.freeze({
    beatOrdinal: beat.beatOrdinal,
    phase: mainWireIntegratedModelTransientVenousReturnBeatPhaseV1(
      beat.beatOrdinal,
    ),
    resistanceScaleMidpoint:
      mainWireIntegratedModelTransientVenousReturnResistanceScaleV1(
        elapsedMidpointSec,
      ),
    LV: projectVentricleBeatV1(beat, "LV", baselinePhases.LV),
    RV: projectVentricleBeatV1(beat, "RV", baselinePhases.RV),
  });
}

function projectVentricleBeatV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  baselinePhase01: number,
): ProjectedVentricleBeatV1 {
  const first = beat.samples[0]![ventricleId];
  const last = beat.samples[beat.samples.length - 1]![ventricleId];
  const points = beat.samples.map((sample) =>
    Object.freeze({
      volumeMl: sample[ventricleId].volumeMl,
      pressureMmHg: sample[ventricleId].transmuralPressureMmHg,
    }),
  );
  return Object.freeze({
    endpointClosure: Object.freeze({
      deltaVolumeMl: last.volumeMl - first.volumeMl,
      deltaPressureMmHg:
        last.transmuralPressureMmHg - first.transmuralPressureMmHg,
    }),
    externalWork: integrateMainWireIntegratedModelClosedPvPathWorkV1(points),
    compactLoop: compactLoopV1(beat, ventricleId),
    landmarks: Object.freeze({
      baselineAnchoredIsochronal: landmarkAtPhaseV1(
        beat,
        ventricleId,
        baselinePhase01,
      ),
      semilunarClosure: semilunarClosureV1(beat, ventricleId),
      minimumVolume: rawLandmarkV1(
        beat,
        ventricleId,
        earliestExtremumIndexV1(
          beat,
          ventricleId,
          ({ volumeMl }) => volumeMl,
          "minimum",
        ),
      ),
      maximumVolume: rawLandmarkV1(
        beat,
        ventricleId,
        earliestExtremumIndexV1(
          beat,
          ventricleId,
          ({ volumeMl }) => volumeMl,
          "maximum",
        ),
      ),
    }),
  });
}

function fitSystolicRelationV1(
  beats: readonly ProjectedBeatV1[],
  directionId: MainWireIntegratedModelPvaDirectionV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  methodId: MainWireIntegratedModelPvaSystolicMethodV1,
): Readonly<{
  outcome: SystolicRelationOutcomeV1;
  internal: SystolicInternalV1 | null;
}> {
  const support =
    methodId === "sampled-common-support-envelope"
      ? fitSupportEnvelopeV1(beats, ventricleId)
      : null;
  const points = Object.freeze(
    beats.flatMap((beat) => {
      const point =
        support?.points.get(beat.beatOrdinal) ??
        systolicLandmarkV1(beat[ventricleId], methodId);
      return point === null
        ? []
        : [Object.freeze({ beatOrdinal: beat.beatOrdinal, ...point })];
    }),
  );
  const unavailablePointCount = beats.length - points.length;
  if (points.length < 3) {
    return Object.freeze({
      outcome: Object.freeze({
        status: "unavailable" as const,
        ventricleId,
        directionId,
        methodId,
        pointCount: points.length,
        unavailablePointCount,
        reason: "fewer than three systolic landmarks are available",
      }),
      internal: null,
    });
  }
  const relation = support?.relation ?? linearFitV1(points);
  const internal = Object.freeze({ relation, points });
  return Object.freeze({
    outcome: Object.freeze({
      status: "available" as const,
      ventricleId,
      directionId,
      methodId,
      pointCount: points.length,
      unavailablePointCount,
      relation,
      points,
    }),
    internal,
  });
}

function fitDiastolicReferenceV1(
  beats: readonly ProjectedBeatV1[],
  directionId: MainWireIntegratedModelPvaDirectionV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
): Readonly<{
  outcome: DiastolicRelationOutcomeV1;
  reference: MainWireIntegratedModelPvaDiastolicReferenceV1 | null;
}> {
  const points = Object.freeze(
    beats.map((beat) =>
      Object.freeze({
        beatOrdinal: beat.beatOrdinal,
        ...beat[ventricleId].landmarks.maximumVolume,
      }),
    ),
  );
  const positive = points.filter(({ pressureMmHg }) => pressureMmHg > 0.05);
  const fit = positive.length >= 3 ? offsetPowerFitV1(positive) : null;
  if (fit === null) {
    return Object.freeze({
      outcome: Object.freeze({
        status: "unavailable" as const,
        ventricleId,
        directionId,
        reason:
          "positive-pressure maximum-volume points do not define a stable reference",
      }),
      reference: null,
    });
  }
  const volumes = positive.map(({ volumeMl }) => volumeMl);
  const reference = Object.freeze({
    method: "dynamic-maximum-volume-positive-pressure-offset-power" as const,
    pointCount: positive.length,
    alphaMmHgPerMlPower: fit.alpha,
    beta: fit.beta,
    volumeOffsetMl: fit.volumeOffsetMl,
    measuredVolumeRangeMl: Object.freeze([
      Math.min(...volumes),
      Math.max(...volumes),
    ] as const),
    rSquared: fit.rSquared,
  });
  return Object.freeze({
    outcome: Object.freeze({
      status: "available" as const,
      ventricleId,
      directionId,
      reference,
      points,
    }),
    reference,
  });
}

function pvaRowV1(
  beat: ProjectedBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  directionId: MainWireIntegratedModelPvaDirectionV1,
  methodId: MainWireIntegratedModelPvaSystolicMethodV1,
  systolic: SystolicInternalV1 | undefined,
  diastolic: MainWireIntegratedModelPvaDiastolicReferenceV1 | undefined,
): MainWireIntegratedModelMethodSpecificPvaRowV1 {
  const unavailable = (reason: string) =>
    Object.freeze({
      status: "unavailable" as const,
      ventricleId,
      beatOrdinal: beat.beatOrdinal,
      directionId,
      systolicMethodId: methodId,
      reason,
    });
  if (systolic === undefined)
    return unavailable("systolic relation is unavailable");
  if (diastolic === undefined)
    return unavailable("diastolic reference is unavailable");
  const endpoint = systolic.points.find(
    ({ beatOrdinal }) => beatOrdinal === beat.beatOrdinal,
  );
  if (endpoint === undefined)
    return unavailable("beat-specific systolic landmark is unavailable");
  const potential = integrateMainWireIntegratedModelPotentialEnergyV1(
    systolic.relation,
    diastolic,
    endpoint.volumeMl,
  );
  if (potential.status === "unavailable") return unavailable(potential.reason);
  const projected = beat[ventricleId];
  const pressureVolumeAreaMmHgMl =
    projected.externalWork.closedLoopMmHgMl + potential.potentialEnergyMmHgMl;
  if (!Number.isFinite(pressureVolumeAreaMmHgMl)) {
    return unavailable("pressure-volume area is non-finite");
  }
  return Object.freeze({
    status: "available" as const,
    ventricleId,
    beatOrdinal: beat.beatOrdinal,
    directionId,
    systolicMethodId: methodId,
    systolicEndpoint: Object.freeze({
      volumeMl: endpoint.volumeMl,
      pressureMmHg: endpoint.pressureMmHg,
    }),
    systolicDiastolicIntersectionVolumeMl: potential.intersectionVolumeMl,
    externalWorkMmHgMl: projected.externalWork.closedLoopMmHgMl,
    potentialEnergyMmHgMl: potential.potentialEnergyMmHgMl,
    pressureVolumeAreaMmHgMl,
    pressureVolumeAreaJ: pressureVolumeAreaMmHgMl * MMHG_ML_TO_JOULE_V1,
    endpointClosureDeltaVolumeMl: projected.endpointClosure.deltaVolumeMl,
    endpointClosureDeltaPressureMmHg:
      projected.endpointClosure.deltaPressureMmHg,
    straightClosureSegmentWorkMmHgMl:
      projected.externalWork.straightClosureSegmentMmHgMl,
  });
}

function systolicLandmarkV1(
  projected: ProjectedVentricleBeatV1,
  methodId: MainWireIntegratedModelPvaSystolicMethodV1,
): MainWireIntegratedModelPvaPointV1 | null {
  switch (methodId) {
    case "baseline-anchored-isochronal":
      return projected.landmarks.baselineAnchoredIsochronal;
    case "semilunar-closure":
      return projected.landmarks.semilunarClosure.status === "available"
        ? projected.landmarks.semilunarClosure.landmark
        : null;
    case "minimum-volume":
      return projected.landmarks.minimumVolume;
    case "sampled-common-support-envelope":
      return null;
  }
}

function linearFitV1(
  points: readonly MainWireIntegratedModelPvaPointV1[],
): MainWireIntegratedModelPvaLinearRelationV1 {
  const meanVolume =
    sumV1(points.map(({ volumeMl }) => volumeMl)) / points.length;
  const meanPressure =
    sumV1(points.map(({ pressureMmHg }) => pressureMmHg)) / points.length;
  let volumeVariance = 0;
  let pressureVariance = 0;
  let covariance = 0;
  for (const point of points) {
    const dv = point.volumeMl - meanVolume;
    const dp = point.pressureMmHg - meanPressure;
    volumeVariance += dv * dv;
    pressureVariance += dp * dp;
    covariance += dv * dp;
  }
  if (!(volumeVariance > 0) || !Number.isFinite(volumeVariance)) {
    throw new Error("linear relation has no finite volume range");
  }
  const slopeMmHgPerMl = covariance / volumeVariance;
  const interceptMmHg = meanPressure - slopeMmHgPerMl * meanVolume;
  const residualSumOfSquaresMmHgSquared = sumV1(
    points.map(({ volumeMl, pressureMmHg }) => {
      const residual =
        pressureMmHg - (slopeMmHgPerMl * volumeMl + interceptMmHg);
      return residual * residual;
    }),
  );
  const volumes = points.map(({ volumeMl }) => volumeMl);
  const relation = Object.freeze({
    slopeMmHgPerMl,
    interceptMmHg,
    volumeAxisInterceptMl: -interceptMmHg / slopeMmHgPerMl,
    measuredVolumeRangeMl: Object.freeze([
      Math.min(...volumes),
      Math.max(...volumes),
    ] as const),
    residualSumOfSquaresMmHgSquared,
    rSquared:
      pressureVariance === 0
        ? residualSumOfSquaresMmHgSquared === 0
          ? 1
          : null
        : 1 - residualSumOfSquaresMmHgSquared / pressureVariance,
  });
  requireFiniteNumericLeavesV1(relation, "linear relation");
  return relation;
}

function fitSupportEnvelopeV1(
  beats: readonly ProjectedBeatV1[],
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
): Readonly<{
  relation: MainWireIntegratedModelPvaLinearRelationV1;
  points: ReadonlyMap<number, MainWireIntegratedModelPvaPointV1>;
}> {
  const coarse = logarithmicGridV1(0.05, 12, 513);
  const coarseScores = coarse.map((slope) =>
    supportScoreV1(beats, ventricleId, slope),
  );
  const coarseIndex = bestScoreIndexV1(coarseScores);
  const neighbor =
    coarseIndex === 0
      ? 1
      : coarseIndex === coarse.length - 1
        ? coarse.length - 2
        : coarseScores[coarseIndex - 1]!.score <=
            coarseScores[coarseIndex + 1]!.score
          ? coarseIndex - 1
          : coarseIndex + 1;
  const refined = logarithmicGridV1(
    coarse[Math.min(coarseIndex, neighbor)]!,
    coarse[Math.max(coarseIndex, neighbor)]!,
    257,
  );
  const refinedScores = refined.map((slope) =>
    supportScoreV1(beats, ventricleId, slope),
  );
  const selected = refinedScores[bestScoreIndexV1(refinedScores)]!;
  const intercept = Math.max(
    ...selected.contacts.map(({ intercept }) => intercept),
  );
  const points = new Map<number, MainWireIntegratedModelPvaPointV1>();
  for (const contact of selected.contacts) {
    points.set(contact.beatOrdinal, contact.point);
  }
  const relation = Object.freeze({
    slopeMmHgPerMl: selected.slope,
    interceptMmHg: intercept,
    volumeAxisInterceptMl: -intercept / selected.slope,
    measuredVolumeRangeMl: Object.freeze([
      Math.min(
        ...beats.flatMap((beat) =>
          beat[ventricleId].compactLoop.map(({ volumeMl }) => volumeMl),
        ),
      ),
      Math.max(
        ...beats.flatMap((beat) =>
          beat[ventricleId].compactLoop.map(({ volumeMl }) => volumeMl),
        ),
      ),
    ] as const),
    residualSumOfSquaresMmHgSquared: null,
    rSquared: null,
  });
  requireFiniteNumericLeavesV1(relation, "support relation");
  return Object.freeze({ relation, points });
}

type SupportScoreV1 = Readonly<{
  slope: number;
  score: number;
  contacts: readonly Readonly<{
    beatOrdinal: number;
    point: CompactPointV1;
    intercept: number;
  }>[];
}>;

function supportScoreV1(
  beats: readonly ProjectedBeatV1[],
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  slope: number,
): SupportScoreV1 {
  const contacts = Object.freeze(
    beats.map((beat) => {
      const loop = beat[ventricleId].compactLoop;
      let point = loop[0]!;
      let intercept = point.pressureMmHg - slope * point.volumeMl;
      for (let index = 1; index < loop.length; index += 1) {
        const candidate = loop[index]!;
        const candidateIntercept =
          candidate.pressureMmHg - slope * candidate.volumeMl;
        if (candidateIntercept > intercept) {
          point = candidate;
          intercept = candidateIntercept;
        }
      }
      return Object.freeze({ beatOrdinal: beat.beatOrdinal, point, intercept });
    }),
  );
  const intercepts = contacts.map(({ intercept }) => intercept);
  return Object.freeze({
    slope,
    score: Math.max(...intercepts) - Math.min(...intercepts),
    contacts,
  });
}

function bestScoreIndexV1(scores: readonly SupportScoreV1[]): number {
  let selected = 0;
  for (let index = 1; index < scores.length; index += 1) {
    if (
      scores[index]!.score < scores[selected]!.score ||
      (scores[index]!.score === scores[selected]!.score &&
        scores[index]!.slope < scores[selected]!.slope)
    ) {
      selected = index;
    }
  }
  return selected;
}

function offsetPowerFitV1(
  points: readonly MainWireIntegratedModelPvaPointV1[],
): Readonly<{
  alpha: number;
  beta: number;
  volumeOffsetMl: number;
  rSquared: number;
}> | null {
  const volumes = points.map(({ volumeMl }) => volumeMl);
  const minimum = Math.min(...volumes);
  const maximum = Math.max(...volumes);
  if (!(maximum > minimum)) return null;
  const span = maximum - minimum;
  let best: Readonly<{
    alpha: number;
    beta: number;
    volumeOffsetMl: number;
    predictions: readonly number[];
    squaredError: number;
  }> | null = null;
  for (let offsetOrdinal = 0; offsetOrdinal <= 120; offsetOrdinal += 1) {
    const volumeOffsetMl =
      minimum - span * (0.05 + 1.45 * (offsetOrdinal / 120));
    for (let betaOrdinal = 0; betaOrdinal <= 120; betaOrdinal += 1) {
      const beta = 1.5 + betaOrdinal * 0.025;
      const powers = points.map(
        ({ volumeMl }) => Math.max(1e-9, volumeMl - volumeOffsetMl) ** beta,
      );
      const denominator = sumV1(powers.map((value) => value * value));
      if (!(denominator > 0)) continue;
      const alpha =
        sumV1(
          powers.map((value, index) => value * points[index]!.pressureMmHg),
        ) / denominator;
      if (!(alpha > 0) || !Number.isFinite(alpha)) continue;
      const predictions = Object.freeze(powers.map((value) => alpha * value));
      const squaredError = sumV1(
        predictions.map(
          (value, index) => (value - points[index]!.pressureMmHg) ** 2,
        ),
      );
      if (best === null || squaredError < best.squaredError) {
        best = Object.freeze({
          alpha,
          beta,
          volumeOffsetMl,
          predictions,
          squaredError,
        });
      }
    }
  }
  if (best === null) return null;
  return Object.freeze({
    alpha: best.alpha,
    beta: best.beta,
    volumeOffsetMl: best.volumeOffsetMl,
    rSquared: rSquaredV1(
      points.map(({ pressureMmHg }) => pressureMmHg),
      best.predictions,
    ),
  });
}

function semilunarClosureV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
): FlowClosureV1 {
  const flows = beat.samples.map(
    (sample) => sample[ventricleId].semilunarFlowMlPerSec,
  );
  let maximumIndex = 0;
  for (let index = 1; index < flows.length; index += 1) {
    if (flows[index]! > flows[maximumIndex]!) maximumIndex = index;
  }
  if (!(flows[maximumIndex]! > 0)) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "maximum-flow-not-positive" as const,
    });
  }
  if (maximumIndex === flows.length - 1) {
    return Object.freeze({
      status: "unavailable" as const,
      reason: "no-sample-after-maximum" as const,
    });
  }
  for (let right = maximumIndex + 1; right < flows.length; right += 1) {
    const left = right - 1;
    const leftFlow = flows[left]!;
    const rightFlow = flows[right]!;
    if (leftFlow > 0 && rightFlow <= 0) {
      const fraction = leftFlow / (leftFlow - rightFlow);
      const leftSample = beat.samples[left]!;
      const rightSample = beat.samples[right]!;
      const timeSec = lerpV1(leftSample.timeSec, rightSample.timeSec, fraction);
      return Object.freeze({
        status: "available" as const,
        landmark: Object.freeze({
          timeSec,
          phase01: phaseAtTimeV1(beat, timeSec),
          volumeMl: lerpV1(
            leftSample[ventricleId].volumeMl,
            rightSample[ventricleId].volumeMl,
            fraction,
          ),
          pressureMmHg: lerpV1(
            leftSample[ventricleId].transmuralPressureMmHg,
            rightSample[ventricleId].transmuralPressureMmHg,
            fraction,
          ),
        }),
        bracketSampleIndices: Object.freeze([left, right] as const),
      });
    }
  }
  return Object.freeze({
    status: "unavailable" as const,
    reason: "flow-remained-positive" as const,
  });
}

function compactLoopV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
): readonly CompactPointV1[] {
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

function landmarkAtPhaseV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  phase01: number,
): LandmarkV1 {
  const timeSec =
    beat.startTimeSec + phase01 * (beat.endTimeSec - beat.startTimeSec);
  return Object.freeze({
    timeSec,
    phase01,
    ...interpolatePointAtTimeV1(beat, ventricleId, timeSec),
  });
}

function rawLandmarkV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  index: number,
): LandmarkV1 {
  const sample = beat.samples[index]!;
  return Object.freeze({
    timeSec: sample.timeSec,
    phase01: phaseAtTimeV1(beat, sample.timeSec),
    volumeMl: sample[ventricleId].volumeMl,
    pressureMmHg: sample[ventricleId].transmuralPressureMmHg,
  });
}

function maximumPressurePhaseV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
): number {
  return phaseAtTimeV1(
    beat,
    beat.samples[
      earliestExtremumIndexV1(
        beat,
        ventricleId,
        ({ transmuralPressureMmHg }) => transmuralPressureMmHg,
        "maximum",
      )
    ]!.timeSec,
  );
}

function earliestExtremumIndexV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  value: (
    sample: MainWireIntegratedModelTransientPvRawBeatV1["samples"][number][MainWireIntegratedModelPvaVentricleV1],
  ) => number,
  mode: "minimum" | "maximum",
): number {
  let selected = 0;
  for (let index = 1; index < beat.samples.length; index += 1) {
    const candidate = value(beat.samples[index]![ventricleId]);
    const current = value(beat.samples[selected]![ventricleId]);
    if (mode === "minimum" ? candidate < current : candidate > current) {
      selected = index;
    }
  }
  return selected;
}

function interpolatePointAtTimeV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  timeSec: number,
): MainWireIntegratedModelPvaPointV1 {
  if (timeSec <= beat.samples[0]!.timeSec) {
    return pointFromSampleV1(beat.samples[0]![ventricleId]);
  }
  const last = beat.samples[beat.samples.length - 1]!;
  if (timeSec >= last.timeSec) return pointFromSampleV1(last[ventricleId]);
  let right = 1;
  while (beat.samples[right]!.timeSec < timeSec) right += 1;
  const leftSample = beat.samples[right - 1]!;
  const rightSample = beat.samples[right]!;
  const fraction =
    (timeSec - leftSample.timeSec) / (rightSample.timeSec - leftSample.timeSec);
  return Object.freeze({
    volumeMl: lerpV1(
      leftSample[ventricleId].volumeMl,
      rightSample[ventricleId].volumeMl,
      fraction,
    ),
    pressureMmHg: lerpV1(
      leftSample[ventricleId].transmuralPressureMmHg,
      rightSample[ventricleId].transmuralPressureMmHg,
      fraction,
    ),
  });
}

function pointFromSampleV1(
  sample: MainWireIntegratedModelTransientPvRawBeatV1["samples"][number][MainWireIntegratedModelPvaVentricleV1],
): MainWireIntegratedModelPvaPointV1 {
  return Object.freeze({
    volumeMl: sample.volumeMl,
    pressureMmHg: sample.transmuralPressureMmHg,
  });
}

function ownRawBeatsV1(
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
): readonly MainWireIntegratedModelTransientPvRawBeatV1[] {
  if (rawBeats.length !== 21) {
    throw new RangeError("method-specific PVA requires exactly 21 beats");
  }
  return Object.freeze(
    rawBeats.map((beat, beatIndex) => {
      if (beat.beatOrdinal !== beatIndex + 1 || beat.samples.length < 2) {
        throw new Error(
          "transient beats must retain ordinal order and samples",
        );
      }
      if (
        beatIndex > 0 &&
        beat.startTimeSec !== rawBeats[beatIndex - 1]!.endTimeSec
      ) {
        throw new Error("transient beats must be contiguous");
      }
      let previousTime = Number.NEGATIVE_INFINITY;
      for (const sample of beat.samples) {
        requireFiniteV1(sample.timeSec, "sample.timeSec");
        if (!(sample.timeSec > previousTime)) {
          throw new Error("accepted sample times must increase strictly");
        }
        previousTime = sample.timeSec;
        for (const ventricleId of VENTRICLES_V1) {
          for (const value of Object.values(sample[ventricleId])) {
            requireFiniteV1(value, `sample.${ventricleId}`);
          }
        }
      }
      return beat;
    }),
  );
}

function beatsForDirectionV1(
  beats: readonly ProjectedBeatV1[],
  directionId: MainWireIntegratedModelPvaDirectionV1,
): readonly ProjectedBeatV1[] {
  return directionId === "occlusion" ? beats.slice(0, 11) : beats.slice(10, 21);
}

function systolicPressureV1(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  volumeMl: number,
): number {
  return relation.slopeMmHgPerMl * volumeMl + relation.interceptMmHg;
}

function diastolicPressureV1(
  reference: MainWireIntegratedModelPvaDiastolicReferenceV1,
  volumeMl: number,
): number {
  return (
    reference.alphaMmHgPerMlPower *
    Math.max(0, volumeMl - reference.volumeOffsetMl) ** reference.beta
  );
}

function firstUpwardIntersectionV1(
  difference: (volumeMl: number) => number,
  lower: number,
  upper: number,
): number | null {
  const subdivisions = 512;
  let left = lower;
  let leftValue = difference(left);
  for (let index = 1; index <= subdivisions; index += 1) {
    const right = lower + (index / subdivisions) * (upper - lower);
    const rightValue = difference(right);
    if (leftValue <= 0 && rightValue >= 0) {
      if (leftValue === 0) return left;
      let lo = left;
      let hi = right;
      for (let iteration = 0; iteration < 80; iteration += 1) {
        const mid = (lo + hi) / 2;
        if (difference(mid) >= 0) hi = mid;
        else lo = mid;
      }
      return (lo + hi) / 2;
    }
    left = right;
    leftValue = rightValue;
  }
  return null;
}

function segmentWorkV1(
  left: MainWireIntegratedModelPvaPointV1,
  right: MainWireIntegratedModelPvaPointV1,
): number {
  const work =
    -0.5 *
    (left.pressureMmHg + right.pressureMmHg) *
    (right.volumeMl - left.volumeMl);
  return work === 0 ? 0 : work;
}

function phaseAtTimeV1(
  beat: MainWireIntegratedModelTransientPvRawBeatV1,
  timeSec: number,
): number {
  return (timeSec - beat.startTimeSec) / (beat.endTimeSec - beat.startTimeSec);
}

function lerpV1(left: number, right: number, fraction: number): number {
  if (fraction === 0) return left;
  if (fraction === 1) return right;
  return left + fraction * (right - left);
}

function logarithmicGridV1(
  minimum: number,
  maximum: number,
  count: number,
): readonly number[] {
  const logMinimum = Math.log(minimum);
  const logSpan = Math.log(maximum) - logMinimum;
  return Object.freeze(
    Array.from({ length: count }, (_, index) =>
      Math.exp(logMinimum + logSpan * (index / (count - 1))),
    ),
  );
}

function rSquaredV1(
  observed: readonly number[],
  predicted: readonly number[],
): number {
  const mean = sumV1(observed) / observed.length;
  const total = sumV1(observed.map((value) => (value - mean) ** 2));
  const residual = sumV1(
    observed.map((value, index) => (value - predicted[index]!) ** 2),
  );
  if (!(total > 1e-12)) return residual <= 1e-12 ? 1 : 0;
  return Math.max(0, Math.min(1, 1 - residual / total));
}

function sumV1(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

function keyV1(
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  directionId: MainWireIntegratedModelPvaDirectionV1,
  methodId?: MainWireIntegratedModelPvaSystolicMethodV1,
): string {
  return `${ventricleId}:${directionId}${methodId === undefined ? "" : `:${methodId}`}`;
}

function requireFiniteV1(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}

function requireFiniteNumericLeavesV1(value: unknown, name: string): void {
  if (typeof value === "number") {
    requireFiniteV1(value, name);
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const child of Object.values(value)) {
    requireFiniteNumericLeavesV1(child, name);
  }
}
