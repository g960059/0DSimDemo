import type {
  MainWireNormalAdultFiveWallCycleDiagnosticsV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV2";
import type {
  MainWireNormalAdultFiveWallCyclePhaseV1,
  MainWireNormalAdultFiveWallCycleWallIdV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV3,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV3";
import {
  resolveMainWireNormalAdultFiveWallSelectedCycleContextV2,
  type MainWireNormalAdultFiveWallSelectedCycleEventV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallSelectedCycleContextV2";
import type {
  MainWireFiveWallPeriodicClosureGroupReportV1,
  MainWireFiveWallPeriodicClosureGroupV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2,
  type MainWireNormalAdultFiveWallPeriodicSummaryV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV2";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_V2_ID =
  "main-wire-normal-adult-five-wall-periodic-review-v2" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V2 =
  Object.freeze({
    source: "periodic-runner-retained-accepted-intervals" as const,
    selectedCycle: "last-retained-complete-beat" as const,
    waveformHorizontalCoordinate:
      "(accepted-endpoint-time-cycle-start)/accepted-cycle-duration" as const,
    timeSeriesSmoothingApplied: false as const,
    timeSeriesResamplingOrInterpolationApplied: false as const,
    piecewiseLinearPlotSegmentsApplied: true as const,
    plottedSegments:
      "straight-from-real-predecessor-when-available-then-between-consecutive-accepted-endpoints" as const,
    artificialLastEndpointToFirstEndpointSegmentAdded: false as const,
    phasePathsUseRealPredecessorBoundary: true as const,
    acceptedInternalEventsShownAtExactTime: true as const,
    internalEventStateInterpolationApplied: false as const,
    rawEndpointPlotsAvailableWithoutPredecessor: true as const,
    phaseWorkAndMorphologyRequireRealPredecessor: true as const,
    addsDynamicState: false as const,
    changesPhysiologyOrMaterialParameters: false as const,
    parameterSearchOrTuning: false as const,
    physiologyGateAdded: false as const,
    morphologyInterpretationRequiresPeriod1Convergence: true as const,
    timeStepRobustnessAssessedBySingleReview: false as const,
    currentModelCoreRuntimeAdoptionClaimed: false as const,
    pulmonaryVenousSignal:
      "aggregate-PVein-to-LA-edge-not-separate-vein-measurements" as const,
  });

const CLOSURE_GROUP_ORDER_V2 = Object.freeze([
  "circulation-node-volume",
  "dynamic-edge-flow",
  "valve-opening",
  "triseg-coordinate",
  "land-state",
  "sls-viscous-strain",
  "wall-input-history",
  "calcium-event-state",
] as const satisfies readonly MainWireFiveWallPeriodicClosureGroupV1[]);

type ChamberId = "LA" | "LV";
type PhaseRecord<T> = Readonly<Record<
  MainWireNormalAdultFiveWallCyclePhaseV1,
  T
>>;

export type MainWireNormalAdultFiveWallAcceptedEndpointPlotPointV2 = Readonly<{
  sampleIndex: number;
  timeSec: number;
  phase01: number;
  acceptedDurationSec: number;
  chamberVolumeMl: Readonly<{ LA: number; LV: number }>;
  pressureMmHg: Readonly<{ LA: number; LV: number; Ao: number }>;
  flowMlPerSec: Readonly<{
    MV: number;
    AoV: number;
    TV: number;
    PV: number;
    PVein_LA: number;
  }>;
  freeCalciumUM: Readonly<{ LA: number; RA: number }>;
}>;

export type MainWireNormalAdultFiveWallPrecedingBoundaryPlotPointV2 = Readonly<
  Omit<
    MainWireNormalAdultFiveWallAcceptedEndpointPlotPointV2,
    "sampleIndex" | "acceptedDurationSec"
  > & {
    sampleIndex: null;
    acceptedDurationSec: null;
  }
>;

export type MainWireNormalAdultFiveWallExactEventPlotMarkerV2 = Readonly<{
  eventId: string;
  timeSec: number;
  phase01: number;
  ownerAcceptedIntervalIndex: number;
  ownerAcceptedEndpointPhase01: number;
  strengthByWall: Readonly<Record<
    MainWireNormalAdultFiveWallCycleWallIdV1,
    number
  >>;
  activeWalls: readonly MainWireNormalAdultFiveWallCycleWallIdV1[];
  source: "accepted-calcium-trial";
}>;

export type MainWireNormalAdultFiveWallPvPlotPointV2 = Readonly<{
  source: "real-predecessor" | "accepted-endpoint";
  sampleIndex: number | null;
  timeSec: number;
  phase01: number;
  volumeMl: number;
  pressureMmHg: number;
}>;

export type MainWireNormalAdultFiveWallPhasePvPathsV2 = PhaseRecord<
  readonly (readonly MainWireNormalAdultFiveWallPvPlotPointV2[])[]
>;

type PvPathSetV2 = Readonly<Record<ChamberId, Readonly<{
  chamber: ChamberId;
  points: readonly MainWireNormalAdultFiveWallPvPlotPointV2[];
  drawableRealSegmentCount: number;
  missingFirstIntervalSegment: boolean;
  artificialClosingSegmentAdded: false;
  phasePaths: MainWireNormalAdultFiveWallPhasePvPathsV2 | null;
}>>>;

type ReviewConvergenceV2 = Readonly<{
  policyTolerance: number;
  groupOrder: readonly MainWireFiveWallPeriodicClosureGroupV1[];
  calciumEventStateIncluded: true;
  beatHistory: readonly Readonly<{
    beatIndex: number;
    period1MaximumNormalizedDeltaByGroup: Readonly<Partial<Record<
      MainWireFiveWallPeriodicClosureGroupV1,
      number
    >>>;
    period2OverallMaximumNormalizedDelta: number | null;
  }>[];
  latestGroupReports:
    readonly MainWireFiveWallPeriodicClosureGroupReportV1[];
}>;

type ReviewCommonV2 = Readonly<{
  reviewId: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_V2_ID;
  generatedFromExperimentId: string;
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV2;
  acceptedTimebase: Readonly<{
    startTimeSec: number;
    endTimeSec: number;
    durationSec: number;
    nominalGridCount: number;
    acceptedIntervalCount: number;
    minimumAcceptedDtSec: number;
    maximumAcceptedDtSec: number;
    precedingBoundary:
      MainWireNormalAdultFiveWallPrecedingBoundaryPlotPointV2 | null;
    endpoints: readonly MainWireNormalAdultFiveWallAcceptedEndpointPlotPointV2[];
    exactEvents: readonly MainWireNormalAdultFiveWallExactEventPlotMarkerV2[];
  }>;
  convergence: ReviewConvergenceV2;
  claim: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V2;
}>;

export type MainWireNormalAdultFiveWallPeriodicReviewUnavailableV2 = Readonly<
  ReviewCommonV2 & {
    status: "not-measurable";
    reason: "missing-preceding-diagnostic";
    boundary: Readonly<{
      status: "accepted-endpoints-only";
      detail: "cold-start";
    }>;
    cycleDiagnostics: null;
    pvPaths: PvPathSetV2;
  }
>;

export type MainWireNormalAdultFiveWallPeriodicReviewCompleteV2 = Readonly<
  ReviewCommonV2 & {
    status: "complete";
    reason: "real-predecessor-and-accepted-endpoints";
    boundary: Readonly<{
      status: "real-predecessor-available";
      precedingTimeSec: number;
      acceptedIntervalSegmentCount: number;
    }>;
    cycleDiagnostics: MainWireNormalAdultFiveWallCycleDiagnosticsV2;
    pvPaths: PvPathSetV2;
  }
>;

export type MainWireNormalAdultFiveWallPeriodicReviewV2 =
  | MainWireNormalAdultFiveWallPeriodicReviewUnavailableV2
  | MainWireNormalAdultFiveWallPeriodicReviewCompleteV2;

export type MainWireNormalAdultFiveWallPeriodicReviewRenderedV2 = Readonly<{
  html: string;
  svg: string;
  review: MainWireNormalAdultFiveWallPeriodicReviewV2;
}>;

/** Builds plot data without changing, interpolating, or resampling the run. */
export function buildMainWireNormalAdultFiveWallPeriodicReviewV2(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
): MainWireNormalAdultFiveWallPeriodicReviewV2 {
  const summary = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(result);
  const context =
    resolveMainWireNormalAdultFiveWallSelectedCycleContextV2(result);
  if (summary.selectedCycle.beatIndex !== context.beatIndex) {
    throw new Error("periodic review and summary selected different beats");
  }
  const endpoints = Object.freeze(context.intervals.map((interval, index) =>
    endpointPlotPoint(
      interval.endpointSample.sample,
      index,
      interval.durationSec,
      context.startTimeSec,
      context.durationSec,
    )));
  const exactEvents = Object.freeze(context.acceptedEvents.map((event) =>
    exactEventPlotMarker(event, context)));
  const precedingBoundary = context.status === "complete"
    ? precedingBoundaryPlotPoint(
      context.window.precedingSample.sample,
      context.startTimeSec,
      context.durationSec,
    )
    : null;
  const common = Object.freeze({
    reviewId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_V2_ID,
    generatedFromExperimentId: result.experimentId,
    summary,
    acceptedTimebase: Object.freeze({
      startTimeSec: context.startTimeSec,
      endTimeSec: context.endTimeSec,
      durationSec: context.durationSec,
      nominalGridCount: context.nominalGridCount,
      acceptedIntervalCount: context.acceptedIntervalCount,
      minimumAcceptedDtSec: context.minimumAcceptedDtSec,
      maximumAcceptedDtSec: context.maximumAcceptedDtSec,
      precedingBoundary,
      endpoints,
      exactEvents,
    }),
    convergence: convergenceReadback(result),
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V2,
  });
  if (context.status !== "complete") {
    if (summary.status !== "not-measurable") {
      throw new Error("review predecessor availability differs from summary");
    }
    return Object.freeze({
      ...common,
      status: "not-measurable" as const,
      reason: "missing-preceding-diagnostic" as const,
      boundary: Object.freeze({
        status: "accepted-endpoints-only" as const,
        detail: context.reason,
      }),
      cycleDiagnostics: null,
      pvPaths: pvPathSet(
        context.samples,
        null,
        context.startTimeSec,
        context.durationSec,
        null,
      ),
    });
  }
  if (summary.status !== "complete") {
    throw new Error("review predecessor availability differs from summary");
  }
  const cycle = summary.cyclePhysiology;
  const phases = cycle.status === "measurable"
    ? cycle.phaseByAcceptedIntervalEndpoint
    : null;
  return Object.freeze({
    ...common,
    status: "complete" as const,
    reason: "real-predecessor-and-accepted-endpoints" as const,
    boundary: Object.freeze({
      status: "real-predecessor-available" as const,
      precedingTimeSec: context.window.precedingSample.timeSec,
      acceptedIntervalSegmentCount: context.intervals.length,
    }),
    cycleDiagnostics: cycle,
    pvPaths: pvPathSet(
      context.samples,
      context.window.precedingSample.sample,
      context.startTimeSec,
      context.durationSec,
      phases,
    ),
  });
}

/** Six-panel raw accepted-time renderer for human morphology review. */
export function renderMainWireNormalAdultFiveWallPeriodicReviewV2(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
): MainWireNormalAdultFiveWallPeriodicReviewRenderedV2 {
  const review = buildMainWireNormalAdultFiveWallPeriodicReviewV2(result);
  const svg = renderReviewSvg(review);
  const physiologyStatus = review.status === "complete"
    ? review.summary.physiologyAvailability.status
    : "not-measurable";
  const statusText = review.status !== "complete"
    ? "Cold-start boundary is missing: raw endpoints are shown, but cycle closure, phase, work, and morphology are withheld."
    : review.summary.morphologyInterpretation.eligible
      ? "Current accepted-timebase period-1 morphology is eligible; time-step robustness is not established here."
      : "Morphology is provisional until current-timebase period-1 closure is established.";
  const embedded = safeScriptJson(review);
  const html = `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Accepted-interval five-wall review V2</title>
  <style>${reviewCss()}</style>
</head><body><main>
  <header>
    <div class="eyebrow">Research sidecar · accepted-interval diagnostics V2</div>
    <h1>Accepted-interval five-wall physiology review</h1>
    <p>Raw accepted endpoints and exact accepted calcium events. Straight segments only; no smoothing, resampling, signal interpolation, parameter fitting, or added dynamic state.</p>
  </header>
  <section class="status ${review.status === "complete" ? "warn" : "danger"}">${escapeHtml(statusText)}</section>
  <section class="cards">
    ${reviewCard("beat", String(review.summary.selectedCycle.beatIndex))}
    ${reviewCard("nominal / accepted", `${review.acceptedTimebase.nominalGridCount} / ${review.acceptedTimebase.acceptedIntervalCount}`)}
    ${reviewCard("accepted dt min / max", `${formatNumber(1e3 * review.acceptedTimebase.minimumAcceptedDtSec, 3)} / ${formatNumber(1e3 * review.acceptedTimebase.maximumAcceptedDtSec, 3)} ms`)}
    ${reviewCard("exact Ca events", String(review.acceptedTimebase.exactEvents.length))}
    ${reviewCard("predecessor", review.status === "complete" ? "real boundary" : "missing cold start")}
    ${reviewCard("cycle physiology", physiologyStatus)}
  </section>
  <section class="figure">${svg}</section>
  <section class="tables">
    ${closureTable(review)}
    ${eventTable(review)}
  </section>
  <section class="boundary"><h2>Claim boundaries</h2><ul>
    <li>The horizontal waveform coordinate is computed from accepted endpoint time, cycle start, and accepted cycle duration; the nominal grid count is display metadata only.</li>
    <li>PV paths use the real predecessor followed by accepted endpoints. No last-endpoint-to-first-endpoint segment is invented.</li>
    <li>An exact calcium event inside an accepted interval is shown at its exact time; the accepted endpoint remains the state readback owner and no intermediate state is interpolated.</li>
    <li>Without a real predecessor, raw endpoint plots and ranges remain visible, while phase, work, morphology, and closed-cycle claims are unavailable.</li>
    <li>LA and LV pressures are transmural readbacks; Ao pressure is an absolute node pressure with a different reference zero.</li>
    <li>PVein→LA is one aggregate modeled pulmonary-venous edge, not separate clinical vein measurements.</li>
    <li>This sidecar does not claim current ModelCore/browser-runtime adoption or time-step robustness.</li>
  </ul></section>
  <details><summary>Embedded accepted-interval review data</summary><pre>${escapeHtml(JSON.stringify(review, null, 2))}</pre></details>
  <script type="application/json" id="periodic-review-v2-data">${embedded}</script>
</main></body></html>`;
  return Object.freeze({ html, svg, review });
}

type PlotPoint = Readonly<{ x: number; y: number }>;
type PlotSeries = Readonly<{
  label: string;
  color: string;
  paths: readonly (readonly PlotPoint[])[];
  dashed?: boolean;
}>;
type PlotRule = Readonly<{ x: number; label: string; color: string }>;

const PHASE_COLORS_V2 = Object.freeze({
  reservoir: "#38bdf8",
  conduit: "#f59e0b",
  pumping: "#ec4899",
} as const);

const CLOSURE_COLORS_V2 = Object.freeze({
  "circulation-node-volume": "#38bdf8",
  "dynamic-edge-flow": "#f97316",
  "valve-opening": "#22c55e",
  "triseg-coordinate": "#e879f9",
  "land-state": "#a78bfa",
  "sls-viscous-strain": "#facc15",
  "wall-input-history": "#fb7185",
  "calcium-event-state": "#2dd4bf",
} as const satisfies Readonly<Record<
  MainWireFiveWallPeriodicClosureGroupV1,
  string
>>);

function renderReviewSvg(
  review: MainWireNormalAdultFiveWallPeriodicReviewV2,
): string {
  const width = 1640;
  const height = 820;
  const panelWidth = 510;
  const panelHeight = 330;
  const gapX = 28;
  const gapY = 44;
  const left = 35;
  const top = 88;
  const panel = (column: number, row: number) => Object.freeze({
    x: left + column * (panelWidth + gapX),
    y: top + row * (panelHeight + gapY),
    width: panelWidth,
    height: panelHeight,
  });
  const endpoint = review.acceptedTimebase.endpoints;
  const waveform = Object.freeze([
    ...(review.acceptedTimebase.precedingBoundary === null
      ? []
      : [review.acceptedTimebase.precedingBoundary]),
    ...endpoint,
  ]);
  const eventRules = review.acceptedTimebase.exactEvents.map((event) => ({
    x: event.phase01,
    label: `Ca ${event.activeWalls.length > 0
      ? event.activeWalls.join("+")
      : "no-active-wall"}`,
    color: "#2dd4bf",
  }));
  const panels = [
    renderLinePanelV2(
      panel(0, 0),
      "Group-wise beat closure",
      "completed beat",
      "log10 normalized delta",
      closureSeries(review),
      [],
    ),
    renderLinePanelV2(
      panel(1, 0),
      `LA blood-volume PV${review.status === "complete" ? "" : " (open endpoints only)"}`,
      "LA volume (mL)",
      "LAP (mmHg)",
      pvSeries(review.pvPaths.LA),
      [],
    ),
    renderLinePanelV2(
      panel(2, 0),
      `LV blood-volume PV${review.status === "complete" ? "" : " (open endpoints only)"}`,
      "LV volume (mL)",
      "LVP (mmHg)",
      pvSeries(review.pvPaths.LV),
      [],
    ),
    renderLinePanelV2(
      panel(0, 1),
      "Left-heart pressures (LA/LV transmural; Ao absolute)",
      "accepted cycle fraction",
      "pressure (mmHg)",
      [
        waveformSeries("LAP", "#38bdf8", waveform, (point) =>
          point.pressureMmHg.LA),
        waveformSeries("LVP", "#a78bfa", waveform, (point) =>
          point.pressureMmHg.LV),
        waveformSeries("AoP", "#f97316", waveform, (point) =>
          point.pressureMmHg.Ao),
      ],
      eventRules,
      [],
      [0, 1],
    ),
    renderLinePanelV2(
      panel(1, 1),
      "Valve and aggregate pulmonary-venous flows",
      "accepted cycle fraction",
      "flow (mL/s)",
      [
        waveformSeries("MV", "#ec4899", waveform, (point) =>
          point.flowMlPerSec.MV),
        waveformSeries("AoV", "#f97316", waveform, (point) =>
          point.flowMlPerSec.AoV),
        waveformSeries("TV", "#38bdf8", waveform, (point) =>
          point.flowMlPerSec.TV),
        waveformSeries("PV", "#a78bfa", waveform, (point) =>
          point.flowMlPerSec.PV),
        waveformSeries("PVein→LA", "#22c55e", waveform, (point) =>
          point.flowMlPerSec.PVein_LA),
      ],
      eventRules,
      [0],
      [0, 1],
    ),
    renderLinePanelV2(
      panel(2, 1),
      "Accepted interval duration and exact Ca events",
      "accepted cycle fraction",
      "accepted dt (ms)",
      [endpointSeries("accepted dt", "#e5e7eb", endpoint, (point) =>
        1e3 * point.acceptedDurationSec)],
      eventRules,
      [],
      [0, 1],
    ),
  ].join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="review-v2-svg-title review-v2-svg-description">
  <title id="review-v2-svg-title">Accepted-interval five-wall physiology review</title>
  <desc id="review-v2-svg-description">Six panels show all closure groups including calcium event state, atrial and ventricular pressure-volume paths, left-heart pressures, all modeled valve and aggregate pulmonary-venous flows, and accepted interval durations with exact calcium event markers.</desc>
  <rect width="100%" height="100%" fill="#081426"/>
  <text x="35" y="35" fill="#e7eef9" font-size="24" font-weight="700">Raw accepted-time physiology and event ownership</text>
  <text x="35" y="61" fill="#9fb0c8" font-size="13">Real predecessor boundary when available · accepted endpoints · exact event markers · no smoothing or interpolation</text>
  ${panels}
  </svg>`;
}

function closureSeries(
  review: MainWireNormalAdultFiveWallPeriodicReviewV2,
): readonly PlotSeries[] {
  return review.convergence.groupOrder.map((group) => Object.freeze({
    label: shortClosureGroup(group),
    color: CLOSURE_COLORS_V2[group],
    paths: Object.freeze([Object.freeze(review.convergence.beatHistory.flatMap(
      (beat) => {
        const value = beat.period1MaximumNormalizedDeltaByGroup[group];
        return value === undefined ? [] : [Object.freeze({
          x: beat.beatIndex,
          y: Math.log10(Math.max(value, 1e-16)),
        })];
      },
    ))]),
  }));
}

function pvSeries(
  path: PvPathSetV2[ChamberId],
): readonly PlotSeries[] {
  if (path.phasePaths === null) {
    return [Object.freeze({
      label: "raw accepted path",
      color: "#94a3b8",
      paths: Object.freeze([Object.freeze(path.points.map((point) =>
        Object.freeze({ x: point.volumeMl, y: point.pressureMmHg })))]),
    })];
  }
  return (["reservoir", "conduit", "pumping"] as const).map((phase) =>
    Object.freeze({
      label: phase,
      color: PHASE_COLORS_V2[phase],
      paths: Object.freeze(path.phasePaths![phase].map((run) => Object.freeze(
        run.map((point) => Object.freeze({
          x: point.volumeMl,
          y: point.pressureMmHg,
        })),
      ))),
    }));
}

function endpointSeries(
  label: string,
  color: string,
  endpoints: readonly MainWireNormalAdultFiveWallAcceptedEndpointPlotPointV2[],
  read: (point: MainWireNormalAdultFiveWallAcceptedEndpointPlotPointV2) => number,
): PlotSeries {
  return Object.freeze({
    label,
    color,
    paths: Object.freeze([Object.freeze(endpoints.map((point) =>
      Object.freeze({ x: point.phase01, y: read(point) })))]),
  });
}

type WaveformPlotPointV2 =
  | MainWireNormalAdultFiveWallAcceptedEndpointPlotPointV2
  | MainWireNormalAdultFiveWallPrecedingBoundaryPlotPointV2;

function waveformSeries(
  label: string,
  color: string,
  points: readonly WaveformPlotPointV2[],
  read: (point: WaveformPlotPointV2) => number,
): PlotSeries {
  return Object.freeze({
    label,
    color,
    paths: Object.freeze([Object.freeze(points.map((point) =>
      Object.freeze({ x: point.phase01, y: read(point) })))]),
  });
}

function renderLinePanelV2(
  rect: Readonly<{ x: number; y: number; width: number; height: number }>,
  title: string,
  xLabel: string,
  yLabel: string,
  series: readonly PlotSeries[],
  verticalRules: readonly PlotRule[],
  horizontalRules: readonly number[] = [],
  fixedXDomain?: readonly [number, number],
): string {
  const finiteSeries = series.map((entry) => Object.freeze({
    ...entry,
    paths: Object.freeze(entry.paths.map((path) => Object.freeze(path.filter(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
    ))).filter((path) => path.length > 0)),
  })).filter((entry) => entry.paths.length > 0);
  const points = finiteSeries.flatMap((entry) => entry.paths.flatMap(
    (path) => path));
  const xDomain = fixedXDomain ?? paddedDomain(points.map((point) => point.x));
  const yDomain = paddedDomain([
    ...points.map((point) => point.y),
    ...horizontalRules,
  ]);
  const legendRows = Math.max(1, Math.ceil(finiteSeries.length / 4));
  const plot = Object.freeze({
    x: rect.x + 68,
    y: rect.y + 42 + 14 * legendRows,
    width: rect.width - 86,
    height: rect.height - 94 - 14 * legendRows,
  });
  const sx = (value: number) => plot.x + (value - xDomain[0])
    / Math.max(xDomain[1] - xDomain[0], 1e-12) * plot.width;
  const sy = (value: number) => plot.y + plot.height - (value - yDomain[0])
    / Math.max(yDomain[1] - yDomain[0], 1e-12) * plot.height;
  const polylines = finiteSeries.map((entry) => entry.paths.map((path) =>
    `<polyline points="${path.map((point) =>
      `${roundNumber(sx(point.x), 2)},${roundNumber(sy(point.y), 2)}`).join(" ")}" fill="none" stroke="${entry.color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"${entry.dashed ? ' stroke-dasharray="6 4"' : ""}/>`).join("\n")).join("\n");
  const vertical = verticalRules.filter((rule) =>
    rule.x >= xDomain[0] && rule.x <= xDomain[1]).map((rule, index) => {
      const x = sx(rule.x);
      return `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${plot.y + plot.height}" stroke="${rule.color}" stroke-width="1.2" stroke-dasharray="4 4"/><text x="${x + 3}" y="${plot.y + 11 + 11 * (index % 2)}" fill="${rule.color}" font-size="8">${escapeXml(rule.label)}</text>`;
    }).join("");
  const horizontal = horizontalRules.filter((value) =>
    value >= yDomain[0] && value <= yDomain[1]).map((value) =>
      `<line x1="${plot.x}" y1="${sy(value)}" x2="${plot.x + plot.width}" y2="${sy(value)}" stroke="#cbd5e1" opacity=".55" stroke-dasharray="3 4"/>`).join("");
  return `<g role="img" aria-label="${escapeXml(title)}"><title>${escapeXml(title)}</title>
    <text x="${rect.x}" y="${rect.y + 18}" fill="#e7eef9" font-size="15" font-weight="700">${escapeXml(title)}</text>
    ${legendV2(finiteSeries, rect.x + 3, rect.y + 31, 4, 120)}
    <rect x="${plot.x}" y="${plot.y}" width="${plot.width}" height="${plot.height}" fill="#0b1728" stroke="#29405f"/>
    ${gridV2(plot, xDomain, yDomain)}${horizontal}${vertical}${polylines}
    <text x="${plot.x + plot.width / 2}" y="${rect.y + rect.height - 3}" fill="#93a7c0" font-size="10" text-anchor="middle">${escapeXml(xLabel)}</text>
    <text x="${rect.x + 11}" y="${plot.y + plot.height / 2}" fill="#93a7c0" font-size="10" text-anchor="middle" transform="rotate(-90 ${rect.x + 11} ${plot.y + plot.height / 2})">${escapeXml(yLabel)}</text>
  </g>`;
}

function gridV2(
  plot: Readonly<{ x: number; y: number; width: number; height: number }>,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
): string {
  return [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const x = plot.x + fraction * plot.width;
    const y = plot.y + fraction * plot.height;
    const xv = xDomain[0] + fraction * (xDomain[1] - xDomain[0]);
    const yv = yDomain[1] - fraction * (yDomain[1] - yDomain[0]);
    return `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${plot.y + plot.height}" stroke="#1c2d45"/><line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" stroke="#1c2d45"/><text x="${x}" y="${plot.y + plot.height + 15}" fill="#8296af" font-size="9" text-anchor="middle">${escapeXml(formatTick(xv))}</text><text x="${plot.x - 6}" y="${y + 3}" fill="#8296af" font-size="9" text-anchor="end">${escapeXml(formatTick(yv))}</text>`;
  }).join("");
}

function legendV2(
  series: readonly Pick<PlotSeries, "label" | "color" | "dashed">[],
  x: number,
  y: number,
  columns: number,
  cellWidth: number,
): string {
  return series.map((entry, index) => {
    const cx = x + index % columns * cellWidth;
    const cy = y + Math.floor(index / columns) * 14;
    return `<line x1="${cx}" y1="${cy}" x2="${cx + 14}" y2="${cy}" stroke="${entry.color}" stroke-width="2.3"${entry.dashed ? ' stroke-dasharray="5 4"' : ""}/><text x="${cx + 18}" y="${cy + 3}" fill="#aebed1" font-size="9">${escapeXml(entry.label)}</text>`;
  }).join("");
}

function closureTable(
  review: MainWireNormalAdultFiveWallPeriodicReviewV2,
): string {
  const rows = review.convergence.latestGroupReports.length === 0
    ? '<tr><td colspan="3">No period-1 closure report is available.</td></tr>'
    : review.convergence.latestGroupReports.map((report) => `<tr><th>${escapeHtml(shortClosureGroup(report.group))}</th><td>${scientificNumber(report.maximumNormalizedDelta)}</td><td><code>${escapeHtml(report.worstPath)}</code></td></tr>`).join("");
  return `<article><h2>Latest group-wise closure</h2><div class="scroll"><table><thead><tr><th>group</th><th>max normalized Δ</th><th>worst path</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
}

function eventTable(
  review: MainWireNormalAdultFiveWallPeriodicReviewV2,
): string {
  const rows = review.acceptedTimebase.exactEvents.length === 0
    ? '<tr><td colspan="6">No accepted calcium event is retained.</td></tr>'
    : review.acceptedTimebase.exactEvents.map((event) => `<tr><th><code>${escapeHtml(event.eventId)}</code></th><td>${escapeHtml(event.activeWalls.join(" + ") || "none")}</td><td>${formatNumber(event.timeSec, 6)}</td><td>${formatNumber(event.phase01, 6)}</td><td>${event.ownerAcceptedIntervalIndex}</td><td>${formatNumber(event.ownerAcceptedEndpointPhase01, 6)}</td></tr>`).join("");
  return `<article><h2>Exact accepted calcium events</h2><div class="scroll"><table><thead><tr><th>event</th><th>nonzero walls</th><th>time (s)</th><th>exact phase</th><th>owner interval</th><th>owner endpoint phase</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
}

function shortClosureGroup(
  group: MainWireFiveWallPeriodicClosureGroupV1,
): string {
  return ({
    "circulation-node-volume": "node volume",
    "dynamic-edge-flow": "edge flow",
    "valve-opening": "valve opening",
    "triseg-coordinate": "TriSeg coordinate",
    "land-state": "Land state",
    "sls-viscous-strain": "SLS strain",
    "wall-input-history": "wall input history",
    "calcium-event-state": "Ca event state",
  } as const)[group];
}

function paddedDomain(values: readonly number[]): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  const span = maximum - minimum;
  const padding = span > 0
    ? 0.065 * span
    : Math.max(0.5, 0.1 * Math.abs(maximum));
  return [minimum - padding, maximum + padding];
}

function reviewCard(label: string, value: string): string {
  return `<div class="card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function reviewCss(): string {
  return `:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#06101f;color:#e7eef9;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1720px;margin:0 auto;padding:26px 26px 48px}.eyebrow{color:#7dd3fc;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}h1{margin:5px 0 8px;font-size:34px}h2{margin:0 0 11px;font-size:17px}header p{max-width:1100px;color:#9fb0c8;line-height:1.5}.status{margin:18px 0 14px;padding:12px 14px;border:1px solid;border-radius:9px}.warn{background:#2b210a;border-color:#854d0e;color:#fde68a}.danger{background:#311317;border-color:#991b1b;color:#fecaca}.cards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:15px}.card,.tables article,.boundary,details{background:#0d1a2d;border:1px solid #203451;border-radius:9px;padding:12px}.card span{display:block;color:#8fa4bf;font-size:11px;margin-bottom:5px}.card strong{font-size:16px;overflow-wrap:anywhere}.figure{background:#081426;border:1px solid #203451;border-radius:11px;overflow:hidden}.figure svg{display:block;width:100%;height:auto}.tables{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:15px}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:7px 8px;border-bottom:1px solid #203451;text-align:right;vertical-align:top}th:first-child,td:first-child{text-align:left}thead th{color:#8fa4bf}code{color:#bae6fd;overflow-wrap:anywhere}.boundary,details{margin-top:15px}.boundary ul{margin:0;padding-left:20px;color:#b8c6d9;line-height:1.55}summary{cursor:pointer;font-weight:600}pre{white-space:pre-wrap;word-break:break-word;color:#aebed1;font-size:11px}@media(max-width:1100px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}.tables{grid-template-columns:1fr}}@media(max-width:650px){main{padding:16px 10px 34px}.cards{grid-template-columns:repeat(2,minmax(0,1fr)}}`;
}

function safeScriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value: string): string {
  return escapeHtml(value);
}

