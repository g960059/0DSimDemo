import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type {
  MainWireNormalAdultFiveWallClosedLoopResultV1,
  MainWireNormalAdultFiveWallClosedLoopSampleV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

type Point = Readonly<{ x: number; y: number }>;
type Series = Readonly<{
  label: string;
  color: string;
  points: readonly Point[];
  dashed?: boolean;
  width?: number;
}>;
type Summary = Readonly<Record<string, unknown>>;

const inputPath = valueAfter("--input");
const summaryPath = valueAfter("--summary");
const outputPath = valueAfter("--output");
const svgOutputPath = optionalValueAfter("--svg-output")
  ?? outputPath.replace(/\.html?$/i, ".svg");
const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallClosedLoopResultV1;
const summary = JSON.parse(readFileSync(summaryPath, "utf8")) as Summary;
const current = completeBeat(result, result.completedBeatCount);
const previous = result.completedBeatCount > 1
  ? completeBeat(result, result.completedBeatCount - 1)
  : [];
if (current.length === 0) throw new Error("result has no complete beat to render");

const mvoPhase = numberAt(summary, ["events", "mvoPhase01"]);
const atrialOnsetPhase = numberAt(summary, ["events", "atrialCalciumOnsetPhase01"]);
const reservoir = current.filter((sample) => sample.cyclePhase01 <= mvoPhase);
const conduit = current.filter((sample) =>
  sample.cyclePhase01 >= mvoPhase && sample.cyclePhase01 <= atrialOnsetPhase);
const pumping = current.filter((sample) => sample.cyclePhase01 >= atrialOnsetPhase);
const crossings = arrayAt(summary, ["laPvTwoLobes", "crossings"])
  .map((value) => value as { volumeMl: number; pressureMmHg: number; angleDeg: number });

const width = 1500;
const panelWidth = 460;
const panelHeight = 315;
const gapX = 24;
const gapY = 58;
const left = 40;
const top = 265;
const panel = (column: number, row: number) => Object.freeze({
  x: left + column * (panelWidth + gapX),
  y: top + row * (panelHeight + gapY),
  width: panelWidth,
  height: panelHeight,
});
const panels = [
  renderPanel(panel(0, 0), "LA blood-volume PV", "LA volume (mL)", "LAP (mmHg)", [
    previousSeries("previous beat", previous, (s) => s.nodeVolumeMl.LA,
      (s) => s.chamberTransmuralPressureMmHg.LA),
    series("reservoir", "#38bdf8", reservoir, (s) => s.nodeVolumeMl.LA,
      (s) => s.chamberTransmuralPressureMmHg.LA),
    series("conduit", "#f59e0b", conduit, (s) => s.nodeVolumeMl.LA,
      (s) => s.chamberTransmuralPressureMmHg.LA),
    series("pumping", "#ec4899", pumping, (s) => s.nodeVolumeMl.LA,
      (s) => s.chamberTransmuralPressureMmHg.LA),
  ], crossings.map((crossing) => ({
    x: crossing.volumeMl,
    y: crossing.pressureMmHg,
    label: `${round(crossing.angleDeg, 1)}°`,
  }))),
  renderPanel(panel(1, 0), "LV blood-volume PV", "LV volume (mL)", "LVP (mmHg)", [
    previousSeries("previous beat", previous, (s) => s.nodeVolumeMl.LV,
      (s) => s.chamberTransmuralPressureMmHg.LV),
    series("current", "#a78bfa", current, (s) => s.nodeVolumeMl.LV,
      (s) => s.chamberTransmuralPressureMmHg.LV),
  ]),
  renderPanel(panel(2, 0), "Left-heart pressures", "cardiac phase", "pressure (mmHg)", [
    series("LVP", "#a78bfa", current, phase, (s) => s.chamberTransmuralPressureMmHg.LV),
    series("LAP", "#38bdf8", current, phase, (s) => s.chamberTransmuralPressureMmHg.LA),
    series("AoP", "#f97316", current, phase, (s) => s.nodeAbsolutePressureMmHg.Ao),
  ]),
  renderPanel(panel(0, 1), "Mitral and pulmonary-venous flow", "cardiac phase", "flow (mL/s)", [
    series("MVF", "#ec4899", current, phase, (s) => s.flowMlPerSec.MV),
    series("PVF", "#22c55e", current, phase, (s) => s.flowMlPerSec.PVein_LA),
  ]),
  renderPanel(panel(1, 1), "Prescribed free Ca", "cardiac phase", "Ca (µM)", [
    series("LA/RA", "#38bdf8", current, phase, (s) => s.freeCalciumUM.LA),
    series("ventricular", "#a78bfa", current, phase, (s) => s.freeCalciumUM.LVFW),
  ]),
  renderPanel(panel(2, 1), "Active wall stress", "cardiac phase", "active stress (kPa)", [
    series("LA", "#38bdf8", current, phase, (s) => s.wallStressPa.LA.active / 1000),
    series("LVFW", "#a78bfa", current, phase, (s) => s.wallStressPa.LVFW.active / 1000),
    series("SEP", "#f59e0b", current, phase, (s) => s.wallStressPa.SEP.active / 1000),
    series("RVFW", "#22c55e", current, phase, (s) => s.wallStressPa.RVFW.active / 1000),
  ]),
  renderPanel(panel(0, 2), "TriSeg coordinates", "cardiac phase", "scaled coordinate", [
    series("Vs (mL)", "#f59e0b", current, phase,
      (s) => s.internalCoordinates.septalMidwallCapVolumeMl),
    series("y (mm)", "#38bdf8", current, phase,
      (s) => s.internalCoordinates.junctionRadiusM * 1000),
  ]),
  renderPanel(panel(1, 2), "Solver residuals", "cardiac phase", "log10 residual", [
    series("mechanics", "#a78bfa", current, phase,
      (s) => safeLog10(s.diagnostics.mechanicsResidualNorm)),
    series("circulation", "#38bdf8", current, phase,
      (s) => safeLog10(s.diagnostics.circulationScaledResidualInfinityNorm)),
    series("TBV mL", "#f97316", current, phase,
      (s) => safeLog10(Math.abs(s.diagnostics.totalBloodVolumeErrorMl))),
  ]),
  renderPanel(panel(2, 2), "Beat-boundary closure", "beat", "maximum relative difference", [
    {
      label: "period-1",
      color: "#38bdf8",
      points: result.beatClosure.flatMap((entry) =>
        entry.period1MaximumRelativeStateDifference === null ? [] : [{
          x: entry.beatIndex,
          y: entry.period1MaximumRelativeStateDifference,
        }]),
    },
    {
      label: "period-2",
      color: "#f59e0b",
      points: result.beatClosure.flatMap((entry) =>
        entry.period2MaximumRelativeStateDifference === null ? [] : [{
          x: entry.beatIndex,
          y: entry.period2MaximumRelativeStateDifference,
        }]),
    },
  ]),
].join("\n");

const height = 1420;
const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="five-wall closed-loop diagnostic plots">
    <rect width="100%" height="100%" fill="#081426"/>
    <text x="40" y="42" fill="#e5edf8" font-size="24" font-weight="700">Raw last-beat physiology and numerical diagnostics</text>
    <text x="40" y="70" fill="#9fb0c8" font-size="14">solid=current beat · dashed=previous beat · no interpolation beyond straight accepted-step segments</text>
    ${panels}
  </svg>`;
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Main-wire normal adult five-wall review V1</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; background: #06101f; color: #e5edf8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1500px; margin: 0 auto; padding: 24px 24px 44px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .subtitle { color: #9fb0c8; margin-bottom: 16px; line-height: 1.45; }
    .cards { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
    .card { background: #0d1a2d; border: 1px solid #203451; border-radius: 8px; padding: 11px 12px; }
    .card span { display: block; color: #8fa4bf; font-size: 11px; margin-bottom: 5px; }
    .card strong { font-size: 18px; }
    .notice { background: #261d0b; border: 1px solid #6b4b14; color: #f9d98c; border-radius: 8px; padding: 11px 13px; margin: 14px 0; }
    svg { width: 100%; height: auto; display: block; background: #081426; border: 1px solid #203451; border-radius: 10px; }
    details { margin-top: 16px; background: #0d1a2d; border: 1px solid #203451; border-radius: 8px; padding: 10px 12px; }
    pre { white-space: pre-wrap; word-break: break-word; color: #b9c8da; font-size: 12px; }
    code { color: #dbeafe; }
    @media (max-width: 900px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
</head>
<body><main>
  <h1>Main-wire normal adult five-wall q-off review</h1>
  <div class="subtitle">HR 60 · raw accepted 2 ms steps · main-wire noncoronary circulation and valves · Land active + equilibrium passive + one parallel SLS · TriSeg membrane only · no AVPD/q, no LAA+body, no smoothing.</div>
  <div class="cards">
    ${card("completed beats", String(result.completedBeatCount))}
    ${card("period-1 closure", format(lastClosure(result, "period1MaximumRelativeStateDifference"), 4))}
    ${card("LV EF", percent(numberAt(summary, ["hemodynamics", "lvEjectionFraction"]), 1))}
    ${card("CO", `${format(numberAt(summary, ["hemodynamics", "cardiacOutputLPerMin"]), 2)} L/min`)}
    ${card("A-loop area", areaOrReason(summary, "aLobe"))}
    ${card("V-loop area", areaOrReason(summary, "vLobe"))}
  </div>
  <div class="notice">This is a research sidecar, not current browser runtime adoption. The last beat is still settling. LA two-lobe classification: <code>${escapeHtml(stringAt(summary, ["laPvTwoLobes", "reason"]))}</code>; crossings=${crossings.length}. Near-tangent extra crossings are shown explicitly and are not smoothed away.</div>
  ${svgMarkup}
  <details><summary>Numerical summary</summary><pre>${escapeHtml(JSON.stringify(summary, null, 2))}</pre></details>
  <details><summary>Run metadata</summary><pre>${escapeHtml(JSON.stringify({
    inputPath,
    summaryPath,
    mode: result.mode,
    completed: result.completed,
    failure: result.failure,
    claim: result.claim,
  }, null, 2))}</pre></details>
</main></body></html>`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html);
mkdirSync(path.dirname(svgOutputPath), { recursive: true });
writeFileSync(svgOutputPath, `${svgMarkup}\n`);
process.stdout.write(`${JSON.stringify({
  outputPath,
  svgOutputPath,
  bytes: Buffer.byteLength(html),
})}\n`);

