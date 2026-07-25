import React from "react";
import * as d3 from "d3";
import { useTranslation } from "react-i18next";

import { useDocumentVisible } from "@/hooks/useOnscreen";
import {
  StudioBriefingPickOverlayV1,
  useStudioBriefingPickV1,
} from "./ScientificWorkbenchBriefingPickV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type ScientificObservableUnitV1,
} from "@/engine/scientific/observables";
import { InteractiveGraphLegend } from "@/components/InteractiveGraphLegend";
import {
  DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT,
  type LegendPosition,
  type PvLoopHistoryMode,
  type PvLoopParameterHistoryCount,
} from "@/types";

import type { ScientificWorkbenchDisplayClockV1 } from "./ScientificWorkbenchDisplayClockV1";
import type {
  ScientificPvBoundaryGuidePointV1,
  ScientificPvBoundaryGuideV1,
} from "./ScientificPvBoundaryGuidesV1";
import {
  advanceScientificPvProgressivePresentationStateV1,
  createScientificPvProgressivePresentationStateV1,
  presentScientificPvProgressivePresentationStateV1,
  type ScientificPvPresentationDomainV1,
  type ScientificPvPresentationGenerationInputV1,
  type ScientificPvPresentationScenarioInputV1,
} from "./ScientificPvProgressivePresentationStateV1";

export type ScientificWorkbenchChartScenarioV1 = Readonly<{
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  frames: readonly MainWireScientificObservableFrameV1[];
  parameterGenerationHistory: readonly Readonly<{
    targetGeneration: number;
    parameterEpoch: number;
    controlStateSha256: string;
    frames: readonly MainWireScientificObservableFrameV1[];
    periodicCycleFrames:
      readonly MainWireScientificObservableFrameV1[] | null;
    cycleDurationSec: number | null;
    transientOriginAcceptedTimeSec: number | null;
    displayedEvidence:
      | "open-transient-no-periodic-claim"
      | "settled-snapshot-one-point"
      | "target-period1-and-following-cycle-validated"
      | "retained-period1-source-cycle";
  }>[];
  /** Latest complete beat selected for live metrics and orientation guides. */
  guideCycleFrames?: readonly MainWireScientificObservableFrameV1[] | null;
  /** A complete, validated cycle may be repeated for presentation only. */
  periodicCycleFrames: readonly MainWireScientificObservableFrameV1[] | null;
  cycleDurationSec: number | null;
  /** Accepted-time origin of an open transition, retained across history trim. */
  transientOriginAcceptedTimeSec: number | null;
  displayedEvidence:
    | "open-transient-no-periodic-claim"
    | "settled-snapshot-one-point"
    | "target-period1-and-following-cycle-validated"
    | "retained-period1-source-cycle";
}>;

