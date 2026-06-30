import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState, type SteadyMeasurement } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
  type ModelCoreRuntimeActiveSourceMode,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  type ModelCoreRuntimeRootZcMode,
} from "@/engine/myocardium/runtimeRootZc";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  conciseMorphologyMessages,
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckResult,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { lastCompleteBeat, phaseOf } from "@/engine/verification/shapeMetrics";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const MORPHOLOGY_VISUAL_REVIEW_PHASE5CA_ID =
  "morphology-visual-review-phase5ca-result-v1" as const;
export const MORPHOLOGY_VISUAL_REVIEW_PHASE5CA_RESULT_PATH =
  "data/myocardium/protocols/morphology-visual-review-phase5ca-result-v1.json" as const;

type PointId =
  | "normal-hr75"
  | "normal-hr90"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "systemic-afterload-high-hr75"
  | "pulmonary-afterload-high-hr75"
  | "contractility-low-hr75"
  | "contractility-high-hr75";

type VariantId =
  | "legacy-frozen-reference"
  | "lv-rv-land-rootzc-legacy-atria"
  | "user0-all-chamber-landatrial-rootzc"
  | "user0-all-chamber-landatrial-current-root";

type PointSpec = {
  readonly id: PointId;
  readonly label: string;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly runtimeMode: ModelCoreRuntimeActiveSourceMode;
  readonly rootZcMode?: ModelCoreRuntimeRootZcMode;
  readonly purpose: string;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type RunResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly sampleCount: number;
  readonly checkedBeatSampleCount: number;
  readonly grossVentricularMorphologyOk: boolean;
  readonly morphologyStatus: MorphologyCheckSummary["status"] | "not-measured";
  readonly failedLabels: readonly string[];
  readonly badges: MorphologyBadgeSummary | null;
  readonly metrics: MetricDigest | null;
  readonly messages: readonly string[];
  readonly downloadSvg: string | null;
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly grossPassCount: number;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly outputPreservedCount: number;
  readonly lvPvOkCount: number;
  readonly rvPvOkCount: number;
  readonly laPvOkCount: number;
  readonly raPvOkCount: number;
  readonly mvfOkCount: number;
  readonly tvfOkCount: number;
  readonly lapOkCount: number;
  readonly rapOkCount: number;
  readonly firstFailedPoint: PointId | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof MORPHOLOGY_VISUAL_REVIEW_PHASE5CA_ID;
  readonly phase: "5CA";
  readonly downloadsDirectory: string;
  readonly downloadsIndexHtml: string;
  readonly objective: "human-gate-calibration-review-for-deterministic-morphology-check-v1";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly grossGate:
      "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count";
  };
  readonly variants: readonly VariantSpec[];
  readonly points: readonly PointSpec[];
  readonly results: readonly RunResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly interpretation: {
    readonly humanVisualReviewRequired: true;
    readonly gateCalibrationStatus: "pending-owner-visual-review";
    readonly questions: readonly string[];
    readonly claimBoundary:
      "visual-review-bundle-only-no-runtime-adoption-no-threshold-change-no-official-morphology-acceptance";
  };
  readonly normalizedSha256: string;
};

type Trace = { readonly x: number; readonly y: number };
type Series = {
  readonly label: string;
  readonly color: string;
  readonly points: readonly Trace[];
  readonly dashed?: boolean;
};

