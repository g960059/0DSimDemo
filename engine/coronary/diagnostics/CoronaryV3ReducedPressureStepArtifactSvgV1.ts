import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V1,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepNumericalCharacterizationV1";
import {
  CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID,
  CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2,
} from "@/engine/coronary/experiments/CoronaryV3ReducedPressureStepNumericalCharacterizationV2";
import {
  CORONARY_V3_STEP_RESPONSE_METRICS_V1_ID,
} from "@/engine/coronary/experiments/CoronaryV3StepResponseMetricsV1";

export const CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_ID =
  "coronary-v3-reduced-pressure-step-raw-accepted-window-svg-v1" as const;

export const CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_CLAIM =
  Object.freeze({
    role: "coarse-fine-raw-accepted-window-diagnostic" as const,
    xObservable: "seconds-after-own-intervention-at-window-end" as const,
    yObservable:
      "mean-upstream-minus-mean-downstream-pressure-divided-by-aggregate-inlet-flow" as const,
    plottedSamples:
      "raw-one-second-accepted-window-means-connected-only-in-accepted-order" as const,
    interpolationApplied: false as const,
    resamplingApplied: false as const,
    smoothingApplied: false as const,
    fittingApplied: false as const,
    biologicalAcceptanceClaimed: false as const,
    physiologicalAcceptanceClaimed: false as const,
    shapeAcceptanceClaimed: false as const,
    originalPaperT50ReproductionClaimed: false as const,
  });

type ArmId = (typeof CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2)[number];
type SourceVersion = "v1" | "v2";
type IntegrationRole = "coarse" | "fine";

type RawPoint = Readonly<{
  beatIndex: number;
  startSecAfterIntervention: number;
  endSecAfterIntervention: number;
  meanUpstreamPressureMmHg: number;
  meanDownstreamReferencePressureMmHg: number;
  meanObservedFlowMlPerSec: number;
  pressureFlowMmHgSecPerMl: number;
}>;

type ParsedArmSeries = Readonly<{
  sourceVersion: SourceVersion;
  role: IntegrationRole;
  dtSec: number;
  armId: ArmId;
  baselinePressureFlowMmHgSecPerMl: number;
  finalPressureFlowMmHgSecPerMl: number;
  halfResponsePressureFlowMmHgSecPerMl: number;
  points: readonly RawPoint[];
}>;

type ParsedArtifact = Readonly<{
  sourceVersion: SourceVersion;
  characterizationId: string;
  policyId: string;
  numericalQaPassed: boolean;
  biologicalValidationEstablished: false;
  physiologicalAcceptanceEstablished: false;
  releaseAcceptanceEstablished: false;
  seriesByArm: Readonly<Record<ArmId, readonly ParsedArmSeries[]>>;
  failedGateLabels: readonly string[];
  v2MetricIdentity: string | null;
}>;

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

const SVG_WIDTH = 1420;
const SVG_HEIGHT = 1120;
const OUTER_MARGIN = 50;
const COLUMN_GAP = 30;
const ROW_GAP = 30;
const PANEL_TOP = 245;
const PANEL_WIDTH = (SVG_WIDTH - 2 * OUTER_MARGIN - COLUMN_GAP) / 2;
const PANEL_HEIGHT = 380;
const TIME_TOLERANCE_SEC = 1e-8;
const VALUE_TOLERANCE = 1e-9;
const MAXIMUM_RAW_WINDOW_COUNT_PER_SERIES = 2_000;

const SERIES_PRESENTATION = Object.freeze({
  "v1:coarse": Object.freeze({
    label: "V1 coarse · dt 2 ms",
    color: "#2563eb",
    dash: "",
    radius: 2.2,
  }),
  "v1:fine": Object.freeze({
    label: "V1 fine · dt 1 ms",
    color: "#0891b2",
    dash: "5 3",
    radius: 2,
  }),
  "v2:coarse": Object.freeze({
    label: "V2 coarse · dt 1 ms",
    color: "#d97706",
    dash: "2 3",
    radius: 1.8,
  }),
  "v2:fine": Object.freeze({
    label: "V2 fine · dt 0.5 ms",
    color: "#dc2626",
    dash: "8 3",
    radius: 1.6,
  }),
} as const);

/**
 * Renders two independently serialized numerical-characterization artifacts.
 * Both inputs are treated as untrusted. No SVG is returned until identities,
 * arm bindings, one-second raw-window coverage, finite values, P/Q arithmetic,
 * comparison metadata, and non-validation claims have all been checked.
 */
