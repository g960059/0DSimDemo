import React from "react";
import { useAppTheme } from "@/appTheme";
import { useTranslation } from "react-i18next";
import { WorkbenchAnalysisErrorPopoverV3 } from "./WorkbenchAnalysisErrorPopoverV3";
import { workbenchLoadRelationDescriptionV1 } from "./WorkbenchLoadRelationDescriptionV1";

import type {
  PressureVolumePressureBasisV2,
} from "@/studio/contracts/v2/model";
import type {
  MainWireIntegratedModelPeriodicPvaCurvePointV1,
  MainWireIntegratedModelPeriodicPvaEdpvrV1,
  MainWireIntegratedModelPeriodicPvaEspvrV1,
  MainWirePeriodicPvaV1,
  MainWireSystolicPressureEnvelopeV1,
  MainWireDiastolicLoadRelationV1,
  MainWirePvaAreaDisplayV1,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";

import {
  finiteWorkbenchScalarValueV3,
  orderedFiniteWorkbenchSamplesV3,
  type WorkbenchScalarSampleV3,
} from "./WorkbenchScalarSampleV3";
import {
  positiveModuloV3,
} from "./SweepingWaveformCanvasV3";
import {
  mixOpaqueWorkbenchCanvasColorV3,
  scaleLinearV3,
  readWorkbenchCanvasThemeVariablesV3,
  useResponsiveCanvasFrameV3,
} from "./WorkbenchCanvasRuntimeV3";
import {
  WorkbenchChartLegendV3,
  buildWorkbenchTraceLegendModelV3,
  drawWorkbenchMeasuredPointV3,
  workbenchHistoryAlphaV3,
  workbenchLegendSelectionMatchesTraceV3,
  workbenchLegendTraceAlphaV3,
  workbenchLegendTraceHiddenV3,
  workbenchTraceLegendKeyV3,
  type WorkbenchChartLegendSelectionV3,
  type WorkbenchScenarioTraceIdentityV3,
} from "./WorkbenchChartTraceStyleV3";
import {
  nextStableNumericDomainStateV3,
  numericTicksV3,
  type WorkbenchNumericDomainV3,
  type WorkbenchStableNumericDomainStateV3,
} from "./WorkbenchStableChartDomainV3";

export type WorkbenchPvPressureBasisV3 = PressureVolumePressureBasisV2;

export type WorkbenchPressureVolumeTraceV3 =
  WorkbenchScenarioTraceIdentityV3 & Readonly<{
    samples: readonly WorkbenchScalarSampleV3[];
    historySampleSets?: readonly (readonly WorkbenchScalarSampleV3[])[];
    volumeOutputId: string;
    pressureOutputId: string;
    pressureBasis: WorkbenchPvPressureBasisV3;
    cyclePhaseOutputId: string;
    chamberId: string;
    chamberLabel: string;
    /** Final resolved trace color from the automatic comparison strategy. */
    chamberColor: string;
    periodicPva?: MainWirePeriodicPvaV1;
    /** Prior input epochs, oldest first; never interpreted as current results. */
    periodicPvaHistory?: readonly Readonly<{ inputEpoch: number; value: MainWirePeriodicPvaV1 }>[];
    periodicPvaAnalysisError?: string;
    periodicPvaAnalysisPending?: boolean;
  }>;

export type WorkbenchPvPointV3 = Readonly<{
  acceptedTimeSec: number;
  cyclePhase01: number;
  volumeMl: number;
  pressureMmHg: number;
}>;

export type WorkbenchLivePvTrajectoryV3 = Readonly<{
  /** Most recent full model-emitted cycle, retained as spatial context. */
  completedBeat: readonly WorkbenchPvPointV3[];
  /** Current model-emitted cycle, including its moving leading point. */
  liveSegment: readonly WorkbenchPvPointV3[];
}>;

/**
 * Keeps an incomplete first orbit out of both the plot and its auto-domain.
 * Once one complete model-emitted cycle exists, the normal phase-aware live
 * replacement resumes and retains that completed beat as its back buffer.
 */
export function revealPvTrajectoryAfterFirstCompleteCycleV3(
  trajectory: WorkbenchLivePvTrajectoryV3,
): WorkbenchLivePvTrajectoryV3 {
  return trajectory.completedBeat.length === 0
    ? Object.freeze({
        completedBeat: Object.freeze([]),
        liveSegment: Object.freeze([]),
      })
    : trajectory;
}

export type WorkbenchPvRelationPointV3 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

export type WorkbenchHistoricalPvProjectionV3 = Readonly<{
  completedBeat: readonly WorkbenchPvPointV3[];
}>;

export type CompleteCycleRangeV3 = Readonly<{
  startIndex: number;
  endIndexInclusive: number;
}>;

const CYCLE_PHASE_EPSILON_V3 = 1e-6;
const CYCLE_START_TOLERANCE_V3 = 0.03;
const MINIMUM_COMPLETE_CYCLE_PHASE_SPAN_V3 = 0.8;
const HISTORICAL_PV_PROJECTION_CACHE_V3 = new WeakMap<
  readonly WorkbenchScalarSampleV3[],
  Map<string, WorkbenchHistoricalPvProjectionV3>
>();

/**
 * Locates the newest complete model-emitted cycle. The true next-cycle
 * boundary sample is included; renderers must not add a synthetic closing
 * segment when a transient beat's two boundary states differ.
 */
export function lastCompleteCycleRangeV3(
  samples: readonly WorkbenchScalarSampleV3[],
  cyclePhaseOutputId: string,
): CompleteCycleRangeV3 | null {
  if (samples.length < 3) return null;
  const firstPhase = normalizedModelCyclePhaseV3(
    samples[0] === undefined
      ? null
      : finiteWorkbenchScalarValueV3(samples[0], cyclePhaseOutputId),
  );
  let previousBoundary: number | null = null;
  let latestBoundary: number | null = firstPhase !== null
      && firstPhase <= CYCLE_START_TOLERANCE_V3
    ? 0
    : null;

  let previousPhase = firstPhase;
  for (let index = 1; index < samples.length; index += 1) {
    const phase = normalizedModelCyclePhaseV3(
      finiteWorkbenchScalarValueV3(samples[index]!, cyclePhaseOutputId),
    );
    if (phase === null) {
      previousBoundary = null;
      latestBoundary = null;
      previousPhase = null;
      continue;
    }
    if (previousPhase === null && phase <= CYCLE_START_TOLERANCE_V3) {
      previousBoundary = latestBoundary;
      latestBoundary = index;
    }
    if (
      previousPhase !== null
      && phase + CYCLE_PHASE_EPSILON_V3 < previousPhase
    ) {
      previousBoundary = latestBoundary;
      latestBoundary = index;
    }
    previousPhase = phase;
  }
  if (previousBoundary === null || latestBoundary === null) return null;
  const startIndex = previousBoundary;
  const endIndexInclusive = latestBoundary;
  if (endIndexInclusive - startIndex < 3) return null;
  let phaseCount = 0;
  let minimumPhase = Number.POSITIVE_INFINITY;
  let maximumPhase = Number.NEGATIVE_INFINITY;
  for (let index = startIndex; index < endIndexInclusive; index += 1) {
    const phase = normalizedModelCyclePhaseV3(
      finiteWorkbenchScalarValueV3(samples[index]!, cyclePhaseOutputId),
    );
    if (phase === null) continue;
    phaseCount += 1;
    minimumPhase = Math.min(minimumPhase, phase);
    maximumPhase = Math.max(maximumPhase, phase);
  }
  if (
    phaseCount < 3
    || maximumPhase - minimumPhase
      < MINIMUM_COMPLETE_CYCLE_PHASE_SPAN_V3
  ) return null;
  return Object.freeze({ startIndex, endIndexInclusive });
}

export function extractLastCompletePvBeatV3(
  samples: readonly WorkbenchScalarSampleV3[],
  volumeOutputId: string,
  pressureOutputId: string,
  cyclePhaseOutputId: string,
): readonly WorkbenchPvPointV3[] {
  return extractLivePvTrajectoryV3(
    samples,
    volumeOutputId,
    pressureOutputId,
    cyclePhaseOutputId,
  ).completedBeat;
}

/**
 * Projects an immutable, completed input epoch once. Current-epoch samples are
 * intentionally excluded because their live segment changes on every Worker
 * delivery.
 */
export function projectHistoricalPvEpochV3(
  samples: readonly WorkbenchScalarSampleV3[],
  volumeOutputId: string,
  pressureOutputId: string,
  cyclePhaseOutputId: string,
): WorkbenchHistoricalPvProjectionV3 {
  const cacheKey = JSON.stringify([
    volumeOutputId,
    pressureOutputId,
    cyclePhaseOutputId,
  ]);
  if (Object.isFrozen(samples)) {
    const cached = HISTORICAL_PV_PROJECTION_CACHE_V3
      .get(samples)
      ?.get(cacheKey);
    if (cached !== undefined) return cached;
  }
  const completedBeat = extractLastCompletePvBeatV3(
    samples,
    volumeOutputId,
    pressureOutputId,
    cyclePhaseOutputId,
  );
  const projection = Object.freeze({ completedBeat });
  if (Object.isFrozen(samples)) {
    let cache = HISTORICAL_PV_PROJECTION_CACHE_V3.get(samples);
    if (cache === undefined) {
      cache = new Map();
      HISTORICAL_PV_PROJECTION_CACHE_V3.set(samples, cache);
    }
    cache.set(cacheKey, projection);
  }
  return projection;
}

export function extractLivePvTrajectoryV3(
  samples: readonly WorkbenchScalarSampleV3[],
  volumeOutputId: string,
  pressureOutputId: string,
  cyclePhaseOutputId: string,
): WorkbenchLivePvTrajectoryV3 {
  const ordered = orderedFiniteWorkbenchSamplesV3(samples);
  const range = lastCompleteCycleRangeV3(ordered, cyclePhaseOutputId);
  const completedCandidate = range === null
    ? Object.freeze([])
    : extractPvPointsV3(
        ordered,
        range.startIndex,
        range.endIndexInclusive,
        volumeOutputId,
        pressureOutputId,
        cyclePhaseOutputId,
      );
  const completedBeat = completedCandidate.length >= 3
    ? completedCandidate
    : Object.freeze([]);
  const liveStartIndex = range?.endIndexInclusive
    ?? latestPvCycleStartIndexV3(ordered, cyclePhaseOutputId);
  const liveSegment = liveStartIndex === null
    ? Object.freeze([])
    : extractPvPointsV3(
        ordered,
        liveStartIndex,
        ordered.length - 1,
        volumeOutputId,
        pressureOutputId,
        cyclePhaseOutputId,
      );
  return Object.freeze({ completedBeat, liveSegment });
}

/**
 * Uses the previous completed orbit as a phase-aware back buffer. The live
 * prefix replaces only the phase it has already traversed, leaving one
 * continuous, full-opacity loop without an arbitrary alpha seam at its head.
 */
export function buildPvBackBufferRemainderV3(
  completedBeat: readonly WorkbenchPvPointV3[],
  liveSegment: readonly WorkbenchPvPointV3[],
): readonly WorkbenchPvPointV3[] {
  if (completedBeat.length === 0) return Object.freeze([]);
  if (liveSegment.length === 0) return completedBeat;
  const liveStart = liveSegment[0]!;
  const liveHead = liveSegment.at(-1)!;
  const headProgress = positiveModuloV3(
    liveHead.cyclePhase01 - liveStart.cyclePhase01,
    1,
  );
  if (headProgress <= CYCLE_PHASE_EPSILON_V3) return completedBeat;

  const progress = unwrappedPvCycleProgressV3(completedBeat);
  const lastProgress = progress.at(-1) ?? 0;
  if (headProgress >= lastProgress - CYCLE_PHASE_EPSILON_V3) {
    return Object.freeze([]);
  }
  let nextIndex = progress.findIndex((value) =>
    value + CYCLE_PHASE_EPSILON_V3 >= headProgress);
  if (nextIndex < 0) return Object.freeze([]);
  if (
    Math.abs(progress[nextIndex]! - headProgress) <= CYCLE_PHASE_EPSILON_V3
  ) {
    return Object.freeze(completedBeat.slice(nextIndex));
  }
  const previousIndex = Math.max(0, nextIndex - 1);
  const previousProgress = progress[previousIndex]!;
  const nextProgress = progress[nextIndex]!;
  const span = Math.max(CYCLE_PHASE_EPSILON_V3, nextProgress - previousProgress);
  const ratio = clampV3((headProgress - previousProgress) / span, 0, 1);
  const previousPoint = completedBeat[previousIndex]!;
  const nextPoint = completedBeat[nextIndex]!;
  const interpolated = Object.freeze({
    acceptedTimeSec: previousPoint.acceptedTimeSec
      + ratio * (nextPoint.acceptedTimeSec - previousPoint.acceptedTimeSec),
    cyclePhase01: liveHead.cyclePhase01,
    volumeMl: previousPoint.volumeMl
      + ratio * (nextPoint.volumeMl - previousPoint.volumeMl),
    pressureMmHg: previousPoint.pressureMmHg
      + ratio * (nextPoint.pressureMmHg - previousPoint.pressureMmHg),
  });
  return Object.freeze([interpolated, ...completedBeat.slice(nextIndex)]);
}

function unwrappedPvCycleProgressV3(
  points: readonly WorkbenchPvPointV3[],
): readonly number[] {
  if (points.length === 0) return Object.freeze([]);
  const firstPhase = points[0]!.cyclePhase01;
  let previousPhase = firstPhase;
  let wraps = 0;
  return Object.freeze(points.map((point, index) => {
    if (
      index > 0
      && point.cyclePhase01 + CYCLE_PHASE_EPSILON_V3 < previousPhase
    ) {
      wraps += 1;
    }
    previousPhase = point.cyclePhase01;
    return point.cyclePhase01 - firstPhase + wraps;
  }));
}

function latestPvCycleStartIndexV3(
  samples: readonly WorkbenchScalarSampleV3[],
  cyclePhaseOutputId: string,
): number | null {
  let startIndex: number | null = null;
  let previousPhase: number | null = null;
  for (let index = 0; index < samples.length; index += 1) {
    const phase = normalizedModelCyclePhaseV3(
      finiteWorkbenchScalarValueV3(samples[index]!, cyclePhaseOutputId),
    );
    if (phase === null) {
      startIndex = null;
      previousPhase = null;
      continue;
    }
    if (
      previousPhase === null
      || phase + CYCLE_PHASE_EPSILON_V3 < previousPhase
    ) {
      startIndex = index;
    }
    previousPhase = phase;
  }
  return startIndex;
}

function extractPvPointsV3(
  samples: readonly WorkbenchScalarSampleV3[],
  startIndex: number,
  endIndexInclusive: number,
  volumeOutputId: string,
  pressureOutputId: string,
  cyclePhaseOutputId: string,
): readonly WorkbenchPvPointV3[] {
  const points: WorkbenchPvPointV3[] = [];
  for (
    let index = startIndex;
    index <= endIndexInclusive;
    index += 1
  ) {
    const sample = samples[index]!;
    const cyclePhase01 = normalizedModelCyclePhaseV3(
      finiteWorkbenchScalarValueV3(sample, cyclePhaseOutputId),
    );
    const volumeMl = finiteWorkbenchScalarValueV3(sample, volumeOutputId);
    const pressureMmHg = finiteWorkbenchScalarValueV3(
      sample,
      pressureOutputId,
    );
    if (
      cyclePhase01 === null
      || volumeMl === null
      || pressureMmHg === null
    ) continue;
    points.push(Object.freeze({
      acceptedTimeSec: sample.acceptedTimeSec,
      cyclePhase01,
      volumeMl,
      pressureMmHg,
    }));
  }
  return Object.freeze(points);
}

type PressureVolumeLoopCanvasCommonPropsV3 = Readonly<{
  className?: string;
  periodicPvaSupported?: boolean;
  showPressureEnvelope?: boolean;
  showPvaBoundary?: boolean;
  onRetryAnalysis?: () => boolean;
}>;

export type PressureVolumeLoopCanvasPropsV3 =
  PressureVolumeLoopCanvasCommonPropsV3 & (
    | Readonly<{
        traces: readonly WorkbenchPressureVolumeTraceV3[];
        samples?: never;
        volumeOutputId?: never;
        pressureOutputId?: never;
        pressureBasis?: never;
        cyclePhaseOutputId?: never;
        chamberLabel?: never;
        color?: never;
      }>
    | Readonly<{
        /** @deprecated Prefer one descriptor per Scenario/chamber in traces. */
        samples: readonly WorkbenchScalarSampleV3[];
        volumeOutputId: string;
        pressureOutputId: string;
        pressureBasis: WorkbenchPvPressureBasisV3;
        cyclePhaseOutputId: string;
        chamberLabel?: string;
        color?: string;
        traces?: undefined;
      }>
  );

export function PressureVolumeLoopCanvasV3(
  props: PressureVolumeLoopCanvasPropsV3,
) {
  const { className } = props;
  const { appTheme } = useAppTheme();
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const periodicPvaSupported = props.periodicPvaSupported ?? true;
  const showPressureEnvelope =
    periodicPvaSupported && (props.showPressureEnvelope ?? false);
  const showPvaBoundary = periodicPvaSupported && (props.showPvaBoundary ?? false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const volumeDomainStateRef = React.useRef<
    WorkbenchStableNumericDomainStateV3 | null
  >(null);
  const pressureDomainStateRef = React.useRef<
    WorkbenchStableNumericDomainStateV3 | null
  >(null);
  const [hoveredLegendSelection, setHoveredLegendSelection] =
    React.useState<WorkbenchChartLegendSelectionV3 | null>(null);
  const [hiddenLegendSelections, setHiddenLegendSelections] =
    React.useState<readonly WorkbenchChartLegendSelectionV3[]>([]);
  const resolvedTraces = React.useMemo<readonly WorkbenchPressureVolumeTraceV3[]>(
    () => {
      if (props.traces !== undefined) return props.traces;
      const chamberLabel = props.chamberLabel ?? "LV";
      return Object.freeze([Object.freeze({
        scenarioId: "current-scenario",
        scenarioLabel: "Current",
        scenarioStyleIndex: 0,
        samples: props.samples,
        volumeOutputId: props.volumeOutputId,
        pressureOutputId: props.pressureOutputId,
        pressureBasis: props.pressureBasis,
        cyclePhaseOutputId: props.cyclePhaseOutputId,
        chamberId: chamberLabel.toLowerCase(),
        chamberLabel,
        chamberColor: props.color ?? "#a78bfa",
      })]);
    }, [
      props.chamberLabel,
      props.color,
      props.cyclePhaseOutputId,
      props.pressureBasis,
      props.pressureOutputId,
      props.samples,
      props.traces,
      props.volumeOutputId,
    ],
  );
  const traces = useStableWorkbenchPressureVolumeTracesV3(resolvedTraces);
  const legendModel = React.useMemo(
    () => buildWorkbenchTraceLegendModelV3(traces.map((trace) => ({
      traceKey: workbenchTraceLegendKeyV3(trace.scenarioId, trace.chamberId),
      scenarioId: trace.scenarioId,
      scenarioLabel: trace.scenarioLabel,
      itemId: trace.chamberId,
      itemLabel: trace.chamberLabel,
      ...(periodicPvaSupported && (trace.periodicPva !== undefined || trace.periodicPvaHistory?.length) ? { itemDescription:
        workbenchLoadRelationDescriptionV1(showPvaBoundary ? "pva"
          : (trace.periodicPva ?? trace.periodicPvaHistory?.at(-1)?.value)?.loadRelations !== undefined ? "pv" : "pv-isochrone", language)
          + workbenchPvHistoryDescriptionV3(trace, language?.startsWith("ja") === true) } : {}),
      color: trace.chamberColor,
    }))),
    [traces, periodicPvaSupported, showPvaBoundary, language],
  );
  const renderedTraces = React.useMemo(() => traces.map((trace) => {
    const historyEpochs = workbenchPvHistoryEpochsV3(trace);
    const trajectory = revealPvTrajectoryAfterFirstCompleteCycleV3(
      extractLivePvTrajectoryV3(
        trace.samples,
        trace.volumeOutputId,
        trace.pressureOutputId,
        trace.cyclePhaseOutputId,
      ),
    );
    const history = Object.freeze((trace.historySampleSets ?? []).map(
      (samples) => {
        const projection = projectHistoricalPvEpochV3(
          samples,
          trace.volumeOutputId,
          trace.pressureOutputId,
          trace.cyclePhaseOutputId,
        );
        return Object.freeze({
          ...projection,
          alpha: workbenchHistoryAlphaV3(historyEpochs.indexOf(samples[0]?.inputEpoch ?? -1), historyEpochs.length),
        });
      },
    ));
    return Object.freeze({
      trace,
      ...trajectory,
      backBufferRemainder: buildPvBackBufferRemainderV3(
        trajectory.completedBeat,
        trajectory.liveSegment,
      ),
      periodicPva: trace.periodicPva ?? null,
      periodicPvaDrawing: periodicPvaDrawingV1(trace.periodicPva, showPvaBoundary),
      periodicPvaHistoryDrawings: (trace.periodicPvaHistory ?? []).flatMap(({ value, inputEpoch }) => {
        const drawing = periodicPvaDrawingV1(value, showPvaBoundary);
        return drawing === null ? [] : [{
          drawing: { ...drawing, retainedFromPriorUpdate: true },
          alpha: Math.min(0.48, workbenchHistoryAlphaV3(historyEpochs.indexOf(inputEpoch), historyEpochs.length) * 2.2),
        }];
      }),
      history,
    });
  }), [showPvaBoundary, traces]);
  const visibleRenderedTraces = React.useMemo(
    () => renderedTraces.filter(({ trace }) =>
      !workbenchLegendTraceHiddenV3(
        hiddenLegendSelections,
        pvLegendDescriptorV3(trace),
      )),
    [hiddenLegendSelections, renderedTraces],
  );
  // A hidden or removed trace must not dim every remaining visible scenario.
  const legendSelection = visibleRenderedTraces.some(({ trace }) =>
    workbenchLegendSelectionMatchesTraceV3(hoveredLegendSelection, pvLegendDescriptorV3(trace)))
    ? hoveredLegendSelection : null;
  const domainIdentity = traces.map((trace) => [
    trace.scenarioId,
    trace.chamberId,
    trace.volumeOutputId,
    trace.pressureOutputId,
    trace.pressureBasis,
  ].join(":"))
    .join("\u001f");

  React.useEffect(() => {
    volumeDomainStateRef.current = null;
    pressureDomainStateRef.current = null;
    setHoveredLegendSelection(null);
    setHiddenLegendSelections([]);
  }, [domainIdentity]);

  const domainCommitKey = React.useMemo(
    () => pvStableDomainCommitKeyV3(visibleRenderedTraces),
    [visibleRenderedTraces],
  );
  const pressureAxisTitle = React.useMemo(
    () => pvPressureAxisTitleV3(traces),
    [traces],
  );

  const draw = React.useCallback((
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const theme = readPvCanvasThemeV3(containerRef.current);
    context.font = theme.font;
    const pressureAxisLines = wrapPvAxisTitleV3(context, pressureAxisTitle, Math.max(40, height - 56));
    const plot = pvPlotRectV3(width, height, pressureAxisLines.length);
    const domainPoints = workbenchPvLoopDomainPointsV3(visibleRenderedTraces);
    volumeDomainStateRef.current = nextZeroBasedPvDomainV3(
      volumeDomainStateRef.current,
      domainPoints.map(({ volumeMl }) => volumeMl),
      {
        upperPaddingFraction: 0.08,
        minimumUpperPadding: 4,
        commitKey: domainCommitKey,
      },
    );
    pressureDomainStateRef.current = nextZeroBasedPvDomainV3(
      pressureDomainStateRef.current,
      domainPoints.map(({ pressureMmHg }) => pressureMmHg),
      {
        upperPaddingFraction: 0.12,
        minimumUpperPadding: 5,
        commitKey: domainCommitKey,
      },
    );
    const volumeDomain = volumeDomainStateRef.current.domain;
    const pressureDomain = pressureDomainStateRef.current.domain;
    if (canvasRef.current !== null) {
      canvasRef.current.dataset.volumeMaximumMl = String(volumeDomain[1]);
      canvasRef.current.dataset.pressureMaximumMmhg = String(pressureDomain[1]);
    }
    drawPvAxesV3(
      context,
      plot,
      volumeDomain,
      pressureDomain,
      pressureAxisLines,
      theme,
      domainPoints.length > 0,
    );
    const x = (value: number) => scaleLinearV3(
      value,
      volumeDomain[0],
      volumeDomain[1],
      plot.left,
      plot.right,
    );
    const y = (value: number) => scaleLinearV3(
      value,
      pressureDomain[0],
      pressureDomain[1],
      plot.bottom,
      plot.top,
    );

    context.save();
    context.beginPath();
    context.rect(
      plot.left,
      plot.top,
      plot.right - plot.left,
      plot.bottom - plot.top,
    );
    context.clip();
    for (const { history, trace } of visibleRenderedTraces) {
      const traceAlpha = workbenchLegendTraceAlphaV3(
        legendSelection,
        pvLegendDescriptorV3(trace),
      );
      for (const historical of history) {
        drawPvCurveV3(context, historical.completedBeat, x, y, {
          color: trace.chamberColor,
          width: 1.35,
          dash: Object.freeze([]),
          alpha: historical.alpha * traceAlpha,
        });
      }
    }
    // Focused scenarios are drawn last; coincident auxiliaries remain readable.
    const drawingOrder = [...visibleRenderedTraces].sort((a, b) =>
      workbenchLegendTraceAlphaV3(legendSelection, pvLegendDescriptorV3(a.trace))
      - workbenchLegendTraceAlphaV3(legendSelection, pvLegendDescriptorV3(b.trace)));
    // All auxiliary lines go behind all live loops, not over the previous scenario.
    for (const { periodicPvaHistoryDrawings, trace } of drawingOrder) {
      if (!periodicPvaSupported) continue;
      for (const { drawing, alpha } of periodicPvaHistoryDrawings) drawPeriodicPvaV1(
        context, drawing, x, y, trace.chamberColor,
        alpha * workbenchLegendTraceAlphaV3(legendSelection, pvLegendDescriptorV3(trace)),
        showPressureEnvelope, theme.canvas,
      );
    }
    for (const { periodicPvaDrawing, trace } of drawingOrder) {
      if (periodicPvaSupported && periodicPvaDrawing !== null) drawPeriodicPvaV1(
        context, periodicPvaDrawing, x, y, trace.chamberColor,
        0.92 * workbenchLegendTraceAlphaV3(legendSelection, pvLegendDescriptorV3(trace)),
        showPressureEnvelope,
        theme.canvas,
      );
    }
    for (const {
      backBufferRemainder,
      liveSegment,
      trace,
    } of drawingOrder) {
      const traceAlpha = workbenchLegendTraceAlphaV3(
        legendSelection,
        pvLegendDescriptorV3(trace),
      );
      drawPvCurveV3(context, backBufferRemainder, x, y, {
        color: trace.chamberColor,
        width: 1.5,
        dash: Object.freeze([]),
        alpha: traceAlpha,
      });
      drawPvCurveV3(context, liveSegment, x, y, {
        color: trace.chamberColor,
        width: 2,
        dash: Object.freeze([]),
        alpha: traceAlpha,
      });
      const head = liveSegment.at(-1);
      if (head !== undefined) {
        drawPvLeadingCapV3(
          context,
          x(head.volumeMl),
          y(head.pressureMmHg),
          trace.chamberColor,
          theme.canvas,
          traceAlpha,
        );
      }
    }
    context.restore();

    if (visibleRenderedTraces.every(({ completedBeat, liveSegment, history, periodicPvaDrawing, periodicPvaHistoryDrawings }) =>
      completedBeat.length === 0 && liveSegment.length === 0
      && history.every(previous => previous.completedBeat.length === 0)
      && periodicPvaDrawing === null && periodicPvaHistoryDrawings.length === 0)) {
      context.save();
      context.fillStyle = theme.text;
      context.font = theme.messageFont;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        t("workbench.waitingForCycle"),
        (plot.left + plot.right) / 2,
        (plot.top + plot.bottom) / 2,
        Math.max(1, plot.right - plot.left - 12),
      );
      context.restore();
    }
  }, [
    appTheme,
    t,
    domainCommitKey,
    legendSelection,
    periodicPvaSupported,
    pressureAxisTitle,
    showPressureEnvelope,
    visibleRenderedTraces,
  ]);

  useResponsiveCanvasFrameV3(
    containerRef,
    canvasRef,
    draw,
    "pressure-volume-loop",
  );

  const availablePva = periodicPvaSupported ? visibleRenderedTraces.flatMap(
    ({ periodicPva, trace }) => periodicPva?.status === "available"
      ? [Object.freeze({ periodicPva, trace })]
      : [],
  ) : [];
  const drawablePva = periodicPvaSupported ? visibleRenderedTraces.flatMap(({
    periodicPvaDrawing,
    periodicPvaHistoryDrawings,
    trace,
  }) => [
    ...(periodicPvaDrawing === null ? [] : [{ periodicPvaDrawing, trace }]),
    ...periodicPvaHistoryDrawings.map(({ drawing }) => ({ periodicPvaDrawing: drawing, trace })),
  ]) : [];
  const retainedPvaDrawingCount = drawablePva.filter(
    ({ periodicPvaDrawing }) =>
      periodicPvaDrawing.retainedFromPriorUpdate,
  ).length;
  const loadResponseDisplay = !showPvaBoundary && drawablePva.some(
    ({ periodicPvaDrawing }) => periodicPvaDrawing.loadRelation !== null || periodicPvaDrawing.diastolicRelation !== null);
  const envelopeVisible = drawablePva.some(({ periodicPvaDrawing }) =>
    periodicPvaDrawing.loadRelation !== null
      || (showPressureEnvelope && periodicPvaDrawing.pressureEnvelope !== null));
  const relationStatusBase = !periodicPvaSupported
    ? null
    : drawablePva.length > 0
      ? `${loadResponseDisplay
        ? "ESPVR: pressure envelope of the settled TBV family, not maximum elastance. EDPVR: measured maximum-volume points connected in TBV order, not a passive constitutive law. No display extrapolation."
        : "PVA boundary: a common-time curve selected for this operating state. Changing TBV alone can shift it without changing contractility."}${drawablePva.some(({ periodicPvaDrawing }) => periodicPvaDrawing.areaDisplay !== null) ? " SW (solid fill) and PE (hatched) are separate illustrations, not a single area union or measurements of stored elastic energy." : ""}${showPressureEnvelope && !loadResponseDisplay && envelopeVisible ? " Pressure envelope overlaid for comparison; not used for PVA." : ""}`
      : "Settled-source preload-reduction analysis selected · relation not yet available";
  const relationStatus = relationStatusBase !== null && retainedPvaDrawingCount > 0
    ? `${relationStatusBase} · faded relations are previous input conditions, not current measurements`
    : relationStatusBase;
  const chamberAriaLabel = legendModel.items.length === 0
    ? "Pressure-volume"
    : legendModel.items.map(({ label }) => label).join(", ");
  const pvaAnalysisPending = periodicPvaSupported && traces.some(
    ({ periodicPvaAnalysisPending }) => periodicPvaAnalysisPending === true,
  );
  const collectingPvaCandidate = visibleRenderedTraces
    .map(({ periodicPva }) => periodicPva)
    .find((periodicPva) => periodicPva?.status === "collecting");
  const collectingPva =
    collectingPvaCandidate?.status === "collecting"
      ? collectingPvaCandidate
      : undefined;
  const pvaProgress = collectingPva?.progress;
  const familyProgress = availablePva[0]?.periodicPva.source.familyProgress;
  const pvaAnalysisError = periodicPvaSupported
    ? visibleRenderedTraces
        .map(({ trace, periodicPva }) => trace.periodicPvaAnalysisError
          ?? (showPvaBoundary && periodicPva?.status === "unavailable"
            ? `${trace.scenarioLabel} · ${trace.chamberLabel}: ${periodicPva.reason}` : undefined))
        .find((message): message is string =>
          typeof message === "string" && message.length > 0)
    : undefined;

  return (
    <div
      className={`flex min-h-52 h-full w-full flex-col overflow-hidden ${className ?? ""}`}
      data-chart-kind="pressure-volume-loop-v3"
      data-pv-analysis-mode={
        periodicPvaSupported ? "formal-periodic" : "raw-exact-orbit"
      }
      data-cycle-source="model-emitted-cycle-phase"
      data-pv-relation-model={
        periodicPvaSupported
          ? loadResponseDisplay ? "settled-full-load-phasewise-pressure-envelope" : "all-settled-shape-preserving-locus"
          : undefined
      }
      data-pv-pressure-envelope-visible={
        envelopeVisible ? "true" : "false"
      }
      data-pv-pva-boundary-visible={showPvaBoundary ? "true" : "false"}
      data-pv-relation-semantics={
        periodicPvaSupported
          ? loadResponseDisplay
            ? "full-load-pressure-envelope-measured-diastolic-locus"
            : "area-max-common-isochrone-espvr-exponential-edpvr"
          : undefined
      }
      data-pv-loop-trace-count={visibleRenderedTraces.length}
      data-volume-minimum-ml="0"
      data-pressure-minimum-mmhg="0"
      data-pv-history-loop-count={visibleRenderedTraces.reduce((sum, { history }) => sum + history.filter(({ completedBeat }) => completedBeat.length > 0).length, 0)}
      data-pv-ready-trace-count={visibleRenderedTraces.filter(
        ({ completedBeat }) => completedBeat.length > 0,
      ).length}
      data-pva-analysis-pending={pvaAnalysisPending ? "true" : "false"}
      data-pva-result-count={availablePva.length}
      data-pva-drawing-count={drawablePva.length}
      data-pva-retained-drawing-count={retainedPvaDrawingCount}
      data-pva-history-input-epochs={visibleRenderedTraces.flatMap(({ trace }) => (trace.periodicPvaHistory ?? []).map(previous => previous.inputEpoch)).join(",")}
      data-pva-measured-high-load-point-count={drawablePva.reduce((sum, { periodicPvaDrawing }) =>
        sum + Math.max(0, (periodicPvaDrawing.espvr === null ? 0 : workbenchPvMeasuredHighLoadPointsV1(periodicPvaDrawing.espvr).length) - 1), 0)}
      data-pv-envelope-source-point-count={drawablePva.reduce((sum, { periodicPvaDrawing }) =>
        sum + (periodicPvaDrawing.loadRelation?.sourcePointCount ?? 0), 0)}
      data-pv-diastolic-source-point-count={drawablePva.reduce((sum, { periodicPvaDrawing }) =>
        sum + (periodicPvaDrawing.diastolicRelation?.sourcePointCount ?? 0), 0)}
      data-pv-display-extrapolation={showPvaBoundary ? "energy-construction-only" : "none"}
      data-pv-energy-area-count={drawablePva.filter(({ periodicPvaDrawing }) => periodicPvaDrawing.areaDisplay !== null && !periodicPvaDrawing.retainedFromPriorUpdate).length}
      data-pva-selected-times-sec={availablePva.map(({ periodicPva }) =>
        periodicPva.espvr.selectedTimeSinceAtrialCaptureSec).join(",")}
    >
      <WorkbenchChartLegendV3
        hiddenSelections={hiddenLegendSelections}
        model={legendModel}
        selection={legendSelection}
        onHoverSelection={setHoveredLegendSelection}
        onToggleSelection={() => undefined}
        onToggleVisibility={(selection) =>
          setHiddenLegendSelections((current) =>
            current.some((candidate) =>
              pvLegendSelectionKeyV3(candidate) ===
                pvLegendSelectionKeyV3(selection))
              ? current.filter((candidate) =>
                  pvLegendSelectionKeyV3(candidate) !==
                    pvLegendSelectionKeyV3(selection))
              : Object.freeze([...current, selection]))}
      />
      {(retainedPvaDrawingCount > 0 || visibleRenderedTraces.some(({ history }) => history.some(({ completedBeat }) => completedBeat.length > 0))) && (
        <div className="flex items-center gap-1.5 px-3 pb-0.5 text-[10px] text-wb-subtle" data-chart-history-key="true">
          <span aria-hidden="true" className="w-4 border-t border-current opacity-40" />
          <span>{language?.startsWith("ja") ? "薄い線：変更前" : "Faded: previous inputs"}</span>
        </div>
      )}
      <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          role="img"
          aria-label={`${chamberAriaLabel} live pressure-volume loops from model-emitted cycles${
            relationStatus === null ? "" : `. ${relationStatus}`
          }`}
        />
        {showPvaBoundary && drawablePva.some(({ periodicPvaDrawing }) => periodicPvaDrawing.areaDisplay !== null && !periodicPvaDrawing.retainedFromPriorUpdate) && (
          <div className={`pointer-events-none absolute ${pvaAnalysisError ? "right-10" : "right-3"} ${pvaAnalysisPending ? "top-7" : "top-1"} flex items-center gap-2 text-[10px] text-wb-subtle`}
            aria-label="PVA view: solid SW, hatched PE; separate illustrations">
            <span>PVA</span><span>■ SW</span><span>▧ PE</span>
          </div>
        )}
        {pvaAnalysisPending && (
          <div
            className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1.5 text-[10px] text-wb-subtle"
            role="status"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full border border-wb-subtle/35 border-t-wb-accent motion-safe:animate-spin"
            />
            <span className="sr-only">
            {familyProgress !== undefined
              ? `PVA ready · Starling extension ${familyProgress.completedPointCount} settled points`
              : collectingPva?.preview?.stage === "pva"
                ? `PVA preview · ${collectingPva.preview.pointCount} settled points · refining to ≥${collectingPva.progress.totalPointCount}`
                : collectingPva?.preview?.stage === "relations"
                  ? `ESPVR / EDPVR preview · ${collectingPva.preview.pointCount} settled points`
                  : pvaProgress === undefined
                    ? "Settling source…"
                    : `PVA analysis ${pvaProgress.completedPointCount} settled points · minimum ${pvaProgress.totalPointCount}`}
            </span>
          </div>
        )}
        {pvaAnalysisError !== undefined && (
          <WorkbenchAnalysisErrorPopoverV3 error={pvaAnalysisError} onRetry={props.onRetryAnalysis} />
        )}
      </div>
    </div>
  );
}

/**
 * Upstream pane composition is intentionally declarative and may allocate
 * wrappers during unrelated status renders. Preserve the last semantically
 * identical descriptor graph so PV projection memoization remains effective.
 */
function useStableWorkbenchPressureVolumeTracesV3(
  next: readonly WorkbenchPressureVolumeTraceV3[],
): readonly WorkbenchPressureVolumeTraceV3[] {
  const currentRef = React.useRef<readonly WorkbenchPressureVolumeTraceV3[]>(
    next,
  );
  const current = currentRef.current;
  if (
    current.length !== next.length
    || current.some((trace, index) =>
      !sameWorkbenchPressureVolumeTraceV3(trace, next[index]!))
  ) {
    currentRef.current = next;
  }
  return currentRef.current;
}

function sameWorkbenchPressureVolumeTraceV3(
  left: WorkbenchPressureVolumeTraceV3,
  right: WorkbenchPressureVolumeTraceV3,
): boolean {
  return left.scenarioId === right.scenarioId
    && left.scenarioLabel === right.scenarioLabel
    && left.scenarioStatus === right.scenarioStatus
    && left.scenarioColor === right.scenarioColor
    && left.scenarioStyleIndex === right.scenarioStyleIndex
    && left.samples === right.samples
    && shallowIdentityArrayEqualV3(
      left.historySampleSets ?? [],
      right.historySampleSets ?? [],
    )
    && left.volumeOutputId === right.volumeOutputId
    && left.pressureOutputId === right.pressureOutputId
    && left.pressureBasis === right.pressureBasis
    && left.cyclePhaseOutputId === right.cyclePhaseOutputId
    && left.chamberId === right.chamberId
    && left.chamberLabel === right.chamberLabel
    && left.chamberColor === right.chamberColor
    && left.periodicPva === right.periodicPva
    && shallowIdentityArrayEqualV3(left.periodicPvaHistory ?? [], right.periodicPvaHistory ?? [],
      (a, b) => a.inputEpoch === b.inputEpoch && a.value === b.value)
    && left.periodicPvaAnalysisError === right.periodicPvaAnalysisError
    && left.periodicPvaAnalysisPending
      === right.periodicPvaAnalysisPending;
}

function shallowIdentityArrayEqualV3<T>(
  left: readonly T[],
  right: readonly T[],
  equal: (a: T, b: T) => boolean = Object.is,
): boolean {
  return left.length === right.length
    && left.every((value, index) => equal(value, right[index]!));
}

function workbenchPvHistoryEpochsV3(trace: WorkbenchPressureVolumeTraceV3): readonly number[] {
  return [...new Set([
    ...(trace.historySampleSets ?? []).flatMap(samples => samples[0] === undefined ? [] : [samples[0].inputEpoch]),
    ...(trace.periodicPvaHistory ?? []).map(previous => previous.inputEpoch),
  ])].sort((a, b) => a - b);
}

/** Never imply that the last completed analysis belongs to a newer old loop. */
export function workbenchPvHistoryDescriptionV3(trace: WorkbenchPressureVolumeTraceV3, japanese: boolean): string {
  const currentEpoch = trace.samples.at(-1)?.inputEpoch;
  const epochs = workbenchPvHistoryEpochsV3(trace);
  if (epochs.length === 0) return "";
  const records = epochs.map(epoch => {
    const loop = trace.historySampleSets?.some(samples => samples[0]?.inputEpoch === epoch);
    const relation = trace.periodicPvaHistory?.some(previous => previous.inputEpoch === epoch);
    const age = currentEpoch === undefined ? null : currentEpoch - epoch;
    const label = age !== null && age > 0
      ? japanese ? `${age}回前の設定` : `${age} input change(s) earlier`
      : japanese ? "以前の設定" : "Earlier inputs";
    return `${label}: ${[...(loop ? ["PV loop"] : []), ...(relation ? [japanese ? "解析曲線" : "analysis curves"] : [])].join(" / ")}`;
  });
  return `\n\n${japanese ? "変更前の表示（解析が未完了の設定では曲線はありません）" : "Previous inputs (analysis curves exist only where a result was obtained)"}\n${records.join("\n")}`;
}

/** Only visible loops own the viewport. Load relations and PVA geometry are
 * auxiliary, including historical ones, and may be clipped at the plot edge. */
export function workbenchPvLoopDomainPointsV3(
  traces: readonly (WorkbenchLivePvTrajectoryV3 & Readonly<{
    history: readonly WorkbenchHistoricalPvProjectionV3[];
  }>)[],
): readonly WorkbenchPvPointV3[] {
  return traces.flatMap(({ completedBeat, liveSegment, history }) => [
    ...completedBeat,
    ...liveSegment,
    ...history.flatMap(previous => previous.completedBeat),
  ]);
}

/** Display only: negative observations remain in the data, clipped below zero. */
export function nextZeroBasedPvDomainV3(
  previous: WorkbenchStableNumericDomainStateV3 | null,
  values: readonly number[],
  options: Readonly<{ commitKey: string | null; upperPaddingFraction?: number; minimumUpperPadding?: number }>,
): WorkbenchStableNumericDomainStateV3 {
  const positiveValues = values.filter(value => Number.isFinite(value) && value > 0);
  return nextStableNumericDomainStateV3(previous?.domain[0] === 0 ? previous : null,
    positiveValues.length === 0 ? [0, 1] : [0, ...positiveValues], {
    ...options, includeZero: true, lowerPaddingFraction: 0,
  });
}

function pvLegendDescriptorV3(trace: WorkbenchPressureVolumeTraceV3) {
  return Object.freeze({
    traceKey: workbenchTraceLegendKeyV3(trace.scenarioId, trace.chamberId),
    scenarioId: trace.scenarioId,
    scenarioLabel: trace.scenarioLabel,
    itemId: trace.chamberId,
    itemLabel: trace.chamberLabel,
    color: trace.chamberColor,
  });
}

function pvPressureAxisTitleV3(
  traces: readonly WorkbenchPressureVolumeTraceV3[],
): string {
  const bases = new Set(traces.map(({ pressureBasis }) => pressureBasis));
  const chambers = new Set(traces.map(({ chamberLabel }) => chamberLabel));
  if (bases.size !== 1) return "Pressure (mmHg)";
  const basis = traces[0]?.pressureBasis === "transmural"
    ? "transmural pressure"
    : "intracavitary pressure";
  const chamber = chambers.size === 1 ? traces[0]?.chamberLabel : undefined;
  return `${chamber === undefined ? "" : `${chamber} `}${basis} (mmHg)`;
}

function pvStableDomainCommitKeyV3(
  traces: readonly Readonly<{
    completedBeat: readonly WorkbenchPvPointV3[];
    liveSegment: readonly WorkbenchPvPointV3[];
    history: readonly unknown[];
    trace: WorkbenchPressureVolumeTraceV3;
  }>[],
): string | null {
  const keys = traces.flatMap(({ completedBeat, liveSegment, history, trace }) => {
    const completed = completedBeat.at(-1);
    if (completed !== undefined) {
      return [
        `${trace.scenarioId}:${trace.chamberId}:beat:${completed.acceptedTimeSec.toFixed(6)}:history:${history.length}`,
      ];
    }
    const live = liveSegment.at(-1);
    return live === undefined
      ? []
      : [
          `${trace.scenarioId}:${trace.chamberId}:time:${Math.floor(live.acceptedTimeSec / 0.75)}:history:${history.length}`,
        ];
  });
  return keys.length === 0 ? null : keys.join("\u001f");
}

function pvLegendSelectionKeyV3(
  selection: WorkbenchChartLegendSelectionV3 | null,
): string | null {
  if (selection === null) return null;
  if (selection.kind === "scenario") return `scenario:${selection.scenarioId}`;
  if (selection.kind === "item") return `item:${selection.itemId}`;
  return `trace:${selection.traceKey}`;
}

type PeriodicPvaDrawingV1 = Readonly<{
  espvr: MainWireIntegratedModelPeriodicPvaEspvrV1 | null;
  edpvr: MainWireIntegratedModelPeriodicPvaEdpvrV1 | null;
  loadRelation: MainWireSystolicPressureEnvelopeV1 | null;
  diastolicRelation: MainWireDiastolicLoadRelationV1 | null;
  areaDisplay: MainWirePvaAreaDisplayV1 | null;
  pressureEnvelope: readonly (readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[])[] | null;
  preview: boolean;
  retainedFromPriorUpdate: boolean;
}>;

function periodicPvaDrawingV1(
  pva: MainWirePeriodicPvaV1 | null | undefined,
  showPvaBoundary: boolean,
): PeriodicPvaDrawingV1 | null {
  if (!showPvaBoundary && pva?.loadRelations !== undefined) {
    const { systolic, diastolic } = pva.loadRelations;
    if (systolic === null && diastolic === null) return null;
    return Object.freeze({ espvr: null, edpvr: null, loadRelation: systolic, diastolicRelation: diastolic, areaDisplay: null,
      pressureEnvelope: null,
      preview: systolic?.completionStatus === "progressive" || diastolic?.completionStatus === "progressive", retainedFromPriorUpdate: false });
  }
  if (pva?.status === "available") {
    return Object.freeze({
      espvr: pva.espvr,
      edpvr: pva.edpvr,
      loadRelation: null,
      diastolicRelation: null,
      areaDisplay: showPvaBoundary ? pva.areaDisplay ?? null : null,
      pressureEnvelope: pva.loadRelations === undefined ? [pva.espvr.pressureEnvelopeDiagnostic.curve]
        : pva.loadRelations.systolic?.segments ?? null,
      preview: false,
      retainedFromPriorUpdate: false,
    });
  }
  if (
    (pva?.status !== "collecting" && !(showPvaBoundary && pva?.status === "unavailable"))
    || pva.preview?.espvr === null
    || pva.preview?.espvr === undefined
    || pva.preview.edpvr === null
  ) return null;
  return Object.freeze({
    espvr: pva.preview.espvr,
    edpvr: pva.preview.edpvr,
    loadRelation: null,
    diastolicRelation: null,
    areaDisplay: null,
    pressureEnvelope: pva.loadRelations === undefined ? [pva.preview.espvr.pressureEnvelopeDiagnostic.curve]
      : pva.loadRelations.systolic?.segments ?? null,
    preview: true,
    retainedFromPriorUpdate: false,
  });
}

function drawPeriodicPvaV1(
  context: CanvasRenderingContext2D,
  pva: PeriodicPvaDrawingV1,
  x: (volumeMl: number) => number,
  y: (pressureMmHg: number) => number,
  color: string,
  alpha: number,
  showPressureEnvelope: boolean,
  pointBorderColor: string,
): void {
  const relationAlpha = pva.preview ? alpha * 0.58 : alpha;
  // Historical boundaries remain comparable without mixing old SW/PE fills
  // with the current operating loop.
  if (pva.areaDisplay !== null && !pva.retainedFromPriorUpdate) drawWorkbenchPvaAreasV1(context, pva.areaDisplay, x, y, color, relationAlpha);
  if (showPressureEnvelope && pva.pressureEnvelope !== null) {
    for (const segment of pva.pressureEnvelope) drawPvCurveV3(
      context,
      segment,
      x,
      y,
      {
        color,
        width: 1.1,
        dash: Object.freeze([4, 3]),
        alpha: relationAlpha * 0.34,
      },
    );
  }
  if (pva.loadRelation !== null) {
    drawWorkbenchSystolicLoadRelationV1(context, pva.loadRelation, x, y, color, relationAlpha, pointBorderColor);
  } else if (pva.espvr !== null) {
    drawPvCurveV3(context, pva.espvr.curve, x, y, {
      color, width: 1.5, dash: [4, 3], alpha: relationAlpha * 0.62,
    });
    drawWorkbenchPvHighLoadIsochroneV1(context, pva.espvr, x, y, color, relationAlpha);
    for (const point of pva.espvr.fitPoints) drawPvRelationMarkerV3(context, x(point.volumeMl), y(point.pressureMmHg),
      color, 1.7, relationAlpha * 0.4, true);
  }
  if (pva.diastolicRelation !== null) {
    drawWorkbenchDiastolicLoadRelationV1(context, pva.diastolicRelation, x, y, color, relationAlpha, pointBorderColor);
  }
  const edpvr = pva.edpvr;
  if (edpvr === null) return;
  const edpvrPressure = (volumeMl: number) =>
    volumeMl <= edpvr.zeroPressureVolumeMl
      ? 0
      : edpvr.scaleMmHg
        * Math.expm1(
          edpvr.exponentPerMl
            * (volumeMl - edpvr.zeroPressureVolumeMl),
        );
  drawPvCurveV3(
    context,
    sampleDisplayedPvaCurveV1(
      edpvr.measuredVolumeRangeMl[0],
      edpvr.measuredVolumeRangeMl[1],
      edpvrPressure,
    ),
    x,
    y,
    {
      color,
      width: 1.6,
      dash: Object.freeze([4, 3]),
      alpha: relationAlpha * 0.72,
    },
  );
  for (const point of edpvr.fitPoints) {
    drawWorkbenchMeasuredPointV3(context, x(point.volumeMl), y(point.pressureMmHg),
      color, pointBorderColor, relationAlpha * 0.55, 2.5);
  }
}

export function drawWorkbenchSystolicLoadRelationV1(
  context: CanvasRenderingContext2D, relation: MainWireSystolicPressureEnvelopeV1,
  x: (volumeMl: number) => number, y: (pressureMmHg: number) => number,
  color: string, alpha: number, pointBorderColor: string,
): void {
  for (const segment of relation.segments) {
    drawPvCurveV3(context, segment, x, y, { color, width: 1.3, dash: [4, 3], alpha: alpha * 0.48 });
  }
  // Sparse load support on the envelope, not its dense interpolation vertices.
  for (const point of relation.loadSupportPoints) drawWorkbenchMeasuredPointV3(context,
    x(point.volumeMl), y(point.pressureMmHg), color, pointBorderColor, alpha * 0.55, 2.5);
}

export function drawWorkbenchDiastolicLoadRelationV1(
  context: CanvasRenderingContext2D, relation: MainWireDiastolicLoadRelationV1,
  x: (volumeMl: number) => number, y: (pressureMmHg: number) => number,
  color: string, alpha: number, pointBorderColor: string,
): void {
  for (const segment of relation.segments) {
    drawPvCurveV3(context, segment, x, y, { color, width: 1.3, dash: [4, 3], alpha: alpha * 0.52 });
    for (const point of segment) drawWorkbenchMeasuredPointV3(context,
      x(point.volumeMl), y(point.pressureMmHg), color, pointBorderColor, alpha * 0.55, 2.5);
  }
}

/** Distinct fills intentionally preserve overlaps. Their union is not PVA:
 * the numerical owner defines PVA as accepted-step SW plus geometric PE. */
export function drawWorkbenchPvaAreasV1(
  context: CanvasRenderingContext2D, area: MainWirePvaAreaDisplayV1,
  x: (volumeMl: number) => number, y: (pressureMmHg: number) => number,
  color: string, alpha: number,
): void {
  const polygon = (points: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[]) => {
    context.beginPath();
    points.forEach((point, index) => index === 0
      ? context.moveTo(x(point.volumeMl), y(point.pressureMmHg))
      : context.lineTo(x(point.volumeMl), y(point.pressureMmHg)));
    context.closePath();
  };
  context.save();
  context.fillStyle = color;
  context.globalAlpha = alpha * 0.08;
  polygon(area.strokeWorkLoop);
  context.fill();
  const strip = area.potentialEnergyStrip;
  if (strip.length > 1) {
    const upper = strip.map((point) => ({ volumeMl: point.volumeMl, pressureMmHg: point.upperPressureMmHg }));
    const lower = strip.map((point) => ({ volumeMl: point.volumeMl, pressureMmHg: point.lowerPressureMmHg }));
    polygon([...upper, ...[...lower].reverse()]);
    context.save();
    context.clip();
    context.globalAlpha = alpha * 0.28;
    context.strokeStyle = color;
    context.lineWidth = 0.65;
    const left = x(strip[0]!.volumeMl), right = x(strip.at(-1)!.volumeMl);
    const ys = [...upper, ...lower].map((point) => y(point.pressureMmHg));
    const top = Math.min(...ys), bottom = Math.max(...ys), height = bottom - top;
    context.beginPath();
    for (let start = left - height; start < right; start += 7) {
      context.moveTo(start, bottom); context.lineTo(start + height, top);
    }
    context.stroke();
    context.restore();
    drawPvCurveV3(context, upper, x, y, { color, width: 1, dash: [3, 3], alpha: alpha * 0.7 });
    // Mark the adopted isochrone anchor, not the semilunar-closure landmark.
    const end = upper.at(-1)!;
    drawPvRelationMarkerV3(context, x(end.volumeMl), y(end.pressureMmHg), color, 2.8, alpha * 0.8, false);
  }
  context.restore();
}

/** Shared by viewport and drawing so measured high loads cannot be clipped
 * merely because only the operating beat supplied the old axis limits. */
export function workbenchPvMeasuredHighLoadPointsV1(espvr: MainWireIntegratedModelPeriodicPvaEspvrV1) {
  return espvr.highLoadIsochroneDisplay?.points ?? [];
}

export function drawWorkbenchPvHighLoadIsochroneV1(
  context: CanvasRenderingContext2D,
  espvr: MainWireIntegratedModelPeriodicPvaEspvrV1,
  x: (volumeMl: number) => number,
  y: (pressureMmHg: number) => number,
  color: string,
  relationAlpha: number,
): void {
  const points = workbenchPvMeasuredHighLoadPointsV1(espvr);
  // These are ordered measured loads, not a globally monotone pressure law.
  drawPvCurveV3(context, points, x, y, {
    color, width: 1.3, dash: Object.freeze([4, 3]), alpha: relationAlpha * 0.48,
  });
  for (const point of points.slice(1)) {
    drawPvRelationMarkerV3(context, x(point.volumeMl), y(point.pressureMmHg),
      color, 1.7, relationAlpha * 0.4, true);
  }
}

function sampleDisplayedPvaCurveV1(
  startVolumeMl: number,
  endVolumeMl: number,
  pressure: (volumeMl: number) => number,
): readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[] {
  if (
    !Number.isFinite(startVolumeMl)
    || !Number.isFinite(endVolumeMl)
    || !(endVolumeMl > startVolumeMl)
  ) return Object.freeze([]);
  return Object.freeze(
    Array.from({ length: 65 }, (_, index) => {
      const volumeMl =
        startVolumeMl + (index / 64) * (endVolumeMl - startVolumeMl);
      return Object.freeze({ volumeMl, pressureMmHg: pressure(volumeMl) });
    }),
  );
}

function drawPvRelationMarkerV3(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius: number,
  alpha: number,
  filled: boolean,
): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  if (filled) context.fill();
  else context.stroke();
  context.restore();
}

