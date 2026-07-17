import React from 'react';

import type {
  MainWireScientificObservableFrameV1,
  MainWireScientificObservableIdV1,
} from '@/engine/scientific/observables';

import {
  SCIENTIFIC_ALPHA_TERMINAL_WINDOW_SEC,
  scientificAlphaPlotDomainV1,
  scientificAlphaPvPointsV1,
  scientificAlphaTimeSeriesPointsV1,
  type ScientificAlphaPlotPointV1,
} from './scientificRuntimeAlphaHistoryV1';

const PLOT_WIDTH = 720;
const PLOT_HEIGHT = 250;
const MARGIN = Object.freeze({ left: 58, right: 18, top: 16, bottom: 40 });
const CHAMBER_COLORS = Object.freeze({
  LA: '#7dd3fc',
  RA: '#6ee7b7',
  LV: '#fb923c',
  RV: '#c4b5fd',
});

type Chamber = keyof typeof CHAMBER_COLORS;

type SeriesDefinition = Readonly<{
  label: string;
  observableId: MainWireScientificObservableIdV1;
  color: string;
}>;

const VALVE_SERIES: readonly SeriesDefinition[] = Object.freeze([
  { label: 'MV', observableId: 'valve.MV.flow', color: CHAMBER_COLORS.LA },
  { label: 'AoV', observableId: 'valve.AoV.flow', color: CHAMBER_COLORS.LV },
  { label: 'TV', observableId: 'valve.TV.flow', color: CHAMBER_COLORS.RA },
  { label: 'PV', observableId: 'valve.PV.flow', color: CHAMBER_COLORS.RV },
]);

const ATRIAL_PRESSURE_SERIES: readonly SeriesDefinition[] = Object.freeze([
  { label: 'LA', observableId: 'hemodynamics.pressure.absolute.LA', color: CHAMBER_COLORS.LA },
  { label: 'RA', observableId: 'hemodynamics.pressure.absolute.RA', color: CHAMBER_COLORS.RA },
]);

const VENTRICULAR_PRESSURE_SERIES: readonly SeriesDefinition[] = Object.freeze([
  { label: 'LV', observableId: 'hemodynamics.pressure.absolute.LV', color: CHAMBER_COLORS.LV },
  { label: 'RV', observableId: 'hemodynamics.pressure.absolute.RV', color: CHAMBER_COLORS.RV },
]);

const VASCULAR_PRESSURE_SERIES: readonly SeriesDefinition[] = Object.freeze([
  { label: 'Ao', observableId: 'hemodynamics.pressure.absolute.Ao', color: '#fda4af' },
  { label: 'PA', observableId: 'hemodynamics.pressure.absolute.PA', color: '#a5b4fc' },
  { label: 'PVein', observableId: 'hemodynamics.pressure.absolute.PVein', color: '#67e8f9' },
]);

export function ScientificAlphaPvTrajectories({
  frames,
}: Readonly<{ frames: readonly MainWireScientificObservableFrameV1[] }>) {
  return (
    <section className="space-y-3" aria-labelledby="scientific-alpha-pv-title">
      <ChartHeading
        id="scientific-alpha-pv-title"
        title="Four-chamber pressure–volume trajectories"
        detail="Absolute chamber pressure · latest terminal window"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {(['LA', 'RA', 'LV', 'RV'] as const).map((chamber) => (
          <PvChart key={chamber} chamber={chamber} frames={frames} />
        ))}
      </div>
    </section>
  );
}

export function ScientificAlphaWaveforms({
  frames,
}: Readonly<{ frames: readonly MainWireScientificObservableFrameV1[] }>) {
  return (
    <section className="space-y-4" aria-labelledby="scientific-alpha-waveform-title">
      <ChartHeading
        id="scientific-alpha-waveform-title"
        title="Flow and pressure waveforms"
        detail="Accepted-state readback · latest terminal window"
      />
      <TimeSeriesChart
        title="Valve flow"
        unit="mL/s"
        frames={frames}
        series={VALVE_SERIES}
        includeZero
      />
      <TimeSeriesChart
        title="Atrial absolute pressure"
        unit="mmHg"
        frames={frames}
        series={ATRIAL_PRESSURE_SERIES}
        includeZero={false}
      />
      <TimeSeriesChart
        title="Ventricular absolute pressure"
        unit="mmHg"
        frames={frames}
        series={VENTRICULAR_PRESSURE_SERIES}
        includeZero
      />
      <TimeSeriesChart
        title="Vascular absolute pressure"
        unit="mmHg"
        frames={frames}
        series={VASCULAR_PRESSURE_SERIES}
        includeZero
      />
    </section>
  );
}

