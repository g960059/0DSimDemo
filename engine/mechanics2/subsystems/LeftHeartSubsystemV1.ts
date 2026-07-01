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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type LeftHeartSubsystemParamsV1 = {
  readonly fixtureId: string;
  readonly heartRateBpm: number;
  readonly beats: number;
  readonly sampleRateHz: number;
  readonly initialLaVolumeMl: number;
  readonly initialLvVolumeMl: number;
  readonly minLaVolumeMl: number;
  readonly maxLaVolumeMl: number;
  readonly minLvVolumeMl: number;
  readonly maxLvVolumeMl: number;
  readonly laPressureBaselineMmHg: number;
  readonly laAWaveMmHg: number;
  readonly laReferenceVolumeMl: number;
  readonly laComplianceMlPerMmHg: number;
  readonly pulmonaryVenousInflowMlPerSec: number;
  readonly rootInitialPressureMmHg: number;
  readonly rootComplianceMlPerMmHg: number;
  readonly rootOutResistanceMmHgSecPerMl: number;
  readonly rootDownstreamPressureMmHg: number;
  readonly lv: OneFiberChamberParamsV1;
  readonly mv: FlowStateValveParamsV1;
  readonly aov: FlowStateValveParamsV1;
};

export type LeftHeartSubsystemStateV1 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly rootPressureMmHg: number;
  readonly lv: OneFiberChamberStateV1;
  readonly mv: FlowStateValveStateV1;
  readonly aov: FlowStateValveStateV1;
  readonly clampCount: number;
};

export type LeftHeartSubsystemSampleV1 = {
  readonly tSec: number;
  readonly beat: number;
  readonly theta: number;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly lvpMmHg: number;
  readonly lapMmHg: number;
  readonly rootPressureMmHg: number;
  readonly qMvMlPerSec: number;
  readonly qAovMlPerSec: number;
  readonly mvOpen01: number;
  readonly aovOpen01: number;
  readonly lvChamber: OneFiberChamberOutputV1;
  readonly mv: FlowStateValveOutputV1;
  readonly aov: FlowStateValveOutputV1;
  readonly rootOutflowMlPerSec: number;
  readonly massResidualMl: number;
  readonly volumeClampHit01: 0 | 1;
};

export type LeftHeartSubsystemRunV1 = {
  readonly params: LeftHeartSubsystemParamsV1;
  readonly samples: readonly LeftHeartSubsystemSampleV1[];
  readonly finalBeatSamples: readonly LeftHeartSubsystemSampleV1[];
  readonly clampCount: number;
};

export function defaultLeftHeartSubsystemParamsV1(
  overrides: Partial<Omit<LeftHeartSubsystemParamsV1, "lv" | "mv" | "aov">> & {
    readonly lv?: Partial<OneFiberChamberParamsV1>;
    readonly mv?: Partial<FlowStateValveParamsV1>;
    readonly aov?: Partial<FlowStateValveParamsV1>;
  } = {},
): LeftHeartSubsystemParamsV1 {
  const heartRateBpm = overrides.heartRateBpm ?? 75;
  const lvBase = DEFAULT_ONE_FIBER_CHAMBER_PARAMS_V1.LV;
  return {
    fixtureId: overrides.fixtureId ?? "left-heart-normal-hr75",
    heartRateBpm,
    beats: overrides.beats ?? 9,
    sampleRateHz: overrides.sampleRateHz ?? 240,
    initialLaVolumeMl: overrides.initialLaVolumeMl ?? 58,
    initialLvVolumeMl: overrides.initialLvVolumeMl ?? 126,
    minLaVolumeMl: overrides.minLaVolumeMl ?? 28,
    maxLaVolumeMl: overrides.maxLaVolumeMl ?? 130,
    minLvVolumeMl: overrides.minLvVolumeMl ?? 45,
    maxLvVolumeMl: overrides.maxLvVolumeMl ?? 175,
    laPressureBaselineMmHg: overrides.laPressureBaselineMmHg ?? 8,
    laAWaveMmHg: overrides.laAWaveMmHg ?? 2.2,
    laReferenceVolumeMl: overrides.laReferenceVolumeMl ?? 52,
    laComplianceMlPerMmHg: overrides.laComplianceMlPerMmHg ?? 7.5,
    pulmonaryVenousInflowMlPerSec: overrides.pulmonaryVenousInflowMlPerSec ?? 65,
    rootInitialPressureMmHg: overrides.rootInitialPressureMmHg ?? 82,
    rootComplianceMlPerMmHg: overrides.rootComplianceMlPerMmHg ?? 2.6,
    rootOutResistanceMmHgSecPerMl: overrides.rootOutResistanceMmHgSecPerMl ?? 0.9,
    rootDownstreamPressureMmHg: overrides.rootDownstreamPressureMmHg ?? 75,
    lv: {
      ...lvBase,
      fiber: { ...lvBase.fiber, passiveStiffnessPa: 360_000, passiveSlackNorm: 0.96 },
      ...(overrides.lv ?? {}),
    },
    mv: {
      ...DEFAULT_FLOW_STATE_VALVE_PARAMS_V1.MV,
      resistanceMmHgSecPerMl: 0.016,
      bernoulliMmHgSec2PerMl2: 1.6e-5,
      ...(overrides.mv ?? {}),
    },
    aov: {
      ...DEFAULT_FLOW_STATE_VALVE_PARAMS_V1.AoV,
      resistanceMmHgSecPerMl: 0.0022,
      inertanceMmHgSec2PerMl: 0.0005,
      bernoulliMmHgSec2PerMl2: 3e-6,
      ...(overrides.aov ?? {}),
    },
  };
}

