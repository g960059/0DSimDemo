import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1,
  type FivePatchEnvelopeArmIdV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";
import {
  FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1,
  buildFivePatchModelEnvelopeArmReadinessPlanV1,
  type FivePatchEnvelopeAcceptedStepSampleV1,
  type FivePatchEnvelopeProtocolRunResultV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  validateFivePatchModelEnvelopeAssemblyV1,
  validateFivePatchModelEnvelopePersistedProtocolResultV1,
} from "@/tools/mechanics2/runFivePatchModelEnvelopeV1";

export const DEFAULT_FIVE_PATCH_ARM_READINESS_DIRECTORY_V1 = resolve(
  "data/mechanics2/envelope/five-patch-model-envelope-v1/arm-readiness",
);
export const DEFAULT_FIVE_PATCH_ARM_READINESS_VISUAL_PATH_V1 = resolve(
  "data/mechanics2/visuals/five-patch-model-envelope-arm-readiness-v1.html",
);

const ARM_PRESENTATION_V1 = Object.freeze([
  Object.freeze({
    armId: "land-equilibrium-passive-sls-off" as const,
    label: "SLS off",
    className: "arm-off",
  }),
  Object.freeze({
    armId: "land-equilibrium-passive-sls-atrial-only" as const,
    label: "atrial SLS",
    className: "arm-atrial",
  }),
  Object.freeze({
    armId: "land-equilibrium-passive-sls-all-patch" as const,
    label: "all-patch SLS",
    className: "arm-all",
  }),
]);

type ArmTraceV1 = {
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly label: string;
  readonly className: string;
  readonly result: FivePatchEnvelopeProtocolRunResultV1;
};

type PanelOptionsV1 = {
  readonly title: string;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly point: (
    sample: FivePatchEnvelopeAcceptedStepSampleV1,
  ) => readonly [number, number];
};

export function armReadinessResultFileNameV1(
  armId: FivePatchEnvelopeArmIdV1,
): string {
  return `arm-readiness__${armId}__lhs-00__hr60-reference__beats-1__dt-0.005.json`;
}

export function loadFivePatchModelEnvelopeArmReadinessV1(
  directoryPath = DEFAULT_FIVE_PATCH_ARM_READINESS_DIRECTORY_V1,
): readonly FivePatchEnvelopeProtocolRunResultV1[] {
  const results = ARM_PRESENTATION_V1.map(({ armId }) => {
    const resultPath = join(directoryPath, armReadinessResultFileNameV1(armId));
    const parsed = validateFivePatchModelEnvelopePersistedProtocolResultV1(
      JSON.parse(readFileSync(resultPath, "utf8")),
    );
    validateArmReadinessResultV1(parsed, armId);
    return parsed;
  });
  validateFivePatchModelEnvelopeAssemblyV1(
    results,
    buildFivePatchModelEnvelopeArmReadinessPlanV1(),
  );
  return Object.freeze(results);
}

