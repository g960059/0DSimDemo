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
  runLaPressureShadowSubstitutionBenchV1,
} from "@/engine/mechanics2/benches/LaPressureShadowSubstitutionBench";
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

export const LA_ACTIVE_PULSE_MV_REPLAY_REFINEMENT_REPORT_ID_V1 =
  "la-active-pulse-mv-replay-refinement-report-v1" as const;

type LaActivePulseModeV1 =
  | "raw-fiber-active"
  | "empirical-a-window-positive-control"
  | "fiber-active-a-window-gated"
  | "fiber-active-peak-window-gated"
  | "fiber-active-late-onset-gated"
  | "fiber-active-tail-subtracted";

type VariantRowV1 = {
  readonly mode: LaActivePulseModeV1;
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
  readonly currentMvForwardPeakCount: number;
  readonly shadowMvForwardPeakCount: number;
  readonly shadowMvC1ContinuityScore: number;
  readonly shadowToCurrentForwardVolumeRatio: number;
  readonly qmvRmsDeltaMlPerSec: number;
  readonly currentAdverseGradientDuringForwardFlowFraction: number;
  readonly adverseGradientDuringForwardFlowFraction: number;
  readonly adverseGradientExcessFraction: number;
  readonly gradientSignMismatchFraction: number;
};

type VariantSummaryV1 = {
  readonly mode: LaActivePulseModeV1;
  readonly pass: number;
  readonly fail: number;
  readonly shadowMvfCleanCount: number;
  readonly gradientSupportCleanCount: number;
  readonly singlePeakCollapseCount: number;
  readonly forwardVolumeWideCount: number;
  readonly meanQmvRmsDeltaMlPerSec: number;
  readonly meanForwardVolumeRatio: number;
  readonly maxAdverseGradientDuringForwardFlowFraction: number;
  readonly maxAdverseGradientExcessFraction: number;
};

