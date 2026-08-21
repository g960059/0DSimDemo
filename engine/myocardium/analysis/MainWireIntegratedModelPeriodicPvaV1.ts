import type {
  MainWireIntegratedModelPressureVolumeLoopPointV3,
  MainWireIntegratedModelStarlingLocusV3,
  MainWireIntegratedModelStarlingPointV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  evaluateMainWireIntegratedModelLvMvo2EstimateV1,
  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MVO2_REFERENCE_HEART_RATE_BPM_V1,
  type MainWireIntegratedModelLvMvo2EstimateV1,
} from "@/engine/myocardium/analysis/MainWireIntegratedModelMvo2ReferenceV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID =
  "main-wire-integrated-model-settled-hot-start-pva-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID =
  "suga-pva-linear-espvr-exponential-edpvr-settled-fixed-tbv-v1" as const;

const MMHG_ML_TO_JOULE_V1 = 1.33322e-4;
const MINIMUM_FIT_POINT_COUNT_V1 = 5;
const CURVE_SAMPLE_COUNT_V1 = 64;
const EDPVR_V0_GRID_COUNT_V1 = 120;
const EDPVR_EXPONENT_GRID_COUNT_V1 = 180;

export type MainWireIntegratedModelPeriodicPvaVentricleV1 = "LV" | "RV";
export type MainWireIntegratedModelPeriodicPvaCurvePointV1 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

type PeriodicPvaProgressV1 = Readonly<{
  completedPointCount: number;
  totalPointCount: number;
}>;

export type MainWireIntegratedModelPeriodicPvaV1 =
  | Readonly<{
      analysisId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID;
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID;
      status: "collecting" | "unavailable";
      ventricleId: MainWireIntegratedModelPeriodicPvaVentricleV1;
      pressureBasis: "transmural";
      progress: PeriodicPvaProgressV1;
      reason: string;
    }>
  | Readonly<{
      analysisId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID;
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID;
      outputId: string;
      status: "available";
      ventricleId: MainWireIntegratedModelPeriodicPvaVentricleV1;
      pressureBasis: "transmural";
      progress: PeriodicPvaProgressV1;
      source: Readonly<{
        protocolId: string;
        pointCount: number;
        primaryLineage: "persistent-worker-settled-hot-start-chain";
        slowControllerPolicy: "fully-active";
        endDiastolicLandmark: "maximum-volume-proxy";
        endSystolicLandmark: "semilunar-valve-closure";
      }>;
      anchor: Readonly<{
        totalBloodVolumeMl: number;
        endDiastolicVolumeMl: number;
        endSystolicVolumeMl: number;
      }>;
      strokeWork: Readonly<{
        method: "closed-trapezoidal-protocol-loop";
        mmHgMl: number;
        joule: number;
      }>;
      espvr: Readonly<{
        primaryMethod: "linear-semilunar-closure-fit";
        elastanceMmHgPerMl: number;
        volumeAxisInterceptMl: number;
        rSquared: number;
        measuredVolumeRangeMl: readonly [number, number];
        curve: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
        nonlinearComparator: Readonly<{
          method: "quadratic-semilunar-closure-fit";
          quadraticMmHgPerMl2: number;
          linearMmHgPerMl: number;
          interceptMmHg: number;
          rSquared: number;
          monotonicallyIncreasingAcrossMeasuredRange: boolean;
        }> | null;
      }>;
      edpvr: Readonly<{
        method: "exponential-maximum-volume-fit";
        scaleMmHg: number;
        exponentPerMl: number;
        zeroPressureVolumeMl: number;
        rSquared: number;
        measuredVolumeRangeMl: readonly [number, number];
        parameterBoundaryHit: boolean;
        curve: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
      }>;
      potentialEnergy: Readonly<{
        method: "area-between-espvr-and-nonnegative-edpvr-to-anchor-esv";
        mmHgMl: number;
        joule: number;
      }>;
      pva: Readonly<{
        definition: "PVA = SW + PE";
        mmHgMl: number;
        joule: number;
      }>;
      estimatedMvo2: MainWireIntegratedModelLvMvo2EstimateV1 | null;
      limitations: readonly [
        "fixed-tbv-load-family-not-venous-occlusion",
        "maximum-volume-used-as-end-diastolic-proxy",
        "linear-espvr-is-primary-with-quadratic-diagnostic-only",
        "fully-active-slow-controllers-vary-across-loads",
        "not-clinical-validation",
      ];
    }>;