function formatNumber(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function scientificNumber(value: number): string {
  return Number.isFinite(value) ? value.toExponential(3) : "—";
}

function formatTick(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1e4 || Math.abs(value) < 1e-3 && value !== 0) {
    return value.toExponential(1);
  }
  return Number(value.toFixed(3)).toString();
}

function roundNumber(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function endpointPlotPoint(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV3,
  sampleIndex: number,
  acceptedDurationSec: number,
  cycleStartTimeSec: number,
  cycleDurationSec: number,
): MainWireNormalAdultFiveWallAcceptedEndpointPlotPointV2 {
  return Object.freeze({
    sampleIndex,
    timeSec: sample.timeSec,
    phase01: normalizedAcceptedTime(
      sample.timeSec,
      cycleStartTimeSec,
      cycleDurationSec,
    ),
    acceptedDurationSec,
    chamberVolumeMl: Object.freeze({
      LA: sample.nodeVolumeMl.LA,
      LV: sample.nodeVolumeMl.LV,
    }),
    pressureMmHg: Object.freeze({
      LA: sample.chamberTransmuralPressureMmHg.LA,
      LV: sample.chamberTransmuralPressureMmHg.LV,
      Ao: sample.nodeAbsolutePressureMmHg.Ao,
    }),
    flowMlPerSec: Object.freeze({
      MV: sample.flowMlPerSec.MV,
      AoV: sample.flowMlPerSec.AoV,
      TV: sample.flowMlPerSec.TV,
      PV: sample.flowMlPerSec.PV,
      PVein_LA: sample.flowMlPerSec.PVein_LA,
    }),
    freeCalciumUM: Object.freeze({
      LA: sample.freeCalciumUM.LA,
      RA: sample.freeCalciumUM.RA,
    }),
  });
}

function precedingBoundaryPlotPoint(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV3,
  cycleStartTimeSec: number,
  cycleDurationSec: number,
): MainWireNormalAdultFiveWallPrecedingBoundaryPlotPointV2 {
  const endpointShape = endpointPlotPoint(
    sample,
    -1,
    0,
    cycleStartTimeSec,
    cycleDurationSec,
  );
  const { sampleIndex: _sampleIndex, acceptedDurationSec: _duration, ...rest } =
    endpointShape;
  return Object.freeze({
    ...rest,
    sampleIndex: null,
    acceptedDurationSec: null,
  });
}

function exactEventPlotMarker(
  event: MainWireNormalAdultFiveWallSelectedCycleEventV2,
  context: ReturnType<
    typeof resolveMainWireNormalAdultFiveWallSelectedCycleContextV2
  >,
): MainWireNormalAdultFiveWallExactEventPlotMarkerV2 {
  const intervalIndex = context.intervals.findIndex((interval) =>
    interval.eventsOpenClosed.some((candidate) =>
      candidate.eventId === event.eventId));
  if (intervalIndex < 0) {
    throw new Error("accepted event has no owner interval");
  }
  const strengthByWall = Object.freeze({
    LA: event.event.calciumEvent.strengthByWall.LA ?? 0,
    LVFW: event.event.calciumEvent.strengthByWall.LVFW ?? 0,
    SEP: event.event.calciumEvent.strengthByWall.SEP ?? 0,
    RVFW: event.event.calciumEvent.strengthByWall.RVFW ?? 0,
    RA: event.event.calciumEvent.strengthByWall.RA ?? 0,
  });
  const activeWalls = Object.freeze(([
    "LA",
    "LVFW",
    "SEP",
    "RVFW",
    "RA",
  ] as const).filter((wall) => strengthByWall[wall] > 0));
  return Object.freeze({
    eventId: event.eventId,
    timeSec: event.timeSec,
    phase01: normalizedAcceptedTime(
      event.timeSec,
      context.startTimeSec,
      context.durationSec,
    ),
    ownerAcceptedIntervalIndex: intervalIndex,
    ownerAcceptedEndpointPhase01: normalizedAcceptedTime(
      context.intervals[intervalIndex]!.endTimeSec,
      context.startTimeSec,
      context.durationSec,
    ),
    strengthByWall,
    activeWalls,
    source: event.event.source,
  });
}

function pvPathSet(
  endpoints: readonly MainWireNormalAdultFiveWallDiagnosticSampleV3[],
  preceding: MainWireNormalAdultFiveWallDiagnosticSampleV3 | null,
  cycleStartTimeSec: number,
  cycleDurationSec: number,
  phases: readonly MainWireNormalAdultFiveWallCyclePhaseV1[] | null,
): PvPathSetV2 {
  return chamberRecord((chamber) => {
    const points = Object.freeze([
      ...(preceding === null ? [] : [pvPoint(
        preceding,
        chamber,
        "real-predecessor",
        null,
        cycleStartTimeSec,
        cycleStartTimeSec,
        cycleDurationSec,
      )]),
      ...endpoints.map((sample, index) => pvPoint(
        sample,
        chamber,
        "accepted-endpoint",
        index,
        sample.timeSec,
        cycleStartTimeSec,
        cycleDurationSec,
      )),
    ]);
    return Object.freeze({
      chamber,
      points,
      drawableRealSegmentCount: preceding === null
        ? Math.max(0, endpoints.length - 1)
        : endpoints.length,
      missingFirstIntervalSegment: preceding === null,
      artificialClosingSegmentAdded: false as const,
      phasePaths: preceding !== null && phases !== null
        ? chronologicalPhasePaths(points, phases)
        : null,
    });
  });
}

function pvPoint(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV3,
  chamber: ChamberId,
  source: MainWireNormalAdultFiveWallPvPlotPointV2["source"],
  sampleIndex: number | null,
  timeSec: number,
  cycleStartTimeSec: number,
  cycleDurationSec: number,
): MainWireNormalAdultFiveWallPvPlotPointV2 {
  return Object.freeze({
    source,
    sampleIndex,
    timeSec,
    phase01: normalizedAcceptedTime(
      timeSec,
      cycleStartTimeSec,
      cycleDurationSec,
    ),
    volumeMl: sample.nodeVolumeMl[chamber],
    pressureMmHg: sample.chamberTransmuralPressureMmHg[chamber],
  });
}

function chronologicalPhasePaths(
  boundaryAndEndpoints: readonly MainWireNormalAdultFiveWallPvPlotPointV2[],
  phases: readonly MainWireNormalAdultFiveWallCyclePhaseV1[],
): MainWireNormalAdultFiveWallPhasePvPathsV2 {
  if (boundaryAndEndpoints.length !== phases.length + 1) {
    throw new Error("phase PV path lacks its real predecessor boundary");
  }
  const mutable: Record<
    MainWireNormalAdultFiveWallCyclePhaseV1,
    MainWireNormalAdultFiveWallPvPlotPointV2[][]
  > = { reservoir: [], conduit: [], pumping: [] };
  let previousPhase: MainWireNormalAdultFiveWallCyclePhaseV1 | null = null;
  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index]!;
    const start = boundaryAndEndpoints[index]!;
    const end = boundaryAndEndpoints[index + 1]!;
    const paths = mutable[phase];
    if (phase === previousPhase) {
      paths.at(-1)!.push(end);
    } else {
      paths.push([start, end]);
    }
    previousPhase = phase;
  }
  return phaseRecord((phase) => Object.freeze(
    mutable[phase].map((path) => Object.freeze(path)),
  ));
}

