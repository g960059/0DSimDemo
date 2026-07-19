export type ScientificWorkbenchDisplayClockSnapshotV1 = Readonly<{
  running: boolean;
  timeScale: number;
  elapsedSeconds: number;
}>;

export type ScientificWorkbenchDisplayClockV1 = Readonly<{
  read: (nowMs?: number) => ScientificWorkbenchDisplayClockSnapshotV1;
  configure: (running: boolean, timeScale: number, nowMs?: number) => void;
}>;

/**
 * Shared presentation-only clock. It never advances a scientific session and
 * never fabricates frames; graph panes use it only to position their sweep/cap
 * over already accepted data.
 */
export function createScientificWorkbenchDisplayClockV1(
  running = true,
  timeScale = 1,
  nowMs = monotonicNowMs(),
): ScientificWorkbenchDisplayClockV1 {
  assertTimeScale(timeScale);
  let anchorMs = nowMs;
  let anchorElapsedSeconds = 0;
  let currentRunning = running;
  let currentTimeScale = timeScale;

  const elapsedAt = (timeMs: number): number => anchorElapsedSeconds
    + (currentRunning
      ? Math.max(0, timeMs - anchorMs) * currentTimeScale / 1_000
      : 0);

  return Object.freeze({
    read: (timeMs = monotonicNowMs()) => Object.freeze({
      running: currentRunning,
      timeScale: currentTimeScale,
      elapsedSeconds: elapsedAt(timeMs),
    }),
    configure: (nextRunning, nextTimeScale, timeMs = monotonicNowMs()) => {
      assertTimeScale(nextTimeScale);
      anchorElapsedSeconds = elapsedAt(timeMs);
      anchorMs = timeMs;
      currentRunning = nextRunning;
      currentTimeScale = nextTimeScale;
    },
  });
}

function assertTimeScale(value: number): void {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error("scientific Workbench display time scale must be positive");
  }
}

function monotonicNowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
