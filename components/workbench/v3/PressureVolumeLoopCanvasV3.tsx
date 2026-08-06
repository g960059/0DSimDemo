import React from "react";

import type {
  PressureVolumePressureBasisV2,
} from "@/studio/contracts/v2/model";

import {
  finiteWorkbenchScalarValueV3,
  orderedFiniteWorkbenchSamplesV3,
  type WorkbenchScalarSampleV3,
} from "./WorkbenchScalarSampleV3";
import {
  observedNumericDomainV3,
  positiveModuloV3,
  type WorkbenchNumericDomainV3,
} from "./SweepingWaveformCanvasV3";
import {
  scaleLinearV3,
  useResponsiveCanvasFrameV3,
} from "./WorkbenchCanvasRuntimeV3";
import {
  WorkbenchChartTwoAxisLegendV3,
  buildWorkbenchScenarioLegendItemsV3,
  buildWorkbenchTraceColorLegendItemsV3,
  workbenchHistoryAlphaV3,
  type WorkbenchScenarioTraceIdentityV3,
} from "./WorkbenchChartTraceStyleV3";

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
    /** Stable per chamber, independent of Scenario. */
    chamberColor: string;
    showSingleBeatOrientationGuides?: boolean;
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

export type WorkbenchPvGuidePointV3 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

export const SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3 =
  "single-beat-orientation-references-not-formal-pressure-volume-relations" as const;

export type SingleBeatPvOrientationGuidesV3 = Readonly<{
  semantics: typeof SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3;
  pressureBasis: "transmural";
  endSystolicRadialReference: readonly WorkbenchPvGuidePointV3[];
  klotzInformedDiastolicReference: readonly WorkbenchPvGuidePointV3[];
  systolicReferenceContact: WorkbenchPvGuidePointV3;
  maximumVolumeContact: WorkbenchPvGuidePointV3;
}>;

export type WorkbenchHistoricalPvProjectionV3 = Readonly<{
  completedBeat: readonly WorkbenchPvPointV3[];
  orientationGuides: SingleBeatPvOrientationGuidesV3 | null;
}>;

export type CompleteCycleRangeV3 = Readonly<{
  startIndex: number;
  endIndexInclusive: number;
}>;

