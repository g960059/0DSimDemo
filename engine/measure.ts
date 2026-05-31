import { ModelCore, defaultParams } from "@/engine/ModelCore";
import type {
  CoreRuntimeParams,
  SimMetrics,
  SimSample,
  SimulationHealth,
  VenousGroupBalances,
} from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy, type SettleStatus } from "@/engine/settling";

export type MeasureOptions = {
  targetTBV?: number;
  dt?: number;
  sampleHz?: number;
  settlePolicy?: SettlePolicy;
  measureBeats?: number;
  requireProjectorQuiet?: boolean;
};

export type SteadySettleOk = {
  ok: true;
  core: ModelCore;
  settleStatus: SettleStatus & { actualSeconds: number };
};

export type SteadySettleNotOk = {
  ok: false;
  core: ModelCore;
  settleStatus: SettleStatus;
};

export type SteadySettleResult = SteadySettleOk | SteadySettleNotOk;

export type AtrialLoopFeatures = {
  selfIntersections: number;
  vPeak: number;
  aPeak: number;
  vArea: number;
  aArea: number;
  collapse: boolean;
  volumeMax: number;
  volumeMin: number;
  emptyingFraction: number;
};

export type VenousBalanceMeasurement = {
  start: VenousGroupBalances;
  end: VenousGroupBalances;
  systemicResidualMl: number;
  pulmonaryResidualMl: number;
  maxResidualMl: number;
};

export type SteadyMeasurement = {
  core: ModelCore;
  settleStatus: SettleStatus & { actualSeconds: number };
  samples: SimSample[];
  metrics: SimMetrics;
  health: SimulationHealth;
  measureSeconds: number;
  measureBeats: number;
  tbvStart: number;
  tbvEnd: number;
  tbvDriftMl: number;
  forwardCO_L: number;
  forwardCO_R: number;
  forwardCODiffLMin: number;
  netCO_L: number;
  netCO_R: number;
  netCODiffLMin: number;
  LA: AtrialLoopFeatures;
  RA: AtrialLoopFeatures;
  phaseTiming: PhaseTimingMetrics;
  venousBalances: VenousBalanceMeasurement;
  projectorQuiet: boolean;
};

export type PhaseTimingMetrics = {
  caPulseOnsetTheta: { LA: number | null; RA: number | null };
  activeAPeakTheta: { LA: number | null; RA: number | null };
  pressureAPeakTheta: { LA: number | null; RA: number | null };
  valveCloseTheta: { MV: number | null; TV: number | null };
  dPdtMaxTheta: { LV: number | null; RV: number | null };
  msFromVentricularPhaseZero: {
    caPulseOnset: { LA: number | null; RA: number | null };
    activeAPeak: { LA: number | null; RA: number | null };
    pressureAPeak: { LA: number | null; RA: number | null };
    valveClose: { MV: number | null; TV: number | null };
    dPdtMax: { LV: number | null; RV: number | null };
  };
};

const DEFAULT_OPTIONS: Required<MeasureOptions> = {
  targetTBV: 5600,
  dt: 0.001,
  sampleHz: 240,
  settlePolicy: DEFAULT_SETTLE_POLICY,
  measureBeats: 3,
  requireProjectorQuiet: true,
};

function resolveMeasureOptions(options: MeasureOptions = {}): Required<MeasureOptions> {
  const opt = { ...DEFAULT_OPTIONS, ...options };
  opt.sampleHz = Math.max(opt.sampleHz, Math.ceil(1 / Math.max(opt.dt, 1e-6)));
  return opt;
}

export function settleToSteadyState(
  params: Partial<CoreRuntimeParams> = defaultParams(),
  options: MeasureOptions = {},
): SteadySettleResult {
  const opt = resolveMeasureOptions(options);
  const core = new ModelCore(params);
  core.initializeVenousPressuresForTargetTBV(opt.targetTBV);
  const settleStatus = core.settleToSteady(opt.settlePolicy, opt.dt, opt.sampleHz);
  if (!settleStatus.settled || settleStatus.actualSeconds == null) {
    return { ok: false, core, settleStatus };
  }
  return { ok: true, core, settleStatus: settleStatus as SettleStatus & { actualSeconds: number } };
}

