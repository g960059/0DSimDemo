import type { SimSample } from "@/engine/protocol";
import {
  lastCompleteBeat,
  localExtrema,
  phaseInWindow,
  phaseOf,
  positiveValvePeaksDetailed,
  type Peak,
} from "@/engine/verification/shapeMetrics";

export type VentricularContractSide = "LV" | "RV";
export type AvInflowContractValve = "MV" | "TV";

export type VentricularSourcePressureContract = {
  readonly side: VentricularContractSide;
  readonly measured: boolean;
  readonly reason: string | null;
  readonly ejectionSampleCount: number;
  readonly totalPressurePeakCount: number | null;
  readonly totalPressureTroughCount: number | null;
  readonly activePressurePeakCount: number | null;
  readonly activePressureTroughCount: number | null;
  readonly sourceStressPeakCount: number | null;
  readonly sourceStressTroughCount: number | null;
  readonly lambdaPeakCount: number | null;
  readonly lambdaTroughCount: number | null;
  readonly lambdaRateSignChanges: number | null;
  readonly pressureAdapterGainRangeRatio: number | null;
  readonly activePressureWorkMmHgMl: number | null;
  readonly sourceStressLambdaWorkProxyPa: number | null;
  readonly likelyFailureClass:
    | "not-measured"
    | "clean-single-dome"
    | "source-state-multipeak"
    | "pressure-adapter-geometry-amplification"
    | "valve-load-or-passive-coupling"
    | "mixed-contract-failure";
  readonly message: string;
};

export type AvInflowSourcePressureContract = {
  readonly valve: AvInflowContractValve;
  readonly measured: boolean;
  readonly reason: string | null;
  readonly diastolicPeakCount: number | null;
  readonly extraPeakCount: number | null;
  readonly ePeakTheta: number | null;
  readonly aPeakTheta: number | null;
  readonly extraPeakTheta: number | null;
  readonly extraPeakProminenceRatio: number | null;
  readonly gradientPeakCount: number | null;
  readonly gradientTroughCount: number | null;
  readonly diodeImpulseHitFraction: number | null;
  readonly qDotClampHitFraction: number | null;
  readonly likelyFailureClass:
    | "not-measured"
    | "clean-biphasic"
    | "inlet-gradient-multipeak"
    | "valve-diode-or-qdot-contamination"
    | "extra-wave-without-clamp-dominance";
  readonly message: string;
};

export type ActiveSourcePressureContractSummary = {
  readonly version: "active-source-pressure-contract-v1";
  readonly checkedBeatSampleCount: number;
  readonly ventricles: Readonly<Record<VentricularContractSide, VentricularSourcePressureContract>>;
  readonly avInflows: Readonly<Record<AvInflowContractValve, AvInflowSourcePressureContract>>;
  readonly dominantFailureClasses: readonly string[];
};

type NumericSampleKey = {
  [K in keyof SimSample]: SimSample[K] extends number | undefined ? K : never;
}[keyof SimSample];

export function activeSourcePressureContractFromSamples(
  samples: readonly SimSample[],
): ActiveSourcePressureContractSummary {
  const beat = lastCompleteBeat([...samples]);
  const ventricles = {
    LV: ventricularContract(beat, "LV"),
    RV: ventricularContract(beat, "RV"),
  } as const;
  const avInflows = {
    MV: avInflowContract(beat, "MV"),
    TV: avInflowContract(beat, "TV"),
  } as const;
  const dominantFailureClasses = [
    ventricles.LV.likelyFailureClass,
    ventricles.RV.likelyFailureClass,
    avInflows.MV.likelyFailureClass,
    avInflows.TV.likelyFailureClass,
  ].filter((entry) =>
    entry !== "clean-single-dome"
    && entry !== "clean-biphasic"
    && entry !== "not-measured"
  );
  return {
    version: "active-source-pressure-contract-v1",
    checkedBeatSampleCount: beat.length,
    ventricles,
    avInflows,
    dominantFailureClasses,
  };
}