type PvPlotRectV3 = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

type PvCanvasThemeV3 = Readonly<{
  canvas: string;
  grid: string;
  axis: string;
  text: string;
  font: string;
  messageFont: string;
}>;

function normalizedModelCyclePhaseV3(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return positiveModuloV3(value, 1);
}

function pvPlotRectV3(
  width: number,
  height: number,
  pressureAxisLineCount: number,
): PvPlotRectV3 {
  const left = Math.min(58 + (pressureAxisLineCount - 1) * 14, width * 0.3);
  const top = Math.min(12, height * 0.08);
  return Object.freeze({
    left,
    right: Math.max(left + 1, width - 16),
    top,
    bottom: Math.max(top + 1, height - 44),
  });
}

function wrapPvAxisTitleV3(context: CanvasRenderingContext2D, title: string, available: number): string[] {
  const lines: string[] = [];
  for (const word of title.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && context.measureText(`${last} ${word}`).width <= available) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else lines.push(word);
  }
  return lines;
}

function drawPvAxesV3(
  context: CanvasRenderingContext2D,
  plot: PvPlotRectV3,
  volumeDomain: WorkbenchNumericDomainV3,
  pressureDomain: WorkbenchNumericDomainV3,
  pressureAxisLines: readonly string[],
  theme: PvCanvasThemeV3,
  hasData: boolean,
): void {
  context.save();
  context.font = theme.font;
  context.fillStyle = theme.text;
  context.strokeStyle = theme.grid;
  context.lineWidth = 1;
  for (const value of hasData ? numericTicksV3(volumeDomain, 4) : []) {
    const x = scaleLinearV3(
      value,
      volumeDomain[0],
      volumeDomain[1],
      plot.left,
      plot.right,
    );
    context.beginPath();
    context.moveTo(x, plot.top);
    context.lineTo(x, plot.bottom);
    context.stroke();
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(
      formatPvAxisNumberV3(value),
      x,
      plot.bottom + 7,
    );
  }
  for (const value of hasData ? numericTicksV3(pressureDomain, 4) : []) {
    const y = scaleLinearV3(
      value,
      pressureDomain[0],
      pressureDomain[1],
      plot.bottom,
      plot.top,
    );
    context.beginPath();
    context.moveTo(plot.left, y);
    context.lineTo(plot.right, y);
    context.stroke();
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillText(
      formatPvAxisNumberV3(value),
      plot.left - 6,
      y,
    );
  }
  context.strokeStyle = theme.axis;
  context.strokeRect(
    plot.left,
    plot.top,
    plot.right - plot.left,
    plot.bottom - plot.top,
  );
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillText(
    "Volume (mL)",
    (plot.left + plot.right) / 2,
    plot.bottom + 40,
  );
  context.save();
  context.translate(12, (plot.top + plot.bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.textBaseline = "middle";
  pressureAxisLines.forEach((line, index) => context.fillText(line, 0, index * 14, plot.bottom - plot.top));
  context.restore();
  context.restore();
}

function drawPvCurveV3<T extends Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>>(
  context: CanvasRenderingContext2D,
  points: readonly T[],
  x: (value: number) => number,
  y: (value: number) => number,
  style: Readonly<{
    color: string;
    width: number;
    dash: readonly number[];
    alpha?: number;
  }>,
): void {
  if (points.length === 0) return;
  context.save();
  context.strokeStyle = style.color;
  context.lineWidth = style.width;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.setLineDash([...style.dash]);
  context.globalAlpha = style.alpha ?? 1;
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(x(point.volumeMl), y(point.pressureMmHg));
    else context.lineTo(x(point.volumeMl), y(point.pressureMmHg));
  });
  context.stroke();
  context.restore();
}

