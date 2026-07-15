import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type {
  NoAvpdFivePatchLandBenchResultV1,
  NoAvpdFivePatchLandBenchSampleV1,
} from "@/engine/mechanics2/benches/NoAvpdFivePatchLandTriSegBenchV1";
import {
  NO_AVPD_FIVE_PATCH_LAND_TRISEG_MODEL_ID_V1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

export const DEFAULT_FIVE_PATCH_LAND_REPORT_PATH_V1 = resolve(
  "data/mechanics2/reports/no-avpd-five-patch-land-triseg-v1.json",
);
export const DEFAULT_FIVE_PATCH_LAND_VISUAL_PATH_V1 = resolve(
  "data/mechanics2/visuals/no-avpd-five-patch-land-triseg-v1.html",
);

type Series = {
  readonly label: string;
  readonly className: string;
  readonly points: readonly (readonly [number, number])[];
  readonly dashed?: boolean;
};

type PlotOptions = {
  readonly title: string;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly events?: readonly { readonly x: number; readonly label: string }[];
};

export function loadNoAvpdFivePatchLandTriSegReportV1(
  reportPath = DEFAULT_FIVE_PATCH_LAND_REPORT_PATH_V1,
): NoAvpdFivePatchLandBenchResultV1 {
  const parsed = JSON.parse(readFileSync(reportPath, "utf8")) as
    NoAvpdFivePatchLandBenchResultV1;
  if (parsed.model?.modelId !== NO_AVPD_FIVE_PATCH_LAND_TRISEG_MODEL_ID_V1) {
    throw new Error("report does not belong to the five-patch Land/TriSeg V1 model");
  }
  if (!Array.isArray(parsed.rawLastCycleSamples)) {
    throw new Error("report is missing rawLastCycleSamples");
  }
  return parsed;
}

export function renderNoAvpdFivePatchLandTriSegHtmlV1(
  report: NoAvpdFivePatchLandBenchResultV1,
): string {
  const samples = report.rawLastCycleSamples;
  if (samples.length < 4) {
    throw new Error(
      "at least four raw endpoints are required for visualization",
    );
  }
  const diagnostics = report.reportOnlyRawCycleDiagnostics;
  const completeRawCycle =
    report.beatsCompleted >= report.protocol.beatsRequested &&
    samples.length === report.protocol.stepsPerCycle;
  const phaseSegments = diagnostics.availability === "available"
    ? diagnostics.phaseSegments
    : null;
  const laPvSeries = phaseSegments == null
    ? [sampleSeries("Raw cycle", "series-1", samples, (sample) => [
        sample.volumesMl.leftAtriumMl,
        sample.pressuresMmHg.leftAtriumMmHg,
      ])]
    : [
        sampleSeries(
          "Reservoir gradient proxy",
          "series-1",
          samplesForSegment(samples, phaseSegments.reservoirGradientProxy),
          (sample) => [
            sample.volumesMl.leftAtriumMl,
            sample.pressuresMmHg.leftAtriumMmHg,
          ],
        ),
        sampleSeries(
          "Conduit gradient proxy",
          "series-2",
          samplesForSegment(samples, phaseSegments.conduitGradientProxy),
          (sample) => [
            sample.volumesMl.leftAtriumMl,
            sample.pressuresMmHg.leftAtriumMmHg,
          ],
        ),
        sampleSeries(
          "Prescribed Ca → closure proxy",
          "series-3",
          samplesForSegment(
            samples,
            phaseSegments.prescribedCalciumToClosureProxy,
          ),
          (sample) => [
            sample.volumesMl.leftAtriumMl,
            sample.pressuresMmHg.leftAtriumMmHg,
          ],
        ),
      ];
  const events = diagnostics.availability === "available"
    ? [
        {
          x: diagnostics.events.mitralOpeningGradientUpCrossingProxyPhase01,
          label: "ΔP↑ proxy",
        },
        {
          x: diagnostics.events.leftAtrialPrescribedCalciumEventOnsetPhase01,
          label: "LA prescribed Ca",
        },
        {
          x: diagnostics.events.mitralClosureGradientDownCrossingProxyPhase01,
          label: "ΔP↓ proxy",
        },
      ]
    : [];

  const panels = [
    plotSvg(laPvSeries, {
      title: "LA blood-volume PV",
      xLabel: "LA volume (mL)",
      yLabel: "LAP (mmHg)",
    }),
    plotSvg([
      sampleSeries("LV", "series-1", samples, (sample) => [
        sample.volumesMl.leftVentricleMl,
        sample.pressuresMmHg.leftVentricleMmHg,
      ]),
    ], {
      title: "LV PV",
      xLabel: "LV volume (mL)",
      yLabel: "LVP (mmHg)",
    }),
    plotSvg([
      sampleSeries("LAP", "series-1", samples, (sample) => [
        sample.phase01,
        sample.pressuresMmHg.leftAtriumMmHg,
      ]),
      sampleSeries("LVP", "series-2", samples, (sample) => [
        sample.phase01,
        sample.pressuresMmHg.leftVentricleMmHg,
      ]),
    ], {
      title: "Left-heart pressures",
      xLabel: "cardiac phase",
      yLabel: "pressure (mmHg)",
      events,
    }),
    plotSvg([
      sampleSeries("MV", "series-1", samples, (sample) => [
        sample.phase01,
        sample.flowsMlPerSec.mitralMlPerSec,
      ]),
      sampleSeries("PV→LA", "series-2", samples, (sample) => [
        sample.phase01,
        sample.flowsMlPerSec.pulmonaryVenousMlPerSec,
      ], true),
    ], {
      title: "Mitral and pulmonary-venous flow",
      xLabel: "cardiac phase",
      yLabel: "flow (mL/s)",
      events,
    }),
    plotSvg([
      sampleSeries("effective active", "series-3", samples, (sample) => [
        sample.phase01,
        sample.walls.leftAtrium.stressesKPa.effectiveTransmittedActive,
      ]),
      sampleSeries("equilibrium passive", "series-1", samples, (sample) => [
        sample.phase01,
        sample.walls.leftAtrium.stressesKPa.passiveEquilibrium,
      ]),
      sampleSeries("SLS q", "series-2", samples, (sample) => [
        sample.phase01,
        sample.walls.leftAtrium.stressesKPa.slsOverstress,
      ], true),
      sampleSeries("total", "series-4", samples, (sample) => [
        sample.phase01,
        sample.walls.leftAtrium.stressesKPa.totalTransmitted,
      ]),
    ], {
      title: "LA wall stress decomposition",
      xLabel: "cardiac phase",
      yLabel: "Kirchhoff stress (kPa)",
      events,
    }),
    plotSvg([
      sampleSeries("RA", "series-2", samples, (sample) => [
        sample.volumesMl.rightAtriumMl,
        sample.pressuresMmHg.rightAtriumMmHg,
      ]),
      sampleSeries("RV", "series-4", samples, (sample) => [
        sample.volumesMl.rightVentricleMl,
        sample.pressuresMmHg.rightVentricleMmHg,
      ]),
    ], {
      title: "Right-heart PV readback",
      xLabel: "blood volume (mL)",
      yLabel: "pressure (mmHg)",
    }),
  ];

  const d = diagnostics.availability === "available" ? diagnostics : null;
  const summary = [
    ["status", report.status],
    ["SLS arm", report.protocol.slsVariant],
    ["TriSeg force map", report.parameterSnapshot.triSegGeneralizedForceMapping],
    ["HR", `${format(report.protocol.heartRateBpm, 1)} bpm`],
    ["raw vertices", String(samples.length)],
    ["raw early/post-Ca local-max ratio", d?.mitralInflow.eToAPeakRatio == null
      ? d?.mitralInflow.rawPeakTopology ?? "not available"
      : format(d.mitralInflow.eToAPeakRatio, 3)],
    ["LV global volume excursion / Vmax", d == null
      ? "not available"
      : `${format(100 * d.ventricularVolumeExcursionFractions01.left, 1)}%`],
    ["Ca-window pressure-peak remaining emptying ratio", d?.atrialPumping
        .pressurePeakRemainingEmptyingRatioUnbounded == null
      ? "not available"
      : format(
          d.atrialPumping.pressurePeakRemainingEmptyingRatioUnbounded,
          3,
        )],
    ["full-state beat return-map max |delta|", report.exactOneBeatFullStateReturnMap == null
      ? "not available"
      : format(report.exactOneBeatFullStateReturnMap.maxAbsDimensionless, 6)],
    ["cycle closure", report.fullStateReturnMapGate.pass === true
      ? "caller threshold passed"
      : report.fullStateReturnMapGate.applied
        ? "caller threshold failed"
        : "report-only; caller threshold required"],
    ["evidence", completeRawCycle
      ? diagnostics.availability === "available"
        ? "complete raw cycle; morphology readbacks are report-only"
        : "complete raw cycle; event diagnostics unavailable"
      : "partial raw trace; not morphology evidence"],
  ];
  const warning = !completeRawCycle
    ? `<div class="warning"><strong>Incomplete cycle.</strong> This page ends at the numerical failure and must not be interpreted as a closed PV loop or physiology result. It is shown only to locate the failure trajectory.</div>`
    : report.status !== "pass"
      ? `<div class="warning"><strong>Structural gates failed.</strong> A complete raw cycle is visible, but it is not an accepted model result.</div>`
      : report.fullStateReturnMapGate.pass !== true
        ? `<div class="warning"><strong>Periodicity is not established.</strong> This complete cold-start cycle passed structural gates, but no caller-owned full-state return-map threshold has passed. Cross-boundary x/v readbacks are suppressed; do not treat this trace as a steady-state morphology result.</div>`
        : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>No-AVPD five-patch Land/TriSeg V1</title>
<style>
:root{color-scheme:dark;--bg:#07111f;--panel:#101b2d;--fg:#e7edf7;--muted:#9eacc2;--grid:#273650;--warn:#ffcc66;--s1:#54bdff;--s2:#ffb020;--s3:#ed70bd;--s4:#74dc9b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 Inter,system-ui,sans-serif;padding:24px}main{max-width:1500px;margin:auto}h1{font-size:25px;margin:0 0 6px}p{color:var(--muted);margin:0 0 18px}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:8px;margin-bottom:18px}.metric{background:var(--panel);border:1px solid var(--grid);border-radius:8px;padding:10px}.metric span{display:block;color:var(--muted);font-size:12px}.plots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.plot{background:var(--panel);border:1px solid var(--grid);border-radius:9px;padding:12px;min-width:0}.plot h2{font-size:15px;margin:0 0 6px}.plot svg{display:block;width:100%;height:auto}.axis,.grid{stroke:var(--grid);stroke-width:1}.grid{opacity:.65}.tick,.label,.event-label{fill:var(--muted);font-size:10px}.event{stroke:var(--muted);stroke-width:1;stroke-dasharray:3 3;opacity:.65}.series-1{stroke:var(--s1)}.series-2{stroke:var(--s2)}.series-3{stroke:var(--s3)}.series-4{stroke:var(--s4)}.series{fill:none;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}.dashed{stroke-dasharray:5 4}.legend{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:11px}.swatch{display:inline-block;width:15px;border-top:2px solid;margin-right:5px;vertical-align:middle}.swatch.series-1{border-color:var(--s1)}.swatch.series-2{border-color:var(--s2)}.swatch.series-3{border-color:var(--s3)}.swatch.series-4{border-color:var(--s4)}.warning{border:1px solid var(--warn);color:var(--warn);border-radius:8px;padding:10px;margin:0 0 16px}.notice{margin-top:16px;color:var(--muted);font-size:12px}@media(max-width:850px){body{padding:12px}.plots{grid-template-columns:1fr}}
</style></head><body><main>
<h1>No-AVPD five-patch Land/TriSeg V1</h1>
<p>Independent cold-start sidecar. Every path uses unsmoothed final-cycle endpoints; morphology does not change structural status.</p>
${warning}
<section class="summary">${summary.map(([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span>${escapeHtml(value)}</div>`).join("")}</section>
<section class="plots">${panels.join("")}</section>
<div class="notice">Model: ${escapeHtml(report.model.modelId)} · equations: ${escapeHtml(report.model.equationsVersionId)} · dt ${format(report.protocol.dtSec, 5)} s · ${report.protocol.beatsRequested} requested beats.</div>
</main></body></html>`;
}

export function renderNoAvpdFivePatchLandTriSegFileV1(
  reportPath = DEFAULT_FIVE_PATCH_LAND_REPORT_PATH_V1,
  destinationPath = DEFAULT_FIVE_PATCH_LAND_VISUAL_PATH_V1,
) {
  const report = loadNoAvpdFivePatchLandTriSegReportV1(reportPath);
  const html = renderNoAvpdFivePatchLandTriSegHtmlV1(report);
  mkdirSync(dirname(destinationPath), { recursive: true });
  const temporaryPath = `${destinationPath}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, html, "utf8");
    renameSync(temporaryPath, destinationPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
  return Object.freeze({
    reportPath,
    destinationPath,
    byteLength: Buffer.byteLength(html),
    rawVertexCount: report.rawLastCycleSamples.length,
  });
}

function plotSvg(series: readonly Series[], options: PlotOptions): string {
  const width = 680;
  const height = 390;
  const margin = { left: 65, right: 22, top: 20, bottom: 56 };
  const all = series.flatMap((entry) => entry.points);
  const xDomain = paddedDomain(all.map((point) => point[0]));
  const yDomain = paddedDomain(all.map((point) => point[1]));
  const x = (value: number) => margin.left +
    (value - xDomain[0]) / (xDomain[1] - xDomain[0]) *
    (width - margin.left - margin.right);
  const y = (value: number) => height - margin.bottom -
    (value - yDomain[0]) / (yDomain[1] - yDomain[0]) *
    (height - margin.top - margin.bottom);
  const xTicks = ticks(xDomain, 5);
  const yTicks = ticks(yDomain, 5);
  const paths = series.map((entry) =>
    `<path class="series ${entry.className}${entry.dashed ? " dashed" : ""}" d="${path(entry.points, x, y)}"/>`
  ).join("");
  const eventMarkup = (options.events ?? []).filter((event) =>
    event.x >= xDomain[0] && event.x <= xDomain[1]
  ).map((event, index) =>
    `<line class="event" x1="${x(event.x)}" y1="${margin.top}" x2="${x(event.x)}" y2="${height - margin.bottom}"/><text class="event-label" x="${x(event.x) + 3}" y="${margin.top + 11 + 12 * (index % 2)}">${escapeHtml(event.label)}</text>`
  ).join("");
  const grid = [
    ...xTicks.map((tick) => `<line class="grid" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${height - margin.bottom}"/>`),
    ...yTicks.map((tick) => `<line class="grid" x1="${margin.left}" y1="${y(tick)}" x2="${width - margin.right}" y2="${y(tick)}"/>`),
  ].join("");
  const axes = [
    ...xTicks.map((tick) => `<text class="tick" text-anchor="middle" x="${x(tick)}" y="${height - margin.bottom + 18}">${format(tick, 2)}</text>`),
    ...yTicks.map((tick) => `<text class="tick" text-anchor="end" x="${margin.left - 8}" y="${y(tick) + 3}">${format(tick, 2)}</text>`),
  ].join("");
  const legend = series.map((entry) =>
    `<span><i class="swatch ${entry.className}"></i>${escapeHtml(entry.label)}</span>`
  ).join("");
  return `<article class="plot"><h2>${escapeHtml(options.title)}</h2><div class="legend">${legend}</div><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(options.title)}"><title>${escapeHtml(options.title)}</title>${grid}${eventMarkup}${paths}${axes}<line class="axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"/><line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"/><text class="label" text-anchor="middle" x="${(margin.left + width - margin.right) / 2}" y="${height - 14}">${escapeHtml(options.xLabel)}</text><text class="label" text-anchor="middle" transform="translate(16 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)">${escapeHtml(options.yLabel)}</text></svg></article>`;
}

function sampleSeries(
  label: string,
  className: string,
  samples: readonly NoAvpdFivePatchLandBenchSampleV1[],
  point: (sample: NoAvpdFivePatchLandBenchSampleV1) => readonly [number, number],
  dashed = false,
): Series {
  const points = samples.map(point);
  if (points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
    throw new Error(`non-finite raw vertex in series: ${label}`);
  }
  return { label, className, points, dashed };
}

function samplesForSegment(
  samples: readonly NoAvpdFivePatchLandBenchSampleV1[],
  segment: {
    readonly startPhase01: number;
    readonly endPhase01: number;
    readonly wrapsCycleBoundary: boolean;
  },
): readonly NoAvpdFivePatchLandBenchSampleV1[] {
  const selected = samples.filter((sample) => segment.wrapsCycleBoundary
    ? sample.phase01 >= segment.startPhase01 || sample.phase01 <= segment.endPhase01
    : sample.phase01 >= segment.startPhase01 && sample.phase01 <= segment.endPhase01
  );
  if (!segment.wrapsCycleBoundary) return selected;
  return [...selected.filter((sample) => sample.phase01 >= segment.startPhase01),
    ...selected.filter((sample) => sample.phase01 <= segment.endPhase01)];
}

function path(
  points: readonly (readonly [number, number])[],
  x: (value: number) => number,
  y: (value: number) => number,
): string {
  return points.map((point, index) =>
    `${index === 0 ? "M" : "L"}${x(point[0]).toFixed(2)},${y(point[1]).toFixed(2)}`
  ).join(" ");
}

function paddedDomain(values: readonly number[]): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  const width = maximum - minimum;
  const padding = width > 1e-12 ? 0.06 * width : Math.max(1, Math.abs(minimum) * 0.1);
  return [minimum - padding, maximum + padding];
}

function ticks(domain: readonly [number, number], count: number): readonly number[] {
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
  let reportPath = DEFAULT_FIVE_PATCH_LAND_REPORT_PATH_V1;
  let destinationPath = DEFAULT_FIVE_PATCH_LAND_VISUAL_PATH_V1;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    const value = args[index + 1];
    if (argument === "--input" && value != null) {
      reportPath = resolve(value);
      index += 1;
    } else if (argument === "--output" && value != null) {
      destinationPath = resolve(value);
      index += 1;
    } else {
      throw new Error(`unknown or incomplete argument: ${argument}`);
    }
  }
  return { reportPath, destinationPath };
}

const invokedPath = process.argv[1];
if (
  invokedPath != null &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    const args = parseArgs(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(
      renderNoAvpdFivePatchLandTriSegFileV1(
        args.reportPath,
        args.destinationPath,
      ),
    )}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