const profile = resolveVerificationProfile("fitFast");
const DOWNLOAD_BUNDLE_NAME = "0dsim-morphology-review-phase5ca";
const DOWNLOAD_DIR = path.join(os.homedir(), "Downloads", DOWNLOAD_BUNDLE_NAME);
const INDEX_HTML = path.join(DOWNLOAD_DIR, "index.html");
const DISPLAY_DOWNLOAD_DIR = `~/Downloads/${DOWNLOAD_BUNDLE_NAME}`;
const DISPLAY_INDEX_HTML = `${DISPLAY_DOWNLOAD_DIR}/index.html`;

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", label: "Normal HR75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "normal-hr90", label: "Normal HR90", targetTBVMl: 5600, params: { HR: 90 } },
  { id: "low-preload-hr75", label: "Low preload HR75", targetTBVMl: 4800, params: { HR: 75 } },
  { id: "high-preload-hr75", label: "High preload HR75", targetTBVMl: 6200, params: { HR: 75 } },
  { id: "systemic-afterload-high-hr75", label: "Systemic afterload high HR75", targetTBVMl: 5600, params: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", label: "Pulmonary afterload high HR75", targetTBVMl: 5600, params: { HR: 75, pulmonaryResistance: 0.8 } },
  { id: "contractility-low-hr75", label: "Contractility low HR75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.8 } },
  { id: "contractility-high-hr75", label: "Contractility high HR75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.2 } },
];

const VARIANTS: readonly VariantSpec[] = [
  {
    id: "legacy-frozen-reference",
    label: "Frozen legacy reference",
    runtimeMode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
    purpose: "Reference morphology and checker calibration control.",
  },
  {
    id: "lv-rv-land-rootzc-legacy-atria",
    label: "LV/RV Land + sourced root/Zc, legacy atria",
    runtimeMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    purpose: "Separates ventricular Land plus valve/load/filling morphology from LandAtrial geometry.",
  },
  {
    id: "user0-all-chamber-landatrial-rootzc",
    label: "Current user-0 all-chamber LandAtrial + sourced root/Zc",
    runtimeMode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    purpose: "Live staged default visual review surface.",
  },
  {
    id: "user0-all-chamber-landatrial-current-root",
    label: "All-chamber LandAtrial with current root/Zc",
    runtimeMode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
    purpose: "Checks whether sourced root/Zc adoption is visually responsible for dome/inflow failures.",
  },
];

export function buildMorphologyVisualReviewPhase5CAEvidences(): Evidence {
  mkdirSync(DOWNLOAD_DIR, { recursive: true });
  const htmlSections: string[] = [];
  const results: RunResult[] = [];
  for (const variant of VARIANTS) {
    for (const point of POINTS) {
      const run = runPoint(variant, point);
      const svgName = `${variant.id}__${point.id}.svg`;
      const svgPath = path.join(DOWNLOAD_DIR, svgName);
      const svg = run.measurement
        ? renderRunSvg(variant, point, run.measurement, run.morphology, run.beat)
        : renderUnavailableSvg(variant, point, run.errorMessage ?? run.settleReason);
      writeFileSync(svgPath, svg);
      const publicRun: RunResult = {
        variantId: variant.id,
        pointId: point.id,
        settled: run.settled,
        settleReason: run.settleReason,
        healthStatus: run.healthStatus,
        sampleCount: run.measurement?.samples.length ?? 0,
        checkedBeatSampleCount: run.morphology?.checkedBeatSampleCount ?? 0,
        grossVentricularMorphologyOk: grossOk(run.morphology),
        morphologyStatus: run.morphology?.status ?? "not-measured",
        failedLabels: run.morphology
          ? run.morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
          : ["not-measured"],
        badges: run.morphology?.badges ?? null,
        metrics: run.measurement ? metricDigest(run.measurement.metrics) : null,
        messages: run.morphology ? conciseMorphologyMessages(run.morphology) : ["Morphology check not measured."],
        downloadSvg: `${DISPLAY_DOWNLOAD_DIR}/${svgName}`,
        errorMessage: run.errorMessage,
      };
      results.push(publicRun);
      htmlSections.push(renderRunHtml(variant, point, publicRun, svgName));
    }
  }
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(variant, results));
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: MORPHOLOGY_VISUAL_REVIEW_PHASE5CA_ID,
    phase: "5CA",
    downloadsDirectory: DISPLAY_DOWNLOAD_DIR,
    downloadsIndexHtml: DISPLAY_INDEX_HTML,
    objective: "human-gate-calibration-review-for-deterministic-morphology-check-v1",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      grossGate:
        "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count",
    },
    variants: VARIANTS,
    points: POINTS,
    results,
    variantSummaries,
    interpretation: {
      humanVisualReviewRequired: true,
      gateCalibrationStatus: "pending-owner-visual-review",
      questions: [
        "Are LV/RV ejection limbs visually gross double-domed, or is morphology-check-v1 roughness over-detecting acceptable curvature?",
        "Are MVF/TVF extra waves education-visible third waves, or should the AV inflow checker tolerate small late diastolic shoulders?",
        "Does the current-root/Zc ablation materially change the visual artifacts versus sourced root/Zc?",
        "Which failed points are unacceptable for future preset/case fitting across preload, afterload, and contractility ranges?",
      ],
      claimBoundary: "visual-review-bundle-only-no-runtime-adoption-no-threshold-change-no-official-morphology-acceptance",
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  const evidence = {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
  writeFileSync(INDEX_HTML, renderIndexHtml(evidence, htmlSections));
  writeFileSync(path.join(DOWNLOAD_DIR, "summary.json"), JSON.stringify(evidence, null, 2));
  return evidence;
}

function runPoint(
  variant: VariantSpec,
  point: PointSpec,
): {
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly measurement: SteadyMeasurement | null;
  readonly morphology: MorphologyCheckSummary | null;
  readonly beat: readonly SimSample[];
  readonly errorMessage: string | null;
} {
  try {
    const resolved = resolveModelCoreRuntimeActiveSource({
      mode: variant.runtimeMode,
      rootZcMode: variant.rootZcMode,
      runtimeParams: DEFAULT_PARAMS,
    });
    const params = { ...DEFAULT_PARAMS, ...point.params };
    const settle = settleToSteadyState(params, measureOptions(point, resolved.experimentalOptions));
    if (!settle.ok) {
      return {
        settled: settle.settleStatus.settled,
        settleReason: settle.settleStatus.reason,
        healthStatus: settle.core.health().status,
        measurement: null,
        morphology: null,
        beat: [],
        errorMessage: null,
      };
    }
    const measurement = measureSteady(settle.core, settle.settleStatus, measureOptions(point, resolved.experimentalOptions));
    const morphology = morphologyCheckSummaryFromSamples(measurement.samples);
    return {
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement.health.status,
      measurement,
      morphology,
      beat: lastCompleteBeat([...measurement.samples]),
      errorMessage: null,
    };
  } catch (error) {
    return {
      settled: false,
      settleReason: "exception",
      healthStatus: "exception",
      measurement: null,
      morphology: null,
      beat: [],
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function measureOptions(point: PointSpec, experimentalOptions: ModelCoreExperimentalOptions) {
  return {
    targetTBV: point.targetTBVMl,
    dt: profile.dt,
    sampleHz: profile.sampleHz,
    settlePolicy: profile.settlePolicy,
    measureBeats: profile.measureBeats,
    requireProjectorQuiet: profile.requireProjectorQuiet,
    experimentalOptions,
  };
}

function metricDigest(metrics: SimMetrics): MetricDigest {
  return {
    AoPMean: round(metrics.AoPMean),
    PAPMean: round(metrics.PAPMean),
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    LAPMean: round(metrics.LAPMean),
    RAPMean: round(metrics.RAPMean),
    EF_LApprox: round(metrics.EF_LApprox),
    EF_RApprox: round(metrics.EF_RApprox),
  };
}

function grossOk(morphology: MorphologyCheckSummary | null): boolean {
  return Boolean(
    morphology?.badges.lvPv === "ok"
    && morphology.badges.rvPv === "ok"
    && morphology.badges.mvf === "ok"
    && morphology.badges.tvf === "ok",
  );
}

function summarizeVariant(variant: VariantSpec, results: readonly RunResult[]): VariantSummary {
  const own = results.filter((result) => result.variantId === variant.id);
  const badgeCount = (badge: keyof MorphologyBadgeSummary) =>
    own.filter((result) => result.badges?.[badge] === "ok").length;
  const failures = own.filter((result) =>
    !result.grossVentricularMorphologyOk || !result.settled || result.healthStatus !== "ok"
  );
  return {
    variantId: variant.id,
    grossPassCount: own.filter((result) =>
      result.grossVentricularMorphologyOk && result.settled && result.healthStatus === "ok"
    ).length,
    measuredCount: own.filter((result) => result.morphologyStatus !== "not-measured").length,
    settledOkCount: own.filter((result) => result.settled && result.healthStatus === "ok").length,
    outputPreservedCount: own.filter((result) =>
      result.metrics
      && result.metrics.CO_L > 3.5
      && result.metrics.CO_L < 7.5
      && result.metrics.CO_R > 3.5
      && result.metrics.CO_R < 7.5
    ).length,
    lvPvOkCount: badgeCount("lvPv"),
    rvPvOkCount: badgeCount("rvPv"),
    laPvOkCount: badgeCount("laPv"),
    raPvOkCount: badgeCount("raPv"),
    mvfOkCount: badgeCount("mvf"),
    tvfOkCount: badgeCount("tvf"),
    lapOkCount: badgeCount("lapWaveform"),
    rapOkCount: badgeCount("rapWaveform"),
    firstFailedPoint: failures[0]?.pointId ?? null,
  };
}

function renderRunSvg(
  variant: VariantSpec,
  point: PointSpec,
  measurement: SteadyMeasurement,
  morphology: MorphologyCheckSummary | null,
  beat: readonly SimSample[],
): string {
  const samples = beat.length > 0 ? beat : measurement.samples;
  const width = 1320;
  const panelWidth = 420;
  const panelHeight = 290;
  const gap = 20;
  const left = 42;
  const top = 110;
  const rowGap = 50;
  const panel = (col: number, row: number) => ({
    x: left + col * (panelWidth + gap),
    y: top + row * (panelHeight + rowGap),
    width: panelWidth,
    height: panelHeight,
  });
  const panels = [
    renderPanel(panel(0, 0), "LV PV", "Volume (mL)", "Pressure (mmHg)", [
      { label: "LV", color: "#a855f7", points: samples.map((s) => ({ x: s.VLV, y: s.LVP })) },
    ]),
    renderPanel(panel(1, 0), "RV PV", "Volume (mL)", "Pressure (mmHg)", [
      { label: "RV", color: "#60a5fa", points: samples.map((s) => ({ x: s.VRV, y: s.RVP })) },
    ]),
    renderPanel(panel(2, 0), "AV inflow", "Theta", "Flow (mL/s)", [
      { label: "QMV", color: "#f472b6", points: samples.map((s) => ({ x: phaseOf(s), y: s.QMV })) },
      { label: "QTV", color: "#38bdf8", points: samples.map((s) => ({ x: phaseOf(s), y: s.QTV })) },
    ]),
    renderPanel(panel(0, 1), "LA PV", "Volume (mL)", "Pressure (mmHg)", [
      { label: "LA", color: "#c084fc", points: samples.map((s) => ({ x: s.VLA, y: s.LAP })) },
    ]),
    renderPanel(panel(1, 1), "RA PV", "Volume (mL)", "Pressure (mmHg)", [
      { label: "RA", color: "#67e8f9", points: samples.map((s) => ({ x: s.VRA, y: s.RAP })) },
    ]),
    renderPanel(panel(2, 1), "Pressure timing", "Theta", "Pressure (mmHg)", [
      { label: "LVP", color: "#a855f7", points: samples.map((s) => ({ x: phaseOf(s), y: s.LVP })) },
      { label: "LAP", color: "#f472b6", points: samples.map((s) => ({ x: phaseOf(s), y: s.LAP })) },
      { label: "AoP", color: "#f59e0b", points: samples.map((s) => ({ x: phaseOf(s), y: s.AoP })), dashed: true },
      { label: "RVP", color: "#60a5fa", points: samples.map((s) => ({ x: phaseOf(s), y: s.RVP })) },
      { label: "RAP", color: "#38bdf8", points: samples.map((s) => ({ x: phaseOf(s), y: s.RAP })) },
    ]),
  ].join("\n");
  const title = `${variant.label} / ${point.label}`;
  const badgeText = morphology
    ? `LV ${morphology.badges.lvPv} | RV ${morphology.badges.rvPv} | LA ${morphology.badges.laPv} | RA ${morphology.badges.raPv} | MVF ${morphology.badges.mvf} | TVF ${morphology.badges.tvf}`
    : "morphology not measured";
  const metrics = metricDigest(measurement.metrics);
  const failures = morphology
    ? morphology.results.filter((result) => result.status === "failed").map((result) => `${result.label}: ${result.value}`).join("  /  ")
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="820" viewBox="0 0 ${width} 820">
  <rect width="100%" height="100%" fill="#0b1120"/>
  <text x="42" y="42" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(title)}</text>
  <text x="42" y="70" fill="#a7b0c0" font-family="Arial, sans-serif" font-size="15">${escapeXml(badgeText)}</text>
  <text x="42" y="92" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13">${escapeXml(`CO_L ${metrics.CO_L} L/min, AoPmean ${metrics.AoPMean} mmHg, LAPmean ${metrics.LAPMean} mmHg, EF_L ${metrics.EF_LApprox}`)}</text>
  ${panels}
  <text x="42" y="793" fill="#fca5a5" font-family="Arial, sans-serif" font-size="13">${escapeXml(failures)}</text>
</svg>`;
}

function renderUnavailableSvg(variant: VariantSpec, point: PointSpec, reason: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="820" viewBox="0 0 1320 820">
  <rect width="100%" height="100%" fill="#0b1120"/>
  <text x="42" y="42" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(`${variant.label} / ${point.label}`)}</text>
  <text x="42" y="90" fill="#fca5a5" font-family="Arial, sans-serif" font-size="18">${escapeXml(`Unavailable: ${reason}`)}</text>
</svg>`;
}

function renderPanel(
  rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  title: string,
  xLabel: string,
  yLabel: string,
  series: readonly Series[],
): string {
  const finitePoints = series.flatMap((line) => line.points).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const xs = finitePoints.map((point) => point.x);
  const ys = finitePoints.map((point) => point.y);
  const xDomain = paddedDomain(xs);
  const yDomain = paddedDomain(ys);
  const plot = {
    x: rect.x + 44,
    y: rect.y + 30,
    width: rect.width - 64,
    height: rect.height - 62,
  };
  const sx = (value: number) => plot.x + ((value - xDomain[0]) / Math.max(xDomain[1] - xDomain[0], 1e-9)) * plot.width;
  const sy = (value: number) => plot.y + plot.height - ((value - yDomain[0]) / Math.max(yDomain[1] - yDomain[0], 1e-9)) * plot.height;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const x = plot.x + plot.width * fraction;
    const y = plot.y + plot.height * fraction;
    return `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${plot.y + plot.height}" stroke="#1f2937" stroke-width="1"/>
<line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" stroke="#1f2937" stroke-width="1"/>`;
  }).join("\n");
  const lines = series.map((line) => {
    const points = line.points
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      .map((point) => `${round(sx(point.x))},${round(sy(point.y))}`)
      .join(" ");
    return `<polyline points="${points}" fill="none" stroke="${line.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"${line.dashed ? ' stroke-dasharray="7 6"' : ""}/>`;
  }).join("\n");
  const legend = series.map((line, index) =>
    `<text x="${plot.x + 6 + index * 70}" y="${rect.y + 22}" fill="${line.color}" font-family="Arial, sans-serif" font-size="12">${escapeXml(line.label)}</text>`
  ).join("\n");
  return `<g>
  <text x="${rect.x}" y="${rect.y + 20}" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="16" font-weight="700">${escapeXml(title)}</text>
  ${legend}
  <rect x="${plot.x}" y="${plot.y}" width="${plot.width}" height="${plot.height}" fill="#111827" stroke="#334155" stroke-width="1"/>
  ${grid}
  ${lines}
  <text x="${plot.x + plot.width / 2}" y="${rect.y + rect.height - 8}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">${escapeXml(xLabel)}</text>
  <text x="${rect.x + 12}" y="${plot.y + plot.height / 2}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" transform="rotate(-90 ${rect.x + 12} ${plot.y + plot.height / 2})" text-anchor="middle">${escapeXml(yLabel)}</text>
</g>`;
}

function renderRunHtml(variant: VariantSpec, point: PointSpec, run: RunResult, svgName: string): string {
  const badge = run.grossVentricularMorphologyOk ? "ok" : "fail";
  const rows = [
    ["settled", String(run.settled)],
    ["health", run.healthStatus],
    ["gross LV/RV+AV", String(run.grossVentricularMorphologyOk)],
    ["badges", run.badges ? JSON.stringify(run.badges) : "n/a"],
    ["metrics", run.metrics ? JSON.stringify(run.metrics) : "n/a"],
  ].map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join("");
  const messages = run.messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("");
  return `<section class="run ${badge}">
  <header>
    <div>
      <h2>${escapeHtml(point.label)} <span>${escapeHtml(variant.label)}</span></h2>
      <p>${escapeHtml(variant.purpose)}</p>
    </div>
    <strong>${badge.toUpperCase()}</strong>
  </header>
  <img src="${escapeHtml(svgName)}" alt="${escapeHtml(`${variant.id} ${point.id}`)}"/>
  <details open>
    <summary>checker details</summary>
    <table>${rows}</table>
    <ul>${messages}</ul>
  </details>
</section>`;
}

function renderIndexHtml(evidence: Evidence, sections: readonly string[]): string {
  const summaries = evidence.variantSummaries.map((summary) =>
    `<tr><td>${escapeHtml(summary.variantId)}</td><td>${summary.grossPassCount}/${POINTS.length}</td><td>${summary.lvPvOkCount}/${POINTS.length}</td><td>${summary.rvPvOkCount}/${POINTS.length}</td><td>${summary.mvfOkCount}/${POINTS.length}</td><td>${summary.tvfOkCount}/${POINTS.length}</td><td>${summary.outputPreservedCount}/${POINTS.length}</td></tr>`
  ).join("");
  const questions = evidence.interpretation.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>0DSim Morphology Visual Review Phase 5CA</title>
  <style>
    body { margin: 0; padding: 28px; background: #050816; color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .meta, p, li, td, th { color: #a7b0c0; }
    .meta { margin-bottom: 22px; }
    table { border-collapse: collapse; margin: 14px 0 24px; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #1f2937; padding: 7px 9px; vertical-align: top; }
    th { color: #d1d5db; text-align: left; background: #111827; }
    .run { border: 1px solid #1f2937; border-radius: 8px; margin: 22px 0; padding: 14px; background: #0b1120; }
    .run header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
    .run h2 { margin: 0; font-size: 20px; }
    .run h2 span { display: block; color: #94a3b8; font-size: 14px; font-weight: 500; margin-top: 3px; }
    .run strong { border-radius: 999px; padding: 6px 10px; font-size: 12px; letter-spacing: .05em; }
    .run.ok strong { background: #064e3b; color: #a7f3d0; }
    .run.fail strong { background: #7f1d1d; color: #fecaca; }
    img { width: 100%; max-width: 1320px; display: block; margin: 12px auto; border: 1px solid #1f2937; border-radius: 6px; }
    details { margin-top: 10px; }
    summary { cursor: pointer; color: #d1d5db; }
    code { color: #f8fafc; background: #111827; padding: 1px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>0DSim Morphology Visual Review Phase 5CA</h1>
  <div class="meta">
    <div>Purpose: deterministic <code>morphology-check-v1</code> calibration with owner visual review.</div>
    <div>Artifact hash: <code>${escapeHtml(evidence.normalizedSha256)}</code></div>
    <div>Claim boundary: ${escapeHtml(evidence.interpretation.claimBoundary)}</div>
  </div>
  <h2>Variant Summary</h2>
  <table>
    <thead><tr><th>Variant</th><th>Gross</th><th>LV PV</th><th>RV PV</th><th>MVF</th><th>TVF</th><th>Output</th></tr></thead>
    <tbody>${summaries}</tbody>
  </table>
  <h2>Owner Review Questions</h2>
  <ul>${questions}</ul>
  ${sections.join("\n")}
</body>
</html>`;
}

function paddedDomain(values: readonly number[]): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (Math.abs(max - min) < 1e-9) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.06;
  return [min - pad, max + pad];
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeHtml(value: string): string {
  return escapeXml(value);
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function writeEvidence(): void {
  const evidence = buildMorphologyVisualReviewPhase5CAEvidences();
  const repoPath = path.resolve(MORPHOLOGY_VISUAL_REVIEW_PHASE5CA_RESULT_PATH);
  mkdirSync(path.dirname(repoPath), { recursive: true });
  writeFileSync(repoPath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({
    id: evidence.id,
    downloadsIndexHtml: INDEX_HTML,
    variantSummaries: evidence.variantSummaries,
    normalizedSha256: evidence.normalizedSha256,
  }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  writeEvidence();
}
