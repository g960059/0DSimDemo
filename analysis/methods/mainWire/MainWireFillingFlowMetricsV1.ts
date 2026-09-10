import type { MainWireCardiacCycleAcceptedSampleV1 as Sample } from "./MainWireCardiacCycleMetricsV1";

export const MAIN_WIRE_FILLING_FLOW_METHOD_V1_ID = "main-wire-regular-sinus-volumetric-filling-flow-v1" as const;
export const MAIN_WIRE_FILLING_FLOW_OUTPUT_IDS_V1 = Object.freeze({
  mitralPeakEToA: "hemodynamics.ratio.peak-E-to-A.volumetric.MV",
  mitralDecelerationTimeMs: "hemodynamics.duration.E-deceleration-80-40.volumetric.MV",
  mitralADurationMs: "hemodynamics.duration.A-zero-crossing.volumetric.MV",
  pulmonarySystolicPeakFlowMlPerSec: "hemodynamics.flow.peak-systolic-ejection.PVein_LA",
  pulmonaryDiastolicPeakFlowMlPerSec: "hemodynamics.flow.peak-early-diastolic.PVein_LA",
  pulmonaryPeakSToD: "hemodynamics.ratio.peak-S-to-D.volumetric.PVein_LA",
  pulmonaryArPeakMagnitudeMlPerSec: "hemodynamics.flow.peak-atrial-reversal-magnitude.PVein_LA",
  pulmonaryArDurationMs: "hemodynamics.duration.atrial-reversal-zero-crossing.PVein_LA",
  pulmonaryArMinusADurationMs: "hemodynamics.duration.Ar-minus-A.volumetric.PVein_LA-MV",
} as const);
export type MainWireFillingFlowOutputIdV1 = (typeof MAIN_WIRE_FILLING_FLOW_OUTPUT_IDS_V1)[keyof typeof MAIN_WIRE_FILLING_FLOW_OUTPUT_IDS_V1];
export const MAIN_WIRE_FILLING_FLOW_ANALYSIS_OUTPUT_IDS_V1 = Object.freeze(Object.values(MAIN_WIRE_FILLING_FLOW_OUTPUT_IDS_V1));
export const MAIN_WIRE_FILLING_FLOW_REQUIRED_EXACT_OUTPUT_IDS_V1 = Object.freeze([
  "rhythm.phase.regular-sinus", "hemodynamics.flow.valve.MV", "hemodynamics.flow.valve.AoV", "hemodynamics.flow.venous.PVein_LA",
] as const);
const [phaseId, mvId, aoId, pvId] = MAIN_WIRE_FILLING_FLOW_REQUIRED_EXACT_OUTPUT_IDS_V1;
const ids = MAIN_WIRE_FILLING_FLOW_OUTPUT_IDS_V1;
const tolerance = 1e-12;
type FlowId = typeof mvId | typeof aoId | typeof pvId;
type Point = Readonly<{ time: number; value: number }>;
type Episode = Readonly<{ onset: number; offset: number }>;
type Values = Record<MainWireFillingFlowOutputIdV1, number | null>;
type Reasons = Partial<Record<MainWireFillingFlowOutputIdV1, string>>;
export type MainWireFillingFlowResultV1 = Readonly<{
  methodId: typeof MAIN_WIRE_FILLING_FLOW_METHOD_V1_ID;
  status: "available" | "unavailable";
  values: Readonly<Values>;
  unavailableReasons: Readonly<Reasons>;
  source: Readonly<{ cycleStartTimeSec: number; atrialActivationTimeSec: number; observationEndTimeSec: number }> | null;
}>;

