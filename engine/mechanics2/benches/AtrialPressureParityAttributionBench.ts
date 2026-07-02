import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberOutputV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  runAtrialFiberPackClosedLoopReplayBenchV1,
} from "@/engine/mechanics2/benches/AtrialFiberPackClosedLoopReplayBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_PRESSURE_PARITY_ATTRIBUTION_REPORT_ID_V1 =
  "atrial-pressure-parity-attribution-report-v1" as const;

type AtrialPressureParityAttributionClassV1 =
  | "baseline-offset-dominant"
  | "wall-pulse-scale-mismatch"
  | "wall-pressure-decoupled-from-current-waveform"
  | "current-v-wave-reservoir-component"
  | "late-a-wave-phase-aligned"
  | "decomposed-pressure-contract-needed";

type AtrialPressureParityAttributionRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly focusReason: "closed-loop-replay-pressure-parity-wide";
  readonly finalBeat: number;
  readonly rawMeanAbsDeltaMmHg: number;
  readonly rawRmsDeltaMmHg: number;
  readonly bestConstantOffsetMmHg: number;
  readonly offsetCorrectedMeanAbsDeltaMmHg: number;
  readonly offsetCorrectedRmsDeltaMmHg: number;
  readonly offsetImprovementFraction: number;
  readonly affineSlope: number;
  readonly affineInterceptMmHg: number;
  readonly affineMeanAbsDeltaMmHg: number;
  readonly affineRmsDeltaMmHg: number;
  readonly affineImprovementFraction: number;
  readonly fiberPressureMinMmHg: number;
  readonly fiberPressurePeakMmHg: number;
  readonly fiberPressurePulseMmHg: number;
  readonly currentPressureMinMmHg: number;
  readonly currentPressurePeakMmHg: number;
  readonly currentLatePressurePeakMmHg: number;
  readonly currentPressurePulseMmHg: number;
  readonly currentToFiberPulseRatio: number;
  readonly activePeakTheta: number;
  readonly currentPeakTheta: number;
  readonly currentLatePeakTheta: number;
  readonly activeToCurrentLatePeakDeltaTheta: number;
  readonly currentVWaveDominanceMmHg: number;
  readonly classifications: readonly AtrialPressureParityAttributionClassV1[];
};

export type AtrialPressureParityAttributionReportV1 = {
  readonly reportId: typeof ATRIAL_PRESSURE_PARITY_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "atrialPressureParityAttributionV1";
  readonly upstreamClosedLoopReplay: {
    readonly requiredStatus: "atrial-fiber-closed-loop-replay-signal";
    readonly observedStatus: ReturnType<
      typeof runAtrialFiberPackClosedLoopReplayBenchV1
    >["decision"]["atrialFiberClosedLoopReplayStatus"];
    readonly pressureParityCount: number;
    readonly residualRows: readonly string[];
  };
  readonly attributionMode: "LA-closed-loop-pressure-parity-no-substitution";
  readonly rows: readonly AtrialPressureParityAttributionRowV1[];
  readonly summary: {
    readonly focusedResidualCount: number;
    readonly classifiedCount: number;
    readonly baselineOffsetDominantCount: number;
    readonly pulseScaleMismatchCount: number;
    readonly wallPressureDecoupledCount: number;
    readonly vWaveReservoirComponentCount: number;
    readonly lateAWaveAlignedCount: number;
  };
  readonly decision: {
    readonly atrialPressureParityStatus:
      | "la-pressure-parity-attribution-signal"
      | "la-pressure-parity-attribution-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly pressureSubstitution: false;
    readonly AVPlaneGeometry: false;
    readonly pistonVolumeMode: false;
    readonly morphologyAcceptance: false;
    readonly runtimeWiring: false;
    readonly LandAtrialUnlock: false;
  };
};

type ReplaySeriesV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly finalBeat: number;
  readonly fiberPressureMmHg: readonly number[];
  readonly activePressureMmHg: readonly number[];
  readonly currentPressureMmHg: readonly number[];
  readonly theta: readonly number[];
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

const FOCUS_PROFILES = new Set<FourChamberSubsystemProfileIdV1>([
  "preload-high",
  "afterload-high",
  "contractility-low",
]);