export type ScientificWorkbenchLegendEntryV1 = Readonly<{
  key: string;
  color: string;
  modelName: string;
  signalName: string;
  /** The observable this entry reads, when the entry names a single signal. */
  signalId?: string;
  hidden?: boolean;
  progress?: Readonly<{
    status: "running" | "complete" | "stale";
    completed: number;
    total: number;
  }>;
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

export type ScientificWorkbenchPvRelationPointV1 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

export type ScientificWorkbenchPvRelationOverlayV1 = Readonly<{
  key: string;
  scenarioId: string;
  scenarioName?: string;
  color: string;
  status: "running" | "complete" | "limited" | "stale" | "error";
  espvrQuality?: "accepted" | "limited" | "unavailable";
  edpvrQuality?: "accepted" | "limited" | "unavailable";
  errorMessage?: string;
  pressureBasis: "intracavitary" | "transmural";
  completedBeatCount: number;
  maximumBeatCount: number;
  generationAge?: number;
  espvr: readonly ScientificWorkbenchPvRelationPointV1[];
  edpvr: readonly ScientificWorkbenchPvRelationPointV1[];
  endSystolicSamples?: readonly ScientificWorkbenchPvRelationPointV1[];
  endDiastolicSamples?: readonly ScientificWorkbenchPvRelationPointV1[];
  /** V3 higher-loading observations; never a pooled or formal relation fit. */
  higherLoadingEndSystolicObserved?:
    readonly ScientificWorkbenchPvRelationPointV1[];
  /** V3 higher-loading observations; never a pooled or formal relation fit. */
  higherLoadingEndDiastolicObserved?:
    readonly ScientificWorkbenchPvRelationPointV1[];
  higherLoadingQuality?: "accepted" | "limited" | "unavailable";
  domainAnchorPoints?: readonly ScientificWorkbenchPvRelationPointV1[];
}>;

export type ScientificWorkbenchPvRelationQualityNoticeV1 = Readonly<{
  key: string;
  scenarioName: string;
  relation: "ESPVR" | "EDPVR";
  quality: "limited" | "unavailable";
}>;

export function scientificPvRelationQualityNoticesV1(
  relations: readonly ScientificWorkbenchPvRelationOverlayV1[],
): readonly ScientificWorkbenchPvRelationQualityNoticeV1[] {
  return Object.freeze(relations.flatMap((overlay) => {
    if ((overlay.generationAge ?? 0) !== 0) return [];
    const scenarioName = overlay.scenarioName ?? overlay.scenarioId;
    return (["espvr", "edpvr"] as const).flatMap((relation) => {
      const quality = relation === "espvr"
        ? overlay.espvrQuality
        : overlay.edpvrQuality;
      if (quality === undefined || quality === "accepted") return [];
      return [Object.freeze({
        key: `${overlay.key}:${relation}:${quality}`,
        scenarioName,
        relation: relation.toUpperCase() as "ESPVR" | "EDPVR",
        quality,
      })];
    });
  }));
}

/**
 * Selects an atomic scale anchor per scenario. While a replacement is still
 * running, the newest usable previous generation continues to own the scale;
 * this prevents the native loop from jumping when the pending curve is empty
 * or only partially acquired.
 */
export function scientificPvRelationDomainPointsV1(
  relations: readonly ScientificWorkbenchPvRelationOverlayV1[],
): readonly ScientificWorkbenchPvRelationPointV1[] {
  const grouped = new Map<string, ScientificWorkbenchPvRelationOverlayV1[]>();
  for (const relation of relations) {
    const group = grouped.get(relation.scenarioId) ?? [];
    group.push(relation);
    grouped.set(relation.scenarioId, group);
  }
  const result: ScientificWorkbenchPvRelationPointV1[] = [];
  for (const group of grouped.values()) {
    const ordered = [...group].sort(
      (left, right) => (left.generationAge ?? 0) - (right.generationAge ?? 0),
    );
    const current = ordered.find((relation) =>
      (relation.generationAge ?? 0) === 0);
    const previous = ordered.find((relation) =>
      (relation.generationAge ?? 0) > 0 && pvRelationHasDomainEvidence(relation));
    const selected = current !== undefined
      && current.status !== "running"
      && pvRelationHasDomainEvidence(current)
        ? current
        : previous ?? (current !== undefined && pvRelationHasDomainEvidence(current)
          ? current
          : undefined);
    if (selected === undefined) continue;
    const anchors = pvRelationDomainAnchors(selected);
    result.push(...(
      selected.status === "complete" || selected.status === "running"
        ? [...selected.espvr, ...selected.edpvr, ...anchors]
        : anchors
    ));
  }
  return Object.freeze(result.filter(({ volumeMl, pressureMmHg }) =>
    Number.isFinite(volumeMl) && Number.isFinite(pressureMmHg)));
}

function pvRelationDomainAnchors(
  relation: ScientificWorkbenchPvRelationOverlayV1,
): readonly ScientificWorkbenchPvRelationPointV1[] {
  return relation.domainAnchorPoints ?? [
    ...(relation.endSystolicSamples ?? []),
    ...(relation.endDiastolicSamples ?? []),
    ...(relation.higherLoadingEndSystolicObserved ?? []),
    ...(relation.higherLoadingEndDiastolicObserved ?? []),
  ];
}

function pvRelationHasDomainEvidence(
  relation: ScientificWorkbenchPvRelationOverlayV1,
): boolean {
  return relation.espvr.length >= 2
    || relation.edpvr.length >= 2
    || pvRelationDomainAnchors(relation).length >= 2;
}

export function scientificPvBoundaryGuidePresentationInputsV1(
  guides: readonly ScientificPvBoundaryGuideV1[],
): readonly ScientificPvPresentationScenarioInputV1<
  ScientificPvBoundaryGuideV1
>[] {
  const grouped = new Map<string, ScientificPvBoundaryGuideV1[]>();
  for (const guide of guides) {
    const group = grouped.get(guide.scenarioId) ?? [];
    group.push(guide);
    grouped.set(guide.scenarioId, group);
  }
  return Object.freeze([...grouped.entries()].flatMap(
    ([scenarioId, scenarioGuides]) => {
      const ordered = [...scenarioGuides].sort((left, right) =>
        (left.generationAge ?? 0) - (right.generationAge ?? 0));
      const currentGuide = ordered.find((guide) =>
        (guide.generationAge ?? 0) === 0) ?? ordered[0];
      if (currentGuide === undefined) return [];
      const current = scientificPvBoundaryGuideGenerationInputV1(
        currentGuide,
      );
      const history = ordered
        .filter((guide) => guide !== currentGuide)
        .map(scientificPvBoundaryGuideGenerationInputV1);
      const pending = currentGuide.replacementPending === true
        ? Object.freeze({
            generationId: `${current.generationId}:incoming`,
            sequence: current.sequence,
            status: "running" as const,
            renderable: false,
            payload: null,
            domain: null,
          })
        : null;
      return [Object.freeze({
        scenarioId,
        current,
        pending,
        history: Object.freeze(history),
      })];
    },
  ));
}

export function scientificPvPresentationDomainFromPointsV1(
  points: readonly ScientificWorkbenchPvRelationPointV1[],
): ScientificPvPresentationDomainV1 | null {
  const finite = points.filter(({ volumeMl, pressureMmHg }) =>
    Number.isFinite(volumeMl) && Number.isFinite(pressureMmHg));
  if (finite.length === 0) return null;
  return Object.freeze({
    volumeMl: Object.freeze([
      Math.min(...finite.map(({ volumeMl }) => volumeMl)),
      Math.max(...finite.map(({ volumeMl }) => volumeMl)),
    ]) as readonly [number, number],
    pressureMmHg: Object.freeze([
      Math.min(...finite.map(({ pressureMmHg }) => pressureMmHg)),
      Math.max(...finite.map(({ pressureMmHg }) => pressureMmHg)),
    ]) as readonly [number, number],
  });
}

function scientificPvBoundaryGuideGenerationInputV1(
  guide: ScientificPvBoundaryGuideV1,
): ScientificPvPresentationGenerationInputV1<ScientificPvBoundaryGuideV1> {
  const points = [...guide.espvr, ...guide.edpvr];
  return Object.freeze({
    generationId: guide.generationId ?? `textbook:${guide.key}`,
    sequence: guide.generationSequence ?? 0,
    status: guide.status === "running"
      ? "running" as const
      : guide.status === "stale"
        ? "stale" as const
        : "complete" as const,
    renderable: points.length >= 2,
    payload: guide,
    domain: scientificPvPresentationDomainFromPointsV1(points),
  });
}

const PLOT_PADDING = Object.freeze({ left: 64, right: 16, top: 24, bottom: 32 });
const COMPACT_PLOT_LEFT_PX = 58;
const Y_AXIS_TITLE_GUTTER_PX = 42;
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
    signalId: item.observableId,
  })), [series]);
  const retainedParameterHistorySeriesCount = series.filter((item) =>
    waveformParameterGenerationValuesV1(item, timeWindowSec).length > 0)
    .length;

  React.useEffect(() => {
    if (!visible) return undefined;
    return animateCanvas(containerRef, canvasRef, (ctx, width, height, nowMs) => {
      const currentSeries = seriesRef.current;
      const plot = scientificChartPlotRectV1(
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
        [
          ...(periodicValues(item) ?? transientValues(item, timeWindowSec)),
          ...waveformParameterGenerationValuesV1(item, timeWindowSec),
        ]);
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
        const parameterHistory =
          waveformParameterGenerationValuesV1(item, timeWindowSec);
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
        if (parameterHistory.length > 0) {
          ctx.save();
          ctx.globalAlpha = 0.22;
          ctx.lineWidth = 1.25;
          drawStaticWaveform(ctx, parameterHistory, x, y);
          ctx.restore();
        }
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
      data-waveform-parameter-history-series-count={
        retainedParameterHistorySeriesCount
      }
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
  boundaryGuides = [],
  relations = [],
  clock,
  showLegend = true,
  historyBeats = 8,
  historyMode = "fade",
  parameterHistoryCount = DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT,
  legendInteraction,
}: Readonly<{
  series: readonly ScientificWorkbenchPvSeriesV1[];
  boundaryGuides?: readonly ScientificPvBoundaryGuideV1[];
  relations?: readonly ScientificWorkbenchPvRelationOverlayV1[];
  clock: ScientificWorkbenchDisplayClockV1;
  showLegend?: boolean;
  historyBeats?: number;
  historyMode?: PvLoopHistoryMode;
  parameterHistoryCount?: PvLoopParameterHistoryCount;
  legendInteraction?: ScientificWorkbenchLegendInteractionV1;
}>) {
  const { t } = useTranslation();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const legendHeightRef = React.useRef(0);
  const onLegendHeightChange = React.useCallback((height: number) => {
    legendHeightRef.current = height;
  }, []);
  const seriesRef = React.useRef(series);
  seriesRef.current = series;
  const boundaryGuidesRef = React.useRef(boundaryGuides);
  boundaryGuidesRef.current = boundaryGuides;
  const relationsRef = React.useRef(relations);
  relationsRef.current = relations;
  const guidePresentationStateRef = React.useRef(
    createScientificPvProgressivePresentationStateV1<
      ScientificPvBoundaryGuideV1
    >({ historyLimit: 5 }),
  );
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
  const reducedMotion = usePrefersReducedMotionV1();
  const reserveLegendSpace =
    showLegend && legendInteraction?.legendPosition === undefined;
  const legend = React.useMemo(() => series.map((item) => {
    const guide = boundaryGuides.find((candidate) =>
      candidate.scenarioId === item.scenario.id
      && (candidate.generationAge ?? 0) === 0);
    const relation = relations.find((candidate) =>
      candidate.scenarioId === item.scenario.id
      && (candidate.generationAge ?? 0) === 0);
    const completed = guide?.completedPointCount
      ?? relation?.completedBeatCount
      ?? 0;
    const total = guide?.maximumPointCount
      ?? relation?.maximumBeatCount
      ?? 0;
    const status = guide?.status === "running" || relation?.status === "running"
      ? "running" as const
      : guide?.status === "stale"
        || relation?.status === "stale"
        || relation?.status === "error"
        ? "stale" as const
        : guide?.status === "complete" || relation?.status === "complete"
          ? "complete" as const
          : null;
    return {
      key: item.key,
      color: item.color,
      modelName: item.scenario.name,
      signalName: item.signalName,
      progress: status === null || total <= 0
        ? undefined
        : Object.freeze({ status, completed, total }),
    };
  }), [boundaryGuides, relations, series]);
  const qualityNotices = React.useMemo(
    () => scientificPvRelationQualityNoticesV1(relations),
    [relations],
  );
  const pressureBasisKinds = new Set(series.map((item) =>
    item.pressureObservableId.includes(".transmural.")
      ? "transmural"
      : "intracavitary"));
  const accessiblePressureBasis = pressureBasisKinds.size > 1
    ? t('workbench.panelGrid.pvRelationMixedPressureAxis')
    : pressureBasisKinds.has("transmural")
      ? t('workbench.panelGrid.pvRelationTransmuralPressureAxis')
      : t('workbench.panelGrid.pvRelationIntracavitaryPressureAxis');
  const canvasAriaLabel = [
    `${[
      ...new Set(series.map((item) => item.signalName)),
    ].join(", ")} · ${accessiblePressureBasis}.`,
    boundaryGuides.some((guide) =>
      guide.espvr.length >= 2 || guide.edpvr.length >= 2)
      ? t('workbench.panelGrid.textbookPvGuidesDescription')
      : null,
    relations.length > 0
      ? t('workbench.panelGrid.pvRelationsDescription')
      : null,
  ].filter(Boolean).join(" ");
  const normalizedHistoryBeats = normalizeScientificPvHistoryBeatsV1(historyBeats);
  const normalizedParameterHistoryCount =
    normalizeScientificPvParameterHistoryCountV1(parameterHistoryCount);
  const retainedTrajectoryCount = Math.max(
    0,
    ...series.map((item) => scientificPvTrajectoriesV1(
      item,
      normalizedHistoryBeats,
      retainedSourceTrajectoryBySeriesRef.current.get(item.key)?.points,
      normalizedParameterHistoryCount,
    ).filter((trajectory) =>
      trajectory.kind === "parameter-generation"
        ? scientificPvParameterGenerationAlphaV1(
          trajectory.age,
          normalizedParameterHistoryCount,
        ) > 0
        : scientificPvHistoryAlphaV1(
          trajectory.age,
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
      normalizedParameterHistoryCount,
    ).filter((trajectory) =>
      trajectory.kind === "retained-source-periodic"
      && scientificPvHistoryAlphaV1(
        trajectory.age,
        normalizedHistoryBeats,
        historyMode,
      ) > 0).length),
  );
  const retainedParameterGenerationCount = Math.max(
    0,
    ...series.map((item) => scientificPvTrajectoriesV1(
      item,
      normalizedHistoryBeats,
      retainedSourceTrajectoryBySeriesRef.current.get(item.key)?.points,
      normalizedParameterHistoryCount,
    ).filter((trajectory) =>
      trajectory.kind === "parameter-generation"
      && scientificPvParameterGenerationAlphaV1(
        trajectory.age,
        normalizedParameterHistoryCount,
      ) > 0).length),
  );

  React.useEffect(() => {
    if (!visible) return undefined;
    return animateCanvas(containerRef, canvasRef, (ctx, width, height, nowMs) => {
      const currentSeries = seriesRef.current;
      const currentBoundaryGuides = boundaryGuidesRef.current;
      const currentRelations = relationsRef.current;
      const plot = scientificChartPlotRectV1(
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
            normalizedParameterHistoryCount,
          ).filter((trajectory) =>
            trajectory.kind === "parameter-generation"
              ? scientificPvParameterGenerationAlphaV1(
                trajectory.age,
                normalizedParameterHistoryCount,
              ) > 0
              : scientificPvHistoryAlphaV1(
                trajectory.age,
                normalizedHistoryBeats,
                historyMode,
              ) > 0),
        ]),
      );
      const allPoints = currentSeries.flatMap((item) =>
        scientificPvTrajectoryDomainPointsV1(
          visibleTrajectoriesBySeries.get(item.key) ?? [],
        ));
      const relationPoints = scientificPvRelationDomainPointsV1(
        currentRelations,
      );
      const baseDomain = scientificPvPresentationDomainFromPointsV1([
        ...allPoints.map(({ volume, pressure }) => Object.freeze({
          volumeMl: volume,
          pressureMmHg: pressure,
        })),
        ...relationPoints,
      ]);
      guidePresentationStateRef.current =
        advanceScientificPvProgressivePresentationStateV1(
          guidePresentationStateRef.current,
          Object.freeze({
            nowMs,
            reducedMotion,
            baseDomain,
            scenarios: scientificPvBoundaryGuidePresentationInputsV1(
              currentBoundaryGuides,
            ),
          }),
        );
      const guidePresentation =
        presentScientificPvProgressivePresentationStateV1(
          guidePresentationStateRef.current,
          nowMs,
        );
      const xDomain = scientificChartDomainV1(
        guidePresentation.domain === null
          ? allPoints.map(({ volume }) => volume)
          : [...guidePresentation.domain.volumeMl],
      );
      const yDomain = scientificChartDomainV1(
        guidePresentation.domain === null
          ? allPoints.map(({ pressure }) => pressure)
          : [...guidePresentation.domain.pressureMmHg],
      );
      const x = d3.scaleLinear().domain(xDomain).range([plot.left, plot.right]);
      const y = d3.scaleLinear().domain(yDomain).range([plot.bottom, plot.top]);
      const pressureBasisCount = currentSeries.reduce((counts, item) => {
        const basis = item.pressureObservableId.includes(".transmural.")
          ? "transmural"
          : "intracavitary";
        counts[basis] += 1;
        return counts;
      }, { transmural: 0, intracavitary: 0 });
      const pressureLabel = pressureBasisCount.transmural > 0
        && pressureBasisCount.intracavitary > 0
        ? t('workbench.panelGrid.pvRelationMixedPressureAxis')
        : pressureBasisCount.transmural > 0
          ? t('workbench.panelGrid.pvRelationTransmuralPressureAxis')
          : t('workbench.panelGrid.pvRelationIntracavitaryPressureAxis');
      drawCartesianAxes(
        ctx,
        plot,
        width,
        height,
        x,
        y,
        t('workbench.panelGrid.pvRelationVolumeAxis'),
        pressureLabel,
        theme,
      );

      for (const layer of guidePresentation.layers) {
        drawScientificPvBoundaryGuideV1(
          ctx,
          layer.payload,
          x,
          y,
          theme,
          layer.opacity,
        );
      }

      for (const relation of currentRelations) {
        drawScientificPvRelationOverlayV1(ctx, relation, x, y, theme);
      }

      const sharedElapsedSeconds = scientificSharedOpenTransientElapsedSecondsV1(currentSeries)
        ?? clock.read(nowMs).elapsedSeconds;
      let firstCap: Readonly<{ x: number; y: number }> | null = null;
      let publishedPhase = 0;
      for (const item of currentSeries) {
        const points = pvPoints(item);
        const trajectories = visibleTrajectoriesBySeries.get(item.key) ?? [];
        for (const trajectory of [...trajectories].reverse()) {
          const alpha = trajectory.kind === "parameter-generation"
            ? scientificPvParameterGenerationAlphaV1(
              trajectory.age,
              normalizedParameterHistoryCount,
            )
            : scientificPvHistoryAlphaV1(
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
        // A parameter transition resets the current trace to one point. Its
        // retained parameter-generation trajectories remain drawable at that
        // exact boundary even though the incoming loop cannot yet produce a
        // path or cap.
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
    reducedMotion,
    reserveLegendSpace,
    normalizedHistoryBeats,
    normalizedParameterHistoryCount,
    showLegend,
    t,
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
      data-pv-parameter-history-count={retainedParameterGenerationCount}
      data-pv-boundary-guide-count={boundaryGuides.length}
      data-pv-guide-espvr-curve-count={boundaryGuides.filter((guide) =>
        guide.espvr.length >= 2).length}
      data-pv-guide-edpvr-curve-count={boundaryGuides.filter((guide) =>
        guide.edpvr.length >= 2).length}
      data-pv-relation-count={relations.length}
      data-pv-espvr-curve-count={relations.filter((relation) =>
        relation.espvr.length >= 2).length}
      data-pv-edpvr-curve-count={relations.filter((relation) =>
        relation.edpvr.length >= 2).length}
      data-pv-higher-loading-segment-count={relations.filter((relation) =>
        (relation.higherLoadingEndSystolicObserved?.length ?? 0) >= 2
        || (relation.higherLoadingEndDiastolicObserved?.length ?? 0) >= 2
      ).length}
    >
      {showLegend && (
        <ScientificWorkbenchChartLegendV1
          entries={legend}
          interaction={legendInteraction}
          onMeasuredHeightChange={onLegendHeightChange}
        />
      )}
      <canvas
        ref={canvasRef}
        className="block pointer-events-auto"
        data-chart-kind="pvloop"
        role="img"
        aria-label={canvasAriaLabel}
      />
      <ScientificPvRelationQualityNoticeV1 notices={qualityNotices} />
      {!relations.some((relation) => relation.status === "running") && (() => {
        const notice = relations.find((relation) =>
          (relation.generationAge ?? 0) === 0
          && (relation.status === "stale" || relation.status === "error"));
        if (notice === undefined) return null;
        return (
          <div
            className={`pointer-events-none absolute bottom-2 left-2 max-w-[min(24rem,calc(100%-1rem))] rounded border bg-wb-panel/92 px-2 py-1 text-[9px] font-semibold backdrop-blur-sm ${
              notice.status === "error"
                ? "border-wb-danger/40 bg-wb-danger-soft text-wb-danger"
                : "border-wb-line text-wb-muted"
            }`}
            role="status"
            aria-live="polite"
            title={notice.errorMessage}
            data-testid="scientific-pv-relation-state-v1"
          >
            {notice.scenarioName ?? notice.scenarioId} · {t(
              notice.status === "error"
                ? 'workbench.panelGrid.pvRelationUpdateFailed'
                : 'workbench.panelGrid.pvRelationAwaitingSettlement',
            )}
          </div>
        );
      })()}
    </div>
  );
}

export function drawScientificPvBoundaryGuideV1(
  ctx: CanvasRenderingContext2D,
  guide: ScientificPvBoundaryGuideV1,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  theme?: CanvasTheme,
  opacityMultiplier = guide.opacityMultiplier ?? 1,
): void {
  const color = scientificRelationColorV1(guide.color, theme);
  const opacity = Math.max(0, Math.min(1, opacityMultiplier));
  drawScientificPvBoundaryGuidePathV1(
    ctx,
    guide.espvr,
    x,
    y,
    color,
    0.4 * opacity,
  );
  drawScientificPvBoundaryGuidePathV1(
    ctx,
    guide.edpvr,
    x,
    y,
    color,
    0.4 * opacity,
  );
}

function drawScientificPvBoundaryGuidePathV1(
  ctx: CanvasRenderingContext2D,
  points: readonly ScientificPvBoundaryGuidePointV1[],
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  color: string,
  alpha: number,
): void {
  const finite = points.filter(({ volumeMl, pressureMmHg }) =>
    Number.isFinite(volumeMl) && Number.isFinite(pressureMmHg));
  if (finite.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.75;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  finite.forEach((point, index) => {
    const px = x(point.volumeMl);
    const py = y(point.pressureMmHg);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();
}

function ScientificPvRelationQualityNoticeV1({
  notices,
}: Readonly<{
  notices: readonly ScientificWorkbenchPvRelationQualityNoticeV1[];
}>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const popoverId = React.useId();
  if (notices.length === 0) return null;
  return (
    <div
      className="pointer-events-auto absolute left-2 top-2 z-20"
      data-testid="scientific-pv-relation-quality-v1"
    >
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded border border-wb-warning/35 bg-wb-warning-soft text-[10px] font-bold leading-none text-wb-warning outline-none transition-colors hover:bg-wb-hover focus-visible:ring-1 focus-visible:ring-wb-warning"
        aria-label={t('workbench.panelGrid.pvRelationLimitedWarning')}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((value) => !value)}
      >
        ⚠
      </button>
      {open && (
        <div
          id={popoverId}
          className="absolute left-0 top-6 w-64 max-w-[calc(100vw-1rem)] rounded-md border border-wb-warning/35 bg-wb-panel px-2 py-1.5 text-[10px] font-medium leading-4 text-wb-text shadow-lg"
          role="note"
        >
          {notices.map((notice) => (
            <p key={notice.key}>
              {t('workbench.panelGrid.pvRelationQualityWarning', {
                relation: notice.relation,
                scenarios: notice.scenarioName,
              })}
            </p>
          ))}
        </div>
      )}
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
  const pick = useStudioBriefingPickV1();
  // Only an interactive Workbench legend is a palette. A Reader or compose
  // preview renders the artifact, so it must not offer to pick from itself.
  const picking = pick !== null && interaction?.interactive === true;
  if (entries.length === 0) return null;
  const showsMultipleModels = new Set(
    entries.map(({ modelName }) => modelName).filter(Boolean),
  ).size > 1;
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
          className="group/pick relative inline-flex min-w-0 items-center gap-1"
          aria-label={`${entry.modelName}, ${entry.signalName}`}
        >
          {picking && entry.signalId !== undefined && (
            <StudioBriefingPickOverlayV1
              kind="signal"
              compact
              pickKey={entry.signalId}
              picked={pick?.isSignalPinned(entry.signalId) ?? false}
              label={entry.signalName}
              onToggle={() => pick?.toggleSignal(
                entry.signalId!,
                entry.signalName,
                "",
              )}
            />
          )}
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color, boxShadow: `0 0 3px ${entry.color}` }}
          />
          <span className="truncate">
            {showsMultipleModels && entry.modelName
              ? `${entry.modelName} · ${entry.signalName}`
              : entry.signalName}
          </span>
          {entry.progress?.status === "running" && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full border border-current border-r-transparent text-wb-accent motion-safe:animate-spin"
              role="status"
              aria-label={`${entry.progress.completed}/${entry.progress.total}`}
              title={`${entry.progress.completed}/${entry.progress.total}`}
            />
          )}
        </span>
      ))}
    </InteractiveGraphLegend>
  );
}

export function drawScientificPvRelationOverlayV1(
  ctx: CanvasRenderingContext2D,
  relation: ScientificWorkbenchPvRelationOverlayV1,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  theme?: CanvasTheme,
): void {
  const generationAge = Math.max(0, relation.generationAge ?? 0);
  const generationAlpha = generationAge === 0
    ? relation.status === "running"
      ? 0.72
      : relation.status === "stale" || relation.status === "error"
        ? 0.42
        : 0.96
    : Math.max(0.08, 0.22 / (generationAge + 1));
  const relationColor = scientificRelationColorV1(relation.color, theme);
  const relationOutline = theme?.backgroundIsDark === false
    ? "#0f172a"
    : "#f8fafc";
  drawScientificPvRelationPathV1(
    ctx,
    relation.espvr,
    x,
    y,
    relationColor,
    relationOutline,
    [7, 4],
    generationAlpha,
  );
  drawScientificPvRelationPathV1(
    ctx,
    relation.edpvr,
    x,
    y,
    relationColor,
    relationOutline,
    [1.5, 3.5],
    generationAlpha * 0.92,
  );
  // V3 higher-loading evidence is deliberately drawn as two observed-only
  // segments. It is not joined to, or fitted with, the validated V2 lane.
  drawScientificPvRelationPathV1(
    ctx,
    relation.higherLoadingEndSystolicObserved ?? [],
    x,
    y,
    relationColor,
    relationOutline,
    [3, 5],
    generationAlpha * 0.72,
  );
  drawScientificPvRelationPathV1(
    ctx,
    relation.higherLoadingEndDiastolicObserved ?? [],
    x,
    y,
    relationColor,
    relationOutline,
    [1, 5],
    generationAlpha * 0.64,
  );
  if (relation.endSystolicSamples) {
    drawScientificPvRelationSamplesV1(
      ctx,
      relation.endSystolicSamples,
      x,
      y,
      relationColor,
      "diamond",
      generationAlpha,
    );
  }
  if (relation.endDiastolicSamples) {
    drawScientificPvRelationSamplesV1(
      ctx,
      relation.endDiastolicSamples,
      x,
      y,
      relationColor,
      "circle",
      generationAlpha,
    );
  }
}

function drawScientificPvRelationPathV1(
  ctx: CanvasRenderingContext2D,
  points: readonly ScientificWorkbenchPvRelationPointV1[],
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  color: string,
  outlineColor: string,
  dash: readonly number[],
  alpha: number,
): void {
  const finite = points.filter(({ volumeMl, pressureMmHg }) =>
    Number.isFinite(volumeMl) && Number.isFinite(pressureMmHg));
  if (finite.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([...dash]);
  ctx.beginPath();
  finite.forEach((point, index) => {
    const px = x(point.volumeMl);
    const py = y(point.pressureMmHg);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = outlineColor;
  ctx.globalAlpha = Math.min(0.62, alpha * 0.64);
  ctx.lineWidth = 5.25;
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

function drawScientificPvRelationSamplesV1(
  ctx: CanvasRenderingContext2D,
  points: readonly ScientificWorkbenchPvRelationPointV1[],
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  color: string,
  shape: "circle" | "diamond",
  alpha: number,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = Math.min(0.88, alpha + 0.12);
  ctx.lineWidth = 1.2;
  for (const point of points) {
    if (!Number.isFinite(point.volumeMl) || !Number.isFinite(point.pressureMmHg)) {
      continue;
    }
    const px = x(point.volumeMl);
    const py = y(point.pressureMmHg);
    ctx.beginPath();
    if (shape === "diamond") {
      ctx.moveTo(px, py - 3);
      ctx.lineTo(px + 3, py);
      ctx.lineTo(px, py + 3);
      ctx.lineTo(px - 3, py);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.arc(px, py, 2.7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
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

/**
 * The previous parameter trace remains a quiet background until the incoming
 * generation has acquired a complete visible window. It is then removed
 * atomically, so an ever-growing history can never leak into the waveform.
 */
export function scientificWaveformRetainsParameterGenerationV1(
  scenario: ScientificWorkbenchChartScenarioV1,
  windowSec: number,
): boolean {
  if (
    scenario.displayedEvidence !== "open-transient-no-periodic-claim"
    || scenario.parameterGenerationHistory.length === 0
    || !(windowSec > 0)
  ) return false;
  const latest = scenario.frames.at(-1)?.acceptedTimeSec;
  const origin = scenario.transientOriginAcceptedTimeSec
    ?? scenario.frames[0]?.acceptedTimeSec;
  return latest !== undefined
    && origin !== undefined
    && Number.isFinite(latest)
    && Number.isFinite(origin)
    && latest - origin < windowSec - 1e-9;
}

function waveformParameterGenerationValuesV1(
  item: ScientificWorkbenchWaveformSeriesV1,
  windowSec: number,
): readonly TimedValue[] {
  if (
    !scientificWaveformRetainsParameterGenerationV1(
      item.scenario,
      windowSec,
    )
  ) return Object.freeze([]);
  const generation = item.scenario.parameterGenerationHistory.find(
    ({ frames }) => frames.length >= 2,
  );
  if (generation === undefined) return Object.freeze([]);
  return transientValues({
    ...item,
    scenario: {
      ...item.scenario,
      frames: generation.frames,
      periodicCycleFrames: null,
      cycleDurationSec: generation.cycleDurationSec,
      transientOriginAcceptedTimeSec:
        generation.transientOriginAcceptedTimeSec
        ?? generation.frames[0]?.acceptedTimeSec
        ?? null,
      displayedEvidence: generation.displayedEvidence,
    },
  }, windowSec);
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
  kind:
    | "periodic"
    | "transient"
    | "retained-source-periodic"
    | "parameter-generation";
}>;

export function scientificPvTrajectoryDomainPointsV1(
  trajectories: readonly ScientificPvTrajectoryV1[],
): readonly PvValue[] {
  return Object.freeze(
    trajectories.flatMap(({ points }) => points).filter(({ volume, pressure }) =>
      Number.isFinite(volume) && Number.isFinite(pressure)),
  );
}

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
  parameterHistoryCount: PvLoopParameterHistoryCount =
    DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT,
): readonly ScientificPvTrajectoryV1[] {
  const horizon = normalizeScientificPvHistoryBeatsV1(historyBeats);
  const scenario = item.scenario;
  const parameterTrajectories =
    scientificPvParameterGenerationTrajectoriesV1(
      item,
      parameterHistoryCount,
    );
  const cycleDurationSec = scenario.cycleDurationSec;
  const origin = scenario.transientOriginAcceptedTimeSec;
  if (
    scenario.displayedEvidence !== "open-transient-no-periodic-claim"
    || cycleDurationSec === null
    || origin === null
    || !(cycleDurationSec > 0)
  ) {
    const points = pvPoints(item);
    const current = points.length === 0
      ? []
      : [Object.freeze({
        age: 0,
        points: Object.freeze(points),
        kind: "periodic" as const,
      })];
    return Object.freeze(
      [...current, ...parameterTrajectories]
        .sort((left, right) => left.age - right.age),
    );
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
  if (latestBeat < 0) return parameterTrajectories;
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
  return Object.freeze(
    [...trajectories, ...parameterTrajectories]
      .sort((left, right) => left.age - right.age),
  );
}

function scientificPvParameterGenerationTrajectoriesV1(
  item: ScientificWorkbenchPvSeriesV1,
  historyCount: PvLoopParameterHistoryCount,
): readonly ScientificPvTrajectoryV1[] {
  const horizon = normalizeScientificPvParameterHistoryCountV1(historyCount);
  if (horizon === 0) return Object.freeze([]);
  const trajectories = item.scenario.parameterGenerationHistory
    .slice(0, horizon)
    .flatMap((generation, index) => {
      const cycleFrames = parameterGenerationCycleFramesV1(
        generation.frames,
        generation.periodicCycleFrames,
        generation.cycleDurationSec ?? item.scenario.cycleDurationSec,
      );
      if (cycleFrames.length < 2) return [];
      const points = pvPoints({
        ...item,
        scenario: {
          ...item.scenario,
          frames: cycleFrames,
          periodicCycleFrames: null,
          cycleDurationSec:
            generation.cycleDurationSec ?? item.scenario.cycleDurationSec,
          transientOriginAcceptedTimeSec:
            generation.transientOriginAcceptedTimeSec,
          displayedEvidence: generation.displayedEvidence,
        },
      });
      return points.length < 2
        ? []
        : [Object.freeze({
          age: index + 1,
          points: Object.freeze(points),
          kind: "parameter-generation" as const,
        })];
    });
  return Object.freeze(trajectories);
}

function parameterGenerationCycleFramesV1(
  frames: readonly MainWireScientificObservableFrameV1[],
  periodicCycleFrames: readonly MainWireScientificObservableFrameV1[] | null,
  cycleDurationSec: number | null,
): readonly MainWireScientificObservableFrameV1[] {
  if (periodicCycleFrames !== null && periodicCycleFrames.length >= 2) {
    return periodicCycleFrames;
  }
  if (
    frames.length < 2
  ) return Object.freeze([]);
  // Before a complete beat exists, `frames` is exactly the PV trace the user
  // was looking at when the parameter changed. Preserve that partial trace
  // immediately instead of waiting for the incoming generation to complete a
  // beat and allowing the plot/domain to collapse in the meantime.
  if (cycleDurationSec === null || !(cycleDurationSec > 0)) {
    return Object.freeze([...frames]);
  }
  const latestTime = frames.at(-1)!.acceptedTimeSec;
  const firstRetained = lowerBoundAcceptedTimeV1(
    frames,
    latestTime - cycleDurationSec,
  );
  const cycle = frames.slice(firstRetained);
  const measuredDuration =
    cycle.at(-1)!.acceptedTimeSec - cycle[0]!.acceptedTimeSec;
  return measuredDuration >= cycleDurationSec * 0.9
    ? Object.freeze(cycle)
    : Object.freeze([]);
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

const PV_PARAMETER_HISTORY_COUNTS_V1 =
  Object.freeze([0, 1, 3, 5, 6] as const);

export function normalizeScientificPvParameterHistoryCountV1(
  value: number,
): PvLoopParameterHistoryCount {
  if (!Number.isFinite(value)) {
    return DEFAULT_PV_LOOP_PARAMETER_HISTORY_COUNT;
  }
  return PV_PARAMETER_HISTORY_COUNTS_V1.reduce((closest, candidate) =>
    Math.abs(candidate - value) < Math.abs(closest - value)
      ? candidate
      : closest);
}

export function scientificPvParameterGenerationAlphaV1(
  age: number,
  historyCount: number,
): number {
  if (age <= 0) return 1;
  const horizon =
    normalizeScientificPvParameterHistoryCountV1(historyCount);
  if (horizon === 0 || age > horizon) return 0;
  return 0.42 * Math.max(0.15, 1 - (age - 1) / horizon);
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

function drawStaticWaveform(
  ctx: CanvasRenderingContext2D,
  values: readonly TimedValue[],
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
): void {
  ctx.beginPath();
  let drawing = false;
  for (const point of values) {
    if (point.breakBefore && drawing) {
      ctx.stroke();
      ctx.beginPath();
      drawing = false;
    }
    if (point.value === null) {
      if (drawing) ctx.stroke();
      ctx.beginPath();
      drawing = false;
      continue;
    }
    const px = x(point.timeSec);
    const py = y(point.value);
    if (!drawing) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
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

export function scientificChartPlotRectV1(
  width: number,
  height: number,
  top: number = PLOT_PADDING.top,
) {
  const responsiveLeft = Math.min(
    PLOT_PADDING.left,
    Math.max(COMPACT_PLOT_LEFT_PX, width * 0.18),
  );
  const bottom = Math.max(PLOT_PADDING.top + 1, height - PLOT_PADDING.bottom);
  const safeTop = Math.min(
    Math.max(PLOT_PADDING.top, top),
    bottom - 1,
  );
  return {
    left: responsiveLeft,
    right: Math.max(responsiveLeft + 1, width - PLOT_PADDING.right),
    top: safeTop,
    bottom,
  };
}

export function scientificChartAxisLabelPositionsV1(
  plot: ReturnType<typeof scientificChartPlotRectV1>,
  height: number,
): Readonly<{
  xTitle: Readonly<{ x: number; y: number }>;
  yTitle: Readonly<{ x: number; y: number }>;
}> {
  return Object.freeze({
    xTitle: Object.freeze({
      x: (plot.left + plot.right) / 2,
      y: height - 3,
    }),
    yTitle: Object.freeze({
      x: Math.max(18, plot.left - Y_AXIS_TITLE_GUTTER_PX),
      y: (plot.top + plot.bottom) / 2,
    }),
  });
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
  plot: ReturnType<typeof scientificChartPlotRectV1>,
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
  plot: ReturnType<typeof scientificChartPlotRectV1>,
  _width: number,
  height: number,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  xLabel: string,
  yLabel: string,
  theme: CanvasTheme,
): void {
  const labelPositions = scientificChartAxisLabelPositionsV1(plot, height);
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
  if (xLabel) {
    ctx.fillText(xLabel, labelPositions.xTitle.x, labelPositions.xTitle.y);
  }
  if (yLabel) {
    ctx.save();
    ctx.translate(labelPositions.yTitle.x, labelPositions.yTitle.y);
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

function usePrefersReducedMotionV1(): boolean {
  const [reduced, setReduced] = React.useState(() =>
    typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    onChange();
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
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

type CanvasTheme = Readonly<{
  grid: string;
  tick: string;
  label: string;
  backgroundIsDark: boolean;
}>;

function canvasTheme(container: HTMLElement | null): CanvasTheme {
  if (!container || typeof getComputedStyle === "undefined") {
    return {
      grid: "#334155",
      tick: "#64748b",
      label: "#94a3b8",
      backgroundIsDark: true,
    };
  }
  const style = getComputedStyle(container);
  const css = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const background = d3.rgb(css("--wb-app-bg", "#020617"));
  const relativeLuminance = [background.r, background.g, background.b]
    .every(Number.isFinite)
      ? (
          0.2126 * background.r
          + 0.7152 * background.g
          + 0.0722 * background.b
        ) / 255
      : 0;
  return {
    grid: css("--wb-border", "#334155"),
    tick: css("--wb-text-subtle", "#64748b"),
    label: css("--wb-text-muted", "#94a3b8"),
    backgroundIsDark: relativeLuminance < 0.5,
  };
}

function scientificRelationColorV1(
  color: string,
  theme: CanvasTheme | undefined,
): string {
  const hsl = d3.hsl(color);
  if (!Number.isFinite(hsl.h)) return color;
  hsl.s = Math.max(0.62, Number.isFinite(hsl.s) ? hsl.s : 0.62);
  hsl.l = theme?.backgroundIsDark === false
    ? Math.min(0.38, Number.isFinite(hsl.l) ? hsl.l : 0.38)
    : Math.max(0.62, Number.isFinite(hsl.l) ? hsl.l : 0.62);
  return hsl.formatHex();
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
