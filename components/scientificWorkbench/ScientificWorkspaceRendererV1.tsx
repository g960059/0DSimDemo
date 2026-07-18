import React from "react";

import type {
  MainWireScientificWorkspaceDocumentV1,
  MainWireScientificWorkspacePanelLayoutV1,
  MainWireScientificWorkspacePanelV1,
} from "@/engine/scientific/documents/MainWireScientificWorkspaceDocumentV1";
import type {
  MainWireScientificObservableFrameV1,
  MainWireScientificObservableIdV1,
  ScientificObservableQualityV1,
  ScientificObservableUnitV1,
} from "@/engine/scientific/observables/MainWireScientificObservableRegistryV1";

import {
  boundScientificWorkspaceHistoryV1,
  projectScientificWorkspaceNumericRowsV1,
  projectScientificWorkspacePvTrajectoryV1,
  projectScientificWorkspaceTimeSeriesV1,
  type ScientificWorkspacePlotPointV1,
  type ScientificWorkspacePvProjectionV1,
  type ScientificWorkspacePvSegmentV1,
  type ScientificWorkspaceTimeSeriesProjectionV1,
  type ScientificWorkspaceTimeSeriesSegmentV1,
} from "./scientificWorkspaceProjectionV1";

const PLOT_WIDTH = 720;
const PLOT_HEIGHT = 260;
const MARGIN = Object.freeze({ left: 64, right: 20, top: 18, bottom: 42 });
const SERIES_COLORS = Object.freeze([
  "#38bdf8",
  "#fb923c",
  "#34d399",
  "#c4b5fd",
  "#f472b6",
  "#facc15",
  "#2dd4bf",
  "#a3e635",
]);
const MAX_RENDERED_PANELS = 64;
const MAX_GRID_COLUMNS = 24;
const MAX_GRID_ROWS = 128;

export type ScientificWorkspaceRendererV1Props = Readonly<{
  workspaceDocument: MainWireScientificWorkspaceDocumentV1;
  frames: readonly MainWireScientificObservableFrameV1[];
  className?: string;
}>;

/**
 * Presentation-only renderer for a loaded WorkspaceDocument V1. It has no
 * simulation, persistence, controls, or scientific-state mutation surface.
 */
