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
import {
  WorkbenchChartTwoAxisLegendV3,
  buildWorkbenchScenarioLegendItemsV3,
  buildWorkbenchTraceColorLegendItemsV3,
  type WorkbenchScenarioTraceIdentityV3,
} from "./WorkbenchChartTraceStyleV3";

export type WorkbenchWaveformSeriesV3 = Readonly<{
  outputId: string;
  label: string;
  color: string;
}>;

export type WorkbenchWaveformTraceV3 = WorkbenchScenarioTraceIdentityV3 &
  Readonly<{
    samples: readonly WorkbenchScalarSampleV3[];
    outputId: string;
    signalLabel: string;
    /** Stable per signal, independent of Scenario. */
    signalColor: string;
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

export function latestSweepingWaveformPointV3(
  samples: readonly WorkbenchScalarSampleV3[],
  outputId: string,
  windowSec: number,
): SweepingWaveformPointV3 | null {
  if (!(windowSec > 0) || !Number.isFinite(windowSec)) return null;
  return latestSweepingWaveformPointFromOrderedV3(
    orderedFiniteWorkbenchSamplesV3(samples),
    outputId,
    windowSec,
  );
}

function latestSweepingWaveformPointFromOrderedV3(
  ordered: readonly WorkbenchScalarSampleV3[],
  outputId: string,
  windowSec: number,
): SweepingWaveformPointV3 | null {
  const latestTimeSec = ordered.at(-1)?.acceptedTimeSec;
  if (latestTimeSec === undefined) return null;
  const oldestVisibleTimeSec = latestTimeSec - windowSec;
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const sample = ordered[index]!;
    if (sample.acceptedTimeSec < oldestVisibleTimeSec) break;
    const value = finiteWorkbenchScalarValueV3(sample, outputId);
    if (value === null) continue;
    return Object.freeze({
      phaseSec: positiveModuloV3(sample.acceptedTimeSec, windowSec),
      value,
    });
  }
  return null;
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

type SweepingWaveformCanvasCommonPropsV3 = Readonly<{
  windowSec?: number;
  unitLabel?: string;
  includeZero?: boolean;
  className?: string;
}>;

export type SweepingWaveformCanvasPropsV3 =
  SweepingWaveformCanvasCommonPropsV3 & (
    | Readonly<{
        traces: readonly WorkbenchWaveformTraceV3[];
        /** Current Workbench selection; every Scenario retains its own live head. */
        activeScenarioId: string | null;
        samples?: never;
        series?: never;
      }>
    | Readonly<{
        /** @deprecated Prefer one descriptor per Scenario/signal in traces. */
        samples: readonly WorkbenchScalarSampleV3[];
        /** @deprecated Prefer one descriptor per Scenario/signal in traces. */
        series: readonly WorkbenchWaveformSeriesV3[];
        traces?: undefined;
        activeScenarioId?: never;
      }>
  );

export function SweepingWaveformCanvasV3(
  props: SweepingWaveformCanvasPropsV3,
) {
  const {
    windowSec = 6,
    unitLabel,
    includeZero = false,
    className,
  } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const domainRef = React.useRef<WorkbenchNumericDomainV3 | null>(null);
  const traces = React.useMemo<readonly WorkbenchWaveformTraceV3[]>(
    () => props.traces ?? props.series.map((item) => Object.freeze({
      scenarioId: "current-scenario",
      scenarioLabel: "Current",
      scenarioStyleIndex: 0,
      samples: props.samples,
      outputId: item.outputId,
      signalLabel: item.label,
      signalColor: item.color,
    })),
    [props.samples, props.series, props.traces],
  );
  const activeScenarioId = props.traces === undefined
    ? "current-scenario"
    : props.activeScenarioId;
  const scenarioLegendItems = React.useMemo(
    () => buildWorkbenchScenarioLegendItemsV3(traces),
    [traces],
  );
  const colorLegendItems = React.useMemo(
    () => buildWorkbenchTraceColorLegendItemsV3(traces.map((trace) => ({
      colorKey: trace.outputId,
      label: trace.signalLabel,
      color: trace.signalColor,
    }))),
    [traces],
  );
  const orderedTraces = React.useMemo(
    () => traces.map((trace) => Object.freeze({
      trace,
      lineDash: scenarioLegendItems.find((item) =>
        item.scenarioId === trace.scenarioId)?.lineDash ?? Object.freeze([]),
      orderedSamples: orderedFiniteWorkbenchSamplesV3(trace.samples),
    })),
    [scenarioLegendItems, traces],
  );
  const domainIdentity = traces
    .map(({ outputId, scenarioId }) => `${scenarioId}:${outputId}`)
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
    const projectedTraces = orderedTraces.map((item) => Object.freeze({
      ...item,
      segments: buildSweepingWaveformSegmentsFromOrderedV3(
        item.orderedSamples,
        item.trace.outputId,
        { windowSec },
      ),
      head: latestSweepingWaveformPointFromOrderedV3(
        item.orderedSamples,
        item.trace.outputId,
        windowSec,
      ),
    }));
    const allValues: number[] = [];
    for (const { segments } of projectedTraces) {
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

    for (const { head, lineDash, segments, trace } of projectedTraces) {
      context.save();
      context.strokeStyle = trace.signalColor;
      context.lineWidth = 1.6;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.setLineDash([...lineDash]);
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
      if (head !== null) {
        drawWaveformLeadingCapV3(
          context,
          x(head.phaseSec),
          y(head.value),
          trace.signalColor,
        );
      }
    }
  }, [includeZero, orderedTraces, unitLabel, windowSec]);

  useResponsiveCanvasFrameV3(containerRef, canvasRef, draw);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-48 h-full w-full overflow-hidden ${className ?? ""}`}
      data-chart-kind="sweeping-waveform-v3"
      data-active-scenario-id={activeScenarioId}
      data-time-window-sec={windowSec}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label={`Sweeping waveform, ${windowSec} second window`}
      />
      <WorkbenchChartTwoAxisLegendV3
        colorAxisLabel="Signal"
        colorItems={colorLegendItems}
        scenarioItems={scenarioLegendItems}
      />
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
  });
}

function fallbackCanvasThemeV3(): CanvasThemeV3 {
  return Object.freeze({
    grid: "rgba(148, 163, 184, 0.18)",
    axis: "rgba(148, 163, 184, 0.48)",
    text: "#94a3b8",
  });
}

function drawWaveformLeadingCapV3(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  context.save();
  context.setLineDash([]);
  context.fillStyle = color;
  context.globalAlpha = 0.2;
  context.beginPath();
  context.arc(x, y, 4, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.globalAlpha = 0.72;
  context.beginPath();
  context.arc(x, y, 3.25, 0, Math.PI * 2);
  context.stroke();
  context.restore();
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
