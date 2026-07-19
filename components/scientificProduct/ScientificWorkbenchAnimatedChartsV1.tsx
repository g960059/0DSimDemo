import React from "react";
import * as d3 from "d3";

import { useDocumentVisible } from "@/hooks/useOnscreen";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type ScientificObservableUnitV1,
} from "@/engine/scientific/observables";
import { InteractiveGraphLegend } from "@/components/InteractiveGraphLegend";
import type { LegendPosition, PvLoopHistoryMode } from "@/types";

import type { ScientificWorkbenchDisplayClockV1 } from "./ScientificWorkbenchDisplayClockV1";

export type ScientificWorkbenchChartScenarioV1 = Readonly<{
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  frames: readonly MainWireScientificObservableFrameV1[];
  /** A complete, validated cycle may be repeated for presentation only. */
  periodicCycleFrames: readonly MainWireScientificObservableFrameV1[] | null;
  cycleDurationSec: number | null;
  /** Accepted-time origin of an open transition, retained across history trim. */
  transientOriginAcceptedTimeSec: number | null;
  displayedEvidence:
    | "open-transient-no-periodic-claim"
    | "target-period1-and-following-cycle-validated"
    | "retained-period1-source-cycle";
}>;

export type ScientificWorkbenchLegendEntryV1 = Readonly<{
  key: string;
  color: string;
  modelName: string;
  signalName: string;
  hidden?: boolean;
}>;

export type ScientificWorkbenchLegendInteractionV1 = Readonly<{
  panelId?: string;
  interactive?: boolean;
  onOpenSettings?: (panelId: string) => void;
  legendPosition?: LegendPosition;
  onLegendPositionChange?: (panelId: string, position?: LegendPosition) => void;
  ariaLabel?: string;
}>;

export type ScientificWorkbenchWaveformSeriesV1 = Readonly<{
  key: string;
  scenario: ScientificWorkbenchChartScenarioV1;
  observableId: MainWireScientificObservableIdV1;
  signalName: string;
  color: string;
}>;

export type ScientificWorkbenchPvSeriesV1 = Readonly<{
  key: string;
  scenario: ScientificWorkbenchChartScenarioV1;
  volumeObservableId: MainWireScientificObservableIdV1;
  pressureObservableId: MainWireScientificObservableIdV1;
  signalName: string;
  color: string;
}>;

const PLOT_PADDING = Object.freeze({ left: 48, right: 16, top: 24, bottom: 32 });
const DEFAULT_LEGEND_TOP_PX = 8;
const LEGEND_TO_PLOT_GAP_PX = 8;
const SWEEP_GAP_FRACTION = 0.025;
const CAP_RADIUS_PX = 4;
const TRANSIENT_VALUE_CACHE = new WeakMap<
  readonly MainWireScientificObservableFrameV1[],
  Map<string, readonly TimedValue[]>
>();

const OBSERVABLE_DEFINITIONS = new Map(
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((definition) => [
    definition.observableId,
    definition,
  ]),
);

