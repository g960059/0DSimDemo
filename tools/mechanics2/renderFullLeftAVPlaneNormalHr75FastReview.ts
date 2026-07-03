import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runFullLeftAVPlaneResidualRoutingBenchV1,
  runFullLeftAVPlaneResidualRoutingTraceV1,
} from "@/engine/mechanics2/benches/FullLeftAVPlaneResidualRoutingBench";
import type { LeftHeartSubsystemSampleV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/full-left-av-plane-normal-hr75-fast-review.svg",
);

const COLORS = [
  "#38bdf8",
  "#f472b6",
  "#fbbf24",
  "#34d399",
  "#c084fc",
  "#fb7185",
  "#67e8f9",
  "#a3e635",
] as const;

const report = runFullLeftAVPlaneResidualRoutingBenchV1({ profileIds: ["normal-hr75"] });
const rows = report.rows.filter((row) => row.profileId === "normal-hr75");
const candidateRows = rows
  .filter((row) =>
    row.sourceSurfacePass
    && row.mvfClean
    && row.primeWaveformPass
    && row.phaseOrientedPvPass
    && row.hiddenVolumeClean
    && !row.phasePv.failureReasons.includes("mv-opening-starts-upward")
    && !row.phasePv.failureReasons.includes("mv-opening-conduit-start-not-downstroke")
  )
  .sort((a, b) =>
    Number(b.sourcePreservingPhasePv) - Number(a.sourcePreservingPhasePv)
    || Number(b.primeWaveformPass) - Number(a.primeWaveformPass)
    || b.phasePv.vLoopArea - a.phasePv.vLoopArea
    || b.phasePv.postOpeningEarlyPressureDropMmHg - a.phasePv.postOpeningEarlyPressureDropMmHg
  )
  .slice(0, 8);

const traces = candidateRows.map((row, index) => ({
  row,
  color: COLORS[index % COLORS.length]!,
  samples: runFullLeftAVPlaneResidualRoutingTraceV1("normal-hr75", row.variantId),
}));

const width = 1500;
const height = 870;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="700">Normal HR75 fast LA AV-plane residual review</text>`);
svg.push(`<text x="34" y="60" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Only normal-hr75 is evaluated here. Candidate traces require source surface, MVF, blood-volume PV phase, and hidden-volume cleanliness; blood volume remains the physiology-facing axis.</text>`);
svg.push(`<text x="34" y="84" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="13">Candidate count: ${candidateRows.length}; fastest loop report rows: ${rows.length}. This artifact is a visual research shortcut, not broad-envelope acceptance.</text>`);

if (traces.length === 0) {
  svg.push(`<text x="34" y="138" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="16">No normal-hr75 candidate survived the visual prefilter.</text>`);
} else {
  renderLegend(svg, traces, 34, 116);
  renderPvPanel(svg, traces, 34, 260, 430, 350, "LA blood PV", (sample) => sample.acceptedLaVolumeMl);
  renderPvPanel(
    svg,
    traces,
    510,
    260,
    430,
    350,
    "LA effective-cavity PV",
    (sample) => sample.laVolumeCoordinateReadback.effectiveCavityVolumeMl,
  );
  renderTimePanel(svg, traces, 986, 260, 430, 166, "QMV / QPV", [
    { key: "qMvMlPerSec", label: "QMV", dash: "" },
    { key: "qPulmonaryVenousMlPerSec", label: "QPV", dash: "5 4" },
  ]);
  renderPressurePanel(svg, traces, 986, 444, 430, 166);
  renderPrimePanel(svg, traces, 34, 656, 1382, 150);
}

svg.push(`</svg>`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${svg.join("\n")}\n`);
console.log(outPath.replace(`${repoRoot}/`, ""));

type Trace = {
  readonly row: (typeof report.rows)[number];
  readonly color: string;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
};

function renderLegend(out: string[], traces: readonly Trace[], x: number, y: number): void {
  traces.forEach((trace, index) => {
    const yy = y + index * 17;
    out.push(`<line x1="${x}" y1="${yy}" x2="${x + 24}" y2="${yy}" stroke="${trace.color}" stroke-width="3"/>`);
    out.push(`<text x="${x + 32}" y="${yy + 4}" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">${escapeXml(trace.row.variantId)} | vArea ${trace.row.phasePv.vLoopArea.toFixed(1)} | postMVO drop ${trace.row.phasePv.postOpeningEarlyPressureDropMmHg.toFixed(2)}mmHg / ${trace.row.phasePv.postOpeningEarlyVolumeDropMl.toFixed(2)}mL | prime ${trace.row.primeWaveformPass ? "ok" : "fail"}</text>`);
  });
}

function renderPvPanel(
  out: string[],
  traces: readonly Trace[],
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  volumeFor: (sample: LeftHeartSubsystemSampleV2) => number,
): void {
  const all = traces.flatMap((trace) => trace.samples);
  const xs = all.map(volumeFor);
  const ys = all.map((sample) => sample.lapMmHg);
  const sx = scaleFor(xs, x, w);
  const sy = scaleFor(ys, y + h, -h);
  panelFrame(out, x, y, w, h, title);
  for (const trace of traces) {
    const openingIndex = findMvOpeningIndex(trace.samples);
    const closureIndex = openingIndex == null ? null : findMvClosureIndexAfter(trace.samples, openingIndex);
    if (openingIndex != null && closureIndex != null) {
      const opening = trace.samples[openingIndex]!;
      const closure = trace.samples[closureIndex]!;
      out.push(`<line x1="${sx(volumeFor(closure)).toFixed(1)}" y1="${sy(closure.lapMmHg).toFixed(1)}" x2="${sx(volumeFor(opening)).toFixed(1)}" y2="${sy(opening.lapMmHg).toFixed(1)}" stroke="${trace.color}" stroke-width="1" stroke-dasharray="4 4" opacity="0.42"/>`);
      out.push(`<circle cx="${sx(volumeFor(opening)).toFixed(1)}" cy="${sy(opening.lapMmHg).toFixed(1)}" r="4" fill="${trace.color}" stroke="#020617" stroke-width="1.2"/>`);
      out.push(`<circle cx="${sx(volumeFor(closure)).toFixed(1)}" cy="${sy(closure.lapMmHg).toFixed(1)}" r="4" fill="#020617" stroke="${trace.color}" stroke-width="1.6"/>`);
    }
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(volumeFor(sample)), (sample) => sy(sample.lapMmHg))}" fill="none" stroke="${trace.color}" stroke-width="2.4" opacity="0.88"/>`);
  }
}