export function renderCoronaryV3ReducedPressureStepArtifactsSvgV1(
  v1Candidate: unknown,
  v2Candidate: unknown,
): string {
  const v1 = parseArtifact(v1Candidate, "v1");
  const v2 = parseArtifact(v2Candidate, "v2");
  validateCrossArtifactSupport(v1, v2);

  const panels = CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.map(
    (armId, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const panel = createPanel(
        OUTER_MARGIN + column * (PANEL_WIDTH + COLUMN_GAP),
        PANEL_TOP + row * (PANEL_HEIGHT + ROW_GAP),
        PANEL_WIDTH,
        PANEL_HEIGHT,
      );
      return renderArmPanel(
        panel,
        armId,
        [...v1.seriesByArm[armId], ...v2.seriesByArm[armId]],
      );
    },
  );

  const v1GateText = v1.failedGateLabels.length === 0
    ? "V1 failed gates recorded by artifact: none"
    : `V1 failed gates recorded by artifact: ${v1.failedGateLabels
      .map((label) => label.split(" — ")[0])
      .join(" · ")} · full reason retained in metadata`;
  const v2MetricText =
    "V2 metric identity recorded by artifact: firstFiveWindowMaximumAbsoluteTransient · direction-independent · cross-dt 5% · full identity in metadata";
  const title =
    "Coronary V3 reduced pressure-step — raw accepted-window Pgradient / aggregate inlet flow";
  const subtitle =
    "DIAGNOSTIC ONLY · biology=false · physiology=false · shape acceptance=false · no interpolation, resampling, smoothing, or fitting";
  const metadata = escapeXml(JSON.stringify({
    artifactId: CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_ID,
    claim: CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_CLAIM,
    sources: [
      sourceMetadata(v1),
      sourceMetadata(v2),
    ],
    v1FailedGates: v1.failedGateLabels,
    v2MetricIdentity: v2.v2MetricIdentity,
  }));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" role="img" aria-labelledby="coronary-step-title coronary-step-desc" data-artifact-id="${CORONARY_V3_REDUCED_PRESSURE_STEP_ARTIFACT_SVG_V1_ID}">`,
    `<title id="coronary-step-title">${escapeXml(title)}</title>`,
    `<desc id="coronary-step-desc">${escapeXml(`${subtitle}. Four fixed panels show up/down and active/frozen arms. Straight segments only connect adjacent raw accepted-window means.`)}</desc>`,
    `<metadata>${metadata}</metadata>`,
    `<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#f8fafc"/>`,
    `<style>${svgStyle()}</style>`,
    `<text x="${OUTER_MARGIN}" y="55" class="artifact-title">${escapeXml(title)}</text>`,
    `<text x="${OUTER_MARGIN}" y="87" class="artifact-warning">${escapeXml(subtitle)}</text>`,
    `<text x="${OUTER_MARGIN}" y="119" class="artifact-source">${escapeXml(`V1 ${v1.characterizationId} · numerical QA=${v1.numericalQaPassed ? "PASS" : "FAIL"}`)}</text>`,
    `<text x="${OUTER_MARGIN}" y="143" class="artifact-source">${escapeXml(v1GateText)}</text>`,
    `<text x="${OUTER_MARGIN}" y="175" class="artifact-source">${escapeXml(`V2 ${v2.characterizationId} · numerical QA=${v2.numericalQaPassed ? "PASS" : "FAIL"}`)}</text>`,
    `<text x="${OUTER_MARGIN}" y="199" class="artifact-source">${escapeXml(v2MetricText)}</text>`,
    `<text x="${OUTER_MARGIN}" y="224" class="artifact-note">Raw one-second window means; x is each window end relative to that series' own intervention. Baseline / final / half-response guides come directly from each artifact.</text>`,
    ...panels,
    `<text x="${OUTER_MARGIN}" y="${SVG_HEIGHT - 24}" class="footer">No original-paper t50 reproduction · venous-boundary surrogate station · raw artifact values only · no acceptance threshold inferred from graph shape</text>`,
    "</svg>",
    "",
  ].join("\n");
}

function sourceMetadata(artifact: ParsedArtifact): Readonly<Record<string, unknown>> {
  return Object.freeze({
    sourceVersion: artifact.sourceVersion,
    characterizationId: artifact.characterizationId,
    policyId: artifact.policyId,
    numericalQaPassed: artifact.numericalQaPassed,
    biologicalValidationEstablished: false,
    physiologicalAcceptanceEstablished: false,
    releaseAcceptanceEstablished: false,
  });
}

function renderArmPanel(
  panel: Panel,
  armId: ArmId,
  series: readonly ParsedArmSeries[],
): string {
  if (series.length !== 4) {
    throw new Error(`arm ${armId} must provide exactly four source series`);
  }
  const xBounds = paddedBounds(series.flatMap(({ points }) =>
    points.map(({ endSecAfterIntervention }) => endSecAfterIntervention)), true);
  const yBounds = paddedBounds(series.flatMap((item) => [
    ...item.points.map(({ pressureFlowMmHgSecPerMl }) =>
      pressureFlowMmHgSecPerMl),
    item.baselinePressureFlowMmHgSecPerMl,
    item.finalPressureFlowMmHgSecPerMl,
    item.halfResponsePressureFlowMmHgSecPerMl,
  ]));
  const x = (value: number) => scale(
    value,
    xBounds.minimum,
    xBounds.maximum,
    panel.plot.x,
    panel.plot.x + panel.plot.width,
  );
  const y = (value: number) => scale(
    value,
    yBounds.minimum,
    yBounds.maximum,
    panel.plot.y + panel.plot.height,
    panel.plot.y,
  );
  const content: string[] = [
    renderAxes(
      panel.plot,
      xBounds,
      yBounds,
      "seconds after own intervention (window end)",
      "Pgradient / aggregate inlet flow (mmHg·s/mL)",
    ),
  ];
  if (xBounds.minimum <= 0 && xBounds.maximum >= 0) {
    const interventionX = x(0);
    content.push(
      `<line data-guide="intervention" x1="${formatSvg(interventionX)}" y1="${formatSvg(panel.plot.y)}" x2="${formatSvg(interventionX)}" y2="${formatSvg(panel.plot.y + panel.plot.height)}" stroke="#111827" stroke-width="1.2"/>`,
      `<text x="${formatSvg(interventionX + 4)}" y="${formatSvg(panel.plot.y + 13)}" class="guide-label">intervention = 0</text>`,
    );
  }
  for (const item of series) {
    const key = `${item.sourceVersion}:${item.role}` as keyof typeof SERIES_PRESENTATION;
    const presentation = SERIES_PRESENTATION[key];
    const rawPoints = item.points.map((raw) =>
      `${formatSvg(x(raw.endSecAfterIntervention))},${formatSvg(y(raw.pressureFlowMmHgSecPerMl))}`)
      .join(" ");
    content.push(
      renderHorizontalGuide(panel.plot, y(item.baselinePressureFlowMmHgSecPerMl),
        presentation.color, `${key}:baseline`, "7 4", 0.34),
      renderHorizontalGuide(panel.plot, y(item.finalPressureFlowMmHgSecPerMl),
        presentation.color, `${key}:final`, "2 4", 0.34),
      renderHorizontalGuide(panel.plot, y(item.halfResponsePressureFlowMmHgSecPerMl),
        presentation.color, `${key}:half-response`, "10 3 2 3", 0.46),
      `<polyline data-series="${key}" data-source-version="${item.sourceVersion}" data-integration-role="${item.role}" data-arm-id="${armId}" points="${rawPoints}" fill="none" stroke="${presentation.color}" stroke-width="1.8"${presentation.dash ? ` stroke-dasharray="${presentation.dash}"` : ""}/>` ,
      ...item.points.map((raw) =>
        `<circle data-raw-window-point="${key}" data-beat-index="${raw.beatIndex}" cx="${formatSvg(x(raw.endSecAfterIntervention))}" cy="${formatSvg(y(raw.pressureFlowMmHgSecPerMl))}" r="${presentation.radius}" fill="${presentation.color}"/>`),
    );
  }
  content.push(renderLegend(panel, series));
  return [
    `<g data-panel-arm="${armId}">`,
    `<rect x="${formatSvg(panel.x)}" y="${formatSvg(panel.y)}" width="${formatSvg(panel.width)}" height="${formatSvg(panel.height)}" rx="8" fill="#ffffff" stroke="#cbd5e1"/>`,
    `<text x="${formatSvg(panel.x + 16)}" y="${formatSvg(panel.y + 25)}" class="panel-title">${escapeXml(panelTitle(armId))}</text>`,
    content.join("\n"),
    "</g>",
  ].join("\n");
}

