import type {
  MainWireIntegratedModelTerminalCycleTraceSampleV2,
  MainWireIntegratedModelTerminalCycleTraceV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import type {
  DynamicRotaryPumpConstraintOwnerV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import {
  describeMainWireIntegratedModelTerminalCycleMorphologyV2,
} from "@/engine/myocardium/diagnostics/MainWireIntegratedModelTerminalCycleMorphologyV2";

export const MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_ID =
  "main-wire-integrated-terminal-cycle-raw-svg-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_CLAIM =
  Object.freeze({
    role: "exploratory-terminal-cycle-graph-shape-inspection" as const,
    cycleStatus:
      "explicit-render-context-never-inferred-from-raw-trace" as const,
    physiologyAcceptanceClaimed: false as const,
    shapeAcceptanceClaimed: false as const,
    resamplingApplied: false as const,
    smoothingApplied: false as const,
    fittingApplied: false as const,
    plottedSamples:
      "raw-accepted-endpoint-samples-connected-only-in-accepted-order" as const,
  });

export type MainWireIntegratedModelTerminalCycleClassificationContextV2 =
  | "unclassified"
  | "period1-converged"
  | "period2-suspect"
  | "not-converged";

const SVG_WIDTH = 1320;
const SVG_HEIGHT = 1720;
const OUTER_MARGIN = 50;
const COLUMN_GAP = 30;
const PANEL_WIDTH = (SVG_WIDTH - 2 * OUTER_MARGIN - COLUMN_GAP) / 2;
const PANEL_HEIGHT = 280;
const PANEL_ROW_GAP = 30;
const PANEL_TOP = 225;
const TIMELINE_TOP = PANEL_TOP + 4 * (PANEL_HEIGHT + PANEL_ROW_GAP);
const TIMELINE_HEIGHT = 205;
const MAX_RAW_ENDPOINT_SAMPLE_COUNT = 20_000;

const CONSTRAINT_OWNERS = Object.freeze([
  "none",
  "disabled",
  "clamp",
  "pressure-collapse",
  "volume-collapse",
  "forward-cap",
  "reverse-cap",
] as const satisfies readonly DynamicRotaryPumpConstraintOwnerV1[]);

const CONSTRAINT_COLOR: Readonly<Record<
  DynamicRotaryPumpConstraintOwnerV1,
  string
>> = Object.freeze({
  none: "#2563eb",
  disabled: "#64748b",
  clamp: "#111827",
  "pressure-collapse": "#dc2626",
  "volume-collapse": "#d97706",
  "forward-cap": "#7c3aed",
  "reverse-cap": "#0f766e",
});

const SIGNAL_KEYS = Object.freeze([
  "lvadFlowMlPerSec",
  "lvadPressureRiseMmHg",
  "aorticPressureMmHg",
  "leftVentricularPressureMmHg",
  "leftVentricularVolumeMl",
  "totalCoronaryInletFlowMlPerSec",
  "ladSubendocardialQmFlowMlPerSec",
] as const);

const VALVE_DIRECTIONS = Object.freeze([
  "forward",
  "reverse",
  "zero-gradient",
] as const);

const FORWARD_FLOW_EVIDENCE_STATUSES = Object.freeze([
  "not-declared",
  "non-forward-flow-not-applicable",
  "within-published-experimental-domain",
  "above-published-experimental-domain-within-advertised-capacity",
  "above-advertised-capacity",
] as const);

type NumericBounds = Readonly<{ minimum: number; maximum: number }>;

type PlotBox = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

type Panel = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  plot: PlotBox;
}>;

/**
 * Renders every accepted endpoint retained by the V2 terminal-cycle
 * exploration. The renderer never interpolates a new sample, resamples,
 * smooths, fits, or classifies the trace. Straight SVG polyline segments only
 * connect adjacent raw endpoints in their accepted order.
 */
export function renderMainWireIntegratedModelTerminalCycleTraceSvgV2(
  candidate: unknown,
  classificationContext:
    MainWireIntegratedModelTerminalCycleClassificationContextV2 =
      "unclassified",
): string {
  const trace = validateTerminalCycleTrace(candidate);
  const cycleStatus = validateClassificationContext(classificationContext);
  const morphology =
    describeMainWireIntegratedModelTerminalCycleMorphologyV2(trace);
  const samples = trace.samples;
  const leftX = OUTER_MARGIN;
  const rightX = OUTER_MARGIN + PANEL_WIDTH + COLUMN_GAP;
  const rowY = (row: number) =>
    PANEL_TOP + row * (PANEL_HEIGHT + PANEL_ROW_GAP);

  const panels = [
    renderPhaseSeriesPanel(
      createPanel(leftX, rowY(0), PANEL_WIDTH, PANEL_HEIGHT),
      "Pressure @ systemic Ao node / absolute LV chamber",
      "pressure (mmHg)",
      samples,
      [
        {
          id: "aortic-pressure",
          label: "AoP @ Ao node",
          color: "#2563eb",
          value: (sample) => sample.signal.aorticPressureMmHg,
        },
        {
          id: "left-ventricular-pressure",
          label: "LVP @ LV node",
          color: "#dc2626",
          value: (sample) => sample.signal.leftVentricularPressureMmHg,
        },
      ],
    ),
    renderPhaseSeriesPanel(
      createPanel(rightX, rowY(0), PANEL_WIDTH, PANEL_HEIGHT),
      "LV chamber blood volume vs accepted cycle phase",
      "volume (mL)",
      samples,
      [
        {
          id: "left-ventricular-volume",
          label: "LV volume",
          color: "#7c3aed",
          value: (sample) => sample.signal.leftVentricularVolumeMl,
        },
      ],
    ),
    renderXyPanel(
      createPanel(leftX, rowY(1), PANEL_WIDTH, PANEL_HEIGHT),
      "LV pressure-volume loop @ LV chamber (raw endpoint order)",
      "LV volume (mL)",
      "LVP (mmHg)",
      samples.map((sample) => Object.freeze({
        x: sample.signal.leftVentricularVolumeMl,
        y: sample.signal.leftVentricularPressureMmHg,
      })),
      "lv-pv-loop",
      "#7c3aed",
    ),
    renderLvadPhasePanel(
      createPanel(rightX, rowY(1), PANEL_WIDTH, PANEL_HEIGHT),
      samples,
    ),
    renderLvadHeadFlowPanel(
      createPanel(leftX, rowY(2), PANEL_WIDTH, PANEL_HEIGHT),
      samples,
    ),
    renderPhaseSeriesPanel(
      createPanel(rightX, rowY(2), PANEL_WIDTH, PANEL_HEIGHT),
      "Coronary flows at two distinct model stations",
      "flow (mL/s)",
      samples,
      [
        {
          id: "total-coronary-inlet-flow",
          label: "aggregate Ao→inlets",
          color: "#0f766e",
          value: (sample) => sample.signal.totalCoronaryInletFlowMlPerSec,
        },
        {
          id: "lad-subendocardial-qm-flow",
          label: "LAD subendo internal Qm",
          color: "#e11d48",
          value: (sample) => sample.signal.ladSubendocardialQmFlowMlPerSec,
        },
      ],
    ),
    renderPhaseSeriesPanel(
      createPanel(leftX, rowY(3), PANEL_WIDTH, PANEL_HEIGHT),
      "Native valve signed flow @ MV (LA→LV) / AoV (LV→Ao)",
      "signed flow (mL/s)",
      samples,
      [
        {
          id: "mitral-valve-signed-flow",
          label: "MV LA→LV",
          color: "#7c3aed",
          value: (sample) => sample.valve.MV.signedFlowMlPerSec,
        },
        {
          id: "aortic-valve-signed-flow",
          label: "AoV LV→Ao",
          color: "#0f766e",
          value: (sample) => sample.valve.AoV.signedFlowMlPerSec,
        },
      ],
    ),
    renderValveStatePanel(
      createPanel(rightX, rowY(3), PANEL_WIDTH, PANEL_HEIGHT),
      samples,
    ),
    renderConstraintTimeline(
      createPanel(
        OUTER_MARGIN,
        TIMELINE_TOP,
        SVG_WIDTH - 2 * OUTER_MARGIN,
        TIMELINE_HEIGHT,
      ),
      trace,
    ),
  ];

  const statusLabel = cycleStatus === "period1-converged"
    ? "numerical P1 classified"
    : cycleStatus === "period2-suspect"
      ? "numerical P2 suspect"
      : cycleStatus === "not-converged"
        ? "numerically nonconverged"
        : "periodicity unclassified";
  const title =
    `Integrated V2 — exploratory terminal cycle / ${statusLabel} / no physiology or shape acceptance / no resampling`;
  const subtitle = `cycle ${trace.cycleIndex}; ${trace.sampleCount} raw accepted endpoint samples; ${formatValue(trace.startTimeSec)}–${formatValue(trace.endTimeSec)} s`;
  const metadata = escapeXml(JSON.stringify({
    artifactId: MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_ID,
    claim: MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_CLAIM,
    cycleIndex: trace.cycleIndex,
    sampleCount: trace.sampleCount,
    cycleClassificationContext: cycleStatus,
    sourceInterpretation: trace.interpretation,
    morphology,
  }));
  const aop = morphology.pressure.aortic;
  const lvp = morphology.pressure.leftVentricular;
  const combined = morphology.flowLedger.combined;
  const coronary = morphology.coronaryPhaseLedger;
  const dsvr = coronary.aggregateAorticInlet
    .diastolicToSystolicMeanFlowRatio;
  const summaryPressure =
    `Ao @ systemic node: mean ${formatValue(aop.timeWeightedMean)}, min ${formatValue(aop.minimum.value)}, max ${formatValue(aop.maximum.value)} mmHg · LV absolute: mean ${formatValue(lvp.timeWeightedMean)}, min ${formatValue(lvp.minimum.value)}, max ${formatValue(lvp.maximum.value)} mmHg · crossings ${morphology.pressure.lvMinusAoCrossings.count}`;
  const summaryOutput =
    `Native AoV forward SV ${formatValue(morphology.flowLedger.nativeAorticValve.forwardStrokeVolumeMl)} mL · LVAD signed beat volume ${formatValue(morphology.flowLedger.lvad.signedBeatVolumeMl)} mL · combined forward output ${formatValue(combined.forwardOutputLMin)} L/min · LVAD forward support fraction ${formatNullable(combined.lvadForwardSupportFraction01)}`;
  const summaryLoops =
    `PV ${morphology.pressureVolumeLoop.orientation}, area ${formatValue(morphology.pressureVolumeLoop.signedClosedPolygonAreaMmHgMl)} mmHg·mL, self-x ${morphology.pressureVolumeLoop.selfIntersection.present} · pump-local H-Q ${morphology.lvadHeadFlowLoop.orientation} · aggregate Ao→coronary D/S mean-flow ratio ${formatNullable(dsvr)} (LAD internal Qm kept separate)`;
  const warning = cycleStatus === "period1-converged"
    ? "RAW ACCEPTED ENDPOINTS ONLY — numerical P1 classifier passed; not a physiological or shape-accepted waveform."
    : cycleStatus === "period2-suspect"
      ? "RAW ACCEPTED ENDPOINTS ONLY — numerical P2 is suspect; not a physiological or shape-accepted waveform."
      : cycleStatus === "not-converged"
        ? "RAW ACCEPTED ENDPOINTS ONLY — numerical classifier did not converge; no physiological or shape acceptance."
        : "RAW ACCEPTED ENDPOINTS ONLY — periodicity is not inferred from this trace; no physiological or shape acceptance.";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" role="img" aria-labelledby="artifact-title artifact-desc" data-artifact-id="${MAIN_WIRE_INTEGRATED_MODEL_TERMINAL_CYCLE_SVG_V2_ID}">`,
    `<title id="artifact-title">${escapeXml(title)}</title>`,
    `<desc id="artifact-desc">${escapeXml(`Exploratory terminal-cycle raw accepted endpoint diagnostic. Classification context: ${cycleStatus}. No physiology acceptance, no shape acceptance, and no resampling, smoothing, or fitting.`)}</desc>`,
    `<metadata>${metadata}</metadata>`,
    `<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#f8fafc"/>`,
    `<text x="${OUTER_MARGIN}" y="58" class="artifact-title">${escapeXml(title)}</text>`,
    `<text x="${OUTER_MARGIN}" y="91" class="artifact-subtitle">${escapeXml(subtitle)}</text>`,
    `<text x="${OUTER_MARGIN}" y="119" class="artifact-warning">${escapeXml(warning)}</text>`,
    `<text x="${OUTER_MARGIN}" y="148" class="artifact-summary">${escapeXml(summaryPressure)}</text>`,
    `<text x="${OUTER_MARGIN}" y="168" class="artifact-summary">${escapeXml(summaryOutput)}</text>`,
    `<text x="${OUTER_MARGIN}" y="188" class="artifact-summary">${escapeXml(summaryLoops)}</text>`,
    `<style>${svgStyle()}</style>`,
    ...panels,
    `<text x="${OUTER_MARGIN}" y="${SVG_HEIGHT - 28}" class="footer">Diagnostic rendering only · no interpolation grid · no smoothing · no fitting · no acceptance threshold</text>`,
    "</svg>",
    "",
  ].join("\n");
}