export function measureSteady(
  core: ModelCore,
  settleStatus: SettleStatus & { actualSeconds: number },
  options: MeasureOptions = {},
): SteadyMeasurement {
  const opt = resolveMeasureOptions(options);
  alignToNextBeat(core, opt.dt, opt.sampleHz);
  core.resetTBVCorrectionCounters();
  core.setTBVCorrectionEnabled(false);
  const startBalance = core.debugVenousGroupBalances();
  const tbvStart = core.sample().TBV;
  let samples: SimSample[];
  try {
    samples = runForBeatWindow(core, opt.measureBeats, opt.dt, opt.sampleHz);
  } finally {
    core.setTBVCorrectionEnabled(true);
  }
  const endBalance = core.debugVenousGroupBalances();
  const tbvEnd = samples.at(-1)?.TBV ?? core.sample().TBV;
  const measureSeconds = samples.length > 1 ? samples.at(-1)!.t - samples[0].t : 0;
  const integrals = integrateSamples(samples, opt.sampleHz);
  const systemicResidualMl =
    (endBalance.systemicVenous.volume - startBalance.systemicVenous.volume) - integrals.systemicNetMl;
  const pulmonaryResidualMl =
    (endBalance.pulmonaryVenous.volume - startBalance.pulmonaryVenous.volume) - integrals.pulmonaryNetMl;
  const maxResidualMl = Math.max(Math.abs(systemicResidualMl), Math.abs(pulmonaryResidualMl));
  const projectorQuiet =
    maxResidualMl < 0.05 &&
    endBalance.tbvCorrectionMagPerBeat < 0.05 &&
    Math.abs(endBalance.tbvErrorMl) < 0.05;

  return {
    core,
    settleStatus,
    samples,
    metrics: core.metrics(),
    health: core.health(),
    measureSeconds,
    measureBeats: opt.measureBeats,
    tbvStart,
    tbvEnd,
    tbvDriftMl: tbvEnd - tbvStart,
    forwardCO_L: integrals.forwardCO_L,
    forwardCO_R: integrals.forwardCO_R,
    forwardCODiffLMin: Math.abs(integrals.forwardCO_L - integrals.forwardCO_R),
    netCO_L: integrals.netCO_L,
    netCO_R: integrals.netCO_R,
    netCODiffLMin: Math.abs(integrals.netCO_L - integrals.netCO_R),
    LA: atrialLoopFeatures(samples, "LA"),
    RA: atrialLoopFeatures(samples, "RA"),
    phaseTiming: phaseTimingMetrics(samples, core.p.HR),
    venousBalances: {
      start: startBalance,
      end: endBalance,
      systemicResidualMl,
      pulmonaryResidualMl,
      maxResidualMl,
    },
    projectorQuiet,
  };
}

function phaseTimingMetrics(samples: SimSample[], HR: number): PhaseTimingMetrics {
  const beatSeconds = 60 / Math.max(HR, 1);
  const thetaToMs = (theta: number | null) => theta == null ? null : signedPhaseMs(theta, beatSeconds);
  const out = {
    caPulseOnsetTheta: { LA: firstRiseTheta(samples, "aLA"), RA: firstRiseTheta(samples, "aRA") },
    activeAPeakTheta: { LA: maxTheta(samples, "aLA"), RA: maxTheta(samples, "aRA") },
    pressureAPeakTheta: { LA: pressureAPeakTheta(samples, "LA"), RA: pressureAPeakTheta(samples, "RA") },
    valveCloseTheta: { MV: valveCloseTheta(samples, "QMV"), TV: valveCloseTheta(samples, "QTV") },
    dPdtMaxTheta: { LV: dPdtMaxTheta(samples, "LVP"), RV: dPdtMaxTheta(samples, "RVP") },
  };
  return {
    ...out,
    msFromVentricularPhaseZero: {
      caPulseOnset: { LA: thetaToMs(out.caPulseOnsetTheta.LA), RA: thetaToMs(out.caPulseOnsetTheta.RA) },
      activeAPeak: { LA: thetaToMs(out.activeAPeakTheta.LA), RA: thetaToMs(out.activeAPeakTheta.RA) },
      pressureAPeak: { LA: thetaToMs(out.pressureAPeakTheta.LA), RA: thetaToMs(out.pressureAPeakTheta.RA) },
      valveClose: { MV: thetaToMs(out.valveCloseTheta.MV), TV: thetaToMs(out.valveCloseTheta.TV) },
      dPdtMax: { LV: thetaToMs(out.dPdtMaxTheta.LV), RV: thetaToMs(out.dPdtMaxTheta.RV) },
    },
  };
}

