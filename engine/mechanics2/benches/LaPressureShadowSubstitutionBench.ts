import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberOutputV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLaLatePeakResidualAttributionBenchV1,
} from "@/engine/mechanics2/benches/LaLatePeakResidualAttributionBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  initialFlowStateValveStateV1,
  stepFlowStateValveV1,
} from "@/engine/mechanics2/valve/FlowStateValveV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const LA_PRESSURE_SHADOW_SUBSTITUTION_REPORT_ID_V1 =
  "la-pressure-shadow-substitution-report-v1" as const;

type LaPressureShadowSubstitutionRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly finalBeat: number;
  readonly currentMvForwardPeakCount: number;
  readonly shadowMvForwardPeakCount: number;
  readonly currentMvC1ContinuityScore: number;
  readonly shadowMvC1ContinuityScore: number;
  readonly currentMvForwardVolumeMl: number;
  readonly shadowMvForwardVolumeMl: number;
  readonly shadowToCurrentForwardVolumeRatio: number;
  readonly currentQmvPeakMlPerSec: number;
  readonly shadowQmvPeakMlPerSec: number;
  readonly qmvMeanAbsDeltaMlPerSec: number;
  readonly qmvRmsDeltaMlPerSec: number;
  readonly mvOpenMeanAbsDelta01: number;
  readonly currentGradientAtQmvPeakMmHg: number;
  readonly decomposedGradientAtQmvPeakMmHg: number;
  readonly meanAbsGradientDeltaMmHg: number;
  readonly rmsGradientDeltaMmHg: number;
  readonly gradientSignMismatchFraction: number;
  readonly adverseGradientDuringForwardFlowFraction: number;
  readonly maxShadowReverseProjectionAbsMlPerSec: number;
  readonly maxShadowPressureFlowResidualAbsMmHg: number;
  readonly currentNegativeEnergyFraction: number;
  readonly shadowNegativeEnergyFraction: number;
  readonly shadowNegativeEnergyExcessFraction: number;
  readonly classifications: readonly LaPressureShadowSubstitutionClassV1[];
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type LaPressureShadowSubstitutionClassV1 =
  | "pressure-gradient-support-clean"
  | "shadow-single-peak-EA-collapse"
  | "shadow-forward-volume-amplification"
  | "shadow-valve-replay-clean"
  | "unclassified-shadow-substitution-residual";

