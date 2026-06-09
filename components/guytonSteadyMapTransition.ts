import {
  defaultGuytonAxis,
  expandGuytonAxisToFit,
  guytonSnapshotPoints,
  type GuytonAxisDomain,
  type GuytonBaseMapResponse,
  type GuytonPaneData,
  type GuytonSide,
  type StarlingSweepProgressMessage,
  type StarlingSweepResponse,
} from "@/engine/guytonStarling";

export const GUYTON_STEADY_GHOST_ALPHA = 0.3;
export const GUYTON_STEADY_GHOST_DURATION_MS = 5000;

export type GuytonSteadyMap = {
  signature: string;
  pane: GuytonPaneData;
  sweep: StarlingSweepResponse;
  axis: GuytonAxisDomain;
  warnings: string[];
  promotedAtMs: number;
};

export type GuytonSteadyMapGhost = GuytonSteadyMap & {
  expiresAtMs?: number;
};

export type GuytonSteadyMapPreview = {
  signature: string;
  pane: GuytonPaneData;
  sweep?: StarlingSweepProgressMessage;
  axis: GuytonAxisDomain;
  warnings: string[];
  progress?: {
    completedPoints: number;
    totalPoints: number;
  };
  updatedAtMs: number;
};

export type GuytonPendingSteadyMap = {
  signature: string;
  baseMap?: GuytonPaneData;
  progressSweep?: StarlingSweepProgressMessage;
  sweep?: StarlingSweepResponse;
  warnings: string[];
};

export type GuytonSteadyMapState = {
  axis: GuytonAxisDomain;
  current?: GuytonSteadyMap;
  pending?: GuytonPendingSteadyMap;
  preview?: GuytonSteadyMapPreview;
  ghost?: GuytonSteadyMapGhost;
};

export function initialGuytonSteadyMapState(side: GuytonSide): GuytonSteadyMapState {
  return { axis: defaultGuytonAxis(side) };
}

export function beginGuytonSteadyMapRequest(
  state: GuytonSteadyMapState,
  signature: string,
  nowMs: number,
  options: { force?: boolean } = {},
): GuytonSteadyMapState {
  const sameCurrent = state.current?.signature === signature;
  const samePending = state.pending?.signature === signature;
  if (sameCurrent && !options.force) {
    return expireGuytonSteadyMapGhost({ ...state, pending: undefined, preview: undefined }, nowMs);
  }
  if (samePending && !options.force) return expireGuytonSteadyMapGhost(state, nowMs);

  const nextGhost = state.current
    ? ghostFromCurrent(state.current)
    : state.ghost;

  return expireGuytonSteadyMapGhost({
    ...state,
    current: undefined,
    pending: { signature, warnings: [] },
    preview: undefined,
    ghost: nextGhost,
  }, nowMs);
}

export function receiveGuytonBaseMapResponse(
  state: GuytonSteadyMapState,
  side: GuytonSide,
  response: GuytonBaseMapResponse,
  nowMs: number,
): GuytonSteadyMapState {
  if (state.pending?.signature !== response.signature) return expireGuytonSteadyMapGhost(state, nowMs);

  if (response.error) {
    return withPendingWarnings(state, [response.error], nowMs);
  }

  const pane = side === "right" ? response.right : response.left;
  if (!pane) {
    return withPendingWarnings(state, ["base map response missing pane"], nowMs);
  }

  const warnings = uniqueStrings([
    ...state.pending.warnings,
    ...response.warnings,
    ...pane.warnings,
  ]);
  return promoteIfComplete(withPreview({
    ...state,
    pending: {
      ...state.pending,
      baseMap: { ...pane, warnings },
      warnings,
    },
  }, nowMs), nowMs);
}

export function receiveGuytonSweepProgressResponse(
  state: GuytonSteadyMapState,
  response: StarlingSweepProgressMessage,
  nowMs: number,
): GuytonSteadyMapState {
  if (state.pending?.signature !== response.signature) return expireGuytonSteadyMapGhost(state, nowMs);

  const warnings = uniqueStrings([
    ...state.pending.warnings,
    ...response.warnings,
  ]);
  return withPreview({
    ...state,
    pending: {
      ...state.pending,
      progressSweep: response,
      warnings,
    },
  }, nowMs);
}

export function receiveGuytonSweepResponse(
  state: GuytonSteadyMapState,
  response: StarlingSweepResponse,
  nowMs: number,
): GuytonSteadyMapState {
  if (state.pending?.signature !== response.signature) return expireGuytonSteadyMapGhost(state, nowMs);

  if (response.error) {
    return withPendingWarnings(state, [response.error], nowMs);
  }

  const warnings = uniqueStrings([
    ...state.pending.warnings,
    ...response.warnings,
  ]);
  return promoteIfComplete({
    ...state,
    pending: {
      ...state.pending,
      sweep: response,
      warnings,
    },
  }, nowMs);
}

