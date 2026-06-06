import type { LegendPosition } from '../types';

type Size = { width: number; height: number };
type PointPx = { left: number; top: number };
type ClientPoint = { x: number; y: number };

const DEFAULT_LEGEND_OFFSET_PX = 8;

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

export function exceededDragThreshold(start: ClientPoint, end: ClientPoint, threshold = 5): boolean {
  return Math.hypot(end.x - start.x, end.y - start.y) > threshold;
}

export function isNearDefaultLegendCorner(
  pos: LegendPosition,
  container: Size,
  legend: Size,
  thresholdPx = 16,
): boolean {
  if (
    !Number.isFinite(container.width)
    || !Number.isFinite(container.height)
    || !Number.isFinite(legend.width)
    || !Number.isFinite(legend.height)
    || container.width <= 0
    || container.height <= 0
    || legend.width <= 0
    || legend.height <= 0
  ) return false;

  const px = fractionToPx(clampLegendFraction(pos, container, legend), container);
  const maxLeft = Math.max(0, container.width - legend.width);
  const maxTop = Math.max(0, container.height - legend.height);
  const defaultPx = {
    left: Math.max(0, maxLeft - DEFAULT_LEGEND_OFFSET_PX),
    top: Math.min(DEFAULT_LEGEND_OFFSET_PX, maxTop),
  };

  return Math.hypot(px.left - defaultPx.left, px.top - defaultPx.top) <= thresholdPx;
}

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
