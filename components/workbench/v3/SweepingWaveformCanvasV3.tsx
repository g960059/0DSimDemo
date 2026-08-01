import React from "react";

import {
  isWorkbenchPresentationSampleV3,
} from "./WorkbenchPresentationSampleBufferV3";
import {
  firstSampleAtOrAfterV3,
  finiteWorkbenchScalarValueV3,
  orderedFiniteWorkbenchSamplesV3,
  type WorkbenchScalarSampleV3,
} from "./WorkbenchScalarSampleV3";
import {
  scaleLinearV3,
  useResponsiveCanvasFrameV3,
} from "./WorkbenchCanvasRuntimeV3";

export type WorkbenchWaveformSeriesV3 = Readonly<{
  outputId: string;
  label: string;
  color: string;
}>;

export type SweepingWaveformPointV3 = Readonly<{
  phaseSec: number;
  value: number;
  envelopeMinimum?: number;
  envelopeMaximum?: number;
}>;

export type SweepingWaveformSegmentV3 = readonly SweepingWaveformPointV3[];

export type WorkbenchNumericDomainV3 = readonly [number, number];

type SweepingWaveformOptionsV3 = Readonly<{
  windowSec: number;
  forwardGapFraction?: number;
}>;

export const WORKBENCH_SWEEP_FORWARD_GAP_FRACTION_V3 = 0.025;

const WAVEFORM_EPSILON_V3 = 1e-9;

export function positiveModuloV3(value: number, period: number): number {
  if (!(period > 0) || !Number.isFinite(value)) return 0;
  const result = value % period;
  return result < 0 ? result + period : result;
}

export function phaseIsInsideForwardSweepGapV3(
  phaseSec: number,
  cursorPhaseSec: number,
  gapSec: number,
  windowSec: number,
): boolean {
  if (!(windowSec > 0) || !(gapSec > 0)) return false;
  const forwardDistance = positiveModuloV3(
    phaseSec - cursorPhaseSec,
    windowSec,
  );
  return forwardDistance > WAVEFORM_EPSILON_V3
    && forwardDistance < gapSec;
}

/**
 * Projects the newest time window onto a sweeping display. A model-time wrap,
 * a missing value, or the blank region immediately ahead of the cursor starts
 * a new stroke, so Canvas never draws a false line across the sweep boundary.
 */
export function buildSweepingWaveformSegmentsV3(
  samples: readonly WorkbenchScalarSampleV3[],
  outputId: string,
  options: SweepingWaveformOptionsV3,
): readonly SweepingWaveformSegmentV3[] {
  const windowSec = options.windowSec;
  if (!(windowSec > 0) || !Number.isFinite(windowSec)) {
    return Object.freeze([]);
  }
  const ordered = orderedFiniteWorkbenchSamplesV3(samples);
  return buildSweepingWaveformSegmentsFromOrderedV3(
    ordered,
    outputId,
    options,
  );
}

