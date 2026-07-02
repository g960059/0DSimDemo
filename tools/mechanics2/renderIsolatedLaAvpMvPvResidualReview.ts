import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runIsolatedLaAvpMvPvResidualBenchV1,
  runIsolatedLaAvpMvPvResidualTrajectoryPanelsV1,
  type IsolatedLaAvpMvPvResidualSampleV1,
} from "@/engine/mechanics2/benches/IsolatedLaAvpMvPvResidualBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/isolated-la-avp-mv-pv-residual-review.svg",
);

const report = runIsolatedLaAvpMvPvResidualBenchV1();
const panels = runIsolatedLaAvpMvPvResidualTrajectoryPanelsV1(report.summary.bestResidualVariantId);
const bestNormalForm = [...report.variantSummaries]
  .filter((summary) => summary.variantId.startsWith("normal-form-"))
  .sort((a, b) =>
    b.sourcePreservingFigureEight - a.sourcePreservingFigureEight
    || b.figureEightPass - a.figureEightPass
    || b.sourceBoundaryClean - a.sourceBoundaryClean
    || b.mvfClean - a.mvfClean
    || b.maxVLoopArea - a.maxVLoopArea
  )[0];
const normalFormPanels = bestNormalForm == null
  ? null
  : runIsolatedLaAvpMvPvResidualTrajectoryPanelsV1(bestNormalForm.variantId);

type PanelWithNormalForm = ReturnType<typeof runIsolatedLaAvpMvPvResidualTrajectoryPanelsV1>[number]
  & { readonly normalForm: readonly IsolatedLaAvpMvPvResidualSampleV1[] | null };

const width = 1440;
const panelWidth = 650;
const panelHeight = 340;
const marginX = 52;
const marginY = 120;
const gapX = 36;
const gapY = 28;
const height = marginY + 4 * panelHeight + 3 * gapY + 60;

const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Isolated LA-AV-plane-MV-PV residual review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Blood volume is ledger-owned by pulmonary venous inflow and MV flow. AV-plane affects effective fiber volume, not hidden blood volume.</text>`);
svg.push(`<text x="34" y="82" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best residual: ${report.summary.bestResidualVariantId}; figure-eight ${report.summary.bestResidualFigureEightPass}/7, source+figure-eight ${report.summary.bestResidualSourcePreservingFigureEight}/7, MVF ${report.summary.bestResidualMvfClean}/7, prime ${report.summary.bestResidualPrimePass}/7</text>`);
legend(svg, 940, 38, "#22c55e", "no AV-plane reference");
legend(svg, 940, 62, "#38bdf8", "explicit reference-volume coordinate");
legend(svg, 940, 86, "#f97316", "best LA-AVP-MV-PV residual");
if (bestNormalForm != null) legend(svg, 940, 110, "#a855f7", `best normal-form ${bestNormalForm.variantId}`);
svg.push(`<circle cx="1238" cy="42" r="4.5" fill="#111827" stroke="#f8fafc" stroke-width="2"/>`);
svg.push(`<text x="1250" y="47" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">best MV closure</text>`);
svg.push(`<circle cx="1238" cy="66" r="4.5" fill="#f8fafc" stroke="#111827" stroke-width="1.5"/>`);
svg.push(`<text x="1250" y="71" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">best MV opening</text>`);

for (let i = 0; i < panels.length; i++) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = marginX + col * (panelWidth + gapX);
  const y = marginY + row * (panelHeight + gapY);
  renderPanel(svg, x, y, panelWidth, panelHeight, {
    ...panels[i]!,
    normalForm: normalFormPanels?.[i]?.bestResidual ?? null,
  });
}

svg.push(`</svg>`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${svg.join("\n")}\n`);
console.log(outPath.replace(`${repoRoot}/`, ""));

function renderPanel(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: PanelWithNormalForm,
): void {
  const padX = 26;
  const padTop = 46;
  const plotW = (w - 5 * padX) / 4;
  const plotH = h - 84;
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 16}" y="${y + 27}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${panel.profileId}</text>`);
  renderPv(out, x + padX, y + padTop, plotW, plotH, panel);
  renderFlow(out, x + 2 * padX + plotW, y + padTop, plotW, plotH, panel);
  renderPressures(out, x + 3 * padX + 2 * plotW, y + padTop, plotW, plotH, panel);
  renderPrime(out, x + 4 * padX + 3 * plotW, y + padTop, plotW, plotH, panel);
}

