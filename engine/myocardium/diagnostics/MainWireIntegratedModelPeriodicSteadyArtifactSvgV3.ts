export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID =
  "main-wire-integrated-periodic-steady-raw-evidence-svg-v3" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_CLAIM_V3 =
  Object.freeze({
    input:
      "serialized-MainWireIntegratedModelPeriodicSteadyV3-CLI-artifact-only" as const,
    plottedSamples:
      "every-raw-accepted-endpoint-is-one-polyline-vertex-in-accepted-order" as const,
    eventMarkers:
      "accepted-capture-and-scheduled-or-delivered-calcium-identities-from-artifact-only" as const,
    interpolationApplied: false as const,
    resamplingApplied: false as const,
    smoothingApplied: false as const,
    shapeFittingApplied: false as const,
    inferredMissingSignals: false as const,
    shapeAcceptanceClaimed: false as const,
    numericalPeriodicityIsPhysiologicalValidation: false as const,
    referenceGateAssessmentIsIndependentValidation: false as const,
    noncanonicalArtifactMayBeShownAsHealthy: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_UNAVAILABLE_COLUMNS_V3 =
  Object.freeze([
    "separate-LAD-total-inlet-flow",
    "ECG-P-QRS-T-waveforms",
    "valve-leaflet-state-effective-orifice-area-and-pressure-gradient",
    "regional-electrophysiology-beyond-five-lumped-wall-calcium-signals",
    "calcium-deposit-event-class-as-a-dedicated-trace-column",
    "cycle-start-boundary-sample-before-the-first-accepted-step",
  ] as const);

type ExecutionPurpose =
  "canonical-evidence" | "bounded-smoke" | "fixed-horizon-characterization";

type ClassificationStatus =
  "period1-converged" | "period2-suspect" | "not-converged";

type EventKind =
  | "atrial-capture"
  | "ventricular-capture"
  | "calcium-scheduled"
  | "calcium-delivered";

type RawEventIdentity = Readonly<{
  atrialCapturedActivationId: string | null;
  ventricularCapturedActivationId: string | null;
  deliveredCalciumDepositIds: readonly string[];
  scheduledCalciumDepositIds: readonly string[];
}>;

type RawSample = Readonly<{
  cycleIndex: number;
  acceptedStepIndexWithinCycle: number;
  acceptedTimeSec: number;
  cyclePhase01: number;
  acceptedDtSec: number;
  absolutePressureMmHg: Readonly<{ Ao: number; LV: number }>;
  chamberVolumeMl: Readonly<{ LV: number }>;
  valveFlowMlPerSec: Readonly<{ AoV: number; MV: number }>;
  coronary: Readonly<{
    totalInletFlowMlPerSec: number;
    ladSubendocardialQmFlowMlPerSec: number;
  }>;
  freeCalciumUMByWall: Readonly<{
    LA: number;
    LVFW: number;
    SEP: number;
    RVFW: number;
    RA: number;
  }>;
  acceptedEventIdentity: RawEventIdentity;
}>;

type RawTrace = Readonly<{
  cycleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  sampleCount: number;
  samples: readonly RawSample[];
  retainedForGraphShapeInspection: true;
  resamplingApplied: false;
  shapeAcceptanceClaimed: false;
  interpretation: "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance";
}>;

type ValidatedArtifact = Readonly<{
  experimentId: string;
  executionPurpose: ExecutionPurpose;
  protocolIdentityHash: string;
  requestedMaximumCycleCount: number;
  completedCycleCount: number;
  terminationReason: string;
  classificationStatus: ClassificationStatus;
  numericalPeriod1Established: boolean;
  healthAssessmentEligible: boolean;
  healthGateCounts: Readonly<{
    pass: number;
    fail: number;
    notAssessed: number;
  }>;
  healthReason: string;
  terminalCheckpointSha256: string;
  trace: RawTrace;
}>;

type EventMarker = Readonly<{
  kind: EventKind;
  phase01: number;
  acceptedTimeSec: number;
  ids: readonly string[];
}>;

type Panel = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  plot: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;

type Series = Readonly<{
  id: string;
  label: string;
  color: string;
  value: (sample: RawSample) => number;
}>;

const EXPECTED_EXPERIMENT_ID =
  "main-wire-integrated-composed-regular-sinus-all-off-periodic-steady-v3";
const SVG_WIDTH = 1320;
const SVG_HEIGHT = 1580;
const OUTER_MARGIN = 50;
const COLUMN_GAP = 30;
const PANEL_WIDTH = (SVG_WIDTH - 2 * OUTER_MARGIN - COLUMN_GAP) / 2;
const SMALL_PANEL_HEIGHT = 250;
const PANEL_GAP = 30;
const PANEL_TOP = 270;
const CALCIUM_TOP = PANEL_TOP + 2 * (SMALL_PANEL_HEIGHT + PANEL_GAP);
const CALCIUM_HEIGHT = 325;
const EVENT_TOP = CALCIUM_TOP + CALCIUM_HEIGHT + PANEL_GAP;
const EVENT_HEIGHT = 225;
const MAX_RAW_ENDPOINT_SAMPLE_COUNT = 20_000;

const EVENT_STYLE: Readonly<
  Record<EventKind, Readonly<{ color: string; dash: string; label: string }>>
> = Object.freeze({
  "atrial-capture": Object.freeze({
    color: "#d97706",
    dash: "2 3",
    label: "accepted atrial capture",
  }),
  "ventricular-capture": Object.freeze({
    color: "#dc2626",
    dash: "5 3",
    label: "accepted ventricular capture",
  }),
  "calcium-scheduled": Object.freeze({
    color: "#7c3aed",
    dash: "1 3",
    label: "calcium deposit scheduled",
  }),
  "calcium-delivered": Object.freeze({
    color: "#0f766e",
    dash: "7 3",
    label: "calcium deposit delivered",
  }),
});

/**
 * Renders only values present in a serialized V3 periodic CLI artifact. The
 * renderer does not import or execute the numerical model and never creates a
 * new sample between accepted endpoints.
 */
export function renderMainWireIntegratedModelPeriodicSteadyArtifactSvgV3(
  candidate: unknown,
): string {
  const artifact = validateArtifact(candidate);
  const samples = artifact.trace.samples;
  const eventMarkers = collectEventMarkers(samples);
  const leftX = OUTER_MARGIN;
  const rightX = OUTER_MARGIN + PANEL_WIDTH + COLUMN_GAP;
  const rowY = (row: number) =>
    PANEL_TOP + row * (SMALL_PANEL_HEIGHT + PANEL_GAP);

  const panels = [
    renderSeriesPanel(
      createPanel(leftX, rowY(0), PANEL_WIDTH, SMALL_PANEL_HEIGHT),
      "Ao / LV absolute pressure — raw accepted endpoints",
      "pressure (mmHg)",
      samples,
      [
        {
          id: "aortic-pressure",
          label: "Ao pressure",
          color: "#2563eb",
          value: (sample) => sample.absolutePressureMmHg.Ao,
        },
        {
          id: "left-ventricular-pressure",
          label: "LV pressure",
          color: "#dc2626",
          value: (sample) => sample.absolutePressureMmHg.LV,
        },
      ],
    ),
    renderSeriesPanel(
      createPanel(rightX, rowY(0), PANEL_WIDTH, SMALL_PANEL_HEIGHT),
      "LV chamber blood volume — raw accepted endpoints",
      "volume (mL)",
      samples,
      [
        {
          id: "left-ventricular-volume",
          label: "LV volume",
          color: "#7c3aed",
          value: (sample) => sample.chamberVolumeMl.LV,
        },
      ],
    ),
    renderSeriesPanel(
      createPanel(leftX, rowY(1), PANEL_WIDTH, SMALL_PANEL_HEIGHT),
      "Native valve flow — raw accepted endpoints",
      "flow (mL/s)",
      samples,
      [
        {
          id: "aortic-valve-flow",
          label: "AoV LV→Ao",
          color: "#0f766e",
          value: (sample) => sample.valveFlowMlPerSec.AoV,
        },
        {
          id: "mitral-valve-flow",
          label: "MV LA→LV",
          color: "#d97706",
          value: (sample) => sample.valveFlowMlPerSec.MV,
        },
      ],
    ),
    renderSeriesPanel(
      createPanel(rightX, rowY(1), PANEL_WIDTH, SMALL_PANEL_HEIGHT),
      "Coronary flow at two artifact stations",
      "flow (mL/s)",
      samples,
      [
        {
          id: "total-coronary-inlet-flow",
          label: "aggregate Ao→coronary inlets",
          color: "#0369a1",
          value: (sample) => sample.coronary.totalInletFlowMlPerSec,
        },
        {
          id: "lad-subendocardial-qm-flow",
          label: "LAD subendo internal Qm",
          color: "#e11d48",
          value: (sample) => sample.coronary.ladSubendocardialQmFlowMlPerSec,
        },
      ],
    ),
    renderSeriesPanel(
      createPanel(
        OUTER_MARGIN,
        CALCIUM_TOP,
        SVG_WIDTH - 2 * OUTER_MARGIN,
        CALCIUM_HEIGHT,
      ),
      "Five lumped wall free-calcium signals with accepted event guides",
      "free calcium (µM)",
      samples,
      [
        {
          id: "calcium-LA",
          label: "LA",
          color: "#ea580c",
          value: (sample) => sample.freeCalciumUMByWall.LA,
        },
        {
          id: "calcium-LVFW",
          label: "LVFW",
          color: "#2563eb",
          value: (sample) => sample.freeCalciumUMByWall.LVFW,
        },
        {
          id: "calcium-SEP",
          label: "SEP",
          color: "#7c3aed",
          value: (sample) => sample.freeCalciumUMByWall.SEP,
        },
        {
          id: "calcium-RVFW",
          label: "RVFW",
          color: "#16a34a",
          value: (sample) => sample.freeCalciumUMByWall.RVFW,
        },
        {
          id: "calcium-RA",
          label: "RA",
          color: "#dc2626",
          value: (sample) => sample.freeCalciumUMByWall.RA,
        },
      ],
      eventMarkers,
    ),
    renderEventTimeline(
      createPanel(
        OUTER_MARGIN,
        EVENT_TOP,
        SVG_WIDTH - 2 * OUTER_MARGIN,
        EVENT_HEIGHT,
      ),
      artifact.trace,
      eventMarkers,
    ),
  ];

  const banner = assessmentBanner(artifact);
  const metadata = Object.freeze({
    artifactId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID,
    claim: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_CLAIM_V3,
    source: Object.freeze({
      experimentId: artifact.experimentId,
      executionPurpose: artifact.executionPurpose,
      protocolIdentityHash: artifact.protocolIdentityHash,
      completedCycleCount: artifact.completedCycleCount,
      terminalCycleIndex: artifact.trace.cycleIndex,
      classificationStatus: artifact.classificationStatus,
      numericalPeriod1Established: artifact.numericalPeriod1Established,
      healthAssessmentEligible: artifact.healthAssessmentEligible,
      healthReason: artifact.healthReason,
      terminalCheckpointSha256: artifact.terminalCheckpointSha256,
    }),
    plottedColumnPaths: Object.freeze([
      "terminalCycleTrace.samples[].absolutePressureMmHg.{Ao,LV}",
      "terminalCycleTrace.samples[].chamberVolumeMl.LV",
      "terminalCycleTrace.samples[].valveFlowMlPerSec.{AoV,MV}",
      "terminalCycleTrace.samples[].coronary.{totalInletFlowMlPerSec,ladSubendocardialQmFlowMlPerSec}",
      "terminalCycleTrace.samples[].freeCalciumUMByWall.{LA,LVFW,SEP,RVFW,RA}",
      "terminalCycleTrace.samples[].acceptedEventIdentity",
    ]),
    unavailableColumnsNotInferred:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_UNAVAILABLE_COLUMNS_V3,
  });
  const gateSummary = `${artifact.healthGateCounts.pass} pass / ${artifact.healthGateCounts.fail} fail / ${artifact.healthGateCounts.notAssessed} not-assessed`;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" role="img" aria-labelledby="artifact-title artifact-description">`,
    `<metadata>${escapeXml(JSON.stringify(metadata))}</metadata>`,
    '<style>text{font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#0f172a}.panel-title{font-size:15px;font-weight:700}.axis-label{font-size:11px;fill:#475569}.legend{font-size:11px}.header{font-size:13px;fill:#334155}.small{font-size:10px;fill:#64748b}</style>',
    '<rect width="100%" height="100%" fill="#f8fafc"/>',
    `<text id="artifact-title" x="${OUTER_MARGIN}" y="38" font-size="24" font-weight="750">Integrated V3 — raw terminal-cycle evidence</text>`,
    `<text id="artifact-description" x="${OUTER_MARGIN}" y="61" class="header">${escapeXml(`cycle ${artifact.trace.cycleIndex}; ${artifact.trace.sampleCount} accepted endpoint samples; ${formatValue(artifact.trace.startTimeSec)}–${formatValue(artifact.trace.endTimeSec)} s`)}</text>`,
    `<rect x="${OUTER_MARGIN}" y="76" width="${SVG_WIDTH - 2 * OUTER_MARGIN}" height="48" rx="8" fill="${banner.fill}" stroke="${banner.stroke}"/>`,
    `<text x="${SVG_WIDTH / 2}" y="106" text-anchor="middle" font-size="15" font-weight="750" style="fill:${banner.textColor}">${escapeXml(banner.label)}</text>`,
    `<text x="${OUTER_MARGIN}" y="149" class="header">${escapeXml(`executionPurpose: ${artifact.executionPurpose} | numerical classification: ${artifact.classificationStatus} | termination: ${artifact.terminationReason}`)}</text>`,
    `<text x="${OUTER_MARGIN}" y="171" class="header">${escapeXml(`reference-context gate status: ${gateSummary}`)}</text>`,
    `<text x="${OUTER_MARGIN}" y="193" class="header">${escapeXml(artifact.healthReason)}</text>`,
    `<text x="${OUTER_MARGIN}" y="215" class="header">Numerical periodicity and reference-context gates are not physiological, clinical, or release validation.</text>`,
    `<rect x="${OUTER_MARGIN}" y="230" width="395" height="27" rx="13" fill="#0f172a"/>`,
    `<text x="${OUTER_MARGIN + 197.5}" y="248" text-anchor="middle" font-size="12" font-weight="700" style="fill:#ffffff">RAW ACCEPTED ENDPOINTS ONLY — NO RESAMPLING</text>`,
    panels.join(""),
    `<text x="${OUTER_MARGIN}" y="1515" class="small">Polyline vertices are the accepted endpoint sequence; straight SVG segments only connect adjacent endpoints. No interpolation samples, smoothing, or fitting.</text>`,
    `<text x="${OUTER_MARGIN}" y="1534" class="small">Coronary panel contains aggregate inlet and LAD subendocardial internal Qm only; a separate LAD-total inlet column is absent and is not inferred.</text>`,
    `<text x="${OUTER_MARGIN}" y="1553" class="small">No ECG/QRS, valve-state/gradient, or regional electrophysiology is present in this artifact. Deposit class is not inferred from identity text.</text>`,
    `<!-- ${MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_ARTIFACT_SVG_V3_ID} -->`,
    "</svg>",
  ].join("");
}

function renderSeriesPanel(
  panel: Panel,
  title: string,
  yLabel: string,
  samples: readonly RawSample[],
  series: readonly Series[],
  eventMarkers: readonly EventMarker[] = [],
): string {
  const values = series.flatMap((item) => samples.map(item.value));
  const bounds = paddedBounds(values);
  const xAt = (phase01: number) => panel.plot.x + phase01 * panel.plot.width;
  const yAt = (value: number) =>
    panel.plot.y +
    panel.plot.height *
      (1 - (value - bounds.minimum) / (bounds.maximum - bounds.minimum));
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((fraction) => {
      const x = xAt(fraction);
      return `<line x1="${x}" y1="${panel.plot.y}" x2="${x}" y2="${panel.plot.y + panel.plot.height}" stroke="#e2e8f0"/><text x="${x}" y="${panel.plot.y + panel.plot.height + 19}" text-anchor="middle" class="axis-label">${fraction.toFixed(2)}</text>`;
    })
    .join("");
  const yGrid = [0, 0.5, 1]
    .map((fraction) => {
      const value =
        bounds.minimum + fraction * (bounds.maximum - bounds.minimum);
      const y = yAt(value);
      return `<line x1="${panel.plot.x}" y1="${y}" x2="${panel.plot.x + panel.plot.width}" y2="${y}" stroke="#e2e8f0"/><text x="${panel.plot.x - 8}" y="${y + 4}" text-anchor="end" class="axis-label">${formatValue(value)}</text>`;
    })
    .join("");
  const guides = eventMarkers
    .map((marker) => {
      const style = EVENT_STYLE[marker.kind];
      const x = xAt(marker.phase01);
      return `<line data-event-guide="${marker.kind}" x1="${x}" y1="${panel.plot.y}" x2="${x}" y2="${panel.plot.y + panel.plot.height}" stroke="${style.color}" stroke-dasharray="${style.dash}" opacity="0.28"><title>${escapeXml(`${style.label} at ${formatValue(marker.acceptedTimeSec)} s; ${marker.ids.join(", ")}`)}</title></line>`;
    })
    .join("");
  const curves = series
    .map((item) => {
      const points = samples
        .map(
          (sample) => `${xAt(sample.cyclePhase01)},${yAt(item.value(sample))}`,
        )
        .join(" ");
      return `<polyline data-series="${escapeXml(item.id)}" data-sample-source="raw-accepted-endpoints" data-raw-endpoint-count="${samples.length}" fill="none" stroke="${item.color}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" points="${points}"/>`;
    })
    .join("");
  const legend = series
    .map((item, index) => {
      const x =
        panel.plot.x + index * Math.min(175, panel.plot.width / series.length);
      const y = panel.y + 38;
      return `<line x1="${x}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="${item.color}" stroke-width="2"/><text x="${x + 26}" y="${y + 4}" class="legend">${escapeXml(item.label)}</text>`;
    })
    .join("");
  return [
    `<g data-panel="${escapeXml(title)}">`,
    `<rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="8" fill="#ffffff" stroke="#cbd5e1"/>`,
    `<text x="${panel.x + 18}" y="${panel.y + 23}" class="panel-title">${escapeXml(title)}</text>`,
    legend,
    grid,
    yGrid,
    `<line x1="${panel.plot.x}" y1="${panel.plot.y + panel.plot.height}" x2="${panel.plot.x + panel.plot.width}" y2="${panel.plot.y + panel.plot.height}" stroke="#64748b"/>`,
    `<line x1="${panel.plot.x}" y1="${panel.plot.y}" x2="${panel.plot.x}" y2="${panel.plot.y + panel.plot.height}" stroke="#64748b"/>`,
    `<text x="${panel.plot.x + panel.plot.width / 2}" y="${panel.y + panel.height - 7}" text-anchor="middle" class="axis-label">accepted cycle phase (0–1)</text>`,
    `<text x="${panel.x + 12}" y="${panel.plot.y + panel.plot.height / 2}" transform="rotate(-90 ${panel.x + 12} ${panel.plot.y + panel.plot.height / 2})" text-anchor="middle" class="axis-label">${escapeXml(yLabel)}</text>`,
    guides,
    curves,
    "</g>",
  ].join("");
}

function renderEventTimeline(
  panel: Panel,
  trace: RawTrace,
  eventMarkers: readonly EventMarker[],
): string {
  const lanes = Object.keys(EVENT_STYLE) as EventKind[];
  const plot = Object.freeze({
    x: panel.x + 235,
    y: panel.y + 46,
    width: panel.width - 255,
    height: panel.height - 82,
  });
  const xAt = (phase01: number) => plot.x + phase01 * plot.width;
  const laneGap = plot.height / lanes.length;
  const xTicks = [0, 0.25, 0.5, 0.75, 1]
    .map((phase) => {
      const x = xAt(phase);
      return `<line x1="${x}" y1="${plot.y - 8}" x2="${x}" y2="${plot.y + plot.height}" stroke="#e2e8f0"/><text x="${x}" y="${plot.y + plot.height + 20}" text-anchor="middle" class="axis-label">${phase.toFixed(2)}</text>`;
    })
    .join("");
  const laneSvg = lanes
    .map((kind, laneIndex) => {
      const style = EVENT_STYLE[kind];
      const y = plot.y + (laneIndex + 0.5) * laneGap;
      const markers = eventMarkers
        .filter((marker) => marker.kind === kind)
        .map((marker) => {
          const x = xAt(marker.phase01);
          return `<circle data-event-marker="${kind}" data-event-identity-count="${marker.ids.length}" cx="${x}" cy="${y}" r="5" fill="${style.color}" stroke="#ffffff" stroke-width="1"><title>${escapeXml(`${style.label} at ${formatValue(marker.acceptedTimeSec)} s; ${marker.ids.join(", ")}`)}</title></circle>`;
        })
        .join("");
      return `<text x="${plot.x - 12}" y="${y + 4}" text-anchor="end" class="legend">${escapeXml(style.label)}</text><line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" stroke="#cbd5e1"/>${markers}`;
    })
    .join("");
  const absence =
    eventMarkers.length === 0
      ? `<text x="${plot.x + plot.width / 2}" y="${plot.y + plot.height / 2}" text-anchor="middle" class="axis-label">no accepted event identities are present in this terminal-cycle trace</text>`
      : "";
  return [
    '<g data-panel="accepted-event-timeline">',
    `<rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="8" fill="#ffffff" stroke="#cbd5e1"/>`,
    `<text x="${panel.x + 18}" y="${panel.y + 25}" class="panel-title">Accepted event identity timeline — artifact columns only</text>`,
    `<text x="${panel.x + panel.width - 18}" y="${panel.y + 25}" text-anchor="end" class="small">cycle ${trace.cycleIndex}; marker text available in SVG title</text>`,
    xTicks,
    laneSvg,
    absence,
    "</g>",
  ].join("");
}

function collectEventMarkers(samples: readonly RawSample[]): EventMarker[] {
  const markers: EventMarker[] = [];
  for (const sample of samples) {
    const identity = sample.acceptedEventIdentity;
    if (identity.atrialCapturedActivationId !== null) {
      markers.push(
        Object.freeze({
          kind: "atrial-capture" as const,
          phase01: sample.cyclePhase01,
          acceptedTimeSec: sample.acceptedTimeSec,
          ids: Object.freeze([identity.atrialCapturedActivationId]),
        }),
      );
    }
    if (identity.ventricularCapturedActivationId !== null) {
      markers.push(
        Object.freeze({
          kind: "ventricular-capture" as const,
          phase01: sample.cyclePhase01,
          acceptedTimeSec: sample.acceptedTimeSec,
          ids: Object.freeze([identity.ventricularCapturedActivationId]),
        }),
      );
    }
    if (identity.scheduledCalciumDepositIds.length > 0) {
      markers.push(
        Object.freeze({
          kind: "calcium-scheduled" as const,
          phase01: sample.cyclePhase01,
          acceptedTimeSec: sample.acceptedTimeSec,
          ids: identity.scheduledCalciumDepositIds,
        }),
      );
    }
    if (identity.deliveredCalciumDepositIds.length > 0) {
      markers.push(
        Object.freeze({
          kind: "calcium-delivered" as const,
          phase01: sample.cyclePhase01,
          acceptedTimeSec: sample.acceptedTimeSec,
          ids: identity.deliveredCalciumDepositIds,
        }),
      );
    }
  }
  return markers;
}

function validateArtifact(candidate: unknown): ValidatedArtifact {
  const artifact = record(candidate, "V3 periodic artifact");
  if (artifact.artifactSchemaVersion !== 3) {
    throw new Error("V3 periodic artifactSchemaVersion must equal 3");
  }
  const experimentId = nonemptyString(artifact.experimentId, "experimentId");
  if (experimentId !== EXPECTED_EXPERIMENT_ID) {
    throw new Error("V3 periodic artifact experimentId differs");
  }
  const executionPurpose = purpose(artifact.executionPurpose);
  const protocolIdentityHash = sha256(
    artifact.protocolIdentityHash,
    "protocolIdentityHash",
  );
  const requestedMaximumCycleCount = positiveInteger(
    artifact.requestedMaximumCycleCount,
    "requestedMaximumCycleCount",
  );
  const completedCycleCount = positiveInteger(
    artifact.completedCycleCount,
    "completedCycleCount",
  );
  if (completedCycleCount > requestedMaximumCycleCount) {
    throw new Error("completedCycleCount exceeds requestedMaximumCycleCount");
  }
  const terminationReason = nonemptyString(
    artifact.terminationReason,
    "terminationReason",
  );
  if (
    terminationReason !== "period1-converged" &&
    terminationReason !== "period2-suspect" &&
    terminationReason !== "maximum-cycles-reached"
  ) {
    throw new Error("terminationReason is invalid");
  }
  const classification = record(artifact.classification, "classification");
  const classificationStatus = classificationValue(classification.status);
  if (
    executionPurpose !== "canonical-evidence" &&
    classificationStatus !== "not-converged"
  ) {
    throw new Error(
      "exploratory executionPurpose cannot establish a periodic classification",
    );
  }
  const expectedTerminationReason =
    classificationStatus === "period1-converged"
      ? "period1-converged"
      : classificationStatus === "period2-suspect"
        ? "period2-suspect"
        : "maximum-cycles-reached";
  if (terminationReason !== expectedTerminationReason) {
    throw new Error("terminationReason and classification.status differ");
  }
  const numericalPeriod1Established = boolean(
    artifact.numericalPeriod1Established,
    "numericalPeriod1Established",
  );
  if (
    numericalPeriod1Established !==
    (executionPurpose === "canonical-evidence" &&
      classificationStatus === "period1-converged")
  ) {
    throw new Error(
      "numericalPeriod1Established is inconsistent with canonical P1 classification",
    );
  }
  requireExactFalse(
    artifact.physiologicalAcceptanceEstablished,
    "physiologicalAcceptanceEstablished",
  );
  requireExactFalse(
    artifact.independentValidationEstablished,
    "independentValidationEstablished",
  );
  requireExactFalse(
    artifact.releaseAcceptanceEstablished,
    "releaseAcceptanceEstablished",
  );
  if (artifact.allCyclesFiniteConservedAndEventExact !== true) {
    throw new Error(
      "raw evidence renderer requires allCyclesFiniteConservedAndEventExact",
    );
  }
  if (artifact.terminalCheckpointExactRoundTripVerified !== true) {
    throw new Error(
      "raw evidence renderer requires exact terminal checkpoint round-trip",
    );
  }
  const checkpoint = record(artifact.terminalCheckpoint, "terminalCheckpoint");
  const terminalCheckpointSha256 = sha256(
    checkpoint.checkpointSha256,
    "terminalCheckpoint.checkpointSha256",
  );
  const health = record(
    artifact.terminalHealthyReferenceProjection,
    "terminalHealthyReferenceProjection",
  );
  requireExactFalse(
    health.physiologyValidated,
    "terminalHealthyReferenceProjection.physiologyValidated",
  );
  requireExactFalse(
    health.clinicalValidationClaimed,
    "terminalHealthyReferenceProjection.clinicalValidationClaimed",
  );
  if (
    health.comparisonRole !== "construction-context-not-independent-validation"
  ) {
    throw new Error("health comparisonRole differs");
  }
  const eligibility = record(
    health.assessmentEligibility,
    "terminalHealthyReferenceProjection.assessmentEligibility",
  );
  if (
    eligibility.requirement !==
    "canonical-evidence-and-numerical-period1-converged"
  ) {
    throw new Error("health assessment eligibility requirement differs");
  }
  const healthAssessmentEligible = boolean(
    eligibility.eligible,
    "health assessment eligible",
  );
  if (
    eligibility.executionPurpose !== executionPurpose ||
    eligibility.numericalPeriod1Established !== numericalPeriod1Established ||
    healthAssessmentEligible !== numericalPeriod1Established
  ) {
    throw new Error(
      "health eligibility is inconsistent with execution purpose and canonical P1",
    );
  }
  const gates = array(health.gateResults, "health gateResults");
  if (gates.length !== 6) {
    throw new Error("health gateResults must contain the six V3 context gates");
  }
  const statuses = gates.map((gate, index) => {
    const status = record(gate, `health gateResults[${index}]`).status;
    if (status !== "pass" && status !== "fail" && status !== "not-assessed") {
      throw new Error(`health gateResults[${index}].status is invalid`);
    }
    return status;
  });
  if (
    healthAssessmentEligible
      ? statuses.some((status) => status === "not-assessed")
      : statuses.some((status) => status !== "not-assessed")
  ) {
    throw new Error(
      "health gate statuses are inconsistent with assessment eligibility",
    );
  }
  const healthGateCounts = Object.freeze({
    pass: statuses.filter((status) => status === "pass").length,
    fail: statuses.filter((status) => status === "fail").length,
    notAssessed: statuses.filter((status) => status === "not-assessed").length,
  });
  const healthReason = healthAssessmentEligible
    ? "Reference-context gates are assessment-eligible because canonical numerical P1 is established; this remains construction context, not independent validation."
    : executionPurpose !== "canonical-evidence"
      ? `NOT ASSESSED: executionPurpose=${executionPurpose} is exploratory; reference-context gates require canonical-evidence with numerical P1.`
      : "NOT ASSESSED: canonical evidence has not established numerical P1 convergence.";
  const trace = validateTrace(artifact.terminalCycleTrace);
  if (trace.cycleIndex !== completedCycleCount) {
    throw new Error(
      "terminalCycleTrace.cycleIndex must equal completedCycleCount",
    );
  }
  return Object.freeze({
    experimentId,
    executionPurpose,
    protocolIdentityHash,
    requestedMaximumCycleCount,
    completedCycleCount,
    terminationReason,
    classificationStatus,
    numericalPeriod1Established,
    healthAssessmentEligible,
    healthGateCounts,
    healthReason,
    terminalCheckpointSha256,
    trace,
  });
}

function validateTrace(candidate: unknown): RawTrace {
  const trace = record(candidate, "terminalCycleTrace");
  const cycleIndex = positiveInteger(trace.cycleIndex, "trace cycleIndex");
  const startTimeSec = nonnegativeFinite(
    trace.startTimeSec,
    "trace startTimeSec",
  );
  const endTimeSec = finite(trace.endTimeSec, "trace endTimeSec");
  if (!(endTimeSec > startTimeSec)) {
    throw new Error("trace endTimeSec must exceed startTimeSec");
  }
  const sampleCount = positiveInteger(trace.sampleCount, "trace sampleCount");
  if (sampleCount > MAX_RAW_ENDPOINT_SAMPLE_COUNT) {
    throw new Error("trace sampleCount exceeds renderer safety cap");
  }
  const rawSamples = array(trace.samples, "trace samples");
  if (rawSamples.length !== sampleCount) {
    throw new Error("trace samples must match sampleCount");
  }
  if (
    trace.retainedForGraphShapeInspection !== true ||
    trace.resamplingApplied !== false ||
    trace.shapeAcceptanceClaimed !== false ||
    trace.interpretation !==
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance"
  ) {
    throw new Error("trace raw endpoint provenance is invalid");
  }
  const durationSec = endTimeSec - startTimeSec;
  let previousTimeSec = startTimeSec;
  let previousPhase01 = 0;
  let acceptedDurationSec = 0;
  const atrialIds = new Set<string>();
  const ventricularIds = new Set<string>();
  const scheduledIds = new Set<string>();
  const deliveredIds = new Set<string>();
  const samples = rawSamples.map((sample, index) => {
    const parsed = validateSample(sample, index, cycleIndex);
    if (
      !(parsed.acceptedTimeSec > previousTimeSec) ||
      !(parsed.cyclePhase01 > previousPhase01)
    ) {
      throw new Error("trace accepted time and cyclePhase01 must increase");
    }
    if (
      !nearlyEqual(
        parsed.acceptedTimeSec - previousTimeSec,
        parsed.acceptedDtSec,
      )
    ) {
      throw new Error("trace acceptedDtSec does not match adjacent endpoints");
    }
    if (
      !nearlyEqual(
        parsed.cyclePhase01,
        (parsed.acceptedTimeSec - startTimeSec) / durationSec,
      )
    ) {
      throw new Error("trace cyclePhase01 does not match accepted time");
    }
    acceptUniqueNullable(
      atrialIds,
      parsed.acceptedEventIdentity.atrialCapturedActivationId,
      "atrial capture identity",
    );
    acceptUniqueNullable(
      ventricularIds,
      parsed.acceptedEventIdentity.ventricularCapturedActivationId,
      "ventricular capture identity",
    );
    acceptUniqueArray(
      scheduledIds,
      parsed.acceptedEventIdentity.scheduledCalciumDepositIds,
      "scheduled calcium identity",
    );
    acceptUniqueArray(
      deliveredIds,
      parsed.acceptedEventIdentity.deliveredCalciumDepositIds,
      "delivered calcium identity",
    );
    previousTimeSec = parsed.acceptedTimeSec;
    previousPhase01 = parsed.cyclePhase01;
    acceptedDurationSec += parsed.acceptedDtSec;
    return parsed;
  });
  if (
    !nearlyEqual(previousTimeSec, endTimeSec) ||
    !nearlyEqual(previousPhase01, 1) ||
    !nearlyEqual(acceptedDurationSec, durationSec)
  ) {
    throw new Error("trace does not span its complete terminal cycle");
  }
  return Object.freeze({
    cycleIndex,
    startTimeSec,
    endTimeSec,
    sampleCount,
    samples: Object.freeze(samples),
    retainedForGraphShapeInspection: true as const,
    resamplingApplied: false as const,
    shapeAcceptanceClaimed: false as const,
    interpretation:
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" as const,
  });
}

function validateSample(
  candidate: unknown,
  zeroBasedIndex: number,
  cycleIndex: number,
): RawSample {
  const path = `trace samples[${zeroBasedIndex}]`;
  const sample = record(candidate, path);
  if (sample.cycleIndex !== cycleIndex) {
    throw new Error(`${path}.cycleIndex differs`);
  }
  if (sample.acceptedStepIndexWithinCycle !== zeroBasedIndex + 1) {
    throw new Error(`${path}.acceptedStepIndexWithinCycle differs`);
  }
  const acceptedTimeSec = finite(
    sample.acceptedTimeSec,
    `${path}.acceptedTimeSec`,
  );
  const cyclePhase01 = finite(sample.cyclePhase01, `${path}.cyclePhase01`);
  if (!(cyclePhase01 > 0 && cyclePhase01 <= 1)) {
    throw new Error(`${path}.cyclePhase01 must be in (0,1]`);
  }
  const acceptedDtSec = positiveFinite(
    sample.acceptedDtSec,
    `${path}.acceptedDtSec`,
  );
  const pressure = record(sample.absolutePressureMmHg, `${path}.pressure`);
  const chamberVolume = record(sample.chamberVolumeMl, `${path}.volume`);
  const valveFlow = record(sample.valveFlowMlPerSec, `${path}.valveFlow`);
  const coronary = record(sample.coronary, `${path}.coronary`);
  const calcium = record(sample.freeCalciumUMByWall, `${path}.calcium`);
  const identity = record(
    sample.acceptedEventIdentity,
    `${path}.acceptedEventIdentity`,
  );
  return Object.freeze({
    cycleIndex,
    acceptedStepIndexWithinCycle: zeroBasedIndex + 1,
    acceptedTimeSec,
    cyclePhase01,
    acceptedDtSec,
    absolutePressureMmHg: Object.freeze({
      Ao: finite(pressure.Ao, `${path}.absolutePressureMmHg.Ao`),
      LV: finite(pressure.LV, `${path}.absolutePressureMmHg.LV`),
    }),
    chamberVolumeMl: Object.freeze({
      LV: finite(chamberVolume.LV, `${path}.chamberVolumeMl.LV`),
    }),
    valveFlowMlPerSec: Object.freeze({
      AoV: finite(valveFlow.AoV, `${path}.valveFlowMlPerSec.AoV`),
      MV: finite(valveFlow.MV, `${path}.valveFlowMlPerSec.MV`),
    }),
    coronary: Object.freeze({
      totalInletFlowMlPerSec: finite(
        coronary.totalInletFlowMlPerSec,
        `${path}.coronary.totalInletFlowMlPerSec`,
      ),
      ladSubendocardialQmFlowMlPerSec: finite(
        coronary.ladSubendocardialQmFlowMlPerSec,
        `${path}.coronary.ladSubendocardialQmFlowMlPerSec`,
      ),
    }),
    freeCalciumUMByWall: Object.freeze({
      LA: finite(calcium.LA, `${path}.freeCalciumUMByWall.LA`),
      LVFW: finite(calcium.LVFW, `${path}.freeCalciumUMByWall.LVFW`),
      SEP: finite(calcium.SEP, `${path}.freeCalciumUMByWall.SEP`),
      RVFW: finite(calcium.RVFW, `${path}.freeCalciumUMByWall.RVFW`),
      RA: finite(calcium.RA, `${path}.freeCalciumUMByWall.RA`),
    }),
    acceptedEventIdentity: Object.freeze({
      atrialCapturedActivationId: nullableString(
        identity.atrialCapturedActivationId,
        `${path}.atrialCapturedActivationId`,
      ),
      ventricularCapturedActivationId: nullableString(
        identity.ventricularCapturedActivationId,
        `${path}.ventricularCapturedActivationId`,
      ),
      deliveredCalciumDepositIds: stringArray(
        identity.deliveredCalciumDepositIds,
        `${path}.deliveredCalciumDepositIds`,
      ),
      scheduledCalciumDepositIds: stringArray(
        identity.scheduledCalciumDepositIds,
        `${path}.scheduledCalciumDepositIds`,
      ),
    }),
  });
}

function assessmentBanner(artifact: ValidatedArtifact) {
  if (artifact.healthAssessmentEligible) {
    return Object.freeze({
      label:
        "REFERENCE-CONTEXT ASSESSMENT ELIGIBLE — NOT PHYSIOLOGICAL VALIDATION",
      fill: "#dbeafe",
      stroke: "#2563eb",
      textColor: "#1e3a8a",
    });
  }
  return Object.freeze({
    label: "EXPLORATORY — NOT A HEALTH WAVEFORM ASSESSMENT",
    fill: "#ffedd5",
    stroke: "#ea580c",
    textColor: "#9a3412",
  });
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
      x: x + 68,
      y: y + 52,
      width: width - 88,
      height: height - 100,
    }),
  });
}

