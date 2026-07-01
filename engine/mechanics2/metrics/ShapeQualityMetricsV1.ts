export type ShapeQualityMetricsV1 = {
  readonly sampleCount: number;
  readonly min: number;
  readonly max: number;
  readonly range: number;
  readonly dominantPeakCount: number;
  readonly secondaryPeakProminenceRatio: number | null;
  readonly fwhmFractionOfWindow: number | null;
  readonly peakWidthAtHalfMaxFraction: number | null;
  readonly peakAreaRatio: number | null;
  readonly c1ContinuityScore: number;
  readonly dYdtSpikeRatio: number;
  readonly positiveCurvatureFraction: number;
  readonly positiveCurvatureBurden: number;
};

export type ShapeQualityOptionsV1 = {
  readonly relativePeakProminenceThreshold?: number;
  readonly dominantPeakRelativeHeight?: number;
};

export function computeShapeQualityMetricsV1(
  values: readonly number[],
  options: ShapeQualityOptionsV1 = {},
): ShapeQualityMetricsV1 {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) {
    return {
      sampleCount: values.length,
      min: Number.NaN,
      max: Number.NaN,
      range: Number.NaN,
      dominantPeakCount: 0,
      secondaryPeakProminenceRatio: null,
      fwhmFractionOfWindow: null,
      peakWidthAtHalfMaxFraction: null,
      peakAreaRatio: null,
      c1ContinuityScore: Number.NaN,
      dYdtSpikeRatio: Number.NaN,
      positiveCurvatureFraction: Number.NaN,
      positiveCurvatureBurden: Number.NaN,
    };
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = Math.max(max - min, 1e-12);
  const peakInfo = peakSummary(finite, options);
  const fwhm = fwhmFraction(finite, min, max);
  const curvature = curvatureSummary(finite, range);
  return {
    sampleCount: values.length,
    min,
    max,
    range,
    dominantPeakCount: peakInfo.dominantPeakCount,
    secondaryPeakProminenceRatio: peakInfo.secondaryPeakProminenceRatio,
    fwhmFractionOfWindow: fwhm,
    peakWidthAtHalfMaxFraction: fwhm,
    peakAreaRatio: areaAboveHalfMaxRatio(finite, min, max),
    c1ContinuityScore: c1ContinuityScore(finite),
    dYdtSpikeRatio: derivativeSpikeRatio(finite),
    positiveCurvatureFraction: curvature.positiveCurvatureFraction,
    positiveCurvatureBurden: curvature.positiveCurvatureBurden,
  };
}

function peakSummary(
  values: readonly number[],
  options: ShapeQualityOptionsV1,
): { dominantPeakCount: number; secondaryPeakProminenceRatio: number | null } {
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = Math.max(maxValue - minValue, 1e-12);
  const prominenceThreshold = options.relativePeakProminenceThreshold ?? 0.015;
  const dominantThreshold = options.dominantPeakRelativeHeight ?? 0.25;
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur <= values[i - 1]! || cur < values[i + 1]!) continue;
    const prominence = (cur - Math.max(values[i - 1]!, values[i + 1]!)) / range;
    if (prominence > prominenceThreshold) peaks.push(cur - minValue);
  }
  peaks.sort((a, b) => b - a);
  if (peaks.length === 0 && values.some((value) => value > minValue + 0.5 * range)) {
    peaks.push(range);
  }
  const primary = Math.max(peaks[0] ?? 1, 1e-12);
  return {
    dominantPeakCount: peaks.filter((peak) => peak / primary > dominantThreshold).length,
    secondaryPeakProminenceRatio: peaks.length > 1 ? peaks[1]! / primary : 0,
  };
}

function fwhmFraction(values: readonly number[], min: number, max: number): number | null {
  if (values.length === 0) return null;
  const half = min + 0.5 * (max - min);
  return values.filter((value) => value >= half).length / values.length;
}

function areaAboveHalfMaxRatio(values: readonly number[], min: number, max: number): number | null {
  if (values.length === 0) return null;
  const half = min + 0.5 * (max - min);
  const areaAboveHalf = values.reduce((sum, value) => sum + Math.max(0, value - half), 0);
  const areaAboveMin = values.reduce((sum, value) => sum + Math.max(0, value - min), 0);
  return areaAboveMin > 1e-12 ? areaAboveHalf / areaAboveMin : null;
}

function c1ContinuityScore(values: readonly number[]): number {
  const slopes = derivatives(values);
  const maxSlope = maxAbs(slopes);
  if (maxSlope <= 1e-12) return 0;
  let maxJump = 0;
  for (let i = 1; i < slopes.length; i++) {
    maxJump = Math.max(maxJump, Math.abs(slopes[i]! - slopes[i - 1]!));
  }
  return round(maxJump / maxSlope);
}

function derivativeSpikeRatio(values: readonly number[]): number {
  const rawSlopes = derivatives(values).map(Math.abs);
  const maxSlope = Math.max(0, ...rawSlopes);
  const slopes = rawSlopes
    .filter((value) => value > 0.01 * maxSlope)
    .sort((a, b) => a - b);
  if (slopes.length === 0) return 0;
  const p95 = percentileSorted(slopes, 0.95);
  const median = percentileSorted(slopes, 0.50);
  return round(p95 / Math.max(median, 1e-12));
}

function curvatureSummary(values: readonly number[], range: number): {
  readonly positiveCurvatureFraction: number;
  readonly positiveCurvatureBurden: number;
} {
  const curvatures: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    curvatures.push(values[i + 1]! - 2 * values[i]! + values[i - 1]!);
  }
  if (curvatures.length === 0) return { positiveCurvatureFraction: 0, positiveCurvatureBurden: 0 };
  const positive = curvatures.filter((value) => value > 0);
  const burden = positive.reduce((sum, value) => sum + value, 0) / Math.max(range, 1e-12);
  return {
    positiveCurvatureFraction: round(positive.length / curvatures.length),
    positiveCurvatureBurden: round(burden),
  };
}

function derivatives(values: readonly number[]): readonly number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i++) out.push(values[i]! - values[i - 1]!);
  return out;
}

function percentileSorted(values: readonly number[], percentile: number): number {
  if (values.length === 0) return 0;
  const i = Math.min(values.length - 1, Math.max(0, Math.floor(percentile * (values.length - 1))));
  return values[i]!;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
