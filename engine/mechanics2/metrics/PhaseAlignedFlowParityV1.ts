import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";

export type PhaseAlignedFlowParitySideV1 = "left" | "right";

export type PhaseAlignedFlowParitySampleV1 = {
  readonly theta: number;
};

export type PhaseAlignedFlowParityMetricsV1 = {
  readonly rawBaseC1: number;
  readonly rawDtHalfC1: number;
  readonly rawDtHalfDelta: number;
  readonly rawShapeParityOk: boolean;
  readonly alignedDtHalfC1: number;
  readonly alignedDtHalfDelta: number;
  readonly rawBaseDominantPeakCount: number;
  readonly rawDtHalfDominantPeakCount: number;
  readonly alignedDtHalfDominantPeakCount: number;
  readonly rawBaseFlowPeakCount: number;
  readonly rawDtHalfFlowPeakCount: number;
  readonly alignedDtHalfFlowPeakCount: number;
  readonly phaseAlignedShapeParityOk: boolean;
};

export function computePhaseAlignedFlowParityV1<TSample extends PhaseAlignedFlowParitySampleV1>({
  side,
  baseSamples,
  dtHalfSamples,
  flowSelector,
}: {
  readonly side: PhaseAlignedFlowParitySideV1;
  readonly baseSamples: readonly TSample[];
  readonly dtHalfSamples: readonly TSample[];
  readonly flowSelector: (sample: TSample) => number;
}): PhaseAlignedFlowParityMetricsV1 | null {
  if (baseSamples.length < 4 || dtHalfSamples.length < 4) return null;
  const baseFlow = baseSamples.map(flowSelector);
  const dtHalfFlow = dtHalfSamples.map(flowSelector);
  const alignedDtHalfFlow = resampleByTheta(baseSamples, dtHalfSamples, flowSelector);
  const baseShape = computeShapeQualityMetricsV1(baseFlow);
  const dtHalfShape = computeShapeQualityMetricsV1(dtHalfFlow);
  const alignedShape = computeShapeQualityMetricsV1(alignedDtHalfFlow);
  const rawDtHalfDelta = Math.abs(baseShape.c1ContinuityScore - dtHalfShape.c1ContinuityScore);
  const alignedDtHalfDelta = Math.abs(baseShape.c1ContinuityScore - alignedShape.c1ContinuityScore);
  const rawShapeParityOk = rawDtHalfDelta <= (side === "left" ? 0.18 : 0.20);
  const alignedDtHalfFlowPeakCount = positiveFlowPeakCountV1(alignedDtHalfFlow);
  const phaseAlignedShapeParityOk =
    alignedDtHalfDelta <= (side === "left" ? 0.18 : 0.20)
    && alignedDtHalfFlowPeakCount <= 2
    && alignedShape.c1ContinuityScore <= (side === "left" ? 0.38 : 0.48);

  return {
    rawBaseC1: baseShape.c1ContinuityScore,
    rawDtHalfC1: dtHalfShape.c1ContinuityScore,
    rawDtHalfDelta,
    rawShapeParityOk,
    alignedDtHalfC1: alignedShape.c1ContinuityScore,
    alignedDtHalfDelta,
    rawBaseDominantPeakCount: baseShape.dominantPeakCount,
    rawDtHalfDominantPeakCount: dtHalfShape.dominantPeakCount,
    alignedDtHalfDominantPeakCount: alignedShape.dominantPeakCount,
    rawBaseFlowPeakCount: positiveFlowPeakCountV1(baseFlow),
    rawDtHalfFlowPeakCount: positiveFlowPeakCountV1(dtHalfFlow),
    alignedDtHalfFlowPeakCount,
    phaseAlignedShapeParityOk,
  };
}

export function positiveFlowPeakCountV1(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(6, 0.12 * maxValue);
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur > threshold && cur > values[i - 1]! && cur >= values[i + 1]!) peaks.push(i);
  }
  return mergeNearbyPeaks(peaks, Math.max(6, Math.ceil(values.length * 0.04))).length;
}

function resampleByTheta<TSample extends PhaseAlignedFlowParitySampleV1>(
  baseSamples: readonly TSample[],
  dtHalfSamples: readonly TSample[],
  flowSelector: (sample: TSample) => number,
): readonly number[] {
  return baseSamples.map((sample) => interpolateAtTheta(dtHalfSamples, flowSelector, sample.theta));
}

function interpolateAtTheta<TSample extends PhaseAlignedFlowParitySampleV1>(
  samples: readonly TSample[],
  flowSelector: (sample: TSample) => number,
  theta: number,
): number {
  if (samples.length === 0) return 0;
  if (theta <= samples[0]!.theta) return flowSelector(samples[0]!);
  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1]!;
    const current = samples[i]!;
    if (theta <= current.theta) {
      const span = Math.max(current.theta - previous.theta, 1e-12);
      const fraction = (theta - previous.theta) / span;
      return flowSelector(previous) * (1 - fraction) + flowSelector(current) * fraction;
    }
  }
  return flowSelector(samples[samples.length - 1]!);
}

function mergeNearbyPeaks(indices: readonly number[], minSeparation: number): readonly number[] {
  const out: number[] = [];
  for (const index of indices) {
    const last = out.at(-1);
    if (last == null || index - last > minSeparation) out.push(index);
    else if (index > last) out[out.length - 1] = index;
  }
  return out;
}
