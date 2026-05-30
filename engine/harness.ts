import { ModelCore } from "@/engine/ModelCore";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";

/**
 * Deterministic scenario runner used by regression tests and (later) by
 * preview-vs-accurate comparisons. The ModelCore integrator uses no Date/random,
 * so a fixed dt yields byte-identical results across runs on the same platform.
 */
export type ScenarioOptions = {
  /** Target total blood volume (mL) used to seed venous pressures. Mirrors Workbench. */
  targetTBV?: number;
  /** Seconds discarded before measurement, to reach periodic steady state. */
  settleSeconds?: number;
  /**
   * How to settle. "fixed" runs settleSeconds (the frozen baseline change-detector
   * path — keeps the snapshot byte-stable). "converge" settles to the true limit
   * cycle via the steady-state detector (correct, but lands on a different state).
   */
  settleMode?: "fixed" | "converge";
  /** Seconds of measured simulation after settling. */
  measureSeconds?: number;
  /** Integration step (s). */
  dt?: number;
  /** Sampling rate (Hz) for the recorded waveform history. */
  sampleHz?: number;
};

export type ScenarioResult = {
  core: ModelCore;
  metrics: SimMetrics;
  health: SimulationHealth;
  samples: SimSample[];
  /** TBV (mL) at the end of the settle phase = start of the measurement window. */
  tbvStart: number;
  /** TBV (mL) at the end of the measurement window. */
  tbvEnd: number;
  /** Length of the measurement window (s). */
  measureSeconds: number;
  /** Mass-conservation drift over the measurement window, normalized to %/60s. */
  driftPctPer60s: number;
};

export type ValveName = "MV" | "AoV" | "TV" | "PV";
export type ValveExtremes = Record<ValveName, { min: number; max: number }>;

export const BASELINE_OPTIONS: Required<ScenarioOptions> = {
  targetTBV: 5600,
  settleSeconds: 8,
  settleMode: "fixed",
  measureSeconds: 30,
  dt: 0.001,
  sampleHz: 120,
};

export function runScenario(
  params: Partial<CoreRuntimeParams>,
  options: ScenarioOptions = {},
): ScenarioResult {
  const opt = { ...BASELINE_OPTIONS, ...options };
  const core = new ModelCore(params);
  core.initializeVenousPressuresForTargetTBV(opt.targetTBV);
  if (opt.settleMode === "converge") {
    core.settleToSteady(undefined, opt.dt, opt.sampleHz);
  } else {
    core.runFor(opt.settleSeconds, opt.dt, opt.sampleHz);
  }
  const tbvStart = core.sample().TBV;
  const samples = core.runFor(opt.measureSeconds, opt.dt, opt.sampleHz);
  const tbvEnd = samples.at(-1)?.TBV ?? core.sample().TBV;
  // Drift measured over the known measurement window (excludes settle transient),
  // normalized to %/60s so the §6 acceptance threshold applies directly.
  const driftPctPer60s =
    tbvStart > 0
      ? (100 * (tbvEnd - tbvStart) / tbvStart) * (60 / opt.measureSeconds)
      : 0;
  return {
    core,
    metrics: core.metrics(),
    health: core.health(),
    samples,
    tbvStart,
    tbvEnd,
    measureSeconds: opt.measureSeconds,
    driftPctPer60s,
  };
}

/**
 * Advance the core and record per-valve min/max opening over the window.
 * Used to prove valves actually open AND close (vs. a vacuous "xi in [0,1]"
 * check that only verifies sanitizeState's clamp).
 */
export function recordValveExtremes(
  core: ModelCore,
  seconds: number,
  dt = 0.001,
): ValveExtremes {
  const names: ValveName[] = ["MV", "AoV", "TV", "PV"];
  const ext = {} as ValveExtremes;
  for (const n of names) ext[n] = { min: Infinity, max: -Infinity };
  const steps = Math.max(1, Math.round(seconds / dt));
  for (let i = 0; i < steps; i++) {
    core.step(dt);
    const xi = core.debugValveOpenings();
    for (const n of names) {
      const v = xi[n];
      if (v < ext[n].min) ext[n].min = v;
      if (v > ext[n].max) ext[n].max = v;
    }
  }
  return ext;
}

/** Round helper so snapshots tolerate last-digit floating noise. */
const r = (x: number, dp: number): number => {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
};

/**
 * Compact, rounded summary used as the change-detection snapshot.
 * NOTE: this is a baseline freeze (detects unintended behavior changes).
 * It is NOT a claim of physiological validity — that is M12's responsibility.
 */
export function summarize(result: ScenarioResult) {
  const m = result.metrics;
  return {
    HR: r(m.HR, 0),
    AoP_sys: r(m.AoPSys, 1),
    AoP_dia: r(m.AoPDia, 1),
    AoP_mean: r(m.AoPMean, 1),
    PAP_mean: r(m.PAPMean, 1),
    RAP_mean: r(m.RAPMean, 1),
    LAP_mean: r(m.LAPMean, 1),
    SV_L: r(m.SV_L, 1),
    SV_R: r(m.SV_R, 1),
    CO_L: r(m.CO_L, 2),
    CO_R: r(m.CO_R, 2),
    // EF kept at 2dp: it is a min/max-over-beat approximation and at 3dp sits
    // near a rounding boundary, risking cross-platform snapshot flips.
    EF_L: r(m.EF_LApprox, 2),
    EF_R: r(m.EF_RApprox, 2),
  };
}
