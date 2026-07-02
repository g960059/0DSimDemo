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
const bestForceVariant = ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1.find((variantConfig) =>
  variantConfig.variantId === report.summary.bestForceBalanceVariantId
)!;
const bestReferenceVariant = ATRIAL_AV_PLANE_COORDINATE_CONTRACT_VARIANTS_V1.find((variantConfig) =>
  variantConfig.variantId === report.summary.bestReferenceVolumeVariantId
)!;
const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08");
const panels = profileIds.map((profileId, index) => {
  const raw = runLeftHeartSubsystemV2(applyCoordinateContractVariant(baseParams[index]!, rawVariant));
  const force = runLeftHeartSubsystemV2(applyCoordinateContractVariant(baseParams[index]!, bestForceVariant));
  const reference = runLeftHeartSubsystemV2(applyCoordinateContractVariant(
    baseParams[index]!,
    bestReferenceVariant,
  ));
  return {
    profileId,
    raw: raw.finalBeatSamples,
    force: force.finalBeatSamples,
    reference: reference.finalBeatSamples,
  };
});

const width = 1620;
const panelWidth = 746;
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
svg.push(`<text x="34" y="100" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="11">reference-volume: ${report.summary.bestReferenceVolumeVariantId}, source ${report.summary.bestReferenceVolumeSourceSurfacePass}/7, topology ${report.summary.bestReferenceVolumeTopologyPass}/7; PV markers: filled circle = MV opening, hollow circle = MV closure, red cross = PV tangent C1 kink candidate.</text>`);
svg.push(`<line x1="1208" y1="58" x2="1250" y2="58" stroke="#22c55e" stroke-width="3"/>`);
svg.push(`<text x="1258" y="62" fill="#22c55e" font-family="Inter,Arial,sans-serif" font-size="13">raw traction pressure reference</text>`);
svg.push(`<line x1="1208" y1="80" x2="1250" y2="80" stroke="#f97316" stroke-width="3"/>`);
svg.push(`<text x="1258" y="84" fill="#f97316" font-family="Inter,Arial,sans-serif" font-size="13">best phase-oriented force-balance</text>`);
svg.push(`<line x1="1208" y1="101" x2="1250" y2="101" stroke="#38bdf8" stroke-width="3"/>`);
svg.push(`<text x="1258" y="105" fill="#38bdf8" font-family="Inter,Arial,sans-serif" font-size="13">best reference-volume coordinate</text>`);

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
    readonly force: readonly LeftHeartSubsystemSampleV2[];
    readonly reference: readonly LeftHeartSubsystemSampleV2[];
  },
): void {
  const padX = 28;
  const padTop = 44;
  const plotW = (w - 6 * padX) / 5;
  const plotH = h - 76;
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 16}" y="${y + 27}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${panel.profileId}</text>`);
  renderPv(out, x + padX, y + padTop, plotW, plotH, panel.raw, panel.force, panel.reference);
  renderFlow(out, x + 2 * padX + plotW, y + padTop, plotW, plotH, panel.raw, panel.force, panel.reference);
  renderZ(out, x + 3 * padX + 2 * plotW, y + padTop, plotW, plotH, panel.raw, panel.force, panel.reference);
  renderPressure(out, x + 4 * padX + 3 * plotW, y + padTop, plotW, plotH, panel.raw, panel.force, panel.reference);
  renderPrime(out, x + 5 * padX + 4 * plotW, y + padTop, plotW, plotH, panel.raw, panel.force, panel.reference);
}

function renderPv(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  force: readonly LeftHeartSubsystemSampleV2[],
  reference: readonly LeftHeartSubsystemSampleV2[],
): void {
  const xs = [...raw, ...force, ...reference].map((sample) => sample.acceptedLaVolumeMl);
  const ps = [...raw, ...force, ...reference].map((sample) => sample.lapMmHg);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const sx = (value: number) => x + (value - minX) / Math.max(maxX - minX, 1e-9) * w;
  const sy = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  axis(out, x, y, w, h, "LA PV");
  renderPvPhaseOverlay(out, raw, sx, sy, "#22c55e");
  renderPvPhaseOverlay(out, force, sx, sy, "#f97316");
  renderPvPhaseOverlay(out, reference, sx, sy, "#38bdf8");
  out.push(`<path d="${pathForPv(raw, sx, sy)}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForPv(force, sx, sy)}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForPv(reference, sx, sy)}" fill="none" stroke="#38bdf8" stroke-width="2.4" opacity="0.82"/>`);
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
  for (const kinkIndex of pvKinkMarkerIndices(samples, openingIndex)) {
    const sample = samples[kinkIndex]!;
    const kx = sx(sample.acceptedLaVolumeMl);
    const ky = sy(sample.lapMmHg);
    out.push(`<path d="M${(kx - 4).toFixed(1)},${(ky - 4).toFixed(1)} L${(kx + 4).toFixed(1)},${(ky + 4).toFixed(1)} M${(kx + 4).toFixed(1)},${(ky - 4).toFixed(1)} L${(kx - 4).toFixed(1)},${(ky + 4).toFixed(1)}" stroke="#ef4444" stroke-width="1.5" opacity="0.9"/>`);
  }
}

function renderFlow(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  force: readonly LeftHeartSubsystemSampleV2[],
  reference: readonly LeftHeartSubsystemSampleV2[],
): void {
  const values = [...raw, ...force, ...reference].map((sample) => Math.max(0, sample.qMvMlPerSec));
  const maxValue = Math.max(1, ...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - Math.max(0, value) / maxValue * h;
  axis(out, x, y, w, h, "QMV forward");
  out.push(`<path d="${pathForTrace(raw, sx, sy, "qMvMlPerSec")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(force, sx, sy, "qMvMlPerSec")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(reference, sx, sy, "qMvMlPerSec")}" fill="none" stroke="#38bdf8" stroke-width="2.4" opacity="0.82"/>`);
}

function renderZ(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  force: readonly LeftHeartSubsystemSampleV2[],
  reference: readonly LeftHeartSubsystemSampleV2[],
): void {
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - Math.max(0, value) * h;
  axis(out, x, y, w, h, "z AV-plane");
  out.push(`<path d="${pathForTrace(raw, sx, sy, "laAVPlaneWorkCoordinateZNorm")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(force, sx, sy, "laAVPlaneWorkCoordinateZNorm")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(reference, sx, sy, "laAVPlaneWorkCoordinateZNorm")}" fill="none" stroke="#38bdf8" stroke-width="2.4" opacity="0.82"/>`);
}

function renderPressure(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  force: readonly LeftHeartSubsystemSampleV2[],
  reference: readonly LeftHeartSubsystemSampleV2[],
): void {
  const values = [...raw, ...force, ...reference].map((sample) =>
    Math.max(sample.laAVPlaneReservoirTractionPressureMmHg, sample.laAVPlaneWorkCoordinatePressureMmHg)
  );
  const maxValue = Math.max(1, ...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - Math.max(0, value) / maxValue * h;
  axis(out, x, y, w, h, "pressure readback");
  out.push(`<path d="${pathForTrace(raw, sx, sy, "laAVPlaneReservoirTractionPressureMmHg")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(force, sx, sy, "laAVPlaneWorkCoordinatePressureMmHg")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(reference, sx, sy, "laAVPlaneWorkCoordinatePressureMmHg")}" fill="none" stroke="#38bdf8" stroke-width="2.4" opacity="0.82"/>`);
}

function renderPrime(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  force: readonly LeftHeartSubsystemSampleV2[],
  reference: readonly LeftHeartSubsystemSampleV2[],
): void {
  const values = [...raw, ...force, ...reference].flatMap((sample) => [
    sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec ?? 0,
    sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec ?? 0,
    sample.avPlaneGeometryReadback.aPrimeProxyCmPerSec ?? 0,
  ]);
  const maxAbsValue = Math.max(1, ...values.map((value) => Math.abs(value)));
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h / 2 - value / maxAbsValue * (h * 0.46);
  axis(out, x, y, w, h, "s'/e'/a' proxy");
  out.push(`<line x1="${x}" y1="${sy(0).toFixed(1)}" x2="${x + w}" y2="${sy(0).toFixed(1)}" stroke="#475569" stroke-dasharray="3 4"/>`);
  renderPrimeSet(out, raw, sx, sy, "#22c55e");
  renderPrimeSet(out, force, sx, sy, "#f97316");
  renderPrimeSet(out, reference, sx, sy, "#38bdf8");
}

function renderPrimeSet(
  out: string[],
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  color: string,
): void {
  out.push(`<path d="${pathForNullableTrace(samples, sx, sy, (sample) => sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec)}" fill="none" stroke="${color}" stroke-width="2.2" opacity="0.92"/>`);
  out.push(`<path d="${pathForNullableTrace(samples, sx, sy, (sample) => sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec)}" fill="none" stroke="${color}" stroke-width="1.7" stroke-dasharray="5 4" opacity="0.82"/>`);
  out.push(`<path d="${pathForNullableTrace(samples, sx, sy, (sample) => sample.avPlaneGeometryReadback.aPrimeProxyCmPerSec)}" fill="none" stroke="${color}" stroke-width="1.7" stroke-dasharray="2 3" opacity="0.82"/>`);
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

function pathForNullableTrace(
  samples: readonly LeftHeartSubsystemSampleV2[],
  sx: (theta: number) => number,
  sy: (value: number) => number,
  accessor: (sample: LeftHeartSubsystemSampleV2) => number | null,
): string {
  const parts: string[] = [];
  let drawing = false;
  for (const sample of samples) {
    const value = accessor(sample);
    if (value == null || !Number.isFinite(value)) {
      drawing = false;
      continue;
    }
    parts.push(`${drawing ? "L" : "M"}${sx(sample.theta).toFixed(1)},${sy(value).toFixed(1)}`);
    drawing = true;
  }
  return parts.join(" ");
}

function pvKinkMarkerIndices(samples: readonly LeftHeartSubsystemSampleV2[], openingIndex: number): readonly number[] {
  const angleJumps = tangentAngleJumpsDeg(
    samples.map((sample) => sample.acceptedLaVolumeMl),
    samples.map((sample) => sample.lapMmHg),
  );
  const lowerIndex = lowerConduitPressureIndex(
    samples.map((sample) => sample.lapMmHg),
    samples.map((sample) => sample.theta),
    openingIndex,
  );
  const candidates = [openingIndex, lowerIndex].filter((value): value is number => value != null);
  return [...new Set(candidates.filter((index) => localAngleJumpAt(angleJumps, index) > 58))];
}

function tangentAngleJumpsDeg(
  x: readonly number[],
  y: readonly number[],
): readonly { readonly index: number; readonly angleJumpDeg: number }[] {
  const out: { index: number; angleJumpDeg: number }[] = [];
  if (x.length < 5 || y.length < 5) return out;
  const xScale = Math.max(Math.max(...x) - Math.min(...x), 1e-9);
  const yScale = Math.max(Math.max(...y) - Math.min(...y), 1e-9);
  for (let i = 1; i < x.length - 1; i++) {
    const prevAngle = Math.atan2((y[i]! - y[i - 1]!) / yScale, (x[i]! - x[i - 1]!) / xScale);
    const nextAngle = Math.atan2((y[i + 1]! - y[i]!) / yScale, (x[i + 1]! - x[i]!) / xScale);
    out.push({ index: i, angleJumpDeg: Math.abs(wrapAngleRad(nextAngle - prevAngle)) * 180 / Math.PI });
  }
  return out;
}

function localAngleJumpAt(
  angleJumps: readonly { readonly index: number; readonly angleJumpDeg: number }[],
  index: number,
): number {
  return Math.max(0, ...angleJumps
    .filter((entry) => Math.abs(entry.index - index) <= 1)
    .map((entry) => entry.angleJumpDeg));
}

function lowerConduitPressureIndex(
  pressures: readonly number[],
  theta: readonly number[],
  openingIndex: number,
): number | null {
  const indices = conduitIndicesAfterOpening(theta, openingIndex);
  let selected: number | null = null;
  let minPressure = Number.POSITIVE_INFINITY;
  for (const index of indices) {
    if (pressures[index]! < minPressure) {
      minPressure = pressures[index]!;
      selected = index;
    }
  }
  return selected;
}

function conduitIndicesAfterOpening(theta: readonly number[], openingIndex: number): readonly number[] {
  const indices: number[] = [];
  for (let step = 0; step < theta.length; step++) {
    const index = (openingIndex + step) % theta.length;
    indices.push(index);
    if (step > 0 && theta[index]! >= 0.74) break;
  }
  return indices;
}

function wrapAngleRad(value: number): number {
  let out = value;
  while (out > Math.PI) out -= 2 * Math.PI;
  while (out < -Math.PI) out += 2 * Math.PI;
  return out;
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