function ventricularContract(
  samples: readonly SimSample[],
  side: VentricularContractSide,
): VentricularSourcePressureContract {
  if (samples.length === 0) return unmeasuredVentricle(side, "no complete beat");
  const pressureKey = side === "LV" ? "LVP" : "RVP";
  const flowKey = side === "LV" ? "QAo" : "QPV";
  const volumeKey = side === "LV" ? "VLV" : "VRV";
  const activePressureKey = side === "LV" ? "LVActivePressureMmHg" : "RVActivePressureMmHg";
  const sourceStressKey = side === "LV" ? "LVActiveFiberStressPa" : "RVActiveFiberStressPa";
  const lambdaKey = side === "LV" ? "LVFiberLambda" : "RVFiberLambda";
  const flowMax = Math.max(0, ...samples.map((sample) => sample[flowKey]));
  const ejectionThreshold = Math.max(10, 0.08 * flowMax);
  const ejection = samples.filter((sample) => sample[flowKey] > ejectionThreshold);
  if (ejection.length < 8) return unmeasuredVentricle(side, "too few ejection samples", ejection.length);

  const totalPressureSpan = valueRange(ejection, pressureKey);
  const totalPressureProminence = Math.max(side === "LV" ? 4 : 1.2, 0.10 * totalPressureSpan);
  const totalPressurePeakCount = localExtrema([...ejection], pressureKey, "max", totalPressureProminence).length;
  const totalPressureTroughCount = localExtrema([...ejection], pressureKey, "min", totalPressureProminence).length;

  const activePressure = finiteSamples(ejection, activePressureKey);
  const sourceStress = finiteSamples(ejection, sourceStressKey);
  const lambda = finiteSamples(ejection, lambdaKey);
  const activePressureSpan = activePressure.length > 0 ? valueRange(activePressure, activePressureKey) : 0;
  const sourceStressSpan = sourceStress.length > 0 ? valueRange(sourceStress, sourceStressKey) : 0;
  const lambdaSpan = lambda.length > 0 ? valueRange(lambda, lambdaKey) : 0;
  const activePressureProminence = Math.max(side === "LV" ? 2 : 0.7, 0.10 * activePressureSpan);
  const sourceStressProminence = Math.max(1500, 0.10 * sourceStressSpan);
  const lambdaProminence = Math.max(0.002, 0.10 * lambdaSpan);

  const activePressurePeakCount = activePressure.length >= 8
    ? localExtrema([...activePressure], activePressureKey, "max", activePressureProminence).length
    : null;
  const activePressureTroughCount = activePressure.length >= 8
    ? localExtrema([...activePressure], activePressureKey, "min", activePressureProminence).length
    : null;
  const sourceStressPeakCount = sourceStress.length >= 8
    ? localExtrema([...sourceStress], sourceStressKey, "max", sourceStressProminence).length
    : null;
  const sourceStressTroughCount = sourceStress.length >= 8
    ? localExtrema([...sourceStress], sourceStressKey, "min", sourceStressProminence).length
    : null;
  const lambdaPeakCount = lambda.length >= 8
    ? localExtrema([...lambda], lambdaKey, "max", lambdaProminence).length
    : null;
  const lambdaTroughCount = lambda.length >= 8
    ? localExtrema([...lambda], lambdaKey, "min", lambdaProminence).length
    : null;
  const lambdaRateSignChanges = lambda.length >= 8 ? derivativeSignChanges(lambda, lambdaKey) : null;
  const pressureAdapterGainRangeRatio = pressureAdapterGainRatio(ejection, activePressureKey, sourceStressKey);
  const activePressureWorkMmHgMl = integrateAgainstVolume(ejection, activePressureKey, volumeKey);
  const sourceStressLambdaWorkProxyPa = integrateAgainstSignal(ejection, sourceStressKey, lambdaKey);
  const likelyFailureClass = classifyVentricularContract({
    totalPressurePeakCount,
    totalPressureTroughCount,
    activePressurePeakCount,
    activePressureTroughCount,
    sourceStressPeakCount,
    sourceStressTroughCount,
    pressureAdapterGainRangeRatio,
  });
  return {
    side,
    measured: true,
    reason: null,
    ejectionSampleCount: ejection.length,
    totalPressurePeakCount,
    totalPressureTroughCount,
    activePressurePeakCount,
    activePressureTroughCount,
    sourceStressPeakCount,
    sourceStressTroughCount,
    lambdaPeakCount,
    lambdaTroughCount,
    lambdaRateSignChanges,
    pressureAdapterGainRangeRatio,
    activePressureWorkMmHgMl: round(activePressureWorkMmHgMl),
    sourceStressLambdaWorkProxyPa: round(sourceStressLambdaWorkProxyPa),
    likelyFailureClass,
    message: ventricularMessage(side, likelyFailureClass),
  };
}

