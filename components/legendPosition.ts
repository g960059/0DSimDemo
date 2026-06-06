import type { LegendPosition } from '../types';

type Size = { width: number; height: number };
type PointPx = { left: number; top: number };

export function fractionToPx(pos: LegendPosition, container: Size): PointPx {
  return {
    left: pos.xPct * container.width,
    top: pos.yPct * container.height,
  };
}

export function pxToFraction(px: PointPx, container: Size): LegendPosition {
  if (container.width <= 0 || container.height <= 0) return { xPct: 0, yPct: 0 };
  return {
    xPct: px.left / container.width,
    yPct: px.top / container.height,
  };
}

export function clampLegendFraction(pos: LegendPosition, container: Size, legend: Size): LegendPosition {
  if (container.width <= 0 || container.height <= 0) return { xPct: 0, yPct: 0 };

  const maxX = Math.max(0, (container.width - legend.width) / container.width);
  const maxY = Math.max(0, (container.height - legend.height) / container.height);
  return {
    xPct: clampFinite(pos.xPct, 0, maxX),
    yPct: clampFinite(pos.yPct, 0, maxY),
  };
}

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