function renderPanel(
  rect: Readonly<{ x: number; y: number; width: number; height: number }>,
  title: string,
  xLabel: string,
  yLabel: string,
  inputSeries: readonly Series[],
  markers: readonly Readonly<{ x: number; y: number; label: string }>[] = [],
): string {
  const validSeries = inputSeries.filter((item) => item.points.length > 0);
  const finite = validSeries.flatMap((item) => item.points)
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const markerPoints = markers.filter((point) =>
    Number.isFinite(point.x) && Number.isFinite(point.y));
  const xDomain = paddedDomain([...finite.map((point) => point.x), ...markerPoints.map((p) => p.x)]);
  const yDomain = paddedDomain([...finite.map((point) => point.y), ...markerPoints.map((p) => p.y)]);
  const plot = Object.freeze({
    x: rect.x + 62,
    y: rect.y + 44,
    width: rect.width - 82,
    height: rect.height - 88,
  });
  const sx = (value: number) => plot.x + (value - xDomain[0])
    / Math.max(xDomain[1] - xDomain[0], 1e-12) * plot.width;
  const sy = (value: number) => plot.y + plot.height - (value - yDomain[0])
    / Math.max(yDomain[1] - yDomain[0], 1e-12) * plot.height;
  const fractions = [0, 0.25, 0.5, 0.75, 1];
  const grid = fractions.map((fraction) => {
    const x = plot.x + fraction * plot.width;
    const y = plot.y + fraction * plot.height;
    const xv = xDomain[0] + fraction * (xDomain[1] - xDomain[0]);
    const yv = yDomain[1] - fraction * (yDomain[1] - yDomain[0]);
    return `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${plot.y + plot.height}" stroke="#1c2d45"/>
      <line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" stroke="#1c2d45"/>
      <text x="${x}" y="${plot.y + plot.height + 17}" fill="#8296af" font-size="10" text-anchor="middle">${escapeXml(tick(xv))}</text>
      <text x="${plot.x - 8}" y="${y + 3}" fill="#8296af" font-size="10" text-anchor="end">${escapeXml(tick(yv))}</text>`;
  }).join("\n");
  const lines = validSeries.map((item) => `<polyline points="${item.points
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map((point) => `${round(sx(point.x), 2)},${round(sy(point.y), 2)}`)
    .join(" ")}" fill="none" stroke="${item.color}" stroke-width="${item.width ?? 2.2}" stroke-linecap="round" stroke-linejoin="round"${item.dashed ? ' stroke-dasharray="7 6"' : ""}/>`).join("\n");
  const legend = validSeries.map((item, index) => `<line x1="${plot.x + index * 92}" y1="${rect.y + 30}" x2="${plot.x + 14 + index * 92}" y2="${rect.y + 30}" stroke="${item.color}" stroke-width="2.5"${item.dashed ? ' stroke-dasharray="5 4"' : ""}/><text x="${plot.x + 18 + index * 92}" y="${rect.y + 34}" fill="#aebed1" font-size="10">${escapeXml(item.label)}</text>`).join("");
  const markerSvg = markerPoints.map((marker) => `<circle cx="${sx(marker.x)}" cy="${sy(marker.y)}" r="3.5" fill="#f8fafc" stroke="#ef4444" stroke-width="1.5"/><text x="${sx(marker.x) + 6}" y="${sy(marker.y) - 6}" fill="#fca5a5" font-size="9">${escapeXml(marker.label)}</text>`).join("\n");
  return `<g>
    <text x="${rect.x}" y="${rect.y + 18}" fill="#e5edf8" font-size="16" font-weight="700">${escapeXml(title)}</text>
    ${legend}
    <rect x="${plot.x}" y="${plot.y}" width="${plot.width}" height="${plot.height}" fill="#0b1728" stroke="#29405f"/>
    ${grid}${lines}${markerSvg}
    <text x="${plot.x + plot.width / 2}" y="${rect.y + rect.height - 3}" fill="#93a7c0" font-size="11" text-anchor="middle">${escapeXml(xLabel)}</text>
    <text x="${rect.x + 12}" y="${plot.y + plot.height / 2}" fill="#93a7c0" font-size="11" text-anchor="middle" transform="rotate(-90 ${rect.x + 12} ${plot.y + plot.height / 2})">${escapeXml(yLabel)}</text>
  </g>`;
}

