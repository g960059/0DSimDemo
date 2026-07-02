import type { SimSample } from "@/engine/protocol";
import {
  phaseInWindow,
  phaseOf,
  positiveValvePeaksDetailed,
} from "@/engine/verification/shapeMetrics";
import type {
  AvInflowArtifactHintsV1,
  AvInflowPatternClassV1,
  AvInflowPatternEvidenceV1,
  PatternClassDecisionV1,
  PhysiologyMorphologyProfileId,
} from "@/engine/diagnostics/morphology/morphologyDecisionV1";

export type AvInflowValveV1 = "MV" | "TV";

type Peak = { readonly theta: number; readonly value: number };
type Window = { readonly lo: number; readonly hi: number };

const DIASTOLIC_WINDOW: Window = { lo: 0.20, hi: 0.12 };
const E_WINDOW: Window = { lo: 0.24, hi: 0.62 };
const L_WINDOW: Window = { lo: 0.58, hi: 0.84 };
const A_WINDOW: Window = { lo: 0.82, hi: 0.10 };

export function classifyAvInflowPattern(
  samples: readonly SimSample[],
  valve: AvInflowValveV1,
  profileId: PhysiologyMorphologyProfileId,
  hints: AvInflowArtifactHintsV1 = {},
  rhythm: AvInflowPatternEvidenceV1["rhythm"] = "sinus",
): PatternClassDecisionV1 {
  const key = valve === "MV" ? "QMV" : "QTV";
  const pressureGradient = valve === "MV"
    ? (sample: SimSample) => sample.LAP - sample.LVP
    : (sample: SimSample) => sample.RAP - sample.RVP;
  const peakThreshold = Math.max(2, 0.08 * Math.max(0, ...samples.map((sample) => sample[key])));
  const peaks = positiveValvePeaksDetailed([...samples], key, 0.08, peakThreshold);
  const diastolicPeaks = peaks.filter((peak) => phaseInWindow(peak.theta, DIASTOLIC_WINDOW.lo, DIASTOLIC_WINDOW.hi));
  const aPeak = maxPeak(diastolicPeaks.filter((peak) => phaseInWindow(peak.theta, A_WINDOW.lo, A_WINDOW.hi)));
  const ePeak = maxPeak(diastolicPeaks.filter((peak) => phaseInWindow(peak.theta, E_WINDOW.lo, E_WINDOW.hi)));
  const lPeak = maxPeak(diastolicPeaks.filter((peak) => (
    phaseInWindow(peak.theta, L_WINDOW.lo, L_WINDOW.hi)
    && peak !== ePeak
    && peak !== aPeak
  )));
  const maxFlow = Math.max(0, ...samples.map((sample) => sample[key]));
  const flowThreshold = Math.max(1, 0.05 * maxFlow);
  const eArea = integratePositiveFlowWindow(samples, key, E_WINDOW);
  const lArea = integratePositiveFlowWindow(samples, key, L_WINDOW);
  const aArea = integratePositiveFlowWindow(samples, key, A_WINDOW);
  const totalForwardArea = integratePositiveFlowWindow(samples, key, DIASTOLIC_WINDOW);
  const earlyFillingFraction = totalForwardArea > 1e-9 ? eArea / totalForwardArea : undefined;
  const forwardDurationFraction = durationFraction(samples, key, flowThreshold, DIASTOLIC_WINDOW);
  const regurgitantFraction = regurgitantFractionInWindow(samples, key, DIASTOLIC_WINDOW);
  const c1KinkLimit = hints.c1KinkLimit ?? (valve === "MV" ? 3.45 : 3.35);
  const c1KinkSeverity = hints.c1KinkSeverity ?? Math.max(
    waveKinkScore(samples, key, ePeak),
    waveKinkScore(samples, key, lPeak),
    waveKinkScore(samples, key, aPeak),
  );
  const sharpnessLimit = hints.sharpnessLimit ?? 3.2;
  const pressureGradientSupported = hints.pressureFlowCausalityOk
    ?? pressureGradientSupport(samples, key, pressureGradient, flowThreshold);
  const valveStateSupported = hints.valveStateSupported
    ?? valveStateSupport(samples, key, valve === "MV" ? "xiMV" : "xiTV", flowThreshold);
  const evidence: AvInflowPatternEvidenceV1 = {
    positivePeakCount: diastolicPeaks.length,
    flowSpecificForwardPeakCount: diastolicPeaks.length,
    dominantShapePeakCount: diastolicPeaks.filter((peak) => peak.value >= 0.18 * Math.max(maxFlow, 1e-9)).length,
    ePeakTimeSec: peakTimeSec(samples, ePeak),
    lPeakTimeSec: peakTimeSec(samples, lPeak),
    aPeakTimeSec: peakTimeSec(samples, aPeak),
    ePeakTheta: ePeak?.theta,
    lPeakTheta: lPeak?.theta,
    aPeakTheta: aPeak?.theta,
    ePeakValue: ePeak?.value,
    lPeakValue: lPeak?.value,
    aPeakValue: aPeak?.value,
    eArea,
    lArea,
    aArea,
    totalForwardArea,
    earlyFillingFraction,
    forwardDurationFraction,
    regurgitantFraction,
    eaPeakRatio: ePeak && aPeak && ePeak.value > 1e-9 ? ePeak.value / aPeak.value : undefined,
    eaAreaRatio: aArea > 1e-9 ? eArea / aArea : undefined,
    lOverE: lPeak && ePeak && ePeak.value > 1e-9 ? lPeak.value / ePeak.value : undefined,
    extraPeakProminenceRatio: extraPeakRatio(diastolicPeaks, ePeak, aPeak),
    extraPeakAreaFraction: totalForwardArea > 1e-9 ? Math.max(0, lArea) / totalForwardArea : undefined,
    pressureGradientSupported,
    valveStateSupported,
    overlapsValveTransition: Boolean(hints.overlapsValveTransition),
    overlapsClampOrLimiter: Boolean(hints.overlapsClampOrLimiter),
    overlapsReservoirTransfer: Boolean(hints.overlapsReservoirTransfer),
    activeMultiTwitch: Boolean(hints.activeMultiTwitch),
    hiddenVolumeSource: Boolean(hints.hiddenVolumeSource),
    massLedgerClean: hints.massLedgerClean ?? true,
    energyCoastingClean: hints.energyCoastingClean ?? true,
    c1KinkSeverity,
    c1KinkLimit,
    sharpnessSeverity: hints.sharpnessSeverity ?? 0,
    sharpnessLimit,
    phaseAlignedDtParityOk: hints.dtHalfShapeParityOk,
    beatRepeatabilityOk: hints.beatRepeatabilityOk,
    rhythm,
    profileId,
  };
  const fusedPair = fusedPeakPair(diastolicPeaks);
  return {
    status: "classified",
    patternClass: classifyFromEvidence(evidence, fusedPair),
    evidence,
  };
}

