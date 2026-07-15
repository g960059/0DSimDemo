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
import { pathToFileURL } from "node:url";

import type {
  FivePatchEnvelopeArmIdV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";
import {
  buildFivePatchEnvelopeProtocolSpecV1,
  buildFivePatchModelEnvelopeScreeningPlanV1,
  type FivePatchEnvelopeAcceptedStepSampleV1,
  type FivePatchEnvelopeProtocolRunResultV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  validateFivePatchModelEnvelopeAssemblyV1,
  validateFivePatchModelEnvelopePersistedProtocolResultV1,
  type FivePatchModelEnvelopeAssemblyManifestV1,
  type FivePatchModelEnvelopePersistedProtocolResultV1,
} from "@/tools/mechanics2/runFivePatchModelEnvelopeV1";

export const FIVE_PATCH_MODEL_ENVELOPE_SCREENING_RENDERER_ID_V1 =
  "five-patch-model-envelope-screening-renderer-v1" as const;

export const DEFAULT_FIVE_PATCH_SCREENING_DIRECTORY_V1 = resolve(
  "data/mechanics2/envelope/five-patch-model-envelope-v1/screening",
);
export const DEFAULT_FIVE_PATCH_SCREENING_SUMMARY_PATH_V1 = resolve(
  "data/mechanics2/reports/five-patch-model-envelope-screening-v1.json",
);
export const DEFAULT_FIVE_PATCH_SCREENING_VISUAL_PATH_V1 = resolve(
  "data/mechanics2/visuals/five-patch-model-envelope-screening-v1.html",
);

const ARM_PRESENTATION_V1 = Object.freeze([
  Object.freeze({
    armId: "land-equilibrium-passive-sls-off" as const,
    label: "SLS off",
    color: "#54bdff",
  }),
  Object.freeze({
    armId: "land-equilibrium-passive-sls-atrial-only" as const,
    label: "atrial SLS",
    color: "#ffb020",
  }),
  Object.freeze({
    armId: "land-equilibrium-passive-sls-all-patch" as const,
    label: "all-patch SLS",
    color: "#ed70bd",
  }),
]);

type PeriodicityBucketV1 = "established" | "not-established" | "unavailable";

export type FivePatchScreeningRunSummaryV1 = {
  readonly canonicalOrdinal: number;
  readonly runId: string;
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly candidateIndex: number;
  readonly status: FivePatchEnvelopeProtocolRunResultV1["status"];
  readonly periodicityStatus:
    FivePatchEnvelopeProtocolRunResultV1["periodicity"]["status"];
  readonly periodicityBucket: PeriodicityBucketV1;
  readonly evaluationEligible: boolean;
  readonly retainedEndpointCount: number;
  readonly lobeMeasurementStatus: string | null;
  readonly aLobeAreaMmHgMl: number | null;
  readonly vLobeAreaMmHgMl: number | null;
  readonly mechanismTraceStatus: "available" | "unavailable";
  readonly mechanismSampleCount: number;
  readonly maximumAbsoluteLaPressureComponentClosureResidualMmHg:
    number | null;
  readonly matchedVolumeReservoirMinusConduitStatus:
    "deferred-no-interpolation";
  readonly failureReasons: readonly string[];
};

export type FivePatchScreeningArmCountsV1 = {
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly total: number;
  readonly protocolRunComplete: number;
  readonly numericalFailure: number;
  readonly periodicityEstablished: number;
  readonly periodicityNotEstablished: number;
  readonly periodicityUnavailable: number;
  readonly rawTrueLobesMeasurable: number;
  readonly morphologyDisplayEligible: number;
};

export type FivePatchScreeningSummaryV1 = {
  readonly rendererId:
    typeof FIVE_PATCH_MODEL_ENVELOPE_SCREENING_RENDERER_ID_V1;
  readonly sourcePhase: "screening";
  readonly canonicalRunCount: 192;
  readonly sourceScenario: "hr60-reference";
  readonly sourceTreatment:
    "raw-retained-endpoints-no-smoothing-no-resampling";
  readonly interpretation:
    "report-only-canonical-order-no-ranking-selection-or-physiology-gates";
  readonly assembly: FivePatchModelEnvelopeAssemblyManifestV1;
  readonly countsByArm: readonly FivePatchScreeningArmCountsV1[];
  readonly runs: readonly FivePatchScreeningRunSummaryV1[];
};

export type FivePatchScreeningLoadedAssemblyV1 = {
  readonly results:
    readonly FivePatchModelEnvelopePersistedProtocolResultV1[];
  readonly manifest: FivePatchModelEnvelopeAssemblyManifestV1;
};

type ScreeningVisualRunV1 = FivePatchScreeningRunSummaryV1 & {
  readonly armLabel: string;
  readonly armColor: string;
  readonly samples: readonly (readonly [
    phase01: number,
    leftAtriumVolumeMl: number,
    leftAtriumPressureMmHg: number,
    leftVentriclePressureMmHg: number,
    mitralFlowMlPerSec: number,
    pulmonaryVeinPressureMmHg: number,
    pulmonaryVenousFlowMlPerSec: number,
    laEquilibriumPassivePressureMmHg: number,
    laEffectiveLandActivePressureMmHg: number,
    laSlsOverstressPressureMmHg: number,
    laTotalPressureMmHg: number,
    laFiberLogStrain: number,
    laFiberLogStrainBackwardDifferenceRatePerSec: number,
    mitralPressureGradientMmHg: number,
    mitralOpenFraction01: number,
    leftVentricularPressureBackwardDifferenceRateMmHgPerSec: number | null,
    leftVentricularPressureDecayRatePositiveMmHgPerSec: number | null,
  ])[];
};

export function loadFivePatchModelEnvelopeScreeningV1(
  directoryPath = DEFAULT_FIVE_PATCH_SCREENING_DIRECTORY_V1,
): FivePatchScreeningLoadedAssemblyV1 {
  const jsonNames = readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
  const plan = buildFivePatchModelEnvelopeScreeningPlanV1();
  if (jsonNames.length !== plan.length) {
    throw new Error(
      `screening directory must contain exactly ${plan.length} JSON artifacts; found ${jsonNames.length}`,
    );
  }
  const unordered = jsonNames.map((name) =>
    validateFivePatchModelEnvelopePersistedProtocolResultV1(
      JSON.parse(readFileSync(join(directoryPath, name), "utf8")),
    )
  );
  const manifest = validateFivePatchModelEnvelopeAssemblyV1(unordered, plan);
  const byRunId = new Map(unordered.map((result) => [result.runId, result]));
  const results = Object.freeze(plan.map((request) => {
    const runId = buildFivePatchEnvelopeProtocolSpecV1(request).runId;
    const result = byRunId.get(runId);
    if (result == null) {
      throw new Error(`validated screening assembly lost runId: ${runId}`);
    }
    validateScreeningResultContentV1(result);
    return result;
  }));
  return Object.freeze({ results, manifest });
}

export function summarizeFivePatchModelEnvelopeScreeningV1(
  loaded: FivePatchScreeningLoadedAssemblyV1,
): FivePatchScreeningSummaryV1 {
  const plan = buildFivePatchModelEnvelopeScreeningPlanV1();
  if (loaded.results.length !== plan.length) {
    throw new Error("screening summary requires the exact 192-run assembly");
  }
  const runs = Object.freeze(loaded.results.map((result, canonicalOrdinal) =>
    summarizeRunV1(result, canonicalOrdinal)
  ));
  const countsByArm = Object.freeze(ARM_PRESENTATION_V1.map(({ armId }) => {
    const armRuns = runs.filter((run) => run.armId === armId);
    if (armRuns.length !== 64) {
      throw new Error(`screening arm does not contain 64 candidates: ${armId}`);
    }
    return Object.freeze({
      armId,
      total: armRuns.length,
      protocolRunComplete: armRuns.filter(
        (run) => run.status === "protocol-run-complete",
      ).length,
      numericalFailure: armRuns.filter(
        (run) => run.status === "numerical-failure",
      ).length,
      periodicityEstablished: armRuns.filter(
        (run) => run.periodicityBucket === "established",
      ).length,
      periodicityNotEstablished: armRuns.filter(
        (run) => run.periodicityBucket === "not-established",
      ).length,
      periodicityUnavailable: armRuns.filter(
        (run) => run.periodicityBucket === "unavailable",
      ).length,
      rawTrueLobesMeasurable: armRuns.filter(
        (run) =>
          run.aLobeAreaMmHgMl != null && run.vLobeAreaMmHgMl != null,
      ).length,
      morphologyDisplayEligible: armRuns.filter(
        (run) =>
          run.evaluationEligible &&
          run.aLobeAreaMmHgMl != null &&
          run.vLobeAreaMmHgMl != null,
      ).length,
    });
  }));
  return Object.freeze({
    rendererId: FIVE_PATCH_MODEL_ENVELOPE_SCREENING_RENDERER_ID_V1,
    sourcePhase: "screening",
    canonicalRunCount: 192,
    sourceScenario: "hr60-reference",
    sourceTreatment: "raw-retained-endpoints-no-smoothing-no-resampling",
    interpretation:
      "report-only-canonical-order-no-ranking-selection-or-physiology-gates",
    assembly: loaded.manifest,
    countsByArm,
    runs,
  });
}

export function renderFivePatchModelEnvelopeScreeningHtmlV1(
  summary: FivePatchScreeningSummaryV1,
  results: readonly FivePatchModelEnvelopePersistedProtocolResultV1[],
): string {
  if (summary.runs.length !== 192 || results.length !== 192) {
    throw new Error("screening HTML requires the exact 192-run assembly");
  }
  const visualRuns = results.map((result, canonicalOrdinal) => {
    const run = summary.runs[canonicalOrdinal];
    if (run == null || run.runId !== result.runId) {
      throw new Error("screening summary/results canonical order mismatch");
    }
    const arm = ARM_PRESENTATION_V1.find(
      (presentation) => presentation.armId === result.request.armId,
    );
    if (arm == null) throw new Error(`unknown structural arm: ${result.request.armId}`);
    return Object.freeze({
      ...run,
      armLabel: arm.label,
      armColor: arm.color,
      samples: Object.freeze(result.finalCycleSamples.map(compactRawSampleV1)),
    });
  });
  const embedded = safeEmbeddedJson(visualRuns);
  const countRows = summary.countsByArm.map((count) => {
    const arm = ARM_PRESENTATION_V1.find((entry) => entry.armId === count.armId)!;
    return `<tr><th><span class="swatch" style="--arm:${arm.color}"></span>${escapeHtml(arm.label)}</th><td>${count.protocolRunComplete}</td><td>${count.numericalFailure}</td><td>${count.periodicityEstablished}</td><td>${count.periodicityNotEstablished}</td><td>${count.periodicityUnavailable}</td><td>${count.rawTrueLobesMeasurable}</td><td>${count.morphologyDisplayEligible}</td></tr>`;
  }).join("");
  const tableRows = visualRuns.map((run) =>
    `<tr data-ordinal="${run.canonicalOrdinal}"><td>${run.canonicalOrdinal}</td><td><button type="button" class="run-button" data-ordinal="${run.canonicalOrdinal}">${escapeHtml(run.armLabel)}</button></td><td>${run.candidateIndex}</td><td>${escapeHtml(statusLabel(run.status))}</td><td>${escapeHtml(run.periodicityBucket)}</td><td>${run.evaluationEligible ? formatNullable(run.aLobeAreaMmHgMl) : "suppressed"}</td><td>${run.evaluationEligible ? formatNullable(run.vLobeAreaMmHgMl) : "suppressed"}</td></tr>`
  ).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Five-patch fixed screening raw explorer V1</title>
<style>
:root{color-scheme:dark;--bg:#07111f;--panel:#101b2d;--panel2:#0c1727;--fg:#e7edf7;--muted:#9eacc2;--grid:#273650;--notice:#ffcc66;--danger:#ff758f;--ok:#7bdc9c;--selected:#dce8ff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 Inter,system-ui,sans-serif;padding:22px}main{max-width:1580px;margin:auto}h1{font-size:25px;margin:0 0 5px}h2{font-size:16px;margin:0 0 8px}p{margin:0;color:var(--muted)}.notice{border:2px solid var(--notice);color:var(--notice);border-radius:8px;padding:11px;margin:14px 0}.counts{width:100%;border-collapse:collapse;margin:12px 0 18px}.counts th,.counts td,.runs th,.runs td{padding:7px 8px;border-bottom:1px solid var(--grid);text-align:right}.counts th:first-child,.runs th,.runs td:nth-child(2){text-align:left}.swatch{display:inline-block;width:20px;border-top:3px solid var(--arm);margin-right:7px;vertical-align:middle}.top-grid{display:grid;grid-template-columns:minmax(360px,1fr) minmax(360px,1fr);gap:14px}.panel{background:var(--panel);border:1px solid var(--grid);border-radius:9px;padding:12px;min-width:0}.panel svg{display:block;width:100%;height:auto}.axis,.gridline{stroke:var(--grid);stroke-width:1}.gridline{opacity:.62}.tick,.label{fill:var(--muted);font-size:10px}.scatter-point{cursor:pointer;stroke-width:1.8}.selected-point{stroke:var(--selected);stroke-width:3}.detail-head{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;margin:18px 0 10px}.detail-head h2{margin:0}.status-warning{color:var(--notice)}.status-failure{color:var(--danger)}.plots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.mechanism-plots{margin-top:14px}.raw-path{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.lap{stroke:#54bdff}.lvp{stroke:#ffb020}.ppv{stroke:#ed70bd}.passive{stroke:#54bdff}.active{stroke:#ffb020}.sls{stroke:#ed70bd}.total{stroke:#7bdc9c}.qmv{stroke:#54bdff}.qpv{stroke:#ed70bd}.rate{stroke:#ffb020}.decay{stroke:#7bdc9c}.single{stroke:#7bdc9c}.zero{stroke:var(--muted);stroke-width:1}.table-wrap{margin-top:18px;max-height:520px;overflow:auto;border:1px solid var(--grid);border-radius:8px}.runs{width:100%;border-collapse:collapse}.runs thead{position:sticky;top:0;background:var(--panel2);z-index:1}.runs th{color:var(--muted);font-weight:500}.runs tr[data-ordinal]{cursor:pointer}.runs tr[data-ordinal]:hover,.runs tr.selected-row{background:#172842}.run-button{font:inherit;color:var(--fg);background:none;border:0;padding:0;text-decoration:underline;cursor:pointer}.empty{color:var(--muted);padding:56px 10px;text-align:center}.legend{display:flex;gap:16px;flex-wrap:wrap;color:var(--muted);margin:7px 0 0}.legend span{white-space:nowrap}.legend-mark{display:inline-block;width:13px;height:13px;border:2px solid currentColor;border-radius:50%;vertical-align:-2px;margin-right:5px}.legend-mark.filled{background:currentColor}.legend-mark.cross{border:0;border-radius:0;font-size:17px;line-height:11px}.footer{margin-top:14px;color:var(--muted);font-size:12px}@media(max-width:1000px){.plots{grid-template-columns:1fr}.top-grid{grid-template-columns:1fr}}@media(max-width:600px){body{padding:10px}.counts{font-size:12px}.counts th,.counts td{padding:5px 3px}}
</style></head><body><main>
<h1>Five-patch fixed screening raw explorer V1</h1>
<p>Exact canonical screening assembly · 64 maximin-LHS indices × 3 structural arms · HR 60 bpm · assembly <code>${summary.assembly.assemblyNormalizedSha256.slice(0, 16)}</code>.</p>
<div class="notice"><strong>Report-only, not a model-selection result.</strong> Canonical order is preserved. No ranking, winner selection, physiology gate, smoothing, resampling, or reference-shape fitting is applied. A/V morphology is plotted only when the settle-and-assess return-map protocol marks the run evaluation-eligible. Unsteady and failed runs remain selectable for raw numerical trace inspection.</div>
<div class="notice"><strong>Mechanism attribution boundary.</strong> LA pressure components use the same one-fiber work-conjugate map as the cavity equation; LV relaxation is only an accepted-endpoint backward-pressure-difference proxy, not a fitted &tau;. Matched-volume reservoir-minus-conduit subtraction is deliberately deferred: raw endpoints do not generally provide exact equal-volume pairs, and this report does not interpolate or nearest-neighbor match them.</div>
<table class="counts" aria-label="Screening counts by structural arm"><thead><tr><th>structural arm</th><th>complete</th><th>failure</th><th>periodic</th><th>not periodic</th><th>periodicity unavailable</th><th>true lobes measurable</th><th>morphology display eligible</th></tr></thead><tbody>${countRows}</tbody></table>
<section class="top-grid"><div class="panel"><h2>Evaluation-eligible raw true A-lobe area vs V-lobe area</h2><svg id="scatter" viewBox="0 0 660 390" role="img" aria-label="Scatter plot of raw true A and V lobe areas only for evaluation-eligible screening runs"></svg><div class="legend">Color identifies the structural arm. Ineligible raw geometric areas are retained in JSON but suppressed here.</div></div><div class="panel"><h2>Selected canonical coordinate</h2><div id="selection-summary"></div></div></section>
<div class="detail-head"><h2>Selected raw retained endpoints</h2><span id="selected-warning"></span></div>
<section class="plots"><div class="panel"><h2>LA blood-volume PV</h2><svg id="la-pv" viewBox="0 0 520 330" role="img" aria-label="Selected raw left atrial blood-volume pressure-volume loop"></svg></div><div class="panel"><h2>Mitral flow vs phase</h2><svg id="mv-flow" viewBox="0 0 520 330" role="img" aria-label="Selected raw mitral flow waveform"></svg></div><div class="panel"><h2>PV, LA, and LV pressures</h2><svg id="pressures" viewBox="0 0 520 330" role="img" aria-label="Selected raw pulmonary vein, left atrial, and left ventricular pressure waveforms"></svg><div class="legend"><span><i class="swatch" style="--arm:#54bdff"></i>LAP</span><span><i class="swatch" style="--arm:#ffb020"></i>LVP</span><span><i class="swatch" style="--arm:#ed70bd"></i>PPV</span></div></div></section>
<section class="plots mechanism-plots"><div class="panel"><h2>LA work-conjugate pressure components</h2><svg id="la-pressure-components" viewBox="0 0 520 330" role="img" aria-label="Selected left atrial equilibrium passive, effective Land active, SLS overstress, and total pressure components"></svg><div class="legend"><span><i class="swatch" style="--arm:#54bdff"></i>equilibrium passive</span><span><i class="swatch" style="--arm:#ffb020"></i>effective Land active</span><span><i class="swatch" style="--arm:#ed70bd"></i>SLS overstress</span><span><i class="swatch" style="--arm:#7bdc9c"></i>total</span></div></div><div class="panel"><h2>Pulmonary venous and mitral flows</h2><svg id="pv-mv-flow" viewBox="0 0 520 330" role="img" aria-label="Selected raw pulmonary venous and mitral flows"></svg><div class="legend"><span><i class="swatch" style="--arm:#ed70bd"></i>QPV</span><span><i class="swatch" style="--arm:#54bdff"></i>QMV</span></div></div><div class="panel"><h2>LA fiber log strain</h2><svg id="la-strain" viewBox="0 0 520 330" role="img" aria-label="Selected left atrial fiber natural log strain"></svg></div><div class="panel"><h2>LA fiber strain-rate proxy</h2><svg id="la-strain-rate" viewBox="0 0 520 330" role="img" aria-label="Selected left atrial backward-difference fiber log strain rate proxy"></svg></div><div class="panel"><h2>Mitral pressure gradient</h2><svg id="mv-gradient" viewBox="0 0 520 330" role="img" aria-label="Selected raw mitral pressure gradient"></svg></div><div class="panel"><h2>Mitral open fraction</h2><svg id="mv-open" viewBox="0 0 520 330" role="img" aria-label="Selected mitral open fraction"></svg></div><div class="panel"><h2>LV pressure-rate relaxation proxy</h2><svg id="lv-pressure-rate" viewBox="0 0 520 330" role="img" aria-label="Selected left ventricular pressure backward difference and positive decay rate"></svg><div class="legend"><span><i class="swatch" style="--arm:#ffb020"></i>dP/dt</span><span><i class="swatch" style="--arm:#7bdc9c"></i>max(0,-dP/dt)</span></div></div></section>
<div class="table-wrap"><table class="runs" aria-label="All screening coordinates in canonical order"><thead><tr><th>order</th><th>arm</th><th>LHS index</th><th>status</th><th>periodicity</th><th>A area (mmHg·mL)</th><th>V area (mmHg·mL)</th></tr></thead><tbody>${tableRows}</tbody></table></div>
<div class="footer">Every displayed trace connects retained raw endpoints with straight line segments. Failed runs may contain a partial current cycle or no retained endpoints. Missing or evaluation-ineligible true-lobe points are not imputed onto the scatter.</div>
<script>${screeningClientScriptV1(embedded)}</script></main></body></html>`;
}

export function renderFivePatchModelEnvelopeScreeningFilesV1(
  directoryPath = DEFAULT_FIVE_PATCH_SCREENING_DIRECTORY_V1,
  summaryPath = DEFAULT_FIVE_PATCH_SCREENING_SUMMARY_PATH_V1,
  htmlPath = DEFAULT_FIVE_PATCH_SCREENING_VISUAL_PATH_V1,
) {
  const loaded = loadFivePatchModelEnvelopeScreeningV1(directoryPath);
  const summary = summarizeFivePatchModelEnvelopeScreeningV1(loaded);
  const html = renderFivePatchModelEnvelopeScreeningHtmlV1(
    summary,
    loaded.results,
  );
  writeTextAtomically(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  writeTextAtomically(htmlPath, html);
  return Object.freeze({
    directoryPath,
    summaryPath,
    htmlPath,
    artifactCount: loaded.results.length,
    summaryByteLength: Buffer.byteLength(JSON.stringify(summary)),
    htmlByteLength: Buffer.byteLength(html),
    assemblyNormalizedSha256: loaded.manifest.assemblyNormalizedSha256,
  });
}

function summarizeRunV1(
  result: FivePatchModelEnvelopePersistedProtocolResultV1,
  canonicalOrdinal: number,
): FivePatchScreeningRunSummaryV1 {
  validateScreeningResultContentV1(result);
  const lobes = result.reportOnlyRawCycleDiagnostics?.leftAtrialPvLobes;
  const aArea = finiteNullable(lobes?.aLobe?.absoluteAreaMmHgMl);
  const vArea = finiteNullable(lobes?.vLobe?.absoluteAreaMmHgMl);
  const periodicityBucket = periodicityBucketV1(result);
  const mechanism = result.reportOnlyVLoopMechanismAttribution;
  const closureResiduals = result.finalCycleSamples.map((sample) =>
    Math.abs(
      sample.reportOnlyMechanismReadback.leftAtrium.pressureComponentsMmHg
        .componentSumMinusTotalMmHg,
    )
  );
  return Object.freeze({
    canonicalOrdinal,
    runId: result.runId,
    armId: result.request.armId,
    candidateIndex: result.request.candidateIndex,
    status: result.status,
    periodicityStatus: result.periodicity.status,
    periodicityBucket,
    evaluationEligible:
      settleAndAssessEvaluationEligibleV1(result) &&
      lobes?.steadyStateInterpretationEligible === true,
    retainedEndpointCount: result.finalCycleSamples.length,
    lobeMeasurementStatus: lobes?.measurementStatus ?? null,
    aLobeAreaMmHgMl: aArea,
    vLobeAreaMmHgMl: vArea,
    mechanismTraceStatus: mechanism.retainedRawTraceStatus,
    mechanismSampleCount: mechanism.retainedRawSampleCount,
    maximumAbsoluteLaPressureComponentClosureResidualMmHg:
      closureResiduals.length > 0 ? Math.max(...closureResiduals) : null,
    matchedVolumeReservoirMinusConduitStatus:
      mechanism.matchedVolumeReservoirMinusConduit.status,
    failureReasons: Object.freeze([...result.failureReasons]),
  });
}

function validateScreeningResultContentV1(
  result: FivePatchModelEnvelopePersistedProtocolResultV1,
): void {
  if (
    result.request.phase !== "screening" ||
    result.request.scenarioId !== "hr60-reference" ||
    result.request.retainEveryEndpointOfFinalCycle !== true
  ) {
    throw new Error(`unexpected screening coordinate: ${result.runId}`);
  }
  if (
    result.status === "protocol-run-complete" &&
    result.stepsAccepted !== result.request.stepCount
  ) {
    throw new Error(`complete screening run has incomplete step count: ${result.runId}`);
  }
  if (
    result.status === "numerical-failure" &&
    result.stepsAccepted >= result.request.stepCount
  ) {
    throw new Error(`failed screening run has complete step count: ${result.runId}`);
  }
  if (
    result.cycleEndpointRetention.retainedEndpointCount !==
      result.finalCycleSamples.length
  ) {
    throw new Error(`screening retained-endpoint count mismatch: ${result.runId}`);
  }
  const maximum = result.cycleEndpointRetention.exactEndpointsPerCycle;
  const expected = result.request.stepCount / result.request.beats;
  if (!Number.isInteger(expected) || maximum !== expected) {
    throw new Error(`screening cycle capacity is not canonical: ${result.runId}`);
  }
  if (
    result.status === "protocol-run-complete" &&
    result.finalCycleSamples.length !== expected
  ) {
    throw new Error(`complete screening run does not retain one raw cycle: ${result.runId}`);
  }
  if (maximum != null && result.finalCycleSamples.length > maximum) {
    throw new Error(`screening retained cycle exceeds ring capacity: ${result.runId}`);
  }
  result.finalCycleSamples.forEach((sample, index) =>
    validateRawSampleV1(sample, result.runId, index)
  );
}

function validateRawSampleV1(
  sample: FivePatchEnvelopeAcceptedStepSampleV1,
  runId: string,
  index: number,
): void {
  const required = [
    sample.phase01,
    sample.volumesMl.leftAtriumMl,
    sample.pressuresMmHg.leftAtriumMmHg,
    sample.pressuresMmHg.leftVentricleMmHg,
    sample.flowsMlPerSec.mitralMlPerSec,
    sample.pressuresMmHg.pulmonaryVeinMmHg,
    sample.flowsMlPerSec.pulmonaryVenousMlPerSec,
    sample.reportOnlyMechanismReadback.leftAtrium.pressureComponentsMmHg
      .equilibriumPassiveMmHg,
    sample.reportOnlyMechanismReadback.leftAtrium.pressureComponentsMmHg
      .effectiveLandActiveMmHg,
    sample.reportOnlyMechanismReadback.leftAtrium.pressureComponentsMmHg
      .slsOverstressMmHg,
    sample.reportOnlyMechanismReadback.leftAtrium.pressureComponentsMmHg
      .totalMmHg,
    sample.reportOnlyMechanismReadback.leftAtrium.fiberLogStrain,
    sample.reportOnlyMechanismReadback.leftAtrium
      .fiberLogStrainBackwardDifferenceRatePerSec,
    sample.reportOnlyMechanismReadback.mitralValve.pressureGradientMmHg,
    sample.reportOnlyMechanismReadback.mitralValve.openFraction01,
  ];
  const nullableRates = [
    sample.reportOnlyMechanismReadback
      .leftVentricularPressureBackwardDifferenceRateMmHgPerSec,
    sample.reportOnlyMechanismReadback
      .leftVentricularPressureDecayRatePositiveMmHgPerSec,
  ];
  if (
    required.some((value) => !Number.isFinite(value)) ||
    nullableRates.some((value) => value != null && !Number.isFinite(value))
  ) {
    throw new Error(`non-finite raw screening sample ${runId}[${index}]`);
  }
}

function compactRawSampleV1(
  sample: FivePatchEnvelopeAcceptedStepSampleV1,
): ScreeningVisualRunV1["samples"][number] {
  const mechanism = sample.reportOnlyMechanismReadback;
  const pressure = mechanism.leftAtrium.pressureComponentsMmHg;
  return Object.freeze([
    sample.phase01,
    sample.volumesMl.leftAtriumMl,
    sample.pressuresMmHg.leftAtriumMmHg,
    sample.pressuresMmHg.leftVentricleMmHg,
    sample.flowsMlPerSec.mitralMlPerSec,
    sample.pressuresMmHg.pulmonaryVeinMmHg,
    sample.flowsMlPerSec.pulmonaryVenousMlPerSec,
    pressure.equilibriumPassiveMmHg,
    pressure.effectiveLandActiveMmHg,
    pressure.slsOverstressMmHg,
    pressure.totalMmHg,
    mechanism.leftAtrium.fiberLogStrain,
    mechanism.leftAtrium.fiberLogStrainBackwardDifferenceRatePerSec,
    mechanism.mitralValve.pressureGradientMmHg,
    mechanism.mitralValve.openFraction01,
    mechanism.leftVentricularPressureBackwardDifferenceRateMmHgPerSec,
    mechanism.leftVentricularPressureDecayRatePositiveMmHgPerSec,
  ]);
}

function periodicityBucketV1(
  result: FivePatchModelEnvelopePersistedProtocolResultV1,
): PeriodicityBucketV1 {
  return result.periodicity.periodicityEstablished === true
    ? "established"
    : result.periodicity.periodicityEstablished === false
      ? "not-established"
      : "unavailable";
}

function settleAndAssessEvaluationEligibleV1(
  result: FivePatchModelEnvelopePersistedProtocolResultV1,
): boolean {
  const settleAndAssess = (result as typeof result & {
    readonly settleAndAssess?: { readonly evaluationEligible?: boolean };
  }).settleAndAssess;
  if (typeof settleAndAssess?.evaluationEligible === "boolean") {
    return settleAndAssess.evaluationEligible;
  }
  const assessment = result.periodicity as typeof result.periodicity & {
    readonly evaluationEligible?: boolean;
  };
  return typeof assessment.evaluationEligible === "boolean"
    ? assessment.evaluationEligible
    : result.periodicity.periodicityEstablished === true;
}

function finiteNullable(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function statusLabel(status: FivePatchEnvelopeProtocolRunResultV1["status"]): string {
  return status === "protocol-run-complete" ? "complete" : "failure";
}

function formatNullable(value: number | null): string {
  return value == null ? "—" : escapeHtml(value.toPrecision(6));
}

function safeEmbeddedJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function screeningClientScriptV1(embeddedRuns: string): string {
  const clientSource = readFileSync(
    new URL("./renderFivePatchModelEnvelopeScreeningClientV1.js", import.meta.url),
    "utf8",
  );
  return `const runs=${embeddedRuns};\n${clientSource}`;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function writeTextAtomically(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, text, "utf8");
    renameSync(temporaryPath, path);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function parseCliV1(args: readonly string[]) {
  let inputDirectory = DEFAULT_FIVE_PATCH_SCREENING_DIRECTORY_V1;
  let summaryPath = DEFAULT_FIVE_PATCH_SCREENING_SUMMARY_PATH_V1;
  let htmlPath = DEFAULT_FIVE_PATCH_SCREENING_VISUAL_PATH_V1;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    const value = args[index + 1];
    if (argument === "--input-dir") inputDirectory = requiredPath(value, argument);
    else if (argument === "--summary") summaryPath = requiredPath(value, argument);
    else if (argument === "--html") htmlPath = requiredPath(value, argument);
    else if (argument === "--help" || argument === "-h") throw new Error(usageTextV1());
    else throw new Error(`unknown argument: ${argument}\n${usageTextV1()}`);
    index += 1;
  }
  return Object.freeze({ inputDirectory, summaryPath, htmlPath });
}

function requiredPath(value: string | undefined, option: string): string {
  if (value == null || value.trim() === "") {
    throw new Error(`${option} requires a non-empty path`);
  }
  return resolve(value);
}

function usageTextV1(): string {
  return [
    "Usage: vite-node --script tools/mechanics2/renderFivePatchModelEnvelopeScreeningV1.ts [options]",
    "  --input-dir <path>  flat directory containing the exact 192 screening artifacts",
    "  --summary <path>    compact report-only JSON destination",
    "  --html <path>       standalone interactive HTML destination",
  ].join("\n");
}

const invokedPath = process.argv[1];
if (
  invokedPath != null &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    const options = parseCliV1(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(
      renderFivePatchModelEnvelopeScreeningFilesV1(
        options.inputDirectory,
        options.summaryPath,
        options.htmlPath,
      ),
    )}\n`);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