function PvChart({
  chamber,
  frames,
}: Readonly<{
  chamber: Chamber;
  frames: readonly MainWireScientificObservableFrameV1[];
}>) {
  const points = scientificAlphaPvPointsV1(frames, chamber);
  const xDomain = scientificAlphaPlotDomainV1(points.map(({ x }) => x));
  const yDomain = scientificAlphaPlotDomainV1(points.map(({ y }) => y));
  const path = linePath(points, xDomain, yDomain);
  return (
    <figure className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <figcaption className="flex items-baseline justify-between gap-3 px-1">
        <span className="font-medium text-slate-100">{chamber}</span>
        <span className="text-xs text-slate-500">{points.length} accepted samples</span>
      </figcaption>
      <svg
        className="mt-2 h-auto w-full"
        viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
        role="img"
        aria-label={`${chamber} pressure-volume trajectory, volume in milliliters and pressure in millimeters of mercury`}
      >
        <title>{`${chamber} pressure-volume trajectory`}</title>
        <defs>
          <marker
            id={`scientific-alpha-pv-arrow-${chamber}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={CHAMBER_COLORS[chamber]} />
          </marker>
        </defs>
        <PlotAxes xDomain={xDomain} yDomain={yDomain} xUnit="mL" yUnit="mmHg" />
        {path !== '' && (
          <path
            data-testid={`scientific-alpha-pv-${chamber}`}
            d={path}
            fill="none"
            stroke={CHAMBER_COLORS[chamber]}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            markerEnd={`url(#scientific-alpha-pv-arrow-${chamber})`}
          />
        )}
        {points.length === 1 && (
          <circle
            cx={scale(points[0].x, xDomain, MARGIN.left, PLOT_WIDTH - MARGIN.right)}
            cy={scale(points[0].y, yDomain, PLOT_HEIGHT - MARGIN.bottom, MARGIN.top)}
            r="4"
            fill={CHAMBER_COLORS[chamber]}
          />
        )}
      </svg>
    </figure>
  );
}

function TimeSeriesChart({
  title,
  unit,
  frames,
  series,
  includeZero,
}: Readonly<{
  title: string;
  unit: string;
  frames: readonly MainWireScientificObservableFrameV1[];
  series: readonly SeriesDefinition[];
  includeZero: boolean;
}>) {
  const plotted = series.map((definition) => ({
    definition,
    points: scientificAlphaTimeSeriesPointsV1(frames, definition.observableId),
  }));
  const allPoints = plotted.flatMap(({ points }) => points);
  const xDomain = Object.freeze([
    0,
    SCIENTIFIC_ALPHA_TERMINAL_WINDOW_SEC,
  ]) as readonly [number, number];
  const yDomain = scientificAlphaPlotDomainV1(
    allPoints.map(({ y }) => y),
    includeZero,
  );
  return (
    <figure className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 px-1">
        <span className="font-medium text-slate-100">{title}</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          {series.map(({ label, color }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {label}
            </span>
          ))}
        </span>
      </figcaption>
      <svg
        className="mt-2 h-auto w-full"
        viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
        role="img"
        aria-label={`${title} over accepted simulation time in seconds, measured in ${unit}`}
      >
        <title>{title}</title>
        <PlotAxes xDomain={xDomain} yDomain={yDomain} xUnit="s" yUnit={unit} />
        {includeZero && yDomain[0] < 0 && yDomain[1] > 0 && (
          <line
            x1={MARGIN.left}
            x2={PLOT_WIDTH - MARGIN.right}
            y1={scale(0, yDomain, PLOT_HEIGHT - MARGIN.bottom, MARGIN.top)}
            y2={scale(0, yDomain, PLOT_HEIGHT - MARGIN.bottom, MARGIN.top)}
            stroke="#64748b"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {plotted.map(({ definition, points }) => {
          const path = linePath(points, xDomain, yDomain);
          return path === '' ? null : (
            <path
              key={definition.observableId}
              data-testid={`scientific-alpha-series-${definition.label}`}
              d={path}
              fill="none"
              stroke={definition.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </figure>
  );
}

function PlotAxes({
  xDomain,
  yDomain,
  xUnit,
  yUnit,
}: Readonly<{
  xDomain: readonly [number, number];
  yDomain: readonly [number, number];
  xUnit: string;
  yUnit: string;
}>) {
  const xTicks = ticks(xDomain);
  const yTicks = ticks(yDomain);
  const xBottom = PLOT_HEIGHT - MARGIN.bottom;
  return (
    <g aria-hidden="true">
      {yTicks.map((value) => {
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
              {formatTick(value)}
            </text>
          </g>
        );
      })}
      {xTicks.map((value) => {
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
              {formatTick(value)}
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
      <text x={(MARGIN.left + PLOT_WIDTH - MARGIN.right) / 2} y={PLOT_HEIGHT - 5} textAnchor="middle" fill="#94a3b8" fontSize="12">
        {xUnit}
      </text>
      <text
        x="13"
        y={(MARGIN.top + xBottom) / 2}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="12"
        transform={`rotate(-90 13 ${(MARGIN.top + xBottom) / 2})`}
      >
        {yUnit}
      </text>
    </g>
  );
}

function ChartHeading({
  id,
  title,
  detail,
}: Readonly<{ id: string; title: string; detail: string }>) {
  return (
    <div>
      <h2 id={id} className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function linePath(
  points: readonly ScientificAlphaPlotPointV1[],
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
): string {
  return points.map((point, index) => {
    const x = scale(point.x, xDomain, MARGIN.left, PLOT_WIDTH - MARGIN.right);
    const y = scale(point.y, yDomain, PLOT_HEIGHT - MARGIN.bottom, MARGIN.top);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

function scale(
  value: number,
  domain: readonly [number, number],
  outputMinimum: number,
  outputMaximum: number,
): number {
  return outputMinimum
    + ((value - domain[0]) / (domain[1] - domain[0]))
      * (outputMaximum - outputMinimum);
}

function ticks(domain: readonly [number, number]): readonly number[] {
  const middle = (domain[0] + domain[1]) / 2;
  return Object.freeze([domain[0], middle, domain[1]]);
}

function formatTick(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 1_000) return value.toFixed(0);
  if (magnitude >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
