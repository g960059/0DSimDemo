import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type {
  NoAvpdFivePatchStructuralFactorialResultV2,
  NoAvpdFivePatchStructuralSampleV2,
} from "@/engine/mechanics2/benches/NoAvpdFivePatchStructuralFactorialV2";
import {
  NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_ID_V2,
} from "@/engine/mechanics2/benches/NoAvpdFivePatchStructuralFactorialV2";

export const DEFAULT_NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_INPUT_V2 =
  resolve(
    "data/mechanics2/reports/no-avpd-five-patch-structural-factorial-v2.json",
  );
export const DEFAULT_NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_VISUAL_V2 =
  resolve(
    "data/mechanics2/visuals/no-avpd-five-patch-structural-factorial-v2.html",
  );

type Series = {
  readonly label: string;
  readonly className: string;
  readonly points: readonly (readonly [number, number])[];
};

export function renderNoAvpdFivePatchStructuralFactorialHtmlV2(
  report: NoAvpdFivePatchStructuralFactorialResultV2,
): string {
  if (report.factorialId !== NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_ID_V2) {
    throw new Error("input is not a structural-factorial V2 report");
  }
  const armSeries = (
    point: (sample: NoAvpdFivePatchStructuralSampleV2) =>
      readonly [number, number],
    predicate: (sample: NoAvpdFivePatchStructuralSampleV2) => boolean =
      () => true,
  ) => report.arms.map((arm, index) => ({
    label: shortArmLabel(arm.armId),
    className: `series-${index + 1}`,
    points: arm.finalCycleSamples.filter(predicate).map(point),
  }));
  const panels = [
    plotSvg(armSeries((sample) => [
      sample.volumesMl.leftAtriumMl,
      sample.pressuresMmHg.leftAtriumMmHg,
    ]), "LA total blood-volume PV", "LA total volume (mL)", "LAP (mmHg)"),
    plotSvg(armSeries((sample) => [
      sample.leftAtrialPartition?.bodyVolumeMl ??
        sample.volumesMl.leftAtriumMl,
      sample.pressuresMmHg.leftAtriumMmHg,
    ]), "LA body-volume PV", "LA body volume (mL)", "LAP (mmHg)"),
    plotSvg(armSeries((sample) => [
      sample.volumesMl.leftVentricleMl,
      sample.pressuresMmHg.leftVentricleMmHg,
    ]), "LV PV", "LV volume (mL)", "LVP (mmHg)"),
    plotSvg(armSeries((sample) => [
      sample.phase01,
      sample.pressuresMmHg.leftAtriumMmHg,
    ]), "LAP", "cardiac phase", "pressure (mmHg)"),
    plotSvg(armSeries((sample) => [
      sample.phase01,
      sample.pressuresMmHg.leftVentricleMmHg,
    ]), "LVP", "cardiac phase", "pressure (mmHg)"),
    plotSvg(armSeries((sample) => [
      sample.phase01,
      sample.flowsMlPerSec.mitralMlPerSec,
    ]), "Mitral flow", "cardiac phase", "flow (mL/s)"),
    plotSvg(armSeries((sample) => [
      sample.phase01,
      sample.flowsMlPerSec.aorticMlPerSec,
    ]), "Aortic flow", "cardiac phase", "flow (mL/s)"),
    plotSvg(armSeries((sample) => [
      sample.phase01,
      sample.flowsMlPerSec.pulmonaryVenousMlPerSec,
    ]), "Pulmonary-vein → LA flow", "cardiac phase", "flow (mL/s)"),
    plotSvg(armSeries(
      (sample) => [
        sample.phase01,
        100 * sample.leftAtrialPartition!.appendageFraction01,
      ],
      (sample) => sample.leftAtrialPartition !== null,
    ), "LAA volume partition", "cardiac phase", "LAA / total LA (%)"),
    plotSvg(armSeries(
      (sample) => [
        sample.phase01,
        sample.commonPericardialPressureMmHg,
      ],
      (sample) => sample.commonPericardialPressureMmHg !== 0,
    ), "Common pericardial pressure", "cardiac phase", "pressure (mmHg)"),
    ...(["mitral", "aortic", "tricuspid", "pulmonary"] as const).map(
      (valveId) => plotSvg(armSeries((sample) => [
        sample.phase01,
        sample.dynamicValves[valveId].openingFraction01,
      ]), `${valveLabel(valveId)} opening state`, "cardiac phase", "opening ξ (0–1)"),
    ),
    ...(["mitral", "aortic"] as const).map(
      (valveId) => plotSvg(armSeries((sample) => [
        sample.phase01,
        sample.dynamicValves[valveId].pressureGradientMmHg,
      ]), `${valveLabel(valveId)} pressure gradient`, "cardiac phase", "ΔP (mmHg)"),
    ),
  ];

  const complete = report.arms.every((arm) => arm.status === "run-complete");
  const periodic = report.arms.every(
    (arm) => arm.periodicity.periodicityEstablished === true,
  );
  const warning = !complete
    ? "At least one structural arm failed integration. Partial paths are numerical diagnostics only."
    : !periodic
      ? "All arms completed, but periodic steady state is not established. Shape and V-loop metrics remain cold-transient, report-only observations."
      : "All arms completed and met the caller-owned full-state return-map check. V-loop morphology remains report-only and did not select a winner.";
  const cards = report.arms.map((arm) => {
    const samples = arm.finalCycleSamples;
    const lobes = arm.reportOnlyRawCycleDiagnostics.leftAtrialPvLobes;
    const ratio = lobes?.aToVAbsoluteAreaRatioUnbounded;
    const appendageFractions = samples
      .map((sample) => sample.leftAtrialPartition?.appendageFraction01)
      .filter((value): value is number => value != null);
    const pericardial = samples.map(
      (sample) => sample.commonPericardialPressureMmHg,
    );
    const mitralOpening = samples.map(
      (sample) => sample.dynamicValves.mitral.openingFraction01,
    );
    const aorticOpening = samples.map(
      (sample) => sample.dynamicValves.aortic.openingFraction01,
    );
    return `<article class="metric"><h2>${escapeHtml(shortArmLabel(arm.armId))}</h2>
      <dl><dt>status</dt><dd>${escapeHtml(arm.status)}</dd>
      <dt>periodicity</dt><dd>${escapeHtml(arm.periodicity.status)}</dd>
      <dt>A/V area ratio</dt><dd>${formatNullable(ratio, 3)}</dd>
      <dt>LAA fraction</dt><dd>${rangeText(appendageFractions, 100, "%")}</dd>
      <dt>Pperi</dt><dd>${rangeText(pericardial, 1, " mmHg")}</dd>
      <dt>MV ξ</dt><dd>${rangeText(mitralOpening, 1, "")}</dd>
      <dt>AoV ξ</dt><dd>${rangeText(aorticOpening, 1, "")}</dd>
      <dt>max |Pb-Pa|</dt><dd>${format(arm.maximumAbsoluteBodyAppendagePressureMismatchMmHg, 7)} mmHg</dd></dl></article>`;
  }).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Five-patch structural factorial V2</title>
<style>:root{color-scheme:dark;--bg:#07111f;--panel:#101b2d;--fg:#e7edf7;--muted:#9eacc2;--grid:#273650;--warn:#ffcc66;--s1:#54bdff;--s2:#ffb020;--s3:#ed70bd;--s4:#74dc9b}*{box-sizing:border-box}body{margin:0;padding:22px;background:var(--bg);color:var(--fg);font:14px/1.45 Inter,system-ui,sans-serif}main{max-width:1600px;margin:auto}h1{margin:0 0 5px;font-size:25px}.lead{margin:0 0 16px;color:var(--muted)}.warning{border:1px solid var(--warn);color:var(--warn);padding:10px;border-radius:8px;margin-bottom:14px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.metric,.plot{background:var(--panel);border:1px solid var(--grid);border-radius:9px;padding:11px}.metric h2,.plot h2{font-size:14px;margin:0 0 7px}.metric dl{display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;margin:0}.metric dt{color:var(--muted)}.metric dd{margin:0;text-align:right}.plots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.plot svg{width:100%;display:block}.legend{display:flex;gap:10px;flex-wrap:wrap;color:var(--muted);font-size:10px}.swatch{display:inline-block;width:14px;border-top:2px solid;margin-right:4px;vertical-align:middle}.series{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.series-1{stroke:var(--s1)}.series-2{stroke:var(--s2)}.series-3{stroke:var(--s3)}.series-4{stroke:var(--s4)}.swatch.series-1{border-color:var(--s1)}.swatch.series-2{border-color:var(--s2)}.swatch.series-3{border-color:var(--s3)}.swatch.series-4{border-color:var(--s4)}.axis,.grid{stroke:var(--grid);stroke-width:1}.grid{opacity:.65}.tick,.label{fill:var(--muted);font-size:10px}.note{color:var(--muted);font-size:12px;margin-top:14px}@media(max-width:1000px){.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){body{padding:10px}.metrics,.plots{grid-template-columns:1fr}}</style></head><body><main>
<h1>No-AVPD five-patch structural factorial V2</h1><p class="lead">Fixed candidate ${escapeHtml(report.candidateId)} · ${escapeHtml(report.request.scenarioId)} · ${report.request.beats} beat(s) · dt ${format(report.request.dtSec,4)} s. All four arms share independent first-order opening states for all four valves. No local optimization or morphology-based winner selection.</p><div class="warning">${escapeHtml(warning)}</div><section class="metrics">${cards}</section><section class="plots">${panels.join("")}</section><p class="note">S0/P0 = single LA wall/no pericardium; S0/P1 = single wall/common pericardium; S1/P0 = common-pressure LA body+LAA/no pericardium; S1/P1 = both. Raw endpoints are not smoothed. A hydraulic floor is not a claim of normal regurgitant area.</p></main></body></html>`;
}

export function renderNoAvpdFivePatchStructuralFactorialFileV2(
  input = DEFAULT_NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_INPUT_V2,
  output = DEFAULT_NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_VISUAL_V2,
) {
  const report = JSON.parse(readFileSync(input, "utf8")) as
    NoAvpdFivePatchStructuralFactorialResultV2;
  const html = renderNoAvpdFivePatchStructuralFactorialHtmlV2(report);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, html, "utf8");
  return Object.freeze({ input, output, byteLength: Buffer.byteLength(html) });
}

function plotSvg(
  series: readonly Series[],
  title: string,
  xLabel: string,
  yLabel: string,
): string {
  const usable = series.filter((entry) => entry.points.length > 0);
  const width = 680, height = 390;
  const margin = { left: 66, right: 20, top: 18, bottom: 54 };
  const all = usable.flatMap((entry) => entry.points);
  const xd = paddedDomain(all.map((point) => point[0]));
  const yd = paddedDomain(all.map((point) => point[1]));
  const x = (value: number) => margin.left +
    (value - xd[0]) / (xd[1] - xd[0]) * (width - margin.left - margin.right);
  const y = (value: number) => height - margin.bottom -
    (value - yd[0]) / (yd[1] - yd[0]) * (height - margin.top - margin.bottom);
  const xt = ticks(xd, 5), yt = ticks(yd, 5);
  const grid = [...xt.map((v) => `<line class="grid" x1="${x(v)}" y1="${margin.top}" x2="${x(v)}" y2="${height-margin.bottom}"/>`),...yt.map((v) => `<line class="grid" x1="${margin.left}" y1="${y(v)}" x2="${width-margin.right}" y2="${y(v)}"/>`)].join("");
  const paths = usable.map((entry) => `<path class="series ${entry.className}" d="${entry.points.map((p,i)=>`${i===0?"M":"L"}${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join(" ")}"/>`).join("");
  const ticksText = [...xt.map((v)=>`<text class="tick" text-anchor="middle" x="${x(v)}" y="${height-margin.bottom+17}">${format(v,2)}</text>`),...yt.map((v)=>`<text class="tick" text-anchor="end" x="${margin.left-7}" y="${y(v)+3}">${format(v,2)}</text>`)].join("");
  const legend = usable.map((entry)=>`<span><i class="swatch ${entry.className}"></i>${escapeHtml(entry.label)}</span>`).join("");
  return `<article class="plot"><h2>${escapeHtml(title)}</h2><div class="legend">${legend}</div><svg viewBox="0 0 ${width} ${height}">${grid}${paths}${ticksText}<line class="axis" x1="${margin.left}" y1="${height-margin.bottom}" x2="${width-margin.right}" y2="${height-margin.bottom}"/><line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height-margin.bottom}"/><text class="label" text-anchor="middle" x="${(margin.left+width-margin.right)/2}" y="${height-12}">${escapeHtml(xLabel)}</text><text class="label" text-anchor="middle" transform="translate(15 ${(margin.top+height-margin.bottom)/2}) rotate(-90)">${escapeHtml(yLabel)}</text></svg></article>`;
}

