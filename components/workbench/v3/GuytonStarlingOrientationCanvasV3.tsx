import React from "react";

import type {
  MainWireIntegratedModelGuytonSideV3,
  MainWireIntegratedModelStructuralReturnOrientationV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  scaleLinearV3,
  useResponsiveCanvasFrameV3,
} from "./WorkbenchCanvasRuntimeV3";

export type GuytonStarlingPlotDomainV3 = Readonly<{
  pressureMinimumMmHg: number;
  pressureMaximumMmHg: number;
  flowMinimumLPerMin: number;
  flowMaximumLPerMin: number;
}>;

/**
 * Presentation-boundary decoder for the portable model-analysis payload.
 * The Worker already owns and freezes the JSON graph; this guard prevents a
 * renderer crash if an exact model package violates its declared DTO shape.
 */
export function structuralReturnOrientationFromPayloadV3(
  payload: unknown,
  side: MainWireIntegratedModelGuytonSideV3,
): MainWireIntegratedModelStructuralReturnOrientationV3 | null {
  if (!plainRecordV3(payload) || payload.status !== "available") return null;
  const candidate = payload[side];
  if (
    !plainRecordV3(candidate)
    || candidate.side !== side
    || candidate.semantics
      !== "frozen-accepted-step-volume-constrained-structural-orientation-not-simulated-response"
    || candidate.pressureBasis !== "absolute"
    || !finiteNumberV3(candidate.sourceAcceptedRevision)
    || !finiteNumberV3(candidate.sourceAcceptedTimeSec)
    || !finiteNumberV3(candidate.fillingPressureMmHg)
    || !plainRecordV3(candidate.operatingPoint)
    || !finiteNumberV3(candidate.operatingPoint.downstreamPressureMmHg)
    || !finiteNumberV3(candidate.operatingPoint.returnFlowLPerMin)
    || !Array.isArray(candidate.curve)
    || candidate.curve.length < 2
    || candidate.curve.some((point) => !plainRecordV3(point)
      || !finiteNumberV3(point.downstreamPressureMmHg)
      || !finiteNumberV3(point.returnFlowLPerMin)
      || typeof point.flowLimited !== "boolean")
    || !validStarlingLocusV3(candidate.starlingLocus)
  ) return null;
  return candidate as unknown as
    MainWireIntegratedModelStructuralReturnOrientationV3;
}

export function guytonStarlingPlotDomainV3(
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3,
): GuytonStarlingPlotDomainV3 {
  const structuralPoints = orientation.curve.map((point) => ({
    pressureMmHg: point.downstreamPressureMmHg,
    flowLPerMin: point.returnFlowLPerMin,
  }));
  const starlingPoints = orientation.starlingLocus.status
      === "measured-fixed-tbv-protocol"
    ? orientation.starlingLocus.points.map((point) => ({
        pressureMmHg: point.fillingPressureMmHg,
        flowLPerMin: point.cardiacOutputLPerMin,
      }))
    : [];
  const all = [
    ...structuralPoints,
    ...starlingPoints,
    {
      pressureMmHg: orientation.operatingPoint.downstreamPressureMmHg,
      flowLPerMin: orientation.operatingPoint.returnFlowLPerMin,
    },
  ];
  const pressures = all.map(({ pressureMmHg }) => pressureMmHg)
    .filter(Number.isFinite);
  const flows = all.map(({ flowLPerMin }) => flowLPerMin)
    .filter(Number.isFinite);
  const minimumPressure = Math.min(...pressures);
  const maximumPressure = Math.max(...pressures);
  const minimumFlow = Math.min(0, ...flows);
  const maximumFlow = Math.max(1, ...flows);
  const pressureSpan = Math.max(1, maximumPressure - minimumPressure);
  return Object.freeze({
    pressureMinimumMmHg: minimumPressure - pressureSpan * 0.04,
    pressureMaximumMmHg: maximumPressure + pressureSpan * 0.04,
    flowMinimumLPerMin: minimumFlow < 0 ? minimumFlow * 1.12 : 0,
    flowMaximumLPerMin: maximumFlow * 1.12,
  });
}

