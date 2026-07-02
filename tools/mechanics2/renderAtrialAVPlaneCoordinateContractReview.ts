import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyCoordinateContractVariant,
  ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1,
  runAtrialAVPlaneCoordinateContractReviewBenchV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneCoordinateContractReviewBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/atrial-av-plane-coordinate-contract-review.svg",
);

const profileIds: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

const report = runAtrialAVPlaneCoordinateContractReviewBenchV1();
const rawVariant = ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1.find((variantConfig) =>
  variantConfig.variantId === "raw-traction-reference"
)!;
const bestVariant = ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1.find((variantConfig) =>
  variantConfig.variantId === report.summary.bestForceBalanceVariantId
)!;
const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08");
const panels = profileIds.map((profileId, index) => {
  const raw = runLeftHeartSubsystemV2(applyCoordinateContractVariant(baseParams[index]!, rawVariant));
  const best = runLeftHeartSubsystemV2(applyCoordinateContractVariant(baseParams[index]!, bestVariant));
  return { profileId, raw: raw.finalBeatSamples, best: best.finalBeatSamples };
});

const width = 1320;
const panelWidth = 606;
const panelHeight = 280;
const marginX = 46;
const marginY = 118;
const gapX = 34;
const gapY = 26;
const height = marginY + 4 * panelHeight + 3 * gapY + 54;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Atrial AV-plane coordinate contract review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Capacity/work coordinate variants remove direct traction pressure and keep blood volume owned by venous and valve flows.</text>`);
svg.push(`<text x="34" y="82" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best phase-oriented force-balance: ${report.summary.bestForceBalanceVariantId}, source ${report.summary.bestForceBalanceSourceSurfacePass}/7, topology ${report.summary.bestForceBalanceTopologyPass}/7, source+topology ${report.summary.bestForceBalanceSourcePreservingTopologyPass}/7, MVF ${report.summary.bestForceBalanceMvfCleanCount}/7</text>`);
svg.push(`<text x="34" y="100" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="11">PV markers: filled circle = MV opening, hollow circle = MV closure, dashed line = reservoir closure-to-opening chord; post-opening conduit should descend below that chord.</text>`);
svg.push(`<line x1="908" y1="58" x2="950" y2="58" stroke="#22c55e" stroke-width="3"/>`);
svg.push(`<text x="958" y="62" fill="#22c55e" font-family="Inter,Arial,sans-serif" font-size="13">raw traction pressure reference</text>`);
svg.push(`<line x1="908" y1="80" x2="950" y2="80" stroke="#f97316" stroke-width="3"/>`);
svg.push(`<text x="958" y="84" fill="#f97316" font-family="Inter,Arial,sans-serif" font-size="13">best phase-oriented force-balance</text>`);

for (let i = 0; i < panels.length; i++) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = marginX + col * (panelWidth + gapX);
  const y = marginY + row * (panelHeight + gapY);
  renderPanel(svg, x, y, panelWidth, panelHeight, panels[i]!);
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
  panel: {
    readonly profileId: string;
    readonly raw: readonly LeftHeartSubsystemSampleV2[];
    readonly best: readonly LeftHeartSubsystemSampleV2[];
  },
): void {
  const padX = 28;
  const padTop = 44;
  const plotW = (w - 5 * padX) / 4;
  const plotH = h - 76;
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 16}" y="${y + 27}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${panel.profileId}</text>`);
  renderPv(out, x + padX, y + padTop, plotW, plotH, panel.raw, panel.best);
  renderFlow(out, x + 2 * padX + plotW, y + padTop, plotW, plotH, panel.raw, panel.best);
  renderZ(out, x + 3 * padX + 2 * plotW, y + padTop, plotW, plotH, panel.raw, panel.best);
  renderPressure(out, x + 4 * padX + 3 * plotW, y + padTop, plotW, plotH, panel.raw, panel.best);
}

