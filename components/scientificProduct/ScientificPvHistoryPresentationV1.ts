import {
  DEFAULT_PV_LOOP_HISTORY_BEATS,
  type PvLoopHistoryMode,
} from "@/types";

/**
 * One shared history contract for native PV trajectories, textbook
 * ESPVR/EDPVR guides, and research relation overlays.
 */
export function normalizeScientificPvHistoryBeatsV1(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PV_LOOP_HISTORY_BEATS;
  return Math.min(16, Math.max(0, Math.round(value)));
}

/**
 * Continuous age is measured in beats from the newest accepted sample.
 * Fade mode therefore has no step at a cycle or parameter boundary.
 * Persistent mode eases from the live stroke to its constant historical
 * opacity during the first beat, then remains bounded until expiry.
 */
export function scientificPvHistoryAlphaV1(
  ageBeats: number,
  historyBeats: number,
  mode: PvLoopHistoryMode,
): number {
  const age = Number.isFinite(ageBeats) ? Math.max(0, ageBeats) : 0;
  if (age <= 0) return 1;
  const horizon = normalizeScientificPvHistoryBeatsV1(historyBeats);
  if (horizon === 0 || age > horizon) return 0;
  if (mode === "persistent") {
    return age < 1
      ? 1 - (1 - 0.34) * age
      : 0.34;
  }
  return Math.max(0, 1 - age / horizon);
}
