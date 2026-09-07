import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { countMainWireIntegratedModelSignificantPressurePeaksV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";

export const MAIN_WIRE_EJECTION_SHAPE_DIAGNOSTIC_POLICY_V1 = Object.freeze({
  methodId: "main-wire-ejection-shape-diagnostics-v2",
  forwardThreshold: "max(1 mL/s, 1% of peak AoV flow)",
  lateExpelledVolumeFraction: [0.5, 0.9] as const,
  interpolation: "piecewise-linear-accepted-endpoints-no-smoothing",
  pressureBasis: "transmural-for-PV-chord-intracavitary-for-time-peaks",
  reboundWindow: "all-local-fall-rise-pairs-within-forward-ejection; legacy-post-global-maximum-also-retained",
  phaseCoordinates: "elapsed accepted time and expelled LV volume, separately; first maximum; thresholded episode endpoints",
  centralTimeWindow: [0.25, 0.75] as const,
  clinicalThreshold: null,
  claim: "descriptive-shape-comparison-not-physiological-acceptance-or-causal-attribution",
});

/** Deliberately rejects incomplete or multi-episode traces. The volume window
 * excludes the Q -> 0 closure corner; no noisy second derivative is fitted. */
export function measureMainWireEjectionShapeDiagnosticsV1(samples: readonly Sample[]) {
  if (samples.length < 5 || samples.some((s, i) =>
    ![s.acceptedTimeSec, s.valveFlowMlPerSec.AoV, s.chamberVolumeMl.LV,
      s.transmuralPressureMmHg.LV, s.absolutePressureMmHg.LV,
      s.absolutePressureMmHg.Ao].every(Number.isFinite)
    || (i > 0 && s.acceptedTimeSec <= samples[i - 1]!.acceptedTimeSec))) {
    throw new Error("ejection shape requires finite chronological accepted samples");
  }
  const threshold = Math.max(1, .01 * Math.max(...samples.map(s => s.valveFlowMlPerSec.AoV)));
  const indices = samples.flatMap((s, i) => s.valveFlowMlPerSec.AoV > threshold ? [i] : []);
  if (indices.length < 5 || indices[0] === 0 || indices.at(-1) === samples.length - 1
    || indices.some((index, i) => i > 0 && index !== indices[i - 1]! + 1)) {
    throw new Error("ejection shape requires one complete non-wrapping forward episode");
  }
  const forward = indices.map(i => samples[i]!);
  const v0 = forward[0]!.chamberVolumeMl.LV, v1 = forward.at(-1)!.chamberVolumeMl.LV;
  if (!(v0 > v1) || forward.some((s, i) => i > 0 && s.chamberVolumeMl.LV >= forward[i - 1]!.chamberVolumeMl.LV)) {
    throw new Error("ejection shape requires strictly decreasing LV volume");
  }
  const xy = forward.map(s => ({ x: (v0 - s.chamberVolumeMl.LV) / (v0 - v1), y: s.transmuralPressureMmHg.LV }));
  const interpolate = (x: number) => {
    const i = xy.findIndex(p => p.x >= x);
    const a = xy[i - 1]!, b = xy[i]!;
    return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
  };
  const [lo, hi] = MAIN_WIRE_EJECTION_SHAPE_DIAGNOSTIC_POLICY_V1.lateExpelledVolumeFraction;
  const p0 = interpolate(lo), p1 = interpolate(hi);
  const chordResidual = xy.filter(p => p.x >= lo && p.x <= hi)
    .map(p => p.y - p0 - (p1 - p0) * (p.x - lo) / (hi - lo));
  const waveform = (read: (s: Sample) => number) => {
    const values = forward.map(read), peakIndex = values.indexOf(Math.max(...values));
    const t0 = forward[0]!.acceptedTimeSec, duration = forward.at(-1)!.acceptedTimeSec - t0;
    const timePhase = forward.map(s => (s.acceptedTimeSec - t0) / duration);
    const pressureAt = (x: number) => {
      const i = timePhase.findIndex(phase => phase >= x);
      return values[i - 1]! + (values[i]! - values[i - 1]!) * (x - timePhase[i - 1]!)
        / (timePhase[i]! - timePhase[i - 1]!);
    };
    const [begin, end] = MAIN_WIRE_EJECTION_SHAPE_DIAGNOSTIC_POLICY_V1.centralTimeWindow;
    const central = [pressureAt(begin), pressureAt(end), ...values.filter((_, i) => timePhase[i]! >= begin && timePhase[i]! <= end)];
    const fullRange = Math.max(...values) - Math.min(...values);
    let minimum = values[peakIndex]!, rebound = 0;
    for (const value of values.slice(peakIndex + 1)) {
      minimum = Math.min(minimum, value);
      rebound = Math.max(rebound, value - minimum);
    }
    return { significantPeakCount: countMainWireIntegratedModelSignificantPressurePeaksV1(values),
      maximumPostPeakReboundMmHg: rebound,
      localRebounds: measureMainWirePressureReboundsV1(forward.map((s, i) => ({
        timeSec: s.acceptedTimeSec, pressureMmHg: values[i]!,
      }))),
      peakElapsedTimeFraction: timePhase[peakIndex]!,
      peakExpelledVolumeFraction: xy[peakIndex]!.x,
      centralTimePressureRangeFraction: fullRange > 0 ? (Math.max(...central) - Math.min(...central)) / fullRange : 0 };
  };
  return Object.freeze({ policy: MAIN_WIRE_EJECTION_SHAPE_DIAGNOSTIC_POLICY_V1,
    forwardThresholdMlPerSec: threshold,
    retainedEjectedVolumeMl: v0 - v1,
    latePvChordDeficitMmHg: Math.max(0, -Math.min(...chordResidual)),
    LVP: waveform(s => s.absolutePressureMmHg.LV),
    AoP: waveform(s => s.absolutePressureMmHg.Ao),
  });
}

/** Descriptive turning points, including a dip before a higher second peak.
 * No smoothing, normality threshold or inference that a rise is ringing.
 * Equal-valued plateaus retain the first extremum timestamp. */
export function measureMainWirePressureReboundsV1(points: readonly {
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
