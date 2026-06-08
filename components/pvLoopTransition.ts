export const PV_LOOP_ACTIVE_ALPHA = 1;
export const PV_LOOP_PENDING_ALPHA = 0.45;
export const PV_LOOP_GHOST_ALPHA = 0.3;
export const PV_LOOP_GHOST_DURATION_SEC = 5;

export type PvLoopTransitionStatus = "pending" | "settling" | "promoted";

export type PvLoopPreviousEpochForGhost = {
  wipeStartedAtT: number;
};

export type PvLoopDrawPlan = {
  currentAlpha: number;
  markerAlpha: number;
  previousAlpha: number;
  showPrevious: boolean;
};

export function buildPvLoopDrawPlan({
  status,
  previousEpoch,
  instanceLatestT,
}: {
  status?: PvLoopTransitionStatus;
  previousEpoch?: PvLoopPreviousEpochForGhost;
  instanceLatestT: number;
}): PvLoopDrawPlan {
  if (status === "pending") {
    return {
      currentAlpha: PV_LOOP_PENDING_ALPHA,
      markerAlpha: PV_LOOP_PENDING_ALPHA,
      previousAlpha: 0,
      showPrevious: false,
    };
  }

  if (status === "promoted" && previousEpoch) {
    const elapsed = instanceLatestT - previousEpoch.wipeStartedAtT;
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < PV_LOOP_GHOST_DURATION_SEC) {
      return {
        currentAlpha: PV_LOOP_ACTIVE_ALPHA,
        markerAlpha: PV_LOOP_ACTIVE_ALPHA,
        previousAlpha: PV_LOOP_GHOST_ALPHA,
        showPrevious: true,
      };
    }
  }

  return {
    currentAlpha: PV_LOOP_ACTIVE_ALPHA,
    markerAlpha: PV_LOOP_ACTIVE_ALPHA,
    previousAlpha: 0,
    showPrevious: false,
  };
}
