import React from "react";

import type {
  PressureVolumePressureBasisV2,
} from "@/studio/contracts/v2/model";
import {
  MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_SEMANTICS_V3,
  type MainWireIntegratedModelRapidPressureVolumeRelationV3,
} from "@/engine/myocardium/MainWireIntegratedModelRapidPressureVolumeRelationV3";

import {
  finiteWorkbenchScalarValueV3,
  orderedFiniteWorkbenchSamplesV3,
  type WorkbenchScalarSampleV3,
} from "./WorkbenchScalarSampleV3";
import {
  positiveModuloV3,
} from "./SweepingWaveformCanvasV3";
import {
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
    rapidPressureVolumeRelation?:
      MainWireIntegratedModelRapidPressureVolumeRelationV3;
    rapidPressureVolumeRelationHistory?: readonly MainWireIntegratedModelRapidPressureVolumeRelationV3[];
    rapidPressureVolumeRelationPending?: boolean;
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
  analysisMode?: "responsive-preview" | "formal-periodic";
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
    const rapidRelation =
      trace.rapidPressureVolumeRelation?.status === "complete-preview"
      || trace.rapidPressureVolumeRelation?.status === "collecting-preview"
      || trace.rapidPressureVolumeRelation?.status === "complete-formal"
      || trace.rapidPressureVolumeRelation?.status === "collecting-formal"
        ? trace.rapidPressureVolumeRelation
        : null;
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
      rapidRelation,
      rapidRelationHistory: Object.freeze(
        (trace.rapidPressureVolumeRelationHistory ?? []).flatMap(
          (relation, historyIndex, all) =>
            relation.status === "complete-preview"
              || relation.status === "collecting-preview"
              || relation.status === "complete-formal"
              || relation.status === "collecting-formal"
              ? [Object.freeze({
                  relation,
                  alpha: workbenchHistoryAlphaV3(historyIndex, all.length),
                })]
              : [],
        ),
      ),
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
      visibleRenderedTraces.flatMap(({ rapidRelation }) => rapidRelation === null
        ? []
        : [
            rapidRelation.systolicEnvelope
              .extrapolatedVolumeAxisInterceptMl,
            rapidRelation.maximumVolume
              .extrapolatedZeroPressureVolumeMl,
          ]),
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
    for (const { history, rapidRelationHistory, trace } of visibleRenderedTraces) {
      const traceAlpha = workbenchLegendTraceAlphaV3(
        legendSelection,
        pvLegendDescriptorV3(trace),
      );
      for (const historical of rapidRelationHistory) {
        drawRapidPvRelationV3(
          context,
          historical.relation,
          volumeDomain,
          pressureDomain,
          x,
          y,
          trace.chamberColor,
          historical.alpha * traceAlpha,
          false,
        );
      }
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
      rapidRelation,
      liveSegment,
      trace,
    } of visibleRenderedTraces) {
      const traceAlpha = workbenchLegendTraceAlphaV3(
        legendSelection,
        pvLegendDescriptorV3(trace),
      );
      if (rapidRelation !== null) {
        drawRapidPvRelationV3(
          context,
          rapidRelation,
          volumeDomain,
          pressureDomain,
          x,
          y,
          trace.chamberColor,
          0.82 * traceAlpha,
          true,
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

  const anyRapidRelation = renderedTraces.some(({ rapidRelation }) =>
    rapidRelation !== null);
  const anyFormalRelation = renderedTraces.some(({ rapidRelation }) =>
    rapidRelation?.analysisMode === "formal-periodic");
  const formalAnalysisSelected =
    props.analysisMode === "formal-periodic" || anyFormalRelation;
  const currentRapidRelationTraceCount = renderedTraces.filter(
    ({ rapidRelation }) => rapidRelation !== null,
  ).length;
  // A prior relation remains intentionally visible while a changed Scenario
  // is recomputed. Count what the reader can actually see, rather than making
  // tests and assistive diagnostics treat that stable history as absent.
  const visibleRapidRelationTraceCount = renderedTraces.filter(
    ({ rapidRelation, rapidRelationHistory }) =>
      rapidRelation !== null || rapidRelationHistory.length > 0,
  ).length;
  const relationStatus = anyFormalRelation
    ? "Formal periodic fixed-TBV multi-load ESPVR / EDPVR analysis · not clinical validation"
    : formalAnalysisSelected
    ? "Formal periodic fixed-TBV ESPVR / EDPVR analysis selected · qualified multi-load relation not yet available"
    : anyRapidRelation
    ? "Responsive multi-load fixed-TBV PV-loop support-envelope preview · center locally settled · not a formal ESPVR/EDPVR protocol"
    : null;
  const chamberAriaLabel = legendModel.items.length === 0
    ? "Pressure-volume"
    : legendModel.items.map(({ label }) => label).join(", ");
  const rapidRelationPending = traces.some(
    ({ rapidPressureVolumeRelationPending }) =>
      rapidPressureVolumeRelationPending === true,
  );

  return (
    <div
      className={`flex min-h-52 h-full w-full flex-col overflow-hidden ${className ?? ""}`}
      data-chart-kind="pressure-volume-loop-v3"
      data-pv-analysis-mode={
        formalAnalysisSelected ? "formal-periodic" : "responsive-preview"
      }
      data-cycle-source="model-emitted-cycle-phase"
      data-pv-relation-semantics={
        anyRapidRelation
          ? renderedTraces.find(({ rapidRelation }) => rapidRelation !== null)
              ?.rapidRelation?.semantics ??
            MAIN_WIRE_INTEGRATED_MODEL_RAPID_PRESSURE_VOLUME_RELATION_SEMANTICS_V3
          : "unavailable"
      }
      data-pv-current-relation-trace-count={currentRapidRelationTraceCount}
      data-pv-relation-trace-count={visibleRapidRelationTraceCount}
      data-pv-loop-trace-count={visibleRenderedTraces.length}
      data-rapid-pv-relation-pending={
        rapidRelationPending ? "true" : "false"
      }
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
        {rapidRelationPending && (
          <div
            className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1.5 text-[10px] text-wb-subtle"
            role="status"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full border border-wb-subtle/35 border-t-wb-accent motion-safe:animate-spin"
            />
            {formalAnalysisSelected ? "Formal PV analysis" : "PV preview"}
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
    && left.rapidPressureVolumeRelation
      === right.rapidPressureVolumeRelation
    && shallowIdentityArrayEqualV3(
      left.rapidPressureVolumeRelationHistory ?? [],
      right.rapidPressureVolumeRelationHistory ?? [],
    )
    && left.rapidPressureVolumeRelationPending
      === right.rapidPressureVolumeRelationPending;
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

function drawRapidPvRelationV3(
  context: CanvasRenderingContext2D,
  relation: Exclude<
    MainWireIntegratedModelRapidPressureVolumeRelationV3,
    Readonly<{ status: "insufficient-data" }>
  >,
  volumeDomain: WorkbenchNumericDomainV3,
  pressureDomain: WorkbenchNumericDomainV3,
  x: (volumeMl: number) => number,
  y: (pressureMmHg: number) => number,
  color: string,
  alpha: number,
  showLandmarks: boolean,
): void {
  drawPvCurveV3(
    context,
    extendPvSystolicRelationToPlotBoundaryV3(
      relation,
      volumeDomain,
      pressureDomain,
    ),
    x,
    y,
    {
      color,
      width: relation.analysisMode === "formal-periodic" ? 1.45 : 1.15,
      dash: Object.freeze([]),
      alpha: alpha *
        (relation.analysisMode === "formal-periodic" ? 0.86 : 0.62),
    },
  );
  drawPvCurveV3(context, relation.maximumVolumeTrendCurve, x, y, {
    color,
    width: 1.2,
    dash: Object.freeze([]),
    alpha: alpha * 0.5,
  });
  if (!showLandmarks) return;
  // The fixed-TBV sweep landmarks remain part of the numerical fit, but are
  // intentionally presentation-internal. Showing every sampled ES/ED point
  // reads as a second dataset and obscures the loop/relation geometry. Keep
  // only the semantically useful V0 and current-loop contact markers below.
  const systolicIntercept = relation.systolicEnvelopeTrendCurve[0];
  const passiveIntercept = relation.maximumVolumeTrendCurve[0];
  if (systolicIntercept !== undefined) {
    drawPvRelationMarkerV3(
      context,
      x(systolicIntercept.volumeMl),
      y(systolicIntercept.pressureMmHg),
      color,
      2.25,
      alpha * 0.72,
      false,
    );
  }
  if (passiveIntercept !== undefined) {
    drawPvRelationMarkerV3(
      context,
      x(passiveIntercept.volumeMl),
      y(passiveIntercept.pressureMmHg),
      color,
      1.8,
      alpha * 0.48,
      false,
    );
  }
}

/**
 * Draws the fitted ESPVR convention from V0 until it first meets the visible
 * right or top plot boundary. The numerical fit remains owned by the complete
 * multi-load PV-loop support envelope; this helper changes only its
 * presentation extent.
 */
export function extendPvSystolicRelationToPlotBoundaryV3(
  relation: Exclude<
    MainWireIntegratedModelRapidPressureVolumeRelationV3,
    Readonly<{ status: "insufficient-data" }>
  >,
  volumeDomain: WorkbenchNumericDomainV3,
  pressureDomain: WorkbenchNumericDomainV3,
): readonly WorkbenchPvRelationPointV3[] {
  const volumeIntercept = relation.systolicEnvelope
    .extrapolatedVolumeAxisInterceptMl;
  const slope = relation.systolicEnvelope.elastanceMmHgPerMl;
  const maximumVolume = volumeDomain[1];
  const maximumPressure = pressureDomain[1];
  if (
    !Number.isFinite(volumeIntercept) ||
    !Number.isFinite(slope) ||
    !Number.isFinite(maximumVolume) ||
    !Number.isFinite(maximumPressure) ||
    !(slope > 0) ||
    !(maximumVolume > volumeIntercept) ||
    !(maximumPressure > 0)
  ) return Object.freeze([]);
  const topBoundaryVolume = volumeIntercept + maximumPressure / slope;
  const endVolume = Math.min(maximumVolume, topBoundaryVolume);
  if (!(endVolume > volumeIntercept)) return Object.freeze([]);
  return Object.freeze([
    Object.freeze({ volumeMl: volumeIntercept, pressureMmHg: 0 }),
    Object.freeze({
      volumeMl: endVolume,
      pressureMmHg: slope * (endVolume - volumeIntercept),
    }),
  ]);
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
  traceAlpha = 1,
): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  context.save();
  context.setLineDash([]);
  context.fillStyle = color;
  context.globalAlpha = 0.2 * traceAlpha;
  context.beginPath();
  context.arc(x, y, 4.25, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.globalAlpha = 0.72 * traceAlpha;
  context.beginPath();
  context.arc(x, y, 3.5, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function readPvCanvasThemeV3(element: HTMLElement | null): PvCanvasThemeV3 {
  const [grid, axis, text] = readWorkbenchCanvasThemeVariablesV3(element, [
    ["--wb-border", "rgba(148, 163, 184, 0.18)"],
    ["--wb-border-strong", "rgba(148, 163, 184, 0.48)"],
    ["--wb-text-muted", "#94a3b8"],
  ]);
  return Object.freeze({
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
