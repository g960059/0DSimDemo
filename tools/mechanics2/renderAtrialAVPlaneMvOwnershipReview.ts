import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATRIAL_AV_PLANE_MV_OWNERSHIP_VARIANTS_V1,
  runAtrialAVPlaneMvOwnershipReviewBenchV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneMvOwnershipReviewBench";
import {
  applyVelocityStatefulTractionVariantV1,
  ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneVelocityStatefulTractionReviewBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/atrial-av-plane-mv-ownership-review.svg",
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

const report = runAtrialAVPlaneMvOwnershipReviewBenchV1();
const rawTractionVariant = ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1.find((variantConfig) =>
  variantConfig.variantId === "raw-velocity-traction12-flow10-cap20"
)!;
const bestMvVariant = ATRIAL_AV_PLANE_MV_OWNERSHIP_VARIANTS_V1.find((variantConfig) =>
  variantConfig.variantId === report.summary.bestMvOwnershipVariantId
)!;
const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08");
const panels = profileIds.map((profileId, index) => {
  const rawParams = applyVelocityStatefulTractionVariantV1(baseParams[index]!, rawTractionVariant);
  const raw = runLeftHeartSubsystemV2(rawParams);
  const best = runLeftHeartSubsystemV2(applyMvOwnershipVariantForRender(rawParams, bestMvVariant));
  return { profileId, raw: raw.finalBeatSamples, best: best.finalBeatSamples };
});

const width = 1260;
const panelWidth = 570;
const panelHeight = 270;
const marginX = 46;
const marginY = 114;
const gapX = 34;
const gapY = 26;
const height = marginY + 4 * panelHeight + 3 * gapY + 54;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Atrial AV-plane MV ownership review</text>`);
svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Raw AV-plane traction lead is held fixed while MV valve pressure-flow/opening ownership is varied.</text>`);
svg.push(`<text x="34" y="82" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="12">best MV variant: ${report.summary.bestMvOwnershipVariantId}, source ${report.summary.bestMvOwnershipSourceSurfacePass}/7, topology ${report.summary.bestMvOwnershipTopologyPass}/7, MVF ${report.summary.bestMvOwnershipMvfCleanCount}/7</text>`);
svg.push(`<line x1="858" y1="58" x2="900" y2="58" stroke="#22c55e" stroke-width="3"/>`);
svg.push(`<text x="908" y="62" fill="#22c55e" font-family="Inter,Arial,sans-serif" font-size="13">raw traction reference</text>`);
svg.push(`<line x1="858" y1="80" x2="900" y2="80" stroke="#f97316" stroke-width="3"/>`);
svg.push(`<text x="908" y="84" fill="#f97316" font-family="Inter,Arial,sans-serif" font-size="13">best MV ownership</text>`);

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

function applyMvOwnershipVariantForRender(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: typeof ATRIAL_AV_PLANE_MV_OWNERSHIP_VARIANTS_V1[number],
): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    mv: {
      ...params.mv,
      ...variantConfig.mv,
    },
    mvSystolicClosureDriveGain01:
      variantConfig.mvSystolicClosureDriveGain01 ?? params.mvSystolicClosureDriveGain01,
    mvSystolicClosureDriveStartTheta:
      variantConfig.mvSystolicClosureDriveStartTheta ?? params.mvSystolicClosureDriveStartTheta,
    mvSystolicClosureDriveEndTheta:
      variantConfig.mvSystolicClosureDriveEndTheta ?? params.mvSystolicClosureDriveEndTheta,
  };
}

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
  const padX = 36;
  const padTop = 44;
  const plotW = (w - 4 * padX) / 3;
  const plotH = h - 74;
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 16}" y="${y + 27}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="700">${panel.profileId}</text>`);
  renderPv(out, x + padX, y + padTop, plotW, plotH, panel.raw, panel.best);
  renderFlow(out, x + 2 * padX + plotW, y + padTop, plotW, plotH, panel.raw, panel.best);
  renderOpen(out, x + 3 * padX + 2 * plotW, y + padTop, plotW, plotH, panel.raw, panel.best);
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
  out.push(`<path d="${pathForPv(raw, sx, sy)}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForPv(best, sx, sy)}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
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

function renderOpen(
  out: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  raw: readonly LeftHeartSubsystemSampleV2[],
  best: readonly LeftHeartSubsystemSampleV2[],
): void {
  const sx = (theta: number) => x + theta * w;
  const sy = (value: number) => y + h - value * h;
  axis(out, x, y, w, h, "MV open01");
  out.push(`<path d="${pathForTrace(raw, sx, sy, "mvOpen01")}" fill="none" stroke="#22c55e" stroke-width="2.4" opacity="0.9"/>`);
  out.push(`<path d="${pathForTrace(best, sx, sy, "mvOpen01")}" fill="none" stroke="#f97316" stroke-width="2.4" opacity="0.9"/>`);
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
  key: "qMvMlPerSec" | "mvOpen01",
): string {
  return samples
    .map((sample, index) =>
      `${index === 0 ? "M" : "L"}${sx(sample.theta).toFixed(1)},${sy(sample[key]).toFixed(1)}`
    )
    .join(" ");
}