export function ScientificWorkbenchWaveformCanvasV1({
  series,
  timeWindowMs,
  clock,
  showLegend = true,
  legendInteraction,
}: Readonly<{
  series: readonly ScientificWorkbenchWaveformSeriesV1[];
  timeWindowMs: number;
  clock: ScientificWorkbenchDisplayClockV1;
  showLegend?: boolean;
  legendInteraction?: ScientificWorkbenchLegendInteractionV1;
}>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const legendHeightRef = React.useRef(0);
  const onLegendHeightChange = React.useCallback((height: number) => {
    legendHeightRef.current = height;
  }, []);
  const seriesRef = React.useRef(series);
  seriesRef.current = series;
  const visible = useDocumentVisible();
  const timeWindowSec = Math.max(0.25, timeWindowMs / 1_000);
  const reserveLegendSpace =
    showLegend && legendInteraction?.legendPosition === undefined;
  const legend = React.useMemo(() => series.map((item) => ({
    key: item.key,
    color: item.color,
    modelName: item.scenario.name,
    signalName: item.signalName,
  })), [series]);

  React.useEffect(() => {
    if (!visible) return undefined;
    return animateCanvas(containerRef, canvasRef, (ctx, width, height, nowMs) => {
      const currentSeries = seriesRef.current;
      const plot = plotRect(
        width,
        height,
        scientificChartPlotTopV1(
          legendHeightRef.current,
          reserveLegendSpace,
        ),
      );
      const theme = canvasTheme(containerRef.current);
      const clockElapsedSeconds = clock.read(nowMs).elapsedSeconds;
      const sharedElapsedSeconds = scientificSharedOpenTransientElapsedSecondsV1(currentSeries)
        ?? clockElapsedSeconds;
      const cursor = positiveModulo(sharedElapsedSeconds, timeWindowSec);
      const samples = currentSeries.flatMap((item) =>
        periodicValues(item) ?? transientValues(item, timeWindowSec));
      const finiteValues = samples
        .map(({ value }) => value)
        .filter((value): value is number => value !== null && Number.isFinite(value));
      drawWaveformAxes(ctx, plot, width, height, finiteValues, timeWindowSec, theme);
      const domain = scientificChartDomainV1(finiteValues);
      const x = d3.scaleLinear().domain([0, timeWindowSec]).range([plot.left, plot.right]);
      const y = d3.scaleLinear().domain(domain).range([plot.bottom, plot.top]);

      let firstCap: Readonly<{ x: number; y: number }> | null = null;
      for (const item of currentSeries) {
        const periodic = periodicValues(item);
        const transient = item.scenario.periodicCycleFrames === null
          ? transientValues(item, timeWindowSec)
          : null;
        const transientCap = transient?.at(-1) ?? null;
        const seriesCursor = periodic !== null
          ? cursor
          : transientCap?.timeSec ?? cursor;
        const valueAtCursor = periodic !== null
          ? interpolatePeriodicValue(
            periodic,
            sharedElapsedSeconds,
            item.scenario.cycleDurationSec ?? 1,
          )
          : transientCap?.value ?? null;
        ctx.save();
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.globalAlpha = item.scenario.displayedEvidence === "open-transient-no-periodic-claim"
          ? 0.82
          : 1;
        if (periodic !== null) {
          drawPeriodicWaveform(
            ctx,
            periodic,
            item.scenario.cycleDurationSec ?? 1,
            timeWindowSec,
            cursor,
            x,
            y,
          );
        } else {
          drawTransientWaveform(
            ctx,
            transient ?? [],
            seriesCursor,
            timeWindowSec,
            x,
            y,
          );
        }
        ctx.restore();
        if (valueAtCursor !== null) {
          const cap = { x: x(seriesCursor), y: y(valueAtCursor) };
          drawCap(ctx, cap, item.color);
          firstCap ??= cap;
        }
      }
      publishCanvasEvidence(canvasRef.current, cursor, firstCap, width, height);
    });
  }, [
    clock,
    reserveLegendSpace,
    showLegend,
    timeWindowSec,
    visible,
  ]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      data-testid="scientific-workbench-waveform-canvas-v1"
    >
      {showLegend && (
        <ScientificWorkbenchChartLegendV1
          entries={legend}
          interaction={legendInteraction}
          onMeasuredHeightChange={onLegendHeightChange}
        />
      )}
      <canvas ref={canvasRef} className="block pointer-events-auto" data-chart-kind="waveform" />
    </div>
  );
}