function renderPhaseSeriesPanel(
  panel: Panel,
  title: string,
  yLabel: string,
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
  series: readonly Readonly<{
    id: string;
    label: string;
    color: string;
    value: (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) => number;
  }>[],
): string {
  const yBounds = paddedBounds(
    series.flatMap((item) => samples.map(item.value)),
  );
  const content = [
    renderAxes(panel.plot, Object.freeze({ minimum: 0, maximum: 1 }), yBounds,
      "accepted cycle phase", yLabel),
    ...series.map((item) => {
      const points = samples.map((sample) =>
        point(
          scale(sample.cyclePhase01, 0, 1, panel.plot.x, panel.plot.x + panel.plot.width),
          scale(item.value(sample), yBounds.minimum, yBounds.maximum,
            panel.plot.y + panel.plot.height, panel.plot.y),
        )).join(" ");
      return `<polyline data-series="${escapeXml(item.id)}" points="${points}" fill="none" stroke="${item.color}" stroke-width="1.7"/>`;
    }),
    renderSeriesLegend(
      panel.x + 19,
      panel.y + 43,
      series.map(({ label, color }) => Object.freeze({ label, color })),
    ),
  ];
  return renderPanel(panel, title, content.join("\n"));
}

function renderXyPanel(
  panel: Panel,
  title: string,
  xLabel: string,
  yLabel: string,
  points: readonly Readonly<{ x: number; y: number }>[],
  seriesId: string,
  color: string,
): string {
  const xBounds = paddedBounds(points.map(({ x }) => x));
  const yBounds = paddedBounds(points.map(({ y }) => y));
  const rawPoints = points.map(({ x, y }) =>
    point(
      scale(x, xBounds.minimum, xBounds.maximum,
        panel.plot.x, panel.plot.x + panel.plot.width),
      scale(y, yBounds.minimum, yBounds.maximum,
        panel.plot.y + panel.plot.height, panel.plot.y),
    )).join(" ");
  return renderPanel(panel, title, [
    renderAxes(panel.plot, xBounds, yBounds, xLabel, yLabel),
    `<polyline data-series="${seriesId}" points="${rawPoints}" fill="none" stroke="${color}" stroke-width="1.7"/>`,
    `<circle cx="${formatSvg(scale(points[0]!.x, xBounds.minimum, xBounds.maximum, panel.plot.x, panel.plot.x + panel.plot.width))}" cy="${formatSvg(scale(points[0]!.y, yBounds.minimum, yBounds.maximum, panel.plot.y + panel.plot.height, panel.plot.y))}" r="3.2" fill="${color}" data-marker="first-raw-endpoint"/>`,
  ].join("\n"));
}