/** Clinical measurement provenance: ASE 2025, Table 3, doi:10.1016/j.echo.2025.03.011.
 * This is an explicit model adaptation, NOT a Doppler implementation: total
 * volumetric flow, phase-origin atrial activation (not ECG), and an 80→40% E
 * downstroke secant extrapolated to zero (not a manually traced Doppler slope).
 * S is the peak during aortic ejection, avoiding the earlier S1; D is the
 * resolved early-filling peak. Ar must be a separate, fully observed reversal
 * after atrial activation and before the following ejection; sustained systolic
 * reversal is not assigned an Ar duration. A duration needs actual zero-flow
 * boundaries, never a guessed foot on the residual E tail. No normality gates.
 *
 * Three observed atrial phase wraps supply a complete filling sequence plus
 * its FOLLOWING A wave. E and the earlier A from the same phase cycle must not
 * be paired. No periodic stitching, phase-percentage windows or synthetic beat.
 */
export function buildMainWireFillingFlowMetricsV1(samples: readonly Sample[]): MainWireFillingFlowResultV1 {
  const values = Object.fromEntries(Object.values(ids).map(id => [id, null])) as Values;
  const reasons: Reasons = {};
  let source: MainWireFillingFlowResultV1["source"] = null;
  const finish = (reason?: string): MainWireFillingFlowResultV1 => {
    for (const id of Object.values(ids)) if (values[id] === null && reasons[id] === undefined)
      reasons[id] = reason ?? "unresolved-flow-landmarks";
    return { methodId: MAIN_WIRE_FILLING_FLOW_METHOD_V1_ID,
      status: Object.values(values).some(value => value !== null) ? "available" : "unavailable",
      values, unavailableReasons: reasons, source };
  };
  if (!validSamples(samples)) return finish("invalid-or-discontinuous-2ms-observation");
  const boundaries = atrialBoundaries(samples);
  if (boundaries.length < 3) return finish("awaiting-complete-filling-and-following-atrial-wave");
  const [start, atrial, end] = boundaries.slice(-3) as [number, number, number];
  source = { cycleStartTimeSec: start, atrialActivationTimeSec: atrial, observationEndTimeSec: end };
  const series = (id: FlowId, from: number, to: number, sign = 1) => pointsBetween(samples, id, from, to, sign);
  const aorticPoints = series(aoId, start, atrial), nextAorticPoints = series(aoId, atrial, end);
  const aortic = episodes(aorticPoints);
  const nextAortic = episodes(nextAorticPoints);
  // No arbitrary largest-episode choice for ectopic/multiejection filling.
  if (aortic.length !== 1 || nextAortic.length !== 1
    || [aorticPoints[0]!, aorticPoints.at(-1)!, nextAorticPoints.at(-1)!].some(p => p.value > 0))
    return finish("requires-one-complete-ejection-on-each-side-of-atrial-activation");
  const ejection = aortic[0]!;
  const nextEjection = nextAortic[0]!;
  const mitralTransitions = zeroTransitions(series(mvId, start, nextEjection.onset));
  const opening = mitralTransitions.find(event => event.rising && event.time > ejection.offset);
  const closure = mitralTransitions.filter(event => !event.rising && event.time > atrial).at(-1);
  const earlierClosure = mitralTransitions.filter(event => !event.rising && event.time < ejection.onset).at(-1);
  if (opening === undefined || closure === undefined || earlierClosure === undefined
    || opening.time >= atrial || closure.time >= nextEjection.onset
    || series(mvId, earlierClosure.time, ejection.offset).some(p => p.value > tolerance)) {
    return finish("missing-or-overlapping-mitral-filling-landmarks");
  }
  const early = series(mvId, opening.time, atrial);
  // Observe the entire following A region. The first closure can belong to an
  // extra pulse and must not hide a second pulse or a still-open final episode.
  const late = series(mvId, atrial, nextEjection.onset);
  const lateEpisodes = episodes(late);
  const e = resolvedPeak(early);
  const a = lateEpisodes.length <= 1 && late.at(-1)!.value <= tolerance
    ? resolvedPeak(late) : null;
  if (e !== null && a !== null) values[ids.mitralPeakEToA] = e.value / a.value;
  else reasons[ids.mitralPeakEToA] = "E-or-A-peak-unresolved-or-fused";

  const dt = e === null ? null : deceleration80To40(early, e);
  if (dt !== null) values[ids.mitralDecelerationTimeMs] = dt * 1000;
  else reasons[ids.mitralDecelerationTimeMs] = "E-downstroke-not-resolved-before-atrial-activation";

  const aEpisode = a === null ? undefined : lateEpisodes.find(p => p.onset < a.time && p.offset > a.time);
  if (aEpisode !== undefined) values[ids.mitralADurationMs] = (aEpisode.offset - aEpisode.onset) * 1000;
  else reasons[ids.mitralADurationMs] = "A-wave-has-no-separate-observed-zero-flow-onset-and-offset";

  const systolic = resolvedPeak(series(pvId, ejection.onset, ejection.offset), true);
  const diastolic = resolvedPeak(series(pvId, opening.time, atrial), true);
  if (systolic !== null) values[ids.pulmonarySystolicPeakFlowMlPerSec] = systolic.value;
  if (diastolic !== null) values[ids.pulmonaryDiastolicPeakFlowMlPerSec] = diastolic.value;
  if (systolic !== null && diastolic !== null) values[ids.pulmonaryPeakSToD] = systolic.value / diastolic.value;

  const reversed = series(pvId, atrial, nextEjection.onset, -1);
  const reversalEpisodes = episodes(reversed);
  const reversal = reversalEpisodes.length === 1 ? reversalEpisodes[0]! : null;
  const ar = reversal === null ? null : resolvedPeak(series(pvId, reversal.onset, reversal.offset, -1));
  if (ar !== null && reversed[0]!.value <= 0 && reversed.at(-1)!.value <= 0) {
    values[ids.pulmonaryArPeakMagnitudeMlPerSec] = ar.value;
    values[ids.pulmonaryArDurationMs] = (reversalEpisodes[0]!.offset - reversalEpisodes[0]!.onset) * 1000;
    if (values[ids.mitralADurationMs] !== null)
      values[ids.pulmonaryArMinusADurationMs] = values[ids.pulmonaryArDurationMs]! - values[ids.mitralADurationMs]!;
  } else {
    reasons[ids.pulmonaryArDurationMs] = reasons[ids.pulmonaryArPeakMagnitudeMlPerSec]
      = "no-isolated-atrial-reversal-before-ejection";
  }
  if (values[ids.pulmonaryArMinusADurationMs] === null)
    reasons[ids.pulmonaryArMinusADurationMs] = "both-matched-A-and-Ar-durations-required";
  return finish();
}

