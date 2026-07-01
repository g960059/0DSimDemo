import {
  initialOneFiberChamberStateV1,
  stepOneFiberChamberV1,
  type OneFiberChamberOutputV1,
  type OneFiberChamberParamsV1,
  type OneFiberChamberStateV1,
} from "@/engine/mechanics2/chamber/OneFiberChamberV1";
import {
  initialFlowStateValveStateV1,
  stepFlowStateValveV1,
  type FlowStateValveOutputV1,
  type FlowStateValveParamsV1,
  type FlowStateValveStateV1,
} from "@/engine/mechanics2/valve/FlowStateValveV1";
import {
  lerpV2,
  rootMeanSquareResidualV2,
  runMechanicsFixedPointTransactionV2,
  type MechanicsFixedPointIterationV2,
} from "@/engine/mechanics2/core/MechanicsTransactionV2";
import {
  defaultLeftHeartSubsystemParamsV1,
  type LeftHeartSubsystemParamsV1,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV1";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type LeftHeartTransactionModeV2 = "explicit-single" | "fixed-point";
export type LeftHeartVolumeSafetyModeV2 = "hard-clamp" | "soft-pressure";

export type LeftHeartSubsystemParamsV2 = LeftHeartSubsystemParamsV1 & {
  readonly transactionMode: LeftHeartTransactionModeV2;
  readonly transactionIterations: number;
  readonly transactionRelaxation: number;
  readonly transactionResidualToleranceMl: number;
  readonly volumeSafetyMode: LeftHeartVolumeSafetyModeV2;
  readonly absoluteMinLvVolumeMl: number;
  readonly absoluteMaxLvVolumeMl: number;
  readonly absoluteMinLaVolumeMl: number;
  readonly absoluteMaxLaVolumeMl: number;
  readonly lvSoftLimitGainMmHgPerMl: number;
  readonly laSoftLimitGainMmHgPerMl: number;
};

export type LeftHeartSubsystemStateV2 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly rootPressureMmHg: number;
  readonly lv: OneFiberChamberStateV1;
  readonly mv: FlowStateValveStateV1;
  readonly aov: FlowStateValveStateV1;
  readonly clampCount: number;
};

export type LeftHeartSubsystemSampleV2 = {
  readonly tSec: number;
  readonly beat: number;
  readonly theta: number;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly acceptedLaVolumeMl: number;
  readonly acceptedLvVolumeMl: number;
  readonly lvpMmHg: number;
  readonly lvpRawMmHg: number;
  readonly lvpSafetyMmHg: number;
  readonly lapMmHg: number;
  readonly lapRawMmHg: number;
  readonly lapSafetyMmHg: number;
  readonly rootPressureMmHg: number;
  readonly acceptedRootPressureMmHg: number;
  readonly qMvMlPerSec: number;
  readonly qAovMlPerSec: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly mvOpen01: number;
  readonly aovOpen01: number;
  readonly lvChamber: OneFiberChamberOutputV1;
  readonly mv: FlowStateValveOutputV1;
  readonly aov: FlowStateValveOutputV1;
  readonly rootOutflowMlPerSec: number;
  readonly massResidualMl: number;
  readonly transactionResidualNormMl: number;
  readonly transactionConverged01: 0 | 1;
  readonly transactionIterationsUsed: number;
  readonly volumeClampHit01: 0 | 1;
  readonly iterationLog: readonly MechanicsFixedPointIterationV2[];
};

export type LeftHeartSubsystemRunV2 = {
  readonly params: LeftHeartSubsystemParamsV2;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
  readonly finalBeatSamples: readonly LeftHeartSubsystemSampleV2[];
  readonly clampCount: number;
};

export type LeftHeartSubsystemParamsV2Overrides =
  Partial<Omit<LeftHeartSubsystemParamsV2, "lv" | "mv" | "aov">> & {
    readonly lv?: Partial<OneFiberChamberParamsV1>;
    readonly mv?: Partial<FlowStateValveParamsV1>;
    readonly aov?: Partial<FlowStateValveParamsV1>;
  };

type CandidateV2 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly rootPressureMmHg: number;
};