function renderHorizontalGuide(
  plot: PlotBox,
  y: number,
  color: string,
  id: string,
  dash: string,
  opacity: number,
): string {
  return `<line data-guide="${id}" x1="${formatSvg(plot.x)}" y1="${formatSvg(y)}" x2="${formatSvg(plot.x + plot.width)}" y2="${formatSvg(y)}" stroke="${color}" stroke-width="1" stroke-dasharray="${dash}" opacity="${opacity}"/>`;
}

function renderLegend(panel: Panel, series: readonly ParsedArmSeries[]): string {
  const rows = series.map((item, index) => {
    const key = `${item.sourceVersion}:${item.role}` as keyof typeof SERIES_PRESENTATION;
    const presentation = SERIES_PRESENTATION[key];
    const y = panel.y + 47 + index * 17;
    return [
      `<line x1="${formatSvg(panel.x + 19)}" y1="${formatSvg(y)}" x2="${formatSvg(panel.x + 42)}" y2="${formatSvg(y)}" stroke="${presentation.color}" stroke-width="2"${presentation.dash ? ` stroke-dasharray="${presentation.dash}"` : ""}/>`,
      `<text x="${formatSvg(panel.x + 48)}" y="${formatSvg(y + 4)}" class="legend-label">${escapeXml(presentation.label)}</text>`,
    ].join("\n");
  });
  return rows.join("\n");
}

function renderAxes(
  plot: PlotBox,
  xBounds: NumericBounds,
  yBounds: NumericBounds,
  xLabel: string,
  yLabel: string,
): string {
  const output = [
    `<rect x="${formatSvg(plot.x)}" y="${formatSvg(plot.y)}" width="${formatSvg(plot.width)}" height="${formatSvg(plot.height)}" fill="#f8fafc" stroke="#94a3b8"/>`,
  ];
  for (let index = 0; index <= 4; index += 1) {
    const fraction = index / 4;
    const x = plot.x + fraction * plot.width;
    const xValue = xBounds.minimum
      + fraction * (xBounds.maximum - xBounds.minimum);
    const y = plot.y + plot.height - fraction * plot.height;
    const yValue = yBounds.minimum
      + fraction * (yBounds.maximum - yBounds.minimum);
    output.push(
      `<line x1="${formatSvg(x)}" y1="${formatSvg(plot.y)}" x2="${formatSvg(x)}" y2="${formatSvg(plot.y + plot.height)}" stroke="#e2e8f0"/>`,
      `<text x="${formatSvg(x)}" y="${formatSvg(plot.y + plot.height + 17)}" text-anchor="middle" class="tick-label">${formatValue(xValue)}</text>`,
      `<line x1="${formatSvg(plot.x)}" y1="${formatSvg(y)}" x2="${formatSvg(plot.x + plot.width)}" y2="${formatSvg(y)}" stroke="#e2e8f0"/>`,
      `<text x="${formatSvg(plot.x - 7)}" y="${formatSvg(y + 4)}" text-anchor="end" class="tick-label">${formatValue(yValue)}</text>`,
    );
  }
  output.push(
    `<text x="${formatSvg(plot.x + plot.width / 2)}" y="${formatSvg(plot.y + plot.height + 37)}" text-anchor="middle" class="axis-label">${escapeXml(xLabel)}</text>`,
    `<text x="${formatSvg(plot.x - 47)}" y="${formatSvg(plot.y + plot.height / 2)}" text-anchor="middle" class="axis-label" transform="rotate(-90 ${formatSvg(plot.x - 47)} ${formatSvg(plot.y + plot.height / 2)})">${escapeXml(yLabel)}</text>`,
  );
  return output.join("\n");
}

