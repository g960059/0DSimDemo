import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyAtrialAVPlaneWorkConjugateReviewVariantV1,
  ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1,
  runAtrialAVPlaneWorkConjugateReviewBenchV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneWorkConjugateReviewBench";
import { buildLeftHeartDynamicReserveVariantEnvelopeV1 } from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { runLeftHeartSubsystemV2, type LeftHeartSubsystemSampleV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/atrial-av-plane-work-conjugate-review.svg",
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

const report = runAtrialAVPlaneWorkConjugateReviewBenchV1();
const rawVariant = ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.find((variant) =>
  variant.variantId === "raw-velocity-traction12-flow10-cap20"
)!;
const finiteVariant = ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.find((variant) =>
  variant.variantId === report.summary.bestFiniteDriveVariantId
)!;
const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08");
const panels = profileIds.map((profileId, index) => {
  const raw = runLeftHeartSubsystemV2(
    applyAtrialAVPlaneWorkConjugateReviewVariantV1(baseParams[index]!, rawVariant),
  );
  const finite = runLeftHeartSubsystemV2(
    applyAtrialAVPlaneWorkConjugateReviewVariantV1(baseParams[index]!, finiteVariant),
  );
  return { profileId, raw: raw.finalBeatSamples, finite: finite.finalBeatSamples };
});

const width = 1120;
const panelWidth = 495;
const panelHeight = 240;
const marginX = 52;
const marginY = 100;
const gapX = 36;
const gapY = 24;
const height = marginY + 4 * panelHeight + 3 * gapY + 54;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Atrial AV-plane work-conjugate review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Raw velocity traction keeps topology but has pressure steps; finite pressure-drive smoothing reduces steps but loses source/topology.</text>`);
svg.push(`<line x1="34" y1="78" x2="76" y2="78" stroke="#22c55e" stroke-width="3"/>`);
svg.push(`<text x="84" y="82" fill="#22c55e" font-family="Inter,Arial,sans-serif" font-size="13">raw velocity traction</text>`);
svg.push(`<line x1="240" y1="78" x2="282" y2="78" stroke="#f97316" stroke-width="3"/>`);
svg.push(`<text x="290" y="82" fill="#f97316" font-family="Inter,Arial,sans-serif" font-size="13">${report.summary.bestFiniteDriveVariantId}</text>`);

for (let i = 0; i < panels.length; i++) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = marginX + col * (panelWidth + gapX);
  const y = marginY + row * (panelHeight + gapY);
  renderPanel(svg, x, y, panelWidth, panelHeight, panels[i]!.profileId, panels[i]!.raw, panels[i]!.finite);
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
  title: string,
  raw: readonly LeftHeartSubsystemSampleV2[],
  finite: readonly LeftHeartSubsystemSampleV2[],
): void {
  const pad = 40;
  const plotW = (w - 3 * pad) / 2;
  const plotH = h - 2 * pad;
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 18}" y="${y + 28}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${title}</text>`);
  renderPv(out, x + pad, y + pad, plotW, plotH, raw, finite);
  renderTrace(out, x + 2 * pad + plotW, y + pad, plotW, plotH, raw, finite);
}

function renderPv(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  finite: readonly LeftHeartSubsystemSampleV2[],
): void {
  const xs = [...raw, ...finite].map((sample) => sample.acceptedLaVolumeMl);
  const ps = [...raw, ...finite].map((sample) => sample.lapMmHg);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minP = Math.min(...ps);
  const maxP = Math.max(...ps);
  const sx = (value: number) => x + (value - minX) / Math.max(maxX - minX, 1e-9) * w;
  const sy = (value: number) => y + h - (value - minP) / Math.max(maxP - minP, 1e-9) * h;
  out.push(`<text x="${x}" y="${y - 8}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="10">LA PV</text>`);
  out.push(`<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="#334155"/>`);
  out.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#334155"/>`);
  out.push(`<path d="${pathForPv(raw, sx, sy)}" fill="none" stroke="#22c55e" stroke-width="2.5" opacity="0.9"/>`);
  out.push(`<path d="${pathForPv(finite, sx, sy)}" fill="none" stroke="#f97316" stroke-width="2.5" opacity="0.9"/>`);
}

function renderTrace(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  finite: readonly LeftHeartSubsystemSampleV2[],
): void {
  const values = [...raw, ...finite].map((sample) => sample.laAVPlaneReservoirTractionPressureMmHg);
  const maxV = Math.max(1, ...values);
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - value / maxV * h;
  out.push(`<text x="${x}" y="${y - 8}" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="10">traction pressure vs theta</text>`);
  out.push(`<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="#334155"/>`);
  out.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#334155"/>`);
  out.push(`<path d="${pathForTrace(raw, sx, sy)}" fill="none" stroke="#22c55e" stroke-width="2.5" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(finite, sx, sy)}" fill="none" stroke="#f97316" stroke-width="2.5" opacity="0.9"/>`);
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
): string {
  return samples
    .map((sample, index) =>
      `${index === 0 ? "M" : "L"}${sx(sample.theta).toFixed(1)},${sy(sample.laAVPlaneReservoirTractionPressureMmHg).toFixed(1)}`
    )
    .join(" ");
}