function renderLvadPhasePanel(
  panel: Panel,
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
): string {
  const flowBounds = paddedBounds(samples.flatMap((sample) => [
    sample.signal.lvadFlowMlPerSec,
    sample.lvad.unrestrictedFlowMlPerSec,
  ]));
  const phaseX = (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) =>
    scale(sample.cyclePhase01, 0, 1, panel.plot.x,
      panel.plot.x + panel.plot.width);
  const flowY = (value: number) =>
    scale(value, flowBounds.minimum, flowBounds.maximum,
      panel.plot.y + panel.plot.height, panel.plot.y);
  const availabilityY = (value: number) =>
    scale(value, 0, 1, panel.plot.y + panel.plot.height, panel.plot.y);
  const actual = samples.map((sample) =>
    point(phaseX(sample), flowY(sample.signal.lvadFlowMlPerSec))).join(" ");
  const unrestricted = samples.map((sample) =>
    point(phaseX(sample), flowY(sample.lvad.unrestrictedFlowMlPerSec))).join(" ");
  const availability = samples.map((sample) =>
    point(phaseX(sample), availabilityY(sample.lvad.inletAvailability01)))
    .join(" ");
  return renderPanel(panel, "LVAD flow / inlet availability vs phase", [
    renderAxes(panel.plot, Object.freeze({ minimum: 0, maximum: 1 }),
      flowBounds, "accepted cycle phase", "flow (mL/s)"),
    renderRightAxis01(panel.plot, "availability"),
    `<polyline data-series="lvad-accepted-flow" points="${actual}" fill="none" stroke="#2563eb" stroke-width="1.8"/>`,
    `<polyline data-series="lvad-unrestricted-flow" points="${unrestricted}" fill="none" stroke="#64748b" stroke-width="1.35" stroke-dasharray="5 3"/>`,
    `<polyline data-series="lvad-inlet-availability" points="${availability}" fill="none" stroke="#dc2626" stroke-width="1.7"/>`,
    renderSeriesLegend(panel.x + 19, panel.y + 43, [
      Object.freeze({ label: "accepted flow", color: "#2563eb" }),
      Object.freeze({ label: "unrestricted flow", color: "#64748b" }),
      Object.freeze({ label: "availability (right)", color: "#dc2626" }),
    ]),
  ].join("\n"));
}