function renderPv(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  best: readonly LeftHeartSubsystemSampleV2[],
): void {
  const xs = [...raw, ...best].map((sample) => sample.acceptedLaVolumeMl);
  const ps = [...raw, ...best].map((sample) => sample.lapMmHg);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const sx = (value: number) => x + (value - minX) / Math.max(maxX - minX, 1e-9) * w;
  const sy = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  axis(out, x, y, w, h, "LA PV");
  renderPvPhaseOverlay(out, raw, sx, sy, "#22c55e");
  renderPvPhaseOverlay(out, best, sx, sy, "#f97316");
  out.push(`<path d="${pathForPv(raw, sx, sy)}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForPv(best, sx, sy)}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
}

function renderPvPhaseOverlay(
  out: string[],
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (value: number) => number,
  sy: (value: number) => number,
  color: string,
): void {
  const openingIndex = findMvOpeningIndex(samples.map((sample) => sample.mvOpen01));
  const closureIndex = openingIndex == null
    ? null
    : findMvClosureIndexAfter(samples.map((sample) => sample.mvOpen01), openingIndex);
  if (openingIndex == null || closureIndex == null) return;
  const opening = samples[openingIndex]!;
  const closure = samples[closureIndex]!;
  const ox = sx(opening.acceptedLaVolumeMl);
  const oy = sy(opening.lapMmHg);
  const cx = sx(closure.acceptedLaVolumeMl);
  const cy = sy(closure.lapMmHg);
  out.push(`<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${ox.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="${color}" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.55"/>`);
  out.push(`<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="3.6" fill="${color}" stroke="#0f172a" stroke-width="1.2"/>`);
  out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.8" fill="#111827" stroke="${color}" stroke-width="1.7"/>`);
}

function renderFlow(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  best: readonly LeftHeartSubsystemSampleV2[],
): void {
  const values = [...raw, ...best].map((sample) => Math.max(0, sample.qMvMlPerSec));
  const maxValue = Math.max(1, ...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - Math.max(0, value) / maxValue * h;
  axis(out, x, y, w, h, "QMV forward");
  out.push(`<path d="${pathForTrace(raw, sx, sy, "qMvMlPerSec")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(best, sx, sy, "qMvMlPerSec")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
}

function renderZ(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  best: readonly LeftHeartSubsystemSampleV2[],
): void {
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - Math.max(0, value) * h;
  axis(out, x, y, w, h, "z AV-plane");
  out.push(`<path d="${pathForTrace(raw, sx, sy, "laAVPlaneWorkCoordinateZNorm")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(best, sx, sy, "laAVPlaneWorkCoordinateZNorm")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
}

function renderPressure(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  best: readonly LeftHeartSubsystemSampleV2[],
): void {
  const values = [...raw, ...best].map((sample) =>
    Math.max(sample.laAVPlaneReservoirTractionPressureMmHg, sample.laAVPlaneWorkCoordinatePressureMmHg)
  );
  const maxValue = Math.max(1, ...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - Math.max(0, value) / maxValue * h;
  axis(out, x, y, w, h, "pressure readback");
  out.push(`<path d="${pathForTrace(raw, sx, sy, "laAVPlaneReservoirTractionPressureMmHg")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(best, sx, sy, "laAVPlaneWorkCoordinatePressureMmHg")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
}

function axis(out: string[], x: number, y: number, w: number, h: number, label: string): void {
  out.push(`<text x="${x}" y="${y - 8}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="10">${label}</text>`);
  out.push(`<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="#334155"/>`);
  out.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#334155"/>`);
}

function pathForPv(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (value: number) => number,
  sy: (value: number) => number,
): string {
  return samples
    .map((sample, index) =>
      `${index === 0 ? "M" : "L"}${sx(sample.acceptedLaVolumeMl).toFixed(1)},${sy(sample.lapMmHg).toFixed(1)}`
    )
    .join(" ");
}

function pathForTrace(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  key:
    | "qMvMlPerSec"
    | "laAVPlaneReservoirTractionPressureMmHg"
    | "laAVPlaneWorkCoordinatePressureMmHg"
    | "laAVPlaneWorkCoordinateZNorm",
): string {
  return samples
    .map((sample, index) =>
      `${index === 0 ? "M" : "L"}${sx(sample.theta).toFixed(1)},${sy(sample[key]).toFixed(1)}`
    )
    .join(" ");
}

function findMvOpeningIndex(mvOpen: readonly number[]): number | null {
  const threshold = 0.45;
  for (let i = 0; i < mvOpen.length; i++) {
    const previous = mvOpen[(i + mvOpen.length - 1) % mvOpen.length]!;
    const current = mvOpen[i]!;
    if (previous < threshold && current >= threshold) return i;
  }
  let maxDelta = 0;
  let maxIndex: number | null = null;
  for (let i = 1; i < mvOpen.length; i++) {
    const delta = mvOpen[i]! - mvOpen[i - 1]!;
    if (delta > maxDelta) {
      maxDelta = delta;
      maxIndex = i;
    }
  }
  return maxDelta > 0.08 ? maxIndex : null;
}

function findMvClosureIndexAfter(mvOpen: readonly number[], openingIndex: number): number | null {
  const threshold = 0.45;
  for (let step = 1; step <= mvOpen.length; step++) {
    const index = (openingIndex + step) % mvOpen.length;
    const previous = mvOpen[(index + mvOpen.length - 1) % mvOpen.length]!;
    const current = mvOpen[index]!;
    if (previous >= threshold && current < threshold) return index;
  }
  let minDelta = 0;
  let minIndex: number | null = null;
  for (let step = 1; step < mvOpen.length; step++) {
    const index = (openingIndex + step) % mvOpen.length;
    const previous = mvOpen[(index + mvOpen.length - 1) % mvOpen.length]!;
    const delta = mvOpen[index]! - previous;
    if (delta < minDelta) {
      minDelta = delta;
      minIndex = index;
    }
  }
  return minDelta < -0.08 ? minIndex : null;
}