function classifyFromEvidence(
  evidence: AvInflowPatternEvidenceV1,
  fusedPair: readonly [Peak, Peak] | null,
): AvInflowPatternClassV1 {
  if (evidence.c1KinkSeverity > evidence.c1KinkLimit) return "kink_artifact";
  if (evidence.overlapsValveTransition) return "valve_chatter";
  if ((evidence.regurgitantFraction ?? 0) > 0.08) return "regurgitant_loading_pattern";
  if ((evidence.forwardDurationFraction ?? 0) > 0.55 && evidence.flowSpecificForwardPeakCount <= 2) {
    return "prolonged_diastolic_inflow";
  }

  const hasE = evidence.ePeakValue != null;
  const hasA = evidence.aPeakValue != null;
  const hasL = evidence.lPeakValue != null && (evidence.lOverE ?? 0) >= 0.12;
  if (fusedPair) return "EA_fused";
  if (evidence.rhythm === "af" && !hasA) return "E_only_or_A_absent";
  if (hasE && !hasA) return "E_only_or_A_absent";
  if (hasE && hasA && isFused(evidence)) return "EA_fused";
  if (hasE && hasA && hasL && evidence.flowSpecificForwardPeakCount >= 3) return "ELA_triphasic";
  if (hasE && hasA && evidence.flowSpecificForwardPeakCount === 2) {
    if ((evidence.eaPeakRatio ?? 1) < 0.7 || (evidence.eaAreaRatio ?? 1) < 0.85) {
      return "A_dominant_impaired_relaxation_like";
    }
    if ((evidence.eaPeakRatio ?? 1) > 2.2 || (evidence.eaAreaRatio ?? 1) > 2.4) {
      return "E_dominant_restrictive_like";
    }
    return "EA_biphasic";
  }
  if (evidence.flowSpecificForwardPeakCount > 2) return "multi_peak_unexplained";
  return "unknown";
}

