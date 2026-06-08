export const WAVEFORM_ACTIVE_ALPHA = 1;
export const WAVEFORM_STALE_ALPHA = 0.45;

export type WaveformTransitionStatus = "pending" | "settling" | "promoted";

export type WaveformPhaseSegment = {
  start: number;
  end: number;
};

export type WaveformPreviousEpochForWipe = {
  wipeStartedAtT: number;
};

export type WaveformDrawPlan = {
  currentAlpha: number;
  currentSegments: WaveformPhaseSegment[];
  markerAlpha: number;
  previousAlpha: number;
  previousSegments: WaveformPhaseSegment[];
  complete: boolean;
};

const EPS = 1e-9;

export function positiveModulo(value: number, period: number): number {
  if (!(period > 0)) return 0;
  const mod = value % period;
  return mod < 0 ? mod + period : mod;
}

export function fullPhaseSegment(period: number): WaveformPhaseSegment[] {
  return period > 0 ? [{ start: 0, end: period }] : [];
}

export function phaseSegmentsBetween(
  startT: number,
  endT: number,
  period: number,
): WaveformPhaseSegment[] {
  if (!(period > 0)) return [];
  const elapsed = endT - startT;
  if (!(elapsed > EPS)) return [];
  if (elapsed >= period - EPS) return fullPhaseSegment(period);

  const start = positiveModulo(startT, period);
  const unwrappedEnd = start + elapsed;
  if (unwrappedEnd <= period + EPS) {
    return normalizeSegments([{ start, end: Math.min(period, unwrappedEnd) }], period);
  }
  return normalizeSegments([
    { start, end: period },
    { start: 0, end: unwrappedEnd - period },
  ], period);
}

export function complementPhaseSegments(
  segments: WaveformPhaseSegment[],
  period: number,
): WaveformPhaseSegment[] {
  if (!(period > 0)) return [];
  const normalized = normalizeSegments(segments, period);
  if (normalized.length === 0) return fullPhaseSegment(period);

  const out: WaveformPhaseSegment[] = [];
  let cursor = 0;
  for (const segment of normalized) {
    if (segment.start > cursor + EPS) out.push({ start: cursor, end: segment.start });
    cursor = Math.max(cursor, segment.end);
  }
  if (cursor < period - EPS) out.push({ start: cursor, end: period });
  return normalizeSegments(out, period);
}

export function phaseInSegments(
  phase: number,
  segments: WaveformPhaseSegment[],
  period: number,
): boolean {
  if (!(period > 0) || segments.length === 0) return false;
  const normalizedPhase = positiveModulo(phase, period);
  return segments.some((segment) => (
    normalizedPhase >= segment.start - EPS && normalizedPhase < segment.end
  ));
}

export function buildWaveformDrawPlan({
  status,
  previousEpoch,
  instanceLatestT,
  timeWindowSec,
}: {
  status?: WaveformTransitionStatus;
  previousEpoch?: WaveformPreviousEpochForWipe;
  instanceLatestT: number;
  timeWindowSec: number;
}): WaveformDrawPlan {
  const full = fullPhaseSegment(timeWindowSec);
  if (status === "pending") {
    return {
      currentAlpha: WAVEFORM_STALE_ALPHA,
      currentSegments: full,
      markerAlpha: WAVEFORM_STALE_ALPHA,
      previousAlpha: 0,
      previousSegments: [],
      complete: false,
    };
  }

  if (status === "promoted" && previousEpoch) {
    const swept = phaseSegmentsBetween(previousEpoch.wipeStartedAtT, instanceLatestT, timeWindowSec);
    if (swept.length === 1 && swept[0].start <= EPS && swept[0].end >= timeWindowSec - EPS) {
      return normalWaveformDrawPlan(timeWindowSec, true);
    }
    return {
      currentAlpha: WAVEFORM_ACTIVE_ALPHA,
      currentSegments: swept,
      markerAlpha: WAVEFORM_ACTIVE_ALPHA,
      previousAlpha: WAVEFORM_STALE_ALPHA,
      previousSegments: complementPhaseSegments(swept, timeWindowSec),
      complete: false,
    };
  }

  return normalWaveformDrawPlan(timeWindowSec, false);
}

function normalWaveformDrawPlan(timeWindowSec: number, complete: boolean): WaveformDrawPlan {
  return {
    currentAlpha: WAVEFORM_ACTIVE_ALPHA,
    currentSegments: fullPhaseSegment(timeWindowSec),
    markerAlpha: WAVEFORM_ACTIVE_ALPHA,
    previousAlpha: 0,
    previousSegments: [],
    complete,
  };
}

function normalizeSegments(
  segments: WaveformPhaseSegment[],
  period: number,
): WaveformPhaseSegment[] {
  return segments
    .map((segment) => ({
      start: Math.max(0, Math.min(period, segment.start)),
      end: Math.max(0, Math.min(period, segment.end)),
    }))
    .filter((segment) => segment.end - segment.start > EPS)
    .sort((a, b) => a.start - b.start);
}
