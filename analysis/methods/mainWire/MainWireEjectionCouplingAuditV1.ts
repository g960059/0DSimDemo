import type { MainWireIntegratedModelCompletedBeatMetricsV3 } from
  "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type { MainWireIntegratedModelPeriodicTerminalTraceSampleV3 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_EJECTION_COUPLING_AUDIT_V1_ID = "main-wire-ejection-coupling-audit-v1" as const;
type ExactSample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
export type MainWireEjectionCouplingTraceSampleV1 = Readonly<
  Pick<ExactSample, "acceptedTimeSec" | "acceptedDtSec"> & {
    chamberVolumeMl: Pick<ExactSample["chamberVolumeMl"], "LV">;
    absolutePressureMmHg: Pick<ExactSample["absolutePressureMmHg"], "LV" | "Ao">;
    transmuralPressureMmHg: Pick<ExactSample["transmuralPressureMmHg"], "LV">;
    valveFlowMlPerSec: Pick<ExactSample["valveFlowMlPerSec"], "AoV">;
    /** Actual contemporaneous effective area, never anatomical/max area. */
    aorticEffectiveAreaCm2?: number | null;
  }>;
export type MainWireEjectionCouplingBeatV1 = Readonly<
  Pick<MainWireIntegratedModelCompletedBeatMetricsV3, "startTimeSec" | "endTimeSec" | "durationSec"> & {
    leftVentricularValveEventMetrics: Pick<MainWireIntegratedModelCompletedBeatMetricsV3["leftVentricularValveEventMetrics"],
      "inletValveId" | "semilunarValveId" | "endDiastolic" | "endSystolic">;
    valveForwardPressureGradients: { AoV: Pick<MainWireIntegratedModelCompletedBeatMetricsV3["valveForwardPressureGradients"]["AoV"],
      "forwardFlowDurationSec"> };
    pressureSummaries: { Ao: Pick<MainWireIntegratedModelCompletedBeatMetricsV3["pressureSummaries"]["Ao"],
      "maximumMmHg" | "minimumMmHg" | "pulseMmHg"> };
  }>;

export class MainWireEjectionCouplingUnavailableErrorV1 extends Error {
  constructor(readonly code: "invalid-trace" | "invalid-completed-beat" | "incomplete-or-ambiguous-ejection"
    | "inconsistent-ejection-duration", message: string) {
    super(`Ejection coupling audit unavailable: ${message}`);
    this.name = "MainWireEjectionCouplingUnavailableErrorV1";
  }
}

type PointV1 = Readonly<{ timeSec: number; volumeMl: number; lvAbsoluteMmHg: number;
  lvTransmuralMmHg: number; aoAbsoluteMmHg: number }>;
type TransitionV1 = PointV1 & Readonly<{ kind: "opening" | "closure";
  basis: "accepted-sample-flow-zero" | "linearly-interpolated-flow-zero";
  bracketStartTimeSec: number; bracketEndTimeSec: number }>;

/** Research descriptors only. No physiological ranges, gate, smoothing, inferred
 * Doppler gradient, dP/dV or dP/dt divided by near-zero flow. The caller binds the
 * accepted trace to its trusted exact completed beat; no periodic seam is made. */