function paddedBounds(values: readonly number[]) {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
    throw new Error("SVG series contains nonfinite values");
  }
  const span = maximum - minimum;
  const padding =
    span > 0 ? 0.05 * span : Math.max(1, Math.abs(minimum) * 0.05);
  return Object.freeze({
    minimum: minimum - padding,
    maximum: maximum + padding,
  });
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function nonnegativeFinite(value: unknown, label: string): number {
  const parsed = finite(value, label);
  if (parsed < 0) throw new Error(`${label} must be nonnegative`);
  return parsed;
}

function positiveFinite(value: unknown, label: string): number {
  const parsed = finite(value, label);
  if (!(parsed > 0)) throw new Error(`${label} must be positive`);
  return parsed;
}

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value as number;
}

function nonemptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  return value === null ? null : nonemptyString(value, label);
}

function stringArray(value: unknown, label: string): readonly string[] {
  const values = array(value, label).map((item, index) =>
    nonemptyString(item, `${label}[${index}]`),
  );
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} contains duplicate identities`);
  }
  return Object.freeze(values);
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be boolean`);
  return value;
}

function requireExactFalse(value: unknown, label: string): void {
  if (value !== false) throw new Error(`${label} must remain false`);
}

function purpose(value: unknown): ExecutionPurpose {
  if (
    value !== "canonical-evidence" &&
    value !== "bounded-smoke" &&
    value !== "fixed-horizon-characterization"
  ) {
    throw new Error("executionPurpose is invalid");
  }
  return value;
}