const CYCLE_PHASE_EPSILON_V3 = 1e-6;
const CYCLE_START_TOLERANCE_V3 = 0.03;
const MINIMUM_COMPLETE_CYCLE_PHASE_SPAN_V3 = 0.8;
const KLOTZ_NORMALIZED_PRESSURE_MMHG_V3 = 28.2;
const KLOTZ_NORMALIZED_EXPONENT_V3 = 2.79;
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
  pressureBasis: WorkbenchPvPressureBasisV3,
  showSingleBeatOrientationGuides: boolean,
): WorkbenchHistoricalPvProjectionV3 {
  const cacheKey = JSON.stringify([
    volumeOutputId,
    pressureOutputId,
    cyclePhaseOutputId,
    pressureBasis,
    showSingleBeatOrientationGuides,
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
  const projection = Object.freeze({
    completedBeat,
    orientationGuides: showSingleBeatOrientationGuides
      ? buildSingleBeatPvOrientationGuidesV3(completedBeat, pressureBasis)
      : null,
  });
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

/**
 * Creates familiar single-beat orientation guides. It intentionally fails
 * closed for intracavitary pressure because both formulas require transmural
 * pressure. The result is never a formal multi-load ESPVR/EDPVR fit.
 */
export function buildSingleBeatPvOrientationGuidesV3(
  beat: readonly WorkbenchPvPointV3[],
  pressureBasis: WorkbenchPvPressureBasisV3,
): SingleBeatPvOrientationGuidesV3 | null {
  if (pressureBasis !== "transmural" || beat.length < 3) return null;
  const finite = beat.filter((point) =>
    Number.isFinite(point.volumeMl)
    && Number.isFinite(point.pressureMmHg)
    && point.volumeMl > 1e-6);
  if (finite.length < 3) return null;
  const maximumPressure = Math.max(...finite.map(({ pressureMmHg }) =>
    pressureMmHg));
  const maximumVolume = Math.max(...finite.map(({ volumeMl }) => volumeMl));
  const systolicCandidates = finite.filter((point) =>
    point.pressureMmHg > 0
    && point.pressureMmHg >= 0.5 * maximumPressure
    && point.volumeMl <= 0.98 * maximumVolume);
  const systolicReference = maximumByV3(
    systolicCandidates.length > 0 ? systolicCandidates : finite,
    (point) => point.pressureMmHg / point.volumeMl,
  );
  const maximumVolumeReference = maximumByV3(
    finite,
    (point) => point.volumeMl - Math.max(0, point.pressureMmHg) * 1e-9,
  );
  if (
    systolicReference === null
    || maximumVolumeReference === null
    || !(systolicReference.pressureMmHg > 0)
    || !(maximumVolumeReference.pressureMmHg > 0)
    || !(maximumVolumeReference.pressureMmHg < 30)
  ) return null;

  // Origin-to-contact is an explicit radial display convention. It is not a
  // fitted V0 or a single-beat/multi-load ESPVR estimator.
  const orientationElastance = systolicReference.pressureMmHg
    / systolicReference.volumeMl;
  const radialEndVolumeMl = Math.max(
    maximumVolume * 1.15,
    systolicReference.volumeMl * 1.2,
  );
  const endSystolicRadialReference = sampleGuideCurveV3(
    0,
    radialEndVolumeMl,
    (volumeMl) => orientationElastance * volumeMl,
    64,
  );

  // Klotz-informed normalized filling guide, anchored at this beat's
  // maximum-volume point. The model does not yet emit a formal ED event, so
  // this is a presentation reference rather than an EDPVR estimate.
  const diastolicV0Ml = clampV3(
    maximumVolumeReference.volumeMl
      * (0.6 - 0.006 * maximumVolumeReference.pressureMmHg),
    0,
    Math.max(0, maximumVolumeReference.volumeMl - 1e-6),
  );
  const diastolicSpanMl = Math.max(
    1e-6,
    maximumVolumeReference.volumeMl - diastolicV0Ml,
  );
  const diastolicV30Ml = diastolicV0Ml + diastolicSpanMl
    / Math.pow(
      maximumVolumeReference.pressureMmHg
        / KLOTZ_NORMALIZED_PRESSURE_MMHG_V3,
      1 / KLOTZ_NORMALIZED_EXPONENT_V3,
    );
  const diastolicV30SpanMl = Math.max(
    1e-6,
    diastolicV30Ml - diastolicV0Ml,
  );
  const diastolicEndVolumeMl = Math.max(
    maximumVolumeReference.volumeMl * 1.12,
    Math.min(
      maximumVolumeReference.volumeMl * 1.28,
      diastolicV0Ml + diastolicSpanMl
        * Math.pow(
          Math.max(30, maximumVolumeReference.pressureMmHg * 2.4)
            / maximumVolumeReference.pressureMmHg,
          1 / KLOTZ_NORMALIZED_EXPONENT_V3,
        ),
    ),
  );
  const klotzInformedDiastolicReference = sampleGuideCurveV3(
    diastolicV0Ml,
    diastolicEndVolumeMl,
    (volumeMl) => KLOTZ_NORMALIZED_PRESSURE_MMHG_V3
      * Math.pow(
        Math.max(0, (volumeMl - diastolicV0Ml) / diastolicV30SpanMl),
        KLOTZ_NORMALIZED_EXPONENT_V3,
      ),
    64,
  );

  const systolicReferenceContact = Object.freeze({
    volumeMl: systolicReference.volumeMl,
    pressureMmHg: systolicReference.pressureMmHg,
  });
  const maximumVolumeContact = Object.freeze({
    volumeMl: maximumVolumeReference.volumeMl,
    pressureMmHg: maximumVolumeReference.pressureMmHg,
  });
  return Object.freeze({
    semantics: SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3,
    pressureBasis: "transmural" as const,
    endSystolicRadialReference: withExactContactV3(
      endSystolicRadialReference,
      systolicReferenceContact,
    ),
    klotzInformedDiastolicReference: withExactContactV3(
      klotzInformedDiastolicReference,
      maximumVolumeContact,
    ),
    systolicReferenceContact,
    maximumVolumeContact,
  });
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
        showSingleBeatOrientationGuides?: never;
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
        showSingleBeatOrientationGuides?: boolean;
        traces?: undefined;
      }>
  );

export function PressureVolumeLoopCanvasV3(
  props: PressureVolumeLoopCanvasPropsV3,
) {
  const { className } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const traces = React.useMemo<readonly WorkbenchPressureVolumeTraceV3[]>(
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
        showSingleBeatOrientationGuides:
          props.showSingleBeatOrientationGuides ?? true,
      })]);
    }, [
      props.chamberLabel,
      props.color,
      props.cyclePhaseOutputId,
      props.pressureBasis,
      props.pressureOutputId,
      props.samples,
      props.showSingleBeatOrientationGuides,
      props.traces,
      props.volumeOutputId,
    ],
  );
  const scenarioLegendItems = React.useMemo(
    () => buildWorkbenchScenarioLegendItemsV3(traces),
    [traces],
  );
  const colorLegendItems = React.useMemo(
    () => buildWorkbenchTraceColorLegendItemsV3(traces.map((trace) => ({
      colorKey: trace.chamberId,
      label: trace.chamberLabel,
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
    const lineDash = scenarioLegendItems.find((item) =>
      item.scenarioId === trace.scenarioId)?.lineDash ?? Object.freeze([]);
    const orientationGuides = trace.showSingleBeatOrientationGuides === true
      ? buildSingleBeatPvOrientationGuidesV3(
          trajectory.completedBeat,
          trace.pressureBasis,
        )
      : null;
    const history = Object.freeze((trace.historySampleSets ?? []).map(
      (samples, historyIndex, all) => {
        const projection = projectHistoricalPvEpochV3(
          samples,
          trace.volumeOutputId,
          trace.pressureOutputId,
          trace.cyclePhaseOutputId,
          trace.pressureBasis,
          trace.showSingleBeatOrientationGuides === true,
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
      lineDash,
      orientationGuides,
      history,
    });
  }), [scenarioLegendItems, traces]);

  const draw = React.useCallback((
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const theme = readPvCanvasThemeV3(containerRef.current);
    const plot = pvPlotRectV3(width, height);
    const domainPoints: WorkbenchPvGuidePointV3[] = [
      ...renderedTraces.flatMap(({ completedBeat, liveSegment }) => [
        ...completedBeat,
        ...liveSegment,
      ]),
      ...renderedTraces.flatMap(({ history, orientationGuides }) => [
        ...(orientationGuides?.endSystolicRadialReference ?? []),
        ...(orientationGuides?.klotzInformedDiastolicReference ?? []),
        ...history.flatMap(({ completedBeat, orientationGuides: guides }) => [
          ...completedBeat,
          ...(guides?.endSystolicRadialReference ?? []),
          ...(guides?.klotzInformedDiastolicReference ?? []),
        ]),
      ]),
    ];
    const volumeDomain = paddedPvDomainV3(
      domainPoints.map(({ volumeMl }) => volumeMl),
      true,
    );
    const pressureDomain = paddedPvDomainV3(
      domainPoints.map(({ pressureMmHg }) => pressureMmHg),
      true,
    );
    drawPvAxesV3(
      context,
      plot,
      volumeDomain,
      pressureDomain,
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

    for (const { history, lineDash, trace } of renderedTraces) {
      for (const historical of history) {
        if (historical.orientationGuides !== null) {
          drawPvCurveV3(
            context,
            historical.orientationGuides.endSystolicRadialReference,
            x,
            y,
            {
              color: theme.systolicReference,
              width: 1.1,
              dash: [6, 4],
              alpha: historical.alpha,
            },
          );
          drawPvCurveV3(
            context,
            historical.orientationGuides.klotzInformedDiastolicReference,
            x,
            y,
            {
              color: theme.diastolicReference,
              width: 1.1,
              dash: [3, 4],
              alpha: historical.alpha,
            },
          );
        }
        drawPvCurveV3(context, historical.completedBeat, x, y, {
          color: trace.chamberColor,
          width: 1.35,
          dash: lineDash,
          alpha: historical.alpha,
        });
      }
    }
    for (const {
      completedBeat,
      orientationGuides,
      lineDash,
      liveSegment,
      trace,
    } of renderedTraces) {
      if (orientationGuides !== null) {
        drawPvCurveV3(
          context,
          orientationGuides.endSystolicRadialReference,
          x,
          y,
          {
            color: theme.systolicReference,
            width: 1.35,
            dash: [6, 4],
          },
        );
        drawPvCurveV3(
          context,
          orientationGuides.klotzInformedDiastolicReference,
          x,
          y,
          {
            color: theme.diastolicReference,
            width: 1.35,
            dash: [3, 4],
          },
        );
      }
      drawPvCurveV3(context, completedBeat, x, y, {
        color: trace.chamberColor,
        width: 1.5,
        dash: lineDash,
        // A completed beat remains quiet context throughout the next cycle,
        // including the single boundary-frame redraw.
        alpha: 0.28,
      });
      drawPvCurveV3(context, liveSegment, x, y, {
        color: trace.chamberColor,
        width: 2,
        dash: lineDash,
      });
      const head = liveSegment.at(-1);
      if (head !== undefined) {
        drawPvLeadingCapV3(
          context,
          x(head.volumeMl),
          y(head.pressureMmHg),
          trace.chamberColor,
        );
      }
    }

    if (renderedTraces.every(({ completedBeat, liveSegment }) =>
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
  }, [renderedTraces]);

  useResponsiveCanvasFrameV3(
    containerRef,
    canvasRef,
    draw,
  );

  const anyOrientationGuides = renderedTraces.some(({ orientationGuides }) =>
    orientationGuides !== null);
  const anyRequestedIntracavitaryGuides = renderedTraces.some(({ trace }) =>
    trace.pressureBasis === "intracavitary"
      && trace.showSingleBeatOrientationGuides === true);
  const guideStatus = anyOrientationGuides
    ? "End-systolic radial + Klotz-informed diastolic orientation references · not formal ESPVR/EDPVR relations"
    : anyRequestedIntracavitaryGuides
      ? "PV orientation references require transmural pressure"
      : null;
  const chamberAriaLabel = colorLegendItems.length === 0
    ? "Pressure-volume"
    : colorLegendItems.map(({ label }) => label).join(", ");

  return (
    <div
      ref={containerRef}
      className={`relative min-h-52 h-full w-full overflow-hidden ${className ?? ""}`}
      data-chart-kind="pressure-volume-loop-v3"
      data-cycle-source="model-emitted-cycle-phase"
      data-orientation-guide-semantics={
        anyOrientationGuides
          ? SINGLE_BEAT_PV_ORIENTATION_SEMANTICS_V3
          : "unavailable"
      }
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label={`${chamberAriaLabel} live pressure-volume loops from model-emitted cycles${
          guideStatus === null ? "" : `. ${guideStatus}`
        }`}
      />
      <WorkbenchChartTwoAxisLegendV3
        colorAxisLabel="Chamber"
        colorItems={colorLegendItems}
        scenarioItems={scenarioLegendItems}
      />
    </div>
  );
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
  systolicReference: string;
  diastolicReference: string;
}>;

function normalizedModelCyclePhaseV3(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return positiveModuloV3(value, 1);
}

function paddedPvDomainV3(
  values: readonly number[],
  includeZero: boolean,
): WorkbenchNumericDomainV3 {
  return observedNumericDomainV3(values, {
    includeZero,
    paddingFraction: 0.08,
  });
}

function sampleGuideCurveV3(
  startVolumeMl: number,
  endVolumeMl: number,
  pressureAtVolume: (volumeMl: number) => number,
  sampleCount: number,
): readonly WorkbenchPvGuidePointV3[] {
  const count = Math.max(2, Math.floor(sampleCount));
  const points = Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    const volumeMl = startVolumeMl
      + ratio * (endVolumeMl - startVolumeMl);
    return Object.freeze({
      volumeMl,
      pressureMmHg: pressureAtVolume(volumeMl),
    });
  });
  return Object.freeze(points);
}

function withExactContactV3(
  points: readonly WorkbenchPvGuidePointV3[],
  contact: WorkbenchPvGuidePointV3,
): readonly WorkbenchPvGuidePointV3[] {
  if (points.length === 0) return Object.freeze([contact]);
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  points.forEach(({ volumeMl }, index) => {
    const distance = Math.abs(volumeMl - contact.volumeMl);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });
  return Object.freeze(points.map((point, index) =>
    index === closestIndex ? contact : point));
}

function maximumByV3<T>(
  values: readonly T[],
  score: (value: T) => number,
): T | null {
  let best: T | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    const candidate = score(value);
    if (!Number.isFinite(candidate) || candidate <= bestScore) continue;
    best = value;
    bestScore = candidate;
  }
  return best;
}

function pvPlotRectV3(width: number, height: number): PvPlotRectV3 {
  const left = Math.min(58, width * 0.24);
  const top = Math.min(34, height * 0.22);
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
  theme: PvCanvasThemeV3,
): void {
  context.save();
  context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = theme.text;
  context.strokeStyle = theme.grid;
  context.lineWidth = 1;
  for (let ordinal = 0; ordinal <= 4; ordinal += 1) {
    const ratio = ordinal / 4;
    const x = plot.left + ratio * (plot.right - plot.left);
    const y = plot.bottom - ratio * (plot.bottom - plot.top);
    context.beginPath();
    context.moveTo(x, plot.top);
    context.lineTo(x, plot.bottom);
    context.stroke();
    context.beginPath();
    context.moveTo(plot.left, y);
    context.lineTo(plot.right, y);
    context.stroke();
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(
      formatPvAxisNumberV3(
        volumeDomain[0] + ratio * (volumeDomain[1] - volumeDomain[0]),
      ),
      x,
      plot.bottom + 7,
    );
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillText(
      formatPvAxisNumberV3(
        pressureDomain[0] + ratio * (pressureDomain[1] - pressureDomain[0]),
      ),
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
  context.fillText("Pressure (mmHg)", 0, 0);
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
): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  context.save();
  context.setLineDash([]);
  context.fillStyle = color;
  context.globalAlpha = 0.2;
  context.beginPath();
  context.arc(x, y, 4.25, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.globalAlpha = 0.72;
  context.beginPath();
  context.arc(x, y, 3.5, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function readPvCanvasThemeV3(element: HTMLElement | null): PvCanvasThemeV3 {
  if (element === null || typeof getComputedStyle !== "function") {
    return fallbackPvCanvasThemeV3();
  }
  const styles = getComputedStyle(element);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return Object.freeze({
    grid: read("--wb-border", "rgba(148, 163, 184, 0.18)"),
    axis: read("--wb-border-strong", "rgba(148, 163, 184, 0.48)"),
    text: read("--wb-text-muted", "#94a3b8"),
    systolicReference: "#e879f9",
    diastolicReference: "#67e8f9",
  });
}

function fallbackPvCanvasThemeV3(): PvCanvasThemeV3 {
  return Object.freeze({
    grid: "rgba(148, 163, 184, 0.18)",
    axis: "rgba(148, 163, 184, 0.48)",
    text: "#94a3b8",
    systolicReference: "#e879f9",
    diastolicReference: "#67e8f9",
  });
}

function formatPvAxisNumberV3(value: number): string {
  return Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
}

function clampV3(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