type AcceptedV2 = CandidateV2 & {
  readonly lvChamber: OneFiberChamberOutputV1;
  readonly mv: FlowStateValveOutputV1;
  readonly aov: FlowStateValveOutputV1;
  readonly lapRawMmHg: number;
  readonly lapSafetyMmHg: number;
  readonly lvpRawMmHg: number;
  readonly lvpSafetyMmHg: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly rootOutflowMlPerSec: number;
  readonly volumeClampHit01: 0 | 1;
};

export function defaultLeftHeartSubsystemParamsV2(
  overrides: LeftHeartSubsystemParamsV2Overrides = {},
): LeftHeartSubsystemParamsV2 {
  const base = defaultLeftHeartSubsystemParamsV1(overrides);
  return {
    ...base,
    transactionMode: overrides.transactionMode ?? "explicit-single",
    transactionIterations: overrides.transactionIterations ?? 1,
    transactionRelaxation: overrides.transactionRelaxation ?? 0.5,
    transactionResidualToleranceMl: overrides.transactionResidualToleranceMl ?? 0.02,
    volumeSafetyMode: overrides.volumeSafetyMode ?? "hard-clamp",
    absoluteMinLvVolumeMl: overrides.absoluteMinLvVolumeMl ?? 35,
    absoluteMaxLvVolumeMl: overrides.absoluteMaxLvVolumeMl ?? 240,
    absoluteMinLaVolumeMl: overrides.absoluteMinLaVolumeMl ?? 12,
    absoluteMaxLaVolumeMl: overrides.absoluteMaxLaVolumeMl ?? 180,
    lvSoftLimitGainMmHgPerMl: overrides.lvSoftLimitGainMmHgPerMl ?? 0.65,
    laSoftLimitGainMmHgPerMl: overrides.laSoftLimitGainMmHgPerMl ?? 0.35,
  };
}

export function runLeftHeartSubsystemV2(params: LeftHeartSubsystemParamsV2): LeftHeartSubsystemRunV2 {
  const cycleLengthSec = 60 / params.heartRateBpm;
  const dtSec = 1 / params.sampleRateHz;
  const sampleCount = Math.round(params.beats * cycleLengthSec * params.sampleRateHz);
  let state: LeftHeartSubsystemStateV2 = {
    laVolumeMl: params.initialLaVolumeMl,
    lvVolumeMl: params.initialLvVolumeMl,
    rootPressureMmHg: params.rootInitialPressureMmHg,
    lv: initialOneFiberChamberStateV1(params.initialLvVolumeMl, params.lv),
    mv: initialFlowStateValveStateV1(),
    aov: initialFlowStateValveStateV1(),
    clampCount: 0,
  };
  const samples: LeftHeartSubsystemSampleV2[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const tSec = i * dtSec;
    const beat = Math.floor(tSec / cycleLengthSec);
    const theta = (tSec - beat * cycleLengthSec) / cycleLengthSec;
    const activationTimeSec = beat * cycleLengthSec + 0.13 * cycleLengthSec;
    const previousVolumes = { laVolumeMl: state.laVolumeMl, lvVolumeMl: state.lvVolumeMl, rootPressureMmHg: state.rootPressureMmHg };
    const initialCandidate = previousVolumes;
    const result = runMechanicsFixedPointTransactionV2(
      initialCandidate,
      {
        iterations: params.transactionMode === "explicit-single" ? 1 : params.transactionIterations,
        relaxation: params.transactionRelaxation,
        residualTolerance: params.transactionResidualToleranceMl,
      },
      (candidate) => acceptLeftHeartCandidateV2({
        candidate,
        previous: previousVolumes,
        previousLvState: state.lv,
        previousMvState: state.mv,
        previousAovState: state.aov,
        tSec,
        dtSec,
        cycleLengthSec,
        activationTimeSec,
        theta,
        params,
      }),
      (candidate, accepted) => rootMeanSquareResidualV2([
        accepted.laVolumeMl - candidate.laVolumeMl,
        accepted.lvVolumeMl - candidate.lvVolumeMl,
        accepted.rootPressureMmHg - candidate.rootPressureMmHg,
      ]),
      (candidate, accepted, relaxation) => ({
        laVolumeMl: lerpV2(candidate.laVolumeMl, accepted.laVolumeMl, relaxation),
        lvVolumeMl: lerpV2(candidate.lvVolumeMl, accepted.lvVolumeMl, relaxation),
        rootPressureMmHg: lerpV2(candidate.rootPressureMmHg, accepted.rootPressureMmHg, relaxation),
      }),
    );
    const accepted = result.accepted;
    const massResidualMl =
      (accepted.lvVolumeMl - state.lvVolumeMl) - dtSec * (accepted.mv.qMlPerSec - accepted.aov.qMlPerSec)
      + (accepted.laVolumeMl - state.laVolumeMl) - dtSec * (accepted.qPulmonaryVenousMlPerSec - accepted.mv.qMlPerSec);
    samples.push({
      tSec,
      beat,
      theta,
      laVolumeMl: state.laVolumeMl,
      lvVolumeMl: state.lvVolumeMl,
      acceptedLaVolumeMl: accepted.laVolumeMl,
      acceptedLvVolumeMl: accepted.lvVolumeMl,
      lvpMmHg: accepted.lvpRawMmHg + accepted.lvpSafetyMmHg,
      lvpRawMmHg: accepted.lvpRawMmHg,
      lvpSafetyMmHg: accepted.lvpSafetyMmHg,
      lapMmHg: accepted.lapRawMmHg + accepted.lapSafetyMmHg,
      lapRawMmHg: accepted.lapRawMmHg,
      lapSafetyMmHg: accepted.lapSafetyMmHg,
      rootPressureMmHg: state.rootPressureMmHg,
      acceptedRootPressureMmHg: accepted.rootPressureMmHg,
      qMvMlPerSec: accepted.mv.qMlPerSec,
      qAovMlPerSec: accepted.aov.qMlPerSec,
      qPulmonaryVenousMlPerSec: accepted.qPulmonaryVenousMlPerSec,
      mvOpen01: accepted.mv.open01,
      aovOpen01: accepted.aov.open01,
      lvChamber: accepted.lvChamber,
      mv: accepted.mv,
      aov: accepted.aov,
      rootOutflowMlPerSec: accepted.rootOutflowMlPerSec,
      massResidualMl,
      transactionResidualNormMl: result.residualNorm,
      transactionConverged01: result.converged ? 1 : 0,
      transactionIterationsUsed: result.iterationsUsed,
      volumeClampHit01: accepted.volumeClampHit01,
      iterationLog: result.iterationLog,
    });
    state = {
      laVolumeMl: accepted.laVolumeMl,
      lvVolumeMl: accepted.lvVolumeMl,
      rootPressureMmHg: accepted.rootPressureMmHg,
      lv: accepted.lvChamber.state,
      mv: accepted.mv.state,
      aov: accepted.aov.state,
      clampCount: state.clampCount + accepted.volumeClampHit01,
    };
  }
  const finalBeat = params.beats - 2;
  const finalBeatSamples = samples.filter((sample) => sample.beat === finalBeat);
  return { params, samples, finalBeatSamples, clampCount: state.clampCount };
}