function phaseOf(s: SimSample): number {
  return s.phi - Math.floor(s.phi);
}

function signedPhaseMs(theta: number, beatSeconds: number): number {
  const signedTheta = theta > 0.5 ? theta - 1 : theta;
  return signedTheta * beatSeconds * 1000;
}

function firstRiseTheta(samples: SimSample[], key: "aLA" | "aRA"): number | null {
  if (samples.length < 2) return null;
  const maxVal = Math.max(...samples.map((s) => s[key]));
  const threshold = Math.max(0.02, maxVal * 0.15);
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1][key] < threshold && samples[i][key] >= threshold) return phaseOf(samples[i]);
  }
  return null;
}

function maxTheta(samples: SimSample[], key: "aLA" | "aRA"): number | null {
  if (samples.length === 0) return null;
  return phaseOf(samples.reduce((best, s) => s[key] > best[key] ? s : best, samples[0]));
}

function pressureAPeakTheta(samples: SimSample[], side: "LA" | "RA"): number | null {
  const key = side === "LA" ? "LAP" : "RAP";
  const candidates = samples.filter((s) => {
    const p = phaseOf(s);
    return p >= 0.65 || p <= 0.15;
  });
  if (candidates.length === 0) return null;
  return phaseOf(candidates.reduce((best, s) => s[key] > best[key] ? s : best, candidates[0]));
}

function valveCloseTheta(samples: SimSample[], key: "QMV" | "QTV"): number | null {
  if (samples.length < 2) return null;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1][key] > 0 && samples[i][key] <= 0) return phaseOf(samples[i]);
  }
  return null;
}

function dPdtMaxTheta(samples: SimSample[], key: "LVP" | "RVP"): number | null {
  if (samples.length < 2) return null;
  let bestI = 1;
  let best = -Infinity;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    if (dt <= 0) continue;
    const dpdt = (samples[i][key] - samples[i - 1][key]) / dt;
    if (dpdt > best) {
      best = dpdt;
      bestI = i;
    }
  }
  return Number.isFinite(best) ? phaseOf(samples[bestI]) : null;
}

export function measureConverged(
  params: Partial<CoreRuntimeParams> = defaultParams(),
  options: MeasureOptions = {},
): SteadyMeasurement {
  const settled = settleToSteadyState(params, options);
  if (!settled.ok) {
    throw new Error(
      `measureConverged: model did not settle (${settled.settleStatus.reason}; ` +
      `beats=${settled.settleStatus.beats}; worst=${settled.settleStatus.worstSignal ?? "none"}; ` +
      `delta=${settled.settleStatus.worstDelta})`,
    );
  }
  const measurement = measureSteady(settled.core, settled.settleStatus, options);
  const requireQuiet = options.requireProjectorQuiet ?? DEFAULT_OPTIONS.requireProjectorQuiet;
  if (requireQuiet && !measurement.projectorQuiet) {
    throw new Error(
      `measureConverged: projector not quiet (` +
      `venousResidual=${measurement.venousBalances.maxResidualMl}; ` +
      `correction=${measurement.venousBalances.end.tbvCorrectionMagPerBeat}; ` +
      `tbvError=${measurement.venousBalances.end.tbvErrorMl})`,
    );
  }
  return measurement;
}

function alignToNextBeat(core: ModelCore, dt: number, sampleHz: number): void {
  const startBeat = Math.floor(core.sample().phi);
  let guard = 0;
  while (Math.floor(core.sample().phi) === startBeat && guard < 120000) {
    core.runFor(Math.min(0.01, dt * 10), dt, sampleHz);
    guard++;
  }
}

