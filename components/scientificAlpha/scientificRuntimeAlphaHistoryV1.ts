import type {
  MainWireScientificObservableFrameV1,
  MainWireScientificObservableIdV1,
} from '@/engine/scientific/observables';
import type {
  MainWireScientificPeriodicSettlementStatusV1,
} from '@/engine/scientific/runtime';

export const SCIENTIFIC_ALPHA_DT_SEC = 0.002;
export const SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC = 1;
export const SCIENTIFIC_ALPHA_STEPS_PER_CHUNK = 4;
export const SCIENTIFIC_ALPHA_HISTORY_CAPACITY = 2_001;
export const SCIENTIFIC_ALPHA_TERMINAL_WINDOW_SEC = 1;
export const SCIENTIFIC_ALPHA_TERMINAL_BEAT_CHUNK_COUNT =
  SCIENTIFIC_ALPHA_CYCLE_LENGTH_SEC
  / (SCIENTIFIC_ALPHA_DT_SEC * SCIENTIFIC_ALPHA_STEPS_PER_CHUNK);

if (!Number.isInteger(SCIENTIFIC_ALPHA_TERMINAL_BEAT_CHUNK_COUNT)) {
  throw new Error('scientific alpha terminal beat must contain whole Worker chunks');
}

export type ScientificAlphaPeriodicDirectiveV1 =
  | 'continue-settling'
  | 'capture-period1-terminal-beat'
  | 'stop-non-converged';

export type ScientificAlphaPlotPointV1 = Readonly<{
  x: number;
  y: number;
}>;

/**
 * Interpret the release-bound periodic result without ever promoting P2 or a
 * maximum-beat stop to a steady-state claim. Inconsistent Worker payloads fail
 * closed instead of silently changing plot provenance.
 */
export function scientificAlphaPeriodicDirectiveV1(
  status: MainWireScientificPeriodicSettlementStatusV1,
  periodicSteadyStateClaimed: boolean,
): ScientificAlphaPeriodicDirectiveV1 {
  const statusClaimsPeriod1 = status === 'period1-converged';
  if (statusClaimsPeriod1 !== periodicSteadyStateClaimed) {
    throw new Error('scientific alpha received inconsistent periodic settlement evidence');
  }
  if (statusClaimsPeriod1) return 'capture-period1-terminal-beat';
  if (status === 'tracking') return 'continue-settling';
  return 'stop-non-converged';
}

/** Start a fresh plot at the converged same-phase boundary. */
export function beginScientificAlphaTerminalBeatHistoryV1(
  anchor: MainWireScientificObservableFrameV1,
): readonly MainWireScientificObservableFrameV1[] {
  return Object.freeze([anchor]);
}

/**
 * Append accepted-state frames while retaining a hard memory bound. Repeated
 * terminal frames are replaced, while time or revision reversal fails closed.
 */
export function appendBoundedScientificAlphaHistoryV1(
  current: readonly MainWireScientificObservableFrameV1[],
  incoming: readonly MainWireScientificObservableFrameV1[],
  capacity = SCIENTIFIC_ALPHA_HISTORY_CAPACITY,
): readonly MainWireScientificObservableFrameV1[] {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error('scientific alpha history capacity must be a positive integer');
  }

  const combined = [...current];
  for (const frame of incoming) {
    const previous = combined.at(-1);
    if (
      previous !== undefined
      && sameRelease(previous, frame)
      && previous.revision === frame.revision
      && previous.acceptedTimeSec === frame.acceptedTimeSec
    ) {
      combined[combined.length - 1] = frame;
      continue;
    }
    if (
      previous !== undefined
      && (
        !sameRelease(previous, frame)
        ||
        frame.acceptedTimeSec <= previous.acceptedTimeSec
        || frame.revision <= previous.revision
      )
    ) {
      throw new Error('scientific alpha Worker history is not strictly monotone');
    }
    combined.push(frame);
  }
  return Object.freeze(combined.slice(-capacity));
}