function acceptLeftHeartCandidateV2(input: {
  readonly candidate: CandidateV2;
  readonly previous: CandidateV2;
  readonly previousLvState: OneFiberChamberStateV1;
  readonly previousMvState: FlowStateValveStateV1;
  readonly previousAovState: FlowStateValveStateV1;
  readonly tSec: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly activationTimeSec: number;
  readonly theta: number;
  readonly params: LeftHeartSubsystemParamsV2;
}): AcceptedV2 {
  const lvChamber = stepOneFiberChamberV1(input.previousLvState, {
    tSec: input.tSec,
    dtSec: input.dtSec,
    cycleLengthSec: input.cycleLengthSec,
    activationTimeSec: input.activationTimeSec,
    cavityVolumeMl: input.candidate.lvVolumeMl,
    previousCavityVolumeMl: input.previous.lvVolumeMl,
  }, input.params.lv);
  const lapRawMmHg = leftAtrialPressureRaw(input.theta, input.candidate.laVolumeMl, input.params);
  const lapSafetyMmHg = safetyPressureMmHg(
    input.candidate.laVolumeMl,
    input.params.minLaVolumeMl,
    input.params.maxLaVolumeMl,
    input.params.laSoftLimitGainMmHgPerMl,
    input.params.volumeSafetyMode,
  );
  const lvpSafetyMmHg = safetyPressureMmHg(
    input.candidate.lvVolumeMl,
    input.params.minLvVolumeMl,
    input.params.maxLvVolumeMl,
    input.params.lvSoftLimitGainMmHgPerMl,
    input.params.volumeSafetyMode,
  );
  const lapMmHg = lapRawMmHg + lapSafetyMmHg;
  const lvpMmHg = lvChamber.pressureRawMmHg + lvpSafetyMmHg;
  const mv = stepFlowStateValveV1(input.previousMvState, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: lapMmHg,
    downstreamPressureMmHg: lvpMmHg,
  }, input.params.mv);
  const aov = stepFlowStateValveV1(input.previousAovState, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: lvpMmHg,
    downstreamPressureMmHg: input.candidate.rootPressureMmHg,
  }, input.params.aov);
  const rootOutflowMlPerSec = Math.max(
    0,
    (input.candidate.rootPressureMmHg - input.params.rootDownstreamPressureMmHg)
      / Math.max(input.params.rootOutResistanceMmHgSecPerMl, 1e-9),
  );
  const qPulmonaryVenousMlPerSec = Math.max(
    0,
    (input.params.pulmonaryVenousPressureMmHg - lapMmHg)
      / Math.max(input.params.pulmonaryVenousResistanceMmHgSecPerMl, 1e-9),
  );
  const rawNextLvVolumeMl = input.previous.lvVolumeMl + input.dtSec * (mv.qMlPerSec - aov.qMlPerSec);
  const rawNextLaVolumeMl = input.previous.laVolumeMl + input.dtSec * (qPulmonaryVenousMlPerSec - mv.qMlPerSec);
  const rootPressureMmHg = Math.max(
    0,
    input.previous.rootPressureMmHg
      + input.dtSec * (aov.qMlPerSec - rootOutflowMlPerSec) / Math.max(input.params.rootComplianceMlPerMmHg, 1e-9),
  );
  const bounded = boundVolumesV2(rawNextLaVolumeMl, rawNextLvVolumeMl, input.params);
  return {
    ...bounded,
    rootPressureMmHg,
    lvChamber,
    mv,
    aov,
    lapRawMmHg,
    lapSafetyMmHg,
    lvpRawMmHg: lvChamber.pressureRawMmHg,
    lvpSafetyMmHg,
    qPulmonaryVenousMlPerSec,
    rootOutflowMlPerSec,
  };
}

