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
export type PulmonaryVenousBoundaryModeV2 = "fixed-pressure" | "compliance-node";

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
  readonly lvLowerSoftLimitGainMmHgPerMl: number;
  readonly laLowerSoftLimitGainMmHgPerMl: number;
  readonly pulmonaryVenousBoundaryMode: PulmonaryVenousBoundaryModeV2;
  readonly pulmonaryVenousInitialPressureMmHg: number;
  readonly pulmonaryVenousSourcePressureMmHg: number;
  readonly pulmonaryVenousSourceResistanceMmHgSecPerMl: number;
  readonly pulmonaryVenousComplianceMlPerMmHg: number;
  readonly rootOutflowHighPressureDriveStartMmHg: number;
  readonly rootOutflowHighPressureDriveEndMmHg: number;
  readonly rootOutflowHighPressureResistanceGain: number;
  readonly mvSystolicClosureDriveGain01: number;
  readonly mvSystolicClosureDriveStartTheta: number;
  readonly mvSystolicClosureDriveEndTheta: number;
};

export type LeftHeartSubsystemStateV2 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly rootPressureMmHg: number;
  readonly pulmonaryVenousPressureMmHg: number;
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
  readonly pulmonaryVenousPressureMmHg: number;
  readonly acceptedPulmonaryVenousPressureMmHg: number;
  readonly qMvMlPerSec: number;
  readonly qAovMlPerSec: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly qPulmonaryVenousSourceMlPerSec: number;
  readonly rootOutResistanceEffectiveMmHgSecPerMl: number;
  readonly rootOutflowHighPressureDrive01: number;
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
  readonly laVolumeClampHit01: 0 | 1;
  readonly lvVolumeClampHit01: 0 | 1;
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
  readonly pulmonaryVenousPressureMmHg: number;
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
  readonly qPulmonaryVenousSourceMlPerSec: number;
  readonly rootOutResistanceEffectiveMmHgSecPerMl: number;
  readonly rootOutflowHighPressureDrive01: number;
  readonly rootOutflowMlPerSec: number;
  readonly volumeClampHit01: 0 | 1;
  readonly laVolumeClampHit01: 0 | 1;
  readonly lvVolumeClampHit01: 0 | 1;
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
    lvLowerSoftLimitGainMmHgPerMl: overrides.lvLowerSoftLimitGainMmHgPerMl
      ?? overrides.lvSoftLimitGainMmHgPerMl
      ?? 0.65,
    laLowerSoftLimitGainMmHgPerMl: overrides.laLowerSoftLimitGainMmHgPerMl
      ?? overrides.laSoftLimitGainMmHgPerMl
      ?? 0.35,
    pulmonaryVenousBoundaryMode: overrides.pulmonaryVenousBoundaryMode ?? "fixed-pressure",
    pulmonaryVenousInitialPressureMmHg: overrides.pulmonaryVenousInitialPressureMmHg
      ?? overrides.pulmonaryVenousPressureMmHg
      ?? base.pulmonaryVenousPressureMmHg,
    pulmonaryVenousSourcePressureMmHg: overrides.pulmonaryVenousSourcePressureMmHg
      ?? overrides.pulmonaryVenousPressureMmHg
      ?? base.pulmonaryVenousPressureMmHg,
    pulmonaryVenousSourceResistanceMmHgSecPerMl: overrides.pulmonaryVenousSourceResistanceMmHgSecPerMl ?? 0.11,
    pulmonaryVenousComplianceMlPerMmHg: overrides.pulmonaryVenousComplianceMlPerMmHg ?? 12,
    rootOutflowHighPressureDriveStartMmHg: overrides.rootOutflowHighPressureDriveStartMmHg ?? 0,
    rootOutflowHighPressureDriveEndMmHg: overrides.rootOutflowHighPressureDriveEndMmHg ?? 0,
    rootOutflowHighPressureResistanceGain: overrides.rootOutflowHighPressureResistanceGain ?? 0,
    mvSystolicClosureDriveGain01: overrides.mvSystolicClosureDriveGain01 ?? 0,
    mvSystolicClosureDriveStartTheta: overrides.mvSystolicClosureDriveStartTheta ?? 0.02,
    mvSystolicClosureDriveEndTheta: overrides.mvSystolicClosureDriveEndTheta ?? 0.18,
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
    pulmonaryVenousPressureMmHg: params.pulmonaryVenousInitialPressureMmHg,
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
    const previousVolumes = {
      laVolumeMl: state.laVolumeMl,
      lvVolumeMl: state.lvVolumeMl,
      rootPressureMmHg: state.rootPressureMmHg,
      pulmonaryVenousPressureMmHg: state.pulmonaryVenousPressureMmHg,
    };
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
        accepted.pulmonaryVenousPressureMmHg - candidate.pulmonaryVenousPressureMmHg,
      ]),
      (candidate, accepted, relaxation) => ({
        laVolumeMl: lerpV2(candidate.laVolumeMl, accepted.laVolumeMl, relaxation),
        lvVolumeMl: lerpV2(candidate.lvVolumeMl, accepted.lvVolumeMl, relaxation),
        rootPressureMmHg: lerpV2(candidate.rootPressureMmHg, accepted.rootPressureMmHg, relaxation),
        pulmonaryVenousPressureMmHg: lerpV2(
          candidate.pulmonaryVenousPressureMmHg,
          accepted.pulmonaryVenousPressureMmHg,
          relaxation,
        ),
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
      pulmonaryVenousPressureMmHg: state.pulmonaryVenousPressureMmHg,
      acceptedPulmonaryVenousPressureMmHg: accepted.pulmonaryVenousPressureMmHg,
      qMvMlPerSec: accepted.mv.qMlPerSec,
      qAovMlPerSec: accepted.aov.qMlPerSec,
      qPulmonaryVenousMlPerSec: accepted.qPulmonaryVenousMlPerSec,
      qPulmonaryVenousSourceMlPerSec: accepted.qPulmonaryVenousSourceMlPerSec,
      rootOutResistanceEffectiveMmHgSecPerMl: accepted.rootOutResistanceEffectiveMmHgSecPerMl,
      rootOutflowHighPressureDrive01: accepted.rootOutflowHighPressureDrive01,
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
      laVolumeClampHit01: accepted.laVolumeClampHit01,
      lvVolumeClampHit01: accepted.lvVolumeClampHit01,
      iterationLog: result.iterationLog,
    });
    state = {
      laVolumeMl: accepted.laVolumeMl,
      lvVolumeMl: accepted.lvVolumeMl,
      rootPressureMmHg: accepted.rootPressureMmHg,
      pulmonaryVenousPressureMmHg: accepted.pulmonaryVenousPressureMmHg,
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
    input.params.laLowerSoftLimitGainMmHgPerMl,
    input.params.volumeSafetyMode,
  );
  const lvpSafetyMmHg = safetyPressureMmHg(
    input.candidate.lvVolumeMl,
    input.params.minLvVolumeMl,
    input.params.maxLvVolumeMl,
    input.params.lvSoftLimitGainMmHgPerMl,
    input.params.lvLowerSoftLimitGainMmHgPerMl,
    input.params.volumeSafetyMode,
  );
  const lapMmHg = lapRawMmHg + lapSafetyMmHg;
  const lvpMmHg = lvChamber.pressureRawMmHg + lvpSafetyMmHg;
  const mv = stepFlowStateValveV1(input.previousMvState, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: lapMmHg,
    downstreamPressureMmHg: lvpMmHg,
    closureDrive01: mvSystolicClosureDrive01(input.theta, input.params),
  }, input.params.mv);
  const aov = stepFlowStateValveV1(input.previousAovState, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: lvpMmHg,
    downstreamPressureMmHg: input.candidate.rootPressureMmHg,
  }, input.params.aov);
  const rootOutflowHighPressureDrive01 = rootOutflowHighPressureDrive(input.params, lvpMmHg);
  const rootOutResistanceEffectiveMmHgSecPerMl =
    input.params.rootOutResistanceMmHgSecPerMl
    * (1 + input.params.rootOutflowHighPressureResistanceGain * rootOutflowHighPressureDrive01);
  const rootOutflowMlPerSec = Math.max(
    0,
    (input.candidate.rootPressureMmHg - input.params.rootDownstreamPressureMmHg)
      / Math.max(rootOutResistanceEffectiveMmHgSecPerMl, 1e-9),
  );
  const pulmonaryBoundary = pulmonaryVenousBoundaryV2(input.previous, input.candidate, lapMmHg, input.dtSec, input.params);
  const qPulmonaryVenousMlPerSec = pulmonaryBoundary.qPulmonaryVenousMlPerSec;
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
    pulmonaryVenousPressureMmHg: pulmonaryBoundary.pulmonaryVenousPressureMmHg,
    lvChamber,
    mv,
    aov,
    lapRawMmHg,
    lapSafetyMmHg,
    lvpRawMmHg: lvChamber.pressureRawMmHg,
    lvpSafetyMmHg,
    qPulmonaryVenousMlPerSec,
    qPulmonaryVenousSourceMlPerSec: pulmonaryBoundary.qPulmonaryVenousSourceMlPerSec,
    rootOutResistanceEffectiveMmHgSecPerMl,
    rootOutflowHighPressureDrive01,
    rootOutflowMlPerSec,
  };
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