function fusedPeakPair(peaks: readonly Peak[]): readonly [Peak, Peak] | null {
  if (peaks.length !== 2) return null;
  const [first, second] = peaks.slice().sort((a, b) => a.theta - b.theta);
  const separation = circularForwardDelta(first.theta, second.theta);
  return separation > 0.04 && separation < 0.18 ? [first, second] : null;
}

function isFused(evidence: AvInflowPatternEvidenceV1): boolean {
  if (evidence.ePeakTheta == null || evidence.aPeakTheta == null) return false;
  const separation = circularForwardDelta(evidence.ePeakTheta, evidence.aPeakTheta);
  return separation > 0 && separation < 0.18;
}

function integratePositiveFlowWindow(
  samples: readonly SimSample[],
  key: "QMV" | "QTV",
  window: Window,
): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const midTheta = phaseOfMid(samples[i - 1], samples[i]);
    if (!phaseInWindow(midTheta, window.lo, window.hi)) continue;
    const dt = samples[i].t - samples[i - 1].t;
    area += 0.5 * dt * (Math.max(0, samples[i - 1][key]) + Math.max(0, samples[i][key]));
  }
  return area;
}

function durationFraction(
  samples: readonly SimSample[],
  key: "QMV" | "QTV",
  threshold: number,
  window: Window,
): number {
  let active = 0;
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    const midTheta = phaseOfMid(samples[i - 1], samples[i]);
    if (!phaseInWindow(midTheta, window.lo, window.hi)) continue;
    const dt = Math.max(0, samples[i].t - samples[i - 1].t);
    total += dt;
    if (0.5 * (samples[i - 1][key] + samples[i][key]) > threshold) active += dt;
  }
  return total > 1e-9 ? active / total : 0;
}

function regurgitantFractionInWindow(
  samples: readonly SimSample[],
  key: "QMV" | "QTV",
  window: Window,
): number {
  let forward = 0;
  let reverse = 0;
  for (let i = 1; i < samples.length; i++) {
    const midTheta = phaseOfMid(samples[i - 1], samples[i]);
    if (!phaseInWindow(midTheta, window.lo, window.hi)) continue;
    const dt = Math.max(0, samples[i].t - samples[i - 1].t);
    forward += 0.5 * dt * (Math.max(0, samples[i - 1][key]) + Math.max(0, samples[i][key]));
    reverse += 0.5 * dt * (Math.max(0, -samples[i - 1][key]) + Math.max(0, -samples[i][key]));
  }
  return forward > 1e-9 ? reverse / forward : reverse > 1e-9 ? 1 : 0;
}

function pressureGradientSupport(
  samples: readonly SimSample[],
  key: "QMV" | "QTV",
  pressureGradient: (sample: SimSample) => number,
  flowThreshold: number,
): boolean {
  const gradients = samples
    .filter((sample) => phaseInWindow(phaseOf(sample), DIASTOLIC_WINDOW.lo, DIASTOLIC_WINDOW.hi))
    .filter((sample) => sample[key] > flowThreshold)
    .map(pressureGradient);
  if (gradients.length < 3) return false;
  const mean = gradients.reduce((sum, value) => sum + value, 0) / gradients.length;
  return mean > -0.2 && Math.max(...gradients) > 0.15;
}

function valveStateSupport(
  samples: readonly SimSample[],
  key: "QMV" | "QTV",
  stateKey: "xiMV" | "xiTV",
  flowThreshold: number,
): boolean {
  const activeFlow = samples
    .filter((sample) => phaseInWindow(phaseOf(sample), DIASTOLIC_WINDOW.lo, DIASTOLIC_WINDOW.hi))
    .filter((sample) => sample[key] > flowThreshold);
  if (activeFlow.length < 3) return false;
  const supported = activeFlow.filter((sample) => sample[stateKey] > 0.05).length;
  return supported / activeFlow.length >= 0.8;
}