function avInflowContract(
  samples: readonly SimSample[],
  valve: AvInflowContractValve,
): AvInflowSourcePressureContract {
  if (samples.length === 0) return unmeasuredAvInflow(valve, "no complete beat");
  const flowKey = valve === "MV" ? "QMV" : "QTV";
  const gradientKey = valve === "MV" ? "dP_MV" : "dP_TV";
  const diodeKey = valve === "MV" ? "MV_diodeImpulse" : "TV_diodeImpulse";
  const qDotClampKey = valve === "MV" ? "MV_qDotClampHit01" : "TV_qDotClampHit01";
  const peaks = positiveValvePeaksDetailed([...samples], flowKey, 0.12, 20);
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75));
  const aPeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08));
  const ePeak = maxPeak(ePeaks);
  const aPeak = maxPeak(aPeaks);
  const extraPeaks = diastolic
    .filter((peak) => peak !== ePeak && peak !== aPeak)
    .sort((a, b) => b.value - a.value);
  const extraPeak = extraPeaks[0] ?? null;
  const extraPeakProminenceRatio = extraPeak && ePeak && ePeak.value > 1e-9
    ? extraPeak.value / ePeak.value
    : null;
  const gradientSpan = valueRange(samples, gradientKey);
  const gradientProminence = Math.max(valve === "MV" ? 0.5 : 0.35, 0.12 * gradientSpan);
  const gradientPeakCount = localExtrema([...samples], gradientKey, "max", gradientProminence).length;
  const gradientTroughCount = localExtrema([...samples], gradientKey, "min", gradientProminence).length;
  const diodeImpulseHitFraction = fraction(samples, (sample) => Math.abs(Number(sample[diodeKey] ?? 0)) > 1e-9);
  const qDotClampHitFraction = fraction(samples, (sample) => Number(sample[qDotClampKey] ?? 0) > 0.5);
  const likelyFailureClass = classifyAvInflow({
    ePeak,
    aPeak,
    extraPeakCount: Math.max(0, diastolic.length - 2),
    gradientPeakCount,
    gradientTroughCount,
    diodeImpulseHitFraction,
    qDotClampHitFraction,
  });
  return {
    valve,
    measured: true,
    reason: null,
    diastolicPeakCount: diastolic.length,
    extraPeakCount: Math.max(0, diastolic.length - 2),
    ePeakTheta: ePeak?.theta == null ? null : round(ePeak.theta),
    aPeakTheta: aPeak?.theta == null ? null : round(aPeak.theta),
    extraPeakTheta: extraPeak?.theta == null ? null : round(extraPeak.theta),
    extraPeakProminenceRatio: extraPeakProminenceRatio == null ? null : round(extraPeakProminenceRatio),
    gradientPeakCount,
    gradientTroughCount,
    diodeImpulseHitFraction: round(diodeImpulseHitFraction),
    qDotClampHitFraction: round(qDotClampHitFraction),
    likelyFailureClass,
    message: avInflowMessage(valve, likelyFailureClass),
  };
}

