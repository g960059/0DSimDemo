import type { MainWireBaselineVentricularObservationV2 } from "./MainWireBaselineObservationV2";

/** Accepted primitives only; no exact-runner or checkpoint dependency. */
export type MainWireRelaxationTauTraceSampleV1 = Readonly<{
  acceptedTimeSec: number;
  acceptedDtSec: number;
  absolutePressureMmHg: Readonly<{ LV: number }>;
  valveFlowMlPerSec: Readonly<{ AoV: number; MV: number }>;
}>;
type Sample = MainWireRelaxationTauTraceSampleV1;

export const MAIN_WIRE_RELAXATION_TAU_V1_ID = "main-wire-lv-relaxation-tau-v1" as const;
export const MAIN_WIRE_RELAXATION_TAU_POLICY_V1 = Object.freeze({
  pressureBasis: "intracavitary-LV" as const,
  window: "minimum-dpdt-midpoint-to-next-EDP-plus-5-before-MVO" as const,
  primaryMethod: "Weiss-zero-asymptote-time-weighted-log-linear" as const,
  sensitivityMethod: "Glantz-free-asymptote-time-weighted-dpdt-pressure" as const,
  // Resolution/fit usability, NOT normal physiology. Neither fit smooths the
  // source pressure, and a poor exponential fit does not diagnose disease.
  minimumSamples: 6, minimumDurationSec: .015, minimumPressureDropMmHg: 10,
  minimumWeissRSquared: .97, minimumGlantzRSquared: .95,
  maximumNormalizedPressureRmse: .05,
  endPressureAboveNextEdpMmHg: 5,
  referenceUpperMs: 48,
  referenceRole: "context-only-not-a-normal-interval-or-automatic-rejection" as const,
  referenceSourceIds: ["nagueh-2025-lv-diastolic-function"],
});

type Fit = Readonly<{ tauMs: number; asymptoteMmHg: number; rSquared: number;
  pressureRmseMmHg: number; normalizedPressureRmse: number }>;
export type MainWireRelaxationTauV1 = Readonly<{
  methodId: typeof MAIN_WIRE_RELAXATION_TAU_V1_ID;
  status: "measured" | "unavailable" | "poor-fit";
  issue: string | null;
  window: Readonly<{ startTimeSec: number; endTimeSec: number; durationSec: number;
    sampleCount: number; nextEdpMmHg: number; pressureDropMmHg: number;
    maximumStepSec: number }> | null;
  weiss: Fit | null;
  glantz: Fit | null;
  relaxationTrace: ReturnType<typeof measureMainWirePressureReboundsV1> | null;
  endpointSensitivity: Readonly<{ shortenedWindowTauMs: number | null; relativeDifference: number | null }>;
  sensitivityStatus: "measured" | "poor-fit" | "unavailable";
  referenceStatus: "not-above-prolongation-reference" | "above-reference" | "unavailable";
}>;

/** Derived analysis only: no new model state, no cycle seam synthesis, no
 * filling samples in an isovolumic fit. The secondary fit has no imported
 * Weiss threshold. In regurgitation this baseline observer may be inapplicable. */