export function GuytonStarlingOrientationCanvasV3({
  orientation,
  className,
}: Readonly<{
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3;
  className?: string;
}>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const domain = React.useMemo(
    () => guytonStarlingPlotDomainV3(orientation),
    [orientation],
  );
  const draw = React.useCallback((
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const plot = plotRectV3(width, height);
    const theme = readThemeV3(containerRef.current);
    const x = (pressureMmHg: number) => scaleLinearV3(
      pressureMmHg,
      domain.pressureMinimumMmHg,
      domain.pressureMaximumMmHg,
      plot.left,
      plot.right,
    );
    const y = (flowLPerMin: number) => scaleLinearV3(
      flowLPerMin,
      domain.flowMinimumLPerMin,
      domain.flowMaximumLPerMin,
      plot.bottom,
      plot.top,
    );
    drawAxesV3(context, plot, domain, theme);
    drawCurveV3(
      context,
      orientation.curve.map((point) => ({
        pressureMmHg: point.downstreamPressureMmHg,
        flowLPerMin: point.returnFlowLPerMin,
      })),
      x,
      y,
      theme.structural,
      [],
    );
    if (orientation.starlingLocus.status === "measured-fixed-tbv-protocol") {
      drawCurveV3(
        context,
        orientation.starlingLocus.points.map((point) => ({
          pressureMmHg: point.fillingPressureMmHg,
          flowLPerMin: point.cardiacOutputLPerMin,
        })),
        x,
        y,
        theme.starling,
        [5, 4],
      );
    }
    drawPointV3(
      context,
      x(orientation.operatingPoint.downstreamPressureMmHg),
      y(orientation.operatingPoint.returnFlowLPerMin),
      theme.operating,
    );
    drawFillingPressureMarkerV3(
      context,
      x(orientation.fillingPressureMmHg),
      plot,
      theme.marker,
    );
  }, [domain, orientation]);
  useResponsiveCanvasFrameV3(containerRef, canvasRef, draw);

  const sideLabel = orientation.side === "right"
    ? "Systemic venous return"
    : "Pulmonary venous return";
  const starlingStatus = orientation.starlingLocus.status
    === "measured-fixed-tbv-protocol"
    ? "Qualified fixed-TBV Starling locus"
    : "Starling locus not shown · exact fixed-TBV fork protocol required";
  return (
    <div
      ref={containerRef}
      className={`relative min-h-56 h-full w-full overflow-hidden ${className ?? ""}`}
      data-chart-kind="guyton-starling-structural-orientation-v3"
      data-structural-semantics={orientation.semantics}
      data-starling-status={orientation.starlingLocus.status}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label={`${sideLabel}; frozen accepted-step structural orientation`}
      />
      <div className="pointer-events-none absolute left-12 top-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-wb-muted">
        <span className="inline-flex items-center gap-1 text-cyan-300">
          <span className="h-0.5 w-3 bg-cyan-300" />
          Structural return orientation
        </span>
        <span className="text-amber-300">● accepted-step return point</span>
        <span className="text-wb-subtle">
          {orientation.fillingPressureLabel} {formatNumberV3(
            orientation.fillingPressureMmHg,
          )} mmHg
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-1.5 right-2 max-w-[78%] text-right text-[9px] leading-3 text-wb-subtle">
        {starlingStatus}
      </div>
    </div>
  );
}

type PlotPointV3 = Readonly<{
  pressureMmHg: number;
  flowLPerMin: number;
}>;

type PlotRectV3 = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

type CanvasThemeV3 = Readonly<{
  grid: string;
  axis: string;
  text: string;
  structural: string;
  starling: string;
  operating: string;
  marker: string;
}>;

function plotRectV3(width: number, height: number): PlotRectV3 {
  return Object.freeze({
    left: Math.min(48, Math.max(34, width * 0.13)),
    right: Math.max(56, width - 12),
    top: 25,
    bottom: Math.max(50, height - 27),
  });
}