type LinearFitV1 = Readonly<{
  slope: number;
  intercept: number;
  rSquared: number;
}>;

type ExponentialFitV1 = Readonly<{
  scale: number;
  exponent: number;
  volumeOffset: number;
  rSquared: number;
  parameterBoundaryHit: boolean;
}>;

export function buildMainWireIntegratedModelPeriodicPvaV1(
  locus: MainWireIntegratedModelStarlingLocusV3,
  ventricleId: MainWireIntegratedModelPeriodicPvaVentricleV1,
): MainWireIntegratedModelPeriodicPvaV1 {
  const progress = Object.freeze({
    completedPointCount:
      "completedPointCount" in locus ? locus.completedPointCount : 0,
    totalPointCount: "totalPointCount" in locus ? locus.totalPointCount : 0,
  });
  const incomplete = (
    status: "collecting" | "unavailable",
    reason: string,
  ): MainWireIntegratedModelPeriodicPvaV1 =>
    Object.freeze({
      analysisId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID,
      methodId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
      status,
      ventricleId,
      pressureBasis: "transmural" as const,
      progress,
      reason,
    });

  if (locus.status !== "measured-fixed-tbv-protocol") {
    return incomplete(
      "unavailable",
      "PVA requires the settled fixed-TBV formal analysis",
    );
  }
  if (locus.completedPointCount !== locus.totalPointCount) {
    return incomplete(
      "collecting",
      `${locus.completedPointCount}/${locus.totalPointCount} settled load points`,
    );
  }
  if (locus.points.length < MINIMUM_FIT_POINT_COUNT_V1) {
    return incomplete(
      "unavailable",
      "At least five settled load points are required",
    );
  }
  const anchor = locus.points.find(({ role }) => role === "operating-anchor");
  if (anchor === undefined) {
    return incomplete(
      "unavailable",
      "The operating load anchor is unavailable",
    );
  }
  const systolic = locus.points.flatMap((point) => {
    const landmark = point.ventricularPressureVolumeLandmarks.endSystolic;
    return landmark.event === "semilunar-valve-closure" ? [landmark] : [];
  });
  const diastolic = locus.points
    .map(
      ({ ventricularPressureVolumeLandmarks }) =>
        ventricularPressureVolumeLandmarks.endDiastolic,
    )
    .filter(({ pressureMmHg }) => pressureMmHg > 0.05);
  const espvr = linearFitV1(systolic);
  const edpvr = exponentialFitV1(diastolic);
  if (
    systolic.length < MINIMUM_FIT_POINT_COUNT_V1 ||
    diastolic.length < MINIMUM_FIT_POINT_COUNT_V1 ||
    espvr === null ||
    edpvr === null
  ) {
    return incomplete(
      "unavailable",
      "Settled closure and positive-pressure filling landmarks do not define ESPVR and EDPVR",
    );
  }
  const espvrV0 = -espvr.intercept / espvr.slope;
  const anchorEndSystolic =
    anchor.ventricularPressureVolumeLandmarks.endSystolic;
  const anchorEndDiastolic =
    anchor.ventricularPressureVolumeLandmarks.endDiastolic;
  const strokeWorkMmHgMl = closedLoopStrokeWorkV1(
    anchor.ventricularPressureVolumeLoop,
  );
  const passiveAreaMmHgMl = nonnegativeExponentialAreaV1(
    edpvr,
    espvrV0,
    anchorEndSystolic.volumeMl,
  );
  const systolicAreaMmHgMl =
    0.5 * espvr.slope * (anchorEndSystolic.volumeMl - espvrV0) ** 2;
  const potentialEnergyMmHgMl = systolicAreaMmHgMl - passiveAreaMmHgMl;
  const pvaMmHgMl = strokeWorkMmHgMl + potentialEnergyMmHgMl;
  if (
    ![
      espvrV0,
      strokeWorkMmHgMl,
      passiveAreaMmHgMl,
      systolicAreaMmHgMl,
      potentialEnergyMmHgMl,
      pvaMmHgMl,
    ].every(Number.isFinite) ||
    !(anchorEndSystolic.volumeMl > espvrV0) ||
    !(strokeWorkMmHgMl > 0) ||
    !(potentialEnergyMmHgMl >= 0) ||
    !(pvaMmHgMl > 0)
  ) {
    return incomplete(
      "unavailable",
      "The settled relations do not define a positive finite SW/PE/PVA decomposition",
    );
  }

  const systolicRange = finiteRangeV1(
    systolic.map(({ volumeMl }) => volumeMl),
  )!;
  const diastolicRange = finiteRangeV1(
    diastolic.map(({ volumeMl }) => volumeMl),
  )!;
  const outputId = `protocol-analysis.settled-hot-start-pva-v1.${ventricleId}`;
  const pvaJ = pvaMmHgMl * MMHG_ML_TO_JOULE_V1;
  const nonlinearComparator = quadraticFitV1(systolic);
  const estimatedMvo2 =
    ventricleId === "LV"
      ? evaluateMainWireIntegratedModelLvMvo2EstimateV1({
          pvaOutputId: outputId,
          pvaMethodId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
          pvaEstimateJ: pvaJ,
          heartRateBpm:
            MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_MVO2_REFERENCE_HEART_RATE_BPM_V1,
        })
      : null;
  return Object.freeze({
    analysisId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
    outputId,
    status: "available" as const,
    ventricleId,
    pressureBasis: "transmural" as const,
    progress,
    source: Object.freeze({
      protocolId: locus.protocolId,
      pointCount: locus.points.length,
      primaryLineage: "persistent-worker-settled-hot-start-chain" as const,
      slowControllerPolicy: "fully-active" as const,
      endDiastolicLandmark: "maximum-volume-proxy" as const,
      endSystolicLandmark: "semilunar-valve-closure" as const,
    }),
    anchor: Object.freeze({
      totalBloodVolumeMl: anchor.totalBloodVolumeMl,
      endDiastolicVolumeMl: anchorEndDiastolic.volumeMl,
      endSystolicVolumeMl: anchorEndSystolic.volumeMl,
    }),
    strokeWork: Object.freeze({
      method: "closed-trapezoidal-protocol-loop" as const,
      mmHgMl: strokeWorkMmHgMl,
      joule: strokeWorkMmHgMl * MMHG_ML_TO_JOULE_V1,
    }),
    espvr: Object.freeze({
      primaryMethod: "linear-semilunar-closure-fit" as const,
      elastanceMmHgPerMl: espvr.slope,
      volumeAxisInterceptMl: espvrV0,
      rSquared: espvr.rSquared,
      measuredVolumeRangeMl: systolicRange,
      curve: sampleCurveV1(
        espvrV0,
        Math.max(systolicRange[1], anchorEndDiastolic.volumeMl),
        (volumeMl) => Math.max(0, espvr.slope * volumeMl + espvr.intercept),
      ),
      nonlinearComparator,
    }),
    edpvr: Object.freeze({
      method: "exponential-maximum-volume-fit" as const,
      scaleMmHg: edpvr.scale,
      exponentPerMl: edpvr.exponent,
      zeroPressureVolumeMl: edpvr.volumeOffset,
      rSquared: edpvr.rSquared,
      measuredVolumeRangeMl: diastolicRange,
      parameterBoundaryHit: edpvr.parameterBoundaryHit,
      curve: sampleCurveV1(edpvr.volumeOffset, diastolicRange[1], (volumeMl) =>
        nonnegativeExponentialPressureV1(edpvr, volumeMl),
      ),
    }),
    potentialEnergy: Object.freeze({
      method: "area-between-espvr-and-nonnegative-edpvr-to-anchor-esv" as const,
      mmHgMl: potentialEnergyMmHgMl,
      joule: potentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1,
    }),
    pva: Object.freeze({
      definition: "PVA = SW + PE" as const,
      mmHgMl: pvaMmHgMl,
      joule: pvaJ,
    }),
    estimatedMvo2,
    limitations: Object.freeze([
      "fixed-tbv-load-family-not-venous-occlusion",
      "maximum-volume-used-as-end-diastolic-proxy",
      "linear-espvr-is-primary-with-quadratic-diagnostic-only",
      "fully-active-slow-controllers-vary-across-loads",
      "not-clinical-validation",
    ] as const),
  });
}