export type LaActivePulseMvReplayRefinementReportV1 = {
  readonly reportId: typeof LA_ACTIVE_PULSE_MV_REPLAY_REFINEMENT_REPORT_ID_V1;
  readonly gateId: "laActivePulseMvReplayRefinementV1";
  readonly upstreamShadowSubstitution: {
    readonly requiredStatus: "la-pressure-shadow-substitution-blocked";
    readonly observedStatus: ReturnType<
      typeof runLaPressureShadowSubstitutionBenchV1
    >["decision"]["laPressureShadowSubstitutionStatus"];
    readonly pass: number;
    readonly shadowSinglePeakCollapseCount: number;
  };
  readonly refinementMode:
    "shadow-MV-replay-active-pulse-shape-shootout-no-volume-or-source-commit";
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly rows: readonly VariantRowV1[];
  readonly decision: {
    readonly laActivePulseMvReplayRefinementStatus:
      | "la-active-pulse-mv-replay-refinement-signal"
      | "la-active-pulse-mv-replay-refinement-control-only"
      | "la-active-pulse-mv-replay-refinement-blocked";
    readonly selectedMode: LaActivePulseModeV1 | null;
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

type ProfileTraceV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly params: LeftHeartSubsystemParamsV2;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
  readonly outputs: readonly AtrialFiberChamberOutputV1[];
  readonly finalBeat: number;
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

const MODES: readonly LaActivePulseModeV1[] = [
  "raw-fiber-active",
  "empirical-a-window-positive-control",
  "fiber-active-a-window-gated",
  "fiber-active-peak-window-gated",
  "fiber-active-late-onset-gated",
  "fiber-active-tail-subtracted",
];

export function runLaActivePulseMvReplayRefinementBenchV1():
LaActivePulseMvReplayRefinementReportV1 {
  const upstream = runLaPressureShadowSubstitutionBenchV1();
  const paramsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const traces = PROFILE_IDS.map((profileId, index) =>
    replayProfileTrace(profileId, paramsByProfile[index]!)
  );
  const rows = MODES.flatMap((mode) =>
    traces.map((trace) => rowForMode(trace, mode))
  );
  const variantSummaries = MODES.map((mode) =>
    summarizeVariant(mode, rows.filter((row) => row.mode === mode))
  );
  const selected = variantSummaries.find((summary) =>
    summary.mode !== "empirical-a-window-positive-control" && summary.pass === PROFILE_IDS.length
  ) ?? null;
  const control = variantSummaries.find((summary) =>
    summary.mode === "empirical-a-window-positive-control"
  );
  const upstreamOk =
    upstream.decision.laPressureShadowSubstitutionStatus === "la-pressure-shadow-substitution-blocked";
  const controlOk = (control?.pass ?? 0) === PROFILE_IDS.length;
  return {
    reportId: LA_ACTIVE_PULSE_MV_REPLAY_REFINEMENT_REPORT_ID_V1,
    gateId: "laActivePulseMvReplayRefinementV1",
    upstreamShadowSubstitution: {
      requiredStatus: "la-pressure-shadow-substitution-blocked",
      observedStatus: upstream.decision.laPressureShadowSubstitutionStatus,
      pass: upstream.summary.pass,
      shadowSinglePeakCollapseCount: upstream.summary.shadowSinglePeakCollapseCount,
    },
    refinementMode: "shadow-MV-replay-active-pulse-shape-shootout-no-volume-or-source-commit",
    variantSummaries,
    rows,
    decision: {
      laActivePulseMvReplayRefinementStatus: upstreamOk && selected
        ? "la-active-pulse-mv-replay-refinement-signal"
        : upstreamOk && controlOk
          ? "la-active-pulse-mv-replay-refinement-control-only"
          : "la-active-pulse-mv-replay-refinement-blocked",
      selectedMode: selected?.mode ?? null,
      nextAction: upstreamOk && selected
        ? "Proceed only to a shadow decomposed-LAP substitution candidate using the selected active-pulse shaping mode; keep runtime, AV-plane, and LandAtrial locked."
        : upstreamOk && controlOk
          ? "Keep atrial-fiber active-pulse substitution blocked. The empirical A-window control proves the shadow replay can pass, but fiber-derived pulse shaping still needs a mechanistic contract."
          : "Keep pressure substitution blocked and classify why even the positive control cannot preserve MV replay.",
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

function replayProfileTrace(
  profileId: FourChamberSubsystemProfileIdV1,
  params: LeftHeartSubsystemParamsV2,
): ProfileTraceV1 {
  const run = runLeftHeartSubsystemV2(params);
  const atrialParams = DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1.LA;
  let state = initialAtrialFiberChamberStateV1(
    run.samples[0]?.acceptedLaVolumeMl ?? atrialParams.referenceCavityVolumeMl,
    atrialParams,
  );
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
  return { profileId, params, samples: run.samples, outputs, finalBeat: params.beats - 2 };
}

function rowForMode(trace: ProfileTraceV1, mode: LaActivePulseModeV1): VariantRowV1 {
  const pulse = normalizedPulse(trace, mode);
  let shadowMvState = initialFlowStateValveStateV1();
  const shadowQ: number[] = [];
  const shadowOpen: number[] = [];
  for (let i = 0; i < trace.samples.length; i++) {
    const sample = trace.samples[i]!;
    const decomposedLap = decomposedLapMmHg(sample, pulse[i] ?? 0, trace.params);
    const shadowMv = stepFlowStateValveV1(shadowMvState, {
      dtSec: 1 / trace.params.sampleRateHz,
      upstreamPressureMmHg: decomposedLap,
      downstreamPressureMmHg: sample.lvpMmHg,
      closureDrive01: mvSystolicClosureDrive01(sample.theta, trace.params),
    }, trace.params.mv);
    shadowMvState = shadowMv.state;
    shadowQ.push(shadowMv.qMlPerSec);
    shadowOpen.push(shadowMv.open01);
  }
  const finalIndices = trace.samples
    .map((sample, index) => ({ sample, index }))
    .filter(({ sample }) => sample.beat === trace.finalBeat)
    .map(({ index }) => index);
  const currentQ = finalIndices.map((index) => trace.samples[index]!.qMvMlPerSec);
  const shadowFinalQ = finalIndices.map((index) => shadowQ[index]!);
  const currentLap = finalIndices.map((index) => trace.samples[index]!.lapMmHg);
  const decomposedLap = finalIndices.map((index) => decomposedLapMmHg(
    trace.samples[index]!,
    pulse[index] ?? 0,
    trace.params,
  ));
  const lvp = finalIndices.map((index) => trace.samples[index]!.lvpMmHg);
  const currentGradient = currentLap.map((lap, index) => lap - lvp[index]!);
  const decomposedGradient = decomposedLap.map((lap, index) => lap - lvp[index]!);
  const flowActiveIndices = currentQ
    .map((q, index) => ({ q, index }))
    .filter(({ q }) => q > 5)
    .map(({ index }) => index);
  const currentAdverseGradientDuringForwardFlowFraction =
    fraction(flowActiveIndices, (index) => (currentGradient[index] ?? 0) < -0.25);
  const adverseGradientDuringForwardFlowFraction =
    fraction(flowActiveIndices, (index) => (decomposedGradient[index] ?? 0) < -0.25);
  const shadowShape = computeShapeQualityMetricsV1(shadowFinalQ);
  const dtSec = 1 / Math.max(finalIndices.length, 1);
  const base = {
    mode,
    profileId: trace.profileId,
    currentMvForwardPeakCount: positivePeakCount(currentQ),
    shadowMvForwardPeakCount: positivePeakCount(shadowFinalQ),
    shadowMvC1ContinuityScore: round(shadowShape.c1ContinuityScore),
    shadowToCurrentForwardVolumeRatio: round(
      forwardFlowVolume(shadowFinalQ, dtSec) / Math.max(forwardFlowVolume(currentQ, dtSec), 1e-9),
    ),
    qmvRmsDeltaMlPerSec: round(rmsDelta(currentQ, shadowFinalQ)),
    currentAdverseGradientDuringForwardFlowFraction: round(currentAdverseGradientDuringForwardFlowFraction),
    adverseGradientDuringForwardFlowFraction: round(adverseGradientDuringForwardFlowFraction),
    adverseGradientExcessFraction: round(Math.max(
      0,
      adverseGradientDuringForwardFlowFraction - currentAdverseGradientDuringForwardFlowFraction,
    )),
    gradientSignMismatchFraction: round(signMismatchFraction(currentGradient, decomposedGradient)),
  };
  const failureReasons = failureReasonsFor(base);
  return {
    ...base,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function normalizedPulse(trace: ProfileTraceV1, mode: LaActivePulseModeV1): readonly number[] {
  const raw = trace.outputs.map((output) => Math.max(0, output.activePressureMmHg));
  const finalIndices = trace.samples
    .map((sample, index) => ({ sample, index }))
    .filter(({ sample }) => sample.beat === trace.finalBeat)
    .map(({ index }) => index);
  const activePeakIndex = finalIndices.reduce((best, index) =>
    raw[index]! > raw[best]! ? index : best,
  finalIndices[0] ?? 0);
  const activePeakTheta = trace.samples[activePeakIndex]?.theta ?? 0.86;
  const baseline = percentile(finalIndices.map((index) => raw[index]!), 0.15);
  const pulse = trace.samples.map((sample, index) => {
    const active = raw[index]!;
    if (mode === "empirical-a-window-positive-control") {
      return raisedCosineWindow(sample.theta, trace.params.laAWaveStartTheta, trace.params.laAWaveEndTheta);
    }
    if (mode === "fiber-active-a-window-gated") {
      return active * raisedCosineWindow(sample.theta, trace.params.laAWaveStartTheta, trace.params.laAWaveEndTheta);
    }
    if (mode === "fiber-active-peak-window-gated") {
      return active * raisedCosineWindow(sample.theta, activePeakTheta - 0.08, activePeakTheta + 0.08);
    }
    if (mode === "fiber-active-late-onset-gated") {
      return active * smoothstep01((sample.theta - 0.82) / 0.08);
    }
    if (mode === "fiber-active-tail-subtracted") {
      return Math.max(0, active - baseline);
    }
    return active;
  });
  const peak = Math.max(1e-9, ...finalIndices.map((index) => pulse[index]!));
  return pulse.map((value) => value / peak);
}

function decomposedLapMmHg(
  sample: LeftHeartSubsystemSampleV2,
  normalizedActivePulse01: number,
  params: LeftHeartSubsystemParamsV2,
): number {
  const empiricalAWave = params.laAWaveMmHg
    * raisedCosineWindow(sample.theta, params.laAWaveStartTheta, params.laAWaveEndTheta);
  return sample.lapMmHg - empiricalAWave + params.laAWaveMmHg * normalizedActivePulse01;
}

function summarizeVariant(mode: LaActivePulseModeV1, rows: readonly VariantRowV1[]): VariantSummaryV1 {
  const pass = rows.filter((row) => row.status === "pass").length;
  return {
    mode,
    pass,
    fail: rows.length - pass,
    shadowMvfCleanCount: rows.filter((row) =>
      row.shadowMvForwardPeakCount === 2 && row.shadowMvC1ContinuityScore <= 0.42
    ).length,
    gradientSupportCleanCount: rows.filter((row) =>
      row.adverseGradientExcessFraction <= 0.08
    ).length,
    singlePeakCollapseCount: rows.filter((row) =>
      row.currentMvForwardPeakCount === 2 && row.shadowMvForwardPeakCount === 1
    ).length,
    forwardVolumeWideCount: rows.filter((row) =>
      row.shadowToCurrentForwardVolumeRatio < 0.72 || row.shadowToCurrentForwardVolumeRatio > 1.28
    ).length,
    meanQmvRmsDeltaMlPerSec: round(mean(rows.map((row) => row.qmvRmsDeltaMlPerSec))),
    meanForwardVolumeRatio: round(mean(rows.map((row) => row.shadowToCurrentForwardVolumeRatio))),
    maxAdverseGradientDuringForwardFlowFraction: round(Math.max(
      ...rows.map((row) => row.adverseGradientDuringForwardFlowFraction),
    )),
    maxAdverseGradientExcessFraction: round(Math.max(
      ...rows.map((row) => row.adverseGradientExcessFraction),
    )),
  };
}

function failureReasonsFor(row: Omit<VariantRowV1, "status" | "failureReasons">): readonly string[] {
  const failures: string[] = [];
  if (row.currentMvForwardPeakCount !== 2) failures.push("source-mvf-not-biphasic");
  if (row.shadowMvForwardPeakCount !== 2) failures.push("shadow-mvf-not-biphasic");
  if (row.shadowMvC1ContinuityScore > 0.42) failures.push("shadow-mvf-c1-kink");
  if (row.shadowToCurrentForwardVolumeRatio < 0.72 || row.shadowToCurrentForwardVolumeRatio > 1.28) {
    failures.push("shadow-forward-volume-ratio-wide");
  }
  if (row.adverseGradientExcessFraction > 0.08) {
    failures.push("decomposed-gradient-adverse-during-forward-flow");
  }
  if (row.gradientSignMismatchFraction > 0.24) failures.push("gradient-sign-parity-wide");
  return failures;
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

function fraction(indices: readonly number[], predicate: (index: number) => boolean): number {
  if (indices.length === 0) return 0;
  return indices.filter(predicate).length / indices.length;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rmsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(sum / count);
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[index]!;
}

function smoothstep01(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
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