function drawAxesV3(
  context: CanvasRenderingContext2D,
  plot: PlotRectV3,
  domain: GuytonStarlingPlotDomainV3,
  theme: CanvasThemeV3,
): void {
  context.save();
  context.lineWidth = 1;
  context.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.textBaseline = "middle";
  for (let index = 0; index <= 4; index += 1) {
    const ratio = index / 4;
    const x = plot.left + ratio * (plot.right - plot.left);
    const pressure = domain.pressureMinimumMmHg
      + ratio * (domain.pressureMaximumMmHg - domain.pressureMinimumMmHg);
    context.strokeStyle = theme.grid;
    context.beginPath();
    context.moveTo(x, plot.top);
    context.lineTo(x, plot.bottom);
    context.stroke();
    context.fillStyle = theme.text;
    context.textAlign = "center";
    context.fillText(formatNumberV3(pressure), x, plot.bottom + 12);
  }
  for (let index = 0; index <= 4; index += 1) {
    const ratio = index / 4;
    const y = plot.bottom - ratio * (plot.bottom - plot.top);
    const flow = domain.flowMinimumLPerMin
      + ratio * (domain.flowMaximumLPerMin - domain.flowMinimumLPerMin);
    context.strokeStyle = theme.grid;
    context.beginPath();
    context.moveTo(plot.left, y);
    context.lineTo(plot.right, y);
    context.stroke();
    context.fillStyle = theme.text;
    context.textAlign = "right";
    context.fillText(formatNumberV3(flow), plot.left - 5, y);
  }
  context.strokeStyle = theme.axis;
  context.beginPath();
  context.moveTo(plot.left, plot.top);
  context.lineTo(plot.left, plot.bottom);
  context.lineTo(plot.right, plot.bottom);
  context.stroke();
  context.fillStyle = theme.text;
  context.textAlign = "center";
  context.fillText(
    "Downstream pressure (mmHg)",
    (plot.left + plot.right) / 2,
    plot.bottom + 23,
  );
  context.save();
  context.translate(10, (plot.top + plot.bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.fillText("Flow (L/min)", 0, 0);
  context.restore();
  context.restore();
}

function drawCurveV3(
  context: CanvasRenderingContext2D,
  points: readonly PlotPointV3[],
  x: (value: number) => number,
  y: (value: number) => number,
  color: string,
  dash: readonly number[],
): void {
  const finite = points.filter((point) =>
    Number.isFinite(point.pressureMmHg)
    && Number.isFinite(point.flowLPerMin));
  if (finite.length < 2) return;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 1.8;
  context.setLineDash([...dash]);
  context.beginPath();
  finite.forEach((point, index) => {
    const px = x(point.pressureMmHg);
    const py = y(point.flowLPerMin);
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  });
  context.stroke();
  context.restore();
}

function drawPointV3(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  context.save();
  context.fillStyle = color;
  context.strokeStyle = "rgba(15, 23, 42, 0.9)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(x, y, 4, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function drawFillingPressureMarkerV3(
  context: CanvasRenderingContext2D,
  x: number,
  plot: PlotRectV3,
  color: string,
): void {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.setLineDash([2, 4]);
  context.beginPath();
  context.moveTo(x, plot.top);
  context.lineTo(x, plot.bottom);
  context.stroke();
  context.restore();
}

function readThemeV3(element: HTMLElement | null): CanvasThemeV3 {
  const style = element === null ? null : getComputedStyle(element);
  const color = (name: string, fallback: string) =>
    style?.getPropertyValue(name).trim() || fallback;
  return Object.freeze({
    grid: color("--wb-grid", "rgba(148, 163, 184, 0.14)"),
    axis: color("--wb-axis", "rgba(148, 163, 184, 0.38)"),
    text: color("--wb-muted", "rgba(203, 213, 225, 0.72)"),
    structural: "#67e8f9",
    starling: "#e879f9",
    operating: "#fbbf24",
    marker: "rgba(103, 232, 249, 0.58)",
  });
}

function formatNumberV3(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
}

function plainRecordV3(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finiteNumberV3(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validStarlingLocusV3(value: unknown): boolean {
  if (!plainRecordV3(value) || !Array.isArray(value.points)) return false;
  if (value.status === "requires-protocol") return value.points.length === 0;
  return value.status === "measured-fixed-tbv-protocol"
    && value.points.every((point) => plainRecordV3(point)
      && finiteNumberV3(point.totalBloodVolumeMl)
      && finiteNumberV3(point.fillingPressureMmHg)
      && finiteNumberV3(point.cardiacOutputLPerMin)
      && point.settled === true
      && point.numericalQualificationPassed === true);
}