function validSamples(samples: readonly Sample[]) {
  return samples.every((s, i) => Number.isInteger(s.inputEpoch) && s.inputEpoch === samples[0]!.inputEpoch
    && Number.isInteger(s.acceptedRevision) && s.acceptedRevision >= 0 && Number.isFinite(s.acceptedTimeSec)
    && MAIN_WIRE_FILLING_FLOW_REQUIRED_EXACT_OUTPUT_IDS_V1.every(id => typeof s.values[id] === "number" && Number.isFinite(s.values[id]))
    && s.values[phaseId]! >= 0 && s.values[phaseId]! < 1 + tolerance
    && (i === 0 || (s.acceptedRevision > samples[i - 1]!.acceptedRevision
      && Math.abs(s.acceptedTimeSec - samples[i - 1]!.acceptedTimeSec - .002) <= 2e-12
      && (s.values[phaseId]! > samples[i - 1]!.values[phaseId]!
        || samples[i - 1]!.values[phaseId]! - s.values[phaseId]! > .5))));
}

function atrialBoundaries(samples: readonly Sample[]) {
  const result: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!, b = samples[i]!;
    if (a.values[phaseId]! - b.values[phaseId]! > .5)
      result.push(a.acceptedTimeSec + (1 - a.values[phaseId]!) / (1 + b.values[phaseId]! - a.values[phaseId]!) * (b.acceptedTimeSec - a.acceptedTimeSec));
  }
  return result;
}

