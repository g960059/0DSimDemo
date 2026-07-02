import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberOutputV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  runAtrialPressureParityAttributionBenchV1,
} from "@/engine/mechanics2/benches/AtrialPressureParityAttributionBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const DECOMPOSED_LA_PRESSURE_CONTRACT_REPORT_ID_V1 =
  "decomposed-la-pressure-contract-report-v1" as const;

type DecomposedLaPressureContractRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly finalBeat: number;
  readonly currentPeakMmHg: number;
  readonly currentMinMmHg: number;
  readonly fillingBaselinePeakMmHg: number;
  readonly fillingBaselineMinMmHg: number;
  readonly fiberActivePeakMmHg: number;
  readonly empiricalAWaveTargetMmHg: number;
  readonly decomposedPeakMmHg: number;
  readonly decomposedMinMmHg: number;
  readonly decomposedLatePeakMmHg: number;
  readonly rawFiberMeanAbsDeltaMmHg: number;
  readonly decomposedMeanAbsDeltaMmHg: number;
  readonly decomposedRmsDeltaMmHg: number;
  readonly decomposedImprovementFraction: number;
  readonly activePeakTheta: number;
  readonly currentLatePeakTheta: number;
  readonly decomposedPeakTheta: number;
  readonly decomposedLatePeakTheta: number;
  readonly activeToCurrentLateDeltaTheta: number;
  readonly decomposedToCurrentLateDeltaTheta: number;
  readonly decomposedLateToCurrentLateDeltaTheta: number;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type DecomposedLaPressureContractReportV1 = {
  readonly reportId: typeof DECOMPOSED_LA_PRESSURE_CONTRACT_REPORT_ID_V1;
  readonly gateId: "decomposedLaPressureContractV1";
  readonly upstreamAttribution: {
    readonly requiredStatus: "la-pressure-parity-attribution-signal";
    readonly observedStatus: ReturnType<
      typeof runAtrialPressureParityAttributionBenchV1
    >["decision"]["atrialPressureParityStatus"];
    readonly focusedResidualCount: number;
  };
  readonly contractMode: "shadow-filling-baseline-plus-normalized-fiber-active-pulse";
  readonly rows: readonly DecomposedLaPressureContractRowV1[];
  readonly summary: {
    readonly total: 7;
    readonly pass: number;
    readonly fail: number;
    readonly focusedResidualPass: number;
    readonly meanRawFiberDeltaMmHg: number;
    readonly meanDecomposedDeltaMmHg: number;
    readonly meanImprovementFraction: number;
  };
  readonly decision: {
    readonly decomposedLaPressureContractStatus:
      | "decomposed-la-pressure-contract-focused-shadow-signal"
      | "decomposed-la-pressure-contract-shadow-signal"
      | "decomposed-la-pressure-contract-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly sourceSurfaceSubstitution: false;
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly pistonVolumeMode: false;
    readonly LandAtrialUnlock: false;
  };
};

type ReplaySeriesV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly finalBeat: number;
  readonly empiricalAWaveTargetMmHg: number;
  readonly theta: readonly number[];
  readonly currentPressureMmHg: readonly number[];
  readonly fillingBaselineMmHg: readonly number[];
  readonly rawFiberPressureMmHg: readonly number[];
  readonly activePressureMmHg: readonly number[];
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

const FOCUSED_RESIDUALS = new Set<FourChamberSubsystemProfileIdV1>([
  "preload-high",
  "afterload-high",
  "contractility-low",
]);