export function ScientificWorkbenchPvLoopCanvasV1({
  series,
  clock,
  showLegend = true,
  historyBeats = 8,
  historyMode = "fade",
  legendInteraction,
}: Readonly<{
  series: readonly ScientificWorkbenchPvSeriesV1[];
  clock: ScientificWorkbenchDisplayClockV1;
  showLegend?: boolean;
  historyBeats?: number;
  historyMode?: PvLoopHistoryMode;
  legendInteraction?: ScientificWorkbenchLegendInteractionV1;
}>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const legendHeightRef = React.useRef(0);
  const onLegendHeightChange = React.useCallback((height: number) => {
    legendHeightRef.current = height;
  }, []);
  const seriesRef = React.useRef(series);
  seriesRef.current = series;
  const lastPeriodicTrajectoryBySeriesRef = React.useRef(
    new Map<string, readonly PvValue[]>(),
  );
  const retainedSourceTrajectoryBySeriesRef = React.useRef(
    new Map<string, RetainedScientificPvSourceTrajectoryV1>(),
  );
  updateRetainedScientificPvSourceTrajectoriesV1(
    series,
    lastPeriodicTrajectoryBySeriesRef.current,
    retainedSourceTrajectoryBySeriesRef.current,
  );
  const visible = useDocumentVisible();
  const reserveLegendSpace =
    showLegend && legendInteraction?.legendPosition === undefined;
  const legend = React.useMemo(() => series.map((item) => ({
    key: item.key,
    color: item.color,
    modelName: item.scenario.name,
    signalName: item.signalName,
  })), [series]);
  const normalizedHistoryBeats = normalizeScientificPvHistoryBeatsV1(historyBeats);
  const retainedTrajectoryCount = Math.max(
    0,
    ...series.map((item) => scientificPvTrajectoriesV1(
      item,
      normalizedHistoryBeats,
      retainedSourceTrajectoryBySeriesRef.current.get(item.key)?.points,
    ).filter(({ age }) => scientificPvHistoryAlphaV1(
      age,
      normalizedHistoryBeats,
      historyMode,
    ) > 0).length),
  );
  const retainedSourceTrajectoryCount = Math.max(
    0,
    ...series.map((item) => scientificPvTrajectoriesV1(
      item,
      normalizedHistoryBeats,
      retainedSourceTrajectoryBySeriesRef.current.get(item.key)?.points,
    ).filter((trajectory) =>
      trajectory.kind === "retained-source-periodic"
      && scientificPvHistoryAlphaV1(
        trajectory.age,
        normalizedHistoryBeats,
        historyMode,
      ) > 0).length),
  );

  React.useEffect(() => {
    if (!visible) return undefined;
    return animateCanvas(containerRef, canvasRef, (ctx, width, height, nowMs) => {
      const currentSeries = seriesRef.current;
      const plot = plotRect(
        width,
        height,
        scientificChartPlotTopV1(
          legendHeightRef.current,
          reserveLegendSpace,
        ),
      );
      const theme = canvasTheme(containerRef.current);
      const visibleTrajectoriesBySeries = new Map(
        currentSeries.map((item) => [
          item.key,
          scientificPvTrajectoriesV1(
            item,
            normalizedHistoryBeats,
            retainedSourceTrajectoryBySeriesRef.current.get(item.key)?.points,
          ).filter(({ age }) => scientificPvHistoryAlphaV1(
            age,
            normalizedHistoryBeats,
            historyMode,
          ) > 0),
        ]),
      );
      const allPoints = currentSeries.flatMap((item) =>
        (visibleTrajectoriesBySeries.get(item.key) ?? [])
          .flatMap((trajectory) => trajectory.points));
      const xDomain = scientificChartDomainV1(allPoints.map(({ volume }) => volume));
      const yDomain = scientificChartDomainV1(allPoints.map(({ pressure }) => pressure));
      const x = d3.scaleLinear().domain(xDomain).range([plot.left, plot.right]);
      const y = d3.scaleLinear().domain(yDomain).range([plot.bottom, plot.top]);
      drawCartesianAxes(ctx, plot, width, height, x, y, "Volume (mL)", "Pressure (mmHg)", theme);

      const sharedElapsedSeconds = scientificSharedOpenTransientElapsedSecondsV1(currentSeries)
        ?? clock.read(nowMs).elapsedSeconds;
      let firstCap: Readonly<{ x: number; y: number }> | null = null;
      let publishedPhase = 0;
      for (const item of currentSeries) {
        const points = pvPoints(item);
        if (points.length < 2) continue;
        const duration = item.scenario.cycleDurationSec
          ?? Math.max(1e-9, points.at(-1)!.timeSec - points[0].timeSec);
        const isOpenTransient =
          item.scenario.displayedEvidence === "open-transient-no-periodic-claim";
        const phase = isOpenTransient
          ? scientificOpenTransientElapsedSecondsV1(item.scenario)
            ?? points.at(-1)!.timeSec
          : positiveModulo(sharedElapsedSeconds, duration);
        publishedPhase = phase;
        const trajectories = visibleTrajectoriesBySeries.get(item.key) ?? [];
        for (const trajectory of [...trajectories].reverse()) {
          const alpha = scientificPvHistoryAlphaV1(
            trajectory.age,
            normalizedHistoryBeats,
            historyMode,
          );
          if (alpha <= 0 || trajectory.points.length < 2) continue;
          ctx.save();
          ctx.strokeStyle = item.color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = trajectory.age === 0 ? 2 : 1.6;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();
          trajectory.points.forEach((point, index) => {
            const px = x(point.volume);
            const py = y(point.pressure);
            if (index === 0 || point.breakBefore) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.restore();
        }
        const capPoint = isOpenTransient
          ? points.at(-1)!
          : interpolatePvPoint(points, phase, duration);
        if (capPoint !== null) {
          const cap = { x: x(capPoint.volume), y: y(capPoint.pressure) };
          drawCap(ctx, cap, item.color);
          firstCap ??= cap;
        }
      }
      publishCanvasEvidence(canvasRef.current, publishedPhase, firstCap, width, height);
    });
  }, [
    clock,
    historyMode,
    reserveLegendSpace,
    normalizedHistoryBeats,
    showLegend,
    visible,
  ]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      data-testid="scientific-workbench-pv-canvas-v1"
      data-pv-history-beats={normalizedHistoryBeats}
      data-pv-history-mode={historyMode}
      data-pv-history-trajectory-count={retainedTrajectoryCount}
      data-pv-history-source-trajectory-count={retainedSourceTrajectoryCount}
    >
      {showLegend && (
        <ScientificWorkbenchChartLegendV1
          entries={legend}
          interaction={legendInteraction}
          onMeasuredHeightChange={onLegendHeightChange}
        />
      )}
      <canvas ref={canvasRef} className="block pointer-events-auto" data-chart-kind="pvloop" />
    </div>
  );
}

export function ScientificWorkbenchChartLegendV1({
  entries,
  interaction,
  onMeasuredHeightChange,
}: Readonly<{
  entries: readonly ScientificWorkbenchLegendEntryV1[];
  interaction?: ScientificWorkbenchLegendInteractionV1;
  onMeasuredHeightChange?: (height: number) => void;
}>) {
  if (entries.length === 0) return null;
  const showsMultipleModels = new Set(entries.map(({ modelName }) => modelName)).size > 1;
  return (
    <InteractiveGraphLegend
      panelId={interaction?.panelId}
      interactive={interaction?.interactive}
      onOpenSettings={interaction?.onOpenSettings}
      position={interaction?.legendPosition}
      onPositionChange={interaction?.onLegendPositionChange}
      ariaLabel={interaction?.ariaLabel}
      onMeasuredHeightChange={onMeasuredHeightChange}
      className="flex max-w-[min(28rem,calc(100%-1rem))] flex-wrap gap-x-2 gap-y-0.5 rounded border border-wb-line bg-wb-panel/90 px-1.5 py-1 text-[9px] font-medium leading-3 tracking-normal text-wb-muted backdrop-blur-sm"
      testId="scientific-workbench-chart-legend-v1"
    >
      {entries.map((entry) => (
        <span
          key={entry.key}
          className="inline-flex min-w-0 items-center gap-1"
          aria-label={`${entry.modelName}, ${entry.signalName}`}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color, boxShadow: `0 0 3px ${entry.color}` }}
          />
          <span className="truncate">
            {showsMultipleModels
              ? `${entry.modelName} · ${entry.signalName}`
              : entry.signalName}
          </span>
        </span>
      ))}
    </InteractiveGraphLegend>
  );
}