function boundVolumesV2(
  laVolumeMl: number,
  lvVolumeMl: number,
  params: LeftHeartSubsystemParamsV2,
): { readonly laVolumeMl: number; readonly lvVolumeMl: number; readonly volumeClampHit01: 0 | 1 } {
  const laMin = params.volumeSafetyMode === "hard-clamp" ? params.minLaVolumeMl : params.absoluteMinLaVolumeMl;
  const laMax = params.volumeSafetyMode === "hard-clamp" ? params.maxLaVolumeMl : params.absoluteMaxLaVolumeMl;
  const lvMin = params.volumeSafetyMode === "hard-clamp" ? params.minLvVolumeMl : params.absoluteMinLvVolumeMl;
  const lvMax = params.volumeSafetyMode === "hard-clamp" ? params.maxLvVolumeMl : params.absoluteMaxLvVolumeMl;
  const boundedLa = clamp(laVolumeMl, laMin, laMax);
  const boundedLv = clamp(lvVolumeMl, lvMin, lvMax);
  return {
    laVolumeMl: boundedLa,
    lvVolumeMl: boundedLv,
    volumeClampHit01: boundedLa === laVolumeMl && boundedLv === lvVolumeMl ? 0 : 1,
  };
}

function safetyPressureMmHg(
  volumeMl: number,
  minVolumeMl: number,
  maxVolumeMl: number,
  gainMmHgPerMl: number,
  mode: LeftHeartVolumeSafetyModeV2,
): number {
  if (mode !== "soft-pressure") return 0;
  if (volumeMl > maxVolumeMl) return gainMmHgPerMl * (volumeMl - maxVolumeMl);
  if (volumeMl < minVolumeMl) return -gainMmHgPerMl * (minVolumeMl - volumeMl);
  return 0;
}

function leftAtrialPressureRaw(theta: number, laVolumeMl: number, params: LeftHeartSubsystemParamsV1): number {
  return params.laPressureBaselineMmHg
    + (laVolumeMl - params.laReferenceVolumeMl) / Math.max(params.laComplianceMlPerMmHg, 1e-9)
    + params.laAWaveMmHg * raisedCosineWindow(theta, params.laAWaveStartTheta, params.laAWaveEndTheta);
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (theta < start || theta > end) return 0;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}