function buildSweepingWaveformSegmentsFromOrderedV3(
  ordered: readonly WorkbenchScalarSampleV3[],
  outputId: string,
  options: SweepingWaveformOptionsV3,
): readonly SweepingWaveformSegmentV3[] {
  const windowSec = options.windowSec;
  if (!(windowSec > 0) || !Number.isFinite(windowSec)) {
    return Object.freeze([]);
  }
  const latestTimeSec = ordered.at(-1)?.acceptedTimeSec;
  if (latestTimeSec === undefined) return Object.freeze([]);

  const cursorPhaseSec = positiveModuloV3(latestTimeSec, windowSec);
  const gapFraction = clampV3(
    options.forwardGapFraction
      ?? WORKBENCH_SWEEP_FORWARD_GAP_FRACTION_V3,
    0,
    0.25,
  );
  const gapSec = windowSec * gapFraction;
  const oldestTimeSec = latestTimeSec - windowSec - WAVEFORM_EPSILON_V3;
  const segments: SweepingWaveformPointV3[][] = [];
  let active: SweepingWaveformPointV3[] = [];
  let previousPhaseSec: number | null = null;

  const flush = () => {
    if (active.length > 0) segments.push(active);
    active = [];
  };

  const firstIndex = firstSampleAtOrAfterV3(ordered, oldestTimeSec);
  for (let index = firstIndex; index < ordered.length; index += 1) {
    const sample = ordered[index]!;
    const phaseSec = positiveModuloV3(sample.acceptedTimeSec, windowSec);
    if (
      previousPhaseSec !== null
      && phaseSec + WAVEFORM_EPSILON_V3 < previousPhaseSec
    ) {
      flush();
    }
    previousPhaseSec = phaseSec;
    const value = finiteWorkbenchScalarValueV3(sample, outputId);
    const hiddenByCursorGap = phaseIsInsideForwardSweepGapV3(
      phaseSec,
      cursorPhaseSec,
      gapSec,
      windowSec,
    );
    if (value === null || hiddenByCursorGap) {
      flush();
      continue;
    }
    const envelopeMinimum = isWorkbenchPresentationSampleV3(sample)
      ? sample.presentationEnvelope.minimums[outputId]
      : undefined;
    const envelopeMaximum = isWorkbenchPresentationSampleV3(sample)
      ? sample.presentationEnvelope.maximums[outputId]
      : undefined;
    const hasEnvelope = typeof envelopeMinimum === "number"
      && Number.isFinite(envelopeMinimum)
      && typeof envelopeMaximum === "number"
      && Number.isFinite(envelopeMaximum);
    active.push(Object.freeze({
      phaseSec,
      value,
      ...(!hasEnvelope
        ? {}
        : {
            envelopeMinimum,
            envelopeMaximum,
          }),
    }));
  }
  flush();
  return Object.freeze(segments.map((segment) => Object.freeze(segment)));
}

export function observedNumericDomainV3(
  values: readonly number[],
  options: Readonly<{
    includeZero?: boolean;
    paddingFraction?: number;
  }> = {},
): WorkbenchNumericDomainV3 {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Object.freeze([0, 1]);
  let minimum = Math.min(...finite);
  let maximum = Math.max(...finite);
  if (options.includeZero) {
    minimum = Math.min(0, minimum);
    maximum = Math.max(0, maximum);
  }
  if (maximum - minimum < 1e-12) {
    const halfSpan = Math.max(0.5, Math.abs(maximum) * 0.05);
    minimum -= halfSpan;
    maximum += halfSpan;
  }
  const padding = Math.max(
    1e-6,
    (maximum - minimum) * clampV3(options.paddingFraction ?? 0.08, 0, 0.5),
  );
  const lowerPadding = options.includeZero && minimum === 0 && maximum > 0
    ? 0
    : padding;
  const upperPadding = options.includeZero && maximum === 0 && minimum < 0
    ? 0
    : padding;
  return Object.freeze([
    minimum - lowerPadding,
    maximum + upperPadding,
  ]);
}

/**
 * Expands immediately to avoid clipping. It contracts only after the new
 * observations occupy a substantially smaller, well-inset range.
 */
export function nextHystereticNumericDomainV3(
  previous: WorkbenchNumericDomainV3 | null,
  values: readonly number[],
  options: Readonly<{
    includeZero?: boolean;
    paddingFraction?: number;
    contractionSpanRatio?: number;
    contractionInsetFraction?: number;
  }> = {},
): WorkbenchNumericDomainV3 {
  const observed = observedNumericDomainV3(values, options);
  if (
    previous === null
    || !Number.isFinite(previous[0])
    || !Number.isFinite(previous[1])
    || !(previous[1] > previous[0])
  ) return observed;

  const expandsLower = observed[0] < previous[0];
  const expandsUpper = observed[1] > previous[1];
  if (expandsLower || expandsUpper) {
    return Object.freeze([
      Math.min(previous[0], observed[0]),
      Math.max(previous[1], observed[1]),
    ]);
  }

  const previousSpan = previous[1] - previous[0];
  const observedSpan = observed[1] - observed[0];
  const spanRatio = clampV3(options.contractionSpanRatio ?? 0.7, 0.1, 0.95);
  const insetFraction = clampV3(
    options.contractionInsetFraction ?? 0.1,
    0,
    0.4,
  );
  const inset = previousSpan * insetFraction;
  const safelyInset = observed[0] >= previous[0] + inset
    && observed[1] <= previous[1] - inset;
  return observedSpan <= previousSpan * spanRatio && safelyInset
    ? observed
    : previous;
}