export function scientificObservableShortLabelV1(
  observableId: MainWireScientificObservableIdV1,
): string {
  return SCIENTIFIC_SHORT_LABELS[observableId] ?? observableId;
}

export function scientificSeriesColorV1(
  baseColor: string,
  signalId: string,
  customColor?: string,
): string {
  if (customColor) return customColor;
  const base = d3.hsl(baseColor);
  if (!Number.isFinite(base.h)) return baseColor;
  const offset = ((stableHash(signalId) % 71) - 35);
  return d3.hsl(
    positiveModulo(base.h + offset, 360),
    Math.min(1, Math.max(0.42, base.s * 1.02)),
    Math.min(0.76, Math.max(0.38, base.l + ((stableHash(`${signalId}:l`) % 15) - 7) / 100)),
  ).formatHex();
}

export function scientificObservableUnitV1(
  observableId: MainWireScientificObservableIdV1,
): ScientificObservableUnitV1 {
  return OBSERVABLE_DEFINITIONS.get(observableId)?.unit ?? "1";
}

type TimedValue = Readonly<{
  timeSec: number;
  value: number | null;
  breakBefore?: boolean;
}>;
export type PvValue = Readonly<{
  timeSec: number;
  volume: number;
  pressure: number;
  breakBefore: boolean;
}>;

function periodicValues(item: ScientificWorkbenchWaveformSeriesV1): TimedValue[] | null {
  const frames = item.scenario.periodicCycleFrames;
  if (frames === null || frames.length < 2) return null;
  const start = frames[0].acceptedTimeSec;
  return frames.map((frame) => ({
    timeSec: frame.acceptedTimeSec - start,
    value: availableValue(frame, item.observableId),
  }));
}

function transientValues(
  item: ScientificWorkbenchWaveformSeriesV1,
  windowSec: number,
): readonly TimedValue[] {
  const frames = item.scenario.frames;
  const origin = item.scenario.transientOriginAcceptedTimeSec
    ?? frames[0]?.acceptedTimeSec
    ?? 0;
  const cacheKey = `${item.observableId}:${windowSec}:${origin}`;
  const cached = TRANSIENT_VALUE_CACHE.get(frames)?.get(cacheKey);
  if (cached !== undefined) return cached;
  const latest = frames.at(-1)?.acceptedTimeSec ?? 0;
  const firstRetainedIndex = lowerBoundAcceptedTimeV1(
    frames,
    latest - windowSec,
  );
  const retained = frames.slice(firstRetainedIndex);
  const projected = projectScientificTransientPhasesV1(
    retained.map(({ acceptedTimeSec }) => acceptedTimeSec - origin),
    windowSec,
  );
  const values = retained.map((frame, index) => ({
    timeSec: projected[index]!.phase,
    value: availableValue(frame, item.observableId),
    breakBefore: projected[index]!.breakBefore,
  }));
  const byKey = TRANSIENT_VALUE_CACHE.get(frames) ?? new Map();
  const frozenValues = Object.freeze(values);
  byKey.set(cacheKey, frozenValues);
  TRANSIENT_VALUE_CACHE.set(frames, byKey);
  return frozenValues;
}

