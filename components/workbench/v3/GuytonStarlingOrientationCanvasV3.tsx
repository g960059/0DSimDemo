import React from "react";
import { LoaderCircle } from "lucide-react";

import type {
  MainWireIntegratedModelGuytonSideV3,
  MainWireIntegratedModelStructuralReturnOrientationV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import { mainWireIntegratedModelStarlingDescendingLimbV3 } from "@/engine/myocardium/MainWireIntegratedModelResponsiveStarlingProtocolV3";
import {
  scaleLinearV3,
  readWorkbenchCanvasThemeVariablesV3,
  useResponsiveCanvasFrameV3,
} from "./WorkbenchCanvasRuntimeV3";
import { workbenchHistoryAlphaV3 } from "./WorkbenchChartTraceStyleV3";

export type GuytonStarlingPlotDomainV3 = Readonly<{
  pressureMinimumMmHg: number;
  pressureMaximumMmHg: number;
  flowMinimumLPerMin: number;
  flowMaximumLPerMin: number;
}>;

export type GuytonStarlingAxisLabelsV3 = Readonly<{
  horizontal: string;
  vertical: string;
}>;

export function guytonStarlingAxisLabelsV3(
  side: MainWireIntegratedModelGuytonSideV3,
): GuytonStarlingAxisLabelsV3 {
  return Object.freeze({
    horizontal:
      side === "right"
        ? "CVP / mean RAP (mmHg)"
        : "Mean LAP (PCWP surrogate) (mmHg)",
    vertical: "CO / venous return (L/min)",
  });
}

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
    !plainRecordV3(candidate) ||
    candidate.side !== side ||
    candidate.semantics !==
      "frozen-accepted-step-volume-constrained-structural-orientation-not-simulated-response" ||
    candidate.pressureBasis !== "absolute" ||
    !finiteNumberV3(candidate.sourceAcceptedRevision) ||
    !finiteNumberV3(candidate.sourceAcceptedTimeSec) ||
    !finiteNumberV3(candidate.fillingPressureMmHg) ||
    !plainRecordV3(candidate.operatingPoint) ||
    !finiteNumberV3(candidate.operatingPoint.downstreamPressureMmHg) ||
    !finiteNumberV3(candidate.operatingPoint.returnFlowLPerMin) ||
    !validStructuralAnchoringV3(candidate.anchoring) ||
    !Array.isArray(candidate.curve) ||
    candidate.curve.length < 2 ||
    candidate.curve.some(
      (point) =>
        !plainRecordV3(point) ||
        !finiteNumberV3(point.downstreamPressureMmHg) ||
        !finiteNumberV3(point.returnFlowLPerMin) ||
        typeof point.flowLimited !== "boolean",
    ) ||
    !validStarlingLocusV3(candidate.starlingLocus)
  )
    return null;
  return candidate as unknown as MainWireIntegratedModelStructuralReturnOrientationV3;
}

