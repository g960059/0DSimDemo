import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallAtrialCalciumTimingComparisonV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

const canonicalPath = requiredArgument("--canonical");
const challengerPath = requiredArgument("--challenger");
const outputPath = path.resolve(requiredArgument("--output"));
const canonical = readResult(canonicalPath);
const challenger = readResult(challengerPath);
const canonicalSamples = terminalBeat(canonical);
const challengerSamples = terminalBeat(challenger);

assertPaired(canonical, challenger, canonicalSamples, challengerSamples);

const fragment = renderFragment(canonicalSamples, challengerSamples);
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${fragment}\n`);
process.stdout.write(`${JSON.stringify({
  outputPath,
  bytes: Buffer.byteLength(fragment),
  sampleCountPerSeries: canonicalSamples.length,
  smoothingApplied: false,
  resamplingApplied: false,
}, null, 2)}\n`);

function renderFragment(
  canonicalSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  challengerSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
): string {
  const panels = [
    chart({
      id: "la-pv",
      title: "LA blood-volume PV",
      xLabel: "LA volume (mL)",
      yLabel: "LAP (mmHg)",
      canonical: canonicalSamples.map((sample) => point(
        sample.nodeVolumeMl.LA,
        sample.chamberTransmuralPressureMmHg.LA,
      )),
      challenger: challengerSamples.map((sample) => point(
        sample.nodeVolumeMl.LA,
        sample.chamberTransmuralPressureMmHg.LA,
      )),
    }),
    chart({
      id: "lv-pv",
      title: "LV blood-volume PV",
      xLabel: "LV volume (mL)",
      yLabel: "LVP (mmHg)",
      canonical: canonicalSamples.map((sample) => point(
        sample.nodeVolumeMl.LV,
        sample.chamberTransmuralPressureMmHg.LV,
      )),
      challenger: challengerSamples.map((sample) => point(
        sample.nodeVolumeMl.LV,
        sample.chamberTransmuralPressureMmHg.LV,
      )),
    }),
    phaseChart({
      id: "lap",
      title: "LAP",
      yLabel: "pressure (mmHg)",
      canonicalSamples,
      challengerSamples,
      read: (sample) => sample.chamberTransmuralPressureMmHg.LA,
    }),
    phaseChart({
      id: "lvp",
      title: "LVP",
      yLabel: "pressure (mmHg)",
      canonicalSamples,
      challengerSamples,
      read: (sample) => sample.chamberTransmuralPressureMmHg.LV,
    }),
    phaseChart({
      id: "mv-flow",
      title: "Mitral flow",
      yLabel: "flow (mL/s)",
      canonicalSamples,
      challengerSamples,
      read: (sample) => sample.flowMlPerSec.MV,
    }),
    phaseChart({
      id: "pv-flow",
      title: "Aggregate PVein→LA flow",
      yLabel: "flow (mL/s)",
      canonicalSamples,
      challengerSamples,
      read: (sample) => sample.flowMlPerSec.PVein_LA,
    }),
  ].join("\n");
  return `<div id="atrial-calcium-timing-paired-v1">
  <style>
    #atrial-calcium-timing-paired-v1 { width: 100%; color: var(--foreground); }
    #atrial-calcium-timing-paired-v1 .act-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; }
    #atrial-calcium-timing-paired-v1 .act-key { display: inline-flex; align-items: center; gap: 0.35rem; }
    #atrial-calcium-timing-paired-v1 .act-swatch { width: 1.5rem; height: 0; border-top: 2px solid var(--viz-series-1); }
    #atrial-calcium-timing-paired-v1 .act-swatch.is-challenger { border-top-color: var(--viz-series-2); border-top-style: dashed; }
    #atrial-calcium-timing-paired-v1 .act-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    #atrial-calcium-timing-paired-v1 figure { margin: 0; min-width: 0; }
    #atrial-calcium-timing-paired-v1 figcaption { margin-bottom: 0.25rem; font-weight: 500; }
    #atrial-calcium-timing-paired-v1 svg { display: block; width: 100%; height: auto; color: var(--foreground); }
    #atrial-calcium-timing-paired-v1 .act-gridline { stroke: var(--border); stroke-width: 1; opacity: 0.65; }
    #atrial-calcium-timing-paired-v1 .act-axis { stroke: var(--muted-foreground); stroke-width: 1; }
    #atrial-calcium-timing-paired-v1 .act-label { fill: var(--muted-foreground); font-size: 10px; font-weight: 400; }
    #atrial-calcium-timing-paired-v1 .act-canonical { fill: none; stroke: var(--viz-series-1); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    #atrial-calcium-timing-paired-v1 .act-challenger { fill: none; stroke: var(--viz-series-2); stroke-width: 2; stroke-dasharray: 5 4; stroke-linecap: round; stroke-linejoin: round; }
    @media (max-width: 660px) { #atrial-calcium-timing-paired-v1 .act-grid { grid-template-columns: 1fr; } }
  </style>
  <div class="act-legend text-small" aria-label="Series legend">
    <span class="act-key"><span class="act-swatch" aria-hidden="true"></span>canonical Land-output timing</span>
    <span class="act-key"><span class="act-swatch is-challenger" aria-hidden="true"></span>human atrial Ca timing challenger</span>
    <span class="text-muted">raw accepted endpoints; no smoothing or resampling</span>
  </div>
  <div class="act-grid">
    ${panels}
  </div>
</div>`;
}

function phaseChart(input: Readonly<{
  id: string;
  title: string;
  yLabel: string;
  canonicalSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  challengerSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  read(sample: MainWireNormalAdultFiveWallDiagnosticSampleV2): number;
}>): string {
  return chart({
    id: input.id,
    title: input.title,
    xLabel: "cardiac phase",
    yLabel: input.yLabel,
    canonical: input.canonicalSamples.map((sample, index) => point(
      unwrappedPhase(sample.cyclePhase01, index, input.canonicalSamples.length),
      input.read(sample),
    )),
    challenger: input.challengerSamples.map((sample, index) => point(
      unwrappedPhase(sample.cyclePhase01, index, input.challengerSamples.length),
      input.read(sample),
    )),
  });
}

function chart(input: Readonly<{
  id: string;
  title: string;
  xLabel: string;
  yLabel: string;
  canonical: readonly Point[];
  challenger: readonly Point[];
}>): string {
  const width = 360;
  const height = 240;
  const margin = Object.freeze({ left: 54, right: 12, top: 8, bottom: 42 });
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const all = [...input.canonical, ...input.challenger];
  const xDomain = paddedDomain(all.map((entry) => entry.x));
  const yDomain = paddedDomain(all.map((entry) => entry.y));
  const x = (value: number) => margin.left
    + (value - xDomain[0]) / (xDomain[1] - xDomain[0]) * plotWidth;
  const y = (value: number) => margin.top + plotHeight
    - (value - yDomain[0]) / (yDomain[1] - yDomain[0]) * plotHeight;
  const xTicks = ticks(xDomain);
  const yTicks = ticks(yDomain);
  const grid = [
    ...xTicks.map((value) => `<line class="act-gridline" x1="${n(x(value))}" y1="${margin.top}" x2="${n(x(value))}" y2="${margin.top + plotHeight}"/><text class="act-label" x="${n(x(value))}" y="${height - 24}" text-anchor="middle">${format(value)}</text>`),
    ...yTicks.map((value) => `<line class="act-gridline" x1="${margin.left}" y1="${n(y(value))}" x2="${margin.left + plotWidth}" y2="${n(y(value))}"/><text class="act-label" x="${margin.left - 7}" y="${n(y(value) + 3)}" text-anchor="end">${format(value)}</text>`),
  ].join("");
  return `<figure>
      <figcaption>${escapeHtml(input.title)}</figcaption>
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${input.id}-title ${input.id}-desc">
        <title id="${input.id}-title">${escapeHtml(input.title)} paired comparison</title>
        <desc id="${input.id}-desc">Canonical solid line and human atrial calcium timing challenger dashed line, using consecutive raw accepted endpoints without smoothing or resampling.</desc>
        ${grid}
        <line class="act-axis" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}"/>
        <line class="act-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}"/>
        <polyline class="act-canonical" points="${polyline(input.canonical, x, y)}"/>
        <polyline class="act-challenger" points="${polyline(input.challenger, x, y)}"/>
        <text class="act-label" x="${margin.left + plotWidth / 2}" y="${height - 6}" text-anchor="middle">${escapeHtml(input.xLabel)}</text>
        <text class="act-label" transform="translate(12 ${margin.top + plotHeight / 2}) rotate(-90)" text-anchor="middle">${escapeHtml(input.yLabel)}</text>
      </svg>
    </figure>`;
}

type Point = Readonly<{ x: number; y: number }>;

function point(x: number, y: number): Point {
  return Object.freeze({ x, y });
}

function polyline(
  points: readonly Point[],
  x: (value: number) => number,
  y: (value: number) => number,
): string {
  return points.map((entry) => `${n(x(entry.x))},${n(y(entry.y))}`).join(" ");
}

function paddedDomain(values: readonly number[]): readonly [number, number] {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = maximum - minimum;
  const padding = span > 0 ? span * 0.06 : Math.max(1, Math.abs(maximum) * 0.1);
  return Object.freeze([minimum - padding, maximum + padding]);
}

function ticks(domain: readonly [number, number]): readonly number[] {
  return Object.freeze(Array.from({ length: 5 }, (_, index) =>
    domain[0] + (domain[1] - domain[0]) * index / 4));
}

function unwrappedPhase(
  phase01: number,
  index: number,
  sampleCount: number,
): number {
  return index === sampleCount - 1 && Math.abs(phase01) < 1e-8 ? 1 : phase01;
}

function terminalBeat(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[] {
  const beat = result.retainedCompleteBeats.at(-1);
  if (!beat || beat.samples.length !== result.stepsPerBeat) {
    throw new Error("periodic result is missing one terminal complete beat");
  }
  if (!result.periodicSteadyStateClaimed) {
    throw new Error("periodic result is not a qualified period-1 orbit");
  }
  return beat.samples;
}

function assertPaired(
  canonical: MainWireNormalAdultFiveWallPeriodicResultV1,
  challenger: MainWireNormalAdultFiveWallPeriodicResultV1,
  canonicalSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  challengerSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
): void {
  if (canonical.calciumDrivePriorVariant !== "land-atrial-twitch-output") {
    throw new Error("canonical result has the wrong calcium prior variant");
  }
  if (
    challenger.calciumDrivePriorVariant
      !== "human-atrial-calcium-biomarker"
  ) throw new Error("challenger result has the wrong calcium prior variant");
  if (
    canonical.dtSec !== challenger.dtSec
    || canonical.initialization !== challenger.initialization
    || canonical.laSlsMode !== challenger.laSlsMode
    || canonical.requestedMaximumBeatCount
      !== challenger.requestedMaximumBeatCount
    || canonicalSamples.length !== challengerSamples.length
  ) throw new Error("periodic results are not a matched visual pair");
  const paired = compareMainWireNormalAdultFiveWallAtrialCalciumTimingV1(
    summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(canonical),
    summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(challenger),
  );
  if (!paired.interpretable) {
    throw new Error(
      `visual pair is not qualified: ${paired.interpretabilityReasons.join("; ")}`,
    );
  }
}

function readResult(inputPath: string): MainWireNormalAdultFiveWallPeriodicResultV1 {
  return JSON.parse(readFileSync(inputPath, "utf8")) as
    MainWireNormalAdultFiveWallPeriodicResultV1;
}

function format(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 100) return value.toFixed(0);
  if (absolute >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function n(value: number): string {
  return value.toFixed(2);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) throw new Error(`${name} is required`);
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