function lowerBoundAcceptedTimeV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  targetSec: number,
): number {
  let low = 0;
  let high = frames.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (frames[middle]!.acceptedTimeSec < targetSec) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function projectScientificTransientPhasesV1(
  acceptedTimesSec: readonly number[],
  windowSec: number,
): readonly Readonly<{ phase: number; breakBefore: boolean }>[] {
  let previousPhase: number | null = null;
  return acceptedTimesSec.map((acceptedTimeSec) => {
    const phase = positiveModulo(acceptedTimeSec, windowSec);
    const breakBefore = previousPhase === null || phase < previousPhase;
    previousPhase = phase;
    return Object.freeze({ phase, breakBefore });
  });
}

export function scientificOpenTransientElapsedSecondsV1(
  scenario: ScientificWorkbenchChartScenarioV1,
): number | null {
  if (scenario.displayedEvidence !== "open-transient-no-periodic-claim") {
    return null;
  }
  const latest = scenario.frames.at(-1)?.acceptedTimeSec;
  const origin = scenario.transientOriginAcceptedTimeSec;
  if (
    latest === undefined
    || origin === null
    || !Number.isFinite(latest)
    || !Number.isFinite(origin)
    || latest < origin
  ) return null;
  return latest - origin;
}

export function scientificSharedOpenTransientElapsedSecondsV1(
  series: readonly Readonly<{
    scenario: ScientificWorkbenchChartScenarioV1;
  }>[],
): number | null {
  const elapsedByScenario = new Map<string, number>();
  for (const { scenario } of series) {
    const elapsed = scientificOpenTransientElapsedSecondsV1(scenario);
    if (elapsed !== null) elapsedByScenario.set(scenario.id, elapsed);
  }
  return elapsedByScenario.size === 1
    ? elapsedByScenario.values().next().value ?? null
    : null;
}

function pvPoints(item: ScientificWorkbenchPvSeriesV1): PvValue[] {
  const frames = item.scenario.periodicCycleFrames ?? item.scenario.frames;
  if (frames.length === 0) return [];
  const start = frames[0].acceptedTimeSec;
  let previousAvailable = false;
  return frames.flatMap((frame) => {
    const volume = availableValue(frame, item.volumeObservableId);
    const pressure = availableValue(frame, item.pressureObservableId);
    const available = volume !== null && pressure !== null;
    if (!available) {
      previousAvailable = false;
      return [];
    }
    const point = {
      timeSec: frame.acceptedTimeSec - start,
      volume,
      pressure,
      breakBefore: !previousAvailable,
    };
    previousAvailable = true;
    return [point];
  });
}

export type ScientificPvTrajectoryV1 = Readonly<{
  age: number;
  points: readonly PvValue[];
  kind: "periodic" | "transient" | "retained-source-periodic";
}>;

type RetainedScientificPvSourceTrajectoryV1 = Readonly<{
  transientOriginAcceptedTimeSec: number;
  points: readonly PvValue[];
}>;

/**
 * Splits an open accepted-step transition into cardiac-cycle trajectories.
 * The current (possibly incomplete) beat is age 0. Periodic evidence remains
 * one canonical trajectory because duplicated steady beats add no information.
 */
export function scientificPvTrajectoriesV1(
  item: ScientificWorkbenchPvSeriesV1,
  historyBeats = 8,
  retainedSourcePeriodicPoints?: readonly PvValue[],
): readonly ScientificPvTrajectoryV1[] {
  const horizon = normalizeScientificPvHistoryBeatsV1(historyBeats);
  const scenario = item.scenario;
  const cycleDurationSec = scenario.cycleDurationSec;
  const origin = scenario.transientOriginAcceptedTimeSec;
  if (
    scenario.displayedEvidence !== "open-transient-no-periodic-claim"
    || cycleDurationSec === null
    || origin === null
    || !(cycleDurationSec > 0)
  ) {
    const points = pvPoints(item);
    return points.length === 0
      ? Object.freeze([])
      : Object.freeze([Object.freeze({
        age: 0,
        points: Object.freeze(points),
        kind: "periodic" as const,
      })]);
  }

  const beats = new Map<number, MainWireScientificObservableFrameV1[]>();
  for (const frame of scenario.frames) {
    const elapsed = frame.acceptedTimeSec - origin;
    if (!Number.isFinite(elapsed) || elapsed < -1e-9) continue;
    const beatIndex = Math.max(0, Math.floor((elapsed + 1e-9) / cycleDurationSec));
    const bucket = beats.get(beatIndex) ?? [];
    bucket.push(frame);
    beats.set(beatIndex, bucket);
  }
  const latestBeat = Math.max(-1, ...beats.keys());
  if (latestBeat < 0) return Object.freeze([]);
  const trajectories: ScientificPvTrajectoryV1[] = [];
  for (let beatIndex = Math.max(0, latestBeat - horizon); beatIndex <= latestBeat; beatIndex += 1) {
    const frames = beats.get(beatIndex);
    if (frames === undefined) continue;
    const points = pvPoints({
      ...item,
      scenario: { ...scenario, frames, periodicCycleFrames: null },
    });
    if (points.length === 0) continue;
    trajectories.push(Object.freeze({
      age: latestBeat - beatIndex,
      points: Object.freeze(points),
      kind: "transient" as const,
    }));
  }
  // The source periodic loop is the visual state at transition time. Treat it
  // as history beat 0 until the first new beat completes, then age it with the
  // accepted-time transition. This prevents a one-frame axis collapse while
  // preserving the configured fade/persistent history semantics.
  if (
    horizon > 0
    && retainedSourcePeriodicPoints !== undefined
    && retainedSourcePeriodicPoints.length >= 2
    && latestBeat <= horizon
  ) {
    trajectories.push(Object.freeze({
      age: latestBeat,
      points: retainedSourcePeriodicPoints,
      kind: "retained-source-periodic" as const,
    }));
  }
  return Object.freeze(trajectories.sort((a, b) => a.age - b.age));
}

function updateRetainedScientificPvSourceTrajectoriesV1(
  series: readonly ScientificWorkbenchPvSeriesV1[],
  lastPeriodicTrajectoryBySeries: Map<string, readonly PvValue[]>,
  retainedSourceTrajectoryBySeries: Map<string, RetainedScientificPvSourceTrajectoryV1>,
): void {
  const currentKeys = new Set(series.map(({ key }) => key));
  for (const key of lastPeriodicTrajectoryBySeries.keys()) {
    if (!currentKeys.has(key)) lastPeriodicTrajectoryBySeries.delete(key);
  }
  for (const key of retainedSourceTrajectoryBySeries.keys()) {
    if (!currentKeys.has(key)) retainedSourceTrajectoryBySeries.delete(key);
  }

  for (const item of series) {
    const scenario = item.scenario;
    const isOpenTransient =
      scenario.displayedEvidence === "open-transient-no-periodic-claim";
    if (!isOpenTransient) {
      const periodicPoints = pvPoints(item);
      if (scenario.periodicCycleFrames !== null && periodicPoints.length >= 2) {
        lastPeriodicTrajectoryBySeries.set(item.key, Object.freeze(periodicPoints));
      }
      retainedSourceTrajectoryBySeries.delete(item.key);
      continue;
    }

    const origin = scenario.transientOriginAcceptedTimeSec;
    if (origin === null || !Number.isFinite(origin)) continue;
    const retained = retainedSourceTrajectoryBySeries.get(item.key);
    if (retained?.transientOriginAcceptedTimeSec === origin) continue;
    const sourcePoints = lastPeriodicTrajectoryBySeries.get(item.key);
    if (sourcePoints === undefined) continue;
    retainedSourceTrajectoryBySeries.set(item.key, Object.freeze({
      transientOriginAcceptedTimeSec: origin,
      points: sourcePoints,
    }));
  }
}

export function normalizeScientificPvHistoryBeatsV1(value: number): number {
  if (!Number.isFinite(value)) return 8;
  return Math.min(16, Math.max(0, Math.round(value)));
}

export function scientificPvHistoryAlphaV1(
  age: number,
  historyBeats: number,
  mode: PvLoopHistoryMode,
): number {
  if (age <= 0) return 1;
  const horizon = normalizeScientificPvHistoryBeatsV1(historyBeats);
  if (horizon === 0 || age > horizon) return 0;
  if (mode === "persistent") return 0.34;
  return 0.5 * Math.max(0, 1 - age / horizon);
}

function availableValue(
  frame: MainWireScientificObservableFrameV1,
  observableId: MainWireScientificObservableIdV1,
): number | null {
  const candidate = frame.values[observableId];
  return candidate.availability === "available"
    && candidate.value !== null
    && Number.isFinite(candidate.value)
    ? candidate.value
    : null;
}

function drawPeriodicWaveform(
  ctx: CanvasRenderingContext2D,
  values: readonly TimedValue[],
  cycleDurationSec: number,
  windowSec: number,
  cursor: number,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
): void {
  const repeats = Math.ceil(windowSec / cycleDurationSec) + 1;
  const gapSec = windowSec * SWEEP_GAP_FRACTION;
  ctx.beginPath();
  let drawing = false;
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    for (const point of values) {
      const plotTime = repeat * cycleDurationSec + point.timeSec;
      if (plotTime > windowSec + 1e-9) break;
      const draw = point.value !== null && !phaseWithinForwardGap(plotTime, cursor, gapSec, windowSec);
      if (!draw) {
        if (drawing) ctx.stroke();
        ctx.beginPath();
        drawing = false;
        continue;
      }
      const px = x(plotTime);
      const py = y(point.value!);
      if (!drawing) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      drawing = true;
    }
  }
  if (drawing) ctx.stroke();
}

