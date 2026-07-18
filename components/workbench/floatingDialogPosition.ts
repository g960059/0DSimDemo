export type FloatingDialogPoint = Readonly<{ x: number; y: number }>;
export type FloatingDialogSize = Readonly<{ width: number; height: number }>;

export const FLOATING_DIALOG_VIEWPORT_MARGIN_PX = 8;

/**
 * Keeps a desktop floating dialog reachable without assuming that it is
 * smaller than the viewport. Oversized dialogs are pinned to the viewport
 * origin on that axis; narrow remaining gutters are shared without forcing an
 * impossible margin.
 */
export function clampFloatingDialogPosition(
  point: FloatingDialogPoint,
  viewport: FloatingDialogSize,
  dialog: FloatingDialogSize,
  marginPx = FLOATING_DIALOG_VIEWPORT_MARGIN_PX,
): FloatingDialogPoint {
  return {
    x: clampFloatingDialogAxis(point.x, viewport.width, dialog.width, marginPx),
    y: clampFloatingDialogAxis(point.y, viewport.height, dialog.height, marginPx),
  };
}

export function moveFloatingDialogPosition(
  point: FloatingDialogPoint,
  delta: FloatingDialogPoint,
  viewport: FloatingDialogSize,
  dialog: FloatingDialogSize,
  marginPx = FLOATING_DIALOG_VIEWPORT_MARGIN_PX,
): FloatingDialogPoint {
  return clampFloatingDialogPosition({
    x: point.x + delta.x,
    y: point.y + delta.y,
  }, viewport, dialog, marginPx);
}

function clampFloatingDialogAxis(
  coordinate: number,
  viewportSize: number,
  dialogSize: number,
  marginPx: number,
): number {
  if (!Number.isFinite(viewportSize) || viewportSize <= 0) return 0;
  if (!Number.isFinite(dialogSize) || dialogSize <= 0) return 0;

  const available = viewportSize - dialogSize;
  if (available <= 0) return 0;

  const requestedMargin = Number.isFinite(marginPx) ? Math.max(0, marginPx) : 0;
  const usableMargin = available >= requestedMargin * 2 ? requestedMargin : 0;
  const min = usableMargin;
  const max = available - usableMargin;
  const finiteCoordinate = Number.isFinite(coordinate) ? coordinate : min;
  return Math.min(max, Math.max(min, finiteCoordinate));
}