export function runAtrialPressureParityAttributionBenchV1(): AtrialPressureParityAttributionReportV1 {
  const upstream = runAtrialFiberPackClosedLoopReplayBenchV1();
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rows = PROFILE_IDS
    .map((profileId, index) => replayLeftProfile(profileId, leftParams[index]!))
    .filter((series) => FOCUS_PROFILES.has(series.profileId))
    .map(rowForSeries);
  const residualRows = upstream.resultRows
    .filter((row) => row.chamberId === "LA" && row.advisoryResidualReasons.includes("fiber-current-pressure-parity-wide"))
    .map((row) => `${row.chamberId}:${row.profileId}`);
  const classifiedCount = rows.filter((row) =>
    row.classifications.includes("decomposed-pressure-contract-needed")
  ).length;
  const hasSignal =
    upstream.decision.atrialFiberClosedLoopReplayStatus === "atrial-fiber-closed-loop-replay-signal"
    && rows.length === 3
    && classifiedCount === rows.length;
  return {
    reportId: ATRIAL_PRESSURE_PARITY_ATTRIBUTION_REPORT_ID_V1,
    gateId: "atrialPressureParityAttributionV1",
    upstreamClosedLoopReplay: {
      requiredStatus: "atrial-fiber-closed-loop-replay-signal",
      observedStatus: upstream.decision.atrialFiberClosedLoopReplayStatus,
      pressureParityCount: upstream.summary.pressureParityCount,
      residualRows,
    },
    attributionMode: "LA-closed-loop-pressure-parity-no-substitution",
    rows,
    summary: {
      focusedResidualCount: rows.length,
      classifiedCount,
      baselineOffsetDominantCount: countClass(rows, "baseline-offset-dominant"),
      pulseScaleMismatchCount: countClass(rows, "wall-pulse-scale-mismatch"),
      wallPressureDecoupledCount: countClass(rows, "wall-pressure-decoupled-from-current-waveform"),
      vWaveReservoirComponentCount: countClass(rows, "current-v-wave-reservoir-component"),
      lateAWaveAlignedCount: countClass(rows, "late-a-wave-phase-aligned"),
    },
    decision: {
      atrialPressureParityStatus: hasSignal
        ? "la-pressure-parity-attribution-signal"
        : "la-pressure-parity-attribution-blocked",
      nextAction: hasSignal
        ? "Do not substitute raw atrial fiber pressure. Test an explicit decomposed LA pressure contract that separates filling-pressure offset/reservoir-v-wave state from wall pulse scaling before any AV-plane geometry or pressure-substitution smoke."
        : "Keep atrial pressure substitution blocked and re-run the closed-loop replay attribution with complete LA residual rows.",
      blockedClaims: [
        "atrial-pressure-substitution",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "morphology-acceptance",
        "runtime-wiring",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      pressureSubstitution: false,
      AVPlaneGeometry: false,
      pistonVolumeMode: false,
      morphologyAcceptance: false,
      runtimeWiring: false,
      LandAtrialUnlock: false,
    },
  };
}

function replayLeftProfile(
  profileId: FourChamberSubsystemProfileIdV1,
  params: Parameters<typeof runLeftHeartSubsystemV2>[0],
): ReplaySeriesV1 {
  const run = runLeftHeartSubsystemV2(params);
  const atrialParams = DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA;
  let state = initialAtrialFiberChamberStateV1(run.samples[0]?.acceptedLaVolumeMl ?? atrialParams.referenceCavityVolumeMl, atrialParams);
  const outputs: AtrialFiberChamberOutputV1[] = [];
  const cycleLengthSec = 60 / params.heartRateBpm;
  for (let i = 0; i < run.samples.length; i++) {
    const sample = run.samples[i]!;
    const previous = run.samples[Math.max(0, i - 1)] ?? sample;
    const output = stepAtrialFiberChamberV1(state, {
      tSec: sample.tSec,
      dtSec: 1 / params.sampleRateHz,
      cycleLengthSec,
      activationTimeSec: sample.beat * cycleLengthSec
        + positiveModulo(params.laAWaveStartTheta - 0.10, 1) * cycleLengthSec,
      cavityVolumeMl: sample.acceptedLaVolumeMl,
      previousCavityVolumeMl: previous.acceptedLaVolumeMl,
    }, atrialParams);
    outputs.push(output);
    state = output.state;
  }
  const finalSamples = run.samples.filter((sample) => sample.beat === params.beats - 2);
  const finalOutputs = outputs.filter((_, index) => run.samples[index]?.beat === params.beats - 2);
  return {
    profileId,
    sourcePointId: params.fixtureId,
    finalBeat: params.beats - 2,
    fiberPressureMmHg: finalOutputs.map((output) => output.pressureRawMmHg),
    activePressureMmHg: finalOutputs.map((output) => output.activePressureMmHg),
    currentPressureMmHg: finalSamples.map((sample: LeftHeartSubsystemSampleV2) => sample.lapMmHg),
    theta: finalSamples.map((sample) => sample.theta),
  };
}

function rowForSeries(series: ReplaySeriesV1): AtrialPressureParityAttributionRowV1 {
  const rawMeanAbsDeltaMmHg = meanAbsDelta(series.fiberPressureMmHg, series.currentPressureMmHg);
  const rawRmsDeltaMmHg = rmsDelta(series.fiberPressureMmHg, series.currentPressureMmHg);
  const bestConstantOffsetMmHg = meanDelta(series.currentPressureMmHg, series.fiberPressureMmHg);
  const offsetPressure = series.fiberPressureMmHg.map((value) => value + bestConstantOffsetMmHg);
  const offsetCorrectedMeanAbsDeltaMmHg = meanAbsDelta(offsetPressure, series.currentPressureMmHg);
  const offsetCorrectedRmsDeltaMmHg = rmsDelta(offsetPressure, series.currentPressureMmHg);
  const affine = fitAffine(series.fiberPressureMmHg, series.currentPressureMmHg);
  const affinePressure = series.fiberPressureMmHg.map((value) => affine.slope * value + affine.intercept);
  const affineMeanAbsDeltaMmHg = meanAbsDelta(affinePressure, series.currentPressureMmHg);
  const affineRmsDeltaMmHg = rmsDelta(affinePressure, series.currentPressureMmHg);
  const activePeakIndex = maxIndex(series.activePressureMmHg);
  const currentPeakIndex = maxIndex(series.currentPressureMmHg);
  const currentLatePeakIndex = maxIndexByMask(
    series.currentPressureMmHg,
    series.theta.map((theta) => theta >= 0.74),
  );
  const fiberMin = Math.min(...series.fiberPressureMmHg);
  const fiberPeak = Math.max(...series.fiberPressureMmHg);
  const currentMin = Math.min(...series.currentPressureMmHg);
  const currentPeak = Math.max(...series.currentPressureMmHg);
  const currentLatePeak = series.currentPressureMmHg[currentLatePeakIndex] ?? currentPeak;
  const fiberPulse = fiberPeak - fiberMin;
  const currentPulse = currentPeak - currentMin;
  const currentVWaveDominanceMmHg =
    (series.theta[currentPeakIndex] ?? 1) < 0.74
      ? Math.max(0, currentPeak - currentLatePeak)
      : 0;
  const activeToCurrentLatePeakDeltaTheta = circularDelta(
    series.theta[activePeakIndex] ?? Number.NaN,
    series.theta[currentLatePeakIndex] ?? Number.NaN,
  );
  const classifications = classificationsFor({
    rawMeanAbsDeltaMmHg,
    bestConstantOffsetMmHg,
    offsetCorrectedMeanAbsDeltaMmHg,
    affineMeanAbsDeltaMmHg,
    affineSlope: affine.slope,
    fiberPulse,
    currentPulse,
    currentVWaveDominanceMmHg,
    activeToCurrentLatePeakDeltaTheta,
  });
  return {
    profileId: series.profileId,
    sourcePointId: series.sourcePointId,
    focusReason: "closed-loop-replay-pressure-parity-wide",
    finalBeat: series.finalBeat,
    rawMeanAbsDeltaMmHg: round(rawMeanAbsDeltaMmHg),
    rawRmsDeltaMmHg: round(rawRmsDeltaMmHg),
    bestConstantOffsetMmHg: round(bestConstantOffsetMmHg),
    offsetCorrectedMeanAbsDeltaMmHg: round(offsetCorrectedMeanAbsDeltaMmHg),
    offsetCorrectedRmsDeltaMmHg: round(offsetCorrectedRmsDeltaMmHg),
    offsetImprovementFraction: round(improvement(rawMeanAbsDeltaMmHg, offsetCorrectedMeanAbsDeltaMmHg)),
    affineSlope: round(affine.slope),
    affineInterceptMmHg: round(affine.intercept),
    affineMeanAbsDeltaMmHg: round(affineMeanAbsDeltaMmHg),
    affineRmsDeltaMmHg: round(affineRmsDeltaMmHg),
    affineImprovementFraction: round(improvement(rawMeanAbsDeltaMmHg, affineMeanAbsDeltaMmHg)),
    fiberPressureMinMmHg: round(fiberMin),
    fiberPressurePeakMmHg: round(fiberPeak),
    fiberPressurePulseMmHg: round(fiberPulse),
    currentPressureMinMmHg: round(currentMin),
    currentPressurePeakMmHg: round(currentPeak),
    currentLatePressurePeakMmHg: round(currentLatePeak),
    currentPressurePulseMmHg: round(currentPulse),
    currentToFiberPulseRatio: round(currentPulse / Math.max(fiberPulse, 1e-9)),
    activePeakTheta: round(series.theta[activePeakIndex] ?? Number.NaN),
    currentPeakTheta: round(series.theta[currentPeakIndex] ?? Number.NaN),
    currentLatePeakTheta: round(series.theta[currentLatePeakIndex] ?? Number.NaN),
    activeToCurrentLatePeakDeltaTheta: round(activeToCurrentLatePeakDeltaTheta),
    currentVWaveDominanceMmHg: round(currentVWaveDominanceMmHg),
    classifications,
  };
}

function classificationsFor(input: {
  readonly rawMeanAbsDeltaMmHg: number;
  readonly bestConstantOffsetMmHg: number;
  readonly offsetCorrectedMeanAbsDeltaMmHg: number;
  readonly affineMeanAbsDeltaMmHg: number;
  readonly affineSlope: number;
  readonly fiberPulse: number;
  readonly currentPulse: number;
  readonly currentVWaveDominanceMmHg: number;
  readonly activeToCurrentLatePeakDeltaTheta: number;
}): readonly AtrialPressureParityAttributionClassV1[] {
  const classes: AtrialPressureParityAttributionClassV1[] = [];
  const offsetImprovement = improvement(input.rawMeanAbsDeltaMmHg, input.offsetCorrectedMeanAbsDeltaMmHg);
  const affineImprovement = improvement(input.rawMeanAbsDeltaMmHg, input.affineMeanAbsDeltaMmHg);
  const pulseRatio = input.currentPulse / Math.max(input.fiberPulse, 1e-9);
  if (Math.abs(input.bestConstantOffsetMmHg) >= 5 && offsetImprovement >= 0.45) {
    classes.push("baseline-offset-dominant");
  }
  if (pulseRatio < 0.58 || pulseRatio > 1.72) {
    classes.push("wall-pulse-scale-mismatch");
  }
  if (input.affineMeanAbsDeltaMmHg <= 1.2 && input.affineSlope < 0.1) {
    classes.push("wall-pressure-decoupled-from-current-waveform");
  }
  if (input.currentVWaveDominanceMmHg >= 0.6) {
    classes.push("current-v-wave-reservoir-component");
  }
  if (input.activeToCurrentLatePeakDeltaTheta <= 0.08) {
    classes.push("late-a-wave-phase-aligned");
  }
  if (
    classes.includes("baseline-offset-dominant")
    && classes.includes("wall-pulse-scale-mismatch")
    && classes.includes("wall-pressure-decoupled-from-current-waveform")
    && affineImprovement >= 0.72
  ) {
    classes.push("decomposed-pressure-contract-needed");
  }
  return classes;
}

function countClass(
  rows: readonly AtrialPressureParityAttributionRowV1[],
  target: AtrialPressureParityAttributionClassV1,
): number {
  return rows.filter((row) => row.classifications.includes(target)).length;
}

function fitAffine(x: readonly number[], y: readonly number[]): { readonly slope: number; readonly intercept: number } {
  const count = Math.min(x.length, y.length);
  if (count === 0) return { slope: Number.NaN, intercept: Number.NaN };
  const meanX = mean(x.slice(0, count));
  const meanY = mean(y.slice(0, count));
  let covariance = 0;
  let variance = 0;
  for (let i = 0; i < count; i++) {
    covariance += (x[i]! - meanX) * (y[i]! - meanY);
    variance += (x[i]! - meanX) ** 2;
  }
  const slope = variance > 1e-12 ? covariance / variance : 0;
  return { slope, intercept: meanY - slope * meanX };
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function meanDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.NaN;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += a[i]! - b[i]!;
  return sum / count;
}

function meanAbsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += Math.abs(a[i]! - b[i]!);
  return sum / count;
}

function rmsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(sum / count);
}

function improvement(raw: number, corrected: number): number {
  if (!Number.isFinite(raw) || raw <= 1e-9) return 0;
  return Math.max(0, 1 - corrected / raw);
}

function circularDelta(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  const raw = Math.abs(a - b);
  return Math.min(raw, 1 - raw);
}

function maxIndex(values: readonly number[]): number {
  let bestIndex = 0;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    if (values[i]! > bestValue) {
      bestIndex = i;
      bestValue = values[i]!;
    }
  }
  return bestIndex;
}

function maxIndexByMask(values: readonly number[], mask: readonly boolean[]): number {
  let bestIndex = -1;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    if (!mask[i]) continue;
    if (values[i]! > bestValue) {
      bestIndex = i;
      bestValue = values[i]!;
    }
  }
  return bestIndex >= 0 ? bestIndex : maxIndex(values);
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