export function renderFivePatchModelEnvelopeArmReadinessHtmlV1(
  results: readonly FivePatchEnvelopeProtocolRunResultV1[],
): string {
  const traces = orderedArmTracesV1(results);
  const first = traces[0]!.result;
  const panels = [
    panelSvgV1(traces, {
      title: "LA blood-volume PV",
      xLabel: "LA blood volume (mL)",
      yLabel: "LAP (mmHg)",
      point: (sample) => [
        sample.volumesMl.leftAtriumMl,
        sample.pressuresMmHg.leftAtriumMmHg,
      ],
    }),
    panelSvgV1(traces, {
      title: "LV PV",
      xLabel: "LV volume (mL)",
      yLabel: "LVP (mmHg)",
      point: (sample) => [
        sample.volumesMl.leftVentricleMl,
        sample.pressuresMmHg.leftVentricleMmHg,
      ],
    }),
    panelSvgV1(traces, {
      title: "LAP vs phase",
      xLabel: "cardiac phase",
      yLabel: "LAP (mmHg)",
      point: (sample) => [
        sample.phase01,
        sample.pressuresMmHg.leftAtriumMmHg,
      ],
    }),
    panelSvgV1(traces, {
      title: "LVP vs phase",
      xLabel: "cardiac phase",
      yLabel: "LVP (mmHg)",
      point: (sample) => [
        sample.phase01,
        sample.pressuresMmHg.leftVentricleMmHg,
      ],
    }),
    panelSvgV1(traces, {
      title: "MV flow vs phase",
      xLabel: "cardiac phase",
      yLabel: "MV flow (mL/s)",
      point: (sample) => [
        sample.phase01,
        sample.flowsMlPerSec.mitralMlPerSec,
      ],
    }),
    panelSvgV1(traces, {
      title: "Pulmonary venous flow vs phase",
      xLabel: "cardiac phase",
      yLabel: "pulmonary venous flow (mL/s)",
      point: (sample) => [
        sample.phase01,
        sample.flowsMlPerSec.pulmonaryVenousMlPerSec,
      ],
    }),
  ];
  const legend = traces.map((trace) =>
    `<span><i class="swatch ${trace.className}"></i>${escapeHtml(trace.label)}</span>`
  ).join("");
  const counts = traces.map((trace) =>
    `${escapeHtml(trace.label)}: ${trace.result.finalCycleSamples.length}`
  ).join(" · ");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Five-patch envelope arm-readiness raw overlays V1</title>
<style>
:root{color-scheme:dark;--bg:#07111f;--panel:#101b2d;--fg:#e7edf7;--muted:#9eacc2;--grid:#273650;--notice:#ffcc66;--off:#54bdff;--atrial:#ffb020;--all:#ed70bd}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 Inter,system-ui,sans-serif;padding:24px}main{max-width:1500px;margin:auto}h1{font-size:25px;margin:0 0 6px}p{color:var(--muted);margin:0 0 14px}.notice{border:2px solid var(--notice);color:var(--notice);border-radius:8px;padding:12px;margin:0 0 16px}.legend{display:flex;gap:18px;flex-wrap:wrap;color:var(--muted);margin:0 0 16px}.swatch{display:inline-block;width:24px;border-top:3px solid;margin-right:6px;vertical-align:middle}.swatch.arm-off{border-color:var(--off)}.swatch.arm-atrial{border-color:var(--atrial);border-top-style:dashed}.swatch.arm-all{border-color:var(--all);border-top-style:dotted}.plots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.plot{background:var(--panel);border:1px solid var(--grid);border-radius:9px;padding:12px;min-width:0}.plot h2{font-size:15px;margin:0 0 6px}.plot svg{display:block;width:100%;height:auto}.axis,.grid{stroke:var(--grid);stroke-width:1}.grid{opacity:.65}.tick,.label{fill:var(--muted);font-size:10px}.raw-series{fill:none;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}.raw-series.arm-off{stroke:var(--off)}.raw-series.arm-atrial{stroke:var(--atrial);stroke-dasharray:8 5}.raw-series.arm-all{stroke:var(--all);stroke-dasharray:2 4}.footer{margin-top:16px;color:var(--muted);font-size:12px}@media(max-width:850px){body{padding:12px}.plots{grid-template-columns:1fr}}
</style></head><body><main>
<h1>Five-patch envelope arm-readiness raw overlays V1</h1>
<p>Predeclared LHS candidate 00 · full-fiber generalized-force TriSeg · HR 60 bpm · dt ${format(first.request.dtSec, 3)} s · ${first.request.beats} beat.</p>
<div class="notice"><strong>Independent cold-start comparison; periodicity is not established.</strong> Each line uses only the retained raw endpoints from one cold-start beat. No smoothing, phase segmentation, event annotation, or shape acceptance is applied. Do not interpret these traces as steady-state loops.</div>
<div class="legend" aria-label="Structural arm legend">${legend}</div>
<section class="plots">${panels.join("")}</section>
<div class="footer">Raw endpoint counts — ${counts}. Source status is numerical arm-readiness only.</div>
</main></body></html>`;
}

export function renderFivePatchModelEnvelopeArmReadinessFileV1(
  directoryPath = DEFAULT_FIVE_PATCH_ARM_READINESS_DIRECTORY_V1,
  destinationPath = DEFAULT_FIVE_PATCH_ARM_READINESS_VISUAL_PATH_V1,
) {
  const results = loadFivePatchModelEnvelopeArmReadinessV1(directoryPath);
  const html = renderFivePatchModelEnvelopeArmReadinessHtmlV1(results);
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, html, "utf8");
    renameSync(temporaryPath, destinationPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
  return Object.freeze({
    directoryPath,
    destinationPath,
    byteLength: Buffer.byteLength(html),
    rawEndpointCounts: Object.freeze(Object.fromEntries(results.map((result) => [
      result.request.armId,
      result.finalCycleSamples.length,
    ]))),
  });
}

function orderedArmTracesV1(
  results: readonly FivePatchEnvelopeProtocolRunResultV1[],
): readonly ArmTraceV1[] {
  const expectedIds = FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1.map(
    (arm) => arm.armId,
  );
  const byId = new Map<FivePatchEnvelopeArmIdV1, FivePatchEnvelopeProtocolRunResultV1>();
  for (const result of results) {
    if (byId.has(result.request.armId)) {
      throw new Error(`duplicate arm-readiness result: ${result.request.armId}`);
    }
    byId.set(result.request.armId, result);
  }
  if (
    byId.size !== expectedIds.length ||
    expectedIds.some((armId) => !byId.has(armId))
  ) {
    throw new Error("exactly one result is required for each predeclared structural arm");
  }
  return Object.freeze(ARM_PRESENTATION_V1.map((presentation) => {
    const result = byId.get(presentation.armId)!;
    validateArmReadinessResultV1(result, presentation.armId);
    return Object.freeze({ ...presentation, result });
  }));
}

function validateArmReadinessResultV1(
  result: FivePatchEnvelopeProtocolRunResultV1,
  expectedArmId: FivePatchEnvelopeArmIdV1,
): void {
  if (result.runnerId !== FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1) {
    throw new Error("result does not belong to the five-patch envelope V1 runner");
  }
  if (
    result.request.phase !== "arm-readiness" ||
    result.request.armId !== expectedArmId ||
    result.request.candidateIndex !== 0 ||
    result.request.scenarioId !== "hr60-reference" ||
    result.request.beats !== 1 ||
    result.request.dtSec !== 0.005 ||
    result.request.stepCount !== 200 ||
    result.request.retainEveryEndpointOfFinalCycle !== true
  ) {
    throw new Error(`unexpected arm-readiness coordinates: ${expectedArmId}`);
  }
  if (
    result.status !== "protocol-run-complete" ||
    result.initialization !== "independent-cold-start"
  ) {
    throw new Error(`arm-readiness result is not a complete cold start: ${expectedArmId}`);
  }
  if (result.periodicity.periodicityEstablished !== null) {
    throw new Error(`one-beat arm-readiness result unexpectedly classifies periodicity: ${expectedArmId}`);
  }
  const samples = result.finalCycleSamples;
  if (
    result.cycleEndpointRetention.retainedCycleKind !== "latest-complete-cycle" ||
    samples.length !== result.request.stepCount ||
    samples.length < 2
  ) {
    throw new Error(`arm-readiness result lacks one complete raw endpoint cycle: ${expectedArmId}`);
  }
  let previousPhase = -Infinity;
  for (const sample of samples) {
    if (
      !Number.isFinite(sample.phase01) ||
      sample.phase01 <= previousPhase ||
      sample.phase01 <= 0 ||
      sample.phase01 > 1
    ) {
      throw new Error(`raw endpoint phases are invalid: ${expectedArmId}`);
    }
    previousPhase = sample.phase01;
  }
}

function panelSvgV1(
  traces: readonly ArmTraceV1[],
  options: PanelOptionsV1,
): string {
  const width = 680;
  const height = 390;
  const margin = { left: 68, right: 22, top: 20, bottom: 56 };
  const series = traces.map((trace) => Object.freeze({
    ...trace,
    points: trace.result.finalCycleSamples.map(options.point),
  }));
  for (const entry of series) {
    if (entry.points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
      throw new Error(`non-finite raw endpoint in ${options.title}: ${entry.armId}`);
    }
  }
  const allPoints = series.flatMap((entry) => entry.points);
  const xDomain = paddedDomainV1(allPoints.map((point) => point[0]));
  const yDomain = paddedDomainV1(allPoints.map((point) => point[1]));
  const x = (value: number) => margin.left +
    (value - xDomain[0]) / (xDomain[1] - xDomain[0]) *
    (width - margin.left - margin.right);
  const y = (value: number) => height - margin.bottom -
    (value - yDomain[0]) / (yDomain[1] - yDomain[0]) *
    (height - margin.top - margin.bottom);
  const xTicks = ticksV1(xDomain, 5);
  const yTicks = ticksV1(yDomain, 5);
  const grid = [
    ...xTicks.map((tick) => `<line class="grid" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}"/>`),
    ...yTicks.map((tick) => `<line class="grid" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}"/>`),
  ].join("");
  const axes = [
    ...xTicks.map((tick) => `<text class="tick" text-anchor="middle" x="${x(tick)}" y="${height - margin.bottom + 18}">${format(tick, 2)}</text>`),
    ...yTicks.map((tick) => `<text class="tick" text-anchor="end" x="${margin.left - 8}" y="${y(tick) + 3}">${format(tick, 2)}</text>`),
  ].join("");
  const paths = series.map((entry) =>
    `<path class="raw-series ${entry.className}" d="${rawPathV1(entry.points, x, y)}"/>`
  ).join("");
  return `<article class="plot"><h2>${escapeHtml(options.title)}</h2><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(options.title)}, three raw arm-readiness traces"><title>${escapeHtml(options.title)}</title><desc>Raw endpoint overlay for SLS off, atrial SLS, and all-patch SLS.</desc>${grid}${paths}${axes}<line class="axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"/><line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"/><text class="label" text-anchor="middle" x="${(margin.left + width - margin.right) / 2}" y="${height - 14}">${escapeHtml(options.xLabel)}</text><text class="label" text-anchor="middle" transform="translate(16 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)">${escapeHtml(options.yLabel)}</text></svg></article>`;
}