export function measureMainWireRelaxationTauV1(
  samples: readonly Sample[], events: MainWireBaselineVentricularObservationV2["events"],
): MainWireRelaxationTauV1 {
  let relaxationTrace: MainWireRelaxationTauV1["relaxationTrace"] = null;
  const unavailable = (issue: string): MainWireRelaxationTauV1 => Object.freeze({
    methodId: MAIN_WIRE_RELAXATION_TAU_V1_ID, status: "unavailable", issue,
    window: null, weiss: null, glantz: null, relaxationTrace, endpointSensitivity: { shortenedWindowTauMs: null, relativeDifference: null },
    sensitivityStatus: "unavailable", referenceStatus: "unavailable",
  });
  const policy = MAIN_WIRE_RELAXATION_TAU_POLICY_V1;
  const { outletOpeningTimeSec: avo, outletClosureTimeSec: avc,
    inletOpeningTimeSec: mvo, nextInletClosureTimeSec: mvc } = events;
  if (![avo, avc, mvo, mvc].every(Number.isFinite) || !(avo < avc && avc < mvo && mvo < mvc)) {
    return unavailable("invalid-valve-landmarks");
  }
  if (samples.length < 3 || samples.some((s, i) => ![
    s.acceptedTimeSec, s.acceptedDtSec, s.absolutePressureMmHg?.LV,
    s.valveFlowMlPerSec?.AoV, s.valveFlowMlPerSec?.MV,
  ].every(Number.isFinite) || !(s.acceptedDtSec > 0)
    || (i > 0 && (s.acceptedTimeSec <= samples[i - 1]!.acceptedTimeSec
      || Math.abs(s.acceptedTimeSec - samples[i - 1]!.acceptedTimeSec - s.acceptedDtSec) > 1e-9)))) {
    return unavailable("invalid-or-noncontiguous-pressure-trace");
  }
  const points = samples.map(s => ({ t: s.acceptedTimeSec, p: s.absolutePressureMmHg.LV }));
  if (points[0]!.t > avo || points.at(-1)!.t < mvc) return unavailable("unbracketed-valve-landmarks");
  const pressureAt = (t: number) => {
    const i = points.findIndex(p => p.t >= t);
    if (points[i]!.t === t) return points[i]!.p;
    const a = points[i - 1]!, b = points[i]!;
    return a.p + (b.p - a.p) * (t - a.t) / (b.t - a.t);
  };
  relaxationTrace = measureMainWirePressureReboundsV1([
    { timeSec: avc, pressureMmHg: pressureAt(avc) },
    ...points.filter(p => p.t > avc && p.t < mvo).map(p => ({ timeSec: p.t, pressureMmHg: p.p })),
    { timeSec: mvo, pressureMmHg: pressureAt(mvo) },
  ]);
  // Keep a crossing that lies inside the final interval before MVO, including
  // when MVO itself falls between accepted endpoints. Only the interpolated
  // crossing must precede opening; dropping its entire bracket biases support.
  const decayPoints = [{ t: avo, p: pressureAt(avo) }, ...points.filter(p => p.t > avo && p.t < mvo),
    { t: mvo, p: pressureAt(mvo) }];
  const segments = decayPoints.slice(1).map((b, i) => {
    const a = decayPoints[i]!;
    return { a, b, rate: (b.p - a.p) / (b.t - a.t) };
  });
  const steepest = segments.reduce<typeof segments[number] | undefined>((best, s) =>
    best === undefined || s.rate < best.rate ? s : best, undefined);
  if (!steepest || !(steepest.rate < 0) || steepest.a.t < avc) {
    return unavailable("minimum-dpdt-not-resolved-after-aortic-closure");
  }
  // Closed valves must have no material forward OR reverse transport. Do not
  // call an MR/AR pressure-decay interval isovolumic merely because Q <= 0.
  if (samples.some(s => s.acceptedTimeSec > avc && s.acceptedTimeSec < mvo
    && (Math.abs(s.valveFlowMlPerSec.AoV) > 1e-7 || Math.abs(s.valveFlowMlPerSec.MV) > 1e-7))) {
    return unavailable("non-isovolumic-valve-flow");
  }
  const start = (steepest.a.t + steepest.b.t) / 2;
  const nextEdp = pressureAt(mvc), target = nextEdp + policy.endPressureAboveNextEdpMmHg;
  const startPressure = pressureAt(start);
  if (!(target > 0 && startPressure > target)) return unavailable("invalid-pressure-decay-window");
  const crossing = segments.find(s => s.b.t > start && s.a.p >= target && s.b.p <= target && s.a.p > s.b.p);
  if (!crossing) return unavailable("EDP-plus-5-not-reached-before-mitral-opening");
  const end = crossing.a.t + (target - crossing.a.p) * (crossing.b.t - crossing.a.t) / (crossing.b.p - crossing.a.p);
  if (!(start < end && end < mvo)) return unavailable("EDP-plus-5-not-reached-before-mitral-opening");
  const fitPoints = [{ t: start, p: startPressure }, ...points.filter(p => p.t > start && p.t < end), { t: end, p: target }];
  const duration = end - start, drop = startPressure - target;
  const window = Object.freeze({ startTimeSec: start, endTimeSec: end, durationSec: duration,
    sampleCount: fitPoints.length, nextEdpMmHg: nextEdp, pressureDropMmHg: drop,
    maximumStepSec: Math.max(...fitPoints.slice(1).map((p, i) => p.t - fitPoints[i]!.t)) });
  if (fitPoints.length < policy.minimumSamples || duration < policy.minimumDurationSec
    || drop < policy.minimumPressureDropMmHg) return { ...unavailable("insufficient-pressure-decay-support"), window };
  const weights = fitPoints.map((p, i) => ((fitPoints[i + 1]?.t ?? p.t) - (fitPoints[i - 1]?.t ?? p.t)) / 2);
  const weissLine = linearFit(fitPoints.map(p => p.t - start), fitPoints.map(p => Math.log(p.p)), weights);
  const intervals = fitPoints.slice(1).map((b, i) => ({ a: fitPoints[i]!, b }));
  const glantzLine = linearFit(intervals.map(({ a, b }) => (a.p + b.p) / 2),
    intervals.map(({ a, b }) => (b.p - a.p) / (b.t - a.t)), intervals.map(({ a, b }) => b.t - a.t));
  const makeFit = (line: ReturnType<typeof linearFit>, freeAsymptote: boolean): Fit | null => {
    if (!line || !(line.slope < 0)) return null;
    const tau = -1 / line.slope, asymptote = freeAsymptote ? -line.intercept / line.slope : 0;
    const decay = fitPoints.map(p => Math.exp(-(p.t - start) / tau));
    const amplitude = freeAsymptote
      ? fitPoints.reduce((sum, p, i) => sum + weights[i]! * decay[i]! * (p.p - asymptote), 0)
        / decay.reduce((sum, x, i) => sum + weights[i]! * x * x, 0)
      : Math.exp(line.intercept);
    const rmse = Math.sqrt(fitPoints.reduce((sum, p, i) =>
      sum + weights[i]! * (p.p - asymptote - amplitude * decay[i]!) ** 2, 0) / duration);
    if (![tau, asymptote, amplitude, rmse, line.rSquared].every(Number.isFinite) || !(amplitude > 0)) return null;
    return Object.freeze({ tauMs: tau * 1000, asymptoteMmHg: asymptote,
      rSquared: line.rSquared, pressureRmseMmHg: rmse, normalizedPressureRmse: rmse / drop });
  };
  const weiss = makeFit(weissLine, false), glantz = makeFit(glantzLine, true);
  // One accepted-endpoint truncation, without moving to a target-dependent
  // window or selecting the estimate that happens to look most normal.
  const shortened = fitPoints.slice(0, -1);
  const shortLine = linearFit(shortened.map(p => p.t - start), shortened.map(p => Math.log(p.p)),
    shortened.map((p, i) => ((shortened[i + 1]?.t ?? p.t) - (shortened[i - 1]?.t ?? p.t)) / 2));
  const shortTau = shortLine && shortLine.slope < 0 ? -1000 / shortLine.slope : null;
  const endpointSensitivity = Object.freeze({ shortenedWindowTauMs: shortTau,
    relativeDifference: shortTau === null || weiss === null ? null
      : Math.abs(shortTau - weiss.tauMs) / Math.max(shortTau, weiss.tauMs) });
  const adequate = weiss !== null && weiss.rSquared >= policy.minimumWeissRSquared
    && weiss.normalizedPressureRmse <= policy.maximumNormalizedPressureRmse;
  const sensitivityStatus = glantz === null ? "unavailable" : glantz.rSquared >= policy.minimumGlantzRSquared
    && glantz.normalizedPressureRmse <= policy.maximumNormalizedPressureRmse ? "measured" : "poor-fit";
  return Object.freeze({ methodId: MAIN_WIRE_RELAXATION_TAU_V1_ID,
    status: adequate ? "measured" : "poor-fit", issue: adequate ? null : "exponential-fit-quality-unresolved",
    window, weiss, glantz, relaxationTrace, endpointSensitivity, sensitivityStatus, referenceStatus: !adequate ? "unavailable"
      : weiss!.tauMs > policy.referenceUpperMs ? "above-reference" : "not-above-prolongation-reference" });
}

