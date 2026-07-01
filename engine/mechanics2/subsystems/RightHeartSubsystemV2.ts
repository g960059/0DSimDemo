import {
  DEFAULT_ONE_FIBER_CHAMBER_PARAMS_V1,
  initialOneFiberChamberStateV1,
  stepOneFiberChamberV1,
  type OneFiberChamberOutputV1,
  type OneFiberChamberParamsV1,
  type OneFiberChamberStateV1,
} from "@/engine/mechanics2/chamber/OneFiberChamberV1";
import {
  DEFAULT_FLOW_STATE_VALVE_PARAMS_V1,
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type RightHeartTransactionModeV2 = "explicit-single" | "fixed-point";
export type RightHeartVolumeSafetyModeV2 = "hard-clamp" | "soft-pressure";

export type RightHeartSubsystemParamsV2 = {
  readonly fixtureId: string;
  readonly heartRateBpm: number;
  readonly beats: number;
  readonly sampleRateHz: number;
  readonly transactionMode: RightHeartTransactionModeV2;
  readonly transactionIterations: number;
  readonly transactionRelaxation: number;
  readonly transactionResidualToleranceMl: number;
  readonly volumeSafetyMode: RightHeartVolumeSafetyModeV2;
  readonly initialRaVolumeMl: number;
  readonly initialRvVolumeMl: number;
  readonly minRaVolumeMl: number;
  readonly maxRaVolumeMl: number;
  readonly minRvVolumeMl: number;
  readonly maxRvVolumeMl: number;
  readonly absoluteMinRaVolumeMl: number;
  readonly absoluteMaxRaVolumeMl: number;
  readonly absoluteMinRvVolumeMl: number;
  readonly absoluteMaxRvVolumeMl: number;
  readonly raSoftLimitGainMmHgPerMl: number;
  readonly rvSoftLimitGainMmHgPerMl: number;
  readonly raLowerSoftLimitGainMmHgPerMl: number;
  readonly rvLowerSoftLimitGainMmHgPerMl: number;
  readonly raPressureBaselineMmHg: number;
  readonly raAWaveMmHg: number;
  readonly raAWaveStartTheta: number;
  readonly raAWaveEndTheta: number;
  readonly raReferenceVolumeMl: number;
  readonly raComplianceMlPerMmHg: number;
  readonly systemicVenousPressureMmHg: number;
  readonly systemicVenousResistanceMmHgSecPerMl: number;
  readonly paInitialPressureMmHg: number;
  readonly paComplianceMlPerMmHg: number;
  readonly paOutResistanceMmHgSecPerMl: number;
  readonly paDownstreamPressureMmHg: number;
  readonly paOutflowStatefulDriveStartMmHg: number;
  readonly paOutflowStatefulDriveEndMmHg: number;
  readonly paOutflowStatefulResistanceGain: number;
  readonly paOutflowStatefulRiseTauSec: number;
  readonly paOutflowStatefulFallTauSec: number;
  readonly tvSystolicClosureDriveGain01: number;
  readonly tvSystolicClosureDriveStartTheta: number;
  readonly tvSystolicClosureDriveEndTheta: number;
  readonly rv: OneFiberChamberParamsV1;
  readonly tv: FlowStateValveParamsV1;
  readonly pv: FlowStateValveParamsV1;
};

export type RightHeartSubsystemStateV2 = {
  readonly raVolumeMl: number;
  readonly rvVolumeMl: number;
  readonly paPressureMmHg: number;
  readonly rv: OneFiberChamberStateV1;
  readonly tv: FlowStateValveStateV1;
  readonly pv: FlowStateValveStateV1;
  readonly paOutflowStatefulDrive01: number;
  readonly clampCount: number;
};

export type RightHeartSubsystemSampleV2 = {
  readonly tSec: number;
  readonly beat: number;
  readonly theta: number;
  readonly raVolumeMl: number;
  readonly rvVolumeMl: number;
  readonly acceptedRaVolumeMl: number;
  readonly acceptedRvVolumeMl: number;
  readonly rvpMmHg: number;
  readonly rvpRawMmHg: number;
  readonly rvpSafetyMmHg: number;
  readonly rapMmHg: number;
  readonly rapRawMmHg: number;
  readonly rapSafetyMmHg: number;
  readonly paPressureMmHg: number;
  readonly acceptedPaPressureMmHg: number;
  readonly qTvMlPerSec: number;
  readonly qPvMlPerSec: number;
  readonly qSystemicVenousMlPerSec: number;
  readonly tvOpen01: number;
  readonly pvOpen01: number;
  readonly rvChamber: OneFiberChamberOutputV1;
  readonly tv: FlowStateValveOutputV1;
  readonly pv: FlowStateValveOutputV1;
  readonly paOutResistanceEffectiveMmHgSecPerMl: number;
  readonly paOutflowStatefulDrive01: number;
  readonly paOutflowMlPerSec: number;
  readonly massResidualMl: number;
  readonly transactionResidualNormMl: number;
  readonly transactionConverged01: 0 | 1;
  readonly transactionIterationsUsed: number;
  readonly volumeClampHit01: 0 | 1;
  readonly raVolumeClampHit01: 0 | 1;
  readonly rvVolumeClampHit01: 0 | 1;
  readonly iterationLog: readonly MechanicsFixedPointIterationV2[];
};

export type RightHeartSubsystemRunV2 = {
  readonly params: RightHeartSubsystemParamsV2;
  readonly samples: readonly RightHeartSubsystemSampleV2[];
  readonly finalBeatSamples: readonly RightHeartSubsystemSampleV2[];
  readonly clampCount: number;
};

export type RightHeartSubsystemParamsV2Overrides =
  Partial<Omit<RightHeartSubsystemParamsV2, "rv" | "tv" | "pv">> & {
    readonly rv?: Partial<OneFiberChamberParamsV1>;
    readonly tv?: Partial<FlowStateValveParamsV1>;
    readonly pv?: Partial<FlowStateValveParamsV1>;
  };

type CandidateV2 = {
  readonly raVolumeMl: number;
  readonly rvVolumeMl: number;
  readonly paPressureMmHg: number;
};

type AcceptedV2 = CandidateV2 & {
  readonly rvChamber: OneFiberChamberOutputV1;
  readonly tv: FlowStateValveOutputV1;
  readonly pv: FlowStateValveOutputV1;
  readonly rapRawMmHg: number;
  readonly rapSafetyMmHg: number;
  readonly rvpRawMmHg: number;
  readonly rvpSafetyMmHg: number;
  readonly qSystemicVenousMlPerSec: number;
  readonly paOutResistanceEffectiveMmHgSecPerMl: number;
  readonly paOutflowStatefulDrive01: number;
  readonly paOutflowMlPerSec: number;
  readonly volumeClampHit01: 0 | 1;
  readonly raVolumeClampHit01: 0 | 1;
  readonly rvVolumeClampHit01: 0 | 1;
};

export function defaultRightHeartSubsystemParamsV2(
  overrides: RightHeartSubsystemParamsV2Overrides = {},
): RightHeartSubsystemParamsV2 {
  const rvBase = DEFAULT_ONE_FIBER_CHAMBER_PARAMS_V1.RV;
  return {
    fixtureId: overrides.fixtureId ?? "right-heart-normal-hr75",
    heartRateBpm: overrides.heartRateBpm ?? 75,
    beats: overrides.beats ?? 16,
    sampleRateHz: overrides.sampleRateHz ?? 240,
    transactionMode: overrides.transactionMode ?? "fixed-point",
    transactionIterations: overrides.transactionIterations ?? 2,
    transactionRelaxation: overrides.transactionRelaxation ?? 0.5,
    transactionResidualToleranceMl: overrides.transactionResidualToleranceMl ?? 0.02,
    volumeSafetyMode: overrides.volumeSafetyMode ?? "soft-pressure",
    initialRaVolumeMl: overrides.initialRaVolumeMl ?? 48,
    initialRvVolumeMl: overrides.initialRvVolumeMl ?? 142,
    minRaVolumeMl: overrides.minRaVolumeMl ?? 24,
    maxRaVolumeMl: overrides.maxRaVolumeMl ?? 130,
    minRvVolumeMl: overrides.minRvVolumeMl ?? 38,
    maxRvVolumeMl: overrides.maxRvVolumeMl ?? 340,
    absoluteMinRaVolumeMl: overrides.absoluteMinRaVolumeMl ?? 6,
    absoluteMaxRaVolumeMl: overrides.absoluteMaxRaVolumeMl ?? 190,
    absoluteMinRvVolumeMl: overrides.absoluteMinRvVolumeMl ?? 10,
    absoluteMaxRvVolumeMl: overrides.absoluteMaxRvVolumeMl ?? 380,
    raSoftLimitGainMmHgPerMl: overrides.raSoftLimitGainMmHgPerMl ?? 0.18,
    rvSoftLimitGainMmHgPerMl: overrides.rvSoftLimitGainMmHgPerMl ?? 0.22,
    raLowerSoftLimitGainMmHgPerMl: overrides.raLowerSoftLimitGainMmHgPerMl ?? 0.18,
    rvLowerSoftLimitGainMmHgPerMl: overrides.rvLowerSoftLimitGainMmHgPerMl ?? 0.08,
    raPressureBaselineMmHg: overrides.raPressureBaselineMmHg ?? 3.8,
    raAWaveMmHg: overrides.raAWaveMmHg ?? 3.0,
    raAWaveStartTheta: overrides.raAWaveStartTheta ?? 0.86,
    raAWaveEndTheta: overrides.raAWaveEndTheta ?? 0.98,
    raReferenceVolumeMl: overrides.raReferenceVolumeMl ?? 44,
    raComplianceMlPerMmHg: overrides.raComplianceMlPerMmHg ?? 13,
    systemicVenousPressureMmHg: overrides.systemicVenousPressureMmHg ?? 7.5,
    systemicVenousResistanceMmHgSecPerMl: overrides.systemicVenousResistanceMmHgSecPerMl ?? 0.055,
    paInitialPressureMmHg: overrides.paInitialPressureMmHg ?? 15,
    paComplianceMlPerMmHg: overrides.paComplianceMlPerMmHg ?? 5.5,
    paOutResistanceMmHgSecPerMl: overrides.paOutResistanceMmHgSecPerMl ?? 0.40,
    paDownstreamPressureMmHg: overrides.paDownstreamPressureMmHg ?? 9,
    paOutflowStatefulDriveStartMmHg: overrides.paOutflowStatefulDriveStartMmHg ?? 30,
    paOutflowStatefulDriveEndMmHg: overrides.paOutflowStatefulDriveEndMmHg ?? 42,
    paOutflowStatefulResistanceGain: overrides.paOutflowStatefulResistanceGain ?? 0,
    paOutflowStatefulRiseTauSec: overrides.paOutflowStatefulRiseTauSec ?? 0.03,
    paOutflowStatefulFallTauSec: overrides.paOutflowStatefulFallTauSec ?? 0.45,
    tvSystolicClosureDriveGain01: overrides.tvSystolicClosureDriveGain01 ?? 0.55,
    tvSystolicClosureDriveStartTheta: overrides.tvSystolicClosureDriveStartTheta ?? 0.00,
    tvSystolicClosureDriveEndTheta: overrides.tvSystolicClosureDriveEndTheta ?? 0.28,
    rv: {
      ...rvBase,
      pressureScale: 0.52,
      fiber: {
        ...rvBase.fiber,
        trefPa: 56_000,
        passiveStiffnessPa: 18_000,
        passiveSlackNorm: 0.95,
        activationFallTauSec: 0.085,
        lSiFollowTauSec: 0.070,
        activeShorteningVelocityNormPerSec: 0.050,
      },
      ...(overrides.rv ?? {}),
    },
    tv: {
      ...DEFAULT_FLOW_STATE_VALVE_PARAMS_V1.TV,
      resistanceMmHgSecPerMl: 0.010,
      inertanceMmHgSec2PerMl: 0.0040,
      bernoulliMmHgSec2PerMl2: 2.2e-5,
      tauOpenSec: 0.035,
      tauCloseSec: 0.040,
      maxOpenStepPerStep: 0.08,
      ...(overrides.tv ?? {}),
    },
    pv: {
      ...DEFAULT_FLOW_STATE_VALVE_PARAMS_V1.PV,
      resistanceMmHgSecPerMl: 0.004,
      inertanceMmHgSec2PerMl: 0.0010,
      bernoulliMmHgSec2PerMl2: 3.0e-6,
      tauCloseSec: 0.012,
      ...(overrides.pv ?? {}),
    },
  };
}

export function runRightHeartSubsystemV2(params: RightHeartSubsystemParamsV2): RightHeartSubsystemRunV2 {
  const cycleLengthSec = 60 / params.heartRateBpm;
  const dtSec = 1 / params.sampleRateHz;
  const sampleCount = Math.round(params.beats * cycleLengthSec * params.sampleRateHz);
  let state: RightHeartSubsystemStateV2 = {
    raVolumeMl: params.initialRaVolumeMl,
    rvVolumeMl: params.initialRvVolumeMl,
    paPressureMmHg: params.paInitialPressureMmHg,
    rv: initialOneFiberChamberStateV1(params.initialRvVolumeMl, params.rv),
    tv: initialFlowStateValveStateV1(),
    pv: initialFlowStateValveStateV1(),
    paOutflowStatefulDrive01: 0,
    clampCount: 0,
  };
  const samples: RightHeartSubsystemSampleV2[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const tSec = i * dtSec;
    const beat = Math.floor(tSec / cycleLengthSec);
    const theta = (tSec - beat * cycleLengthSec) / cycleLengthSec;
    const activationTimeSec = beat * cycleLengthSec + 0.13 * cycleLengthSec;
    const previousVolumes = {
      raVolumeMl: state.raVolumeMl,
      rvVolumeMl: state.rvVolumeMl,
      paPressureMmHg: state.paPressureMmHg,
    };
    const result = runMechanicsFixedPointTransactionV2(
      previousVolumes,
      {
        iterations: params.transactionMode === "explicit-single" ? 1 : params.transactionIterations,
        relaxation: params.transactionRelaxation,
        residualTolerance: params.transactionResidualToleranceMl,
      },
      (candidate) => acceptRightHeartCandidateV2({
        candidate,
        previous: previousVolumes,
        previousRvState: state.rv,
        previousTvState: state.tv,
        previousPvState: state.pv,
        previousPaOutflowStatefulDrive01: state.paOutflowStatefulDrive01,
        tSec,
        dtSec,
        cycleLengthSec,
        activationTimeSec,
        theta,
        params,
      }),
      (candidate, accepted) => rootMeanSquareResidualV2([
        accepted.raVolumeMl - candidate.raVolumeMl,
        accepted.rvVolumeMl - candidate.rvVolumeMl,
        accepted.paPressureMmHg - candidate.paPressureMmHg,
      ]),
      (candidate, accepted, relaxation) => ({
        raVolumeMl: lerpV2(candidate.raVolumeMl, accepted.raVolumeMl, relaxation),
        rvVolumeMl: lerpV2(candidate.rvVolumeMl, accepted.rvVolumeMl, relaxation),
        paPressureMmHg: lerpV2(candidate.paPressureMmHg, accepted.paPressureMmHg, relaxation),
      }),
    );
    const accepted = result.accepted;
    const massResidualMl =
      (accepted.rvVolumeMl - state.rvVolumeMl) - dtSec * (accepted.tv.qMlPerSec - accepted.pv.qMlPerSec)
      + (accepted.raVolumeMl - state.raVolumeMl) - dtSec * (accepted.qSystemicVenousMlPerSec - accepted.tv.qMlPerSec);
    samples.push({
      tSec,
      beat,
      theta,
      raVolumeMl: state.raVolumeMl,
      rvVolumeMl: state.rvVolumeMl,
      acceptedRaVolumeMl: accepted.raVolumeMl,
      acceptedRvVolumeMl: accepted.rvVolumeMl,
      rvpMmHg: accepted.rvpRawMmHg + accepted.rvpSafetyMmHg,
      rvpRawMmHg: accepted.rvpRawMmHg,
      rvpSafetyMmHg: accepted.rvpSafetyMmHg,
      rapMmHg: accepted.rapRawMmHg + accepted.rapSafetyMmHg,
      rapRawMmHg: accepted.rapRawMmHg,
      rapSafetyMmHg: accepted.rapSafetyMmHg,
      paPressureMmHg: state.paPressureMmHg,
      acceptedPaPressureMmHg: accepted.paPressureMmHg,
      qTvMlPerSec: accepted.tv.qMlPerSec,
      qPvMlPerSec: accepted.pv.qMlPerSec,
      qSystemicVenousMlPerSec: accepted.qSystemicVenousMlPerSec,
      tvOpen01: accepted.tv.open01,
      pvOpen01: accepted.pv.open01,
      rvChamber: accepted.rvChamber,
      tv: accepted.tv,
      pv: accepted.pv,
      paOutResistanceEffectiveMmHgSecPerMl: accepted.paOutResistanceEffectiveMmHgSecPerMl,
      paOutflowStatefulDrive01: accepted.paOutflowStatefulDrive01,
      paOutflowMlPerSec: accepted.paOutflowMlPerSec,
      massResidualMl,
      transactionResidualNormMl: result.residualNorm,
      transactionConverged01: result.converged ? 1 : 0,
      transactionIterationsUsed: result.iterationsUsed,
      volumeClampHit01: accepted.volumeClampHit01,
      raVolumeClampHit01: accepted.raVolumeClampHit01,
      rvVolumeClampHit01: accepted.rvVolumeClampHit01,
      iterationLog: result.iterationLog,
    });
    state = {
      raVolumeMl: accepted.raVolumeMl,
      rvVolumeMl: accepted.rvVolumeMl,
      paPressureMmHg: accepted.paPressureMmHg,
      rv: accepted.rvChamber.state,
      tv: accepted.tv.state,
      pv: accepted.pv.state,
      paOutflowStatefulDrive01: accepted.paOutflowStatefulDrive01,
      clampCount: state.clampCount + accepted.volumeClampHit01,
    };
  }
  const finalBeat = params.beats - 2;
  const finalBeatSamples = samples.filter((sample) => sample.beat === finalBeat);
  return { params, samples, finalBeatSamples, clampCount: state.clampCount };
}

function acceptRightHeartCandidateV2(input: {
  readonly candidate: CandidateV2;
  readonly previous: CandidateV2;
  readonly previousRvState: OneFiberChamberStateV1;
  readonly previousTvState: FlowStateValveStateV1;
  readonly previousPvState: FlowStateValveStateV1;
  readonly previousPaOutflowStatefulDrive01: number;
  readonly tSec: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly activationTimeSec: number;
  readonly theta: number;
  readonly params: RightHeartSubsystemParamsV2;
}): AcceptedV2 {
  const rvChamber = stepOneFiberChamberV1(input.previousRvState, {
    tSec: input.tSec,
    dtSec: input.dtSec,
    cycleLengthSec: input.cycleLengthSec,
    activationTimeSec: input.activationTimeSec,
    cavityVolumeMl: input.candidate.rvVolumeMl,
    previousCavityVolumeMl: input.previous.rvVolumeMl,
  }, input.params.rv);
  const rapRawMmHg = rightAtrialPressureRaw(input.theta, input.candidate.raVolumeMl, input.params);
  const rapSafetyMmHg = safetyPressureMmHg(
    input.candidate.raVolumeMl,
    input.params.minRaVolumeMl,
    input.params.maxRaVolumeMl,
    input.params.raSoftLimitGainMmHgPerMl,
    input.params.raLowerSoftLimitGainMmHgPerMl,
    input.params.volumeSafetyMode,
  );
  const rvpSafetyMmHg = safetyPressureMmHg(
    input.candidate.rvVolumeMl,
    input.params.minRvVolumeMl,
    input.params.maxRvVolumeMl,
    input.params.rvSoftLimitGainMmHgPerMl,
    input.params.rvLowerSoftLimitGainMmHgPerMl,
    input.params.volumeSafetyMode,
  );
  const rapMmHg = rapRawMmHg + rapSafetyMmHg;
  const rvpMmHg = rvChamber.pressureRawMmHg + rvpSafetyMmHg;
  const tv = stepFlowStateValveV1(input.previousTvState, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: rapMmHg,
    downstreamPressureMmHg: rvpMmHg,
    closureDrive01: tvSystolicClosureDrive01(input.theta, input.params),
  }, input.params.tv);
  const pv = stepFlowStateValveV1(input.previousPvState, {
    dtSec: input.dtSec,
    upstreamPressureMmHg: rvpMmHg,
    downstreamPressureMmHg: input.candidate.paPressureMmHg,
  }, input.params.pv);
  const paOutflowStatefulTargetDrive01 = paOutflowStatefulTargetDrive(input.params, rvpMmHg);
  const paOutflowStatefulDrive01 = nextPaOutflowStatefulDrive(
    input.previousPaOutflowStatefulDrive01,
    paOutflowStatefulTargetDrive01,
    input.dtSec,
    input.params,
  );
  const paOutResistanceEffectiveMmHgSecPerMl =
    input.params.paOutResistanceMmHgSecPerMl
    * (1 + input.params.paOutflowStatefulResistanceGain * paOutflowStatefulDrive01);
  const paOutflowMlPerSec = Math.max(
    0,
    (input.candidate.paPressureMmHg - input.params.paDownstreamPressureMmHg)
      / Math.max(paOutResistanceEffectiveMmHgSecPerMl, 1e-9),
  );
  const qSystemicVenousMlPerSec = Math.max(
    0,
    (input.params.systemicVenousPressureMmHg - rapMmHg)
      / Math.max(input.params.systemicVenousResistanceMmHgSecPerMl, 1e-9),
  );
  const rawNextRvVolumeMl = input.previous.rvVolumeMl + input.dtSec * (tv.qMlPerSec - pv.qMlPerSec);
  const rawNextRaVolumeMl = input.previous.raVolumeMl + input.dtSec * (qSystemicVenousMlPerSec - tv.qMlPerSec);
  const paPressureMmHg = Math.max(
    0,
    input.previous.paPressureMmHg
      + input.dtSec * (pv.qMlPerSec - paOutflowMlPerSec)
      / Math.max(input.params.paComplianceMlPerMmHg, 1e-9),
  );
  const bounded = boundVolumesV2(rawNextRaVolumeMl, rawNextRvVolumeMl, input.params);
  return {
    ...bounded,
    paPressureMmHg,
    rvChamber,
    tv,
    pv,
    rapRawMmHg,
    rapSafetyMmHg,
    rvpRawMmHg: rvChamber.pressureRawMmHg,
    rvpSafetyMmHg,
    qSystemicVenousMlPerSec,
    paOutResistanceEffectiveMmHgSecPerMl,
    paOutflowStatefulDrive01,
    paOutflowMlPerSec,
  };
}