export function runLeftHeartSubsystemV1(params: LeftHeartSubsystemParamsV1): LeftHeartSubsystemRunV1 {
  const cycleLengthSec = 60 / params.heartRateBpm;
  const dtSec = 1 / params.sampleRateHz;
  const sampleCount = Math.round(params.beats * cycleLengthSec * params.sampleRateHz);
  let state: LeftHeartSubsystemStateV1 = {
    laVolumeMl: params.initialLaVolumeMl,
    lvVolumeMl: params.initialLvVolumeMl,
    rootPressureMmHg: params.rootInitialPressureMmHg,
    lv: initialOneFiberChamberStateV1(params.initialLvVolumeMl, params.lv),
    mv: initialFlowStateValveStateV1(),
    aov: initialFlowStateValveStateV1(),
    clampCount: 0,
  };
  const samples: LeftHeartSubsystemSampleV1[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const tSec = i * dtSec;
    const beat = Math.floor(tSec / cycleLengthSec);
    const theta = (tSec - beat * cycleLengthSec) / cycleLengthSec;
    const activationTimeSec = beat * cycleLengthSec + 0.13 * cycleLengthSec;
    const lvChamber = stepOneFiberChamberV1(state.lv, {
      tSec,
      dtSec,
      cycleLengthSec,
      activationTimeSec,
      cavityVolumeMl: state.lvVolumeMl,
      previousCavityVolumeMl: samples.at(-1)?.lvVolumeMl ?? state.lvVolumeMl,
    }, params.lv);
    const lapMmHg = leftAtrialPressure(theta, state.laVolumeMl, params);
    const mv = stepFlowStateValveV1(state.mv, {
      dtSec,
      upstreamPressureMmHg: lapMmHg,
      downstreamPressureMmHg: lvChamber.pressureRawMmHg,
    }, params.mv);
    const aov = stepFlowStateValveV1(state.aov, {
      dtSec,
      upstreamPressureMmHg: lvChamber.pressureRawMmHg,
      downstreamPressureMmHg: state.rootPressureMmHg,
    }, params.aov);
    const rootOutflowMlPerSec = Math.max(
      0,
      (state.rootPressureMmHg - params.rootDownstreamPressureMmHg) / Math.max(params.rootOutResistanceMmHgSecPerMl, 1e-9),
    );
    const rawNextVolumeMl = state.lvVolumeMl + dtSec * (mv.qMlPerSec - aov.qMlPerSec);
    const nextVolumeMl = clamp(rawNextVolumeMl, params.minLvVolumeMl, params.maxLvVolumeMl);
    const volumeClampHit01 = nextVolumeMl === rawNextVolumeMl ? 0 : 1;
    const rawNextLaVolumeMl = state.laVolumeMl + dtSec * (params.pulmonaryVenousInflowMlPerSec - mv.qMlPerSec);
    const nextLaVolumeMl = clamp(rawNextLaVolumeMl, params.minLaVolumeMl, params.maxLaVolumeMl);
    const laVolumeClampHit01 = nextLaVolumeMl === rawNextLaVolumeMl ? 0 : 1;
    const rootPressureMmHg = Math.max(
      0,
      state.rootPressureMmHg + dtSec * (aov.qMlPerSec - rootOutflowMlPerSec) / Math.max(params.rootComplianceMlPerMmHg, 1e-9),
    );
    const massResidualMl =
      (nextVolumeMl - state.lvVolumeMl) - dtSec * (mv.qMlPerSec - aov.qMlPerSec)
      + (nextLaVolumeMl - state.laVolumeMl) - dtSec * (params.pulmonaryVenousInflowMlPerSec - mv.qMlPerSec);
    samples.push({
      tSec,
      beat,
      theta,
      laVolumeMl: state.laVolumeMl,
      lvVolumeMl: state.lvVolumeMl,
      lvpMmHg: lvChamber.pressureRawMmHg,
      lapMmHg,
      rootPressureMmHg: state.rootPressureMmHg,
      qMvMlPerSec: mv.qMlPerSec,
      qAovMlPerSec: aov.qMlPerSec,
      mvOpen01: mv.open01,
      aovOpen01: aov.open01,
      lvChamber,
      mv,
      aov,
      rootOutflowMlPerSec,
      massResidualMl,
      volumeClampHit01: volumeClampHit01 || laVolumeClampHit01 ? 1 : 0,
    });
    state = {
      laVolumeMl: nextLaVolumeMl,
      lvVolumeMl: nextVolumeMl,
      rootPressureMmHg,
      lv: lvChamber.state,
      mv: mv.state,
      aov: aov.state,
      clampCount: state.clampCount + volumeClampHit01 + laVolumeClampHit01,
    };
  }
  const finalBeat = params.beats - 2;
  const finalBeatSamples = samples.filter((sample) => sample.beat === finalBeat);
  return { params, samples, finalBeatSamples, clampCount: state.clampCount };
}

function leftAtrialPressure(theta: number, laVolumeMl: number, params: LeftHeartSubsystemParamsV1): number {
  return params.laPressureBaselineMmHg
    + (laVolumeMl - params.laReferenceVolumeMl) / Math.max(params.laComplianceMlPerMmHg, 1e-9)
    + params.laAWaveMmHg * raisedCosineWindow(theta, 0.82, 0.98);
}

function raisedCosineWindow(theta: number, start: number, end: number): number {
  if (theta < start || theta > end) return 0;
  const x = (theta - start) / Math.max(end - start, 1e-9);
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
}