/** Reports without accepted traces can validate coherence, not re-prove the fit. */
export function assertMainWireRelaxationTauMeasuredV1(value: MainWireRelaxationTauV1 | undefined): void {
  const p = MAIN_WIRE_RELAXATION_TAU_POLICY_V1, w = value?.window, fit = value?.weiss;
  const fitFinite = (f: Fit) => [f.tauMs, f.asymptoteMmHg, f.rSquared, f.pressureRmseMmHg,
    f.normalizedPressureRmse].every(Number.isFinite);
  if (!value || value.methodId !== MAIN_WIRE_RELAXATION_TAU_V1_ID || value.status !== "measured"
    || value.issue !== null || !w || !fit || ![w.startTimeSec, w.endTimeSec, w.durationSec,
      w.sampleCount, w.nextEdpMmHg, w.pressureDropMmHg, w.maximumStepSec].every(Number.isFinite)
    || !fitFinite(fit) || !(fit.tauMs > 0) || fit.asymptoteMmHg !== 0
    || fit.rSquared < p.minimumWeissRSquared || fit.rSquared > 1 || fit.pressureRmseMmHg < 0
    || fit.normalizedPressureRmse < 0 || fit.normalizedPressureRmse > p.maximumNormalizedPressureRmse
    || w.durationSec < p.minimumDurationSec || !(w.maximumStepSec > 0) || w.maximumStepSec > w.durationSec
    || !Number.isSafeInteger(w.sampleCount) || w.sampleCount < p.minimumSamples
    || w.pressureDropMmHg < p.minimumPressureDropMmHg
    || Math.abs(w.endTimeSec - w.startTimeSec - w.durationSec) > 1e-9
    || Math.abs(fit.pressureRmseMmHg / w.pressureDropMmHg - fit.normalizedPressureRmse) > 1e-9
    || value.referenceStatus !== (fit.tauMs > p.referenceUpperMs ? "above-reference" : "not-above-prolongation-reference")
    || !value.endpointSensitivity || !(value.endpointSensitivity.shortenedWindowTauMs! > 0)
    || !Number.isFinite(value.endpointSensitivity.shortenedWindowTauMs)
    || !Number.isFinite(value.endpointSensitivity.relativeDifference)
    || Math.abs(value.endpointSensitivity.relativeDifference! - Math.abs(value.endpointSensitivity.shortenedWindowTauMs! - fit.tauMs)
      / Math.max(value.endpointSensitivity.shortenedWindowTauMs!, fit.tauMs)) > 1e-9
    || !["measured", "poor-fit", "unavailable"].includes(value.sensitivityStatus)
    || (value.glantz !== null && (!fitFinite(value.glantz)
      || !(value.glantz.tauMs > 0) || value.glantz.rSquared < 0 || value.glantz.rSquared > 1
      || value.glantz.pressureRmseMmHg < 0 || value.glantz.normalizedPressureRmse < 0))
    || value.sensitivityStatus !== (value.glantz === null ? "unavailable"
      : value.glantz.rSquared >= p.minimumGlantzRSquared
        && value.glantz.normalizedPressureRmse <= p.maximumNormalizedPressureRmse ? "measured" : "poor-fit")) {
    throw new Error("LV relaxation tau observation unresolved or incoherent");
  }
}