function renderLvadHeadFlowPanel(
  panel: Panel,
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
): string {
  const flowBounds = paddedBounds(
    samples.map((sample) => sample.signal.lvadFlowMlPerSec),
  );
  const headBounds = paddedBounds(
    samples.map((sample) => sample.lvad.deliveredPumpPressureRiseMmHg),
  );
  const x = (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) =>
    scale(sample.signal.lvadFlowMlPerSec, flowBounds.minimum,
      flowBounds.maximum, panel.plot.x, panel.plot.x + panel.plot.width);
  const y = (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) =>
    scale(sample.lvad.deliveredPumpPressureRiseMmHg, headBounds.minimum,
      headBounds.maximum, panel.plot.y + panel.plot.height, panel.plot.y);
  const rawPolyline = samples.map((sample) => point(x(sample), y(sample)))
    .join(" ");
  const rawPoints = samples.map((sample, index) =>
    `<circle data-series="lvad-hq-owner-points" data-raw-sample-index="${index + 1}" data-constraint-owner="${sample.lvad.constraintOwner}" cx="${formatSvg(x(sample))}" cy="${formatSvg(y(sample))}" r="2.15" fill="${CONSTRAINT_COLOR[sample.lvad.constraintOwner]}"/>`)
    .join("\n");
  return renderPanel(panel,
    "LVAD pump-local H-Q (H = post-pump minus pre-pump)", [
      renderAxes(panel.plot, flowBounds, headBounds,
        "LV→Ao circuit flow Q (mL/s)", "delivered pump head H (mmHg)"),
      `<polyline data-series="lvad-hq-raw-order" points="${rawPolyline}" fill="none" stroke="#94a3b8" stroke-width="1"/>`,
      rawPoints,
    ].join("\n"));
}

function renderValveStatePanel(
  panel: Panel,
  samples: readonly MainWireIntegratedModelTerminalCycleTraceSampleV2[],
): string {
  const areaBounds = paddedBounds(samples.flatMap((sample) => [
    sample.valve.MV.activeEffectiveOrificeAreaCm2,
    sample.valve.AoV.activeEffectiveOrificeAreaCm2,
  ]));
  const x = (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) =>
    scale(sample.cyclePhase01, 0, 1, panel.plot.x,
      panel.plot.x + panel.plot.width);
  const stateY = (value: number) => scale(value, 0, 1,
    panel.plot.y + panel.plot.height, panel.plot.y);
  const areaY = (value: number) => scale(value,
    areaBounds.minimum, areaBounds.maximum,
    panel.plot.y + panel.plot.height, panel.plot.y);
  const line = (
    id: string,
    value: (sample: MainWireIntegratedModelTerminalCycleTraceSampleV2) => number,
    y: (value: number) => number,
    color: string,
    dash = "",
  ) => `<polyline data-series="${id}" points="${samples.map((sample) => point(x(sample), y(value(sample)))).join(" ")}" fill="none" stroke="${color}" stroke-width="1.45"${dash === "" ? "" : ` stroke-dasharray="${dash}"`}/>`;
  const transitionMarkers = samples.slice(1).flatMap((sample, index) => {
    const previous = samples[index]!;
    return (["MV", "AoV"] as const).flatMap((valveId) => {
      if (sample.valve[valveId].openingDriveState
        === previous.valve[valveId].openingDriveState) return [];
      const value = sample.valve[valveId].openingDriveState
        === "positive-opening-target" ? 1 : 0;
      return [`<circle data-series="valve-opening-target-transition" data-valve="${valveId}" data-raw-sample-index="${sample.acceptedStepIndexWithinCycle}" cx="${formatSvg(x(sample))}" cy="${formatSvg(stateY(value))}" r="3" fill="${valveId === "MV" ? "#7c3aed" : "#0f766e"}"/>`];
    });
  }).join("\n");
  return renderPanel(panel,
    "Valve accepted state / target branch / active EOA", [
      renderAxes(panel.plot, Object.freeze({ minimum: 0, maximum: 1 }),
        Object.freeze({ minimum: 0, maximum: 1 }),
        "accepted cycle phase", "leaflet / target state (0–1)"),
      renderRightAxisBounds(panel.plot, areaBounds, "active EOA (cm²)"),
      line("mv-leaflet-opening-fraction", (sample) =>
        sample.valve.MV.leafletOpeningFraction01, stateY, "#7c3aed"),
      line("aov-leaflet-opening-fraction", (sample) =>
        sample.valve.AoV.leafletOpeningFraction01, stateY, "#0f766e"),
      line("mv-positive-opening-target-state", (sample) =>
        sample.valve.MV.openingDriveState === "positive-opening-target" ? 1 : 0,
      stateY, "#c4b5fd", "4 3"),
      line("aov-positive-opening-target-state", (sample) =>
        sample.valve.AoV.openingDriveState === "positive-opening-target" ? 1 : 0,
      stateY, "#99f6e4", "4 3"),
      line("mv-active-eoa", (sample) =>
        sample.valve.MV.activeEffectiveOrificeAreaCm2,
      areaY, "#6d28d9", "2 2"),
      line("aov-active-eoa", (sample) =>
        sample.valve.AoV.activeEffectiveOrificeAreaCm2,
      areaY, "#047857", "2 2"),
      transitionMarkers,
      renderSeriesLegendGrid(panel.x + 19, panel.y + 43, [
        Object.freeze({ label: "MV leaflet", color: "#7c3aed" }),
        Object.freeze({ label: "AoV leaflet", color: "#0f766e" }),
        Object.freeze({ label: "target state (dashed)", color: "#94a3b8" }),
        Object.freeze({ label: "active EOA (right)", color: "#334155" }),
      ]),
    ].join("\n"));
}