export function markGuytonSteadyMapPendingWarning(
  state: GuytonSteadyMapState,
  signature: string,
  warning: string,
  nowMs: number,
): GuytonSteadyMapState {
  if (state.pending?.signature !== signature) return expireGuytonSteadyMapGhost(state, nowMs);
  return withPendingWarnings(state, [warning], nowMs);
}

export function expireGuytonSteadyMapGhost(
  state: GuytonSteadyMapState,
  nowMs: number,
): GuytonSteadyMapState {
  if (!state.ghost || state.ghost.expiresAtMs === undefined || state.ghost.expiresAtMs > nowMs) return state;
  return { ...state, ghost: undefined };
}

export function guytonSteadyMapWarnings(state: GuytonSteadyMapState): string[] {
  return uniqueStrings([
    ...(state.current?.warnings ?? []),
    ...(state.preview?.warnings ?? []),
    ...(state.pending?.warnings ?? []),
    ...(state.ghost?.warnings ?? []),
  ]);
}

function promoteIfComplete(state: GuytonSteadyMapState, nowMs: number): GuytonSteadyMapState {
  const pending = state.pending;
  if (!pending?.baseMap || !pending.sweep) return expireGuytonSteadyMapGhost(state, nowMs);

  const axis = axisForPromotedMap(state.axis, pending.baseMap, pending.sweep, state.ghost);
  return expireGuytonSteadyMapGhost({
    axis,
    current: {
      signature: pending.signature,
      pane: pending.baseMap,
      sweep: pending.sweep,
      axis,
      warnings: uniqueStrings([
        ...pending.warnings,
        ...pending.baseMap.warnings,
        ...pending.sweep.warnings,
      ]),
      promotedAtMs: nowMs,
    },
    pending: undefined,
    preview: undefined,
    ghost: state.ghost ? expireGhostAfterPromote(state.ghost, nowMs) : undefined,
  }, nowMs);
}

function withPreview(state: GuytonSteadyMapState, nowMs: number): GuytonSteadyMapState {
  const pending = state.pending;
  if (!pending?.baseMap) return expireGuytonSteadyMapGhost(state, nowMs);

  let axis = expandGuytonAxisToFit(state.axis, guytonSnapshotPoints(pending.baseMap, pending.progressSweep));
  if (state.ghost) axis = expandGuytonAxisToFit(axis, guytonSnapshotPoints(state.ghost.pane, state.ghost.sweep));
  return expireGuytonSteadyMapGhost({
    ...state,
    axis,
    preview: {
      signature: pending.signature,
      pane: pending.baseMap,
      sweep: pending.progressSweep,
      axis,
      warnings: pending.warnings,
      progress: pending.progressSweep
        ? {
          completedPoints: pending.progressSweep.completedPoints,
          totalPoints: pending.progressSweep.totalPoints,
        }
        : undefined,
      updatedAtMs: nowMs,
    },
  }, nowMs);
}

function axisForPromotedMap(
  currentAxis: GuytonAxisDomain,
  pane: GuytonPaneData,
  sweep: StarlingSweepResponse,
  ghost?: GuytonSteadyMapGhost,
): GuytonAxisDomain {
  let axis = expandGuytonAxisToFit(currentAxis, guytonSnapshotPoints(pane, sweep));
  if (ghost) axis = expandGuytonAxisToFit(axis, guytonSnapshotPoints(ghost.pane, ghost.sweep));
  return axis;
}

function withPendingWarnings(
  state: GuytonSteadyMapState,
  warnings: string[],
  nowMs: number,
): GuytonSteadyMapState {
  if (!state.pending) return expireGuytonSteadyMapGhost(state, nowMs);
  return expireGuytonSteadyMapGhost({
    ...state,
    pending: {
      ...state.pending,
      warnings: uniqueStrings([...state.pending.warnings, ...warnings]),
    },
  }, nowMs);
}

function ghostFromCurrent(current: GuytonSteadyMap): GuytonSteadyMapGhost {
  return { ...current };
}

function expireGhostAfterPromote(ghost: GuytonSteadyMapGhost, nowMs: number): GuytonSteadyMapGhost {
  return {
    ...ghost,
    expiresAtMs: nowMs + GUYTON_STEADY_GHOST_DURATION_MS,
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