function parseArtifact(candidate: unknown, version: SourceVersion): ParsedArtifact {
  const root = requireRecord(candidate, `${version} artifact`);
  const expected = version === "v1"
    ? Object.freeze({
      characterizationId:
        CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V1_ID,
      policyId:
        CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V1.policyId,
      coarseDtSec: 0.002,
      fineDtSec: 0.001,
    })
    : Object.freeze({
      characterizationId:
        CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_CHARACTERIZATION_V2_ID,
      policyId:
        CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2.policyId,
      coarseDtSec: 0.001,
      fineDtSec: 0.0005,
    });
  const characterizationId = requireExactString(
    root.characterizationId,
    expected.characterizationId,
    `${version} characterizationId`,
  );
  const policy = requireRecord(root.policy, `${version} policy`);
  const policyId = requireExactString(
    policy.policyId,
    expected.policyId,
    `${version} policyId`,
  );
  requireExactNumber(
    policy.coarseDtSec,
    expected.coarseDtSec,
    `${version} policy coarseDtSec`,
  );
  requireExactNumber(
    policy.fineDtSec,
    expected.fineDtSec,
    `${version} policy fineDtSec`,
  );
  requireExactNumber(
    policy.acceptedWindowDurationSec,
    1,
    `${version} accepted-window duration`,
  );
  requireExactString(
    policy.comparisonTimeOrigin,
    "seconds-after-own-intervention",
    `${version} comparison time origin`,
  );
  requireFalse(
    policy.originalPaperT50ComparisonApplied,
    `${version} original-paper t50 policy claim`,
  );
  requireFalse(policy.biologicalTolerance, `${version} biological tolerance`);
  if (version === "v2") {
    requireFalse(
      policy.physiologicalThresholdsDefined,
      "v2 physiological threshold claim",
    );
    requireExactNumber(
      policy.firstFiveAcceptedWindowCount,
      5,
      "v2 first-five accepted-window count",
    );
    requireExactString(
      policy.firstFiveAcceptedWindowTransientDefinition,
      CORONARY_V3_REDUCED_PRESSURE_STEP_NUMERICAL_QA_POLICY_V2
        .firstFiveAcceptedWindowTransientDefinition,
      "v2 transient metric definition",
    );
  }
  const numericalQaPassed = requireBoolean(
    root.numericalQaPassed,
    `${version} numericalQaPassed`,
  );
  requireFalse(
    root.biologicalValidationEstablished,
    `${version} biological validation claim`,
  );
  requireFalse(
    root.physiologicalAcceptanceEstablished,
    `${version} physiological acceptance claim`,
  );
  requireFalse(
    root.releaseAcceptanceEstablished,
    `${version} release acceptance claim`,
  );

  const coarse = parseIntegration(
    root.coarse,
    version,
    "coarse",
    expected.coarseDtSec,
  );
  const fine = parseIntegration(
    root.fine,
    version,
    "fine",
    expected.fineDtSec,
  );
  const comparisons = requireExactArmRecord(
    root.comparisonByArm,
    `${version} comparisonByArm`,
  );
  const failedGateLabels = version === "v1"
    ? parseV1FailedGates(comparisons)
    : Object.freeze([] as string[]);
  const v2MetricIdentity = version === "v2"
    ? parseV2MetricIdentity(comparisons)
    : null;
  const allArmNumericalQaPassed = CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2
    .every((armId) => requireBoolean(
      requireRecord(
        comparisons[armId],
        `${version} ${armId} comparison`,
      ).numericalQaPassed,
      `${version} ${armId} numericalQaPassed`,
    ));
  if (numericalQaPassed !== allArmNumericalQaPassed) {
    throw new Error(`${version} artifact numerical QA disagrees with arm comparisons`);
  }
  const seriesByArm = freezeArmRecord((armId) => Object.freeze([
    coarse[armId],
    fine[armId],
  ]));
  for (const armId of CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2) {
    validateRelativeSupport(seriesByArm[armId], `${version} ${armId}`);
  }
  return Object.freeze({
    sourceVersion: version,
    characterizationId,
    policyId,
    numericalQaPassed,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    seriesByArm,
    failedGateLabels,
    v2MetricIdentity,
  });
}

function parseIntegration(
  candidate: unknown,
  version: SourceVersion,
  role: IntegrationRole,
  expectedDtSec: number,
): Readonly<Record<ArmId, ParsedArmSeries>> {
  const integration = requireRecord(candidate, `${version} ${role}`);
  requireExactString(integration.role, role, `${version} ${role} role`);
  const dtSec = requireExactNumber(
    integration.dtSec,
    expectedDtSec,
    `${version} ${role} dtSec`,
  );
  requireTrue(
    integration.allFiniteAndConserved,
    `${version} ${role} allFiniteAndConserved`,
  );
  const armSamples = requireExactArmRecord(
    integration.armSamples,
    `${version} ${role} armSamples`,
  );
  return freezeArmRecord((armId) => parseArmSample(
    armSamples[armId],
    version,
    role,
    dtSec,
    armId,
  ));
}