function closedLoopStrokeWorkV1(
  loop: readonly MainWireIntegratedModelPressureVolumeLoopPointV3[],
): number {
  if (loop.length < 3) return Number.NaN;
  let pathWork = 0;
  for (let index = 0; index < loop.length; index += 1) {
    const left = loop[index]!;
    const right = loop[(index + 1) % loop.length]!;
    if (
      ![
        left.volumeMl,
        left.pressureMmHg,
        right.volumeMl,
        right.pressureMmHg,
      ].every(Number.isFinite)
    )
      return Number.NaN;
    pathWork +=
      0.5 *
      (left.pressureMmHg + right.pressureMmHg) *
      (right.volumeMl - left.volumeMl);
  }
  return -pathWork;
}

function linearFitV1(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): LinearFitV1 | null {
  if (points.length < 2) return null;
  const meanX =
    points.reduce((sum, point) => sum + point.volumeMl, 0) / points.length;
  const meanY =
    points.reduce((sum, point) => sum + point.pressureMmHg, 0) / points.length;
  const variance = points.reduce(
    (sum, point) => sum + (point.volumeMl - meanX) ** 2,
    0,
  );
  const covariance = points.reduce(
    (sum, point) =>
      sum + (point.volumeMl - meanX) * (point.pressureMmHg - meanY),
    0,
  );
  if (!(variance > 1e-12)) return null;
  const slope = covariance / variance;
  const intercept = meanY - slope * meanX;
  if (!(slope > 0) || !Number.isFinite(intercept)) return null;
  return Object.freeze({
    slope,
    intercept,
    rSquared: rSquaredV1(
      points.map(({ pressureMmHg }) => pressureMmHg),
      points.map(({ volumeMl }) => slope * volumeMl + intercept),
    ),
  });
}