function drawTransientWaveform(
  ctx: CanvasRenderingContext2D,
  values: readonly TimedValue[],
  cursor: number,
  windowSec: number,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
): void {
  const gapSec = windowSec * SWEEP_GAP_FRACTION;
  ctx.beginPath();
  let drawing = false;
  for (const point of values) {
    if (point.breakBefore && drawing) {
      ctx.stroke();
      ctx.beginPath();
      drawing = false;
    }
    const draw = point.value !== null
      && !phaseWithinForwardGap(point.timeSec, cursor, gapSec, windowSec);
    if (!draw) {
      if (drawing) ctx.stroke();
      ctx.beginPath();
      drawing = false;
      continue;
    }
    if (!drawing) ctx.moveTo(x(point.timeSec), y(point.value!));
    else ctx.lineTo(x(point.timeSec), y(point.value!));
    drawing = true;
  }
  if (drawing) ctx.stroke();
}

function interpolatePeriodicValue(
  values: readonly TimedValue[],
  windowCursorSec: number,
  cycleDurationSec: number,
): number | null {
  return interpolateTimedValue(values, positiveModulo(windowCursorSec, cycleDurationSec));
}

function interpolateTimedValue(
  values: readonly TimedValue[],
  target: number,
): number | null {
  for (let index = 1; index < values.length; index += 1) {
    const left = values[index - 1];
    const right = values[index];
    if (target < left.timeSec || target > right.timeSec) continue;
    if (left.value === null || right.value === null) return null;
    const span = right.timeSec - left.timeSec;
    const alpha = span > 1e-12 ? (target - left.timeSec) / span : 0;
    return left.value + (right.value - left.value) * alpha;
  }
  return values.at(-1)?.value ?? null;
}

