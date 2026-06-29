import { defaultParams, type ModelCore } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState, type MeasureOptions, type SteadyMeasurement } from "@/engine/measure";
import { createModelCoreRuntimeExperimentalOptions } from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import type {
  RunToPeriodicSteadyOptions,
  SolverStats,
  SteadyResiduals,
  SteadyResult,
  SteadyStatus,
} from "@/engine/stateContract";

const DEFAULT_DT = 0.001;
const DEFAULT_SAMPLE_HZ = 240;

export type PeriodicSteadyInternalRun = {
  result: SteadyResult;
  settleStatus: SettleStatus;
  measurement: SteadyMeasurement | null;
  core: ModelCore;
};

export function runToPeriodicSteady(
  params: Partial<CoreRuntimeParams> = defaultParams(),
  options: RunToPeriodicSteadyOptions = {},
): SteadyResult {
  return runToPeriodicSteadyInternal(params, options).result;
}

export function runToPeriodicSteadyInternal(
  params: Partial<CoreRuntimeParams> = defaultParams(),
  options: RunToPeriodicSteadyOptions = {},
): PeriodicSteadyInternalRun {
  const wallStart = options.includeWallMs ? performanceNow() : 0;
  const { runtimeActiveSourceMode, ...measureInput } = options;
  const measureOptions: MeasureOptions = {
    ...measureInput,
    ...(runtimeActiveSourceMode
      ? { experimentalOptions: createModelCoreRuntimeExperimentalOptions({ mode: runtimeActiveSourceMode }) }
      : {}),
  };
  const settled = settleToSteadyState(params, measureOptions);
  const measurement = settled.ok ? measureSteady(settled.core, settled.settleStatus, measureOptions) : null;
  const core = measurement?.core ?? settled.core;
  const metrics = measurement?.metrics ?? core.metrics();
  const health = measurement?.health ?? core.health();
  const requireProjectorQuiet = options.requireProjectorQuiet ?? true;
  const status = mapStatus(settled.settleStatus, health, measurement, requireProjectorQuiet);
  const state = core.packState();
  const comparableState = core.getComparableState();
  const result: SteadyResult = {
    ok: status === "converged",
    status,
    metrics,
    health,
    state,
    comparableState,
    residuals: residuals(settled.settleStatus, metrics, health, measurement),
    solverStats: solverStats(options, settled.settleStatus, measurement, wallStart),
  };
  if (options.includeLastBeatSamples === true && measurement) {
    result.lastBeatSamples = lastBeatSamples(measurement.samples);
  }
  return {
    result,
    settleStatus: settled.settleStatus,
    measurement,
    core,
  };
}

function mapStatus(
  settleStatus: SettleStatus,
  health: SimulationHealth,
  measurement: SteadyMeasurement | null,
  requireProjectorQuiet: boolean,
): SteadyStatus {
  if (settleStatus.reason === "forced-trend") return "forced-trend";
  if (!settleStatus.settled || settleStatus.reason === "cap") return "cap";
  if (health.status === "failed") return "unstable";
  if (requireProjectorQuiet && measurement && !measurement.projectorQuiet) return "projector-not-quiet";
  return "converged";
}

function residuals(
  settleStatus: SettleStatus,
  metrics: SimMetrics,
  health: SimulationHealth,
  measurement: SteadyMeasurement | null,
): SteadyResiduals {
  const leftRightSvMismatchLMin = measurement?.forwardCODiffLMin ?? health.leftRightFlowMismatchLMin;
  const left = measurement?.forwardCO_L ?? metrics.CO_L;
  const right = measurement?.forwardCO_R ?? metrics.CO_R;
  const denom = Math.max(0.5 * (Math.abs(left) + Math.abs(right)), 1e-9);
  const measureSeconds = measurement?.measureSeconds ?? 0;
  const tbvStart = measurement?.tbvStart ?? metrics.TBV;
  const tbvDriftMl = measurement?.tbvDriftMl ?? health.tbvDriftMl;
  const tbvDriftPct = tbvStart > 0 ? (100 * tbvDriftMl) / tbvStart : 0;
  const fallbackSeconds = settleStatus.actualSeconds ?? 0;
  return {
    worstSignal: settleStatus.worstSignal,
    worstDelta: Number.isFinite(settleStatus.worstDelta) ? settleStatus.worstDelta : null,
    leftRightSvMismatchLMin,
    leftRightSvMismatchPct: (100 * leftRightSvMismatchLMin) / denom,
    tbvDriftMl,
    tbvDriftPctPer60s: measureSeconds > 0
      ? tbvDriftPct * (60 / measureSeconds)
      : fallbackSeconds > 0
        ? health.tbvDriftPercent * (60 / fallbackSeconds)
        : null,
    venousMaxResidualMl: measurement?.venousBalances.maxResidualMl ?? null,
    projectorQuiet: measurement?.projectorQuiet ?? false,
  };
}

function solverStats(
  options: RunToPeriodicSteadyOptions,
  settleStatus: SettleStatus,
  measurement: SteadyMeasurement | null,
  wallStart: number,
): SolverStats {
  const dt = options.dt ?? DEFAULT_DT;
  const sampleHz = Math.max(options.sampleHz ?? DEFAULT_SAMPLE_HZ, Math.ceil(1 / Math.max(dt, 1e-6)));
  const settleSeconds = settleStatus.actualSeconds ?? 0;
  const measureSeconds = measurement?.measureSeconds ?? 0;
  const stats: SolverStats = {
    kind: "fixed-heun",
    dt,
    sampleHz,
    nSteps: Math.max(0, Math.round((settleSeconds + measureSeconds) / Math.max(dt, 1e-9))),
    settleSeconds,
    measureSeconds,
    nBeats: settleStatus.beats,
  };
  if (options.includeWallMs) stats.wallMs = Math.max(0, performanceNow() - wallStart);
  return stats;
}

function lastBeatSamples(samples: SimSample[]): SimSample[] {
  if (samples.length === 0) return [];
  const counts = new Map<number, number>();
  for (const sample of samples) counts.set(Math.floor(sample.phi), (counts.get(Math.floor(sample.phi)) ?? 0) + 1);
  const completeBeat = [...counts.entries()]
    .filter(([, count]) => count >= 5)
    .map(([beat]) => beat)
    .sort((a, b) => b - a)[0];
  const lastBeat = completeBeat ?? Math.floor(samples[samples.length - 1].phi);
  const beat = samples.filter((sample) => Math.floor(sample.phi) === lastBeat);
  return beat.length > 0 ? beat : [samples[samples.length - 1]];
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}

export type {
  RunToPeriodicSteadyOptions,
  SolverStats,
  SteadyResiduals,
  SteadyResult,
  SteadyStatus,
} from "@/engine/stateContract";