function quadraticFitV1(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): Exclude<
  Extract<
    MainWireIntegratedModelPeriodicPvaV1,
    { status: "available" }
  >["espvr"]["nonlinearComparator"],
  null
> | null {
  if (points.length < 3) return null;
  const x0 =
    points.reduce((sum, point) => sum + point.volumeMl, 0) / points.length;
  const x = points.map((point) => point.volumeMl - x0);
  const y = points.map(({ pressureMmHg }) => pressureMmHg);
  const n = points.length;
  const s1 = x.reduce((sum, value) => sum + value, 0);
  const s2 = x.reduce((sum, value) => sum + value ** 2, 0);
  const s3 = x.reduce((sum, value) => sum + value ** 3, 0);
  const s4 = x.reduce((sum, value) => sum + value ** 4, 0);
  const sy = y.reduce((sum, value) => sum + value, 0);
  const sxy = x.reduce((sum, value, index) => sum + value * y[index]!, 0);
  const sx2y = x.reduce((sum, value, index) => sum + value ** 2 * y[index]!, 0);
  const centered = solveThreeByThreeV1(
    [
      [s4, s3, s2],
      [s3, s2, s1],
      [s2, s1, n],
    ],
    [sx2y, sxy, sy],
  );
  if (centered === null) return null;
  const [a, centeredB, centeredC] = centered;
  const b = centeredB - 2 * a * x0;
  const c = a * x0 ** 2 - centeredB * x0 + centeredC;
  if (![a, b, c].every(Number.isFinite)) return null;
  const range = finiteRangeV1(points.map(({ volumeMl }) => volumeMl));
  if (range === null) return null;
  const predicted = points.map(
    ({ volumeMl }) => a * volumeMl ** 2 + b * volumeMl + c,
  );
  return Object.freeze({
    method: "quadratic-semilunar-closure-fit" as const,
    quadraticMmHgPerMl2: a,
    linearMmHgPerMl: b,
    interceptMmHg: c,
    rSquared: rSquaredV1(y, predicted),
    monotonicallyIncreasingAcrossMeasuredRange:
      2 * a * range[0] + b > 0 && 2 * a * range[1] + b > 0,
  });
}

