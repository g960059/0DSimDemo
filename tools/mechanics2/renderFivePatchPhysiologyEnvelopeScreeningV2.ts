import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DIMENSION_IDS_V2,
  type FivePatchPhysiologyEnvelopeDimensionIdV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2";
import {
  buildFivePatchPhysiologyEnvelopePlanV2,
  buildFivePatchPhysiologyEnvelopeResolvedRunV2,
  type FivePatchPhysiologyEnvelopeRunResultV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeRunnerV2";
import {
  validateFivePatchPhysiologyEnvelopeAssemblyManifestV2,
  validateFivePatchPhysiologyEnvelopePersistedResultV2,
  type FivePatchPhysiologyEnvelopeAssemblyManifestV2,
  type FivePatchPhysiologyEnvelopePersistedResultV2,
} from "@/tools/mechanics2/runFivePatchPhysiologyEnvelopeV2";

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_RENDERER_ID_V2 =
  "five-patch-physiology-envelope-screening-renderer-v2" as const;

export const DEFAULT_FIVE_PATCH_PHYSIOLOGY_SCREENING_DIRECTORY_V2 = resolve(
  "data/mechanics2/envelope/five-patch-physiology-envelope-v2/screening",
);
export const DEFAULT_FIVE_PATCH_PHYSIOLOGY_SCREENING_VISUAL_PATH_V2 = resolve(
  "data/mechanics2/visuals/five-patch-physiology-envelope-screening-v2.html",
);

const ASSEMBLY_MANIFEST_NAME_V2 = "_assembly-manifest.json";
const CLIENT_SOURCE_PATH_V2 = fileURLToPath(new URL(
  "./renderFivePatchPhysiologyEnvelopeScreeningClientV2.js",
  import.meta.url,
));

const PARAMETER_LABELS_V2: Readonly<
  Record<FivePatchPhysiologyEnvelopeDimensionIdV2, string>
> = Object.freeze({
  atrialActiveScale: "Atrial active homogenization scale",
  ventricularActiveScale: "Ventricular active homogenization scale",
  atrialCalciumDecayScale: "Atrial prescribed-calcium decay scale",
  ventricularCalciumDecayScale:
    "Ventricular prescribed-calcium decay scale",
  avDelaySec: "Atrial-to-ventricular activation delay (s)",
  ventricularPassiveTangentScale:
    "Ventricular equilibrium-passive tangent scale",
  mitralHydraulicAreaScale: "Coupled mitral hydraulic area scale",
  pulmonaryVenousResistanceScale:
    "Pulmonary-vein-to-LA segment resistance scale",
  pulmonaryVenousInertanceScale:
    "Pulmonary-vein-to-LA segment inertance scale",
  pulmonaryVeinComplianceScale: "Pulmonary-vein compliance scale",
  bloodVolumeScale: "Exact total blood-volume scale",
  systemicResistanceScale: "Systemic peripheral-resistance scale",
});

type CompactRawSampleV2 = readonly [
  phase01: number,
  leftAtriumVolumeMl: number,
  leftAtriumPressureMmHg: number,
  leftVentricleVolumeMl: number,
  leftVentriclePressureMmHg: number,
  mitralFlowMlPerSec: number,
  pulmonaryVenousFlowMlPerSec: number,
  pulmonaryVeinPressureMmHg: number,
  aorticPressureMmHg: number,
  laEquilibriumPassivePressureMmHg: number,
  laEffectiveLandActivePressureMmHg: number,
  laSlsOverstressPressureMmHg: number,
  laTotalPressureMmHg: number,
  leftAtriumFreeCalciumUm: number,
  rightAtriumFreeCalciumUm: number,
  leftFreeWallFreeCalciumUm: number,
  septumFreeCalciumUm: number,
  rightFreeWallFreeCalciumUm: number,
  leftAtriumActivation01: number,
  rightAtriumActivation01: number,
  leftFreeWallActivation01: number,
  septumActivation01: number,
  rightFreeWallActivation01: number,
  laPvPhaseCode: 0 | 1 | 2 | 3,
];

type MetricValueV2 = number | string | boolean | null;

export type FivePatchPhysiologyScreeningGateRowV2 = {
  readonly id: string;
  readonly passed: boolean;
  readonly observed: unknown;
  readonly expected: unknown;
};

export type FivePatchPhysiologyScreeningVisualRunV2 = {
  readonly canonicalOrdinal: number;
  readonly runId: string;
  readonly candidateId: string;
  readonly candidateIndex: number;
  readonly status: FivePatchPhysiologyEnvelopeRunResultV2["status"];
  readonly periodicityStatus:
    FivePatchPhysiologyEnvelopeRunResultV2["periodicity"]["status"];
  readonly numericalEligible: boolean;
  readonly broadOperatingPointEligible: boolean;
  readonly combinedEligible: boolean;
  readonly retainedEndpointCount: number;
  readonly failureReasons: readonly string[];
  readonly parameterRows: readonly {
    readonly id: FivePatchPhysiologyEnvelopeDimensionIdV2;
    readonly label: string;
    readonly value: number;
  }[];
  readonly numericalGateRows: readonly FivePatchPhysiologyScreeningGateRowV2[];
  readonly broadGateRows: readonly FivePatchPhysiologyScreeningGateRowV2[];
  readonly physiologyMetrics: Readonly<Record<string, MetricValueV2>>;
  readonly vLoopMetrics: Readonly<Record<string, MetricValueV2>>;
  readonly vLoopUsePolicy:
    FivePatchPhysiologyEnvelopeRunResultV2["vLoopUsePolicy"];
  readonly samples: readonly CompactRawSampleV2[];
};

export type FivePatchPhysiologyScreeningSummaryV2 = {
  readonly rendererId:
    typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_RENDERER_ID_V2;
  readonly sourcePhase: "screening";
  readonly sourceScenario: "hr60-reference";
  readonly canonicalRunCount: 64;
  readonly sourceTreatment:
    "raw-retained-endpoints-no-smoothing-no-resampling";
  readonly interpretation:
    "canonical-order-no-ranking-winner-score-or-v-loop-gate";
  readonly assemblySha256: string;
  readonly counts: {
    readonly total: 64;
    readonly runComplete: number;
    readonly integrationFailure: number;
    readonly numericalEligible: number;
    readonly broadOperatingPointEligible: number;
    readonly combinedEligible: number;
    readonly measurableVLoop: number;
  };
  readonly runs: readonly Omit<
    FivePatchPhysiologyScreeningVisualRunV2,
    "samples"
  >[];
};

export type FivePatchPhysiologyScreeningLoadedAssemblyV2 = {
  readonly manifest: FivePatchPhysiologyEnvelopeAssemblyManifestV2;
  readonly results:
    readonly FivePatchPhysiologyEnvelopePersistedResultV2[];
  readonly artifactNames: readonly string[];
};

export function loadFivePatchPhysiologyEnvelopeScreeningV2(
  directoryPath = DEFAULT_FIVE_PATCH_PHYSIOLOGY_SCREENING_DIRECTORY_V2,
): FivePatchPhysiologyScreeningLoadedAssemblyV2 {
  const manifest = validateFivePatchPhysiologyEnvelopeAssemblyManifestV2(
    JSON.parse(readFileSync(
      join(directoryPath, ASSEMBLY_MANIFEST_NAME_V2),
      "utf8",
    )),
  );
  const artifactNames = readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) =>
      entry.isFile() &&
      entry.name.endsWith(".json") &&
      entry.name !== ASSEMBLY_MANIFEST_NAME_V2
    )
    .map((entry) => entry.name)
    .sort();
  const plan = buildFivePatchPhysiologyEnvelopePlanV2("screening");
  if (artifactNames.length !== plan.length) {
    throw new Error(
      `V2 screening directory must contain exactly ${plan.length} validated ` +
        `run artifacts besides ${ASSEMBLY_MANIFEST_NAME_V2}; found ` +
        artifactNames.length,
    );
  }
  const unordered = artifactNames.map((name) =>
    validateFivePatchPhysiologyEnvelopePersistedResultV2(
      JSON.parse(readFileSync(join(directoryPath, name), "utf8")),
    )
  );
  const byRequest = new Map<string, FivePatchPhysiologyEnvelopePersistedResultV2>();
  for (const result of unordered) {
    validateScreeningResultContentV2(result);
    const key = canonicalJson(result.request);
    if (byRequest.has(key)) {
      throw new Error(`duplicate V2 screening coordinate: ${key}`);
    }
    byRequest.set(key, result);
  }
  const results = Object.freeze(plan.map((request) => {
    const result = byRequest.get(canonicalJson(request));
    if (result == null) {
      throw new Error(
        `V2 screening assembly is missing canonical coordinate: ` +
          canonicalJson(request),
      );
    }
    return result;
  }));
  if (byRequest.size !== results.length) {
    throw new Error("V2 screening assembly contains noncanonical coordinates");
  }
  validateCanonicalScreeningManifestV2(manifest, results);
  return Object.freeze({
    manifest,
    results,
    artifactNames: Object.freeze([...artifactNames]),
  });
}