export function auditMainWireEjectionCouplingV1(input: Readonly<{
  samples: readonly MainWireEjectionCouplingTraceSampleV1[];
  completedBeat: MainWireEjectionCouplingBeatV1;
}>) {
  const { samples, completedBeat: beat } = input;
  validateV1(samples, beat);
  const transitions: TransitionV1[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const a = samples[index - 1]!, b = samples[index]!;
    const qa = a.valveFlowMlPerSec.AoV, qb = b.valveFlowMlPerSec.AoV;
    if ((qa > 0) === (qb > 0)) continue;
    const fraction = qa / (qa - qb);
    const point = interpolatePointV1(pointV1(a), pointV1(b), fraction);
    if (point.timeSec <= beat.startTimeSec || point.timeSec >= beat.endTimeSec) continue;
    transitions.push({ ...point, kind: qb > 0 ? "opening" : "closure",
      basis: fraction === 0 || fraction === 1 ? "accepted-sample-flow-zero" : "linearly-interpolated-flow-zero",
      bracketStartTimeSec: a.acceptedTimeSec, bracketEndTimeSec: b.acceptedTimeSec });
  }
  const opening = transitions[0], closure = transitions[1];
  const ed = beat.leftVentricularValveEventMetrics.endDiastolic!;
  const es = beat.leftVentricularValveEventMetrics.endSystolic!;
  if (transitions.length !== 2 || opening?.kind !== "opening" || closure?.kind !== "closure"
    || !(opening.timeSec > ed.timeSec) || !nearV1(closure.timeSec, es.timeSec)) {
    unavailableV1("incomplete-or-ambiguous-ejection", "one fully bracketed forward-flow episode ending at this beat's exact AoV closure is required");
  }
  const durationSec = closure.timeSec - opening.timeSec;
  if (!nearV1(durationSec, beat.valveForwardPressureGradients.AoV.forwardFlowDurationSec)) {
    unavailableV1("inconsistent-ejection-duration", "observed episode differs from completed-beat total forward-flow duration");
  }
  const volumeLossMl = opening.volumeMl - closure.volumeMl;
  const forward = samples.flatMap((sample, sourceSampleIndex) => sample.acceptedTimeSec > opening.timeSec
    && sample.acceptedTimeSec < closure.timeSec && sample.valveFlowMlPerSec.AoV > 0 ? [{ sample, sourceSampleIndex }] : []);
  if (forward.length === 0) unavailableV1("incomplete-or-ambiguous-ejection", "no accepted forward-flow sample");
  const alignedSamples = forward.map(({ sample, sourceSampleIndex }) => {
    const area = sample.aorticEffectiveAreaCm2;
    const availableArea = typeof area === "number" && Number.isFinite(area) && area > 0 ? area : null;
    const velocity = availableArea === null ? null : sample.valveFlowMlPerSec.AoV / availableArea / 100;
    const point = pointV1(sample);
    return Object.freeze({ sourceSampleIndex, ...point, acceptedDtSec: sample.acceptedDtSec,
      timeFromOpeningSec: point.timeSec - opening.timeSec,
      ejectionPhase01: (point.timeSec - opening.timeSec) / durationSec,
      expelledVolumeFraction01: volumeLossMl > 0 ? (opening.volumeMl - point.volumeMl) / volumeLossMl : null,
      aorticFlowMlPerSec: sample.valveFlowMlPerSec.AoV,
      signedLvAoGradientMmHg: point.lvAbsoluteMmHg - point.aoAbsoluteMmHg,
      aorticEffectiveAreaCm2: availableArea,
      jetVelocityMPerSec: velocity !== null && Number.isFinite(velocity) ? velocity : null });
  });
  const peak = (read: (sample: typeof alignedSamples[number]) => number) => {
    const at = alignedSamples.reduce((best, sample) => read(sample) > read(best) ? sample : best);
    return Object.freeze({ value: read(at), timeSec: at.timeSec, timeFromOpeningSec: at.timeFromOpeningSec,
      ejectionPhase01: at.ejectionPhase01, sourceSampleIndex: at.sourceSampleIndex });
  };
  const flowPeak = peak((sample) => sample.aorticFlowMlPerSec);
  const velocityAvailable = alignedSamples.every((sample) => sample.jetVelocityMPerSec !== null
    && Number.isFinite(sample.jetVelocityMPerSec));
  const nodes = [opening, ...alignedSamples, closure];
  let signedGradientIntegral = 0, adverseGradientDurationSec = 0;
  // Zero-flow boundary pressures are not observations during positive flow.
  // Integrate only intervals with two positive-flow accepted endpoints.
  const coveredDurationSec = alignedSamples[alignedSamples.length - 1]!.timeSec - alignedSamples[0]!.timeSec;
  for (let index = 1; index < alignedSamples.length; index += 1) {
    const a = alignedSamples[index - 1]!, b = alignedSamples[index]!;
    const ga = a.lvAbsoluteMmHg - a.aoAbsoluteMmHg, gb = b.lvAbsoluteMmHg - b.aoAbsoluteMmHg;
    const dt = b.timeSec - a.timeSec;
    signedGradientIntegral += (ga + gb) / 2 * dt;
    adverseGradientDurationSec += ga < 0 && gb < 0 ? dt : ga >= 0 && gb >= 0 ? 0
      : dt * (ga < 0 ? -ga : -gb) / Math.abs(gb - ga);
  }
  const pressurePeaks = Object.freeze({ lvAbsolute: peak((sample) => sample.lvAbsoluteMmHg),
    lvTransmural: peak((sample) => sample.lvTransmuralMmHg), aoAbsolute: peak((sample) => sample.aoAbsoluteMmHg) });
  return Object.freeze({ methodId: MAIN_WIRE_EJECTION_COUPLING_AUDIT_V1_ID,
    role: "research-only-descriptors-no-physiological-pass-fail" as const,
    endpointMethod: "positive-native-AoV-flow-zero-crossings-bound-to-exact-completed-beat-closure" as const,
    peakMethod: "earliest-maximum-accepted-sample-strictly-during-forward-flow-no-interpolation" as const,
    beat: Object.freeze({ startTimeSec: beat.startTimeSec, endTimeSec: beat.endTimeSec, durationSec: beat.durationSec }),
    ejection: Object.freeze({ opening: Object.freeze(opening), closure: Object.freeze(closure), durationSec, volumeLossMl,
      forwardSampleCount: alignedSamples.length }),
    flow: Object.freeze({ basis: "native-volumetric-flow" as const, unit: "ml/s" as const, peak: flowPeak }),
    velocity: Object.freeze({ basis: "native-flow-divided-by-contemporaneous-effective-area-not-Doppler" as const,
      unit: "m/s" as const, status: velocityAvailable ? "available" as const : "unavailable" as const,
      issue: velocityAvailable ? null : "effective-area-missing-or-invalid-at-one-or-more-forward-samples",
      peak: velocityAvailable ? peak((sample) => sample.jetVelocityMPerSec!) : null }),
    pressure: Object.freeze({ unit: "mmHg" as const, peaks: pressurePeaks,
      lvAbsolutePeakMinusFlowPeakSec: pressurePeaks.lvAbsolute.timeSec - flowPeak.timeSec,
      aoAbsolutePeakMinusFlowPeakSec: pressurePeaks.aoAbsolute.timeSec - flowPeak.timeSec }),
    gradient: Object.freeze({ basis: "raw-signed-LV-minus-Ao-absolute-pressure-during-forward-flow" as const,
      endpointConvention: "strictly-positive-flow-accepted-samples-only-zero-flow-boundaries-excluded" as const,
      integrationMethod: "piecewise-linear-between-positive-flow-accepted-samples" as const,
      coveredDurationSec, coverageFractionOfEjection: coveredDurationSec / durationSec,
      minimumMmHg: Math.min(...alignedSamples.map((point) => point.signedLvAoGradientMmHg)),
      maximumMmHg: Math.max(...alignedSamples.map((point) => point.signedLvAoGradientMmHg)),
      timeWeightedMeanMmHg: coveredDurationSec > 0 ? signedGradientIntegral / coveredDurationSec : null,
      adverseGradientDurationSec,
      adverseGradientDurationFraction: coveredDurationSec > 0 ? adverseGradientDurationSec / coveredDurationSec : null }),
    centralAorticPressure: Object.freeze({ basis: "completed-beat-exact-Ao-node-absolute-pressure-summary" as const,
      ...beat.pressureSummaries.Ao }),
    pvRoof: Object.freeze({ normalizedVolumeBasis: "(opening-LV-volume-minus-LV-volume)/ejection-volume-loss" as const,
      residualSign: "positive-above-chord-negative-below-chord" as const,
      windowCaveat: "preselected-descriptive-volume-windows-not-clinical-thresholds" as const,
      absolute: roofV1(nodes, "lvAbsoluteMmHg"), transmural: roofV1(nodes, "lvTransmuralMmHg") }),
    caveats: Object.freeze([
      "No resampling, smoothing, inferred periodic seam, physiological normal range or acceptance decision.",
      "Flow-zero endpoints are sampled or linearly interpolated, not sub-step physical valve-opening times.",
      "Peaks are accepted forward-flow sample maxima; between-sample peaks and endpoint limits are not peak observations.",
      "LV-Ao is an absolute-pressure port difference, not a Bernoulli/Doppler or transmural gradient.",
      "Gradient integration excludes zero-flow endpoint intervals and reports its shorter observed coverage.",
      "Central Ao pulse pressure comes from the full exact completed beat; the supplied trace need only bracket ejection.",
      "Chord residuals depend on window endpoints and pressure basis; they do not identify a causal mechanism.",
    ]), alignedSamples: Object.freeze(alignedSamples) });
}
export type MainWireEjectionCouplingAuditV1 = ReturnType<typeof auditMainWireEjectionCouplingV1>;