function valueAt(samples: readonly Sample[], id: FlowId, time: number): number {
  let low = 0, high = samples.length - 1;
  while (low < high) { const mid = Math.floor((low + high) / 2); if (samples[mid]!.acceptedTimeSec < time) low = mid + 1; else high = mid; }
  const b = samples[low]!, a = samples[Math.max(0, low - 1)]!;
  if (Math.abs(b.acceptedTimeSec - time) <= tolerance || a === b) return b.values[id]!;
  return a.values[id]! + (b.values[id]! - a.values[id]!) * (time - a.acceptedTimeSec) / (b.acceptedTimeSec - a.acceptedTimeSec);
}

function pointsBetween(samples: readonly Sample[], id: FlowId, from: number, to: number, sign: number): Point[] {
  return [{ time: from, value: sign * valueAt(samples, id, from) },
    ...samples.filter(s => s.acceptedTimeSec > from + tolerance && s.acceptedTimeSec < to - tolerance)
      .map(s => ({ time: s.acceptedTimeSec, value: sign * s.values[id]! })),
    { time: to, value: sign * valueAt(samples, id, to) }];
}

function zeroTransitions(points: readonly Point[]) {
  const result: { time: number; rising: boolean }[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!, b = points[i]!;
    if ((a.value > 0) !== (b.value > 0)) result.push({
      time: a.time + (b.time - a.time) * a.value / (a.value - b.value), rising: b.value > 0 });
  }
  return result;
}

function episodes(points: readonly Point[]): Episode[] {
  let onset: number | null = null;
  const result: Episode[] = [];
  for (const event of zeroTransitions(points)) {
    if (event.rising) onset = event.time;
    else if (onset !== null) { result.push({ onset, offset: event.time }); onset = null; }
  }
  return result;
}

/** A resolved interior maximum, not a phase-window endpoint or truncated wave.
 * Multiple distinct peaks are not collapsed into a guessed wave. A flat top
 * is allowed, but additional reversals >2% of the peak invalidate the label.
 * 2% is a segmentation tolerance, not a clinical normality cutoff. */
function resolvedPeak(points: readonly Point[], allowInitialDescent = false): Point | null {
  if (points.length < 3) return null;
  let index = 0;
  for (let i = 1; i < points.length; i++) if (points[i]!.value > points[index]!.value) index = i;
  const peak = points[index]!;
  if (index === 0 || index === points.length - 1 || !(peak.value > 0)
    || !(peak.value > Math.max(0, points[0]!.value, points.at(-1)!.value) + tolerance * Math.max(1, peak.value))) return null;
  // PV S2 can begin on the descending tail of S1; D can begin on the
  // descending tail of S. That boundary tail is not a second interior wave.
  let risingStart = 0;
  if (allowInitialDescent) {
    while (risingStart + 1 < index && points[risingStart + 1]!.value <= points[risingStart]!.value) risingStart++;
  }
  let running = points[risingStart]!.value;
  for (let i = risingStart + 1; i < index; i++) { if (running - points[i]!.value > peak.value * .02) return null; running = Math.max(running, points[i]!.value); }
  running = peak.value;
  for (let i = index + 1; i < points.length; i++) { if (points[i]!.value - running > peak.value * .02) return null; running = Math.min(running, points[i]!.value); }
  return peak;
}

function deceleration80To40(points: readonly Point[], peak: Point): number | null {
  let t80: number | null = null, t40: number | null = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!, b = points[i]!;
    if (a.time < peak.time) continue;
    for (const fraction of [.8, .4]) {
      const target = peak.value * fraction;
      if (a.value >= target && b.value < target) {
        const t = a.time + (target - a.value) / (b.value - a.value) * (b.time - a.time);
        if (fraction === .8 && t80 === null) t80 = t;
        if (fraction === .4 && t40 === null) t40 = t;
      }
    }
  }
  if (t80 === null || t40 === null || t40 <= t80 || t40 - t80 < .006) return null;
  return t80 + 2 * (t40 - t80) - peak.time;
}