function completeBeat(
  result: MainWireNormalAdultFiveWallClosedLoopResultV1,
  beatIndex: number,
): readonly MainWireNormalAdultFiveWallClosedLoopSampleV1[] {
  if (beatIndex <= 0) return [];
  const end = beatIndex * result.stepsPerBeat;
  return result.samples.slice(end - result.stepsPerBeat, end);
}

function series(
  label: string,
  color: string,
  samples: readonly MainWireNormalAdultFiveWallClosedLoopSampleV1[],
  x: (sample: MainWireNormalAdultFiveWallClosedLoopSampleV1) => number,
  y: (sample: MainWireNormalAdultFiveWallClosedLoopSampleV1) => number,
): Series {
  return Object.freeze({
    label,
    color,
    points: Object.freeze(samples.map((sample) => ({ x: x(sample), y: y(sample) }))),
  });
}

function previousSeries(
  label: string,
  samples: readonly MainWireNormalAdultFiveWallClosedLoopSampleV1[],
  x: (sample: MainWireNormalAdultFiveWallClosedLoopSampleV1) => number,
  y: (sample: MainWireNormalAdultFiveWallClosedLoopSampleV1) => number,
): Series {
  return Object.freeze({ ...series(label, "#64748b", samples, x, y), dashed: true, width: 1.5 });
}