function tvSystolicClosureDrive01(theta: number, params: RightHeartSubsystemParamsV2): number {
  if (params.tvSystolicClosureDriveGain01 <= 0) return 0;
  return clamp(
    params.tvSystolicClosureDriveGain01
      * raisedCosineWindow(theta, params.tvSystolicClosureDriveStartTheta, params.tvSystolicClosureDriveEndTheta),
    0,
    1,
  );
}

function paOutflowStatefulTargetDrive(params: RightHeartSubsystemParamsV2, rvpMmHg: number): number {
  if (params.paOutflowStatefulResistanceGain <= 0) return 0;
  const start = params.paOutflowStatefulDriveStartMmHg;
  const end = params.paOutflowStatefulDriveEndMmHg;
  if (end <= start) return 0;
  return smoothstep01((rvpMmHg - start) / Math.max(end - start, 1e-9));
}

function nextPaOutflowStatefulDrive(
  previousDrive01: number,
  targetDrive01: number,
  dtSec: number,
  params: RightHeartSubsystemParamsV2,
): number {
  if (params.paOutflowStatefulResistanceGain <= 0) return 0;
  const tau = targetDrive01 > previousDrive01
    ? params.paOutflowStatefulRiseTauSec
    : params.paOutflowStatefulFallTauSec;
  const step = (targetDrive01 - previousDrive01) * dtSec / Math.max(tau, 1e-6);
  return clamp(previousDrive01 + step, 0, 1);
}