function renderConstraintTimeline(
  panel: Panel,
  trace: MainWireIntegratedModelTerminalCycleTraceV2,
): string {
  const samples = trace.samples;
  const laneY = panel.y + 65;
  const laneHeight = 34;
  const duration = trace.endTimeSec - trace.startTimeSec;
  const counts = Object.fromEntries(
    CONSTRAINT_OWNERS.map((owner) => [owner, 0]),
  ) as Record<DynamicRotaryPumpConstraintOwnerV1, number>;
  const intervals = samples.map((sample, index) => {
    counts[sample.lvad.constraintOwner] += 1;
    const intervalStartPhase = Math.max(
      0,
      (sample.acceptedTimeSec - sample.acceptedDtSec - trace.startTimeSec)
        / duration,
    );
    const x0 = scale(intervalStartPhase, 0, 1,
      panel.plot.x, panel.plot.x + panel.plot.width);
    const x1 = scale(sample.cyclePhase01, 0, 1,
      panel.plot.x, panel.plot.x + panel.plot.width);
    return `<rect data-series="constraint-timeline" data-raw-sample-index="${index + 1}" data-constraint-owner="${sample.lvad.constraintOwner}" x="${formatSvg(x0)}" y="${formatSvg(laneY)}" width="${formatSvg(Math.max(0, x1 - x0))}" height="${laneHeight}" fill="${CONSTRAINT_COLOR[sample.lvad.constraintOwner]}"/>`;
  }).join("\n");
  const events = samples.flatMap((sample, index) =>
    sample.acceptedEffectiveActivationEventIds.length === 0
      ? []
      : [`<line data-series="effective-activation-event" data-raw-sample-index="${index + 1}" x1="${formatSvg(scale(sample.cyclePhase01, 0, 1, panel.plot.x, panel.plot.x + panel.plot.width))}" x2="${formatSvg(scale(sample.cyclePhase01, 0, 1, panel.plot.x, panel.plot.x + panel.plot.width))}" y1="${formatSvg(laneY - 7)}" y2="${formatSvg(laneY + laneHeight + 7)}" stroke="#111827" stroke-width="1.3"/>`],
  ).join("\n");
  const tickLabels = [0, 0.25, 0.5, 0.75, 1].map((phase) => {
    const x = scale(phase, 0, 1, panel.plot.x,
      panel.plot.x + panel.plot.width);
    return [
      `<line x1="${formatSvg(x)}" x2="${formatSvg(x)}" y1="${formatSvg(laneY + laneHeight)}" y2="${formatSvg(laneY + laneHeight + 5)}" class="axis-line"/>`,
      `<text x="${formatSvg(x)}" y="${formatSvg(laneY + laneHeight + 20)}" text-anchor="middle" class="tick-label">${formatValue(phase)}</text>`,
    ].join("\n");
  }).join("\n");
  const legend = CONSTRAINT_OWNERS.map((owner, index) => {
    const x = panel.x + 21 + (index % 4) * 285;
    const y = panel.y + 160 + Math.floor(index / 4) * 24;
    return [
      `<rect x="${x}" y="${y - 10}" width="12" height="12" rx="2" fill="${CONSTRAINT_COLOR[owner]}"/>`,
      `<text x="${x + 18}" y="${y}" class="legend-label">${escapeXml(owner)} (n=${counts[owner]})</text>`,
    ].join("\n");
  }).join("\n");
  return renderPanel(panel,
    "LVAD constraint timeline / raw accepted-step legend", [
      `<text x="${panel.x + 19}" y="${panel.y + 43}" class="panel-note">Each colored interval ends at its raw accepted endpoint; width = acceptedDt. Black ticks = effective activation batches.</text>`,
      `<rect x="${formatSvg(panel.plot.x)}" y="${formatSvg(laneY)}" width="${formatSvg(panel.plot.width)}" height="${laneHeight}" fill="#e2e8f0"/>`,
      intervals,
      events,
      tickLabels,
      `<text x="${formatSvg(panel.plot.x + panel.plot.width / 2)}" y="${formatSvg(laneY + laneHeight + 38)}" text-anchor="middle" class="axis-label">accepted cycle phase</text>`,
      legend,
    ].join("\n"));
}

function createPanel(
  x: number,
  y: number,
  width: number,
  height: number,
): Panel {
  return Object.freeze({
    x,
    y,
    width,
    height,
    plot: Object.freeze({
      x: x + 67,
      y: y + 78,
      width: width - 99,
      height: height - 130,
    }),
  });
}

function renderPanel(panel: Panel, title: string, content: string): string {
  return [
    `<g data-panel="${escapeXml(title)}">`,
    `<rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="10" class="panel-background"/>`,
    `<text x="${panel.x + 18}" y="${panel.y + 28}" class="panel-title">${escapeXml(title)}</text>`,
    content,
    "</g>",
  ].join("\n");
}