function parseArmSample(
  candidate: unknown,
  version: SourceVersion,
  role: IntegrationRole,
  dtSec: number,
  expectedArmId: ArmId,
): ParsedArmSeries {
  const label = `${version} ${role} ${expectedArmId}`;
  const sample = requireRecord(candidate, `${label} sample`);
  requireExactString(sample.armId, expectedArmId, `${label} armId`);
  requireExactNumber(sample.dtSec, dtSec, `${label} sample dtSec`);
  requireTrue(sample.allFinite, `${label} allFinite`);
  requireTrue(
    sample.conservationToleranceSatisfied,
    `${label} conservationToleranceSatisfied`,
  );
  const interventionTimeSec = requireFiniteNumber(
    sample.interventionTimeSec,
    `${label} interventionTimeSec`,
  );
  const metrics = requireRecord(sample.metrics, `${label} metrics`);
  requireExactString(
    metrics.metricsId,
    CORONARY_V3_STEP_RESPONSE_METRICS_V1_ID,
    `${label} metricsId`,
  );
  const station = requireRecord(metrics.measurementStation, `${label} station`);
  requireExactString(
    station.kind,
    "venous-boundary-pressure-flow-surrogate",
    `${label} measurement station`,
  );
  requireFalse(
    metrics.exactDankelmanMeasurementStationEstablished,
    `${label} exact Dankelman station claim`,
  );
  requireFalse(
    metrics.eligibleForDirectOriginalPaperT50ReproductionClaim,
    `${label} original-paper t50 claim`,
  );
  requireFalse(
    metrics.physiologicalAcceptanceEstablished,
    `${label} physiological acceptance`,
  );
  requireFalse(
    metrics.independentValidationEstablished,
    `${label} independent validation`,
  );
  const baseline = requireRecord(metrics.baseline, `${label} baseline`);
  const final = requireRecord(metrics.final, `${label} final`);
  const baselineValue = requireFiniteNumber(
    baseline.meanPressureFlowMmHgSecPerMl,
    `${label} baseline P/Q`,
  );
  const finalValue = requireFiniteNumber(
    final.meanPressureFlowMmHgSecPerMl,
    `${label} final P/Q`,
  );
  const half = requireFiniteNumber(
    metrics.halfwayTargetPressureFlowMmHgSecPerMl,
    `${label} half-response P/Q`,
  );
  requireApproximatelyEqual(
    half,
    (baselineValue + finalValue) / 2,
    `${label} half-response arithmetic`,
  );
  const raw = requireArray(metrics.beatObservables, `${label} beatObservables`);
  if (raw.length === 0 || raw.length > MAXIMUM_RAW_WINDOW_COUNT_PER_SERIES) {
    throw new Error(`${label} raw accepted-window count is unsupported`);
  }
  const points = Object.freeze(raw.map((value, index) => parseRawPoint(
    value,
    interventionTimeSec,
    label,
    index,
  )));
  validateRawWindowOrder(points, label);
  validateSummaryAgainstRaw(
    points,
    baseline,
    baselineValue,
    interventionTimeSec,
    label,
    "baseline",
  );
  validateSummaryAgainstRaw(
    points,
    final,
    finalValue,
    interventionTimeSec,
    label,
    "final",
  );
  return Object.freeze({
    sourceVersion: version,
    role,
    dtSec,
    armId: expectedArmId,
    baselinePressureFlowMmHgSecPerMl: baselineValue,
    finalPressureFlowMmHgSecPerMl: finalValue,
    halfResponsePressureFlowMmHgSecPerMl: half,
    points,
  });
}

function parseRawPoint(
  candidate: unknown,
  interventionTimeSec: number,
  label: string,
  index: number,
): RawPoint {
  const beat = requireRecord(candidate, `${label} raw window ${index}`);
  const beatIndex = requireNonnegativeInteger(
    beat.beatIndex,
    `${label} raw window ${index} beatIndex`,
  );
  const start = requireFiniteNumber(
    beat.startTimeSec,
    `${label} raw window ${index} startTimeSec`,
  );
  const end = requireFiniteNumber(
    beat.endTimeSec,
    `${label} raw window ${index} endTimeSec`,
  );
  if (Math.abs(end - start - 1) > TIME_TOLERANCE_SEC) {
    throw new Error(`${label} raw window ${index} is not one accepted second`);
  }
  const upstream = requireFiniteNumber(
    beat.meanUpstreamPressureMmHg,
    `${label} raw window ${index} upstream pressure`,
  );
  const downstream = requireFiniteNumber(
    beat.meanDownstreamReferencePressureMmHg,
    `${label} raw window ${index} downstream pressure`,
  );
  const aggregateInletFlow = requireFiniteNumber(
    beat.meanObservedFlowMlPerSec,
    `${label} raw window ${index} aggregate inlet flow`,
  );
  if (!(aggregateInletFlow > 0)) {
    throw new Error(`${label} raw window ${index} aggregate inlet flow must be positive`);
  }
  const pressureGradient = requireFiniteNumber(
    beat.pressureGradientMmHg,
    `${label} raw window ${index} pressure gradient`,
  );
  const pressureFlow = requireFiniteNumber(
    beat.pressureFlowMmHgSecPerMl,
    `${label} raw window ${index} P/Q`,
  );
  requireApproximatelyEqual(
    pressureGradient,
    upstream - downstream,
    `${label} raw window ${index} pressure-gradient arithmetic`,
  );
  requireApproximatelyEqual(
    pressureFlow,
    pressureGradient / aggregateInletFlow,
    `${label} raw window ${index} P/Q arithmetic`,
  );
  return Object.freeze({
    beatIndex,
    startSecAfterIntervention: start - interventionTimeSec,
    endSecAfterIntervention: end - interventionTimeSec,
    meanUpstreamPressureMmHg: upstream,
    meanDownstreamReferencePressureMmHg: downstream,
    meanObservedFlowMlPerSec: aggregateInletFlow,
    pressureFlowMmHgSecPerMl: pressureFlow,
  });
}