/** An unreviewed post-closure re-rise is an evidence hold, NOT a diagnosis of
 * ringing. Do not conceal it by starting the exponential fit after the rise.
 * Only floating-point pressure noise is ignored; no human normal cutoff is claimed. */
export function assertMainWireRelaxationTraceReviewedV1(value: MainWireRelaxationTauV1): void {
  const trace = value.relaxationTrace;
  if (!trace || !Number.isFinite(trace.maximumDipAndRecoveryMmHg)
    || !Number.isFinite(trace.maximumRiseFromRunningMinimumMmHg)
    || trace.maximumRiseFromRunningMinimumMmHg < 0 || trace.maximumRiseFromRunningMinimumMmHg > 1e-7
    || trace.maximumDipAndRecoveryMmHg < 0 || trace.maximumDipAndRecoveryMmHg > 1e-7
    || !Array.isArray(trace.excursions) || trace.excursions.some(e => ![e.peakTimeSec, e.valleyTimeSec,
      e.recoveryTimeSec, e.fallMmHg, e.riseMmHg, e.dipAndRecoveryMmHg, e.durationSec].every(Number.isFinite)
      || !(e.peakTimeSec < e.valleyTimeSec && e.valleyTimeSec < e.recoveryTimeSec)
      || e.fallMmHg < 0 || e.riseMmHg < 0 || e.riseMmHg > 1e-7
      || Math.abs(e.durationSec - (e.recoveryTimeSec - e.peakTimeSec)) > 1e-9
      || Math.abs(e.dipAndRecoveryMmHg - Math.min(e.fallMmHg, e.riseMmHg)) > 1e-9
      || e.dipAndRecoveryMmHg < 0 || e.dipAndRecoveryMmHg > 1e-7)) {
    throw new Error("LV post-closure pressure re-rise requires mechanistic review");
  }
}