function renderAxes(
  plot: PlotBox,
  xBounds: NumericBounds,
  yBounds: NumericBounds,
  xLabel: string,
  yLabel: string,
): string {
  const tickCount = 4;
  const lines: string[] = [
    `<rect x="${formatSvg(plot.x)}" y="${formatSvg(plot.y)}" width="${formatSvg(plot.width)}" height="${formatSvg(plot.height)}" fill="#ffffff" stroke="#cbd5e1"/>`,
  ];
  for (let index = 0; index <= tickCount; index += 1) {
    const fraction = index / tickCount;
    const x = plot.x + fraction * plot.width;
    const xValue = xBounds.minimum
      + fraction * (xBounds.maximum - xBounds.minimum);
    const y = plot.y + (1 - fraction) * plot.height;
    const yValue = yBounds.minimum
      + fraction * (yBounds.maximum - yBounds.minimum);
    lines.push(
      `<line x1="${formatSvg(x)}" x2="${formatSvg(x)}" y1="${formatSvg(plot.y)}" y2="${formatSvg(plot.y + plot.height)}" class="grid-line"/>`,
      `<text x="${formatSvg(x)}" y="${formatSvg(plot.y + plot.height + 17)}" text-anchor="middle" class="tick-label">${formatValue(xValue)}</text>`,
      `<line x1="${formatSvg(plot.x)}" x2="${formatSvg(plot.x + plot.width)}" y1="${formatSvg(y)}" y2="${formatSvg(y)}" class="grid-line"/>`,
      `<text x="${formatSvg(plot.x - 7)}" y="${formatSvg(y + 3)}" text-anchor="end" class="tick-label">${formatValue(yValue)}</text>`,
    );
  }
  lines.push(
    `<text x="${formatSvg(plot.x + plot.width / 2)}" y="${formatSvg(plot.y + plot.height + 36)}" text-anchor="middle" class="axis-label">${escapeXml(xLabel)}</text>`,
    `<text x="${formatSvg(plot.x - 51)}" y="${formatSvg(plot.y + plot.height / 2)}" text-anchor="middle" transform="rotate(-90 ${formatSvg(plot.x - 51)} ${formatSvg(plot.y + plot.height / 2)})" class="axis-label">${escapeXml(yLabel)}</text>`,
  );
  return lines.join("\n");
}

function renderRightAxis01(plot: PlotBox, label: string): string {
  return [0, 0.5, 1].map((value) => {
    const y = scale(value, 0, 1, plot.y + plot.height, plot.y);
    return `<text x="${formatSvg(plot.x + plot.width + 7)}" y="${formatSvg(y + 3)}" class="tick-label">${formatValue(value)}</text>`;
  }).concat([
    `<text x="${formatSvg(plot.x + plot.width + 26)}" y="${formatSvg(plot.y + plot.height / 2)}" text-anchor="middle" transform="rotate(90 ${formatSvg(plot.x + plot.width + 26)} ${formatSvg(plot.y + plot.height / 2)})" class="axis-label">${escapeXml(label)}</text>`,
  ]).join("\n");
}

function renderRightAxisBounds(
  plot: PlotBox,
  bounds: NumericBounds,
  label: string,
): string {
  return [0, 0.5, 1].map((fraction) => {
    const value = bounds.minimum + fraction * (bounds.maximum - bounds.minimum);
    const y = scale(value, bounds.minimum, bounds.maximum,
      plot.y + plot.height, plot.y);
    return `<text x="${formatSvg(plot.x + plot.width + 7)}" y="${formatSvg(y + 3)}" class="tick-label">${formatValue(value)}</text>`;
  }).concat([
    `<text x="${formatSvg(plot.x + plot.width + 26)}" y="${formatSvg(plot.y + plot.height / 2)}" text-anchor="middle" transform="rotate(90 ${formatSvg(plot.x + plot.width + 26)} ${formatSvg(plot.y + plot.height / 2)})" class="axis-label">${escapeXml(label)}</text>`,
  ]).join("\n");
}

function renderSeriesLegend(
  x: number,
  y: number,
  entries: readonly Readonly<{ label: string; color: string }>[],
): string {
  return entries.map((entry, index) => {
    const entryX = x + index * 154;
    return [
      `<line x1="${entryX}" x2="${entryX + 18}" y1="${y - 4}" y2="${y - 4}" stroke="${entry.color}" stroke-width="2"/>`,
      `<text x="${entryX + 24}" y="${y}" class="legend-label">${escapeXml(entry.label)}</text>`,
    ].join("\n");
  }).join("\n");
}

function renderSeriesLegendGrid(
  x: number,
  y: number,
  entries: readonly Readonly<{ label: string; color: string }>[],
): string {
  return entries.map((entry, index) => {
    const entryX = x + (index % 2) * 250;
    const entryY = y + Math.floor(index / 2) * 14;
    return [
      `<line x1="${entryX}" x2="${entryX + 18}" y1="${entryY - 4}" y2="${entryY - 4}" stroke="${entry.color}" stroke-width="2"/>`,
      `<text x="${entryX + 24}" y="${entryY}" class="legend-label">${escapeXml(entry.label)}</text>`,
    ].join("\n");
  }).join("\n");
}