function validateRawWindowOrder(points: readonly RawPoint[], label: string): void {
  let hasBaselineBoundary = false;
  let hasPostInterventionStart = false;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    if (!Object.values(point).every(Number.isFinite)) {
      throw new Error(`${label} raw relative window ${index} is nonfinite`);
    }
    if (Math.abs(point.endSecAfterIntervention) <= TIME_TOLERANCE_SEC) {
      hasBaselineBoundary = true;
    }
    if (Math.abs(point.startSecAfterIntervention) <= TIME_TOLERANCE_SEC) {
      hasPostInterventionStart = true;
    }
    const previous = points[index - 1];
    if (previous !== undefined) {
      if (point.beatIndex <= previous.beatIndex) {
        throw new Error(`${label} raw beat indices are not strictly increasing`);
      }
      if (Math.abs(
        point.startSecAfterIntervention - previous.endSecAfterIntervention,
      ) > TIME_TOLERANCE_SEC) {
        throw new Error(`${label} raw accepted windows are not consecutive`);
      }
    }
  }
  if (!hasBaselineBoundary || !hasPostInterventionStart) {
    throw new Error(`${label} raw windows do not expose the intervention boundary`);
  }
  const firstFivePost = points.filter(({ startSecAfterIntervention }) =>
    startSecAfterIntervention >= -TIME_TOLERANCE_SEC
    && startSecAfterIntervention < 5 - TIME_TOLERANCE_SEC);
  if (firstFivePost.length !== 5) {
    throw new Error(`${label} raw windows do not contain the first five accepted windows`);
  }
}

function validateSummaryAgainstRaw(
  points: readonly RawPoint[],
  summary: Record<string, unknown>,
  expectedMean: number,
  interventionTimeSec: number,
  label: string,
  summaryLabel: string,
): void {
  const start = requireFiniteNumber(
    summary.startTimeSec,
    `${label} ${summaryLabel} startTimeSec`,
  );
  const end = requireFiniteNumber(
    summary.endTimeSec,
    `${label} ${summaryLabel} endTimeSec`,
  );
  if (!(end > start)) {
    throw new Error(`${label} ${summaryLabel} window is invalid`);
  }
  const relativeStart = start - interventionTimeSec;
  const relativeEnd = end - interventionTimeSec;
  let duration = 0;
  let contributingWindowCount = 0;
  let upstreamIntegral = 0;
  let downstreamIntegral = 0;
  let flowIntegral = 0;
  let pressureFlowIntegral = 0;
  for (const point of points) {
    const overlap = Math.max(
      0,
      Math.min(point.endSecAfterIntervention, relativeEnd)
        - Math.max(point.startSecAfterIntervention, relativeStart),
    );
    if (overlap <= TIME_TOLERANCE_SEC) continue;
    if (Math.abs(overlap - 1) > TIME_TOLERANCE_SEC) {
      throw new Error(`${label} ${summaryLabel} cuts through an accepted window`);
    }
    duration += overlap;
    contributingWindowCount += 1;
    upstreamIntegral += overlap * point.meanUpstreamPressureMmHg;
    downstreamIntegral += overlap * point.meanDownstreamReferencePressureMmHg;
    flowIntegral += overlap * point.meanObservedFlowMlPerSec;
    pressureFlowIntegral += overlap * point.pressureFlowMmHgSecPerMl;
  }
  if (Math.abs(duration - (end - start)) > TIME_TOLERANCE_SEC) {
    throw new Error(`${label} ${summaryLabel} window lacks raw coverage`);
  }
  const serializedCount = requireNonnegativeInteger(
    summary.contributingBeatCount,
    `${label} ${summaryLabel} contributingBeatCount`,
  );
  if (serializedCount !== contributingWindowCount) {
    throw new Error(`${label} ${summaryLabel} contributing count is inconsistent`);
  }
  requireApproximatelyEqual(
    requireFiniteNumber(
      summary.contributingDurationSec,
      `${label} ${summaryLabel} contributingDurationSec`,
    ),
    duration,
    `${label} ${summaryLabel} contributing duration`,
  );
  const meanUpstream = upstreamIntegral / duration;
  const meanDownstream = downstreamIntegral / duration;
  const meanFlow = flowIntegral / duration;
  if (!(meanFlow > 0)) {
    throw new Error(`${label} ${summaryLabel} aggregate inlet flow must be positive`);
  }
  const meanGradient = meanUpstream - meanDownstream;
  requireApproximatelyEqual(
    requireFiniteNumber(
      summary.meanUpstreamPressureMmHg,
      `${label} ${summaryLabel} mean upstream pressure`,
    ),
    meanUpstream,
    `${label} ${summaryLabel} mean upstream pressure`,
  );
  requireApproximatelyEqual(
    requireFiniteNumber(
      summary.meanDownstreamReferencePressureMmHg,
      `${label} ${summaryLabel} mean downstream pressure`,
    ),
    meanDownstream,
    `${label} ${summaryLabel} mean downstream pressure`,
  );
  requireApproximatelyEqual(
    requireFiniteNumber(
      summary.meanPressureGradientMmHg,
      `${label} ${summaryLabel} mean pressure gradient`,
    ),
    meanGradient,
    `${label} ${summaryLabel} mean pressure gradient`,
  );
  requireApproximatelyEqual(
    requireFiniteNumber(
      summary.meanObservedFlowMlPerSec,
      `${label} ${summaryLabel} mean aggregate inlet flow`,
    ),
    meanFlow,
    `${label} ${summaryLabel} mean aggregate inlet flow`,
  );
  requireApproximatelyEqual(
    pressureFlowIntegral / duration,
    expectedMean,
    `${label} ${summaryLabel} raw mean`,
  );
}

