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

export const AV_VALVE_SOURCE_STATE_CONTRACT_SHADOW_REPORT_ID_V1 =
  "av-valve-source-state-contract-shadow-report-v1" as const;

type ValveSideV1 = "MV" | "TV";

type SourceStateVariantIdV1 =
  | "current-pressure-control"
  | "source-open-memory"
  | "source-loss-damping"
  | "source-balanced-memory";

type SourceStateVariantV1 = {
  readonly variantId: SourceStateVariantIdV1;
  readonly description: string;
  readonly sourceRiseTauSec: number;
  readonly sourceFallTauSec: number;
  readonly openMemoryGain01: number;
  readonly closureDampingGain01: number;
  readonly lossDampingGain01: number;
  readonly inertanceDampingGain01: number;
  readonly openThresholdReliefMmHg: number;
  readonly closeTauMemoryGain01: number;
};

type ValveSourceStateShadowRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly valveSide: ValveSideV1;
  readonly sourcePointId: string;
  readonly variantId: SourceStateVariantIdV1;
  readonly currentForwardPeakCount: number;
  readonly shadowForwardPeakCount: number;
  readonly shadowC1ContinuityScore: number;
  readonly shadowToCurrentForwardVolumeRatio: number;
  readonly qRmsDeltaMlPerSec: number;
  readonly activePulsePeak01: number;
  readonly activePressurePeakMmHg: number;
  readonly sourceStatePeak01: number;
  readonly sourceStateDutyFraction: number;
  readonly maxOpenDelta01: number;
  readonly maxClosureDriveDelta01: number;
  readonly maxLossScale: number;
  readonly gradientSignMismatchFraction: number;
  readonly adverseGradientDuringForwardFlowFraction: number;
  readonly score: number;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: SourceStateVariantIdV1;
  readonly pass: number;
  readonly fail: number;
  readonly mvPass: number;
  readonly tvPass: number;
  readonly cleanShapeCount: number;
  readonly forwardVolumeParityCount: number;
  readonly meanQRmsDeltaMlPerSec: number;
  readonly maxAdverseGradientDuringForwardFlowFraction: number;
  readonly maxSourceStateDutyFraction: number;
  readonly maxLossScale: number;
};

type OracleCeilingSummaryV1 = Omit<VariantSummaryV1, "variantId"> & {
  readonly variantId: "per-row-oracle-ceiling";
};