function roofV1(nodes: readonly PointV1[], pressure: "lvAbsoluteMmHg" | "lvTransmuralMmHg") {
  const first = nodes[0]!, last = nodes[nodes.length - 1]!;
  const loss = first.volumeMl - last.volumeMl;
  const issue = !(loss > 0) ? "nonpositive-ejection-volume-loss" : nodes.some((node, index) => index > 0
    && node.volumeMl - nodes[index - 1]!.volumeMl > toleranceV1(node.volumeMl, nodes[index - 1]!.volumeMl))
    ? "nonmonotone-ejection-volume-no-single-valued-roof" : null;
  if (issue !== null) return Object.freeze({ status: "unavailable" as const, issue, full: null, central: null, late: null });
  const points = nodes.map((node) => ({ x: (first.volumeMl - node.volumeMl) / loss, p: node[pressure] }));
  const interpolate = (x: number) => {
    if (x === 0) return first[pressure];
    if (x === 1) return last[pressure];
    const exact = points.find((point) => point.x === x);
    if (exact !== undefined) return exact.p;
    const upper = points.findIndex((point) => point.x > x);
    const a = points[upper - 1]!, b = points[upper]!;
    return a.p + (b.p - a.p) * (x - a.x) / (b.x - a.x);
  };
  const chord = (from: number, to: number) => {
    const startPressureMmHg = interpolate(from), endPressureMmHg = interpolate(to);
    const residual = (x: number, p: number) => p - (startPressureMmHg
      + (endPressureMmHg - startPressureMmHg) * (x - from) / (to - from));
    const residuals = [{ x: from, y: 0 }, ...points.filter(({ x }) => x >= from && x <= to)
      .map(({ x, p }) => ({ x, y: residual(x, p) })), { x: to, y: 0 }];
    const integral = residuals.slice(1).reduce((sum, point, index) => {
      const previous = residuals[index]!;
      return sum + (point.y + previous.y) / 2 * (point.x - previous.x);
    }, 0);
    const midpoint = (from + to) / 2;
    return Object.freeze({ fromExpelledVolumeFraction01: from, toExpelledVolumeFraction01: to,
      startPressureMmHg, endPressureMmHg,
      minimumResidualMmHg: Math.min(...residuals.map(({ y }) => y)),
      maximumResidualMmHg: Math.max(...residuals.map(({ y }) => y)),
      meanResidualMmHg: integral / (to - from), midpointResidualMmHg: residual(midpoint, interpolate(midpoint)) });
  };
  return Object.freeze({ status: "available" as const, issue: null,
    full: chord(0, 1), central: chord(0.1, 0.9), late: chord(0.6, 0.85) });
}