export function buildFivePatchPhysiologyScreeningVisualRunsV2(
  results: readonly FivePatchPhysiologyEnvelopePersistedResultV2[],
): readonly FivePatchPhysiologyScreeningVisualRunV2[] {
  requireCanonicalResultsV2(results);
  return Object.freeze(results.map((result, canonicalOrdinal) =>
    compactVisualRunV2(result, canonicalOrdinal)
  ));
}

export function summarizeFivePatchPhysiologyEnvelopeScreeningV2(
  results: readonly FivePatchPhysiologyEnvelopePersistedResultV2[],
  manifest: FivePatchPhysiologyEnvelopeAssemblyManifestV2,
): FivePatchPhysiologyScreeningSummaryV2 {
  const visualRuns = buildFivePatchPhysiologyScreeningVisualRunsV2(results);
  validateCanonicalScreeningManifestV2(manifest, results);
  const summaryRuns = Object.freeze(visualRuns.map(({ samples: _samples, ...run }) =>
    Object.freeze(run)
  ));
  return Object.freeze({
    rendererId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_RENDERER_ID_V2,
    sourcePhase: "screening" as const,
    sourceScenario: "hr60-reference" as const,
    canonicalRunCount: 64 as const,
    sourceTreatment:
      "raw-retained-endpoints-no-smoothing-no-resampling" as const,
    interpretation:
      "canonical-order-no-ranking-winner-score-or-v-loop-gate" as const,
    assemblySha256: manifest.assemblySha256,
    counts: Object.freeze({
      total: 64 as const,
      runComplete: visualRuns.filter((run) => run.status === "run-complete").length,
      integrationFailure: visualRuns.filter(
        (run) => run.status === "integration-failure",
      ).length,
      numericalEligible: visualRuns.filter((run) => run.numericalEligible).length,
      broadOperatingPointEligible: visualRuns.filter(
        (run) => run.broadOperatingPointEligible,
      ).length,
      combinedEligible: visualRuns.filter((run) => run.combinedEligible).length,
      measurableVLoop: visualRuns.filter((run) =>
        run.vLoopMetrics["Measurement status"] === "measurable"
      ).length,
    }),
    runs: summaryRuns,
  });
}