function linearFit(x: number[], y: number[], weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const mean = (values: number[]) => values.reduce((a, b, i) => a + b * weights[i]!, 0) / sum;
  const mx = mean(x), my = mean(y);
  const xx = x.reduce((a, b, i) => a + weights[i]! * (b - mx) ** 2, 0);
  const yy = y.reduce((a, b, i) => a + weights[i]! * (b - my) ** 2, 0);
  const xy = x.reduce((a, b, i) => a + weights[i]! * (b - mx) * (y[i]! - my), 0);
  if (!(xx > 0 && yy > 0)) return null;
  const slope = xy / xx, intercept = my - slope * mx;
  return { slope, intercept, rSquared: Math.max(0, Math.min(1, xy * xy / (xx * yy))) };
}

/** Descriptive turning points, including a dip before a higher second peak.
 * No smoothing, normality threshold or inference that a rise is ringing.
 * Equal-valued plateaus retain the first extremum timestamp. */
function measureMainWirePressureReboundsV1(points: readonly {
  timeSec: number; pressureMmHg: number;
}[]) {
  if (points.length < 2 || points.some((p, i) => !Number.isFinite(p.timeSec)
    || !Number.isFinite(p.pressureMmHg) || (i > 0 && p.timeSec <= points[i - 1]!.timeSec))) {
    throw new Error("pressure rebounds require finite chronological points");
  }
  const excursions: { peakTimeSec: number; valleyTimeSec: number; recoveryTimeSec: number;
    fallMmHg: number; riseMmHg: number; dipAndRecoveryMmHg: number; durationSec: number }[] = [];
  let peak = 0, valley = 0, recovery = 0, falling = false, risingAfterFall = false;
  const record = () => {
    if (!risingAfterFall) return;
    const fall = points[peak]!.pressureMmHg - points[valley]!.pressureMmHg;
    const rise = points[recovery]!.pressureMmHg - points[valley]!.pressureMmHg;
    excursions.push({ peakTimeSec: points[peak]!.timeSec, valleyTimeSec: points[valley]!.timeSec,
      recoveryTimeSec: points[recovery]!.timeSec, fallMmHg: fall, riseMmHg: rise,
      dipAndRecoveryMmHg: Math.min(fall, rise), durationSec: points[recovery]!.timeSec - points[peak]!.timeSec });
  };
  for (let i = 1; i < points.length; i++) {
    const change = points[i]!.pressureMmHg - points[i - 1]!.pressureMmHg;
    if (change < 0) {
      if (risingAfterFall) { record(); peak = recovery; risingAfterFall = false; }
      falling = true; valley = i;
    } else if (change > 0) {
      if (falling) { risingAfterFall = true; recovery = i; }
      else peak = i;
    }
  }
  record();
  let runningMinimum = points[0]!.pressureMmHg, maximumRiseFromRunningMinimumMmHg = 0;
  for (const p of points) {
    runningMinimum = Math.min(runningMinimum, p.pressureMmHg);
    maximumRiseFromRunningMinimumMmHg = Math.max(maximumRiseFromRunningMinimumMmHg, p.pressureMmHg - runningMinimum);
  }
  return { maximumDipAndRecoveryMmHg: Math.max(0, ...excursions.map(p => p.dipAndRecoveryMmHg)),
    maximumRiseFromRunningMinimumMmHg, excursions };
}
