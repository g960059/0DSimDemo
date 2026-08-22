import React from "react";

import type {
  PressureVolumePressureBasisV2,
} from "@/studio/contracts/v2/model";
import type { MainWireIntegratedModelPeriodicPvaV1 } from "@/engine/myocardium/analysis/MainWireIntegratedModelPeriodicPvaV1";

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
  workbenchHistoryAlphaV3,
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
    periodicPva?: MainWireIntegratedModelPeriodicPvaV1;
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
  const legendSelection = hoveredLegendSelection;
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
      color: trace.chamberColor,
    }))),
    [traces],
  );
  const renderedTraces = React.useMemo(() => traces.map((trace) => {
    const trajectory = extractLivePvTrajectoryV3(
      trace.samples,
      trace.volumeOutputId,
      trace.pressureOutputId,
      trace.cyclePhaseOutputId,
    );
    const history = Object.freeze((trace.historySampleSets ?? []).map(
      (samples, historyIndex, all) => {
        const projection = projectHistoricalPvEpochV3(
          samples,
          trace.volumeOutputId,
          trace.pressureOutputId,
          trace.cyclePhaseOutputId,
        );
        return Object.freeze({
          ...projection,
          alpha: workbenchHistoryAlphaV3(historyIndex, all.length),
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
      history,
    });
  }), [traces]);
  const visibleRenderedTraces = React.useMemo(
    () => renderedTraces.filter(({ trace }) =>
      !workbenchLegendTraceHiddenV3(
        hiddenLegendSelections,
        pvLegendDescriptorV3(trace),
      )),
    [hiddenLegendSelections, renderedTraces],
  );
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
    const plot = pvPlotRectV3(width, height);
    // Upper domains remain loop-owned. The lower volume domain is extended
    // separately to finite extrapolated intercepts so the V0 geometry remains
    // visible without inflating the current upper bounds.
    const domainPoints: WorkbenchPvRelationPointV3[] = [
      ...visibleRenderedTraces.flatMap(({ completedBeat, liveSegment }) => [
        ...completedBeat,
        ...liveSegment,
      ]),
      ...visibleRenderedTraces.flatMap(({ history }) =>
        history.flatMap(({ completedBeat }) => completedBeat)),
    ];
    volumeDomainStateRef.current = nextStableNumericDomainStateV3(
      volumeDomainStateRef.current,
      domainPoints.map(({ volumeMl }) => volumeMl),
      {
        lowerPaddingFraction: 0.08,
        upperPaddingFraction: 0.08,
        minimumLowerPadding: 4,
        minimumUpperPadding: 4,
        commitKey: domainCommitKey,
      },
    );
    pressureDomainStateRef.current = nextStableNumericDomainStateV3(
      pressureDomainStateRef.current,
      domainPoints.map(({ pressureMmHg }) => pressureMmHg),
      {
        includeZero: true,
        lowerPaddingFraction: 0.02,
        upperPaddingFraction: 0.12,
        minimumUpperPadding: 5,
        commitKey: domainCommitKey,
      },
    );
    const volumeDomain = extendPvVolumeDomainToExtrapolatedInterceptsV3(
      volumeDomainStateRef.current.domain,
      visibleRenderedTraces.flatMap(({ periodicPva }) =>
          periodicPva?.status === "available"
            ? [
                periodicPva.espvr.volumeAxisInterceptMl,
                periodicPva.edpvr.zeroPressureVolumeMl,
              ]
            : []),
    );
    const pressureDomain = pressureDomainStateRef.current.domain;
    drawPvAxesV3(
      context,
      plot,
      volumeDomain,
      pressureDomain,
      pressureAxisTitle,
      theme,
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
    for (const {
      backBufferRemainder,
      periodicPva,
      liveSegment,
      trace,
    } of visibleRenderedTraces) {
      const traceAlpha = workbenchLegendTraceAlphaV3(
        legendSelection,
        pvLegendDescriptorV3(trace),
      );
      if (periodicPva?.status === "available") {
        drawPeriodicPvaV1(
          context,
          periodicPva,
          x,
          y,
          trace.chamberColor,
          0.92 * traceAlpha,
        );
      }
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

    if (visibleRenderedTraces.every(({ completedBeat, liveSegment }) =>
      completedBeat.length === 0 && liveSegment.length === 0)) {
      context.save();
      context.fillStyle = theme.text;
      context.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        "Collecting model-emitted cycle data…",
        (plot.left + plot.right) / 2,
        (plot.top + plot.bottom) / 2,
      );
      context.restore();
    }
  }, [
    domainCommitKey,
    legendSelection,
    pressureAxisTitle,
    visibleRenderedTraces,
  ]);

  useResponsiveCanvasFrameV3(
    containerRef,
    canvasRef,
    draw,
    "pressure-volume-loop",
  );

  const availablePva = visibleRenderedTraces.flatMap(
    ({ periodicPva, trace }) => periodicPva?.status === "available"
      ? [Object.freeze({ periodicPva, trace })]
      : [],
  );
  const relationStatus = availablePva.length > 0
    ? "Settled-source preload reduction · accepted-step SW / isochronal Emax ESPVR / exponential EDPVR / PE / PVA · not clinical validation"
    : "Settled-source preload-reduction analysis selected · relation not yet available";
  const chamberAriaLabel = legendModel.items.length === 0
    ? "Pressure-volume"
    : legendModel.items.map(({ label }) => label).join(", ");
  const pvaAnalysisPending = traces.some(
    ({ periodicPvaAnalysisPending }) => periodicPvaAnalysisPending === true,
  );
  const pvaProgress = visibleRenderedTraces
    .map(({ periodicPva }) => periodicPva)
    .find((periodicPva) =>
      periodicPva !== null && periodicPva.status === "collecting")?.progress;
  const familyProgress = availablePva[0]?.periodicPva.source.familyProgress;
  const pvaAnalysisError = visibleRenderedTraces
    .map(({ trace }) => trace.periodicPvaAnalysisError)
    .find((message): message is string =>
      typeof message === "string" && message.length > 0);

  return (
    <div
      className={`flex min-h-52 h-full w-full flex-col overflow-hidden ${className ?? ""}`}
      data-chart-kind="pressure-volume-loop-v3"
      data-pv-analysis-mode="formal-periodic"
      data-cycle-source="model-emitted-cycle-phase"
      data-pv-relation-semantics="isochronal-emax-espvr-exponential-edpvr"
      data-pv-loop-trace-count={visibleRenderedTraces.length}
      data-pva-analysis-pending={pvaAnalysisPending ? "true" : "false"}
      data-pva-result-count={availablePva.length}
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
      <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          role="img"
          aria-label={`${chamberAriaLabel} live pressure-volume loops from model-emitted cycles${
            relationStatus === null ? "" : `. ${relationStatus}`
          }`}
        />
        {pvaAnalysisPending && (
          <div
            className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1.5 text-[10px] text-wb-subtle"
            role="status"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full border border-wb-subtle/35 border-t-wb-accent motion-safe:animate-spin"
            />
            {familyProgress !== undefined
              ? `PVA ready · Starling extension ${familyProgress.completedPointCount} settled points`
              : pvaProgress === undefined
                ? "Settling source…"
                : `PVA analysis ${pvaProgress.completedPointCount}/${pvaProgress.totalPointCount} points`}
          </div>
        )}
        {availablePva.length > 0 && (
          <div
            className="pointer-events-none absolute bottom-2 left-2 grid max-w-[calc(100%-1rem)] gap-1 rounded-lg border border-wb-line/70 bg-wb-app/90 px-2.5 py-2 text-[10px] leading-4 text-wb-muted shadow-sm backdrop-blur"
            data-testid="workbench-pva-results"
          >
            {availablePva.slice(0, 4).map(({ periodicPva, trace }) => (
              <div
                key={`${trace.scenarioId}:${trace.chamberId}`}
                className="flex flex-wrap items-baseline gap-x-2"
              >
                <span className="font-semibold text-wb-text">
                  {trace.scenarioLabel} · {trace.chamberLabel}
                </span>
                <span>SW {periodicPva.strokeWork.joule.toFixed(3)} J</span>
                <span>PE {periodicPva.potentialEnergy.joule.toFixed(3)} J</span>
                <span>PVA {periodicPva.pva.joule.toFixed(3)} J</span>
                <span>
                  Emax {periodicPva.espvr.elastanceMmHgPerMl.toFixed(3)}{" "}
                  mmHg/mL · phase{" "}
                  {periodicPva.espvr.maximumElastancePhase01.toFixed(3)} · R²{" "}
                  {periodicPva.espvr.rSquared.toFixed(3)}
                </span>
                {periodicPva.espvr.nonlinearComparator !== null && (
                  <span>
                    quadratic comparator R²{" "}
                    {periodicPva.espvr.nonlinearComparator.rSquared.toFixed(3)}
                  </span>
                )}
                {periodicPva.espvr.semilunarClosureComparator !== null && (
                  <span>
                    semilunar closure R²{" "}
                    {periodicPva.espvr.semilunarClosureComparator.rSquared.toFixed(3)}
                  </span>
                )}
                <span>exponential EDPVR R² {periodicPva.edpvr.rSquared.toFixed(3)}</span>
                {periodicPva.estimatedMvo2?.status === "available" && (
                  <span>
                    estimated MVO₂ @{periodicPva.estimatedMvo2.heartRateBpm.toFixed(1)} bpm{" "}
                    {periodicPva.estimatedMvo2.oxygenDemand.totalMlO2PerMinPer100G.toFixed(2)}{" "}
                    mL/min/100 g
                  </span>
                )}
              </div>
            ))}
            <span className="text-[9px] text-wb-subtle">
              Persistent hot-start chain · coronary tone held at source ·
              isochronal Emax ESPVR · exponential EDPVR · MVO₂ is a Suga
              literature estimate
            </span>
          </div>
        )}
        {pvaAnalysisError !== undefined && (
          <div
            className="absolute bottom-2 left-2 right-2 rounded-lg border border-red-400/40 bg-wb-app/95 px-2.5 py-2 text-[10px] leading-4 text-red-500 shadow-sm backdrop-blur"
            data-testid="workbench-pva-analysis-error"
            role="alert"
          >
            PVA analysis unavailable: {pvaAnalysisError}
          </div>
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
    && left.periodicPvaAnalysisError === right.periodicPvaAnalysisError
    && left.periodicPvaAnalysisPending
      === right.periodicPvaAnalysisPending;
}

function shallowIdentityArrayEqualV3<T>(
  left: readonly T[],
  right: readonly T[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
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

export function extendPvVolumeDomainToExtrapolatedInterceptsV3(
  loopOwnedDomain: WorkbenchNumericDomainV3,
  interceptVolumesMl: readonly number[],
): WorkbenchNumericDomainV3 {
  const finite = interceptVolumesMl.filter(Number.isFinite);
  if (finite.length === 0) return loopOwnedDomain;
  const minimumInterceptMl = Math.min(...finite);
  if (minimumInterceptMl >= loopOwnedDomain[0]) return loopOwnedDomain;
  const loopSpanMl = loopOwnedDomain[1] - loopOwnedDomain[0];
  return Object.freeze([
    minimumInterceptMl - Math.max(2, loopSpanMl * 0.03),
    loopOwnedDomain[1],
  ]);
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

function drawPeriodicPvaV1(
  context: CanvasRenderingContext2D,
  pva: Extract<MainWireIntegratedModelPeriodicPvaV1, { status: "available" }>,
  x: (volumeMl: number) => number,
  y: (pressureMmHg: number) => number,
  color: string,
  alpha: number,
): void {
  drawPvCurveV3(context, pva.espvr.curve, x, y, {
    color,
    width: 1.65,
    dash: Object.freeze([]),
    alpha,
  });
  drawPvCurveV3(context, pva.edpvr.curve, x, y, {
    color,
    width: 1.35,
    dash: Object.freeze([4, 3]),
    alpha: alpha * 0.72,
  });
  drawPvRelationMarkerV3(
    context,
    x(pva.espvr.volumeAxisInterceptMl),
    y(0),
    color,
    2.4,
    alpha,
    false,
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
}>;

function normalizedModelCyclePhaseV3(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return positiveModuloV3(value, 1);
}

function pvPlotRectV3(
  width: number,
  height: number,
): PvPlotRectV3 {
  const left = Math.min(58, width * 0.24);
  const top = Math.min(12, height * 0.08);
  return Object.freeze({
    left,
    right: Math.max(left + 1, width - 16),
    top,
    bottom: Math.max(top + 1, height - 34),
  });
}

function drawPvAxesV3(
  context: CanvasRenderingContext2D,
  plot: PvPlotRectV3,
  volumeDomain: WorkbenchNumericDomainV3,
  pressureDomain: WorkbenchNumericDomainV3,
  pressureAxisTitle: string,
  theme: PvCanvasThemeV3,
): void {
  context.save();
  context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = theme.text;
  context.strokeStyle = theme.grid;
  context.lineWidth = 1;
  for (const value of numericTicksV3(volumeDomain, 4)) {
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
  for (const value of numericTicksV3(pressureDomain, 4)) {
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
    plot.bottom + 31,
  );
  context.save();
  context.translate(12, (plot.top + plot.bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(pressureAxisTitle, 0, 0);
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
  const [canvas, grid, axis, text] =
    readWorkbenchCanvasThemeVariablesV3(element, [
      ["--wb-canvas-bg", "#0a141d"],
      ["--wb-grid", "rgba(165, 185, 200, 0.10)"],
      ["--wb-axis", "rgba(165, 185, 200, 0.32)"],
      ["--wb-text-muted", "#94a3b8"],
    ]);
  return Object.freeze({
    canvas: canvas!,
    grid: grid!,
    axis: axis!,
    text: text!,
  });
}

function formatPvAxisNumberV3(value: number): string {
  return Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
}

function clampV3(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