function pointV1(sample: MainWireEjectionCouplingTraceSampleV1): PointV1 {
  return { timeSec: sample.acceptedTimeSec, volumeMl: sample.chamberVolumeMl.LV,
    lvAbsoluteMmHg: sample.absolutePressureMmHg.LV, lvTransmuralMmHg: sample.transmuralPressureMmHg.LV,
    aoAbsoluteMmHg: sample.absolutePressureMmHg.Ao };
}
function interpolatePointV1(a: PointV1, b: PointV1, fraction: number): PointV1 {
  return Object.fromEntries(Object.entries(a).map(([key, value]) => [key,
    value + fraction * (b[key as keyof PointV1] - value)])) as PointV1;
}
function validateV1(samples: readonly MainWireEjectionCouplingTraceSampleV1[], beat: MainWireEjectionCouplingBeatV1) {
  if (samples.length < 3 || samples.some((sample, index) => !Object.values(pointV1(sample)).every(Number.isFinite)
    || !Number.isFinite(sample.valveFlowMlPerSec.AoV) || !Number.isFinite(sample.acceptedDtSec) || !(sample.acceptedDtSec > 0)
    || (index > 0 && (!(sample.acceptedTimeSec > samples[index - 1]!.acceptedTimeSec)
      || !nearV1(sample.acceptedTimeSec - samples[index - 1]!.acceptedTimeSec, sample.acceptedDtSec))))) {
    unavailableV1("invalid-trace", "finite channels and contiguous increasing accepted timestamps/dt are required");
  }
  const events = beat.leftVentricularValveEventMetrics, ed = events.endDiastolic, es = events.endSystolic;
  const ao = beat.pressureSummaries.Ao;
  if (![beat.startTimeSec, beat.endTimeSec, beat.durationSec, ao.minimumMmHg, ao.maximumMmHg, ao.pulseMmHg].every(Number.isFinite)
    || !(beat.durationSec > 0) || !nearV1(beat.endTimeSec - beat.startTimeSec, beat.durationSec)
    || ao.maximumMmHg < ao.minimumMmHg || !nearV1(ao.maximumMmHg - ao.minimumMmHg, ao.pulseMmHg)
    || events.inletValveId !== "MV" || events.semilunarValveId !== "AoV" || ed === null || es === null
    || ed.valveId !== "MV" || es.valveId !== "AoV" || ed.event !== "valve-closure-zero-flow-crossing"
    || es.event !== "valve-closure-zero-flow-crossing"
    || !(beat.startTimeSec <= ed.timeSec && ed.timeSec < es.timeSec && es.timeSec < beat.endTimeSec)) {
    unavailableV1("invalid-completed-beat", "finite beat clock, central Ao summary and ordered exact MV/AoV closures are required");
  }
}
function toleranceV1(...values: number[]) { return 128 * Number.EPSILON * Math.max(1, ...values.map(Math.abs)); }
function nearV1(a: number, b: number) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= toleranceV1(a, b); }
function unavailableV1(code: MainWireEjectionCouplingUnavailableErrorV1["code"], message: string): never {
  throw new MainWireEjectionCouplingUnavailableErrorV1(code, message);
}