function renderTimePanel(
  out: string[],
  traces: readonly Trace[],
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  specs: readonly {
    readonly key: "qMvMlPerSec" | "qPulmonaryVenousMlPerSec";
    readonly label: string;
    readonly dash: string;
  }[],
): void {
  const ys = traces.flatMap((trace) => trace.samples.flatMap((sample) => specs.map((spec) => sample[spec.key])));
  const sx = (theta: number) => x + theta * w;
  const sy = scaleFor(ys, y + h, -h);
  panelFrame(out, x, y, w, h, title);
  for (const trace of traces) {
    for (const spec of specs) {
      out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(sample[spec.key]))}" fill="none" stroke="${trace.color}" stroke-width="${spec.key === "qMvMlPerSec" ? 2.0 : 1.2}" stroke-dasharray="${spec.dash}" opacity="${spec.key === "qMvMlPerSec" ? 0.86 : 0.45}"/>`);
    }
  }
}

function renderPressurePanel(out: string[], traces: readonly Trace[], x: number, y: number, w: number, h: number): void {
  const ys = traces.flatMap((trace) => trace.samples.flatMap((sample) => [sample.lapMmHg, sample.lvpMmHg]));
  const sx = (theta: number) => x + theta * w;
  const sy = scaleFor(ys, y + h, -h);
  panelFrame(out, x, y, w, h, "LAP / LVP");
  for (const trace of traces) {
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(sample.lapMmHg))}" fill="none" stroke="${trace.color}" stroke-width="2.0" opacity="0.85"/>`);
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(sample.lvpMmHg))}" fill="none" stroke="${trace.color}" stroke-width="1.1" stroke-dasharray="5 4" opacity="0.45"/>`);
  }
}

function renderPrimePanel(out: string[], traces: readonly Trace[], x: number, y: number, w: number, h: number): void {
  const values = traces.flatMap((trace) => trace.samples.flatMap((sample) => [
    finiteOrZero(sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec),
    finiteOrZero(sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec),
    finiteOrZero(sample.avPlaneGeometryReadback.aPrimeProxyCmPerSec),
  ]));
  const sx = (theta: number) => x + theta * w;
  const sy = scaleFor(values, y + h, -h);
  panelFrame(out, x, y, w, h, "s' / e' / a' proxy");
  for (const trace of traces) {
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(finiteOrZero(sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec)))}" fill="none" stroke="${trace.color}" stroke-width="1.8" opacity="0.86"/>`);
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(finiteOrZero(sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec)))}" fill="none" stroke="${trace.color}" stroke-width="1.2" stroke-dasharray="7 4" opacity="0.58"/>`);
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(finiteOrZero(sample.avPlaneGeometryReadback.aPrimeProxyCmPerSec)))}" fill="none" stroke="${trace.color}" stroke-width="1.2" stroke-dasharray="2 4" opacity="0.72"/>`);
  }
}

function panelFrame(out: string[], x: number, y: number, w: number, h: number, title: string): void {
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#111827" stroke="#253044"/>`);
  out.push(`<path d="M${x + w / 2},${y + 32} L${x + w / 2},${y + h - 14} M${x + 14},${y + h / 2} L${x + w - 14},${y + h / 2}" stroke="#263244" stroke-width="1"/>`);
  out.push(`<text x="${x + 14}" y="${y + 25}" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700">${title}</text>`);
}

function pathFor(
  samples: readonly LeftHeartSubsystemSampleV2[],
  xFor: (sample: LeftHeartSubsystemSampleV2) => number,
  yFor: (sample: LeftHeartSubsystemSampleV2) => number,
): string {
  return samples.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${xFor(sample).toFixed(1)},${yFor(sample).toFixed(1)}`
  ).join(" ");
}

function scaleFor(values: readonly number[], offset: number, span: number): (value: number) => number {
  const finite = values.filter((value) => Number.isFinite(value));
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const pad = Math.max((max - min) * 0.08, 1e-6);
  const lo = min - pad;
  const hi = max + pad;
  return (value) => offset + (value - lo) / Math.max(hi - lo, 1e-9) * span;
}

function findMvOpeningIndex(samples: readonly LeftHeartSubsystemSampleV2[]): number | null {
  for (let i = 0; i < samples.length; i++) {
    const previous = samples[(i + samples.length - 1) % samples.length]!.mvOpen01;
    const current = samples[i]!.mvOpen01;
    if (previous < 0.45 && current >= 0.45) return i;
  }
  return null;
}

function findMvClosureIndexAfter(samples: readonly LeftHeartSubsystemSampleV2[], openingIndex: number): number | null {
  for (let step = 1; step <= samples.length; step++) {
    const index = (openingIndex + step) % samples.length;
    const previous = samples[(index + samples.length - 1) % samples.length]!.mvOpen01;
    const current = samples[index]!.mvOpen01;
    if (previous >= 0.45 && current < 0.45) return index;
  }
  return null;
}

function finiteOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