function classifyVentricularContract(input: {
  readonly totalPressurePeakCount: number;
  readonly totalPressureTroughCount: number;
  readonly activePressurePeakCount: number | null;
  readonly activePressureTroughCount: number | null;
  readonly sourceStressPeakCount: number | null;
  readonly sourceStressTroughCount: number | null;
  readonly pressureAdapterGainRangeRatio: number | null;
}): VentricularSourcePressureContract["likelyFailureClass"] {
  if (input.totalPressurePeakCount <= 1 && input.totalPressureTroughCount === 0) {
    return "clean-single-dome";
  }
  const sourceMultipeak =
    (input.sourceStressPeakCount ?? 0) > 1 || (input.sourceStressTroughCount ?? 0) > 0;
  const activeMultipeak =
    (input.activePressurePeakCount ?? 0) > 1 || (input.activePressureTroughCount ?? 0) > 0;
  if (sourceMultipeak && activeMultipeak) return "source-state-multipeak";
  if (!sourceMultipeak && activeMultipeak) return "pressure-adapter-geometry-amplification";
  if (!activeMultipeak && (input.pressureAdapterGainRangeRatio ?? 0) > 1.8) {
    return "pressure-adapter-geometry-amplification";
  }
  if (!activeMultipeak) return "valve-load-or-passive-coupling";
  return "mixed-contract-failure";
}

function classifyAvInflow(input: {
  readonly ePeak: Peak | null;
  readonly aPeak: Peak | null;
  readonly extraPeakCount: number;
  readonly gradientPeakCount: number;
  readonly gradientTroughCount: number;
  readonly diodeImpulseHitFraction: number;
  readonly qDotClampHitFraction: number;
}): AvInflowSourcePressureContract["likelyFailureClass"] {
  if (input.ePeak && input.aPeak && input.extraPeakCount === 0) return "clean-biphasic";
  if (input.diodeImpulseHitFraction > 0.12 || input.qDotClampHitFraction > 0.05) {
    return "valve-diode-or-qdot-contamination";
  }
  if (input.gradientPeakCount > 2 || input.gradientTroughCount > 2) return "inlet-gradient-multipeak";
  return "extra-wave-without-clamp-dominance";
}

function ventricularMessage(
  side: VentricularContractSide,
  failureClass: VentricularSourcePressureContract["likelyFailureClass"],
): string {
  if (failureClass === "clean-single-dome") return `${side} systolic dome is contract-clean.`;
  if (failureClass === "source-state-multipeak") {
    return `${side} source stress is already multi-peaked during ejection; the source-state contract itself is implicated.`;
  }
  if (failureClass === "pressure-adapter-geometry-amplification") {
    return `${side} source stress is not sufficient to explain the dome; chamber pressure adapter or geometry gain is implicated.`;
  }
  if (failureClass === "valve-load-or-passive-coupling") {
    return `${side} active pressure is cleaner than total pressure; valve/load/passive coupling is implicated.`;
  }
  if (failureClass === "mixed-contract-failure") return `${side} has mixed source and adapter/valve contract failures.`;
  return `${side} contract was not measured.`;
}

function avInflowMessage(
  valve: AvInflowContractValve,
  failureClass: AvInflowSourcePressureContract["likelyFailureClass"],
): string {
  if (failureClass === "clean-biphasic") return `${valve} inflow is contract-clean biphasic.`;
  if (failureClass === "valve-diode-or-qdot-contamination") {
    return `${valve} inflow artifact overlaps valve diode or qDot events.`;
  }
  if (failureClass === "inlet-gradient-multipeak") {
    return `${valve} inflow artifact follows a multi-peaked atrioventricular pressure gradient.`;
  }
  if (failureClass === "extra-wave-without-clamp-dominance") {
    return `${valve} inflow has extra waves without dominant clamp/diode evidence; chamber pressure/load timing is implicated.`;
  }
  return `${valve} inflow contract was not measured.`;
}