function validateTerminalCycleTrace(
  candidate: unknown,
): MainWireIntegratedModelTerminalCycleTraceV2 {
  const trace = record(candidate, "terminal-cycle trace");
  const cycleIndex = positiveSafeInteger(trace.cycleIndex, "cycleIndex");
  const startTimeSec = finiteNumber(trace.startTimeSec, "startTimeSec");
  const endTimeSec = finiteNumber(trace.endTimeSec, "endTimeSec");
  if (!(endTimeSec > startTimeSec)) {
    throw new Error("terminal-cycle trace endTimeSec must exceed startTimeSec");
  }
  const sampleCount = positiveSafeInteger(trace.sampleCount, "sampleCount");
  if (sampleCount > MAX_RAW_ENDPOINT_SAMPLE_COUNT) {
    throw new Error(
      `terminal-cycle trace sampleCount exceeds ${MAX_RAW_ENDPOINT_SAMPLE_COUNT}`,
    );
  }
  if (!Array.isArray(trace.samples) || trace.samples.length !== sampleCount) {
    throw new Error(
      "terminal-cycle trace samples must be a nonempty array matching sampleCount",
    );
  }
  if (trace.retainedForGraphShapeInspection !== true
    || trace.eligibleForNumericalOrPhysiologicalShapeGate !== false
    || trace.interpretation
      !== "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance") {
    throw new Error("terminal-cycle trace diagnostic provenance is invalid");
  }

  const duration = endTimeSec - startTimeSec;
  let previousTimeSec = startTimeSec;
  let previousPhase = 0;
  for (const [zeroBasedIndex, unvalidated] of trace.samples.entries()) {
    const label = `samples[${zeroBasedIndex}]`;
    const sample = record(unvalidated, label);
    if (positiveSafeInteger(sample.cycleIndex, `${label}.cycleIndex`)
      !== cycleIndex) {
      throw new Error(`${label}.cycleIndex does not match trace cycleIndex`);
    }
    if (positiveSafeInteger(
      sample.acceptedStepIndexWithinCycle,
      `${label}.acceptedStepIndexWithinCycle`,
    ) !== zeroBasedIndex + 1) {
      throw new Error(`${label} accepted-step indices must be contiguous from 1`);
    }
    const acceptedTimeSec = finiteNumber(
      sample.acceptedTimeSec,
      `${label}.acceptedTimeSec`,
    );
    const cyclePhase01 = finiteNumber(
      sample.cyclePhase01,
      `${label}.cyclePhase01`,
    );
    const acceptedDtSec = finiteNumber(
      sample.acceptedDtSec,
      `${label}.acceptedDtSec`,
    );
    if (!(acceptedDtSec > 0)) {
      throw new Error(`${label}.acceptedDtSec must be positive`);
    }
    if (!(acceptedTimeSec > previousTimeSec) || acceptedTimeSec > endTimeSec) {
      throw new Error(`${label}.acceptedTimeSec must strictly increase within bounds`);
    }
    if (!(cyclePhase01 > previousPhase) || cyclePhase01 > 1) {
      throw new Error(`${label}.cyclePhase01 must strictly increase in (0, 1]`);
    }
    requireApproximatelyEqual(
      acceptedTimeSec - previousTimeSec,
      acceptedDtSec,
      `${label} accepted time increment versus acceptedDtSec`,
    );
    requireApproximatelyEqual(
      (acceptedTimeSec - startTimeSec) / duration,
      cyclePhase01,
      `${label} accepted time versus cyclePhase01`,
    );

    const signal = record(sample.signal, `${label}.signal`);
    for (const key of SIGNAL_KEYS) {
      finiteNumber(signal[key], `${label}.signal.${key}`);
    }
    const valve = record(sample.valve, `${label}.valve`);
    for (const valveId of ["MV", "AoV"] as const) {
      const endpoint = record(valve[valveId], `${label}.valve.${valveId}`);
      finiteNumber(endpoint.signedFlowMlPerSec,
        `${label}.valve.${valveId}.signedFlowMlPerSec`);
      const leaflet = finiteNumber(endpoint.leafletOpeningFraction01,
        `${label}.valve.${valveId}.leafletOpeningFraction01`);
      const target = finiteNumber(endpoint.openingTarget01,
        `${label}.valve.${valveId}.openingTarget01`);
      if (leaflet < 0 || leaflet > 1 || target < 0 || target > 1) {
        throw new Error(`${label}.valve.${valveId} opening state is out of range`);
      }
      const expectedTargetState = target === 0
        ? "zero-opening-target" : "positive-opening-target";
      if (endpoint.openingDriveState !== expectedTargetState) {
        throw new Error(
          `${label}.valve.${valveId}.openingDriveState is inconsistent`,
        );
      }
      if (typeof endpoint.activeDirection !== "string"
        || !VALVE_DIRECTIONS.includes(
          endpoint.activeDirection as (typeof VALVE_DIRECTIONS)[number],
        )) {
        throw new Error(`${label}.valve.${valveId}.activeDirection is invalid`);
      }
      for (const key of [
        "activeEffectiveOrificeAreaCm2",
        "forwardEffectiveOrificeAreaCm2",
        "reverseEffectiveOrificeAreaCm2",
      ] as const) {
        const area = finiteNumber(endpoint[key],
          `${label}.valve.${valveId}.${key}`);
        if (area < 0) {
          throw new Error(`${label}.valve.${valveId}.${key} must be nonnegative`);
        }
      }
    }
    const lvad = record(sample.lvad, `${label}.lvad`);
    finiteNumber(lvad.unrestrictedFlowMlPerSec,
      `${label}.lvad.unrestrictedFlowMlPerSec`);
    finiteNumber(lvad.flowAccelerationMlPerSec2,
      `${label}.lvad.flowAccelerationMlPerSec2`);
    const availability = finiteNumber(lvad.inletAvailability01,
      `${label}.lvad.inletAvailability01`);
    if (availability < 0 || availability > 1) {
      throw new Error(`${label}.lvad.inletAvailability01 must be within [0, 1]`);
    }
    if (typeof lvad.constraintOwner !== "string"
      || !CONSTRAINT_OWNERS.includes(
        lvad.constraintOwner as DynamicRotaryPumpConstraintOwnerV1,
      )) {
      throw new Error(`${label}.lvad.constraintOwner is invalid`);
    }
    finiteNumber(lvad.constraintReactionMmHg,
      `${label}.lvad.constraintReactionMmHg`);
    if (typeof lvad.forwardFlowEvidenceStatus !== "string"
      || !FORWARD_FLOW_EVIDENCE_STATUSES.includes(
        lvad.forwardFlowEvidenceStatus as
          (typeof FORWARD_FLOW_EVIDENCE_STATUSES)[number],
      )) {
      throw new Error(`${label}.lvad.forwardFlowEvidenceStatus is invalid`);
    }
    for (const key of [
      "forwardFlowPublishedExperimentalTraversalUpperLMin",
      "forwardFlowAdvertisedCapacityLMin",
    ] as const) {
      const value = lvad[key];
      if (value !== null
        && (typeof value !== "number" || !Number.isFinite(value) || value <= 0)) {
        throw new Error(`${label}.lvad.${key} must be null or positive finite`);
      }
    }
    const forwardDomainDeclared =
      lvad.forwardFlowPublishedExperimentalTraversalUpperLMin !== null
      && lvad.forwardFlowAdvertisedCapacityLMin !== null;
    const acceptedLvadFlowMlPerSec = signal.lvadFlowMlPerSec as number;
    if (forwardDomainDeclared && acceptedLvadFlowMlPerSec <= 0
      && lvad.forwardFlowEvidenceStatus
        !== "non-forward-flow-not-applicable") {
      throw new Error(`${label} non-forward LVAD flow cannot be in a forward evidence domain`);
    }
    if (forwardDomainDeclared && acceptedLvadFlowMlPerSec > 0
      && lvad.forwardFlowEvidenceStatus
        === "non-forward-flow-not-applicable") {
      throw new Error(`${label} positive LVAD flow has a non-forward evidence status`);
    }
    if (!forwardDomainDeclared
      && lvad.forwardFlowEvidenceStatus !== "not-declared") {
      throw new Error(`${label} undeclared LVAD evidence domain has an invalid status`);
    }
    const prePumpPressure = finiteNumber(lvad.prePumpPressureMmHg,
      `${label}.lvad.prePumpPressureMmHg`);
    const postPumpPressure = finiteNumber(lvad.postPumpPressureMmHg,
      `${label}.lvad.postPumpPressureMmHg`);
    const deliveredPumpPressureRise = finiteNumber(
      lvad.deliveredPumpPressureRiseMmHg,
      `${label}.lvad.deliveredPumpPressureRiseMmHg`,
    );
    requireApproximatelyEqual(
      postPumpPressure - prePumpPressure,
      deliveredPumpPressureRise,
      `${label} post-minus-pre delivered pump pressure rise`,
    );
    if (!Array.isArray(sample.acceptedEffectiveActivationEventIds)
      || sample.acceptedEffectiveActivationEventIds.some(
        (eventId) => typeof eventId !== "string" || eventId.length === 0,
      )) {
      throw new Error(
        `${label}.acceptedEffectiveActivationEventIds must contain nonempty strings`,
      );
    }
    previousTimeSec = acceptedTimeSec;
    previousPhase = cyclePhase01;
  }
  requireApproximatelyEqual(previousTimeSec, endTimeSec,
    "terminal accepted time versus endTimeSec");
  requireApproximatelyEqual(previousPhase, 1,
    "terminal cyclePhase01 versus 1");
  return candidate as MainWireIntegratedModelTerminalCycleTraceV2;
}