function exponentialFitV1(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): ExponentialFitV1 | null {
  const range = finiteRangeV1(points.map(({ volumeMl }) => volumeMl));
  if (range === null || points.length < 3) return null;
  const span = range[1] - range[0];
  const minimumV0 = range[0] - Math.max(20, 1.5 * span);
  const maximumV0 = range[0] - Math.max(0.05, span * 0.002);
  const minimumExponent = 0.001;
  const maximumExponent = Math.min(
    0.25,
    18 / Math.max(1, range[1] - minimumV0),
  );
  if (!(maximumExponent > minimumExponent)) return null;
  let best: (ExponentialFitV1 & Readonly<{ score: number }>) | null = null;
  for (let vOrdinal = 0; vOrdinal <= EDPVR_V0_GRID_COUNT_V1; vOrdinal += 1) {
    const volumeOffset =
      minimumV0 + (vOrdinal / EDPVR_V0_GRID_COUNT_V1) * (maximumV0 - minimumV0);
    for (
      let exponentOrdinal = 0;
      exponentOrdinal <= EDPVR_EXPONENT_GRID_COUNT_V1;
      exponentOrdinal += 1
    ) {
      const fraction = exponentOrdinal / EDPVR_EXPONENT_GRID_COUNT_V1;
      const exponent = Math.exp(
        Math.log(minimumExponent) +
          fraction * (Math.log(maximumExponent) - Math.log(minimumExponent)),
      );
      const basis = points.map(({ volumeMl }) =>
        Math.expm1(exponent * (volumeMl - volumeOffset)),
      );
      const denominator = basis.reduce((sum, value) => sum + value ** 2, 0);
      if (!(denominator > 0) || !Number.isFinite(denominator)) continue;
      const scale =
        points.reduce(
          (sum, point, index) => sum + point.pressureMmHg * basis[index]!,
          0,
        ) / denominator;
      if (!(scale > 0) || !Number.isFinite(scale)) continue;
      const predicted = basis.map((value) => scale * value);
      const score = predicted.reduce(
        (sum, value, index) => sum + (points[index]!.pressureMmHg - value) ** 2,
        0,
      );
      if (!Number.isFinite(score) || (best !== null && score >= best.score))
        continue;
      best = Object.freeze({
        scale,
        exponent,
        volumeOffset,
        score,
        rSquared: rSquaredV1(
          points.map(({ pressureMmHg }) => pressureMmHg),
          predicted,
        ),
        parameterBoundaryHit:
          vOrdinal === 0 ||
          vOrdinal === EDPVR_V0_GRID_COUNT_V1 ||
          exponentOrdinal === 0 ||
          exponentOrdinal === EDPVR_EXPONENT_GRID_COUNT_V1,
      });
    }
  }
  if (best === null) return null;
  const { score: _score, ...fit } = best;
  return Object.freeze(fit);
}