function phase(sample: MainWireNormalAdultFiveWallClosedLoopSampleV1): number {
  return sample.cyclePhase01;
}

function paddedDomain(values: readonly number[]): readonly [number, number] {
  if (values.length === 0) return [0, 1];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = maximum - minimum;
  const padding = span > 0 ? 0.07 * span : Math.max(0.5, 0.1 * Math.abs(maximum));
  return [minimum - padding, maximum + padding];
}

function card(label: string, value: string): string {
  return `<div class="card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function areaOrReason(summary: Summary, lobe: "aLobe" | "vLobe"): string {
  const value = unknownAt(summary, ["laPvTwoLobes", lobe, "areaMmHgMl"]);
  return typeof value === "number" && Number.isFinite(value)
    ? `${format(value, 2)} mmHg·mL`
    : stringAt(summary, ["laPvTwoLobes", "reason"]);
}

function lastClosure(
  result: MainWireNormalAdultFiveWallClosedLoopResultV1,
  key: "period1MaximumRelativeStateDifference" | "period2MaximumRelativeStateDifference",
): number {
  return result.beatClosure.at(-1)?.[key] ?? Number.NaN;
}

function safeLog10(value: number): number {
  return Math.log10(Math.max(Math.abs(value), 1e-16));
}

function tick(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 1000 || magnitude < 0.01)) {
    return value.toExponential(1);
  }
  return round(value, magnitude < 1 ? 2 : 1).toString();
}

function format(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function percent(value: number, digits: number): string {
  return Number.isFinite(value) ? `${(100 * value).toFixed(digits)}%` : "n/a";
}

function round(value: number, digits = 3): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function valueAfter(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function optionalValueAfter(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function unknownAt(root: unknown, keys: readonly string[]): unknown {
  let value = root;
  for (const key of keys) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function numberAt(root: unknown, keys: readonly string[]): number {
  const value = unknownAt(root, keys);
  return typeof value === "number" ? value : Number.NaN;
}

function stringAt(root: unknown, keys: readonly string[]): string {
  const value = unknownAt(root, keys);
  return typeof value === "string" ? value : "n/a";
}

function arrayAt(root: unknown, keys: readonly string[]): readonly unknown[] {
  const value = unknownAt(root, keys);
  return Array.isArray(value) ? value : [];
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]!);
}

function escapeHtml(value: string): string {
  return escapeXml(value);
}