export function runDecomposedLaPressureContractBenchV1(): DecomposedLaPressureContractReportV1 {
  const upstream = runAtrialPressureParityAttributionBenchV1();
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rows = PROFILE_IDS.map((profileId, index) =>
    rowForSeries(replayLeftProfile(profileId, leftParams[index]!))
  );
  const pass = rows.filter((row) => row.status === "pass").length;
  const focusedResidualPass = rows.filter((row) =>
    FOCUSED_RESIDUALS.has(row.profileId) && row.status === "pass"
  ).length;
  const upstreamOk =
    upstream.decision.atrialPressureParityStatus === "la-pressure-parity-attribution-signal";
  const fullSignal = upstreamOk && pass === rows.length && focusedResidualPass === FOCUSED_RESIDUALS.size;
  const focusedSignal =
    upstreamOk
    && focusedResidualPass === FOCUSED_RESIDUALS.size
    && mean(rows.map((row) => row.decomposedMeanAbsDeltaMmHg)) <= 0.5
    && mean(rows.map((row) => row.decomposedImprovementFraction)) >= 0.9;
  return {
    reportId: DECOMPOSED_LA_PRESSURE_CONTRACT_REPORT_ID_V1,
    gateId: "decomposedLaPressureContractV1",
    upstreamAttribution: {
      requiredStatus: "la-pressure-parity-attribution-signal",
      observedStatus: upstream.decision.atrialPressureParityStatus,
      focusedResidualCount: upstream.summary.focusedResidualCount,
    },
    contractMode: "shadow-filling-baseline-plus-normalized-fiber-active-pulse",
    rows,
    summary: {
      total: 7,
      pass,
      fail: rows.length - pass,
      focusedResidualPass,
      meanRawFiberDeltaMmHg: round(mean(rows.map((row) => row.rawFiberMeanAbsDeltaMmHg))),
      meanDecomposedDeltaMmHg: round(mean(rows.map((row) => row.decomposedMeanAbsDeltaMmHg))),
      meanImprovementFraction: round(mean(rows.map((row) => row.decomposedImprovementFraction))),
    },
    decision: {
      decomposedLaPressureContractStatus: fullSignal
        ? "decomposed-la-pressure-contract-shadow-signal"
        : focusedSignal
          ? "decomposed-la-pressure-contract-focused-shadow-signal"
          : "decomposed-la-pressure-contract-blocked",
      nextAction: fullSignal
        ? "Use this decomposed pressure shape as the next shadow substitution candidate, still without runtime wiring, AV-plane geometry, morphology acceptance, or LandAtrial unlock."
        : focusedSignal
          ? "Keep source-surface substitution blocked. The decomposed contract fixes the focused LA parity residuals, but non-focused late-peak residuals need classification before any substitution smoke."
        : "Keep atrial pressure substitution blocked and refine the decomposed LA pressure contract before any source-surface substitution smoke.",
      blockedClaims: [
        "source-surface-substitution",
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      sourceSurfaceSubstitution: false,
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      pistonVolumeMode: false,
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
    empiricalAWaveTargetMmHg: params.laAWaveMmHg,
    theta: finalSamples.map((sample) => sample.theta),
    currentPressureMmHg: finalSamples.map((sample: LeftHeartSubsystemSampleV2) => sample.lapMmHg),
    fillingBaselineMmHg: finalSamples.map((sample: LeftHeartSubsystemSampleV2) =>
      sample.lapMmHg - params.laAWaveMmHg * raisedCosineWindow(sample.theta, params.laAWaveStartTheta, params.laAWaveEndTheta)
    ),
    rawFiberPressureMmHg: finalOutputs.map((output) => output.pressureRawMmHg),
    activePressureMmHg: finalOutputs.map((output) => output.activePressureMmHg),
  };
}

function rowForSeries(series: ReplaySeriesV1): DecomposedLaPressureContractRowV1 {
  const activePeak = Math.max(...series.activePressureMmHg);
  const normalizedActive = series.activePressureMmHg.map((value) => value / Math.max(activePeak, 1e-9));
  const decomposedPressure = series.fillingBaselineMmHg.map((baseline, index) =>
    baseline + series.empiricalAWaveTargetMmHg * normalizedActive[index]!
  );
  const rawFiberDelta = meanAbsDelta(series.rawFiberPressureMmHg, series.currentPressureMmHg);
  const decomposedDelta = meanAbsDelta(decomposedPressure, series.currentPressureMmHg);
  const decomposedRms = rmsDelta(decomposedPressure, series.currentPressureMmHg);
  const activePeakIndex = maxIndex(series.activePressureMmHg);
  const currentLatePeakIndex = maxIndexByMask(
    series.currentPressureMmHg,
    series.theta.map((theta) => theta >= 0.74),
  );
  const decomposedPeakIndex = maxIndex(decomposedPressure);
  const decomposedLatePeakIndex = maxIndexByMask(
    decomposedPressure,
    series.theta.map((theta) => theta >= 0.74),
  );
  const result = {
    profileId: series.profileId,
    sourcePointId: series.sourcePointId,
    finalBeat: series.finalBeat,
    currentPeakMmHg: round(Math.max(...series.currentPressureMmHg)),
    currentMinMmHg: round(Math.min(...series.currentPressureMmHg)),
    fillingBaselinePeakMmHg: round(Math.max(...series.fillingBaselineMmHg)),
    fillingBaselineMinMmHg: round(Math.min(...series.fillingBaselineMmHg)),
    fiberActivePeakMmHg: round(activePeak),
    empiricalAWaveTargetMmHg: round(series.empiricalAWaveTargetMmHg),
    decomposedPeakMmHg: round(Math.max(...decomposedPressure)),
    decomposedMinMmHg: round(Math.min(...decomposedPressure)),
    decomposedLatePeakMmHg: round(decomposedPressure[decomposedLatePeakIndex] ?? Number.NaN),
    rawFiberMeanAbsDeltaMmHg: round(rawFiberDelta),
    decomposedMeanAbsDeltaMmHg: round(decomposedDelta),
    decomposedRmsDeltaMmHg: round(decomposedRms),
    decomposedImprovementFraction: round(improvement(rawFiberDelta, decomposedDelta)),
    activePeakTheta: round(series.theta[activePeakIndex] ?? Number.NaN),
    currentLatePeakTheta: round(series.theta[currentLatePeakIndex] ?? Number.NaN),
    decomposedPeakTheta: round(series.theta[decomposedPeakIndex] ?? Number.NaN),
    decomposedLatePeakTheta: round(series.theta[decomposedLatePeakIndex] ?? Number.NaN),
    activeToCurrentLateDeltaTheta: round(circularDelta(
      series.theta[activePeakIndex] ?? Number.NaN,
      series.theta[currentLatePeakIndex] ?? Number.NaN,
    )),
    decomposedToCurrentLateDeltaTheta: round(circularDelta(
      series.theta[decomposedPeakIndex] ?? Number.NaN,
      series.theta[currentLatePeakIndex] ?? Number.NaN,
    )),
    decomposedLateToCurrentLateDeltaTheta: round(circularDelta(
      series.theta[decomposedLatePeakIndex] ?? Number.NaN,
      series.theta[currentLatePeakIndex] ?? Number.NaN,
    )),
    status: "pass" as const,
    failureReasons: [] as readonly string[],
  };
  const failureReasons = failureReasonsFor(result);
  return { ...result, status: failureReasons.length === 0 ? "pass" : "fail", failureReasons };
}

function failureReasonsFor(
  row: Omit<DecomposedLaPressureContractRowV1, "status" | "failureReasons">,
): readonly string[] {
  const failures: string[] = [];
  if (row.decomposedMeanAbsDeltaMmHg > 1.15) failures.push("decomposed-pressure-parity-wide");
  if (row.decomposedImprovementFraction < 0.75) failures.push("decomposed-improvement-too-low");
  if (row.decomposedLateToCurrentLateDeltaTheta > 0.09) failures.push("decomposed-late-peak-phase-offset");
  if (row.decomposedPeakMmHg < row.currentMinMmHg - 1 || row.decomposedPeakMmHg > row.currentPeakMmHg + 1.4) {
    failures.push("decomposed-pressure-range-mismatch");
  }
  return failures;
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (theta < start || theta > end) return 0;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
