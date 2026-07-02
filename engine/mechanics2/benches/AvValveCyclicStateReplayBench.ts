import {
  DEFAULT_ATRIAL_FIBER_CHAMBER_PARAMS_V1,
  initialAtrialFiberChamberStateV1,
  stepAtrialFiberChamberV1,
  type AtrialFiberChamberIdV1,
  type AtrialFiberChamberOutputV1,
} from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
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
  type FlowStateValveParamsV1,
  type FlowStateValveStateV1,
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

export const AV_VALVE_CYCLIC_STATE_REPLAY_REPORT_ID_V1 =
  "av-valve-cyclic-state-replay-report-v1" as const;

type ValveSideV1 = "MV" | "TV";

type CyclicReplayVariantIdV1 =
  | "zero-state-current-pressure"
  | "cyclic-current-pressure"
  | "cyclic-source-open-memory";

type CyclicReplayVariantV1 = {
  readonly variantId: CyclicReplayVariantIdV1;
  readonly description: string;
  readonly cycles: number;
  readonly useSourceOpenMemory: boolean;
};

type CyclicReplayRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly valveSide: ValveSideV1;
  readonly sourcePointId: string;
  readonly variantId: CyclicReplayVariantIdV1;
  readonly currentForwardPeakCount: number;
  readonly replayForwardPeakCount: number;
  readonly replayC1ContinuityScore: number;
  readonly replayToCurrentForwardVolumeRatio: number;
  readonly qRmsDeltaMlPerSec: number;
  readonly activePulsePeak01: number;
  readonly activePressurePeakMmHg: number;
  readonly sourceStatePeak01: number;
  readonly cyclicStateDeltaNorm: number;
  readonly gradientSignMismatchFraction: number;
  readonly adverseGradientDuringForwardFlowFraction: number;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type CyclicReplayVariantSummaryV1 = {
  readonly variantId: CyclicReplayVariantIdV1;
  readonly pass: number;
  readonly fail: number;
  readonly mvPass: number;
  readonly tvPass: number;
  readonly cleanShapeCount: number;
  readonly forwardVolumeParityCount: number;
  readonly meanQRmsDeltaMlPerSec: number;
  readonly maxCyclicStateDeltaNorm: number;
};