function paddedBounds(values: readonly number[]): NumericBounds {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("cannot construct plot bounds from empty or non-finite data");
  }
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) {
    const halfSpan = Math.max(Math.abs(minimum) * 0.05, 1);
    return Object.freeze({
      minimum: minimum - halfSpan,
      maximum: maximum + halfSpan,
    });
  }
  const padding = 0.05 * (maximum - minimum);
  return Object.freeze({
    minimum: minimum - padding,
    maximum: maximum + padding,
  });
}

function scale(
  value: number,
  domainMinimum: number,
  domainMaximum: number,
  rangeMinimum: number,
  rangeMaximum: number,
): number {
  return rangeMinimum + (value - domainMinimum)
    / (domainMaximum - domainMinimum) * (rangeMaximum - rangeMinimum);
}

function point(x: number, y: number): string {
  return `${formatSvg(x)},${formatSvg(y)}`;
}

function formatSvg(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function formatValue(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 10_000 || magnitude < 0.01)) {
    return value.toExponential(2);
  }
  return Number(value.toFixed(2)).toString();
}

function formatNullable(value: number | null): string {
  return value === null ? "unavailable" : formatValue(value);
}

function validateClassificationContext(
  value: MainWireIntegratedModelTerminalCycleClassificationContextV2,
): MainWireIntegratedModelTerminalCycleClassificationContextV2 {
  if (value !== "unclassified"
    && value !== "period1-converged"
    && value !== "period2-suspect"
    && value !== "not-converged") {
    throw new Error("terminal-cycle classification context is invalid");
  }
  return value;
}

function svgStyle(): string {
  return `
    text { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; fill: #0f172a; }
    .artifact-title { font-size: 21px; font-weight: 700; }
    .artifact-subtitle { font-size: 14px; fill: #334155; }
    .artifact-warning { font-size: 12px; font-weight: 700; fill: #b91c1c; letter-spacing: 0.3px; }
    .artifact-summary { font-size: 10.5px; fill: #334155; }
    .panel-background { fill: #ffffff; stroke: #cbd5e1; stroke-width: 1; }
    .panel-title { font-size: 14px; font-weight: 700; }
    .panel-note { font-size: 11px; fill: #475569; }
    .grid-line { stroke: #e2e8f0; stroke-width: 0.7; }
    .axis-line { stroke: #64748b; stroke-width: 0.8; }
    .tick-label { font-size: 9px; fill: #475569; }
    .axis-label { font-size: 10px; fill: #334155; }
    .legend-label { font-size: 10px; fill: #334155; }
    .footer { font-size: 11px; fill: #64748b; }
    polyline { stroke-linejoin: round; stroke-linecap: round; }
  `;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function positiveSafeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive safe integer`);
  }
  return value;
}

function requireApproximatelyEqual(
  actual: number,
  expected: number,
  label: string,
): void {
  const tolerance = 1e-10 * Math.max(1, Math.abs(actual), Math.abs(expected));
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label} is inconsistent`);
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