function boundVolumesV2(
  raVolumeMl: number,
  rvVolumeMl: number,
  params: RightHeartSubsystemParamsV2,
): {
  readonly raVolumeMl: number;
  readonly rvVolumeMl: number;
  readonly volumeClampHit01: 0 | 1;
  readonly raVolumeClampHit01: 0 | 1;
  readonly rvVolumeClampHit01: 0 | 1;
} {
  const raMin = params.volumeSafetyMode === "hard-clamp" ? params.minRaVolumeMl : params.absoluteMinRaVolumeMl;
  const raMax = params.volumeSafetyMode === "hard-clamp" ? params.maxRaVolumeMl : params.absoluteMaxRaVolumeMl;
  const rvMin = params.volumeSafetyMode === "hard-clamp" ? params.minRvVolumeMl : params.absoluteMinRvVolumeMl;
  const rvMax = params.volumeSafetyMode === "hard-clamp" ? params.maxRvVolumeMl : params.absoluteMaxRvVolumeMl;
  const boundedRa = clamp(raVolumeMl, raMin, raMax);
  const boundedRv = clamp(rvVolumeMl, rvMin, rvMax);
  const raVolumeClampHit01 = boundedRa === raVolumeMl ? 0 : 1;
  const rvVolumeClampHit01 = boundedRv === rvVolumeMl ? 0 : 1;
  return {
    raVolumeMl: boundedRa,
    rvVolumeMl: boundedRv,
    volumeClampHit01: raVolumeClampHit01 || rvVolumeClampHit01 ? 1 : 0,
    raVolumeClampHit01,
    rvVolumeClampHit01,
  };
}

function safetyPressureMmHg(
  volumeMl: number,
  minVolumeMl: number,
  maxVolumeMl: number,
  upperGainMmHgPerMl: number,
  lowerGainMmHgPerMl: number,
  mode: RightHeartVolumeSafetyModeV2,
): number {
  if (mode !== "soft-pressure") return 0;
  if (volumeMl > maxVolumeMl) return upperGainMmHgPerMl * (volumeMl - maxVolumeMl);
  if (volumeMl < minVolumeMl) return -lowerGainMmHgPerMl * (minVolumeMl - volumeMl);
  return 0;
}

function rightAtrialPressureRaw(theta: number, raVolumeMl: number, params: RightHeartSubsystemParamsV2): number {
  return params.raPressureBaselineMmHg
    + (raVolumeMl - params.raReferenceVolumeMl) / Math.max(params.raComplianceMlPerMmHg, 1e-9)
    + params.raAWaveMmHg * raisedCosineWindow(theta, params.raAWaveStartTheta, params.raAWaveEndTheta);
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (theta < start || theta > end) return 0;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}

function smoothstep01(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}