export function guytonStarlingPlotDomainV3(
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3,
  _historyOrientations: readonly MainWireIntegratedModelStructuralReturnOrientationV3[] = [],
): GuytonStarlingPlotDomainV3 {
  const starling =
    orientation.starlingLocus.status === "requires-protocol"
      ? []
      : orientation.starlingLocus.points
          .filter((point) => !("curveEligible" in point) || point.curveEligible)
          .map((point) => ({
            pressureMmHg: point.fillingPressureMmHg,
            flowLPerMin: point.cardiacOutputLPerMin,
          }));
  const anchors = [
    {
      pressureMmHg: orientation.operatingPoint.downstreamPressureMmHg,
      flowLPerMin: orientation.operatingPoint.returnFlowLPerMin,
    },
    {
      pressureMmHg: orientation.fillingPressureMmHg,
      flowLPerMin: 0,
    },
  ];
  const structuralReturn = orientation.curve.map((point) => ({
    pressureMmHg: point.downstreamPressureMmHg,
    flowLPerMin: point.returnFlowLPerMin,
  }));
  const visibleCandidates =
    starling.length === 0
      ? [...structuralReturn, ...anchors]
      : [...starling, ...anchors];
  const minimumPressure = Math.min(
    ...visibleCandidates
      .map(({ pressureMmHg }) => pressureMmHg)
      .filter(Number.isFinite),
  );
  const flows = visibleCandidates
    .map(({ flowLPerMin }) => flowLPerMin)
    .filter(Number.isFinite);
  const maximumPressure = guytonZeroFlowPresentationMaximumV3(orientation);
  const maximumFlow = Math.max(1, ...flows);
  const pressureSpan = Math.max(4, maximumPressure - minimumPressure);
  const pressurePaddingMmHg = Math.max(1, pressureSpan * 0.06);
  const clinicalMinimumMmHg = orientation.side === "right" ? -3 : -2;
  return Object.freeze({
    pressureMinimumMmHg:
      starling.length === 0
        ? minimumPressure - pressurePaddingMmHg
        : Math.min(
            clinicalMinimumMmHg,
            minimumPressure - pressurePaddingMmHg,
          ),
    // The Pmsf/Pmpf orientation is the exact zero-return pressure in this
    // frozen structural map. Ten percent of headroom keeps that meaningful
    // endpoint visible without allowing unfinished high-TBV Starling samples
    // to push the operating intersection into the left edge of the chart.
    pressureMaximumMmHg: maximumPressure,
    flowMinimumLPerMin: 0,
    // Extreme frozen-ledger Guyton plateaus are intentionally clipped. Once a
    // Starling locus exists, its measured outputs and operating intersection
    // own the vertical viewport rather than a structurally flow-limited tail.
    flowMaximumLPerMin: niceHalfUnitCeilingV3(maximumFlow * 1.22),
  });
}

/**
 * Stable right-hand presentation boundary for the Guyton / Starling view.
 * `fillingPressureMmHg` is the model's exact uniform filling pressure and thus
 * the zero-flow intercept of the structural venous-return orientation.
 */
export function guytonZeroFlowPresentationMaximumV3(
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3,
): number {
  const zeroFlowPressureMmHg = orientation.fillingPressureMmHg;
  const headroomMmHg = Math.max(0.5, Math.abs(zeroFlowPressureMmHg) * 0.1);
  return Math.max(
    zeroFlowPressureMmHg + headroomMmHg,
    orientation.operatingPoint.downstreamPressureMmHg + 0.5,
  );
}

export type StarlingPresentationFocusV3 = Readonly<{
  peakPressureMmHg: number;
  firstDecliningPressureMmHg: number;
  confirmedDecliningPressureMmHg: number;
  pressureMaximumMmHg: number;
}>;

/**
 * Finds a sustained descending limb without allowing one noisy plateau point
 * to own the viewport. The absolute high-volume samples remain in the payload;
 * this result controls presentation focus only.
 */
export function starlingPresentationFocusV3(
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3,
): StarlingPresentationFocusV3 | null {
  if (orientation.starlingLocus.status === "requires-protocol") return null;
  const descendingLimb = mainWireIntegratedModelStarlingDescendingLimbV3(
    orientation.starlingLocus.points.map((point) =>
      Object.freeze({
        cardiacOutputLPerMin: point.cardiacOutputLPerMin,
        curveEligible: !("curveEligible" in point) || point.curveEligible,
        fillingPressureMmHg: point.fillingPressureMmHg,
      }),
    ),
  );
  if (descendingLimb === null) return null;
  const pressureMarginMmHg = Math.max(
    1,
    0.2 *
      Math.max(
        Math.abs(descendingLimb.firstDecliningPressureMmHg),
        Math.abs(
          descendingLimb.firstDecliningPressureMmHg -
            orientation.operatingPoint.downstreamPressureMmHg,
        ),
      ),
  );
  return Object.freeze({
    ...descendingLimb,
    // The confirmation sample remains in the raw locus but does not expand
    // the default viewport. Show the first sustained decline and roughly 20%
    // more pressure so the overload turn is legible without letting a coarse
    // confirmatory high-volume point dominate the chart.
    pressureMaximumMmHg:
      descendingLimb.firstDecliningPressureMmHg + pressureMarginMmHg,
  });
}

function niceHalfUnitCeilingV3(value: number): number {
  return Math.max(1, Math.ceil(value * 2) / 2);
}