export function renderFivePatchPhysiologyEnvelopeScreeningHtmlV2(
  summary: FivePatchPhysiologyScreeningSummaryV2,
  results: readonly FivePatchPhysiologyEnvelopePersistedResultV2[],
): string {
  const visualRuns = buildFivePatchPhysiologyScreeningVisualRunsV2(results);
  if (summary.canonicalRunCount !== 64 || visualRuns.length !== 64) {
    throw new Error("V2 screening HTML requires the exact canonical 64 runs");
  }
  const embeddedRuns = safeEmbeddedJson(visualRuns);
  const client = readFileSync(CLIENT_SOURCE_PATH_V2, "utf8");
  if (!client.includes("__EMBEDDED_FIVE_PATCH_PHYSIOLOGY_RUNS_V2__")) {
    throw new Error("V2 screening client data placeholder is missing");
  }
  const clientWithData = client.replace(
    "__EMBEDDED_FIVE_PATCH_PHYSIOLOGY_RUNS_V2__",
    embeddedRuns,
  );
  const counts = summary.counts;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Five-patch physiology envelope V2 screening</title>
<style>
:root{color-scheme:light dark;--background:#f7f8fb;--foreground:#18202b;--card:#fff;--card-foreground:#18202b;--muted:#e9edf3;--muted-foreground:#556274;--border:#c9d1dc;--input:#bcc6d3;--ring:#346db7;--primary:#264f86;--primary-foreground:#fff;--accent:#e1ebf8;--accent-foreground:#173d6d;--destructive:#a52d3d;--viz-series-1:#1879b8;--viz-series-2:#b06b00;--viz-series-3:#a13985;--viz-series-4:#25815a;--viz-series-5:#7656ad;--viz-series-6:#8a4c2d;--sidebar-width:340px}
@media(prefers-color-scheme:dark){:root{--background:#07111f;--foreground:#e8eef8;--card:#101b2d;--card-foreground:#e8eef8;--muted:#18253a;--muted-foreground:#aab7ca;--border:#2d3e59;--input:#3a4b66;--ring:#8ebdff;--primary:#d7e7ff;--primary-foreground:#10213a;--accent:#1b3353;--accent-foreground:#e5efff;--destructive:#ff8fa1;--viz-series-1:#54bdff;--viz-series-2:#ffb020;--viz-series-3:#ed70bd;--viz-series-4:#7bdc9c;--viz-series-5:#b99cff;--viz-series-6:#e69469}}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--foreground);font:400 14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,select{font:inherit}.app-shell{height:100vh;display:grid;grid-template-columns:var(--sidebar-width) 8px minmax(0,1fr);overflow:hidden}.sidebar,.main-pane{min-height:0;overflow:auto;scrollbar-gutter:stable}.sidebar{padding:18px 16px;background:var(--card);color:var(--card-foreground)}.main-pane{padding:20px 22px}.splitter{margin:0;padding:0;border:0;border-left:1px solid var(--border);border-right:1px solid var(--border);background:var(--muted);cursor:col-resize}.splitter:hover{background:var(--accent)}h1{font-size:1.35rem;font-weight:500;margin:0 0 4px}h2{font-size:1rem;font-weight:500;margin:0}h3{font-size:.94rem;font-weight:500;margin:0}.muted{color:var(--muted-foreground)}.small{font-size:.82rem}.notice{margin:14px 0;padding:10px 12px;border-left:3px solid var(--viz-series-2);background:var(--muted)}.count-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0}.count-item{min-width:0;padding:8px;background:var(--muted)}.count-item strong{display:block;font-size:1.08rem;font-weight:500}.section{margin-top:18px}.section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.candidate-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.candidate-button{min-width:0;padding:7px 4px;border:1px solid var(--border);background:transparent;color:var(--foreground);cursor:pointer}.candidate-button[aria-pressed="true"]{background:var(--primary);color:var(--primary-foreground);border-color:var(--primary)}.candidate-button .candidate-state{display:block;font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.metric-list{display:grid;gap:1px;background:var(--border);border:1px solid var(--border)}.metric-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;background:var(--card);padding:7px 8px}.metric-value{text-align:right;font-variant-numeric:tabular-nums;max-width:150px;overflow-wrap:anywhere}.label-button{min-width:0;width:100%;border:0;padding:0;background:transparent;color:inherit;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:help}.gate-pass{color:var(--viz-series-4)}.gate-fail{color:var(--destructive)}.report-only{border-left:3px solid var(--viz-series-3)}.main-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:16px}.selection-status{display:flex;gap:8px;flex-wrap:wrap}.badge{display:inline-flex;align-items:center;padding:3px 7px;background:var(--muted);color:var(--foreground);border:1px solid var(--border)}.badge.pass{border-color:var(--viz-series-4)}.badge.fail{border-color:var(--destructive)}.chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.chart-panel{min-width:0}.chart-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:5px}.legend{display:flex;gap:11px;flex-wrap:wrap;color:var(--muted-foreground);font-size:.8rem}.legend-item{white-space:nowrap}.legend-line{display:inline-block;width:16px;border-top:2px solid var(--series);vertical-align:3px;margin-right:4px}.legend-line.dashed{border-top-style:dashed}.legend-line.dotted{border-top-style:dotted}.plot{display:block;width:100%;height:auto;min-height:250px;background:var(--card);border:1px solid var(--border)}.axis,.gridline{stroke:var(--border);stroke-width:1}.gridline{opacity:.72}.tick,.axis-label{fill:var(--muted-foreground);font-size:11px}.raw-path{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.series-1{stroke:var(--viz-series-1)}.series-2{stroke:var(--viz-series-2)}.series-3{stroke:var(--viz-series-3)}.series-4{stroke:var(--viz-series-4)}.series-5{stroke:var(--viz-series-5)}.series-6{stroke:var(--viz-series-6)}.phase-reservoir{stroke:var(--viz-series-1)}.phase-conduit{stroke:var(--viz-series-2);stroke-dasharray:7 4}.phase-pumping{stroke:var(--viz-series-3);stroke-dasharray:2 3}.phase-transition{stroke:var(--muted-foreground)}.empty-plot{fill:var(--muted-foreground);font-size:13px}.tooltip{position:fixed;z-index:20;max-width:340px;padding:7px 9px;background:var(--foreground);color:var(--background);pointer-events:none;visibility:hidden}.tooltip.visible{visibility:visible}.footer-note{margin:18px 0 4px;color:var(--muted-foreground)}
@media(max-width:1000px){.chart-grid{grid-template-columns:1fr}}
@media(max-width:760px){.app-shell{grid-template-columns:1fr;grid-template-rows:minmax(180px,42vh) minmax(0,1fr)}.splitter{display:none}.sidebar{border-bottom:1px solid var(--border)}.main-pane{padding:16px 12px}.candidate-list{grid-template-columns:repeat(8,minmax(0,1fr))}}
@media(max-width:460px){.candidate-list{grid-template-columns:repeat(4,minmax(0,1fr))}.count-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style></head><body>
<div id="five-patch-physiology-screening-v2" class="app-shell">
<aside class="sidebar" aria-label="Canonical screening coordinates and selected diagnostics">
  <h1>Five-patch physiology envelope V2</h1>
  <p class="muted">64-point HR60 screening · assembly <code>${summary.assemblySha256.slice(0, 16)}</code></p>
  <div class="notice"><strong>Report-only explorer.</strong> Canonical order is fixed. There is no score, ranking, winner selection, smoothing, resampling, or V-loop gate.</div>
  <div class="count-grid" aria-label="Screening assembly counts">
    <div class="count-item"><span class="muted small">complete</span><strong>${counts.runComplete}/64</strong></div>
    <div class="count-item"><span class="muted small">numerical</span><strong>${counts.numericalEligible}/64</strong></div>
    <div class="count-item"><span class="muted small">broad plausible</span><strong>${counts.broadOperatingPointEligible}/64</strong></div>
    <div class="count-item"><span class="muted small">both gates</span><strong>${counts.combinedEligible}/64</strong></div>
    <div class="count-item"><span class="muted small">V measurable</span><strong>${counts.measurableVLoop}/64</strong></div>
    <div class="count-item"><span class="muted small">failures</span><strong>${counts.integrationFailure}/64</strong></div>
  </div>
  <section class="section" aria-labelledby="candidate-heading"><div class="section-head"><h2 id="candidate-heading">Canonical coordinates</h2><span class="muted small">no ordering by result</span></div><div id="candidate-list" class="candidate-list"></div></section>
  <section class="section" aria-labelledby="parameter-heading"><div class="section-head"><h2 id="parameter-heading">Parameters</h2></div><div id="parameter-list" class="metric-list"></div></section>
  <section class="section" aria-labelledby="numerical-heading"><div class="section-head"><h2 id="numerical-heading">Numerical eligibility</h2></div><div id="numerical-list" class="metric-list"></div></section>
  <section class="section" aria-labelledby="broad-heading"><div class="section-head"><h2 id="broad-heading">Broad plausibility</h2><span class="muted small">not calibration</span></div><div id="broad-list" class="metric-list"></div></section>
  <section class="section" aria-labelledby="physiology-heading"><div class="section-head"><h2 id="physiology-heading">Filling / relaxation</h2><span class="muted small">report-only</span></div><div id="physiology-list" class="metric-list report-only"></div></section>
  <section class="section" aria-labelledby="vloop-heading"><div class="section-head"><h2 id="vloop-heading">LA V-loop</h2><span class="muted small">report-only</span></div><div id="vloop-list" class="metric-list report-only"></div></section>
</aside>
<button id="sidebar-splitter" class="splitter" type="button" role="separator" aria-label="Resize diagnostics sidebar" aria-orientation="vertical" aria-valuemin="280" aria-valuemax="720" aria-valuenow="340"></button>
<main class="main-pane">
  <header class="main-header"><div><h2 id="selected-title">Canonical #0</h2><p id="selected-subtitle" class="muted"></p><p id="selected-failure" class="small"></p></div><div id="selection-status" class="selection-status" aria-label="Selected eligibility statuses"></div></header>
  <div class="chart-grid">
    <section class="chart-panel"><div class="chart-head"><h3>LA blood-volume PV</h3><div class="legend"><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-1)"></i>reservoir</span><span class="legend-item"><i class="legend-line dashed" style="--series:var(--viz-series-2)"></i>conduit</span><span class="legend-item"><i class="legend-line dotted" style="--series:var(--viz-series-3)"></i>pumping</span></div></div><svg id="la-pv" class="plot" viewBox="0 0 560 340" role="img" aria-labelledby="la-pv-title la-pv-desc"><title id="la-pv-title">Left atrial pressure-volume path</title><desc id="la-pv-desc">Raw accepted endpoints colored by reservoir, conduit, and pumping phase anchors.</desc></svg></section>
    <section class="chart-panel"><div class="chart-head"><h3>LV blood-volume PV</h3></div><svg id="lv-pv" class="plot" viewBox="0 0 560 340" role="img" aria-labelledby="lv-pv-title lv-pv-desc"><title id="lv-pv-title">Left ventricular pressure-volume path</title><desc id="lv-pv-desc">Raw accepted endpoints in canonical temporal order.</desc></svg></section>
    <section class="chart-panel"><div class="chart-head"><h3>Mitral and pulmonary-venous flow</h3><div class="legend"><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-1)"></i>MV</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-3)"></i>PV-to-LA</span></div></div><svg id="flows" class="plot" viewBox="0 0 560 340" role="img" aria-labelledby="flows-title flows-desc"><title id="flows-title">Mitral and pulmonary venous flow</title><desc id="flows-desc">Unsmoothed raw volume-flow waveforms over cardiac phase.</desc></svg></section>
    <section class="chart-panel"><div class="chart-head"><h3>LAP and pulmonary-vein pressure</h3><div class="legend"><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-1)"></i>LAP</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-3)"></i>PVe</span></div></div><svg id="low-pressures" class="plot" viewBox="0 0 560 340" role="img" aria-labelledby="low-pressure-title low-pressure-desc"><title id="low-pressure-title">Left atrial and pulmonary vein pressure</title><desc id="low-pressure-desc">Raw low-pressure waveforms over cardiac phase.</desc></svg></section>
    <section class="chart-panel"><div class="chart-head"><h3>LVP and aortic pressure</h3><div class="legend"><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-2)"></i>LVP</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-4)"></i>AoP</span></div></div><svg id="high-pressures" class="plot" viewBox="0 0 560 340" role="img" aria-labelledby="high-pressure-title high-pressure-desc"><title id="high-pressure-title">Left ventricular and aortic pressure</title><desc id="high-pressure-desc">Raw high-pressure waveforms over cardiac phase.</desc></svg></section>
    <section class="chart-panel"><div class="chart-head"><h3>LA pressure components</h3><div class="legend"><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-1)"></i>passive</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-2)"></i>active</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-3)"></i>SLS</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-4)"></i>total</span></div></div><svg id="components" class="plot" viewBox="0 0 560 340" role="img" aria-labelledby="components-title components-desc"><title id="components-title">Left atrial work-conjugate pressure components</title><desc id="components-desc">Equilibrium passive, effective Land active, SLS overstress, and total pressure readbacks.</desc></svg></section>
    <section class="chart-panel"><div class="chart-head"><h3>Prescribed free calcium</h3><div class="legend"><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-1)"></i>LA</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-2)"></i>RA</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-3)"></i>LVFW</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-4)"></i>SEP</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-5)"></i>RVFW</span></div></div><svg id="calcium" class="plot" viewBox="0 0 560 340" role="img" aria-labelledby="calcium-title calcium-desc"><title id="calcium-title">Prescribed free calcium drivers</title><desc id="calcium-desc">Five patch calcium forcing readbacks over cardiac phase.</desc></svg></section>
    <section class="chart-panel"><div class="chart-head"><h3>Land activation readback</h3><div class="legend"><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-1)"></i>LA</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-2)"></i>RA</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-3)"></i>LVFW</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-4)"></i>SEP</span><span class="legend-item"><i class="legend-line" style="--series:var(--viz-series-5)"></i>RVFW</span></div></div><svg id="activation" class="plot" viewBox="0 0 560 340" role="img" aria-labelledby="activation-title activation-desc"><title id="activation-title">Five patch Land activation</title><desc id="activation-desc">Five patch activation readbacks over cardiac phase.</desc></svg></section>
  </div>
  <p class="footer-note">Every trace joins retained accepted endpoints by straight segments. Missing channels are not imputed. Failed or nonperiodic runs remain selectable as numerical evidence, while all filling and V-loop readbacks remain report-only.</p>