function drawPvLeadingCapV3(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  canvasColor: string,
  traceAlpha = 1,
): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  context.save();
  context.setLineDash([]);
  context.globalAlpha = 1;
  context.fillStyle = mixOpaqueWorkbenchCanvasColorV3(
    color,
    canvasColor,
    0.34 * traceAlpha,
  );
  context.beginPath();
  context.arc(x, y, 4.25, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = mixOpaqueWorkbenchCanvasColorV3(
    color,
    canvasColor,
    0.88 * traceAlpha,
  );
  context.lineWidth = 1;
  context.beginPath();
  context.arc(x, y, 3.5, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function readPvCanvasThemeV3(element: HTMLElement | null): PvCanvasThemeV3 {
  const [canvas, grid, axis, text, font, messageFont] =
    readWorkbenchCanvasThemeVariablesV3(element, [
      ["--wb-canvas-bg", "#0a141d"],
      ["--wb-grid", "rgba(165, 185, 200, 0.10)"],
      ["--wb-axis", "rgba(165, 185, 200, 0.32)"],
      ["--wb-text-muted", "#94a3b8"],
      ["--wb-chart-font", "10px ui-monospace, SFMono-Regular, Menlo, monospace"],
      ["--wb-chart-message-font", "12px system-ui, sans-serif"],
    ]);
  return Object.freeze({
    canvas: canvas!,
    grid: grid!,
    axis: axis!,
    text: text!,
    font: font!,
    messageFont: messageFont!,
  });
}

function formatPvAxisNumberV3(value: number): string {
  if (value === 0) return "0";
  return Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
}

function clampV3(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