export type AvValveSourceStateContractShadowReportV1 = {
  readonly reportId: typeof AV_VALVE_SOURCE_STATE_CONTRACT_SHADOW_REPORT_ID_V1;
  readonly gateId: "avValveSourceStateContractShadowV1";
  readonly upstreamAtrialShadow: {
    readonly requiredStatus: "atrial-fiber-source-reservoir-shadow-replay-signal";
    readonly observedStatus: "atrial-fiber-source-reservoir-shadow-replay-signal";
    readonly referenceMode: "prior-committed-artifact-not-rerun";
    readonly pass: number;
    readonly finiteBoundedCount: number;
  };
  readonly directGradientReference: {
    readonly requiredBlockedStatus: "av-valve-atrial-gradient-shadow-blocked";
    readonly observedStatus: "av-valve-atrial-gradient-shadow-blocked";
    readonly referenceMode: "prior-committed-artifact-not-rerun";
    readonly pass: number;
    readonly cleanShapeCount: number;
    readonly forwardVolumeParityCount: number;
  };
  readonly replayMode:
    "shadow-AV-valve-source-state-contract-no-source-pressure-or-gradient-commit";
  readonly variants: readonly SourceStateVariantV1[];
  readonly rows: readonly ValveSourceStateShadowRowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestFixedVariant: VariantSummaryV1;
  readonly oracleCeilingSummary: OracleCeilingSummaryV1;
  readonly summary: {
    readonly total: 14;
    readonly bestFixedVariantId: SourceStateVariantIdV1;
    readonly bestFixedPass: number;
    readonly bestFixedFail: number;
    readonly bestFixedMvPass: number;
    readonly bestFixedTvPass: number;
    readonly bestFixedCleanShapeCount: number;
    readonly bestFixedForwardVolumeParityCount: number;
    readonly oraclePass: number;
    readonly directGradientPass: number;
    readonly directGradientCleanShapeCount: number;
    readonly directGradientForwardVolumeParityCount: number;
  };
  readonly decision: {
    readonly avValveSourceStateContractShadowStatus:
      | "av-valve-source-state-contract-shadow-signal"
      | "av-valve-source-state-contract-shadow-mixed"
      | "av-valve-source-state-contract-shadow-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly sourcePressureCommit: false;
    readonly sourceGradientCommit: false;
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

const VARIANTS: readonly SourceStateVariantV1[] = [
  {
    variantId: "current-pressure-control",
    description: "Replay current atrial and ventricular pressures through the valve state law with no atrial fiber source-state coupling.",
    sourceRiseTauSec: 0.018,
    sourceFallTauSec: 0.050,
    openMemoryGain01: 0,
    closureDampingGain01: 0,
    lossDampingGain01: 0,
    inertanceDampingGain01: 0,
    openThresholdReliefMmHg: 0,
    closeTauMemoryGain01: 0,
  },
  {
    variantId: "source-open-memory",
    description: "Atrial active source state supports valve area memory during the A-window without changing atrial pressure or pressure gradient.",
    sourceRiseTauSec: 0.016,
    sourceFallTauSec: 0.070,
    openMemoryGain01: 0.45,
    closureDampingGain01: 0,
    lossDampingGain01: -0.18,
    inertanceDampingGain01: -0.10,
    openThresholdReliefMmHg: 0.08,
    closeTauMemoryGain01: 1.20,
  },
  {
    variantId: "source-loss-damping",
    description: "Atrial active source state increases valve loss and closure damping while preserving the baseline pressure gradient.",
    sourceRiseTauSec: 0.018,
    sourceFallTauSec: 0.060,
    openMemoryGain01: 0,
    closureDampingGain01: 0.35,
    lossDampingGain01: 1.40,
    inertanceDampingGain01: 0.35,
    openThresholdReliefMmHg: 0,
    closeTauMemoryGain01: 0,
  },
  {
    variantId: "source-balanced-memory",
    description: "Atrial active source state supports late valve area memory but turns into loss damping when forward flow coasts against an adverse gradient.",
    sourceRiseTauSec: 0.014,
    sourceFallTauSec: 0.080,
    openMemoryGain01: 0.35,
    closureDampingGain01: 0.16,
    lossDampingGain01: 1.10,
    inertanceDampingGain01: 0.25,
    openThresholdReliefMmHg: 0.05,
    closeTauMemoryGain01: 0.90,
  },
];

export function runAvValveSourceStateContractShadowBenchV1():
AvValveSourceStateContractShadowReportV1 {
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
  const oracleRows = PROFILE_MAP.flatMap((profile) =>
    (["MV", "TV"] as const).map((valveSide) => bestRowFor(
      rows.filter((row) => row.profileId === profile.profileId && row.valveSide === valveSide),
    ))
  );
  const oracleBase = summarizeRows("current-pressure-control", oracleRows);
  const oracleCeilingSummary = {
    ...oracleBase,
    variantId: "per-row-oracle-ceiling" as const,
  };
  const directGradientSummary = {
    pass: 0,
    cleanShapeCount: 1,
    forwardVolumeParityCount: 4,
  };
  const decisionStatus = bestFixedVariant.pass === 14
    ? "av-valve-source-state-contract-shadow-signal"
    : (
      bestFixedVariant.pass > directGradientSummary.pass
      || bestFixedVariant.cleanShapeCount >= directGradientSummary.cleanShapeCount + 4
    )
      ? "av-valve-source-state-contract-shadow-mixed"
      : "av-valve-source-state-contract-shadow-blocked";
  return {
    reportId: AV_VALVE_SOURCE_STATE_CONTRACT_SHADOW_REPORT_ID_V1,
    gateId: "avValveSourceStateContractShadowV1",
    upstreamAtrialShadow: {
      requiredStatus: "atrial-fiber-source-reservoir-shadow-replay-signal",
      observedStatus: "atrial-fiber-source-reservoir-shadow-replay-signal",
      referenceMode: "prior-committed-artifact-not-rerun",
      pass: 14,
      finiteBoundedCount: 14,
    },
    directGradientReference: {
      requiredBlockedStatus: "av-valve-atrial-gradient-shadow-blocked",
      observedStatus: "av-valve-atrial-gradient-shadow-blocked",
      referenceMode: "prior-committed-artifact-not-rerun",
      pass: directGradientSummary.pass,
      cleanShapeCount: directGradientSummary.cleanShapeCount,
      forwardVolumeParityCount: directGradientSummary.forwardVolumeParityCount,
    },
    replayMode: "shadow-AV-valve-source-state-contract-no-source-pressure-or-gradient-commit",
    variants: VARIANTS,
    rows,
    variantSummaries,
    bestFixedVariant,
    oracleCeilingSummary,
    summary: {
      total: 14,
      bestFixedVariantId: bestFixedVariant.variantId,
      bestFixedPass: bestFixedVariant.pass,
      bestFixedFail: bestFixedVariant.fail,
      bestFixedMvPass: bestFixedVariant.mvPass,
      bestFixedTvPass: bestFixedVariant.tvPass,
      bestFixedCleanShapeCount: bestFixedVariant.cleanShapeCount,
      bestFixedForwardVolumeParityCount: bestFixedVariant.forwardVolumeParityCount,
      oraclePass: oracleCeilingSummary.pass,
      directGradientPass: directGradientSummary.pass,
      directGradientCleanShapeCount: directGradientSummary.cleanShapeCount,
      directGradientForwardVolumeParityCount: directGradientSummary.forwardVolumeParityCount,
    },
    decision: {
      avValveSourceStateContractShadowStatus: decisionStatus,
      nextAction: nextActionFor(decisionStatus, bestFixedVariant, directGradientSummary),
      blockedClaims: [
        "source-pressure-commit",
        "source-gradient-commit",
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      sourcePressureCommit: false,
      sourceGradientCommit: false,
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
  variant: SourceStateVariantV1,
): ValveSourceStateShadowRowV1 {
  const atrialOutputs = atrialOutputsFor("LA", samples.map((sample) => ({
    tSec: sample.tSec,
    theta: sample.theta,
    volumeMl: sample.acceptedLaVolumeMl,
  })), 0.76, 60 / params.heartRateBpm, 1 / params.sampleRateHz);
  const currentQ = samples.map((sample) => sample.qMvMlPerSec);
  const replay = replayValveSourceState(samples, (sample, index) => {
    const activePulse01 = activePulse01For(atrialOutputs[index]!, 11)
      * raisedCosineWindow(sample.theta, params.laAWaveStartTheta, params.laAWaveEndTheta);
    return {
      upstreamPressureMmHg: sample.lapMmHg,
      downstreamPressureMmHg: sample.lvpMmHg,
      currentPressureGradientMmHg: sample.lapMmHg - sample.lvpMmHg,
      currentQ: sample.qMvMlPerSec,
      activePulse01,
      closureDrive01: mvClosureDrive01(sample.theta, params),
    };
  }, params.mv, 1 / params.sampleRateHz, variant);
  return rowForReplay({
    profileId,
    valveSide: "MV",
    sourcePointId: params.fixtureId,
    variantId: variant.variantId,
    currentQ,
    shadowQ: replay.q,
    activePulsePeak01: Math.max(...atrialOutputs.map((output, index) =>
      activePulse01For(output, 11) * raisedCosineWindow(samples[index]!.theta, params.laAWaveStartTheta, params.laAWaveEndTheta)
    )),
    activePressurePeakMmHg: Math.max(...atrialOutputs.map((output) => output.activePressureMmHg)),
    currentGradient: replay.currentGradient,
    shadowGradient: replay.shadowGradient,
    sourceState: replay.sourceState,
    openDelta01: replay.openDelta01,
    closureDriveDelta01: replay.closureDriveDelta01,
    lossScale: replay.lossScale,
  });
}

function replayTv(
  profileId: FourChamberSubsystemProfileIdV1,
  params: RightHeartSubsystemParamsV2,
  samples: readonly RightHeartSubsystemSampleV2[],
  variant: SourceStateVariantV1,
): ValveSourceStateShadowRowV1 {
  const atrialOutputs = atrialOutputsFor("RA", samples.map((sample) => ({
    tSec: sample.tSec,
    theta: sample.theta,
    volumeMl: sample.acceptedRaVolumeMl,
  })), 0.74, 60 / params.heartRateBpm, 1 / params.sampleRateHz);
  const currentQ = samples.map((sample) => sample.qTvMlPerSec);
  const replay = replayValveSourceState(samples, (sample, index) => {
    const activePulse01 = activePulse01For(atrialOutputs[index]!, 3.2)
      * raisedCosineWindow(sample.theta, params.raAWaveStartTheta, params.raAWaveEndTheta);
    return {
      upstreamPressureMmHg: sample.rapMmHg,
      downstreamPressureMmHg: sample.rvpMmHg,
      currentPressureGradientMmHg: sample.rapMmHg - sample.rvpMmHg,
      currentQ: sample.qTvMlPerSec,
      activePulse01,
      closureDrive01: tvClosureDrive01(sample.theta, params),
    };
  }, params.tv, 1 / params.sampleRateHz, variant);
  return rowForReplay({
    profileId,
    valveSide: "TV",
    sourcePointId: params.fixtureId,
    variantId: variant.variantId,
    currentQ,
    shadowQ: replay.q,
    activePulsePeak01: Math.max(...atrialOutputs.map((output, index) =>
      activePulse01For(output, 3.2) * raisedCosineWindow(samples[index]!.theta, params.raAWaveStartTheta, params.raAWaveEndTheta)
    )),
    activePressurePeakMmHg: Math.max(...atrialOutputs.map((output) => output.activePressureMmHg)),
    currentGradient: replay.currentGradient,
    shadowGradient: replay.shadowGradient,
    sourceState: replay.sourceState,
    openDelta01: replay.openDelta01,
    closureDriveDelta01: replay.closureDriveDelta01,
    lossScale: replay.lossScale,
  });
}

function replayValveSourceState<TSample>(
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
  variant: SourceStateVariantV1,
): {
  readonly q: readonly number[];
  readonly currentGradient: readonly number[];
  readonly shadowGradient: readonly number[];
  readonly sourceState: readonly number[];
  readonly openDelta01: readonly number[];
  readonly closureDriveDelta01: readonly number[];
  readonly lossScale: readonly number[];
} {
  let state = initialFlowStateValveStateV1();
  let sourceState01 = 0;
  const q: number[] = [];
  const currentGradient: number[] = [];
  const shadowGradient: number[] = [];
  const sourceState: number[] = [];
  const openDelta01: number[] = [];
  const closureDriveDelta01: number[] = [];
  const lossScale: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    const input = inputForSample(samples[i]!, i);
    sourceState01 = nextSourceState01(sourceState01, input.activePulse01, dtSec, variant);
    const modifiers = valveStateModifiers(input, sourceState01, state, variant);
    const modifiedParams = paramsWithModifiers(valveParams, modifiers);
    const output = stepFlowStateValveV1(state, {
      dtSec,
      upstreamPressureMmHg: input.upstreamPressureMmHg,
      downstreamPressureMmHg: input.downstreamPressureMmHg,
      closureDrive01: modifiers.closureDrive01,
    }, modifiedParams);
    q.push(output.qMlPerSec);
    currentGradient.push(input.currentPressureGradientMmHg);
    shadowGradient.push(output.pressureGradientMmHg);
    sourceState.push(sourceState01);
    openDelta01.push(output.open01 - state.open01);
    closureDriveDelta01.push(modifiers.closureDrive01 - input.closureDrive01);
    lossScale.push(modifiers.lossScale);
    state = output.state;
  }
  return { q, currentGradient, shadowGradient, sourceState, openDelta01, closureDriveDelta01, lossScale };
}

function valveStateModifiers(
  input: {
    readonly currentPressureGradientMmHg: number;
    readonly currentQ: number;
    readonly closureDrive01: number;
  },
  sourceState01: number,
  previousValveState: FlowStateValveStateV1,
  variant: SourceStateVariantV1,
): {
  readonly closureDrive01: number;
  readonly lossScale: number;
  readonly inertanceScale: number;
  readonly openThresholdOffsetMmHg: number;
  readonly tauCloseScale: number;
} {
  const adverseForward01 = clamp01(previousValveState.qMlPerSec / 80)
    * clamp01((-input.currentPressureGradientMmHg - 0.08) / 1.8);
  const balancedDamping01 = variant.variantId === "source-balanced-memory"
    ? sourceState01 * adverseForward01
    : 0;
  const openMemory01 = sourceState01 * variant.openMemoryGain01 * (1 - balancedDamping01);
  const closureDamping01 = sourceState01 * variant.closureDampingGain01 + balancedDamping01;
  const closureDrive01 = clamp01(input.closureDrive01 * (1 - openMemory01) + closureDamping01);
  const lossScale = Math.max(0.25, 1 + sourceState01 * variant.lossDampingGain01 + 2.4 * balancedDamping01);
  const inertanceScale = Math.max(0.25, 1 + sourceState01 * variant.inertanceDampingGain01 + balancedDamping01);
  return {
    closureDrive01,
    lossScale,
    inertanceScale,
    openThresholdOffsetMmHg: -sourceState01 * variant.openThresholdReliefMmHg * (1 - balancedDamping01),
    tauCloseScale: 1 + sourceState01 * variant.closeTauMemoryGain01 * (1 - balancedDamping01),
  };
}

function paramsWithModifiers(
  params: FlowStateValveParamsV1,
  modifiers: {
    readonly lossScale: number;
    readonly inertanceScale: number;
    readonly openThresholdOffsetMmHg: number;
    readonly tauCloseScale: number;
  },
): FlowStateValveParamsV1 {
  return {
    ...params,
    resistanceMmHgSecPerMl: params.resistanceMmHgSecPerMl * modifiers.lossScale,
    bernoulliMmHgSec2PerMl2: params.bernoulliMmHgSec2PerMl2 * modifiers.lossScale,
    inertanceMmHgSec2PerMl: params.inertanceMmHgSec2PerMl * modifiers.inertanceScale,
    openThresholdMmHg: params.openThresholdMmHg + modifiers.openThresholdOffsetMmHg,
    tauCloseSec: params.tauCloseSec * modifiers.tauCloseScale,
  };
}

function nextSourceState01(
  previous: number,
  activePulse01: number,
  dtSec: number,
  variant: SourceStateVariantV1,
): number {
  const target = clamp(activePulse01, 0, 1.4);
  const tau = target > previous ? variant.sourceRiseTauSec : variant.sourceFallTauSec;
  const step = (target - previous) * dtSec / Math.max(tau, 1e-6);
  return clamp(previous + step, 0, 1.6);
}

function rowForReplay(input: {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly valveSide: ValveSideV1;
  readonly sourcePointId: string;
  readonly variantId: SourceStateVariantIdV1;
  readonly currentQ: readonly number[];
  readonly shadowQ: readonly number[];
  readonly activePulsePeak01: number;
  readonly activePressurePeakMmHg: number;
  readonly currentGradient: readonly number[];
  readonly shadowGradient: readonly number[];
  readonly sourceState: readonly number[];
  readonly openDelta01: readonly number[];
  readonly closureDriveDelta01: readonly number[];
  readonly lossScale: readonly number[];
}): ValveSourceStateShadowRowV1 {
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
    variantId: input.variantId,
    currentForwardPeakCount: currentPeaks,
    shadowForwardPeakCount: shadowPeaks,
    shadowC1ContinuityScore: round(shadowShape.c1ContinuityScore),
    shadowToCurrentForwardVolumeRatio: round(shadowForward / Math.max(currentForward, 1e-9)),
    qRmsDeltaMlPerSec: round(rmsDelta(input.currentQ, input.shadowQ)),
    activePulsePeak01: round(input.activePulsePeak01),
    activePressurePeakMmHg: round(input.activePressurePeakMmHg),
    sourceStatePeak01: round(Math.max(...input.sourceState)),
    sourceStateDutyFraction: round(fraction(input.sourceState, (value) => value > 0.05)),
    maxOpenDelta01: round(Math.max(...input.openDelta01.map((value) => Math.abs(value)))),
    maxClosureDriveDelta01: round(Math.max(...input.closureDriveDelta01.map((value) => Math.abs(value)))),
    maxLossScale: round(Math.max(...input.lossScale)),
    gradientSignMismatchFraction: round(gradientSignMismatchFraction),
    adverseGradientDuringForwardFlowFraction: round(adverseGradientDuringForwardFlowFraction),
  };
  const failureReasons = failureReasonsFor(base);
  return {
    ...base,
    score: rowScore(base, failureReasons),
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function failureReasonsFor(
  row: Omit<ValveSourceStateShadowRowV1, "score" | "status" | "failureReasons">,
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
  if (row.sourceStateDutyFraction > 0.40) failures.push("source-state-duty-dominant");
  if (row.maxLossScale > 3.2) failures.push("source-state-loss-scale-dominant");
  return failures;
}

function rowScore(
  row: Omit<ValveSourceStateShadowRowV1, "score" | "status" | "failureReasons">,
  failureReasons: readonly string[],
): number {
  return failureReasons.length * 100
    + Math.abs(Math.log(Math.max(row.shadowToCurrentForwardVolumeRatio, 1e-9))) * 12
    + row.shadowC1ContinuityScore * 4
    + row.adverseGradientDuringForwardFlowFraction * 20
    + row.qRmsDeltaMlPerSec / 30;
}

function summarizeRows(
  variantId: SourceStateVariantIdV1,
  rows: readonly ValveSourceStateShadowRowV1[],
): VariantSummaryV1 {
  return {
    variantId,
    pass: rows.filter((row) => row.status === "pass").length,
    fail: rows.filter((row) => row.status === "fail").length,
    mvPass: rows.filter((row) => row.valveSide === "MV" && row.status === "pass").length,
    tvPass: rows.filter((row) => row.valveSide === "TV" && row.status === "pass").length,
    cleanShapeCount: rows.filter((row) =>
      row.shadowForwardPeakCount === 2 && row.shadowC1ContinuityScore <= 0.42
    ).length,
    forwardVolumeParityCount: rows.filter((row) =>
      row.shadowToCurrentForwardVolumeRatio >= 0.96
      && row.shadowToCurrentForwardVolumeRatio <= 1.04
    ).length,
    meanQRmsDeltaMlPerSec: round(mean(rows.map((row) => row.qRmsDeltaMlPerSec))),
    maxAdverseGradientDuringForwardFlowFraction: round(Math.max(...rows.map((row) =>
      row.adverseGradientDuringForwardFlowFraction
    ))),
    maxSourceStateDutyFraction: round(Math.max(...rows.map((row) => row.sourceStateDutyFraction))),
    maxLossScale: round(Math.max(...rows.map((row) => row.maxLossScale))),
  };
}

function compareVariantSummaries(a: VariantSummaryV1, b: VariantSummaryV1): number {
  return b.pass - a.pass
    || b.cleanShapeCount - a.cleanShapeCount
    || b.forwardVolumeParityCount - a.forwardVolumeParityCount
    || a.meanQRmsDeltaMlPerSec - b.meanQRmsDeltaMlPerSec
    || a.maxAdverseGradientDuringForwardFlowFraction - b.maxAdverseGradientDuringForwardFlowFraction;
}

function bestRowFor(rows: readonly ValveSourceStateShadowRowV1[]): ValveSourceStateShadowRowV1 {
  return [...rows].sort((a, b) => a.score - b.score)[0]!;
}

function nextActionFor(
  status: AvValveSourceStateContractShadowReportV1["decision"]["avValveSourceStateContractShadowStatus"],
  best: VariantSummaryV1,
  directGradientSummary: {
    readonly pass: number;
    readonly cleanShapeCount: number;
  },
): string {
  if (status === "av-valve-source-state-contract-shadow-signal") {
    return "Treat the fixed valve/source state contract as a shadow-only candidate and next test it inside a same-step source/valve/chamber transaction. Keep runtime, AV-plane, and LandAtrial blocked.";
  }
  if (status === "av-valve-source-state-contract-shadow-mixed") {
    return `Keep source pressure/gradient commit blocked. The best fixed source-state variant improves over direct gradient injection (${best.pass}/${directGradientSummary.pass} pass; ${best.cleanShapeCount}/${directGradientSummary.cleanShapeCount} clean-shape), but residuals remain and need profile/side attribution before any transaction promotion.`;
  }
  return "Do not promote source-state ownership. The fixed source-state variants do not improve enough over blocked direct-gradient replay; keep AtrialFiber as readback only and design a deeper same-step source/valve/chamber contract.";
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