function nonnegativeExponentialPressureV1(
  fit: ExponentialFitV1,
  volumeMl: number,
): number {
  if (volumeMl <= fit.volumeOffset) return 0;
  return fit.scale * Math.expm1(fit.exponent * (volumeMl - fit.volumeOffset));
}

function nonnegativeExponentialAreaV1(
  fit: ExponentialFitV1,
  startVolumeMl: number,
  endVolumeMl: number,
): number {
  const start = Math.max(startVolumeMl, fit.volumeOffset);
  if (!(endVolumeMl > start)) return 0;
  const shiftedStart = start - fit.volumeOffset;
  const shiftedEnd = endVolumeMl - fit.volumeOffset;
  return (
    fit.scale *
    ((Math.exp(fit.exponent * shiftedEnd) -
      Math.exp(fit.exponent * shiftedStart)) /
      fit.exponent -
      (shiftedEnd - shiftedStart))
  );
}

function sampleCurveV1(
  startVolumeMl: number,
  endVolumeMl: number,
  pressure: (volumeMl: number) => number,
): readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[] {
  if (!(endVolumeMl > startVolumeMl)) return Object.freeze([]);
  return Object.freeze(
    Array.from({ length: CURVE_SAMPLE_COUNT_V1 + 1 }, (_, index) => {
      const volumeMl =
        startVolumeMl +
        (index / CURVE_SAMPLE_COUNT_V1) * (endVolumeMl - startVolumeMl);
      return Object.freeze({ volumeMl, pressureMmHg: pressure(volumeMl) });
    }),
  );
}

function finiteRangeV1(
  values: readonly number[],
): readonly [number, number] | null {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value)))
    return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return maximum > minimum ? Object.freeze([minimum, maximum] as const) : null;
}

function rSquaredV1(
  observed: readonly number[],
  predicted: readonly number[],
): number {
  if (observed.length === 0 || observed.length !== predicted.length) return 0;
  const mean =
    observed.reduce((sum, value) => sum + value, 0) / observed.length;
  const total = observed.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  const residual = observed.reduce(
    (sum, value, index) => sum + (value - predicted[index]!) ** 2,
    0,
  );
  return total > 0 ? 1 - residual / total : residual === 0 ? 1 : 0;
}

function solveThreeByThreeV1(
  matrix: readonly (readonly [number, number, number])[],
  vector: readonly [number, number, number],
): readonly [number, number, number] | null {
  const augmented = matrix.map((row, index) => [
    row[0],
    row[1],
    row[2],
    vector[index]!,
  ]);
  for (let column = 0; column < 3; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 3; row += 1) {
      if (
        Math.abs(augmented[row]![column]!) >
        Math.abs(augmented[pivot]![column]!)
      )
        pivot = row;
    }
    if (!(Math.abs(augmented[pivot]![column]!) > 1e-18)) return null;
    [augmented[column], augmented[pivot]] = [
      augmented[pivot]!,
      augmented[column]!,
    ];
    const divisor = augmented[column]![column]!;
    for (let entry = column; entry < 4; entry += 1) {
      augmented[column]![entry] = augmented[column]![entry]! / divisor;
    }
    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;
      const factor = augmented[row]![column]!;
      for (let entry = column; entry < 4; entry += 1) {
        augmented[row]![entry] =
          augmented[row]![entry]! - factor * augmented[column]![entry]!;
      }
    }
  }
  const result = [
    augmented[0]![3]!,
    augmented[1]![3]!,
    augmented[2]![3]!,
  ] as const;
  return result.every(Number.isFinite) ? Object.freeze(result) : null;
}