/** Select the latest bounded time window without inventing interpolated data. */
export function selectTerminalScientificAlphaHistoryV1(
  history: readonly MainWireScientificObservableFrameV1[],
  durationSec = SCIENTIFIC_ALPHA_TERMINAL_WINDOW_SEC,
): readonly MainWireScientificObservableFrameV1[] {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error('scientific alpha terminal duration must be positive');
  }
  const finalTimeSec = history.at(-1)?.acceptedTimeSec;
  if (finalTimeSec === undefined) return Object.freeze([]);
  const firstIncludedTimeSec = finalTimeSec - durationSec - 1e-12;
  const firstIndex = history.findIndex(
    ({ acceptedTimeSec }) => acceptedTimeSec >= firstIncludedTimeSec,
  );
  return Object.freeze(history.slice(firstIndex < 0 ? 0 : firstIndex));
}

export function scientificAlphaPvPointsV1(
  history: readonly MainWireScientificObservableFrameV1[],
  chamber: 'LA' | 'RA' | 'LV' | 'RV',
): readonly ScientificAlphaPlotPointV1[] {
  return scientificAlphaPairedObservablePointsV1(
    history,
    `hemodynamics.volume.${chamber}`,
    `hemodynamics.pressure.absolute.${chamber}`,
  );
}

export function scientificAlphaTimeSeriesPointsV1(
  history: readonly MainWireScientificObservableFrameV1[],
  observableId: MainWireScientificObservableIdV1,
): readonly ScientificAlphaPlotPointV1[] {
  const result: ScientificAlphaPlotPointV1[] = [];
  const originTimeSec = history.at(0)?.acceptedTimeSec ?? 0;
  for (const frame of history) {
    const value = availableObservableValue(frame, observableId);
    if (value !== null) {
      result.push(Object.freeze({
        x: frame.acceptedTimeSec - originTimeSec,
        y: value,
      }));
    }
  }
  return Object.freeze(result);
}

export function scientificAlphaPlotDomainV1(
  values: readonly number[],
  includeZero = false,
): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Object.freeze([0, 1]);
  let minimum = Math.min(...finite);
  let maximum = Math.max(...finite);
  if (includeZero) {
    minimum = Math.min(minimum, 0);
    maximum = Math.max(maximum, 0);
  }
  if (minimum === maximum) {
    const padding = Math.max(Math.abs(minimum) * 0.05, 1);
    return Object.freeze([minimum - padding, maximum + padding]);
  }
  const padding = (maximum - minimum) * 0.06;
  return Object.freeze([minimum - padding, maximum + padding]);
}

function scientificAlphaPairedObservablePointsV1(
  history: readonly MainWireScientificObservableFrameV1[],
  xObservableId: MainWireScientificObservableIdV1,
  yObservableId: MainWireScientificObservableIdV1,
): readonly ScientificAlphaPlotPointV1[] {
  const result: ScientificAlphaPlotPointV1[] = [];
  for (const frame of history) {
    const x = availableObservableValue(frame, xObservableId);
    const y = availableObservableValue(frame, yObservableId);
    if (x !== null && y !== null) result.push(Object.freeze({ x, y }));
  }
  return Object.freeze(result);
}

function availableObservableValue(
  frame: MainWireScientificObservableFrameV1,
  observableId: MainWireScientificObservableIdV1,
): number | null {
  const observable = frame.values[observableId];
  return observable.availability === 'available'
    && observable.value !== null
    && Number.isFinite(observable.value)
    ? observable.value
    : null;
}

function sameRelease(
  left: MainWireScientificObservableFrameV1,
  right: MainWireScientificObservableFrameV1,
): boolean {
  return left.releaseRef.id === right.releaseRef.id
    && left.releaseRef.version === right.releaseRef.version
    && left.releaseRef.sha256 === right.releaseRef.sha256;
}