function shortArmLabel(armId: string): string {
  const s = armId.startsWith("body-laa") ? "S1" : "S0";
  const p = armId.endsWith("common-pericardium") ? "P1" : "P0";
  return `${s}/${p}`;
}
function valveLabel(
  valveId: "mitral" | "aortic" | "tricuspid" | "pulmonary",
): string {
  return ({
    mitral: "MV",
    aortic: "AoV",
    tricuspid: "TV",
    pulmonary: "PV",
  } as const)[valveId];
}
function paddedDomain(values: readonly number[]): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  const min = Math.min(...finite), max = Math.max(...finite), span = max-min;
  const pad = span > 1e-12 ? 0.06*span : Math.max(1,Math.abs(min)*0.1);
  return [min-pad,max+pad];
}
function ticks(domain: readonly [number, number], count: number): number[] {
  return Array.from({length:count},(_,i)=>domain[0]+i/(count-1)*(domain[1]-domain[0]));
}
function rangeText(values: readonly number[], scale: number, suffix: string): string {
  if (values.length === 0) return "n/a";
  return `${format(Math.min(...values)*scale,2)}–${format(Math.max(...values)*scale,2)}${suffix}`;
}
function formatNullable(value: number | null | undefined, digits: number): string { return value == null || !Number.isFinite(value) ? "n/a" : value.toFixed(digits); }
function format(value: number, digits: number): string { return Number.isFinite(value) ? value.toFixed(digits) : "n/a"; }
function escapeHtml(value: string): string { return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }

const invokedPath = process.argv[1];
if (invokedPath != null && pathToFileURL(resolve(invokedPath)).href === import.meta.url) {
  let input = DEFAULT_NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_INPUT_V2;
  let output = DEFAULT_NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_VISUAL_V2;
  for (let index=2; index<process.argv.length; index+=1) {
    const arg=process.argv[index]!, value=process.argv[index+1];
    if (value == null) throw new Error(`missing value after ${arg}`);
    if (arg==="--input") input=resolve(value); else if (arg==="--output") output=resolve(value); else throw new Error(`unknown argument: ${arg}`);
    index+=1;
  }
  process.stdout.write(`${JSON.stringify(renderNoAvpdFivePatchStructuralFactorialFileV2(input,output))}\n`);
}