function runForBeatWindow(core: ModelCore, beats: number, dt: number, sampleHz: number): SimSample[] {
  const seconds = Math.max(1, Math.round(beats)) * (60 / Math.max(core.p.HR, 1));
  return [core.sample(), ...core.runFor(seconds, dt, sampleHz)];
}

function integrateSamples(samples: SimSample[], sampleHz: number) {
  let forwardAoMl = 0;
  let forwardPaMl = 0;
  let netAoMl = 0;
  let netPaMl = 0;
  let systemicNetMl = 0;
  let pulmonaryNetMl = 0;
  let duration = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const dt = b.t - a.t;
    duration += dt;
    forwardAoMl += trap(dt, Math.max(0, a.QAo), Math.max(0, b.QAo));
    forwardPaMl += trap(dt, Math.max(0, a.QPA), Math.max(0, b.QPA));
    netAoMl += trap(dt, a.QAo, b.QAo);
    netPaMl += trap(dt, a.QPA, b.QPA);
    systemicNetMl += trap(dt, a.QCapSV - a.SVF, b.QCapSV - b.SVF);
    pulmonaryNetMl += trap(dt, a.QPArtPCap - a.PVF, b.QPArtPCap - b.PVF);
  }
  const toLMin = duration > 0 ? 60 / (1000 * duration) : 0;
  return {
    forwardCO_L: forwardAoMl * toLMin,
    forwardCO_R: forwardPaMl * toLMin,
    netCO_L: netAoMl * toLMin,
    netCO_R: netPaMl * toLMin,
    systemicNetMl,
    pulmonaryNetMl,
    sampleHz,
  };
}

function atrialLoopFeatures(samples: SimSample[], side: "LA" | "RA"): AtrialLoopFeatures {
  const pKey = side === "LA" ? "LAP" : "RAP";
  const vKey = side === "LA" ? "VLA" : "VRA";
  const pressures = samples.map((s) => Number(s[pKey]));
  const volumes = samples.map((s) => Number(s[vKey]));
  const phases = samples.map((s) => s.phi - Math.floor(s.phi));
  const volumeMax = Math.max(...volumes);
  const volumeMin = Math.min(...volumes);
  return {
    selfIntersections: countSelfIntersections(volumes, pressures),
    vPeak: peakInPhase(pressures, phases, 0.25, 0.75),
    aPeak: Math.max(peakInPhase(pressures, phases, 0.75, 1.0), peakInPhase(pressures, phases, 0.0, 0.15)),
    vArea: areaInPhase(pressures, samples, phases, 0.25, 0.75),
    aArea: areaInPhase(pressures, samples, phases, 0.75, 1.0) + areaInPhase(pressures, samples, phases, 0.0, 0.15),
    collapse: volumeMin <= 3.5 || Math.min(...pressures) <= -4.5,
    volumeMax,
    volumeMin,
    emptyingFraction: volumeMax > 1e-9 ? (volumeMax - volumeMin) / volumeMax : 0,
  };
}

function trap(dt: number, a: number, b: number): number {
  return 0.5 * dt * (a + b);
}

function peakInPhase(values: number[], phases: number[], lo: number, hi: number): number {
  const selected = values.filter((_, i) => phases[i] >= lo && phases[i] < hi);
  return selected.length > 0 ? Math.max(...selected) : Math.max(...values);
}

function areaInPhase(values: number[], samples: SimSample[], phases: number[], lo: number, hi: number): number {
  let area = 0;
  for (let i = 1; i < values.length; i++) {
    if (phases[i] < lo || phases[i] >= hi) continue;
    area += trap(samples[i].t - samples[i - 1].t, values[i - 1], values[i]);
  }
  return area;
}

function countSelfIntersections(xs: number[], ys: number[]): number {
  let count = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = i + 2; j < xs.length - 1; j++) {
      if (i === 0 && j === xs.length - 2) continue;
      if (segmentsIntersect(xs[i], ys[i], xs[i + 1], ys[i + 1], xs[j], ys[j], xs[j + 1], ys[j + 1])) count++;
    }
  }
  return count;
}

function segmentsIntersect(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number,
): boolean {
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}