function interpolatePvPoint(
  points: readonly PvValue[],
  phase: number,
  duration: number,
): Readonly<{ volume: number; pressure: number }> | null {
  const target = positiveModulo(phase, duration);
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1];
    const right = points[index];
    if (right.breakBefore || target < left.timeSec || target > right.timeSec) continue;
    const span = right.timeSec - left.timeSec;
    const alpha = span > 1e-12 ? (target - left.timeSec) / span : 0;
    return {
      volume: left.volume + (right.volume - left.volume) * alpha,
      pressure: left.pressure + (right.pressure - left.pressure) * alpha,
    };
  }
  const fallback = points.at(-1);
  return fallback ? { volume: fallback.volume, pressure: fallback.pressure } : null;
}

function animateCanvas(
  containerRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    nowMs: number,
  ) => void,
): () => void {
  const container = containerRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");
  if (!container || !canvas || !ctx) return () => undefined;
  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let stopped = false;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width || container.clientWidth));
    height = Math.max(1, Math.floor(rect.height || container.clientHeight));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const render = (nowMs: number) => {
    if (stopped) return;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height, nowMs);
    animationFrame = requestAnimationFrame(render);
  };
  animationFrame = requestAnimationFrame(render);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
    observer.disconnect();
  };
}

function plotRect(
  width: number,
  height: number,
  top: number = PLOT_PADDING.top,
) {
  const bottom = Math.max(PLOT_PADDING.top + 1, height - PLOT_PADDING.bottom);
  const safeTop = Math.min(
    Math.max(PLOT_PADDING.top, top),
    bottom - 1,
  );
  return {
    left: PLOT_PADDING.left,
    right: Math.max(PLOT_PADDING.left + 1, width - PLOT_PADDING.right),
    top: safeTop,
    bottom,
  };
}

export function scientificChartPlotTopV1(
  legendHeightPx: number,
  reserveDefaultLegendSpace: boolean,
): number {
  if (!reserveDefaultLegendSpace || !Number.isFinite(legendHeightPx)) {
    return PLOT_PADDING.top;
  }
  return Math.max(
    PLOT_PADDING.top,
    DEFAULT_LEGEND_TOP_PX + Math.max(0, legendHeightPx) + LEGEND_TO_PLOT_GAP_PX,
  );
}

function drawWaveformAxes(
  ctx: CanvasRenderingContext2D,
  plot: ReturnType<typeof plotRect>,
  width: number,
  height: number,
  values: readonly number[],
  windowSec: number,
  theme: CanvasTheme,
): void {
  const x = d3.scaleLinear().domain([0, windowSec]).range([plot.left, plot.right]);
  const y = d3.scaleLinear().domain(scientificChartDomainV1(values)).range([plot.bottom, plot.top]);
  drawCartesianAxes(ctx, plot, width, height, x, y, "Time (s)", "", theme);
}