export type GuytonStarlingComparisonTraceV3 = Readonly<{
  scenarioId: string;
  scenarioLabel: string;
  color: string;
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3;
  orientationAlpha?: number;
  pending?: boolean;
  historyOrientations?: readonly MainWireIntegratedModelStructuralReturnOrientationV3[];
}>;

export function guytonStarlingComparisonPlotDomainV3(
  traces: readonly GuytonStarlingComparisonTraceV3[],
): GuytonStarlingPlotDomainV3 {
  if (traces.length === 0) {
    throw new Error("Guyton / Starling comparison requires one Scenario");
  }
  const side = traces[0]!.orientation.side;
  if (traces.some(({ orientation }) => orientation.side !== side)) {
    throw new Error(
      "Guyton / Starling comparison cannot mix circulation sides",
    );
  }
  // Historical traces are clipped into the current comparison viewport. A
  // prior extreme parameter state must never make today's curves unreadable.
  const domains = traces.map(({ orientation }) =>
    guytonStarlingPlotDomainV3(orientation),
  );
  return Object.freeze({
    pressureMinimumMmHg: Math.min(
      ...domains.map((domain) => domain.pressureMinimumMmHg),
    ),
    pressureMaximumMmHg: Math.max(
      ...domains.map((domain) => domain.pressureMaximumMmHg),
    ),
    flowMinimumLPerMin: Math.min(
      ...domains.map((domain) => domain.flowMinimumLPerMin),
    ),
    flowMaximumLPerMin: Math.max(
      ...domains.map((domain) => domain.flowMaximumLPerMin),
    ),
  });
}

export function GuytonStarlingOrientationCanvasV3({
  color = "#167db8",
  orientation,
  historyOrientations = [],
  scenarioLabel = "Scenario",
  className,
}: Readonly<{
  color?: string;
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3;
  historyOrientations?: readonly MainWireIntegratedModelStructuralReturnOrientationV3[];
  scenarioLabel?: string;
  className?: string;
}>) {
  return (
    <GuytonStarlingComparisonCanvasV3
      className={className}
      traces={Object.freeze([
        Object.freeze({
          scenarioId: "scenario",
          scenarioLabel,
          color,
          orientation,
          historyOrientations,
        }),
      ])}
    />
  );
}

