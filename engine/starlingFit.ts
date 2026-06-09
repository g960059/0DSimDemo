import {
  classifyStarlingSweepPoint,
  type GuytonCurvePoint,
  type GuytonSide,
  type StarlingSweepFit,
} from "@/engine/guytonStarling";

const UNIQUE_X_EPSILON = 1e-6;
const FIT_SAMPLE_COUNT = 96;
const EXTENSION_SAMPLE_COUNT = 48;
const DEFAULT_X_DOMAIN: Record<GuytonSide, { min: number; max: number }> = {
  right: { min: -5, max: 20 },
  left: { min: 0, max: 30 },
};

type FitAnchor = {
  x: number;
  y: number;
  weight: number;
};

export function buildStarlingSweepFit(
  side: GuytonSide,
  points: GuytonCurvePoint[],
  options: { includeExtrapolation?: boolean; mode?: StarlingSweepFit["mode"] } = {},
): StarlingSweepFit | undefined {
  const anchors = uniqueUsableAnchors(points);
  if (anchors.length < 3) return undefined;

  const x = anchors.map((point) => point.x);
  const y = isotonicY(anchors);
  const slopes = pchipSlopes(x, y);
  const measured = samplePchip(x, y, slopes, FIT_SAMPLE_COUNT);
  const fit: StarlingSweepFit = {
    kind: "monotone-pchip",
    mode: options.mode ?? "measured",
    points: measured,
    sourcePointCount: anchors.length,
    warnings: [],
  };

  if (options.includeExtrapolation) {
    const domain = DEFAULT_X_DOMAIN[side];
    fit.extrapolatedLeft = sampleLeftExtension(domain.min, x, y, slopes);
    fit.extrapolatedRight = sampleRightExtension(domain.max, x, y, slopes);
  }

  return fit;
}

function uniqueUsableAnchors(points: GuytonCurvePoint[]): FitAnchor[] {
  const usable = points
    .filter((point) => classifyStarlingSweepPoint(point) === "reliable")
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);

  const anchors: FitAnchor[] = [];
  for (const point of usable) {
    const weight = point.deltaVolumeMl === 0 ? 4 : 1;
    const previous = anchors[anchors.length - 1];
    if (previous && Math.abs(previous.x - point.x) <= UNIQUE_X_EPSILON) {
      const totalWeight = previous.weight + weight;
      previous.y = (previous.y * previous.weight + point.y * weight) / totalWeight;
      previous.weight = totalWeight;
      continue;
    }
    anchors.push({ x: point.x, y: Math.max(point.y, 0), weight });
  }
  return anchors;
}

function isotonicY(points: FitAnchor[]): number[] {
  type Block = { start: number; end: number; sum: number; weight: number };
  const blocks: Block[] = [];
  for (let i = 0; i < points.length; i++) {
    blocks.push({
      start: i,
      end: i,
      sum: points[i].y * points[i].weight,
      weight: points[i].weight,
    });
    while (blocks.length >= 2) {
      const right = blocks[blocks.length - 1];
      const left = blocks[blocks.length - 2];
      if (left.sum / left.weight <= right.sum / right.weight) break;
      blocks.splice(blocks.length - 2, 2, {
        start: left.start,
        end: right.end,
        sum: left.sum + right.sum,
        weight: left.weight + right.weight,
      });
    }
  }

  const y = new Array(points.length).fill(0);
  for (const block of blocks) {
    const value = block.sum / block.weight;
    for (let i = block.start; i <= block.end; i++) y[i] = value;
  }
  return y;
}

function pchipSlopes(x: number[], y: number[]): number[] {
  const n = x.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(x[i + 1] - x[i]);
    d.push(h[i] > 0 ? (y[i + 1] - y[i]) / h[i] : 0);
  }

  const m = new Array(n).fill(0);
  m[0] = d[0] ?? 0;
  m[n - 1] = d[n - 2] ?? 0;
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] <= 0 || d[i] <= 0) {
      m[i] = 0;
      continue;
    }
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return m;
}

function samplePchip(x: number[], y: number[], slopes: number[], count: number): GuytonCurvePoint[] {
  const minX = x[0];
  const maxX = x[x.length - 1];
  if (!(maxX > minX)) return [];
  const points: GuytonCurvePoint[] = [];
  for (let i = 0; i < count; i++) {
    const px = minX + (maxX - minX) * (i / (count - 1));
    points.push({ x: px, y: Math.max(0, evaluatePchip(px, x, y, slopes)) });
  }
  return points;
}

function evaluatePchip(px: number, x: number[], y: number[], slopes: number[]): number {
  let i = x.length - 2;
  for (let j = 0; j < x.length - 1; j++) {
    if (px <= x[j + 1]) {
      i = j;
      break;
    }
  }
  const h = x[i + 1] - x[i];
  if (h <= 0) return y[i];
  const t = (px - x[i]) / h;
  const h00 = (2 * t ** 3) - (3 * t ** 2) + 1;
  const h10 = (t ** 3) - (2 * t ** 2) + t;
  const h01 = (-2 * t ** 3) + (3 * t ** 2);
  const h11 = (t ** 3) - (t ** 2);
  return h00 * y[i] + h10 * h * slopes[i] + h01 * y[i + 1] + h11 * h * slopes[i + 1];
}

function sampleLeftExtension(
  domainMin: number,
  x: number[],
  y: number[],
  slopes: number[],
): GuytonCurvePoint[] | undefined {
  const startX = x[0];
  if (!(domainMin < startX)) return undefined;
  const slope = Math.max(slopes[0], 0);
  const points: GuytonCurvePoint[] = [];
  for (let i = 0; i < EXTENSION_SAMPLE_COUNT; i++) {
    const px = domainMin + (startX - domainMin) * (i / (EXTENSION_SAMPLE_COUNT - 1));
    points.push({ x: px, y: Math.max(0, y[0] + slope * (px - startX)) });
  }
  return points;
}

function sampleRightExtension(
  domainMax: number,
  x: number[],
  y: number[],
  slopes: number[],
): GuytonCurvePoint[] | undefined {
  const endX = x[x.length - 1];
  if (!(domainMax > endX)) return undefined;
  const yEnd = y[y.length - 1];
  const slope = Math.max(slopes[slopes.length - 1], 0);
  const reserve = Math.max(0.75, yEnd * 0.35);
  const scale = slope > 1e-4 ? clampValue(reserve / slope, 2, 18) : 8;
  const points: GuytonCurvePoint[] = [];
  for (let i = 0; i < EXTENSION_SAMPLE_COUNT; i++) {
    const px = endX + (domainMax - endX) * (i / (EXTENSION_SAMPLE_COUNT - 1));
    const dx = Math.max(px - endX, 0);
    const py = slope > 1e-4
      ? yEnd + reserve * (1 - Math.exp(-dx / scale))
      : yEnd;
    points.push({ x: px, y: Math.max(0, py) });
  }
  return points;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