</main>
</div><div id="screening-tooltip" class="tooltip" role="tooltip"></div>
<script>${clientWithData}</script></body></html>`;
}

export function renderFivePatchPhysiologyEnvelopeScreeningFileV2(
  directoryPath = DEFAULT_FIVE_PATCH_PHYSIOLOGY_SCREENING_DIRECTORY_V2,
  outputPath = DEFAULT_FIVE_PATCH_PHYSIOLOGY_SCREENING_VISUAL_PATH_V2,
): {
  readonly outputPath: string;
  readonly artifactCount: 64;
  readonly assemblySha256: string;
} {
  const loaded = loadFivePatchPhysiologyEnvelopeScreeningV2(directoryPath);
  const summary = summarizeFivePatchPhysiologyEnvelopeScreeningV2(
    loaded.results,
    loaded.manifest,
  );
  const html = renderFivePatchPhysiologyEnvelopeScreeningHtmlV2(
    summary,
    loaded.results,
  );
  writeTextAtomically(outputPath, html);
  return Object.freeze({
    outputPath,
    artifactCount: 64 as const,
    assemblySha256: summary.assemblySha256,
  });
}

function requireCanonicalResultsV2(
  results: readonly FivePatchPhysiologyEnvelopePersistedResultV2[],
): void {
  const plan = buildFivePatchPhysiologyEnvelopePlanV2("screening");
  if (results.length !== plan.length) {
    throw new Error("V2 screening renderer requires exactly 64 artifacts");
  }
  for (let index = 0; index < plan.length; index += 1) {
    if (canonicalJson(results[index]!.request) !== canonicalJson(plan[index]!)) {
      throw new Error(`V2 screening canonical order mismatch at ordinal ${index}`);
    }
    validateScreeningResultContentV2(results[index]!);
  }
}

function validateCanonicalScreeningManifestV2(
  manifest: FivePatchPhysiologyEnvelopeAssemblyManifestV2,
  results: readonly FivePatchPhysiologyEnvelopePersistedResultV2[],
): void {
  if (
    manifest.phase !== "screening" ||
    manifest.shard.shardIndex !== 0 ||
    manifest.shard.shardCount !== 1 ||
    manifest.completePlanRunCount !== 64 ||
    manifest.shardPlanRunCount !== 64 ||
    manifest.executedRunCount !== 64
  ) {
    throw new Error(
      "V2 screening renderer requires the canonical unsharded 64-run manifest",
    );
  }
  const orderedRunIds = results.map((result) => result.runId);
  const orderedArtifactSha256s = results.map(
    (result) => result.artifact.normalizedSha256,
  );
  if (
    canonicalJson(manifest.orderedRunIds) !== canonicalJson(orderedRunIds) ||
    canonicalJson(manifest.orderedArtifactSha256s) !==
      canonicalJson(orderedArtifactSha256s)
  ) {
    throw new Error(
      "V2 screening manifest does not match canonical run IDs and artifact hashes",
    );
  }
}

function validateScreeningResultContentV2(
  result: FivePatchPhysiologyEnvelopePersistedResultV2,
): void {
  if (
    result.request.phase !== "screening" ||
    result.request.scenarioId !== "hr60-reference" ||
    result.request.beats !== 32 ||
    result.request.dtSec !== 0.002
  ) {
    throw new Error(`artifact is not a canonical V2 screening run: ${result.runId}`);
  }
  const expected = buildFivePatchPhysiologyEnvelopeResolvedRunV2(
    result.request,
  );
  if (
    result.runId !== expected.runId ||
    result.candidateId !== expected.candidateId ||
    canonicalJson(result.unitPoint) !== canonicalJson(expected.unitPoint) ||
    canonicalJson(result.parameterVector) !==
      canonicalJson(expected.parameterVector) ||
    result.parameterIdentityCanonicalJson !==
      expected.parameterIdentityCanonicalJson
  ) {
    throw new Error(
      `artifact coordinate or parameter identity is not canonical: ${result.runId}`,
    );
  }
  if (!Array.isArray(result.finalCycleSamples)) {
    throw new Error(`V2 screening artifact has no raw endpoint array: ${result.runId}`);
  }
  if (
    result.fillingRelaxationDiagnostics == null ||
    result.numericalEligibility == null ||
    result.reportOnlyRawCycleDiagnostics == null
  ) {
    throw new Error(`V2 screening artifact lacks required diagnostics: ${result.runId}`);
  }
  if (
    result.vLoopUsePolicy.status !== "report-only" ||
    result.vLoopUsePolicy.affectsSettling ||
    result.vLoopUsePolicy.affectsNumericalEligibility ||
    result.vLoopUsePolicy.affectsOperatingPointEligibility ||
    result.vLoopUsePolicy.affectsSelection ||
    result.vLoopUsePolicy.affectsRangeRevision
  ) {
    throw new Error(`V-loop policy is not report-only: ${result.runId}`);
  }
}

function compactVisualRunV2(
  result: FivePatchPhysiologyEnvelopePersistedResultV2,
  canonicalOrdinal: number,
): FivePatchPhysiologyScreeningVisualRunV2 {
  const diagnostics = result.fillingRelaxationDiagnostics as unknown;
  const broad = readPath(diagnostics, ["broadOperatingPointEligibility"]);
  const combined = readBoolean(readPath(diagnostics, ["eligibility", "eligible"]));
  const operatingPoint = readPath(diagnostics, ["operatingPoint"]);
  const detailed = readPath(diagnostics, ["detailedPhysiologyReportOnly"]);
  const rawLobes = readPath(diagnostics, [
    "leftAtrialVLoopReportOnly",
    "rawLobeMeasurement",
  ]);
  const strict = readPath(diagnostics, [
    "leftAtrialVLoopReportOnly",
    "strictMatchedVolume",
  ]);
  const pressureWaves = result.reportOnlyRawCycleDiagnostics.pressureWaves;
  const physiologyMetrics = Object.freeze({
    "Cardiac output (L/min)": readNumber(readPath(
      operatingPoint,
      ["cardiacOutputLPerMin"],
    )),
    "LV ejection fraction": readNumber(readPath(
      operatingPoint,
      ["leftVentricle", "ejectionFractionProxy01"],
    )),
    "LV EDV proxy (mL)": readNumber(readPath(
      operatingPoint,
      ["leftVentricle", "endDiastolicVolumeProxyMl"],
    )),
    "LV ESV proxy (mL)": readNumber(readPath(
      operatingPoint,
      ["leftVentricle", "endSystolicVolumeProxyMl"],
    )),
    "Preferred tau (s)": readNumber(readPath(
      detailed,
      ["lvRelaxation", "preferredTauSec"],
    )),
    "Tau fit validity": readString(readPath(
      detailed,
      ["lvRelaxation", "preferredFitValidity"],
    )),
    "Peak negative dP/dt (mmHg/s)": readNumber(readPath(
      detailed,
      ["lvRelaxation", "peakNegativeDpDtMmHgPerSec"],
    )),
    "Mitral E peak (mL/s)": readNumber(readPath(
      detailed,
      ["mitral", "ePeakMlPerSec"],
    )),
    "Mitral A peak (mL/s)": readNumber(readPath(
      detailed,
      ["mitral", "aPeakMlPerSec"],
    )),
    "Mitral E/A": readNumber(readPath(detailed, ["mitral", "eToA"])),
    "Interpeak valley (mL/s)": readNumber(readPath(
      detailed,
      ["mitral", "interpeakValleyMlPerSec"],
    )),
    "Pulmonary venous S/D": readNumber(readPath(
      detailed,
      ["pulmonaryVenous", "sToD"],
    )),
    "LA reservoir filling (mL)": readNumber(readPath(
      detailed,
      ["leftAtrialPhasicVolumes", "reservoirFillingMl"],
    )),
    "LA conduit emptying (mL)": readNumber(readPath(
      detailed,
      ["leftAtrialPhasicVolumes", "conduitEmptyingMl"],
    )),
    "LA pump emptying (mL)": readNumber(readPath(
      detailed,
      ["leftAtrialPhasicVolumes", "pumpEmptyingMl"],
    )),
    "x trough (mmHg)": pressureWaves?.xTrough?.pressureMmHg ?? null,
    "v peak (mmHg)": pressureWaves?.vPeak?.pressureMmHg ?? null,
    "y trough (mmHg)": pressureWaves?.yTrough?.pressureMmHg ?? null,
  });
  const vLoopMetrics = Object.freeze({
    "Use policy": result.vLoopUsePolicy.status,
    "Measurement status": readString(readPath(rawLobes, ["measurementStatus"])),
    "Proper crossings": readNumber(readPath(rawLobes, ["selfIntersectionCount"])),
    "A area (mmHg mL)": readNumber(readPath(
      rawLobes,
      ["aLobe", "absoluteAreaMmHgMl"],
    )),
    "V area (mmHg mL)": readNumber(readPath(
      rawLobes,
      ["vLobe", "absoluteAreaMmHgMl"],
    )),
    "A/V area ratio": readNumber(readPath(
      rawLobes,
      ["aToVAbsoluteAreaRatioUnbounded"],
    )),
    "Matched-volume status": readString(readPath(strict, ["availability"])),
    "Overlap width (mL)": readNumber(readPath(strict, ["overlapVolumeMl"])),
    "Normalized overlap width": readNumber(readPath(
      strict,
      ["normalizedOverlapWidth01"],
    )),
    "Mean reservoir-conduit gap (mmHg)": readNumber(readPath(
      strict,
      ["gapMmHg", "mean"],
    )),
    "Integrated gap (mmHg mL)": readNumber(readPath(
      strict,
      ["integratedGapMmHgMl"],
    )),
    "Normalized integrated gap": readNumber(readPath(
      strict,
      ["normalizedIntegratedGap"],
    )),
  });
  return Object.freeze({
    canonicalOrdinal,
    runId: result.runId,
    candidateId: result.candidateId,
    candidateIndex: result.request.candidateIndex,
    status: result.status,
    periodicityStatus: result.periodicity.status,
    numericalEligible: result.numericalEligibility.passed,
    broadOperatingPointEligible:
      readBoolean(readPath(broad, ["eligible"])) ?? false,
    combinedEligible: combined ?? false,
    retainedEndpointCount: result.finalCycleSamples.length,
    failureReasons: Object.freeze([...result.failureReasons]),
    parameterRows: Object.freeze(
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DIMENSION_IDS_V2.map((id) =>
        Object.freeze({
          id,
          label: PARAMETER_LABELS_V2[id],
          value: result.parameterVector[id],
        })
      ),
    ),
    numericalGateRows: Object.freeze(Object.entries(
      result.numericalEligibility.checks,
    ).map(([id, passed]) => Object.freeze({
      id,
      passed,
      observed: passed,
      expected: true,
    }))),
    broadGateRows: Object.freeze(readGateRowsV2(broad)),
    physiologyMetrics,
    vLoopMetrics,
    vLoopUsePolicy: result.vLoopUsePolicy,
    samples: Object.freeze(result.finalCycleSamples.map((sample) =>
      compactRawSampleV2(sample, result)
    )),
  });
}

function compactRawSampleV2(
  sample: FivePatchPhysiologyEnvelopeRunResultV2["finalCycleSamples"][number],
  result: FivePatchPhysiologyEnvelopePersistedResultV2,
): CompactRawSampleV2 {
  const mechanism = sample.reportOnlyMechanismReadback.leftAtrium;
  const pressure = mechanism.pressureComponentsMmHg;
  return Object.freeze([
    sample.phase01,
    sample.volumesMl.leftAtriumMl,
    sample.pressuresMmHg.leftAtriumMmHg,
    sample.volumesMl.leftVentricleMl,
    sample.pressuresMmHg.leftVentricleMmHg,
    sample.flowsMlPerSec.mitralMlPerSec,
    sample.flowsMlPerSec.pulmonaryVenousMlPerSec,
    sample.pressuresMmHg.pulmonaryVeinMmHg,
    sample.pressuresMmHg.systemicArteryMmHg,
    pressure.equilibriumPassiveMmHg,
    pressure.effectiveLandActiveMmHg,
    pressure.slsOverstressMmHg,
    pressure.totalMmHg,
    sample.freeCalciumUm.leftAtrium,
    sample.freeCalciumUm.rightAtrium,
    sample.freeCalciumUm.leftFreeWall,
    sample.freeCalciumUm.septum,
    sample.freeCalciumUm.rightFreeWall,
    sample.activations01.leftAtrium,
    sample.activations01.rightAtrium,
    sample.activations01.leftFreeWall,
    sample.activations01.septum,
    sample.activations01.rightFreeWall,
    laPvPhaseCodeV2(sample.phase01, result),
  ] as const);
}

function laPvPhaseCodeV2(
  phase01: number,
  result: FivePatchPhysiologyEnvelopePersistedResultV2,
): 0 | 1 | 2 | 3 {
  const events = result.reportOnlyRawCycleDiagnostics.events;
  if (events == null) return 3;
  const mvo = events.mitralOpeningGradientUpCrossingProxyPhase01;
  const activation = events.leftAtrialPrescribedCalciumEventOnsetPhase01;
  const mvc = events.mitralClosureGradientDownCrossingProxyPhase01;
  if (cyclicIntervalContains(phase01, mvc, mvo)) return 0;
  if (cyclicIntervalContains(phase01, mvo, activation)) return 1;
  if (cyclicIntervalContains(phase01, activation, mvc)) return 2;
  return 3;
}

function cyclicIntervalContains(
  value: number,
  start: number,
  end: number,
): boolean {
  const span = normalizePhase(end - start);
  const offset = normalizePhase(value - start);
  return offset < span || Math.abs(offset - span) <= 1e-12;
}

function normalizePhase(value: number): number {
  return ((value % 1) + 1) % 1;
}

function readGateRowsV2(value: unknown): FivePatchPhysiologyScreeningGateRowV2[] {
  const rows = readPath(value, ["checks"]);
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => Object.freeze({
    id: readString(readPath(row, ["id"])) ?? `check-${index}`,
    passed: readBoolean(readPath(row, ["eligible"])) ?? false,
    observed: readPath(row, ["observed"]),
    expected: readPath(row, ["boundsOrLimit"]),
  }));
}

function readPath(value: unknown, path: readonly string[]): unknown {
  let cursor = value;
  for (const key of path) {
    if (
      cursor == null ||
      typeof cursor !== "object" ||
      Array.isArray(cursor) ||
      !(key in cursor)
    ) return null;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function safeEmbeddedJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function writeTextAtomically(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, text, "utf8");
    renameSync(temporary, path);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function parseRendererArgsV2(args: readonly string[]): {
  readonly inputDirectory: string;
  readonly outputPath: string;
} {
  let inputDirectory = DEFAULT_FIVE_PATCH_PHYSIOLOGY_SCREENING_DIRECTORY_V2;
  let outputPath = DEFAULT_FIVE_PATCH_PHYSIOLOGY_SCREENING_VISUAL_PATH_V2;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    const value = args[index + 1];
    if (argument === "--input-dir" && value != null) {
      inputDirectory = resolve(value);
      index += 1;
    } else if (argument === "--output" && value != null) {
      outputPath = resolve(value);
      index += 1;
    } else {
      throw new Error(
        "Usage: [--input-dir PATH] [--output PATH] (canonical 64-run V2 screening only)",
      );
    }
  }
  return Object.freeze({ inputDirectory, outputPath });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const options = parseRendererArgsV2(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(
    renderFivePatchPhysiologyEnvelopeScreeningFileV2(
      options.inputDirectory,
      options.outputPath,
    ),
    null,
    2,
  )}\n`);
}