function classificationValue(value: unknown): ClassificationStatus {
  if (
    value !== "period1-converged" &&
    value !== "period2-suspect" &&
    value !== "not-converged"
  ) {
    throw new Error("classification.status is invalid");
  }
  return value;
}

function sha256(value: unknown, label: string): string {
  const parsed = nonemptyString(value, label);
  if (!/^[0-9a-f]{64}$/.test(parsed)) {
    throw new Error(`${label} must be lowercase SHA-256`);
  }
  return parsed;
}

function acceptUniqueNullable(
  seen: Set<string>,
  value: string | null,
  label: string,
): void {
  if (value === null) return;
  if (seen.has(value)) throw new Error(`duplicate ${label}`);
  seen.add(value);
}

function acceptUniqueArray(
  seen: Set<string>,
  values: readonly string[],
  label: string,
): void {
  for (const value of values) {
    if (seen.has(value)) throw new Error(`duplicate ${label}`);
    seen.add(value);
  }
}

function nearlyEqual(left: number, right: number): boolean {
  return (
    Math.abs(left - right) <=
    1e-10 * Math.max(1, Math.abs(left), Math.abs(right))
  );
}

function formatValue(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 10_000 || magnitude < 0.001)) {
    return value.toExponential(2);
  }
  return Number(value.toFixed(4)).toString();
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