export function GuytonStarlingComparisonCanvasV3({
  traces,
  className,
  recalculatingLabel = "Recalculating Guyton / Starling",
}: Readonly<{
  traces: readonly GuytonStarlingComparisonTraceV3[];
  className?: string;
  recalculatingLabel?: string;
}>) {
  if (traces.length === 0) {
    throw new Error("Guyton / Starling comparison requires one Scenario");
  }
  const firstTrace = traces[0]!;
  const side = firstTrace.orientation.side;
  if (traces.some(({ orientation }) => orientation.side !== side)) {
    throw new Error(
      "Guyton / Starling comparison cannot mix circulation sides",
    );
  }
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const domain = React.useMemo(
    () => guytonStarlingComparisonPlotDomainV3(traces),
    [traces],
  );
  const draw = React.useCallback(
    (context: CanvasRenderingContext2D, width: number, height: number) => {
      const plot = plotRectV3(width, height);
      const theme = readThemeV3(containerRef.current);
      const x = (pressureMmHg: number) =>
        scaleLinearV3(
          pressureMmHg,
          domain.pressureMinimumMmHg,
          domain.pressureMaximumMmHg,
          plot.left,
          plot.right,
        );
      const y = (flowLPerMin: number) =>
        scaleLinearV3(
          flowLPerMin,
          domain.flowMinimumLPerMin,
          domain.flowMaximumLPerMin,
          plot.bottom,
          plot.top,
        );
      drawAxesV3(
        context,
        plot,
        domain,
        theme,
        guytonStarlingAxisLabelsV3(side),
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
      traces.forEach(({ color, historyOrientations = [] }) => {
        historyOrientations.forEach((historical, historyIndex) => {
          drawOrientationV3(
            context,
            historical,
            x,
            y,
            plot,
            color,
            theme.background,
            guytonHistoryAlphaV3(historyIndex, historyOrientations.length),
            2.5,
          );
        });
      });
      traces.forEach(({ color, orientation, orientationAlpha = 1 }) => {
        drawOrientationV3(
          context,
          orientation,
          x,
          y,
          plot,
          color,
          theme.background,
          orientationAlpha,
          3,
        );
      });
      context.restore();
    },
    [domain, side, traces],
  );
  useResponsiveCanvasFrameV3(
    containerRef,
    canvasRef,
    draw,
    "guyton-starling",
  );

  const sideLabel =
    side === "right" ? "Systemic venous return" : "Pulmonary venous return";
  const singleProgress =
    traces.length === 1 ? starlingProgressV3(firstTrace.orientation) : null;
  const pendingTraces = traces.filter(({ pending }) => pending === true);
  return (
    <div
      ref={containerRef}
      className={`relative min-h-56 h-full w-full overflow-hidden ${className ?? ""}`}
      data-chart-kind="guyton-starling-structural-orientation-v3"
      data-circulation-side={side}
      data-structural-semantics={firstTrace.orientation.semantics}
      data-scenario-count={traces.length}
      data-history-count={traces.reduce(
        (total, trace) => total + (trace.historyOrientations?.length ?? 0),
        0,
      )}
      data-starling-status={singleProgress?.status}
      data-starling-completed-points={singleProgress?.completed}
      data-starling-total-points={singleProgress?.total}
      data-starling-boundary-point-count={singleProgress?.boundary}
      data-starling-hypovolemic-point-count={singleProgress?.hypovolemic}
      data-starling-hypervolemic-point-count={singleProgress?.hypervolemic}
      data-pending-scenario-count={pendingTraces.length}
      data-pressure-minimum-mmhg={domain.pressureMinimumMmHg}
      data-pressure-maximum-mmhg={domain.pressureMaximumMmHg}
      data-flow-minimum-l-per-min={domain.flowMinimumLPerMin}
      data-flow-maximum-l-per-min={domain.flowMaximumLPerMin}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label={`${sideLabel}; ${traces.length} Scenario comparison`}
      />
      {traces.length > 1 && (
        <div
          className="pointer-events-none absolute left-12 top-2 flex max-w-[calc(100%-4rem)] flex-wrap gap-x-3 gap-y-1 text-[10px] text-wb-muted"
          data-chart-legend="scenario-only"
        >
          {traces.map((trace) => (
            <span
              key={trace.scenarioId}
              className="inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: trace.color }}
              />
              {trace.scenarioLabel}
              {trace.pending === true && (
                <span
                  className="pointer-events-auto inline-flex text-wb-accent"
                  data-scenario-analysis-pending="true"
                  role="status"
                  title={recalculationAccessibleLabelV3(
                    trace,
                    recalculatingLabel,
                  )}
                >
                  <LoaderCircle
                    className="h-3 w-3 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span className="sr-only">
                    {recalculationAccessibleLabelV3(trace, recalculatingLabel)}
                  </span>
                </span>
              )}
            </span>
          ))}
        </div>
      )}
      {traces.length === 1 && firstTrace.pending === true && (
        <span
          className="pointer-events-auto absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center text-wb-accent"
          data-scenario-analysis-pending="true"
          role="status"
          title={recalculationAccessibleLabelV3(firstTrace, recalculatingLabel)}
        >
          <LoaderCircle
            className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="sr-only">
            {recalculationAccessibleLabelV3(firstTrace, recalculatingLabel)}
          </span>
        </span>
      )}
      <div className="sr-only">
        {traces.map((trace) => (
          <span
            key={trace.scenarioId}
            data-starling-scenario-id={trace.scenarioId}
            data-starling-history-count={trace.historyOrientations?.length ?? 0}
            data-starling-pending={trace.pending === true ? "true" : "false"}
          >
            {trace.scenarioLabel}: {starlingStatusTextV3(trace.orientation)}
          </span>
        ))}
      </div>
    </div>
  );
}

function recalculationAccessibleLabelV3(
  trace: GuytonStarlingComparisonTraceV3,
  recalculatingLabel: string,
): string {
  const progress = starlingProgressV3(trace.orientation);
  return progress.completed === undefined
    ? `${recalculatingLabel}: ${trace.scenarioLabel}`
    : `${recalculatingLabel}: ${trace.scenarioLabel}, ${progress.completed} points`;
}

function drawOrientationV3(
  context: CanvasRenderingContext2D,
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3,
  x: (value: number) => number,
  y: (value: number) => number,
  plot: PlotRectV3,
  color: string,
  pointBorderColor: string,
  alpha: number,
  pointRadius: number,
): void {
  drawCurveV3(
    context,
    orientation.curve.map((point) => ({
      pressureMmHg: point.downstreamPressureMmHg,
      flowLPerMin: point.returnFlowLPerMin,
    })),
    x,
    y,
    color,
    [],
    alpha,
  );
  if (orientation.starlingLocus.status !== "requires-protocol") {
    drawCurveV3(
      context,
      starlingCurvePointsV3(orientation.starlingLocus.points),
      x,
      y,
      color,
      [],
      alpha,
    );
    orientation.starlingLocus.points.forEach((point) => {
      if ("curveEligible" in point && !point.curveEligible) {
        drawHollowPointV3(
          context,
          x(point.fillingPressureMmHg),
          y(point.cardiacOutputLPerMin),
          color,
          alpha,
          pointRadius,
        );
      } else {
        drawPointV3(
          context,
          x(point.fillingPressureMmHg),
          y(point.cardiacOutputLPerMin),
          color,
          pointBorderColor,
          alpha,
          pointRadius,
        );
      }
    });
  }
  drawPointV3(
    context,
    x(orientation.operatingPoint.downstreamPressureMmHg),
    y(orientation.operatingPoint.returnFlowLPerMin),
    color,
    pointBorderColor,
    alpha,
  );
  drawFillingPressureMarkerV3(
    context,
    x(orientation.fillingPressureMmHg),
    plot,
    color,
    alpha * 0.35,
  );
}

function guytonHistoryAlphaV3(
  historyIndex: number,
  historyCount: number,
): number {
  return Math.min(
    0.36,
    workbenchHistoryAlphaV3(historyIndex, historyCount) * 1.7,
  );
}

function starlingProgressV3(
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3,
): Readonly<{
  status: string;
  completed?: number;
  total?: number;
  boundary: number;
  hypovolemic: number;
  hypervolemic: number;
}> {
  const locus = orientation.starlingLocus;
  if (
    locus.status !== "responsive-fixed-tbv-preview" &&
    locus.status !== "measured-fixed-tbv-protocol"
  ) {
    return Object.freeze({
      status: locus.status,
      boundary: 0,
      hypovolemic: 0,
      hypervolemic: 0,
    });
  }
  const anchor = locus.points.find(({ role }) => role === "operating-anchor");
  return Object.freeze({
    status: locus.status,
    completed: locus.completedPointCount,
    total: locus.totalPointCount,
    boundary: locus.points.filter(({ curveEligible }) => !curveEligible).length,
    hypovolemic:
      anchor === undefined
        ? 0
        : locus.points.filter(
            (point) => point.totalBloodVolumeMl < anchor.totalBloodVolumeMl,
          ).length,
    hypervolemic:
      anchor === undefined
        ? 0
        : locus.points.filter(
            (point) => point.totalBloodVolumeMl > anchor.totalBloodVolumeMl,
          ).length,
  });
}

function starlingStatusTextV3(
  orientation: MainWireIntegratedModelStructuralReturnOrientationV3,
): string {
  const locus = orientation.starlingLocus;
  if (locus.status === "measured-fixed-tbv-protocol") {
    return `Shared settled fixed-tone TBV family, ${locus.completedPointCount}/${locus.totalPointCount} points; its adaptive low-volume core owns PVA`;
  }
  if (locus.status === "responsive-fixed-tbv-preview") {
    return `Responsive fixed-TBV Starling preview, ${locus.completedPointCount}/${locus.totalPointCount} points; the center is locally period-1 settled and off-centre points remain preview data`;
  }
  return "Starling locus not shown; exact fixed-TBV fork protocol required";
}

type PlotPointV3 = Readonly<{
  pressureMmHg: number;
  flowLPerMin: number;
}>;

type StarlingRenderablePointV3 = Readonly<{
  fillingPressureMmHg: number;
  cardiacOutputLPerMin: number;
  curveEligible?: boolean;
}>;

/**
 * Shape-preserving PCHIP through measured points only. It never extrapolates,
 * never connects a rejected boundary point, and preserves local extrema when
 * the model response is not monotone.
 */
export function starlingCurvePointsV3(
  points: readonly StarlingRenderablePointV3[],
): readonly PlotPointV3[] {
  const ordered = points
    .filter(
      (point) =>
        point.curveEligible !== false &&
        Number.isFinite(point.fillingPressureMmHg) &&
        Number.isFinite(point.cardiacOutputLPerMin),
    )
    .map((point) => ({
      pressureMmHg: point.fillingPressureMmHg,
      flowLPerMin: point.cardiacOutputLPerMin,
    }))
    .sort((left, right) => left.pressureMmHg - right.pressureMmHg);
  const unique: PlotPointV3[] = [];
  for (const point of ordered) {
    const previous = unique.at(-1);
    if (
      previous !== undefined &&
      Math.abs(previous.pressureMmHg - point.pressureMmHg) < 1e-9
    ) {
      unique[unique.length - 1] = Object.freeze({
        pressureMmHg: 0.5 * (previous.pressureMmHg + point.pressureMmHg),
        flowLPerMin: 0.5 * (previous.flowLPerMin + point.flowLPerMin),
      });
    } else unique.push(Object.freeze(point));
  }
  if (unique.length < 3) return Object.freeze(unique);

  const interval = unique
    .slice(0, -1)
    .map(
      (point, index) => unique[index + 1]!.pressureMmHg - point.pressureMmHg,
    );
  const secant = interval.map(
    (width, index) =>
      (unique[index + 1]!.flowLPerMin - unique[index]!.flowLPerMin) / width,
  );
  const slopes = Array.from({ length: unique.length }, () => 0);
  slopes[0] = pchipEndpointSlopeV3(
    interval[0]!,
    interval[1]!,
    secant[0]!,
    secant[1]!,
  );
  slopes[slopes.length - 1] = pchipEndpointSlopeV3(
    interval.at(-1)!,
    interval.at(-2)!,
    secant.at(-1)!,
    secant.at(-2)!,
  );
  for (let index = 1; index < unique.length - 1; index += 1) {
    const previousSecant = secant[index - 1]!;
    const nextSecant = secant[index]!;
    if (
      previousSecant === 0 ||
      nextSecant === 0 ||
      Math.sign(previousSecant) !== Math.sign(nextSecant)
    ) {
      slopes[index] = 0;
      continue;
    }
    const previousWidth = interval[index - 1]!;
    const nextWidth = interval[index]!;
    const firstWeight = 2 * nextWidth + previousWidth;
    const secondWeight = nextWidth + 2 * previousWidth;
    slopes[index] =
      (firstWeight + secondWeight) /
      (firstWeight / previousSecant + secondWeight / nextSecant);
  }

  const sampled: PlotPointV3[] = [];
  for (let index = 0; index < unique.length - 1; index += 1) {
    const left = unique[index]!;
    const right = unique[index + 1]!;
    const width = interval[index]!;
    const sampleCount = Math.max(4, Math.min(18, Math.ceil(width * 3)));
    for (let ordinal = 0; ordinal < sampleCount; ordinal += 1) {
      if (index > 0 && ordinal === 0) continue;
      const ratio = ordinal / (sampleCount - 1);
      const ratio2 = ratio * ratio;
      const ratio3 = ratio2 * ratio;
      sampled.push(
        Object.freeze({
          pressureMmHg: left.pressureMmHg + ratio * width,
          flowLPerMin:
            (2 * ratio3 - 3 * ratio2 + 1) * left.flowLPerMin +
            (ratio3 - 2 * ratio2 + ratio) * width * slopes[index]! +
            (-2 * ratio3 + 3 * ratio2) * right.flowLPerMin +
            (ratio3 - ratio2) * width * slopes[index + 1]!,
        }),
      );
    }
  }
  return Object.freeze(sampled);
}

function pchipEndpointSlopeV3(
  firstWidth: number,
  secondWidth: number,
  firstSecant: number,
  secondSecant: number,
): number {
  let slope =
    ((2 * firstWidth + secondWidth) * firstSecant - firstWidth * secondSecant) /
    (firstWidth + secondWidth);
  if (Math.sign(slope) !== Math.sign(firstSecant)) return 0;
  if (
    Math.sign(firstSecant) !== Math.sign(secondSecant) &&
    Math.abs(slope) > Math.abs(3 * firstSecant)
  )
    slope = 3 * firstSecant;
  return slope;
}

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
  background: string;
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
  labels: GuytonStarlingAxisLabelsV3,
): void {
  context.save();
  context.lineWidth = 1;
  context.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.textBaseline = "middle";
  for (let index = 0; index <= 4; index += 1) {
    const ratio = index / 4;
    const x = plot.left + ratio * (plot.right - plot.left);
    const pressure =
      domain.pressureMinimumMmHg +
      ratio * (domain.pressureMaximumMmHg - domain.pressureMinimumMmHg);
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
    const flow =
      domain.flowMinimumLPerMin +
      ratio * (domain.flowMaximumLPerMin - domain.flowMinimumLPerMin);
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
    labels.horizontal,
    (plot.left + plot.right) / 2,
    plot.bottom + 23,
  );
  context.save();
  context.translate(10, (plot.top + plot.bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(labels.vertical, 0, 0);
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
  alpha = 1,
): void {
  const finite = points.filter(
    (point) =>
      Number.isFinite(point.pressureMmHg) && Number.isFinite(point.flowLPerMin),
  );
  if (finite.length < 2) return;
  context.save();
  context.globalAlpha = alpha;
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
  borderColor: string,
  alpha = 1,
  radius = 4,
): void {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  // The opaque canvas-colored ring keeps adjacent beat points distinct in
  // both themes and prevents the connecting curve from showing through them.
  context.globalAlpha = 1;
  context.strokeStyle = borderColor;
  context.lineWidth = 1.5;
  context.stroke();
  context.restore();
}

function drawHollowPointV3(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  alpha = 1,
  radius = 4,
): void {
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawFillingPressureMarkerV3(
  context: CanvasRenderingContext2D,
  x: number,
  plot: PlotRectV3,
  color: string,
  alpha = 1,
): void {
  context.save();
  context.globalAlpha = alpha;
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
  const [grid, axis, text, background] = readWorkbenchCanvasThemeVariablesV3(element, [
    ["--wb-grid", "rgba(165, 185, 200, 0.10)"],
    ["--wb-axis", "rgba(165, 185, 200, 0.32)"],
    ["--wb-muted", "rgba(203, 213, 225, 0.72)"],
    ["--wb-zone-main-bg", "#0a141d"],
  ]);
  return Object.freeze({
    grid: grid!,
    axis: axis!,
    text: text!,
    background: background!,
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

function validStructuralAnchoringV3(value: unknown): boolean {
  if (
    !plainRecordV3(value) ||
    !finiteNumberV3(value.downstreamPressureOffsetMmHg)
  )
    return false;
  if (value.status === "accepted-step-readback") {
    return (
      value.method === "none" &&
      value.downstreamPressureOffsetMmHg === 0 &&
      value.volumeResidualMl === null
    );
  }
  return (
    value.status === "starling-operating-anchor" &&
    value.method === "downstream-pressure-translation" &&
    finiteNumberV3(value.volumeResidualMl)
  );
}

function validStarlingLocusV3(value: unknown): boolean {
  if (!plainRecordV3(value) || !Array.isArray(value.points)) return false;
  if (value.status === "requires-protocol") return value.points.length === 0;
  if (value.status === "responsive-fixed-tbv-preview") {
    if (
      !Number.isSafeInteger(value.completedPointCount) ||
      !Number.isSafeInteger(value.totalPointCount) ||
      (value.completedPointCount as number) < 1 ||
      value.completedPointCount !== value.points.length ||
      (value.totalPointCount as number) <
        (value.completedPointCount as number) ||
      !finiteNumberV3(value.measurementDurationSec) ||
      !Number.isSafeInteger(value.minimumBeatCount) ||
      !Number.isSafeInteger(value.maximumBeatCount) ||
      value.slowControllerPolicy !== "coronary-tone-frozen-at-branch-source"
    )
      return false;
  } else if (value.status === "measured-fixed-tbv-protocol") {
    if (
      !Number.isSafeInteger(value.completedPointCount) ||
      !Number.isSafeInteger(value.totalPointCount) ||
      value.completedPointCount !== value.points.length ||
      (value.totalPointCount as number) <
        (value.completedPointCount as number) ||
      !Number.isSafeInteger(value.minimumBeatCount) ||
      !Number.isSafeInteger(value.maximumBeatCount) ||
      value.slowControllerPolicy !==
        "active-source-period1-then-coronary-tone-frozen" ||
      value.convergencePolicy !==
        "complete-beat-output-period1-closure"
    ) return false;
  } else return false;
  const minimumPointCount =
    value.status === "responsive-fixed-tbv-preview" ? 1 : 2;
  return value.points.length >= minimumPointCount && value.points.every(
    (point) => {
      if (!plainRecordV3(point)) return false;
      const commonValid =
        finiteNumberV3(point.totalBloodVolumeMl) &&
        finiteNumberV3(point.fillingPressureMmHg) &&
        finiteNumberV3(point.cardiacOutputLPerMin) &&
        typeof point.settled === "boolean" &&
        point.finiteAndFixedTbvPassed === true &&
        (point.evidence === "responsive-preview" ||
          point.evidence === "responsive-settled-anchor" ||
          point.evidence === "qualified-periodic" ||
          point.evidence === "fixed-tone-periodic") &&
        (point.role === "operating-anchor" ||
          point.role === "continuation") &&
        (point.quality === "locally-converged" ||
          point.quality === "adaptive-preview" ||
          point.quality === "convergence-cap" ||
          point.quality === "period-2-boundary") &&
        typeof point.curveEligible === "boolean" &&
        Number.isSafeInteger(point.completedBeatCount) &&
        (point.completedBeatCount as number) >= 3 &&
        finiteNumberV3(point.maximumNormalizedBeatDelta) &&
        (point.measurementWindowStatus === "complete-beat-converged" ||
          point.measurementWindowStatus === "complete-beat-preview" ||
          point.measurementWindowStatus === "complete-beat-cap" ||
          point.measurementWindowStatus === "period-2-detected" ||
          point.measurementWindowStatus === "responsive-period1-settled" ||
          point.measurementWindowStatus === "canonical-period1-qualified" ||
          point.measurementWindowStatus === "fixed-tone-period1-settled") &&
        finiteNumberV3(point.acceptedMeasurementDurationSec) &&
        (point.acceptedMeasurementDurationSec as number) > 0 &&
        validPressureVolumeLoopV3(point.ventricularPressureVolumeLoop) &&
        validPressureVolumeLandmarksV3(
          point.ventricularPressureVolumeLandmarks,
        );
      if (!commonValid) return false;
      if (value.status === "responsive-fixed-tbv-preview") {
        return (point.acceptedMeasurementDurationSec as number) <=
          (value.measurementDurationSec as number) + 1e-9;
      }
      return point.quality === "locally-converged" &&
        point.curveEligible === true &&
        point.settled === true &&
        point.evidence === "fixed-tone-periodic" &&
        point.measurementWindowStatus === "fixed-tone-period1-settled";
    },
  );
}

function validPressureVolumeLoopV3(value: unknown): boolean {
  return Array.isArray(value) && value.length >= 12 && value.every((point) =>
    plainRecordV3(point) &&
    finiteNumberV3(point.volumeMl) &&
    finiteNumberV3(point.pressureMmHg));
}

function validPressureVolumeLandmarksV3(value: unknown): boolean {
  if (
    !plainRecordV3(value)
    || value.pressureBasis !== "transmural"
    || !plainRecordV3(value.endDiastolic)
    || !plainRecordV3(value.endSystolic)
  ) return false;
  return value.endDiastolic.event === "maximum-volume"
    && finiteNumberV3(value.endDiastolic.volumeMl)
    && finiteNumberV3(value.endDiastolic.pressureMmHg)
    && (
      value.endSystolic.event === "semilunar-valve-closure"
      || value.endSystolic.event === "minimum-volume-fallback"
    )
    && finiteNumberV3(value.endSystolic.volumeMl)
    && finiteNumberV3(value.endSystolic.pressureMmHg);
}
