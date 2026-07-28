import React from "react";
import * as d3 from "d3";

export type CatalogNeutralWaveformPointV1 = Readonly<{
  timeSec: number;
  values: Readonly<Record<string, number | null>>;
}>;

export type CatalogNeutralWaveformSeriesV1 = Readonly<{
  signalId: string;
  label: string;
  unit: string;
  color: string;
}>;

type PlotRectV1 = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

/**
 * Canvas waveform primitive whose inputs are named scalar series. It has no
 * observable-catalog, release, lane, or frame-schema dependency.
 */
export function CatalogNeutralWaveformCanvasV1({
  title,
  points,
  series,
}: Readonly<{
  title: string;
  points: readonly CatalogNeutralWaveformPointV1[];
  series: readonly CatalogNeutralWaveformSeriesV1[];
}>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (container === null || canvas === null) return undefined;

    const draw = () => drawWaveformV1(container, canvas, points, series);
    draw();
    if (typeof globalThis.ResizeObserver !== "function") return undefined;
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [points, series]);

  const last = points.at(-1);
  return (
    <section
      className="rounded-xl border border-wb-line bg-wb-panel p-4"
      data-testid="catalog-neutral-waveform-v1"
    >
      <h2 className="text-sm font-bold text-wb-text">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((entry) => {
          const value = last?.values[entry.signalId] ?? null;
          return (
            <span
              key={entry.signalId}
              className="inline-flex items-center gap-1.5 text-wb-muted"
              data-signal-id={entry.signalId}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.label}</span>
              <span className="font-mono text-wb-text">
                {value === null ? "—" : formatScalarV1(value)} {entry.unit}
              </span>
            </span>
          );
        })}
      </div>
      <div ref={containerRef} className="mt-3 h-52 min-w-0">
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          aria-label={`${title} waveform`}
          data-chart-kind="catalog-neutral-waveform"
        />
      </div>
    </section>
  );
}

function drawWaveformV1(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
  points: readonly CatalogNeutralWaveformPointV1[],
  series: readonly CatalogNeutralWaveformSeriesV1[],
): void {
  const bounds = container.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const pixelRatio = Math.max(1, globalThis.devicePixelRatio ?? 1);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const context = canvas.getContext("2d");
  if (context === null) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const style = globalThis.getComputedStyle?.(container);
  const background = cssColorV1(style, "--wb-panel-bg", "#0f172a");
  const grid = cssColorV1(style, "--wb-border", "#334155");
  const text = cssColorV1(style, "--wb-text-muted", "#94a3b8");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const plot: PlotRectV1 = {
    left: 50,
    right: Math.max(51, width - 12),
    top: 10,
    bottom: Math.max(11, height - 28),
  };
  const finitePoints = points.filter(({ timeSec }) => Number.isFinite(timeSec));
  const finiteValues = finitePoints.flatMap(({ values }) =>
    series.flatMap(({ signalId }) => {
      const value = values[signalId];
      return value !== null && Number.isFinite(value) ? [value] : [];
    }));
  const timeDomain = extentWithPaddingV1(
    finitePoints.map(({ timeSec }) => timeSec),
  );
  const valueDomain = extentWithPaddingV1(finiteValues);
  const x = d3.scaleLinear().domain(timeDomain).range([plot.left, plot.right]);
  const y = d3.scaleLinear().domain(valueDomain).range([plot.bottom, plot.top]);

  context.strokeStyle = grid;
  context.fillStyle = text;
  context.font = "10px sans-serif";
  context.lineWidth = 1;
  context.textAlign = "right";
  context.textBaseline = "middle";
  for (const tick of y.ticks(4)) {
    const yPosition = y(tick);
    context.beginPath();
    context.moveTo(plot.left, yPosition);
    context.lineTo(plot.right, yPosition);
    context.stroke();
    context.fillText(formatScalarV1(tick), plot.left - 6, yPosition);
  }
  context.textAlign = "center";
  context.textBaseline = "top";
  for (const tick of x.ticks(4)) {
    const xPosition = x(tick);
    context.fillText(`${tick.toFixed(1)} s`, xPosition, plot.bottom + 7);
  }

  for (const entry of series) {
    context.strokeStyle = entry.color;
    context.lineWidth = 1.6;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.beginPath();
    let strokeOpen = false;
    for (const point of finitePoints) {
      const value = point.values[entry.signalId];
      if (value === null || !Number.isFinite(value)) {
        strokeOpen = false;
        continue;
      }
      const xPosition = x(point.timeSec);
      const yPosition = y(value);
      if (strokeOpen) context.lineTo(xPosition, yPosition);
      else {
        context.moveTo(xPosition, yPosition);
        strokeOpen = true;
      }
    }
    context.stroke();
  }
}

function extentWithPaddingV1(
  values: readonly number[],
): readonly [number, number] {
  if (values.length === 0) return [0, 1];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) {
    const padding = Math.max(0.5, Math.abs(minimum) * 0.05);
    return [minimum - padding, maximum + padding];
  }
  const padding = (maximum - minimum) * 0.06;
  return [minimum - padding, maximum + padding];
}

function cssColorV1(
  style: CSSStyleDeclaration | undefined,
  property: string,
  fallback: string,
): string {
  return style?.getPropertyValue(property).trim() || fallback;
}

function formatScalarV1(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 100) return value.toFixed(0);
  if (magnitude >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
