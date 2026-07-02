import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberIdV1,
  type AtrialFiberChamberOutputV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import {
  runAtrialFiberSourceReservoirShadowReplayBenchV1,
} from "@/engine/mechanics2/benches/AtrialFiberSourceReservoirShadowReplayBench";
import {
  runSelectedSmoothReservoirProfileV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirOwnershipBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
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
import {
  runRightHeartSubsystemV2,
  type RightHeartSubsystemParamsV2,
  type RightHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const AV_VALVE_ATRIAL_GRADIENT_SHADOW_REPORT_ID_V1 =
  "av-valve-atrial-gradient-shadow-report-v1" as const;

type ValveSideV1 = "MV" | "TV";

type ValveGradientShadowRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly valveSide: ValveSideV1;
  readonly sourcePointId: string;
  readonly currentForwardPeakCount: number;
  readonly shadowForwardPeakCount: number;
  readonly shadowC1ContinuityScore: number;
  readonly shadowToCurrentForwardVolumeRatio: number;
  readonly qRmsDeltaMlPerSec: number;
  readonly activePulsePeak01: number;
  readonly activePressurePeakMmHg: number;
  readonly gradientSignMismatchFraction: number;
  readonly adverseGradientDuringForwardFlowFraction: number;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type AvValveAtrialGradientShadowReportV1 = {
  readonly reportId: typeof AV_VALVE_ATRIAL_GRADIENT_SHADOW_REPORT_ID_V1;
  readonly gateId: "avValveAtrialGradientShadowV1";
  readonly upstreamAtrialShadow: {
    readonly requiredStatus: "atrial-fiber-source-reservoir-shadow-replay-signal";
    readonly observedStatus: ReturnType<
      typeof runAtrialFiberSourceReservoirShadowReplayBenchV1
    >["decision"]["atrialFiberSourceReservoirShadowReplayStatus"];
    readonly pass: number;
    readonly finiteBoundedCount: number;
  };
  readonly replayMode:
    "shadow-AV-valve-gradient-replay-active-pulse-no-source-pressure-commit";
  readonly rows: readonly ValveGradientShadowRowV1[];
  readonly summary: {
    readonly total: 14;
    readonly pass: number;
    readonly fail: number;
    readonly mvPass: number;
    readonly tvPass: number;
    readonly cleanShapeCount: number;
    readonly forwardVolumeParityCount: number;
    readonly maxGradientSignMismatchFraction: number;
    readonly maxAdverseGradientDuringForwardFlowFraction: number;
    readonly meanQmsDeltaMlPerSec: number;
  };
  readonly decision: {
    readonly avValveAtrialGradientShadowStatus:
      | "av-valve-atrial-gradient-shadow-signal"
      | "av-valve-atrial-gradient-shadow-mixed"
      | "av-valve-atrial-gradient-shadow-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly sourcePressureCommit: false;
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly pistonVolumeMode: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;

const PROFILE_MAP: readonly {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
}[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

export function runAvValveAtrialGradientShadowBenchV1(): AvValveAtrialGradientShadowReportV1 {
  const upstream = runAtrialFiberSourceReservoirShadowReplayBenchV1();
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rightParams = buildRightHeartStrategicEnvelopeV1();
  const rows = PROFILE_MAP.flatMap((profile, index) => {
    const sourceRun = runSelectedSmoothReservoirProfileV1({
      scenarioId: "nominal",
      sampleRateMultiplier: 1,
      epochs: 14,
      ...profile,
    });
    const left = withLeftPulmonaryPressure(
      leftParams[index]!,
      sourceRun.finalState.pulmonaryVenousPressureMmHg,
    );
    const right = withRightSystemicVenousPressure(
      rightParams[index]!,
      sourceRun.finalState.systemicVenousPressureMmHg,
    );
    const leftRun = runLeftHeartSubsystemV2(left);
    const rightRun = runRightHeartSubsystemV2(right);
    return [
      replayMv(profile.profileId, left, leftRun.finalBeatSamples),
      replayTv(profile.profileId, right, rightRun.finalBeatSamples),
    ];
  });
  const pass = rows.filter((row) => row.status === "pass").length;
  const upstreamOk =
    upstream.decision.atrialFiberSourceReservoirShadowReplayStatus
    === "atrial-fiber-source-reservoir-shadow-replay-signal";
  return {
    reportId: AV_VALVE_ATRIAL_GRADIENT_SHADOW_REPORT_ID_V1,
    gateId: "avValveAtrialGradientShadowV1",
    upstreamAtrialShadow: {
      requiredStatus: "atrial-fiber-source-reservoir-shadow-replay-signal",
      observedStatus: upstream.decision.atrialFiberSourceReservoirShadowReplayStatus,
      pass: upstream.summary.pass,
      finiteBoundedCount: upstream.summary.finiteBoundedCount,
    },
    replayMode: "shadow-AV-valve-gradient-replay-active-pulse-no-source-pressure-commit",
    rows,
    summary: {
      total: 14,
      pass,
      fail: rows.length - pass,
      mvPass: rows.filter((row) => row.valveSide === "MV" && row.status === "pass").length,
      tvPass: rows.filter((row) => row.valveSide === "TV" && row.status === "pass").length,
      cleanShapeCount: rows.filter((row) =>
        row.shadowForwardPeakCount === 2 && row.shadowC1ContinuityScore <= 0.42
      ).length,
      forwardVolumeParityCount: rows.filter((row) =>
        row.shadowToCurrentForwardVolumeRatio >= 0.96
        && row.shadowToCurrentForwardVolumeRatio <= 1.04
      ).length,
      maxGradientSignMismatchFraction: round(Math.max(...rows.map((row) => row.gradientSignMismatchFraction))),
      maxAdverseGradientDuringForwardFlowFraction: round(Math.max(...rows.map((row) =>
        row.adverseGradientDuringForwardFlowFraction
      ))),
      meanQmsDeltaMlPerSec: round(mean(rows.map((row) => row.qRmsDeltaMlPerSec))),
    },
    decision: {
      avValveAtrialGradientShadowStatus: upstreamOk && pass === rows.length
        ? "av-valve-atrial-gradient-shadow-signal"
        : upstreamOk && pass >= 10
          ? "av-valve-atrial-gradient-shadow-mixed"
          : "av-valve-atrial-gradient-shadow-blocked",
      nextAction: upstreamOk && pass === rows.length
        ? "Use this as a shadow-only signal for a future valve/source co-owned gradient contract. Keep source pressure commit, runtime, AV-plane, and LandAtrial blocked."
        : upstreamOk && pass >= 10
          ? "Keep promotion blocked and classify the side/profile-specific AV gradient replay residuals before any source-pressure commit."
          : "Do not proceed to source-pressure commit or AV-plane/LandAtrial. The atrial active gradient shadow does not preserve AV valve replay.",
      blockedClaims: [
        "source-pressure-commit",
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      sourcePressureCommit: false,
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      pistonVolumeMode: false,
      LandAtrialUnlock: false,
    },
  };
}

function replayMv(
  profileId: FourChamberSubsystemProfileIdV1,
  params: LeftHeartSubsystemParamsV2,
  samples: readonly LeftHeartSubsystemSampleV2[],
): ValveGradientShadowRowV1 {
  const atrialOutputs = atrialOutputsFor("LA", samples.map((sample) => ({
    tSec: sample.tSec,
    theta: sample.theta,
    volumeMl: sample.acceptedLaVolumeMl,
  })), 0.76, 60 / params.heartRateBpm, 1 / params.sampleRateHz);
  const currentQ = samples.map((sample) => sample.qMvMlPerSec);
  const shadowQ = replayValve(samples, (sample, index) => {
    const empiricalPulse = params.laAWaveMmHg
      * raisedCosineWindow(sample.theta, params.laAWaveStartTheta, params.laAWaveEndTheta);
    const activePulse01 = activePulse01For(atrialOutputs[index]!, 11)
      * raisedCosineWindow(sample.theta, params.laAWaveStartTheta, params.laAWaveEndTheta);
    return {
      upstreamPressureMmHg: sample.lapMmHg - empiricalPulse + params.laAWaveMmHg * activePulse01,
      downstreamPressureMmHg: sample.lvpMmHg,
      currentPressureGradientMmHg: sample.lapMmHg - sample.lvpMmHg,
      shadowPressureGradientMmHg: sample.lapMmHg - empiricalPulse + params.laAWaveMmHg * activePulse01 - sample.lvpMmHg,
      currentQ: sample.qMvMlPerSec,
      closureDrive01: mvClosureDrive01(sample.theta, params),
    };
  }, params.mv, 1 / params.sampleRateHz);
  return rowForReplay({
    profileId,
    valveSide: "MV",
    sourcePointId: params.fixtureId,
    currentQ,
    shadowQ: shadowQ.q,
    activePulsePeak01: Math.max(...atrialOutputs.map((output, index) =>
      activePulse01For(output, 11) * raisedCosineWindow(samples[index]!.theta, params.laAWaveStartTheta, params.laAWaveEndTheta)
    )),
    activePressurePeakMmHg: Math.max(...atrialOutputs.map((output) => output.activePressureMmHg)),
    currentGradient: shadowQ.currentGradient,
    shadowGradient: shadowQ.shadowGradient,
  });
}

function replayTv(
  profileId: FourChamberSubsystemProfileIdV1,
  params: RightHeartSubsystemParamsV2,
  samples: readonly RightHeartSubsystemSampleV2[],
): ValveGradientShadowRowV1 {
  const atrialOutputs = atrialOutputsFor("RA", samples.map((sample) => ({
    tSec: sample.tSec,
    theta: sample.theta,
    volumeMl: sample.acceptedRaVolumeMl,
  })), 0.74, 60 / params.heartRateBpm, 1 / params.sampleRateHz);
  const currentQ = samples.map((sample) => sample.qTvMlPerSec);
  const shadowQ = replayValve(samples, (sample, index) => {
    const empiricalPulse = params.raAWaveMmHg
      * raisedCosineWindow(sample.theta, params.raAWaveStartTheta, params.raAWaveEndTheta);
    const activePulse01 = activePulse01For(atrialOutputs[index]!, 3.2)
      * raisedCosineWindow(sample.theta, params.raAWaveStartTheta, params.raAWaveEndTheta);
    return {
      upstreamPressureMmHg: sample.rapMmHg - empiricalPulse + params.raAWaveMmHg * activePulse01,
      downstreamPressureMmHg: sample.rvpMmHg,
      currentPressureGradientMmHg: sample.rapMmHg - sample.rvpMmHg,
      shadowPressureGradientMmHg: sample.rapMmHg - empiricalPulse + params.raAWaveMmHg * activePulse01 - sample.rvpMmHg,
      currentQ: sample.qTvMlPerSec,
      closureDrive01: tvClosureDrive01(sample.theta, params),
    };
  }, params.tv, 1 / params.sampleRateHz);
  return rowForReplay({
    profileId,
    valveSide: "TV",
    sourcePointId: params.fixtureId,
    currentQ,
    shadowQ: shadowQ.q,
    activePulsePeak01: Math.max(...atrialOutputs.map((output, index) =>
      activePulse01For(output, 3.2) * raisedCosineWindow(samples[index]!.theta, params.raAWaveStartTheta, params.raAWaveEndTheta)
    )),
    activePressurePeakMmHg: Math.max(...atrialOutputs.map((output) => output.activePressureMmHg)),
    currentGradient: shadowQ.currentGradient,
    shadowGradient: shadowQ.shadowGradient,
  });
}

function rowForReplay(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly valveSide: ValveSideV1;
  readonly sourcePointId: string;
  readonly currentQ: readonly number[];
  readonly shadowQ: readonly number[];
  readonly activePulsePeak01: number;
  readonly activePressurePeakMmHg: number;
  readonly currentGradient: readonly number[];
  readonly shadowGradient: readonly number[];
}): ValveGradientShadowRowV1 {
  const shadowShape = computeShapeQualityMetricsV1(input.shadowQ);
  const currentForward = forwardFlowVolume(input.currentQ);
  const shadowForward = forwardFlowVolume(input.shadowQ);
  const currentPeaks = positivePeakCount(input.currentQ);
  const shadowPeaks = positivePeakCount(input.shadowQ);
  const gradientSignMismatchFraction = fraction(input.currentGradient, (_, index) =>
    Math.sign(input.currentGradient[index] ?? 0) !== Math.sign(input.shadowGradient[index] ?? 0)
    && Math.abs(input.currentGradient[index] ?? 0) > 0.1
    && Math.abs(input.shadowGradient[index] ?? 0) > 0.1
  );
  const adverseGradientDuringForwardFlowFraction = fraction(input.shadowQ, (q, index) =>
    q > 5 && (input.shadowGradient[index] ?? 0) < -0.2
  );
  const base = {
    profileId: input.profileId,
    valveSide: input.valveSide,
    sourcePointId: input.sourcePointId,
    currentForwardPeakCount: currentPeaks,
    shadowForwardPeakCount: shadowPeaks,
    shadowC1ContinuityScore: round(shadowShape.c1ContinuityScore),
    shadowToCurrentForwardVolumeRatio: round(shadowForward / Math.max(currentForward, 1e-9)),
    qRmsDeltaMlPerSec: round(rmsDelta(input.currentQ, input.shadowQ)),
    activePulsePeak01: round(input.activePulsePeak01),
    activePressurePeakMmHg: round(input.activePressurePeakMmHg),
    gradientSignMismatchFraction: round(gradientSignMismatchFraction),
    adverseGradientDuringForwardFlowFraction: round(adverseGradientDuringForwardFlowFraction),
  };
  const failureReasons = failureReasonsFor(base);
  return {
    ...base,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function failureReasonsFor(
  row: Omit<ValveGradientShadowRowV1, "status" | "failureReasons">,
): readonly string[] {
  const failures: string[] = [];
  if (row.currentForwardPeakCount === 2 && row.shadowForwardPeakCount !== 2) {
    failures.push("shadow-av-flow-not-biphasic");
  }
  if (row.shadowC1ContinuityScore > 0.42) failures.push("shadow-av-flow-c1-kink");
  if (row.shadowToCurrentForwardVolumeRatio < 0.96 || row.shadowToCurrentForwardVolumeRatio > 1.04) {
    failures.push("shadow-av-forward-volume-ratio-wide");
  }
  if (row.gradientSignMismatchFraction > 0.08) failures.push("shadow-gradient-sign-mismatch");
  if (row.adverseGradientDuringForwardFlowFraction > 0.02) {
    failures.push("shadow-adverse-gradient-during-forward-flow");
  }
  return failures;
}

function atrialOutputsFor(
  chamberId: AtrialFiberChamberIdV1,
  samples: readonly { readonly tSec: number; readonly theta: number; readonly volumeMl: number }[],
  activationTheta: number,
  cycleLengthSec: number,
  dtSec: number,
): readonly AtrialFiberChamberOutputV1[] {
  const params = DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1[chamberId];
  let state = initialAtrialFiberChamberStateV1(samples[0]?.volumeMl ?? params.referenceCavityVolumeMl, params);
  let previousVolume = samples[0]?.volumeMl ?? params.referenceCavityVolumeMl;
  const outputs: AtrialFiberChamberOutputV1[] = [];
  for (const sample of samples) {
    const output = stepAtrialFiberChamberV1(state, {
      tSec: sample.tSec,
      dtSec,
      cycleLengthSec,
      activationTimeSec: sample.tSec - sample.theta * cycleLengthSec + activationTheta * cycleLengthSec,
      cavityVolumeMl: sample.volumeMl,
      previousCavityVolumeMl: previousVolume,
    }, params);
    outputs.push(output);
    state = output.state;
    previousVolume = sample.volumeMl;
  }
  return outputs;
}

function replayValve<TSample>(
  samples: readonly TSample[],
  inputForSample: (sample: TSample, index: number) => {
    readonly upstreamPressureMmHg: number;
    readonly downstreamPressureMmHg: number;
    readonly currentPressureGradientMmHg: number;
    readonly shadowPressureGradientMmHg: number;
    readonly currentQ: number;
    readonly closureDrive01: number;
  },
  valveParams: Parameters<typeof stepFlowStateValveV1>[2],
  dtSec: number,
): {
  readonly q: readonly number[];
  readonly currentGradient: readonly number[];
  readonly shadowGradient: readonly number[];
} {
  let state = initialFlowStateValveStateV1();
  const q: number[] = [];
  const currentGradient: number[] = [];
  const shadowGradient: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    const input = inputForSample(samples[i]!, i);
    const output = stepFlowStateValveV1(state, {
      dtSec,
      upstreamPressureMmHg: input.upstreamPressureMmHg,
      downstreamPressureMmHg: input.downstreamPressureMmHg,
      closureDrive01: input.closureDrive01,
    }, valveParams);
    state = output.state;
    q.push(output.qMlPerSec);
    currentGradient.push(input.currentPressureGradientMmHg);
    shadowGradient.push(input.shadowPressureGradientMmHg);
  }
  return { q, currentGradient, shadowGradient };
}

function activePulse01For(output: AtrialFiberChamberOutputV1, referenceMmHg: number): number {
  return clamp(output.activePressureMmHg / Math.max(referenceMmHg, 1e-9), 0, 1.6);
}

function withLeftPulmonaryPressure(
  params: LeftHeartSubsystemParamsV2,
  pressureMmHg: number,
): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    pulmonaryVenousPressureMmHg: pressureMmHg,
    pulmonaryVenousInitialPressureMmHg: pressureMmHg,
    pulmonaryVenousSourcePressureMmHg: pressureMmHg,
  };
}

function withRightSystemicVenousPressure(
  params: RightHeartSubsystemParamsV2,
  pressureMmHg: number,
): RightHeartSubsystemParamsV2 {
  return { ...params, systemicVenousPressureMmHg: pressureMmHg };
}

function mvClosureDrive01(theta: number, params: LeftHeartSubsystemParamsV2): number {
  return params.mvSystolicClosureDriveGain01
    * raisedCosineWindow(theta, params.mvSystolicClosureDriveStartTheta, params.mvSystolicClosureDriveEndTheta);
}

function tvClosureDrive01(theta: number, params: RightHeartSubsystemParamsV2): number {
  return params.tvSystolicClosureDriveGain01
    * raisedCosineWindow(theta, params.tvSystolicClosureDriveStartTheta, params.tvSystolicClosureDriveEndTheta);
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

function forwardFlowVolume(values: readonly number[]): number {
  return values.reduce((sum, q) => sum + Math.max(0, q), 0);
}

function rmsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(sum / count);
}

function fraction<T>(
  values: readonly T[],
  predicate: (value: T, index: number) => boolean,
): number {
  if (values.length === 0) return 0;
  return values.filter((value, index) => predicate(value, index)).length / values.length;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
