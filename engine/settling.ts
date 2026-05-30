// Periodic steady-state (limit-cycle) detection for the 0D model.
// See docs/state-snapshot-and-steady-state.md §2.
//
// Strategy: reduce each completed cardiac beat to a small multivariate
// "fingerprint", then declare steady state when consecutive beat fingerprints
// agree within a scale-free tolerance for N beats in a row. The comparison is
// per-beat (not instantaneous same-phase), because the sample grid is
// wall-clock, not phase-locked, so instantaneous beat-to-beat is alias-noisy.

/** The signals compared between consecutive beats. */
export type SignalKey =
  | "aopMean" | "aopSys" | "aopDia"
  | "papMean" | "papSys" | "papDia"
  | "rapMean" | "lapMean"
  | "svL" | "svR"
  | "edvL" | "esvL" | "edvR" | "esvR"
  | "lvEdp" | "rvEdp"
  | "pmsf" | "tbv";

/** One completed beat's fingerprint. `beat` = floor(phi) of the closed beat. */
export type BeatSummary = { beat: number; vals: Record<SignalKey, number> };

export type SettleReason =
  | "converged" | "converging" | "insufficient" | "cap" | "forced-trend";

export type SettleStatus = {
  settled: boolean;
  reason: SettleReason;
  beats: number;          // total completed beats observed since reset
  worstSignal: SignalKey | null;
  worstDelta: number;     // max normalized beat-to-beat delta over the checked pairs
  actualSeconds?: number; // set by settleToSteady()
};

export type SettlePolicy = {
  tolPrimary: number;     // normalized tolerance for primary signals
  tolShape: number;       // looser tolerance for shape signals
  consecutiveBeats: number; // quiet beat-pairs required in a row
  minBeats: number;       // total beats before "settled" can be declared
  capSeconds: number;     // hard cap for settleToSteady
  postSettleBeats: number;// extra beats to run after settling (phase margin)
};

/**
 * Tight tier — tests / harness / BASELINE_STEADY_STATE generation.
 * tolPrimary=0.005 sits comfortably above the sampling-grid aliasing floor
 * (~0.002, measured: small filling-pressure signals like LAP jitter ~0.01 mmHg
 * beat-to-beat on the true limit cycle) yet far below transient deltas (5-30%),
 * so isSettled() is stable rather than flickering at the boundary.
 */
export const DEFAULT_SETTLE_POLICY: SettlePolicy = {
  tolPrimary: 0.005,
  tolShape: 0.01,
  consecutiveBeats: 3,
  minBeats: 8,
  capSeconds: 90,
  postSettleBeats: 1,
};

/** Loose tier — live preview pre-settle (visually indistinguishable, faster). */
export const PREVIEW_SETTLE_POLICY: SettlePolicy = {
  tolPrimary: 0.01,
  tolShape: 0.02,
  consecutiveBeats: 3,
  minBeats: 6,
  capSeconds: 25,
  postSettleBeats: 1,
};

// Fixed nominal scales (mmHg / mL) keep the convergence test scale-free AND
// deterministic (not dependent on the live magnitude, which would break across
// shock/hypertension operating points).
const FLOOR: Record<SignalKey, number> = {
  aopMean: 20, aopSys: 20, aopDia: 20,
  papMean: 10, papSys: 10, papDia: 5,
  rapMean: 5, lapMean: 5,
  svL: 10, svR: 10,
  edvL: 20, esvL: 20, edvR: 20, esvR: 20,
  lvEdp: 5, rvEdp: 5,
  pmsf: 5, tbv: 1000,
};

const PRIMARY: SignalKey[] = ["aopMean", "papMean", "rapMean", "lapMean", "svL", "svR", "edvL", "edvR", "pmsf", "tbv"];
const SHAPE: SignalKey[] = ["aopSys", "aopDia", "papSys", "papDia", "esvL", "esvR", "lvEdp", "rvEdp"];

export const ALL_SIGNALS: SignalKey[] = [...PRIMARY, ...SHAPE];

/** Scale-free relative change with a fixed floor so near-zero signals don't blow up. */
function relDelta(a: number, b: number, floor: number): number {
  return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), floor);
}

/**
 * Assess the ring of beat fingerprints (period-1 limit cycle).
 * `totalBeats` is the count of completed beats since reset (>= ring.length).
 * Pure: no engine access.
 */
export function assessBeatRing(
  ring: BeatSummary[],
  totalBeats: number,
  policy: SettlePolicy,
): SettleStatus {
  const need = policy.consecutiveBeats + 1; // N pairs need N+1 beats
  if (totalBeats < policy.minBeats || ring.length < need) {
    return { settled: false, reason: "insufficient", beats: totalBeats, worstSignal: null, worstDelta: NaN };
  }

  // Check the last N consecutive beat-pairs. A pair passes if all primary
  // deltas < tolPrimary and all shape deltas < tolShape. worst* is the max
  // normalized delta across the checked pairs (for diagnostics).
  let worstDelta = 0;
  let worstSignal: SignalKey | null = null;
  let allPass = true;

  for (let p = 0; p < policy.consecutiveBeats; p++) {
    const cur = ring[ring.length - 1 - p];
    const prev = ring[ring.length - 2 - p];
    for (const sig of ALL_SIGNALS) {
      const d = relDelta(cur.vals[sig], prev.vals[sig], FLOOR[sig]);
      const tol = PRIMARY.includes(sig) ? policy.tolPrimary : policy.tolShape;
      if (d > worstDelta) { worstDelta = d; worstSignal = sig; }
      if (d > tol) allPass = false;
    }
  }

  return {
    settled: allPass,
    reason: allPass ? "converged" : "converging",
    beats: totalBeats,
    worstSignal,
    worstDelta,
  };
}