function waveKinkScore(
  samples: readonly SimSample[],
  key: "QMV" | "QTV",
  peak: Peak | null,
): number {
  if (!peak || peak.value <= 1e-9) return 0;
  const peakIndex = nearestPhaseIndex(samples, peak.theta);
  if (peakIndex == null) return 0;
  const threshold = Math.max(4, peak.value * 0.08);
  const segment = circularWaveSegment(samples, key, peakIndex, threshold);
  if (segment.length < 7) return 0;
  const normalized = smoothNumericSeries(resampleSeries(segment, 25)).map((value) => value / Math.max(peak.value, 1e-9));
  let totalSlope = 0;
  let maxSlopeJump = 0;
  for (let i = 1; i < normalized.length; i++) {
    totalSlope += Math.abs(normalized[i] - normalized[i - 1]);
  }
  for (let i = 1; i < normalized.length - 1; i++) {
    maxSlopeJump = Math.max(
      maxSlopeJump,
      Math.abs((normalized[i + 1] - normalized[i]) - (normalized[i] - normalized[i - 1])),
    );
  }
  const averageSlope = totalSlope / Math.max(normalized.length - 1, 1);
  return maxSlopeJump / Math.max(averageSlope, 0.025);
}

function circularWaveSegment(
  samples: readonly SimSample[],
  key: "QMV" | "QTV",
  peakIndex: number,
  threshold: number,
): readonly number[] {
  let left = 0;
  while (left < samples.length - 1) {
    const index = (peakIndex - left - 1 + samples.length) % samples.length;
    if (samples[index][key] <= threshold) break;
    left++;
  }
  let right = 0;
  while (left + right < samples.length - 1) {
    const index = (peakIndex + right + 1) % samples.length;
    if (samples[index][key] <= threshold) break;
    right++;
  }
  const segment: number[] = [];
  for (let offset = -left; offset <= right; offset++) {
    const index = (peakIndex + offset + samples.length) % samples.length;
    segment.push(samples[index][key]);
  }
  return segment;
}

function maxPeak(peaks: readonly Peak[]): Peak | null {
  if (peaks.length === 0) return null;
  return peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]);
}

function extraPeakRatio(peaks: readonly Peak[], ePeak: Peak | null, aPeak: Peak | null): number | undefined {
  const reference = ePeak?.value ?? Math.max(0, ...peaks.map((peak) => peak.value));
  const extras = peaks.filter((peak) => peak !== ePeak && peak !== aPeak).sort((a, b) => b.value - a.value);
  const extra = extras[0];
  return extra && reference > 1e-9 ? extra.value / reference : undefined;
}

function peakTimeSec(samples: readonly SimSample[], peak: Peak | null): number | undefined {
  if (!peak) return undefined;
  const index = nearestPhaseIndex(samples, peak.theta);
  return index == null ? undefined : samples[index].t;
}

function nearestPhaseIndex(samples: readonly SimSample[], theta: number): number | null {
  if (samples.length === 0) return null;
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const distance = circularThetaDistance(phaseOf(samples[i]), theta);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function phaseOfMid(left: SimSample, right: SimSample): number {
  const leftTheta = phaseOf(left);
  const rightTheta = phaseOf(right);
  const delta = circularForwardDelta(leftTheta, rightTheta);
  return (leftTheta + 0.5 * delta) % 1;
}

function circularForwardDelta(from: number, to: number): number {
  return (to - from + 1) % 1;
}

function circularThetaDistance(a: number, b: number): number {
  const delta = Math.abs(a - b) % 1;
  return Math.min(delta, 1 - delta);
}

function resampleSeries(values: readonly number[], count: number): readonly number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return Array.from({ length: count }, () => values[0]);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const position = (i / Math.max(count - 1, 1)) * (values.length - 1);
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(values.length - 1, leftIndex + 1);
    const w = position - leftIndex;
    out.push(values[leftIndex] + w * (values[rightIndex] - values[leftIndex]));
  }
  return out;
}

function smoothNumericSeries(values: readonly number[]): readonly number[] {
  return values.map((value, index) => {
    const start = Math.max(0, index - 1);
    const end = Math.min(values.length, index + 2);
    const window = values.slice(start, end);
    return window.reduce((sum, entry) => sum + entry, 0) / window.length;
  });
}