export function SweepingWaveformCanvasV3({
  samples,
  series,
  windowSec = 6,
  unitLabel,
  includeZero = false,
  className,
}: Readonly<{
  samples: readonly WorkbenchScalarSampleV3[];
  series: readonly WorkbenchWaveformSeriesV3[];
  windowSec?: number;
  unitLabel?: string;
  includeZero?: boolean;
  className?: string;
}>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const domainRef = React.useRef<WorkbenchNumericDomainV3 | null>(null);
  const orderedSamples = React.useMemo(
    () => orderedFiniteWorkbenchSamplesV3(samples),
    [samples],
  );
  const domainIdentity = series
    .map(({ outputId }) => outputId)
    .join("\u001f")
    + `\u001e${unitLabel ?? ""}\u001e${includeZero}\u001e${windowSec}`;

  React.useEffect(() => {
    domainRef.current = null;
  }, [domainIdentity]);

  const draw = React.useCallback((
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const theme = readCanvasThemeV3(containerRef.current);
    const plot = waveformPlotRectV3(width, height);
    const projectedSeries = series.map((item) => Object.freeze({
      item,
      segments: buildSweepingWaveformSegmentsFromOrderedV3(
        orderedSamples,
        item.outputId,
        { windowSec },
      ),
    }));
    const allValues: number[] = [];
    for (const { segments } of projectedSeries) {
      for (const segment of segments) {
        for (const point of segment) {
          allValues.push(
            point.value,
            point.envelopeMinimum ?? point.value,
            point.envelopeMaximum ?? point.value,
          );
        }
      }
    }
    domainRef.current = nextHystereticNumericDomainV3(
      domainRef.current,
      allValues,
      { includeZero },
    );
    const domain = domainRef.current;
    drawWaveformAxesV3(
      context,
      plot,
      width,
      height,
      domain,
      windowSec,
      unitLabel,
      theme,
    );
    const x = (phaseSec: number) => scaleLinearV3(
      phaseSec,
      0,
      windowSec,
      plot.left,
      plot.right,
    );
    const y = (value: number) => scaleLinearV3(
      value,
      domain[0],
      domain[1],
      plot.bottom,
      plot.top,
    );

    for (const { item, segments } of projectedSeries) {
      context.save();
      context.strokeStyle = item.color;
      context.lineWidth = 1.6;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.globalAlpha = 0.24;
      context.lineWidth = 1;
      context.beginPath();
      for (const segment of segments) {
        for (const point of segment) {
          if (
            point.envelopeMinimum === undefined
            || point.envelopeMaximum === undefined
            || !(point.envelopeMaximum > point.envelopeMinimum)
          ) continue;
          const pointX = x(point.phaseSec);
          context.moveTo(pointX, y(point.envelopeMinimum));
          context.lineTo(pointX, y(point.envelopeMaximum));
        }
      }
      context.stroke();
      context.globalAlpha = 1;
      context.lineWidth = 1.6;
      for (const segment of segments) {
        if (segment.length === 0) continue;
        context.beginPath();
        segment.forEach((point, index) => {
          if (index === 0) context.moveTo(x(point.phaseSec), y(point.value));
          else context.lineTo(x(point.phaseSec), y(point.value));
        });
        context.stroke();
      }
      context.restore();
    }

    const latestTimeSec = orderedSamples.at(-1)?.acceptedTimeSec;
    if (latestTimeSec !== undefined && Number.isFinite(latestTimeSec)) {
      const cursorX = x(positiveModuloV3(latestTimeSec, windowSec));
      context.save();
      context.strokeStyle = theme.cursor;
      context.globalAlpha = 0.5;
      context.setLineDash([3, 4]);
      context.beginPath();
      context.moveTo(cursorX, plot.top);
      context.lineTo(cursorX, plot.bottom);
      context.stroke();
      context.restore();
    }
  }, [includeZero, orderedSamples, series, unitLabel, windowSec]);

  useResponsiveCanvasFrameV3(containerRef, canvasRef, draw);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-48 h-full w-full overflow-hidden ${className ?? ""}`}
      data-chart-kind="sweeping-waveform-v3"
      data-time-window-sec={windowSec}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label={`Sweeping waveform, ${windowSec} second window`}
      />
      <div className="pointer-events-none absolute left-12 top-2 flex max-w-[calc(100%-4rem)] flex-wrap gap-x-3 gap-y-1 text-[10px] text-wb-muted">
        {series.map((item) => (
          <span key={item.outputId} className="inline-flex items-center gap-1">
            <span
              className="h-0.5 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

type CanvasPlotRectV3 = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

type CanvasThemeV3 = Readonly<{
  grid: string;
  axis: string;
  text: string;
  cursor: string;
}>;

function waveformPlotRectV3(width: number, height: number): CanvasPlotRectV3 {
  return Object.freeze({
    left: Math.min(52, width * 0.22),
    right: Math.max(Math.min(52, width * 0.22) + 1, width - 12),
    top: Math.min(32, height * 0.25),
    bottom: Math.max(Math.min(32, height * 0.25) + 1, height - 28),
  });
}

function drawWaveformAxesV3(
  context: CanvasRenderingContext2D,
  plot: CanvasPlotRectV3,
  width: number,
  height: number,
  domain: WorkbenchNumericDomainV3,
  windowSec: number,
  unitLabel: string | undefined,
  theme: CanvasThemeV3,
): void {
  context.save();
  context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = theme.text;
  context.strokeStyle = theme.grid;
  context.lineWidth = 1;
  for (let ordinal = 0; ordinal <= 4; ordinal += 1) {
    const ratio = ordinal / 4;
    const y = plot.bottom - ratio * (plot.bottom - plot.top);
    const value = domain[0] + ratio * (domain[1] - domain[0]);
    context.beginPath();
    context.moveTo(plot.left, y);
    context.lineTo(plot.right, y);
    context.stroke();
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillText(formatAxisNumberV3(value), plot.left - 6, y);
  }
  for (let ordinal = 0; ordinal <= 4; ordinal += 1) {
    const ratio = ordinal / 4;
    const x = plot.left + ratio * (plot.right - plot.left);
    context.beginPath();
    context.moveTo(x, plot.top);
    context.lineTo(x, plot.bottom);
    context.stroke();
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(
      `${formatAxisNumberV3(ratio * windowSec)} s`,
      x,
      plot.bottom + 7,
    );
  }
  context.strokeStyle = theme.axis;
  context.strokeRect(
    plot.left,
    plot.top,
    plot.right - plot.left,
    plot.bottom - plot.top,
  );
  if (unitLabel) {
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText(unitLabel, Math.max(0, plot.left - 44), 7);
  }
  context.restore();
  void width;
  void height;
}

function readCanvasThemeV3(element: HTMLElement | null): CanvasThemeV3 {
  if (element === null || typeof getComputedStyle !== "function") {
    return fallbackCanvasThemeV3();
  }
  const styles = getComputedStyle(element);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return Object.freeze({
    grid: read("--wb-border", "rgba(148, 163, 184, 0.18)"),
    axis: read("--wb-border-strong", "rgba(148, 163, 184, 0.48)"),
    text: read("--wb-text-muted", "#94a3b8"),
    cursor: read("--wb-text", "#e2e8f0"),
  });
}

function fallbackCanvasThemeV3(): CanvasThemeV3 {
  return Object.freeze({
    grid: "rgba(148, 163, 184, 0.18)",
    axis: "rgba(148, 163, 184, 0.48)",
    text: "#94a3b8",
    cursor: "#e2e8f0",
  });
}

function formatAxisNumberV3(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 100) return value.toFixed(0);
  if (magnitude >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function clampV3(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}