function renderPv(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: PanelWithNormalForm,
): void {
  const all = [...panel.baseline, ...panel.explicitReference, ...panel.bestResidual, ...(panel.normalForm ?? [])];
  const xs = all.map((sample) => sample.laBloodVolumeMl);
  const ps = all.map((sample) => sample.lapMmHg);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const sx = (value: number) => x + (value - minX) / Math.max(maxX - minX, 1e-9) * w;
  const sy = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  axis(out, x, y, w, h, "LA blood PV");
  out.push(`<path d="${pvPath(panel.baseline, sx, sy)}" fill="none" stroke="#22c55e" stroke-width="2.2" opacity="0.9"/>`);
  out.push(`<path d="${pvPath(panel.explicitReference, sx, sy)}" fill="none" stroke="#38bdf8" stroke-width="2.2" opacity="0.9"/>`);
  out.push(`<path d="${pvPath(panel.bestResidual, sx, sy)}" fill="none" stroke="#f97316" stroke-width="2.6" opacity="0.95"/>`);
  if (panel.normalForm != null) {
    out.push(`<path d="${pvPath(panel.normalForm, sx, sy)}" fill="none" stroke="#a855f7" stroke-width="2.4" opacity="0.85"/>`);
  }
  const opening = findOpening(panel.bestResidual);
  const closure = opening == null ? null : findClosure(panel.bestResidual, opening);
  if (opening != null) {
    const sample = panel.bestResidual[opening]!;
    out.push(`<circle cx="${sx(sample.laBloodVolumeMl).toFixed(1)}" cy="${sy(sample.lapMmHg).toFixed(1)}" r="4.2" fill="#f8fafc" stroke="#111827" stroke-width="1.4"/>`);
  }
  if (closure != null) {
    const sample = panel.bestResidual[closure]!;
    out.push(`<circle cx="${sx(sample.laBloodVolumeMl).toFixed(1)}" cy="${sy(sample.lapMmHg).toFixed(1)}" r="4.2" fill="#111827" stroke="#f8fafc" stroke-width="1.8"/>`);
  }
  if (opening != null && closure != null) {
    const a = panel.bestResidual[closure]!;
    const b = panel.bestResidual[opening]!;
    out.push(`<line x1="${sx(a.laBloodVolumeMl).toFixed(1)}" y1="${sy(a.lapMmHg).toFixed(1)}" x2="${sx(b.laBloodVolumeMl).toFixed(1)}" y2="${sy(b.lapMmHg).toFixed(1)}" stroke="#e5e7eb" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.75"/>`);
  }
}