function parseV1FailedGates(
  comparisons: Readonly<Record<ArmId, unknown>>,
): readonly string[] {
  const failed: string[] = [];
  for (const armId of CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2) {
    const comparison = requireRecord(comparisons[armId], `v1 ${armId} comparison`);
    requireExactString(comparison.armId, armId, `v1 ${armId} comparison armId`);
    requireExactNumber(comparison.coarseDtSec, 0.002, `v1 ${armId} coarseDtSec`);
    requireExactNumber(comparison.fineDtSec, 0.001, `v1 ${armId} fineDtSec`);
    const gates = [
      ["integrity", comparison.integrity],
      ["surrogateBoundary", comparison.surrogateBoundary],
      ["crossing", comparison.crossing],
      ["finalNormalizedResponse", comparison.finalNormalizedResponse],
      ["passiveOppositeAmplitude", comparison.passiveOppositeAmplitude],
    ] as const;
    if (!requireBoolean(comparison.dtBindingPassed, `v1 ${armId} dtBindingPassed`)) {
      failed.push(`${armId}.dtBinding`);
    }
    for (const [gateId, value] of gates) {
      const gate = requireRecord(value, `v1 ${armId} ${gateId}`);
      const passed = requireBoolean(gate.passed, `v1 ${armId} ${gateId}.passed`);
      if (passed) continue;
      const reason = optionalFailureReason(gate.failureReason,
        `v1 ${armId} ${gateId}.failureReason`);
      failed.push(`${armId}.${gateId}${reason === null ? "" : ` — ${reason}`}`);
    }
    const numericalQaPassed = requireBoolean(
      comparison.numericalQaPassed,
      `v1 ${armId} numericalQaPassed`,
    );
    const armFailed = failed.some((item) => item.startsWith(`${armId}.`));
    if (numericalQaPassed !== !armFailed) {
      throw new Error(`v1 ${armId} numerical QA disagrees with its gates`);
    }
  }
  return Object.freeze(failed);
}

function parseV2MetricIdentity(
  comparisons: Readonly<Record<ArmId, unknown>>,
): string {
  const identity =
    "firstFiveWindowMaximumAbsoluteTransient / direction-independent-maximum-absolute-transient-from-baseline / first 5 accepted windows / cross-dt 5%";
  for (const armId of CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2) {
    const comparison = requireRecord(comparisons[armId], `v2 ${armId} comparison`);
    requireExactString(comparison.armId, armId, `v2 ${armId} comparison armId`);
    requireExactNumber(comparison.coarseDtSec, 0.001, `v2 ${armId} coarseDtSec`);
    requireExactNumber(comparison.fineDtSec, 0.0005, `v2 ${armId} fineDtSec`);
    const dtBindingPassed = requireBoolean(
      comparison.dtBindingPassed,
      `v2 ${armId} dtBindingPassed`,
    );
    const otherGatePassed = [
      ["integrity", comparison.integrity],
      ["surrogateBoundary", comparison.surrogateBoundary],
      ["crossing", comparison.crossing],
      ["finalNormalizedResponse", comparison.finalNormalizedResponse],
    ].every(([gateId, candidate]) => requireBoolean(
      requireRecord(candidate, `v2 ${armId} ${gateId}`).passed,
      `v2 ${armId} ${gateId}.passed`,
    ));
    const metric = requireRecord(
      comparison.firstFiveWindowMaximumAbsoluteTransient,
      `v2 ${armId} first-five-window metric`,
    );
    requireExactString(
      metric.definition,
      "direction-independent-maximum-absolute-transient-from-baseline",
      `v2 ${armId} metric definition`,
    );
    requireExactNumber(
      metric.requiredAcceptedWindowCount,
      5,
      `v2 ${armId} metric window count`,
    );
    requireExactNumber(
      metric.maximumAllowedRelativeDifference,
      0.05,
      `v2 ${armId} metric relative-difference tolerance`,
    );
    requireFalse(
      metric.oppositeDirectionExcursionRequired,
      `v2 ${armId} direction-dependent excursion gate`,
    );
    const metricPassed = requireBoolean(metric.passed, `v2 ${armId} metric passed`);
    const numericalQaPassed = requireBoolean(
      comparison.numericalQaPassed,
      `v2 ${armId} numericalQaPassed`,
    );
    if (numericalQaPassed !== (dtBindingPassed && otherGatePassed && metricPassed)) {
      throw new Error(`v2 ${armId} numerical QA disagrees with its gates`);
    }
  }
  return identity;
}

function validateRelativeSupport(
  series: readonly ParsedArmSeries[],
  label: string,
): void {
  const reference = series[0]!.points;
  for (const candidate of series.slice(1)) {
    if (candidate.points.length !== reference.length) {
      throw new Error(`${label} coarse/fine raw window counts differ`);
    }
    for (let index = 0; index < reference.length; index += 1) {
      if (Math.abs(
        reference[index]!.startSecAfterIntervention
          - candidate.points[index]!.startSecAfterIntervention,
      ) > TIME_TOLERANCE_SEC || Math.abs(
        reference[index]!.endSecAfterIntervention
          - candidate.points[index]!.endSecAfterIntervention,
      ) > TIME_TOLERANCE_SEC) {
        throw new Error(`${label} coarse/fine relative window support differs`);
      }
    }
  }
}

function validateCrossArtifactSupport(v1: ParsedArtifact, v2: ParsedArtifact): void {
  for (const armId of CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2) {
    validateRelativeSupport(
      [...v1.seriesByArm[armId], ...v2.seriesByArm[armId]],
      `cross-artifact ${armId}`,
    );
  }
}