export const ScientificWorkspaceRendererV1 = React.memo(function ScientificWorkspaceRendererV1({
  workspaceDocument,
  frames,
  className,
}: ScientificWorkspaceRendererV1Props) {
  const boundedHistory = boundScientificWorkspaceHistoryV1(frames);
  const allPanels = workspaceDocument.content.panels;
  const panels = allPanels.slice(0, MAX_RENDERED_PANELS);
  const omittedPanelCount = allPanels.length - panels.length;
  const firstFrame = frames[0] ?? null;
  const finalFrame = frames.at(-1) ?? null;
  const gridColumnCount = Math.min(
    MAX_GRID_COLUMNS,
    Math.max(1, ...panels.map(({ layout }) => layout.x + layout.width)),
  );

  return (
    <section
      className={className}
      data-testid="scientific-workspace-renderer-v1"
      data-workspace-sha256={workspaceDocument.ref.sha256}
      data-base-case-sha256={workspaceDocument.content.caseDocumentRef.sha256}
      data-frame-count={frames.length}
      data-first-revision={firstFrame?.revision ?? ""}
      data-final-revision={finalFrame?.revision ?? ""}
      data-first-accepted-time-sec={firstFrame?.acceptedTimeSec ?? ""}
      data-final-accepted-time-sec={finalFrame?.acceptedTimeSec ?? ""}
    >
      {(boundedHistory.omittedFrameCount > 0 || omittedPanelCount > 0) && (
        <p
          className="mb-3 rounded-lg border border-amber-700/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-200"
          data-testid="scientific-workspace-render-limit-notice"
          role="status"
        >
          Presentation guardrail applied:
          {boundedHistory.omittedFrameCount > 0
            ? ` ${boundedHistory.omittedFrameCount} older frame(s) omitted.`
            : ""}
          {omittedPanelCount > 0
            ? ` ${omittedPanelCount} trailing panel(s) omitted.`
            : ""}
        </p>
      )}
      {workspaceDocument.content.notes !== null && (
        <p className="mb-3 whitespace-pre-wrap text-sm text-slate-400">
          {workspaceDocument.content.notes}
        </p>
      )}
      <div
        className="grid gap-4"
        data-testid="scientific-workspace-grid"
        style={{
          gridTemplateColumns: `repeat(${gridColumnCount}, minmax(0, 1fr))`,
          gridAutoRows: "minmax(3rem, auto)",
        }}
      >
        {panels.map((panel) => {
          const layout = boundedPanelLayout(panel.layout, gridColumnCount);
          return (
            <article
              key={panel.panelId}
              className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              data-testid={`scientific-workspace-panel-${panel.panelId}`}
              data-panel-kind={panel.view.kind}
              data-layout-clamped={String(layout.clamped)}
              style={{
                gridColumn: `${layout.x + 1} / span ${layout.width}`,
                gridRow: `${layout.y + 1} / span ${layout.height}`,
              }}
            >
              <header className="mb-3">
                <h2 className="font-semibold text-slate-100">{panel.title}</h2>
              </header>
              <ScientificWorkspacePanelViewV1
                panel={panel}
                frames={boundedHistory.frames}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
});

function ScientificWorkspacePanelViewV1({
  panel,
  frames,
}: Readonly<{
  panel: MainWireScientificWorkspacePanelV1;
  frames: readonly MainWireScientificObservableFrameV1[];
}>) {
  if (panel.view.kind === "time-series") {
    return (
      <ScientificWorkspaceTimeSeriesPanelV1
        panelId={panel.panelId}
        frames={frames}
        observableIds={panel.view.observableIds}
      />
    );
  }
  if (panel.view.kind === "pressure-volume") {
    const trajectories = panel.view.trajectories.map((trajectory) =>
      projectScientificWorkspacePvTrajectoryV1(frames, trajectory));
    return (
      <ScientificWorkspacePvPanelV1
        panelId={panel.panelId}
        trajectories={trajectories}
      />
    );
  }
  return (
    <ScientificWorkspaceNumericTablePanelV1
      frames={frames}
      observableIds={panel.view.observableIds}
    />
  );
}

function ScientificWorkspaceTimeSeriesPanelV1({
  panelId,
  frames,
  observableIds,
}: Readonly<{
  panelId: string;
  frames: readonly MainWireScientificObservableFrameV1[];
  observableIds: readonly MainWireScientificObservableIdV1[];
}>) {
  const projections = observableIds.map((observableId) =>
    projectScientificWorkspaceTimeSeriesV1(frames, observableId));
  const byUnit = new Map<ScientificObservableUnitV1,
  ScientificWorkspaceTimeSeriesProjectionV1[]>();
  for (const projection of projections) {
    const entries = byUnit.get(projection.unit) ?? [];
    entries.push(projection);
    byUnit.set(projection.unit, entries);
  }

  return (
    <div className="space-y-4">
      {[...byUnit].map(([unit, series]) => (
        <TimeSeriesUnitChartV1
          key={unit}
          panelId={panelId}
          unit={unit}
          series={series}
        />
      ))}
    </div>
  );
}

function TimeSeriesUnitChartV1({
  panelId,
  unit,
  series,
}: Readonly<{
  panelId: string;
  unit: ScientificObservableUnitV1;
  series: readonly ScientificWorkspaceTimeSeriesProjectionV1[];
}>) {
  const allPoints = series.flatMap(({ segments }) =>
    segments.flatMap(({ points }) => points));
  const xDomain = plotDomain(allPoints.map(({ x }) => x));
  const yDomain = plotDomain(allPoints.map(({ y }) => y));

  return (
    <figure data-testid={`scientific-workspace-time-series-${panelId}-${unit}`}>
      <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
        {series.map((projection, index) => (
          <span
            key={projection.observableId}
            className="inline-flex flex-wrap items-center gap-1.5"
            data-observable-id={projection.observableId}
            data-available-samples={projection.availableSampleCount}
            data-unavailable-samples={projection.unavailableSampleCount}
          >
            <span
              className="inline-block h-0.5 w-4"
              style={{ backgroundColor: seriesColor(index) }}
              aria-hidden="true"
            />
            <span>{projection.label}</span>
            <span className="text-slate-500">
              {qualitySummary(projection.qualities)} · {projection.availableSampleCount}/
              {projection.availableSampleCount + projection.unavailableSampleCount}
            </span>
          </span>
        ))}
      </figcaption>
      {xDomain === null || yDomain === null ? (
        <UnavailablePlotMessage />
      ) : (
        <svg
          className="h-auto w-full"
          viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
          role="img"
          aria-label={`Time series in ${unit}; unavailable samples are omitted and split the rendered paths`}
        >
          <title>{`Time series (${unit})`}</title>
          <PlotAxesV1
            xDomain={xDomain}
            yDomain={yDomain}
            xUnit="elapsed s"
            yUnit={unit}
          />
          {series.map((projection, seriesIndex) =>
            projection.segments.map((segment, segmentIndex) => (
              <PlotSegmentV1
                key={`${projection.observableId}-${segmentIndex}`}
                testId={`scientific-workspace-series-${panelId}-${projection.observableId}-${segmentIndex}`}
                segment={segment}
                color={seriesColor(seriesIndex)}
                xDomain={xDomain}
                yDomain={yDomain}
              />
            )))}
        </svg>
      )}
    </figure>
  );
}

function ScientificWorkspacePvPanelV1({
  panelId,
  trajectories,
}: Readonly<{
  panelId: string;
  trajectories: readonly ScientificWorkspacePvProjectionV1[];
}>) {
  const allPoints = trajectories.flatMap(({ segments }) =>
    segments.flatMap(({ points }) => points));
  const xDomain = plotDomain(allPoints.map(({ x }) => x));
  const yDomain = plotDomain(allPoints.map(({ y }) => y));
  const volumeUnits = [...new Set(trajectories.map(({ volumeUnit }) => volumeUnit))];
  const pressureUnits = [...new Set(
    trajectories.map(({ pressureUnit }) => pressureUnit),
  )];

  return (
    <figure data-testid={`scientific-workspace-pv-${panelId}`}>
      <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
        {trajectories.map((trajectory, index) => (
          <span
            key={trajectory.trajectoryId}
            className="inline-flex flex-wrap items-center gap-1.5"
            data-trajectory-id={trajectory.trajectoryId}
            data-volume-observable-id={trajectory.volumeObservableId}
            data-pressure-observable-id={trajectory.pressureObservableId}
            data-available-pairs={trajectory.availablePairCount}
            data-unavailable-pairs={trajectory.unavailablePairCount}
          >
            <span
              className="inline-block h-0.5 w-4"
              style={{ backgroundColor: seriesColor(index) }}
              aria-hidden="true"
            />
            <span>{trajectory.label}</span>
            <span className="text-slate-500">
              V {qualitySummary(trajectory.volumeQualities)} / P {qualitySummary(trajectory.pressureQualities)} · {trajectory.availablePairCount}/
              {trajectory.availablePairCount + trajectory.unavailablePairCount}
            </span>
          </span>
        ))}
      </figcaption>
      {xDomain === null || yDomain === null ? (
        <UnavailablePlotMessage />
      ) : (
        <svg
          className="h-auto w-full"
          viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
          role="img"
          aria-label="Pressure-volume trajectories; both paired observables must be available, otherwise the path is split"
        >
          <title>Pressure-volume trajectories</title>
          <PlotAxesV1
            xDomain={xDomain}
            yDomain={yDomain}
            xUnit={volumeUnits.join(" / ")}
            yUnit={pressureUnits.join(" / ")}
          />
          {trajectories.map((trajectory, trajectoryIndex) =>
            trajectory.segments.map((segment, segmentIndex) => (
              <PvPlotSegmentV1
                key={`${trajectory.trajectoryId}-${segmentIndex}`}
                testId={`scientific-workspace-pv-segment-${panelId}-${trajectory.trajectoryId}-${segmentIndex}`}
                segment={segment}
                color={seriesColor(trajectoryIndex)}
                xDomain={xDomain}
                yDomain={yDomain}
              />
            )))}
        </svg>
      )}
    </figure>
  );
}

function ScientificWorkspaceNumericTablePanelV1({
  frames,
  observableIds,
}: Readonly<{
  frames: readonly MainWireScientificObservableFrameV1[];
  observableIds: readonly MainWireScientificObservableIdV1[];
}>) {
  const rows = projectScientificWorkspaceNumericRowsV1(frames, observableIds);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="border-b border-slate-800 px-2 py-2 font-medium">Observable</th>
            <th className="border-b border-slate-800 px-2 py-2 font-medium">Value</th>
            <th className="border-b border-slate-800 px-2 py-2 font-medium">Availability</th>
            <th className="border-b border-slate-800 px-2 py-2 font-medium">Quality</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.observableId}
              data-observable-id={row.observableId}
              data-availability={row.availability}
              data-quality={row.quality}
              data-finite-value-available={String(row.finiteValueAvailable)}
            >
              <th className="border-b border-slate-900 px-2 py-2 font-medium text-slate-200">
                <span>{row.label}</span>
                <span className="block font-mono text-[10px] font-normal text-slate-600">
                  {row.observableId}
                </span>
              </th>
              <td className="border-b border-slate-900 px-2 py-2 tabular-nums text-slate-100">
                {row.finiteValueAvailable && row.value !== null
                  ? `${formatNumber(row.value)} ${row.unit}`
                  : "—"}
              </td>
              <td className="border-b border-slate-900 px-2 py-2 text-slate-400">
                {row.availability === "available" && !row.finiteValueAvailable
                  ? "available (no finite value)"
                  : row.availability}
              </td>
              <td className="border-b border-slate-900 px-2 py-2 text-slate-400">
                {row.quality}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {frames.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">No observable frame is available.</p>
      )}
    </div>
  );
}

function PlotSegmentV1({
  testId,
  segment,
  color,
  xDomain,
  yDomain,
}: Readonly<{
  testId: string;
  segment: ScientificWorkspaceTimeSeriesSegmentV1;
  color: string;
  xDomain: PlotDomain;
  yDomain: PlotDomain;
}>) {
  if (segment.points.length === 1) {
    return (
      <PlotPointV1
        testId={testId}
        point={segment.points[0]}
        color={color}
        xDomain={xDomain}
        yDomain={yDomain}
        dataQuality={segment.quality}
      />
    );
  }
  return (
    <path
      data-testid={testId}
      data-quality={segment.quality}
      d={linePath(segment.points, xDomain, yDomain)}
      fill="none"
      stroke={color}
      strokeDasharray={qualityDashArray(segment.quality)}
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function PvPlotSegmentV1({
  testId,
  segment,
  color,
  xDomain,
  yDomain,
}: Readonly<{
  testId: string;
  segment: ScientificWorkspacePvSegmentV1;
  color: string;
  xDomain: PlotDomain;
  yDomain: PlotDomain;
}>) {
  const dashArray = qualityDashArray(
    combinedQuality(segment.volumeQuality, segment.pressureQuality),
  );
  if (segment.points.length === 1) {
    return (
      <PlotPointV1
        testId={testId}
        point={segment.points[0]}
        color={color}
        xDomain={xDomain}
        yDomain={yDomain}
        dataQuality={`${segment.volumeQuality}/${segment.pressureQuality}`}
        volumeQuality={segment.volumeQuality}
        pressureQuality={segment.pressureQuality}
      />
    );
  }
  return (
    <path
      data-testid={testId}
      data-volume-quality={segment.volumeQuality}
      data-pressure-quality={segment.pressureQuality}
      d={linePath(segment.points, xDomain, yDomain)}
      fill="none"
      stroke={color}
      strokeDasharray={dashArray}
      strokeWidth="2.25"
      strokeLinejoin="round"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function PlotPointV1({
  testId,
  point,
  color,
  xDomain,
  yDomain,
  dataQuality,
  volumeQuality,
  pressureQuality,
}: Readonly<{
  testId: string;
  point: ScientificWorkspacePlotPointV1;
  color: string;
  xDomain: PlotDomain;
  yDomain: PlotDomain;
  dataQuality: string;
  volumeQuality?: ScientificObservableQualityV1;
  pressureQuality?: ScientificObservableQualityV1;
}>) {
  return (
    <circle
      data-testid={testId}
      data-quality={dataQuality}
      data-volume-quality={volumeQuality}
      data-pressure-quality={pressureQuality}
      cx={scale(point.x, xDomain, MARGIN.left, PLOT_WIDTH - MARGIN.right)}
      cy={scale(point.y, yDomain, PLOT_HEIGHT - MARGIN.bottom, MARGIN.top)}
      r="3"
      fill={color}
    />
  );
}

type PlotDomain = readonly [number, number];

function PlotAxesV1({
  xDomain,
  yDomain,
  xUnit,
  yUnit,
}: Readonly<{
  xDomain: PlotDomain;
  yDomain: PlotDomain;
  xUnit: string;
  yUnit: string;
}>) {
  const xBottom = PLOT_HEIGHT - MARGIN.bottom;
  return (
    <g aria-hidden="true">
      {ticks(yDomain).map((value) => {
        const y = scale(value, yDomain, xBottom, MARGIN.top);
        return (
          <g key={`y-${value}`}>
            <line
              x1={MARGIN.left}
              x2={PLOT_WIDTH - MARGIN.right}
              y1={y}
              y2={y}
              stroke="#334155"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text x={MARGIN.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="12">
              {formatNumber(value)}
            </text>
          </g>
        );
      })}
      {ticks(xDomain).map((value) => {
        const x = scale(value, xDomain, MARGIN.left, PLOT_WIDTH - MARGIN.right);
        return (
          <g key={`x-${value}`}>
            <line
              x1={x}
              x2={x}
              y1={MARGIN.top}
              y2={xBottom}
              stroke="#1e293b"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text x={x} y={xBottom + 18} textAnchor="middle" fill="#94a3b8" fontSize="12">
              {formatNumber(value)}
            </text>
          </g>
        );
      })}
      <line
        x1={MARGIN.left}
        x2={PLOT_WIDTH - MARGIN.right}
        y1={xBottom}
        y2={xBottom}
        stroke="#64748b"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={MARGIN.left}
        x2={MARGIN.left}
        y1={MARGIN.top}
        y2={xBottom}
        stroke="#64748b"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={(MARGIN.left + PLOT_WIDTH - MARGIN.right) / 2}
        y={PLOT_HEIGHT - 6}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="12"
      >
        {xUnit}
      </text>
      <text
        x="14"
        y={(MARGIN.top + xBottom) / 2}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="12"
        transform={`rotate(-90 14 ${(MARGIN.top + xBottom) / 2})`}
      >
        {yUnit}
      </text>
    </g>
  );
}

function UnavailablePlotMessage() {
  return (
    <p
      className="rounded-lg border border-dashed border-slate-800 px-3 py-6 text-center text-sm text-slate-500"
      data-testid="scientific-workspace-no-available-samples"
    >
      No finite, available samples to plot.
    </p>
  );
}

function boundedPanelLayout(
  layout: MainWireScientificWorkspacePanelLayoutV1,
  gridColumnCount: number,
): MainWireScientificWorkspacePanelLayoutV1 & Readonly<{ clamped: boolean }> {
  const x = Math.min(layout.x, gridColumnCount - 1);
  const y = Math.min(layout.y, MAX_GRID_ROWS - 1);
  const width = Math.min(layout.width, gridColumnCount - x);
  const height = Math.min(layout.height, MAX_GRID_ROWS - y);
  return Object.freeze({
    x,
    y,
    width,
    height,
    clamped: x !== layout.x
      || y !== layout.y
      || width !== layout.width
      || height !== layout.height,
  });
}

function plotDomain(values: readonly number[]): PlotDomain | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  if (minimum === maximum) {
    const padding = Math.max(Math.abs(minimum) * 0.05, 1e-6);
    return Object.freeze([minimum - padding, maximum + padding]);
  }
  const padding = (maximum - minimum) * 0.06;
  return Object.freeze([minimum - padding, maximum + padding]);
}

function linePath(
  points: readonly ScientificWorkspacePlotPointV1[],
  xDomain: PlotDomain,
  yDomain: PlotDomain,
): string {
  return points.map((point, index) => {
    const x = scale(point.x, xDomain, MARGIN.left, PLOT_WIDTH - MARGIN.right);
    const y = scale(point.y, yDomain, PLOT_HEIGHT - MARGIN.bottom, MARGIN.top);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function scale(
  value: number,
  domain: PlotDomain,
  outputMinimum: number,
  outputMaximum: number,
): number {
  return outputMinimum
    + ((value - domain[0]) / (domain[1] - domain[0]))
      * (outputMaximum - outputMinimum);
}

function ticks(domain: PlotDomain): readonly number[] {
  return Object.freeze([
    domain[0],
    (domain[0] + domain[1]) / 2,
    domain[1],
  ]);
}

function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

function qualityDashArray(quality: ScientificObservableQualityV1): string | undefined {
  if (quality === "solver-diagnostic") return "7 4";
  if (quality === "not-assessed") return "2 4";
  return undefined;
}

function combinedQuality(
  left: ScientificObservableQualityV1,
  right: ScientificObservableQualityV1,
): ScientificObservableQualityV1 {
  if (left === "not-assessed" || right === "not-assessed") return "not-assessed";
  if (left === "solver-diagnostic" || right === "solver-diagnostic") {
    return "solver-diagnostic";
  }
  if (left === "accepted-derived" || right === "accepted-derived") {
    return "accepted-derived";
  }
  return "authoritative-state";
}

function qualitySummary(qualities: readonly ScientificObservableQualityV1[]): string {
  return qualities.length === 0 ? "not-assessed" : qualities.join(" / ");
}

function formatNumber(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 1_000) return value.toFixed(0);
  if (magnitude >= 10) return value.toFixed(1);
  if (magnitude >= 1) return value.toFixed(2);
  if (magnitude === 0) return "0";
  return value.toPrecision(3);
}