export type LaPressureShadowSubstitutionReportV1 = {
  readonly reportId: typeof LA_PRESSURE_SHADOW_SUBSTITUTION_REPORT_ID_V1;
  readonly gateId: "laPressureShadowSubstitutionV1";
  readonly upstreamLatePeakAttribution: {
    readonly requiredStatus: "la-late-peak-residual-attribution-signal";
    readonly observedStatus: ReturnType<
      typeof runLaLatePeakResidualAttributionBenchV1
    >["decision"]["laLatePeakResidualAttributionStatus"];
    readonly residualCount: number;
    readonly classifiedCount: number;
  };
  readonly substitutionMode:
    "shadow-replay-MV-valve-with-decomposed-LAP-no-volume-or-source-commit";
  readonly rows: readonly LaPressureShadowSubstitutionRowV1[];
  readonly summary: {
    readonly total: 7;
    readonly pass: number;
    readonly fail: number;
    readonly shadowMvfCleanCount: number;
    readonly gradientSupportCleanCount: number;
    readonly shadowSinglePeakCollapseCount: number;
    readonly shadowForwardVolumeWideCount: number;
    readonly classifiedResidualCount: number;
    readonly meanQmvRmsDeltaMlPerSec: number;
    readonly meanForwardVolumeRatio: number;
    readonly maxAdverseGradientDuringForwardFlowFraction: number;
    readonly maxShadowNegativeEnergyExcessFraction: number;
  };
  readonly decision: {
    readonly laPressureShadowSubstitutionStatus:
      | "la-pressure-shadow-substitution-signal"
      | "la-pressure-shadow-substitution-mixed-signal"
      | "la-pressure-shadow-substitution-blocked";
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
  readonly theta: readonly number[];
  readonly currentLapMmHg: readonly number[];
  readonly decomposedLapMmHg: readonly number[];
  readonly lvpMmHg: readonly number[];
  readonly currentQmvMlPerSec: readonly number[];
  readonly shadowQmvMlPerSec: readonly number[];
  readonly currentMvOpen01: readonly number[];
  readonly shadowMvOpen01: readonly number[];
  readonly currentEnergyRateProxyMmHgMlPerSec: readonly number[];
  readonly shadowReverseProjectionMlPerSec: readonly number[];
  readonly shadowPressureFlowResidualMmHg: readonly number[];
  readonly shadowEnergyRateProxyMmHgMlPerSec: readonly number[];
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

export function runLaPressureShadowSubstitutionBenchV1(): LaPressureShadowSubstitutionReportV1 {
  const upstream = runLaLatePeakResidualAttributionBenchV1();
  const paramsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rows = PROFILE_IDS.map((profileId, index) =>
    rowForSeries(replayShadowMvProfile(profileId, paramsByProfile[index]!))
  );
  const pass = rows.filter((row) => row.status === "pass").length;
  const upstreamOk =
    upstream.decision.laLatePeakResidualAttributionStatus === "la-late-peak-residual-attribution-signal";
  const fullSignal = upstreamOk && pass === rows.length;
  const mixedSignal =
    upstreamOk
    && pass >= 5
    && rows.filter((row) => row.failureReasons.includes("shadow-mvf-not-biphasic")).length === 0;
  return {
    reportId: LA_PRESSURE_SHADOW_SUBSTITUTION_REPORT_ID_V1,
    gateId: "laPressureShadowSubstitutionV1",
    upstreamLatePeakAttribution: {
      requiredStatus: "la-late-peak-residual-attribution-signal",
      observedStatus: upstream.decision.laLatePeakResidualAttributionStatus,
      residualCount: upstream.summary.residualCount,
      classifiedCount: upstream.summary.classifiedCount,
    },
    substitutionMode: "shadow-replay-MV-valve-with-decomposed-LAP-no-volume-or-source-commit",
    rows,
    summary: {
      total: 7,
      pass,
      fail: rows.length - pass,
      shadowMvfCleanCount: rows.filter((row) =>
        row.shadowMvForwardPeakCount === 2 && row.shadowMvC1ContinuityScore <= 0.42
      ).length,
      gradientSupportCleanCount: rows.filter((row) =>
        row.adverseGradientDuringForwardFlowFraction <= 0.08
      ).length,
      shadowSinglePeakCollapseCount: rows.filter((row) =>
        row.currentMvForwardPeakCount === 2 && row.shadowMvForwardPeakCount === 1
      ).length,
      shadowForwardVolumeWideCount: rows.filter((row) =>
        row.shadowToCurrentForwardVolumeRatio < 0.72 || row.shadowToCurrentForwardVolumeRatio > 1.28
      ).length,
      classifiedResidualCount: rows.filter((row) =>
        row.status === "pass" || !row.classifications.includes("unclassified-shadow-substitution-residual")
      ).length,
      meanQmvRmsDeltaMlPerSec: round(mean(rows.map((row) => row.qmvRmsDeltaMlPerSec))),
      meanForwardVolumeRatio: round(mean(rows.map((row) => row.shadowToCurrentForwardVolumeRatio))),
      maxAdverseGradientDuringForwardFlowFraction: round(Math.max(
        ...rows.map((row) => row.adverseGradientDuringForwardFlowFraction),
      )),
      maxShadowNegativeEnergyExcessFraction: round(Math.max(
        ...rows.map((row) => row.shadowNegativeEnergyExcessFraction),
      )),
    },
    decision: {
      laPressureShadowSubstitutionStatus: fullSignal
        ? "la-pressure-shadow-substitution-signal"
        : mixedSignal
          ? "la-pressure-shadow-substitution-mixed-signal"
          : "la-pressure-shadow-substitution-blocked",
      nextAction: fullSignal
        ? "Proceed only to a closed-loop source-surface substitution candidate in MechanicsCore2 sidecar, still shadow/off-runtime and with strict MVF/PV/ledger gates."
        : mixedSignal
          ? "Keep runtime/source substitution blocked. The decomposed LAP shadow replay preserves MVF peak class but has bounded residuals that need classification before closed-loop substitution."
          : "Keep source-surface substitution blocked and classify the shadow MV pressure-flow residual before any closed-loop or runtime path.",
      blockedClaims: [
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

function replayShadowMvProfile(
  profileId: FourChamberSubsystemProfileIdV1,
  params: LeftHeartSubsystemParamsV2,
): ReplaySeriesV1 {
  const run = runLeftHeartSubsystemV2(params);
  const atrialParams = DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA;
  let atrialState = initialAtrialFiberChamberStateV1(
    run.samples[0]?.acceptedLaVolumeMl ?? atrialParams.referenceCavityVolumeMl,
    atrialParams,
  );
  const outputs: AtrialFiberChamberOutputV1[] = [];
  const cycleLengthSec = 60 / params.heartRateBpm;
  for (let i = 0; i < run.samples.length; i++) {
    const sample = run.samples[i]!;
    const previous = run.samples[Math.max(0, i - 1)] ?? sample;
    const output = stepAtrialFiberChamberV1(atrialState, {
      tSec: sample.tSec,
      dtSec: 1 / params.sampleRateHz,
      cycleLengthSec,
      activationTimeSec: sample.beat * cycleLengthSec
        + positiveModulo(params.laAWaveStartTheta - 0.10, 1) * cycleLengthSec,
      cavityVolumeMl: sample.acceptedLaVolumeMl,
      previousCavityVolumeMl: previous.acceptedLaVolumeMl,
    }, atrialParams);
    outputs.push(output);
    atrialState = output.state;
  }
  const finalBeat = params.beats - 2;
  const activePeak = Math.max(
    1e-9,
    ...outputs
      .filter((_, index) => run.samples[index]?.beat === finalBeat)
      .map((output) => output.activePressureMmHg),
  );
  let shadowMvState = initialFlowStateValveStateV1();
  const shadowQmv: number[] = [];
  const shadowOpen: number[] = [];
  const shadowReverse: number[] = [];
  const shadowResidual: number[] = [];
  const shadowEnergy: number[] = [];
  const decomposedLapAll = run.samples.map((sample, index) =>
    decomposedLapMmHg(sample, outputs[index]?.activePressureMmHg ?? 0, activePeak, params)
  );
  for (let i = 0; i < run.samples.length; i++) {
    const sample = run.samples[i]!;
    const shadowMv = stepFlowStateValveV1(shadowMvState, {
      dtSec: 1 / params.sampleRateHz,
      upstreamPressureMmHg: decomposedLapAll[i]!,
      downstreamPressureMmHg: sample.lvpMmHg,
      closureDrive01: mvSystolicClosureDrive01(sample.theta, params),
    }, params.mv);
    shadowMvState = shadowMv.state;
    shadowQmv.push(shadowMv.qMlPerSec);
    shadowOpen.push(shadowMv.open01);
    shadowReverse.push(shadowMv.reverseProjectionMlPerSec);
    shadowResidual.push(shadowMv.pressureFlowResidualMmHg);
    shadowEnergy.push(shadowMv.energyRateProxyMmHgMlPerSec);
  }
  const finalIndices = run.samples
    .map((sample, index) => ({ sample, index }))
    .filter(({ sample }) => sample.beat === finalBeat)
    .map(({ index }) => index);
  return {
    profileId,
    sourcePointId: params.fixtureId,
    finalBeat,
    theta: finalIndices.map((index) => run.samples[index]!.theta),
    currentLapMmHg: finalIndices.map((index) => run.samples[index]!.lapMmHg),
    decomposedLapMmHg: finalIndices.map((index) => decomposedLapAll[index]!),
    lvpMmHg: finalIndices.map((index) => run.samples[index]!.lvpMmHg),
    currentQmvMlPerSec: finalIndices.map((index) => run.samples[index]!.qMvMlPerSec),
    shadowQmvMlPerSec: finalIndices.map((index) => shadowQmv[index]!),
    currentMvOpen01: finalIndices.map((index) => run.samples[index]!.mvOpen01),
    shadowMvOpen01: finalIndices.map((index) => shadowOpen[index]!),
    currentEnergyRateProxyMmHgMlPerSec: finalIndices.map((index) => run.samples[index]!.mv.energyRateProxyMmHgMlPerSec),
    shadowReverseProjectionMlPerSec: finalIndices.map((index) => shadowReverse[index]!),
    shadowPressureFlowResidualMmHg: finalIndices.map((index) => shadowResidual[index]!),
    shadowEnergyRateProxyMmHgMlPerSec: finalIndices.map((index) => shadowEnergy[index]!),
  };
}

function decomposedLapMmHg(
  sample: LeftHeartSubsystemSampleV2,
  activePressureMmHg: number,
  activePeakMmHg: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  const empiricalAWave = params.laAWaveMmHg
    * raisedCosineWindow(sample.theta, params.laAWaveStartTheta, params.laAWaveEndTheta);
  const fillingBaseline = sample.lapMmHg - empiricalAWave;
  return fillingBaseline + params.laAWaveMmHg * activePressureMmHg / Math.max(activePeakMmHg, 1e-9);
}

function rowForSeries(series: ReplaySeriesV1): LaPressureShadowSubstitutionRowV1 {
  const dtSec = 1 / Math.max(series.theta.length, 1);
  const currentGradient = series.currentLapMmHg.map((lap, index) => lap - series.lvpMmHg[index]!);
  const decomposedGradient = series.decomposedLapMmHg.map((lap, index) => lap - series.lvpMmHg[index]!);
  const currentQ = series.currentQmvMlPerSec;
  const shadowQ = series.shadowQmvMlPerSec;
  const currentNegativeEnergyFraction = negativeEnergyFraction(series.currentEnergyRateProxyMmHgMlPerSec);
  const shadowNegativeEnergyFraction = negativeEnergyFraction(series.shadowEnergyRateProxyMmHgMlPerSec);
  const currentShape = computeShapeQualityMetricsV1(currentQ);
  const shadowShape = computeShapeQualityMetricsV1(shadowQ);
  const qPeakIndex = maxIndex(currentQ);
  const flowActiveIndices = currentQ
    .map((q, index) => ({ q, index }))
    .filter(({ q }) => q > 5)
    .map(({ index }) => index);
  const resultBase = {
    profileId: series.profileId,
    sourcePointId: series.sourcePointId,
    finalBeat: series.finalBeat,
    currentMvForwardPeakCount: positivePeakCount(currentQ),
    shadowMvForwardPeakCount: positivePeakCount(shadowQ),
    currentMvC1ContinuityScore: round(currentShape.c1ContinuityScore),
    shadowMvC1ContinuityScore: round(shadowShape.c1ContinuityScore),
    currentMvForwardVolumeMl: round(forwardFlowVolume(currentQ, dtSec)),
    shadowMvForwardVolumeMl: round(forwardFlowVolume(shadowQ, dtSec)),
    shadowToCurrentForwardVolumeRatio: round(
      forwardFlowVolume(shadowQ, dtSec) / Math.max(forwardFlowVolume(currentQ, dtSec), 1e-9),
    ),
    currentQmvPeakMlPerSec: round(Math.max(...currentQ)),
    shadowQmvPeakMlPerSec: round(Math.max(...shadowQ)),
    qmvMeanAbsDeltaMlPerSec: round(meanAbsDelta(currentQ, shadowQ)),
    qmvRmsDeltaMlPerSec: round(rmsDelta(currentQ, shadowQ)),
    mvOpenMeanAbsDelta01: round(meanAbsDelta(series.currentMvOpen01, series.shadowMvOpen01)),
    currentGradientAtQmvPeakMmHg: round(currentGradient[qPeakIndex] ?? Number.NaN),
    decomposedGradientAtQmvPeakMmHg: round(decomposedGradient[qPeakIndex] ?? Number.NaN),
    meanAbsGradientDeltaMmHg: round(meanAbsDelta(currentGradient, decomposedGradient)),
    rmsGradientDeltaMmHg: round(rmsDelta(currentGradient, decomposedGradient)),
    gradientSignMismatchFraction: round(signMismatchFraction(currentGradient, decomposedGradient)),
    adverseGradientDuringForwardFlowFraction: round(
      fraction(flowActiveIndices, (index) => (decomposedGradient[index] ?? 0) < -0.25),
    ),
    maxShadowReverseProjectionAbsMlPerSec: round(maxAbs(series.shadowReverseProjectionMlPerSec)),
    maxShadowPressureFlowResidualAbsMmHg: round(maxAbs(series.shadowPressureFlowResidualMmHg)),
    currentNegativeEnergyFraction: round(currentNegativeEnergyFraction),
    shadowNegativeEnergyFraction: round(shadowNegativeEnergyFraction),
    shadowNegativeEnergyExcessFraction: round(Math.max(0, shadowNegativeEnergyFraction - currentNegativeEnergyFraction)),
  };
  const failureReasons = failureReasonsFor(resultBase);
  return {
    ...resultBase,
    classifications: classificationsFor(resultBase, failureReasons),
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function failureReasonsFor(
  row: Omit<LaPressureShadowSubstitutionRowV1, "classifications" | "status" | "failureReasons">,
): readonly string[] {
  const failures: string[] = [];
  if (row.currentMvForwardPeakCount !== 2) failures.push("source-mvf-not-biphasic");
  if (row.shadowMvForwardPeakCount !== 2) failures.push("shadow-mvf-not-biphasic");
  if (row.shadowMvC1ContinuityScore > 0.42) failures.push("shadow-mvf-c1-kink");
  if (row.shadowToCurrentForwardVolumeRatio < 0.72 || row.shadowToCurrentForwardVolumeRatio > 1.28) {
    failures.push("shadow-forward-volume-ratio-wide");
  }
  if (row.adverseGradientDuringForwardFlowFraction > 0.08) {
    failures.push("decomposed-gradient-adverse-during-forward-flow");
  }
  if (row.gradientSignMismatchFraction > 0.24) failures.push("gradient-sign-parity-wide");
  if (row.maxShadowReverseProjectionAbsMlPerSec > 10) failures.push("shadow-reverse-projection-dominant");
  if (row.shadowNegativeEnergyExcessFraction > 0.08) failures.push("shadow-negative-energy-duty-wide");
  return failures;
}

function classificationsFor(
  row: Omit<LaPressureShadowSubstitutionRowV1, "classifications" | "status" | "failureReasons">,
  failureReasons: readonly string[],
): readonly LaPressureShadowSubstitutionClassV1[] {
  const classes: LaPressureShadowSubstitutionClassV1[] = [];
  if (row.adverseGradientDuringForwardFlowFraction <= 0.08 && row.gradientSignMismatchFraction <= 0.24) {
    classes.push("pressure-gradient-support-clean");
  }
  if (row.currentMvForwardPeakCount === 2 && row.shadowMvForwardPeakCount === 1) {
    classes.push("shadow-single-peak-EA-collapse");
  }
  if (row.shadowToCurrentForwardVolumeRatio > 1.28 || row.shadowToCurrentForwardVolumeRatio < 0.72) {
    classes.push("shadow-forward-volume-amplification");
  }
  if (failureReasons.length === 0) classes.push("shadow-valve-replay-clean");
  if (failureReasons.length > 0 && classes.length === 1 && classes[0] === "pressure-gradient-support-clean") {
    classes.push("unclassified-shadow-substitution-residual");
  }
  return classes;
}

function mvSystolicClosureDrive01(theta: number, params: LeftHeartSubsystemParamsV2): number {
  if (params.mvSystolicClosureDriveGain01 <= 0) return 0;
  return clamp(
    params.mvSystolicClosureDriveGain01
      * raisedCosineWindow(theta, params.mvSystolicClosureDriveStartTheta, params.mvSystolicClosureDriveEndTheta),
    0,
    1,
  );
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (theta < start || theta > end) return 0;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = 0.12 * Math.max(maxValue, 1e-9);
  let count = 0;
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur <= threshold) continue;
    if (cur > values[i - 1]! && cur >= values[i + 1]!) count++;
  }
  return count;
}

function forwardFlowVolume(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, q) => sum + Math.max(0, q) * dtSec, 0);
}

function signMismatchFraction(a: readonly number[], b: readonly number[]): number {
  const indices = a
    .map((value, index) => ({ value, other: b[index] ?? 0, index }))
    .filter(({ value, other }) => Math.max(Math.abs(value), Math.abs(other)) >= 0.25)
    .map(({ index }) => index);
  return fraction(indices, (index) => Math.sign(a[index] ?? 0) !== Math.sign(b[index] ?? 0));
}

function negativeEnergyFraction(values: readonly number[]): number {
  return fraction(values.map((_, index) => index), (index) => (values[index] ?? 0) < -1);
}

function fraction(indices: readonly number[], predicate: (index: number) => boolean): number {
  if (indices.length === 0) return 0;
  return indices.filter(predicate).length / indices.length;
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

function maxIndex(values: readonly number[]): number {
  let bestIndex = 0;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    if (values[i]! > bestValue) {
      bestValue = values[i]!;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