export type AvValveCyclicStateReplayReportV1 = {
  readonly reportId: typeof AV_VALVE_CYCLIC_STATE_REPLAY_REPORT_ID_V1;
  readonly gateId: "avValveCyclicStateReplayV1";
  readonly replayMode:
    "shadow-AV-valve-cyclic-accepted-state-replay-no-source-pressure-or-gradient-commit";
  readonly variants: readonly CyclicReplayVariantV1[];
  readonly rows: readonly CyclicReplayRowV1[];
  readonly variantSummaries: readonly CyclicReplayVariantSummaryV1[];
  readonly bestFixedVariant: CyclicReplayVariantSummaryV1;
  readonly summary: {
    readonly total: 14;
    readonly bestFixedVariantId: CyclicReplayVariantIdV1;
    readonly bestFixedPass: number;
    readonly bestFixedMvPass: number;
    readonly bestFixedTvPass: number;
    readonly bestFixedCleanShapeCount: number;
    readonly bestFixedForwardVolumeParityCount: number;
    readonly zeroStatePass: number;
    readonly zeroStateCleanShapeCount: number;
  };
  readonly decision: {
    readonly avValveCyclicStateReplayStatus:
      | "av-valve-cyclic-state-replay-signal"
      | "av-valve-cyclic-state-replay-mixed"
      | "av-valve-cyclic-state-replay-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly sourcePressureCommit: false;
    readonly sourceGradientCommit: false;
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
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

const VARIANTS: readonly CyclicReplayVariantV1[] = [
  {
    variantId: "zero-state-current-pressure",
    description: "Reference replay of the final beat from zero valve state using current pressures.",
    cycles: 1,
    useSourceOpenMemory: false,
  },
  {
    variantId: "cyclic-current-pressure",
    description: "Replay the same final-beat pressure waveform for repeated cycles so valve q/open state can converge before scoring.",
    cycles: 8,
    useSourceOpenMemory: false,
  },
  {
    variantId: "cyclic-source-open-memory",
    description: "Cyclic replay plus the selected atrial source-open-memory valve-state ownership from the mixed source-state signal.",
    cycles: 8,
    useSourceOpenMemory: true,
  },
];

export function runAvValveCyclicStateReplayBenchV1(): AvValveCyclicStateReplayReportV1 {
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
    return VARIANTS.flatMap((variant) => [
      replayMv(profile.profileId, left, leftRun.finalBeatSamples, variant),
      replayTv(profile.profileId, right, rightRun.finalBeatSamples, variant),
    ]);
  });
  const variantSummaries = VARIANTS.map((variant) => summarizeRows(
    variant.variantId,
    rows.filter((row) => row.variantId === variant.variantId),
  ));
  const bestFixedVariant = [...variantSummaries].sort(compareVariantSummaries)[0]!;
  const zeroState = variantSummaries.find((summary) => summary.variantId === "zero-state-current-pressure")!;
  const status = bestFixedVariant.pass === 14
    ? "av-valve-cyclic-state-replay-signal"
    : bestFixedVariant.pass > zeroState.pass || bestFixedVariant.cleanShapeCount > zeroState.cleanShapeCount
      ? "av-valve-cyclic-state-replay-mixed"
      : "av-valve-cyclic-state-replay-blocked";
  return {
    reportId: AV_VALVE_CYCLIC_STATE_REPLAY_REPORT_ID_V1,
    gateId: "avValveCyclicStateReplayV1",
    replayMode: "shadow-AV-valve-cyclic-accepted-state-replay-no-source-pressure-or-gradient-commit",
    variants: VARIANTS,
    rows,
    variantSummaries,
    bestFixedVariant,
    summary: {
      total: 14,
      bestFixedVariantId: bestFixedVariant.variantId,
      bestFixedPass: bestFixedVariant.pass,
      bestFixedMvPass: bestFixedVariant.mvPass,
      bestFixedTvPass: bestFixedVariant.tvPass,
      bestFixedCleanShapeCount: bestFixedVariant.cleanShapeCount,
      bestFixedForwardVolumeParityCount: bestFixedVariant.forwardVolumeParityCount,
      zeroStatePass: zeroState.pass,
      zeroStateCleanShapeCount: zeroState.cleanShapeCount,
    },
    decision: {
      avValveCyclicStateReplayStatus: status,
      nextAction: nextActionFor(status, bestFixedVariant, zeroState),
      blockedClaims: [
        "source-pressure-commit",
        "source-gradient-commit",
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      sourcePressureCommit: false,
      sourceGradientCommit: false,
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      LandAtrialUnlock: false,
    },
  };
}

function replayMv(
  profileId: FourChamberSubsystemProfileIdV1,
  params: LeftHeartSubsystemParamsV2,
  samples: readonly LeftHeartSubsystemSampleV2[],
  variant: CyclicReplayVariantV1,
): CyclicReplayRowV1 {
  const atrialOutputs = atrialOutputsFor("LA", samples.map((sample) => ({
    tSec: sample.tSec,
    theta: sample.theta,
    volumeMl: sample.acceptedLaVolumeMl,
  })), 0.76, 60 / params.heartRateBpm, 1 / params.sampleRateHz);
  const currentQ = samples.map((sample) => sample.qMvMlPerSec);
  const replay = replayCyclic(samples, (sample, index) => ({
    upstreamPressureMmHg: sample.lapMmHg,
    downstreamPressureMmHg: sample.lvpMmHg,
    currentPressureGradientMmHg: sample.lapMmHg - sample.lvpMmHg,
    currentQ: sample.qMvMlPerSec,
    activePulse01: activePulse01For(atrialOutputs[index]!, 11)
      * raisedCosineWindow(sample.theta, params.laAWaveStartTheta, params.laAWaveEndTheta),
    closureDrive01: mvClosureDrive01(sample.theta, params),
  }), params.mv, 1 / params.sampleRateHz, variant);
  return rowForReplay({
    profileId,
    valveSide: "MV",
    sourcePointId: params.fixtureId,
    variantId: variant.variantId,
    currentQ,
    replayQ: replay.q,
    activePulsePeak01: Math.max(...atrialOutputs.map((output, index) =>
      activePulse01For(output, 11) * raisedCosineWindow(samples[index]!.theta, params.laAWaveStartTheta, params.laAWaveEndTheta)
    )),
    activePressurePeakMmHg: Math.max(...atrialOutputs.map((output) => output.activePressureMmHg)),
    currentGradient: replay.currentGradient,
    replayGradient: replay.replayGradient,
    sourceState: replay.sourceState,
    cyclicStateDeltaNorm: replay.cyclicStateDeltaNorm,
  });
}

function replayTv(
  profileId: FourChamberSubsystemProfileIdV1,
  params: RightHeartSubsystemParamsV2,
  samples: readonly RightHeartSubsystemSampleV2[],
  variant: CyclicReplayVariantV1,
): CyclicReplayRowV1 {
  const atrialOutputs = atrialOutputsFor("RA", samples.map((sample) => ({
    tSec: sample.tSec,
    theta: sample.theta,
    volumeMl: sample.acceptedRaVolumeMl,
  })), 0.74, 60 / params.heartRateBpm, 1 / params.sampleRateHz);
  const currentQ = samples.map((sample) => sample.qTvMlPerSec);
  const replay = replayCyclic(samples, (sample, index) => ({
    upstreamPressureMmHg: sample.rapMmHg,
    downstreamPressureMmHg: sample.rvpMmHg,
    currentPressureGradientMmHg: sample.rapMmHg - sample.rvpMmHg,
    currentQ: sample.qTvMlPerSec,
    activePulse01: activePulse01For(atrialOutputs[index]!, 3.2)
      * raisedCosineWindow(sample.theta, params.raAWaveStartTheta, params.raAWaveEndTheta),
    closureDrive01: tvClosureDrive01(sample.theta, params),
  }), params.tv, 1 / params.sampleRateHz, variant);
  return rowForReplay({
    profileId,
    valveSide: "TV",
    sourcePointId: params.fixtureId,
    variantId: variant.variantId,
    currentQ,
    replayQ: replay.q,
    activePulsePeak01: Math.max(...atrialOutputs.map((output, index) =>
      activePulse01For(output, 3.2) * raisedCosineWindow(samples[index]!.theta, params.raAWaveStartTheta, params.raAWaveEndTheta)
    )),
    activePressurePeakMmHg: Math.max(...atrialOutputs.map((output) => output.activePressureMmHg)),
    currentGradient: replay.currentGradient,
    replayGradient: replay.replayGradient,
    sourceState: replay.sourceState,
    cyclicStateDeltaNorm: replay.cyclicStateDeltaNorm,
  });
}

function replayCyclic<TSample>(
  samples: readonly TSample[],
  inputForSample: (sample: TSample, index: number) => {
    readonly upstreamPressureMmHg: number;
    readonly downstreamPressureMmHg: number;
    readonly currentPressureGradientMmHg: number;
    readonly currentQ: number;
    readonly activePulse01: number;
    readonly closureDrive01: number;
  },
  valveParams: FlowStateValveParamsV1,
  dtSec: number,
  variant: CyclicReplayVariantV1,
): {
  readonly q: readonly number[];
  readonly currentGradient: readonly number[];
  readonly replayGradient: readonly number[];
  readonly sourceState: readonly number[];
  readonly cyclicStateDeltaNorm: number;
} {
  let state = initialFlowStateValveStateV1();
  let sourceState01 = 0;
  let firstCycleStart = state;
  let finalCycleStart = state;
  let finalCycleEnd = state;
  let finalSourceStart = sourceState01;
  let finalSourceEnd = sourceState01;
  let finalQ: number[] = [];
  let finalCurrentGradient: number[] = [];
  let finalReplayGradient: number[] = [];
  let finalSourceState: number[] = [];
  for (let cycle = 0; cycle < variant.cycles; cycle++) {
    if (cycle === 0) firstCycleStart = state;
    if (cycle === variant.cycles - 1) {
      finalCycleStart = state;
      finalSourceStart = sourceState01;
      finalQ = [];
      finalCurrentGradient = [];
      finalReplayGradient = [];
      finalSourceState = [];
    }
    for (let i = 0; i < samples.length; i++) {
      const input = inputForSample(samples[i]!, i);
      sourceState01 = nextSourceState01(sourceState01, input.activePulse01, dtSec);
      const modifiedParams = variant.useSourceOpenMemory
        ? sourceOpenMemoryParams(valveParams, sourceState01)
        : valveParams;
      const closureDrive01 = variant.useSourceOpenMemory
        ? clamp01(input.closureDrive01 * (1 - 0.45 * sourceState01))
        : input.closureDrive01;
      const output = stepFlowStateValveV1(state, {
        dtSec,
        upstreamPressureMmHg: input.upstreamPressureMmHg,
        downstreamPressureMmHg: input.downstreamPressureMmHg,
        closureDrive01,
      }, modifiedParams);
      state = output.state;
      if (cycle === variant.cycles - 1) {
        finalQ.push(output.qMlPerSec);
        finalCurrentGradient.push(input.currentPressureGradientMmHg);
        finalReplayGradient.push(output.pressureGradientMmHg);
        finalSourceState.push(sourceState01);
      }
    }
    if (cycle === variant.cycles - 1) {
      finalCycleEnd = state;
      finalSourceEnd = sourceState01;
    }
  }
  const startState = variant.cycles === 1 ? firstCycleStart : finalCycleStart;
  const cyclicStateDeltaNorm = Math.abs(finalCycleEnd.qMlPerSec - startState.qMlPerSec) / 100
    + Math.abs(finalCycleEnd.open01 - startState.open01)
    + Math.abs(finalSourceEnd - finalSourceStart);
  return {
    q: finalQ,
    currentGradient: finalCurrentGradient,
    replayGradient: finalReplayGradient,
    sourceState: finalSourceState,
    cyclicStateDeltaNorm: round(cyclicStateDeltaNorm),
  };
}

function sourceOpenMemoryParams(
  params: FlowStateValveParamsV1,
  sourceState01: number,
): FlowStateValveParamsV1 {
  return {
    ...params,
    resistanceMmHgSecPerMl: params.resistanceMmHgSecPerMl * Math.max(0.35, 1 - 0.18 * sourceState01),
    bernoulliMmHgSec2PerMl2: params.bernoulliMmHgSec2PerMl2 * Math.max(0.35, 1 - 0.18 * sourceState01),
    inertanceMmHgSec2PerMl: params.inertanceMmHgSec2PerMl * Math.max(0.35, 1 - 0.10 * sourceState01),
    openThresholdMmHg: params.openThresholdMmHg - 0.08 * sourceState01,
    tauCloseSec: params.tauCloseSec * (1 + 1.2 * sourceState01),
  };
}

function rowForReplay(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly valveSide: ValveSideV1;
  readonly sourcePointId: string;
  readonly variantId: CyclicReplayVariantIdV1;
  readonly currentQ: readonly number[];
  readonly replayQ: readonly number[];
  readonly activePulsePeak01: number;
  readonly activePressurePeakMmHg: number;
  readonly currentGradient: readonly number[];
  readonly replayGradient: readonly number[];
  readonly sourceState: readonly number[];
  readonly cyclicStateDeltaNorm: number;
}): CyclicReplayRowV1 {
  const replayShape = computeShapeQualityMetricsV1(input.replayQ);
  const currentForward = forwardFlowVolume(input.currentQ);
  const replayForward = forwardFlowVolume(input.replayQ);
  const currentPeaks = positivePeakCount(input.currentQ);
  const replayPeaks = positivePeakCount(input.replayQ);
  const gradientSignMismatchFraction = fraction(input.currentGradient, (_, index) =>
    Math.sign(input.currentGradient[index] ?? 0) !== Math.sign(input.replayGradient[index] ?? 0)
    && Math.abs(input.currentGradient[index] ?? 0) > 0.1
    && Math.abs(input.replayGradient[index] ?? 0) > 0.1
  );
  const adverseGradientDuringForwardFlowFraction = fraction(input.replayQ, (q, index) =>
    q > 5 && (input.replayGradient[index] ?? 0) < -0.2
  );
  const base = {
    profileId: input.profileId,
    valveSide: input.valveSide,
    sourcePointId: input.sourcePointId,
    variantId: input.variantId,
    currentForwardPeakCount: currentPeaks,
    replayForwardPeakCount: replayPeaks,
    replayC1ContinuityScore: round(replayShape.c1ContinuityScore),
    replayToCurrentForwardVolumeRatio: round(replayForward / Math.max(currentForward, 1e-9)),
    qRmsDeltaMlPerSec: round(rmsDelta(input.currentQ, input.replayQ)),
    activePulsePeak01: round(input.activePulsePeak01),
    activePressurePeakMmHg: round(input.activePressurePeakMmHg),
    sourceStatePeak01: round(Math.max(...input.sourceState, 0)),
    cyclicStateDeltaNorm: input.cyclicStateDeltaNorm,
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
  row: Omit<CyclicReplayRowV1, "status" | "failureReasons">,
): readonly string[] {
  const failures: string[] = [];
  if (row.currentForwardPeakCount === 2 && row.replayForwardPeakCount !== 2) {
    failures.push("cyclic-replay-av-flow-not-biphasic");
  }
  if (row.replayC1ContinuityScore > 0.42) failures.push("cyclic-replay-av-flow-c1-kink");
  if (row.replayToCurrentForwardVolumeRatio < 0.96 || row.replayToCurrentForwardVolumeRatio > 1.04) {
    failures.push("cyclic-replay-forward-volume-ratio-wide");
  }
  if (row.gradientSignMismatchFraction > 0.08) failures.push("cyclic-replay-gradient-sign-mismatch");
  if (row.adverseGradientDuringForwardFlowFraction > 0.02) {
    failures.push("cyclic-replay-adverse-gradient-during-forward-flow");
  }
  if (row.cyclicStateDeltaNorm > 0.18) failures.push("cyclic-valve-state-not-periodic");
  return failures;
}

function summarizeRows(
  variantId: CyclicReplayVariantIdV1,
  rows: readonly CyclicReplayRowV1[],
): CyclicReplayVariantSummaryV1 {
  return {
    variantId,
    pass: rows.filter((row) => row.status === "pass").length,
    fail: rows.filter((row) => row.status === "fail").length,
    mvPass: rows.filter((row) => row.valveSide === "MV" && row.status === "pass").length,
    tvPass: rows.filter((row) => row.valveSide === "TV" && row.status === "pass").length,
    cleanShapeCount: rows.filter((row) =>
      row.replayForwardPeakCount === 2 && row.replayC1ContinuityScore <= 0.42
    ).length,
    forwardVolumeParityCount: rows.filter((row) =>
      row.replayToCurrentForwardVolumeRatio >= 0.96
      && row.replayToCurrentForwardVolumeRatio <= 1.04
    ).length,
    meanQRmsDeltaMlPerSec: round(mean(rows.map((row) => row.qRmsDeltaMlPerSec))),
    maxCyclicStateDeltaNorm: round(Math.max(...rows.map((row) => row.cyclicStateDeltaNorm))),
  };
}

function compareVariantSummaries(
  a: CyclicReplayVariantSummaryV1,
  b: CyclicReplayVariantSummaryV1,
): number {
  return b.pass - a.pass
    || b.cleanShapeCount - a.cleanShapeCount
    || b.forwardVolumeParityCount - a.forwardVolumeParityCount
    || a.meanQRmsDeltaMlPerSec - b.meanQRmsDeltaMlPerSec
    || a.maxCyclicStateDeltaNorm - b.maxCyclicStateDeltaNorm;
}

function nextActionFor(
  status: AvValveCyclicStateReplayReportV1["decision"]["avValveCyclicStateReplayStatus"],
  best: CyclicReplayVariantSummaryV1,
  zero: CyclicReplayVariantSummaryV1,
): string {
  if (status === "av-valve-cyclic-state-replay-signal") {
    return "Use cyclic accepted valve-state carryover as a shadow signal for the next same-step source/valve/chamber transaction. Keep pressure/gradient commit, runtime, AV-plane, and LandAtrial blocked.";
  }
  if (status === "av-valve-cyclic-state-replay-mixed") {
    return `Cyclic valve-state carryover improves replay over zero-state reference (${best.pass}/${zero.pass} pass; ${best.cleanShapeCount}/${zero.cleanShapeCount} clean-shape) but remains incomplete. Next classify remaining side/profile residuals before transaction promotion.`;
  }
  return "Cyclic valve-state carryover does not improve enough. Revisit same-step valve/chamber residual ownership rather than source-pressure or AV-plane work.";
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

function nextSourceState01(previous: number, activePulse01: number, dtSec: number): number {
  const target = clamp(activePulse01, 0, 1.4);
  const tau = target > previous ? 0.016 : 0.070;
  return clamp(previous + (target - previous) * dtSec / Math.max(tau, 1e-6), 0, 1.6);
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

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
