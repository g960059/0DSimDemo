import type {
  MainWireIntegratedModelPressureVolumeLoopPointV3,
  MainWireIntegratedModelStarlingLocusV3,
  MainWireIntegratedModelStarlingPointV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";

export const MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_V3_ID =
  "main-wire-integrated-model-multi-load-pv-loop-envelope-preview-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_SEMANTICS_V3 =
  "responsive-fixed-tbv-multi-load-pv-loop-support-envelope-preview-not-validated-espvr-edpvr" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATION_SEMANTICS_V3 =
  "periodic-fixed-tbv-multi-load-pv-loop-support-envelope-formal-analysis-not-clinical-validation" as const;

export type MainWireIntegratedModelRapidPvCurvePointV3 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

export type MainWireIntegratedModelRapidPvLandmarkV3 =
  MainWireIntegratedModelRapidPvCurvePointV3 & Readonly<{
    totalBloodVolumeRatio: number;
    role: MainWireIntegratedModelStarlingPointV3["role"];
    event: "pv-loop-support-contact" | "maximum-volume";
    includedInFit: boolean;
  }>;

type RapidRelationCommonV3 = Readonly<{
  relationId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_V3_ID;
  semantics:
    | typeof MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_SEMANTICS_V3
    | typeof MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATION_SEMANTICS_V3;
  analysisMode: "responsive-preview" | "formal-periodic";
  pressureBasis: "transmural";
  sampledPointCount: number;
  sampledLoopCount: number;
  bilateralLoadCoverage: boolean;
}>;

export type MainWireIntegratedModelRapidPressureVolumeRelationV3 =
  | (RapidRelationCommonV3 & Readonly<{
      status: "insufficient-data";
      reason: string;
      systolicEnvelopeLandmarks: readonly [];
      maximumVolumeLandmarks: readonly [];
      systolicEnvelopeTrendCurve: readonly [];
      maximumVolumeTrendCurve: readonly [];
    }>)
  | (RapidRelationCommonV3 & Readonly<{
      status:
        | "collecting-preview"
        | "complete-preview"
        | "collecting-formal"
        | "complete-formal";
      sampledTbvRangeMl: readonly [number, number];
      sampledVolumeRangeMl: readonly [number, number];
      systolicEnvelope: Readonly<{
        method:
          | "responsive-multi-load-pv-loop-support-envelope"
          | "formal-periodic-multi-load-pv-loop-support-envelope";
        elastanceMmHgPerMl: number;
        extrapolatedVolumeAxisInterceptMl: number;
        measuredVolumeRangeMl: readonly [number, number];
        maximumInterLoopSupportGapMmHg: number;
        maximumLoopPenetrationMmHg: number;
        rSquared: number;
      }>;
      maximumVolume: Readonly<{
        method: "positive-pressure-offset-power-grid-fit";
        alpha: number;
        beta: number;
        extrapolatedZeroPressureVolumeMl: number;
        measuredVolumeRangeMl: readonly [number, number];
        parameterBoundaryHit: boolean;
        rSquared: number;
      }>;
      systolicEnvelopeLandmarks:
        readonly MainWireIntegratedModelRapidPvLandmarkV3[];
      maximumVolumeLandmarks:
        readonly MainWireIntegratedModelRapidPvLandmarkV3[];
      systolicEnvelopeTrendCurve:
        readonly MainWireIntegratedModelRapidPvCurvePointV3[];
      maximumVolumeTrendCurve:
        readonly MainWireIntegratedModelRapidPvCurvePointV3[];
    }>);

const MINIMUM_FIT_POINT_COUNT_V3 = 3;
const MINIMUM_LOOP_SAMPLE_COUNT_V3 = 12;
const LOCAL_MINIMUM_TBV_RATIO_V3 = 0.72;
const LOCAL_MAXIMUM_TBV_RATIO_V3 = 1.24;
const CURVE_SAMPLE_COUNT_V3 = 64;
const SUPPORT_SLOPE_GRID_COUNT_V3 = 480;
const SUPPORT_SLOPE_REFINEMENT_COUNT_V3 = 160;
const MINIMUM_SUPPORT_CONTACT_PRESSURE_FRACTION_V3 = 0.35;
const RAPID_RELATION_CACHE_V3 = new WeakMap<
  object,
  MainWireIntegratedModelRapidPressureVolumeRelationV3
>();

type LoopSupportV3 = Readonly<{
  point: MainWireIntegratedModelStarlingPointV3;
  interceptMmHg: number;
  contact: MainWireIntegratedModelPressureVolumeLoopPointV3;
}>;

type SupportEnvelopeFitV3 = Readonly<{
  slope: number;
  intercept: number;
  contacts: readonly LoopSupportV3[];
  maximumInterLoopSupportGapMmHg: number;
  maximumLoopPenetrationMmHg: number;
  rSquared: number;
}>;

/**
 * Builds an ephemeral relation from complete fixed-TBV PV loops. The systolic
 * line is a common upper-left support envelope: its slope minimizes the
 * between-load support-intercept spread and its intercept is raised to the
 * outermost loop, so the displayed line cannot cut through any sampled loop.
 */
export function buildMainWireIntegratedModelRapidPressureVolumeRelationV3(
  locus: MainWireIntegratedModelStarlingLocusV3,
): MainWireIntegratedModelRapidPressureVolumeRelationV3 {
  const cached = RAPID_RELATION_CACHE_V3.get(locus);
  if (cached !== undefined) return cached;
  const relation = buildUncachedRapidPressureVolumeRelationV3(locus);
  RAPID_RELATION_CACHE_V3.set(locus, relation);
  return relation;
}

function buildUncachedRapidPressureVolumeRelationV3(
  locus: MainWireIntegratedModelStarlingLocusV3,
): MainWireIntegratedModelRapidPressureVolumeRelationV3 {
  if (
    locus.status !== "responsive-fixed-tbv-preview" &&
    locus.status !== "measured-fixed-tbv-protocol"
  ) {
    return insufficientV3(
      0,
      false,
      "fixed-TBV pressure-volume loops are unavailable",
    );
  }
  const formal = locus.status === "measured-fixed-tbv-protocol";
  const analysisMode = formal ? "formal-periodic" : "responsive-preview";
  const anchor = locus.points.find(({ role }) => role === "operating-anchor");
  if (anchor === undefined || !(anchor.totalBloodVolumeMl > 0)) {
    return insufficientV3(
      0,
      false,
      "operating-point TBV anchor is unavailable",
      analysisMode,
    );
  }
  if (
    !formal && (
      anchor.settled !== true ||
      anchor.evidence !== "responsive-settled-anchor" ||
      anchor.measurementWindowStatus !== "responsive-period1-settled"
    )
  ) {
    return insufficientV3(
      0,
      false,
      "responsive preview requires a locally period-1-settled operating anchor",
      analysisMode,
    );
  }
  const points = locus.points.filter((point) =>
    rapidRelationPointEligibleV3(point, anchor.totalBloodVolumeMl) &&
    (!formal || (
      point.settled === true && point.evidence === "qualified-periodic"
    )));
  const bilateralLoadCoverage = hasBilateralLoadCoverageV3(
    points,
    anchor.totalBloodVolumeMl,
  );
  if (points.length < MINIMUM_FIT_POINT_COUNT_V3) {
    return insufficientV3(
      points.length,
      bilateralLoadCoverage,
      "at least three complete local fixed-TBV PV loops are required",
      analysisMode,
    );
  }
  if (!bilateralLoadCoverage) {
    return insufficientV3(
      points.length,
      false,
      "at least one eligible loop is required on each side of the operating anchor",
      analysisMode,
    );
  }

  const closureSeed = linearFitV3(points.flatMap((point) => {
    const landmark = point.ventricularPressureVolumeLandmarks.endSystolic;
    return landmark.event === "semilunar-valve-closure" ? [landmark] : [];
  }));
  const systolicEnvelope = multiLoadPvLoopSupportEnvelopeFitV3(
    points,
    closureSeed?.slope ?? 2,
  );
  const diastolic = points
    .map(({ ventricularPressureVolumeLandmarks }) =>
      ventricularPressureVolumeLandmarks.endDiastolic)
    .filter(({ pressureMmHg }) => pressureMmHg > 0.05);
  const endDiastolic = offsetPowerFitV3(diastolic);
  if (
    systolicEnvelope === null ||
    diastolic.length < MINIMUM_FIT_POINT_COUNT_V3 ||
    endDiastolic === null
  ) {
    return insufficientV3(
      points.length,
      bilateralLoadCoverage,
      "complete PV loops or positive-pressure maximum-volume points do not define stable envelopes",
      analysisMode,
    );
  }

  const contactVolumes = systolicEnvelope.contacts.map(({ contact }) =>
    contact.volumeMl);
  const systolicVolumeRange = finiteRangeV3(contactVolumes)!;
  const diastolicVolumeRange = finiteRangeV3(
    diastolic.map(({ volumeMl }) => volumeMl),
  )!;
  const allLoopVolumes = points.flatMap(({ ventricularPressureVolumeLoop }) =>
    ventricularPressureVolumeLoop.map(({ volumeMl }) => volumeMl));
  const volumeRange = finiteRangeV3([
    ...allLoopVolumes,
    ...diastolic.map(({ volumeMl }) => volumeMl),
  ])!;
  const tbvRange = finiteRangeV3(points.map(({ totalBloodVolumeMl }) =>
    totalBloodVolumeMl))!;
  const systolicVolumeAxisInterceptMl =
    -systolicEnvelope.intercept / systolicEnvelope.slope;
  const maximumVolumeLandmarks = points.map((point) => landmarkV3(
    point,
    anchor.totalBloodVolumeMl,
    point.ventricularPressureVolumeLandmarks.endDiastolic,
    "maximum-volume",
  ));
  const systolicEnvelopeLandmarks = systolicEnvelope.contacts.map(
    ({ point, contact }) => landmarkV3(
      point,
      anchor.totalBloodVolumeMl,
      contact,
      "pv-loop-support-contact",
    ),
  );
  const status = formal
    ? locus.completedPointCount === locus.totalPointCount
      ? ("complete-formal" as const)
      : ("collecting-formal" as const)
    : locus.completedPointCount === locus.totalPointCount
      ? ("complete-preview" as const)
      : ("collecting-preview" as const);
  return Object.freeze({
    relationId:
      MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_V3_ID,
    semantics: formal
      ? MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATION_SEMANTICS_V3
      : MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_SEMANTICS_V3,
    analysisMode,
    status,
    pressureBasis: "transmural" as const,
    sampledPointCount: points.length,
    sampledLoopCount: points.length,
    bilateralLoadCoverage,
    sampledTbvRangeMl: tbvRange,
    sampledVolumeRangeMl: volumeRange,
    systolicEnvelope: Object.freeze({
      method: formal
        ? ("formal-periodic-multi-load-pv-loop-support-envelope" as const)
        : ("responsive-multi-load-pv-loop-support-envelope" as const),
      elastanceMmHgPerMl: systolicEnvelope.slope,
      extrapolatedVolumeAxisInterceptMl: systolicVolumeAxisInterceptMl,
      measuredVolumeRangeMl: systolicVolumeRange,
      maximumInterLoopSupportGapMmHg:
        systolicEnvelope.maximumInterLoopSupportGapMmHg,
      maximumLoopPenetrationMmHg:
        systolicEnvelope.maximumLoopPenetrationMmHg,
      rSquared: systolicEnvelope.rSquared,
    }),
    maximumVolume: Object.freeze({
      method: "positive-pressure-offset-power-grid-fit" as const,
      alpha: endDiastolic.alpha,
      beta: endDiastolic.beta,
      extrapolatedZeroPressureVolumeMl: endDiastolic.volumeOffsetMl,
      measuredVolumeRangeMl: diastolicVolumeRange,
      parameterBoundaryHit:
        Math.abs(endDiastolic.beta - 1.5) < 1e-12 ||
        Math.abs(endDiastolic.beta - 4.5) < 1e-12,
      rSquared: endDiastolic.rSquared,
    }),
    systolicEnvelopeLandmarks: Object.freeze(systolicEnvelopeLandmarks),
    maximumVolumeLandmarks: Object.freeze(maximumVolumeLandmarks),
    systolicEnvelopeTrendCurve: sampleFromInterceptThroughObservedRangeV3(
      systolicVolumeAxisInterceptMl,
      systolicVolumeRange,
      (volumeMl) => Math.max(
        0,
        systolicEnvelope.slope * volumeMl + systolicEnvelope.intercept,
      ),
    ),
    maximumVolumeTrendCurve: sampleFromInterceptThroughObservedRangeV3(
      endDiastolic.volumeOffsetMl,
      diastolicVolumeRange,
      (volumeMl) => endDiastolic.alpha * Math.pow(
        Math.max(0, volumeMl - endDiastolic.volumeOffsetMl),
        endDiastolic.beta,
      ),
    ),
  });
}

function rapidRelationPointEligibleV3(
  point: MainWireIntegratedModelStarlingPointV3,
  anchorTbvMl: number,
): boolean {
  const ratio = point.totalBloodVolumeMl / anchorTbvMl;
  const landmarks = point.ventricularPressureVolumeLandmarks;
  return point.curveEligible &&
    ratio >= LOCAL_MINIMUM_TBV_RATIO_V3 &&
    ratio <= LOCAL_MAXIMUM_TBV_RATIO_V3 &&
    landmarks.pressureBasis === "transmural" &&
    point.ventricularPressureVolumeLoop.length >= MINIMUM_LOOP_SAMPLE_COUNT_V3 &&
    point.ventricularPressureVolumeLoop.every(({ volumeMl, pressureMmHg }) =>
      Number.isFinite(volumeMl) && Number.isFinite(pressureMmHg)) &&
    [
      landmarks.endDiastolic.volumeMl,
      landmarks.endDiastolic.pressureMmHg,
    ].every(Number.isFinite);
}

function insufficientV3(
  sampledPointCount: number,
  bilateralLoadCoverage: boolean,
  reason: string,
  analysisMode: "responsive-preview" | "formal-periodic" =
    "responsive-preview",
): MainWireIntegratedModelRapidPressureVolumeRelationV3 {
  return Object.freeze({
    relationId:
      MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_V3_ID,
    semantics: analysisMode === "formal-periodic"
      ? MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATION_SEMANTICS_V3
      : MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_SEMANTICS_V3,
    analysisMode,
    status: "insufficient-data" as const,
    pressureBasis: "transmural" as const,
    sampledPointCount,
    sampledLoopCount: sampledPointCount,
    bilateralLoadCoverage,
    reason,
    systolicEnvelopeLandmarks: Object.freeze([] as const),
    maximumVolumeLandmarks: Object.freeze([] as const),
    systolicEnvelopeTrendCurve: Object.freeze([] as const),
    maximumVolumeTrendCurve: Object.freeze([] as const),
  });
}

function hasBilateralLoadCoverageV3(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  anchorTbvMl: number,
): boolean {
  return points.some(({ totalBloodVolumeMl }) =>
    totalBloodVolumeMl < anchorTbvMl * (1 - 1e-9)) &&
    points.some(({ totalBloodVolumeMl }) =>
      totalBloodVolumeMl > anchorTbvMl * (1 + 1e-9));
}

function landmarkV3(
  point: MainWireIntegratedModelStarlingPointV3,
  anchorTbvMl: number,
  landmark: Readonly<{ volumeMl: number; pressureMmHg: number }>,
  event: MainWireIntegratedModelRapidPvLandmarkV3["event"],
): MainWireIntegratedModelRapidPvLandmarkV3 {
  return Object.freeze({
    volumeMl: landmark.volumeMl,
    pressureMmHg: landmark.pressureMmHg,
    totalBloodVolumeRatio: point.totalBloodVolumeMl / anchorTbvMl,
    role: point.role,
    event,
    includedInFit: true,
  });
}

function multiLoadPvLoopSupportEnvelopeFitV3(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  seedSlope: number,
): SupportEnvelopeFitV3 | null {
  if (points.length < MINIMUM_FIT_POINT_COUNT_V3) return null;
  const safeSeedSlope = Number.isFinite(seedSlope) && seedSlope > 0
    ? Math.max(0.1, Math.min(8, seedSlope))
    : 2;
  const minimumSlope = Math.max(0.08, Math.min(0.5, safeSeedSlope * 0.25));
  const maximumSlope = Math.min(12, Math.max(4, safeSeedSlope * 4));
  const logarithmicMinimum = Math.log(minimumSlope);
  const logarithmicMaximum = Math.log(maximumSlope);
  const evaluate = (slope: number) => evaluateSupportSlopeV3(
    points,
    slope,
    safeSeedSlope,
  );
  let best: ReturnType<typeof evaluate> = null;
  let bestOrdinal = 0;
  for (let ordinal = 0; ordinal <= SUPPORT_SLOPE_GRID_COUNT_V3; ordinal += 1) {
    const slope = Math.exp(
      logarithmicMinimum +
        ordinal / SUPPORT_SLOPE_GRID_COUNT_V3 *
          (logarithmicMaximum - logarithmicMinimum),
    );
    const candidate = evaluate(slope);
    if (candidate !== null && (best === null || candidate.score < best.score)) {
      best = candidate;
      bestOrdinal = ordinal;
    }
  }
  if (best === null) return null;
  const coarseStep =
    (logarithmicMaximum - logarithmicMinimum) / SUPPORT_SLOPE_GRID_COUNT_V3;
  const refinementCenter = logarithmicMinimum + bestOrdinal * coarseStep;
  for (
    let ordinal = -SUPPORT_SLOPE_REFINEMENT_COUNT_V3;
    ordinal <= SUPPORT_SLOPE_REFINEMENT_COUNT_V3;
    ordinal += 1
  ) {
    const logarithmicSlope = refinementCenter +
      ordinal / SUPPORT_SLOPE_REFINEMENT_COUNT_V3 * coarseStep;
    const candidate = evaluate(Math.exp(logarithmicSlope));
    if (candidate !== null && candidate.score < best.score) best = candidate;
  }
  const intercepts = best.supports.map(({ interceptMmHg }) => interceptMmHg);
  const intercept = Math.max(...intercepts);
  const maximumInterLoopSupportGapMmHg = intercept - Math.min(...intercepts);
  const observed = best.supports.map(({ contact }) => contact.pressureMmHg);
  const predicted = best.supports.map(({ contact }) =>
    best.slope * contact.volumeMl + intercept);
  const maximumLoopPenetrationMmHg = Math.max(
    0,
    ...points.flatMap(({ ventricularPressureVolumeLoop }) =>
      ventricularPressureVolumeLoop.map(({ volumeMl, pressureMmHg }) =>
        pressureMmHg - (best!.slope * volumeMl + intercept))),
  );
  return Object.freeze({
    slope: best.slope,
    intercept,
    contacts: Object.freeze(best.supports),
    maximumInterLoopSupportGapMmHg,
    maximumLoopPenetrationMmHg,
    rSquared: rSquaredV3(observed, predicted),
  });
}

function evaluateSupportSlopeV3(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  slope: number,
  seedSlope: number,
): Readonly<{
  slope: number;
  score: number;
  supports: readonly LoopSupportV3[];
}> | null {
  if (!Number.isFinite(slope) || !(slope > 0)) return null;
  const supports: LoopSupportV3[] = [];
  const loopMaximumPressures: number[] = [];
  const allVolumes: number[] = [];
  for (const point of points) {
    const loop = point.ventricularPressureVolumeLoop;
    const maximumPressure = Math.max(...loop.map(({ pressureMmHg }) =>
      pressureMmHg));
    let contact = loop[0]!;
    let supportIntercept = contact.pressureMmHg - slope * contact.volumeMl;
    for (const sample of loop.slice(1)) {
      const intercept = sample.pressureMmHg - slope * sample.volumeMl;
      if (intercept > supportIntercept) {
        contact = sample;
        supportIntercept = intercept;
      }
    }
    if (
      !(maximumPressure > 0) ||
      contact.pressureMmHg <
        maximumPressure * MINIMUM_SUPPORT_CONTACT_PRESSURE_FRACTION_V3
    ) return null;
    supports.push(Object.freeze({
      point,
      interceptMmHg: supportIntercept,
      contact,
    }));
    loopMaximumPressures.push(maximumPressure);
    allVolumes.push(...loop.map(({ volumeMl }) => volumeMl));
  }
  const intercepts = supports.map(({ interceptMmHg }) => interceptMmHg);
  const commonIntercept = Math.max(...intercepts);
  const volumeRange = finiteRangeV3(allVolumes);
  if (volumeRange === null || !(volumeRange[1] > volumeRange[0])) return null;
  const volumeAxisIntercept = -commonIntercept / slope;
  if (
    !(volumeAxisIntercept < volumeRange[0] - 0.25) ||
    volumeAxisIntercept < volumeRange[0] - 3 * (volumeRange[1] - volumeRange[0])
  ) return null;
  const supportSpread = commonIntercept - Math.min(...intercepts);
  const pressureScale = Math.max(
    1,
    loopMaximumPressures.reduce((sum, value) => sum + value, 0) /
      loopMaximumPressures.length,
  );
  const seedPenalty = 0.002 * Math.abs(Math.log(slope / seedSlope));
  return Object.freeze({
    slope,
    score: supportSpread / pressureScale + seedPenalty,
    supports: Object.freeze(supports),
  });
}

function linearFitV3(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): Readonly<{ slope: number; intercept: number; rSquared: number }> | null {
  if (points.length < 2) return null;
  const meanX = points.reduce((sum, point) => sum + point.volumeMl, 0) /
    points.length;
  const meanY = points.reduce((sum, point) => sum + point.pressureMmHg, 0) /
    points.length;
  const covariance = points.reduce((sum, point) =>
    sum + (point.volumeMl - meanX) * (point.pressureMmHg - meanY), 0);
  const variance = points.reduce((sum, point) =>
    sum + (point.volumeMl - meanX) ** 2, 0);
  if (!(variance > 1e-9)) return null;
  const slope = covariance / variance;
  const intercept = meanY - slope * meanX;
  if (!(slope > 1e-9) || !Number.isFinite(intercept)) return null;
  return Object.freeze({
    slope,
    intercept,
    rSquared: rSquaredV3(
      points.map(({ pressureMmHg }) => pressureMmHg),
      points.map(({ volumeMl }) => slope * volumeMl + intercept),
    ),
  });
}

function offsetPowerFitV3(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): Readonly<{
  alpha: number;
  beta: number;
  volumeOffsetMl: number;
  rSquared: number;
}> | null {
  const range = finiteRangeV3(points.map(({ volumeMl }) => volumeMl));
  if (range === null || !(range[1] > range[0])) return null;
  const span = range[1] - range[0];
  let best: Readonly<{
    alpha: number;
    beta: number;
    volumeOffsetMl: number;
    predictions: readonly number[];
    squaredError: number;
  }> | null = null;
  for (let offsetOrdinal = 0; offsetOrdinal <= 120; offsetOrdinal += 1) {
    const fraction = offsetOrdinal / 120;
    const volumeOffsetMl = range[0] - span * (0.05 + 1.45 * fraction);
    for (let betaOrdinal = 0; betaOrdinal <= 120; betaOrdinal += 1) {
      const beta = 1.5 + betaOrdinal * 0.025;
      const powers = points.map(({ volumeMl }) =>
        Math.pow(Math.max(1e-9, volumeMl - volumeOffsetMl), beta));
      const denominator = powers.reduce((sum, value) => sum + value * value, 0);
      if (!(denominator > 0)) continue;
      const alpha = powers.reduce((sum, value, index) =>
        sum + value * points[index]!.pressureMmHg, 0) / denominator;
      if (!(alpha > 0) || !Number.isFinite(alpha)) continue;
      const predictions = powers.map((value) => alpha * value);
      const squaredError = predictions.reduce((sum, value, index) =>
        sum + (value - points[index]!.pressureMmHg) ** 2, 0);
      if (best === null || squaredError < best.squaredError) {
        best = Object.freeze({
          alpha,
          beta,
          volumeOffsetMl,
          predictions: Object.freeze(predictions),
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
    rSquared: rSquaredV3(
      points.map(({ pressureMmHg }) => pressureMmHg),
      best.predictions,
    ),
  });
}

function sampleFromInterceptThroughObservedRangeV3(
  zeroPressureVolumeMl: number,
  measuredRangeMl: readonly [number, number],
  pressureAtVolume: (volumeMl: number) => number,
): readonly MainWireIntegratedModelRapidPvCurvePointV3[] {
  const margin = Math.max(
    1,
    (measuredRangeMl[1] - measuredRangeMl[0]) * 0.05,
  );
  const start = zeroPressureVolumeMl;
  const end = measuredRangeMl[1] + margin;
  if (!Number.isFinite(start) || !Number.isFinite(end) || !(end > start)) {
    return Object.freeze([]);
  }
  return Object.freeze(Array.from(
    { length: CURVE_SAMPLE_COUNT_V3 },
    (_, index) => {
      const volumeMl = start +
        index / (CURVE_SAMPLE_COUNT_V3 - 1) * (end - start);
      return Object.freeze({
        volumeMl,
        pressureMmHg: pressureAtVolume(volumeMl),
      });
    },
  ));
}

function finiteRangeV3(values: readonly number[]): readonly [number, number] | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  return Object.freeze([Math.min(...finite), Math.max(...finite)]);
}

function rSquaredV3(
  observed: readonly number[],
  predicted: readonly number[],
): number {
  const mean = observed.reduce((sum, value) => sum + value, 0) /
    observed.length;
  const total = observed.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  const residual = observed.reduce((sum, value, index) =>
    sum + (value - predicted[index]!) ** 2, 0);
  if (!(total > 1e-12)) return residual <= 1e-12 ? 1 : 0;
  return Math.max(0, Math.min(1, 1 - residual / total));
}