function requireExactArmRecord(
  candidate: unknown,
  label: string,
): Readonly<Record<ArmId, unknown>> {
  const record = requireRecord(candidate, label);
  const keys = Object.keys(record).sort();
  const expected = [...CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2].sort();
  if (keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly the four declared arm ids`);
  }
  return record as Readonly<Record<ArmId, unknown>>;
}

function freezeArmRecord<T>(
  map: (armId: ArmId) => T,
): Readonly<Record<ArmId, T>> {
  return Object.freeze(Object.fromEntries(
    CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.map(
      (armId) => [armId, map(armId)],
    ),
  )) as Readonly<Record<ArmId, T>>;
}

function requireRecord(candidate: unknown, label: string): Record<string, unknown> {
  if (candidate === null || typeof candidate !== "object"
    || Array.isArray(candidate)) {
    throw new Error(`${label} must be an object`);
  }
  return candidate as Record<string, unknown>;
}

function requireArray(candidate: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(candidate)) throw new Error(`${label} must be an array`);
  return candidate;
}

function requireFiniteNumber(candidate: unknown, label: string): number {
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
    throw new Error(`${label} must be finite`);
  }
  return candidate;
}

function requireNonnegativeInteger(candidate: unknown, label: string): number {
  const value = requireFiniteNumber(candidate, label);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer`);
  }
  return value;
}

function requireExactNumber(
  candidate: unknown,
  expected: number,
  label: string,
): number {
  const value = requireFiniteNumber(candidate, label);
  if (!Object.is(value, expected)) {
    throw new Error(`${label} must equal ${expected}`);
  }
  return value;
}

function requireBoolean(candidate: unknown, label: string): boolean {
  if (typeof candidate !== "boolean") throw new Error(`${label} must be boolean`);
  return candidate;
}

function requireTrue(candidate: unknown, label: string): true {
  if (candidate !== true) throw new Error(`${label} must be true`);
  return true;
}

function requireFalse(candidate: unknown, label: string): false {
  if (candidate !== false) throw new Error(`${label} must be false`);
  return false;
}

function requireExactString<T extends string>(
  candidate: unknown,
  expected: T,
  label: string,
): T {
  if (candidate !== expected) throw new Error(`${label} is unsupported`);
  return expected;
}

function optionalFailureReason(candidate: unknown, label: string): string | null {
  if (candidate === null) return null;
  if (typeof candidate !== "string" || candidate.trim().length === 0
    || candidate.length > 500) {
    throw new Error(`${label} must be null or bounded text`);
  }
  return candidate;
}

function requireApproximatelyEqual(
  actual: number,
  expected: number,
  label: string,
): void {
  const tolerance = VALUE_TOLERANCE * Math.max(1, Math.abs(actual), Math.abs(expected));
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label} is inconsistent`);
  }
}

function createPanel(x: number, y: number, width: number, height: number): Panel {
  return Object.freeze({
    x,
    y,
    width,
    height,
    plot: Object.freeze({
      x: x + 75,
      y: y + 112,
      width: width - 98,
      height: height - 170,
    }),
  });
}

function panelTitle(armId: ArmId): string {
  const [direction, mode] = armId.split(":") as [string, string];
  return `${direction.replace("-to-", " → ")} mmHg · ${mode === "tone-active" ? "active tone" : "frozen tone"}`;
}

function paddedBounds(values: readonly number[], includeZero = false): NumericBounds {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("SVG bounds require finite values");
  }
  let minimum = Math.min(...values);
  let maximum = Math.max(...values);
  if (includeZero) {
    minimum = Math.min(minimum, 0);
    maximum = Math.max(maximum, 0);
  }
  if (minimum === maximum) {
    const pad = Math.max(1, Math.abs(minimum) * 0.05);
    return Object.freeze({ minimum: minimum - pad, maximum: maximum + pad });
  }
  const pad = (maximum - minimum) * 0.06;
  return Object.freeze({ minimum: minimum - pad, maximum: maximum + pad });
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

function formatValue(value: number): string {
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute < 0.01 || absolute >= 10_000)) {
    return value.toExponential(2);
  }
  return value.toFixed(absolute < 10 ? 3 : 1).replace(/\.0+$/, "");
}

function formatSvg(value: number): string {
  if (!Number.isFinite(value)) throw new Error("SVG coordinate must be finite");
  const rounded = Number(value.toFixed(3));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function svgStyle(): string {
  return [
    ".artifact-title{font:700 22px system-ui,sans-serif;fill:#0f172a}",
    ".artifact-warning{font:700 12px system-ui,sans-serif;fill:#b91c1c;letter-spacing:.025em}",
    ".artifact-source{font:600 11px ui-monospace,SFMono-Regular,monospace;fill:#334155}",
    ".artifact-note{font:500 11px system-ui,sans-serif;fill:#475569}",
    ".panel-title{font:700 13px system-ui,sans-serif;fill:#0f172a}",
    ".legend-label{font:500 10px system-ui,sans-serif;fill:#334155}",
    ".tick-label{font:9px ui-monospace,SFMono-Regular,monospace;fill:#64748b}",
    ".axis-label{font:10px system-ui,sans-serif;fill:#475569}",
    ".guide-label{font:600 9px system-ui,sans-serif;fill:#111827}",
    ".footer{font:600 11px system-ui,sans-serif;fill:#475569}",
  ].join("");
}

if (CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V1.join("|")
    !== CORONARY_V3_REDUCED_PRESSURE_STEP_ARM_IDS_V2.join("|")) {
  throw new Error("V1 and V2 reduced pressure-step arm identities differ");
}