function convergenceReadback(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
): ReviewConvergenceV2 {
  const latest = result.beatClosure.at(-1)?.period1 ?? null;
  return Object.freeze({
    policyTolerance: result.policy.period1NormalizedTolerance,
    groupOrder: CLOSURE_GROUP_ORDER_V2,
    calciumEventStateIncluded: true as const,
    beatHistory: Object.freeze(result.beatClosure.map((beat) => Object.freeze({
      beatIndex: beat.beatIndex,
      period1MaximumNormalizedDeltaByGroup: Object.freeze(
        Object.fromEntries(CLOSURE_GROUP_ORDER_V2.flatMap((group) => {
          const report = beat.period1?.groups[group];
          return report === undefined
            ? []
            : [[group, report.maximumNormalizedDelta]];
        })),
      ),
      period2OverallMaximumNormalizedDelta:
        beat.period2?.overall.maximumNormalizedDelta ?? null,
    }))),
    latestGroupReports: Object.freeze(latest === null
      ? []
      : CLOSURE_GROUP_ORDER_V2.map((group) => latest.groups[group])),
  });
}

function normalizedAcceptedTime(
  timeSec: number,
  cycleStartTimeSec: number,
  cycleDurationSec: number,
): number {
  const phase = (timeSec - cycleStartTimeSec) / cycleDurationSec;
  const tolerance = 1e-10;
  if (!Number.isFinite(phase) || phase < -tolerance || phase > 1 + tolerance) {
    throw new Error("accepted plot time lies outside the selected cycle");
  }
  if (Math.abs(phase) <= tolerance) return 0;
  if (Math.abs(phase - 1) <= tolerance) return 1;
  return phase;
}

function chamberRecord<T>(
  build: (chamber: ChamberId) => T,
): Readonly<Record<ChamberId, T>> {
  return Object.freeze(Object.fromEntries(
    (["LA", "LV"] as const).map((chamber) => [chamber, build(chamber)]),
  )) as Readonly<Record<ChamberId, T>>;
}

function phaseRecord<T>(
  build: (phase: MainWireNormalAdultFiveWallCyclePhaseV1) => T,
): PhaseRecord<T> {
  return Object.freeze(Object.fromEntries(
    (["reservoir", "conduit", "pumping"] as const).map((phase) =>
      [phase, build(phase)]),
  )) as PhaseRecord<T>;
}