function rootOutflowHighPressureDrive(params: LeftHeartSubsystemParamsV2, lvpMmHg: number): number {
  if (params.rootOutflowHighPressureResistanceGain <= 0) return 0;
  const start = params.rootOutflowHighPressureDriveStartMmHg;
  const end = params.rootOutflowHighPressureDriveEndMmHg;
  if (end <= start) return 0;
  return smoothstep01((lvpMmHg - start) / Math.max(end - start, 1e-9));
}

function smoothstep01(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function pulmonaryVenousBoundaryV2(
  previous: CandidateV2,
  candidate: CandidateV2,
  lapMmHg: number,
  dtSec: number,
  params: LeftHeartSubsystemParamsV2,
): {
  readonly pulmonaryVenousPressureMmHg: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly qPulmonaryVenousSourceMlPerSec: number;
} {
  if (params.pulmonaryVenousBoundaryMode === "fixed-pressure") {
    const pressure = params.pulmonaryVenousPressureMmHg;
    return {
      pulmonaryVenousPressureMmHg: pressure,
      qPulmonaryVenousMlPerSec: Math.max(
        0,
        (pressure - lapMmHg) / Math.max(params.pulmonaryVenousResistanceMmHgSecPerMl, 1e-9),
      ),
      qPulmonaryVenousSourceMlPerSec: 0,
    };
  }
  const candidatePressure = Math.max(0, candidate.pulmonaryVenousPressureMmHg);
  const qPulmonaryVenousSourceMlPerSec = Math.max(
    0,
    (params.pulmonaryVenousSourcePressureMmHg - candidatePressure)
      / Math.max(params.pulmonaryVenousSourceResistanceMmHgSecPerMl, 1e-9),
  );
  const qPulmonaryVenousMlPerSec = Math.max(
    0,
    (candidatePressure - lapMmHg) / Math.max(params.pulmonaryVenousResistanceMmHgSecPerMl, 1e-9),
  );
  const pulmonaryVenousPressureMmHg = Math.max(
    0,
    previous.pulmonaryVenousPressureMmHg
      + dtSec * (qPulmonaryVenousSourceMlPerSec - qPulmonaryVenousMlPerSec)
      / Math.max(params.pulmonaryVenousComplianceMlPerMmHg, 1e-9),
  );
  return {
    pulmonaryVenousPressureMmHg,
    qPulmonaryVenousMlPerSec,
    qPulmonaryVenousSourceMlPerSec,
  };
}

function boundVolumesV2(
  laVolumeMl: number,
  lvVolumeMl: number,
  params: LeftHeartSubsystemParamsV2,
): {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly volumeClampHit01: 0 | 1;
  readonly laVolumeClampHit01: 0 | 1;
  readonly lvVolumeClampHit01: 0 | 1;
} {
  const laMin = params.volumeSafetyMode === "hard-clamp" ? params.minLaVolumeMl : params.absoluteMinLaVolumeMl;
  const laMax = params.volumeSafetyMode === "hard-clamp" ? params.maxLaVolumeMl : params.absoluteMaxLaVolumeMl;
  const lvMin = params.volumeSafetyMode === "hard-clamp" ? params.minLvVolumeMl : params.absoluteMinLvVolumeMl;
  const lvMax = params.volumeSafetyMode === "hard-clamp" ? params.maxLvVolumeMl : params.absoluteMaxLvVolumeMl;
  const boundedLa = clamp(laVolumeMl, laMin, laMax);
  const boundedLv = clamp(lvVolumeMl, lvMin, lvMax);
  const laVolumeClampHit01 = boundedLa === laVolumeMl ? 0 : 1;
  const lvVolumeClampHit01 = boundedLv === lvVolumeMl ? 0 : 1;
  return {
    laVolumeMl: boundedLa,
    lvVolumeMl: boundedLv,
    volumeClampHit01: laVolumeClampHit01 || lvVolumeClampHit01 ? 1 : 0,
    laVolumeClampHit01,
    lvVolumeClampHit01,
  };
}

function safetyPressureMmHg(
  volumeMl: number,
  minVolumeMl: number,
  maxVolumeMl: number,
  upperGainMmHgPerMl: number,
  lowerGainMmHgPerMl: number,
  mode: LeftHeartVolumeSafetyModeV2,
): number {
  if (mode !== "soft-pressure") return 0;
  if (volumeMl > maxVolumeMl) return upperGainMmHgPerMl * (volumeMl - maxVolumeMl);
  if (volumeMl < minVolumeMl) return -lowerGainMmHgPerMl * (minVolumeMl - volumeMl);
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