function rawPathV1(
  points: readonly (readonly [number, number])[],
  x: (value: number) => number,
  y: (value: number) => number,
): string {
  return points.map((point, index) =>
    `${index === 0 ? "M" : "L"}${x(point[0]).toFixed(2)},${y(point[1]).toFixed(2)}`
  ).join(" ");
}

function paddedDomainV1(values: readonly number[]): readonly [number, number] {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const width = maximum - minimum;
  const padding = width > 1e-12
    ? 0.06 * width
    : Math.max(1, Math.abs(minimum) * 0.1);
  return [minimum - padding, maximum + padding];
}

function ticksV1(
  domain: readonly [number, number],
  count: number,
): readonly number[] {
  return Array.from({ length: count }, (_unused, index) =>
    domain[0] + index / (count - 1) * (domain[1] - domain[0])
  );
}

function format(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function parseArgs(args: readonly string[]) {
  let directoryPath = DEFAULT_FIVE_PATCH_ARM_READINESS_DIRECTORY_V1;
  let destinationPath = DEFAULT_FIVE_PATCH_ARM_READINESS_VISUAL_PATH_V1;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    const value = args[index + 1];
    if (argument === "--input-dir" && value != null) {
      directoryPath = resolve(value);
      index += 1;
    } else if (argument === "--output" && value != null) {
      destinationPath = resolve(value);
      index += 1;
    } else {
      throw new Error(`unknown or incomplete argument: ${argument}`);
    }
  }
  return { directoryPath, destinationPath };
}

const invokedPath = process.argv[1];
if (
  invokedPath != null &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    const args = parseArgs(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(
      renderFivePatchModelEnvelopeArmReadinessFileV1(
        args.directoryPath,
        args.destinationPath,
      ),
    )}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