function drawCartesianAxes(
  ctx: CanvasRenderingContext2D,
  plot: ReturnType<typeof plotRect>,
  width: number,
  height: number,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  xLabel: string,
  yLabel: string,
  theme: CanvasTheme,
): void {
  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  x.ticks(5).forEach((tick) => {
    ctx.moveTo(x(tick), plot.top);
    ctx.lineTo(x(tick), plot.bottom);
  });
  y.ticks(5).forEach((tick) => {
    ctx.moveTo(plot.left, y(tick));
    ctx.lineTo(plot.right, y(tick));
  });
  ctx.stroke();
  ctx.fillStyle = theme.tick;
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  x.ticks(5).forEach((tick) => ctx.fillText(formatTick(tick), x(tick), plot.bottom + 7));
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  y.ticks(5).forEach((tick) => ctx.fillText(formatTick(tick), plot.left - 8, y(tick)));
  ctx.fillStyle = theme.label;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  if (xLabel) ctx.fillText(xLabel, width / 2, height - 3);
  if (yLabel) {
    ctx.save();
    ctx.translate(13, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawCap(
  ctx: CanvasRenderingContext2D,
  point: Readonly<{ x: number; y: number }>,
  color: string,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, CAP_RADIUS_PX, 0, Math.PI * 2);
  ctx.fillStyle = d3.color(color)?.brighter(0.5).formatHex() ?? color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 5;
  ctx.fill();
  ctx.restore();
}

export function scientificChartDomainV1(values: readonly number[]): [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  const observedMin = d3.min(finite) ?? 0;
  const observedMax = d3.max(finite) ?? 1;
  if (observedMin >= 0) {
    if (observedMax <= 1e-12) return [0, 1];
    const upperPadding = Math.max(1e-6, observedMax * 0.08);
    return [0, observedMax + upperPadding];
  }
  let min = observedMin;
  let max = observedMax;
  if (Math.abs(max - min) < 1e-12) {
    min -= 0.5;
    max += 0.5;
  }
  const padding = Math.max(1e-6, (max - min) * 0.08);
  return [min - padding, max + padding];
}

function phaseWithinForwardGap(
  phase: number,
  cursor: number,
  gap: number,
  period: number,
): boolean {
  const forward = positiveModulo(phase - cursor, period);
  return forward > 0 && forward < gap;
}

function positiveModulo(value: number, period: number): number {
  if (!(period > 0)) return 0;
  const result = value % period;
  return result < 0 ? result + period : result;
}

function publishCanvasEvidence(
  canvas: HTMLCanvasElement | null,
  cursor: number,
  cap: Readonly<{ x: number; y: number }> | null,
  width: number,
  height: number,
): void {
  if (!canvas) return;
  canvas.dataset.cursor = cursor.toFixed(6);
  canvas.dataset.capX = cap?.x.toFixed(3) ?? "";
  canvas.dataset.capY = cap?.y.toFixed(3) ?? "";
  canvas.dataset.cssWidth = String(width);
  canvas.dataset.cssHeight = String(height);
}

type CanvasTheme = Readonly<{ grid: string; tick: string; label: string }>;

function canvasTheme(container: HTMLElement | null): CanvasTheme {
  if (!container || typeof getComputedStyle === "undefined") {
    return { grid: "#334155", tick: "#64748b", label: "#94a3b8" };
  }
  const style = getComputedStyle(container);
  const css = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    grid: css("--wb-border", "#334155"),
    tick: css("--wb-text-subtle", "#64748b"),
    label: css("--wb-text-muted", "#94a3b8"),
  };
}

function formatTick(value: number): string {
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1).replace(/\.0$/, "");
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

const SCIENTIFIC_SHORT_LABELS: Readonly<Partial<Record<
MainWireScientificObservableIdV1, string>>> = Object.freeze({
  "hemodynamics.volume.LA": "LA volume",
  "hemodynamics.volume.RA": "RA volume",
  "hemodynamics.volume.LV": "LV volume",
  "hemodynamics.volume.RV": "RV volume",
  "hemodynamics.pressure.absolute.LA": "LAP",
  "hemodynamics.pressure.absolute.RA": "RAP",
  "hemodynamics.pressure.absolute.LV": "LVP",
  "hemodynamics.pressure.absolute.RV": "RVP",
  "hemodynamics.pressure.absolute.Ao": "AoP",
  "hemodynamics.pressure.absolute.PA": "PAP",
  "hemodynamics.pressure.absolute.PVein": "PVP",
  "valve.MV.flow": "MV flow",
  "valve.AoV.flow": "AoV flow",
  "valve.TV.flow": "TV flow",
  "valve.PV.flow": "PV flow",
  "hemodynamics.flow.pulmonary_venous": "Pulmonary venous flow",
  "valve.MV.opening_fraction": "MV opening",
  "valve.AoV.opening_fraction": "AoV opening",
  "valve.TV.opening_fraction": "TV opening",
  "valve.PV.opening_fraction": "PV opening",
  "pericardium.excess_pressure": "Pericardial pressure",
});