function renderFlow(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: PanelWithNormalForm,
): void {
  const all = [...panel.baseline, ...panel.explicitReference, ...panel.bestResidual, ...(panel.normalForm ?? [])];
  const values = all.flatMap((sample) => [sample.qMvMlPerSec, sample.qPvMlPerSec]);
  const minV = Math.min(0, ...values);
  const maxV = Math.max(1, ...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - (value - minV) / Math.max(maxV - minV, 1e-9) * h;
  axis(out, x, y, w, h, "QMV solid / QPV dotted");
  out.push(`<line x1="${x}" y1="${sy(0).toFixed(1)}" x2="${x + w}" y2="${sy(0).toFixed(1)}" stroke="#475569" stroke-width="1"/>`);
  renderFlowPair(out, panel.baseline, sx, sy, "#22c55e");
  renderFlowPair(out, panel.explicitReference, sx, sy, "#38bdf8");
  renderFlowPair(out, panel.bestResidual, sx, sy, "#f97316");
  if (panel.normalForm != null) renderFlowPair(out, panel.normalForm, sx, sy, "#a855f7");
}

function renderPressures(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: PanelWithNormalForm,
): void {
  const all = [...panel.baseline, ...panel.explicitReference, ...panel.bestResidual, ...(panel.normalForm ?? [])];
  const values = all.flatMap((sample) => [sample.lapMmHg, sample.lvpMmHg, sample.pvPressureMmHg]);
  const minV = Math.min(0, ...values);
  const maxV = Math.max(1, ...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - (value - minV) / Math.max(maxV - minV, 1e-9) * h;
  axis(out, x, y, w, h, "LAP / PV / LVP");
  out.push(`<path d="${tracePath(panel.bestResidual, sx, sy, (s) => s.lapMmHg)}" fill="none" stroke="#f97316" stroke-width="2.4"/>`);
  if (panel.normalForm != null) {
    out.push(`<path d="${tracePath(panel.normalForm, sx, sy, (s) => s.lapMmHg)}" fill="none" stroke="#a855f7" stroke-width="2.0" opacity="0.85"/>`);
  }
  out.push(`<path d="${tracePath(panel.bestResidual, sx, sy, (s) => s.pvPressureMmHg)}" fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-dasharray="4 3"/>`);
  out.push(`<path d="${tracePath(panel.bestResidual, sx, sy, (s) => s.lvpMmHg)}" fill="none" stroke="#94a3b8" stroke-width="1.6" opacity="0.85"/>`);
}

function renderPrime(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  panel: PanelWithNormalForm,
): void {
  const all = [...panel.baseline, ...panel.explicitReference, ...panel.bestResidual, ...(panel.normalForm ?? [])];
  const values = all.map((sample) => sample.zAvDotNormPerSec * 2.4);
  const minV = Math.min(-1, ...values);
  const maxV = Math.max(1, ...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - (value - minV) / Math.max(maxV - minV, 1e-9) * h;
  axis(out, x, y, w, h, "AV-plane v proxy");
  band(out, x, y, w, h, 0.08, 0.52, "#1d4ed8", "s'");
  band(out, x, y, w, h, 0.53, 0.74, "#047857", "e'");
  band(out, x, y, w, h, 0.82, 1.0, "#7c2d12", "a'");
  out.push(`<line x1="${x}" y1="${sy(0).toFixed(1)}" x2="${x + w}" y2="${sy(0).toFixed(1)}" stroke="#475569" stroke-width="1"/>`);
  out.push(`<path d="${tracePath(panel.baseline, sx, sy, (s) => s.zAvDotNormPerSec * 2.4)}" fill="none" stroke="#22c55e" stroke-width="2.0" opacity="0.9"/>`);
  out.push(`<path d="${tracePath(panel.explicitReference, sx, sy, (s) => s.zAvDotNormPerSec * 2.4)}" fill="none" stroke="#38bdf8" stroke-width="2.0" opacity="0.9"/>`);
  out.push(`<path d="${tracePath(panel.bestResidual, sx, sy, (s) => s.zAvDotNormPerSec * 2.4)}" fill="none" stroke="#f97316" stroke-width="2.5" opacity="0.95"/>`);
  if (panel.normalForm != null) {
    out.push(`<path d="${tracePath(panel.normalForm, sx, sy, (s) => s.zAvDotNormPerSec * 2.4)}" fill="none" stroke="#a855f7" stroke-width="2.2" opacity="0.85"/>`);
  }
}

function renderFlowPair(
  out: string[],
  samples: readonly IsolatedLaAvpMvPvResidualSampleV1[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  color: string,
): void {
  out.push(`<path d="${tracePath(samples, sx, sy, (sample) => sample.qMvMlPerSec)}" fill="none" stroke="${color}" stroke-width="2.0" opacity="0.9"/>`);
  out.push(`<path d="${tracePath(samples, sx, sy, (sample) => sample.qPvMlPerSec)}" fill="none" stroke="${color}" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.75"/>`);
}

function legend(out: string[], x: number, y: number, color: string, label: string): void {
  out.push(`<line x1="${x}" y1="${y}" x2="${x + 42}" y2="${y}" stroke="${color}" stroke-width="3"/>`);
  out.push(`<text x="${x + 50}" y="${y + 5}" fill="${color}" font-family="Inter,Arial,sans-serif" font-size="12">${label}</text>`);
}

function axis(out: string[], x: number, y: number, w: number, h: number, label: string): void {
  out.push(`<text x="${x}" y="${y - 8}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="10">${label}</text>`);
  out.push(`<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="#334155"/>`);
  out.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#334155"/>`);
}

function band(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  start: number,
  end: number,
  color: string,
  label: string,
): void {
  const x0 = x + start * w;
  const x1 = x + end * w;
  out.push(`<rect x="${x0.toFixed(1)}" y="${y}" width="${(x1 - x0).toFixed(1)}" height="${h}" fill="${color}" opacity="0.09"/>`);
  out.push(`<text x="${(x0 + 3).toFixed(1)}" y="${y + 12}" fill="${color}" font-family="Inter,Arial,sans-serif" font-size="9">${label}</text>`);
}

function pvPath(
  samples: readonly IsolatedLaAvpMvPvResidualSampleV1[],
  sx: (value: number) => number,
  sy: (value: number) => number,
): string {
  return samples
    .map((sample, index) =>
      `${index === 0 ? "M" : "L"}${sx(sample.laBloodVolumeMl).toFixed(1)},${sy(sample.lapMmHg).toFixed(1)}`
    )
    .join(" ");
}

function tracePath(
  samples: readonly IsolatedLaAvpMvPvResidualSampleV1[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  pick: (sample: IsolatedLaAvpMvPvResidualSampleV1) => number,
): string {
  return samples
    .map((sample, index) => `${index === 0 ? "M" : "L"}${sx(sample.theta).toFixed(1)},${sy(pick(sample)).toFixed(1)}`)
    .join(" ");
}

function findOpening(samples: readonly IsolatedLaAvpMvPvResidualSampleV1[]): number | null {
  const threshold = 0.45;
  for (let i = 0; i < samples.length; i++) {
    const previous = samples[(i + samples.length - 1) % samples.length]!.mvOpen01;
    if (previous < threshold && samples[i]!.mvOpen01 >= threshold) return i;
  }
  return null;
}

function findClosure(samples: readonly IsolatedLaAvpMvPvResidualSampleV1[], openingIndex: number): number | null {
  const threshold = 0.45;
  for (let step = 1; step <= samples.length; step++) {
    const index = (openingIndex + step) % samples.length;
    const previous = samples[(index + samples.length - 1) % samples.length]!.mvOpen01;
    if (previous >= threshold && samples[index]!.mvOpen01 < threshold) return index;
  }
  return null;
}