function unmeasuredVentricle(
  side: VentricularContractSide,
  reason: string,
  ejectionSampleCount = 0,
): VentricularSourcePressureContract {
  return {
    side,
    measured: false,
    reason,
    ejectionSampleCount,
    totalPressurePeakCount: null,
    totalPressureTroughCount: null,
    activePressurePeakCount: null,
    activePressureTroughCount: null,
    sourceStressPeakCount: null,
    sourceStressTroughCount: null,
    lambdaPeakCount: null,
    lambdaTroughCount: null,
    lambdaRateSignChanges: null,
    pressureAdapterGainRangeRatio: null,
    activePressureWorkMmHgMl: null,
    sourceStressLambdaWorkProxyPa: null,
    likelyFailureClass: "not-measured",
    message: `${side} contract not measured: ${reason}.`,
  };
}

function unmeasuredAvInflow(
  valve: AvInflowContractValve,
  reason: string,
): AvInflowSourcePressureContract {
  return {
    valve,
    measured: false,
    reason,
    diastolicPeakCount: null,
    extraPeakCount: null,
    ePeakTheta: null,
    aPeakTheta: null,
    extraPeakTheta: null,
    extraPeakProminenceRatio: null,
    gradientPeakCount: null,
    gradientTroughCount: null,
    diodeImpulseHitFraction: null,
    qDotClampHitFraction: null,
    likelyFailureClass: "not-measured",
    message: `${valve} inflow contract not measured: ${reason}.`,
  };
}

function finiteSamples<K extends NumericSampleKey>(
  samples: readonly SimSample[],
  key: K,
): SimSample[] {
  return samples.filter((sample) => Number.isFinite(Number(sample[key])));
}

function valueRange<K extends NumericSampleKey>(samples: readonly SimSample[], key: K): number {
  const values = samples.map((sample) => Number(sample[key])).filter(Number.isFinite);
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

function pressureAdapterGainRatio(
  samples: readonly SimSample[],
  activePressureKey: NumericSampleKey,
  sourceStressKey: NumericSampleKey,
): number | null {
  const gains = samples
    .map((sample) => {
      const stress = Math.abs(Number(sample[sourceStressKey]));
      const pressure = Math.abs(Number(sample[activePressureKey]));
      return stress > 1e-6 && Number.isFinite(pressure) ? pressure / stress : null;
    })
    .filter((value): value is number => value != null && Number.isFinite(value));
  if (gains.length < 4) return null;
  const min = Math.min(...gains);
  const max = Math.max(...gains);
  return min > 1e-12 ? round(max / min) : null;
}

function integrateAgainstVolume<K extends NumericSampleKey>(
  samples: readonly SimSample[],
  key: K,
  volumeKey: "VLV" | "VRV",
): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dV = samples[i][volumeKey] - samples[i - 1][volumeKey];
    const a = Number(samples[i - 1][key]);
    const b = Number(samples[i][key]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    area += 0.5 * (a + b) * dV;
  }
  return area;
}

function integrateAgainstSignal<K extends NumericSampleKey, S extends NumericSampleKey>(
  samples: readonly SimSample[],
  key: K,
  signalKey: S,
): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const dSignal = Number(samples[i][signalKey]) - Number(samples[i - 1][signalKey]);
    const a = Number(samples[i - 1][key]);
    const b = Number(samples[i][key]);
    if (!Number.isFinite(dSignal) || !Number.isFinite(a) || !Number.isFinite(b)) continue;
    area += 0.5 * (a + b) * dSignal;
  }
  return area;
}

function derivativeSignChanges<K extends NumericSampleKey>(
  samples: readonly SimSample[],
  key: K,
): number {
  let previousSign = 0;
  let changes = 0;
  for (let i = 1; i < samples.length; i++) {
    const delta = Number(samples[i][key]) - Number(samples[i - 1][key]);
    const sign = Math.abs(delta) < 1e-9 ? 0 : Math.sign(delta);
    if (sign !== 0 && previousSign !== 0 && sign !== previousSign) changes++;
    if (sign !== 0) previousSign = sign;
  }
  return changes;
}

function maxPeak(peaks: readonly Peak[]): Peak | null {
  if (peaks.length === 0) return null;
  return peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]);
}

function fraction(samples: readonly SimSample[], predicate: (sample: SimSample) => boolean): number {
  if (samples.length === 0) return 0;
  return samples.filter(predicate).length / samples.length;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}
